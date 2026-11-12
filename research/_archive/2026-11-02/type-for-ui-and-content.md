# Type for UI and long-form content

One type scale for a product's interface and its articles, how the two read differently from the same list of sizes, and what changes when the screen is a phone.

Researched November 2026. Sizes, line heights, gaps and breakpoints were read from source rather than from documentation pages wherever source exists: GOV.UK Frontend 6.6 (`_typography-responsive.scss`, `_spacing.scss`, the typography, list and section-break mixins, and the changelog), USWDS (`uswds-core` settings and tokens, `usa-prose`), Carbon's `@carbon/type` (`styles.ts`, `scale.ts`, `fluid.ts`) and `@carbon/layout` breakpoints, Material Web's generated `md-sys-typescale` tokens, Apple's Human Interface Guidelines data file (the Dynamic Type tables and the SF tracking table), `@adobe/spectrum-tokens` 15.6, `@primer/primitives` 11.10, `@shopify/polaris` 13.9 and its tokens, `@fluentui/tokens`, `@radix-ui/themes`, Elastic's `EuiText` source, `github-markdown-css` and `tailwindcss-typography`. Browser support comes from MDN's compatibility data as of 22 October 2026. Atlassian's and Fluent's values come from their documentation pages, because their published packages expose the same numbers less legibly. Two measurements are this guide's own, made from the Inter 4.1 font file with fontTools: the optical-size axis range and the characters per line Inter sets at a given measure. The starting point was the toolkit knowledge base's sections on [typography](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/visual.md#typography) and [type for UI and long-form content](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/visual.md#type-for-ui-and-long-form-content); where that page already says something in full, this guide links to it instead of repeating it.

---

## What this answers

The argument of this piece fits in two sentences. A product needs one size scale, walked in two strides: interface text steps through adjacent sizes, reading text through every other one, and the difference lives in line height and in a prose container rather than in a second scale. On a phone the stride shortens rather than the scale changing: small text holds its size, large text comes down, and the large gaps come down with it.

The questions that lead there, roughly in the order they come up:

- Does long-form content need its own scale, or a different walk through the same one?
- How do you build a scale both can use, and why publish it as a list?
- Is line height set per role, or snapped to a 4px grid per size?
- Where does the space between paragraphs and headings come from, and is a baseline grid worth it?
- Who owns that space: a prose container or the layout components?
- Should sections carry a divider, and how is it spaced?
- What do tracking and optical sizes do once a face has a display cut?
- Which weight belongs to which role?
- How should code sit inside prose?
- What changes on a phone: sizes, body text, gaps, line height?
- How is any of this drawn in Figma, which has no space-before?
- What should the styles be called?

Section 13 applies all of it to one real scale. Section 14 is the cheat sheet and section 15 the short version.

---

## 1. One scale, or a UI scale and an editorial scale?

**The short answer.** One scale. Almost every mature system ships a single list of sizes and lets long-form content take a looser, wider-spaced subset of it. The one system famous for two sets, Carbon, merged them.

The question arrives the first time a product grows a blog, a help centre or a job description. The interface was built at 14 and 16 pixels with tight line heights, and an article set in those styles reads like a settings panel. The tempting fix is a second scale, an "editorial" one, with its own sizes. What shipping systems do instead is keep the sizes and change two other things: which sizes long-form content reaches for, and how loosely they are set.

Atlassian states the split most plainly. Its scale has three body sizes, and its documentation names Body L (16/24) as the default for long-form content while Body M (14/20) is the size used in components. Nothing about the scale itself changes; content simply sits one step higher. Apple does the same thing with a mechanism rather than a size: a text style can take a loose-leading trait, which the guidelines recommend for wide columns and long passages, and a tight one for height-constrained list rows. Spectrum puts the split into two named line heights, `line-height-100: 1.3` for component text and `line-height-200: 1.5` for body copy, over one set of sizes.

Carbon is the counter-example, and its history is the strongest evidence for the consensus. Carbon v10 shipped a productive type set for product screens and an expressive set for editorial and marketing pages, distinguished by suffixes in the token names. Version 11 merged them into one collection and renamed the distinction by behaviour instead: Fixed styles hold their size at every breakpoint and Fluid styles interpolate between breakpoints (the [typography naming guide](typography-naming.md) tells that migration in full). Even before the merge the two sets overlapped heavily; `body-01` at 14px and `body-02` at 16px came from the same underlying scale function in `scale.ts`, which generates 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48 and so on for both.

| System | Sizes | How long-form content differs |
|---|---|---|
| GOV.UK | one scale: 16, 19, 24, 27, 36, 48, 80 | none: the whole service is content, body 19 everywhere |
| Atlassian | one scale, body 12/14/16 | Body L (16/24) for long-form, Body M (14/20) in components |
| Carbon | one generated scale, two style groups | `body-02` 16/1.5 against `body-01` 14/1.43; Fluid styles for editorial headings |
| Material 3 | one fixed set of 15 roles | no long-form layer; `body-large` 16/24 is the largest body |
| Apple | one set of text styles | loose-leading trait for long passages |
| Primer | one scale: 12, 14, 16, 20, 32, 40 | Markdown rendered in a separate prose container |
| Spectrum | one scale per platform | `line-height-200` 1.5 for body, `line-height-100` 1.3 for components |
| USWDS | one system scale, 10 to 140px | `usa-prose` container, body line height 1.62 |
| Radix Themes | one nine-step scale, 12 to 60px | none built in; size chosen per `Text` |
| Polaris | one scale, admin-first | headings step down on small screens (section 10) |
| Fluent 2 | one ramp per platform | none: body 14/20 on web, 17/22 on iOS, 16/24 on Android |

None of these systems is independent of the others in every respect, but on this question they have no shared origin. GOV.UK's scale predates most of them, Apple's is a platform's own, and Carbon arrived at one scale by retreating from two. That is independent convergence, which counts for more than eleven systems nodding at each other.

The cost of one scale is real and worth naming. A reading page wants generous steps between heading levels, and a dense tool wants small ones; one list has to contain both, so it needs more entries than either would alone, and someone has to say which entries each context uses. A second scale removes that bookkeeping, and pays for it when a component lands inside an article and has to choose which scale it belongs to. That moment arrives constantly: a card in a blog post, a callout in documentation, a form in a help article.

**What to do.** Keep one scale and give long-form content two different things: a higher body size and a looser line height, documented as the content role. This is industry consensus, reached independently. A second scale earns its place only where the editorial surface has its own team and its own typeface, which is the situation Carbon's expressive set was built for and later folded back.

---

## 2. How do you build a scale both can use?

**The short answer.** Pick a ratio, let components step through adjacent sizes and content through every other one, then round to whole pixels and publish the rounded list. Any size that departs from the formula is named as an exception.

A geometric scale multiplies a base size by a fixed ratio at each step. At a base of 16 and a ratio of 1.125 (a major second), the steps run 14.2, 16, 18, 20.3, 22.8, 25.6, 28.8, 32.4, 36.5, 41.1, 46.2. The ratio is what gives every size a reason: no number in the list was typed because it looked about right.

The useful property is what happens when you skip steps. Two steps of 1.125 multiply to about 1.27, which is close to the ratios long-form systems use between heading levels: GitHub's Markdown headings sit at 1, 1.25, 1.5 and 2 times the body, and GOV.UK's content run of 19, 24, 36 and 48 climbs by roughly 1.26 to 1.5. So a small ratio does both jobs. Components move one step at a time, where a 14 label beside a 16 value is a meaningful difference at arm's length; content moves two steps at a time, where an h3 has to look unmistakably larger than the paragraph under it. The same list of sizes serves both, walked with different strides.

