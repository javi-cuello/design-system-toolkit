# Target: web — where a Figma component and HTML/CSS disagree

Plain HTML and CSS, no framework: the floor every web framework sits on. Each class gives four things:

- **Figma allows:** what Figma can draw.
- **The web does:** what the platform does instead, quoted from the specification that decides it.
- **Align:** *Figma* (redraw so the file says what the code will do), *code* (a known translation) or *accept* (a named deviation with its reason).
- **Detect:** the signal the engine keys on.

Project evidence, where noted, is supporting only. A class is admitted by its source, not by the project that hit it.

Figma's own account of what auto layout and flexbox now share is [Use auto layout with CSS Flexbox in mind](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind). Padding always gets its room, and only inside strokes count in layout. Fill-container children use border-box, auto gap clamps at zero, and a lone child in a Between stack aligns to start. Those are aligned. What follows is what is not.

## Contents

- [W1 · Wrapper and content](#w1--wrapper-and-content-as-two-frames-one-element-in-code) · [W2 · Icon in an input](#w2--an-icon-inside-a-text-input) · [W3 · Legend](#w3--a-legend-inside-a-fieldset-gap) · [W4 · Clipped focus ring](#w4--a-focus-ring-drawn-as-a-layer-clipped-by-its-list)
- [W5 · Stroke alignment](#w5--stroke-alignment) · [W6 · Slot height](#w6--a-slot-drawn-at-a-fixed-height) · [W7 · States](#w7--booleans-and-a-state-axis-against-pseudo-classes) · [W8 · Sizing](#w8--hug-fill-min-and-max-against-intrinsic-sizing)
- [W9 · Line height](#w9--line-height-auto-half-leading-and-vertical-trim) · [W10 · Truncation](#w10--truncation-against-a-fixed-height-text-box) · [W11 · Effects](#w11--absolute-children-gradients-blend-modes-blur) · [W12 · Sampled content](#w12--content-the-design-samples)
- [W13 · Smoothing](#w13--corner-smoothing) · [W14 · Image scale](#w14--image-fill-scale-modes) · [W15 · Masks](#w15--masks) · [W16 · Line height in a control](#w16--a-line-height-below-the-fonts-own-box-inside-a-text-control) · [W17 · Shadow](#w17--a-drop-shadow-on-a-frame-that-does-not-clip)
- [Translations](#translations--what-the-web-builds-differently-with-nothing-to-decide) · [Sources](#sources)

## W1 · Wrapper and content as two frames, one element in code

- **Figma allows:** an outer frame holding one inner frame that carries the padding, fill or hover, the outer adding nothing.
- **The web does:** one element is one box. Keeping both nodes without a second box needs `display: contents`: "element replaced by contents in box tree" ([css-display-3](https://drafts.csswg.org/css-display-3/#valdef-display-contents)).
- **Align:** *Figma* — collapse the pair unless the outer frame has its own fill, stroke, padding or sizing rule. If it must stay (a stretched-link card, a focus target wider than the content), say which frame owns the padding, so the mapping is deliberate. *Accept* otherwise, with the mapping stated.
- **Detect:** a frame below the root with exactly one child frame, no fill, no stroke, zero padding and the child's size. It has none of corner radius, clipping, effects, a mask, opacity, rotation or absolute position.

Those exclusions make the shape. An avatar's `Content` frame carries the radius and the clip around a square child, so collapsing it deletes the rounding. Collapsing an absolute frame moves its layer into flow.

## W2 · An icon inside a text input

- **Figma allows:** `Input` as an auto-layout row holding `Icon` and `Text` with a gap.
- **The web does:** the `input` content model is "Nothing", and "Void elements can't have any contents" ([HTML](https://html.spec.whatwg.org/multipage/input.html#the-input-element), [syntax](https://html.spec.whatwg.org/multipage/syntax.html#void-elements)). The icon is a sibling positioned over the field. The text start is padding, not gap.
- **Align:** *code* — `padding-inline-start` = padding + icon width + gap, with the icon absolutely positioned. Both values then measure differently, and are waived as one decision.
- **Detect:** the *field* row of an input-like component (text field, search) with an icon before its text. A dropdown or select is a button, so it is not input-like.

The field row only: the content model binds the box that becomes the `input`. A label above it or a message below it is an ordinary flex row, not this finding.

## W3 · A legend inside a fieldset gap

- **Figma allows:** a fieldset drawn as a column with gap, the title as first child.
- **The web does:** a rendered legend "is expected to be the first child box". The fieldset's flex `display` moves to an anonymous content box that holds everything *except* the legend ([HTML rendering](https://html.spec.whatwg.org/multipage/rendering.html#the-fieldset-and-legend-elements)). Only "In-flow children of a flex container are called flex items" ([flexbox](https://drafts.csswg.org/css-flexbox-1/#flex-items)). The space under the legend is a margin, not the gap.
- **Align:** *code* — margin on the legend equal to the gap. *Accept* the gap difference on the root. A heading plus `role="group"` is the other route, and it is an accessibility decision.
- **Detect:** a group of choice controls (radio, checkbox rows) whose first child is text.

## W4 · A focus ring drawn as a layer, clipped by its list

- **Figma allows:** `Focus ring` as an outside-stroke layer beyond the row, in a list that clips its contents.
- **The web does:** outlines are ink overflow: "painting effects defined to not affect layout … outlines" ([css-overflow-3](https://drafts.csswg.org/css-overflow-3/#ink-overflow)). Setting `overflow: hidden` clips the box's content to its clip edge ([overflow](https://drafts.csswg.org/css-overflow-3/#overflow-properties)). The ring survives only inside the row.
- **Align:** *code* — negative `outline-offset` or an inset `box-shadow`, and say which. *Figma* — draw the ring inside the row when the list clips, or remove the clip.
- **Detect:** a layer named *focus* with an outside or centre stroke inside an ancestor that clips.

## W5 · Stroke alignment

- **Figma allows:** inside, centre and outside strokes. Outside and centre take no layout room ([stroke properties](https://help.figma.com/hc/en-us/articles/360049283914-Apply-and-adjust-stroke-properties)).
- **The web does:** a border lives in the border area of the box, inside and taking room ([css-box-4](https://drafts.csswg.org/css-box-4/#border-box)). An outline "is drawn starting just outside the border edge", and "Outlines do not take up space" ([css-ui-4](https://drafts.csswg.org/css-ui-4/#outline-props)). A negative `outline-offset` "must cause the outline to shrink into the border box" ([outline-offset](https://drafts.csswg.org/css-ui-4/#outline-offset)). It is the only way to fake centre.
- **Align:** *Figma* — inside for anything that is a border, outside only for rings and selection. *Code* — an outside stroke becomes `outline` or `box-shadow: 0 0 0 N`, never a border that shifts layout. Centre: *accept* with a half-pixel note, or redraw.
- **Detect:** any centre stroke; an outside stroke on a layer that is not a ring.

## W6 · A slot drawn at a fixed height

- **Figma allows:** a slot placeholder at a fixed height inside a frame that hugs it. Slotted content gets fill on the cross axis, and "Changes cannot be made to a slot's position, auto layout flow, and constraints" ([slots](https://help.figma.com/hc/en-us/articles/38231200344599-Use-slots-to-build-flexible-components-in-Figma)).
- **The web does:** slotted content is ordinary flow. A fixed height on its container is an overflow, not a contract.
- **Align:** *accept* the slot's and root's heights as one waiver. *Figma* — name the layer as a slot, so the waiver is keyed to it.
- **Detect:** a layer named *slot* or *placeholder* with a fixed height.

## W7 · Booleans and a State axis against pseudo-classes

- **Figma allows:** booleans that show or hide layers, and a `State` axis drawn as variants ([component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)).
- **The web does:** state is a user-action pseudo-class: `:hover` "under the cursor", `:active` "in an activated state", `:focus`, `:focus-visible` ([selectors-4](https://drafts.csswg.org/selectors-4/#useraction-pseudos)). Several hold at once, which one axis cannot express. A boolean is an attribute or a conditional child.
- **Align:** *code* — State never becomes an attribute, since a template could then claim a state the control is not in. *Figma* — a boolean that is really a state the browser owns (`Checked`, `Selected`, `Open`) is a State value, or left to the control.
- **Detect:** a boolean named like a state. `Disabled` as both an axis and a boolean. A value on the state axis outside the options the library's settings record for it.

The recorded options are `variants.stateAxis` and `optionOrder[stateAxis]`, passed in as `states`. A recorded non-pointer option such as `Loading` is not a finding: WT1 hands it to the developer as its own prop, never as a pseudo-class. No recorded axis, no axis check.

## W8 · Hug, fill, min and max against intrinsic sizing

- **Figma allows:** hug, fill or fixed per axis, plus min and max in pixels ([auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)).
- **The web does:** hug is `max-content` or `fit-content()` = "min(max-content, max(min-content, length-percentage))". A percentage max is "with respect to the box's containing block" ([css-sizing-3](https://drafts.csswg.org/css-sizing-3/#sizing-values)), which Figma cannot express. Fill is `flex: 1` or `align-self: stretch`, not a size.
- **Align:** *code* — a fixed width on a grid child becomes the grid track, and the element carries no cap of its own. *Figma* — a max drawn on a column is a statement about the track, and the description should say so.
- **Detect:** a fill child carrying a max width.

A fixed-width leaf beside a fill sibling is ordinary flex and is not reported. The first detector reported it, and flagged every checkbox and avatar in a library.

## W9 · Line height Auto, half-leading and vertical trim

- **Figma allows:** Auto, "calculated using the font's default line height, which varies between typefaces". Also vertical trim, which Figma's Dev Mode emits under draft names ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)).
- **The web does:** `line-height: normal` is "based on the metrics of the used font", the gap added "half to each side as half-leading" ([css-inline-3](https://drafts.csswg.org/css-inline-3/#propdef-line-height)). So Auto is font- and engine-defined. `text-box-trim` trims the over and under edges, and is newly Baseline ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/text-box-trim)).
- **Align:** *Figma* — every text style carries an explicit line height, never Auto. *Code* — line height from the token, no optical nudges.
- **Detect:** a text layer with Auto line height; text without a style.

## W10 · Truncation against a fixed-height text box

- **Figma allows:** Truncate with Max lines, only on auto-height text. "Text layers cannot have both a max height and a set number of max lines" ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)). A fixed-size text box just clips.
- **The web does:** `text-overflow` is one line, and needs non-visible overflow ([css-overflow-3](https://drafts.csswg.org/css-overflow-3/#propdef-text-overflow)). `line-clamp` fragments away the rest, "neither rendered nor measured" ([css-overflow-4](https://drafts.csswg.org/css-overflow-4/#line-clamp)). It ships as `-webkit-line-clamp` on `display: -webkit-box` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp)).
- **Align:** *Figma* — the truncation setting, not a fixed height. *Code* — clamp.
- **Detect:** a fixed-height text layer with truncation off.

## W11 · Absolute children, gradients, blend modes, blur

- **Figma allows:**
  - ignore-auto-layout children with constraints, including Scale ([constraints](https://help.figma.com/hc/en-us/articles/360039957734-Apply-constraints-to-define-how-layers-resize));
  - linear, radial, angular and diamond gradients ([gradients](https://help.figma.com/hc/en-us/articles/34208860210199-Use-gradients-as-a-fill-or-stroke));
  - nineteen blend modes, including Pass through, Plus darker and Plus lighter ([blend modes](https://help.figma.com/hc/en-us/articles/360040667874-Apply-blend-modes-to-layers-fills-and-effects));
  - layer, background and progressive blur, noise, texture and glass ([effects](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)).
- **The web does:**
  - `position: absolute` takes the box out of flow ([css-position-3](https://drafts.csswg.org/css-position-3/#abs-pos)). It is one to one, though Scale has only a percent approximation.
  - Gradients are linear, radial, conic and their repeating forms, with no diamond ([css-images-4](https://drafts.csswg.org/css-images-4/#gradients)).
  - `mix-blend-mode` has sixteen keywords and no plus-darker. Any mode but normal "must establish a new stacking context" ([compositing-1](https://drafts.csswg.org/compositing-1/#mix-blend-mode)).
  - `blur()` is one Gaussian ([filter-effects-1](https://drafts.csswg.org/filter-effects-1/#funcdef-filter-blur)). `backdrop-filter` needs a translucent element ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)).
  - Progressive blur, noise, texture and glass have no primitive.
- **Align:** *Figma* — gradients as colour styles with bound stops, so the check can name them. *Accept* diamond gradients, plus-darker and the newer effects with a note, or redraw.
- **Detect:** a diamond gradient; a blend mode outside the CSS list; a progressive blur, noise, texture or glass effect; an effect without a style.

## W12 · Content the design samples

No specification decides this one; it is the validator's own rule. Think of a list of twenty rows, a one-line title, a card with four facts. Live content sets every height, and the design shows one sample.

**A slot is asked a different question, because a slot can answer it.** Figma's slot property carries Minimum layers, Maximum layers and a preferred-instances list. That is the file's own statement of how many may go in and what they may be. So inside a slot, the layers drawn are sample content by definition, and counting them settles nothing. What is worth saying is that the settings are empty.

Counting them instead raised a row against every slot in a library. The maintainer ruled it out: *"any content inside a slot should abide by [the slot's configuration]"*. The two gaps collapse into one row, because they are one trip to the same settings panel.

- **Align:** *Figma* — set the slot's limits and its preferred instances. Outside a slot, *accept* every height of a content-driven layer as a named class, rather than one waiver per layer. *Figma* — sample the extremes too (an empty list, a long title).
- **Detect, in a slot:** the slot PROPERTY of the set (`slots` beside `props`, from snapshot plugin 0.40.0). Not the `SLOT` node, which mirrors only the two limits. One row per slot by name, not per variant.
- **The limits** are `minChildren` and `maxChildren` inside the stored settings object. They use Figma's own names rather than the panel's "Minimum layers".
- **Where `fields` is present**, the definition was read. A missing settings object is then every setting at its default, which is no limits.
- **Where `fields` is absent**, the snapshot predates the record, and the slot is left alone. Absent is not "left open", and a reader must not ask for a fix it cannot check.
- **Each slot wants its own number.** The row states what that slot is drawn with across its variants, rather than inviting one answer for all.
- **A layer named after a declared slot** is that slot's container, and is not counted again.
- **Detect, outside a slot:** a frame holding five or more identical instances, with the advice to make it a slot. It is named by the component: the part of the instance's path before the first slash, since the rest is only which variant was placed.

## W13 · Corner smoothing

- **Figma allows:** smoothing 0–100 % "to create a continuous curve … squircles", with an iOS preset of 60 % ([corner radius](https://help.figma.com/hc/en-us/articles/360050986854-Adjust-corner-radius-and-smoothing)).
- **The web does:** `border-radius` is circular or elliptical ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/border-radius)). `corner-shape: squircle` exists in CSS Borders 4 but is not Baseline ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/corner-shape)). No mapping from Figma's percentage to a superellipse exponent is documented.
- **Align:** *accept*, smoothing 0 in code. *Figma* — smoothing only where a native target needs it.
- **Detect:** any corner smoothing.

## W14 · Image fill scale modes

- **Figma allows:** Fill, Fit, Crop, Tile ([image properties](https://help.figma.com/hc/en-us/articles/360041098433-Adjust-the-properties-of-an-image)).
- **The web does:** `object-fit` is cover, contain, fill, none or scale-down ([css-images-3](https://drafts.csswg.org/css-images-3/#the-object-fit)). Crop needs `object-position` plus overflow. Tile exists only as `background-repeat`, not on `img`.
- **Align:** *Figma* — Fill or Fit. *Code* — Crop as position + overflow, Tile as a background.
- **Detect:** an image fill in Crop or Tile mode.

## W15 · Masks

- **Figma allows:** a mask as a sibling layer that masks what sits above it ([masks](https://help.figma.com/hc/en-us/articles/360040450253-Masks)).
- **The web does:** the mask belongs to the masked element, never to a sibling, so the structure is rewritten. A `clip-path` shows "the inside of this region", and `mask-image` takes alpha or luminance mode ([css-masking-1](https://drafts.csswg.org/css-masking-1/#clipping-paths)).
- **Align:** *code* — vector mask → `clip-path`, alpha or luminance → `mask-image`. *Figma* — a frame with clip content where a rectangle mask would do.
- **Detect:** a layer that is a mask.

## W16 · A line height below the font's own box, inside a text control

- **Figma allows:** any line height on a text style, including one smaller than the font's glyphs. The canvas treats it as the text's layout box and paints the glyphs outside it, so nothing is ever cut on the canvas.
- **The web does:** a form control clips to its box. The UA gives `input`, `select` and `textarea` an inner editor that does not overflow, and CSS offers no way to show what a control clips. Elsewhere the same line height is exact and harmless. A `div` at `line-height: 1` paints its descenders outside the line box, as Figma does ([css-inline-3](https://drafts.csswg.org/css-inline-3/#inline-height), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height)).
- **Align:** *Figma* — raise the style to at or above the font's own line box. *Accept* — the control renders at the font's line box, and the frame's own height moves with it. That is a waiver per component, and a taller field.
- **Detect:** a TEXT layer whose style's line height is under ~1.2, inside a component the target renders as a control.

**Two numbers, and they are not the same number.** Inter's own line box is **about 121%**: (ascender 1984 + descender 494) ÷ 2048 upem. Below that height the glyph box no longer fits the line box. **125%** is a recommendation with a margin, not the metric. Never quote the recommendation as the metric; a reader will check.

**Whether anything is actually CUT depends on the control's height**. The finding is that the drawing and the build disagree about the text's box, which is certain. Clipping follows where the control has no room to spare. A field whose padding already exceeds the difference shows nothing wrong today, and starts showing it once the padding is trimmed. Report it as a difference to settle, never as damage already done.

**The 1.2 threshold is hardcoded and Inter's**. It is not read from the font. A family with a taller or shorter box is judged by Inter's number. That is right for every project so far, and wrong the day one ships a different face. It is a limitation, not a rule.

**How the engine reads it.** A snapshot stores the line height as a string (`"115%"`), not a number. The engine normalises it to a unit and a `lineHeightRatio`, and the rule reads the ratio. iOS I3 reads the unit from the same step.

**Watch the arithmetic when it is raised.** A field's height is border + padding + text + padding + border. A 44 field with 12 padding and a 1px inside stroke holds 18, and a 20px line box makes it 46. Raising the line height in the file usually means raising the field with it.

## W17 · A drop shadow on a frame that does not clip

- **Figma allows:** a drop shadow on any frame. Figma casts it from everything the frame renders, children included, unless the frame clips ([effects](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)). The copy-the-geometry method is in [Behind the feature: shadow spread](https://www.figma.com/blog/behind-the-feature-shadow-spread/). Spread is "only accepted on rectangles and ellipses, or on frames, components, and instances with visible fill paints and clipsContent enabled" ([Plugin API, Effect](https://developers.figma.com/docs/plugins/api/Effect/)).
- **The web does:** an outer `box-shadow` "is drawn outside the border edge only" and follows `border-radius`. Nothing inside the element changes its shape ([css-backgrounds-3](https://www.w3.org/TR/css-backgrounds-3/#box-shadow)). The function that does follow content, `filter: drop-shadow()`, takes no spread and no inset ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/filter-function/drop-shadow)).
- **Align:** *Figma* — Clip content on, with the frame's own fill and radius, so the shadow is the box. *Code* — `filter: drop-shadow()` where the shadow really must follow the content.
- **Detect:** a frame with a drop shadow and no clipping, and any one of these:
  - a painted child (not a focus ring) reaches outside it or fills a rounded corner square;
  - the frame has no fill and a child of another shape;
  - the shadow has spread.

Tested: a 24px-radius frame with a fill held a square child in its corner. It cast a square shadow corner with clipping off, and a rounded one with it on. The first run over stored specs found five rows in one library and one in another. Four were FAB buttons, whose unfilled square root casts its shadow from a round child that CSS would draw square. The other was a toggle whose spread Figma was not drawing.

## Translations — what the web builds differently, with nothing to decide

`translations()` reports these for a developer reading a component's documentation, never to the audit. Each is a known mapping, so there is no Figma / code / accept choice to put to the designer. Where a class above covers the same layer, the class speaks and the translation stays quiet. That is W4 for a clipped ring, W5 for an outside or centre stroke, and W7 for a State value that is not a pseudo-class.

| Id | Drawing | Built as |
|---|---|---|
| WT1 | State axis | Rest, Hover, Focus, Press are `:hover`, `:focus-visible`, `:active`, set by the browser ([CSS Selectors 4, user action pseudo-classes](https://www.w3.org/TR/selectors-4/#useraction-pseudos)). Values that are not pointer states stay properties. Anything else is W7. |
| WT2 | Disabled | The control's own `disabled`, which removes it from sequential focus and from form submission ([HTML, `disabled`](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-disabled)). `aria-disabled` where it must stay focusable ([WAI-ARIA](https://www.w3.org/TR/wai-aria-1.2/#aria-disabled)). |
| WT3 | A property named like a platform attribute | `role` is ARIA's ([WAI-ARIA, roles](https://www.w3.org/TR/wai-aria-1.2/#introroles)). Presentational hints still map align, width, height, border and bgcolor to CSS on any element ([HTML rendering, presentational hints](https://html.spec.whatwg.org/multipage/rendering.html#presentational-hints)). The hidden, title, lang and dir attributes are global. |
| WT4 | A property that is an element's own state | See the list under this table. |
| WT5 | A Breakpoint axis | One component whose layout answers its width through media or container queries ([CSS Containment 3, container queries](https://www.w3.org/TR/css-contain-3/#container-queries)). The variants are the widths drawn. |
| WT6 | A focus ring drawn as a layer, not clipped | `outline` on `:focus-visible`, offset by where the ring sits ([CSS UI 4, `outline-offset`](https://www.w3.org/TR/css-ui-4/#outline-offset)). |
| WT7 | An inside stroke not counted in layout | Figma lays padding out from the outer edge and draws the stroke over it. A CSS border sits between padding and edge ([CSS Box 4](https://www.w3.org/TR/css-box-4/#box-model)). Use `box-sizing: border-box` with padding less the stroke, or an inset `box-shadow`. |
| WT8 | An outside stroke with an effect style | Both become `box-shadow`, a comma-separated list on one property ([CSS Backgrounds 3, `box-shadow`](https://www.w3.org/TR/css-backgrounds-3/#box-shadow)). Two declarations override each other. |
| WT9 | An absolute child | `position: absolute` in a positioned ancestor, out of flow ([CSS Position 3](https://www.w3.org/TR/css-position-3/#abs-non-replaced-width)). |
| WT10 | Auto gap | `justify-content: space-between`, not a `gap` ([CSS Flexbox 1](https://www.w3.org/TR/css-flexbox-1/#justify-content-property)). |
| WT11 | Truncation | See the list under this table. |
| WT12 | A rotated layer | `transform: rotate()`, or for a flipped icon the glyph drawn the right way round ([CSS Transforms 1](https://www.w3.org/TR/css-transforms-1/#transform-property)). |
| WT13 | Capitals set by the text style | `text-transform: uppercase` over source text in normal case ([CSS Text 3](https://www.w3.org/TR/css-text-3/#text-transform-property)). |
| WT14 | A dashed stroke | `border-style: dashed`, whose dash and gap lengths the user agent chooses ([CSS Backgrounds 3](https://www.w3.org/TR/css-backgrounds-3/#border-style)). Exact dashes need SVG `stroke-dasharray`. |

- **WT1 · State axis, Loading.** `Loading` is the house's own value (figma-standard rule 58). In code it is a `loading` prop, separate from the pseudo-classes. It keeps focus with `aria-disabled` and announces through a live region ([loading buttons](../../../knowledge/ui/components/button.md#loading-buttons)).
- **WT4, Selected:** `aria-selected`, `aria-pressed` or `checked` ([WAI-ARIA states](https://www.w3.org/TR/wai-aria-1.2/#state_prop_def)).
- **WT4, Indeterminate:** the `indeterminate` IDL property; there is no attribute ([HTML `indeterminate`](https://html.spec.whatwg.org/multipage/input.html#dom-input-indeterminate)).
- **WT4, Expanded or Open:** `aria-expanded` or `open`.
- **WT4, Validation:** `aria-invalid` with `aria-describedby`.
- **WT4, Required:** `required` ([HTML `required`](https://html.spec.whatwg.org/multipage/input.html#attr-input-required)).
- **WT11, one line:** `text-overflow: ellipsis` with `overflow: hidden` and `white-space: nowrap` ([CSS Overflow 3](https://www.w3.org/TR/css-overflow-3/#text-overflow)). Add `min-width: 0` on the flex item ([Flexbox, automatic minimum size](https://www.w3.org/TR/css-flexbox-1/#min-size-auto)).
- **WT11, several lines:** `-webkit-line-clamp` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/-webkit-line-clamp)).

The live reader does not record rotation, text case or dashes. So WT12–WT14 speak only on a stored tree that carries them, as the snapshot does.

## Sources

| Kind | Sources | Read |
|---|---|---|
| WHATWG | HTML: syntax, input, rendering | 2026-08-22 |
| CSSWG | css-display-3, css-box-4, css-ui-4, css-overflow-3 and -4, css-inline-3, css-images-3 and -4, css-sizing-3, css-flexbox-1, css-position-3, css-masking-1, filter-effects-1, compositing-1 | 2026-08-22 |
| MDN | border-radius, corner-shape, text-box-trim, -webkit-line-clamp, backdrop-filter | 2026-08-22 |
| Figma Help | Strokes, text properties, auto layout, the flexbox alignment article, slots, component properties, gradients, blend modes, effects, image properties, masks, constraints, corner smoothing | 2026-08-22 |

Not found:

- a Figma page stating what still differs from flexbox after the 2025 change (it lists only convergences);
- a mapping from corner smoothing to a superellipse;
- a primary source for W12.
