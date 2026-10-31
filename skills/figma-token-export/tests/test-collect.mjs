// Runs scripts/collect.js against a stand-in `figma` global, with the toolkit's
// tools/tokens/dtcg.js prepended as the SKILL says: the reading half of the
// export (variables, aliases, text, effect and paint styles, AUTO line height)
// and the files it hands back, no Figma needed. dtcg.js's own rules are
// tools/tokens/test-dtcg.js's.
// Run: node skills/figma-token-export/tests/test-collect.mjs
import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const DTCG_SRC = read("../../../tools/tokens/dtcg.js"), COLLECT = read("../scripts/collect.js");

// A small library: a primitive and a semantic collection, an alias, an alias
// whose target left the file, a hidden variable, a bound text style, an AUTO
// line height, a bound shadow and a linear gradient.
function standIn({ fontFails = false } = {}) {
  const cols = [
    { id: "c1", name: "Primitives", modes: [{ modeId: "m1", name: "Value" }], variableIds: ["v1", "v2", "v5"] },
    { id: "c2", name: "Semantic", modes: [{ modeId: "l", name: "Light" }, { modeId: "d", name: "Dark" }], variableIds: ["v3", "v4"] },
  ];
  const vars = {
    v1: { name: "Red/600", resolvedType: "COLOR", variableCollectionId: "c1", hiddenFromPublishing: true, description: "", valuesByMode: { m1: { r: 0.77, g: 0.05, b: 0.13, a: 1 } } },
    v2: { name: "Size/16", resolvedType: "FLOAT", variableCollectionId: "c1", description: "Body size", valuesByMode: { m1: 16 } },
    v5: { name: "Shadow/blur", resolvedType: "FLOAT", variableCollectionId: "c1", description: "", valuesByMode: { m1: 8 } },
    v3: { name: "Color/Brand", resolvedType: "COLOR", variableCollectionId: "c2", description: "", valuesByMode: { l: { type: "VARIABLE_ALIAS", id: "v1" }, d: { type: "VARIABLE_ALIAS", id: "gone" } } },
    v4: { name: "Color/Text", resolvedType: "COLOR", variableCollectionId: "c2", description: "", valuesByMode: { l: { r: 0, g: 0, b: 0, a: 1 }, d: { r: 1, g: 1, b: 1, a: 1 } } },
  };
  const made = [];
  const figma = {
    variables: {
      getLocalVariableCollectionsAsync: async () => cols,
      getVariableByIdAsync: async (id) => vars[id] || null,
    },
    getLocalTextStylesAsync: async () => [
      { name: "Body/Medium", description: "Prose", fontName: { family: "Inter", style: "Regular" }, fontSize: 16, lineHeight: { unit: "PERCENT", value: 150 }, letterSpacing: { unit: "PERCENT", value: 0 }, boundVariables: { fontSize: { id: "v2" } } },
      { name: "Label/Small", description: "", fontName: { family: "Inter", style: "Medium" }, fontSize: 12, lineHeight: { unit: "AUTO" }, letterSpacing: { unit: "PIXELS", value: 0.5 }, boundVariables: {} },
    ],
    getLocalEffectStylesAsync: async () => [
      { name: "Elevation/1", description: "", effects: [{ type: "DROP_SHADOW", visible: true, color: { r: 0, g: 0, b: 0, a: 0.2 }, offset: { x: 0, y: 2 }, radius: 8, spread: 0, boundVariables: { radius: { id: "v5" } } }] },
    ],
    getLocalPaintStylesAsync: async () => [
      { name: "Brand/Fade", description: "", paints: [{ type: "GRADIENT_LINEAR", gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: { r: 1, g: 0, b: 0, a: 1 } }, { position: 1, color: { r: 0, g: 0, b: 1, a: 1 } }], opacity: 0.5 }] },
      { name: "Brand/Solid", description: "", paints: [{ type: "SOLID", color: { r: 0.77, g: 0.05, b: 0.13 }, boundVariables: { color: { id: "v1" } } }] },
    ],
    loadFontAsync: async () => { if (fontFails) throw new Error("no font"); },
    createText: () => { const n = { height: 14.6, removed: false, remove() { n.removed = true; } }; made.push(n); return n; },
  };
  return { figma, made };
}

function load(figma) {
  const ctx = vm.createContext({ figma, setTimeout, Promise, JSON, Math, Object });
  vm.runInContext(DTCG_SRC + "\n" + COLLECT, ctx);
  return ctx;
}

let failures = 0;
async function check(name, fn) {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { failures++; console.log(`FAIL ${name}\n     ${e.message}`); }
}

