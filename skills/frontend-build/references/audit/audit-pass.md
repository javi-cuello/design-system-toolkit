# The audit pass

The judgement half of an audit, after the mechanical checks have run (SKILL.md, *Audit*). It applies `standards/design-standard.md` and `standards/code-standard.md` and restates neither: each line below is a question, and the rule it asks about is named by handle. Read the rule before raising a finding against it. Work on what a person sees: the frames, or screenshots of the page at phone and desktop width in both themes.

## Contents

- [1. The principles](#1-the-principles)
- [2. design-standard, area by area](#2-design-standard-area-by-area)
- [3. code-standard's *needs a read* rules](#3-code-standards-needs-a-read-rules)
- [Symptoms](#symptoms)
- [Before calling it done](#before-calling-it-done)
- [The simplicity questions](#the-simplicity-questions)

## 1. The principles

Walk design-standard's *Principles* as questions of the whole screen. A "no" is a finding only when a rule names it; otherwise it is a recommendation, with the knowledge page that supports it.

## 2. design-standard, area by area

The rules a script cannot settle, by handle; read each before raising a finding against it. The mechanical halves are `tools/ui-check/check.mjs`'s and have already run.

- **UX:** design-standard rules 1 and 14 (with no design file, were the values taken from the knowledge pages, each as far as its weight carries?).
- **Interaction:** the halves marked *needs a read* in design-standard rules 3, 4 and 5, and design-standard rule 6.
- **Visual:** design-standard rules 7, 8 and 9.
- **Content:** design-standard rules 10 and 11.
- **Accessibility:** on a design, figma-standard rules 26, 31 and 32 (checked by `figma-components-audit`); on a build, code-standard rules 2, 14–19 and 64.
- **The depth:** the knowledge pages the screen uses, in `knowledge/ui/design/`, `knowledge/ui/components/` and `knowledge/ui/patterns/` (toolkit repo). Read each section's *Check* line and its cases. A practice there is the default the screen is held to. A deviation is a finding cited by page and section, unless the project records a ruling. Only a rule is cited as a breach.
- **The profile** the page belongs to (design-standard's *Application profiles* names each and its page in `knowledge/ui/profiles/`), and what it says such a page must specify.

## 3. code-standard's *needs a read* rules

On a build, after `tools/project-check/check.mjs`, read these rules:

| Rule | What it asks |
|---|---|
| code-standard rule 1 | Markup stands alone |
| code-standard rule 2 | DOM order is reading order |
| code-standard rule 3 | One container per band |
| code-standard rule 7 | Prose scale |

Read too every other rule whose evidence line says **needs a read**. `bin/closing` lists the ones a change touches.

- **The depth:** the pages in `knowledge/code/` (toolkit repo) for what the build touches, each section's *Check* line and its cases. As with the design pages, a practice no rule states is a recommendation with its source, never a breach.

## Symptoms

Trace a symptom in a build to the knowledge page that owns the property. Each page gives the cause and the fix.

| Symptom | Knowledge page |
|---|---|
| Overflow, viewport units, container queries, reflow | [responsive](../../../../knowledge/code/responsive.md) |
| Layers, nesting, custom properties, Sass modules | [css-architecture](../../../../knowledge/code/css-architecture.md) |
| Themes, literals, generated files | [tokens](../../../../knowledge/code/tokens.md) |
| Images, fonts | [performance](../../../../knowledge/code/performance.md) |
| Focus, reduced motion | [accessibility](../../../../knowledge/code/accessibility.md) |
| `alt` | [html-semantics](../../../../knowledge/code/html-semantics.md) |

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
