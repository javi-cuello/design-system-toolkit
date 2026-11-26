#!/usr/bin/env node
// tools/memory-check/sessions.mjs over a throwaway project folder: --prune deletes only an unnamed,
// non-live session past its age, with its folder, and never a named, live or kept one, or the memory.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sessions, prune } from './sessions.mjs';

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
} finally { fs.rmSync(dir, { recursive: true, force: true }); }
console.log('2/2 passed');
