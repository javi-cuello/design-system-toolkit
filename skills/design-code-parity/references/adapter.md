# 5 · The measurement: adapter, differ, tolerances

How Figma becomes expectations, how a row is judged, and how close is close enough. [SKILL.md](../SKILL.md) links here from part 5.

## Contents

- [A hug is compared to the pixel; a FIXED axis is exact](#a-hug-is-compared-to-the-pixel-a-fixed-axis-is-exact)
- [A resolver that cannot read a value must not answer "no difference"](#a-resolver-that-cannot-read-a-value-must-not-answer-no-difference)
- [Assert a property where the design draws it, not where it is convenient](#assert-a-property-where-the-design-draws-it-not-where-it-is-convenient)
- [Figma resolves exactly once](#figma-resolves-exactly-once)
- [One adapter, and where its rules come from](#one-adapter-and-where-its-rules-come-from)
- [One differ, and the tolerance is per kind](#one-differ-and-the-tolerance-is-per-kind)

## A hug is compared to the pixel; a FIXED axis is exact

A hugging box is as wide as its text. Figma's text engine and the browser's do not agree to the pixel on the same string in the same face. "Label" in Inter Medium 14 is 37 in the file and 36.28 in Chrome.

Neither side can fix that. Figma sizes a text box that hugs its words to a whole pixel, and a browser lays it out to a 64th. In two projects' snapshots, all 10,620 such widths and heights are integers, where fill widths and paths are not.

**The tolerance is one pixel per such text box in series along the axis.** It is derived from that and nothing else:

- It is summed along a row's width or a column's height.
- Across the axis, it takes the biggest child's count.
- It counts nothing through a size the design fixes.
- An instance whose insides the snapshot did not record counts as one box.
- It is capped at three pixels, however many boxes run in series. The real disagreements measured fall under that, and nearly everything past it was a defect.

A row the slack excuses by a pixel or more is reported waived, with the slack it used. It is never reported as a match.

A FILL axis takes its parent's slack plus what its siblings hug along the parent's run. A heading that fills what two hugging buttons leave over is off by *their* disagreement.

Do not count every text run below a box on both axes. The first version did, which gave a page hugging two hundred runs two hundred pixels of height. It let 52 waivers' worth of real differences pass.

A same-string difference past the bound is a font question: is the shipped face Figma's? It stays red until that is answered. Figma's `Inter` is release 3.19. Of 137 strings measured, 3.19 set every one within the whole-pixel box, and 4.001 set them up to 2.6px short.

The tolerance is stated, and it applies only to hug and fill. A FIXED axis is exact. It still catches everything a hug is worth checking: a Button that rendered 68 tall against a design of 44 misses by 24.

**Do not answer this by declining to assert hug axes.** That was the first version's rule. It is how a component can be wrong in its most visible dimension while every colour, radius and padding assertion passes.

## A resolver that cannot read a value must not answer "no difference"

Gate 10 keeps a recorded *key* from going unread. This is its twin one level down, and the quieter of the two.

A token resolver may understand one spelling of a colour and return nothing for another. An adapter may skip an assertion whose expected value came back `undefined`. Together they report agreement about a value neither side compared.

One library's resolver read `#rrggbb` and not `rgb(r g b / a)`. **All sixty-one of its translucent colours were unasserted**, and nothing said so. The same shape hid every gradient fill, because a gradient arrives as an object where every other fill is a string.

So an expected value that cannot be resolved is a **finding**, not a skip. Name the token and the property, and fail.

A browser may store a value coarser than the design states it. Alpha lives in 1/255 steps, so a designed 0.116 comes back 0.118. Knowing that is the comparator's job, never the resolver's job to round away.

## Assert a property where the design draws it, not where it is convenient

A stroke on one edge is not a stroke on all four. An unset `border-color` is `currentColor`, which resolves to the text colour and looks plausible in a report.

Asserting the stroke colour on a fixed side compared an edge the design never drew, on every one-sided stroke in one library. Emit colour and width **per side that has one**.

## Figma resolves exactly once

Layer the comparison as adapter → schema → differ. All three are the toolkit's.

| Layer | Its job |
|---|---|
| Adapter, `tools/parity/adapt.mjs` | Translates a spec plus its mapping into plain expectation documents, resolved for the tier. It is the only code that knows a Figma term. |
| Schema | The closed table of assertion kinds, comparators and the spec-key contract. |
| Differ | Judges the documents against the measurements, generically. |

Figma terms the adapter alone knows include these. A space-between layout is a distribution, not a gap. A rotated layer answers with its visible box. A hugging text has no alignment to assert.

The spec-key contract is `SPEC_KEYS` in the adapter. Gate 10 holds it to the corpus. So does `unreadRules`, which removes each declared key from every layer carrying it and fails a rule nothing reads.

A project supplies only its facts, under `parity` in `snapshot.config.json`. They are its tolerances, its hosts, and what it opts the adapter into: `position`, instance `props` and `canvas` tokens.

**Every translation rule is pinned as a fixture**: a minimal tree in, the expectation document out. A rule that lives only as code dies with its author.

A first-generation comparison, where translation and judging are one enumeration, is where silent passes breed. Any Figma nuance not translated is not judged, and nothing says so.

**A port onto this shape is proven by equivalence: reproduce first, improve after.** The reference project ported a 300-line enumeration this way. The refactored suites reproduced 5,838 checks, 478 waived rows and 0 differences identically.

## One adapter, and where its rules come from

Two projects each wrote an adapter, and they disagreed on 22 points. Each was settled by Figma's and CSS's own semantics. Each is pinned by a fixture that fails on the losing side's old behaviour, in `tools/parity/test-adapt.mjs`.

The rules a builder meets:

| Subject | What the adapter does |
|---|---|
| `strokeSides` | Per-side *weights*, not flags. |
| Stroke channels | Code-standard rule 63's table, which the adapter encodes. Asked as drawn: a ring inside the box apart from a focus ring outside it (`-inner-ring-*`), and a border's colour per side. |
| Border or outline width | Asked as Chrome snaps it: 0.5 reads 1. |
| Stroke width | Its own tolerance kind. A pixel of box rounding on lengths once passed a 1px stroke measured as none, on 108 rows. |
| Gap | Asked only between two in-flow children. |
| Size | Every axis has one. FIXED is exact; HUG or FILL is within its text-box slack. |
| Text that fills its row | No width is asked of a text box that fills its row and sets its words from the left. It draws them where a hugging box would, so there is nothing to observe. |
| `min-width` | Its own property. |
| Radius | Compared as CSS draws it, scaled to fit the box. |
| Effect | The exact, ordered `box-shadow`. |
| A layer the variant does not draw | Still measured. An effect or stroke a sibling variant draws owes an explicit none here. |
| Wrapping | Asserted only where the children do not fit on one line. |
| SPACE_BETWEEN with one child | Read as the start, for gate 14's reason. |

**A gradient's direction is its transform's.** The colour at a point is the first row of `gradientTransform` applied to it. On a w×h box the CSS angle is atan2(a/w, −b/h). Each stop falls where that puts it on CSS's corner-to-corner line.

The handles' angle alone does not fix a diagonal. Two gradients recorded at 135° in one file render, in Figma's own frame export, at CSS 135° and 110.9°. A diagonal recorded without its transform (snapshot plugin before 0.48.0) is an `unresolved` row, not a guess.

Two rules no project had before the merge:

- **A layer mapped onto its mapped ancestor's element has that ancestor's box**. A label that is the button's own text is asked no width of its own.
- **An element is present only where it puts something on screen**. That is a fill, an edge, a shadow, words (a control's value), a picture, or a child that does. It must be in a box with both extents and not at opacity 0. An empty block, an empty slot kept for a picture, or a stylesheet width on a hidden element is not a drawn layer.

## One differ, and the tolerance is per kind

The schema and differ are the toolkit's: `tools/parity/schema.mjs` and `diff.mjs`. There is one judged row per assertion, keyed `Layer.prop`, so a waiver key means one thing. A layer the variant does not draw but the code renders is a difference (`-present`), not silence.

How close is close enough is the project's. It goes under `parity.tolerances` in `snapshot.config.json`, **per assertion kind**, and is exact where unnamed.

One project judged every number within ±1 to absorb a pixel of box rounding. It passed an opacity of 0.4 against 1, and a font size of 13 against 14. Made exact, the opacity alone surfaced 64 disabled controls drawn at full strength.

A tolerance belongs to the kind of value whose measurement rounds, never to numbers at large.
