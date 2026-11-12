# Where Figma and CSS render differently

Most of the differences between a Figma component and its coded version come from one fact: Figma draws a layer from everything it holds, while CSS draws a box from its own edges. This piece follows that fact through shadows, strokes, radii, clipping, colour, text and auto layout, and gives each case one action: change the Figma file, translate in code, or keep the difference on purpose.

Researched October 2026; re-checked November 2026. Figma mechanics were checked against the Plugin API and REST documentation, the help centre, Figma's engineering blog and staff answers on its forum. CSS behaviour was checked against the CSSWG specifications and MDN. Design system evidence comes from each system's own token source: Primer, Atlassian, Polaris, Carbon, Material 3, Fluent 2, Spectrum, MUI and Braid. Six Figma behaviours no documentation states were tested directly on a scratch file on 1 October 2026 and are marked as tested. In November 2026 Figma's help article on auto layout with flexbox in mind was re-read (the dates and stroke rules below hold), and `corner-shape` support was re-checked on caniuse (Chrome and Edge 139, Firefox 162, Safari still Technology Preview only). The toolkit's own measurements, taken by its parity loop on two projects, are added and marked as the toolkit's.

---

## What this answers

- Why does a shadow, stroke or radius look right in Figma and different in the browser?
- Which of those differences are fixed by drawing the Figma file differently, which are a mechanical translation, and which stay different?
- What does Figma's July 2026 auto layout version change, and what does it leave?
- What do Primer, Atlassian, Polaris, Material, Fluent, Carbon, Spectrum and MUI actually ship?

Every case ends with one of three actions:

- **Change Figma.** Figma has a setting that matches code and the library is not using it.
- **Translate in code.** The two tools express the same intent in different terms; the token pipeline or the engineer applies one known conversion, once.
- **Keep different.** One side has a capability the other lacks, and forcing parity costs more than the difference. Recorded as a named deviation.

Line height, letter spacing and vertical trim are in [line-height-letter-spacing-figma-to-css.md](../foundations/line-height-letter-spacing-figma-to-css.md), right-to-left layout in [rtl-design-systems.md](../accessibility/rtl-design-systems.md). Which names and props should match is [how-closely-figma-should-match-code.md](how-closely-figma-should-match-code.md).

---

## 1. Why does a shadow change shape when Clip content is toggled, and why does spread only work sometimes?

**The short answer.** A Figma drop shadow on a frame is cast by everything the frame renders, children included, unless Clip content is on. CSS `box-shadow` is cast by the element's own rounded box and never by its children. And Figma applies spread only where it has a box to grow: a filled, clipped frame or a basic shape.

Figma's engineering blog describes the method: copy the layer's geometry, fill it with one colour, blur it, draw it underneath. For a frame, the geometry is the composite of the frame and its visible content, and Clip content changes that composite. Tested directly: a 160 by 120 frame with a white fill, a 24px radius and a solid shadow offset 12px got a 60 by 60 square child in its bottom-left corner. With Clip content off, the child's square corner showed past the rounded edge and the shadow under it came out square. With it on, child and shadow followed the 24px curve.

CSS behaves differently at the root. The Backgrounds specification draws an outer `box-shadow` from the border box, following `border-radius`; nothing inside affects its shape. The CSS function that follows content is `filter: drop-shadow()`, which casts from the alpha of everything the element paints.

| Figma frame | Shadow cast from | CSS equivalent |
|---|---|---|
| Fill, radius, Clip content **on** | the frame's rounded shape | `box-shadow` |
| Clip content **off**, child overflowing | frame plus every visible child | `filter: drop-shadow()` |
| No fill | the children only | `filter: drop-shadow()` |

**Show behind transparent areas** (`showShadowBehindNode`) appears only when a fill is translucent or absent: off matches `box-shadow` (cut out under the box), on matches `drop-shadow()`.

Spread follows from the same model. The Plugin API allows it only on rectangles, ellipses, and frames, components and instances with a visible fill (at least 1% opacity) and Clip content on. When Figma shipped spread in 2020, its blog said the aim was to do at least what CSS can, and CSS spread exists only on boxes. The values that depend on it are not exotic: Atlassian's dark overlay shadow opens with a one-pixel ring, `0px 0px 0px 1px #BDBDBD1F`; Primer's `shadow.floating.small` begins with `0 0 0 1px`; Polaris uses negative spread across its scale (`shadow-300: 0px 4px 6px -2px rgba(26,26,26,0.20)`); Material's level 1 ambient is `0 1px 3px 1px`. On an unfilled or unclipped frame, every one renders as if spread were zero. CSS `drop-shadow()` accepts no spread either, so a content-shaped shadow with spread cannot be built with either primitive.

