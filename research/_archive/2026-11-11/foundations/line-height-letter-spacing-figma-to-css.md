# Line height and letter spacing, from Figma to the browser

Why Figma's percentages must never be typed into CSS as percentages, which Figma unit to choose for line height and letter spacing, and exactly what to write in CSS instead.

Researched August 2026, revised November 2026. Figma behaviour checked against its own blog, developer docs, help centre and forum threads with staff responses. CSS behaviour checked against MDN, the CSS Text Level 4 spec, and the Chromium and Mozilla shipping announcements. The August pass re-checked letter-spacing percentages most closely: valid CSS since Chrome 145, resolving against the space character rather than the font size. Re-checked in November 2026: `text-box-trim` shipped in Firefox 154 and MDN now marks it Baseline 2026 (newly available since August 2026); Figma's percentage line-height request is still open (198 replies and about 25,900 views, with forum posts from September and October 2026 still describing it as missing); the Dev Mode em request has had no update since its June 2025 acknowledgement. The toolkit's build rules for the same conversions are in `knowledge/code/figma-handoff.md#text-styles-to-type-tokens` and code-standard rule 54. What the line-height numbers themselves should be, per role, is in [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md#3-is-line-height-set-by-role-or-stepped-onto-a-4px-grid).

---

## What this answers

This is a small topic with an unusually high bug rate, because two tools use the same symbols to mean different things. The thesis: CSS takes line height as a unitless number and letter spacing in em, whatever Figma used to express them, and nearly every bug here is a transcription of Figma's `%` into CSS's `%`, which means something else.

- Should a Figma text style use a percentage or a pixel value for line height?
- What do engineers actually type in CSS?
- Why does a percentage line height sometimes break in ways nobody expects?
- Is `letter-spacing: 2%` valid CSS?
- Should vertical trim be turned on?

Section 8 is the conversion table to pin next to a handoff document. Section 9 is the short version.

---

## 1. Why the units do not match

**The short answer.** Figma and CSS do not offer the same units, and the unit each tool considers best practice does not exist in the other tool at all. Almost every bug in this guide traces back to that gap.

| Property | Figma offers | CSS offers | What CSS actually wants |
|---|---|---|---|
| Line height | `Auto`, `%`, `px` | `normal`, a unitless number, a length, `%` | **a unitless number** |
| Letter spacing | `%`, `px` | `normal`, a length, `%` | **`em`** |

Two mismatches fall out of that row.

**CSS's preferred line-height form has no Figma equivalent.** The correct value in CSS is a bare number, `1.5`. Figma has no bare-number option; its percentage is the closest proxy, and a good one, but only if whoever reads the spec knows to divide by 100 rather than transcribe the percent sign.

**Both tools now offer a `%` for letter spacing, and the two percentages mean different things.** Figma's is a proportion of the font size. CSS's, since early 2026, is a proportion of the width of the space character. They are not interchangeable, and the collision is more dangerous than the old situation, where CSS simply rejected the unit. Section 6 works through exactly what a literal transcription now does.

---

## 2. What each Figma option actually does

**The short answer.** Auto follows the font file's own vertical metrics, percentage is a multiplier on font size, and pixels are more literal in Figma than they are in a browser.

**Auto** takes its number from the font itself, the same ascent, descent and line-gap values a font declares as its own default spacing. Figma's own writeup on the mechanism states plainly that switching typeface changes what Auto renders, because the value lives inside the font file rather than in a design system: swap from one typeface to another and Auto's number moves with it, silently, with no warning in the UI. That is also why Auto cannot be written into a spec. There is no number to hand an engineer; there is only "whatever this particular font declares."

**Percentage** is a multiplier on font size. 150 percent of a 16px font is a 24px line box, and the value survives font-size changes, which is also true of the equivalent CSS unitless number (section 3 covers why that equivalence matters). Figma's own account of its text engine is explicit that a percentage line height is read against the font size, not against the font's built-in default line height, which is worth stating because Figma's own documentation once described the two differently and the distinction still confuses people coming from an older mental model of the tool.

**Pixels** are absolute, and Figma treats them more literally than CSS does. In a browser, `line-height` in a fixed unit behaves as a floor rather than a fixed value: a taller inline element, an inline image, or an emoji can push a line box past the declared value. Figma does not let that happen; ask for 20px and the box is 20px, full stop. That divergence is invisible most days and becomes an active bug source in a component that mixes text with inline icons, where the Figma mock and the rendered page disagree on final line height even though both declare the same pixel number.

**Letter spacing** in Figma is a percentage of font size, so 2 percent is exactly `0.02em`. Coming from print tools, Figma's tracking convention is thousandths of an em: a tracking value of -20 equals -0.02em equals -2 percent. Figma's px option for letter spacing is absolute and does not scale.

**For anyone writing plugins or export tokens**, the Plugin API models both properties as tagged unions. The exact current type for line height:

```ts
type LineHeight =
  | { readonly value: number; readonly unit: 'PIXELS' | 'PERCENT' }
  | { readonly unit: 'AUTO' }
```

Letter spacing carries only the numeric variant, since it has no Auto:

```ts
type LetterSpacing =
  { readonly value: number; readonly unit: 'PIXELS' | 'PERCENT' }
```

A transform layer has to branch on `unit`. A pipeline that assumes pixels will silently emit `line-height: 150px` for a style set to 150 percent, which is the kind of bug that ships and then sits in production until someone notices a component reads oddly tall.

**What to do.** Treat `unit` as a required branch in every transform, and reject `AUTO` outright rather than guess at it, since there is no portable number to emit. Emitting `line-height: normal` for Auto looks like a safe fallback and is not one, for the reason covered in section 3.

---

## 3. The CSS inheritance fact behind most of these bugs

**The short answer.** Percentage and length line heights compute to a fixed pixel value and inherit that fixed value. A unitless number inherits the ratio itself and recomputes per element. This is why a Figma `150%` transcribed literally as CSS `150%` breaks nested text.

MDN states this as the reason a unitless number is the preferred form: length and percentage line heights have poor inheritance behaviour, because a child element inherits the parent's *computed* value rather than the original percentage or length, while a unitless number is inherited as-is and multiplied by each element's own font size.

Here is the failure, and it is easy to hit in any card or list component that nests a heading inside body text:

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

The same trap catches `em` and `rem`: both are lengths, so both compute once at the parent and inherit as a fixed value from there.

The rule for anyone writing a Figma-to-code spec is unconditional: Figma's `150%` becomes CSS `1.5`, never `150%` and never `24px`. The percent sign looks identical in both tools and behaves differently, which is worth putting somewhere engineers will actually read it.

**What to do.** The unitless ratio is the only correct CSS output for line height, regardless of which unit the Figma style used to express it. Everything from here on is about which Figma input gets you to that output with the least friction, not about whether the output form is negotiable.

---

## 4. Percentage or pixels in Figma?

**The short answer.** Percentage for most product UI. Pixels only where the value genuinely needs to be a bound variable, because the cost of pixels is a conformance failure and the cost of percentage is a missing Figma feature.

**Percentage has five things in its favour.** One value covers many sizes, so a scale with twelve type sizes might need three or four ratios rather than twelve separate pixel values. It survives responsive modes: shrinking font sizes on a smaller viewport carries the line height along automatically, where a fixed pairing has to be remembered and updated by hand, and a forgotten pairing degrades quietly rather than failing loudly. It survives typeface swaps, since a rebrand to a font with a different x-height does not force a recalculation of every line height in the system. It maps directly onto the CSS-preferred unitless form (section 3). And it encodes intent: "body text is one and a half times its size" is a design decision; "body text has a 24px line box" is the arithmetic result of one, with the reasoning gone.

**Against it, one large cost and two small ones.** The large one: **percentage line heights cannot be bound to Figma variables.** Figma's typography variables, launched in April 2024, accept only numeric values, and a number applied to line height is read as pixels. The community request to add percentage support has been open since April 2024; in November 2026 it stands at 198 replies and about 25,900 views, with a staff acknowledgement on record that it is "on the team's radar" and no ship date attached, and a separate request filed in October 2026 asks for the same thing. Figma's Config 2026 keynote and recap covered Code Layers, Motion, shader fills, generative plugins and an updated agent, and said nothing about typography variable units: two and a half years after the request opened, nothing has changed. A third-party plugin, Line Height Tokens, stores unitless values in number variables and converts them to proportional line height, which is a workaround rather than a binding. If a system requires line height to be a token with modes, percentage is not currently a route to that.

The small costs: 150 percent of 15px is 22.5px, and a sub-pixel line box makes component-height arithmetic awkward. And working out whether a two-line label fits inside a 48px row is easier when the line height itself is a round number rather than a fraction.

**Fixed pixels have three advantages.** They bind to variables, so line height becomes a real token with modes, exportable through the Variables API into a pipeline; this is the main reason systems that require full tokenisation reach for px despite everything else here. They land on a grid: 16/24, 20/28, 24/32 all sit on a 4pt rhythm, which makes auto-layout padding arithmetic trivial. And component heights become predictable, which matters in dense UI where a fractional-pixel drift compounds down a long page.

**Against pixels, and one of the costs reaches a reader rather than a maintainer.** *N* font sizes need *N* separately maintained line heights, duplicated per mode. A spec that reads "line-height: 24px" tends to arrive in the codebase exactly that way, which is the worst of the inheritance options from section 3. Every value needs recomputing by hand on a typeface change.

And the cost that actually matters: **fixed pixel line heights paired with `rem` font sizes fail WCAG 1.4.12.** If font sizes are in `rem` so they respect a user's browser setting, but line heights are fixed `px`, a user who increases their default font size gets larger text sitting inside an unchanged line box. Success Criterion 1.4.12 requires that content remain usable when a user applies line height of at least 1.5 times the font size, letter spacing of at least 0.12 times the font size, and word spacing of at least 0.16 times the font size, and this pairing makes the line-height clause fail directly. The letter-spacing figure in that same criterion is worth carrying into section 6; the accessibility argument for relative units is not limited to line height.

**Auto** suits exploratory work and long-form prose set in a single typeface, and is poor for a design system: the value is unspecifiable in a token, font-dependent, and not guaranteed to match what a browser computes for `line-height: normal`. Both Figma and a browser derive their defaults from the font's own metrics, but they are separate implementations with no guarantee they agree on a given font.

**What to do.** Percentage in Figma text styles for ordinary product UI; fixed px only where variable binding is genuinely required. The deciding argument is that the two costs are not the same kind of thing. The percentage route's disadvantage is a missing Figma feature, which costs tokenisation, a maintenance problem. The pixel route's disadvantage is a conformance failure that reaches a reader who increased their font size, a defect. Never Auto in a published library.

The constraint this depends on: an organisation that mandates every typographic value be a bound variable has no percentage route available today, and takes px with every font-size mode paired to a matching line-height mode, absorbing the WCAG risk with a deliberate audit rather than by default.

---

## 5. Can the tradeoff be designed away?

**The short answer.** Mostly, by choosing the scale so both units land on the same numbers.

With a 150 percent ratio, any font size that is a multiple of 8 lands on a 4px grid (16 → 24, 32 → 48); sizes that are multiples of 4 but not 8 miss (12 → 18, 20 → 30). Line height should also fall as size rises, which a pixel-first exercise produces almost as a side effect. Both points, with the table of sizes and the ratios each implies, and the four role values (text 1.5, labels 1.3, headings 1.2, display 1.1), are in [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md#3-is-line-height-set-by-role-or-stepped-onto-a-4px-grid). One caveat on any ratio: Ant Design sets 14/22 (about 1.57), above common Latin defaults, which is reason to treat the ratio as a mode in a system that ships across scripts; what Ant Design does and does not claim about why is in [naming text styles](naming-text-styles.md#7-what-changes-when-you-add-a-second-platform).

**What to do.** Choose sizes so most land on the grid at their role's ratio. At that point the percentage-versus-pixel question in section 4 stops being load-bearing, because both units produce the same numbers and the choice becomes purely about tokenisation.

---

## 6. Letter spacing, and why `letter-spacing: 2%` needs care

**The short answer.** Use percentage in Figma and `em` in CSS, always. `letter-spacing: 2%` is valid CSS as of early 2026, and a literal transcription of Figma's percentage produces a visibly wrong result, because the two percentages resolve against different denominators.

**Tracking is inherently proportional, which is why this is less of a debate than line height.** The reason anyone sets it is optical: dense small text needs opening up, large display text needs tightening, and a fixed pixel value cannot do that job across a scale. Take a label at `letter-spacing: -0.5px` set at two sizes: at 12px that is -4.2 percent of the em and the letters visibly collide; at 32px it is -1.6 percent and barely perceptible. Express the same intent instead as -2 percent: at 12px it resolves to -0.24px, and at 32px to -0.64px, consistent optical weight at both ends. That is why proportional tracking is the working default, and why Figma's letter-spacing field defaults to a percentage.

**The conversion is Figma % ÷ 100 = CSS em:**

| Figma | CSS | At 16px | At 48px |
|---|---|---|---|
| 3% | `0.03em` | 0.48px | 1.44px |
| 2% | `0.02em` | 0.32px | 0.96px |
| 0% | `normal` | 0 | 0 |
| -1% | `-0.01em` | -0.16px | -0.48px |
| -2% | `-0.02em` | -0.32px | -0.96px |

Working from print-style tracking values, Figma's own help centre gives the conversion as tracking divided by 1000, since one unit of tracking is one thousandth of an em.

### Why the same-looking percentage now does something different

For years the accurate advice here was that `letter-spacing: 2%` was invalid CSS, dropped by the parser and ignored. That stopped being true. Percentage values for `letter-spacing` and `word-spacing` are defined in CSS Text Module Level 4. Firefox and Safari have supported them for some years; Chromium shipped support in Chrome 145, released 10 February 2026, across desktop, Android, WebView and iOS, which made the value valid, applied, and visible in every major engine at once.

The problem is what the percentage resolves against. **CSS Text Level 4 defines the percentage as relative to the advance width of the space character (U+0020).** Figma's percentage is relative to font size. Those are different denominators, and the space character is markedly narrower than the em: Microsoft's own character design standards put an average font's space at roughly one quarter of the em, with Times New Roman as a concrete example at 512 units of a 2048-unit em, exactly 0.25em.

Worked with that figure:

| | Figma's intent | Literal CSS transcription |
|---|---|---|
| Written | letter spacing `2%` | `letter-spacing: 2%` |
| Resolved against | font size, 1em | space advance, about 0.25em |
| Computed | 0.02em | 0.02 × 0.25em ≈ 0.005em |
| At 16px | 0.32px | 0.08px |

A literal transcription applies roughly one quarter of the intended tracking, in the right direction, at every size. That is a worse failure than the old one. Under the previous, pre-2026 behaviour the declaration was simply dropped, and tracking was visibly absent, the kind of thing a side-by-side screenshot comparison catches. Now it renders as text that is slightly too tight and reads as an ordinary Figma-versus-browser rendering difference rather than a bug, so it tends to survive review. The correct output has not changed: `0.02em`.

**Two more traps worth flagging to engineers.**

**Dev Mode surfaces the wrong unit.** Figma's Dev Mode offers letter spacing in px or rem only, not em. A style set to 2 percent on 18px type surfaces as something close to `letter-spacing: 0.1125rem`, a fixed value that does not scale with the element's own font size and defeats the reason the style was set as a percentage in the first place. A request to add em output was filed on Figma's forum in June 2025, acknowledged by staff the same day and moved to the feature-tracking queue; as of this research it remains open with no shipped change. The conversion from Dev Mode's output back to the intended em value is a manual step, and the inspect panel actively works against getting it right.

**`rem` looks proportional and is not.** This follows directly from Dev Mode's output, and it is worth calling out separately because teams talk themselves into it. `rem` is relative, so next to `px` it feels like the responsible choice. It is relative to the *root* element's font size, not the element carrying the letter spacing, so a `rem` tracking value is exactly as fixed across a type scale as a `px` one would be. Of the units on offer, only `em` and the CSS percentage scale with the text they sit on, and of those two, only `em` uses the denominator Figma used when the value was authored.

**When fixed px is genuinely the right call.** When the value needs to be a Figma variable, since a number variable applied to letter spacing is read as pixels and there is currently no other route to tokenisation. For a single-size optical correction, such as a logotype or a numeric readout that only ever appears at one size, where proportionality buys nothing. And on a variable font with an optical-size axis, since the font already adjusts its own spacing by size; be lighter with manual tracking at both ends of the scale in that case, rather than stacking a second correction on top of the font's own.

**One nuance on browser reliability, since a support table alone can mislead.** A participant in the Chromium shipping thread reported Firefox failing a batch of letter-spacing tests despite Firefox showing as shipped. Read past the headline: those failures concerned line-ending and word-boundary handling, not the percentage-resolution behaviour this section relies on. The percentage-against-space-advance mechanic itself is not in question in that report.

**What to do.** Percentage in Figma, `em` in CSS, and write the divide-by-100 rule into the handoff document rather than relying on anyone to remember it under deadline. Add one more line to that document: never write `%` in a CSS `letter-spacing` declaration. If design tokens are linted, make that an error rather than a warning, since the failure it prevents is invisible at review time, exactly the class of bug worth spending a lint rule on.

---

## 7. Vertical trim, and what it costs

**The short answer.** Turn it on in Figma and ship `text-box` in CSS. Firefox 154 shipped support in August 2026, the last of the three engines, and MDN now marks the feature Baseline 2026.

This is where line-height choices leak into layout, and it is worth understanding before committing to generous ratios.

A line box distributes its extra space as **half-leading**, split above and below the glyphs. With a 16px font in a 24px line box, roughly 4px sits above the cap height and 4px below the baseline. On the first and last lines of a text block that space does nothing useful and still occupies layout.

Figma's **Vertical trim**, set to *Cap height to baseline*, removes it, so the text box hugs the glyphs. This makes button padding symmetrical and legible, and makes typeface swaps far less disruptive to spacing. It is a genuinely useful feature, not a cosmetic one.

The CSS equivalent:

```css
.thing {
  text-box-trim: trim-both;
  text-box-edge: cap alphabetic;
  /* or the shorthand */
  text-box: trim-both cap alphabetic;
}
```

**Support:** Chrome and Edge since version 133, Safari since 18.2, and Firefox since 154 (August 2026), enabled by default across all platforms. MDN's page now reads "Baseline 2026, newly available", which also means older browsers in real use still lack it; check the project's support floor before relying on it.

**Failure is graceful.** A browser without support ignores the declaration and falls back to the untrimmed behaviour, a little extra leading. Nobody's layout breaks outright.

**The interaction with line height is what actually bites.** The larger the ratio, the more half-leading exists, and the larger the gap between a trimmed Figma box and an untrimmed browser box wherever support has not landed yet. A system running 150 percent line heights with vertical trim enabled produces component specs that developers hit with negative margins, or simply miss by four to six pixels per text block, compounding down a page. A report that everything reads "a bit taller than the mockup" is usually this.

**One clarification, since it trips people up.** `text-box-trim` does not replace `line-height`. Line height still governs the space *between* lines in a multi-line block; trim only removes the space above the first line and below the last. The two solve different problems and neither substitutes for the other.

**What to do.** Turn vertical trim on in Figma and ship `text-box` in CSS, but decide the untrimmed fallback first, because that decision is the entire risk here. The fallback is always "a bit taller, by roughly the half-leading," so a component whose padding was derived from a trimmed box reads as loose rather than broken while support catches up. With every engine shipping it, the remaining argument for waiting is the browser-version spread among actual users, not the feature's own readiness.

---

## 8. The conversion table

Pin this next to a handoff document.

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

The last three rows are the toolkit's own rules, each from a bug on a real project (`knowledge/code/figma-handoff.md#text-styles-to-type-tokens`, code-standard rule 54). One generator skipped letter spacing when it was zero, and nine components that read the missing custom property lost the whole declaration, because a `var()` with no definition and no fallback invalidates it. Another project applied type through `font` shorthands, which carried no letter spacing at all. The conversions are done once, by the token build, never typed by hand; the toolkit's `figma-doc-generator` skill documents the same conversions on the Figma side.

---

## 9. The short version

The unitless ratio is the only correct CSS output for line height. Figma's `150%` becomes `1.5`, never `150%` and never `24px`. Percentage and length line heights inherit their computed pixel value; only a bare number inherits the ratio, which is why a literal transcription breaks nested text.

In Figma, use percentage for line height in most product UI, and pixels only where the value genuinely needs to be a bound variable. The percentage route costs tokenisation. The pixel route, paired with `rem` font sizes, costs a reader who increased their font size, a WCAG 1.4.12 failure rather than a maintenance inconvenience. Never use Auto in a published library.

Constrain the scale so the question stops mattering: font sizes chosen to land on the grid, with line heights set by role and tightening as the type grows.

For letter spacing, percentage in Figma and `em` in CSS, effectively always. `letter-spacing: 2%` is valid CSS since Chrome 145 shipped in February 2026, and it resolves against the space character rather than the font size, so a literal transcription applies about a quarter of the intended tracking while looking like an ordinary rendering difference. Ignore Dev Mode's px and rem output for letter spacing, and do not be talked into `rem` on the theory that it is proportional; it scales with the root font size, not the element's own.

Turn on vertical trim. Firefox shipped support in August 2026, closing the gap that used to be the reason to wait; decide the untrimmed fallback for older browsers first.

Write the conversion rules down. The highest-value artefact here is not the token architecture, it is a short handoff note stating that Figma's `%` is not CSS's `%`, and exactly what to type instead. Most of the bugs in this guide are transcription bugs, not design decisions. Where possible, make the rule mechanical: a lint rule rejecting `%` in a CSS `letter-spacing` declaration, and a length unit in a `line-height` declaration, catches both headline failures at build time, and neither has a legitimate exception worth preserving.

---

## 10. What to re-check later

- **`text-box-trim`** landed in Firefox 154 and is Baseline 2026 on MDN (checked November 2026). What remains is real-user version spread; re-check before dropping the untrimmed fallback.
- **CSS percentage letter spacing in Firefox.** Shipped and stable; one Chromium-thread report of Firefox test failures traced to line-ending and word-boundary handling, unrelated to the percentage-resolution mechanic this guide relies on. Worth a second look only if a project depends on an edge case near a line break.
- **Figma percentage line-height variables.** Still unsupported in November 2026; the request thread is at 198 replies and about 25,900 views, and new requests in October 2026 still describe it as missing. This is the claim most likely to flip in a system's favour, and the one most worth re-checking before committing to a px-only token architecture. Forum posts are not release notes; check Figma's changelog too.
- **Dev Mode em output for letter spacing.** Requested June 2025, acknowledged the same day, no later update on the thread in November 2026.
- **Config 2026.** Covered Code Layers, Motion, shader fills and effects, generative plugins and an updated agent; nothing touching typography variable units. The absence is itself the finding: the current architecture is the settled state rather than a stopgap awaiting a keynote fix.
- **On the evidence generally.** The WCAG 1.4.12 understanding document grounds its 1.5x line-height and 0.12x/0.16x spacing thresholds in readability research, so that floor is evidence-based. What is missing from the public record is evidence that any particular ratio *above* that floor outperforms another in product UI; treat the role ratios as craft consensus.

---

## Sources

**Primary: platform documentation, engineering write-ups, and staff-acknowledged threads**

- [Figma, *Getting to the bottom of line height in Figma*](https://www.figma.com/blog/line-height-changes/). Figma's own account of how percentage and Auto line height are read, and the deliberate divergence from CSS's minimum-line-height behaviour.
- [Figma Help Center, *Explore text properties*](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties). The tracking-divided-by-1000 conversion, and the px/percent line-height toggle.
- [Figma Plugin API, `LineHeight`](https://developers.figma.com/docs/plugins/api/LineHeight). The current `PIXELS | PERCENT | AUTO` union type quoted in section 2.
- [Figma Forum, *Allow percentages for line height*](https://forum.figma.com/suggest-a-feature-11/allow-percentages-for-line-height-21970). Open since April 2024, past 195 replies and 24,000 views at research time, staff acknowledgement on record.
- [Figma Forum, *Percentage-based letter-spacing should convert to em value in Dev Mode*](https://forum.figma.com/suggest-a-feature-11/percentage-based-letter-spacing-should-convert-to-em-value-in-dev-mode-41443). Filed and acknowledged June 2025, unchanged since.
- [Figma Forum, *Letter-spacing should not be percentage based*](https://forum.figma.com/suggest-a-feature-11/letter-spacing-should-not-be-percentage-based-33344). The designer-versus-developer tension over Figma's percentage default, and staff's July 2024 non-committal response.
- [Figma Blog, *Config 2026 recap*](https://www.figma.com/blog/config-2026-recap/). Source for the negative finding that Config 2026 did not touch typography variable units.
- [MDN, `line-height`](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height). The unitless-is-preferred guidance and the inheritance example behind section 3.
- [MDN, `letter-spacing`](https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing). The current percentage value definition, resolved against the space character's advance width.
- [MDN, `text-box-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/text-box-trim). Property definition and current Baseline status.
- [MDN, *Firefox 154 release notes for developers*](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/154). `text-box-trim`, `text-box-edge` and the `text-box` shorthand enabled by default on all platforms.
- [Chrome for Developers, *Chrome 145 release notes*](https://developer.chrome.com/release-notes/145). The percentage letter-spacing and word-spacing ship date, 10 February 2026.
- [Chromium blink-dev, *Web-Facing Change PSA: CSS letter-spacing and word-spacing: percentage values*](https://groups.google.com/a/chromium.org/g/blink-dev/c/K7wT6GjVZsQ). The space-advance resolution mechanic, and the thread noting Firefox's unrelated test failures.
- [caniuse, `text-box-trim`](https://caniuse.com/mdn-css_properties_text-box-trim). Chrome and Edge 133, Safari 18.2, Firefox 154.
- [W3C, *Understanding Success Criterion 1.4.12: Text Spacing*](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html). The 1.5x line-height and 0.12x/0.16x letter- and word-spacing thresholds behind sections 4 and 6.
- [Microsoft Typography, *Character design standards: whitespace*](https://learn.microsoft.com/en-us/typography/develop/character-design-standards/whitespace). The roughly-one-quarter-em average space advance, with the Times New Roman 512/2048-unit example used in section 6.
- [Tokens Studio, *Letter Spacing* token type](https://docs.tokens.studio/manage-tokens/token-types/typography/letter-spacing). How a token pipeline bridges Figma's percentage and CSS's em in practice.
- [Ant Design, font specification](https://ant.design/docs/spec/font). The 14/22 base pairing cited in section 5.
- [Figma Forum, Feature request: support percentage values for line height in Figma variables](https://forum.figma.com/suggest-a-feature-11/feature-request-support-percentage-values-for-line-height-in-figma-variables-58640). October 2026, the same request again.

**Commentary, convenient rather than canonical**

- [GitHub, mdn/browser-compat-data issue #28979](https://github.com/mdn/browser-compat-data/issues/28979). Community confirmation that Firefox and Safari supported letter-spacing percentages before Chrome 145 closed the gap.

**Toolkit knowledge base and sister pieces**

- `knowledge/code/figma-handoff.md#text-styles-to-type-tokens` and `standards/code-standard.md` rule 54. The build-side rules and their evidence.
- [One type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), [space between prose elements](space-between-prose-elements.md), [naming text styles](naming-text-styles.md).

---
