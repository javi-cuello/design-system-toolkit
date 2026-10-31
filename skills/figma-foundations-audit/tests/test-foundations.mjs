// Runs the foundations checks in node against fixture facts, with no Figma.
// The scanner body returns checkFacts when `figma` is not in scope.
//   node skills/figma-foundations-audit/tests/test-foundations.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, "..", "scripts", "foundations.js"), "utf8");
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const checkFacts = await new AsyncFunction(src)();

let failed = 0, passed = 0;
const texts = (r) => r.audited.flatMap((e) => e.candidates.map((c) => c.rule + ": " + c.text));
// Every candidate, both halves. `text` is the state, `advice` the instruction;
// they are separate fields and a check that fills only one is a defect the
// board renders as its own fallback sentence.
const cands = (r) => r.audited.flatMap((e) => e.candidates);
const advice = (r, part) => cands(r).filter((c) => (c.advice || "").includes(part)).map((c) => c.advice);
function expect(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) passed++; else { failed++; console.log("FAIL " + name + "\n  got  " + JSON.stringify(got) + "\n  want " + JSON.stringify(want)); }
}

const T = {
  sectionHeader: "^❖ [A-Z][A-Z &]*$", pageMarker: "^\\S+\\s+", pinnedLast: ["❖ DEPRECATED"],
  excludeSections: ["❖ DEPRECATED"], groupSeparator: " / ", familySeparator: " - ", internalPrefix: "_", dividerPage: "^\\s*-+\\s*$", statusMarker: "🚧"
};
const pages = (...names) => names.map((name) => ({ name }));
const comp = (name, page, parents = [], inScope = true) => ({ name, id: "0:" + name.length, page, parents, inScope });

// Page order
let r = checkFacts({ pages: pages("Cover", "❖ ACTIONS", "❖ Button", "🟠 Icon button", "---", "❖ INPUTS", "❖ Text input", "❖ Combobox", "---", "❖ DEPRECATED", "❖ Zeta", "❖ Alpha"), components: [] }, T);
expect("a swapped pair is one finding, whatever the markers; the pinned, excluded section is not ordered",
  texts(r), ["page-order: In INPUTS, Combobox comes after Text input, out of alphabetical order, so a reader hunts for it"]);

// A page several places out of position names where it belongs, not the
// neighbour it is behind — the real case: moving it above the neighbour left
// it still out of order, and the next run raised the same page again.
r = checkFacts({ pages: pages("❖ NAVIGATION", "❖ Pagination", "❖ Sidebar (Primary)", "❖ Sidebar (Secondary)", "❖ Side navigation", "❖ Stepper"), components: [] }, T);
expect("a page names the first page it sorts before, not the one it trails",
  texts(r), ["page-order: In NAVIGATION, Side navigation comes after Sidebar (Primary), out of alphabetical order, so a reader hunts for it"]);
expect("and the advice names the same destination",
  r.audited[0].candidates[0].advice.startsWith("In Figma: drag the Side navigation page above Sidebar (Primary) inside NAVIGATION."), true);
// Following the old advice literally — one place up — left it still out of
// order, which is how this was found.
r = checkFacts({ pages: pages("❖ NAVIGATION", "❖ Pagination", "❖ Sidebar (Primary)", "❖ Side navigation", "❖ Sidebar (Secondary)", "❖ Stepper"), components: [] }, T);
expect("moving it one place still raises, naming the position it has not reached",
  texts(r), ["page-order: In NAVIGATION, Side navigation comes after Sidebar (Primary), out of alphabetical order, so a reader hunts for it"]);
r = checkFacts({ pages: pages("❖ NAVIGATION", "❖ Pagination", "❖ Side navigation", "❖ Sidebar (Primary)", "❖ Sidebar (Secondary)", "❖ Stepper"), components: [] }, T);
expect("and the destination this check names is one that silences it", texts(r), []);

// The category loop had the same defect as the page loop and kept it 25 lines
// above the fix, because no project's section list is out of order.
r = checkFacts({ pages: pages("❖ DATA", "❖ a", "❖ FEEDBACK", "❖ b", "❖ INPUTS", "❖ c", "❖ ACTIONS", "❖ d"), components: [] }, T);
expect("a category names the first category it sorts before, not the one it trails",
  texts(r), ["page-order: Category ACTIONS comes after DATA, out of alphabetical order, so readers and everything presenting the file in page order look for it in the wrong place"]);
expect("and its advice names the same destination",
  advice(r, "section above").map((a) => a.match(/above ([A-Z]+) in the page list/)[1]), ["DATA"]);
r = checkFacts({ pages: pages("❖ ACTIONS", "❖ d", "❖ DATA", "❖ a", "❖ FEEDBACK", "❖ b", "❖ INPUTS", "❖ c"), components: [] }, T);
expect("and moving it there silences the check", texts(r), []);

// A part may extend its parent's name with the GROUP separator, not only the
// family one. Accepting just one told a component that starts with its
// parent's full name that it does not carry it.
r = checkFacts({ pages: [], components: [
  comp("_File explorer - Section / L1", "P"),
  comp("_File explorer - Section / L2", "P", ["_File explorer - Section / L1"]),
  comp("_File explorer - Section - Item / L1", "P", ["_File explorer - Section / L1"])
] }, T);
expect("a slash-group member that extends its parent's name carries it",
  texts(r).filter((t) => t.includes("does not carry its name")), []);

