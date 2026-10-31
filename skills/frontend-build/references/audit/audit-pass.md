# The audit pass

The judgement half of an audit, after the mechanical checks have run (SKILL.md, *Audit*). It applies `standards/design-standard.md` and `standards/code-standard.md` and restates neither: each line below is a question, and the rule it asks about is named by handle. Read the rule before raising a finding against it. Work on what a person sees: the frames, or screenshots of the page at phone and desktop width in both themes.

## 1. The principles

Walk design-standard's *Principles* as questions of the whole screen. A "no" is a finding only when a rule names it; otherwise it is a recommendation, with the knowledge page that supports it.

## 2. design-standard, area by area

The rules a script cannot settle, by handle; read each before raising a finding against it. The mechanical halves are `tools/ui-check/check.mjs`'s and have already run.

- **UX:** design-standard rule 1.
- **Interaction:** the halves marked *needs a read* in design-standard rules 3, 4 and 5, and design-standard rule 6.
- **Visual:** design-standard rules 7, 8 and 9.
- **Content:** design-standard rules 10 and 11.
- **Accessibility:** on a design, figma-standard rules 26, 31 and 32 (checked by `figma-components-audit`); on a build, code-standard rules 2, 14–19 and 64.
- **The depth:** the fundamentals in `knowledge/ui/design/` and the patterns in `knowledge/ui/patterns/` (toolkit repo) that the screen uses, each section's *Check* line and its cases. A practice there is the default the screen is held to: a deviation is a finding cited by page and section, unless the project records a ruling; only a rule is cited as a breach.
- **The profile** the page belongs to (`knowledge/ui/profiles/documentation.md`, `knowledge/ui/profiles/dashboards.md`, or `knowledge/ui/patterns/forms.md`), and what it says such a page must specify.

## 3. code-standard's *needs a read* rules

On a build, after `tools/project-check/check.mjs`: code-standard rules 1 (markup stands alone), 2 (DOM order is reading order), 3 (one container per band) and 7 (prose scale), and every other rule whose evidence line says **needs a read**. `bin/closing` lists the ones a change touches.

- **The depth:** the pages in `knowledge/code/` (toolkit repo) for what the build touches, each section's *Check* line and its cases. As with the design pages, a practice no rule states is a recommendation with its source, never a breach.

## Symptoms

| Symptom | Usual cause | Fix |
|---|---|---|
| A property is simply not applied, no error | `var(--name)` typo, or the token was never emitted | The generator exits non-zero on unresolved aliases; run it. For a hand-written `var()`, give it a fallback while debugging: `var(--x, magenta)` |
| Page paints in the wrong theme, then corrects | theme applied by a deferred script | Apply the stored theme to `<html>` in a blocking inline script before first paint |
| Horizontal scrollbar on mobile only | a fixed width, a long unbroken string, or `100vw` inside a scrollbar-bearing page | `overflow-wrap: anywhere`; `minmax(min(16rem,100%), 1fr)`; use `100%` not `100vw` |
| A grid overflows its container below ~400px | `minmax(16rem, 1fr)` without the `min()` guard | `minmax(min(16rem, 100%), 1fr)` |
| Full-height section has a hidden bottom edge on phones | `100vh` includes the retracting browser chrome | `100dvh`, or `100svh` for the conservative case |
| A container query never matches | `container-type` set on the queried element itself | Move it to the parent; you query the container, not the component |
| Layout collapses after adding `container-type: inline-size` | it makes block size independent of contents in that axis | Set an explicit height, or use `container-type: normal` and query something else |
| Everything jumps when an element gets focus | missing `scroll-margin-top` under a sticky header | Add it, sized to the header |
| Utility class does nothing | a component rule with higher specificity | Cascade layers — `@layer components, utilities` |
| One rule overrides everything and nothing explains why | it is unlayered; unlayered beats every layer | Put it in a layer |
| Styles break when markup moves | the stylesheet encodes the DOM through deep nesting | Flatten to two levels; style by class, not by descent |
| Grepping a class name finds markup but no CSS | `&__element` concatenation in Sass | Write the full class at the top level |
| Text overflows a button at larger font sizes | fixed height on a text container | Padding, not height (also WCAG 1.4.12) |
| Layout shifts as images load | no intrinsic size reserved | `width`/`height` attributes on `<img>` plus `height: auto` in CSS |
| Focus ring invisible on one variant | ring colour has under 3:1 against that surface | Clear the ring off the surface with `focus.ring($clear)`, and check the token against both surfaces |
| Design change needs edits in many files | literal values in components | The value belongs in the token layer |
| A fix reappears after the next export | someone hand-edited generated CSS | Fix the source tokens, regenerate |
| Animation runs for users who asked for less motion | no `prefers-reduced-motion` block | Add the global block in `base/` |
| Screen reader reads a filename | `<img>` with no `alt` attribute | `alt="…"`, or `alt=""` if decorative |

## Before calling it done

**Build**
- [ ] Every literal is a token or carries its reason (code-standard rule 22).
- [ ] No `@import` in Sass; every partial `@use`s what it needs.
- [ ] The folder of mixins and functions (`abstracts/`, or the scaffold's `base/` mixins) emits zero CSS.
- [ ] Cascade layer order declared once, at the top; nothing unlayered (code-standard rule 4).
- [ ] Generated files are generated, not hand-edited, and the generator exits 0.

**Responsive**
- [ ] Resize continuously from 320px to 2560px — not just at the breakpoints. Nothing overlaps, overflows or leaves an orphaned line.
- [ ] Zoom to 200% and 400%; content reflows without horizontal scrolling.
- [ ] Real content, not design content: longest label, empty state, missing image, 60-character word.

**Accessibility**
- [ ] One full journey by keyboard only.
- [ ] `:focus-visible` visible on every interactive element, on every surface it appears on.
- [ ] Heading outline reads sensibly on its own.
- [ ] `tools/ui-check/check.mjs` clean on every page type, and an automated accessibility scan (axe or Lighthouse) where one is available.
- [ ] One page read by a screen reader.
- [ ] Contrast checked at the token level, both themes.

**Weight**
- [ ] No dependency added that a dozen lines of CSS would have covered.
- [ ] Fonts subset, `font-display: swap`, preloaded if above the fold.
- [ ] Images sized and in a modern format; `loading="lazy"` below the fold only.

## The simplicity questions

Ask these of any code that feels like effort. All four have caught real overbuilding:

1. **What breaks if I delete this?** If the answer is "nothing visible", delete it. This applies hardest to wrapper divs, utility classes used once, and abstractions with one caller.
2. **Does the platform already do this?** Dialogs, disclosure, form validation, lazy loading, smooth scrolling, sticky positioning and dark mode are all native now. A dependency for any of them is a maintenance liability bought for nothing.
3. **Is this responsive rule stating the design twice?** If a value appears in the base rule and again in a media query, an intrinsic function (`clamp`, `minmax`, `min`) probably states it once.
4. **Would a new developer find this by grepping the obvious word?** If not, the name is wrong — and the name is cheaper to fix now than the confusion is later.
