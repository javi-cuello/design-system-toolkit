/*
 * tools/claude-hooks/gates.mjs — the steps of the loop that were written down
 * and skipped: a plan before full-size work, an independent review after it
 * (and before a push), and, at its end, the toolkit question answered and
 * what stays open named (toolkit-standard §D 13).
 *
 * Every other hook here informs; these refuse, because informing was tried.
 * The maintainer had to ask for the review on 3 Oct ("I don't want to repeat
 * this"), and on 28 Oct an agent asked whether it had reviewed its work
 * answered "partly"; the maintainer's word for the job this replaces is
 * "nanny". A CLAUDE.md line is a guideline the model may judge does not apply
 * (Anthropic's best-practices page); a hook is not.
 *
 * Size is measured, never asked: the agent that treats a review as optional
 * also judges its own change small. Measured on the transcripts (the session's
 * and its subagents'), on disk for what a script writes, and with what an
 * earlier session left uncommitted, so a gate never asks whether a step was
 * done; it looks.
 * Half of the toolkit's commits since 1 Sep fall under the line.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { written } from './stop-items.mjs';
import { realPath, expandHome } from '../shared/real-path.mjs';
import { fileURLToPath } from 'node:url';
// the toolkit as a message names it: this checkout, ~ for the home folder
const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SHOWN = HERE.startsWith(os.homedir() + path.sep) ? '~' + HERE.slice(os.homedir().length) : HERE;

// Full-size work: more files or lines than this, or a standard or shared tool
// changed by more than WIDE_LINES (a typo there is small work). Drawn from the
// toolkit's history (293 commits since 1 Sep: 147 under it, 14 over 400 lines).
export const FILES = 3;
export const LINES = 100;
export const WIDE = /^(standards|tools\/shared)\//;
export const WIDE_LINES = 10;
// Bookkeeping that a change of any size carries; counting it made every
// skill edit "full" (version, changelog, cases).
const WORKTREE = /^\.claude\/worktrees\//;
const BOOKKEEPING = /(^|\/)(CHANGELOG\.md|README\.md)$|(^|\/)tests\/cases\.md$|^standards\/changelog\//;
// The plan's sections, each a heading; Before must hold bin/check's closing line, Impact impact.mjs's output.
export const PLAN = ['Before', 'Goal', 'Impact', 'Claims', 'Beyond scope', 'Budget', 'Review'];

/* Unreviewed work a session left uncommitted, kept for the next session in
   the same repo: two small halves in two sessions are one full-size change. */
const carryPath = () => path.join(os.tmpdir(), 'toolkit-gates-carry.json');
const WEEK = 7 * 24 * 3600 * 1000;

export const off = () => process.env.TOOLKIT_GATES === 'off' || !!process.env.TOOLKIT_EVAL_COPY;
export const planPath = (session) => path.join(os.tmpdir(), `toolkit-plan-${session || 'none'}.md`);
const statePath = (session) => path.join(os.tmpdir(), `toolkit-gates-${session || 'none'}.json`);

const empty = () => ({ files: {}, wide: [] });
const VERSION = 4;
// A state of a version listed here is carried forward; any other is read afresh, from the
// transcript's start, which on a long session outlasts the hook's timeout (2026-11-01 review).
const CARRIES = [3, VERSION];
const fresh = () => ({ version: VERSION, closedAt: '', turnStart: '', offsets: {}, total: empty(), since: empty(), docs: [], turnEdited: false, owed: false, measured: {}, denied: [], counted: {}, shell: {}, pre: {}, reviewing: [], checks: {}, checkedAt: {}, firstEdit: {}, inherited: empty(), cleared: [], reviewedAt: '' });
// Read afresh, the work a closed plan already ended stays ended: its edits are not counted again.
const closedBefore = (session) => { try { const pre = path.basename(planPath(session)).replace(/\.md$/, '-'); return fs.readdirSync(os.tmpdir()).map((f) => f.startsWith(pre) && Number(f.slice(pre.length).replace(/\.done\.md$/, ''))).filter(Boolean).reduce((a, b) => Math.max(a, b), 0); } catch { return 0; } };
const load = (session) => {
  try { const st = JSON.parse(fs.readFileSync(statePath(session), 'utf8')); if (CARRIES.includes(st.version)) return { ...fresh(), ...st, ...(st.version < 4 && { checks: {}, checkedAt: {}, firstEdit: {} }), version: VERSION }; } catch { /* none yet */ } // 3 kept one check for the session, 4 one per repo
  const at = closedBefore(session);
  return { ...fresh(), closedAt: at ? new Date(at).toISOString() : '' };
};
const save = (session, st) => { try { fs.writeFileSync(statePath(session), JSON.stringify(st)); } catch { /* read-only tmp: recomputed next call */ } };

/* A review is a fresh agent whose job is reviewing (its description says
   so) of the read-only Explore type, the code-review skill, or a review workflow. A fork
   shares the reasoning that wrote the code, and an implementer can describe
   itself as applying a review, so neither is one. */
export function isReview(c) {
  const i = c.input || {};
  // read-only by type, so "apply the review's fixes" (an implementer) is not one
  if (c.name === 'Agent' || c.name === 'Task') return /review/i.test(i.description || '') && i.subagent_type === 'Explore';
  if (c.name === 'Skill') return /review/i.test(i.skill || '');
  if (c.name === 'Workflow') return /review/i.test(`${i.name || ''} ${i.scriptPath || ''} ${(i.script || '').slice(0, 400)}`);
  return false;
}

