# Shared helpers

**This file is the reasoning. The code is in `scripts/`.**

| File | Holds | Tested by |
|---|---|---|
| `scripts/docgen.js` | everything pure — sorting, namespace strip, depth rule, colour/OKLCH formatting, type units, column mapping, prefix stripping, width rungs | `node tests/test-docgen.js` |
| `scripts/figma-helpers.js` | everything that needs a node — cell writers, slot sizing, section headers, swatch binding, width measurement | `node --check` only; the rest needs a live file |
| `scripts/recipes.js` | whole-page procedures built from both — `generate()` | `node --check` only |

**Load once per file, not once per call.** Each script is a named factory that caches its own source into the document's plugin data. Later calls — this session or any future one — bootstrap in three lines instead of re-sending 51KB:

```js
['dg.docgen.v1','dg.helpers.v1','dg.recipes.v1'].forEach(function (k) {
  var s = figma.root.getPluginData(k); if (s) (0, eval)('(' + s + ')')();
});
```

Paste **docgen.js first** — the other two call into `DOCGEN` at runtime. Verify a first paste: each load returns a hash and `node scripts/hash.js` prints what all three should be. Equal means the bytes that reached the file are the bytes on disk. This is the one step nothing else can check, and caching a corrupt source would make it permanent — so the hash gates the cache write (`globalThis.__DG_EXPECT`) rather than being reported after it. It covers code, not comments: a gate that fails on a reworded comment trains you to ignore it. Any code change to a script changes its hash, so a file's cached copies need one re-paste; a comment-only change does not. `node tests/test-load-protocol.js` covers the protocol.

**Three facts about the sandbox, all tested 2026-08-08, all of which this file previously denied:** `eval` exists; globals persist across `figma_execute` calls within one file (not across files); `Function.prototype.toString()` returns real source. The belief that a script must be re-sent every call was false, and it was the single largest cost in running this skill. One thing that *is* true: indirect eval does **not** leak declarations into globals here, so each factory installs its public names explicitly.

The split rule: **if it needs `figma` or a node it is in `figma-helpers.js`; if it does not, it is in `docgen.js` with a test.** Pure logic that used to hide inside a node function has been lifted out and is called back into the node half — `matchesPropKey`, `normaliseWidths` — so each rule has exactly one implementation.

**The sandbox accepts modern JavaScript — verified 2026-08-08** against Figma Desktop with Desktop Bridge plugin 1.39.0, by executing arrow functions, `const`/`let`, template literals, spread, destructuring with defaults, `??`, `?.`, `class`, shorthand properties, `**` and `globalThis` in one call, which parsed and returned. This file previously said ES5 only. That was probably true once — Figma's plugin sandbox has not always been current — and it stayed written down long after it stopped being true, at the cost of every author since writing more verbose code than they needed to. **Existing ES5 code is not a defect and is not being rewritten**: it works, it is tested, and churning it buys nothing. New code may use modern syntax; keep a single file internally consistent rather than mixing styles. Re-test with the same one-call probe if a Figma update ever makes this suspect.

---

## Contents

Sections below explain the code and carry the snippets that are genuinely call-site templates rather than reusable functions.

