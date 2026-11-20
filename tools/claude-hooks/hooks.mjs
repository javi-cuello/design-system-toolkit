#!/usr/bin/env node
/*
 * tools/claude-hooks/hooks.mjs — the loop's two session moments as Claude Code
 * hooks (toolkit-standard §D 13), so neither end of a session depends on
 * remembering it:
 *
 *   node tools/claude-hooks/hooks.mjs start   SessionStart: what the session inherits
 *   node tools/claude-hooks/hooks.mjs stop    Stop: what it leaves open, kept for the next prompt
 *   node tools/claude-hooks/hooks.mjs prompt  UserPromptSubmit: hands over what stop kept
 *   node tools/claude-hooks/hooks.mjs edit    PreToolUse: an area's rules, once, beside its first change,
 *                                             and the knowledge pages an interface file is built from;
 *                                             the plan gate (gates.mjs) before full-size work
 *
 * All act only inside the toolkit or a registered project repo. `start` hands
 * the open items (bin/closing --brief, 0.4 s) to the session as context, with
 * the loop's first step. `stop` keeps each new open item (stop-items.mjs:
 * once each, an uncommitted file only when this session wrote it) and
 * `prompt` gives them to the session with the next message. Those speak to
 * the session alone (the maintainer, 15 Oct: "you can check what you want but
 * I don't need to see it"): a Stop block and an edit refusal had printed on
 * the screen on nearly every turn. The gates (gates.mjs) are the one
 * exception, decreed 28 Oct: they refuse, only for full-size work, because
 * informing let the plan and the review be skipped.
 *
 * Written 2026-10-03. The closing pass was prose for a month, then a script
 * nobody was made to run; "be proactive" was a principle with no moment at
 * all, and the maintainer had to ask for the feedback loop to be enforced —
 * the kind of finding the session should have raised itself.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { stateDir } from './state-dir.mjs';

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// the toolkit as a message names it: where this checkout is, never a folder assumed (~ for the home folder)
const SHOWN = TOOLKIT.startsWith(os.homedir() + path.sep) ? '~' + TOOLKIT.slice(os.homedir().length) : TOOLKIT;
const mode = process.argv[2];
const STARTED = Date.now();
let payload = {};
try { payload = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }

export function inEcosystem(cwd) {
  const repos = [TOOLKIT];
  try {
    const contract = createRequire(import.meta.url)('../snapshot/projects.cjs');
    for (const r of contract.repos()) repos.push(r.dir);
  } catch { /* the registry unreadable: the toolkit alone */ }
  const c = path.resolve(cwd || '.');
  return repos.some((r) => c === r || c.startsWith(r + path.sep));
}

/* Every repo the gates measure: the toolkit and each registered project. */
function ecosystemDirs() {
  const dirs = [TOOLKIT];
  try { for (const r of createRequire(import.meta.url)('../snapshot/projects.cjs').repos()) dirs.push(r.dir); } catch { /* the toolkit alone */ }
  return dirs;
}

/* edit (PreToolUse on Edit, Write, MultiEdit and Bash): the plan gate first,
   then the first change a session makes in an area goes through with that
   area's rule list (standards-read.mjs) beside it, once.
   Judged by the target, not the working folder: an edit names its file from
   anywhere. TOOLKIT_EVAL_COPY names an eval's copy as a project, so
   tools/skill-evals can measure the hook (the gates are off there);
   TOOLKIT_RULES=off turns the rule list off. */

