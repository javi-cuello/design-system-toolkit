# Page recipes

One recipe per page type. All assume the helper block from `helpers.md` is already pasted at the top of the call, and that fonts are loaded.

---

## Contents

- [Colour pages (primitive and semantic / brand)](#colour-pages-primitive-and-semantic--brand)
- [Global pages (FLOAT / STRING)](#global-pages-float--string)
- [Shadows page](#shadows-page)
- [Text styles page](#text-styles-page)

---

## Frame boilerplate

Identical for every page type: `docFrame(page, name, x)` in `scripts/figma-helpers.js`. It creates a vertical auto-layout frame with 64 spacing, 160 padding all round, hug sizing on both axes, a 40 corner radius at 0.6 smoothing and a white fill, places it at `(x, 0)` and appends it to the page. The next frame's `x` is this one's `x + width + 160`. All three recipes call it; it is the only copy.

Do **not** set the table's `layoutSizingHorizontal` — leave the component default width alone (see the width rule in SKILL.md).

---

## Generation skeleton

This is the outer wiring. Since 1.13.0 `generate()` also fills every value cell via `fillValueCell()`, and since 1.14.0 Shadows and Text styles are scripted too, so the sections below are reasoning, not something to copy. Verified: run against a two-mode colour collection it reproduces a known-good page exactly, 0 structural and 0 value differences across 206 cells.

Everything here is derived. The only literals are the two component keys and the format.

> `generate(collName, pageName, fmt, shSet, tblSet, firstColLabel)` — in `scripts/recipes.js`. Pass `firstColLabel` as whatever the file's **existing** generated pages use; the shipped template differs (`Table - Colour` ships `Label`, generated pages here use `Name`).

Two things this deliberately does **not** do. It never sets a table width — the width ladder runs afterwards, in its own call, because `resize()` does not reflow synchronously. And it never sorts styles: `orderRows` is for variables, while effect and text styles keep the library's own array order.

One seam to mind when lifting it: the skeleton builds a whole page in one call, which fits a small collection. Near the 30s budget, run it **per frame group** instead (add a group filter parameter), and move the idempotent replace down a level with it — remove and rebuild the one frame with the same name, never the page. The Alias variant is chosen per table by scanning its rows, so the same skeleton serves primitive and semantic pages; the semantic recipe below only adds the per-cell alias logic.

---

## Colour pages (primitive and semantic / brand)

**There is no snippet to copy any more — `fillValueCell()` in `scripts/recipes.js` is this recipe**, and `generate()` calls it for every cell. It handles both cases from the same code: a `COLOR` literal gets `Content=Text`, its swatch bound to the row's own variable and the value formatted by `DOCGEN.colourLabel` in the chosen `fmt`; a `VARIABLE_ALIAS` gets `setAliasCell` (which sets `Content`, the cell text, **the nested pill** and the swatch boolean together) and then binds the swatch to the alias *target*, pinning that collection's mode **by name** so a Light column shows the primitive's Light value rather than its first mode. The table variant is chosen before rows are cloned, so `Alias=True` propagates — primitive collections come out all-plain automatically.

These pages used to be two prose snippets here, retyped per run. That is exactly how a run shipped 367 alias cells rendering `Label`: the hand-typed version set the cell property and not the pill. `tests/test-recipes.js` now pins both paths.

What still needs your judgement, because no script can settle it:

**`colourLabel` reads OKLCH from the variable's `description`, so it is passed the variable, not just the value.** Under `fmt === "oklch"` expect these tables to measure over the default width and land at 860 — the labels are ~3× longer than hex.

**One description field, potentially several values.** A variable with distinct Light and Dark values still has exactly one description. Three shapes occur:

- **One value.** It can only describe one mode. Check which before trusting it across every column — if it matches only one, that is the user's call, not something to paper over.
- **One section per mode, under a `Light:` / `Dark:` heading** — the preferred shape, and what current generator output composes.
- **One value per mode, tagged inline** (`· light`, `· dark`) — what OKLCH scale-generator tooling writes. The mode name is passed per column for exactly this; `oklchFrom` returns the first match and would fill the Dark column with the Light value: fully populated, well-formed, silently wrong. Defect 14.

**Alias targets in an unpublished tier still resolve.** Key import fails for a hidden primitive, but `getVariableByIdAsync` on the alias id does not — `resolveAlias()` uses that, and it is the only route in. A collection that publishes zero variables cannot be documented *as a page* from a consuming file at all; `sourceIndex` throws a named error saying so.

## Global pages (FLOAT / STRING)

`Table - Global`. Usually a single mode → `setColumnCount(row, 2)`, i.e. **shrinking** from the shipped 3.

The mode is often still called `Mode 1` (Figma's default), which then becomes your value-column header. That is the source truth and it reads as a bug in published docs — surface it and let the user pick between the literal name, a caption like `Value`, and renaming the mode in the collection. Whatever they choose, note that a caption is the one thing on the page not derived from source, so a later regeneration without the same instruction will revert it.

No swatches: `setSwatchBool(cell, false)` throughout. Aliases still occur (one global token pointing at another) — apply the alias rule, but with `isColor = false` so the swatch stays hidden.

Round floats with `DOCGEN.num()`; `String(val)` for strings.

**Use `orderRows`, not `smartSort`.** These are exactly the tables where name sort fails: t-shirt scales (`none, sm, lg, xl, 2xl, full`) must sort by resolved value, and weight names (`normal, medium, semibold`) by weight rank. Numeric-named ramps like `Spacing/0…18` and `Shadow/Spread/-12…1` still sort by name. See Step 3.

### Type metrics that are not variables (Step 2.2, opt-in)

Extra tables on this page whose rows come from the source's **text styles**, not from the collection — the line-height and letter-spacing values the styles hard-code. Only when asked for; see Step 2.2 for the two unit questions and the `rem` trap.

Build them into the frame group that already holds the type tokens (`Family`/`Size`/`Weight`), and let them take their alphabetical place among those tables. Rows sort by resolved value ascending, so negative tracking leads.

`generateMetricTables(frame, tblVariant, styles, opts)` (`scripts/recipes.js`) builds them. `tblVariant` is the plain (`Alias=False`) `Table - Global` variant. `styles` is the snapshot's text styles. `opts` carries the maintainer's two answers, `{ lineHeightUnit: "unitless" | "authored", letterSpacingUnit: "em" | "rem" | "authored", rootSize, badgeText }`. It refuses a missing unit, and refuses `rem` without `rootSize`, rather than defaulting either. Line-height rows are always keyed by value and letter-spacing rows by (value, size) under `rem`, both through `DOCGEN.metricRows`, which skips bound fields. Each table goes through `setupTableBadged`, gets a `Name | Value` header, and is inserted at its alphabetical place among the frame's tables. A rerun replaces its own tables. It returns `{table, rows, badged}` per table; `badged: false` means the doc library's `_Title` lacks the badge properties, so say so in the report.

Three things to get right, each of which has a matching failure entry:

- **Badge it.** `setupTableBadged`, not `setupTable`. An unbadged table claims a token that does not exist.
- **Exclude these rows from the coverage check.** They map to no variable, so a "every row resolves to a source variable" assertion will report them as strays. Count them separately and say so.
- **Under `rem`, keep the size in the row name.** `metricRowName` does it; dropping it merges two genuinely different rows that happen to share a percentage.

---

## Shadows page

### Grouping

Effect style name depth **varies between libraries** — never hardcode `parts[1]`/`parts[2]`.

```js
// "Shadow/Base/Drop/very soft" -> group "Base / Drop", table "very soft", subtitle true
// "Drop/very soft"             -> group "Drop",        table "very soft", subtitle false
```

One frame per `frameGroup`; one `Table - Effects` per style; one row per effect in that style (composites have several).

**Take the frame-group order, the table order and the row order from the styles array — do not sort.** `Raised, Floating, Overlay, Modal` is an elevation ramp; alphabetising it to `Floating, Modal, Overlay, Raised` destroys the only ordering that matters. The frame index is `groupOrder.indexOf(group) + 1`, derived from that same array.

The **preview strip must use the same order as the tables in its frame**. It is built from a separate loop, so it silently keeps whatever order that loop used — a preview reading `Floating, Modal, Overlay, Raised` above tables reading `Raised, Floating, Overlay, Modal` looks like two unrelated bugs. Verify preview labels against table titles position by position.

### Preview

One `Preview - Effects` per frame, straight after the section header, covering every style in that frame. Its `Content slot` is a SLOT of `Effect item`; each item has an **ELLIPSE named `Swatch`** (not `Shape`) plus a TEXT property.

`generateShadows()` builds it **from the same entries array as the tables below it**, which is what stops the two orders drifting — they used to be separate loops, and a preview reading `Floating, Modal, Overlay, Raised` above tables reading `Raised, Floating, Overlay, Modal` looks like two unrelated bugs. `tests/test-recipes.js` asserts the two match position by position.

### Rows — six fixed columns

Cells live in a **FRAME named `Content`**, fixed at 6: `Type`, `X`, `Y`, `Blur`, `Spread`, `Colour`. `setColumnCount` returns `null` here; that is expected.

`fillEffectRow()` is this recipe. Per row it writes `Type` as text (never a variable), then for each of `offsetX`, `offsetY`, `radius`, `spread`, `color` applies the alias rule: a bound field becomes an alias cell — numerics shortened to their last segment, **Colour keeping its full path** — and an unbound one falls to the literal. A colour with no backing variable has no authored OKLCH, so it correctly stays hex whatever `fmt` says.

`BACKGROUND_BLUR` binds only `radius` and has no offset, spread or colour — those cells correctly fall to the literal path and render `-`.

---

## Text styles page

### Pages and frames

Step 3's parent-tier rule decides the **pages** first: `Text styles` alone when the top-level segments are ordinary groups, `Text styles - {parent}` per parent when every style sits at parent / group / style depth, the combined page as the mixed-structure fallback. Within a page:

- **Page-per-parent** (including a single shared parent promoted into the page name): the parent segment is already consumed by the page. Frames are `1 - Values`, `2 - Samples` with `Subtitle=True`, subheading the parent name — a reader deep-linked into a frame cannot see the page name, so the subtitle still carries the platform.
- **Combined page over multiple platforms** — the mixed-structure fallback only: a Values frame per platform, then a Samples frame per platform, `Subtitle=True`, subheading the platform:

```
1 - <P1> - Values, 2 - <P2> - Values, 3 - <P1> - Samples, 4 - <P2> - Samples
```

- **No parent tier**: two frames, `1 - Values` and `2 - Samples`, `Subtitle=False`.

**Layer order.** A page's children list **bottom-up** in the layers panel — the last child shows on top — so frames appended in build order (`1` then `2`) read as `2, 1`. `generateTextStyles()` re-appends in reverse at the end, so the panel reads `1 - Values, 2 - Samples` from the top and the page's children array ends up `[2, 1]`; that is correct, not backwards. Children *inside* an auto-layout frame are unaffected — the panel follows flow order there.

**Table and row split, after the page and frame have consumed their segments.** Whatever tier the page took (the parent) and the frame took (the platform, on the combined page) is stripped from the name first; of what remains, the **first segment is the table and the remainder joined is the row**:

| Name as the table sees it | Table | Row |
|---|---|---|
| `Headline/lg` | `Headline` | `lg` |
| `Headline/Display/lg` | `Headline` | `Display/lg` |

This one rule covers every case above — `Mobile app/Headline/lg` on a split page arrives as `Headline/lg`, and `Headline/lg-normal` on a no-parent page arrives untouched. Read the depth, never assume a platform segment exists.

**Order pages, tables and rows by the styles array, not alphabetically** (Step 3). `Headline, Title, Body, Label` is the maintained order; `Body, Headline, Label, Title` is noise.

### Values table

`Table - Text values`, rows `Row - Text style values`. The cell container has shipped as both a SLOT `Content slot` and a fixed FRAME `Content` — accept either, and only worry about the difference if you need to change the column count.

Columns are **not fixed and not positional**. One observed library shipped `Name · Family · Size · Weight · Line-height`, then later `Name · Family · Size · Weight · Letter spacing · Line-height` with the new column inserted in the middle. Resolve every column by header label (`helpers.md`):

| Header label | Source | Typical treatment |
|---|---|---|
| Name | row name | `Text` |
| Family | `boundVariables.fontFamily` | `Alias`, last segment (`sans`) |
| Size | `boundVariables.fontSize` | `Alias`, last segment (`5xl`) |
| Weight | `boundVariables.fontStyle` | `Alias`, last segment (`normal`) |
| Letter spacing | `letterSpacing`, usually **unbound** | `Text` — see units below |
| Line-height | `lineHeight`, usually **unbound** | `Text` — see units below |

Round both `lineHeight` and `letterSpacing` — raw float32 gives `110.00000238418579%`.

#### Units on the two type-metric columns

Which form these take is the **per-group** decision from Step 2.1. Route every literal through `DOCGEN.unitTextFor(field, value, style.fontSize, web)`, passing the decision for *this style's* group:

| Figma value | As authored (`web = false`) | Web / CSS (`web = true`) | Note |
|---|---|---|---|
| Line-height `150%` | `150%` | `1.5` | Exact — Figma's % is font-size-relative, same as the CSS ratio |
| Line-height `24px`, size 16 | `24px` | `1.5` | **Derived** from `fontSize` — collect and report these |
| Line-height `Auto` | `Auto` | `Auto` | Font-metric leading. `normal` is not equivalent across platforms — report it and let the user pin a real value in the style |
| Letter spacing `2%` | `2%` | `0.02em` | Exact |
| Letter spacing `-0.32px`, size 16 | `-0.32px` | `-0.02em` | **Derived** — report |
| Letter spacing absent | `0%` | `0em` | |

Three things not to do:

- **Do not convert an alias cell.** A bound `lineHeight` renders as its token name (`Font/Line height/tight`) under the alias rule, and there is no value there to divide. `unitTextFor` is only ever reached on the literal path.
- **Do not convert on any variables page.** A `FLOAT` variable holding `150` has no unit attached — ratio, percent and pixel size are indistinguishable in the file. Step 2.1 covers text styles only.
- **Do not mix conventions within one frame group.** The decision is per group precisely so a `Web app` frame can be entirely CSS while a `Mobile app` frame is entirely as-authored. A single table holding `1.5` and `110%` is the bug this structure prevents.

#### Marking the converted tables

Converted values are not self-labelling — `1.5` in a Line-height column could be read as a stray percentage with the sign lost. Say so on the table:

- Probe `_Title` for a `Label` BOOLEAN and a `Label text` TEXT property (`setupTable` currently forces `Label` to `false`, so it is free). On a converted Values table set `Label=True`, `Label text = "CSS units"`.
- If the probe shows either property missing, or `_Title` is hidden because the table name repeats the frame group, **skip the badge** — do not invent a text node for it. The report then carries the whole burden, so make it explicit there.
- Renaming the header itself (`Line-height (unitless)`) is the user's call, not the generator's. `FIELD_BY_LABEL` accepts the qualified forms, listed one by one rather than prefix-matched (a prefix rule would map a future `Sizing` column onto `fontSize` and report nothing), so a hand-renamed header still maps on the next refill, but do not rename it unprompted: the header is the doc library's contract and rewriting it changes every file built from that component.

Note the Size column documents the **token** (`5xl`), not the pixel value; the resolved numbers live on the globals page. Say so in the report, because it is the first thing a reader asks about.

`fillTextValueRow()` applies the alias rule per cell and routes every literal through `DOCGEN.unitTextFor`, so the three rules above are enforced rather than remembered. One shape to know if you ever read `boundVariables` yourself: a bound key ships as an object **or** a single-element array, and `snapshotTextStyles()` normalises both.

The token name and the resolved font style can differ (`Font/Weight/Semi Bold` vs the font's `SemiBold`). The tables document the **token**; mention the discrepancy to the user rather than silently normalising it.

### Samples table

`Table - Text sample`. Its `Content slot` **must be a SLOT** — if it is a plain FRAME, stop; see `failures.md`. Exclude this table from the wrap detector: its specimen text is *supposed* to run to several lines.

`generateTextStyles()` fills it, and does one thing that is not obvious enough to leave to a caller: it **imports each text style in the same call that applies it**. A style id cached from an earlier call comes back `Cannot find style` after a plugin restart, and the failure reads as a missing style rather than a stale id.
