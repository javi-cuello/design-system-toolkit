# Where Figma and CSS render differently

Why a component's shadows, strokes and corners look right in Figma and render differently in the browser, and for each case whether to change the file, translate in code or keep the difference.

Part 1 of 2. [Part 2](where-figma-and-css-render-differently-part-2.md) covers clipping, colour, text, images and auto layout.

A developer builds the library's Card from its Figma spec and puts it beside the design. The shadow is rounder in the browser, the bordered button is two pixels taller, and the inner shadow that tinted the image in Figma has vanished under it. Every value was copied exactly. Nothing was copied wrong.

Most of these differences come from one fact: Figma draws a layer from everything it holds, while CSS draws a box from its own edges. This part follows that fact through shadows, blur, strokes and radii.

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

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole part in three paragraphs.

Every case ends with one of three actions:

- **Change Figma.** Figma has a setting that matches code, and the library isn't using it.
- **Translate in code.** The two tools say the same thing in different terms; one known conversion, applied once.
- **Keep different.** One side has a capability the other lacks; it's recorded as a named deviation.

Line height and letter spacing are in [line height and letter spacing from Figma to CSS](../foundations/line-height-letter-spacing-figma-to-css.md), right-to-left in [right-to-left design systems](../accessibility/rtl-design-systems.md), and which names should match in [how closely Figma should match code](how-closely-figma-should-match-code.md).

---

## Frame shadows

A frame's shadow changes shape because a Figma drop shadow on a frame is cast by everything the frame renders, children included, unless Clip content is on, while CSS `box-shadow` is cast by the element's own rounded box and never by its children.

Take the Card: a 160 by 120 frame, white fill, 24px radius, a solid shadow offset 12px, and a 60 by 60 thumbnail in its bottom-left corner. Here it is with Clip content off and on, as tested directly.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 300" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Two copies of a 160 by 120 frame with a 24px radius, a solid shadow offset 12px and a square child in the bottom-left corner. Clip content off: the child's square corner pokes past the rounded edge and the shadow under it is square. Clip content on: the child is trimmed to the curve and the shadow follows the frame's rounded shape.</title><rect width="880" height="300" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="299" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">The same frame, Clip content off and on</text><line x1="440" y1="58" x2="440" y2="272" stroke="#E3DFD8"/><path d="M192 98 H304 A24 24 0 0 1 328 122 V194 A24 24 0 0 1 304 218 H192 A24 24 0 0 1 168 194 V122 A24 24 0 0 1 192 98 Z" fill="#BDB7AD"/><rect x="168" y="158" width="60" height="60" fill="#BDB7AD"/><path d="M180 86 H292 A24 24 0 0 1 316 110 V182 A24 24 0 0 1 292 206 H180 A24 24 0 0 1 156 182 V110 A24 24 0 0 1 180 86 Z" fill="#FFFFFF" stroke="#CFC9BF"/><rect x="156" y="146" width="60" height="60" fill="#9FB4C2"/><path d="M622 98 H734 A24 24 0 0 1 758 122 V194 A24 24 0 0 1 734 218 H622 A24 24 0 0 1 598 194 V122 A24 24 0 0 1 622 98 Z" fill="#BDB7AD"/><path d="M610 86 H722 A24 24 0 0 1 746 110 V182 A24 24 0 0 1 722 206 H610 A24 24 0 0 1 586 182 V110 A24 24 0 0 1 610 86 Z" fill="#FFFFFF" stroke="#CFC9BF"/><clipPath id="clip-on"><path d="M610 86 H722 A24 24 0 0 1 746 110 V182 A24 24 0 0 1 722 206 H610 A24 24 0 0 1 586 182 V110 A24 24 0 0 1 610 86 Z"/></clipPath><rect x="586" y="146" width="60" height="60" fill="#9FB4C2" clip-path="url(#clip-on)"/><text x="32" y="72" font-size="12.5" fill="#1C1B19">Clip content off</text><text x="466" y="72" font-size="12.5" fill="#1C1B19">Clip content on</text><text x="236" y="250" font-size="11.5" fill="#77726B" text-anchor="middle">The child's square corner pokes past the curve,</text><text x="236" y="266" font-size="11.5" fill="#77726B" text-anchor="middle">and the shadow comes out square there</text><text x="666" y="250" font-size="11.5" fill="#77726B" text-anchor="middle">The child is trimmed to the 24px curve,</text><text x="666" y="266" font-size="11.5" fill="#77726B" text-anchor="middle">and the shadow follows the frame, like box-shadow</text></svg>

