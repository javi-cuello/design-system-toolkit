# Focus indicators in a design system

What the accessibility rules actually require, when focus and keyboard focus should differ, which ring patterns survive real backgrounds, and how to build the result as Figma variants and variables.

Researched August 2026, merging two earlier guides: one on cross-system evidence and conformance, one on the Figma modelling and the focus-versus-keyboard-focus question. Token names, values and pull-request histories checked against each system's own documentation, repository or issue tracker. Microsoft Fluent's focus-stroke tokens, Adobe Spectrum's focus-indicator thickness and gap tokens, and Atlassian's ring offset were the claims re-checked most closely; all three resolved to a primary source. Practitioner writing is labelled as commentary wherever it appears.

---

## What this answers

Focus states are where a design system's accessibility convictions become visible. Colour palettes get audited once and forgotten. The focus ring gets re-litigated every time a new component ships, because it has to work against every fill, every background and every error border the system will ever produce.

The questions, in order:

- What do the rules actually require, and what is optional?
- Are focus and keyboard focus different things, and should components model both?
- Is one ring enough?
- When does a two-colour ring earn its extra tokens?
- Should you copy GOV.UK's yellow?
- What about inputs, which already have a border?
- Can you have a soft glow, and can it touch the ring?
- What happens when a field is both focused and errored?
- How do you build all this in Figma?

Sections 10 and 11 are the cheat sheet and the short version.

---

## 1. What the rules actually require

**The short answer.** At AA you need a visible indicator with 3:1 contrast against what surrounds it. There is no AA rule about thickness. The rule with numbers in it is AAA, and a 2px offset ring passes it anyway.

**First, a piece of housekeeping that invalidates a lot of what you will read elsewhere.** While WCAG 2.2 was being drafted, the strict rule about indicator size and contrast was numbered 2.4.11 and slated for Level AA, exactly as filed in the W3C's own tracker as "[WCAG 2.2 Draft Feedback] Success Criterion 2.4.11 Focus Appearance (Level AA)" in October 2022. It later changed requirements, was judged not AA-worthy, and moving it to AAA required a fresh Candidate Recommendation. The working group used that moment to reorder the success criteria, since new AAA criteria are always appended after the AA ones within a guideline. The renamed, AAA-only criterion landed at **2.4.13 Focus Appearance**, and the freed-up 2.4.11 and 2.4.12 slots went to a different, newer pair: Focus Not Obscured. Articles written before the reorder describe the draft numbering. So when a checklist tells you a 2px indicator with 3:1 change contrast is an AA requirement, it is describing a rule that shipped as optional AAA.

Here is the actual package:

| Level | Criterion | What it asks | Numbers |
|---|---|---|---|
| A | 1.4.1 Use of Color | Colour cannot be the only means of conveying a state | none |
| AA | 2.4.7 Focus Visible | An indicator exists at all | none |
| AA | 1.4.11 Non-text Contrast | 3:1 against adjacent colours, meaning the page outside and the component edge inside | 3:1 |
| AA | 2.4.11 Focus Not Obscured (Minimum) | Author-created content cannot entirely hide the focused component; partial obscuring is allowed | none |
| AAA | 2.4.12 Focus Not Obscured (Enhanced) | Nothing may hide any part of the indicator | none |
| AAA | 2.4.13 Focus Appearance | Indicator area at least that of a 2px perimeter of the unfocused component, and 3:1 change contrast between focused and unfocused pixels | 2px, 3:1 |

2.4.12 is easy to conflate with 2.4.11 because both are called Focus Not Obscured. 2.4.11 only asks that some part of the focused element stay visible, which most sticky-header layouts already satisfy. 2.4.12 asks for all of it, which very few teams target.

**The AAA geometry has one practical consequence** worth understanding before you pick a thickness. The area test compares against a 2 CSS pixel perimeter drawn around the component; the W3C states the formula for a rectangle with corner radius r as `4h + 4w - (16 - 4π)r`. A 2px ring drawn *outside* or on the edge encloses at least that area and passes. A 2px ring drawn *inside* the component encloses less and fails, needing roughly 3px to compensate.

That inside-versus-outside distinction is the single most common way a real design misses AAA, and it is worth walking through once with numbers, because it is invisible until you do.

**Worked example.** Take a 320 by 44 input with an 8px corner radius, a 1px grey resting border, and a 2px blue focus border, both aligned inside. The perimeter is roughly 714px, so a 2px perimeter is about 1,429px² and that is your target.

Now count which pixels actually qualify. The outermost pixel was grey and becomes blue. Grey to blue at similar lightness is often around 1.4:1, so it contributes nothing. The second pixel inward was the white field fill and becomes blue, typically well over 5:1, so it qualifies and contributes about 714px². The result is half the required area, in a design that looks entirely reasonable and passes AA comfortably.

The fix is one number: take the focus border to 3px. Two full pixels then change from fill colour to focus colour and you clear the threshold. This is exactly the conclusion Red Hat reached from the same geometry, stated in their own documentation: WCAG requires 2px when focus is offset, but inset focus must be greater than 2px, so for consistency they use 3px everywhere. Their tokens are a 3px outline with a 3px offset, in `--rh-color-blue-50` for light mode and `--rh-color-blue-30` for dark. One thickness that passes in every position beats two thicknesses and a rule about when each applies.

**Some numbers you can drop straight into a contrast plugin**, because this is where the abstract requirement becomes a design constraint:

| Ring colour | Against | Ratio | Verdict |
|---|---|---|---|
| `#0066CC` | white page | ~5.6:1 | Passes comfortably |
| `#0066CC` | `#F0F0F0` grey card | ~4.9:1 | Passes |
| `#0F62FE`, Carbon Blue 60 | white | ~5:1 | Passes |
| `#FFDD00`, GOV.UK yellow | white | ~1.35:1 | Fails badly on its own |
| `#FFDD00` | `#0B0C0C` near-black | ~14.5:1 | The pairing is the entire design |
| A mid-blue ring | a blue primary button, same hue | near 1:1 | Invisible |

That last row is the failure that matters most for a product library, and every section after this one is in some way a strategy for it.

**One honest caveat on the AAA maths.** Rounded corners have a documented formula, but no shipping system in this guide runs it per-component; they pick a thickness generous enough not to need it. If an indicator is thick enough that you would need geometry to prove it passes, make it thicker instead.

