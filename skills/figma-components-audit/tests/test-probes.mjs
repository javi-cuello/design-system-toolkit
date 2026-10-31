// Runs the session probes in scripts/probes.js in node, against plain objects
// shaped like the Figma nodes they read. No Figma, no install.
//   node skills/figma-components-audit/tests/test-probes.mjs
//
// The probes over a node are tested here, and FCA.discover against a stand-in
// `figma`. The other live calls (FCA.locate, FCA.nameSpaces, FCA.detachedScan, FCA.sweepSchema, FCA.fix.*)
// need `figma` and are syntax-checked only — `node --check` below, and loading
// the file at all parses every one of them.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const file = join(here, "..", "scripts", "probes.js");
const FCA = createRequire(import.meta.url)(file);

let failed = 0, passed = 0;
function expect(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else { failed++; console.log("FAIL " + name + "\n  got  " + JSON.stringify(got) + "\n  want " + JSON.stringify(want)); }
}
const node = (type, name, extra) => Object.assign({ id: "0:" + name, type, name, visible: true }, extra || {});
const text = (name, extra) => node("TEXT", name, extra);
const set = (name, defs, children) => ({ id: "0:" + name, type: "COMPONENT_SET", name, componentPropertyDefinitions: defs, children });
const axis = (options, defaultValue) => ({ type: "VARIANT", variantOptions: options, defaultValue: defaultValue || options[0] });

// ---- the load protocol: syntax, hash, comment stripping ----------------
execFileSync(process.execPath, ["--check", file]);
passed++;
const factory = globalThis.__FCA_PROBES_FACTORY.toString();
expect("the hash ignores comments and whitespace, so a paste stripped of both still matches",
  FCA.srcHash(FCA.stripComments(factory).replace(/\n\s*/g, "\n")), FCA.srcHash(factory));
expect("and a changed token changes it", FCA.srcHash(factory.replace("d > 6", "d > 7")) === FCA.srcHash(factory), false);
expect("the stripped factory still parses", typeof new Function("return (" + FCA.stripComments(factory) + ")")(), "function");
const tricky = 'const a = "http://x"; // gone\nconst r = /a\\/\\/b[/*]/g; /* gone */ const t = `u//${ {b:1}.b }/*k*/`; x = 4 / 2 / 1;';
expect("strings, regexes and templates keep their // and /*, comments go",
  FCA.stripComments(tricky).replace(/\s+/g, " ").trim(),
  'const a = "http://x"; const r = /a\\/\\/b[/*]/g; const t = `u//${ {b:1}.b }/*k*/`; x = 4 / 2 / 1;');
const printed = execFileSync(process.execPath, [file]).toString();
expect("node scripts/probes.js prints the hash a paste must report", printed.split(/\s+/)[0], FCA.srcHash(factory));

// ---- §0.5 discovery halves ---------------------------------------------
expect("numeric scales keep only the numeric groups",
  Object.keys(FCA.numericScales(["Spacing/8", "Radius/4", "Colour/Text/strong", "Font size/12"])), ["Spacing", "Radius", "Font size"]);
expect("colour roles are the first two segments, sorted and unique",
  FCA.colourRoles(["Colour/Text/strong", "Colour/Text/soft", "Colour/Background/x", "Spacing/8"]), ["Colour/Background", "Colour/Text"]);
expect("only a default collection name is a finding",
  [FCA.isDefaultCollectionName("Collection 2"), FCA.isDefaultCollectionName("Semantic")], [true, false]);

// ---- §1 schema -----------------------------------------------------------
const OPTS = { stateAxis: "State", states: ["Rest", "Focus", "Hover", "Press"], disabledAxis: "Disabled", firstAxis: "Breakpoint" };
let defs = { Size: axis(["md"]), State: axis(["Rest", "Hover"]), Breakpoint: axis(["Desktop", "Mobile"]), Disabled: axis(["True", "False"], "False") };
expect("schema: a single-option axis; axis order and default-first are the scanner's",
  FCA.schemaFindings(defs, OPTS), [
    'axis "Size" has a single option ("md") — no choice offered; leftover or deliberately staged?',
  ]);
