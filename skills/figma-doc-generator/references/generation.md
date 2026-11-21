# Generating and refilling

Step 4 and refills in full. This covers the scripts' entry points, the alias rule, table widths, the call budget and housekeeping. [SKILL.md](../SKILL.md) gives the step's action.

## Contents

- [generate(): variable pages](#generate-variable-pages)
- [Shadows and text styles, from the snapshot](#shadows-and-text-styles-from-the-snapshot)
- [The alias rule](#the-alias-rule)
- [Table width](#table-width)
- [Frame normalisation](#frame-normalisation)
- [Performance](#performance)
- [Slot row counts](#slot-row-counts)
- [Housekeeping](#housekeeping)
- [Incremental update](#incremental-update)

## generate(): variable pages

`generate()` builds the page, frames, section headers, tables, header row, row counts and Name column. It also writes **every value cell**:

- literal or alias, with the swatch bound
- every collection the alias passes through pinned to the column's mode by name
- an extension in its parent's place

**It works whether the collection is local to the target or consumed from a library**. It resolves the collection through `sourceIndex()`, so a source and target in different files need nothing extra.

**Pass the library name**. Collection names are not unique across libraries. `sourceIndex` refuses to guess when two enabled libraries expose the same one, and throws naming both.

**On a large collection `sourceIndex` may return `partial`: call it again until it does not**. Progress is cached per (library, collection) in plugin data, so each pass resumes. Then hand the result to `generate` as `opts.index`.

**The cache lasts an hour, and a cached variable whose name no longer matches the library is imported again**. After a library publish, importing a key returns a new id. The cached id still resolves to the pre-publish copy. A page built from an old cache would show the old names and values, and nothing on it would say so.

**An unpublished tier throws a named error** telling you to generate in the source file instead, rather than producing an empty page.

## Shadows and text styles, from the snapshot

```sh
# from the project's stored snapshot, the one reader of the file (take a new
# snapshot first; one older than plugin 0.27.0 is refused)
node scripts/docgen.js --styles <snapshot tokens.json>   # → { textStyles, effectStyles }
```

```js
// in the TARGET, with that JSON as STYLES; bindings are variable NAMES,
// because ids are file-local, and styleIndexByName resolves them here
const fx = STYLES.effectStyles, tx = STYLES.textStyles
const vidx = await styleIndexByName()
await generateShadows('Shadows', shSet, teComp, peComp, fx, vidx, fmt)
await generateTextStyles(tx, plan, shSet, tvComp, tsComp, webByGroup, vidx,
                        { letterSpacingUnit: "rem", rootSize: 16 })   // opts: omit for em
```

**The snapshot is the only input for these two pages**. A live reader of styles, beside the snapshot plugin and the token export, was a third reader of one fact. The three disagreed on line-height rounding and on which bindings they carried. The accepted cost: a file with no snapshot cannot have these two pages generated.

**Both take frame, table and row order from the styles array, and never sort it**. The shadows recipe builds its preview strip from the same array as its tables, so the two cannot drift.

**`generateTextStyles`** returns one page per parent tier, applies the per-group unit decision, and never converts an alias cell. It imports each text style **in the same call that applies it**, because a style id does not survive a plugin restart.

**Its last argument is the web letter-spacing unit**, a project ruling rather than a fact about the styles. Omit it for `em`. Pass `{ letterSpacingUnit: "rem", rootSize: 16 }` where the project documents rem. This is not a suffix swap: Figma's percent is relative to the *font* size and rem to the *root*. So the value is computed from each style's own `fontSize` ([colour-and-units.md](colour-and-units.md) § *rem letter-spacing depends on size*).

What stays yours after that: the width ladder (a separate call, by the reflow rule), and the items under *What stays yours* in SKILL.md.

## The alias rule

**A displayed value backed by a variable is a `Content=Alias` cell, not `Content=Text`**. It applies everywhere, not just on semantic colour tables:

| Surface | Fields that are typically bound |
|---|---|
| Semantic or brand colour | the token value itself |
| Shadows | offsetX, offsetY, radius, spread and color: often **all five** |
| Text styles | font family, style and size; `lineHeight` often **not** bound |

Check `boundVariables` per field and decide per cell. A bound field written as a literal number hides that the library is tokenised, which is the whole point of the page.

**The swatch shows for COLOR aliases only**. Hide it for FLOAT and STRING.

**Shorten a label where the column header already says what it is**. Under X, Y, Blur, Spread, Size, Weight or Family, show the **last path segment**. So `Effects/Shadow/Position/0` shows 0, and `Font/Weight/Semi Bold` shows Semi Bold.

Take the segment as a string, never as a number, or negative offsets like `-1` break. Keep the **full path** in colour columns, where `medium` alone loses that it is a shadow colour.

**Drop a leading segment the enclosing frame already states**. On a semantic page's `Colour` frame, every alias reads `Colour/Brand/<ramp>/4`. The leading `Colour/` is noise, and it pushes those tables past their default width. Render `Brand/<ramp>/4`.

- Strip only when **every** label in the table shares that head segment *and* it matches the frame group name. That keeps the rule derived, not a hardcoded blocklist (`redundantPrefix` and `stripPrefix`).
- It does not fire on the Shadows page. There a `Colour/Shadow/Cast/soft` alias sits in a frame called `Elevation`, and nothing else states the category.
- Never strip down to a bare leaf: `4` alone is meaningless.
- Keep the full path in the underlying `Label text` only if you keep the pill in step too. The pill is what renders.

**Writing an alias cell means writing the pill too: use `setAliasCell`, which does both**. On `Cell - Default`, its `Label text` drives the text node of the `Content=Text` variant.

Under `Content=Alias` the visible string comes from the nested **`Pill` instance's own `Label text`**. It keeps its `Label` placeholder until set. The call `setAliasCell(cell, label, isColor)` sets the variant, the cell text, **the pill** and the swatch boolean together.

**This case proves the "use the scripts" rule**. 367 alias cells across two semantic pages once rendered the word `Label`. The skill was not missing anything: the run wrote its own cell logic instead of prepending `figma-helpers.js`. The hand-written version set the cell property, not the pill.

It passed verification because the check re-read the property it had just written (governing lesson 2). The tell: only the alias-bearing pages look empty, while pages of `Content=Text` cells are fine.

## Table width

**Instantiate the table and leave its width alone**. The component default is the baseline, and it is **per component**, not per library. Measured in the reference library:

| Component | Ships at |
|---|---|
| `Table - Colour`, `Table - Global`, `Table - Text sample` | 720 |
| `Table - Effects` | 860 |
| `Table - Text values` | 996 |

**Widen only a table whose cell text wraps or is clipped**, up the ladder: component default, then **860**, **996**, **1024**. Stop at the first rung that fits. Do not skip rungs, and do not invent a width off the ladder.

- Every table across the reference file's six generated pages measures 720, 860 or 996. **1024 has never been seen in use**: it is the last resort, not a working rung.
- Confirm the rungs against the doc library's own table sizes rather than assuming; a different library has different ones. Mention it to the user only if the two disagree.
- If the top rung still does not fit, leave the table there and report it.

**Under OKLCH most colour tables measure over and land at 860**, because the labels are about three times as wide as hex. That is the rule working; do not special-case it. Stripping a redundant frame prefix (the alias rule) often removes the need to widen, so apply it first and measure after.

**Figma has no "is truncated" flag, so measure rather than guess**. Cell text nodes are set up two ways, and each needs its own detector:

| Cell text `textAutoResize` | Behaviour | Detector |
|---|---|---|
| `HEIGHT` (fixed width, as in Name cells) | **wraps** to a second line | `wrapsOrClips`: height over 1.5 line heights |
| `WIDTH_AND_HEIGHT` | never wraps; **overflows** the cell | `wrapsOrClips`: a descendant's right edge past the cell's |
| An alias pill, hugging its label | fits its own text, clipped by the cell | `clipsCell`: the text's box past the cell's (`DOCGEN.boxOverflow`) |

**Run both functions on every value cell**. A pill hugs its label, so `wrapsOrClips` sees it as fitting while the cell clips it. A page once passed the first two detectors at 720 and showed 29 tables of clipped pills. At the top rung some still ran 39px over, which only a shorter label fixes ([helpers.md](helpers.md) § *Width measurement*).

**Sample tables never count as wrapping**. `Table - Text sample` renders specimen text meant to run to several lines. The wrap detector would flag every one, widen them all, and the wrap would stay. Exclude it from the wrap check entirely (F1).

**Measure in a different call from the one that resized**. `resize()` does not reflow auto-layout at once, so descendants report the old geometry. A table that now fits reports as still clipping. That once produced a false "cannot be fixed at 860" report for two tables that needed nothing (F7).

**On a page with many tables, use the batched form: three calls for the page**.

1. Measure every table, and estimate each one's rung from its worst shortfall.
2. Resize every table.
3. Verify every table. Any table the estimate under-shot walks the remaining rungs from there, one per call.

## Frame normalisation

**After the ladder settles, every table in a frame takes the width of the widest**. The ladder decides each table alone, which is right for *what fits* and wrong as a final answer. One 996 table beside five 720s reads as a broken layout, and it is the first thing a user sends back (defect 20). The frame is the visual unit.

Call `normaliseFrameWidths(frame)` once per frame. It takes the frame's `Table…` instances and widens each to the widest through `DOCGEN.normaliseWidths`. It returns `{target, resized}`, or `null` when the frame holds fewer than two tables.

Three things it must not do:

- **Never normalise down**. Shrinking a table to match its neighbours brings back the clipping the ladder fixed.
- **Never normalise across frames**. A `Values` frame at 996 beside a `Samples` frame at 720 is correct: they are different visual units.
- **Run it after the ladder, never instead of it**. Normalising first would widen everything to the worst case before knowing what needed it. Measure in a later call, as always.

## Performance

The 30 s timeout is the main limit on how calls are shaped. Measured in a real run:

| Work | Result |
|---|---|
| 39-row × 3-mode colour table, 78 swatch bindings | fits comfortably in one call |
| about 60 rows × 3 cells with binding | near the ceiling: split it |
| 5 component imports + 5 instantiations + probes | **timed out** |
| probing 2 components per call | fine |

- **One frame per `figma_execute`**. Split a large frame by table subset across calls. Make each call idempotent, dropping any table with the same `_Title` text before appending, so a timeout is always safe to retry.
- **Fetch variables in bulk once**, with `getLocalVariablesAsync()` and `getLocalVariableCollectionsAsync()`, and index them into sync maps. Never loop `getVariableByIdAsync`. This removes every `await` from the per-cell loop ([helpers.md](helpers.md) § *Live objects*).
- **Never combine more than 15 style or variable imports with canvas generation** in one call.
- **`figma_execute` accepts modern JavaScript** ([helpers.md](helpers.md)). The shipped scripts happen to be ES5; nothing requires it.
- **Prefer rebuilding a frame to appending to one**. A timeout that leaves a half-built frame can be recovered. A timeout partway through *appending* tables cannot, unless the call rebuilds deterministically.
- **Background work advances only while a call is open**. An `(async () => {…})()` left running after a call returns makes no progress until the next call. Run a long pass, such as measuring 64 tables, as chunks of about 20 s that resume from a queue kept on `globalThis`.
- **A call that times out at 30 s keeps running** and slows the next ones. Wait, then read the state before running it again.

## Slot row counts

**One structural change per instance per call**. Changing a table's row count is rationed: a `remove()` or `appendChild(clone())` on its rows slot. A given instance accepts about one such change per call. After that, every handle inside it is dead for the rest of the call, and not just for writing.

A `remove()`, a read of `visible`, and even `findOne` throw `The node (instance sublayer or table cell) with id … does not exist`.

Nothing clears it within the call: not resolving again from the table, not `getNodeByIdAsync`, not `figma_reconnect`. One removal was retried 62 times. Four properties make it workable, each established by testing:

- **It is per instance, not global**. Sixteen different tables each took one change in a single call, cleanly. So batch *across* instances: one row per table per pass, repeated.
- **It is a cooldown, not a lock**. Capacity returns after an unrelated call or two. An immediate retry looks permanent and is not, which makes it easy to mistake for a dead component.
- **Additions outlive removals**. `clone()` plus `appendChild` keeps working long after `remove()` has stopped. So **grow first, shrink second**, and expect the shrink to need more passes.
- **The best fix is fewer changes**. Trim the *prototype* row's cells to the target column count **before** cloning it. Every clone is then born right, and the write loop changes nothing. That one reordering carried a 61-row page that had failed twice.

**Over a long session the whole bridge degrades past this**, until reads crash too. That is the signal to stop and restart the Desktop Bridge plugin rather than keep grinding. Cache the build plan in `figma.root` plugin data, so the restart resumes instead of rebuilding.

## Housekeeping

`createInstance()` places the node on the **current page**. Every structural probe leaks an instance unless you `remove()` it. A leaked `Text sample` on a colour page shows up later as a mystery placeholder (defect 7). On any failure partway through a call, delete the partial frame before retrying.

## Incremental update

**A refill keeps frames and section headers, and refills slots in place**. Slot names vary, so accept all three:

| Table | Slot |
|---|---|
| Typed tables | `Rows slot` |
| The generic `Table` | `Row slot` |
| `Table - Text sample` | `Content slot` |

The heading lives in the `_Title` instance's `Title text` property, not on a node named `Heading`. Match tables by heading, call `adjustRowCount`, then refill with the same cell logic as a full build.

**The colour format is part of "the same cell logic"**. Check what the existing tables use, and match it unless the user asks to switch. A refill that flips the format rewrites every value on the page, while reporting only the rows that changed.

**The text-style units behave the same way, and are easier to flip by accident**. Run Step 2.1's detection again, but let the *existing page* win where the two disagree. A group the user called "web" last time may still read `Mobile app`; detection alone would silently revert `1.5` to `150%`.

Read one Line-height cell per frame group. A value ending in `%` means as authored; a bare number means converted. Ask again only if the user renamed or added a group, or asked to switch.

**A ruled deviation from the source goes into the configuration, not only the rulings log**. Say the user rules that a Value column carries ranges (`mobile ≤ 768`) where the variable stores a bare number. The generator's default writes the literal back and silently reverts it. That looks like ordinary output and reports nothing, the very failure this skill exists to prevent.

Record it as a standing exception in the project's per-skill configuration, phrased as an instruction ("apply again after filling"). Name it in the run report (toolkit-standard §D 19, defect 21).

**Probe again before refilling**. "I reset the tables" usually means the component changed too. Once that one sentence meant a new column mid-table and a new default width. A row container had turned from SLOT to FRAME, and every `_Title` was back to its placeholder. None of it was mentioned, and all of it would have corrupted an index-based refill.

So probe first, every time.

**When a reset wiped the titles, rebuild the frame instead of refilling it**. Refilling matches tables by heading. If every heading now reads `Title`, assigning by position is a guess. A wrong guess mislabels tables in a way that then verifies as "correct", because you assigned both sides. Rebuild from the source order, and say that you did.

**Check row order as well as block order** after a user reorders anything by hand. The two are independent, and fixing one does not fix the other.
