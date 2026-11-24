#!/usr/bin/env node
// node tools/figma-audit/test-check-services.mjs — the dashboards gate judges what is running, fed a list in
// place of the process table: on a machine with no services it passes on nothing, so its healthy and its
// unhealthy answers are only ever seen here. Pure: no process is listed, no project read.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { judge, heal } from './check-services.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };

const A = '/x/alpha/figma-design-system/audit', B = '/x/beta/figma-design-system/audit';
const wanted = new Map([[A, 'alpha'], [B, 'beta']]);
const newest = { f: '/t/tools/figma-audit/server.mjs', mtime: new Date('2026-10-01T10:00:00Z') };
const after = new Date('2026-10-01T12:00:00Z'), before = new Date('2026-10-01T08:00:00Z');

const healthy = judge([{ data: A, port: '9231', started: after }, { data: B, port: '9232', started: after }], wanted, newest);
ok('services on each project\'s audit folder, started after the source: healthy', healthy.bad.length === 0 && healthy.seen.size === 2);

const none = judge([], wanted, newest);
ok('none running is not a failure', none.bad.length === 0 && none.found.length === 0);

// the supervisor carries every child's pair as well: one service, one line
const twice = judge([{ data: A, port: '9231', started: after }, { data: A, port: '9231', started: after }], wanted, newest);
ok('the supervisor\'s copy of a pair is one service', twice.found.length === 1 && twice.bad.length === 0);

const stale = judge([{ data: A, port: '9231', started: before }], wanted, newest);
ok('a process older than the file it binds is stale, named with its file', stale.bad.length === 1 && /alpha \(port 9231\).*server\.mjs changed.*kickstart/.test(stale.bad[0]));

const record = judge([{ data: A + '/abc123.json', port: '9231', started: after }], wanted, newest);
ok('--data pinned to a record inside the audit folder points at the folder', record.bad.length === 1 && record.bad[0].includes(`point --data at ${A}`));

const stranger = judge([{ data: '/elsewhere/audit', port: null, started: after }], wanted, newest);
ok('a path no project claims is a failure', stranger.bad.length === 1 && /port \? serves \/elsewhere\/audit, which no project claims/.test(stranger.bad[0]));

const mixed = judge([{ data: A, port: '9231', started: after }, { data: '/elsewhere/audit', port: '9', started: after }], wanted, newest);
ok('one bad service among good ones fails', mixed.bad.length === 1 && mixed.seen.has('alpha'));

const undated = judge([{ data: A, port: '9231', started: new Date('not a date') }], wanted, newest);
ok('a start time ps did not give is not read as stale', undated.bad.length === 0);

// a stale service is asked to restart before it is judged (2026-11-24: stale dashboards failed a land that had nothing
// to do with them); a failure stays only when the restart does not happen: a plugin held, unsupervised, unasked, or not back
{
  const svc = (data, port) => ({ r: { data, port, started: before }, label: data, msg: `${data} runs the old file` });
  const asked = [];
  const answers = { a: { stale: true, supervised: true, plugin: false }, b: { stale: true, supervised: true, plugin: true }, c: { stale: true, supervised: false, plugin: false }, e: { stale: true, supervised: true, plugin: false } };
  const ask = async (r) => { asked.push(r.port); if (r.port === 'd') throw new Error('not_found'); return answers[r.port]; };
  // a comes back on the new files; e never does
  const list = () => [{ data: 'A', port: 'a', started: after }, { data: 'E', port: 'e', started: before }];
  const left = await heal([svc('A', 'a'), svc('B', 'b'), svc('C', 'c'), svc('D', 'd'), svc('E', 'e')], { ask, list, newest, timeout: 50, poll: 5 });
  ok('an idle stale service asked to restart and back on the new files is no failure', !left.some((l) => l.startsWith('A ')) && asked.includes('a'));
  ok('one holding a plugin stays a failure, said so', left.some((l) => /^B .*plugin is connected/.test(l)));
  ok('one nothing supervises stays a failure, said so', left.some((l) => /^C .*nothing supervises/.test(l)));
  ok('one that cannot be asked (an older service with no such route) stays a failure, with the reason', left.some((l) => /^D .*could not be asked.*not_found/.test(l)));
  ok('one asked that is not back on the new files in time stays a failure', left.some((l) => /^E .*not back/.test(l)));
  ok('nothing else is a failure', left.length === 4);
}