defs = { State: axis(["Hover", "Rest", "Loading"]) };
expect("schema: vocabulary, and order among the known options only",
  FCA.schemaFindings(defs, OPTS), ["State has non-standard options: Loading", "State options out of canonical order"]);
expect("schema: a known order beside an unknown option is not out of order",
  FCA.schemaFindings({ State: axis(["Rest", "Loading", "Hover"]) }, OPTS), ["State has non-standard options: Loading"]);
expect("schema: no project vocabulary, no state or axis-order findings (negative)",
  FCA.schemaFindings({ Size: axis(["sm", "md"]), State: axis(["Hover", "Rest"]) }, {}), []);

// ---- §2 property naming ------------------------------------------------
expect("property naming: only Figma's default swap name; case is the scanner's", FCA.propertyNamingFindings({
  "Label#0:1": { type: "TEXT" }, "Label text#0:2": { type: "TEXT" }, "Instance#0:3": { type: "INSTANCE_SWAP" },
  "Icon (Danger)#0:4": { type: "INSTANCE_SWAP" }, "Show Icon#0:5": { type: "BOOLEAN" },
}, { propertyCase: "sentence" }), ['SWAP prop "Instance" has a default name — give it a descriptive name']);
expect("property naming: with no case setting, only Figma's default swap name is raised", FCA.propertyNamingFindings({
  "Label#0:1": { type: "TEXT" }, "Instance#0:3": { type: "INSTANCE_SWAP" }, "Show Icon#0:5": { type: "BOOLEAN" },
}, {}), ['SWAP prop "Instance" has a default name — give it a descriptive name']);

// ---- §3.4 wrap row gap -------------------------------------------------
const wrap = (name, extra) => node("FRAME", name, Object.assign({ layoutMode: "HORIZONTAL", layoutWrap: "WRAP", counterAxisSpacing: 8, boundVariables: {} }, extra));
let s = set("Chips", {}, [node("COMPONENT", "Size=md", { children: [
  wrap("Row"), wrap("Bound", { boundVariables: { counterAxisSpacing: { id: "v" } } }),
  wrap("Grid", { layoutMode: "GRID" }), node("INSTANCE", "Nested", { children: [wrap("Inside")] }),
] })]);
expect("wrap row gap: fires on an unbound wrap gap only — not bound, not GRID, not inside an instance",
  FCA.wrapRowGaps(s).findings.map((f) => f.layer), ["Row"]);

// ---- §3.5b anatomy -----------------------------------------------------
s = set("Dialog", {}, [
  node("COMPONENT", "Size=md", { children: [node("FRAME", "Header"), node("SLOT", "Body"), node("FRAME", "Footer")] }),
  node("COMPONENT", "Size=sm", { children: [node("FRAME", "Header"), node("FRAME", "Content")] }),
]);
expect("anatomy: slot name and parts come from the caller",
  FCA.anatomy(s, { slotName: "Content slot", parts: ["Header", "Footer"] }).map((r) => r.findings),
  [['SLOT named "Body" (expected "Content slot")'], ["no native SLOT — open content area should be a SLOT, not a plain frame", "no Footer frame"]]);

// ---- §3.5d state coverage ----------------------------------------------
expect("state coverage: what the archetype expects and the set lacks",
  FCA.stateCoverage(set("B", { State: axis(["Rest", "Hover"]), Disabled: axis(["False", "True"]) }, []), ["Rest", "Focus", "Hover", "Press"], OPTS),
  { set: "B", present: ["Rest", "Hover"], missing: ["Focus", "Press"], hasDisabledAxis: true });
expect("state coverage: a set without the disabled axis says so (negative)",
  FCA.stateCoverage(set("C", { State: axis(["Rest"]) }, []), ["Rest"], OPTS).hasDisabledAxis, false);

