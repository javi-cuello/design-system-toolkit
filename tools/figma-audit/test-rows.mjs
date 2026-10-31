#!/usr/bin/env node
// Runs applyRows() against fixture records, with no service and no Figma.
//   node tools/figma-audit/test-rows.mjs
import { applyRows, rowId } from "./rows.mjs";

let failed = 0, passed = 0;
function expect(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else { failed++; console.log("FAIL " + name + "\n  got  " + JSON.stringify(got) + "\n  want " + JSON.stringify(want)); }
}
const NOW = "2026-09-11T10:00:00.000Z";
// The components scanner reports the rule families it ran; a full run from it says so.
const RAN = ["naming", "structure", "properties", "metadata", "tokens", "states", "schema"];
const open = (id) => id && !id.done;

// A page-order pair whose texts share more than 32 characters
let rec = { rows: {}, libraries: { K: { name: "Lib", metrics: {} } } };
let r = applyRows(rec, { owner: "figma-foundations-audit", fileKey: "K", full: true, findings: [
  { where: "Page list", check: "in INPUTS, Combobox should come before Text input", rule: "page-order", sev: "warning", bucket: 1 },
  { where: "Page list", check: "in INPUTS, Combobox should come before Textarea", rule: "page-order", sev: "review", bucket: "b1" }
] }, NOW);
expect("two findings with one 32-character prefix get two rows", [r.added, Object.keys(rec.rows).length], [2, 2]);
expect("the second key carries a hash rather than overwriting the first",
  r.ids.map((i) => i.startsWith("a-page-list-in-inputs-combobox-should-come-b")), [true, true]);
expect("the two ids differ", r.ids[0] !== r.ids[1], true);
expect("severity is coerced to the contract's values", Object.values(rec.rows).map((x) => x.sev), ["warn", "warn"]);
expect("bucket accepts a number or a b-prefixed string", Object.values(rec.rows).map((x) => x.bucket), ["b1", "b1"]);
{
  // a naming preference keeps its own tier: a name that departs from one works, so it is not a warning
  const p = { rows: {}, libraries: { K: { name: "Lib", metrics: {} } } };
  applyRows(p, { owner: "figma-foundations-audit", fileKey: "K", findings: [{ where: "Card/Header", check: "Grouped with a bare slash", rule: "naming", key: "naming|separator", sev: "preference", bucket: 3 }] }, NOW);
  expect("a preference is filed as pref, never coerced to warn", Object.values(p.rows).map((x) => x.sev), ["pref"]);
}
expect("the library's open count moves with the queue", rec.libraries.K.metrics, { totalFindings: 2, openFindings: 2 });

// The same run again: matched, not duplicated; nothing closed
r = applyRows(rec, { owner: "figma-foundations-audit", fileKey: "K", full: true, findings: [
  { where: "Page list", check: "in INPUTS, Combobox should come before Text input" },
  { where: "Page list", check: "in INPUTS,  Combobox should come before Textarea" }
] }, NOW);
expect("a re-run matches by owner, component and wording, whitespace aside", [r.added, r.updated, r.closed, Object.keys(rec.rows).length], [0, 2, 0, 2]);

// A full run that raises one of the two closes the other, and only the owner's
r = applyRows(rec, { owner: "figma-foundations-audit", fileKey: "K", full: true, scope: ["Page list"], ran: ["page-order"], findings: [
  { where: "Page list", check: "in INPUTS, Combobox should come before Text input" }
] }, NOW);
const rows = Object.values(rec.rows);
expect("a full run closes the owner's row it no longer raises", [r.closed, rows.filter(open).length], [1, 1]);
expect("the close is stamped as verified with the run's date", rows.find((x) => x.done).verifiedAt, NOW);

// Existing rows: a 32-character id with no hash, and a legacy row with no owner
// and no check. First run through here must match both, not duplicate them.
rec = { rows: {
  "a-icon-button-hidden-layer-tooltip-wired-to-no": { check: 'hidden layer "Tooltip" wired to nothing', where: "Icon button", owner: "figma-components-audit", done: false, note: "leave it", fix: ['hidden layer "Tooltip" wired to nothing'] },
  "n62-1778-nudger-double-dim": { where: "Nudger", fix: ["&lt;b&gt;Nudger&lt;/b&gt; is dimmed twice: the frame and the icon both carry opacity"], done: false, note: "", sev: "rule" }
}, libraries: {} };
r = applyRows(rec, { owner: "figma-components-audit", full: true, ran: RAN, scope: ["Icon button", "Nudger"], findings: [
  { where: "Icon button", check: 'hidden layer "Tooltip" wired to nothing', node: "301:9" },
  { where: "Nudger", check: "<b>Nudger</b> is dimmed twice: the frame and the icon both carry opacity" }
] }, NOW);
expect("an existing 32-character id is matched, not re-minted", [r.added, r.updated, Object.keys(rec.rows).length], [0, 2, 2]);
expect("the maintainer's note survives the match", rec.rows["a-icon-button-hidden-layer-tooltip-wired-to-no"].note, "leave it");
expect("a raised row's node id is refreshed", rec.rows["a-icon-button-hidden-layer-tooltip-wired-to-no"].node, "301:9");
expect("a legacy row with no owner and no check belongs to the components audit and matches on its fix wording", rec.rows["n62-1778-nudger-double-dim"].done, false);

// Another owner's full run over the same components touches nothing
r = applyRows(rec, { owner: "figma-foundations-audit", full: true, findings: [] }, NOW);
expect("a full run by another owner closes none of these", [r.closed, Object.values(rec.rows).filter(open).length], [0, 2]);

// Scope: a full run over one component closes only inside it
r = applyRows(rec, { owner: "figma-components-audit", full: true, ran: RAN, scope: ["Nudger"], findings: [] }, NOW);
expect("closing stays inside the run's scope", Object.entries(rec.rows).map(([id, x]) => id + ":" + x.done),
  ["a-icon-button-hidden-layer-tooltip-wired-to-no:false", "n62-1778-nudger-double-dim:true"]);

// A partial run closes nothing, whatever it read
r = applyRows(rec, { owner: "figma-components-audit", full: false, scope: ["Icon button"], findings: [] }, NOW);
expect("a partial run never closes", [r.closed, rec.rows["a-icon-button-hidden-layer-tooltip-wired-to-no"].done], [0, false]);

