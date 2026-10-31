#!/usr/bin/env node
// The score model (score-model.mjs) over the skill's real scanner/scoring.json
// and checks.json, and the score report (scores.mjs) over the fix queue's
// fixture record, compared whole with its golden file.
//   node tools/figma-audit/test-scores.mjs
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeScores } from "./score-model.mjs";
import { renderScores, abbreviations } from "./scores.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SCANNER = join(HERE, "..", "..", "skills", "figma-components-audit", "scanner");
const scoring = JSON.parse(readFileSync(join(SCANNER, "scoring.json"), "utf8"));
const catalogue = JSON.parse(readFileSync(join(SCANNER, "checks.json"), "utf8"));
let n = 0;
const ok = (name, cond, why = "") => { n++; assert.ok(cond, name + (why ? "\n" + why : "")); console.log("ok", name); };

// ---- the model (moved from tools/docs-site/test-dashboard-logic.mjs with the function) ----
const sets = [{ set: "Button" }, { set: "Card" }, { set: "Chip" }];
const rows = {
  a: { where: "Button — properties panel", rule: "tokens", sev: "error" },
  b: { where: "Button", rule: "tokens", sev: "warn" },
  c: { where: "Card", rule: "properties", sev: "warn" },        // the gate's rule: capped
  d: { where: "Chip", rule: "tokens", sev: "error", verified: true },   // settled: costs nothing
  e: { where: "Chip", rule: "nobody-scores-this", sev: "error" },
};
const every = computeScores(sets, rows, scoring, null, "T");
const by = Object.fromEntries(every.rows.map((r) => [r.name, r]));
const tokensW = scoring.dimensions.Tokens.weight / Object.values(scoring.dimensions).reduce((s, d) => s + d.weight, 0);
ok("a component loses its open findings' penalties in their dimension, by its name before any panel",
  by.Button.d.Tokens === Math.round((1 - scoring.penalties.error - scoring.penalties.warn) * 100) && by.Button.score === Math.round(100 - tokensW * (scoring.penalties.error + scoring.penalties.warn) * 100), JSON.stringify(by.Button));
ok("a finding under the gate's rule caps the score and says why", by.Card.score === scoring.gate.cap && by.Card.notes.includes(scoring.gate.reason));
ok("a settled row and a rule no dimension scores cost nothing", by.Chip.score === 100);
ok("the median is of every component scored", every.median === by.Button.score && every.rows.length === 3);
const onlyTokens = { dimensions: [{ dimension: "Tokens", checks: [{ status: "scanner" }] }, { dimension: "Metadata", checks: [{ status: "backlog" }] }] };
const partial = computeScores([{ set: "Button" }], rows, scoring, onlyTokens).rows[0];
ok("a dimension no running check feeds is excluded, never scored 100, and the score says it is partial",
  Object.keys(partial.d).join() === "Tokens" && partial.score === partial.d.Tokens && partial.notes.some((t) => /^partial — /.test(t) && t.includes("Metadata")), JSON.stringify(partial));
ok("no scoring model, no scores", computeScores(sets, rows, null, null) === null && computeScores(sets, rows, {}, null) === null);
ok("no components, no median", computeScores([], rows, scoring, null).median === null);
ok("the same input gives the same scores", JSON.stringify(computeScores(sets, rows, scoring, catalogue, "T")) === JSON.stringify(computeScores(sets, rows, scoring, catalogue, "T")));

// ---- the report, over the fix queue's fixture record ----
const record = () => {
  const r = JSON.parse(readFileSync(join(HERE, "fixtures", "queue-record.json"), "utf8"));
  r.fingerprints = { LIBKEY: { sets: Object.fromEntries(["Avatar", "Badge", "Button", "Card", "Switch", "Tabs", "Text input", "Tooltip"].map((s) => [s, "h"])) } };
  return r;
};
const first = renderScores(record(), scoring, catalogue, { at: "2026-10-31T00:00:00.000Z" });
ok("the report equals its golden file", first.markdown === readFileSync(join(HERE, "fixtures", "scores-report.md"), "utf8"), first.markdown);
ok("column headings come from the model's names, never a list of its own", JSON.stringify(abbreviations(Object.keys(scoring.dimensions))) === JSON.stringify({ Tokens: "T", Properties: "P", States: "S", Structure: "St", Metadata: "M", Accessibility: "A" }));
const order = first.doc.rows.slice().sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, "en")).map((r) => r.name);
ok("worst first: rows read in score order", first.markdown.split("\n").filter((l) => /^\| \d/.test(l)).map((l) => l.match(/`([^`]+)`/)[1]).join() === order.join() && order[0] === "Badge");
ok("a settled row costs nothing on the report either", /\| 100 \|[^\n]*`Switch`/.test(first.markdown));
ok("a first report says it states no delta, and every gap is named", first.gaps.some((g) => /no earlier scores/.test(g)) && first.gaps.some((g) => /no node id for 8/.test(g)));

const again = record();
again.scores = { LIBKEY: { at: "2026-10-01T00:00:00.000Z", median: 100, rows: [{ name: "Badge", score: 100, d: { Tokens: 100 } }] } };
const second = renderScores(again, scoring, catalogue, { sets: [{ set: "Badge", id: "2:1" }, "Button"] });
ok("a re-run states the delta per dimension and in the total", /\| 94 \(−6\) \| 75 \(−25\) \| 100 \|/.test(second.markdown) && /\*\*Median:\*\* \d+ \(−\d+\)/.test(second.markdown), second.markdown);
ok("a set with an id is deep-linked into the file; one without is not", second.markdown.includes("[`Badge`](https://www.figma.com/design/LIBKEY/Library?node-id=2-1)") && second.markdown.includes("| `Button` |"));
assert.throws(() => renderScores({ libraries: { LIBKEY: {} }, rows: {} }, scoring, catalogue), /no fingerprints/);
ok("no fingerprints and no --sets is refused, never an empty table", true);

// ---- the CLI ----
const dir = mkdtempSync(join(tmpdir(), "scores-"));
try {
  const rec = join(dir, "LIBKEY.json");
  writeFileSync(rec, JSON.stringify(record()));
  const md = execFileSync("node", [join(HERE, "scores.mjs"), "--data", rec], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  ok("the CLI prints the rows the function computes", md.replace(/^<!--.*\n/, "") === first.markdown.replace(/^<!--.*\n/, ""));
  const doc = JSON.parse(execFileSync("node", [join(HERE, "scores.mjs"), "--data", rec, "--json"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  ok("--json prints the scores document the record keeps", doc.model && doc.median === first.doc.median && doc.rows.length === 8);
} finally { rmSync(dir, { recursive: true, force: true }); }

console.log(n + " passed");