// ---- §3.6 metadata -----------------------------------------------------
const META = { internalPrefix: "_", descriptionPlaceholder: "^(todo|tbd|wip|lorem)", minDescription: 12 };
expect("metadata: empty private is hygiene, empty public an error, a placeholder an error",
  [set("_Part", {}, []), set("Card", {}, []), Object.assign(set("Tag", {}, []), { description: "TODO later" }),
   Object.assign(set("Tag", {}, []), { description: "Labels a thing in a list." })].map((x) => FCA.metadata(x, META).findings.map((f) => f.severity)),
  [["hygiene"], ["error"], ["error"], []]);
expect("metadata: a description under 12 characters is a placeholder even with no placeholder word",
  FCA.metadata(Object.assign(set("Tag", {}, []), { description: "A small tag" }), META).findings.map((f) => f.severity), ["error"]);
expect("metadata: without the settings, only an empty description and one that repeats the name are raised",
  [set("_Part", {}, []), Object.assign(set("Tag", {}, []), { description: "TODO later" }), Object.assign(set("Tag", {}, []), { description: "Tag" })].map((x) => FCA.metadata(x).findings.map((f) => f.severity)),
  [["error"], [], ["error"]]);

// ---- §3.7a focus ring --------------------------------------------------
const ring = (w) => ({ strokes: [{ type: "SOLID", color: { r: 0, g: 0, b: 1 } }], strokeTopWeight: w, strokeRightWeight: w, strokeBottomWeight: w, strokeLeftWeight: w });
s = set("Button", {}, [
  node("COMPONENT", "Size=md, State=Rest"), node("COMPONENT", "Size=md, State=Focus"),
  node("COMPONENT", "Size=sm, State=Rest", ring(0)), node("COMPONENT", "Size=sm, State=Focus", ring(2)),
]);
expect("focus: a Focus identical to its Rest sibling fires, one with a ring does not",
  FCA.focusRings(s, { stateAxis: "State", focus: "Focus", rest: "Rest" }).findings.map((f) => f.variant), ["Size=md, State=Focus"]);
expect("focus: no state words, no verdict (negative)", typeof FCA.focusRings(s, {}).skip, "string");

// ---- §3.7b sizes -------------------------------------------------------
const plain = node("COMPONENT", "Badge", { width: 16, height: 16, children: [node("FRAME", "Dot", { width: 400, height: 400 }), text("N", { fontSize: 10 })] });
const sz = FCA.sizes(plain, { minTarget: 24, minText: 12 });
expect("sizes: a plain COMPONENT is measured itself, never its layers as variants",
  [sz.small.map((x) => x.variant), sz.smallText.map((x) => x.variant + "/" + x.layer)], [["Badge"], ["Badge/N"]]);
expect("sizes: the minima passed in are the ones applied", sz.minTarget, 24);
expect("sizes: with no minima in the settings, nothing is measured against a guess", (({ small, smallText }) => [small.length, smallText.length])(FCA.sizes(plain)), [0, 0]);

// ---- §3.7c contrast ----------------------------------------------------
const solid = (r, g, b, opacity) => [{ type: "SOLID", visible: true, opacity: opacity === undefined ? 1 : opacity, color: { r, g, b } }];
expect("contrast: black on white is 21:1", +FCA.contrastRatio({ r: 0, g: 0, b: 0 }, { r: 1, g: 1, b: 1 }).toFixed(2), 21);
s = set("Note", {}, [node("COMPONENT", "Tone=Grey", { fills: solid(1, 1, 1), children: [
  text("Low", { fills: solid(0.8, 0.8, 0.8), fontSize: 14 }), text("Fine", { fills: solid(0, 0, 0), fontSize: 14 }),
  text("Large", { fills: solid(0.55, 0.55, 0.55), fontSize: 24 }), text("Tint", { fills: solid(0, 0, 0, 0.6), fontSize: 14 }),
] })]);
const ct = FCA.contrast(s);
expect("contrast: below AA fires, large text gets 3:1, a translucent paint is verify-by-eye",
  [ct.belowAA.map((x) => x.layer), ct.verifyByEye.map((x) => x.layer)], [["Low"], ["Tint"]]);