r = checkFacts({ pages: pages("❖ INPUTS", "❖ Combobox", "❖ ACTIONS", "❖ Button", "❖ DEPRECATED", "❖ OVERLAYS", "❖ Dialog"), components: [] }, T);
expect("each page-order finding is credited to its own section", r.audited.map((e) => e.page), ["❖ ACTIONS", "❖ OVERLAYS"]);
expect("categories run alphabetically, and nothing follows the pinned-last one",
  texts(r), ["page-order: Category ACTIONS comes after INPUTS, out of alphabetical order, so readers and everything presenting the file in page order look for it in the wrong place",
             "page-order: Category OVERLAYS comes after DEPRECATED, which the project pins last, so it reads as pinned too"]);

// Two pinned categories run in the recorded order, after everything else.
{
  const T2 = Object.assign({}, T, { pinnedLast: ["❖ AUXILIARY", "❖ DEPRECATED"], excludeSections: [] });
  r = checkFacts({ pages: pages("❖ ACTIONS", "❖ Button", "❖ DEPRECATED", "❖ Old", "❖ AUXILIARY", "❖ Helper"), components: [] }, T2);
  expect("pinned categories out of their recorded order are raised, keyed by the category",
    cands(r).filter((c) => c.key && c.key.startsWith("page-order|pinned|")).map((c) => c.key), ["page-order|pinned|❖ AUXILIARY"]);
  r = checkFacts({ pages: pages("❖ ACTIONS", "❖ Button", "❖ AUXILIARY", "❖ Helper", "❖ DEPRECATED", "❖ Old"), components: [] }, T2);
  expect("and in the recorded order they are silent", texts(r), []);
}

r = checkFacts({ pages: pages("❖ INPUTS", "❖ Text input", "❖ Combobox"), components: [] }, { });
expect("no header pattern recorded: page order is skipped, not guessed", texts(r), []);

// Case and separators
r = checkFacts({ pages: [], components: [comp("Switch", "a"), comp("switch", "b"), comp("Switch 2", "c")] }, T);
expect("names differing only in case", texts(r), ["naming: two components differ only in case: Switch · switch"]);

r = checkFacts({ pages: [], components: [comp("Column/Default", "t"), comp("Cell / Default", "t"), comp("Menu item / Expanded", "m")] }, T);
expect("a bare slash beside the recorded separator", texts(r), ["naming: Grouped with a bare \"/\" where this project writes \" / \", so Figma files the component in a folder nobody intended"]);

r = checkFacts({ pages: [], components: [comp("Column/Default", "t")] }, { familySeparator: " - " });
expect("no group separator recorded: the separator check is skipped", texts(r), []);

// Parent prefix
r = checkFacts({ pages: [], components: [
  comp("Empty state", "Empty state"), comp("_Thumbnail", "Empty state", ["Empty state"]),
  comp("Tabs", "Tabs"), comp("Tabs - Item", "Tabs", ["Tabs"]),
  comp("_Checkbox control", "Aux", ["Checkbox", "Checkbox group - Item"]),
  comp("Date picker", "Date picker"), comp("Calendar", "Calendar", ["Date picker"]),
  comp("Column/Default", "Table", ["Table"]), comp("Column/Action", "Table", ["Table"]),
  comp("_Header", "Table", ["Column/Default", "Column/Action"]),
  comp("_Breadcrumb - Item", "Breadcrumb", ["Breadcrumb"]), comp("_Breadcrumb - Item - Button", "Breadcrumb", ["_Breadcrumb - Item"])
] }, T);
expect("a part used by one parent and lacking its name; members of one grouped set count once; multi-parent parts and public components are exempt",
  texts(r).filter((t) => t.includes("does not carry its name")),
  ["naming: Used only inside Empty state but does not carry its name, so it sorts away from Empty state and reads as a component anyone may place",
   "naming: Used only inside Column but does not carry its name, so it sorts away from Column and reads as a component anyone may place"]);
// figma-standard rule 13: a leading status marker is a status, not part of the name. Left
// on, it hid the privacy mark, and every 🚧 part read as not carrying its parent.
const r24 = checkFacts({ pages: [], components: [
  comp("🚧 Card", "Card"), comp("🚧 _Card - Header", "Card", ["🚧 Card"]),
  comp("🚧 Slider", "Slider"), comp("🚧 _Thumb", "Slider", ["🚧 Slider"])
] }, T);
expect("a 🚧 part that carries its parent's name once the marker is set aside is not flagged, and one that does not still is",
  texts(r24).filter((t) => t.includes("does not carry its name")),
  ["naming: Used only inside 🚧 Slider but does not carry its name, so it sorts away from 🚧 Slider and reads as a component anyone may place"]);
// figma-standard rule 9 since 2026-10-07: a family and its part are joined by a space, and
// a family with its own category drops the family word from its members.
const T23 = Object.assign({}, T, { familySeparator: " " });
const r23 = checkFacts({ pages: pages("❖ INPUTS", "❖ Card", "❖ TABLES", "❖ Table", "❖ Toolbar"), components: [
  comp("Card", "❖ Card"), comp("_Card header", "❖ Card", ["Card"]), comp("_Badge", "❖ Card", ["Card"]),
  comp("Table", "❖ Table"), comp("Cell / Fill", "❖ Table", ["Column"]), comp("_Grip", "❖ Table", ["Table"]),
  comp("List", "❖ Card"), comp("List group", "❖ Card", ["List"]), comp("_List item", "❖ Card", ["List group"])
] }, T23);
expect("space-joined parts carry their family, which may be a leading run of the parent (List item inside List group); a TABLES member may drop the family word; a part elsewhere without it is still flagged",
  texts(r23).filter((t) => t.includes("does not carry its name")),
  ["naming: Used only inside Card but does not carry its name, so it sorts away from Card and reads as a component anyone may place"]);
