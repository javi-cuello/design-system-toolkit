// Runs links.js's checkFacts over fixture facts in two batches, as a batched scan returns them,
// feeds the results to scripts/report.mjs, and asserts the rendered counts and table.
// Run: node tests/test-report.mjs   (exits non-zero on failure)
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { render } from "../scripts/report.mjs";

const src = readFileSync(fileURLToPath(new URL("../scripts/links.js", import.meta.url)), "utf8");
const Async = Object.getPrototypeOf(async function () {}).constructor;
const checkFacts = await new Async("MODE", src)("scan");
const scan = (sets, keys) => Object.assign(checkFacts({ sets }, keys), { fileKey: "F", fileName: "Components", publishedSeen: 0 });

const KEYS = { variables: [{ key: "k-bg", name: "Color/Background/default" }, { key: "k-sp", name: "Spacing/2" }],
               styles: [{ key: "s-body", name: "Body/md" }] };
const ref = (kind, id, prop, path, variant, o) => Object.assign({ kind, id, prop, path, variant, resolved: true, remote: true }, o);
// Batch 1: Card has a removed variable on two layers; Button is clean and shares k-bg with batch 2.
const b1 = scan([
  { name: "Card", id: "0:2", page: "❖ Card", variants: 2, refs: [
    ref("variable", "V:9", "fills", "Header", "Rest", { key: "k-gone", name: "Color/Brand/soft" }),
    ref("variable", "V:9", "fills", "Footer", "Rest", { key: "k-gone", name: "Color/Brand/soft" }),
    ref("variable", "V:1", "fills", "Body", "Rest", { key: "k-bg", name: "Color/Background/default" })] },
  { name: "Button", id: "0:1", page: "❖ Button", refs: [
    ref("variable", "V:1", "fills", "$root", "Rest", { key: "k-bg", name: "Color/Background/default" })] },
], KEYS);
// Batch 2: Alert carries a superseded key and a dangling style, both errors, and reuses k-bg.
const b2 = scan([
  { name: "Alert", id: "0:3", page: "❖ Alert", refs: [
    ref("variable", "V:1", "fills", "$root", null, { key: "k-bg", name: "Color/Background/default" }),
    ref("variable", "V:7", "itemSpacing", "$root", null, { key: "k-old", name: "Spacing/2" }),
    { kind: "style", styleType: "TEXT", id: "S:404", prop: "textStyleId", path: "Title", variant: null, resolved: false }] },
], KEYS);

const out = render([b1, b2]);
const lines = out.split("\n");
let n = 0, failed = 0;
const ok = (name, fn) => {
  try { fn(); n++; console.log(`ok   ${name}`); }
  catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message.split("\n")[0]}`); }
};
ok("the counts sum across batches, and distinct tokens are a union, never a sum", () =>
  assert.equal(lines[0], "`Components`: 3 components scanned, 6 variable bindings and 1 style reference (3 distinct variables, 1 distinct style). 3 broken links: 2 errors, 1 to review."));
ok("what was not checked is said once, however many batches said it", () =>
  assert.equal(lines.filter((l) => l.startsWith("Not checked: published-visibility (variables)")).length, 1));
ok("one row per finding, sorted by page and component, errors before reviews", () => {
  const rows = lines.filter((l) => l.startsWith("| `❖"));
  assert.equal(rows.length, 3);
  assert.equal(rows[0], "| `❖ Alert › Alert` | error | text style S:404 no longer resolves at all | `Title` — textStyleId | The style was deleted outright. Rebind the layer, or remove the binding. |");
  assert.match(rows[1], /^\| `❖ Alert › Alert` \| error \| variable "Spacing\/2" is published under a different key \| the component frame — itemSpacing \|/);
  assert.match(rows[2], /^\| `❖ Card › Card` \| review \| variable "Color\/Brand\/soft" is not in the source library \| `Header` — fills · Rest<br>`Footer` — fills · Rest \| It may belong to another library/);
});
ok("batch order does not change the bytes", () => assert.equal(render([b2, b1]), out));
ok("a clean scan says so instead of an empty table", () => assert.match(render([scan([], KEYS)]), /\nNo broken links\.\n/));
ok("batches from two files are refused", () =>
  assert.throws(() => render([b1, Object.assign({}, b2, { fileName: "Other" })]), /different files/));