// running()'s reading of the process list: a figma-audit server.mjs run with --data is a service, of any checkout, known
// by its --data; which checkout it runs is asked of it (call, below), never guessed from a path
{
  const { parse } = await import('./services.mjs');
  const server = fileURLToPath(new URL('./server.mjs', import.meta.url));
  let pid = 100;
  const at0 = 'Sun Nov  1 01:49:22 2026     ';
  const lines = [];
  const L = (rest) => lines.push(`${String(++pid).padStart(5)} ${at0}${rest}`);
  const tmp = '/tmp/x-tests';
  const toolkit = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
  L(`/usr/bin/node ${server} --data /home/p/alpha/figma-design-system/audit --port 9231`);   // 101
  L(`/usr/bin/node ${server} --data ${tmp}/audit-socket-1/audit --port 9223`);              // 102
  L(`/usr/bin/figma-audit ${server} --all`);
  L(`/bin/zsh -c node tools/figma-audit/check-services.mjs; echo "point --data at server.mjs"`);
  L(`vim /x/server.mjs --data /home/p/beta/audit`);
  L(`/usr/bin/node /elsewhere/tools/figma-audit/server.mjs --data /home/p/gamma/audit --port 9229`);
  L(`node tools/figma-audit/server.mjs --data audit --port 9226`);                          // 107: from the toolkit's folder
  L(`/usr/bin/node --watch ${server} --data /home/p/delta/audit --port 9227`);              // 108
  L(`node tools/figma-audit/server.mjs --data /home/p/eps/audit --port 9225`);              // 109: folder unreadable
  L(`node figma-audit/server.mjs --data /home/p/zeta/audit --port 9224`);                   // 110: from tools/, unreadable
  L(`/bin/zsh -c source /x/snap && eval 'node tools/figma-audit/server.mjs --data ../p/audit' < /dev/null`); // 111: a tool call's shell
  L(`/bin/bash -lc node tools/figma-audit/server.mjs --data ../q/audit`);
  L(`/usr/bin/env bash -c node tools/figma-audit/server.mjs --data ../q/audit`);
  L(`-zsh -c node tools/figma-audit/server.mjs --data ../q/audit`);
  L(`/usr/bin/node -r dotenv/config --env-file .env ${server} --data /home/p/iota/audit --port 9222`); // 115
  L(`/usr/bin/node -e import('/x/tools/figma-audit/server.mjs') /x/tools/figma-audit/server.mjs --data /home/p/lambda/audit --port 9221`); // 116
  L(`node --print 1 /x/tools/figma-audit/server.mjs --data /home/p/mu/audit --port 9220`);  // 117
  L(`node tools/figma-audit/server.mjs --data audit --port 9219`);                          // 118: folder unreadable, --data relative
  const cwds = { 107: '/home/p/kappa', 101: '/', 108: '/' };
  const asked = [];
  const found = parse(lines.join('\n'), { server, tmp, cwd: (p) => { asked.push(p); return p === '107' ? toolkit : cwds[p] || null; } });
  const by = (d) => found.find((f) => f.data === d);
  ok('this toolkit\'s server.mjs with --data is a service, with its port and start', by('/home/p/alpha/figma-design-system/audit')?.port === '9231' && found[0].started.getFullYear() === 2026 && !found[0].test);
  ok('a shell or an editor whose line names server.mjs and --data is not one', !found.some((f) => /beta|^\/x|\bat$/.test(f.data)));
  ok('another checkout\'s server is a service, known by its --data, its script kept to say which', by('/home/p/gamma/audit')?.server === '/elsewhere/tools/figma-audit/server.mjs' && by('/home/p/alpha/figma-design-system/audit')?.server === server);
  ok('a `node -e` or `--print` whose code names server.mjs and --data is not a service', !by('/home/p/lambda/audit') && !by('/home/p/mu/audit'));
  ok('a relative --data whose process\'s folder cannot be read is no service, never read against this one\'s folder', !found.some((f) => f.port === '9219'));
  ok('a service whose --data is in the temp folder is a test\'s, and says so', by(`${tmp}/audit-socket-1/audit`)?.test === true);
  ok('started by a relative path, it is read against its own folder, and so is a relative --data', by(`${toolkit}/audit`)?.port === '9226');
  ok('`node --watch server.mjs`: the script is the first argument that is not a flag', by('/home/p/delta/audit')?.port === '9227');
  ok('its folder unreadable, a relative tools/figma-audit/server.mjs is still this one; a shorter path is not', by('/home/p/eps/audit')?.port === '9225' && !by('/home/p/zeta/audit'));
  ok("a shell running a command line that starts the server is not a service (`-c`, `-lc`, `env bash -c`, `-zsh -c`)", !found.some((f) => /[pq]\/audit'?$/.test(f.data) && !f.data.startsWith('/home')));
  ok('a node flag with its value (`-r dotenv/config`, `--env-file .env`) is passed over, not taken for the script', by('/home/p/iota/audit')?.port === '9222');
  ok('the folder is asked only of a process given a relative path', !asked.includes('101') && !asked.includes('108') && asked.includes('107'));
}

// run as a script, it prints a verdict and exits 0 or 1, never crashes (main guard intact)
const script = fileURLToPath(new URL('./check-services.mjs', import.meta.url));
let out = '', code = 0;
try { out = execFileSync(process.execPath, [script], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: '/nonexistent-projects-root' } }); } // projects-path: none, on purpose
catch (e) { out = String(e.stdout); code = e.status; }
ok('as a script it gives one verdict', /^dashboards: /.test(out) && (code === 0 || code === 1));

