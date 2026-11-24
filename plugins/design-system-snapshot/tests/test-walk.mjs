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
const ctx = vm.createContext({ figma, console, setTimeout, clearTimeout });
const { walk, unrecorded, slotPaths, markSlots, propLinks, unboundPaints, componentName, collectComponents, place, loadPages, drawnIn, familyMetric, autoLineAt, unescaped, VERSION } = vm.runInContext(src + "\n;({ walk, unrecorded, slotPaths, markSlots, propLinks, unboundPaints, componentName, collectComponents, place, loadPages, drawnIn, familyMetric, autoLineAt, unescaped, VERSION })", ctx);

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

// 2026-11-23: two layers two booleans show, both hidden by default, were each
// walked alone, at the same place among the visible children, so which comes
// first was lost (a menu item's top spacer and divider). Each walked child
// says its place among all its parent's children, hidden ones counted.
{
  const kids = [box("Top spacer", "FRAME", [], false), box("Divider", "FRAME"), box("Hidden", "FRAME", [], false), box("Content", "FRAME")];
  const item = box("Item", "FRAME", kids);
  const walked = await walk(item, 0);
  ok("a walked child says its place among all its parent's children, hidden ones counted",
    JSON.stringify(walked.children.map((c) => [c.name, c.index])) === JSON.stringify([["Divider", 1], ["Content", 3]]));
  ok("…and the root, which has no parent walked, says none", !("index" in walked));
  ok("…every other field as before: the children are still the visible ones, in order", walked.children.length === 2 && walked.children[0].x === 0);
  // Figma hands an instance's children without the hidden ones (skipInvisibleInstanceChildren), so a place counted
  // there would be a visible place said as a whole one: none is said inside an instance, at any depth
  const host = { ...box("Icon", "INSTANCE", [box("Hidden", "FRAME", [], false), box("Frame", "FRAME", [box("Glyph", "FRAME")])]),
    getMainComponentAsync: async () => null, componentProperties: {}, overrides: [{ overriddenFields: ["fills"] }] };
  const held = await walk(box("Row", "FRAME", [box("Gap", "FRAME", [], false), host]), 0);
  const icon = held.children[0];
  ok("…and none is said inside an instance, whose hidden children Figma may not hand over, the instance itself placed",
    icon.index === 1 && icon.children.length === 1 && !("index" in icon.children[0]) && !("index" in icon.children[0].children[0]));
}

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

