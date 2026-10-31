// Runs the components scanner's checks in node against captured facts, with
// no Figma. The scanner body returns checkFacts when `figma` is not in scope.
//   node skills/figma-components-audit/tests/test-audit.mjs
//
// The fixture is a slice of one real 120-set web library — eight sets, every
// node the walk visits, only the properties the rules read — dumped through
// the bridge on 2026-09-22 and renumbered to illustrative ids. Its expected
// findings are the ones the same scanner raised LIVE on that file the same
// day, so the first case pins the seam to a real run; the rest mutate a copy
// to reach the sites a clean library never fires.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "scanner", "audit.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const checkFacts = await new AsyncFunction(src)();
const FX = JSON.parse(readFileSync(join(here, "fixtures", "library-slice.json"), "utf8"));

let failed = 0, passed = 0;
function expect(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else { failed++; console.log("FAIL " + name + "\n  got  " + JSON.stringify(got) + "\n  want " + JSON.stringify(want)); }
}
const fresh = () => JSON.parse(JSON.stringify(FX));
const run = (fx, opts = {}) => checkFacts({ pages: fx.pages }, opts.tokens || fx.settings.tokens, opts.scales || fx.settings.optionOrder,
  opts.targets || [], async (id) => (id in fx.vars ? fx.vars[id] : null), fx.file);
// Findings as "set | sev rule | text", the e.g. list cut off after the counts.
const rows = (r, set) => r.audited.filter((e) => !set || e.set === set)
  .flatMap((e) => e.candidates.map((c) => e.set + " | " + c.sev + " " + c.rule + " | " + c.text.replace(/ — e\.g\. .*$/, "")));
// The same rows, picked by what a finding is about. A filter on the sentence
// passes vacuously the day the sentence is reworded; a key does not move.
const keyed = (r, set, re) => r.audited.filter((e) => !set || e.set === set)
  .flatMap((e) => e.candidates.filter((c) => re.test(c.key)).map((c) => e.set + " | " + c.sev + " " + c.rule + " | " + c.text.replace(/ — e\.g\. .*$/, "")));
const find = (fx, name) => { for (const p of fx.pages) for (const s of p.sets) if (s.name === name) return s; throw new Error(name); };
const descend = (n, f) => { f(n); if (n.type !== "INSTANCE") for (const c of n.children || []) descend(c, f); };
const paint = (r, g, b) => [{ type: "SOLID", visible: true, opacity: 1, color: { r, g, b } }];
const leaf = (type, name, extra) => Object.assign({ id: "0:0", type, name, visible: true, fills: [], strokes: [], effects: [], opacity: 1, boundVariables: {} }, extra);

// ---- The slice reproduces the live run --------------------------------
let r = await run(fresh());
// Three of the six rows the scanner raised live that day were false — the
// path named the spinner in Loading variants, the chevron in empty inputs, an
// icon that stands alone in Icon-only variants (A83) — and are not expected.
expect("the eight sets raise what the scanner raised live on 2026-09-22, and nothing else", rows(r), [
  'Progress bar | error properties | "Percent" ignores a boolean property in 1 of 3 variants, so setting the property on an instance leaves those unchanged',
  '_Upload area - File item | error properties | "Texts > Error message > Caption" ignores a text property in 1 of 2 variants, so setting the property on an instance leaves those unchanged',
  'Password input | error properties | "Field > Value" ignores a text property in 7 of 14 variants, so setting the property on an instance leaves those unchanged',
]);
expect("a full scan's measures count the walk, and the file facts pass through", r.measures,
  { sets: 8, variants: 183, described: 8, nodes: 1124, groups: 0, hidden: 0, bound: 6479, unbound: 0,
    autoNamed: 0, layers: 574, named: 574, frames: 514, staticFrames: 0, framesAuto: 514, guidable: 0, guided: 0, contrastTotal: 0, contrastPass: 0, coverage: 100,
    collections: 1, variables: 1, modes: "Expanded/Collapsed", pages: 12, textStyles: 0, effectStyles: 0 });
expect("the return shape is the scanner's", Object.keys(r), ["audited", "measures", "ran", "at"]);
expect("a run says which rule families it could exercise", r.ran, ["naming", "structure", "properties", "metadata", "tokens", "accessibility", "states", "schema"]);
r = await run(fresh(), { tokens: { componentPages: FX.settings.tokens.componentPages }, scales: {} });
expect("without a state axis or a recorded scale, the state and order checks are not claimed", r.ran, ["naming", "structure", "properties", "metadata", "tokens", "accessibility"]);

// ---- Scope ------------------------------------------------------------
r = await run(fresh(), { targets: ["Chip", "Progress bar"] });
expect("a scoped run audits the named sets only", r.audited.map((e) => e.set), ["Chip", "Progress bar"]);
expect("and returns no measures, because a partial count is not a library measure", r.measures, null);
r = await run(fresh(), { targets: ["No such set"] });
expect("a scope naming nothing that exists audits nothing", r.audited, []);

// ---- Every finding site, on a mutated copy ----------------------------
// Chip has one variant frame and one text; the plants below each reach one
// site. TOKENS gains the spacing scale and the text role so those branches
// run, and the page filter keeps the section pages it is given.
let fx = fresh();
const tokens = Object.assign({ spacing: [0, 4, 8, 12, 16], textRole: "Text" }, fx.settings.tokens);
fx.pages.find((p) => p.name === "❖ Chip").name = "❖ Chip ";
const chip = find(fx, "Chip"), v0 = chip.children[0];
const vid = Object.keys(fx.vars)[0];
v0.paddingLeft = 13; delete v0.boundVariables.paddingLeft;
v0.paddingRight = 8; delete v0.boundVariables.paddingRight;
v0.itemSpacing = 5; delete v0.boundVariables.itemSpacing; v0.primaryAxisAlignItems = "MIN";
v0.topLeftRadius = 3; delete v0.boundVariables.topLeftRadius;
v0.fills = paint(1, 0, 0); delete v0.boundVariables.fills;
v0.strokes = paint(0, 0, 0); delete v0.boundVariables.strokes; delete v0.boundVariables.strokeWeight;
for (const k of ["strokeTopWeight", "strokeBottomWeight", "strokeLeftWeight", "strokeRightWeight"]) { v0[k] = 1; delete v0.boundVariables[k]; }
let label; descend(v0, (n) => { if (n.type === "TEXT" && !label) label = n; });
label.textStyleId = ""; for (const k of ["fontFamily", "fontSize", "fontStyle"]) delete label.boundVariables[k];
v0.children.push(leaf("FRAME", "Frame 12", { children: [] }));
v0.children.push(leaf("RECTANGLE", "Ghost", { visible: false }));
v0.children.push(leaf("GROUP", "Bundle", { children: [] }));
v0.children.push(leaf("RECTANGLE", "Swatch", { fills: paint(0, 0, 1), boundVariables: { fills: [{ type: "VARIABLE_ALIAS", id: vid }] } }));
v0.children.push(leaf("TEXT", "Caption", { textStyleId: "S:0", fills: paint(0, 0, 1),
  boundVariables: { fills: [{ type: "VARIABLE_ALIAS", id: vid }], fontFamily: { type: "VARIABLE_ALIAS", id: vid }, fontSize: { type: "VARIABLE_ALIAS", id: vid }, fontStyle: { type: "VARIABLE_ALIAS", id: vid } } }));
