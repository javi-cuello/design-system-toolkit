// Runs scripts/tokens-mapping.js in node against mock nodes — no Figma.
// With no `figma` in scope the body returns its functions.
// Run: node tests/test-tokens-mapping.mjs   (exits non-zero on failure)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const src = readFileSync(fileURLToPath(new URL("../scripts/tokens-mapping.js", import.meta.url)), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const { NEUTRAL_PAINT, swatchPlan, labelFor, rowsFor, applyCell, auditTable, writeCells } = await new AsyncFunction(src)();

let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { failures++; console.log(`FAIL ${name}\n     ${e.message}`); }
}

// ---- mocks ---------------------------------------------------------------
const VARS = {
  "v:bg": { id: "v:bg", name: "Colour/Background/Feedback/Danger/soft-rest" },
  "v:tx": { id: "v:tx", name: "Colour/Text/Accent/Primary/medium" },
  "v:st": { id: "v:st", name: "Colour/Stroke/Neutral/strong" },
  "v:nt": { id: "v:nt", name: "Colour/Background/Neutral/soft" },
};
const solid = (id) => ({ type: "SOLID", opacity: 0.5, blendMode: "MULTIPLY", color: { r: 1, g: 0, b: 0 }, boundVariables: id ? { color: { type: "VARIABLE_ALIAS", id } } : {} });
const deps = {
  bindPaint: (p, v) => Object.assign({}, p, { boundVariables: { color: { type: "VARIABLE_ALIAS", id: v.id } } }),
  getVariableById: async (id) => VARS[id] || null,
};
// The subtree each Content variant carries, by §2's table. `bleed` copies the
// Sample fill from the previous variant onto the new one, as Figma does for a
// same-named layer.
function variantTree(variant, bleed, textName = "Aa") {
  const sample = { name: "Sample", type: variant === "Shape" ? "ELLIPSE" : "FRAME", fills: bleed || [solid()], strokes: [], children: [] };
  if (variant === "Text") sample.children.push({ name: textName, type: "TEXT", fills: [solid()] });
  if (variant === "Stroke") sample.strokes = [solid()];
  return [{ name: "Content", type: "FRAME", fills: [solid("v:nt")], children: [sample] }];
}
function levelToken(id, variant, opts = {}) {
  const node = {
    id, name: "Level token", type: "INSTANCE",
    componentProperties: { Content: { value: variant }, "Label text#0:1": { value: opts.label || "" } },
    children: variantTree(variant, null, opts.textName),
    setProperties(p) {
      for (const [k, v] of Object.entries(p)) this.componentProperties[k] = { value: v };
      if (p.Content) this.children = variantTree(p.Content, this.children[0].children[0].fills, opts.textName);
    },
  };
  return node;
}
const sampleOf = (n) => n.children[0].children[0];

// ---- pure ----------------------------------------------------------------
await check("labelFor drops the group and splits emphasis-state", async () => {
  assert.equal(labelFor("Colour/Background/Feedback/Danger/soft-rest"), "background.feedback.danger.soft.rest");
  assert.equal(labelFor("Color/Icon/Accent/Primary/medium"), "icon.accent.primary.medium");
  assert.equal(labelFor("Colour/Stroke/Neutral/strong"), "stroke.neutral.strong");
});
await check("swatchPlan puts the Text colour on Aa, the Stroke colour on strokes", async () => {
  assert.deepEqual(swatchPlan("Text").path, ["Sample", "Aa"]);
  assert.equal(swatchPlan("Stroke").paint, "strokes");
  assert.equal(swatchPlan("Bogus"), null);
});

