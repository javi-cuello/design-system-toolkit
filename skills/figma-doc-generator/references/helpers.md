# Shared helpers

**This file is the reasoning; the code is in `scripts/`**. It explains why each helper works as it does, and carries the few snippets that are call-site templates rather than functions.

## Contents

- [The scripts, and loading them](#the-scripts-and-loading-them)
- [The sandbox](#the-sandbox)
- [Font preload](#font-preload)
- [Node matching](#node-matching)
- [Cell writers](#cell-writers)
- [Slot sizing](#slot-sizing)
- [Section header and title](#section-header-and-title)
- [Sorting](#sorting)
- [Formatting](#formatting)
- [OKLCH coverage](#oklch-coverage)
- [Live objects](#live-objects)
- [Column mapping](#column-mapping)
- [Width measurement](#width-measurement)
- [Doc component discovery by key](#doc-component-discovery-by-key)
- [Structural probe](#structural-probe)

## The scripts, and loading them

| File | Holds | Tested by |
|---|---|---|
| `scripts/docgen.js` | everything pure: sorting, namespace strip, depth rule, colour and OKLCH formatting, type units, column mapping, prefix stripping, width rungs | `node tests/test-docgen.js` |
| `scripts/figma-helpers.js` | everything that needs a node: cell writers, slot sizing, section headers, swatch binding, width measurement | `node --check` only; the rest needs a live file |
| `scripts/recipes.js` | whole-page procedures built from both, such as `generate()` | `node --check` only |

**The split rule: if it needs `figma` or a node, it is in `figma-helpers.js`; if not, it is in `docgen.js` with a test**. Pure logic once hidden in a node function has been lifted out and is called back, as with `matchesPropKey` and `normaliseWidths`. So each rule has exactly one implementation.

**Load once per file, not once per call**. Each script is a named factory that caches its own source in the document's plugin data. Later calls, in this session or any future one, start with three lines instead of 51KB:

```js
['dg.docgen.v1','dg.helpers.v1','dg.recipes.v1'].forEach(function (k) {
  var s = figma.root.getPluginData(k); if (s) (0, eval)('(' + s + ')')();
});
```

**Paste `docgen.js` first**, because the other two call into `DOCGEN` at run time.

**Check a first paste by its hash**. Each load returns a hash, and `node scripts/hash.js` prints what all three should be. Equal means the bytes in the file are the bytes on disk. Nothing else can check this, and caching a corrupt source would make it permanent. So the hash gates the cache write (`globalThis.__DG_EXPECT`), rather than being reported after it.

**The hash covers code, not comments**. A gate that fails on a reworded comment trains you to ignore it. Any code change to a script changes its hash, so a file's cached copies need one paste again; a comment-only change does not. The protocol is covered by `node tests/test-load-protocol.js`.

## The sandbox

Three facts about the plugin sandbox, each tested:

- `eval` exists.
- Globals persist across `figma_execute` calls within one file, not across files.
- `Function.prototype.toString()` returns real source.

The old belief that a script must be sent again every call was false, and it was the largest cost of running this skill. One limit *is* real: indirect eval does **not** leak declarations into globals here. So each factory installs its public names explicitly.

**The sandbox accepts modern JavaScript**. One call ran arrow functions, block-scoped declarations, template literals, spread and destructuring with defaults, and it parsed. Nullish and optional chaining, classes, shorthand properties, exponentiation and `globalThis` passed too. That was Figma Desktop with Desktop Bridge plugin 1.39.0.

- **Existing ES5 code is not a defect and is not being rewritten**: it works, it is tested, and churning it buys nothing.
- New code may use modern syntax. Keep each file internally consistent rather than mixing styles.
- If a Figma update ever makes this suspect, test again with the same one-call probe.

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
await loadDocFonts();   // accepts both persisted shapes; a raw loadFontAsync loop does not
```

Before any `setTextStyleIdAsync`, also load the **source file's** text-style fonts, a different set:

```js
var seen = {};
for (var i = 0; i < textStyles.length; i++) {
  var k = textStyles[i].family + "||" + textStyles[i].style;
  if (seen[k]) continue; seen[k] = true;
  try { await figma.loadFontAsync({family: textStyles[i].family, style: textStyles[i].style}); }
  catch (e) { /* record and report; do not abort the batch */ }
}
```

## Node matching

**Match by name, never by type**. The swatch has been seen as both `RECTANGLE` and `FRAME` across copies of one library. A type-based `findOne` returns `null` and fails silently (defect 1).

**`Content slot` is not unique inside a table, so always target `Rows slot` by exact name**. A table holds two nodes a loose `findOne` will confuse:

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

A `findOne` for either name returns the **header row's** slot, because it sits earlier in the tree. You then read `Cell - Header` where you expected `Cell - Default`, and every later write lands on the header (defect 9). The helpers `rowsSlotOf(tbl)` and `headerCellsOf(tbl)` avoid it.

The same rule holds inside a row: scope the `Content slot` lookup to the row you hold, never the table. The helpers are `swatchOf(cell)` and `getCells(row)`. The second accepts **both** container names and **both** types, because the row container differs per component and changes between library edits.

## Cell writers

`Cell - Default` exposes three properties: `Label text` (TEXT), `Swatch` (BOOLEAN) and `Content` (VARIANT: Text, Alias, Status). Property keys carry `#nodeId` suffixes that differ per copy, so **always find them at run time**.

The writers are `setCellText`, `setCellContent`, `keyFor` and `setSwatchBool`. The key finder leaves the #-boundary rule to `DOCGEN.matchesPropKey`, which is tested (defect 17).

**The pill is required for every alias cell**. In the `Content=Alias` variant, a **nested `Pill` instance** renders the visible label. Setting the cell's own `Label text` stores a value nothing displays, and the pill keeps reading Label. Writing `.characters` on the inner TEXT node does nothing either.

Always set both: the cell property so the data can be queried, the pill so it renders. Use `setPill(cell, v)` or `setAliasCell(cell, label, isColor)`.

**Binding a swatch to a variable**. Deep-clone the paint first: changing the live fill object does not take. Use `bindSwatch(cell, variable, collectionObj, modeId)`. Note that `setExplicitVariableModeForCollection` takes the **collection object**, not its id string.

## Slot sizing

Use `adjustRowCount(slot, n)` and `setColumnCount(row, n)`. Run `setColumnCount` in **both** directions: shrinking to 2 for a single-mode collection matters as much as growing to 4.

If `adjustRowCount` throws `Removing this node is not allowed` or `Cannot move node. New parent is an instance`, the container is a plain FRAME, not a SLOT ([failures.md](failures.md) § *Loud failures*).

## Section header and title

Call `appendChild` **before** setting properties, because `FILL` sizing needs an auto-layout parent. The helpers are `applySectionHeader(frame, shSet, headingPart, subtitlePart)` and `setupTable(tbl, tableName, frameGroupName)`.

The table has no `Title bar` boolean: hide the title through `_Title.visible`. Writing `.characters` on the inner `Title` node fails silently; use the `Title text` property.

**`setupTableBadged(tbl, tableName, badgeText)`** is the opt-in counterpart of `setupTable`, which forces `Label=false`. It serves Step 2.2's metric tables. It returns `false` when the doc library's `_Title` lacks either badge property. Report that rather than inventing a text node for the badge.

## Sorting

The code is in `scripts/docgen.js`: `DOCGEN.parseNum`, `baseCmp`, `smartSort` and `orderRows`. Prepend it and call it; never retype it. The docgen suite proves the behaviour below still holds. If this text and the script ever disagree, the script is what runs. Fix whichever is wrong, and say which.

**All three `smartSort` cases are required** ([structure.md](structure.md) § *Row order*). Case 2 is the one that gets dropped. Its absence zips solid and alpha ramps into one plausible table (defect 3).

**Do not "tighten" `parseNum`: its leniency is load-bearing**. A `parseFloat` reads the leading number and drops the rest. That is what sorts annotated ramp steps (7 - anchor, 6 - source, 9-anchor) into place rather than past the end. A strict `/^\d+$/` test looks like a cleanup and silently reorders every annotated scale.

**Name-only order is wrong for t-shirt scales**. Order from the name is the only option for colour ramps. For FLOAT and STRING globals the value can be ordered and is better data. Falling through to case 3 gives output that looks deliberate and is nonsense:

| Table | `smartSort` (name) | Correct (value) |
|---|---|---|
| Border radius | full, lg, none, sm, xl, 2xl | none, sm, lg, xl, 2xl, full |
| Font / Size | base, lg, sm, xl, xs, 2xl…5xl | xs, sm, base, lg, xl, 2xl…5xl |
| Font / Weight | medium, normal, semibold | normal, medium, semibold |

The tell is `full` (999) leading and `none` (0) buried third. The function `orderRows` keeps all three cases and adds two: sort by value and sort by font-weight rank.

- **The order of the tests matters**. Numeric *names* beat numeric *values*: Spacing `0…18` sorts by name, not by its resolved pixels, or `0_5` lands wrong.
- Case 2 is checked before the value cases, so alpha ramps do not interleave.
- **Aliased values are not numbers**, so semantic tables fall through to the alphabetical case 3. That is right for token paths.

**Styles keep the library's own order over any sort**. The two style getters return styles in the file's style-panel order. That is nearly always the order the designer maintains. Sorting it alphabetically destroys real information and reads as a bug to whoever keeps the library (defect 11).

The style recipes already derive the frame-group order and the table order from the styles array, unsorted. Each group and table takes its place on first sight. `DOCGEN.firstSeenOrder` is the same rule as a function, for anything built outside the recipes. A frame's index is its group's position in that order, plus one.

Effect styles group through `DOCGEN.splitEffectName`; text styles use the depth rule ([recipes.md](recipes.md) § *Text styles page*). Row order inside each table comes from the same array, unsorted. Variables have no comparable order exposed, so they keep `orderRows`.

## Formatting

The whole formatting layer is in `scripts/docgen.js`; call `DOCGEN.<name>` and never retype it. Kept here is only the reasoning the code cannot carry at length.

| Group | Functions |
|---|---|
| Colour | `alphaLabel` `toHex` `canonOklch` `oklchFrom` `pickLine` |
| Colour, per mode | `oklchForMode` `alphaSpecForMode` `isAlphaSchema` `colourLabel` |
| Type units | `unitText` `unitTextFor` `trimTo` `cssLineHeight` |
| Type units, more | `cssLetterSpacing` `cssLetterSpacingRem` `metricRows` `metricRowName` |
| Groups and labels | `platformish` `webGroupState` `redundantPrefix` `stripPrefix` |
| Other | `lastSegment` `shadowType` `num` `round2` |

**OKLCH is authored in the description, never computed from the fill** ([colour-and-units.md](colour-and-units.md) § *OKLCH and alpha come from the description*). Two description shapes occur, and a reader that handles only one silently falls back to hex on the other:

```
A)  Light:                        B)  ... · free mode
    oklch(...) · free mode            ... · free mode · dark

    Dark:
    oklch(...) · free mode
```

**Shape A is preferred for multi-mode variables**. It keeps one readable description field, and the mode label is not repeated inside a line its heading labels. The headings must be the collection's **actual mode names**. A `Light:` and `Dark:` block over modes named Day and Night matches no heading and no tag. The reader then returns the first unrecognised line, which holds no `oklch(...)`, and the cell degrades to hex.

That is the intended honest failure: it is collected in `oklchMisses` and reported, not silently wrong. The fix is the user's: rename the modes or the headings.

**Shape B is older generator output; keep supporting it**. On B the **first** mode is untagged and the rest are tagged. So "require a tag" breaks Light, and "take the first match" breaks Dark.

Prefer a line tagged with *this* mode; otherwise take the first line with no recognised mode tag. Without `allModes` an untagged line cannot be told from one tagged for another mode. Both readers go through `pickLine`.

**Mode names are user data, so escape them in both readers**. A mode named `Dark (AA)` builds a capture group and never matches its own tag, and `A+` over-matches. Either miss falls back to the first untagged line: Light's value in every column, defect 14 rebuilt inside the reader.

**Alpha tokens are a different schema, not a missing one**.

```
oklch(0.20 0.00 0 / 0.86%) · base #161616 · alpha 0.008584 · composites to Grey/1   (neutral)
rgb(0 85 255 / 1.18%) · base #0055FF · alpha 0.011765 · composites to Blue/1        (chromatic)
```

Read values from the fields, never off the CSS head: the head rounds the alpha to a 2dp percent. Read them per mode, for the same reason as `oklchForMode`. A two-mode alpha ramp carries a different base *and* a different alpha per mode. Reading the first line puts Light's alpha in the Dark column while the base still looks right.

**Each kind lands in its bucket by design:**

| Kind | Leads with | Coverage bucket | Renders under OKLCH |
|---|---|---|---|
| Neutral alpha | `oklch(...)`: the two fixed neutral bases have a published nominal OKLCH | `have` | OKLCH |
| Chromatic alpha | `rgb(...)`: the base is solved per step, and its hue drifts up to 23.8° | `alphaOnly`; run collector `alphaSchemaVars` | the authored `rgb(...)`, verbatim |
| Older output | base and alpha only | `alphaOnly`; run collector `alphaSchemaVars` | base hex plus the authored alpha |

All three are correct. **Never "upgrade" a chromatic token to OKLCH by converting its base**. That asserts a hue the scale does not own.

## OKLCH coverage

The function `DOCGEN.oklchCoverage(colls)` runs at discovery, before generating. It returns `{total, have, alphaOnly, missing}` over the discovered collections, not the live file. The docgen suite proves its behaviour.

**Report the two buckets apart, and never call `alphaOnly` missing**. Those descriptions are filled in and carefully kept; the user can open the variable and see that. Calling them empty is wrong, and it costs their trust in the rest of the report. Say the schema differs: a base plus an alpha, which is what an alpha token is. Those rows render from authored data either way; they are not a degraded fallback.

Aliased colour variables count here too, although they render as alias cells. A primitive missing its description surfaces on the primitive page anyway.

## Live objects

**Fetch in bulk, once, then work synchronously**. Never loop `getVariableByIdAsync` per variable. The call `getLocalVariablesAsync()` returns every local variable as a real object in one await, and the collections call does the same. Two awaits replace several hundred, and every later lookup is a sync map read.

```js
var allVars = await figma.variables.getLocalVariablesAsync();
var varById = {};
for (var a = 0; a < allVars.length; a++) varById[allVars[a].id] = allVars[a];

var colls = await figma.variables.getLocalVariableCollectionsAsync();
var collById = {};
for (var c = 0; c < colls.length; c++) collById[colls[c].id] = colls[c];
```

The objects are live, so `varById[id]` works directly in `setBoundVariableForPaint`, with no second fetch. This removed every `await` from the per-cell loop. It is what let a 39-row, 3-mode table with 78 swatch bindings finish in one call.

It replaces both the per-id cache and the `primMap` plugin-data round trip when generating **inside the source file**. Published external libraries still need `importVariableByKeyAsync`.

**Against an external library, resolve the index once and persist it**. There is no cross-file equivalent of `getLocalVariablesAsync`, so in a target file every remote variable costs an await. Resolving a whole collection *and* building a frame in one call pushes a large page over budget. A 99-variable resolve plus 60 rows of alias cells timed out, where either half alone was comfortable.

Split it: one call imports and indexes, and later calls use the index. `sourceIndex(collName, libraryName)` is that split:

- It returns `partial` while the import is unfinished, so call it until it is not.
- It caches key-to-id per (library, collection) on the **target's** root, so each pass resumes forward. The cache expires after an hour.
- It hands back the collection, its modes and a by-id index: all that `setExplicitVariableModeForCollection` needs.
- Pass the result to `generate()` as `opts.index`. Plugin data is per file (defect 5), so the cache lives where the generating calls run.

## Column mapping

**Read the header labels; never assume position**. Column order is part of the doc library, and the user will change it. Once `Table - Text values` went from five columns (Name, Family, Size, Weight, Line-height) to six. The new Letter spacing column was inserted **before** the last one, not appended.

Writing by index would have put letter-spacing values under Line-height. Nothing throws, both columns hold plausible percentages, and the page looks fine and is wrong (defect 10).

**Resolve each column by its rendered header label**. `columnMap(tbl)` reads the labels with `headerLabels(tbl)` and maps them through `DOCGEN.fieldsForLabels`. It returns fieldFor and unknown. Write cells by `fieldFor[i]`, never by a hardcoded index. Report `unknown` to the user rather than guessing what a new column means.

**Wherever a shipped label is the contract, do the same**. Mode columns come from `collection.modes[i].name`. The first column's label matches what the file's existing pages use ([structure.md](structure.md) § *Columns*).

## Width measurement

Figma has no truncation flag. Measure with a throwaway node, then remove it. The ladder and the rules are in [generation.md](generation.md) § *Table width*.

- **`wrapsOrClips(textNode, intrinsic)`** has two detectors, because cell text nodes are set up two ways.
- **`clipsCell(textNode, cell)`** is the third, for an **alias pill**. A pill hugs its label, so its text node is exactly its intrinsic width and never wraps. The first function then reports it as fitting while the cell clips it. This one compares the text's box with its cell's (`DOCGEN.boxOverflow`) and returns the overflow in px.
- **`descendants(node)`** guards any walk below a cell, because `TEXT` nodes have no `findAll`.

Apply per table: if any cell misbehaves, step the table up the ladder. Otherwise leave the component default alone. `Table - Text values` ships at 996, so it usually needs no resize at all.

**Never measure again in the call that resized**. This is the most misleading thing in the skill. `resize()` does not reflow the auto-layout beneath it at once. So the descendants' bounding boxes report the old geometry. A table that now fits reports as *still* clipping. Two tables once reported "still clip at 860"; measured again in a fresh call, both fit and needed nothing (F7).

```
call N:      measure -> resize to next rung -> STOP
call N+1:    measure again -> resize again if still bad -> STOP
```

Either drive the ladder one rung per call, or resize everything first and verify in a **separate** call. Never assert "still clipping" from a measurement taken after a resize in the same call.

**The batched form, for a page with many tables:**

1. Measure every table, and record each offender's worst shortfall (intrinsic minus available). Its target is the first rung at least its current width plus that shortfall.
2. Apply every resize.
3. Measure everything again. The shortfall estimate is a floor, not a guarantee, because extra width spreads across columns. Any table still misbehaving walks the remaining rungs, one per call.

The estimate cuts the calls, and the verify pass keeps the result correct. No call ever measures its own resize.

**Frame normalisation runs after the ladder, in its own call**. `normaliseFrameWidths(frame)` leaves the widen-to-the-widest rule to `DOCGEN.normaliseWidths`, so the rule has one implementation. Verification asserts **one distinct width per frame**, never per page, since separate frames may differ (defect 20).

## Doc component discovery by key

Step 1's routes 2 and 3 run entirely inside the **target** file; the doc library never needs the bridge for them. `discoverDocKeys(CONTRACT)` returns `{name: {key, setKey}}`. Persist it to the target's plugin data:

```js
figma.root.setPluginData("docComponentKeys", JSON.stringify(found));
// Plugin data is per-file (defect 5): this lives on the TARGET's root, is only readable
// there, and is what lets the next run skip every question and go straight to route 2.
```

Not every contract name needs finding this way. A single generated colour page carries most of the contract as nested instances. Anything absent from route 3 can still come from route 4. Treat `found` as a partial answer to merge, not a pass or fail gate.

**Importing, and the variant-set caveat:**

- Where `setKey` is present, prefer `figma.importComponentSetByKeyAsync(setKey)`. The skeleton can then pick variants by name, as with a local set.
- Where only a variant `key` exists, `importComponentByKeyAsync(key)` returns that one variant. Its instances can usually still switch variants through `setProperties({"Alias": "True"})` when the set is published.
- **Probe that; never assume it**. On the scratch page, instantiate, call `setProperties` for the variant you need, and check that the instance's name changed. If it throws or the name is unchanged, the set is out of reach from this side; fall back to route 4.
- **When imports hang, take the sets from instances already in the file**. Right after Figma reopens, a set import (and so `warmImports`) can hang for minutes. The doc pages already hold instances of every doc component.
- Then `await inst.getMainComponentAsync()` gives the variant, and its parent the set, matched to the contract by key. Pass those sets to `generate()` as `shSet` and `tblSet`.

**One honest API limit, so nobody hunts for a cleaner call**. The plugin API cannot list the *components* of an enabled library. The call `figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()` lists enabled libraries' **variable collections** only. Use its `libraryName` values to phrase the route-4 question, never to skip it.

## Structural probe

Run it on each component type **before** generating with it. One call here has repeatedly saved three repair passes. Two things broke a naive probe, and a third limits it:

- **`findAll` does not exist on every node**. A TEXT node has none. If the first cell is one, `cell.findAll(...)` throws `TypeError: not a function` and kills the call. The temporary page and any partial instances are left behind. Always go through `safeAll`.
- **Probe on a dedicated scratch page**, then delete it. A new instance lands on `figma.currentPage`, so probing while a real doc page is current leaks instances onto it.
- **Import no more than about 3 components per call**. Five imports plus five instantiations went past the 30 s timeout.

**`probeComponent(comp)` does all of this**. Pass a `COMPONENT`, or a `COMPONENT_SET` (it uses the default variant). It reuses or creates `__probe_tmp`, makes it current, instantiates the component, and dumps the tree four levels deep. It removes the instance in a `finally` block and returns the object; stringify it to read it. It also reports:

- the property keys, and the variants of a set
- the `Rows slot` found by exact name, with an append and a remove tried on it
- the first row's container (name and type)
- the first cell's properties and nodes
- the header labels and the `_Title` properties

**The variant switch needs its own probe**. Set `Content=Alias` on a cell, then probe again for the nested `Pill`.

**Read the output for five answers**, which decide whether the code you are about to write works or fails silently:

1. What type is `Swatch`?
2. Is there a nested `Pill`? It shows only once a cell is set to `Content=Alias`.
3. Is the row container a SLOT or a FRAME?
4. Did append and remove succeed?
5. What are the header labels?

Delete `__probe_tmp` in the final housekeeping pass, not after each probe; you will want it again.