chip.description = "   ";
chip.name = "Chip  x ";
chip.componentPropertyDefinitions["Ghost#0:99"] = { type: "BOOLEAN" };
// Button - CTA carries the State axis: reverse its options, clone Rest into
// Hover, and turn one Rest frame into a grid with a raw row gap.
const btn = find(fx, "Button - CTA");
btn.componentPropertyDefinitions.State.variantOptions = [...btn.componentPropertyDefinitions.State.variantOptions].reverse();
const rest = btn.children.find((x) => x.name.includes("State=Rest"));
const grid = rest.children[0]; grid.layoutMode = "GRID"; grid.gridRowGap = 4; delete grid.boundVariables.gridRowGap; grid.name = " Grid  frame";
const hover = btn.children.find((x) => x.name === rest.name.replace("State=Rest", "State=Hover"));
hover.children = JSON.parse(JSON.stringify(rest.children));
for (const k of ["fills", "strokes", "effects", "opacity", "visible"]) hover[k] = JSON.parse(JSON.stringify(rest[k]));
fx.vars[vid] = { name: "Effects/Shadow/Blur/16", collection: "Primitive" };
r = await run(fx, { tokens });
expect("every finding site fires once, where it was planted", rows(r, "Chip  x ").concat(rows(r, "Button - CTA"), rows(r, "❖ Chip ")), [
  'Chip  x  | error tokens | ' + v0.name + ' has a raw right padding of 8 (on the spacing scale), so a change to the spacing tokens never reaches it',
  'Chip  x  | error tokens | ' + v0.name + ' has a raw left padding of 13 (off the spacing scale; nearest step 12), so a change to the spacing tokens never reaches it',
  'Chip  x  | error tokens | ' + v0.name + ' has a raw gap of 5 (off the spacing scale; nearest step 4), so a change to the spacing tokens never reaches it',
  'Chip  x  | error tokens | ' + v0.name + ' has a raw top-left radius of 3, so a change to the radius tokens never reaches it',
  'Chip  x  | error tokens | ' + v0.name + " has a raw fill colour, so it ignores the theme's modes and every colour change made in the library",
  'Chip  x  | error tokens | ' + v0.name + " has a raw stroke colour, so it ignores the theme's modes and every colour change made in the library",
  'Chip  x  | error tokens | ' + v0.name + ' has an unbound stroke weight (top, bottom, left, right), so a change to the stroke tokens never reaches it',
  'Chip  x  | error tokens | Label has no text style, so a change to the type tokens never reaches it',
  'Chip  x  | error tokens | Label has an unbound font family, so a change to the type tokens never reaches it',
  'Chip  x  | error tokens | Label has an unbound font size, so a change to the type tokens never reaches it',
  'Chip  x  | error tokens | Label has an unbound font weight, so a change to the type tokens never reaches it',
  'Chip  x  | warning naming | "Frame 12" keeps the name Figma gave it, so the layers panel, Dev Mode and code generated from the file say nothing about what it is',
  'Chip  x  | hygiene structure | "Ghost" is hidden in every variant and no property shows it, so it ships in every instance and nobody can turn it on',
  'Chip  x  | warning structure | "Bundle" is a group, so it cannot hold auto layout, padding or a fill, and it resizes by scaling what it holds',
  "Chip  x  | warning tokens | Swatch takes its fill from Primitive/Effects/Shadow/Blur/16, outside Semantic, so it skips the theme's colour roles and misses a change made there",
  "Chip  x  | warning tokens | Caption takes its fill from Primitive/Effects/Shadow/Blur/16, outside Semantic, so it skips the theme's colour roles and misses a change made there",
  'Chip  x  | warning tokens | Caption is text coloured with Effects/Shadow/Blur/16, not a Text colour, so a change to text colours passes it by and nothing promises its contrast',
  'Chip  x  | error properties | Property "Ghost" is declared but no layer uses it, so the component will not publish while it exists',
  'Chip  x  | error metadata | No description, so people and agents reading the library cannot tell what the component is for',
  'Chip  x  | error naming | Component name "Chip  x " has a space at its start or end, which nobody sees on the canvas and which doubles the component in exports and code',
  'Chip  x  | warning naming | Component name "Chip  x " has a double space, which nobody sees on the canvas and which breaks search and anything matching the component by name',
  'Button - CTA | error tokens |  Grid  frame has a raw row gap of 4, so a change to the spacing tokens never reaches it',
  'Button - CTA | warning naming | Layer " Grid  frame" has a space at its start or end, which nobody sees in the layers panel and which breaks anything matching the layer by name',
  'Button - CTA | hygiene naming | Layer " Grid  frame" has a double space, which nobody sees in the layers panel and which breaks anything matching the layer by name',
  'Button - CTA | error states | ' + hover.name + ' looks identical to its Rest sibling, so people get no sign the component is in that state',
  'Button - CTA | warning schema | State lists Loading · Press · Hover · Focus · Rest, out of the recorded order Rest · Focus · Hover · Press · Loading, so its picker reads differently from every other component with State',
  '❖ Chip  | warning naming | Page name "❖ Chip " has a space at its start or end, which nobody sees in the page list and which breaks anything matching the page by name',
]);
expect("the token measures count the planted raw values, not the deduped rows", [r.measures.unbound, r.measures.groups, r.measures.hidden], [12, 1, 1]);
// Every finding says what it is about, so the row writer can find it again
// after its wording changes. Path-keyed where a layer is the subject.
const allCands = r.audited.flatMap((e) => e.candidates);
expect("every candidate carries a key", allCands.filter((c) => !c.key).map((c) => c.text), []);
// And both halves (design-standard rule 10): what goes wrong, and the fix.
// Asserted as fields, so a check added without its fix fails here instead of
// shipping a row that tells the reader to "fix it in Figma".
expect("every candidate carries advice, and the advice is not the finding restated",
  allCands.filter((c) => !c.advice || !String(c.advice).trim() || c.advice === c.text).map((c) => c.key), []);
expect("a token key names the property and the layer path, not the wording",
  allCands.filter((c) => c.text.startsWith(v0.name + " has a raw left padding of 13")).map((c) => c.key), ["tokens|paddingLeft|/"]);
expect("a property key names the property, not the sentence about it",
  r.audited.find((e) => e.set === "Chip  x ").candidates.filter((c) => c.rule === "properties").map((c) => c.key), ["properties|unused|Ghost"]);
expect("a wired key carries the layer's identity and kind, never its counts",
  r.audited.find((e) => e.set === "Password input").candidates.map((c) => c.key), ["properties|wired|characters|Field > Value|TEXT"]);

// ---- A list of semantic collections admits each of them ---------------
r = await run(fx, { tokens: Object.assign({}, tokens, { semantic: [tokens.semantic, "Primitive"] }) });
expect("a fill from any listed semantic collection is not raised",
  keyed(r, "Chip  x ", /^tokens\|fill-collection\|/), []);