With Clip content off, the child's square corner shows past the rounded edge, and the shadow under it comes out square. With it on, child and shadow both follow the 24px curve.

Figma's engineering blog describes the method: copy the layer's geometry, fill it with one colour, blur it, draw it underneath. For a frame, that geometry is the frame plus its visible content. CSS draws an outer `box-shadow` from the border box, following `border-radius`, and nothing inside changes it; the function that follows content is `filter: drop-shadow()`.

| Figma frame | Shadow cast from | CSS equivalent |
|---|---|---|
| Fill, radius, Clip content **on** | the frame's rounded shape | `box-shadow` |
| Clip content **off**, child overflowing | frame plus every visible child | `filter: drop-shadow()` |
| No fill | the children only | `filter: drop-shadow()` |

**Show behind transparent areas** (`showShadowBehindNode`) appears only when a fill is translucent or absent. Off matches `box-shadow`, cut out under the box; on matches `drop-shadow()`.

Spread follows the same model. The Plugin API allows it only on rectangles, ellipses, and frames, components and instances with a visible fill and Clip content on. The values that need it aren't exotic: Primer's `shadow.floating.small` opens with a `0 0 0 1px` ring, Polaris's `shadow-300` is `0px 4px 6px -2px`, Material's level 1 ambient is `0 1px 3px 1px`. On an unfilled or unclipped frame each renders as if spread were zero, and `drop-shadow()` has no spread either.

This one is a Figma fix. **Give every frame that carries an elevation shadow Clip content on, a visible fill, and Show behind transparent areas off.** Its silhouette is then the border box `box-shadow` produces, and spread works. Keep a content-shaped shadow only where the design needs one (an icon, a sticker), and say so in the description, because code must use `drop-shadow()`. Every system's shadow tokens are `box-shadow` values, which settles which behaviour they expect.

---

## Inner shadows

In Figma an inner shadow covers the content, tested directly; CSS paints `box-shadow: inset` just above the background and below the content, so children cover it.

Back to the Card, now with a pressed state drawn as an inner shadow. In Figma, the shadow tints the thumbnail at its edges. In the browser, the thumbnail sits on top and hides it.

Figma's help gives a layer's own paint order (layer blur, stroke, inner shadow, fill, drop shadow, background blur), which matches CSS, but not where a frame's children sit. A test answered it: a clipped frame with a red 16px inner shadow and a full-width green child showed the red band across the green, tinting it brown.

Polaris shows what it takes to get the Figma behaviour in code. Its bevel, `--p-shadow-bevel-100`, is four one-pixel inset shadows on an absolutely positioned `::before` with `pointer-events: none`, the only way CSS puts an inset effect over children.

For a pressed surface with plain content, nothing visible changes, so leave it. Where the inset must read over an image, translate with an overlay pseudo-element and say so in the spec. **Where the inset should sit under content, change Figma: inset the content from the edge so the shadow isn't covered there either.**

---

## Shadow stacking order

In CSS the first shadow in the list paints on top; in Figma's effects array, as the Plugin API returns it, the last entry does (tested directly), so a pipeline that copies the array in order reverses the stack.

Most real shadow tokens have two or three layers (Fluent's `shadow16` is a `0 0 2px` ambient plus a `0 8px 16px` key; MUI's elevations have three each), and reversing key and ambient changes which edge looks crisp.

