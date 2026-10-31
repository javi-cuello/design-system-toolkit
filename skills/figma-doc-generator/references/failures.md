# Silent failures and verification

Every entry here was observed in production. All but one produced output that looked correct.

---

## Contents

- [The catalogue](#the-catalogue) — twenty-two silent defects, with detection queries
- False positives — the F-numbered entries inside the catalogue, detectors that cry wolf
- [Verification queries](#verification-queries) — what to run after generating
- [Loud failures](#loud-failures) — errors that throw

---

## The catalogue

### 1. Swatch bound to the component placeholder

**Symptom:** every swatch renders the same neutral grey, evenly, across a whole table. Reads as a design choice.

**Cause:** the skill looked for a `RECTANGLE`; in this library copy the swatch is a **FRAME** named `Swatch`. `findOne` returned `null`, the fill was never rewritten, and each cell kept the main component's own binding (e.g. `Background/Neutral/soft`).

**Detection:** resolve what each swatch is actually bound to and confirm the names differ per row.

```js
var sw = cell.findOne(function(n){ return n.name === "Swatch"; });
var bv = sw && sw.fills && sw.fills[0] && sw.fills[0].boundVariables
       ? sw.fills[0].boundVariables.color : null;
var name = bv ? (await figma.variables.getVariableByIdAsync(bv.id)).name : "UNBOUND";
```

If every row reports the same name, they are all on the placeholder.

**Fix:** match by name, never by type. `swatchOf()` in `helpers.md`.

---

### 2. Alias label written to a property nothing renders

**Symptom:** alias cells display the literal word `Label`. Count equals `variables × modes` exactly — a suspiciously round number.

**Cause:** in the `Content=Alias` variant the visible text belongs to a **nested `Pill` instance**. Setting the cell's own `Label text` stores a queryable value that is never drawn.

**Detection:** compare the cell property against the pill property.

```js
var cp = cell.componentProperties, cellLabel = null;
for (var k in cp) if (cp[k].type === "TEXT") cellLabel = cp[k].value;
var pill = cell.findOne(function(n){ return n.type === "INSTANCE" && n.name === "Pill"; });
var pillLabel = null;
if (pill) { var pp = pill.componentProperties; for (var k in pp) if (pp[k].type === "TEXT") pillLabel = pp[k].value; }
// cellLabel !== pillLabel  ->  defective
```

**Fix:** `setAliasCell()` writes both.

---

### 3. Mixed ramps interleaved by a missing sort case

**Symptom:** a grey scale reads `1`, `Alphas/1`, `2`, `Alphas/2`, `3`… Looks like an intentional pairing.

**Cause:** `smartSort` case 2 omitted. Falling through to the last-segment comparison ties `Alphas/1` with the solid `1`.

**Detection:** recompute the expected order and diff it against the rendered order.

```js
var current = /* row-name of each row, in order */;
var want = DOCGEN.smartSort(current.map(function(x){ return {rn: x}; })).map(function(x){ return x.rn; });
// any index where current[i] !== want[i] -> defective table
```

**Fix:** all three cases, in `helpers.md`. Sweep every table, not just the one reported.

---

### 4. Bound fields documented as literals

**Symptom:** a shadow table shows `0`, `2`, `4`, `0` as plain text, and the docs imply the library hardcodes shadow geometry when in fact every field is tokenised.

**Cause:** treating the Colour column as the only place a variable can appear. Shadows commonly bind all five of `offsetX`, `offsetY`, `radius`, `spread`, `color`; text styles commonly bind `fontFamily`, `fontStyle`, `fontSize`.

**Detection:** count alias vs text cells and reconcile against `boundVariables` in the source data. Any field with a binding that rendered as `Text` is defective.

**Fix:** check `boundVariables` per field, per effect. See `recipes.md`.

---

### 5. Plugin data read from the wrong file

**Symptom:** `JSON.parse` throws on an empty string, or discovery data appears to have vanished.

**Cause:** `setPluginData` writes to the `figma.root` of the file that was active at the time. Reading it after switching files returns `""` **silently**.

**Fix:** re-write the payload onto the target's root after switching, or pass it through the conversation.

---

### 6. Bridge pinned to the wrong file

**Symptom:** none, until you inspect what you just modified. Writes land in an unrelated file.

**Cause:** the pin releases when its file disconnects and the active target reattaches to whatever else is connected — while still reporting `targetLocked: true`.

**Fix, in order of reliability:**

1. **Pass the file key explicitly on every call.** Where the tool accepts a per-call target (`figma_execute`'s `fileKey`), naming it removes the whole failure mode — the call cannot land anywhere else, whatever the active target is doing. Cheaper than checking, and it does not decay over a long session.
2. **Read the file back from the result.** Tool results carry the file they ran against (`fileContext`). Glance at it on any call that mattered; it is how a silent reattach gets caught in one call rather than ten.
3. `figma_list_open_files` and compare `activeFileKey` before every write batch. Re-pin after any disconnect.

**The trigger is the target *disconnecting*, not you switching.** When the pinned file's plugin closes, the pin releases and the target reattaches to whatever else is still connected. Observed live: the target file dropped out mid-session, and the next call — which read as perfectly ordinary — executed against the source library instead. Note that a disconnected file also cannot be reached by `figma_navigate`, which only switches between files that already have the plugin running; ask the user to reopen it.

---

### 7. Probe artifacts left on the canvas

**Symptom:** a stray `Text sample` or orphan table on an unrelated page, surfacing later as an unexplained placeholder.

**Cause:** `createInstance()` places the node on the **current page**. Structural probes leak unless explicitly removed.

**Fix:** `remove()` in the same call, and sweep for non-FRAME children on generated pages during verification.

---

---

### 8. OKLCH silently falling back to hex

**Symptom:** an OKLCH run where a scattering of cells read as hex. Looks like a deliberate exception for those particular tokens — greys, or the utility ramp — rather than missing data.

**Cause:** the variable's description had no parseable `oklch(...)`: empty, or written in another notation (`L 62.1 C 0.185 H 259`, `62.1% 0.185 259`). `colourLabel` falls back to hex by design, and the fallback is invisible unless the miss list is read back.

**Detection:** two independent signals, and they should agree.

```js
// 1. in-run: the collector
oklchMisses            // names pushed by colourLabel

// 2. post-hoc: scan rendered labels on the colour pages
var hexish = table.findAll(function(n){
  return n.type === "TEXT" && /^#[0-9A-F]{6}/i.test(n.characters);
});
```

Under `fmt === "oklch"` the second query should return only cells whose variable appears in `oklchMisses` **or `alphaSchemaVars`** — a legacy alpha token (base+alpha description, no CSS head) legitimately renders base hex plus its authored alpha, and it is collected in `alphaSchemaVars`, not `oklchMisses`. Checking against `oklchMisses` alone flags every one of those rows as a bypass: a false positive that "fixing" would destroy correct authored output. Chromatic alpha tokens render their authored `rgb(...)` verbatim, so they never appear in the hex scan at all. Anything hex-shaped that is in *neither* list means a literal genuinely bypassed `colourLabel` — find the call site.

**Fix:** report the names to the user and ask them to fill the descriptions. **Do not compute the value from the fill** to close the gap — the fill is 8-bit-rounded sRGB and the computed OKLCH will disagree with the authored one, which is worse than an honest hex.

---

### 9. `findOne` matches the header row's `Content slot` instead of `Rows slot`

**Symptom:** the header row fills with data, or `cellProps` comes back as `Cell - Header`'s single `Label text` when you expected `Cell - Default`'s three properties. Downstream writes silently no-op or land on the wrong row.

**Cause:** a table contains two candidate slots and `Row - Header`'s sits earlier in the tree, so `findOne(n => n.name === "Rows slot" || n.name === "Content slot")` returns the header's. Observed twice in one session, on `Table - Global` and `Table - Text values` — and the skill's own probe template contained this bug.

**Detection:** the probe reports `slot` whose first child is `INSTANCE 'Cell - Header'`.

**Fix:** `rowsSlotOf()` / `headerCellsOf()` in `helpers.md`. Match `Rows slot` by exact name *and* type; reach header cells through the `Row - Header` instance.

---

### 10. Columns written by index after the library gained a column

**Symptom:** two columns of plausible values swapped — letter-spacing percentages under Line-height and vice versa. Nothing throws, both columns are percentages, the page reads as fine.

**Cause:** the doc component gained a column **in the middle** (`Name · Family · Size · Weight · Letter spacing · Line-height`, with the new one inserted before the last). Any `cells[4] = lineHeight` mapping is now wrong.

**Detection:** compare each column's rendered values against the source field implied by its **header label**, not by its index.

**Fix:** build a label → field map and write by that. Report unrecognised labels instead of guessing. `helpers.md`, "Column mapping".

---

### 11. Library order replaced by alphabetical order

**Symptom:** an elevation scale documented as `Floating, Modal, Overlay, Raised`, or a type scale as `Body, Headline, Label, Title`. Looks tidy, and is meaningless — the maintained semantic order is gone.

**Cause:** sorting `getLocalEffectStylesAsync` / `getLocalTextStylesAsync` results. That array is already in style-panel order.

**Detection:** diff the rendered sequence against the styles array, position by position — at **both** levels. In one session the user hand-fixed the table block order while every table still had its rows inverted (`lg-medium` before `lg-normal`), which no block-level check would catch.

**Fix:** do not sort styles. Derive frame-group order, table order and row order from the array. Re-check both levels after any user reorder.

---

### 12. A hung bridge call mistaken for a failed write

**Symptom:** the tool reports no result after minutes; you assume the frame is missing or half-built and rebuild it.

**Cause:** the bridge died *returning the result*, after the plugin had already committed the writes. The document is fine; only the response was lost.

**Detection:** on reconnect, query the actual state — frame names, table titles, row counts — and diff against intent before touching anything. In one session the "interrupted" frame was complete and correct.

**Fix:** read state first, rebuild only what is genuinely missing, and write generating calls to be idempotent so either answer is safe.

---

Every detector below is correct about its mechanism and blind to intent. Acting on these hits damages correct output — the wrap case widened eleven tables that were already right. **Check what the correct output would look like before "fixing" a hit.**

### 13. Whole page collapsed into one frame by a shared namespace

**Symptom:** a page with a single frame holding a few very large tables. Reads as a deliberate flat layout. Row counts right, values right, ordering right — only the structure wrong, and nothing about it looks wrong.

**Cause:** "first path segment = frame group" taken literally when *every* variable shares that segment. A collection named `Primitives - Colour` whose variables all read `Colour/Brand/...`, `Colour/Palette/...` yields exactly one group, `Colour`. The real top level is one segment deeper.

It cascades: with the prefix left on, `Colour/Utilities/white` is 3 segments and produces one table per utility colour, and the redundant-`_Title` rule never fires because no table name ever equals its frame group.

**Not the same as the label rule.** `redundantPrefix`/`stripPrefix` shortens alias *label text* when the head matches the frame group. This defect happens earlier, deciding what the frame groups are. On a collapsed page the label rule cannot help, because the collapse precedes any label.

**Detection:** count distinct first segments before building.

```js
var firsts = {};
vars.forEach(function(v){ firsts[v.name.split("/")[0]] = true; });
// Object.keys(firsts).length === 1  ->  that segment is a namespace, not a group
```

**Fix:** strip it and re-derive frames, tables and rows from the remainder — and strip **repeatedly**, because a namespace can be more than one segment deep (`Colour/Palette/...` throughout collapses again after a single-pass strip). Stop when two or more distinct first segments exist — then it is genuine grouping — or when a strip would drop any name below one remaining segment. A name stripped to a single segment groups under the stripped namespace with its `_Title` hidden; left unhandled it writes `undefined` into a Name cell.

---

### 14. Every mode column showing the first mode's value

**Symptom:** on a two-mode colour page, Light and Dark show identical text while their swatches visibly differ. Reads as a copy-paste slip, or a rendering glitch in one column.

**Cause:** `oklchFrom` returns the **first** `oklch(...)` in the description. Where scale-generator tooling writes one value per mode on its own tagged line, every column gets the Light value. Both columns hold well-formed OKLCH, so nothing looks unset.

**Detection:** compare rendered labels across modes for the same row.

```js
// same row, different mode cells: identical label + different bound value = defective.
// A genuinely mode-independent colour (pure white) has the same swatch too, so
// check the swatch before flagging.
```

**Fix:** `DOCGEN.oklchForMode(desc, modeName, allModes)`; pass `modes[m].name` and the collection's mode names into `colourLabel`. The same rule applies to **every** per-variable field read out of a description, not just OKLCH — see defect 15.

---

### 15. Alpha rendered as a whole percent

**Symptom:** an alpha ramp reads plausibly — `#161616 3%`, `#161616 30%`. Nothing looks broken. But the values are wrong, and copying them reproduces the exact defect the colour system was built to avoid.

**Cause:** `Math.round(c.a * 100) + "%"` on a float32 alpha. Measured against a real 12-step neutral ramp, **7 of the 11 non-endpoint steps composite to the wrong 8-bit value**: step 6 is authored `0.2961` and composites to 186, matching its solid twin; shown as `30%` it composites to 185. The result is a faint seam wherever a solid token sits beside its alpha twin.

**Cause, second half:** the alpha was re-derived from the paint at all. It is authored in the description, exactly, and `alphaSpec` reads it.

**Detection:** any rendered alpha written as a whole percent — no decimal point before the `%`.

```js
// authored 0.008584 shown as "1%" is a 16x error at the transparent end
/\s\d+%$/.test(label)   // whole percent (no decimal point) -> defective; "3.00%" is fine
```

**Fix:** `alphaLabel` (2dp percent), and prefer `DOCGEN.alphaSpecForMode(desc, modeName, allModes).alpha` over `c.a` whenever it exists. 2dp percent reproduces every composited value exactly; verified across both 12-step neutral ramps.

**Read it per mode, or you rebuild defect 14 inside the fix.** A two-mode alpha ramp carries a different base *and* a different alpha per mode. Reading the first line puts Light's alpha in the Dark column while the base still looks right — the base comes from the paint, so only the number after the slash is wrong, and it reads as entirely plausible. This happened: the first cut of the fix shipped with a non-mode-aware `alphaSpec` and put `0.008584` in all twelve Dark cells of a ramp whose dark alphas run `0.071429`…`0.977`.

Note the tagging is asymmetric — the first mode's line is usually **untagged** and later modes carry `· dark` — so "require a tag" breaks Light and "take the first match" breaks Dark. Both readers go through `pickLine`.

---

### 16. Type metrics documented in units the platform cannot use

**Symptom:** the Values table reads `150%` and `2%` for line-height and letter-spacing. Every value matches Figma exactly. Nothing is wrong with the *data* — and the page is still misleading, because a developer copying `line-height: 150%` into CSS gets a rule that breaks the moment a child element has a different font-size. Percentage line-height inherits the computed length, not the ratio; `em` has the identical flaw. Only unitless inherits the ratio.

**Cause:** documenting the storage format instead of the implementation format on a library whose consumer is the web.

**Fix:** Step 2.1. Convert per **frame group**, gated on the group name or an explicit answer, through `unitTextFor`.

**The inverse defect is worse and is the reason detection is conservative.** Converting a `Mobile app` or `Print` group produces `1.5` where the platform genuinely wants the percentage, and unlike the original it is not recoverable by inspection — a reader cannot tell a converted ratio from a font-size or a mis-parsed number. Never infer web from the file name, the collection name, or the general impression that the library is a web design system. `webGroupState` returns `null` rather than guessing for anything not on its list, and `null` means ask.

**Detection:** scope the check per frame group, then assert internal consistency.

Collect one frame group's cells for one field as `{text, alias}` and pass them to `DOCGEN.unitFormMix(cells, field)` (`field` is `lineHeight` or `letterSpacing`). It returns `{authored, converted, other, mixed}`; `mixed` is a real defect, so report it. Authored forms end in `%` or `px`. Converted forms are a bare ratio for line-height, and `em` or `rem` for letter-spacing. Alias cells are skipped. Run it per group, never across groups, where a difference is the feature. Anything counted in `other` is a string neither form explains, so look at it rather than ignoring it. A group where `Auto` appears alongside converted values is **not** mixed — `Auto` has no faithful CSS equivalent and stays as it is by design.

---

### 17. Prefix prop-matching sets a boolean onto `Label text`

**Symptom:** the whole generating call dies with `Property value is incompatible with component property type` — no partial output to inspect, so it reads like a broken component rather than a one-line matcher bug.

**Cause:** component property keys carry `#id` suffixes (`Label#0:1`, `Label text#0:2`), and `_Title` exposes both a `Label` BOOLEAN and a `Label text` TEXT. A bare prefix match (`k.indexOf("Label") === 0`) resolves `Label` to `Label text#0:2` — whichever the key iteration yields first — and hands `true` to a TEXT property. Observed live on the first generating call of a text-styles run.

**Fix:** match `k === name || k.indexOf(name + "#") === 0` — the `#` boundary is the terminator, the way `\b` isn't available in string matching. Every property lookup in these files should use that form; "first property whose name starts with X" is only safe when no other property extends X.

**Detection:** none needed — this one is loud. The entry exists because the error message points at the component, not the matcher.

---

### 18. Rows found by name collide across groups; scope every lookup to its table

**Symptom:** a spot-check on the row `md-normal` reports token `4xl` and line-height `1` for a Body style, and the run looks wrong when it isn't — or worse, looks right when it isn't.

**Cause:** row names repeat per group by design (`Headline/md-normal`, `Title/md-normal`, `Body/md-normal` all render a row named `md-normal`). A page-level `findOne` by characters returns whichever comes first in tree order, and every conclusion drawn from it is about the wrong row. Observed live: a verification pass "found" swapped values in the right cells of the wrong table — the actual defect (a genuinely swapped Size/Weight pair) was elsewhere and the misleading probe nearly misdirected the fix.

**Fix:** resolve the table first — match `_Title`'s `Title text` to the group — then search rows inside that table only. Applies to verification probes, refills, and any "find the row for style X" logic alike.

---


### 19. `rem` letter-spacing collapsed to one row per authored value

**Symptom:** a tidy two-row table — `-1% → -0.01rem`, `0% → 0rem` — on a page whose type scale runs from 12px to 40px. Every number is well-formed, the arithmetic checks out at one size, and the table is wrong for every other size in the library.

**Cause:** treating `rem` like `em`. Figma stores letter-spacing as a percentage of the **font** size; `em` is that same relationship, so `%` → `em` is exact and one authored value is one row. `rem` resolves against the **root** size, so the conversion is `pct/100 × fontSize / root` and one authored `-1%` becomes a different value at every size it is used at — `-0.025rem` at 40px through `-0.01rem` at 16px. Reducing to distinct *percentages* silently picks one and discards the rest.

**Detection:** compare the row count against the distinct (value, size) pairs actually in use.

`DOCGEN.remRowVerdict(styles, renderedRows)` returns `{expected, byValue, rendered, verdict}`. `verdict` is `ok` when the table has one row per (value, size) pair, `collapsed` when it has one row per authored value (this defect), and `mismatch` for any other count, which still needs reading. The counts come from `metricRows`, the function that builds the rows, so its zero row and its bound-field exclusion are counted exactly as they render. Only run it when `rem` was chosen; under `em` the by-value count is the correct one.

**Fix:** key rows per (value, size) under `rem` — `DOCGEN.metricRows(styles, field, true)` — and label them with the size via `metricRowName`. Render a zero once; it is size-independent under any unit. State the root size, which is an assumption (16px is conventional, not guaranteed).

**Related collision:** keying by *size* alone instead is the mirror defect. The same size routinely carries two different tracking values from two different groups — a 16px title at `-1%` beside a 16px body at `0%` — and a size-keyed table silently drops one. The key is the pair, never either half.

---

### F12. One page, some swatches bound and some static

A colour page where most swatches carry a live variable binding and one or two hold a plain fill reads as a generator that lost its footing halfway. It is usually correct: **whether a swatch can bind is a property of the source token, not of the run.** A published token imports and binds; a token hidden from publishing cannot be imported from a consuming file at all, so its swatch can only be a literal fill. A page mixing both is documenting a library that mixes both.

**Rule:** report the split with the reason (`23 bound · 1 static — Colour/Utilities/white-32% is hidden from publishing`) rather than flattening it. Do not "fix" the static one by unbinding its neighbours for consistency, and do not silently make everything static — the bound ones follow the library and are strictly better.

**The threshold that matters is uniformity within a page, not maximum binding.** Where a hidden collection is reachable only *partly* — via published aliases that happen to point at some of it — binding the reachable subset produces a page where some rows update with the library and some do not, with nothing on the page saying which. Observed live: 61 of 106 primitives were reachable that way; uniform static fills were chosen deliberately over a 61/45 split, because a documentation page that is silently half-live is worse than one that is honestly frozen. If most of a collection is unreachable, make the whole page static and say so.

### F11. Badged tables look like coverage failures

A Step 2.2 table (`Line height`, `Letter spacing`) mirrors no variable in the collection, so the standard coverage assertion — every rendered row resolves to a source variable — reports its rows as unknown strays, and the row total overshoots the collection count. Both readings are correct about the mechanism and wrong about the intent: these tables are *documentation of values that deliberately have no token*.

**Rule:** exclude tables whose `_Title` carries the documentation-only badge from the collection coverage count, and report their rows as a separate figure (`71 variables + 11 non-tokenised metric rows`). Deleting them to make the count line up destroys exactly the information the maintainer asked for. Equally, do not let the exclusion hide a real stray: a table with no badge and no backing variable is still a defect.

### 20. Ragged table widths inside one frame

**Symptom:** a frame where one table runs noticeably wider than the rest — six tables, one at 996 and five at 720. Every value is right, nothing clips, and the page looks broken. Reported from a real run with the words "this should not happen".

**Cause:** the width ladder is per table by design — it asks "does *this* table's content fit" and answers correctly. Nothing then reconciles the answers across the frame, so a single content-heavy table (a long alias path, an OKLCH label) widens alone and its neighbours keep the component default. The defect is invisible to every content-level check: coverage, ordering, pill integrity and the wrap detector all pass, because none of them looks at a table relative to its siblings.

**Detection:** count distinct widths per frame, not per page.

```js
var widths = {};
frame.children.forEach(function (n) {
  if (n.type === "INSTANCE" && n.name.indexOf("Table") === 0) widths[Math.round(n.width)] = true;
});
// Object.keys(widths).length > 1  ->  ragged frame
```

**Fix:** after the ladder settles, resize every table in the frame up to the frame's maximum (SKILL.md, Table width). Only up — normalising down re-clips whatever the ladder just widened. Per frame only: a `1 - Values` frame at 996 beside a `2 - Samples` frame at 720 is correct, and a page-level check would "fix" that into a regression.

---

### F9. Two groups documented differently

A page where `Web app` tables read `1.5` and `Mobile app` tables read `150%` looks like the generator lost track of its own convention halfway through. It is the correct output: the decision is per group, and the two platforms want different things.

**Rule:** run the consistency detector **within** a frame group, never across the page. A page-wide check flags every correctly mixed library, and "fixing" it forces one platform's convention onto the other — which is defect 16's inverse, the unrecoverable direction.

### F1. Specimen text "wraps"

`Table - Text sample` renders lorem ipsum to demonstrate a type style. It is *meant* to run to several lines, and it still wraps after widening, because the specimen is simply long.

**Rule:** exclude `Table - Text sample` from the wrap detector entirely. Wrapping is a defect signal in a data cell and normal behaviour in a specimen cell.

### F2. Hidden swatches share one binding

On FLOAT/STRING tables every swatch resolves to the same variable, which looks exactly like defect 1. It isn't: those cells have `Swatch=false` and the node is not rendered. The shared placeholder underneath is invisible and harmless.

**Rule:** check the `Swatch` BOOLEAN property, or ancestor visibility, before flagging identical bindings.

```js
var cp = cell.componentProperties, on = null;
for (var k in cp) if (k.indexOf("Swatch") === 0 && cp[k].type === "BOOLEAN") on = cp[k].value;
if (on !== true) continue;   // hidden swatch — binding is irrelevant
```

### F8. Alpha descriptions read as "missing OKLCH"

An alpha token's description is filled in and carefully maintained — `base #161616 · alpha 0.008584 · composites to Grey/1` — but contains no `oklch(...)`, so a naive coverage check counts it as missing. Reporting it that way is wrong on the facts, and the user can open the variable and see that it is wrong.

**Rule:** bucket `alphaSpec` matches separately from genuine gaps and describe them as a different schema. Neutral alpha output leads with an `oklch(...)` head and lands in `have`; **chromatic alpha leads with `rgb(...)` and stays in the alpha bucket by design** — its per-step base has no OKLCH to quote, and its authored `rgb(...)` renders verbatim. Only legacy base+alpha-only descriptions render as hex plus the authored alpha.


### F3. Real content collides with placeholder strings

A text-style category genuinely named `Title` or `Label` is correct content, not a leftover. Confirm against the source data before clearing it.

### F4. Hidden `_Title` reports visible children

Scanning `node.visible` checks only the node itself. A `_Title` correctly hidden as redundant still has TEXT children with `visible: true`. Walk **ancestors**:

> `effVisible(n)` — in `scripts/figma-helpers.js`.

### F5. Legitimate table titles read as placeholders

A placeholder scan for `Title`, `Label`, `Heading` will hit the `_Title` instances of tables genuinely *called* `Title` and `Label` — which is most type scales. Flagging them as unset placeholders and "fixing" them wipes correct headings.

**Rule:** exclude text that sits inside a `_Title` instance from the placeholder scan, then check the remainder. Combine with F3 — verify against the source data before clearing anything.

> `inTitle(n)` — in `scripts/figma-helpers.js`.

Note the same applies to mode names: `Light` and `Dark` are placeholders in the shipped template and **real header labels** on a two-mode collection. Do not scan for them blindly.

### F6. Strict equality on float32 values

Figma stores many numbers as float32, so a verification query asserting `cornerSmoothing === 0.6` fails on every frame with `0.6000000238418579`, and `lineHeight === 110` fails on `110.00000238418579`. Five "issues" in one run were all this.

**Rule:** compare with a tolerance, and round before rendering.

```js
```

### F7. Measuring straight after a resize

Covered in full under Table width in `helpers.md`, and it belongs here too: `resize()` does not reflow auto-layout synchronously, so a re-measure in the same call reports the old geometry. A table that now fits is reported as still clipping. Acting on it escalates widths for no reason.

**Rule:** measure in a later call than the one that resized. Never assert "still clipping" from a same-call reading.


---

### F10. Placeholder detector fires on groups literally named "Title" or "Label"

A post-generation sweep for default `_Title` text (`characters === "Title"`) reports visible placeholders on a page that is entirely correct — because the library has groups genuinely named `Title` and `Label`, and their headings are *supposed* to read that way. Observed live on a text-styles run whose groups were `Headline, Title, Body, Label`: eight "placeholders", zero defects.

**Rule:** a placeholder check must compare the rendered text against the *intended* heading for that table, not against a list of suspicious words. `Title` in a table whose group is `Title` is correct output; `Title` in a table whose group is `Spacing` is the defect. The same collision applies to any detector keyed on default strings (`Label`, `Text`, `Value`) — resolve intent first, then flag.
---

## Verification queries

`verifyPage(page)` in `scripts/verify.js` runs this table in one call (SKILL.md Step 5), and the table is its account — with two narrowings: *Column mapping* is checked as the header reading the recipe's columns in order, and *Widths* as one width per frame (the ladder's own detectors are `helpers.md`'s). They read what renders back; they do not rely on appearance.

| Check | Asserts | Watch for |
|---|---|---|
| **Structure** | frames are FRAMEs; `cornerRadius` 40, `cornerSmoothing` 0.6, padding/gap 160/64; numbering alphabetical and only when >1; frame 1 last in `children` | non-FRAME children = leaked probe artifacts (defect 7); F6 float32 equality |
| **Coverage** | every source variable / style rendered **exactly once**; count rows against the source count | duplicates from a retried append; silent omissions |
| **Swatch bindings** | per table, the bound variable names are not all identical, and each equals its own cell's label | F2 — skip cells whose `Swatch` boolean is false |
| **Alias integrity** | for every `Content=Alias` cell, nested pill text === cell `Label text` | defect 2 |
| **Row order** | rendered order matches the rule you actually applied — `orderRows` for variables, the **styles array** for styles | defects 3 and 11; check block order *and* row order |
| **Library order** | for style pages, rendered sequence === `getLocal*StylesAsync` sequence, position by position | defect 11 |
| **Column mapping** | each column's values match the field implied by its **header label** | defect 10 |
| **Alias coverage** | count of `boundVariables` entries === count of `Content=Alias` cells | defect 4 |
| **Header labels** | mode columns equal `collection.modes[i].name`; first column matches the file's existing pages | leftover `Light`/`Dark`; but see F5 |
| **Placeholders** | `effVisible`-filtered, `inTitle`-excluded scan for `Subcomponent`, `Heading`, `Subheading`, `Label`, `Title` | F3, F4 and F5 |
| **Widths** | component default, except measured offenders stepped up the ladder | F1 — exclude sample tables; F7 — measure in a later call |
| **Colour format** | every raw COLOR literal matches the format chosen at Step 0.2 | defect 8 — hex-shaped labels in an OKLCH run must all be in `oklchMisses` **or** `alphaSchemaVars`; authored `rgb(...)` labels are chromatic alpha, not misses |

A clean run on a six-page library looks like: 0 structural issues, 0 pill mismatches across every alias cell, 0 row-order deviations, 0 visible placeholders, 0 strays.

### Verify over every row, not a sample

Returning `rows.slice(0, 4)` to keep the output readable is how a misplaced seventh row gets reported as clean. Ordering defects cluster in the middle and at the end of a ramp — the annotated step, the boundary between two prefix groups — precisely where a head-of-list sample cannot see.

Return **aggregates over the full set**, not excerpts: a deviation *count* against the recomputed order, a mismatch count, a distinct-binding count compared with the row count. Those stay small however many rows there are. Where only a sample is genuinely possible, report the check as partial — an honest "verified 4 of 24 rows" is useful; a "clean" resting on 4 of 24 is worse than no check at all, because it retires the suspicion.

Screenshots are for layout, spacing and overflow only. They cannot show a wrong binding, and they will not show an unset label that happens to read as a plausible word.

---

## Loud failures

These throw. Fix the cause; do not catch and continue.

| Error | Cause | Fix |
|---|---|---|
| `unloaded font "X Y"` on `appendChild` | fonts not preloaded in this call | preload at the top of **every** generating call; clean up the partial frame before retrying |
| `Removing this node is not allowed` | container is a plain FRAME inside an instance, not a SLOT | the doc library component needs its `Content slot` converting to a SLOT — report, do not work around |
| `Cannot move node. New parent is an instance or is inside of an instance` | same as above, on `appendChild` | as above |
| `in appendChild: ... layoutSizingHorizontal` | `FILL` set before the node was appended | append first, then set sizing |
| Call times out at 30s | too much work in one call | one frame per call; split large frames by table subset; cache live variable lookups |
| `importComponentByKeyAsync` / `importStyleByKeyAsync` times out on a component **never imported into this file before** | the first fetch pulls the asset across from the library; a large table component can exceed the call budget on its own | **Retry once.** The failed attempt warms the cache and the second call returns immediately. Warm every component the page needs in one cheap import-only call *before* the call that instantiates them. Only treat it as genuinely missing if a retry also fails |

**Warm imports before you need them.** A generating call that also performs a first-time import is two risks in one budget, and the import is the unpredictable half. Observed live: three consecutive calls died on the first fetch of a single table component; an import-only call, then a retry, then the probe — all fine. Components already imported in an earlier call cost nothing to re-import, so warming is cheap and idempotent.

### The `Table - Text sample` case

If its `Content slot` is a FRAME rather than a SLOT, the table is **hard-locked at exactly three samples**: `appendChild` and `remove` both throw, and only `visible` is mutable.

Do not work around it by splitting a category across multiple tables — that invents structure the type scale does not have. Report it and ask for the component to be changed, since editing a published doc library is the user's call. Once it is a SLOT, `adjustRowCount` grows and shrinks it normally.

### 21. A ruled deviation from source reverted by the next refill

**Symptom:** a page the maintainer signed off comes back subtly wrong after an unrelated regeneration, with nothing in the report mentioning it.

**Cause:** the maintainer ruled that a cell should deliberately differ from what the source holds — a Value column reading `mobile ≤ 768` where the variable stores `768`, because the numbers are band boundaries and the bare figure reads as a device width. The decision was recorded in the rulings log, which describes *what was decided*, and not in the per-skill configuration, which is what a future run actually reads. The generator regenerated the literal, correctly by its own lights.

**Detection:** before refilling any page, diff the existing cell values against what a fresh generation would produce. Differences are either drift to fix or a standing exception to preserve — and you cannot tell which from the file alone, which is the point.

**Fix:** record every ruled deviation in the project's per-skill configuration, phrased as an instruction to a future run ("the Breakpoints table's Value cells carry ranges; re-apply after filling"), and name it in the run report so the maintainer can see it survived. toolkit-standard §D 19.

### 22. A slot filled against its rendered shape

**Symptom:** a heading renders as a run-on sentence at display size, or a description appears inline where a short label was expected.

**Cause:** the property name described the author's intent rather than the layout. One doc library's `Section header` carries a `Subtitle` boolean; "subtitle" turns out to mean an inline breadcrumb prefix at the same 48px as the heading — `Subheading / Heading`, rendering as `Components / Control` — not a description line beneath it. Prose written into it becomes part of the title.

**Detection:** instantiate the variant during the Step 1.2 probe and read the child text nodes' `y` and `fontSize`. Same `y` and same size as the heading means inline; a lower `y` at a smaller size means a genuine secondary line.

**Fix:** probe how a part renders before deciding what belongs in it, and when the shape cannot carry the content, say so and offer the alternatives rather than filling it anyway.
