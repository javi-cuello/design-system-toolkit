# Type on a phone

What a type scale should change on a phone, where the phone sizes come from, and one product's scale taken from desktop to phone.

A product's article page is drawn at desktop width: 18px body text, a 48px page title, headings stepping down a 1.125 scale. Then someone draws the phone frame. The first try at the page title, 36px, turns a long job title into three lines at the top of a 375px screen.

And nobody is sure what else should move. The body text, the gaps between paragraphs and the line heights all have a desktop value and no phone one.

---

## What this answers

- [Systems compared](#systems-compared): what the systems do on a phone
- [Phone heading sizes](#phone-heading-sizes): where phone heading sizes come from
- [Protecting small text](#protecting-small-text): why small text holds but headings shrink
- [Stepped or fluid sizes](#stepped-or-fluid-sizes): whether to step sizes or make them fluid
- [Zoom and shrinking type](#zoom-and-shrinking-type): what zoom does to shrinking type
- [Body text size](#body-text-size): whether body text should shrink
- [Prose gaps on a phone](#prose-gaps-on-a-phone): whether prose gaps shrink on a phone
- [Line height on a phone](#line-height-on-a-phone): whether line height changes on a phone
- [The worked example's scale](#the-worked-examples-scale): what scale the worked example uses
- [Pushback from the evidence](#pushback-from-the-evidence): where the evidence pushes back
- [The scale on a phone](#the-scale-on-a-phone): what that scale becomes on a phone

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs.

---

## Systems compared

None of them makes reading text smaller on a phone than on a desktop, except Tailwind's default modifier pattern and GOV.UK's old scale, which GOV.UK abandoned; headings come down in the web systems that adapt at all.

The first answers look contradictory. GOV.UK takes its 48px heading down to 32. Spectrum takes its body text up, from 14 to 17. Here is each system's phone behaviour, read from its own source, tokens or documentation.

| System | Body on a phone | Headings on a phone | Mechanism |
|---|---|---|---|
| GOV.UK 6 | 19 holds (was 16 until 6.0) | 48 → 32, 36 → 27, 27 and 24 → 21, 80 → 53 | stepped at 641px |
| Carbon | `body-02` 16 holds (Fixed) | `fluid-heading-05` 32 at 320px to 60 at 1584px | fluid, rem plus vw |
| Polaris (web) | holds | `headingXl` 24 → 20, `heading2xl` 30 → 24, `heading3xl` 36 → 30 | stepped at 48em |
| Polaris mobile theme | larger: `body-md` 13 → 16, `body-lg` 14 → 18 | smaller or level: `heading-lg` 20 → 18, `heading-xl` 24 → 22 | a theme for the app |
| Tailwind Typography | `prose` 16 → `md:prose-lg` 18 | scale with the body in em | modifiers |
| USWDS | holds | hold | none |
| Material 3 | holds | hold | Android's user font scale |
| Atlassian | holds | hold | none documented |
| Radix Themes | holds | hold unless the author passes a responsive `size` | per prop |
| Apple | 17pt on iPhone, 13pt on Mac | Dynamic Type | user setting |
| Spectrum | larger: 14 → 17 | larger: 28 → 34, 36 → 44 | touch scale, about 1.2× |
| Fluent 2 | larger: 14 (web) → 16 (Android), 17 (iOS) | per platform | platform |

The rows that make text larger answer a different question: how big should type be on a device held at 30cm and driven by touch? Bigger, say Spectrum, Fluent and Apple. The web rows answer how one page should adapt when its viewport narrows. The two questions give different answers for headings and the same one for body text.

Read the platform rows as your evidence about body size, and the web rows as your evidence about headings. **Both say body text doesn't get smaller on a phone.**

---

## Phone heading sizes

Phone heading sizes come from one of three places, none of them a majority: lower steps of the desktop list, phone values a system sets for itself, or a fluid size for every width.

The designer has decided the 48px title comes down. To what? 36 is already a style on the desktop list. 32 isn't, but it's what GOV.UK uses.

| Answer | Systems | What they do |
|---|---|---|
| The desktop list | Polaris (both), Primer's primitives, Radix | each heading takes the next style's size; Primer uses Title (large) for Display on narrow viewports |
| Their own values | GOV.UK, Spectrum, Fluent, Tailwind prose, Primer's legacy CSS | GOV.UK's 32 and 21 aren't on its desktop list |
| Fluid | Carbon, Bootstrap's RFS, Utopia | a size for every width; only Carbon's anchors are steps of its scale |

Staying on the list has two costs. The top of a geometric scale is coarse, so one step down is a big jump (48 → 36 → 28 on a 1.125 scale). And stepping down can land two levels on one size, as GOV.UK's 27 and 24 both become 21. The benefit is that a phone mode which only re-points existing styles keeps one list in Figma and the stylesheet, not two.

Take your phone heading sizes from lower steps of your desktop list, add a phone-only size only as a named exception, and check that no two heading levels land on the same size. **Staying on the list keeps one set of styles, and nothing in the evidence argues against it.** That makes it the default rather than the consensus, since the systems split three ways.

---

## Protecting small text

Small text holds and headings shrink because every system that has measured or reasoned about it, from GOV.UK to Apple's Dynamic Type and Android 14, protects the bottom of the scale and compresses the top when text takes up more of the available width, and a phone is exactly that situation.

GOV.UK's history is the clearest case. Until version 6 its scale shrank everything on small screens: the 19 body rendered at 16px on phones. In December 2022 [the team announced a change](https://designnotes.blog.gov.uk/2022/12/12/making-the-gov-uk-frontend-typography-scale-more-accessible): shrinking small text harms visually impaired users, and the British Dyslexia Association advises nothing below the equivalent of 16px. Version 6.0 made the new scale the default and removed point 14. Today 16 and 19 hold at every width, while the large sizes still shrink, which the post says doesn't harm readability.

The catch is that compressing the top makes neighbouring steps collide: GOV.UK's size map marks point 27, now equal to 24 on mobile, "consider deprecating this size". What a collision does to names that state a value is in [words for size](../foundations/naming-text-styles.md#words-for-size).

Platforms that let readers resize text reach the same shape from the other direction. At Apple's default Dynamic Type size, Body is 17pt and Large Title 34pt, a ratio of 2.0; at the largest accessibility size, 53 and 60, a ratio of 1.13. Android 14 scales fonts to 200% along a nonlinear curve, so large text grows more slowly. Carbon says it in structure: Fixed styles for body and labels, Fluid only for headings and display.

Hold every size up to your largest body or UI heading size, and bring headings and display down. **On a phone, protect the bottom of the scale and compress the top.** The pattern has three independent origins (a public-sector accessibility reversal, two mobile platforms' text scaling, and Carbon's structure), which makes it the best-evidenced claim in this guide.

---

## Stepped or fluid sizes

Both work: stepped rem sizes that switch at one breakpoint are the simplest, and a fluid `clamp()` works if it is built so zoom can still double the text.

The page title now has a desktop size and a phone size, and something has to decide which one a 700px window gets. Stepped sizes switch at a breakpoint: GOV.UK's size map has a mobile and a tablet entry per point, with a media query between them. Fluid sizes interpolate with the viewport: Carbon's `fluid()` helper writes a `calc()` with a `100vw` term for each pair of breakpoints, so `fluid-heading-05` climbs from 32 at 320px to 60 at 1584px. Utopia generalises it, with a gentler ratio at the small end.

Fluid type buys freedom from breakpoint decisions; it costs a stylesheet nobody can read as sizes, and it can interfere with zoom ([next section](#zoom-and-shrinking-type)).

The toolkit adds a sourcing rule, tested on its own builds: fluid sizes interpolate only between values the design file holds, because sizes invented in Sass have no record the next token build can reproduce (`knowledge/code/responsive.md#fluid-type`).

Default to stepped rem sizes at one breakpoint, taken from a Mobile mode in the design file; if the design has only desktop sizes, ask for a Mobile mode rather than inventing phone sizes in Sass. **Use `clamp()` by decision, never by default.**

---

## Zoom and shrinking type

Shrinking type can stop text from reaching twice its size, and the safe bound is that no size shrinks below about 0.4 of its largest value, with the floor and part of the preferred value in rem.

A page title is written as `clamp(1.75rem, 1rem + 3vw, 3rem)` in a 1280px window. A reader zooms to 200% and expects it twice as big. It comes out 1.47 times as big. Why?

[WCAG 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) requires that text can be enlarged to 200%. Browser zoom enlarges the CSS pixel, which also shrinks the viewport measured in CSS pixels. A rem size doubles; a vw size doesn't grow at all, which is why [WCAG's failure technique F94](https://www.w3.org/WAI/WCAG22/Techniques/failures/F94) names text sized primarily in viewport units. A `clamp()` mixes the two:

```
100% zoom, 1280px viewport
  preferred: 16 + 3% of 1280 = 16 + 38.4 = 54.4px
  clamped to the 3rem maximum: 48px
200% zoom, viewport now 640 CSS px
  preferred: 16 + 3% of 640 = 16 + 19.2 = 35.2 CSS px
  rendered at 2×: 70.4 device px
70.4 ÷ 48 = 1.47, short of 2
```

The rem part doubled; the vw part didn't.

Stepped sizes do something similar: at 200% a 1280px window crosses GOV.UK's breakpoint and swaps the 48px heading for 32, rendered at 64 device pixels, 1.33 times the original.

WCAG's understanding document allows this: 200% need only be reachable "in some way". Browsers zoom to 500%, so a size that never shrinks below 0.4 of its largest value can always reach twice that value. GOV.UK's deepest shrink (0.66, point 80 to 53) and Carbon's (0.53) clear it. The toolkit's fluid-type rule, after [Smashing's analysis](https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/), says the same the other way round: the largest size within about 2.5 times the smallest.

> **Aside.** The 0.4 bound is derived from WCAG's understanding text and browsers' 500% limit; it isn't a WCAG rule. A stricter reading of 1.4.4 that requires 200% at 200% zoom would fail any breakpoint shrink, GOV.UK's included.

If you use `clamp()`, give it a rem floor and a rem term in the preferred value, never a bare `vw`. Then divide each size's minimum by its maximum, stepped sizes included. **No size should shrink below 0.4 of its largest value.**

---

## Body text size

Body text holds, on the current evidence: the only user-outcome argument in this area says hold it, and the platform defaults agree.

The desktop reading size is 18. Tailwind's `prose md:prose-lg` pattern would make it 16 on a phone, as would Zell Liew's specimen. No source considers 16 too small, so the question is narrow: whether a desktop size above 16 comes down. For holding, GOV.UK's reversal and the platforms' 16 to 17 phone defaults; against it, mostly convention.

Holding a larger body costs line length. Inter at 18px in a 343px column (a 375px phone with 16px gutters) sets about 41 characters a line, by the toolkit's measurement from the font's advance widths; at 16px, about 47. [Butterick's lower bound](https://practicaltypography.com/responsive-web-design.html) is 45. Apple's 17pt iPhone body sits in the same range.

Hold your body text on a phone. **A desktop reading size of 18 can hold too**, at the cost of about 41 characters a line on a 375px phone, which the platforms' own defaults show is tolerable.

---

## Prose gaps on a phone

The large ones do and the small ones hold: a gap tied to the body (paragraph, list item) holds when the body holds, and a gap tied to a heading shrinks with the heading.

[GOV.UK's responsive spacing scale](../foundations/spacing-tokens-by-intent.md#responsive-spacing) is the one primary source that encodes the split: its small units hold at every width and its large ones shrink on mobile. Its large units shrink by a third or more on a phone (unit 6 from 30 to 20, unit 7 from 40 to 25), close to the third its large headings shrink by. Tailwind's presets scale every gap in em with the body; USWDS's em-based gaps hold because its sizes hold.

What must not shrink is the ordering in [space between prose elements](../foundations/space-between-prose-elements.md#origins-of-prose-spacing): every heading's space above still has to clearly exceed the paragraph gap.

Hold your paragraph and list gaps, and shrink heading gaps in proportion to the headings. In Figma, add a Mobile mode to the spacing collection and change only the heading gaps in it. **Then check, at the smallest width, that every heading's space above still beats the paragraph gap.**

---

## Line height on a phone

Very little, when it is set by role: the heading value covers the whole range, and a heading that looks loose on a phone is usually too big, not too loosely leaded.

A heading that fits on one line at 1280px runs to three lines at 375px. Here it is at two line heights, drawn after Pimp my Type's specimen.

<svg role="img" viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same heading wrapped to three lines in a narrow column, twice. Left, at line height 1.3, the three lines drift apart and read as separate lines. Right, at line height 1.1, they hold together as one heading above the paragraph.</title>
<rect x="0" y="0" width="640" height="260" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Line height 1.3</text>
<rect x="20" y="44" width="280" height="200" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text font-size="26" font-weight="600" fill="#1a1a1a"><tspan x="36" y="82">Senior product</tspan><tspan x="36" y="116">designer for the</tspan><tspan x="36" y="150">payments team</tspan></text>
<rect x="36" y="178" width="248" height="8" rx="2" fill="#d6d3ca"/>
<rect x="36" y="196" width="230" height="8" rx="2" fill="#d6d3ca"/>
<rect x="36" y="214" width="180" height="8" rx="2" fill="#d6d3ca"/>
<text x="340" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Line height 1.1</text>
<rect x="340" y="44" width="280" height="200" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text font-size="26" font-weight="600" fill="#1a1a1a"><tspan x="356" y="82">Senior product</tspan><tspan x="356" y="111">designer for the</tspan><tspan x="356" y="140">payments team</tspan></text>
<rect x="356" y="178" width="248" height="8" rx="2" fill="#d6d3ca"/>
<rect x="356" y="196" width="230" height="8" rx="2" fill="#d6d3ca"/>
<rect x="356" y="214" width="180" height="8" rx="2" fill="#d6d3ca"/>
</svg>

At 1.3 the lines drift apart until the gaps inside the heading compete with the gap below it. At 1.1 the heading holds together.

That might suggest tightening headings on phones, but no system read does so. Where the ratio moves at all it rises slightly as the size falls: GOV.UK's 48 point is 1.09 on mobile and 1.04 on desktop, and Carbon's fluid headings run from 1.25 at 32px to 1.17 at 48px. Carbon sits inside the 1.1 to 1.25 heading band, and GOV.UK's largest size just under it, as set out in [choosing line height](../foundations/one-type-scale-for-ui-and-content.md#choosing-line-height). Radix and Primer loosen as they step down, Spectrum, Bootstrap and USWDS keep one ratio, and only Polaris tightens, with no reason given. Of the reading sites, only Medium tightens, from 1.24 to 1.19.

Body line height is the other candidate. [Pimp my Type](https://pimpmytype.com/line-length-line-height/) puts mobile body at 1.3 to 1.45, shorter lines needing less leading, while calling one 1.5 for both an acceptable compromise. Holding one value gives up a small optimisation and keeps one fewer mode.

Keep your line heights by role across widths, and test every heading level at its longest realistic text on a 375px screen. **If a wrapped heading looks too loose, try the next size down before a tighter line height.**

---

## The worked example's scale

A 1.125 scale from 16, ten sizes and thirteen styles, with line height, weight and face set by role; every value is that project's decision, not a rule.

The project landed on 16 × 1.125ⁿ rounded to ten sizes: 12, 14, 16, 18, 20, 22, 28, 36, 48 and 72. The formula gives 46 and 74 at the top; 48 and 72 are its two named exceptions. The sizes give thirteen text styles, named sm/md/lg in the design file and in code alike (`label-sm`, `body-lg`, `heading-2xs`).

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

Weights are labels and display 500, headings 600 and text 400, Primer's set of three. Inter is used below 28px and Inter Display from 28px, both as static files ([display cuts](../foundations/one-type-scale-for-ui-and-content.md#display-cuts) says why). The text-cut tracking is Inter 3's withdrawn dynamic-metrics curve rounded to half a percent.

Long-form content uses Body lg at 18 on a 720px measure. Each h2 opens a section that carries a hairline as its top border and 40px of padding top and bottom, with no gap between sections. Inside a section every element carries its own space above: 16 under the h2, 24 between paragraphs, 8 between list items, h3 40 above and 12 below, h4 32 above and 8 below. Code blocks are 16 on 150%, padded 16 by 20; inline code runs at 1em.

The content headings follow reading sites rather than the scale's stride: h4 is Heading 2xs at 18, the body size in bold; h3 is Heading sm at 22; h2 is Heading md at 28; the page title is Heading xl at 48.

Most of this sits inside the evidence. **Check the desktop scale against the evidence first: a phone mode inherits every problem it has.**

---

## Pushback from the evidence

The evidence pushes back at the measure, which is too wide for the body; two first drafts were already corrected, and four smaller choices are judgement calls.

At 18px, Inter sets about 87 characters on the worked example's 720px line, too wide for the toolkit's 65 to 75; [column width](../foundations/space-between-prose-elements.md#column-width) has the arithmetic and the fix.

The project had already corrected two first drafts. Code blocks started at 14, two steps below the body, and moved to 16, one step, which is where the content systems sit ([code inside prose](../foundations/space-between-prose-elements.md#code-inside-prose)). The content headings first walked every other step (h2 at 36, twice the body), above every reading site, so they moved to reading-site ratios.

Four smaller points are judgement rather than contradiction:

- **The display switch at 28** comes before Inter's axis reaches its full display drawing, at 32.
- **−2% on Inter Display from 36** tightens a cut already drawn tighter.
- **Labels at 120%** sit below the 1.3 role value in [choosing line height](../foundations/one-type-scale-for-ui-and-content.md#choosing-line-height): fine on one line, too tight for a label that wraps.
- **The hairline sits midway** in its 80px break. [Section dividers](../foundations/space-between-prose-elements.md#section-dividers) puts a rule nearer its heading: 56 above it and 24 below.

**Narrow the measure before touching the type.** Then set the 36 and 48 sizes beside a 0% tracking version and check them by eye before you lock the value.

---

## The scale on a phone

Below about 640px, body and UI sizes hold, each content heading drops to a lower size on the same list, and the page title lands at 28, about 1.6 times the body.

The first phone title, 36, was 2.0 times the body. Reading sites, measured at 375px:

| Site at 375px | Body | Page title / line height | Title ÷ body |
|---|---|---|---|
| GOV.UK | 19 | 32 / 1.09 (heading-xl), 27 / 1.11 (heading-l) | 1.68, 1.42 |
| Wikipedia | 16 | 27.2 / 1.375 (serif) | 1.70 |
| Medium | 18 | 32 / 1.19 | 1.78 |
| Smashing Magazine | 19.8 | 32 / 1.20 | 1.62 |
| The Guardian | 17 | 28 / 1.15 | 1.65 |
| Substack | 17 | 32 / 1.125 | 1.88 |
| MDN, GitHub Docs | 16 | 40 / 1.25, 40 / 1.20, as on desktop | 2.5, with short titles |

Reading sites set their phone titles at 1.6 to 1.9 times their body, so the project moved its title to 28. Below about 40rem, body and UI sizes hold and each content heading drops a step on the same list; face and tracking become mode values too. Here is the content column at both widths, drawn at the same scale.

<svg role="img" viewBox="0 0 700 330" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The worked example's content column at desktop and phone width, at the same scale. Desktop: page title 48, h2 28, h3 22, body 18. Phone: page title 28, h2 22, h3 20, body still 18. The headings come down; the body text stays the same size.</title>
<rect x="0" y="0" width="700" height="330" fill="#f7f6f2"/>
<text x="20" y="28" font-size="13" font-weight="600" fill="#1a1a1a">Desktop, 720px measure</text>
<rect x="20" y="40" width="432" height="270" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="36" y="86" font-size="28.8" font-weight="600" fill="#1a1a1a">Page title, 48</text>
<text x="36" y="132" font-size="16.8" font-weight="600" fill="#1a1a1a">h2, 28</text>
<text x="36" y="160" font-size="10.8" fill="#5a5850">Body, 18</text>
<rect x="36" y="170" width="400" height="6" rx="2" fill="#d6d3ca"/>
<rect x="36" y="186" width="390" height="6" rx="2" fill="#d6d3ca"/>
<rect x="36" y="202" width="300" height="6" rx="2" fill="#d6d3ca"/>
<text x="36" y="240" font-size="13.2" font-weight="600" fill="#1a1a1a">h3, 22</text>
<rect x="36" y="254" width="400" height="6" rx="2" fill="#d6d3ca"/>
<rect x="36" y="270" width="350" height="6" rx="2" fill="#d6d3ca"/>
<text x="484" y="28" font-size="13" font-weight="600" fill="#1a1a1a">Phone, 375px</text>
<rect x="484" y="40" width="200" height="270" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="494" y="76" font-size="16.8" font-weight="600" fill="#1a1a1a">Page title, 28</text>
<text x="494" y="116" font-size="13.2" font-weight="600" fill="#1a1a1a">h2, 22</text>
<text x="494" y="144" font-size="10.8" fill="#5a5850">Body, 18</text>
<rect x="494" y="154" width="180" height="6" rx="2" fill="#d6d3ca"/>
<rect x="494" y="170" width="176" height="6" rx="2" fill="#d6d3ca"/>
<rect x="494" y="186" width="180" height="6" rx="2" fill="#d6d3ca"/>
<rect x="494" y="202" width="120" height="6" rx="2" fill="#d6d3ca"/>
<text x="494" y="240" font-size="12" font-weight="600" fill="#1a1a1a">h3, 20</text>
<rect x="494" y="254" width="180" height="6" rx="2" fill="#d6d3ca"/>
<rect x="494" y="270" width="150" height="6" rx="2" fill="#d6d3ca"/>
</svg>

The title loses nearly half its size; the body doesn't change. The full mode:

| Style or gap | Desktop | Mobile | Evidence |
|---|---|---|---|
| Display | 72 / 110%, Inter Display, −2% | 36 / 110%, Inter Display, −2% | GOV.UK 80 → 53 (0.66) |
| Heading lg | 36 / 120% | 28 / 120%, Inter Display, 0 | one step down, as Polaris's 36 → 30 |
| Page title | Heading xl, 48 / 110% | Heading md, 28 / 120%, Inter Display, 0 | reading sites 27 to 32 |
| h2 | Heading md, 28 | Heading sm, 22, Inter, −2% | GOV.UK 36 → 27; Polaris 30 → 24 |
| h3 | Heading sm, 22 | Heading xs, 20, Inter, −2% | Polaris 24 → 20; GOV.UK 24 → 21 |
| h4 | Heading 2xs, 18 | unchanged | the body size in bold |
| Body, labels, code | 18, 16, 16 to 12, 16 | unchanged | [protecting small text](#protecting-small-text) |
| Line heights | 150 / 120 / 110% | unchanged | [line height on a phone](#line-height-on-a-phone) |
| Paragraph and list gaps | 24, 8 | unchanged | tied to the body |
| Section padding | 40 top and bottom, hairline inside | 32 top and bottom | GOV.UK heading gaps shrink by a quarter to a third |
| h3 and h4 above / below | 40 / 12 and 32 / 8 | unchanged | still above the 24 paragraph gap |
| Code block padding (proposed) | 16 × 20 | 16 × 16 | gives back 8px of a short line |
| Measure | 720px | the column, less 16px gutters | about 41 characters at 18px |

Two consequences need writing down with the table. On a phone the h4 is the body size one step under the h3, so it is told from a paragraph by weight alone, as USWDS's h4 is. And the h3 gaps hold while the section padding drops to 32, so the hairline, not the gap, is what marks the h2.

The largest shrink in the table is the page title's 0.58, inside the 0.4 bound from [zoom and shrinking type](#zoom-and-shrinking-type), so the stepped switch passes WCAG 1.4.4 at any breakpoint the zoom crosses.

Adopt the phone column as one mode on your text-style and spacing tokens, drawn in the design file and switched at one breakpoint in rem. **Write the phone mode down as a table of style sizes and gaps, the way this one is.** The values are the project's decisions, except the code block padding marked "proposed".

---

## Cheat sheet

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

## The short version

On a phone, keep your body text and UI sizes as they are; GOV.UK stopped shrinking its body on accessibility grounds, and the platforms make phone text larger. Bring headings and display down, the page title to about 1.6 times the body. Taking the smaller sizes from your desktop list is one of three shipped answers and keeps a single set of styles; check that no two heading levels collide.

Gaps tied to the body hold; gaps tied to headings shrink with them, and every heading's space above should still exceed the paragraph gap. Line heights stay by role: if a wrapped heading looks loose on the narrowest screen, it's probably too big.

Stepped rem sizes at one breakpoint, taken from a Mobile mode in the design file, are the simplest mechanism. Fluid `clamp()` works too, provided its floor is in rem and no size shrinks below about 0.4 of its maximum, which keeps WCAG's 200% zoom reachable. The hold-the-bottom pattern is consensus; staying on the desktop list and the 0.4 bound are judgements with reasons. Write the phone mode down as a table of sizes and gaps.

---

## What to re-check later

Researched November 2026.

- **How the values were read.** From each system's source or tokens, listed under Sources; Polaris 13.9, Spectrum tokens 15.6, Bootstrap 5.3.3.
- **Reading sites** were measured at 375px in headless Chrome with an iPhone user agent. The New York Times served no article and Material 3's compact-window guidance did not render; neither is in the tables.
- **Characters per line** are the toolkit's measurement from the Inter 4.1 font file.
- **GOV.UK's scale is the fastest-moving evidence.** 6.6.0 (15 October 2026) is the latest release; no release since 6.0 has changed the type scale. Point 27 is still marked for possible deprecation.
- **The 0.4 zoom bound** is derived, not a WCAG rule (see the aside under [zoom and shrinking type](#zoom-and-shrinking-type)).
- **The worked example's style-to-size mapping** is read from its ten sizes and thirteen styles in order; if the project assigns them differently, the mobile table's rows move with it.
- **Evidence quality.** The only user-outcome evidence is GOV.UK's, resting on service teams' findings and BDA guidance rather than a published study. No system read publishes research comparing stepped with fluid type, or on whether heading gaps should shrink on phones.

---

## Sources

**Primary: system source, tokens and documentation**

- [GOV.UK Frontend, `_typography-responsive.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_typography-responsive.scss).
- [GOV.UK Frontend, `_spacing.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_spacing.scss).
- [GOV.UK Frontend changelog](https://github.com/alphagov/govuk-frontend/blob/main/CHANGELOG.md) and [releases](https://github.com/alphagov/govuk-frontend/releases).
- [GOV.UK Design System, using the updated type scale](https://design-system.service.gov.uk/get-started/new-type-scale/) and [spacing](https://design-system.service.gov.uk/styles/spacing/).
- [GOV.UK design notes, making the typography scale more accessible (2022)](https://designnotes.blog.gov.uk/2022/12/12/making-the-gov-uk-frontend-typography-scale-more-accessible).
- [Carbon, `styles.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/styles.ts), [`fluid.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/fluid.ts) and [`@carbon/layout` breakpoints](https://github.com/carbon-design-system/carbon/blob/main/packages/layout/src/index.ts).
- [Shopify Polaris, compiled `styles.css`](https://cdn.jsdelivr.net/npm/@shopify/polaris/build/esm/styles.css) and [Polaris tokens CSS](https://cdn.jsdelivr.net/npm/@shopify/polaris-tokens/dist/css/styles.css).
- [Primer primitives, functional typography tokens](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/functional/typography/typography.css).
- [Tailwind Typography README](https://github.com/tailwindlabs/tailwindcss-typography/blob/main/README.md) and [`styles.js`](https://github.com/tailwindlabs/tailwindcss-typography/blob/main/src/styles.js).
- [Apple Human Interface Guidelines, Typography](https://developer.apple.com/design/human-interface-guidelines/typography).
- [Android 14 features, non-linear font scaling](https://developer.android.com/about/versions/14/features#non-linear-font-scaling).
- [Adobe Spectrum tokens, `typography.json`](https://github.com/adobe/spectrum-tokens/blob/main/packages/tokens/src/typography.json).
- [Fluent 2, typography](https://fluent2.microsoft.design/typography).
- [Radix Themes, breakpoints](https://www.radix-ui.com/themes/docs/theme/breakpoints).
- [Utopia, designing with fluid type scales](https://utopia.fyi/blog/designing-with-fluid-type-scales/).

**Standards**

- [WCAG 2.2 Understanding 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html).
- [WCAG 2.2 Technique F94](https://www.w3.org/WAI/WCAG22/Techniques/failures/F94).

**Commentary: named type specialists**

- [Matthew Butterick, responsive web design](https://practicaltypography.com/responsive-web-design.html).
- [Oliver Schöndorfer (Pimp my Type), font size](https://pimpmytype.com/font-size/) and [line length and line height](https://pimpmytype.com/line-length-line-height/).
- [Zell Liew, responsive typography](https://zellwk.com/blog/responsive-typography/).
- [Smashing, addressing accessibility concerns with fluid type](https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/).

**Toolkit knowledge base and sister pieces**

- `knowledge/code/responsive.md#fluid-type` and `knowledge/ui/design/visual.md#type-for-ui-and-long-form-content`.
- [One type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), [space between prose elements](space-between-prose-elements.md), [naming text styles](naming-text-styles.md).
