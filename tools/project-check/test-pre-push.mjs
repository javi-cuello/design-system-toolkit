#!/usr/bin/env node
// tools/project-check/pre-push.mjs over a throwaway repo: it checks only the commit
// checked out with nothing beside it, and caches only what it checked.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), 'pre-push.mjs');
let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log('ok', name); };
const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'prepush-'));
const g = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const write = (f, s) => { fs.mkdirSync(path.dirname(path.join(repo, f)), { recursive: true }); fs.writeFileSync(path.join(repo, f), s); };
const commit = (msg) => { g('add', '-A'); g('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', msg); return g('rev-parse', 'HEAD'); };
g('init', '-q');
write('snapshot.config.json', JSON.stringify({ check: { exempt: ['content/'] } }));
write('bin/check', '#!/bin/sh\necho checked >> "$(dirname "$0")/../.git/ran"\nexit 0\n'); fs.chmodSync(path.join(repo, 'bin/check'), 0o755);
const base = commit('start');
write('site/a.php', 'a'); const a = commit('a');
const push = (sha) => spawnSync('node', [HOOK, repo], { input: `refs/heads/main ${sha} refs/heads/main ${base}\n`, encoding: 'utf8' });
const ran = () => (fs.existsSync(path.join(repo, '.git/ran')) ? fs.readFileSync(path.join(repo, '.git/ran'), 'utf8').split('\n').filter(Boolean).length : 0);

g('checkout', '-q', base);
let r = push(a);
ok('a push of a commit that is not HEAD is refused, unchecked and uncached', r.status === 1 && /HEAD is/.test(r.stdout) && ran() === 0 && !fs.existsSync(path.join(repo, '.git/last-check-green')));
g('checkout', '-q', a);
write('site/b.php', 'loose');
r = push(a);
ok('a push over an untracked or changed file is refused', r.status === 1 && /untracked/.test(r.stdout) && ran() === 0);
fs.rmSync(path.join(repo, 'site/b.php'));
write('content/post.txt', 'content is not code');
r = push(a);
ok('HEAD with nothing beside it but content is checked and cached', r.status === 0 && ran() === 1 && fs.existsSync(path.join(repo, '.git/last-check-green')));
r = push(a);
ok('the same tree again is not re-checked', r.status === 0 && ran() === 1 && /already passed/.test(r.stdout));
write('site/c.php', 'c'); const c = commit('c');
g('-c', 'user.name=t', '-c', 'user.email=t@t', 'tag', '-a', 'v1', '-m', 'release');
r = spawnSync('node', [HOOK, repo], { input: `refs/tags/v1 ${g('rev-parse', 'v1')} refs/tags/v1 ${'0'.repeat(40)}\n`, encoding: 'utf8' });
ok('an annotated tag on HEAD is checked as the commit it points at', r.status === 0 && ran() === 2 && c === g('rev-parse', 'HEAD'));
fs.rmSync(repo, { recursive: true, force: true });
console.log(`${n}/${n} passed`);
