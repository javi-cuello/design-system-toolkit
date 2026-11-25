// supervisor.mjs with fake children in a temp folder: a crashing child comes back with a growing wait, one that
// ran past `steady` comes back at once, each exit is logged and its output kept, and the review runs once per day.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { supervise, nextAt } from './supervisor.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'supervisor-'));
const until = async (ok, ms = 5000) => { const end = Date.now() + ms; while (!ok()) { if (Date.now() > end) throw new Error('timed out'); await new Promise((r) => setTimeout(r, 10)); } };
const script = (dir, name, body) => { const f = path.join(dir, name); fs.writeFileSync(f, body); return f; };

test('nextAt is the next 03:00, today or tomorrow', () => {
  assert.equal(nextAt(new Date(2026, 0, 5, 2, 59), 3).getTime(), new Date(2026, 0, 5, 3, 0).getTime());
  assert.equal(nextAt(new Date(2026, 0, 5, 3, 0), 3).getTime(), new Date(2026, 0, 6, 3, 0).getTime());
});

test('a child that keeps crashing comes back, each wait twice the last up to the most; its output is kept', async () => {
  const dir = tmp(), said = [];
  const crash = script(dir, 'crash.mjs', "console.error('crashed'); process.exit(1);\n");
  const s = supervise({ logs: dir, children: [{ name: 'crash', script: crash }], wait: 20, most: 80, steady: 10000, log: (m) => said.push(m) });
  await until(() => said.length >= 4);
  s.stop();
  assert.deepEqual(said.slice(0, 4), ['0.02', '0.04', '0.08', '0.08'].map((d) => `crash exited (1); starting it again in ${d} s`));
  assert.match(fs.readFileSync(path.join(dir, 'crash.err'), 'utf8'), /^crashed\ncrashed\n/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a child that ran past steady comes back after the first wait; one that stays up is left alone and stopped', async () => {
  const dir = tmp(), said = [];
  const late = script(dir, 'late.mjs', 'setTimeout(() => process.exit(0), 60);\n');
  const stay = script(dir, 'stay.mjs', "process.on('message', () => {}); setInterval(() => {}, 1000);\n");
  const s = supervise({ logs: dir, children: [{ name: 'late', script: late }, { name: 'stay', script: stay }], wait: 20, most: 80, steady: 30, log: (m) => said.push(m) });
  await until(() => said.length >= 3);
  assert.deepEqual(new Set(said.slice(0, 3)), new Set(['late exited (0); starting it again in 0.02 s']));
  const kids = [...s.kids];
  s.stop();
  await until(() => kids.every((k) => k.exitCode !== null || k.signalCode !== null));
  assert.ok(!said.some((m) => m.startsWith('stay')), said.join('\n'));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a supervisor started after 03:00 runs that day\'s review at once, and not again that day', async () => {
  const dir = tmp(), said = [];
  const review = script(dir, 'review.mjs', '');
  let clock = new Date(2026, 0, 5, 9, 0);
  const s = supervise({ logs: dir, children: [], review: [process.execPath, review], every: 10, now: () => clock, log: (m) => said.push(m) });
  await until(() => said.includes('review: exited (0)'));
  clock = new Date(2026, 0, 5, 23, 0);
  await new Promise((r) => setTimeout(r, 50));
  s.stop();
  assert.equal(said.filter((m) => m === 'review: started').length, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a missing review is logged, not fatal', async () => {
  const dir = tmp(), said = [];
  const s = supervise({ logs: path.join(dir, 'new-logs'), children: [], review: [path.join(dir, 'no-such-review')], every: 10, log: (m) => said.push(m) });
  await until(() => said.some((m) => /^review: .*ENOENT/.test(m)));
  s.stop();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('install.sh: the review stays off over two runs without REVIEW, on once asked, and the old agents go', { skip: process.platform !== 'darwin' }, () => {
  const dir = tmp(), repo = path.join(dir, 'repo'), home = path.join(dir, 'home'), fake = path.join(dir, 'fake');
  for (const d of ['skills/one', 'tools/service', 'tools/snapshot', 'home/Library/LaunchAgents', 'fake']) fs.mkdirSync(path.join(dir, d.startsWith('home') || d === 'fake' ? '' : 'repo', d), { recursive: true });
  fs.copyFileSync(path.join(HERE, '..', '..', 'install.sh'), path.join(repo, 'install.sh'));
  fs.copyFileSync(path.join(HERE, 'com.toolkit.plist'), path.join(repo, 'tools/service/com.toolkit.plist'));
  fs.writeFileSync(path.join(repo, 'tools/snapshot/pairing.cjs'), '');
  execFileSync('git', ['init', '-q', repo]);
  // launchctl records each call and fails, as for an agent not loaded: nothing reaches the real launchd
  fs.writeFileSync(path.join(fake, 'launchctl'), `#!/bin/sh\necho "$@" >> ${JSON.stringify(path.join(dir, 'launchctl.log'))}\nexit 1\n`, { mode: 0o755 });
  const agents = path.join(home, 'Library/LaunchAgents');
  fs.writeFileSync(path.join(agents, 'com.toolkit.figma-audit.plist'), '');
  const install = (env = {}) => { execFileSync(path.join(repo, 'install.sh'), { env: { ...process.env, HOME: home, PATH: `${fake}:${process.env.PATH}`, SKIP_CHECKS: '1', REVIEW: '', ...env }, stdio: 'pipe' }); return fs.readFileSync(path.join(agents, 'com.toolkit.plist'), 'utf8'); };
  const on = (plist) => plist.includes('<string>--review</string>');
  assert.equal(on(install()), false, 'first run');
  assert.equal(on(install()), false, 'second run: the template\'s own words do not turn it on');
  assert.equal(on(install({ REVIEW: 'on' })), true, 'REVIEW=on');
  assert.equal(on(install()), true, 'kept on a later run');
  assert.ok(!fs.existsSync(path.join(agents, 'com.toolkit.figma-audit.plist')), 'an old agent is deleted');
  const calls = fs.readFileSync(path.join(dir, 'launchctl.log'), 'utf8');
  for (const old of ['figma-snapshot', 'figma-audit', 'review', 'maintain']) assert.match(calls, new RegExp(`bootout gui/\\d+/com\\.toolkit\\.${old}\n`), old);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('the review runs once when 03:00 passes, not again that day, and again the next', async () => {
  const dir = tmp(), said = [];
  const marks = path.join(dir, 'ran');
  const review = script(dir, 'review.mjs', `import fs from 'node:fs'; fs.appendFileSync(${JSON.stringify(marks)}, 'x');\n`);
  let clock = new Date(2026, 0, 5, 2, 59);
  const s = supervise({ logs: dir, children: [], review: [process.execPath, review, '--if-owed'], every: 10, now: () => clock, log: (m) => said.push(m) });
  const ran = () => (fs.existsSync(marks) ? fs.readFileSync(marks, 'utf8').length : 0);
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(ran(), 0, 'not before 03:00');
  clock = new Date(2026, 0, 5, 3, 1);
  await until(() => said.includes('review: exited (0)'));
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(ran(), 1, 'once that day');
  clock = new Date(2026, 0, 6, 3, 0);
  await until(() => ran() === 2);
  s.stop();
  fs.rmSync(dir, { recursive: true, force: true });
});