// 0.85.0: a vector's outline was not read, so a dot drawn back as a square of its size compared the same
{
  const shape = (data, windingRule = "NONZERO") => walk({ ...box("Dot", "VECTOR"), width: 8, height: 8, vectorPaths: [{ windingRule, data }] }, 1);
  const circle = await shape("M 8 4 C 8 6.209139029184977 6.209139029184977 8 4 8 C 1.790860970815023 8 0 6.209139029184977 0 4 C 0 1.790860970815023 1.790860970815023 0 4 0 C 6.209139029184977 0 8 1.790860970815023 8 4 Z", "NONE");
  const square = await shape("M 0 0 L 8 0 L 8 8 L 0 8 L 0 0 Z");
  ok("a vector records its outline, and a circle's is not a square's", typeof circle.outline === "string" && circle.outline.length === 8 && circle.outline !== square.outline);
  const again = await shape("M 8 4 C 8 6.209139 6.209139 8 4 8 C 1.790861 8 0 6.209139 0 4 C 0 1.790861 1.790861 0 4 0 C 6.209139 0 8 1.790861 8 4 Z");
  ok("…read at the walk's rounding, so one outline written to more or fewer places is the same", again.outline === circle.outline);
  ok("…and a layer that is not a vector records none", !("outline" in (await walk(box("Frame", "FRAME"), 1))));
  // 0.86.0: the paths themselves, so a drawing can draw the dot it was given, not its box
  ok("a vector records its paths at the walk's rounding, with their fill rule", JSON.stringify(circle.paths) === JSON.stringify([{ windingRule: "NONE", data: "M 8 4 C 8 6.21 6.21 8 4 8 C 1.79 8 0 6.21 0 4 C 0 1.79 1.79 0 4 0 C 6.21 0 8 1.79 8 4 Z" }]));
  const inside = await walk({ ...box("Dot", "VECTOR"), vectorPaths: [{ windingRule: "NONZERO", data: "M 0 0 L 8 0 L 8 8 Z" }] }, 2, undefined, true);
  ok("…but not inside an instance, whose drawing is its component's", !("paths" in inside) && typeof inside.outline === "string");
  const glyph = await walk({ ...box("Glyph", "VECTOR"), vectorPaths: [{ windingRule: "NONZERO", data: "M 0 0" + " L 1.25 2.5".repeat(400) + " Z" }] }, 1);
  ok("…nor past the cap: a glyph's kilobytes keep only their outline", !("paths" in glyph) && typeof glyph.outline === "string");
}

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
// 0.77.0: a property named with a `#` of its own (`# of lines`) kept nothing of its name: everything from the `#`
// was taken for the id Figma appends (`Label#1:0`)
{
  const pageOf = (name, comp) => { const p = { type: "PAGE", name, children: [comp] }; comp.parent = p; p.findAll = (f) => p.children.filter(f); return p; };
  const bar = { type: "COMPONENT", name: "Bar", id: "4:1", width: 40, height: 20, children: [], componentPropertyDefinitions: { "# of lines": { type: "VARIANT", defaultValue: "One", variantOptions: ["One", "Two"] }, "Label#1:0": { type: "TEXT", defaultValue: "x" } } };
  figma.root = { children: [pageOf("Bar", bar)] };
  const got = await collectComponents({ withIcons: false, previews: [], darkModes: async () => [] });
  ok("a property's own `#` stays in its name; only Figma's id is dropped", JSON.stringify(Object.keys(got[0].props).sort()) === JSON.stringify(["# of lines", "Label"]));
}
// 0.84.0: a set's arrangement is the library's: each variant's place in the set and the set's size, so a drawing
// places its variants where the library does (bubbles painting outside 16 px variants overlapped on a grid of boxes)
{
  const v = (name, x, y) => ({ type: "COMPONENT", name, id: "5:" + x, x, y, width: 16, height: 16, children: [], componentPropertyDefinitions: {} });
  const set = { type: "COMPONENT_SET", name: "Tip", id: "5:0", width: 794, height: 1300, children: [v("Position=Top", 149, 1042), v("Position=Left", 740, 60)],
    componentPropertyDefinitions: { Position: { type: "VARIANT", defaultValue: "Top", variantOptions: ["Top", "Left"] } } };
  for (const c of set.children) c.parent = set;
  const p = { type: "PAGE", name: "Tip", children: [set] }; set.parent = p; p.findAll = (f) => p.children.filter(f);
  figma.root = { children: [p] };
  const [got] = await collectComponents({ withIcons: false, previews: [], darkModes: async () => [] });
  ok("each variant's place in its set is recorded, and the set's size", JSON.stringify(got.variants.map((x) => x.place)) === '[{"x":149,"y":1042},{"x":740,"y":60}]' && JSON.stringify(got.set) === '{"w":794,"h":1300}');
  ok("…beside the variant's own box, never as its x and y (a layer's place in its parent, which readers add up)", !("x" in got.variants[0]) && !("y" in got.variants[0]));
}
// 0.73.0: a scratch page's components are trials, not the library; a snapshot took two as components
{
  const pageOf = (name, comp) => { const p = { type: "PAGE", name, children: [] }; if (comp) { comp.parent = p; p.children.push(comp); } p.findAll = (f) => p.children.filter(f); return p; };
  const mk = (name, id) => ({ type: "COMPONENT", name, id, width: 40, height: 20, children: [], componentPropertyDefinitions: {} });
  figma.root = { children: [pageOf("Chip", mk("Chip", "3:1")), pageOf("Scratch — agent trial 2026-11-04", mk("Template", "3:2")), pageOf("🚧 scratch", mk("Try", "3:3")), pageOf("Scratch card", mk("Card", "3:4")), pageOf("Scratchpad notes", mk("Note", "3:5")), pageOf("Scratch [old]", mk("Old", "3:6")), pageOf("Scratch-card", mk("Card2", "3:7"))] };
  const got = await collectComponents({ withIcons: false, previews: [], darkModes: async () => [] });
  ok("a page named Scratch is not read for components, after a marker or none; Scratch card, Scratch-card and Scratchpad are", got.map((c) => c.page).join() === "Chip,Scratch card,Scratchpad notes,Scratch-card");
  const byPage = await collectComponents({ withIcons: false, previews: [], darkModes: async () => [], pages: /^[🚧C]/ });
  const byId = await collectComponents({ withIcons: false, previews: [], darkModes: async () => [], scope: new Set(["3:3"]) });
  ok("a page rule does not reach a scratch page; a run naming a component's id reads it", byPage.map((c) => c.page).join() === "Chip" && byId.map((c) => c.page).join() === "🚧 scratch");
}
// 0.69.0: a slot's preferred values are keys, which name nothing to a reader that did not store the component;
// this file's own are named from the file, importing nothing; another library's by import, a variant by its set;
// one that cannot be named is null, and the names stay in the order of the keys
{
  const pageOf = (name, comp) => { const p = { type: "PAGE", name, children: [comp] }; comp.parent = p; p.findAll = (f) => p.children.filter(f); return p; };
  const pref = [{ type: "COMPONENT", key: "local1" }, { type: "COMPONENT_SET", key: "set1" }, { type: "COMPONENT", key: "v1" }, "c1", { type: "COMPONENT", key: "gone" }];
  const card = { type: "COMPONENT", name: "Card", key: "local1", id: "2:1", width: 40, height: 20, children: [], componentPropertyDefinitions: { "Content slot#1:0": { type: "SLOT", description: "", preferredValues: pref } } };
  const imported = [];
  figma.root = { children: [pageOf("Card", card)], findAllWithCriteria: () => [card] };
  figma.importComponentSetByKeyAsync = async (k) => { imported.push(k); return k === "set1" ? { type: "COMPONENT_SET", name: "Button" } : null; };
  figma.importComponentByKeyAsync = async (k) => { imported.push(k);
    if (k === "v1") return { type: "COMPONENT", name: "Size=Small", parent: { type: "COMPONENT_SET", name: "Tag" } };
    if (k === "c1") return { type: "COMPONENT", name: "List item", parent: { type: "PAGE" } };
    throw new Error("not published"); };
  const [got] = await collectComponents({ withIcons: false, previews: [], darkModes: async () => [] });
  const slot = got.slots && got.slots["Content slot"];
  ok("a preferred value is named: this file's from the file, another's by import, a variant by its set; one that will not import is null",
    slot && JSON.stringify(slot.preferred) === '["local1","set1","v1","c1","gone"]' && JSON.stringify(slot.preferredNames) === '["Card","Button","Tag","List item",null]'
    && !imported.includes("local1"));
  delete figma.importComponentSetByKeyAsync; delete figma.importComponentByKeyAsync; delete figma.root.findAllWithCriteria;
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
  // 0.87.1/0.87.2: where a style's line can be neither measured nor found drawn, its family's Auto line height is read from
  // text already drawn in that family, no font's metrics named in code; never a rounded guess (review 2026-11-24): each
  // drawn text's whole-pixel height bounds the metric, and a size gets a height only where those bounds fix one
  const inFamily = (family, size, h, x = {}) => ({ characters: "Ab", textAutoResize: "WIDTH_AND_HEIGHT", fontName: { family, style: "Regular" }, fontSize: size, lineHeight: { unit: "AUTO" }, leadingTrim: "NONE", height: h, ...x });
  figma.root = { children: [page("Snapshot (temporary)", [inFamily("Sans", 100, 999)]), page("Card", [inFamily("Sans", 48, 58), inFamily("Sans", 64, 77), inFamily("Sans", 64, 99, { lineHeight: { unit: "PIXELS", value: 99 } }), inFamily("Sans", 80, 58, { leadingTrim: "CAP_HEIGHT" }), inFamily("Serif", 80, 90)])] };
  const range = familyMetric("Sans");
  ok("a family's metric is bounded by every one-line Auto text drawn in it, a fixed line and a trimmed one left out", range && range[0] === 57.5 / 48 && range[1] === 77.5 / 64, JSON.stringify(range));
  ok("…a size those bounds fix gets its whole-pixel height, the one Figma draws", autoLineAt(48, range) === 58 && autoLineAt(16, range) === 19);
  ok("…and a size they do not fix gets none (unmeasured), never a rounded guess", autoLineAt(100, range) === null);
  ok("…and none where nothing is drawn in that family", familyMetric("Mono") === null && autoLineAt(16, null) === null);
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
  const made = vm.runInContext(src + "\n;fileId()", vm.createContext({ figma: { ...figma, root, showUI() {}, ui: { postMessage() {}, onmessage: null }, clientStorage: { getAsync: async () => "", setAsync: async () => {} }, getNodeByIdAsync: async () => null }, console, __html__: "", fetch: () => new Promise(() => {}) }));
  ok("…while the plugin's own run stamps one, once", /^f[0-9a-z]+$/.test(made) && writes.join() === "snapshotFileId" && data.snapshotFileId === made);
}
{
  const ask = (res) => vm.runInContext(src + "\n;reachable()", vm.createContext({ figma, console, fetch: async () => res }));
  ok("a router answering 500 is listening, so its own error is shown", (await ask({ ok: false, status: 500 })) === true && (await ask({ ok: true, status: 200 })) === true);
  const none = vm.runInContext(src + "\n;reachable()", vm.createContext({ figma, console, fetch: async () => { throw new TypeError("Failed to fetch"); } }));
  ok("…and only no answer at all is nobody listening", (await none) === false);
}
// 2026-11-05: a mirrored illustration was recorded as rotation -180, the
// angle Figma reports for a flip, and its code's scaleX(-1) was waived.
const leaf = (relativeTransform, rotation) => ({ name: "Art", type: "RECTANGLE", width: 72, height: 72, x: 0, y: 0, rotation, relativeTransform, boundVariables: {} });
const mirrored = await walk(leaf([[-1, 0, 72], [0, 1, 0]], -180), 1);
ok("a horizontal mirror is a flip on x, not a turn", mirrored.flip === "x" && !("rotation" in mirrored));
ok("…and the turn Figma reports for it is not left unrecorded", unrecorded(leaf([[-1, 0, 72], [0, 1, 0]], -180), mirrored).length === 0);
const upside = await walk(leaf([[1, 0, 0], [0, -1, 72]], 180), 1);
ok("a vertical mirror is a flip on y, not a turn", upside.flip === "y" && !("rotation" in upside));
const c = Math.cos(Math.PI / 6), s = Math.sin(Math.PI / 6);
const turned = await walk(leaf([[c, s, 0], [-s, c, 0]], 30), 1);
ok("a turn without a mirror stays a turn", turned.rotation === 30 && !("flip" in turned));
const both = await walk(leaf([[-c, s, 0], [s, c, 0]], 0), 1);
ok("a mirror and a turn are carried apart", both.flip === "x" && both.rotation === 30);
// 2026-11-10: a rule annotated once on a template's header never reached the screens built on it:
// Figma keeps an annotation on the layer it was written on. A screens run reads the main
// component's layer (the id without its first part) and says where the note came from.
{
  const page = { type: "PAGE", name: "Components" };
  const set = { type: "COMPONENT_SET", name: "Screen", parent: page };
  const variant = { type: "COMPONENT", name: "Fixed height=False", parent: set };
  const header = { id: "1:2433", name: "App header", parent: variant, annotations: [{ labelMarkdown: "Only global actions stay here.", categoryId: "c1" }] };
  const crumb = { id: "I1:2433;1:850", name: "Breadcrumb", parent: header, annotations: [{ labelMarkdown: "Shows how deep the page sits." }] };
  const crumbSet = { type: "COMPONENT", name: "Breadcrumb", parent: page };
  const crumbOwn = { id: "1:850", name: "Breadcrumb", parent: crumbSet, annotations: [{ labelMarkdown: "Truncate long labels." }] };
  const libSet = { type: "COMPONENT_SET", name: "Button", parent: page, remote: true };
  const libLayer = { id: "4:4", name: "Label", parent: { type: "COMPONENT", name: "Size=M", parent: libSet }, annotations: [{ labelMarkdown: "A library's note." }] };
  const byId = new Map([[header.id, header], [crumb.id, crumb], [crumbOwn.id, crumbOwn], [libLayer.id, libLayer]]);
  const f = { ...figma, getNodeByIdAsync: async (id) => byId.get(id) || null, annotations: { getAnnotationCategoriesAsync: async () => [{ id: "c1", label: "Development" }] } };
  const load = (code) => vm.runInContext(code + "\n;({ walk, setWhole: (v) => { walkWhole = v; sourceSeen.clear(); } })", vm.createContext({ figma: f, console, setTimeout, clearTimeout }));
  const lib = load(src);
  const layer = (id, name, annotations) => ({ id, name, type: "FRAME", width: 10, height: 10, x: 0, y: 0, layoutMode: "NONE", boundVariables: {}, children: [], annotations });
  lib.setWhole(true);
  const h = await lib.walk(layer("I15:2054;1:2433", "App header"), 1);
  ok("a screen's instance layer carries its main component's note, its category and where it came from",
    JSON.stringify(h.notes) === JSON.stringify([{ text: "Only global actions stay here.", category: "Development", from: "Components/Screen" }]));
  const c = await lib.walk(layer("I15:2054;1:2433;1:850", "Breadcrumb", [{ labelMarkdown: "Three levels here." }]), 2);
  ok("…its own note first, then every component's, nearest first, each saying which",
    JSON.stringify(c.notes.map((x) => x.text)) === JSON.stringify(["Three levels here.", "Shows how deep the page sits.", "Truncate long labels."]) && c.notes[1].from === "Components/Screen" && c.notes[2].from === "Components/Breadcrumb");
  ok("a note the layer says itself is not said again", (await lib.walk(layer("I15:2054;1:2433", "App header", [{ labelMarkdown: "Only global actions stay here." }]), 1)).notes.length === 1);
  ok("a library component's layer gives none: its own snapshot carries it", !("notes" in (await lib.walk(layer("I15:2054;4:4", "Label"), 1))));
  ok("a layer whose counterpart has another name (a swapped part) takes no note", !("notes" in (await lib.walk(layer("I15:2054;1:2433", "Search bar"), 1))));
  ok("a counterpart not in this file (a library's) takes none", !("notes" in (await lib.walk(layer("I15:2054;9:9", "Toolbar"), 1))));
  lib.setWhole(false);
  ok("a library run reads no component's notes onto its instances", !("notes" in (await lib.walk(layer("I15:2054;1:2433", "App header"), 1))));
  const planted = load(src.replace("if (!walkWhole || typeof n.id", "if (typeof n.id"));
  planted.setWhole(false);
  ok("(planted) without the screens-only guard a library run takes them", "notes" in (await planted.walk(layer("I15:2054;1:2433", "App header"), 1)));
}

