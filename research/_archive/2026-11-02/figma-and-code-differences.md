# Where Figma and code disagree, and what to do about each

A case-by-case account of every place a Figma component and its coded version render, size or behave differently, split into rendering and into structure and behaviour, with one action per case: change the Figma file, translate in code, or keep the difference on purpose.

Researched October 2026. Figma mechanics checked against the Plugin API and REST documentation, Figma's help centre, Figma's engineering blog and staff answers on its forum. CSS behaviour checked against the CSSWG specifications and MDN. Design system evidence taken from each system's own token source or documentation: Primer, Atlassian, Polaris, Carbon, Material 3, Fluent 2, Spectrum, MUI, Braid and GOV.UK. Six Figma behaviours that no documentation states were tested directly on a scratch file on 1 October 2026 and are marked as tested where they appear.

---

## What this answers

A design system team that keeps a Figma library beside a coded one meets the same questions repeatedly, usually one at a time, usually when a screenshot comparison comes back wrong.

- Why does a shadow, stroke or radius look right in Figma and different in the browser?
- Which of those differences can be fixed by drawing the Figma file differently?
- Which should be translated by the engineer, and how?
- Which should stay different, because Figma cannot express the thing at all?
- What do Primer, Atlassian, Polaris, Material, Fluent, Carbon, Spectrum and MUI actually do about it?

Every case ends with one of three actions, used consistently throughout:

- **Change Figma.** Draw it differently, so the file says what the code will do. Used when Figma has a setting that matches code and the library is simply not using it.
- **Translate in code.** A known, mechanical conversion the engineer or the token pipeline applies every time. Used when the two tools express the same intent in different terms.
- **Keep different.** A named, accepted deviation. Used when one side has a capability the other lacks, and forcing parity would cost more than the difference.

Part one covers **rendering**: how a thing looks once drawn. Part two covers **structure and behaviour**: how a thing is sized, built, named, themed and how it acts. Line height, letter spacing and vertical trim are covered in depth by the companion guide `line-height-letter-spacing-figma-to-css.md`, and right-to-left layout by `rtl-design-systems.md`; both are only cross-referenced here. Each part ends with its own cheat sheet and short version; section 43 is the short version of the whole guide.

**Index**

**Part one: Rendering**