**What to do.** Target AA and treat the AAA appearance criterion as a stretch you can bank cheaply, because an offset ring with 3:1 change contrast is the criterion's own example of a pass. Where your ring is drawn inside the component, budget 3px rather than 2px. In your documentation, claim AA conformance and note that the pattern also meets the AAA criterion. And do not let anyone tell you the AAA rule is mandatory because an old draft numbered it 2.4.11.

---

## 2. Focus and keyboard focus are not the same event

**The short answer.** They differ by input method, not by severity. Sort components by whether focus is transitional or retained, and only the transitional ones benefit from keyboard-only focus.

A browser fires focus whenever an element becomes the active one, including when you click it with a mouse. Keyboard focus, which in CSS is `:focus-visible`, shows the indicator only when the browser's own heuristics decide a visible indicator is appropriate, which in practice means keyboard navigation rather than a click. This is why custom focus styles used to leave a ring hanging around a button after someone clicked it, and why so many teams reached for `outline: none` to make it stop.

**The useful framing sorts components, not input methods.** Dave House's focus states article, commentary rather than a standard, splits them into transitional and retained focus, and the distinction holds up better than the CSS names do.

Transitional focus belongs to things that take you somewhere. Click a link or a submit button and it is focused and active for as long as the mouse is down, then you are gone and focus resets. The visible ring during that half second tells a mouse user nothing they did not already know, and it collides with the pressed state you designed. These are the components that benefit from keyboard-only focus.

Retained focus belongs to things you sit inside. Click into a text input and the state persists until you leave. Everyone benefits from seeing which field they are typing in, and it genuinely does not matter whether they arrived by tab or by click. These should show focus for everyone, which means plain `:focus` rather than `:focus-visible`.

That last point is a real failure mode that no Figma frame will ever reveal. If someone scopes an input's focus style to `:focus-visible` out of habit, a mouse user gets no focus state at all, and you have a 2.4.7 failure that looked perfect in design review. It belongs in the component description.

**The two-tier option, and its condition.** House also raises styling both: a compliant focus state for everyone plus a stronger keyboard state on top. He is honest that this sits in a grey area, since if you can make it better for everyone you probably should, and gives the pragmatic defence anyway. In an organisation where someone senior wants the ugly ring gone, this keeps keyboard users properly served without a fight. The condition he attaches is the right one: both states must pass. Accessible and more accessible, never inaccessible and accessible.

**Two things have changed since that argument was made in 2022**, both in your favour. `:focus-visible` is now supported everywhere, so it needs no polyfill and no debate. And outlines have followed `border-radius` in all major browsers since March 2023, which removes most of the historic reason to build rings from `box-shadow` at all. Outlines also survive an `overflow: hidden` ancestor, a category of bug that shadow-based rings still produce inside cards and scroll containers. House's complaint that the `outline` property was too basic to use has largely aged out.

One point of his that has not aged: `outline: none` cannot be recoloured by a user's own override, because you were explicit that there is no outline. A transparent outline can. That is the same mechanism section 3 recommends for forced-colors survival.

**What to do.** Write the transitional-versus-retained rule into your library documentation and apply it per component: inputs, selects and textareas show focus on click and on tab; buttons, links, tabs and cards show it on tab only. Take the two-tier approach only if you are actually designing two different looks, and only on transitional components.

---

## 3. Is one ring enough?

**The short answer.** Usually, until it isn't. A single-colour ring guarantees contrast against one family of backgrounds, and every surface it fails on becomes a permanent patch.

The mainstream answer is one solid ring, offset from the component, in a dedicated focus colour. Here is what the major systems actually ship:

| System | Width | Offset | Colour token | Notable |
|---|---|---|---|---|
| Atlassian | `border.width.focused`, 2px | 2px | `color.border.focused`, `#0C66E4` light / `#85B8FF` dark | The Focus Ring component is deprecated in favour of the `Focusable` primitive; same tokens, new home |
| IBM Carbon | 2px | offset | `$focus` / `--cds-focus` | Blue 60 `#0F62FE` in light theme, swaps to white in the `g100` dark theme |
| Adobe Spectrum | 2px | 2px | `focus-indicator-color`, plus `static-white-` and `static-black-` variants | Both geometry tokens live in the design-data package, `focus-indicator-gap` now deprecated in favour of the semantic `focus-ring-gap` |
| Material Web | `--md-focus-ring-width`, 3px | not exposed as a token; positioned by the component | `--md-focus-ring-color`, defaults to `--md-sys-color-secondary` | `--md-focus-ring-active-width` is 4px |
| GitHub Primer | `--focus-outline-width` | 0px on form fields, 2px on buttons and links | `--focus-outline-color` | Migrated from box-shadow to outline; the offset differs by element type, not a single global value |
| Red Hat | 3px | 3px | `--rh-color-blue-50` / `-30` | Deliberately the same inset and offset |
| Microsoft Fluent 2 | 2px, hardcoded | none by default (drawn just outside the border) | `colorStrokeFocus2` | React v9's shared utility avoids the `strokeWidthThick` token: a code comment in the source calls it out as causing "weird bugs" |

Atlassian's own machine-readable token reference documents a 2px offset directly, paired with `border.width.focused`; an earlier reading of this table, based on a documented 1px gap, undercounted it.

**The appeal is everything you already know from using it.** One token set, trivial to build as a Figma layer, animates cleanly, and reads as a deliberate design element rather than a browser default.

**The cost is arithmetic.** A single colour guarantees 3:1 against one family of backgrounds. The moment the system has a dark mode, a coloured hero, or a primary button in the ring's own hue, the guarantee lapses and the system has to patch it. Carbon's theme-swapped `$focus` value and Spectrum's static white and black variants are exactly that: patches, maintained forever, one per surface the single colour cannot handle.

**There is a quieter cost in how the ring is implemented**, and it matters to a Figma-first designer because it constrains what engineering can faithfully build. Windows High Contrast Mode, and the CSS `forced-colors` feature it maps to, suppresses `box-shadow` entirely. A ring shipped only as a shadow disappears for exactly the users who most need it.

