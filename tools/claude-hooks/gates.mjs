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
import { stateDir } from './state-dir.mjs';
import { spawnSync } from 'node:child_process';
import { written } from './stop-items.mjs';
import { realPath, expandHome } from '../shared/real-path.mjs';
import { fileURLToPath } from 'node:url';
import { rulesOf, citations } from '../toolkit-check/rules.mjs';
import { holder, describe, sessionName } from '../shared/lock.mjs';
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
// A worktree under a repo (.claude/worktrees/<name>) is a repo of its own: its tree, branch, size, check and
// review are its own (one worktree per piece of work, tools/shared/worktree.mjs). agent-<id> ones are background
// subagents' (Claude Code's isolation), counted when their branch is merged.
const IN_WORKTREE = /^\.claude\/worktrees\/([^/]+)(?:\/|$)/;
const subagentTree = (w) => !!w?.worktree && w.worktree.startsWith('agent-');
// A worktree a background subagent writes in that it made itself (bin/worktree: diag-<cause>) is the agent's work: its
// writes count as ever, so its landing (bin/land, the push gate) needs their review, but the session's own gates (the
// Stop review demand, the plan gate) leave that tree to the agent, which is still at work (2026-11-21: counted as the
// session's, those gates fired on agents mid-work and on shelved branches: six reviews of unfinished diffs, five forced
// WIP commits in one night; counting it only at landing let a branch land unreviewed, so it is counted as written).
// (never a tree the session writes in itself: a fork or helper in the session's own worktree leaves it the session's)
// a review's prompt names a tree by its whole path (never diag-x for diag-x-2): followed by a separator, a quote or its end
const named = (said, repo) => new RegExp(`${repo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w.-])`).test(said);
// a worktree a subagent works in that the session does not: where its pre-review work is still judged by its tree
const agentsDir = (st, f, repos) => { const w = where(f, repos); return !!w?.worktree && !(st.ownTrees || []).includes(w.repo); };
const agentsTree = (st, f, repos) => { const w = where(f, repos); return !!w?.worktree && (st.agentTrees || []).includes(w.repo) && !(st.ownTrees || []).includes(w.repo); };
const sessionsOwn = (st, a, repos) => { const files = Object.fromEntries(Object.entries(a.files).filter(([f]) => !agentsTree(st, f, repos))); return { files, wide: a.wide.filter((f) => files[f] !== undefined) }; };
const BOOKKEEPING = /(^|\/)(CHANGELOG\.md|README\.md)$|(^|\/)tests\/cases\.md$|^standards\/changelog\//;
// The plan's sections, each a heading; Aim is the main goal the work serves, as agreed with the person, kept unchanged
// from piece to piece; Before must hold bin/check's closing line, Measure the goal measured
// end to end before any part is built, Impact impact.mjs's output.
export const PLAN = ['Before', 'Aim', 'Goal', 'Measure', 'Impact', 'Claims', 'Beyond scope', 'Budget', 'Review'];

/* Unreviewed work a session left uncommitted, kept for the next session in
   the same repo: two small halves in two sessions are one full-size change. */
const carryPath = () => path.join(stateDir(), 'toolkit-gates-carry.json');

const KEPT = /^toolkit-(plan-.+\.md|gates-.+\.json|pending-.+)$/;
/* At a session's start: what an older gate left in $TMPDIR moves here, never over a file already here (copied where the
   two are on different volumes), and finished plans (by when they finished, the time in their name), the state and the
   handed-over items of sessions gone a month are removed, since no reboot sweeps this folder. A session idle longer
   than that starts its gates afresh; its open plan is kept, though the start stops listing it after two weeks. */
export { stateDir };
export function sweepState(from = os.tmpdir(), to = stateDir(), days = 30) {
  const list = (d) => { try { return fs.readdirSync(d); } catch { return []; } };
  if (path.resolve(from) !== path.resolve(to)) for (const n of list(from).filter((n) => KEPT.test(n))) {
    const a = path.join(from, n), b = path.join(to, n);
    try {
      if (fs.existsSync(b)) continue;
      try { fs.renameSync(a, b); } catch (e) { if (e.code !== 'EXDEV') throw e; fs.copyFileSync(a, b); const st = fs.statSync(a); fs.utimesSync(b, st.atime, st.mtime); fs.rmSync(a); }
    } catch { /* busy: the next start */ }
  }
  const cut = Date.now() - days * 864e5;
  for (const n of list(to)) {
    const done = n.match(/^toolkit-plan-.+-(\d{12,})\.done\.md$/);
    if (!done && !/^toolkit-gates-(?!carry).+\.json$|^toolkit-pending-/.test(n)) continue;
    try { if ((done ? Number(done[1]) : fs.statSync(path.join(to, n)).mtimeMs) < cut) fs.rmSync(path.join(to, n)); } catch { /* gone already */ }
  }
}
const WEEK = 7 * 24 * 3600 * 1000;

export const off = () => process.env.TOOLKIT_GATES === 'off' || !!process.env.TOOLKIT_EVAL_COPY;
export const planPath = (session) => path.join(stateDir(), `toolkit-plan-${session || 'none'}.md`);
const statePath = (session) => path.join(stateDir(), `toolkit-gates-${session || 'none'}.json`);

