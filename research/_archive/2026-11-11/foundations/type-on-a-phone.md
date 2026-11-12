# Type on a phone

What should change about a type scale when the screen narrows to a phone, where the phone sizes can come from, and one product's scale worked through from desktop to mobile.

Researched November 2026. Mobile sizes and gaps were read from source: GOV.UK Frontend 6.6 (`_typography-responsive.scss`, `_spacing.scss` and the changelog), Carbon's `@carbon/type` (`styles.ts`, `fluid.ts`) and `@carbon/layout` breakpoints, Shopify Polaris 13.9 compiled CSS and its `p-theme-light-mobile` tokens, `tailwindcss-typography`, `@adobe/spectrum-tokens` 15.6, `@fluentui/tokens`, Material Web's tokens, Apple's Human Interface Guidelines data file (the Dynamic Type tables), `@primer/primitives` and `@primer/css`, Radix Themes 3, Bootstrap 5.3.3 and the Utopia calculator. Phone headings on reading sites (GOV.UK, Wikipedia, Medium, Smashing Magazine, the Guardian, Substack, MDN, GitHub Docs) were measured at 375px in headless Chrome with an iPhone user agent. Characters per line are the toolkit's own measurement from the Inter 4.1 font file. Re-checked in November 2026: GOV.UK Frontend's latest release is 6.6.0 (15 October 2026), and no release since 6.0 has changed the type scale, so the mobile values below hold; the source's "consider deprecating" comment on point 27 is still the only sign of a further change. This piece was split out of a longer guide on type for UI and content; the scale itself is in [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), and the prose gaps in [space between prose elements](space-between-prose-elements.md). The toolkit's rules on fluid type are in `~/Projects/toolkit/knowledge/code/responsive.md#fluid-type`.

---

## What this answers

The thesis: on a phone, body text and other small sizes hold; headings and display come down, to about 1.6 times the body for a page title; gaps tied to the body hold and gaps tied to headings shrink with them. Where the smaller sizes come from is a real choice. A third of the systems read take them from the desktop list, each heading taking the next style's size; a third set their own phone values; a quarter go fluid. Staying on the list keeps one set of styles, and nothing in the evidence argues against it.

- What do shipping systems do to body text and headings on a phone?
- Why does small text hold while large text compresses?
- Stepped sizes or fluid `clamp()`, and what does zoom do to each?
- Where do the phone heading sizes come from?
- Should body text shrink?
- Should the space between prose elements shrink?
- How does line height change when headings shrink?
- What does that look like applied to one real scale?

Section 7 is the worked example, section 8 the cheat sheet and section 9 the short version.

---

## 1. What do the systems do on a phone?

**The short answer.** None of them makes reading text smaller on a phone than on a desktop, except Tailwind's default modifier pattern and GOV.UK's old scale, which GOV.UK abandoned. Headings come down in the web systems that adapt at all; platform scales for touch devices make everything larger.

| System | Body on a phone | Headings on a phone | Mechanism |
|---|---|---|---|
| GOV.UK 6 | 19 holds (was 16 until 6.0) | 48 → 32, 36 → 27, 27 and 24 → 21, 80 → 53 | stepped, one breakpoint at 641px |
| Carbon | `body-02` 16 holds (Fixed) | `fluid-heading-05` 32 at 320px rising to 60 at 1584px | piecewise linear, rem plus vw, between five breakpoints |
| Polaris (web) | holds | `headingXl` 20 → 24, `heading2xl` 24 → 30, `heading3xl` 30 → 36 from 48em | stepped, one breakpoint |
| Polaris (`p-theme-light-mobile`) | larger: `body-md` 13 → 16, `body-lg` 14 → 18 | smaller or level: `heading-lg` 20 → 18, `heading-xl` 24 → 22, `heading-2xl` 30 → 32 | a theme for the mobile app |
| Tailwind Typography | `prose` 16 → `md:prose-lg` 18 | all headings and gaps scale with the body in em | stepped, author applies modifiers |
| USWDS | holds | hold | none |
| Material 3 | holds | hold | none in the tokens; Android's user font scale |
| Atlassian | holds | hold | none documented |
| Radix Themes | holds | hold unless the author passes a responsive `size` | per-prop responsive objects |
| Apple | 17pt default on iPhone, 13pt on Mac | user-controlled: Dynamic Type | user setting, not viewport |
| Spectrum | larger: 14 → 17 | larger: 28 → 34, 36 → 44 | touch "mobile" scale, about 1.2× |
| Fluent 2 | larger: 14 (web) → 16 (Android), 17 (iOS) | per platform ramp | platform, not viewport |