const VARS = {
  sem: { variableCollectionId: "c-sem", valuesByMode: { "m-l": { type: "VARIABLE_ALIAS", id: "pal" }, "m-d": { type: "VARIABLE_ALIAS", id: "pal" } } },
  pal: { variableCollectionId: "c-pal", valuesByMode: { "p-l": { r: 1, g: 1, b: 1, a: 1 }, "p-d": { r: 0, g: 0, b: 0, a: 0.05 } } },
};
const COLLS = { "c-sem": { modes: [{ name: "Light", modeId: "m-l" }, { name: "Dark", modeId: "m-d" }] },
                "c-pal": { modes: [{ name: "Light", modeId: "p-l" }, { name: "Dark", modeId: "p-d" }] } };
const api = { variable: async (id) => VARS[id] || null, collection: async (id) => COLLS[id] || null };
expect("resolve: an alias is followed BY MODE NAME, not into the target's first mode, and alpha survives",
  await FCA.resolveInMode("sem", "Dark", api), { r: 0, g: 0, b: 0, a: 0.05 });
expect("resolve: a missing variable is undefined, not a throw", await FCA.resolveInMode("nope", "Dark", api), undefined);

// ---- §3.8 text coverage ------------------------------------------------
s = set("Card", {}, [node("COMPONENT", "Size=md", { children: [
  text("Title", { characters: "Hello", componentPropertyReferences: { characters: "Title text#0:1" }, textAutoResize: "HEIGHT" }),
  text("Body", { characters: "Lorem ipsum" }),
  text("Clip", { characters: "Fixed", componentPropertyReferences: { characters: "Clip text#0:2" }, textAutoResize: "NONE" }),
  node("SLOT", "Content slot", { children: [text("Placeholder", { characters: "Drop here" })] }),
  node("INSTANCE", "Badge", { children: [text("Count", { characters: "3" })] }),
] })]);
const tc = FCA.textCoverage(s);
expect("text coverage: one walk, both lists; slot and instance text excluded",
  [tc.missing.map((x) => x.layer), tc.overflow.map((x) => x.layer)], [["Body"], ["Clip"]]);

// ---- §3.8c naming case -------------------------------------------------
expect("case shape: a segment that does not start with a letter has none",
  ["9-source", "soft", "Background", "SemiBold", "WCAG", "iOS"].map(FCA.caseShape), [null, "lower", "initial-cap", "camel-inner", "upper", "mixed"]);
const cls = FCA.classifyNameSpaces([
  { space: "variables: Type", names: ["Heading/md-medium/size", "Heading/lg-bold/size", "Body/sm-regular/size"] },
  { space: "variables: Palette", names: ["Palette/Blue/9-source", "Palette/Red/9-source", "Utils/white"] },
  { space: "components", names: ["Switch", "switch", "Button", "Card", "chevron-down"] },
]);
expect("case: depths are not pooled, digits are not evidence; a split and a minority are reported",
  cls.map((r) => [r.space, r.splits, Object.keys(r.minorities)]),
  [["components", [["Switch", "switch"]], ["leaf:lower"]]]);

// ---- §3.9 detached candidates ------------------------------------------
const prefixes = new Set(["❖", "🚧"]);
expect("detached: component-prefixed pages and the cover are not candidates",
  ["❖ Buttons", "🚧 Draft", "Cover", "Examples"].map((p) => FCA.isCandidatePage(p, prefixes, ["Cover"])), [false, false, false, true]);
expect("detached: with no exempt pages in the settings, a cover page is a candidate like any other",
  FCA.isCandidatePage("Cover", prefixes), true);
expect("detached: a frame named like a component is a suspect",
  FCA.detachedSuspects("Examples", [node("FRAME", "Button"), node("FRAME", "Layout")], new Set(["Button"])).map((x) => x.name), ["Button"]);