// A category the data cannot pair by plural is named in familyCategories.
{
  const facts = { pages: pages("❖ INPUTS", "❖ GRIDS", "❖ Table", "❖ Toolbar"), components: [
    comp("Table", "❖ Table"), comp("Cell / Fill", "❖ Table", ["Column"]), comp("_Grip", "❖ Table", ["Table"])] };
  const flagged = (t) => texts(checkFacts(facts, t)).filter((x) => x.includes("does not carry its name")).length;
  expect("a category the data cannot pair is exempt only when familyCategories names it", [flagged(T23), flagged(Object.assign({}, T23, { familyCategories: ["GRIDS"] }))], [1, 0]);
}
// figma-standard rule 14: deprecation marked with the page marker, the name prefix and the category.
const T26 = Object.assign({}, T, { deprecatedPagePrefix: "🚫", deprecatedNamePrefix: "[🚫 DEPRECATED] - ", deprecatedCategory: "DEPRECATED" });
const r26 = checkFacts({ pages: pages("❖ INPUTS", "❖ Text input", "❖ DEPRECATED", "🚫 Side nav", "❖ Old tag"), components: [
  comp("Text input", "❖ Text input"),
  comp("[🚫 DEPRECATED] - Side nav", "🚫 Side nav"), comp("Side nav item", "🚫 Side nav"),
  comp("_[DEPRECATED] Feedback tag", "❖ Old tag")
] }, T26);
expect("figma-standard rule 14: a part on a deprecated page without the prefix, a name marked deprecated another way, and a deprecated-category page without the marker",
  texts(r26).filter((t) => t.startsWith("deprecation")),
  ['deprecation: Page "❖ Old tag" sits in the DEPRECATED category without the 🚫 marker, so it reads as current',
   "deprecation: Sits on a deprecated page without the deprecation prefix, so people placing it are not told it is leaving",
   "deprecation: Marked deprecated without the house prefix, so a search or filter for deprecated components misses it"]);
// The proposed name is the INSTRUCTION, not the state. It sat inside `text`,
// so the board's question column asked "…figma-standard rule 9 would call it X" and its
// recommendation column said "Decide how to handle it."
expect("and the name it proposes is in the advice, not in the state",
  advice(r, "or say why it stands on its own").map((a) => a.match(/rename it to "([^"]+)"/)[1]),
  ["_Empty state - Thumbnail", "_Column - Header"]);

// A part and its parent usually share a family, and pasting the two names
// together proposed `Table - Column - Table - Header / Fill`. The finding was
// right; the rename was unusable, which is worse than none — it reads as the
// answer. Found live on one registered project's web library.
r = checkFacts({ pages: [], components: [
  comp("Table - Column", "Table"),
  comp("Table - Header / Fill", "Table", ["Table - Column"]),
  comp("Sidebar (Secondary) - Section", "Nav"),
  comp("Sidebar (Secondary) - Item", "Nav", ["Sidebar (Secondary) - Section"]),
  comp("Dialog", "Overlay"), comp("Footer", "Overlay", ["Dialog"])
] }, T);
expect("the proposed name drops the family the part already shares with its parent",
  advice(r, "or say why it stands on its own").map((a) => a.match(/rename it to "([^"]+)"/)[1]),
  ["Table - Column - Header / Fill", "Sidebar (Secondary) - Section - Item", "Dialog - Footer"]);
