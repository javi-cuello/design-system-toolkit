/*
 * tools/claude-hooks/stop-items.mjs — which of the closing pass's open items a
 * session has not been shown yet.
 *
 * The Stop hook used to remember the whole list as one hash, so any change to
 * it — another session in the same checkout touching one more file — blocked
 * again with every item it had already answered. Two sessions in one toolkit
 * checkout on 6 Oct turned that into a block on nearly every reply, each
 * repeating the other session's files, and the maintainer's answers were lost
 * among them. Each item is remembered on its own now: a file, a commit count,
 * a line. An item blocks once; only an item not seen before blocks again.
 */

import path from 'node:path';
import { expandHome } from '../shared/real-path.mjs';

/* One key per thing a session can answer: each uncommitted or user-facing
   file on its own, every other line whole. */
export function itemKeys(items) {
  const keys = [];
  for (const line of String(items).split('\n').map((l) => l.trim()).filter(Boolean)) {
    const m = line.match(/^([^:]+):\s+\d+\s+(uncommitted|user-facing file\(s\) changed[^:]*?):?\s*(?:.*?—\s*)?(.*)$/);
    const files = m && m[2] === 'uncommitted' ? line.replace(/^[^:]+:\s+\d+\s+uncommitted:\s*/, '')
      : m ? line.replace(/^.*?—\s*/, '') : null;
    if (files !== null) {
      const kind = m[2] === 'uncommitted' ? 'uncommitted' : 'user-facing';
      for (const f of files.replace(/\s*…$/, '').split(/,\s*/).filter(Boolean)) keys.push({ key: `${m[1]}|${kind}|${f}`, line });
    } else keys.push({ key: line, line });
  }
  return keys;
}

/* What the session has not been shown: the new files alone under their
   repo and kind, and any other line whole. */
export function unseen(items, seenKeys, own = null, repoDirs = {}) {
  const seen = new Set(seenKeys);
  const fresh = itemKeys(items).filter((k) => !seen.has(k.key) && isOwn(k.key, own, repoDirs));
  const lines = [];
  const files = new Map();
  for (const { key, line } of fresh) {
    const [repo, kind, file] = key.split('|');
    if (file === undefined) { lines.push(line); continue; }
    const head = `${repo}: ${kind === 'uncommitted' ? 'uncommitted' : 'user-facing, look at the pages they draw before they ship'}`;
    if (!files.has(head)) files.set(head, []);
    files.get(head).push(file);
  }
  for (const [head, list] of files) lines.push(`${head}: ${list.join(', ')}`);
  return { lines, keys: fresh.map((k) => k.key) };
}

/* A transcript's lines, read a block at a time: a long session's passed what
   one string can hold (555 MB, over Node's 512 MB), and reading it whole
   crashed the Stop hook on every reply (20 Oct). */
export function* transcriptLines(fs, file) {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(1 << 23);
  let rest = Buffer.alloc(0);
  try {
    for (let n; (n = fs.readSync(fd, buf, 0, buf.length, null)) > 0;) {
      const chunk = Buffer.concat([rest, buf.subarray(0, n)]);
      let start = 0;
      for (let i = chunk.indexOf(10); i >= 0; i = chunk.indexOf(10, start)) { yield chunk.toString('utf8', start, i); start = i + 1; }
      rest = chunk.subarray(start);
    }
    if (rest.length) yield rest.toString('utf8');
  } finally { fs.closeSync(fd); }
}

/* The files this session wrote, from its transcript: every Edit and Write
   target, and what each shell command names (standards-read.mjs's
   targets()). An uncommitted file outside this set is another session's,
   which this one can only name, so it no longer blocks: the reminder came
   back on nearly every reply while another session worked in the same
   checkout (13 Oct). Over-inclusive on purpose: a path a command only read
   still counts, and a missing transcript keeps every file. */