const empty = () => ({ files: {}, wide: [] });
const VERSION = 4;
// A state of a version listed here is carried forward; any other is read afresh, from the
// transcript's start, which on a long session outlasts the hook's timeout (2026-11-01 review).
const CARRIES = [3, VERSION];
const fresh = () => ({ version: VERSION, closedAt: '', turnStart: '', offsets: {}, total: empty(), since: empty(), docs: [], turnEdited: false, owed: false, measured: {}, denied: [], counted: {}, shell: {}, pre: {}, reviewing: [], checks: {}, checkedAt: {}, firstEdit: {}, inherited: empty(), cleared: [], reviewedAt: '', wrote: {} });
// Read afresh, the work a closed plan already ended stays ended: its edits are not counted again.
const closedBefore = (session) => { try { const pre = path.basename(planPath(session)).replace(/\.md$/, '-'); return fs.readdirSync(stateDir()).map((f) => f.startsWith(pre) && Number(f.slice(pre.length).replace(/\.done\.md$/, ''))).filter(Boolean).reduce((a, b) => Math.max(a, b), 0); } catch { return 0; } };
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
  if (!r) return null;
  const m = path.relative(r, file).match(IN_WORKTREE);
  if (!m) return { repo: r, rel: path.relative(r, file), file };
  const repo = path.join(r, '.claude', 'worktrees', m[1]);
  return { repo, rel: path.relative(repo, file), file, worktree: m[1] };
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
  // by any path (`/usr/bin/sed`, Homebrew's gsed), in a subshell or backticks; a comment is no operand
  for (const m of bare.replace(/\\\r?\n/g, ' ').replace(/(^|\s)#[^\n]*/g, '$1').matchAll(/(?:^|[;&|(`\s/\\])g?sed\s+([^;&|()`\n]*)/gm)) {
    const words = m[1].replace(/\d?(?:>>?|<)&?\s*[^\s<>]*/g, ' ').trim().split(/\s+/).filter(Boolean);
    let inPlace = false, script = false, dot = null;
    const ops = [];
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (w === '--') { ops.push(...words.slice(i + 1)); break; }
      // a script stuck to its flag (-e's/a/b/, -fscript.sed) is the script, read before -i could take it
      if (/^-[a-zA-Z]*?[ef]./.test(w) && !/^-[a-zA-Z]*?i/.test(w.slice(0, w.search(/[ef]/) + 1))) script = true;
      else if (w === '--in-place' || w.startsWith('--in-place=') || /^-[^-]*i/.test(w)) {
        inPlace = true;
        // BSD: `-i ''` or `-i .bak` (a held quote or a dot word) is the suffix, not the script
        if (/^-[^-]*i$/.test(w) && (/^\0\d+\0$/.test(words[i + 1] || '') ? !held[words[i + 1].slice(1, -1)] : !script && /^\.\w+$/.test(words[i + 1] || '') && (dot = words[i + 1]))) i++;
        if (/^-[^-]*e$|^-[^-]*f$/.test(w)) { script = true; i++; }
      } else if (/^-[^-]*[ef]$|^--(?:expression|file)$/.test(w)) { script = true; i++; }
      else if (/^--(?:expression|file)=/.test(w)) script = true;
      else if (!w.startsWith('-')) ops.push(w);
    }
    // a dot word taken for BSD's suffix with no file left was GNU's file (`sed -i .env -e …`)
    const named = script ? ops : ops.slice(1);
    if (inPlace) files.push(...(named.length || !dot ? named : [dot]));
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
// bin/land is the push of a worktree's branch (tools/shared/land.mjs): the same review holds it
const LAND = /(?:^|[\n;&|(]\s*)(?:[^\s;&|()]*\/)?bin\/land(?![\w.-])(?:[ \t]+([^\s;&|()-][^\s;&|()]*))?/;
export const isPush = (cmd) => { const b = bareShell(cmd); if (LAND.test(b) && !/bin\/land[ \t]+--queue\b/.test(b)) return true; const m = b.match(PUSH); return !!m && !/--dry-run|\s-n\b/.test(m[2]); };
/* The repo a push sends: its -C folder, else where the command runs. */
const pushDir = (cmd, cwd, repos = []) => { const bare = bareShell(cmd); const l = bare.match(LAND); if (l && !bare.match(PUSH)) { const d = shellDir(bare, cwd); if (!l[1]) return d;
    const asPath = path.resolve(d, expandHome(l[1]));
    if (fs.existsSync(asPath) || /^[/~.]/.test(l[1])) return asPath;
    // a branch name: the worktree git has it checked out in, else its work name's folder under the main checkout
    const wl = spawnSync('git', ['-C', d, 'worktree', 'list', '--porcelain'], { encoding: 'utf8' });
    let at = null; for (const x of (wl.status === 0 ? wl.stdout : '').split('\n')) { if (x.startsWith('worktree ')) at = x.slice(9); else if (x === `branch refs/heads/${l[1]}`) return at; }
    const home = repos.filter((r) => d === r || d.startsWith(r + path.sep)).sort((a, b) => b.length - a.length)[0] || d.replace(/\/\.claude\/worktrees\/.*$/, '');
    return path.join(home, '.claude', 'worktrees', l[1].replace(/^worktree-/, '')); } const m = bare.match(PUSH); const c = (m?.[1] || '').match(/-C\s+(\S+)/); return path.resolve(shellDir(bare, cwd), expandHome(c ? c[1] : '.')); };

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
    // kept across closes, bookkeeping included: the Stop hook's own-uncommitted check reads it (scriptWritten)
    // (a subagent's script in a worktree it writes is the agent's: never the session's to commit, gated at its landing)
    const agents = win.sub && agentsDir(st, file, repos);
    if (agents && !(st.agentTrees ||= []).includes(repo)) st.agentTrees.push(repo);
    if (!agents) (st.wrote ||= {})[file] = Math.max(st.wrote[file] || 0, t);
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
    .flatMap(([, c]) => Object.keys(c.files).filter((f) => where(f, repos)?.repo === here.repo).map((f) => [f, c]));
  if (!theirs.length) return;
  const open = dirty([...new Set(theirs.map(([f]) => f))]);
  for (const [f, c] of theirs) {
    if (!open[f]) continue;
    st.inherited.files[f] = (st.inherited.files[f] || 0) + c.files[f];
    if (c.wide.includes(f) && !st.inherited.wide.includes(f)) st.inherited.wide.push(f);
  }
}
/* Whose unreviewed work, inherited, counts in this session's size: each session by name and its files, so it can be
   messaged rather than its work reviewed or committed here. */
function theirs(st, session) {
  const inherited = Object.keys(st.inherited?.files || {});
  if (!inherited.length) return '';
  const by = [];
  for (const [id, c] of Object.entries(readCarry())) {
    if (id === session) continue;
    const fs_ = Object.keys(c.files).filter((f) => inherited.includes(f));
    if (fs_.length) by.push(`${sessionName(id)}: ${fs_.map((f) => path.basename(f)).join(', ')}`);
  }
  return by.length ? ` Part of this is another session's uncommitted work, counted here; message it (SendMessage to its name) to review or commit its own — ${by.join('; ')}.` : '';
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
    if (w && sub && subagentTree(w)) continue;
    if (w && sub && w.worktree && !(st.agentTrees ||= []).includes(w.repo)) st.agentTrees.push(w.repo);
    if (w && !sub && w.worktree && !(st.ownTrees ||= []).includes(w.repo)) st.ownTrees.push(w.repo);
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
  // a worktree is a root of its own, found before the repo that holds it
  const roots = [...new Set([...Object.keys(st.total.files).map((f) => where(f, repos)?.repo).filter(Boolean), ...repos].map(realPath))].sort((a, b) => b.length - a.length);
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
  // a guide it could not read is not worth blocking the turn over: the README list above still stands
  for (const root of roots) try { for (const f of citing(st, root)) out.add(f); } catch { /* skip */ }
  return [...out];
}

/* The guides and READMEs that cite a rule the work changed: a standard's text
   moved under them, and a gloss of it is checked by nobody else (§D 22). The
   rules changed are those whose lines differ from the commit before the work's
   first edit, committed or not. */
const GUIDES = /(^|\/)(README|CONTRIBUTING|CLAUDE)\.md$|^docs\/.*\.md$/;
export function citing(st, root) {
  const git = (...a) => { const r = spawnSync('git', ['-C', root, ...a], { encoding: 'utf8', maxBuffer: 64 << 20 }); return r.status === 0 ? r.stdout : ''; };
  const at = st.firstEdit?.[root] || Object.entries(st.firstEdit || {}).find(([r]) => realPath(r) === root)?.[1];
  const base = at && git('rev-list', '-1', `--before=${at}`, 'HEAD').trim();
  if (!base) return [];
  const changed = {};
  for (const f of Object.keys(st.total.files)) {
    const m = f.startsWith(root + path.sep) && f.slice(root.length + 1).match(/^standards\/([a-z]+-standard)\.md$/);
    if (!m || !fs.existsSync(f)) continue;
    const rules = rulesOf(m[1], fs.readFileSync(f, 'utf8'));
    if (!rules) continue;
    const text = fs.readFileSync(f, 'utf8');
    const lineOf = (i) => text.slice(0, i).split('\n').length;
    // the label a reader would search for: a part and handle in a parted standard, a bare number in a numbered one
    const spans = rules.map((r) => [r.handle, lineOf(r.index), lineOf(r.index + r.block.length - 1), (r.part.match(/^Part ([A-Z])\b/) || [])[1]]);
    for (const h of git('diff', '--no-ext-diff', '--no-color', '-U0', base, '--', m[0]).matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
      const from = +h[1], to = from + Math.max(1, h[2] === undefined ? 1 : +h[2]) - 1;
      for (const [handle, a, b, part] of spans) if (from <= b && to >= a) (changed[m[1]] ||= new Map()).set(handle, part ? `§${part} ${handle}` : `rule ${handle}`);
    }
  }
  if (!Object.keys(changed).length) return [];
  const out = [];
  for (const rel of git('ls-files', '-z').split('\0').filter((x) => GUIDES.test(x))) {
    const file = path.join(root, rel);
    if (st.docs.includes(file) || st.total.files[file] !== undefined || !fs.existsSync(file)) continue;
    const hits = citations(fs.readFileSync(file, 'utf8')).filter((c) => changed[c.std]?.has(c.handle));
    if (hits.length) out.push(`${file} (cites ${[...new Set(hits.map((c) => `${c.std} ${changed[c.std].get(c.handle)}`))].join(', ')})`);
  }
  return out;
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
      if (sh && !st.denied.includes(r.tool_use_id) && !(sub && st.reviewedAt && rec.timestamp && rec.timestamp < st.reviewedAt && !agentsDir(st, sh.dir, repos))) scriptWrites(st, { ...sh, pre: st.pre[r.tool_use_id], end: Date.parse(rec.timestamp) || Date.now() }, repos);
      if (sh) { delete st.shell[r.tool_use_id]; delete st.pre[r.tool_use_id]; }
      // a foreground review is done when its result comes back; a background one only says it was launched
      const out = typeof r.content === 'string' ? r.content : (r.content || []).map((x) => x.text || '').join('\n');
      // the repo's check, run and its closing line come back (a background run's comes with its notification, and so
      // does a foreground run the tool's timeout moved to the background, whose message words it differently)
      if (r.tool_use_id in st.checks) { if (CHECK_END.test(out)) checked(st, r.tool_use_id, rec); else if (!/^\s*Command running in background|^\s*Command did not complete within its \d+s timeout and was moved to the background/.test(out)) delete st.checks[r.tool_use_id]; }
      if (!/^\s*Async agent launched/.test(out)) st.reviewing = st.reviewing.filter((x) => x.id !== r.tool_use_id);
    }
    return;
  }
  if (rec.type !== 'assistant' || !Array.isArray(content)) return;
  for (const c of content) {
    if (c.type !== 'tool_use' || st.denied.includes(c.id)) continue;
    // a subagent's own reviews are not the session's; its edits are
    if (!sub && isReview(c)) {
      if (size(sessionsOwn(st, st.since, repos)).full) st.owed = true;
      // an agent's tree the review never named keeps its lines: they are still owed a review before its branch lands
      const said = JSON.stringify(c.input || {});
      const kept = Object.keys(st.since.files).filter((f) => agentsTree(st, f, repos) && !named(said, where(f, repos).repo));
      const keep = { files: Object.fromEntries(kept.map((f) => [f, st.since.files[f]])), wide: st.since.wide.filter((f) => kept.includes(f)) };
      st.cleared.push(...Object.keys(st.since.files).filter((f) => !kept.includes(f)), ...Object.keys(st.inherited?.files || {})); st.inherited = empty();
      st.since = keep; st.reviewedAt = rec.timestamp || '';
      if (c.id) st.reviewing.push({ id: c.id, at: Date.parse(rec.timestamp) || Date.now() });
      continue;
    }
    // a shell call's own code may write anything: its span is checked on disk when its result is in
    // the repo's own check, run in that repo: a run elsewhere is that repo's
    // a subagent's run counts as the session's (a background agent that spans turns ran it), except in its own
    // worktree, whose tree is not the repo's
    if (c.name === 'Bash' && c.id && CHECK_RUN.test(bareShell(c.input?.command))) { const d = checkDir(bareShell(c.input?.command), rec.cwd || process.cwd()); const w = d && where(d, repos); if (!(sub && subagentTree(w))) st.checks[c.id] = w?.repo || ''; }
    if (c.name === 'Bash' && c.id) st.shell[c.id] = { start: Date.parse(rec.timestamp) || Date.now(), dir: shellDir(bareShell(c.input?.command), rec.cwd || process.cwd()), this: !sub || !rec.timestamp || rec.timestamp > st.turnStart, sub };
    if (c.id && st.counted[c.id]) continue; // counted when the plan gate saw it pending
    // a subagent's edit the session's review already covered (one in a worktree is judged by its tree: the review may not have named it)
    if (sub && st.reviewedAt && rec.timestamp && rec.timestamp < st.reviewedAt && !writes(c, rec.cwd || process.cwd()).some((f) => agentsDir(st, f, repos))) continue;
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
  restored(st, repos);
  // a review that never reported back (killed with its session) stops being waited on after a day
  st.reviewing = st.reviewing.filter((r) => Date.now() - r.at < 24 * 3600 * 1000);
  for (const [id, sh] of Object.entries(st.shell)) if (Date.now() - sh.start > 24 * 3600 * 1000) { delete st.shell[id]; delete st.pre[id]; }
  for (const [id, p] of Object.entries(st.pre)) if (!st.shell[id] && Date.now() - p.at > 24 * 3600 * 1000) delete st.pre[id];
  save(session, st);
  return st;
}

