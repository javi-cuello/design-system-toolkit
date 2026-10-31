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

const TOOLKIT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mode = process.argv[2];
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

if (mode === 'edit') {
  // The plan gate (gates.mjs) first: a refused call needs no rule list.
  const { planGate } = await import('./gates.mjs');
  const refused = planGate(payload.session_id, payload.transcript_path, ecosystemDirs(), { id: payload.tool_use_id, name: payload.tool_name, input: payload.tool_input || {} }, payload.cwd || process.cwd());
  if (refused) {
    console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: refused } }));
    process.exit(0);
  }
  if (process.env.TOOLKIT_RULES === 'off') process.exit(0);
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
  if (!found.size) process.exit(0);
  const seenFile = path.join(os.tmpdir(), `toolkit-rules-${payload.session_id || 'none'}`);
  const seen = new Set(fs.existsSync(seenFile) ? fs.readFileSync(seenFile, 'utf8').split('\n').filter(Boolean) : []);
  const fresh = [...found].filter(([k]) => !seen.has(k));
  // a page is named once a session, so a later dialog still names dialogs.md
  const read = [...pages].filter((p) => !seen.has(`knowledge:${p}`));
  if (!fresh.length && !read.length) process.exit(0);
  for (const [k] of fresh) seen.add(k);
  for (const p of read) seen.add(`knowledge:${p}`);
  fs.writeFileSync(seenFile, [...seen].join('\n'));
  const lists = fresh.map(([, a]) => `standards/${a.standard} — ${[].concat(a.part).join(', ')}:\n${ruleIndex(TOOLKIT, a).map((t) => `  ${t}`).join('\n')}`).join('\n\n');
  const kb = read.length ? `Interface work (toolkit-standard §D 21): read these knowledge pages before the first line, and name the ones you followed in the commit's "Knowledge:" trailer (checked at push):\n${read.map((p) => `  ~/Projects/toolkit/${p}`).join('\n')}` : '';
  const rules = fresh.length ? `First change in this area this session. These are the rules that govern it (~/Projects/toolkit; open a rule's section when it bears on the change, and revisit the change if one does).\n\n${lists}` : '';
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse',
    additionalContext: [rules, kb].filter(Boolean).join('\n\n') } }));
  process.exit(0);
}

const pendingFile = () => path.join(os.tmpdir(), `toolkit-pending-${payload.session_id || 'none'}`);

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
  const { stopGate } = await import('./gates.mjs');
  const reason = stopGate(payload.session_id, payload.transcript_path, ecosystemDirs(), payload.last_assistant_message, payload.cwd || process.cwd());
  if (reason) { console.log(JSON.stringify({ decision: 'block', reason })); process.exit(0); }
}

if (!inEcosystem(payload.cwd || process.cwd())) process.exit(0);
const r = spawnSync('node', [path.join(TOOLKIT, 'tools/toolkit-check/closing.mjs'), '--brief'], { encoding: 'utf8', timeout: 20000 });
// a closing pass that failed or ran out of time has said nothing, which is not "nothing open"
const items = r.status === 0 ? (r.stdout || '').trim() : `the closing pass did not finish (${r.error ? r.error.message : `exit ${r.status}`}): run bin/closing and read it`;
const open = items && !/^nothing the script can see is open$/.test(items);

if (mode === 'start') {
  const { stale } = await import('./standards-read.mjs');
  for (const f of stale()) fs.rmSync(f, { force: true });
  console.log(`The toolkit's loop (toolkit-standard §D 13) is not optional. Before the work: read the standard that governs it and run the repo's check. Every project commit carries a "Toolkit:" trailer naming where its lesson went, or "none — <why>"; one that touches interface files also a "Knowledge:" trailer naming the knowledge pages it followed, or "none — <why>".${open ? `\nInherited, open now:\n${items}` : '\nNothing the closing pass can see is open.'}`);
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
  fs.appendFileSync(pendingFile(), fresh.lines.join('\n') + '\n');
  process.exit(0);
}