// ---- applyCell -----------------------------------------------------------
await check("Frame: binds Sample, keeps its opacity, resets the pill to the neutral paint", async () => {
  const n = levelToken("1:1", "Frame");
  assert.deepEqual(applyCell(n, { id: "1:1", content: "Frame" }, VARS["v:bg"], deps), []);
  const s = sampleOf(n);
  assert.equal(s.fills[0].boundVariables.color.id, "v:bg");
  assert.equal(s.fills[0].opacity, 0.5);
  assert.deepEqual(n.children[0].fills, [NEUTRAL_PAINT]);
  assert.equal(n.componentProperties["Label text#0:1"].value, "background.feedback.danger.soft.rest");
});
await check("Shape → Text: the bled Sample colour is reset and the colour lands on Aa", async () => {
  const n = levelToken("1:2", "Shape");
  sampleOf(n).fills = [solid("v:bg")];                 // the previous variant's swatch
  applyCell(n, { id: "1:2", content: "Text" }, VARS["v:tx"], deps);
  const s = sampleOf(n);
  assert.deepEqual(s.fills, [NEUTRAL_PAINT]);
  assert.equal(s.children[0].fills[0].boundVariables.color.id, "v:tx");
});
await check("Stroke: binds the stroke and empties Sample's fills", async () => {
  const n = levelToken("1:3", "Frame");
  applyCell(n, { id: "1:3", content: "Stroke", label: "custom.label" }, VARS["v:st"], deps);
  const s = sampleOf(n);
  assert.deepEqual(s.fills, []);
  assert.equal(s.strokes[0].boundVariables.color.id, "v:st");
  assert.equal(n.componentProperties["Label text#0:1"].value, "custom.label");
});
await check("a swatch layer that is not there is reported, not skipped", async () => {
  const n = levelToken("1:4", "Text", { textName: "A" });
  const issues = applyCell(n, { id: "1:4", content: "Text" }, VARS["v:tx"], deps);
  assert.equal(issues.length, 1);
  assert.match(issues[0].problem, /Content > Sample > Aa/);
});

// ---- auditTable ----------------------------------------------------------
function built(id, variant, varId, opts) {
  const n = levelToken(id, variant, opts);
  applyCell(n, { id, content: variant }, VARS[varId], deps);
  return n;
}
const level = (name, label, empty = "False") => ({ name, type: "INSTANCE", componentProperties: { "Label text#0:2": { value: label }, Empy: { value: empty } }, children: [] });
await check("a correctly built table audits clean, with every cell and frame counted", async () => {
  const table = { name: "Table", type: "FRAME", children: [
    { name: "Soft", type: "FRAME", children: [level("Level 3-4", "Soft"), built("2:1", "Frame", "v:bg"), built("2:2", "Text", "v:tx"), built("2:3", "Stroke", "v:st")] },
  ] };
  const r = await auditTable(table, deps);
  assert.deepEqual(r.issues, []);
  assert.equal(r.cells, 3);
  assert.equal(r.measures.bound, 3);
  assert.equal(r.measures.levelFrames, 1);
  assert.deepEqual(r.found, ["Colour/Background/Feedback/Danger/soft-rest", "Colour/Stroke/Neutral/strong", "Colour/Text/Accent/Primary/medium"]);
});
await check("the audit finds a bound pill, a Text cell whose layer is named A, a mislabel and a stale frame name", async () => {
  const pill = built("3:1", "Frame", "v:bg");
  pill.children[0].fills = [solid("v:nt")];
  const wrongName = levelToken("3:2", "Text", { textName: "A" });
  wrongName.children[0].fills = [Object.assign({}, NEUTRAL_PAINT)];
  const mislabel = built("3:3", "Frame", "v:bg");
  mislabel.componentProperties["Label text#0:1"].value = "background.neutral.soft";
  const table = { name: "Table", type: "FRAME", children: [
    { name: "Soft", type: "FRAME", children: [level("Level 3-4", "Inverse"), pill, wrongName, mislabel] },
    { name: "Blank", type: "FRAME", children: [level("Level 2", "", "True")] },
  ] };
  const r = await auditTable(table, deps);
  const problems = r.issues.map((i) => i.problem);
  assert.equal(r.cells, 3);
  assert.ok(problems.some((p) => /pill bound/.test(p)), "bound pill");
  assert.ok(problems.some((p) => /Content > Sample > Aa/.test(p)), "missing Aa");
  assert.ok(problems.some((p) => /label reads "background.neutral.soft"/.test(p)), "mislabel");
  assert.ok(problems.some((p) => /frame named "Soft" holds a Level 3-4 labelled "Inverse"/.test(p)), "stale frame name");
  assert.equal(r.measures.levelFrames, 1, "an Empy=True level is not a frame to check");
  assert.equal(r.issues.length, 4);
});

await check("a Stroke cell whose Sample keeps fills is reported", async () => {
  const n = built("4:1", "Stroke", "v:st");
  sampleOf(n).fills = [solid()];
  const r = await auditTable({ name: "Table", type: "FRAME", children: [n] }, deps);
  assert.deepEqual(r.issues.map((i) => i.problem), ["Sample has fills — must have none"]);
});

