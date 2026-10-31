#!/usr/bin/env node
// Filing rows into a project's audit record — the one implementation.
//
// Every writer goes through applyRows(): the dashboard page (via POST /rows on
// server.mjs) and every skill that owns rows (via the same route, or this file's
// CLI when no service is running). Before this, the page held the row key and
// the owner rule as code, and three skills held them as prose in the README —
// which is a procedure every session would have re-derived by hand, with a
// different slug each time.
//
//   node rows.mjs --data <project>/audit/<fileKey>.json [--payload <file>]
//                                                          (payload from stdin otherwise)
//
// Payload: { owner, fileKey?, target?, full?, scope?, exhaustive?, ran?, origin?,
//            language?, findings: [...], dismissed?: [...], dryRun? }
//   owner    the skill filing, e.g. "figma-foundations-audit"; required
//   target   component-validator's code target; a row belongs to owner AND target,
//            so a web run never closes an iOS row on the same component
//   full     true when the run read every set in `scope`, which is what permits
//            closing rows it did not raise. A full run MUST carry `scope`.
//   scope    the set names the run read; closing stays inside it
//   exhaustive the run walked the whole file, so `scope` is every component that
//            exists and a row naming anything else is about one renamed or removed
//   ran      the checks the run exercised; a rule it did not run may not close
//            rows. REQUIRED from an owner whose scanner reports it (REPORTS_RAN).
//   findings [{ where, check, key?, rule?, sev?, bucket?, node?, visible?, lands?, fix?[], rec?[] }]
//            `check` is the scanner's own wording; `fix`/`rec` short claims;
//            `key` is what the finding is ABOUT — rule, subject, layer path,
//            as the scanner names it — and never its wording. A row is found
//            by key first, then by wording, so a reworded check or a moved
//            measurement lands on the row it already has; a row that carries
//            a key is never matched by wording to a finding with another key.
//   why      a full run's reason, said on every row it closes: what changed in
//            the check, when that and not the file is why a row went
//   dismissed [{ where, check, why? }] candidates the check raised and a judgement
//            pass dropped; their rows close saying so and carrying the judge's
//            reason, because "no longer raised" would be untrue of them
//   language the project's dialect, for the check's own words
//   dryRun   true reports what the payload would do and changes nothing
//   rekey    [[from, to]] this owner's row keyed `from` takes the key `to`,
//            and nothing else about it changes: how a key's form is changed
//            without filing every row again as new
//   close    [{ key, why }] this owner's row with that key is closed, saying
//            `why`. Only an owner with no full run of a file (READS) sends
//            it: the router's rows come from the change log, and a row whose
//            change it no longer raises, or raises only from a grade made
//            after the fact, is closed by the router saying which
//
// Any other field is refused: a caller that sends `scopes` or `exhaustively`
// has not stated what it thinks it has, and a silent drop is how three stages
// filed `full: true` with no scope for a fortnight.
//
// Result: { ok, added, updated, reopened, closed, ids, rekeyed?, refused? }
//   refused  the clause of the closing contract the payload did not meet; the
//            findings were still filed, and nothing was closed.

import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, renameSync, copyFileSync, existsSync, mkdirSync, realpathSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/*
 * A finding's wording is the TOOLKIT's, so it follows the project's dialect.
 *
 * The checks are written in this repo's English, and a project that records
 * `language: en-US` was reading "a raw colour stays the same in dark mode"
 * and "a centre stroke straddles the edge" on its own board. Generated text
 * must not revert a project to the dialect it has left [maintainer,
 * 2026-09-22].
 *
 * Here rather than in each engine, because every owner's findings pass
 * through this one writer — the components scanner, the file checks, the
 * validator and the link check — and fixing it in four engines is four
 * places to forget. It is applied on the way IN, so the stored row carries
 * the right spelling and every reader of the record gets it, the docs site
 * included.
 *
 * ONLY the check's own words: `check`, `fix` and `rec`. Never `where`, which
 * is the component's name, and never `rule` or `node`, which are ids. The
 * project's own words are the project's to spell.
 */
const require_ = createRequire(import.meta.url);
const dialect = require_("../shared/dialect.cjs");