// ---- §3.10a disabled paints --------------------------------------------
const MIXED = Symbol("mixed");
s = set("Field", {}, [node("COMPONENT", "State=Rest", { fills: [{ type: "SOLID", visible: false }], children: [
  text("Rich", { fills: MIXED }), node("FRAME", "Box", { effects: [{ type: "DROP_SHADOW", visible: true }, { type: "DROP_SHADOW", visible: false }] }),
  node("INSTANCE", "Nested", { children: [node("FRAME", "Inside", { fills: [{ type: "SOLID", visible: false }] })] }),
] })]);
expect("disabled paints: found per prop and index, a figma.mixed fill neither throws nor loses them, an instance is never entered",
  FCA.disabledPaints(s).findings.map((f) => f.layer + "." + f.prop + "[" + f.index + "]"), ["State=Rest.fills[0]", "Box.effects[1]"]);

// ---- §3.10d orphans ----------------------------------------------------
const inst = (name, main) => node("INSTANCE", name, { getMainComponentAsync: async () => main });
const imported = [];
const importByKey = async (k) => { imported.push(k); if (k === "dead") throw new Error("gone"); };
s = set("Menu", {}, [node("COMPONENT", "Size=md", { children: [
  inst("Local", { parent: {} }), inst("Detached", { parent: null }), inst("Missing", null),
  inst("Remote", { parent: null, key: "ok" }), inst("Remote2", { parent: null, key: "ok" }),
  inst("Dead", { parent: null, key: "dead" }), inst("Dead2", { parent: null, key: "dead" }),
] })]);
const orph = await FCA.orphans(s, importByKey);
expect("orphans: a keyless parentless main and an unresolvable one are orphans; a healthy remote is not; a dead key is",
  orph.orphans.map((o) => o.layer).sort(), ["Dead", "Dead2", "Detached", "Missing"]);
expect("orphans: each remote key is verified once, and a failure retried once", imported.sort(), ["dead", "dead", "ok"]);
let flakyCalls = 0;
const flaky = await FCA.orphans(set("Menu", {}, [node("COMPONENT", "Size=md", { children: [inst("Flaky", { parent: null, key: "flaky" })] })]),
  async () => { if (flakyCalls++ === 0) throw new Error("timeout"); });
expect("orphans: a key that fails once and resolves on the retry is not an orphan", [flaky.orphans.length, flakyCalls], [0, 2]);

// ---- §0.5 discover: local collections are allowed keys -----------------
globalThis.figma = {
  teamLibrary: {
    getAvailableLibraryVariableCollectionsAsync: async () => [{ libraryName: "Lib", name: "Semantic", key: "k-lib" }],
    getVariablesInLibraryCollectionAsync: async () => [{ name: "Spacing/4" }],
  },
  variables: {
    getLocalVariableCollectionsAsync: async () => [{ name: "Local tokens", key: "k-local", variableIds: ["v1"] }],
    getVariableByIdAsync: async () => ({ name: "Radius/2" }),
  },
};
expect("discover: allowedKeys holds the library's keys and this file's local collection keys, labelled local",
  (await FCA.discover()).allowedKeys, { "k-lib": "Lib :: Semantic", "k-local": "local :: Local tokens" });
// A default-named stray is a finding, not an allowed source; a remote collection is a library's, never relabelled local.
globalThis.figma.variables.getLocalVariableCollectionsAsync = async () => [
  { name: "Local tokens", key: "k-local", variableIds: ["v1"] },
  { name: "Collection 1", key: "k-stray", variableIds: ["v1"] },
  { name: "Semantic", key: "k-lib", remote: true, variableIds: ["v1"] },
];
const d2 = await FCA.discover();
expect("discover: a default-named collection and a remote collection are not allowed as local",
  d2.allowedKeys, { "k-lib": "Lib :: Semantic", "k-local": "local :: Local tokens" });
expect("discover: the default-named stray is still listed and flagged",
  d2.localCollections.filter((c) => c.defaultName).map((c) => c.name), ["Collection 1"]);
delete globalThis.figma;

