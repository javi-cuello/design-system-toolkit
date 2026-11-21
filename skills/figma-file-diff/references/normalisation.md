# Normalisation rules

Deciding what counts as a difference is most of this skill. Compare too much and real findings drown in derived-layout noise. Compare too little and the skill confidently reports two files identical when they aren't.

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

`scripts/serialise.js` reads these, under these Plugin API names.

| Group | Properties |
|---|---|
| Structure | `type`, `name`, child order, `visible`, `opacity` |
| Structure, continued | `blendMode`, `isMask`, `rotation`, `clipsContent` |
| Layout | `layoutMode`, all four paddings, `itemSpacing`, `counterAxisSpacing` |
| Layout alignment | `primaryAxisAlignItems`, `counterAxisAlignItems` |
| Layout sizing modes | `primaryAxisSizingMode`, `counterAxisSizingMode` |
| Layout flow | `layoutWrap`, `layoutAlign`, `layoutGrow`, `layoutPositioning` |
| Sizing | `layoutSizingHorizontal`, `layoutSizingVertical`, and `width` / `height` only when `FIXED` |
| Constraints | The full family — `maxWidth`, `minWidth`, `maxHeight`, `minHeight` — plus `constraints` for absolutely positioned nodes |
| Paint | `fills` and `strokes`, variable bindings preferred over resolved values; per-side stroke weights |
| Paint, continued | `strokeAlign`, `dashPattern`, `cornerRadius` |
| Effects | Type, radius, spread, colour, offset, visibility, plus `effectStyleId` |
| Style links | `fillStyleId`, `strokeStyleId`, `effectStyleId`, `textStyleId`, resolved to style names |
| Variables | Every entry in `boundVariables`, resolved to variable names rather than ids, so the comparison survives id differences |
| Text | `characters`, text style, font family and style, size, line height, letter spacing |
| Text, continued | Auto-resize, both alignments, truncation, `maxLines` |
| Instances | `componentProperties`, with key suffixes stripped |

## The instance rule

Whether to descend into an instance depends on where it sits.

**Inside a component definition: descend.** These are authored design. A table component built from cell instances has its column widths, overrides and swaps living entirely inside those instances. Skipping them means skipping most of the component.

**Placed on an example or documentation page: don't descend.** These are derived from their main component. Compare the main component reference, `componentProperties`, and the set of overridden fields. Walking their generated children produces enormous volume and no information.

Getting this backwards is how a run once reported 529 nodes where 1,850 was right. It declared two files identical when a component's column widths had been rebalanced.

## Adding properties

Add the property to the serialiser, then run the coverage test and confirm that changing it moves the hash. The test runs as [SKILL.md](../SKILL.md) *Validating the serialiser* says, through `scripts/coverage-body.mjs`. Reasoning about which properties matter is how the gaps got there: the constraint family was missed because nobody thought of it.

The Figma Plugin API adds properties over time, so treat the coverage test as something to re-run periodically, not once.
