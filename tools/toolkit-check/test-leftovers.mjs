#!/usr/bin/env node
// leftovers.mjs: what the closing pass removes on its own, and what bin/check only warns of.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'leftovers-')));
// a fake transcripts tree: the session that ran agent-abc123 (whose worktree is below)
process.env.TOOLKIT_TRANSCRIPTS = path.join(tmp, 'projects');
fs.mkdirSync(path.join(tmp, 'projects/p/sess-0001/subagents'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'projects/p/sess-0001/subagents/agent-abc123.jsonl'), '');
const { sweep, leftovers, merged } = await import('./leftovers.mjs');

const repo = path.join(tmp, 'repo');
fs.mkdirSync(repo);
const env = { ...process.env, GIT_AUTHOR_NAME: 'x', GIT_AUTHOR_EMAIL: 'x@x', GIT_COMMITTER_NAME: 'x', GIT_COMMITTER_EMAIL: 'x@x' };
const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'ignore'] });
const commit = (cwd, file, msg) => { fs.writeFileSync(path.join(cwd, file), msg + Math.random()); git(cwd, 'add', file); git(cwd, 'commit', '-q', '-m', msg); };
git(repo, 'init', '-q', '-b', 'main'); commit(repo, 'a.txt', 'one');
const wt = (name) => { const d = path.join(repo, '.claude/worktrees', name); git(repo, 'worktree', 'add', '-q', '-b', `wt-${name}`, d); return d; };

const fast = wt('agent-merged');          // no commit of its own: merged
const picked = wt('agent-picked');        // its commit reached main under another hash
git(picked, 'commit', '-q', '--allow-empty', '-m', 'base'); fs.writeFileSync(path.join(picked, 'p.txt'), 'same'); git(picked, 'add', 'p.txt'); git(picked, 'commit', '-q', '-m', 'the picked change');
git(repo, 'cherry-pick', 'wt-agent-picked'); // the same change on main under another hash
const open = wt('agent-abc123');          // a commit main does not have
commit(open, 'o.txt', 'unmerged work');
const dirty = wt('agent-dirty');          // merged, but an uncommitted file
fs.writeFileSync(path.join(dirty, 'new.txt'), 'x');
const ignored = wt('agent-ignored');      // merged, but an ignored file (a local .env) git worktree remove would delete
fs.writeFileSync(path.join(repo, '.git/info/exclude'), '.env\n'); fs.writeFileSync(path.join(ignored, '.env'), 'k');
const wip = wt('agent-wip');              // a "wip" that only shares its subject with one on main
commit(wip, 'w.txt', 'wip'); commit(repo, 'other.txt', 'wip');
git(repo, 'branch', 'old-merged');        // a branch alone, merged
git(repo, 'branch', 'old-open', 'wt-agent-abc123'); // a branch alone, unmerged
fs.writeFileSync(path.join(repo, 'a.txt'), 'stashed'); git(repo, 'stash', '-q');

assert.equal(merged(repo, 'wt-agent-picked', 'main'), true, 'a change on main under another hash counts as merged');
assert.equal(merged(repo, 'wt-agent-abc123', 'main'), false);
assert.equal(merged(repo, 'wt-agent-wip', 'main'), false, 'a subject on main over other files is not the same commit');
// a "fix typo" on the same file with other content is not merged either (the subject-and-files test let it through)
const typo = wt('agent-typo'); fs.writeFileSync(path.join(typo, 'a.txt'), 'their fix'); git(typo, 'commit', '-qam', 'fix typo');
fs.writeFileSync(path.join(repo, 'a.txt'), 'main fix'); git(repo, 'commit', '-qam', 'fix typo');
assert.equal(merged(repo, 'wt-agent-typo', 'main'), false, 'same subject, same file, other content: unmerged');

// under a day old: nothing goes, nothing is warned of
assert.deepEqual(sweep(repo), [], 'a worktree under a day old is left alone');
assert.deepEqual(await leftovers(repo), [], 'and is not warned of');

const later = Date.now() + 2 * 864e5;
const gone = sweep(repo, later).map((g) => g.replace(/ \(was [0-9a-f]{8}\)$/, '')).sort();
assert.deepEqual(gone, ['.claude/worktrees/agent-merged', '.claude/worktrees/agent-picked', 'old-merged'], 'merged, clean and a day old: removed');
assert.ok(!fs.existsSync(fast) && !fs.existsSync(picked), 'their folders are gone');
assert.equal(git(repo, 'branch', '--list', 'wt-agent-merged', 'wt-agent-picked', 'old-merged').trim(), '', 'with their branches');
assert.ok(fs.existsSync(path.join(open, 'o.txt')) && fs.existsSync(path.join(dirty, 'new.txt')), 'the unmerged and the dirty worktree are untouched');
assert.ok(fs.existsSync(path.join(ignored, '.env')) && fs.existsSync(path.join(wip, 'w.txt')), 'and the one with an ignored file, and the "wip"');
assert.match(git(repo, 'stash', 'list'), /stash@\{0\}/, 'the stash is untouched');
assert.match(git(repo, 'branch', '--list', 'old-open'), /old-open/, 'the unmerged branch is untouched');

const warned = await leftovers(repo, later);
assert.equal(warned.length, 7, warned.join('\n'));
assert.ok(warned.some((l) => /worktree \.claude\/worktrees\/agent-abc123 \(wt-agent-abc123\): commits not on main — session sess-000/.test(l)), 'the unmerged worktree, with the session that ran its agent');
assert.ok(warned.some((l) => /agent-dirty.*uncommitted files/.test(l)), 'the dirty worktree');
assert.ok(warned.some((l) => /branch old-open: commits not on main/.test(l)), 'the unmerged branch');
assert.ok(warned.some((l) => /^2d  stash stash@\{0\}/.test(l)), 'every stash, with its age');
assert.deepEqual(sweep(repo, later), [], 'a second sweep removes nothing more');

// main checked out in a linked worktree is never removed, nor the main branch with it
const side = path.join(tmp, 'side'); fs.mkdirSync(side);
git(side, 'init', '-q', '-b', 'main'); commit(side, 'a.txt', 'one'); git(side, 'checkout', '-q', '-b', 'feature');
git(side, 'worktree', 'add', '-q', path.join(side, '.claude/worktrees/on-main'), 'main');
assert.deepEqual(sweep(side, later), [], 'a worktree holding main stays');
assert.match(git(side, 'branch', '--list', 'main'), /main/, 'and main with it');

fs.rmSync(tmp, { recursive: true, force: true });
console.log('test-leftovers: 21 assertions passed');