// What an owner that has no full run of a file reads instead, said when it
// closes a row. The router's rows come from the change log's stored grades,
// and "a full run no longer raises this" claimed a run it does not have
// (review of 2 October 2026, round 2).
const READS = { "figma-snapshot-router": "the change log's stored grade" };

// Rows from before owners existed were all raised by the components audit.
export const LEGACY_OWNER = "figma-components-audit";

// Is this row still in the queue? The one definition the page uses too.
export { isOpen } from "./audit-row.mjs";
import { isOpen } from "./audit-row.mjs";
import { componentOf } from "./audit-row.mjs";

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
export const norm = (s) => String(s == null ? "" : s).replace(/\s+/g, " ").trim();
// Stored `fix`/`rec` render as markup on purpose (authored rows carry <b> and
// <code>), so anything a scanner or a model wrote is escaped before it lands.
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unesc = (s) => String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const hash8 = (s) => createHash("sha1").update(s).digest("hex").slice(0, 8);

/*
 * The key: the component and 32 characters of the check's wording. 32 is not
 * enough on its own — two page-order findings share "in INPUTS, Combobox
 * should come b…" — so a taken key gets a hash, and a re-run finds the row by
 * matching before minting, never by recomputing the key.
 *
 * TWO THINGS THE FIRST VERSION GOT WRONG, and both destroyed a row silently.
 *
 * The hash was of the wording alone, so it was IDENTICAL for two rows that
 * differ only in who owns them. A row belongs to an owner AND a target — that
 * is the whole point of `target`, so a web run never closes an iOS row — and
 * the same finding on the same component at three targets minted `base` for
 * web, `base-<h>` for iOS, and `base-<h>` again for Android, which overwrote
 * iOS. The record came back with two rows where three had been filed and
 * `added: 1` for each, so nothing anywhere said a row had been lost.
 *
 * And there was only ONE fallback. Whatever goes into the hash, a second
 * collision has nowhere to go and lands on top of the row that was there.
 * So: keep minting until the key is free. The loop is bounded by the number
 * of rows, since every id it tries is distinct.
 */
export function rowId(where, check, taken, distinct = "") {
  const base = "a-" + slug(where) + "-" + slug(check).slice(0, 32);
  if (!taken(base)) return base;
  const h = hash8(norm(where) + "\n" + norm(check) + "\n" + norm(distinct));
  if (!taken(base + "-" + h)) return base + "-" + h;
  for (let n = 2; ; n++) if (!taken(base + "-" + h + "-" + n)) return base + "-" + h + "-" + n;
}

const bucketOf = (b) => {
  const n = typeof b === "number" ? b : Number(String(b || "").replace(/^b/, ""));
  return n >= 1 && n <= 3 ? "b" + n : "b3";
};
// a naming preference (standards/naming-preferences.json) is its own tier: a name that departs from one works
const sevOf = (s) => (s === "error" ? "error" : s === "preference" ? "pref" : "warn");
const list = (v, fallback) => {
  const a = Array.isArray(v) ? v : v ? [v] : [];
  const out = a.map((x) => esc(norm(x))).filter(Boolean);
  return out.length ? out : fallback;
};

/*
 * THE CLOSING CONTRACT, held here and nowhere else. Every clause below was a
 * defect first: a payload field the writer did not read (a caller wrote
 * `scope` from `e.set` and sent 120 blanks; another spelled a flag wrong and
 * the writer took the default); `full: true` with no scope, which closed
 * every open row of the owner on no evidence, three stages over; a scanner
 * that reports which checks ran, filed by a caller that dropped the list, so
 * a check whose setting was missing closed its own rows.
 *
 * A violated clause is REFUSED, not corrected: the findings are still filed,
 * nothing is closed, and the result names the clause. An unknown field is an
 * error, because there is no honest reading of it.
 */
export const PAYLOAD_FIELDS = new Set(["owner", "fileKey", "target", "full", "scope", "exhaustive", "ran",
                                       "origin", "language", "findings", "dismissed", "why", "dryRun", "rekey", "close"]);
// Owners whose scanner reports the checks it ran. A full run from one of them
// that says nothing about that is not a run the writer can act on.
export const REPORTS_RAN = new Set(["figma-foundations-audit", "figma-components-audit"]);