Primer's migration from box-shadow to `outline` was made partly for this reason, citing Windows High Contrast reliability and Sara Soueidan's published guidance, and landing global focus styles with element-specific offsets. Fluent's React v9 components take a different route to the same guarantee: their shared focus utility renders the ring as a bordered pseudo-element rather than `outline` or `box-shadow`, with an explicit `forced-colors: active` override that swaps the border colour to the system `Highlight` colour, so the ring survives high-contrast mode even though it is built from neither of the two properties usually recommended for the job. The design translation is short either way: **your spec should say which CSS mechanism carries the ring, and that mechanism must survive `forced-colors`.**

The cheap insurance, whatever mechanism you pick, is pairing a shadow-based or pseudo-element ring with `outline: 2px solid transparent`. It costs nothing visually and gives the user's own colour override something to paint.

**What to do.** Start here and tokenise it immediately: a width variable, an offset variable, and a colour variable with modes. Cheap and near-universal. But treat the single ring as a starting position rather than a destination, because its cost profile is deferred: cheapest today, and one maintained patch per surface forever.

---

## 4. When is a two-colour ring worth it?

**The short answer.** When you have a coloured primary button and any second theme. Build it as two 2px bands, because the technique everyone cites for this requires that thickness and a 1px inner band does not conform to it.

The strongest upgrade to a single ring is a second colour, and the browser you are reading this in already ships it. Chromium's and Firefox's default focus indicator is a dark line wrapped in a white one, so on dark pages the white band carries the contrast and on light pages the dark one does.

**The arithmetic is codified in W3C technique C40**, and it has two requirements rather than the one most people remember. The two indicator colours must have a contrast ratio of **9:1 or greater with each other**, which mathematically guarantees at least one of them reaches 3:1 against any solid background. And **each colour band must be at least 2 CSS pixels thick**.

That second requirement is the one that gets dropped. A 1px light inner band paired with a 2px outer ring is a common recommendation, and it does not satisfy C40. It may still pass on measurement, but it is not conformance to the technique and should not be described as such.

**A real shipping system demonstrates both the pattern and the trap in the same token pair.** Microsoft Fluent 2 defines two global colour tokens, `colorStrokeFocus1` and `colorStrokeFocus2`, confirmed in the token source: white and black in light theme, swapped in dark theme, and mapped to the operating system's own Canvas and Highlight colours in forced-colors mode. Fluent's web-components layer uses both together on components like Tab, Dropdown and Slider: a 1px solid outline in `colorStrokeFocus1` plus a 3px box-shadow ring in `colorStrokeFocus2`, at 21:1 contrast between white and black, so the pairing clears C40's 9:1 requirement with room to spare even though the bands are 1px and 3px rather than 2px and 2px. Because the inner band sits under the 2px minimum, it is real evidence of the two-colour pattern in production, not a template to copy at that exact thickness; build the bands at 2px and 2px unless you have Fluent's own reasons for the asymmetry.

**The UK Parliament Design System ships the C40-conforming shape** and documents why plainly: two 2px rings, one black and one mint, placed outside the element, so that whatever the background, at least one ring meets the minimum contrast ratio; the mint ring is the one doing the work next to dark backgrounds. Parliament also removes text decoration on focused text elements to reduce visual noise, and permits recolouring an existing border to black to serve as the inner ring on form elements, which section 6 picks up.

**C40 has documented limits**, and they decide whether the guarantee actually holds in your product. The technique only guarantees a pass when the whole indicator is drawn over the background rather than inside the component's boundary, and when the background behind it is a single solid colour. Over an image, a gradient, or another overlapping component, you are back to measuring pixel by pixel.

A near-white such as `#F9F9F9` paired with a deep navy such as `#193146` satisfies the 9:1 requirement, and so does plain white with plain black at 21:1. The pattern also has a property that is not obvious until you build it: when one band is white and the other is dark, most backgrounds hide one band completely, so the indicator reads as a single clean ring while being background-proof underneath.

**The costs are real but bounded, and one of them just got smaller.** Token count doubles, and doubles again for dark mode. In Figma the focus layer becomes two strokes instead of one. At C40's minimum thickness the ring eats 4px of space around the component, which on dense 24px controls is noticeable and sometimes unacceptable. And the inner band inherits the forced-colors fragility from section 3 if implemented as a shadow, so the outer band must be the outline. What has changed: the CSS `contrast-color()` and `light-dark()` functions reached Baseline newly-available status across Chromium, Firefox and Safari in 2026, so engineering can increasingly compute one band from the other or from the page's colour scheme rather than shipping a hand-picked token pair per theme. This trims the doubling cost; it does not remove the need to design and test both bands.

**Mixed feelings are warranted on when it becomes mandatory.** A product living entirely on white and light-grey surfaces genuinely does not need it, and several respectable systems in exactly that position have not adopted it. The trigger is the first surface where your single ring drops below 3:1.

**What to do.** If you have a coloured primary button and any second theme, take the two-colour ring, built as two 2px bands at 9:1 or better so it actually conforms to C40. The constraint this depends on is space: at 4px total the pattern is unsuitable for very dense controls, and there the honest answer is a per-surface colour mode instead. For most systems the trigger surface already exists and is called the primary button.

---

## 5. Should you copy GOV.UK's yellow?

**The short answer.** Probably not, but copy the principle underneath it, which most product systems miss.

GOV.UK looked at the same problem and declined to solve it with a ring. Its focus colours, exposed through the `govuk-functional-colour(focus)` and `govuk-functional-colour(focus-text)` Sass functions, are the yellow `#FFDD00` and the near-black `#0B0C0C`. A focused link gets a yellow background and a thick black bottom border, with the underline removed so the state change is unmistakable even to someone who cannot distinguish the yellow. A focused input gets a yellow outline and a thickened black border.

GOV.UK's documentation states the logic compactly: the combination is built to meet WCAG's non-text contrast rule on any background colour used on GOV.UK, because the yellow has high contrast against dark backgrounds and the thick black border has high contrast against light ones. The NHS.UK team adopted the same yellow-and-black approach with GOV.UK's help, for the same reason: their previous warmer yellow failed the contrast requirement it was meant to satisfy.

**Here is the principle worth stealing.** This is the same guarantee as the double ring, achieved with different geometry, and it demonstrates something most product systems never internalise: **WCAG judges the indicator as a whole, so no single element of it has to pass everywhere as long as the combination does.** You are allowed to build a compound indicator where each part fails somewhere.

