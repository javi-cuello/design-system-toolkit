// Runs the four read scripts against two stub files with planted differences, feeds what they
// return to scripts/report.mjs, and asserts the tables: every planted difference has a row, nothing
// else does, the output is the same bytes twice, and a side read from two files is refused.
// Run: node tests/test-report.mjs   (exits non-zero on failure)
import fs from "node:fs";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { render } from "../scripts/report.mjs";

const read = (f) => fs.readFileSync(fileURLToPath(new URL("../scripts/" + f, import.meta.url)), "utf8");
const Async = Object.getPrototypeOf(async function () {}).constructor;
const run = (f, file, pre = "") => new Async("figma", pre + "\n" + read(f))(file);

// One stub library. `fork` plants the differences a fork carries.
const fileOf = (fork = false) => {
  const cell = (name, maxWidth) => ({ type: "FRAME", name, children: [], layoutSizingHorizontal: "FILL", layoutSizingVertical: "HUG",
    width: fork ? 999 : 100, height: 20, maxWidth, minWidth: 0, layoutMode: "HORIZONTAL", paddingTop: 4, paddingRight: 4, paddingBottom: 4, paddingLeft: 4, itemSpacing: 8 });
  const row = { type: "COMPONENT", name: "Row - Effects", description: "", children: [cell("Cell", fork ? 160 : 120), cell("Cell", 120)],
    layoutSizingHorizontal: "FIXED", layoutSizingVertical: "HUG", width: 600, height: 40 };
  const tag = { type: "COMPONENT", name: "Tag", description: "", children: [] };
  const page = (name, id, kids) => {
    const p = { type: "PAGE", name, id, children: kids, findAllWithCriteria: () => kids };
    kids.forEach((k) => { k.parent = p; k.children.forEach((c) => { c.parent = k; }); });
    return p;
  };
  const pages = [page("Cover", "0:1", []), page("❖ Table", "0:2", [row])];
  if (fork) pages.push(page("❖ Tag", "0:3", [tag]));
  pages.forEach((p) => { p.parent = { type: "DOCUMENT" }; });
  const vars = [
    { id: "V:1", name: "Space/2", resolvedType: "FLOAT", variableCollectionId: "C:1", scopes: ["GAP"], valuesByMode: { m1: fork ? 12 : 8 } },
    { id: "V:2", name: "Space/4", resolvedType: "FLOAT", variableCollectionId: "C:1", scopes: ["GAP"], valuesByMode: { m1: 16 } },
  ];
  if (fork) vars.push({ id: "V:3", name: "Space/6", resolvedType: "FLOAT", variableCollectionId: "C:1", scopes: ["GAP"], valuesByMode: { m1: 24 } });
  const cols = [{ id: "C:1", name: "Space", modes: [{ modeId: "m1", name: "Default" }], variableIds: vars.map((v) => v.id) }];
  const text = [{ name: "Body/md", fontName: { family: "Inter", style: "Regular" }, fontSize: fork ? 15 : 14, lineHeight: {}, letterSpacing: {} }];
  return {
    mixed: Symbol("mixed"), root: { name: fork ? "Library (fork)" : "Library", children: pages }, loadAllPagesAsync: async () => {},
    variables: { getLocalVariablesAsync: async () => vars, getLocalVariableCollectionsAsync: async () => cols },
    getLocalPaintStylesAsync: async () => [], getLocalTextStylesAsync: async () => text,
    getLocalEffectStylesAsync: async () => [], getLocalGridStylesAsync: async () => [],
  };
};

const sideOf = async (file) => ({
  inventory: await run("inventory.js", file),
  manifest: await run("manifest.js", file, "const VARS = ['Space/Space/2'];"),
  serialise: await run("serialise.js", file),
  dumps: [await run("dump-node.js", file)],
});
const ref = await sideOf(fileOf()), tgt = await sideOf(fileOf(true));
const out = render(ref, tgt);
const lines = out.split("\n");
const rowOf = (start) => lines.filter((l) => l.startsWith("| " + start));

