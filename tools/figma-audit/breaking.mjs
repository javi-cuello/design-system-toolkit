// Breaking changes, from the change log to the audit queue.
//
// The store grades every snapshot it records (store.cjs `grade`): each change
// carries a level for the designers' files that use the library and one for
// the code built from it. A change that is major for either is something
// somebody downstream will have to act on, and the library's own maintainer
// should decide it before they do: intended, and said in the release note
// with what consumers must change, or not intended, and reverted before the
// next publish. This turns those changes into findings for that decision.
//
// Filed by the service, which is the record's one writer (server.mjs, "ONE
// WRITER AT A TIME"), when the change log moves. Not an audit stage: a stage
// reads the live file (toolkit-standard §D 5), and a recorded change is an
// event in the log, not a state of the file. Each change is filed ONCE: its
// key names the entry it came from, and a key already in the record is never
// filed again, so a decided row is never reopened by the next log write.
//
// ONE IDENTITY: the key. The writer used to fall back to the wording when a
// key missed, and a size change is worded the same every day: day 2's resize
// landed on day 1's decided row, reopened it and took its key, and every
// service start after that flipped the row between the two entries. A row
// that carries a key is now found by its key alone (rows.mjs, `find`).
//
// …AND THE KEY IS WHAT THE CHANGE IS ABOUT, NOT ITS WORDING: the rule, the
// entry, the subject, and the one thing the change names (a property, a
// collection), never the list its wording carries. A key that held "— A, B,
// C" was re-keyed by a regrade that shortened the list to "— A", and filed
// again as a new row on every regrade (review of 2 October 2026, round 3,
// S4). Rows filed under the old keys are re-keyed through the writer
// (`rekeys`).
//
// Entries the backfill rebuilt from git are history, and are not filed; so
// are live entries it graded after the fact, which carry the revisions they
// were graded across (`grade.from`): the router never stamps those on a grade
// it makes at the moment of a snapshot. Graded on 1 October, one project's 24
// and 30 September entries were filed as fresh decisions. A router grade the
// backfill regrades (`--regrade`) stays the router's: it carries `regraded`,
// never `from`, and what it raises is still filed.

import store from "../snapshot/store.cjs";

export const OWNER = "figma-snapshot-router";

// Who a change breaks, in the store's words (`gradeOf`), so the queue and the
// docs site's Changes page say it the same way.
const AUDIENCE = (c) => store.gradeOf([c]).audience;

// The rules whose wording lists what they touched, and those whose wording
// leads with the one thing they are about ("Semantic: 3 — a, b, c").
const LISTS = new Set(["layer-removed", "layer-renamed", "layer-added", "nested-repointed"]);
const LEADS = new Set(["token-removed", "token-renamed", "token-added", "token-retyped", "token-value", "style-changed"]);
const aboutOf = (rule, what) => {
  const s = String(what || ""), i = s.indexOf(" \u2014 "), detail = i < 0 ? "" : s.slice(i + 3);
  return LISTS.has(rule) ? "" : LEADS.has(rule) ? detail.split(":")[0] : detail;
};
/** A change's row key: the entry, the rule, the subject and what it is about. */
export const keyOf = (at, c) => ["breaking-change", c.rule, at, c.subject, aboutOf(c.rule, c.what)].join("|");
// A key from before (`breaking|rule|at|subject|what`), as it is keyed now.
const rekeyOf = (k) => {
  const [head, rule, at, subject, ...what] = String(k).split("|");
  return head === "breaking" && subject !== undefined ? keyOf(at, { rule, subject, what: what.join("|") }) : null;
};

/** A breaking row's question: the change and its consequence, then who it breaks and when. */
export const breakingFix = (what, audience, day) =>
  [String(what).replace(/^\w/, (x) => x.toUpperCase()).replace(/\.?$/, "."), "Breaking for " + audience + ", in the snapshot of " + day + "."];

/**
 * entries  the change log (changes.json), oldest first
 * libOf    entry.file → the audit record's library key, or null when the
 *          file has no record (an icon library, a variables source)
 * nameOf   a component folder → its name as a designer reads it
 * filed    the keys this owner has already filed, in any record
 * Returns  Map(libKey → findings[])
 */
export function breakingFindings(entries, { libOf, nameOf = (f) => f, filed = new Set() }) {
  const out = new Map();
  for (const e of entries || []) {
    if (!e || e.via === "backfill" || !e.grade || e.grade.from || !Array.isArray(e.grade.changes)) continue;
    const lib = libOf(e.file);
    if (!lib) continue;
    for (const c of e.grade.changes) {
      if (c.figma !== "major" && c.code !== "major") continue;
      const key = keyOf(e.at, c);
      if (filed.has(key)) continue;
      filed.add(key);
      const where = c.subject === "tokens" ? "Tokens" : nameOf(c.subject);
      const day = String(e.at).slice(0, 10);
      (out.get(lib) || out.set(lib, []).get(lib)).push({
        where, key, rule: "breaking-change", bucket: 3,
        // Losing someone's work in their own file is the louder of the two:
        // nothing in Figma says it happened. A code break fails a build or a
        // publish, or shows on the page.
        sev: c.figma === "major" ? "error" : "warn",
        check: "Breaking for " + AUDIENCE(c) + ": " + c.what,
        // The question says what changed and what it does to the people who
        // use it; "component-removed: breaking" named the rule and nothing else.
        fix: breakingFix(c.what, AUDIENCE(c), day),
        rec: ["Intended: say it in the release note, with what consumers must change.",
              "Not intended: revert it in Figma before the next publish."],
      });
    }
  }
  return out;
}

