# Naming text styles

How to name a design system's text styles by role and size, with no weight word, no `default` and no HTML tag, and what each choice costs.

In its first week, a team names its large heading style `h2/36-bold`. A year later the mobile breakpoint renders it at 27px, a rebrand has moved the system's bold from 700 to 653, and the card that uses it needs an `<h3>`, not the `<h2>` the name promised. Every part of the name has gone false, and fixing it means touching every file that uses the style.

A name should carry only what stays true when values, platforms and pages change: the role and a relative size. Weight, the word `default` and the heading element each go false under one of those changes, so each belongs somewhere else.

---

## What this answers

- [A shared naming grammar](#a-shared-naming-grammar): whether systems share a naming grammar
- [Words for size](#words-for-size): what words should name the size
- [Weight in the name](#weight-in-the-name): whether the weight belongs in the name
- [Number of roles](#number-of-roles): how many roles a system needs
- [Heading-level names](#heading-level-names): whether styles can be named h1 to h6
- [The word default](#the-word-default): where the word default goes
- [A second platform](#a-second-platform): what changes with a second platform
- [Figma in 2026](#figma-in-2026): what Figma can do in 2026

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in a few paragraphs. What the sizes, line heights and weights themselves should be is in [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), and how Figma's line-height and letter-spacing units reach CSS is in [line height and letter spacing](line-height-letter-spacing-figma-to-css.md).

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

Nobody puts colour in the name, and nobody puts the typeface there; those are settled. Two of the seven, Material and Fluent, carry a variant slot for emphasis. That makes a semantic-emphasis variant look like a recognised third slot, not a Material peculiarity.

What isn't settled is the rest of this guide: [the words for size](#words-for-size), [whether weight belongs](#weight-in-the-name), [how many roles](#number-of-roles) and whether `subtitle` is one, [h1 to h6](#heading-level-names), [what to call the ordinary version](#the-word-default), [a second platform](#a-second-platform), and [what Figma can actually do](#figma-in-2026).

Adopt the role-plus-size grammar and spend the meeting on the open questions. **The structure is consensus across web, native and government systems that share no lineage on this point.** Arriving at it independently is what makes it worth trusting.

---

## Words for size

Role plus t-shirt size for the styles designers pick from every day, and plain numbers for the primitive scale underneath; a token named after its own pixel value goes false, as GOV.UK's history shows.

The test case is insertion. A scale has `md` and `lg`, and a year later something needs to sit between them. Whatever the size words are, they decide whether that is one new token or a rename.

Five approaches ship in production, and the differences between them are mechanical, not aesthetic.

**T-shirt sizes** (`sm`, `md`, `lg`, `2xl`) read instantly and map straight onto component props, so `size="md"` reads like English. Polaris uses them for its semantic layer, and Atlassian spells the run out from `xxsmall` to `xxlarge`. Their weakness is insertion: between `md` and `lg` there's no name, and the fix is an ugly `mdlg` or a partial rename.

Shopify hit a subtler version. With t-shirt names at two layers, `font-size-sm` in the primitives and `headingSm` in the semantic layer, a reader can't tell whether the two "small"s are the same value. Shopify's fix was to keep t-shirt names at one layer only, the curated semantic one, where the set of steps is a deliberate decision.

**Plain numbers** sit underneath. Polaris sets `--p-font-size-100` as its 14px base and extends down to `75` or up past `200`. The number says position and nothing else, so a step between 100 and 200 is simply `150` and nothing renames. The cost is that newcomers sometimes read the number as pixels, which it deliberately isn't.

**Ordinals** are Carbon's: `heading-01` to `heading-07`, `body-01`, `label-01`, with headroom to keep adding. They explain themselves least, and Carbon pays for that with unusually thorough documentation, permanently.

In Carbon v10 the numbers had picked up a second meaning: `-01` meant the dense "productive" set and `-02` the editorial "expressive" one. That was too opaque to last. [Carbon v11 merged the two sets](https://github.com/carbon-design-system/carbon/blob/main/docs/migration/v11.md), took the productive and expressive words out of the token names, and reclassified the scale as Fixed (constant across breakpoints) and Fluid (interpolating between a minimum and maximum by viewport).

**Pure roles** drop size words. Material 3 keeps only a coarse qualifier (`display`, `headline`, `title`, `body`, `label`, each large, medium or small). Apple drops even that: `Large Title`, `Title 1` to `Title 3`, `Headline`, `Body`, `Callout`, `Footnote`, `Caption 1` and `Caption 2`. An Apple style name says what the text is for, and Dynamic Type decides how big it renders on the reader's device.

The trade is that roles cap the scale and need shared education. Every new designer has to learn what separates a headline from a title before the name means anything.

**Value-literal naming**, where the token for 16px is called `16`, deserves the longest look. One of the most accessibility-scrutinised systems in the world uses it, and its own history is the clearest argument against it.

[GOV.UK Frontend names its scale points by pixel value](https://design-system.service.gov.uk/styles/type-scale/): 16, 19, 24, 27, 36, 48 and 80. A developer writes `govuk-font($size: 19)`. The logic is self-evidence: GOV.UK serves hundreds of loosely connected government teams who may touch the system once a year, so a token called `19` needs no lookup table.

Here is what the current scale (GOV.UK Frontend v6, released February 2026 and unchanged through 6.6.0) renders on a small screen. Why a scale's top end should compress on a phone is argued in [type on a phone](type-on-a-phone.md); the point here is what it does to the names.

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

Both failures are real. A developer holding a spec that says "36" and measuring 27px has every reason to log a bug instead of reading the table correctly. And points 24 and 27 produce one identical value at exactly the viewport carrying most public-sector traffic.

The values move over time too. [GOV.UK Frontend v6](https://design-system.service.gov.uk/get-started/new-type-scale/) raised the small-screen sizes for legibility (24 and 27 from 18px to 21px, 36 from 24px to 27px) and removed point 14 outright. When the name is the value, changing the value means renaming the token across government or living with a name that has stopped telling the truth.

GOV.UK chose the second. Its source now marks point 27 "consider deprecating this size", which is the collision above, noticed.

What v6 didn't touch matters as much. Points 16 and 19 hold one value at every breakpoint, so the two sizes carrying most body copy have honest names, and the self-evidence argument holds completely for them. Value-literal naming is a bet that values won't move: GOV.UK has partly lost it (three of seven points) and partly won it (two of seven, the two doing the most work).

Systems that considered value-literal naming and declined said so. [Polaris chose increments of 100](https://polaris.shopify.com/design/typography/typography-tokens) so the number would say position, not pixels. Atlassian's spacing tokens encode a ratio: `space.100` is 8px because it is 100% of the base, so the name survives a change to the base.

Use role plus t-shirt size for your semantic styles and plain numbers for the primitives underneath. Polaris, Primer, Atlassian and Material each run a dialect of this two-layer split, arrived at independently enough to count as consensus. Keep value-literal naming for the narrow case GOV.UK occupies (one platform, rarely touched values, occasional users), and expect even those names to go false at breakpoints. **If you want the pixel value visible, put it in the token's description, which Figma shows on hover, not in the name.**

---

## Weight in the name

Keep the weight out of the name: bake a sensible weight into each semantic style, keep literal weight primitives underneath for engineers, and add a semantic alias such as `weight/emphasis` if the system runs on a variable font.

This is the most consequential naming decision here, and the industry agrees on it more than the surface debate suggests. The four approaches in production differ in one thing: what happens when the weight changes.

| Approach | Example | Who ships it | Survives a weight rebrand? |
|---|---|---|---|
| Literal weight in the name | `-semibold` | Primer primitives | No, every name is now wrong |
| Semantic strength in the name | `Body 1 Strong`, `emphasized` | Fluent 2, Material 3 | Yes |
| Baked in, no weight word at all | `Title Medium` | Material, Apple, Atlassian, GOV.UK, Carbon, Polaris | Yes |
| Weight as a free modifier on every size | `.fw-bold` on any `h1` to `h6` or `.display-*` | Bootstrap | No, and the combinations multiply uncontrolled |

**Literal weight names** are transparent and match how CSS and font files already name weights, which engineers like on sight. [Primer's primitives](https://primer.style/foundations/typography/) are the clean reference: `--base-text-weight-semibold` resolves to 600.

The brittleness shows under change, and Atlassian is the clearest case. [Its tokens](https://cdn.jsdelivr.net/npm/@atlaskit/tokens/dist/esm/artifacts/themes/atlassian-typography.js) define four weights: `font.weight.regular` 400, `medium` 500, `semibold` 600 and `bold` 653. There is no 700. **653 is what the system calls bold**, and every heading token uses it.

Semibold exists, but [Atlassian's typography guidance](https://atlassian.design/foundations/typography/applying-typography) says to "use this weight with caution": its fallback fonts lack 600 and render bold instead. So `semibold` means 600 in Atlassian Sans and bold in a fallback, and `bold` means 653 in one and 700 in the other. Neither literal name says what renders.

**Semantic strength names** let the value move under the name. It's the logic that won for colour tokens, and HTML has carried it for thirty years in `<strong>`. [Fluent 2](https://fluent2.microsoft.design/typography) names it directly: `Body 1 Strong` and `Subtitle 2 Stronger` sit beside their unmarked siblings, and Microsoft retunes what "Strong" resolves to per platform (Segoe UI on web and Windows, San Francisco Pro on iOS and macOS, Roboto on Android) without touching a name.

Material 3 made the same move at scale. When it needed heavier text across the whole scale, Google didn't add `-bold` to fifteen styles. It shipped a parallel **Emphasized** set, the same fifteen roles at a higher weight and slightly different metrics, exposed in Compose as `titleLargeEmphasized`. The name describes the purpose of the heavier cut, so each style's weight can be retuned without a rename.

**Baked-in weight** is the most often misread, so it needs a precise definition: the weight is a fixed property of the named style. No weight word appears because there's nothing to choose. Picking the style is picking the weight, and a different weight is a different style, not a modifier on this one.

Across the systems that do it:

- Material 3's `Title Medium` is always weight 500 and `Body Large` always 400. "Medium" there is a size word, not the weight, which is the confusing part for nearly everyone meeting it.
- Apple's `Headline` is semibold at body size and `Body` is regular, so weight is the entire difference between the two names.
- Atlassian has no `font.heading.large.bold`, because a non-bold heading of that role doesn't exist.
- GOV.UK's `govuk-heading-l` is bold, and bold body text lives in a separate utility class, not a heading variant.
- Carbon fixes each token's weight internally and documents it in the spec sheet, never in the name.

Polaris adds an escape hatch: heading variants carry a set weight, but [the `Text` component's `fontWeight` prop](https://polaris-react.shopify.com/components/typography/text) can override it. That keeps the exception from turning into workarounds, which is what Shopify's coverage figure, under [how many roles a system needs](#number-of-roles), measured.

The counter-example is [Bootstrap](https://getbootstrap.com/docs/5.3/utilities/text/). Its seven `fw-*` utilities (`fw-lighter`, `fw-light` 300, `fw-normal` 400, `fw-medium` 500, `fw-semibold` 600, `fw-bold` 700, `fw-bolder`) apply to any element, including the `h1` to `h6` and `display-1` to `display-4` classes. So `<h1 class="display-3 fw-bold">` is legal and common, and a codebase has as many distinct headings as combinations someone typed.

Baked-in weight wins for three reasons:

- The style picker becomes a list of finished decisions instead of raw ingredients, so there's one thing to get right instead of two.
- Decorative bolding becomes harder, since there's no bold knob beside every size: governance by constraint, not by guideline.
- A weight rebrand becomes one value change instead of a rename, which is what let Atlassian move its bold from 700 to 653 without touching a token name.

It has three costs. Legitimate exceptions have nowhere to go without an escape hatch, which is why Polaris shipped one. The style count grows when a role really needs two weights, which is why Material published fifteen Emphasized styles. And the weight is invisible in the name, so a designer reading `Title Medium` has to open the spec or Dev Mode to learn it, and Dev Mode is less reliable on weight than it looks (see [what Figma can do](#figma-in-2026)).

> **Aside.** The toolkit's code-standard rule 54 uses `--body-md-regular-font-size` as its example field name: a weight word in a semantic style name. The build is faithful to the Figma file it reads, so by this argument the Figma name is what should change, and a project adopting this guide should expect its generated token names to lose `-regular` with it.

Bake a sensible weight into each semantic style, and keep literal weight primitives below it (`weight/regular`, `weight/medium`, `weight/semibold`, `weight/bold`). Add a semantic alias such as `weight/emphasis` as soon as a variable font or a rebrand is plausible. **Ship the escape hatch on the component API rather than assuming no exception will come.** The measured cost of skipping it is Polaris's 8 percent, in the next section.

---

## Number of roles

Four to six for most teams, each earning its place through distinct behaviour rather than a different size; by that test `subtitle` usually fails, though not unanimously.

Someone proposes a `subtitle` style because a page has a line of text that is smaller than the heading and larger than the body. The question is whether that's a role or just a size. Lining the shipping systems up by role count gives a ladder to measure the proposal against.

| System | Roles | Rough picker size |
|---|---|---|
| Polaris | heading, body | about 10 styles |
| Spectrum | heading, body, detail, code | t-shirt sizes per role |
| Atlassian | heading, body, code, metric | about 12 styles |
| Fluent 2 (web) | caption, body, subtitle, title, large title, display | about 15 styles |
| Material 3 | display, headline, title, body, label | 15 baseline, 15 more Emphasized |
| Carbon | heading, body, body-compact, code, label, display | about 20 styles |
| Apple HIG | 11 role-only styles, no size axis | 11 |

The first thing the table shows is that the picker ends up about the same size whichever way a system splits it. Polaris's two roles expand to about ten styles through the size axis; Material's five roles times three sizes make fifteen; Apple's eleven role-only styles are eleven. Comparable products land between ten and twenty.

What moves is where meaning lives. Apple put everything into roles because Dynamic Type owns sizing; Polaris put everything into sizes because the `Text` component's props carry the rest. Nobody is choosing more or less complexity, only which slot holds it, and saying so defuses a lot of the argument.

The second thing is direction: the big systems are consolidating, in public. Material 2 shipped thirteen styles (`headline1` to `headline6`, `subtitle1`/`2`, `body1`/`2`, `button`, `caption`, `overline`). [Material 3](https://material-web.dev/theming/typography/) collapsed them into five roles and deleted `subtitle` and `overline` with no direct replacement.

Shopify ran the same arc and published the measurement behind it. [In Polaris v10](https://polaris-react.shopify.com/previous-releases/version-10-typography), six rigid type components (`DisplayText`, `Heading`, `Subheading`, `Caption`, `TextStyle`, `VisuallyHidden`) collapsed into one `Text` component, after Shopify found roughly **8 percent coverage** of typography tokens in custom components.

Teams weren't skipping the taxonomy out of laziness. They were hard-coding CSS to get around it, citing too little flexibility in the six components, thin guidance on designing with type, and too narrow a range of weights and sizes. Developers who tested the single `Text` component in Shopify's research found it easier to use and understand. [Polaris v11](https://github.com/Shopify/polaris/blob/main/documentation/guides/migrating-from-v10-to-v11.md) removed the six legacy components.

That 8 percent is the most useful number in this guide, and its lesson runs against instinct. **A low adoption number is usually evidence the system is wrong, not that its users are undisciplined.** The fix is to loosen the taxonomy before reaching for enforcement.

The third thing is the test itself: a role earns its place through behaviour, not size. The roles that survive show it:

- `label` survived Material's consolidation because it isn't small body text: 500 weight against body's 400, tighter tracking, single-line UI chrome with its own wrapping and punctuation rules.
- `code` survives everywhere, because a font-family switch is a role, not a size.
- Atlassian's `metric` gives dashboard figures their own scale (three sizes as of the [2026 General Availability release](https://atlassian.design/whats-new/new-typography-in-general-availability/)), so a large count reads as a figure, not a section title, and can carry tabular figures a heading shouldn't.
- Carbon keeps `body-compact` beside `body`, identical except for line height, because dense UI and readable prose behave differently.

The deleted roles show the other side. `subtitle` is the textbook over-granular role: in practice it's usually a smaller heading or a strong large body under another name. `overline` is subtler, because it does have a behaviour (uppercase, wide tracking). Material deleted it anyway, reasoning that a behaviour used in one or two components can live as a component style; system roles are for behaviours that recur everywhere.

Fluent 2 complicates the consensus. It keeps a `Subtitle` role in its current 2026 ramp, with a defined web weight (Semibold, against Body's Regular), so it does behave differently from Body. But Fluent publishes no rule for when to reach for Subtitle over a strong Body or a small Title. And the role exists only on web, Windows and macOS, not iOS or Android, so it fails the portability test under [a second platform](#a-second-platform).

So `subtitle` is a live disagreement between two well-resourced systems, not a settled question. A team adopting it should be able to state the behavioural rule Fluent doesn't publish.

Material 3 Expressive, rolled out through 2026 on Wear OS, adds two roles that clearly aren't sizes. [**Numerals**](https://developer.android.com/design/ui/wear/guides/get-started/apply) is for numeric strings that never need localising, so a watch face can render bigger, more stylised digits than body text could if it had to leave room for translated words. **Arc Text** is for titles that follow the curve of a round watch face. Both exist because of behaviour a size can't express.

Four tests sort a proposed role:

- If two candidate roles would share identical values and identical usage rules, merge them.
- If a role's whole definition is "a smaller version of X", it's a size of X.
- If explaining when to use it takes a paragraph of exceptions, it's drawn in the wrong place.
- Adding a size to an existing role beats adding a role, which beats adding a weight variant to every size of a role.

Aim for four to six roles, found by auditing your real screens for distinct text behaviours rather than reasoning in the abstract, and run every later proposal through the four tests. If coverage is low, treat it as a design smell, not a training problem. On `subtitle`, default to not shipping it; **if your team wants one, require a written behavioural rule before it ships.** Neither of the two existing answers, delete it or keep it without a rule, is settled enough to copy.

---

## Heading-level names

Styles should not be named h1 to h6, on four separate lines of evidence; but ignoring heading levels is also wrong, and the fix is to carry the element alongside the style instead of in its name.

The shortcut is tempting. Name the Figma styles `h1` to `h6`, and designers, engineers, SEO and screen readers seem to share one vocabulary for free. [Figma's best-practices guide](https://www.figma.com/best-practices/typography-systems-in-figma/) lists exactly this as a valid "semantic" strategy, beside size-based and descriptive naming, without picking a winner.

The h1-to-h6 school gets something right. Heading elements carry real weight: screen reader users jump from heading to heading, skipped levels confuse them, and accessibility guidance expects a coherent outline on every page.

A [Figma forum thread](https://forum.figma.com/t/using-different-text-naming-conventions-instead-of-h1-h6-for-design/53577) shows the tension. A designer argued for pure size names with the element left to developers; a developer replied that the intended element has to travel with the design or the outline becomes guesswork after handoff. Both are right about something. A naming scheme that lets a designer forget headings exist ships an inaccessible product, whatever the styles are called.

Naming styles after elements still fails, on four kinds of evidence.

**The system that tried it renamed away.** Material 2's scale was literally `headline1` to `headline6`; Material 3 deleted those names for role times size. [Angular Material](https://material.angular.dev/guide/typography) now ships only a default, overridable mapping from role to element: `display-large` suggests `<h1>`, `headline-small` suggests `<h6>`, and title, body and label map to none. The association survives as a suggestion, never as the name.

**The accessibility-first systems decouple on purpose, while still requiring headings.** This carries the most weight, because these teams work under the strictest obligations. [GOV.UK](https://design-system.service.gov.uk/styles/headings/) tells teams to mark up headings semantically first and choose a size class second. A long guidance page starts its `<h1>` at `govuk-heading-xl`; a question page starts its `<h1>` at `govuk-heading-l`. One element, two treatments, which a style named `h1` couldn't allow.

CMS.gov is a live before-and-after of the same trap. Its heading classes shipped as `.ds-h1` to `.ds-h6`, with `.ds-display` and `.ds-title` above them, each tied by name to a level. [In version 2.5.0 it renamed the whole set](https://design.cms.gov/migration-guides/agnostic-typography-classes/) to a size-only scale, because the levels in a document don't always match the visual hierarchy a design needs.

The published mapping runs `.ds-display` → `.ds-text-heading--5xl`, `.ds-title` → `.ds-text-heading--4xl`, `.ds-h1` → `.ds-text-heading--3xl`, and so on down to `.ds-h6` → `.ds-text-heading--sm`. [CMS.gov also ships `ds-content`](https://design.cms.gov/foundation/typography/headings/), a wrapper class that applies an automatic level-to-size mapping for mostly-prose pages, so the decoupling doesn't cost every page a decision.

**The component systems decouple through the API.** Polaris's `Text` requires an `as` prop because the visual variant and the element are separate values. `<Text variant="headingLg" as="p">` is legal, common, and appears in Polaris's own migration documentation.

**The structural reason** all of these converge is put most crisply in commentary. [Nathan Curtis observes](https://eightshapes.com/articles/typography-in-design-systems/) that a component appears on many pages, and the heading that is the largest thing on one screen is the third-largest on another. A style welded to `h1` can't be reused across them.

Element names go wrong in four distinct ways:

- **The size-driven element**, the central one, is silent. A designer picks "h3" because it's the right size, an engineer faithfully ships `<h3>`, and the outline breaks where nobody is looking. The page looks right; only screen-reader navigation degrades.
- **The second grammar.** Element names stop at six and cover only headings, so body, label and code need another vocabulary, and the picker speaks two languages that don't compose.
- **The untranslatable name.** iOS and Android have no h-elements, so an h-named library can't port to a second platform.
- **The faithful agent.** A legacy style named `styles/h2`, read by a coding agent through Figma's code layers or an MCP server, becomes a hard `<h2>` everywhere, including where the outline needs something else (more under [what Figma can do](#figma-in-2026)).

Even HTML has stopped tying an element to a size. Until 2022 the spec's outline algorithm shrank an `<h1>` nested in `<article>`, `<aside>`, `<nav>` or `<section>`; that algorithm was removed that year. As of [MDN's April 2025 post](https://developer.mozilla.org/en-US/blog/h1-element-styles/), Firefox was rolling out removal of the matching browser styles (all platforms planned by Firefox 140), Chrome had shown deprecation warnings since version 136, and Safari tracked it in WebKit bug 292765 with no timeline.

Name your styles by role and size, never by element, and carry the intended element as separate metadata: an `as` prop in code, an annotation or a component property in Figma. Publish a default mapping table in Angular Material's style, overridable rather than load-bearing, and set `h1` sizes explicitly instead of relying on browser defaults. **Once the name stops enforcing the outline, make the outline a review item: one `<h1>` per page, no skipped levels.**

The toolkit states the same split as a rule: the heading level is code's (code-standard rule 1), the look is the style's, and a card title can be an `h3` and look small (`~/Projects/toolkit/knowledge/ui/design/visual.md#typography`). If most of your pages are prose, CMS.gov's `ds-content` pattern gives back the convenience without the coupling.

---

## The word default

The word default goes nowhere: the unmarked name is the default, and only a deviation from it carries a modifier.

This eats a surprising share of naming meetings, and most of that time goes once it's clear that three different things are being argued about under one word.

| What people mean by "default" | Who ships it | Verdict for typography |
|---|---|---|
| The unmarked name is the default | Carbon, Material, GOV.UK, Primer | The right answer |
| The centre of a spectrum, subtle and strong on either side | GitLab Pajamas | Coherent for colour and border tokens, a poor fit for type |
| A leaf name Figma's folder structure forces into a name | Figma libraries generally | Avoid it, by flattening with a hyphen |

**Default by omission** is the dominant pattern once it's named. Carbon renamed its v10 "long" body styles to plain `body` and its "short" ones to `body-compact`, so the everyday reading style owns the bare name and the deviation wears the badge. Material's fifteen baseline styles carry no marker; only the heavier set is marked `emphasized`, and nobody types `title-medium-baseline`. GOV.UK's `govuk-body` is the default paragraph, with `-l` and `-s` doing the marked work either side.

Primer builds the same idea into its data. [Its token guide](https://github.com/primer/primitives/blob/main/DESIGN_TOKENS_GUIDE.md) holds a default and its sub-values side by side (`bgColor.accent` next to `bgColor.accent.muted`) by authoring the default under a reserved key that is stripped from the emitted name. The default exists in the authoring model, never as a word in the shipped token.

[GitLab Pajamas](https://design.gitlab.com/product-foundations/border/) shows where `default` as a word does earn its place. Its border tokens run `default`, `subtle` and `strong` as three real points on one spectrum of visual weight. That suits border weight or background emphasis, where louder and quieter are both common states. It suits type poorly, where there usually isn't a "quieter than body text" role that needs a name the way a subtle border does.

The commentary agrees. [Nate Baldwin](https://www.designsystemscollective.com/design-tokens-authoring-vs-consuming-82762e699580) treats `default` as a recurring flashpoint because the one word is asked to do GitLab's job and Carbon's at once. [Curtis's naming essay](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676) shows a token padded with segments like `default` and `on-light` beside a clean equivalent, and recommends only as many qualifiers as real intent needs.

Omission wins on adoption, not elegance. The shortest name is the path of least resistance: if `body/md` is easier to type than `body/md-strong`, the default becomes what people reach for without thinking, the same argument baked-in weight makes. An explicit `default` also ages badly once a system goes multi-brand, since brand B's default weight can be brand A's emphasis.

There's a Figma-specific reason the word turns up in so many libraries that never meant to argue for it. Figma treats each segment of a style path as either a folder or a style, never both. So a style at `body/md` can't sit beside styles inside a `body/md/…` folder, and wanting `body/md` plus a strong variant forces a choice:

| Option | Figma names | Code tokens | Cost |
|---|---|---|---|
| Flatten with a hyphen | `body/md`, `body/md-strong` | `bodyMd`, `bodyMdStrong` | None worth naming |
| Push everything a level down | `body/md/default`, `body/md/strong` | `bodyMdDefault`, `bodyMdStrong` | Longer names, `default` sorts alphabetically into the middle of its own siblings, and the word leaks into code that the omission convention says should never contain it |

The hyphen wins on the last cell. The folder version forces the Figma name and the code name apart, the one outcome this guide keeps arguing against.

Three words tangle here, and the tangle is expensive once it ships. `base` is the root value a scale grows from. `default` is the unmarked member of a variant group. `regular` is a font weight, 400, and nothing else.

Using `regular` to mean "the ordinary one" produces names like `body/md/regular`, where nobody can tell whether it means weight 400 or the unmarked variant. In most typefaces the two coincide, which hides the ambiguity until the font changes and they stop coinciding.

Default by omission, always, and hyphen-flatten in Figma so the tool never forces the word into a name. **Write the `base`, `default` and `regular` distinction into your naming document**, because it's the collision most likely to come back after everything else is decided and shipped.

---

## A second platform

For most teams, separate libraries per platform with identical role names, and primitive values synced by a token pipeline; the role name is the part that doesn't change.

An iOS team joins, and the web library's style picker is about to double. All three patterns in production answer one Figma constraint: the picker effectively shows one level of grouping at a time, so structure decides how painful it gets as the library grows.

| Pattern | Style count | Picker experience | Best for |
|---|---|---|---|
| Platform folders inside one library | Multiplies by platform | Degrades with scale | A small team in one file |
| Separate libraries per platform | Multiplies, but hidden per project | Stays clean, enabled per project | Designers who work one platform at a time |
| One set of names, values per mode | Fewest names of the three | Clean, with a preview gotcha | Cross-platform parity as a hard requirement |

**Platform folders**, `Web/Heading/Md` beside `iOS/Heading/Md`, are cheap to set up, and their ordering is a real choice. Platform-first collapses everything irrelevant into closed folders, which suits people who work one platform at a time. Element-first keeps a role's platform versions adjacent, which suits side-by-side comparison. Either way the style count multiplies and picker fatigue arrives on schedule.

**Separate libraries** are Figma's own recommendation for larger teams: mobile-native styles in one library, responsive web in another, each enabled per project. It's the cleanest defence against an overloaded picker. The price is keeping shared primitives in sync, by hand or by pipeline, so the real price is "have a pipeline".

**One set of names with values per mode** means switching a file's mode resizes `heading/lg` in place, with no duplicate style. Fewest styles, most stable names, and one gotcha: the picker previews the wrong mode, described under [what Figma can do](#figma-in-2026).

Whichever pattern a team picks, `heading/lg` should mean the same thing on web, iOS and Android while the values under it differ. Fluent 2 makes that concrete. The same core roles (Caption, Body, Title, Large Title, Display) carry different native typefaces and pixel ranges per platform: Segoe UI on web and Windows, San Francisco Pro on iOS and macOS, Roboto on Android. The native font does the work of feeling native; the role vocabulary stays constant.

On Apple platforms the practical version is to map roles onto [Dynamic Type text styles](https://developer.apple.com/design/human-interface-guidelines/typography) and let the system own the scaling, handing off style names, not pixel values, except for deliberately fixed text. This portability is the strongest practical argument for role-based names, and the most direct argument against element names, which can't exist off the web.

The rule is stress-tested outside Latin script, and mostly holds. [Ant Design's font specification](https://ant.design/docs/spec/font/) recommends a 14px base with a 22px line height, a ratio near 1.57, above common Latin defaults. Its stated reason is legibility at a typical 50cm viewing distance and a reading angle of about 0.3 degrees on common monitors.

It also writes down restraints Western systems rarely state: keep to three to five sizes outside dedicated display pages, and hold most text to regular (400) and medium (500), reserving semibold (600) for bold English words mixed into CJK copy.

It's easy to over-claim what that source says. Ant Design presents the numbers as general guidance rooted in reading distance and a "natural law/pentatonic scale" philosophy, not as a property of CJK script. The explanation often attached to it, that CJK glyphs carry more strokes and want more leading, and that heavy weights fill dense glyphs faster than they darken Latin letters, is commentary layered on top.

What ports is the role grammar: `heading/lg` and `body/md` carry to a CJK product unchanged. What doesn't is the assumption that every role needs the same variant axes everywhere. An italic emphasis variant is close to Latin-only, and a weight ramp that reads as five steps in a Latin face may give three usable ones in a CJK face. That's one more reason to keep weight and style words out of semantic names.

Use separate libraries per platform with identical role names and primitives synced by the pipeline. This depends on how your team works: if designers work one platform at a time, separate libraries cost nothing and end picker bloat. If cross-platform parity is a hard requirement and designers compare platforms side by side every day, take one set of names with values per mode and accept the preview gotcha. **Whichever you choose, keep the role name identical on every platform.** Platform folders in one library suit only a small team; revisit them at the first sign of scroll fatigue.

---

## Figma in 2026

Variables hold the primitives and text styles hold the composites, a split that looks settled rather than temporary, with four rough edges worth knowing exactly before committing names to them.

[Figma shipped typography variables](https://forum.figma.com/t/launched-typography-variables/48430) on 16 April 2024, covering font family, weight and style, size, line height, letter spacing, and paragraph spacing and indent. A variable still stores one value, while a text style bundles five or more. So primitive variables bind inside semantic text styles, and the style is what a designer applies.

GitHub Primer's public stance, styles now and variables once Figma's own composite support catches up, is about as close to an industry position as this topic has.

**Font weight takes strings in styles, and Dev Mode treats string and number variables differently.** A text style's own weight field accepts only a string ("Semibold"), never a number, which is why [Tokens Studio](https://docs.tokens.studio/manage-tokens/token-types/typography/) converts numeric weight tokens to matching string names. A variable bound to weight, underneath the style, can be either type, and the two part ways in Dev Mode.

A number-type weight variable surfaces as a real reference in generated code: `font-weight: var(--Thin-100, 100);`. A string-type one doesn't; [Figma's help page on variables in Dev Mode](https://help.figma.com/hc/en-us/articles/27882809912471-Variables-in-Dev-Mode) says string weight variables aren't passed through as references at all. If the string matches a named weight of the applied font, Dev Mode silently prints the literal number; if not, it falls back to a bare `font-weight: 400;` with no warning.

**Percentage line heights still don't bind.** Number variables read a line-height number as pixels, so a style with a relative line height can only bind a pixel value per size. The request has been open since April 2024; what that costs, and why percentage is still the better Figma input, is in [line height and letter spacing](line-height-letter-spacing-figma-to-css.md).

**The style picker previews the default mode.** This is the cost of the one-set-of-names pattern under [a second platform](#a-second-platform). A style bound to a Mobile mode at 20px and a TV mode at 40px previews at 20px in the picker even while a TV-mode frame renders it correctly at 40px on canvas.

The canvas is right; only the preview misleads. It reproduces across several threads on Figma's forum, and [staff confirmed it as expected behaviour](https://forum.figma.com/t/typography-size-variables-styles-dont-respect-applied-mode-for-variables/71168). The workaround the community and Figma staff converge on is writing the other modes' values into the style's description, since the picker won't show them.

**Variable fonts strain a single numeric weight.** One number can't express the weight-plus-width-plus-slant recipes some variable fonts ship, and the recipe a brand wants often matches none of the font's named instances. Atlassian's 653 is exactly this in production: it's the system's bold, it isn't 700, and its 600 falls back to bold wherever the custom face is missing. A semantic alias such as `weight/emphasis` is the only name shape that survives a value like 653.

Config 2026 shipped Motion (an animation timeline with keyframes and timing variables visible in Dev Mode), Code Layers, custom shaders, agents and generative plugins. [Figma's own changelog of it](https://help.figma.com/hc/en-us/articles/39582753756695-What-s-new-from-Config-2026) touches none of the typography structure, text style mechanics or the four edges above. Two years after typography variables shipped, nothing has moved toward a single composite variable carrying a whole type style, so a scheme built around its arrival is planning around a feature with no date.

Naming got more urgent this year, not less, because agents now read the names. With code layers, two-way handoff and MCP servers letting coding agents read a Figma file, style names are the literal interface an agent uses to map design onto code.

A style named `text/body/md` that matches a code token `--text-body-size-medium` gets translated correctly. One named `Paragraph 2 (new) FINAL` gets translated creatively, which is a polite way of saying wrong. And a legacy `styles/h2` becomes a hard `<h2>` everywhere, the faithful-agent failure under [h1 to h6](#heading-level-names).

Build primitives as variables and semantics as text styles, bind every field that can be bound, and plan for the composite to stay at the style layer. Bind weight with number-type variables wherever Dev Mode visibility matters. **Treat inherited h-named styles as urgent debt, not tidying, because agent tooling has made a bad name actively harmful.** That's the argument to bring to engineering if a naming cleanup needs budget.

---

## Cheat sheet

| Decision | Write this | Not this | Why |
|---|---|---|---|
| Semantic size | `heading/lg` | `heading/36`, `heading/h2` | Values move, elements are contextual |
| Primitive size | `font/size/300` | `font/size/lg`, `font/size/24` | Insertion headroom, no claim about the value |
| Weight in a semantic style | nothing | `heading/lg-bold` | Weight is baked in; a rebrand changes values, not names |
| Weight primitive | `font/weight/semibold` | `font/weight/600` | A literal name is fine at the primitive layer only |
| Variable-font emphasis | `font/weight/emphasis` | `font/weight/semibold` | 653 is neither semibold nor bold |
| The unmarked variant | `body/md` | `body/md/default`, `body/md-regular` | Default by omission |
| A marked variant | `body/md-strong` | `body/md/strong` | Hyphen-flatten so Figma and code agree |
| Family | `font/family/heading` | `font/family/inter` | A font swap should be a value change |
| Element intent | an `as` prop or annotation | a style named `h2` | Two concerns, two carriers |
| Weight variable type | Number variable | String variable | Only Number surfaces as a real reference in Dev Mode |
| Platform variants | same role name, different mode or library | `iOS/heading/lg` as a distinct name | The role name is the invariant |

---

## The short version

Name the styles your designers pick from by role plus t-shirt size, and the primitives underneath with plain numbers. Don't name a token after its own pixel value unless your constraints match GOV.UK's (one platform, rarely touched values, occasional users), and even GOV.UK has watched three of its seven scale points stop being true at mobile widths.

Keep weight words out of semantic style names. Bake the weight in, keep literal weight primitives below it, and add a `weight/emphasis` alias once a variable font is in the picture, because Atlassian's bold is 653 and no literal name can say that.

Aim for four to six roles, found by auditing your real screens for distinct behaviours, not sizes. `label`, `code` and `metric` pass that test; `subtitle` usually fails it, though Fluent 2 still ships one, so ask for a written rule before adding it. If adoption is low, suspect the naming system before the team: Shopify measured 8 percent coverage and rebuilt the taxonomy instead of training harder against it.

Never name a style after an HTML element. Carry the intended element separately, as a prop or an annotation, publish an overridable default mapping the way Angular Material does, and put the outline on the review checklist. CMS.gov's migration away from `.ds-h1` is the cleanest evidence that a real system hit this trap and fixed it.

Let the unmarked name be the default and give only deviations a modifier; hyphen-flatten in Figma so the tool can't force `default` into a name. For a second platform, use separate libraries with the same role names and primitives synced by a pipeline, unless daily side-by-side comparison makes one set of names per mode worth its preview gotcha.

In Figma, variables are primitives and styles are composites, and nothing announced will change that. Bind weight as a number variable where Dev Mode matters. Most of this is consensus across the systems compared; the calls on `subtitle`, on separate libraries, and on treating h-named styles as urgent debt are judgements, each resting on the reasons given above. Write the decisions, and the `base`, `default` and `regular` distinction, into the naming document engineers read.

---

## What to re-check later

Researched August 2026, revised November 2026. Token names, values and migration histories were checked against each system's own documentation, repository or developer docs. The toolkit's own rules on styles and tokens are in `~/Projects/toolkit/knowledge/ui/design/visual.md#typography`, `~/Projects/toolkit/knowledge/code/figma-handoff.md#text-styles-to-type-tokens` and code-standard rule 54.

- **GOV.UK's type scale and Atlassian's weights** were re-checked in November 2026 against GOV.UK Frontend 6.6.0 (15 October 2026, no type-scale change since 6.0, so the mobile table holds) and `@atlaskit/tokens` 20.8.2. Atlassian's corrected this guide: an earlier version said Atlassian ships exactly three weights; there are four tokens, and the heading weight, called bold, is 653. Re-check both before quoting either in a document with a long shelf life.
- **`<h1>` UA styles in Chrome and Safari** were last confirmed from MDN's April 2025 post; the November 2026 pass could not confirm either browser's state since. WebKit bug 292765 is the place to look.
- **CMS.gov's heading class names changed** from `.ds-h1`-style names to `.ds-text-heading--5xl`-style names in version 2.5.0, found in the August pass; this guide cites the current names. A linked project still showing the old ones is on an older CMS Design System version.
- **The LSEG/Refinitiv counter-example was replaced** in the August pass. An earlier version attributed a weight-multiplies-by-size pattern to LSEG/Refinitiv; a direct check of its current typography documentation found baked-in weight per style instead. Bootstrap's `fw-*` utilities replace it, verified against Bootstrap's current documentation.
- **Dev Mode's string and number weight variables** were found to behave differently in the August pass; that finding stands.
- **Figma's four rough edges** (string-only weight in styles, the string and number Dev Mode split, percentage line height, the mode-preview gotcha) are open items the platform may close. Config 2026 closed none of them. The percentage line-height request was still open in November 2026, with forum posts from September and October 2026 describing it as missing. Re-check at the next major Figma release.
- **`subtitle`'s status is a live disagreement.** Material deleted it; Fluent 2 keeps it on three of five platforms with no published usage rule. Re-check whether either system moves.
- **The Ant Design cross-script guidance** rests on one system's specification, which gives numbers and a stated rationale (reading distance, not CJK script mechanics). A second source, ideally one reporting reader outcomes, would strengthen it before it drives an architecture decision.
- **Text style names were outside the 5 October 2026 Code Connect sweep.** That sweep read how 23 public kits name component properties and layers, not their text styles, so nothing in it confirms or contradicts the style names here.
- **Evidence quality.** Shopify's 8 percent is the one hard measurement in this guide, and it measures developer adoption, not a reader outcome. No system in the roster publishes user research on whether its naming scheme produced a better reading experience. Treat everything here as an engineering argument, which is what the evidence supports, not a user-experience claim.

---

## Sources

**Primary: official documentation, repositories, developer docs, and system discussions**

- [Shopify Polaris, typography tokens](https://polaris.shopify.com/design/typography/typography-tokens). The `--p-font-size-100` base and the increments-of-100 convention.
- [Shopify Polaris, `Text` component](https://polaris-react.shopify.com/components/typography/text). The `as` prop, the `variant` prop, the `fontWeight` escape hatch.
- [Shopify Polaris, Version 10 Typography](https://polaris-react.shopify.com/previous-releases/version-10-typography). The six-to-one migration, the 8 percent coverage figure, the stated reasons, the developer testing response.
- [Shopify Polaris, migrating from v10 to v11](https://github.com/Shopify/polaris/blob/main/documentation/guides/migrating-from-v10-to-v11.md). Confirms removal of the six legacy typography components.
- [Shopify.dev, web components](https://shopify.dev/docs/api/app-home/web-components). The framework-agnostic `<s-text>` element.
- [GitHub Primer, typography foundations](https://primer.style/foundations/typography/). `--base-text-weight-semibold` at 600.
- [GitHub Primer, `DESIGN_TOKENS_GUIDE.md`](https://github.com/primer/primitives/blob/main/DESIGN_TOKENS_GUIDE.md). The default-under-a-reserved-key authoring trick.
- [Atlassian Design System, Applying typography](https://atlassian.design/foundations/typography/applying-typography). The four named weights and the semibold-falls-back-to-bold statement.
- [Atlassian Design System, Typography overview](https://atlassian.design/foundations/typography/). The role list including `metric`.
- [`@atlaskit/tokens` typography artifacts](https://cdn.jsdelivr.net/npm/@atlaskit/tokens/dist/esm/artifacts/themes/atlassian-typography.js), version 20.8.2. Weights 400, 500, 600 and 653; headings at 653.
- [Atlassian, Typography reaches General Availability](https://atlassian.design/whats-new/new-typography-in-general-availability/). The Jan 2026 migration deadline, the Metric component's three sizes.
- [Atlassian, Implementing typography at scale](https://www.atlassian.com/blog/how-we-build/implementing-typography-at-scale-the-journey-behind-the-screens). Rationale for the custom typeface and bolder headings.
- [IBM Carbon, type sets](https://carbondesignsystem.com/elements/typography/type-sets/). Current tokens, per-token weights, the Fixed/Fluid classification.
- [IBM Carbon, v11 migration guide](https://github.com/carbon-design-system/carbon/blob/main/docs/migration/v11.md). The productive/expressive merge and the long-to-`body` rename.
- [Material Design 3, typography](https://material-web.dev/theming/typography/). The five roles, three sizes, baseline and Emphasized sets.
- [Android Developers, Material 3 Expressive on Wear](https://developer.android.com/design/ui/wear/guides/get-started/apply). The Arc Text and Numerals roles.
- [Apple Human Interface Guidelines, Typography](https://developer.apple.com/design/human-interface-guidelines/typography). The role-only style list and Dynamic Type's ownership of sizing.
- [Adobe Spectrum, Heading](https://spectrum.adobe.com/page/heading/) and [Body](https://spectrum.adobe.com/page/body/). The role split and t-shirt size axis.
- [GOV.UK Design System, Type scale](https://design-system.service.gov.uk/styles/type-scale/). The current scale point values and breakpoint table.
- [GOV.UK Design System, Using the updated type scale](https://design-system.service.gov.uk/get-started/new-type-scale/). What v6 changed, including the removal of point 14.
- [GOV.UK Design System, Headings](https://design-system.service.gov.uk/styles/headings/). Mark up semantically, style separately.
- [GOV.UK design notes, Developing new typography and spacing for GOV.UK Frontend](https://designnotes.blog.gov.uk/2018/02/19/developing-new-typography-and-spacing-for-gov-uk-frontend/). The reasoning behind value-named scale points.
- [GOV.UK Frontend, v6.0.0 release](https://github.com/alphagov/govuk-frontend/releases/tag/v6.0.0). The February 2026 release date.
- [CMS.gov Design System, Typography overview](https://design.cms.gov/foundation/typography/overview/). Base typeface and weight range.
- [CMS.gov Design System, Headings](https://design.cms.gov/foundation/typography/headings/). Size classes independent of semantic level, and the `ds-content` opt-in mapping.
- [CMS.gov Design System, Using agnostic typography classes (migration guide)](https://design.cms.gov/migration-guides/agnostic-typography-classes/). The `.ds-h1`-to-`.ds-text-heading--3xl`-style rename in v2.5.0 and its stated reason.
- [Microsoft Fluent 2, Typography](https://fluent2.microsoft.design/typography). The Caption/Body/Subtitle/Title/Large Title/Display roles, the Strong/Stronger variant slot, and per-platform typefaces and ranges.
- [GitLab Pajamas, Border](https://design.gitlab.com/product-foundations/border/). The `default`/`subtle`/`strong` token group.
- [Bootstrap 5.3, Text utilities](https://getbootstrap.com/docs/5.3/utilities/text/). The `fw-*` utility classes and values.
- [Ant Design, Font](https://ant.design/docs/spec/font/). Base size/line-height, the three-to-five-size restraint, the weight guidance and its stated (non-CJK-specific) rationale.
- [Angular Material, Typography](https://material.angular.dev/guide/typography). The default, overridable role-to-element mapping.
- [Design Tokens Community Group, Design Tokens specification reaches first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/). The 2025.10 stable release.
- [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/drafts/format/). The typography composite token type.
- [Figma Forum, Launched: Typography Variables](https://forum.figma.com/t/launched-typography-variables/48430). The April 2024 launch and the properties covered.
- [Figma Help Center, Variables in Dev Mode](https://help.figma.com/hc/en-us/articles/27882809912471-Variables-in-Dev-Mode). The string-vs-number weight variable surfacing behaviour.
- [Figma Help Center, What's new from Config 2026](https://help.figma.com/hc/en-us/articles/39582753756695-What-s-new-from-Config-2026). Confirms nothing shipped touching typography token structure.
- [Figma, Kick-start your typography system in Figma](https://www.figma.com/best-practices/typography-systems-in-figma/). Figma's own three naming strategies, including "semantic" (element-based) naming as one legitimate option.
- [Figma, Variable fonts](https://www.figma.com/typography/variable-fonts/). General variable font support.
- [Figma Forum, Allow percentages for line height](https://forum.figma.com/suggest-a-feature-11/allow-percentages-for-line-height-21970). The open feature request and staff acknowledgement.
- [Figma Forum, Typography size variables: styles don't respect applied mode for variables](https://forum.figma.com/t/typography-size-variables-styles-dont-respect-applied-mode-for-variables/71168). The mode-preview gotcha, with Figma staff confirming it as expected behaviour.
- [Figma Forum, Using different text naming conventions instead of h1-h6 for design](https://forum.figma.com/t/using-different-text-naming-conventions-instead-of-h1-h6-for-design/53577). The designer/developer naming debate.
- [MDN Blog, Default styles for h1 elements are changing](https://developer.mozilla.org/en-US/blog/h1-element-styles/). The 2022 spec removal and the 2025-2026 per-browser rollout timeline.
- [Tokens Studio, typography token types](https://docs.tokens.studio/manage-tokens/token-types/typography/). The composite typography token and its numeric-to-string weight conversion.

**Commentary, labelled as such in the text**

- [Nathan Curtis / EightShapes, Typography in Design Systems](https://eightshapes.com/articles/typography-in-design-systems/). The reusability argument against element-named styles.
- [Nathan Curtis / EightShapes, Naming Tokens in Design Systems](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676). The redundant-qualifier anti-pattern behind *Where does the word default go?*.
- [Nate Baldwin, Design tokens: authoring vs consuming](https://www.designsystemscollective.com/design-tokens-authoring-vs-consuming-82762e699580). The observation that `default` recurs as a flashpoint because it is doing two different jobs at once.

**Toolkit knowledge base and sister pieces**

- `~/Projects/toolkit/knowledge/ui/design/visual.md#typography` and `~/Projects/toolkit/knowledge/code/figma-handoff.md#text-styles-to-type-tokens`; `~/Projects/toolkit/standards/code-standard.md` rules 1 and 54.
- [One type scale for an interface and its articles](one-type-scale-for-ui-and-content.md), [type on a phone](type-on-a-phone.md), [line height and letter spacing](line-height-letter-spacing-figma-to-css.md).
