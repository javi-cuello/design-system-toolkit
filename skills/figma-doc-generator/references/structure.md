# Planning the structure

Step 3 in full: how pages, frames, tables, columns and rows are derived from the source. All structure is derived; never hardcode a name. [SKILL.md](../SKILL.md) gives the step's action.

## Contents

- [Pages](#pages)
- [The parent-tier test for text styles](#the-parent-tier-test-for-text-styles)
- [Frames: strip the shared namespace first](#frames-strip-the-shared-namespace-first)
- [Frame names and order](#frame-names-and-order)
- [Tables per frame](#tables-per-frame)
- [Table component](#table-component)
- [Columns: by header label, never by index](#columns-by-header-label-never-by-index)
- [Row order](#row-order)

## Pages

Make one page per variable collection, named for the collection. Add `Shadows` if there are effect styles. **Text styles get one page or several, decided by structure, never by count** (the parent-tier test below).

**The page set is part of the idempotent identity**. A previous run may have left a combined `Text styles` page where the structure now yields split pages, or the reverse. Remove the stale layout rather than leaving both to drift.

**Replace a page in place**. Create the new page before removing the old one. If the old one was current, make the new one current first, because removing the current page throws. Then put it back at the old page's index. `createPage()` appends, so a refill would otherwise walk the page out of its group (D37).

## The parent-tier test for text styles

Read text style names as paths. A top-level segment is a *parent* only when every style beneath it has **three or more** segments (`Web platform/Headline/lg`: parent, group, style). A parent is a tier that encloses groups, like `Web platform/…` and `Mobile app/…` in a platform-organised library. The library has a parent tier only when **every** style clears that bar.

| Structure | Pages |
|---|---|
| **No parent tier**: any style at one or two segments (`Headline/lg-normal`) | One page, `Text styles` |
| **One shared parent** over every style | One page, `Text styles - {parent}` |
| **Two or more sibling parents** | One page per parent, each `Text styles - {parent}` |
| **Nested shared tiers** (`Brand/Web/Headline/lg` throughout) | Strip shared parents, then apply the sibling test |
| **Mixed**: some styles under parents, some not | Do **not** split: one `Text styles` page |

**No parent tier**. The top-level segments are ordinary groups: they become tables and frames, never pages. This is the guard, and depth decides it, not the number of top-level segments. A two-segment library with eight groups makes one page, never a page per `Headline`, `Body` or `Caption`.

**One shared parent**. The parent moves into the page name, then is stripped for structure within the page. It is the same shape as the variables' namespace strip, except the segment is *kept*, in the page title.

**Sibling parents**. Each page holds only its parent's styles, with the parent segment stripped (`Text styles - Web platform`, `Text styles - Mobile app`). Page order follows the styles array: library order, not alphabetical.

**Depth qualifies a parent; it does not confirm it**. `Heading/Display/lg` throughout a library clears the bar with `Heading` and `Body` on top. Yet those are ordinary groups with subgroups, not parents. Confirm before splitting:

- If every candidate reads as a platform, split without asking. `platformish` ([helpers.md](helpers.md) § *Formatting*) knows `Web platform`, `Mobile app`, `iOS`, `Print` and the like.
- If any candidate is unrecognised, ask one question, and default to one page if the user waves it through. *"Your text styles all sit under {A, B}. Separate pages per tier (`Text styles - A`, `Text styles - B`), or one page where these are the style groups?"*
- A wrong split multiplies pages; a wrong non-split costs one frame level. Never split unconfirmed.

**Nested shared tiers**. Strip shared parents repeatedly while every remaining name keeps three or more segments. Join the stripped segments into the page name (`Text styles - Brand - Web`). Then apply the sibling test to what remains.

**Mixed**. Use the per-platform frame layout ([recipes.md](recipes.md) § *Text styles page*). Report the mixed structure to the user instead of guessing which half wins.

## Frames: strip the shared namespace first

**First strip any first segment that every variable in the collection shares**. Consider `Colour/...` throughout a collection already called *Primitives - Colour*. A segment every name carries encodes no grouping. Taken literally, it collapses the whole page into one frame (defect 13). Derive the namespace; never assume it.

The function `DOCGEN.stripNamespace(names)` does it, and returns `{effs, strippedLast, stripped}`.

- `effs[i]` is the effective name for `names[i]`.
- `strippedLast` is the innermost segment removed.
- `generate()` calls it; call it yourself only for a page you build outside the recipes.

- **It strips repeatedly**, because a namespace can be more than one segment deep (`Colour/Palette/...` throughout). A single pass leaves the page as collapsed as before.
- **It stops** when more than one distinct first segment remains (real grouping). It also stops when another strip would leave a name with no segment at all.
- Stopping at one remaining segment is deliberate: see the 1-segment row of the depth table below.

**Strip before the frame, table and row split, and run the depth table on the effective name**. The strip changes every name's depth, which is the point.

For example, `Colour/Utilities/white` has 3 segments and yields a table per utility colour. But `Utilities/white` has 2 and yields one `Utilities` table, which then correctly hides its redundant `_Title`.

**This is not the label rule**. The label rule drops a leading segment the frame already states, to shorten *alias label text* ([generation.md](generation.md) § *The alias rule*). This rule runs earlier and decides what the frame groups are at all. On a collapsed page the label rule cannot help, because the collapse happens before any label exists.

## Frame names and order

The first path segment of the effective name is the frame group.

- One frame: its name is the bare group name.
- Several frames: `"{n} - {GroupName}"`, 1-based, **alphabetical**.

After creating all frames, fix the layer order so frame 1 sits at the top of the layers panel:

```js
for (var i = frames.length - 1; i >= 0; i--) page.appendChild(frames[i]);
```

**Section header variant**. A single-part frame name takes `Subtitle=False`. A two-part name, split on `" / "`, takes `Subtitle=True`: the heading is the right part, the subheading the left. The component renders the `/` separator itself, so **never include the slash in either string**.

## Tables per frame

The second path segment is the table heading, sorted **alphabetically** within the frame.

| Path depth | Table heading | Row name |
|---|---|---|
| 1 segment (`white`, made only by the strip above) | Group name | The segment (`white`) |
| 2 segments (`Spacing/8`) | First segment (`Spacing`) | Second (`8`) |
| 3+ segments (`Font/Size/24`) | Second segment (`Size`) | Remainder joined (`24`) |

**The 1-segment case is real**. A `Colour/white` beside `Colour/Grey/1…` strips to `white` beside the grey ramp. A stranded segment has no group of its own.

Group it under `strippedLast`, falling back to the collection name, with the table named as the group. The redundant-title rule then hides its heading. Unhandled, this case writes `undefined` into the Name cell.

**Hide the `_Title` instance only when the table name equals the frame group name**, compared in lower case. Always show it otherwise.

## Table component

| Content | Component | Variant |
|---|---|---|
| `COLOR` | `Table - Colour` | `Alias=True` if any value in the table is an alias, else `Alias=False` |
| `FLOAT` / `STRING` | `Table - Global` | the same rule |
| Effect styles | `Table - Effects` | none |
| Text style values | `Table - Text values` | none |
| Text style samples | `Table - Text sample` | none |

The axis is **`Alias`**, not `Variable`, and it exists on the table *and* on the row. Set it on the table **before** cloning rows, so the clones inherit the right variant.

## Columns: by header label, never by index

The header row's `Content slot` is a SLOT, so the column count is fully dynamic: `Name` plus one per mode. Mode labels come from `collection.modes[i].name`. Run `setColumnCount` whenever there are not exactly two modes, **in both directions**. Shrinking to 2 for a single-mode collection matters as much as growing to 4 for three modes.

The shipped template misleads in two ways:

- **The first header cell is not always `Name`**. `Table - Colour` ships `Label`; generated variable and text pages use `Name`; the generated Shadows page uses `Type`. Match what the file's existing generated pages use, and check one before writing.
- **Fixed-column tables can gain a column between runs, in the middle**. `Table - Text values` went from 5 columns to 6, with `Letter spacing` inserted *before* `Line-height`. Writing by index silently swaps two columns of plausible percentages. Build a label-to-field map and write by it. Report any label you do not recognise rather than guessing ([helpers.md](helpers.md) § *Column mapping*).

**A single-mode collection often keeps Figma's default mode name, `Mode 1`**. It then becomes the column header. It is the source truth, but reads as a defect in published docs. Surface it and let the user choose: the literal name, a caption like `Value`, or renaming the mode.

## Row order

**Name sort is the default, not the whole answer**. `smartSort` has three cases, and all three are needed. The middle one gets dropped, and in review its absence is not obvious.

1. All row names parse as numbers: ascending.
2. **Pure numbers mixed with prefixed names** (`1`…`12` beside `Alphas/1`…`Alphas/12`): pure numbers first, ascending, then prefix groups by prefix, then number.
3. Non-numeric bases (`black`, `white`) mixed with numeric steps: bases first, then numbers ascending.

Without case 2, `Alphas/1` is compared on its last segment and ties with the solid `1`. The two ramps then **interleave into one zipped table**, which looks deliberate.

**Name sort is wrong for t-shirt scales**. On FLOAT and STRING globals the resolved value can be ordered, and it is better data. Name sort puts `full` (999) first and `none` (0) third on a border-radius table. Use `orderRows` ([helpers.md](helpers.md) § *Sorting*). It keeps all three cases and adds sort by value and sort by font-weight rank ahead of case 3.

**Effect styles and text styles keep the library's own order, unsorted**. `getLocalEffectStylesAsync` and `getLocalTextStylesAsync` return the style-panel order. That is the order the designer maintains (`Raised, Floating, Overlay, Modal`; `Headline, Title, Body, Label`). Sorting alphabetically destroys it. Take the frame-group order, the table order and the row order from that array.

**Ordering is what users notice and correct first**. When a library has a meaningful order, follow it. When it has none, say which rule you applied.

**Reordering blocks is not reordering rows**. A user may say they reordered something to match the library. Then check both levels: the table blocks on the page *and* the rows in each table. A user once fixed the block order by hand while all 8 tables still had their rows inverted (`lg-medium` before `lg-normal`). That is invisible unless you compare it explicitly.
