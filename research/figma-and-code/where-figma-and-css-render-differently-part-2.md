# Where Figma and CSS render differently: paint, text and layout

Why clipping, blend modes, gradients, text, images and auto layout look right in Figma and render differently in the browser, and for each case whether to change the file, translate in code or keep the difference.

Part 2 of 2. [Part 1](where-figma-and-css-render-differently.md) covers shadows, blur, strokes and radii.

The library's Card passes its shadow and border review, and then the photo overlay comes out lighter in the browser, the header gradient loses its blue cast, the title is heavier on a Windows laptop, and the footer's two equal columns turn into one narrow and one wide. Every value was copied exactly.

The cause is the one [Part 1](where-figma-and-css-render-differently.md) follows: Figma draws a layer from everything it holds, while CSS draws a box from its own edges and leaves more to the browser.

---

## What this answers

- [Clipping, opacity, blend modes](#clipping-opacity-blend-modes): whether they translate
- [Gradients and colours](#gradients-and-colours): why they look different
- [Text rendering](#text-rendering): why text looks different
- [Images, masks and icons](#images-masks-and-icons): how they translate
- [Auto layout and flexbox](#auto-layout-and-flexbox): whether auto layout is now flexbox

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is this part in two paragraphs. Each case ends with one of Part 1's three actions: change Figma, translate in code, or keep different as a named deviation.

---

## Clipping, opacity, blend modes

Clip content is close to `overflow: clip`, layer opacity is `opacity` and fill opacity a translucent colour, but blend modes are where the models part: a Figma fill blends with whatever is behind the layer, CSS `background-blend-mode` only with the box's own backgrounds.

The Card's thumbnail is clipped to the card's curve, and its overlay uses Multiply to darken the photo. The clip carries over. The blend might not.

**Clipping** matches. Tested directly, a clipped 24px-radius frame trimmed a square child to the curve, and an 8px inside stroke painted over a full-bleed child, as CSS does at its curved padding edge. Prefer `overflow: clip`: `overflow: hidden` also makes a scroll container, scrollable by script and the containing block for sticky children.

**Blending** is where they part. Figma's default layer mode, Pass through, lets children's blend modes reach content below the parent; Normal stops them, which is CSS `isolation: isolate`. CSS has no pass-through value, and opacity below 1, a transform, a filter or a z-index all isolate. So a 90% opacity frame with a Multiply child may blend with the page in Figma (undocumented) and is always isolated in CSS. A Figma fill blend matches a pseudo-element carrying the fill with `mix-blend-mode`; CSS lacks Plus darker.

> **Aside.** Figma's September 2026 release added opacity over any colour through a number variable. In CSS that's relative colour syntax, `rgb(from var(--c) r g b / var(--a))`.

Translate Clip content to `overflow: clip` unless the box scrolls. Translate fill opacity to a translucent colour token, not `opacity`, which fades the content too, and a fill blend to a pseudo-element. Then change Figma: **set a component's root layer to Normal whenever a child blends**, and avoid blend modes outside the CSS list.

---

## Gradients and colours

Gradients differ for three causes (premultiplied alpha, radial geometry, the missing diamond) and colours for one: a hex value from a Display P3 file renders duller in CSS, which reads every hex as sRGB.

The Card's header has a gradient from opaque `#FF6A00` to `#0050FF` at zero opacity. In Figma the midpoint has a blue cast. In the browser it doesn't.

That's premultiplied alpha. CSS always premultiplies, so a colour at zero opacity contributes no hue; users report Figma doesn't, which is where the blue comes from. The space can differ too: CSS interpolates legacy sRGB colours in gamma-encoded sRGB, as Figma does, but `oklch()` colours in Oklab, with a different midpoint.

Radial geometry differs: a March 2026 forum report shows a 272 by 56 radial gradient, circular in Figma, exported by Dev Mode as `radial-gradient(183.69% 86.67% at ...)` and much wider in Chrome. Angular gradients map to `conic-gradient`; diamond gradients have no counterpart.

The colour cause is the file's profile. New Figma files default to sRGB. Changing a profile offers assign (the hex stays, the appearance changes) or convert (the reverse), and Figma copies P3 colours as `color(display-p3 r g b / a)`.

Change Figma first: **fade to the same hue at zero opacity, or add an explicit midpoint stop, which removes the premultiplication difference entirely.** Avoid diamond gradients. Keep library files in sRGB unless the pipeline emits `color(display-p3)` or `oklch()`, and convert rather than assign. Then translate: give radial gradients explicit sizes, and write `in srgb` on gradients built from OKLCH tokens to match what the designer saw.

---

## Text rendering

Text looks different mostly because of rasterisation, which nobody controls; the controllable causes are font files, weights the code doesn't ship, optical sizing, and settings Figma records but CSS needs written out.

The Card's title looks heavier in the browser on a Windows laptop, and its large heading is a different weight in Figma and in the browser. The first is rasterisation; the second is something the team can fix.

Figma's canvas renders text the same everywhere. Browsers use Core Text on macOS and DirectWrite with ClearType on Windows, which renders heavier; the CSS smoothing levers are non-standard and macOS-only.

Optical size is controllable. A variable font's `opsz` axis draws large sizes thinner and tighter. Browsers apply it by default ([`font-optical-sizing: auto`](https://developer.mozilla.org/en-US/docs/Web/CSS/font-optical-sizing)); Figma has a checkbox that maps font size to optical size ([Adobe Design](https://adobe.design/ideas/the-old-typography-is-new-again); its default state unchecked). So whichever side draws a fixed instance, a static file in code or the checkbox off in Figma, draws the heavier heading. [One type scale for UI and content](../foundations/one-type-scale-for-ui-and-content.md) covers choosing static or variable files.

The rest doesn't carry over on its own:

- **Weights.** Figma lists only styles a font file contains, while browsers fake a missing bold or italic through `font-synthesis`. A weight of 550 needs a variable font in code.
- **Underlines.** Offset and thickness set to auto can differ by a pixel; what Figma's percent is measured against is undocumented.
- **Case.** Figma's Capitalize is `text-transform: capitalize`, which MDN says is not title case.
- **OpenType.** Features Figma records, such as tabular numbers, have to be set in code (`font-variant-numeric: tabular-nums`).
- **Paragraphs and lists** live in one Figma text layer and on separate elements in code, where spacing becomes a margin or a gap.

Confirm the code loads the same font files, variable or static, and exclude antialiasing from pixel comparisons. Restrict text styles to weights the code loads, write underline values explicitly, set `font-synthesis: none` so a missing file shows as an error, and export OpenType features into the type tokens. **Load the real fonts in the measuring browser and assert the family that rendered**: the toolkit's parity loop adds that check because a fallback face once measured close enough to pass.

---

## Images, masks and icons

Image Fill is `object-fit: cover`, not `fill`; a Figma mask belongs to the layers above it, a CSS mask to the element it masks; and icon strokes scale by opposite defaults in the two tools.

The Card's thumbnail uses Figma's Fill, its avatar is masked to a circle, and its corner icon is a 24px glyph with a 2px stroke, resized to 16 in the compact card. All three need a decision.

**Images.** Figma's Fill crops to cover, which is `object-fit: cover`; CSS `object-fit: fill` stretches. Tile exists only as `background-repeat`, and Figma's per-paint image adjustments have no exact CSS match. A render of a node with an image fill returns the visible crop flattened, so transparent artwork has to come from the raw upload; one project shipped two hero images with baked white backgrounds that way (`standards/code-standard.md`, rule 26).

**Masks.** A vector mask becomes `clip-path`, an alpha mask `mask-image`, and the common rounded-rectangle mask is `overflow: clip` with a radius.

**Icons.** In Figma, resizing an instance with Scale constraints grows the geometry but keeps the stroke weight, so the 24px icon with a 2px stroke looks heavier at 16. An SVG scaled through its `viewBox` scales its stroke, unless `vector-effect: non-scaling-stroke` is set. SVG has only centre strokes, so inside and outside strokes are converted on export; and a hard-coded fill needs a colour per state, where `fill="currentColor"` would inherit hover and disabled for free.

Most of this is fixed in Figma. Use Fill or Fit for image fills, bake adjustments into the asset, and use a clipped frame instead of a rectangle mask. **Draw each icon as one vector on a fixed square frame equal to the code's `viewBox`, with one fill bound to a variable that code maps to `currentColor`.** Outline centre strokes before export, or keep them with a stated scaling rule.

---

## Auto layout and flexbox

Auto layout is closer to flexbox than ever on frames updated to the July 2026 version, and still different in specific ways: Fill shares space equally where CSS won't shrink an item below its content, negative gaps need margins, wrapping and baselines decide differently, and responsive grids exist only in code.

The Card's footer is a 400px row with a 16px gap and two Fill children. Child A holds the word "Short"; child B holds a 300px unbreakable URL. Here is what each tool does with it, drawn at 1.3 times its size.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 290" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>A 400px row with a 16px gap and two Fill children, drawn at 1.3x. Figma: A and B each get 192px, and B's 300px URL overflows past its box. CSS with flex 1 1 0: B takes its 300px minimum and A gets the remaining 84px.</title><rect width="880" height="290" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="289" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">A 400px row, 16px gap, two Fill children (drawn at 1.3x)</text><text x="32" y="117" font-size="12.5" fill="#1C1B19">Figma: equal share</text><rect x="180" y="90" width="520.0" height="44" fill="none" stroke="#CFC9BF" stroke-dasharray="4 3"/><rect x="180" y="90" width="249.60000000000002" height="44" fill="#FFFFFF" stroke="#5E7E93"/><text x="190" y="117" font-size="12" fill="#3F3C37">A: Short, 192px</text><rect x="450.40000000000003" y="90" width="249.60000000000002" height="44" fill="#FFFFFF" stroke="#A6552F"/><rect x="456.40000000000003" y="106" width="378.0" height="12" rx="3" fill="#D9A97E" fill-opacity="0.75"/><text x="456.40000000000003" y="152" font-size="11.5" fill="#77726B">B: 192px; the bar is the 300px URL</text><text x="32" y="217" font-size="12.5" fill="#1C1B19">CSS: flex: 1 1 0</text><rect x="180" y="190" width="520.0" height="44" fill="none" stroke="#CFC9BF" stroke-dasharray="4 3"/><rect x="180" y="190" width="109.2" height="44" fill="#FFFFFF" stroke="#5E7E93"/><text x="190" y="217" font-size="12" fill="#3F3C37">A: Short, 84px</text><rect x="310.0" y="190" width="390.0" height="44" fill="#FFFFFF" stroke="#A6552F"/><rect x="316.0" y="206" width="378.0" height="12" rx="3" fill="#D9A97E" fill-opacity="0.75"/><text x="316.0" y="252" font-size="11.5" fill="#77726B">B: 300px; the bar is the 300px URL</text><text x="180" y="276" font-size="11.5" fill="#77726B">The dashed outline is the 400px row.</text></svg>

Figma gives each child 192px, and the URL overflows inside B. CSS with `flex: 1 1 0` gives B its 300px minimum and A the remaining 84px.

**Fill and Hug.** Figma's Fill children share the space equally. CSS flex items have an automatic minimum size and don't shrink below min-content, which is why B won't; MUI's Stack documentation names the fix, `min-width: 0`. A Figma Hug item never shrinks; a CSS content-sized item (`flex: 0 1 auto`) does.

**Spacing and wrap.** Between, Evenly and Around are `space-between`, `space-evenly` and `space-around`; under the new version a lone child in a Between frame aligns to the start, as in CSS. Figma allows a negative gap for avatar stacks; CSS `gap` can't be negative, so minus 8 becomes `margin-inline-start: -8px` on every child but the first.

**Position and order.** A child that ignores auto layout is `position: absolute` in a positioned parent. Figma's "first on top" reverses painting without changing layer order; CSS needs `z-index` per child, because reversing the flex direction also reverses reading order. Outside an auto-layout frame, a layer at x=412 usually means "here", not `position: absolute` (`knowledge/code/figma-handoff.md#what-to-trust-in-a-design-file-and-what-not`).

**Grids and truncation.** Figma's grid has Flex, Fixed and Hug tracks and spans, but no `minmax()`, `repeat(auto-fit, …)`, named areas or subgrid, so `repeat(auto-fit, minmax(240px, 1fr))` can only be drawn as separate frames per column count. Inside a flex row, CSS truncation needs `min-width: 0` for the ellipsis to appear, and Figma doesn't.

In Figma, update library frames to the current version and use the truncation setting rather than a fixed-height box. In code, **write Fill as `flex: 1 1 0; min-width: 0`**, Hug that mustn't shrink as `flex-shrink: 0`, negative gaps as margins, `z-index` for first-on-top, and `min-width: 0` beside every truncation in a row. Keep responsive grids different, stated in the spec as a rule: the minimum column width.

---

## Cheat sheet

| Case | Figma | Code | Action |
|---|---|---|---|
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

Clip content is `overflow: clip`; fill opacity is a translucent colour, not `opacity`; a fill's blend goes on a pseudo-element, and a component's root is set to Normal whenever a child blends. Fade gradients to the same hue, keep files in sRGB, use only the weights the code ships, assert the font that rendered, and draw icons on a square frame with one bound colour that code maps to `currentColor`.

Auto layout is close to flexbox on frames updated to the July 2026 version, but write Fill as `flex: 1 1 0; min-width: 0`, negative gaps as margins and first-on-top as `z-index`. What stays different is what the browser decides (rasterisation) and what Figma can't draw (diamond gradients have no CSS counterpart; responsive grids have no Figma one), each stated as a rule.

---

## What to re-check later

Researched October 2026; re-checked November 2026.

- **Optical sizing.** Figma's optical-size checkbox is known from Adobe Design, not Figma's help; whether it is on by default is unchecked.
- **Tested once.** Clip following the radius and a stroke painting over a full-bleed child were tested once on a scratch file on 1 October 2026.
- **Not verified.** Whether Figma premultiplies gradient alpha (one community report says not); pass-through children under a translucent frame.

---

## Sources

**Primary: Figma**

- [Plugin API: node properties](https://developers.figma.com/docs/plugins/api/node-properties/)
- [Plugin API: FrameNode](https://developers.figma.com/docs/plugins/api/FrameNode/)
- [Plugin API: Paint](https://developers.figma.com/docs/plugins/api/Paint/)
- [Plugin API: GridTrackSize](https://developers.figma.com/docs/plugins/api/GridTrackSize/)
- [Help: Use auto layout with CSS Flexbox in mind](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind)
- [Help: Guide to auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)
- [Help: Grid auto layout flow](https://help.figma.com/hc/en-us/articles/31289469907863-Use-the-grid-auto-layout-flow)
- [Help: Blend modes](https://help.figma.com/hc/en-us/articles/360040667874-Apply-blend-modes-to-layers-fills-and-effects)
- [Help: Manage color profiles](https://help.figma.com/hc/en-us/articles/360039825114-Manage-color-profiles-in-design-files)
- [Help: Color models](https://help.figma.com/hc/en-us/articles/360043042113-Color-models-in-Figma-Design)
- [Help: Explore text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)
- [Help: Scale layers while maintaining proportions](https://help.figma.com/hc/en-us/articles/360040451453-Scale-layers-while-maintaining-proportions)
- [Release notes](https://www.figma.com/release-notes/)

**Primary: specifications and MDN**

- [CSS Backgrounds and Borders 3](https://www.w3.org/TR/css-backgrounds-3/)
- [CSS Color 4 (interpolation)](https://drafts.csswg.org/css-color-4/)
- [CSS Images 4](https://www.w3.org/TR/css-images-4/)
- [Compositing and Blending 1](https://www.w3.org/TR/compositing-1/)
- [MDN: overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow)
- [MDN: isolation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/isolation)
- [MDN: color-interpolation-method](https://developer.mozilla.org/en-US/docs/Web/CSS/color-interpolation-method)
- [MDN: flex](https://developer.mozilla.org/en-US/docs/Web/CSS/flex)
- [MDN: min-width](https://developer.mozilla.org/en-US/docs/Web/CSS/min-width)
- [MDN: gap](https://developer.mozilla.org/en-US/docs/Web/CSS/gap)
- [MDN: font-optical-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/font-optical-sizing)
- [MDN: font-synthesis](https://developer.mozilla.org/en-US/docs/Web/CSS/font-synthesis)
- [MDN: text-transform](https://developer.mozilla.org/en-US/docs/Web/CSS/text-transform)
- [MDN: text-underline-offset](https://developer.mozilla.org/en-US/docs/Web/CSS/text-underline-offset)
- [MDN: object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
- [MDN: mask-image](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image)
- [MDN: vector-effect](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/vector-effect)

**Primary: design systems**

- [MUI: Stack](https://mui.com/material-ui/react-stack/)

**The toolkit's own tested rules**

- `standards/code-standard.md`, rule 26 (image fills)
- `knowledge/code/figma-handoff.md` (what to trust in a design file)
- `skills/design-code-parity/SKILL.md` (fonts in the measuring browser)

**Commentary and measurement**

- [Adobe Design: the old typography is new again (Figma's optical-size checkbox)](https://adobe.design/ideas/the-old-typography-is-new-again)
- [Figma forum: fonts look different in the browser](https://forum.figma.com/ask-the-community-7/css-summary-why-fonts-look-different-in-figma-vs-the-browser-thinner-bolder-wrong-stroke-width-etc-54711)
- [Figma forum: gradient with opacity](https://forum.figma.com/ask-the-community-7/wrong-gradient-behavior-with-opacity-36185)
- [Figma forum: radial gradient vs CSS](https://forum.figma.com/report-a-problem-6/radial-gradient-in-figma-vs-css-52184)
- [Figma forum: stroke scaling in icons](https://forum.figma.com/suggest-a-feature-11/feature-request-proper-stroke-scaling-for-icons-inside-components-53897)