**What to do. Change Figma.** Give every frame that carries an elevation shadow Clip content on, a visible fill, and Show behind transparent areas off. Its silhouette is then the border box `box-shadow` produces, and spread works. Keep the content-following behaviour only where the design needs a shadow shaped like its content (an icon, a cut-out sticker), and say so, because code must use `drop-shadow()`, which has neither spread nor inset. No system was found documenting this mismatch; every system's shadow tokens are `box-shadow` values, which settles which behaviour they expect.

---

## 2. Does an inner shadow sit above or below the content?

**The short answer.** Above it in Figma, tested directly. CSS paints `box-shadow: inset` just above the background and below the content, so children cover it.

Figma's help documents a single layer's paint order from top to bottom as layer blur, stroke, inner shadow, fill, drop shadow, background blur; for the layer itself that matches CSS. It does not say where a frame's children sit in that stack. The test answered it: a clipped frame with a red inner shadow of 16px spread got a green child spanning its width, and the red band ran across the green child at both ends, tinting it brown.

Polaris shows what a system does when it wants the Figma behaviour in code. Its bevel, `--p-shadow-bevel-100`, is four one-pixel inset shadows drawn not on the element but on an absolutely positioned `::before` with `pointer-events: none` and a luminosity blend, the only way CSS puts an inset effect over children.

**What to do. Depends on intent.** For a pressed or recessed surface with plain content, nothing visible changes. Where the inset must read over an image or a filled child, translate in code with an overlay pseudo-element, and say so in the spec. Where it should sit under content, change Figma: inset the content from the edge so the shadow is not covered there either.

---

## 3. When a layer has several shadows, which is on top?

**The short answer.** In CSS the first shadow in the list paints on top. In Figma's effects array, as the Plugin API returns it, the last entry paints on top, tested directly. A pipeline that copies the array in order reverses the stack.

In the test, a frame carried two opaque drop shadows, red at 20px offset first and blue at 30px second; the blue painted over the red. The panel reportedly shows the front-most effect at the top, which makes panel order equal to CSS order and the API array the reverse of both. Dev Mode once emitted reversed CSS (reported fixed by Figma staff in March 2024); Tokens Studio still lists reversed shadow order on import as a known issue. Most real shadow tokens have two or three layers: Fluent's `shadow16` is `0 0 2px` ambient plus `0 8px 16px` key; Spectrum's `drop-shadow-elevated` has three; MUI's 24 elevations have three each. Reversing key and ambient changes which edge looks crisp.

**What to do. Translate in code**, once, in the export transform, with a test that a two-colour fixture comes out in order. The toolkit's token exporter does exactly this, writing effect layers in CSS paint order, top first (`skills/figma-token-export/`).

---

## 4. Is a Figma blur value the same number as a CSS blur value?

**The short answer.** For drop shadows, close enough to copy: a Figma shadow blur renders about 12% softer than the same number in `box-shadow`. For background and layer blur, no: the CSS value is about half.

CSS uses two conventions. A `box-shadow` blur is a radius whose Gaussian standard deviation is half the value; `filter: blur()` and `backdrop-filter: blur()` take the standard deviation itself, so 16px of `filter: blur()` is about twice as strong as 16px of shadow blur. Figma uses one convention for all three. Bjango measured every major tool against CSS in 2024 and found Figma the closest to `box-shadow`: a Figma shadow blur of 16 matches a `box-shadow` blur of about 14. For background blur, a Figma staff answer says Dev Mode divides by two, so 30 in Figma is 15 in CSS; Bjango's figures give about 0.44.

| Figma effect | Figma value | CSS property | CSS value that matches |
|---|---|---|---|
| Drop shadow blur | 16 | `box-shadow` blur | about 14 (copy 16) |
| Background blur | 30 | `backdrop-filter: blur()` | 15 |
| Layer blur | 30 | `filter: blur()` | about 13 to 15 |

**What to do. Keep different for shadows, translate for blurs.** Copy shadow blur one to one and write the tolerance down once; correcting 12% would make every token differ from its reference. Halve background and layer blur in the token transform, citing Figma's own rule.

---

## 5. Can glass, progressive blur and the newer effects be built in code?

**The short answer.** Not with any CSS primitive. Background blur translates, with one CSS-only trap.

Figma's API exposes a progressive blur (`blurType: 'PROGRESSIVE'`, with start radius and offsets) and a glass effect with light intensity, angle, refraction, depth, dispersion and radius, besides noise and texture. CSS has a uniform `backdrop-filter: blur()`; a progressive blur is several stacked `backdrop-filter` layers under `mask-image` gradients, and refraction would need an SVG filter referenced from `backdrop-filter`, whose cross-browser support was not verified. Each is a bespoke build, not a token. The trap: `backdrop-filter` blurs only up to the nearest backdrop root, which is any ancestor with a filter, opacity below 1, a mask, a clip path, a backdrop filter or a blend mode; a blurred panel inside a 90% opacity wrapper blurs only the wrapper's contents.

