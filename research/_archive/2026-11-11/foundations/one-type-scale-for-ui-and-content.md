# One type scale for an interface and its articles

Why a product with both screens and long-form content needs one size scale walked in two strides, not two scales, and what each text style in it carries: size, line height, weight and tracking.

Researched November 2026. Sizes, line heights and weights were read from source rather than documentation pages wherever source exists: GOV.UK Frontend 6.6 (`_typography-responsive.scss`), USWDS `uswds-core` settings and tokens, Carbon's `@carbon/type` (`styles.ts`, `scale.ts`), Material Web's generated `md-sys-typescale` tokens, Apple's Human Interface Guidelines data file (the SF and New York tracking tables), `@adobe/spectrum-tokens` 15.6, `@primer/primitives` 11.10, `@shopify/polaris` 13.9, `@fluentui/tokens`, `@radix-ui/themes`, `github-markdown-css` and `tailwindcss-typography`. Atlassian's and Fluent's values come from their documentation pages. Two measurements are the toolkit's own, made from the Inter 4.1 font files with fontTools: the `opsz` axis range (14 to 32) and Inter Display's narrower sidebearings. Re-checked in November 2026: GOV.UK Frontend's latest release (6.6.0, 15 October 2026, no type-scale change since 6.0), Inter 3's dynamic-metrics page (still 404 on the live site, archived copy only), and Atlassian's weight tokens (`@atlaskit/tokens` 20.8.2). This piece was split out of a longer guide on type for UI and content; its sister pieces are [space between prose elements](space-between-prose-elements.md) and [type on a phone](type-on-a-phone.md), which holds the worked example. The toolkit's distilled rules are in `knowledge/ui/design/visual.md#typography` and `#type-for-ui-and-long-form-content`.

---

## What this answers

The thesis in two sentences: a product needs one list of sizes, and interface text steps through adjacent sizes while reading text steps through every other one. The difference between the two lives in which sizes each reaches for, in line height and weight set by role, and in a prose container, never in a second scale.

- Does long-form content need its own scale, or a different walk through the same one?
- How do you build a scale both can use, and why publish it as a list?
- Is line height set per role, or snapped to a 4px grid per size?
- Which weight belongs to which role?
- What do tracking and optical sizes do once a face has a display cut?
- What does the scale imply for style names?

Section 7 is the cheat sheet and section 8 the short version. How the gaps between prose elements are set is in [space between prose elements](space-between-prose-elements.md); what changes on a phone, and one product's scale walked end to end, is in [type on a phone](type-on-a-phone.md).

---

## 1. One scale, or a UI scale and an editorial scale?

**The short answer.** One scale. Almost every mature system ships a single list of sizes and lets long-form content take a looser, wider-spaced subset of it. The one system famous for two sets, Carbon, merged them.

The question arrives the first time a product grows a blog, a help centre or a job description. The interface was built at 14 and 16 pixels with tight line heights, and an article set in those styles reads like a settings panel. The tempting fix is a second, "editorial" scale with its own sizes. What shipping systems do instead is keep the sizes and change two other things: which sizes long-form content reaches for, and how loosely they are set.

Atlassian states the split most plainly. Its scale has three body sizes, and its documentation names Body L (16/24) as the default for long-form content while Body M (14/20) is the size used in components. Nothing about the scale changes; content sits one step higher. Apple does the same with a mechanism rather than a size: a text style can take a loose-leading trait, which the guidelines recommend for wide columns and long passages, and a tight one for height-constrained rows. Spectrum puts the split into two named line heights, `line-height-100: 1.3` for component text and `line-height-200: 1.5` for body copy, over one set of sizes.

