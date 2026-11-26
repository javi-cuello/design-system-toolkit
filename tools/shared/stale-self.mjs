/*
 * A long-running service restarts itself once a file it bound is newer than the process: an ES module is
 * bound for the life of a process (clearing require.cache reloads no .mjs), so the snapshot router derived with
 * 19 November's rules.mjs and seven dashboards ran an old one for hours after a change landed (2026-11-22).
 *
 * Only when idle: no request, plugin call, build or upload in progress (the caller's `busy`, and what hold() and
 * held() count), however long that takes; a busy service keeps serving the old code rather than cut its work.
 * Only when supervised: launchd under the caller's own label, or a parent over an IPC channel, brings it back
 * with the files on disk; a copy run by hand says it is stale and keeps serving. Tested by test-stale-self.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { importClosure } from './import-closure.mjs';

let open = 0;
// a piece of work the service must not be cut out of: call what it returns when the work ends
export function hold() { open++; let over = false; return () => { if (!over) { over = true; open--; } }; }
// a request handler whose returned promise is work until it settles
export const held = (fn) => function (...a) {
  const release = hold();
  let out;
  try { out = fn.apply(this, a); } catch (e) { release(); throw e; }
  Promise.resolve(out).then(release, release);
  return out;
};

// asked when it would restart: a parent still there on its channel, or launchd itself (pid 1) under the caller's own
// label; a label inherited by something launchd's job started, or a parent that died, supervises nothing
const supervisedBy = (label) => () => (typeof process.send === 'function' && process.connected) || (!!label && process.env.XPC_SERVICE_NAME === label && process.ppid === 1);

export function restartWhenStale(entries, { servers = [], busy = () => false, onStale = null, label = null,
  supervised = supervisedBy(label), start = performance.timeOrigin, every = 60000, idleEvery = 1000, giveUp = 30000,
  log = console.log, exit = (c) => process.exit(c) } = {}) {
  // the sockets a server hands over on upgrade are not its connections any more: close() would wait on them forever
  const sockets = new Set();
  for (const s of servers) if (s.on) s.on('upgrade', (req, socket) => { sockets.add(socket); if (socket.on) socket.on('close', () => sockets.delete(socket)); });
  const handle = { timer: null };
  let changed = null;
  const idle = () => open === 0 && !busy();
  // work that began while the servers closed (a build a timer started) is let finish: nothing new can arrive
  const done = () => (idle() ? exit(0) : setTimeout(done, idleEvery));
  const stop = () => {
    for (const s of sockets) s.destroy();
    if (!servers.length) return done();
    let left = servers.length, over = false;
    const closed = () => { if (!over && --left === 0) { over = true; done(); } };
    for (const s of servers) { s.close(closed); if (s.closeIdleConnections) s.closeIdleConnections(); }
    // nothing was in progress, so a connection that still holds close() open (a client keeping one alive) is ended
    const late = setTimeout(() => { if (over) return; over = true; for (const s of servers) if (s.closeAllConnections) s.closeAllConnections(); done(); }, giveUp);
    if (late.unref) late.unref();
  };
  const sup = () => (typeof supervised === 'function' ? supervised() : supervised);
  const look = () => {
    if (changed) return changed;
    const now = Date.now();
    // (newer than the process and not dated ahead of the clock: a file from the future would restart it forever)
    return (changed = importClosure(entries).find((f) => { try { const m = fs.statSync(f).mtimeMs; return m > start && m <= now; } catch { return false; } }) || null);
  };
  let said = false, stopping = false;
  const tick = () => {
    if (look() && !said) {
      said = true;
      if (!sup()) return log(`${path.basename(changed)} changed since this process started, so it runs the old file: restart it (nothing supervises this copy to bring it back)`);
      log(`${path.basename(changed)} changed since this process started: restarting once nothing is in progress`); if (onStale) onStale();
    }
    if (changed && idle()) { if (!stopping) { stopping = true; stop(); } return; }
    handle.timer = setTimeout(tick, changed ? idleEvery : every);
    if (handle.timer.unref) handle.timer.unref();
  };
  // asked from outside (the dashboards check, through a service's route): look now, not at the next minute's look, and
  // restart once idle; the asking request is let settle first (a turn of the loop), as it counts as work
  handle.now = () => {
    const stale = !!look(), supervisedNow = !!sup();
    if (stale && supervisedNow && !stopping) { clearTimeout(handle.timer); handle.timer = setTimeout(tick, 0); if (handle.timer.unref) handle.timer.unref(); }
    return { stale, supervised: supervisedNow };
  };
  // whether something would bring it back, read without looking or restarting (a service's /status: check-services' judge)
  handle.supervised = () => !!sup();
  // a parent that is itself stale asks whether its children are idle before it stops them (askIdle below)
  if (typeof process.send === 'function') process.on('message', (m) => { if (m && m.idleAsked) try { process.send({ idleSaid: m.idleAsked, idle: idle() }); } catch {} });
  handle.timer = setTimeout(tick, every);
  if (handle.timer.unref) handle.timer.unref();
  return handle;
}

/*
 * For a parent supervising forked children (the dashboards' --all): its own `busy`, true until every child has
 * said, in answer to the latest ask, that nothing is in progress. Each call asks again; a child forked since, or
 * one that has not answered, counts as busy. A stale parent then stops idle children and restarts, launchd
 * bringing back the whole service; a child with work or a plugin keeps it waiting, the others serving meanwhile.
 */
export function askIdle(kids) {
  let asked = 0;
  const said = new Map(); // child → the ask it last answered idle
  return () => {
    const all = [...kids];
    if (!all.length) return false;
    const ready = all.length > 0 && all.every((c) => said.get(c) === asked);
    asked++;
    for (const c of all) {
      if (!c.__idleHeard) {
        c.__idleHeard = true;
        c.on('message', (m) => { if (m && m.idleSaid) { if (m.idle) said.set(c, m.idleSaid); else said.delete(c); } });
        // a send to a child whose channel closed before its exit is an 'error' event, not a throw: unheard it crashes the parent
        c.on('error', () => {});
      }
      if (c.connected === false) continue;
      try { c.send({ idleAsked: asked }); } catch {}
    }
    return !ready;
  };
}