// A closed row raised again is reopened with a trail, not duplicated
r = applyRows(rec, { owner: "figma-components-audit", full: false, findings: [
  { where: "Nudger", check: "<b>Nudger</b> is dimmed twice: the frame and the icon both carry opacity", rule: "tokens" }
] }, NOW);
const n = rec.rows["n62-1778-nudger-double-dim"];
expect("a closed row raised again is reopened, not duplicated",
  [r.reopened, r.added, n.done, n.verified, n.reopenedAt, Object.keys(rec.rows).length], [1, 0, false, false, NOW, 2]);
expect("the reopen keeps the earlier stamp in its trail", n.verifyNote.includes("before that: Cleared by figma-components-audit"), true);
expect("model or scanner wording is escaped before it lands", n.fix, ["&lt;b&gt;Nudger&lt;/b&gt; is dimmed twice: the frame and the icon both carry opacity"]);

// Targets: component-validator runs once per code target
rec = { rows: {}, libraries: {} };
applyRows(rec, { owner: "component-validator", target: "ios", full: true, findings: [{ where: "Button", check: "I8 line height", rule: "I8" }] }, NOW);
r = applyRows(rec, { owner: "component-validator", target: "web", full: true, findings: [{ where: "Button", check: "W5 centre stroke", rule: "W5" }] }, NOW);
expect("a web run does not close an iOS row on the same component",
  Object.values(rec.rows).map((x) => x.target + ":" + x.done), ["ios:false", "web:false"]);
// A clean run states what it read, the way the page files it (`scope: v.scope`).
r = applyRows(rec, { owner: "component-validator", target: "ios", full: true, scope: ["Button"], findings: [] }, NOW);
expect("an iOS run closes only the iOS row", Object.values(rec.rows).map((x) => x.target + ":" + x.done), ["ios:true", "web:false"]);

/*
 * A run that read nothing has not read everything.
 *
 * `full` with no findings AND no scope was an unbounded claim on no
 * evidence: it closed every open row of that owner and stamped each one "a
 * full run no longer raises this". A plugin answering `{audited: []}` — a
 * TOKENS mismatch, a page rule matching nothing — wiped the whole foundations
 * or variable queue and reported a clean run. Six rows, `closed: 6`, no error.
 *
 * A genuinely clean library looks identical from here, which is why the
 * caller states its scope. Then "I read these and none raised anything"
 * closes, and "I read nothing" closes nothing.
 */
{
  const rec2 = { rows: {} };
  applyRows(rec2, { owner: "figma-foundations-audit", full: true, scope: ["Page list"],
    findings: [{ where: "Card", check: "grouped with a bare slash" }] }, NOW);
  const before = Object.values(rec2.rows).filter((x) => !x.done).length;
  const out = applyRows(rec2, { owner: "figma-foundations-audit", full: true, findings: [] }, NOW);
  expect("a full run that raised nothing and names no scope closes nothing", out.closed, 0);
  expect("and says why, rather than reporting a clean sweep", typeof out.refused, "string");
  expect("so the rows are still open", Object.values(rec2.rows).filter((x) => !x.done).length, before);
  // Naming the scope is what makes the claim answerable — an empty scope is a
  // run that read nothing, and closes nothing either.
  const none = applyRows(rec2, { owner: "figma-foundations-audit", full: true, scope: [], ran: ["naming"], findings: [] }, NOW);
  expect("an empty scope closes nothing and is not refused", [none.closed, none.refused], [0, undefined]);
  const all = applyRows(rec2, { owner: "figma-foundations-audit", full: true, scope: ["Card"], ran: ["naming"], findings: [] }, NOW);
  expect("a scope that names the row closes it", all.closed, 1);
}

// A judge's dismissal closes with its own reason, not "no longer raised"
rec = { rows: {}, libraries: {} };
applyRows(rec, { owner: "component-validator", target: "web", full: true, findings: [
  { where: "Button", check: "W5 · Content · outside stroke" }, { where: "Button", check: "W1 · Wrapper · holds only Content" }
] }, NOW);
r = applyRows(rec, { owner: "component-validator", target: "web", full: true,
  findings: [{ where: "Button", check: "W1 · Wrapper · holds only Content" }],
  dismissed: [{ where: "Button", check: "W5 · Content · outside stroke", why: "the outside stroke is the recorded focus-ring mechanism" }], dryRun: true }, NOW);
