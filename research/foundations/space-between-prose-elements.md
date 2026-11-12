# Space between prose elements

Why long-form content should be spaced by a handful of tokens owned by one prose container, not by a baseline grid or margins on each style, and how the same structure is drawn in Figma.

An article goes live and its headings look wrong. Each h3 sits exactly halfway between the paragraph above and the paragraph below, so it reads as a bold line of body text rather than the start of a section. A callout embedded in the same article has twice the space inside it that its designer drew. In Figma, the same page shows 72 pixels above every h2, where the browser shows 48.

---

## What this answers

- [Origins of prose spacing](#origins-of-prose-spacing): where prose spacing comes from
- [Spacing ownership](#spacing-ownership): who owns prose spacing
- [Section dividers](#section-dividers): whether sections carry a divider
- [Column width](#column-width): how wide the column should be
- [Code inside prose](#code-inside-prose): how code sits inside prose
- [Prose spacing in Figma](#prose-spacing-in-figma): how prose spacing is drawn in Figma

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs. The scale these gaps space is in [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), and what changes on a phone is in [type on a phone](type-on-a-phone.md).

---

## Origins of prose spacing

Prose spacing comes from spacing tokens, not a baseline grid: every system read spaces prose with a handful of fixed gaps, one between paragraphs, a smaller one between list items, and for each heading level a larger one above and a small one below.

The appeal of a baseline grid is easy to see. Vertical rhythm, in its strict form, means every line of every block sits on a grid derived from the body line height, so baselines align across columns as they do in print.

CSS makes that hard. A line box centres its text in half-leading above and below, so a 22px heading at 1.2 and an 18px paragraph at 1.5 put their baselines at different offsets, inside boxes of different heights. Snapping both to a 27px grid needs fractional margins nobody can maintain; the toolkit recorded one specimen where the derived gap below a heading came to 6.9px.

[Zell Liew](https://zellwk.com/blog/web-typography-broken/), who wrote the most thorough account of doing it anyway, concluded that perfect responsive vertical rhythm across browsers is impossible: "Vertical Rhythm IS important. Following it to the pixel isn't."

What ships instead is a short list of gaps. How different are the systems' lists? Less than their syntax suggests, as the table shows.

| System | Body | Paragraph gap | h2 above / below | h3 above / below | List item gap |
|---|---|---|---|---|---|
| GOV.UK (desktop) | 19 | 20 | 40 / 30 | 30 / 20 | 5 |
| USWDS `usa-prose` | 16 | 16 | 48 / 16 | 33 / 16 | 4 |
| GitHub `markdown-body` | 16 | 16 | 24 / 16, plus a rule | 24 / 16 | 4 |
| Tailwind `prose-lg` | 18 | 24 | 56 / 32 | 40 / 16 | not read |

Each system builds its numbers differently. USWDS sets `* + * { margin-top: 1em }` and gives headings `margin-top: 1.5em` in their own font size, so a 32px h2 gets 48 above and the paragraph after it gets 16. GitHub gives every heading level the same 24 above and 16 below.

GOV.UK puts margin only on the bottom of each element, and adds padding to the top of a heading when it follows a paragraph or a list. A `govuk-heading-l` after a paragraph sits under the paragraph's 20px margin plus its own 20px padding, 40 in all.

Here is the USWDS row drawn as a column of prose.

<svg role="img" viewBox="0 0 720 500" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A column of prose spaced as USWDS's usa-prose spaces it, with a 16 pixel body on a 26 pixel line. Paragraphs are 16 pixels apart. An h2 has 48 pixels above it and 16 below. An h3 has 33 pixels above it and 16 below. Each heading sits closer to the paragraph it introduces than to the one before it.</title>
<rect x="0" y="0" width="720" height="500" fill="#f7f6f2"/>
<rect x="40" y="32.5" width="440" height="9" rx="2" fill="#b9b6ac"/>
<rect x="40" y="58.5" width="440" height="9" rx="2" fill="#b9b6ac"/>
<rect x="40" y="84.5" width="264" height="9" rx="2" fill="#b9b6ac"/>
<line x1="520" y1="102" x2="520" y2="118" stroke="#b5501f" stroke-width="2"/>
<line x1="515" y1="102" x2="525" y2="102" stroke="#b5501f" stroke-width="2"/>
<line x1="515" y1="118" x2="525" y2="118" stroke="#b5501f" stroke-width="2"/>
<text x="532" y="115" font-size="13" fill="#b5501f">16: paragraph gap</text>
<rect x="40" y="126.5" width="440" height="9" rx="2" fill="#b9b6ac"/>
<rect x="40" y="152.5" width="264" height="9" rx="2" fill="#b9b6ac"/>
<line x1="520" y1="170" x2="520" y2="218" stroke="#b5501f" stroke-width="2"/>
<line x1="515" y1="170" x2="525" y2="170" stroke="#b5501f" stroke-width="2"/>
<line x1="515" y1="218" x2="525" y2="218" stroke="#b5501f" stroke-width="2"/>
<text x="532" y="199" font-size="13" fill="#b5501f">48 above the h2</text>
<text x="40" y="248" font-size="32" font-weight="700" fill="#1a1a1a">Who can apply</text>
<line x1="520" y1="256" x2="520" y2="272" stroke="#b5501f" stroke-width="2"/>
<line x1="515" y1="256" x2="525" y2="256" stroke="#b5501f" stroke-width="2"/>
<line x1="515" y1="272" x2="525" y2="272" stroke="#b5501f" stroke-width="2"/>
<text x="532" y="269" font-size="13" fill="#b5501f">16 below</text>
<rect x="40" y="280.5" width="440" height="9" rx="2" fill="#b9b6ac"/>
<rect x="40" y="306.5" width="264" height="9" rx="2" fill="#b9b6ac"/>
<line x1="520" y1="324" x2="520" y2="357" stroke="#b5501f" stroke-width="2"/>
<line x1="515" y1="324" x2="525" y2="324" stroke="#b5501f" stroke-width="2"/>
<line x1="515" y1="357" x2="525" y2="357" stroke="#b5501f" stroke-width="2"/>
<text x="532" y="346" font-size="13" fill="#b5501f">33 above the h3</text>
<text x="40" y="379" font-size="22" font-weight="700" fill="#1a1a1a">Applying from abroad</text>
<line x1="520" y1="385" x2="520" y2="401" stroke="#b5501f" stroke-width="2"/>
<line x1="515" y1="385" x2="525" y2="385" stroke="#b5501f" stroke-width="2"/>
<line x1="515" y1="401" x2="525" y2="401" stroke="#b5501f" stroke-width="2"/>
<text x="532" y="398" font-size="13" fill="#b5501f">16 below</text>
<rect x="40" y="409.5" width="440" height="9" rx="2" fill="#b9b6ac"/>
<rect x="40" y="435.5" width="440" height="9" rx="2" fill="#b9b6ac"/>
<rect x="40" y="461.5" width="264" height="9" rx="2" fill="#b9b6ac"/>
</svg>

Each heading sits much closer to the paragraph it introduces than to the one before it, and the space above each heading is clearly larger than the 16 between paragraphs. Those two relationships are what survive the systems' disagreement.

The first pattern is the paragraph gap: roughly one body line, or a little under it. [Butterick's](https://practicaltypography.com/space-between-paragraphs.html) range is half to the whole of the body size; GOV.UK's 20 sits under a 25px line and USWDS's 16 under a 26px one.

The second is that the space above a heading is larger than the space below it, so the heading reads as the start of what follows rather than the end of what came before. How much larger varies more than the commentary implies. [Better Web Type](https://betterwebtype.com/8-more-tips-for-remarkably-better-typography/) asks for at least twice, USWDS gives three times and GOV.UK only 1.33.

The rule that matters is the one GOV.UK and USWDS both keep: every heading's space above clearly exceeds the paragraph gap, or a short bold heading reads as a bold paragraph. That's the h3 in the opening scene. Tailwind's `prose-lg` holds it down the levels, with h3 at 40 and h4 at 32 against a 24 paragraph gap.

It's common, not universal. WordPress's Twenty Twenty-Five theme gives every block one 1.2rem gap, by the toolkit's reading.

A "one line" paragraph gap rarely lands on the spacing scale. At an 18px body on 1.5 it is 27, and the toolkit's rule is to take the nearest token, 24, rather than add a 27 to the scale.

CSS gained two units that make a one-line gap easy to write. The `lh` unit is the element's own computed line height and `rlh` the root's; both are in every engine (Chrome 109 and 111, Firefox 120, Safari 16.4). So `margin-block-start: 1lh` gives a paragraph gap of exactly one line without anyone computing 27.

The catch is that `lh` on a heading is the heading's line, not the body's. Write a heading's margin in `lh` and it grows with the heading. Where the gap should follow the body, `rlh` or a token does that.

A third addition changes what a gap measures. `text-box-trim` (Chrome 133, Safari 18.2, Firefox 154; Baseline since August 2026) removes the half-leading above the first line and below the last, so a gap runs from cap height to baseline rather than from line box to line box. It makes Figma and the browser agree more closely; [line height and letter spacing](line-height-letter-spacing-figma-to-css.md) covers what it costs.

Space your prose from a small set of spacing tokens: a paragraph gap near one body line, a list-item gap a quarter to half of that, and per heading level a gap above that clearly exceeds the paragraph gap and a gap below that is clearly smaller than its own gap above.

Skip the baseline grid. **Get the order of the gaps right; the exact ratios matter less.** The short list of gaps is consensus across every system read. The multipliers are where they differ, and the ordering is the safer thing to fix, because it's the one relationship every system keeps.

---

## Spacing ownership

In long-form content a prose container owns the spacing, in an interface layout components do, and the two meet at one rule: spacing rhythm stops at a component's edge.

Markdown and CMS output arrive as bare elements. A writer types two paragraphs and a heading, and nobody is going to add a spacing component between them. So the gaps have to live somewhere that sees the elements' relationships.

A prose container is that place: one element whose descendants get their gaps from their relationships rather than from margins of their own. The mechanism is the "lobotomised owl" selector, `* + *`, which gives every element after the first a top margin and leaves the first with none. Headings then override it with their larger gap.

USWDS's `usa-prose` is the pattern in its plainest form: `& > * + * { margin-top: 1em }`, and `& > * + h2` (and the other levels) `{ margin-top: 1.5em }`, both scoped to direct children. GitHub's `.markdown-body` does the same with explicit margins on each element, and Tailwind's `prose` class is the same idea as a utility.

Elastic's `EuiText` wraps any content and applies a scaled set of heading, paragraph and list styles, with a constrained measure of `max(64ch, 75%)`. In every case the text styles stay free of margins, so a heading style used inside a card doesn't drag article spacing in with it.

Interface systems do the opposite, and say so. [Atlassian's typography documentation](https://atlassian.design/foundations/typography/) recommends a separate text component per paragraph in code, with the spacing between them set by a Stack. Its paragraph spacing values (16 after Body L, 12 after Body M, 8 after Body S) exist only in its Figma text styles.

Polaris and Radix space UI text with their own Stack, Flex and Box primitives. In a form or a settings panel that's right: the gaps belong to the layout, and a margin on the text would fight it.

The two models collide when a component lands inside an article, which is the callout in the opening scene. An unscoped owl selector reaches into the callout and gives every element after its first a top margin, so the component's own spacing is doubled or overridden. A figure with a caption or an embedded card fails the same way.

Scoping the container's selectors to direct children (`> * + *`, as USWDS does) fixes it, and states the rule. The article's rhythm reaches the component as one block, with the paragraph gap above and below it; the space inside comes from the component's own tokens.

The toolkit's build rule, tested on its own projects, gives the full set of selectors:

- `* + *` takes the flow gap;
- `* + :is(h2, h3, h4)` takes the larger section gaps;
- a heading's next sibling takes the smaller gap below it;
- the first child has none.

Where styling classes aren't used, the container is an element or a custom element.

Put your long-form content in one prose container that owns every gap between its direct children, and keep margins off text styles and off components. **Inside the container a component is one block; outside it, layout components space the interface.** That's consensus: every content-rendering system read uses a container, every interface system uses layout components, and direct-child scoping is how USWDS keeps them from colliding.

---

## Section dividers

A divider is optional: a hairline between major sections is common, and where one is used it belongs to the section it introduces, so it sits closer to the heading below than to the paragraph above, inside the heading's space-above rather than added to it.

Say an h2 has 48 above it, and someone places a rule before it with margins of its own. The two add, and the section break becomes the largest gap on the page by accident. That's the spacing question in miniature.

The systems avoid it in different ways. GitHub puts the rule under the heading rather than before it: `.markdown-body h2` carries `border-bottom: 1px solid` and `padding-bottom: .3em`, so every h1 and h2 is underlined, and the space above stays the plain 24.

GOV.UK draws its rule as an element. `govuk-section-break--visible` is an `<hr>` with a 1px bottom border, spaced by equal top and bottom margins from the responsive scale: unit 6 for the large break, 30 on desktop and 20 on mobile.

Tailwind's `prose` spaces a bare `<hr>` at 48 on each side, and resets the top margin of whatever follows it to zero. So a heading after a rule doesn't add its own gap on top.

That leaves two consistent options: a rule drawn by the heading itself, as a top border with padding inside the heading's space-above, or a rule element whose following sibling loses its top margin. Here is the first beside the accident it avoids, with illustrative values.

<svg role="img" viewBox="0 0 720 290" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Two ways to put a rule before a section heading, with illustrative values. Left, a rule element with 48 pixels of margin on each side, followed by a heading: the break measures 96 pixels and the rule floats halfway between the paragraph and the heading. Right, the rule drawn as the heading's own top border inside its 48 pixel space above: 32 pixels from the paragraph to the rule and 16 from the rule to the heading, so the rule belongs to the section it opens.</title>
<rect x="0" y="0" width="720" height="290" fill="#f7f6f2"/>
<text x="24" y="30" font-size="14" font-weight="600" fill="#1a1a1a">A rule element with its own margins</text>
<text x="384" y="30" font-size="14" font-weight="600" fill="#1a1a1a">The rule drawn by the heading</text>
<rect x="40" y="54.5" width="240" height="9" rx="2" fill="#b9b6ac"/>
<rect x="40" y="80.5" width="144" height="9" rx="2" fill="#b9b6ac"/>
<line x1="310" y1="98" x2="310" y2="146" stroke="#b5501f" stroke-width="2"/>
<line x1="305" y1="98" x2="315" y2="98" stroke="#b5501f" stroke-width="2"/>
<line x1="305" y1="146" x2="315" y2="146" stroke="#b5501f" stroke-width="2"/>
<text x="322" y="127" font-size="13" fill="#b5501f">48</text>
<line x1="40" y1="146" x2="280" y2="146" stroke="#1a1a1a" stroke-width="1.5"/>
<line x1="310" y1="146" x2="310" y2="194" stroke="#b5501f" stroke-width="2"/>
<line x1="305" y1="146" x2="315" y2="146" stroke="#b5501f" stroke-width="2"/>
<line x1="305" y1="194" x2="315" y2="194" stroke="#b5501f" stroke-width="2"/>
<text x="322" y="175" font-size="13" fill="#b5501f">48</text>
<text x="40" y="220" font-size="26" font-weight="700" fill="#1a1a1a">Who can apply</text>
<rect x="400" y="54.5" width="240" height="9" rx="2" fill="#b9b6ac"/>
<rect x="400" y="80.5" width="144" height="9" rx="2" fill="#b9b6ac"/>
<line x1="670" y1="98" x2="670" y2="130" stroke="#b5501f" stroke-width="2"/>
<line x1="665" y1="98" x2="675" y2="98" stroke="#b5501f" stroke-width="2"/>
<line x1="665" y1="130" x2="675" y2="130" stroke="#b5501f" stroke-width="2"/>
<text x="682" y="119" font-size="13" fill="#b5501f">32</text>
<line x1="400" y1="130" x2="640" y2="130" stroke="#1a1a1a" stroke-width="1.5"/>
<line x1="670" y1="130" x2="670" y2="146" stroke="#b5501f" stroke-width="2"/>
<line x1="665" y1="130" x2="675" y2="130" stroke="#b5501f" stroke-width="2"/>
<line x1="665" y1="146" x2="675" y2="146" stroke="#b5501f" stroke-width="2"/>
<text x="682" y="143" font-size="13" fill="#b5501f">16</text>
<text x="400" y="172" font-size="26" font-weight="700" fill="#1a1a1a">Who can apply</text>
<text x="40" y="272" font-size="13" fill="#5a5850">96 in all; the rule belongs to neither side.</text>
<text x="400" y="272" font-size="13" fill="#5a5850">48 in all; the rule opens the section.</text>
</svg>

On the left the break is twice the heading's own gap and the rule floats between two sections. On the right the gap is the heading's 48, and the rule is close enough to the heading to read as part of it.

Where the rule sits within the gap is a question of proximity, and the evidence is thin: GOV.UK centres its rule, GitHub attaches it to the heading. Gestalt proximity argues for attaching it to what it introduces, so the space between rule and heading should be smaller than the space between the previous paragraph and the rule.

One more case: the rule should never appear before the first section of an article, where it separates the title from nothing.

If your design uses a divider, draw it as part of the h2, a top border with padding, so the gap above the heading includes it, and skip it on the first h2. **Keep the rule closer to the heading it opens than to the paragraph before it.** The option exists in every system read. The placement rests on proximity, since no system documents its reasoning.

---

## Column width

65 to 75 characters, capped at 80, and counted in rendered characters rather than trusted to a `ch` value, because a `ch` is the width of the zero and holds a different count in every face.

A team sets its prose column to `65ch`, expecting 65 characters a line. In Inter it gets about 80, at the very edge of the cap.

The ranges disagree at the edges. [Butterick](https://practicaltypography.com/summary-of-key-rules.html) allows 45 to 90, [Baymard](https://baymard.com/blog/line-length-readability) 50 to 75 and GOV.UK 75, and [WCAG 1.4.8](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html) (AAA) caps at 80. The toolkit aims at 65 to 75 and caps at 80, because 80 is the one external reference and the others sit under it.

The unit is where teams go wrong. A `ch` is the advance width of the digit zero, which in most sans faces is wider than an average letter, so `65ch` sets more than 65 characters. The toolkit measured Inter: `65ch` gave about 80 characters a line, and `55ch` about 71 to 79. Elastic's `max(64ch, 75%)` therefore runs longer than it reads.

Pixel measures need the same check. Inter at 18px sets about 87 characters on a 720px line, measured from the font's advance widths on an English sample paragraph at 0.459em per character, before tracking. A measure of 600 to 640px, or `max-inline-size: 36em`, gives about 73 to 77.

Tables, code and dashboards don't inherit the prose measure.

Set your measure as a `max-inline-size` on the prose column, then count the characters it renders in the actual face and adjust. **In Inter, about `55ch` or `36em` lands in the 65 to 75 band.**

---

## Code inside prose

Inline code runs at the sentence's own size when the monospace face's x-height matches the text face's, code blocks sit a step below the body so a line holds enough columns, and the tinted background on inline code is a code-only effect, because Figma can't fill a range of text.

Set inline code at `1em` in a monospace whose x-height is smaller than the text face's, and it looks shrunken beside the words around it. The usual repair is to scale it down to `0.875em` or `0.9285em` (Primer's `--text-codeInline-size`), which then looks too small beside capitals.

The choice of monospace decides which of those happens. A mono face whose x-height is close to the text face's can run at `1em` inline and sit level with the words. The toolkit measured x-height over units per em: JetBrains Mono is 0.550 against Inter's 0.546, a close match, while IBM Plex Mono is 0.516 and Source Code Pro 0.478. MDN pairs Inter with JetBrains Mono, and turns programming ligatures off in prose.

Blocks are different, because a mono face is wide and a code line can't wrap without breaking its meaning. GitHub sets `pre` at 85% of the body, with a line height of 1.45 and 16px of padding. Tailwind's `prose-lg` sets it at 16 on an 18 body, with a line height of 1.75. Primer's code block token is 13px.

The shipped cluster sits at 0.85 to 0.89 of the body for content pages: one step down the scale, not two. The space outside a block runs one to one and a half body lines.

Two steps down is a defensible named exception when the content's code is wider than a block holds one step down. JetBrains Mono advances 0.6em, so 680px of code holds about 80 columns at 14px and 70 at 16px.

The inline background is the Figma trap. Figma can colour a range of characters but can't fill the box behind them, so a tinted chip behind `inline code` exists only in CSS. The honest design works around the gap: in Figma, colour and the mono face carry the distinction, and the tint is a code addition that parity checks waive by name.

Choose your monospace by x-height match, run inline code at `1em` when the match holds, set blocks one step below the body, and document the inline tint as a code-only effect. **Pick the monospace by x-height, and inline code can stay at the sentence's size.** The size cluster is consensus across the content systems read; the x-height test is the toolkit's own method.

---

## Prose spacing in Figma

Draw it with nested auto-layout stacks whose gaps are bound to spacing variables, because Figma has no space-before on text, and its paragraph spacing works only inside one text node.

Figma's paragraph spacing is a property of a text node, applied between paragraphs inside that node, from the style of the node's first character. It can't put more space above a heading than below it, and it does nothing between two separate text layers. An auto-layout frame has one gap for all its children.

So the obvious construction is a component per element with its spacing baked in as padding: a "Heading 2" with 48 above it, placed after a "Paragraph" with 24 below it. In CSS those margins would collapse to 48. In Figma the paddings add to 72, which is the mismatch in the opening scene. Here it is beside the construction that works.

<svg role="img" viewBox="0 0 720 330" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same paragraph and heading drawn two ways in Figma. Left, as per-element components: a Paragraph component with 24 pixels of bottom padding followed by a Heading 2 component with 48 pixels of top padding, so the paddings add to 72 pixels where CSS margins would collapse to 48. Right, as nested auto layout stacks: a parent stack whose gap of 48 separates sections, and a section stack whose gap of 16 separates the heading from its paragraph.</title>
<rect x="0" y="0" width="720" height="330" fill="#f7f6f2"/>
<text x="24" y="32" font-size="14" font-weight="600" fill="#1a1a1a">Padded per-element components</text>
<text x="384" y="32" font-size="14" font-weight="600" fill="#1a1a1a">Nested stacks on spacing variables</text>
<rect x="32" y="52" width="260" height="76" rx="4" fill="none" stroke="#7a52c7" stroke-dasharray="4 3"/>
<text x="36" y="46" font-size="11" fill="#7a52c7">Paragraph</text>
<rect x="40" y="60.5" width="230" height="9" rx="2" fill="#b9b6ac"/>
<rect x="40" y="86.5" width="138" height="9" rx="2" fill="#b9b6ac"/>
<rect x="32" y="104" width="260" height="24" fill="#7a52c7" fill-opacity="0.12"/>
<rect x="32" y="132" width="260" height="90" rx="4" fill="none" stroke="#7a52c7" stroke-dasharray="4 3"/>
<rect x="32" y="132" width="260" height="48" fill="#7a52c7" fill-opacity="0.12"/>
<text x="36" y="236" font-size="11" fill="#7a52c7">Heading 2</text>
<text x="40" y="210" font-size="30" font-weight="700" fill="#1a1a1a">Who can apply</text>
<line x1="300" y1="104" x2="300" y2="180" stroke="#b5501f" stroke-width="2"/>
<line x1="295" y1="104" x2="305" y2="104" stroke="#b5501f" stroke-width="2"/>
<line x1="295" y1="180" x2="305" y2="180" stroke="#b5501f" stroke-width="2"/>
<text x="312" y="147" font-size="13" fill="#b5501f">72</text>
<text x="32" y="258" font-size="13" fill="#5a5850">24 padding + 48 padding add up.</text>
<text x="32" y="278" font-size="13" fill="#5a5850">In CSS the margins collapse to 48.</text>
<rect x="384" y="44" width="320" height="260" rx="6" fill="none" stroke="#1f5fbf"/>
<text x="388" y="314" font-size="11" fill="#1f5fbf">Prose: gap 48 between sections</text>
<rect x="400" y="60.5" width="260" height="9" rx="2" fill="#b9b6ac"/>
<rect x="400" y="86.5" width="156" height="9" rx="2" fill="#b9b6ac"/>
<line x1="666" y1="104" x2="666" y2="152" stroke="#b5501f" stroke-width="2"/>
<line x1="661" y1="104" x2="671" y2="104" stroke="#b5501f" stroke-width="2"/>
<line x1="661" y1="152" x2="671" y2="152" stroke="#b5501f" stroke-width="2"/>
<text x="678" y="133" font-size="13" fill="#b5501f">48</text>
<rect x="392" y="148" width="276" height="122" rx="4" fill="none" stroke="#1f5fbf" stroke-dasharray="4 3"/>
<text x="530" y="264" font-size="11" fill="#1f5fbf">Section: gap 16</text>
<text x="400" y="182" font-size="30" font-weight="700" fill="#1a1a1a">Who can apply</text>
<line x1="666" y1="190" x2="666" y2="206" stroke="#b5501f" stroke-width="2"/>
<line x1="661" y1="190" x2="671" y2="190" stroke="#b5501f" stroke-width="2"/>
<line x1="661" y1="206" x2="671" y2="206" stroke="#b5501f" stroke-width="2"/>
<text x="678" y="203" font-size="13" fill="#b5501f">16</text>
<rect x="400" y="214.5" width="260" height="9" rx="2" fill="#b9b6ac"/>
<rect x="400" y="240.5" width="156" height="9" rx="2" fill="#b9b6ac"/>
</svg>

On the left the two sides disagree from the first frame. On the right each gap is set once, on a stack, and both gaps are bound to spacing variables so the numbers match the CSS tokens. Spacer layers fail the same way the padded components do.

The working construction has two levels of stack. Each heading and its content sit in a section frame with the small gap, and the sections sit in a parent frame with the large gap.

Since slots reached general availability on 10 June 2026, a single Prose component can wrap that parent with a slot for its sections. Designers then have a container to drop content into without detaching anything.

A responsive layout adds a mode to the spacing collection, so a mobile frame resolves the smaller heading gaps ([type on a phone](type-on-a-phone.md) covers how much they shrink) without a second component. A parity check then measures two gaps, not a margin per element.

Draw your prose as nested stacks bound to spacing variables, optionally inside one slot-based Prose component, and never as padded per-element components. **Put the gap on the stack, never on the element.** This is the toolkit's documented method. The slot-based component is optional, because a plain frame works as well.

> **Aside.** Whether GOV.UK, USWDS, Polaris or Material ship prose components in their Figma kits was not verified.

---

## Cheat sheet

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

## The short version

Space your long-form content from tokens, not a baseline grid. CSS centres text in half-leading, so snapping blocks to whole body lines gives fractional margins nobody keeps, and every system read uses a short list of gaps instead. The paragraph gap sits near one body line, list items get a quarter to half of that, and each heading gets a gap above that clearly exceeds both its own gap below and the paragraph gap, or it reads as a bold paragraph.

One prose container owns those gaps, applied to its direct children only, so a component inside an article stays one block whose inside is spaced by its own tokens. Interface screens are spaced by layout components, and no text style or component carries a margin. A divider before major sections is optional; if you use one, make it part of the h2 and keep it inside its space-above.

Cap the measure at 65 to 75 characters and count them in the real face, because `65ch` in Inter sets about 80. Pick a monospace by x-height so inline code can sit at 1em, and set code blocks one step below the body. In Figma, which has no space-before, draw the same thing as nested stacks bound to spacing variables, optionally in one slot-based Prose component. The container and the gap ordering are consensus; the divider's placement and the x-height test are judgements built on it.

---

## What to re-check later

Researched November 2026.

- **How the values were read.** Gaps come from source: GOV.UK Frontend 6.6 (`_spacing.scss`, the typography, list and section-break mixins), USWDS (`usa-prose`, `uswds-core` settings, the `usa-list` mixin), `github-markdown-css`, `tailwindcss-typography` (`styles.js`) and Elastic's `EuiText` source. Atlassian's come from its typography documentation.
- **Browser support** for `lh`, `rlh` and `text-box-trim` comes from MDN's compatibility data. Re-checked in November 2026, `text-box-trim` is marked Baseline 2026, newly available since August 2026, when Firefox 154 shipped it; real-user version spread matters more than the table for a year or so.
- **Figma behaviour** comes from the Plugin API reference, a staff forum reply confirming how paragraph spacing applies, and the 10 June 2026 plugin update that made slots generally available.
- **The toolkit's own measurements.** The x-height and `ch` figures were measured from the Inter 4.1 and mono font files. Characters per line were computed from Inter 4.1's advance widths on one English sample paragraph, without kerning or tracking; other languages, or text with more capitals and figures, will differ by a few characters.
- **Unverified prose systems.** The Guardian, NYT, BBC GEL, Medium, Stripe and Microsoft Learn keep their CSS in bundles or refused the fetch, so they are not in the table.
- **Where this came from.** This guide was split out of a longer guide on type for UI and content; the scale it spaces is in [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), and what changes on a phone is in [type on a phone](type-on-a-phone.md). The toolkit's distilled rules are `~/Projects/toolkit/knowledge/ui/design/visual.md#type-for-ui-and-long-form-content`.
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