The rows that make text larger look like a contradiction and are not. Spectrum's "mobile" and Fluent's iOS ramp answer a different question: how big should type be on a device held at 30cm and driven by touch? Bigger, they say, and so does Apple, whose iPhone default body is 17pt against the Mac's 13. The rows above them answer the web's question: how should one page adapt when its viewport narrows? Both questions resolve the same way for body text.

**What to do.** Read the platform rows as evidence about body size and the web rows as evidence about headings. Both say body text does not get smaller on a phone.

### Where do the phone heading sizes come from?

The systems that shrink headings split three ways, and none of the three is the majority.

| Answer | Systems | What they do |
|---|---|---|
| The desktop list | Polaris web, Polaris's mobile theme, Primer's primitives, Radix | Each heading takes the next style's desktop size: Polaris's Xl 24 → 20, 2xl 30 → 24, 3xl 36 → 30; Primer's tokens say to use Title (large) for Display and Title (medium) for Title (large) on narrow viewports; Radix leaves the lower step to the author. |
| Their own values | GOV.UK, Spectrum, Fluent, Tailwind prose, Primer's legacy CSS | GOV.UK's 48 → 32 and 24 → 21 land on sizes its desktop list does not have; Primer's old `-mobile` sizes include 26, 22 and 18. |
| Fluid | Carbon, Bootstrap's RFS, Utopia | A size for every width. Carbon's anchors are steps of its one scale; Bootstrap's and Utopia's are not. |

Staying on the list has two costs, both visible in the sources. The top of a geometric scale is coarse, so a step down is a big jump (on a 1.125 scale, 48 → 36 → 28 are ratios of 1.33 and 1.29). And stepping down can land two levels on one size, which GOV.UK does with its own values anyway (27 and 24 both become 21). The benefit is the one the other answers give up: a phone mode that only re-points styles that already exist, so Figma and the stylesheet carry one list.

---

## 2. Why does small text hold while large text compresses?

**The short answer.** Because every system that has measured or reasoned about it, from GOV.UK to Apple's Dynamic Type and Android 14, protects the bottom of the scale and compresses the top when text takes up more of the available width, and a phone is exactly that situation.

GOV.UK's history is the clearest case. Until version 6, its scale shrank everything on small screens: point 19, the body size, rendered at 16px on phones; point 16 at 14; point 14 at 12. In December 2022 the team announced the change, citing service teams' findings that shrinking small text on small screens harms visually impaired users, and the British Dyslexia Association's advice not to go below the equivalent of 16px. Version 5.2 shipped the new scale behind a feature flag in 2024; version 6.0 made it the default and removed point 14 entirely. Today 16 and 19 hold at every width. The large sizes still shrink, and the team's post says why that is fine: large text getting smaller on a small screen does not harm readability and may help it. One source comment in the new map is telling: point 27 is now the same as point 24 on mobile, marked "consider deprecating this size". Compressing a scale's top end makes neighbouring steps collide, and the honest response is to notice (what that does to value-literal names is in [naming text styles](naming-text-styles.md#2-what-words-should-name-the-size)).

The platforms that let readers resize text arrived at the same shape from the opposite direction. Apple's Dynamic Type tables show what happens when the reader asks for larger text: at the default size Body is 17pt and Large Title 34pt, a ratio of 2.0; at the largest accessibility size Body is 53pt and Large Title 60pt, a ratio of 1.13. Small text grows a great deal and large text a little. Android 14 builds the same behaviour into the system: font scaling reaches 200% along a nonlinear curve, so large text scales more slowly than small text. Polaris's mobile theme does it in tokens: body rises from 13 to 16 while the large headings fall by 2px, so the largest heading goes from 2.3 times the body to 2.0.

Carbon's Fixed styles (all body and label text) against its Fluid styles (only editorial headings and display) say the same thing structurally, and Pimp my Type's guidance lands there too: keep body near the browser default on phones, keep an h1 at about twice the body or less, and let desktop headings climb to four times it.