/* Files this session changed and then put back: nothing uncommitted, and no commit touching them since the session's
   first edit in their repo. They are not work: counting them held a one-line fix for a review of a 198-line report a
   check had rewritten and the session had restored (20 Nov 2026). */
function restored(st, repos) {
  const files = Object.keys(st.since.files);
  if (!files.length) return;
  const open = dirty(files);
  const byRepo = {};
  for (const f of files) {
    if (open[f] || !fs.existsSync(f)) continue; // a file gone or never written is not one put back
    const w = where(f, repos);
    if (w && st.firstEdit?.[w.repo]) (byRepo[w.repo] ||= []).push([f, w.rel]);
  }
  // two git calls a repo, not one a file: this runs at every hook call
  for (const [repo, list] of Object.entries(byRepo)) {
    const g = (...a) => { const r = spawnSync('git', ['-C', repo, '--literal-pathspecs', ...a], { encoding: 'utf8', maxBuffer: 64 << 20 }); return r.status === 0 ? r.stdout : null; };
    const tracked = g('ls-files', '-z', '--', ...list.map(([, r]) => r));
    // git dates are whole seconds: a commit in the second of the first edit counts as after it
    const since = g('log', '-z', `--since=${new Date(Date.parse(st.firstEdit[repo]) - 2000).toISOString()}`, '--name-only', '--format=', '--', ...list.map(([, r]) => r));
    if (tracked === null || since === null) continue;
    const isTracked = new Set(tracked.split('\0')), committed = new Set(since.split(/[\0\n]/));
    for (const [f, rel] of list) {
      if (!isTracked.has(rel) || committed.has(rel)) continue; // untracked: not known to be put back; committed since: work
      for (const a of [st.since, st.total]) { delete a.files[f]; a.wide = a.wide.filter((x) => x !== f); }
    }
  }
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
// (a project's bin/check, tools/project-check/check.mjs, closes "toolkit gates: green" or "toolkit gates: N RED")
const CHECK_END = /^[\s>*`=-]*(?:toolkit gates: )?(green\b|all green\b|[1-9]\d* FAILED\b|FAILURES above\b|(?:[1-9]\d* )?RED\b)/m;
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
// a repo whose check has a quick mode (the toolkit's): the one named before the work
const quickOf = (r) => { try { return fs.readFileSync(path.join(r, 'bin', 'check'), 'utf8').includes('--quick'); } catch { return false; } };
const planGaps = (text, st = {}, work = [], changed = Infinity) => [
  // a plan kept from a piece already closed: reviewed for this one before it starts (its Goal for this piece, its Impact on
  // the files this one touches, its Measure), or marked done and a new one written
  ...(st.closedAt && changed < Date.parse(st.closedAt) ? [`a review of the kept plan for this piece: it was written for work closed at ${st.closedAt}; update its Goal, Measure and Impact for this piece under the same Aim (or, if this work serves another aim, mark it "Status: done" and write a new plan)`] : []),
  ...PLAN.filter((h) => !new RegExp(`^#+\\s*${h}\\b`, 'im').test(text)).map((h) => `the ${h} section`),
  ...work.filter((r) => !st.checkedAt?.[r] && fs.existsSync(path.join(r, 'bin', 'check'))).map((r) => `a bin/check run in ${r} whose closing line came back (${quickOf(r) ? `\`cd ${r} && bin/check --quick 2>&1 | tail -2\`: under a minute, no measuring lock, enough before the work; bin/land runs the full one; ` : ''}pasted text alone is not a run; output redirected to a file, or cut to a preview, hides that line: pipe it through tail; run it as the command, not behind time or env)`),
  ...(work.some((r) => st.checkedAt?.[r] && st.firstEdit?.[r] && st.checkedAt[r] > st.firstEdit[r]) && !/^\W*late\W*:/im.test(section(text, 'Before')) ? ['a "late:" line under Before: the check ran after the work\'s first edit, so say what that edit may have hidden'] : []),
  // the closing line is asked for only where a repo the work touches has a check to close
  ...(!work.some((r) => fs.existsSync(path.join(r, 'bin', 'check'))) || CHECK_END.test(section(text, 'Before')) ? [] : ["bin/check's closing line under Before (\"green…\", \"== N FAILED…\" or the project's own, pasted from the run before the work)"]),
  ...(['§D 1', '§D 2', '§D 5'].every((q) => new RegExp(`${q}(?!\\d)`).test(section(text, 'Before'))) ? [] : ['the answers to §D 1, §D 2 and §D 5 under Before']),
  // top-down: the whole goal is measured before a part is built, so parts are chosen by what the measure says (14 Nov)
  ...(/^\W*before\W*:[ \t*_`"(-]*(?!(?:tbd|todo|later|n\/a)(?![a-z0-9]))[a-z0-9]/im.test(section(text, 'Measure')) ? [] : ['a "before:" line under Measure: the goal measured end to end before any part is built — the command and what it said']),
  ...(/\(\d+ readers?\)/.test(text) ? [] : ["impact.mjs's output under Impact (its \"(N readers)\" lines, pasted, not summarised)"]),
  ...methodGaps(text)];