export async function ownFiles(transcript) {
  const { default: fs } = await import('node:fs');
  const { targets } = await import('./standards-read.mjs');
  if (!transcript || !fs.existsSync(transcript)) return null;
  const own = new Set();
  for (const line of transcriptLines(fs, transcript)) {
    if (!line.includes('"tool_use"')) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    for (const c of rec.message?.content || []) {
      if (c.type !== 'tool_use') continue;
      /* A file the session committed is no longer its open work: a later
         change to it is another session's until this one writes it again. */
      const committed = c.name === 'Bash' && /\bgit\s+commit\b/.test(c.input?.command || '');
      for (const f of committed ? targets(c.name, c.input || {}, rec.cwd || process.cwd()) : written(c, rec.cwd || process.cwd())) committed ? own.delete(f) : own.add(f);
    }
  }
  return own;
}

/* Whether the turn since the person's last message wrote anything. A turn
   that only answered a question blocks on nothing: the closing ritual turned
   one-line answers into walls of text (13 Oct). */
export async function turnWrote(transcript) {
  const { default: fs } = await import('node:fs');
  if (!transcript || !fs.existsSync(transcript)) return true;
  // read forward: a person's message starts a turn afresh, a write in it marks it
  let wrote = false;
  for (const line of transcriptLines(fs, transcript)) {
    if (!line) continue;
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    const content = rec.message?.content;
    if (rec.type === 'user' && (typeof content === 'string' || (Array.isArray(content) && content.some((c) => c.type === 'text')))) { wrote = false; continue; }
    if (wrote || rec.type !== 'assistant' || !Array.isArray(content)) continue;
    for (const c of content) if (c.type === 'tool_use' && (written(c, rec.cwd || process.cwd()).length || /\bgit\s+(commit|push)\b|writeFileSync|open\([^)]*['"][wa]['"]/.test(c.input?.command || ''))) wrote = true;
  }
  return wrote;
}

/* What one tool call wrote: an Edit or Write target, or in a shell command a
   redirection's target or `sed -i`'s file. A path a command only names (a
   grep pattern, a cat) is not a write, which the wider targets() counts. */
export function written(c, cwd) {
  const input = c.input || {};
  // a Read names a file too; only the editing tools write one
  if (c.name !== 'Bash') return ['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(c.name) ? [input.file_path || input.notebook_path].filter(Boolean) : [];
  const cmd = String(input.command || '').replace(/<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n\1\b/g, '');
  const base = (cmd.match(/^\s*cd\s+([^\s;&|]+)\s*&&/) || [])[1] || cwd;
  const out = [...cmd.matchAll(/(?:^|[^<0-9&])>>?\s*([^\s;&|()]+)/g)].map((m) => m[1]);
  for (const m of cmd.matchAll(/\bsed\s+-i\b[^;&|]*?\s([^\s;&|]+)\s*(?:[;&|]|$)/g)) out.push(m[1]);
  return out.filter((f) => !/^\/dev\//.test(f)).map((f) => path.resolve(base, expandHome(f)));
}

/* Whether an item is this session's: a file item only when the session wrote
   the file (matched by its repo-relative path), every other line always. */
export function isOwn(key, own, repoDirs = {}) {
  const [, kind, file] = key.split('|');
  if (!own) return true;
  /* A repo the session never wrote in is another session's, every line of it
     (13 Oct: a read-only question was blocked by another project's parity rulings). */
  const dir = repoDirs[key.match(/^([^|:]+)/)[1]];
  if (dir && ![...own].some((f) => f === dir || f.startsWith(dir + '/'))) return false;
  if (kind !== 'uncommitted') return true;
  return [...own].some((f) => f === file || f.endsWith('/' + file));
}

/* The files this session wrote that are still uncommitted, by repo: { repo: [relative path…] }. Only its own paths, as
   git reports them now: a file it wrote and then saw committed (by itself or anyone) and that is changed again since is
   another session's, since ownFiles cannot tell every commit's files (`git -C x commit`, `git add a && git commit`). */
export async function ownUncommitted(transcript, repos) {
  const { default: fs } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const out = {};
  if (!transcript || !fs.existsSync(transcript)) return out;
  const last = new Map(); // file → when this session last wrote it
  for (const line of transcriptLines(fs, transcript)) {
    if (!line.includes('"tool_use"')) continue;
    let rec; try { rec = JSON.parse(line); } catch { continue; }
    for (const c of rec.message?.content || []) if (c.type === 'tool_use') for (const f of written(c, rec.cwd || process.cwd())) last.set(f, Date.parse(rec.timestamp) || 0);
  }
  // and what its scripts wrote (python, cp, a generator), which the gates find on disk and the transcript never shows
  try {
    const { scriptWritten } = await import('./gates.mjs');
    for (const [f, t] of Object.entries(scriptWritten(path.basename(transcript).replace(/\.jsonl$/, '')))) last.set(f, Math.max(last.get(f) || 0, t));
  } catch { /* no gates state: the transcript's writes alone */ }
  // macOS folders are case-insensitive: ~/projects/toolkit is ~/Projects/toolkit
  const fold = process.platform === 'darwin' ? (x) => x.toLowerCase() : (x) => x;
  // a session's own worktree (.claude/worktrees/<work>) is a repo of its own; a background subagent's (agent-<id>) is
  // the subagent's, merged by the session
  const trees = new Set();
  for (const f of last.keys()) for (const repo of repos) {
    const m = fold(f).startsWith(fold(repo + path.sep)) && f.slice(repo.length + 1).match(/^\.claude\/worktrees\/([^/]+)\//);
    if (m && !m[1].startsWith('agent-')) trees.add(path.join(repo, '.claude', 'worktrees', m[1]));
  }
  for (const repo of [...repos, ...trees]) {
    const mine = [...last.keys()].filter((f) => fold(f).startsWith(fold(repo + path.sep)) && !/\/\.claude\/worktrees\//.test(f.slice(repo.length))).map((f) => [f, repo + f.slice(repo.length)]);
    if (!mine.length) continue;
    const g = (args) => execFileSync('git', ['-C', repo, '--literal-pathspecs', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    let st = '';
    try { st = g(['status', '--porcelain', '-z', '-unormal', '--', ...mine.map(([, f]) => path.relative(repo, f))]); } catch { continue; }
    const loose = [];
    const parts = st.split('\0');
    for (let i = 0; i < parts.length; i++) {
      const e = parts[i];
      if (e.length < 4) continue;
      if (/[RC]/.test(e.slice(0, 2))) i++; // a rename's source path follows
      const rel = e.slice(3);
      const wrote = mine.find(([, f]) => fold(path.relative(repo, f)) === fold(rel))?.[0];
      let committed = 0;
      try { committed = Date.parse(g(['log', '-1', '--format=%cI', '--', rel]).trim()) || 0; } catch { /* never committed */ }
      if (wrote && !(committed > last.get(wrote))) loose.push(rel);
    }
    if (loose.length) out[repo] = loose;
  }
  // a file another session wrote after this one's last write is that session's now (this one reverted or stashed it)
  const all = Object.entries(out).flatMap(([r, fs_]) => fs_.map((f) => path.join(r, f)));
  if (all.length) {
    const self = path.basename(transcript).replace(/\.jsonl$/, '');
    const { lastWrites } = await import('./owners.mjs');
    const later = await lastWrites(all, { except: self });
    const mineAt = (abs) => [...last].find(([f]) => fold(f) === fold(abs))?.[1] || 0;
    for (const [r, fs_] of Object.entries(out)) { out[r] = fs_.filter((f) => !(later[path.join(r, f)] > mineAt(path.join(r, f)))); if (!out[r].length) delete out[r]; }
  }
  return out;
}
