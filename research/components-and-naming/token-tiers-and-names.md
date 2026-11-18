# Token tiers and names

*How many layers of design tokens to keep, what each layer is for, and how a token's name tells a designer and an engineer where it goes, from what shipping systems keep, hide and rename.*

A product team opens its stylesheet before a rebrand. The Save button reads `blue-500`, the link under it reads `blue-500`, the focus ring reads `blue-600`, and a chart legend somewhere reads `blue-500` too. The brand team wants the primary colour moved to teal, but not the chart. Nobody can say which of the forty `blue-500`s mean "brand" and which only mean "blue".

Then someone suggests a token for every component, so the button can change alone. A year later the file holds three thousand tokens and nobody can find one.

Both failures are naming failures. A token's tier says who may use it, and its name says what it is for. Get those two right and a rebrand is a handful of re-pointed values.

---

## What this answers

**The tiers**

- [How many tiers](#how-many-tiers): two, three or four layers, and what each holds
- [Hiding the palette](#hiding-the-palette): whether product code may read `blue-500`
- [Named exceptions](#named-exceptions): charts, fixed colours and identity colours

**The names**

- [The semantic grammar](#the-semantic-grammar): the order of the parts of a name
- [Words in the name](#words-in-the-name): emphasis, state and abbreviations
- [Renames that teach](#renames-that-teach): what Primer, Carbon and Polaris changed, and why

**The component tier**

- [When a component tier pays](#when-a-component-tier-pays): white-labelling and per-component theming
- [What it costs](#what-it-costs): token volume and the systems that cut it
- [Component names elsewhere](#component-names-elsewhere): the middle way most systems take
- [Component token order](#component-token-order): where the variant and the state go

**Reaching code**

- [One name in every tool](#one-name-in-every-tool): what Figma, DTCG and code each allow

Then the [cheat sheet](#cheat-sheet) and [the short version](#the-short-version).

---

## How many tiers

Shipping systems keep two, three or four layers of tokens, and the count matters less than one boundary all of them draw: a value is named once, and a use is named once.

Back to the Save button. Its blue appears in two kinds of name. `blue-500` says what the colour is. `color.background.brand` says what the colour is for. A rebrand changes what `color.background.brand` points at and leaves `blue-500` alone, which is exactly what the chart legend needed.

That split is the first boundary. The bottom tier (palette, primitive, base, global, reference or seed) holds values named for what they are. The tier above (semantic, functional, alias or system) holds decisions named for a use. Above that, some systems add a third, component tier, with names that describe one part of one component: `button-primary-bgColor-rest`.

Here is a Save button drawn through all three, as Material names them.

<svg role="img" viewBox="0 0 640 210" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Three tiers for one Save button in Material's names: the reference token md.ref.palette.primary40 holds a value, the system token md.sys.color.primary aliases it, and the component token md.comp.filled-button.container.color aliases that, painting the button</title><rect x="0" y="0" width="640" height="210" fill="#ffffff"/><text x="20" y="34" font-family="sans-serif" font-size="12" fill="#5e6c84">Reference</text><text x="20" y="50" font-family="sans-serif" font-size="11" fill="#5e6c84">a value</text><rect x="120" y="18" width="290" height="38" rx="4" fill="#eae6ff" stroke="#6554c0" stroke-width="1.5"/><text x="134" y="42" font-family="monospace" font-size="13" fill="#172b4d">md.ref.palette.primary40</text><text x="20" y="104" font-family="sans-serif" font-size="12" fill="#5e6c84">System</text><text x="20" y="120" font-family="sans-serif" font-size="11" fill="#5e6c84">a use</text><rect x="120" y="88" width="290" height="38" rx="4" fill="#eae6ff" stroke="#6554c0" stroke-width="1.5"/><text x="134" y="112" font-family="monospace" font-size="13" fill="#172b4d">md.sys.color.primary</text><text x="20" y="174" font-family="sans-serif" font-size="12" fill="#5e6c84">Component</text><text x="20" y="190" font-family="sans-serif" font-size="11" fill="#5e6c84">a knob</text><rect x="120" y="158" width="290" height="38" rx="4" fill="#eae6ff" stroke="#6554c0" stroke-width="1.5"/><text x="134" y="182" font-family="monospace" font-size="12" fill="#172b4d">md.comp.filled-button.container.color</text><path d="M265 56V88M265 126V158" stroke="#6554c0" stroke-width="1.5" fill="none"/><path d="M260 82L265 88L270 82M260 152L265 158L270 152" stroke="#6554c0" stroke-width="1.5" fill="none"/><path d="M410 177H470" stroke="#6554c0" stroke-width="1.5" fill="none"/><path d="M464 172L470 177L464 182" stroke="#6554c0" stroke-width="1.5" fill="none"/><rect x="478" y="159" width="96" height="36" rx="6" fill="#6750a4"/><text x="526" y="182" font-family="sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle">Save</text><text x="420" y="42" font-family="sans-serif" font-size="11" fill="#5e6c84">a fixed value</text><text x="420" y="112" font-family="sans-serif" font-size="11" fill="#5e6c84">re-pointed by a theme</text><text x="420" y="150" font-family="sans-serif" font-size="11" fill="#5e6c84">re-pointed by one variant</text></svg>

Each arrow is a reference, not a copy. Changing the reference value moves every use; re-pointing the system token moves every primary-coloured thing; re-pointing the component token moves only the button. In Material's own source the chain is exactly this: the filled button's `$container-color` is `md-sys-color.$primary`, which is `md-ref-palette.$primary40`.

How do real systems spread across that ladder? From one tier to four:

- **One.** shadcn/ui writes values straight into `--primary` and `--primary-foreground`, with no palette of its own ([shadcn/ui theming](https://ui.shadcn.com/docs/theming)): fine for one theme.
- **Two.** Fluent 2 calls its layers global and alias ([Fluent, design tokens](https://fluent2.microsoft.design/design-tokens)). GOV.UK Frontend has a palette, read through `govuk-colour("blue")`, and functional colours, read through `govuk-functional-colour("link")` ([GOV.UK Frontend Sass API](https://frontend.design-system.service.gov.uk/sass-api-reference/)).
- **Three.** Primer runs base, functional and component, and its changelog calls this "the base→functional→component architecture" ([Primer primitives changelog](https://github.com/primer/primitives/blob/main/CHANGELOG.md)). Spectrum runs global, alias and component ([Spectrum, design tokens](https://spectrum.adobe.com/page/design-tokens/)). Material 3 runs reference, system and component: `md.ref.palette.primary40`, `--md-sys-color-primary`, `--md-filled-button-container-color` ([Material Web theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)).
- **Four.** Ant Design splits the bottom into seed tokens (`colorPrimary`) and map tokens derived from them (`colorPrimaryBg`), then adds alias and component tokens, and lets a team override every one ([Ant Design, customize theme](https://ant.design/docs/react/customize-theme)).

Ant's extra tier is a generator: an algorithm derives the map from one seed, the brand colour, so a theme is a new seed rather than hundreds of edited values.

The W3C Design Tokens Format Module defines references and groups but no tiers, and says tools should not infer a token's purpose from its group ([DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/)). Tiers are a convention, not a format feature.

Keep two tiers, palette and semantic, and add a third only where the sections below say it pays. **A value named once and a use named once is the whole structure; every further tier has to earn its place against a need you can name.** *Weight: strong.* Every system read here but shadcn/ui keeps that boundary, from GOV.UK's two tiers to Ant's four, under very different team sizes; what differs above it depends on whether you theme by regeneration, by brand, or by component.

---

## Hiding the palette

The newer the system, the more likely it keeps product code from reading `blue-500` at all.

A palette token in a product stylesheet carries no use, so a rebrand cannot find it. Hide the palette and the only colour names a product team can reach are uses.

Polaris did this first among the big systems read here. Its v11 audit found 22 different grey values in the product, some nearly identical, and the release made two kinds of colour token: palette tokens that are private, and alias tokens that designers and developers use ([Polaris v11 colour release](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-11-color.mdx)). The CSS it shipped afterwards holds `--p-color-*` uses and no grey steps.

Others followed by different routes:

- **Primer v8** (April 2024) stopped shipping base colours as CSS. Version 7.17.1 still had `--color-scale-blue-5: #0969da`; version 8's colour files are functional themes only ([Primer 8.0.0 light theme](https://cdn.jsdelivr.net/npm/@primer/primitives@8.0.0/dist/css/functional/themes/light.css)), and its docs say base colours "should never be used directly in code or design" ([Primer, base scales](https://primer.style/foundations/color/base-scales)).
- **Atlassian** lists 447 `color.*` token names in its public set and no palette steps ([`@atlaskit/tokens` 20.14.0 token names](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/dist/es2019/artifacts/token-names.js)).

The counter-examples are real systems too. GOV.UK Frontend v6 (February 2026) kept its palette behind `govuk-colour()`, but renamed applied colours to functional colours and shipped them as CSS custom properties, so the use is the easy path ([GOV.UK Frontend v6.0.0 release](https://github.com/alphagov/govuk-frontend/releases/tag/v6.0.0)). Carbon publishes its palette as a package of its own, `@carbon/colors`, with `$blue-50` usable anywhere ([`@carbon/colors`](https://cdn.jsdelivr.net/npm/@carbon/colors/README.md)). Radix Themes says individual colours can be accessed directly as `--blue-9`, beside the semantic `--accent-9` ([Radix Themes colour](https://www.radix-ui.com/themes/docs/theme/color)). All three accept that what teams build from them will not follow a theme.

Polaris itself is split by category. Its v12 release says primitive space tokens "can be used anywhere", and that a primitive should be used when no semantic token fits ([Polaris v12 release](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-12.mdx)). Colour stayed semantic-only, since a colour changes with a theme and a mode while `--p-space-100` is 4px in every theme Polaris has. Whether to hide a spacing scale is argued in [Spacing in Figma variables](../foundations/spacing-tokens-by-intent-part-2.md#spacing-in-figma-variables).

Here is that move sketched in a Figma library.

<svg role="img" viewBox="0 0 640 200" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Sketch of a Figma library with the palette collection hidden from publishing: the library holds Palette and Semantic collections, and the fill picker in a product file lists only semantic variables such as color/background/brand</title><rect x="0" y="0" width="640" height="200" fill="#ffffff"/><text x="20" y="22" font-family="sans-serif" font-size="12" font-weight="bold" fill="#172b4d">Library file</text><rect x="20" y="34" width="250" height="60" rx="4" fill="#f4f5f7" stroke="#c1c7d0"/><text x="32" y="56" font-family="sans-serif" font-size="12" fill="#172b4d">Palette</text><text x="32" y="78" font-family="monospace" font-size="11" fill="#5e6c84">blue/500, blue/600, teal/500</text><text x="190" y="56" font-family="sans-serif" font-size="11" fill="#c9372c">hidden</text><rect x="20" y="104" width="250" height="60" rx="4" fill="#eae6ff" stroke="#6554c0"/><text x="32" y="126" font-family="sans-serif" font-size="12" fill="#172b4d">Semantic</text><text x="32" y="148" font-family="monospace" font-size="11" fill="#5e6c84">aliases into Palette</text><text x="180" y="126" font-family="sans-serif" font-size="11" fill="#1f845a">published</text><path d="M270 134H340" stroke="#6554c0" stroke-width="1.5"/><path d="M334 129L340 134L334 139" stroke="#6554c0" stroke-width="1.5" fill="none"/><text x="350" y="22" font-family="sans-serif" font-size="12" font-weight="bold" fill="#172b4d">Fill picker in a product file</text><rect x="350" y="34" width="270" height="130" rx="4" fill="#ffffff" stroke="#c1c7d0"/><rect x="362" y="48" width="14" height="14" rx="2" fill="#0c66e4"/><text x="384" y="60" font-family="monospace" font-size="12" fill="#172b4d">color/background/brand</text><rect x="362" y="76" width="14" height="14" rx="2" fill="#e9f2ff"/><text x="384" y="88" font-family="monospace" font-size="12" fill="#172b4d">color/background/selected</text><rect x="362" y="104" width="14" height="14" rx="2" fill="#ffffff" stroke="#c1c7d0"/><text x="384" y="116" font-family="monospace" font-size="12" fill="#172b4d">color/background/surface</text><text x="362" y="150" font-family="sans-serif" font-size="11" fill="#5e6c84">no blue/500 to pick</text><text x="20" y="190" font-family="sans-serif" font-size="10" fill="#5e6c84">Sketch, as of November 2026</text></svg>

The semantic variables still alias the palette; a product file just cannot reach it.

Hide the colour palette from product code. **A palette step a theme changes is a step a rebrand cannot find, so only uses should be reachable.** *Weight: contested.* Polaris, Primer and Atlassian moved their colour palettes out of reach after shipping them, and none has moved back; Carbon, Radix and GOV.UK keep theirs public for teams that need colours the semantic set lacks. The verdict holds for a product that themes or rebrands. In Figma, open the palette collection's settings and turn on *Hide from publishing*.

---

## Named exceptions

Every system that hides its palette still names a few colours that are not uses, and keeps them out of the semantic tier's way.

Take a revenue chart beside the Save button. It needs seven distinct series colours, in an order that stays distinguishable for colour-blind readers. "Brand" and "danger" mean nothing to it. Forcing those seven into semantic names produces tokens like `color.background.accent.purple.bolder` doing a job nobody named them for.

The systems answer with a named family of their own:

- **Charts.** Atlassian ships 100 `color.chart.*` tokens; Primer keeps a `data-vis` file in its functional tier; shadcn/ui ships `--chart-1` to `--chart-5`.
- **Fixed colours.** White that stays white in dark mode is not the same token as a surface that flips. Spectrum keeps `white`, `black` and `static-*` steps with one value in every theme ([spectrum-tokens 13.0.0 colour palette](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens@13.0.0/src/color-palette.json)); Radix ships `black-a` and `white-a` as files of their own.
- **Identity colours.** Polaris names seven avatar fills, `--p-color-avatar-one-bg-fill` and up; Carbon names `tag-background-red`. These are categorical colours, chosen to differ from each other rather than to mean something.

Each family is named for its job and sits in its own group, so nobody reaches for `--chart-3` to paint a button.

Give each exception a family named for its job, in its own group, and write down that it is an exception. **An exception without a name becomes a precedent: the next team cites it to bind a palette step.** *Weight: moderate.* The pattern recurs across Atlassian, Primer, Polaris, Carbon and shadcn/ui, systems of very different size.

---

## The semantic grammar

Most semantic names read property first, then role, then emphasis, then state: what is painted, for what purpose, how loudly, in what state.

Write a brand button's background on hover in four systems and the shared order shows through:

<svg role="img" viewBox="0 0 640 210" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Four systems' names for a brand or accent background split into coloured segments: Atlassian, Polaris and Primer put the property before the role; Ant Design puts the role before the property</title><rect x="0" y="0" width="640" height="210" fill="#ffffff"/><rect x="20" y="12" width="12" height="12" fill="#cce0ff"/><text x="38" y="22" font-family="sans-serif" font-size="11" fill="#5e6c84">property</text><rect x="100" y="12" width="12" height="12" fill="#dcfff1"/><text x="118" y="22" font-family="sans-serif" font-size="11" fill="#5e6c84">role</text><rect x="160" y="12" width="12" height="12" fill="#fff7d6"/><text x="178" y="22" font-family="sans-serif" font-size="11" fill="#5e6c84">emphasis</text><rect x="244" y="12" width="12" height="12" fill="#ffeceb"/><text x="262" y="22" font-family="sans-serif" font-size="11" fill="#5e6c84">state</text><rect x="310" y="12" width="12" height="12" fill="#f4f5f7"/><text x="328" y="22" font-family="sans-serif" font-size="11" fill="#5e6c84">namespace</text><text x="20" y="62" font-family="sans-serif" font-size="12" fill="#5e6c84">Atlassian</text><rect x="120" y="46" width="52" height="24" fill="#f4f5f7"/><text x="124" y="63" font-family="monospace" font-size="13" fill="#172b4d">color.</text><rect x="172" y="46" width="94" height="24" fill="#cce0ff"/><text x="174" y="63" font-family="monospace" font-size="13" fill="#172b4d">background.</text><rect x="266" y="46" width="54" height="24" fill="#dcfff1"/><text x="268" y="63" font-family="monospace" font-size="13" fill="#172b4d">brand.</text><rect x="320" y="46" width="46" height="24" fill="#fff7d6"/><text x="322" y="63" font-family="monospace" font-size="13" fill="#172b4d">bold.</text><rect x="366" y="46" width="64" height="24" fill="#ffeceb"/><text x="368" y="63" font-family="monospace" font-size="13" fill="#172b4d">hovered</text><text x="20" y="104" font-family="sans-serif" font-size="12" fill="#5e6c84">Polaris</text><rect x="120" y="88" width="78" height="24" fill="#f4f5f7"/><text x="122" y="105" font-family="monospace" font-size="13" fill="#172b4d">--p-color-</text><rect x="198" y="88" width="72" height="24" fill="#cce0ff"/><text x="200" y="105" font-family="monospace" font-size="13" fill="#172b4d">bg-fill-</text><rect x="270" y="88" width="54" height="24" fill="#dcfff1"/><text x="272" y="105" font-family="monospace" font-size="13" fill="#172b4d">brand-</text><rect x="324" y="88" width="46" height="24" fill="#ffeceb"/><text x="326" y="105" font-family="monospace" font-size="13" fill="#172b4d">hover</text><text x="20" y="146" font-family="sans-serif" font-size="12" fill="#5e6c84">Primer</text><rect x="120" y="130" width="70" height="24" fill="#cce0ff"/><text x="122" y="147" font-family="monospace" font-size="13" fill="#172b4d">bgColor-</text><rect x="190" y="130" width="62" height="24" fill="#dcfff1"/><text x="192" y="147" font-family="monospace" font-size="13" fill="#172b4d">accent-</text><rect x="252" y="130" width="70" height="24" fill="#fff7d6"/><text x="254" y="147" font-family="monospace" font-size="13" fill="#172b4d">emphasis</text><text x="340" y="147" font-family="sans-serif" font-size="11" fill="#5e6c84">no state in its functional tier</text><text x="20" y="188" font-family="sans-serif" font-size="12" fill="#5e6c84">Ant Design</text><rect x="120" y="172" width="44" height="24" fill="#f4f5f7"/><text x="122" y="189" font-family="monospace" font-size="13" fill="#172b4d">color</text><rect x="164" y="172" width="62" height="24" fill="#dcfff1"/><text x="166" y="189" font-family="monospace" font-size="13" fill="#172b4d">Primary</text><rect x="226" y="172" width="22" height="24" fill="#cce0ff"/><text x="228" y="189" font-family="monospace" font-size="13" fill="#172b4d">Bg</text><rect x="248" y="172" width="46" height="24" fill="#ffeceb"/><text x="250" y="189" font-family="monospace" font-size="13" fill="#172b4d">Hover</text><text x="320" y="189" font-family="sans-serif" font-size="11" fill="#5e6c84">role before property</text></svg>

Atlassian, Polaris and Primer put the painted property first. Ant Design puts the role first. Grey marks a namespace, which some systems drop.

Why does the property-first order win where it is chosen? Because a person searching for a token starts from the property they are setting. A designer types "bg" into the picker; an engineer writing `background:` wants candidates to start the same way. Property first sorts every background together, and a text colour is never offered for a fill by accident. Atlassian's docs describe the structure as foundation, property, then modifiers for role, emphasis and state ([Atlassian, design tokens](https://atlassian.design/foundations/tokens/design-tokens)).

Role first has its own logic. Ant Design and Material 3 think in colour roles: a `primary` family with its background, border and text members side by side. Material's `on-` prefix does the same, so `on-primary-container` reads "the content colour that sits on the primary container" ([Material Web colour](https://github.com/material-components/material-web/blob/main/docs/theming/color.md)). Grouping by role makes a palette easy to review as a set, which suits generating it from one seed.

TDesign mixes the two: role first for brand and status (`--td-brand-color-hover`), property first for neutrals (`--td-bg-color-container-hover`) ([TDesign light theme](https://github.com/Tencent/tdesign-common/blob/develop/style/web/theme/_light.less)), so a search for every background finds half of them.

Order a semantic name property, role, emphasis, state, and keep one order for every family. **Property first sorts by what the person is setting, which is how they search.** *Weight: moderate.* Most systems read here use it and several renamed towards it ([Renames that teach](#renames-that-teach)); role-first is the honest alternative where a palette is generated from a seed and reviewed as role families, as Ant Design and Material do.

---

## Words in the name

The words inside each slot vary more than the order does, and the choice that matters is whether one scale of words runs through every family.

A background has a quiet tint for a selected row and a loud fill for the Save button. What do systems call quiet and loud?

- Atlassian: `subtlest`, `subtler`, `subtle`, nothing, `bold`, `bolder`.
- Primer: `muted` and `emphasis`.
- Carbon: `primary` and `secondary` for text, `subtle` and `strong` for borders.
- Nord, a small health-technology team's system: `weak`, `weaker`, `weakest`, `strong` ([Nord tokens](https://nordhealth.design/tokens/)).
- Fluent 2: numbers, as in `colorNeutralBackground1` to `8` ([Fluent tokens source](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/types.ts)).

Here are the two kinds of scale over the same six illustrative tints.

<svg role="img" viewBox="0 0 640 170" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Two ways to name six tints of one blue: as words that say the direction, from subtlest to bolder, and as numbers from 1 to 6 that say only the order; the tints are illustrative</title><rect x="0" y="0" width="640" height="170" fill="#ffffff"/><text x="20" y="40" font-family="sans-serif" font-size="12" fill="#5e6c84">Words</text><text x="20" y="120" font-family="sans-serif" font-size="12" fill="#5e6c84">Numbers</text><rect x="110" y="20" width="76" height="36" rx="4" fill="#e9f2ff"/><text x="148" y="43" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle">subtlest</text><rect x="110" y="100" width="76" height="36" rx="4" fill="#e9f2ff"/><text x="148" y="123" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle">1</text><rect x="195" y="20" width="76" height="36" rx="4" fill="#cce0ff"/><text x="233" y="43" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle">subtler</text><rect x="195" y="100" width="76" height="36" rx="4" fill="#cce0ff"/><text x="233" y="123" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle">2</text><rect x="280" y="20" width="76" height="36" rx="4" fill="#85b8ff"/><text x="318" y="43" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle">subtle</text><rect x="280" y="100" width="76" height="36" rx="4" fill="#85b8ff"/><text x="318" y="123" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle">3</text><rect x="365" y="20" width="76" height="36" rx="4" fill="#579dff"/><text x="403" y="43" font-family="monospace" font-size="12" fill="#ffffff" text-anchor="middle">default</text><rect x="365" y="100" width="76" height="36" rx="4" fill="#579dff"/><text x="403" y="123" font-family="monospace" font-size="12" fill="#ffffff" text-anchor="middle">4</text><rect x="450" y="20" width="76" height="36" rx="4" fill="#1d7afc"/><text x="488" y="43" font-family="monospace" font-size="12" fill="#ffffff" text-anchor="middle">bold</text><rect x="450" y="100" width="76" height="36" rx="4" fill="#1d7afc"/><text x="488" y="123" font-family="monospace" font-size="12" fill="#ffffff" text-anchor="middle">5</text><rect x="535" y="20" width="76" height="36" rx="4" fill="#0055cc"/><text x="573" y="43" font-family="monospace" font-size="12" fill="#ffffff" text-anchor="middle">bolder</text><rect x="535" y="100" width="76" height="36" rx="4" fill="#0055cc"/><text x="573" y="123" font-family="monospace" font-size="12" fill="#ffffff" text-anchor="middle">6</text><text x="110" y="78" font-family="sans-serif" font-size="11" fill="#5e6c84">quieter or louder than the default: readable from the name</text><text x="110" y="158" font-family="sans-serif" font-size="11" fill="#5e6c84">which is the default, and is 6 darker in dark mode too? Look it up</text></svg>

The words say which way each step goes; the numbers only say which comes next. Numbers earn their place for nested backgrounds, where Carbon's `layer-01` counts depth; [How surfaces stack](../foundations/how-surfaces-stack.md#naming-the-levels) weighs position against role names there. Words suit the two or three steps most roles need.

State words split the same way. Atlassian says `hovered` and `pressed`; Polaris, Primer, Carbon and Ant Design say `hover` and `active`. Polaris moved from the first style to the second in v11, so `--p-text-primary-hovered` became `--p-color-text-primary-hover` ([Polaris v11 tokens](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-11-tokens.mdx)). The CSS pseudo-classes, `:hover` and `:active`, are why the short forms travel well into code.

Abbreviation is the third choice: Primer writes `bgColor`, Polaris `bg`, Atlassian and Carbon `background`. Either works if it is the system's only spelling.

Pick one emphasis scale of two or three words for every family, and take state words from CSS. **A word scale lets a person guess the token that exists; a number scale makes them look it up.** *Weight: moderate.* The evidence is what ships, across systems of every size; no system read here published user research on which vocabulary people find faster.

---

## Renames that teach

Three large systems renamed their semantic tokens, and all three moved towards names that say the job a token does.

Primer's v8 rename is the clearest. Before it, one token, `color-accent-emphasis`, served as both a background and a border colour. Here is what v8 did with it, drawn on two illustrative buttons.

<svg role="img" viewBox="0 0 640 170" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Primer's v8 rename: the single token color-accent-emphasis, used for a button fill and a border, became two tokens named by property, bgColor-accent-emphasis and borderColor-accent-emphasis</title><rect x="0" y="0" width="640" height="170" fill="#ffffff"/><text x="20" y="24" font-family="sans-serif" font-size="12" font-weight="bold" fill="#172b4d">Before (v7)</text><rect x="20" y="40" width="230" height="34" rx="4" fill="#eae6ff" stroke="#6554c0" stroke-width="1.5"/><text x="32" y="62" font-family="monospace" font-size="13" fill="#172b4d">color-accent-emphasis</text><path d="M250 57H290M250 57L290 112" stroke="#6554c0" stroke-width="1.5" fill="none"/><rect x="296" y="40" width="80" height="34" rx="6" fill="#0969da"/><text x="336" y="62" font-family="sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle">Save</text><rect x="296" y="96" width="80" height="34" rx="6" fill="#ffffff" stroke="#0969da" stroke-width="2"/><text x="336" y="118" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle">Cancel</text><text x="20" y="104" font-family="sans-serif" font-size="11" fill="#5e6c84">one name, two properties:</text><text x="20" y="120" font-family="sans-serif" font-size="11" fill="#5e6c84">which use does a change break?</text><text x="400" y="24" font-family="sans-serif" font-size="12" font-weight="bold" fill="#172b4d">After (v8)</text><rect x="400" y="40" width="226" height="34" rx="4" fill="#eae6ff" stroke="#6554c0" stroke-width="1.5"/><text x="410" y="62" font-family="monospace" font-size="12" fill="#172b4d">bgColor-accent-emphasis</text><rect x="400" y="96" width="226" height="34" rx="4" fill="#eae6ff" stroke="#6554c0" stroke-width="1.5"/><text x="410" y="118" font-family="monospace" font-size="12" fill="#172b4d">borderColor-accent-emphasis</text><text x="400" y="152" font-family="sans-serif" font-size="11" fill="#5e6c84">each can move without the other</text></svg>

The old token could not change for the button without changing the border. After the split, each property has its own name and its own value, and a theme can tune a fill without touching every outline. Primer's guide gives the reason: with a property in each token, it is clear when and where a token is meant to be used ([Primer v8 migration guide](https://github.com/primer/primitives/blob/main/docs/storybook/stories/Migration/v8/Guide.mdx)). The same map renamed `color-fg-default` to `fgColor-default` and `color-canvas-subtle` to `bgColor-muted` ([Primer v8 token map](https://github.com/primer/primitives/blob/main/docs/storybook/stories/Migration/v8/DeprecatedPrimitiveTokensMap.json)).

Carbon v11 renamed most tokens for their usage: `ui-01` became `layer-01` (the number now counts nesting depth) and `text-01` became `text-primary`. Where one token had several jobs it split: `hover-ui` became `background-hover`, `layer-hover-01` and `field-hover-01` ([Carbon v11 migration](https://github.com/carbon-design-system/carbon/blob/main/docs/migration/v11.md)). A name like `hover-ui` told nobody which hover it was, so it got used for all of them.

Polaris v12 regrouped its `bg` family by job: `bg-surface` for areas content sits on, `bg-fill` for filled things like buttons. `--p-color-bg-primary` became `--p-color-bg-fill-brand`, and `--p-color-bg-critical-subdued` became `--p-color-bg-surface-critical` ([Polaris v12 colour codemod](https://github.com/Shopify/polaris/blob/main/polaris-migrator/src/migrations/v12-styles-replace-custom-property-color/transform.ts)). Both are backgrounds; each job now has its own group.

All three renames came with migration tooling: Primer's deprecated-token map, Carbon's table, Polaris's codemod. None published a measured outcome of the rename itself, such as misuse counts before and after. The evidence is the direction three independent teams took, not a result.

Name each token for its job, and split any token that does two. **One name per job is cheap now and a codemod later.** *Weight: strong* for naming by job, which Primer, Carbon and Polaris reached independently; *moderate* for the split and for the property segment, which Primer and Carbon show.

---

## When a component tier pays

A component tier earns its place when someone outside the system needs to restyle one component without forking it.

The Save button again. A partner embeds the product inside their own app and wants the primary buttons in their brand colour, with the links and focus rings left alone. With only semantic tokens, re-pointing `bgColor-accent-emphasis` changes every accent fill, not just the button. A component token, `button-primary-bgColor-rest`, is the one knob that moves the button alone.

The systems that ship a component tier say so:

- **Fluent's** extended tokens RFC proposes control tokens for changes that must not affect related components, or where no semantic token exists ([Fluent extended tokens RFC](https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/rfcs/react-components/convergence/extended-design-tokens.md)).
- **Salesforce SLDS** published component styling hooks, such as `--slds-c-button-brand-color-background`, so customers could restyle a component without forking it ([SLDS styling hooks table](https://raw.githubusercontent.com/salesforce-ux/design-system/main/shared/components/StylingHooksTable.jsx)).
- **Material Web** documents component tokens as the way to restyle by selector, for example an error variant of `md-filled-button` set through `--md-filled-button-container-color` ([Material Web theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)).
- **Ant Design** keeps component tokens so that changing one component does not affect the others, set through `theme.components.Button` ([Ant Design, customize theme](https://ant.design/docs/react/customize-theme)).

The common case is someone who cannot edit the component. A team that owns its components can change the stylesheet instead, which is cheaper.

Add a component token when a caller or a brand needs to move one property of one component and nothing else would do. **A component token is a public knob; add it when someone outside the component needs to turn it.** *Weight: moderate.* Every system that ships or proposes the tier ties it to scoped restyling; it fits a platform with customers or several brands, and is overkill for a single product whose team owns the CSS.

---

## What it costs

A component tier multiplies, one knob per property per variant per state per component, and Spectrum, which shipped it widely, is cutting it back.

How large does it get? The counts below come from each system's published package.

<svg role="img" viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Bar chart of token counts per tier: Material Web ships about 244 reference, 807 system and 5,259 component token declarations; Spectrum 14.3.0 deprecated 540 component spacing tokens in favour of about 100 semantic ones</title><rect x="0" y="0" width="640" height="220" fill="#ffffff"/><text x="20" y="24" font-family="sans-serif" font-size="12" font-weight="bold" fill="#172b4d">Material Web, token declarations per tier</text><text x="20" y="54" font-family="sans-serif" font-size="12" fill="#5e6c84">reference</text><rect x="110" y="42" width="24" height="18" fill="#cce0ff"/><text x="142" y="56" font-family="sans-serif" font-size="12" fill="#172b4d">244</text><text x="20" y="80" font-family="sans-serif" font-size="12" fill="#5e6c84">system</text><rect x="110" y="68" width="79" height="18" fill="#cce0ff"/><text x="197" y="82" font-family="sans-serif" font-size="12" fill="#172b4d">807</text><text x="20" y="106" font-family="sans-serif" font-size="12" fill="#5e6c84">component</text><rect x="110" y="94" width="510" height="18" fill="#6554c0"/><text x="560" y="108" font-family="sans-serif" font-size="12" font-weight="bold" fill="#ffffff">5,259</text><text x="20" y="150" font-family="sans-serif" font-size="12" font-weight="bold" fill="#172b4d">Spectrum 14.3.0, spacing</text><text x="20" y="180" font-family="sans-serif" font-size="12" fill="#5e6c84">deprecated</text><rect x="110" y="168" width="52" height="18" fill="#ffeceb" stroke="#c9372c" stroke-width="1"/><text x="170" y="182" font-family="sans-serif" font-size="12" fill="#172b4d">540 component tokens</text><text x="20" y="206" font-family="sans-serif" font-size="12" fill="#5e6c84">replaced by</text><rect x="110" y="194" width="10" height="18" fill="#dcfff1" stroke="#1f845a" stroke-width="1"/><text x="128" y="208" font-family="sans-serif" font-size="12" fill="#172b4d">about 100 semantic tokens</text></svg>

Material's component tier is six times its system tier.

Spectrum is the clearest reversal. In March 2026, spectrum-tokens 14.3.0 deprecated 540 spacing tokens it calls component-specific, such as `text-to-visual-100`, and pointed them to about 100 semantic ones such as `base-gap` and `base-padding`. The changelog names excessive token volume as the first reason ([spectrum-tokens changelog](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/CHANGELOG.md)). Most carry a `renamed` pointer to a replacement.

Fluent never shipped the tier broadly, and its RFC says why. It considered adding every component's tokens to the theme and rejected it: about 100 components, each able to add hundreds of tokens, would mean tens of thousands of CSS variables, more than its authors thought browsers could handle, though they note they never measured it ([Fluent theme tokens RFC](https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/rfcs/react-components/convergence/theme-tokens.md)). Its later RFC makes component tokens opt-in, paid for only by the component that uses them.

SLDS shows the other cost, lock-in. Its styling hooks table has said since July 2024 that component hooks are not compatible with its newer Enhanced Lightning UI, so customers who restyled through them hold names the next version does not honour. A public knob is an API.

Count before adding a tier: components times properties times variants times states. **Every component token is a public name you will have to migrate; the cheapest one is the one never published.** *Weight: moderate.* Spectrum cut its tier for volume and Fluent declined a full one, though neither measured the cost; SLDS shows how a new UI can leave public hooks behind.

---

## Component names elsewhere

Most systems that ship no component tier still put a component's name in a few semantic tokens, and that middle way covers the common need.

Atlassian publishes 634 tokens and no component tier, yet `color.skeleton`, `color.blanket` and `motion.modal` name a component. About 40 of Polaris's 225 colour tokens do too, such as `--p-color-input-bg-surface`; shadcn/ui has `--sidebar-*` and `--card`.

These differ from a component tier in one way: they describe a use only one component has. A skeleton's shimmer colour is used by nothing else, so `color.skeleton` is a semantic token whose use happens to be a single component. There is no `button-primary-bg` beside it, because a button's background is a use many things share: `color.background.brand.bold`.

Before adding a component tier, check whether the use is shared. **A use only one component has gets a semantic token named for it; a use many components share gets a semantic token named for the use.** *Weight: moderate.* Atlassian, Polaris and shadcn/ui all cover component-specific colours this way without a third tier.

---

## Component token order

Where a component tier exists, its names put the variant right after the component and the state last.

A Save button has a container and a label. A full component token names which one it paints. Fluent's RFC writes the order down outright: prefix, component, variant, part, property, modifier, as in `ctrlButtonForegroundColorRest` ([Fluent extended tokens RFC](https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/rfcs/react-components/convergence/extended-design-tokens.md)). Primer writes `button-primary-bgColor-hover` and allows one variant per token ([Primer, token names](https://primer.style/product/primitives/token-names/)). SLDS writes `--slds-c-button-brand-color-background-hover`.

Material Web is the exception to state last: `--md-filled-button-hover-state-layer-color` puts the state before the part, which sorts every hover token together and scatters a part's fills.

Here is the difference as a worked case. You want every token that paints the button's container, in any state:

```
Part before state (illustrative)           State before part (Material Web)
button-container-background-rest           filled-button-container-color
button-container-background-hover          filled-button-hover-state-layer-color
button-container-background-press          filled-button-pressed-state-layer-color
button-label-text-rest                     filled-button-label-text-color
```

On the left, a filter on `button-container` finds every fill. On the right, the hover and pressed fills land under their states, and you read the whole list.

Put the variant after the component and the state last. **With the state last, every state of one part sorts together.** *Weight: moderate,* since Fluent's order is a proposal and SLDS's hooks are unsupported in its newer UI. Fluent, Primer and SLDS agree, and Material Web folds the variant into the component name; only Material moves the state forward. This toolkit's [figma-standard rule 49](../../standards/figma-standard.md) departs, putting the variant on the leaf so a layer's fills sort together.

---

## One name in every tool

A token's name passes through Figma, a token file and code, and each tool changes its separators, so the name has to survive three spellings.

The Save button's background is `color/background/brand` in Figma. What happens to it on the way?

<svg role="img" viewBox="0 0 640 150" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>One token in four tools: Figma color/background/brand, DTCG reference color.background.brand in braces, CSS --color-background-brand, and Swift or Kotlin colorBackgroundBrand, the same words with different separators</title><rect x="0" y="0" width="640" height="150" fill="#ffffff"/><text x="20" y="30" font-family="sans-serif" font-size="12" fill="#5e6c84">Figma variable</text><rect x="20" y="40" width="270" height="30" rx="4" fill="#eae6ff" stroke="#6554c0" stroke-width="1.5"/><text x="32" y="60" font-family="monospace" font-size="13" fill="#172b4d">color/background/brand</text><text x="340" y="30" font-family="sans-serif" font-size="12" fill="#5e6c84">DTCG reference</text><rect x="340" y="40" width="280" height="30" rx="4" fill="#eae6ff" stroke="#6554c0" stroke-width="1.5"/><text x="352" y="60" font-family="monospace" font-size="13" fill="#172b4d">{color.background.brand}</text><text x="20" y="100" font-family="sans-serif" font-size="12" fill="#5e6c84">CSS custom property</text><rect x="20" y="110" width="270" height="30" rx="4" fill="#eae6ff" stroke="#6554c0" stroke-width="1.5"/><text x="32" y="130" font-family="monospace" font-size="13" fill="#172b4d">--color-background-brand</text><text x="340" y="100" font-family="sans-serif" font-size="12" fill="#5e6c84">Swift or Kotlin</text><rect x="340" y="110" width="280" height="30" rx="4" fill="#eae6ff" stroke="#6554c0" stroke-width="1.5"/><text x="352" y="130" font-family="monospace" font-size="13" fill="#172b4d">colorBackgroundBrand</text></svg>

The words stay; the separators change. Figma groups by `/`. The DTCG format groups by nesting and references with dots in braces, and forbids `{`, `}` and `.` inside a name, or a `$` at its start ([DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/)). Figma's own rules ban the same three characters ([Figma variables REST API](https://developers.figma.com/docs/rest-api/variables-endpoints/)), and its DTCG import turns nested groups into slash paths. Style Dictionary then joins the path with `name/kebab` for CSS or `name/camel` for JavaScript ([Style Dictionary transforms](https://styledictionary.com/reference/hooks/transforms/predefined/)).

Three traps, each a way the words stop matching:

- **A dot inside a name.** A designer names a step `space/0.5`. Figma rejects the dot, and in a DTCG file it would read as a group boundary. Name the step `space/050` or `space/half`.
- **Case alone.** CSS treats `--foo` and `--FOO` as two properties ([CSS Custom Properties Level 1](https://www.w3.org/TR/css-variables-1/)), and DTCG names are case-sensitive, but a kebab transform lowercases both into one. Tokens Studio warns that casing, flattening and prefixes in code can make names collide ([Tokens Studio, token names](https://docs.tokens.studio/manage-tokens/token-names)).
- **A dropped segment.** Atlassian's `token('color.background.neutral')` returns `var(--ds-background-neutral)` without the `color` word ([Atlassian, use tokens in code](https://atlassian.design/foundations/tokens/use-tokens-in-code)), and Material's `--md-sys-color-primary` is `MaterialTheme.colorScheme.primary` in Compose ([Android, Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)). Each is deliberate, and each means a search for the Figma name finds nothing in code.

Figma can carry a code name per platform beside each variable, shown in Dev Mode ([Figma, create and manage variables](https://help.figma.com/hc/en-us/articles/15145852043927-Create-and-manage-variables-and-collections)).

Name tokens in lowercase words joined by one separator, with no dots or braces, and let the build derive every spelling from the Figma path. **If the words match in every tool, a person can find the token from either side; only the separators may change.** *Weight: strong.* The DTCG rules and Figma's are hard constraints; the derivation is how systems with one source, Spectrum and Primer among them, keep their names aligned.

---

## Cheat sheet

| Decision | Write | Not |
|---|---|---|
| Tiers | palette and semantic; component only where a caller needs a knob | a component token for every property "in case" |
| Palette access | where you theme or rebrand, colour palette hidden from code and publishing | `blue-500` in a component stylesheet |
| Exceptions | `chart.*`, fixed `white` and `black`, identity fills, each in its own group | chart colours borrowed from `accent.*` |
| Semantic order | property, role, emphasis, state: `background.brand.bold.hover` | `brandBackgroundHover` beside `background.neutral` |
| Emphasis | two or three words, one scale everywhere: `subtle`, default, `bold` | `muted` in one family, `2` in the next |
| State | CSS words: `hover`, `active` (or `pressed`), `disabled` | `hovered` in one family, `hover` in another |
| A token with two jobs | split it: `bgColor-…` and `borderColor-…` | one `accent-emphasis` on a fill and a border |
| Component-only use | a semantic token named for it: `color.skeleton` | a component tier for one colour |
| Component token order | component, variant, part, property, state (rule 49: variant on the leaf) | state before part |
| Characters | lowercase words, `/` in Figma, derived elsewhere | `.`, `{`, `}`, `$`, or case alone telling two names apart |

---

## The short version

Keep two tiers of tokens: a palette that names values, and a semantic tier that names uses. Where you theme or rebrand, hide the colour palette from product code and Figma publishing, because themes and modes change colours, and a palette step in a component will not follow them. Spacing is a separate call, made in [Spacing tokens by intent](../foundations/spacing-tokens-by-intent.md). *Strong* for the two tiers, *contested* for hiding the palette.

Name semantic tokens property first, then role, emphasis and state, with one small word scale for emphasis and CSS words for state. Name each token for its job, as Primer, Carbon and Polaris renamed towards, and split any token that does two, as Primer and Carbon did. *Strong* for naming by job, *moderate* for the split.

Add a component tier only when someone outside a component (a customer, a host app, a second brand) needs to move one of its properties alone. Count first: components times properties times variants times states. Spectrum deprecated 540 component tokens for about 100 semantic ones, Fluent declined a full tier, and SLDS customers hold hooks its new UI does not honour. A use only one component has can be a semantic token named for it, as Atlassian's `color.skeleton` is. *Moderate* for both the cost and the threshold.

Name every token in lowercase words without dots or braces, and derive the code spellings from the Figma path in the build. Write down for developers which tiers they may read, where the exceptions live, and what every renamed token became: every system here has renamed its tokens, and a mapping file made each migration mechanical.

---

## What to re-check later

- Researched 2026-11-18 against the packages and repositories named in the sources, each opened that day.
- **Volatile:** Figma's extended collections (Enterprise, Government and Education plans as of that day; an extension overrides values only and cannot add variables), its mode limits (the REST API says 40 modes, the plans page says unlimited on Enterprise; unresolved) and code syntax. Spectrum's deprecated tokens may be removed in a later major.
- **Counts** are approximate, by script: Material Web's are declarations in `tokens/versions/latest`, repeats included; Polaris's from package 9.4.2, Atlassian's from 20.14.0.
- **Unchecked:** m3.material.io's own token pages rendered empty, so Material's tier wording comes from Material Web's docs and source. SLDS 2's palette and global hook model was seen only in search snippets and is left out. Salesforce archived its SLDS repository on 12 August 2026. Atlassian published no reason for hiding its palette, and Primer's v8 release notes give none for dropping base-colour CSS. A figure of 37,000 Atlassian component tokens circulates from a conference talk and was not traced to a primary source, so it is not used.
- **No outcome data:** no system published misuse counts before and after a rename.
- **Commentary not opened:** Nathan Curtis's *Naming Tokens in Design Systems* and Nate Baldwin's essay on component-level tokens both refused automated fetches.

---

## Sources

**Primary**

- [DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/)
- [Primer, token names](https://primer.style/product/primitives/token-names/)
- [Primer, base scales](https://primer.style/foundations/color/base-scales)
- [Primer primitives changelog](https://github.com/primer/primitives/blob/main/CHANGELOG.md)
- [Primer primitives repository](https://github.com/primer/primitives)
- [Primer 8.0.0 light theme CSS](https://cdn.jsdelivr.net/npm/@primer/primitives@8.0.0/dist/css/functional/themes/light.css)
- [Primer v8 migration guide](https://github.com/primer/primitives/blob/main/docs/storybook/stories/Migration/v8/Guide.mdx)
- [Primer v8 deprecated token map](https://github.com/primer/primitives/blob/main/docs/storybook/stories/Migration/v8/DeprecatedPrimitiveTokensMap.json)
- [Polaris v11 colour release](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-11-color.mdx)
- [Polaris v11 tokens release](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-11-tokens.mdx)
- [Polaris v12 release](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/previous-releases/version-12.mdx)
- [Polaris v11 to v12 migration](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)
- [Polaris v12 colour codemod](https://github.com/Shopify/polaris/blob/main/polaris-migrator/src/migrations/v12-styles-replace-custom-property-color/transform.ts)
- [Atlassian, design tokens](https://atlassian.design/foundations/tokens/design-tokens)
- [Atlassian, use tokens in code](https://atlassian.design/foundations/tokens/use-tokens-in-code)
- [`@atlaskit/tokens` 20.14.0 token names](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.14.0/dist/es2019/artifacts/token-names.js)
- [Carbon v11 migration](https://github.com/carbon-design-system/carbon/blob/main/docs/migration/v11.md)
- [Carbon colour tokens](https://carbondesignsystem.com/elements/color/tokens/)
- [`@carbon/colors`](https://cdn.jsdelivr.net/npm/@carbon/colors/README.md)
- [Spectrum, design tokens](https://spectrum.adobe.com/page/design-tokens/)
- [spectrum-tokens changelog](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/CHANGELOG.md)
- [spectrum-tokens 13.0.0 colour palette](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens@13.0.0/src/color-palette.json)
- [Fluent, design tokens](https://fluent2.microsoft.design/design-tokens)
- [Fluent tokens source](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/types.ts)
- [Fluent theme tokens RFC](https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/rfcs/react-components/convergence/theme-tokens.md)
- [Fluent extended design tokens RFC](https://github.com/microsoft/fluentui/blob/master/docs/react-v9/contributing/rfcs/react-components/convergence/extended-design-tokens.md)
- [Material Web theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)
- [Material Web colour](https://github.com/material-components/material-web/blob/main/docs/theming/color.md)
- [Android, Material 3 in Compose](https://developer.android.com/develop/ui/compose/designsystems/material3)
- [Ant Design, customize theme](https://ant.design/docs/react/customize-theme)
- [TDesign light theme](https://github.com/Tencent/tdesign-common/blob/develop/style/web/theme/_light.less)
- [GOV.UK Frontend Sass API](https://frontend.design-system.service.gov.uk/sass-api-reference/)
- [GOV.UK Frontend v6.0.0 release](https://github.com/alphagov/govuk-frontend/releases/tag/v6.0.0)
- [SLDS styling hooks table](https://raw.githubusercontent.com/salesforce-ux/design-system/main/shared/components/StylingHooksTable.jsx)
- [Radix Themes colour](https://www.radix-ui.com/themes/docs/theme/color)
- [shadcn/ui theming](https://ui.shadcn.com/docs/theming)
- [Nord tokens](https://nordhealth.design/tokens/)
- [Figma variables REST API](https://developers.figma.com/docs/rest-api/variables-endpoints/)
- [Figma, create and manage variables](https://help.figma.com/hc/en-us/articles/15145852043927-Create-and-manage-variables-and-collections)
- [Style Dictionary predefined transforms](https://styledictionary.com/reference/hooks/transforms/predefined/)
- [Tokens Studio, token names](https://docs.tokens.studio/manage-tokens/token-names)
- [CSS Custom Properties Level 1](https://www.w3.org/TR/css-variables-1/)

**Cited but not resolved to a URL**

- Nathan Curtis, *Naming Tokens in Design Systems* (refused the fetch).
- Nate Baldwin, essay on component-level design tokens (refused the fetch).
