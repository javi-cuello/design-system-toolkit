/*
 * Which Claude Code session owns a path, a commit or a worktree, so a session blocked by another's work can message it
 * (SendMessage to the name) instead of guessing. Read from what exists, never stored (toolkit-standard §D 17):
 *
 *   a path      the sessions whose transcripts (the last three days, ~/.claude/projects/<project>/<id>.jsonl) wrote it
 *               and have not committed it since (stop-items.mjs ownFiles)
 *   a commit    the session whose transcript shows git printing it ("[main 1a2b3c4d] …")
 *   a worktree  .claude/worktrees/agent-<id>: the session whose subagents/agent-<id>.jsonl it is
 *
 * Each is named as Claude Code's session registry names it (~/.claude/sessions, lock.mjs sessionName), or by id and
 * "not running". Unknown is said, never guessed: a commit made from a terminal has no transcript.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ownFiles } from './stop-items.mjs';
import { sessionName } from '../shared/lock.mjs';

const PROJECTS = () => process.env.TOOLKIT_TRANSCRIPTS || path.join(os.homedir(), '.claude', 'projects'); // projects-path: Claude Code's transcripts, not a toolkit project
const DAYS = 3;

/* The session transcripts written in the last few days: [{ id, file }]. */
export function transcripts(root = PROJECTS(), now = Date.now()) {
  const out = [];
  let dirs = [];
  try { dirs = fs.readdirSync(root); } catch { return out; }
  for (const d of dirs) {
    let files = [];
    try { files = fs.readdirSync(path.join(root, d)).filter((f) => f.endsWith('.jsonl')); } catch { continue; }
    for (const f of files) {
      const file = path.join(root, d, f);
      try { if (now - fs.statSync(file).mtimeMs < DAYS * 864e5) out.push({ id: f.replace(/\.jsonl$/, ''), file }); } catch { /* gone */ }
    }
  }
  return out;
}

// the transcripts naming any of these strings, by grep (fast over hundreds of MB), so only those are parsed
function naming(list, needles) {
  if (!list.length || !needles.length) return [];
  try {
    const hit = execFileSync('grep', ['-l', '-F', ...needles.flatMap((n) => ['-e', n]), ...list.map((t) => t.file)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 << 20 });
    const set = new Set(hit.split('\n').filter(Boolean));
    return list.filter((t) => set.has(t.file));
  } catch { return []; } // grep exits 1 when nothing matches
}

/* { path: [session label…] } for the absolute paths given, leaving out the session `except` (the asker). */
export async function ownersOf(paths, { except = '', root = PROJECTS() } = {}) {
  const out = {};
  const list = transcripts(root).filter((t) => t.id !== except);
  for (const t of naming(list, paths)) {
    const own = await ownFiles(t.file);
    for (const p of paths) if (own && own.has(p)) (out[p] ||= []).push(sessionName(t.id));
  }
  return out;
}

/* The session whose transcript shows git making this commit, or ''. */
export function commitOwner(short, { except = '', root = PROJECTS() } = {}) {
  const hit = naming(transcripts(root).filter((t) => t.id !== except), [` ${short}] `]);
  return hit.length ? sessionName(hit[0].id) : '';
}

/* The session that ran the agent whose worktree this is (.claude/worktrees/agent-<id>), or ''. */
export function worktreeOwner(dir, root = PROJECTS()) {
  const id = (path.basename(dir).match(/^agent-([0-9a-z]+)/) || [])[1];
  if (!id) return '';
  let dirs = [];
  try { dirs = fs.readdirSync(root); } catch { return ''; }
  for (const d of dirs) {
    let sessions = [];
    try { sessions = fs.readdirSync(path.join(root, d)); } catch { continue; } // a stray file (.DS_Store)
    for (const s of sessions) {
      const subs = path.join(root, d, s, 'subagents');
      let f = [];
      try { f = fs.readdirSync(subs); } catch { continue; }
      if (f.some((x) => x.startsWith(`agent-${id}`) || x.startsWith(`agent-a${id}`))) return sessionName(s);
    }
  }
  return '';
}

/* What of another session's sits in a repo: its uncommitted paths and its unpushed commits, each with that session,
   so a push or gate it blocks can say whom to message (SendMessage to the name). `except` is the asking session. */
export async function blockedBy(repo, except = process.env.CLAUDE_CODE_SESSION_ID || '') {
  const run = (args) => { try { return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return ''; } };
  const top = run(['rev-parse', '--show-toplevel']).trim() || repo;
  // -z: a path with a space or an accent comes unquoted; a rename's source follows it and is skipped
  const loose = [];
  const parts = run(['status', '--porcelain', '-z', '-unormal']).split('\0');
  for (let i = 0; i < parts.length; i++) { if (parts[i].length < 4) continue; loose.push(path.join(top, parts[i].slice(3))); if (/[RC]/.test(parts[i].slice(0, 2))) i++; }
  const out = [];
  const who = await ownersOf(loose, { except });
  const by = {};
  for (const [p, names] of Object.entries(who)) for (const n of names) (by[n] ||= []).push(path.relative(top, p));
  for (const [n, ps] of Object.entries(by)) out.push(`uncommitted, ${n}: ${ps.join(', ')}`);
  // a path no transcript wrote (a script's own write, a terminal) is left unnamed: the refusal that called this lists it
  for (const l of run(['log', '--format=%h %s', '@{u}..HEAD']).split('\n').filter(Boolean)) {
    const owner = commitOwner(l.split(' ')[0], { except });
    if (owner) out.push(`unpushed, ${owner}: ${l}`);
  }
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === (() => { try { return fs.realpathSync(process.argv[1]); } catch { return null; } })()) {
  const lines = await blockedBy(path.resolve(process.argv[2] || '.'));
  if (lines.length) console.log(`Another session's work is in this repo; message it (SendMessage to its name) rather than commit or remove it:\n${lines.map((l) => `  ${l}`).join('\n')}`);
}
