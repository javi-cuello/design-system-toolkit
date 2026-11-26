#!/usr/bin/env node
// tools/memory-check/sessions.mjs over a throwaway project folder: --prune deletes only an unnamed,
// non-live session past its age, with its folder, and never a named, live or kept one, or the memory.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { sessions, prune, sessionDir, running } from './sessions.mjs';
import { folderName } from './check.mjs';

const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sessions-')));
const now = Date.now(), DAY = 864e5;
const make = (id, ageDays, name) => {
  const f = path.join(dir, `${id}.jsonl`);
  fs.writeFileSync(f, `{"type":"user","message":{"content":"hi"}}\n${name ? `{"type":"custom-title","customTitle":"old","sessionId":"${id}"}\n{"type":"custom-title","customTitle":"${name}","sessionId":"${id}"}\n` : ''}`);
  fs.mkdirSync(path.join(dir, id, 'subagents'), { recursive: true });
  const t = (now - ageDays * DAY) / 1000;
  fs.utimesSync(f, t, t);
};
try {
  make('old-side', 10); make('old-main', 40, 'main'); make('new-side', 2); make('live-side', 0); make('kept-side', 9); make('open-side', 12);
  fs.mkdirSync(path.join(dir, 'memory')); fs.writeFileSync(path.join(dir, 'memory', 'MEMORY.md'), '');
  const list = sessions(dir, { now, keep: ['kept-side'], open: ['open-side'] });
  assert.equal(list.find((s) => s.id === 'old-main').name, 'main', 'the last title is the name');
  assert.deepEqual(list.filter((s) => s.stale).map((s) => s.id), ['old-side']);
  console.log('ok only an unnamed, non-live, unkept session past a week is stale; one Claude Code has open is live however idle');
  assert.deepEqual(prune(list), ['old-side']);
  assert.ok(!fs.existsSync(path.join(dir, 'old-side.jsonl')) && !fs.existsSync(path.join(dir, 'old-side')), 'its transcript and folder go');
  for (const id of ['old-main', 'new-side', 'live-side', 'kept-side', 'open-side']) assert.ok(fs.existsSync(path.join(dir, `${id}.jsonl`)), id);
  assert.ok(fs.existsSync(path.join(dir, 'memory', 'MEMORY.md')), 'memory is never touched');
  console.log('ok --prune deletes the stale one with its folder, and nothing else');
  // where the sessions are: the launch folder's own; a worktree with none reads its main checkout's
  const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'repo-'))), root = path.join(dir, 'root');
  const git = (...a) => execFileSync('git', ['-C', repo, ...a], { stdio: 'ignore' });
  git('init', '-q', '-b', 'main'); git('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '--allow-empty', '-m', 'base');
  const wt = path.join(repo, 'wt'); git('worktree', 'add', '-q', wt);
  fs.mkdirSync(path.join(root, folderName(repo)), { recursive: true }); fs.writeFileSync(path.join(root, folderName(repo), 's.jsonl'), '');
  assert.equal(sessionDir(wt, root), path.join(root, folderName(repo)), 'a worktree with none of its own reads the main checkout\'s');
  fs.mkdirSync(path.join(root, folderName(fs.realpathSync(wt))), { recursive: true }); fs.writeFileSync(path.join(root, folderName(fs.realpathSync(wt)), 'w.jsonl'), '');
  assert.equal(sessionDir(wt, root), path.join(root, folderName(fs.realpathSync(wt))), 'a worktree with its own reads its own');
  fs.mkdirSync(path.join(repo, 'sub'));
  assert.equal(sessionDir(path.join(repo, 'sub'), root), path.join(root, folderName(path.join(repo, 'sub'))), 'a subfolder is never read as the repo');
  fs.rmSync(repo, { recursive: true, force: true });
  // a session registry naming a process that is not running is not open
  const reg = path.join(dir, 'reg'); fs.mkdirSync(reg);
  fs.writeFileSync(path.join(reg, '1.json'), JSON.stringify({ pid: process.pid, sessionId: 'me' }));
  fs.writeFileSync(path.join(reg, '2.json'), JSON.stringify({ pid: 2 ** 22 + 7, sessionId: 'gone' }));
  assert.deepEqual(running(reg), ['me']);
  console.log('ok sessions are read where Claude Code files them, and only running ones count as open');
} finally { fs.rmSync(dir, { recursive: true, force: true }); }
console.log('3/3 passed');
