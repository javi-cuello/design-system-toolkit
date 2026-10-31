#!/usr/bin/env node
// node plugins/design-system-snapshot/tests/test-walk.mjs — the walk that
// records a node, run outside Figma: code.js is loaded headless (no __html__)
// into a context with a stub `figma`, and `walk` is called on plain objects.
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const src = readFileSync(fileURLToPath(new URL("../code.js", import.meta.url)), "utf8");
const figma = { variables: { getVariableByIdAsync: async () => null }, getStyleByIdAsync: async () => null };
const { walk, unrecorded, slotPaths, markSlots, propLinks, unboundPaints, componentName, collectComponents, place, loadPages, drawnIn, unescaped, VERSION } = vm.runInContext(src + "\n;({ walk, unrecorded, slotPaths, markSlots, propLinks, unboundPaints, componentName, collectComponents, place, loadPages, drawnIn, unescaped, VERSION })", vm.createContext({ figma, console }));

let n = 0;
const ok = (name, cond) => { n++; assert.ok(cond, name); console.log("ok", name); };
const row = (counterAxisSpacing, layoutWrap = "WRAP") => ({
  name: "Row", type: "FRAME", width: 200, height: 40, x: 0, y: 0, layoutMode: "HORIZONTAL",
  paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0, itemSpacing: 8, layoutWrap, counterAxisSpacing,
  primaryAxisAlignItems: "MIN", counterAxisAlignItems: "MIN", children: [], boundVariables: {},
});

// Review of 2 October 2026, round 3 (S14): a wrapping frame whose line
// spacing is "the same as items" (null) recorded nothing and flagged nothing.
const same = await walk(row(null), 1);
ok("a wrapping frame's null line spacing is recorded as the item spacing it means", same.crossGap === 8);
ok("…so nothing is left unrecorded", unrecorded(row(null), same).length === 0);
const own = await walk(row(24), 1);
ok("a line spacing of its own is recorded as set", own.crossGap === 24);
const flat = await walk(row(null, "NO_WRAP"), 1);
ok("a frame that does not wrap has no line spacing", !("crossGap" in flat));
ok("a frame stacked first on top says so; one stacked last on top does not", (await walk({ ...row(null), itemReverseZIndex: true }, 1)).firstOnTop === true && !("firstOnTop" in flat));

// Round 4 of the 2026-10-02 review: a boolean-derived variant is walked from a
// detached instance, and detaching turns every SLOT into a FRAME, so the
// variant recorded its slots as frames. The slots are noted on the instance
// by their place among visible children and put back on the walked tree.
const box = (name, type, children = [], visible = true) => ({ name, type, visible, width: 10, height: 10, x: 0, y: 0, layoutMode: "NONE", boundVariables: {}, children });
const inst = box("Modal", "INSTANCE", [box("Header", "FRAME"), box("Hidden", "FRAME", [], false), box("Content", "FRAME", [box("Content slot", "SLOT", [box("Body", "FRAME")])])]);
const paths = slotPaths(inst);
ok("a slot is noted by its place among the instance's visible children", JSON.stringify(paths) === "[[1,0]]");
// what detachInstance() leaves: the same tree with the slot a FRAME
const detached = box("Modal", "FRAME", [box("Header", "FRAME"), box("Hidden", "FRAME", [], false), box("Content", "FRAME", [box("Content slot", "FRAME", [box("Body", "FRAME")])])]);
const tree = markSlots(await walk(detached, 0), paths);
ok("…and put back on the walked tree", tree.children[1].children[0].type === "SLOT" && tree.children[1].children[0].name === "Content slot");
ok("…leaving every other layer as walked", tree.children[0].type === "FRAME" && tree.children[1].type === "FRAME" && tree.children[1].children[0].children[0].type === "FRAME");
ok("a path the walk did not reach marks nothing", markSlots({ name: "x", type: "FRAME" }, [[3, 1]]).type === "FRAME");

// Round 4: the release is stamped on every payload, so the store can tell a
// field the plugin began to record from one a library began to use.
const pkg = JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"));
ok("the plugin's release constant is package.json's", VERSION === pkg.version && /^\/\/ Design system snapshot — v/.test(src) && src.split("\n")[0].includes("v" + pkg.version));
ok("…and both payloads carry it in _meta", (src.match(/plugin: VERSION/g) || []).length === 2);

// 2026-10-05: a contract read `Label text: TEXT` and a layer reading "Label"
// with nothing joining them; the join lives on the layer. A review then found
// two same-named labels merged into one link, and references inside a nested
// instance read as the outer component's.
const node = (name, kids = [], refs, extra = {}) => ({ name, children: kids, componentPropertyReferences: refs, ...extra });
const v1 = node("Size=Large", [node("Content", [node("Label", [], { characters: "Title#1:2" }), node("Label", [], { characters: "Subtitle#7:8" }),
  node("Icon", [node("Glyph", [], { visible: "Title#9:9" })], { visible: "Left icon#3:4", mainComponent: "Icon#5:6" }, { type: "INSTANCE" })])]);