ok("a pipe in a name cannot break the table", () => {
  const p = scan([{ name: "A|B", id: "0:9", page: "p", refs: [ref("variable", "V:8", "fills", "x", null, { key: "k-x", name: "X|Y" })] }], KEYS);
  const row = render([p]).split("\n").find((l) => l.startsWith("| `p"));
  assert.equal(row.split(/(?<!\\)\|/).length, 7);
});
ok("a narrowed scope filters the rows before anything is counted, and says how many it left out", () => {
  const ls = render([b1, b2], { scope: ["fills"] }).split("\n");
  assert.match(ls[0], / 1 broken link: 0 errors, 1 to review\.$/);
  assert.ok(ls.includes("Outside the scope (fills): 2 findings left out."));
  assert.equal(ls.filter((l) => l.startsWith("| `❖")).length, 1);
});
ok("the scope reads every property a token is bound to, past the eight layers a row names", () => {
  const refs = Array.from({ length: 9 }, (_, i) => ref("variable", "V:5", "topLeftRadius", "Corner " + i, null, { key: "k-r", name: "Radius/gone" }))
    .concat([ref("variable", "V:5", "paddingLeft", "Inset", null, { key: "k-r", name: "Radius/gone" })]);
  const ls = render([scan([{ name: "Tile", id: "0:7", page: "❖ Tile", refs }], KEYS)], { scope: ["paddingLeft"] }).split("\n");
  assert.ok(ls.includes("Outside the scope (paddingLeft): 0 findings left out."), "the paddingLeft binding past layer 8 keeps the finding in scope");
  assert.equal(ls.filter((l) => l.startsWith("| `❖")).length, 1);
});
ok("a batch passed twice is counted once", () => assert.equal(render([b1, b2, b1]), out));
ok("two different batches that both audited one component are refused", () => {
  const again = scan([{ name: "Card", id: "0:2", page: "❖ Card", refs: [
    ref("variable", "V:9", "fills", "Header", "Rest", { key: "k-gone", name: "Color/Brand/soft" })] }], KEYS);
  assert.throws(() => render([b1, again]), /Card \(0:2\) is in two batches/);
});
ok("layer paths and the component are code spans, so <slot> or _private_ survive markdown", () => {
  const p = scan([{ name: "_Item_", id: "0:8", page: "p", refs: [ref("variable", "V:8", "fills", "<slot> › _private_", null, { key: "k-x", name: "X" })] }], KEYS);
  const row = render([p]).split("\n").find((l) => l.startsWith("| `p"));
  assert.match(row, /^\| `p › _Item_` \| review \| .* \| `<slot> › _private_` — fills \|/);
});
ok("--keys: batches handed the whole keys answer render as without it", () => assert.equal(render([b1, b2], { keys: KEYS }), out));
ok("--keys: a batch handed a trimmed set is refused, naming both counts", () => {
  const trimmed = scan([{ name: "Tag", id: "0:9", page: "❖ Tag", refs: [] }], { variables: KEYS.variables.slice(0, 1), styles: KEYS.styles });
  assert.throws(() => render([b1, trimmed], { keys: KEYS }), /batch 2 was handed 1 variables and 1 styles; the source's keys hold 2 and 1/);
});
ok("--keys: a batch from before keysRead is refused, never trusted", () => {
  const old = Object.assign({}, b1); delete old.keysRead;
  assert.throws(() => render([old], { keys: KEYS }), /carries no keysRead/);
});
console.log(`${n} passed` + (failed ? `, ${failed} failed` : ""));
if (failed) process.exit(1);

// Run through a symlink, as ~/.claude/skills runs it: the main-module guard read argv[1] unresolved and printed nothing
{
  const { mkdtempSync, symlinkSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { spawnSync } = await import("node:child_process");
  const dir = mkdtempSync(tmpdir() + "/figma-variable-audit-");
  symlinkSync(fileURLToPath(new URL("..", import.meta.url)), dir + "/skill");
  const r = spawnSync(process.execPath, [dir + "/skill/scripts/report.mjs"], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  assert.match(r.stderr + r.stdout, /usage/, "a run through the skills symlink answers");
  console.log("ok a run through the skills symlink answers");
}