// 0.81.0: the facts mode the audit's tokens and icons stages read live (figma-project-audit stages.json),
// run as another plugin runs it: `__html__` shadowed, `FACTS` set, `return __headless()` appended.
{
  const vars = { "V:1": { id: "V:1", name: "Icon/default", remote: false }, "V:2": { id: "V:2", name: "Space/4", remote: false }, "V:3": { id: "V:3", name: "Scratch/only", remote: false } };
  const solid = (bound) => ({ type: "SOLID", visible: true, color: { r: 0, g: 0, b: 0 }, ...(bound ? { boundVariables: { color: { type: "VARIABLE_ALIAS", id: bound } } } : {}) });
  const glyph = (name, fill) => ({ type: "COMPONENT", name, width: 16, visible: true, fills: [], strokes: [], children: [{ type: "VECTOR", name: "v", visible: true, fills: [fill], strokes: [], children: [] }],
    exportAsync: async () => { throw new Error("the facts mode exported an SVG"); } });
  const iconSet = { type: "COMPONENT_SET", name: "plus", children: [glyph("Size=16", solid("V:1")), glyph("Size=24", solid())] };
  for (const k of iconSet.children) k.parent = iconSet;
  const button = { type: "COMPONENT", name: "Button", parent: null, fills: [], strokes: [], effects: [], boundVariables: { itemSpacing: { type: "VARIABLE_ALIAS", id: "V:2" } }, findAll: () => [] };
  // 0.81.2: a component on a page a person marks Scratch binds a token the stored specs never see
  const draft = { type: "COMPONENT", name: "Draft", parent: null, fills: [], strokes: [], effects: [], boundVariables: { itemSpacing: { type: "VARIABLE_ALIAS", id: "V:3" } }, findAll: () => [] };
  const page = (name, sets) => ({ type: "PAGE", name, findAll: (pred) => sets.filter(pred),
    findAllWithCriteria: ({ types }) => (types.includes("COMPONENT") ? sets.flatMap((x) => [x, ...(x.type === "COMPONENT_SET" ? x.children : [])]) : []) });
  const iconPage = page("❖ Icons", [iconSet]), compPage = page("❖ Button", [button]), scratch = page("Scratch", [draft]);
  iconSet.parent = iconPage; button.parent = compPage; draft.parent = scratch;
  const root = { name: "Lib", children: [compPage, iconPage, scratch], getPluginData: () => "",
    findAllWithCriteria: ({ types }) => (types.includes("COMPONENT") ? [button, iconSet, ...iconSet.children, draft] : []) };
  for (const c of [iconSet, ...iconSet.children]) c.findAll = c.findAll || (() => c.children || []);
  const wrote = [];
  const ff = { root, fileKey: "K", loadAllPagesAsync: async () => {}, skipInvisibleInstanceChildren: false,
    variables: { getLocalVariableCollectionsAsync: async () => [], getVariableByIdAsync: async (id) => vars[id] || null, getVariableCollectionByIdAsync: async () => null },
    // 0.81.1: an Auto line height is measured by drawing a text; the facts mode draws nothing
    getLocalTextStylesAsync: async () => [{ id: "S:1", name: "Body", key: "k", fontName: { family: "Inter", style: "Regular" }, fontSize: 16, lineHeight: { unit: "AUTO" }, letterSpacing: { unit: "PERCENT", value: 0 }, boundVariables: {} }],
    // (a refusal alone would pass: the measure falls back to the metric when drawing fails, so each call is counted)
    createText: () => { wrote.push("text"); throw new Error("drew a text"); }, createPage: () => { wrote.push("page"); throw new Error("made a page"); },
    loadFontAsync: async () => { wrote.push("font"); throw new Error("loaded a font to measure"); }, getLocalPaintStylesAsync: async () => [], getLocalEffectStylesAsync: async () => [], getStyleByIdAsync: async () => null };
  const facts = await vm.runInContext("(async () => { const __html__ = undefined; const FACTS = true;\n" + src + "\nreturn __headless(); })()",
    vm.createContext({ figma: ff, __html__: "<ui/>", console, setTimeout, clearTimeout }));
  ok("facts mode: run inside a plugin with a __html__ of its own, the shadow keeps it headless and it answers", facts && facts.fileKey === "K" && Array.isArray(facts.icons));
  ok("…each icon variant with its size, unbound paints and glyph fill, and no SVG",
    JSON.stringify(facts.icons) === JSON.stringify([{ name: "plus", size: 16, unbound: 0, fill: "Icon/default" }, { name: "plus", size: 24, unbound: 1 }]));
  ok("…the icon page and its sets, as a snapshot names them", facts.iconPage === "❖ Icons" && JSON.stringify(facts.iconSets) === JSON.stringify(["plus"]));
  // the icon page's glyph colour reaches the unused check through the icon facts (owns.iconColours), as the stored specs leave the icon page out
  ok("…the variables the components bind, by name, off the icon and scratch pages as the stored specs are, and those components counted", JSON.stringify(facts.used) === JSON.stringify(["Space/4"]) && facts.components === 1, JSON.stringify(facts.used));
  ok("…and skipInvisibleInstanceChildren put back as it was, so the caller's next read sees every layer", ff.skipInvisibleInstanceChildren === false);
  ok("…an Auto line height nothing measures or bounds is recorded unmeasured, with no number guessed", facts.tokens.textStyles.length === 1 && facts.tokens.textStyles[0].lineHeightSource === "unmeasured" && facts.tokens.textStyles[0].lineHeight === null && wrote.length === 0, wrote.join(", "));
  ok("…and the tokens payload a snapshot sends", facts.tokens && facts.tokens._meta.plugin === VERSION && typeof facts.tokens.collections === "object");
}

