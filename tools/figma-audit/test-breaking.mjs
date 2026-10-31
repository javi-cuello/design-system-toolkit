#!/usr/bin/env node
// node tools/figma-audit/test-breaking.mjs — breaking changes from the
// change log become audit findings once, through the one row writer.
import assert from "node:assert/strict";
import { breakingFindings, filedKeys, unmatched, upkeep, keyOf, libOfFor, OWNER } from "./breaking.mjs";
import { applyRows } from "./rows.mjs";

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log("ok", name); };

const change = (rule, figma, code, subject = "button", what = rule) => ({ level: figma === "major" || code === "major" ? "major" : "minor", figma, code, rule, subject, what });
const log = [
  { at: "2026-10-01T10:00:00.000Z", file: "KEY1", grade: { level: "BREAKING", changes: [
    change("prop-removed", "major", "major", "button", "a property removed — Label"),
    change("option-renamed", "patch", "major", "button", "a variant option renamed — Size: md → medium"),
    change("token-removed", "major", "major", "tokens", "variables removed — Semantic: 1 — fg"),
    change("layer-added", "minor", "patch"),
  ] } },
  { at: "2026-09-01T10:00:00.000Z", file: "KEY1", via: "backfill", grade: { level: "BREAKING", changes: [change("component-removed", "major", "major")] } },
  { at: "2026-10-01T11:00:00.000Z", file: "ICONS", grade: { level: "BREAKING", changes: [change("component-removed", "major", "major", "arrow")] } },
  { at: "2026-08-01T10:00:00.000Z", file: "KEY1", tokens: {}, components: {} },
];
const libOf = (f) => (f === "KEY1" ? "KEY1" : null);
const nameOf = (f) => ({ button: "Button" }[f] || f);

const got = breakingFindings(log, { libOf, nameOf });
const f = got.get("KEY1") || [];
ok("only major changes are filed: three of four", f.length === 3);
ok("a minor change is not a row", !f.some((x) => /layer-added/.test(x.key)));
ok("history rebuilt from git is not filed", !f.some((x) => /component-removed/.test(x.key)));
// 2026-10-11: the question read "Snapshot of … (component-removed): breaking for
// Figma files and code." and said nothing of what changed.
const prop = f.find((x) => /prop-removed/.test(x.key));
ok("a breaking row's question says what changed, then who it breaks and when",
  prop.fix[0] === "A property removed — Label." && prop.fix[1] === "Breaking for Figma files and code, in the snapshot of 2026-10-01.");
ok("a file with no audit record files nothing", !got.has(null) && got.size === 1);
ok("an entry from before grades were stored files nothing", f.every((x) => x.key.includes("2026-10-01")));
ok("the component is named as a designer reads it, tokens as Tokens", f[0].where === "Button" && f[2].where === "Tokens");
ok("each says for whom it breaks", /^Breaking for Figma files and code:/.test(f[0].check) && /^Breaking for code:/.test(f[1].check));
ok("losing work in a Figma file is an error; a code break a warning", f[0].sev === "error" && f[1].sev === "warn");
ok("every one is a decision", f.every((x) => x.bucket === 3 && x.rec.length === 2));

// Filed through the one writer, and never twice.
const record = { rows: {}, libraries: {}, runs: {} };
let r = applyRows(record, { owner: OWNER, fileKey: "KEY1", findings: f });
ok("the writer files them under the router's name", r.added === 3 && Object.values(record.rows).every((x) => x.owner === OWNER));
for (const row of Object.values(record.rows)) { row.done = true; row.note = "intended, in the 1 October release note"; }
const again = breakingFindings(log, { libOf, nameOf, filed: filedKeys(record) });
ok("a change already filed is not filed again, so a decided row stays decided", !again.has("KEY1"));
r = applyRows(record, { owner: OWNER, fileKey: "KEY1", findings: [] });
ok("a later log write closes nothing", r.closed === 0 && Object.values(record.rows).every((x) => x.done));

