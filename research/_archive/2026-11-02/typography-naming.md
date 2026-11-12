# Naming typography in a design system

What to call your text styles: the size words, whether weight belongs in the name, how many roles you need, and why not to name anything `h1`.

Researched August 2026. Token names, values and migration histories checked against each system's own documentation, repository, or developer docs. GOV.UK's type scale and Atlassian's weight figure were the two facts most likely to have moved since the last pass and were re-checked directly against both systems' current primary sources; both held. Three things did change: CMS.gov renamed its heading classes away from a numbered scheme, Figma clarified how weight variables surface in Dev Mode, and a claimed LSEG/Refinitiv counter-example did not survive a fresh check and has been replaced.

---

## What this answers

Setting up type styles is one of the first things you do in a design system and one of the last things you can change cheaply. The questions that come up, in the order they usually come up:

- What do you call it: `heading/lg`, `heading/24`, or `heading-03`?
- Should the style name say `bold`?
- How many roles does a system need? Is `subtitle` a real one?
- Can styles just be named `h1` to `h6` and be done with it?
- Where does the word `default` go, if anywhere?
- What happens when a second platform, iOS or Android, joins the picture?
- What can Figma actually do here in 2026?

Section 9 is a cheat sheet and section 10 is the short version.

---

## 1. Is there a shared grammar under all the disagreement?

**The short answer.** Yes. Almost every mature system builds a text style name from a role, a size, and occasionally a variant. The arguments below are all about the vocabulary that fills each slot, not about the structure itself.

Line up seven systems and the shared grammar is hard to miss:

| System | Example name | Role | Size | Variant |
|---|---|---|---|---|
| Shopify Polaris | `headingSm` | heading | Sm | none, a component prop overrides it |
| Atlassian | `font.heading.xxlarge` | heading | xxlarge | none |
| IBM Carbon | `heading-01` | heading | 01 | none |
| Material 3 | `title-medium` | title | medium | a parallel `emphasized` set |
| Microsoft Fluent 2 | `Body 1 Strong` | body | 1 | Strong / Stronger |
| Apple HIG | `Headline` | Headline | absent | none |
| GOV.UK | `govuk-heading-l` | heading | l | none |

Nobody puts colour in the name and nobody puts the typeface in the name; those are settled. Two of the seven, Material and Fluent, do carry a variant slot for emphasis, which is more than the previous count of one and is itself a finding: a semantic-emphasis variant is becoming a recognised third slot, not a Material peculiarity.

What is not settled, and what the rest of this guide works through: what vocabulary names the size, whether weight belongs in the name at all, how many roles should exist and whether `subtitle` earns one, whether the roles should just be `h1` to `h6`, what to call the ordinary unmarked version of a style, what happens when a second platform joins the picture, and what the tooling underneath all of this can actually do as of 2026.

**What to do.** Adopt the role-plus-size grammar without relitigating it. It is genuine, independently-arrived-at consensus across web, native and government systems with no shared lineage on this specific point, and time spent debating the structure is time not spent on the questions that are actually still open.

---

## 2. What words should name the size?

**The short answer.** Role plus t-shirt size for the styles designers pick from day to day, and plain numbers for the primitive scale underneath. Avoid naming a token after its own pixel value; the worked example below shows exactly what that costs even in the hands of a careful team.

Five approaches ship in production, and the differences between them are mechanical, not aesthetic.

**T-shirt sizes** (`sm`, `md`, `lg`, `2xl`) read instantly and map straight onto component props, so `size="md"` reads like English. Polaris uses them for its semantic layer; Atlassian spells the full run from `xxsmall` to `xxlarge`. Their weakness is insertion: the day something needs to sit between `md` and `lg`, there is no name for it, and the fix is either an ugly `mdlg` or a partial rename. Shopify hit a second, subtler version of the same problem: when t-shirt names appear at two layers at once, `font-size-sm` in the primitive scale and `headingSm` in the semantic layer, a reader can no longer tell whether the two "small"s are the same value. Shopify's own fix was to keep t-shirt names at one layer only, the curated semantic layer where the set of steps is a deliberate, stable decision.

**Plain numbers** are what sit underneath. Polaris sets `--p-font-size-100` as its base at 14px and extends down to `75` or up past `200` as needed. The number communicates position in the scale and nothing else, so a step inserted between 100 and 200 next year is simply `150`; nothing else renames. The cost is that newcomers sometimes assume the number is a pixel value, which it deliberately is not.

**Ordinals** are Carbon's approach: `heading-01` through `heading-07`, `body-01`, `label-01`, with headroom to keep adding. They are the least self-explanatory option and Carbon pays for that with unusually thorough documentation, permanently. In Carbon v10 the numbers had also quietly picked up a second meaning: `-01` meant the dense "productive" type set and `-02` meant the editorial "expressive" one. That convention was too opaque to survive; Carbon v11 merged the two sets into one collection, stripped the productive/expressive words out of the token names entirely, and reclassified the scale as Fixed (constant across breakpoints) and Fluid (interpolates between a minimum and maximum size by viewport).

**Pure roles** drop size words altogether. Material 3 names by role and only a coarse size qualifier (`display`, `headline`, `title`, `body`, `label`, each large/medium/small); Apple drops even that, so a style is just `Large Title`, `Title 1` to `Title 3`, `Headline`, `Body`, `Callout`, `Footnote`, `Caption 1` and `Caption 2`. An Apple style name says what the text is *for*; Dynamic Type decides how big it renders on the device in front of the reader. The trade is that roles cap the scale and demand a shared education: every new designer has to learn what separates a headline from a title before the name means anything.