**What to do. Keep different.** Keep glass, progressive blur, noise and texture out of component libraries; none of the systems surveyed ships a token for them. Background blur may stay, halved, with a note on any component that sits inside a translucent container.

---

## 6. Which CSS draws a Figma stroke?

**The short answer.** The one that takes the same room the stroke takes in Figma. Since July 2026 Figma's auto layout counts an inside stroke like a CSS border under `box-sizing: border-box` and treats centre and outside strokes as outlines, so stroke alignment now decides whether the sizes match.

A CSS `border` sits inside the element's box and takes space. An `outline` sits outside and takes none, and in current browsers follows `border-radius`. An inset `box-shadow` of `0 0 0 1px` paints inside and takes no space either. Figma's help article on auto layout with flexbox in mind, re-read in November 2026, says inside strokes are included in layout by default, matching CSS borders; outside and centre strokes are never counted, even when the frame's setting includes strokes; and padding is always respected, so a frame cannot be narrower than its padding plus any inside stroke. The new version is the default for frames created from July 2026; older frames keep the legacy behaviour until updated, and in January 2027 the toggle becomes a one-way Update button.

A 40px button with 8px vertical padding and a 1px stroke shows what the setting decides:

| Construction | Rendered height | Content height |
|---|---|---|
| Figma, fixed 40, inside stroke counted | 40 | 22 |
| CSS, `height: 40px`, `border: 1px`, `border-box` | 40 | 22 |
| CSS, `height: 40px`, `border: 1px`, `content-box` | 42 | 40 |
| Figma, hug, stroke not counted (legacy default) | 40, stroke over the padding | 24 |
| CSS, auto height, `border: 1px` | 42 | 24 |
| CSS, auto height, inset `box-shadow` ring | 40 | 24 |

The legacy row produces the classic two-pixel drift: Figma reports 40, the browser renders 42.

The toolkit turned this into one table and checked it against both of its projects' stored specs: outside and centre strokes took no layout room whatever the flag on 208 real nodes, inside-in-layout drew as a border on 217, and inside-not-in-layout as an inset ring on 1,521 (`standards/code-standard.md`, rule 63):

| Figma stroke | CSS |
|---|---|
| Inside, in layout | `border`, per side |
| Inside, not in layout | an inset ring over the content: `box-shadow: inset 0 0 0 N`, one offset inset layer per side for a single edge |
| Outside | a ring outside the box: `outline` or `box-shadow: 0 0 0 N`; an offset outer shadow per side for one edge |
| Center | `outline` offset by minus half its width |

A line (a vector with no extent on one axis) has no inside: it is a border on its leading edge. The hairline under a list row, a 1px outside stroke on the bottom edge, is an outer shadow offset down by its width, so a 48px row stays 48; it paints under the next sibling's background and is cut off by an `overflow: hidden` ancestor, so draw it on the sibling or the clipping ancestor where either happens (`knowledge/code/figma-handoff.md#strokes-borders-outlines-and-shadows`).

Systems split on the code primitive. Primer ships `boxShadow.thin` as `inset 0 0 0 {borderWidth.thin}`, described as a thin shadow used instead of a border to prevent layout shift; MUI's outlined text field draws its border on an absolutely positioned `fieldset`, so 1px to 2px on focus never moves the content. Everyone else uses `border`.

**What to do. Change Figma.** Update library frames to the current auto layout version, use inside strokes for borders, set code to `border-box` globally, and apply the table. Where a border changes width between states, draw it as an inset ring, which an inside stroke excluded from layout represents exactly.

---

## 7. How does a focus ring's geometry translate?

**The short answer.** As one `outline` for the whole system, offset by how far the ring's outer edge sits past the box, with the element keeping its own radius. Two details are the toolkit's own findings: the outline's corners grow by the offset and width, and an effect-style ring cannot have a gap.

Focus rings belong to the outside-stroke row: they must not shift layout when state changes. The toolkit computes one number per component, `clear`, the distance from the ringed box to the ring's outer edge (half the difference between the ring layer's and the ringed layer's widths, plus half the stroke for a centre stroke or the whole stroke for an outside one), and draws `outline-offset: calc(clear - width)`. A 2px inside ring on a layer 8px wider than the button gives `clear` 4 and offset 2 (`knowledge/code/figma-handoff.md#focus-rings-reading-their-geometry`).