**What to do.** Hold every size up to the largest body or UI heading size; bring headings and display down. The pattern has three independent origins (a public-sector accessibility reversal, two mobile platforms' text scaling, and Carbon's structure), which makes it the strongest-evidenced claim in this piece.

---

## 3. Stepped or fluid, and what does zoom do to each?

**The short answer.** Both work. Stepped rem sizes at one breakpoint are the simplest; a fluid `clamp()` works provided its floor is in rem and no size shrinks below about 0.4 of its maximum, which keeps WCAG's 200% zoom reachable.

Two mechanisms ship. Stepped sizes change at a breakpoint: GOV.UK's map has a `null` (mobile) entry and a `tablet` entry for each point and emits a media query between them. Fluid sizes interpolate with viewport width. Carbon's `fluid()` helper writes, for each pair of adjacent breakpoints, `calc(min + (max − min) × ((100vw − minWidth) / (maxWidth − minWidth)))`, so `fluid-heading-05` climbs from 32 at 320px through 36, 42 and 48 to 60 at 1584px. Utopia generalises the idea: define one scale at a small viewport and another at a large one, with a gentler ratio at the small end (its own example uses 1.2 and 1.333), and let `clamp()` interpolate every step between them. Its calculator opens on an 18px base at 360px and 20px at 1240px, so even its body grows slightly.

Fluid type buys freedom from breakpoint decisions and a scale that never jumps. It costs readability of the stylesheet (a `clamp()` with a vw term cannot be read as a size) and, more seriously, it can interfere with zoom.

The mechanism is worth walking through, because the commonly repeated rule is incomplete. WCAG 1.4.4 Resize Text requires that text can be enlarged to 200%. Browser zoom enlarges the CSS pixel, which also shrinks the viewport measured in CSS pixels. A rem or px size doubles in rendered size at 200% zoom. A vw size does not grow at all: at 200% the viewport is half as many CSS pixels wide, so 3vw is half as many CSS pixels, each rendered twice as large. WCAG's failure technique F94 names text sized primarily in viewport units as a failure for exactly this reason.

A `clamp(1.75rem, 1rem + 3vw, 3rem)` heading in a 1280px window shows what happens with a mix. At 100% the preferred value is 16 + 38.4 = 54.4px, clamped to 48. At 200% zoom the CSS viewport is 640px wide, the preferred value is 16 + 19.2 = 35.2 CSS pixels, rendered at 70.4 device pixels: 1.47 times the original, short of 2. The rem part doubled; the vw part did not.

Stepped sizes do something similar. Zooming a 1280px window to 200% gives a 640px CSS viewport, which crosses GOV.UK's tablet breakpoint and swaps the 48px heading for its 32px mobile size: 64 device pixels, 1.33 times the original. WCAG's understanding document anticipates this and allows it: a page passes if 200% enlargement can be reached in some way, even if crossing a breakpoint means it takes more than 200% zoom to get there. Browsers zoom to 500%, which gives the practical bound: a size that never shrinks below 0.4 of its largest value can always be brought to twice that value. Both of GOV.UK's heading shrinks (0.67) and Carbon's (32 against 60, 0.53) clear it comfortably; a display size that falls from 120 to 32 would not.

The toolkit's fluid-type rule reaches the same number from commentary: keep the largest size within about 2.5 times the smallest (Smashing's analysis of fluid type and accessibility), which is the same bound as 0.4, derived independently. The toolkit adds a sourcing rule tested on its own builds: fluid sizes interpolate only between values the design file holds. If a design has only desktop sizes, ask for a Mobile mode in the file; sizes invented in Sass have no record in the source and the next token build cannot reproduce them. Where text styles carry Desktop and Mobile modes, the build switches them at a breakpoint, and a clamp between the two is a project's written ruling (`~/Projects/toolkit/knowledge/code/responsive.md#fluid-type`).

**What to do.** Default to stepped rem sizes at one breakpoint, from a Mobile mode in the design file. Use `clamp()` only by decision, with a rem floor, a rem term in the preferred value, and no size whose minimum is below 0.4 of its maximum. Body text that holds avoids the question entirely, which is one more reason to hold it.

---

## 4. Should body text shrink?

**The short answer.** No, on the current evidence. The only user-outcome argument in this area points one way, and the platform defaults agree.