// 2026-11-22: a text with no style recorded no size or face, so code drew its
// browser's 16px where 12px was drawn; a styled text's are its style's.
{
  const text = (textStyleId) => ({ name: "Label", type: "TEXT", width: 30, height: 16, x: 0, y: 0, characters: "Label", textStyleId, textAlignHorizontal: "LEFT", fontSize: 12, fontName: { family: "Inter", style: "Semi Bold" }, lineHeight: { unit: "PIXELS", value: 16 }, letterSpacing: { unit: "PIXELS", value: 0 }, boundVariables: {} });
  const bare = await walk(text(""), 1);
  ok("a text with no style records its size and face", bare.textStyle === "literal" && bare.fontSize === 12 && bare.fontFamily === "Inter" && bare.fontStyle === "Semi Bold");
  const several = await walk({ ...text(Symbol("mixed")), fontSize: Symbol("mixed"), fontName: Symbol("mixed") }, 1);
  ok("…a text of several styles records none", several.textStyle === "mixed" && !("fontSize" in several) && !("fontFamily" in several));
  // 2026-11-24, measured in Carbon's file: a variable font's text (IBM Plex Sans, `variationSettings`) reads its
  // fontName as mixed with one segment, so 776 texts with no style in three libraries said a size and no face
  const seg = (family, style, start, end) => ({ start, end, fontName: { family, style, variationSettings: { wght: 400 } } });
  const variable = await walk({ ...text(""), fontName: Symbol("mixed"), getStyledTextSegments: () => [seg("IBM Plex Sans", "Regular", 0, 5)] }, 1);
  ok("…a variable font's text, read as mixed in one face, records that face", variable.fontFamily === "IBM Plex Sans" && variable.fontStyle === "Regular");
  const two = await walk({ ...text(""), fontName: Symbol("mixed"), getStyledTextSegments: () => [seg("Inter", "Regular", 0, 2), seg("Inter", "Bold", 2, 5)] }, 1);
  ok("…one truly in two faces still records none", !("fontFamily" in two) && !("fontStyle" in two));
}