const v2 = node("Size=Small", [node("Content", [node("Hidden", [], undefined, { visible: false }), node("Label", [], { characters: "Title#1:2" })]), node("Badge", [], { visible: "Left icon#3:4" })]);
const links = propLinks([v1, v2]);
ok("each property names the layers it drives, as lists of names numbered among visible siblings, once across variants; one driving them in some variants only names those",
  JSON.stringify(links) === JSON.stringify({ Title: { kind: "characters", layers: [["Content", "Label"]] }, Subtitle: { kind: "characters", layers: [["Content", "Label[2]"]], variants: ["Size=Large"] },
    "Left icon": { kind: "visible", layers: [["Content", "Icon"], ["Badge"]] }, Icon: { kind: "mainComponent", layers: [["Content", "Icon"]], variants: ["Size=Large"] } }));
ok("…and a reference inside a nested instance is the inner component's, not recorded", !links.Title.layers.some((l) => l.includes("Glyph")));

// 0.61.0: a layer placed out of the flow keeps how it follows its parent; one in the flow, or pinned top left, says nothing
const ring = await walk({ ...box("Focus ring", "RECTANGLE"), layoutPositioning: "ABSOLUTE", constraints: { horizontal: "STRETCH", vertical: "STRETCH" }, parent: { layoutMode: "HORIZONTAL" } }, 1);
const flowing = await walk({ ...box("Label", "FRAME"), constraints: { horizontal: "STRETCH", vertical: "MIN" }, parent: { layoutMode: "HORIZONTAL" } }, 1);
const pinned = await walk({ ...box("Dot", "FRAME"), constraints: { horizontal: "MIN", vertical: "MIN" }, parent: { layoutMode: "NONE" } }, 1);
ok("a layer out of the flow keeps its constraints; one in the flow or pinned top left does not", ring.constraints === "STRETCH/STRETCH" && !("constraints" in flowing) && !("constraints" in pinned));

// 0.62.0: a half circle and a rounded line were read as a whole circle and a square one
const half = await walk({ ...box("Progress", "ELLIPSE"), arcData: { startingAngle: 0, endingAngle: Math.PI, innerRadius: 0.5 } }, 1);
const whole = await walk({ ...box("Dot", "ELLIPSE"), arcData: { startingAngle: 0, endingAngle: 2 * Math.PI, innerRadius: 0 } }, 1);
const capped = await walk({ ...box("Line", "VECTOR"), strokes: [{ type: "SOLID", visible: true, color: { r: 0, g: 0, b: 0 } }], strokeCap: "ROUND" }, 1);
ok("an ellipse's arc is kept where it is not whole, in degrees, and a stroke's rounded ends", JSON.stringify(half.arc) === '{"start":0,"end":180,"inner":0.5}' && !("arc" in whole) && capped.strokeCap === "ROUND");

// 0.61.0: a component is named under its page unless the page is its own, a private one's underscore aside
const on = (page, name) => componentName({ name, parent: { type: "PAGE", name: page } });
ok("a component on its own page is its name, a private one too; on another page it is under it",
  on("_Label", "_Label") === "_Label" && on("Label", "_Label") === "_Label" && on("Graphic", "Switch") === "Graphic/Switch");

// 0.53.0: an icon's unbound paints, which its SVG cannot say.
const solid = (bound) => ({ type: "SOLID", visible: true, ...(bound ? { boundVariables: { color: { id: "v" } } } : {}) });
const glyph = { name: "Size=16", type: "COMPONENT", children: [
  { name: "a", type: "VECTOR", fills: [solid(true)], strokes: [solid(false)] },
  { name: "b", type: "VECTOR", fills: [solid(false)], strokes: [], fillStyleId: "S:1" },
  { name: "c", type: "VECTOR", visible: false, fills: [solid(false)] },
] };
ok("an icon counts its visible solid paints that no variable or style binds", unboundPaints(glyph) === 1);

