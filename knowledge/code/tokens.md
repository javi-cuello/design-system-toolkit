# Tokens and theming in code

How design tokens reach a stylesheet and how themes and modes switch them: the three tiers, component token names worked through, a generated token layer that keeps its references, custom properties against Sass variables, themes and modes, what not to tokenise, literals with reasons, the disabled opacity, motion tokens and density. It serves code-standard rules 22, 23 and 51–54 and code-standard rule 62, and the design-standard principles *consistent, not uniform* (one value, one name, in both tools) and *for everyone, in any context* (the reader's scheme and font size are honoured). The design side of the same decisions is [visual: theming and dark mode](../ui/design/visual.md#theming-and-dark-mode), [density modes](../ui/design/visual.md#density-modes) and [motion](../ui/design/visual.md#motion); reading a design file into code is [figma-handoff.md](figma-handoff.md)'s; how layers and custom properties behave in general is [css-architecture.md](css-architecture.md)'s.

## Three tiers

**What good looks like**
- **Components consume semantic tokens only.** A primitive in a component stylesheet is the defect: it is how a system ends up with fourteen greys and no way to theme any of them.
- A component tier exists only where a component exposes a knob.
- Every token is named by its design-file path (code-standard rule 52), so a designer and an engineer search for the same word.

**How**

```
primitive   --blue-500: oklch(…);                       a value; names nothing about use
semantic    --colour-text-link: var(--blue-500);        a decision; names the use
component   --button-bg: var(--colour-action-primary);  a knob; optional
```

- Primer's model is the same: base tokens "map directly to a raw value", functional tokens "represent global UI patterns", and component tokens "should only be used in component CSS" ([Primer, token names](https://primer.style/product/primitives/token-names/)).
- The component tier is an indirection point: `--button-bg` lets a variant re-point one property without a new selector (code-standard rule 38). Most projects are better off without it at the start; add it when a component needs a knob, not because the tier exists.
- Where the design file hides primitives from publishing, a component physically cannot bind one there; the code holds the same line by convention and by review.
- A component token reads component, then the layer it paints, then the property, with the variant and state last ([worked through below](#component-token-names-worked-through), figma-standard rule 49). The custom property is that path (code-standard rule 52): `Component/Avatar/Container/background-photo` is `--component-avatar-container-background-photo`. A brand is not a segment; it re-points the same name.

**Cases**
- A button's sheet reads `var(--palette-blue-9)` → re-point it to the semantic token the design binds; the primitive will not follow a theme or a brand change.
- A chart needs seven series colours the semantic tier has no slot for → a project may rule that a data-visualisation collection is bound directly; it is a stated exception in its context document, not a precedent.
- A variant needs a different background → set `--button-bg` under the variant's attribute; no second rule at the component's selector.
- A token reads `--progress-background-bar` → `--component-progress-bar-background`: the layer comes before the property, so every token that paints the bar sorts together.

**Accessibility**
- Contrast is decided once, at the semantic pairing, and inherited by every component that uses the pair: WCAG 2.2 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *literal is a token* (code-standard rules 22 and 46) catches a literal equal to a token; could flag a primitive-tier `var()` in a component sheet.
- *Judgement:* Does each `var()` in a component name a use or a value?

**Sources:** [Primer, token names](https://primer.style/product/primitives/token-names/); [DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/). The sources agree on three tiers; the toolkit makes the component tier optional.

## Component token names, worked through

**What good looks like**
- A component token reads component, then the layer it paints, then the property, with the variant and state as modifiers on the leaf (figma-standard rule 49).
- Every component token aliases a semantic token; a brand re-points the same name and never adds one.
- The Figma path, the custom property and the selector that reads it can each be derived from the other two.

**How**

An illustrative Button, built to show the whole taxonomy at once: axes `Role=Primary/Outline`, `Feedback=None/Danger`, `State=Rest/Hover/Press/Focus`, layers `Container`, `Label`, `Icon`. Most buttons need none of this tier (see *Three tiers*); the example earns it with a second brand whose primary button differs from its other controls.

```
Figma, 05. Semantic - Brand, group Component/Button     aliases (Light and Dark)
Component/Button/Container/background-primary-rest           Colour/Control/Primary/inverse-rest
Component/Button/Container/background-primary-hover          Colour/Control/Primary/inverse-hover
Component/Button/Container/background-primary-press          Colour/Control/Primary/inverse-press
Component/Button/Container/background-primary-danger-rest    Colour/Control/Feedback/Danger/inverse-rest
Component/Button/Container/background-primary-danger-hover   Colour/Control/Feedback/Danger/inverse-hover
Component/Button/Container/border-outline-rest               Colour/Stroke/Neutral/medium
Component/Button/Container/border-focus                      Colour/State/Focus/stroke-colour-default
Component/Button/Label/text-primary                          Colour/Text/Primary/inverse
Component/Button/Label/text-outline                          Colour/Text/Neutral/strong
Component/Button/Icon/icon-primary                           Colour/Icon/Primary/inverse

Brand C extension, same names, overridden per mode
Component/Button/Container/background-primary-rest   Light → Colour/Background/Primary/inverse
                                                     Dark  → Colour/Background/Primary/inverse
```

- The segments, read left to right: `Button` the component; `Container`, `Label`, `Icon` the layer painted; then the leaf: the property (`background`, `border`, `text`, `icon`), the variant values in axis order (`primary`, `danger`), and the state (`hover`), lowercase and hyphenated like the semantic leaves.
- What the names leave out: a state on `text-primary`, because the label does not change with state; `none`, the default `Feedback`, which is the absence of a modifier; `primary` on `border-focus`, because every role draws the same ring; and the brand, which lives in the extension.
- All of a layer's tokens sort together: every fill the container can take, whatever the role, feedback or state, sits under `Component/Button/Container/`.
- The generated layer is the path in kebab case without the collection (code-standard rule 52), each value a reference (code-standard rule 53):

```css
:root {
  --component-button-container-background-primary-rest: var(--colour-control-primary-inverse-rest);
  --component-button-container-background-primary-hover: var(--colour-control-primary-inverse-hover);
  --component-button-container-background-primary-danger-rest: var(--colour-control-feedback-danger-inverse-rest);
  --component-button-container-border-focus: var(--colour-state-focus-stroke-colour-default);
  --component-button-label-text-primary: var(--colour-text-primary-inverse);
}
[data-brand="brand-c"] {
  --component-button-container-background-primary-rest: var(--colour-background-primary-inverse);
}
```

- The component reads only its own tier, and each selector maps to one variant value and one state:

```css
.button[data-role="primary"] {
  background: var(--component-button-container-background-primary-rest);
  color: var(--component-button-label-text-primary);
}
.button[data-role="primary"]:hover { background: var(--component-button-container-background-primary-hover); }
.button[data-role="primary"][data-feedback="danger"] { background: var(--component-button-container-background-primary-danger-rest); }
.button:focus-visible { outline-color: var(--component-button-container-border-focus); }
```

**Cases**
- A token named `Button/Background/primary` → `Component/Button/Container/background-primary-rest`: the layer before the property, the variant and state after it.
- A variant called `Type=Photo` with a token `Avatar/With image/background` → `Component/Avatar/Container/background-photo`: the variant is a modifier spelt as the file spells it, not a path segment that splits the container's fills into two groups.
- A dot painted differently only in `Status=Current` → `Component/Progress indicator/Dot/background-current`, beside the dot's other fills.
- A brand needs a different primary button → override `Component/Button/Container/background-primary-rest` in that brand's extension; `Component/Button/Brand C/…` would make every component choose between brands.
- A brand override points at a palette step that a semantic token already resolves to in that mode → bind the semantic token; it follows the next re-tune of the brand and the step does not.

**Accessibility**
- Contrast is measured on the pair the component draws, per brand and mode: `text-primary` against `background-primary-rest`, `-hover` and `-press` (WCAG 2.2 1.4.3), and the focus border against the surface around the button (2.4.7, 1.4.11).

**Check**
- *Script:* figma-standard rule 49 is reviewed, not scripted; `tools/css-lint/lint.mjs` could flag a component sheet reading another component's tier.
- *Judgement:* can each token be read back as one layer of the component, with its modifiers naming variant values the file has, and does each brand override name a semantic token?

**Sources:** [Curtis, Naming tokens in design systems](https://nathanacurtis.substack.com/p/naming-tokens-in-design-systems-9e86c7444676) (object, then base, then modifiers last); [Spectrum, taxonomy](https://opensource.adobe.com/spectrum-design-data/spec/taxonomy/) (anatomy, object, property, state last); [SLDS, styling hooks](https://v1.lightningdesignsystem.com/platforms/lightning/styling-hooks). [Material Web, theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md) puts a state before the element (`--md-filled-button-hover-label-text-color`), the counter-example.

## Generated, never hand-written

**What good looks like**
- Token stylesheets come from one build, in every project (code-standard rule 51): what the design file determines is generated (toolkit-standard §D 23).
- The output is committed and the check regenerates it beside the committed copy and diffs (code-standard rule 23).
- A wrong token is fixed in the design file and regenerated, never patched in the output.

**How**
- The pipeline: the design file's snapshot becomes DTCG files in `dtcg/` (one folder per collection, one file per mode), and Style Dictionary writes the stylesheets through `tools/tokens/build.mjs`, which `tools/tokens/build-tokens.mjs` implements. A repo's `bin/tokens` calls it and nothing else; `bin/tokens --check` regenerates beside and diffs.
- Three files come out: `_tokens.scss` (the custom properties), `_breakpoints.scss` (`$sm` … `$xl` and `@mixin from`) and `_text-styles.scss` (`@mixin text-style($name)`).
- A typography token becomes the fields code-standard rule 54 lists, applied with `@include ts.text-style(body-md)`; reading them off the design's text styles is [figma-handoff: text styles to type tokens](figma-handoff.md#text-styles-to-type-tokens).
- The build fails on an alias pointing at nothing, on two paths collapsing into one property name (code-standard rule 52) and on a responsive mode with no breakpoint to switch at.

**Cases**
- A colour is wrong in one theme and someone edits `_tokens.scss` → revert, fix the variable in the design file, regenerate; a hand fix survives until the next export and then vanishes, so the bug comes back.
- A second project wants px type and dark on `:root` → it has nowhere to say so (code-standard rule 55); the build's conventions are the house's, and the project supplies only where files live.
- `Position/-1` and `Position/1` would both become `--effect-position-1` → the build spells the sign `minus-` and refuses any remaining collision (code-standard rule 52).

**Accessibility**
- Lengths in rem follow the reader's font size (code-standard rule 54): WCAG 2.2 1.4.4 Resize Text.

**Check**
- *Script:* `tools/tokens/check.mjs`: the files are the build's (code-standard rule 23), `bin/tokens` calls the build (code-standard rule 51), and a `var()` or `text-style()` that names nothing fails.
- *Judgement:* Did this change touch a generated file by hand?

**Sources:** [Style Dictionary formats](https://styledictionary.com/reference/hooks/formats/); [DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/), which states itself "considered stable". The sources agree.

## References kept

**What good looks like**
- A semantic token in the output is `var(--that-primitive)`, not the primitive's resolved value (code-standard rule 53).
- A mode re-points one tier; every alias follows.

**How**
- DTCG writes an alias as `{group.token}`, which "always resolves to the `$value` property of the target token", and tools keep references until a value is needed ([DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/)).
- Style Dictionary's `outputReferences: true` writes `--color-danger: var(--color-red);` instead of the hex, "useful for outputting themeable and dynamic code" ([Style Dictionary formats](https://styledictionary.com/reference/hooks/formats/)). The token build sets it.
- Caveats from the same page: a reference to a filtered-out token, or a transitively transformed one, cannot be kept; the build resolves those, and they are the places a mode will not follow.

```css
:root { --blue-9: oklch(0.55 0.18 257); --colour-action: var(--blue-9); }
[data-theme="dark"] { --blue-9: oklch(0.70 0.15 257); }
```

**Cases**
- An export flattens aliases to values → the semantic tier is gone silently: dark mode must restate every semantic token, and a primitive change no longer reaches them. Keep references.
- A token reads `var(--nothing)` after a rename → it fails silently ([css-architecture: custom properties](css-architecture.md#custom-properties) says how); the token build fails on the dangling alias, and `tools/tokens/check.mjs` catches a hand-written one.

**Accessibility**
- No criterion bears directly; a flattened alias that misses a theme can leave one pair below contrast in one mode (WCAG 2.2 1.4.3).

**Check**
- *Script:* `tools/tokens/check.mjs` proves the files are the build's, which writes references.
- *Judgement:* If one primitive changed, would every token meant to follow it follow?

**Sources:** DTCG and Style Dictionary as linked. The sources agree.

## Custom properties or Sass variables

**What good looks like**
- Every design token is a custom property.
- Build-time inputs (breakpoint widths, a mixin's configuration, maths inputs) are Sass variables.
- The values that change at a breakpoint are custom properties re-pointed inside one breakpoint block.

**How**
- One question decides it: **does the value need to change after the stylesheet is compiled?** Theme, breakpoint, container, state or script: custom property. Build time only: Sass variable.
- Breakpoints go wrong in both directions. `@media (min-width: var(--bp-md))` **does not work**, because custom properties are not allowed in media conditions, so breakpoints are Sass variables (code-standard rule 54). The values that change *at* a breakpoint are custom properties, so the block re-points a token rather than restating a rule:

```scss
:root { --gap: 1rem; }
@include bp.from(bp.$md) { :root { --gap: 2rem; } } // one place, everything follows
```

**Cases**
- A theme colour stored as `$brand` → a custom property; a Sass variable cannot change with `data-theme` and cannot be read by script.
- A breakpoint stored as `--bp-md` and used in `@media` → the query is invalid and never matches; use `bp.$md`.
- Five components each restate their padding at `md` → re-point one spacing token at `md`; the components follow.

**Accessibility**
- Breakpoints in rem follow zoom and text size: WCAG 2.2 1.4.10 Reflow, 1.4.4 Resize Text. Breakpoint strategy is [responsive.md](responsive.md)'s.

**Check**
- *Script:* could flag `var()` inside a media condition and a Sass variable holding a colour.
- *Judgement:* Does this value ever need to differ on the same compiled page?

**Sources:** [MDN, Using custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties); [Sass `@use`](https://sass-lang.com/documentation/at-rules/use/). The sources agree.

## Themes and modes

**What good looks like**
- Themes and modes switch the way code-standard rule 53 sets, written by the build; no component sheet carries a theme of its own.
- Native controls, scrollbars and the canvas follow the theme (code-standard rule 16).
- The page never paints in the wrong theme first.

**How**
- **The pattern** is code-standard rule 53's, and the build writes it; nothing here restates it. A component reads `var(--surface)` and the mode re-points it.
- **`prefers-color-scheme`** reports the system setting; `light` also covers "has not expressed an active preference" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)).
- **`color-scheme: light dark`** on `:root` changes the canvas, scrollbars, form controls and other browser UI ([MDN `color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)); an explicit theme sets `color-scheme: dark` (or `light`) beside its tokens. MDN also advises `<meta name="color-scheme" content="light dark">` before any CSS "helping prevent unwanted screen flashes".
- **No flash.** A stored choice is applied to `<html>` by a small blocking script in `<head>`, so the attribute is set "before the main CSS paints the page" ([web.dev, theme switch](https://web.dev/articles/building/a-theme-switch-component)). A deferred module paints the wrong theme first.
- **`light-dark()`** (Baseline 2024) takes two colours or two images and depends on `color-scheme` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)). It is not the mechanism: it cannot carry a themed shadow, length or gradient stop list, and a component that calls it mentions a theme, which code-standard rule 53's *why* refuses. It belongs only where a project has no token build at all.

**Cases**
- Dark mode works but the date input and scrollbars stay white → add `color-scheme` beside the dark tokens (code-standard rule 16).
- A project is dark-first → the build still writes Light on `:root`; the two orders resolve identically in every state a browser can be in, and one order was kept.
- A freshness colour (green, amber, grey) changes meaning in dark mode → status colours that are product, not theme, still get a value per mode but keep their hue role; the theme swap re-points lightness, never meaning.
- A theme toggle stores its choice and the page flashes light on load → move the read into an inline script in `<head>` and add the `color-scheme` meta.

**Accessibility**
- Each mode meets contrast on its own: WCAG 2.2 1.4.3, 1.4.11. code-standard rule 16. Honouring the system scheme is part of *for everyone, in any context*.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *native controls follow the theme* (a dark tier comes with `color-scheme`, generated tokens included); `tools/tokens/check.mjs` proves the theme files are the build's. Parity runs each scheme a project ships (code-standard rule 35).
- *Judgement:* Does any component sheet mention a theme?

**Sources:** MDN and web.dev as linked. Sources differ on `light-dark()` as the primary mechanism; the toolkit keeps token re-pointing because one mechanism covers colours, shadows and lengths alike.

## What not to tokenise

**What good looks like**
- A token exists because a value is reused, themed or shared with the design file.
- A value used once, in one place, stays a literal with its reason.

**How**
- Do not tokenise: a value used once, the width of one illustration, `0`, `100%`, `1fr`, `auto`, or a keyword.
- The cost of a token is that a reader must jump to find its value; reuse and theming repay that, nothing else does.
- Where the design binds a value, use its token even if it appears once: the binding is the shared vocabulary (code-standard rule 22 *literal is a token*).

**Cases**
- `--hero-illustration-width: 37rem` used by one rule → a literal with its reason.
- `--zero: 0` → delete; `0` has no unit to vary and no theme.
- A max height the design never draws → a literal with a comment saying the design has no value for it (code-standard rule 22).

**Accessibility**
- No criterion bears directly.

**Check**
- *Script:* could flag a custom property read exactly once in the codebase that the design file does not define.
- *Judgement:* Would anyone ever change this value without changing the rule that uses it?

**Sources:** commentary from the toolkit's practice; no primary source sets a threshold.

## Literals with reasons

**What good looks like**
- code-standard rule 22 holds for every number in a component sheet; the comment names the constraint, not the value.
- A literal that equals a token of the family the design binds is the token.
- No literal fits only today's content (code-standard rule 57).

**How**
- The comment names the constraint: "line-height kept on the text style, not a variable", "design draws no maximum", "mobile step-down not specified". It is how a future token replaces the literal (code-standard rule 27 for comments).
- A size that depends on content is derived from it, never a literal with a reason ([responsive: intrinsic layout first](responsive.md#intrinsic-layout-first)).

**Cases**
- `padding: 12px` where the scale has `--space-3: 0.75rem` → the token; the gate reads it off the stored specs.
- `max-height: 32rem` on a drawer the design never caps → keep it, with "design draws no maximum" beside it.

**Accessibility**
- Content-sized widths survive text resizing and translation: WCAG 2.2 1.4.4, 1.4.12 Text Spacing.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *literal reason* and *literal is a token* (code-standard rule 22).
- *Judgement:* Name the input that would break this number. If there is one, derive it.

**Sources:** code-standard rule 22's evidence; no external source.

## The disabled opacity, once

**What good looks like**
- One disabled opacity, from the design's state token, on the component's root (code-standard rule 62).
- A component holding other components dims once.
- No differing literals (`0.4`, `.5`, `0.45`) across components.

**How**
- Apply it on the host, matched from the control's own state, and give parents a knob:

```css
ds-button:has(> :disabled) { opacity: var(--dim, var(--state-disabled-opacity)); }
ds-card[disabled] > * { --dim: 1; }
```

- The browser may already dim a disabled native control; a host dim on top composites twice. Neutralise the user-agent dim in the base layer once (code-standard rule 48) so the token is the only dim.

**Cases**
- Three components dim disabled at `0.4`, `0.5` and `.45` → one token; differing literals are three guesses at one design value.
- A disabled select renders at 0.35 where the design says 0.5 → the browser's own dim multiplied the token; reset the user-agent dim once in the base layer.
- A disabled group over disabled rows draws at a quarter → the group sets `--dim: 1` on its children (code-standard rule 62).
- A completed row is dimmed with opacity → not disabled, so not exempt from contrast; signal it another way (the opacity candidate in [candidates.md](candidates.md)).

**Accessibility**
- WCAG 2.2 1.4.3 exempts "text or images of text that are part of an inactive user interface component" ([Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)); the exemption is why dimming disabled is safe and dimming anything else is not. code-standard rules 9 and 62.

**Check**
- *Script:* parity's opacity row on the root (code-standard rule 62's check); `tools/css-lint/lint.mjs` *literal is a token* for a typed opacity.
- *Judgement:* Is anything dimmed that is not disabled?

**Sources:** [Understanding WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); code-standard rule 62's evidence.

## Motion tokens

**What good looks like**
- Durations and easings are tokens from the design file, read by every transition and animation.
- Reduced motion replaces movement with something calmer; it does not just delete feedback.

**How**
- DTCG has a `duration` type (`unit` "may only be `ms` or `s`") and a `cubicBezier` type of four numbers whose x values are in [0, 1] ([DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/)). They become custom properties like any token: `transition: opacity var(--duration-short) var(--easing-standard)`.
- `prefers-reduced-motion: reduce` says the reader "prefers an interface that removes, reduces, or replaces motion-based animations"; MDN's example swaps a scaling animation for a fade ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)). Keep fades and colour changes that carry state; remove travel, scale and parallax.
- The base block that enforces the preference, and the one `!important` it is allowed, are [accessibility: reduced motion and colour scheme in code](accessibility.md#reduced-motion-and-colour-scheme-in-code).
- To animate a custom property itself, register it with `@property` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)).

**Cases**
- A drawer slides in over 300ms with a literal easing → read the duration and easing tokens; the next motion change is one edit.
- Reduced motion sets every duration to `0` → a script waiting for `transitionend` may never hear it; the base block's near-zero duration keeps the event firing.

**Accessibility**
- WCAG 2.2 2.3.3 Animation from Interactions (AAA): "motion animation triggered by interaction can be disabled, unless the animation is essential" ([Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)); 2.2.2 Pause, Stop, Hide. The design side is [accessibility: motion and vestibular safety](../ui/design/accessibility.md#motion-and-vestibular-safety).

**Check**
- *Script:* `tools/css-lint/lint.mjs` *`!important`* allows it only inside a reduced-motion block; could flag a `transition` or `animation` with a literal duration.
- *Judgement:* With reduced motion on, does every state change still show?

**Sources:** DTCG and MDN as linked. Honouring reduced motion globally is a candidate in [candidates.md](candidates.md), not yet a rule.

## Density

**What good looks like**
- Density is a mode: one attribute re-points spacing and control-height tokens; components do not change.
- Type size does not change with density.
- Compact never takes a target under the minimum size.

**How**
- A density collection in the design file writes like any other mode, `[data-density="compact"]` (code-standard rule 53), re-pointing the spacing and sizing semantics:

```css
:root { --control-height: 2.5rem; --row-gap: var(--space-3); }
[data-density="compact"] { --control-height: 2rem; --row-gap: var(--space-2); }
```

- Systems differ on the default: React Spectrum picks its medium or large scale "according to the device type (e.g. touch vs mouse input)" ([React Spectrum Provider](https://react-spectrum.adobe.com/react-spectrum/Provider.html)), which CSS can read as `@media (pointer: coarse)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer)). The toolkit sets density by attribute only, so there is one mechanism; a project that wants a touch default records it as a ruling.
- Where density applies, and where it never should, is [visual: density modes](../ui/design/visual.md#density-modes).

**Cases**
- A dense data table and a roomy form share components → the table's container sets `data-density="compact"`; the same components follow the tokens.
- Compact shrinks icon buttons to 20px → keep the hit area at 24px or more with padding or spacing; density changes the look, not the target.
- A component hard-codes its compact height under its own attribute → move it to a token the density mode re-points; otherwise each component carries its own copy of the mode.

**Accessibility**
- WCAG 2.2 2.5.8 Target Size (Minimum): "at least 24 by 24 CSS pixels", or spaced so the 24px circles do not intersect ([Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)). 1.4.12 Text Spacing.

**Check**
- *Script:* tools/parity/pages.mjs could measure target sizes in each density mode; could flag a component rule keyed on a density attribute.
- *Judgement:* Does compact remove space, or remove something a reader needs?

**Sources:** React Spectrum and MDN as linked; WCAG 2.2. Sources differ on whether density follows the pointer; the toolkit keeps it an explicit mode.