// Day 1, day 2, day 3 — the sequence the review of 2 October 2026 simulated.
// A size change is worded the same every day. Day 1 is filed and decided;
// day 2 resizes the same component again; day 3 is a service start that reads
// the whole log. Each change is its own row, and the decided one is never
// reopened, on that start or any after it.
{
  const size = (at) => ({ at, file: "KEY1", grade: { level: "BREAKING", changes: [change("size-changed", "major", "minor", "chip", "its size changed")] } });
  const rec = { rows: {}, libraries: {}, runs: {} };
  const run = (log) => {
    const out = breakingFindings(log, { libOf, nameOf, filed: filedKeys(rec) }).get("KEY1") || [];
    return applyRows(rec, { owner: OWNER, fileKey: "KEY1", findings: out });
  };
  const day1 = [size("2026-10-01T09:00:00.000Z")], day2 = day1.concat(size("2026-10-02T09:00:00.000Z"));
  run(day1);
  const first = Object.keys(rec.rows)[0];
  rec.rows[first].done = true; rec.rows[first].note = "intended";
  const key1 = rec.rows[first].key;
  const d2 = run(day2);
  ok("day 2: the second resize is a row of its own, and day 1's decision stands", d2.added === 1 && d2.reopened === 0 && rec.rows[first].done && rec.rows[first].key === key1);
  const second = Object.keys(rec.rows).find((k) => k !== first);
  let still = true;
  for (let start = 0; start < 3; start++) { const d3 = run(day2); still = still && d3.added === 0 && d3.reopened === 0 && d3.updated === 0; }
  ok("day 3 and every start after: nothing filed, nothing reopened, no key flips", still && rec.rows[first].done && rec.rows[first].key === key1 && rec.rows[second].key !== key1);
}

// An entry the backfill graded after the fact carries the revisions it was
// graded across, and is history: it files nothing.
{
  const retro = [{ at: "2026-10-01T12:00:00.000Z", file: "KEY1", grade: { level: "BREAKING", from: "abc123", to: "def456", changes: [change("layer-removed", "major", "minor")] } }];
  ok("a live entry graded after the fact by the backfill is not filed", !breakingFindings(retro, { libOf, nameOf }).has("KEY1"));
}


// The rows match the grades. A row the router closed as no longer raised
// while the stored grade still raises it is the state the review of
// 2 October 2026 found (round 2, R3): the record said "a rename", the change
// log still said five layers removed, and the docs page showed the major.
{
  const entry = (changes, extra = {}) => ({ at: "2026-10-01T13:00:00.000Z", file: "KEY1", grade: { level: "BREAKING", changes, ...extra } });
  const removed = change("layer-removed", "major", "minor", "section", "a layer removed — Item");
  const sized = change("size-changed", "major", "minor", "section", "its size changed");
  const rec = { rows: {}, libraries: {}, runs: {} };
  applyRows(rec, { owner: OWNER, fileKey: "KEY1", findings: breakingFindings([entry([removed, sized])], { libOf }).get("KEY1") });
  const recs = new Map([["KEY1", rec]]);
  ok("filed from the grade, the rows match it", unmatched([entry([removed, sized])], recs, { libOf }).length === 0);
  const id = Object.keys(rec.rows).find((k) => rec.rows[k].key.includes("layer-removed"));
  rec.rows[id] = { ...rec.rows[id], done: true, verified: true, verifyNote: "Cleared by figma-snapshot-router on 2026-10-02 — the change log's grade no longer raises this." };
  const bad = unmatched([entry([removed, sized])], recs, { libOf });
  ok("a row closed as no longer raised, while the stored grade raises it, is a mismatch", bad.length === 1 && /still raises/.test(bad[0]));
  ok("…and regraded, so the grade no longer raises it, it matches", unmatched([entry([sized])], recs, { libOf }).length === 0);
  ok("an open row no grade raises is a mismatch", unmatched([entry([removed])], recs, { libOf }).some((m) => /open/.test(m)));
  ok("a major no row was filed for is a mismatch", unmatched([entry([sized, change("prop-removed", "major", "major", "section", "a property removed — X")])], recs, { libOf }).some((m) => /not filed/.test(m)));
  ok("a regraded router entry is still filed", breakingFindings([entry([sized], { regraded: { on: "2026-10-02", from: "a", to: "b" } })], { libOf }).has("KEY1"));
  const owner = (n) => ({ ...rec.rows[id], owner: "figma-components-audit", key: "x" + n });
  rec.rows.other = owner(1);
  ok("another owner's rows are not the router's to match", unmatched([entry([sized])], recs, { libOf }).length === 0);
}

