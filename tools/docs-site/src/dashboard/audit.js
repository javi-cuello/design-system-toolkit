// Check changes and Audit: the sweep, the scan through the Figma bridge, the
// judgement pass, and filing what it found.
import { plural, scrollMotion } from './format.js';
import { go } from './views.js';
import { api, askClaude, bridge, claudeReady, forgetClaude } from './api.js';
import { contextRules, ownerChipLabel as ownerLabel } from './owners.js';
import { OWNER, isOpen } from './labels.js';
import { ctx } from './context.js';
import { pullRecord, store } from './record.js';
import { loadBuckets, showCleared, state, toast } from './queue.js';
import { recordScores } from './scores.js';
import { endProgress, runProgress } from './measures.js';

// One phrasing of an audit's outcome, used by both of its endings.
// `kept` is what survived judgement. A run that files nothing new and closes
// nothing can still leave findings open, and "Nothing to fix" said the
// opposite of the status line beside it on 2026-09-10.
function auditHeadline(added, closed, scanned, reopened, kept) {
  const found = reopened
    ? [added - reopened ? plural(added - reopened, "new finding") : "", plural(reopened, "finding") + " reopened"].filter(Boolean).join(", ")
    : plural(added, "new finding");
  if (added && closed) return found + ", " + closed + " closed";
  if (added) return found;
  const still = kept ? plural(kept, "finding") + " still open" : "";
  if (closed) return plural(closed, "row") + " closed" + (still ? ", " + still : "");
  if (still) return still + ", all already in the queue";
  return "Nothing to fix in " + plural(scanned, "component");
}
function auditDetail(candidates, kept, added, closed) {
  const bits = [];
  if (candidates) bits.push(candidates + " raised by the scan, " + kept + " survived judgement");
  if (closed) bits.push(closed + " no longer raised by the scan, closed and stamped by this run");
  if (!bits.length) bits.push("Every component scanned and nothing raised.");
  return bits.join(" \u00b7 ");
}
// ---- sweep ----
// Fingerprint every component set and diff against the stored baseline, so
// "what moved" is a fact rather than a memory. The script is fetched from the
// service (`/scripts`) rather than held here: one copy serves every project,
// so a new check reaches all of them without touching any project's record.

const sweepBtn = document.getElementById("sweepBtn");
const sweepState = document.getElementById("sweepState");
let sweeping = false;



// The status line reports OUTCOMES only: what a run found, what failed, what
// was saved. It says nothing while a run is in flight.
//
// `working` marks a line a run would have replaced moments later, and those
// are now dropped rather than printed. Everything they said is already in the
// file list, on the row for the file being read: the spinner, the percentage,
// the ticking seconds and the file's own name. Two places narrating one run is
// worse than one, because a reader checks both to discover they agree — and
// the call sites keep the argument so each stage still declares which of its
// messages was narration and which is a result.
function say(text, tone, working) {
  if (working) { sweepState.textContent = ""; sweepState.removeAttribute("data-tone"); sweepState.removeAttribute("data-busy"); return; }
  sweepState.textContent = text;
  if (tone) sweepState.dataset.tone = tone; else sweepState.removeAttribute("data-tone");
  sweepState.removeAttribute("data-busy");
}
// A count with nowhere to go is a dead end. Where the detail exists on another
// tab, the status line carries the way to it.
function sayLinked(text, tone, view, target) {
  say(text, tone);
  const a = document.createElement("button");
  a.type = "button";
  a.className = "state-link";
  a.textContent = "See which \u2192";
  a.addEventListener("click", () => {
    go(view || "queue");
    const el = document.getElementById(target || "changed");
    if (el) el.scrollIntoView({ behavior: scrollMotion(), block: "start" });
  });
  sweepState.appendChild(document.createTextNode(" "));
  sweepState.appendChild(a);
}
// Every failure of a long action lands here, so the reader gets one of four
// answers instead of a raw code. A rejected key also flips the cached status,
// so the next run takes the scanner-only path rather than offering Claude
// again and failing the same way.
function trouble(e, verb) {
  const code = e && e.code;
  if (code === "no_plugin")
    return "Figma isn\u2019t reachable \u2014 open the library with the Desktop Bridge plugin running.";
  if (code === "timeout")
    // Giving up is the bridge's; the code runs on in Figma, so an immediate
    // retry starts a second run beside the first.
    return "Figma did not answer in time \u2014 the bridge gave up waiting, but the code may still be finishing in Figma. Wait a minute with the file idle, then try again.";
  if (code === "figma_error")
    return "Figma refused the code: " + (e.message || "no detail");
  if (code === "truncated")
    return "The judgement ran out of room before it finished, so nothing was filed. Audit fewer components at once.";
  if (code === "bad_json")
    return "The judgement did not come back as JSON, so nothing was filed. Try the audit again.";
  if (code === "bad_api_key" || code === "no_api_key") {
    forgetClaude();
    return code === "no_api_key"
      ? "No API key, so the judgement pass was skipped."
      : "The API key was rejected. Put a working one in ~/.figma-dashboard-key and restart the service.";
  }
  return verb + " did not run" + (e && e.message ? " (" + e.message + ")" : "") + ".";
}
function diffPrints(before, after) {
  const a = Object.keys(before || {}), b = Object.keys(after || {});
  return {
    changed: a.filter((k) => b.includes(k) && before[k] !== after[k]).sort(),
    added: b.filter((k) => !a.includes(k)).sort(),
    removed: a.filter((k) => !b.includes(k)).sort()
  };
}
async function runSweep() {
  if (sweeping) return;
  sweeping = true; sweepBtn.disabled = true;
  say("Looking for the Figma bridge\u2026");
  try {
    const { sweep } = await api.scripts();
    if (!sweep) { say("The dashboard service did not return its sweep script.", "warn"); return; }

    say("Reading the library\u2026");
    // The sweep takes the same page rule as the audit. Without it the two
    // walk different sets and "nothing moved" stops meaning anything.
    const rulesS = await contextRules();
    const result = await bridge.exec(
      "const TOKENS = " + JSON.stringify(rulesS.tokens) + ";\n" + sweep);
    if (!result || !result.sets) { say("The bridge answered, but not with a fingerprint set.", "warn"); return; }

    // `bridge.exec` names the library, but the guard stays: without it a read
    // of the wrong file writes a diff saying every set was removed, and that
    // document REPLACES the baseline — silent, and not recoverable from the
    // page. Measured on 2026-09-05, on the first live run.
    if (result.fileKey && ctx.libKey && result.fileKey !== ctx.libKey) {
      say("That read " + (result.fileName || "another file") +
          ", not this library — nothing was written. Make the library the active file in Figma and sweep again.", "warn");
      return;
    }
    if (!result.fileKey) {
      say("The bridge did not say which file it read, so the fingerprints were left alone.", "warn");
      return;
    }

    // Without a loaded baseline every set reads as new, and that document
    // then REPLACES the baseline. Measured twice on 2026-09-05: once from a
    // wrong file, once because a bootstrap error stopped the fingerprints
    // subscription ever registering. Absence of a baseline in memory is not
    // evidence of absence in the store.
    if (!ctx.printsLoaded) {
      say("The stored fingerprints haven\u2019t loaded yet \u2014 nothing was written. Try again in a moment.", "warn");
      return;
    }
    if (!ctx.libKey) { say("The library record hasn\u2019t loaded yet \u2014 nothing was written.", "warn"); return; }

    // A sweep with nothing to compare against IS the baseline, not a diff.
    // Diffing against nothing reports every set as new — true, and useless:
    // it made a first run offer "audit the 64 changed sets" next to "audit
    // all 64", which are the same 64. Nothing has moved on a first look.
    const first = !ctx.storedPrints || !Object.keys(ctx.storedPrints).length;
    const diff = first ? null : diffPrints(ctx.storedPrints, result.sets);
    await store.doc("fingerprints/" + ctx.libKey).set({
      at: new Date().toISOString(), sets: result.sets, diff: diff, baseline: first,
      via: "sweep", readFile: result.fileName || null
    });
    ctx.lastMoved = diff ? diff.changed.concat(diff.added) : [];
    paintAuditMenu();
    if (first) {
      say("Baseline recorded \u2014 " + Object.keys(result.sets).length +
          " sets. From now on this is what changes are measured against.", "ok");
      return;
    }
    const parts = [];
    if (diff.changed.length) parts.push(diff.changed.length + " changed");
    if (diff.added.length) parts.push(diff.added.length + " new");
    if (diff.removed.length) parts.push(diff.removed.length + " gone");
    if (parts.length) sayLinked(parts.join(", ") + " since the last run.", "warn");
    else say("Nothing has moved since the last run.", "ok");
  } catch (e) {
    say(trouble(e, "Check"), "warn");
  } finally {
    sweeping = false; sweepBtn.disabled = false;
  }
}
// ---- audit ----
// Two halves, and they are not interchangeable. `figma_execute` runs the
// SCANNER, which is deterministic and produces candidates; Claude runs the
// JUDGEMENT, which decides which candidates are real against this project's
// recorded rulings. Skipping the second half would report the sparse variant
// grid, the pinned AUXILIARY page and the deliberate Cancel selection button
// as defects on every run — findings the maintainer has already closed.
const auditBtn = document.getElementById("auditBtn");

