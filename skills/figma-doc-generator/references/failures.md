# Silent failures and verification

Every entry here was seen in production, and all but one produced output that looked correct. Numbered entries are defects; F entries are false positives, detectors that cry wolf.

## Contents

- [The catalogue](#the-catalogue): twenty-two silent defects, with detection queries
- [False positives](#false-positives): F1 to F12, hits that are correct output
- [Verification queries](#verification-queries): what `verifyPage` runs after generating
- [Loud failures](#loud-failures): errors that throw

## The catalogue

### 1. Swatch bound to the component placeholder

**Symptom:** every swatch renders the same neutral grey, evenly, across a whole table. It reads as a design choice.

**Cause:** the skill looked for a `RECTANGLE`, but in this library copy the swatch is a **FRAME** named `Swatch`. The `findOne` returned `null`, and the fill was never written. Each cell kept the main component's own binding (`Background/Neutral/soft`, say).

**Detection:** resolve what each swatch is bound to, and confirm the names differ per row.

```js
var sw = cell.findOne(function(n){ return n.name === "Swatch"; });
var bv = sw && sw.fills && sw.fills[0] && sw.fills[0].boundVariables
       ? sw.fills[0].boundVariables.color : null;
var name = bv ? (await figma.variables.getVariableByIdAsync(bv.id)).name : "UNBOUND";
```

If every row reports the same name, they are all on the placeholder.

**Fix:** match by name, never by type, with `swatchOf()` ([helpers.md](helpers.md) § *Node matching*).

### 2. Alias label written to a property nothing renders

**Symptom:** alias cells show the literal word `Label`. The count equals variables times modes exactly: a suspiciously round number.

**Cause:** in the `Content=Alias` variant the visible text belongs to a **nested `Pill` instance**. Setting the cell's own `Label text` stores a value that can be queried but is never drawn.

**Detection:** compare the cell property with the pill property.

```js
var cp = cell.componentProperties, cellLabel = null;
for (var k in cp) if (cp[k].type === "TEXT") cellLabel = cp[k].value;
var pill = cell.findOne(function(n){ return n.type === "INSTANCE" && n.name === "Pill"; });
var pillLabel = null;
if (pill) { var pp = pill.componentProperties; for (var k in pp) if (pp[k].type === "TEXT") pillLabel = pp[k].value; }
// cellLabel !== pillLabel  ->  defective
```

**Fix:** `setAliasCell()` writes both.

### 3. Mixed ramps interleaved by a missing sort case

**Symptom:** a grey scale reads `1`, `Alphas/1`, `2`, `Alphas/2`, `3`… It looks like an intended pairing.

**Cause:** `smartSort` case 2 was left out. Falling through to the last-segment comparison ties `Alphas/1` with the solid `1`.

**Detection:** compute the expected order again and compare it with the rendered order.

```js
var current = /* row-name of each row, in order */;
var want = DOCGEN.smartSort(current.map(function(x){ return {rn: x}; })).map(function(x){ return x.rn; });
// any index where current[i] !== want[i] -> defective table
```

**Fix:** all three cases ([helpers.md](helpers.md) § *Sorting*). Sweep every table, not just the one reported.

### 4. Bound fields documented as literals

**Symptom:** a shadow table shows `0`, `2`, `4`, `0` as plain text. The docs imply the library hardcodes shadow geometry, when every field is tokenised.

**Cause:** treating the Colour column as the only place a variable can appear. Shadows often bind all five of offsetX, offsetY, radius, spread and color. Text styles often bind font family, style and size.

**Detection:** count alias and text cells, and reconcile them with `boundVariables` in the source data. Any bound field rendered as `Text` is defective.

**Fix:** check `boundVariables` per field, per effect ([recipes.md](recipes.md) § *Shadows page*).

### 5. Plugin data read from the wrong file

**Symptom:** `JSON.parse` throws on an empty string, or discovery data seems to have vanished.

**Cause:** `setPluginData` writes to the `figma.root` of the file active at the time. Reading it after switching files returns `""` **silently**.

**Fix:** write the payload again onto the target's root after switching, or pass it through the conversation.

### 6. Bridge pinned to the wrong file

**Symptom:** none, until you inspect what you just changed. Writes land in an unrelated file.

**Cause:** the pin releases when its file disconnects. The active target reattaches to whatever else is connected, while still reporting `targetLocked: true`.

**Fix, most reliable first:**

1. **Pass the file key explicitly on every call**. Where the tool takes a per-call target (`figma_execute`'s `fileKey`), naming it removes the whole failure. The call cannot land anywhere else, it costs less than checking, and it does not decay over a long session.
2. **Read the file back from the result**. Tool results carry the file they ran against (`fileContext`). Glance at it on any call that mattered: it catches a silent reattach in one call rather than ten.
3. **Run `figma_list_open_files`** and compare `activeFileKey` before every write batch. Pin again after any disconnect.

**The trigger is the target *disconnecting*, not you switching**. When the pinned file's plugin closes, the pin releases, and the target reattaches to another connected file. Once the target dropped out mid-session, and the next call, ordinary to all appearances, ran against the source library. A disconnected file cannot be reached by `figma_navigate`, which only switches between running plugins. Ask the user to reopen it.

### 7. Probe artifacts left on the canvas

**Symptom:** a stray `Text sample` or orphan table on an unrelated page, surfacing later as an unexplained placeholder.

**Cause:** `createInstance()` places the node on the **current page**. Structural probes leak unless removed.

**Fix:** `remove()` in the same call. During verification, sweep generated pages for children that are not frames.

### 8. OKLCH silently falling back to hex

**Symptom:** an OKLCH run where a scatter of cells read as hex. It looks like a deliberate exception for those tokens (greys, or the utility ramp) rather than missing data.

**Cause:** the variable's description had no parseable `oklch(...)`. It was empty, or in another notation (`L 62.1 C 0.185 H 259`, `62.1% 0.185 259`). The `colourLabel` function falls back to hex by design, and the fallback is invisible unless the miss list is read back.

**Detection:** two separate signals, which should agree.

```js
// 1. in-run: the collector
oklchMisses            // names pushed by colourLabel

// 2. post-hoc: scan rendered labels on the colour pages
var hexish = table.findAll(function(n){
  return n.type === "TEXT" && /^#[0-9A-F]{6}/i.test(n.characters);
});
```

Under an OKLCH run, the scan should return only cells whose variable is in `oklchMisses` **or `alphaSchemaVars`**.

- An older alpha token (base and alpha only, no CSS head) correctly renders base hex plus its authored alpha. It is collected in `alphaSchemaVars`, not `oklchMisses`.
- Checking against `oklchMisses` alone flags each such row as a bypass. That false positive, "fixed", would destroy correct authored output.
- Chromatic alpha tokens render their authored `rgb(...)` verbatim, so they never appear in the hex scan.
- Anything hex-shaped in *neither* list is a literal that bypassed `colourLabel`. Find the call site.

**Fix:** report the names and ask the user to fill the descriptions. **Do not compute the value from the fill** to close the gap. The fill is 8-bit-rounded sRGB, and a computed OKLCH disagrees with the authored one, which is worse than an honest hex.

### 9. findOne matches the header row's Content slot, not Rows slot

**Symptom:** the header row fills with data. Or the cell properties come back as `Cell - Header`'s single `Label text` instead of `Cell - Default`'s three. Later writes silently do nothing or land on the wrong row.

**Cause:** a table holds two candidate slots, and `Row - Header`'s sits earlier in the tree. A `findOne` for either name returns the header's. It was seen twice in one session, on `Table - Global` and `Table - Text values`. The skill's own probe template once had this bug.

**Detection:** the probe reports a slot whose first child is `INSTANCE 'Cell - Header'`.

**Fix:** `rowsSlotOf()` and `headerCellsOf()` ([helpers.md](helpers.md) § *Node matching*). Match `Rows slot` by exact name *and* type, and reach header cells through the `Row - Header` instance.

### 10. Columns written by index after the library gained a column

**Symptom:** two columns of plausible values swapped: letter-spacing percentages under Line-height, and the reverse. Nothing throws, both columns are percentages, and the page reads as fine.

**Cause:** the doc component gained a column **in the middle**. The new Letter spacing column went in before the last one, Line-height. Any mapping such as `cells[4] = lineHeight` is now wrong.

**Detection:** compare each column's rendered values with the source field its **header label** implies, not its index.

**Fix:** build a label-to-field map and write by it. Report labels you do not recognise instead of guessing ([helpers.md](helpers.md) § *Column mapping*).

### 11. Library order replaced by alphabetical order

**Symptom:** an elevation scale documented as `Floating, Modal, Overlay, Raised`, or a type scale as `Body, Headline, Label, Title`. It looks tidy and is meaningless: the maintained order is gone.

**Cause:** sorting the results of the two style getters. That array is already in style-panel order.

**Detection:** compare the rendered order with the styles array, position by position, at **both** levels. A user once fixed the table block order by hand while every table still had its rows inverted (`lg-medium` before `lg-normal`). No block-level check would catch that.

**Fix:** do not sort styles. Take frame-group, table and row order from the array. Check both levels again after any user reorder.

### 12. A hung bridge call mistaken for a failed write

**Symptom:** the tool reports no result after minutes. You assume the frame is missing or half-built, and rebuild it.

**Cause:** the bridge died *returning the result*, after the plugin had committed the writes. The document is fine; only the response was lost.

**Detection:** on reconnect, query the actual state (frame names, table titles, row counts) and compare it with intent before touching anything. Once, the "interrupted" frame was complete and correct.

**Fix:** read the state first, and rebuild only what is truly missing. Write generating calls to be idempotent, so either answer is safe.

### 13. Whole page collapsed into one frame by a shared namespace

**Symptom:** a page with one frame holding a few very large tables. It reads as a deliberate flat layout. Row counts, values and order are right; only the structure is wrong, and nothing about it looks wrong.

**Cause:** "first path segment = frame group" taken literally when *every* variable shares that segment. A collection named `Primitives - Colour` whose variables all read `Colour/Brand/...` and `Colour/Palette/...` yields one group, `Colour`. The real top level is one segment deeper.

**It cascades**. With the prefix left on, `Colour/Utilities/white` has 3 segments and makes a table per utility colour. The redundant-title rule never fires, because no table name ever equals its frame group.

**It is not the label rule**. `redundantPrefix` and `stripPrefix` shorten alias *label text* when the head matches the frame group. This defect happens earlier, in deciding what the frame groups are. On a collapsed page the label rule cannot help, because the collapse comes before any label.

**Detection:** count distinct first segments before building.

```js
var firsts = {};
vars.forEach(function(v){ firsts[v.name.split("/")[0]] = true; });
// Object.keys(firsts).length === 1  ->  that segment is a namespace, not a group
```

**Fix:** strip it, and derive frames, tables and rows again from the rest ([structure.md](structure.md) § *Frames*).

- Strip **repeatedly**: a namespace can be more than one segment deep, and `Colour/Palette/...` throughout collapses again after one pass.
- Stop when two or more distinct first segments exist, which is real grouping. Stop also when a strip would leave a name with no segment.
- A name stripped to one segment groups under the stripped namespace, with its `_Title` hidden. Left unhandled, it writes `undefined` into a Name cell.

### 14. Every mode column showing the first mode's value

**Symptom:** on a two-mode colour page, Light and Dark show identical text while their swatches clearly differ. It reads as a copy-paste slip, or a rendering glitch in one column.

**Cause:** `oklchFrom` returns the **first** `oklch(...)` in the description. Where scale-generator tooling writes one value per mode on its own tagged line, every column gets the Light value. Both columns hold well-formed OKLCH, so nothing looks unset.

**Detection:** compare rendered labels across modes for the same row.

```js
// same row, different mode cells: identical label + different bound value = defective.
// A genuinely mode-independent colour (pure white) has the same swatch too, so
// check the swatch before flagging.
```

**Fix:** call `DOCGEN.oklchForMode(desc, modeName, allModes)`, passing `modes[m].name` and the collection's mode names into `colourLabel`. The same rule applies to **every** per-variable field read from a description, not just OKLCH (defect 15).

### 15. Alpha rendered as a whole percent

**Symptom:** an alpha ramp reads plausibly: `#161616 3%`, `#161616 30%`. Nothing looks broken. But the values are wrong, and copying them reproduces the defect the colour system was built to avoid.

**Cause:** a whole-percent rounding of a float32 alpha. On a real 12-step neutral ramp, **7 of the 11 inner steps composite to the wrong 8-bit value**. Step 6 is authored `0.2961` and composites to 186, matching its solid twin. Shown as `30%`, it composites to 185. The result is a faint seam wherever a solid token sits beside its alpha twin.

**Cause, second half:** the alpha was derived from the paint at all. It is authored in the description, exactly, and `alphaSpec` reads it.

**Detection:** any rendered alpha written as a whole percent, with no decimal point before the `%`.

```js
// authored 0.008584 shown as "1%" is a 16x error at the transparent end
/\s\d+%$/.test(label)   // whole percent (no decimal point) -> defective; "3.00%" is fine
```

**Fix:** `alphaLabel` (a 2dp percent). Prefer `DOCGEN.alphaSpecForMode(desc, modeName, allModes).alpha` over the paint's alpha whenever it exists. A 2dp percent reproduces every composited value exactly; it was checked across both 12-step neutral ramps.

**Read it per mode, or defect 14 returns inside the fix**. A two-mode alpha ramp carries a different base *and* a different alpha per mode. Reading the first line puts Light's alpha in the Dark column. The base comes from the paint and looks right; only the number after the slash is wrong.

The first cut of this fix did exactly that. It put `0.008584` in all twelve Dark cells of a ramp whose dark alphas run from `0.071429` to `0.977`.

The tagging is asymmetric: the first mode's line is usually **untagged**, and later modes carry `· dark`. So "require a tag" breaks Light, and "take the first match" breaks Dark. Both readers go through `pickLine`.

### 16. Type metrics documented in units the platform cannot use

**Symptom:** the Values table reads `150%` and `2%` for line-height and letter-spacing. Every value matches Figma exactly, and the page is still misleading. A developer who copies `line-height: 150%` into CSS gets a rule that breaks once a child has a different font size. A percentage line-height inherits the computed length, not the ratio, and `em` has the same flaw. Only unitless inherits the ratio.

**Cause:** documenting the storage format instead of the implementation format, on a library whose consumer is the web.

**Fix:** Step 2.1. Convert per **frame group**, gated on the group name or an explicit answer, through `unitTextFor`.

**The inverse defect is worse, and is why detection is cautious**. Converting a Mobile app or Print group writes 1.5 where the platform wants the percentage. Unlike the original, it cannot be recovered by inspection. A converted ratio looks like a font size or a misread number.

Never infer web from the file name, the collection name, or a general impression. For anything not on its list, `webGroupState` returns `null` rather than guessing, and `null` means ask.

**Detection:** scope the check per frame group, then assert the group is consistent.

- Collect one frame group's cells for one field as `{text, alias}`. Pass them to `DOCGEN.unitFormMix(cells, field)`, where `field` is `lineHeight` or `letterSpacing`.
- It returns `{authored, converted, other, mixed}`. A `mixed` result is a real defect, so report it.
- Authored forms end in `%` or `px`. Converted forms are a bare ratio for line-height, and `em` or `rem` for letter-spacing. Alias cells are skipped.
- Run it per group, never across groups, where a difference is the feature (F9).
- Look at anything counted in `other`: it is a string neither form explains.
- A group where `Auto` appears beside converted values is **not** mixed. `Auto` has no faithful CSS equivalent and stays as it is by design.

### 17. Prefix prop-matching sets a boolean onto Label text

**Symptom:** the whole generating call dies with `Property value is incompatible with component property type`. There is no partial output, so it reads like a broken component rather than a one-line matcher bug.

**Cause:** property keys carry `#id` suffixes, as in `Label#0:1` and `Label text#0:2`. The `_Title` component exposes both a Label BOOLEAN and a Label text TEXT.

A bare prefix match resolves Label to whichever key the loop yields first, perhaps `Label text#0:2`. It then hands `true` to a TEXT property. This was seen on the first generating call of a text-styles run.

**Fix:** match `k === name || k.indexOf(name + "#") === 0`. The `#` boundary is the terminator, since string matching has no word boundary. Every property lookup in these files uses that form. "The first property whose name starts with X" is safe only when no other property extends X.

**Detection:** none needed: this one is loud. The entry exists because the error points at the component, not the matcher.

### 18. Rows found by name collide across groups

**Symptom:** a spot-check on the row `md-normal` reports token `4xl` and line-height `1` for a Body style. The run looks wrong when it is not, or worse, looks right when it is not.

**Cause:** row names repeat per group by design. `Headline/md-normal`, `Title/md-normal` and `Body/md-normal` all render a row named `md-normal`. A page-level `findOne` by text returns the first in tree order, and every conclusion from it is about the wrong row. Once a check "found" swapped values in the right cells of the wrong table. The real defect, a swapped Size and Weight pair, was elsewhere, and the probe nearly misdirected the fix.

**Fix:** scope every lookup to its table. Resolve the table first by matching `_Title`'s `Title text` to the group, then search rows inside that table only. This applies to verification probes, refills, and any "find the row for style X" logic alike.

### 19. rem letter-spacing collapsed to one row per authored value

**Symptom:** a tidy two-row table (`-1% → -0.01rem`, `0% → 0rem`) on a page whose type scale runs from 12px to 40px. Every number is well-formed and right at one size, and the table is wrong at every other size.

**Cause:** treating rem like em. Figma stores letter-spacing as a percentage of the **font** size, and em is the same relationship, so one authored value is one row. But rem resolves against the **root** size. One authored `-1%` becomes a different value at every size it is used at, from `-0.025rem` at 40px to `-0.01rem` at 16px. Reducing to distinct *percentages* silently keeps one and drops the rest.

**Detection:** compare the row count with the distinct (value, size) pairs in use.

- `DOCGEN.remRowVerdict(styles, renderedRows)` returns `{expected, byValue, rendered, verdict}`.
- The verdict is `ok` for one row per (value, size) pair, and `collapsed` for one row per authored value (this defect). It is `mismatch` for any other count, which still needs reading.
- The counts come from `metricRows`, the function that builds the rows. So its zero row and its bound-field exclusion count exactly as they render.
- Run it only when `rem` was chosen; under `em` the by-value count is correct.

**Fix:** key rows per (value, size) under `rem` with `DOCGEN.metricRows(styles, field, true)`, and label them with the size through `metricRowName`. Render a zero once: it does not depend on size under any unit. State the root size, which is an assumption (16px is usual, not guaranteed).

**The mirror defect is keying by size alone**. One size often carries two tracking values from two groups: a 16px title at `-1%` beside a 16px body at `0%`. A size-keyed table silently drops one. The key is the pair, never either half.

### 20. Ragged table widths inside one frame

**Symptom:** a frame where one table runs clearly wider than the rest: one at 996 and five at 720. Every value is right, nothing clips, and the page looks broken. A user sent it back with the words "this should not happen".

**Cause:** the width ladder works per table by design. It asks whether *this* table's content fits, and answers correctly. Nothing then reconciles the answers across the frame, so one content-heavy table widens alone. Every content check misses it, coverage, order, pills and wrap detection alike, because none looks at a table beside its siblings.

**Detection:** count distinct widths per frame, not per page.

```js
var widths = {};
frame.children.forEach(function (n) {
  if (n.type === "INSTANCE" && n.name.indexOf("Table") === 0) widths[Math.round(n.width)] = true;
});
// Object.keys(widths).length > 1  ->  ragged frame
```

**Fix:** after the ladder settles, widen every table in the frame to the frame's widest ([generation.md](generation.md) § *Frame normalisation*). Only up: normalising down clips again whatever the ladder widened. Per frame only: a `1 - Values` frame at 996 beside a `2 - Samples` frame at 720 is correct. A page-level check would "fix" that into a regression.

### 21. A ruled deviation from source reverted by the next refill

**Symptom:** a page the user signed off comes back subtly wrong after an unrelated regeneration, and nothing in the report mentions it.

**Cause:** the user ruled that a cell should differ from the source on purpose. A Value column read `mobile ≤ 768` where the variable stores `768`, because the numbers are band boundaries and a bare figure reads as a device width. The ruling went into the rulings log, which records *what was decided*. It did not go into the per-skill configuration, which is what a future run reads. The generator wrote the literal back, correctly by its own lights.

**Detection:** before refilling any page, compare the existing cell values with what a fresh build would write. A difference is either drift to fix or a standing exception to keep. The file alone cannot tell you which, and that is the point.

**Fix:** record every ruled deviation in the project's per-skill configuration, phrased as an instruction to a future run. An example: "the Breakpoints table's Value cells carry ranges; apply again after filling". Name it in the run report, so the user can see it survived (toolkit-standard §D 19).

### 22. A slot filled against its rendered shape

**Symptom:** a heading renders as a run-on sentence at display size, or a description appears inline where a short label was expected.

**Cause:** the property name stated the author's intent, not the layout. One doc library's `Section header` has a `Subtitle` boolean. Its "subtitle" is an inline breadcrumb prefix at the heading's own 48px, rendering as `Components / Control`. It is not a description line beneath the heading, so prose written into it becomes part of the title.

**Detection:** instantiate the variant during the Step 1.2 probe, and read the child text nodes' `y` and `fontSize`. The heading's own `y` and size means inline. A lower `y` at a smaller size means a true secondary line.

**Fix:** probe how a part renders before deciding what belongs in it. When the shape cannot carry the content, say so and offer the alternatives rather than filling it anyway.

## False positives

Every detector here is right about its mechanism and blind to intent. Acting on these hits damages correct output: the wrap case once widened eleven tables that were already right. **Check what the correct output would look like before "fixing" a hit**.

### F1. Specimen text "wraps"

`Table - Text sample` renders sample text to show a type style. It is *meant* to run to several lines, and it still wraps after widening, because the specimen is simply long.

**Rule:** exclude `Table - Text sample` from the wrap detector entirely. Wrapping is a defect signal in a data cell and normal in a specimen cell.

### F2. Hidden swatches share one binding

On FLOAT and STRING tables every swatch resolves to the same variable, which looks exactly like defect 1. It is not: those cells have `Swatch=false`, and the node is not rendered. The shared placeholder underneath is invisible and harmless.

**Rule:** check the `Swatch` BOOLEAN property, or ancestor visibility, before flagging identical bindings.

```js
var cp = cell.componentProperties, on = null;
for (var k in cp) if (k.indexOf("Swatch") === 0 && cp[k].type === "BOOLEAN") on = cp[k].value;
if (on !== true) continue;   // hidden swatch — binding is irrelevant
```

### F3. Real content collides with placeholder strings

A text-style category truly named `Title` or `Label` is correct content, not a leftover. Confirm against the source data before clearing it.

### F4. Hidden _Title reports visible children

Scanning `node.visible` checks only the node itself. A `_Title` correctly hidden as redundant still has TEXT children with `visible: true`. Walk the **ancestors** with `effVisible(n)` in `scripts/figma-helpers.js`.

### F5. Real table titles read as placeholders

A placeholder scan for `Title`, `Label` and `Heading` hits the `_Title` instances of tables truly *called* Title and Label, which is most type scales. Flagging them as unset and "fixing" them wipes correct headings.

**Rule:** exclude text inside a `_Title` instance from the placeholder scan, with `inTitle(n)` in `scripts/figma-helpers.js`. Then check the rest. Combine with F3: check the source data before clearing anything.

The same applies to mode names. `Light` and `Dark` are placeholders in the shipped template, and **real header labels** on a two-mode collection. Do not scan for them blindly.

### F6. Strict equality on float32 values

Figma stores many numbers as float32. A query asserting `cornerSmoothing === 0.6` fails on every frame with `0.6000000238418579`, and one asserting a line height of 110 fails on `110.00000238418579`. Five "issues" in one run were all this.

**Rule:** compare with a tolerance, and round before rendering (`DOCGEN.num`, `DOCGEN.round2`).

### F7. Measuring straight after a resize

`resize()` does not reflow auto-layout at once, so measuring again in the same call reports the old geometry. A table that now fits reports as still clipping. Acting on it widens tables for no reason ([helpers.md](helpers.md) § *Width measurement*).

**Rule:** measure in a later call than the one that resized. Never assert "still clipping" from a reading in the same call.

### F8. Alpha descriptions read as "missing OKLCH"

An alpha token's description is filled in and carefully kept (`base #161616 · alpha 0.008584 · composites to Grey/1`). It holds no `oklch(...)`, so a naive coverage check counts it as missing. That is wrong on the facts, and the user can open the variable and see so.

**Rule:** bucket `alphaSpec` matches apart from real gaps, and describe them as a different schema. Neutral alpha leads with an `oklch(...)` head, so it lands in `have`. **Chromatic alpha leads with `rgb(...)` and stays in the alpha bucket by design**. Its per-step base has no OKLCH to quote, so its `rgb(...)` renders verbatim. Only older base-and-alpha descriptions render as hex plus the authored alpha.

### F9. Two groups documented differently

A page where `Web app` tables read `1.5` and `Mobile app` tables read `150%` looks as if the generator lost track halfway. It is correct: the decision is per group, and the two platforms want different things.

**Rule:** run the consistency detector **within** a frame group, never across the page. A page-wide check flags every correctly mixed library. "Fixing" it forces one platform's convention onto the other, which is defect 16's inverse, the direction that cannot be recovered.

### F10. Placeholder detector fires on groups named Title or Label

A sweep for default `_Title` text (`characters === "Title"`) reports placeholders on a page that is entirely correct. The library has groups truly named Title and Label, and their headings are *supposed* to read that way. One text-styles run with groups `Headline, Title, Body, Label` gave eight "placeholders" and zero defects.

**Rule:** compare the rendered text with the *intended* heading for that table, not with a list of suspect words. Title in a table whose group is Title is correct. In a table whose group is Spacing, it is the defect. The same holds for any detector keyed on default strings (`Label`, `Text`, `Value`): resolve intent first, then flag.

### F11. Badged tables look like coverage failures

A Step 2.2 table (Line height, Letter spacing) mirrors no variable in the collection. The standard coverage check, that every row resolves to a source variable, reports its rows as strays. The row total then overshoots the collection count. Both readings are right about the mechanism and wrong about intent: these tables *document values that have no token on purpose*.

**Rule:** exclude tables whose `_Title` carries the documentation-only badge from the coverage count. Report their rows as a separate figure: `71 variables + 11 non-tokenised metric rows`. Deleting them to make the count match destroys the very information the user asked for. Equally, do not let the exclusion hide a real stray: a table with no badge and no backing variable is still a defect.

### F12. One page, some swatches bound and some static

Most swatches on a colour page may carry a live binding, while one or two hold a plain fill. It looks like a generator that lost its footing. It is usually correct: **whether a swatch can bind depends on the source token, not the run**. A published token imports and binds. A token hidden from publishing cannot be imported from a consuming file, so its swatch can only be a literal fill.

**Rule:** report the split with its reason (`23 bound · 1 static — Colour/Utilities/white-32% is hidden from publishing`) rather than flattening it. Do not "fix" the static one by unbinding its neighbours. Do not silently make everything static either: the bound ones follow the library and are strictly better.

**What matters is uniformity within a page, not the most binding**. A hidden collection may be reachable only *partly*, through published aliases that point at some of it. Binding that subset makes some rows follow the library and some not, and nothing on the page says which.

Once, 61 of 106 primitives were reachable that way. Uniform static fills were chosen over a 61/45 split, because a silently half-live page is worse than an honestly frozen one. If most of a collection is out of reach, make the whole page static and say so.

## Verification queries

`verifyPage(page)` in `scripts/verify.js` runs this table in one call (SKILL.md, Step 5), and the table is its account. It reads back what renders; it never relies on appearance. Two checks are narrowed:

- *Column mapping* is checked as the header reading the recipe's columns, in order.
- *Widths* is checked as one width per frame; the ladder's own detectors are in [helpers.md](helpers.md) § *Width measurement*.

| Check | Asserts | Watch for |
|---|---|---|
| **Structure** | frames are FRAMEs with the fixed chrome (below); numbering alphabetical and only when more than one; frame 1 last in children | children that are not frames are leaked probes (defect 7); F6 |
| **Coverage** | every source variable or style rendered **exactly once**; rows counted against the source count | duplicates from a retried append; silent omissions |
| **Swatch bindings** | per table, the bound variable names are not all identical, and each equals its own cell's label | F2: skip cells whose `Swatch` boolean is false |
| **Alias integrity** | for every `Content=Alias` cell, the nested pill's text equals the cell's `Label text` | defect 2 |
| **Row order** | rendered order matches the rule applied: `orderRows` for variables, the **styles array** for styles | defects 3 and 11; check block order *and* row order |
| **Library order** | on style pages, the rendered order equals the style getter's order, position by position | defect 11 |
| **Column mapping** | each column's values match the field its **header label** implies | defect 10 |
| **Alias coverage** | the count of bound fields equals the count of `Content=Alias` cells | defect 4 |
| **Header labels** | mode columns equal the collection's mode names; the first column matches the file's existing pages | leftover `Light` and `Dark`, but see F5 |
| **Placeholders** | a scan for Subcomponent, Heading, Subheading, Label and Title, filtered by `effVisible` and excluding `inTitle` | F3, F4 and F5 |
| **Widths** | the component default, except measured offenders stepped up the ladder | F1: exclude sample tables; F7: measure in a later call |
| **Colour format** | every raw COLOR literal matches the format chosen at Step 0.2 | defect 8: hex labels in an OKLCH run are all in `oklchMisses` **or** `alphaSchemaVars` |

The fixed chrome is `cornerRadius` 40, `cornerSmoothing` 0.6, and padding and gap of 160 and 64. In the colour-format check, an authored `rgb(...)` label is chromatic alpha, not a miss.

A clean run on a six-page library shows 0 structural issues and 0 pill mismatches across every alias cell. It also shows 0 row-order deviations, 0 visible placeholders and 0 strays.

**Verify over every row, not a sample**. Returning the first four rows to keep the output readable is how a misplaced seventh row gets called clean. Order defects cluster in the middle and at the end of a ramp, at the annotated step or the boundary between two prefix groups. A head-of-list sample cannot see there.

Return **totals over the full set**, not excerpts: a deviation count against the recomputed order, a mismatch count, a distinct-binding count against the row count. Those stay small however many rows there are. Where only a sample is possible, report the check as partial. An honest "verified 4 of 24 rows" is useful. A "clean" resting on 4 of 24 is worse than no check, because it retires the suspicion.

Screenshots are for layout, spacing and overflow only. They cannot show a wrong binding, or an unset label that happens to read as a plausible word.

## Loud failures

These throw. Fix the cause; never catch and continue.

| Error | Cause | Fix |
|---|---|---|
| `unloaded font "X Y"` on `appendChild` | fonts not preloaded in this call | preload at the top of **every** generating call; clean up the partial frame before retrying |
| `Removing this node is not allowed` | the container is a plain FRAME inside an instance, not a SLOT | the doc component's `Content slot` must become a SLOT: report it, never work around it |
| `Cannot move node. New parent is an instance or is inside of an instance` | the same, on `appendChild` | as above |
| `in appendChild: ... layoutSizingHorizontal` | `FILL` set before the node was appended | append first, then set sizing |
| The call times out at 30 s | too much work in one call | one frame per call; split large frames by table subset; cache live variable lookups |
| A first-ever key import into this file times out | the first fetch pulls the asset from the library; a large table component can use the whole budget alone | **retry once** (below) |

**A first import that times out: retry once**. The failed attempt warms the cache, and the second call returns at once. This covers both `importComponentByKeyAsync` and `importStyleByKeyAsync`. Treat the component as missing only if a retry also fails.

**Warm imports before you need them**. A generating call that also does a first-time import carries two risks in one budget, and the import is the unpredictable half. Once three calls in a row died on the first fetch of one table component. An import-only call, then a retry, then the probe all went fine.

Components already imported cost nothing to import again, so warming is cheap and idempotent. Warm every component a page needs in one import-only call *before* the call that instantiates them.

**The Text sample case**. If the `Content slot` of `Table - Text sample` is a FRAME rather than a SLOT, the table is **locked at exactly three samples**. Both `appendChild` and `remove` throw, and only `visible` can change.

Do not work around it by splitting a category across several tables: that invents structure the type scale does not have. Report it and ask for the component to be changed, since editing a published doc library is the user's call. Once it is a SLOT, `adjustRowCount` grows and shrinks it normally.