const lineCount = (s) => (s ? String(s).split('\n').length : 0);
/* Lines a rewrite changes: those in one version and not the other. */
export function lineDiff(a, b) {
  const count = new Map();
  for (const l of String(a).split('\n')) count.set(l, (count.get(l) || 0) + 1);
  let added = 0;
  for (const l of String(b).split('\n')) { const n = count.get(l) || 0; if (n) count.set(l, n - 1); else added++; }
  const removed = [...count.values()].reduce((n, x) => n + x, 0);
  return Math.max(added, removed);
}
function changed(c, measured = {}) {
  if (c.id && measured[c.id] !== undefined) return measured[c.id];
  const i = c.input || {};
  // the lines that differ, not the anchor: a typo fixed inside a 20-line old_string is one line
  if (c.name === 'Edit') return lineDiff(i.old_string || '', i.new_string || '');
  if (c.name === 'MultiEdit') return (i.edits || []).reduce((n, e) => n + lineDiff(e.old_string || '', e.new_string || ''), 0);
  if (c.name === 'Write') return lineCount(i.content); // a new file; a rewrite is measured before it lands
  if (c.name === 'NotebookEdit') return lineCount(i.new_source);
  return 0; // a shell write: the file counts, its lines cannot be read from the call
}

/* Which ecosystem repo a file is in, and its path there; null outside.
   On-disk spelling: a shell that entered through ~/projects names ~/Projects
   files in lower case, and a new file (or folder) has no spelling yet: its
   nearest existing ancestor does. */
function disk(f) {
  let head = path.resolve(f), tail = '';
  while (!fs.existsSync(head) && path.dirname(head) !== head) { tail = path.join(path.basename(head), tail); head = path.dirname(head); }
  return path.join(realPath(head), tail);
}
function where(raw, repos) {
  const file = disk(raw);
  const r = repos.map(realPath).find((d) => file === d || file.startsWith(d + path.sep));
  return r ? { repo: r, rel: path.relative(r, file), file } : null;
}

/* What a shell command writes, read strictly: quoted text and heredoc bodies
   removed first, so code inside them (a `=>`, an awk `$2>400`) is never a
   target. stop-items' written() is looser on purpose; a gate that refuses
   cannot be. A write it cannot see (a script's own open()) is found on disk
   after the call (scriptWrites). */