expect("a dry run reports the outcome and writes nothing", [r.dryRun, r.closed, r.updated, Object.values(rec.rows).filter((x) => x.done || x.dismissedRuns).length], [true, 0, 2, 0]);
r = applyRows(rec, { owner: "component-validator", target: "web", full: true,
  findings: [{ where: "Button", check: "W1 · Wrapper · holds only Content" }],
  dismissed: [{ where: "Button", check: "W5 · Content · outside stroke", why: "the outside stroke is the recorded focus-ring mechanism" }] }, NOW);
{
  const rows2 = Object.values(rec.rows);
  const w5 = rows2.find((x) => x.check.startsWith("W5"));
  // Two runs must agree: the judge closed six rows one run and reopened the same six the next, three runs running.
  expect("a first dismissal keeps the row open and counts it", [r.closed, r.updated, w5.done, w5.dismissedRuns], [0, 2, false, 1]);
  expect("and says so, with the judge's reason", w5.verifyNote.startsWith("Dismissed once by the judgement pass") && w5.verifyNote.includes(": the outside stroke is the recorded focus-ring mechanism."), true);
  expect("the kept finding stays open", rows2.find((x) => x.check.startsWith("W1")).done, false);
}
r = applyRows(rec, { owner: "component-validator", target: "web", full: true,
  findings: [{ where: "Button", check: "W1 · Wrapper · holds only Content" }],
  dismissed: [{ where: "Button", check: "W5 · Content · outside stroke", why: "the outside stroke is the recorded focus-ring mechanism" }] }, NOW);
{
  const w5 = Object.values(rec.rows).find((x) => x.check.startsWith("W5"));
  expect("a second run's dismissal closes it", [r.closed, w5.done, w5.verified, w5.dismissedRuns], [1, true, true, 2]);
  expect("and says the judge dismissed it, not that the check stopped raising it", w5.verifyNote.startsWith("Dismissed by the judgement pass"), true);
  expect("and carries the judge's reason", w5.verifyNote.includes(": the outside stroke is the recorded focus-ring mechanism."), true);
}
// A raise between two dismissals starts the count again.
{
  const rec3 = { rows: {}, libraries: {} };
  const dis = { where: "Chip", check: "W9 · Label · truncates", why: "the label is meant to wrap" };
  applyRows(rec3, { owner: "component-validator", target: "web", full: true, findings: [{ where: "Chip", check: "W9 · Label · truncates" }] }, NOW);
  applyRows(rec3, { owner: "component-validator", target: "web", full: true, findings: [], dismissed: [dis] }, NOW);
  applyRows(rec3, { owner: "component-validator", target: "web", full: true, findings: [{ where: "Chip", check: "W9 · Label · truncates" }] }, NOW);
  const raised = Object.values(rec3.rows)[0];
  expect("a raise after one dismissal clears the count", [raised.done, raised.dismissedRuns], [false, undefined]);
  expect("and the note stops saying it was dismissed", /^Kept by the judgement pass on .* after one dismissal/.test(raised.verifyNote || ""), true);
  const r3 = applyRows(rec3, { owner: "component-validator", target: "web", full: true, findings: [], dismissed: [dis] }, NOW);
  expect("so the next dismissal is a first one again", [r3.closed, Object.values(rec3.rows)[0].dismissedRuns], [0, 1]);
}
r = applyRows(rec, { owner: "component-validator", target: "web", full: false, findings: [], dismissed: [{ where: "Button", check: "W5 · Content · outside stroke" }] }, NOW);
expect("a dismissal of a row already closed as dismissed re-stamps it and closes nothing", [r.closed, r.updated], [0, 1]);
rec.rows[Object.keys(rec.rows).find((k) => rec.rows[k].check.startsWith("W5"))].verifyNote = "Cleared by component-validator on 2026-09-10 — a full run no longer raises this.";
r = applyRows(rec, { owner: "component-validator", target: "web", full: false, findings: [], dismissed: [{ where: "Button", check: "W5 · Content · outside stroke", why: "ruled: the outside stroke is the focus ring" }] }, NOW);
{
  const w5 = Object.values(rec.rows).find((x) => x.check.startsWith("W5"));
  expect("a dismissal landing on a row closed as 'no longer raised' rewrites that note with the truth", [r.closed, r.updated, w5.done, w5.verifyNote.includes("ruled: the outside stroke")], [0, 1, true, true]);
  expect("and moves the verify stamp with it, so the page does not read the row as re-ticked", w5.verifiedAt >= w5.updatedAt, true);
}

// Refusals
let threw = null;
try { applyRows({ rows: {} }, { findings: [] }); } catch (e) { threw = e.message; }
expect("no owner is refused", threw, "owner required");
threw = null;
try { applyRows({ rows: {} }, { owner: "x", findings: [{ where: "A" }] }); } catch (e) { threw = e.message; }
expect("a finding without wording is refused", threw, "every finding needs `where` and `check`");
expect("rowId is the page's old key when free", rowId("Icon button", 'hidden layer "Tooltip" wired to nothing', () => false), "a-icon-button-hidden-layer-tooltip-wired-to-no");

/*
 * One finding, one component, three code targets — three rows.
 *
 * `target` exists so a web run never closes an iOS row, and the key has to
 * carry that or the rows are not distinct. The hash was of the wording alone,
 * so iOS and Android minted the SAME id and Android wrote over iOS: three
 * runs, each reporting `added: 1`, and two rows in the record. Nothing
 * errored, so the only way to notice was to count.
 */
{
  const rec = { rows: {} };
  const ids = ["web", "ios", "android"].map((target) => applyRows(rec, {
    owner: "component-validator", target,
    findings: [{ where: "Button", check: "the label is not bound to a text style" }],
  }, NOW).ids[0]);
  expect("three targets file three DISTINCT ids", new Set(ids).size, 3);
  expect("and all three are in the record", Object.keys(rec.rows).length, 3);
  expect("each keeping its own target",
    Object.values(rec.rows).map((r) => r.target).sort(), ["android", "ios", "web"]);
  /*
   * An id depends on its own identity, not on the ORDER things were filed.
   *
   * The collision loop alone would make three distinct ids — `base`,
   * `base-<h>`, `base-<h>-2` — so every assertion above passes without the
   * owner and target being in the hash at all, which a mutation test showed.
   * What they buy is narrower than "order does not matter" — whoever files
   * FIRST takes the bare key either way, which is inherent. It is that every
   * row after the first gets a suffix from its own identity rather than from
   * its position: file the three backwards and `ios`, which is first in
   * neither order, keeps exactly the id it had. Without them the suffixes
   * are `-<h>` then `-<h>-2` by arrival, so BOTH non-first rows change.
   */
  // `ios` LAST here and second above — the same target at a different
  // position, which is the only arrangement that can tell the two apart. A
  // first attempt put it second in both orders and passed with the hash
  // gutted, proving nothing.
  const rec2 = { rows: {} };
  for (const target of ["web", "android", "ios"]) applyRows(rec2, {
    owner: "component-validator", target,
    findings: [{ where: "Button", check: "the label is not bound to a text style" }],
  }, NOW);
  const byTarget = (r) => Object.fromEntries(Object.entries(r.rows).map(([id, x]) => [x.target, id]));
  expect("a row that is not the first to claim the key keeps its id whatever the order",
    byTarget(rec2).ios, byTarget(rec).ios);
  expect("and filing backwards still yields three distinct ids",
    new Set(Object.keys(rec2.rows)).size, 3);

  // Raised again: found by matching, never re-minted, so no fourth row.
  applyRows(rec, { owner: "component-validator", target: "ios",
    findings: [{ where: "Button", check: "the label is not bound to a text style" }] }, NOW);
  expect("and a re-raise still finds its own row", Object.keys(rec.rows).length, 3);
}

// A second collision has to go somewhere too. Two rows already hold the base
// and the hash, and the third must not land on either of them.
{
  const taken = new Set(["a-a-c"]);
  const first = rowId("A", "c", (k) => taken.has(k), "one");
  taken.add(first);
  const second = rowId("A", "c", (k) => taken.has(k), "one");
  expect("a key whose fallback is also taken mints a further one", second === first, false);
  expect("and it is free", taken.has(second), false);
}

