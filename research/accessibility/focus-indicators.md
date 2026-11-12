# Focus indicators in a design system

Which focus-ring geometry a design system should choose, how to measure it, and how to build it in Figma.

A designer adds a blue focus ring to the library's buttons. On the white page it looks crisp. On the primary button, which is nearly the same blue, the ring melts into the fill; in the dark footer it disappears altogether; and on the text input it sits outside a border that has already changed colour, three lines deep. None of those failures is about choosing a better blue.

The ring is the accessibility decision a design system argues about most often, because it has to work on every fill, every surface and every error border the system will ever produce. A palette is audited once; the ring comes back with every new component.

---

## What this answers

- [What the rules require](#what-the-rules-require): what WCAG asks of a focus indicator, and at which level
- [Measuring the ring](#measuring-the-ring): which colours the ring is measured against
- [Focus for mouse users](#focus-for-mouse-users): whether mouse users should see focus
- [One ring colour or two](#one-ring-colour-or-two): whether one ring colour is enough
- [GOV.UK's yellow](#govuks-yellow): what GOV.UK's yellow teaches
- [The ring's CSS property](#the-rings-css-property): which CSS property carries the ring
- [Inputs with a border](#inputs-with-a-border): how a bordered input shows focus
- [Rings with a glow](#rings-with-a-glow): whether a ring can have a glow
- [Focused fields in error](#focused-fields-in-error): how focus looks on a field in error
- [Focus in Figma](#focus-in-figma): how focus is built in Figma

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in seven paragraphs.

---

## What the rules require

At AA, a focus indicator has to exist and reach 3:1 against the colours next to it; there is no AA rule about thickness, and the one rule with a size in it is AAA.

A team writing its focus spec usually starts from a checklist that says "2px, 3:1, AA, criterion 2.4.11". That line describes a draft. The criteria that actually apply sit at three levels:

| Level | Criterion | What it asks | Numbers |
|---|---|---|---|
| A | 1.4.1 Use of Color | Colour is not the only signal of a state | none |
| AA | 2.4.7 Focus Visible | An indicator exists | none |
| AA | 1.4.11 Non-text Contrast | 3:1 against adjacent colours | 3:1 |
| AA | 2.4.11 Focus Not Obscured (Minimum) | Author content does not entirely hide the focused component | none |
| AAA | 2.4.12 Focus Not Obscured (Enhanced) | No part of it is hidden | none |
| AAA | 2.4.13 Focus Appearance | An area at least a 2px perimeter of the component, and 3:1 between focused and unfocused pixels | 2px, 3:1 |

The confusion has a history. While WCAG 2.2 was being written, the strict appearance criterion was numbered 2.4.11 and set at AA; the W3C's own tracker still holds feedback titled "[WCAG 2.2 Draft Feedback] Success Criterion 2.4.11 Focus Appearance (Level AA)" from October 2022 ([w3c/wcag #2706](https://github.com/w3c/wcag/issues/2706)).

It was then moved to AAA, which needed a fresh Candidate Recommendation. New AAA criteria are appended after the AA ones, so the working group renumbered: appearance became 2.4.13, and the freed numbers went to the two Focus Not Obscured criteria. WCAG 2.2 became a Recommendation on 5 October 2023 and was republished with corrections on 12 December 2024 ([W3C, WCAG 2.2 publication history](https://www.w3.org/standards/history/WCAG22/)).

The binding version is moving in Europe. ETSI published EN 301 549 v4.1.1, which brings in WCAG 2.2 A and AA, on 2 September 2026. Until the European Commission cites it in the Official Journal, presumption of conformity under the European Accessibility Act still rests on v3.2.1 and WCAG 2.1 ([Deque](https://www.deque.com/blog/en-301-549-v4-1-1-is-final-what-changed-what-it-means-and-what-you-should-do/), [BrowserStack](https://www.browserstack.com/blog/what-en-301-549-v4-1-1-means-for-your-accessibility-strategy/)).

> **Aside.** The [WCAG 3 Working Draft of 10 September 2026](https://www.w3.org/TR/wcag-3.0/) has a "Keyboard focus appearance" guideline with contrast and size requirements, and calls itself a successor that "does not deprecate WCAG 2". Nothing should be built to it yet.

The AAA geometry has one consequence worth seeing in numbers, because it is the commonest way a reasonable design misses 2.4.13. The test compares the indicator's area with a 2px perimeter around the component. For a rectangle of width w, height h and corner radius r, [the W3C's Understanding page for 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html) gives that area as `4h + 4w - (16 - 4π)r`. A 2px ring outside the component, or on its edge, encloses at least that much. A 2px ring inside encloses less.

Here is the case worked through. Take a 320 by 44 input with an 8px radius, a 1px grey resting border and a 2px blue focus border, both drawn inside. Before reading on, work out whether it passes.

- The perimeter is about 714px, so the target area is about 1,429px².
- The outer pixel of the focus border changes from grey to blue, often around 1.4:1, so it doesn't count.
- The second pixel changes from the white fill to blue, well over 3:1, and contributes about 714px².

That is half the area needed, in a design that passes AA comfortably. A 3px focus border clears it.

[Red Hat](https://ux.redhat.com/foundations/interactions/focus-indicators/) reached the same conclusion from the same geometry and says so: "inset focus must be greater than 2px", so it uses 3px in every case. Its ring is an outline of `--rh-border-width-lg` (3px) at an offset of the same token, coloured `--rh-color-border-interactive`, which resolves to an on-light or an on-dark value. Inset rings take a negative offset.

No shipping system checked runs the corner formula per component. They pick a thickness generous enough not to need it, which is the practical lesson: if proving a pass needs geometry, the ring is too thin.

**Claim AA, and note that the pattern also meets 2.4.13, which a 2px ring outside the component does for free.** Budget 3px wherever you draw a ring or border inside the component. A checklist that calls 2px and 3:1 an AA rule under 2.4.11 is quoting the draft; correct it where you find it.

---

## Measuring the ring

The ring is measured against whatever touches it: a ring offset from the component, with a gap of page between them, is measured against the page on both sides, so a same-hue button can't make it fail.

Back to the blue ring on the blue primary button. 1.4.11 asks for 3:1 "against adjacent color(s)" ([W3C, Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). The question is which colours count as adjacent, and the answer depends on where the ring sits. Here are the same button and ring, drawn two ways.

<svg role="img" viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same blue Save button and blue focus ring drawn twice on a white page. Left, the ring touches the button's edge: its inner side is against the button's blue, close to 1:1, so it is measured against the component too. Right, the ring sits a few pixels out, with white page between: it is measured against the page on both sides.</title>
<rect x="0" y="0" width="640" height="220" rx="12" fill="#ffffff" stroke="#d8dce3"/>
<text x="40" y="40" font-size="14" font-weight="600" fill="#c62828">Ring touching the button</text>
<text x="360" y="40" font-size="14" font-weight="600" fill="#1b7f3b">Ring offset from the button</text>
<rect x="70" y="80" width="200" height="52" rx="8" fill="#1f5fd8"/>
<rect x="68" y="78" width="204" height="56" rx="10" fill="none" stroke="#2e66de" stroke-width="4"/>
<text x="170" y="112" font-size="18" font-weight="600" fill="#ffffff" text-anchor="middle">Save</text>
<rect x="390" y="80" width="200" height="52" rx="8" fill="#1f5fd8"/>
<rect x="384" y="74" width="212" height="64" rx="14" fill="none" stroke="#2e66de" stroke-width="4"/>
<text x="490" y="112" font-size="18" font-weight="600" fill="#ffffff" text-anchor="middle">Save</text>
<text x="40" y="174" font-size="13" fill="#1a1a1a">Inner side against the button: near 1:1</text>
<text x="40" y="194" font-size="13" fill="#5a5850">Measured against the component too</text>
<text x="360" y="174" font-size="13" fill="#1a1a1a">White page on both sides of the ring</text>
<text x="360" y="194" font-size="13" fill="#5a5850">Measured against the page only</text>
</svg>

On the left the ring's inner edge disappears into the fill. On the right the button's colour never touches the ring, so it stops mattering.

That is the mechanism. For an outline drawn with `outline-offset`, the colours adjacent to the ring are the surface outside it and the gap inside it, which is the same surface. The blue-ring-on-blue-button failure belongs to rings that sit on the component's edge, which is how box-shadow rings, inside strokes and zero-offset outlines are usually built.

Here is how a few ring colours measure, against the surfaces they would touch:

| Ring colour | Against | Ratio | Verdict |
|---|---|---|---|
| `#0066CC` | white page | ~5.6:1 | Passes |
| `#0066CC` | `#F0F0F0` grey card | ~4.9:1 | Passes |
| `#0F62FE`, Carbon Blue 60 | white | ~5:1 | Passes |
| `#FFDD00`, GOV.UK yellow | white | ~1.35:1 | Fails on its own |
| `#FFDD00` | `#0B0C0C` near-black | ~14.5:1 | The pairing is the design |
| A mid-blue ring touching a blue button | the button | near 1:1 | Invisible on that side |

The toolkit takes this as its working rule: one ring colour per mode, offset from the component, measured against the surface and never the component. A near-black ring in light mode and a near-white one in dark mode then pass on every surface whose lightness matches its mode ([toolkit: accessibility, focus visibility](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/accessibility.md#focus-visibility)).

The ring has to change only in two cases: when one mode mixes light and dark surfaces, such as a dark footer on a light page or a brand band, and when the ring lands on an image. So the question shifts from "does the library have a coloured primary button?" to "does any mode put the ring on surfaces of opposite lightness?" Most product libraries answer yes somewhere (a dark footer, a hero, a dark-mode card on a darker page), which is where [one ring colour or two](#one-ring-colour-or-two) starts.

**Default to an outline with an offset, and measure the ring against every surface token it can land on, per mode, not against the component.** With the offset in place, most of the "one ring isn't enough" problem goes away.

---

## Focus for mouse users

Use `:focus-visible` everywhere, text inputs included, because browsers already show focus on a text input however it was focused; the case that needs care is a custom widget whose focus a browser hides from mouse users.

A browser fires focus whenever an element becomes active, including on a mouse click. Before `:focus-visible`, a clicked button kept its ring, and teams reached for `outline: none` to hide it. `:focus-visible` matches only when the browser judges that showing focus would help, and it has been Baseline since March 2022 ([MDN, `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)).

Dave House's practitioner essay [*Focusing on focus states*](https://iknowdavehouse.medium.com/focusing-on-focus-states-7c64089d805c) sorts components usefully. **Transitional** focus belongs to things that take the user somewhere, a link or a submit button, where a ring during the click tells a mouse user nothing and collides with the pressed state. **Retained** focus belongs to things the user sits inside, a text field, where everyone benefits from seeing where they are typing.

It is tempting to read that as "retained components need plain `:focus`, or mouse users lose the ring". The browser already covers it. The Selectors Level 4 draft's suggested heuristics say to indicate focus on an element that supports keyboard input, "such as an input element", and only for a pointer on an element that doesn't take keyboard input, "don't indicate focus" ([Selectors 4, `:focus-visible`](https://drafts.csswg.org/selectors-4/#the-focus-visible-pseudo)). MDN says the same, and the toolkit follows `:focus-visible` throughout for this reason ([toolkit: accessibility in code, visible focus](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/accessibility.md#visible-focus)).

House's framing still earns its place for what the heuristics leave out. A custom listbox, a contenteditable region or a `select` is retained in his sense, but may not count as taking keyboard input in every browser: the heuristics are non-normative, and browsers choose their own. Those are the components to test with a mouse in each browser.

House also suggests a two-tier treatment, a compliant focus state for everyone and a stronger one for keyboard users, and attaches the right condition: both must pass. It is the weakest-evidenced idea here, since no study was found testing whether users gain from mouse and keyboard focus looking different.

Two old reasons for building rings from `box-shadow` have gone. Outlines have followed `border-radius` in all major browsers since Safari 16.4 in March 2023 ([MDN, `outline`](https://developer.mozilla.org/en-US/docs/Web/CSS/outline)), and outlines survive an `overflow: hidden` ancestor that clips shadows. One of House's points hasn't aged: `outline: none` can't be repainted by a user's own colour override, because it states there is no outline, while a transparent outline can.

**Write one focus style under `:focus-visible`, and write the transitional or retained category into each component's description.** Test retained custom widgets with a mouse in each browser, and give them `:focus` only if they lose their indicator. Take the two-tier treatment only if you have genuinely designed two different looks.

---

## One ring colour or two

One offset ring colour per mode is enough until a mode puts it on surfaces of opposite lightness or on images; then a two-colour ring, two bands of at least 2px each and at least 9:1 apart, carries it everywhere.

Here is what shipping systems use:

| System | Width | Offset | Colour token | Notes |
|---|---|---|---|---|
| Atlassian | `border.width.focused`, 2px | 2px in its examples | `color.border.focused`, `#0C66E4` light, `#85B8FF` dark | The Focus Ring component is deprecated in favour of the `Focusable` primitive |
| IBM Carbon | 2px | offset | `$focus` / `--cds-focus` | Blue 60 `#0F62FE` in the white theme, white in `g100` |
| Adobe Spectrum | 2px | 2px | `focus-indicator-color`, plus `static-white-` and `static-black-` variants | `focus-indicator-gap` deprecated for the semantic `focus-ring-gap`; the repository was renamed from `spectrum-tokens` to `spectrum-design-data` |
| Material Web | `--md-focus-ring-width`, 3px | positioned by the component | `--md-focus-ring-color`, default `--md-sys-color-secondary` | `--md-focus-ring-active-width` 4px |
| GitHub Primer | `--focus-outline-width` | 0 on form fields, 2px on buttons and links | `--focus-outline-color` | Moved from box-shadow to outline |
| Red Hat | 3px, `--rh-border-width-lg` | 3px, same token | `--rh-color-border-interactive` | One thickness, inset or offset |
| Microsoft Fluent 2 | 2px, hardcoded in React v9 | none; just outside the border | `colorStrokeFocus2` | The shared utility avoids `strokeWidthThick`, which a source comment says caused "weird bugs" |

Most of the table is one colour. A single colour guarantees 3:1 against one family of surfaces, and Carbon's theme-swapped `$focus` and Spectrum's static white and black variants are patches for the surfaces it can't handle, each maintained for as long as the surface exists.

Browsers ship the alternative. Chromium's and Firefox's default indicator is a dark line edged in white, so one band carries the contrast on any page ([Chromium blog, 2020](https://blog.chromium.org/2020/03/updates-to-form-controls-and-focus.html)). Here is a single near-black ring and a two-band ring, each on a light page and in a dark footer.

<svg role="img" viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A Save button with a focus ring, in a grid. Columns: one near-black ring, and a two-band ring of white inside black. Rows: a light page and a dark footer. The single ring is clear on the light page and lost in the dark footer. The two-band ring is clear on both: its black band carries it on the light page and its white band in the footer.</title>
<rect x="0" y="0" width="640" height="300" rx="12" fill="#ffffff" stroke="#d8dce3"/>
<text x="210" y="36" font-size="14" font-weight="600" fill="#1a1a1a" text-anchor="middle">One ring colour</text>
<text x="480" y="36" font-size="14" font-weight="600" fill="#1a1a1a" text-anchor="middle">Two bands, 9:1 apart</text>
<text x="16" y="110" font-size="12" fill="#5a5850">Light page</text>
<text x="16" y="240" font-size="12" fill="#5a5850">Dark footer</text>
<rect x="90" y="50" width="240" height="114" rx="8" fill="#f7f6f2"/>
<rect x="360" y="50" width="240" height="114" rx="8" fill="#f7f6f2"/>
<rect x="90" y="176" width="240" height="114" rx="8" fill="#1a1a1a"/>
<rect x="360" y="176" width="240" height="114" rx="8" fill="#1a1a1a"/>
<rect x="150" y="85" width="120" height="40" rx="8" fill="#ffffff" stroke="#8a8780"/>
<text x="210" y="110" font-size="15" fill="#1a1a1a" text-anchor="middle">Save</text>
<rect x="144" y="79" width="132" height="52" rx="14" fill="none" stroke="#111111" stroke-width="4"/>
<text x="210" y="154" font-size="12" fill="#1b7f3b" text-anchor="middle">Passes</text>
<rect x="420" y="85" width="120" height="40" rx="8" fill="#ffffff" stroke="#8a8780"/>
<text x="480" y="110" font-size="15" fill="#1a1a1a" text-anchor="middle">Save</text>
<rect x="414" y="79" width="132" height="52" rx="14" fill="none" stroke="#ffffff" stroke-width="4"/>
<rect x="410" y="75" width="140" height="60" rx="18" fill="none" stroke="#111111" stroke-width="4"/>
<text x="480" y="154" font-size="12" fill="#1b7f3b" text-anchor="middle">Black band carries it</text>
<rect x="150" y="211" width="120" height="40" rx="8" fill="#333333" stroke="#8a8780"/>
<text x="210" y="236" font-size="15" fill="#ffffff" text-anchor="middle">Save</text>
<rect x="144" y="205" width="132" height="52" rx="14" fill="none" stroke="#111111" stroke-width="4"/>
<text x="210" y="280" font-size="12" fill="#ff8a80" text-anchor="middle">Ring lost on the dark surface</text>
<rect x="420" y="211" width="120" height="40" rx="8" fill="#333333" stroke="#8a8780"/>
<text x="480" y="236" font-size="15" fill="#ffffff" text-anchor="middle">Save</text>
<rect x="414" y="205" width="132" height="52" rx="14" fill="none" stroke="#ffffff" stroke-width="4"/>
<rect x="410" y="201" width="140" height="60" rx="18" fill="none" stroke="#111111" stroke-width="4"/>
<text x="480" y="280" font-size="12" fill="#9be7a5" text-anchor="middle">White band carries it</text>
</svg>

Each surface hides one of the two bands, so the two-band ring still reads as a single ring. Only the single ring needs a second colour for the footer.

[W3C technique C40](https://www.w3.org/WAI/WCAG22/Techniques/css/C40) codifies the two-band ring with two requirements. The two colours are 9:1 or more apart, which guarantees one of them reaches 3:1 on any solid background. And each band is at least 2 CSS pixels.

The second requirement is the one that gets dropped. A 1px light band beside a 2px ring may measure fine, but it isn't C40 and shouldn't be described as conforming to it. C40 also holds only when the whole indicator is drawn over one solid background; over an image, a gradient or another component, the ring has to be measured pixel by pixel.

Fluent 2 shows the pattern and the trap in one token pair. `colorStrokeFocus1` and `colorStrokeFocus2` are white and black in the light theme, swapped in dark, and mapped to the system's Canvas and Highlight colours in forced-colours mode ([fluentui token source](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/alias/lightColor.ts)). Its web components pair them as a 1px outline plus a 3px box-shadow ring on Tab, Dropdown and Slider ([tab.styles.ts](https://github.com/microsoft/fluentui/blob/master/packages/web-components/src/tab/tab.styles.ts)): 21:1 apart, but with an inner band under C40's 2px. React v9's shared `createFocusOutlineStyle` defaults to a single 2px pseudo-border instead, so the geometry differs by layer.

The [UK Parliament Design System](https://designsystem.parliament.uk/foundations/focus-state/) ships the conforming shape: two 2px rings outside the element, black and mint, so one of them meets the contrast minimum on any background. It removes text decoration on focused text, and lets form elements recolour their own border to black as the inner ring.

The costs are bounded, and worth listing:

- tokens double, and double again for dark mode;
- the ring takes 4px around the component, which dense 24px controls may not have room for;
- if the inner band is a shadow, it inherits the forced-colours problem in [the ring's CSS property](#the-rings-css-property), so the outer band should be the outline.

Code can now derive one band from the other. `contrast-color()` became Baseline newly available in April 2026 with Chrome 147 ([web.dev, April 2026](https://web.dev/blog/web-platform-04-2026)), and `light-dark()` has been Baseline since 2024. `contrast-color()` picks only black or white, which suits a C40 pair and guarantees no particular ratio beyond that.

**Measure the single ring on every surface first, and take the two-colour ring only when one fails, as two 2px bands at 9:1 or more.** Where 4px won't fit, give the ring a per-surface colour mode instead.

---

## GOV.UK's yellow

Its lesson is not the yellow but the principle under it: WCAG judges the indicator as a whole, so no single part has to pass everywhere as long as the combination does.

GOV.UK's yellow `#FFDD00` measures about 1.35:1 against white, which on its own fails. Yet GOV.UK's focus style is among the best tested in public. The reason is the pairing.

Its focus colours are `govuk-functional-colour(focus)` and `govuk-functional-colour(focus-text)`, yellow `#FFDD00` and near-black `#0B0C0C`. A focused link gets a yellow background and a thick black bottom border, with the underline removed. A focused input gets a yellow outline and a thicker black border.

[GOV.UK's focus states page](https://design-system.service.gov.uk/get-started/focus-states) gives the reasoning: the combination meets 1.4.11 on any background GOV.UK uses, because "The yellow has a high contrast with dark backgrounds" and the thick black border carries it on light ones. NHS.UK adopted the same approach with GOV.UK's help after its own warmer yellow failed the requirement, as [Dave Hunter's account](https://medium.com/@dave_hunter_/making-the-nhs-uk-focus-state-accessible-with-help-from-gov-uk-8989cab3ec7d) of the work tells it.

The 2019 redesign that produced the style landed in [#1309](https://github.com/alphagov/govuk-frontend/pull/1309) for links and [#1316](https://github.com/alphagov/govuk-frontend/pull/1316) for radios and checkboxes. A late-2025 palette audit renamed colours across the wider palette ([discussion #5048](https://github.com/alphagov/govuk-design-system/discussions/5048)), and the focus page names the two functions above without giving hex values.

It is the double ring's guarantee, reached with different geometry. It is also loud by design, chosen against GOV.UK's fixed backgrounds, and not one universal style: each new component's focus is designed rather than inherited.

The two approaches suit different systems. For a product system with a brand palette and dark mode, the double ring buys the same resilience with less work per component. For a public service with a fixed palette, the yellow has a decade of population-scale use behind it and almost the only published user research on focus styles.

**Take the compound-indicator principle, which is free, and the geometry that fits your palette.** Take GOV.UK's hex values from its colour page, not from its focus page, before you quote them.

---

## The ring's CSS property

Carry the ring with an outline, or a mechanism with an explicit forced-colours override, because a ring drawn only as `box-shadow` disappears in Windows contrast themes for the people who most need it.

Forced-colours mode, the setting behind Windows contrast themes, drops `box-shadow` and keeps `outline`, repainting it in a system colour. C40 warns against shadow-only rings for that reason. Primer moved from box-shadow to outline partly for it, with element-specific offsets ([primer/css #1744](https://github.com/primer/css/pull/1744)). Fluent's React v9 utility draws the ring as a bordered pseudo-element with a `forced-colors: active` override to the system `Highlight` colour, which also survives.

Some designs need a shadow, for a two-colour ring or a halo. The fix is to pair it with `outline: 2px solid transparent`, which costs nothing visually and gives forced colours something to paint.

The toolkit tested this in Chromium's forced-colours emulation on 25 October 2026: the shadow ring drew nothing, and the transparent outline drew the ring ([toolkit: accessibility in code, visible focus](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/accessibility.md#visible-focus)). GOV.UK added such outlines to its radios and checkboxes for the same reason ([govuk-frontend #2264](https://github.com/alphagov/govuk-frontend/pull/2264)).

One measurement matters at handoff: an outline's corners grow by its offset and width. In the toolkit's Chromium measurement the same day, a `border-radius` of 12 with a 2px outline at offset 2 drew an outer radius of 16. Copying the Figma ring layer's radius onto the element therefore rounds the ring too much; the element keeps its own radius ([toolkit: figma handoff, focus rings](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/figma-handoff.md#focus-rings-reading-their-geometry)).

How corners grow under an offset isn't specified yet ([csswg-drafts #8786](https://github.com/w3c/csswg-drafts/issues/8786)), so Firefox and Safari can differ from Chromium.

**Put one sentence in every focus spec naming the CSS mechanism, and make sure it survives forced colours.** Give the element its own radius, never the ring layer's, and check the corners in Firefox and Safari.

---

## Inputs with a border

On an input the border is the indicator: thicken it, or recolour it with a measured 3:1 change, rather than stacking border, ring and halo by default.

A ring outside a bordered input gives three concentric lines, which is where the instinct to simplify comes from. Two shipping patterns do it with the border alone. Here is a resting input, then the same input recoloured and thickened.

<svg role="img" viewBox="0 0 640 180" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Three text inputs. Resting: a 1px mid-grey border. Recoloured: the same 1px border turned mid-blue, about 1.4:1 against the resting grey, so the colour change does no measurable work. Thickened: a 3px near-black border drawn inside, whose new pixels replaced white fill, so the change reads without colour.</title>
<rect x="0" y="0" width="640" height="180" rx="12" fill="#ffffff" stroke="#d8dce3"/>
<text x="20" y="44" font-size="14" font-weight="600" fill="#1a1a1a">Resting</text>
<text x="230" y="44" font-size="14" font-weight="600" fill="#c62828">Recoloured</text>
<text x="440" y="44" font-size="14" font-weight="600" fill="#1b7f3b">Thickened</text>
<rect x="20.5" y="60.5" width="179" height="43" rx="6" fill="#ffffff" stroke="#7d7d7d" stroke-width="1"/>
<text x="34" y="87" font-size="14" fill="#7a7a7a">Email</text>
<rect x="230.5" y="60.5" width="179" height="43" rx="6" fill="#ffffff" stroke="#1064cd" stroke-width="1"/>
<text x="244" y="87" font-size="14" fill="#7a7a7a">Email</text>
<rect x="441.5" y="61.5" width="177" height="41" rx="5" fill="#ffffff" stroke="#0b0c0c" stroke-width="3"/>
<text x="454" y="87" font-size="14" fill="#7a7a7a">Email</text>
<text x="20" y="134" font-size="12" fill="#1a1a1a">1px mid-grey #7D7D7D</text>
<text x="230" y="134" font-size="12" fill="#1a1a1a">1px mid-blue #1064CD</text>
<text x="230" y="154" font-size="12" fill="#c62828">~1.4:1 change: does no work</text>
<text x="440" y="134" font-size="12" fill="#1a1a1a">3px near-black, inside</text>
<text x="440" y="154" font-size="12" fill="#1b7f3b">New pixels replaced white fill</text>
</svg>

The recoloured field looks focused to someone who sees the blue, and measures as almost no change. The thickened one changes shape as well as colour.

**Thickening** is GOV.UK's pattern: the border gets thicker inside the yellow outline. Geometry carries the change as much as colour, which helps people who can't tell the hues apart, and it reliably clears the AAA area test because the new pixels used to be white fill. The resting state has to reserve the extra width, so nothing moves.

In Figma, an inside stroke whose weight changes between variants models it. Under the auto layout version that became the default in July 2026, though, an inside stroke counts in layout like a border under `box-sizing: border-box`. So a heavier stroke grows a hugging frame unless the stroke is excluded from layout or the frame is fixed ([Figma, auto layout and CSS flexbox](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind)).

**Recolouring** is UK Parliament's pattern and Material's outlined text field, and it has a precondition people skip: the resting and focused border colours must differ by at least 3:1. [Sara Soueidan's guide to focus indicators](https://www.sarasoueidan.com/blog/focus-indicators/) works through the measurement. Here is how common recolours fare:

| Recolour | Ratio | Verdict |
|---|---|---|
| Mid-grey `#767676` to black | ~3.6:1 | Passes, barely |
| Light grey `#D0D0D0` to a brand blue | often under 3:1 | Fails |
| Mid-grey `#7D7D7D` to mid-blue `#1064CD` | ~1.4:1 | Fails; only thickening carries it |
| Red error border to black, GOV.UK before its fix | 2.75:1 | Failed and was fixed |

The third row is the ordinary case. A grey-to-blue focus recolour is often near 1.4:1, so the colour change does nothing measurable and the thickening does all the work. Knowing which one is load-bearing decides which token is safe to restyle. The fourth row is the story told in [focused fields in error](#focused-fields-in-error).

House also describes a third shape: a resting border that is transparent, with the ring becoming the border on focus, so the field appears to grow without changing size.

**Thicken when the state must read without colour vision; recolour only when you can prove the 3:1 change.** Keep an outer ring only when the border can do neither, or to match buttons exactly.

---

## Rings with a glow

A ring can have a glow as decoration, if the solid ring passes every test on its own and is audited with the glow hidden; the glow may touch the ring.

A designer's mock shows a soft blue halo around a focused field. It looks finished, and it can't be certified. A translucent glow's colour is a blend with whatever is behind it, so its contrast can't be measured once for all surfaces. Forced colours deletes it if it is a shadow. And a saturated glow around a ring of the same hue inserts an intermediate colour that lowers the ring's edge contrast rather than raising it.

The failures follow from that:

- a glow with no ring at all, as in Bootstrap's long-standing default, a translucent blue spread with no solid line;
- a blurred mock with no stated outline, built as a shadow and lost in contrast themes;
- a contrast plugin reading the blend instead of the ring.

If the glow touches the ring, it becomes the ring's adjacent colour, so the ring's 3:1 is measured against the glow. A same-hue glow lands around 4:1 in practice. A gap is needed in a different case: when the band beside the ring is opaque and a different hue, such as a red error border, and the two would smudge into one edge. `outline-offset` then makes the page the adjacent colour on both sides.

Two systems show it working. Deque's Cauldron pairs a 2px purple outline with a glow on fields, and lets a field's thick red error border diffuse back into that glow when the error clears ([Deque, designing usable focus indicators](https://www.deque.com/blog/give-site-focus-tips-designing-usable-focus-indicators/)).

Ant Design's inputs recolour the border to primary and add a primary-tinted spread through `controlOutline` and `controlOutlineWidth`, and its maintainers have argued outline against shadow in public ([ant-design #21389](https://github.com/ant-design/ant-design/issues/21389)). Whether its default grey-to-primary change reaches 3:1 depends on the theme. In both systems a solid element does the state work, and the glow is texture.

An opaque pale glow is the easy alternative to audit, but it doesn't adapt: it looks right on white and wrong on a coloured panel.

**Govern the glow as decoration: near the background in hue, and never referenced by an audit.** Audit every focus state with the glow hidden.

---

## Focused fields in error

Leave the focus treatment alone and make the error quieter, which is what GOV.UK measured its way into.

[GOV.UK Frontend #1870](https://github.com/alphagov/govuk-frontend/pull/1870) is the evidence. Errored inputs had a thick red border, and focus relied on the border thickening to black. On an errored input the border was already thick, so focus changed only its colour, red to black, which the team measured at 2.75:1.

The fix reduced the error border to 2px, the same as a normal input. It also removed an override that had suppressed the focus ring's box-shadow on errored fields. The red border became an enhancement, and the error message became the information.

The file input lost its error border altogether, matching radios and checkboxes, where the error is the red bar on the form group and the text. `$govuk-border-width-form-element-error` was deprecated there and removed in [v4.0.0](https://github.com/alphagov/govuk-frontend/releases/tag/v4.0.0).

Four things generalise from it:

- **The focus indicator is identical in error and non-error states.** A red ring makes colour the only difference between two focused states.
- **The error border is no thicker than the resting border**, so focus has the same room to move.
- **The transition to audit is error-at-rest to error-focused**, so the Figma page needs an error-at-rest frame.
- **A ring next to a red border needs 3:1 against the red too.** A mid-blue ring against a typical error red is often between 2:1 and 3:1, which a darker ring, a gap or a two-colour ring fixes.

A focus colour token with `default`, `onAccent` and `onDanger` modes handles a ring that has to sit on a fill it can't beat, which is what Spectrum's static variants exist for. It is worth adding when an audit shows the failure, not before. A tinted error fill is a scanning aid, not a requirement: drop it, and an in-field icon does the same job.

**Copy #1870: error border at the standard weight, red as an enhancement, the message naming the field, and focus unchanged.**

---

## Focus in Figma

Build focus as a `State` variant on the same component set, with the ring as its own stroked layer, its width and colours bound to variables, and the contract written into the component description, because Figma draws focus but can't test it.

Focus is a value of the `State` property (`Default`, `Hover`, `Focus`, `Pressed`, and `Focus+Error` where the error case applies), not a separate component or a hand-placed overlay. A second value for keyboard focus is rarely worth it. A button at 4 types by 3 sizes by 5 states is 60 variants; a sixth state makes 72, on every component that inherits the pattern, including those where the two look identical.

A `Keyboard focus` boolean is worse, because Figma will happily combine it with `State=Disabled`. A `Focus (keyboard)` value belongs only where the two-tier treatment is really designed, and only on transitional components.

The ring is a stroked layer around the component, at the component's radius plus the offset, which maps to `outline` and `outline-offset`. An input's border change is a change to its real stroke, and is modelled as one.

The tempting alternative is an effect. A drop shadow with X, Y and blur at 0 and a spread of n draws a solid n-pixel ring, but it has three limits:

- Figma renders spread only on rectangles, ellipses, frames and components, and on a frame only when it clips content and has a visible fill ([Figma help, drop shadows](https://help.figma.com/hc/en-us/articles/360041488473));
- a spread can't leave a transparent gap, so an offset ring drawn as an effect paints the gap in one surface colour and is wrong on every other;
- Figma paints the last shadow in a list on top and CSS paints the first, so stacks reverse on the way to code.

Untitled UI shows the cost. It draws rings as effect styles, and adds combined ring-and-shadow styles because a layer takes only one effect style, a doubling its own docs call a workaround. Its React code, meanwhile, draws an outline at a 2px offset ([toolkit: figma handoff, focus rings](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/figma-handoff.md#focus-rings-reading-their-geometry)).

Since December 2023, colour variables bind to shadow colours and number variables to stroke weight and shadow geometry ([Figma forum, variables bound to new fields](https://forum.figma.com/product-updates-3/variables-can-now-be-bound-to-new-fields-in-figma-13940)), so the step from AA to AAA can be one value. Effects themselves still can't be variables, and variables can't derive one value from another, so the radius-plus-offset relation and the inner band live in words. A set of variables like this one covers it:

| Variable | Example | Notes |
|---|---|---|
| `focus/ring/width` | 2 | 3 if inside the component, or for one thickness everywhere |
| `focus/ring/offset` | 2 | What the ring actually documents; several systems use 2 |
| `focus/ring/color` | modes: default, onAccent, onDanger | Plus light and dark |
| `focus/ring/color-inner` | modes: light, dark | Two-colour rings only, 9:1 from the outer band |
| `focus/halo/color` | modes: light, dark | Decoration; never audited |

Only the browser shows the rest: forced colours, the mechanism, `:focus` against `:focus-visible` on custom widgets, the tab order, and corners growing under an offset. The description field is where consumers meet a component, so that is where the contract goes.

**Make focus a variant on the set, draw the ring as a layer, bind its values, and write the contract into the description.** The contract names the width, the offset, whether it is a border change or a ring, whether the component is transitional or retained, and which CSS property ships the ring. Check every focus design against your darkest and lightest surface tokens: a translucent halo reads as opaque on a white artboard and vanishes on a mid-tone surface.

---

## Cheat sheet

| Design intent | Ship this | Not this |
|---|---|---|
| Standard ring | `outline` with `outline-offset` | `box-shadow` alone |
| Measuring the ring | Against every surface it lands on, per mode | Against the component, when it is offset |
| Mouse users | `:focus-visible` everywhere | `outline: none` |
| Text inputs | `:focus-visible`, which the browser shows on click | A separate `:focus` rule out of caution |
| Custom retained widgets | Test with a mouse in each browser | Assume the heuristics cover them |
| Mixed-lightness surfaces | Two-colour ring, two 2px bands, 9:1 apart | A 1px inner band described as C40 |
| No room for 4px | A per-surface ring colour mode | Squeezing the second band |
| Ring inside the component | 3px | 2px |
| Input with a border | Thicken, or recolour with a measured 3:1 change | Border plus ring plus halo |
| Focused field in error | The normal focus treatment | A red ring |
| Error border | Standard width or less | A thicker border that absorbs focus |
| Glow | Ring plus glow, audited ring-only | Glow alone |
| Shadow needed | Shadow plus `2px solid transparent` outline | Shadow with no fallback |
| Element radius | The component's own | The Figma ring layer's |
| Focus in Figma | A `State` variant, ring as a layer | A focus component or overlay |
| Keyboard focus in Figma | A sentence in the description | A variant on every component |

---

## The short version

Target AA: an indicator at 3:1 against its neighbours. There is no AA thickness rule; 2.4.13 is AAA, and a 2px ring outside the component passes it. Rings drawn inside need 3px. A checklist that puts a 2px, 3:1 rule at AA under 2.4.11 is quoting a draft.

Offset the ring. With a gap of page around the component, the ring is measured against the surface on both sides, so a near-black ring in light mode and a near-white one in dark mode pass on every surface of matching lightness. A same-hue primary button only matters to rings that touch it.

When a mode mixes light and dark surfaces, or a ring lands on an image, use two 2px bands at least 9:1 apart, which is C40. Where 4px won't fit, use a per-surface ring mode.

Use `:focus-visible` everywhere. Browsers already show focus on text inputs however they were focused; test the custom widgets you sit inside.

Ship the ring as an outline, or keep a transparent outline beside any shadow, because forced colours deletes shadows. Keep the element's own radius, since outline corners grow by the offset.

On inputs the border is the indicator: thicken it, or recolour with a measured 3:1 change, and know which one carries it. On errors, keep focus unchanged and thin the error border, as GOV.UK did after measuring 2.75:1. The offset rule and `:focus-visible` everywhere are the toolkit's tested practice; preferring the two-band ring to per-surface modes, and a glow only as governed decoration, are judgements built on C40 and the systems above.

When something looks wrong, this is usually why. A ring that vanishes on a button touches the button. A ring that vanishes in a dark footer needs a second band or a mode. Three lines on an input mean nobody chose between thickening and recolouring. A red focus ring means the error case was missed. A glow-only mock needs its ring back. A ring missing in a contrast theme was a plain shadow. A ring that looks too round in code took the Figma ring's radius.

---

## What to re-check later

Researched August 2026 from each system's documentation, repositories and issue trackers, and re-checked in November 2026.

- **What the November pass re-read.** The `:focus-visible` heuristics in the CSS Selectors Level 4 draft; Red Hat's focus page; Atlassian's focus tokens and 2px offset in its `llms-tokens.txt`; the WCAG 2.2 publication history and the 10 September 2026 WCAG 3 draft; EN 301 549 v4.1.1's publication and Official Journal status; `contrast-color()` reaching Baseline in April 2026 and `light-dark()` in 2024.
- **A correction.** An earlier version of this guide advised plain `:focus` for retained components such as text inputs, on the reasoning that `:focus-visible` would leave mouse users with no indicator. The Selectors 4 heuristics overturned it: browsers indicate focus on any element that takes keyboard input.
- **Red Hat's tokens were renamed.** Earlier notes quoted `--rh-color-blue-50` and `-30`; the page re-read in November 2026 uses the interactive border tokens.
- **EN 301 549 v4.1.1.** Its publication date and legal status come from secondary reports (Deque, BrowserStack); the ETSI text itself wasn't opened. Re-check whether the Commission has cited it in the Official Journal.
- **GOV.UK's colours.** The focus page re-read in November 2026 names the two colour functions but gives no hex values; take them from the colour page after the late-2025 renaming.
- **`:focus-visible` heuristics** are non-normative and browser-specific; re-test custom retained widgets when browsers change them.
- **Outline corners under an offset** are unspecified ([csswg-drafts #8786](https://github.com/w3c/csswg-drafts/issues/8786)); the toolkit's measurement is Chromium only.
- **Figma.** Effects as variables and derived variables were both open feature requests in April 2026, known from the community forum rather than a roadmap. The July 2026 auto layout default changed how inside strokes count in layout.
- **Weaker sources.** Bootstrap's default focus shadow is described from search results, not its Sass. UK Parliament's exact mint value wasn't confirmed (the page returned 403 earlier). Ant's token wiring per component wasn't traced. No study was found on whether users gain from different mouse and keyboard focus styles.
- **The toolkit's own tests** are linked where they apply: the forced-colours emulation and the outline corner measurement, both in Chromium on 25 October 2026.

---

## Sources

**Primary: specifications and standards**

- [W3C, Understanding 2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html). The area formula and change contrast.
- [W3C, Understanding 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html).
- [W3C, Understanding 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html). Adjacent colours.
- [W3C, Understanding 2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum).
- [W3C, Technique C40](https://www.w3.org/WAI/WCAG22/Techniques/css/C40). 9:1, 2px per band, the solid-background limit, the box-shadow warning.
- [W3C, WCAG 2.2 publication history](https://www.w3.org/standards/history/WCAG22/). Recommendation 5 October 2023, republished 12 December 2024.
- [W3C, WCAG 3.0 Working Draft](https://www.w3.org/TR/wcag-3.0/), 10 September 2026.
- [w3c/wcag #2706](https://github.com/w3c/wcag/issues/2706). The draft numbering.
- [CSS Selectors Level 4, §9.4 `:focus-visible`](https://drafts.csswg.org/selectors-4/#the-focus-visible-pseudo). The suggested heuristics, read November 2026.
- [MDN, `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible) and [`outline`](https://developer.mozilla.org/en-US/docs/Web/CSS/outline).
- [csswg-drafts #8786](https://github.com/w3c/csswg-drafts/issues/8786). Outline corners under an offset.
- [web.dev, New to the web platform in April 2026](https://web.dev/blog/web-platform-04-2026). `contrast-color()` Baseline.
- [Deque, EN 301 549 v4.1.1 is final](https://www.deque.com/blog/en-301-549-v4-1-1-is-final-what-changed-what-it-means-and-what-you-should-do/) and [BrowserStack](https://www.browserstack.com/blog/what-en-301-549-v4-1-1-means-for-your-accessibility-strategy/). Publication on 2 September 2026 and its legal status; secondary reports, the ETSI text itself not opened.

**Primary: design systems**

- [GOV.UK, Understanding focus state styles](https://design-system.service.gov.uk/get-started/focus-states); [#1309](https://github.com/alphagov/govuk-frontend/pull/1309), [#1316](https://github.com/alphagov/govuk-frontend/pull/1316), [#1870](https://github.com/alphagov/govuk-frontend/pull/1870), [#2264](https://github.com/alphagov/govuk-frontend/pull/2264), [v4.0.0](https://github.com/alphagov/govuk-frontend/releases/tag/v4.0.0); [design notes, July 2019](https://designnotes.blog.gov.uk/2019/07/29/weve-made-the-gov-uk-design-system-more-accessible/); [discussion #5048](https://github.com/alphagov/govuk-design-system/discussions/5048).
- [UK Parliament Design System, Focus state](https://designsystem.parliament.uk/foundations/focus-state/).
- [Red Hat Design System, Focus indicators](https://ux.redhat.com/foundations/interactions/focus-indicators/). Re-read November 2026.
- [Atlassian, Border foundation](https://atlassian.design/foundations/border) and [`llms-tokens.txt`](https://atlassian.design/llms-tokens.txt). Re-read November 2026.
- [Adobe `spectrum-design-data`, `layout.json`](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/src/layout.json) and [`button.json`](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data/components/button.json).
- [IBM Carbon themes, `white.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/themes/src/v10/white.ts) and [`g100.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/themes/src/v10/g100.ts).
- [Material Web, focus ring](https://github.com/material-components/material-web/blob/main/docs/components/focus-ring.md).
- [Primer CSS #1744](https://github.com/primer/css/pull/1744).
- Microsoft `fluentui`: [`lightColor.ts`](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/alias/lightColor.ts), [`darkColor.ts`](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/alias/darkColor.ts), [`highContrastColor.ts`](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/alias/highContrastColor.ts), [`tab.styles.ts`](https://github.com/microsoft/fluentui/blob/master/packages/web-components/src/tab/tab.styles.ts), [`createFocusOutlineStyle.ts`](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-tabster/src/focus/createFocusOutlineStyle.ts), [Focus indicator doc](https://github.com/microsoft/fluentui/blob/master/apps/public-docsite-v9/src/Concepts/Accessibility/FocusIndicator.mdx).
- [Ant Design #21389](https://github.com/ant-design/ant-design/issues/21389).
- [Deque, *How To Design Useful and Usable Focus Indicators*](https://www.deque.com/blog/give-site-focus-tips-designing-usable-focus-indicators/).
- [Chromium blog, *Updates to form controls and focus*](https://blog.chromium.org/2020/03/updates-to-form-controls-and-focus.html).
- Figma: [drop shadows](https://help.figma.com/hc/en-us/articles/360041488473), [auto layout and CSS flexbox](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind), [variables bound to new fields](https://forum.figma.com/product-updates-3/variables-can-now-be-bound-to-new-fields-in-figma-13940).

**The toolkit's own tested rules and measurements**

- `knowledge/ui/design/accessibility.md#focus-visibility`. One ring colour per mode, measured against the surface.
- `knowledge/code/accessibility.md#visible-focus`. `:focus-visible` throughout; the forced-colours test of 25 October 2026.
- `knowledge/code/figma-handoff.md#focus-rings-reading-their-geometry`. Outline corner growth measured in Chromium; the clear-and-offset arithmetic; effect rings and spread.

**Commentary**

- [Sara Soueidan, *A guide to designing accessible, WCAG-conformant focus indicators*](https://www.sarasoueidan.com/blog/focus-indicators/).
- [Dave House, *Focusing on focus states*](https://iknowdavehouse.medium.com/focusing-on-focus-states-7c64089d805c).
- [Dave Hunter, *Making the NHS.UK focus state accessible*](https://medium.com/@dave_hunter_/making-the-nhs-uk-focus-state-accessible-with-help-from-gov-uk-8989cab3ec7d).

**Cited but not resolved to a primary source**

- Bootstrap's default focus shadow, from search results; UK Parliament's exact mint value (the page returned 403 earlier); Ant's token wiring per component; the April 2026 status of effects-as-variables, from the community forum.