The radius is where builds go wrong. An outline's corners follow `border-radius` and grow, so its outer radius is the element's radius plus `clear`. Writing the Figma ring layer's radius onto the element rounds the ring too much: tested in Chromium on 25 October 2026, radius 12 with a 2px outline at offset 2 draws an outer radius of 16. A card with a ring layer at `Corner radius/20` around a card at 16 keeps 16 on focus; writing 20 on the card draws 24. How corners grow under an offset is not yet specified ([csswg-drafts #8786](https://github.com/w3c/csswg-drafts/issues/8786)), so Firefox and Safari are worth checking.

Some libraries draw rings as effect styles: Untitled UI ships `focus-ring` effect styles, plus combined ring-and-shadow styles because Figma allows one effect style per layer. That works for a ring touching the edge, and since December 2023 a colour variable can be bound to it. It stops working at an offset, because a spread shadow cannot leave a transparent gap; the gap has to be painted in a colour that is wrong on every surface but one. Untitled UI's own React code draws the ring as an outline with a 2px offset. In forced-colours mode, a shadow ring disappears and an outline stays.

**What to do. Change Figma and translate.** Draw a ring with a gap as a stroked layer around the component, map it to `outline` and `outline-offset`, keep the element's radius, and never use `outline: none` (which leaves the browser's default width behind; `outline: 0` collapses it).

---

## 8. What about one-side, dashed, gradient and half-pixel strokes?

**The short answer.** One-side strokes translate. Dashed strokes do not, because CSS lets the browser choose the pattern; gradient strokes do not, because `border-image` ignores `border-radius`; and half-pixel hairlines snap to device pixels.

**One-side strokes** map to `border-top` and its siblings, with two differences: with a radius and unequal sides, CSS leaves the exact colour join in the corner undefined (Figma documents nothing), and a centre or outside side stroke counts as an outline in Figma while a CSS side border always takes space. **Dashed strokes** in Figma have exact dash, gap and cap, and start and end each line with a half dash; CSS `border-style: dashed` is defined only as square-ended dashes whose length and distribution belong to the browser. A 4 by 4 round-capped dash needs SVG `stroke-dasharray` and `stroke-linecap`. **Gradient strokes** look like `border-image`, but border images ignore `border-radius`, so a 12px-radius card renders square corners; the working recipe is two backgrounds, the fill clipped to `padding-box` and the gradient to `border-box`, under a transparent border. **Hairlines**: CSS Values snaps a border width to whole device pixels, rounding anything between zero and one up to one and anything above one down. Polaris ships `border-width-0165` at 0.66px: on a 1x screen it becomes 1 CSS pixel, on 2x it is 1.32 device pixels rounded down to 1, so 0.5 CSS pixels, and on 3x exactly 2 device pixels. Figma's own rounding of fractional strokes is undocumented.

**What to do.** Change Figma for side strokes: inside alignment, and accent edges on rounded cards drawn as a separate child. Keep dashed patterns generic and use SVG only where the pattern matters; treat gradient strokes as per-component decoration with the stated recipe; name a hairline token "one device pixel", not a CSS value.

---

## 9. Do corner radii clamp, pill and smooth the same way?

**The short answer.** No on three counts. Figma clamps an oversized radius corner by corner, CSS scales all four together (tested directly); a pill is 9999px, never 50%; and corner smoothing has no shipped web equivalent in Safari.

**Clamping.** The Backgrounds specification says that if adjacent radii on any side add up to more than the side, every radius is multiplied by the smallest ratio of side length to radius sum. The test used a 160 by 40 frame with radii 8, 40, 8 and 40. Figma rendered the 8px corners at 8 and the 40px corners at 20, while storing 8 and 40. CSS multiplies every radius by 40/48:

| Corner | Stored | Figma renders | CSS renders |
|---|---|---|---|
| Top-left, bottom-right | 8 | 8 | 6.67 |
| Top-right, bottom-left | 40 | 20 | 33.3 |

With equal radii the rules agree; the difference appears in mixed-radius shapes such as tabs and chat bubbles.

**Pills.** A CSS percentage radius refers to width horizontally and height vertically, so `50%` on a non-square box is an ellipse, and Figma has no percentage radius at all. A large pixel value works in both. The convergence is near-total: Primer `borderRadius-full`, Material `md.sys.shape.corner.full`, Polaris `border-radius-full` and Atlassian `radius.full` are 9999px; Fluent `borderRadiusCircular` is 10000px. Spectrum's `corner-radius-1000` is a 0.5 multiplier its pipeline resolves; Atlassian's `radius.tile` is 25%, which Figma cannot express.