await check("without dtcg.js prepended it says what to prepend", async () => {
  const ctx = vm.createContext({ figma: standIn().figma });
  vm.runInContext(COLLECT, ctx);
  await assert.rejects(() => ctx.snapshotVariables(), /Prepend tools\/tokens\/dtcg\.js/);
});

await check("variables keep their collection, modes, type, hidden flag and description; an alias names its target by collection and name", async () => {
  const ctx = load(standIn().figma);
  const cols = await ctx.snapshotVariables();
  assert.deepEqual(JSON.parse(JSON.stringify(cols.map((c) => c.name))), ["Primitives", "Semantic"]);
  const red = cols[0].variables.find((v) => v.name === "Red/600");
  assert.equal(red.hidden, true);
  assert.equal(cols[0].variables.find((v) => v.name === "Size/16").description, "Body size");
  const brand = cols[1].variables.find((v) => v.name === "Color/Brand");
  assert.deepEqual(JSON.parse(JSON.stringify(brand.values.Light)), { alias: { collection: "Primitives", name: "Red/600" } });
});

await check("an alias whose target left the file is recorded as unresolved, never skipped", async () => {
  const ctx = load(standIn().figma);
  const brand = (await ctx.snapshotVariables())[1].variables.find((v) => v.name === "Color/Brand");
  assert.deepEqual(JSON.parse(JSON.stringify(brand.values.Dark)), { unresolved: "gone" });
});

await check("`only` limits the collections read", async () => {
  const ctx = load(standIn().figma);
  assert.deepEqual(JSON.parse(JSON.stringify((await ctx.snapshotVariables({ only: ["Semantic"] })).map((c) => c.name))), ["Semantic"]);
});

await check("a text style keeps its values and its bound variables; an AUTO line height is measured on a text node that is then removed", async () => {
  const s = standIn();
  const ctx = load(s.figma);
  const styles = await ctx.snapshotTextStyles();
  assert.deepEqual(JSON.parse(JSON.stringify(styles[0].bound.fontSize)), { collection: "Primitives", name: "Size/16" });
  assert.equal(styles[0].bound.fontFamily, null);
  assert.deepEqual(JSON.parse(JSON.stringify(styles[1].lineHeight)), { unit: "MEASURED", value: 15 });
  assert.ok(s.made.length === 1 && s.made[0].removed, "the measuring node is removed");
});

await check("a font that does not load leaves the AUTO unmeasured, not thrown", async () => {
  const ctx = load(standIn({ fontFails: true }).figma);
  assert.deepEqual(JSON.parse(JSON.stringify((await ctx.snapshotTextStyles())[1].lineHeight)), { unit: "AUTO" });
});

await check("an effect layer keeps its values and its bindings", async () => {
  const ctx = load(standIn().figma);
  const e = (await ctx.snapshotEffectStyles())[0].effects[0];
  assert.equal(e.radius, 8);
  assert.deepEqual(JSON.parse(JSON.stringify(e.bound.radius)), { collection: "Primitives", name: "Shadow/blur" });
  assert.equal(e.bound.color, null);
});

await check("a linear gradient's angle comes from its transform and each stop carries the paint's opacity; a solid's colour keeps its binding", async () => {
  const ctx = load(standIn().figma);
  const [fade, solid] = await ctx.snapshotPaintStyles();
  assert.equal(fade.paints[0].angle, 90);
  assert.equal(fade.paints[0].stops[0].color.a, 0.5);
  assert.deepEqual(JSON.parse(JSON.stringify(solid.paints[0].bound.color)), { collection: "Primitives", name: "Red/600" });
  assert.equal(solid.paints[0].color.a, 1);
});

await check("exportTokens builds the files without sending them; takeFile hands each over; every reference resolves", async () => {
  const ctx = load(standIn().figma);
  const r = await ctx.exportTokens();
  assert.ok(r.files.length >= 2 && r.files.every((f) => f.bytes > 0), JSON.stringify(r.files));
  assert.ok(r.manifest && r.manifest.builds.length >= 1);
  const name = r.files.find((f) => f.tokens > 0).name;
  assert.ok(JSON.parse(ctx.takeFile(name)));
  assert.throws(() => ctx.takeFile("nope.json"), /No such file: nope\.json — have /);
  const v = ctx.verifyReferences();
  assert.equal(v.ok, true, JSON.stringify(v.dangling));
});

await check("takeFile and verifyReferences before an export say to run it first", async () => {
  const ctx = load(standIn().figma);
  assert.throws(() => ctx.takeFile("x"), /Run exportTokens\(\) first/);
  assert.throws(() => ctx.verifyReferences(), /Run exportTokens\(\) first/);
});

console.log(failures ? `\n${failures} failed` : "\nall passed");
process.exit(failures ? 1 : 0);