The 2019 redesign that produced these styles was GOV.UK's response to the new non-text contrast rule, shipped across pull requests covering links and link-like elements (#1309), form inputs, and radios and checkboxes (#1316), replacing a thinner yellow-and-black treatment whose bands were too slight to carry the load.

**Why not to copy it directly.** It is loud by design, which is appropriate where accessibility outranks brand expression and the palette is fixed and known. It does not generalise: the yellow was chosen against GOV.UK's specific backgrounds and is not a value you can port. And it is not one universal style. The team's own approach treats every new component's focus treatment as something to design rather than inherit, because a user who cannot perceive the yellow relies on a different signal than one who can. That is a permanent per-component cost.

**What to do.** For a product system with brand colour and dark mode, the double ring in section 4 buys the same resilience with far less bespoke work per component. For a public service with GOV.UK's constraints and a fixed palette, the flood has a decade of population-scale evidence behind it and remains the better-evidenced choice. Either way, take the compound-indicator principle, which is free.

---

## 6. What about inputs, which already have a border?

**The short answer.** On inputs, the border is the indicator and the outer ring becomes optional. Thicken it or recolour it, but if you recolour it, measure the 3:1 change contrast rather than eyeballing it.

Inputs arrive with a border, and drawing a ring outside a border produces three concentric lines, which is where the instinct to simplify comes from. Two shipping patterns justify it, each with a precondition worth stating exactly.

**Thickening** is GOV.UK's approach: the existing border gets thicker inside the yellow outline. The state change is carried by geometry as much as colour, which makes it robust for users who cannot distinguish the hues involved. It is also the pattern that most reliably clears the AAA area test, since thickening moves the indicator onto pixels that were previously the field fill, and fill-to-border contrast is usually generous.

The engineering caveat leaks into design specs: a border that grows must not push the layout around, so the resting state has to reserve the extra width, typically with a transparent border or by drawing the thickness change as an inner stroke. In Figma, an inside-aligned stroke excluded from layout, changing weight between variants, models this exactly and moves nothing. Under the auto layout version that became the default in July 2026, an inside stroke is counted in layout like a border under `box-sizing: border-box`, so a heavier focus stroke on a hugging frame grows the frame; the stroke has to be set to not count in layout, or the frame given a fixed size, for nothing to move.

**Recolouring** is the UK Parliament approach, and it comes with the precondition most often missed: **the default border colour and the focused border colour must differ by at least 3:1.** This is the change-contrast test, and it is the piece people skip.

| Recolour | Ratio | Verdict |
|---|---|---|
| Mid-grey `#767676` to black | ~3.6:1 | Passes, barely |
| Light grey `#D0D0D0` to a brand blue | often below 3:1 | Fails |
| Mid-grey `#7D7D7D` to a mid-blue `#1064CD` | ~1.4:1 | Fails; needs thickening to carry the change |
| Red error border to black, GOV.UK before their fix | 2.75:1 | Failed, and got fixed. See section 8 |

A recolour that fails this test fails more than the AAA appearance rule. It fails Level A's Use of Color, because the state is then signalled by a colour shift too subtle to count as anything else. Sara Soueidan's guide, the clearest practitioner writeup of this trap, works through the measurement: when a border changes colour on focus, the contrasting area is the border itself, and the ratio is measured between its before and after colours.

Note the third row above, because it is the common case. A perfectly ordinary grey-to-blue focus recolour is often near 1.4:1, which means the colour change alone is doing nothing measurable. The design still passes, but only because the thickening is carrying it. Knowing which of the two is load-bearing is the difference between a token you can safely restyle and one you cannot.

**Material's classic text field is the recolour pattern shipped at scale**, an outlined field whose grey border becomes a primary-colour border on focus, legal exactly when the grey-to-primary delta clears 3:1. It is also a useful counter-example to the everything-gets-a-ring consensus: a major system whose input focus is border-only and compliant.

**A third pattern is worth knowing**, described in House's article as commentary rather than shipped in a named system: make the resting border transparent and let the ring become the new border on focus. The field appears to grow by several pixels on every side without changing size, and any tinted layer moves inside as decoration. Growth and thickness carry the state, colour carries the personality.

**What to do.** Thicken when you want the state legible without relying on colour vision. Recolour when you want minimal visual change and can prove the 3:1 delta by measurement. Keep the outer ring only when the border can do neither, or when you want inputs to match buttons exactly.

The anti-pattern to name in your documentation is stacking all three by default. Three concentric lines on a focused input is the tell that a team applied its button pattern to inputs without deciding.

---

## 7. Can you have a glow?

**The short answer.** Yes, as long as the solid ring passes every test on its own and you audit with the glow layer hidden. It can touch the ring; a gap is only needed for a different reason.

A soft halo around the crisp ring is a legitimate aesthetic and several systems ship it. The rule that keeps it safe is short: **the halo contributes nothing to compliance, and the solid ring must pass as if the halo were not there.**

The reasons stack up quickly. A semi-transparent glow's effective colour is a blend with whatever sits behind it, so its contrast ratio differs on every background and cannot be certified anywhere. Forced-colors mode deletes box-shadows, so a halo built that way vanishes for high-contrast users. And a heavily tinted halo is not neutral even when the ring passes, because it inserts an intermediate colour between the ring and the background: a saturated blue glow around a blue ring on white lowers the ring's effective edge contrast rather than raising it.

**Four ways this goes wrong:**

**Halo-only, no ring.** A widely-shipped default focus style is a roughly 0.2rem (about 3px) spread of 25 percent opacity blue box-shadow with no solid ring underneath. It fails on every axis above: uncertifiable contrast, gone in forced-colors, and it is the only indicator present. Worth knowing because it is among the most-copied focus styles on the web, and because it demonstrates that halo-*only* is the failure mode, not halo-plus-ring.

**The saturated halo around a same-hue ring**, which lowers the edge contrast it appears to reinforce. The audit passes on the ring alone and the shipped component still reads as mushy.

**The blurred mock.** A designer hands over a soft glow with no stated outline, an engineer implements it as `box-shadow`, and the indicator disappears in High Contrast Mode. The fix is a sentence in the spec, not a review comment.

**Auditing with the halo visible.** The contrast plugin reads the blend, reports a number, and the number is meaningless because it is background-dependent. Hide the layer before measuring.

