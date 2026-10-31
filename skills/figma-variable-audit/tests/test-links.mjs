// Runs the link check in node against fixture facts, with no Figma.
// The scanner body returns checkFacts when `figma` is not in scope.
//   node skills/figma-variable-audit/tests/test-links.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "scripts", "links.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const checkFacts = await new AsyncFunction("MODE", src)("scan");

let failed = 0, passed = 0;
function expect(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else { failed++; console.log("FAIL " + name + "\n  got  " + JSON.stringify(got) + "\n  want " + JSON.stringify(want)); }
}
const texts = (r) => r.audited.flatMap((e) => e.candidates.map((c) => e.set + " | " + c.text));

const KEYS = { variables: [{ key: "k-bg", name: "Colour/Background/Neutral/default" }, { key: "k-sp", name: "Spacing/2" }],
               styles: [{ key: "s-body", name: "Body/md", type: "TEXT" }] };
// The scanner records the variant BESIDE the path, never inside it, so a
// binding on the variant's own frame keeps "$root" as its layer instead of
// taking the variant's name as one. `"Rest › Header"` here is written the way
// a reader thinks of it and split back into the two fields the scanner emits.
const ref = (kind, id, prop, where, o) => {
  const cut = String(where).indexOf(" › ");
  const variant = cut === -1 ? (where === "$root" ? null : where) : where.slice(0, cut);
  const path = cut === -1 ? "$root" : where.slice(cut + 3);
  return Object.assign({ kind, id, prop, path, variant, resolved: true, remote: true }, o);
};

// Every link resolves to a key the source has: nothing raised, everything counted
let r = checkFacts({ sets: [{ name: "Button", id: "0:1", page: "❖ Button", variants: 2, refs: [
  ref("variable", "V:1", "fills", "Rest › Content", { key: "k-bg", name: "Colour/Background/Neutral/default" }),
  ref("variable", "V:2", "paddingLeft", "Rest", { key: "k-sp", name: "Spacing/2" }),
  ref("style", "S:1", "textStyleId", "Rest › Label", { key: "s-body", name: "Body/md", styleType: "TEXT" })
] }] }, KEYS);
expect("valid links raise nothing", texts(r), []);
expect("and are counted, by binding and by distinct token", [r.measures.bindings, r.measures.styleRefs, r.measures.distinctVariables, r.measures.distinctStyles, r.measures.broken], [2, 1, 2, 1, 0]);

// A key the source no longer has, used on three layers, is one candidate naming them
r = checkFacts({ sets: [{ name: "Card", id: "0:2", page: "❖ Card", refs: [
  ref("variable", "V:9", "fills", "Rest › Header", { key: "k-gone", name: "Colour/Background/Brand/soft" }),
  ref("variable", "V:9", "fills", "Rest › Footer", { key: "k-gone", name: "Colour/Background/Brand/soft" }),
  ref("variable", "V:9", "strokes", "Hover › Header", { key: "k-gone", name: "Colour/Background/Brand/soft" }),
  ref("variable", "V:1", "fills", "Rest › Body", { key: "k-bg", name: "Colour/Background/Neutral/default" })
] }] }, KEYS);
expect("a removed variable is one candidate per set, stating only its STATE",
  texts(r), ["Card | variable \"Colour/Background/Brand/soft\" is not in the source library"]);
// What to DO is a second string, for the recommendation column beside it.
// Packed into the sentence above it made a question column that ran for
// fifteen lines while the recommendation held one boilerplate line.
expect("and the advice travels separately", /may belong to another library/.test(r.audited[0].candidates[0].advice), true);
// The layers are a LIST beside the sentence, one entry per layer with its
// properties gathered — not four copies of one path inside one paragraph.
// `Header` is bound in two variants and is one entry saying so.
expect("its layers are listed, grouped by layer, variants counted not repeated",
  r.audited[0].candidates[0].layers, ["Header — fills, strokes · 2 variants", "Footer — fills · Rest"]);
// A name the source does not carry is a REVIEW: this check reads one library,
// and a project with two sources would otherwise have the second one's tokens
// reported as deleted. The error case is the superseded key, asserted below.
expect("the candidate is a review under the link rule", r.audited[0].candidates[0].rule + "/" + r.audited[0].candidates[0].sev, "link/review");

// A dangling id (the variable was deleted outright) and a removed style
r = checkFacts({ sets: [{ name: "Tag", id: "0:3", page: "❖ Tag", refs: [
  { kind: "variable", id: "V:404", prop: "fills", path: "$root", variant: "Rest", resolved: false },
  ref("style", "S:9", "effectStyleId", "Rest", { key: "s-gone", name: "Elevation/2", styleType: "EFFECT" })
] }] }, KEYS);
expect("a dangling id and a removed style are both raised, and say which",
  texts(r), ["Tag | variable V:404 no longer resolves at all", "Tag | effect style \"Elevation/2\" is not in the source library"]);