The list must then be rounded, and rounding is where a formula stops being a specification. Rounding 16 × 1.125ⁿ to whole even pixels produces 26, 32 and 42 as well as 28 and 36; a team that keeps only some of them has made a choice the formula does not record. Carbon solves this by publishing its scale as code, a function in `scale.ts` that adds a growing increment rather than multiplying, which is why its list reads 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 54, 60. USWDS publishes a literal map from step 1 at 12px to step 20 at 140px. Both make the same point: the published artefact is the list, and the ratio is its rationale.

A size chosen off the formula is fine when it is named. A round 48 where the formula gives 46, or a 72 where it gives 74, buys a number people can remember and match elsewhere. The cost appears only when nobody wrote it down: the next person to extend the scale recomputes the formula, gets 46, and now the system has both.

Two traps recur here.

- **Steps too close to see.** A dashboard using 13, 14 and 15px for three label levels has three styles nobody can tell apart. The knowledge base's [one size scale per screen](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/visual.md#one-size-scale-per-screen) covers the fix: collapse to two sizes and separate them by weight or colour.
- **A ratio applied to content's stride as well.** A team picks 1.25 for its headings, then lets content skip steps as well, and the h2 lands at 1.56 times the h3. Pick the ratio for the interface's single step; content's double step follows from it.

**What to do.** Choose a small ratio (1.125 or 1.2) for the interface's adjacent steps, let content take every other step, round once, and publish the list with each off-formula size marked as a named exception. The stride idea is this guide's synthesis of what the systems ship; publishing the list rather than the formula is what Carbon and USWDS both do.

---

## 3. Is line height set by role, or stepped onto a 4px grid?

**The short answer.** Both ship. Setting it by role (one value for reading text, one for labels, one for headings, one for display) costs nothing in rhythm and survives any size; stepping each size onto a 4px grid buys whole-pixel boxes at the price of a lookup table. Either way, code takes a unitless number.

The unit question, why Figma's 150% becomes `line-height: 1.5` and never `150%`, is covered in full in [line height and letter spacing, from Figma to the browser](line-height-letter-spacing-figma-to-css.md). The question here is what decides the number.

Role-based systems ship a handful of ratios. Primer's base tokens are `--base-text-lineHeight-tight: 1.25`, `snug: 1.375`, `normal: 1.5`, `relaxed: 1.625`, and every functional style picks one: body large and medium take `normal`, display takes `snug`. Spectrum has two, 1.3 and 1.5. USWDS has six system values from 1 to 1.75, with headings at 1.2 and body at 1.62. GOV.UK writes its line heights in pixels in the Sass map but converts each to a ratio before output, and the ratios fall by role: 1.32 for the 19px body, about 1.1 for the 36px and 48px headings.

Grid-stepped systems write each size's line height as a length. Material's tokens are rem lengths: `body-large` 1rem on 1.5rem, `title-large` 1.375rem on 1.75rem, `display-large` 3.5625rem on 4rem, every one a multiple of 4px. Radix Themes does the same in pixels (12/16, 14/20, 16/24, 18/26, 24/30). Fluent's web tokens pair `fontSizeBase300: 14px` with `lineHeightBase300: 20px`. What this buys is a box height that is always a whole multiple of 4, so a list row or a button lands exactly where the layout grid says. What it costs is a per-size table, and a ratio that wanders: Radix's 18/26 is 1.44 and its 24/30 is 1.25, so two adjacent sizes do not read as one family.