**On whether the halo may touch the ring.** It may, and most shipped examples do. The one check that changes when they touch is that the halo becomes the ring's adjacent colour on the outside, so the ring's 3:1 must now be measured against the halo rather than against the page. A same-hue halo makes this predictable, because it is composed mostly of the ring's own colour and lands around 4:1 in practice.

A gap becomes necessary in a different situation: when the band next to the ring is opaque and a *different* hue, as with a coloured error border sitting against a coloured focus ring. Two solid bands at similar lightness smudge into one ambiguous edge and the adjacency test gets hard. A gap in the surface colour, which is what `outline-offset` produces, resolves it by making the page the adjacent colour on both sides.

**Two systems show the healthy version.** Deque's own Cauldron system pairs a saturated-purple 2px outline (chosen to read against white and off-white workspaces) with a glow used as continuity rather than compliance: on form fields, focus co-opts the colour of the field's own border and gives it a gentle glow, and when a field moves out of an error state, its thick red border visibly diffuses back into that same glow, so the transition itself communicates the state change. The state work is still done by a solid element, the border; the glow rides along as texture. And the largest halo-forward counterweight ships from outside the Western cluster: Ant Design's focused inputs recolour the border to the primary colour and add a soft primary-tinted spread shadow, tokenised through `controlOutline` and `controlOutlineWidth`. Ant's maintainers have also debated the outline-versus-box-shadow question publicly on their own issue tracker.

At Ant's scale the aesthetic has clearly survived contact with an enormous enterprise user base, and it sits on the right side of this section's rule for the same reason Deque's does: the border recolour does the state work while the glow rides along as texture. Whether Ant's default grey-to-primary delta clears the 3:1 change test depends on the theme's exact values, so read it as evidence that the halo aesthetic is viable in production, not as a certified pattern to copy verbatim.

**A note on opaque halos.** Building the halo as a solid pale tint rather than a low-opacity layer trades one problem for another. It composites identically everywhere, so it is predictable and easy to audit. But it will not adapt: a solid pale blue that looks correct on white and near-white surfaces will look wrong the moment it lands on a coloured panel, where an alpha layer would at least have tinted along with it. Fine for a system whose surfaces are all near-white; check before the pattern reaches a brand-coloured section.

**What to do.** Allow the halo and govern it: decoration only, close to the background in hue, audited with the layer hidden, and the spec states which CSS property ships the solid ring. Ring plus halo is fine, in error states too, provided you audit the ring alone.

---

## 8. What happens when a field is focused and errored?

**The short answer.** Nothing changes about the focus ring. Make the error quieter instead, which is the opposite of most people's instinct and is what GOV.UK measured their way into.

The cleanest evidence here is GOV.UK Frontend pull request #1870, short enough to read and decisive enough to copy.

**The worked case.** Before the change, GOV.UK's errored inputs had a thick red border, and its focus style relied on the border thickening to black. On an errored input the border was already thick, so focus changed only the border's colour, red to black, and the team measured that delta at **2.75:1**, below the 3:1 a state change needs.

Their fix inverted the usual instinct. Rather than making focus louder on errored fields, they made the error quieter, reducing the error border width down to 2px, the same as a normal form input's border, and removing the override that had been suppressing the focus ring's box-shadow on errored fields (the ring had been getting swallowed by the extra-thick error border). The red border became an enhancement, with the bold error message text carrying the real information about which field failed. They also removed the border entirely from the file input's error state, aligning it with radios and checkboxes, where the error is carried by the red left-hand border on the form group plus the error text rather than by the control itself. `$govuk-border-width-form-element-error` was deprecated in the same change and removed in v4.0.0.

**Four things generalise out of that.**

The focus indicator stays identical in error and non-error states, same colour and same geometry. A ring that turns red on errored fields makes colour the only difference between focused-normal and focused-errored, walking straight into Use of Color, and it breaks the consistency that lets keyboard users recognise focus instantly anywhere on the page.

The error styling must be thin enough that the focus treatment layers over it without being absorbed. If both states fight for the same border, one of them loses, and GOV.UK's measurement shows which. The practical rule is that the error border should be no thicker than the resting border, so that focus has the same amount of room to move in both states.

The state comparison that matters is error-at-rest against error-focused, not normal-focus against error-focus. This is easy to get wrong when auditing a Figma page, because a page showing rest, focus and error-focus but no error-at-rest frame gives you no way to check the transition that users actually experience.

And check one extra adjacency. When your ring lands next to a red error border, the ring-against-red ratio needs the same 3:1 as any other edge. A mid-blue ring against a typical error red is often between 2:1 and 3:1. The fix is a darker ring, a gap between ring and border, or the two-colour ring from section 4, whose light band restores separation against any error colour for free.

**The `onDanger` case is worth a token.** Spectrum's `static-white-focus-indicator-color` and `static-black-focus-indicator-color` exist for exactly this class of problem, a ring that must sit on a fill or border colour the default ring cannot beat. A focus colour token with `default`, `onAccent` and `onDanger` modes costs little in Figma variables and removes the per-component judgement calls.

**On error fills.** A tinted error fill behind the field is a scanability aid, not a compliance requirement, and it slightly reduces the error border's contrast against its own interior. Removing it is legitimate. What you lose is the ability to scan a long form for affected fields at a glance, since an error border and a resting border at similar lightness are near-identical in greyscale. If you drop the fill, an in-field error icon does the same job.

**What to do.** Copy #1870 in spirit: error border at your standard weight, red as enhancement, the error message naming the field, and the focus treatment identical to the normal one. This is the rare case where a single pull request contains both the measurement and the correction, so it can be cited in a design review rather than argued. Add the `onDanger` ring mode only if your audit shows the ring failing against your error red, rather than pre-emptively.

---

## 9. How do you build it in Figma?

**The short answer.** A `State` variant on the same component set, the ring as its own layer, the keyboard distinction in words rather than in variants, and the focus contract written into the component description because Figma cannot enforce it.

Figma's component guidance treats interaction states as variant property values, and focus should follow: a `State` property with `Default`, `Hover`, `Focus` and `Pressed`, plus `Focus+Error` where section 8 applies, on one component set. Not a separate focus component, and not a manual overlay a designer positions by hand. Variants keep instance swapping clean, let interactive prototypes walk the states, and put the focus treatment inside the component's contract instead of beside it.