// whether a tool call in the session's transcript names the page (a Read, a cat, a grep over it); a write that only
// cites it, or a subagent's prompt that names it, has not opened it. A transcript too big to read counts as unopened: the refusal is once, so it costs one retry.
const WRITERS = ['Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'Agent', 'Task'];
function openedIn(transcript, page) {
  let text = '';
  try { text = fs.readFileSync(transcript, 'utf8'); } catch { return false; }
  for (const line of text.split('\n')) {
    if (!line.includes(page) || !line.includes('"tool_use"')) continue;
    let row; try { row = JSON.parse(line); } catch { continue; }
    for (const c of (row.message && row.message.content) || []) if (c.type === 'tool_use' && !WRITERS.includes(c.name) && JSON.stringify(c.input || {}).includes(page)) return true;
  }
  return false;
}

if (mode === 'edit') {
  // The plan gate (gates.mjs) first: a refused call needs no rule list.
  // A gate that throws would exit 1, which Claude Code lets through with a one-line notice the session never
  // reads: it is said to the session instead, once a session, beside the rule list. Not denied: a deny would
  // also refuse the edit that fixes the gate.
  let refused, broken = '', note = '';
  const gatesOff = process.env.TOOLKIT_GATES === 'off' || !!process.env.TOOLKIT_EVAL_COPY;
  try {
    const { planGate } = await import('./gates.mjs');
    // a subagent's call carries agent_id: its worktree edits are counted at the merge, as at Stop
    refused = planGate(payload.session_id, payload.transcript_path, ecosystemDirs(), { id: payload.tool_use_id, name: payload.tool_name, input: payload.tool_input || {} }, payload.cwd || process.cwd(), Boolean(payload.agent_id));
  } catch (e) {
    // said where the gates act, as at Stop
    if (!gatesOff && inEcosystem(payload.cwd || process.cwd())) broken = `The plan gate (${SHOWN}/tools/claude-hooks/gates.mjs) failed and did not judge this call: ${String(e?.message ?? e)}. Fix it before more full-size work: until then nothing here is gated.`;
  }
  if (refused) {
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: refused } }));
    process.exit(0);
  }
  const seenFile = path.join(os.tmpdir(), `toolkit-rules-${payload.session_id || 'none'}`);
  let seen = new Set();
  try { if (fs.existsSync(seenFile)) seen = new Set(fs.readFileSync(seenFile, 'utf8').split('\n').filter(Boolean)); } catch { /* unreadable: nothing seen */ }
  if (broken && seen.has('gate-broken')) broken = '';
  const say = (text) => {
    if (broken) { seen.add('gate-broken'); try { fs.writeFileSync(seenFile, [...seen].join('\n')); } catch { /* said again next call */ } }
    const all = [broken, note, text].filter(Boolean).join('\n\n');
    if (all) console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: all } }));
    process.exit(0);
  };
  // a push whose bin/check will wait for the measuring lock says who holds it (tools/shared/lock.mjs)
  if (payload.tool_name === 'Bash') {
    try {
      const { isPush } = await import('./gates.mjs');
      const { holder, describe } = await import('../shared/lock.mjs');
      const h = isPush(payload.tool_input?.command) && holder();
      if (h) note = `This push's bin/check waits for the measuring lock, now held by ${describe(h)}.`;
    } catch { /* said nothing: the check itself says whom it waits for */ }
  }
  if (process.env.TOOLKIT_RULES === 'off') say('');
  const { areas, areaKey, targets, ruleIndex, knowledge } = await import('./standards-read.mjs');
  let repos = process.env.TOOLKIT_EVAL_COPY ? [path.resolve(process.env.TOOLKIT_EVAL_COPY)] : [];
  try {
    const contract = createRequire(import.meta.url)('../snapshot/projects.cjs');
    repos = repos.concat(contract.repos().map((r) => r.dir));
  } catch { /* the toolkit alone */ }
  const found = new Map(), pages = new Set();
  for (const f of targets(payload.tool_name, payload.tool_input || {}, payload.cwd || process.cwd())) {
    for (const a of areas(f, TOOLKIT, repos)) found.set(areaKey(a), a);
    for (const p of knowledge(f, TOOLKIT, repos)) pages.add(p);
  }
  if (!found.size) say('');
  const fresh = [...found].filter(([k]) => !seen.has(k));
  // a page is named once a session, so a later dialog still names dialogs.md
  const read = [...pages].filter((p) => !seen.has(`knowledge:${p}`));
  // A component's own page is the one an agent most needs and, named among a dozen, the one it skipped (3 of 41
  // eval runs opened any named page, 2026-11-16): the first write to that component is refused once until the page
  // has been opened in this session. Once, so a page that cannot be read never blocks the work.
  // per agent: a subagent's refusal does not spend the main session's, nor one subagent's another's. Whether a
  // subagent's own reads reach this transcript is not checked; if not, it is refused once more than it needs.
  const who = payload.agent_id || 'main';
  const asked = [...pages].filter((p) => p.startsWith('knowledge/ui/components/') && !seen.has(`kb-refused:${who}:${p}`) && !seen.has(`kb-opened:${who}:${p}`));
  const opened = asked.filter((p) => openedIn(payload.transcript_path, p));
  for (const p of opened) seen.add(`kb-opened:${who}:${p}`);
  const unopened = asked.filter((p) => !opened.includes(p));
  if (opened.length) fs.writeFileSync(seenFile, [...seen].join('\n'));
  if (unopened.length) {
    for (const p of unopened) seen.add(`kb-refused:${who}:${p}`);
    fs.writeFileSync(seenFile, [...seen].join('\n'));
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: `Read this component's knowledge page first, then retry: it holds how the component is designed, built in Figma, aligned with code and coded (toolkit-standard §D 21).\n${unopened.map((p) => `  ${SHOWN}/${p}`).join('\n')}` } }));
    process.exit(0);
  }
  if (!fresh.length && !read.length) say('');
  for (const [k] of fresh) seen.add(k);
  for (const p of read) seen.add(`knowledge:${p}`);
  fs.writeFileSync(seenFile, [...seen].join('\n'));
  const lists = fresh.map(([, a]) => `standards/${a.standard} — ${[].concat(a.part).join(', ')}:\n${ruleIndex(TOOLKIT, a).map((t) => `  ${t}`).join('\n')}`).join('\n\n');
  const kb = read.length ? `Interface work (toolkit-standard §D 21): read these knowledge pages before the first line, and name the ones you followed in the commit's "Knowledge:" trailer (checked at push):\n${read.map((p) => `  ${SHOWN}/${p}`).join('\n')}` : '';
  const rules = fresh.length ? `First change in this area this session. These are the rules that govern it (${SHOWN}; open a rule's section when it bears on the change, and revisit the change if one does).\n\n${lists}` : '';
  say([rules, kb].filter(Boolean).join('\n\n'));
}