**Smoothing.** Figma's `cornerSmoothing` (0 to 1; 60% matches Apple's iOS 7 squircle) lengthens the curve. CSS Borders 4 adds `corner-shape` (`round`, `squircle` as `superellipse(2)`, `bevel`, `scoop`, `notch`, `square`, `superellipse(n)`), which needs a `border-radius` and which background, border, outline, shadow and overflow all follow. As of November 2026 it ships in Chrome and Edge from 139 and Firefox 162, and in Safari only in Technology Preview. Even `squircle` will not match 60%, because `superellipse()` does not lengthen the curve. On Apple platforms the native match is SwiftUI's continuous corner style.

**What to do. Change Figma** for radii that fit the smallest size a component takes and one full-radius variable at 9999. **Keep different** for smoothing: zero on web components, `corner-shape` as progressive enhancement behind `@supports` where a product wants the look, smoothing kept for iOS.

---

## 10. Do clipping, opacity and blend modes translate?

**The short answer.** Clip content is close to `overflow: clip`. Layer opacity is `opacity`, fill opacity is a translucent colour. Blend modes are where the models part: a Figma fill blends with whatever is behind the layer, CSS `background-blend-mode` only with the box's own backgrounds.

**Clip.** CSS clips at the curved padding edge, inside the border. Figma documents only that Clip content hides what extends past the bounds; tested directly, a clipped 24px-radius frame trimmed a square child to the curve, and a frame with an 8px inside stroke painted the stroke over a full-bleed child. The visible result is the same. `overflow: hidden` also creates a scroll container (scrollable by script, the containing block for sticky children); `overflow: clip` does not. Where an image sits inside a bordered, rounded frame, both tools draw its inner radius as the outer radius minus the border.

**Blend.** Figma's default layer mode, Pass through, lets children's blend modes reach content below the parent; Normal stops them, which is CSS `isolation: isolate`. CSS has no pass-through value: its default behaves like pass-through until something creates a stacking context, and opacity below 1, a transform, a filter or a z-index all do. A Figma frame at 90% opacity with a Multiply child may blend with the page in Figma (undocumented) and is always isolated in CSS. The CSS construction that matches a Figma fill blend is a pseudo-element carrying the fill with `mix-blend-mode`; CSS lacks Plus darker. Figma's September 2026 release added opacity over any colour through a number variable, which in CSS is relative colour syntax, `rgb(from var(--c) r g b / var(--a))`.

**What to do. Translate** Clip content to `overflow: clip` unless the box scrolls, fill opacity to a translucent colour token rather than `opacity` (which fades the content too), and a fill blend to a pseudo-element. **Change Figma**: set component roots to Normal whenever a child blends, and avoid blend modes outside the CSS list.

---

## 11. Why do gradients and colours look different in the browser?

**The short answer.** Three gradient causes (premultiplied alpha, radial geometry, the missing diamond) and one colour cause: a hex value from a Display P3 file renders duller in CSS, which reads every hex as sRGB.

CSS Color 4 interpolates gradients written with legacy sRGB colours in gamma-encoded sRGB, as Figma does, and gradients written with modern functions such as `oklch()` in Oklab by default, a different midpoint. CSS always premultiplies alpha, so a colour at zero opacity contributes no hue. Figma's documentation is silent, but users report it does not premultiply: a gradient from opaque `#FF6A00` to `#0050FF` at zero opacity shows a blue cast at its midpoint in Figma and none in the browser. Radial geometry differs too: a March 2026 forum report shows a 272 by 56 radial gradient, circular in Figma, exported by Dev Mode as `radial-gradient(183.69% 86.67% at ...)` and rendering much wider in Chrome. Angular gradients map to `conic-gradient`, which starts at twelve o'clock; diamond gradients have no counterpart.

New Figma files default to sRGB (Unmanaged was retired in 2023). Changing a profile offers assign (hex stays, appearance changes) or convert (appearance stays, hex changes); Figma copies P3 colours as `color(display-p3 r g b / a)`.

**What to do. Change Figma**: fade to the same hue at zero opacity, or add an explicit midpoint stop, which removes the premultiplication difference entirely; avoid diamond gradients; keep library files in sRGB unless the pipeline emits `color(display-p3)` or `oklch()`, and convert rather than assign. **Translate**: give radial gradients explicit sizes, and write `in srgb` on gradients built from OKLCH tokens to match what the designer saw.

---

## 12. Why does text look different in the browser?

**The short answer.** Mostly rasterisation, which nobody controls. The controllable causes are font files, weights the code does not ship, optical sizing, and settings Figma records but CSS needs written out.

Figma's canvas renders text the same everywhere; browsers use Core Text on macOS and DirectWrite with ClearType on Windows, and Windows renders heavier. The CSS levers (`-webkit-font-smoothing`, `-moz-osx-font-smoothing`) are non-standard, macOS-only and advised against by MDN. Optical size is controllable: `font-optical-sizing: auto` uses a font's `opsz` axis to thin large headings, so a static instance in code against a variable font in Figma renders headings at a different weight.