**Value-literal naming**, where the token for 16px is called `16`, is worth walking through carefully because one of the most accessibility-scrutinised systems in the world does exactly this, and its own history is the clearest argument against it.

GOV.UK Frontend names its type scale points by pixel value: 16, 19, 24, 27, 36, 48, 80. A developer writes `govuk-font($size: 19)`. The logic is self-evidence: GOV.UK serves hundreds of loosely-connected government teams who may touch the system once a year, so a token called `19` needs no lookup table and a page audited against the spec needs no dictionary.

Here is what the current scale (GOV.UK Frontend v6, released February 2026) actually renders at a small screen size:

| Scale point | Large screens | Small screens | Usage | Is the name still true on mobile? |
|---|---|---|---|---|
| 80 | 80px | 53px | Exceptional circumstances only | Only above the breakpoint |
| 48 | 48px | 32px | `govuk-heading-xl` | Only above the breakpoint |
| 36 | 36px | **27px** | `govuk-heading-l` | No, and 27 is another point's own name |
| 27 | 27px | **21px** | Exceptional circumstances only | No |
| 24 | 24px | **21px** | `govuk-heading-m`, `govuk-body-l` | No, and it now matches point 27's mobile value |
| 19 | 19px | 19px | `govuk-heading-s`, `govuk-body` | Yes |
| 16 | 16px | 16px | `govuk-body-s` | Yes |

Two failures are visible and neither is hypothetical. On a small screen, point 36 renders at 27px, the name of a different scale point entirely, so a developer holding a spec that says "36" and measuring 27px has every reason to assume they have found a bug rather than read the table correctly. And points 24 and 27 both resolve to 21px on mobile, so two differently-named tokens produce one identical value at exactly the viewport carrying most public-sector traffic.

The values move over time, too. GOV.UK Frontend v6 raised the small-screen sizes for legibility (24 and 27 moved from 18px to 21px, 36 moved from 24px to 27px) and removed scale point 14 outright. When the name is the value, changing the value means either renaming the token everywhere across government or living with a name that has quietly stopped telling the truth. GOV.UK chose the second option, and this pass found the same v6 values still current: nothing has moved again since the prior check.

**In fairness**, notice what v6 did not touch. Points 16 and 19 hold one value at every breakpoint, so the two sizes that carry most body copy have honest names and the self-evidence argument holds completely for them. Value-literal naming is not an absurd choice; it is a bet that values will not move, and it is a bet GOV.UK has now partly lost (three of seven points) and partly won (two of seven, the two doing the most work).

The systems that considered value-literal naming and declined said so on the record. Polaris chose increments of 100 explicitly so the number would communicate position rather than pixels. Atlassian's spacing tokens encode a ratio, `space.100` is 8px because it is 100 percent of the base, so the number survives a change to the base without a rename.

**What to do.** Role plus t-shirt size for the semantic styles, plain numbers for the primitives underneath: Polaris, Primer, Atlassian and Material each implement some dialect of this two-layer split, arrived at independently enough to count as real consensus rather than one decision copied five times. Reserve value-literal naming for the narrow case GOV.UK actually occupies (a single-platform system with quasi-contractual, rarely-touched values and an occasional-user audience), and expect the names to go false at breakpoints even there. If a team wants pixel-awareness without the naming cost, put the value in the token's description field, which Figma shows on hover, rather than in the name itself.

---

## 3. Should the weight be in the name?

**The short answer.** No. Bake a sensible weight into each semantic style, keep literal weight primitives underneath for engineers to compose with, and add a semantic alias like `weight/emphasis` if the system runs on a variable font.

This is the most consequential naming decision in the guide, and the industry is more unanimous about it than the surface debate suggests.

| Approach | Example | Who ships it | Survives a weight rebrand? |
|---|---|---|---|
| Literal weight in the name | `-semibold` | Primer primitives | No, every name is now wrong |
| Semantic strength in the name | `Body 1 Strong`, `emphasized` | Fluent 2, Material 3 | Yes |
| Baked in, no weight word at all | `Title Medium` | Material, Apple, Atlassian, GOV.UK, Carbon, Polaris | Yes |
| Weight as a free modifier on every size | `.fw-bold` on any `h1` to `h6` or `.display-*` | Bootstrap | No, and the combinations multiply uncontrolled |

**Literal weight names** are transparent and match how CSS and font files already name things, which engineers appreciate on sight. Primer's primitives are the clean reference: `--base-text-weight-semibold` resolves to 600.

The brittleness shows up under change, and Atlassian is the clearest worked case available. Atlassian Sans supports exactly three weights: 400, 500 and 653, confirmed current at Atlassian's typography General Availability release this year. There is no 700. **653 is what the system calls bold**, and every heading token from `heading-small` up to `heading-xxlarge` uses it. A token named `-bold` resolving to 653 is defensible. A token named `-semibold` resolving to 653 is not, and no literal name can express Atlassian's own documented fallback rule, that semibold drops to bold in any typeface that lacks the custom weight.

**Semantic strength names** let the value move underneath the name. This is the same logic that won for colour tokens, and HTML has embodied it for thirty years in `<strong>`. Fluent 2 names it directly: `Body 1 Strong` and `Subtitle 2 Stronger` sit next to their unmarked siblings, and Microsoft can retune what "Strong" resolves to per platform (Segoe UI on web and Windows, San Francisco Pro on iOS and macOS, Roboto on Android) without touching a single style name.

The larger-scale version of the same move: when Material 3 needed heavier text across the whole scale, Google did not add `-bold` suffixes to fifteen existing styles. It shipped a parallel **Emphasized** set, the same fifteen roles at a higher weight and slightly different metrics, exposed in Compose as `titleLargeEmphasized`. The name describes the *purpose* of the heavier cut, so each style's weight can be retuned independently without a rename cascading through the catalogue.