// 2026-11-24, the Figma oracle: a text past 400 characters (Carbon's multi-line code snippet, 648) was cut there, and
// the contract kept the cut copy as the layer's content
{
  const long = "x".repeat(1520);
  const walked = await walk({ name: "Code", type: "TEXT", width: 300, height: 400, x: 0, y: 0, characters: long, textStyleId: "", textAlignHorizontal: "LEFT", fontSize: 14, fontName: { family: "IBM Plex Mono", style: "Regular" }, lineHeight: { unit: "AUTO" }, letterSpacing: { unit: "PIXELS", value: 0 }, boundVariables: {} }, 1);
  ok("a text is recorded whole, however long", walked.text === long);
}

// 2026-11-24: a run could not be stopped. Cancel sets a flag the walk reads at
// each component's step; the run stops there, before the next is read.
{
  let reads = 0;
  const comp = (name) => ({ name, type: "COMPONENT", id: name, parent: { type: "PAGE" }, get componentPropertyDefinitions() { reads++; return {}; } });
  figma.root = { children: [{ name: "Chip", type: "PAGE", findAll: (f) => [comp("A"), comp("B")].filter(f) }] };
  vm.runInContext("cancelled = true", ctx);
  const stopped = await collectComponents({ withIcons: false, previews: [], darkModes: async () => [] }).then(() => null, (e) => e);
  vm.runInContext("cancelled = false", ctx);
  ok("a cancelled run stops before the next component, and says it was cancelled", stopped && stopped.constructor.name === "Cancelled" && reads === 0);
}

