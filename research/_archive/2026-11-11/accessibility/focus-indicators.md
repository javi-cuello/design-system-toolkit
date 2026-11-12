# Focus indicators in a design system

A focus ring is judged as a whole, against whatever sits next to it, so most focus failures are decisions about geometry (inside or outside, touching or offset, border or ring) rather than about colour; this piece argues which geometry to choose and how to build it in Figma.

Researched August 2026 from each system's documentation, repositories and issue trackers, and re-checked in November 2026. The November pass re-read the `:focus-visible` heuristics in the CSS Selectors Level 4 draft, which overturned this piece's earlier advice on text inputs (section 3); re-read Red Hat's focus page, whose tokens have been renamed; confirmed Atlassian's focus tokens and 2px offset in its `llms-tokens.txt`; checked the WCAG 2.2 publication history and the 10 September 2026 WCAG 3 draft; confirmed that EN 301 549 v4.1.1, which brings in WCAG 2.2, was published on 2 September 2026 but not yet cited in the EU's Official Journal; and confirmed that `contrast-color()` became Baseline in April 2026, while `light-dark()` had been since 2024. Where the toolkit's knowledge base has tested a point in a browser, the piece says so and links the page. Practitioner writing is labelled as commentary.

---

## What this answers

The focus ring is the accessibility decision a design system argues about most often, because it has to work on every fill, every surface and every error border the system will ever produce. A palette is audited once; the ring is re-litigated with every new component.

- What do the rules require, and what is optional?
- Should components show focus to mouse users?
- Is one ring colour enough, and when does a two-colour ring earn its tokens?
- What should GOV.UK's yellow teach a product system?
- What about inputs, which already have a border?
- Can a ring have a glow?
- What happens when a field is focused and in error?
- How is all this built in Figma, and handed to code?

Sections 11 and 12 are the cheat sheet and the short version.

---

## 1. What the rules require

**The short answer.** At AA a focus indicator has to exist and reach 3:1 against the colours next to it. There is no AA rule about thickness. The rule with numbers in it, 2.4.13, is AAA, and a 2px ring drawn outside the component passes it anyway.

| Level | Criterion | What it asks | Numbers |
|---|---|---|---|
| A | 1.4.1 Use of Color | Colour is not the only signal of a state | none |
| AA | 2.4.7 Focus Visible | An indicator exists | none |
| AA | 1.4.11 Non-text Contrast | 3:1 against adjacent colours | 3:1 |
| AA | 2.4.11 Focus Not Obscured (Minimum) | Author content does not entirely hide the focused component | none |
| AAA | 2.4.12 Focus Not Obscured (Enhanced) | No part of it is hidden | none |
| AAA | 2.4.13 Focus Appearance | An area at least a 2px perimeter of the component, and 3:1 between focused and unfocused pixels | 2px, 3:1 |

Much of what is written about focus describes a draft. While WCAG 2.2 was in development, the strict appearance criterion was numbered 2.4.11 and set at AA, and the W3C's own tracker still holds feedback filed against "[WCAG 2.2 Draft Feedback] Success Criterion 2.4.11 Focus Appearance (Level AA)" in October 2022 ([w3c/wcag #2706](https://github.com/w3c/wcag/issues/2706)). It was moved to AAA, which needed a fresh Candidate Recommendation, and because new AAA criteria are appended after the AA ones the working group renumbered: appearance became 2.4.13 and the freed numbers went to the two Focus Not Obscured criteria. WCAG 2.2 became a Recommendation on 5 October 2023 and was republished with corrections on 12 December 2024 ([publication history](https://www.w3.org/standards/history/WCAG22/)). A checklist that calls a 2px, 3:1 indicator an AA requirement under 2.4.11 is quoting the draft.