let n = 0, failed = 0;
const ok = (name, fn) => {
  try { fn(); n++; console.log(`ok   ${name}`); }
  catch (e) { failed++; console.log(`FAIL ${name}\n     ${e.message.split("\n")[0]}`); }
};
ok("the header names both files", () => assert.equal(lines[0], "Reference: `Library` · Target: `Library (fork)`"));
ok("summary counts pages, variables, styles, components and nodes, with the direction", () => {
  assert.deepEqual(rowOf("Pages"), ["| Pages | 2 | 3 | target +1 |"]);
  assert.deepEqual(rowOf("Variables"), ["| Variables | 2 | 3 | target +1, 2 differ |"]);
  assert.deepEqual(rowOf("Text / effect"), ["| Text / effect / paint / grid styles | 1 / 0 / 0 / 0 | 1 / 0 / 0 / 0 | same, 1 differ |"]);
  assert.deepEqual(rowOf("Components |"), ["| Components | 1 | 2 | target +1 |"]);
  assert.deepEqual(rowOf("Components that differ"), ["| Components that differ | 1 | 1 | `Row - Effects` |"]);
});
ok("a page on one side only is one row, and its components are not listed again", () => {
  assert.deepEqual(rowOf("Page `"), ["| Page `❖ Tag` | absent | present, 1 component |  |"]);
  assert.equal(lines.filter((l) => l.includes("❖ Tag / Tag")).length, 0);
});
ok("a variable on one side is present/absent; a changed one names its field and both values", () => {
  assert.deepEqual(rowOf("`Space/Space/6`"), ["| `Space/Space/6` | absent | present |  |"]);
  assert.deepEqual(rowOf("`Space/Space/2` → values"), ["| `Space/Space/2` → values | `Default=8` | `Default=12` |  |"]);
});
ok("a changed style has a row", () => assert.deepEqual(rowOf("Text style"), ["| Text style `Body/md` | differs | differs |  |"]));
ok("the drilled component names the node and property, by full path, and skips FILL widths", () => {
  assert.deepEqual(rowOf("`❖ Table / Row - Effects`"), ["| `❖ Table / Row - Effects` → `Cell` | maxW 120 | maxW 160 |  |"]);
});
ok("the meaning column is left for the agent", () => assert.ok(lines.includes("| Where | Reference | Target | What it means |")));
ok("the same input renders the same bytes", () => assert.equal(render(ref, tgt), out));
ok("two equal files report no differences", () => assert.match(render(ref, ref), /No differences\./));
ok("a side whose results name two files is refused", () =>
  assert.throws(() => render({ ...ref, serialise: { ...ref.serialise, file: "Other" } }, tgt), /different files/));
ok("an undrilled differing component says to drill it", () =>
  assert.match(render({ ...ref, dumps: [] }, tgt), /not drilled: run dump-node\.js in both/));