// Round 3 of the review of 2 October 2026 (S4). A key is what the change is
// about, never the list its wording carries: a regrade that shortened
// "— Content, Button, Label" to "— Content" re-keyed the change and filed it
// again as a new row.
{
  const at = "2026-10-01T09:00:00.000Z";
  const long = { at, file: "KEY1", grade: { level: "BREAKING", changes: [change("layer-removed", "major", "minor", "bar", "a layer removed — Content, Button, Label")] } };
  const short = { at, file: "KEY1", grade: { level: "BREAKING", changes: [change("layer-removed", "major", "minor", "bar", "a layer removed — Content")] } };
  const rec = { rows: {}, libraries: {}, runs: {} };
  applyRows(rec, { owner: OWNER, fileKey: "KEY1", findings: breakingFindings([long], { libOf }).get("KEY1") });
  const again = breakingFindings([short], { libOf, filed: filedKeys(rec) });
  ok("a regrade that shortens a change's list does not file it again", !again.has("KEY1"));
  const props = breakingFindings([{ at, file: "KEY1", grade: { changes: [change("prop-removed", "major", "major", "bar", "a property removed — A"), change("prop-removed", "major", "major", "bar", "a property removed — B")] } }], { libOf }).get("KEY1");
  ok("…while two properties removed from one component are still two rows", props.length === 2 && props[0].key !== props[1].key);
  const tok = (list) => keyOf(at, change("token-removed", "major", "major", "tokens", `variables removed — Semantic: ${list}`));
  ok("a token change is keyed by its collection, not the names it lists", tok("3 — a, b, c") === tok("1 — a"));
}

// Closed rows are matched against every stored grade, and a closure says why
// in its own words: three of six closed router rows said the stored grade no
// longer raised them, while a grade made after the fact still did.
{
  const at = "2026-10-01T09:49:26.475Z";
  const removed = change("layer-removed", "major", "minor", "action-bar", "a layer removed — Content, Button, Label, Icon");
  const live = { at, file: "KEY1", grade: { level: "BREAKING", changes: [removed] } };
  const rec = { rows: {}, libraries: {}, runs: {} };
  applyRows(rec, { owner: OWNER, fileKey: "KEY1", findings: breakingFindings([live], { libOf }).get("KEY1") });
  // as the record held it: an old key, closed by hand as "no longer raised"
  const [id] = Object.keys(rec.rows);
  rec.rows[id] = { ...rec.rows[id], key: ["breaking", removed.rule, at, removed.subject, removed.what].join("|"), done: true, verified: true,
    verifyNote: "Cleared by figma-snapshot-router on 2026-10-02 — the change log's stored grade no longer raises this." };
  const retro = { at, file: "KEY1", grade: { level: "BREAKING", from: "aaa1111", to: "bbb2222", changes: [change("layer-removed", "major", "minor", "action-bar", "a layer removed — Content")] } };
  const recs = new Map([["KEY1", rec]]);
  const before = unmatched([retro], recs, { libOf });
  ok("a closure saying no grade raises it, while one made after the fact does, is a mismatch", before.some((m) => /still raises/.test(m)));
  const u = upkeep([retro], rec, { libOf, lib: "KEY1" });
  ok("the upkeep re-keys the old key to its present form", u.rekey.length === 1 && u.rekey[0][1] === keyOf(at, retro.grade.changes[0]));
  const out = applyRows(rec, { owner: OWNER, fileKey: "KEY1", rekey: u.rekey, close: u.close });
  ok("…through the writer, which re-keys and re-closes without filing anything new", out.rekeyed === 1 && out.closed === 1 && out.added === 0 && Object.keys(rec.rows).length === 1);
  ok("the closure says the change was graded after the fact, across which revisions", /graded after the fact .*aaa1111\.\.bbb2222/.test(rec.rows[id].verifyNote));
  ok("…and the rows now match every stored grade", unmatched([retro], recs, { libOf }).length === 0);
  const twice = upkeep([retro], rec, { libOf, lib: "KEY1" });
  ok("a second upkeep has nothing to do", twice.rekey.length === 0 && twice.close.length === 0);
  ok("a row a person decided is not the router's to reword", upkeep([retro], { rows: { x: { owner: OWNER, key: keyOf(at, removed), done: true, verifyNote: "intended" } } }, { libOf, lib: "KEY1" }).close.length === 0);
  let threw = false;
  try { applyRows({ rows: {} }, { owner: "figma-components-audit", close: [{ key: "k", why: "w" }] }); } catch { threw = true; }
  ok("only an owner with no full run closes by key", threw);
}

