# Naming text styles: tags, defaults and a second platform

Why a text style is never named after an HTML element or called `default`, how names carry to a second platform, and what Figma can and can't hold in 2026.

Part 2 of 2. [Part 1](../foundations/naming-text-styles.md) covers the naming grammar, the words for size, weight and how many roles.

A team has settled on role-plus-size names, `heading/lg` and `body/md`. Then the questions that are left arrive one at a time. A developer asks which `<h>` element `heading/lg` is. A designer wants a bold variant beside `body/md`, and Figma will only allow it as `body/md/default`. An iOS team joins. And a coding agent, reading the file through an MCP server, turns a legacy style called `styles/h2` into `<h2>` on every page.

---

## What this answers

- [Heading-level names](#heading-level-names): whether styles can be named h1 to h6
- [The word default](#the-word-default): where the word default goes
- [A second platform](#a-second-platform): what changes with a second platform
- [Figma in 2026](#figma-in-2026): what Figma can do in 2026

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is this part in a few paragraphs. How Figma's line-height and letter-spacing units reach CSS is in [line height and letter spacing](line-height-letter-spacing-figma-to-css.md).

---

## Heading-level names

Styles should not be named h1 to h6, on four separate lines of evidence; but ignoring heading levels is also wrong, and the fix is to carry the element alongside the style instead of in its name.

The shortcut is tempting. Name the Figma styles `h1` to `h6`, and designers, engineers and screen readers seem to share one vocabulary for free. [Figma's best-practices guide](https://www.figma.com/best-practices/typography-systems-in-figma/) lists exactly this as a valid "semantic" strategy, without picking a winner.

The h1-to-h6 school gets something right. Screen reader users jump from heading to heading, skipped levels confuse them, and accessibility guidance expects a coherent outline on every page. A [Figma forum thread](https://forum.figma.com/t/using-different-text-naming-conventions-instead-of-h1-h6-for-design/53577) shows the tension: a designer argued for pure size names, and a developer replied that the intended element has to travel with the design or the outline becomes guesswork after handoff. Both are right about something.

Naming styles after elements still fails, on four kinds of evidence.

**The system that tried it renamed away.** Material 2's scale was literally `headline1` to `headline6`; Material 3 deleted those names. [Angular Material](https://material.angular.dev/guide/typography) now ships only a default, overridable mapping: `display-large` suggests `<h1>`, `headline-small` suggests `<h6>`, and title, body and label map to none.

**The accessibility-first systems decouple on purpose, while still requiring headings.** [GOV.UK](https://design-system.service.gov.uk/styles/headings/) tells teams to mark up headings semantically first and choose a size class second. A long guidance page starts its `<h1>` at `govuk-heading-xl`; a question page starts its `<h1>` at `govuk-heading-l`. One element, two treatments, which a style named `h1` couldn't allow.

CMS.gov is a live before-and-after. Its heading classes shipped as `.ds-h1` to `.ds-h6`, each tied by name to a level. [In version 2.5.0 it renamed the whole set](https://design.cms.gov/migration-guides/agnostic-typography-classes/) to a size-only scale (`.ds-h1` → `.ds-text-heading--3xl`, down to `.ds-h6` → `.ds-text-heading--sm`), because levels in a document don't always match the visual hierarchy. [It also ships `ds-content`](https://design.cms.gov/foundation/typography/headings/), a wrapper that applies an automatic level-to-size mapping for mostly-prose pages.

**The component systems decouple through the API.** Polaris's `Text` requires an `as` prop because the visual variant and the element are separate values: `<Text variant="headingLg" as="p">` is legal and common.

**The structural reason** is put most crisply by [Nathan Curtis](https://eightshapes.com/articles/typography-in-design-systems/): a component appears on many pages, and the heading that is the largest thing on one screen is the third-largest on another.

Element names go wrong in four distinct ways:

- **The size-driven element**, the central one, is silent. A designer picks "h3" because it's the right size, an engineer faithfully ships `<h3>`, and the outline breaks where nobody is looking.
- **The second grammar.** Element names stop at six and cover only headings, so body, label and code need another vocabulary.
- **The untranslatable name.** iOS and Android have no h-elements, so an h-named library can't port.
- **The faithful agent.** A legacy style named `styles/h2`, read by a coding agent through Figma's code layers or an MCP server, becomes a hard `<h2>` everywhere.

Even HTML has stopped tying an element to a size. Until 2022 the spec's outline algorithm shrank an `<h1>` nested in `<article>`, `<aside>`, `<nav>` or `<section>`; that algorithm was removed. As of [MDN's April 2025 post](https://developer.mozilla.org/en-US/blog/h1-element-styles/), Firefox was removing the matching browser styles, Chrome had shown deprecation warnings since version 136, and Safari tracked it in WebKit bug 292765.

Name your styles by role and size, never by element, and carry the intended element as separate metadata: an `as` prop in code, an annotation or a component property in Figma. Publish a default mapping table in Angular Material's style, overridable rather than load-bearing, and set `h1` sizes explicitly. **Once the name stops enforcing the outline, make the outline a review item: one `<h1>` per page, no skipped levels.** The toolkit states the same split: the heading level is code's (code-standard rule 1), the look is the style's (`knowledge/ui/design/visual.md#typography`). For mostly-prose pages, a prose container maps tags to styles, as CMS.gov's `ds-content` does.

---

## The word default

The word default goes nowhere: the unmarked name is the default, and only a deviation from it carries a modifier.

This eats a surprising share of naming meetings, mostly because three different things are argued about under one word.

| What people mean by "default" | Who ships it | Verdict for typography |
|---|---|---|
| The unmarked name is the default | Carbon, Material, GOV.UK, Primer | The right answer |
| The centre of a spectrum, subtle and strong on either side | GitLab Pajamas | Coherent for colour and border tokens, a poor fit for type |
| A leaf name Figma's folder structure forces into a name | Figma libraries generally | Avoid it, by flattening with a hyphen |

**Default by omission** is the dominant pattern. Carbon renamed its v10 "long" body styles to plain `body` and its "short" ones to `body-compact`, so the everyday style owns the bare name. Material's baseline styles carry no marker; only the heavier set is marked `emphasized`. GOV.UK's `govuk-body` is the default paragraph, with `-l` and `-s` either side. Primer authors a default under a reserved key that [its token guide](https://github.com/primer/primitives/blob/main/DESIGN_TOKENS_GUIDE.md) strips from the emitted name, so `bgColor.accent` sits next to `bgColor.accent.muted`.

[GitLab Pajamas](https://design.gitlab.com/product-foundations/border/) shows where `default` as a word earns its place: its border tokens run `default`, `subtle` and `strong` as three real points on one spectrum. That suits border weight, where louder and quieter are both common states, and suits type poorly, where there usually isn't a "quieter than body text" role. [Nate Baldwin](https://www.designsystemscollective.com/design-tokens-authoring-vs-consuming-82762e699580) treats `default` as a recurring flashpoint for that reason, and [Curtis's naming essay](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676) recommends only as many qualifiers as real intent needs.

Omission wins on adoption: the shortest name is the path of least resistance, so the default becomes what people reach for without thinking. An explicit `default` also ages badly once a system goes multi-brand, since brand B's default weight can be brand A's emphasis.

Figma is why the word turns up in libraries that never meant to argue for it. Each segment of a style path is either a folder or a style, never both, so `body/md` can't sit beside a `body/md/…` folder:

| Option | Figma names | Code tokens | Cost |
|---|---|---|---|
| Flatten with a hyphen | `body/md`, `body/md-strong` | `bodyMd`, `bodyMdStrong` | None worth naming |
| Push everything a level down | `body/md/default`, `body/md/strong` | `bodyMdDefault`, `bodyMdStrong` | Longer names, `default` sorts into the middle of its siblings, and the word leaks into code |

The hyphen wins on the last cell: the folder version forces the Figma name and the code name apart.

Three words tangle here. `base` is the root value a scale grows from. `default` is the unmarked member of a variant group. `regular` is a font weight, 400, and nothing else. A name like `body/md/regular` leaves nobody sure whether it means weight 400 or the unmarked variant, and in most typefaces the two coincide until the font changes.

Default by omission, always, and hyphen-flatten in Figma so the tool never forces the word into a name. **Write the `base`, `default` and `regular` distinction into your naming document**, because it's the collision most likely to come back after everything else is shipped.

---

## A second platform

For most teams, separate libraries per platform with identical role names, and primitive values synced by a token pipeline; the role name is the part that doesn't change.

An iOS team joins, and the web library's style picker is about to double. The three patterns in production answer one Figma constraint: the picker effectively shows one level of grouping at a time.

| Pattern | Style count | Picker experience | Best for |
|---|---|---|---|
| Platform folders inside one library | Multiplies by platform | Degrades with scale | A small team in one file |
| Separate libraries per platform | Multiplies, but hidden per project | Stays clean, enabled per project | Designers who work one platform at a time |
| One set of names, values per mode | Fewest names of the three | Clean, with a preview gotcha | Cross-platform parity as a hard requirement |

**Platform folders**, `Web/Heading/Md` beside `iOS/Heading/Md`, are cheap to set up, and the style count multiplies until picker fatigue arrives. **Separate libraries** are Figma's own recommendation for larger teams, each enabled per project; the price is keeping shared primitives in sync, so the real price is "have a pipeline". **One set of names with values per mode** resizes `heading/lg` in place when a file's mode switches, with one gotcha: the picker previews the wrong mode ([Figma in 2026](#figma-in-2026)).

Whichever pattern a team picks, `heading/lg` should mean the same thing on web, iOS and Android while the values under it differ. Fluent 2 makes that concrete: the same core roles carry Segoe UI on web and Windows, San Francisco Pro on iOS and macOS, and Roboto on Android. On Apple platforms, map roles onto [Dynamic Type text styles](https://developer.apple.com/design/human-interface-guidelines/typography) and hand off style names, not pixel values. This portability is the strongest practical argument for role-based names, and the most direct one against element names, which can't exist off the web.

The rule mostly holds outside Latin script. [Ant Design's font specification](https://ant.design/docs/spec/font/) recommends a 14px base with a 22px line height, a ratio near 1.57, citing legibility at a typical 50cm viewing distance. It keeps to three to five sizes outside display pages and holds most text to 400 and 500, reserving 600 for bold English words mixed into CJK copy. It presents these as general guidance, not as a property of CJK script; the stroke-density explanation often attached to it is commentary layered on top.

What ports is the role grammar: `heading/lg` and `body/md` carry to a CJK product unchanged. What doesn't is the assumption that every role needs the same variant axes everywhere: an italic emphasis variant is close to Latin-only, and a weight ramp of five steps in a Latin face may give three in a CJK one. One more reason to keep weight and style words out of semantic names.

Use separate libraries per platform with identical role names and primitives synced by the pipeline. If cross-platform parity is a hard requirement and designers compare platforms side by side every day, take one set of names with values per mode and accept the preview gotcha. **Whichever you choose, keep the role name identical on every platform.**

---

## Figma in 2026

Variables hold the primitives and text styles hold the composites, a split that looks settled rather than temporary, with four rough edges worth knowing exactly before committing names to them.

[Figma shipped typography variables](https://forum.figma.com/t/launched-typography-variables/48430) on 16 April 2024, covering font family, weight and style, size, line height, letter spacing, and paragraph spacing and indent. A variable still stores one value, while a text style bundles five or more, so primitive variables bind inside semantic text styles, and the style is what a designer applies.

**Font weight takes strings in styles, and Dev Mode treats string and number variables differently.** A style's weight field accepts only a string ("Semibold"), which is why [Tokens Studio](https://docs.tokens.studio/manage-tokens/token-types/typography/) converts numeric weight tokens to names. A number-type weight variable surfaces in generated code as a real reference: `font-weight: var(--Thin-100, 100);`. A string-type one doesn't; [Figma's help page](https://help.figma.com/hc/en-us/articles/27882809912471-Variables-in-Dev-Mode) says string weight variables aren't passed through, and Dev Mode prints the literal number or, failing a match, a bare `font-weight: 400;` with no warning.

**Percentage line heights still don't bind.** A number variable on line height reads as pixels; what that costs, and why percentage is still the better Figma input, is in [percentage or pixels](../foundations/line-height-letter-spacing-figma-to-css.md#percentage-or-pixels).

**The style picker previews the default mode.** A style bound to a Mobile mode at 20px and a TV mode at 40px previews at 20px even while a TV-mode frame renders it at 40px on canvas. [Staff confirmed it as expected behaviour](https://forum.figma.com/t/typography-size-variables-styles-dont-respect-applied-mode-for-variables/71168); the workaround is writing the other modes' values into the style's description.

**Variable fonts strain a single numeric weight.** The recipe a brand wants often matches none of the font's named instances. Atlassian's 653 is exactly this ([weight in the name](../foundations/naming-text-styles.md#weight-in-the-name)), and a semantic alias such as `weight/emphasis` is the only name shape that survives it.

[Figma's changelog of Config 2026](https://help.figma.com/hc/en-us/articles/39582753756695-What-s-new-from-Config-2026) touches none of these four edges. Two years after typography variables shipped, nothing has moved toward a single composite variable carrying a whole type style, so a scheme built around its arrival is planning around a feature with no date.

Naming got more urgent this year, because agents now read the names. With code layers and MCP servers letting coding agents read a Figma file, style names are the literal interface an agent uses to map design onto code. A style named `text/body/md` that matches a code token gets translated correctly; one named `Paragraph 2 (new) FINAL` gets translated creatively; a legacy `styles/h2` becomes the faithful-agent failure under [heading-level names](#heading-level-names).

Build primitives as variables and semantics as text styles, bind every field that can be bound, and plan for the composite to stay at the style layer. Bind weight with number-type variables wherever Dev Mode visibility matters. **Treat inherited h-named styles as urgent debt, not tidying, because agent tooling has made a bad name actively harmful.**

---

## Cheat sheet

| Decision | Write this | Not this | Why |
|---|---|---|---|
| Element intent | an `as` prop or annotation | a style named `h2` | Two concerns, two carriers |
| The unmarked variant | `body/md` | `body/md/default`, `body/md-regular` | Default by omission |
| A marked variant | `body/md-strong` | `body/md/strong` | Hyphen-flatten so Figma and code agree |
| Family | `font/family/heading` | `font/family/inter` | A font swap should be a value change |
| Weight variable type | Number variable | String variable | Only Number surfaces as a real reference in Dev Mode |
| Platform variants | same role name, different mode or library | `iOS/heading/lg` as a distinct name | The role name is the invariant |

Size and weight rows are in [part 1's cheat sheet](../foundations/naming-text-styles.md#cheat-sheet).

---

## The short version

Never name a style after an HTML element. Carry the intended element separately, as a prop or an annotation, publish an overridable default mapping the way Angular Material does, and put the outline on the review checklist. CMS.gov's migration away from `.ds-h1` is the cleanest evidence that a real system hit this trap and fixed it.

Let the unmarked name be the default and give only deviations a modifier; hyphen-flatten in Figma so the tool can't force `default` into a name, and write the `base`, `default` and `regular` distinction into the naming document. For a second platform, use separate libraries with the same role names and primitives synced by a pipeline, unless daily side-by-side comparison makes one set of names per mode worth its preview gotcha.

In Figma, variables are primitives and styles are composites, and nothing announced will change that. Bind weight as a number variable where Dev Mode matters. Most of this is consensus; the calls on separate libraries and on treating h-named styles as urgent debt are judgements, each resting on the reasons above.

---

## What to re-check later

Researched August 2026, revised November 2026; this part was split from [part 1](naming-text-styles.md) in November 2026.

- **`<h1>` UA styles in Chrome and Safari** were last confirmed from MDN's April 2025 post; WebKit bug 292765 is the place to look.
- **CMS.gov's heading class names** changed in version 2.5.0; a linked project still showing `.ds-h1` is on an older version.
- **Figma's four rough edges** are open items the platform may close; Config 2026 closed none. Re-check at the next major Figma release.
- **The Ant Design cross-script guidance** rests on one system's specification; a second source reporting reader outcomes would strengthen it.
- **Text style names were outside the 5 October 2026 Code Connect sweep**, which read 23 public kits' property and layer names, not their text styles.
- **Evidence quality.** No system publishes user research on whether its naming scheme produced a better reading experience; treat this as an engineering argument.

---

## Sources

**Primary**

- [GOV.UK Design System, Headings](https://design-system.service.gov.uk/styles/headings/).
- [CMS.gov Design System, Headings](https://design.cms.gov/foundation/typography/headings/) and [agnostic typography classes migration guide](https://design.cms.gov/migration-guides/agnostic-typography-classes/).
- [Angular Material, Typography](https://material.angular.dev/guide/typography).
- [Shopify Polaris, `Text` component](https://polaris-react.shopify.com/components/typography/text). The `as` prop.
- [MDN Blog, Default styles for h1 elements are changing](https://developer.mozilla.org/en-US/blog/h1-element-styles/).
- [GitHub Primer, `DESIGN_TOKENS_GUIDE.md`](https://github.com/primer/primitives/blob/main/DESIGN_TOKENS_GUIDE.md).
- [IBM Carbon, v11 migration guide](https://github.com/carbon-design-system/carbon/blob/main/docs/migration/v11.md). The long-to-`body` rename.
- [GitLab Pajamas, Border](https://design.gitlab.com/product-foundations/border/).
- [Microsoft Fluent 2, Typography](https://fluent2.microsoft.design/typography).
- [Apple Human Interface Guidelines, Typography](https://developer.apple.com/design/human-interface-guidelines/typography).
- [Ant Design, Font](https://ant.design/docs/spec/font/).
- [Figma Forum, Launched: Typography Variables](https://forum.figma.com/t/launched-typography-variables/48430).
- [Figma Help Center, Variables in Dev Mode](https://help.figma.com/hc/en-us/articles/27882809912471-Variables-in-Dev-Mode).
- [Figma Help Center, What's new from Config 2026](https://help.figma.com/hc/en-us/articles/39582753756695-What-s-new-from-Config-2026).
- [Figma, Kick-start your typography system in Figma](https://www.figma.com/best-practices/typography-systems-in-figma/).
- [Figma Forum, styles don't respect applied mode for variables](https://forum.figma.com/t/typography-size-variables-styles-dont-respect-applied-mode-for-variables/71168).
- [Figma Forum, Using different text naming conventions instead of h1-h6](https://forum.figma.com/t/using-different-text-naming-conventions-instead-of-h1-h6-for-design/53577).
- [Tokens Studio, typography token types](https://docs.tokens.studio/manage-tokens/token-types/typography/).

**Commentary**

- [Nathan Curtis, Typography in Design Systems](https://eightshapes.com/articles/typography-in-design-systems/) and [Naming Tokens in Design Systems](https://medium.com/eightshapes-llc/naming-tokens-in-design-systems-9e86c7444676).
- [Nate Baldwin, Design tokens: authoring vs consuming](https://www.designsystemscollective.com/design-tokens-authoring-vs-consuming-82762e699580).

**Toolkit knowledge base and sister pieces**

- `knowledge/ui/design/visual.md#typography`; `standards/code-standard.md` rule 1.
- [Naming text styles, part 1](naming-text-styles.md), [line height and letter spacing](line-height-letter-spacing-figma-to-css.md), [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md).