// ---- writeCells ----------------------------------------------------------
await check("a cell that throws is an issue, and the batch goes on", async () => {
  const nodes = { "5:1": levelToken("5:1", "Frame"), "5:2": levelToken("5:2", "Frame"), "5:3": levelToken("5:3", "Frame") };
  nodes["5:2"].setProperties = () => { throw new Error("Component property \"Content\" has no variant \"Gradient\""); };
  const refuse = { ...deps, bindPaint: (p, v) => { if (v.id === "v:tx") throw new Error("cannot bind a gradient paint"); return deps.bindPaint(p, v); } };
  const r = await writeCells([
    { id: "5:1", content: "Frame", variable: "v:bg" },
    { id: "5:2", content: "Frame", variable: "v:bg" },
    { id: "5:3", content: "Frame", variable: "v:tx" },
    { id: "5:4", content: "Frame", variable: "v:bg" },
  ], async (id) => nodes[id] || null, async (ref) => VARS[ref] || null, refuse);
  assert.equal(r.done, 1);
  assert.deepEqual(r.issues.map((i) => i.id + " " + i.problem.split(":")[0]),
    ["5:2 write failed", "5:3 write failed", "5:4 not a Level token instance"]);
});

// ---- rowsFor / rows mode (T8) --------------------------------------------
const SAMPLE = [
  "Colour/Background/Accent/Primary/soft-rest",
  "Colour/Background/Accent/Primary/soft-hover",
  "Colour/Background/Accent/Primary/inverse-rest",   // Inverse has rest only (§1 step 4)
  "Colour/Background/Neutral/soft-rest",             // Neutral has no Type split
  "Colour/Background/Feedback/Danger/strong",        // no State
];
await check("rowsFor reads each name's shape on its own, and blanks what it lacks", async () => {
  const r = rowsFor(SAMPLE);
  assert.deepEqual(r.issues, []);
  assert.equal(r.category, "Background");
  assert.equal(r.content, "Frame");
  assert.deepEqual(r.rows.map((x) => [x.role, x.type, x.emphasis, x.state]), [
    ["Accent", "Primary", "Soft", "Rest"], ["Accent", "Primary", "Soft", "Hover"], ["Accent", "Primary", "Inverse", "Rest"],
    ["Neutral", null, "Soft", "Rest"], ["Feedback", "Danger", "Strong", null]]);
  assert.deepEqual(r.cells[0], { variable: SAMPLE[0], content: "Frame", label: "background.accent.primary.soft.rest" });
});
await check("rowsFor's tree is §3's chain, in the sample's order, with an Empy node where a column does not apply", async () => {
  const { tree } = rowsFor(SAMPLE);
  assert.deepEqual(tree.map((n) => n.label), ["Accent", "Neutral", "Feedback"]);
  const soft = tree[0].children[0].children[0];
  assert.deepEqual([soft.label, soft.children.map((s) => s.label)], ["Soft", ["Rest", "Hover"]]);
  assert.equal(tree[0].children[0].children[1].children.length, 1, "Inverse keeps its one state, not its sibling's three (T5)");
  assert.deepEqual([tree[1].children[0].label, tree[1].children[0].empty], [null, true]);
  const danger = tree[2].children[0].children[0].children[0];
  assert.deepEqual([danger.empty, danger.cell.label], [true, "background.feedback.danger.strong"]);
});
await check("rowsFor names what it cannot place: a wrong shape, a duplicate, a mixed sample, a category §2 has no variant for", async () => {
  const r = rowsFor(["Colour/Background/x", SAMPLE[0], SAMPLE[0], "Colour/Text/Accent/Primary/medium"]);
  const problems = r.issues.map((i) => i.problem);
  assert.ok(problems.some((p) => /3 segments/.test(p)), "shape");
  assert.ok(problems.some((p) => /listed twice/.test(p)), "duplicate");
  assert.ok(problems.some((p) => /spans Background, Text/.test(p)), "mixed");
  assert.match(rowsFor(["Colour/Shadow/Neutral/soft"]).issues[0].problem, /no Content variant for "Shadow"/);
});
await check("rows mode in Figma marks a name that resolves to nothing as [check-token] (T3)", async () => {
  const figma = {
    variables: { getLocalVariablesAsync: async () => [{ id: "v:1", name: SAMPLE[0] }], getVariableByIdAsync: async (id) => (id === "v:2" ? { id, name: SAMPLE[1] } : null) },
    currentPage: { findAll: () => [{ fills: [solid("v:2")] }] },
  };
  const r = await new AsyncFunction("figma", `const MODE = "rows"; const SAMPLE = ${JSON.stringify(SAMPLE.slice(0, 3))};\n` + src)(figma);
  assert.deepEqual(r.issues.map((i) => i.variable + " " + i.problem.split(" ")[0]), [SAMPLE[2] + " [check-token]"]);
  assert.equal(r.rows.length, 3, "a name bound on the page resolves as well as a local one");
});

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
