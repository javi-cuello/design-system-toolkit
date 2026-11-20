#!/usr/bin/env node
// worktree.mjs in a scratch repo: a worktree per piece of work, reopened by name, refused to a second running
// session (the CLI's --join is the override), and made again after its folder was deleted by hand.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'test-worktree-')));
const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', TOOLKIT_SESSIONS_DIR: path.join(tmp, 'sessions') };
Object.assign(process.env, env);
const git = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const remote = path.join(tmp, 'remote.git'), main = path.join(tmp, 'main');
execFileSync('git', ['init', '-q', '--bare', '-b', 'main', remote]);
execFileSync('git', ['clone', '-q', remote, main], { stdio: 'ignore' });
fs.writeFileSync(path.join(main, '.gitignore'), '.claude/\n'); git(main, 'add', '.'); git(main, 'commit', '-qm', 'base'); git(main, 'push', '-q', 'origin', 'main');
const { ensure, remember, claimedBy } = await import('./worktree.mjs');
let n = 0; const ok = (name, cond) => { n++; assert.ok(cond, name); };

const dir = ensure(main, 'Check cache!');
ok('the folder is named for the work, its branch worktree-<work>', dir === path.join(main, '.claude/worktrees/check-cache') && git(dir, 'rev-parse', '--abbrev-ref', 'HEAD') === 'worktree-check-cache');
ok('asked again, the same folder', ensure(main, 'check-cache') === dir);

// a second running session asking for the same work is told who holds it
remember(main, 'live', 'check-cache');
fs.mkdirSync(env.TOOLKIT_SESSIONS_DIR); fs.writeFileSync(path.join(env.TOOLKIT_SESSIONS_DIR, '1.json'), JSON.stringify({ sessionId: 'live', pid: process.pid, name: 'other' }));
ok('a running session holding the name is named', (await claimedBy(main, 'check-cache', 'me')).join() === 'other (session live)');
ok('the session itself is never its own rival', (await claimedBy(main, 'check-cache', 'live')).length === 0);
fs.writeFileSync(path.join(env.TOOLKIT_SESSIONS_DIR, '1.json'), JSON.stringify({ sessionId: 'live', pid: 999999, name: 'other' }));
ok('a session no longer running claims nothing', (await claimedBy(main, 'check-cache', 'me')).length === 0);

// a folder deleted by hand: made again on its branch, its commits kept
fs.writeFileSync(path.join(dir, 'w.txt'), 'x'); git(dir, 'add', 'w.txt'); git(dir, 'commit', '-qm', 'work');
fs.rmSync(dir, { recursive: true, force: true });
const again = ensure(main, 'check-cache');
ok('a folder deleted by hand is made again, with its branch\'s commits', again === dir && fs.readFileSync(path.join(again, 'w.txt'), 'utf8') === 'x');

console.log(`test-worktree: ${n} assertions passed`);
fs.rmSync(tmp, { recursive: true, force: true });