// ---- A missing rule skips its check ------------------------------------
r = await run(fx, { tokens: { componentPages: tokens.componentPages }, scales: {} });
const t = rows(r, "Chip  x ").concat(rows(r, "Button - CTA"));
const tk = keyed(r, "Chip  x ", /./).concat(keyed(r, "Button - CTA", /./));
expect("no spacing scale: raw padding is raised without an on/off-scale verdict", keyed(r, "Chip  x ", /^tokens\|padding/).map((x) => x.split("| ")[2]),
  [v0.name + " has a raw right padding of 8, so a change to the spacing tokens never reaches it", v0.name + " has a raw left padding of 13, so a change to the spacing tokens never reaches it"]);
expect("no semantic collection, no text role, no state axis, no scale: those checks stay silent",
  keyed(r, "Chip  x ", /^(tokens\|(fill-collection|text-role)|states\||schema\|order\|)/).concat(keyed(r, "Button - CTA", /^(tokens\|(fill-collection|text-role)|states\||schema\|order\|)/)), []);

// ---- The walk stops at an instance ------------------------------------
fx = fresh();
let inst; descend(find(fx, "Chip").children[0], (n) => { if (n.type === "INSTANCE" && !inst) inst = n; });
inst.children = [leaf("RECTANGLE", "Rectangle 7", { fills: paint(1, 0, 0), textStyleId: "" })];
r = await run(fx);
expect("a raw fill and a default name inside an instance are the main component's, not this set's", rows(r, "Chip"), []);

// ---- The page filter is a rule -----------------------------------------
fx = fresh();
r = await run(fx, { tokens: Object.assign({}, fx.settings.tokens, { componentPages: "^❖ Chip$" }) });
expect("componentPages narrows the walk to matching pages", r.audited.map((e) => e.set), ["Chip"]);
r = await run(fx, { tokens: Object.assign({}, fx.settings.tokens, { excludeSections: ["🔷 INPUTS"] }) });
expect("an excluded section drops every page after its header", r.audited.map((e) => e.set), ["Button - CTA", "Menu button", "Chip", "Progress bar"]);

// ---- A layer's identity is its path and what it is (A83) ---------------
// Three genuine misses, each the same layer in every variant it exists in.
fx = fresh();
let stripped = 0;
for (const v of find(fx, "Button - CTA").children) if (v.name.includes("Size=Small"))
  descend(v, (n) => { if (n.type === "TEXT" && n.componentPropertyReferences && n.componentPropertyReferences.characters) { delete n.componentPropertyReferences.characters; stripped++; } });
let forgot = 0;
for (const v of find(fx, "Autocomplete input").children) if (v.name.includes("Value=True") && v.name.includes("State=Focus")) {
  const ic = v.children.find((c) => c.name === "Field").children.find((c) => c.name === "Icon container");
  if (ic.componentPropertyReferences && ic.componentPropertyReferences.visible) { delete ic.componentPropertyReferences.visible; forgot++; }
}
let wrapped = 0;
for (const v of find(fx, "Tab bar - Tab item").children) {
  const content = v.children.find((c) => c.name === "Content"); if (!content) continue;
  const ic = content.children.find((c) => c.name === "Icon container"); if (!ic) continue;
  const ref = ic.componentPropertyReferences && ic.componentPropertyReferences.visible; if (!ref) continue;
  delete ic.componentPropertyReferences.visible; wrapped++;
  ic.type = "FRAME"; ic.boundVariables = {};
  ic.children = [leaf("INSTANCE", "Icon", { componentPropertyReferences: wrapped <= 6 ? { visible: ref } : {}, children: [leaf("VECTOR", "Vector")] })];
}
expect("the plants took", [stripped, forgot, wrapped], [15, 2, 10]);
r = await run(fx);
expect("a layer that is the same in every variant still fires when some forget it", keyed(r, null, /^properties\|wired\|/).map((x) => x.replace(/, so setting the property on an instance leaves those unchanged$/, "")), [
  'Button - CTA | error properties | "Main container > Content > Label container > Label" ignores a text property in 15 of 45 variants',
  'Progress bar | error properties | "Percent" ignores a boolean property in 1 of 3 variants',
  'Autocomplete input | error properties | "Field > Icon container" ignores a boolean property in 2 of 7 variants',
  '_Upload area - File item | error properties | "Texts > Error message > Caption" ignores a text property in 1 of 2 variants',
  'Password input | error properties | "Field > Value" ignores a text property in 7 of 14 variants',
  'Tab bar - Tab item | error properties | "Content > Icon container > Icon" ignores a boolean property in 4 of 10 variants',
]);

// ---- The four the prose walk had, and the collection key (2.12.1) ------
// Nearest step, the mechanism-sized padding, a text role on a shape, the
// shorthand-only stroke weight, and a binding from a collection outside the
// allowed keys. Each plant fires once; each neighbour beside it must not.
{
  const alias = (id) => ({ type: "VARIABLE_ALIAS", id });
  const stroke = [{ type: "SOLID", visible: true, opacity: 1, color: { r: 0, g: 0, b: 0 } }];
  const v = leaf("COMPONENT", "Size=md", { layoutMode: "HORIZONTAL", paddingTop: 96, paddingBottom: 12, paddingLeft: 0, paddingRight: 0,
    itemSpacing: 0, topLeftRadius: 6, children: [
      leaf("RECTANGLE", "Dot", { fills: paint(0, 0, 0), boundVariables: { fills: [alias("good")] } }),
      leaf("TEXT", "Label", { textStyleId: "S:1", fills: paint(0, 0, 0), boundVariables: { fills: [alias("good")], fontFamily: alias("good"), fontSize: alias("good"), fontStyle: alias("good") } }),
      leaf("VECTOR", "Check", { strokes: stroke, strokeWeight: 1.5, boundVariables: { strokes: [alias("good")] } }),
      leaf("VECTOR", "Tick", { strokes: stroke, strokeWeight: 1.5, boundVariables: { strokes: [alias("good")], strokeWeight: alias("good") } }),
      leaf("FRAME", "Leak", { fills: paint(0, 0, 0), boundVariables: { fills: [alias("bad")] } }),
    ] });
  const set = { id: "0:1", type: "COMPONENT_SET", name: "Probe", description: "A probe set for new token rules.", componentPropertyDefinitions: { Size: { type: "VARIANT", variantOptions: ["md"] } }, children: [v] };
  const vars = { good: { name: "Colour/Text/strong", collection: "Semantic", key: "k-good" }, bad: { name: "Colour/Background/x", collection: "Other", key: "k-bad" } };
  const T = { spacing: [0, 4, 8, 16, 32], radius: [0, 4, 8], textRole: "Text", allowedKeys: ["k-good"] };
  const go = (t) => checkFacts({ pages: [{ name: "Page", id: "0:0", sets: [set] }] }, t, {}, [], async (id) => vars[id] || null, FX.file);
  const tok = async (t) => rows(await go(t)).filter((x) => x.includes(" tokens | "));
  expect("the scale note names the nearest step, a big off-scale padding is a review, a shape on a text role and a shorthand-only stroke weight fire, and a foreign collection key fires", await tok(T), [
    "Probe | review tokens | Size=md has a raw top padding of 96 (off the spacing scale; nearest step 32), which may drive a fill (a progress bar or slider) rather than space anything",
    "Probe | error tokens | Size=md has a raw bottom padding of 12 (off the spacing scale; nearest step 8), so a change to the spacing tokens never reaches it",
    "Probe | error tokens | Size=md has a raw top-left radius of 6 (off the radius scale; nearest step 4), so a change to the radius tokens never reaches it",
    "Probe | warning tokens | Dot (rectangle) is coloured with Colour/Text/strong, a Text colour, so a change meant for text recolours this shape too",
    "Probe | error tokens | Check (vector) has an unbound stroke weight of 1.5, so a change to the stroke tokens never reaches it",
    "Probe | warning tokens | Leak binds its fill to Other/Colour/Background/x, from a library this project does not use, so it changes or breaks when that library does",
  ]);
  expect("and the advice names the step to bind, or asks the mechanism question",
    (await go(T)).audited[0].candidates.filter((c) => /^tokens\|padding/.test(c.key)).map((c) => c.advice), [
    "If the padding drives a fill, record it as a mechanism; if it spaces content, bind it to a spacing variable.",
    "Bind the bottom padding to the nearest spacing step, 8, or record why it is 12."]);
  expect("without the settings, none of the new notes or checks runs (negative)", await tok({}), [
    "Probe | error tokens | Size=md has a raw top padding of 96, so a change to the spacing tokens never reaches it",
    "Probe | error tokens | Size=md has a raw bottom padding of 12, so a change to the spacing tokens never reaches it",
    "Probe | error tokens | Size=md has a raw top-left radius of 6, so a change to the radius tokens never reaches it",
    "Probe | error tokens | Check (vector) has an unbound stroke weight of 1.5, so a change to the stroke tokens never reaches it",
  ]);
}