GOV.UK reversed its shrink on the strength of service teams' accessibility findings and the BDA's 16px floor. The platform evidence agrees from a different angle, putting phone body text at 16 to 17 even where desktop text is 13 or 14. Against it there is mostly convention: Tailwind's `prose md:prose-lg` pattern makes the default body 16 and the larger one a desktop enhancement, and Zell Liew's specimen steps body from 16 to 18 to 20 as the screen widens. Both start at 16, which no source considers too small; the disagreement is only about whether a desktop reading size above 16 should come down on a phone.

The cost of holding a larger body is line length. Inter at 18px in a 343px column (a 375px phone with 16px gutters) sets about 41 characters per line, measured on an English sample paragraph from the font's own advance widths; at 16px the same column holds about 47. Butterick's lower bound is 45. Apple's 17pt default body on an iPhone sits in the same range as 18px Inter, which is evidence that a short line on a phone is tolerated where a long one on a desktop is not: the eye's return sweep is short, and Pimp my Type notes that narrow columns are forgiving.

**What to do.** Hold body text. A desktop reading size of 18 can hold too, at the cost of about 41 characters a line on a 375px phone, which the platforms' own defaults show is tolerable.

---

## 5. Does the space between prose elements shrink?

**The short answer.** The large gaps do; the small ones hold. A gap tied to the body (paragraph, list item) holds when the body holds; a gap tied to a heading shrinks with the heading.

GOV.UK's responsive spacing scale is the one primary source that encodes it: units 1 to 3 (5, 10 and 15px) are identical at every width, while unit 4 drops from 20 to 15, unit 6 from 30 to 20, unit 8 from 50 to 30 and unit 9 from 60 to 40. Applied to its prose, a paragraph gap falls from 20 to 15, the space above a large heading from 40 to 30 and below it from 30 to 20. The heading gaps shrink by a quarter to a third, the same proportion as the headings themselves.

Tailwind's prose presets scale every gap in em with the body, so moving from `prose-lg` to `prose` shrinks all of them by about the body's own ratio (the paragraph gap from 24 to 20, the h2 from 56 above and 32 below to 48 and 24). USWDS's em-based gaps hold because its sizes hold. What must not shrink is the ordering from [space between prose elements](space-between-prose-elements.md#1-where-does-the-space-between-prose-elements-come-from): on a phone, every heading's space above still has to clearly exceed the paragraph gap.

**What to do.** Hold the paragraph and list gaps, shrink heading gaps in proportion to the headings, and check the ordering still holds at the smallest width. In Figma this is a Mobile mode on the spacing collection.

---

## 6. How does line height change when headings shrink?

**The short answer.** Very little, when it is set by role. A heading value of about 1.2 covers the whole range. No system read tightens heading line height for narrow screens because headings wrap there; when the ratio moves at all, it rises slightly as the size falls. A heading that looks loose on a phone is usually too big, not too loosely leaded.

GOV.UK's ratios barely move: the 48 point is 35/32 (1.09) on mobile and 50/48 (1.04) on desktop; the 36 point is 1.11 at both widths. Carbon's fluid headings run the other way, from 1.25 at 32px to 1.17 at 48px. Both are inside the 1.1 to 1.25 heading band, and both reflect the same physics: a smaller heading wants a slightly larger ratio.

The other systems agree. Radix sets line height in pixels per step, so its ratio loosens as it steps down (35/40 is 1.14, 20/26 is 1.30); Tailwind's prose h1 goes from 48/48 to 36/40; Primer's Display at 40 is 1.375 and the Title (medium) that replaces it on narrow screens is 1.5. Spectrum, Bootstrap and USWDS keep one ratio. The only tightening is Polaris's (Xl 24/32 to 20/24, and two steps in its mobile theme), with no reason given. Reading sites hold too: Smashing Magazine sets its title at 1.2 on desktop and phone, the Guardian at 1.15, GOV.UK at 1.11; Medium alone tightens, from 1.24 to 1.19.

A heading that fits on one line at 1280px runs to three lines at 375px, and a line height that looked fine on one line can make a wrapped heading read as separate lines. Pimp my Type's specimen shows a wrapped heading at 1.3 falling apart and the same heading at 1.1 holding together; checking headings at their longest realistic length on the narrowest screen is the test. Body line height is the other candidate for change: Pimp my Type puts mobile body at 1.3 to 1.45 and desktop at 1.5 to 1.6, because shorter lines need less leading, while also calling a single 1.5 an acceptable compromise. A product that holds one body line height gives up a small optimisation and keeps one fewer mode.