// 0.65.1: 0.65.0's measured progress dropped the page each list belongs to, and every library snapshot stopped on
// "page is not defined"; a component is filed under its own page
{
  const pageOf = (name, comp) => { const p = { type: "PAGE", name, children: [] }; if (comp) { comp.parent = p; p.children.push(comp); } p.findAll = (f) => p.children.filter(f); return p; };
  const chip = { type: "COMPONENT", name: "Chip", id: "1:1", width: 40, height: 20, children: [], componentPropertyDefinitions: {} };
  const tag = { type: "COMPONENT", name: "Tag", id: "1:2", width: 40, height: 20, children: [], componentPropertyDefinitions: {} };
  figma.root = { children: [pageOf("Cover"), pageOf("Chip", chip), pageOf("Tag", tag)] };
  const got = await collectComponents({ withIcons: false, previews: [], darkModes: async () => [] });
  ok("each component is filed under its own page", got.map((c) => c.page).join() === "Chip,Tag");
}
// 0.66.0: where the Figma MCP runs this file (in Figma's cloud) a node whose font the cloud lacks cannot be moved, and
// every page is loaded on its own; each falls back there, and the plugin's own run never meets the fallback
{
  const moved = [];
  ok("a node is placed where it is asked to go", place({ appendChild: (x) => moved.push(x) }, "n") === true && moved[0] === "n");
  ok("one whose font the run cannot load stays where it was made", place({ appendChild: () => { throw new Error('in appendChild: unloaded font "Inter Display Medium"'); } }, "n") === false);
  let other = null; try { place({ appendChild: () => { throw new Error("node is locked"); } }, "n"); } catch (e) { other = e.message; }
  ok("any other refusal is still an error", other === "node is locked");
  const loaded = [];
  figma.loadAllPagesAsync = async () => { throw new Error('"loadAllPagesAsync" is not a supported API'); };
  figma.root = { children: [{ loadAsync: async () => loaded.push(1) }, { loadAsync: async () => loaded.push(2) }] };
  await loadPages();
  ok("pages load one by one where loading them all is refused", loaded.join() === "1,2");
  let all = 0; figma.loadAllPagesAsync = async () => { all++; }; loaded.length = 0;
  await loadPages();
  ok("…and all at once where it is not", all === 1 && loaded.length === 0);
  const text = (id, chars, auto, h) => ({ textStyleId: id, characters: chars, textAutoResize: auto, height: h });
  const page = (name, texts) => ({ name, findAllWithCriteria: () => texts });
  figma.root = { children: [page("Snapshot (temporary)", [text("S:1", "Hg", "WIDTH_AND_HEIGHT", 99)]), page("Button", [text("S:1", "two\nlines", "WIDTH_AND_HEIGHT", 40), text("S:1", "Wide", "HEIGHT", 30), text("S:1", "Label", "WIDTH_AND_HEIGHT", 20)])] };
  ok("a style's line is measured from one-line text already drawn in it, never the run's own", drawnIn({ id: "S:1" }) === 20);
  ok("…and none where nothing is drawn in it", drawnIn({ id: "S:2" }) === null);
  figma.root = { children: [page("Button", [text("S:3", "one" + String.fromCharCode(0x2028) + "two", "WIDTH_AND_HEIGHT", 40)])] };
  ok("…nor where its only text breaks its line with a line separator", drawnIn({ id: "S:3" }) === null);
  ok("a description the cloud hands back escaped reads as typed", unescaped("west, &lt;- &amp; &quot;back&quot; &#39;x&#39; -&gt;") === "west, <- & \"back\" 'x' ->" && unescaped("a < b") === "a < b");
}
// 0.67.0: a duplicated file keeps its original's id, so the key tells them
// apart; a Development run is given it only where the manifest asks.
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL("../manifest.json", import.meta.url)), "utf8"));
ok("the manifest asks for the file key, and both payloads send it", manifest.enablePrivatePluginApi === true && (src.match(/fileKey: figma\.fileKey,/g) || []).length === 2);
{
  const writes = [], data = {}, root = { getPluginData: (k) => data[k] || "", setPluginData: (k, v) => { writes.push(k); data[k] = v; }, getRelaunchData: () => ({}), setRelaunchData() {} };
  const id = vm.runInContext(src + "\n;fileId()", vm.createContext({ figma: { ...figma, root }, console }));
  ok("a headless run makes no id in another plugin's data", id === null && writes.length === 0);
  // the run's own start reads the file's kind, and so its id, before this does: one stamp, read back after
  const made = vm.runInContext(src + "\n;fileId()", vm.createContext({ figma: { ...figma, root, showUI() {}, ui: { postMessage() {}, onmessage: null }, getNodeByIdAsync: async () => null }, console, __html__: "", fetch: () => new Promise(() => {}) }));
  ok("…while the plugin's own run stamps one, once", /^f[0-9a-z]+$/.test(made) && writes.join() === "snapshotFileId" && data.snapshotFileId === made);
}
{
  const ask = (res) => vm.runInContext(src + "\n;reachable()", vm.createContext({ figma, console, fetch: async () => res }));
  ok("a router answering 500 is listening, so its own error is shown", (await ask({ ok: false, status: 500 })) === true && (await ask({ ok: true, status: 200 })) === true);
  const none = vm.runInContext(src + "\n;reachable()", vm.createContext({ figma, console, fetch: async () => { throw new TypeError("Failed to fetch"); } }));
  ok("…and only no answer at all is nobody listening", (await none) === false);
}
console.log(n + "/" + n + " passed");