// ---- The collection-key check over the real slice (2.13.1) ------------
// The slice's variables carry collection keys, so the control run can fire:
// all four keys allowed raises nothing new; the Semantic key left out makes
// the slice's own Semantic bindings off-library, and only those. Without keys
// on the slice's variables the second half could not fire.
{
  const allKeys = ["k-semantic", "k-primitive-base", "k-primitive", "k-components"];
  const withKeys = (k) => ({ tokens: Object.assign({}, FX.settings.tokens, { allowedKeys: k }) });
  const offLib = (r) => keyed(r, null, /^tokens\|off-library\|/);
  expect("over the real slice with every collection key allowed, nothing beyond the three known rows",
    rows(await run(fresh(), withKeys(allKeys))).length, 3);
  const planted = offLib(await run(fresh(), withKeys(allKeys.slice(1))));
  expect("with the Semantic key not allowed, the slice's real Semantic bindings fire off-library, and nothing else does",
    planted.length > 0 && planted.every((x) => x.includes(" to Semantic/")), true);
}

// ---- Sizes (figma-standard rule 6) ----------------------------------------------
{
  const fx = fresh(); const SC = Object.assign({}, fx.settings.optionOrder, { Size: ["2xl", "xl", "lg", "md", "sm", "xs", "2xs"] });
  const chip = find(fx, "Chip");
  chip.componentPropertyDefinitions["Icon size"] = { type: "VARIANT", variantOptions: ["16", "32"] };
  chip.children.forEach((v, i) => { const o = i % 2 ? "32" : "16"; v.name += ", Icon size=" + o; v.width = 24; v.height = o === "16" ? 16 : 24; if (o === "16") v.width = 16; });
  const sized = (name, h) => { const s = find(fx, name); s.componentPropertyDefinitions = { Size: { type: "VARIANT", variantOptions: ["md"] } }; s.children.forEach((v) => { v.name = "Size=md"; v.height = h; v.width = 80; }); };
  sized("Button - CTA", 40); sized("Menu button", 40); sized("Tab bar - Tab item", 36);
  const TK = Object.assign({}, fx.settings.tokens, { sizeAxis: "Size", sizeAxisMatch: "[Ss]ize", sizeShared: true });
  const r27 = await run(fx, { scales: SC, tokens: TK });
  expect("figma-standard rule 6: a size property not named Size, values off the scale, and a numeric size that draws another size",
    rows(r27, "Chip").filter((x) => /size/i.test(x)),
    ['Chip | warning schema | The size property is named "Icon size", not the recorded "Size", so it does not line up with the sizes of other components',
     'Chip | warning schema | Icon size options 16 · 32 are not on the recorded size scale (2xl · xl · lg · md · sm · xs · 2xs), so a size picked here means something different elsewhere',
     'Chip | error schema | Icon size=32 draws 24px, so its name promises a size it does not have']);
  expect("figma-standard rule 6's ideal: the set drawing a size name off the majority height is asked, the others are not",
    r27.audited.flatMap((e) => e.candidates.filter((c) => c.key === "schema|size-shared|md").map((c) => e.set + " | " + c.text)),
    ["Tab bar - Tab item | Size=md is 36px here and 40px in 2 other components, so components of one size do not line up side by side"]);
  // Agnostic: without the size settings no size check runs at all.
  const none = await run(fx, { scales: SC });
  expect("without sizeAxis in the settings, no size finding is raised", rows(none).filter((x) => /size/i.test(x) && /schema/.test(x)), []);
  // The steps a component uses run unbroken: xl, md, sm, 2xs skips lg and xs.
  { const t = find(fx, "Button - CTA"); const opts = ["xl", "md", "sm", "2xs"]; t.componentPropertyDefinitions = { Size: { type: "VARIANT", variantOptions: opts } }; t.children.forEach((v, i) => { v.name = "Size=" + opts[i % 4]; });
    const gap = await run(fx, { scales: SC, tokens: TK });
    expect("figma-standard rule 6: a component's sizes that skip a step are raised, naming the missing steps",
      gap.audited.flatMap((e) => e.candidates.filter((c) => /size-gap/.test(c.key)).map((c) => e.set + " | " + c.text)),
      ["Button - CTA | Size skips lg · xs between xl and 2xs, so people cannot pick a size its neighbours offer"]);
    t.componentPropertyDefinitions.Size.variantOptions = ["lg", "md", "sm", "xs"]; t.children.forEach((v, i) => { v.name = "Size=" + ["lg", "md", "sm", "xs"][i % 4]; });
    const run2 = await run(fx, { scales: SC, tokens: TK });
    expect("and an unbroken run is not", run2.audited.flatMap((e) => e.candidates.filter((c) => /size-gap/.test(c.key))).length, 0); }
  const noShare = await run(fx, { scales: SC, tokens: Object.assign({}, TK, { sizeShared: false }) });
  expect("without sizeShared, the shared-value review is not raised", noShare.audited.flatMap((e) => e.candidates.filter((c) => /size-shared/.test(c.key))).length, 0);
}
// ---- figma-standard rule 1: a True/False axis lists its default first; State last, Disabled before it --
{
  const fx = fresh(); const s = find(fx, "Chip");
  s.componentPropertyDefinitions["Dense"] = { type: "VARIANT", variantOptions: ["True", "False"], defaultValue: "False" };
  s.componentPropertyDefinitions["Wide"] = { type: "VARIANT", variantOptions: ["True", "False"], defaultValue: "True" };
  expect("figma-standard rule 1: a True/False axis whose default is not first is raised; one listing its default first is not",
    keyed(await run(fx), "Chip", /^schema\|bool-default\|/), ["Chip | warning schema | Dense lists True · False, putting its default, False, second, so the picker leads with the option an instance does not start on"]);
  const p = find(fx, "Password input"); const TK = Object.assign({}, fx.settings.tokens, { disabledAxis: "Disabled" });
  const d = p.componentPropertyDefinitions; const reordered = {}; for (const k of ["State", "Hidden", "Disabled", "Validation"]) reordered[k] = d[k]; for (const k of Object.keys(d)) if (!(k in reordered)) reordered[k] = d[k];
  p.componentPropertyDefinitions = reordered;
  expect("and an axis order with State first and Disabled apart from it is raised twice",
    keyed(await run(fx, { tokens: TK }), "Password input", /^schema\|axis-order\|/).length, 2);
}
// ---- figma-standard rule 18: an acronym keeps its capitals in a property name --
{
  const fx = fresh(); const s = find(fx, "Chip");
  for (const k of ["Show AM-PM", "Show AI badge", "Show Badge"]) s.componentPropertyDefinitions[k + "#0:9"] = { type: "BOOLEAN", defaultValue: false };
  const TK = Object.assign({}, fx.settings.tokens, { propertyCase: "sentence" });
  expect("property naming: an acronym keeps its capitals (figma-standard rule 18)",
    keyed(await run(fx, { tokens: TK }), "Chip", /^naming\|prop-case\|/), ['Chip | preference naming | Property "Show Badge" is not in sentence case, so it reads unlike the rest of the properties panel']);
}
// ---- figma-standard rule 38: text set by override on a nested instance with variants --
{
  const fx = fresh(); const s = find(fx, "Chip"); const v = s.children[0];
  const itemSet = { type: "COMPONENT_SET", name: "Tree item", children: [{}, {}] };
  const single = { type: "COMPONENT_SET", name: "Badge", children: [{}] };
  v.children.push(leaf("INSTANCE", "Item", { overrides: [{ id: "0:1", overriddenFields: ["characters"] }], mainComponent: { parent: itemSet }, children: [] }));
  v.children.push(leaf("INSTANCE", "Count", { overrides: [{ id: "0:2", overriddenFields: ["characters"] }], mainComponent: { parent: single }, children: [] }));
  v.children.push(leaf("INSTANCE", "Other", { overrides: [{ id: "0:3", overriddenFields: ["fills"] }], mainComponent: { parent: itemSet }, children: [] }));
  expect("figma-standard rule 38: a text override on a nested instance whose set has variants is raised; one on a single-variant set or a fill override is not",
    keyed(await run(fx), "Chip", /^overrides\|nested-text\|/), ['Chip | review structure | "Item" sets its text, by override or its own property, on an instance of Tree item, so the text is lost whenever that instance switches variant']);
}
// ---- figma-standard rule 34: a layer a sibling variant shows is variant-driven, not dead --
{
  const fx = fresh(); const s = find(fx, "Chip"); const [v0, v1] = s.children;
  v0.children.push(leaf("FRAME", "Spinner", { visible: false, children: [] })); v1.children.push(leaf("FRAME", "Spinner", { visible: true, children: [] }));
  v0.children.push(leaf("FRAME", "Ghost", { visible: false, children: [] })); v1.children.push(leaf("FRAME", "Ghost", { visible: false, children: [] }));
  expect("figma-standard rule 34: a layer hidden in every variant is raised; one a sibling variant shows is not",
    keyed(await run(fx), "Chip", /^structure\|hidden\|/).map((x) => x.split(" | ")[2]), ['"Ghost" is hidden in every variant and no property shows it, so it ships in every instance and nobody can turn it on']);
}
// ---- figma-standard rule 25: a private part's missing description is hygiene --
{
  const fx = fresh(); const TK = Object.assign({}, fx.settings.tokens, { internalPrefix: "_" });
  const pub = find(fx, "Chip"), priv = find(fx, "_Upload area - File item"); pub.description = ""; priv.description = "";
  const r25 = await run(fx, { tokens: TK });
  expect("figma-standard rule 25: no description is an error on a public component and hygiene on a private part",
    [keyed(r25, "Chip", /^metadata\|description$/).map((x) => x.split(" | ").slice(0, 2).join(" | ")), keyed(r25, "_Upload area - File item", /^metadata\|description$/).map((x) => x.split(" | ").slice(0, 2).join(" | "))],
    [["Chip | error metadata"], ["_Upload area - File item | hygiene metadata"]]);
}
// ---- figma-standard rule 3: Disabled sits immediately after its Rest sibling --
{
  const fx = fresh(); const TK = Object.assign({}, fx.settings.tokens, { disabledAxis: "Disabled" });
  const order = async () => (await run(fx, { tokens: TK })).audited.flatMap((e) => e.candidates.filter((c) => /disabled-order/.test(c.key)).map((c) => e.set + " | " + c.text));
  // The library the slice comes from draws Button - CTA and Menu button with Disabled after Loading: real findings, first seen 2026-10-08.
  const live = await order();
  expect("figma-standard rule 3: the slice's sets that put Disabled last are raised, and Password input, which keeps it beside Rest, is not",
    [live.filter((x) => x.startsWith("Button - CTA")).length, live.filter((x) => x.startsWith("Menu button")).length, live.filter((x) => x.startsWith("Password input")).length], [9, 1, 0]);
  const s = find(fx, "Password input"); const [d] = s.children.splice(1, 1); s.children.splice(3, 0, d);
  expect("and a Disabled variant moved after Hover is raised, naming its sibling",
    (await order()).filter((x) => x.startsWith("Password input")), ["Password input | The Disabled=True variant (Hidden=True, Validation=None) is not immediately after its State=Rest sibling, so the grid no longer pairs each variant with its disabled form"]);
  expect("without disabledAxis in the settings, no order finding is raised",
    (await run(fx)).audited.flatMap((e) => e.candidates.filter((c) => /disabled-order/.test(c.key))).length, 0);
}
// ---- The state check follows the recorded state axis, whatever it is called --
{
  const fx = fresh(); const s = find(fx, "Password input");
  const defs = s.componentPropertyDefinitions; defs.Status = defs.State; delete defs.State;
  for (const v of s.children) v.name = v.name.replace("State=", "Status=");
  const restV = s.children.find((v) => /Hidden=True, Validation=None, Disabled=False, Status=Rest/.test(v.name));
  const hoverI = s.children.findIndex((v) => /Hidden=True, Validation=None, Disabled=False, Status=Hover/.test(v.name));
  s.children[hoverI] = Object.assign(JSON.parse(JSON.stringify(restV)), { name: s.children[hoverI].name });
  const SC = Object.assign({}, fx.settings.optionOrder, { Status: fx.settings.optionOrder.State });
  const renamed = await run(fx, { scales: SC, tokens: Object.assign({}, fx.settings.tokens, { stateAxis: "Status" }) });
  expect("a state axis named otherwise still gets the renders-nothing check", keyed(renamed, "Password input", /^states\|/),
    ["Password input | error states | Hidden=True, Validation=None, Disabled=False, Status=Hover looks identical to its Rest sibling, so people get no sign the component is in that state"]);
}
// ---- Property names from the settings (figma-standard rule 21) ----------------------
{
  const fx = fresh();
  const TK = Object.assign({}, fx.settings.tokens, { booleanPrefix: "Show ", textPropertyAvoid: " text", textPropertyExceptions: ["Helper text"], swapAvoid: " swap", propertyCase: "sentence" });
  const named = await run(fx, { tokens: TK });
  expect("a bare boolean and a text property ending in text are raised from the settings",
    keyed(named, "Chip", /^naming\|prop-/),
    ['Chip | preference naming | Text property "Label text" ends in "text", a word the properties panel already shows, so its names read unlike the rest',
     'Chip | preference naming | Boolean property "Icon" does not start with "Show", so it does not read as an on-off switch beside the others']);
  const plain = await run(fx);
  expect("and without those settings no property name is raised", keyed(plain, null, /^naming\|prop-/), []);
  const st = fresh(); const cs = find(st, "Chip");
  cs.componentPropertyDefinitions["AI#9:1"] = { type: "BOOLEAN", defaultValue: false };
  cs.children.forEach((v) => v.children.push(leaf("FRAME", "AI stroke", { componentPropertyReferences: { visible: "AI#9:1" } })));
  expect("a bare boolean that switches a style, revealing no text, instance or slot, is not raised (figma-standard rule 21)",
    keyed(await run(st, { tokens: TK }), "Chip", /^naming\|prop-boolean\|AI$/), []);
  // figma-standard rule 21: a state is a bare word; "Has" is for a variant that reflects content
  const ih = fresh(); const hs = find(ih, "Chip");
  Object.assign(hs.componentPropertyDefinitions, {
    "Is open": { type: "VARIANT", variantOptions: ["False", "True"] },
    "Has value": { type: "VARIANT", variantOptions: ["False", "True"] },
    "Has border#9:2": { type: "BOOLEAN", defaultValue: false },
    "Has badge#9:3": { type: "BOOLEAN", defaultValue: false } });
  hs.children.forEach((v) => v.children.push(leaf("FRAME", "Border", { componentPropertyReferences: { visible: "Has border#9:2" } }),
    leaf("INSTANCE", "Badge", { componentPropertyReferences: { visible: "Has badge#9:3" }, mainComponent: { name: "Badge", parent: null }, children: [] })));
  const ihr = await run(ih, { tokens: TK });
  expect("figma-standard rule 21: \"Is open\" and a style boolean \"Has border\" take the bare word; \"Has value\" on a variant stands",
    [keyed(ihr, "Chip", /^naming\|prop-state\|/), ihr.audited.find((e) => e.set === "Chip").candidates.filter((c) => /^naming\|prop-state\|/.test(c.key)).map((c) => c.advice)],
    [['Chip | preference naming | Property "Is open" starts with "Is", so it reads unlike the bare states beside it (Disabled, Selected, Open)',
      'Chip | preference naming | Property "Has border" starts with "Has", so it reads unlike the bare states beside it (Disabled, Selected, Open)'],
     ['Rename it "Open".', 'Rename it "Border".']]);
  expect("a revealing boolean named \"Has badge\" is told to take Show, without the Has",
    ihr.audited.find((e) => e.set === "Chip").candidates.filter((c) => c.key === "naming|prop-boolean|Has badge").map((c) => c.advice), ['Rename it "Show badge".']);
  expect("and without booleanPrefix neither is raised", keyed(await run(ih), "Chip", /^naming\|prop-(state|boolean)\|/), []);
}
// ---- overlayComponents: an overlay part fills its host, locked --------------------
{
  const fx = fresh(); const s = find(fx, "Chip"); const v = s.children[0]; Object.assign(v, { width: 100, height: 32 });
  const SL = { name: "State layer", parent: null };
  const ok = { mainComponent: SL, locked: true, constraints: { horizontal: "STRETCH", vertical: "STRETCH" }, x: 0, y: 0, width: v.width, height: v.height };
  v.children.push(leaf("INSTANCE", "State layer", ok));
  const TK = Object.assign({}, fx.settings.tokens, { overlayComponents: ["State layer"] });
  expect("overlayComponents: a locked, stretched state layer at 0,0 and its parent's size is not raised",
    keyed(await run(fx, { tokens: TK }), "Chip", /^structure\|overlay\|/), []);
  const b = fresh(); const bv = find(b, "Chip").children[0]; Object.assign(bv, { width: 100, height: 32 });
  bv.children.push(leaf("INSTANCE", "State layer", Object.assign({}, ok, { locked: false, constraints: { horizontal: "SCALE", vertical: "SCALE" }, x: -1, width: bv.width + 4, height: bv.height })));
  const r = keyed(await run(b, { tokens: TK }), "Chip", /^structure\|overlay\|/);
  expect("and one unlocked, scaled, off 0,0 and oversized is raised once, naming each fault", r.length === 1 && /unlocked/.test(r[0]) && /not stretched/.test(r[0]) && /not at 0,0/.test(r[0]) && /not the size of its parent/.test(r[0]), true);
  expect("without overlayComponents nothing is raised", keyed(await run(b), "Chip", /^structure\|overlay\|/), []);
}
// ---- figma-standard rule 32: text contrast against its surface (WCAG 1.4.3) --
{
  const fx = fresh(); const s = find(fx, "Chip"); const v = s.children[0];
  v.children.push(leaf("TEXT", "Pale", { fills: paint(0.8, 0.8, 0.8), fontSize: 14 }));
  v.children.push(leaf("TEXT", "Ink", { fills: paint(0.1, 0.1, 0.1), fontSize: 14 }));
  v.children.push(leaf("TEXT", "Big grey", { fills: paint(0.5, 0.5, 0.5), fontSize: 28 }));
  const r = await run(fx);
  expect("figma-standard rule 32: text under 4.5:1 on its opaque surface is raised; dark text and large text over 3:1 are not",
    keyed(r, "Chip", /^accessibility\|contrast\|/), ['Chip | error accessibility | Text "Pale" has 1.3:1 contrast against its surface, below the 4.5:1 minimum, so many people cannot read it, in 1 variant']);
  expect("and the measure counts every text layer judged and every pass", [r.measures.contrastTotal, r.measures.contrastPass], [3, 2]);
  const d = fresh(); const ds = find(d, "Chip"); ds.children[0].name = "Feedback=Neutral, Disabled=True";
  ds.children[0].children.push(leaf("TEXT", "Pale", { fills: paint(0.8, 0.8, 0.8), fontSize: 14 }));
  expect("disabled text is exempt (WCAG 1.4.3)", rows(await run(d, { tokens: Object.assign({}, d.settings.tokens, { disabledAxis: "Disabled" }) }), "Chip").filter((x) => / accessibility \| Text .* contrast/.test(x)), []);
}
// ---- figma-standard rule 33: a frame that holds layers uses auto layout --
{
  const fx = fresh(); const v = find(fx, "Chip").children[0];
  v.children.push(leaf("FRAME", "Overlay", { layoutMode: "NONE", children: [leaf("RECTANGLE", "Scrim")] }));
  v.children.push(leaf("FRAME", "Spacer", { layoutMode: "NONE", children: [] }));
  const r = await run(fx);
  expect("figma-standard rule 33: a frame holding layers without auto layout is a review; an empty frame is not raised",
    keyed(r, "Chip", /^structure\|no-autolayout\|/), ['Chip | review structure | Frame "Overlay" has no auto layout, so its layers stay where they were drawn when text grows, and code read from the file gets fixed positions']);
}
// ---- figma-standard rule 10: every automatic layer name, not only a frame's --
{
  const fx = fresh(); const v = find(fx, "Chip").children[0];
  v.children.push(leaf("RECTANGLE", "Line 3")); v.children.push(leaf("RECTANGLE", "Image"));
  const r = await run(fx);
  expect("figma-standard rule 10: \"Line 3\" is an automatic name; a chosen \"Image\" is not", keyed(r, "Chip", /^naming\|default\|/), ['Chip | warning naming | "Line 3" keeps the name Figma gave it, so the layers panel, Dev Mode and code generated from the file say nothing about what it is']);
  expect("and the measure counts it", r.measures.autoNamed, 1);
}
// ---- figma-standard rule 25: Usage, Don't and Code gen notes; a slot part owes none --
{
  const fx = fresh(); const s = find(fx, "Chip");
  s.description = "A chip filters a list.\n\nUsage\n- Filter results\n\nDon't\n- Use for actions: use a Button";
  fx.pages.find((p) => p.sets.includes(s)).sets.push(leaf("COMPONENT", "Chip - Item", { description: "One option in a chip group.", componentPropertyDefinitions: {}, children: [] }));
  s.children[0].children.push(leaf("SLOT", "Items", { children: [leaf("INSTANCE", "Item", { mainComponent: { name: "Chip - Item", parent: null }, children: [] })] }));
  const TK = Object.assign({}, fx.settings.tokens, { internalPrefix: "_" });
  const r = await run(fx, { tokens: TK });
  expect("figma-standard rule 25: a description with Usage and Don't asks only for Code gen notes",
    keyed(r, "Chip", /^metadata\|guidance/), ["Chip | review metadata | The description has no Code gen notes section, so code generated from the library has to guess how the component is built"]);
  expect("a slot part (its family's name, placed in a SLOT) is audited and asked for no section",
    [r.audited.some((e) => e.set === "Chip - Item"), keyed(r, "Chip - Item", /^metadata\|guidance/)], [true, []]);
  expect("without the private prefix the check does not run", keyed(await run(fx), "Chip", /^metadata\|guidance/), []);
}
// ---- a part is decided by where it is used, not by its name --
{
  const fx = fresh(); const s = find(fx, "Chip");
  const TK = Object.assign({}, fx.settings.tokens, { internalPrefix: "_" });
  const part = (name) => leaf("COMPONENT", name, { description: "A small part that marks one chip in a group of chips.", componentPropertyDefinitions: {}, children: [] });
  const use = (name) => leaf("INSTANCE", name, { mainComponent: { name, parent: null }, children: [] });
  fx.pages.find((p) => p.sets.includes(s)).sets.push(part("Chip preview item"), part("Chip badge"));
  s.children[0].children.push(use("Chip preview item"), use("Chip badge"));
  fx.pages.push({ name: "❖ Card", sets: [leaf("COMPONENT", "Card", { description: "A card.", componentPropertyDefinitions: {}, children: [use("Chip badge")] })] });
  const r = await run(fx, { tokens: TK });
  expect("a part used only inside a component on its own page is audited and owes no section, whatever its name",
    [r.audited.some((e) => e.set === "Chip preview item"), keyed(r, "Chip preview item", /^metadata\|guidance/)], [true, []]);
  expect("a part also used on another page is a component of its own and owes them", keyed(r, "Chip badge", /^metadata\|guidance$/).length, 1);
}
// ---- figma-standard rule 25: a placeholder description (moved from probes.js FCA.metadata) --
{
  const META = { descriptionPlaceholder: "^(todo|tbd|wip|lorem)", minDescription: 12 };
  const desc = async (text, extra) => {
    const fx = fresh(); const s = find(fx, "Button - CTA"); s.description = text; s.descriptionMarkdown = text;
    const r = await run(fx, { tokens: Object.assign({}, fx.settings.tokens, extra) });
    return ["metadata|description", "metadata|placeholder"].map((k) => keyed(r, "Button - CTA", new RegExp("^" + k.replace("|", "\\|") + "$")).length);
  };
  expect("a placeholder word, a description under the minimum and the bare name are each a placeholder; an empty one is the empty finding",
    [await desc("TODO later", META), await desc("A small tag", META), await desc("Button - CTA", {}), await desc("", META)], [[0, 1], [0, 1], [0, 1], [1, 0]]);
  expect("without the settings, a placeholder word and a short description pass (negative)",
    [await desc("TODO later", {}), await desc("A small tag", {})], [[0, 0], [0, 0]]);
  const fx = fresh(); const s = find(fx, "Button - CTA"); s.description = s.descriptionMarkdown = "TODO later";
  const r = await run(fx, { tokens: Object.assign({ internalPrefix: "_" }, fx.settings.tokens, META) });
  expect("a placeholder still owes the guidance sections, so the component stays in the guidance count",
    keyed(r, "Button - CTA", /^metadata\|guidance$/).length, 1);
  const p = fresh(); const ps = find(p, "Button - CTA"); ps.name = "_Button - CTA"; ps.description = ps.descriptionMarkdown = "TODO later";
  const pr = await run(p, { tokens: Object.assign({}, p.settings.tokens, META, { internalPrefix: "_" }) });
  expect("a private part's placeholder is hygiene, as its empty description is",
    pr.audited.filter((e) => e.set === "_Button - CTA").flatMap((e) => e.candidates).filter((c) => c.key === "metadata|placeholder").map((c) => c.sev), ["hygiene"]);
}
// ---- figma-standard rules 39, 26 and 40: focus, target size, accessible name --
{
  const fx = fresh(); const s = find(fx, "Button - CTA");
  const TK = Object.assign({}, fx.settings.tokens, { focusState: "Focus", minTarget: 24 });
  let r = await run(fx, { tokens: TK });
  expect("figma-standard rule 39: a state axis that has Focus raises nothing", keyed(r, "Button - CTA", /^accessibility\|focus$/), []);
  s.componentPropertyDefinitions.State.variantOptions = s.componentPropertyDefinitions.State.variantOptions.filter((o) => o !== "Focus");
  r = await run(fx, { tokens: TK });
  expect("and one without Focus is an error (WCAG 2.4.7)", keyed(r, "Button - CTA", /^accessibility\|focus$/).length, 1);
  const t = fresh(); const ts = find(t, "Button - CTA"); ts.children[0].width = 20; ts.children[0].height = 20;
  r = await run(t, { tokens: TK });
  expect("figma-standard rule 26: a variant under the target size is a review naming the smallest (WCAG 2.5.8)",
    keyed(r, "Button - CTA", /^accessibility\|target$/).map((x) => x.replace(/ \(.*\), /, ", ")), ["Button - CTA | review accessibility | 1 variant is under the 24px target, smallest 20\u00d720, so people with a finger or an unsteady hand miss it"]);
  const n = fresh(); const ns = find(n, "Button - CTA");
  for (const k of Object.keys(ns.componentPropertyDefinitions)) if (ns.componentPropertyDefinitions[k].type === "TEXT") delete ns.componentPropertyDefinitions[k];
  const strip = (x) => { if (x.children) x.children = x.children.filter((c) => c.type !== "TEXT").map(strip); return x; };
  ns.children.forEach(strip);
  r = await run(n, { tokens: TK });
  expect("figma-standard rule 40: an interactive component with no text and no text property is asked for its accessible name (WCAG 4.1.2)", rows(r, "Button - CTA").filter((x) => / accessibility \| This interactive component has no text of its own/.test(x)).length, 1);
  ns.children[0].annotations = [{ label: "aria-label: Generate" }];
  expect("and an annotation answers it", rows(await run(n, { tokens: TK }), "Button - CTA").filter((x) => / accessibility \| This interactive component has no text of its own/.test(x)).length, 0);
}
// ---- inside nested instances: contrast and the accessible name read a label part --
{
  const fx = fresh(); const s = find(fx, "Chip"); const v = s.children[0];
  v.children.push(leaf("INSTANCE", "Label part", { children: [leaf("TEXT", "Pale", { fills: paint(0.8, 0.8, 0.8), fontSize: 14 })] }));
  expect("figma-standard rule 32: text inside a nested instance is judged against the component's surface",
    rows(await run(fx), "Chip").filter((x) => /contrast/.test(x)).length, 1);
  const n = fresh(); const ns = find(n, "Button - CTA");
  for (const k of Object.keys(ns.componentPropertyDefinitions)) if (ns.componentPropertyDefinitions[k].type === "TEXT") delete ns.componentPropertyDefinitions[k];
  const strip = (x) => { if (x.children) x.children = x.children.filter((c) => c.type !== "TEXT").map(strip); return x; };
  ns.children.forEach(strip);
  ns.children[0].children.push(leaf("INSTANCE", "_Label", { children: [leaf("TEXT", "Text")] }));
  expect("figma-standard rule 40: a label inside a nested instance is text of its own",
    rows(await run(n, { tokens: Object.assign({}, n.settings.tokens, { focusState: "Focus" }) }), "Button - CTA").filter((x) => / accessibility \| This interactive component has no text of its own/.test(x)).length, 0);
}
{
  // figma-standard rule 48, from one live library on 2026-10-15: a square
  // Rest fill painted on the root of Hover and Press buttons only, and a
  // Hover token left in a Press variant. A knob keeping its Rest token in
  // every state is the shape that must stay silent.
  const fx = fresh(); const s = find(fx, "Button - CTA");
  Object.assign(fx.vars, { "V:rest": { name: "Control/Neutral/base-rest", collection: "Semantic", key: "k-semantic" },
    "V:hover": { name: "Control/Neutral/base-hover", collection: "Semantic", key: "k-semantic" } });
  const st = (v) => (v.name.match(/State=([^,]+)/) || [])[1];
  const twin = (v, state) => s.children.find((o) => o.name === v.name.replace("State=" + st(v), "State=" + state));
  const hov = s.children.find((v) => st(v) === "Hover" && twin(v, "Rest") && twin(v, "Press"));
  const restV = twin(hov, "Rest"), press = twin(hov, "Press");
  const bind = (n, id) => { n.boundVariables = Object.assign({}, n.boundVariables, { fills: [{ id }] }); };
  bind(hov, "V:rest");
  bind(press.children[0], "V:hover");
  for (const v of [restV, hov, press]) v.children.push(leaf("FRAME", "Knob", { boundVariables: { fills: [{ id: "V:rest" }] } }));
  const got = keyed(await run(fx), "Button - CTA", /^states\|token\|/);
  expect("figma-standard rule 48: a resting token added in Hover only, and a Hover token in Press, are raised; a knob at rest in every state is not", got, [
    "Button - CTA | warning states | " + hov.name + " binds another state's token ((root) fills → Control/Neutral/base-rest), so it shows the wrong state's colour",
    "Button - CTA | warning states | " + press.name + " binds another state's token (" + press.children[0].name + " fills → Control/Neutral/base-hover), so it shows the wrong state's colour",
  ]);
}
// ---- figma-standard rules 18 and 9: names in sentence case, a part's layer its last word --
{
  const fx = fresh();
  const TK = Object.assign({}, fx.settings.tokens, { propertyCase: "sentence", internalPrefix: "_" });
  expect("figma-standard rule 18: the eight real sets, in sentence case, raise no case finding", keyed(await run(fx, { tokens: TK }), null, /case\|/), []);
  const s = find(fx, "Chip"), v = s.children[0];
  v.children.push(leaf("FRAME", "Leading Icon", { children: [] }), leaf("FRAME", "Show AM-PM", { children: [] }));
  s.componentPropertyDefinitions.Tone = { type: "VARIANT", variantOptions: ["Soft danger", "Bold Danger"] };
  const part = (name) => leaf("COMPONENT", name, { description: "A part.", componentPropertyDefinitions: {}, children: [] });
  const use = (layer, main) => leaf("INSTANCE", layer, { mainComponent: { name: main, parent: null }, children: [] });
  fx.pages.find((p) => p.sets.includes(s)).sets.push(part("_Chip close button"), part("Chip preview item"), part("Data Table"));
  v.children.push(use("_Chip close button", "_Chip close button"), use("Chip preview item", "Chip preview item"), use("Item 2", "Chip preview item"), use("Button", "_Chip close button"));
  const r = await run(fx, { tokens: TK });
  expect("a layer, an option and a component with a capital inside are preferences; an acronym is not",
    [keyed(r, "Chip", /^naming\|(layer|value)-case\|/), keyed(r, "Data Table", /^naming\|component-case$/).length],
    [['Chip | preference naming | Layer "Leading Icon" is not in sentence case, so it reads unlike the layers beside it and unlike the names code takes from it',
      'Chip | preference naming | Option "Bold Danger" of Tone is not in sentence case, so it reads unlike the other options in the picker'], 1]);
  expect("figma-standard rule 9: a part's layer carrying its whole name is told to take the last word; a numbered copy and a renamed one stand",
    r.audited.find((e) => e.set === "Chip").candidates.filter((c) => /^naming\|part-layer\|/.test(c.key)).map((c) => c.advice),
    ['Rename the layer "Button".', 'Rename the layer "Item".']);
  expect("and without propertyCase no case finding is raised", keyed(await run(fx, { tokens: Object.assign({}, TK, { propertyCase: undefined }) }), null, /case\|/), []);
}
// ---- a variant's own description, out of step with its set's --
{
  const fx = fresh(); const s = find(fx, "Chip");
  expect("a set whose variants hold no description of their own raises nothing", keyed(await run(fx), "Chip", /^metadata\|variant-description$/), []);
  s.children[0].description = s.description;
  expect("a variant holding the set's text raises nothing", keyed(await run(fx), "Chip", /^metadata\|variant-description$/), []);
  s.children[0].description = "An older description.";
  expect("a variant holding other text is a warning",
    keyed(await run(fx), "Chip", /^metadata\|variant-description$/), ["Chip | warning metadata | 1 of " + s.children.length + " variants carry a description that differs from the set's, so whoever reads that variant gets text the set's description does not say"]);
}
console.log((failed ? "FAIL" : "pass") + " — " + passed + " of " + (passed + failed) + " assertions");
process.exit(failed ? 1 : 0);