**Baked-in weight** is the pattern most often misread, so it earns a precise definition: the weight is an intrinsic, non-configurable property of the named style. No weight word appears in the name because there is nothing to choose; picking the style *is* picking the weight, and a different weight is a different style, not a modifier on this one.

Across five systems that is: Material 3's `Title Medium` is always weight 500 and `Body Large` is always 400 (the "Medium" in the name is a size word, not the weight word, which is why this trips almost everyone reading it for the first time). Apple's `Headline` is semibold at body size and `Body` is regular, so the weight difference *is* the entire distinction between the two names. Atlassian has no `font.heading.large.bold`, because a non-bold heading of that role does not exist in the system. GOV.UK's `govuk-heading-l` is bold, full stop, with bold body text living as a separate utility class rather than a heading variant. Carbon fixes each token's weight internally and documents it in the spec sheet, never in the name.

Polaris adds one escape hatch: heading variants carry a set weight, but the `Text` component exposes a `fontWeight` prop that can override it. That is not a compromise of the principle, it is what keeps the exception from turning into workaround culture, which is exactly what section 4's coverage figure measures.

For the counter-example, Bootstrap is the clean, well-documented case: seven `fw-*` utilities (`fw-lighter`, `fw-light` 300, `fw-normal` 400, `fw-medium` 500, `fw-semibold` 600, `fw-bold` 700, `fw-bolder`) apply to any element, including the `h1` to `h6` and `display-1` to `display-4` heading classes. Nothing in the system says which combination belongs where, so `<h1 class="display-3 fw-bold">` is legal and common, and the number of visually distinct headings in a given codebase is bounded only by how many combinations someone happened to type.

**Why baked-in wins**, as three mechanisms rather than an assertion. It makes the style picker a list of finished decisions instead of raw ingredients, so there is one thing to get right instead of two. It makes decorative bolding structurally harder, since there is no bold knob sitting next to every size, which is governance by constraint rather than by guideline. And it turns a weight rebrand into a single value change rather than a rename across the catalogue, which is exactly what let Atlassian move its bold from 700 to 653 without touching a token name anywhere.

**The honest costs.** Legitimate exceptions have nowhere to go without an escape hatch, which is why Polaris shipped one. The style count grows if a role genuinely needs two weights, which is why Material had to publish fifteen more Emphasized styles rather than flip a switch. And weight becomes invisible in the name, so a designer reading `Title Medium` cannot tell what weight they are applying without opening the spec or the Dev Mode panel (see section 8 for exactly how reliable that panel is in 2026).

**What to do.** Bake a sensible weight into each semantic style, keep literal weight primitives below it (`weight/regular`, `weight/medium`, `weight/semibold`, `weight/bold`), and add a semantic alias such as `weight/emphasis` the moment a variable font or a rebrand is plausible. Ship the escape hatch on the component API rather than assuming the exception will not arise: the measured cost of skipping it is not discipline, it is Polaris's own 8 percent, covered next.

---

## 4. How many roles do you need, and is `subtitle` one of them?

**The short answer.** Four to six roles for most teams. A role earns its place through distinct *behaviour*, not through being a different size, and by that test `subtitle` fails more often than it survives, though it is not the unanimous deletion it first looks like.

Line the shipping systems up by role count and a ladder appears:

| System | Roles | Rough picker size |
|---|---|---|
| Polaris | heading, body | about 10 styles |
| Spectrum | heading, body, detail, code | t-shirt sizes per role |
| Atlassian | heading, body, code, metric | about 12 styles |
| Fluent 2 (web) | caption, body, subtitle, title, large title, display | about 15 styles |
| Material 3 | display, headline, title, body, label | 15 baseline, 15 more Emphasized |
| Carbon | heading, body, body-compact, code, label, display | about 20 styles |
| Apple HIG | 11 role-only styles, no size axis | 11 |

Three things fall out of that table.

**The picker ends up roughly the same size either way; only the location of meaning moves.** Polaris's two roles expand into about ten styles through the size axis. Material's five roles times three sizes lands at fifteen. Apple's eleven role-only styles are eleven, full stop. These cover comparable products with ten to twenty entries regardless of the split. The real choice is whether meaning lives in the role slot or the size slot: Apple pushed everything into roles because Dynamic Type owns sizing on its behalf; Polaris pushed everything into sizes because the `Text` component's props carry the remaining nuance. Naming this out loud defuses a lot of the argument: nobody is choosing more or less complexity, they are choosing which slot holds it.

**The historical direction is consolidation, and the two biggest players prove it in public.** Material 2 shipped thirteen styles: `headline1` through `headline6`, `subtitle1`/`2`, `body1`/`2`, `button`, `caption`, `overline`. Material 3 collapsed all thirteen into five roles and deleted `subtitle` and `overline` outright, with no direct replacement for either name.

Shopify ran the same arc and published the measurement behind it, which is why theirs is the more useful story. Six rigid type components (`DisplayText`, `Heading`, `Subheading`, `Caption`, `TextStyle`, `VisuallyHidden`) collapsed into one `Text` component in Polaris v10, after Shopify found roughly **8 percent coverage** of typography tokens in custom components across the codebase. Teams were not skipping the taxonomy out of laziness; they were hard-coding CSS to get around it, citing a lack of flexibility in the six components, thin guidance on designing with type, and too narrow a range of weights and sizes. Developers who tested the single `Text` component in Shopify's own research preferred it as easier to use and understand. Polaris v11 later removed the six legacy components entirely.

