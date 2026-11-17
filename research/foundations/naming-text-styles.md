# Naming text styles

How to name a design system's text styles by role and size, with no weight word, and how many roles to name.

Part 1 of 2. [Part 2](../foundations/naming-text-styles-part-2.md) covers heading levels, the word `default`, a second platform and what Figma can do.

In its first week, a team names its large heading style `h2/36-bold`. A year later the mobile breakpoint renders it at 27px, a rebrand has moved the system's bold from 700 to 653, and the card that uses it needs an `<h3>`, not the `<h2>` the name promised. Every part of the name has gone false, and fixing it means touching every file that uses the style.

A name should carry only what stays true when values, platforms and pages change: the role and a relative size. This part covers the size and the weight, and how many roles to have; [part 2](../foundations/naming-text-styles-part-2.md) covers the element and the word `default`.

---

## What this answers

- [A shared naming grammar](#a-shared-naming-grammar): whether systems share a naming grammar
- [Words for size](#words-for-size): what words should name the size
- [Weight in the name](#weight-in-the-name): whether the weight belongs in the name
- [Number of roles](#number-of-roles): how many roles a system needs

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is this part in a few paragraphs. What the sizes, line heights and weights themselves should be is in [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md).

---

## A shared naming grammar

Almost every mature system builds a text style name from a role, a size and occasionally a variant, and the arguments are about the words in each slot, not the structure.

A naming meeting can spend an hour on whether names should be `heading-lg` or `lg-heading` or something else entirely. Line up seven shipping systems and that part of the argument is already over.

| System | Example name | Role | Size | Variant |
|---|---|---|---|---|
| Shopify Polaris | `headingSm` | heading | Sm | none, a component prop overrides it |
| Atlassian | `font.heading.xxlarge` | heading | xxlarge | none |
| IBM Carbon | `heading-01` | heading | 01 | none |
| Material 3 | `title-medium` | title | medium | a parallel `emphasized` set |
| Microsoft Fluent 2 | `Body 1 Strong` | body | 1 | Strong / Stronger |
| Apple HIG | `Headline` | Headline | absent | none |
| GOV.UK | `govuk-heading-l` | heading | l | none |

Nobody puts colour in the name, and nobody puts the typeface there. Two of the seven, Material and Fluent, carry a variant slot for emphasis, which makes a semantic-emphasis variant a recognised third slot, not a Material peculiarity.

What isn't settled is the rest: [the words for size](#words-for-size), [whether weight belongs](#weight-in-the-name), [how many roles](#number-of-roles), and in part 2, [h1 to h6](../foundations/naming-text-styles-part-2.md#heading-level-names), [the word default](../foundations/naming-text-styles-part-2.md#the-word-default), [a second platform](../foundations/naming-text-styles-part-2.md#a-second-platform) and [what Figma can do](../foundations/naming-text-styles-part-2.md#figma-in-2026).

Adopt the role-plus-size grammar and spend the meeting on the open questions. **The structure is consensus across web, native and government systems that share no lineage on this point.** Arriving at it independently is what makes it worth trusting.

---

## Words for size

Role plus t-shirt size for the styles designers pick from every day, and plain numbers for the primitive scale underneath; a token named after its own pixel value goes false, as GOV.UK's history shows.

The test case is insertion. A scale has `md` and `lg`, and a year later something needs to sit between them. Whatever the size words are, they decide whether that is one new token or a rename. Five approaches ship in production.

**T-shirt sizes** (`sm`, `md`, `lg`, `2xl`) read instantly and map straight onto component props, so `size="md"` reads like English. Polaris uses them for its semantic layer, and Atlassian spells the run out from `xxsmall` to `xxlarge`. Their weakness is insertion: between `md` and `lg` there's no name.

Shopify hit a subtler version. With t-shirt names at two layers, `font-size-sm` in the primitives and `headingSm` in the semantic layer, a reader can't tell whether the two "small"s are the same value. Shopify's fix was to keep t-shirt names at one layer only, the curated semantic one.

**Plain numbers** sit underneath. Polaris sets `--p-font-size-100` as its 14px base and extends down to `75` or up past `200`. The number says position and nothing else, so a step between 100 and 200 is simply `150`. The cost is that newcomers sometimes read the number as pixels, which it deliberately isn't.

**Ordinals** are Carbon's: `heading-01` to `heading-07`, `body-01`, `label-01`. They explain themselves least, and Carbon pays for that with unusually thorough documentation. In v10 the numbers had picked up a second meaning, `-01` for the dense "productive" set and `-02` for the editorial "expressive" one; [Carbon v11 merged the two sets](https://github.com/carbon-design-system/carbon/blob/main/docs/migration/v11.md) and reclassified the scale as Fixed (constant across breakpoints) and Fluid (interpolating by viewport).

**Pure roles** drop size words. Material 3 keeps only a coarse qualifier (`display`, `headline`, `title`, `body`, `label`, each large, medium or small). Apple drops even that: `Large Title`, `Title 1` to `Title 3`, `Headline`, `Body`, `Callout`, `Footnote`, `Caption 1` and `Caption 2`, with Dynamic Type deciding how big each renders. The trade is that roles cap the scale and need shared education.

**Value-literal naming**, where the token for 16px is called `16`, deserves the longest look. One of the most accessibility-scrutinised systems in the world uses it, and its own history is the clearest argument against it.

[GOV.UK Frontend names its scale points by pixel value](https://design-system.service.gov.uk/styles/type-scale/): 16, 19, 24, 27, 36, 48 and 80. A developer writes `govuk-font($size: 19)`. The logic is self-evidence: GOV.UK serves hundreds of loosely connected government teams who may touch the system once a year, so a token called `19` needs no lookup table.

Here is what the current scale (GOV.UK Frontend v6, unchanged through 6.6.0) renders on a small screen. Why the top of a scale compresses on a phone is in [protecting small text](../foundations/type-on-a-phone.md#protecting-small-text); the point here is what it does to the names.

| Scale point | Large screens | Small screens | Usage | Is the name still true on mobile? |
|---|---|---|---|---|
| 80 | 80px | 53px | Exceptional circumstances only | Only above the breakpoint |
| 48 | 48px | 32px | `govuk-heading-xl` | Only above the breakpoint |
| 36 | 36px | **27px** | `govuk-heading-l` | No, and 27 is another point's own name |
| 27 | 27px | **21px** | Exceptional circumstances only | No |
| 24 | 24px | **21px** | `govuk-heading-m`, `govuk-body-l` | No, and it now matches point 27's mobile value |
| 19 | 19px | 19px | `govuk-heading-s`, `govuk-body` | Yes |
| 16 | 16px | 16px | `govuk-body-s` | Yes |

The three middle rows hold the trouble. Drawn at their real sizes, they look like this.

<svg role="img" viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>GOV.UK scale points 36, 27 and 24, each drawn at its large-screen and small-screen size. Point 36 renders at 27px on small screens, the name of another point. Points 27 and 24 both render at 21px on small screens.</title>
<rect x="0" y="0" width="640" height="250" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Scale point</text>
<text x="140" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Large screens</text>
<text x="360" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Small screens</text>
<line x1="20" y1="42" x2="620" y2="42" stroke="#c9c6bd"/>
<text x="20" y="92" font-size="16" font-weight="600" fill="#1a1a1a">36</text>
<text x="140" y="92" font-size="36" font-weight="700" fill="#1a1a1a">Apply</text>
<text x="252" y="92" font-size="13" fill="#5a5850">36px</text>
<text x="360" y="92" font-size="27" font-weight="700" fill="#9a3412">Apply</text>
<text x="450" y="92" font-size="13" fill="#9a3412">27px, another point's name</text>
<line x1="20" y1="112" x2="620" y2="112" stroke="#e4e1d8"/>
<text x="20" y="156" font-size="16" font-weight="600" fill="#1a1a1a">27</text>
<text x="140" y="156" font-size="27" font-weight="700" fill="#1a1a1a">Apply</text>
<text x="252" y="156" font-size="13" fill="#5a5850">27px</text>
<text x="360" y="156" font-size="21" font-weight="700" fill="#9a3412">Apply</text>
<text x="450" y="156" font-size="13" fill="#9a3412">21px</text>
<line x1="20" y1="176" x2="620" y2="176" stroke="#e4e1d8"/>
<text x="20" y="218" font-size="16" font-weight="600" fill="#1a1a1a">24</text>
<text x="140" y="218" font-size="24" font-weight="700" fill="#1a1a1a">Apply</text>
<text x="252" y="218" font-size="13" fill="#5a5850">24px</text>
<text x="360" y="218" font-size="21" font-weight="700" fill="#9a3412">Apply</text>
<text x="450" y="218" font-size="13" fill="#9a3412">21px, same as 27</text>
</svg>

On the left, each name matches what renders. On the right, none does, and two different names render identically.

Both failures are real. A developer holding a spec that says "36" and measuring 27px has every reason to log a bug. And points 24 and 27 produce one identical value at exactly the viewport carrying most public-sector traffic.

The values move over time too: [v6 raised the small-screen sizes](https://design-system.service.gov.uk/get-started/new-type-scale/) and removed point 14. When the name is the value, changing the value means renaming the token across government or living with a name that has stopped telling the truth. GOV.UK chose the second; its source now marks point 27 "consider deprecating this size".

Points 16 and 19 hold one value at every breakpoint, so the two sizes carrying most body copy have honest names. Value-literal naming is a bet that values won't move: GOV.UK has partly lost it (three of seven points) and partly won it (the two doing the most work).

Systems that considered it and declined said so. [Polaris chose increments of 100](https://polaris.shopify.com/design/typography/typography-tokens) so the number would say position, not pixels. Atlassian's spacing tokens encode a ratio: `space.100` is 8px because it is 100% of the base.

Use role plus t-shirt size for your semantic styles and plain numbers for the primitives underneath; Polaris, Primer, Atlassian and Material each run a dialect of this two-layer split. Keep value-literal naming for the narrow case GOV.UK occupies (one platform, rarely touched values, occasional users), and expect even those names to go false at breakpoints. **If you want the pixel value visible, put it in the token's description, which Figma shows on hover, not in the name.**

---

## Weight in the name

Keep the weight out of the name: bake a sensible weight into each semantic style, keep literal weight primitives underneath for engineers, and add a semantic alias such as `weight/emphasis` if the system runs on a variable font.

This is the most consequential naming decision here. The four approaches in production differ in one thing: what happens when the weight changes.

| Approach | Example | Who ships it | Survives a weight rebrand? |
|---|---|---|---|
| Literal weight in the name | `-semibold` | Primer primitives | No, every name is now wrong |
| Semantic strength in the name | `Body 1 Strong`, `emphasized` | Fluent 2, Material 3 | Yes |
| Baked in, no weight word at all | `Title Medium` | Material, Apple, Atlassian, GOV.UK, Carbon, Polaris | Yes |
| Weight as a free modifier on every size | `.fw-bold` on any `h1` to `h6` or `.display-*` | Bootstrap | No, and the combinations multiply uncontrolled |

**Literal weight names** are transparent and match how CSS and font files name weights. [Primer's primitives](https://primer.style/foundations/typography/) are the clean reference: `--base-text-weight-semibold` resolves to 600.

The brittleness shows under change, and Atlassian is the clearest case. [Its tokens](https://cdn.jsdelivr.net/npm/@atlaskit/tokens/dist/esm/artifacts/themes/atlassian-typography.js) define four weights: `font.weight.regular` 400, `medium` 500, `semibold` 600 and `bold` 653. There is no 700. **653 is what the system calls bold**, and every heading token uses it. Semibold exists, but [Atlassian's guidance](https://atlassian.design/foundations/typography/applying-typography) says to "use this weight with caution": its fallback fonts lack 600 and render bold instead. Neither literal name says what renders.

**Semantic strength names** let the value move under the name, the logic that won for colour tokens and that HTML has carried for thirty years in `<strong>`. [Fluent 2](https://fluent2.microsoft.design/typography) names it directly: `Body 1 Strong` and `Subtitle 2 Stronger` sit beside their unmarked siblings, retuned per platform without touching a name. Material 3, needing heavier text across the scale, shipped a parallel **Emphasized** set of the same fifteen roles, exposed in Compose as `titleLargeEmphasized`, rather than add `-bold` to fifteen styles.

**Baked-in weight** is the most often misread: the weight is a fixed property of the named style. Picking the style is picking the weight, and a different weight is a different style, not a modifier on this one.

- Material 3's `Title Medium` is always weight 500 and `Body Large` always 400. "Medium" there is a size word, not the weight, which is the confusing part for nearly everyone meeting it.
- Apple's `Headline` is semibold at body size and `Body` is regular, so weight is the entire difference between the two names.
- Atlassian has no `font.heading.large.bold`, because a non-bold heading of that role doesn't exist.
- GOV.UK's `govuk-heading-l` is bold; Carbon fixes each token's weight and documents it in the spec sheet, never in the name.

Polaris adds an escape hatch: heading variants carry a set weight, but [the `Text` component's `fontWeight` prop](https://polaris-react.shopify.com/components/typography/text) can override it. That keeps the exception from turning into workarounds, which is what Shopify's coverage figure, under [number of roles](#number-of-roles), measured.

The counter-example is [Bootstrap](https://getbootstrap.com/docs/5.3/utilities/text/). Its seven `fw-*` utilities apply to any element, including `h1` to `h6` and `display-1` to `display-4`. So `<h1 class="display-3 fw-bold">` is legal and common, and a codebase has as many distinct headings as combinations someone typed.

Baked-in weight wins for three reasons. The style picker becomes a list of finished decisions instead of raw ingredients. Decorative bolding becomes harder, since there's no bold knob beside every size. And a weight rebrand becomes one value change instead of a rename, which is what let Atlassian move its bold from 700 to 653.

It has three costs. Legitimate exceptions have nowhere to go without an escape hatch, which is why Polaris shipped one. The style count grows when a role really needs two weights, which is why Material published fifteen Emphasized styles. And the weight is invisible in the name, so a designer reading `Title Medium` has to open the spec or Dev Mode, which is less reliable on weight than it looks ([Figma in 2026](../foundations/naming-text-styles-part-2.md#figma-in-2026)).

> **Aside.** The toolkit's code-standard rule 54 uses `--body-md-regular-font-size` as its example field name: a weight word in a semantic style name. The build is faithful to the Figma file it reads, so by this argument the Figma name is what should change, and the generated token names lose `-regular` with it.

Bake a sensible weight into each semantic style, and keep literal weight primitives below it (`weight/regular`, `weight/medium`, `weight/semibold`, `weight/bold`). Add a semantic alias such as `weight/emphasis` as soon as a variable font or a rebrand is plausible. **Ship the escape hatch on the component API rather than assuming no exception will come.** The measured cost of skipping it is Polaris's 8 percent, in the next section.

---

## Number of roles

Four to six for most teams, each earning its place through distinct behaviour rather than a different size; by that test `subtitle` usually fails, though not unanimously.

Someone proposes a `subtitle` style because a page has a line of text smaller than the heading and larger than the body. Is that a role or just a size? Lining the shipping systems up by role count gives a ladder to measure it against.

| System | Roles | Rough picker size |
|---|---|---|
| Polaris | heading, body | about 10 styles |
| Spectrum | heading, body, detail, code | t-shirt sizes per role |
| Atlassian | heading, body, code, metric | about 12 styles |
| Fluent 2 (web) | caption, body, subtitle, title, large title, display | about 15 styles |
| Material 3 | display, headline, title, body, label | 15 baseline, 15 more Emphasized |
| Carbon | heading, body, body-compact, code, label, display | about 20 styles |
| Apple HIG | 11 role-only styles, no size axis | 11 |

The picker ends up about the same size whichever way a system splits it: comparable products land between ten and twenty. What moves is where meaning lives. Apple put everything into roles because Dynamic Type owns sizing; Polaris put everything into sizes because the `Text` component's props carry the rest.

The big systems are also consolidating, in public. Material 2 shipped thirteen styles (`headline1` to `headline6`, `subtitle1`/`2`, `body1`/`2`, `button`, `caption`, `overline`); [Material 3](https://material-web.dev/theming/typography/) collapsed them into five roles and deleted `subtitle` and `overline`.

Shopify ran the same arc and published the measurement behind it. [In Polaris v10](https://polaris-react.shopify.com/previous-releases/version-10-typography), six rigid type components collapsed into one `Text` component, after Shopify found roughly **8 percent coverage** of typography tokens in custom components. Teams were hard-coding CSS to get around the taxonomy, citing too little flexibility, thin guidance and too narrow a range of weights and sizes. [Polaris v11](https://github.com/Shopify/polaris/blob/main/documentation/guides/migrating-from-v10-to-v11.md) removed the six legacy components.

That 8 percent runs against instinct. **A low adoption number is usually evidence the system is wrong, not that its users are undisciplined.** The fix is to loosen the taxonomy before reaching for enforcement.

The test itself: a role earns its place through behaviour, not size. The roles that survive show it:

- `label` survived Material's consolidation because it isn't small body text: 500 weight against body's 400, tighter tracking, single-line UI chrome.
- `code` survives everywhere, because a font-family switch is a role, not a size.
- Atlassian's `metric` gives dashboard figures their own scale (three sizes as of the [2026 General Availability release](https://atlassian.design/whats-new/new-typography-in-general-availability/)), so a large count can carry tabular figures a heading shouldn't.
- Carbon keeps `body-compact` beside `body`, identical except for line height, because dense UI and readable prose behave differently.

The deleted roles show the other side. `subtitle` is usually a smaller heading or a strong large body under another name. `overline` does have a behaviour (uppercase, wide tracking), but Material deleted it anyway: a behaviour used in one or two components can live as a component style.

Fluent 2 complicates the consensus. It keeps a `Subtitle` role in its 2026 ramp, Semibold against Body's Regular, but publishes no rule for when to reach for it over a strong Body or a small Title, and ships it only on web, Windows and macOS. So `subtitle` is a live disagreement between two well-resourced systems.

Material 3 Expressive on Wear OS adds two roles that clearly aren't sizes. [**Numerals**](https://developer.android.com/design/ui/wear/guides/get-started/apply) is for numeric strings that never need localising, so a watch face can render bigger digits; **Arc Text** follows the curve of a round face.

Four tests sort a proposed role:

- If two candidate roles would share identical values and identical usage rules, merge them.
- If a role's whole definition is "a smaller version of X", it's a size of X.
- If explaining when to use it takes a paragraph of exceptions, it's drawn in the wrong place.
- Adding a size to an existing role beats adding a role, which beats adding a weight variant to every size of a role.

Aim for four to six roles, found by auditing your real screens for distinct text behaviours, and run every later proposal through the four tests. If coverage is low, treat it as a design smell, not a training problem. On `subtitle`, default to not shipping it; **if your team wants one, require a written behavioural rule before it ships.**

---

## Cheat sheet

| Decision | Write this | Not this | Why |
|---|---|---|---|
| Semantic size | `heading/lg` | `heading/36`, `heading/h2` | Values move, elements are contextual |
| Primitive size | `font/size/300` | `font/size/lg`, `font/size/24` | Insertion headroom, no claim about the value |
| Weight in a semantic style | nothing | `heading/lg-bold` | Weight is baked in; a rebrand changes values, not names |
| Weight primitive | `font/weight/semibold` | `font/weight/600` | A literal name is fine at the primitive layer only |
| Variable-font emphasis | `font/weight/emphasis` | `font/weight/semibold` | 653 is neither semibold nor bold |
| A new role | one with its own behaviour | a smaller version of an existing role | Behaviour, not size, earns a role |

The rows on `default`, element intent, weight variable type and platforms are in [part 2's cheat sheet](../foundations/naming-text-styles-part-2.md#cheat-sheet).

---

## The short version

Name the styles your designers pick from by role plus t-shirt size, and the primitives underneath with plain numbers. Don't name a token after its own pixel value unless your constraints match GOV.UK's (one platform, rarely touched values, occasional users), and even GOV.UK has watched three of its seven scale points stop being true at mobile widths.

Keep weight words out of semantic style names. Bake the weight in, keep literal weight primitives below it, and add a `weight/emphasis` alias once a variable font is in the picture, because Atlassian's bold is 653 and no literal name can say that. Ship an escape hatch on the component API.

Aim for four to six roles, found by auditing your real screens for distinct behaviours, not sizes. `label`, `code` and `metric` pass that test; `subtitle` usually fails it, though Fluent 2 still ships one, so ask for a written rule before adding it. If adoption is low, suspect the naming system before the team: Shopify measured 8 percent coverage and rebuilt the taxonomy. The grammar and the two-layer size split are consensus; the call on `subtitle` is a judgement.

---

## What to re-check later

Researched August 2026, revised November 2026, against each system's own documentation, repository or developer docs. The toolkit's own rules on styles and tokens are in `knowledge/ui/design/visual.md#typography`, `knowledge/code/figma-handoff.md#text-styles-to-type-tokens` and code-standard rule 54.

- **GOV.UK's type scale and Atlassian's weights** were re-checked in November 2026 against GOV.UK Frontend 6.6.0 (no type-scale change since 6.0) and `@atlaskit/tokens` 20.8.2. Atlassian's corrected this guide: an earlier version said three weights; there are four tokens, and bold is 653.
- **The LSEG/Refinitiv counter-example was replaced** in the August pass: its current documentation shows baked-in weight per style. Bootstrap's `fw-*` utilities replace it.
- **`subtitle`'s status is a live disagreement.** Material deleted it; Fluent 2 keeps it on three of five platforms with no published usage rule.
- **Evidence quality.** Shopify's 8 percent is the one hard measurement, and it measures developer adoption, not a reader outcome. Treat everything here as an engineering argument.

---

## Sources

**Primary**

- [Shopify Polaris, typography tokens](https://polaris.shopify.com/design/typography/typography-tokens). Increments of 100.
- [Shopify Polaris, `Text` component](https://polaris-react.shopify.com/components/typography/text). The `fontWeight` escape hatch.
- [Shopify Polaris, Version 10 Typography](https://polaris-react.shopify.com/previous-releases/version-10-typography). The 8 percent coverage figure and its reasons.
- [Shopify Polaris, migrating from v10 to v11](https://github.com/Shopify/polaris/blob/main/documentation/guides/migrating-from-v10-to-v11.md).
- [GitHub Primer, typography foundations](https://primer.style/foundations/typography/).
- [Atlassian, Applying typography](https://atlassian.design/foundations/typography/applying-typography) and [`@atlaskit/tokens` typography artifacts](https://cdn.jsdelivr.net/npm/@atlaskit/tokens/dist/esm/artifacts/themes/atlassian-typography.js) 20.8.2. Weights 400, 500, 600 and 653.
- [Atlassian, Typography reaches General Availability](https://atlassian.design/whats-new/new-typography-in-general-availability/). The Metric sizes.
- [IBM Carbon, type sets](https://carbondesignsystem.com/elements/typography/type-sets/) and [v11 migration guide](https://github.com/carbon-design-system/carbon/blob/main/docs/migration/v11.md).
- [Material Design 3, typography](https://material-web.dev/theming/typography/).
- [Android Developers, Material 3 Expressive on Wear](https://developer.android.com/design/ui/wear/guides/get-started/apply).
- [Apple Human Interface Guidelines, Typography](https://developer.apple.com/design/human-interface-guidelines/typography).
- [Adobe Spectrum, Heading](https://spectrum.adobe.com/page/heading/) and [Body](https://spectrum.adobe.com/page/body/).
- [GOV.UK Design System, Type scale](https://design-system.service.gov.uk/styles/type-scale/) and [using the updated type scale](https://design-system.service.gov.uk/get-started/new-type-scale/).
- [GOV.UK design notes, developing new typography and spacing (2018)](https://designnotes.blog.gov.uk/2018/02/19/developing-new-typography-and-spacing-for-gov-uk-frontend/). The reasoning behind value-named points.
- [Microsoft Fluent 2, Typography](https://fluent2.microsoft.design/typography).
- [Bootstrap 5.3, Text utilities](https://getbootstrap.com/docs/5.3/utilities/text/).

**Toolkit knowledge base and sister pieces**

- `knowledge/ui/design/visual.md#typography`, `knowledge/code/figma-handoff.md#text-styles-to-type-tokens`; `standards/code-standard.md` rule 54.
- [Naming text styles, part 2](naming-text-styles-part-2.md), [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), [type on a phone](type-on-a-phone.md).
