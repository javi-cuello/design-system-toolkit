# Normalisation rules

Deciding what counts as a difference is most of this skill. Compare too much and real findings drown in derived-layout noise; compare too little and the skill confidently reports two files identical when they aren't.

The second failure is far worse. A false positive costs the user a moment's checking. A false negative destroys the reason to run the skill at all.

## Ignored, with reasons

| Ignored | Why |
|---|---|
| `x`, `y`, `absoluteBoundingBox`, `absoluteRenderBounds` | Derived from layout, not authored |
| `width` / `height` when sizing is `FILL` or `HUG` | Computed from context. A `FILL` node reads 964 in one file and 860 in another purely because its parent differs |
| Internal property key suffixes (`#0:56`) | Node ids embedded in property keys. They change whenever the underlying node is recreated; the property is the same |
| Float noise | Everything numeric rounds to 2 decimal places before hashing |
| `pluginData`, `exportSettings`, dev status | Tooling metadata, not design |
| Resolved colour where a variable binding exists | Compare the binding. Otherwise one changed variable reports as hundreds of changed fills |

## Compared

Structure: `type`, `name`, child order, `visible`, `opacity`, `blendMode`, `isMask`, `rotation`, `clipsContent`

Layout: `layoutMode`, all four paddings, `itemSpacing`, `counterAxisSpacing`, `primaryAxisAlignItems`, `counterAxisAlignItems`, `primaryAxisSizingMode`, `counterAxisSizingMode`, `layoutWrap`, `layoutAlign`, `layoutGrow`, `layoutPositioning`

Sizing: `layoutSizingHorizontal`, `layoutSizingVertical`, `width`/`height` when `FIXED`, and the full constraint family — `maxWidth`, `minWidth`, `maxHeight`, `minHeight` — plus `constraints` for absolutely positioned nodes

Paint: `fills` and `strokes` with variable bindings preferred over resolved values, per-side stroke weights, `strokeAlign`, `dashPattern`, `cornerRadius`

Effects: type, radius, spread, colour, offset, visibility, plus `effectStyleId`

Style links: `fillStyleId`, `strokeStyleId`, `effectStyleId`, `textStyleId`, resolved to style names

Variables: every entry in `boundVariables`, resolved to variable names rather than ids so the comparison survives id differences

Text: `characters`, text style, font family and style, size, line height, letter spacing, auto-resize, both alignments, truncation, `maxLines`

Instances: `componentProperties` with key suffixes stripped

## The instance rule

Whether to descend into an instance depends on where it sits.

**Inside a component definition: descend.** These are authored design. A table component built from cell instances has its column widths, overrides and swaps living entirely inside those instances. Skipping them means skipping most of the component.

**Placed on an example or documentation page: don't descend.** These are derived from their main component. Compare the main component reference, `componentProperties`, and the set of overridden fields. Walking their generated children produces enormous volume and no information.

Getting this backwards in an early version meant a run reported 529 nodes where the correct figure was 1,850, and declared two files identical when a component's column widths had been rebalanced.

## Adding properties

Add the property to the serialiser, then run `scripts/coverage-test.js` and confirm mutating it moves the hash. Reasoning about which properties matter is how the gaps got there in the first place — the constraint family was missed precisely because nobody thought of it.

The Figma Plugin API adds properties over time, so treat the coverage test as something to re-run periodically, not once.