That 8 percent is the single most useful number in this guide, and the lesson is counterintuitive: **a low adoption number is usually evidence the system is wrong, not that the users are undisciplined.** The corrective move is to loosen the taxonomy before reaching for enforcement.

**A role earns its existence through behaviour, not size, and the systems that keep or delete roles show this from both directions.** `label` survived Material's consolidation because it is not small body text: it is 500 weight against body's 400, tighter tracking, single-line UI chrome with its own wrapping and punctuation rules. That is behaviour a size number cannot encode. `code` survives everywhere a role list exists because a font-family switch is inherently a role, not a size. Atlassian's `metric` is the clean product-specific example: dashboard figures get their own scale (three sizes as of the 2026 General Availability release) separate from headings, so a large count reads as a figure rather than a section title, and can carry tabular figures a heading style should not. Carbon keeps `body-compact` beside `body`, identical except line height, because dense UI and readable prose are a genuine behavioural split, not a cosmetic one.

The deleted roles show the inverse, mostly. `subtitle` is the textbook over-granular trap: in practice a subtitle is usually a smaller heading or a strong large body wearing a different name, a recombination of existing slots rather than a distinct behaviour. `overline` is the subtler lesson, because it *does* have a real, describable behaviour (uppercase, wide tracking) and Material deleted it anyway, on the reasoning that a behaviour used in one or two components can live as a component-level style rather than a system role; system roles are reserved for behaviours that recur everywhere.