The binding version is moving in Europe. ETSI published EN 301 549 v4.1.1, which incorporates WCAG 2.2 A and AA, on 2 September 2026; until the Commission cites it in the Official Journal, presumption of conformity under the European Accessibility Act still rests on v3.2.1 and WCAG 2.1 ([Deque](https://www.deque.com/blog/en-301-549-v4-1-1-is-final-what-changed-what-it-means-and-what-you-should-do/), [BrowserStack](https://www.browserstack.com/blog/what-en-301-549-v4-1-1-means-for-your-accessibility-strategy/)). The 10 September 2026 [WCAG 3 Working Draft](https://www.w3.org/TR/wcag-3.0/) has a "Keyboard focus appearance" guideline with contrast and size requirements, and calls itself a successor that "does not deprecate WCAG 2"; nothing should be built to it yet.

**The AAA geometry has one consequence worth seeing with numbers**, because it is the commonest way a reasonable design misses 2.4.13. The test compares the indicator's area with a 2px perimeter around the component; for a rectangle with corner radius r, the W3C gives `4h + 4w - (16 - 4π)r` ([Understanding 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)). A 2px ring outside or on the edge encloses at least that much. A 2px ring inside the component encloses less.

**Worked example.** A 320 by 44 input, 8px radius, 1px grey resting border, 2px blue focus border, both inside. The perimeter is about 714px, so the target is about 1,429px². The outer pixel changes from grey to blue, often around 1.4:1, so it does not count. The second pixel changes from the white fill to blue, well over 3:1, and contributes about 714px². That is half the area needed, in a design that passes AA comfortably. A 3px focus border clears it.

[Red Hat](https://ux.redhat.com/foundations/interactions/focus-indicators/) reached the same conclusion from the same geometry and says so: "inset focus must be greater than 2px", so it uses 3px "in all cases". Its ring is an outline of `--rh-border-width-lg` (3px) at an offset of the same token, coloured `--rh-color-border-interactive`, which resolves to an on-light or on-dark value; inset rings take a negative offset. (Earlier notes quoted `--rh-color-blue-50` and `-30`; the page now uses the interactive border tokens.)

| Ring colour | Against | Ratio | Verdict |
|---|---|---|---|
| `#0066CC` | white page | ~5.6:1 | Passes |
| `#0066CC` | `#F0F0F0` grey card | ~4.9:1 | Passes |
| `#0F62FE`, Carbon Blue 60 | white | ~5:1 | Passes |
| `#FFDD00`, GOV.UK yellow | white | ~1.35:1 | Fails on its own |
| `#FFDD00` | `#0B0C0C` near-black | ~14.5:1 | The pairing is the design |
| A mid-blue ring touching a blue button | the button | near 1:1 | Invisible on that side |

No shipping system checked runs the corner formula per component; they choose a thickness generous enough not to need it. If proving a pass needs geometry, make the ring thicker.

**What to do.** Claim AA and note that the pattern also meets 2.4.13, which an outside 2px ring does for free. Budget 3px wherever a ring or border is drawn inside the component.

---

## 2. Where the ring sits decides what it is measured against

**The short answer.** A ring offset from the component, with a gap of page between them, is measured against the page on both sides, so a same-hue primary button cannot make it fail. A ring that touches the component is measured against the component too. Choose the offset, and most of the "one ring is not enough" problem goes away.

1.4.11 asks for 3:1 "against adjacent color(s)" ([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)). For an outline with `outline-offset`, the colours adjacent to the ring are the surface outside it and the gap inside it, which is the same surface. The component's own fill never touches the ring. The blue-ring-on-blue-button failure in the table above is a failure of rings that sit on the component's edge, which is how box-shadow rings, inside strokes and zero-offset outlines are usually built.

The toolkit takes this as its working rule: one ring colour per mode, offset from the component, measured against the surface and never the component. A near-black ring in light mode and a near-white one in dark mode then pass on every surface whose lightness matches its mode ([toolkit: accessibility, focus visibility](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/design/accessibility.md#focus-visibility)). The ring has to change only when one mode mixes light and dark surfaces, a dark footer on a light page or a brand band, or when the ring lands on an image.

That rule moves the question this piece used to ask. It is not "do we have a coloured primary button", it is "does any mode put the ring on surfaces of opposite lightness". Most product libraries answer yes somewhere (a dark footer, a hero, a dark-mode card on a darker page), which is where section 4 starts.

**What to do.** Default to an outline with an offset. Measure the ring against every surface token it can land on, per mode, not against the component.

---

## 3. Focus for mouse users

**The short answer.** Use `:focus-visible` everywhere, text inputs included: the browser already shows focus on a text input however it was focused. What deserves a sentence in a component's documentation is the opposite trap, a custom widget whose focus the browser's heuristics hide from mouse users.

A browser fires focus whenever an element becomes active, including on a mouse click. `:focus-visible` matches only when the browser judges that showing focus would help, which is why a clicked button no longer keeps a ring and why teams no longer reach for `outline: none` to hide one. Support has been Baseline since March 2022 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)).

Commentary: Dave House's [*Focusing on focus states*](https://iknowdavehouse.medium.com/focusing-on-focus-states-7c64089d805c) sorts components usefully. *Transitional* focus belongs to things that take you somewhere, a link or a submit button, where a ring during the click tells a mouse user nothing and collides with the pressed state. *Retained* focus belongs to things you sit inside, a text field, where everyone benefits from seeing where they are typing.

An earlier version of this piece drew the wrong rule from that framing: that retained components must use plain `:focus`, because `:focus-visible` would leave mouse users with no indicator. The browser already handles it. The Selectors Level 4 draft's suggested heuristics say: "If the element supports keyboard input (such as an input element, or any other element that would trigger a virtual keyboard to be shown on focus if a physical keyboard were not present), indicate focus", and only for a pointer on an element that does not take keyboard input, "don't indicate focus" ([Selectors 4, §9.4](https://drafts.csswg.org/selectors-4/#the-focus-visible-pseudo)). MDN says the same: "when a text box needing user input has focus, focus is indicated." The toolkit follows `:focus-visible` throughout for this reason ([toolkit: accessibility in code, visible focus](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/accessibility.md#visible-focus)).

House's framing still earns its place for what the heuristics do not cover. A custom listbox, a contenteditable region or a `select` is retained in House's sense but may not count as taking keyboard input in every browser's heuristics; the suggestions are non-normative and browsers choose their own. Those are the components to test with a mouse in each browser, and to style with `:focus` if they lose their indicator.

House also suggests a two-tier treatment, a compliant focus state for everyone and a stronger one for keyboard users, and attaches the right condition: both must pass. It is the weakest-evidenced idea here; no study was found testing whether users gain from mouse and keyboard focus looking different.

Two old reasons for building rings from `box-shadow` have gone. Outlines have followed `border-radius` in all major browsers since Safari 16.4 in March 2023 ([MDN `outline`](https://developer.mozilla.org/en-US/docs/Web/CSS/outline)), and outlines survive an `overflow: hidden` ancestor that clips shadows. One of House's points has not aged: `outline: none` cannot be repainted by a user's own colour override, because it states there is no outline, while a transparent outline can.

**What to do.** One focus mixin under `:focus-visible`. Write the transitional or retained category into each component's description, and test retained custom widgets with a mouse. Take the two-tier treatment only if two different looks are genuinely designed.

---

## 4. One colour or two

**The short answer.** One offset ring colour per mode is enough until a mode puts it on surfaces of opposite lightness or on images. Then use a two-colour ring built to W3C technique C40: two bands, each at least 2px, at least 9:1 against each other.

What shipping systems use:

| System | Width | Offset | Colour token | Notes |
|---|---|---|---|---|
| Atlassian | `border.width.focused`, 2px | 2px in its examples | `color.border.focused`, `#0C66E4` light, `#85B8FF` dark | The Focus Ring component is deprecated in favour of the `Focusable` primitive |
| IBM Carbon | 2px | offset | `$focus` / `--cds-focus` | Blue 60 `#0F62FE` in the white theme, white in `g100` |
| Adobe Spectrum | 2px | 2px | `focus-indicator-color`, plus `static-white-` and `static-black-` variants | `focus-indicator-gap` deprecated for the semantic `focus-ring-gap`; the repository was renamed from `spectrum-tokens` to `spectrum-design-data` |
| Material Web | `--md-focus-ring-width`, 3px | positioned by the component | `--md-focus-ring-color`, default `--md-sys-color-secondary` | `--md-focus-ring-active-width` 4px |
| GitHub Primer | `--focus-outline-width` | 0 on form fields, 2px on buttons and links | `--focus-outline-color` | Moved from box-shadow to outline |
| Red Hat | 3px, `--rh-border-width-lg` | 3px, same token | `--rh-color-border-interactive` | One thickness, inset or offset |
| Microsoft Fluent 2 | 2px, hardcoded in React v9 | none; just outside the border | `colorStrokeFocus2` | The shared utility avoids `strokeWidthThick`, which a source comment says caused "weird bugs" |

A single colour guarantees 3:1 against one family of surfaces. Carbon's theme-swapped `$focus` and Spectrum's static white and black variants are patches for the surfaces it cannot handle, each maintained for as long as the surface exists.

Browsers ship the alternative. Chromium's and Firefox's default indicator is a dark line edged in white, so one band carries the contrast on any page ([Chromium blog, 2020](https://blog.chromium.org/2020/03/updates-to-form-controls-and-focus.html)). [C40](https://www.w3.org/WAI/WCAG22/Techniques/css/C40) codifies it with two requirements: the two colours are 9:1 or more apart, which guarantees one of them reaches 3:1 on any solid background, and each band is at least 2 CSS pixels. The second requirement is the one that gets dropped: a 1px light band beside a 2px ring may measure fine, but it is not C40 and should not be described as conforming to it. C40 also holds only when the whole indicator is drawn over a single solid background; over an image, a gradient or another component, measure pixel by pixel.

Fluent 2 shows the pattern and the trap in one token pair. `colorStrokeFocus1` and `colorStrokeFocus2` are white and black in light theme, swapped in dark, and mapped to the system's Canvas and Highlight colours in forced-colours mode ([fluentui token source](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/alias/lightColor.ts)). Its web components pair them as a 1px outline plus a 3px box-shadow ring on Tab, Dropdown and Slider ([tab.styles.ts](https://github.com/microsoft/fluentui/blob/master/packages/web-components/src/tab/tab.styles.ts)): 21:1 apart, but with an inner band under C40's 2px. React v9's shared `createFocusOutlineStyle` defaults to a single 2px pseudo-border instead, so the geometry differs by layer.

The [UK Parliament Design System](https://designsystem.parliament.uk/foundations/focus-state/) ships the conforming shape: two 2px rings outside the element, black and mint, so that one meets the contrast minimum on any background. It removes text decoration on focused text, and lets form elements recolour their own border to black as the inner ring.

The costs are bounded. Tokens double, and double again for dark mode; the ring takes 4px around the component, which dense 24px controls may not have room for; and if the inner band is a shadow it inherits the forced-colours problem in section 6, so the outer band should be the outline. When one band is white and the other dark, most backgrounds hide one band, so the indicator still reads as a single ring. `contrast-color()` became Baseline newly available in April 2026 with Chrome 147 ([web.dev](https://web.dev/blog/web-platform-04-2026)), and `light-dark()` has been Baseline since 2024, so code can derive one band from a colour or the colour scheme; `contrast-color()` picks only black or white, which suits a C40 pair and guarantees no particular ratio beyond that.

**What to do.** Measure the single ring on every surface first (section 2). Take the two-colour ring when one fails, as two 2px bands at 9:1 or more. Where 4px will not fit, give the ring a per-surface colour mode instead.

---

## 5. What GOV.UK's yellow teaches

**The short answer.** Do not copy the yellow; copy the principle under it. WCAG judges the indicator as a whole, so no single part has to pass everywhere as long as the combination does.

GOV.UK's focus colours are `govuk-functional-colour(focus)` and `govuk-functional-colour(focus-text)`, yellow `#FFDD00` and near-black `#0B0C0C`. A focused link gets a yellow background and a thick black bottom border with the underline removed; a focused input gets a yellow outline and a thicker black border. The [focus states page](https://design-system.service.gov.uk/get-started/focus-states) gives the reasoning: the combination meets 1.4.11 on any background GOV.UK uses, because "The yellow has a high contrast with dark backgrounds" and the thick black border carries it on light ones. NHS.UK adopted the same approach with GOV.UK's help after its warmer yellow failed the requirement ([Dave Hunter](https://medium.com/@dave_hunter_/making-the-nhs-uk-focus-state-accessible-with-help-from-gov-uk-8989cab3ec7d), commentary). The 2019 redesign that produced it landed in [#1309](https://github.com/alphagov/govuk-frontend/pull/1309) for links and [#1316](https://github.com/alphagov/govuk-frontend/pull/1316) for radios and checkboxes. A late-2025 palette audit renamed colours across the wider palette ([discussion #5048](https://github.com/alphagov/govuk-design-system/discussions/5048)); the focus page re-read in November 2026 still names the two functions above but gives no hex values, so take those from the colour page before quoting them.

It is the double ring's guarantee reached with different geometry. It is also loud by design, chosen against GOV.UK's fixed backgrounds, and not one universal style: each new component's focus is designed rather than inherited. For a product system with a brand palette and dark mode, the double ring buys the same resilience with less work per component. For a public service with a fixed palette, the yellow has a decade of population-scale use behind it and almost the only published user research on focus styles.

**What to do.** Take the compound-indicator principle, which is free, and the geometry that fits your palette.

---

## 6. Which CSS mechanism carries the ring

**The short answer.** An outline, or a mechanism with an explicit forced-colours override. A ring drawn only as `box-shadow` disappears in Windows contrast themes, for the people who most need it.

Forced-colours mode drops `box-shadow` and keeps `outline`, repainted in a system colour; C40 warns against shadow-only rings for that reason. Primer moved from box-shadow to outline partly for it, with element-specific offsets ([primer/css #1744](https://github.com/primer/css/pull/1744)). Fluent's React v9 utility draws the ring as a bordered pseudo-element with a `forced-colors: active` override to the system `Highlight` colour, which also survives.

Where a design needs a shadow, for a two-colour ring or a halo, pair it with `outline: 2px solid transparent`. It costs nothing visually and gives forced colours something to paint. The toolkit tested this in Chromium's forced-colours emulation on 25 October 2026: the shadow ring drew nothing and the transparent outline drew the ring ([toolkit: accessibility in code, visible focus](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/accessibility.md#visible-focus)). GOV.UK added such outlines to its radios and checkboxes for the same reason ([govuk-frontend #2264](https://github.com/alphagov/govuk-frontend/pull/2264)).

One measurement matters at handoff: an outline's corners grow by its offset and width. The toolkit measured it in Chromium on the same day: a `border-radius` of 12 with a 2px outline at offset 2 draws an outer radius of 16. Copying the Figma ring layer's radius onto the element therefore rounds the ring too much; the element keeps its own radius ([toolkit: figma handoff, focus rings](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/figma-handoff.md#focus-rings-reading-their-geometry)). How corners grow under an offset is not yet specified ([csswg-drafts #8786](https://github.com/w3c/csswg-drafts/issues/8786)), so Firefox and Safari are worth checking.

**What to do.** Put one sentence in every focus spec naming the CSS mechanism, and make sure it survives forced colours.

---

## 7. Inputs, which already have a border

**The short answer.** On an input the border is the indicator. Thicken it, or recolour it with a measured 3:1 change. Do not stack border, ring and halo by default.

A ring outside a bordered input gives three concentric lines, which is where the instinct to simplify comes from. Two shipping patterns justify it.

**Thickening** is GOV.UK's: the border gets thicker inside the yellow outline. Geometry carries the change as much as colour, which helps people who cannot tell the hues apart, and it reliably clears the AAA area test because the new pixels were the white fill. The resting state has to reserve the extra width so nothing moves. In Figma, an inside stroke whose weight changes between variants models it, but under the auto layout version that became the default in July 2026 an inside stroke counts in layout like a border under `box-sizing: border-box`, so a heavier stroke grows a hugging frame unless the stroke is excluded from layout or the frame is fixed ([Figma, auto layout and CSS flexbox](https://help.figma.com/hc/en-us/articles/42031586813719-Use-auto-layout-with-CSS-Flexbox-in-mind)).

**Recolouring** is UK Parliament's and Material's outlined text field, and has a precondition people skip: the resting and focused border colours must differ by at least 3:1 ([Sara Soueidan](https://www.sarasoueidan.com/blog/focus-indicators/), commentary, works through the measurement).

| Recolour | Ratio | Verdict |
|---|---|---|
| Mid-grey `#767676` to black | ~3.6:1 | Passes, barely |
| Light grey `#D0D0D0` to a brand blue | often under 3:1 | Fails |
| Mid-grey `#7D7D7D` to mid-blue `#1064CD` | ~1.4:1 | Fails; only thickening carries it |
| Red error border to black, GOV.UK before its fix | 2.75:1 | Failed and was fixed (section 9) |

The third row is the ordinary case. A grey-to-blue focus recolour is often near 1.4:1, so the colour change does nothing measurable and the thickening is doing all the work. Knowing which is load-bearing decides which token is safe to restyle.

Commentary: House also describes a resting border that is transparent, with the ring becoming the border on focus, so the field appears to grow without changing size.

**What to do.** Thicken when the state must read without colour vision; recolour when you can prove the 3:1 change. Keep an outer ring only when the border can do neither, or to match buttons exactly.

---

## 8. A glow around the ring

**The short answer.** Allowed, if the solid ring passes every test on its own and is audited with the glow hidden. The glow may touch the ring.

A translucent glow's colour is a blend with whatever is behind it, so its contrast cannot be certified; forced colours deletes it if it is a shadow; and a saturated glow around a ring of the same hue inserts an intermediate colour that lowers the ring's edge contrast rather than raising it. The failures follow from that: a glow with no ring (Bootstrap's long-standing default is a translucent blue spread with no solid line, described here from search results rather than its Sass); a designer's blurred mock with no stated outline, built as a shadow and lost in contrast themes; and a contrast plugin reading the blend instead of the ring.

If the glow touches the ring, it becomes the ring's adjacent colour, so the ring's 3:1 is measured against the glow. A same-hue glow lands around 4:1 in practice. A gap is needed in a different case: when the band beside the ring is opaque and a different hue, such as a red error border, and the two would smudge into one edge. `outline-offset` makes the page the adjacent colour on both sides.

Two systems show it working. Deque's Cauldron pairs a 2px purple outline with a glow on fields, and lets a field's thick red error border diffuse back into that glow when the error clears ([Deque](https://www.deque.com/blog/give-site-focus-tips-designing-usable-focus-indicators/)). Ant Design's inputs recolour the border to primary and add a primary-tinted spread through `controlOutline` and `controlOutlineWidth`, and its maintainers have argued outline against shadow in public ([ant-design #21389](https://github.com/ant-design/ant-design/issues/21389)); whether its default grey-to-primary change reaches 3:1 depends on the theme. In both, a solid element does the state work and the glow is texture. An opaque pale glow is easy to audit but does not adapt: it looks right on white and wrong on a coloured panel.

**What to do.** Govern the glow: decoration only, near the background in hue, never referenced by an audit.

---

## 9. A field that is focused and in error

**The short answer.** Leave the focus treatment alone and make the error quieter. That is what GOV.UK measured its way into.

[GOV.UK Frontend #1870](https://github.com/alphagov/govuk-frontend/pull/1870) is the evidence. Errored inputs had a thick red border, and focus relied on the border thickening to black. On an errored input the border was already thick, so focus changed only its colour, red to black, which the team measured at 2.75:1. The fix reduced the error border to 2px, the same as a normal input, and removed an override that had suppressed the focus ring's box-shadow on errored fields. The red border became an enhancement and the error message the information. The file input lost its error border altogether, matching radios and checkboxes, where the error is the red bar on the form group and the text. `$govuk-border-width-form-element-error` was deprecated there and removed in [v4.0.0](https://github.com/alphagov/govuk-frontend/releases/tag/v4.0.0).

Four things generalise. The focus indicator is identical in error and non-error states; a red ring makes colour the only difference between two focused states. The error border is no thicker than the resting border, so focus has the same room to move. The transition to audit is error-at-rest to error-focused, so the Figma page needs an error-at-rest frame. And a ring next to a red border needs 3:1 against the red too; a mid-blue ring against a typical error red is often between 2:1 and 3:1, which a darker ring, a gap or a two-colour ring fixes.

A focus colour token with `default`, `onAccent` and `onDanger` modes handles a ring that must sit on a fill it cannot beat, which is what Spectrum's static variants exist for; add it when an audit shows the failure, not before. A tinted error fill is a scanning aid, not a requirement; drop it and an in-field icon does the same job.

**What to do.** Copy #1870: error border at the standard weight, red as enhancement, the message naming the field, and focus unchanged.

---

## 10. Building it in Figma

**The short answer.** A `State` variant on the same component set, the ring as its own stroked layer, width and colours bound to variables, and the contract written into the component description, because Figma draws focus but cannot test it.

Focus is a value of the `State` property (`Default`, `Hover`, `Focus`, `Pressed`, and `Focus+Error` where section 9 applies), not a separate component or a hand-placed overlay. A second value for keyboard focus is rarely worth it: a button at 4 types by 3 sizes by 5 states is 60 variants, and a sixth state makes 72 on every component that inherits the pattern, including those where the two look identical. Add `Focus (keyboard)` only where the two-tier treatment is really designed, and only on transitional components. Avoid a `Keyboard focus` boolean, which Figma will happily combine with `State=Disabled`.

The ring is a stroked layer around the component at the component's radius plus the offset, which maps to `outline` and `outline-offset`. An input's border change is a change to its real stroke and is modelled as one. A drop shadow with X, Y and blur at 0 and a spread of n draws a solid n-pixel ring, but Figma renders spread only on rectangles, ellipses, frames and components, and on a frame only when it clips content and has a visible fill ([Figma help, drop shadows](https://help.figma.com/hc/en-us/articles/360041488473)); and a spread cannot leave a transparent gap, so an offset ring as an effect paints the gap in one surface colour and is wrong on every other. Untitled UI draws rings as effect styles and adds combined ring-and-shadow styles because a layer takes one effect style, a doubling its own docs call a workaround, while its React code draws an outline at a 2px offset ([toolkit: figma handoff, focus rings](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/figma-handoff.md#focus-rings-reading-their-geometry)). Figma paints the last shadow in a list on top and CSS the first, so stacks reverse on the way to code.

| Variable | Example | Notes |
|---|---|---|
| `focus/ring/width` | 2 | 3 if inside the component, or for one thickness everywhere |
| `focus/ring/offset` | 2 | What the ring actually documents; several systems use 2 |
| `focus/ring/color` | modes: default, onAccent, onDanger | Plus light and dark |
| `focus/ring/color-inner` | modes: light, dark | Two-colour rings only, 9:1 from the outer band |
| `focus/halo/color` | modes: light, dark | Decoration; never audited |

Since December 2023 colour variables bind to shadow colours and number variables to stroke weight and shadow geometry ([Figma forum, variables bound to new fields](https://forum.figma.com/product-updates-3/variables-can-now-be-bound-to-new-fields-in-figma-13940)), so the step from AA to AAA can be one value. Effects themselves still cannot be variables, and variables cannot derive one value from another, so the radius-plus-offset relation and the inner band live in words; both were open feature requests in April 2026, from the community forum rather than a roadmap. Check every focus design against the darkest and lightest surface tokens: a translucent halo reads as opaque on a white artboard and vanishes on a mid-tone surface.

What only the browser shows: forced colours, the mechanism, `:focus` against `:focus-visible` on custom widgets, the tab order, and corners growing under an offset. The description field is where consumers meet a component, so the contract goes there: width, offset, border-change or ring, transitional or retained, and which CSS property ships the ring.

**What to do.** Variant on the set, ring as a layer, values bound, contract in the description.

---

## 11. Cheat sheet

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

## 12. The short version

Target AA: an indicator at 3:1 against its neighbours. There is no AA thickness rule; 2.4.13 is AAA, and a 2px ring outside the component passes it. Rings drawn inside need 3px. A checklist that puts a 2px, 3:1 rule at AA under 2.4.11 is quoting a draft.

Offset the ring. With a gap of page around the component, the ring is measured against the surface on both sides, so a near-black ring in light mode and a near-white one in dark mode pass on every surface of matching lightness. A same-hue primary button only matters to rings that touch it.

When a mode mixes light and dark surfaces, or a ring lands on an image, use two 2px bands at least 9:1 apart, which is C40. Where 4px will not fit, use a per-surface ring mode.

Use `:focus-visible` everywhere. Browsers already show focus on text inputs however they were focused; test custom widgets that you sit inside.

Ship the ring as an outline, or keep a transparent outline beside any shadow, because forced colours deletes shadows. Keep the element's own radius; outline corners grow by the offset.

On inputs the border is the indicator: thicken it, or recolour with a measured 3:1 change, and know which one carries it. On errors, keep focus unchanged and thin the error border, as GOV.UK did after measuring 2.75:1.

**When something looks wrong, this is usually why.** A ring that vanishes on a button touches the button. A ring that vanishes in a dark footer needs a second band or a mode. Three lines on an input mean nobody chose between thickening and recolouring. A red focus ring means section 9 was missed. A glow-only mock needs its ring back. A ring missing in a contrast theme was a plain shadow. A ring that looks too round in code took the Figma ring's radius.

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

- [GOV.UK, Understanding focus state styles](https://design-system.service.gov.uk/get-started/focus-states); [#1309](https://github.com/alphagov/govuk-frontend/pull/1309), [#1316](https://github.com/alphagov/govuk-frontend/pull/1316), [#1870](https://github.com/alphagov/govuk-frontend/pull/1870), [#2264](https://github.com/alphagov/govuk-frontend/pull/2264), [v4.0.0](https://github.com/alphagov/govuk-frontend/releases/tag/v4.0.0); [design notes, July 2019](https://designnotes.blog.gov.uk/2019/07/29/weve-made-the-gov-uk-design-system-more-accessible/).
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

**Commentary, labelled as such in the text**

- [Sara Soueidan, *A guide to designing accessible, WCAG-conformant focus indicators*](https://www.sarasoueidan.com/blog/focus-indicators/).
- [Dave House, *Focusing on focus states*](https://iknowdavehouse.medium.com/focusing-on-focus-states-7c64089d805c).
- [Dave Hunter, *Making the NHS.UK focus state accessible*](https://medium.com/@dave_hunter_/making-the-nhs-uk-focus-state-accessible-with-help-from-gov-uk-8989cab3ec7d).

**Not resolved to a primary source**

- Bootstrap's default focus shadow, from search results; UK Parliament's exact mint value (the page returned 403 earlier); Ant's token wiring per component; the April 2026 status of effects-as-variables, from the community forum.