// 0.88.0: each collection records its default mode by name, which need not be its first; an alias into a collection
// lacking the mode reads that default
{
  const coll = (id, modes, defaultModeId, variableIds) => ({ id, name: id, modes, defaultModeId, variableIds, isExtension: false });
  const theme = coll("Theme", [{ name: "Alt", modeId: "t-a" }, { name: "Base", modeId: "t-b" }], "t-b", ["v1"]);
  const prim = coll("Primitives", [{ name: "One", modeId: "p-1" }, { name: "Two", modeId: "p-2" }], "p-2", ["v2"]);
  const vars = {
    v1: { id: "v1", name: "Fg", key: "k1", scopes: [], variableCollectionId: "Theme", valuesByMode: { "t-a": { type: "VARIABLE_ALIAS", id: "v2" }, "t-b": { type: "VARIABLE_ALIAS", id: "v2" } } },
    v2: { id: "v2", name: "Grey", key: "k2", scopes: [], variableCollectionId: "Primitives", valuesByMode: { "p-1": 1, "p-2": 2 } },
  };
  const page = { type: "PAGE", name: "Page", children: [], findAll: () => [], findAllWithCriteria: () => [] };
  const ff = { root: { name: "Lib", children: [page], getPluginData: () => "", findAllWithCriteria: () => [] }, fileKey: "K",
    variables: { getLocalVariableCollectionsAsync: async () => [theme, prim], getVariableByIdAsync: async (id) => vars[id] || null, getVariableCollectionByIdAsync: async (id) => ({ Theme: theme, Primitives: prim })[id] || null },
    getLocalTextStylesAsync: async () => [], getLocalPaintStylesAsync: async () => [], getLocalEffectStylesAsync: async () => [], getStyleByIdAsync: async () => null };
  const c = vm.createContext({ figma: ff, console, setTimeout, clearTimeout });
  const t = await vm.runInContext(src + "\n;collectTokens()", c);
  ok("a collection records its default mode by name, not its first", t.collections.Theme.defaultMode === "Base" && t.collections.Primitives.defaultMode === "Two");
  ok("…and an alias into a collection without the mode reads its default mode", t.collections.Theme.values.Alt.Fg === 2 && t.collections.Theme.values.Base.Fg === 2);
}

console.log(n + "/" + n + " passed");