- [Font preload](#font-preload) — discovery and per-call load snippets
- [Node matching](#node-matching) · [Cell writers](#cell-writers) · [Slot sizing](#slot-sizing) · [Section header and title](#section-header-and-title) — why each rule exists
- [Sorting](#sorting) · [Formatting](#formatting) — the reasoning the script cannot carry at length
- [Live-object caches](#live-objects--fetch-in-bulk-once-then-work-synchronously) — alias-heavy pages (semantic, brand, shadows)
- [Column mapping](#column-mapping--read-the-header-labels-never-assume-position) · [Width measurement](#width-measurement)
- [Doc component discovery by key](#doc-component-discovery-by-key) — Step 1 routes 2 and 3
- [Structural probe](#structural-probe) — `probeComponent`, and what to read in its output

---

## Font preload

Discover once, persist, then load at the top of every call that creates instances.

```js
// --- one-off discovery (run once, store on root) ---
var fonts = {};
// harvest(component, fonts) every doc component (all variants of each COMPONENT_SET)
var list = Object.keys(fonts).map(function(s){
  var p = s.split("||"); return {family: p[0], style: p[1]};
});
figma.root.setPluginData("docFonts", JSON.stringify(list));
```

```js
// --- top of EVERY generating call ---
await loadDocFonts();   // accepts both persisted shapes; a raw loadFontAsync loop does not (1.15.0)
```

Before any `setTextStyleIdAsync`, also load the **source file's** text style fonts — a different set:

```js
var seen = {};
for (var i = 0; i < textStyles.length; i++) {
  var k = textStyles[i].family + "||" + textStyles[i].style;
  if (seen[k]) continue; seen[k] = true;
  try { await figma.loadFontAsync({family: textStyles[i].family, style: textStyles[i].style}); }
  catch (e) { /* record and report; do not abort the batch */ }
}
```

---

## Node matching

**Match by name. Never by type.** The swatch has been observed as both `RECTANGLE` and `FRAME` across copies of the same library; a type-based `findOne` returns `null` and fails silently.

### `Content slot` is not unique inside a table — always target `Rows slot` by exact name

A table contains **two** nodes that a loose `findOne` will happily confuse:

```
Table - *
  _Title
  Content              <- FRAME
    Row - Header
      Content slot     <- SLOT of Cell - Header   *** matched first by findAll order ***
    Rows slot          <- SLOT of data rows       *** the one you actually want ***
      Row - *
        Content slot   <- SLOT (or FRAME) of Cell - Default
```

`findOne(n => n.name === "Rows slot" || n.name === "Content slot")` returns the **header row's** slot, because it sits earlier in the tree. You then read `Cell - Header` where you expected `Cell - Default`, and every subsequent write lands on the header. Observed twice in one session, on `Table - Global` and `Table - Text values`.

> `rowsSlotOf(tbl)` and `headerCellsOf(tbl)` — in `scripts/figma-helpers.js`.

Same rule inside a row: scope the `Content slot` lookup to the row you already hold, never to the table.

> `swatchOf(cell)` and `getCells(row)` — in `scripts/figma-helpers.js`. `getCells` accepts **both** container names and **both** types, because the row container differs per component and changes between library edits.

---

## Cell writers

`Cell - Default` exposes `Label text` (TEXT), `Swatch` (BOOLEAN) and `Content` (VARIANT: `Text` / `Alias` / `Status`). Property keys carry `#nodeId` suffixes that differ per copy — **always detect them dynamically**.

> `setCellText`, `setCellContent`, `keyFor`, `setSwatchBool` — in `scripts/figma-helpers.js`. `keyFor` delegates the `#`-boundary rule to `DOCGEN.matchesPropKey`, which is tested.

### The Pill — required for every alias cell

In the `Content=Alias` variant the visible label is rendered by a **nested `Pill` instance**. Setting the cell's own `Label text` stores a value that nothing displays; the pill keeps reading `Label`. Writing `.characters` on the inner TEXT node no-ops too. Always set both — the cell property so the data is queryable, the pill so it renders.

> `setPill(cell, v)` and `setAliasCell(cell, label, isColor)` — in `scripts/figma-helpers.js`.

### Binding a swatch to a variable

Deep-clone the paint first — mutating the live fill object does not take.

> `bindSwatch(cell, variable, collectionObj, modeId)` — in `scripts/figma-helpers.js`.

`setExplicitVariableModeForCollection` takes the **collection object**, not its id string.

---

## Slot sizing

> `adjustRowCount(slot, n)` and `setColumnCount(row, n)` — in `scripts/figma-helpers.js`. Run `setColumnCount` in **both** directions: shrinking to 2 for a single-mode collection matters as much as growing to 4.

If `adjustRowCount` throws `Removing this node is not allowed` or `Cannot move node. New parent is an instance`, the container is a plain FRAME rather than a SLOT — see `failures.md`.

---

## Section header and title

`appendChild` **before** setting properties: `FILL` sizing requires an auto-layout parent.

> `applySectionHeader(frame, shSet, headingPart, subtitlePart)` and `setupTable(tbl, tableName, frameGroupName)` — in `scripts/figma-helpers.js`.

There is no `Title bar` boolean on the table — hide via `_Title.visible`. Writing `.characters` on the inner `Title` node fails silently; use the `Title text` property.

---

## Sorting

> The implementation is `scripts/docgen.js`; this section is the commentary. If the two ever disagree, the script is what runs and this is what was meant — fix whichever is wrong and say which.

All three cases are required. Case 2 is the one that gets dropped, and its absence zips solid and alpha ramps together into one plausible-looking table.

**Do not "tighten" `parseNum`.** Its leniency is load-bearing. `parseFloat` reads the leading number and discards the rest, which is exactly what makes annotated ramp steps — `7 - anchor`, `6 - source`, `9-anchor` — sort into their correct position instead of being flushed past the end of the ramp. Replacing it with a strict `/^\d+$/` test looks like a cleanup and silently reorders every annotated scale.

> Implemented in `scripts/docgen.js` as `DOCGEN.parseNum / DOCGEN.baseCmp / DOCGEN.smartSort`. Prepend that file and call it; do not retype it here. `node tests/test-docgen.js` is what proves the behaviour below still holds.

### `smartSort` is name-only, and name-only is wrong for t-shirt scales

`smartSort` derives order from the row *name*, which is the only option for colour ramps. For **FLOAT and STRING globals the value is orderable and is better data**, and falling through to case 3 produces output that looks deliberate and is nonsense:

| Table | `smartSort` (name) | Correct (value) |
|---|---|---|
| Border radius | full, lg, none, sm, xl, 2xl | none, sm, lg, xl, 2xl, full |
| Font / Size | base, lg, sm, xl, xs, 2xl…5xl | xs, sm, base, lg, xl, 2xl…5xl |
| Font / Weight | medium, normal, semibold | normal, medium, semibold |

`full` (999) leading and `none` (0) buried third is the tell. Use `orderRows`, which keeps all three `smartSort` cases and adds two:

> Implemented in `scripts/docgen.js` as `DOCGEN.orderRows(rows)`. Prepend that file and call it; do not retype it here. `node tests/test-docgen.js` is what proves the behaviour below still holds.

Order of the tests matters: numeric *names* beat numeric *values* (Spacing `0…18` must sort by name, not by its own resolved pixels, or `0_5` lands wrong), and `case2` must be checked before the value cases so alpha ramps do not interleave.

**Aliased values are not numbers**, so semantic tables fall through to the alphabetical case 3 automatically — which is right for token paths.

### For styles, prefer the library's own order over any sort

`getLocalEffectStylesAsync()` and `getLocalTextStylesAsync()` return styles in **the order they appear in the file's style panel**, which is nearly always the meaningful order the designer maintains — `Raised, Floating, Overlay, Modal`, or `Headline, Title, Body, Label`. Alphabetising that destroys real information and reads as a bug to whoever maintains the library.

`generateShadows()` and `generateTextStyles()` already derive the frame-group order and the table order from the styles array without sorting: each group and table takes its place on first sight (`DOCGEN.firstSeenOrder` is the same rule as a function, for anything assembled outside the recipes). A frame's index is its group's position in that first-seen order, plus one. Effect styles group through `DOCGEN.splitEffectName`; text styles use the depth rule in `recipes.md`.

Row order inside each table comes from the same array, unsorted. Variables have no comparable exposed order, so they keep `orderRows`.

---

## Formatting

> The whole formatting layer — `alphaLabel`, `toHex`, `canonOklch`, `oklchFrom`, `pickLine`, `oklchForMode`, `alphaSpecForMode`, `isAlphaSchema`, `colourLabel`, `unitText`, `unitTextFor`, `trimTo`, `cssLineHeight`, `cssLetterSpacing`, `cssLetterSpacingRem`, `metricRows`, `metricRowName`, `platformish`, `webGroupState`, `redundantPrefix`, `stripPrefix`, `lastSegment`, `shadowType`, `num`, `round2` — is in `scripts/docgen.js`. Call `DOCGEN.<name>`; do not retype any of it. The reasoning that is not obvious from the code is kept below, because that is the part a reader needs and the script cannot carry at length.

### Two description shapes, and why the reader handles both

OKLCH is **authored** in the variable's description and never computed from the fill: the stored fill is 8-bit-rounded sRGB, so a computed value disagrees with the authored one in the second or third decimal — and a value nearly-but-not-quite the source's reads as token drift, which is the bug this documentation exists to expose.

Two shapes occur in the wild, and a reader that handles only one silently falls back to hex on the other:

```
A)  Light:                        B)  ... · free mode
    oklch(...) · free mode            ... · free mode · dark

    Dark:
    oklch(...) · free mode
```

**A** is preferred for multi-mode variables — one description field, still readable, and the mode label stops being repeated inside a line a heading already labels. The headings must be the collection's **actual mode names**: a `Light:`/`Dark:` block over modes named `Day`/`Night` matches no heading and no tag, so the reader returns the first unrecognised line, which holds no `oklch(...)`, and the cell degrades to hex. That is the intended honest failure — collected in `oklchMisses` and reported, not silently wrong. The fix is the user's (rename the modes or the headings).

**B** is what older generator output looks like; keep supporting it. On B the **first** mode is left untagged and the rest are tagged, so "require a tag" breaks Light and "take the first match" breaks Dark. Prefer a line tagged with *this* mode; otherwise the first line carrying no recognised mode tag at all. Without `allModes` there is no way to tell an untagged line from one tagged for a different mode.

**Mode names are user data, so escape them in both readers.** `Dark (AA)` builds a capture group and never matches its own tag; `A+` over-matches. Either miss falls back to the first untagged line — i.e. Light's value in every column, which is defect 14 rebuilt inside the reader.

### Alpha tokens are a different schema, not a missing one

```
oklch(0.20 0.00 0 / 0.86%) · base #161616 · alpha 0.008584 · composites to Grey/1   (neutral)
rgb(0 85 255 / 1.18%) · base #0055FF · alpha 0.011765 · composites to Blue/1        (chromatic)
```

The CSS head carries the alpha as a **2dp percent**; the `alpha` field carries **full precision** — read values from the fields, never off the head. Rounding a float32 alpha to a whole percent moves 7 of the 11 non-endpoint steps of a 12-step ramp by 1/255 when composited, which is the seam the colour system exists to prevent. Must be per-mode for the same reason `oklchForMode` is: a two-mode alpha ramp carries a different base *and* a different alpha per mode, and reading the first line puts Light's alpha in the Dark column while the base still looks right.

**Neutral and chromatic alpha land in different buckets, and both placements are by design.** Neutral leads with `oklch(...)` — the two fixed neutral bases have a published nominal OKLCH — so it counts in `have` and renders as OKLCH. Chromatic leads with `rgb(...)`: its base is solved per step and its hue drifts up to 23.8° from the scale's own hue, so the generator deliberately quotes no OKLCH; it lands in `alphaSchemaVars` and renders the authored `rgb(...)` verbatim under an OKLCH run. Legacy output carries base+alpha only, also `alphaSchemaVars`. All three are correct — **do not "upgrade" a chromatic token to OKLCH by converting its base**, which asserts a hue the scale does not own.

### `setupTableBadged` — the one node-touching function in this group

`setupTable` forces `Label=false`; this is its opt-in counterpart for Step 2.2's non-variable metric tables. Returns `false` when the doc library's `_Title` lacks either property — report that rather than inventing a text node for the badge.

> `setupTableBadged(tbl, tableName, badgeText)` — in `scripts/figma-helpers.js`. Returns `false` when the doc library's `_Title` lacks either property; report that rather than inventing a text node for the badge.

### OKLCH coverage — run at discovery, before generating

> Implemented in `scripts/docgen.js` as `DOCGEN.oklchCoverage(colls)`. Prepend that file and call it; do not retype it here. `node tests/test-docgen.js` is what proves the behaviour below still holds.

Returns `{total, have, alphaOnly, missing}` over the discovered collections, not the live file.

**Report those two buckets separately, and never call `alphaOnly` missing.** Those descriptions are filled in and carefully maintained — the user can open the variable and see that. Telling them the field is empty is simply wrong, and it costs you their trust in the rest of the report. Say the schema differs: base plus alpha rather than an `oklch(...)`, which is what an alpha token is. `alphaSpec` still yields an exact base and an exact alpha, so those rows render from authored data either way — they are not a degraded fallback.

**Neutral and chromatic alpha land in different buckets, and both placements are by design.** Neutral alpha leads with `oklch(0.20 0.00 0 / 0.86%) · base …` — the two fixed neutral bases have a published nominal OKLCH — so it lands in `have` and renders as OKLCH like everything else. Chromatic alpha leads with `rgb(0 85 255 / 1.18%) · base …`: its base is solved per step and its hue drifts, so the generator deliberately quotes no OKLCH — it lands in `alphaOnly` and `colourLabel` renders the authored `rgb(...)` verbatim under an OKLCH run. Legacy output carries base+alpha only, also `alphaOnly`, rendering base hex plus the authored alpha. All three are correct; do not "upgrade" a chromatic token to OKLCH by converting its base — that asserts a hue the scale does not own.

Aliased colour variables count here too even though they render as alias cells — a primitive missing its description will surface on the primitive page regardless.

---

## Live objects — fetch in bulk, once, then work synchronously

Do **not** loop `getVariableByIdAsync` per variable. `getLocalVariablesAsync()` returns every local variable as a real `Variable` object in a single await, and `getLocalVariableCollectionsAsync()` does the same for collections. Two awaits replace several hundred, and everything downstream — alias names, resolved types, paint binding — becomes a sync map lookup.

```js
var allVars = await figma.variables.getLocalVariablesAsync();
var varById = {};
for (var a = 0; a < allVars.length; a++) varById[allVars[a].id] = allVars[a];

var colls = await figma.variables.getLocalVariableCollectionsAsync();
var collById = {};
for (var c = 0; c < colls.length; c++) collById[colls[c].id] = colls[c];
```

The objects returned are live, so `varById[id]` is directly usable in `setBoundVariableForPaint` — no second fetch. This removed every `await` from the per-cell loop and is what let a 39-row × 3-mode table with 78 swatch bindings finish inside one call.

This supersedes both the per-id cache and the `primMap` plugin-data round-trip when generating **inside the source file**. For published external libraries you still need `importVariableByKeyAsync`.

### Working against an external library: resolve the index once, persist it

`getLocalVariablesAsync` has no cross-file equivalent, so in a **target** file every remote variable costs an await. Resolving a whole collection *and* building a frame in one call is what pushes a large page over the budget — a 99-variable resolve plus 60 rows of alias cells timed out where either half alone was comfortable.

Split it: one call imports and indexes, later calls use the index. `sourceIndex(collName, libraryName)` (`scripts/figma-helpers.js`) is that split. It returns `partial` while the import is unfinished, caches key → id per (library, collection) on the **target**'s root so each pass resumes forward, expires that cache after an hour, and hands back the collection, its modes and a by-id index, which is everything `setExplicitVariableModeForCollection` needs. Call it until it is not partial, then pass the result to `generate()` as `opts.index`. Plugin data is per file (defect 5), so the cache lives where the generating calls run.

---

## Column mapping — read the header labels, never assume position

Table column order is part of the doc library, and the user will change it. In one session `Table - Text values` went from
`Name · Family · Size · Weight · Line-height` to
`Name · Family · Size · Weight · Letter spacing · Line-height` — the new column was inserted **before** the last one, not appended.

Index-based writing would have put letter-spacing values into the Line-height column and vice versa. Nothing throws; both columns hold plausible percentages; the page looks fine and is wrong.

Resolve each column by its rendered header label:

> `columnMap(tbl)` (`scripts/figma-helpers.js`) reads the rendered header labels with `headerLabels(tbl)` and maps them through `DOCGEN.fieldsForLabels`, returning `{fieldFor, unknown}`. Write cells by `fieldFor[i]`, never by a hardcoded index, and report `unknown` to the user rather than guessing what a new column means.

Apply the same idea wherever a shipped label is the contract: mode columns come from `collection.modes[i].name`, and the first column's label should match whatever the file's existing pages already use — `Table - Colour` ships `Label` as its first header cell while the generated variable and text pages use `Name` and the Shadows page uses `Type`.

---

## Width measurement

Figma exposes no truncation flag. Measure with a throwaway node, then remove it.

> `wrapsOrClips(textNode, intrinsic)` — in `scripts/figma-helpers.js`. Two detectors, because cell text nodes are configured differently; see the table above.

> `clipsCell(textNode, cell)` — the third, for an **alias pill**. A pill hugs its label, so its text node is exactly its intrinsic width and never wraps: `wrapsOrClips` reports it as fitting while the cell clips it. `clipsCell` compares the text's box with its cell's (`DOCGEN.boxOverflow`) and returns the overflow in px. Run both on every value cell. Found 2026-10-16 when a page passed the two detectors at 720 and showed 29 tables of clipped pills; at the top rung some still ran 39px over, which only shortening the label fixes.

Apply per table: if any cell in it misbehaves, step the table up the width ladder. Otherwise leave the component default untouched.

### Never re-measure in the same call that resized

**This is the most misleading thing in the whole skill.** `resize()` does not synchronously reflow the auto-layout beneath it, so `absoluteBoundingBox` on descendants still reports pre-resize geometry. Measuring straight after a resize reports the table as *still* clipping when it now fits perfectly.

In one session this produced a confident report that two tables "still clip at 860" and could not be fixed. Re-measured in a fresh `figma_execute`, both fit at 860 and needed nothing. Had the ladder been longer at the time, it would have escalated them to 1024 for no reason.

```
call N:      measure -> resize to next rung -> STOP
call N+1:    measure again -> resize again if still bad -> STOP
```

Either drive the ladder one rung per call, or resize everything first and verify widths in a **separate** call. Never assert "still clipping" from a measurement taken after a resize in the same call.

**On a multi-table page, default to the batched form — three calls for the whole page instead of up to three per table.** Call one measures every table and records each offender's worst shortfall (`intrinsic − available`); pick each table's target as the first rung ≥ its current width plus that shortfall. Call two applies every resize. Call three re-measures everything: the shortfall estimate is a floor, not a guarantee — extra width distributes across columns — so any table still misbehaving walks the remaining rungs one per call from there. The estimate cuts the calls; the verify pass keeps the correctness, and F7 stays impossible because no call ever measures its own resize.

### Frame normalisation — run after the ladder, in its own call

The ladder answers "does this table fit" per table. The frame is the visual unit, so the answers have to be reconciled or one widened table leaves its neighbours ragged (defect 20). Up only, per frame only, after the ladder only.

> `normaliseFrameWidths(frame)` — in `scripts/figma-helpers.js`. It delegates the widen-up-to-the-widest rule to `DOCGEN.normaliseWidths`, so there is one implementation of it.

Verification asserts **one distinct width per frame** — never per page, since separate frames legitimately differ.

### The ladder

Default rungs: the component default, then **860**, then **996**, then **1024**. The default is per component — measured in the reference library: 720 for `Table - Colour`, `Table - Global` and `Table - Text sample`, 860 for `Table - Effects`, 996 for `Table - Text values` (which is why text-values tables usually need no resizing at all). Across all six generated pages of that file every table measures 720, 860 or 996; **1024 has never been observed in use** and is the last resort, not a working rung. Stop at the first that fits; do not skip rungs, and do not invent a width outside the ladder. Confirm the rungs against the doc library's own table sizes rather than assuming — that is where these came from, and a different library will have different ones; mention it to the user only if the two disagree. If the top rung still does not fit, leave it there and report.

Two configurations, two detectors — see the width rule in SKILL.md. `TEXT` nodes have no `findAll`, so guard any descendant walk:

> `descendants(node)` — in `scripts/figma-helpers.js`.

---

## Doc component discovery by key

Step 1 routes 2 and 3. Runs entirely inside the **target** file — the doc library never needs the bridge for this. Written in ES5, like the rest of the shipped scripts; the sandbox does not require it (see the note at the top).

> `discoverDocKeys(CONTRACT)` — in `scripts/figma-helpers.js`. Returns `{name: {key, setKey}}`; persist it to the **target**'s plugin data, since plugin data is per file (defect 5).

Not every contract name needs to be found this way — a single generated colour page carries most of the contract as nested instances, and anything genuinely absent from route 3 can still come from route 4. Treat `found` as a partial answer to merge, not a pass/fail gate.

Importing, and the **variant-set caveat**:

- Where `setKey` is present, prefer `figma.importComponentSetByKeyAsync(setKey)` — the skeleton can then pick variants by name exactly as it does with a local set.
- Where only a variant `key` exists, `importComponentByKeyAsync(key)` returns that one variant. Instances of it can usually still switch variants via `setProperties({"Alias": "True"})` when the set is published — **but probe it, never assume it**: on the scratch page, instantiate, call `setProperties` for the variant you need, and check the instance's name changed. If it throws or the name is unchanged, the set is not reachable from this side; fall back to Step 1 route 4.
- **When imports hang, take the sets from instances already in the file.** Right after Figma is reopened, `importComponentSetByKeyAsync` (and so `warmImports`) can hang for minutes (2026-10-16). The doc pages already hold instances of every doc component: `await inst.getMainComponentAsync()` gives the variant and its `.parent` the set, matched to the contract by `key`; pass those sets to `generate()` as `shSet` and `tblSet`.

```js
figma.root.setPluginData("docComponentKeys", JSON.stringify(found));
// Plugin data is per-file (defect 5): this lives on the TARGET's root, is only readable
// there, and is what lets the next run skip every question and go straight to route 2.
```

One honest API limitation, so nobody goes looking for a cleaner call: the plugin API has no way to enumerate the *components* of an enabled library. `figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()` lists enabled libraries' **variable collections** only — use its `libraryName` values to phrase the route-4 question, never to skip it.

---

## Structural probe

Run this against each component type **before** generating with it. One call here has repeatedly saved three repair passes.

Two things will break a naive probe, and both did:

- **`findAll` does not exist on every node.** `TEXT` has no `findAll`. If the first cell happens to be a TEXT node, `cell.findAll(...)` throws `TypeError: not a function` and kills the whole call — with the temp page and any partial instances left behind. Always go through `safeAll`.
- **Probe on a dedicated scratch page**, then delete it. `createInstance()` lands on `figma.currentPage`, and probing while a real doc page is current leaks instances onto it.
- **Do not import more than ~3 components per call.** Five imports plus five instantiations exceeded the 30s timeout. Split them.

`probeComponent(comp)` (`scripts/figma-helpers.js`) does all of this. Pass a `COMPONENT` or a `COMPONENT_SET` (the probe uses its default variant). It reuses or creates `__probe_tmp`, makes that the current page, instantiates the component and dumps the tree four levels deep. It also reports the property keys, the variants of a set, the `Rows slot` found by exact name, an append and a remove tried on it, the first row's container (name and type), the first cell's properties and nodes, the header labels and the `_Title` properties. It removes the instance in a `finally` block and returns the object; `JSON.stringify` it to read it. The variant switch needs its own probe: set `Content=Alias` on a cell, then probe again for the nested `Pill`.

Read the output for five things specifically: **what type is `Swatch`**, **is there a nested `Pill`** (only visible once a cell is set to `Content=Alias` — probe that separately), **is the row container a SLOT or a FRAME**, **did `append`/`remove` succeed**, and **what are the header labels**. Those answers determine whether the generation code you are about to write will work or fail silently.

Delete `__probe_tmp` in the final housekeeping pass, not after each probe — you will want it again.