export function applyRows(record, payload, now = new Date().toISOString()) {
  // A dry run works on a copy and hands the same result back, so a probe of a
  // live service can never write; written after one did.
  if (payload && payload.dryRun) return Object.assign(applyRows(JSON.parse(JSON.stringify(record)), Object.assign({}, payload, { dryRun: false }), now), { dryRun: true });
  const owner = norm(payload && payload.owner);
  if (!owner) throw new Error("owner required");
  const unknown = Object.keys(payload).filter((k) => !PAYLOAD_FIELDS.has(k));
  if (unknown.length) throw new Error("unknown payload field" + (unknown.length === 1 ? "" : "s") + ": " + unknown.join(", ") +
                                      " \u2014 the writer takes " + [...PAYLOAD_FIELDS].join(", "));
  const findings = (payload && payload.findings) || [];
  if (!Array.isArray(findings)) throw new Error("findings must be an array");
  const target = norm(payload.target) || null;
  // The project's dialect, as the caller read it from the context document.
  const lang = payload.language;
  const ours = (t) => dialect.say(t, lang);
  const rows = (record.rows = record.rows || {});
  const day = now.slice(0, 10);

  const ownerOf = (r) => r.owner || LEGACY_OWNER;
  const mine = (r) => r && ownerOf(r) === owner && (norm(r.target) || null) === target;
  // A row's wording is its `check`; rows from before `check` existed carry the
  // finding only in `fix`, so those match on containment either way.
  const wordingMatches = (r, check) => {
    if (r.check) return norm(r.check) === check;
    return (r.fix || []).some((f) => { const w = norm(unesc(f)); return w && (w === check || w.includes(check) || check.includes(w)); });
  };
  /*
   * The same finding, with a different measurement in it.
   *
   * A row is matched on its wording, and some checks put a measured value in
   * theirs: `Tooltip: raw gap=-1`, `Grid: raw gap=40`, `Indicator frame
   * present in 11 of 20 variants`. When the gap moved from -1 to -2 the
   * wording no longer matched, so the run filed a NEW row and closed the old
   * one as "a full run no longer raises this" — while the gap was still
   * unbound, and the maintainer's note was on the row that had just closed.
   *
   * So a second pass, after the exact one: the same component, the same rule,
   * and the same wording once measurements are masked. It is a fallback, not
   * the key — the exact match still wins, and a row is only ever minted when
   * neither finds anything.
   *
   * MASKING IS DELIBERATELY NARROW. Only shapes that read as a measurement:
   * a value after `=` or `:`, a number with a unit, "N of N", and a number
   * following a measuring word. A bare number is left alone, because token
   * paths are full of them — `Colour/Palette/Blue/4` and `Spacing/18` must
   * not collapse into their neighbours. Checked against every stored row
   * across the four projects: the mask touches 111 of 783 wordings and merges
   * nothing that was not already one finding (0 collisions).
   */
  const MEASURE = [
    /([=:]\s*)-?\d+(\.\d+)?/g,
    /-?\d+(\.\d+)?(px|%|em|rem|pt|dp|sp)\b/gi,
    /\b\d+ of \d+\b/g,
    /\b(gap|padding|inset|width|height|size|radius|weight|spacing|opacity|blur|spread|offset)\s+-?\d+(\.\d+)?/gi,
  ];
  const masked = (s) => {
    let out = String(s == null ? "" : s);
    for (const re of MEASURE) out = out.replace(re, (m) => m.replace(/-?\d+(\.\d+)?/g, "#"));
    return out;
  };
  // Declared before `find`, which reads it: the fallback must not match a row
  // this same run has already filed.
  const raised = new Set();
  const find = (where, check, rule, key) => {
    /*
     * BY KEY FIRST. Prose is not an identity: three fallbacks below exist
     * because it is not, and a check reworded in the engine still re-minted
     * its rows unless the new sentence happened to be a prefix of the old.
     * The scanners now say what a finding is about, and a row that has been
     * matched once carries it. A row without one (filed before keys existed)
     * is still found by its wording, and takes the key then.
     */
    if (key) {
      const byKey = Object.entries(rows).find(([, r]) => mine(r) && norm(r.where) === where && r.key === key);
      if (byKey) return byKey;
    }
    /*
     * …AND A ROW THAT HAS A KEY IS FOUND BY IT ALONE. Two keys that differ
     * are two findings, by what a key is; matching them by wording made the
     * key one identity and the wording a second. A size change is worded the
     * same on every day it happens, so day 2's breaking change landed on day
     * 1's decided row, reopened it and took its key, and each later run
     * flipped the row back (review of 2026-10-02). The wording fallbacks
     * below are for rows filed before keys existed, and for a finding with
     * no key.
     */
    const wordable = (r) => !(key && r.key);
    const exact = Object.entries(rows).find(([, r]) => mine(r) && wordable(r) && norm(r.where) === where && wordingMatches(r, check));
    if (exact) return exact;
    // Only where BOTH carry a rule: without one there is nothing to hold the
    // match steady, and a masked wording alone is too loose to mint against.
    const m = masked(check);
    if (!rule) return undefined;
    if (m !== check) {
      const byMask = Object.entries(rows).find(([, r]) =>
        mine(r) && wordable(r) && norm(r.where) === where && r.rule === rule && r.check && masked(norm(r.check)) === m);
      if (byMask) return byMask;
    }
    /*
     * The same finding, reworded by the check that raises it.
     *
     * A row is keyed on its wording, so a skill that edits its own sentence
     * re-keys every row of that rule: the run mints them all as new AND
     * closes the originals with "a full run no longer raises this", which is
     * false — the run raised them, in different words. Seen live: one
     * library carried two rows for `Sidebar (Secondary) - Item`, the closed
     * one ending "; figma-standard rule 9 would call it …" and the open one stopping at
     * "does not carry its name", because the advice moved from `check` into
     * `rec` one version earlier. The maintainer fixed the component and
     * neither row moved.
     *
     * So: same owner, same target, same component, same rule, and one
     * wording is a prefix of the other. Prefix rather than containment —
     * a clause added or dropped at the end is what a rewrite does, and
     * containment would also match a sentence quoted inside a longer one.
     * AMBIGUITY MINTS: two candidates mean the rule raises several findings
     * for this component and nothing here can say which is which, and
     * attaching a maintainer's tick to the wrong one is worse than a
     * duplicate row.
     */
    const near = Object.entries(rows).filter(([k, r]) =>
      // Never a row THIS run already raised: two findings of one rule on one
      // component arrive in the same batch, and the shorter is a prefix of
      // the longer, so the second would land on the first's row and the run
      // would report one finding where the scan found two.
      !raised.has(k) &&
      mine(r) && wordable(r) && norm(r.where) === where && r.rule === rule && r.check &&
      (() => { const w = norm(r.check); return w !== check && (w.startsWith(check) || check.startsWith(w)); })());
    return near.length === 1 ? near[0] : undefined;
  };

  let added = 0, updated = 0, reopened = 0, closed = 0, rekeyed = 0;
  const ids = [];
  const byKey = (k) => Object.entries(rows).find(([, r]) => mine(r) && r.key === k);

  for (const [from, to] of Array.isArray(payload.rekey) ? payload.rekey : []) {
    const hit = byKey(from);
    if (!hit || !to || from === to || byKey(to)) continue;
    rows[hit[0]] = Object.assign({}, hit[1], { key: to });
    rekeyed++;
  }
  if (Array.isArray(payload.close) && payload.close.length && !READS[owner]) throw new Error("`close` is for an owner with no full run of a file (" + Object.keys(READS).join(", ") + "); " + owner + " closes by a full run");
  for (const c of Array.isArray(payload.close) ? payload.close : []) {
    const hit = byKey(c && c.key), why = norm(c && c.why);
    if (!hit || !why) continue;
    const note = "Closed by " + owner + " on " + day + " \u2014 " + esc(why);
    if (hit[1].done && hit[1].verifyNote === note) continue;
    rows[hit[0]] = Object.assign({}, hit[1], { done: true, verified: true, verifiedAt: now, verifyNote: note });
    closed++;
  }

  for (const f of findings) {
    const where = norm(f && f.where);
    const check = ours(norm(f && (f.check || f.text)));
    if (!where || !check) throw new Error("every finding needs `where` and `check`");
    const fix = list(f.fix, [esc(check)]).map(ours);
    const rec = list(f.rec, ["Decide how to handle it."]).map(ours);
    const key = norm(f && f.key) || null;
    const hit = find(where, check, f.rule || null, key);
    if (hit) {
      const [id, r] = hit;
      raised.add(id); ids.push(id);
      const next = Object.assign({}, r, { updatedAt: now });
      if (f.node) next.node = f.node;
      if (key) next.key = key;
      /*
       * A row the run raises AGAIN takes this run's ACCOUNT of it — its
       * wording, not only its identity. Only a REOPENED row used to take new
       * `check`, `fix` and `rec`; an already-open one kept whatever it was
       * created with, for ever.
       *
       * That made every improvement to a check's wording unreachable. A
       * maintainer asked four times why rows still read the old way after
       * the rule had been rewritten, and the answer each time was that the
       * rule HAD been rewritten — and the board was showing text written
       * weeks earlier, because the row already existed.
       *
       * The maintainer's own work is untouched: `done`, `note`, the verify
       * stamps and the ruling trail all come from `r` and are not in this
       * list. What the CHECK says about the finding is the check's to
       * restate; what the PERSON said about it is theirs to keep.
       */
      if (f.lands) next.lands = f.lands;
      // Set from THIS run, not OR'd with the last. A sticky flag outlives the
      // shape it describes: a row keeps `contrast` from a run that stated both
      // sides, a later run states one, and the page splits a plain sentence on
      // its em-dash into two columns that overlap on screen.
      if (f.contrast) next.contrast = true; else delete next.contrast;
      next.check = check;
      if (fix.length) next.fix = fix;
      if (rec.length) next.rec = rec;
      /*
       * …and the rest of what the CHECK says about the finding.
       *
       * The paragraph above restates the wording on every raise and stops at
       * that. `bucket`, `sev`, `visible` and `rule` were left as the row was
       * born with, so moving a rule between buckets in `buckets.json`, or
       * raising a check's severity, changed only rows nobody had seen yet: a
       * board would show one finding as a b1 "Approve & I fix" and its twin
       * on another component as a b3 question, for ever, with no way to tell
       * from the board which was which.
       *
       * Same division as before. What the check says is the check's to
       * restate; what the PERSON said — `done`, `note`, the verify stamps and
       * the ruling trail — comes from `r` and is not in this list.
       */
      next.bucket = bucketOf(f.bucket);
      next.sev = sevOf(f.sev);
      next.visible = !!f.visible;
      if (f.rule) next.rule = f.rule;
      if (r.done && r.ruledAt) {
        /*
         * A row closed by a RULING is not reopened by the check raising it
         * again. That is what a ruling IS: the maintainer saying this is not
         * a defect here, on a check that was always going to go on raising
         * it. The judgement pass is meant to suppress it upstream, but not
         * every owner has one — `figma-variable-audit` files its candidates
         * with no judgement at all — so its ruled rows came back on every
         * single run, with the ruling demoted to "before that:" in a note
         * headed "Raised again by…". The maintainer's decision read as the
         * thing that had been overtaken.
         *
         * The row keeps its state and records the truth instead, the way a
         * dismissed candidate does: the check still raises this, and the
         * ruling still stands. Untick it to put it back in the queue.
         */
        const said = "Still raised by " + owner + " on " + day + ", and still closed by your ruling.";
        rows[id] = Object.assign({}, r, { updatedAt: now, check, ...(key ? { key } : {}),
          verifyNote: /^Still raised by/.test(r.verifyNote || "") ? said : said + (r.verifyNote ? " " + r.verifyNote : "") });
        // unchanged (the same day's re-raise, a restart): it keeps its time, as an open row does
        if (JSON.stringify({ ...rows[id], updatedAt: r.updatedAt }) === JSON.stringify(r)) rows[id].updatedAt = r.updatedAt;
        updated++;
        continue;
      }
      if (r.done) {
        // A closed row the run raises again is a regression, not "already in
        // the queue". Reopen it with a trail rather than filing a second copy.
        Object.assign(next, {
          done: false, verified: false, verifiedAt: undefined, check, fix, rec,
          rule: f.rule || r.rule || null, reopenedAt: now, dismissedRuns: undefined,
          verifyNote: "Raised again by " + owner + " on " + day + (r.verifyNote ? " — before that: " + r.verifyNote : "")
        });
        reopened++;
      } else {
        updated++;
        // An open row dismissed once and now kept: the note said "Dismissed
        // once … stays open until a second run agrees" after the judge had
        // stopped agreeing, and read on the dashboard as a pending close.
        if (/^Dismissed once/.test(r.verifyNote || ""))
          next.verifyNote = "Kept by the judgement pass on " + day + " after one dismissal, so it stays open.";
      }
      delete next.dismissedRuns;   // raised again: the judge's last dismissal no longer counts towards closing
      // raised again exactly as it stands: it keeps its time, so a service restart that re-files every
      // row leaves the record as it was instead of moving every row's updatedAt
      if (JSON.stringify({ ...next, updatedAt: r.updatedAt }) === JSON.stringify(r)) next.updatedAt = r.updatedAt;
      rows[id] = next;
      continue;
    }
    // What makes this row a different row from one that already holds the
    // base key: who raised it and for which target.
    const id = rowId(where, check, (k) => k in rows, owner + "\n" + (target || ""));
    raised.add(id); ids.push(id);
    const doc = {
      rule: f.rule || null, check, ...(key ? { key } : {}), bucket: bucketOf(f.bucket), sev: sevOf(f.sev),
      where, node: f.node || null, visible: !!f.visible, fix, rec,
      origin: norm(payload.origin) || owner, owner, done: false, note: "", updatedAt: now
    };
    if (target) doc.target = target;
    // Where the fix lands — the designer's file, the developer's code, both,
    // or accept — as the check that raised it computed it. Only the validator
    // sets one today; a row without one is simply not sorted that way.
    if (f.lands) doc.lands = f.lands;
    // The check's own claim that it stated both sides, so the page renders a
    // comparison rather than guessing one from the wording.
    if (f.contrast) doc.contrast = true;
    rows[id] = doc;
    added++;
  }

  // A candidate the judge dismissed was still raised by the check, so its row
  // closes with that reason, whatever the run's scope.
  for (const d of (Array.isArray(payload.dismissed) ? payload.dismissed : [])) {
    const where = norm(d && d.where), check = norm(d && (d.check || d.text));
    if (!where || !check) continue;
    const hit = find(where, check, d.rule || null, norm(d.key) || null);
    if (!hit || raised.has(hit[0])) continue;
    const note = "Dismissed by the judgement pass on " + day + (norm(d.why) ? ": " + esc(norm(d.why)) : " against the recorded rulings and conventions, with no reason given") + ". The check still raises it.";
    raised.add(hit[0]);
    if (hit[1].done) {
      // Already closed: the row keeps its state, but a note that claimed the
      // check stopped raising it is replaced by what actually happened.
      // The judge re-verified it, so the stamp moves too: a done row whose
      // updatedAt passes its verifiedAt reads to the page as re-ticked by the
      // maintainer, and the Verify button came on for a row nobody touched.
      const fresh = /^Dismissed by the judgement pass/.test(hit[1].verifyNote || "") ? {} : { verifyNote: note };
      rows[hit[0]] = Object.assign({}, hit[1], fresh, { verifiedAt: now, updatedAt: now }); updated++;
      continue;
    }
    /*
     * Two runs must agree before a dismissal closes a row. On an unchanged
     * file the judge closed six rows one run and reopened the same six the
     * next, three runs running: its call on a borderline candidate is not
     * repeatable, and a queue that flips on every audit cannot be worked.
     * The first dismissal is recorded on the open row; the next run's
     * dismissal closes it; a raise in between starts the count again.
     */
    const agreed = (hit[1].dismissedRuns || 0) >= 1;
    if (!agreed) {
      rows[hit[0]] = Object.assign({}, hit[1], { dismissedRuns: 1, verifiedAt: now, updatedAt: now,
        verifyNote: "Dismissed once by the judgement pass on " + day + (norm(d.why) ? ": " + esc(norm(d.why)) : "") + ". It stays open until a second run agrees." });
      updated++;
      continue;
    }
    rows[hit[0]] = Object.assign({}, hit[1], { done: true, verified: true, verifiedAt: now, dismissedRuns: (hit[1].dismissedRuns || 0) + 1, verifyNote: note });
    closed++;
  }

  /*
   * Closing is a claim about the file, so only a full run may make it, and
   * only about its own rows, inside what it read.
   *
   * AND A RUN THAT READ NOTHING HAS NOT READ EVERYTHING. `full` with no
   * findings and no scope was an unbounded claim on no evidence: it closed
   * every open row of that owner and stamped each one "a full run no longer
   * raises this". A plugin that answered `{audited: []}` — a TOKENS mismatch,
   * a page rule that matched nothing — therefore wiped the whole foundations
   * or variable queue and reported it as a clean run.
   *
   * A genuinely clean library is the same shape from here, which is why the
   * caller states its scope: the sets it actually read. Then "I read these 85
   * and none raised anything" closes, and "I read nothing" closes nothing,
   * and this guard is what makes the difference legible instead of a silent
   * `undefined`. It is the repo's own rule — a probe that returns nothing is
   * a finding about the probe, never a clean result.
   */
  let refused = null;
  /*
   * A scope of blanks is a scope that names nothing.
   *
   * One caller built its scope from the wrong field — `e.set` where the
   * enumerate mode returns `e.name` — so it passed 120 `undefined`s. The
   * array was non-empty, so the guard below let it through; every entry
   * normalised to "", no row's `where` could match, and that stage never
   * closed a row in its life while reporting a clean full run each time.
   * An array of blanks is the same claim as no array at all.
   */
  if (Array.isArray(payload.scope) && payload.scope.length && !payload.scope.some((x) => norm(x)))
    payload = Object.assign({}, payload, { scope: undefined });
  if (payload.full && !Array.isArray(payload.scope)) {
    refused = "a full run must say what it read (`scope`) before it may close anything";
    payload = Object.assign({}, payload, { full: false });
  }
  // The same claim about checks. `scope` bounds the close by component and
  // says nothing about which rules were exercised; an owner whose scanner
  // reports that list has no excuse for a payload without it.
  if (payload.full && REPORTS_RAN.has(owner) && !Array.isArray(payload.ran)) {
    refused = "a full run by " + owner + " must say which checks ran (`ran`) before it may close anything";
    payload = Object.assign({}, payload, { full: false });
  }
  if (payload.full) {
    const scope = Array.isArray(payload.scope) ? new Set(payload.scope.map(norm)) : null;
    /*
     * A row's `where` names a component, sometimes with a location after it:
     * "Button — properties panel", "Drawer › Header › Title". The scope is
     * component names, so comparing the whole string missed every row a
     * session had written with a location, and those rows could never be
     * closed by any run.
     *
     * That is how one board kept an MU2 row filed on 20 September through
     * every later audit: the run raised the same finding, filed it as a new
     * row, and left the old one open because "Button — properties panel" is
     * not a component name. The maintainer asked four times why it never
     * changed. So the head of it is compared: `componentOf`, shared with the
     * dashboard from tools/figma-audit/audit-row.mjs.
     */
    /*
     * `exhaustive` is the CALLER's claim that its scope is everything that
     * exists — every component in the file, not a selection of it. Only a
     * scanner that walks the whole file may say it, and when it does, a row
     * naming something outside that scope is a row about a component that is
     * gone: renamed, or deleted.
     *
     * Without this a rename orphaned its rows for ever. The scope is built
     * from the names that exist NOW, so an old name is never in it and the
     * row can never be closed by any run. Seen live: four Table parts renamed
     * in Figma from `Table - Header / Fill` to `Table - Column - Header /
     * Fill`, a full audit run straight afterwards, and all four findings
     * still in the queue under their old names — the new names raising
     * nothing, so the queue said the work had not been done.
     */
    // An empty Set is truthy, and an exhaustive claim over nothing closes
    // every row of the owner as renamed or removed. It must name what exists.
    const exhaustive = !!payload.exhaustive && !!scope && scope.size > 0;
    /*
     * A CHECK THAT DID NOT RUN MAY NOT CLOSE ITS OWN ROWS.
     *
     * `scope` bounds the close by COMPONENT; it says nothing about which
     * checks were exercised. A scanner reports the rules it ran (`ran`) and
     * the ones whose setting was missing (`notRun`) — and without that here,
     * a run in which the separator check never executed still closed every
     * separator row inside its scope, stamped "a full run no longer raises
     * this". The sentence is false and the row is marked verified.
     *
     * `ran` is optional: a caller that does not say keeps the old behaviour,
     * because a caller that cannot report its rules is not thereby claiming
     * they all ran.
     */
    const ranRules = Array.isArray(payload.ran) ? new Set(payload.ran.map(norm)) : null;
    for (const [id, r] of Object.entries(rows)) {
      if (!mine(r) || r.done || raised.has(id)) continue;
      const known = !scope || scope.has(norm(r.where)) || scope.has(componentOf(r.where));
      if (!known && !exhaustive) continue;
      if (ranRules && r.rule && !ranRules.has(norm(r.rule))) continue;
      const why = norm(payload.why) ? " " + esc(norm(payload.why)) : "";
      rows[id] = Object.assign({}, r, {
        done: true, verified: true, verifiedAt: now,
        verifyNote: (known
          ? "Cleared by " + owner + " on " + day + " — " + (READS[owner] || "a full run") + " no longer raises this."
          : "Cleared by " + owner + " on " + day + " — a full run found nothing in this file called \"" +
            esc(componentOf(r.where)) + "\", so it has been renamed or removed.") + why
      });
      closed++;
    }
  }

  // The open count on the library tile counts the queue, so it moves with it.
  const lib = payload.fileKey && record.libraries && record.libraries[payload.fileKey];
  if (lib) {
    const all = Object.values(rows);
    lib.metrics = Object.assign({}, lib.metrics, {
      totalFindings: all.length, openFindings: all.filter(isOpen).length
    });
  }

  return Object.assign({ ok: true, added, updated, reopened, closed, ids }, rekeyed ? { rekeyed } : {}, refused ? { refused } : {});
}