/**
 * The record a file's majors are filed into, or null: the routed library the
 * entry names, by key or document id (snapshot-standard 19), when the project
 * keeps a record for it. A variables source or an icon library has none.
 *   routes   the routing block's library entries ({ key, id })
 *   records  the project's audit records ({ key })
 */
export const libOfFor = (routes, records) => (f) => {
  const r = (routes || []).find((e) => e.key === f || e.id === f);
  const key = (r && r.key) || f;
  return (records || []).some((x) => x.key === key) ? key : null;
};

/*
 * What every stored grade raises, live or not: key → the entry that raises it.
 * An entry graded after the fact (`grade.from`) or rebuilt from git is
 * history and files nothing, but it still says the change happened, and a
 * row closed as "no longer raised" while it does was false for three of six
 * closed router rows (review of 2 October 2026, round 3, S4).
 */
function raisedBy(entries, libOf) {
  const out = new Map();
  for (const e of entries || []) {
    if (!e || !e.grade || !Array.isArray(e.grade.changes)) continue;
    const lib = libOf(e.file);
    if (!lib) continue;
    const m = out.get(lib) || out.set(lib, new Map()).get(lib);
    for (const c of e.grade.changes) if (c.figma === "major" || c.code === "major") { const k = keyOf(e.at, c); if (!m.has(k) || !m.get(k).live) m.set(k, { live: e.via !== "backfill" && !e.grade.from, e }); }
  }
  return out;
}

// How the router words a closure. Said through the writer, never by hand.
const NO_LONGER = "the change log's stored grade no longer raises this";
const AFTER = "graded after the fact";
// A closure that says the change is gone: the router's own wording, and the
// writer's "Cleared by", which the router's first closures were sent through.
const claimsGone = (note) => note.includes(NO_LONGER) || note.startsWith("Cleared by " + OWNER);
const afterWhy = (e) => `${AFTER} (backfill-changes.cjs, across ${e.grade.from}..${e.grade.to}), so it is history and not filed; the stored grade still raises it.`;

/**
 * Do the filed rows match the stored grades — all of them? Four ways to
 * disagree, each a line: an open row no live grade raises; a row closed as
 * no longer raised while a stored grade, live or after the fact, still
 * raises it; a row closed while only an after-the-fact grade raises it, not
 * worded so; a change a live grade raises that no row was filed for.
 *   records  Map(libKey → record)
 */
export function unmatched(entries, records, { libOf }) {
  const raised = raisedBy(entries, libOf);
  const out = [];
  for (const [lib, record] of records) {
    const all = raised.get(lib) || new Map();
    const rows = Object.entries((record && record.rows) || {}).filter(([, r]) => r && r.owner === OWNER);
    for (const [id, r] of rows) {
      const by = all.get(rekeyOf(r.key) || r.key), note = String(r.verifyNote || "");
      if (!r.done && !(by && by.live)) out.push(`${lib} ${id}: open, and no live grade raises it`);
      if (r.done && by && claimsGone(note)) out.push(`${lib} ${id}: closed as no longer raised, and a stored grade still raises it`);
      if (r.done && by && !by.live && !note.includes(AFTER)) out.push(`${lib} ${id}: closed, raised only by a grade made after the fact, and not worded so`);
    }
    const have = new Set(rows.map(([, r]) => rekeyOf(r.key) || r.key));
    for (const [k, by] of all) if (by.live && !have.has(k)) out.push(`${lib}: not filed — ${k}`);
  }
  return out;
}

/**
 * What the router sends the record's writer before it files: the rows filed
 * under an old key, re-keyed (`rekey`), and the rows it closes, each saying
 * why (`close`) — an open row no stored grade raises any more, an open row
 * raised only by a grade made after the fact, and a closed one worded as no
 * longer raised while such a grade still raises it. Rows a person decided
 * are left as they are: a maintainer's ruling is not the router's to reword.
 *   record  one audit record; lib its key
 * Returns { rekey: [[from, to]], close: [{ key, why }] }
 */
export function upkeep(entries, record, { libOf, lib }) {
  const all = raisedBy(entries, libOf).get(lib) || new Map();
  const rekey = [], close = [];
  for (const r of Object.values((record && record.rows) || {})) {
    if (!r || r.owner !== OWNER || typeof r.key !== "string") continue;
    const to = rekeyOf(r.key), key = to || r.key;
    if (to && to !== r.key) rekey.push([r.key, to]);
    const by = all.get(key), note = String(r.verifyNote || "");
    const ours = !r.done || /^(Cleared|Closed) by figma-snapshot-router/.test(note);
    if (!ours || (by && by.live)) continue;
    const why = by ? afterWhy(by.e) : NO_LONGER + ".";
    const said = by ? note.includes(AFTER) && !claimsGone(note) : claimsGone(note);
    if (!r.done || !said) close.push({ key, why });
  }
  return { rekey, close };
}

/**
 * The keys an owner has filed in one record, open or closed, less the rows
 * the router itself closed as no longer raised: that closure is a claim the
 * log can disprove, and where a live grade raises the change again, filing
 * it again is what reopens the row. Nothing else reopened one, so four rows
 * closed seconds after they were filed, on 25 October 2026, stayed closed
 * while the grade that raised them stood. A person's decision still stands.
 */
export const filedKeys = (record) => new Set(Object.values((record && record.rows) || {})
  .filter((r) => r && r.owner === OWNER && typeof r.key === "string")
  .filter((r) => !(r.done && claimsGone(String(r.verifyNote || ""))))
  .map((r) => r.key));