// A field that arrives after a row exists must reach that row on the next
// run. `lands` was written only where a row was CREATED, so rows raised again
// kept the shape they were born with and never joined the filter that was
// built for them.
{
  const rec2 = { rows: {} };
  applyRows(rec2, { owner: "component-validator", target: "web", full: true,
                    findings: [{ where: "Avatar", check: "W5 stroke", rule: "W5" }] }, NOW);
  const id2 = Object.keys(rec2.rows)[0];
  expect("a row filed before the field existed carries none", rec2.rows[id2].lands, undefined);
  applyRows(rec2, { owner: "component-validator", target: "web", full: true,
                    findings: [{ where: "Avatar", check: "W5 stroke", rule: "W5", lands: "figma" }] }, NOW);
  expect("and takes it on the next run that raises it again", rec2.rows[id2].lands, "figma");
  expect("without filing a second copy", Object.keys(rec2.rows).length, 1);

  // And it takes the run's WORDING too. Only a reopened row used to; an
  // already-open one kept the text it was created with for ever, so every
  // improvement to a check's advice was invisible on any board that had
  // already seen that finding once.
  applyRows(rec2, { owner: "component-validator", target: "web", full: true,
                    findings: [{ where: "Avatar", check: "W5 stroke", rule: "W5", lands: "figma",
                                 fix: ["The divider's stroke sits on the edge"],
                                 rec: ["In Figma: set it inside, or the component ends up wider than drawn"] }] }, NOW);
  expect("a re-raised row restates what the check now says",
    [rec2.rows[id2].fix, rec2.rows[id2].rec],
    [["The divider's stroke sits on the edge"], ["In Figma: set it inside, or the component ends up wider than drawn"]]);

  // But never the maintainer's own words. A note and a tick are theirs.
  rec2.rows[id2].note = "agreed, doing it Monday";
  rec2.rows[id2].done = true;
  applyRows(rec2, { owner: "component-validator", target: "web", full: true,
                    findings: [{ where: "Avatar", check: "W5 stroke", rule: "W5", lands: "figma",
                                 fix: ["reworded again"], rec: ["and again"] }] }, NOW);
  expect("and the note survives the restating", rec2.rows[id2].note, "agreed, doing it Monday");
}

// A row whose `where` names a component AND a place inside it is still that
// component's row, and a full run of that component closes it. Compared whole
// against a scope of component names it matched nothing, so a row a session
// had written as "Button — properties panel" survived every later audit.
{
  const rec3 = { rows: {} };
  applyRows(rec3, { owner: "component-validator", target: "web+mui", full: true,
                    findings: [{ where: "Button \u2014 properties panel", check: "MU2 old wording", rule: "MU2" }] }, NOW);
  const id3 = Object.keys(rec3.rows)[0];
  applyRows(rec3, { owner: "component-validator", target: "web+mui", full: true, scope: ["Button"],
                    findings: [{ where: "Button", check: "MU2 new wording", rule: "MU2" }] }, NOW);
  expect("a full run of Button closes a row filed as \"Button — properties panel\"", rec3.rows[id3].done, true);
  expect("and a component outside the scope is still left alone", (() => {
    const rec4 = { rows: {} };
    applyRows(rec4, { owner: "component-validator", target: "web", full: true,
                      findings: [{ where: "Chip \u2014 panel", check: "W5 x", rule: "W5" }] }, NOW);
    const only = Object.keys(rec4.rows)[0];
    applyRows(rec4, { owner: "component-validator", target: "web", full: true, scope: ["Button"], findings: [] }, NOW);
    return rec4.rows[only].done;
  })(), false);
}

/*
 * A re-raise restates everything the CHECK says, not only its wording.
 *
 * `check`, `fix` and `rec` were restated; `bucket`, `sev`, `visible` and
 * `rule` were not. So moving a rule between buckets in `buckets.json`, or
 * raising a check's severity, changed only rows nobody had seen yet — one
 * finding sat in "Approve & I fix" and its twin on another component sat in
 * "Decide", for ever, with nothing on the board to say why.
 */
{
  const rec3 = { rows: {} };
  const raise = (extra) => applyRows(rec3, { owner: "figma-components-audit",
    findings: [Object.assign({ where: "Chip", check: "no description" }, extra)] }, NOW);
  raise({ bucket: 3, sev: "warn", visible: false, rule: "desc" });
  const id3 = Object.keys(rec3.rows)[0];
  rec3.rows[id3].note = "asked the designer";
  rec3.rows[id3].done = false;
  raise({ bucket: 1, sev: "error", visible: true, rule: "desc-v2" });
  const got = rec3.rows[id3];
  expect("a re-raise takes this run's bucket, severity, visibility and rule",
    [got.bucket, got.sev, got.visible, got.rule], ["b1", "error", true, "desc-v2"]);
  expect("and still only one row", Object.keys(rec3.rows).length, 1);
  // The division the restating rests on: the check's account is the check's,
  // the maintainer's is theirs.
  expect("while the maintainer's own note is untouched", got.note, "asked the designer");
}