- [1. Why does a frame's shadow change shape when Clip content is toggled?](#1-why-does-a-frames-shadow-change-shape-when-clip-content-is-toggled)
- [2. Why does spread only work on some layers?](#2-why-does-spread-only-work-on-some-layers)
- [3. Does an inner shadow sit above or below the content?](#3-does-an-inner-shadow-sit-above-or-below-the-content)
- [4. When a layer has several shadows, which one is on top?](#4-when-a-layer-has-several-shadows-which-one-is-on-top)
- [5. Is a Figma blur value the same number as a CSS blur value?](#5-is-a-figma-blur-value-the-same-number-as-a-css-blur-value)
- [6. Can glass, progressive blur and the newer effects be built in code?](#6-can-glass-progressive-blur-and-the-newer-effects-be-built-in-code)
- [7. Should a stroke be inside, centre or outside?](#7-should-a-stroke-be-inside-centre-or-outside)
- [8. What about one-side, dashed and gradient strokes?](#8-what-about-one-side-dashed-and-gradient-strokes)
- [9. What happens to a half-pixel hairline?](#9-what-happens-to-a-half-pixel-hairline)
- [10. Does an oversized corner radius clamp the same way in both tools?](#10-does-an-oversized-corner-radius-clamp-the-same-way-in-both-tools)
- [11. How should a fully rounded pill be written?](#11-how-should-a-fully-rounded-pill-be-written)
- [12. Can corner smoothing ship to the web?](#12-can-corner-smoothing-ship-to-the-web)
- [13. Is Clip content the same as `overflow: hidden`?](#13-is-clip-content-the-same-as-overflow-hidden)
- [14. How do opacity and blend modes translate?](#14-how-do-opacity-and-blend-modes-translate)
- [15. Why does a gradient look different in the browser?](#15-why-does-a-gradient-look-different-in-the-browser)
- [16. Which colour profile should a library use?](#16-which-colour-profile-should-a-library-use)
- [17. Why does text look bolder or thinner in the browser?](#17-why-does-text-look-bolder-or-thinner-in-the-browser)
- [18. Which font weights and styles are safe to use?](#18-which-font-weights-and-styles-are-safe-to-use)
- [19. Do underline styles, text case and OpenType features carry over?](#19-do-underline-styles-text-case-and-opentype-features-carry-over)
- [20. Do paragraph spacing and lists carry over?](#20-do-paragraph-spacing-and-lists-carry-over)
- [21. How do image fills, filters and masks translate?](#21-how-do-image-fills-filters-and-masks-translate)
- [22. How should icon strokes behave when an icon is resized?](#22-how-should-icon-strokes-behave-when-an-icon-is-resized)
- [Part one in short](#part-one-in-short)

**Part two: Structure and behaviour**

- [23. Are Hug, Fill and Fixed the same as flexbox sizing?](#23-are-hug-fill-and-fixed-the-same-as-flexbox-sizing)
- [24. Do min and max sizes, auto spacing, negative gaps and wrapping match?](#24-do-min-and-max-sizes-auto-spacing-negative-gaps-and-wrapping-match)
- [25. How do absolute positioning and stacking order translate?](#25-how-do-absolute-positioning-and-stacking-order-translate)
- [26. Does baseline alignment match?](#26-does-baseline-alignment-match)
- [27. How far does Figma's grid go against CSS grid?](#27-how-far-does-figmas-grid-go-against-css-grid)
- [28. How do text resizing and truncation map?](#28-how-do-text-resizing-and-truncation-map)
- [29. Should a Figma library use rem?](#29-should-a-figma-library-use-rem)
- [30. Which tokens can Figma variables actually hold?](#30-which-tokens-can-figma-variables-actually-hold)
- [31. How do Figma modes relate to themes in code?](#31-how-do-figma-modes-relate-to-themes-in-code)
- [32. Should Figma variants mirror code props?](#32-should-figma-variants-mirror-code-props)
- [33. How should states and focus be drawn?](#33-how-should-states-and-focus-be-drawn)
- [34. Does motion carry over?](#34-does-motion-carry-over)
- [35. How should responsive behaviour be shown?](#35-how-should-responsive-behaviour-be-shown)
- [36. How much real content should a component show?](#36-how-much-real-content-should-a-component-show)
- [37. What accessibility information belongs in Figma?](#37-what-accessibility-information-belongs-in-figma)
- [38. How do overlays, sticky elements and scrolling translate?](#38-how-do-overlays-sticky-elements-and-scrolling-translate)
- [39. How should images behave at runtime?](#39-how-should-images-behave-at-runtime)
- [40. How should fonts behave at runtime?](#40-how-should-fonts-behave-at-runtime)
- [41. How should icons be built so they recolour in code?](#41-how-should-icons-be-built-so-they-recolour-in-code)
- [42. Which side do real systems treat as the source of truth?](#42-which-side-do-real-systems-treat-as-the-source-of-truth)
- [Part two in short](#part-two-in-short)
- [43. The short version](#43-the-short-version)
- [44. What to re-check later](#44-what-to-re-check-later)

---

# Part one: Rendering

---

## 1. Why does a frame's shadow change shape when Clip content is toggled?

**The short answer.** In Figma, a drop shadow on a frame is cast by everything the frame renders, its children included. With Clip content off, a square child that pokes past a rounded corner gives the shadow a square corner. In CSS, `box-shadow` is cast by the element's own rounded box and never by its children.

Figma's engineering blog describes the method plainly: copy the layer's geometry, fill it with one colour, blur it, and draw it underneath. For a frame, the geometry is the composite of the frame and its visible content. That composite is what Clip content changes. With clipping on, every child is cut to the frame's rounded outline first, so the composite is exactly the frame's shape. With clipping off, any child extending past the outline adds its own silhouette.

This was tested directly. A 160 by 120 frame with a white fill, a 24px radius and a solid drop shadow offset 12px down and 12px left was given a 60 by 60 square child in its bottom-left corner. With Clip content off, the child's square corner showed outside the rounded edge and the shadow beneath it came out square. With Clip content on, both the child and the shadow followed the 24px curve. The frame's own fill was irrelevant: it had one throughout.

CSS behaves differently at the root. The Backgrounds specification draws an outer `box-shadow` from the border box, following `border-radius`, and nothing inside the element affects its shape. The CSS function that does follow content is `filter: drop-shadow()`, which casts a shadow from the alpha of everything the element paints, children included. So Figma with Clip content off behaves like `filter: drop-shadow()`, and Figma with Clip content on behaves like `box-shadow`.

| Figma frame | Shadow cast from | CSS equivalent |
|---|---|---|
| Fill, radius, Clip content **on** | The frame's rounded shape | `box-shadow` |
| Fill, radius, Clip content **off**, child overflowing | Frame plus every visible child | `filter: drop-shadow()` |
| No fill | The children only | `filter: drop-shadow()` |

A related option, **Show behind transparent areas** (`showShadowBehindNode` in the Plugin API), only appears when a layer's fill is translucent or absent. With it off, Figma does not draw the shadow through translucent pixels, which matches `box-shadow` (cut out under the box). With it on, the shadow shows through, which matches `drop-shadow()`.

**What to do. Change Figma.** Any frame that carries an elevation shadow should have Clip content on and a visible fill, with Show behind transparent areas off. That makes the Figma silhouette identical to the border box, which is what the coded `box-shadow` will produce, and it is also the precondition for spread (section 2). Keep the content-following behaviour only where the design genuinely needs a shadow shaped like the content (an icon, a cut-out sticker), and then say so, because code must use `filter: drop-shadow()`, which has neither spread nor inset. This is this guide's judgment; no system was found documenting the mismatch, though every system's shadow tokens are `box-shadow` values, which settles which behaviour they expect.

---

## 2. Why does spread only work on some layers?

**The short answer.** Figma accepts a shadow spread only on rectangles and ellipses, and on frames, components and instances that have a visible fill and Clip content on. CSS `box-shadow` accepts spread on any box. Several real shadow tokens use spread, so a library has to meet Figma's condition to draw them at all.

The Plugin API states the rule directly, and the help centre adds that the fill must be at least 1% opacity. The reason is historical and deliberate: when Figma shipped spread in 2020, its blog explained that the aim was to do at least what CSS can, and CSS spread only exists on boxes. A Figma staff answer on the forum confirms that the fill and clip requirements follow from how the feature was built. Spread on a vector, on text, or on an unclipped frame has no box to grow, so Figma does not apply it.

The values that depend on this are not exotic. Atlassian's dark theme draws its overlay shadow with a one-pixel ring, `0px 0px 0px 1px #BDBDBD1F`, as its first layer. Primer's `shadow.floating.small` begins with a `0 0 0 1px` ring. Polaris uses negative spread across its whole scale, for example `shadow-300: 0px 4px 6px -2px rgba(26,26,26,0.20)`, which tucks the shadow under the box. Material's ambient shadow at level 1 is `0 1px 3px 1px`. Drawn on a frame without a fill or without clipping, every one of these renders in Figma as if spread were zero.

One more difference is worth knowing: CSS `filter: drop-shadow()` accepts no spread either. A design that needs both a content-shaped shadow and spread cannot be built with either primitive alone.

**What to do. Change Figma.** Every component whose shadow token has a non-zero spread must be a filled, clipped frame. This is a hard engine restriction with no workaround inside Figma, so the only choices are meeting it or losing the spread silently.

---

## 3. Does an inner shadow sit above or below the content?

**The short answer.** Above it, in Figma. Tested directly, a Figma inner shadow paints over a frame's children. CSS paints `box-shadow: inset` immediately above the background and below the content, so children cover it. A design that relies on the inner shadow showing over an image or a filled child needs a different construction in code.

Figma's help centre documents the paint order of a single layer from top to bottom as layer blur, stroke paints, inner shadow, fill paints, drop shadow and background blur. For the layer itself that matches CSS exactly: fill, then inset shadow, then border. What Figma's documentation does not say is where a frame's children sit in that stack.

The test answered it. A clipped frame with a red inner shadow of 16px spread was given a green child spanning its full width. In the result, the red inset band ran across the green child at both ends, tinting it brown. The inner shadow was painted over the child, not under it. In the CSS specification, inset shadows are drawn just above the background, so the same child would cover them completely.

Polaris shows what a real system does when it wants the Figma behaviour in code. Its bevel, `--p-shadow-bevel-100`, is four one-pixel inset shadows, and Polaris draws it not on the element itself but on an absolutely positioned `::before` pseudo-element with `pointer-events: none` and a luminosity blend. That overlay sits above the content, which is the only way CSS can put an inset effect over children.

**What to do. Change Figma, or translate in code, depending on intent.** Where an inner shadow is a pressed or recessed surface with plain content, nothing visible changes and no action is needed. Where it must read over an image or a filled child, the code must use an overlay pseudo-element in the Polaris manner, and the component spec should say so. Where it should sit under content, draw the content inset from the edge in Figma, so the shadow is not covered there either.

---

## 4. When a layer has several shadows, which one is on top?

**The short answer.** CSS paints the first shadow in the list on top. In Figma's effects array, as the Plugin API returns it, the last entry paints on top, which was tested directly. Any pipeline that copies the array into a CSS list in the same order reverses the stack.

The CSS rule is in the specification: the first shadow is on top, the rest layered behind. In the test, a frame carried two opaque drop shadows, the first entry red at 20px offset and the second blue at 30px; the blue one painted over the red. Secondary sources report that the panel shows the front-most effect at the top, which makes panel order equal to CSS order and the API array the reverse of both. Dev Mode once emitted reversed CSS; a Figma staff member reported it fixed in March 2024. Tokens Studio still lists reversed shadow order on import as a known issue.

Most real shadow tokens have two or three layers, so this bites often. Fluent's `shadow16` is `0 0 2px` ambient plus `0 8px 16px` key; Atlassian's raised shadow is two layers; Spectrum's `drop-shadow-elevated` is three; MUI's 24 elevations are three each. Reversing a key and an ambient layer changes which edge looks crisp.

**What to do. Translate in code.** Leave Figma as it is, and reverse the effects array exactly once, in the export transform, with a test that a two-colour fixture comes out in the right order. The difference is a data-order convention, not a visual one, so it belongs in one function rather than in anyone's head.

---

## 5. Is a Figma blur value the same number as a CSS blur value?

**The short answer.** For drop shadows, close enough to copy: a Figma shadow blur renders about 12% softer than the same number in `box-shadow`. For background blur and layer blur, no: the CSS value is roughly half the Figma value.

CSS uses two different conventions in two places. A `box-shadow` blur value is a radius, and the specification says it produces a Gaussian blur whose standard deviation is half that value. `filter: blur()` and `backdrop-filter: blur()` take the standard deviation itself. So a 16px `box-shadow` blur and a 16px `filter: blur()` are not the same amount of blur; the filter is about twice as strong.

Figma uses one convention for all three of its blurs. Bjango measured every major tool against CSS in 2024 and found that Figma's drop shadow, layer blur and background blur all scale identically, and that Figma is the closest of any tool to `box-shadow`. A Figma shadow blur of 16 matches a `box-shadow` blur of about 14. For background blur, a Figma staff answer is explicit: Dev Mode divides the value by two, because Figma's radius is effectively double the CSS one, so 30px in Figma is 15px in CSS. Bjango's figures give a factor of about 0.44, close to the staff rule.

| Figma effect | Figma value | CSS property | CSS value that matches |
|---|---|---|---|
| Drop shadow blur | 16 | `box-shadow` blur | about 14 (copy 16; about 12% softer) |
| Background blur | 30 | `backdrop-filter: blur()` | 15 |
| Layer blur | 30 | `filter: blur()` | about 13 to 15 |

**What to do. Keep different for shadows, translate in code for blurs.** Copy shadow blur values one to one and write the tolerance down once; a 12% difference is below what anyone notices at elevation sizes, and correcting it would make every token differ from the file that is its reference. Halve background and layer blur values in the token transform, in one place, citing Figma's own rule.

---

## 6. Can glass, progressive blur and the newer effects be built in code?

**The short answer.** Not with any CSS primitive. Progressive blur, glass, noise and texture exist in Figma and have no equivalent property in CSS. Background blur exists in both, with one CSS-only trap.

Figma's API exposes a progressive blur (`blurType: 'PROGRESSIVE'` with start radius and start and end offsets) and a glass effect with light intensity, light angle, refraction, depth, dispersion and radius. CSS has `backdrop-filter: blur()`, which is uniform. A progressive blur in CSS is built from several stacked `backdrop-filter` layers under `mask-image` gradients; refraction would need an SVG filter referenced from `backdrop-filter`, whose cross-browser support was not verified. Each of those is a bespoke build, not a token.

Background blur itself translates, but CSS adds a constraint Figma does not have. `backdrop-filter` only blurs what lies behind it up to the nearest backdrop root, which is any ancestor with a filter, an opacity below 1, a mask, a clip path, a backdrop filter or a blend mode. A blurred panel inside a 90% opacity wrapper blurs only the wrapper's contents. Both tools need a translucent fill for the blur to show at all.

**What to do. Keep different.** Keep glass, progressive blur, noise and texture out of component libraries and treat each use in a product screen as a custom build with its own spec. Background blur may stay in the library, with its value halved (section 5) and a note about backdrop roots on any component that sits inside a translucent container. This is consensus by absence: none of the systems surveyed ships a glass or progressive blur token.

---

## 7. Should a stroke be inside, centre or outside?

**The short answer.** Inside, for anything that is a border in code. Outside or centre, only for focus rings and selection outlines, which are `outline` in code. Since July 2026 Figma's auto layout treats an inside stroke exactly like a CSS border under `box-sizing: border-box`, so this choice now decides whether the sizes match.

A CSS `border` always sits inside the element's box and takes space. An `outline` sits outside the border edge and takes none; in current browsers it follows `border-radius`. An inset `box-shadow` of `0 0 0 1px` paints inside the box and also takes no space. Figma offers inside, centre and outside, and implements the inside and outside cases by doubling the stroke and masking it with the fill.

Figma's auto layout was updated to match. Its help article on building auto layout with CSS flexbox in mind says that inside strokes are counted in layout by default, that a centre or outside stroke now behaves like an outline and is never counted, and that the frame-level stroke setting no longer affects children. The Plugin API states that when strokes are included, a frame behaves like `box-sizing: border-box`. The new behaviour became the default for new frames in July 2026; older frames keep the legacy behaviour until updated, and the toggle becomes a one-way Update button in January 2027.

A 40px button with 8px vertical padding and a 1px stroke shows what the setting decides:

| Construction | Rendered height | Content height |
|---|---|---|
| Figma, fixed 40, inside stroke counted in layout | 40 | 22 |
| CSS, `height: 40px`, `border: 1px`, `border-box` | 40 | 22 |
| CSS, `height: 40px`, `border: 1px`, `content-box` | 42 | 40 |
| Figma, hug, stroke not counted (legacy default) | 40, stroke painted over the padding | 24 |
| CSS, auto height, `border: 1px` | 42 | 24 |
| CSS, auto height, inset `box-shadow` ring | 40 | 24 |

The legacy row is the one that produces two-pixel drift: Figma reports 40, the browser renders 42.

Real systems split on which code primitive draws the stroke. Primer ships `boxShadow.thin` as `inset 0 0 0 {borderWidth.thin}`, described as a thin shadow used instead of a border to prevent layout shift. MUI's outlined text field draws its border on an absolutely positioned `fieldset`, so the change from 1px to 2px on focus never moves the content. Both are code equivalents of a stroke that does not count in layout. Everyone else uses `border`.

**What to do. Change Figma.** Update library frames to the current auto layout version, use inside strokes for borders, and set code to `border-box` globally; that is the only pairing where every number agrees. Draw focus rings and selection rings as outside strokes, mapped to `outline`, because they must not shift layout when state changes. Where a border changes width between states, follow Primer or MUI and draw it as an inset ring, which a Figma inside stroke excluded from layout represents exactly.

---

## 8. What about one-side, dashed and gradient strokes?

**The short answer.** One-side strokes translate. Dashed strokes do not, because CSS lets the browser choose the dash pattern. Gradient strokes do not either, because CSS `border-image` ignores `border-radius`.

**One-side strokes** map to `border-top` and its siblings. Two details differ. With a radius and unequal sides, CSS draws a smooth transition through the corner and leaves the exact join where colours change undefined; Figma documents neither. A rounded card with a 4px coloured left edge and 1px elsewhere will differ in the corner pixels. And under the new auto layout, a centre or outside one-side stroke still counts as an outline, while a CSS side border always takes space.

**Dashed strokes** in Figma have exact dash length, gap and cap, and Figma starts and ends each dashed line with a half dash. CSS `border-style: dashed` is defined only as a series of square-ended dashes; the length, gap and corner distribution belong to the browser. A Figma 4 by 4 round-capped dash has no `border` equivalent. The exact pattern needs SVG, with `stroke-dasharray` and `stroke-linecap`, either inline or as a background image.

**Gradient and image strokes** look like `border-image`, but both MDN and the specification say border images are not affected by `border-radius`. A 12px-radius card with a gradient stroke renders with square corners. The working recipe is two backgrounds, the fill clipped to `padding-box` and the gradient to `border-box`, under a transparent border.

**What to do. Change Figma for one-side strokes, keep different for the other two.** Use inside alignment for side strokes, and draw accent edges on rounded cards as a separate child, which renders identically in both tools. Keep a generic dashed intent for things like drop zones, document that the pattern is browser-chosen, and switch to SVG only where the exact pattern matters. Treat gradient strokes as per-component decoration with a stated recipe, never as a token type.

---

## 9. What happens to a half-pixel hairline?

**The short answer.** Figma draws a 0.5px or 0.66px stroke anti-aliased at that exact width. Browsers snap border widths to whole device pixels, so the same token renders as different physical widths on different screens.

The CSS Values specification defines how a border width is snapped: a whole number of device pixels is kept, anything between zero and one device pixel rounds up to one, and anything above one rounds down. Polaris ships a real case, `border-width-0165` at 0.66px. On a 1x screen it becomes one device pixel, so 1 CSS pixel, half again as thick as the token. On a 2x screen it is 1.32 device pixels, rounded down to 1, so 0.5 CSS pixels. On a 3x screen it is exactly 2 device pixels. Figma's own rounding of fractional strokes is undocumented.

**What to do. Keep different.** Name a hairline token for what it is, one device pixel, rather than for a CSS value, and accept that its CSS width varies by density. A 0.5px token on a 1x screen doubles to 1px; a library that cares about that difference has to decide it per screen density in code, not in Figma.

---

## 10. Does an oversized corner radius clamp the same way in both tools?

**The short answer.** No. Tested directly, Figma clamps each corner on its own. CSS scales all four corners down by the same factor. A shape with mixed radii that do not fit comes out with different corners.

The CSS rule is in the Backgrounds specification: if adjacent radii on any side add up to more than that side's length, compute the smallest ratio of side length to radius sum and multiply every radius by it. The specification's own example scales a 6em by 2em box's radii by 0.8.

The test used a 160 by 40 frame with radii of 8, 40, 8 and 40 (top-left, top-right, bottom-right, bottom-left). Figma rendered the 8px corners at 8 and the 40px corners at 20, half the height, while the stored values stayed 8 and 40. In CSS the right and left sides each carry 48px of radius over 40px of length, so every radius is multiplied by 40/48, about 0.83: the small corners render at 6.67 and the large ones at 33.3.

| Corner | Stored | Figma renders | CSS renders |
|---|---|---|---|
| Top-left, bottom-right | 8 | 8 | 6.67 |
| Top-right, bottom-left | 40 | 20 | 33.3 |

Where all four radii are equal, the two rules agree: both produce a pill. The difference only appears with mixed radii that overflow, which is rare in a library and common in one-off shapes like tabs and chat bubbles.

**What to do. Change Figma.** Never let a component rely on clamping when its radii differ. Draw mixed-radius shapes with radii that fit the smallest size the component can take, and both tools then render the stored values.

---

## 11. How should a fully rounded pill be written?

**The short answer.** As a very large pixel radius, 9999px, not as 50%. Almost every system surveyed does exactly this, and it is the one value that means the same thing in Figma and in CSS.

In CSS, a percentage radius refers to the box's width horizontally and its height vertically, so `50%` on a non-square box draws an ellipse, not a pill. Figma has no percentage radius at all. A large pixel value works in both because both tools then clamp it to half the shorter side, which is the pill shape; with equal radii, the two clamping rules of section 10 agree.

The convergence is near-total: Primer `borderRadius-full` is 9999px, Material `md.sys.shape.corner.full` is 9999px, Polaris `border-radius-full` is 9999px, Atlassian `radius.full` is 9999px, Fluent `borderRadiusCircular` is 10000px. Two counter-examples are instructive. Spectrum defines `corner-radius-1000` as a multiplier of 0.5, a size-relative full radius that its own pipeline resolves. Atlassian ships `radius.tile` as 25%, a value Figma cannot express at all.

**What to do. Change Figma.** Use one full-radius variable at 9999 and bind pills to it. Treat any percentage radius token as code-only and give it a pixel value per size in Figma.

---

## 12. Can corner smoothing ship to the web?

**The short answer.** Not as drawn, yet. Figma's smoothing produces a continuous curve (60% matches Apple's iOS 7 squircle). CSS now has `corner-shape: squircle` and `superellipse()`, but it is not Baseline, and there is no published mapping from Figma's percentage to the CSS curve.

Figma's `cornerSmoothing` ranges from 0 to 1 and applies to the whole shape. CSS Borders 4 adds `corner-shape` with `round`, `squircle` (defined as `superellipse(2)`), `bevel`, `scoop`, `notch`, `square` and `superellipse(n)`. It needs a `border-radius` to act on, and background, border, outline, shadow, overflow and backdrop filter all follow it. As of this research, Chrome and Edge ship it from 139, Firefox from 160, and Safari only in Technology Preview. Figma's smoothing also lengthens the curve, which `superellipse(n)` does not, so even `squircle` at the same radius will not match 60%.

On Apple platforms the native match is SwiftUI's continuous rounded corner style, which is why the option exists in Figma.

**What to do. Keep different.** Use zero smoothing in web components. Where a product wants the look, add `corner-shape` as progressive enhancement behind `@supports`, and accept that it approximates. Keep smoothing for components that target iOS.

---

## 13. Is Clip content the same as `overflow: hidden`?

**The short answer.** Close. Both clip children to the rounded shape. CSS clips at the inner edge of the border; Figma's frame stroke, tested directly, paints over children, so the visible result is the same. The differences are what clipping does to the shadow (section 1) and that `overflow: hidden` creates a scroll container.

The CSS specification says that any overflow value other than visible clips to the curved padding edge, which is inside the border. Figma documents only that Clip content hides what extends beyond the bounds. The tests filled the gap: a clipped frame with a 24px radius trimmed a square child to the curve, and a clipped frame with an 8px inside stroke and a full-bleed child showed the stroke painted on top of the child. In CSS the child cannot reach the border at all; in Figma it reaches it but is painted over. Both look the same.

Two CSS values clip. `overflow: hidden` clips and creates a scroll container, which can still be scrolled by script and becomes the containing block for sticky children. `overflow: clip` clips without creating one, and supports `overflow-clip-margin`.

**What to do. Translate in code.** Map Clip content to `overflow: clip` unless the box scrolls, in which case use `auto`. Where a child image sits inside a bordered, rounded frame, give it an explicit inner radius of the outer radius minus the border, which is what both tools draw.

---

## 14. How do opacity and blend modes translate?

**The short answer.** Layer opacity is CSS `opacity`, and fill opacity is a translucent colour. Blend modes are harder: a Figma fill blend mode blends with whatever is behind the layer, while CSS `background-blend-mode` only blends a box's own background layers, and CSS has no pass-through mode.

Figma's default for layers is Pass through, which lets children's blend modes reach content below the parent. Setting a parent to Normal stops them, which is what CSS `isolation: isolate` does. CSS has no explicit pass-through value; its default behaves like pass-through until something creates a stacking context, and in CSS many things do: opacity below 1, a transform, a filter or a z-index. So a Figma frame at 90% opacity with a Multiply child may blend with the page in Figma (undocumented) and is always isolated in CSS.

The fill case trips up direct translation. A Figma fill set to Multiply blends with layers behind the node. The CSS property with the matching name, `background-blend-mode`, blends only between the element's own background layers, as if in an isolated group. The CSS construction that matches Figma is a pseudo-element carrying the fill, with `mix-blend-mode`. CSS also lacks Figma's Plus darker.

Figma's September 2026 release added opacity applied over any colour through a number variable. The CSS equivalent is relative colour syntax, `rgb(from var(--c) r g b / var(--a))`.

**What to do. Change Figma for structure, translate in code for values.** Set component roots to Normal whenever a child uses a blend mode, so Figma isolates the way CSS will. Map fill opacity to a translucent colour token rather than to `opacity`, which would also fade the content. Avoid blend modes outside the CSS list in libraries.

---

## 15. Why does a gradient look different in the browser?

**The short answer.** Three causes. A fade to transparent mixes colours differently, because browsers premultiply alpha and Figma reportedly does not. A radial gradient on a non-square box is scaled differently. And CSS has no diamond gradient.

The CSS Color 4 specification sets the interpolation rules. Gradients written with legacy sRGB colours (hex, `rgb()`, named colours) interpolate in gamma-encoded sRGB, which is what Figma does; gradients written with modern colour functions such as `oklch()` default to Oklab, a different midpoint. CSS always interpolates with premultiplied alpha, so a colour at zero opacity contributes no hue. Figma's documentation is silent, but users report that Figma does not premultiply: a gradient from opaque `#FF6A00` to `#0050FF` at zero opacity shows a blue cast at its midpoint in Figma and none in the browser.

Radial gradients differ in geometry. A forum report from March 2026 shows a 272 by 56 radial gradient, circular in Figma, exported by Dev Mode as `radial-gradient(183.69% 86.67% at ...)` and rendering much wider in Chrome. Angular gradients map to `conic-gradient`, which starts at twelve o'clock. Diamond gradients have no CSS counterpart.

**What to do. Change Figma.** Fade to the same hue at zero opacity, never to a different transparent colour, or add an explicit midpoint stop; this one change removes the premultiplication difference entirely. Avoid diamond gradients in libraries. Translate in code: specify radial gradient sizes explicitly rather than accepting Dev Mode's percentages, and if colour tokens are OKLCH, write `in srgb` on the gradient to match what the designer saw.

---

## 16. Which colour profile should a library use?

**The short answer.** sRGB, unless the code ships Display P3 colours. A hex value from a P3 file pasted into CSS renders as a different, duller colour, because CSS hex is always sRGB.

New Figma files default to sRGB; the old Unmanaged option was retired in 2023. Changing a file's profile offers two paths: assign (the hex values stay, the appearance changes) or convert (the appearance stays, the hex values change). Figma stores each colour in the space it was entered in, and its CSS colour model copies P3 colours as `color(display-p3 r g b / a)`. CSS reads every hex value as sRGB and needs `color(display-p3 ...)` or `oklch()` to reach P3.

**What to do. Change Figma.** Keep library files in sRGB so the hex values are the values code renders. Move a file to P3 only together with a token pipeline that emits `color(display-p3)` or `oklch()`, and convert rather than assign when doing so.

---

## 17. Why does text look bolder or thinner in the browser?

**The short answer.** Mostly rasterisation, which nobody controls: Figma draws text the same way on every operating system, browsers hand it to the system, and Windows renders heavier than macOS. One cause is controllable: a font with an optical size axis rendered as a static file.

Figma's canvas uses its own renderer and looks the same everywhere. Browsers use Core Text on macOS and DirectWrite with ClearType on Windows, and the Figma forum has many reports of text looking bolder in a Windows browser than in Figma. The CSS levers, `-webkit-font-smoothing` and `-moz-osx-font-smoothing`, are non-standard, work on macOS only, and MDN advises against them; forcing greyscale smoothing makes light text on dark backgrounds look thinner.

The controllable cause is optical size. CSS `font-optical-sizing` defaults to `auto`, which uses a font's `opsz` axis to thin large headings. If the code ships a static instance of a font that Figma uses as a variable font, or the reverse, headings render at a different weight in each.

**What to do. Keep different, after one check.** Confirm the code loads the same font files, variable or static, as the Figma library, and the same optical size behaviour. Then exclude antialiasing from pixel comparisons; there is nothing left to align.

---

## 18. Which font weights and styles are safe to use?

**The short answer.** Only the weights and styles the code actually ships. Figma lists only the styles a font file contains; browsers silently fake a missing bold or italic.

Figma's plugin typings accept variable axis settings such as `{wght: 600}`, mirroring CSS `font-variation-settings`, and pick the nearest named instance when no style is given. CSS maps `font-weight` to the `wght` axis and, by default, has `font-synthesis` on: a missing bold is drawn by thickening strokes, a missing italic by slanting upright glyphs. A Figma weight of 550 needs a variable font in code; with static files, the browser snaps to 500 or 600.

**What to do. Change Figma.** Restrict text styles to the weights the code loads. Translate in code: set `font-synthesis: none` so a missing file shows up as a visible error rather than as a faked style.

---

## 19. Do underline styles, text case and OpenType features carry over?

**The short answer.** Mostly, if written as explicit values. Underline offset and thickness exist in both tools. Figma's Title case is not title case. OpenType features turned on in Figma are lost unless code sets them.

**Underlines.** Figma's plugin typings expose underline style (solid, wavy, dotted), offset and thickness in pixels, percent or auto, colour, and skip ink. CSS has `text-decoration-style` (which adds double and dashed), `text-underline-offset`, `text-decoration-thickness` and `text-decoration-skip-ink`. The auto values come from each engine's reading of the font metrics and can differ by a pixel; what Figma's percent unit is measured against is undocumented.

**Text case.** Figma's help defines its Capitalize option as upper-casing the first letter of every word, which is CSS `text-transform: capitalize`. MDN is explicit that this does not create title casing, since it does not skip articles. Small caps belong to `font-variant-caps`, not `text-transform`, and are synthesised if the font lacks the `smcp` feature.

**OpenType features.** Figma records only features a designer turned on or off explicitly, such as tabular numbers. Defaults like ligatures and kerning are on in both. A feature switched on in Figma must be set in code, ideally as `font-variant-numeric: tabular-nums` rather than the lower-level `font-feature-settings`.

**What to do. Change Figma and translate in code.** Write underline offset and thickness as explicit values, never auto, wherever an underline must match. Put real title case in the content itself, and use text case only for upper and lower. Export explicit OpenType features into the typography tokens.

---

## 20. Do paragraph spacing and lists carry over?

**The short answer.** The numbers do, the structure does not. Figma keeps paragraphs and list items inside one text layer. Code uses separate elements, so the same spacing lives on a different box.

Figma's text layers carry paragraph spacing and first-line indent in pixels, and list settings for ordered and unordered lists with list spacing and hanging punctuation. Code writes `<p>`, `<ul>` and `<ol>`; paragraph spacing becomes a margin (and adjacent vertical margins can collapse), list spacing becomes a gap between items, and markers are styled through `::marker`. Hanging punctuation in CSS is supported in Safari only.

**What to do. Keep different, translate the values.** Code needs the semantic elements, which Figma cannot express. Map paragraph spacing to a margin token and list spacing to the gap between items, and accept that marker glyphs and indents follow each tool's defaults unless the spec names them.

---

## 21. How do image fills, filters and masks translate?

**The short answer.** Image Fill and Fit map to `object-fit: cover` and `contain`. Crop and Tile need extra construction. Image adjustments mostly have no CSS equivalent. A Figma mask belongs to the layers above it; a CSS mask belongs to the element it masks.

The naming is the trap. Figma's Fill crops to cover the box, which is `object-fit: cover`. CSS `object-fit: fill` stretches and distorts, the opposite. Crop needs `object-position` with overflow, or a pre-cropped asset; Tile exists only as `background-repeat`. Figma's image adjustments (exposure, contrast, saturation, temperature, tint, highlights, shadows) apply per paint; CSS `filter` has brightness, contrast and saturation on whole elements with different curves, and nothing for the rest.

Figma masks a sibling stack: the mask layer clips the layers above it. CSS `clip-path` and `mask-image` are properties of the element being masked. A vector mask becomes `clip-path`, an alpha or luminance mask becomes `mask-image`, and the common case, a rounded rectangle mask, is just `overflow: clip` with a radius.

**What to do. Change Figma.** Use Fill or Fit for image fills, bake adjustments into the exported asset, and use a clipped frame instead of a rectangle mask wherever one will do. Translate the rest in code.

---

## 22. How should icon strokes behave when an icon is resized?

**The short answer.** Decide one rule and draw it the same way in both tools. Figma and SVG make opposite default choices about whether a stroke grows with its icon.

In Figma, the Scale tool scales strokes, but resizing an instance whose constraints are set to Scale grows the geometry while keeping the stroke weight, so a 24px icon drawn with a 2px stroke looks heavier at 16 and lighter at 32. An inline SVG scaled through its `viewBox` scales its stroke; `vector-effect: non-scaling-stroke` keeps it constant. SVG also supports only centre strokes, so Figma converts inside or outside strokes on export, which keeps the appearance but means code can no longer change `stroke-width` or recolour the stroke as a stroke.

**What to do. Change Figma.** Draw icons with centre strokes, on a fixed square frame equal to the code's `viewBox`, and either outline strokes before export (everything scales uniformly) or keep them as strokes with a stated scaling rule. Bind the icon colour to one variable that code maps to `currentColor` (section 41).

---

## Part one in short

### Cheat sheet: rendering

| # | Case | Figma | Code | Action |
|---|---|---|---|---|
| 1 | Frame shadow source | Frame plus children unless clipped | `box-shadow` from the box | Change Figma: clip and fill every shadowed frame |
| 2 | Shadow spread | Only on filled, clipped frames and basic shapes | Any box | Change Figma: same as 1 |
| 3 | Inner shadow | Paints over children | Paints under children | Translate: overlay pseudo-element where it must show over content |
| 4 | Several shadows | API array: last on top | List: first on top | Translate: reverse once in the transform |
| 5 | Shadow blur | About 12% softer than CSS | Radius = 2 × std dev | Keep: copy 1:1, note tolerance |
| 5 | Background and layer blur | Double the CSS value | `backdrop-filter`, `filter` | Translate: halve |
| 6 | Glass, progressive blur, noise, texture | Native effects | No primitive | Keep: out of libraries |
| 7 | Stroke alignment | Inside counted in layout (new version) | `border` in `border-box` | Change Figma: inside for borders, outside for rings |
| 8 | One-side stroke | Per side | `border-top` etc. | Change Figma: inside; accent as child |
| 8 | Dashed stroke | Exact dash, gap, cap | Browser-chosen | Keep, or SVG where exact |
| 8 | Gradient stroke | Follows radius | `border-image` ignores radius | Keep: per-component recipe |
| 9 | Hairline 0.5px | Drawn exactly | Snapped to device pixels | Keep: name it "one device pixel" |
| 10 | Oversized mixed radius | Each corner clamped alone | All scaled together | Change Figma: radii that fit |
| 11 | Pill | No percentage | `50%` is an ellipse | Change Figma: 9999 |
| 12 | Corner smoothing | 0 to 100% | `corner-shape`, not Baseline | Keep: 0 on web |
| 13 | Clip content | Clips to radius; stroke over children | `overflow: clip` | Translate |
| 14 | Fill blend mode | Blends with layers behind | `background-blend-mode` does not | Translate: pseudo-element with `mix-blend-mode` |
| 14 | Pass through | Default on layers | No value; stacking contexts isolate | Change Figma: Normal on roots with blended children |
| 15 | Fade to transparent | Not premultiplied (reported) | Premultiplied | Change Figma: fade to same hue |
| 15 | Diamond gradient | Native | None | Keep: out of libraries |
| 16 | Colour profile | sRGB or P3 per file | Hex is sRGB | Change Figma: sRGB |
| 17 | Text rendering | Same on every OS | OS rasteriser | Keep, after checking font files |
| 18 | Weights | Only real styles | Synthesises missing ones | Change Figma; `font-synthesis: none` |
| 19 | Title case | Capitalize | `capitalize` is not title case | Change Figma: real case in content |
| 20 | Paragraphs and lists | One text layer | Separate elements | Keep structure; translate spacing |
| 21 | Image Fill | Crop to cover | `object-fit: cover` (not `fill`) | Translate |
| 21 | Masks | Clips layers above | Property of masked element | Change Figma: clipped frame |
| 22 | Icon strokes | Scale or not per resize method | Scale with `viewBox` | Change Figma: one stated rule |

### The short version: rendering

Most rendering differences come from one fact: Figma draws a layer from everything it holds, while CSS draws a box from its own edges. That is why a shadow on an unclipped frame follows its children, why an inner shadow sits over content in Figma and under it in the browser, and why a mask in Figma belongs to the layers above it rather than to the element it masks.

The fixes that live in the Figma file are few and cheap: clip and fill every frame that carries a shadow, use inside strokes for borders and outside strokes only for focus rings, draw pills at 9999 and give mixed radii values that fit, fade gradients to the same hue, keep library files in sRGB, use only the font weights the code ships, and draw icons with centre strokes on a square frame with one bound colour.

The translations belong in the token pipeline, done once: reverse the effects array so the top shadow comes first, halve background and layer blur, copy shadow blur as it is, map Clip content to `overflow: clip`, and put a fill's blend mode on a pseudo-element. What stays different is what CSS has no primitive for (glass, progressive blur, noise, diamond gradients), what the browser decides (dash patterns, hairline widths, text rasterisation) and what has not shipped everywhere yet (corner smoothing). Each of those is written down as a named deviation rather than chased.

---

# Part two: Structure and behaviour

---

## 23. Are Hug, Fill and Fixed the same as flexbox sizing?

**The short answer.** Hug and Fixed are. Fill is not quite: Figma shares the space equally among Fill children regardless of their content, while CSS flex items refuse to shrink below their content's minimum width. Two short labels look identical; a row with one long, unbreakable string does not.

Figma's guide defines Hug as the smallest size around the children and Fill as stretching to the available space. Under the July 2026 auto layout version, Fill children share space by border box, so equal Fill children get equal content areas. CSS flex items have an automatic minimum size: MDN states that by default they do not shrink below their min-content size. Dev Mode, per a 2025 secondary source, emits Fill as `flex: 1 0 0` and cross-axis Fill as `align-self: stretch`; that output still carries the automatic minimum.

A 400px row with a 16px gap and two Fill children shows the gap. Child A holds the word "Short". Child B holds a 300px URL with no break opportunities. Figma gives each child (400 − 16) / 2 = 192px, and B's URL wraps or overflows inside 192. CSS with `flex: 1 1 0` gives B its 300px minimum and A the remaining 84px. MUI's Stack documentation names exactly this bug and its fix, `min-width: 0`.

Hug has a quieter difference. A CSS item sized to its content is `flex: 0 1 auto`, so it will shrink and wrap when space runs out. A Figma Hug item never shrinks below its content.

**What to do. Translate in code.** Write Fill as `flex: 1 1 0` with `min-width: 0`, which is what Figma draws, and Hug that must not shrink as `flex-shrink: 0`. Keep different the one thing Figma cannot draw at all: growth weighted by content, CSS `flex: auto`. Figma's own 2020 design rule was that auto layout should be a thoughtful subset of flexbox, and this is one of the parts it left out.

---

## 24. Do min and max sizes, auto spacing, negative gaps and wrapping match?

**The short answer.** Min and max match, and auto spacing now matches on updated frames. Negative gaps need negative margins in code. Wrapping decides line breaks differently for Fill children.

**Min and max.** Figma applies them to auto layout frames and their direct children, in positive pixels, and they can bind to number variables. CSS adds percentages relative to the containing block, which Figma cannot express, and an implicit `min-width: auto` on flex items (section 23). A Figma Fill item with no minimum behaves like CSS with `min-width: 0`.

**Auto spacing.** Figma's Between, Evenly and Around map to `justify-content: space-between`, `space-evenly` and `space-around`. On legacy frames, a single child in a Between frame was centred and an overflowing frame could produce a negative gap. Under the July 2026 version, the lone child aligns to the start and the gap never drops below zero, as in CSS.

**Negative gap.** Figma allows a fixed negative gap, and its help describes it as expressing intentional overlap, which is how avatar stacks are drawn. CSS `gap` cannot be negative. An avatar stack drawn at a gap of −8 becomes `margin-inline-start: -8px` on every child but the first.

**Wrap.** A wrapping Figma frame decides line breaks from the drawn widths. In CSS a Fill child with a zero flex basis has no width of its own to force a wrap; only its minimum content does.

**What to do.** Update library frames to the current auto layout version (**change Figma**), after which auto spacing needs nothing. Set an explicit minimum width on Fill children inside wrapping frames, and emit `flex: 1 1 <min>` in code. **Translate** negative gaps into negative margins and record the translation in the component spec; CSS deliberately leaves overlap to margins.

---

## 25. How do absolute positioning and stacking order translate?

**The short answer.** Absolute positioning translates one to one. Stacking order matches by default, and the reverse setting has no container-level equivalent in CSS.

A child set to ignore auto layout (`layoutPositioning: ABSOLUTE`) leaves the flow and is placed by its constraints, which is `position: absolute` with insets inside a `position: relative` parent. Left and right constraints map to `left` and `right`; Scale maps only to percentage insets.

By default the last child paints on top in Figma, which is also DOM paint order. Figma's "first on top" setting reverses the drawing without changing the layer order. CSS has no container property for that; it needs a `z-index` per child, or a reversed flex direction, which also reverses visual reading order against DOM order and creates an accessibility problem.

**What to do. Translate in code.** Map absolute children directly and add the positioned ancestor explicitly. Keep "first on top" where it helps drawing, and document that code sets `z-index` per child instead of reversing the flex direction.

---

## 26. Does baseline alignment match?

**The short answer.** For text-only rows, yes. For rows that mix text with icons or other children that have no text baseline, the two engines may place things differently.

Figma's auto layout supports baseline alignment as a cross-axis option. CSS offers `align-items: baseline`, `first baseline` and `last baseline`, and synthesises a baseline from the box edge for items without text. How Figma treats a child without text, and whether it uses only the first line, is not documented.

**What to do. Change Figma.** Use baseline alignment only between text layers. Centre icons against text, or wrap them with a text-bearing element, so both tools compute the same result.

---

## 27. How far does Figma's grid go against CSS grid?

**The short answer.** Far enough for fixed grids: fractional tracks, fixed tracks, content-sized tracks, spans and gaps. Not far enough for responsive grids, which are the reason CSS grid exists.

Figma's grid auto layout has track sizes of type Flex, which the Plugin API says behaves like the CSS `fr` unit, Fixed in pixels, and Hug, equivalent to `fit-content(100%)`. Children span rows and columns, rows and columns have separate gaps, and each cell aligns on its own. Flex tracks are invalid in a hugging container. No Figma documentation mentions `minmax()`, `repeat()` with `auto-fit` or `auto-fill`, named areas, subgrid or dense packing.

The missing piece is the most used one. `repeat(auto-fit, minmax(240px, 1fr))` gives a grid that changes its column count with its width. Figma can only draw each column count as a separate frame.

**What to do. Keep different.** Draw the column counts that matter as separate frames and state the code rule (the minimum column width) in the spec. Use Figma grid for the fixed internal grids of components, where it matches.

---

## 28. How do text resizing and truncation map?

**The short answer.** Auto width is `white-space: nowrap`. Truncate with an ellipsis is the usual three-property recipe. Max lines is `-webkit-line-clamp`. In a flex row, code also needs `min-width: 0`, which Figma does not.

Figma's text layers resize as auto width, auto height, fixed, or truncate, with ending truncation and a maximum line count that only applies to auto height text. The CSS one-line recipe is `overflow: hidden; text-overflow: ellipsis; white-space: nowrap`. Several lines use `display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: N; overflow: hidden`; the unprefixed `line-clamp` is not Baseline yet. A truncated label inside a flex row only gets its ellipsis in CSS if the flex item has `min-width: 0` (section 23); Figma truncates without it.

**What to do. Change Figma and translate in code.** Use the truncation setting rather than a fixed-height text box, which only clips. Pair every truncation in code with `min-width: 0` on the flex item.

---

## 29. Should a Figma library use rem?

**The short answer.** No. Figma has no unit and no root font size, so a rem in Figma is a label, not a behaviour. Keep pixels in Figma and convert at export: text sizes and the spacing that wraps text become rem, borders, hairlines and shadows stay px.

Every Figma dimension is a unitless number, read as pixels, and number variables carry no unit. Dev Mode can display values as rem against a chosen root size, which is presentation only. In code, the unit decides behaviour. MDN notes that pixel font sizes are not accessible because some browsers then ignore the user's font size setting. WCAG 1.4.4 asks for text resizable to 200%, and 1.4.10 asks for content that works at 320 CSS pixels wide, equivalent to 1280 at 400% zoom. Browser zoom scales px and rem alike; only the user's default font size separates them.

A 14px label shows the effect. In code it becomes `0.875rem`. A user with a 20px default font sees it at 17.5px. If the row around it is a fixed 32px tall, it clips. Nothing in Figma can show that.

The systems split usefully. Atlassian publishes spacing in both units, `space.100` as 8px and 0.5rem, up to `space.1000` at 80px and 5rem. Primer outputs `--base-size-16` as `1rem`. MUI is the counter-example: its typography is rem through `pxToRem`, but `theme.spacing(2)` returns `'16px'`, keeping spacing in pixels by design.

**What to do. Translate in code.** Keep the Figma scale in whole pixels on a 2 or 4px grid, so every value divides cleanly by 16 (14px is 0.875rem, 13px would be 0.8125rem). Record the unit decision in token metadata, the way Primer uses `$extensions`, not in the Figma value.

---

## 30. Which tokens can Figma variables actually hold?

**The short answer.** Colours, numbers, strings, booleans, and for motion, timing and easing. Not dimensions with units, not font weights as their own type, and not composite tokens such as shadows, typography or gradients, which Figma holds as styles instead.

Figma's variable types are `BOOLEAN`, `COLOR`, `FLOAT`, `STRING`, `TIMING` and `EASING`. The DTCG format has types Figma has no variable for: a dimension with a unit, a font weight, a cubic Bézier as plain data, and the composites (shadow, typography, gradient, border, transition). Most properties can be bound: size, padding, gap, radius per corner, stroke weight per side, opacity, grid gaps, the typography fields, every numeric shadow field and its colour, blur radius, and each gradient stop's colour. Gradient stop positions and blend modes were not found in the bindable lists.

Two details trip pipelines. Figma stores numbers as 32-bit floats, so a variable set to 0.8 exports as 0.800000011920929, while the interface rounds to two decimals and nobody sees it. And Figma's documentation disagrees with itself about timing: the help centre says milliseconds, the Plugin API type says seconds.

Each variable can also carry a code syntax per platform, so Dev Mode prints `var(--color-bg-default)` instead of a raw value. That is the cheapest alignment lever Figma offers.

Mode limits depend on plan: one mode on Starter, 10 on Professional, 20 on Organization, and unlimited on Enterprise with extended collections, which let a brand collection inherit a parent's variables and override values. The Variables REST API needs a full seat on Enterprise; below that, export runs through a plugin.

**What to do. Translate in code.** Round floats at export to four to six decimals; confirm the timing unit before mapping it to a DTCG duration. Change Figma: set code syntax on every published variable, and keep composites as styles with their parts bound to variables, which is what Primer's export does when it splits each shadow layer into separate number and colour variables.

---

## 31. How do Figma modes relate to themes in code?

**The short answer.** The structure matches and the trigger does not. A Figma mode is set on a container; a CSS theme is chosen at runtime from the user's system, a stored preference or an attribute.

In Figma, pages, frames, sections, groups and components can each set a mode or inherit one, and a prototype can switch a page's mode. Nothing switches a mode from a component's own state. In CSS, custom properties are redefined under `prefers-color-scheme`, a `data-theme` attribute or a class; `light-dark()`, Baseline since 2024, picks one of two colours. MUI's `colorSchemeSelector` accepts a class or data attribute and defaults to the system preference. Both tools nest, so an inverted card inside a light page is drawable in both.

**What to do. Change Figma for structure, translate the trigger.** One collection per theme axis, with mode names equal to the code's theme keys. State colours are their own tokens, such as `bg-hover`, never modes, because neither tool switches mode by state.

---

## 32. Should Figma variants mirror code props?

**The short answer.** Their names and values should. Their structure cannot always: every variant axis multiplies the number of drawn components, while code props compose for free.

Figma's property types are variant, boolean, instance swap, text and, since June 2026, slot. A boolean can only show or hide a layer. In code, `variant × tone × size × disabled` is one component with independent props. Three types, four states, three sizes and an optional icon make 72 Figma variants. The working rule: an axis that changes structure stays a variant, visibility becomes a boolean, a swappable icon becomes instance swap, and free composition becomes a slot. Slots cannot be the top-level layer, cannot have properties applied to their contents, and treat their minimum, maximum and preferred instances as warnings, not limits.

Polaris v12 is the clearest story of why names matter. Its Button had seven booleans, `connectedDisclosure`, `outline`, `destructive`, `primary`, `primarySuccess`, `plain` and `monochrome`, that were really one enumeration. The migration collapsed them into `variant` and `tone`: `destructive` became `variant="primary" tone="critical"`, `primary` with `plain` became `variant="tertiary"`. A Figma axis that mirrored the old booleans would have needed a mapping table; one that mirrors the enums maps straight through.

Code Connect is where the mapping lives. Its React helpers include `figma.enum`, `figma.boolean`, `figma.instance`, `figma.children`, `figma.slot` and `figma.nestedProps`, and its files are string templates, not executed code. Every name that differs between Figma and code becomes a line someone maintains. The Tampere Design System's feasibility review counted 25 components with direct mappings, 3 needing static snippets, 4 with structural mismatches and 2 with no Figma counterpart.

**What to do. Change Figma.** Name every property and value as the code names it, and model enumerations as one variant axis. Translate structure through Code Connect. Keep different the cases where code uses pseudo-classes for what Figma draws as variants (section 33).

---

## 33. How should states and focus be drawn?

**The short answer.** As end states on one State axis, with Focus on it, and the combinations left to code. In code, hover, focus and pressed can all be true at once; a single variant axis shows one at a time, and that difference is accepted rather than drawn.

In CSS, `:hover`, `:focus-visible` and `:active` are independent and can apply together. `:focus-visible` also uses a heuristic: keyboard focus shows a ring, a mouse click usually does not. Figma's prototype triggers include click, hover, press, drag, mouse enter and leave, key down and timeouts, and no focus trigger at all. A State axis of Rest, Focus, Hover and Press never draws two of them together. Drawing every combination would multiply the set for pictures nobody specifies differently: a focused button under the pointer shows its hover fill and its focus ring, both already defined. The house standards keep Focus on the axis, immediately before Hover, because a visible focus indicator is the persistent, required state that WCAG 2.4.7 asks for.

Disabled is a different kind of state: in code it is the control's `disabled` attribute, which removes it from focus and form submission, or `aria-disabled` where it must stay focusable.

**What to do. Keep different.** Keep Focus as a value on the State axis, and draw its ring as an outside stroke so it maps to `outline` (section 7) and never shifts layout. Code implements each state as a pseudo-class and composes them; the component spec should say which properties each state changes, so the combination is predictable without being drawn.

---

## 34. Does motion carry over?

**The short answer.** Durations and cubic Bézier curves do. Springs need translation, and reduced motion exists only in code.

Figma prototypes offer Smart Animate, preset easings, custom cubic Béziers and springs defined by mass, stiffness, damping and initial velocity. Figma Motion, in open beta since June 2026, adds a timeline and keyframes, exports CSS, JSON and motion library code, and has timing and easing variables with modes. CSS has `cubic-bezier()` and, since December 2023, `linear()`, which approximates a spring or bounce with many sampled points. `prefers-reduced-motion: reduce` follows the operating system's setting. Neither Figma Motion's easing page nor its launch post mentions reduced motion.

**What to do. Translate in code.** Map Bézier curves directly, springs to sampled `linear()` values or a JavaScript spring. Document a reduced-motion rule beside every motion token, since Figma cannot express one. Keep different: Smart Animate shows intent; it is not a spec.

---

## 35. How should responsive behaviour be shown?

**The short answer.** As a few drawn widths plus a written rule for everything between them. Figma Design has no breakpoints; code must work at every width from 320 up, and container queries let a component respond to its own width rather than the page's.

Figma Design approximates breakpoints with number variable modes named for sizes. Figma Sites does have breakpoints, desktop at 1280, tablet at 800, mobile at 375, as minimum-width ranges where edits to the primary breakpoint cascade. In CSS, media queries read the viewport, and container size queries read the nearest container set with `container-type: inline-size`. A card drawn at 375 and at 1280 has no specified behaviour at 900 inside a sidebar; a container query answers that per component.

**What to do. Change Figma for what it can hold, translate the rest.** Keep breakpoint names and values as variables, and resizing behaviour in auto layout (hug, fill, min and max). State container query thresholds and `clamp()` rules in the component spec, since Figma can only sample what code computes continuously.

---

## 36. How much real content should a component show?

**The short answer.** More than one sample. Placeholder copy hides overflow, truncation, empty, loading and error states, and short strings expand most in translation.

The W3C's internationalisation guidance, citing IBM, gives expansion from English by source length: 200 to 300% for strings of ten characters or fewer, 180 to 200% for 11 to 20 characters, and about 130% beyond 70. The familiar "German is 30% longer" holds only for long text. A six-letter button label can triple.

**What to do. Change Figma.** Draw the stress cases: the longest realistic string, empty, loading, error, and truncation with its tooltip rule. Inside a slot, set the slot's minimum, maximum and preferred instances instead of drawing many samples.

---

## 37. What accessibility information belongs in Figma?

**The short answer.** Geometry belongs in the drawing: hit areas and focus ring shapes. Semantics belong in annotations: roles, names, focus order and alt text, which a Figma layer cannot carry.

Figma's layer order is drawing order, not DOM order or focus order, and Figma Design has no roles or alt text. Figma's annotations, on paid plans, have an Accessibility category with free text and pinned properties. In code, DOM order drives reading and focus order, and WCAG 2.5.8 sets a 24 by 24 CSS pixel minimum target, or enough spacing that 24px circles centred on adjacent targets do not overlap. A 16px icon button drawn in a 16px frame fails unless spaced.

GitHub reported that 48% of its accessibility issues could have been prevented in the design phase, and open-sourced an annotation toolkit in 2025, building on CVS Health's kits. Eric Bailey's counter-view is worth holding beside it: annotation kits only annotate, their vocabulary cannot describe complex keyboard models like a tree view, and they can create false confidence.

**What to do. Change Figma for geometry, annotate the rest.** Make the hit area part of the component frame (24px minimum on web, 44 to 48 on touch) and draw focus rings as real geometry. Annotate semantics, focus order and accessible names; and treat the annotation as a prompt for the engineer, not a replacement for testing.

---

## 38. How do overlays, sticky elements and scrolling translate?

**The short answer.** As illustrations. Figma draws overlays and scroll behaviour in prototypes; code decides stacking, portals, the top layer and focus management, none of which Figma models.

Figma frames scroll horizontally, vertically or both, and children can scroll with their parent, stay fixed or stick (vertical scroll only). There is no z-index; layer order is stacking order. In CSS, `sticky` sticks within the nearest scrolling ancestor and needs an inset; `fixed` breaks when an ancestor has a transform, perspective or filter; and the top layer (modal dialogs, popovers) sits above every z-index. React portals render elsewhere in the DOM. WCAG 2.4.11 requires that a focused item is not fully hidden by sticky content, usually fixed with `scroll-padding`.

**What to do. Keep different, align the scale.** Treat overlay frames as pictures. Share an elevation or z-index scale by name between the two, as number or string variables, so a designer's "popover" and an engineer's layer agree on rank.

---

## 39. How should images behave at runtime?

**The short answer.** Figma shows one image at one size. Code chooses resolution, art direction and loading, which Figma cannot express.

Code adds `srcset` and `sizes` to choose a resolution, `<picture>` to change the crop at different widths, and `width` and `height` attributes that reserve the aspect ratio before the image loads. Figma's aspect ratio lock keeps proportions when a designer resizes; CSS `aspect-ratio` needs one automatic dimension, so a locked Figma image fixed at 320 by 180 becomes `width: 100%; aspect-ratio: 16 / 9`.

**What to do. Change Figma for ratios, translate the rest.** Document aspect ratios as named values. Leave resolution, art direction and loading to code.

---

## 40. How should fonts behave at runtime?

**The short answer.** Figma always shows the brand font. Code shows a fallback first, then swaps, and system font stacks render differently on each operating system.

`font-display` controls whether text is hidden or shown in a fallback while the web font loads, and `size-adjust` scales a fallback font's metrics so the swap does not shift layout. A Figma file drawn in the brand font shows none of this.

**What to do. Translate in code.** Set the fallback stack, metric overrides and loading strategy in code. A string variable can hold the fallback stack in Figma as documentation, since font family is bindable, but it changes nothing on the canvas.

---

## 41. How should icons be built so they recolour in code?

**The short answer.** As one vector on a fixed square frame equal to the code's `viewBox`, with its fill bound to a single variable that code maps to `currentColor`.

In code, an SVG with `fill="currentColor"` inherits the text colour, so hover and disabled states recolour the icon for free. A Figma icon with a hard-coded fill needs a separate icon colour for every state in code. An icon drawn tight to its own bounds, without the frame's padding, changes visual size from icon to icon.

**What to do. Change Figma.** Fixed square frames, one vector layer, one bound colour. Bake optical nudges into the path, never into offsets in code.

---

## 42. Which side do real systems treat as the source of truth?

**The short answer.** Most say code, while maintaining a Figma library that mirrors it. None keeps the two identical by tooling alone, and the one system that tried automated sync, MUI, suspended it.

The positions range widely:

- **Primer.** Its Figma repository states that the source of truth is the code. Its site describes Figma as the source of truth for design exploration and claims its components match Primer React. Both are true for different readers.
- **Atlassian.** Its newest Figma libraries match the React components one to one. Atlassian unpublished its design tokens Figma plugin in April 2023 and, a month later, postponed bringing it back because Figma variables would remove most of the need for it.
- **Fluent 2.** States that the properties in its UI kits map to code, per platform, and names Figma variables as the source of truth for styling decisions.
- **Carbon.** Offers Code Connect from its Figma kits. A May 2024 issue records that Carbon Web Components did not match the Figma kits; a September 2026 audit is hunting hard-coded heights and padding in the kit; and for v12, Figma specs publish only after the code is reviewed and merged.
- **MUI.** Its Figma kit is built to be as close to the React components as possible. Its Sync plugin, which generated a theme from Figma, was suspended in 2024; component sync had covered only Button, Switch and Typography and broke if a layer was renamed.
- **GOV.UK.** The counter-example. Its getting-started and prototyping guidance covers only coded prototypes and never mentions Figma. Figma kits were community-built, and a January 2025 issue names the risk that users cannot tell whether the Figma kit is up to date. In 2026 a GDS team began building official Figma styles and components, with patterns out of scope.

No system was found documenting a Figma-versus-code rendering difference of the kind Part one lists, and no system was found that deliberately keeps its Figma library unlike its code. The evidence is that every team mirrors, and that mirroring drifts unless something checks it. Sparkbox's account of drift is typical: a radio button changed in production without design review was found nine months later by comparing screenshots against Figma.

**What to do.** Treat code as the reference for behaviour and Figma as the reference for intent, and write down every case in this guide that the library meets, with its action. A list of named deviations is what makes a screenshot comparison readable: a difference on the list is expected, and only a difference off it is a bug.

---

## Part two in short

### Cheat sheet: structure and behaviour

| # | Case | Figma | Code | Action |
|---|---|---|---|---|
| 23 | Fill | Equal share | Content minimum applies | Translate: `flex: 1 1 0; min-width: 0` |
| 24 | Negative gap | Allowed | Not allowed | Translate: negative margin |
| 24 | Auto spacing, one child | Start (new version) | Start | Change Figma: update frames |
| 25 | First on top | Container setting | `z-index` per child | Translate |
| 26 | Baseline with icons | Undocumented | Synthesised | Change Figma: text-only baseline |
| 27 | Responsive grid | Fixed column counts | `auto-fit`, `minmax()` | Keep: draw counts, state rule |
| 28 | Truncation in a row | Works alone | Needs `min-width: 0` | Translate |
| 29 | Units | px only | rem for text | Translate at export |
| 30 | Number precision | 32-bit floats | Expect clean decimals | Translate: round |
| 30 | Code names | Code syntax field | Token names | Change Figma: set code syntax |
| 31 | Themes | Mode on a container | Runtime selector | Change Figma for names; translate trigger |
| 32 | Variant names | Any | Prop API | Change Figma: code's names |
| 33 | Combined states | One state value at a time | Pseudo-classes combine | Keep: spec says what each state changes |
| 34 | Springs | Native | `linear()` or JavaScript | Translate |
| 34 | Reduced motion | None | Media query | Translate: rule per motion token |
| 35 | Between breakpoints | Not drawable | Container queries, `clamp()` | Keep: state the rule |
| 36 | Content length | One sample | Real data | Change Figma: draw extremes |
| 37 | Hit area | Geometry | 24px minimum | Change Figma |
| 37 | Semantics, focus order | None | DOM | Annotate |
| 38 | Overlays, sticky | Prototype only | Stacking, portals, top layer | Keep; share the scale |
| 39 | Images at runtime | One image | `srcset`, `<picture>` | Translate |
| 40 | Fonts at runtime | Always loaded | Fallback, swap | Translate |
| 41 | Icon colour | Fixed fill | `currentColor` | Change Figma: one bound colour |

### The short version: structure and behaviour

Figma's auto layout now behaves like flexbox in most respects, for frames on the July 2026 version: inside strokes count like a `border-box` border, padding never collapses, and a lone child in a Between frame starts at the start. The gaps that remain are specific. Fill shares space equally where CSS refuses to shrink an item below its content, so code adds `min-width: 0`; negative gaps become negative margins; and responsive grids, container queries and everything between two drawn widths exist only in code.

Beyond layout, Figma holds intent and code holds behaviour. Property names and values should match the code's, so Code Connect maps without a translation table; variables should carry code syntax and stay in whole pixels, with rem chosen at export; themes match by mode name, while the choice of theme happens at runtime. Combined states, motion springs and reduced motion, focus order, semantics, stacking, image resolution and font loading are code's alone: the file draws end states and geometry, and the spec or an annotation says the rest. Drawing the extremes of real content (the longest string, the empty state) is the one behaviour Figma can and should show.

---

## 43. The short version

Figma and CSS agree on far more than they used to. Since July 2026 Figma's auto layout counts inside strokes as borders under `border-box`, treats centre and outside strokes as outlines, never lets padding collapse, and aligns a lone child in a Between frame to the start, all as CSS does. A library brought up to that version has most layout differences removed for free.

What remains falls into three groups. The first is fixed by drawing the Figma file differently: clip and fill every frame that carries a shadow, use inside strokes for borders and outside strokes only for focus rings, draw pills at 9999 rather than relying on clamping, fade gradients to the same hue, keep files in sRGB, name properties and values as code names them, draw focus rings as outside strokes, and draw the longest content and the empty state as well as the sample.

The second is translated in code, once, in a known place: reverse the effects array, halve background and layer blur, write Fill as `flex: 1 1 0; min-width: 0`, turn negative gaps into margins, round 32-bit floats, convert text sizes to rem at export, sample springs into `linear()`, and add a reduced-motion rule to every motion token.

The third stays different on purpose, written down as a named deviation: glass, progressive blur and diamond gradients, which CSS has no primitive for; dashed patterns and hairlines, which the browser decides; corner smoothing, until Safari ships `corner-shape`; responsive grids and everything between drawn breakpoints; text rasterisation; and overlays, stacking and runtime loading, which Figma can only picture.

Three Figma behaviours documented nowhere were confirmed by test and matter most: a frame's shadow is cast by its children unless it clips, an inner shadow paints over children, and an oversized radius is clamped corner by corner. Each produces a difference that looks like a code bug and is not one.

Code is the reference for behaviour in every system surveyed, and Figma the reference for intent. What makes the pairing workable is not perfect parity, which no system has, but a written list of the deviations a library accepts, so that a screenshot comparison can tell an expected difference from a bug.

---

## 44. What to re-check later

- **Auto layout versions.** The flexbox-aligned behaviour is the default for new frames from July 2026; legacy frames keep the old one until January 2027, when the toggle becomes an Update button. Re-check after January 2027 whether legacy behaviour still exists at all.
- **`corner-shape`.** Chrome and Edge 139, Firefox 160, Safari in Technology Preview only. Re-check Safari; when it ships, section 12's advice changes.
- **`line-clamp`.** Unprefixed form not Baseline; re-check.
- **Figma Motion.** In open beta since June 2026. Whether its CSS export uses `linear()` for springs or honours reduced motion was not found.
- **Timing variables.** Help centre says milliseconds, Plugin API says seconds. Confirm before mapping.
- **Enterprise mode limit.** "Unlimited modes with extended collections" may mean unlimited only with extensions.
- **DTCG shadow.** The October 2025 report includes an `inset` property; it does not define what blur measures or the paint order of a shadow array.
- **Dev Mode CSS for auto layout.** The `flex: 1 0 0` mapping comes from a 2025 secondary source, before the July 2026 auto layout version.
- **Tested once.** Shadow source and Clip content, inner shadow over children, stroke over children, clip following radius, per-corner radius clamping and effects array order were each tested once, on 1 October 2026, in one file. They are the most reliable claims about Figma here and the least documented; a Figma renderer change could alter any of them.
- **Not verified.** Whether Figma premultiplies gradient alpha (one community report says not); Figma's treatment of fractional strokes; how a Figma frame at reduced opacity treats pass-through children; baseline alignment for children without text; the corner join of unequal side strokes; the Polaris Figma kit's reported choice to leave cards without auto layout.
- **Evidence quality.** The Figma side rests on Plugin API documentation, help centre articles and six direct tests; the CSS side on specifications and MDN; the systems side on each system's own token source. The blur factors rest on one careful third-party measurement (Bjango) and one Figma staff answer. No published user research on design and code drift was found, only practitioner accounts.

---

## Sources

### Primary: Figma

- [Plugin API: Effect](https://developers.figma.com/docs/plugins/api/Effect/)
- [Plugin API: node properties](https://developers.figma.com/docs/plugins/api/node-properties/)
- [Plugin API: FrameNode](https://developers.figma.com/docs/plugins/api/FrameNode/)
- [Plugin API: TextNode](https://developers.figma.com/docs/plugins/api/TextNode/)
- [Plugin API: Paint](https://developers.figma.com/docs/plugins/api/Paint/)
- [Plugin API: strokeAlign](https://developers.figma.com/docs/plugins/api/properties/nodes-strokealign/)
- [Plugin API: strokesIncludedInLayout](https://developers.figma.com/docs/plugins/api/properties/nodes-strokesincludedinlayout/)
- [Plugin API: cornerSmoothing](https://developers.figma.com/docs/plugins/api/properties/nodes-cornersmoothing/)
- [Plugin API: GridTrackSize](https://developers.figma.com/docs/plugins/api/GridTrackSize/)
- [Plugin API: VariableResolvedDataType](https://developers.figma.com/docs/plugins/api/VariableResolvedDataType/)
- [Plugin API: VariableBindableNodeField](https://developers.figma.com/docs/plugins/api/VariableBindableNodeField/)
- [Plugin API: VariableBindableTextField](https://developers.figma.com/docs/plugins/api/VariableBindableTextField/)
- [Plugin API: VariableBindableEffectField](https://developers.figma.com/docs/plugins/api/VariableBindableEffectField/)
- [Plugin API: Variable](https://developers.figma.com/docs/plugins/api/Variable/)
- [Plugin API: Trigger](https://developers.figma.com/docs/plugins/api/Trigger/)
- [Plugin API: Transition](https://developers.figma.com/docs/plugins/api/Transition/)
- [Plugin API update, 10 June 2026 (slots)](https://developers.figma.com/docs/plugins/updates/2026/06/10/update/)
- [Plugin typings 1.140.0](https://unpkg.com/@figma/plugin-typings@1.140.0/plugin-api.d.ts)
- [REST API: file property types](https://developers.figma.com/docs/rest-api/file-property-types/)
- [REST API: variables](https://developers.figma.com/docs/rest-api/variables/)
- [Code Connect](https://developers.figma.com/docs/code-connect/)
- [Code Connect: React](https://developers.figma.com/docs/code-connect/react/)
- [Help: Use auto layout with CSS Flexbox in mind](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind)
- [Help: Guide to auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)
- [Help: Horizontal and vertical flows in auto layout](https://help.figma.com/hc/en-us/articles/31289464393751-Use-the-horizontal-and-vertical-flows-in-auto-layout)
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
- [Help: Guide to variables](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma)
- [Help: Modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)
- [Help: Extend a variable collection](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection)
- [Help: Plans and features](https://help.figma.com/hc/en-us/articles/360040328273-Figma-plans-and-features)
- [Help: Slots](https://help.figma.com/hc/en-us/articles/38231200344599-Use-slots-to-build-flexible-components-in-Figma)
- [Help: Adjust an animation's easing](https://help.figma.com/hc/en-us/articles/41414048690839-Adjust-an-animation-s-easing)
- [Help: Variable modes in prototypes](https://help.figma.com/hc/en-us/articles/15253268379799-Variable-modes-in-prototypes)
- [Help: Breakpoints in Figma Sites](https://help.figma.com/hc/en-us/articles/31242797809815-Add-or-delete-breakpoints-in-a-webpage)
- [Help: Annotations](https://help.figma.com/hc/en-us/articles/20774752502935-Add-measurements-and-annotate-designs)
- [Help: Code snippets in Dev Mode](https://help.figma.com/hc/en-us/articles/15023202277399-Use-code-snippets-in-Dev-Mode)
- [Help: Prototype scroll and overflow](https://help.figma.com/hc/en-us/articles/360039818734-Prototype-scroll-and-overflow-behavior)
- [Help: What's new from Schema 2025](https://help.figma.com/hc/en-us/articles/35794667554839-What-s-new-from-Schema-2025)
- [Blog: Behind the feature, shadow spread](https://www.figma.com/blog/behind-the-feature-shadow-spread/)
- [Blog: The making of the new auto layout](https://www.figma.com/blog/behind-the-feature-the-making-of-the-new-auto-layout/)
- [Blog: Introducing Figma Motion](https://www.figma.com/blog/introducing-figma-motion/)
- [Release notes](https://www.figma.com/release-notes/)
- [Forum, staff answer: background blur is different in Dev Mode](https://forum.figma.com/ask-the-community-7/background-blur-is-different-in-dev-mode-22642)
- [Forum, staff answer: layered box-shadow order reversed in Dev Mode](https://forum.figma.com/ask-the-community-7/layered-box-shadow-order-is-reversed-in-dev-mode-12290)
- [Forum, staff answer: spread without fill or clip](https://forum.figma.com/ask-the-community-7/why-figma-not-supporting-spread-function-for-without-fill-component-and-frames-22505)

### Primary: specifications and MDN

- [CSS Backgrounds and Borders 3](https://www.w3.org/TR/css-backgrounds-3/)
- [CSS Backgrounds and Borders 3, editor's draft](https://drafts.csswg.org/css-backgrounds-3/)
- [CSS Values 4 (line width snapping)](https://drafts.csswg.org/css-values-4/)
- [CSS UI 4 (outline)](https://drafts.csswg.org/css-ui-4/)
- [CSS Fill and Stroke 3 (stroke-align)](https://drafts.csswg.org/fill-stroke-3/)
- [CSS Color 4 (interpolation)](https://drafts.csswg.org/css-color-4/)
- [CSS Images 4 (gradients)](https://www.w3.org/TR/css-images-4/)
- [Compositing and Blending 1](https://www.w3.org/TR/compositing-1/)
- [Compat spec (-webkit-text-stroke)](https://compat.spec.whatwg.org/)
- [MDN: drop-shadow()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/drop-shadow)
- [MDN: blur()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/filter-function/blur)
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)
- [MDN: overflow](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overflow)
- [MDN: isolation](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/isolation)
- [MDN: color-interpolation-method](https://developer.mozilla.org/en-US/docs/Web/CSS/color-interpolation-method)
- [MDN: conic-gradient()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/gradient/conic-gradient)
- [MDN: border-radius](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius)
- [MDN: border-image](https://developer.mozilla.org/en-US/docs/Web/CSS/border-image)
- [MDN: corner-shape](https://developer.mozilla.org/en-US/docs/Web/CSS/corner-shape)
- [MDN: outline](https://developer.mozilla.org/en-US/docs/Web/CSS/outline)
- [MDN: paint-order](https://developer.mozilla.org/en-US/docs/Web/CSS/paint-order)
- [MDN: flex](https://developer.mozilla.org/en-US/docs/Web/CSS/flex)
- [MDN: min-width](https://developer.mozilla.org/en-US/docs/Web/CSS/min-width)
- [MDN: gap](https://developer.mozilla.org/en-US/docs/Web/CSS/gap)
- [MDN: align-items](https://developer.mozilla.org/en-US/docs/Web/CSS/align-items)
- [MDN: justify-content](https://developer.mozilla.org/en-US/docs/Web/CSS/justify-content)
- [MDN: line-clamp](https://developer.mozilla.org/en-US/docs/Web/CSS/line-clamp)
- [MDN: aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)
- [MDN: font-smooth](https://developer.mozilla.org/en-US/docs/Web/CSS/font-smooth)
- [MDN: font-optical-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/font-optical-sizing)
- [MDN: font-synthesis](https://developer.mozilla.org/en-US/docs/Web/CSS/font-synthesis)
- [MDN: text-transform](https://developer.mozilla.org/en-US/docs/Web/CSS/text-transform)
- [MDN: font-variant-caps](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-caps)
- [MDN: text-underline-offset](https://developer.mozilla.org/en-US/docs/Web/CSS/text-underline-offset)
- [MDN: text-decoration-skip-ink](https://developer.mozilla.org/en-US/docs/Web/CSS/text-decoration-skip-ink)
- [MDN: object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)
- [MDN: mask-image](https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image)
- [MDN: multiple backgrounds](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Backgrounds_and_borders/Using_multiple_backgrounds)
- [MDN: vector-effect](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/vector-effect)
- [MDN: font-size](https://developer.mozilla.org/en-US/docs/Web/CSS/font-size)
- [MDN: light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [MDN: linear() easing](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function/linear)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [MDN: :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- [MDN: container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries)
- [MDN: top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer)
- [MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/position)
- [MDN: font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display)
- [MDN: size-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/size-adjust)
- [MDN: responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)
- [WCAG 2.2: Understanding Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WCAG 2.2: Understanding Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [WCAG 2.2: Understanding Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)
- [WCAG 2.2: Understanding Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)
- [W3C: Text size in translation](https://www.w3.org/International/articles/article-text-size)
- [DTCG Format, 2025.10](https://www.designtokens.org/tr/2025.10/format/)
- [React: createPortal](https://react.dev/reference/react-dom/createPortal)

### Primary: design systems

- [Primer primitives: shadow tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/shadow/shadow.json5)
- [Primer primitives: border tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/border.json5)
- [Primer primitives: radius tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/radius.json5)
- [Primer primitives: focus tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/component/focus.json5)
- [Primer primitives: Figma export format](https://raw.githubusercontent.com/primer/primitives/main/src/formats/jsonFigma.ts)
- [Primer primitives repository](https://github.com/primer/primitives)
- [Primer: size primitives](https://primer.style/product/primitives/size/)
- [Primer: Stack](https://primer.style/product/components/stack/)
- [Primer: Figma](https://primer.style/product/getting-started/figma/)
- [Primer Figma repository](https://github.com/primer/figma)
- [Atlassian: elevation](https://atlassian.design/foundations/elevation)
- [Atlassian: radius](https://atlassian.design/foundations/radius)
- [Atlassian: spacing](https://atlassian.design/foundations/spacing)
- [Atlassian: spacing primitives](https://atlassian.design/foundations/spacing/primitives)
- [Atlassian: Figma libraries](https://atlassian.design/get-started/design/figma-libraries/atlassians)
- [Atlassian tokens changelog](https://unpkg.com/@atlaskit/tokens/CHANGELOG.md)
- [Atlassian light theme tokens](https://unpkg.com/@atlaskit/tokens/dist/esm/artifacts/themes/atlassian-light.js)
- [Polaris tokens: shadow](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/shadow.ts)
- [Polaris tokens: border](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/border.ts)
- [Polaris: bevel mixin](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-react/postcss-mixins/shadow-bevel.js)
- [Polaris: v12 shadow migration](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-migrator/src/migrations/v12-styles-replace-custom-property-shadow/transform.ts)
- [Polaris: migrating from v11 to v12](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)
- [Polaris: v12 discussion](https://github.com/Shopify/polaris-react/discussions/9788)
- [Carbon: box-shadow mixin](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/utilities/_box-shadow.scss)
- [Carbon: border radius](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/_border-radius.scss)
- [Carbon: spacing](https://carbondesignsystem.com/elements/spacing/overview/)
- [Carbon: Figma kits](https://carbondesignsystem.com/designing/kits/figma/)
- [Carbon issue 18410: Web Components do not match Figma](https://github.com/carbon-design-system/carbon/issues/18410)
- [Carbon design kit issue 1110: token audit](https://github.com/carbon-design-system/carbon-design-kit/issues/1110)
- [Carbon design kit issue 1109: design intent workflow](https://github.com/carbon-design-system/carbon-design-kit/issues/1109)
- [Material Web: elevation tokens](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/latest/sass/_md-sys-elevation.scss)
- [Material Web: elevation implementation](https://raw.githubusercontent.com/material-components/material-web/main/elevation/internal/_elevation.scss)
- [Material Web: shape tokens](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/latest/sass/_md-sys-shape.scss)
- [Fluent: shadow tokens](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/utils/shadows.ts)
- [Fluent: border radius tokens](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/global/borderRadius.ts)
- [Fluent: stroke width tokens](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/global/strokeWidths.ts)
- [Fluent 2: design get started](https://fluent2.microsoft.design/get-started/design)
- [Spectrum: layout tokens](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/src/layout.json)
- [Spectrum: colour alias tokens](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/src/color-aliases.json)
- [MUI: shadows source](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/shadows.js)
- [MUI: NotchedOutline source](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/OutlinedInput/NotchedOutline.js)
- [MUI: shape](https://mui.com/material-ui/customization/shape/)
- [MUI: Stack](https://mui.com/material-ui/react-stack/)
- [MUI: spacing](https://mui.com/material-ui/customization/spacing/)
- [MUI: typography](https://mui.com/material-ui/customization/typography/)
- [MUI: CSS theme variables configuration](https://mui.com/material-ui/customization/css-theme-variables/configuration/)
- [MUI for Figma](https://mui.com/material-ui/design-resources/material-ui-for-figma/)
- [MUI Sync](https://mui.com/material-ui/design-resources/material-ui-sync/)
- [Braid: Stack](https://seek-oss.github.io/braid-design-system/components/Stack)
- [Braid: layout](https://seek-oss.github.io/braid-design-system/foundations/layout/)
- [GOV.UK Design System: get started](https://design-system.service.gov.uk/get-started/)
- [GOV.UK Design System: prototyping](https://design-system.service.gov.uk/get-started/prototyping/)
- [GOV.UK Design System issue 4437](https://github.com/alphagov/govuk-design-system/issues/4437)
- [GOV.UK Design System issue 4738](https://github.com/alphagov/govuk-design-system/issues/4738)
- [Figma Simple Design System](https://github.com/figma/sds)
- [CVS Health annotation kits](https://github.com/cvs-health/annotations)
- [GitHub blog: how accessibility gets left out of components](https://github.blog/engineering/user-experience/design-system-annotations-part-1-how-accessibility-gets-left-out-of-components/)

### Commentary and measurement

- [Bjango: blur radius comparison (measured)](https://bjango.com/articles/blurradiuscomparison/)
- [Eric Bailey: accessibility annotation kits only annotate](https://ericwbailey.website/published/accessibility-annotation-kits-only-annotate/)
- [Sparkbox: finding and fixing design system drift](https://sparkbox.com/foundry/finding_and_fixing_design_system_drift)
- [Tampere Design System: Code Connect feasibility](https://github.com/Tampere/Tampere-design-system/issues/37)
- [Atlassian developer community: tokens plugin unpublished](https://community.developer.atlassian.com/t/our-atlassian-design-tokens-figma-plugin-is-currently-down-for-the-community/68133)
- [Tokens Studio: box shadow (known order issue)](https://docs.tokens.studio/manage-tokens/token-types/box-shadow)
- [Figma forum: fonts look different in the browser](https://forum.figma.com/ask-the-community-7/css-summary-why-fonts-look-different-in-figma-vs-the-browser-thinner-bolder-wrong-stroke-width-etc-54711)
- [Figma forum: gradient with opacity](https://forum.figma.com/ask-the-community-7/wrong-gradient-behavior-with-opacity-36185)
- [Figma forum: radial gradient vs CSS](https://forum.figma.com/report-a-problem-6/radial-gradient-in-figma-vs-css-52184)
- [Figma forum: stroke scaling in icons](https://forum.figma.com/suggest-a-feature-11/feature-request-proper-stroke-scaling-for-icons-inside-components-53897)
- [Figma forum: variable rounding error on export](https://forum.figma.com/ask-the-community-7/figma-variable-gets-exported-with-rounding-error-36573)
- [Zenn: Dev Mode CSS output for auto layout (2025)](https://zenn.dev/ncdc/articles/8cd9a7d2166379)
- [Nearform: Figma grid auto layout (June 2025, partly superseded)](https://nearform.com/digital-community/figmas-new-grid-auto-layout-what-it-does-and-doesnt-yet-do/)
- [slint issue 13749: Figma frame shadows from children](https://github.com/slint-ui/slint/issues/13749)
- [caniuse: corner-shape](https://caniuse.com/mdn-css_properties_corner-shape)

### Cited but not resolved to a URL

- Material 3's own documentation pages on m3.material.io returned empty; Material values come from the Material Web source above.
- Apple's SwiftUI documentation for continuous rounded corners did not render.
- The Indeed accessibility annotation kit article returned errors.