The two approaches agree on the shape even where they disagree on the mechanism. Line height falls as size rises, because the gap between lines is measured in the font's own units and a 48px heading at 1.5 opens a gap wider than a line of body text. The knowledge base's [typography section](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/visual.md#typography) collects the specialist ranges: about 1.5 for reading text, 1.2 to 1.3 for one-line UI text, 1.1 to 1.2 for headings.

WCAG 1.4.12 Text Spacing is the reason the unit matters beyond tidiness. A reader may override line height to 1.5 times the font size, paragraph spacing to twice the font size and letter spacing to 0.12em, and the page must survive it. A unitless line height inherits as a ratio, so an override on the body flows into every descendant correctly; a fixed-height box around text (a card title clipped at 48px, a code block with a set height) is what breaks. Material's rem lengths pass in practice, because the override replaces them outright, but they do not inherit as ratios, which is the bug the sister guide on line-height units works through.

**What to do.** Set line height by role, four values at most: reading text, labels and other one-line UI text, headings, display. Ship them unitless. Grid-stepping is defensible in a dense tool whose rows must land on a 4px grid, and that is the constraint to name if you choose it. Both approaches are established; the preference for roles is this guide's judgment, on the grounds that four numbers are easier to keep than a table.

---

## 4. Where does the space between prose elements come from?

**The short answer.** From spacing tokens, not from a baseline grid. Every system read for this guide spaces prose with a handful of fixed gaps: one between paragraphs, a smaller one between list items, a larger one above each heading level and a small one below it.

Vertical rhythm, in its strict form, means every line of every block sits on a grid derived from the body line height, so that baselines align across columns the way they do in print. CSS makes that hard. A line box centres its text in half-leading above and below, so a 22px heading at 1.2 and an 18px paragraph at 1.5 put their baselines at different offsets inside boxes of different heights, and snapping both to a 27px grid needs fractional margins nobody can maintain. The knowledge base records one specimen where the derived gap below a heading came to 6.9px. Zell Liew, who wrote the most thorough account of doing it anyway, concluded that perfect responsive vertical rhythm across browsers is impossible.

What ships instead is a short list of gaps, and the systems disagree less than their syntax suggests:

| System | Body | Paragraph gap | h2 above / below | h3 above / below | List item gap |
|---|---|---|---|---|---|
| GOV.UK (desktop) | 19 | 20 | 40 / 30 | 30 / 20 | 5 |
| USWDS `usa-prose` | 16 | 16 | 48 / 16 | 33 / 16 | 4 |
| GitHub `markdown-body` | 16 | 16 | 24 / 16, plus a rule | 24 / 16 | 4 |
| Tailwind `prose-lg` | 18 | 24 | 56 / 32 | 40 / 16 | not read |

Each row comes from source, and each system builds its numbers differently. USWDS sets `* + * { margin-top: 1em }` and gives headings `margin-top: 1.5em` in their own font size, so a 32px h2 gets 48 above and the paragraph after it gets 16. GitHub gives every heading level the same 24 above and 16 below. GOV.UK puts margin only on the bottom of each element and adds padding to the top of a heading when it follows a paragraph or a list: a `govuk-heading-l` after a paragraph sits under the paragraph's 20px margin plus its own 20px padding, 40 in all.

Two patterns survive the disagreement. The paragraph gap is roughly one body line or a little under it (Butterick's range is half to the whole of the body size; GOV.UK's 20 sits under a 25px line, USWDS's 16 under a 26px one). And the space above a heading is larger than the space below it, so the heading reads as the start of what follows rather than the end of what came before. How much larger varies more than the commentary implies: Better Web Type asks for at least twice, USWDS gives three times, GOV.UK only 1.33. The rule that matters is the one GOV.UK and USWDS both keep: every heading's space above must clearly exceed the paragraph gap, or a short bold heading reads as a bold paragraph. Tailwind's `prose-lg` holds this down the levels, with h3 at 40 and h4 at 32 against a 24 paragraph gap.

CSS gained two tools that make this easier to express, and one that changes what a gap measures. The `lh` unit is the element's own computed line height and `rlh` the root's; both are in every engine (Chrome 109 and 111, Firefox 120, Safari 16.4), so `margin-block-start: 1lh` gives a paragraph gap of exactly one line without anyone computing 27. The trap is that `lh` on a heading is the heading's line, not the body's, so a heading's margin in `lh` grows with the heading; use `rlh` or a token when the gap should follow the body. And `text-box-trim` (Chrome 133, Safari 18.2, Firefox 154) removes the half-leading above the first line and below the last, so a gap measures from cap height to baseline rather than from line box to line box. It makes Figma and the browser agree more closely; the sister guide covers [what it costs](line-height-letter-spacing-figma-to-css.md).

**What to do.** Space prose from a small set of spacing tokens: one paragraph gap near one body line, one list-item gap a quarter to half of that, and per heading level a gap above that clearly exceeds the paragraph gap and a gap below that is clearly smaller than its own gap above. Skip the baseline grid. That is consensus across every system read; the multipliers are where they differ, and this guide's judgment is that the ordering matters more than the exact ratio.

---

## 5. Who owns that spacing: a prose container, or the layout components?

**The short answer.** In long-form content, a prose container. In an interface, layout components. The two meet at one rule: spacing rhythm stops at a component's edge.

The prose container is one element whose descendants get their gaps from relationships rather than from their own margins. The mechanism is the "lobotomised owl" selector, `* + *`, which gives every element after the first a top margin and leaves the first with none; headings then override it with their larger gap. USWDS's `usa-prose` is the pattern in its plainest form: `& > * + * { margin-top: 1em }`, and `& > * + h2` (and the other levels) `{ margin-top: 1.5em }`, both scoped to direct children. GitHub's `.markdown-body` does the same with explicit margins on each element. Elastic's `EuiText` wraps any content and applies a scaled set of heading, paragraph and list styles, with a constrained measure of `max(64ch, 75%)`. Tailwind's `prose` class is the same idea as a utility.

The pattern exists because Markdown and CMS output arrive as bare elements. A writer types two paragraphs and a heading; nobody is going to add a spacing component between them. The container is the only place the gaps can live, and it has the side benefit of keeping text styles free of margins, so a heading style used inside a card does not drag article spacing in with it.

Interface systems do the opposite, and say so. Atlassian's typography documentation recommends a separate text component per paragraph in code, with the spacing between them set by a Stack; its paragraph spacing values (16 after Body L, 12 after Body M, 8 after Body S) exist only in its Figma text styles. Polaris and Radix space UI text with their own Stack, Flex and Box primitives. In a form or a settings panel that is right: the gaps there belong to the layout, and a margin on the text would fight it.

The two models collide when a component lands inside an article. A callout, a figure with a caption, an embedded card: the owl selector reaches into it and gives every element after its first a top margin, and the component's own internal spacing is now doubled or overridden. Scoping the container's selectors to direct children (`> * + *`, as USWDS does) is the fix, and it states the rule: the article's rhythm reaches the component as one block, with the paragraph gap above and below it; the space inside the component comes from the component's own tokens. The knowledge base's [build note](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/visual.md#type-for-ui-and-long-form-content) gives the selectors.

**What to do.** Put long-form content in one prose container that owns every gap between its direct children, and keep margins off text styles and off components. Inside the container a component is one block; outside it, layout components space the interface. This is consensus: every content-rendering system read uses a container and every interface system uses layout components, and the direct-child scoping is how USWDS keeps them from colliding.

---

## 6. Should major sections carry a divider, and how is it spaced?

**The short answer.** A hairline between major sections is common and optional. Where one is used, it belongs to the section it introduces, so it sits closer to the heading below it than to the paragraph above, and it lives inside the heading's space-above rather than adding to it.

GitHub is the familiar case, and it puts the rule under the heading rather than before it: `.markdown-body h2` carries `border-bottom: 1px solid` and `padding-bottom: .3em`, so every h1 and h2 is underlined, and the space above stays the plain 24. GOV.UK draws its rule as an element: `govuk-section-break--visible` is an `<hr>` with a 1px bottom border, spaced by equal top and bottom margins from the responsive scale (unit 6 for the large break: 30 on desktop, 20 on mobile). Tailwind's `prose` spaces a bare `<hr>` at 48 on each side and resets the top margin of whatever follows it to zero, so a heading after a rule does not add its own gap on top.

That last detail is the spacing question in miniature. If an h2 has 48 above it and a rule is placed before it with margins of its own, the two add, and the section break becomes the largest gap on the page by accident. The two consistent options are a rule drawn by the heading itself (a top border with padding, inside the heading's 48) or a rule element whose following sibling loses its top margin. The rule should also never appear before the first section of an article, where it separates the title from nothing.

Where the rule sits within the gap is a proximity question, and the evidence is thin: GOV.UK centres its rule, GitHub attaches it to the heading. Gestalt proximity argues for attaching it to what it introduces, so the space between rule and heading should be smaller than the space between the previous paragraph and the rule.

**What to do.** If the design uses a divider, draw it as part of the h2 (a top border with padding), so the gap above the heading includes it, and skip it on the first h2. Keep the heading-to-rule distance smaller than the rule-to-paragraph distance. The option exists in every system read; the placement is this guide's judgment from proximity, since no system documents its reasoning.

---

## 7. What do tracking and optical sizes do once a face has a display cut?

**The short answer.** They overlap. A display cut is already drawn tighter, so tracking computed for the text cut must not be applied to it again. Where Figma has to draw what the browser renders, ship the text and display cuts as static families and switch at a named size, because Figma does not apply optical sizing.

Optical sizing means a typeface has different drawings for different sizes: text cuts with a taller x-height, looser spacing and sturdier details for small sizes, display cuts with finer details and tighter spacing for large ones. Inter 4 ships both as static families (Inter and Inter Display) and as one variable font whose `opsz` axis runs from 14 to 32, measured from the 4.1 file. With `font-optical-sizing: auto`, which every engine supports, the browser sets `opsz` to the font size in CSS pixels, so text at 14 and below gets the pure text drawing, text at 32 and above the pure display drawing, and the sizes between get a blend.

Apple's tracking table for SF Pro shows what the two mechanisms do together. Tracking tightens through the text sizes, reaching −26 thousandths of an em at 17pt, then reverses: by 24pt it is positive, and it stays positive through the display sizes before returning to zero at 80pt. SF switches to its display design around 20pt, and the display design is spaced so much tighter that Apple adds space back. New York, a serif without that switch, simply tightens steadily to −16 thousandths at 72pt. The lesson for any face with a display cut is that the text cut's negative tracking curve does not carry over; the toolkit's measurement of Inter Display found its lowercase sidebearings about a quarter narrower than Inter's, which is tracking already applied.

Figma is why the static route still matters. Figma draws a variable font at the instance its axes are set to and does not move `opsz` with size, so a 28px heading in the variable file is the text drawing in Figma and a blend in the browser. Shipping Inter and Inter Display as separate families, and naming the size at which a style switches family, makes both sides draw the same glyphs. The cost is a discrete jump where the variable font would blend, and two families to load.

Rounding is the last point, and it is about keeping values. Inter 3's published "dynamic metrics" formula gave tracking to four decimal places per pixel size; it was fitted to Inter 3, has been withdrawn from the live site, and no reader can see a difference of 0.1%. Stating tracking per text style, rounded to half a percent, gives a value a designer can type in Figma and a reviewer can check. The knowledge base's [tracking notes](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/visual.md#type-for-ui-and-long-form-content) give the full rule.

**What to do.** Use the variable font with `font-optical-sizing: auto` when Figma parity does not matter. When it does, ship static text and display families, switch at a named size inside the axis range, track the text cut by size in half-percent steps, and give the display cut little or none until its largest sizes. The mechanism is documented by Apple and by the font; the static-files trade is this guide's judgment for teams that measure Figma against the browser.

---

## 8. Which weight belongs to which role?

**The short answer.** One weight per role: regular for reading and UI text, semibold for every heading level, and the largest display sizes a step lighter than the headings.

Size sets the level in a heading hierarchy; weight sets the role. If h2 is bold and h3 semibold, a reader gets two signals that disagree about how different the levels are. Primer's functional tokens are the clearest statement of the pattern: `--text-title-weight-large`, `medium` and `small` are all `semibold` (600), `--text-display-weight` is `medium` (500), and `--text-body-weight` is `normal` (400). Carbon goes further at display sizes, setting `fluidDisplay01` and its siblings at its light weight, and Apple's guidance warns against light weights at small sizes for legibility. The reason display goes lighter is optical: at 60px and above a semibold stroke is heavy enough to dominate a page, and the size already carries the emphasis. Atlassian's headings use a custom weight (653) that is neither semibold nor bold, which is a reminder that a weight token is a role, not a number from 100 to 900.

How weight appears in style names is a separate question the [typography naming guide](typography-naming.md) answers.

**What to do.** Give headings one weight, body and UI text another, and display a lighter one than headings. Primer's 400, 600 and 500 is a well-evidenced default. Two text weights plus one display weight is enough for most products.

---

## 9. How should code sit inside prose?

**The short answer.** Inline code at the same size as the sentence when the monospace face's x-height matches the text face's; code blocks a step below the body, so a line holds enough columns. The tinted background on inline code is a code-only effect, because Figma cannot fill a range of text.

The monospace choice is where this starts. A mono face whose x-height is close to the text face's can run at `1em` inline and sit level with the words around it; one with a smaller x-height looks shrunken at the same size and forces a scaled-down `0.875em` or `0.9285em` (Primer's `--text-codeInline-size`), which then looks too small beside capitals. The toolkit's measurement puts JetBrains Mono at 0.550 of the em against Inter's 0.546, a close match; IBM Plex Mono is 0.516 and Source Code Pro 0.478. MDN pairs Inter with JetBrains Mono for that reason.

Blocks are different, because a mono face is wide and a code line cannot wrap without breaking meaning. GitHub sets `pre` at 85% of the body with a line height of 1.45 and 16px of padding; Tailwind's `prose-lg` sets it at 16 on an 18 body, with a line height of 1.75. Primer's code block token is 13px. The shipped cluster sits at 0.85 to 0.89 of the body for content pages: one step down the scale, not two.

Inline code backgrounds are the Figma trap. Figma can colour a range of characters but cannot fill the box behind them, so a tinted chip behind `inline code` exists only in CSS. Designing around it (colour and the mono face carry the distinction in Figma; the tint is a code addition that parity checks waive by name) is honest about the gap.

**What to do.** Choose a monospace by x-height match, run inline code at `1em` when the match holds, set blocks one step below the body, and document the inline tint as a code-only effect. The size cluster is consensus across the content systems read; the x-height test is the toolkit's own method.

---

## 10. What should change on a phone?

**The short answer.** The ratio, not the base. Body text and other small sizes hold; headings and display sizes come down, so the gap between levels narrows; large spacing gaps come down with the headings while small ones hold. Do it in rem at one or two breakpoints, or fluidly with a bounded `clamp()`; either passes WCAG zoom when the shrink is modest.

This is the section where the systems are most varied and the evidence most interesting, because the right answer reversed during the period these systems were built.

### 10.1 What the systems do

| System | Body on a phone | Headings on a phone | Mechanism |
|---|---|---|---|
| GOV.UK 6 | 19 holds (was 16 until 6.0) | 48 → 32, 36 → 27, 27 and 24 → 21, 80 → 53 | stepped, one breakpoint at 641px |
| Carbon | `body-02` 16 holds (Fixed) | `fluid-heading-05` 32 at 320px rising to 60 at 1584px | piecewise linear, rem plus vw, between five breakpoints |
| Polaris (web) | holds | `headingXl` 20 → 24, `heading2xl` 24 → 30, `heading3xl` 30 → 36 from 48em | stepped, one breakpoint |
| Polaris (`p-theme-light-mobile`) | larger: `body-md` 13 → 16, `body-lg` 14 → 18 | smaller or level: `heading-lg` 20 → 18, `heading-xl` 24 → 22, `heading-2xl` 30 → 32 | a theme for the mobile app |
| Tailwind Typography | `prose` 16 → `md:prose-lg` 18 | all headings and gaps scale with the body in em | stepped, author applies modifiers |
| USWDS | holds | hold | none |
| Material 3 | holds | hold | none in the tokens; Android's user font scale |
| Atlassian | holds | hold | none documented |
| Radix Themes | holds | hold unless the author passes a responsive `size` | per-prop responsive objects |
| Apple | 17pt default on iPhone, 13pt on Mac | user-controlled: Dynamic Type | user setting, not viewport |
| Spectrum | larger: 14 → 17 | larger: 28 → 34, 36 → 44 | touch "mobile" scale, about 1.2× |
| Fluent 2 | larger: 14 (web) → 16 (Android), 17 (iOS) | per platform ramp | platform, not viewport |

The rows that make text larger look like a contradiction and are not. Spectrum's "mobile" and Fluent's iOS ramp answer a different question: how big should type be on a device held at 30cm and driven by touch? Bigger, they say, and so does Apple, whose iPhone default body is 17pt against the Mac's 13. The rows above them answer the web's question: how should one page adapt when its viewport narrows? Both questions resolve the same way for body text. Nothing in the table makes reading text smaller on a phone than on a desktop, except Tailwind's default modifier pattern and GOV.UK's old scale, which GOV.UK abandoned.

### 10.2 Small text holds; large text compresses

GOV.UK's history is the clearest case in this guide. Until version 6, its scale shrank everything on small screens: point 19, the body size, rendered at 16px on phones; point 16 rendered at 14; point 14 at 12. In December 2022 the team announced the change, citing service teams' findings that shrinking small text on small screens harms visually impaired users, and the British Dyslexia Association's advice not to go below the equivalent of 16px. Version 5.2 shipped the new scale behind a feature flag in 2024; version 6.0 made it the default and removed point 14 entirely. Today 16 and 19 hold at every width. The large sizes still shrink, and the team's post says why that is fine: large text getting smaller on a small screen does not harm readability and may help it. One source comment in the new map is telling: point 27 is now the same as point 24 on mobile, marked "consider deprecating this size". Compressing a scale's top end makes neighbouring steps collide, and the honest response is to notice.

The platforms that let readers resize text arrived at the same shape from the opposite direction. Apple's Dynamic Type tables show what happens when the reader asks for larger text: at the default size Body is 17pt and Large Title 34pt, a ratio of 2.0; at the largest accessibility size Body is 53pt and Large Title 60pt, a ratio of 1.13. Small text grows a great deal and large text grows a little, so the ratio compresses as text takes up more of the screen. Android 14 builds the same behaviour into the system: its font scaling now reaches 200% along a nonlinear curve, so large text scales more slowly than small text. Polaris's mobile theme does it in tokens: body text rises from 13 to 16 while the large and extra-large headings fall by 2px, so the largest heading goes from 2.3 times the body to 2.0.

A phone is the same situation as a reader choosing larger text: text occupies more of the available width. GOV.UK, Apple and Android all answer it by compressing the top of the scale and protecting the bottom. Carbon's Fixed styles (all body and label text) against its Fluid styles (only editorial headings and display) say the same thing structurally, and Pimp my Type's guidance lands there too: keep body near the browser default on phones, keep an h1 at about twice the body or less, and let desktop headings climb to four times it.

### 10.3 Stepped or fluid, and what zoom does to each

Two mechanisms ship. Stepped sizes change at a breakpoint: GOV.UK's map has a `null` (mobile) entry and a `tablet` entry for each point and emits a media query between them. Fluid sizes interpolate continuously with viewport width. Carbon's `fluid()` helper writes, for each pair of adjacent breakpoints, `calc(min + (max − min) × ((100vw − minWidth) / (maxWidth − minWidth)))`, so `fluid-heading-05` climbs from 32 at 320px through 36, 42 and 48 to 60 at 1584px. Utopia generalises the idea: define one scale at a small viewport and another at a large one, with a gentler ratio at the small end (its own example uses 1.2 and 1.333), and let `clamp()` interpolate every step between them. Its calculator opens on an 18px base at 360px wide and 20px at 1240px, so even its body grows slightly.

Fluid type buys freedom from breakpoint decisions and a scale that never jumps. It costs readability of the stylesheet (a `clamp()` with a vw term cannot be read as a size) and, more seriously, it can interfere with zoom.

The mechanism is worth walking through, because the commonly repeated rule is incomplete. WCAG 1.4.4 Resize Text requires that text can be enlarged to 200%. Browser zoom works by enlarging the CSS pixel, which also shrinks the viewport measured in CSS pixels. A rem or px size doubles in rendered size at 200% zoom. A vw size does not grow at all: at 200% the viewport is half as many CSS pixels wide, so 3vw is half as many CSS pixels, each rendered twice as large. WCAG's failure technique F94 names text sized primarily in viewport units as a failure for exactly this reason.

A `clamp(1.75rem, 1rem + 3vw, 3rem)` heading in a 1280px window shows what happens with a mix. At 100% the preferred value is 16 + 38.4 = 54.4px, clamped to 48. At 200% zoom the CSS viewport is 640px wide, the preferred value is 16 + 19.2 = 35.2 CSS pixels, rendered at 70.4 device pixels: 1.47 times the original, short of 2. The rem part doubled; the vw part did not.

Stepped sizes do something similar. Zooming a 1280px window to 200% gives a 640px CSS viewport, which crosses GOV.UK's tablet breakpoint and swaps the 48px heading for its 32px mobile size: 64 device pixels, 1.33 times the original. WCAG's understanding document anticipates this and allows it: a page passes if 200% enlargement can be reached in some way, even if crossing a breakpoint means it takes more than 200% zoom to get there. Browsers zoom to 500%, which gives the practical bound: a size that never shrinks below 0.4 of its largest value can always be brought to twice that value. Both of GOV.UK's heading shrinks (0.67) and Carbon's (32 against 60 is 0.53) clear it comfortably; a display size that falls from 120 to 32 would not.

Body text that holds avoids the question entirely, which is one more reason to hold it.

### 10.4 Does body text shrink?

No, on the current evidence. The only user-outcome argument in this whole area points one way: GOV.UK reversed its shrink on the strength of service teams' accessibility findings and the BDA's 16px floor. The platform evidence agrees from a different angle, putting phone body text at 16 to 17 even where desktop text is 13 or 14. Against it there is mostly convention: Tailwind's `prose md:prose-lg` pattern makes the default body 16 and the larger one a desktop enhancement, and Zell Liew's specimen steps body from 16 to 18 to 20 as the screen widens. Both start at 16, which no source considers too small; the disagreement is only about whether a desktop reading size above 16 should come down on a phone.

The cost of holding a larger body is line length. Inter at 18px in a 343px column (a 375px phone with 16px gutters) sets about 41 characters per line, measured on an English sample paragraph from the font's own advance widths; at 16px the same column holds about 47. Butterick's lower bound is 45 characters. Apple's 17pt default body on an iPhone sits in the same range as 18px Inter, which is evidence that a short line on a phone is tolerated where a long one on a desktop is not: the eye's return sweep is short, and Pimp my Type notes that narrow columns are forgiving.

### 10.5 Does spacing between prose elements shrink?

The large gaps do; the small ones hold. GOV.UK's responsive spacing scale is the one primary source that encodes it: units 1 to 3 (5, 10 and 15px) are identical at every width, while unit 4 drops from 20 to 15, unit 6 from 30 to 20, unit 8 from 50 to 30 and unit 9 from 60 to 40. Applied to its prose, a paragraph gap falls from 20 to 15, the space above a large heading from 40 to 30 and below it from 30 to 20. The heading gaps shrink by a quarter to a third, the same proportion as the headings themselves.

Tailwind's prose presets scale every gap in em with the body, so moving from `prose-lg` to `prose` shrinks all of them by about the body's own ratio (the paragraph gap from 24 to 20, the h2 from 56 above and 32 below to 48 and 24). USWDS's em-based gaps hold because its sizes hold. The pattern that survives: a gap tied to the body (paragraph, list item) holds when the body holds, and a gap tied to a heading shrinks with the heading. What must not shrink is the ordering from section 4: on a phone, every heading's space above still has to clearly exceed the paragraph gap.

### 10.6 How does line height change when headings shrink?

Very little, when it is set by role. GOV.UK's ratios barely move: the 48 point is 35/32 (1.09) on mobile and 50/48 (1.04) on desktop; the 36 point is 1.11 at both widths. Carbon's fluid headings run the other way, from 1.25 at 32px to 1.17 at 48px. Both are inside the 1.1 to 1.25 heading band, and both reflect the same physics: a smaller heading wants a slightly larger ratio. A role-based value of about 1.2 for headings covers the whole range.

What changes on a phone is that headings wrap. A heading that fits on one line at 1280px runs to three lines at 375px, and a heading line height that looked fine on one line can make a wrapped heading look like separate lines. Pimp my Type's specimen shows a wrapped heading at 1.3 falling apart and the same heading at 1.1 holding together; checking headings at their longest realistic length on the narrowest screen is the test. Body line height is the other candidate for change: Pimp my Type puts mobile body at 1.3 to 1.45 and desktop at 1.5 to 1.6, because shorter lines need less leading, while also calling a single 1.5 an acceptable compromise across both. A product that holds one body line height gives up a small optimisation and keeps one fewer mode.

**What to do.** On a phone, hold every size up to the largest body or UI heading size, and bring headings and display down so that content's every-other-step stride becomes an adjacent-step stride. Hold the paragraph and list gaps, shrink heading gaps in proportion to the headings, keep line heights by role, and check that no two heading levels land on the same size. Body text holding is the strongest-evidenced claim in this guide (a reversal driven by accessibility findings, and the platforms' own defaults); the stride rule is this guide's synthesis of GOV.UK's, Polaris's and Carbon's numbers.

---

## 11. How is any of this drawn in Figma?

**The short answer.** With nested auto-layout stacks whose gaps are bound to spacing variables, because Figma has no space-before on text and its paragraph spacing works only inside one text node.

Figma's paragraph spacing is a property of a text node, applied between paragraphs inside that node, from the style of the node's first character. It cannot put more space above a heading than below it, and it does nothing between two separate text layers. An auto-layout frame has one gap for all its children. The way to draw a prose container is therefore two levels of stack: each heading and its content in a section frame with the small gap, sections in a parent frame with the large gap, both gaps bound to spacing variables so the numbers match the CSS tokens. Since slots reached general availability on 10 June 2026, a single Prose component can wrap that parent with a slot for its sections, which gives designers a container to drop content into without detaching anything. A responsive layout adds a mode to the spacing collection, so a mobile frame resolves the smaller heading gaps from section 10 without a second component.

The construction to avoid is a component per element with its spacing baked in as padding: a "Heading 2" with 48 above it, placed after a "Paragraph" with 24 below it. In CSS those margins would collapse to 48; in Figma the paddings add to 72, and the two sides disagree from the first frame. The knowledge base's [Figma build note](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/visual.md#type-for-ui-and-long-form-content) has the API references and the staff confirmation.

**What to do.** Draw prose as nested stacks bound to spacing variables, optionally inside one slot-based Prose component, and never as padded per-element components. This is the toolkit's documented method; the slot-based component is optional because a plain frame works as well.

---

## 12. What should the styles be called?

**The short answer.** By role and size, never by HTML tag. A level is not a size: a card title can be an `h3` and look small, and an article's h2 can use the same style as a settings page's page title.

The full argument, with Polaris, Carbon, Material and GOV.UK as cases, is in the [typography naming guide](typography-naming.md). The point specific to this guide is that content's every-other-step mapping only works if styles are named independently of tags: content's h3 takes Heading M while a component's h3 may take Heading XS, and on a phone content's h2 may render at the size Heading M has on a desktop. A style named `h2` cannot express any of that.

**What to do.** Name styles by role and size, map tags to styles in the prose container, and document that mapping as the content role's own.

---

## 13. One worked example

**The short answer.** One product's scale, walked through the sections above, with the two places the evidence pushes back and a proposed mobile adaptation. Every value below is that project's decision, stated as such, not a rule.

### The decisions

The project landed on a 1.125 ratio from 16 (16 × 1.125ⁿ), rounded to ten sizes: 12, 14, 16, 18, 20, 22, 28, 36, 48 and 72. The formula gives 46 and 74 at the top; 48 and 72 are its two named exceptions. Read in order, the ten sizes give ten text styles one size each, with Code sharing 14:

| Style | Size | Line height | Weight | Face | Tracking |
|---|---|---|---|---|---|
| Label S | 12 | 130% | 400 | Inter | 0 |
| Label M | 14 | 130% | 400 | Inter | −0.5% |
| Body M | 16 | 150% | 400 | Inter | −1% |
| Body L | 18 | 150% | 400 | Inter | −1.5% |
| Heading XS | 20 | 120% | 600 | Inter | −2% |
| Heading S | 22 | 120% | 600 | Inter | −2% |
| Heading M | 28 | 120% | 600 | Inter Display | 0 |
| Heading L | 36 | 120% | 600 | Inter Display | −2% |
| Heading XL | 48 | 120% | 600 | Inter Display | −2% |
| Display | 72 | 110% | 500 | Inter Display | −2% |
| Code | 14 | 150% | 400 | JetBrains Mono | 0 |

Line height is set by role (section 3): text 150%, labels 130%, headings 120%, display 110%. Weights follow section 8: display 500, headings 600, text 400, which is Primer's set exactly. Inter is used below 28px and Inter Display from 28px, both as static files, so Figma and the browser draw the same glyphs (section 7). Tracking is rounded per style: 12 at 0, 14 at −0.5%, 16 at −1%, 18 at −1.5%, 20 and 22 at −2%; the Display cut takes 0 below 36 and −2% from 36. Those text-cut values are Inter 3's withdrawn dynamic-metrics curve rounded to half a percent (it gives +0.05% at 12, −0.6% at 14, −1.1% at 16, −1.4% at 18, −1.7% at 20 and −1.8% at 22), which makes them a sound starting point that can be stated and kept.

Long-form content uses Body L at 18 on a 720px measure. Gaps: 24 between paragraphs and 8 between list items; above and below headings, h2 48 and 16, h3 40 and 12, h4 32 and 8, with a hairline divider before each h2. Read against section 2, the content headings walk every other step from the body: h4 Heading S at 22, h3 Heading M at 28, h2 Heading L at 36, the page title Heading XL at 48. Code blocks are 14 on 150% in JetBrains Mono, padded 16 by 20 with a 12px radius; inline code runs at 1em with a tint that exists only in code (section 9).

Most of this sits squarely inside the evidence. The single scale with a content stride is section 1's consensus. Every heading gap above exceeds the 24 paragraph gap, and the h2's 48 above and 16 below matches USWDS's h2 to the pixel. Weights, faces and the inline code size follow the evidence as well.

### Where the evidence pushes back

**The measure is too wide for the body.** At 18px, Inter sets about 87 characters on a 720px line, measured on an English sample paragraph from the font's advance widths before tracking (the −1.5% tracking adds one or two). That is past WCAG 1.4.8's 80-character limit, past the knowledge base's 65 to 75 target, and near the top of Butterick's 45 to 90. A measure of 600 to 640px (about 73 to 77 characters) or `max-inline-size: 36em` fits the evidence without touching the type. The 720px may have been chosen as the column including padding, in which case the text box inside it is what to measure.

**Code blocks are two steps below the body, where the evidence says one.** At 14 under an 18 body, blocks run at 0.78 of the body. GitHub uses 85%, Tailwind's 18px preset uses 16 (0.89), and the knowledge base's rule is one step below the body, which on this scale is 16. The case for 14 is columns: JetBrains Mono advances 0.6em per character, so a 720px block with 20px side padding (680px of code) holds about 80 columns at 14 and 70 at 16. If the content includes code wider than about 70 columns, 14 is a defensible exception to name; otherwise 16 matches what shipping prose systems do.

Two smaller points are judgment rather than contradiction. Switching to the full display cut at 28 is slightly earlier than Inter's own axis implies (the variable font reaches its full display drawing only at 32), which is harmless but means the 28 is a bit tighter than `font-optical-sizing: auto` would draw it. And −2% on Inter Display from 36 adds tracking to a cut that is already tighter; Apple's table moves its display sizes the other way, so the 36 and 48 sizes deserve an eye check against a 0% version before the value is locked.

### The proposed mobile adaptation

Section 10's rule, applied: below the project's small breakpoint (about 40rem, 640px), sizes up to 20 hold, and content headings move from an every-other-step stride to an adjacent-step stride, so each heading style drops to an existing size on the list. Face and tracking follow the rendered size, because the project switches cut at 28 and sets tracking per size, so they become mode values too.

| Style or gap | Desktop | Mobile | Evidence |
|---|---|---|---|
| Display | 72 / 110%, Inter Display, −2% | 48 / 110%, Inter Display, −2% | GOV.UK 80 → 53 (0.66); Carbon display from 76 down to 42 |
| Heading XL (page title) | 48, Inter Display, −2% | 36, Inter Display, −2% | GOV.UK 48 → 32; Carbon `fluid-heading-05` 48 → 32 |
| Heading L (h2) | 36, Inter Display, −2% | 28, Inter Display, 0 | GOV.UK 36 → 27; Polaris 36 → 30 |
| Heading M (h3) | 28, Inter Display, 0 | 22, Inter, −2% | GOV.UK 27 → 21 |
| Heading S (h4) | 22, Inter, −2% | 20, Inter, −2% | Polaris 24 → 20; GOV.UK 24 → 21 |
| Heading XS, Body L, Body M, Labels, Code | 20, 18, 16, 14 and 12, 14 | unchanged | GOV.UK 16 and 19 hold; Apple, Spectrum and Fluent go larger, never smaller |
| Line heights | 150 / 130 / 120 / 110% | unchanged | set by role (10.6) |
| Paragraph gap | 24 | 24 | tied to the body, which holds |
| List item gap | 8 | 8 | GOV.UK's small units hold |
| h2 above / below | 48 / 16, hairline before | 40 / 16, hairline inside the 40 | GOV.UK heading gaps shrink by a quarter to a third |
| h3 above / below | 40 / 12 | 32 / 12 | in proportion to the heading |
| h4 above / below | 32 / 8 | 28 / 8 | must still exceed the 24 paragraph gap |
| Code block padding | 16 × 20 | 16 × 16 | gives back 8px of a short line; radius stays 12 |
| Measure | 720px (see above) | the column: viewport less 16px gutters | Body L sets about 41 characters at 375px wide |

Two consequences need writing down with the table. On a phone Heading S and Heading XS both render at 20 in the same weight, so the two must not appear as consecutive levels in one view; inside articles they do not, because Heading XS is an interface style. And if the spacing scale has no 28, h4 keeps 32 above and ties with h3's mobile 32, which is tolerable because the two still differ in size (22 against 20) and in the gap below (12 against 8). The largest shrink in the table is 0.67, well inside the 0.4 bound from section 10.3, so the stepped switch passes WCAG 1.4.4 at any breakpoint the zoom crosses.

**What to do.** Treat the desktop scale as settled apart from the measure and the code block size, and adopt the mobile column as one mode on the text-style and spacing tokens, switched at one breakpoint in rem. The direction of every change is backed by at least two systems; the specific mobile values are this guide's proposal, chosen to land on sizes and gaps the project already has.

---

## 14. Cheat sheet

| Decision | Do | Do not |
|---|---|---|
| Scale | one list of sizes, published; off-formula sizes named | a second "editorial" scale |
| Stride | UI on adjacent steps, content on every other step | the same stride for both |
| Line height | four roles, unitless: text 1.5, labels 1.3, headings 1.2, display 1.1 | `150%` in CSS; a per-size table unless rows must land on 4px |
| Paragraph gap | about one body line, from a spacing token | a gap derived to a baseline grid |
| Heading gaps | above clearly larger than below, and larger than the paragraph gap | an h3 or h4 with less space above than a paragraph |
| Who spaces prose | one container, direct children only (`> * + *`) | margins on text styles or components |
| Component in an article | one block; its inside spaced by its own tokens | the owl selector reaching into it |
| Divider | part of the h2, inside its space-above, never before the first | a rule whose margins add to the heading's |
| Display cut | little or no extra tracking until the largest sizes | the text cut's tracking curve applied again |
| Figma parity | static text and display families, switched at a named size | the variable font with `opsz` left to the browser |
| Tracking | per style, half-percent steps, in em | a fitted formula to four decimals |
| Weights | one per role; display lighter than headings | a different weight per heading level |
| Code | inline at 1em when x-heights match; blocks one step below body | inline code scaled to 0.85 beside matching text |
| Phone: sizes | hold up to the largest UI heading; headings take adjacent steps | body text smaller than on desktop |
| Phone: gaps | heading gaps shrink with headings; paragraph and list gaps hold | every gap scaled by one factor |
| Phone: mechanism | rem at a breakpoint, or `clamp()` with a rem floor and a modest range | text sized mainly in `vw` |
| Figma spacing | nested stacks on spacing variables, a mode for mobile | padded per-element components |
| Names | role and size | `h1` to `h6` |

---

## 15. The short version

A product that has both an interface and articles needs one type scale, not two. Build it from a small ratio such as 1.125, round it once, publish the rounded list, and name any size you picked off the formula. Interface text steps through adjacent sizes; long-form content steps through every other one, which at 1.125 gives the roughly 1.27 ratio between heading levels that GOV.UK and GitHub use. Set line height by role rather than by size: about 1.5 for reading text, 1.3 for labels and one-line UI text, 1.2 for headings, 1.1 for display, written unitless in code.

Space long-form content from tokens, not a baseline grid: a paragraph gap near one body line, a smaller list-item gap, and for each heading a gap above that clearly exceeds the paragraph gap and a smaller one below. One prose container owns those gaps, applied to its direct children only, so a component inside an article stays one block whose inside is spaced by its own tokens. A divider before major sections is optional; if used, it is part of the h2 and lives inside its space-above. In Figma, which has no space-before, draw the same thing as nested stacks bound to spacing variables.

Weights go by role: regular for text, one semibold for every heading level, and a lighter display. If the face has a display cut, do not apply the text cut's tracking to it again, and if Figma has to match the browser, ship text and display as static families and switch at a named size. Pick the monospace by x-height so inline code can sit at 1em, and set code blocks one step below the body.

On a phone, change the stride rather than the scale. Body text and UI sizes hold (GOV.UK stopped shrinking its body on small screens on accessibility grounds, and Apple, Android, Spectrum and Fluent all make phone text larger, not smaller). Headings and display come down to adjacent steps, so the gap between levels narrows, the way Dynamic Type and Android 14 compress large text. Gaps tied to the body hold; gaps tied to headings shrink with them. Stepped rem sizes at one breakpoint are the simplest way to do it; fluid `clamp()` works too, provided its floor is in rem and no size shrinks below about 0.4 of its maximum, which keeps WCAG's 200% zoom reachable.

Write down three things for the people who build it: the published list with its named exceptions, the mapping from tags to styles inside the prose container, and the mobile mode as a table of style sizes and gaps. Every system that got this right has renamed or reversed something along the way, GOV.UK included; a table is what makes the next reversal cheap.

---

## 16. What to re-check later

- **GOV.UK's scale is the fastest-moving evidence here.** The non-shrinking body became default in Frontend 6.0, and the source still marks point 27 for possible deprecation. Re-read `_typography-responsive.scss` before quoting its mobile values.
- **Browser support** for `text-box-trim` (Firefox 154) and `lh` and `rlh` is taken from MDN's compatibility data of 22 October 2026. The first is recent enough that real-user version spread matters more than the table.
- **Figma's optical sizing behaviour** is the toolkit's documented finding, not a Figma statement. If Figma starts driving `opsz` from font size, the case for static display files weakens.
- **The 0.4 zoom bound** is this guide's derivation from WCAG's understanding text and browsers' 500% zoom limit, not a WCAG rule. A stricter reading of 1.4.4 that requires 200% at 200% zoom would fail any breakpoint shrink, GOV.UK's included.
- **Characters per line** were computed from Inter 4.1's advance widths on one English sample paragraph, without kerning or tracking, at 0.459em per character. Real text in another language, or with more capitals and figures, will differ by a few characters.
- **The worked example's style-to-size mapping** is read from its ten sizes and ten styles in order; if the project assigns them differently, the mobile table's rows move with it.
- **Evidence quality, stated plainly.** The only user-outcome evidence in this guide is GOV.UK's, and even that rests on service teams' findings and BDA guidance rather than a published study. Everything else is what systems ship, which proves that a pattern survives, not that it reads better. No system read publishes research comparing stepped with fluid type, or measuring whether heading gaps should shrink on phones.

---

## Sources

**Primary: system source, tokens and documentation**

- [GOV.UK Frontend, `_typography-responsive.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_typography-responsive.scss). Mobile, tablet and print sizes per point; the "consider deprecating" comment on 27.
- [GOV.UK Frontend, `_spacing.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_spacing.scss). Static and responsive spacing units.
- [GOV.UK Frontend, `_typography.mixin.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/core/_typography.mixin.scss). Heading and body margins, the padding added above headings after paragraphs.
- [GOV.UK Frontend, `_section-break.mixin.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/core/_section-break.mixin.scss) and [`_lists.mixin.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/core/_lists.mixin.scss). Visible section break and list item spacing.
- [GOV.UK Frontend changelog](https://github.com/alphagov/govuk-frontend/blob/main/CHANGELOG.md). 5.2.0 feature flag and 6.0.0 default for the new type scale, removal of point 14.
- [GOV.UK Design System, using the updated type scale](https://design-system.service.gov.uk/get-started/new-type-scale/). Before and after small-screen values.
- [GOV.UK Design System, spacing](https://design-system.service.gov.uk/styles/spacing/). Responsive spacing table.
- [GOV.UK design notes, making the typography scale more accessible (2022)](https://designnotes.blog.gov.uk/2022/12/12/making-the-gov-uk-frontend-typography-scale-more-accessible). The rationale, the BDA floor, "large text getting smaller" is acceptable.
- [USWDS, `_usa-prose.scss`](https://github.com/uswds/uswds/blob/develop/packages/usa-prose/src/styles/_usa-prose.scss). The owl selector scoped to direct children.
- [USWDS, `_settings-typography.scss`](https://github.com/uswds/uswds/blob/develop/packages/uswds-core/src/styles/settings/_settings-typography.scss). Theme sizes, `$theme-heading-margin-top: 1.5em`, `$theme-paragraph-margin-top: 1em`.
- [USWDS, system type scale](https://github.com/uswds/uswds/blob/develop/packages/uswds-core/src/styles/tokens/font/type-scale.scss) and [line heights](https://github.com/uswds/uswds/blob/develop/packages/uswds-core/src/styles/tokens/font/line-height.scss).
- [USWDS, `usa-list` mixin](https://github.com/uswds/uswds/blob/develop/packages/uswds-core/src/styles/mixins/typography/usa-list.scss). List item gap of 0.25em.
- [Carbon, `@carbon/type` `styles.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/styles.ts). Fixed and Fluid styles, expressive heading and display breakpoints, weights.
- [Carbon, `scale.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/scale.ts) and [`fluid.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/fluid.ts). The generated scale and the piecewise rem plus vw calculation.
- [Carbon, `@carbon/layout` breakpoints](https://github.com/carbon-design-system/carbon/blob/main/packages/layout/src/index.ts). 320, 672, 1056, 1312 and 1584px.
- [Carbon, type sets](https://carbondesignsystem.com/elements/typography/type-sets/). Fixed and Fluid classification.
- [Material Web, `_md-sys-typescale.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-typescale.scss). Sizes and rem line heights.
- [Android 14 features, non-linear font scaling](https://developer.android.com/about/versions/14/features#non-linear-font-scaling). Scaling to 200% on a curve that grows large text more slowly.
- [Apple Human Interface Guidelines, Typography](https://developer.apple.com/design/human-interface-guidelines/typography). Default and minimum sizes per platform, loose and tight leading, Dynamic Type tables, SF Pro and New York tracking tables (read from the page's data file).
- [Adobe Spectrum tokens, `typography.json`](https://github.com/adobe/spectrum-tokens/blob/main/packages/tokens/src/typography.json). Desktop and mobile font sizes, `line-height-100` and `line-height-200`.
- [Primer primitives, functional typography CSS](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/functional/typography/typography.css) and [base typography CSS](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/base/typography/typography.css). Role weights, line heights, code sizes.
- [Primer, typography foundations](https://primer.style/foundations/typography/). Unitless line heights, rem sizes.
- [Atlassian, typography](https://atlassian.design/foundations/typography/). Body L for long-form content, paragraph spacing in Figma only, Stack in code.
- [Shopify Polaris, compiled `styles.css`](https://cdn.jsdelivr.net/npm/@shopify/polaris/build/esm/styles.css) and [Polaris tokens CSS](https://cdn.jsdelivr.net/npm/@shopify/polaris-tokens/dist/css/styles.css). Heading sizes below and above 48em.
- [Fluent 2, typography](https://fluent2.microsoft.design/typography) and [`@fluentui/tokens` fonts](https://cdn.jsdelivr.net/npm/@fluentui/tokens/lib/global/fonts.js). Per-platform ramps, web sizes and line heights.
- [Radix Themes, breakpoints](https://www.radix-ui.com/themes/docs/theme/breakpoints) and [tokens CSS](https://cdn.jsdelivr.net/npm/@radix-ui/themes/tokens.css). Responsive size props, the nine-step scale.
- [Elastic EUI, `text.styles.ts`](https://github.com/elastic/eui/blob/main/packages/eui/src/components/text/text.styles.ts). `EuiText` heading mapping and `max(64ch, 75%)` measure.
- [`github-markdown-css`](https://github.com/sindresorhus/github-markdown-css/blob/main/github-markdown-light.css). A faithful copy of GitHub's `.markdown-body` rules: heading margins and borders, `pre` at 85%, no media queries.
- [Tailwind Typography, `styles.js`](https://github.com/tailwindlabs/tailwindcss-typography/blob/main/src/styles.js) and [README](https://github.com/tailwindlabs/tailwindcss-typography/blob/main/README.md). Gaps per preset, the `prose md:prose-lg` pattern.
- [Utopia, designing with fluid type scales](https://utopia.fyi/blog/designing-with-fluid-type-scales/). Two scales interpolated by viewport.
- [Inter, `inter.css`](https://rsms.me/inter/inter.css) and [Inter home](https://rsms.me/inter/). Variable and static text and display families.
- [Inter 3 dynamic metrics (archived)](https://d.rsms.me/inter-website/v3/dynmetrics/). The withdrawn tracking formula.
- [MDN browser compatibility data](https://github.com/mdn/browser-compat-data). Support for `lh`, `rlh`, `text-box-trim`, `text-box-edge` and `font-optical-sizing`, as of 22 October 2026.

**Standards**

- [WCAG 2.2 Understanding 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html). The note on breakpoints and reaching 200% "in some way".
- [WCAG 2.2 Technique F94](https://www.w3.org/WAI/WCAG22/Techniques/failures/F94). Viewport units as the primary text size.
- [WCAG 2.2 Understanding 1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html).
- [WCAG 2.2 Understanding 1.4.8 Visual Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html).

**Commentary: named type specialists**

- [Matthew Butterick, responsive web design](https://practicaltypography.com/responsive-web-design.html). Rules unchanged by screen size, 45 to 90 characters; scales point size with width in vw.
- [Matthew Butterick, space between paragraphs](https://practicaltypography.com/space-between-paragraphs.html).
- [Oliver Schöndorfer (Pimp my Type), font size](https://pimpmytype.com/font-size/). Mobile body near the default, h1 at 32 or less on mobile.
- [Oliver Schöndorfer (Pimp my Type), line length and line height](https://pimpmytype.com/line-length-line-height/). Mobile body 1.3 to 1.45, wrapped headings at 1.1.
- [Better Web Type, 8 more tips](https://betterwebtype.com/8-more-tips-for-remarkably-better-typography/). Space above a heading at least twice the space below.
- [Zell Liew, responsive typography](https://zellwk.com/blog/responsive-typography/). Body stepping from 16 to 20 with width; rhythm across breakpoints impractical.
- [Zell Liew, web typography is broken](https://zellwk.com/blog/web-typography-broken/).

**Toolkit knowledge base and sister guides**

- [Toolkit knowledge base, typography](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/visual.md#typography).
- [Toolkit knowledge base, type for UI and long-form content](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/visual.md#type-for-ui-and-long-form-content). The x-height measurements, the Inter Display sidebearing measurement, Figma paragraph spacing and slots, and the prose selectors.
- [Toolkit knowledge base, one size scale per screen](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/visual.md#one-size-scale-per-screen).
- [Line height and letter spacing, from Figma to the browser](line-height-letter-spacing-figma-to-css.md).
- [Naming typography in a design system](typography-naming.md).

**Cited but not resolved to a URL**

- Richard Rutter, *Web Typography* (2017). Its chapters on scale and responsive paragraphs were not available online and were not read.
