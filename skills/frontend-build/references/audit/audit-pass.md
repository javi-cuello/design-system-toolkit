# The audit pass

The judgement half of an audit, after the mechanical checks have run (SKILL.md, *Audit*). It applies `standards/design-standard.md` and `standards/code-standard.md` and restates neither: each line below is a question, and the rule it asks about is named by handle. Read the rule before raising a finding against it. Work on what a person sees: the frames, or screenshots of the page at phone and desktop width in both themes.

## 1. The principles

Walk design-standard's *Principles* as questions of the whole screen. A "no" is a finding only when a rule names it; otherwise it is a recommendation, with the knowledge page that supports it.

## 2. design-standard, area by area

The rules a script cannot settle, by handle; read each before raising a finding against it. The mechanical halves are `tools/ui-check/check.mjs`'s and have already run.

- **UX:** design-standard rules 1 and 14 (with no design file, were the values taken from the knowledge pages, each as far as its weight carries?).
- **Interaction:** the halves marked *needs a read* in design-standard rules 3, 4 and 5, and design-standard rule 6.
- **Visual:** design-standard rules 7, 8 and 9.
- **Content:** design-standard rules 10 and 11.
- **Accessibility:** on a design, figma-standard rules 26, 31 and 32 (checked by `figma-components-audit`); on a build, code-standard rules 2, 14–19 and 64.
- **The depth:** the fundamentals in `knowledge/ui/design/` and the patterns in `knowledge/ui/patterns/` (toolkit repo) that the screen uses, each section's *Check* line and its cases. A practice there is the default the screen is held to: a deviation is a finding cited by page and section, unless the project records a ruling; only a rule is cited as a breach.
- **The profile** the page belongs to (design-standard's *Application profiles* names each and its page in `knowledge/ui/profiles/`), and what it says such a page must specify.

## 3. code-standard's *needs a read* rules

On a build, after `tools/project-check/check.mjs`: code-standard rules 1 (markup stands alone), 2 (DOM order is reading order), 3 (one container per band) and 7 (prose scale), and every other rule whose evidence line says **needs a read**. `bin/closing` lists the ones a change touches.

- **The depth:** the pages in `knowledge/code/` (toolkit repo) for what the build touches, each section's *Check* line and its cases. As with the design pages, a practice no rule states is a recommendation with its source, never a breach.

## Symptoms

A symptom in a build is traced in the knowledge page that owns the property, each with its cause and fix: overflow, viewport units, container queries and reflow in [responsive](../../../../knowledge/code/responsive.md); layers, nesting, custom properties and Sass modules in [css-architecture](../../../../knowledge/code/css-architecture.md); themes, literals and generated files in [tokens](../../../../knowledge/code/tokens.md); images and fonts in [performance](../../../../knowledge/code/performance.md); focus and reduced motion in [accessibility](../../../../knowledge/code/accessibility.md); `alt` in [html-semantics](../../../../knowledge/code/html-semantics.md).

## Before calling it done

Each line is a question; the answer, and what good looks like, is the linked knowledge section.

**Build**
- [ ] Every literal a token or carrying its reason? ([tokens: literals with reasons](../../../../knowledge/code/tokens.md#literals-with-reasons))
- [ ] Sass modules only, and the mixins folder emits nothing? ([css-architecture: Sass modules](../../../../knowledge/code/css-architecture.md#sass-modules))
- [ ] Layer order declared once, nothing unlayered? ([css-architecture: cascade layers](../../../../knowledge/code/css-architecture.md#cascade-layers))
- [ ] Generated files untouched by hand, the generator exiting 0? ([tokens: generated, never hand-written](../../../../knowledge/code/tokens.md#generated-never-hand-written))

**Responsive**
- [ ] Resized continuously, and zoomed to 200% and 400%? ([responsive: zoom and reflow](../../../../knowledge/code/responsive.md#zoom-and-reflow))
- [ ] Real content, not design content? ([testing: fixtures](../../../../knowledge/code/testing.md#test-fixtures-as-one-module), [responsive: intrinsic layout](../../../../knowledge/code/responsive.md#intrinsic-layout-first))

**Accessibility**
- [ ] One journey by keyboard only, and one page by screen reader? ([accessibility: testing with a keyboard and a screen reader](../../../../knowledge/code/accessibility.md#testing-with-a-keyboard-and-a-screen-reader))
- [ ] Focus visible on every surface? ([accessibility: visible focus](../../../../knowledge/code/accessibility.md#visible-focus))
- [ ] The heading outline reads on its own? ([html-semantics: headings](../../../../knowledge/code/html-semantics.md#headings-and-the-outline))
- [ ] `tools/ui-check/check.mjs` and an automated scan clean, and their limits known? ([testing: automated checks](../../../../knowledge/code/testing.md#automated-accessibility-checks-and-their-limits))
- [ ] Contrast checked at the token level, in both themes? ([visual: theming and dark mode](../../../../knowledge/ui/design/visual.md#theming-and-dark-mode))

**Weight**
- [ ] No dependency the platform or a few lines cover? ([javascript: the platform before a library](../../../../knowledge/code/javascript.md#the-platform-before-a-library))
- [ ] Fonts and images as the performance page says? ([performance: fonts](../../../../knowledge/code/performance.md#fonts), [images](../../../../knowledge/code/performance.md#images))

## The simplicity questions

Ask of any code that feels like effort; each rests on design-standard's *Principles* (*As little as possible*) and code-standard rule 28:

1. **What breaks if I delete this?** Nothing visible: delete it.
2. **Does the platform already do this?** ([javascript: the platform before a library](../../../../knowledge/code/javascript.md#the-platform-before-a-library))
3. **Is this responsive rule stating the design twice?** ([responsive: intrinsic layout first](../../../../knowledge/code/responsive.md#intrinsic-layout-first))
4. **Would a newcomer find this by grepping the obvious word?** ([css-architecture: naming](../../../../knowledge/code/css-architecture.md#naming))