Weights: Figma lists only styles a font file contains, while browsers fake a missing bold or italic through `font-synthesis`. A Figma weight of 550 needs a variable font in code; static files snap to 500 or 600. Underlines: Figma exposes style, offset and thickness in pixels, percent or auto, and skip ink; CSS has `text-decoration-style` (adding double and dashed), `text-underline-offset`, `text-decoration-thickness` and `text-decoration-skip-ink`; auto values can differ by a pixel, and what Figma's percent is measured against is undocumented. Case: Figma's Capitalize is CSS `text-transform: capitalize`, which MDN is explicit is not title case; small caps are `font-variant-caps`. OpenType: Figma records only features turned on or off explicitly, such as tabular numbers; code must set them (`font-variant-numeric: tabular-nums`). Paragraph spacing and lists live inside one Figma text layer and on separate elements in code, where spacing becomes a margin (which can collapse) or a gap; hanging punctuation is Safari-only.

**What to do.** Confirm code loads the same files, variable or static, then exclude antialiasing from pixel comparisons. **Change Figma**: restrict text styles to weights the code loads; write underline offset and thickness as explicit values; put real title case in the content. **Translate**: `font-synthesis: none`, so a missing file shows as an error rather than a faked style; export explicit OpenType features into the type tokens; map paragraph and list spacing to margin and gap tokens. The toolkit's parity loop adds one more: load the real fonts in the measuring browser and assert the family that rendered, because a fallback face once measured close enough to pass.

---

## 13. How do images, masks and icons translate?

**The short answer.** Image Fill is `object-fit: cover`, not `fill`. A Figma mask belongs to the layers above it, a CSS mask to the element it masks. Icon strokes scale by opposite defaults in the two tools.

Figma's Fill crops to cover, which is `object-fit: cover`; CSS `object-fit: fill` stretches. Crop needs `object-position` with overflow or a pre-cropped asset; Tile exists only as `background-repeat`. Figma's image adjustments (exposure, contrast, saturation, temperature, tint, highlights, shadows) apply per paint; CSS `filter` has brightness, contrast and saturation on whole elements, with different curves. A vector mask becomes `clip-path`, an alpha mask `mask-image`, and the common rounded-rectangle mask is `overflow: clip` with a radius. One trap from the toolkit: a render of a node with an image fill returns the visible crop flattened, so transparent artwork comes from the raw upload and the crop is rebuilt in CSS; one project shipped two hero images with baked white backgrounds that way (`standards/code-standard.md`, rule 26).

In Figma, resizing an instance whose constraints are Scale grows the geometry but keeps the stroke weight, so a 24px icon with a 2px stroke looks heavier at 16 and lighter at 32. An SVG scaled through its `viewBox` scales its stroke unless `vector-effect: non-scaling-stroke` is set. SVG supports only centre strokes, so inside or outside strokes are converted on export, and code can no longer recolour them as strokes. An icon with a hard-coded fill needs a separate colour per state in code, where `fill="currentColor"` would inherit hover and disabled for free.

**What to do. Change Figma**: Fill or Fit for image fills, adjustments baked into the asset, a clipped frame instead of a rectangle mask. Draw icons as one vector on a fixed square frame equal to the code's `viewBox`, with centre strokes either outlined before export or kept with a stated scaling rule, and one fill bound to a variable that code maps to `currentColor`.

---

## 14. Is auto layout now the same as flexbox?

**The short answer.** Closer than ever on frames updated to the July 2026 version, and still different in specific ways: Fill shares space equally where CSS will not shrink an item below its content, negative gaps need margins, wrapping and baselines decide differently, and responsive grids exist only in code.

**Fill and Hug.** Figma's Fill children share the space equally (by border box under the new version). CSS flex items have an automatic minimum size and do not shrink below min-content. A 400px row with a 16px gap and two Fill children shows it: child A holds "Short", child B a 300px unbreakable URL. Figma gives each 192px and B's URL overflows inside 192; CSS with `flex: 1 1 0` gives B its 300px minimum and A the remaining 84px. MUI's Stack documentation names this bug and its fix, `min-width: 0`. A Figma Hug item never shrinks; a CSS content-sized item (`flex: 0 1 auto`) does. Dev Mode, per a 2025 secondary source, emits Fill as `flex: 1 0 0`, which still carries the automatic minimum.

**Spacing and wrap.** Min and max sizes match in positive pixels (CSS adds percentages Figma cannot express). Between, Evenly and Around are `space-between`, `space-evenly` and `space-around`; under the new version a lone child in a Between frame aligns to the start, as in CSS, while Around and Evenly still centre it. Figma allows a negative gap, described as intentional overlap (avatar stacks); CSS `gap` cannot be negative, so a −8 gap becomes `margin-inline-start: -8px` on every child but the first. A wrapping Figma frame breaks lines from drawn widths; a CSS Fill child with a zero basis has no width of its own to force a wrap.