**Do you need separate focus and keyboard-focus variants?** For most libraries, no, and the reason is arithmetic. State is usually one axis, so a button with 4 types by 3 sizes by 5 states is already 60 variants. A sixth state value takes it to 72, and you pay that on every component that inherits the pattern, forever, including the ones where the two states are pixel identical. Variant axes are cheap to add and expensive to own.

Three models, in order of preference:

**One `State=Focus` value plus documentation.** Section 2's transitional-versus-retained rule lives in the component description and in one library page. Nothing about the visual design differs, so nothing about the Figma model needs to. What differs is the sentence the engineer reads.

**Two values, only where they actually look different.** If you have genuinely designed the two-tier treatment from section 2, a subtle state for everyone and a stronger one for keyboard, then you have two visual things and they deserve two values. Name them for what they are rather than for the CSS: `State=Focus` and `State=Focus (keyboard)` reads better in a picker than `focus-visible` and survives contact with anyone who has never written CSS. Add it only to the transitional components.

**A separate boolean, which I would avoid.** A `Keyboard focus` boolean only means something in combination with one value of another axis, and Figma will happily let someone set `State=Disabled` with `Keyboard focus=true`.

**Inside the focus variant, the ring wants to be its own layer** rather than a mutation of the component's stroke. A rectangle, or the component frame's own outside-aligned stroke on a wrapper, at the component's corner radius plus the offset. This matches how engineering will build it, as `outline` with `outline-offset`, and survives component restructuring. The exception is the input patterns from section 6: border thickening or recolouring is a change to the component's real stroke and should be modelled as one, with inside alignment so nothing shifts.

**For ring-plus-halo specifically**, Figma's drop shadow is a close match to how the thing actually ships. A shadow with X, Y and blur all at 0 and a spread of *n* draws a solid *n*-pixel ring that follows the corner radius exactly, on a frame with a visible fill and Clip content on, or on a basic shape; anywhere else Figma ignores the spread. Stack a second shadow at a larger spread for the outer band or the halo. To reproduce `outline-offset`, insert a ring in the surface colour between the component and the outer band. Figma paints the last shadow in its effects list on top and CSS paints the first, so the order reverses on the way to code.

**The variables you need:**

| Variable | Example | Notes |
|---|---|---|
| `focus/ring/width` | 2 | 3 if you take Red Hat's one-thickness-everywhere position, or if your ring is drawn inside the component |
| `focus/ring/offset` | 2 | Match to what your ring token actually documents; several systems use 2px, not the 1px sometimes assumed |
| `focus/ring/color` | modes: default, onAccent, onDanger | Plus light and dark |
| `focus/ring/color-inner` | modes: light, dark | Only if two-colour, and 9:1 from the outer band |
| `focus/halo/color` | modes: light, dark | Decoration only; never referenced by an audit |

Since December 2023 you can bind number variables to a shadow's X, Y, blur and spread, colour variables to shadow colours, and number variables to stroke weight, so all of the above map onto real fields rather than living in a description. This matters more than it sounds: the difference between AA and AAA in section 1 is one stroke weight, and that is a token swap only if the weight was bound in the first place.

**Three things Figma cannot do for you**, all worth writing into the library documentation.

Effects themselves still cannot be variables, so an effect style per ring stack remains the practical carrier. This was still an open feature request as of April 2026.

Figma variables cannot natively derive one value from another, so the radius-plus-offset relationship has to live in the component description as words rather than as a bound value. Third-party plugins that layer formula relationships on top of variables exist, but nothing in native Figma computes `focus/ring/color-inner` from `focus/ring/color`, even now that CSS itself can do the equivalent with `contrast-color()`.

And **Figma renders focus states, it cannot test them.** The forced-colors behaviour, the outline-versus-shadow-versus-pseudo-element distinction, whether the input uses `:focus` or `:focus-visible`, and the actual tab order only exist in the browser. Which CSS mechanism carries the ring is load-bearing for engineering. The halo is not.

**One Figma-specific trap.** A low-opacity halo reads as fully opaque on the artboard while disappearing against a mid-tone surface in production. Check every focus design against your darkest and lightest surface tokens before publishing, not just against the white page.

**What to do.** Model focus as a variant on the same component set, build the ring as its own layer, bind the width and colours to variables so the AAA upgrade stays a one-value change, and put the focus contract in the component description in words: ring width, offset, which components use border-change instead, whether the component is transitional or retained, and the sentence naming which CSS property ships the ring. The reason for the description field specifically is that the picker is where consumers actually meet the component, so a contract stored anywhere else is a contract they will not read.

---

## 10. Cheat sheet

| Design intent | Ship this | Not this |
|---|---|---|
| Standard focus ring | `outline` with `outline-offset`, or a bordered pseudo-element with a `forced-colors` override | `box-shadow` alone, which forced-colors deletes |
| Suppressing focus for mouse users | `:focus-visible`, on transitional components only | `outline: none`, which also blocks user overrides |
| Focus on a text input | Plain `:focus`, shown on click and on tab | `:focus-visible`, which leaves mouse users with nothing |
| Ring on a saturated button | Two-colour ring, or an `onAccent` colour mode | The same single ring, which vanishes |
| Two-colour ring | Two bands, each at least 2px, at 9:1 or better | A 1px inner band described as C40 |
| Focused input with a border | Thicken, or recolour with a measured 3:1 delta | Border plus ring plus halo by default |
| Ring drawn inside the component | 3px, so the AAA area test still passes | 2px, which encloses too little area |
| Focused errored input | The identical normal focus treatment | A red focus ring |
| Error border width | Your standard border width or less | A thicker border that absorbs the focus change |
| Decorative glow | Ring plus halo, touching is fine, audited ring-only | Halo alone |
| Gap between ring and border | Only when the adjacent band is opaque and a different hue | A reflex gap on every focus state |
| Focus in Figma | A `State` variant on the component set | A separate focus component or a hand-placed overlay |
| Keyboard focus in Figma | A sentence in the component description | A second variant value on every component |

---

## 11. The short version

Target AA. There is no AA rule about thickness, and the rule with numbers in it is AAA, which an offset ring with 3:1 change contrast passes anyway. Anyone telling you otherwise is describing an old draft that briefly numbered this criterion 2.4.11 and put it at AA. If your ring is drawn inside the component rather than outside it, budget 3px rather than 2px, because inside-aligned strokes enclose less area than the test requires.