// CLI, for a session with no service running. Same function, same file, written
// atomically the way the service writes it.
if ((process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  const arg = (n) => { const i = args.indexOf(n); return i > -1 ? args[i + 1] : null; };
  const data = arg("--data");
  if (!data) { console.error("usage: node rows.mjs --data <project>/audit/<fileKey>.json [--payload <file>] [--dry-run]"); process.exit(2); }
  const dry = args.includes("--dry-run");
  const src = arg("--payload") ? readFileSync(arg("--payload"), "utf8") : readFileSync(0, "utf8");
  const record = existsSync(data) ? JSON.parse(readFileSync(data, "utf8")) : { rows: {}, libraries: {}, runs: {} };
  let out;
  try { out = applyRows(record, Object.assign(JSON.parse(src), dry ? { dryRun: true } : {})); }
  catch (e) { console.error(e.message); process.exit(1); }
  if (!dry) {
    // A project's first run has no audit folder yet — one record per library
    // means the folder is created by whoever files first, and that is this.
    // Without it the first audit of a new project died on ENOENT after doing
    // all its work, which is the one moment the writer is most needed.
    mkdirSync(dirname(data), { recursive: true });
    // A tmp name only this process uses. The service writes the same record,
    // and the README offers this CLI as interchangeable with its route — so
    // one shared `.tmp` path is two writers in one scratch file, which left
    // the record unparseable in 11 of 30 concurrent trials. See the same
    // reasoning at `writeData` in server.mjs.
    const tmp = data + "." + process.pid + ".tmp";
    writeFileSync(tmp, JSON.stringify(record, null, 2) + "\n", "utf8");
    // The previous record kept beside it, as the service does (see writeData).
    try { copyFileSync(data, data + ".prev"); } catch (e) { if (e.code !== "ENOENT") throw e; }
    renameSync(tmp, data);
  }
  console.log(JSON.stringify(out));
}