// A binding on the variant's own frame is the COMPONENT FRAME, in whatever
// variant it was found. Named after the variant it read as a layer nobody can
// select, and one token bound on four variants of one frame listed four of
// them.
expect("a binding on the root is the component frame, not the variant", r.audited[0].candidates[0].layers, ["the component frame — fills · Rest"]);
expect("a dangling id stays an error — nothing resolves it, so no second library explains it",
  r.audited[0].candidates[0].sev, "error");

// A local token is not a library link: counted, never raised
r = checkFacts({ sets: [{ name: "Chip", id: "0:4", page: "❖ Chip", refs: [
  ref("variable", "V:5", "fills", "Rest", { remote: false, key: "k-local", name: "Local/thing" })
] }] }, KEYS);
expect("a local variable is counted as local and not raised", [texts(r), r.measures.local], [[], 1]);

// No reference set at all: every remote link reads as missing — the caller must refuse this, so the shape is what it is
r = checkFacts({ sets: [{ name: "X", id: "0:5", page: "p", refs: [ref("variable", "V:1", "fills", "Rest", { key: "k-bg", name: "n" })] }] }, null);
expect("with no reference set every remote link is raised, which is why the keys step must run first", texts(r).length, 1);

// The distinction that decides what a finding MEANS. A key the source does
// not carry, under a name it still publishes, is a binding left on a
// superseded generation of that token — the layer renders and looks right,
// and it has stopped receiving library updates. A name the source does not
// carry at all is a different question: it may come from a second library
// this check never read, so it is a review rather than an error.
r = checkFacts({ sets: [{ name: "Split button", id: "0:6", page: "❖ Split button", refs: [
  ref("variable", "V:9", "itemSpacing", "Rest", { key: "k-OLD", name: "Spacing/2" }),
  ref("variable", "V:10", "fills", "Rest", { key: "k-other", name: "Lavender" })
] }] }, KEYS);
const both = r.audited[0].candidates;
expect("a superseded key under a published name is an error, and says the binding stopped updating",
  [both[0].sev, /different key/.test(both[0].text), /receives no updates/.test(both[0].advice)],
  ["error", true, true]);
expect("a name the source does not carry at all is a review, and says to check for another library",
  [both[1].sev, /not in the source library/.test(both[1].text), /another library/.test(both[1].advice)],
  ["review", true, true]);
expect("and both are still counted as broken", r.measures.broken, 2);

