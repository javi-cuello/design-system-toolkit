// A service that outlives a change to a file it bound restarts itself, after its requests: stale-self.mjs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert';
const { restartWhenStale } = await import('./stale-self.mjs');
let n = 0;
const ok = (name, cond) => { assert.ok(cond, name); n++; console.log(`ok ${name}`); };
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stale-self-'));
const entry = path.join(dir, 'server.mjs'), dep = path.join(dir, 'rules.mjs');
fs.writeFileSync(entry, "import { x } from './rules.mjs';\n");
fs.writeFileSync(dep, 'export const x = 1;\n');
const past = new Date(Date.now() - 60000);
fs.utimesSync(entry, past, past); fs.utimesSync(dep, past, past);
const server = () => { const s = { closed: false, idle: false, close(cb) { s.closed = true; setTimeout(cb, 5); }, closeIdleConnections() { s.idle = true; } }; return s; };
const run = (touch) => new Promise((done) => {
  const a = server(), b = server(), said = [];
  const t = restartWhenStale(entry, [a, b], { every: 10, wait: 2000, log: (m) => said.push(m), exit: (code) => { clearInterval(t); done({ code, a, b, said }); } });
  if (touch) setTimeout(() => fs.utimesSync(dep, new Date(), new Date()), 20);
  else setTimeout(() => { clearInterval(t); done(null); }, 120);
});
ok('nothing bound has changed: it keeps serving', (await run(false)) === null);
const r = await run(true);
ok('a file it imports changed: every server closes, idle connections first, then it exits 0, saying which file', r && r.code === 0 && r.a.closed && r.b.closed && r.a.idle && /rules\.mjs/.test(r.said.join()));
fs.rmSync(dir, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
