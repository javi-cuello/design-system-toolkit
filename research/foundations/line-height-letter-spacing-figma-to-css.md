# Line height and letter spacing, from Figma to the browser

Which Figma unit to choose for line height and letter spacing, and exactly what to write in CSS instead of Figma's percentages.

A designer sets a card's text style in Figma: 16px, line height 150%, letter spacing 2%. The developer copies it across as `line-height: 150%` and `letter-spacing: 2%`, and the browser accepts both without a murmur. Then the card's 32px title wraps onto a second line and the two lines overlap, and the label's tracking comes out at about a quarter of what was drawn. Nothing in the console says anything went wrong.

Both bugs have one cause. Figma and CSS use the same `%` sign for different things, and a faithful copy carries the sign across without its meaning.

---

## What this answers

- [Mismatched units](#mismatched-units): why Figma's units differ from CSS's
- [Figma's three options](#figmas-three-options): what auto, percentage and pixels do
- [Percentages and nested text](#percentages-and-nested-text): why a percentage breaks nested text
- [Percentage or pixels](#percentage-or-pixels): which unit to use in Figma
- [Letting the scale decide](#letting-the-scale-decide): whether the scale can settle the choice
- [Letter spacing in CSS](#letter-spacing-in-css): how letter spacing crosses over
- [Vertical trim](#vertical-trim): whether vertical trim should be on

For a lookup, use the [cheat sheet](#cheat-sheet), which is the conversion table to pin next to a handoff document; [the short version](#the-short-version) is the whole guide in a few paragraphs.

---

## Mismatched units

Figma's units and CSS's differ because the unit each tool treats as best practice doesn't exist in the other one, and almost every bug in this guide starts in that gap.

A developer inspecting the card sees `150%` in Figma's line-height field. CSS has a `%` too, so writing `150%` looks like the careful, literal choice. Here is what each tool actually offers, and what CSS wants.

| Property | Figma offers | CSS offers | What CSS actually wants |
|---|---|---|---|
| Line height | `Auto`, `%`, `px` | `normal`, a unitless number, a length, `%` | **a unitless number** |
| Letter spacing | `%`, `px` | `normal`, a length, `%` | **`em`** |

Two mismatches fall out of the table. The first is that CSS's preferred line height, a bare number such as `1.5`, has no Figma equivalent. Figma's percentage is the closest stand-in, and a good one, as long as whoever reads the spec divides by 100 instead of copying the sign.

The second is newer. Both tools now offer `%` for letter spacing, and the two mean different things. Figma's is a share of the font size; CSS's, since early 2026, is a share of the width of the space character.

That collision is more dangerous than the old situation, when CSS simply rejected the unit and the missing tracking was easy to spot. [How letter spacing should cross over](#letter-spacing-in-css) works through what a literal copy now renders.

**Whatever Figma shows, line height reaches CSS as a bare number and letter spacing as `em`.** That one sentence, written into a handoff note, prevents most of what follows.

---

## Figma's three options

Auto follows the font file's own metrics, percentage multiplies the font size, and pixels are fixed, more strictly than a browser fixes them.

Swap a text style's typeface from one family to another and a line height set to Auto changes, with no warning in the interface. That's because Auto has no number of its own. It takes the ascent, descent and line-gap values the font file declares as its default spacing, so the value lives inside the font rather than in the design system.

[Figma's writeup on line height](https://www.figma.com/blog/line-height-changes/) says this plainly. It also means Auto can't go into a spec: there is no number to hand an engineer, only "whatever this font declares".

Percentage is a multiplier on font size. 150% of 16px is a 24px line box, and the ratio survives a font-size change, just as CSS's unitless number does. Figma reads the percentage against the font size, not against the font's built-in default line height.

> **Aside.** Figma's own documentation once described percentage line height the other way, against the font's default, and people who learned the tool then still meet that older model.

Pixels are absolute, and Figma treats them more literally than CSS does. In a browser, a fixed `line-height` behaves as a floor: an inline image, a taller inline element or an emoji can push the line box past it. Figma doesn't allow that. Ask for 20px and the box is 20px.

Most days the difference is invisible. It turns into a bug in a component that mixes text with inline icons, where the mock and the page disagree on the final line height while both declare the same pixel number.

Letter spacing in Figma is a percentage of font size, so 2% is exactly `0.02em`. Print tools count tracking in thousandths of an em, so a tracking value of -20 equals -0.02em, which equals -2% in Figma. Figma's pixel option for letter spacing is absolute and doesn't scale.

For the developer writing a plugin or a token export, the [Plugin API's `LineHeight` type](https://developers.figma.com/docs/plugins/api/LineHeight) is a tagged union:

```ts
type LineHeight =
  | { readonly value: number; readonly unit: 'PIXELS' | 'PERCENT' }
  | { readonly unit: 'AUTO' }
```

Letter spacing has no Auto, so it carries only the numeric variant:

```ts
type LetterSpacing =
  { readonly value: number; readonly unit: 'PIXELS' | 'PERCENT' }
```

Say your export script reads `value` and appends `px`, because every style it was tested on used pixels. A style set to 150% then comes out as `line-height: 150px`. It ships, and sits in production until someone notices a component reads oddly tall.

Make `unit` a required branch in every transform, and reject `AUTO` outright instead of guessing. Emitting `line-height: normal` for Auto looks like a safe fallback and isn't: Figma and the browser each derive their default from the font's metrics, in separate implementations with no promise they agree on a given font (more under [percentage or pixels](#percentage-or-pixels)). **A transform that can't name the number should stop, not guess.**

---

## Percentages and nested text

A percentage breaks nested text because a percentage or length line height is turned into pixels once, at the parent, and every child inherits those pixels; a bare number is inherited as a ratio and recomputed for each element.

Back to the card. Its body text is 16px with the Figma style's 150%, copied literally, and its title is 32px. Before reading on, work out what line height the title gets.

```css
/* Figma text style says: 16px / 150%, transcribed literally */
.card {
  font-size: 16px;
  line-height: 150%;   /* computes to 24px; 24px is what descendants inherit */
}

.card__title {
  font-size: 32px;     /* inherits the fixed 24px, so the lines overlap */
}
```

The title gets 24px: a 32px font in a 24px line box. Here is what that looks like beside the corrected version.

<svg role="img" viewBox="0 0 640 270" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same card twice. Left, line-height 150%: the 32px title inherits a 24px line box and its two lines overlap. Right, line-height 1.5: the title recomputes to a 48px line box and its two lines sit apart.</title>
<rect x="0" y="0" width="640" height="270" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">line-height: 150%</text>
<rect x="20" y="44" width="290" height="186" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="40" y="96" font-size="32" font-weight="700" fill="#1a1a1a">Annual plan</text>
<text x="40" y="120" font-size="32" font-weight="700" fill="#1a1a1a">renewal due</text>
<text x="40" y="168" font-size="16" fill="#3a3933">Billed yearly from</text>
<text x="40" y="192" font-size="16" fill="#3a3933">the first of March.</text>
<text x="20" y="254" font-size="13" fill="#9a3412">Title inherits 24px: its lines overlap</text>
<text x="330" y="30" font-size="14" font-weight="600" fill="#1a1a1a">line-height: 1.5</text>
<rect x="330" y="44" width="290" height="186" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="350" y="88" font-size="32" font-weight="700" fill="#1a1a1a">Annual plan</text>
<text x="350" y="136" font-size="32" font-weight="700" fill="#1a1a1a">renewal due</text>
<text x="350" y="176" font-size="16" fill="#3a3933">Billed yearly from</text>
<text x="350" y="200" font-size="16" fill="#3a3933">the first of March.</text>
<text x="330" y="254" font-size="13" fill="#166534">Title inherits 1.5: 48px lines</text>
</svg>

The body text looks identical on both sides; only the nested title shows the difference, which is why the bug survives a glance at a paragraph.

[MDN's `line-height` page](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height) gives this as the reason a unitless number is the preferred form. A child inherits the parent's computed value, not the original percentage or length. A unitless number is the exception: it is inherited as-is and multiplied by each element's own font size.

```css
/* The correct translation of the same Figma style */
.card {
  font-size: 16px;
  line-height: 1.5;    /* descendants inherit the number 1.5, not a pixel value */
}

.card__title {
  font-size: 32px;     /* recomputes to 48px, as intended */
}
```

The same trap catches `em` and `rem`. Both are lengths, so both compute once at the parent and pass a fixed value down from there.

The rule for a Figma-to-code spec has no exceptions. **Figma's `150%` becomes CSS `1.5`, never `150%` and never `24px`.** Put it where engineers will read it, because the sign looks identical in both tools. Whichever unit the Figma style used, the ratio is the output; everything that follows is about which Figma input reaches it with the least friction.

---

## Percentage or pixels

Percentage for most product UI, and pixels only where line height has to be a bound variable, because the cost of pixels is a conformance failure and the cost of percentage is a missing Figma feature.

Picture a scale of twelve type sizes. Set in percentage, it might need three or four ratios. Set in pixels, it needs twelve separate values, and each is one more number to keep right through every change.

Percentage has five things in its favour:

- One value covers many sizes.
- It survives responsive modes: when font sizes shrink on a small viewport, line height follows, where a fixed pairing has to be updated by hand and degrades quietly when someone forgets.
- It survives a typeface swap, so a rebrand to a face with a different x-height doesn't force every line height to be recalculated.
- It maps directly onto CSS's unitless form.
- It records intent. "Body text is one and a half times its size" is a decision; "body text has a 24px line box" is the arithmetic result of one, with the reasoning gone.

The large cost is that percentage line heights can't be bound to Figma variables. [Typography variables](https://forum.figma.com/t/launched-typography-variables/48430), launched in April 2024, take only numbers, and a number applied to line height is read as pixels.

The [request to allow percentages](https://forum.figma.com/suggest-a-feature-11/allow-percentages-for-line-height-21970) has been open since April 2024, with a staff note that it is "on the team's radar" and no date. A [second request](https://forum.figma.com/suggest-a-feature-11/feature-request-support-percentage-values-for-line-height-in-figma-variables-58640), filed in October 2026, asks for the same thing. [Config 2026](https://www.figma.com/blog/config-2026-recap/) covered Code Layers, Motion, shader fills, generative plugins and an updated agent, and said nothing about typography variable units.

A third-party plugin, Line Height Tokens, stores unitless values in number variables and converts them to proportional line height. That's a workaround, not a binding. A system that requires line height to be a token with modes has no percentage route today.

Two smaller costs come with percentage. 150% of 15px is 22.5px, and a sub-pixel line box makes component-height arithmetic awkward. And checking whether a two-line label fits a 48px row is easier when the line height is a round number.

Fixed pixels have three advantages:

- They bind to variables, so line height becomes a real token with modes, exportable through the Variables API. This is the main reason systems that demand full tokenisation choose pixels.
- They land on a grid: 16/24, 20/28 and 24/32 all sit on a 4pt rhythm, which makes auto layout padding easy to add up.
- Component heights become predictable, which matters in dense UI where a fractional drift compounds down a long page.

Against pixels, *N* font sizes need *N* line heights, duplicated per mode. A spec that says 24px tends to arrive in the codebase as `24px`, the worst of the inherited forms shown under [why a percentage breaks nested text](#percentages-and-nested-text). And every value has to be recomputed by hand when the typeface changes.

The cost that reaches a reader is accessibility. [WCAG's Success Criterion 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) requires content to stay usable when a user sets line height to at least 1.5 times the font size, letter spacing to at least 0.12 times and word spacing to at least 0.16 times.

Here is how pixel line heights fail it. Say you set body text to `font-size: 1rem; line-height: 24px`, so that font size respects the reader's browser setting. At the default 16px root the ratio is 1.5. A reader who raises the default to 24px gets 24px text in the same 24px line box, a ratio of 1.0. The text grew; the line box didn't. (These values are illustrative.)

Auto suits exploratory work and long prose in a single typeface, and is poor for a design system. Its value can't go into a token, it depends on the font, and it isn't guaranteed to match what a browser computes for `line-height: normal`. Both derive their defaults from the font's metrics, but they are separate implementations with no promise they agree.

Use percentage in your Figma text styles for ordinary product UI, and fixed pixels only where line height genuinely has to be a bound variable. The two costs aren't the same kind of thing: the percentage route loses tokenisation, a maintenance problem, while the pixel route fails a reader who enlarged their text, a defect. **Choose the cost that lands on the maintainers, not on the reader.** Never use Auto in a published library.

The constraint this depends on: if your organisation requires every typographic value to be a bound variable, there is no percentage route. Take pixels, pair every font-size mode with a matching line-height mode, and audit the WCAG risk on purpose instead of leaving it to chance.

---

## Letting the scale decide

The scale mostly settles it: choose the sizes so that percentage and pixels land on the same numbers, and the choice stops mattering.

At a 150% ratio, any font size that is a multiple of 8 lands on a 4px grid: 16 gives 24, 32 gives 48. Sizes that are multiples of 4 but not 8 miss it: 12 gives 18, 20 gives 30. A scale built from the first kind lets both units say the same thing.

Line height should also fall as size rises, and a pixel-first exercise produces that almost as a side effect. The table of sizes with the ratio each implies, and the four role values (text 1.5, labels 1.3, headings 1.2, display 1.1), are in [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md).

One caveat on any single ratio. Ant Design sets 14/22, about 1.57, above common Latin defaults. In a system that ships across scripts, that's a reason to treat the ratio as a mode rather than a constant; what Ant Design does and doesn't claim about its reasons is in [naming text styles](naming-text-styles.md).

Choose your sizes so most land on the grid at their role's ratio. **Once both units produce the same numbers, percentage against pixels is only a question of tokenisation.**

---

## Letter spacing in CSS

Letter spacing crosses as a percentage in Figma and `em` in CSS, always, because `letter-spacing: 2%` is now valid CSS and measures against a different, much narrower thing.

Tracking is set for optical reasons. Dense small text needs opening up, large display text needs tightening, and a fixed pixel value can't do both across a scale. That's why it's less of a debate than line height.

Take a label tracked at `-0.5px` and set it at two sizes. At 12px that is -4.2% of the em, and the letters visibly collide. At 32px it is -1.6%, barely perceptible. Express the same intent as -2% instead, and it resolves to -0.24px at 12px and -0.64px at 32px: the same optical weight at both ends. That's why Figma's letter-spacing field defaults to a percentage.

The conversion is Figma % ÷ 100 = CSS em:

| Figma | CSS | At 16px | At 48px |
|---|---|---|---|
| 3% | `0.03em` | 0.48px | 1.44px |
| 2% | `0.02em` | 0.32px | 0.96px |
| 0% | `normal` | 0 | 0 |
| -1% | `-0.01em` | -0.16px | -0.48px |
| -2% | `-0.02em` | -0.32px | -0.96px |

For print-style tracking values, [Figma's help page on text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties) gives the conversion as tracking divided by 1000, since one unit of tracking is a thousandth of an em.

For years, `letter-spacing: 2%` was invalid CSS: the parser dropped it and the tracking was simply missing. That changed. Percentage values for `letter-spacing` and `word-spacing` are defined in CSS Text Module Level 4. Firefox and Safari supported them for some years, and [Chrome 145](https://developer.chrome.com/release-notes/145), released on 10 February 2026, shipped them on desktop, Android, WebView and iOS. The value is now valid and applied in every major engine.

The catch is what the percentage measures against. [CSS Text Level 4 resolves it against the advance width of the space character](https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing) (U+0020), while Figma's resolves against the font size. The space is far narrower than the em. [Microsoft's character design standards](https://learn.microsoft.com/en-us/typography/develop/character-design-standards/whitespace) put an average font's space at about a quarter of the em; Times New Roman's is 512 units of a 2048-unit em, exactly 0.25em.

Here is the label's 2% both ways, worked with that figure.

| | Figma's intent | Literal CSS transcription |
|---|---|---|
| Written | letter spacing `2%` | `letter-spacing: 2%` |
| Resolved against | font size, 1em | space advance, about 0.25em |
| Computed | 0.02em | 0.02 × 0.25em ≈ 0.005em |
| At 16px | 0.32px | 0.08px |

A literal copy applies roughly a quarter of the intended tracking, in the right direction, at every size. That's worse than the old failure. Missing tracking was visible in a side-by-side screenshot; slightly-too-tight tracking reads as an ordinary Figma-against-browser rendering difference, so it survives review. The correct output hasn't changed: `0.02em`.

The two percentages are like a tip worked out on the bill and a tip worked out on the tax: same sign, same number, a much smaller amount. Where the picture stops: the space character's width varies by font, so the shortfall isn't a fixed quarter everywhere, only roughly one.

Two more traps sit between Figma and the code. The first is Dev Mode, which offers letter spacing in px or rem, never em. A style set to 2% on 18px type surfaces as `letter-spacing: 0.0225rem`, a fixed value that no longer scales with the element's own font size.

A [request for em output](https://forum.figma.com/suggest-a-feature-11/percentage-based-letter-spacing-should-convert-to-em-value-in-dev-mode-41443) was filed in June 2025 and acknowledged by staff the same day, with no change shipped since. Until it is, turning Dev Mode's number back into em is a manual step, and the inspect panel works against getting it right.

The second trap follows from the first: `rem` looks proportional and isn't. It is relative, so beside `px` it feels like the responsible choice. But it is relative to the root element's font size, not the element carrying the tracking, so a `rem` letter spacing is as fixed across a type scale as a `px` one. Of the units on offer, only `em` and the CSS percentage scale with their own text, and only `em` uses Figma's denominator.

Fixed pixels are the right call in three cases:

- The value has to be a Figma variable, since a number variable on letter spacing is read as pixels and there's no other route to tokenisation.
- A single-size optical correction, such as a logotype or a numeric readout that only appears at one size, where proportion buys nothing.
- A variable font with an optical-size axis, which already adjusts its spacing by size; manual tracking at either end of the scale should be lighter there, not a second correction stacked on the font's own.

> **Aside.** A participant in the [Chromium shipping thread](https://groups.google.com/a/chromium.org/g/blink-dev/c/K7wT6GjVZsQ) reported Firefox failing a batch of letter-spacing tests despite showing as shipped. Those failures concern line-ending and word-boundary handling, not the percentage resolution this section relies on.

Use percentage in Figma and `em` in CSS, and write the divide-by-100 rule into your handoff document rather than trusting anyone to remember it under a deadline. Add one line beside it: **never write `%` in a CSS `letter-spacing` declaration.** If your tokens are linted, make that an error rather than a warning, since the failure it prevents is invisible at review.

---

## Vertical trim

Turn it on in Figma and ship `text-box` in CSS, now that Firefox 154 has joined the other engines.

A designer draws a button with 12px of padding above and below its label, and in the browser the label sits visibly low and the button comes out taller than the mock. The cause is space nobody drew. A line box splits its spare height into **half-leading**, equal bands above and below the glyphs. A 16px font in a 24px line box has roughly 4px above the cap height and 4px below the baseline.

Here is the label in its line box at that 16/24 ratio, drawn four times larger, untrimmed and trimmed.

<svg role="img" viewBox="0 0 640 230" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A Save label at 16px in a 24px line box, drawn four times larger. Left, untrimmed: shaded half-leading bands above the cap height and below the baseline. Right, trimmed from cap height to baseline: the box hugs the letters.</title>
<rect x="0" y="0" width="640" height="230" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Untrimmed</text>
<rect x="40" y="56" width="220" height="96" fill="#ffffff" stroke="#c9c6bd"/>
<rect x="40" y="56" width="220" height="23" fill="#f3d9b1"/>
<rect x="40" y="128" width="220" height="24" fill="#f3d9b1"/>
<text x="70" y="128" font-size="64" fill="#1a1a1a">Save</text>
<text x="272" y="72" font-size="12" fill="#5a5850">half-leading</text>
<text x="272" y="145" font-size="12" fill="#5a5850">half-leading</text>
<text x="20" y="190" font-size="13" fill="#5a5850">24px line box: space above the cap height</text>
<text x="20" y="208" font-size="13" fill="#5a5850">and below the baseline</text>
<text x="370" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Trimmed, cap height to baseline</text>
<rect x="390" y="82" width="220" height="46" fill="#ffffff" stroke="#c9c6bd"/>
<text x="420" y="128" font-size="64" fill="#1a1a1a">Save</text>
<text x="370" y="190" font-size="13" fill="#5a5850">The box hugs the letters, so padding</text>
<text x="370" y="208" font-size="13" fill="#5a5850">around it is what the eye measures</text>
</svg>

On the left, the shaded bands belong to the line box but do nothing for a single line of text; on the right, the box starts at the top of the S and ends on the baseline.

Figma's **vertical trim**, set to *Cap height to baseline*, removes that space on the first and last lines, so the text box hugs the glyphs. Button padding becomes symmetrical and easy to read, and a typeface swap disturbs spacing far less. It's a layout feature, not a cosmetic one.

The CSS equivalent:

```css
.thing {
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
  /* or the shorthand */
  text-box: trim-both cap alphabetic;
}
```

Chrome and Edge have supported it since version 133 and Safari since 18.2. [Firefox 154](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/154), in August 2026, enabled it by default on all platforms, and [MDN's `text-box-trim` page](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim) now marks it Baseline 2026, newly available. Newly available also means older browsers still in use lack it.

Failure is graceful. A browser without support ignores the declaration and shows the untrimmed box, with a little extra leading. Nothing breaks.

The part that bites is how trim interacts with line height. The larger the ratio, the more half-leading there is, and the wider the gap between a trimmed Figma box and an untrimmed browser box. A system on 150% line heights with trim on produces specs that developers patch with negative margins, or miss by four to six pixels per text block, compounding down a page. "Everything is a bit taller than the mockup" is usually this.

One point confuses most people meeting the feature: `text-box-trim` doesn't replace `line-height`. Line height still sets the space between lines in a multi-line block; trim removes only the space above the first line and below the last. Neither substitutes for the other.

Turn vertical trim on in Figma and ship `text-box` in CSS, and check your project's support floor before relying on it. **Decide the untrimmed fallback first, because that decision is the whole risk.** The fallback is always "a bit taller, by about the half-leading", so a component whose padding was worked out on a trimmed box reads as loose, not broken. With every engine shipping it, the only argument left for waiting is the spread of browser versions among your users.

---

## Cheat sheet

| Figma value | Write this in CSS | Do not write |
|---|---|---|
| Line height 150% on 16px type | `line-height: 1.5` | `150%`, `24px`, `1.5rem` |
| Line height 24px on 16px type | `line-height: 1.5` | `24px` |
| Line height Auto | `line-height: normal`, and pin a real number if the spacing matters | a guessed px value |
| Letter spacing 2% | `letter-spacing: 0.02em` | `2%` (valid CSS, wrong denominator), `0.32px`, `0.02rem` |
| Letter spacing -0.5px on 16px type | `letter-spacing: -0.031em` | `-0.5px` |
| Tracking -20 (print convention) | `letter-spacing: -0.02em` | `-20`, `-20px` |
| Vertical trim, cap height to baseline | `text-box: trim-both cap alphabetic` | negative margins as a workaround |
| Vertical trim, standard | nothing | |
| Line height 16px on 12px type | `line-height: 1.3333`, as the build computes it | a hand-rounded `1.3` (drifts a pixel per line) |
| Letter spacing 0% | `letter-spacing: 0`, written out | leaving the field out of the token build |
| A whole text style | each field as a token, applied together (`@include text-style(name)`) | a `font` shorthand, which cannot carry letter spacing |

The last three rows are the toolkit's own rules, each bought by a bug on a real project. One generator skipped letter spacing when it was zero, and nine components that read the missing custom property lost the whole declaration, because a `var()` with no definition and no fallback invalidates it. Another project applied type through `font` shorthands, which carried no letter spacing at all.

Let the token build do these conversions once; never type them by hand. The toolkit's `figma-doc-generator` skill documents the same conversions on the Figma side.

---

## The short version

Line height reaches CSS as a bare number, whatever unit the Figma style used. Your `150%` becomes `1.5`, never `150%` and never `24px`. Percentage and length line heights are turned into pixels at the parent and inherited as pixels; only a bare number is inherited as a ratio, which is why a literal copy breaks nested text.

In Figma, use percentage for line height in most product UI, and pixels only where the value has to be a bound variable. The percentage route costs tokenisation, because Figma still can't bind a percentage line height. The pixel route, paired with `rem` font sizes, fails a reader who enlarged their text: a WCAG 1.4.12 defect, not a maintenance chore. Never use Auto in a published library.

Better still, choose a scale where the question stops mattering: sizes that land on the grid, with line heights set by role and tightening as type grows.

For letter spacing, use percentage in Figma and `em` in CSS. `letter-spacing: 2%` has been valid CSS since Chrome 145 in February 2026, and it measures against the space character, so a literal copy applies about a quarter of the intended tracking and looks like an ordinary rendering difference. Ignore Dev Mode's px and rem output, and don't be talked into `rem`: it scales with the root, not the text it sits on.

Turn on vertical trim. Firefox shipped it in August 2026, so every engine supports it; decide the untrimmed fallback for older browsers first.

Then write the rules down. The most useful thing to come out of this isn't a token architecture but a short handoff note saying that Figma's `%` is not CSS's `%`, and exactly what to type instead. Better still, make it mechanical: a lint rule that rejects `%` in `letter-spacing` and a length unit in `line-height` catches both headline bugs at build time, and neither has an exception worth keeping. Most of what goes wrong here is transcription, not design, and that is the consensus position; the percentage-over-pixels default is a judgement, resting on the difference between a maintenance cost and a defect.

---

## What to re-check later

Researched August 2026, revised November 2026. Figma's behaviour was checked against its blog, developer docs, help centre and forum threads with staff responses; CSS's against MDN, the CSS Text Level 4 spec, and the Chromium and Mozilla shipping announcements. The August pass checked letter-spacing percentages most closely.

- **`text-box-trim`** landed in Firefox 154 and is Baseline 2026 on MDN, checked November 2026. What remains is the spread of real users' browser versions; re-check before dropping the untrimmed fallback.
- **CSS percentage letter spacing in Firefox.** Shipped and stable. The one Chromium-thread report of Firefox test failures traced to line-ending and word-boundary handling; worth a second look only if a project depends on an edge case near a line break.
- **Figma percentage line-height variables.** Still unsupported in November 2026. The request thread stood at 198 replies and about 25,900 views, and forum posts from September and October 2026 still describe the feature as missing. This is the claim most likely to flip in a system's favour, and the one to re-check before committing to a pixel-only token architecture. Forum posts aren't release notes; check Figma's changelog too.
- **Dev Mode em output for letter spacing.** Requested June 2025, acknowledged the same day, no later update on the thread as of November 2026.
- **Config 2026** covered Code Layers, Motion, shader fills and effects, generative plugins and an updated agent, and nothing touching typography variable units. The absence suggests the current architecture is the settled state, not a stopgap awaiting a keynote.
- **A corrected figure.** The Dev Mode example (2% on 18px type) previously gave `0.1125rem`; 2% of 18px is 0.36px, which is `0.0225rem` at a 16px root, and the guide now says so.
- **The toolkit's build rules** for the same conversions are in `knowledge/code/figma-handoff.md#text-styles-to-type-tokens` and code-standard rule 54; re-check them if this guide's conversion table changes.
- **The evidence, honestly.** The WCAG 1.4.12 understanding document grounds its 1.5x line-height and 0.12x/0.16x spacing thresholds in readability research, so that floor is evidence-based. Nothing in the public record shows that any particular ratio above it outperforms another in product UI; the role ratios are craft consensus.

---

## Sources

**Primary: platform documentation, engineering write-ups, and staff-acknowledged threads**

- [Figma, *Getting to the bottom of line height in Figma*](https://www.figma.com/blog/line-height-changes/). Figma's own account of how percentage and Auto line height are read, and the deliberate divergence from CSS's minimum-line-height behaviour.
- [Figma Help Center, *Explore text properties*](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties). The tracking-divided-by-1000 conversion, and the px/percent line-height toggle.
- [Figma Plugin API, `LineHeight`](https://developers.figma.com/docs/plugins/api/LineHeight). The current `PIXELS | PERCENT | AUTO` union type quoted under *What does each Figma option do?*.
- [Figma Forum, *Allow percentages for line height*](https://forum.figma.com/suggest-a-feature-11/allow-percentages-for-line-height-21970). Open since April 2024, past 195 replies and 24,000 views at research time, staff acknowledgement on record.
- [Figma Forum, *Percentage-based letter-spacing should convert to em value in Dev Mode*](https://forum.figma.com/suggest-a-feature-11/percentage-based-letter-spacing-should-convert-to-em-value-in-dev-mode-41443). Filed and acknowledged June 2025, unchanged since.
- [Figma Forum, *Letter-spacing should not be percentage based*](https://forum.figma.com/suggest-a-feature-11/letter-spacing-should-not-be-percentage-based-33344). The designer-versus-developer tension over Figma's percentage default, and staff's July 2024 non-committal response.
- [Figma Blog, *Config 2026 recap*](https://www.figma.com/blog/config-2026-recap/). Source for the negative finding that Config 2026 did not touch typography variable units.
- [Figma Forum, *Launched: Typography Variables*](https://forum.figma.com/t/launched-typography-variables/48430). The April 2024 launch.
- [MDN, `line-height`](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height). The unitless-is-preferred guidance and the inheritance example behind *Why does a percentage break nested text?*.
- [MDN, `letter-spacing`](https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing). The current percentage value definition, resolved against the space character's advance width.
- [MDN, `text-box-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim). Property definition and current Baseline status.
- [MDN, *Firefox 154 release notes for developers*](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/154). `text-box-trim`, `text-box-edge` and the `text-box` shorthand enabled by default on all platforms.
- [Chrome for Developers, *Chrome 145 release notes*](https://developer.chrome.com/release-notes/145). The percentage letter-spacing and word-spacing ship date, 10 February 2026.
- [Chromium blink-dev, *Web-Facing Change PSA: CSS letter-spacing and word-spacing: percentage values*](https://groups.google.com/a/chromium.org/g/blink-dev/c/K7wT6GjVZsQ). The space-advance resolution mechanic, and the thread noting Firefox's unrelated test failures.
- [caniuse, `text-box-trim`](https://caniuse.com/mdn-css_properties_text-box-trim). Chrome and Edge 133, Safari 18.2, Firefox 154.
- [W3C, *Understanding Success Criterion 1.4.12: Text Spacing*](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html). The 1.5x line-height and 0.12x/0.16x letter- and word-spacing thresholds.
- [Microsoft Typography, *Character design standards: whitespace*](https://learn.microsoft.com/en-us/typography/develop/character-design-standards/whitespace). The roughly-one-quarter-em average space advance, with the Times New Roman 512/2048-unit example.
- [Tokens Studio, *Letter Spacing* token type](https://docs.tokens.studio/manage-tokens/token-types/typography/letter-spacing). How a token pipeline bridges Figma's percentage and CSS's em in practice.
- [Ant Design, font specification](https://ant.design/docs/spec/font). The 14/22 base pairing.
- [Figma Forum, Feature request: support percentage values for line height in Figma variables](https://forum.figma.com/suggest-a-feature-11/feature-request-support-percentage-values-for-line-height-in-figma-variables-58640). October 2026, the same request again.

**Commentary, convenient rather than canonical**

- [GitHub, mdn/browser-compat-data issue #28979](https://github.com/mdn/browser-compat-data/issues/28979). Community confirmation that Firefox and Safari supported letter-spacing percentages before Chrome 145 closed the gap.

**Toolkit knowledge base and sister pieces**

- `knowledge/code/figma-handoff.md#text-styles-to-type-tokens` and `standards/code-standard.md` rule 54. The build-side rules and their evidence.
- [One type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), [space between prose elements](space-between-prose-elements.md), [naming text styles](naming-text-styles.md).