**What to do.** Keep line heights by role across widths, and test every heading level at its longest realistic text on a 375px screen. If a wrapped heading looks too loose, try the next size down before a tighter line height.

---

## 7. A worked example: one scale, desktop to phone

**The short answer.** One product's scale, read against the evidence above, with the two places the evidence pushes back and its mobile adaptation. Every value is that project's decision, stated as such, not a rule.

### The decisions

The project landed on a 1.125 ratio from 16 (16 × 1.125ⁿ), rounded to ten sizes: 12, 14, 16, 18, 20, 22, 28, 36, 48 and 72. The formula gives 46 and 74 at the top; 48 and 72 are its two named exceptions. The scale sets size only; line height and weight come from the role. The sizes give thirteen text styles, named sm/md/lg in the design file and in code alike (`label-sm`, `body-lg`, `heading-2xs`), with a bold Heading 2xs sharing 18 with Body lg and Code and Label lg sharing 16 with Body md:

| Style | Size | Line height | Weight | Face | Tracking |
|---|---|---|---|---|---|
| Label sm | 12 | 120% | 500 | Inter | 0 |
| Label md | 14 | 120% | 500 | Inter | −0.5% |
| Label lg | 16 | 120% | 500 | Inter | −1% |
| Body md | 16 | 150% | 400 | Inter | −1% |
| Body lg | 18 | 150% | 400 | Inter | −1.5% |
| Heading 2xs | 18 | 120% | 600 | Inter | −1.5% |
| Heading xs | 20 | 120% | 600 | Inter | −2% |
| Heading sm | 22 | 120% | 600 | Inter | −2% |
| Heading md | 28 | 120% | 600 | Inter Display | 0 |
| Heading lg | 36 | 120% | 600 | Inter Display | −2% |
| Heading xl | 48 | 110% | 600 | Inter Display | −2% |
| Display | 72 | 110% | 500 | Inter Display | −2% |
| Code | 16 | 150% | 400 | JetBrains Mono | 0 |

Line height is set by role: text and code 150%, labels and headings 120% (Heading xl 110%), display 110%. Weights are labels and display 500, headings 600, text 400, which is Primer's set of three. Labels keep the 500 and the tight leading of the components they sit in, because they are the style components use most, and a change there moves every button and field. Inter is used below 28px and Inter Display from 28px, both as static files, so Figma and the browser draw the same glyphs ([why](one-type-scale-for-ui-and-content.md#5-what-do-tracking-and-optical-sizes-do-once-a-face-has-a-display-cut)). The text-cut tracking values are Inter 3's withdrawn dynamic-metrics curve rounded to half a percent (it gives +0.05% at 12, −0.6% at 14, −1.1% at 16, −1.4% at 18, −1.7% at 20 and −1.8% at 22), a sound starting point that can be stated and kept.

Long-form content uses Body lg at 18 on a 720px measure. Each h2 opens a section that carries a hairline as its top border and 40px of padding top and bottom, with no gap between sections and none below the last; the space lives in the section, not between them. Inside it, every element carries its own space above: 16 under the h2, 24 between paragraphs, 8 between list items, h3 40 above and 12 below, h4 32 above and 8 below. The content headings follow reading sites rather than the scale's stride: h4 Heading 2xs at 18, the body size in bold; h3 Heading sm at 22; h2 Heading md at 28; the page title Heading xl at 48. Tailwind's 18px prose sets 48, 30, 24 and 18; GitHub's markdown sets h2 at 1.5 times the body, h3 at 1.25 and h4 at 1; GOV.UK's 19px body has 48, 36, 24 and 19. Code blocks are 16 on 150% in JetBrains Mono, one step below the body, padded 16 by 20 with a 12px radius; inline code runs at 1em with a tint that exists only in code.

Most of this sits inside the evidence. The single scale with a content stride is consensus. Every heading gap above exceeds the 24 paragraph gap, and the h2's 40 above (80 from the text before it, counting the previous section's bottom padding) and 16 below sits near USWDS's 48 and 16. Weights, faces and the inline code size follow the evidence as well.