In the test, a frame carried two opaque drop shadows, red at 20px offset first and blue at 30px second; the blue painted over the red. The panel reportedly lists the front-most effect at the top, so panel order equals CSS order and the API array is the reverse of both. The bug has shipped: Dev Mode once emitted reversed CSS (reported fixed by Figma staff in March 2024), and Tokens Studio lists reversed order on import as a known issue.

Translate it once, in the export transform, with a test that a two-colour fixture comes out in order. **Reverse the effects array exactly once, where tokens are exported, and nowhere else.** The toolkit's token exporter writes effect layers in CSS paint order, top first (`skills/figma-token-export/`).

---

## Blur values

For drop shadows, a Figma blur is close enough to copy, since a Figma shadow blur renders about 12% sharper than the same number in `box-shadow`; for background and layer blur it isn't, because the CSS value is about half.

Say the Card's drop shadow has a blur of 16, and the modal behind it has a frosted backdrop with a background blur of 30. Copying both numbers straight into CSS leaves the shadow nearly right and the backdrop about twice as blurry as designed.

CSS uses two conventions. A `box-shadow` blur is a radius whose Gaussian standard deviation is half the value; `filter: blur()` and `backdrop-filter: blur()` take the standard deviation itself, so they are about twice as strong at the same number. Figma uses one convention for all three. Bjango's 2024 measurement found a Figma shadow blur of 16 matches a `box-shadow` blur of about 14, and a Figma staff answer says Dev Mode halves background blur, so 30 is 15 in CSS.

| Figma effect | Figma value | CSS property | CSS value that matches |
|---|---|---|---|
| Drop shadow blur | 16 | `box-shadow` blur | about 14 (copy 16) |
| Background blur | 30 | `backdrop-filter: blur()` | 15 |
| Layer blur | 30 | `filter: blur()` | about 13 to 15 |

Copy shadow blur one to one and write the tolerance down once. **Halve background and layer blur in the token transform, citing Figma's own rule.**

---

## Glass and progressive blur

Neither can be built with any CSS primitive; background blur translates, with one CSS-only trap.

A designer adds Figma's glass effect to a floating toolbar, with a progressive blur fading out at its bottom edge. The developer looks for the CSS property and doesn't find one.

Figma's API exposes a progressive blur (`blurType: 'PROGRESSIVE'`) and a glass effect with refraction, depth and dispersion, besides noise and texture. CSS has a uniform `backdrop-filter: blur()`. A progressive blur is bespoke work, stacked `backdrop-filter` layers under `mask-image` gradients; refraction would need an SVG filter referenced from `backdrop-filter` (cross-browser support unchecked).

The trap sits in plain background blur. `backdrop-filter` blurs only up to the nearest backdrop root, any ancestor with a filter, opacity below 1, a mask, a clip path, a blend mode or a backdrop filter of its own. So a blurred panel inside a 90% opacity wrapper blurs only the wrapper's contents.

Keep these different. **Keep glass, progressive blur, noise and texture out of component libraries**; none of the systems surveyed ships a token for them. Background blur can stay, halved, with a note on any component that sits inside a translucent container.

---

## Stroke alignment

Draw each stroke with the CSS that takes the same room it takes in Figma: on frames using the auto layout version that became the default in July 2026, an inside stroke counts like a CSS border under `box-sizing: border-box`, and centre and outside strokes count like outlines.