// two services on one folder, the main checkout's and a worktree's: each caller is given its own checkout's, else one
// whose script could not be read, else another's (which call() then refuses, naming both)
{
  const { pick } = await import('./services.mjs');
  const mine = fileURLToPath(new URL('./server.mjs', import.meta.url));
  const A = '/home/p/alpha/audit';
  const theirs = { data: A, port: '1', server: '/elsewhere/tools/figma-audit/server.mjs' }, ours = { data: A, port: '2', server: mine }, unread = { data: A, port: '3', server: null };
  ok('of two services on one folder, the one this checkout runs is taken, whichever is listed first',
    pick([theirs, ours], A) === ours && pick([theirs, unread], A) === unread && pick([theirs], A) === theirs && pick([theirs], '/none') === null);
}

// a service is asked which checkout it runs before anything else is asked of it: another checkout's, or one serving
// another folder on that port, is refused naming both; one that cannot say (older than the route) is refused too
{
  const http = await import('node:http');
  const { call } = await import('./services.mjs');
  const toolkit = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '');
  let says = null;
  const asked = [];
  const stand = http.createServer((req, res) => { asked.push(req.url); res.setHeader('Content-Type', 'application/json');
    if (req.url === '/checkout') { if (!says) { res.writeHead(404); return res.end('not found'); } return res.end(JSON.stringify(says)); }
    res.end(JSON.stringify({ ok: 1 })); });
  await new Promise((r) => stand.listen(0, '127.0.0.1', r));
  const port = stand.address().port;
  try {
    says = { root: toolkit, data: '/home/p/alpha/audit' };
    const fine = await call({ port, data: '/home/p/alpha/audit' }, '/status').catch((e) => e);
    ok('a service of this checkout serving the folder asked for answers', fine && fine.ok === 1 && asked.join() === '/checkout,/status');
    // (each case its own folder: a service vouched for is asked once per port and folder in a run)
    says = { root: '/elsewhere/toolkit', data: '/home/p/beta/audit' };
    asked.length = 0;
    const other = await call({ port, data: '/home/p/beta/audit' }, '/status').then(() => null, (e) => e.message);
    ok('a service of another checkout is refused, naming both checkouts, and is asked nothing else', other && other.includes('/elsewhere/toolkit') && other.includes(toolkit) && !asked.includes('/status'));
    says = { root: toolkit, data: '/home/p/other/audit' };
    const folder = await call({ port, data: '/home/p/gamma/audit' }, '/status').then(() => null, (e) => e.message);
    ok('a service serving another folder on that port is refused, naming both folders', folder && folder.includes('/home/p/other/audit') && folder.includes('/home/p/gamma/audit'));
    says = null;
    const old = await call({ port, data: '/home/p/delta/audit' }, '/status').then(() => null, (e) => e.message);
    ok('a service that cannot say its checkout is refused, saying to restart it', old && /checkout/.test(old) && /restart/.test(old));
  } finally { stand.close(); }
}