const pendingFile = () => path.join(stateDir(), `toolkit-pending-${payload.session_id || 'none'}`);

/* prompt (UserPromptSubmit): what the last turn's stop kept, handed to the
   session with the user's next message, then dropped. */
if (mode === 'prompt') {
  const f = pendingFile();
  if (!fs.existsSync(f)) process.exit(0);
  const lines = [...new Set(fs.readFileSync(f, 'utf8').split('\n').filter(Boolean))];
  fs.rmSync(f, { force: true });
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: `The closing pass (toolkit-standard §D 13) found open items after the last turn:\n${lines.join('\n')}\n\nClose each that is this session's alongside the user's request, without reporting it; an item another session owns is not worked on. Tell the user only what needs their decision, in a line.` } }));
  process.exit(0);
}

/* The review and feedback gates (gates.mjs) judge the session's edits, not its
   folder, so they run before the folder test. */
if (mode === 'stop') {
  // the system's checker over the code this session wrote and left uncommitted, before the gates, so a gated
  // turn is checked too, and on a stop that follows a block, so a fix is read; each finding blocks once (its key
  // kept per session, which is what ends the loop), and a check that fails never blocks
  if (process.env.TOOLKIT_VALIDATE !== 'off') {
    let found = null;
    const seenFile = path.join(os.tmpdir(), `toolkit-validate-${payload.session_id || 'none'}`);
    try {
      const { ownFiles } = await import('./stop-items.mjs');
      const { validateTurn } = await import('./validate-turn.mjs');
      const seen = new Set(fs.existsSync(seenFile) ? fs.readFileSync(seenFile, 'utf8').split('\n').filter(Boolean) : []);
      found = validateTurn(await ownFiles(payload.transcript_path), { seen });
      // the kept keys are what end the loop: a block whose keys could not be kept is not made
      if (found) fs.appendFileSync(seenFile, found.keys.join('\n') + '\n');
    } catch { found = null; /* the push gate still reads the same files */ }
    if (found) { console.log(JSON.stringify({ decision: 'block', reason: found.reason })); process.exit(0); }
  }
  // a gate that throws is said once (a stop after a block passes), never swallowed as a pass
  let reason;
  try {
    const { stopGate } = await import('./gates.mjs');
    reason = stopGate(payload.session_id, payload.transcript_path, ecosystemDirs(), payload.last_assistant_message, payload.cwd || process.cwd());
  } catch (e) {
    // said once a turn, only where the gates act, and never where they are switched off
    const off = process.env.TOOLKIT_GATES === 'off' || !!process.env.TOOLKIT_EVAL_COPY;
    reason = payload.stop_hook_active || off || !inEcosystem(payload.cwd || process.cwd()) ? null : `The review gate (${SHOWN}/tools/claude-hooks/gates.mjs) failed and did not judge this turn: ${String(e?.message ?? e)}. Fix it, then run the review it would have asked for.`;
  }
  if (reason) { console.log(JSON.stringify({ decision: 'block', reason })); process.exit(0); }
  // the session's own edits, left uncommitted, block every other session's push (the user's standing rule: commit
  // each green step at once, unfinished work too, saying what is left). Once a turn; never another session's paths.
  if (!payload.stop_hook_active && process.env.TOOLKIT_GATES !== 'off' && !process.env.TOOLKIT_EVAL_COPY) {
    let loose = {};
    try {
      const { ownUncommitted } = await import('./stop-items.mjs');
      loose = await ownUncommitted(payload.transcript_path, ecosystemDirs());
    } catch { loose = {}; /* unreadable: the closing pass still lists uncommitted work */ }
    const where = Object.entries(loose);
    if (where.length) {
      console.log(JSON.stringify({ decision: 'block', reason: `Your own edits are uncommitted, and an uncommitted tree blocks every other session's push. Commit them now, only these paths (git -C <repo> commit -- <paths>), unfinished work too with a message saying what is left:\n${where.map(([r, fs_]) => `  ${r}: ${fs_.join(' ')}`).join('\n')}` }));
      process.exit(0);
    }
  }
}