let auditing = false;
// What this run's Claude calls cost, filled by the judge and saved on the run.
let runSpend = null;
// Findings become queue rows, because the queue is where work is tracked. A
// separate findings list was a second place to look that nothing acted on.
//
// The rows themselves are filed by the service (POST /rows, one function in
// rows.mjs shared with every skill that writes to this record): it mints the
// key, matches an existing row by owner, component and wording before
// minting, reopens a closed row the scan raises again, and, on a full scan,
// closes this owner's rows the scan no longer raises. This page held all of
// that as code while three skills held it as prose, which is how a session's
// rows and the page's rows would have come to be keyed differently. Here
// only the findings are assembled.
/*
 * THE ONE CALLER OF api.rows. Every stage files through this, and hands over
 * only what its scanner can honestly say about what it read:
 *
 *   read.names       the components the scan read — the closing scope. A
 *                    full run closes the rows it no longer raises INSIDE this
 *                    list and nowhere else.
 *   read.complete    the scan read everything it was asked to; false for a
 *                    scan that skipped anything, and then nothing closes.
 *   read.everything  the scan walked the whole file, so `names` is every
 *                    component that exists and a row naming anything else is
 *                    about one that was renamed or removed. A scanner's
 *                    property, never a stage's opinion: the file and link
 *                    scanners walk every page; the validator reads a stored
 *                    snapshot that can be older than the file and does not
 *                    claim it.
 *   read.ran         the checks the scan exercised, for a scanner that
 *                    reports them; a rule it did not run may not close rows.
 *   read.source      where the trees came from. Every stage of an audit
 *                    reads the LIVE file (toolkit-standard §D 5), and
 *                    `check.mjs` refuses a stage that names another source:
 *                    one stage read the stored snapshot for a fortnight and
 *                    kept reporting a shadow the maintainer had removed.
 *
 * Four stages used to assemble this payload by hand, each with its own
 * subset and its own comment about the field it had forgotten last time:
 * `full: true` with no scope three times over, a scope built from `e.set`
 * where the enumerator returns `name` (120 blanks, and that stage never
 * closed a row in its life), `exhaustive` on two stages and not the third
 * that walks the file too. The contract is rows.mjs's; this is the one
 * place the page states it, and `check.mjs` refuses a second caller.
 */
