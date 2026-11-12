# Space between prose elements

Why long-form content should be spaced from a handful of tokens owned by one prose container, not from a baseline grid or from margins on each style, and how the same structure is drawn in Figma.

Researched November 2026. Gaps were read from source: GOV.UK Frontend 6.6 (`_spacing.scss`, the typography, list and section-break mixins), USWDS (`usa-prose`, `uswds-core` settings, the `usa-list` mixin), `github-markdown-css`, `tailwindcss-typography` (`styles.js`) and Elastic's `EuiText` source; Atlassian from its typography documentation. Browser support for `lh`, `rlh` and `text-box-trim` comes from MDN's compatibility data; re-checked in November 2026, `text-box-trim` is now marked Baseline 2026 (newly available since August 2026, when Firefox 154 shipped it). Figma behaviour comes from the Plugin API reference, a staff forum reply and the 10 June 2026 plugin update that made slots generally available. The x-height and `ch` measurements are the toolkit's own, from the Inter 4.1 and mono font files. This piece was split out of a longer guide on type for UI and content; the scale it spaces is in [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), and what changes on a phone is in [type on a phone](type-on-a-phone.md). The toolkit's distilled rules are `~/Projects/toolkit/knowledge/ui/design/visual.md#type-for-ui-and-long-form-content`.

---

## What this answers

The thesis: prose is spaced by four or five gaps from the spacing scale, ordered so that every heading has clearly more space above than below and more above than a paragraph gap; one container owns those gaps for its direct children only, and nothing else in the system carries a margin.

- Where does the space between paragraphs and headings come from, and is a baseline grid worth it?
- Who owns that space: a prose container or the layout components?
- Should sections carry a divider, and how is it spaced?
- How wide should the column be, and how do you know what a `ch` gives?
- How should code sit inside prose?
- How is any of this drawn in Figma, which has no space-before?

Section 7 is the cheat sheet and section 8 the short version.

---

## 1. Where does the space between prose elements come from?

**The short answer.** From spacing tokens, not from a baseline grid. Every system read spaces prose with a handful of fixed gaps: one between paragraphs, a smaller one between list items, a larger one above each heading level and a small one below it.

Vertical rhythm, in its strict form, means every line of every block sits on a grid derived from the body line height, so that baselines align across columns as they do in print. CSS makes that hard. A line box centres its text in half-leading above and below, so a 22px heading at 1.2 and an 18px paragraph at 1.5 put their baselines at different offsets inside boxes of different heights, and snapping both to a 27px grid needs fractional margins nobody can maintain. The toolkit records one specimen where the derived gap below a heading came to 6.9px. Zell Liew, who wrote the most thorough account of doing it anyway, concluded that perfect responsive vertical rhythm across browsers is impossible: "Vertical Rhythm IS important. Following it to the pixel isn't."

What ships instead is a short list of gaps, and the systems disagree less than their syntax suggests:

| System | Body | Paragraph gap | h2 above / below | h3 above / below | List item gap |
|---|---|---|---|---|---|
| GOV.UK (desktop) | 19 | 20 | 40 / 30 | 30 / 20 | 5 |
| USWDS `usa-prose` | 16 | 16 | 48 / 16 | 33 / 16 | 4 |
| GitHub `markdown-body` | 16 | 16 | 24 / 16, plus a rule | 24 / 16 | 4 |
| Tailwind `prose-lg` | 18 | 24 | 56 / 32 | 40 / 16 | not read |

Each system builds its numbers differently. USWDS sets `* + * { margin-top: 1em }` and gives headings `margin-top: 1.5em` in their own font size, so a 32px h2 gets 48 above and the paragraph after it gets 16. GitHub gives every heading level the same 24 above and 16 below. GOV.UK puts margin only on the bottom of each element and adds padding to the top of a heading when it follows a paragraph or a list: a `govuk-heading-l` after a paragraph sits under the paragraph's 20px margin plus its own 20px padding, 40 in all.

