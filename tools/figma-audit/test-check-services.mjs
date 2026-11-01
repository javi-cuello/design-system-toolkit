#!/usr/bin/env node
// node tools/figma-audit/test-check-services.mjs — the dashboards gate judges what is running, fed a list in
// place of the process table: on a machine with no services it passes on nothing, so its healthy and its
// unhealthy answers are only ever seen here. Pure: no process is listed, no project read.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { judge } from './check-services.mjs';

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

// running()'s reading of the process list: only this toolkit's server.mjs run with --data is a service
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
  const cwds = { 107: '/home/p/kappa', 101: '/', 108: '/' };
  const asked = [];
  const found = parse(lines.join('\n'), { server, tmp, cwd: (p) => { asked.push(p); return p === '107' ? toolkit : cwds[p] || null; } });
  const by = (d) => found.find((f) => f.data === d);
  ok('this toolkit\'s server.mjs with --data is a service, with its port and start', by('/home/p/alpha/figma-design-system/audit')?.port === '9231' && found[0].started.getFullYear() === 2026 && !found[0].test);
  ok('a shell or an editor whose line names server.mjs and --data is not one, nor another checkout\'s server', !found.some((f) => /beta|gamma|^\/x|\bat$/.test(f.data)));
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
    } finally { srv.kill(); fs.rmSync(dir, { recursive: true, force: true }); }
  }
}

console.log(`${n}/${n} passed`);