Focus and keyboard focus differ by input method. Sort components into transitional, meaning things that take you somewhere, and retained, meaning things you sit inside. Transitional components can reasonably show focus only to keyboard users. Retained ones, above all text inputs, must show it to everyone. That distinction belongs in the component description, not in a second variant.

Tokenise what you have now: width, offset, colour with modes. Then audit the ring against every fill and surface in the library, primary buttons and dark mode first.

Every failure is a decision. Patch it with a per-surface colour mode, which is cheaper now and recurring forever, or upgrade to a two-colour ring, which costs more once and closes the problem. With a coloured primary button and any second theme, upgrade, and build it as two 2px bands at 9:1 or better so it actually conforms to C40. Microsoft Fluent's own `colorStrokeFocus1`/`colorStrokeFocus2` pair, which swaps white and black by theme and defers to the operating system's own colours in forced-colors mode, is real production evidence that the pattern scales across platforms.

On inputs, the border is the indicator. Thicken it, or recolour it with a measured 3:1 delta. Do not stack border plus ring plus halo. And know which of thickness or colour is actually carrying the change, because an ordinary grey-to-blue recolour is often near 1.4:1 and is doing nothing on its own.

On errors, make the error quieter rather than the focus louder. GOV.UK measured a failing 2.75:1 and fixed it by thinning the error border, not by changing the ring. Compare error-at-rest against error-focused, which is the transition users experience, rather than normal-focus against error-focus.

Allow a glow, govern it, let it touch the ring, and audit with the layer hidden. State in the spec which CSS mechanism carries the solid ring, because forced-colors mode deletes plain box-shadows.

**When something looks wrong, this is usually why.** A ring that vanishes on the primary button wants section 4 or an `onAccent` mode. Three concentric lines on an input mean nobody chose between thickening and recolouring. A red focus ring for error fields means someone missed section 8. A glow-only mock that looked great on a white artboard needs the ring back. An input with no focus state under the mouse means someone scoped it to `:focus-visible`. And an engineer building the ring as a plain `box-shadow` with no forced-colors fallback means the spec's mechanism sentence was missing.

---

## 12. What to re-check later

- **Two Figma mechanics added 1 October 2026.** Section 6's inside-stroke advice now names the July 2026 auto layout version, which counts inside strokes in layout, and section 9's spread ring names Figma's condition for spread (a filled, clipped frame or a basic shape) and the reversed shadow order. Both are covered in `figma-and-code-differences.md` sections 2, 4 and 7.

- **Token names churn.** Primer, Atlassian and Spectrum have all renamed focus-related tokens or repositories in recent memory, including Spectrum's underlying repo (`spectrum-tokens` renamed to `spectrum-design-data`, npm package name unchanged) and Atlassian's Focus Ring component (deprecated in favour of `Focusable`). Confirm current names before quoting them in your own docs.
- **Microsoft Fluent's focus tokens.** `colorStrokeFocus1` and `colorStrokeFocus2` are confirmed in the `fluentui` repository's own token source, with real values (white/black, swapped by theme, mapped to system colours in forced-colors mode) and real usage in both the web-components and React v9 layers. The two layers do not use them identically: web-components pair both tokens as a 1px-plus-3px ring on components like Tab and Dropdown, while React v9's shared `createFocusOutlineStyle` utility defaults to a single-token 2px pseudo-border. Re-open the token source before citing an exact geometry, since it differs by layer and by component.
- **The AAA corner-geometry formula is documented but rarely used.** No system checked here runs the exact area calculation per component; all oversize instead. Worth confirming this is still the norm if a stricter reviewer asks for the calculation.
- **`contrast-color()` and `light-dark()` reached Baseline newly-available status in 2026** across Chromium, Firefox and Safari. Watch for systems starting to compute a two-colour ring's inner band from the outer one, or from `color-scheme`, instead of shipping a hand-picked token pair.
- **WCAG 3.0 published a working draft in March 2026** with a Focus Appearance outcome and a Focus Not Obscured pair, but the specification is still in Developing status, cited by no legislation, and not expected to finalise before 2028. Nothing in this guide should be built against it yet.
- **EN 301 549 v4.1.1**, incorporating WCAG 2.2, was expected during 2026 and is what makes 2.2 binding for the European Accessibility Act. Confirm whether it has published before relying on the timing.
- **GOV.UK ran a colour-palette audit in late 2025** (tints/shades naming, Turquoise renamed to Teal) that was still being discussed on their public tracker as of this research. It targets the wider palette rather than the focus colours specifically, but re-check `$govuk-colour-yellow` and the focus function names if you cite them after this date.
- **Figma still cannot make effects into variables**, and still cannot derive one variable from another natively; third-party plugins that add formula relationships exist but are not part of the product. Both were open feature requests as of April 2026. Re-check, since either would remove a workaround this guide recommends.
- **Almost no system publishes user testing of its focus styles.** GOV.UK's research-driven redesign is the notable exception and NHS.UK's adoption of it the notable second-hand case. That absence is worth remembering whenever any focus pattern, including the ones recommended here, is presented as settled. The evidence in this guide is overwhelmingly about conformance and maintenance cost, not measured user outcomes. The two-tier keyboard approach in section 2 is the weakest-evidenced recommendation in the document: it rests on reasoning about input methods, and no study was found testing whether users benefit from mouse focus and keyboard focus looking different.

---

## Sources

**Primary: specifications and standards**

