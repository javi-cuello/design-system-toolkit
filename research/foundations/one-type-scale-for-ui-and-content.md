# One type scale for an interface and its articles

Why a product with both screens and long-form content needs one size scale walked in two strides, and what each text style in it carries.

A product grows a help centre. Its interface was built at 14 and 16 pixels with tight line heights, and the first article set in those styles reads like a settings panel: dense lines, headings barely bigger than the paragraphs under them. Someone proposes an "editorial" scale with sizes of its own. A month later a card lands inside an article, and nobody can say which scale its title belongs to.

---

## What this answers

- [A separate content scale](#a-separate-content-scale): whether long-form content needs its own scale
- [Building a shared scale](#building-a-shared-scale): how a shared scale is built
- [Choosing line height](#choosing-line-height): what decides a style's line height
- [Weight by role](#weight-by-role): which weight goes with which role
- [Display cuts](#display-cuts): what changes once a face has a display cut
- [Style names](#style-names): what the styles should be called

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs. The gaps between paragraphs and headings are in [space between prose elements](space-between-prose-elements.md), and what changes on a phone, with one product's scale walked end to end, is in [type on a phone](type-on-a-phone.md).

---

## A separate content scale

Long-form content does not need its own: almost every mature system ships one list of sizes and lets long-form content take a looser, wider-spaced subset of it, and Carbon, the one system famous for two sets, merged them.

Back in the help centre, the article doesn't need new sizes. It needs to reach for different ones, and to set them more loosely. Those are the two things shipping systems change for long-form content, and the list of sizes stays as it is.

Atlassian states the split most plainly. Its scale has three body sizes, and its documentation names Body L (16/24) as the default for long-form content, while Body M (14/20) is the size used in components. The scale doesn't change; content sits one step higher.

Apple makes the same split with a trait rather than a size. A text style can take a loose-leading trait, which the guidelines recommend for wide columns and long passages, or a tight one for rows constrained in height. Spectrum names the split as two line heights over one set of sizes: `line-height-100: 1.3` for component text and `line-height-200: 1.5` for body copy.

Carbon is the counter-example, and its history is the strongest evidence for the consensus. Carbon v10 shipped a productive type set for product screens and an expressive set for editorial pages, told apart by suffixes in the token names. Version 11 merged them into one collection and renamed the difference by behaviour: Fixed styles hold their size at every breakpoint, and Fluid styles interpolate between breakpoints. [Naming text styles](naming-text-styles.md) tells that migration.

Even before the merge, the two sets overlapped. `body-01` at 14px and `body-02` at 16px came from the same scale function in `scale.ts`, which generates 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48 and so on for both.

How widely does one scale hold? The table answers it system by system, with what each does differently for long-form content.

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

Every row is one scale. These systems also have no shared origin: GOV.UK's scale predates most of them, Apple's is a platform's own, and Carbon got to one scale by retreating from two. Independent convergence counts for more than eleven systems copying each other.

One scale has a real cost. A reading page wants generous steps between heading levels and a dense tool wants small ones, so one list has to hold both. It needs more entries than either would alone, and someone has to say which entries each context uses.

A second scale removes that bookkeeping and pays for it when a component lands inside an article. The card in the help article has a title: is it an interface style or an editorial one? The question comes back constantly, with a callout in documentation, a form in a help article, a card in a blog post, and every answer is a local decision nobody wrote down.

Keep one scale, and give long-form content two things of its own: a higher body size and a looser line height. Write them in your type documentation as the content role, the way Atlassian names Body L for long-form. **Long-form content gets a different walk through the same sizes, never a second scale.**

That's consensus, reached independently. A second scale earns its place only where the editorial surface has its own team and its own typeface, the situation Carbon's expressive set was built for and later folded back.

---

## Building a shared scale

Pick a small ratio, let components step through adjacent sizes and content through every other one, then round to whole pixels and publish the rounded list, naming any size that departs from the formula.

The interface and the article want different things from one list. A 14px label beside a 16px value is a meaningful difference at arm's length. An h3 has to look unmistakably larger than the paragraph under it, and two pixels won't do that.

A geometric scale answers both. It multiplies a base size by a fixed ratio at each step. At a base of 16 and a ratio of 1.125 (a major second), the steps run 14.2, 16, 18, 20.3, 22.8, 25.6, 28.8, 32.4, 36.5, 41.1, 46.2. The ratio gives every size a reason: no number in the list was typed because it looked about right.

The useful property appears when steps are skipped. Two steps of 1.125 multiply to about 1.27, close to the ratios long-form systems use between heading levels. GitHub's Markdown headings sit at 1, 1.25, 1.5 and 2 times the body, and GOV.UK's content run of 19, 24, 36 and 48 climbs by roughly 1.26 to 1.5.

Here is that one list walked at both strides.

<svg role="img" viewBox="0 0 720 290" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>One scale of eleven sizes, 16 times 1.125 to the power n, from 14.2 to 46.2 pixels, walked two ways. Above, the interface steps through adjacent sizes, 14.2, 16 and 18, each about 1.125 times the last. Below, content steps through every other size, 16, 20.3, 25.6, 32.4 and 41.1, each about 1.27 times the last.</title>
<rect x="0" y="0" width="720" height="290" fill="#f7f6f2"/>
<text x="24" y="34" font-size="14" font-weight="600" fill="#1f5fbf">Interface: one step at a time, ×1.125</text>
<path d="M38.2 104 Q62.3 70 86.5 104" fill="none" stroke="#1f5fbf" stroke-width="2"/>
<path d="M86.5 104 Q111.8 70 137.1 104" fill="none" stroke="#1f5fbf" stroke-width="2"/>
<text x="38.2" y="150" font-size="14.2" fill="#1a1a1a" text-anchor="middle">Aa</text>
<text x="38.2" y="174" font-size="12" fill="#5a5850" text-anchor="middle">14.2</text>
<text x="86.5" y="150" font-size="16" fill="#1a1a1a" text-anchor="middle">Aa</text>
<text x="86.5" y="174" font-size="12" fill="#5a5850" text-anchor="middle">16</text>
<text x="137.1" y="150" font-size="18" fill="#1a1a1a" text-anchor="middle">Aa</text>
<text x="137.1" y="174" font-size="12" fill="#5a5850" text-anchor="middle">18</text>
<text x="190.1" y="150" font-size="20.3" fill="#1a1a1a" text-anchor="middle">Aa</text>
<text x="190.1" y="174" font-size="12" fill="#5a5850" text-anchor="middle">20.3</text>
<text x="245.9" y="150" font-size="22.8" fill="#b5b2a8" text-anchor="middle">Aa</text>
<text x="245.9" y="174" font-size="12" fill="#5a5850" text-anchor="middle">22.8</text>
<text x="304.7" y="150" font-size="25.6" fill="#1a1a1a" text-anchor="middle">Aa</text>
<text x="304.7" y="174" font-size="12" fill="#5a5850" text-anchor="middle">25.6</text>
<text x="367.0" y="150" font-size="28.8" fill="#b5b2a8" text-anchor="middle">Aa</text>
<text x="367.0" y="174" font-size="12" fill="#5a5850" text-anchor="middle">28.8</text>
<text x="433.2" y="150" font-size="32.4" fill="#1a1a1a" text-anchor="middle">Aa</text>
<text x="433.2" y="174" font-size="12" fill="#5a5850" text-anchor="middle">32.4</text>
<text x="503.8" y="150" font-size="36.5" fill="#b5b2a8" text-anchor="middle">Aa</text>
<text x="503.8" y="174" font-size="12" fill="#5a5850" text-anchor="middle">36.5</text>
<text x="579.4" y="150" font-size="41.1" fill="#1a1a1a" text-anchor="middle">Aa</text>
<text x="579.4" y="174" font-size="12" fill="#5a5850" text-anchor="middle">41.1</text>
<text x="660.6" y="150" font-size="46.2" fill="#b5b2a8" text-anchor="middle">Aa</text>
<text x="660.6" y="174" font-size="12" fill="#5a5850" text-anchor="middle">46.2</text>
<path d="M86.5 186 Q138.3 234 190.1 186" fill="none" stroke="#b5501f" stroke-width="2"/>
<path d="M190.1 186 Q247.4 234 304.7 186" fill="none" stroke="#b5501f" stroke-width="2"/>
<path d="M304.7 186 Q369.0 234 433.2 186" fill="none" stroke="#b5501f" stroke-width="2"/>
<path d="M433.2 186 Q506.3 234 579.4 186" fill="none" stroke="#b5501f" stroke-width="2"/>
<text x="24" y="270" font-size="14" font-weight="600" fill="#b5501f">Content: every other step, ×1.27</text>
</svg>

The interface moves one step at a time, where small differences are enough. Content moves two steps at a time and gets the larger jumps a reading page needs, from the same eleven sizes.

The list then has to be rounded, and rounding is where a formula stops being a specification. Rounding 16 × 1.125ⁿ to whole even pixels produces 26, 32 and 42 as well as 28 and 36. A team that keeps only some of them has made a choice the formula doesn't record.

So the systems publish the list. Carbon publishes its scale as code: a function in `scale.ts` that adds a growing increment rather than multiplying, which is why its list reads 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 54, 60. USWDS publishes a literal map from step 1 at 12px to step 20 at 140px. In both, the published artefact is the list, and the ratio is its rationale.

A size chosen off the formula is fine when it's named. A round 48 where the formula gives 46, or a 72 where it gives 74, buys a number people can remember. Say you keep 48 and don't write it down. The next person to extend the scale recomputes the formula, gets 46, and now your system has both.

Two traps recur.

- **Steps too close to see.** A dashboard using 13, 14 and 15px for three label levels has three styles nobody can tell apart. The toolkit's rule is to collapse them to two sizes and separate those by weight or colour.
- **A large ratio walked at content's stride.** A team picks 1.25 for its headings, then lets content skip steps as well, and the h2 lands at 1.56 times the h3. The ratio belongs to the interface's single step; content's double step follows from it.

Choose a small ratio, 1.125 or 1.2, for the interface's adjacent steps, let content take every other step, and round once. **Publish the rounded list, not the formula, and mark every off-formula size as a named exception.** The two strides are a synthesis of what the systems ship rather than any one system's rule; publishing the list is what Carbon and USWDS both do.

Then check the stride against reading sites before you keep it. Walked strictly from an 18px body on a 1.125 scale, every other step puts your h2 at 36, twice the body. Tailwind's 18px prose sets 30, GitHub's markdown 1.5 times the body and GOV.UK about 1.9.

Reading sites settle on an h2 of about 1.5 to 1.7 times the body, an h3 of about 1.25 and an h4 at the body size in bold. One product that started on the strict stride moved to 48, 28, 22 and 18 for those reasons ([type on a phone](type-on-a-phone.md) walks it). The stride says which list your sizes come from; the reading-site ratios say which of them to take.

---

## Choosing line height

Either the style's role or a 4px grid: a value per role (reading text, labels, headings, display) survives any size, while stepping each size onto a 4px grid buys whole-pixel boxes at the price of a lookup table, and code takes a unitless number either way.

Take a 48px heading that wraps to two lines and inherits the body's 1.5. Its lines sit 72px apart. Here it is beside the same heading at 1.1.

<svg role="img" viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same two-line 48 pixel heading set twice. Left, at the body line height of 1.5, its lines sit 72 pixels apart and the gap between them is wider than a 24 pixel line of body text. Right, at the heading line height of 1.1, its lines sit about 53 pixels apart and read as one heading.</title>
<rect x="0" y="0" width="720" height="260" fill="#f7f6f2"/>
<text x="24" y="30" font-size="14" font-weight="600" fill="#1a1a1a">48px at 1.5: lines 72px apart</text>
<text x="24" y="100" font-size="48" font-weight="600" fill="#1a1a1a">Plans for</text>
<text x="24" y="172" font-size="48" font-weight="600" fill="#1a1a1a">every team</text>
<line x1="282" y1="100" x2="282" y2="172" stroke="#b5501f" stroke-width="2"/>
<text x="290" y="141" font-size="13" fill="#b5501f">72px</text>
<text x="24" y="212" font-size="16" fill="#5a5850">Body text at 16 on a 24px line sits</text>
<text x="24" y="236" font-size="16" fill="#5a5850">under the heading for comparison.</text>
<text x="380" y="30" font-size="14" font-weight="600" fill="#1a1a1a">48px at 1.1: lines about 53px apart</text>
<text x="380" y="100" font-size="48" font-weight="600" fill="#1a1a1a">Plans for</text>
<text x="380" y="153" font-size="48" font-weight="600" fill="#1a1a1a">every team</text>
<line x1="638" y1="100" x2="638" y2="153" stroke="#b5501f" stroke-width="2"/>
<text x="646" y="131" font-size="13" fill="#b5501f">53px</text>
<text x="380" y="193" font-size="16" fill="#5a5850">Body text at 16 on a 24px line sits</text>
<text x="380" y="217" font-size="16" fill="#5a5850">under the heading for comparison.</text>
</svg>

On the left the gap between the heading's own lines is wider than a line of body text, so it reads as two headings. On the right it holds together. Why Figma's 150% becomes `line-height: 1.5` and never `150%` in code is in [line height and letter spacing, from Figma to the browser](line-height-letter-spacing-figma-to-css.md); the question here is what decides the number.

**Role-based systems** ship a handful of ratios. Primer's base tokens are `--base-text-lineHeight-tight: 1.25`, `snug: 1.375`, `normal: 1.5` and `relaxed: 1.625`, and every functional style picks one: body large and medium take `normal`, display takes `snug`. Spectrum has two, 1.3 and 1.5. USWDS has six system values from 1 to 1.75, with headings at 1.2 and body at 1.62.

GOV.UK looks grid-like in source but behaves by role. Its Sass map writes line heights in pixels, then converts each to a ratio before output, and the ratios fall by role: 1.32 for the 19px body, about 1.1 for the 36px and 48px headings.

**Grid-stepped systems** write each size's line height as a length. Material's tokens are rem lengths: `body-large` 1rem on 1.5rem, `title-large` 1.375rem on 1.75rem, `display-large` 3.5625rem on 4rem, every one a multiple of 4px. Radix Themes does the same in pixels (12/16, 14/20, 16/24, 18/26, 24/30). Fluent's web tokens pair `fontSizeBase300: 14px` with `lineHeightBase300: 20px`.

What the grid buys is a box height that's always a whole multiple of 4, so a list row or a button lands where the layout grid says. What it costs is a table per size and a ratio that wanders. Radix's 18/26 is 1.44 and its 24/30 is 1.25, so adjacent sizes don't read as one family.

The two can often be reconciled by choosing the sizes. With a 150% ratio, any size that is a multiple of 8 lands on a 4px grid (16 → 24, 24 → 36, 32 → 48); sizes that are multiples of 4 but not 8 miss (12 → 18, 20 → 30). A scale built from round pixel line heights shows the ratio each one implies:

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

Both approaches agree on the shape: line height falls as size rises. The gap between lines grows with the font, which is what the figure above shows. The specialist ranges are about 1.5 for reading text, 1.2 to 1.3 for one-line UI text and 1.1 to 1.2 for headings ([Better Web Type](https://betterwebtype.com/8-tips-for-remarkably-better-typography/), [Pimp my Type](https://pimpmytype.com/line-length-line-height/)).

The research behind any particular ratio is thin. [Rello and colleagues (CHI 2016)](https://dl.acm.org/doi/10.1145/2858036.2858204) report little effect of line spacing within the usual range. So the ratios are craft consensus, and the tested part is the WCAG floor.

That floor is [WCAG 1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html), and it's why the unit matters beyond tidiness. A reader may override line height to 1.5 times the font size, paragraph spacing to twice the font size and letter spacing to 0.12em, and the page must survive it. A unitless line height inherits as a ratio, so an override on the body flows into every descendant.

What breaks is a box of fixed height around text. Take a 20px card title on two lines at 1.2, in a box fixed at 48px. Under the reader's 1.5 those two lines need 60px, and the bottom of the second is clipped. A code block with a set height fails the same way.

Set line height by role, four values at most: reading text 1.5, labels and other one-line UI text 1.3, headings 1.2, display 1.1. **Ship them unitless, and never put text in a box of fixed height.**

Grid-stepping is defensible in a dense tool whose rows must land on a 4px grid, and that's the constraint to name if you choose it; sizes in multiples of 8 make the two approaches give the same numbers for most of the scale. Both approaches are established. Roles win on upkeep, because four numbers are easier to keep than a table.

---

## Weight by role

One weight per role: regular for reading and UI text, semibold for every heading level, and the largest display sizes a step lighter than the headings.

Size sets a heading's level; weight sets its role. Make the h2 bold and the h3 semibold, and a reader gets two signals that disagree about how different the levels are. The size says one step; the weight says another.

Primer's functional tokens are the clearest statement of one weight per role. `--text-title-weight-large`, `medium` and `small` are all `semibold` (600), `--text-display-weight` is `medium` (500), and `--text-body-weight` is `normal` (400). Atlassian's headings use a custom bold of 653, a reminder that a weight token is a role, not a number from 100 to 900.

Display goes lighter for an optical reason. At 60px and above a semibold stroke is heavy enough to dominate a page, and the size already carries the emphasis. Carbon goes furthest, setting `fluidDisplay01` and its siblings at its light weight.

Small text pulls the other way. Apple warns against Ultralight, Thin and Light at small sizes, and Pimp my Type puts the threshold at 14 to 20px, below which a light face "soon looks too delicate". A dense tool needs two weights, 400 and 600 (or 500), and no third. Why weight shouldn't appear in style names is in [naming text styles](naming-text-styles.md).

Give headings one weight, body and UI text another, and display one lighter than the headings. **Primer's 400, 600 and 500 is a well-evidenced default, with no light weight at text sizes.**

---

## Display cuts

Tracking and the display cut overlap, so tracking computed for the text cut must not be applied to the display cut again, and where Figma has to draw what the browser renders, the two cuts ship as static families switched at a named size.

Take an illustrative case. A team tightens Inter's tracking as size rises, then switches its large headings to Inter Display and keeps the same tracking values. The headings now look cramped. The display cut was already drawn tighter, so the team has tightened twice.

Optical sizing is the reason. A typeface with optical sizes has different drawings for different sizes: text cuts with a taller x-height, looser spacing and sturdier details for small sizes, and display cuts with finer details and tighter spacing for large ones.

Inter 4 ships both, as static families (Inter and Inter Display) and as one variable font whose `opsz` axis runs from 14 to 32, by the toolkit's measurement of the 4.1 file. With `font-optical-sizing: auto`, which every engine supports, the browser sets `opsz` to the font size in CSS pixels. Text at 14 and below gets the pure text drawing, text at 32 and above the pure display drawing, and the sizes between a blend.

Apple's tracking table for SF Pro shows the two mechanisms working together. Tracking tightens through the text sizes, reaching −26 thousandths of an em at 17pt, then reverses. By 24pt it is positive, and it stays positive through the display sizes before returning to zero at 80pt.

The reversal is the display cut. SF switches to its display design around 20pt, and that design is spaced so much tighter that Apple adds space back. New York, a serif without that switch, simply tightens steadily to −16 thousandths at 72pt.

So the text cut's negative tracking curve doesn't carry over to a display cut. The toolkit's measurement of Inter Display found its lowercase sidebearings about a quarter narrower than Inter's: tracking already applied in the drawing.

Figma is why the static route still matters. In the toolkit's testing, Figma draws a variable font at the instance its axes are set to and doesn't move `opsz` with size. A 28px heading in the variable file is therefore the text drawing in Figma and a blend in the browser.

Shipping Inter and Inter Display as separate families, and naming the size at which a style switches family, makes both sides draw the same glyphs. The cost is a discrete jump where the variable font would blend, and two families to load.

The last question is how precisely to state tracking. Inter 3's "dynamic metrics" formula gave tracking to four decimal places per pixel size; it was fitted to Inter 3 and has been withdrawn, and no reader can see a difference of 0.1%. Tracking stated per text style, rounded to half a percent, gives a value a designer can type and a reviewer can check: 12px 0, 16px −1%, 22px −2%.

Two more tracking rules from the toolkit apply to every face. Large headings tighten by 1 to 2% at most, and all caps and small caps are always spaced out, starting at 0.05 to 0.1em. In CSS, tracking is written in em; the conversion is in [line height and letter spacing](line-height-letter-spacing-figma-to-css.md).

If Figma parity doesn't matter to you, use the variable font with `font-optical-sizing: auto`. If it does, ship static text and display families and switch at a named size inside the axis range. **Track the text cut by size in half-percent steps, and give the display cut little or none until its largest sizes.**

Apple and the font itself document the mechanism; the static files are the safer choice for a team that measures Figma against the browser, because they are the one setup where both draw the same glyphs.

---

## Style names

Name styles by role and size, never by HTML tag, because the two strides only work if a level isn't a size.

Content's h3 takes Heading sm while a component's h3 may take Heading xs. On a phone, content's h2 may render at the size Heading sm has on a desktop. A style named `h2` can't express any of that.

The prose container is where tags meet styles: it maps each tag to a style, and that mapping is documented as the content role's own. [Naming text styles](naming-text-styles.md) makes the full argument, with Material, Polaris, CMS.gov and GOV.UK as cases.

Name your styles by role and size, map tags to styles in the prose container, and write the mapping down. **A tag is a level and a style is a size; keep them apart so content and components can map the same tag differently.**

---

## Cheat sheet

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

## The short version

A product with both an interface and articles needs one type scale, not two; Carbon is the system that tried two and merged them. Build yours from a small ratio such as 1.125, round it once, publish the rounded list, and name any size you picked off the formula. Interface text steps through adjacent sizes. Long-form content steps through every other one, which at 1.125 gives the roughly 1.27 ratio between heading levels that GOV.UK and GitHub use; check the result against reading-site ratios before you keep it.

Set line height by role rather than by size: about 1.5 for reading text, 1.3 for labels and one-line UI text, 1.2 for headings and 1.1 for display, written unitless in code. A dense tool that needs every row on a 4px grid can step each size instead, and sizes in multiples of 8 make the two approaches agree.

Weights go by role: regular for text, one semibold for every heading level, and a lighter display. If your face has a display cut, don't apply the text cut's tracking to it again, and if Figma has to match the browser, ship text and display as static families and switch at a named size.

State tracking per style in half-percent steps. Name every style by role and size, so content and components can map the same tag to different styles. One scale and the role-based line heights are consensus; the strides and the static-family trade are judgements built on what the systems ship.

---

## What to re-check later

Researched November 2026.

- **How the values were read.** Sizes, line heights and weights come from source wherever source exists: GOV.UK Frontend 6.6 (`_typography-responsive.scss`), USWDS `uswds-core` settings and tokens, Carbon's `@carbon/type` (`styles.ts`, `scale.ts`), Material Web's generated `md-sys-typescale` tokens, Apple's Human Interface Guidelines data file (the SF and New York tracking tables), `@adobe/spectrum-tokens` 15.6, `@primer/primitives` 11.10, `@shopify/polaris` 13.9, `@fluentui/tokens`, `@radix-ui/themes`, `github-markdown-css` and `tailwindcss-typography`. Atlassian's and Fluent's values come from their documentation pages.
- **The toolkit's own measurements.** Two were made from the Inter 4.1 font files with fontTools: the `opsz` axis range (14 to 32) and Inter Display's narrower sidebearings.
- **Figma's optical sizing behaviour** is the toolkit's documented finding, not a Figma statement. If Figma starts driving `opsz` from font size, the case for static display files weakens.
- **GOV.UK's scale** has not changed since Frontend 6.0; 6.6.0 (15 October 2026) was the latest release when re-checked in November 2026. Re-read `_typography-responsive.scss` before quoting it.
- **Inter 3's dynamic-metrics page** still returned a 404 on the live site in November 2026; only the archived copy exists.
- **Atlassian's weight tokens** were re-checked against `@atlaskit/tokens` 20.8.2 in November 2026.
- **Rello and colleagues** are cited from the abstract only.
- **Where this came from.** This guide was split out of a longer guide on type for UI and content; its sister pieces are [space between prose elements](space-between-prose-elements.md) and [type on a phone](type-on-a-phone.md), which holds the worked example. The toolkit's distilled rules are in `knowledge/ui/design/visual.md#typography`, `#type-for-ui-and-long-form-content` and `#one-size-scale-per-screen`.
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

**Cited but not resolved to a URL**

- Richard Rutter, *Web Typography* (2017): cited but not read; its chapters on scale were not available online.
