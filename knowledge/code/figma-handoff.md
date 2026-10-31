# Reading a design file into code

How to read a Figma file into a build: what to extract and how, what the file says and what it only appears to say, how auto layout, strokes, focus rings, text styles and variants become CSS and markup, which states the design leaves out, the component inventory, what a component contract covers, and how to report where the build departs from the drawing. A design file is a description of intent, not a specification of markup: it has no heading levels, no landmarks, no link-versus-button, no focus order and nothing at the width nobody drew, so extracting geometry is the easy half and deciding what it meant is the work. The page serves code-standard's *Design-to-code* rules (code-standard rule 24 on where numbers come from, code-standard rule 63 on strokes, code-standard rules 25, 26 and 65 on rotation, artwork and gradients), code-standard rules 8, 9 and 62 on components and their variants, code-standard rule 54 on type, and design-standard's principles *consistent, not uniform* and *honest*. Measuring a build against its design is the `design-code-parity` skill's job; checking a component for what a target cannot reproduce before anyone builds it is `component-validator`'s. Token naming and theming are [tokens.md](tokens.md)'s; breakpoints and the page grid [responsive.md](responsive.md)'s; the element each part should be [html-semantics.md](html-semantics.md)'s.

**Implements:** the step before every pattern's Build part: reading what [visual](../ui/design/visual.md) and the [patterns](../ui/patterns/) draw into markup and CSS.

## Structure, not screenshots

**What good looks like**
- Every number in the build comes from the design file through a script, never from a screenshot or an eyeballed inspector value (code-standard rule 24).
- Tokens, text styles and effects arrive as generated files, built one way (code-standard rule 51).
- What the project has already decided is read from its context document, not rediscovered.