Here the roster complicates its own consensus, which is worth stating plainly rather than smoothing over. Fluent 2 keeps a `Subtitle` role today, not as a historical leftover but as part of its current 2026 type ramp, with a defined weight on web (Semibold, distinct from Body's Regular) that does give it a behavioural difference from Body. But Fluent's own documentation gives no stated rule for when to reach for Subtitle over a strong Body or a small Title, and the role does not exist at all on iOS or Android, only on web, Windows and macOS. That is not a clean counter-example so much as a partial one: it has a real value difference but no published behavioural rule and it fails the portability test in section 7. Read together with Material's outright deletion, the fair verdict is that `subtitle` remains a live disagreement between two well-resourced systems rather than a settled question either way, and a team adopting it should be able to state the behavioural rule Fluent itself does not publish before shipping the role.

A newer, better-defined counter-example to the "size masquerading as a role" critique: Material 3 Expressive, rolled out through 2026 on Wear OS, added roles that clearly are not sizes. **Numerals** is a role specifically for numeric strings that never need localisation, letting a watch face render bigger, more stylised digits than body text could support if it had to reserve space for translated words. **Arc Text** is a role for surface titles that follow the curve of a round watch face. Both exist because of behaviour a size cannot express, and both are a cleaner illustration of "earns its place through behaviour" than a size-based role could ever be.

**Four tests to apply to a proposed role.** If two candidate roles would ever share identical values *and* identical usage rules, merge them. If a role's whole definition is "a smaller version of X," it is a size of X, not a role. If explaining when to use it takes a paragraph of exceptions, it is drawn in the wrong place. And adding a size to an existing role beats adding a new role, which beats adding a weight variant to every size in an existing role.

**What to do.** Four to six roles, found by auditing real screens for distinct text *behaviours* rather than by reasoning about it in the abstract. Treat any future role proposal against the four tests above. Treat a low coverage number as a design smell rather than a training problem, per Shopify's number. And on `subtitle` specifically: default to not shipping it, but if a team wants one, require a written behavioural rule before it ships, since neither of the roster's two answers (delete it, keep it without a rule) is one this guide can call settled.

---

## 5. Can you just name the styles `h1` to `h6`?

**The short answer.** No, on four independent lines of evidence. But the position that designers should ignore heading levels entirely is also wrong, and Figma's own best-practice guidance is honest enough to list element-based naming as one of three legitimate options, which is worth sitting with before dismissing it.

The shortcut is tempting: name the Figma styles `h1` through `h6` and designers, engineers, SEO and screen readers all appear to share one vocabulary for free. Figma's own best-practices guide lists exactly this as a valid "semantic" naming strategy, alongside size-based and purely descriptive naming, without picking a winner.

**The h1-to-h6 school gets something real right.** Heading elements are load-bearing. Screen reader users navigate by jumping heading to heading, skipped levels cause genuine confusion, and accessibility guidance expects a coherent outline on every page. A Figma community thread captures the underlying tension well: a designer argued for pure size names with element choice left to developers, and a developer replied that the intended element has to travel with the design or the outline becomes guesswork after handoff. Both are right about something. Any naming scheme that lets a designer forget h-tags exist will ship an inaccessible product regardless of what the styles are called.

Naming the styles after the elements still fails, on four separate kinds of evidence.

**The system that tried it renamed away from it.** Material 2's scale was, literally, `headline1` through `headline6`. Material 3 deleted those names entirely in favour of role times size. Angular Material today ships only a *default, overridable* mapping from role to element (`display-large` suggesting `<h1>`, `headline-small` suggesting `<h6>`, with title, body and label mapping to no element at all), documented on `material.angular.dev`. The association survives as a configurable suggestion, never as the name itself.

**The accessibility-first systems decouple on purpose, while still making h-tags mandatory.** This carries the most weight, because these teams operate under the strictest obligations in the roster. GOV.UK instructs teams to mark headings up semantically first and apply a size class second, and the same element takes different classes by context: a long-form guidance page starts its `<h1>` at `govuk-heading-xl`, a question page starts its `<h1>` at `govuk-heading-l`. One element, two visual treatments, chosen per page type, something that would be structurally impossible if the style itself were named `h1`.

CMS.gov states the principle about as explicitly as a design system can, and its own history is a live worked example of the naming trap it now avoids. Its heading classes originally shipped as `.ds-h1` through `.ds-h6` (plus `.ds-display` and `.ds-title` above them), each tied to a semantic level by name. In version 2.5.0, CMS.gov renamed the entire set to a size-only scale, `.ds-text-heading--5xl` down to `.ds-text-heading--sm`, explicitly because, in the team's own words, semantic heading levels in a document do not always match the visual hierarchy a design calls for. The old-to-new mapping (`.ds-display` → `.ds-text-heading--5xl`, `.ds-title` → `.ds-text-heading--4xl`, `.ds-h1` → `.ds-text-heading--3xl`, and so on down to `.ds-h6` → `.ds-text-heading--sm`) is published as a migration guide in its own right, which makes CMS.gov the clearest available before/after case of a real system hitting this exact trap and correcting it. CMS.gov also ships the escape hatch that makes decoupling liveable day to day: a `ds-content` wrapper class that applies a standard, automatic level-to-size mapping for pages that are mostly prose and do not need a per-heading decision.

**The component systems decouple through the API.** Polaris's `Text` component requires an `as` prop precisely because the visual variant and the element are independent values: `<Text variant="headingLg" as="p">` is legal, common, and appears in Polaris's own migration documentation.

**The structural reason all four converge** is stated most crisply in commentary, credit where due: Nathan Curtis observes that a component appears on many pages, and the heading that is the largest thing on one screen is the third-largest thing on another, so a style welded to `h1` cannot be reused across the screens a real design system has to serve.

**Four ways h-names go wrong**, each worth naming because each is a real, distinct failure.

The **size-driven element** is the central one and it is silent. A designer picks "h3" because it happens to be the right size for the layout, an engineer faithfully ships `<h3>`, and the document outline breaks somewhere no one is looking. The page still looks correct; only screen reader navigation degrades. The naming created the exact bug it was meant to prevent.

The **second grammar** problem: h-names cap at six and cover headings only, so body, label and code text need an entirely different vocabulary, and the picker ends up speaking two languages that do not compose.

The **untranslatable name**: no h-elements exist on iOS or Android, so an h-named style library cannot port to a second platform, which breaks the cross-platform parity that motivates role-based naming in the first place (section 7).

The **faithful agent**: in 2026 this failure got sharper rather than staying theoretical. A legacy style named `styles/h2` handed to a coding agent through Figma's code layers or an MCP server gets translated into a hard `<h2>`, faithfully, everywhere, including the places where the actual outline calls for something else (more in section 8).

Even the platform itself has stopped coupling elements to sizes. Until 2022 the HTML spec's outline algorithm auto-shrank `<h1>` when nested inside `<article>`, `<aside>`, `<nav>` or `<section>`; that algorithm was removed from the spec that year. Browsers took longer to catch up: Firefox began shipping the removal of the matching UA-stylesheet styling through its 2025 beta and stable channels, Chrome has carried deprecation warnings since version 136, and Safari has the change tracked but not yet shipped as of this pass. Even the browsers agree an `<h1>`'s size should not be a side effect of its position in the document, they are just not finished agreeing on when.

**What to do.** Name styles by role and size, never by element. Carry the intended element as separate metadata: an `as` prop in code, an annotation or a component property in Figma. Publish a default mapping table in Angular Material's style, overridable rather than load-bearing. Then make the document outline a review checklist item, since the naming no longer enforces it for you: one `<h1>` per page, no skipped levels. If most pages are prose-heavy, CMS.gov's `ds-content` pattern gives the convention back without giving up the decoupling that makes the rest of the system work.

---

## 6. Where does the word `default` go?

**The short answer.** Leave it out. The unmarked name *is* the default; only deviations from it carry a modifier.

This eats a surprising share of naming meetings, and most of that time dissolves once it is clear that three different things are being argued about under one word.

| What people mean by "default" | Who ships it | Verdict for typography |
|---|---|---|
| The unmarked name is the default | Carbon, Material, GOV.UK, Primer | The right answer |
| The centre of a spectrum, subtle and strong on either side | GitLab Pajamas | Coherent for colour and border tokens, a poor fit for type |
| A leaf name Figma's folder structure forces on you | Figma libraries generally | Avoid it, by flattening with a hyphen |

**Default by omission** is the dominant pattern once it is named. Carbon renamed its v10 "long" body styles to plain `body` and its "short" ones to `body-compact`, so the everyday reading style owns the bare name and the deviation wears the badge. Material's fifteen baseline styles carry no marker at all; only the heavier set is marked `emphasized`, and nobody types `title-medium-baseline`. GOV.UK's `govuk-body` is the default paragraph style, with `-l` and `-s` doing the marked work at the sizes either side of it.

Primer encodes the same idea structurally, with a documented trick: a token group holds a default value and its sub-values side by side (`bgColor.accent` next to `bgColor.accent.muted`) by authoring the default under a special reserved key that gets stripped out of the emitted name entirely. The default exists in the authoring data model, never as a word in the shipped token.

**GitLab Pajamas** is the useful counter-case for where `default`-as-a-word does earn its place. Its border tokens run `default`, `subtle` and `strong` as three genuine points on one visual-weight spectrum, not one unmarked baseline with one deviation. That works for a property like border weight or background emphasis, where "louder" and "quieter" than the default are both real, common states. It maps poorly onto type, where there usually is not a "quieter than body text" role that needs its own name in the same way a subtle border does.

The commentary agrees with what the systems above already do. Nate Baldwin's writing on token authoring versus consuming treats the word `default` as one of the recurring flashpoints in naming discussions precisely because it is being asked to do the GitLab job and the Carbon job at once, and a team that has not separated the two ends up debating past itself. Curtis's naming essay names the same pattern from the other side, showing a token padded with segments like `default` and `on-light` against a clean equivalent, and recommending only as many qualifying segments as are needed to distinguish real intent.

**Why omission wins** is about adoption, not elegance. The shortest name is the path of least resistance: if `body/md` is one keystroke easier than `body/md-strong`, the default becomes the thing people reach for without thinking, which is the naming-level version of the same argument baked-in weight makes in section 3. Explicit `default` also ages badly the moment a system goes multi-brand, since brand B's default weight can be brand A's emphasis, and a token literally named `default` is now silently asserting something that is mode-dependent.

**The Figma-specific trap**, worth understanding because it is a genuine tool constraint rather than a stylistic preference, and it is why `default` shows up in so many community libraries that never meant to argue for it. Figma's style paths treat each path segment as either a folder or a leaf style, never both at once, so a style living at `body/md` cannot coexist with sibling styles nested inside a `body/md/…` folder. Wanting `body/md` plus a strong variant of it forces a choice:

| Option | Figma names | Code tokens | Cost |
|---|---|---|---|
| Flatten with a hyphen | `body/md`, `body/md-strong` | `bodyMd`, `bodyMdStrong` | None worth naming |
| Push everything a level down | `body/md/default`, `body/md/strong` | `bodyMdDefault`, `bodyMdStrong` | Longer names, `default` sorts alphabetically into the middle of its own siblings, and the word leaks into code that the omission convention says should never contain it |

The hyphen wins, and the deciding reason is the last cell: the folder version forces the Figma name and the code name to diverge, which is the one outcome this whole guide keeps arguing against.

**One piece of vocabulary hygiene**, because three words tangle here and the confusion is expensive once it ships. `base` is the root value a scale grows from, so it anchors a scale rather than naming a variant. `default` is the unmarked member of a variant group. `regular` is a font weight, 400, and nothing else. Using `regular` as a generic "the ordinary one" word collides with the weight vocabulary and produces names like `body/md/regular`, where it is genuinely ambiguous whether the word means weight 400 or "the unmarked variant." In most typefaces those two happen to coincide, which is exactly what hides the ambiguity until the font changes and they stop coinciding.

**What to do.** Default by omission, always, and hyphen-flatten in Figma so the tool is never in a position to force the word into a name. Write the `base` / `default` / `regular` distinction into the naming document explicitly, because it is the vocabulary collision most likely to resurface after the rest of the decision has already been made and shipped.

---

## 7. What changes when you add a second platform?

**The short answer.** For most teams: separate libraries per platform, identical role names across them, primitive values synced by a token pipeline. The role name is the invariant; only the values and the typeface underneath it change.

Three patterns exist in production, and all three are really answers to one Figma constraint: the style picker effectively shows one level of grouping at a time, so structure decides how painful the picker becomes as the library grows.

| Pattern | Style count | Picker experience | Best for |
|---|---|---|---|
| Platform folders inside one library | Multiplies by platform | Degrades with scale | A small team in one file |
| Separate libraries per platform | Multiplies, but hidden per project | Stays clean, enabled per project | Designers who work one platform at a time |
| One set of names, values per mode | Fewest names of the three | Clean, with a preview gotcha (section 8) | Cross-platform parity as a hard requirement |

**Platform folders**, `Web/Heading/Md` sitting next to `iOS/Heading/Md`, are cheap to set up and the ordering choice is real: platform-first collapses everything irrelevant into closed folders, suiting people who work one platform at a time; element-first keeps a role's platform variants adjacent, suiting side-by-side comparison work. Either way the style count multiplies and picker fatigue arrives on schedule as the library grows.

**Separate libraries** are Figma's own recommendation for larger teams: mobile-native styles in one library, responsive web in another, each enabled per project rather than living in one bloated file. It is the cleanest defence against picker overload available. The price is that shared primitives now have to be kept in sync by hand or by pipeline, which is exactly the job a token pipeline exists to do, so the real price is "have a pipeline."

**One set of names with values per mode** means switching a file's mode resizes `heading/lg` in place with no duplicate style at all: fewest styles, most stable names, and one real gotcha waiting in section 8.

Whichever pattern a team picks, one rule holds regardless: **the role name is the invariant.** `heading/lg` should mean the same thing on web, iOS and Android even while the values underneath it differ by platform. Microsoft's Fluent 2 makes this concrete rather than aspirational: the same core roles (Caption, Body, Title, Large Title, Display) carry different native typefaces and pixel ranges per platform, Segoe UI on web and Windows, San Francisco Pro on iOS and macOS, Roboto on Android, with the platform-native font doing the work of feeling native while the role vocabulary stays constant across all of them. On Apple platforms specifically, the practical version of this rule is to map roles onto Dynamic Type text styles and let the OS own the scaling; hand off style names, not pixel values, except for the rare case of deliberately fixed text. This portability is the strongest practical argument for role-based naming in the whole guide, and the most direct argument against h-element names, which cannot exist off the web at all.

**The rule gets stress-tested outside the Latin-script world, and mostly survives.** Ant Design's own font specification recommends a base size of 14px with a 22px line height, a ratio near 1.57 that runs above common Latin defaults, and gives a stated reason: legibility at a typical 50cm screen viewing distance and a roughly 0.3-degree reading angle on common monitors. It also writes down restraints Western systems rarely bother to state explicitly: keep the scale to three to five sizes outside of dedicated display pages, and hold weights to regular (400) and medium (500) for most text, reserving semibold (600) specifically for bold English words mixed into CJK copy.

Read that source carefully, because it is easy to over-claim what it says. Ant Design presents these numbers as general guidance rooted in reading distance and a "natural law/pentatonic scale" design philosophy, not as a property of CJK script itself. The explanation commonly attached to it elsewhere in typesetting circles, that CJK glyphs carry more strokes and want more leading while heavy weights fill dense glyphs in faster than they darken Latin letterforms, is commentary layered on top rather than something Ant Design's own spec claims.

What is portable is exactly the role grammar: `heading/lg` and `body/md` translate to a CJK product unchanged. What does not port is the assumption that every role needs the same variant axes everywhere. An italic emphasis variant is close to Latin-only; a weight ramp that reads as five distinct steps in a Latin face may read as three usable ones in a CJK face. That is one more argument, on top of section 3's, for keeping weight and style words out of the semantic names in the first place, since the number of weights a face can usefully carry is itself platform- and script-dependent.

**What to do.** Separate libraries per platform with identical role names, primitives kept in sync by the pipeline. This depends on how a team actually works day to day: if people design one platform at a time, separate libraries cost nothing and solve picker bloat permanently. If cross-platform parity is a hard requirement and designers compare platforms side by side daily, take the one-set-of-names-per-mode option and accept the preview gotcha in section 8. Platform folders inside a single library are defensible only for a small team, and should be revisited at the first sign of scroll fatigue in the picker.

---

## 8. What can Figma actually do here, in 2026?

**The short answer.** Variables are the primitive layer, text styles are the composite layer, and that split is the settled architecture rather than a stopgap waiting on a platform update. Four rough edges are worth knowing exactly, not approximately, before committing a naming scheme to them.

Figma shipped typography variables on 16 April 2024, covering font family, weight and style, size, line height, letter spacing, and paragraph spacing and indent. A variable still stores one value; a text style bundles five or more of them together. So the text style remains the composite object in token terms: primitive variables bind inside semantic text styles, and the style is what a designer actually applies. GitHub Primer's public stance, styles now and variables once the platform's own composite support catches up, reads as close to an industry-wide position as this topic has.

**Four edges worth knowing precisely.**

*Font weight: string values in styles, and a Dev Mode split that matters more than it first looks.* A text style's own weight field only accepts a string ("Semibold"), never a number, which is why Tokens Studio ships a conversion layer mapping numeric weight tokens to matching string names on the way in. Underneath the style, a *variable* bound to weight can be either type, string or number, and the two behave differently the moment they reach Dev Mode. A number-type weight variable surfaces as a real, inspectable reference in the generated code, `font-weight: var(--Thin-100, 100);`. A string-type weight variable does not: Figma's own Dev Mode documentation states plainly that string variables for font weight are not passed through as a reference at all. If the string happens to match a valid named weight for the applied font, Dev Mode silently resolves it to the matching literal number with no variable in sight; if it does not match, Dev Mode falls back to a bare `font-weight: 400;` with no warning that anything went wrong. The practical implication is specific: for weights worth surfacing to engineering as real tokens, bind a number-type variable, not a string one, and treat a string weight variable as a design-time convenience only.

*Percentage line heights still do not bind cleanly.* Figma's number-type variables interpret a line-height number as pixels, with no relative-percentage option; a request to support percentage line-height variables has been open on Figma's own forum and was acknowledged by staff as "on our radar" as recently as mid-2025, without a shipped fix by this pass. A style with a relative line-height (120% of font size, say) cannot have that relationship expressed as a variable today; it can only be pinned to a specific pixel value per size, which then has to be re-pinned by hand if the size ever changes.

*The mode-preview gotcha*, which is the specific cost of section 7's third pattern. A style picker previews the value from the file's *default* mode, not whichever mode is actually applied to the frame being viewed: a style bound to a Mobile mode at 20px and a TV mode at 40px previews at 20px in the picker even while a TV-mode frame renders it correctly on canvas at 40px. This is documented as reproducible behaviour across multiple threads on Figma's own forum; the canvas is right and only the preview thumbnail misleads. The practical workaround the community and Figma's own staff both converge on is documenting the other modes' values directly in the style's description field, since the picker will not show them.

*Variable fonts strain a single numeric weight variable structurally, not just cosmetically.* One numeric weight variable cannot express the combined weight-plus-width-plus-slant recipes some variable fonts ship, and the specific combination a brand wants often matches none of the font's own named instances. Atlassian's 653 is exactly this, in production: it is the system's bold, it is not 700, and it sits alongside only 400 and 500 in the same family, so a token literally named `-semibold` or `-bold` cannot say what it actually is. A semantic alias like `weight/emphasis`, pointed at whatever numeric recipe the brand needs this year, is the only naming shape that survives a value like 653, which is why section 3 treats the alias as non-optional the moment a variable font enters the picture.

**On the search for anything new in 2026.** Config 2026 shipped Motion (an animation timeline with keyframes and Dev Mode-inspectable timing variables), Code Layers, custom shaders, agents and generative plugins. Checked directly against Figma's own "What's new from Config 2026" changelog, none of it touches typography token structure, text style mechanics, or any of the four edges above. That absence is itself the finding worth recording: two years after typography variables first shipped, nothing has moved toward Figma-native composite typography variables (a single variable that carries a full type-style bundle the way a text style does today), so a naming scheme built around their eventual arrival is planning around a feature with no announced date.

**And the reason naming got more urgent this year, not less.** AI agents turned name parity from a courtesy into a functional requirement. With code layers, bidirectional handoff, and MCP servers letting coding agents read a Figma file directly, style and token names are now the literal interface an agent uses to map design onto code. A style named `text/body/md` that matches a code token `--text-body-size-medium` gets translated correctly and confidently. A style named `Paragraph 2 (new) FINAL` gets translated creatively, which is a polite way of saying wrong. And a legacy style still named `styles/h2`, the exact trap section 5 names as "the faithful agent," gets translated into a hard `<h2>`, faithfully, everywhere it appears, including every place the actual document outline needed something else.

**What to do.** Build primitives as variables and semantics as text styles, bind every field that can be bound, and plan around the composite living at the style layer for the foreseeable future rather than the near future. Bind weight with number-type variables specifically where Dev Mode visibility matters. Treat inherited h-named styles as urgent technical debt rather than cosmetic tidying, because agent tooling has made a bad name actively harmful rather than merely untidy, and that is the argument to bring to engineering if a naming cleanup needs budget to happen.

---

## 9. The cheat sheet

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

## 10. The short version

Role plus t-shirt size for the styles a designer picks from; plain numbers for the primitives underneath. Never name a token after its own pixel value unless the constraints genuinely match GOV.UK's (single platform, rarely-touched, quasi-contractual values), and even GOV.UK has watched three of its seven scale points stop being true at mobile widths.

No weight words in semantic style names. Bake the weight in, keep literal weight primitives below it, and add a `weight/emphasis` alias the moment a variable font enters the picture, because Atlassian's bold is 653 and no literal name can say that.

Four to six roles, found by auditing real screens for distinct behaviours rather than sizes. A role earns its place through behaviour: `label`, `code` and `metric` all pass that test; `subtitle` usually fails it, though Fluent 2's current, unresolved use of it is reason enough not to call the question fully closed.

Never name a style after an HTML element. Carry the intended element separately, as a prop or an annotation, and publish a default (overridable) mapping table the way Angular Material does. CMS.gov's own migration away from `.ds-h1`-style classes is the cleanest evidence that a real system hit this exact trap and fixed it.

Default by omission. The unmarked name is the default, and only deviations get a modifier. Hyphen-flatten in Figma so the tool cannot force the word into a name for you.

Separate libraries per platform, same role names, primitives synced by a pipeline, unless daily cross-platform comparison makes one-set-of-names-per-mode worth its preview gotcha.

In Figma, variables are primitives and styles are composites; that is the settled state, not a stopgap. Bind weight as a Number variable if Dev Mode visibility matters, because a String weight variable will not surface as a real token in generated code.

And if adoption is low, the naming system is usually wrong, not the team using it. Shopify measured 8 percent coverage and rebuilt the taxonomy rather than training harder against it.

---

## 11. What to re-check later

- **GOV.UK's type scale and Atlassian's weight figure**, the two facts flagged as fast-moving in the last revision, were both re-checked directly against primary sources this pass (GOV.UK Frontend v6.0.0, released February 2026; Atlassian's typography General Availability release) and found unchanged. Re-check both again before quoting either in a document with a long shelf life; they have moved before and the underlying systems are both still actively iterating on typography.
- **CMS.gov's heading class names changed** since the version of this guide that first cited them, from `.ds-h1`-style names to `.ds-text-heading--5xl`-style names in version 2.5.0. This guide now cites the current names; if a linked project still shows the old ones, it is on an older CMS Design System version.
- **The LSEG/Refinitiv counter-example was replaced.** An earlier version of this guide attributed a weight-multiplies-by-size pattern to LSEG/Refinitiv; a direct check of that system's current typography documentation this pass found baked-in weight per style instead, contradicting the claim. Bootstrap's `fw-*` utilities replace it as the counter-example, verified directly against Bootstrap's own current documentation.
- **Figma's four rough edges** (string-only weight in styles, the string/number Dev Mode split, percentage line height, the mode-preview gotcha) are all open items the platform may close. Config 2026 closed none of them; that is a finding, not an oversight, and worth re-checking at the next major Figma release rather than assumed permanent.
- **`subtitle`'s status is a live disagreement, not a settled one.** Material deleted it; Fluent 2 keeps it on three of five platforms with no published usage rule. Re-check whether either system moves before treating this guide's four-to-six-role recommendation as fully closed on the question.
- **The Ant Design cross-script guidance** rests on Ant Design's own specification, which gives numbers and a stated rationale (reading distance, not CJK script mechanics) but is still one system's word. A second source, ideally one reporting reader outcomes rather than another team's convention, would strengthen section 7 before it drives an architecture decision.
- **Text style names were outside the 5 October 2026 Code Connect sweep.** That sweep read how 23 public kits name component properties and layers, not their text styles, so nothing in it confirms or contradicts the style names in this guide.
- **Evidence quality, stated plainly.** Shopify's 8 percent is the one hard measurement in this guide, and it measures developer adoption, not a reader outcome. No system in the roster publishes user research on whether its typography naming scheme produced a better reading experience. Treat everything here as engineering-quality argument, which is what the evidence actually is, rather than as a user-experience claim.

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
- [`@atlaskit/tokens` typography artifacts](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@5.6.1/dist/types/artifacts/themes/atlassian-typography.d.ts). The generated typings behind the weight-653 claim.
- [Atlassian, Typography reaches General Availability](https://atlassian.design/whats-new/new-typography-in-general-availability/). Confirms 400/500/653 current at GA, the Jan 2026 migration deadline, the Metric component's three sizes.
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
- [Nathan Curtis / EightShapes, Naming Tokens in Design Systems](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676). The redundant-qualifier anti-pattern behind section 6.
- [Nate Baldwin, Design tokens: authoring vs consuming](https://www.designsystemscollective.com/design-tokens-authoring-vs-consuming-82762e699580). The observation that `default` recurs as a flashpoint because it is doing two different jobs at once.