Carbon is the counter-example, and its history is the strongest evidence for the consensus. Carbon v10 shipped a productive type set for product screens and an expressive set for editorial pages, distinguished by suffixes in the token names. Version 11 merged them into one collection and renamed the distinction by behaviour instead: Fixed styles hold their size at every breakpoint and Fluid styles interpolate between breakpoints (the [naming piece](naming-text-styles.md#2-what-words-should-name-the-size) tells that migration). Even before the merge the two sets overlapped heavily: `body-01` at 14px and `body-02` at 16px came from the same scale function in `scale.ts`, which generates 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48 and so on for both.

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
| Polaris | one scale, admin-first | headings step down on small screens ([type on a phone](type-on-a-phone.md)) |
| Fluent 2 | one ramp per platform | none: body 14/20 on web, 17/22 on iOS, 16/24 on Android |

On this question the systems have no shared origin. GOV.UK's scale predates most of them, Apple's is a platform's own, and Carbon arrived at one scale by retreating from two. That is independent convergence, which counts for more than eleven systems copying each other.

The cost of one scale is real. A reading page wants generous steps between heading levels and a dense tool wants small ones, so one list has to contain both; it needs more entries than either would alone, and someone has to say which entries each context uses. A second scale removes that bookkeeping, and pays for it when a component lands inside an article and has to choose which scale it belongs to. That moment arrives constantly: a card in a blog post, a callout in documentation, a form in a help article.

**What to do.** Keep one scale and give long-form content two things: a higher body size and a looser line height, documented as the content role. This is consensus, reached independently. A second scale earns its place only where the editorial surface has its own team and its own typeface, which is the situation Carbon's expressive set was built for and later folded back.

---

## 2. How do you build a scale both can use?

**The short answer.** Pick a small ratio, let components step through adjacent sizes and content through every other one, then round to whole pixels and publish the rounded list. Any size that departs from the formula is named as an exception.

A geometric scale multiplies a base size by a fixed ratio at each step. At a base of 16 and a ratio of 1.125 (a major second), the steps run 14.2, 16, 18, 20.3, 22.8, 25.6, 28.8, 32.4, 36.5, 41.1, 46.2. The ratio gives every size a reason: no number in the list was typed because it looked about right.

The useful property is what happens when you skip steps. Two steps of 1.125 multiply to about 1.27, which is close to the ratios long-form systems use between heading levels: GitHub's Markdown headings sit at 1, 1.25, 1.5 and 2 times the body, and GOV.UK's content run of 19, 24, 36 and 48 climbs by roughly 1.26 to 1.5. So a small ratio does both jobs. Components move one step at a time, where a 14 label beside a 16 value is a meaningful difference at arm's length; content moves two steps at a time, where an h3 has to look unmistakably larger than the paragraph under it. One list serves both, walked with different strides.

The list must then be rounded, and rounding is where a formula stops being a specification. Rounding 16 × 1.125ⁿ to whole even pixels produces 26, 32 and 42 as well as 28 and 36; a team that keeps only some of them has made a choice the formula does not record. Carbon publishes its scale as code, a function in `scale.ts` that adds a growing increment rather than multiplying, which is why its list reads 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 54, 60. USWDS publishes a literal map from step 1 at 12px to step 20 at 140px. Both make the same point: the published artefact is the list, and the ratio is its rationale.

A size chosen off the formula is fine when it is named. A round 48 where the formula gives 46, or a 72 where it gives 74, buys a number people can remember. The cost appears only when nobody wrote it down: the next person to extend the scale recomputes the formula, gets 46, and now the system has both.

Two traps recur.

- **Steps too close to see.** A dashboard using 13, 14 and 15px for three label levels has three styles nobody can tell apart. The toolkit's rule (`knowledge/ui/design/visual.md#one-size-scale-per-screen`) is to collapse to two sizes and separate them by weight or colour.
- **A large ratio walked at content's stride.** A team picks 1.25 for its headings, then lets content skip steps as well, and the h2 lands at 1.56 times the h3. Pick the ratio for the interface's single step; content's double step follows from it.

**What to do.** Choose a small ratio (1.125 or 1.2) for the interface's adjacent steps, let content take every other step, round once, and publish the list with each off-formula size marked as a named exception. The stride idea is this piece's synthesis of what the systems ship; publishing the list rather than the formula is what Carbon and USWDS both do.

Check the stride against reading sites before keeping it. Walked strictly from an 18px body on a 1.125 scale, every other step puts the h2 at 36, twice the body, where Tailwind's 18px prose sets 30, GitHub's markdown 1.5 times the body and GOV.UK about 1.9. Reading sites settle on an h2 of about 1.5 to 1.7 times the body, an h3 of about 1.25 and an h4 at the body size in bold; one product that started on the strict stride moved to 48, 28, 22 and 18 for those reasons ([type on a phone](type-on-a-phone.md#7-a-worked-example-one-scale-desktop-to-phone)). The stride says which list the sizes come from; the reading-site ratios say which of them to take.

---

## 3. Is line height set by role, or stepped onto a 4px grid?

**The short answer.** Both ship. Setting it by role (one value each for reading text, labels, headings and display) costs nothing in rhythm and survives any size; stepping each size onto a 4px grid buys whole-pixel boxes at the price of a lookup table. Either way, code takes a unitless number.

Why Figma's 150% becomes `line-height: 1.5` and never `150%` is covered in [line height and letter spacing, from Figma to the browser](line-height-letter-spacing-figma-to-css.md). The question here is what decides the number.

**Role-based systems** ship a handful of ratios. Primer's base tokens are `--base-text-lineHeight-tight: 1.25`, `snug: 1.375`, `normal: 1.5`, `relaxed: 1.625`, and every functional style picks one: body large and medium take `normal`, display takes `snug`. Spectrum has two, 1.3 and 1.5. USWDS has six system values from 1 to 1.75, with headings at 1.2 and body at 1.62. GOV.UK writes its line heights in pixels in the Sass map but converts each to a ratio before output, and the ratios fall by role: 1.32 for the 19px body, about 1.1 for the 36px and 48px headings.

**Grid-stepped systems** write each size's line height as a length. Material's tokens are rem lengths: `body-large` 1rem on 1.5rem, `title-large` 1.375rem on 1.75rem, `display-large` 3.5625rem on 4rem, every one a multiple of 4px. Radix Themes does the same in pixels (12/16, 14/20, 16/24, 18/26, 24/30). Fluent's web tokens pair `fontSizeBase300: 14px` with `lineHeightBase300: 20px`. What this buys is a box height that is always a whole multiple of 4, so a list row or a button lands where the layout grid says. What it costs is a per-size table and a ratio that wanders: Radix's 18/26 is 1.44 and its 24/30 is 1.25, so adjacent sizes do not read as one family.

The two can often be reconciled by choosing the sizes. With a 150% ratio, any size that is a multiple of 8 lands on a 4px grid (16 → 24, 24 → 36, 32 → 48); sizes that are multiples of 4 but not 8 miss (12 → 18, 20 → 30). A scale built from round pixel line heights shows the ratio each implies:

| Token | Size | Line height | Ratio |
|---|---|---|---|
| caption | 12 | 16px | 133% |
| body-sm | 14 | 20px | 143% |
| body | 16 | 24px | 150% |
| body-lg | 18 | 28px | 156% |
| heading-sm | 20 | 28px | 140% |
| heading-md | 24 | 32px | 133% |
| heading-lg | 32 | 40px | 125% |
| display | 48 | 56px | 117% |

Both approaches agree on the shape. Line height falls as size rises, because the gap between lines is measured in the font's own units and a 48px heading at 1.5 opens a gap wider than a line of body text. The specialist ranges are about 1.5 for reading text, 1.2 to 1.3 for one-line UI text and 1.1 to 1.2 for headings (Better Web Type, Pimp my Type; collected in `knowledge/ui/design/visual.md#typography`). The research behind any particular ratio is thin: Rello and colleagues (CHI 2016) report little effect of line spacing within the usual range, which the toolkit cites from the abstract. Treat the ratios as craft consensus, and the WCAG floor as the tested part.

That floor is WCAG 1.4.12 Text Spacing, and it is why the unit matters beyond tidiness. A reader may override line height to 1.5 times the font size, paragraph spacing to twice the font size and letter spacing to 0.12em, and the page must survive it. A unitless line height inherits as a ratio, so an override on the body flows into every descendant; a fixed-height box around text (a card title clipped at 48px, a code block with a set height) is what breaks.

**What to do.** Set line height by role, four values at most: reading text 1.5, labels and other one-line UI text 1.3, headings 1.2, display 1.1. Ship them unitless. Grid-stepping is defensible in a dense tool whose rows must land on a 4px grid, and that is the constraint to name if you choose it; choosing sizes in multiples of 8 makes the two approaches give the same numbers for most of the scale. Both approaches are established; the preference for roles is this piece's judgment, on the grounds that four numbers are easier to keep than a table.

---

## 4. Which weight belongs to which role?

**The short answer.** One weight per role: regular for reading and UI text, semibold for every heading level, and the largest display sizes a step lighter than the headings.

Size sets the level in a heading hierarchy; weight sets the role. If h2 is bold and h3 semibold, a reader gets two signals that disagree about how different the levels are. Primer's functional tokens are the clearest statement: `--text-title-weight-large`, `medium` and `small` are all `semibold` (600), `--text-display-weight` is `medium` (500), and `--text-body-weight` is `normal` (400). Carbon goes further at display sizes, setting `fluidDisplay01` and its siblings at its light weight. Display goes lighter for an optical reason: at 60px and above a semibold stroke is heavy enough to dominate a page, and the size already carries the emphasis. Atlassian's headings use a custom bold of 653, which is a reminder that a weight token is a role, not a number from 100 to 900.

The other side of the rule is small text. Apple warns against Ultralight, Thin and Light at small sizes, and Pimp my Type puts the threshold at 14 to 20px, below which a light face "soon looks too delicate". A dense tool needs two weights, 400 and 600 (or 500), and no third (`knowledge/ui/design/visual.md#typography`).

How weight appears in style names, and why it should not, is in [naming text styles](naming-text-styles.md#3-should-the-weight-be-in-the-name).

**What to do.** Give headings one weight, body and UI text another, and display a lighter one than headings. Primer's 400, 600 and 500 is a well-evidenced default; no light weight at text sizes.

---

## 5. What do tracking and optical sizes do once a face has a display cut?

**The short answer.** They overlap. A display cut is already drawn tighter, so tracking computed for the text cut must not be applied to it again. Where Figma has to draw what the browser renders, ship the text and display cuts as static families and switch at a named size, because Figma does not apply optical sizing.

Optical sizing means a typeface has different drawings for different sizes: text cuts with a taller x-height, looser spacing and sturdier details for small sizes, display cuts with finer details and tighter spacing for large ones. Inter 4 ships both as static families (Inter and Inter Display) and as one variable font whose `opsz` axis runs from 14 to 32 (the toolkit's measurement of the 4.1 file). With `font-optical-sizing: auto`, which every engine supports, the browser sets `opsz` to the font size in CSS pixels, so text at 14 and below gets the pure text drawing, text at 32 and above the pure display drawing, and the sizes between a blend.

Apple's tracking table for SF Pro shows what the two mechanisms do together. Tracking tightens through the text sizes, reaching −26 thousandths of an em at 17pt, then reverses: by 24pt it is positive, and it stays positive through the display sizes before returning to zero at 80pt. SF switches to its display design around 20pt, and the display design is spaced so much tighter that Apple adds space back. New York, a serif without that switch, simply tightens steadily to −16 thousandths at 72pt. The lesson for any face with a display cut is that the text cut's negative tracking curve does not carry over; the toolkit's measurement of Inter Display found its lowercase sidebearings about a quarter narrower than Inter's, which is tracking already applied.

Figma is why the static route still matters. Figma draws a variable font at the instance its axes are set to and does not move `opsz` with size, so a 28px heading in the variable file is the text drawing in Figma and a blend in the browser. Shipping Inter and Inter Display as separate families, and naming the size at which a style switches family, makes both sides draw the same glyphs. The cost is a discrete jump where the variable font would blend, and two families to load. This is the toolkit's documented finding rather than a Figma statement.

Rounding is the last point. Inter 3's "dynamic metrics" formula gave tracking to four decimal places per pixel size; it was fitted to Inter 3, has been withdrawn (the live page still returns a 404 in November 2026), and no reader can see a difference of 0.1%. Stating tracking per text style, rounded to half a percent, gives a value a designer can type and a reviewer can check (12px 0, 16px −1%, 22px −2%). Two more tracking rules from the toolkit apply everywhere: large headings tighten by 1 to 2% at most, and all caps and small caps are always spaced out, starting at 0.05 to 0.1em (`knowledge/ui/design/visual.md#typography`). Tracking is written in em in CSS; the conversion is in [line height and letter spacing](line-height-letter-spacing-figma-to-css.md#6-letter-spacing-and-why-letter-spacing-2-needs-care).

**What to do.** Use the variable font with `font-optical-sizing: auto` when Figma parity does not matter. When it does, ship static text and display families, switch at a named size inside the axis range, track the text cut by size in half-percent steps, and give the display cut little or none until its largest sizes. The mechanism is documented by Apple and by the font; the static-files trade is this piece's judgment for teams that measure Figma against the browser.

---

## 6. What does the scale imply for style names?

**The short answer.** Name styles by role and size, never by HTML tag, because the two strides only work if a level is not a size.

Content's h3 takes Heading sm while a component's h3 may take Heading xs, and on a phone content's h2 may render at the size Heading sm has on a desktop. A style named `h2` cannot express any of that. The prose container maps tags to styles, and that mapping is documented as the content role's own. The full argument, with Material, Polaris, CMS.gov and GOV.UK as cases, is in [naming text styles](naming-text-styles.md#5-can-you-just-name-the-styles-h1-to-h6).

**What to do.** Name by role and size, map tags to styles in the prose container, and write the mapping down.

---

## 7. Cheat sheet

| Decision | Do | Do not |
|---|---|---|
| Scale | one list of sizes, published; off-formula sizes named | a second "editorial" scale |
| Stride | UI on adjacent steps, content on every other step | the same stride for both |
| Ratio | 1.125 or 1.2 for the single step | a large ratio walked at content's double stride |
| Line height | four roles, unitless: text 1.5, labels 1.3, headings 1.2, display 1.1 | `150%` in CSS; a per-size table unless rows must land on 4px |
| Sizes and the grid | multiples of 8 where line boxes must land on 4px | 13, 14 and 15 as three levels |
| Weights | one per role; display lighter than headings; no light weight at text sizes | a different weight per heading level |
| Display cut | little or no extra tracking until the largest sizes | the text cut's tracking curve applied again |
| Figma parity | static text and display families, switched at a named size | the variable font with `opsz` left to the browser |
| Tracking | per style, half-percent steps, in em; caps always spaced | a fitted formula to four decimals |
| Names | role and size | `h1` to `h6` |

---

## 8. The short version

A product that has both an interface and articles needs one type scale, not two; Carbon is the system that tried two and merged them. Build it from a small ratio such as 1.125, round it once, publish the rounded list, and name any size you picked off the formula. Interface text steps through adjacent sizes; long-form content steps through every other one, which at 1.125 gives the roughly 1.27 ratio between heading levels that GOV.UK and GitHub use.

Set line height by role rather than by size: about 1.5 for reading text, 1.3 for labels and one-line UI text, 1.2 for headings, 1.1 for display, written unitless in code. A dense tool that needs every row on a 4px grid can step each size instead, and sizes in multiples of 8 make the two approaches agree.

Weights go by role: regular for text, one semibold for every heading level, and a lighter display. If the face has a display cut, do not apply the text cut's tracking to it again, and if Figma has to match the browser, ship text and display as static families and switch at a named size. State tracking per style in half-percent steps. Name every style by role and size, so content and components can map the same tag to different styles.

---

## 9. What to re-check later

- **Figma's optical sizing behaviour** is the toolkit's documented finding, not a Figma statement. If Figma starts driving `opsz` from font size, the case for static display files weakens.
- **GOV.UK's scale** has not changed since Frontend 6.0; 6.6.0 (October 2026) is the latest release. Re-read `_typography-responsive.scss` before quoting it.
- **Evidence quality.** Everything here is what systems ship, which proves a pattern survives, not that it reads better. No system read publishes research on stride or line-height ratios above the WCAG floor.

---

## Sources

**Primary: system source, tokens and documentation**

- [GOV.UK Frontend, `_typography-responsive.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_typography-responsive.scss) and [releases](https://github.com/alphagov/govuk-frontend/releases). Sizes and line heights per point; 6.6.0 as the latest release.
- [USWDS, `_settings-typography.scss`](https://github.com/uswds/uswds/blob/develop/packages/uswds-core/src/styles/settings/_settings-typography.scss), [system type scale](https://github.com/uswds/uswds/blob/develop/packages/uswds-core/src/styles/tokens/font/type-scale.scss) and [line heights](https://github.com/uswds/uswds/blob/develop/packages/uswds-core/src/styles/tokens/font/line-height.scss).
- [Carbon, `@carbon/type` `styles.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/styles.ts) and [`scale.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/scale.ts). The generated scale, Fixed and Fluid styles, weights.
- [Carbon, type sets](https://carbondesignsystem.com/elements/typography/type-sets/).
- [Material Web, `_md-sys-typescale.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-typescale.scss). Sizes and rem line heights.
- [Apple Human Interface Guidelines, Typography](https://developer.apple.com/design/human-interface-guidelines/typography). Loose and tight leading, SF Pro and New York tracking tables (read from the page's data file), weight guidance.
- [Adobe Spectrum tokens, `typography.json`](https://github.com/adobe/spectrum-tokens/blob/main/packages/tokens/src/typography.json). `line-height-100` and `line-height-200`.
- [Primer primitives, functional typography CSS](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/functional/typography/typography.css) and [base typography CSS](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/base/typography/typography.css). Role weights and line heights.
- [Atlassian, typography](https://atlassian.design/foundations/typography/) and [`@atlaskit/tokens`](https://www.npmjs.com/package/@atlaskit/tokens) 20.8.2. Body L for long-form content; bold at 653.
- [Shopify Polaris tokens CSS](https://cdn.jsdelivr.net/npm/@shopify/polaris-tokens/dist/css/styles.css).
- [Fluent 2, typography](https://fluent2.microsoft.design/typography) and [`@fluentui/tokens` fonts](https://cdn.jsdelivr.net/npm/@fluentui/tokens/lib/global/fonts.js).
- [Radix Themes tokens CSS](https://cdn.jsdelivr.net/npm/@radix-ui/themes/tokens.css). The nine-step scale and pixel line heights.
- [`github-markdown-css`](https://github.com/sindresorhus/github-markdown-css/blob/main/github-markdown-light.css). Heading ratios.
- [Inter, `inter.css`](https://rsms.me/inter/inter.css) and [Inter 3 dynamic metrics (archived)](https://d.rsms.me/inter-website/v3/dynmetrics/).

**Standards**

- [WCAG 2.2 Understanding 1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html).

**Commentary and research**

- [Better Web Type, 8 tips](https://betterwebtype.com/8-tips-for-remarkably-better-typography/) and [Pimp my Type, line length and line height](https://pimpmytype.com/line-length-line-height/) and [light fonts](https://pimpmytype.com/light-fonts/). Line-height ranges, light weights at small sizes.
- [Rello, Pielot and Marcos, CHI 2016](https://dl.acm.org/doi/10.1145/2858036.2858204). Little effect of line spacing within the usual range (abstract only).

**Toolkit knowledge base and sister pieces**

- `knowledge/ui/design/visual.md#typography`, `#type-for-ui-and-long-form-content` and `#one-size-scale-per-screen`. The Inter measurements, tracking rules, the line-height roles.
- [Space between prose elements](space-between-prose-elements.md), [type on a phone](type-on-a-phone.md), [line height and letter spacing](line-height-letter-spacing-figma-to-css.md), [naming text styles](naming-text-styles.md).
- Richard Rutter, *Web Typography* (2017): cited but not read; its chapters on scale were not available online.