**How**
- Read the stored snapshot, not the live file: the project's snapshot holds variables, styles, component specs and screen frames pinned to a release, and every output reads it.

  | Want | Read | Becomes |
  |---|---|---|
  | Colour, spacing, radius, size scales | variables | DTCG token files, then the token build's Sass (code-standard rule 51, `figma-token-export`) |
  | Type ramp | text styles | text-style fields and the `text-style()` mixin (code-standard rule 54) |
  | Shadows, blurs | effect styles | shadow tokens, layers in CSS paint order |
  | Component structure and props | component sets and their properties | the component inventory (below) |
  | Breakpoint intent | the breakpoints collection, else the frame widths drawn | breakpoint tokens ([responsive.md](responsive.md#breakpoints)) |

- A variable collection with modes is already the theming model; each mode becomes one selector block ([tokens.md](tokens.md), code-standard rule 53).
- Where a project keeps a design system context document, its token vocabulary, rulings and accepted deviations outrank re-derivation; run discovery only for what it marks unresolved.
- Dev Mode's inspector is for checking a number, never for producing a rule ([Figma, guide to Dev Mode](https://help.figma.com/hc/en-us/articles/15023124644247-Guide-to-Dev-Mode)).

**Cases**
- A developer types padding from a screenshot as 15px → read the spec: it is `Spacing/4`, 16px, and the token is what ships.
- A colour is copied from the inspector as a hex → the fill is bound to a variable; ship the token name, so a theme change reaches it.
- The live file and the snapshot disagree → build from the snapshot and report the drift; a newer release means a new snapshot, not a hand edit (code-standard rule 32).
- Text styles exist only on a documentation page and not as styles → ask for real styles; a script cannot read a style that is only a picture of one.

**Accessibility**
- Nothing in this section bears on a criterion directly; it is what makes the later sections' numbers trustworthy.

**Check**
- *Script:* `tools/tokens/check.mjs` fails a `var()` or `text-style()` that names nothing; `tools/css-lint/check.mjs` gate "literal is a token" (code-standard rules 22 and 46) catches a length typed where the design binds a token; the parity run compares every mapped layer with the spec (code-standard rule 24).
- *Judgement:* can every number in this stylesheet be traced to the snapshot, or to a comment saying why the design has none (code-standard rule 22)?

**Sources:** [DTCG Format Module](https://www.designtokens.org/tr/drafts/format/); [Figma, modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables). Where a design tool's generated CSS and the snapshot disagree, the toolkit goes by the snapshot.

## What to trust in a design file, and what not

**What good looks like**
- Values bound to variables and styles are trusted; geometry that is an artefact of the frame is questioned.
- Near-duplicate values are consolidated at extraction, not carried forward as new tokens.
- Layer names inform the inventory; they never become class or attribute names by default.

**How**
- **Trust:** bound variables and styles, auto-layout direction, gap, padding and alignment, stroke alignment, a component's properties and variants, the frames' absolute bounding boxes (code-standard rule 25).
- **Question absolute positions.** A layer placed absolutely usually means "here, in this frame", not `position: absolute`. The exception is a child set to absolute inside an auto-layout frame (`layoutPositioning: 'ABSOLUTE'`, [Figma API](https://developers.figma.com/docs/plugins/api/properties/nodes-layoutpositioning/)), which does mean out of flow, against its parent.
- **Question fixed widths.** A fixed width is nearly always the frame's width at the moment it was drawn; ask what it does when the space changes. The answer is usually `1fr`, `min()`, a `max-inline-size`, or nothing.
- **Question layer names.** They are a designer's organisation. Name elements after their role (code-standard rules 6 and 8), and check a new hook name for collisions (code-standard rule 39). An instance's renamed layer resets to the component's name when the parent's variant changes, so the component's own layer names are the only ones a script can rely on.
- **Question near-duplicates.** `#3355FF` beside `#3356FF`, or 15px beside 16px, is one value and a stale copy; consolidate it and report it, because carrying it forward mints a permanent second token.
- **Do not trust:** a rotated node's `x`/`y` (code-standard rule 25), an exported render of an image fill (code-standard rule 26), a gradient's handles at an arbitrary angle (code-standard rule 65), or a decorative effect presented as a state (see *Focus rings*).

**Cases**
- A tooltip drawn at x=412 in the frame → it is positioned against its trigger in code (anchor positioning or a popover), not at 412.
- A card is 360 wide in every frame → ask; it is a grid track (`minmax(min(20rem, 100%), 1fr)`), not a width.
- Two greys one step apart in a single component → check which the library binds; an unbound literal next to a bound token is a design defect to report, not a value to ship.
- A layer named `Frame 427` holds the label → name it for what it is in markup; the layer name carries no meaning.

**Accessibility**
- 1.3.1 Info and Relationships: structure comes from what the content is, which layer names and positions do not say ([Understanding 1.3.1](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)).
- code-standard rule 1, code-standard rule 2: DOM order is reading order, whatever the frame's z-order or x positions.

**Check**
- *Script:* `component-validator` reports what a target cannot reproduce as drawn; `tools/css-lint/check.mjs` gate "literal is a token" catches a value the design binds. Could: flag `position: absolute` in a component sheet with no anchor or overlay reason.
- *Judgement:* for each absolute position and fixed width in the frame, what should happen when the space changes?

**Sources:** Figma Plugin API as linked. Where a frame's geometry and the component's auto layout disagree, the toolkit builds the auto layout.

## Auto layout to flex and grid

**What good looks like**
- An auto-layout frame becomes a flex or grid container with the same direction, gap, padding and alignment, each a token.
- Hug, fill and fixed sizing become intrinsic CSS, not lengths.
- Whether strokes take layout room is read, not assumed.

**How**
- Direction and spacing: `layoutMode` `HORIZONTAL` or `VERTICAL` is `display: flex` with `flex-direction: row` or `column`; `GRID` is `display: grid` ([Figma API `layoutMode`](https://developers.figma.com/docs/plugins/api/properties/nodes-layoutmode/)). Item spacing is `gap`; padding is `padding`, per side.
- Alignment: the primary axis is `justify-content`, "space between" is `justify-content: space-between`; the counter axis is `align-items`.
- Wrap: `layoutWrap: 'WRAP'` is `flex-wrap: wrap`, with the counter-axis spacing as `row-gap` ([Figma API `layoutWrap`](https://developers.figma.com/docs/plugins/api/properties/nodes-layoutwrap/)).
- Sizing ([Figma API `layoutSizingHorizontal`](https://developers.figma.com/docs/plugins/api/properties/nodes-layoutsizinghorizontal/)): `HUG` is the default (`auto`, `fit-content`, or nothing); `FILL` is `flex: 1 1 0` on the primary axis or `align-self: stretch` on the counter axis; `FIXED` is the one to question (see above). Min and max widths become `min-inline-size` and `max-inline-size`.
- A control's declared height is a minimum: `min-block-size` from the sizing token, with padding as the inset when content grows. A fixed `height` around text fails at 200%.
- Strokes in layout: `strokesIncludedInLayout` makes the frame "behave like css box-sizing: border-box" ([Figma API](https://developers.figma.com/docs/plugins/api/properties/nodes-strokesincludedinlayout/)); which CSS draws the stroke is the next section.

**Cases**
- A button frame is horizontal, 8 gap, 12/16 padding, hug → `display: inline-flex; gap: var(--space-2); padding: var(--space-3) var(--space-4)`; no width, no height.
- A toolbar uses "space between" with three children → `justify-content: space-between`, and check it at a narrow width: with wrapping, "space between" spreads the last row too.
- A list's items are FILL in a vertical frame → they stretch by default in a column flex; write nothing.
- A frame without auto layout holds positioned children → ask whether it is a picture or a layout; if a layout, rebuild it in flow and report that the source has none.

**Accessibility**
- code-standard rule 2: `flex-direction: row-reverse`, `order` and grid placement never change reading or tab order.
- 1.4.4 and 1.4.12: hug and `min-block-size` keep text from being clipped when it grows.

**Check**
- *Script:* the parity run compares gap, padding, direction and alignment for every mapped layer (code-standard rules 24 and 34); `tools/css-lint/check.mjs` gate "no declaration made to agree with a check" (code-standard rule 42) fails a height computed as a text size times its line height.
- *Judgement:* is every length in this component's sheet one the design binds, or a size that should have been intrinsic?

**Sources:** [Figma, guide to auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout) and the API pages linked. They agree; the toolkit maps each property one to one and questions only FIXED.

## Strokes: borders, outlines and shadows

**What good looks like**
- A stroke becomes the CSS channel that takes the same room the stroke takes in Figma (code-standard rule 63 is the table).
- A single-edge outside stroke is one shared mixin, not a per-component shadow.
- An outer ring is never clipped by an ancestor it did not know about.

**How**
- Read `strokeAlign` (`INSIDE`, `CENTER`, `OUTSIDE`) and, for inside strokes, whether strokes are included in layout ([Figma API `strokeAlign`](https://developers.figma.com/docs/plugins/api/properties/nodes-strokealign/)); then apply code-standard rule 63's table. Only inside-in-layout is a `border`.
- Per-side weights are per-side borders or per-side offset shadows, each width a stroke token (px, code-standard rule 54).
- The hairline under a row (a 1px outside stroke on the bottom edge) is the scaffold's `hairline.below`: an outer shadow offset down by its width, so a row of 48 stays 48 ([MDN `box-shadow`](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow)).
- An outer shadow paints under the next sibling's background and is cut off by an ancestor with `overflow: hidden`; where either happens, draw the line on the sibling's top edge or the clipping ancestor instead.
- An outside stroke a design system has re-drawn as a zero-blur spread shadow effect style is the same thing: `box-shadow: 0 0 0 N` from the effect token.

**Cases**
- An outlined button has a 1px inside stroke, included in layout → `border: var(--stroke-1) solid …`; the design's 40px height includes it.
- A card has a 1px outside stroke and the build used `border` → every card is 2px larger than drawn and the grid drifts; use `box-shadow: 0 0 0 1px` or `outline`.
- A list's last row draws a hairline the design does not → the line is between rows, so the list turns it off on the last row with a knob the row reads.
- A ring on a card inside a scrolling row is clipped at the row's edge → give the row inner padding of at least the ring's reach.

**Accessibility**
- 1.4.11 Non-text Contrast: a control's boundary stroke must reach 3:1 where it is what identifies the control; a divider is not held to it ([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)).
- code-standard rule 63.

**Check**
- *Script:* the parity run's stroke rows assert code-standard rule 63's channel for every mapped layer (`tools/parity/adapt.mjs`); `component-validator` reports a centre stroke and other strokes a target cannot draw as drawn.
- *Judgement:* is each stroke the control's boundary, a divider, or decoration, and is its contrast judged accordingly?

**Sources:** Figma API and MDN as linked; code-standard rule 63's evidence (1,946 real nodes) is the toolkit's own.

## Focus rings: reading their geometry

**What good looks like**
- The ring is one mixin for the whole system, an `outline` (it takes no layout room), its width and colour from the design's focus tokens.
- Each component states only where the ring's outer edge sits past its box, read off the frame.
- The focus indicator is the stroke the design names; a decorative glow beside it is not graded as the indicator.

**How**
- The scaffold's `focus.ring($clear)` takes `clear`, how far past the ringed box the ring's outer edge sits, and draws inward from there: `outline-offset: calc(clear - width)` ([MDN `outline-offset`](https://developer.mozilla.org/en-US/docs/Web/CSS/outline-offset)). A new ring width then moves every ring together.
- `clear` is generated, never read off by hand (toolkit-standard §D 23): `to-code` writes it from the contract (`tools/component-contract/to-code.mjs`, `ringOf`). Its arithmetic, for reading one: half the difference between the ring layer's width and the ringed layer's, plus half the stroke for a `CENTER` stroke and the whole stroke for an `OUTSIDE` one, nothing for `INSIDE`. The parity adapter's `-ring-offset` row is the same arithmetic.
  - A 2px `INSIDE` ring on a layer 8px wider than the button: `clear` 4, offset 2.
  - A ring drawn on the box's own edge, inside it: `clear` 0, offset minus the width.
- Two anatomies are common: a *field* whose own stroke changes colour and width on focus (no layer added), and a *control* with a separate ring layer present only on its focus variant. Map the first to the field's border or inset ring on `:focus-visible`, the second to `focus.ring`; never mix them in one component.
- **Corners: the element's radius is the ring's radius less `clear`.** An outline's corners follow the element's `border-radius` and grow by the offset and the width, so its outer radius is `border-radius + clear`; a spread shadow grows the same way. Writing the Figma ring layer's radius onto the element rounds the ring by `clear` too much. Tested in Chromium, 2026-10-25: radius 12 with a 2px outline at offset 2 draws an outer radius of 16, and radius 16 draws 20. Outlines have followed `border-radius` since Chrome 94, Firefox 88 and Safari 16.4 ([MDN `outline`](https://developer.mozilla.org/en-US/docs/Web/CSS/outline)); how the corners grow under an offset is not yet specified ([csswg-drafts #8786](https://github.com/w3c/csswg-drafts/issues/8786)), so Firefox and Safari are worth checking.
- **An offset ring is a layer; a ring touching the edge may be an effect.** Both ship. Untitled UI draws its rings as effect styles (`focus-ring`, `focus-ring-error`), and because Figma allows one effect style per layer it adds combined ring-and-shadow styles too, a doubling its own docs call a workaround ([Untitled UI: shadows and blurs](https://www.untitledui.com/components/shadows-blurs)). An effect ring follows light and dark when a colour variable is bound to it, which Figma has allowed since 6 December 2023 ([Figma: variables bound to new fields](https://forum.figma.com/product-updates-3/variables-can-now-be-bound-to-new-fields-in-figma-13940)). It stops working at an offset: a spread shadow cannot leave a transparent gap, so the gap has to be painted in a colour, which is wrong on every surface but one. Figma also renders spread only on rectangles, ellipses, frames and components, and on a frame only when it clips its content and has a visible fill ([Figma help: drop shadows](https://help.figma.com/hc/en-us/articles/360041488473)). So a ring with a gap, as most do, is a stroked layer around the component, which maps to `outline` and `outline-offset`; Untitled UI's own React code draws its rings that way, as an outline with a 2px offset ([untitleduico/react `theme.css`](https://github.com/untitleduico/react)). In code, a shadow ring disappears in forced-colours mode while an outline stays ([accessibility: visible focus](accessibility.md#visible-focus)).
- Turning a ring off is `--ring: 0` (the scaffold's knob) or `outline-width: 0`, never `outline: none` (code-standard rule 40).
- The state is `:focus-visible`, never an attribute (code-standard rule 9).

**Cases**
- A button's focus variant draws a ring layer 4px larger on each side with a 2px inside stroke → `clear` is 4px, so `@include focus.ring(…)` with the 4px spacing token.
- A text input's focus variant changes its border to the focus colour at 2px → the field's own border on `:focus-visible`; a second outline outside it would be a ring the design does not draw.
- A design pairs a soft glow effect with a 2px stroke on focus → the stroke is the indicator; measure it against 3:1, and treat the glow as decoration.
- A card's ring layer sits 4px outside with `Corner radius/20` around a card of `Corner radius/16` → the card keeps `border-radius` 16 on focus and the outline draws 20; writing 20 on the card draws 24.
- A list row rings itself and the checkbox inside it must not → the row sets `--ring: 0` on the control part.

**Accessibility**
- 2.4.7 Focus Visible (AA), 1.4.11 Non-text Contrast (AA) for the ring at 3:1, 2.4.11 Focus Not Obscured (Minimum) (AA), 2.4.13 Focus Appearance (AAA) ([Understanding 2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)). Where the ring lands on each surface is [accessibility: focus visibility](../ui/design/accessibility.md#focus-visibility).
- code-standard rules 9 and 40.

**Check**
- *Script:* the parity run asserts the ring's width, colour, `-ring-offset` and `-ring-radius` (its outer corners) on every focus variant; `tools/css-lint/check.mjs` gate "`outline: none`" (code-standard rule 40) fails the shorthand that leaves a width behind.
- *Judgement:* on every surface the component sits on, does the ring reach 3:1, and is anything clipping or covering it?

**Sources:** MDN and WCAG Understanding as linked. Where a design's glow and stroke disagree on contrast, the toolkit grades the stroke the design names as the indicator.

## Text styles to type tokens

**What good looks like**
- Each text style reaches code as code-standard rule 54 writes it, through the token build; nothing is typed by hand.
- Units are converted once, by the build: size in rem, line height unitless, letter spacing in em.
- No component writes a `font` shorthand or a raw size.

**How**
- The build writes each style's fields under its name (`--body-md-regular-…`, the list is code-standard rule 54's), and components apply `@include text-style(body-md-regular)`.
- Figma's line height as a percentage or in px becomes unitless (a 24px line on 16px text is 1.5), so it scales with the size; letter spacing as a percentage becomes em (2% is 0.02em). `figma-doc-generator` documents the same conversions.
- Where the design trims a text box to cap height and baseline, `text-box-trim` reproduces it; it is newly Baseline in 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/text-box-trim)), so check the project's floor ([browser-support.md](browser-support.md)).
- A text style with modes (Desktop, Mobile) is a responsive type token; how it switches is [responsive.md: fluid type](responsive.md#fluid-type).

**Cases**
- A heading uses `font: 600 24px/32px Inter` → `@include text-style(heading-md)`; the shorthand drops letter spacing and the fallback stack.
- A text style has 0% letter spacing and the build skipped the field → write it at zero; a `var()` reading a missing field drops its whole declaration (code-standard rule 54's evidence).
- A label's line height of 16px on 12px text → 1.333…, as the build computes it; a rounded hand-typed 1.3 drifts by a pixel per line.

**Accessibility**
- 1.4.4 Resize Text: rem sizes; 1.4.12 Text Spacing: unitless line height and no fixed heights around text.
- code-standard rule 54.

**Check**
- *Script:* `tools/tokens/check.mjs` fails a `text-style()` that names nothing; the parity run compares each text layer's computed font fields with its style. Could: flag a `font` shorthand in a component sheet.
- *Judgement:* is every piece of text in this component on a named style, or is one a local override the design should name?

**Sources:** MDN as linked; [DTCG Format Module](https://www.designtokens.org/tr/drafts/format/) for the typography composite.

## Variants to attributes

**What good looks like**
- A variant axis is an attribute on the custom element; state is a pseudo-class; disabled is the control's own (code-standard rule 9).
- An axis that differs in kind, not appearance, is a separate component.
- An axis named like an HTML or ARIA attribute is renamed (code-standard rules 9 and 10).

**How**
- `Size=sm|md|lg`, `Variant=primary|outline` → `size="sm"`, `variant="primary"`, selected as `[size=sm]`. The default value is the bare element.
- `State=Rest|Hover|Focus|Press` → `:hover`, `:focus-visible`, `:active`; `Disabled=True` → native `disabled` or `aria-disabled`, and the dim is the host's, once (code-standard rule 62).
- A boolean that toggles a layer's visibility is usually a slot or an attribute that shows a part; a boolean that is really a state (`Selected`, `Checked`, `Expanded`) is the platform's state (`:checked`, `aria-expanded`, `aria-selected`). `component-validator` reports booleans that are states.
- An instance-swap property is a slot (code-standard rule 13); a text property is slot content or an attribute, never a hard-coded string.
- A `Breakpoint` axis is not an attribute: it is the width to render at ([responsive.md](responsive.md#breakpoints)).
- An icon drawn inside a text input cannot go there: `input`'s content model is nothing ([WHATWG `input`](https://html.spec.whatwg.org/multipage/input.html#the-input-element)). Wrap the input, position the icon in the wrapper, and turn its space into the input's inline padding; record it as a deviation with a parity waiver keyed to the ruling.

**Cases**
- A button set has `Role=Primary|Secondary` → `variant`; `role="primary"` would tell a screen reader the button has an ARIA role called primary.
- A select and a combobox are variants of one set because they look alike → two components; they differ in kind (code-standard rule 8).
- A card's `Has image` boolean → render the image part only when there is an image (code-standard rule 12), not when the attribute says so.
- A tab item has `Selected=True` → `aria-selected="true"` set by the tabs' script, styled on `[aria-selected=true]`; a `selected` attribute would let a template claim it.

**Accessibility**
- 4.1.2 Name, Role, Value: states the platform knows are exposed to assistive technology; attributes the build invents are not.
- code-standard rules 8, 9, 10, 13 and 62.

**Check**
- *Script:* `tools/css-lint/check.mjs` gates "a state is a pseudo-class, disabled the control's own" (code-standard rule 9) and "no presentational attribute as a variant" (code-standard rule 10); the parity run measures every variant the set declares or names it (code-standard rule 33).
- *Judgement:* for each axis, does it change appearance or kind, and is it something the template may decide or something only the control knows?

**Sources:** WHATWG as linked; W3C *Using ARIA* (cited in [candidates.md](candidates.md)) for preferring native states.

## States the design lacks

**What good looks like**
- Before building, the list of states each component and page needs is checked against what the design draws, and the gaps are asked about, not invented silently.
- Every state the build adds uses the system's existing tokens.
- What stays undrawn is recorded in the project's context document.

**How**
- Ask, per component: hover, focus, active, disabled, selected, loading, empty, error, read-only, long content, no content, no image, overflowing text, right-to-left, forced colours, reduced motion, and the no-script path (code-standard rule 20).
- Ask, per page: the narrowest supported width, the error page, the empty and no-results views, the expired or removed record, the signed-out view.
- Focus is usually undesigned; use the system's focus tokens and `focus.ring`, and say so.
- Read-only and disabled are states the platform enforces; the choices are [accessibility: hidden content](accessibility.md#hidden-content).
- Forced colours replace the palette; borders and outlines survive, shadows and backgrounds do not, so a ring drawn as a `box-shadow` needs a transparent outline beside it ([MDN `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)).

**Cases**
- A table component is drawn only with rows → ask for the empty, loading and error states; an empty table with headers and no message is a design gap, not a build decision.
- Every screen is drawn at one desktop width → build intrinsically, ask for the narrow frames, and list the undrawn widths as open in the context document.
- No 404 page is drawn → build it from existing components and report it as built without a design.
- A read-only mode is drawn as the normal screen greyed out → `inert` or disabled controls, not `pointer-events: none`; the greyed look is the design's, the enforcement the platform's.
- A long product name is drawn at twelve characters → build with sixty and with none; the frame used ideal text.

**Accessibility**
- 2.4.7 Focus Visible, 4.1.2 Name, Role, Value (states exposed), 1.4.11 in forced colours, 2.3.3 and reduced motion ([accessibility.md](accessibility.md)).
- code-standard rules 12, 17 and 20.

**Check**
- *Script:* the parity run fails a declared variant it does not measure (code-standard rules 33 and 37); `figma-components-audit` reports missing state coverage in the library. Could: list each component's states in code against the set's variants.
- *Judgement:* which states will real content and real users reach that the file never drew?

**Sources:** MDN as linked. The design side of state coverage is [visual: visual states of controls](../ui/design/visual.md#visual-states-of-controls).

## The component inventory

**What good looks like**
- Before any CSS, a list of the components the design implies, each with its element, kind, variants, states and content extremes.
- One component per kind of thing, however many frames draw it.
- Every component maps to a library component set or is named as page-local.

**How**
- For each component: the element (code-standard rule 1), the kind, visual, native interactive or scripted (code-standard rule 8), its variant axes as attributes, its states, its slots, and its shortest and longest real content.
- Two questions decide most of it. Does it differ in appearance or in kind? Appearance is a variant attribute (code-standard rule 9); kind is a separate component. What is the longest and shortest real content it holds? Build for both.
- Cross-check it with the library's component sets: an instance of a library component is that component; a detached copy is a finding to report.
- An interface inventory (screenshots of every instance of a pattern, grouped) is how to find one thing drawn three ways ([Brad Frost, interface inventory](https://bradfrost.com/blog/post/interface-inventory/), commentary).

**Cases**
- On page four the "card" turns out to be three different layouts → the inventory catches it on day one: one card with a `layout` attribute, or three components, decided once.
- Two screens draw the same modal with different paddings → one component; report the difference as drift in the design.
- A design uses a detached instance with an extra icon → build from the library component and report the detach; the extra icon is either a slot the component lacks or a design error.

**Accessibility**
- code-standard rule 8: picking the native element in the inventory is where most accessibility is won or lost; [html-semantics.md](html-semantics.md) owns the choice.

**Check**
- *Script:* the parity run compares the design-system instances each frame holds with what the page renders (code-standard rule 31). Could: list detached instances and unmapped component sets from the snapshot.
- *Judgement:* is any component in the inventory two things, or any two components one?

**Sources:** Brad Frost as commentary; code-standard rules 8 and 31 are the toolkit's own.

## What a component contract covers

**What good looks like**
- A component's contract (what its drawing means, in words no platform owns; the toolkit's is [`tools/component-contract`](../../tools/component-contract/README.md)) holds what both design and code can say and a check can hold exactly: the API, the structure, the token bound to each part per variant, layout as intent, and states as props with the token changes they cause.
- From behaviour and accessibility it takes only a role per part and the prop that supplies the accessible name; keyboard, focus and motion stay with the docs page and code tests.
- Usage guidance, resolved geometry and token values each live somewhere else, and the contract points there rather than copying them.

**How**
- **The layers, and how far each can be checked.**

  | Layer | Figma and code | Checkable |
  |---|---|---|
  | API: props, types, defaults, events, slots, required and conditional props, invalid combinations | both, with gaps: Figma's property types are `BOOLEAN`, `INSTANCE_SWAP`, `TEXT`, `VARIANT` and `SLOT` ([Figma REST property types](https://developers.figma.com/docs/rest-api/file-property-types/)); code adds number, event, required and conditional | fully: names, types, values and defaults diff exactly |
  | Structure: parts, kinds, nesting, order, which prop drives which part | both | mostly: trees align, but a layer name is a designer's organisation ([what to trust](#what-to-trust-in-a-design-file-and-what-not)) |
  | Tokens per part, per variant | both, where the design binds a variable | fully when bound, by name; an unbound value compares only by value, and two tokens holding one value tie |
  | Layout intent: direction, gap, padding, alignment, hug, fill or fixed, wrap, min and max | partly: auto layout maps to flex ([auto layout to flex and grid](#auto-layout-to-flex-and-grid)); grid, text sizing and baselines differ | the declarative half: tokens and the sizing mode |
  | States: interaction (hover, focus, press) and semantic (disabled, selected, loading) | asymmetric: Figma draws each as a variant, code uses pseudo-classes and props ([variants to attributes](#variants-to-attributes)) | the token changes per state; how a state renders is parity's |
  | Behaviour and accessibility: role, keyboard, focus, announcements, motion | Figma mostly cannot say it; it survives as annotations | a role per part, cheaply; keyboard and focus only in code tests |
  | Content and usage guidance | prose on both sides | only whether the section exists |
  | Resolved geometry: positions, the size hug resolves to, pixels | each side's own output | measurable but volatile; the snapshot's and parity's job |

- **Where published systems draw the line.** Every system that publishes component *data* publishes the API, sometimes with parts: Spectrum's JSON Schema per component holds `properties`, `enum`, `default` and `state`, with cross-prop rules such as "Icon must be present if the label is not defined" ([Spectrum action-button schema](https://github.com/adobe/spectrum-design-data/blob/main/docs/site/public/schemas/components/action-button.json)); Primer's `docs.json` holds props, stories, status and `a11yReviewed`, and no anatomy or layout ([Primer Button.docs.json](https://github.com/primer/react/blob/main/packages/react/src/Button/Button.docs.json)); the [custom elements manifest](https://github.com/webcomponents/custom-elements-manifest/blob/main/schema.d.ts) has attributes, events, slots, `cssParts`, `cssProperties` and `cssStates`, styling hooks but never layout; [Storybook argTypes](https://storybook.js.org/docs/api/arg-types) add conditional args; [Code Connect](https://developers.figma.com/docs/code-connect/react/) maps props, nested instances, children and slots and reads no style or layout. Visual detail is kept as tokens, part by state by property in Material's component tokens (`container-height`, `pressed-state-layer-opacity`, [material-web filled button tokens](https://github.com/material-components/material-web/blob/main/tokens/versions/v0_192/_md-comp-filled-button.scss)) and Spectrum's layout tokens ([Spectrum layout.json](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/src/layout.json)), or as prose and diagrams ([Carbon button style](https://carbondesignsystem.com/components/button/style/): "A button cannot have label or any element within 16 pixels / 1 rem of its borders"). Behaviour and guidance are prose on the page ([Polaris](https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button), [Atlassian](https://atlassian.design/components/button/usage), [GOV.UK](https://design-system.service.gov.uk/components/button/)). A DTCG token is "at minimum a name/value pair" with no notion of a component or part ([DTCG format](https://www.designtokens.org/tr/drafts/format/)), so a contract references tokens and never defines them.
- **Curtis draws the widest line.** His specs cover "Anatomy, Properties, Layout and spacing, Behavior, Accessibility, Motion, Component tokens" ([Curtis, Component Specifications](https://nathanacurtis.substack.com/p/component-specifications-1492ca4c94c)), but his data layer is narrower: behaviour and accessibility become authored supplements, or "a role [as] a Dev Mode annotation applied to the layer", without which generated output is "visually correct but behaviorally inert markup" ([Curtis, component and part roles](https://nathanacurtis.substack.com/p/component-and-part-roles-as-composites); [Spec-driven UI component development](https://nathanacurtis.substack.com/p/spec-driven-ui-component-development)). Code-only props (`accessibilityLabel`, `as`, `level`) he binds to hidden layers ([Curtis, code-only props](https://nathanacurtis.substack.com/p/code-only-props-in-figma)), and "Figma prop types are nowhere near comprehensive and bias heavily towards visual outcomes". On authority: "A definition biased to one party's point-of-view is testimony, not a contract" ([Curtis, contracts and schemas](https://nathanacurtis.substack.com/p/component-contracts-and-schemas)).
- **A fixed number the design did not bind is drawing, not intent.** Keep it where a contract must rebuild every variant exactly, but read it as incidental. Figma's Dev Mode annotations can pin properties (width, height, padding, item spacing, layout mode, alignment, fills, text style, [Figma `AnnotationProperty`](https://developers.figma.com/docs/plugins/api/AnnotationProperty/)); a pinned property is the designer saying which layout facts are deliberate.
- **Alignment a caller can change is a prop**, as Primer's `alignContent` is, not anatomy.
- **Required and conditional props** ("only when", "requires") have no Figma property: its properties belong to the whole component set, so the canvas can only leave a variant out. Code says it on the prop (a TypeScript union, JSON Schema `if`/`then`). A contract says it on the part, read from where Figma draws it: a part drawn only under some props' values carries that condition (an icon only at the large size, `{ size: ['large'] }`), the prop's own condition following from the parts it drives. Trueman's examples mark the conditional element in data (`condition: dismissible == true`, [Trueman, components as data](https://blog.murphytrueman.com/what-your-components-look-like-as-data/)), and Southleft's contract prototype puts `visibleWhen` on the part ([ds-contracts-poc, contract spec](https://github.com/southleft/ds-contracts-poc/blob/main/docs/02-contract-spec.md)).
- **Invalid combinations are a canvas fact.** The variant-axis combinations a design does not draw say what Figma left out, not a type rule for code: Vallaure, "Figma allows gaps in your variant matrix. Code does not" ([Vallaure, contracts](https://christinevallaure.substack.com/p/design-system-contracts-the-component)); the prototype calls them "a canvas fact only". A generator turns one into a type error only where the project asks.
- **Per-variant values are token names per part,** what each value of a prop changes; the tokens hold the values in each mode and the snapshot holds what was drawn. A library that switches a variable mode on a variant (a Size mode) is not yet recorded by a snapshot, and its contract would miss it.
- **Who owns what.** While the design is drawn first, the contract that is stored is derived from the snapshot, so its record is the design's; a change to a drawn component's API (props, parts, conditions, invalid combinations, roles) is written as a proposal, reviewed, made in the design and the code, and derived again; neither design nor code updates the other directly, and the look stays the snapshot's. Southleft's prototype, the one public attempt to generate both Figma and code from contracts (56 components, a three-way differ), says itself it "is not complete" and leaves reconciliation and review unproven ([ds-contracts-poc](https://github.com/southleft/ds-contracts-poc)); making the contract the source of the look waits on a whole library drawn from contracts and verified back. A project can instead make the contract the source of a library's API (`source: "contract"` in its audit settings, tools/component-contract/official.mjs): the contracts as they stand become official files, one per component named by its Figma component key, so a rename in Figma keeps its contract; a snapshot never writes them, and where Figma's reading differs, Figma is behind, said with a brief for its designer, until Figma is changed or the difference is taken as official. The tools that build or judge code read the official contract; the measured look (parity against the drawing) stays the snapshot's either way. The key, not the name, because a sync that matches by name takes a rename for a new thing: Figma's own example of syncing variables "will look for existing collections and variables by name", creates one where no name matches, and deletes none, so a renamed token leaves its old variable behind ([variables-github-action-example](https://github.com/figma/variables-github-action-example)). And one side wins: GitLab's design system, trying a sync of its tokens with Figma, found one-way preferable because the other way "doesn't maintain file organisation" ([gitlab-ui#2526](https://gitlab.com/gitlab-org/gitlab-ui/-/issues/2526), a spike, not a shipped sync).
- **A role per part** is read from an annotation (an Accessibility note such as `role: button`, [Figma `Annotation`](https://developers.figma.com/docs/plugins/api/Annotation/)), with the prop that names the component for assistive technology.
- **Elsewhere:** usage guidance goes to the docs page ([documentation profile](../ui/profiles/documentation.md)); resolved geometry and rendering stay with the snapshot and parity; token values stay with the DTCG export (code-standard rule 51).
- **A preview drawn from a contract is a structure sketch, not a likeness.** Fidelity needs every variant, mode, nested instance's internals, icon and state, which is rebuilding the design tool in the browser. Draw boxes per part with kind, direction, gap, hug or fill and token names; nested instances as dashed boxes named after their component; slots as hatched areas; parts hidden by default drawn as any part, their title naming the prop that shows them, with that prop a switch beside the drawing that takes them away (a greyed, dashed look read as a broken part to the maintainer who used it); and label it a sketch. The real look comes from drawing the contract back into the design file with the library's own components.

**Cases**
- A contract records each part's padding as the pixel width its frame happened to have → the token where one is bound; an unbound fixed number is kept as incidental, never presented as intent.
- An `onChange` prop is offered as a Figma property → there is no event property type; mark it code-only, with its payload and, on the web, whether it bubbles.
- A contract copies a component's usage guidance into a field → the docs page owns it; the contract points there.
- A contract editor's preview is reworked again and again to look like the component → call it a structure sketch and send the real look to the design file.
- A generated component renders right and announces nothing → the contract had no role per part; read the role from the annotation.

**Accessibility**
- 4.1.2 Name, Role, Value: a role per part and the prop that names the component are the part of accessibility a contract can hold; the keyboard and focus contract is the [APG](https://www.w3.org/WAI/ARIA/apg/patterns/) pattern's, tested in code ([accessibility: composite widgets](accessibility.md#composite-widgets-and-roving-tabindex)).

**Check**
- *Script:* a contract's API and tokens diff exactly against code's (`tools/component-contract/from-code.mjs` compares props through the code audit's `compareProps`); the contract rebuilds every stored variant or names the one it does not (`derive.cjs`'s self-check). Could flag a part with an interactive kind and no role.
- *Judgement:* for each field in the contract, could both sides state it, and could a check hold it? A field that fails both belongs on the docs page or in the snapshot.

**Sources:** Spectrum, Primer, the custom elements manifest, Storybook, Figma, Material, Carbon, Polaris, Atlassian, GOV.UK, DTCG and Curtis as linked. Every published system stops its data at the API and structure, with visual detail as tokens or prose; Curtis alone puts layout in component data and calls it the lossiest part. The toolkit's contract holds the five checkable layers plus a role per part, and stops there.

## Reporting deviations

**What good looks like**
- The build matches the design on type, colour, spacing, radii, strokes and structure.
- Where it departs, the departure is deliberate, has a reason, and is reported back to the design.
- No declaration exists to make a check agree (code-standard rule 42), and no deviation is hidden by changing the drawing.

**How**
- Deviate deliberately on: the widths between frames; undesigned focus states; a token pair failing contrast (a design bug, fixed in the token layer where it fixes everywhere); a target under 24px; text that cannot reflow; anything the platform cannot do (an icon inside an input, a centre stroke on a line).
- Record each one where it will be read: a parity waiver with a reason (code-standard rules 24 and 41), and a ruling in the project's context document when it is a decision rather than a defect.
- A build drawn back into the design file shows what the code renders, oddities included; the differences go to the comparison, never trimmed from the drawing.
- Report to the designer in their terms: which component, which variant, what differs, why, and what would let the design and build agree.

**Cases**
- A secondary text colour fails 4.5:1 on its surface → ship the design's token and report the failure, or fix the token if the project rules the code may; never darken one component's copy.
- A 16px icon button in a dense table → pad it to 24px and report the deviation; the design's size fails 2.5.8.
- A label drawn on one line wraps in the build at a narrow width → let it wrap and report that the design needs a two-line state.
- The parity run is red on a padding because the input's icon moved to the wrapper → one waiver keyed to the ruling, not two unexplained differences.

**Accessibility**
- 1.4.3 Contrast (Minimum), 2.5.8 Target Size (Minimum), 1.4.10 Reflow: the three most common reasons to depart from a drawing.

**Check**
- *Script:* the parity run fails any difference without a waiver, and a waiver whose reason is not from the closed list (code-standard rule 41).
- *Judgement:* would the designer, reading the report, know what to change in the file or why not to?

**Sources:** WCAG 2.2 ([W3C](https://www.w3.org/TR/WCAG22/)); code-standard rules 24, 41 and 42 are the toolkit's own. Where fidelity and accessibility disagree, the toolkit builds the accessible version and reports the difference.
