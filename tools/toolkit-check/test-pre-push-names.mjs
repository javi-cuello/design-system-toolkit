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
  mkdirSync(join(tmp, 'empty'));
  r = push(named, base, { TOOLKIT_PROJECTS_ROOT: join(tmp, 'empty') });
  ok('a projects root with no projects (CI\'s) has no names to refuse', r.status === 0, r.stdout + r.stderr);
  r = push(clean, named, { TOOLKIT_PROJECTS_ROOT: join(tmp, 'none') });
  ok('a projects root that is not there refuses the push, never reads as no projects', r.status === 1 && /could not be read/.test(r.stdout), r.stdout + r.stderr);
  // the script itself, as bin/check reads it
  const names = (dir) => spawnSync('sh', [join(ROOT, 'tools/toolkit-check/project-names.sh')], { encoding: 'utf8', env: { ...process.env, TOOLKIT_PROJECTS_ROOT: dir } });
  r = names(join(tmp, 'none'));
  ok('project-names.sh exits 1 on a missing root, naming it', r.status === 1 && r.stderr.includes(join(tmp, 'none')) && r.stdout === '', r.stdout + r.stderr);
  r = names(join(tmp, 'empty'));
  ok('…and prints nothing, exiting 0, on an empty one', r.status === 0 && r.stdout.trim() === '', r.stdout + r.stderr);
  r = names(join(tmp, 'projects'));
  ok('…and the project\'s name, separator optional, where there is one', r.status === 0 && r.stdout.trim() === 'acme[-_. ]?web', r.stdout + r.stderr);
  // personal-info.mjs, as bin/check's step runs it: a repo whose maintainer and remote are stand-ins
  const pi = join(tmp, 'pi');
  mkdirSync(join(pi, 'notes'), { recursive: true });
  const pgit = (...a) => execFileSync('git', ['-C', pi, ...a], { encoding: 'utf8' }).trim();
  pgit('init', '-q'); pgit('config', 'user.name', 'Ada Lovelace'); pgit('remote', 'add', 'origin', 'https://github.com/ada-love/kit.git');
  const scan = (body, file = 'notes/a b.md') => {
    writeFileSync(join(pi, file), body + '\n'); pgit('add', '-A');
    const res = spawnSync('node', [join(ROOT, 'tools/toolkit-check/personal-info.mjs')], { cwd: pi, encoding: 'utf8' });
    rmSync(join(pi, file)); pgit('add', '-A');
    return res;
  };
  // built at run time, so the scan of this repo does not find its own fixtures
  const AT = '@';
  r = scan(`Write to jo.smith${AT}acme.io for access.`);
  ok('an email address is refused, in a file whose name has a space', r.status === 1 && r.stdout.includes('notes/a b.md:1: an email address (jo.smith' + AT + 'acme.io)'), r.stdout + r.stderr);
  r = scan(`Co-Authored-By: Claude <noreply${AT}anthropic.com>; reach jo${AT}example.com or a${AT}b.example.org; icon${AT}2x.png; git${AT}github.com:a/b.git`);
  ok('…but not the commit trailer\'s noreply, an example.com/.org/.net placeholder, an @2x asset or a git@ remote', r.status === 0, r.stdout + r.stderr);
  const U = '/' + 'Users/';
  r = scan(`The snapshot sat in ${U}jsmith/Projects/x and ${U.toLowerCase()}kim/x.`);
  ok('a /Users/<name>/ home path is refused, in either case', r.status === 1 && /a home path \(\/Users\/jsmith\/\)/.test(r.stdout) && /\/users\/kim\//.test(r.stdout), r.stdout + r.stderr);
  r = scan(`Fixtures: ${U}u/p, ${U}me/notes.md, ${U}first.last/Projects; https://medium.com/users/ben/x`);
  ok('…but not a fixture\'s placeholder home or a URL path that happens to say /users/', r.status === 0, r.stdout + r.stderr);
  r = scan('Ruled by Lovelace on 3 October.');
  ok('the maintainer\'s name, read from git config, is refused by any word of it', r.status === 1 && /maintainer's name \(Lovelace\)/.test(r.stdout), r.stdout + r.stderr);
  r = scan('Asked by ádá, accents and case aside.');
  ok('…accents and case ignored', r.status === 1, r.stdout + r.stderr);
  r = scan('© 2026 Ada Lovelace. See https://github.com/ada-love/kit/blob/main/README.md');
  ok('…but not in the author\'s notice or the repo\'s own address', r.status === 0, r.stdout + r.stderr);
  r = scan(`© 2026 Ada Lovelace, ada${AT}acme.io`);
  ok('…though an email on the notice\'s line is still refused', r.status === 1 && /an email address/.test(r.stdout) && !/maintainer/.test(r.stdout), r.stdout + r.stderr);
  r = scan('Copyright Ada Lovelace', 'LICENSE');
  ok('…nor in LICENSE', r.status === 0, r.stdout + r.stderr);
  pgit('config', 'user.name', '');
  r = scan('Ruled by Lovelace.');
  ok('with no user.name the name is not looked for, and a notice says so', r.status === 0 && /no git user\.name/.test(r.stderr), r.stdout + r.stderr);
} finally { rmSync(tmp, { recursive: true, force: true }); }
console.log(`${n}/${n} passed`);
