# Spacing that travels with a text style

Whether a text style should carry its own space above and below, written in em, or leave every gap to the container and its spacing tokens.

A product library publishes, for each text style, two tokens such as `type-h3-spacing-top: 1.103448em` and `type-h3-spacing-bottom: 0.413793em`. Dropped into an article, the heading looks right. Dropped as the first line of a card with 16px of padding, it sits 32px lower than the card's drawing, because the space above it came along with the style. A designer opens the Figma file to find out where the 32 comes from, and the text style has nothing in it that says so.

---

## What this answers

- [What the em values are](#what-the-em-values-are): what a pair like 0.55814em and 0.255814em is made of
- [What systems ship](#what-systems-ship): who stores spacing per style, who doesn't, and in what unit
- [Scaling with the style](#scaling-with-the-style): what em does when the size changes, on a phone included
- [Collisions with containers](#collisions-with-containers): margin collapsing, gaps and the first child
- [Figma's side](#figmas-side): what a text style can hold, and what it can't
- [Through the build](#through-the-build): what a token format and Style Dictionary do with it
- [Text spacing and WCAG](#text-spacing-and-wcag): the 2 times paragraph spacing test
- [When each wins](#when-each-wins): which side owns which gap

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs. The gaps themselves, and who owns them inside an article, are in [space between prose elements](space-between-prose-elements.md); the token model behind them is [spacing tokens by intent](spacing-tokens-by-intent.md); what changes on a phone is in [type on a phone](type-on-a-phone.md).

---

## What the em values are

A per-style em value is a pixel gap divided by the style's own font size, so it is a storage format for a gap that someone drew in pixels, not a new kind of number.

Take the values in the opening. All four of the library's numbers are whole-pixel gaps over whole-pixel sizes, rounded to six decimals. `0.55814em` is 24 / 43 and `0.255814em` is 11 / 43. `1.103448em` is 32 / 29 and `0.413793em` is 12 / 29. The smallest whole-number fractions that round to those four values are exactly these. Read that way, one style is 43px with 24 above and 11 below, and another is 29px with 32 above and 12 below.

That is an inference from arithmetic. Nothing in the numbers says the sizes were 43 and 29. And whether `0.55814em` is some ratio of the line box or the cap height cannot be checked without the style's line height, which the tokens don't include. What can be checked is the direction: nothing here needs a typographic theory to explain it, because a division of two integers does.

Tailwind's typography plugin shows the same habit in source. Its `styles.js` writes its margins as `em(px, base)`, a pixel gap divided by a pixel size, rounded to seven decimals. The base h2 is `em(48, 24)`, which is `2em`; the `lg` preset's h2 is `em(56, 30)`, which is `1.8666667em`. The same heading level gets a different multiplier in every preset:

| Tailwind h2 `margin-top` | Written as | Value |
|---|---|---|
| base | `em(48, 24)` | `2em` |
| sm | `em(32, 20)` | `1.6em` |
| lg | `em(56, 30)` | `1.8666667em` |
| xl | `em(56, 36)` | `1.5555556em` |
| 2xl | `em(72, 48)` | `1.5em` |

([Tailwind Typography, `styles.js`](https://raw.githubusercontent.com/tailwindlabs/tailwindcss-typography/main/src/styles.js).) So the em is not a ratio the designers held fixed across sizes. They set pixel gaps per preset and expressed them in em so that the gap follows the text inside that preset.

That settles what is being decided. Whether a style carries spacing is a question about ownership and scaling, not about which unit is cleverer.

---

## What systems ship

Most interface systems keep spacing out of the text style; the ones that carry it either apply it only inside a prose container or keep it in Figma alone.

Here is what each system's own files say.

| System | Text style fields | Where gaps live | Unit |
|---|---|---|---|
| Tailwind `prose` | not a style system | margins per element, under the `prose` class | em |
| Spectrum CSS | size, line height, margin multipliers | margins on heading and body classes | multiplier of own size |
| GOV.UK Frontend | font mixin | `margin-bottom` per class, top padding by sibling | spacing units (px) |
| Atlassian | family, size, weight, line height | paragraph spacing in Figma styles only; Stack in code | px |
| Material Web | font, size, line height, weight | none | none |
| Carbon type | size, weight, line height, letter spacing | none | none |

Spectrum is the clearest per-style case. Its token package `@spectrum-css/tokens` 16.0.2 holds `--spectrum-heading-margin-top-multiplier: 0.88888889`, `--spectrum-heading-margin-bottom-multiplier: 0.25` and `--spectrum-body-margin-multiplier: 0.75` ([global-vars.css](https://cdn.jsdelivr.net/npm/@spectrum-css/tokens@16.0.2/dist/css/global-vars.css)). The typography component multiplies each by the style's font size, as `calc(font-size * multiplier)`, and sets the result as `margin-block-start` and `margin-block-end` ([typography `index.css`](https://cdn.jsdelivr.net/npm/@spectrum-css/typography/dist/index.css)). Body text has only the bottom one. A heading's space above is 3.6 times the space below it, and the multipliers are plain numbers, not em.

GOV.UK keeps the margin on the class too, in spacing units. `govuk-heading-l` takes `govuk-responsive-margin(6, "bottom")`, `govuk-body-m` takes unit 4, and both set `margin-top: 0`. The space above a heading comes from a different rule: top padding added when a body class or list is the heading's previous sibling ([`_typography.mixin.scss`](https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/core/_typography.mixin.scss)). That is a pair of styles owning a gap between them, which a per-style top and bottom pair can only approximate. Units 4 and 6 are 20 and 30px on desktop and 15 and 20 on mobile, from the [spacing settings](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_spacing.scss) the neighbour article reads.

Atlassian says it plainly: "Paragraph spacing is set in Figma text style libraries only." Its body styles carry 16, 12 and 8px for Body L, M and S, and in code it asks for a separate text component per paragraph with the spacing managed by Stack ([Atlassian, typography](https://atlassian.design/foundations/typography/)). The number travels with the style in the design file and not into the code.

Material Web's type scale carries `-font`, `-line-height`, `-size` and `-weight` per level and lists `-tracking` among its unsupported tokens ([`_md-sys-typescale.scss`](https://raw.githubusercontent.com/material-components/material-web/main/tokens/_md-sys-typescale.scss)). Carbon's type styles carry font size, weight, line height and letter spacing, and none has a margin ([`_styles.scss`](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/type/scss/_styles.scss)). Material's own specification page was not readable here, so for Material this is the code package, not the spec.

The prose systems differ in a way the table hides. USWDS, GitHub's `markdown-body` and Tailwind put gaps on elements, not styles, under a container class. [Space between prose elements](space-between-prose-elements.md#spacing-ownership) covers why: a heading style used inside a card must not drag article spacing in with it. Spectrum and GOV.UK put the margin on the class that is also used in interfaces.

Per-style spacing in a shipped system is therefore a minority position, and it has two forms. One keeps the number in the style and applies it only under a prose container. The other puts the margin on the style's class and accepts that the class carries it everywhere.

---

## Scaling with the style

Em spacing follows its own element's font size, so a heading's gaps shrink when the heading does and a body's gaps hold when the body does, which is the split [type on a phone](type-on-a-phone.md#prose-gaps-on-a-phone) asks for.

CSS defines `em` as "the computed value of the font-size property of the element on which it is used" ([CSS Values 4](https://www.w3.org/TR/css-values-4/#font-relative-lengths)). So `margin-block-start: 0.558140em` on an h2 is a fraction of that h2's size, whatever its parent's size is. A container's `gap: 1.5em` is a fraction of the container's size and cannot tell a heading from a paragraph.

Take an illustrative phone change. The 43px style with 24 above and 11 below drops to 32px on a phone, and the body holds at 18px.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same heading style at two sizes, with illustrative values. Left, 43 pixels: 24 pixels above and 11 below, from 0.55814em and 0.255814em. Right, 32 pixels on a phone: the same two em values give 17.9 above and 8.2 below, so the gaps shrink with the heading. The paragraph above and below each keeps its size.</title>
<rect x="0" y="0" width="720" height="270" fill="#f7f6f2"/>
<text x="24" y="26" font-size="14" font-weight="600" fill="#1a1a1a">43px, desktop</text>
<text x="384" y="26" font-size="14" font-weight="600" fill="#1a1a1a">32px, phone</text>
<rect x="40" y="40" width="240" height="9" rx="2" fill="#b9b6ac"/>
<rect x="40" y="64" width="24" height="24" fill="#b5501f" fill-opacity="0.18"/>
<text x="40" y="119" font-size="43" font-weight="700" fill="#1a1a1a" textLength="150" lengthAdjust="spacingAndGlyphs">Costs</text>
<rect x="40" y="130" width="24" height="11" fill="#b5501f" fill-opacity="0.18"/>
<rect x="40" y="152" width="240" height="9" rx="2" fill="#b9b6ac"/>
<text x="76" y="80" font-size="13" fill="#b5501f">24 above (0.55814em)</text>
<text x="76" y="139" font-size="13" fill="#b5501f">11 below (0.255814em)</text>
<rect x="400" y="40" width="240" height="9" rx="2" fill="#b9b6ac"/>
<rect x="400" y="64" width="18" height="17.9" fill="#b5501f" fill-opacity="0.18"/>
<text x="400" y="107" font-size="32" font-weight="700" fill="#1a1a1a" textLength="112" lengthAdjust="spacingAndGlyphs">Costs</text>
<rect x="400" y="118" width="18" height="8.2" fill="#b5501f" fill-opacity="0.18"/>
<rect x="400" y="136" width="240" height="9" rx="2" fill="#b9b6ac"/>
<text x="432" y="78" font-size="13" fill="#b5501f">17.9 above</text>
<text x="432" y="126" font-size="13" fill="#b5501f">8.2 below</text>
<text x="24" y="210" font-size="13" fill="#5a5850">Shaded blocks are the heading's space above and below, drawn at 1 to 1.</text>
<text x="24" y="232" font-size="13" fill="#5a5850">43 x 0.55814 = 24.0; 32 x 0.55814 = 17.9. The body paragraphs stay 18px.</text>
</svg>

Both pairs of gaps keep the same proportion to the heading, and the body is untouched. The arithmetic is 32 x 0.55814 = 17.86 and 32 x 0.255814 = 8.19. That is the rule the other article derives from GOV.UK's responsive units: heading gaps shrink with the headings. Per-style em gets there without a mode, and it keeps the ordering with it, since both gaps scale together.

Two limits come with that. The first: the ratio between a heading and its neighbours is not preserved, because the paragraph above did not shrink. At 18px with a bottom of `0.4em`, the paragraph's gap is 7.2px on both screens, while the heading's top went from 24 to 17.9. The ordering rule (space above a heading clearly above the paragraph gap) still holds, but it holds by a smaller margin, and has to be checked at the smallest size.

The second: em gives one ratio, so it cannot express a design that tightens heading gaps more than the heading shrinks. That wants a number per mode, which is the Figma variable route in [Figma's side](#figmas-side).

---

## Collisions with containers

A per-style margin meets three things it was not written for: a neighbour's margin, a container's gap and the container's edge.

Start with the neighbour. In block flow, adjacent vertical margins collapse to the largest of them. [MDN's margin collapsing guide](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_model/Margin_collapsing) gives the case: a bottom margin of 1.2rem against a top margin of 0.4rem leaves 1.2rem, not 1.6. So per-style pairs, read as a pair, behave well in an article. A paragraph with a bottom of 7.2px followed by a heading with a top of 32px gives 32.

Margins do not collapse in a flex or grid container, so the same pair adds there. Put the same paragraph and heading in a column container with a 16px gap and the space above the heading is 7.2 + 16 + 32 = 55.2.

<svg role="img" viewBox="0 0 720 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same paragraph and 29 pixel heading in two containers, with illustrative values. Left, block flow: the paragraph's 7.2 pixel bottom margin and the heading's 32 pixel top margin collapse to 32. Right, a column container with a 16 pixel gap: the margins do not collapse and the three add to 55.2 pixels.</title>
<rect x="0" y="0" width="720" height="250" fill="#f7f6f2"/>
<text x="24" y="26" font-size="14" font-weight="600" fill="#1a1a1a">Block flow: margins collapse</text>
<text x="384" y="26" font-size="14" font-weight="600" fill="#1a1a1a">Flex or grid column, gap 16: margins add</text>
<rect x="40" y="44" width="240" height="9" rx="2" fill="#b9b6ac"/>
<rect x="40" y="53" width="24" height="32" fill="#b5501f" fill-opacity="0.18"/>
<text x="40" y="117" font-size="29" font-weight="700" fill="#1a1a1a">Costs</text>
<text x="76" y="73" font-size="13" fill="#b5501f">32 (the larger of 7.2 and 32)</text>
<rect x="400" y="44" width="240" height="9" rx="2" fill="#b9b6ac"/>
<rect x="400" y="53" width="24" height="7.2" fill="#b5501f" fill-opacity="0.45"/>
<rect x="400" y="60.2" width="24" height="16" fill="#7a52c7" fill-opacity="0.25"/>
<rect x="400" y="76.2" width="24" height="32" fill="#b5501f" fill-opacity="0.18"/>
<text x="400" y="141" font-size="29" font-weight="700" fill="#1a1a1a">Costs</text>
<text x="436" y="68" font-size="13" fill="#b5501f">7.2 paragraph bottom</text>
<text x="436" y="84" font-size="13" fill="#7a52c7">16 container gap</text>
<text x="436" y="102" font-size="13" fill="#b5501f">32 heading top</text>
<text x="40" y="190" font-size="13" fill="#5a5850">32 in all.</text>
<text x="400" y="190" font-size="13" fill="#5a5850">55.2 in all: 7.2 + 16 + 32.</text>
</svg>

Left, the container is block flow and the per-style pair does its job. Right, one change of `display` makes the heading's break 23px larger than anyone designed. An article rendered in block flow and the same content inside a flex card therefore disagree without either being wrong.

Then the edge. A heading's top margin on the first child collapses through the parent in block flow, unless the parent has padding or a border ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_model/Margin_collapsing)). So in a card with padding, the 32 stays inside, and the card's title sits 32px lower than drawn. That is the opening scene.

Tailwind answers it in the stylesheet: every size preset ends with `> :first-child { margin-top: 0 }` and `> :last-child { margin-bottom: 0 }`. CSS has a property for it, `margin-trim`, which removes the container's edge margins of its children and keeps the ones between siblings ([MDN, `margin-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/margin-trim)). MDN's compatibility data lists Safari 16.4, Chrome 155 and Firefox only in preview ([browser-compat-data](https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/margin-trim.json)), and MDN marks it not Baseline. Treat it as unavailable to a library today, and write the first and last child reset by hand.

Two nearby tools do not fix this, though they are often grouped with it. `text-box-trim` removes space inside a text element's block container, to the cap height and the baseline with `text-box-edge: cap alphabetic` ([MDN, `text-box-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim)). The page doesn't say it affects margins, and [vertical trim](line-height-letter-spacing-figma-to-css.md#vertical-trim) covers what it does measure. And `lh` and `rlh` are lengths. `lh` is the line height of the element it is used on, `rlh` of the root ([CSS Values 4](https://www.w3.org/TR/css-values-4/#font-relative-lengths)). A margin of `1lh` on a heading is the heading's line, which is the trap the [neighbouring article](space-between-prose-elements.md#origins-of-prose-spacing) names.

The collision is worst where the style's class is also an interface class. A text style that sets its own margin is correct in a prose block and a defect in a stack, a card or a form. That is the point behind the neighbour's rule that margins stay off text styles.

---

## Figma's side

A Figma text style has one spacing field, `paragraphSpacing`, in pixels, with no space before; a top and bottom pair has nowhere to be stored in the style.

[Figma's text properties page](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties) says paragraph spacing, paragraph indent and list spacing are all represented in pixels, and describes no separate space before or after. The plugin API's `TextStyle` lists `paragraphIndent`, `paragraphSpacing` and `listSpacing` as numbers, with no field for a space before ([TextStyle](https://developers.figma.com/docs/plugins/api/TextStyle/)). `TextNode.paragraphSpacing` is "the vertical distance between paragraphs" ([API](https://developers.figma.com/docs/plugins/api/properties/TextNode-paragraphspacing/)), and the neighbour article has the rest: it applies inside one text node, from the style of its first character, and does nothing between two layers.

So a library that publishes both a top and a bottom per style is keeping at least one of them outside the text style, in variables or in the code.

Here is a sketch of the text style's spacing fields as of November 2026, not a screenshot.

<svg role="img" viewBox="0 0 720 230" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A sketch of a Figma text style's type settings as of November 2026. The fields are size, line height, letter spacing, paragraph spacing, paragraph indent and list spacing, all in pixels. Size, line height, letter spacing, paragraph spacing and paragraph indent can each be bound to a variable. There is no field for space before a paragraph.</title>
<rect x="0" y="0" width="720" height="230" fill="#f7f6f2"/>
<rect x="40" y="20" width="300" height="190" rx="6" fill="#ffffff" stroke="#b9b6ac"/>
<text x="56" y="44" font-size="13" font-weight="600" fill="#1a1a1a">Text style: Heading 3</text>
<text x="56" y="70" font-size="13" fill="#1a1a1a">Size</text><text x="300" y="70" font-size="13" text-anchor="end" fill="#1a1a1a">29</text>
<text x="56" y="92" font-size="13" fill="#1a1a1a">Line height</text><text x="300" y="92" font-size="13" text-anchor="end" fill="#1a1a1a">36</text>
<text x="56" y="114" font-size="13" fill="#1a1a1a">Paragraph spacing</text><text x="300" y="114" font-size="13" text-anchor="end" fill="#1a1a1a">12</text>
<text x="56" y="136" font-size="13" fill="#1a1a1a">Paragraph indent</text><text x="300" y="136" font-size="13" text-anchor="end" fill="#1a1a1a">0</text>
<text x="56" y="158" font-size="13" fill="#1a1a1a">List spacing</text><text x="300" y="158" font-size="13" text-anchor="end" fill="#1a1a1a">0</text>
<text x="56" y="188" font-size="13" fill="#9a2f2f">Space before: no such field</text>
<text x="372" y="70" font-size="13" fill="#5a5850">bindable to a number variable</text>
<text x="372" y="92" font-size="13" fill="#5a5850">bindable</text>
<text x="372" y="114" font-size="13" fill="#5a5850">bindable; a mode can change it</text>
<text x="372" y="136" font-size="13" fill="#5a5850">bindable</text>
<text x="372" y="158" font-size="13" fill="#5a5850">not in the bindable list</text>
</svg>

The panel has a row for the gap between paragraphs and no row for the gap above the first one. A designer reading this style sees one number, and the pair in the code has no counterpart to compare against.

What does bind is the number. `VariableBindableTextField` lists `fontSize`, `lineHeight`, `letterSpacing`, `paragraphSpacing` and `paragraphIndent` among the fields a variable can drive, and does not list `listSpacing` ([VariableBindableTextField](https://developers.figma.com/docs/plugins/api/VariableBindableTextField/)). A text style whose size and paragraph spacing are both bound to variables can therefore take a different size and a different spacing in a phone mode.

That route is in pixels, so an em token on the code side is derived. A mode that changes the size from 43 to 32 and the spacing from 24 to 18 gives 0.558140 on one and 0.5625 on the other. The em value is not a constant of the style unless the designer authored a ratio. Whichever is authored, the other is derived, and the export has to say which.

Since Figma gives a style one field and a stack one gap, the design file's natural construction for the rest is the one in [prose spacing in Figma](space-between-prose-elements.md#prose-spacing-in-figma): nested stacks with the gap bound to a spacing variable. A text style's paragraph spacing then covers lines inside one text node, and the stacks cover everything between elements.

---

## Through the build

A token format has no em dimension and no spacing member in its typography type, so em spacing is either a plain number, a px value divided at build time, or an extension.

The Design Tokens format (2025.10) defines a dimension as a number and a unit, and allows only `"px"` or `"rem"` (§8.2). Em is not a dimension. Its typography composite has five members: `fontFamily`, `fontSize`, `fontWeight`, `letterSpacing` and `lineHeight`, where line height is a number to be read as a multiplier of the font size (§9.8). It has no paragraph or list spacing ([DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/)). A per-style spacing token therefore needs its own home, as a `number` token holding the ratio, or as a `dimension` in px with the em derived downstream, or in `$extensions`.

Tokens Studio's typography composite has nine properties, including `paragraphSpacing` and `paragraphIndent`, written in px or rem and treated as px when unitless ([Tokens Studio, typography](https://docs.tokens.studio/manage-tokens/token-types/typography)). So the export from Figma comes out in pixels.

Style Dictionary's predefined transforms assume a unit. `size/rem` and `size/px` append the unit without scaling, and `size/pxToRem` divides by a base font size, 16 unless the platform sets another. None of the ones read divides by the style's own size, and `typography/css/shorthand` produces the `font` shorthand, which carries no margin ([predefined transforms](https://styledictionary.com/reference/hooks/transforms/predefined/)). Getting from 24px to `0.55814em` is a custom transform that reads a sibling token, the style's font size. That is an inference from the documented list, not a stated limitation.

Here is the path from the pixel the designer drew to the number in the stylesheet.

<svg role="img" viewBox="0 0 720 120" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The path from design to code for one spacing value, with the library's illustrative numbers. In Figma the paragraph spacing is 24 pixels on a 43 pixel style. The export keeps 24 pixels. A build step divides by the style's own size, 43, and writes 0.55814em. The prose container applies it as a margin.</title>
<rect x="0" y="0" width="720" height="120" fill="#f7f6f2"/>
<rect x="20" y="30" width="150" height="60" rx="6" fill="#ffffff" stroke="#b9b6ac"/>
<text x="95" y="56" font-size="13" text-anchor="middle" fill="#1a1a1a">Figma style</text>
<text x="95" y="76" font-size="13" text-anchor="middle" fill="#5a5850">24 px on 43 px</text>
<rect x="200" y="30" width="150" height="60" rx="6" fill="#ffffff" stroke="#b9b6ac"/>
<text x="275" y="56" font-size="13" text-anchor="middle" fill="#1a1a1a">Token export</text>
<text x="275" y="76" font-size="13" text-anchor="middle" fill="#5a5850">24 px, a px dimension</text>
<rect x="380" y="30" width="150" height="60" rx="6" fill="#ffffff" stroke="#b5501f"/>
<text x="455" y="56" font-size="13" text-anchor="middle" fill="#1a1a1a">Build: 24 / 43</text>
<text x="455" y="76" font-size="13" text-anchor="middle" fill="#b5501f">0.55814em</text>
<rect x="560" y="30" width="140" height="60" rx="6" fill="#ffffff" stroke="#b9b6ac"/>
<text x="630" y="56" font-size="13" text-anchor="middle" fill="#1a1a1a">Prose container</text>
<text x="630" y="76" font-size="13" text-anchor="middle" fill="#5a5850">applies the margin</text>
<line x1="170" y1="60" x2="198" y2="60" stroke="#5a5850" stroke-width="1.5"/>
<line x1="350" y1="60" x2="378" y2="60" stroke="#5a5850" stroke-width="1.5"/>
<line x1="530" y1="60" x2="558" y2="60" stroke="#5a5850" stroke-width="1.5"/>
</svg>

The step in the highlighted box is the one no predefined transform names, and the one that needs the style's size beside the spacing value.

A build that keeps pixels as the source and writes em as an output has two places to go wrong. Rounding is the small one: `0.55814em` on a 43px style is 24.00002px. Mismatched size is the large one. If the font size is later made fluid, the em spacing silently becomes a fractional pixel value no one reviewed, while a px source keeps a number a reviewer can read.

A build that keeps the ratio as the source reads simpler in code and worse in Figma, where no field takes it. A mode would need the size and the ratio to be authored in step, and the pixel value is what the designer checks against the canvas. The safer choice is pixels as the source of truth and em as the output, with the divisor the style's own size recorded in the token's description.

---

## Text spacing and WCAG

WCAG 1.4.12 asks that nothing breaks when paragraph spacing is set to at least 2 times the font size, which stresses a layout's room for spacing, not the spacing the style ships.

The criterion's text is: "Spacing following paragraphs to at least 2 times the font size", alongside line height 1.5, letter spacing 0.12 and word spacing 0.16, with no loss of content or functionality. The user applies it, through "a user stylesheet, bookmarklet, extension, or application", and authors are asked to allow spacing to exceed the values and not treat them as a ceiling ([Understanding 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)).

Every shipped default sits well under it: Tailwind's base paragraph is `1.25em`, Spectrum's body `0.75`, and GOV.UK's body gap, 20px against a 19px body, about 1.05. A per-style em makes the comparison direct, since the test value is `2em` in the same unit.

The failure is not in the default; it is in the room. The page names text that "is cut off in a heading" in a fixed-height box, and failure F104 for clipped or overlapped content. A card built to a fixed pixel height, holding a heading with per-style spacing, clips when the override adds a further 2em. The two ownership models fail alike here, and differ in one detail, by the cascade: a margin on the text is replaced by the user's override on the same element, while a container `gap` sits beside it, so the user's margin is added to the gap. Neither is a failure by itself. Height is.

---

## When each wins

Spacing that is about one style's own proportions can travel with it as data; spacing that is about neighbours belongs to the container.

Start with what the gap is a relationship between. A heading's space above is partly a fact about the heading (a bigger heading earns more air) and partly a fact about whatever came before it (a paragraph, a list, an image, nothing at all). GOV.UK's top padding for a heading after a paragraph is the second kind, and it is why a per-style top cannot be complete.

Carrying the numbers on the style wins in these cases:

- Long-form content arrives as bare elements and a CMS writer won't add spacing components.
- One heading style appears at several sizes, and the gaps should track the size without a second set of tokens.
- A phone mode shrinks the headings and the gaps should follow in proportion.
- Several surfaces (web, email, an app's article view) render the same styles, and each needs the proportions without the structure.

The container wins in these:

- Interface layouts, where components sit in stacks, cards, forms and grids that already own their gaps.
- Any container that is flex or grid, since margins add there.
- A text style used inside components, where an outer margin is a defect.
- Anywhere the gap depends on the neighbour: after a list, before a figure, between a heading and a heading with nothing under it.
- Anywhere the Figma file spaces things with stacks, because the file cannot hold a top and bottom pair.

The two are not exclusive, and the clean split is what applies the number. Let the style carry the pair as data, declared as custom properties like any other field of the style, and let one prose container apply it, to its direct children only. A text style used anywhere else declares the numbers and applies none. That keeps the neighbour's rule intact (no margin on the text style or the component) while giving the prose container per-style proportions rather than one multiplier for all headings.

A container written this way:

```css
.prose { display: flow-root; }
.prose > h3 {
  margin-block: var(--type-h3-spacing-top) var(--type-h3-spacing-bottom);
}
.prose > :first-child { margin-block-start: 0; }
.prose > :last-child  { margin-block-end: 0; }
```

Block flow makes the pairs collapse, `flow-root` stops the container's margins collapsing with the page's, and the two resets handle the edges. Each token is a declared number and none is a margin until the container uses it.

The cost is real: a second source of spacing next to the spacing scale. The tokens `0.55814em` and `0.255814em` do not sit on a 4px grid or any scale, because they came from a pixel gap divided by a size. The nearest-token rule in the [neighbour](space-between-prose-elements.md#origins-of-prose-spacing) is the cure, and it works on the px value before it is divided: snap 11 to 12 and 24 to 24, then write the ratio. A library that publishes per-style spacing and also a spacing scale should say which wins, and the scale should.

*Weight: moderate.* The reasoning is sound, but the evidence is thin: Spectrum and GOV.UK ship per-class margins, and no system read documents a per-style pair applied only by a container, which is this article's own construction. The advice depends on the container being block flow; where it is flex or grid, apply only the top value.

---

## Cheat sheet

| Decision | Do | Do not |
|---|---|---|
| What the em number is | a px gap over the style's own px size, rounded | treat it as a ratio of the line box or cap height unless the line height is known |
| Source of truth | pixels, with em as an output and the divisor named | a ratio authored in a file that has no field for it |
| Where a style's spacing is applied | one prose container, to direct children | the style's class, used in cards and stacks |
| Top and bottom pair | block flow, so the pair collapses to the larger | the same pair in flex or grid, where it adds |
| First and last child | reset by hand; `margin-trim` once supported | trust the top margin to vanish at the card's edge |
| Figma | one `paragraphSpacing` per style, bound to a variable; stacks for the rest | a top and bottom pair expected inside the text style |
| Token format | a `number` ratio, or a px `dimension` with em derived, or `$extensions` | an `em` dimension, which the format doesn't allow |
| Phone mode | em follows the heading; check the heading still beats the paragraph gap | assume em preserves the order of gaps |
| WCAG 1.4.12 | leave room for 2em paragraph spacing; no fixed heights around text | read the shipped default as the test |
| Pair or one gap | both numbers where the container is block flow; the top alone elsewhere | both where margins add |
| Spacing scale | snap the px gap to a spacing token, then derive | publish ratios no scale contains |

---

## The short version

A per-style em spacing is a pixel gap divided by the style's own size, which is how Tailwind writes every margin in its typography plugin and how the product library's values reduce (24 / 43, 11 / 43, 32 / 29, 12 / 29). It makes a gap follow its own text: a heading's space shrinks with the heading and a body's holds with the body. That is the right behaviour on a phone, and it is the one behaviour the container's tokens cannot give without a mode.

It collides with everything else that spaces text. In block flow its margins collapse to the larger, and in flex or grid they add, so one pair gives 32 in an article and 55 in a card. A first child's top margin leaks past the parent or stays inside it as air nobody drew. Figma has one spacing field per style and none for space before, so a top and bottom pair lives outside the text style. The token format has no em dimension and no spacing member in its typography type.

So let the style carry the numbers as data, and let one prose container apply them to its direct children in block flow, with the first and last child reset. Everywhere else, including every interface layout, the container's spacing tokens own the gap and the text style applies nothing. Keep pixels as the source and em as an output, snap the pixel gaps to the spacing scale before dividing, and leave room for the 2 times paragraph spacing test.

For the people downstream, write down three things: that the spacing fields are data and which container applies them, what the divisor is, and that the pair is meant for block flow. Weight: moderate for the split, and moderate for the choice of pixels as the source.

---

## What to re-check later

Researched November 2026.

- **Spectrum.** The multipliers come from `@spectrum-css/tokens` 16.0.2 and the latest `@spectrum-css/typography` (8.2.0) read in November 2026. The newer `@adobe/spectrum-tokens` typography page lists no margin tokens; whether the multipliers moved there is unchecked. Re-check before citing them as current.
- **`margin-trim`.** The Chrome 155 and Firefox "preview" entries are from MDN's compatibility data on one day, and Chrome's number is recent. Re-check the table.
- **Material.** The type scale's own specification page was unreadable, so Material is read from the Material Web token source only. A spec that adds spacing would change that row.
- **The derivation.** That the library's four values are 24 / 43, 11 / 43, 32 / 29 and 12 / 29 is arithmetic, and the smallest whole-number fractions are listed. That the sizes were 43 and 29, and that the values are not also a ratio of line box or cap height, is unchecked: the line heights were not available.
- **Style Dictionary.** That no predefined transform divides by a sibling font size is read from the predefined list, not from the code of every version.
- **Not opened.** USWDS and GitHub's `markdown-body` values are cited from the neighbour article's sources, not reopened here. Compose, Flutter and Apple's text styles were not read; whether their styles carry paragraph spacing is unchecked.
- **Evidence quality.** Per-style spacing is documented by Spectrum, GOV.UK and Atlassian, but no system read publishes research on whether it helps. The advice on a container-applied pair is this article's construction.

---

## Sources

**Primary: system source and documentation**

- [Tailwind Typography, `styles.js`](https://raw.githubusercontent.com/tailwindlabs/tailwindcss-typography/main/src/styles.js). Em margins as `em(px, base)`; first and last child resets.
- [`@spectrum-css/tokens` 16.0.2, `global-vars.css`](https://cdn.jsdelivr.net/npm/@spectrum-css/tokens@16.0.2/dist/css/global-vars.css) and [`@spectrum-css/typography`, `index.css`](https://cdn.jsdelivr.net/npm/@spectrum-css/typography/dist/index.css). Margin multipliers and the `calc` that applies them.
- [GOV.UK Frontend, `_typography.mixin.scss`](https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/core/_typography.mixin.scss). Per-class bottom margins and the sibling top padding.
- [Atlassian, typography](https://atlassian.design/foundations/typography/). Paragraph spacing in Figma only; Stack in code.
- [Material Web, `_md-sys-typescale.scss`](https://raw.githubusercontent.com/material-components/material-web/main/tokens/_md-sys-typescale.scss) and [Carbon, type `_styles.scss`](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/type/scss/_styles.scss). Fields per style.
- [Figma Help, Explore text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties). Paragraph and list spacing in px; vertical trim.
- [Figma Plugin API, `TextStyle`](https://developers.figma.com/docs/plugins/api/TextStyle/), [`TextNode.paragraphSpacing`](https://developers.figma.com/docs/plugins/api/properties/TextNode-paragraphspacing/) and [`VariableBindableTextField`](https://developers.figma.com/docs/plugins/api/VariableBindableTextField/).
- [MDN, margin collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_model/Margin_collapsing), [`margin-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/margin-trim) and [`text-box-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim), and [`margin-trim` compatibility data](https://raw.githubusercontent.com/mdn/browser-compat-data/main/css/properties/margin-trim.json).
- [CSS Values and Units 4, font-relative lengths](https://www.w3.org/TR/css-values-4/#font-relative-lengths). `em`, `lh`, `rlh`.

**Standards and formats**

- [WCAG 2.2 Understanding 1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html).
- [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/). Dimension units; typography members.
- [Style Dictionary, predefined transforms](https://styledictionary.com/reference/hooks/transforms/predefined/) and [Tokens Studio, typography tokens](https://docs.tokens.studio/manage-tokens/token-types/typography).

**Cited but not resolved to a URL here**

- USWDS `usa-prose` and GitHub `markdown-body`: read in [space between prose elements](space-between-prose-elements.md#cheat-sheet) and its sources, not reopened.
- [GOV.UK Frontend, `_spacing.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_spacing.scss): unit values as the neighbour and the toolkit's spacing page read them.
