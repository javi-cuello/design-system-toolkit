# Tokens and theming in code

How design tokens reach a stylesheet and how themes and modes switch them: the three tiers, component token names worked through, a generated token layer that keeps its references, custom properties against Sass variables, themes and modes, what not to tokenise, literals with reasons, the disabled opacity, motion tokens, spacing tokens and density. It serves code-standard rules 22, 23 and 51–54 and code-standard rule 62, and the design-standard principles *consistent, not uniform* (one value, one name, in both tools) and *for everyone, in any context* (the reader's scheme and font size are honoured). The design side of the same decisions is [visual: theming and dark mode](../ui/design/visual.md#theming-and-dark-mode), [density modes](../ui/design/visual.md#density-modes) and [motion](../ui/design/visual.md#motion); reading a design file into code is [figma-handoff.md](figma-handoff.md)'s; how layers and custom properties behave in general is [css-architecture.md](css-architecture.md)'s. How shipping systems name their tokens, slot by slot, and which naming choices lasted is [token-taxonomy.md](token-taxonomy.md)'s.

## Three tiers

**What good looks like**
- [strong] **A value is named once and a use is named once:** shipping systems keep two tiers (Fluent, GOV.UK), three (Primer, Spectrum, Material) or four (Ant Design), and all separate a value from a use; shadcn/ui, writing values into its semantic variables, is the exception ([Ant Design, customize theme](https://ant.design/docs/react/customize-theme); [Spectrum, design tokens](https://spectrum.adobe.com/page/design-tokens/); [Material Web theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md); [shadcn/ui theming](https://ui.shadcn.com/docs/theming)).
- [moderate] **Components consume semantic tokens only.** A primitive in a component stylesheet is the defect: it is how a system ends up with fourteen greys and no way to theme any of them.
- [moderate] A component tier exists only where a component exposes a knob a caller or a variant re-points; the override itself is a custom property (code-standard rule 38). The systems that ship the tier tie it to restyling from outside the component: Fluent's proposed control tokens for changes that must not affect related components ([Fluent extended tokens RFC](https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/rfcs/react-components/convergence/extended-design-tokens.md)), Ant Design's so one component changes without the others ([Ant Design, customize theme](https://ant.design/docs/react/customize-theme)).
- [moderate] The tier's cost is volume: Spectrum, which shipped it widely, is cutting it, and Fluent declined a full one: spectrum-tokens 14.3.0 (2026-03-25) deprecated 540 component-specific spacing tokens for about 100 semantic ones, citing excessive token volume ([spectrum-tokens changelog](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/CHANGELOG.md)); Fluent rejected adding every component's tokens to the theme as tens of thousands of CSS variables, while noting it never measured the cost ([Fluent theme tokens RFC](https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/rfcs/react-components/convergence/theme-tokens.md)); Material Web ships about 5,259 component declarations against 807 system ones (counted in [`tokens/versions/latest`](https://github.com/material-components/material-web/tree/main/tokens/versions/latest/sass), 2026-11-18).
- [moderate] A use only one component has is a semantic token named for it, not a component tier: Atlassian ships no component tier yet has `color.skeleton` and `color.blanket` ([`@atlaskit/tokens` 20.14.0 token names](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/dist/es2019/artifacts/token-names.js)); Polaris names `--p-color-input-bg-surface` inside its one semantic set ([Polaris v11 to v12 migration](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)).
- [required] Every token is named by its design-file path (code-standard rule 52), so a designer and an engineer search for the same word.

**How**

```
primitive   --blue-500: oklch(…);                       a value; names nothing about use
semantic    --colour-text-link: var(--blue-500);        a decision; names the use
component   --button-bg: var(--colour-action-primary);  a knob
```

- [contested] **Whether the colour palette is hidden from product code.** Polaris v11 made its palette private after an audit found 22 different greys ([Polaris v11 colour](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-11-color.mdx)); Primer 8.0.0 ships no base-colour CSS ([8.0.0 light theme](https://cdn.jsdelivr.net/npm/@primer/primitives@8.0.0/dist/css/functional/themes/light.css)); Atlassian's public set has 447 `color.*` names and no palette steps ([`@atlaskit/tokens` 20.14.0 token names](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/dist/es2019/artifacts/token-names.js)). Carbon (`@carbon/colors`, [README](https://cdn.jsdelivr.net/npm/@carbon/colors/README.md)), Radix (`--blue-9`, [Radix Themes colour](https://www.radix-ui.com/themes/docs/theme/color)) and GOV.UK (`govuk-colour()`, kept in v6 beside new functional-colour custom properties, [v6.0.0 release](https://github.com/alphagov/govuk-frontend/releases/tag/v6.0.0)) keep theirs public. Polaris v12 leaves its space primitives usable anywhere ([Polaris v12](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-12.mdx)); spacing is in [Spacing tokens](#spacing-tokens).
- [strong] **A semantic name says the job.** Primer v8 put the property in every functional token so it is clear where it is used ([v8 migration guide](https://github.com/primer/primitives/blob/main/docs/storybook/stories/Migration/v8/Guide.mdx)); Carbon v11 renamed numbered tokens for their usage (`ui-01` → `layer-01`, where the number now counts nesting depth; `text-01` → `text-primary`) ([Carbon v11 migration](https://github.com/carbon-design-system/carbon/blob/main/docs/migration/v11.md)); Polaris v12 regrouped `bg` by job into `bg-surface` and `bg-fill` ([v12 colour codemod](https://github.com/Shopify/polaris/blob/main/polaris-migrator/src/migrations/v12-styles-replace-custom-property-color/transform.ts)). Three systems with no shared lineage moved the same way.
- [moderate] A token that does two jobs is split: Primer v8 split `color-accent-emphasis` into `bgColor-accent-emphasis` and `borderColor-accent-emphasis` ([v8 token map](https://github.com/primer/primitives/blob/main/docs/storybook/stories/Migration/v8/DeprecatedPrimitiveTokensMap.json)); Carbon v11 split `hover-ui` into `background-hover`, `layer-hover-01` and `field-hover-01` ([Carbon v11 migration](https://github.com/carbon-design-system/carbon/blob/main/docs/migration/v11.md)).
- [moderate] Semantic segments read property, role, emphasis, state: Atlassian `color.background.brand.bold.hovered` ([Atlassian, design tokens](https://atlassian.design/foundations/tokens/design-tokens)), Polaris `--p-color-bg-fill-brand-hover` ([Polaris colour tokens](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/design/colors/color-tokens.mdx)), Primer `bgColor-accent-emphasis` ([Primer, token names](https://primer.style/product/primitives/token-names/)). Ant Design (`colorPrimaryBgHover`) and Material (`on-primary-container`) put the role first, which suits a palette generated from one seed; TDesign mixes both orders ([TDesign light theme](https://github.com/Tencent/tdesign-common/blob/develop/style/web/theme/_light.less)).
- [moderate] A token family that is not a use (chart series, fixed white and black, identity fills) is named for its job in a group of its own: Atlassian `color.chart.*` (100 tokens, [token names](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/dist/es2019/artifacts/token-names.js)), Primer's [`data-vis` functional file](https://github.com/primer/primitives/blob/main/src/tokens/functional/color/data-vis.json5), shadcn/ui `--chart-1`…`--chart-5` ([shadcn/ui theming](https://ui.shadcn.com/docs/theming)) and Polaris `--p-color-avatar-one-bg-fill` ([v11 to v12 migration](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)).
- [required] A token name holds no `.`, `{` or `}` and does not start with `$` ([DTCG Format Module 2025.10 §5.1.1](https://www.designtokens.org/tr/2025.10/format/); Figma bans the same three, [variables REST API](https://developers.figma.com/docs/rest-api/variables-endpoints/)).
- [strong] Two names never differ by case alone: CSS and DTCG keep them apart, but a kebab or camel transform merges them ([Tokens Studio, token names](https://docs.tokens.studio/manage-tokens/token-names)).
- [moderate] Primer's three tiers match the sketch above: base tokens "map directly to a raw value", functional tokens "represent global UI patterns", and component tokens "should only be used in component CSS" ([Primer, token names](https://primer.style/product/primitives/token-names/)).
- [required] The component tier is an indirection point: `--button-bg` lets a variant re-point one property without a new selector (code-standard rule 38); it is added when a component needs a knob, not because the tier exists.
- [moderate] **Fixed colours are named apart from the themed ones.** Spectrum's palette keeps `white`, `black`, `transparent-black-*`, `transparent-white-*` and a few `static-*` hue steps with one value, in the same file as hue steps that carry a value per theme ([spectrum-tokens 13.0.0 `color-palette.json`](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens@13.0.0/src/color-palette.json)); Radix ships `black-a` and `white-a`, identical in light and dark, as files of their own beside its themed scales ([Radix Colors](https://cdn.jsdelivr.net/npm/@radix-ui/colors@3.0.0/black-alpha.css)). Primer has no fixed tier: every primitive collection in its Figma export has one mode, one collection per theme (`base/color/light`, `base/color/dark`), and only the semantic `mode` collection switches ([Primer `dist/figma/figma.json`](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/figma/figma.json)). Spectrum mixes fixed and themed values in one set; Radix separates them; Primer has none.
- [moderate] **White and black do not flip.** Spectrum's `white` and `black` are fixed; Primer's `base/color/black` is a dark ink in both themes (`#1f2328` in [light](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/figma/scales/light.json), `#010409` in [dark](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/figma/scales/dark.json)) and its `fgColor-onEmphasis` is `#ffffff` in both ([`light.css`](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/light.css), [`dark.css`](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/dark.css)). A colour that inverts with the mode is a semantic role (an `inverse`).
- [weak] Where the design file hides primitives from publishing, a component physically cannot bind one there; the code holds the same line by convention and by review.
- [weak] Hiding has a price outside the library: `hiddenFromPublishing` is absolute, so a hidden variable cannot be imported by key from any consuming file, and a file outside the source (a separate documentation file above all) can only reproduce those values as static copies, refreshed by regeneration. A project that documents outside its library decides this deliberately. One documentation run into a separate file reached a hidden tier only partly through published aliases (61 of 106) and fell back to static fills for the whole page (toolkit run, figma-standard rule 24).
- [required] A component token reads component, then the layer it paints, then the property, with the variant and state last ([worked through below](#component-token-names-worked-through), figma-standard rule 49). The custom property is that path (code-standard rule 52): `Component/Avatar/Container/background-photo` is `--component-avatar-container-background-photo`. A brand is not a segment; it re-points the same name.

**Cases**
- A button's sheet reads `var(--palette-blue-9)` → re-point it to the semantic token the design binds; the primitive will not follow a theme or a brand change.
- A chart needs seven series colours the semantic tier has no slot for → a project may rule that a data-visualisation collection is bound directly; it is a stated exception in its context document, not a precedent.
- A variant needs a different background → set `--button-bg` under the variant's attribute; no second rule at the component's selector.
- A token reads `--progress-background-bar` → `--component-progress-bar-background`: the layer comes before the property, so every token that paints the bar sorts together.

**Accessibility**
- [required] Contrast is decided once, at the semantic pairing, and inherited by every component that uses the pair: WCAG 2.2 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *literal is a token* (code-standard rules 22 and 46) catches a literal equal to a token; could flag a primitive-tier `var()` in a component sheet.
- *Judgement:* Does each `var()` in a component name a use or a value?

**Sources:** [Primer, token names](https://primer.style/product/primitives/token-names/); [DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/) (defines references and groups, no tiers); the systems cited above, opened 2026-11-18. Shipping systems keep two tiers (Fluent, GOV.UK), three (Primer, Spectrum, Material) or four (Ant Design's seed, map, alias and component); all but shadcn/ui separate a named value from a named use. The component tier as a knob is code-standard rule 38. How shipping systems name the slots inside each tier is [token-taxonomy.md](token-taxonomy.md)'s.

## Component token names, worked through

**What good looks like**
- [required] A component token reads component, then the layer it paints, then the property, with the variant and state as modifiers on the leaf (figma-standard rule 49).
- [moderate] Shipping component tokens mix aliases and literals: Primer 11.10.0 has `--button-primary-bgColor-rest: var(--bgColor-success-emphasis)` beside `--button-primary-bgColor-hover: #1c8139` ([light theme](https://cdn.jsdelivr.net/npm/@primer/primitives@11.10.0/dist/css/functional/themes/light.css)); Material's filled button aliases `md-sys-color.$primary` for its colour and sets `$container-height: 40px` ([source](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/latest/sass/_md-comp-filled-button.scss)); 307 of Spectrum's 790 live component tokens hold literal pixels, such as `accordion-minimum-width: 200px` ([spectrum-tokens `accordion.json`](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/src/accordion.json), counted 2026-11-18). figma-standard rule 49 departs: every component token aliases a semantic token, so a theme or brand reaches it.
- [weak] A brand re-points the same name and never adds one. In Figma the mechanism enforces it: an extended collection can override values only, and cannot add variables or modes ([Figma, extended collections](https://help.figma.com/hc/en-us/articles/36346281624471)).
- [weak] The Figma path, the custom property and the selector that reads it can each be derived from the other two (beyond code-standard rule 52).

**How**

An illustrative Button, built to show the whole taxonomy at once: axes `Appearance=Primary/Outline`, `Feedback=None/Danger`, `State=Rest/Hover/Press/Focus`, layers `Container`, `Label`, `Icon`. Most buttons need none of this tier (see *Three tiers*); the example earns it with a second brand whose primary button differs from its other controls.

```
Figma, 05. Semantic - Brand, group Component/Button     aliases (Light and Dark)
Component/Button/Container/background-primary-rest           Colour/Control/Brand/emphasis-rest
Component/Button/Container/background-primary-hover          Colour/Control/Brand/emphasis-hover
Component/Button/Container/background-primary-press          Colour/Control/Brand/emphasis-press
Component/Button/Container/background-primary-danger-rest    Colour/Control/Danger/emphasis-rest
Component/Button/Container/background-primary-danger-hover   Colour/Control/Danger/emphasis-hover
Component/Button/Container/border-outline-rest               Colour/Border/Neutral/default
Component/Button/Container/border-focus                      Colour/Focus/Brand/default
Component/Button/Label/text-primary                          Colour/Text/Brand/on-emphasis
Component/Button/Label/text-outline                          Colour/Text/Neutral/default
Component/Button/Icon/icon-primary                           Colour/Icon/Brand/on-emphasis

Brand C extension, same names, overridden per mode
Component/Button/Container/background-primary-rest   Light → Colour/Background/Brand/emphasis
                                                     Dark  → Colour/Background/Brand/emphasis
```

- [moderate] Shipping component tokens put the variant right after the component and the state last: Fluent's written order is component, variant, part, property, modifier ([Fluent extended tokens RFC](https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/rfcs/react-components/convergence/extended-design-tokens.md)); Primer writes `button-primary-bgColor-hover`; SLDS `--slds-c-button-brand-color-background-hover` ([styling hooks table](https://raw.githubusercontent.com/salesforce-ux/design-system/main/shared/components/StylingHooksTable.jsx)); Material Web folds the variant into the component name and alone moves the state before the part ([Material Web theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)). figma-standard rule 49 departs: it puts the variant on the leaf, so all of a layer's tokens sort together. Moderate, not strong: Fluent's order is an RFC and SLDS's hooks are unsupported in its newer UI.
- [strong] The segments, read left to right: `Button` the component; `Container`, `Label`, `Icon` the layer painted; then the leaf: the property (`background`, `border`, `text`, `icon`), the variant values in axis order (`primary`, `danger`), and the state (`hover`), lowercase and hyphenated like the semantic leaves.
- [weak] What the names leave out: a state on `text-primary`, because the label does not change with state; `none`, the default `Feedback`, which is the absence of a modifier; `primary` on `border-focus`, because every role draws the same ring; and the brand, which lives in the extension.
- [moderate] All of a layer's tokens sort together: every fill the container can take, whatever the role, feedback or state, sits under `Component/Button/Container/`.
- [required] The generated layer is the path in kebab case without the collection (code-standard rule 52), each value a reference (code-standard rule 53):

```css
:root {
  --component-button-container-background-primary-rest: var(--colour-control-brand-emphasis-rest);
  --component-button-container-background-primary-hover: var(--colour-control-brand-emphasis-hover);
  --component-button-container-background-primary-danger-rest: var(--colour-control-danger-emphasis-rest);
  --component-button-container-border-focus: var(--colour-focus-brand-default);
  --component-button-label-text-primary: var(--colour-text-brand-on-emphasis);
}
[data-brand="brand-c"] {
  --component-button-container-background-primary-rest: var(--colour-background-brand-emphasis);
}
```

- [weak] The component reads only its own tier, and each selector maps to one variant value and one state:

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
- One element, painted the same everywhere → `Component/Sidebar/Indicator/background`, with no modifier.
- A layer only one variant has → `Component/Avatar/Icon/icon`: the layer names it, so the variant adds nothing.
- A state alone → `Component/Tabs/Indicator/background-hover`.
- A nested part → its last word as the element (figma-standard rule 9): `Component/Date picker/Day/background-selected`.
- Gradient stops → `Component/Chat layer/Container/background-start` and `…/background-end`.
- Sizing shared by a family, in a collection that holds only component tokens → `Input/Field/width-default`, the `Component/` prefix dropped.

**Accessibility**
- [required] Contrast is measured on the pair the component draws, per brand and mode: `text-primary` against `background-primary-rest`, `-hover` and `-press` (WCAG 2.2 1.4.3), and the focus border against the surface around the button (2.4.7, 1.4.11).

**Check**
- *Script:* figma-standard rule 49 is reviewed, not scripted; `tools/css-lint/lint.mjs` could flag a component sheet reading another component's tier.
- *Judgement:* can each token be read back as one layer of the component, with its modifiers naming variant values the file has, and does each brand override name a semantic token?

**Sources:** [Curtis, Naming tokens in design systems](https://nathanacurtis.substack.com/p/naming-tokens-in-design-systems-9e86c7444676) (object, then base, then modifiers last); [Spectrum, taxonomy](https://opensource.adobe.com/spectrum-design-data/spec/taxonomy/) (anatomy, object, property, state last); [SLDS, styling hooks](https://v1.lightningdesignsystem.com/platforms/lightning/styling-hooks). [Material Web, theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md) puts a state before the element (`--md-filled-button-hover-label-text-color`), the counter-example.

## Generated, never hand-written

**What good looks like**
- [required] Token stylesheets come from one build, in every project (code-standard rule 51): what the design file determines is generated (toolkit-standard §D 23).
- [required] The output is committed and the check regenerates it beside the committed copy and diffs (code-standard rule 23).
- [required] A wrong token is fixed in the design file and regenerated, never patched in the output (code-standard rule 23).

**How**
- [weak] The pipeline: the design file's snapshot becomes DTCG files in `dtcg/` (one folder per collection, one file per mode), and Style Dictionary writes the stylesheets through `tools/tokens/build.mjs`, which `tools/tokens/build-tokens.mjs` implements. A repo's `bin/tokens` calls it and nothing else; `bin/tokens --check` regenerates beside and diffs.
- [weak] Three files come out: `_tokens.scss` (the custom properties), `_breakpoints.scss` (`$sm` … `$xl` and `@mixin from`) and `_text-styles.scss` (`@mixin text-style($name)`).
- [required] A typography token becomes the fields code-standard rule 54 lists, applied with `@include ts.text-style(body-md)`; reading them off the design's text styles is [figma-handoff: text styles to type tokens](figma-handoff.md#text-styles-to-type-tokens).
- [required] The build fails on an alias pointing at nothing, on two paths collapsing into one property name (code-standard rule 52) and on a responsive mode with no breakpoint to switch at.

**Cases**
- A colour is wrong in one theme and someone edits `_tokens.scss` → revert, fix the variable in the design file, regenerate; a hand fix survives until the next export and then vanishes, so the bug comes back.
- A second project wants px type and dark on `:root` → it has nowhere to say so (code-standard rule 55); the build's conventions are the house's, and the project supplies only where files live.
- `Position/-1` and `Position/1` would both become `--effect-position-1` → the build spells the sign `minus-` and refuses any remaining collision (code-standard rule 52).

**Accessibility**
- [required] Lengths in rem follow the reader's font size (code-standard rule 54): WCAG 2.2 1.4.4 Resize Text.

**Check**
- *Script:* `tools/tokens/check.mjs`: the files are the build's (code-standard rule 23), `bin/tokens` calls the build (code-standard rule 51), and a `var()` or `text-style()` that names nothing fails.
- *Judgement:* Did this change touch a generated file by hand?

**Sources:** [Style Dictionary formats](https://styledictionary.com/reference/hooks/formats/); [DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/), which states itself "considered stable". The sources agree.

## References kept

**What good looks like**
- [required] A semantic token in the output is `var(--that-primitive)`, not the primitive's resolved value (code-standard rule 53).
- [required] A mode re-points one tier; every alias follows (code-standard rule 53).

**How**
- [required] DTCG writes an alias as `{group.token}`, which "always resolves to the `$value` property of the target token", and tools keep references until a value is needed ([DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/)).
- [weak] Style Dictionary's `outputReferences: true` writes `--color-danger: var(--color-red);` instead of the hex, "useful for outputting themeable and dynamic code" ([Style Dictionary formats](https://styledictionary.com/reference/hooks/formats/)). The token build sets it.
- [weak] Caveats from the same page: a reference to a filtered-out token, or a transitively transformed one, cannot be kept; the build resolves those, and they are the places a mode will not follow.

```css
:root { --blue-9: oklch(0.55 0.18 257); --colour-action: var(--blue-9); }
[data-theme="dark"] { --blue-9: oklch(0.70 0.15 257); }
```

**Cases**
- An export flattens aliases to values → the semantic tier is gone silently: dark mode must restate every semantic token, and a primitive change no longer reaches them. Keep references.
- A token reads `var(--nothing)` after a rename → it fails silently ([css-architecture: custom properties](css-architecture.md#custom-properties) says how); the token build fails on the dangling alias, and `tools/tokens/check.mjs` catches a hand-written one.

**Accessibility**
- [required] No criterion bears directly; a flattened alias that misses a theme can leave one pair below contrast in one mode (WCAG 2.2 1.4.3).

**Check**
- *Script:* `tools/tokens/check.mjs` proves the files are the build's, which writes references.
- *Judgement:* If one primitive changed, would every token meant to follow it follow?

**Sources:** DTCG and Style Dictionary as linked. The sources agree.

## Custom properties or Sass variables

**What good looks like**
- [required] Every design token is a custom property (code-standard rule 52).
- [required] Build-time inputs (breakpoint widths, a mixin's configuration, maths inputs) are Sass variables (code-standard rule 54).
- [moderate] The values that change at a breakpoint are custom properties re-pointed inside one breakpoint block.

**How**
- [moderate] One question decides it: **does the value need to change after the stylesheet is compiled?** Theme, breakpoint, container, state or script: custom property. Build time only: Sass variable.
- [required] Breakpoints go wrong in both directions. `@media (min-width: var(--bp-md))` **does not work**, because custom properties are not allowed in media conditions, so breakpoints are Sass variables (code-standard rule 54). The values that change *at* a breakpoint are custom properties, so the block re-points a token rather than restating a rule:

```scss
:root { --gap: 1rem; }
@include bp.from(bp.$md) { :root { --gap: 2rem; } } // one place, everything follows
```

**Cases**
- A theme colour stored as `$brand` → a custom property; a Sass variable cannot change with `data-theme` and cannot be read by script.
- A breakpoint stored as `--bp-md` and used in `@media` → the query is invalid and never matches; use `bp.$md`.
- Five components each restate their padding at `md` → re-point one spacing token at `md`; the components follow.

**Accessibility**
- [required] Breakpoints in rem follow zoom and text size: WCAG 2.2 1.4.10 Reflow, 1.4.4 Resize Text. Breakpoint strategy is [responsive.md](responsive.md)'s.

**Check**
- *Script:* could flag `var()` inside a media condition and a Sass variable holding a colour.
- *Judgement:* Does this value ever need to differ on the same compiled page?

**Sources:** [MDN, Using custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties); [Sass `@use`](https://sass-lang.com/documentation/at-rules/use/). The sources agree.

## Themes and modes

**What good looks like**
- [required] Themes and modes switch the way code-standard rule 53 sets, written by the build; no component sheet carries a theme of its own.
- [required] Native controls, scrollbars and the canvas follow the theme (code-standard rule 16).
- [moderate] The page never paints in the wrong theme first.

**How**
- [required] **The pattern** is code-standard rule 53's, and the build writes it; nothing here restates it. A component reads `var(--surface)` and the mode re-points it.
- [required] **`prefers-color-scheme`** reports the system setting; `light` also covers "has not expressed an active preference" ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)).
- [required] **`color-scheme: light dark`** on `:root` changes the canvas, scrollbars, form controls and other browser UI ([MDN `color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)); an explicit theme sets `color-scheme: dark` (or `light`) beside its tokens. MDN also advises `<meta name="color-scheme" content="light dark">` before any CSS "helping prevent unwanted screen flashes".
- [moderate] **No flash.** A stored choice is applied to `<html>` by a small blocking script in `<head>`, so the attribute is set "before the main CSS paints the page" ([web.dev, theme switch](https://web.dev/articles/building/a-theme-switch-component)). A deferred module paints the wrong theme first.
- [contested] **`light-dark()`** (Baseline 2024) takes two colours or two images and depends on `color-scheme` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)). It is not the mechanism: it cannot carry a themed shadow, length or gradient stop list, and a component that calls it mentions a theme, which code-standard rule 53's *why* refuses. It belongs only where a project has no token build at all.

**Cases**
- Dark mode works but the date input and scrollbars stay white → add `color-scheme` beside the dark tokens (code-standard rule 16).
- A project is dark-first → the build still writes Light on `:root`; the two orders resolve identically in every state a browser can be in, and one order was kept.
- A freshness colour (green, amber, grey) changes meaning in dark mode → status colours that are product, not theme, still get a value per mode but keep their hue role; the theme swap re-points lightness, never meaning.
- A theme toggle stores its choice and the page flashes light on load → move the read into an inline script in `<head>` and add the `color-scheme` meta.

**Accessibility**
- [required] Each mode meets contrast on its own: WCAG 2.2 1.4.3, 1.4.11. code-standard rule 16. Honouring the system scheme is part of *for everyone, in any context*.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *native controls follow the theme* (a dark tier comes with `color-scheme`, generated tokens included); `tools/tokens/check.mjs` proves the theme files are the build's. Parity runs each scheme a project ships (code-standard rule 35).
- *Judgement:* Does any component sheet mention a theme?

**Sources:** MDN and web.dev as linked. Sources differ on `light-dark()` as the primary mechanism; code-standard rule 53 keeps token re-pointing, one mechanism for colours, shadows and lengths alike.

## What not to tokenise

**What good looks like**
- [weak] No source sets when a value earns a token of its own; what holds is the design's binding, below.

**How**
- [required] Where the design binds a value, use its token even if it appears once: the binding is the shared vocabulary (code-standard rule 22 *literal is a token*).

**Cases**
- A max height the design never draws → a literal with a comment saying the design has no value for it (code-standard rule 22).

**Accessibility**
- [weak] No criterion bears directly.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *literal is a token* (code-standard rule 22).
- *Judgement:* Would anyone ever change this value without changing the rule that uses it?

**Sources:** code-standard rule 22; no primary source sets a threshold.

## Literals with reasons

**What good looks like**
- [required] code-standard rule 22 holds for every number in a component sheet; the comment names the constraint, not the value.
- [required] A literal that equals a token of the family the design binds is the token (code-standard rule 22).
- [required] No literal fits only today's content (code-standard rule 57).

**How**
- [required] The comment names the constraint: "line-height kept on the text style, not a variable", "design draws no maximum", "mobile step-down not specified". It is how a future token replaces the literal (code-standard rule 27 for comments).
- [weak] A size that depends on content is derived from it, never a literal with a reason ([responsive: intrinsic layout first](responsive.md#intrinsic-layout-first)).

**Cases**
- `padding: 12px` where the scale has `--space-3: 0.75rem` → the token; the gate reads it off the stored specs.
- `max-height: 32rem` on a drawer the design never caps → keep it, with "design draws no maximum" beside it.

**Accessibility**
- [required] Content-sized widths survive text resizing and translation: WCAG 2.2 1.4.4, 1.4.12 Text Spacing.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *literal reason* and *literal is a token* (code-standard rule 22).
- *Judgement:* Name the input that would break this number. If there is one, derive it.

**Sources:** code-standard rule 22's evidence; no external source.

## The disabled opacity, once

**What good looks like**
- [required] One disabled opacity, from the design's state token, on the component's root (code-standard rule 62).
- [required] A component holding other components dims once (code-standard rule 62).
- [required] No differing literals (`0.4`, `.5`, `0.45`) across components (code-standard rule 62).

**How**
- [required] Apply it on the host, matched from the control's own state, and give parents a knob (code-standard rule 62):

```css
ds-button:has(> :disabled) { opacity: var(--dim, var(--state-disabled-opacity)); }
ds-card[disabled] > * { --dim: 1; }
```

- [required] The browser may already dim a disabled native control; a host dim on top composites twice. Neutralise the user-agent dim in the base layer once (code-standard rule 48) so the token is the only dim.

**Cases**
- Three components dim disabled at `0.4`, `0.5` and `.45` → one token; differing literals are three guesses at one design value.
- A disabled select renders at 0.35 where the design says 0.5 → the browser's own dim multiplied the token; reset the user-agent dim once in the base layer.
- A disabled group over disabled rows draws at a quarter → the group sets `--dim: 1` on its children (code-standard rule 62).
- A completed row is dimmed with opacity → not disabled, so not exempt from contrast; signal it another way (the opacity candidate in [candidates.md](candidates.md)).

**Accessibility**
- [required] WCAG 2.2 1.4.3 exempts "text or images of text that are part of an inactive user interface component" ([Understanding 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)); the exemption is why dimming disabled is safe and dimming anything else is not. code-standard rules 9 and 62.

**Check**
- *Script:* parity's opacity row on the root (code-standard rule 62's check); `tools/css-lint/lint.mjs` *literal is a token* for a typed opacity.
- *Judgement:* Is anything dimmed that is not disabled?

**Sources:** [Understanding WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); code-standard rule 62's evidence.

## Motion tokens

**What good looks like**
- [moderate] Durations and easings are tokens from the design file, read by every transition and animation.
- [moderate] Reduced motion replaces movement with something calmer; it does not just delete feedback.

**How**
- [required] DTCG has a `duration` type (`unit` "may only be `ms` or `s`") and a `cubicBezier` type of four numbers whose x values are in [0, 1] ([DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/)). They become custom properties like any token: `transition: opacity var(--duration-short) var(--easing-standard)`.
- [required] `prefers-reduced-motion: reduce` says the reader "prefers an interface that removes, reduces, or replaces motion-based animations"; MDN's example swaps a scaling animation for a fade ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)). Keep fades and colour changes that carry state; remove travel, scale and parallax.
- [weak] The base block that enforces the preference, and the one `!important` it is allowed, are [accessibility: reduced motion and colour scheme in code](accessibility.md#reduced-motion-and-colour-scheme-in-code).
- [required] To animate a custom property itself, register it with `@property` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@property)).

**Cases**
- A drawer slides in over 300ms with a literal easing → read the duration and easing tokens; the next motion change is one edit.
- Reduced motion sets every duration to `0` → a script waiting for `transitionend` may never hear it; the base block's near-zero duration keeps the event firing.

**Accessibility**
- [weak] WCAG 2.2 2.3.3 Animation from Interactions (AAA): "motion animation triggered by interaction can be disabled, unless the animation is essential" ([Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)); 2.2.2 Pause, Stop, Hide. The design side is [accessibility: motion and vestibular safety](../ui/design/accessibility.md#motion-and-vestibular-safety).

**Check**
- *Script:* `tools/css-lint/lint.mjs` *`!important`* allows it only inside a reduced-motion block; could flag a `transition` or `animation` with a literal duration.
- *Judgement:* With reduced motion on, does every state change still show?

**Sources:** DTCG and MDN as linked. Honouring reduced motion globally is a candidate in [candidates.md](candidates.md), not yet a rule.

## Spacing tokens

**What good looks like**
- [strong] The primitive scale is named by number, never by t-shirt size. Carbon v11 removed `$spacing-4xs`…`$spacing-3xl` and kept `$spacing-01`…`13` ([v11 migration](https://raw.githubusercontent.com/carbon-design-system/carbon/main/docs/migration/v11.md)); Orbit v16 moved `spaceSmall`, `spaceMedium` to `space300`, `space400` to open in-between steps ([v16 guide](https://github.com/kiwicom/orbit/blob/master/docs/src/documentation/05-development/04-migration-guides/12-v16.mdx)); TDesign deprecated `@spacer` for `--td-size-1`…`16` ([`_size.less`](https://raw.githubusercontent.com/Tencent/tdesign-common/develop/style/web/theme/_size.less)). The base and the proximity rules are [visual: spacing scale and proximity](../ui/design/visual.md#spacing-scale-and-proximity).
- [moderate] A role layer on top names what a space does in the words of CSS: `padding` inside a container, `gap` between siblings, and a page role (`page-margin`, `gutter`) for page margins and region gaps, each aliasing a primitive; split `gap` by axis only where rows and columns take different values. Polaris `space-card-padding`, `space-card-gap`, `space-button-group-gap` ([`space.ts`](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/space.ts)); Workday Canvas `sys.padding.*` and `sys.gap.*`, which replaced its numbered `sys.space.x1`…`x16` ([`sys.json`](https://github.com/Workday/canvas-tokens/blob/main/packages/canvas-tokens/tokens/web/sys.json)); Spectrum `base-gap-medium`, `base-padding-horizontal-medium` ([`layout.json`](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/src/layout.json)); PatternFly `--pf-t--global--spacer--gap--group--horizontal`, `--spacer--gutter--default` ([`tokens-default.scss`](https://github.com/patternfly/patternfly/blob/main/src/patternfly/base/tokens/tokens-default.scss)); Primer's `stack.padding.*` and `stack.gap.*` (8/16/24) ([functional size](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/size.json5)), Fluent's `spacingHorizontal*` and `spacingVertical*` ([spacings.ts](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/global/spacings.ts)), Ant's `padding*` and `margin*` aliases ([customize theme](https://ant.design/docs/react/customize-theme)); Atlassian added experimental `space.gap.*` and `space.inset.*` in `@atlaskit/tokens` 20.12 ([tokens raw](https://unpkg.com/@atlaskit/tokens/dist/es2019/artifacts/tokens-raw/atlassian-spacing.js)). `inset`, `stack` and `inline` come from [Curtis, Space in Design Systems](https://nathanacurtis.substack.com/p/space-in-design-systems-188bcbae0d62) (commentary): of 14 systems' token files read in November 2026, `inset` appears only in Atlassian's experimental set and PatternFly's `--spacer--inset--page-chrome`, and `stack` and `inline` in none; they survive as layout component names (Atlassian `Stack` and `Inline`, Polaris `BlockStack` and `InlineStack`), not token names.
- [strong] The systems that ship role tokens re-point them per mode while the primitives hold: SLDS compact remaps `VAR_SPACING_MEDIUM` 16→8px and splits its horizontal and vertical roles ([SLDS 1 tokens](https://v1.lightningdesignsystem.com/design-tokens/)); Ant's compact lowers `sizeStep` 4→2, so `sizeLG` 24→16 and every `padding*` alias follows ([genSizeMapToken](https://raw.githubusercontent.com/ant-design/ant-design/master/components/theme/themes/shared/genSizeMapToken.ts)); Primer's `controlStack.medium.gap.auto` is 8px in its fine-pointer file and 12px in its coarse one ([functional size](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/size.json5)); Polaris `light-mobile` sets `space-card-gap` 16→8px ([`space.ts`](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/space.ts)). Carbon removed `$layout-01`…`07`, which only repeated spacing values and changed with no mode ([issue #5602](https://github.com/carbon-design-system/carbon/issues/5602)). How density switches is [density](#density).
- [moderate] Control height is a token apart from the spacing scale: Primer `control.medium.size` 32px, Spectrum `base-height-medium` 32px desktop and 40px mobile ([`layout.json`](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/src/layout.json)), Carbon `layout.size.height` ([button mixins](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/components/button/_mixins.scss)). Which heights systems ship is [button: button sizes](../ui/components/button.md#button-sizes).
- [weak] Components own no outer margin; the parent sets the gap, as [visual: spacing scale and proximity](../ui/design/visual.md#spacing-scale-and-proximity) already asks. Every Layout's Stack argues it ([every-layout.dev](https://every-layout.dev/layouts/stack/), commentary); Primer's `Stack` takes the gap as a prop ([Stack](https://primer.style/product/components/stack/)).
- [moderate] A zero step is a token of its own: Polaris `space-0` ([`space.ts`](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/space.ts)), Atlassian `space.0`, described "Use for resetting default spacing styles" ([tokens raw](https://unpkg.com/@atlaskit/tokens/dist/es2019/artifacts/tokens-raw/atlassian-spacing.js)), Fluent `none` ([`spacings.ts`](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/global/spacings.ts)) and GOV.UK unit `0` ([`_spacing.scss`](https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/settings/_spacing.scss)); Workday's roles `padding.none` and `gap.none` alias `base.size.0` ([`sys.json`](https://github.com/Workday/canvas-tokens/blob/main/packages/canvas-tokens/tokens/web/sys.json)). Primer has none: its smallest base size is 2px ([`size.json5`](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/base/size/size.json5)). A zero token records "no space" as a decision, so a zero value is bound in Figma like any other and can be re-pointed to a step later. Spectrum, Carbon and USWDS were not confirmed (USWDS's changelog mentions a `0` unit; its spacing table does not list one).

**How**
- [strong] Name the primitive by multiplier with the base stated (`space-100` = 4px, `space-400` = 16px, as Polaris; Atlassian's `space.100` is 8px on an 8px base) or by value (`base.size.16`, as Primer, [base size](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/base/size/size.json5)). A multiplier name means different px in different systems (`space-200` is 16px in Atlassian, 8px in Polaris, and Spectrum's index `spacing-200` is 12px), so the scale's description says its base. Closed scales ship 9 to 19 steps ([Polaris `space.ts`](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/space.ts), [Atlassian](https://atlassian.design/foundations/spacing), [Spectrum `layout.json`](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/src/layout.json)).
- [strong] Every role aliases a primitive, named by its design-file path (code-standard rule 52); a mode re-points the alias, as in [density](#density). Primer's functional tokens ([functional size](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/size.json5)) and Polaris's `space-card-padding` → `space-400` ([`space.ts`](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/space.ts)) are aliases; Spectrum's per-component tokens are mostly literal px (about 387 literals to 88 references in [`layout.json`](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/src/layout.json)), which cuts them from the scale.
- [weak] Responsive: GOV.UK keeps units 0 to 3 (0, 5, 10, 15px) at every width and shrinks 4 to 9 on mobile (unit 6: 20px, 30px from tablet) ([`_spacing.scss`](https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/settings/_spacing.scss)), the one shipped per-breakpoint map read. Breakpoint strategy is [responsive.md](responsive.md)'s.
- [weak] Responsive values on one component: no system read documents breakpoint modes on component spacing tokens. The shipped routes are a role per breakpoint (GOV.UK, above); component tokens suffixed per breakpoint and applied in media queries, as Amsterdam's `vi-medium` and `vi-wide`, with the caution that a compact override must cover every responsive variant ([contributing guide](https://cdn.jsdelivr.net/npm/@amsterdam/design-system-tokens@4.0.1/CONTRIBUTING.md)); and one token with a value per platform scale, Spectrum's `base-height-medium` at 32px on desktop and 40px on mobile ([`layout.json`](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/src/layout.json)). Spectrum says component tokens "play a much smaller role" than semantic ones ([design tokens](https://spectrum.adobe.com/page/design-tokens)). Figma supports a separate collection for spatial values ([variables overview](https://help.figma.com/hc/en-us/articles/14506821864087-Overview-of-variables-collections-and-modes)); a forum thread reports that modes do not follow a frame's width ([thread](https://forum.figma.com/suggest-a-feature-11/automatic-variable-mode-switching-for-true-responsive-previews-44209), user-reported). Polaris and HeroUI vary button height by breakpoint in their styles ([button: button sizes](../ui/components/button.md#button-sizes)), but a component-token collection with breakpoint modes is a project choice with no shipping precedent found.
- [moderate] Padding from height: Primer fixes its 32px control height with 6px block padding inside it; Carbon's mixin computes block padding as half of the height less one line, less 1px "to compensate for border width" ([button mixins](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/components/button/_mixins.scss)), in CSS `calc((var(--control-height-md) - 1lh) / 2 - 1px)`. Fluent sets padding only (5px + 20 + 5 + 2px border = 32), so its height follows the font ([Button styles](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-button/library/src/components/Button/useButtonStyles.styles.ts)). Height as a minimum is [figma handoff: auto layout to flex and grid](figma-handoff.md#auto-layout-to-flex-and-grid).
- [moderate] Platforms: store each token as a DTCG `dimension` in px (`px` or `rem` are the only units; no spacing type) ([DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/)); generate rem, dp and pt with Style Dictionary's `size/pxToRem`, `size/compose/remToDp`, `size/swift/remToCGFloat` ([transforms](https://styledictionary.com/reference/hooks/transforms/predefined/)). Padding is CSS `padding-block`/`padding-inline`, Compose `Modifier.padding(PaddingValues)`, SwiftUI `.padding(EdgeInsets)`; gap is CSS `gap`, `Arrangement.spacedBy`, `VStack`/`HStack(spacing:)`. Name sides start and end ([PaddingValues](https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/PaddingValues): `Absolute` does not flip).
- [moderate] In Figma: the plugin API has a `GAP` scope and no padding scope, and a `GAP` variable shows in both pickers ([`VariableScope`](https://developers.figma.com/docs/plugins/api/VariableScope/)), while Figma's help page lists gap and padding ([guide to variables](https://help.figma.com/hc/en-us/articles/15145852043927-Guide-to-variables-in-Figma)); hidden collections keep resolving through aliases; number variables carry no unit, and a mode carries no breakpoint width. Modes: 10 per collection on Professional, 20 on Organization ([plans](https://help.figma.com/hc/en-us/articles/360040328273)). Figma's Simple Design System keeps `space/050`…`space/4000` in one `@size` collection ([SDS tokens](https://raw.githubusercontent.com/figma/sds/main/scripts/tokens/tokens.json)).
- [weak] Each role's description holds use-for and not-for lines: Atlassian's newer `space.gap.*` and `space.inset.*` descriptions say what not to use them for ([tokens raw](https://unpkg.com/@atlaskit/tokens/dist/es2019/artifacts/tokens-raw/atlassian-spacing.js)); Carbon's page lists values only ([Carbon spacing](https://carbondesignsystem.com/elements/spacing/overview/)).
- [moderate] Audit: in Figma, a non-zero `itemSpacing`, `counterAxisSpacing`, padding side or grid gap with no `boundVariables` entry is unbound ([`VariableBindableNodeField`](https://developers.figma.com/docs/plugins/api/VariableBindableNodeField/)); library analytics counts bound usage only ([library analytics](https://developers.figma.com/docs/rest-api/library-analytics-endpoints/)); Check designs suggests variables by similarity ([help](https://help.figma.com/hc/en-us/articles/39592284074263)). In code, the shipped linters each cover part: Atlassian `ensure-design-token-usage` resolves `gridSize()` to 8px and skips calls with arguments; Polaris stylelint bans px, rem and em on padding, margin and gap; Primer `primer/spacing` accepts any value within 1px of a base size; Mozilla `use-design-tokens` warns a px equals its rem token only at a 16px root ([space rule](https://firefox-source-docs.mozilla.org/code-quality/lint/linters/stylelint-plugin-mozilla/rules/use-design-tokens/space.html)).
- [moderate] Migration as the systems ran it: Carbon v11 renamed `$layout-01`→`$spacing-05` (1rem) with values kept; Polaris v12 renamed `--p-space-4`→`--p-space-400` with `v12-styles-replace-custom-property-space`, documented its one value change (a legacy card 20→16px) apart from the rename, and left a comment on what its codemods could not convert ([v12 guide](https://raw.githubusercontent.com/Shopify/polaris-react-archive/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)); Primer mapped `$spacer-3`→`--base-size-16` and advised the raw value or the closest step between steps ([migrating](https://primer.style/product/primitives/migrating/)); Atlassian's autofix applies exact matches only.

**Cases**
- Card, row, field gap and page margin all `space-400` → four roles (`padding-md`, `padding-row-md`, `gap-md`, `page-margin`) that share a value today and diverge under compact or mobile.
- A 32px button renders 34px → the 1px border sits outside 6px padding; derive padding from the height token, less the border.
- `margin-bottom: 24px` on a card inside a 16px-gap grid → rows 40px apart; drop the margin, the grid's gap owns it.
- `18px` on 40 card tops in Figma → a missing role, not noise; decide 16 or a new step once, by count.
- `spacing-medium` is 16px in one file and 8px in another → map by file, never by name.
- A role scoped to every field shows up in radius and width pickers → scope roles to `GAP`, primitives to none.

**Accessibility**
- [required] Spacing in rem (code-standard rule 54); no fixed heights around text (WCAG 2.2 1.4.12). Target sizes under compact are [density](#density)'s.
- [moderate] Negative values map to margin or a bleed component, never to padding: CSS rejects negative padding, and Compose clamps `PaddingValues.minus` at zero ([PaddingValues](https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/PaddingValues)); Atlassian ships `Bleed` for it ([Bleed](https://atlassian.design/components/primitives/bleed/examples)).

**Check**
- *Script:* `tools/css-lint/lint.mjs` *literal is a token* catches a literal equal to a spacing token; could flag a primitive spacing token in a component sheet, a role with a literal value, and margin on a component's root. On Figma, the unbound-field walk above; the parity run compares gap and padding per layer.
- *Judgement:* does each role name a mode that changes it; does each component's padding include its border; does any component carry outer margin?

**Sources:** as linked; Curtis and Every Layout are commentary. Sources agree on numbers over t-shirt names and on aliasing. They differ on how far the role layer goes: Braid one role name, Polaris four aliases, Primer about 44, Spectrum hundreds; the evidence above favours roles that a mode re-points.

## Radius tokens

**What good looks like**
- [moderate] One short primitive scale from `none` to `full`, six to ten steps, named by t-shirt word or by value, not by index. Atlassian ships eight (`radius.xsmall` 2px to `radius.xxlarge` 16px, `full`, `tile`; [tokens](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.12.0/dist/esm/artifacts/tokens-raw/atlassian-shape.js)), Material ten (`corner.none` to `corner.full`; [shape tokens](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/latest/sass/_md-sys-shape.scss)), Carbon v12 value-named `border-radius-00` to `-max` ([layout tokens](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/layout/tokens/layout.tokens.json)). Spectrum 2 reused `corner-radius-200` for 5px after it meant 8px ([changelog](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens@15.7.0/CHANGELOG.md)), the risk of index names.
- [strong] Roles on top, each aliasing a step, and components use roles only, as [Atlassian's radius tokens](https://atlassian.design/foundations/radius) assign each step a job; the role mapping is [visual: elevation, borders, radius and shape](../ui/design/visual.md#elevation-borders-radius-and-shape).
- [strong] `full` is a large fixed length, `9999px` on the web, never `50%`: a percentage resolves per axis and draws an ellipse on a wide box, while an oversized length is scaled to half the short side ([CSS Backgrounds 3, corner overlap](https://www.w3.org/TR/css-backgrounds-3/#corner-overlap)). On Android a 50% corner is measured against the shorter side and is a pill ([`RelativeCornerSize`](https://github.com/material-components/material-components-android/blob/master/lib/java/com/google/android/material/shape/RelativeCornerSize.java)).

**How**
- [strong] Never mix `full` with small radii on one box: the overlap rule scales all four corners by one factor ([corner overlap](https://www.w3.org/TR/css-backgrounds-3/#corner-overlap)), so `9999px 9999px 8px 8px` on a 52px tab leaves the 8px corners at 0.04px. Write the round side as half the known control height.
- [moderate] A rounder theme or brand is one factor over the scale, not a scale per theme: Radix writes each step as `calc(3px * var(--scaling) * var(--radius-factor))` and up ([radius.css](https://raw.githubusercontent.com/radix-ui/themes/main/packages/radix-ui-themes/src/styles/tokens/radius.css)); shadcn moved from `calc(var(--radius) - 4px)` to multipliers in February 2026 ([commit](https://github.com/shadcn-ui/ui/commit/dc3eb9081a99abb3ba10c3d9f2f2b15f903a89c2)), since subtraction goes negative. Atlassian tried per-theme role mappings (`shape-rounder`, `shape-roundest`) and removed them ([changelog](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.12.0/CHANGELOG.md)). In Figma, where variables cannot multiply, the factor becomes a mode.
- [weak] Radius per control size is split: Primer keeps `--borderRadius-medium` at every button size ([ButtonBase CSS](https://github.com/primer/react/blob/main/packages/react/src/Button/ButtonBase.module.css)); Spectrum ships size-dependent aliases such as `corner-radius-medium-size-small` ([layout.json](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens@15.7.0/src/layout.json)). Pick one rule.
- [strong] Per-corner radii use logical names: CSS `border-start-start-radius` and its three siblings ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/border-start-start-radius)), Compose `RoundedCornerShape(topStart, …)`, which mirrors in right-to-left, never `AbsoluteRoundedCornerShape` ([source](https://github.com/androidx/androidx/blob/androidx-main/compose/foundation/foundation/src/commonMain/kotlin/androidx/compose/foundation/shape/RoundedCornerShape.kt)). Carbon v12 gives its button one custom property per logical corner ([`_radius.scss`](https://github.com/carbon-design-system/carbon/blob/main/packages/styles/scss/components/button/_radius.scss)).
- [required] A radius is a DTCG `dimension`; no composite type carries it, so four corners are four tokens ([DTCG 2025.10](https://www.designtokens.org/tr/2025.10/format/)).
- [strong] Build px-authored radii with px-aware transforms: Style Dictionary's native `size/remToDp` and `size/swift/remToCGFloat` multiply by 16 whatever the unit, so 6px becomes 96dp, and a radius typed other than `dimension` gets no size transform ([transforms source](https://github.com/style-dictionary/style-dictionary/blob/main/lib/common/transforms.js)).
- [contested] Unit: Polaris, Primer and Atlassian ship radius in rem ([Primer `--borderRadius-medium: 0.375rem`](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/radius.json5), [Atlassian shape CSS](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.12.0/dist/esm/artifacts/themes/atlassian-shape.js)); Spectrum and Material in px and dp; none states why. The toolkit keeps radii px (code-standard rule 54).
- [moderate] Corner style is a platform finish, not a token value: Figma cannot bind `cornerSmoothing` to a variable ([`VariableBindableNodeField`](https://developers.figma.com/docs/plugins/api/VariableBindableNodeField/)); iOS uses `.continuous` ([`RoundedCornerStyle`](https://developer.apple.com/documentation/swiftui/roundedcornerstyle/continuous)); CSS `corner-shape: squircle` ships in Chrome 139 only ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/corner-shape)). An oversized radius clamps per edge in Figma, to half that edge ([plugin typings, `CornerMixin`](https://github.com/figma/plugin-typings/blob/master/plugin-api.d.ts)), and scales all four corners together in CSS (corner overlap, above).
- [moderate] In Figma: primitives hidden and unscoped; roles scoped to `CORNER_RADIUS` ([`VariableScope`](https://developers.figma.com/docs/plugins/api/VariableScope/)) with code syntax per platform; each of `cornerRadius`, `topLeftRadius`, `topRightRadius`, `bottomLeftRadius` and `bottomRightRadius` is bindable. A multi-value Tokens Studio radius is skipped on export to variables ([Tokens Studio](https://docs.tokens.studio/manage-tokens/token-types/dimension/border-radius)).
- [moderate] Lint: Atlassian `use-tokens-shape` ([rule](https://atlassian.design/components/eslint-plugin-design-system/use-tokens-shape/usage)), Mozilla `use-design-tokens` ([radius rule](https://github.com/mozilla-firefox/firefox/blob/main/docs/code-quality/lint/linters/stylelint-plugin-mozilla/rules/use-design-tokens/border-radius.md)), Primer `primer/borders` ([plugin](https://github.com/primer/stylelint-config/blob/main/plugins/borders.js)), which warns against the `--borderRadius-default` its own token file prefers: the lint is updated with the tokens.
- [moderate] Migration as Atlassian ran it: seven `border.radius.*` tokens deprecated in August 2025 and deleted in October, the eighth new `radius.*` token added in November, a mapping for every old name (one to a raw 16px), and the visible change (buttons 4px to 6px) shipped separately behind a feature gate ([changelog](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.12.0/CHANGELOG.md)). Polaris renamed three times, each with a codemod ([v12 codemod](https://github.com/Shopify/polaris-react-archive/blob/main/polaris-migrator/src/migrations/v12-styles-replace-custom-property-border/transform.ts)).
- [strong] Docs are generated from the tokens: Atlassian's site gives `radius.full` as 999px against 9999px in its package, and Fluent's gives Large and X-Large as 8 and 12px against 6 and 8px in [code](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/global/borderRadius.ts).

**Cases**
- `border-radius: 50%` on a 160 by 44 button → an 80 by 22 oval; `radius.full` at 9999px.
- A Compose `Corner.Full` ported to CSS as `50%` → ovals on the web; map `full` per platform.
- `--radius-sm: calc(var(--radius) - 4px)` with `--radius: 2px` → a negative radius; multiply.
- A 6px radius through `size/remToDp` → 96dp; `size/dp` or a custom transform.
- `border-top-left-radius` on a side sheet → the wrong side rounds in Arabic; `border-start-start-radius`.
- A radius variable with every scope → offered for stroke widths; scope it to `CORNER_RADIUS`.

**Accessibility**
- [required] WCAG 2.2 2.5.8 measures whether a 24 by 24 square fits in the target, and rounded corners can leave too little room ([Understanding target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)): a 24px round target fails the size test and needs the spacing exception.
- [strong] Forced colours keep `border-radius` but drop `box-shadow` ([CSS Color Adjustment](https://www.w3.org/TR/css-color-adjust-1/)), so a rounded shape drawn only by a shadow disappears there.

**Check**
- *Script:* could flag a raw `border-radius`, `50%` on a non-square box, `9999px` mixed with a small radius, a physical corner property, and in Figma a corner field with no `boundVariables` entry. `tools/css-lint/lint.mjs` *literal is a token* covers a literal equal to a token.
- *Judgement:* does every control share one role; is every nested radius the outer less the padding?

**Sources:** as linked. Systems agree on a short scale, roles by job, `full` as a large length and logical corners; they differ on naming (t-shirt, value, index), radius per size, and px against rem.

## Density

**What good looks like**
- [required] Density is a mode: one attribute re-points spacing and control-height tokens; components do not change (code-standard rule 53).
- [weak] Type size does not change with density.
- [required] Compact never takes a target under the minimum size (WCAG 2.5.8).

**How**
- [required] A density collection in the design file writes like any other mode, `[data-density="compact"]` (code-standard rule 53), re-pointing the spacing and sizing semantics:

```css
:root { --control-height: 2.5rem; --row-gap: var(--space-3); }
[data-density="compact"] { --control-height: 2rem; --row-gap: var(--space-2); }
```

- [weak] Systems differ on the default: React Spectrum picks its medium or large scale "according to the device type (e.g. touch vs mouse input)" ([React Spectrum Provider](https://react-spectrum.adobe.com/react-spectrum/Provider.html)), which CSS can read as `@media (pointer: coarse)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer)).
- [required] Density is a mode, so it switches by attribute, one mechanism (code-standard rule 53); a project that wants a touch default records it as a ruling.
- [weak] Where density applies, and where it never should, is [visual: density modes](../ui/design/visual.md#density-modes).

**Cases**
- A dense data table and a roomy form share components → the table's container sets `data-density="compact"`; the same components follow the tokens.
- Compact shrinks icon buttons to 20px → keep the hit area at 24px or more with padding or spacing; density changes the look, not the target.
- A component hard-codes its compact height under its own attribute → move it to a token the density mode re-points; otherwise each component carries its own copy of the mode.

**Accessibility**
- [required] WCAG 2.2 2.5.8 Target Size (Minimum): "at least 24 by 24 CSS pixels", or spaced so the 24px circles do not intersect ([Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)). 1.4.12 Text Spacing.

**Check**
- *Script:* tools/parity/pages.mjs could measure target sizes in each density mode; could flag a component rule keyed on a density attribute.
- *Judgement:* Does compact remove space, or remove something a reader needs?

**Sources:** React Spectrum and MDN as linked; WCAG 2.2. Sources differ on whether density follows the pointer; code-standard rule 53 keeps it an explicit mode.