Take a button with 8px vertical padding, 24px of content and a 1px stroke. In a legacy Figma frame, hugging its content, it reports 40. In the browser, with an auto height and `border: 1px`, it renders 42. Here are both, drawn at twice their size.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 250" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Two buttons labelled Save, drawn at 2x. Left, Figma with hug and the stroke not counted: 40 tall, the stroke drawn over the padding. Right, the browser with auto height and a 1px border: 42 tall, with a dashed line marking where 40 would end.</title><rect width="880" height="250" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="249" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">1px stroke, 8px vertical padding, 24px of content (drawn at 2x)</text><line x1="440" y1="58" x2="440" y2="230" stroke="#E3DFD8"/><text x="32" y="76" font-size="12.5" fill="#1C1B19">Figma, hug, stroke not counted (legacy)</text><text x="466" y="76" font-size="12.5" fill="#1C1B19">Browser, auto height, border: 1px</text><rect x="120" y="100" width="200" height="80" rx="12" fill="#FFFFFF"/><rect x="121" y="101" width="198" height="78" rx="11" fill="none" stroke="#5E7E93" stroke-width="2"/><rect x="140" y="116" width="160" height="48" fill="#EDEAE4"/><text x="220" y="145" font-size="14" fill="#1C1B19" text-anchor="middle">Save</text><rect x="550" y="100" width="200" height="84" rx="12" fill="#FFFFFF"/><rect x="551" y="101" width="198" height="82" rx="11" fill="none" stroke="#5E7E93" stroke-width="2"/><rect x="570" y="118" width="160" height="48" fill="#EDEAE4"/><text x="650" y="147" font-size="14" fill="#1C1B19" text-anchor="middle">Save</text><line x1="340" y1="100" x2="340" y2="180" stroke="#5E7E93"/><line x1="336" y1="100" x2="344" y2="100" stroke="#5E7E93"/><line x1="336" y1="180" x2="344" y2="180" stroke="#5E7E93"/><text x="350" y="145.0" font-size="15" fill="#5E7E93" font-weight="600">40</text><line x1="770" y1="100" x2="770" y2="184" stroke="#A6552F"/><line x1="766" y1="100" x2="774" y2="100" stroke="#A6552F"/><line x1="766" y1="184" x2="774" y2="184" stroke="#A6552F"/><text x="780" y="147.0" font-size="15" fill="#A6552F" font-weight="600">42</text><line x1="530" y1="180" x2="800" y2="180" stroke="#A6552F" stroke-dasharray="3 3"/><text x="220" y="214" font-size="11.5" fill="#77726B" text-anchor="middle">Reports 40: the stroke covers the padding</text><text x="650" y="214" font-size="11.5" fill="#77726B" text-anchor="middle">Renders 42: the border adds to the box</text></svg>

That's the two-pixel drift. The legacy stroke paints over the padding; the CSS border adds to the box. CSS has three channels, and they take different room: a `border` sits inside the box and takes space; an `outline` sits outside, takes none and follows `border-radius`; an inset `box-shadow` of `0 0 0 1px` paints inside and takes none either.