const bareShell = (cmd) => String(cmd || '').replace(/<<-?\s*['"]?(\w+)['"]?([^\n]*)\n[\s\S]*?\n\1\b/g, '$2').replace(/'[^']*'|"[^"]*"/g, "''");
const shellDir = (bare, cwd) => path.resolve(cwd, expandHome((bare.match(/^\s*cd\s+([^\s;&|]+)\s*&&/) || [])[1] || '.'));
/* The files an in-place sed edits, each command read as words: a line (a
   backslash continuation joined) or ; & | ends it; a redirect and its target
   are not operands (the redirect matcher reads those); the script is -e/-f's
   or the first operand, and every operand after it is a file. BSD's `-i ''`
   holds the empty suffix. Several files, flags before -i and --in-place are
   all read: a write missed loosens the gate. */
function sedFiles(bare, held) {
  const files = [];
  for (const m of bare.replace(/\\\r?\n/g, ' ').matchAll(/(?:^|[;&|(\s])sed\s+([^;&|\n]*)/gm)) {
    const words = m[1].replace(/\d?(?:>>?|<)&?\s*[^\s<>]*/g, ' ').trim().split(/\s+/).filter(Boolean);
    let inPlace = false, script = false;
    const ops = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w === '--in-place' || w.startsWith('--in-place=') || /^-[^-]*i/.test(w)) {
        inPlace = true;
        // BSD: `-i ''` or `-i .bak` (a held quote or a dot word) is the suffix, not the script
        if (/^-[^-]*i$/.test(w) && /^\0\d+\0$/.test(words[i + 1] || '') && !held[words[i + 1].slice(1, -1)]) i++;
        if (/^-[^-]*e$|^-[^-]*f$/.test(w)) { script = true; i++; }
      } else if (/^-[^-]*[ef]$|^--(?:expression|file)$/.test(w)) { script = true; i++; }
      else if (/^--(?:expression|file)=/.test(w)) script = true;
      else if (!w.startsWith('-')) ops.push(w);
    }
    if (inPlace) files.push(...(script ? ops : ops.slice(1)));
  }
  return files;
}
export function shellWrites(cmd, cwd) {
  const base = shellDir(bareShell(cmd), cwd);
  // a quoted word is held as one opaque token, so a target written in quotes
  // (another repo's path, a name with spaces) is still read, and code inside
  // quotes still never is (2026-10-30 review)
  const held = [];
  const bare = String(cmd || '').replace(/<<-?\s*['"]?(\w+)['"]?([^\n]*)\n[\s\S]*?\n\1\b/g, '$2')
    .replace(/'([^']*)'|"([^"]*)"/g, (_, a, b) => `\0${held.push(a ?? b) - 1}\0`);
  const word = (t) => t.replace(/\0(\d+)\0/g, (_, k) => held[k]).replace(/^\$HOME(?=$|\/)/, '~');
  const out = [...bare.matchAll(/(?:^|[\s;&|(])\d?>>?\s*([^\s;&|()<>]+)/g)].map((m) => m[1]);
  for (const m of bare.matchAll(/\btee\s+(?:-a\s+)?([^\s;&|]+)/g)) out.push(m[1]);
  out.push(...sedFiles(bare, held));
  const files = out.map(word);
  // cp and mv, where a command starts (a line, after ; & | ( or git, or a word that runs the next:
  // sudo, xargs, then, do, else, time, env X=1, command, nohup, exec), write their target (the last
  // operand, or -t's), or each source by name inside it when it is a folder; mv also takes away each
  // source, except a rename in place (its source's folder is its target's), counted once.
  // Operands end at a newline, a comment or a redirect (its fd digit too)
  for (const m of bare.replace(/(^|\s)#[^\n]*/g, '$1').matchAll(/(?:^|[;&|(]|\b(?:sudo|xargs|then|do|else|time|command|nohup|exec|env))(?:\s+-\S+)*(?:\s+\w+=\S*)*\s*(?:git\s+)?\b(cp|mv)\s+([^;&|()<>\n#]+)/gm)) {
    const args = m[2].replace(/\s\d$/, '').trim().split(/\s+/);
    const t = args.findIndex((a) => a === '-t' || a.startsWith('--target-directory'));
    const target = t < 0 ? null : args[t].includes('=') ? args.splice(t, 1)[0].split('=')[1] : args.splice(t, 2)[1];
    const ops = args.filter((a) => !a.startsWith('-')).map(word);
    if (target) ops.push(word(target) + '/');
    if (ops.length < 2 && !target) continue;
    const to = ops.pop(), dir = path.resolve(base, expandHome(to));
    let isDir = to.endsWith('/');
    try { isDir ||= fs.statSync(dir).isDirectory(); } catch { /* a new name */ }
    // a source that is not a name ($f in a loop, xargs's {}), or none: the folder itself
    files.push(...(isDir && ops.length ? ops.map((s) => (/[$]|\{\}/.test(s) ? to : path.join(to, path.basename(s)))) : [to]));
    if (m[1] === 'mv') files.push(...ops.filter((o) => isDir || path.dirname(path.resolve(base, expandHome(o))) !== path.dirname(dir)));
  }
  return files.filter((f) => f && !/^(\/dev\/|&)|\$/.test(f) && /[\w.-]/.test(f)).map((f) => path.resolve(base, expandHome(f)));
}
// git (by any path), its own options (-C dir, -c k=v, --git-dir x, --no-pager, -p), then push; a dry run sends nothing
const PUSH = /(?:^|[;&|(]\s*|\s)(?:\S*\/)?git((?:\s+(?:-[Cc]\s+\S+|--(?:git-dir|work-tree|namespace)\s+\S+|--[\w-]+(?:=\S+)?|-[pP]))*)\s+push\b([^;&|]*)/;
export const isPush = (cmd) => { const m = bareShell(cmd).match(PUSH); return !!m && !/--dry-run|\s-n\b/.test(m[2]); };
/* The repo a push sends: its -C folder, else where the command runs. */
const pushDir = (cmd, cwd) => { const bare = bareShell(cmd); const m = bare.match(PUSH); const c = (m?.[1] || '').match(/-C\s+(\S+)/); return path.resolve(shellDir(bare, cwd), expandHome(c ? c[1] : '.')); };

/* The uncommitted files among these: { file: true }. A repo git cannot read
   holds nothing uncommitted. */
function dirty(files) {
  const out = {};
  const byRepo = new Map();
  for (const f of files) {
    // the repo is the nearest folder holding .git: one git call per repo, not per folder
    let top = path.dirname(f);
    while (!fs.existsSync(path.join(top, '.git')) && path.dirname(top) !== top) top = path.dirname(top);
    if (fs.existsSync(path.join(top, '.git'))) byRepo.set(top, (byRepo.get(top) || []).concat(path.relative(top, f)));
  }
  for (const [repo, list] of byRepo) {
    const g = spawnSync('git', ['-C', repo, '-c', 'core.quotePath=off', 'status', '--porcelain', '-z', '--', ...list.map((r) => `:(literal)${r}`)], { encoding: 'utf8', maxBuffer: 1 << 26 });
    if (g.status !== 0) continue;
    const entries = g.stdout.split('\0');
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (e.length < 4) continue;
      if (e[0] === 'R' || e[0] === 'C') i++;
      out[path.join(realPath(repo), e.slice(3))] = true;
    }
  }
  return out;
}

/* Lines each tracked file in a repo differs from its last commit by, from
   one git call (renames off, so a moved file is its two halves). */
function diffs(repo) {
  const lines = {};
  const g = spawnSync('git', ['-C', repo, '-c', 'core.quotePath=off', 'diff', '--numstat', '--no-renames', '-z', 'HEAD'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  for (const e of (g.stdout || '').split('\0')) { const m = e.match(/^(\d+|-)\t(\d+|-)\t(.+)$/); if (m) lines[path.join(repo, m[3])] = Math.max(+m[1] || 0, +m[2] || 0); }
  return { repo, lines };
}

/* What a shell call's own code wrote (a python or node script's open(), a
   generator, a formatter): the repo's uncommitted files whose time on disk
   falls inside the call, each by what its diff grew beyond the snapshot the
   edit hook took before the call ran. A review launched after the call
   covers it, a subagent's call too (its file is read after the session's). Another session writing the same repo
   in the same seconds is counted too: the error is toward a review. */
function scriptWrites(st, win, repos) {
  const before = win.pre;
  const repo = before?.repo || where(win.dir, repos)?.repo;
  if (!repo) return;
  const g = spawnSync('git', ['-C', repo, 'status', '--porcelain', '-uall', '-z'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (g.status !== 0) return;
  const entries = g.stdout.split('\0');
  let now;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.length < 4) continue;
    if (e[0] === 'R' || e[0] === 'C') i++; // a rename's old name follows
    const rel = e.slice(3), file = path.join(repo, rel);
    let t;
    try { t = fs.statSync(file).mtimeMs; } catch { try { t = fs.statSync(path.dirname(file)).mtimeMs; } catch { continue; } } // deleted: its folder changed
    // from the snapshot taken as the call began (a Write in the same message lands before it), else the call's record
    if (t < (before ? before.at : win.start - 1000) || t > win.end) continue;
    if (path.basename(rel) === 'README.md' && !st.docs.includes(file)) st.docs.push(file);
    if (BOOKKEEPING.test(rel)) continue;
    now ||= diffs(repo).lines;
    let lines = now[file];
    if (lines === undefined) try { lines = lineCount(fs.readFileSync(file, 'utf8')); } catch { lines = 0; } // untracked: all of it
    // an untracked file that was there before has no count to start from: all of it, toward a review
    const n = Math.max(0, lines - (before?.lines[file] || 0));
    if (n && !(st.firstEdit[repo] <= new Date(t).toISOString())) st.firstEdit[repo] = new Date(t).toISOString(); // the earliest, whichever file is read first
    for (const a of [st.total, st.since]) {
      a.files[file] = (a.files[file] || 0) + n;
      if (WIDE.test(rel) && !a.wide.includes(file)) a.wide.push(file);
    }
    if (win.this) st.turnEdited = true;
  }
}

/* The carry file: { session: { at, files: { file: lines }, wide } }, each
   session's own unreviewed, uncommitted lines. Written whole and renamed, so a
   reader never sees half of it; two sessions stopping in the same instant can
   still lose one's update, which its next stop writes again. */
function readCarry() {
  try {
    const all = JSON.parse(fs.readFileSync(carryPath(), 'utf8'));
    for (const [id, c] of Object.entries(all)) {
      const ok = c && c.files && typeof c.files === 'object' && !Array.isArray(c.files) && Object.values(c.files).every(Number.isFinite) && Array.isArray(c.wide) && Date.now() - c.at < WEEK;
      if (!ok) delete all[id];
    }
    return all && typeof all === 'object' && !Array.isArray(all) ? all : {};
  } catch { return {}; }
}
function writeCarry(all) {
  const tmp = `${carryPath()}.${process.pid}`;
  try { fs.writeFileSync(tmp, JSON.stringify(all)); fs.renameSync(tmp, carryPath()); } catch { /* read-only tmp */ }
}

/* What other sessions left unreviewed and still uncommitted in the repo this
   session works in (a hook runs in the session's folder), read afresh at each
   gate so work another session has since reviewed or committed drops out.
   It is measured with this session's own work, never pushed by it. */
function inherit(st, session, repos, cwd) {
  st.inherited = empty();
  const here = where(cwd, repos);
  if (!here) return;
  const theirs = Object.entries(readCarry()).filter(([id]) => id !== session)
    .flatMap(([, c]) => Object.keys(c.files).filter((f) => f.startsWith(here.repo + path.sep)).map((f) => [f, c]));
  if (!theirs.length) return;
  const open = dirty([...new Set(theirs.map(([f]) => f))]);
  for (const [f, c] of theirs) {
    if (!open[f]) continue;
    st.inherited.files[f] = (st.inherited.files[f] || 0) + c.files[f];
    if (c.wide.includes(f) && !st.inherited.wide.includes(f)) st.inherited.wide.push(f);
  }
}
const plus = (a, b) => {
  const files = { ...a.files };
  for (const [f, n] of Object.entries(b.files)) files[f] = (files[f] || 0) + n;
  return { files, wide: [...new Set([...a.wide, ...b.wide])] };
};

/* At each stop: this session's own unreviewed lines are kept, and what its
   reviews covered (its own and what it inherited) leaves every entry. */
function carry(session, st) {
  const all = readCarry();
  const before = JSON.stringify(all);
  for (const c of Object.values(all)) for (const f of st.cleared) delete c.files[f];
  st.cleared = [];
  // committed work leaves every entry
  const open = dirty([...new Set([...Object.keys(st.since.files), ...Object.values(all).flatMap((c) => Object.keys(c.files))])]);
  for (const c of Object.values(all)) for (const f of Object.keys(c.files)) if (!open[f]) delete c.files[f];
  const files = Object.fromEntries(Object.entries(st.since.files).filter(([f, n]) => open[f] && n > 0));
  if (Object.keys(files).length) all[session] = { at: Date.now(), files, wide: st.since.wide.filter((f) => files[f] !== undefined) };
  else delete all[session];
  for (const [id, c] of Object.entries(all)) if (!Object.keys(c.files).length) delete all[id];
  if (JSON.stringify(all) !== before) writeCarry(all);
}

const writes = (c, cwd) => (c.name === 'Bash' ? shellWrites(c.input?.command, cwd) : written(c, cwd));

/* Count a call's writes; returns [file, lines] for each, so a failed call can be taken back. */
function add(st, c, cwd, repos, sub = false) {
  const got = [];
  for (const f of writes(c, cwd)) {
    const w = where(f, repos);
    // a background agent's edits in its own worktree are counted when its branch is merged, not as it writes them;
    // the session's own edits in a worktree count like any other
    if (w && sub && WORKTREE.test(w.rel)) continue;
    if (w && path.basename(w.rel) === 'README.md' && !st.docs.includes(w.file)) st.docs.push(w.file);
    if (!w || BOOKKEEPING.test(w.rel)) continue;
    const n = changed(c, st.measured);
    got.push([w.file, n]);
    for (const a of [st.total, st.since]) {
      a.files[w.file] = (a.files[w.file] || 0) + n;
      if (WIDE.test(w.rel) && !a.wide.includes(w.file)) a.wide.push(w.file);
    }
  }
  return got;
}

/* The READMEs that describe the work's files and were not touched with them:
   the nearest README.md above each file, inside its repo. A README the work
   left alone may still be right; the agent says so or fixes it (§D 22). */
export function staleDocs(st, repos) {
  const roots = repos.map(realPath);
  const out = new Set();
  for (const f of Object.keys(st.total.files)) {
    const root = roots.find((d) => f.startsWith(d + path.sep));
    for (let dir = path.dirname(f); root && dir.startsWith(root); dir = path.dirname(dir)) {
      const readme = path.join(dir, 'README.md');
      if (!fs.existsSync(readme)) { if (dir === root) break; continue; }
      if (!st.docs.includes(readme)) out.add(readme);
      break;
    }
  }
  return [...out];
}

function uncount(st, id) {
  for (const [f, n] of st.counted[id]) for (const a of [st.total, st.since]) {
    if (a.files[f] === undefined) continue;
    a.files[f] -= n;
    if (a.files[f] <= 0) { delete a.files[f]; a.wide = a.wide.filter((x) => x !== f); }
  }
  delete st.counted[id];
}

export function size(a) {
  const files = Object.keys(a.files).length;
  const lines = Object.values(a.files).reduce((n, x) => n + x, 0);
  const wide = a.wide.some((f) => (a.files[f] || 0) > WIDE_LINES);
  const why = [files > FILES && `${files} files`, lines > LINES && `${lines} lines`, wide && 'a standard or shared tool'].filter(Boolean);
  return { files, lines, full: why.length > 0, why };
}

/* A person's message, as opposed to the harness's: a background task's
   notification or a reminder arrives as a user record too, and counting it
   ended a turn in the middle of the work, and a Stop block's own feedback
   record let the next stop through without the step (28 Oct review). */
const SYSTEM = /^\s*(<(task-notification|system-reminder|agent-message)|Another Claude session|Stop hook feedback|\[Request interrupted)/;
function personSpoke(rec) {
  if (rec.type !== 'user' || rec.isMeta || rec.isCompactSummary) return false;
  // the harness marks a person's prompt; the rest (a Stop block's feedback, a skill's body, an image) are its own
  if (rec.origin !== undefined) return rec.origin?.kind === 'human';
  const c = rec.message?.content;
  const text = typeof c === 'string' ? c : Array.isArray(c) ? c.filter((x) => x.type === 'text').map((x) => x.text).join('\n') : '';
  return !!text && !SYSTEM.test(text);
}

function record(st, line, repos, sub) {
  if (!line) return;
  let rec;
  try { rec = JSON.parse(line); } catch { return; }
  if (!sub && personSpoke(rec)) { st.turnEdited = false; st.turnStart = rec.timestamp || ''; return; }
  const content = rec.message?.content;
  if (st.closedAt && rec.timestamp && rec.timestamp < st.closedAt) return; // work a closed plan ended
  // a background review is running until its notification names its call; one that
  // arrives mid-turn is a queued attachment (or queue record), not a user message
  const note = rec.type === 'user' ? (typeof content === 'string' ? content : Array.isArray(content) ? content.map((x) => (typeof x.text === 'string' ? x.text : '')).join('\n') : '')
    : rec.type === 'attachment' ? String(rec.attachment?.prompt || '') : rec.type === 'queue-operation' ? String(rec.content || '') : '';
  if (note.includes('<task-notification>')) {
    const text = note;
    for (const m of text.matchAll(/<tool-use-id>([^<]+)<\/tool-use-id>/g)) {
      st.reviewing = st.reviewing.filter((r) => r.id !== m[1]);
      if (m[1] in st.checks && /<status>completed<\/status>|exit code/.test(text)) checked(st, m[1], rec);
    }
  }
  if (rec.type === 'user' && Array.isArray(content)) {
    for (const r of content) {
      if (r.type !== 'tool_result') continue;
      // a call that failed or was refused changed nothing: take back what it added
      if (r.is_error && st.counted[r.tool_use_id]) uncount(st, r.tool_use_id);
      const sh = st.shell[r.tool_use_id];
      // a subagent's call that ended before the session's last review is that review's
      if (sh && !st.denied.includes(r.tool_use_id) && !(sub && st.reviewedAt && rec.timestamp && rec.timestamp < st.reviewedAt)) scriptWrites(st, { ...sh, pre: st.pre[r.tool_use_id], end: Date.parse(rec.timestamp) || Date.now() }, repos);
      if (sh) { delete st.shell[r.tool_use_id]; delete st.pre[r.tool_use_id]; }
      // a foreground review is done when its result comes back; a background one only says it was launched
      const out = typeof r.content === 'string' ? r.content : (r.content || []).map((x) => x.text || '').join('\n');
      // the repo's check, run and its closing line come back (a background run's comes with its notification)
      if (r.tool_use_id in st.checks) { if (CHECK_END.test(out)) checked(st, r.tool_use_id, rec); else if (!/^\s*Command running in background/.test(out)) delete st.checks[r.tool_use_id]; }
      if (!/^\s*Async agent launched/.test(out)) st.reviewing = st.reviewing.filter((x) => x.id !== r.tool_use_id);
    }
    return;
  }
  if (rec.type !== 'assistant' || !Array.isArray(content)) return;
  for (const c of content) {
    if (c.type !== 'tool_use' || st.denied.includes(c.id)) continue;
    // a subagent's own reviews are not the session's; its edits are
    if (!sub && isReview(c)) {
      if (size(st.since).full) st.owed = true;
      st.cleared.push(...Object.keys(st.since.files), ...Object.keys(st.inherited?.files || {})); st.inherited = empty();
      st.since = empty(); st.reviewedAt = rec.timestamp || '';
      if (c.id) st.reviewing.push({ id: c.id, at: Date.parse(rec.timestamp) || Date.now() });
      continue;
    }
    // a shell call's own code may write anything: its span is checked on disk when its result is in
    // the repo's own check, run in that repo: a run elsewhere is that repo's
    if (!sub && c.name === 'Bash' && c.id && CHECK_RUN.test(bareShell(c.input?.command))) { const d = checkDir(bareShell(c.input?.command), rec.cwd || process.cwd()); st.checks[c.id] = (d && where(d, repos)?.repo) || ''; }
    if (c.name === 'Bash' && c.id) st.shell[c.id] = { start: Date.parse(rec.timestamp) || Date.now(), dir: shellDir(bareShell(c.input?.command), rec.cwd || process.cwd()), this: !sub || !rec.timestamp || rec.timestamp > st.turnStart };
    if (c.id && st.counted[c.id]) continue; // counted when the plan gate saw it pending
    if (sub && st.reviewedAt && rec.timestamp && rec.timestamp < st.reviewedAt) continue; // a subagent's edit the session's review already covered
    const got = add(st, c, rec.cwd || process.cwd(), repos, sub);
    // a subagent's file is read after the session's, so an edit it made before the person spoke is not this turn's
    for (const [f] of got) { const r = where(f, repos)?.repo; const at = rec.timestamp || new Date().toISOString(); if (r && !(st.firstEdit[r] <= at)) st.firstEdit[r] = at; }
    if (got.length) { if (!sub || !rec.timestamp || rec.timestamp > st.turnStart) st.turnEdited = true; if (c.id) st.counted[c.id] = got; }
  }
}

/* Read a transcript from where the last call stopped, so a hook on every edit
   stays cheap on a session of hundreds of MB. */
function readFrom(st, file, repos, sub, persist) {
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(1 << 23);
  let rest = Buffer.alloc(0);
  try {
    let pos = st.offsets[file] || 0;
    if (fs.fstatSync(fd).size < pos) pos = 0; // a new file under the same name
    for (let n; (n = fs.readSync(fd, buf, 0, buf.length, pos)) > 0;) {
      pos += n;
      const chunk = Buffer.concat([rest, buf.subarray(0, n)]);
      let start = 0;
      for (let i = chunk.indexOf(10); i >= 0; i = chunk.indexOf(10, start)) { record(st, chunk.toString('utf8', start, i), repos, sub); start = i + 1; }
      rest = chunk.subarray(start);
      st.offsets[file] = pos - rest.length; persist(); // a hook killed mid-read resumes here, not at 0
    }
    st.offsets[file] = pos - rest.length; // a line still being written is read next time
  } finally { fs.closeSync(fd); }
}

/* The session's transcript and its subagents': work a subagent does is the
   session's work, and leaving it out was the widest way round every gate. */
export function advance(session, transcript, repos, st = load(session, repos)) {
  if (!transcript || !fs.existsSync(transcript)) return st;
  const persist = () => save(session, st);
  readFrom(st, transcript, repos, false, persist);
  const subs = path.join(transcript.replace(/\.jsonl$/, ''), 'subagents');
  let list = [];
  try { list = fs.readdirSync(subs).filter((f) => f.endsWith('.jsonl')); } catch { /* none */ }
  for (const f of list) readFrom(st, path.join(subs, f), repos, true, persist);
  // a review that never reported back (killed with its session) stops being waited on after a day
  st.reviewing = st.reviewing.filter((r) => Date.now() - r.at < 24 * 3600 * 1000);
  for (const [id, sh] of Object.entries(st.shell)) if (Date.now() - sh.start > 24 * 3600 * 1000) { delete st.shell[id]; delete st.pre[id]; }
  for (const [id, p] of Object.entries(st.pre)) if (!st.shell[id] && Date.now() - p.at > 24 * 3600 * 1000) delete st.pre[id];
  save(session, st);
  return st;
}

/* What the plan lacks: a missing section, a Before without bin/check's closing line
   and §D 0's three questions, or an Impact that is not impact.mjs's output. */
const section = (text, h) => {
  const m = text.match(new RegExp(`^(#+)\\s*${h}\\b[^\\n]*\\n`, 'im'));
  if (!m) return '';
  const rest = text.slice(m.index + m[0].length), end = rest.search(new RegExp(`^#{1,${m[1].length}}\\s`, 'm'));
  return end < 0 ? rest : rest.slice(0, end);
};
// each repo's check ends on one of these: the toolkit's ("green…", "== N FAILED…"), and the projects' own
// ("== all green", "== FAILURES above", "RED")
const CHECK_END = /^[\s>*`=-]*(green\b|all green\b|[1-9]\d* FAILED\b|FAILURES above\b|RED\b)/m;
// run as a command, not named as an argument (`cat bin/check` reads it)
const CHECK_RUN = /(^|[\n;&|(]\s*)(?:[^\s;&|()]*\/)?bin\/check(?![\w.-])/;
/* The repo a check ran in: the folder its path names (`~/Projects/x/bin/check`), else the
   last `cd` or `pushd` before it, joined by `&&`, `;` or inside `( )`, else the call's own folder; null, so no repo
   is credited, when that folder cannot be read (`cd "$X"`, `cd -`). */
function checkDir(bare, cwd) {
  const m = bare.match(/(^|[\n;&|(]\s*)((?:[^\s;&|()]*\/)?)bin\/check(?![\w.-])/);
  let dir = cwd;
  for (const [, d] of bare.slice(0, m ? m.index : 0).matchAll(/(?:^|[\s;&|(])(?:cd|pushd)\s+([^\s;&|()]+)/g)) {
    if (d === "''" || d === '-' || d.includes('$')) return null;
    dir = path.resolve(dir, expandHome(d));
  }
  return m && m[2] ? path.resolve(dir, expandHome(m[2])) : dir;
}
/* A check whose closing line came back: it counts for the repo it ran in, once per piece of work. */
function checked(st, id, rec) {
  const repo = st.checks[id]; delete st.checks[id];
  if (repo !== undefined && !st.checkedAt[repo]) st.checkedAt[repo] = rec.timestamp || new Date().toISOString();
}
const planGaps = (text, st = {}, work = []) => [...PLAN.filter((h) => !new RegExp(`^#+\\s*${h}\\b`, 'im').test(text)).map((h) => `the ${h} section`),
  ...work.filter((r) => !st.checkedAt?.[r]).map((r) => `a bin/check run in ${r} whose closing line came back (pasted text alone is not a run; output redirected to a file, or cut to a preview, hides that line: pipe it through tail; run it as the command, not behind time or env)`),
  ...(work.some((r) => st.checkedAt?.[r] && st.firstEdit?.[r] && st.checkedAt[r] > st.firstEdit[r]) && !/^\W*late\W*:/im.test(section(text, 'Before')) ? ['a "late:" line under Before: the check ran after the work\'s first edit, so say what that edit may have hidden'] : []),
  ...(CHECK_END.test(section(text, 'Before')) ? [] : ["bin/check's closing line under Before (\"green…\", \"== N FAILED…\" or the project's own, pasted from the run before the work)"]),
  ...(['§D 1', '§D 2', '§D 5'].every((q) => new RegExp(`${q}(?!\\d)`).test(section(text, 'Before'))) ? [] : ['the answers to §D 1, §D 2 and §D 5 under Before']),
  ...(/\(\d+ readers?\)/.test(text) ? [] : ["impact.mjs's output under Impact (its \"(N readers)\" lines, pasted, not summarised)"])];

/* PreToolUse: measures a rewrite against the file it replaces, then refuses
   the call that makes the session's work full-size until the plan exists. */
export function planGate(session, transcript, repos, call, cwd, sub = false) {
  if (off()) return null;
  const st = load(session);
  // what a shell call's repo holds before it runs, so its script's writes are measured from here
  if (call.name === 'Bash' && call.id) { const r = where(shellDir(bareShell(call.input?.command), cwd), repos); if (r) st.pre[call.id] = { ...diffs(r.repo), at: Date.now() }; }
  if (call.name === 'Write' && call.id) {
    const f = call.input?.file_path;
    try { if (f && fs.existsSync(f)) st.measured[call.id] = lineDiff(fs.readFileSync(f, 'utf8'), call.input.content || ''); } catch { /* unreadable: counted whole */ }
  }
  const plan = planPath(session);
  advance(session, transcript, repos, st);
  // the repos the work is in: those its files are in, and the one this call writes
  const work = [...new Set([...Object.keys(st.total.files), ...writes(call, cwd)].map((f) => where(f, repos)?.repo).filter(Boolean))];
  const gaps = fs.existsSync(plan) ? planGaps(fs.readFileSync(plan, 'utf8'), st, work) : null;
  const planned = gaps !== null && !gaps.length;
  inherit(st, session, repos, cwd);
  // a push carries the work out of reach of the review: unreviewed full-size work stays home
  if (call.name === 'Bash' && isPush(call.input?.command)) {
    // only the pushed repo's work: unreviewed work elsewhere does not hold this one back
    const repo = where(pushDir(call.input.command, cwd), repos)?.repo;
    const files = Object.fromEntries(Object.entries(st.since.files).filter(([f]) => repo && f.startsWith(repo + path.sep)));
    const s = size({ files, wide: st.since.wide.filter((f) => files[f] !== undefined) });
    const why = s.full ? `${s.why.join(', ')} changed since the last independent review` : st.reviewing.length ? 'a review is still running' : '';
    if (why) {
      if (call.id) { st.denied.push(call.id); delete st.pre[call.id]; }
      save(session, st);
      return `Not pushed: ${why}, and full-size work is reviewed before it leaves the machine (toolkit-standard §D 13). ${s.full ? 'Run the review (the Stop gate\'s terms: fresh Explore agents with "review" in the description), fix what is real, then push.' : 'Wait for its report, fix what is real, then push.'}`;
    }
  }
  if (planned) { save(session, st); return null; }
  // the call may already be in the transcript (it is written before its hook runs): then it is counted, and judged as it stands
  const pending = { ...st, total: plus(st.total, st.inherited), since: empty(), docs: [...st.docs] };
  const already = call.id && st.counted[call.id];
  if (!already && !add(pending, call, cwd, repos, sub).length) { save(session, st); return null; }
  const s = size(pending.total);
  if (!s.full) { save(session, st); return null; }
  if (call.id) { st.denied.push(call.id); delete st.pre[call.id]; if (st.counted[call.id]) uncount(st, call.id); } // a refused call never ran, so it never counts
  save(session, st);
  const files = Object.keys(pending.total.files);
  return `This work is full-size (${s.why.join(', ')}), so it is planned before it is built (toolkit-standard §D 13). ${gaps ? `The plan at ${plan} lacks ${gaps.join(' and ')}; complete it` : `Write the plan to ${plan}`}, then retry this call. Sections, each a heading:\n`
    + `  ## Before — the closing line of the repo's bin/check run before the work, pasted ("green…", "== N FAILED…", or the project's own), and the answers to §D 1, §D 2 and §D 5 (does the toolkit own this job; would the next project want it; is a new reader about stored state or the present)\n`
    + `  ## Goal — what done means\n`
    + `  ## Impact — the output of: node ${SHOWN}/tools/claude-hooks/impact.mjs ${files.map((f) => JSON.stringify(f)).join(' ')} <and the files still to come>; what each reader needs\n`
    + `  ## Claims — each claim the output's correctness or the work's scope rests on (a tool's limit, an API's behaviour, a file's state, what a test proves): checked (the probe run or the primary source read) or only believed, what being wrong would cost, and the check that settles a believed one before work rests on it; a "cannot" that would drop or shrink the work is probed first\n`
    + `  ## Beyond scope — what nearby is broken, missing or stale, and whether this change fixes it (no loose ends: what is not fixed is named and why)\n`
    + `  ## Budget — agent time, review rounds\n`
    + `  ## Review — who reviews which area\n`
    + `Then tell the user the plan in a few lines and carry on: it is the work's contract, not a request for approval.`;
}

/* A closed piece of work: its window empties and its plan is put aside, so
   the next full-size work plans afresh. */
function close(session, st) {
  st.since = empty(); st.total = empty(); st.docs = [];
  st.checks = {}; st.checkedAt = {}; st.firstEdit = {}; // the next piece of work runs its own check
  st.closedAt = new Date().toISOString();
  const plan = planPath(session);
  try { if (fs.existsSync(plan)) fs.renameSync(plan, plan.replace(/\.md$/, `-${Date.now()}.done.md`)); } catch { /* left in place: it still holds */ }
}


/* Stop: a turn that edited, whose edits since the last review are full-size,
   ends only after a review; work a review closed ends with the toolkit
   question answered and what stays open named. */
export function stopGate(session, transcript, repos, lastMessage, cwd = process.cwd()) {
  if (off()) return null;
  const st = advance(session, transcript, repos);
  inherit(st, session, repos, cwd);
  // another session's unreviewed work in this repo is measured with this one's
  const s = size(plus(st.since, st.inherited));
  if (st.turnEdited && s.full) {
    carry(session, st); save(session, st);
    const dirs = [...new Set(Object.keys(plus(st.since, st.inherited).files).map((f) => repos.map(realPath).find((d) => f.startsWith(d + path.sep))).filter(Boolean))];
    // the person sees this too: short, the method in §D 13
    return `Not done yet: ${s.why.join(', ')} changed since the last review (toolkit-standard §D 13). `
      + `Run the checks, then fresh read-only reviewers (Explore, never a fork, "review" in the description) on the diff (git -C ${dirs.join(' / git -C ')} diff) and the plan at ${planPath(session)}, one area each. `
      + `Fix what is real; repeat until no new High. End with "Toolkit:", "Open:" and "Docs:" lines.`;
  }
  // a review still running has not closed the work: launching one is not finishing (28 Oct, the gate's first run)
  if (st.owed && !st.reviewing.length) {
    const stale = staleDocs(st, repos);
    const missing = ['Toolkit', 'Open', ...(stale.length ? ['Docs'] : [])].filter((k) => !new RegExp(`^\\W*${k}\\W*:`, 'im').test(lastMessage || ''));
    if (missing.length) {
      carry(session, st); save(session, st);
      return `Reviewed full-size work ends with ${missing.map((k) => `a line starting "${k}:"`).join(' and ')} (§D 13): `
        + `"Toolkit:" what goes back to the toolkit, or "nothing"; "Open:" what is left and why, or "nothing"`
        + (stale.length ? `; "Docs:" whether each of these READMEs is updated or still right: ${stale.join(', ')}` : '') + '.';
    }
    // the work is closed: the next full-size work plans afresh
    st.owed = false; close(session, st);
  }
  // small work that is committed closes its window: a day of small fixes must not add up to a review of work already shipped
  if (!size(st.since).full && Object.keys(st.since.files).length && !Object.keys(dirty(Object.keys(st.since.files))).length) close(session, st);
  // after any close, so closed work is not handed on as unreviewed
  carry(session, st);
  save(session, st);
  return null;
}