### Where the evidence pushes back

**The measure is too wide for the body.** At 18px, Inter sets about 87 characters on a 720px line, measured from the font's advance widths before tracking (the −1.5% tracking adds one or two). That is past WCAG 1.4.8's 80-character limit, past the toolkit's 65 to 75 target, and near the top of Butterick's 45 to 90. A measure of 600 to 640px (about 73 to 77 characters) or `max-inline-size: 36em` fits without touching the type ([measure](space-between-prose-elements.md#4-how-wide-should-the-column-be)). If the 720px is the column including padding, the text box inside it is what to measure.

**Two first drafts were corrected by the evidence.** Code blocks started at 14, two steps below the body, where GitHub uses 85% of the body and Tailwind's 18px preset 16; the project moved them to 16 (the cost is columns: a 720px block holds about 70 at 16 against 80 at 14). And the content headings first walked every other step of the scale (h2 at 36, h3 at 28, h4 at 22), which put the h2 at twice the body, above every reading site measured; they moved to the reading-site ratios above.

Two smaller points are judgment rather than contradiction. Switching to the full display cut at 28 is slightly earlier than Inter's own axis implies (the variable font reaches its full display drawing only at 32), which is harmless but means the 28 is a bit tighter than `font-optical-sizing: auto` would draw it. And −2% on Inter Display from 36 adds tracking to a cut that is already tighter; Apple's table moves its display sizes the other way, so the 36 and 48 sizes deserve an eye check against a 0% version before the value is locked.

### The mobile adaptation

Below the project's small breakpoint (about 40rem, 640px), body and UI sizes hold, and each content heading drops to a lower size on the same list. Face and tracking follow the rendered size, because the project switches cut at 28 and sets tracking per size, so they become mode values too. The page title was first proposed at 36 and looked too big: a long job title ran to three lines at 2.0 times the body. Reading sites measured at 375px set it at 27 to 32, 1.6 to 1.9 times their body, so it moved to 28.

| Site at 375px | Body | Page title / line height | Title ÷ body |
|---|---|---|---|
| GOV.UK | 19 | 32 / 1.09 (heading-xl), 27 / 1.11 (heading-l) | 1.68, 1.42 |
| Wikipedia | 16 | 27.2 / 1.375 (serif) | 1.70 |
| Medium | 18 | 32 / 1.19 | 1.78 |
| Smashing Magazine | 19.8 | 32 / 1.20 | 1.62 |
| The Guardian | 17 | 28 / 1.15 | 1.65 |
| Substack | 17 | 32 / 1.125 | 1.88 |
| MDN, GitHub Docs | 16 | 40 / 1.25, 40 / 1.20, as on desktop | 2.5, with short titles |

| Style or gap | Desktop | Mobile | Evidence |
|---|---|---|---|
| Display | 72 / 110%, Inter Display, −2% | 36 / 110%, Inter Display, −2%, a size already on the list | GOV.UK 80 → 53 (0.66); Carbon display from 76 down to 42 |
| Heading lg | 36 / 120% | 28 / 120%, Inter Display, 0 | one step down, as Polaris's 36 → 30 |
| Page title | Heading xl, 48 / 110% | Heading md, 28 / 120%, Inter Display, 0 | reading sites 27 to 32 (table above); GOV.UK 48 → 32 |
| h2 | Heading md, 28 | Heading sm, 22, Inter, −2% | GOV.UK 36 → 27 and 27 → 21; Polaris 30 → 24 |
| h3 | Heading sm, 22 | Heading xs, 20, Inter, −2% | Polaris 24 → 20; GOV.UK 24 → 21 |
| h4 | Heading 2xs, 18 | unchanged | the body size in bold, as on desktop |
| Body lg, Body md, Labels, Code | 18, 16, 16 to 12, 16 | unchanged | GOV.UK 16 and 19 hold; Apple, Spectrum and Fluent go larger, never smaller |
| Line heights | 150 / 120 / 110% | unchanged; the phone title takes Heading md's 120% | set by role (section 6) |
| Paragraph gap | 24 | 24 | tied to the body, which holds |
| List item gap | 8 | 8 | GOV.UK's small units hold |
| Section padding | 40 top and bottom, hairline inside | 32 top and bottom | GOV.UK heading gaps shrink by a quarter to a third |
| h3 and h4 above / below | 40 / 12 and 32 / 8 | unchanged | both still exceed the 24 paragraph gap |
| Code block padding (proposed) | 16 × 20 | 16 × 16 | gives back 8px of a short line; radius stays 12 |
| Measure | 720px (see above) | the column: viewport less 16px gutters | Body lg sets about 41 characters at 375px wide |

Two consequences need writing down with the table. On a phone the h3 (20) and h4 (18) are one step apart and the h4 is the body size, so the h4 is told from a paragraph by weight alone, as USWDS's h4 is. The h3 and h4 gaps hold on a phone while the section padding drops to 32, so an h3 that follows a paragraph sits further from it than an h2 sits from its hairline; the hairline, not the gap, is what marks the h2. The largest shrink in the table is the page title's 0.58, inside the 0.4 bound from section 3, so the stepped switch passes WCAG 1.4.4 at any breakpoint the zoom crosses.

**What to do.** Treat the sizes as settled and the measure as open, and adopt the mobile column as one mode on the text-style and spacing tokens, drawn in the design file and switched at one breakpoint in rem. The phone sizes and gaps are the project's decisions; the code block padding marked "proposed" is this piece's.

---

## 8. Cheat sheet

| Decision | Do | Do not |
|---|---|---|
| Body and UI sizes | hold up to the largest UI heading | body text smaller than on desktop |
| Headings | come down, the page title to about 1.6× the body | one factor applied to every size; a phone title at 2× the body |
| Where phone sizes come from | lower steps of the desktop list, or a named exception | a second list nobody draws in Figma |
| Colliding steps | check no two heading levels land on one size | let 24 and 27 both become 21 unnoticed |
| Mechanism | rem at a breakpoint, from a Mobile mode in the design file | sizes invented in Sass |
| Fluid | `clamp()` by ruling, rem floor, minimum at least 0.4 of maximum | text sized mainly in `vw` |
| Gaps | heading gaps shrink with headings; paragraph and list gaps hold | every gap scaled by one factor |
| Line height | by role, unchanged; test wrapped headings at 375px | a phone-only heading line height to fix a heading that is too big |
| Measure | the column, about 41 characters at 18px on a 375px phone | a desktop measure carried over |

---

## 9. The short version

On a phone, body text and UI sizes hold: GOV.UK stopped shrinking its body on small screens on accessibility grounds, and Apple, Android, Spectrum and Fluent all make phone text larger, not smaller. Headings and display come down, the page title to about 1.6 times the body, so the gap between levels narrows, the way Dynamic Type and Android 14 compress large text. Taking the smaller sizes from the desktop list is one of three shipped answers and keeps a single set of styles. Check that no two heading levels collide on one size.

Gaps tied to the body hold; gaps tied to headings shrink with them, and every heading's space above still exceeds the paragraph gap. Line heights stay by role; the test is a wrapped heading on the narrowest screen.

Stepped rem sizes at one breakpoint, taken from a Mobile mode in the design file, are the simplest mechanism. Fluid `clamp()` works too, provided its floor is in rem and no size shrinks below about 0.4 of its maximum, the same bound as the toolkit's "within 2.5 times", which keeps WCAG's 200% zoom reachable. Write the mobile mode down as a table of style sizes and gaps: every system that got this right has reversed something along the way, GOV.UK included, and a table is what makes the next reversal cheap.

---

## 10. What to re-check later

- **GOV.UK's scale is the fastest-moving evidence here.** The source still marks point 27 for possible deprecation. Re-read `_typography-responsive.scss` before quoting its mobile values.
- **The 0.4 zoom bound** is this piece's derivation from WCAG's understanding text and browsers' 500% zoom limit, matched by the 2.5× rule in Smashing's commentary; it is not a WCAG rule. A stricter reading of 1.4.4 that requires 200% at 200% zoom would fail any breakpoint shrink, GOV.UK's included.
- **The worked example's style-to-size mapping** is read from its ten sizes and ten styles in order; if the project assigns them differently, the mobile table's rows move with it.
- **Unread sources.** The New York Times served no article to the headless browser, and Material 3's guidance for compact windows did not render; neither is in the tables.
- **Evidence quality.** The only user-outcome evidence here is GOV.UK's, and it rests on service teams' findings and BDA guidance rather than a published study. No system read publishes research comparing stepped with fluid type, or measuring whether heading gaps should shrink on phones.

---

## Sources

**Primary: system source, tokens and documentation**

- [GOV.UK Frontend, `_typography-responsive.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_typography-responsive.scss). Mobile and tablet sizes per point; the "consider deprecating" comment on 27.
- [GOV.UK Frontend, `_spacing.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_spacing.scss). Responsive spacing units.
- [GOV.UK Frontend changelog](https://github.com/alphagov/govuk-frontend/blob/main/CHANGELOG.md) and [releases](https://github.com/alphagov/govuk-frontend/releases). 5.2.0 feature flag, 6.0.0 default and removal of point 14; 6.6.0 the latest.
- [GOV.UK Design System, using the updated type scale](https://design-system.service.gov.uk/get-started/new-type-scale/) and [spacing](https://design-system.service.gov.uk/styles/spacing/).
- [GOV.UK design notes, making the typography scale more accessible (2022)](https://designnotes.blog.gov.uk/2022/12/12/making-the-gov-uk-frontend-typography-scale-more-accessible). The rationale and the BDA floor.
- [Carbon, `styles.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/styles.ts), [`fluid.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/fluid.ts) and [`@carbon/layout` breakpoints](https://github.com/carbon-design-system/carbon/blob/main/packages/layout/src/index.ts). 320, 672, 1056, 1312 and 1584px.
- [Shopify Polaris, compiled `styles.css`](https://cdn.jsdelivr.net/npm/@shopify/polaris/build/esm/styles.css) and [Polaris tokens CSS](https://cdn.jsdelivr.net/npm/@shopify/polaris-tokens/dist/css/styles.css). Heading sizes below and above 48em; the mobile theme.
- [Primer primitives, functional typography tokens](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/functional/typography/typography.css). The narrow-viewport substitutions: Title (large) for Display, Title (medium) for Title (large).
- [Tailwind Typography README](https://github.com/tailwindlabs/tailwindcss-typography/blob/main/README.md) and [`styles.js`](https://github.com/tailwindlabs/tailwindcss-typography/blob/main/src/styles.js). The `prose md:prose-lg` pattern.
- [Apple Human Interface Guidelines, Typography](https://developer.apple.com/design/human-interface-guidelines/typography). Default sizes per platform, Dynamic Type tables.
- [Android 14 features, non-linear font scaling](https://developer.android.com/about/versions/14/features#non-linear-font-scaling).
- [Adobe Spectrum tokens, `typography.json`](https://github.com/adobe/spectrum-tokens/blob/main/packages/tokens/src/typography.json). Desktop and mobile sizes.
- [Fluent 2, typography](https://fluent2.microsoft.design/typography). Per-platform ramps.
- [Radix Themes, breakpoints](https://www.radix-ui.com/themes/docs/theme/breakpoints).
- [Utopia, designing with fluid type scales](https://utopia.fyi/blog/designing-with-fluid-type-scales/).

**Standards**

- [WCAG 2.2 Understanding 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html). Reaching 200% "in some way".
- [WCAG 2.2 Technique F94](https://www.w3.org/WAI/WCAG22/Techniques/failures/F94). Viewport units as the primary text size.
- [WCAG 2.2 Understanding 1.4.8 Visual Presentation](https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html).

**Commentary: named type specialists**

- [Matthew Butterick, responsive web design](https://practicaltypography.com/responsive-web-design.html). 45 to 90 characters.
- [Oliver Schöndorfer (Pimp my Type), font size](https://pimpmytype.com/font-size/) and [line length and line height](https://pimpmytype.com/line-length-line-height/). Mobile body near the default, wrapped headings at 1.1.
- [Zell Liew, responsive typography](https://zellwk.com/blog/responsive-typography/).
- [Smashing, addressing accessibility concerns with fluid type](https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/). The 2.5× bound.

**Toolkit knowledge base and sister pieces**

- `~/Projects/toolkit/knowledge/code/responsive.md#fluid-type`. Rem terms, the 2.5× bound, modes from the design file.
- `~/Projects/toolkit/knowledge/ui/design/visual.md#type-for-ui-and-long-form-content`.
- [One type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), [space between prose elements](space-between-prose-elements.md), [naming text styles](naming-text-styles.md).
