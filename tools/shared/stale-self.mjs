/*
 * A long-running service restarts itself once a file it bound at start is newer than the process, after the
 * requests it is serving: an ES module is bound for the life of a process (clearing require.cache reloads no
 * .mjs), so the snapshot router derived with 19 November's rules.mjs and seven dashboards ran an old one for
 * hours after a change landed (2026-11-22). Each caller is brought back by what started it (launchd's KeepAlive,
 * the dashboards' parent), with the files on disk. Tested by test-stale-self.mjs.
 */
import fs from 'node:fs';
import path from 'node:path';
import { importClosure } from './import-closure.mjs';

export function restartWhenStale(entry, servers, { every = 60000, wait = 300000, log = console.log, exit = (c) => process.exit(c) } = {}) {
  const start = Date.now();
  const t = setInterval(() => {
    const changed = importClosure([entry]).find((f) => { try { return fs.statSync(f).mtimeMs > start; } catch { return false; } });
    if (!changed) return;
    clearInterval(t);
    log(`restarting: ${path.basename(changed)} changed since this process started, so it runs the old file; what started it starts it again`);
    let open = servers.length;
    const done = () => { if (--open <= 0) exit(0); };
    for (const s of servers) { s.close(done); if (s.closeIdleConnections) s.closeIdleConnections(); }
    // (a request that never ends, a socket left open, does not keep the old code running)
    const late = setTimeout(() => exit(0), wait); if (late.unref) late.unref();
    if (!servers.length) exit(0);
  }, every);
  if (t.unref) t.unref();
  return t;
}