// Hand-shaped sides, in the scripts' return shapes, for the pairing and naming cases.
const inv = (file, pages, collections = []) => ({ file, pages, collections, totalVariables: 0, styles: { text: 0, effect: 0, paint: 0, grid: 0 } });
const ser = (file, comps) => ({ file, count: comps.length, totalNodes: comps.length, comps });
ok("a same-name page with a different id is paired by name, and its components are compared", () => {
  const r = { inventory: inv("R", [{ name: "Cover", id: "0:1" }, { name: "Buttons", id: "1:2" }]), serialise: ser("R", ["Buttons / Btn = aa (1)"]) };
  const t = { inventory: inv("T", [{ name: "Cover", id: "0:1" }, { name: "Buttons", id: "5:9" }]), serialise: ser("T", ["Buttons / Btn = bb (1)"]) };
  const ls = render(r, t).split("\n");
  assert.equal(ls.filter((l) => l.startsWith("| Page `")).length, 0);
  assert.deepEqual(ls.filter((l) => l.startsWith("| Pages")), ["| Pages | 2 | 2 | same (matched by name: page ids differ) |"]);
  assert.deepEqual(ls.filter((l) => l.startsWith("| Components that differ")), ["| Components that differ | 1 | 1 | `Btn` |"]);
});
ok("the shared first page id never pairs two pages whose names each have a partner", () => {
  const r = { inventory: inv("R", [{ name: "Cover", id: "0:1" }, { name: "Buttons", id: "1:2" }]), serialise: ser("R", []) };
  const t = { inventory: inv("T", [{ name: "Buttons", id: "0:1" }, { name: "Cover", id: "3:3" }]), serialise: ser("T", []) };
  const ls = render(r, t).split("\n");
  assert.equal(ls.filter((l) => l.startsWith("| Page `")).length, 0, "no false rename, no present/absent rows");
  assert.deepEqual(ls.filter((l) => l.startsWith("| Pages")), ["| Pages | 2 | 2 | same (matched by name: page ids differ) |"]);
});
ok("a variable in a collection whose name holds a slash is folded into that collection's row", () => {
  const r = { inventory: inv("R", [], [{ name: "Brand/Core", modes: ["D"], varCount: 1 }, { name: "Brand", modes: ["D"], varCount: 1 }]),
    manifest: { file: "R", total: 2, fileHash: "1", perVar: { "Brand/Core/x": "a", "Brand/y": "b" } } };
  const t = { inventory: inv("T", [], [{ name: "Brand", modes: ["D"], varCount: 1 }]),
    manifest: { file: "T", total: 1, fileHash: "2", perVar: { "Brand/y": "c" } } };
  const ls = render(r, t).split("\n");
  assert.equal(ls.filter((l) => l.startsWith("| `Brand/Core/x`")).length, 0);
  assert.equal(ls.filter((l) => l.startsWith("| `Brand/y`")).length, 1);
});
const ordered = async (flip) => {
  const f = fileOf();
  const [v] = await f.variables.getLocalVariablesAsync();
  v.scopes = flip ? ["WIDTH_HEIGHT", "GAP"] : ["GAP", "WIDTH_HEIGHT"];
  v.codeSyntax = flip ? { iOS: "space2", WEB: "--space-2" } : { WEB: "--space-2", iOS: "space2" };
  return run("manifest.js", f, "const VARS = ['Space/Space/2'];");
};
{
  const a = await ordered(false), b = await ordered(true);
  ok("scopes and code syntax in another order hash the same, and their fields agree", () => {
    assert.equal(a.perVar["Space/Space/2"], b.perVar["Space/Space/2"]);
    assert.equal(JSON.stringify(a.bodies), JSON.stringify(b.bodies));
  });
}
ok("a dump path is a code span, so a layer named <slot> or _private_ survives markdown", () => {
  const dump = (w) => ({ file: "x", path: "P / C", rows: [{ d: 0, name: "C", type: "COMPONENT" }, { d: 1, name: "_private_", type: "FRAME", sh: "FIXED", w }] });
  const r = { serialise: ser("R", ["P / C = aa (2)"]), dumps: [{ ...dump(1), file: "R" }] };
  const t = { serialise: ser("T", ["P / C = bb (2)"]), dumps: [{ ...dump(2), file: "T" }] };
  assert.ok(render(r, t).split("\n").includes("| `P / C` → `_private_` | w 1 | w 2 |  |"));
});
console.log(`${n} passed` + (failed ? `, ${failed} failed` : ""));
if (failed) process.exit(1);

// Run through a symlink, as ~/.claude/skills runs it: the main-module guard read argv[1] unresolved and printed nothing
{
  const { mkdtempSync, symlinkSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { spawnSync } = await import("node:child_process");
  const dir = mkdtempSync(tmpdir() + "/figma-file-diff-");
  symlinkSync(fileURLToPath(new URL("..", import.meta.url)), dir + "/skill");
  const r = spawnSync(process.execPath, [dir + "/skill/scripts/report.mjs"], { encoding: "utf8" });
  rmSync(dir, { recursive: true, force: true });
  assert.match(r.stderr + r.stdout, /usage/, "a run through the skills symlink answers");
  console.log("ok a run through the skills symlink answers");
}
