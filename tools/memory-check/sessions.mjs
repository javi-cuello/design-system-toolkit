#!/usr/bin/env node
/*
 * tools/memory-check/sessions.mjs — a project's Claude Code sessions, for /checkout: each one's name (the
 * last `custom-title` line /rename or `claude -n` wrote into its transcript), age and whether it is live.
 * A project keeps one named main session (the toolkit a few); an unnamed one is a side session, and once
 * it is older than limits.json's sessionDays and not live, --prune deletes its transcript and its folder.
 * A named session, a live one, one named by --keep and the memory folder are never touched.
 *
 *   node tools/memory-check/sessions.mjs [--folder <project dir>] [--root <dir>] [--keep <session id>] [--prune]
 *
 * --folder defaults to the current directory, read as its main checkout's when it is a git worktree; Claude
 * Code files sessions under that path with every character but a letter or digit made "-". A session open
 * now (~/.claude/sessions) counts as live however idle. Claude Code's own cleanupPeriodDays sweep deletes every
 * session past its age, named or not; this one deletes only side sessions, sooner.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { LIMITS, ROOT, folderName } from './check.mjs';
import { transcriptLines } from '../claude-hooks/stop-items.mjs';

const DAY = 864e5;

/* The title a transcript last carries, or null: /rename appends, so the last one wins. Read in blocks, as a
   transcript can pass the longest string Node holds. */
function title(file) {
  let name = null;
  for (const line of transcriptLines(fs, file)) {
    const m = /^\{"type":"custom-title","customTitle":"((?:[^"\\]|\\.)*)"/.exec(line);
    if (m) name = JSON.parse(`"${m[1]}"`);
  }
  return name;
}

/* The sessions Claude Code has open now, whatever their transcript's age: ~/.claude/sessions/<pid>.json
   for each running process. */
export function running(dir = path.join(os.homedir(), '.claude', 'sessions')) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => /^\d+\.json$/.test(f)).flatMap((f) => {
    try {
      const s = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      process.kill(s.pid, 0);
      return [s.sessionId];
    } catch { return []; }
  });
}

/* A project's folder: its main checkout's, since Claude Code files a worktree's sessions there. */
export function projectOf(dir) {
  try {
    const common = execFileSync('git', ['-C', dir, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return fs.realpathSync(path.dirname(common));
  } catch { return fs.realpathSync(dir); }
}

export function sessions(dir, { now = Date.now(), keep = [], open = running() } = {}) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => {
    const file = path.join(dir, f), id = f.replace(/\.jsonl$/, '');
    const mtime = fs.statSync(file).mtimeMs;
    const s = { id, file, name: title(file), days: Math.floor((now - mtime) / DAY), live: now - mtime < LIMITS.liveMinutes * 6e4 || open.includes(id), kept: keep.includes(id) };
    s.stale = !s.name && !s.live && !s.kept && now - mtime > LIMITS.sessionDays * DAY;
    return s;
  }).sort((a, b) => a.days - b.days);
}

export function prune(list) {
  const gone = [];
  for (const s of list.filter((x) => x.stale)) {
    fs.rmSync(s.file, { force: true });
    fs.rmSync(s.file.replace(/\.jsonl$/, ''), { recursive: true, force: true });
    gone.push(s.id);
  }
  return gone;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const arg = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
  const project = projectOf(arg('--folder') || process.cwd());
  const dir = path.join(arg('--root') || ROOT, folderName(project));
  const list = sessions(dir, { keep: arg('--keep') ? [arg('--keep')] : [] });
  if (!list.length) { console.log(`sessions: none for ${project}`); process.exit(0); }
  for (const s of list) console.log(`${s.id.slice(0, 8)}  ${(s.name || '(unnamed)').padEnd(20)} ${String(s.days).padStart(3)}d${s.live ? '  live' : ''}${s.kept ? '  this session' : ''}${s.stale ? '  stale' : ''}`);
  const named = list.filter((s) => s.name).length;
  const stale = list.filter((s) => s.stale);
  if (argv.includes('--prune')) console.log(`sessions: ${prune(list).length} stale side session(s) deleted; ${named} named kept`);
  else console.log(`sessions: ${list.length}, ${named} named, ${stale.length} stale${stale.length ? ' (--prune deletes them)' : ''}${named ? '' : '; none named: /rename the main one'}`);
}