[Figma's help article on auto layout with flexbox in mind](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind) (read November 2026) sets the new rules. Inside strokes are included in layout by default, matching CSS borders; outside and centre strokes are never counted, even when the frame's setting includes strokes; and a frame can't be narrower than its padding plus any inside stroke. Frames created from July 2026 get this version. Older frames keep the legacy default, strokes excluded from layout, until updated, and in January 2027 the toggle becomes a one-way Update button.

Here is the same 40px button built six ways:

| Construction | Rendered height | Content height |
|---|---|---|
| Figma, fixed 40, inside stroke counted | 40 | 22 |
| CSS, `height: 40px`, `border: 1px`, `border-box` | 40 | 22 |
| CSS, `height: 40px`, `border: 1px`, `content-box` | 42 | 40 |
| Figma, hug, stroke not counted (legacy default) | 40, stroke over the padding | 24 |
| CSS, auto height, `border: 1px` | 42 | 24 |
| CSS, auto height, inset `box-shadow` ring | 40 | 24 |

The toolkit turned this into one mapping (`standards/code-standard.md`, rule 63) and checked it against 1,946 real nodes in two projects' stored specs.

| Figma stroke | CSS |
|---|---|
| Inside, in layout | `border`, per side |
| Inside, not in layout | an inset ring over the content: `box-shadow: inset 0 0 0 N`, one offset inset layer per side for a single edge |
| Outside | a ring outside the box: `outline` or `box-shadow: 0 0 0 N`; an offset outer shadow per side for one edge |
| Center | `outline` offset by minus half its width |

The hairline under a list row, a 1px outside stroke on the bottom edge, is an outer shadow offset down by its width, so a 48px row stays 48. That shadow paints under the next sibling's background and is cut by an `overflow: hidden` ancestor; where either happens, draw it on the sibling or the ancestor (`knowledge/code/figma-handoff.md#strokes-borders-outlines-and-shadows`).

Systems split on the primitive. Primer ships `boxShadow.thin` as `inset 0 0 0 {borderWidth.thin}`, "to prevent layout shift"; MUI's outlined field draws its border on an absolutely positioned `fieldset`, so 1px to 2px on focus never moves the content. Everyone else uses `border`. The ring has costs a border doesn't, in paint order and forced colours, set out in [inset ring or border](../foundations/elevation-and-shadows.md#inset-ring-or-border).

This is a Figma fix with a code rule beside it. Update each library frame to the current auto layout version, use inside strokes for borders, set code to `border-box` globally, and apply the mapping above. **Where a border changes width between states, draw it as an inside stroke excluded from layout, which maps exactly to an inset ring.**

---

## Focus rings

A focus ring is an outside stroke that maps to `outline` with an `outline-offset`, and the element keeps its own radius, because the browser grows an outline's corners itself; which edge grows by how much, and the whole treatment from the ring layer to forced colours, are in [focus indicators](../accessibility/focus-indicators.md#the-rings-css-property).

For the handoff arithmetic: the offset is `clear − width`, where `clear` is the distance from the box to the ring's outer edge, so a 2px ring layer 8px wider than the button gives `clear` 4 and offset 2 (`knowledge/code/figma-handoff.md#focus-rings-reading-their-geometry`). **Keep the element's own radius; never copy the ring layer's radius onto it.**

---

## Dashed, gradient, hairline strokes

One-side strokes translate; dashed strokes don't, because CSS lets the browser choose the pattern; gradient strokes don't, because `border-image` ignores `border-radius`; and half-pixel hairlines snap to device pixels.

The Card gets four decorations in one review: an accent edge on its left, a dashed border on the empty state, a gradient border on the premium version, and a half-pixel divider.

**One-side strokes** map to `border-left` and its siblings, but with a radius and unequal sides the corner join is undefined in CSS and undocumented in Figma, and a centre or outside side stroke counts as an outline in Figma while a CSS side border takes space.

**Dashed strokes** in Figma have an exact dash, gap and cap. CSS `border-style: dashed` leaves dash length and distribution to the browser, so a 4 by 4 round-capped dash needs SVG `stroke-dasharray`.

**Gradient strokes** look like `border-image`, which ignores `border-radius`, so a 12px-radius card renders square corners. The recipe is two backgrounds under a transparent border: the fill clipped to `padding-box`, the gradient to `border-box`.

**Hairlines** are where the device decides. CSS Values snaps a border width to whole device pixels, rounding anything under one up to one and anything above down. Polaris's `border-width-0165` at 0.66px is 1 CSS pixel on a 1x screen, 0.5 on 2x (1.32 device pixels rounded down) and exactly 2 device pixels on 3x. Figma's own rounding is undocumented.

For side strokes, use inside alignment and draw accent edges on rounded cards as a separate child. Use SVG only where a dash pattern matters, and the two-background recipe for gradient strokes. **Name a hairline token "one device pixel", not a CSS value.**

---

## Radii and corner smoothing

Radii differ on three counts: Figma clamps an oversized radius corner by corner while CSS scales all four together (tested directly), a pill is 9999px and never 50%, and corner smoothing has no shipped web equivalent in Safari.

Take a tab shape: a 160 by 40 frame with radii of 8, 40, 8 and 40, clockwise from the top left. Two of those radii are larger than half the height. Before reading on, work out what each tool does with the 40s.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 250" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>The same 160 by 40 shape with stored radii 8, 40, 8, 40, drawn at 2x. Figma renders the 8px corners at 8 and clamps each 40px corner alone to 20. CSS scales every radius by 40/48, giving 6.67 and 33.3.</title><rect width="880" height="250" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="249" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">Radii 8, 40, 8, 40 on a 160 by 40 box (drawn at 2x)</text><line x1="440" y1="58" x2="440" y2="230" stroke="#E3DFD8"/><text x="32" y="76" font-size="12.5" fill="#1C1B19">Figma renders</text><text x="466" y="76" font-size="12.5" fill="#1C1B19">CSS renders</text><path d="M76 100 H340 A40 40 0 0 1 380 140 V164 A16 16 0 0 1 364 180 H100 A40 40 0 0 1 60 140 V116 A16 16 0 0 1 76 100 Z" fill="#9FB4C2"/><path d="M513.33 100 H753.33 A66.67 66.67 0 0 1 820 166.67 V166.67 A13.33 13.33 0 0 1 806.67 180 H566.67 A66.67 66.67 0 0 1 500 113.33 V113.33 A13.33 13.33 0 0 1 513.33 100 Z" fill="#D9A97E"/><text x="220" y="214" font-size="11.5" fill="#77726B" text-anchor="middle">8 stays 8; each 40 clamps on its own to 20</text><text x="660" y="214" font-size="11.5" fill="#77726B" text-anchor="middle">Every radius scaled by 40/48: 6.67 and 33.3</text></svg>

Figma clamps each 40 to 20 on its own and leaves the 8s alone. CSS follows the Backgrounds specification: if adjacent radii on a side add up to more than the side, every radius is multiplied by the smallest ratio of side to radius sum, here 40/48, so the 8s render at 6.67 and the 40s at 33.3. With equal radii the rules agree; mixed-radius shapes such as tabs and chat bubbles differ.

**Pills** have a separate trap. A CSS percentage radius refers to width horizontally and height vertically, so `50%` on a non-square box is an ellipse, and Figma has no percentage radius at all. A large pixel value works in both, and systems converge on it: Primer, Material, Polaris and Atlassian use 9999px, Fluent `borderRadiusCircular` 10000px.

**Smoothing** is the third. Figma's `cornerSmoothing` (60% matches Apple's iOS 7 squircle) lengthens the curve. CSS Borders 4 adds `corner-shape` (`squircle`, `bevel`, `scoop`, `notch`, `superellipse(n)` and others), which needs a `border-radius`. As of November 2026, [MDN's compatibility data](https://developer.mozilla.org/en-US/docs/Web/CSS/corner-shape) shows it in Chrome and Edge from 139, in Safari 27.3 only as a beta, and in Firefox only in Nightly. Even `squircle` won't match 60%, because `superellipse()` doesn't lengthen the curve; on Apple platforms the match is SwiftUI's continuous corner style. How the radius scale itself is chosen is [corner radius by intent](../foundations/corner-radius-by-intent.md).

Change Figma for radii: give each component radii that fit the smallest size it takes, and one full-radius variable at 9999. **For pills, bind the radius to the 9999 variable, never a percentage.** Keep smoothing different: zero on web components, `corner-shape` as progressive enhancement behind `@supports` where a product wants the look, and smoothing kept for iOS.

---
## Cheat sheet

| Case | Figma | Code | Action |
|---|---|---|---|
| [Frame shadow source](#frame-shadows) | frame plus children unless clipped | `box-shadow` from the box | Change Figma: clip and fill |
| [Inner shadow](#inner-shadows) | paints over children (tested) | under children | Translate: overlay pseudo-element |
| [Several shadows](#shadow-stacking-order) | API array: last on top (tested) | first on top | Translate: reverse once |
| [Shadow blur](#blur-values) | about 12% sharper | radius = 2 × std dev | Keep: copy 1:1 |
| [Background, layer blur](#blur-values) | double the CSS value | `backdrop-filter`, `filter` | Translate: halve |
| [Glass, progressive blur, noise](#glass-and-progressive-blur) | native | no primitive | Keep: out of libraries |
| [Stroke alignment](#stroke-alignment) | inside counted (new version) | the room-taking channel | Change Figma; rule 63 mapping |
| [Focus ring](#focus-rings) | ring layer around the box | `outline`, offset `clear − width` | Translate; element keeps its radius |
| [Dashed, gradient strokes](#dashed-gradient-hairline-strokes) | exact pattern; follows radius | browser-chosen; `border-image` square | Keep, or SVG / two backgrounds |
| [Hairline 0.5px](#dashed-gradient-hairline-strokes) | drawn exactly | snapped to device pixels | Keep: "one device pixel" |
| [Oversized mixed radius](#radii-and-corner-smoothing) | each corner alone (tested) | all scaled together | Change Figma: radii that fit |
| [Pill](#radii-and-corner-smoothing) | no percentage | `50%` is an ellipse | Change Figma: 9999 |
| [Corner smoothing](#radii-and-corner-smoothing) | 0 to 100% | `corner-shape`, no stable Safari | Keep: 0 on web |

---

## The short version

Figma draws a layer from everything it holds; CSS draws a box from its own edges. That's why an unclipped frame's shadow follows its children, why an inner shadow paints over content in Figma and under it in the browser, and why spread needs a filled, clipped frame.

The fixes in your Figma file are few and cheap: clip and fill every frame that carries a shadow, use inside strokes for borders and outside strokes for rings on frames updated to the July 2026 auto layout, give mixed radii values that fit, and pills 9999. The translations belong in one place, done once: reverse the effects array, halve background and layer blur, map each stroke to the channel that takes the same room, and draw rings as offset outlines that keep the element's radius.

What stays different is what CSS has no primitive for (glass, progressive blur), what the browser decides (dash patterns, hairlines) and what hasn't shipped everywhere (`corner-shape`). Three behaviours no documentation states were confirmed by test, and each looks like a code bug and isn't: a frame's shadow is cast by its children unless it clips, an inner shadow paints over children, and an oversized radius is clamped corner by corner.

---

## What to re-check later

Researched October 2026; re-checked November 2026.

- **Re-read in November 2026.** Figma's help article on auto layout with flexbox in mind (inside strokes in layout by default for frames from July 2026), and `corner-shape` in MDN's compatibility data 8.1.9 (Chrome and Edge 139, Safari 27.3 beta, Firefox Nightly only). An earlier version said Firefox 162 had shipped it; 162 is the Nightly build.
- **Auto layout versions.** From January 2027 the legacy toggle becomes an Update button; re-check whether legacy behaviour survives.
- **`corner-shape`.** When Safari and Firefox ship it, the advice on [corner smoothing](#radii-and-corner-smoothing) changes.
- **Tested once.** Five behaviours were tested once on a scratch file on 1 October 2026: shadow source and Clip content, inner shadow over children, stroke over children, per-corner clamping and effects-array order. A renderer change could alter any of them.
- **Not verified.** Figma's rounding of fractional strokes; the corner join of unequal side strokes; an SVG filter in `backdrop-filter` across browsers.
- **Evidence quality.** The blur factors rest on one measurement (Bjango) and one Figma staff answer.

---

## Sources

**Primary: Figma**

- [Plugin API: Effect](https://developers.figma.com/docs/plugins/api/Effect/)
- [Plugin API: node properties](https://developers.figma.com/docs/plugins/api/node-properties/)
- [Plugin API: FrameNode](https://developers.figma.com/docs/plugins/api/FrameNode/)
- [Plugin API: strokeAlign](https://developers.figma.com/docs/plugins/api/properties/nodes-strokealign/)
- [Plugin API: strokesIncludedInLayout](https://developers.figma.com/docs/plugins/api/properties/nodes-strokesincludedinlayout/)
- [Plugin API: cornerSmoothing](https://developers.figma.com/docs/plugins/api/properties/nodes-cornersmoothing/)
- [Help: Use auto layout with CSS Flexbox in mind](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind)
- [Help: Apply effects to layers](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)
- [Help: Apply strokes to layers](https://help.figma.com/hc/en-us/articles/360049283914-Apply-strokes-to-layers)
- [Help: Adjust corner radius and smoothing](https://help.figma.com/hc/en-us/articles/360050986854-Adjust-corner-radius-and-smoothing)
- [Help: Frames in Figma Design](https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma-Design)
- [Blog: Behind the feature, shadow spread](https://www.figma.com/blog/behind-the-feature-shadow-spread/)
- [Forum, staff answer: background blur in Dev Mode](https://forum.figma.com/ask-the-community-7/background-blur-is-different-in-dev-mode-22642)
- [Forum, staff answer: layered box-shadow order](https://forum.figma.com/ask-the-community-7/layered-box-shadow-order-is-reversed-in-dev-mode-12290)
- [Forum, staff answer: spread without fill or clip](https://forum.figma.com/ask-the-community-7/why-figma-not-supporting-spread-function-for-without-fill-component-and-frames-22505)

**Primary: specifications and MDN**

- [CSS Backgrounds and Borders 3](https://www.w3.org/TR/css-backgrounds-3/)
- [CSS Values 4 (line width snapping)](https://drafts.csswg.org/css-values-4/)
- [CSS UI 4 (outline)](https://drafts.csswg.org/css-ui-4/)
- [MDN: drop-shadow()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/drop-shadow)
- [MDN: blur()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/blur)
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)
- [MDN: border-radius](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius)
- [MDN: border-image](https://developer.mozilla.org/en-US/docs/Web/CSS/border-image)
- [MDN: corner-shape](https://developer.mozilla.org/en-US/docs/Web/CSS/corner-shape)
- [MDN: outline](https://developer.mozilla.org/en-US/docs/Web/CSS/outline)
- [MDN: outline-offset](https://developer.mozilla.org/en-US/docs/Web/CSS/outline-offset)
- [MDN: multiple backgrounds](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Backgrounds_and_borders/Using_multiple_backgrounds)
- [MDN browser-compat-data 8.1.9 (12 November 2026): `corner-shape`](https://github.com/mdn/browser-compat-data)

**Primary: design systems**

- [Primer primitives: shadow tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/shadow/shadow.json5)
- [Primer primitives: radius tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/radius.json5)
- [Atlassian: radius](https://atlassian.design/foundations/radius)
- [Polaris tokens: shadow](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/shadow.ts)
- [Polaris tokens: border](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/border.ts)
- [Polaris: bevel mixin](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-react/postcss-mixins/shadow-bevel.js)
- [Material Web: elevation tokens](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/latest/sass/_md-sys-elevation.scss)
- [Material Web: shape tokens](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/latest/sass/_md-sys-shape.scss)
- [Fluent: shadow tokens](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/utils/shadows.ts)
- [Fluent: border radius tokens](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/global/borderRadius.ts)
- [MUI: shadows source](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/shadows.js)
- [MUI: NotchedOutline source](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/OutlinedInput/NotchedOutline.js)

**The toolkit's own tested rules**


**Commentary and measurement**

- [Bjango: blur radius comparison (measured)](https://bjango.com/articles/blurradiuscomparison/)
- [Tokens Studio: box shadow (known order issue)](https://docs.tokens.studio/manage-tokens/token-types/box-shadow)
