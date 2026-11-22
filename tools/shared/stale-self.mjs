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

const supervisedBy = (label) => typeof process.send === 'function' || (!!label && process.env.XPC_SERVICE_NAME === label);

export function restartWhenStale(entries, { servers = [], busy = () => false, onStale = null, label = null,
  supervised = supervisedBy(label), start = performance.timeOrigin, every = 60000, idleEvery = 1000, giveUp = 30000,
  log = console.log, exit = (c) => process.exit(c) } = {}) {
  // the sockets a server hands over on upgrade are not its connections any more: close() would wait on them forever
  const sockets = new Set();
  for (const s of servers) if (s.on) s.on('upgrade', (req, socket) => { sockets.add(socket); if (socket.on) socket.on('close', () => sockets.delete(socket)); });
  const handle = { timer: null };
  let changed = null;
  const stop = () => {
    for (const s of sockets) s.destroy();
    if (!servers.length) return exit(0);
    let left = servers.length;
    for (const s of servers) { s.close(() => { if (--left === 0) exit(0); }); if (s.closeIdleConnections) s.closeIdleConnections(); }
    // nothing was in progress, so a connection that still holds close() open (a client keeping one alive) is ended
    const late = setTimeout(() => { for (const s of servers) if (s.closeAllConnections) s.closeAllConnections(); exit(0); }, giveUp);
    if (late.unref) late.unref();
  };
  const tick = () => {
    if (!changed) {
      const now = Date.now();
      // (newer than the process and not dated ahead of the clock: a file from the future would restart it forever)
      changed = importClosure(entries).find((f) => { try { const m = fs.statSync(f).mtimeMs; return m > start && m <= now; } catch { return false; } }) || null;
      if (changed && !supervised) return log(`${path.basename(changed)} changed since this process started, so it runs the old file: restart it (nothing supervises this copy to bring it back)`);
      if (changed) { log(`${path.basename(changed)} changed since this process started: restarting once nothing is in progress`); if (onStale) onStale(); }
    }
    if (changed && open === 0 && !busy()) return stop();
    handle.timer = setTimeout(tick, changed ? idleEvery : every);
    if (handle.timer.unref) handle.timer.unref();
  };
  // a parent that is itself stale asks its children to restart too: one it forked after the change would not see it
  if (typeof process.send === 'function') process.on('message', (m) => { if (m && m.restartWhenIdle && !changed) { changed = 'the parent'; log('the parent asked for a restart: restarting once nothing is in progress'); } });
  handle.timer = setTimeout(tick, every);
  if (handle.timer.unref) handle.timer.unref();
  return handle;
}