/*
 * A ruling is not overturned by the check that prompted it.
 *
 * A ruled row reopened on the next run, with the ruling demoted to
 * "before that:" inside a note headed "Raised again by…". But a ruling IS the
 * maintainer saying this is not a defect here, on a check that was always
 * going to go on raising it — and not every owner has a judgement pass to
 * suppress it upstream, so `figma-variable-audit`'s ruled rows came back
 * every single run.
 */
{
  const rec4 = { rows: {} };
  const run = (at) => applyRows(rec4, { owner: "figma-variable-audit", full: true, scope: ["Card"],
    findings: [{ where: "Card", check: "orphan token" }] }, at);
  run("2026-09-01T00:00:00.000Z");
  const id4 = Object.keys(rec4.rows)[0];
  Object.assign(rec4.rows[id4], { done: true, verified: true, ruledAt: "2026-09-02T00:00:00.000Z",
    verifyNote: "Closed by your ruling, not by a change." });

  const again = run("2026-09-03T00:00:00.000Z");
  expect("a ruled row the check still raises is not reopened", [again.reopened, rec4.rows[id4].done], [0, true]);
  expect("and it says both halves: still raised, still ruled",
    /^Still raised by figma-variable-audit on 2026-09-03, and still closed by your ruling\./.test(rec4.rows[id4].verifyNote), true);
  expect("the ruling itself is kept, not demoted",
    rec4.rows[id4].verifyNote.includes("Closed by your ruling"), true);
  expect("and the stamp is not rewritten every run", rec4.rows[id4].ruledAt, "2026-09-02T00:00:00.000Z");
  run("2026-09-04T00:00:00.000Z");
  expect("a second run does not stack another sentence onto the note",
    (rec4.rows[id4].verifyNote.match(/Still raised by/g) || []).length, 1);

  // A row closed by a full run, with no ruling, still reopens — a regression
  // is a regression.
  const rec5 = { rows: {} };
  applyRows(rec5, { owner: "figma-components-audit", full: true, ran: RAN, scope: ["Card"],
    findings: [{ where: "Card", check: "no description" }] }, NOW);
  const id5 = Object.keys(rec5.rows)[0];
  Object.assign(rec5.rows[id5], { done: true, verified: true });
  const back = applyRows(rec5, { owner: "figma-components-audit", full: true, ran: RAN, scope: ["Card"],
    findings: [{ where: "Card", check: "no description" }] }, NOW);
  expect("a row closed WITHOUT a ruling still reopens", [back.reopened, rec5.rows[id5].done], [1, false]);
}

/*
 * The same finding, with a different measurement in it.
 *
 * Some checks put a measured value in their wording. When the gap moved from
 * -1 to -2 the wording no longer matched, so the run filed a NEW row and
 * closed the old one as "a full run no longer raises this" — while the gap
 * was still unbound and the maintainer's note was on the row that had just
 * closed. Four live checks are in this shape.
 */
{
  const rec6 = { rows: {} };
  const raise = (where, check) => applyRows(rec6, { owner: "figma-components-audit", full: true, ran: RAN,
    scope: ["Tooltip", "Card"], findings: [{ where, check, rule: "tokens" }] }, NOW);

  raise("Tooltip", "Tooltip: raw gap=-1");
  const id6 = Object.keys(rec6.rows)[0];
  rec6.rows[id6].note = "asked the designer";
  const moved = raise("Tooltip", "Tooltip: raw gap=-2");
  expect("a measurement that moved updates the row rather than splitting it",
    [moved.added, moved.updated, moved.closed, Object.keys(rec6.rows).length], [0, 1, 0, 1]);
  expect("the row takes the new wording and keeps the maintainer's note",
    [rec6.rows[id6].check, rec6.rows[id6].note, rec6.rows[id6].done],
    ["Tooltip: raw gap=-2", "asked the designer", false]);

  // The layer is in the wording, so two layers stay two findings.
  raise("Tooltip", "Body: raw gap=-2");
  expect("a different layer is still its own row", Object.keys(rec6.rows).length, 2);

  // A different RULE is a different finding even at the same wording shape.
  applyRows(rec6, { owner: "figma-components-audit", full: true, ran: RAN, scope: ["Tooltip"],
    findings: [{ where: "Tooltip", check: "Tooltip: raw gap=-3", rule: "structure" }] }, NOW);
  expect("and so is the same shape under another rule", Object.keys(rec6.rows).length, 3);

  /*
   * The mask is narrow on purpose: a bare number is left alone, because token
   * paths are full of them. `Colour/Palette/Blue/4` and `Blue/6` are two
   * different tokens, not one finding whose value moved.
   */
  const rec7 = { rows: {} };
  const tok = (check) => applyRows(rec7, { owner: "figma-variable-audit", full: true, scope: ["Card"],
    findings: [{ where: "Card", check, rule: "link" }] }, NOW);
  tok("binds Colour/Palette/Blue/4, which is not published");
  tok("binds Colour/Palette/Blue/6, which is not published");
  expect("two token paths differing only by a number are two rows", Object.keys(rec7.rows).length, 2);
}

/*
 * A check's own words follow the project's dialect; the project's do not.
 *
 * The checks are written in this repo's English, so a project recording
 * `language: en-US` read "a raw colour stays the same in dark mode" and "a
 * centre stroke straddles the edge" on its own board. Generated text must not
 * revert a project to the dialect it has left.
 *
 * Applied here because every owner's findings pass through this one writer,
 * and on the way IN, so the stored row carries the right spelling for every
 * reader of the record.
 */
{
  const finding = () => ({
    where: "Avatar - Colour",                       // the project's own name
    check: "W5 \u00b7 Ring \u00b7 a centre stroke",
    rec: ["in Figma: bind the fill \u2014 a raw colour stays the same in dark mode"],
  });
  const filed = (language) => {
    const r = { rows: {} };
    applyRows(r, { owner: "component-validator", target: "web", language, findings: [finding()] }, NOW);
    return Object.values(r.rows)[0];
  };

  const us = filed("en-US");
  expect("an en-US project reads the check in its own dialect",
    [us.check, us.rec[0].includes("a raw color")], ["W5 \u00b7 Ring \u00b7 a center stroke", true]);
  expect("and the COMPONENT's name is untouched \u2014 the project's words are the project's",
    us.where, "Avatar - Colour");

  const gb = filed("en-GB"), none = filed(undefined);
  expect("en-GB is unchanged", gb.check, "W5 \u00b7 Ring \u00b7 a centre stroke");
  expect("and a project that states no dialect is en-GB", none.check, gb.check);
}