// A token the source RESPELLED under a new key is still superseded, and the
// finding names what it is called now. Project B's en-US move recreated
// Colour/…/Supportive/Green as Color/…; the stale binding read as a review.
r = checkFacts({ sets: [{ name: "Alert", id: "0:7", page: "❖ Alert", refs: [
  ref("variable", "V:11", "fills", "Rest › Icon", { key: "k-green-old", name: "Colour/Icon/Supportive/Green/secondary" })
] }] }, { variables: [{ key: "k-green", name: "Color/Icon/Supportive/Green/secondary" }], styles: [] });
const respelled = r.audited[0].candidates[0];
expect("a respelled token under a new key is an error that names the current name",
  [respelled.sev, /different key, as "Color\/Icon\/Supportive\/Green\/secondary"/.test(respelled.text), /Rebind to the published "Color\/Icon/.test(respelled.advice)],
  ["error", true, true]);

// ---- held but not published -------------------------------------------
// The middle state, and the one a local-only reference cannot see: the source
// HAS the variable, so it is not deleted, and does not PUBLISH it, so the
// binding renders forever and updates never.
const WITH_PUB = Object.assign({}, KEYS, { published: { variables: ["k-bg"], styles: ["s-body"] } });
r = checkFacts({ sets: [{ name: "Chip", id: "0:7", page: "❖ Chip", refs: [
  ref("variable", "V:1", "fills", "Rest", { key: "k-bg", name: "Colour/Background/Neutral/default" }),
  ref("variable", "V:2", "itemSpacing", "Rest", { key: "k-sp", name: "Spacing/2" })
] }] }, WITH_PUB);
expect("a published key is fine; one the source holds but does not publish is an error that says why",
  [texts(r).length, /not published/.test(texts(r)[0] || ""), /never receive a library update/.test(r.audited[0].candidates[0].advice || ""), r.audited[0].candidates[0].sev],
  [1, true, true, "error"]);
expect("and the run records that the published set was read", r.measures.publishedChecked, true);

// A binding that came with an applied style is the style's, not the layer's.
// The focus ring's `Palette/Blue/4` sits on every layer using the style.
r = checkFacts({ sets: [{ name: "Input", id: "0:9", page: "❖ Input", refs: [
  ref("variable", "V:3", "effects", "Content", { key: "k-sp", name: "Colour/Palette/Blue/4", styled: true }),
  ref("variable", "V:4", "effects", "Content", { key: "k-sp", name: "Colour/Palette/Blue/4" })
] }] }, WITH_PUB);
expect("a variable inside an applied style is not raised; the same binding set by hand still is",
  [texts(r).length, r.measures.styled], [1, 1]);

// A published list that came back EMPTY is the probe failing, not a library
// publishing nothing — using it as a reference would report every binding
// broken. It is ignored, and the gap is named.
r = checkFacts({ sets: [{ name: "Chip", id: "0:8", page: "❖ Chip", refs: [
  ref("variable", "V:1", "fills", "Rest", { key: "k-bg", name: "Colour/Background/Neutral/default" })
] }] }, Object.assign({}, KEYS, { published: { variables: [], styles: [] } }));
expect("an empty published list is ignored rather than believed, and the run says so",
  [texts(r), r.measures.publishedChecked, r.notChecked.length], [[], false, 2]);

// The variable probe succeeding says nothing about the STYLE probe, and the
// live one never fills `styles` at all — so one flag over both declared the
// style question checked over thousands of resolved style references.
r = checkFacts({ sets: [{ name: "Chip", id: "0:8", page: "❖ Chip", refs: [
  ref("variable", "V:1", "fills", "Rest", { key: "k-bg", name: "Colour/Background/Neutral/default" })
] }] }, Object.assign({}, KEYS, { published: { variables: ["k-bg"], styles: [] } }));
expect("a published variable list does not answer for styles",
  [r.measures.publishedCheckedVariables, r.measures.publishedCheckedStyles,
   r.notChecked.filter((x) => x.includes("styles")).length], [true, false, 1]);

// A binding that paints nothing is not raised at all: Figma's Stroke panel
// lists paints, so a weight with no paint has no row there and cannot be
// seen, selected or removed in the UI. Verified live on `_Dialog - Modal` —
// `strokeBottomWeight` bound on a Header with zero stroke paints, in all
// three variants, with an empty Stroke panel. Eleven of one library's link
// rows named something the maintainer could neither find nor fix.
r = checkFacts({ sets: [{ name: "Dialog", id: "0:9", page: "\u2756 Dialog", refs: [
  Object.assign(ref("variable", "V:9", "strokeTopWeight", "Rest", { key: "k-OLD", name: "Spacing/2" }), { paints: false })
] }] }, KEYS);
expect("a binding whose every layer paints nothing raises nothing, and is counted instead",
  [r.audited.length, r.measures.dead, r.measures.broken], [0, 1, 0]);

r = checkFacts({ sets: [{ name: "Dialog", id: "0:9", page: "\u2756 Dialog", refs: [
  Object.assign(ref("variable", "V:9", "strokeTopWeight", "Rest", { key: "k-OLD", name: "Spacing/2" }), { paints: false }),
  Object.assign(ref("variable", "V:9", "strokeTopWeight", "Hover", { key: "k-OLD", name: "Spacing/2" }), { paints: true })
] }] }, KEYS);
expect("a finding that paints anywhere keeps its severity",
  r.audited[0].candidates[0].sev, "error");

// An override inside an instance is the consumer's to fix, and the row says
// so; an inherited binding belongs to the component it came from and is not
// filed here at all.
r = checkFacts({ sets: [{ name: "Split button", id: "0:7", page: "\u2756 Split button", refs: [
  Object.assign(ref("variable", "V:9", "fills", "Rest \u203a Leading", { key: "k-OLD", name: "Spacing/2" }), { override: true })
] }] }, KEYS);
expect("an override names itself as fixable on this component",
  /an override on this component's own copy/.test(r.audited[0].candidates[0].layers[0]), true);

r = checkFacts({ sets: [{ name: "Split button", id: "0:7", page: "\u2756 Split button", refs: [
  ref("variable", "V:9", "fills", "Rest \u203a Leading", { key: "k-OLD", name: "Spacing/2" })
] }] }, KEYS);
expect("a binding that is not an override says nothing of the kind",
  /an override/.test(r.audited[0].candidates[0].layers[0]), false);

// Which bindings REACH `checkFacts` is the live walk's decision, not this
// function's — an unoverridden instance frame is filtered before it becomes a
// ref, so there is no fixture that can express it here. That half is proved
// against the real file (see cases.md A9). What this layer owns is the
// marking: an override is this component's to fix, and says so.
r = checkFacts({ sets: [{ name: "App header", id: "0:20", page: "\u2756 App header", refs: [
  { kind: "variable", id: "V:20", prop: "itemSpacing", path: "Tabs", variant: "Rest",
    resolved: true, remote: true, key: "k-OLD", name: "Spacing/2", override: true }
] }] }, KEYS);
expect("an overridden one is, and says so",
  [r.audited.length, /an override on this component's own copy/.test(r.audited[0].candidates[0].layers[0])],
  [1, true]);

// ---- a batching caller's arithmetic -----------------------------------
// The counts a caller sums across batches, and the one it must not. A
// variable bound by two sets is ONE distinct variable; adding the batches
// would call it two, which is why the ids travel and not just their count.
r = checkFacts({ sets: [
  { name: "Chip", id: "0:9", page: "❖ Chip", refs: [
    ref("variable", "V:1", "fills", "Rest", { key: "k-bg", name: "Colour/Background/Neutral/default" }),
    ref("variable", "V:1", "strokes", "Rest", { key: "k-bg", name: "Colour/Background/Neutral/default" })] },
  { name: "Tag", id: "0:10", page: "❖ Tag", refs: [
    ref("variable", "V:1", "fills", "Rest", { key: "k-bg", name: "Colour/Background/Neutral/default" })] },
] }, KEYS);
expect("three bindings on one variable across two sets: counts add, the distinct id does not",
  [r.measures.bindings, r.measures.sets, r.measures.distinctVariables, r.seen.variables],
  [3, 2, 1, ["V:1"]]);

// ---- a binding with nothing to paint ----------------------------------
// Figma keeps a per-side stroke weight bound on a layer that has no stroke,
// and does not show it: the Stroke panel lists paints, so a weight with no
// paint has no row to appear in and cannot be selected or removed there.
// Such a layer is dropped from the finding even when the finding stands —
// one variable bound on a painted Footer AND an unpainted Header is one
// finding, the Footer needs rebinding, and the Header line named a layer the
// designer could not reach. Seen live on `_Dialog - Modal`: three lines, two
// unreachable. They are counted in `measures.dead`.
r = checkFacts({ sets: [{ name: "Dialog", id: "0:11", page: "❖ Dialog", refs: [
  { kind: "variable", id: "V:9", prop: "strokeBottomWeight", path: "Header", variant: "Rest",
    resolved: true, remote: true, key: "k-gone", name: "Stroke/1", paints: false },
  { kind: "variable", id: "V:9", prop: "strokeTopWeight", path: "Footer", variant: "Rest",
    resolved: true, remote: true, key: "k-gone", name: "Stroke/1", paints: true },
] }] }, KEYS);
expect("an unreachable layer is dropped from a finding that stands, and counted",
  [r.audited[0].candidates[0].layers, r.measures.dead],
  [["Footer — strokeTopWeight · Rest"], 1]);


// A9 · The published-list probe gives up on a library API that never answers.
{
  const calls = { collections: 0 };
  globalThis.figma = { teamLibrary: {
    getAvailableLibraryVariableCollectionsAsync: () => { calls.collections++; return new Promise(() => {}); },
    getVariablesInLibraryCollectionAsync: () => new Promise(() => {}),
  } };
  const t0 = Date.now();
  const p = await checkFacts.probePublished(50);
  expect("a library API that never answers is given up within the bound, and the probe returns empty", [p.variables, p.styles, calls.collections, Date.now() - t0 < 2000], [[], [], 1, true]);
  globalThis.figma = { teamLibrary: {
    getAvailableLibraryVariableCollectionsAsync: async () => [{ key: "c1" }, { key: "c2" }],
    getVariablesInLibraryCollectionAsync: async (k) => (k === "c1" ? [{ key: "v1" }] : new Promise(() => {})),
  } };
  const t1 = Date.now();
  const q = await checkFacts.probePublished(50);
  expect("one collection that never answers does not empty the rest, and the deadline is one for the whole probe", [q.variables, Date.now() - t1 < 2000], [["v1"], true]);
  globalThis.figma = { teamLibrary: {
    getAvailableLibraryVariableCollectionsAsync: async () => [{ key: "c1" }, { key: "c2" }, { key: "c3" }, { key: "c4" }],
    getVariablesInLibraryCollectionAsync: () => new Promise(() => {}),
  } };
  const t2 = Date.now();
  await checkFacts.probePublished(50);
  expect("four hung collections cost one deadline, not four", Date.now() - t2 < 150, true);
  delete globalThis.figma;
}

console.log((failed ? "FAIL" : "pass") + " — " + passed + " of " + (passed + failed) + " assertions");
process.exit(failed ? 1 : 0);
