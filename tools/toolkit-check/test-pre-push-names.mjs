#!/usr/bin/env node
// node tools/toolkit-check/test-pre-push-names.mjs — the push hook refuses a commit whose message names a
// project, and lets a clean one, a deleted branch and a machine with no projects through. Its message
// scan runs alone: the hook cut before its bin/check, on a stub project and a throwaway repo.
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'pre-push-names-'));
let n = 0;
const ok = (name, cond, why = '') => { n++; assert.ok(cond, `${name}${why ? `\n${why}` : ''}`); console.log('ok  ' + name); };
try {
  const home = join(tmp, 'projects', 'acme-web', 'figma-design-system');
  mkdirSync(home, { recursive: true });
  writeFileSync(join(home, 'design-system-context.md'), '# x\n\n```json project\n{ "name": "Acme web" }\n```\n');
  // the hook up to its bin/check, in a repo that links the toolkit's tools
  const repo = join(tmp, 'repo');
  mkdirSync(join(repo, '.githooks'), { recursive: true });
  const hook = readFileSync(join(ROOT, '.githooks', 'pre-push'), 'utf8');
  assert.ok(hook.includes('\nLOG='), 'the hook still runs bin/check from its LOG line');
  writeFileSync(join(repo, '.githooks', 'pre-push'), hook.slice(0, hook.indexOf('\nLOG=')) + '\nexit 0\n');
  symlinkSync(join(ROOT, 'tools'), join(repo, 'tools'));
  const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8' }).trim();
  git('init', '-q'); git('config', 'user.email', 't@example.com'); git('config', 'user.name', 't');
  git('commit', '-q', '--allow-empty', '-m', 'first');
  const base = git('rev-parse', 'HEAD');
  git('commit', '-q', '--allow-empty', '-m', 'parity: fix\n\nFound on acmeweb\'s settings page.');
  const named = git('rev-parse', 'HEAD');
  git('commit', '-q', '--allow-empty', '-m', 'parity: a clean one');
  const clean = git('rev-parse', 'HEAD');
  const push = (lsha, rsha, env = {}) => spawnSync('sh', [join(repo, '.githooks', 'pre-push')], { cwd: repo, encoding: 'utf8',
    input: `refs/heads/main ${lsha} refs/heads/main ${rsha}\n`, env: { ...process.env, TOOLKIT_PROJECTS_ROOT: join(tmp, 'projects'), ...env } });
  const zero = '0'.repeat(40);
  let r = push(named, base);
  ok('a message naming a project in its body, written without its separator, is refused with its commit', r.status === 1 && /name a project/.test(r.stdout) && r.stdout.includes(named.slice(0, 7) + ' parity: fix'), r.stdout + r.stderr);
  r = push(clean, named);
  ok('a clean message passes', r.status === 0, r.stdout + r.stderr);
  r = push(clean, 'f'.repeat(40));
  ok('a remote commit this clone never fetched reads every commit no remote has, never none', r.status === 1 && r.stdout.includes(named.slice(0, 7) + ' parity: fix'), r.stdout + r.stderr);
  r = push(zero, named);
  ok('a deleted branch sends nothing to read', r.status === 0, r.stdout + r.stderr);
  r = push(named, zero);
  ok('a new branch is read back to what no remote has', r.status === 1 && r.stdout.includes(named.slice(0, 7) + ' parity: fix'), r.stdout + r.stderr);
  // a remote that already has the naming commit: a new branch from it reads only what comes after
  execFileSync('git', ['init', '-q', '--bare', join(tmp, 'remote.git')]);
  git('remote', 'add', 'origin', join(tmp, 'remote.git'));
  git('push', '-q', '--no-verify', 'origin', `${named}:refs/heads/old`);
  git('fetch', '-q', 'origin');
  r = push(clean, zero);
  ok('a new branch is not refused for what a remote already has', r.status === 0, r.stdout + r.stderr);
  r = push(named, base, { TOOLKIT_PROJECTS_ROOT: join(tmp, 'none') });
  ok('a machine with no projects has no names to refuse', r.status === 0, r.stdout + r.stderr);
} finally { rmSync(tmp, { recursive: true, force: true }); }
console.log(`${n}/${n} passed`);