// end to end: a test's server, its --data in the temp folder, running beside the check does not turn it red
{
  const { freePort } = await import('../shared/free-port.mjs');
  const { spawn } = await import('node:child_process');
  const fs = await import('node:fs'), os = await import('node:os'), path = await import('node:path');
  const port = await freePort([9226, 9227, 9229, 9225, 9224]);
  if (!port) console.log('skip: no port of the bridge range free, so a test server is not started beside the check');
  else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'check-services-'));
    fs.mkdirSync(path.join(dir, 'audit'));
    // started as the README starts it, by a path relative to the toolkit's folder
    const srv = spawn(process.execPath, ['tools/figma-audit/server.mjs', '--data', path.join(dir, 'audit'), '--port', String(port), '--key-file', path.join(dir, 'no-key')],
      { cwd: fileURLToPath(new URL('../..', import.meta.url)), stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ANTHROPIC_API_KEY: '', TOOLKIT_PROJECTS_ROOT: path.join(dir, 'none') } }); // projects-path: none
    try {
      let log = '';
      srv.stdout.on('data', (d) => { log += d; }); srv.stderr.on('data', (d) => { log += d; });
      for (let i = 0; i < 80 && !log.includes('figma audit'); i++) await new Promise((r) => setTimeout(r, 100));
      let out = '';
      try { out = execFileSync(process.execPath, [script], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: path.join(dir, 'none') } }); } catch (e) { out = String(e.stdout); }
      const { running } = await import('./services.mjs');
      ok('running() finds the test server, started by a relative path, and marks it a test\'s', running().some((r) => r.test && r.data.startsWith(dir) && r.port === String(port)));
      ok('a test server running beside the check is not a dashboard it fails on', log.includes('figma audit') && !out.includes(dir) && /^dashboards: /.test(out));
      const { call } = await import('./services.mjs');
      const a = await call({ port }, '/restart-when-idle', {});
      ok('a service asked to restart when idle answers stale, supervised and plugin; fresh and run by hand, it keeps serving', a.stale === false && a.supervised === false && a.plugin === false && !log.includes('changed since'));
    } finally { srv.kill(); fs.rmSync(dir, { recursive: true, force: true }); }
  }
}

// the files a dashboard restarts on, and check-services judges by, reach every module server.mjs names (bound.mjs):
// one loaded by a built path is named as an entry, or an edit to it is never served (the review of 943b1545)
{
  const { readFileSync } = await import('node:fs');
  const { basename, dirname } = await import('node:path');
  const { boundBy } = await import('./bound.mjs');
  const { importClosure } = await import('../shared/import-closure.mjs');
  const here = dirname(fileURLToPath(import.meta.url));
  const reached = new Set(importClosure(boundBy(here)).map((f) => basename(f)));
  // build.mjs is the docs build, run as its own process: nothing of it is bound here
  const named = [...readFileSync(`${here}/server.mjs`, 'utf8').matchAll(/["'](?:[\w./-]*\/)?([\w-]+\.(?:mjs|cjs))["']/g)].map((m) => m[1]).filter((f) => f !== 'build.mjs');
  const missing = [...new Set(named)].filter((f) => !reached.has(f));
  ok(`every module server.mjs names is in what it restarts on${missing.length ? ` (missing: ${missing.join(', ')})` : ''}`, named.length > 10 && !missing.length);
}

console.log(`${n}/${n} passed`);