/* A method agreed with the person, kept by the gate rather than by memory (2026-11-19, "make the method mechanical"):
   an Aim that lists one (a line starting "Method", then bullets) has each bullet's lead term ("Top-down:") ticked by
   every piece, in a line under Method starting with the piece's label (the Goal's first line, up to its colon), and a
   Course review, a zoom-out, at least every third course line or once a day. A plan whose Aim lists none is untouched. */
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const plain = (s) => s.replace(/[*_`]/g, '');
// "course: …" and "course (2026-11-19, Phase 14): …" alike
const COURSE = /^\W*course\b[^:\n]{0,80}:/im;
export const methodTerms = (aim) => {
  const m = aim.match(/^\W*method\b\s*[,:(\u2014-][^\n]*\n((?:[ \t]*\n)*(?:[ \t]*(?:[-*]|\d+[.)])[^\n]*(?:\n|$))+)/im);
  return m ? [...m[1].matchAll(/^[ \t]*(?:[-*]|\d+[.)])\s+([^:\n]{1,40}):[*_`]*(?=\s|$)/gm)].map((x) => plain(x[1]).trim()).filter(Boolean) : [];
};
const localDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export function methodGaps(text, today = new Date()) {
  const aim = section(text, 'Aim');
  const terms = methodTerms(aim);
  if (!terms.length) return [];
  // the Aim may list its method under its own "### Method": the piece's Method section is read from the rest
  const rest = aim ? text.replace(aim, '\n') : text;
  const gaps = [];
  const goal = section(rest, 'Goal');
  const label = plain((goal.split('\n').map((l) => l.trim()).find((l) => l && !COURSE.test(l)) || '').split(':')[0].replace(/^[\s>#-]+/, '')).trim();
  const ticks = label ? section(rest, 'Method').split('\n').map((l) => plain(l).replace(/^[\s>#-]+/, '')).filter((l) => l.startsWith(label) && /^\s*:/.test(l.slice(label.length))) : [];
  const unmet = (l) => terms.filter((t) => !new RegExp(`(?<![\\w-])${esc(t)}\\s*:`, 'i').test(l.slice(label.length + 1)));
  const missing = ticks.map(unmet).sort((a, b) => a.length - b.length)[0] || terms;
  if (missing.length) gaps.push(`a tick line under a Method section for this piece: one line starting "${label || 'the Goal\'s first piece label'}:" that answers each method term the Aim lists (${missing.map((t) => `"${t}:"`).join(', ')}): how this piece kept it, or why not`);
  const courses = (goal.match(new RegExp(COURSE.source, 'gim')) || []).length;
  const last = [...section(rest, 'Course review').matchAll(/(\d{4}-\d{2}-\d{2})[^\n]*?\bafter\s+(\d+)/gi)].map((x) => ({ date: x[1], n: Number(x[2]) })).sort((a, b) => b.n - a.n || b.date.localeCompare(a.date))[0];
  const day = localDay(today);
  if (!last || last.n > courses || courses - last.n >= 3 || (last.date < day && courses > last.n)) gaps.push(`a Course review entry, "${day}, after ${courses}: …" (${courses} is the course lines under Goal now): zoom out before the next edit, as the Aim's method asks — the measure's trend across pieces, whether the method still holds, and what to stop (${last ? `the last was ${last.date}, after ${last.n}` : 'none yet'}; one is due every third course line or once a day)`);
  return gaps;
}

/* The files a shell call's own code wrote this session (found on disk, as scriptWrites finds them), with when: the
   transcript shows only redirects and sed -i, so a python or cp edit is known here alone. { file: ms } */
export function scriptWritten(session) {
  try { return JSON.parse(fs.readFileSync(statePath(session), 'utf8')).wrote || {}; } catch { return {}; }
}

/* A refused shell call is refused whole: what else it carried did not run either (a plan's end lines were lost with a
   refused push on 2026-11-20). */
export const compound = (call) => call.name === 'Bash' && bareShell(call.input?.command).replace(/\\;/g, '').trim().split(/&&|\|\||;|\n/).filter((x) => x.trim()).length > 1
  ? ' None of this command\'s other parts ran: it was refused whole, so run them again on their own.' : '';

/* PreToolUse: measures a rewrite against the file it replaces, then refuses
   the call that makes the session's work full-size until the plan exists. */
/* A repo that lands through bin/land is edited in a worktree, one per piece of work, never in its main checkout:
   sessions sharing one working tree waited on and blocked one another all day (20 Nov 2026). A session that edited the
   main checkout before this rule finishes its work there. The worktrees this session made are named, so a session
   that moves between pieces of work goes back to the right one. TOOLKIT_WORKTREES=off turns it off. */
function intoMain(st, call, cwd, repos, session) {
  if (process.env.TOOLKIT_WORKTREES === 'off') return null;
  for (const f of writes(call, cwd)) {
    const w = where(f, repos);
    if (!w || w.worktree || /^\.(claude|git)(\/|$)/.test(w.rel) || !fs.existsSync(path.join(w.repo, 'bin', 'land'))) continue;
    if (spawnSync('git', ['-C', w.repo, 'check-ignore', '-q', '--', w.rel]).status === 0) continue; // an ignored file is no one's work
    if (st.firstEdit?.[w.repo]) continue;
    let mine = [];
    try { mine = JSON.parse(fs.readFileSync(path.join(w.repo, '.git', 'worktree-sessions.json'), 'utf8'))[session] || []; } catch { /* none yet */ }
    const have = mine.filter((n) => fs.existsSync(path.join(w.repo, '.claude', 'worktrees', n)));
    return `${w.repo} is worked on in a worktree, one per piece of work, never in its main checkout, which other sessions share. `
      + `Make or reopen the one for this work, named for the work (e.g. check-cache): ${path.join(w.repo, 'bin', 'worktree')} <work-name> — it prints its folder. `
      + `Then write ${path.join('<folder>', w.rel)} instead, run checks there, commit on its branch, and land with bin/land from the folder.`
      + (have.length ? ` This session's worktrees: ${have.join(', ')}.` : '');
  }
  return null;
}

/* A worktree made by hand, outside .claude/worktrees, in a repo with bin/land: the sweep cannot tell its owner or park
   it, and one session made fifteen such, one per attempt, then combined them by hand (2026-11-20). bin/worktree makes
   one per piece of work where the sweep looks, and bin/land batches several branches into one check. A subagent's
   isolation worktree is made by Claude Code, never by a shell call, so a subagent's call is held the same way.
   TOOLKIT_WORKTREES=off turns it off. */
const WT_ADD = /(?:^|[\n;&|(]\s*)(?:\w+=\S*\s+)*git(?:\s+-C\s+(\S+)|\s+-c\s+\S+|\s+--no-pager)*\s+worktree\s+add\b([^\n;&|]*)/;
function strayWorktree(call, cwd, repos, sub) {
  if (process.env.TOOLKIT_WORKTREES === 'off' || call.name !== 'Bash') return null;
  const bare = bareShell(call.input?.command || ''), m = bare.match(WT_ADD);
  if (!m) return null;
  const d = shellDir(bare, cwd), at = m[1] ? path.resolve(d, expandHome(m[1])) : d;
  const w = where(at, repos);
  const home = w && (w.worktree ? w.repo.replace(/\/\.claude\/worktrees\/[^/]+$/, '') : w.repo);
  if (!home || !fs.existsSync(path.join(home, 'bin', 'land'))) return null;
  // the folder: the first argument that is neither an option nor an option's value, read from the command as written
  // (the bare form blanks quoted text, and a quoted path is still a path)
  const raw = String(call.input?.command || '').match(WT_ADD);
  const args = ((raw && raw[2]) || m[2]).match(/"[^"]*"|'[^']*'|\S+/g) || []; let folder = null;
  for (let i = 0; i < args.length; i++) { if (/^(-[bB]|--reason)$/.test(args[i])) { i++; continue; } if (args[i].startsWith('-')) continue; folder = args[i].replace(/^["']|["']$/g, ''); break; }
  const real = (p) => { try { return fs.realpathSync(p); } catch { return p; } };
  const layout = path.join(home, '.claude', 'worktrees'), into = folder && path.resolve(at, expandHome(folder));
  if (into && (into.startsWith(layout + path.sep) || real(path.dirname(into)) === real(layout))) return null;
  return `Not made: a worktree in ${home} is made with ${path.join(home, 'bin', 'worktree')} <work-name>, one per piece of work, in .claude/worktrees where the sweep finds it, never by hand elsewhere. `
    + 'Several attempts at one piece of work are commits on its one branch; several pieces each get a worktree and land with bin/land, which checks them together, so nothing is combined by hand.';
}

export function planGate(session, transcript, repos, call, cwd, sub = false) {
  if (off()) return null;
  let h;
  const st = load(session);
  // what a shell call's repo holds before it runs, so its script's writes are measured from here
  if (call.name === 'Bash' && call.id) { const r = where(shellDir(bareShell(call.input?.command), cwd), repos); if (r) st.pre[call.id] = { ...diffs(r.repo), at: Date.now() }; }
  if (call.name === 'Write' && call.id) {
    const f = call.input?.file_path;
    try { if (f && fs.existsSync(f)) st.measured[call.id] = lineDiff(fs.readFileSync(f, 'utf8'), call.input.content || ''); } catch { /* unreadable: counted whole */ }
  }
  const plan = planPath(session);
  advance(session, transcript, repos, st);
  const away = intoMain(st, call, cwd, repos, session) || strayWorktree(call, cwd, repos, sub);
  if (away) { if (call.id) { st.denied.push(call.id); delete st.pre[call.id]; } save(session, st); return away; }
  // the repos the work is in: those its files are in, and the one this call writes
  // the repos whose check the plan needs: the session's own work, never an agent's tree it left to the agent
  const work = [...new Set([...Object.keys(sessionsOwn(st, st.total, repos).files), ...writes(call, cwd).filter((f) => !sub || !agentsTree(st, f, repos))].map((f) => where(f, repos)?.repo).filter(Boolean))];
  const gaps = fs.existsSync(plan) ? planGaps(fs.readFileSync(plan, 'utf8'), st, work, fs.statSync(plan).mtimeMs) : null;
  const planned = gaps !== null && !gaps.length;
  inherit(st, session, repos, cwd);
  // a push carries the work out of reach of the review: unreviewed full-size work stays home
  if (call.name === 'Bash' && isPush(call.input?.command)) {
    // only the pushed repo's work: unreviewed work elsewhere does not hold this one back
    const repo = where(pushDir(call.input.command, cwd, repos), repos)?.repo;
    const files = Object.fromEntries(Object.entries(st.since.files).filter(([f]) => repo && where(f, repos)?.repo === repo));
    const s = size({ files, wide: st.since.wide.filter((f) => files[f] !== undefined) });
    const why = s.full ? `${s.why.join(', ')} changed since the last independent review` : st.reviewing.length ? 'a review is still running' : '';
    if (why) {
      if (call.id) { st.denied.push(call.id); delete st.pre[call.id]; }
      save(session, st);
      // what the next review must cover: the edits since the last one credited (a review is credited when launched)
      const since = Object.entries(files).sort((a, b) => b[1] - a[1]).map(([f, n]) => `${path.relative(repo, f)} (${n})`);
      const list = s.full ? ` Changed since the last review${st.reviewedAt ? ` (launched ${st.reviewedAt.slice(0, 16).replace('T', ' ')})` : ''}, lines: ${since.slice(0, 10).join(', ')}${since.length > 10 ? ` and ${since.length - 10} more` : ''}.` : '';
      return `Not pushed: ${why}, and full-size work is reviewed before it leaves the machine (toolkit-standard §D 13).${list} ${s.full ? 'Run the review on these (the Stop gate\'s terms: fresh Explore agents with "review" in the description), fix what is real, then push.' : 'Wait for its report, fix what is real, then push.'}${compound(call)}`;
    }
  }
  if (planned) { save(session, st); return null; }
  // the call may already be in the transcript (it is written before its hook runs): then it is counted, and judged as it stands
  const pending = { ...st, total: plus(st.total, st.inherited), since: empty(), docs: [...st.docs] };
  const already = call.id && st.counted[call.id];
  if (!already && !add(pending, call, cwd, repos, sub).length) { save(session, st); return null; }
  // a subagent writing a worktree is the agent's own work, gated when its branch lands
  // (a file outside every repo, a scratch file, is nobody's work: it never makes the call the session's)
  if (sub && writes(call, cwd).every((f) => { const w = where(f, repos); return !w || (w.worktree && !(st.ownTrees || []).includes(w.repo)); })) { save(session, st); return null; }
  const s = size(sessionsOwn(pending, pending.total, repos));
  if (!s.full) { save(session, st); return null; }
  if (call.id) { st.denied.push(call.id); delete st.pre[call.id]; if (st.counted[call.id]) uncount(st, call.id); } // a refused call never ran, so it never counts
  save(session, st);
  const files = Object.keys(sessionsOwn(pending, pending.total, repos).files); // the session's own, never an agent's tree
  return `This work is full-size (${s.why.join(', ')}), so it is planned before it is built (toolkit-standard §D 13). ${gaps ? `The plan at ${plan} lacks ${gaps.join(' and ')}; complete it` : `Write the plan to ${plan}`}, then retry this call. Sections, each a heading:\n`
    + `  ## Before — the closing line of the repo's bin/check run before the work, pasted ("green…", "== N FAILED…", or the project's own), and the answers to §D 1, §D 2 and §D 5 (does the toolkit own this job; would the next project want it; is a new reader about stored state or the present)\n`
    + `  ## Aim — the main goal this work serves, as agreed with the person, kept as it is from piece to piece unless they agree to change it: what every Goal and course is held to\n`
    + `  ## Goal — what done means\n`
    + `  ## Measure — "before:" the goal measured end to end, before any part is built: the command that runs the whole path and what it said (a count, a pass rate); the parts are chosen from what it shows, and the work ends by running it again\n`
    + `  ## Impact — the output of: node ${SHOWN}/tools/claude-hooks/impact.mjs ${files.map((f) => JSON.stringify(f)).join(' ')} <and the files still to come>; what each reader needs\n`
    + `  ## Claims — each claim the output's correctness or the work's scope rests on (a tool's limit, an API's behaviour, a file's state, what a test proves): checked (the probe run or the primary source read) or only believed, what being wrong would cost, and the check that settles a believed one before work rests on it; a "cannot" that would drop or shrink the work is probed first\n`
    + `  ## Beyond scope — what nearby is broken, missing or stale, and whether this change fixes it (no loose ends: what is not fixed is named and why)\n`
    + `  ## Budget — agent time, review rounds\n`
    + `  ## Review — who reviews which area\n`
    + `Then tell the user the plan in a few lines and carry on: it is the work's contract, not a request for approval.${compound(call)}`
    + (work.some((r) => !st.checkedAt?.[r] && fs.existsSync(path.join(r, 'bin', 'check'))) && (h = holder({ first: true })) ? `\nbin/check waits for the measuring lock, now held by ${describe(h)}.` : '');
}

/* A closed piece of work: its window empties; its plan is kept for the next piece, which reviews it first, and put
   aside only once it says Status: done. */
function close(session, st) {
  st.since = empty(); st.total = empty(); st.docs = [];
  st.checks = {}; st.checkedAt = {}; st.firstEdit = {}; // the next piece of work runs its own check
  st.closedAt = new Date().toISOString();
  // the plan outlives a piece of work: it is put aside only once it says its whole goal is met (Status: done), so
  // each piece reviews and re-measures the same plan rather than starting a blank one (14 Nov)
  const plan = planPath(session);
  try { if (fs.existsSync(plan) && planDone(fs.readFileSync(plan, 'utf8'))) fs.renameSync(plan, plan.replace(/\.md$/, `-${Date.now()}.done.md`)); } catch { /* left in place: it still holds */ }
}
// a line that says only that ("Status: done"), never a sentence about when it will be
export const planDone = (text) => /^[ \t>*_#-]*status[ \t*_]*:[ \t*_]*done[ \t*_.\r]*$/im.test(text || '');
// a plan that measured its piece again: an "after:" line under Measure, written since the piece began
const remeasured = (text) => /^\W*after\W*:[ \t*_`"(-]*[a-z0-9]/im.test(section(text, 'Measure'));
// and the course re-assessed from it: a "course:" line under Goal, what the measure says of the direction (kept, corrected, why)
const reassessed = (text) => /^\W*course\W*:[ \t*_`"(-]*[a-z0-9]/im.test(section(text, 'Goal'));

/* Plans other sessions left open (no Status: done), oldest first: each is taken up, revised or marked done. */
export function openPlans(session, dir = stateDir()) {
  let names = [];
  try { names = fs.readdirSync(dir); } catch { return []; }
  return names.filter((f) => /^toolkit-plan-.+\.md$/.test(f) && !f.endsWith('.done.md') && f !== path.basename(planPath(session)))
    .map((f) => { const p = path.join(dir, f); try { const text = fs.readFileSync(p, 'utf8'); return planDone(text) ? null : { path: p, at: fs.statSync(p).mtime, title: (text.match(/^#\s+(.+)$/m) || [])[1] || f }; } catch { return null; } })
    .filter((p) => p && Date.now() - p.at < OPEN_FOR).map((p) => ({ ...p, live: live(p.path, dir) })).sort((a, b) => a.at - b.at);
}
// a plan whose session wrote its state within the hour may be in use there: it is listed, marked, never offered to move
const live = (plan, dir) => { const id = path.basename(plan).replace(/^toolkit-plan-|\.md$/g, ''); try { return Date.now() - fs.statSync(path.join(dir, `toolkit-gates-${id}.json`)).mtimeMs < LIVE_FOR; } catch { return false; } };
const LIVE_FOR = 3600 * 1000;
// a plan untouched for two weeks is no longer work in flight: it is not handed on
const OPEN_FOR = 14 * 24 * 3600 * 1000;
// a file system that keeps mtimes to the second can stamp a write just after an edit as before it
const SLACK = 2000;


/* Stop: a turn that edited, whose edits since the last review are full-size,
   ends only after a review; work a review closed ends with the toolkit
   question answered and what stays open named. */
export function stopGate(session, transcript, repos, lastMessage, cwd = process.cwd()) {
  if (off()) return null;
  const st = advance(session, transcript, repos);
  inherit(st, session, repos, cwd);
  // another session's unreviewed work in this repo is measured with this one's
  const mine = sessionsOwn(st, plus(st.since, st.inherited), repos);
  const s = size(mine);
  if (st.turnEdited && s.full) {
    carry(session, st); save(session, st);
    const dirs = [...new Set(Object.keys(mine.files).map((f) => where(f, repos)?.repo).filter(Boolean))];
    // a worktree's work is mostly committed on its branch: its diff runs from where the branch left main
    const diff = (d) => (IN_WORKTREE.test(path.relative(repos.map(realPath).find((r) => d.startsWith(r + path.sep)) || d, d)) ? `git -C ${d} diff $(git -C ${d} merge-base origin/main HEAD)` : `git -C ${d} diff`);
    // the person sees this too: short, the method in §D 13
    return `Not done yet: ${s.why.join(', ')} changed since the last review (toolkit-standard §D 13). `
      + `Run the checks, then fresh read-only reviewers (Explore, never a fork, "review" in the description) on the diff (${dirs.map(diff).join(' / ')}) and the plan at ${planPath(session)}, one area each. `
      + `Fix what is real; repeat until no new High. End with "Measure:" (before → after), "Toolkit:", "Open:" and "Docs:" lines.${theirs(st, session)}`;
  }
  // a review still running has not closed the work: launching one is not finishing (28 Oct, the gate's first run)
  if (st.owed && !st.reviewing.length) {
    const stale = staleDocs(st, repos);
    const missing = ['Measure', 'Toolkit', 'Open', ...(stale.length ? ['Docs'] : [])].filter((k) => !new RegExp(`^\\W*${k}\\W*:`, 'im').test(lastMessage || ''));
    if (missing.length) {
      carry(session, st); save(session, st);
      return `Reviewed full-size work ends with ${missing.map((k) => `a line starting "${k}:"`).join(' and ')} (§D 13): `
        + `"Measure:" the plan's end-to-end measure, before → after, run again now; `
        + `"Toolkit:" what goes back to the toolkit, or "nothing"; "Open:" what is left and why, or "nothing"`
        + (stale.length ? `; "Docs:" whether each of these READMEs is updated or still right: ${stale.join(', ')}` : '') + '.';
    }
    // the plan stays: this piece's measure is written into it, and its goal reviewed, before the piece closes
    const plan = planPath(session);
    const began = Math.min(...Object.values(st.firstEdit || {}).map((t) => Date.parse(t)).filter(Number.isFinite));
    let text = null, changed = 0;
    try { text = fs.readFileSync(plan, 'utf8'); changed = fs.statSync(plan).mtimeMs; } catch { /* no plan: nothing to update */ }
    if (text !== null && (!remeasured(text) || (!planDone(text) && !reassessed(text)) || (Number.isFinite(began) && changed + SLACK < began))) {
      carry(session, st); save(session, st);
      return `The plan at ${plan} stays open after this piece (§D 13): measure again and write it under Measure as an "after:" line (the command and what it said now); then re-assess the course from it against the Aim and write a "course:" line under Goal (what the measure says of the direction toward the Aim: kept or corrected, and why), and update the Goal to match (what is done, what changed, what is next); mark it "Status: done" only when the whole goal is met. Then end again with the "Measure:", "Toolkit:", "Open:" and "Docs:" lines.`;
    }
    // the work is closed: the next full-size piece reviews the kept plan before it starts
    st.owed = false; close(session, st);
  }
  // small work that is committed closes its window: a day of small fixes must not add up to a review of work already shipped
  if (!size(st.since).full && Object.keys(st.since.files).length && !Object.keys(dirty(Object.keys(st.since.files))).length) close(session, st);
  // after any close, so closed work is not handed on as unreviewed
  carry(session, st);
  save(session, st);
  return null;
}