// ---- §3.10f fixed text -------------------------------------------------
const al = { layoutMode: "VERTICAL" };
s = set("Row", {}, [node("COMPONENT", "Size=md", { children: [
  text("Fixed", { textAutoResize: "NONE", parent: al, height: 20, characters: "abc" }),
  text("Hugs", { textAutoResize: "WIDTH_AND_HEIGHT", layoutSizingVertical: "FIXED", parent: al }),
  text("Fill", { textAutoResize: "NONE", layoutSizingVertical: "FILL", parent: al }),
  text("Trunc", { textAutoResize: "NONE", textTruncation: "ENDING", parent: al }),
] })]);
expect("fixed text: textAutoResize alone decides; FILL and truncation are exempt; FIXED sizing on a hugging node is not",
  FCA.fixedText(s).findings.map((f) => f.layer), ["Fixed"]);

// ---- §3.10e visibility-only axes ---------------------------------------
const kid = (vis) => [node("RECTANGLE", "Icon", { visible: vis }), node("TEXT", "Label")];
s = set("Chip", {}, [
  node("COMPONENT", "Icon=True, Size=md", { children: kid(true) }), node("COMPONENT", "Icon=False, Size=md", { children: kid(false) }),
  node("COMPONENT", "Icon=True, Size=sm", { children: kid(true) }), node("COMPONENT", "Icon=False, Size=sm", { children: kid(false) }),
]);
expect("visibility axes: an axis whose every pair differs only in visibility is a suspect", Object.keys(FCA.visibilityAxes(s).suspects), ["Icon"]);
s.children[3].children = [node("RECTANGLE", "Icon", { visible: false }), node("FRAME", "Label")];
expect("visibility axes: one pair that differs in more is enough to clear the axis (the prose's code reported it)",
  Object.keys(FCA.visibilityAxes(s).suspects), []);

// ---- §4b-2 references ---------------------------------------------------
expect("refs: the kind follows the type", ["TEXT", "BOOLEAN", "INSTANCE_SWAP", "VARIANT"].map(FCA.refKind), ["characters", "visible", "mainComponent", null]);
expect("refs: merged, never replaced", FCA.mergeRefs({ visible: "Show#0:1" }, "characters", "Label text#0:2"), { visible: "Show#0:1", characters: "Label text#0:2" });

// ---- the live surface exists (syntax only) ------------------------------
expect("live calls are defined", ["locate", "discover", "nameSpaces", "detachedScan", "sweepSchema"].map((k) => typeof FCA[k])
  .concat(["bindVariable", "bindPaint", "addProperty"].map((k) => typeof FCA.fix[k])), Array(8).fill("function"));

// ---- §4a a uniform stroke binds on all four sides -------------------------
{
  const SIDES = ["strokeTopWeight", "strokeBottomWeight", "strokeLeftWeight", "strokeRightWeight"];
  const mk = (t, b, l, r) => ({ name: "Box", strokeTopWeight: t, strokeBottomWeight: b, strokeLeftWeight: l, strokeRightWeight: r, boundVariables: {},
    setBoundVariable(f, v) { this.boundVariables[f] = { id: v.id }; } });
  const nodes = { a: mk(1, 1, 1, 1), b: mk(1, 0, 0, 0) };
  globalThis.figma = { getNodeByIdAsync: async (id) => nodes[id], variables: { getVariableByIdAsync: async (id) => ({ id, name: "Stroke/1" }) } };
  await FCA.fix.bindVariable("a", "strokeTopWeight", "V:1");
  await FCA.fix.bindVariable("b", "strokeTopWeight", "V:1");
  expect("binding one side of a uniform stroke binds all four; a top-only border binds its top alone",
    [SIDES.filter((f) => nodes.a.boundVariables[f]).length, SIDES.filter((f) => nodes.b.boundVariables[f]).length], [4, 1]);
  delete globalThis.figma;
}

console.log((failed ? "FAIL" : "pass") + " — " + passed + " of " + (passed + failed) + " assertions");
process.exit(failed ? 1 : 0);