Two patterns survive the disagreement. The paragraph gap is roughly one body line or a little under it (Butterick's range is half to the whole of the body size; GOV.UK's 20 sits under a 25px line, USWDS's 16 under a 26px one). And the space above a heading is larger than the space below it, so the heading reads as the start of what follows rather than the end of what came before. How much larger varies more than the commentary implies: Better Web Type asks for at least twice, USWDS gives three times, GOV.UK only 1.33. The rule that matters is the one GOV.UK and USWDS both keep: every heading's space above must clearly exceed the paragraph gap, or a short bold heading reads as a bold paragraph. Tailwind's `prose-lg` holds this down the levels, with h3 at 40 and h4 at 32 against a 24 paragraph gap. It is common, not universal: WordPress's Twenty Twenty-Five theme gives every block one 1.2rem gap (the toolkit's reading).

A "one line" paragraph gap rarely lands on the spacing scale: at an 18px body on 1.5 it is 27. The toolkit's rule is to take the nearest token (24) rather than add a 27 to the scale.

CSS gained two tools that make this easier to express, and one that changes what a gap measures. The `lh` unit is the element's own computed line height and `rlh` the root's; both are in every engine (Chrome 109 and 111, Firefox 120, Safari 16.4), so `margin-block-start: 1lh` gives a paragraph gap of exactly one line without anyone computing 27. The trap is that `lh` on a heading is the heading's line, not the body's, so a heading's margin in `lh` grows with the heading; use `rlh` or a token when the gap should follow the body. And `text-box-trim` (Chrome 133, Safari 18.2, Firefox 154; Baseline since August 2026) removes the half-leading above the first line and below the last, so a gap measures from cap height to baseline rather than from line box to line box. It makes Figma and the browser agree more closely; [line height and letter spacing](line-height-letter-spacing-figma-to-css.md#7-vertical-trim-and-what-it-costs) covers what it costs.

**What to do.** Space prose from a small set of spacing tokens: one paragraph gap near one body line, one list-item gap a quarter to half of that, and per heading level a gap above that clearly exceeds the paragraph gap and a gap below that is clearly smaller than its own gap above. Skip the baseline grid. That is consensus across every system read; the multipliers are where they differ, and this piece's judgment is that the ordering matters more than the exact ratio.

---

## 2. Who owns that spacing: a prose container, or the layout components?

**The short answer.** In long-form content, a prose container. In an interface, layout components. The two meet at one rule: spacing rhythm stops at a component's edge.

The prose container is one element whose descendants get their gaps from relationships rather than from their own margins. The mechanism is the "lobotomised owl" selector, `* + *`, which gives every element after the first a top margin and leaves the first with none; headings then override it with their larger gap. USWDS's `usa-prose` is the pattern in its plainest form: `& > * + * { margin-top: 1em }`, and `& > * + h2` (and the other levels) `{ margin-top: 1.5em }`, both scoped to direct children. GitHub's `.markdown-body` does the same with explicit margins on each element. Elastic's `EuiText` wraps any content and applies a scaled set of heading, paragraph and list styles, with a constrained measure of `max(64ch, 75%)`. Tailwind's `prose` class is the same idea as a utility.

The pattern exists because Markdown and CMS output arrive as bare elements. A writer types two paragraphs and a heading; nobody is going to add a spacing component between them. The container is the only place the gaps can live, and it keeps text styles free of margins, so a heading style used inside a card does not drag article spacing in with it.

Interface systems do the opposite, and say so. Atlassian's typography documentation recommends a separate text component per paragraph in code, with the spacing between them set by a Stack; its paragraph spacing values (16 after Body L, 12 after Body M, 8 after Body S) exist only in its Figma text styles. Polaris and Radix space UI text with their own Stack, Flex and Box primitives. In a form or a settings panel that is right: the gaps belong to the layout, and a margin on the text would fight it.

The two models collide when a component lands inside an article. A callout, a figure with a caption, an embedded card: an unscoped owl selector reaches into it and gives every element after its first a top margin, and the component's own spacing is doubled or overridden. Scoping the container's selectors to direct children (`> * + *`, as USWDS does) is the fix, and it states the rule: the article's rhythm reaches the component as one block, with the paragraph gap above and below it; the space inside comes from the component's own tokens.

The toolkit's build rule, tested on its own projects, gives the selectors: `* + *` takes the flow gap, `* + :is(h2, h3, h4)` the larger section gaps, and a heading's next sibling the smaller gap below it; the first child has none. Where styling classes are not used, the container is an element or custom element (`~/Projects/toolkit/knowledge/ui/design/visual.md#type-for-ui-and-long-form-content`).

**What to do.** Put long-form content in one prose container that owns every gap between its direct children, and keep margins off text styles and off components. Inside the container a component is one block; outside it, layout components space the interface. This is consensus: every content-rendering system read uses a container and every interface system uses layout components, and direct-child scoping is how USWDS keeps them from colliding.

---

## 3. Should major sections carry a divider, and how is it spaced?

**The short answer.** A hairline between major sections is common and optional. Where one is used, it belongs to the section it introduces, so it sits closer to the heading below it than to the paragraph above, and it lives inside the heading's space-above rather than adding to it.

GitHub puts the rule under the heading rather than before it: `.markdown-body h2` carries `border-bottom: 1px solid` and `padding-bottom: .3em`, so every h1 and h2 is underlined, and the space above stays the plain 24. GOV.UK draws its rule as an element: `govuk-section-break--visible` is an `<hr>` with a 1px bottom border, spaced by equal top and bottom margins from the responsive scale (unit 6 for the large break: 30 on desktop, 20 on mobile). Tailwind's `prose` spaces a bare `<hr>` at 48 on each side and resets the top margin of whatever follows it to zero, so a heading after a rule does not add its own gap on top.

That last detail is the spacing question in miniature. If an h2 has 48 above it and a rule is placed before it with margins of its own, the two add, and the section break becomes the largest gap on the page by accident. The two consistent options are a rule drawn by the heading itself (a top border with padding, inside the heading's 48) or a rule element whose following sibling loses its top margin. The rule should also never appear before the first section of an article, where it separates the title from nothing.

Where the rule sits within the gap is a proximity question, and the evidence is thin: GOV.UK centres its rule, GitHub attaches it to the heading. Gestalt proximity argues for attaching it to what it introduces, so the space between rule and heading should be smaller than the space between the previous paragraph and the rule.

**What to do.** If the design uses a divider, draw it as part of the h2 (a top border with padding), so the gap above the heading includes it, and skip it on the first h2. Keep the heading-to-rule distance smaller than the rule-to-paragraph distance. The option exists in every system read; the placement is this piece's judgment from proximity, since no system documents its reasoning.

---

## 4. How wide should the column be?

**The short answer.** 65 to 75 characters, capped at 80, and measured in rendered characters rather than trusted to a `ch` value, because a `ch` is the width of the zero and holds a different count in every face.

The ranges disagree at the edges: Butterick allows 45 to 90, Baymard 50 to 75, GOV.UK 75, and WCAG 1.4.8 (AAA) caps at 80. The toolkit aims at 65 to 75 and caps at 80, because 80 is the one external reference and the others sit under it (`~/Projects/toolkit/knowledge/ui/design/visual.md#typography`).

The unit is where teams go wrong. A `ch` is the advance width of the digit zero, which in most sans faces is wider than an average letter, so `65ch` sets more than 65 characters. The toolkit measured Inter: `65ch` gave about 80 characters a line and `55ch` about 71 to 79. Elastic's `max(64ch, 75%)` therefore runs longer than it reads. Pixel measures need the same check: Inter at 18px sets about 87 characters on a 720px line, measured from the font's advance widths on an English sample paragraph at 0.459em per character, before tracking. A measure of 600 to 640px, or `max-inline-size: 36em`, gives about 73 to 77. Tables, code and dashboards do not inherit the prose measure.

**What to do.** Set the measure as a `max-inline-size` on the prose column, then count the characters it renders in the actual face and adjust. In Inter, about `55ch` or `36em` lands in the 65 to 75 band.

---

## 5. How should code sit inside prose?

**The short answer.** Inline code at the same size as the sentence when the monospace face's x-height matches the text face's; code blocks a step below the body, so a line holds enough columns. The tinted background on inline code is a code-only effect, because Figma cannot fill a range of text.

The monospace choice is where this starts. A mono face whose x-height is close to the text face's can run at `1em` inline and sit level with the words around it; one with a smaller x-height looks shrunken at the same size and forces a scaled-down `0.875em` or `0.9285em` (Primer's `--text-codeInline-size`), which then looks too small beside capitals. The toolkit's measurement, x-height over units per em, puts JetBrains Mono at 0.550 against Inter's 0.546, a close match; IBM Plex Mono is 0.516 and Source Code Pro 0.478. MDN pairs Inter with JetBrains Mono, and turns programming ligatures off in prose.

Blocks are different, because a mono face is wide and a code line cannot wrap without breaking meaning. GitHub sets `pre` at 85% of the body with a line height of 1.45 and 16px of padding; Tailwind's `prose-lg` sets it at 16 on an 18 body, with a line height of 1.75. Primer's code block token is 13px. The shipped cluster sits at 0.85 to 0.89 of the body for content pages: one step down the scale, not two. Space outside a block runs one to one and a half body lines. If the content includes code wider than the block holds at one step down, two steps is a defensible named exception: JetBrains Mono advances 0.6em, so 680px of code holds about 80 columns at 14px and 70 at 16px.

Inline code backgrounds are the Figma trap. Figma can colour a range of characters but cannot fill the box behind them, so a tinted chip behind `inline code` exists only in CSS. Designing around it (colour and the mono face carry the distinction in Figma; the tint is a code addition that parity checks waive by name) is honest about the gap.

**What to do.** Choose a monospace by x-height match, run inline code at `1em` when the match holds, set blocks one step below the body, and document the inline tint as a code-only effect. The size cluster is consensus across the content systems read; the x-height test is the toolkit's own method.

---

## 6. How is any of this drawn in Figma?

**The short answer.** With nested auto-layout stacks whose gaps are bound to spacing variables, because Figma has no space-before on text and its paragraph spacing works only inside one text node.

Figma's paragraph spacing is a property of a text node, applied between paragraphs inside that node, from the style of the node's first character (Plugin API reference; a staff reply on the forum confirms it). It cannot put more space above a heading than below it, and it does nothing between two separate text layers. An auto-layout frame has one gap for all its children. The way to draw a prose container is therefore two levels of stack: each heading and its content in a section frame with the small gap, sections in a parent frame with the large gap, both gaps bound to spacing variables so the numbers match the CSS tokens. Since slots reached general availability on 10 June 2026, a single Prose component can wrap that parent with a slot for its sections, which gives designers a container to drop content into without detaching anything. A responsive layout adds a mode to the spacing collection, so a mobile frame resolves the smaller heading gaps ([type on a phone](type-on-a-phone.md#5-does-the-space-between-prose-elements-shrink)) without a second component. A parity check then measures two gaps, not a margin per element.

The construction to avoid is a component per element with its spacing baked in as padding: a "Heading 2" with 48 above it, placed after a "Paragraph" with 24 below it. In CSS those margins would collapse to 48; in Figma the paddings add to 72, and the two sides disagree from the first frame. Spacer layers fail the same way.

**What to do.** Draw prose as nested stacks bound to spacing variables, optionally inside one slot-based Prose component, and never as padded per-element components. This is the toolkit's documented method; the slot-based component is optional because a plain frame works as well. Whether GOV.UK, USWDS, Polaris or Material ship prose components in their Figma kits was not verified.

---

## 7. Cheat sheet

| Decision | Do | Do not |
|---|---|---|
| Paragraph gap | about one body line, the nearest spacing token | a gap derived to a baseline grid |
| List item gap | a quarter to half of the paragraph gap | the paragraph gap |
| Heading gaps | above clearly larger than below, and larger than the paragraph gap | an h3 or h4 with less space above than a paragraph |
| Who spaces prose | one container, direct children only (`> * + *`) | margins on text styles or components |
| Component in an article | one block; its inside spaced by its own tokens | the owl selector reaching into it |
| Divider | part of the h2, inside its space-above, never before the first | a rule whose margins add to the heading's |
| `lh` units | `rlh` or a token for gaps that follow the body | `lh` on a heading for a body-sized gap |
| Measure | 65 to 75 characters, counted in the real face | trusting `65ch` to mean 65 characters |
| Inline code | 1em when x-heights match; tint documented as code-only | inline code scaled to 0.85 beside matching text |
| Code blocks | one step below the body | two steps, unless columns demand it and it is named |
| Figma | nested stacks on spacing variables, a mode for mobile | padded per-element components, spacer layers |

---

## 8. The short version

Space long-form content from tokens, not a baseline grid. CSS centres text in half-leading, so snapping blocks to whole body lines gives fractional margins nobody keeps; every system read uses a short list of gaps instead. The paragraph gap sits near one body line, list items get a quarter to half of that, and each heading gets a gap above that clearly exceeds both its own gap below and the paragraph gap, or it reads as a bold paragraph.

One prose container owns those gaps, applied to its direct children only, so a component inside an article stays one block whose inside is spaced by its own tokens; interface screens are spaced by layout components, and no text style or component carries a margin. A divider before major sections is optional; if used, it is part of the h2 and lives inside its space-above.

Cap the measure at 65 to 75 characters and count them in the real face, because `65ch` in Inter sets about 80. Pick a monospace by x-height so inline code can sit at 1em, and set code blocks one step below the body. In Figma, which has no space-before, draw the same thing as nested stacks bound to spacing variables, optionally in one slot-based Prose component.

---

## 9. What to re-check later

- **`text-box-trim`** became Baseline in August 2026; real-user version spread matters more than the table for a year or so.
- **Characters per line** were computed from Inter 4.1's advance widths on one English sample paragraph, without kerning or tracking. Other languages, or text with more capitals and figures, will differ by a few characters.
- **Unverified prose systems.** The Guardian, NYT, BBC GEL, Medium, Stripe and Microsoft Learn keep their CSS in bundles or refused the fetch, so they are not in the table.
- **Evidence quality.** No system read publishes research on gap ratios; the ordering rule is consensus, not a tested outcome.

---

## Sources

**Primary: system source and documentation**

- [GOV.UK Frontend, `_spacing.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_spacing.scss). Static and responsive spacing units.
- [GOV.UK Frontend, `_typography.mixin.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/core/_typography.mixin.scss). Heading and body margins, the padding added above headings after paragraphs.
- [GOV.UK Frontend, `_section-break.mixin.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/core/_section-break.mixin.scss) and [`_lists.mixin.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/core/_lists.mixin.scss).
- [USWDS, `_usa-prose.scss`](https://github.com/uswds/uswds/blob/develop/packages/usa-prose/src/styles/_usa-prose.scss). The owl selector scoped to direct children.
- [USWDS, `_settings-typography.scss`](https://github.com/uswds/uswds/blob/develop/packages/uswds-core/src/styles/settings/_settings-typography.scss). `$theme-heading-margin-top: 1.5em`, `$theme-paragraph-margin-top: 1em`.
- [USWDS, `usa-list` mixin](https://github.com/uswds/uswds/blob/develop/packages/uswds-core/src/styles/mixins/typography/usa-list.scss). List item gap of 0.25em.
- [`github-markdown-css`](https://github.com/sindresorhus/github-markdown-css/blob/main/github-markdown-light.css). Heading margins and borders, `pre` at 85%.
- [Tailwind Typography, `styles.js`](https://github.com/tailwindlabs/tailwindcss-typography/blob/main/src/styles.js). Gaps per preset, `hr` spacing.
- [Elastic EUI, `text.styles.ts`](https://github.com/elastic/eui/blob/main/packages/eui/src/components/text/text.styles.ts). `max(64ch, 75%)` measure.
- [Primer primitives, functional typography CSS](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/functional/typography/typography.css). Code sizes.
- [Atlassian, typography](https://atlassian.design/foundations/typography/). Paragraph spacing in Figma only, Stack in code.
- [MDN, `text-box-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim) and [browser compatibility data](https://github.com/mdn/browser-compat-data). Baseline 2026; `lh` and `rlh` support.
- [WebKit, line height units](https://webkit.org/blog/16831/line-height-units/). `margin-block: 1lh`.
- [Figma Plugin API, `TextNode.paragraphSpacing`](https://developers.figma.com/docs/plugins/api/properties/TextNode-paragraphspacing/), [staff reply](https://forum.figma.com/t/paragraph-spacing-settings-break-when-mixing-styles-in-single-text-block/35627/11) and [2026-06-10 plugin update](https://developers.figma.com/docs/plugins/updates/2026/06/10/update/). Slots generally available.

**Standards**

- [WCAG 2.2 Understanding 1.4.8 Visual Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html) and [1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html).

**Commentary: named type specialists**

- [Matthew Butterick, space between paragraphs](https://practicaltypography.com/space-between-paragraphs.html) and [summary of key rules](https://practicaltypography.com/summary-of-key-rules.html).
- [Better Web Type, 8 more tips](https://betterwebtype.com/8-more-tips-for-remarkably-better-typography/). Space above a heading at least twice the space below.
- [Baymard, line length](https://baymard.com/blog/line-length-readability).
- [Zell Liew, web typography is broken](https://zellwk.com/blog/web-typography-broken/).
- [Smashing, CSS baseline](https://www.smashingmagazine.com/2012/12/css-baseline-the-good-the-bad-and-the-ugly).
- [EightShapes, space in design systems](https://medium.com/eightshapes-llc/188bcbae0d62) and [Dan Hollick on spacer layers](https://typefully.com/DanHollick/oRrivx8MpmqH).

**Toolkit knowledge base and sister pieces**

- `~/Projects/toolkit/knowledge/ui/design/visual.md#type-for-ui-and-long-form-content` and `#typography`. The x-height and `ch` measurements, the prose selectors, the Figma build note, the nearest-token case.
- [One type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), [type on a phone](type-on-a-phone.md), [line height and letter spacing](line-height-letter-spacing-figma-to-css.md).