if (!inEcosystem(payload.cwd || process.cwd())) process.exit(0);
// a stop that follows a block keeps nothing the closing pass finds (below), so it is not run inside the hook's 30 s
if (mode === 'stop' && payload.stop_hook_active) process.exit(0);
const r = spawnSync('node', [path.join(TOOLKIT, 'tools/toolkit-check/closing.mjs'), '--brief'], { encoding: 'utf8', timeout: Math.max(1000, Math.min(20000, 28000 - (Date.now() - STARTED))) });
// a closing pass that failed or ran out of time has said nothing, which is not "nothing open"
const items = r.status === 0 ? (r.stdout || '').trim() : `the closing pass did not finish (${r.error ? r.error.message : `exit ${r.status}`}): run bin/closing and read it`;
const open = items && !/^nothing the script can see is open$/.test(items);

if (mode === 'start') {
  try { const { stale } = await import('./standards-read.mjs'); for (const f of stale()) fs.rmSync(f, { force: true }); } catch { /* swept at the next start */ }
  // a plan another session left open is work in flight: taken up, revised or marked done, never left to lapse
  // (a gate that will not load costs this note, never the start: the session still hears the rest)
  let plans = [], planPath = () => '';
  try {
    const g = await import('./gates.mjs');
    g.sweepState(); planPath = g.planPath;
    plans = g.openPlans(payload.session_id);
  } catch (e) { plans = []; console.log(`The gates did not load (${e.message}): plans left open are not listed.`); }
  plans = plans.map((p) => `  - "${p.title}", last changed ${p.at.toISOString().slice(0, 16).replace('T', ' ')}: ${p.path}${p.live ? ' (its session acted within the hour and may still hold it: ask before moving it)' : ''}`);
  const planNote = plans.length ? `\nPlans still open (no "Status: done"): read each; take one up by moving it to this session's plan (mv <it> ${planPath(payload.session_id)}) and carrying on, revise it, or mark it "Status: done". One untouched for two weeks is not listed.\n${plans.join('\n')}` : '';
  console.log(`The toolkit's loop (toolkit-standard §D 13) is not optional. Before the work: read the standard that governs it and run the repo's check. Every project commit carries a "Toolkit:" trailer naming where its lesson went, or "none — <why>"; one that touches interface files also a "Knowledge:" trailer naming the knowledge pages it followed, or "none — <why>".${open ? `\nInherited, open now:\n${items}` : '\nNothing the closing pass can see is open.'}${planNote}`);
  process.exit(0);
}

if (mode === 'stop') {
  if (payload.stop_hook_active || !open) process.exit(0);
  /* Item by item, not the list as one hash: see stop-items.mjs. */
  const { unseen, ownFiles, turnWrote } = await import('./stop-items.mjs');
  if (!(await turnWrote(payload.transcript_path))) process.exit(0);
  const seenFile = path.join(os.tmpdir(), `toolkit-stop-${payload.session_id || 'none'}`);
  const seenKeys = fs.existsSync(seenFile) ? fs.readFileSync(seenFile, 'utf8').split('\n').filter(Boolean) : [];
  const repoDirs = { toolkit: TOOLKIT };
  try {
    const contract = createRequire(import.meta.url)('../snapshot/projects.cjs');
    for (const r of contract.repos()) repoDirs[r.name] = r.dir;
  } catch { /* the toolkit alone */ }
  const fresh = unseen(items, seenKeys, await ownFiles(payload.transcript_path), repoDirs);
  if (!fresh.lines.length) process.exit(0);
  fs.writeFileSync(seenFile, [...seenKeys, ...fresh.keys].join('\n'));
  try { fs.appendFileSync(pendingFile(), fresh.lines.join('\n') + '\n'); } catch (e) { console.error(`open items not handed over: ${e.message}`); }
  process.exit(0);
}