// A check that rewords itself keeps its rows. The live case: the advice moved
// out of `check` into `rec`, so every row of that rule was re-keyed — minted
// anew and the originals closed with "a full run no longer raises this".
{
  const LONG = "used only inside Sidebar (Secondary) - Section but does not carry its name; figma-standard rule 9 would call it Sidebar (Secondary) - Section - Sidebar (Secondary) - Item";
  const SHORT = "used only inside Sidebar (Secondary) - Section but does not carry its name";
  const file = { owner: "figma-foundations-audit", fileKey: "K", full: true, scope: ["Sidebar (Secondary) - Item"], ran: ["naming", "page-order"] };
  const rec = { rows: {} };
  applyRows(rec, Object.assign({}, file, { findings: [{ where: "Sidebar (Secondary) - Item", check: LONG, rule: "naming", bucket: 3 }] }), NOW);
  const id = Object.keys(rec.rows)[0];
  rec.rows[id].done = true;                       // the maintainer ticked it
  applyRows(rec, Object.assign({}, file, { findings: [{ where: "Sidebar (Secondary) - Item", check: SHORT, rule: "naming", bucket: 3, rec: ["In Figma: rename it."] }] }), NOW);
  expect("a shortened wording updates the row it already had, and mints nothing",
    Object.keys(rec.rows), [id]);
  expect("the row carries the new wording and the new advice, and is re-raised rather than left ticked",
    [rec.rows[id].check, rec.rows[id].rec[0], rec.rows[id].done, !!rec.rows[id].reopenedAt],
    [SHORT, "In Figma: rename it.", false, true]);

  // And back the other way, because a rewrite can lengthen too.
  const rec2 = { rows: {} };
  applyRows(rec2, Object.assign({}, file, { findings: [{ where: "Sidebar (Secondary) - Item", check: SHORT, rule: "naming", bucket: 3 }] }), NOW);
  const id2 = Object.keys(rec2.rows)[0];
  applyRows(rec2, Object.assign({}, file, { findings: [{ where: "Sidebar (Secondary) - Item", check: LONG, rule: "naming", bucket: 3 }] }), NOW);
  expect("a lengthened wording matches the same row", Object.keys(rec2.rows), [id2]);

  // Ambiguity mints. Two findings of one rule on one component cannot be told
  // apart by a prefix, and a tick on the wrong one is worse than a duplicate.
  const rec3 = { rows: {} };
  applyRows(rec3, Object.assign({}, file, { findings: [
    { where: "X", check: "a", rule: "naming", bucket: 3 },
    { where: "X", check: "ab", rule: "naming", bucket: 3 }] }), NOW);
  expect("two rows for one component and rule stay two", Object.keys(rec3.rows).length, 2);
  applyRows(rec3, Object.assign({}, file, { scope: ["X"], findings: [{ where: "X", check: "abc", rule: "naming", bucket: 3 }] }), NOW);
  expect("and a third wording that prefixes BOTH mints rather than guessing",
    Object.values(rec3.rows).filter((r) => r.check === "abc").length, 1);

  // A different rule on the same component is a different finding.
  const rec4 = { rows: {} };
  applyRows(rec4, Object.assign({}, file, { findings: [{ where: "X", check: "a b", rule: "naming", bucket: 3 }] }), NOW);
  applyRows(rec4, Object.assign({}, file, { scope: ["X"], findings: [{ where: "X", check: "a b c", rule: "page-order", bucket: 3 }] }), NOW);
  expect("a prefix under a DIFFERENT rule never matches", Object.keys(rec4.rows).length, 2);
}

// A rename orphaned its rows for ever: the scope holds the names that exist
// now, so the old name was never in it and no run could close the row.
{
  const file = { owner: "figma-foundations-audit", fileKey: "K", ran: ["naming"] };
  const rec = { rows: {} };
  applyRows(rec, Object.assign({}, file, { full: true, scope: ["Table - Header / Fill"], exhaustive: true,
    findings: [{ where: "Table - Header / Fill", check: "used only inside Table - Column but does not carry its name", rule: "naming", bucket: 3 }] }), NOW);
  const id = Object.keys(rec.rows)[0];
  // The maintainer renames it in Figma; the next full run sees the new name
  // and raises nothing.
  applyRows(rec, Object.assign({}, file, { full: true, scope: ["Table - Column - Header / Fill"], exhaustive: true, findings: [] }), NOW);
  expect("an exhaustive run closes a row whose component is gone", rec.rows[id].verified, true);
  expect("and says so, rather than claiming the check stopped raising it",
    /renamed or removed/.test(rec.rows[id].verifyNote), true);

  // The same run without the claim leaves it exactly as it was — a scoped
  // check knows nothing about what it was not given.
  const rec2 = { rows: {} };
  applyRows(rec2, Object.assign({}, file, { full: true, scope: ["Table - Header / Fill"],
    findings: [{ where: "Table - Header / Fill", check: "c", rule: "naming", bucket: 3 }] }), NOW);
  const id2 = Object.keys(rec2.rows)[0];
  applyRows(rec2, Object.assign({}, file, { full: true, scope: ["Something else"], findings: [] }), NOW);
  expect("without `exhaustive` the row is untouched", !!rec2.rows[id2].done, false);

  // And a row still in scope keeps the ordinary wording.
  const rec3 = { rows: {} };
  applyRows(rec3, Object.assign({}, file, { full: true, scope: ["X"], exhaustive: true,
    findings: [{ where: "X", check: "c", rule: "naming", bucket: 3 }] }), NOW);
  const id3 = Object.keys(rec3.rows)[0];
  applyRows(rec3, Object.assign({}, file, { full: true, scope: ["X"], exhaustive: true, findings: [] }), NOW);
  expect("a component still in the file closes with the ordinary reason",
    /no longer raises this/.test(rec3.rows[id3].verifyNote), true);
}

// An exhaustive claim over an EMPTY scope closed every row of the owner as
// "renamed or removed" — including rows carrying the maintainer's notes. The
// caller writes `scope: out.reach || []`, so a scanner that answered with
// nothing walked straight past the guard that exists to catch exactly this.
{
  const mk = () => ({ rows: { r1: { where: "Table - Cell / Fill", check: "c", rule: "naming",
                                     owner: "figma-foundations-audit", bucket: "b3", note: "my note" } } });
  let rec = mk();
  let out = applyRows(rec, { owner: "figma-foundations-audit", full: true, exhaustive: true, scope: [], ran: ["naming"], findings: [] }, NOW);
  expect("an exhaustive run that read nothing closes nothing and leaves the note where it is",
    [out.closed, !!rec.rows.r1.done, rec.rows.r1.note], [0, false, "my note"]);
  rec = mk();
  out = applyRows(rec, { owner: "figma-foundations-audit", full: true, exhaustive: true, scope: ["Something else"], ran: ["naming"], findings: [] }, NOW);
  expect("but a run that names what it read still closes the row that is gone", out.closed, 1);
}