// The library a file's majors are filed into: its record, by either id.
{
  const lo = libOfFor([{ key: "KEY1", id: "doc1" }, { key: "ICONS", id: "doc2" }], [{ key: "KEY1" }]);
  ok("a file is its library's record, by key or document id", lo("KEY1") === "KEY1" && lo("doc1") === "KEY1");
  ok("a file with no record files nowhere", lo("doc2") === null && lo("ICONS") === null);
}

// Every project's records against its own change log: the invariant on real data.
{
  const { createRequire } = await import("node:module");
  const { readFileSync, existsSync } = await import("node:fs");
  const contract = createRequire(import.meta.url)("../snapshot/projects.cjs");
  const problems = [];
  let read = 0, compared = 0;
  const noLog = [];
  // no project at all (a fresh clone, CI): nothing to compare, said as a skip, never a pass
  if (!contract.projects().list.length) console.log("skip: no project is registered, so no filed rows were compared with stored grades");
  else for (const p of contract.projects().list) {
    const where = contract.layout(null, p.name);
    // a layout that does not resolve is a failure; a project with no change log yet is said, and not counted
    if (!where || where.error || !where.paths) { problems.push(`${p.name}: its layout does not resolve${where && where.error ? ` (${where.error})` : ""}`); continue; }
    if (!existsSync(where.paths.changes)) { noLog.push(p.name); continue; }
    const records = new Map();
    for (const r of contract.auditRecords(where)) if (existsSync(r.path)) records.set(r.key, JSON.parse(readFileSync(r.path, "utf8")));
    // A project whose records were not read compares nothing and passes:
    // the case passed for a project with no router rows (round 3, S14). So
    // each says what it compared, and one that read no record is a failure.
    if (!records.size) problems.push(`${p.name}: no audit record read, so nothing was compared`);
    const log = JSON.parse(readFileSync(where.paths.changes, "utf8"));
    const lo = libOfFor(contract.entries(where.files && where.files.library), [...records.keys()].map((key) => ({ key })));
    const rows = [...records.values()].flatMap((r) => Object.values(r.rows || {}).filter((x) => x && x.owner === OWNER)).length;
    const raised = [...breakingFindings(log, { libOf: lo }).values()].flat().length;
    console.log(`   ${p.name}: ${rows} router rows, ${raised} majors raised by live grades`);
    compared += rows + raised;
    problems.push(...unmatched(log, records, { libOf: lo }).map((m) => `${p.name}: ${m}`));
    read++;
  }
  if (contract.projects().list.length) ok(`every project's filed rows match its stored grades (${read} logs read, ${compared} rows and raised majors compared)${problems.length ? "\n  " + problems.join("\n  ") : ""}`, read > 0 && read === contract.projects().list.length - noLog.length && compared > 0 && problems.length === 0);
  if (noLog.length) console.log(`skip: no change log yet in ${noLog.join(", ")}, so its rows were not compared`);
}

// A row the router closed as no longer raised, while a live grade raises it,
// is filed again and so reopened; a row a person closed is not.
{
  const at = "2026-10-25T23:44:52.675Z";
  const lg = [{ at, file: "KEY1", grade: { level: "BREAKING", changes: [change("prop-removed", "major", "major", "drawer", "a property removed — Tabs"), change("prop-removed", "major", "major", "drawer", "a property removed — Footer")] } }];
  const rec = { rows: {}, libraries: {}, runs: {} };
  applyRows(rec, { owner: OWNER, fileKey: "KEY1", findings: breakingFindings(lg, { libOf }).get("KEY1") });
  const [goneId, decidedId] = Object.keys(rec.rows), gone = rec.rows[goneId], decided = rec.rows[decidedId];
  Object.assign(gone, { done: true, verifyNote: "Closed by figma-snapshot-router on 2026-10-25 — the change log's stored grade no longer raises this." });
  Object.assign(decided, { done: true, verifyNote: "Accepted: the drawer never shipped a footer." });
  const again = breakingFindings(lg, { libOf, filed: filedKeys(rec) }).get("KEY1") || [];
  const out = applyRows(rec, { owner: OWNER, fileKey: "KEY1", findings: again });
  ok("a row the router closed as no longer raised, while a live grade raises it, is filed again and reopened; a person's decision stands",
    again.length === 1 && out.reopened === 1 && !rec.rows[goneId].done && rec.rows[decidedId].done && unmatched(lg, new Map([["KEY1", rec]]), { libOf }).length === 0);
}

console.log(n + "/" + n + " passed");