**Position and order.** A child set to ignore auto layout (`layoutPositioning: ABSOLUTE`) is `position: absolute` in a positioned parent; Scale constraints map only to percentage insets. Figma's "first on top" reverses painting without changing layer order; CSS needs `z-index` per child, because reversing the flex direction also reverses reading order against the DOM. The toolkit reads absolute positions with suspicion: outside an auto-layout frame, a layer placed at x=412 usually means "here, in this frame", not `position: absolute` (`knowledge/code/figma-handoff.md#what-to-trust-in-a-design-file-and-what-not`).

**Baselines, grids and truncation.** Baseline alignment matches for text-only rows; how Figma treats a child without text is undocumented, while CSS synthesises a baseline from the box edge. Figma's grid has Flex tracks (like `fr`), Fixed and Hug (like `fit-content(100%)`), spans and gaps; it has no `minmax()`, `repeat(auto-fit, …)`, named areas or subgrid, so `repeat(auto-fit, minmax(240px, 1fr))` can only be drawn as separate frames per column count. Truncation is the three-property recipe for one line and `-webkit-line-clamp` for several (the unprefixed `line-clamp` is not yet Baseline); inside a flex row, CSS needs `min-width: 0` for the ellipsis to appear, and Figma does not.

**What to do.** **Change Figma**: update library frames to the current version; use baseline alignment only between text layers; use the truncation setting rather than a fixed-height box, which only clips. **Translate**: Fill as `flex: 1 1 0; min-width: 0`, Hug that must not shrink as `flex-shrink: 0`, negative gaps as margins, `z-index` for first-on-top, `min-width: 0` beside every truncation in a row. **Keep different**: content-weighted growth (`flex: auto`) and responsive grids, which the spec states as a rule (the minimum column width). Figma's own 2020 aim was auto layout as a thoughtful subset of flexbox; these are the parts it left out.

---

## 15. Cheat sheet

| # | Case | Figma | Code | Action |
|---|---|---|---|---|
| 1 | Frame shadow source | frame plus children unless clipped | `box-shadow` from the box | Change Figma: clip and fill |
| 1 | Shadow spread | filled, clipped frames and basic shapes | any box | Change Figma: same |
| 2 | Inner shadow | paints over children (tested) | under children | Translate: overlay pseudo-element |
| 3 | Several shadows | API array: last on top (tested) | first on top | Translate: reverse once |
| 4 | Shadow blur | about 12% softer | radius = 2 × std dev | Keep: copy 1:1 |
| 4 | Background, layer blur | double the CSS value | `backdrop-filter`, `filter` | Translate: halve |
| 5 | Glass, progressive blur, noise | native | no primitive | Keep: out of libraries |
| 6 | Stroke alignment | inside counted (new version) | the room-taking channel | Change Figma; rule 63 table |
| 7 | Focus ring | ring layer around the box | `outline`, offset `clear − width` | Translate; element keeps its radius |
| 8 | Dashed, gradient strokes | exact pattern; follows radius | browser-chosen; `border-image` square | Keep, or SVG / two backgrounds |
| 8 | Hairline 0.5px | drawn exactly | snapped to device pixels | Keep: "one device pixel" |
| 9 | Oversized mixed radius | each corner alone (tested) | all scaled together | Change Figma: radii that fit |
| 9 | Pill | no percentage | `50%` is an ellipse | Change Figma: 9999 |
| 9 | Corner smoothing | 0 to 100% | `corner-shape`, no stable Safari | Keep: 0 on web |
| 10 | Clip content | stroke over children (tested) | `overflow: clip` | Translate |
| 10 | Fill blend, pass through | blends with layers behind | own backgrounds only; stacking contexts isolate | Translate; Normal on roots |
| 11 | Fade to transparent | not premultiplied (reported) | premultiplied | Change Figma: same hue |
| 11 | Colour profile | sRGB or P3 per file | hex is sRGB | Change Figma: sRGB |
| 12 | Text rendering, weights | same on every OS; real styles only | OS rasteriser; synthesis | Keep after checking files; `font-synthesis: none` |
| 13 | Image Fill, masks | crop to cover; mask clips layers above | `object-fit: cover`; property of masked element | Translate; clipped frame |
| 13 | Icon colour and strokes | fixed fill; stroke kept on resize | `currentColor`; scales with `viewBox` | Change Figma: one bound colour, one rule |
| 14 | Fill | equal share | content minimum applies | Translate: `flex: 1 1 0; min-width: 0` |
| 14 | Negative gap | allowed | not allowed | Translate: negative margin |
| 14 | Responsive grid | fixed column counts | `auto-fit`, `minmax()` | Keep: state the rule |
| 14 | Truncation in a row | works alone | needs `min-width: 0` | Translate |

