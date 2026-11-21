# Page recipes

One section per page type. Each assumes the three scripts are prepended to the call ([helpers.md](helpers.md)) and the fonts are loaded. Every recipe is a function in `scripts/recipes.js`, so these sections are reasoning, not code to copy.

## Contents

- [Frame boilerplate](#frame-boilerplate)
- [Generation skeleton](#generation-skeleton)
- [Colour pages (primitive and semantic or brand)](#colour-pages-primitive-and-semantic-or-brand)
- [Global pages (FLOAT and STRING)](#global-pages-float-and-string)
- [Shadows page](#shadows-page)
- [Text styles page](#text-styles-page)

## Frame boilerplate

Every page type uses `docFrame(page, name, x)` in `scripts/figma-helpers.js`, the only copy. It creates a vertical auto-layout frame and places it at `(x, 0)` on the page:

| Property | Value |
|---|---|
| Spacing | 64 |
| Padding | 160 all round |
| Sizing | hug on both axes |
| Corner | radius 40, smoothing 0.6 |
| Fill | white |

The next frame's `x` is this one's `x + width + 160`.

**Do not set the table's `layoutSizingHorizontal`**. Leave the component default width alone ([generation.md](generation.md) § *Table width*).

## Generation skeleton

**`generate(collName, pageName, fmt, shSet, tblSet, firstColLabel)`** is the outer wiring, and it also fills every value cell through `fillValueCell()`. Run against a two-mode colour collection, it rebuilt a known-good page exactly: 0 structural and 0 value differences across 206 cells. Everything in it is derived; the only literals are the two component keys and the format.

**Pass `firstColLabel` as the label the file's existing generated pages use**. The shipped template differs: `Table - Colour` ships `Label`, while generated pages use `Name`.

Two things it deliberately does **not** do:

- **It never sets a table width**. The width ladder runs afterwards, in its own call, because `resize()` does not reflow at once.
- **It never sorts styles**. `orderRows` is for variables; effect and text styles keep the library's own array order.

**Near the 30 s budget, run it per frame group**. It builds a whole page in one call, which fits a small collection. For a large one, add a group filter, and move the idempotent replace down a level with it. Remove and rebuild the one frame with the same name, never the page.

**One skeleton serves primitive and semantic pages**. The Alias variant is chosen per table by scanning its rows. The semantic recipe adds only the per-cell alias logic.

## Colour pages (primitive and semantic or brand)

**`fillValueCell()` is this recipe**, and `generate()` calls it for every cell. One piece of code handles both cases:

- **A `COLOR` literal** gets `Content=Text`, with its swatch bound to the row's own variable. `DOCGEN.colourLabel` formats the value in the chosen format.
- **A `VARIABLE_ALIAS`** gets `setAliasCell`, which sets `Content`, the cell text, **the nested pill** and the swatch boolean together. Its swatch is then bound to the alias *target*. That collection's mode is pinned **by name**, so a Light column shows the primitive's Light value, not its first mode.

The table variant is chosen before rows are cloned, so `Alias=True` reaches every row. Primitive collections come out all plain on their own.

**These pages were once prose snippets, typed again on every run**. That is how a run shipped 367 alias cells rendering `Label`. The hand-typed version set the cell property and not the pill. Now `tests/test-recipes.js` pins both paths.

What still needs your judgement, because no script settles it:

**`colourLabel` reads OKLCH from the variable's `description`**, so it is passed the variable, not just the value. Under an OKLCH run, expect these tables to measure over the default width and land at 860. The labels are about three times as long as hex.

**One description field can hold several values**. A variable with distinct Light and Dark values still has one description. Three shapes occur:

- **One value**. It can describe only one mode. Check which before trusting it across every column. If it matches only one, that is the user's call, not something to paper over.
- **One section per mode, under a `Light:` or `Dark:` heading**. This is the preferred shape, and what current generator output writes.
- **One value per mode, tagged inline** (`· light`, `· dark`). OKLCH scale-generator tooling writes this. The mode name is passed per column for exactly this case. A first-match reader would fill the Dark column with the Light value: full, well-formed, and silently wrong (defect 14).

**Alias targets in an unpublished tier still resolve**. A key import fails for a hidden primitive, but `getVariableByIdAsync` on the alias id does not. `resolveAlias()` uses that, the only route in. A collection that publishes no variables cannot be documented *as a page* from a consuming file. `sourceIndex` throws a named error saying so.

## Global pages (FLOAT and STRING)

These use `Table - Global`. There is usually a single mode, so call `setColumnCount(row, 2)`: **shrinking** from the shipped 3.

**The mode is often still called `Mode 1`**, Figma's default, which then becomes the value-column header. That is the source truth, and it reads as a bug in published docs. Surface it, and let the user choose: the literal name, a caption like `Value`, or renaming the mode in the collection. A caption is the one thing on the page not derived from the source. Say that a later run without the same instruction will revert it.

**No swatches**: `setSwatchBool(cell, false)` throughout. Aliases still occur (one global token pointing at another). Apply the alias rule with `isColor = false`, so the swatch stays hidden.

Round floats with `DOCGEN.num()`, and use `String(val)` for strings.

**Use `orderRows`, not `smartSort`**. These are the tables where name sort fails. T-shirt scales (`none, sm, lg, xl, 2xl, full`) sort by resolved value, and weight names (`normal, medium, semibold`) by weight rank. Numeric-named ramps like Spacing/0…18 and Shadow/Spread/-12…1 still sort by name ([structure.md](structure.md) § *Row order*).

### Type metrics that are not variables (Step 2.2, opt-in)

These are extra tables on the globals page whose rows come from the source's **text styles**, not the collection. They hold the line-height and letter-spacing values the styles hard-code. Build them only when asked; the two unit questions and the `rem` trap are in [colour-and-units.md](colour-and-units.md) § *Step 2.2*.

**Build them into the frame group that holds the type tokens** (`Family`, `Size`, `Weight`), at their alphabetical place among those tables. Rows sort by resolved value, ascending, so negative tracking leads.

**`generateMetricTables(frame, tblVariant, styles, opts)` builds them**. Its arguments:

| Argument | Value |
|---|---|
| `tblVariant` | the plain (`Alias=False`) `Table - Global` variant |
| `styles` | the snapshot's text styles |
| `opts.lineHeightUnit` | `"unitless"` or `"authored"` |
| `opts.letterSpacingUnit` | `"em"`, `"rem"` or `"authored"` |
| `opts.rootSize`, `opts.badgeText` | the root size for rem, and the badge phrase |

- It refuses a missing unit, and refuses `rem` without `rootSize`, rather than defaulting either.
- Line-height rows are keyed by value. Letter-spacing rows are keyed by (value, size) under `rem`. Both go through `DOCGEN.metricRows`, which skips bound fields.
- Each table goes through `setupTableBadged`, gets a `Name | Value` header, and is inserted at its alphabetical place. A rerun replaces its own tables.
- It returns `{table, rows, badged}` per table. A `badged: false` means the doc library's `_Title` lacks the badge properties: say so in the report.

Three things to get right, each with a matching failure entry:

- **Badge it**, with `setupTableBadged`, not `setupTable`. An unbadged table claims a token that does not exist.
- **Leave these rows out of the coverage check**. They map to no variable, so a check that every row resolves to a source variable reports them as strays. Count them apart, and say so (F11).
- **Under `rem`, keep the size in the row name**. `metricRowName` does it. Dropping it merges two different rows that share a percentage (defect 19).

## Shadows page

### Grouping

Effect style name depth **varies between libraries**, so never hardcode `parts[1]` or `parts[2]`.

```js
// "Shadow/Base/Drop/very soft" -> group "Base / Drop", table "very soft", subtitle true
// "Drop/very soft"             -> group "Drop",        table "very soft", subtitle false
```

Make one frame per frame group, one `Table - Effects` per style, and one row per effect in that style. Composite styles have several effects.

**Take the frame-group order, the table order and the row order from the styles array; do not sort**. `Raised, Floating, Overlay, Modal` is an elevation ramp. Sorting it to `Floating, Modal, Overlay, Raised` destroys the only order that matters. The frame index is the group's position in that same array, plus one.

### Preview

Place one `Preview - Effects` per frame, straight after the section header, covering every style in that frame. Its `Content slot` is a SLOT of `Effect item`. Each item has an **ELLIPSE named `Swatch`** (not `Shape`) plus a TEXT property.

**The preview strip uses the same order as the tables in its frame**. The shadows recipe builds it **from the same entries array as the tables below it**. So the two orders cannot drift. They were once separate loops. A preview reading `Floating, Modal, Overlay, Raised` above tables reading `Raised, Floating, Overlay, Modal` looks like two unrelated bugs. `tests/test-recipes.js` asserts the two match, position by position.

**Verify preview labels against table titles, position by position**, on every run.

### Rows: six fixed columns

Cells live in a **FRAME named `Content`**, fixed at six: Type, X, Y, Blur, Spread, Colour. `setColumnCount` returns `null` here, as expected.

**`fillEffectRow()` is this recipe**. Per row it writes Type as text, never a variable. For each of offsetX, offsetY, radius, spread and color it applies the alias rule:

- A bound field becomes an alias cell. Numbers shorten to their last segment; **Colour keeps its full path**.
- An unbound field falls to the literal.
- A colour with no backing variable has no authored OKLCH, so it correctly stays hex whatever the format says.

`BACKGROUND_BLUR` binds only `radius`, with no offset, spread or colour. Those cells correctly fall to the literal path and render `-`.

## Text styles page

### Pages and frames

Step 3's parent-tier rule decides the **pages** first ([structure.md](structure.md) § *The parent-tier test*). Within a page:

| Page | Frames | Section header |
|---|---|---|
| **Page per parent**, including a single shared parent in the page name | `1 - Values`, `2 - Samples` | `Subtitle=True`, subheading the parent name |
| **Combined page over several platforms** (the mixed-structure fallback only) | a Values frame per platform, then a Samples frame per platform | `Subtitle=True`, subheading the platform |
| **No parent tier** | `1 - Values`, `2 - Samples` | `Subtitle=False` |

On a page per parent, the parent segment is already used by the page. The subtitle still carries the platform, because a reader linked straight into a frame cannot see the page name. The combined page's frames read:

```
1 - <P1> - Values, 2 - <P2> - Values, 3 - <P1> - Samples, 4 - <P2> - Samples
```

**Layer order**. A page's children list **bottom-up** in the layers panel, because the last child shows on top. So frames appended in build order (1 then 2) read as 2, 1. `generateTextStyles()` appends them again in reverse at the end. The panel then reads `1 - Values, 2 - Samples` from the top, and the children array ends up `[2, 1]`: correct, not backwards. Children *inside* an auto-layout frame are unaffected, since the panel follows flow order there.

**Table and row split, after the page and frame take their segments**. First strip the tier the page took (the parent) and the tier the frame took (the platform, on a combined page). Of what remains, the **first segment is the table, and the rest joined is the row**:

| Name as the table sees it | Table | Row |
|---|---|---|
| `Headline/lg` | `Headline` | `lg` |
| `Headline/Display/lg` | `Headline` | `Display/lg` |

This one rule covers every case above. On a split page `Mobile app/Headline/lg` arrives as `Headline/lg`; on a page with no parent, `Headline/lg-normal` arrives untouched. Read the depth; never assume a platform segment exists.

**Order pages, tables and rows by the styles array, not alphabetically** (Step 3). `Headline, Title, Body, Label` is the maintained order; `Body, Headline, Label, Title` is noise.

### Values table

This is `Table - Text values`, with rows of `Row - Text style values`. The cell container has shipped as both a SLOT `Content slot` and a fixed FRAME `Content`. Accept either; the difference matters only to change the column count.

**Columns are neither fixed nor positional**. One library shipped five columns, then six, with Letter spacing inserted in the middle. Resolve every column by header label ([helpers.md](helpers.md) § *Column mapping*):

| Header label | Source | Usual treatment |
|---|---|---|
| Name | row name | `Text` |
| Family | `boundVariables.fontFamily` | `Alias`, last segment (`sans`) |
| Size | `boundVariables.fontSize` | `Alias`, last segment (`5xl`) |
| Weight | `boundVariables.fontStyle` | `Alias`, last segment (`normal`) |
| Letter spacing | `letterSpacing`, usually **unbound** | `Text`, in the units below |
| Line-height | `lineHeight`, usually **unbound** | `Text`, in the units below |

Round both `lineHeight` and `letterSpacing`: raw float32 gives `110.00000238418579%`.

#### Units on the two type-metric columns

Their form is the **per-group** decision from Step 2.1. Route every literal through `DOCGEN.unitTextFor(field, value, style.fontSize, web)`, passing the decision for *this style's* group:

| Figma value | As authored (`web = false`) | Web or CSS (`web = true`) | Note |
|---|---|---|---|
| Line-height `150%` | `150%` | `1.5` | Exact: Figma's % is relative to font size, like the CSS ratio |
| Line-height `24px`, size 16 | `24px` | `1.5` | **Derived** from `fontSize`: collect and report these |
| Line-height `Auto` | `Auto` | `Auto` | Font-metric leading. `normal` differs across platforms: report it, and let the user pin a real value in the style |
| Letter spacing `2%` | `2%` | `0.02em` | Exact |
| Letter spacing `-0.32px`, size 16 | `-0.32px` | `-0.02em` | **Derived**: report |
| Letter spacing absent | `0%` | `0em` | |

Three things not to do:

- **Do not convert an alias cell**. A bound `lineHeight` renders as its token name (`Font/Line height/tight`) under the alias rule. There is no value to divide. `unitTextFor` is reached only on the literal path.
- **Do not convert on any variables page**. A `FLOAT` variable holding `150` has no unit: a ratio, a percentage and a pixel size look the same in the file. Step 2.1 covers text styles only.
- **Do not mix conventions within one frame group**. The decision is per group so that a `Web app` frame can be all CSS while a `Mobile app` frame is all as authored. One table holding `1.5` and `110%` is the bug this structure prevents.

#### Marking the converted tables

Converted values do not label themselves: `1.5` in a Line-height column could read as a stray percentage that lost its sign. Say so on the table:

- Probe `_Title` for a `Label` BOOLEAN and a `Label text` TEXT property. Since `setupTable` forces Label to false, it is free.
- On a converted Values table set `Label=True` and `Label text = "CSS units"`.
- If either property is missing, or `_Title` is hidden because the table name repeats the frame group, **skip the badge**. Never invent a text node for it. The report then carries the whole burden, so make it explicit there.
- **Renaming the header itself (`Line-height (unitless)`) is the user's call, not the generator's**. The label map accepts the qualified forms, listed one by one rather than prefix-matched. A prefix rule would map a future `Sizing` column onto font size and report nothing.
- So a hand-renamed header still maps on the next refill. But never rename it unprompted: the header is the doc library's contract, and rewriting it changes every file built from that component.

**The Size column documents the token** (`5xl`), not the pixel value; the resolved numbers live on the globals page. Say so in the report, because it is the first thing a reader asks.

**`fillTextValueRow()` applies the alias rule per cell** and routes every literal through `DOCGEN.unitTextFor`. So the three rules above are enforced, not remembered. If you ever read `boundVariables` yourself: a bound key ships as an object **or** a one-element array, and `snapshotTextStyles()` normalises both.

**The token name and the resolved font style can differ** (`Font/Weight/Semi Bold` against the font's `SemiBold`). The tables document the **token**; mention the difference to the user rather than silently normalising it.

### Samples table

This is `Table - Text sample`. Its `Content slot` **must be a SLOT**; if it is a plain FRAME, stop ([failures.md](failures.md) § *Loud failures*). Exclude this table from the wrap detector: its sample text is *meant* to run to several lines (F1).

**`generateTextStyles()` imports each text style in the same call that applies it**, a detail not obvious enough to leave to a caller. A style id cached from an earlier call comes back `Cannot find style` after a plugin restart. That failure reads as a missing style rather than a stale id.
