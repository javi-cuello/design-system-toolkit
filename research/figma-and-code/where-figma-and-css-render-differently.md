# Where Figma and CSS render differently

Why a component that looks right in Figma renders differently in the browser, and for each case whether to change the file, translate in code or keep the difference.

A developer builds the library's Card from its Figma spec and puts it beside the design. The shadow is rounder in the browser, the bordered button is two pixels taller, and the inner shadow that tinted the image in Figma has vanished under it. Every value was copied exactly. Nothing was copied wrong.

Most of these differences come from one fact: Figma draws a layer from everything it holds, while CSS draws a box from its own edges. This guide follows that fact through shadows, strokes, radii, clipping, colour, text and auto layout.

---

## What this answers

- [Frame shadows](#frame-shadows): why a frame's shadow changes shape
- [Inner shadows](#inner-shadows): whether one covers the content
- [Shadow stacking order](#shadow-stacking-order): which of several shadows is on top
- [Blur values](#blur-values): whether a Figma blur equals CSS
- [Glass and progressive blur](#glass-and-progressive-blur): whether they can be built
- [Stroke alignment](#stroke-alignment): which CSS draws a Figma stroke
- [Focus rings](#focus-rings): how a focus ring translates
- [Dashed, gradient, hairline strokes](#dashed-gradient-hairline-strokes): which of them translate
- [Radii and corner smoothing](#radii-and-corner-smoothing): whether radii clamp and smooth alike
- [Clipping, opacity, blend modes](#clipping-opacity-blend-modes): whether they translate
- [Gradients and colours](#gradients-and-colours): why they look different
- [Text rendering](#text-rendering): why text looks different
- [Images, masks and icons](#images-masks-and-icons): how they translate
- [Auto layout and flexbox](#auto-layout-and-flexbox): whether auto layout is now flexbox

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs.

Every case ends with one of three actions:

- **Change Figma.** Figma has a setting that matches code, and the library isn't using it.
- **Translate in code.** The two tools express the same intent in different terms; the token pipeline or the engineer applies one known conversion, once.
- **Keep different.** One side has a capability the other lacks, and forcing parity costs more than the difference. It's recorded as a named deviation.

Line height, letter spacing and vertical trim are in [the guide to line height and letter spacing from Figma to CSS](../foundations/line-height-letter-spacing-figma-to-css.md), and right-to-left layout in [the guide to right-to-left design systems](../accessibility/rtl-design-systems.md). Which names and props should match is [How closely should Figma match code?](how-closely-figma-should-match-code.md)

---

## Frame shadows

A frame's shadow changes shape because a Figma drop shadow on a frame is cast by everything the frame renders, children included, unless Clip content is on, while CSS `box-shadow` is cast by the element's own rounded box and never by its children.

Take the Card from the opening: a 160 by 120 frame with a white fill, a 24px radius and a solid shadow offset 12px. In its bottom-left corner sits a 60 by 60 square child, an image thumbnail. Here is that frame with Clip content off and on, as tested directly.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 300" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Two copies of a 160 by 120 frame with a 24px radius, a solid shadow offset 12px and a square child in the bottom-left corner. Clip content off: the child's square corner pokes past the rounded edge and the shadow under it is square. Clip content on: the child is trimmed to the curve and the shadow follows the frame's rounded shape.</title><rect width="880" height="300" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="299" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">The same frame, Clip content off and on</text><line x1="440" y1="58" x2="440" y2="272" stroke="#E3DFD8"/><path d="M192 98 H304 A24 24 0 0 1 328 122 V194 A24 24 0 0 1 304 218 H192 A24 24 0 0 1 168 194 V122 A24 24 0 0 1 192 98 Z" fill="#BDB7AD"/><rect x="168" y="158" width="60" height="60" fill="#BDB7AD"/><path d="M180 86 H292 A24 24 0 0 1 316 110 V182 A24 24 0 0 1 292 206 H180 A24 24 0 0 1 156 182 V110 A24 24 0 0 1 180 86 Z" fill="#FFFFFF" stroke="#CFC9BF"/><rect x="156" y="146" width="60" height="60" fill="#9FB4C2"/><path d="M622 98 H734 A24 24 0 0 1 758 122 V194 A24 24 0 0 1 734 218 H622 A24 24 0 0 1 598 194 V122 A24 24 0 0 1 622 98 Z" fill="#BDB7AD"/><path d="M610 86 H722 A24 24 0 0 1 746 110 V182 A24 24 0 0 1 722 206 H610 A24 24 0 0 1 586 182 V110 A24 24 0 0 1 610 86 Z" fill="#FFFFFF" stroke="#CFC9BF"/><clipPath id="clip-on"><path d="M610 86 H722 A24 24 0 0 1 746 110 V182 A24 24 0 0 1 722 206 H610 A24 24 0 0 1 586 182 V110 A24 24 0 0 1 610 86 Z"/></clipPath><rect x="586" y="146" width="60" height="60" fill="#9FB4C2" clip-path="url(#clip-on)"/><text x="32" y="72" font-size="12.5" fill="#1C1B19">Clip content off</text><text x="466" y="72" font-size="12.5" fill="#1C1B19">Clip content on</text><text x="236" y="250" font-size="11.5" fill="#77726B" text-anchor="middle">The child's square corner pokes past the curve,</text><text x="236" y="266" font-size="11.5" fill="#77726B" text-anchor="middle">and the shadow comes out square there</text><text x="666" y="250" font-size="11.5" fill="#77726B" text-anchor="middle">The child is trimmed to the 24px curve,</text><text x="666" y="266" font-size="11.5" fill="#77726B" text-anchor="middle">and the shadow follows the frame, like box-shadow</text></svg>

With Clip content off, the child's square corner shows past the rounded edge, and the shadow under it comes out square. With it on, child and shadow both follow the 24px curve.

Figma's engineering blog describes the method: copy the layer's geometry, fill it with one colour, blur it, draw it underneath. For a frame, the geometry is the composite of the frame and its visible content, and Clip content changes that composite.

CSS behaves differently at the root. The Backgrounds specification draws an outer `box-shadow` from the border box, following `border-radius`; nothing inside affects its shape. The CSS function that does follow content is `filter: drop-shadow()`, which casts from the alpha of everything the element paints.

| Figma frame | Shadow cast from | CSS equivalent |
|---|---|---|
| Fill, radius, Clip content **on** | the frame's rounded shape | `box-shadow` |
| Clip content **off**, child overflowing | frame plus every visible child | `filter: drop-shadow()` |
| No fill | the children only | `filter: drop-shadow()` |

**Show behind transparent areas** (`showShadowBehindNode`) appears only when a fill is translucent or absent. Off matches `box-shadow`, cut out under the box; on matches `drop-shadow()`.

Spread follows from the same model. The Plugin API allows it only on rectangles, ellipses, and frames, components and instances with a visible fill (at least 1% opacity) and Clip content on. When Figma shipped spread in 2020, its blog said the aim was to do at least what CSS can, and CSS spread exists only on boxes.

The values that depend on spread aren't exotic:

- Atlassian's dark overlay shadow opens with a one-pixel ring, `0px 0px 0px 1px #BDBDBD1F`.
- Primer's `shadow.floating.small` begins with `0 0 0 1px`.
- Polaris uses negative spread across its scale, such as `shadow-300: 0px 4px 6px -2px rgba(26,26,26,0.20)`.
- Material's level 1 ambient is `0 1px 3px 1px`.

On an unfilled or unclipped frame, every one of them renders as if spread were zero. CSS `drop-shadow()` accepts no spread either, so a content-shaped shadow with spread can't be built with either primitive.

This one is a Figma fix. **Give every frame that carries an elevation shadow Clip content on, a visible fill, and Show behind transparent areas off.** Its silhouette is then the border box `box-shadow` produces, and spread works. Keep the content-following behaviour only where the design needs a shadow shaped like its content (an icon, a cut-out sticker), and say so in the component description, because code has to use `drop-shadow()`, which has neither spread nor inset. No system documents this mismatch, but every system's shadow tokens are `box-shadow` values, which settles which behaviour they expect.

---

## Inner shadows

In Figma an inner shadow covers the content, tested directly; CSS paints `box-shadow: inset` just above the background and below the content, so children cover it.

Back to the Card, now with a pressed state drawn as an inner shadow. In Figma, the shadow tints the thumbnail at its edges. In the browser, the thumbnail sits on top of the shadow and hides it.

Figma's help documents a single layer's paint order, from top to bottom, as layer blur, stroke, inner shadow, fill, drop shadow, background blur. For the layer itself that matches CSS. What it doesn't say is where a frame's children sit in that stack.

A test answered it. A clipped frame with a red inner shadow of 16px spread got a green child spanning its width. The red band ran across the green child at both ends, tinting it brown.

Polaris shows what a system does when it wants the Figma behaviour in code. Its bevel, `--p-shadow-bevel-100`, is four one-pixel inset shadows drawn not on the element but on an absolutely positioned `::before`, with `pointer-events: none` and a luminosity blend. That's the only way CSS puts an inset effect over children.

The action depends on intent. For a pressed or recessed surface with plain content, nothing visible changes, so leave it. Where the inset has to read over an image or a filled child, translate in code with an overlay pseudo-element, and say so in the spec. **Where the inset should sit under content, change Figma: inset the content from the edge so the shadow isn't covered there either.**

---

## Shadow stacking order

In CSS the first shadow in the list paints on top; in Figma's effects array, as the Plugin API returns it, the last entry does (tested directly), so a pipeline that copies the array in order reverses the stack.

Most real shadow tokens have two or three layers, which is why the order matters:

- Fluent's `shadow16` is `0 0 2px` ambient plus `0 8px 16px` key.
- Spectrum's `drop-shadow-elevated` has three.
- MUI's 24 elevations have three each.

Reversing key and ambient changes which edge looks crisp.

In the test, a frame carried two opaque drop shadows: red at 20px offset first, blue at 30px second. The blue painted over the red. The panel reportedly shows the front-most effect at the top, which makes panel order equal to CSS order, and the API array the reverse of both.

The bug has shipped before. Dev Mode once emitted reversed CSS, reported fixed by Figma staff in March 2024, and Tokens Studio still lists reversed shadow order on import as a known issue.

Translate it in code, once, in the export transform, with a test that a two-colour fixture comes out in order. **Reverse the effects array exactly once, where tokens are exported, and nowhere else.** The toolkit's token exporter does exactly this, writing effect layers in CSS paint order, top first (`skills/figma-token-export/`).

---

## Blur values

For drop shadows, a Figma blur is close enough to copy, since a Figma shadow blur renders about 12% softer than the same number in `box-shadow`; for background and layer blur it isn't, because the CSS value is about half.

Say the Card's drop shadow has a blur of 16, and the modal behind it has a frosted backdrop with a background blur of 30. Copying both numbers straight into CSS leaves the shadow nearly right and the backdrop about twice as blurry as designed.

The reason is that CSS uses two conventions. A `box-shadow` blur is a radius whose Gaussian standard deviation is half the value. `filter: blur()` and `backdrop-filter: blur()` take the standard deviation itself, so 16px of `filter: blur()` is about twice as strong as 16px of shadow blur. Figma uses one convention for all three.

Bjango measured every major tool against CSS in 2024 and found Figma the closest to `box-shadow`: a Figma shadow blur of 16 matches a `box-shadow` blur of about 14. For background blur, a Figma staff answer says Dev Mode divides by two, so 30 in Figma is 15 in CSS; Bjango's figures give a factor of about 0.44.

| Figma effect | Figma value | CSS property | CSS value that matches |
|---|---|---|---|
| Drop shadow blur | 16 | `box-shadow` blur | about 14 (copy 16) |
| Background blur | 30 | `backdrop-filter: blur()` | 15 |
| Layer blur | 30 | `filter: blur()` | about 13 to 15 |

Keep shadows different and translate blurs. Copy shadow blur one to one and write the tolerance down once; correcting 12% would make every token differ from its reference. **Halve background and layer blur in the token transform, citing Figma's own rule.**

---

## Glass and progressive blur

Neither can be built with any CSS primitive; background blur translates, with one CSS-only trap.

A designer adds Figma's glass effect to a floating toolbar, with a progressive blur fading out at its bottom edge. The developer looks for the CSS property and doesn't find one.

Figma's API exposes a progressive blur (`blurType: 'PROGRESSIVE'`, with start radius and offsets) and a glass effect with light intensity, angle, refraction, depth, dispersion and radius, besides noise and texture. CSS has a uniform `backdrop-filter: blur()`.

Building the rest is bespoke work, not a token:

- A progressive blur is several stacked `backdrop-filter` layers under `mask-image` gradients.
- Refraction would need an SVG filter referenced from `backdrop-filter`, and its cross-browser support wasn't verified.

The trap sits in plain background blur. `backdrop-filter` blurs only up to the nearest backdrop root, which is any ancestor with a filter, opacity below 1, a mask, a clip path, a backdrop filter or a blend mode. So a blurred panel inside a 90% opacity wrapper blurs only the wrapper's contents.

Keep these different. **Keep glass, progressive blur, noise and texture out of component libraries**; none of the systems surveyed ships a token for them. Background blur can stay, halved, with a note on any component that sits inside a translucent container.

---

## Stroke alignment

Draw it with the CSS that takes the same room the stroke takes in Figma: since July 2026 Figma's auto layout counts an inside stroke like a CSS border under `box-sizing: border-box`, and treats centre and outside strokes as outlines, so stroke alignment now decides whether the sizes match.

Take a button with 8px vertical padding, 24px of content and a 1px stroke. In a legacy Figma frame, hugging its content, it reports 40. In the browser, with an auto height and `border: 1px`, it renders 42. Here are both, drawn at twice their size.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 250" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Two buttons labelled Save, drawn at 2x. Left, Figma with hug and the stroke not counted: 40 tall, the stroke drawn over the padding. Right, the browser with auto height and a 1px border: 42 tall, with a dashed line marking where 40 would end.</title><rect width="880" height="250" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="249" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">1px stroke, 8px vertical padding, 24px of content (drawn at 2x)</text><line x1="440" y1="58" x2="440" y2="230" stroke="#E3DFD8"/><text x="32" y="76" font-size="12.5" fill="#1C1B19">Figma, hug, stroke not counted (legacy)</text><text x="466" y="76" font-size="12.5" fill="#1C1B19">Browser, auto height, border: 1px</text><rect x="120" y="100" width="200" height="80" rx="12" fill="#FFFFFF"/><rect x="121" y="101" width="198" height="78" rx="11" fill="none" stroke="#5E7E93" stroke-width="2"/><rect x="140" y="116" width="160" height="48" fill="#EDEAE4"/><text x="220" y="145" font-size="14" fill="#1C1B19" text-anchor="middle">Save</text><rect x="550" y="100" width="200" height="84" rx="12" fill="#FFFFFF"/><rect x="551" y="101" width="198" height="82" rx="11" fill="none" stroke="#5E7E93" stroke-width="2"/><rect x="570" y="118" width="160" height="48" fill="#EDEAE4"/><text x="650" y="147" font-size="14" fill="#1C1B19" text-anchor="middle">Save</text><line x1="340" y1="100" x2="340" y2="180" stroke="#5E7E93"/><line x1="336" y1="100" x2="344" y2="100" stroke="#5E7E93"/><line x1="336" y1="180" x2="344" y2="180" stroke="#5E7E93"/><text x="350" y="145.0" font-size="15" fill="#5E7E93" font-weight="600">40</text><line x1="770" y1="100" x2="770" y2="184" stroke="#A6552F"/><line x1="766" y1="100" x2="774" y2="100" stroke="#A6552F"/><line x1="766" y1="184" x2="774" y2="184" stroke="#A6552F"/><text x="780" y="147.0" font-size="15" fill="#A6552F" font-weight="600">42</text><line x1="530" y1="180" x2="800" y2="180" stroke="#A6552F" stroke-dasharray="3 3"/><text x="220" y="214" font-size="11.5" fill="#77726B" text-anchor="middle">Reports 40: the stroke covers the padding</text><text x="650" y="214" font-size="11.5" fill="#77726B" text-anchor="middle">Renders 42: the border adds to the box</text></svg>

That's the classic two-pixel drift. The stroke in Figma paints over the padding; the border in CSS adds to the box.

The CSS side has three channels, and they take different room:

- A `border` sits inside the element's box and takes space.
- An `outline` sits outside and takes none, and in current browsers follows `border-radius`.
- An inset `box-shadow` of `0 0 0 1px` paints inside and takes no space either.

Figma's help article on auto layout with flexbox in mind lays out the new rules. Inside strokes are included in layout by default, matching CSS borders. Outside and centre strokes are never counted, even when the frame's setting includes strokes. And padding is always respected, so a frame can't be narrower than its padding plus any inside stroke.

The new version is the default for frames created from July 2026. Older frames keep the legacy behaviour until updated, and in January 2027 the toggle becomes a one-way Update button.

Here is the same 40px button built six ways:

| Construction | Rendered height | Content height |
|---|---|---|
| Figma, fixed 40, inside stroke counted | 40 | 22 |
| CSS, `height: 40px`, `border: 1px`, `border-box` | 40 | 22 |
| CSS, `height: 40px`, `border: 1px`, `content-box` | 42 | 40 |
| Figma, hug, stroke not counted (legacy default) | 40, stroke over the padding | 24 |
| CSS, auto height, `border: 1px` | 42 | 24 |
| CSS, auto height, inset `box-shadow` ring | 40 | 24 |

The toolkit turned this into one mapping and checked it against both of its projects' stored specs (`standards/code-standard.md`, rule 63). Outside and centre strokes took no layout room, whatever the flag, on 208 real nodes. Inside-in-layout drew as a border on 217, and inside-not-in-layout as an inset ring on 1,521.

| Figma stroke | CSS |
|---|---|
| Inside, in layout | `border`, per side |
| Inside, not in layout | an inset ring over the content: `box-shadow: inset 0 0 0 N`, one offset inset layer per side for a single edge |
| Outside | a ring outside the box: `outline` or `box-shadow: 0 0 0 N`; an offset outer shadow per side for one edge |
| Center | `outline` offset by minus half its width |

A line, a vector with no extent on one axis, has no inside: it's a border on its leading edge. The hairline under a list row, a 1px outside stroke on the bottom edge, is an outer shadow offset down by its width, so a 48px row stays 48.

That shadow paints under the next sibling's background, and an `overflow: hidden` ancestor cuts it off. Where either happens, draw it on the sibling or the clipping ancestor (`knowledge/code/figma-handoff.md#strokes-borders-outlines-and-shadows`).

Systems split on the code primitive. Primer ships `boxShadow.thin` as `inset 0 0 0 {borderWidth.thin}`, described as a thin shadow used instead of a border to prevent layout shift. MUI's outlined text field draws its border on an absolutely positioned `fieldset`, so going from 1px to 2px on focus never moves the content. Everyone else uses `border`.

This is a Figma fix with a code rule beside it. Select each library frame and update it to the current auto layout version, use inside strokes for borders, set code to `border-box` globally, and apply the mapping above. **Where a border changes width between states, draw it as an inside stroke excluded from layout, which maps exactly to an inset ring.**

---

## Focus rings

A focus ring becomes one `outline` for the whole system, offset by how far the ring's outer edge sits past the box, with the element keeping its own radius.

The Card gets a focus state: a 2px ring layer drawn around it, a little larger than the card. Two details trip the build, and both are the toolkit's own findings. The outline's corners grow by the offset and width, and a ring drawn as an effect style can't have a gap.

Focus rings belong to the outside-stroke row: they mustn't shift layout when state changes. The toolkit computes one number per component, `clear`, the distance from the ringed box to the ring's outer edge. It's half the difference between the ring layer's and the ringed layer's widths, plus half the stroke for a centre stroke or the whole stroke for an outside one.

The CSS is then `outline-offset: calc(clear - width)`. A 2px inside ring on a layer 8px wider than the button gives `clear` 4 and offset 2 (`knowledge/code/figma-handoff.md#focus-rings-reading-their-geometry`).

The radius is where builds go wrong. An outline's corners follow `border-radius` and grow, so its outer radius is the element's radius plus `clear`. Writing the Figma ring layer's radius onto the element rounds the ring too much.

Tested in Chromium on 25 October 2026, radius 12 with a 2px outline at offset 2 draws an outer radius of 16. So a card at 16 with a ring layer at `Corner radius/20` keeps 16 on focus; writing 20 on the card draws 24.

> **Aside.** How corners grow under an offset isn't yet specified ([csswg-drafts #8786](https://github.com/w3c/csswg-drafts/issues/8786)), so Firefox and Safari are worth checking.

Some libraries draw rings as effect styles. Untitled UI ships `focus-ring` effect styles, plus combined ring-and-shadow styles, because Figma allows one effect style per layer. That works for a ring touching the edge, and since December 2023 a colour variable can be bound to it.

It stops working at an offset, because a spread shadow can't leave a transparent gap. The gap has to be painted in a colour that's wrong on every surface but one. Untitled UI's own React code draws the ring as an outline with a 2px offset. And in forced-colours mode, a shadow ring disappears while an outline stays.

Change Figma, then translate. Draw a ring with a gap as a stroked layer around the component, and map it to `outline` and `outline-offset`. **Keep the element's own radius; never copy the ring layer's radius onto it.** Never use `outline: none`, which leaves the browser's default width behind; `outline: 0` collapses it.

---

## Dashed, gradient, hairline strokes

One-side strokes translate; dashed strokes don't, because CSS lets the browser choose the pattern; gradient strokes don't, because `border-image` ignores `border-radius`; and half-pixel hairlines snap to device pixels.

The Card gets four decorations in one review: an accent edge on its left, a dashed border on the empty state, a gradient border on the premium version, and a half-pixel divider. Each meets CSS differently.

**One-side strokes** map to `border-top` and its siblings, with two differences. With a radius and unequal sides, CSS leaves the exact colour join in the corner undefined, and Figma documents nothing. And a centre or outside side stroke counts as an outline in Figma, while a CSS side border always takes space.

**Dashed strokes** in Figma have an exact dash, gap and cap, and start and end each line with a half dash. CSS `border-style: dashed` is defined only as square-ended dashes whose length and distribution belong to the browser. A 4 by 4 round-capped dash needs SVG `stroke-dasharray` and `stroke-linecap`.

**Gradient strokes** look like `border-image`, but border images ignore `border-radius`, so a 12px-radius card renders square corners. The working recipe is two backgrounds under a transparent border: the fill clipped to `padding-box`, and the gradient to `border-box`.

**Hairlines** are where the device decides. CSS Values snaps a border width to whole device pixels, rounding anything between zero and one up to one, and anything above one down. Polaris ships `border-width-0165` at 0.66px:

- on a 1x screen it becomes 1 CSS pixel;
- on 2x it's 1.32 device pixels, rounded down to 1, so 0.5 CSS pixels;
- on 3x it's exactly 2 device pixels.

Figma's own rounding of fractional strokes is undocumented.

For side strokes, change Figma: use inside alignment, and draw accent edges on rounded cards as a separate child. Keep dashed patterns generic, and use SVG only where the pattern matters. Treat gradient strokes as per-component decoration, built with the two-background recipe. **Name a hairline token "one device pixel", not a CSS value.**

---

## Radii and corner smoothing

Radii differ on three counts: Figma clamps an oversized radius corner by corner while CSS scales all four together (tested directly), a pill is 9999px and never 50%, and corner smoothing has no shipped web equivalent in Safari.

Take a tab shape: a 160 by 40 frame with radii of 8, 40, 8 and 40, clockwise from the top left. Two of those radii are larger than half the height. Before reading on, work out what each tool does with the 40s.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 250" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>The same 160 by 40 shape with stored radii 8, 40, 8, 40, drawn at 2x. Figma renders the 8px corners at 8 and clamps each 40px corner alone to 20. CSS scales every radius by 40/48, giving 6.67 and 33.3.</title><rect width="880" height="250" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="249" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">Radii 8, 40, 8, 40 on a 160 by 40 box (drawn at 2x)</text><line x1="440" y1="58" x2="440" y2="230" stroke="#E3DFD8"/><text x="32" y="76" font-size="12.5" fill="#1C1B19">Figma renders</text><text x="466" y="76" font-size="12.5" fill="#1C1B19">CSS renders</text><path d="M76 100 H340 A40 40 0 0 1 380 140 V164 A16 16 0 0 1 364 180 H100 A40 40 0 0 1 60 140 V116 A16 16 0 0 1 76 100 Z" fill="#9FB4C2"/><path d="M513.33 100 H753.33 A66.67 66.67 0 0 1 820 166.67 V166.67 A13.33 13.33 0 0 1 806.67 180 H566.67 A66.67 66.67 0 0 1 500 113.33 V113.33 A13.33 13.33 0 0 1 513.33 100 Z" fill="#D9A97E"/><text x="220" y="214" font-size="11.5" fill="#77726B" text-anchor="middle">8 stays 8; each 40 clamps on its own to 20</text><text x="660" y="214" font-size="11.5" fill="#77726B" text-anchor="middle">Every radius scaled by 40/48: 6.67 and 33.3</text></svg>

Figma clamps each 40 to 20 on its own and leaves the 8s alone, while storing 8 and 40. CSS shrinks every corner, the small ones included.

The rule is in the Backgrounds specification: if adjacent radii on any side add up to more than the side, every radius is multiplied by the smallest ratio of side length to radius sum. Here the short side is 40 and the radii on it add to 48, so CSS multiplies every radius by 40/48.

| Corner | Stored | Figma renders | CSS renders |
|---|---|---|---|
| Top-left, bottom-right | 8 | 8 | 6.67 |
| Top-right, bottom-left | 40 | 20 | 33.3 |

With equal radii the rules agree. The difference appears in mixed-radius shapes such as tabs and chat bubbles.

**Pills** have a separate trap. A CSS percentage radius refers to width horizontally and height vertically, so `50%` on a non-square box is an ellipse, and Figma has no percentage radius at all. A large pixel value works in both.

The convergence on that value is near-total. Primer `borderRadius-full`, Material `md.sys.shape.corner.full`, Polaris `border-radius-full` and Atlassian `radius.full` are 9999px, and Fluent `borderRadiusCircular` is 10000px. Spectrum's `corner-radius-1000` is a 0.5 multiplier its pipeline resolves, and Atlassian's `radius.tile` is 25%, which Figma can't express.

**Smoothing** is the third. Figma's `cornerSmoothing` (0 to 1; 60% matches Apple's iOS 7 squircle) lengthens the curve. CSS Borders 4 adds `corner-shape` (`round`, `squircle` as `superellipse(2)`, `bevel`, `scoop`, `notch`, `square`, `superellipse(n)`), which needs a `border-radius`, and which background, border, outline, shadow and overflow all follow.

`corner-shape` ships in Chrome and Edge from 139 and in Firefox 162, and in Safari only in Technology Preview. Even `squircle` won't match 60%, because `superellipse()` doesn't lengthen the curve. On Apple platforms the native match is SwiftUI's continuous corner style.

Change Figma for radii: give each component radii that fit the smallest size it takes, and one full-radius variable at 9999. **For pills, bind the radius to the 9999 variable, never a percentage.** Keep smoothing different: zero on web components, `corner-shape` as progressive enhancement behind `@supports` where a product wants the look, and smoothing kept for iOS.

---

## Clipping, opacity, blend modes

Clip content is close to `overflow: clip`, layer opacity is `opacity` and fill opacity a translucent colour, but blend modes are where the models part: a Figma fill blends with whatever is behind the layer, CSS `background-blend-mode` only with the box's own backgrounds.

The Card's thumbnail is clipped to the card's curve, and its overlay uses Multiply to darken the photo. The clip carries over. The blend might not.

**Clipping** first. CSS clips at the curved padding edge, inside the border. Figma documents only that Clip content hides what extends past the bounds. Tested directly, a clipped 24px-radius frame trimmed a square child to the curve, and a frame with an 8px inside stroke painted the stroke over a full-bleed child. The visible result is the same as CSS.

The choice of CSS value matters. `overflow: hidden` also creates a scroll container: scrollable by script, and the containing block for sticky children. `overflow: clip` doesn't. Where an image sits inside a bordered, rounded frame, both tools draw its inner radius as the outer radius minus the border.

**Blending** is where they part. Figma's default layer mode, Pass through, lets children's blend modes reach content below the parent; Normal stops them, which is CSS `isolation: isolate`. CSS has no pass-through value. Its default behaves like pass-through until something creates a stacking context, and opacity below 1, a transform, a filter or a z-index all do.

So a Figma frame at 90% opacity with a Multiply child may blend with the page in Figma (undocumented), and is always isolated in CSS. The CSS construction that matches a Figma fill blend is a pseudo-element carrying the fill with `mix-blend-mode`. CSS lacks Plus darker.

> **Aside.** Figma's September 2026 release added opacity over any colour through a number variable. In CSS that's relative colour syntax, `rgb(from var(--c) r g b / var(--a))`.

Translate Clip content to `overflow: clip` unless the box scrolls. Translate fill opacity to a translucent colour token, not `opacity`, which fades the content too, and a fill blend to a pseudo-element. Then change Figma: **set a component's root layer to Normal whenever a child blends**, and avoid blend modes outside the CSS list.

---

## Gradients and colours

Gradients differ for three causes (premultiplied alpha, radial geometry, the missing diamond) and colours for one: a hex value from a Display P3 file renders duller in CSS, which reads every hex as sRGB.

The Card's header has a gradient from opaque `#FF6A00` to `#0050FF` at zero opacity. In Figma the midpoint has a blue cast. In the browser it doesn't.

That's premultiplied alpha. CSS always premultiplies alpha, so a colour at zero opacity contributes no hue. Figma's documentation is silent, but users report it doesn't premultiply, which is where the blue comes from.

The interpolation space can differ as well. CSS Color 4 interpolates gradients written with legacy sRGB colours in gamma-encoded sRGB, as Figma does. Gradients written with modern functions such as `oklch()` interpolate in Oklab by default, which gives a different midpoint.

Radial geometry differs too. A March 2026 forum report shows a 272 by 56 radial gradient, circular in Figma, exported by Dev Mode as `radial-gradient(183.69% 86.67% at ...)` and rendering much wider in Chrome. Angular gradients map to `conic-gradient`, which starts at twelve o'clock, and diamond gradients have no counterpart.

The colour cause sits in the file's profile. New Figma files default to sRGB; Unmanaged was retired in 2023. Changing a profile offers assign, where the hex stays and the appearance changes, or convert, where the appearance stays and the hex changes. Figma copies P3 colours as `color(display-p3 r g b / a)`.

Change Figma first: **fade to the same hue at zero opacity, or add an explicit midpoint stop, which removes the premultiplication difference entirely.** Avoid diamond gradients. Keep library files in sRGB unless the pipeline emits `color(display-p3)` or `oklch()`, and convert rather than assign. Then translate: give radial gradients explicit sizes, and write `in srgb` on gradients built from OKLCH tokens to match what the designer saw.

---

## Text rendering

Text looks different mostly because of rasterisation, which nobody controls; the controllable causes are font files, weights the code doesn't ship, optical sizing, and settings Figma records but CSS needs written out.

The Card's title looks heavier in the browser on a Windows laptop, and its large heading looks heavier everywhere. The first is rasterisation; the second is something the team can fix.

Figma's canvas renders text the same everywhere. Browsers use Core Text on macOS and DirectWrite with ClearType on Windows, and Windows renders heavier. The CSS levers, `-webkit-font-smoothing` and `-moz-osx-font-smoothing`, are non-standard, macOS-only and advised against by MDN.

Optical size is controllable. `font-optical-sizing: auto` uses a font's `opsz` axis to thin large headings, so a static instance in code against a variable font in Figma renders headings at a different weight. That's the heavier heading.

The rest is a list of settings that don't carry over on their own:

- **Weights.** Figma lists only styles a font file contains, while browsers fake a missing bold or italic through `font-synthesis`. A Figma weight of 550 needs a variable font in code; static files snap to 500 or 600.
- **Underlines.** Figma exposes style, offset and thickness in pixels, percent or auto, and skip ink. CSS has `text-decoration-style` (adding double and dashed), `text-underline-offset`, `text-decoration-thickness` and `text-decoration-skip-ink`. Auto values can differ by a pixel, and what Figma's percent is measured against is undocumented.
- **Case.** Figma's Capitalize is CSS `text-transform: capitalize`, which MDN is explicit is not title case. Small caps are `font-variant-caps`.
- **OpenType.** Figma records only features turned on or off explicitly, such as tabular numbers; code has to set them (`font-variant-numeric: tabular-nums`).
- **Paragraphs and lists.** They live inside one Figma text layer, and on separate elements in code, where spacing becomes a margin (which can collapse) or a gap. Hanging punctuation is Safari-only.

Start by confirming your code loads the same font files, variable or static, then exclude antialiasing from pixel comparisons. In Figma, restrict text styles to weights the code loads, write underline offset and thickness as explicit values, and put real title case in the content. In code, set `font-synthesis: none`, so a missing file shows as an error rather than a faked style; export explicit OpenType features into the type tokens; and map paragraph and list spacing to margin and gap tokens. **Load the real fonts in the measuring browser and assert the family that rendered**: the toolkit's parity loop adds that check because a fallback face once measured close enough to pass.

---

## Images, masks and icons

Image Fill is `object-fit: cover`, not `fill`; a Figma mask belongs to the layers above it, a CSS mask to the element it masks; and icon strokes scale by opposite defaults in the two tools.

The Card's thumbnail uses Figma's Fill, its avatar is masked to a circle, and its corner icon is a 24px glyph with a 2px stroke, resized to 16 in the compact card. All three need a decision.

**Images.** Figma's Fill crops to cover, which is `object-fit: cover`; CSS `object-fit: fill` stretches. Crop needs `object-position` with overflow, or a pre-cropped asset, and Tile exists only as `background-repeat`. Figma's image adjustments (exposure, contrast, saturation, temperature, tint, highlights, shadows) apply per paint. CSS `filter` has brightness, contrast and saturation on whole elements, with different curves.

**Masks.** A vector mask becomes `clip-path`, an alpha mask `mask-image`, and the common rounded-rectangle mask is `overflow: clip` with a radius.

One trap is the toolkit's. A render of a node with an image fill returns the visible crop flattened, so transparent artwork has to come from the raw upload, with the crop rebuilt in CSS. One project shipped two hero images with baked white backgrounds that way (`standards/code-standard.md`, rule 26).

**Icons.** In Figma, resizing an instance whose constraints are Scale grows the geometry but keeps the stroke weight. So the 24px icon with a 2px stroke looks heavier at 16 and lighter at 32. An SVG scaled through its `viewBox` scales its stroke, unless `vector-effect: non-scaling-stroke` is set.

SVG supports only centre strokes, so inside or outside strokes are converted on export, and code can no longer recolour them as strokes. And an icon with a hard-coded fill needs a separate colour per state in code, where `fill="currentColor"` would inherit hover and disabled for free.

Most of this is fixed in Figma. Use Fill or Fit for image fills, bake adjustments into the asset, and use a clipped frame instead of a rectangle mask. **Draw each icon as one vector on a fixed square frame equal to the code's `viewBox`, with one fill bound to a variable that code maps to `currentColor`.** Outline centre strokes before export, or keep them with a stated scaling rule.

---

## Auto layout and flexbox

Auto layout is closer to flexbox than ever on frames updated to the July 2026 version, and still different in specific ways: Fill shares space equally where CSS won't shrink an item below its content, negative gaps need margins, wrapping and baselines decide differently, and responsive grids exist only in code.

The Card's footer is a 400px row with a 16px gap and two Fill children. Child A holds the word "Short"; child B holds a 300px unbreakable URL. Here is what each tool does with it, drawn at 1.3 times its size.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 290" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>A 400px row with a 16px gap and two Fill children, drawn at 1.3x. Figma: A and B each get 192px, and B's 300px URL overflows past its box. CSS with flex 1 1 0: B takes its 300px minimum and A gets the remaining 84px.</title><rect width="880" height="290" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="289" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">A 400px row, 16px gap, two Fill children (drawn at 1.3x)</text><text x="32" y="117" font-size="12.5" fill="#1C1B19">Figma: equal share</text><rect x="180" y="90" width="520.0" height="44" fill="none" stroke="#CFC9BF" stroke-dasharray="4 3"/><rect x="180" y="90" width="249.60000000000002" height="44" fill="#FFFFFF" stroke="#5E7E93"/><text x="190" y="117" font-size="12" fill="#3F3C37">A: Short, 192px</text><rect x="450.40000000000003" y="90" width="249.60000000000002" height="44" fill="#FFFFFF" stroke="#A6552F"/><rect x="456.40000000000003" y="106" width="378.0" height="12" rx="3" fill="#D9A97E" fill-opacity="0.75"/><text x="456.40000000000003" y="152" font-size="11.5" fill="#77726B">B: 192px; the bar is the 300px URL</text><text x="32" y="217" font-size="12.5" fill="#1C1B19">CSS: flex: 1 1 0</text><rect x="180" y="190" width="520.0" height="44" fill="none" stroke="#CFC9BF" stroke-dasharray="4 3"/><rect x="180" y="190" width="109.2" height="44" fill="#FFFFFF" stroke="#5E7E93"/><text x="190" y="217" font-size="12" fill="#3F3C37">A: Short, 84px</text><rect x="310.0" y="190" width="390.0" height="44" fill="#FFFFFF" stroke="#A6552F"/><rect x="316.0" y="206" width="378.0" height="12" rx="3" fill="#D9A97E" fill-opacity="0.75"/><text x="316.0" y="252" font-size="11.5" fill="#77726B">B: 300px; the bar is the 300px URL</text><text x="180" y="276" font-size="11.5" fill="#77726B">The dashed outline is the 400px row.</text></svg>

Figma gives each child 192px, and the URL overflows inside B. CSS with `flex: 1 1 0` gives B its 300px minimum and A the remaining 84px.

**Fill and Hug.** Figma's Fill children share the space equally, by border box under the new version. CSS flex items have an automatic minimum size and don't shrink below min-content, which is why B won't. MUI's Stack documentation names this bug and its fix, `min-width: 0`.

A Figma Hug item never shrinks; a CSS content-sized item (`flex: 0 1 auto`) does. Dev Mode, per a 2025 secondary source, emits Fill as `flex: 1 0 0`, which still carries the automatic minimum.

**Spacing and wrap.** Min and max sizes match in positive pixels; CSS adds percentages Figma can't express. Between, Evenly and Around are `space-between`, `space-evenly` and `space-around`. Under the new version a lone child in a Between frame aligns to the start, as in CSS, while Around and Evenly still centre it.

Figma allows a negative gap, described as intentional overlap, for avatar stacks. CSS `gap` can't be negative, so a gap of minus 8 becomes `margin-inline-start: -8px` on every child but the first. And a wrapping Figma frame breaks lines from drawn widths, while a CSS Fill child with a zero basis has no width of its own to force a wrap.

**Position and order.** A child set to ignore auto layout (`layoutPositioning: ABSOLUTE`) is `position: absolute` in a positioned parent, and Scale constraints map only to percentage insets. Figma's "first on top" reverses painting without changing layer order. CSS needs `z-index` per child, because reversing the flex direction also reverses reading order against the DOM.

The toolkit reads absolute positions with suspicion. Outside an auto-layout frame, a layer placed at x=412 usually means "here, in this frame", not `position: absolute` (`knowledge/code/figma-handoff.md#what-to-trust-in-a-design-file-and-what-not`).

**Baselines, grids and truncation.** Baseline alignment matches for text-only rows. How Figma treats a child without text is undocumented, while CSS synthesises a baseline from the box edge.

Figma's grid has Flex tracks (like `fr`), Fixed and Hug (like `fit-content(100%)`), spans and gaps. It has no `minmax()`, `repeat(auto-fit, …)`, named areas or subgrid, so `repeat(auto-fit, minmax(240px, 1fr))` can only be drawn as separate frames per column count.

Truncation is the three-property recipe for one line, and `-webkit-line-clamp` for several; the unprefixed `line-clamp` isn't yet Baseline. Inside a flex row, CSS needs `min-width: 0` for the ellipsis to appear, and Figma doesn't.

In Figma, update library frames to the current version, use baseline alignment only between text layers, and use the truncation setting rather than a fixed-height box, which only clips. In code, **write Fill as `flex: 1 1 0; min-width: 0`**, Hug that mustn't shrink as `flex-shrink: 0`, negative gaps as margins, `z-index` for first-on-top, and `min-width: 0` beside every truncation in a row. Keep two things different: content-weighted growth (`flex: auto`) and responsive grids, which the spec states as a rule, the minimum column width. Figma's own 2020 aim was auto layout as a thoughtful subset of flexbox; these are the parts it left out.

---

## Cheat sheet

| Case | Figma | Code | Action |
|---|---|---|---|
| [Frame shadow source](#frame-shadows) | frame plus children unless clipped | `box-shadow` from the box | Change Figma: clip and fill |
| [Shadow spread](#frame-shadows) | filled, clipped frames and basic shapes | any box | Change Figma: same |
| [Inner shadow](#inner-shadows) | paints over children (tested) | under children | Translate: overlay pseudo-element |
| [Several shadows](#shadow-stacking-order) | API array: last on top (tested) | first on top | Translate: reverse once |
| [Shadow blur](#blur-values) | about 12% softer | radius = 2 × std dev | Keep: copy 1:1 |
| [Background, layer blur](#blur-values) | double the CSS value | `backdrop-filter`, `filter` | Translate: halve |
| [Glass, progressive blur, noise](#glass-and-progressive-blur) | native | no primitive | Keep: out of libraries |
| [Stroke alignment](#stroke-alignment) | inside counted (new version) | the room-taking channel | Change Figma; rule 63 mapping |
| [Focus ring](#focus-rings) | ring layer around the box | `outline`, offset `clear − width` | Translate; element keeps its radius |
| [Dashed, gradient strokes](#dashed-gradient-hairline-strokes) | exact pattern; follows radius | browser-chosen; `border-image` square | Keep, or SVG / two backgrounds |
| [Hairline 0.5px](#dashed-gradient-hairline-strokes) | drawn exactly | snapped to device pixels | Keep: "one device pixel" |
| [Oversized mixed radius](#radii-and-corner-smoothing) | each corner alone (tested) | all scaled together | Change Figma: radii that fit |
| [Pill](#radii-and-corner-smoothing) | no percentage | `50%` is an ellipse | Change Figma: 9999 |
| [Corner smoothing](#radii-and-corner-smoothing) | 0 to 100% | `corner-shape`, no stable Safari | Keep: 0 on web |
| [Clip content](#clipping-opacity-blend-modes) | stroke over children (tested) | `overflow: clip` | Translate |
| [Fill blend, pass through](#clipping-opacity-blend-modes) | blends with layers behind | own backgrounds only; stacking contexts isolate | Translate; Normal on roots |
| [Fade to transparent](#gradients-and-colours) | not premultiplied (reported) | premultiplied | Change Figma: same hue |
| [Colour profile](#gradients-and-colours) | sRGB or P3 per file | hex is sRGB | Change Figma: sRGB |
| [Text rendering, weights](#text-rendering) | same on every OS; real styles only | OS rasteriser; synthesis | Keep after checking files; `font-synthesis: none` |
| [Image Fill, masks](#images-masks-and-icons) | crop to cover; mask clips layers above | `object-fit: cover`; property of masked element | Translate; clipped frame |
| [Icon colour and strokes](#images-masks-and-icons) | fixed fill; stroke kept on resize | `currentColor`; scales with `viewBox` | Change Figma: one bound colour, one rule |
| [Fill](#auto-layout-and-flexbox) | equal share | content minimum applies | Translate: `flex: 1 1 0; min-width: 0` |
| [Negative gap](#auto-layout-and-flexbox) | allowed | not allowed | Translate: negative margin |
| [Responsive grid](#auto-layout-and-flexbox) | fixed column counts | `auto-fit`, `minmax()` | Keep: state the rule |
| [Truncation in a row](#auto-layout-and-flexbox) | works alone | needs `min-width: 0` | Translate |

---

## The short version

Figma draws a layer from everything it holds; CSS draws a box from its own edges. That's why an unclipped frame's shadow follows its children, why an inner shadow paints over content in Figma and under it in the browser, why spread needs a filled, clipped frame, and why a Figma mask belongs to the layers above it rather than to the element it masks.

The fixes that live in your Figma file are few and cheap. Clip and fill every frame that carries a shadow. Use inside strokes for borders and outside strokes for rings, on frames updated to the July 2026 auto layout. Give mixed radii values that fit, and pills 9999. Fade gradients to the same hue, keep files in sRGB, use only the weights the code ships, and draw icons on a square frame with one bound colour.

The translations belong in one place, done once: reverse the effects array, halve background and layer blur, map each stroke to the channel that takes the same room, draw rings as offset outlines that keep the element's radius, map Clip content to `overflow: clip`, put a fill's blend on a pseudo-element, and write Fill as `flex: 1 1 0; min-width: 0`.

What stays different is what CSS has no primitive for (glass, progressive blur, diamond gradients), what the browser decides (dash patterns, hairline widths, rasterisation) and what hasn't shipped everywhere (corner smoothing, until Safari ships `corner-shape`). Three behaviours no documentation states were confirmed by test and matter most, because each looks like a code bug and isn't: a frame's shadow is cast by its children unless it clips, an inner shadow paints over children, and an oversized radius is clamped corner by corner.

---

## What to re-check later

Researched October 2026; re-checked November 2026.

- **How the evidence was gathered.** Figma mechanics were checked against the Plugin API and REST documentation, the help centre, Figma's engineering blog and staff answers on its forum. CSS behaviour was checked against the CSSWG specifications and MDN. Design system evidence comes from each system's own token source: Primer, Atlassian, Polaris, Carbon, Material 3, Fluent 2, Spectrum, MUI and Braid. The toolkit's own measurements were taken by its parity loop on two projects.
- **Re-read in November 2026.** Figma's help article on auto layout with flexbox in mind (the dates and stroke rules hold), and `corner-shape` support on caniuse (Chrome and Edge 139, Firefox 162, Safari still Technology Preview only).
- **Auto layout versions.** Legacy frames keep the old behaviour until updated; from January 2027 the toggle becomes an Update button. Re-check whether legacy behaviour survives at all after that.
- **`corner-shape`.** Safari stable support; when it ships, the advice on [corner smoothing](#radii-and-corner-smoothing) changes.
- **`line-clamp`.** Unprefixed form not yet Baseline.
- **Outline corners under an offset.** Unspecified (csswg-drafts #8786); the toolkit's measurement is Chromium only.
- **Dev Mode CSS for auto layout.** The `flex: 1 0 0` mapping comes from a 2025 secondary source, before the July 2026 version.
- **Tested once.** Six behaviours no documentation states were tested directly on a scratch file on 1 October 2026: shadow source and Clip content, inner shadow over children, stroke over children, clip following radius, per-corner clamping and effects-array order. Each was tested once, in one file; a renderer change could alter any of them.
- **Not verified.** Whether Figma premultiplies gradient alpha (one community report says not); its rounding of fractional strokes; pass-through children under a translucent frame; baselines for children without text; the corner join of unequal side strokes; cross-browser support for an SVG filter referenced from `backdrop-filter`.
- **Evidence quality.** The blur factors rest on one third-party measurement (Bjango) and one Figma staff answer. No published user research on design-code rendering drift was found.

---

## Sources

**Primary: Figma**

- [Plugin API: Effect](https://developers.figma.com/docs/plugins/api/Effect/)
- [Plugin API: node properties](https://developers.figma.com/docs/plugins/api/node-properties/)
- [Plugin API: FrameNode](https://developers.figma.com/docs/plugins/api/FrameNode/)
- [Plugin API: Paint](https://developers.figma.com/docs/plugins/api/Paint/)
- [Plugin API: strokeAlign](https://developers.figma.com/docs/plugins/api/properties/nodes-strokealign/)
- [Plugin API: strokesIncludedInLayout](https://developers.figma.com/docs/plugins/api/properties/nodes-strokesincludedinlayout/)
- [Plugin API: cornerSmoothing](https://developers.figma.com/docs/plugins/api/properties/nodes-cornersmoothing/)
- [Plugin API: GridTrackSize](https://developers.figma.com/docs/plugins/api/GridTrackSize/)
- [Plugin typings 1.140.0](https://unpkg.com/@figma/plugin-typings@1.140.0/plugin-api.d.ts)
- [Help: Use auto layout with CSS Flexbox in mind](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind)
- [Help: Guide to auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)
- [Help: Grid auto layout flow](https://help.figma.com/hc/en-us/articles/31289469907863-Use-the-grid-auto-layout-flow)
- [Help: Apply effects to layers](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)
- [Help: Apply strokes to layers](https://help.figma.com/hc/en-us/articles/360049283914-Apply-strokes-to-layers)
- [Help: Adjust corner radius and smoothing](https://help.figma.com/hc/en-us/articles/360050986854-Adjust-corner-radius-and-smoothing)
- [Help: Frames in Figma Design](https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma-Design)
- [Help: Blend modes](https://help.figma.com/hc/en-us/articles/360040667874-Apply-blend-modes-to-layers-fills-and-effects)
- [Help: Manage color profiles](https://help.figma.com/hc/en-us/articles/360039825114-Manage-color-profiles-in-design-files)
- [Help: Color models](https://help.figma.com/hc/en-us/articles/360043042113-Color-models-in-Figma-Design)
- [Help: Explore text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)
- [Help: Scale layers while maintaining proportions](https://help.figma.com/hc/en-us/articles/360040451453-Scale-layers-while-maintaining-proportions)
- [Blog: Behind the feature, shadow spread](https://www.figma.com/blog/behind-the-feature-shadow-spread/)
- [Blog: The making of the new auto layout](https://www.figma.com/blog/behind-the-feature-the-making-of-the-new-auto-layout/)
- [Release notes](https://www.figma.com/release-notes/)
- [Forum, staff answer: background blur in Dev Mode](https://forum.figma.com/ask-the-community-7/background-blur-is-different-in-dev-mode-22642)
- [Forum, staff answer: layered box-shadow order](https://forum.figma.com/ask-the-community-7/layered-box-shadow-order-is-reversed-in-dev-mode-12290)
- [Forum, staff answer: spread without fill or clip](https://forum.figma.com/ask-the-community-7/why-figma-not-supporting-spread-function-for-without-fill-component-and-frames-22505)
- [Forum: variables bound to new fields (effects)](https://forum.figma.com/product-updates-3/variables-can-now-be-bound-to-new-fields-in-figma-13940)

**Primary: specifications and MDN**

- [CSS Backgrounds and Borders 3](https://www.w3.org/TR/css-backgrounds-3/)
- [CSS Values 4 (line width snapping)](https://drafts.csswg.org/css-values-4/)
- [CSS UI 4 (outline)](https://drafts.csswg.org/css-ui-4/)
- [CSS Color 4 (interpolation)](https://drafts.csswg.org/css-color-4/)
- [CSS Images 4](https://www.w3.org/TR/css-images-4/)
- [Compositing and Blending 1](https://www.w3.org/TR/compositing-1/)
- [csswg-drafts #8786: outline corners under offset](https://github.com/w3c/csswg-drafts/issues/8786)
- [MDN: drop-shadow()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/drop-shadow)
- [MDN: blur()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/blur)
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)
- [MDN: overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow)
- [MDN: isolation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/isolation)
- [MDN: color-interpolation-method](https://developer.mozilla.org/en-US/docs/Web/CSS/color-interpolation-method)
- [MDN: border-radius](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius)
- [MDN: border-image](https://developer.mozilla.org/en-US/docs/Web/CSS/border-image)
- [MDN: corner-shape](https://developer.mozilla.org/en-US/docs/Web/CSS/corner-shape)
- [MDN: outline](https://developer.mozilla.org/en-US/docs/Web/CSS/outline)
- [MDN: outline-offset](https://developer.mozilla.org/en-US/docs/Web/CSS/outline-offset)
- [MDN: flex](https://developer.mozilla.org/en-US/docs/Web/CSS/flex)
- [MDN: min-width](https://developer.mozilla.org/en-US/docs/Web/CSS/min-width)
- [MDN: gap](https://developer.mozilla.org/en-US/docs/Web/CSS/gap)
- [MDN: line-clamp](https://developer.mozilla.org/en-US/docs/Web/CSS/line-clamp)
- [MDN: font-smooth](https://developer.mozilla.org/en-US/docs/Web/CSS/font-smooth)
- [MDN: font-optical-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/font-optical-sizing)
- [MDN: font-synthesis](https://developer.mozilla.org/en-US/docs/Web/CSS/font-synthesis)
- [MDN: text-transform](https://developer.mozilla.org/en-US/docs/Web/CSS/text-transform)
- [MDN: text-underline-offset](https://developer.mozilla.org/en-US/docs/Web/CSS/text-underline-offset)
- [MDN: object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
- [MDN: mask-image](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image)
- [MDN: multiple backgrounds](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Backgrounds_and_borders/Using_multiple_backgrounds)
- [MDN: vector-effect](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/vector-effect)
- [MDN: forced-colors](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)
- [caniuse: corner-shape](https://caniuse.com/mdn-css_properties_corner-shape)

**Primary: design systems**

- [Primer primitives: shadow tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/shadow/shadow.json5)
- [Primer primitives: radius tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/radius.json5)
- [Atlassian: elevation](https://atlassian.design/foundations/elevation)
- [Atlassian: radius](https://atlassian.design/foundations/radius)
- [Polaris tokens: shadow](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/shadow.ts)
- [Polaris tokens: border](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/border.ts)
- [Polaris: bevel mixin](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-react/postcss-mixins/shadow-bevel.js)
- [Material Web: elevation tokens](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/latest/sass/_md-sys-elevation.scss)
- [Material Web: shape tokens](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/latest/sass/_md-sys-shape.scss)
- [Fluent: shadow tokens](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/utils/shadows.ts)
- [Fluent: border radius tokens](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/global/borderRadius.ts)
- [Spectrum: layout tokens](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/src/layout.json)
- [MUI: shadows source](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/shadows.js)
- [MUI: NotchedOutline source](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/OutlinedInput/NotchedOutline.js)
- [MUI: Stack](https://mui.com/material-ui/react-stack/)
- [Untitled UI: shadows and blurs](https://www.untitledui.com/components/shadows-blurs)
- [untitleduico/react](https://github.com/untitleduico/react)

**The toolkit's own tested rules**

- `standards/code-standard.md`, rules 25, 26 and 63 (stroke channels on 1,946 real nodes)
- `knowledge/code/figma-handoff.md` (strokes; focus rings, Chromium test of 25 October 2026; what to trust)
- `skills/design-code-parity/SKILL.md` (fonts in the measuring browser)

**Commentary and measurement**

- [Bjango: blur radius comparison (measured)](https://bjango.com/articles/blurradiuscomparison/)
- [Tokens Studio: box shadow (known order issue)](https://docs.tokens.studio/manage-tokens/token-types/box-shadow)
- [Figma forum: fonts look different in the browser](https://forum.figma.com/ask-the-community-7/css-summary-why-fonts-look-different-in-figma-vs-the-browser-thinner-bolder-wrong-stroke-width-etc-54711)
- [Figma forum: gradient with opacity](https://forum.figma.com/ask-the-community-7/wrong-gradient-behavior-with-opacity-36185)
- [Figma forum: radial gradient vs CSS](https://forum.figma.com/report-a-problem-6/radial-gradient-in-figma-vs-css-52184)
- [Figma forum: stroke scaling in icons](https://forum.figma.com/suggest-a-feature-11/feature-request-proper-stroke-scaling-for-icons-inside-components-53897)
- [Zenn: Dev Mode CSS output for auto layout (2025)](https://zenn.dev/ncdc/articles/8cd9a7d2166379)
- [Nearform: Figma grid auto layout (June 2025, partly superseded)](https://nearform.com/digital-community/figmas-new-grid-auto-layout-what-it-does-and-doesnt-yet-do/)
- [slint issue 13749: Figma frame shadows from children](https://github.com/slint-ui/slint/issues/13749)