- [W3C, Understanding SC 2.4.13 Focus Appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html). The AAA area formula, the change-contrast requirement, and the exceptions.
- [W3C, Understanding SC 2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html). The AA requirement that an indicator exists.
- [W3C, Understanding SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html). The 3:1 adjacent-colour requirement and the no-rounding note.
- [W3C, Understanding SC 2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum). The partial-obscuring allowance and its relationship to the AAA Enhanced criterion.
- [W3C, Technique C40: Creating a two-color focus indicator](https://www.w3.org/WAI/WCAG22/Techniques/css/C40). The 9:1 between-colour requirement, the at-least-2px-per-band requirement, the solid-background limitation, and the forced-colors note about box-shadow.
- [W3C WCAG GitHub, Issue #2706](https://github.com/w3c/wcag/issues/2706). Draft feedback on "Success Criterion 2.4.11 Focus Appearance (Level AA)," dated October 2022, confirming the pre-renumbering draft state.
- [MDN, `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) and [`outline`](https://developer.mozilla.org/en-US/docs/Web/CSS/outline). Current support, and outline following `border-radius` since 2023.

**Primary: design systems**

- [GOV.UK Design System, Understanding focus state styles](https://design-system.service.gov.uk/get-started/focus-states). The yellow and black compound indicator, the `govuk-functional-colour` functions, and its stated rationale.
- [GOV.UK Frontend PR #1309](https://github.com/alphagov/govuk-frontend/pull/1309) and [PR #1316](https://github.com/alphagov/govuk-frontend/pull/1316). The 2019 redesign of links and of radios/checkboxes.
- [GOV.UK Frontend PR #1870](https://github.com/alphagov/govuk-frontend/pull/1870). The 2.75:1 measurement and the fix in section 8.
- [GOV.UK Frontend v4.0.0](https://github.com/alphagov/govuk-frontend/releases/tag/v4.0.0). Where the deprecated error-border setting was removed.
- [GOV.UK design notes, *We've made the GOV.UK Design System more accessible*](https://designnotes.blog.gov.uk/2019/07/29/weve-made-the-gov-uk-design-system-more-accessible/). The redesign in the team's own words.
- [GOV.UK Design System Discussion #5048](https://github.com/alphagov/govuk-design-system/discussions/5048). The late-2025 colour-palette audit; see section 12.
- [UK Parliament Design System, Focus state](https://designsystem.parliament.uk/foundations/focus-state/). Two 2px rings in black and mint, the rationale, the border-recolour permission, and the removed text decoration.
- [Red Hat Design System, Focus indicators](https://ux.redhat.com/foundations/interactions/focus-indicators/). The 3px outline with 3px offset, the light and dark tokens, and the stated reason for one thickness everywhere.
- [Atlassian Design System, Border foundation](https://atlassian.design/foundations/border). `border.width.focused` at 2px and its pairing with `color.border.focused`.
- [Atlassian Design System, `llms-tokens.txt`](https://atlassian.design/llms-tokens.txt). The `#0C66E4`/`#85B8FF` colour values and the documented 2px `outlineOffset` usage.
- [Adobe `spectrum-design-data`, `layout.json`](https://github.com/adobe/spectrum-design-data/blob/main/packages/tokens/src/layout.json). `focus-indicator-thickness` and `focus-indicator-gap`, both 2px.
- [Adobe `spectrum-design-data`, `button.json`](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data/components/button.json). `focus-indicator-color`, `static-white-focus-indicator-color` and `static-black-focus-indicator-color` in context.
- [IBM Carbon, `packages/themes/src/v10/white.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/themes/src/v10/white.ts) and [`g100.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/themes/src/v10/g100.ts). `focus` as `blue60` in the light theme and `white` in the dark theme.
- [Material Web, focus ring documentation](https://github.com/material-components/material-web/blob/main/docs/components/focus-ring.md). `--md-focus-ring-width` at 3px and `--md-focus-ring-active-width` at 4px.
- [GitHub Primer CSS PR #1744](https://github.com/primer/css/pull/1744). The move to `outline`, the element-specific offsets, and the forced-colors rationale.
- [Microsoft `fluentui`, `packages/tokens/src/alias/lightColor.ts`](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/alias/lightColor.ts), [`darkColor.ts`](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/alias/darkColor.ts) and [`highContrastColor.ts`](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/alias/highContrastColor.ts). `colorStrokeFocus1`/`colorStrokeFocus2` values across themes.
- [Microsoft `fluentui`, `packages/web-components/src/tab/tab.styles.ts`](https://github.com/microsoft/fluentui/blob/master/packages/web-components/src/tab/tab.styles.ts). The paired outline-plus-box-shadow usage.
- [Microsoft `fluentui`, `createFocusOutlineStyle.ts`](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-tabster/src/focus/createFocusOutlineStyle.ts). React v9's default focus utility, its hardcoded 2px width, and the forced-colors override.
- [Microsoft `fluentui`, Focus indicator accessibility doc](https://github.com/microsoft/fluentui/blob/master/apps/public-docsite-v9/src/Concepts/Accessibility/FocusIndicator.mdx). `createFocusOutlineStyle` and `createCustomFocusIndicatorStyle`, including the Link double-underline example.
- [Ant Design issue #21389, outline or box-shadow on focus](https://github.com/ant-design/ant-design/issues/21389). Ant's own public argument about the implementation choice.
- [Deque, *How To Design Useful and Usable Focus Indicators*](https://www.deque.com/blog/give-site-focus-tips-designing-usable-focus-indicators/). Cauldron's own purple outline, the field-glow treatment, and the error-to-glow transition.
- [Figma Help Center, Apply variables to designs](https://help.figma.com/hc/en-us/articles/15339657135383), and the December 2023 release notes covering variable binding to effect and stroke properties.

**Commentary, labelled as such in the text**

- [Sara Soueidan, *A guide to designing accessible, WCAG-conformant focus indicators*](https://www.sarasoueidan.com/blog/focus-indicators/). The clearest writeup of the border-recolour change-contrast trap.
- [Dave House, *Focusing on focus states*](https://iknowdavehouse.medium.com/focusing-on-focus-states-7c64089d805c). The transitional-versus-retained framing in section 2, the two-tier proposal and its condition, the transparent-outline point, and the transparent-border input pattern in section 6.
- [Dave Hunter, *Making the NHS.UK focus state accessible (with help from GOV.UK)*](https://medium.com/@dave_hunter_/making-the-nhs-uk-focus-state-accessible-with-help-from-gov-uk-8989cab3ec7d). The NHS adoption and why their prior yellow failed.

**Cited but not resolved to a URL**

These carry claims whose sources were not opened directly in this pass.

- Bootstrap's default focus `box-shadow` value (roughly `0.2rem`, 25% opacity blue), described in section 7 from search results rather than the source Sass, and version-dependent.
- The exact hex value of UK Parliament's "mint" focus colour; the page returned a 403 on direct fetch and the description is qualitative only.
- Ant Design's `controlOutline`/`controlOutlineWidth` token wiring into specific input and button focus styles, confirmed as real tokens but not traced component-by-component.
- Figma's component properties and variants guidance, cited in section 9 from Figma's help centre rather than a single resolved article.
- The status of effects-as-variables in Figma, described as an open feature request as of April 2026 from the community forum rather than an official roadmap statement.