// A check whose setting is missing does not run — and must not then close the
// rows it is no longer raising. `scope` bounds the close by component and says
// nothing about which checks were exercised.
{
  const file = { owner: "figma-foundations-audit", fileKey: "K" };
  const rec = { rows: {} };
  applyRows(rec, Object.assign({}, file, { full: true, scope: ["Menu item / Expanded"], ran: ["separator", "page-order"],
    findings: [{ where: "Menu item / Expanded", check: "grouped with a bare slash", rule: "separator", bucket: 3 }] }), NOW);
  const id = Object.keys(rec.rows)[0];
  // Next run: the separator setting is gone, so that check did not execute.
  applyRows(rec, Object.assign({}, file, { full: true, scope: ["Menu item / Expanded"], ran: ["page-order"], findings: [] }), NOW);
  expect("a rule that did not run leaves its rows alone", !!rec.rows[id].done, false);
  // And when it does run and raises nothing, the row closes as before.
  applyRows(rec, Object.assign({}, file, { full: true, scope: ["Menu item / Expanded"], ran: ["page-order", "separator"], findings: [] }), NOW);
  expect("and closes them once it has run", rec.rows[id].verified, true);
  // A caller that reports no rules at all keeps the old behaviour.
  // An owner whose scanner REPORTS its rules and then files without them is
  // refused: the rows stay open and the result says which clause. It used to
  // "keep the old behaviour" and close everything in scope.
  const rec2 = { rows: {} };
  applyRows(rec2, Object.assign({}, file, { full: true, scope: ["X"], ran: ["separator"],
    findings: [{ where: "X", check: "c", rule: "separator", bucket: 3 }] }), NOW);
  const id2 = Object.keys(rec2.rows)[0];
  const noRan = applyRows(rec2, Object.assign({}, file, { full: true, scope: ["X"], findings: [] }), NOW);
  expect("a full run from an owner that reports its rules, sent without them, closes nothing and says why",
    [!!rec2.rows[id2].done, noRan.closed, /must say which checks ran/.test(noRan.refused || "")], [false, 0, true]);
  // An owner whose scanner does not report rules keeps closing without them.
  const rec3 = { rows: {} };
  applyRows(rec3, { owner: "figma-variable-audit", fileKey: "K", full: true, scope: ["X"],
    findings: [{ where: "X", check: "c", rule: "link", bucket: 3 }] }, NOW);
  const id3 = Object.keys(rec3.rows)[0];
  const noReport = applyRows(rec3, { owner: "figma-variable-audit", fileKey: "K", full: true, scope: ["X"], findings: [] }, NOW);
  expect("an owner that cannot report its rules is not thereby claiming they all ran, and still closes",
    [rec3.rows[id3].verified, noReport.refused], [true, undefined]);
}

// A row is found by what the finding is ABOUT before it is found by prose.
{
  const rec = { rows: {} };
  const file = { owner: "figma-components-audit", fileKey: "K", full: true, ran: RAN, scope: ["Button"] };
  // Filed before keys existed: matched by wording, and takes the key.
  applyRows(rec, Object.assign({}, file, { findings: [{ where: "Button", check: "Label: raw paddingLeft=13", rule: "tokens" }] }), NOW);
  const id = Object.keys(rec.rows)[0];
  expect("a row filed without a key has none", rec.rows[id].key, undefined);
  let out = applyRows(rec, Object.assign({}, file, { findings: [{ where: "Button", check: "Label: raw paddingLeft=13", rule: "tokens", key: "tokens|paddingLeft|/Label" }] }), NOW);
  expect("the next keyed raise matches it by wording and stamps the key", [out.added, out.updated, rec.rows[id].key], [0, 1, "tokens|paddingLeft|/Label"]);
  // Reworded past any prefix, measurement changed too: the key finds it.
  out = applyRows(rec, Object.assign({}, file, { findings: [{ where: "Button", check: "paddingLeft on Label is a raw 16, off the spacing scale", rule: "tokens", key: "tokens|paddingLeft|/Label" }] }), NOW);
  expect("a reworded check with the same key lands on the same row", [out.added, out.updated, out.closed, Object.keys(rec.rows).length], [0, 1, 0, 1]);
  expect("and the row takes the new wording", rec.rows[id].check, "paddingLeft on Label is a raw 16, off the spacing scale");
  // The same key on another component is another row.
  out = applyRows(rec, Object.assign({}, file, { scope: ["Button", "Chip"], findings: [{ where: "Chip", check: "paddingLeft on Label is a raw 16, off the spacing scale", rule: "tokens", key: "tokens|paddingLeft|/Label" }] }), NOW);
  expect("a key is scoped to its component", [out.added, out.closed], [1, 1]);
  // A dismissal names its key too.
  const rec2 = { rows: {} };
  applyRows(rec2, Object.assign({}, file, { findings: [{ where: "Button", check: "old words", rule: "tokens", key: "k1" }] }), NOW);
  out = applyRows(rec2, Object.assign({}, file, { findings: [], dismissed: [{ where: "Button", check: "new words", rule: "tokens", key: "k1", why: "ruled" }] }), NOW);
  expect("a dismissed candidate finds its row by key", [out.closed, Object.values(rec2.rows)[0].done, Object.values(rec2.rows)[0].dismissedRuns], [0, false, 1]);
}

// The two clauses the writer now refuses outright.
{
  const rec = { rows: {} };
  applyRows(rec, { owner: "figma-variable-audit", fileKey: "K", full: true, scope: ["X"],
    findings: [{ where: "X", check: "c", rule: "link", bucket: 3 }] }, NOW);
  const id = Object.keys(rec.rows)[0];
  // `full` with findings and no scope used to close EVERY open row of the
  // owner, including sets the run never read. It is refused whatever it raised.
  const out = applyRows(rec, { owner: "figma-variable-audit", fileKey: "K", full: true,
    findings: [{ where: "Y", check: "d", rule: "link", bucket: 3 }] }, NOW);
  expect("a full run with findings and no scope files them, closes nothing, and says why",
    [out.added, out.closed, !!rec.rows[id].done, /must say what it read/.test(out.refused || "")], [1, 0, false, true]);
  // A field the writer does not read is an error, not a default.
  let threw = null;
  try { applyRows(rec, { owner: "figma-variable-audit", fileKey: "K", full: true, scopes: ["X"], findings: [] }, NOW); }
  catch (e) { threw = e.message; }
  expect("a payload field the writer does not take is refused by name", /unknown payload field: scopes/.test(threw || ""), true);
  expect("and nothing was closed by it", !!rec.rows[id].done, false);
}

