#!/usr/bin/env node
// node tools/docs-site/test-build-lock.mjs — the engine's build lock (lock.mjs,
// held by build.mjs): a build longer than the stale limit keeps it, a dead one loses it.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, utimesSync, existsSync, readdirSync, writeFileSync, mkdirSync, copyFileSync, symlinkSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { take, hold } from './lock.mjs';

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const HERE = dirname(fileURLToPath(import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'docs-lock-'));
const LOCK = join(tmp, '.build.lock');

try {
  // Review of 30 October 2026: the lock's age was its making, never refreshed,
  // so a second build took it from a first that ran past two minutes
  const dead = () => false;
  const t1 = take(LOCK, 150);
  ok('a build holds the lock; a second waits', t1 && !take(LOCK, 150));
  const release = hold(LOCK, t1, 40);
  await wait(900);
  // its holder read as dead, so only the heartbeat keeps it; a limit of 300 leaves a loaded machine room
  ok('a build that runs past the stale limit keeps its lock', !take(LOCK, 300, dead));
  release();
  ok('released, the lock is gone and the next build takes it', !existsSync(LOCK) && take(LOCK, 150));
  const stalled = new Date(Date.now() - 600000);
  utimesSync(LOCK, stalled, stalled);
  ok('a stale lock whose holder still runs (a machine that slept) is not taken', !take(LOCK, 120000));
  writeFileSync(join(LOCK, 'holder'), `${process.pid}:${Date.now() - 3600000}:abc`);
  utimesSync(LOCK, stalled, stalled);
  const reused = take(LOCK, 150);
  ok('one whose pid runs but started at another time is taken (the pid was reused)', reused);
  const ages = new Date(Date.now() - 7 * 3600000);
  writeFileSync(join(LOCK, 'holder'), `${process.pid}:x`); // ps cannot say (an old token)
  utimesSync(LOCK, ages, ages);
  ok('one untouched six hours is taken though ps cannot say whose its pid is', take(LOCK, 150));

  const old = new Date(Date.now() - 650000);
  utimesSync(LOCK, old, old);
  const t2 = take(LOCK, 150, dead);
  ok('a lock nobody touches for the stale limit (a build that died) is taken', t2);

  // two waiters that both read the same stale time: the second's claim is refused
  const gone = new Date(Date.now() - 700000); // apart from the times above: a claim is named for its lock's time, to the ms
  utimesSync(LOCK, gone, gone);
  const first = take(LOCK, 150, dead);
  utimesSync(LOCK, gone, gone); // the second read the stale time before the first's fresh lock landed
  ok('of two waiters on one stale lock, only one takes it', first && !take(LOCK, 150, dead));
  hold(LOCK, t2, 40)();
  ok("a holder whose lock was taken over removes nothing of its successor's", existsSync(LOCK));
  hold(LOCK, first, 40)();
  ok('release clears the takeover claims with the lock', !readdirSync(tmp).length);

  // Review of 30 October 2026: a SIGTERM to build.mjs alone released the lock and left Astro building,
  // so the next build ran beside it. A copy of build.mjs over a fake Astro that records how it stopped
  // a stub project (build.mjs resolves one before it takes the lock), so it runs on any machine
  const home = join(tmp, 'projects', 'stub', 'figma-design-system');
  mkdirSync(home, { recursive: true });
  writeFileSync(join(home, 'design-system-context.md'), '# x\n\n```json project\n{ "name": "Stub" }\n```\n');
  const eng = join(tmp, 'eng', 'docs-site'), fake = join(eng, 'node_modules', 'astro');
  mkdirSync(fake, { recursive: true });
  for (const f of ['build.mjs', 'lock.mjs']) copyFileSync(join(HERE, f), join(eng, f));
  symlinkSync(join(HERE, '..', 'snapshot'), join(tmp, 'eng', 'snapshot'));
  writeFileSync(join(fake, 'package.json'), JSON.stringify({ bin: { astro: 'astro.mjs' } }));
  const mark = join(tmp, 'astro.log'), env = { ...process.env, TOOLKIT_PROJECTS_ROOT: join(tmp, 'projects'), DOCS_PROJECT: 'stub', DOCS_OUT: join(tmp, 'out') };
  const fakeAstro = (onTerm) => writeFileSync(join(fake, 'astro.mjs'), `import { writeFileSync, existsSync } from 'node:fs';
writeFileSync(${JSON.stringify(mark)}, 'running ' + process.pid);
process.on('SIGTERM', () => { ${onTerm} });
setInterval(() => {}, 1000);`);
  // runs build.mjs to its exit, signalling it once Astro runs; a fake Astro left behind is killed
  const run = async (signals) => {
    rmSync(mark, { force: true });
    const build = spawn(process.execPath, [join(eng, 'build.mjs')], { env, stdio: 'ignore' });
    const exited = new Promise((r) => build.on('exit', (c) => r(c)));
    for (let i = 0; i < 100 && !existsSync(mark); i++) await wait(50);
    const pid = existsSync(mark) && Number(readFileSync(mark, 'utf8').split(' ')[1]);
    for (const sig of existsSync(mark) ? signals : []) { build.kill(sig); await wait(200); }
    const code = await Promise.race([exited, wait(5000).then(() => 'hung')]);
    if (code === 'hung') build.kill('SIGKILL');
    try { if (pid) process.kill(pid, 'SIGKILL'); } catch { /* gone, as it should be */ }
    return code;
  };
  fakeAstro(`writeFileSync(${JSON.stringify(mark)}, existsSync(${JSON.stringify(join(eng, '.build.lock'))}) ? 'stopped, lock held' : 'stopped, lock gone'); process.exit(143);`);
  const exit = await run(['SIGTERM']);
  ok('a SIGTERM to the build alone stops Astro first, the lock held until it has', readFileSync(mark, 'utf8') === 'stopped, lock held' && !existsSync(join(eng, '.build.lock')) && exit === 130);
  fakeAstro('/* will not stop */');
  ok('an Astro that will not stop is killed at the second signal, and the lock released', (await run(['SIGTERM', 'SIGTERM'])) === 130 && !existsSync(join(eng, '.build.lock')));
} finally { rmSync(tmp, { recursive: true, force: true }); }

console.log(`${n}/${n} passed`);