---

## 16. The short version

Figma draws a layer from everything it holds; CSS draws a box from its own edges. That is why an unclipped frame's shadow follows its children, why an inner shadow paints over content in Figma and under it in the browser, why spread needs a filled, clipped frame, and why a Figma mask belongs to the layers above it rather than to the element it masks.

The fixes that live in the Figma file are few and cheap: clip and fill every frame that carries a shadow; use inside strokes for borders and outside strokes for rings, on frames updated to the July 2026 auto layout; give mixed radii values that fit and pills 9999; fade gradients to the same hue; keep files in sRGB; use only the weights the code ships; draw icons on a square frame with one bound colour.

The translations belong in one place, done once: reverse the effects array, halve background and layer blur, map each stroke to the channel that takes the same room, draw rings as offset outlines that keep the element's radius, map Clip content to `overflow: clip`, put a fill's blend on a pseudo-element, and write Fill as `flex: 1 1 0; min-width: 0`.

What stays different is what CSS has no primitive for (glass, progressive blur, diamond gradients), what the browser decides (dash patterns, hairline widths, rasterisation) and what has not shipped everywhere (corner smoothing, until Safari ships `corner-shape`). Three behaviours no documentation states were confirmed by test and matter most, because each looks like a code bug and is not: a frame's shadow is cast by its children unless it clips, an inner shadow paints over children, and an oversized radius is clamped corner by corner.

---

## 17. What to re-check later

- **Auto layout versions.** Legacy frames keep the old behaviour until updated; from January 2027 the toggle becomes an Update button. Re-check whether legacy behaviour survives at all after that.
- **`corner-shape`.** Safari stable support; when it ships, section 9's advice changes.
- **`line-clamp`.** Unprefixed form not yet Baseline.
- **Outline corners under an offset.** Unspecified (csswg-drafts #8786); the toolkit's measurement is Chromium only.
- **Dev Mode CSS for auto layout.** The `flex: 1 0 0` mapping comes from a 2025 secondary source, before the July 2026 version.
- **Tested once.** Shadow source and Clip content, inner shadow over children, stroke over children, clip following radius, per-corner clamping and effects-array order were each tested once, on 1 October 2026, in one file; a renderer change could alter any of them.
- **Not verified.** Whether Figma premultiplies gradient alpha (one community report says not); its rounding of fractional strokes; pass-through children under a translucent frame; baselines for children without text; the corner join of unequal side strokes.
- **Evidence quality.** The blur factors rest on one third-party measurement (Bjango) and one Figma staff answer. No published user research on design-code rendering drift was found.

---

## Sources

### Primary: Figma

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

### Primary: specifications and MDN

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

### Primary: design systems

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

### The toolkit's own tested rules

- `standards/code-standard.md`, rules 25, 26 and 63 (stroke channels on 1,946 real nodes)
- `knowledge/code/figma-handoff.md` (strokes; focus rings, Chromium test of 25 October 2026; what to trust)
- `skills/design-code-parity/SKILL.md` (fonts in the measuring browser)

### Commentary and measurement

- [Bjango: blur radius comparison (measured)](https://bjango.com/articles/blurradiuscomparison/)
- [Tokens Studio: box shadow (known order issue)](https://docs.tokens.studio/manage-tokens/token-types/box-shadow)
- [Figma forum: fonts look different in the browser](https://forum.figma.com/ask-the-community-7/css-summary-why-fonts-look-different-in-figma-vs-the-browser-thinner-bolder-wrong-stroke-width-etc-54711)
- [Figma forum: gradient with opacity](https://forum.figma.com/ask-the-community-7/wrong-gradient-behavior-with-opacity-36185)
- [Figma forum: radial gradient vs CSS](https://forum.figma.com/report-a-problem-6/radial-gradient-in-figma-vs-css-52184)
- [Figma forum: stroke scaling in icons](https://forum.figma.com/suggest-a-feature-11/feature-request-proper-stroke-scaling-for-icons-inside-components-53897)
- [Zenn: Dev Mode CSS output for auto layout (2025)](https://zenn.dev/ncdc/articles/8cd9a7d2166379)
- [Nearform: Figma grid auto layout (June 2025, partly superseded)](https://nearform.com/digital-community/figmas-new-grid-auto-layout-what-it-does-and-doesnt-yet-do/)
- [slint issue 13749: Figma frame shadows from children](https://github.com/slint-ui/slint/issues/13749)