// A scope of blanks names nothing, and must not read as a bounded claim. One
// caller built it from the wrong field — `e.set` where the enumerate mode
// returns `e.name` — so it sent 120 `undefined`s. The array was non-empty, so
// the "say what you read" guard passed it, every entry normalised to "", and
// that stage closed nothing in its life while reporting a clean full run.
{
  const file = { owner: "figma-variable-audit", fileKey: "K" };
  const rec = { rows: {} };
  applyRows(rec, Object.assign({}, file, { full: true, scope: ["Dialog"],
    findings: [{ where: "Dialog", check: "variable \"Stroke/1\" is gone", rule: "link", bucket: 3 }] }), NOW);
  const id = Object.keys(rec.rows)[0];
  // The scanner stops raising it, but the caller sends a scope of blanks.
  const blank = applyRows(rec, Object.assign({}, file, { full: true, scope: [undefined, undefined], findings: [] }), NOW);
  expect("a scope of blanks closes nothing and is refused, not treated as bounded",
    [blank.closed, !!blank.refused, !!rec.rows[id].done], [0, true, false]);
  // Named properly, the row closes.
  const ok = applyRows(rec, Object.assign({}, file, { full: true, scope: ["Dialog"], findings: [] }), NOW);
  expect("and a scope that names what it read does close it", [ok.closed, rec.rows[id].verified], [1, true]);
}

// A full run's reason rides on every row it closes; a row with a key is never
// matched by wording to a finding that carries another key.
{
  const rec = { rows: {} };
  const own = { owner: "figma-snapshot-router", fileKey: "K" };
  applyRows(rec, Object.assign({}, own, { findings: [{ where: "Chip", check: "Breaking for Figma files: its size changed", key: "day1" }] }), NOW);
  const id = Object.keys(rec.rows)[0];
  rec.rows[id].done = true;
  const two = applyRows(rec, Object.assign({}, own, { findings: [{ where: "Chip", check: "Breaking for Figma files: its size changed", key: "day2" }] }), NOW);
  expect("the same words under another key are another row, and the decided one stays decided",
    [two.added, two.reopened, rec.rows[id].done, rec.rows[id].key], [1, 0, true, "day1"]);
  const shut = applyRows(rec, Object.assign({}, own, { full: true, scope: ["Chip"], findings: [], why: "Regraded: a rename, not a removal." }), NOW);
  const other = Object.keys(rec.rows).find((k) => k !== id);
  // The router has no full run of a file: what it reads is the change log's
  // stored grades, and its closures say that (review of 2 October 2026,
  // round 2, R13: "a full run no longer raises this" claimed one).
  expect("a full run's why is said on the row it closes, and the router's close says what it read",
    [shut.closed, rec.rows[other].verifyNote], [1, "Cleared by figma-snapshot-router on 2026-09-11 — the change log's stored grade no longer raises this. Regraded: a rename, not a removal."]);
  // The router's upkeep (round 3, S4) goes through the writer as `rekey` and
  // `close`: a row under an old key takes the new one and keeps its decision; a
  // row no grade raises closes saying so; both are no-ops the second time, and
  // `close` is refused for an owner with a full run (review round 4 pinned them).
  const up = applyRows(rec, Object.assign({}, own, { findings: [], rekey: [["day1", "breaking-change|size-changed|d|Chip|its size changed"]], close: [{ key: "breaking-change|size-changed|d|Chip|its size changed", why: "graded after the fact, not filed" }] }), NOW);
  expect("upkeep re-keys a decided row in place and closes a row by its new key, saying why",
    [up.rekeyed, up.closed, rec.rows[id].key, rec.rows[id].done, /graded after the fact/.test(rec.rows[id].verifyNote)], [1, 1, "breaking-change|size-changed|d|Chip|its size changed", true, true]);
  const again = applyRows(rec, Object.assign({}, own, { findings: [], rekey: [["day1", "x"]], close: [{ key: "breaking-change|size-changed|d|Chip|its size changed", why: "graded after the fact, not filed" }] }), NOW);
  expect("…and the second time changes nothing", [again.rekeyed || 0, again.closed || 0], [0, 0]);
  let refused = null;
  try { applyRows({ rows: {} }, { owner: "figma-foundations-audit", fileKey: "K", findings: [], close: [{ key: "k", why: "w" }] }, NOW); } catch (e) { refused = e.message; }
  expect("close is refused for an owner that closes by a full run", /close.*is for an owner with no full run/.test(refused || ""), true);
}

// raised again exactly as it stands, a later day: the row keeps its time; one whose wording moved takes the new time
{
  const rec2 = { rows: {}, libraries: { K: { name: "Lib", metrics: {} } } };
  const f = { where: "Chip", check: "Value is a variant here", rule: "consistency-form", fix: ["One form."], rec: ["Rule it."] };
  applyRows(rec2, { owner: "figma-components-audit", target: "consistency", fileKey: "K", full: true, ran: ["consistency-form"], findings: [f] }, NOW);
  const id = Object.keys(rec2.rows)[0];
  applyRows(rec2, { owner: "figma-components-audit", target: "consistency", fileKey: "K", full: true, ran: ["consistency-form"], findings: [f] }, "2026-09-12T10:00:00.000Z");
  expect("a row raised again unchanged keeps its updatedAt (a restart re-files without moving the record)", rec2.rows[id].updatedAt, NOW);
  applyRows(rec2, { owner: "figma-components-audit", target: "consistency", fileKey: "K", full: true, ran: ["consistency-form"], findings: [{ ...f, fix: ["One form, said better."] }] }, "2026-09-13T10:00:00.000Z");
  expect("…and one whose account changed takes the run's time", rec2.rows[id].updatedAt, "2026-09-13T10:00:00.000Z");
}

console.log((failed ? "FAIL" : "pass") + " — " + passed + " of " + (passed + failed) + " assertions");
process.exit(failed ? 1 : 0);