async function fileStage(owner, target, read, findings, dismissed) {
  if (read.source !== "figma") throw new Error(owner + " read " + (read.source || "nothing it named") + "; an audit stage reads the live file");
  const payload = { owner, fileKey: ctx.libKey, origin: "page-audit",
                    full: !!read.complete, scope: read.names || [], findings };
  if (target) payload.target = target;
  if (read.everything) payload.exhaustive = true;
  if (Array.isArray(read.ran)) payload.ran = read.ran;
  if (dismissed) payload.dismissed = dismissed;
  const r = await api.rows(payload);
  if (!r || !r.ok) throw new Error((r && r.error) || "the service did not file the rows");
  return r;
}
async function fileRows(judged, scan) {
  loadBuckets((await api.scripts()).buckets);
  const findings = [], dismissed = [];
  const keptText = new Set(), why = {};
  for (const entry of judged) {
    for (const d of (entry.dropped || [])) if (typeof d.i === "number") why[entry.set + "\n" + d.i] = d.why || "";
    const scannedSet = scan.audited.find((s) => s.set === entry.set) || {};
    const cands = scannedSet.candidates || [];
    for (const f of (entry.findings || [])) {
      // Trace by index, not by text: the judge rewrites the wording, so a
      // text match silently failed and every finding landed in the fallback
      // bucket. Fall back to text only when no index came back.
      const match = (typeof f.i === "number" && cands[f.i]) || cands.find((c) => c.text === f.text);
      findings.push({
        where: entry.set, node: scannedSet.id || null,
        // The scanner's OWN wording is the row's `check`, kept because
        // verification re-scans and compares against what the scanner says.
        // `fix` holds the judge's tightened rewrite, which by design does
        // not match the candidate.
        check: (match && match.text) || f.text,
        key: (match && match.key) || undefined,
        // Scoring attributes a finding to a dimension by rule, so a row
        // without one cannot be scored.
        rule: (match && match.rule) || null,
        bucket: ctx.BUCKET_OF_RULE[(match && match.rule) || ""] || ctx.BUCKET_DEFAULT,
        sev: f.sev, fix: [f.text],
        // The scanner's own fix when it has one; the judge's reason otherwise.
        rec: [(match && match.advice) || f.why || "Decide how to handle it."]
      });
      keptText.add(entry.set + "\n" + ((match && match.text) || f.text));
    }
  }
  /*
   * What the judge dropped is said as such: those rows close as dismissed,
   * never as "no longer raised", because the scanner still raised them.
   *
   * A SET THE JUDGE NEVER ANSWERED FOR IS KEPT, NEVER DISMISSED — the same
   * rule `judgeAll` carries, and the same reason. `dismissed = candidates −
   * kept` cannot tell "the judge considered it and said no" from "the judge
   * never mentioned this set": a batch that comes back `{"sets":[]}`, or
   * names a set whose string does not match, dismissed every candidate in it
   * with no reason, and rows.mjs closed each one as verified with the words
   * "with no reason given". One malformed answer silently emptied part of
   * the queue. The fix lived in the other stages and never reached the main
   * one.
   */
  const answered = new Set(judged.map((e) => e.set));
  fileRows.unjudged = scan.audited.filter((e) => (e.candidates || []).length && !answered.has(e.set)).map((e) => e.set);
  for (const e of scan.audited) {
    if (!answered.has(e.set)) continue;
    (e.candidates || []).forEach((c, i) => {
      if (!keptText.has(e.set + "\n" + c.text)) dismissed.push({ where: e.set, check: c.text, key: c.key, why: why[e.set + "\n" + i] || "" });
    });
  }
  // A scan that skipped nothing returns measures; one that skipped anything
  // returns none and may only add. This stage is handed TARGETS, so it does
  // not claim to have walked the whole file.
  // …and one that skipped nothing walked every component page, so a row
  // naming a set the scan did not meet is about one renamed or removed.
  // …and the checks it ran: the state and option-order checks are gated on
  // settings, and a run without them must not close their rows.
  const r = await fileStage(OWNER, null, { names: scan.audited.map((e) => e.set), complete: !!scan.measures, everything: !!scan.measures, ran: scan.ran || undefined, source: "figma" }, findings, dismissed);
  await pullRecord();
  return r;                                       // {added, updated, reopened, closed}
}
// An audit run from the page is a run, and belongs in the same registry as one
// run from a session — otherwise "last run" keeps naming an older one.
// Measures live on the library, not the run — the page reads them from
// there, and until this wrote them a completed audit still rendered
// "Nothing measured yet" forever. `measures` is null on a partial scan,
// and null must leave the stored figures alone rather than clear them.
async function recordMeasures(measures) {
  if (!measures || !ctx.libKey) return;
  const doc = await store.doc("libraries/" + ctx.libKey).get();
  const lib = doc.exists ? doc.data() : {};
  const next = {};
  // Never carry a measure forward: a figure this run did not recompute is
  // dropped, not shown. Only openFindings/totalFindings come from the queue.
  for (const [k, v] of Object.entries(measures)) if (v !== null && v !== undefined) next[k] = v;
  const rows = Object.values(state);
  next.totalFindings = rows.length;
  // `isOpen`, not `!done`: ONE predicate, which is what labels.js says it
  // is. A ticked row that no check has confirmed is still open, and the two
  // counts disagreed by exactly those rows — 189 written here above a queue
  // whose tiles and chips said 190, and 49 against 56 on another project.
  next.openFindings = rows.filter(isOpen).length;
  await store.doc("libraries/" + ctx.libKey).set(
    Object.assign({}, lib, { metrics: next, lastRunAt: new Date().toISOString() }));
}
// An audit consumes the sweep's diff for what it covered. The section is
// titled "Changed since the last audit", and until this an audit never
// touched the diff: the sets it had just walked stayed listed as worth
// re-checking until a later sweep happened to find nothing moved, which
// on 2026-09-08 left "Navigation item" and "badge-minus" up through three
// audits that had scanned both. A partial audit clears only its scope; a
// set that is gone can only be acknowledged by an audit of everything.
// What the audit read is no longer "moved": a full audit empties the list, an
// audit of the changes removes the sets it read. Either way the record says when.
async function consumeMoved(scope) {
  if (!ctx.libKey) return;
  const doc = await store.doc("fingerprints/" + ctx.libKey).get();
  if (!doc.exists) return;
  const fp = doc.data();
  if (!fp.diff) return;
  const covered = new Set(scope || []);
  const keep = (names) => covered.size ? (names || []).filter((n) => !covered.has(n)) : [];
  const next = { changed: keep(fp.diff.changed), added: keep(fp.diff.added), removed: covered.size ? (fp.diff.removed || []) : [] };
  await store.doc("fingerprints/" + ctx.libKey).set(Object.assign({}, fp, { diff: next, auditedAt: new Date().toISOString() }));
}
async function recordRun(scope, candidates, kept, added, measures, closedCount) {
  const at = new Date().toISOString();
  try {
    // The trend charts read coverage/sets/variants/variables off the RUN, not
    // off the library — that is what makes them a history rather than three
    // copies of today. The record schema always specified these fields; this
    // never wrote them, so every chart said "No runs yet" after three audits.
    const m = measures || {};
    const rows = Object.values(state);
    // An empty scope is a first run, which means every set — so count what
    // the scan walked. Counting the scope wrote "0 components" over 82.
    const n = scope.length || m.sets || 0;
    const runId = at.slice(0, 10) + "-page-" + at.slice(11, 19).replace(/:/g, "");
    await store.doc("runs/" + runId).set({
      fileKey: ctx.libKey, at: at, kind: "audit", via: "page",
      trigger: scope.length ? "changes" : "full",
      cost: runSpend || undefined,
      coverage: m.coverage != null ? m.coverage : undefined,
      sets: m.sets, variants: m.variants, variables: m.variables,
      open: rows.filter(isOpen).length,
      scope: "In-page audit of " + plural(n, "component") + ".",
      // `closed` is known at both call sites and was written as a literal
      // zero, so all nineteen runs of one real record say "cleared: 0",
      // including the one whose own note says "14 closed or dismissed".
      found: added, cleared: closedCount || 0,
      note: (candidates
        ? candidates + " candidate" + (candidates === 1 ? "" : "s") + ", " + kept + " survived judgement, " + added + " filed in the queue, new or reopened."
        : "No candidates.")
        // Said out loud, or a run whose numbers only add up because
        // "dismissed" absorbed "never judged" reads as a clean account.
        + ((fileRows.unjudged || []).length
            ? " " + fileRows.unjudged.length + " set" + (fileRows.unjudged.length === 1 ? "" : "s") +
              " came back unjudged and were raised rather than dropped: " +
              fileRows.unjudged.slice(0, 5).join(", ") +
              (fileRows.unjudged.length > 5 ? " and " + (fileRows.unjudged.length - 5) + " more" : "") + "."
            : "")
    });
    return runId;
  } catch (e) { /* the audit still stands even if the registry write fails */ }
}
// One request over a slice of the scan. `items` is whole sets, so every `i`
// still indexes its own set's candidate list.
//
// The instruction itself comes from the SKILL, served at /scripts beside the
// scanner. This page holds no opinion about what survives a scan — it renders
// the outcome and launches the run, and both halves of the audit belong to
// the one place that defines them.
// Truncation is recoverable, and estimating a budget is not the way to avoid
// it: 2000 flat truncated, then 160 per candidate, then 400. Every number was
// measured on one library and wrong on the next, because what a batch costs
// depends on how much the pass KEEPS, which is not knowable beforehand.
// So: try, and on truncation split the batch and retry each half. A single
// set that still overruns gets one attempt at the full cap, then fails naming
// itself instead of taking the whole run down.
async function judgeBatch(items, count, rules, judgeTemplate) {
  try {
    return await judgeOnce(items, count, rules, judgeTemplate);
  } catch (e) {
    // An answer that is not JSON is asked for once more. It happened once in
    // two runs of one library on 2026-09-24 and failed the whole stage; the
    // next run of the same stage answered cleanly. Twice is a real failure.
    if (e && e.code === "bad_json") return await judgeOnce(items, count, rules, judgeTemplate);
    if (!e || e.code !== "truncated") throw e;
    if (items.length > 1) {
      const mid = Math.ceil(items.length / 2);
      const a = await judgeBatch(items.slice(0, mid), count, rules, judgeTemplate);
      const b = await judgeBatch(items.slice(mid), count, rules, judgeTemplate);
      return { sets: ((a && a.sets) || []).concat((b && b.sets) || []) };
    }
    try {
      return await judgeOnce(items, 1e9, rules, judgeTemplate);
    } catch (e2) {
      // Still `truncated`: this is the judge's limit, not Figma's, and the
      // notice used to say "Figma refused the code" about it.
      if (e2 && e2.code === "truncated")
        throw Object.assign(
          new Error("\u201c" + items[0].set + "\u201d raised more findings than one answer can hold"),
          { code: "truncated" });
      throw e2;
    }
  }
}
async function judgeOnce(items, count, rules, judgeTemplate) {
  const fill = (t, k, v) => t.split("{{" + k + "}}").join(v);
  let prompt = judgeTemplate;
  prompt = fill(prompt, "CONVENTIONS", (rules.conventions || []).map((r) => "- " + r).join("\n"));
  prompt = fill(prompt, "RULINGS", (rules.rulings || []).map((r) => "- " + r).join("\n"));
  prompt = fill(prompt, "CANDIDATES", JSON.stringify(items.map((e) => ({
    set: e.set, axes: e.axes,
    candidates: e.candidates.map((c, i) => ({ i: i, sev: c.sev, rule: c.rule, text: c.text }))
  })), null, 1));
  return await askClaude.json(prompt, { max_tokens: Math.min(16000, 1500 + 600 * count), spend: runSpend, use: "judge" });
}
// The other stages the page's Audit runs once the components stage is done:
// the foundations audit (the file as a whole, every run) and the component
// validator for the library's recorded code target, over the sets this
// audit read. Each is its skill's own script served by the service, judged
// by the same pass against the same rulings, and filed as that skill's
// rows, so the page's Audit is the project audit's first three stages and
// the queue shows all of them, then the variable audit's link check where
// the settings name a source library. A stage that fails says so in its
// line and stops only itself.
// `first` is the components stage's own result, held back so that nothing is
// announced until every stage has finished. It is shown here, before this
// function's own line, because it is the first stage and reads as the lead.
async function runOtherStages(scan, rules, runId, first) {
  /*
   * ONE TOAST FOR ONE RUN.
   *
   * A run has one answer and used to give it in two: the components stage's
   * own headline, then the stage line, stacked — the reader dismissing two
   * notices about one thing and working out how they relate.
   *
   * The stage line's headline wins the title, because it is the one that
   * says whether the run finished and what it could not do. The components
   * result leads the detail, because it is the number anyone actually came
   * for. It is stated even when a later stage threw: those rows really are
   * filed, and losing the only account of them would be a silent audit —
   * which is what holding it back was meant to prevent, not cause.
   */
  let mine = null, err = null;
  try { mine = await otherStages(scan, rules, runId); }
  catch (e) { err = e; }
  // Each half ends in a full stop before the next begins, or the detail runs
  // two sentences together: "…11 survived judgement Library file: 6…".
  const stop = (t) => { const x = String(t || "").trim(); return !x ? "" : (/[.!?]$/.test(x) ? x : x + "."); };
  // The components stage's HEADLINE only. Its own detail restated the same
  // numbers a second way ("11 raised by the scan, 11 survived judgement"),
  // which is the run record's job, not a notice's.
  const lead = first ? stop(first.title) : "";
  if (mine) {
    toast(mine.title, err ? "warn" : mine.tone,
          { detail: [lead, mine.detail].filter(Boolean).join(" "),
            linkText: mine.linkText || (first && first.linkText), onLink: mine.onLink || (first && first.onLink) });
  } else if (first) {
    // Every stage threw before it could report. The components result is all
    // there is, so it goes out on its own rather than not at all.
    toast(first.title, first.tone, { detail: first.detail, linkText: first.linkText, onLink: first.onLink });
  }
  if (err) throw err;
}
async function otherStages(scan, rules, runId) {
  const lines = [];
  const sc = await api.scripts();
  const ready = await claudeReady();
  const judgeTemplate = sc.judge;
  // Judge candidates the way the components stage does, and trace each kept
  // finding back to its candidate by index.
  async function judgeAll(entries, judgeRules) {
    const kept = [];
    // Reset BOTH, and before the early return. `unjudged` was set only after
    // it, so a stage with nothing to judge inherited the previous stage's
    // list and printed it as its own: the validator's line naming the
    // foundations run's sets, about a stage that judged nothing.
    judgeAll.why = {};
    judgeAll.unjudged = [];
    const live = entries.filter((e) => e.candidates && e.candidates.length);
    const total = live.reduce((n, e) => n + e.candidates.length, 0);
    if (!total) return kept;
    const size = Math.max(8, Math.min(24, Math.ceil(total / 4)));
    const batches = [];
    for (const entry of live) {
      const last = batches[batches.length - 1];
      const n = entry.candidates.length;
      if (!last || last.n + n > size) batches.push({ items: [entry], n: n });
      else { last.items.push(entry); last.n += n; }
    }
    /*
     * A set the judge did not answer for is KEPT, never dismissed.
     *
     * Anything not in `kept` is dismissed by `dismissedOf`, and a reply that
     * simply omits a set — `{"sets":[]}`, a batch that came back naming sets
     * that do not match, a truncation the retry did not catch — left every
     * candidate in it unheld. Those rows then closed as "Dismissed by the
     * judgement pass … with no reason given", so a bad-but-parseable
     * judgement emptied the queue and looked exactly like a run where the
     * judge had ruled everything out.
     *
     * Keeping is the recoverable direction: a finding raised that should
     * have been dropped is one the maintainer dismisses in a click, and a
     * finding dismissed that should have been raised is gone. So an
     * unanswered set is raised, and the run says how many.
     */
    const answered = new Set();
    for (const batch of batches) {
      const part = await judgeBatch(batch.items, batch.n, judgeRules || rules, judgeTemplate);
      for (const s of (part && part.sets) || []) {
        const entry = live.find((e) => e.set === s.set);
        if (!entry) continue;
        answered.add(entry.set);
        for (const d of (s.dropped || [])) if (typeof d.i === "number") judgeAll.why[entry.set + "\n" + d.i] = d.why || "";
        for (const f of (s.findings || [])) {
          const cand = (typeof f.i === "number" && entry.candidates[f.i]) || entry.candidates.find((x) => x.text === f.text);
          if (cand) kept.push({ entry, cand, f });
        }
      }
    }
    judgeAll.unjudged = live.filter((e) => !answered.has(e.set)).map((e) => e.set);
    for (const entry of live) {
      if (answered.has(entry.set)) continue;
      for (const cand of entry.candidates) kept.push({ entry, cand, f: { text: cand.text } });
    }
    return kept;
  }
  // What the judge never answered for, said out loud. These candidates were
  // RAISED rather than dropped, which is the safe direction, but a reader
  // comparing counts has to know why the number is higher than usual.
  const unjudgedNote = () => ((judgeAll.unjudged || []).length
    ? " " + judgeAll.unjudged.length + " set" + (judgeAll.unjudged.length === 1 ? "" : "s") +
      " came back unjudged and were raised rather than dropped: " + judgeAll.unjudged.slice(0, 5).join(", ") +
      (judgeAll.unjudged.length > 5 ? " and " + (judgeAll.unjudged.length - 5) + " more" : "") + "."
    : "");
  // `judged` is the sets the judge actually answered for. A set it never
  // mentioned — a batch that came back empty, a name that did not match, or a
  // run with no judge at all — is KEPT, never dismissed: "considered and
  // refused" and "never looked at" are not the same claim, and only the first
  // may close a row.
  const dismissedOf = (entries, kept, judged) => {
    const held = new Set(kept.map((k) => k.entry.set + "\n" + k.cand.text));
    const seen = judged ? new Set(judged) : null;
    const out = [];
    for (const e of entries) (seen && !seen.has(e.set) ? [] : (e.candidates || [])).forEach((c, i) => {
      if (!held.has(e.set + "\n" + c.text)) out.push({ where: e.set, check: c.text, key: c.key, why: (judgeAll.why || {})[e.set + "\n" + i] || "" });
    });
    return out;
  };
  // Rulings only. These stages' candidates are deterministic (the file
  // checks) or decisions by design (the validator's classes), and the
  // judge, told to keep anything a ruling did not name, still dropped a
  // real page-order finding twice and reversed itself on six stroke
  // findings between two runs of the same file. So the fixed-rule file
  // findings are filed as raised, never judged, and what is judged — the
  // part-rule questions and the validator's classes — is judged against
  // the rulings alone, with the components conventions withheld.
  const rulingsOnly = Object.assign({}, rules, { conventions: [
    "Drop a candidate ONLY when a ruling below names that page, category, component or class. A mechanism, a deliberate-looking choice, a library-wide state or a convention is NOT grounds to drop one: keep it, and let the maintainer rule."
  ] });
  /*
   * A rule's advice, as one bullet per side of the choice. Every align string
   * is written in the same shape — "in Figma: …; in code: …; accept …" — with
   * a trailing source link in brackets, so it splits cleanly on the clause
   * boundaries and each half gets a line and a capital. A designer reading a
   * Figma row should not have to find "in Figma" halfway through a sentence
   * about module augmentation.
   */
  const LEAD = { "in figma": "In Figma", "in code": "In code", accept: "Accept" };
  const adviceLines = (align) => String(align || "")
    .split(/;\s*(?=in (?:Figma|code):|accept\b)/i)
    .map((part) => {
      const m = part.match(/^\s*(in Figma|in code|accept)\b:?\s*/i);
      if (!m) return part.trim();
      const body = part.slice(m[0].length).trim();
      return LEAD[m[1].toLowerCase()] + ": " + body.charAt(0).toUpperCase() + body.slice(1);
    })
    .filter(Boolean);

  // A stage that could not START is skipped, not failed. The distinction is
  // the reader's next action: a skip wants a file opened or a setting filled
  // in, a failure wants someone to look at what broke. Lumping them under
  // "1 stage failed" made a routine "open the source library too" read as an
  // alarm, which is how a reader learns to ignore the headline.
  const stageEnd = (label, e) => {
    const why = e && e.message ? e.message : "unknown";
    const skipped = !!(e && (e.skipped || e.code === "no_plugin"));
    brief.push(label + " " + (skipped ? "skipped" : "failed"));
    return label + ": " + (skipped ? "skipped" : "failed") + " \u2014 " + why;
  };
  const stageLine = (candidates, r) => {
    const bits = [candidates + " candidate" + (candidates === 1 ? "" : "s")];
    if (r.added) bits.push(r.added + " new");
    if (r.reopened) bits.push(r.reopened + " reopened");
    if (r.updated) bits.push(r.updated + " already in the queue");
    if (r.closed) bits.push(r.closed + " closed or dismissed");
    if (bits.length === 1) bits.push("nothing filed");
    /*
     * The writer's refusal, said out loud.
     *
     * `applyRows` returns `refused` when a full run named nothing it read and
     * so was not allowed to close anything — a guard whose own comment says it
     * exists to make that "legible instead of a silent undefined". Nothing
     * read it, so the line printed "0 candidates, nothing filed", which is
     * exactly what a clean stage prints. The guard fired and the reader could
     * not tell.
     */
    return bits.join(", ") + "." + (r.refused ? " NOTHING WAS CLOSED \u2014 " + r.refused + "." : "");
  };
  /*
   * The SHORT form, for the one toast a run now shows.
   *
   * The long lines say what each stage read, what it could not check and
   * which components a map does not name — three hundred characters a stage,
   * and four stages of it stacked into a notice nobody finishes. They are
   * kept in full on the run record, where History reads them; the toast gets
   * the numbers that changed and nothing else.
   */
  const brief = [];
  const stageBrief = (label, r, note) => {
    const bits = [];
    if (r && r.added) bits.push(r.added + " new");
    if (r && r.reopened) bits.push(r.reopened + " reopened");
    if (r && r.closed) bits.push(r.closed + " closed");
    brief.push(label + " " + (bits.length ? bits.join(", ") : (note || "no change")));
  };

  const fileLabel = ownerLabel("figma-foundations-audit");
  try {
    if (!sc.foundations) lines.push(fileLabel + ": skipped — the service has no foundations scanner.");
    else {
      runProgress(ctx.libKey, 60, "Checking the file");
      say("Checking the file as a whole…", null, true);
      const out = await bridge.exec("const TOKENS = " + JSON.stringify(rules.tokens) + ";\n" + sc.foundations, 180000);
      if (!out || !out.audited) throw new Error("the bridge answered, but not with a file scan");
      if (out.fileKey && ctx.libKey && out.fileKey !== ctx.libKey) throw new Error("that scanned " + (out.fileName || "another file") + ", not this library");
      // Fixed rules (page order, a bare slash, a case collision) are filed as
      // raised; only the part-rule question ("review") goes to the judge.
      const fixed = [], asked = [];
      for (const e of out.audited) {
        const q = e.candidates.filter((c) => c.sev === "review"), fx = e.candidates.filter((c) => c.sev !== "review");
        if (fx.length) fixed.push(Object.assign({}, e, { candidates: fx }));
        if (q.length) asked.push(Object.assign({}, e, { candidates: q }));
      }
      /*
       * Three of this stage's four checks are FIXED rules — page order, a
       * bare separator, a case collision — and are filed as raised without
       * ever going to the judge. The stage was nonetheless skipped whole when
       * no Claude key was configured, so a dashboard with no key reported
       * "Library file: skipped" and never checked the file's structure at
       * all, on a button the reader believes ran.
       *
       * Only the part-name question needs judging. With no judge, it is the
       * one thing held back, and the line says so.
       */
      const kept = ready ? await judgeAll(asked, rulingsOnly) : [];
      const heldForJudge = ready ? 0 : asked.reduce((n, e) => n + e.candidates.length, 0);
      /*
       * The CHECK's two strings, not the judge's one. Every finding here now
       * carries `text` (what is wrong) and `advice` (what to do), and they go
       * to the two columns named for them.
       *
       * Before this, a part-naming row (figma-standard rule 9) put the new name in "The question" —
       * "figma-standard rule 9 naming would be Table - Column - Table - Header / Hug" —
       * while "My recommendation" restated the rule that had just been
       * broken: the answer on the side that asks, and a rule number on the
       * side that answers. The judge was writing both, and it writes about
       * the rule because the rule is what it was given.
       */
      const rowOf = (where, node, c, bucket) => ({
        where, node: node || null, check: c.text, key: c.key, rule: c.rule, bucket, sev: c.sev,
        fix: [c.text], rec: [c.advice || "Decide how to handle it."] });
      const findings = kept.map(({ entry, cand }) => rowOf(entry.set, entry.id, cand, 3));
      for (const e of fixed) for (const c of e.candidates)
        findings.push(rowOf(e.set, e.id, c, c.rule === "page-order" ? 1 : 3));
      // The scanner walks every page and is handed no component list, so
      // `reach` is every component that exists plus the page list, and it
      // reports the rules it ran — a check whose setting was missing from
      // the context document must not close the rows it never read.
      const r = await fileStage("figma-foundations-audit", null,
                                { names: out.reach || [], complete: true, everything: true, ran: out.ran || undefined, source: "figma" },
                                findings, dismissedOf(asked, kept, ready ? undefined : []));
      stageBrief(fileLabel, r);
      lines.push(fileLabel + ": " + stageLine(out.audited.reduce((n, e) => n + e.candidates.length, 0), r) + unjudgedNote() +
                 // Silence is only meaningful where the check ran.
                 (heldForJudge
                   ? " " + heldForJudge + " naming question" + (heldForJudge === 1 ? "" : "s") +
                     " held back \u2014 no Claude key, so nothing could judge them against this project's rulings."
                   : "") +
                 ((out.notRun || []).length
                   ? " NOT checked: " + out.notRun.join(", ") + " \u2014 the context document does not carry the setting each needs."
                   : "") +
                 // Different sentence, because it is a different fact: the
                 // setting IS recorded and this library has nothing the check
                 // looks at. Saying "not checked" of it was untrue.
                 ((out.notApplicable || []).length
                   ? " Nothing to check for " + out.notApplicable.join(", ") + " in this library."
                   : ""));
    }
  } catch (e) { lines.push(stageEnd(fileLabel, e)); }

  const buildLabel = ownerLabel("component-validator");
  try {
    const target = rules.codeTarget;
      // What the other side of a comparison is CALLED. A row that says "In
      // MUI" names the thing the project builds with; one saying "In web"
      // would name nothing a reader recognises.
      const TARGET_NAMES = { web: "the web", ios: "SwiftUI", android: "Compose" };
      const targetName = rules.frameworkName || TARGET_NAMES[target] || target;
    if (!target) lines.push(buildLabel + ": skipped — the settings name no code target.");
    else if (!sc.validator) lines.push(buildLabel + ": skipped — the service has no validator.");
    else if (!ready) lines.push(buildLabel + ": skipped — nothing to judge the findings.");
    else {
      // Every set the components scan read, batched by variant count so one
      // walk stays inside the plugin's patience. Page entries carry no variants.
      // No tree walk. The service reads the project's STORED specs and runs
      // the engine over them — the same input, through the same resolver, as
      // each component's Implementation table in the docs build. It used to
      // batch the whole library out through the plugin, which made this the
      // slowest stage of a run AND gave the engine a second input that
      // disagreed with the first in both directions.
      const sets = scan.audited.filter((e) => e.id && e.variants > 0);
      // The LIVE file, read by the snapshot plugin's own walk run headless
      // through the bridge — the same function that writes a snapshot, so
      // the audit and the store describe a component in one shape. It read
      // the stored snapshot until 2026-09-22, and a shadow removed from a
      // dialog at lunch was still on the Web build board at night while the
      // Broken tokens tab, which reads Figma, had cleared (toolkit-standard
      // §D 5). 120 sets, 2,112 variants: 18 seconds.
      if (!sc.snapshot) throw new Error("the service has no snapshot plugin to read the library with");
      runProgress(ctx.libKey, 72, "Reading the library");
      say("Reading the library for the build check…", null, true);
      // The project's own page rule, so this walk and the components scan
      // select the same pages; the plugin's default is its own convention.
      const T = rules.tokens || {};
      const live = await bridge.exec("const PAGES = " + JSON.stringify(T.componentPages || "") + ";\nconst SECTION = " + JSON.stringify(T.sectionHeader || "") + ";\nconst EXCLUDE = " + JSON.stringify(T.excludeSections || []) + ";\n" + sc.snapshot, 600000);
      if (!live || !Array.isArray(live.components)) throw new Error("the bridge answered, but not with the library's components");
      if (live.fileKey && ctx.libKey && live.fileKey !== ctx.libKey) throw new Error("that read " + (live.fileName || "another file") + ", not this library");
      runProgress(ctx.libKey, 76, "Checking the build");
      say("Checking the build against the file…", null, true);
      // The framework the project records, with its component map: MUI's
      // rules apply on top of the platform target and fire only for the
      // components the settings map, so both travel together or neither does.
      const v = await api.validate(target, null, rules.framework || null, rules.frameworkComponents || null, live.components);
      if (!v || !v.ok) throw new Error((v && v.error) || "the engine did not answer");
      /*
       * A read that could not be narrowed to THIS library is not a full run
       * of it. The service used to answer an unrecognised file key with every
       * spec in the store — 197 across three libraries — and this stage filed
       * the result with `full: true`, so one library's audit raised and CLOSED
       * component-validator rows for all of them. The service now says whether
       * it could scope the read; a run that could not is a failure of the
       * probe, not a verdict on the file.
       */
      if (v.scoped === false) throw new Error("the service could not tell which library to read \u2014 it would have validated every component in the store, so nothing was filed");
      // The engine's findings become candidates, one set per component, so
      // the same judgement pass drops what a ruling or convention covers.
      // A finding whose fix lands ONLY in code is not a question for this
      // board. It is a translation — a mask is `clip-path`, an inside stroke
      // is a border — and the component's own documentation page already
      // publishes it, under Implementation, built from this same engine
      // (tools/docs-site/src/lib/snapshot.js, `codeNotes`). Filing it here as well
      // put the same sentence in two places and made a queue of 78 rows read
      // as 78 jobs for the designer when nine of them were notes for the
      // build. `both` stays: it is a real decision, and the page shows it as
      // "open with the designer" precisely because this board still asks it.
      const notes = v.findings.filter((f) => f.lands === "code");
      const byComp = {};
      for (const f of v.findings) {
        if (f.lands === "code") continue;
        (byComp[f.component] = byComp[f.component] || []).push(f);
      }
      const entries = Object.entries(byComp).map(([set, fs]) => ({
        set: set, id: (sets.find((e) => e.set === set) || {}).id || null, axes: [],
        // `lands` travels with the candidate: where the fix goes is the
        // engine's answer, computed beside the advice it reads it from, not
        // something this page re-derives from the sentence it renders.
        candidates: fs.map((f) => ({ sev: "review", rule: f.class, key: f.key, align: f.align, lands: f.lands || null, n: (f.variants || []).length,
                                     expected: f.expected || null, usedBy: f.usedBy || [],
                                     inFile: f.layer === "$root" ? "The component frame" : f.layer,
                                     // Every particular the one decision covers, not just the
                                     // first: a slot filled with three different sample
                                     // components is one question about the slot, and the row
                                     // should say which three.
                                     drawn: (f.shared ? "“" + f.shared + "”" : f.layer === "$root" ? "The component frame" : "“" + f.layer + "”") + " — " +
                                            ((f.details || []).length > 1 ? f.details.join("; ") : f.detail),
                                     text: f.class + " · " + f.layer + " · " + f.detail })) }));
      const kept = await judgeAll(entries, rulingsOnly);
      const findings = kept.map(({ entry, cand, f }) => ({
        where: entry.set, node: entry.id, check: cand.text, key: cand.key, rule: cand.rule, bucket: 3, sev: cand.sev === "preference" ? "pref" : "warn", lands: cand.lands || null,
        // The ENGINE's words, not the judge's. The judge decides whether a
        // finding survives; it was also writing the sentence the reader acts
        // on, and it writes for whoever it imagines is reading — which put
        // "Schedule a theme variant in `components.MuiButton.variants`, with
        // TypeScript module augmentation" in a designer's question column,
        // for a finding whose whole point is what to change in Figma.
        //
        // Left: what is drawn. Right: what to do, one bullet per side of the
        // choice, so "in Figma" is a line of its own rather than a clause
        // inside a paragraph about TypeScript.
        // With a counterpart, the row is a comparison and says so; without
        // one it stays the ordinary pair of cells, because inventing the
        // other half would be this page writing the finding.
        contrast: !!cand.expected,
        fix: cand.expected
          ? ["In Figma — " + cand.inFile + (cand.n ? " · " + cand.n + " variant" + (cand.n === 1 ? "" : "s") : ""),
             "In " + targetName + " — " + cand.expected]
          // A shared cause counts the components it reaches, not the variants
          // it was seen in: the reader is asked for one change, and the number
          // that matters is how far that change goes. They are named too: a
          // map that names no counterpart for 50 components is acted on one
          // name at a time, and a count alone sent the reader off to find them.
          : [cand.drawn + (cand.usedBy.length
               ? " · " + cand.usedBy.length + " component" + (cand.usedBy.length === 1 ? "" : "s") + ": " + cand.usedBy.join(", ")
               : cand.n ? " · " + cand.n + " variant" + (cand.n === 1 ? "" : "s") : "")],
        rec: adviceLines(cand.align) }));
      /*
       * TWO queues, because there are two questions. A platform class asks
       * what the web can draw; a framework class asks what the component
       * library the app is built with already owns. The page's chips have
       * said so since the framework layer shipped — "Web build" and "MUI
       * build" are keyed by owner AND target — and this call was filing both
       * under the platform target alone.
       *
       * The cost was not cosmetic: a session had filed MUI findings under
       * `web+mui`, this stage filed them under `web`, and `full: true` closes
       * only rows of its own target. So neither run could ever close, refresh
       * or replace the other's, and one board carried two MU2 rows for one
       * finding — the older one still showing text from the day it was filed,
       * surviving every rewrite since.
       */
      const composite = rules.framework ? target + "+" + rules.framework : null;
      const isFramework = (row) => /^[A-Z]{2}\d/.test(row.rule || "");
      const parts = [{ target: target, rows: findings.filter((f) => !isFramework(f)) }];
      if (composite) parts.push({ target: composite, rows: findings.filter(isFramework) });
      let r = null;
      for (const part of parts) {
        // Each target closes only its own: a full run of the platform queue
        // must not clear the framework queue merely by not raising its rows.
        // The walk read every component page of the live file, so a row
        // naming a set it did not meet is about one renamed or removed.
        const one = await fileStage("component-validator", part.target, { names: v.scope || [], complete: true, everything: true, source: "figma" },
                                    part.rows, part.target === target ? dismissedOf(entries, kept) : []);
        r = r ? { ok: true, added: r.added + one.added, closed: r.closed + one.closed,
                  updated: r.updated + one.updated, reopened: r.reopened + one.reopened } : one;
      }
      // The notes are counted out loud. A stage that quietly drops nine of its
      // own findings is indistinguishable from a stage that missed them.
      stageBrief(buildLabel, r);
      lines.push(buildLabel + ": " + stageLine(v.findings.length - notes.length, r) + unjudgedNote() +
                 " Read " + (v.components || 0) + " live component" + (v.components === 1 ? "" : "s") + "." +
                 (notes.length ? " " + notes.length + " code-only finding" + (notes.length === 1 ? "" : "s") +
                                 " went to the components' Implementation tables instead of the queue." : "") +
                 (v.silent && v.silent.length ? " Silent: " + v.silent.join(", ") + "." : "") +
                 /*
                  * Which components the framework map does not name. The
                  * engine computes this and its own comment says "nothing is
                  * what a clean result looks like, so the caller says this out
                  * loud" — and the caller then dropped it. A component the map
                  * does not name is checked by no framework rule at all, and
                  * the stage read as though it had covered everything.
                  */
                 (v.unmapped && v.unmapped.length
                   ? " NOT checked against " + rules.frameworkName + ": " +
                     v.unmapped.length + " component" + (v.unmapped.length === 1 ? "" : "s") +
                     " the map does not name \u2014 " + v.unmapped.slice(0, 6).join(", ") +
                     (v.unmapped.length > 6 ? " and " + (v.unmapped.length - 6) + " more" : "") + "."
                   : ""));
    }
  } catch (e) { lines.push(stageEnd(buildLabel, e)); }

  // Token links: does every variable and style the components bind still
  // exist in the source library, by key. Two calls to the plugin — the key
  // set from the source (which must be open in Figma too), then the walk of
  // this library against it — and a deterministic answer, filed as raised.
  const linksLabel = ownerLabel("figma-variable-audit");
  try {
    const source = rules.sourceLibrary;
    if (!source) lines.push(linksLabel + ": skipped — the settings name no source library.");
    else if (!sc.links) lines.push(linksLabel + ": skipped — the service has no link scanner.");
    else {
      // The one stage that reads a second file, so the spinner moves to it:
      // when this is the stage that hangs, the file it is waiting on is the
      // one nobody opened, and the list now says which.
      runProgress(source, 85, "Reading its keys");
      say("Reading the source library’s keys…", null, true);
      // Two minutes was the figure before either of these did real work. The
      // keys read enumerates every collection in the source and every variable
      // in each; the enumeration below walks every page of the consumer AND
      // probes the team library for what it publishes. Both now take as long
      // as a scan batch is allowed, because both are a scan of something.
      // Each call names itself in its failure: "timed out" alone said nothing
      // about which of a keys read, a set list and N batches gave up, and the
      // stage timed out four times in a day with nothing to act on.
      // Each plugin call named, and timed: the stage line ends with how long
      // each took, so a run that overran the 240-second cap says which call
      // did and a run that passed says how close it came. "4 of ~10 runs
      // time out, cause unknown" stood for a day because nothing recorded it.
      const took = [];
      const named = async (label, run) => { const t0 = Date.now(); try { return await run(); } catch (e) { throw Object.assign(new Error(label + " (after " + Math.round((Date.now() - t0) / 1000) + "s): " + (e && e.message ? e.message : "failed")), { code: e && e.code, skipped: e && e.skipped }); } finally { took.push(label.replace(/ \(.*$/, "") + " " + Math.round((Date.now() - t0) / 1000) + "s"); } };
      const k = await named("reading the source's keys", () => api.exec("const MODE = \"keys\";\n" + sc.links, 240000, source));
      if (!k.ok) {
        const shut = k.error === "wrong_file_not_open" || k.error === "plugin_not_connected";
        throw Object.assign(new Error(shut ? "the source library is not open in Figma, so broken links cannot be told from live ones"
                                           : (k.error || "the keys step did not answer")),
                            shut ? { skipped: true } : {});
      }
      const keys = k.result && k.result.result !== undefined ? k.result.result : k.result;
      if (!keys || !keys.variables) throw new Error("the source library answered, but not with its keys");
      if (keys.fileKey && keys.fileKey !== source) throw new Error("that read " + (keys.fileName || "another file") + ", not the source library");
      // Enumerate before scanning. One scan of the whole library is one call
      // with no progress and no partial result: 121 sets overran the
      // four-minute cap and the stage failed having already resolved most of
      // them. This is cheap — no binding is resolved — and it also reads the
      // published list once, for every batch below to share.
      runProgress(ctx.libKey, 88, "Listing sets");
      say("Listing the sets to check…", null, true);
      // A library that is its own source binds its own variables, which are
      // local and never a library link, so what it publishes cannot matter
      // here — and probing the libraries it subscribes to asked the wrong
      // file: one project's only one is its Documentation furniture, whose
      // listing hangs, and every run waited 20 s to say "NOT checked".
      const self = source === ctx.libKey;
      const enumerated = await named("listing the sets", () => bridge.exec("const MODE = \"sets\";\nconst SELF = " + self + ";\nconst TOKENS = " + JSON.stringify(rules.tokens) + ";\n" + sc.links, 240000));
      if (!enumerated || !enumerated.sets) throw new Error("the bridge answered, but not with a set list");
      if (enumerated.fileKey && ctx.libKey && enumerated.fileKey !== ctx.libKey) throw new Error("that read " + (enumerated.fileName || "another file") + ", not this library");
      // By variant count, which is what the walk actually costs. 120 variants
      // a batch held for a fortnight and then overran the 240-second cap on
      // three of nine full runs in one day, on two libraries, and a batch
      // that overruns fails the whole stage with everything it resolved
      // thrown away. Half the batch is twice the calls and none of the
      // risk: each batch has headroom the cap was meant to give.
      const linkBatches = []; let lcur = [], ln = 0;
      for (const e of enumerated.sets) {
        if (ln + e.variants > 60 && lcur.length) { linkBatches.push(lcur); lcur = []; ln = 0; }
        lcur.push(e); ln += e.variants;
      }
      if (lcur.length) linkBatches.push(lcur);
      const KEYSTR = JSON.stringify({ variables: keys.variables, styles: keys.styles, published: enumerated.published || { variables: [], styles: [] } });
      const out = { audited: [], measures: { sets: 0, bindings: 0, styleRefs: 0, local: 0, broken: 0 }, publishedSeen: (enumerated.published || {}).variables ? enumerated.published.variables.length : 0 };
      const seenVars = new Set(), seenStyles = new Set();
      for (const [i, b] of linkBatches.entries()) {
        runProgress(ctx.libKey, 88 + 11 * ((i + 1) / linkBatches.length), "Checking bindings");
        say("Checking bindings against " + keys.variables.length + " variables and " + keys.styles.length + " styles", null, true);
        const part = await named("batch " + (i + 1) + " of " + linkBatches.length + " (" + b.length + " sets, " + b.reduce((n, e) => n + e.variants, 0) + " variants)",
                                 () => bridge.exec("const MODE = \"scan\";\nconst KEYS = " + KEYSTR + ";\n" +
                                       "const SCOPE = " + JSON.stringify(b.map((e) => e.id)) + ";\n" +
                                       "const TOKENS = " + JSON.stringify(rules.tokens) + ";\n" + sc.links, 240000));
        if (!part || !part.audited) throw new Error("the bridge answered, but not with a link scan");
        if (part.fileKey && ctx.libKey && part.fileKey !== ctx.libKey) throw new Error("that scanned " + (part.fileName || "another file") + ", not this library");
        out.audited.push(...part.audited);
        const pm = part.measures || {};
        for (const k2 of ["sets", "bindings", "styleRefs", "local", "broken"]) out.measures[k2] += pm[k2] || 0;
        // Union, never sum: a variable forty sets bind is one distinct
        // variable, and the batches would have called it forty.
        for (const id of (part.seen || {}).variables || []) seenVars.add(id);
        for (const id of (part.seen || {}).styles || []) seenStyles.add(id);
        // One batch that could not see the published list makes the whole
        // run's visibility answer unproven, so the weakest batch wins.
        if (i === 0) out.measures.publishedChecked = !!pm.publishedChecked;
        else out.measures.publishedChecked = out.measures.publishedChecked && !!pm.publishedChecked;
      }
      out.measures.distinctVariables = seenVars.size;
      out.measures.distinctStyles = seenStyles.size;
      const findings = [];
      // The scanner's own severity: a key the source neither holds nor
      // publishes may be another library's, which only the maintainer can
      // say, so it is a review rather than an error. Overwriting every one
      // with "error" is how a check turns a question into an accusation.
      for (const e of out.audited) for (const c of e.candidates) findings.push({
        where: e.set, node: e.id || null, check: c.text, key: c.key, rule: "link", bucket: 3, sev: c.sev || "error",
        // Left: WHICH token, and nothing else. Right: what to do, then the
        // list of places to do it. The layers were on the left, under the
        // token — but they are not part of the question, they are the work,
        // and the work belongs in the column the reader acts from.
        fix: [c.text],
        rec: [c.advice || "Relink to a live token, or record the orphan as accepted in the context document."]
               .concat(c.layers || []) });
      // The sets the enumerate pass listed ARE the scope — `.name`, since it
      // returns `{id, name, page, variants}` — and it listed every set on
      // every component page, live, so the scan walked everything.
      const r = await fileStage("figma-variable-audit", null,
                                { names: enumerated.sets.map((e) => e.name), complete: true, everything: true, source: "figma" }, findings);
      const m = out.measures || {};
      stageBrief(linksLabel, r);
      lines.push(linksLabel + ": " + stageLine(out.audited.reduce((n, e) => n + e.candidates.length, 0), r) +
                 " " + (m.bindings || 0) + " bindings and " + (m.styleRefs || 0) + " style references checked across " + (m.sets || 0) + " sets." +
                 // Silence is only meaningful where the check ran. Without the
                 // published list a token that exists but is not published
                 // reads as fine, and the line says so rather than implying
                 // coverage it did not have.
                 (self ? " Publish visibility does not apply: the library is its own source, so its bindings are local."
                   : m.publishedChecked
                   ? " Against " + (out.publishedSeen || 0) + " published tokens as well as what the source holds."
                   : " NOT checked for publish visibility — the library published list came back empty.") +
                 " Calls: " + took.join(", ") + "." +
                 // Counted rather than raised: a weight bound on a layer with
                 // no stroke paint does not appear in Figma's Stroke panel at
                 // all, so a row naming one cannot be acted on. Said out loud,
                 // because a number nobody states reads as a number that is
                 // zero.
                 ((m.dead || 0)
                   ? " " + m.dead + " dead binding" + (m.dead === 1 ? "" : "s") +
                     " not raised: each resolves to nothing AND paints nothing, so Figma's Stroke panel does not show it and there is nowhere to fix it by hand."
                   : ""));
    }
  } catch (e) { lines.push(stageEnd(linksLabel, e)); }

  // Code parity: which of this library's components its code has, and where
  // one it lacks might be under another name. The first half is a comparison
  // of names, made by the service. The second is a question only a reader of
  // both lists can answer, so it is asked with design-code-parity's own
  // instruction and filed as that skill's rows: a suggestion somebody
  // confirms, which the docs site's Parity page shows as one and never draws
  // as a pair.
  const parityLabel = ownerLabel("design-code-parity");
  try {
    const PRIVATE = /^\s*_|\/\s*_/;
    const sets = scan.audited.filter((e) => e.id && e.variants > 0 && !PRIVATE.test(e.set));
    const p = await api.parity(sets.map((e) => e.set));
    if (!p || !p.ok) throw new Error((p && p.error) || "the service did not compare the library with its code");
    if (!p.stated) lines.push(parityLabel + ": skipped — the settings name no code for this library.");
    else if (!sc.pairing) lines.push(parityLabel + ": skipped — the service has no pairing instruction.");
    else if (!ready) lines.push(parityLabel + ": skipped — nothing to read the two lists.");
    else {
      runProgress(ctx.libKey, 95, "Pairing with the code");
      say("Looking for components the code names differently…", null, true);
      // Asked about: a component with no code of its own name, whether the
      // code has nothing for it or only the component its framework name
      // points to — that one is said, so a closer match has to beat it.
      const asked = p.figmaOnly.map((name) => ({ name }))
        .concat(p.both.filter((b) => !b.sameName).map((b) => ({ name: b.figma, builtAs: b.code })));
      const fill = (t, k, v) => t.split("{{" + k + "}}").join(v);
      let prompt = sc.pairing;
      prompt = fill(prompt, "RULINGS", (rules.rulings || []).map((r) => "- " + r).join("\n") || "- none");
      prompt = fill(prompt, "FIGMA", JSON.stringify(asked, null, 1));
      // A nested component says what it sits in (`ContextualPanel` in Table),
      // which is often the word its Figma name carries and its own does not.
      prompt = fill(prompt, "CODE", JSON.stringify(p.codeOnly.map((k) => {
        const at = k.path.split("/").slice(0, -1).join("/");
        return at ? { name: k.name, in: at } : { name: k.name };
      }), null, 1));
      // The judge's settings: this is a judgement, and at the service's
      // default the model thought its whole budget away and answered nothing
      // (4,000 tokens out, no text, twice running).
      const answer = asked.length && p.codeOnly.length
        ? await askClaude.json(prompt, { max_tokens: 8000, spend: runSpend, use: "judge" })
        : { pairs: [] };
      // Only names that were on the two lists, each once: an answer naming
      // anything else is the model writing a component, and a row about a
      // component that does not exist could never be closed.
      const onFigma = new Set(asked.map((x) => x.name)), onCode = new Set(p.codeOnly.map((k) => k.name));
      const used = new Set();
      const pairs = [];
      for (const x of (answer && answer.pairs) || []) {
        if (!x || !onFigma.has(x.figma) || !onCode.has(x.code) || used.has("f\n" + x.figma) || used.has("c\n" + x.code)) continue;
        used.add("f\n" + x.figma); used.add("c\n" + x.code);
        pairs.push(x);
      }
      const findings = pairs.map((x) => ({
        where: x.figma, node: (sets.find((e) => e.set === x.figma) || {}).id || null,
        check: "Possibly " + x.code + " in code", key: "pair|" + x.code, rule: "pair", bucket: 3, sev: "warn", lands: "accept",
        fix: ["The code has no component of this name, and its " + x.code + " has no Figma component of its own"],
        rec: ["Possibly the same component" + (x.why ? ": " + String(x.why).replace(/\s+/g, " ").trim() : ".")] }));
      // Every public set was compared, so every one is in scope: a pair that
      // is no longer proposed, or whose component now has code of its own
      // name, closes.
      const r = await fileStage("design-code-parity", null,
                                { names: sets.map((e) => e.set), complete: true, source: "figma" }, findings);
      stageBrief(parityLabel, r);
      lines.push(parityLabel + ": " + p.both.length + " of " + sets.length + " components are in the code, which has " +
                 p.components + ". " + stageLine(findings.length, r));
    }
  } catch (e) { lines.push(stageEnd(parityLabel, e)); }

  // The stage lines outlive the page: they go onto this run's entry, so the
  // history says what every stage did rather than only the components one.
  if (runId) {
    try {
      const doc = await store.doc("runs/" + runId).get();
      const run = doc.exists ? doc.data() : {};
      // The later stages judge too, so the cost is rewritten with theirs added.
      // And they file rows, so "left open" is counted again now: counted when
      // the run was first written it held the components stage's rows alone —
      // One project's clean re-audit said 25 open with 53 in the queue.
      await pullRecord();
      await store.doc("runs/" + runId).set(Object.assign({}, run, { stages: lines, note: [run.note, lines.join(" ")].filter(Boolean).join(" "),
                                                                  cost: runSpend || run.cost,
                                                                  open: Object.values(state).filter(isOpen).length }));
    } catch (e) { /* the lines still reach the page */ }
  }
  await pullRecord();
  const tone = lines.some((l) => /failed/.test(l)) ? "warn" : "ok";
  // ONE line, and it is the only thing this run leaves in the head.
  //
  // The four stage lines used to be printed here as well, under the buttons:
  // three paragraphs of counts that are already the queue's chips, already
  // saved on the run, and already shown in History, which is the tab whose
  // whole job is what a run did. Three places holding one account, and the
  // header was the one with no room for it.
  //
  // An audit is per library — one record, one file, one set of rulings — so
  // the line names the library it ran on and says which were left, because
  // "Audit finished" over a header listing three files reads as all three.
  const libs = window.DASH_LIBS || [];
  const mine = libs.find((l) => l.key === ctx.libKey);
  const others = libs.filter((l) => l.key !== ctx.libKey)
    .map((l) => (l.platform ? l.platform[0].toUpperCase() + l.platform.slice(1) : l.name || "the other library"));
  const failed = lines.filter((l) => /: failed/.test(l)).length;
  const skipped = lines.filter((l) => /: skipped/.test(l)).length;
  const stages = (n, word) => n + " stage" + (n === 1 ? " " : "s ") + word;
  say("Audited " + (ctx.libName || (mine && mine.name) || "this library") +
      (failed ? " — " + stages(failed, "failed") : skipped ? " — " + stages(skipped, "skipped") : "") +
      (others.length ? ". " + others.join(" and ") + " not audited." : ""), tone);
  // Returned, not shown: the caller holds the components stage's result too
  // and decides the order the two go out in.
  // The headline of the LAST thing to happen in a run, so it says the run is
  // over — "File, build and link stages ran" named the machinery and left the
  // reader working out whether that meant finished.
  return { title: failed ? "Audit complete \u2014 " + stages(failed, "failed")
                  : skipped ? "Audit complete \u2014 " + stages(skipped, "skipped")
                  : "Audit complete",
           // The numbers that changed, one clause a stage. The full account
           // is on the run record, which is what History is for.
           tone, detail: brief.join(" · "), linkText: "See the queue →", onLink: showCleared };
}
async function runAudit(targets) {
  if (auditing) return;
  // "Audit all" is an EMPTY scope: that is what the scanner reads as "every
  // set". It used to be the list of names the stored fingerprints knew, and
  // that list goes stale the moment a component is renamed: a name that no longer
  // exists is a set skipped in silence, and a scan that skipped anything
  // returns no measures, so the stage was never `full` and closed nothing.
  // On one library seven renamed sets were skipped on every run for five
  // hours while the run line said "120 components". A first run has no
  // fingerprints; the sweep after the scan gives it a baseline.
  const firstRun = !ctx.storedPrints;
  // `targets` is the sets the last Check changes saw move; none means all.
  // "All" stays an EMPTY scope rather than the stored names, for the reason
  // above; a list of moved sets is as fresh as the sweep that made it.
  const scope = targets || [];
  if (targets && !targets.length) { say("Nothing to audit.", "warn"); return; }
  runSpend = { calls: 0, input: 0, output: 0, usd: 0 };
  auditing = true; auditBtn.disabled = true;
  // The library may not change under a run, and a sweep may not run beside
  // one: both drive the same plugin, and the audit files against whichever
  // library `ctx.libKey` names at the moment each stage writes.
  ctx.running = true; sweepBtn.disabled = true;
  for (const b of document.querySelectorAll("[data-lib-choice]")) b.disabled = true;
  say(scope.length ? "Scanning " + plural(scope.length, "set") + "\u2026" : "Scanning the whole library\u2026", null, true);
  // The percentages below are the run's own shape — a scan, a judgement pass,
  // three more stages — not a measurement of time. They are stated as the
  // fraction of the run's stages that are behind it, which is the only thing
  // the page actually knows; a stage's own batches move it within its band.
  runProgress(ctx.libKey, 2, "Scanning");
  try {


    const { audit: auditScript } = await api.scripts();
    if (!auditScript) { say("The dashboard service did not return its scanner.", "warn"); return; }

    // The option-order scale is a project rule, so it travels from the
    // context document's settings into the script rather than living inside it.
    const rules0 = await contextRules();
    const prelude = "const TARGETS = " + JSON.stringify(scope) + ";\n" +
                    "const SCALES = " + JSON.stringify(rules0.optionOrder) + ";\n" +
                    "const TOKENS = " + JSON.stringify(rules0.tokens) + ";\n";
    const scan = await bridge.exec(prelude + auditScript);
    runProgress(ctx.libKey, 15, "Scanned");
    if (!scan || !scan.audited) { say("The bridge answered, but not with a scan.", "warn"); return; }
    if (scan.fileKey && ctx.libKey && scan.fileKey !== ctx.libKey) {
      say("That scanned " + (scan.fileName || "another file") + ", not this library \u2014 nothing was kept.", "warn");
      return;
    }
    // What was scanned, for every sentence that counts it. A first run's scope
    // is empty because empty means every set, so counting the scope said
    // "0 components" over 82; a full scan's measures carry the real number.
    const scannedN = scope.length || (scan.measures && scan.measures.sets) || 0;

    // Leave a baseline behind: without one the next "Check changes" has
    // nothing to diff against and the project stays stuck on its first run.
    if (firstRun) { try { await runSweep(); } catch (e) { /* the audit still stands */ } }

    const total = scan.audited.reduce((n, e) => n + e.candidates.length, 0);
    if (!total) {
      // Close first, then measure: openFindings counts the queue, and counted
      // before the close it reported rows this same run had just cleared.
      const closed0 = (await fileRows([], scan)).closed;
      await recordMeasures(scan.measures);
      await recordScores(scan);
      const runId0 = await recordRun(scope, 0, 0, 0, scan.measures, closed0);
      await consumeMoved(scope);                      // a clean scan is still an audit of the library
      say("Nothing to fix in " + plural(scannedN, "component") + "." +
          (closed0 ? " Closed " + closed0 + " row" + (closed0 === 1 ? "" : "s") + " the scan no longer raises." : ""), "ok");
      // HELD until every stage has finished. The components stage is the
      // first of four, so announcing its result here put "11 new findings"
      // on screen while three more stages were still reading Figma — a
      // number the reader takes as the run's answer, minutes before the run
      // has one. `runOtherStages` shows it beside its own.
      await runOtherStages(scan, rules0, runId0, {
        title: auditHeadline(0, closed0, scannedN), tone: "ok",
        detail: auditDetail(0, 0, 0, closed0),
        linkText: closed0 ? "See the queue \u2192" : null, onLink: closed0 ? showCleared : null });
      return;
    }

    // Judgement. With no API key the candidates are still worth showing, but
    // they must be labelled as unjudged rather than passed off as findings.
    if (!(await claudeReady())) {
      // Candidates are not findings until something has judged them against
      // the recorded rulings, so they are never filed as queue rows here.
      await recordMeasures(scan.measures);
      say(total + " possible issue" + (total === 1 ? "" : "s") + " found, but nothing judged them \u2014 add an API key in ~/.figma-dashboard-key and restart the service.", "warn");
      return;
    }

    const rules = rules0;
    const { judge: judgeTemplate } = await api.scripts();
    if (!judgeTemplate) { say("The service did not return the skill's judgement instruction.", "warn"); return; }

    // Judge in batches, whole sets at a time. A first audit of a real library
    // raises hundreds of candidates — 243 on one library's 64 sets — and one
    // request for all of them overruns any budget the API will accept. Whole
    // sets, because `i` indexes a candidate WITHIN its set: split a set across
    // two requests and every index in the second half points at the wrong
    // check. It also gives the reader something that moves: one request for
    // 243 candidates is minutes of a line that says nothing.
    //
    // Size aims for FOUR batches rather than the fewest that fit. One batch is
    // a progress bar with a single step, which is a still line: 33 candidates
    // fitted inside one 60-candidate batch and sat unmoving for 35 seconds.
    // The floor stops a small library becoming a burst of tiny requests; the
    // ceiling is the token budget.
    const target = Math.max(8, Math.min(24, Math.ceil(total / 4)));
    const batches = [];
    for (const entry of scan.audited) {
      const last = batches[batches.length - 1];
      const n = entry.candidates.length;
      if (!last || last.n + n > target) batches.push({ items: [entry], n: n });
      else { last.items.push(entry); last.n += n; }
    }

    const judged = [];
    let done = 0, keptSoFar = 0;
    for (const batch of batches) {
      // Name what is in flight, not only a count: on a slow batch it is the
      // one thing that says the run is alive rather than hung.
      const names = batch.items.map((e) => e.set);
      const where = names.length === 1 ? names[0] : names[0] + " \u2026 " + names[names.length - 1];
      say("Judging " + where, null, true);
      runProgress(ctx.libKey, 15 + 40 * (done / total), "Judging");
      const part = await judgeBatch(batch.items, batch.n, rules, judgeTemplate);
      for (const s of (part && part.sets) || []) {
        judged.push(s);
        keptSoFar += (s.findings || []).length;
      }
      done += batch.n;
      // A running total of what SURVIVED: a result taking shape, not a
      // position in the run. The fraction that used to lead this line was
      // progress, and progress belongs to the file row, which carries the
      // percentage and the seconds and also names the file being read.
      say(keptSoFar + (keptSoFar === 1 ? " finding" : " findings") + " so far", null, true);
    }
    say("Filing what survived\u2026", null, true);
    runProgress(ctx.libKey, 55, "Filing");

    const kept = judged.reduce((n, e) => n + ((e.findings || []).length), 0);
    const filedRows = await fileRows(judged, scan);   // files and closes, before measuring, as above
    const reopened = filedRows.reopened, fresh = filedRows.added, closed = filedRows.closed;
    const added = fresh + reopened;
    await recordMeasures(scan.measures);
    await recordScores(scan);
    const runId = await recordRun(scope, total, kept, added, scan.measures, closed);
    await consumeMoved(scope);
    const closedNote = closed ? " Closed " + closed + " no longer raised." : "";
    // Reopened rows are work in the queue too, and are said as such: a row
    // the scan raised again is neither new nor "already there".
    const filed =[fresh ? fresh + " new " + (fresh === 1 ? "row" : "rows") : "", reopened ? reopened + " reopened" : ""].filter(Boolean).join(" and ");
    if (added) sayLinked(filed + " in the queue." + closedNote, "warn", "queue", "queuePane");
    else if (kept) sayLinked(kept + " to fix, all already in the queue." + closedNote, "warn", "queue", "queuePane");
    else sayLinked("Nothing to fix in " + plural(scannedN, "component") + "." + closedNote, "ok", "queue", "queuePane");
    // An audit both files and closes rows, so the queue can change in two
    // directions at once. Say both numbers rather than the net.
    // Held until the other three stages are done — see the note above.
    await runOtherStages(scan, rules0, runId, {
      title: auditHeadline(added, closed, scannedN, reopened, kept), tone: added || kept ? "warn" : "ok",
      detail: auditDetail(total, kept, added, closed),
      linkText: "See the queue \u2192", onLink: showCleared });
  } catch (e) {
    say(trouble(e, "Audit"), "warn");
  // `finally`, not the end of the try: every early return and every failure
  // leaves through here, and a spinner left spinning on a run that stopped is
  // worse than none — it says the page is still working when it is not.
  } finally {
    auditing = false; auditBtn.disabled = false;
    ctx.running = false; sweepBtn.disabled = false;
    for (const b of document.querySelectorAll("[data-lib-choice]")) b.disabled = false;
    endProgress();
  }
}
sweepBtn.addEventListener("click", runSweep);
// After a Check changes that saw sets move, Audit asks: those sets, or the
// whole library. Removed in 2.9.5 and restored on the maintainer's call in
// 2.9.6; each run's cost is on History, which is how to tell whether the
// smaller audit is worth having.
const auditMenu = document.getElementById("auditMenu");
const auditChangedBtn = document.getElementById("auditChangedBtn");
const auditAllBtn = document.getElementById("auditAllBtn");
export function paintAuditMenu() {
  // The leading space keeps the button's name two words apart: "Audit
  // changes 3 sets", not "Audit changes3".
  const n = ctx.lastMoved.length;
  document.getElementById("auditChangedCount").textContent = " " + (n ? plural(n, "set") : "nothing moved");
  auditChangedBtn.disabled = ctx.lastMoved.length === 0;
}
// Escape returns focus to the control that opened it; without that a
// keyboard user is dropped on <body>.
function closeMenu(refocus) {
  auditMenu.hidden = true;
  auditBtn.setAttribute("aria-expanded", "false");
  if (refocus) auditBtn.focus();
}
auditBtn.addEventListener("click", () => {
  // Nothing moved: the button can only mean the whole library, so it acts.
  if (!ctx.lastMoved.length) { runAudit(null); return; }
  paintAuditMenu();
  const open = auditMenu.hidden;
  auditMenu.hidden = !open;
  auditBtn.setAttribute("aria-expanded", String(open));
  if (open) auditMenu.querySelector("button:not([disabled])").focus();
});
auditChangedBtn.addEventListener("click", () => { closeMenu(); runAudit(ctx.lastMoved.slice()); });
auditAllBtn.addEventListener("click", () => { closeMenu(); runAudit(null); });
document.addEventListener("click", (e) => {
  if (!auditMenu.hidden && !auditMenu.contains(e.target) && e.target !== auditBtn) closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !auditMenu.hidden) closeMenu(true);
});