// Under the house's space join, the proposal is rule 9's: the page's component and the part's last word.
r = checkFacts({ pages: [], components: [comp("Card", "❖ Card"), comp("_Card section header", "❖ Card", ["Card"]), comp("_Media / Wide", "❖ Card", ["Card"])] }, Object.assign({}, T, { familySeparator: " ", pageMarker: "^\\S+\\s+" }));
expect("figma-standard rule 9: the proposed name is the documented component plus the part's last word, a sibling suffix kept",
  advice(r, "or say why it stands on its own").map((a) => a.match(/rename it to "([^"]+)"/)[1]), ["_Card media / Wide"]);

// Nothing left after the shared run means the part IS a prefix of its parent,
// so it carries the name by any reading and there is no finding to make.
r = checkFacts({ pages: [], components: [
  comp("Table - Column", "Table"), comp("Table", "Table", ["Table - Column"])
] }, T);
expect("a part that is a prefix of its parent raises nothing",
  texts(r).filter((t) => t.includes("does not carry its name")), []);

// A part named for its parent, with the privacy mark and nothing else, already
// carries the parent's name — the rename this proposed was `_Dialog - Dialog`.
r = checkFacts({ pages: [], components: [
  { name: "Dialog", id: "d", page: "P", parents: [] },
  { name: "_Dialog", id: "e", page: "P", parents: ["Dialog"] },
  { name: "_Modal", id: "f", page: "P", parents: ["Dialog"] },
] }, T);
expect("a part whose name IS its parent's carries it; a differently named one does not",
  texts(r).filter((t) => t.includes("does not carry its name")),
  ["naming: Used only inside Dialog but does not carry its name, so it sorts away from Dialog and reads as a component anyone may place"]);

r = checkFacts({ pages: [], components: [comp("_Thumbnail", "E", ["Empty state"])] }, { groupSeparator: " / " });
expect("no family separator recorded: the prefix check is skipped", texts(r).filter((t) => t.includes("does not carry its name")), []);

// Scope
r = checkFacts({ pages: [], components: [comp("Switch", "a", [], false), comp("switch", "b", [], false)] }, T);
expect("components outside the audit's scope raise nothing", texts(r), []);

// ---- the snapshot path ------------------------------------------------
// The same facts, built from stored specs instead of a live file. The live
// gather was a second reader of what the store already held (toolkit-standard
// §D 5); these assert the adapter produces what checkFacts expects, including
// the parent walk's one real trap: a child of a child must not be credited to
// its grandparent.
const { factsFromSnapshot } = await import("../scripts/from-snapshot.mjs");
const inst = (name, of, children) => ({ name, type: "INSTANCE", instanceOf: of, children: children || [] });
const snap = {
  pages: ["Cover", "\u2756 INPUTS", "Text input", "Icon", "\u2756 DEPRECATED", "Old thing"],
  specs: [
    { name: "Text input", id: "1:1", page: "Text input", variants: [
      { name: "State=Rest", type: "COMPONENT", children: [
        inst("Leading", "Icon / Size=16", [inst("Glyph", "Glyph / Size=16")]),
      ] } ] },
    { name: "Icon", id: "2:2", page: "Icon", variants: [{ name: "Size=16", type: "COMPONENT", children: [] }] },
    { name: "Glyph", id: "3:3", page: "Icon", variants: [{ name: "Size=16", type: "COMPONENT", children: [] }] },
    { name: "Old thing", id: "4:4", page: "Old thing", variants: [{ name: "Default", type: "COMPONENT", children: [] }] },
  ],
};
const ST = { sectionHeader: "^\u2756 [A-Z][A-Z &]*$", excludeSections: ["\u2756 DEPRECATED"] };
const { facts, unread } = factsFromSnapshot(snap, ST);
expect("every page in the file's order, components keyed to their page",
  [facts.pages.length, facts.components.map((c) => c.name).join()],
  [6, "Text input,Icon,Glyph,Old thing"]);
expect("a section the project excludes puts its components out of scope",
  facts.components.filter((c) => !c.inScope).map((c) => c.name), ["Old thing"]);
expect("a direct child gets its parent; a child of a child does not get the grandparent",
  [facts.components.find((c) => c.name === "Icon").parents, facts.components.find((c) => c.name === "Glyph").parents],
  [["Text input"], []]);
expect("a page no component reaches is named, not silently clean", unread, ["Cover", "\u2756 INPUTS", "\u2756 DEPRECATED"]);

// The store namespaces a component whose name does not start with its page's:
// `cursor` on the Graphic page is stored `Graphic/cursor`. Read as the name,
// that is a bare slash the designer never wrote — six false findings against
// one real library, disproved by a live run of the same file.
const ns = factsFromSnapshot({ pages: ["\u2756 Graphic"], specs: [
  { name: "Graphic/cursor", figmaName: "cursor", id: "5:5", page: "\u2756 Graphic", variants: [] },
  { name: "Graphic/earth", id: "6:6", page: "\u2756 Graphic", variants: [] },
  { name: "Tag", id: "7:7", page: "\u2756 Graphic", variants: [] },
] }, {});
expect("figmaName settles it; without one the prefix is stripped and the name is flagged unsettled",
  [ns.facts.components.map((c) => c.name).join(), ns.unsettled],
  ["cursor,earth,Tag", ["Graphic/earth"]]);
expect("neither reaches the rules as a bare slash",
  texts(checkFacts(ns.facts, { groupSeparator: " / " })).filter((t) => t.includes("bare")), []);

// An icon page's components have no stored spec — the page is exported as
// SVGs — so they arrive as names and a page. Without them one library's audit
// saw 40 of its 69 components and could not say which 29 were missing.
const ic = factsFromSnapshot({
  pages: ["\u2756 Icon", "\u2756 Button"],
  specs: [{ name: "Button", id: "8:8", page: "\u2756 Button", variants: [
    { name: "Size=md", type: "COMPONENT", children: [inst("Icon", "Icon/plus / Size=20")] } ] }],
  icons: [{ name: "plus", page: "\u2756 Icon" }, { name: "search", page: "\u2756 Icon" }],
}, {});
expect("icons join the components, on their own page",
  ic.facts.components.map((c) => [c.name, c.page]),
  [["Button", "\u2756 Button"], ["plus", "\u2756 Icon"], ["search", "\u2756 Icon"]]);
expect("a consumer naming an icon the way the store namespaces it still credits the parent",
  ic.facts.components.find((c) => c.name === "plus").parents, ["Button"]);
expect("an icon nothing uses keeps no parent", ic.facts.components.find((c) => c.name === "search").parents, []);
expect("and checkFacts reads the adapter's facts unchanged",
  texts(checkFacts(facts, ST)).length >= 0, true);

// ---- resolving an instance to its component ----------------------------
// Both of these were measured against two real stored libraries before they
// were fixed, and both are about reading a NAME where the store has a fact.
{
  const { factsFromSnapshot } = await import('../scripts/from-snapshot.mjs');

  // A component may have a " / " in its own name. Cutting at the first one
  // takes half the name and the instance resolves to nothing: 42 stored
  // components across two projects are named this way, and one library lost
  // 447 of its 4,873 edges to it.
  const nested = factsFromSnapshot({
    pages: ['Page'],
    specs: [
      { name: 'Table - Cell / Fill', page: 'Page', variants: [{ name: 'v', children: [] }] },
      { name: 'Table - Cell', page: 'Page', variants: [{ name: 'v', children: [] }] },
      { name: 'Table', page: 'Page', variants: [{ name: 'v', children: [
        { type: 'INSTANCE', name: 'Cell', instanceOf: 'Table - Cell / Fill / Size=md', children: [] }] }] },
    ],
  }, {});
  const cell = nested.facts.components.find((c) => c.name === 'Table - Cell / Fill');
  const shorter = nested.facts.components.find((c) => c.name === 'Table - Cell');
  expect('the longest stored name wins, so a component with a slash in its name resolves',
    [cell.parents, shorter.parents], [['Table'], []]);

  // A name two stored specs both claim cannot say which was placed. One
  // project defines Button, Avatar, Badge and twelve more in both its web and
  // its mobile library, and keeping the last credited every one of them to
  // whichever was read second.
  const collide = factsFromSnapshot({
    pages: ['Page'],
    specs: [
      { name: 'Button', page: 'Page', variants: [{ name: 'v', children: [] }] },
      { name: 'Button', page: 'Page', variants: [{ name: 'v', children: [] }] },
      { name: 'Toolbar', page: 'Page', variants: [{ name: 'v', children: [
        { type: 'INSTANCE', name: 'Button', instanceOf: 'Button / Size=md', children: [] }] }] },
    ],
  }, {});
  expect('an ambiguous name is credited to neither, rather than to the last one read',
    collide.facts.components.filter((c) => c.name === 'Button').map((c) => c.parents), [[], []]);
}

/*
 * EVERY check emits both halves — asserted as a field, never as wording.
 *
 * `advice` was added to the callers and not to `push`'s signature, so it was
 * a seventh argument to a function of six and every one was silently
 * dropped. Nothing failed: the candidates were well formed, the rows filed,
 * and the board rendered its own fallback on every foundations row for four
 * versions while the skill said in writing that every check emitted advice.
 *
 * This asserts the shape over a run that trips all four checks at once, so a
 * check added later without advice fails here rather than shipping a row
 * that reads "Decide how to handle it."
 */
{
  const all = await checkFacts({
    pages: pages("❖ INPUTS", "01 Select", "00 Button", "❖ DEPRECATED", "❖ ALERTS", "01 Toast"),
    components: [
      comp("Card/Header", "01 Select"),              // bare separator
      comp("card/header", "01 Select"),              // case collision with it
      comp("Parent", "01 Select"),
      comp("_Bit", "01 Select", ["Parent"]),         // figma-standard rule 9
    ],
  }, T);
  const every = cands(all);
  expect("the fixture trips every check", every.length > 3, true);
  expect("and not one candidate is missing its advice",
    every.filter((c) => !c.advice || !String(c.advice).trim()).map((c) => c.rule + ": " + c.text), []);
  expect("the advice is an instruction, never a repeat of the state",
    every.filter((c) => String(c.advice).trim() === String(c.text).trim()), []);
  expect("every rule that fired is represented",
    [...new Set(every.map((c) => c.rule))].sort(), ["naming", "page-order"]);
}

/*
 * A run says what it READ, and which checks ran.
 *
 * Every check here is gated on a setting from the project's context document.
 * A document missing one makes its check vanish without a word — and the
 * caller files with `full: true`, which is allowed to close the rows it no
 * longer raises. So a check that silently did not run closed its own rows
 * with "a full run no longer raises this", while the thing it checks was
 * still wrong. The reach is what bounds that close; `ran`/`notRun` is what
 * makes the absence sayable.
 */
{
  const facts = { pages: pages("❖ INPUTS", "01 Select"),
                  components: [comp("Card/Header", "01 Select"), comp("Parent", "01 Select"), comp("_Bit", "01 Select", ["Parent"])] };

  const full = await checkFacts(facts, T);
  expect("a run names the page list and every component it was given",
    full.reach, ["Page list", "Card/Header", "Parent", "_Bit"]);
  expect("and every check ran", [full.ran.sort(), full.notRun], [["page-order", "parent-name", "separator", "status-marker"], ["deprecation", "mode-pin", "page-template"]]);
  // a name that departs from a naming preference works; it is filed as one, never as a defect
  expect("a bare slash and a part without its parent's name are preferences",
    full.audited.flatMap((e) => e.candidates).filter((c) => /^naming\|(separator|parent-name)/.test(c.key)).map((c) => c.key.split("|")[1] + " " + c.sev).sort(),
    ["parent-name preference", "separator preference"]);

  // The context document is missing `groupSeparator`: the separator check
  // cannot run, and used to vanish in silence.
  const { groupSeparator, ...partial } = T;
  const some = await checkFacts(facts, partial);
  expect("a check gated on a missing setting is reported, not implied",
    [some.ran.sort(), some.notRun], [["page-order", "parent-name", "status-marker"], ["separator", "deprecation", "mode-pin", "page-template"]]);

  // A project that HAS a separator but does not group with a slash has
  // nothing for this check to look at — which is not the same as not
  // running it, and used to be reported as "the context document does not
  // carry the setting", which was false of a document that carries it.
  const dotted = await checkFacts(facts, { ...T, groupSeparator: " . " });
  expect("a check whose subject the project does not have is 'not applicable', not 'not run'",
    [dotted.notRun, dotted.notApplicable], [["deprecation", "mode-pin", "page-template"], ["separator"]]);
  expect("and it raises nothing, which is why silence had to be sayable",
    texts(some).filter((t) => t.includes("bare")), []);

  // A scan that read nothing names nothing, so the caller's close is empty.
  const nothing = await checkFacts({ pages: [], components: [] }, T);
  expect("a run that read no component still names only the page list", nothing.reach, ["Page list"]);
}

/*
 * The parent relation comes from whoever owns it, when they have it.
 *
 * "Which component is placed inside which" is one relation with one owner,
 * `tools/snapshot/graph.cjs`, which resolves by the key the
 * plugin recorded and falls back to the node id. A skill may not require it,
 * so it takes the relation as INPUT — which graph.cjs's header said this file
 * did, while it re-derived the relation from display names instead. The two
 * disagree on 40 of 196 components in one real library (84 credited
 * against 94).
 *
 * The name walk stays as the fallback, and `parentsFrom` says which ran, so
 * nobody has to assume it was the stronger one.
 */
{
  const snap = {
    pages: ['❖ Card'],
    specs: [
      { name: 'Card', page: '❖ Card', variants: [{ name: 'v', children: [
        { type: 'INSTANCE', name: 'Bit', instanceOf: '_Bit / Size=md', children: [] }] }] },
      { name: '_Bit', page: '❖ Card', variants: [{ name: 'v', children: [] }] },
    ],
  };

  const walked = factsFromSnapshot(snap, T);
  expect('with nothing supplied it walks the names, and says so', walked.parentsFrom, 'names');
  expect('and finds the parent that way',
    walked.facts.components.find((c) => c.name === '_Bit').parents, ['Card']);

  // The owner's answer, which need not agree with the name walk — here it
  // credits a parent the names could not have reached.
  const supplied = factsFromSnapshot(snap, T, { parents: { '_Bit': ['Toolbar'] } });
  expect('a supplied relation is used as given', supplied.parentsFrom, 'given');
  expect('and the name walk does not run beside it',
    supplied.facts.components.find((c) => c.name === '_Bit').parents, ['Toolbar']);
  expect('a component the caller said nothing about gets no parents',
    supplied.facts.components.find((c) => c.name === 'Card').parents, []);
}

// Every finding says what it is about, for the row writer.
{
  const rr = checkFacts({ pages: pages("❖ INPUTS", "❖ Combobox", "❖ ACTIONS", "❖ Button"), components: [comp("_A - B / C", "P", ["_A - B"])] }, T);
  const all = cands(rr);
  expect("every foundations candidate carries a key", all.filter((c) => !c.key).length === 0 && all.length > 0, true);
  expect("a page-order key names the category, not the sentence", all.filter((c) => c.rule === "page-order").map((c) => c.key), ["page-order|category|ACTIONS"]);
}


/* ---- Mode pins (1.13.0) ------------------------------------------------
 * Written from a live library: three generations of one collection were
 * pinned at once (`[Brand C, Brand B]` ×64, `[Brand A, Brand B]` ×25,
 * `[Light, Dark]` ×22) and rendered without error, which is why nothing had
 * caught it. A second check — "the collection's library provides no
 * variables", for pins left by a retired library — was written, run, and
 * dropped: it could not tell a retired collection from a hidden primitives
 * tier, and reported three false findings out of four.
 */
{
  const pin = (o) => Object.assign({ page: "P", node: "Frame", id: "1:1", collectionId: "C1",
    collection: "04. Brand", modes: ["Light", "Dark"], mode: "Light", isExtension: false, theme: true,
    inComponent: false, shadowed: false, current: false }, o);
  const cands = (r) => r.audited.flatMap((e) => e.candidates).filter((c) => c.rule === "mode-pin");

  const gens = checkFacts({ pages: [], components: [], pins: [
    pin({ collectionId: "old", modes: ["Brand A", "Brand B"], mode: "Brand A", theme: false }),
    pin({ collectionId: "mid", modes: ["Brand C", "Brand B"], mode: "Brand C", theme: false, node: "B" }),
    pin({ collectionId: "now", modes: ["Light", "Dark"], mode: "Light", node: "C" }),
  ] }, {});
  const g = cands(gens);
  expect("several collections of one name pinned at once is reported, naming each generation",
    [g.length, /3 generations/.test(g[0].text), /Brand A, Brand B/.test(g[0].text), !!g[0].advice],
    [1, true, true, true]);

  /*
   * Severity comes from what the stale pin actually costs, which a screenshot
   * taught: the first live finding was an `Examples` frame pinned to a mode
   * its collection no longer had, rendering perfectly, because the frames
   * inside it re-pin the current collection and the nearest pin wins.
   */
  expect("furniture whose inner frames re-pin the collection is tidy-up, not a defect",
    cands(checkFacts({ pages: [], components: [], pins: [
      pin({ collectionId: "old", modes: ["Brand A"], mode: "Brand A", theme: false, shadowed: true }),
      pin({ collectionId: "now", modes: ["Light", "Dark"], mode: "Light", node: "C", current: true }),
    ] }, {}))[0].sev, "review");
  expect("furniture with nothing re-pinning it shows a default nobody chose",
    cands(checkFacts({ pages: [], components: [], pins: [
      pin({ collectionId: "old", modes: ["Brand A"], mode: "Brand A", theme: false }),
      pin({ collectionId: "now", modes: ["Light", "Dark"], mode: "Light", node: "C" }),
    ] }, {}))[0].sev, "warning");
  expect("a stale pin inside a component is an error, because the component itself resolves wrongly",
    cands(checkFacts({ pages: [], components: [], pins: [
      pin({ collectionId: "old", modes: ["Brand A"], mode: "Brand A", theme: false, inComponent: true }),
      pin({ collectionId: "now", modes: ["Light", "Dark"], mode: "Light", node: "C" }),
    ] }, {}))[0].sev, "error");

  const one = checkFacts({ pages: [], components: [], pins: [pin({}), pin({ node: "B" })] }, {});
  expect("one generation, however many frames pin it, raises nothing", cands(one).length, 0);

  const brandOnly = checkFacts({ pages: [], components: [], pins: [
    pin({ collection: "Brand B", collectionId: "X", isExtension: true, theme: false }),
  ] }, {});
  const b = cands(brandOnly);
  expect("a brand pinned with no theme beside it is a question, not a defect",
    [b.length, b[0].sev, /without pinning a theme/.test(b[0].text)], [1, "review", true]);

  const paired = checkFacts({ pages: [], components: [], pins: [
    pin({ collection: "Brand B", collectionId: "X", isExtension: true, theme: false }),
    pin({ collection: "03. Semantic", collectionId: "S", theme: true }),
  ] }, {});
  expect("a brand and a theme pinned on the same frame raises nothing, and the check reports it ran",
    [cands(paired).length, paired.ran.includes("mode-pin"), paired.ran.includes("mode-pin:clean")], [0, true, true]);

  const noPins = checkFacts({ pages: [], components: [] }, {});
  expect("no pins gathered means the check did not run, never that the file is clean",
    [noPins.ran.includes("mode-pin"), noPins.notRun.includes("mode-pin")], [false, true]);
}

// ---- figma-standard rule 13: in-progress pages and their components ----------
{
  const r13 = (comps) => texts(checkFacts({ pages: [], components: comps }, T)).filter((x) => /in-progress page|not in progress/.test(x));
  expect("figma-standard rule 13: a component on a 🚧 page without the marker is raised, and one with it (before or after _) is not",
    r13([comp("Time input", "🚧 Time input"), comp("🚧 Time input picker", "🚧 Time input"), comp("_🚧 Time input item", "🚧 Time input")]),
    ["naming: Time input sits on an in-progress page and does not carry 🚧, so people placing it take it for finished"]);
  expect("a private part with the marker before its _ is raised: Figma publishes it",
    texts(checkFacts({ pages: [], components: [comp("🚧 _Time input picker", "🚧 Time input")] }, T)).filter((x) => /publishes/.test(x)),
    ["naming: 🚧 _Time input picker puts 🚧 before _, so Figma publishes this private part"]);
  expect("and so is a private part with the deprecation prefix before its _",
    texts(checkFacts({ pages: [], components: [comp("[🚫 DEPRECATED] - _Old item", "🚫 Old"), comp("_[🚫 DEPRECATED] - Old row", "🚫 Old")] }, Object.assign({}, T, { deprecatedNamePrefix: "[🚫 DEPRECATED] - ", deprecatedPagePrefix: "🚫" }))).filter((x) => /deprecation/.test(x)),
    ["deprecation: Puts the deprecation prefix before _, so Figma publishes this private part"]);
  expect("and a marked component on a finished page is raised",
    r13([comp("🚧 Button", "❖ Button")]), ["naming: 🚧 Button carries 🚧 on a page that is not in progress, so people avoid a component that may be finished"]);
}

// ---- figma-standard rule 15: the component-page template --------------------
{
  const TT = Object.assign({}, T, { pageSections: ["Examples", "Component", "Parts", "Properties", "Matrix"], pageSectionComponent: "Section header", matrixSection: "Matrix" });
  const tpl = (page, sections, primaryAxes, blocks = false) => ({ page, sections, primaryAxes, blocks });
  const run = (templates) => texts(checkFacts({ pages: [], components: [], templates }, TT)).filter((x) => x.startsWith("page-template"));
  expect("figma-standard rule 15: a page in template order, with a Matrix for a primary that has axes, raises nothing",
    run([tpl("❖ Button", ["Examples", "Component", "Properties", "Matrix"], true), tpl("❖ Divider", ["Examples", "Component", "Properties"], false)]), []);
  expect("sections out of order are raised",
    run([tpl("❖ Button", ["Component", "Examples", "Properties", "Matrix"], true)]), ["page-template: ❖ Button's sections run Component · Examples · Properties · Matrix, out of the template's order Examples · Component · Properties · Matrix, so a reader looks for a section where it is not"]);
  expect("a Matrix missing for a primary with axes, and one present for a primary with none, are raised",
    run([tpl("❖ Button", ["Examples", "Component", "Properties"], true), tpl("❖ Divider", ["Examples", "Component", "Matrix"], false)]),
    ["page-template: ❖ Button has no Matrix though its primary component has variant axes or booleans, so nobody can see every combination side by side", "page-template: ❖ Divider has a Matrix, but its primary component has nothing to permute, so the section repeats a single item"]);
  expect("a page with no section cards is raised; a building-block page is exempt",
    run([tpl("❖ Chip", [], true), tpl("❖ _Row", [], true, true)]), ["page-template: ❖ Chip has none of the template's sections (Examples · Component · Parts · Properties · Matrix), so a reader finds nothing where every other page puts it"]);
  expect("without pageSections in the settings, the template check does not run, and says so",
    checkFacts({ pages: [], components: [], templates: [tpl("❖ Chip", [], true)] }, T).notRun.includes("page-template"), true);
}


// The tokens library and the icon library, from the stored snapshot (library.mjs).
{
  const { tokenChecks, iconChecks, namesUsed } = await import("../scripts/library.mjs");
  const col = (values, extra = {}) => ({ modes: ["Value"], values: { Value: values }, alias: { Value: extra.alias || {} }, descriptions: extra.descriptions || {}, hidden: extra.hidden || [] });
  const tokens = {
    _meta: { sources: { T: { owns: { collections: ["Primitives", "Semantic"], textStyles: ["Body"], effects: ["Raised"] } }, C: { owns: { collections: ["Local"] } } } },
    collections: {
      Primitives: col({ "Grey/1": "#eee", "Grey/2": "#ccc", "Size/4": 4 }, { hidden: ["Grey/1", "Grey/2"], descriptions: { "Size/4": "Small gaps" } }),
      Semantic: col({ "Text/Base/base": 0, "Text/Base/soft": 0, "Text/Primary/base": 0, "Text/Primary/soft": 0, "Text/Brand/base": 0, "Text/brand/Base": 0, "Icon/x": 0, "Icon/Big/y": 0 },
        { alias: { "Text/Base/base": "Grey/1" }, descriptions: { "Text/Base/base": "Body copy" } }),
      Local: col({ "Only/here": 0 }),
    },
    textStyles: [{ name: "Body", bound: { fontFamily: { name: "f" }, fontSize: { name: "Size/4" }, fontWeight: { name: "w" } } }],
    effects: [{ name: "Raised", layers: [{ bound: { color: { name: "c" }, x: {}, y: {}, blur: {}, spread: {} } }] }],
  };
  const used = namesUsed([{ fills: ["Text/Base/base"], textStyle: "Body", children: [{ gap: "Text/Primary/base" }] }]);
  const r = tokenChecks({ tokens, source: "T", used });
  const by = (rule) => r.findings.filter((f) => f.rule === rule);
  // The names a row covers, after the sentence that says what is wrong with them.
  const names = (f) => f.fix[0].slice(f.check.length + 2);
  expect("tokens: an undescribed published token is raised per collection; a hidden one owes none",
    by("tokens-description").map((f) => f.where + ": " + f.check), ["Semantic: 7 published tokens have no description, so people and agents picking a token cannot tell it from its neighbours"]);
  expect("and a row states the problem before the names it covers, never the names alone",
    r.findings.every((f) => f.fix[0].startsWith(f.check + ": ")), true);
  expect("tokens: a token no component, style or used token reaches is unused; an alias target and a style's binding are used",
    by("tokens-unused").map((f) => f.where + ": " + names(f)), ["Primitives: Grey/2.", "Semantic: Text/Base/soft, Text/Primary/soft, Text/Brand/base, Text/brand/Base, Icon/x, Icon/Big/y."]);
  expect("tokens: a style field Figma can bind and the style leaves loose is raised, one row per field",
    by("tokens-style-binding").map((f) => f.where + " " + f.key.split("|")[2]), ["Text styles lineHeight", "Text styles letterSpacing"]);
  expect("tokens: two names that differ only in case are an error",
    by("tokens-naming").map((f) => f.sev + " " + f.check), ["error Text/Brand/base and Text/brand/Base differ only in case or separator, so code exports them as one name and one overwrites the other"]);
  expect("tokens: a group holding tokens and groups, and a sibling group missing a common leaf, are one structure row",
    by("tokens-structure").map((f) => f.where + ": " + names(f)), ["Semantic: Icon holds both tokens (x) and groups, Text/brand has no base, which most of its siblings have."]);
  expect("tokens: a collection another file owns is not this library's", r.findings.some((f) => f.where === "Local"), false);
  expect("tokens: nothing stored from the file, nothing ran", tokenChecks({ tokens, source: "nope" }).ran, []);

  const icons = { _meta: { sources: { I: { owns: { iconSizes: { plus: [16, 20, 24], minus: [16, 20, 24], spark: [16, 24], "AI symbol": [16, 20, 24] }, unboundIcons: ["spark@16"] } } } } };
  const ic = iconChecks({ tokens: icons, source: "I", names: ["plus", "minus", "spark"] });
  expect("icons: a set missing a size most sets have, an unbound paint and a name the icon set lacks are raised",
    ic.findings.map((f) => f.rule + ": " + f.fix[0].slice(f.check.length + 2)), ["icons-sizes: spark (no 20).", "icons-fill: spark@16.", "icons-name: AI symbol."]);
  expect("icons: with no icon set named and no paints stored, only the size check runs",
    iconChecks({ tokens: { _meta: { sources: { I: { owns: { iconSizes: { plus: [16] } } } } } }, source: "I" }).ran, ["icons-sizes"]);
}

// The house pageMarker is Unicode: "❖ États" sorts as États, not as "tats" (an ASCII class ate the É).
expect("the house page marker keeps an accented first letter",
  texts(checkFacts({ pages: pages("❖ INPUTS", "❖ États", "❖ Mono"), components: [] }, Object.assign({}, T, { pageMarker: "^[^\\p{L}\\p{N}_]+" }))).filter((x) => x.startsWith("page-order")), []);

console.log((failed ? "FAIL" : "pass") + " — " + passed + " of " + (passed + failed) + " assertions");
process.exit(failed ? 1 : 0);
