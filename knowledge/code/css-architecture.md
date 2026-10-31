# CSS architecture

How a stylesheet is organised so it stays cheap to change: the cascade and specificity, cascade layers, selectors that stay local, custom properties, interaction states, nesting, naming, modern colour, Sass modules, file organisation, dead CSS and utilities. It serves code-standard rules 4, 5, 6, 9, 10, 17, 22, 38, 39, 44, 46, 50 and 60, and the design-standard principles *as little as possible, and no simpler* (one rule per decision) and *consistent, not uniform* (one way to write a thing). Tokens and theming are [tokens.md](tokens.md)'s; breakpoints and intrinsic layout are [responsive.md](responsive.md)'s; logical properties and mirroring are [i18n.md](i18n.md#logical-properties-and-mirroring)'s; focus styling is [accessibility.md](accessibility.md)'s; which features need a fallback is [browser-support.md](browser-support.md)'s.

**Implements:** [visual](../ui/design/visual.md)'s states, colour and consistency of the system, and the styling half of every pattern's Build part.

## The cascade and specificity

**What good looks like**
- A conflict between two rules is settled by layer order, never by counting selectors.
- Selectors inside a layer stay at low, even specificity, so the later rule in the same layer wins for a reason someone can read.
- No two rules of equal specificity disagree about one element (code-standard rule 44).

**How**
- The cascade decides, in order: origin and importance, context, element-attached styles, layers, specificity, then order of appearance ([CSS Cascade 5](https://www.w3.org/TR/css-cascade-5/)). Layers come before specificity, which is why code-standard rule 4 can retire specificity as a tool.
- Specificity is three columns, ID, CLASS, TYPE, compared left to right; "the selector with the greater value in the ID column wins no matter what the values are in the other columns" ([MDN Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity)). So no ID selectors in a stylesheet; an attribute selector `[id="x"]` weighs a class if one is ever needed.
- Keep every selector in a layer near the same weight: one custom element, one attribute, one state. A selector that needs a second class to win is in the wrong layer.
- Equal specificity across two sheets is decided by load order, which differs between the application and a component workbench (code-standard rule 44). State the value once.

**Cases**
- A component's width works in the workbench and breaks in the application → look for a second rule at the same specificity in a sheet loaded in a different order; state the value in one place, because the winner is whichever file happened to load last.
- A reviewer adds `.card.card` to beat a page rule → move the page rule into the layer it belongs in, or give the component a knob (code-standard rule 38); doubled selectors are an arms race MDN advises against ("use this sparingly, if at all").
- An element selector in a legacy base outranks a component class (`input:not([type=…])` repeated) → the legacy base goes into its own early layer; see the migration candidate in [candidates.md](candidates.md).

**Accessibility**
- A style that loses the cascade silently can drop a focus ring or a `[hidden]` rule: code-standard rule 17 (`hidden` beats the stylesheet) and code-standard rule 40 (`outline: 0`, not `none`). WCAG 2.2 2.4.7 Focus Visible.

**Check**
- *Script:* `tools/css-lint/lint.mjs` gates *layers* (code-standard rule 4) and *`!important`*; could flag an ID selector and two same-specificity rules in different sheets setting one property on one element.
- *Judgement:* When two rules meet on one element, can you say which wins without running the page?

**Sources:** [CSS Cascade 5](https://www.w3.org/TR/css-cascade-5/); [MDN Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity), which recommends "cascade layers and using low weight specificity throughout your CSS". The sources agree.

## Cascade layers

**What good looks like**
- The layer order is declared once, at the top of the entry file, before any rule.
- Every rule is in a layer; nothing is unlayered (code-standard rule 4).
- `!important` appears only where its inverted order is the point, and then with a comment.

**How**
- **Order.** code-standard rule 4 names the order (tokens, reset, layout, components, utilities, or the project's equivalent, such as a `base` layer between reset and layout). A project's existing order wins. Declare it in a file of its own so the order exists before anything is in it:

```css
@layer tokens, reset, layout, components, utilities;
```

- **Later wins.** "For normal rules the declaration whose cascade layer is last wins" ([CSS Cascade 5 §6.1](https://www.w3.org/TR/css-cascade-5/#layering)), so a one-attribute utility beats a three-part component selector with no `!important`.
- **Unlayered beats layered.** "Styles that are not defined in a layer always override styles declared in named and anonymous layers" ([MDN `@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer)). A file someone forgot to layer outranks the whole system, which is why code-standard rule 4 refuses it.
- **`!important` inverts.** "The order of precedence among important rules is the inverse of normal rules," and "all important declarations within CSS layers take precedence over any important declarations declared outside of a layer" (MDN). An `!important` in the reset therefore beats everything after it, important or not.
- **In Sass**, `@use` cannot sit inside `@layer`; load a partial into a layer with `@include meta.load-css("base/reset")` inside the layer block, as the frontend-build scaffold's entry file does.

**Cases**
- A reset says `[hidden] { display: none !important }` and a `<noscript>` style tries to show tab panels without script → the reset's important declaration wins over every later layer and over the unlayered override, so the panels stay unreachable. Drop the `!important` (a layered `[hidden]` rule is what code-standard rule 17 asks for); better still, ship the panels visible and let the script hide them, so no override is needed ([javascript: progressive enhancement](javascript.md#progressive-enhancement)).
- A page rule written at a component's own selector wins in one build and loses in another → the sheets were unlayered and load order decided; declare the layers, and the page rule loses everywhere, which is what code-standard rule 4 means it to do. The variant the page wanted becomes an attribute or a knob (code-standard rule 38).
- A row says `> * { flex: 1 }` in the page layer and a child component that must not grow loses with `flex: none` on its own root → see the knob candidate in [candidates.md](candidates.md); a layer's `> *` reaches a component's root.
- Reduced motion needs to beat every component's transition → this is the one `!important` the gate allows, inside the `prefers-reduced-motion` block.

**Accessibility**
- WCAG 2.2 2.3.3 Animation from Interactions (AAA) and 2.2.2 Pause, Stop, Hide are why the reduced-motion `!important` exists. code-standard rule 17 for `[hidden]`.

**Check**
- *Script:* `tools/css-lint/lint.mjs` gates *layers* (every top-level statement of the compiled sheet is a layer, keyframes or a face) and *`!important`* (none outside a reduced-motion block).
- *Judgement:* Is every `!important` one whose inverted order you wanted?

**Sources:** [CSS Cascade 5](https://www.w3.org/TR/css-cascade-5/#layering), [MDN `@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer). The sources agree; the toolkit adds that nothing is unlayered.

## Selectors that stay cheap and local

**What good looks like**
- A component's selectors reach its parts by child combinators only (code-standard rule 5).
- A selector names what the element is (a custom element, an attribute, an ARIA state), not where it happens to sit.
- Specificity is lowered on purpose with `:where()`, not raised by accident.

**How**
- **Child, not descendant.** `ds-card > header` stops at the card's edge; `ds-card header` reaches into every component nested in it. The lint runs on the compiled sheet, because nesting can produce a descendant selector the source does not show.
- **`:where()` and `:is()`.** "`:where()` always has 0 specificity, whereas `:is()` takes on the specificity of the most specific selector in its arguments" ([MDN `:where()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:where)). Use `:where()` in the reset and base so any component rule overrides it; use `:is()` only to shorten a list whose weight you want.
- **`@scope`** bounds a rule set between a root and a limit (`@scope (.article-body) to (figure)`, the "donut scope") and adds *scope proximity* to the cascade ([MDN `@scope`](https://developer.mozilla.org/en-US/docs/Web/CSS/@scope)). Its limits: it "does not completely isolate" styles (inheritance crosses it); bare selectors inside it get zero specificity; `&` specificity differs by engine; it is Baseline 2026, newly available. And a rule inside `@scope (body)` cannot match a state kept on `<html>` (code-standard rule 60).
- **Hook names are global.** A data attribute used as a part selector also matches every element of that name a nested component renders (code-standard rule 39); grep before introducing one.

**Cases**
- A theme toggle stores `data-view` on `<html>` and the dashboard's rules live in `@scope (body)` → they compile and match nothing (code-standard rule 60); keep the state inside the scope or move those rules out of it.
- A wrapper named `[data-content]` styles its descendants and repaints a modal's body → scope the rule to a child combinator, or rename (code-standard rule 39).
- A block moves from the sidebar to the header and loses its styles → the old selector named its parent; grep the compiled sheet for the old home in the same change (code-standard rule 50).
- A reset needs `a:not([class])` to leave component links alone → `:where(a:not([class]))` keeps it at zero so it never competes.

**Accessibility**
- Styling off ARIA state (`[aria-current="page"]`, `[aria-expanded="true"]`) keeps the look and the announced state one fact: code-standard rule 64, code-standard rule 9.

**Check**
- *Script:* `tools/css-lint/lint.mjs` gates *own parts* (code-standard rule 5) and *a hook name reaches only its own* (code-standard rule 39) on the compiled sheet. Could flag a rule inside `@scope` that names `:root` or `html`.
- *Judgement:* If this block moved to another parent, which of its rules would stop matching?

**Sources:** MDN as linked. `@scope` is new; the toolkit uses it only where a donut boundary is the point, and keeps child combinators as the default because they need no support check.

## Custom properties

**What good looks like**
- Every design value a component reads is a custom property from the token layer ([tokens.md](tokens.md)).
- What a caller may change is a property with a default inside the component, and the caller sets the property (code-standard rule 38).
- A dimension a page takes from the design is stated once (code-standard rule 46).

**How**
- **Scope is the selector, and they inherit.** "The selector given to the ruleset… defines the scope in which the custom property can be used," and an unregistered property "always inherits the value of its parent" ([MDN, Using custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)). Inheritance ignores layers, which is what lets a page change a component it cannot out-rank.
- **A knob** is a property read with a default:

```css
ds-modal > [data-body] { padding: var(--modal-body-pad, var(--space-5)); }
.settings ds-modal { --modal-body-pad: var(--space-3); }
```

- **Fallbacks** are for "the case where the browser supports CSS custom properties" and the variable "isn't defined yet or has an invalid value" (MDN). A second fallback nests: `var(--a, var(--b, 1rem))`.
- **An invalid substitution is silent.** An undefined `var()` with no fallback makes the property "invalid at computed time" and the element takes the inherited or initial value; nothing errors (MDN). This is what a renamed token does.
- **`@property`** registers a type, an initial value and whether it inherits; it is what makes a custom property animatable ([MDN `@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property), Baseline 2024). Register only a property you animate or must type.

**Cases**
- A page grid is re-derived by `max(…, (100% - …) / 2)` arithmetic in five places → one container component and one `--page-width` property (code-standard rules 11 and 46); five copies agree until the grid changes.
- A token is renamed and three sheets keep the old name → each declaration silently falls back; `tools/tokens/check.mjs` flags a `var(--x)` with no fallback that nothing defines.
- A parent component holds disabled children and both dim → the parent sets `--dim: 1` on its children (code-standard rule 62), a knob in the direction of the child.
- A page needs a tighter modal → it sets `--modal-body-pad`, never a rule at the modal's selector, which would lose to the components layer anyway.

**Accessibility**
- A knob that reaches a focus ring's offset or a target's size must keep its floor: WCAG 2.2 2.4.11 Focus Not Obscured (Minimum), 2.5.8 Target Size (Minimum). code-standard rule 38.

**Check**
- *Script:* `tools/tokens/check.mjs` (a `var()` with no fallback and no definition); `tools/css-lint/lint.mjs` *a layout container is a component* (code-standard rule 11).
- *Judgement:* Is each knob something a caller has actually needed, or one added in case?

**Sources:** [MDN, Using custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties), [MDN `@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property). The sources agree.

## Interaction states

**What good looks like**
- Every state is a selector the browser or the accessibility tree already holds: `:hover`, `:active`, `:focus-visible`, `:disabled`, and the ARIA state attributes for selected, pressed, current and expanded; never a class a script toggles (code-standard rule 9).
- Hover and pressed are one overlay whose strength is a state token, so every surface and variant gets them without a rule each.
- Hover is written for devices that hover; focus is a ring of its own, never the hover overlay.
- It implements [interaction: interaction states](../ui/design/interaction.md#interaction-states).

**How**
- **One overlay.** The component mixes its surface with its on-surface colour by a custom property the states set; the opacities are the design's state tokens ([MDN `color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)):

```css
ds-button > button { background: color-mix(in oklch, var(--bg), var(--on-bg) calc(var(--state, 0) * 100%)); }
@media (hover: hover) { ds-button > button:hover:not(:active) { --state: var(--state-hover-opacity); } }
ds-button > button:active { --state: var(--state-pressed-opacity); }
```

- **Hover inside `@media (hover: hover)`** ([MDN `hover`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover)), so a tap on a touch screen leaves no hover behind; `:not(:active)` lets pressed win by selector rather than by load order (code-standard rule 44).
- **Selected is the ARIA attribute**: `[aria-selected="true"]`, `[aria-pressed="true"]`, `[aria-current="page"]`, `[aria-expanded="true"]`, or `:checked` on a native control. Styling the attribute the reader's software announces means the look and the announcement cannot disagree, and the script sets one thing (code-standard rule 64 for `aria-current`).
- **Focus** is `:focus-visible` with the ring mixin ([accessibility: visible focus](accessibility.md#visible-focus)); **disabled** is the control's own `:disabled` or `[aria-disabled="true"]`, takes no hover or pressed overlay, and the dim is the host's once ([tokens: the disabled opacity, once](tokens.md#the-disabled-opacity-once), code-standard rule 62).
- A state the design does not draw is reported, not invented ([figma handoff: states the design lacks](figma-handoff.md#states-the-design-lacks)); the axis-to-selector mapping is [figma handoff: variants to attributes](figma-handoff.md#variants-to-attributes).

**Cases**
- `.is-active` and `.is-hovered` classes toggled by a script → `[aria-selected="true"]` and `:hover`; the class could drift from the state, the attribute cannot.
- Each variant (primary, neutral, danger) restates its hover colour → one overlay over `--bg`; the variant sets `--bg` and `--on-bg` only.
- A row stays highlighted after a tap on a phone → move the hover rule into `@media (hover: hover)`.
- `:active` is declared before `:hover` and pressed never shows → `:hover:not(:active)`, so the order stops mattering.
- A disabled button still darkens on hover → exclude it: the overlay rules match `:enabled`, or the disabled rule resets `--state: 0`.

**Accessibility**
- WCAG 2.2 1.4.11 Non-text Contrast for selected and focus states, 2.4.7 Focus Visible, 1.4.1 Use of Color (selected carries a second cue). Hover is supplementary under 1.4.11.
- code-standard rules 9, 44, 62 and 64.

**Check**
- *Script:* could force `:hover`, `:active` and `:focus-visible` in a headless browser and fail an element whose computed background does not change or does not resolve to the state token, and flag a `:hover` rule outside `@media (hover: hover)` and a `class` toggled in a click handler that mirrors an ARIA state.
- *Judgement:* Is each state visible on every surface the component sits on, and is selected seen without hovering?

**Sources:** MDN as linked; the overlay mechanism is Material's state layer ([Material tokens](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-state.scss)). Systems differ on the opacities; the toolkit takes the mechanism and the project's tokens supply the figures.

## Nesting

**What good looks like**
- Nesting expresses a state, a condition or one child step; never the DOM's structure.
- Two levels at most.
- The compiled selector is what you meant (code-standard rule 5 lints the compiled output).

**How**
- CSS nesting is native; Sass nesting compiles the same way. The reason to keep it shallow was never the syntax: nesting encodes the DOM into the stylesheet, so moving an element breaks rules that never named it.
- A nested `&` has the specificity of `:is()`, "calculated using the highest specificity in the associated selector list" ([MDN, Using CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting)). Nesting under a list with one heavy selector raises every child.
- "If a nested CSS rule is invalid then all of the enclosed styles will be ignored" (MDN), so a typo in a nested selector drops a block without a word.

```scss
ds-card {
  padding: var(--space-4);
  &:hover { … }              // state
  @include bp.from(bp.$md) { … } // condition
  > h3 { … }                 // one child step (code-standard rule 5)
}
```

**Cases**
- `.body .title` nested inside a card → flatten to a child step or an attribute on the part; the nested form is a descendant selector once compiled.
- `&__element` concatenation in a class-named project → refuse it: the compiled class exists nowhere in the source, so grepping for it finds the markup and not the CSS.
- `&:hover [data-x]` passes review in source and fails the lint → it compiles to a descendant selector; write `&:hover > [data-x]`.

**Accessibility**
- No criterion bears directly; a nested rule that silently drops can remove focus or `[hidden]` styling (code-standard rules 17 and 40).

**Check**
- *Script:* `tools/css-lint/lint.mjs` *own parts* on the compiled sheet; could flag nesting deeper than two levels in source.
- *Judgement:* Does every nested rule describe a state, a condition or one child?

**Sources:** [MDN, Using CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting/Using_CSS_nesting). The two-level limit is the toolkit's commentary; no spec sets a depth.

## Naming

**What good looks like**
- A component is a custom element; its variants are attributes; its states are pseudo-classes or native attributes (code-standard rules 8 and 9).
- Hooks for script and tests are data attributes, never classes (code-standard rule 6).
- An attribute name is one the platform has never used (code-standard rule 10).

**How**
- **Custom elements and attributes.** `<ds-button variant="primary"><button>` names the component and its variant with no class at all; a custom element needs a hyphen and needs no script to be styled.
- **Rename collisions.** A Figma axis called `Role` becomes `variant`, because `role` is ARIA's (code-standard rule 9); `align` or `width` on a custom element triggers the browser's presentational hints (code-standard rule 10).
- **A class convention is a stated choice.** A project that names by class (`.ds-block`, `.ds-block__part`) records it in its context document as a ruling. The rules still hold under it: one block per file naming only its own parts (code-standard rule 5), state as a pseudo-class (code-standard rule 9), hooks as attributes (code-standard rule 6). The *own parts* gate reads either shape (`styles` in `snapshot.config.json` says which).
- **Utility classes:** the two code-standard rule 6 allows, and no others ([Utilities](#utilities)).

**Cases**
- A design hands over `Size=Large, State=Hover, Disabled=True` → `<ds-x size="large">` with `:hover` and the inner control's `disabled` (code-standard rules 9 and 62); a `state="hover"` attribute would let a template claim a state the control is not in.
- A test finds the submit button by `.btn-primary` → give it `data-submit`; a restyle should never break a test.
- A new component wants `align="center"` → choose `justify` or `placement`; browsers centre text on any element carrying `align`.

**Accessibility**
- Native semantics carry the accessibility: WCAG 2.2 4.1.2 Name, Role, Value. code-standard rules 8, 9 and 18.

**Check**
- *Script:* `tools/css-lint/lint.mjs` gates *a state is a pseudo-class, disabled the control's own* (code-standard rule 9) and *no presentational attribute as a variant* (code-standard rule 10).
- *Judgement:* Could a template put this element in a state it is not in?

**Sources:** WHATWG [custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html) and [presentational hints](https://html.spec.whatwg.org/multipage/rendering.html#presentational-hints). BEM and similar class methods are widespread; the toolkit prefers elements and attributes, and accepts a class convention only as a project's stated ruling.

## Modern colour

**What good looks like**
- Colours reach components as tokens; derived colours (a translucent fill, a hover tint) are computed from a token in CSS, not typed as a second literal.
- Derivation happens in a perceptual space (OKLCH or Oklab).

**How**
- **`oklch()`** expresses a colour in Oklab with polar chroma and hue; `L` "is the perceived lightness" ([MDN `oklch()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch), Baseline widely available since May 2023). Generating ramps is the `oklch-color-scale-system` skill's job.
- **`color-mix()`** mixes two colours in a stated space, Oklab by default ([MDN `color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix), widely available since May 2023): `color-mix(in oklab, var(--brand) 80%, black)`.
- **Relative colour** takes channels from an origin colour, custom properties included ([MDN, relative colours](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_colors/Relative_colors)): `oklch(from var(--brand) l c h / 50%)`. Guard it with `@supports (color: oklch(from red l c h))`; MDN warns Safari's first implementation used an older draft.
- Prefer a token the design names over a derivation the design never drew; derive only where the design's own state model is a formula (a focus ring tint, a hover overlay).

**Cases**
- A focus ring is the accent at 40% → `color-mix(in oklab, var(--accent) 40%, transparent)` or a relative colour with alpha; one source, so the ring follows a theme change.
- Sass `darken($brand, 10%)` in a legacy sheet → replace with `color-mix()` on the token; Sass's HSL maths is not perceptual and cannot read a custom property.
- A design has a hover token and the code computes a tint instead → use the token; a derivation that disagrees with the design is a parity difference.

**Accessibility**
- A derived colour must still meet contrast: WCAG 2.2 1.4.3 Contrast (Minimum), 1.4.11 Non-text Contrast. Measure the computed result, not the token pair; see the opacity candidate in [candidates.md](candidates.md).

**Check**
- *Script:* `tools/css-lint/lint.mjs` *literal is a token* and *literal reason* (code-standard rule 22) catch a typed colour; could flag `darken()`/`lighten()` in Sass.
- *Judgement:* Does the design name this colour, or is the code inventing a step?

**Sources:** MDN as linked. The sources agree; the toolkit derives only where the design states a formula.

## Sass modules

**What good looks like**
- Sass is used for its module system, build-time maths, mixins that expand to more than they cost, and loops that generate a known set.
- `@use` and `@forward` only; no `@import`.
- A folder of mixins and functions emits no CSS.

**How**
- **`@import` is deprecated.** "As of Dart Sass 1.80.0, the `@import` rule is deprecated and will be removed from the language in Dart Sass 3.0.0" ([Sass `@import`](https://sass-lang.com/documentation/at-rules/import/)); the team said it would wait "at least two years" from October 2024 ([Sass blog](https://sass-lang.com/blog/import-is-deprecated/)), a window that has now passed. Treat it as removed.
- **Modules load once.** "`@use` only ever loads each file once" ([Sass `@use`](https://sass-lang.com/documentation/at-rules/use/)), so every partial `@use`s what it needs; the old "import abstracts once in main" pattern leaves members out of scope.
- **Namespaced by default** (`bp.$md`); `as *` only for a module with distinctive names. Members starting with `-` or `_` "won't be part of a module's public API". A folder's `_index.scss` with `@forward` is its single entry point.
- **Migrate** with `sass-migrator module --migrate-deps <entry>` ([Sass migrator](https://sass-lang.com/documentation/cli/migrator/)), then read its diff: it cannot know which globals were meant to be public.

| Was Sass | Is now CSS | Note |
|---|---|---|
| `$variables` for design values | custom properties | which is which: [tokens](tokens.md#custom-properties-or-sass-variables) |
| `darken()` / `lighten()` | `oklch()`, `color-mix()` | perceptual, and works on custom properties |
| `@extend` | a layer, a knob, or repetition | `@extend` reorders output |
| nesting | CSS nesting | same limits either way |
| media-query mixin | still Sass | one place per breakpoint name ([tokens](tokens.md#custom-properties-or-sass-variables)) |
| `math.div`, unit maths | still Sass | build time, no runtime cost |

**Cases**
- A partial uses `$md` without `@use` and compiles only because main imported it first → `@use "../tokens/breakpoints" as bp;` in the partial; under modules nothing leaks in.
- `@use "abstracts"` starts emitting a rule → find the stray rule; every file that uses the module now duplicates it.
- The focus ring offset is typed five ways in one codebase → the scaffold's `focus.ring($clear)` mixin; one geometry, one place ([figma-handoff: focus rings](figma-handoff.md#focus-rings-reading-their-geometry) reads `$clear` off the frame).
- A single-edge outside stroke is wanted → the scaffold's `hairline.below($width)` draws an outer shadow offset by its width, taking no room, where a border would add a pixel and an inset shadow would cover the last one.

**Accessibility**
- The focus mixin exists so every control draws one ring: WCAG 2.2 2.4.7 Focus Visible, 1.4.11 Non-text Contrast; [accessibility.md](accessibility.md) owns the ring.

**Check**
- *Script:* could flag `@import` in a `.scss`/`.sass` file and any CSS output from an abstracts module. `tools/toolkit-check/twins.mjs` fails a project copy of a scaffold mixin (registered as `scaffoldOwn` in `tools/toolkit-check/owned.json`) whose signature leaves the scaffold's.
- *Judgement:* Does this Sass feature do something CSS cannot?

**Sources:** Sass documentation as linked. The sources agree.

## Organising files

**What good looks like**
- One entry file that declares layers and loads partials, in cascade order, and does nothing else.
- One file per component, named after it; a folder of mixins that emits nothing.
- Generated token files sit apart and are never edited (code-standard rule 23).

**How**
- A working shape, in the frontend-build scaffold's names:

```
index.sass        layers declared, partials loaded, nothing else
tokens/           GENERATED (tokens.md)
base/             reset, layout, utilities, and mixins that emit nothing
components/<x>/   one folder per component, its sheet named after it
```

- A project keeps the shape it has; what matters is the entry file's order, one owner per component and a mixin folder that emits no CSS. Sass cannot glob, so the scaffold's components list is generated from the component folders (frontend-build's `scripts/sass-entry.mjs`, run by the scaffold's `bin/css`; `--check` diffs it), never written (toolkit-standard §D 23).
- Shared mixins live in the scaffold and are changed there first; a project's copy is a registered twin, not a fork ([frontend-build scaffold](../../skills/frontend-build/assets/design-system-scaffold/design-system/README.md)).

**Cases**
- A documentation table's styles live inside `checkbox.scss`, loaded on every page → move them to the page or docs layer; a component file styles only its component (code-standard rule 5).
- Two components need the same shadow geometry → a mixin in `base/`, or better a token; never a third component file both import.
- A new component is added and its styles never load → its folder holds no partial named after it (`_<name>.sass`), or the list was not regenerated; `bin/css --check` says which.

**Accessibility**
- No criterion bears directly.

**Check**
- *Script:* `tools/tokens/check.mjs` proves generated files are untouched (code-standard rule 23), and the scaffold's `bin/css --check` that the entry's components list is its folders'; `tools/css-lint/lint.mjs` *own parts* catches a component file styling another.
- *Judgement:* Could a newcomer find where a component is styled from its name alone?

**Sources:** the frontend-build scaffold; Sass `@use` as linked. File layout is convention (commentary), not specification.

## Dead CSS

**What good looks like**
- A rule that matches nothing is removed in the change that orphaned it.
- A moved block's selectors move with it (code-standard rule 50).

**How**
- Dead CSS comes from three places: markup that moved (the selector names an old parent), a component deleted without its sheet, and states nobody can reach.
- Chrome's Coverage panel lists unused bytes per stylesheet, but it records only what loaded and what you clicked during the session ([Chrome DevTools, Coverage](https://developer.chrome.com/docs/devtools/coverage)). A rule for an error state you never triggered reads as unused. Treat it as a list to investigate, never a list to delete.
- Grep the compiled sheet for a selector, then grep the templates for what it names; a selector with no match in any template is the stronger signal.

**Cases**
- A refactor moves the search form from the header to the sidebar → grep the compiled CSS for `header` rules naming it, in the same change (code-standard rule 50); the old rule matches nothing and nothing reports it.
- Coverage reports 70% of a sheet unused on the home page → most of it is other pages and other states; check selectors against templates before cutting.
- A component is removed from the library → remove its sheet, its line in the entry file and its stories together.

**Accessibility**
- Deleting a rule for a state you could not reach can delete a focus or error style: WCAG 2.2 2.4.7, 3.3.1 Error Identification. Drive the state before deleting.

**Check**
- *Script:* could compare compiled selectors with the attributes and elements the templates render; none exists yet.
- *Judgement:* Which state or page would this rule serve, and can you reach it?

**Sources:** [Chrome DevTools, Coverage](https://developer.chrome.com/docs/devtools/coverage).

## Utilities

**What good looks like**
- The utilities layer is short and carries behaviour, not looks.
- Anything visual belongs to a component or a layout primitive.

**How**
- The two classes code-standard rule 6 allows sit in the last layer, so they win; the visually hidden ruleset is [accessibility: hidden content](accessibility.md#hidden-content).
- CUBE CSS defines a utility as "a CSS class that does one job and does that one job well," generated from tokens to move repetition into the HTML ([CUBE CSS, utility](https://cube.fyi/utility.html)). That is a coherent method, and it conflicts with code-standard rule 6: the toolkit styles by element and attribute, so a spacing or colour class has no place.
- A layout need that repeats (a stack, a cluster) is a layout component (code-standard rule 11), not a class.

**Cases**
- A page wants `.mt-4` above one heading → use the layout component's gap or a knob; a margin class is a look written into the markup.
- Screen-reader-only text → `visually-hidden`, in the utilities layer, so no component can unhide it by accident.
- A project already ships token utilities as its stated method → record it in the context document as a ruling; the gates read the project's facts, and the rest of this page still holds.

**Accessibility**
- `visually-hidden` must stay readable by assistive technology (no `display: none`): WCAG 2.2 1.3.1 Info and Relationships. code-standard rule 18 for icon-only names.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *a state is a pseudo-class* refuses a state spelled as a class; could flag any class in the utilities layer beyond the two.
- *Judgement:* Would removing this class change what the page does, or only how it looks?

**Sources:** [CUBE CSS](https://cube.fyi/utility.html). Sources disagree: utility-first methods put visual classes in markup; the toolkit goes with code-standard rule 6 and keeps utilities to behaviour.
