# Spacing tokens by intent

How to build a spacing model that says what a space is for as well as how big it is: the primitive scale, the roles on top of it, and how components, layouts and screen sizes use them.

*Part 1 of 2. [Part 2](spacing-tokens-by-intent-part-2.md) takes the model to CSS, Compose, SwiftUI and Figma variables, and gets a library there from the tokens it already has.*

A product team opens its library to tighten the mobile layout. Cards are padded with `space-4`, list rows with `space-4`, the gap between form fields is `space-4`, and the page margin is `space-4` too. All four are 16px, all four are on the scale, and none of them says what it is for.

Making cards tighter on a phone now means finding every `space-4` that happens to pad a card, by hand, in Figma and in code, and leaving the other three alone. Meanwhile an audit turns up 15px, 18px and 22px typed straight into frames, and two older tokens called `spacing-medium` that mean 16px in one file and 8px in another.

---

## What this answers

**The model**
- [The primitive scale](#the-primitive-scale): what base, how many steps, and how to name them
- [Roles on top](#roles-on-top): whether to name space by intent, and with which words
- [Where roles pay](#where-roles-pay): what a role token buys that a primitive cannot
- [How many role tokens](#how-many-role-tokens): where the role layer should stop

**Using it**
- [Space inside components](#space-inside-components): padding, height and gaps inside a control or a card
- [Space in layouts](#space-in-layouts): who owns the gap between things, and page margins
- [Responsive spacing](#responsive-spacing): whether spacing values change with the screen

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is this part in three paragraphs. Platforms, Figma variables, auditing, migration and documentation are in [Part 2](spacing-tokens-by-intent-part-2.md). Space between paragraphs and headings in long-form text is its own question, answered in [space between prose elements](space-between-prose-elements.md).

---

# The model

## The primitive scale

A primitive spacing scale is a short list of sizes on a 4px base, named by number rather than by t-shirt size, and it carries no meaning beyond the size.

The scene is a library whose scale grew by request. It has `spacing-xs`, `spacing-s`, `spacing-m` and `spacing-l`; then someone needed something between small and medium, and `spacing-sm` arrived. A year later there is `spacing-m-plus`. Nobody can say where a new 20px step would go without renaming half the list.

T-shirt names encode order, not distance. Between `s` and `m` there is no room, so every in-between value breaks the naming. Numbers have room, and three systems moved to them by migration:

- **Carbon** deleted its t-shirt aliases (`$spacing-4xs` to `$spacing-3xl`) in v11 and kept only ordinals, `$spacing-01` to `$spacing-13`: 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160px.
- **Orbit** (Kiwi.com) renamed `spaceXXSmall` to `spaceLarge` as `space100` to `space600` in v16, for more flexibility in the values, and at once added in-between steps (`space150`, `space500`).
- **TDesign** (Tencent) deprecated its old `@spacer` set for ordinal `--td-size-1` to `--td-size-16`.

There are three ways to number a scale.

**Multiplier names** read as a share of a base unit. Atlassian's `space.100` is 8px and `space.050` is 4px, and its docs say the suffix is the percentage of the base. Polaris uses the same shape on a 4px base for every size it ships, spacing and radius alike: `--p-space-100` and `--p-border-radius-100` are both 4px, `--p-space-400` is 16px. Steps such as `050`, `075` and `150` slot in without renaming anything.

**Ordinal names** count steps: Carbon's `$spacing-05` is the fifth step (16px), Radix's `--space-3` is 12px, GOV.UK's spacing unit 4 is 20px. They are short, and silent about the value.

**Value names** put the pixel value in the name. Primer's `base.size.12` is 12px. The name never drifts from the value, so a value cannot change without a rename.

The catch with multiplier names is that bases differ. Atlassian's `space.200` is 16px; Polaris's `space-200` is 8px. Spectrum uses the same shape of name as an index, so its `spacing-200` is 12px.

How many steps? Closed scales in shipping systems run from 9 (Radix, Ant Design) to 19 (Primer), with Carbon at 13 and Polaris at 18 (`space-0` to `space-3200`). The base is 4px in most; Atlassian, Carbon and USWDS call 8px the base but add 2, 4 and 6px steps below it, which makes them 4px scales in practice. GOV.UK alone steps by 5px.

Take an illustrative ten-step scale where a 20px step arrives late, written in all three schemes.

<svg role="img" viewBox="0 0 640 286" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A ten-step spacing scale on a 4px base named three ways, with a 20px step added late: multiplier and value names stay put, ordinals below it shift by one</title><rect x="0" y="0" width="640" height="286" fill="#ffffff"/><text x="20" y="24" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">px</text><text x="330" y="24" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">Multiplier</text><text x="450" y="24" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">Ordinal</text><text x="560" y="24" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">Value</text><text x="20" y="50" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">4</text><rect x="50" y="38" width="16" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="50" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-100</text><text x="450" y="50" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">01</text><text x="560" y="50" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-4</text><text x="20" y="74" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">8</text><rect x="50" y="62" width="32" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="74" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-200</text><text x="450" y="74" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">02</text><text x="560" y="74" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-8</text><text x="20" y="98" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">12</text><rect x="50" y="86" width="48" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="98" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-300</text><text x="450" y="98" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">03</text><text x="560" y="98" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-12</text><text x="20" y="122" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">16</text><rect x="50" y="110" width="64" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="122" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-400</text><text x="450" y="122" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">04</text><text x="560" y="122" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-16</text><rect x="10" y="130" width="620" height="22" rx="0" fill="#fff7d6" stroke="none" stroke-width="1"/><text x="20" y="146" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">20</text><rect x="50" y="134" width="80" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="146" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-500</text><text x="450" y="146" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">05 (new)</text><text x="560" y="146" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-20</text><text x="20" y="170" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">24</text><rect x="50" y="158" width="96" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="170" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-600</text><text x="450" y="170" font-family="monospace" font-size="12" fill="#de350b" text-anchor="start" font-weight="normal">06 (was 05)</text><text x="560" y="170" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-24</text><text x="20" y="194" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">32</text><rect x="50" y="182" width="128" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="194" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-800</text><text x="450" y="194" font-family="monospace" font-size="12" fill="#de350b" text-anchor="start" font-weight="normal">07 (was 06)</text><text x="560" y="194" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-32</text><text x="20" y="218" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">40</text><rect x="50" y="206" width="160" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="218" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-1000</text><text x="450" y="218" font-family="monospace" font-size="12" fill="#de350b" text-anchor="start" font-weight="normal">08 (was 07)</text><text x="560" y="218" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-40</text><text x="20" y="242" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">48</text><rect x="50" y="230" width="192" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="242" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-1200</text><text x="450" y="242" font-family="monospace" font-size="12" fill="#de350b" text-anchor="start" font-weight="normal">09 (was 08)</text><text x="560" y="242" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-48</text><text x="20" y="266" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">64</text><rect x="50" y="254" width="256" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="266" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-1600</text><text x="450" y="266" font-family="monospace" font-size="12" fill="#de350b" text-anchor="start" font-weight="normal">10 (was 09)</text><text x="560" y="266" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-64</text></svg>

The highlighted row is the newcomer. The multiplier and value names around it stay where they were; every ordinal below it moves down by one, and every file that used `06` now means a different size. That is why Carbon added its newest value, `$spacing-13` (160px), at the top.

**Use a 4px base with multiplier or value names, and keep the scale between 10 and 16 steps.** Pick the multiplier if you expect to change a value without a rename, and state the base in the scale's description so `space-200` is never read as 16px. Drop t-shirt names from the primitive layer; they come back, usefully, one layer up. The same naming holds for a radius scale, as [corner radius by intent](corner-radius-by-intent.md#the-radius-scale) argues. *Weight: strong.* Four systems moved from t-shirt names to numbers by migration, and none moved the other way.

---

## Roles on top

A role token names what a space does (pad a container, separate stacked items, separate items in a row) and points at a primitive, so the value can change for one role without touching the others.

Back to the scene: card padding, row padding, field gap and page margin are all `space-4`. Each is a different decision that happens to share a value today. A primitive can only say "16px". A role says "this is the inside of a container", and when the phone layout needs tighter cards, the role changes and the other three do not.

The vocabulary comes from Nathan Curtis's 2016 essay [Space in Design Systems](https://nathanacurtis.substack.com/p/space-in-design-systems-188bcbae0d62), which names space by the relationship it expresses, not by the CSS property:

- **Inset**: space inside a container, equal on all sides (a card, a panel).
- **Squish inset**: less above and below than at the sides (a button, a table cell).
- **Stretch inset**: more above and below than at the sides (a text area).
- **Stack**: vertical space between stacked items.
- **Inline**: horizontal space between items in a row that may wrap (tags, breadcrumbs).

Here is one invoice card, with each role shaded in turn. First the inset: the padding between the card's edge and everything in it.

<svg role="img" viewBox="0 0 640 318" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>An invoice card with its 24px padding shaded on all four sides</title><rect x="0" y="0" width="640" height="318" fill="#ffffff"/><rect x="40" y="30" width="450.0" height="258.0" rx="12" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="40.0" y="30.0" width="450.0" height="36.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.28"/><rect x="40.0" y="252.0" width="450.0" height="36.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.28"/><rect x="40.0" y="66.0" width="36.0" height="186.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.28"/><rect x="454.0" y="66.0" width="36.0" height="186.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.28"/><text x="76.0" y="93.0" font-family="sans-serif" font-size="22" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="76.0" y="136.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="76.0" y="166.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="76.0" y="198.0" width="150.0" height="54.0" rx="6" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="151.0" y="232.5" font-family="sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="238.0" y="198.0" width="150.0" height="54.0" rx="6" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="313.0" y="232.5" font-family="sans-serif" font-size="16" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="514.0" y="55.5" font-family="sans-serif" font-size="14" fill="#6554c0" text-anchor="start" font-weight="bold">inset-lg · 24</text><text x="514.0" y="81.0" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">all four sides</text></svg>

The shaded frame is one decision, made once for the card, whatever sits inside it. Next the stack: the vertical gaps between the things inside.

<svg role="img" viewBox="0 0 640 294" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>The same invoice card with its two vertical gaps shaded: 8px under the heading, 16px above the buttons</title><rect x="0" y="0" width="640" height="294" fill="#ffffff"/><rect x="40" y="30" width="450.0" height="234.0" rx="12" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><text x="64.0" y="81.0" font-family="sans-serif" font-size="22" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><rect x="64.0" y="90.0" width="402.0" height="12.0" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><text x="64.0" y="124.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="64.0" y="154.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="64.0" y="162.0" width="402.0" height="24.0" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><rect x="64.0" y="186.0" width="150.0" height="54.0" rx="6" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="139.0" y="220.5" font-family="sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="226.0" y="186.0" width="150.0" height="54.0" rx="6" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="301.0" y="220.5" font-family="sans-serif" font-size="16" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="514.0" y="99.0" font-family="sans-serif" font-size="14" fill="#1f845a" text-anchor="start" font-weight="bold">stack-sm · 8</text><text x="514.0" y="123.0" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">heading to its details</text><text x="514.0" y="180.0" font-family="sans-serif" font-size="14" fill="#1f845a" text-anchor="start" font-weight="bold">stack-md · 16</text><text x="514.0" y="201.0" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">details to the actions</text></svg>

The two gaps differ on purpose: the heading's details sit close to it, and the actions stand further off. Last the inline: the gap between items in a row.

<svg role="img" viewBox="0 0 640 294" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>The same invoice card with the 8px gap between its Pay now and Download buttons shaded</title><rect x="0" y="0" width="640" height="294" fill="#ffffff"/><rect x="40" y="30" width="450.0" height="234.0" rx="12" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><text x="64.0" y="81.0" font-family="sans-serif" font-size="22" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="64.0" y="124.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="64.0" y="154.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="64.0" y="186.0" width="150.0" height="54.0" rx="6" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="139.0" y="220.5" font-family="sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="214.0" y="186.0" width="12.0" height="54.0" rx="0" fill="#ff8b00" stroke="none" stroke-width="1" opacity="0.55"/><rect x="226.0" y="186.0" width="150.0" height="54.0" rx="6" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="301.0" y="220.5" font-family="sans-serif" font-size="16" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="514.0" y="210.0" font-family="sans-serif" font-size="14" fill="#a54800" text-anchor="start" font-weight="bold">inline-sm · 8</text><text x="514.0" y="231.0" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">between the buttons</text></svg>

It is 8px, the same number as the first stack gap, and still a separate decision: a compact mode might tighten the stack and leave the buttons alone.

Shipping systems name these roles in different words, and the words matter less than the split. Primer uses `stack.padding.condensed|normal|spacious` for inset and `stack.gap.*` for stack. Fluent splits by axis only, `spacingHorizontalM` and `spacingVerticalM`. Ant Design has `padding`, `paddingContentHorizontal` and the `margin*` family.

Atlassian's recent move is the useful story. For years its spacing page gave usage bands in prose (0 to 8px inside components, 32 to 80px for page layout), and prose cannot be linted: nothing can tell whether `space.200` was used as a gap or as an inset. Now `@atlaskit/tokens` 20.12 adds experimental `space.gap.*` and `space.inset.*` tokens, each description warning against using one where the other belongs.

The counter-story is Carbon. Before v11 it had a second scale, `$layout-01` to `$layout-07`, for space between larger regions. v11 folded it into the spacing scale (issue #5602): `$layout-01` became `$spacing-05` (16px) and `$layout-07` became `$spacing-13` (160px). A context-named scale that only repeats the primitive values, never changing for any mode, adds a second name and no meaning. That is the test any role has to pass.

> **Aside.** Every Layout and Braid split inset from gap with component boundaries instead of token names: layout components own every gap, and Braid ships one role name, `gutter`. The two combine, as [space in layouts](#space-in-layouts) shows.

Here is the worked case, on a roomier version of the scene. Your cards should be padded 16px on phones and 24px from tablets up, as the [responsive spacing](#responsive-spacing) table has it; nothing else should move. The queries run mobile first, `min-width` only, as in [breakpoints in code](../figma-and-code/responsive-components-in-figma.md#breakpoints-in-code).

```css
/* Primitives: every card-like component needs its own query */
.card  { padding: var(--space-400); }
.row   { padding: var(--space-600); }
.field { margin-block-end: var(--space-600); }
@media (min-width: 40rem) { .card { padding: var(--space-600); } }   /* and the next card-like thing someone forgets */
```

```css
/* Roles: the card's padding is an inset; the change is one line, in one place */
:root { --inset-lg: var(--space-400); --stack-lg: var(--space-600); }
@media (min-width: 40rem) { :root { --inset-lg: var(--space-600); } }
.card, .panel { padding: var(--inset-lg); }
.form  { display: grid; gap: var(--stack-lg); }
```

In the first version each card-like component carries its own query, and the next one added will miss it. In the second, every container padded by `inset-lg` changes together and the form's gap stays put, because it was never the same decision.

**Add a role layer with four families, `inset`, `stack`, `inline` and `layout` (page margins and region gaps), each with three to five sizes, every one aliasing a primitive.** Treat squish and stretch as sizes inside `inset` (`inset-squish-md`), not as families of their own. The words are yours to choose; keep inset apart from gap, because that split is what lets density and breakpoints change one without the other. *Weight: moderate.* Primer, Fluent, Ant and SLDS ship a role layer and Atlassian is adding one, while Carbon's removed layout scale shows that a role which never varies is not worth keeping.

---

## Where roles pay

A role token earns its place when its value changes with a mode (density, pointer, breakpoint or platform) while the primitive under it does not.

The scene again: the team wants a compact mode for data-heavy screens. With primitives in every component, compact means a second rule per component; with roles, it is one remapping table. Four systems show it with real numbers:

- **SLDS** ships a compact override for its variable spacing tokens: `VAR_SPACING_MEDIUM` goes from 16px to 8px, `VAR_SPACING_HORIZONTAL_MEDIUM` from 16px to 12px. The horizontal and vertical roles diverge only under density, which is exactly why they are two names.
- **Ant Design** derives every size from `sizeUnit: 4` and `sizeStep: 4`. Its compact algorithm lowers the step by 2, so `size` goes from 16px to 8px, and every `padding*` alias follows without a line of component code.
- **Primer** switches by pointer, not by screen: `controlStack.medium.gap.auto` is 8px for a fine pointer and 12px for a coarse one.
- **Polaris** overrides one role per theme: in `light-mobile`, `space-card-gap` drops from 16px to 8px. No component changed.

Now the worked case. Your card is padded 24px by default, compact should take it to 16px, and the page margin must stay 24px.

```css
/* Primitives in the component: compact has to know which 24 is which */
.card { padding: var(--space-600); }
.page { padding-inline: var(--space-600); }
[data-density="compact"] .card { padding: var(--space-400); }   /* one rule per component */
```

```css
/* Roles: compact re-points one name; components are untouched */
:root { --inset-lg: var(--space-600); --layout-margin: var(--space-600); }
[data-density="compact"] { --inset-lg: var(--space-400); }
.card { padding: var(--inset-lg); }
.page { padding-inline: var(--layout-margin); }
```

The first needs a compact rule in every component that pads with 24px, each one a place to forget. The second needs one line per role. Here is that card in both modes, inside a page whose margin is a role of its own.

<svg role="img" viewBox="0 0 640 292" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>The invoice card in comfortable and compact modes: its inset and stack gaps shrink, the page margin stays 24px</title><rect x="0" y="0" width="640" height="292" fill="#ffffff"/><text x="160" y="22" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">Comfortable</text><rect x="10" y="34" width="300" height="250" rx="0" fill="#f4f5f7" stroke="#c1c7d0" stroke-width="1"/><rect x="10" y="34" width="24" height="250" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="286" y="34" width="24" height="250" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="34" y="58" width="252" height="172" rx="6.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="34" y="58" width="252" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="34" y="206" width="252" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="34" y="82" width="24" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="262" y="82" width="24" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="58" y="100" font-family="sans-serif" font-size="19" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><rect x="58" y="106" width="204" height="8" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><text x="58" y="129" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="58" y="149" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="58" y="154" width="204" height="16" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><rect x="58" y="170" width="90" height="36" rx="4.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="103.0" y="193" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="156" y="170" width="90" height="36" rx="4.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="201.0" y="193" font-family="sans-serif" font-size="14" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="160" y="272" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">inset-lg 24 · stack-sm 8 · stack-md 16</text><text x="480" y="22" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">Compact</text><rect x="330" y="34" width="300" height="250" rx="0" fill="#f4f5f7" stroke="#c1c7d0" stroke-width="1"/><rect x="330" y="34" width="24" height="250" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="606" y="34" width="24" height="250" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="354" y="58" width="252" height="144" rx="6.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="354" y="58" width="252" height="16" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="354" y="186" width="252" height="16" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="354" y="74" width="16" height="112" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="590" y="74" width="16" height="112" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="370" y="92" font-family="sans-serif" font-size="19" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><rect x="370" y="98" width="220" height="4" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><text x="370" y="117" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="370" y="137" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="370" y="142" width="220" height="8" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><rect x="370" y="150" width="90" height="36" rx="4.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="415.0" y="173" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="468" y="150" width="90" height="36" rx="4.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="513.0" y="173" font-family="sans-serif" font-size="14" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="480" y="272" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">inset-lg 16 · stack-sm 4 · stack-md 8</text></svg>

The card's inset and its stack gaps shrink; the blue page margin does not move, because nothing in compact touched `layout-margin`.

The trap runs the other way too. Fluent's `spacingHorizontalM` and `spacingVerticalM` are both 12px, and have been since they shipped. A role that never diverges is Carbon's layout scale again: two names, one decision.

**Add a role only where you can name the mode that will change it: density, pointer type, breakpoint or platform.** If the answer is "none, but it reads nicely", keep the primitive and write the usage in its description, as Atlassian did for years. *Weight: strong.* SLDS, Ant, Primer and Polaris each change role values per mode with no component edits, and Carbon removed a role scale that never changed.

---

## How many role tokens

A useful role layer is small, tens of tokens rather than hundreds, and component tokens appear only where one component needs a knob the roles cannot give.

The scene, a year on: the team has added `card-header-padding-top`, `card-header-padding-top-compact` and `modal-footer-gap-mobile`, one request at a time. Nobody remembers which of the 300 names alias a role and which hold a number someone typed.

Counting tells the story. Braid has one role name, Polaris four aliases, Fluent 22, SLDS 24, Primer about 44. Spectrum has several hundred, because it names relationships per component (`component-edge-to-text-100`, `field-label-to-component`). It also shows the cost: roughly 387 of its layout values are literal pixels against 88 aliases. A literal in the semantic layer breaks the link to the scale, so changing the scale changes nothing below it, and an audit cannot tell an on-scale literal from an off-scale one.

The three layers line up like this, with the scene's card padding at 24px:

<svg role="img" viewBox="0 0 640 180" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Primitive, role and component spacing tokens as three boxes, each aliasing the one to its left, with what changes each</title><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5e6c84"/></marker></defs><rect x="0" y="0" width="640" height="180" fill="#ffffff"/><rect x="20" y="40" width="160" height="70" rx="8" fill="#dfe1e6" stroke="none" stroke-width="1"/><text x="100" y="66" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">Primitive</text><text x="100" y="90" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="middle" font-weight="normal">space-600 = 24px</text><text x="100" y="138" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">changes: never;</text><text x="100" y="154" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">it is the scale</text><rect x="240" y="40" width="160" height="70" rx="8" fill="#eae6ff" stroke="none" stroke-width="1"/><text x="320" y="66" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">Role</text><text x="320" y="90" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="middle" font-weight="normal">inset-lg → space-600</text><text x="320" y="138" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">changes with a mode:</text><text x="320" y="154" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">density, breakpoint, platform</text><rect x="460" y="40" width="160" height="70" rx="8" fill="#e3fcef" stroke="none" stroke-width="1"/><text x="540" y="66" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">Component</text><text x="540" y="90" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="middle" font-weight="normal">card-padding → inset-lg</text><text x="540" y="138" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">changes for one component</text><text x="540" y="154" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">or one brand</text><line x1="458" y1="75" x2="402" y2="75" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><line x1="238" y1="75" x2="184" y2="75" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><text x="420" y="30" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">aliases</text><text x="210" y="30" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">aliases</text></svg>

Each arrow is an alias. A mode re-points the middle box, a brand or a one-off variant re-points the right one, and the left one never changes.

**Start with roles only, and add a component token when one component needs a value its role cannot give in some mode, or a brand overrides it alone.** Every token in either layer aliases the layer below; a literal there is a defect. *Weight: moderate.* The small role layers (Primer, Polaris) stay aliased; Spectrum's hundreds drifted into literals.

---

# Using it

## Space inside components

Inside a control, height and padding are one decision, so make one of them the token and derive the other.

The scene: a medium button is drawn 32px tall with 12px side padding, and in the browser it comes out 34px. Nothing is off-scale; the extra 2px is the border, which CSS adds to the box where Figma's stroke sat over the padding. [Where Figma and CSS render differently](../figma-and-code/where-figma-and-css-render-differently.md#stroke-alignment) explains that drift. The spacing question is which number the token should hold.

Systems answer it in one of two ways.

**A height token, with padding derived.** Primer's `control.medium.size` is 32px with 6px block padding fitted inside it. Spectrum's `component-height-100` is 32px on desktop and 40px on mobile. Carbon's button computes its block padding as half the height minus one line, minus 1px, and the source comments that the 1px is the border.

**Padding, with height emerging.** Fluent's button is `padding: 5px` plus 12px at the sides, and comes out at 5 + 20 + 5 + 2px of border = 32px. That holds until the font's line height changes, and then every button changes height with it.

Here is the worked case, with the scene's button.

```css
/* Looks right, renders 34px: padding 6 + line 20 + padding 6 + border 2 */
.button { padding: 6px 12px; line-height: 20px; border: 1px solid; }

/* Height is the token; padding is what is left after the border */
.button {
  box-sizing: border-box;                                 /* the height includes border and padding */
  min-block-size: var(--control-height-md);              /* 32px */
  padding-block: calc((var(--control-height-md) - 1lh) / 2 - 1px);
  padding-inline: calc(var(--inset-control-md) - 1px);   /* 12px less the border */
  border: 1px solid;
}
```

Here is the same button at three times its size, both ways.

<svg role="img" viewBox="0 0 640 206" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A button drawn at three times size: with 6px padding and a border outside it, it is 34px; with a 32px height token and border-box, padding shrinks to 5px</title><rect x="0" y="0" width="640" height="206" fill="#ffffff"/><text x="130" y="30" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="bold">Padding 6px, content-box</text><rect x="33" y="49" width="194" height="18" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.3"/><rect x="33" y="67" width="194" height="60" rx="0" fill="#dfe1e6" stroke="none" stroke-width="1"/><rect x="33" y="127" width="194" height="18" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.3"/><rect x="31.5" y="47.5" width="197" height="99" rx="8" fill="none" stroke="#172b4d" stroke-width="3"/><text x="130" y="102" font-family="sans-serif" font-size="16" fill="#172b4d" text-anchor="middle" font-weight="bold">Save</text><line x1="244" y1="46" x2="244" y2="148" stroke="#5e6c84" stroke-width="1"/><line x1="238" y1="46" x2="250" y2="46" stroke="#5e6c84" stroke-width="1"/><line x1="238" y1="148" x2="250" y2="148" stroke="#5e6c84" stroke-width="1"/><text x="254" y="101.0" font-family="sans-serif" font-size="13" fill="#de350b" text-anchor="start" font-weight="bold">34px</text><text x="130" y="174" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="middle" font-weight="normal">1 + 6 + 20 + 6 + 1 = 34</text><text x="450" y="30" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="bold">Height token, border-box</text><rect x="353" y="52" width="194" height="15" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.3"/><rect x="353" y="67" width="194" height="60" rx="0" fill="#dfe1e6" stroke="none" stroke-width="1"/><rect x="353" y="127" width="194" height="15" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.3"/><rect x="351.5" y="50.5" width="197" height="93" rx="8" fill="none" stroke="#172b4d" stroke-width="3"/><text x="450" y="102" font-family="sans-serif" font-size="16" fill="#172b4d" text-anchor="middle" font-weight="bold">Save</text><line x1="564" y1="49" x2="564" y2="145" stroke="#5e6c84" stroke-width="1"/><line x1="558" y1="49" x2="570" y2="49" stroke="#5e6c84" stroke-width="1"/><line x1="558" y1="145" x2="570" y2="145" stroke="#5e6c84" stroke-width="1"/><text x="574" y="101.0" font-family="sans-serif" font-size="13" fill="#36b37e" text-anchor="start" font-weight="bold">32px</text><text x="450" y="171" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="middle" font-weight="normal">1 + 5 + 20 + 5 + 1 = 32</text><text x="320" y="196" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">border + padding + line + padding + border</text></svg>

On the left the border sits outside the padding and the button grows to 34px. On the right the height is fixed and the padding is whatever fits inside it once the border is counted.

Gaps inside a component are roles of their own. Primer has `control.*.gap` (4px small, 8px medium and up) for icon to label; Spectrum has `text-to-visual-100` (6px desktop, 8px mobile), and its `field-label-to-component` is 0px because the label's own line box supplies the gap. These are the gaps a designer most often judges by eye, which is why they are worth naming.

Size and space are separate questions. Spectrum keeps `spacing-*` (fixed across platforms) apart from `component-height-*` (which changes); Primer uses one `base.size` scale for both. Mixing them works until a mode changes heights but not gaps, or the reverse.

A few more traps live inside components:

- **Optical nudges.** Fluent drops a button's padding when it holds only an icon, and Carbon widens the end padding to leave room for one. Without a named place for these, hard-coded nudges spread.
- **Nested radius.** An inner corner takes the outer radius minus the padding; [corners inside corners](corner-radius-by-intent.md#corners-inside-corners) has the arithmetic and the systems that document it.
- **The text box.** CSS adds half-leading above and below the text that Figma's padding doesn't see; [vertical trim](../foundations/line-height-letter-spacing-figma-to-css.md#vertical-trim) covers it and `text-box-trim`.
- **Touch targets.** A compact control can look 20px and still needs a 24px target (WCAG 2.5.8). Primer keeps `control.minTarget.coarse` (44px) apart from the visual size.

**Make control height a token of its own, separate from the spacing scale, and derive block padding from it with the border subtracted; name icon-to-label and label-to-field gaps as roles.** Do the subtraction once, in the component's styles, and write in the component's documentation that the drawn padding includes the border. *Weight: moderate.* Primer, Spectrum and Carbon fix the height; Fluent's padding-only button changes height with the font.

---

## Space in layouts

Between components, the parent owns the gap: a layout component or a layout role sets it, and components carry no outer margin.

The scene: a card is given `margin-bottom: 24px` so cards stack nicely. Then the card goes into a grid with a 16px gap, and every row is now 40px apart. Put it last in a padded panel and the panel's bottom gets 24px more than its top.

Every Layout states the mechanism: space belongs to the relationship between siblings, so the context sets it, and its Stack is the owl selector that [spacing ownership](../foundations/space-between-prose-elements.md#spacing-ownership) explains; CSS `gap` does the same without a selector.

Most large systems now ship layout components that take spacing tokens as props:

- **Atlassian**: `Box`, `Stack`, `Inline`, `Flex`, `Grid`, and `Bleed`, which pulls content out through its parent's padding by a `space.*` value.
- **Polaris**: `Box`, `BlockStack`, `InlineStack` and `Bleed`, each taking responsive objects such as `padding={{xs: '400', sm: '500'}}`.
- **Primer React**: `Stack`, whose `gap` and `padding` take `none`, `tight`, `condensed`, `cozy`, `normal` and `spacious` (0 to 24px).
- **Braid**: `Stack`, `Inline`, `Columns` and `Box`, with `space="gutter"`.

This is where the role words meet code: `Stack gap="normal"` is the stack role, and `Box padding="400"` is an inset.

Page structure sits one level up. Carbon's 2x grid has a 32px gutter and margins of 0 at small widths, 16px from medium and 24px at its widest. GOV.UK uses a 30px gutter. Android's adaptive panes have no spacer in the compact and medium width classes and 24dp from expanded up. These are `layout` roles: they change with the screen even where component spacing does not.

The worked case, with the scene's cards on an illustrative product page.

```jsx
// Margins on components: gaps add up wherever two owners meet
<Panel padding="24">
  <Card style={{ marginBottom: 24 }} />   {/* the last one adds 24 to the panel's 24 */}
  <Card style={{ marginBottom: 24 }} />
</Panel>

// The parent owns every gap; components have none
<Panel padding="inset-lg">
  <Stack gap="stack-lg">
    <Card />
    <Card />
  </Stack>
  <Bleed inline="inset-lg"><Banner /></Bleed>  {/* full width, on purpose */}
</Panel>
```

Here are the two panels side by side, at their real sizes.

<svg role="img" viewBox="0 0 640 304" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Two panels: cards with a bottom margin leave 48px at the panel bottom against 24 at the top; cards spaced by the parent gap leave 24 everywhere</title><rect x="0" y="0" width="640" height="304" fill="#ffffff"/><text x="160" y="26" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="bold">margin-bottom: 24 on each card</text><rect x="20" y="40" width="280" height="216" rx="0" fill="#f4f5f7" stroke="#c1c7d0" stroke-width="1"/><rect x="20" y="40" width="280" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="44" y="64" width="232" height="60" rx="6" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><rect x="44" y="124" width="232" height="24" rx="0" fill="#ff8b00" stroke="none" stroke-width="1" opacity="0.35"/><rect x="44" y="148" width="232" height="60" rx="6" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><rect x="44" y="208" width="232" height="24" rx="0" fill="#ff8b00" stroke="none" stroke-width="1" opacity="0.35"/><rect x="20" y="232" width="280" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="160" y="278" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">24 at the top, 48 at the bottom</text><text x="480" y="26" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="bold">gap: 24 on the parent</text><rect x="340" y="40" width="280" height="192" rx="0" fill="#f4f5f7" stroke="#c1c7d0" stroke-width="1"/><rect x="340" y="40" width="280" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="364" y="64" width="232" height="60" rx="6" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><rect x="364" y="124" width="232" height="24" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><rect x="364" y="148" width="232" height="60" rx="6" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><rect x="340" y="208" width="280" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="480" y="254" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">24 everywhere</text><rect x="20" y="286" width="10" height="10" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="36" y="295" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">panel padding</text><rect x="140" y="286" width="10" height="10" rx="0" fill="#ff8b00" stroke="none" stroke-width="1" opacity="0.35"/><text x="156" y="295" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">card margin</text><rect x="260" y="286" width="10" height="10" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><text x="276" y="295" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">parent gap</text></svg>

On the left the last card's margin lands on top of the panel's padding, so the bottom is twice the top. On the right a single gap, set by the parent, is the same everywhere.

Negative space needs care. `Bleed` and `space.negative.*` exist so a banner can reach the edge, but a negative margin can pull a target under its neighbour and break WCAG 2.5.8's 24px spacing circle. Map negative values to margins or a bleed component, never to padding: CSS rejects negative padding, and Compose clamps a padding subtraction at zero.

**Give components no outer margin; set every gap between components with a layout component or a `stack` or `inline` role on the parent, and every page margin and gutter with a `layout` role.** In Figma that is the auto-layout gap on the parent frame, bound to the role variable; in code, `gap` on the flex or grid parent. *Weight: strong.* Atlassian, Polaris, Primer and Braid all ship layout components for this, and Every Layout explains why.

---

## Responsive spacing

Keep the scale fixed and let roles and layout change with the screen; usually only page-level space needs a different value per breakpoint.

The scene: the mobile layout feels loose, and the first instinct is to make the whole spacing scale smaller on phones. Then a 4px icon gap becomes 3px, a 2px offset becomes 1.5px, and the gaps that keep targets apart shrink with them.

GOV.UK shows the sound version. Its responsive spacing map leaves units 0 to 3 (0 to 15px) identical at every width and shrinks only the large ones on mobile: unit 4 is 15px on a phone and 20px from tablet up, unit 6 is 20px and 30px, unit 7 is 25px and 40px, unit 8 is 30px and 50px, unit 9 is 40px and 60px. Every other system read here keeps the scale itself fixed: Polaris varies values through component props, Carbon offers four separate fluid tokens, and Atlassian has no responsive spacing yet.

Fluid spacing is the other route. Utopia generates `clamp()` pairs such as `--space-s: clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem)` that grow smoothly between two screen widths. It suits editorial pages, but a Figma variable holds one number per mode, and a DTCG dimension allows only px and rem.

For the worked case, here is the scene's layout as roles with two modes:

| Role | Mobile | Tablet and up | Primitives |
|---|---|---|---|
| `inset-md` | 16 | 16 | `space-400` |
| `inset-lg` | 16 | 24 | `space-400`, `space-600` |
| `stack-section` | 32 | 48 | `space-800`, `space-1200` |
| `layout-margin` | 16 | 24 | `space-400`, `space-600` |

Small roles hold, as GOV.UK's small units do; large ones step up. Here is the same card on a phone and a tablet, at full size.

<svg role="img" viewBox="0 0 640 474" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>The invoice card at full size on a phone and a tablet: the page margin and the card inset grow on the tablet, the 8px gap between its buttons stays the same</title><rect x="0" y="0" width="640" height="474" fill="#ffffff"/><text x="20" y="24" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="start" font-weight="bold">Phone, 360 wide</text><text x="380" y="24" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="end" font-weight="normal">layout-margin 16 · inset-lg 16 · inline-sm 8</text><rect x="20" y="32" width="360" height="180" rx="12" fill="#f4f5f7" stroke="#172b4d" stroke-width="1.5"/><rect x="20" y="32" width="16" height="180" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="364" y="32" width="16" height="180" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="36" y="40" width="328" height="156" rx="6.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="36" y="40" width="328" height="16" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="36" y="180" width="328" height="16" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="36" y="56" width="16" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="348" y="56" width="16" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="52" y="74" font-family="sans-serif" font-size="19" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="52" y="103" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="52" y="123" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="52" y="144" width="100" height="36" rx="4.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="102.0" y="167" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="152" y="144" width="8" height="36" rx="0" fill="#ff8b00" stroke="none" stroke-width="1" opacity="0.55"/><rect x="160" y="144" width="100" height="36" rx="4.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="210.0" y="167" font-family="sans-serif" font-size="14" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="20" y="256" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="start" font-weight="bold">Tablet, 600 wide</text><text x="620" y="256" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="end" font-weight="normal">layout-margin 24 · inset-lg 24 · inline-sm 8</text><rect x="20" y="264" width="600" height="196" rx="12" fill="#f4f5f7" stroke="#172b4d" stroke-width="1.5"/><rect x="20" y="264" width="24" height="196" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="596" y="264" width="24" height="196" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="44" y="272" width="552" height="172" rx="6.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="44" y="272" width="552" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="44" y="420" width="552" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="44" y="296" width="24" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="572" y="296" width="24" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="68" y="314" font-family="sans-serif" font-size="19" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="68" y="343" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="68" y="363" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="68" y="384" width="100" height="36" rx="4.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="118.0" y="407" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="168" y="384" width="8" height="36" rx="0" fill="#ff8b00" stroke="none" stroke-width="1" opacity="0.55"/><rect x="176" y="384" width="100" height="36" rx="4.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="226.0" y="407" font-family="sans-serif" font-size="14" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text></svg>

The page margin and the card's inset step up on the tablet; the 8px gap between the two buttons is the same on both.

**Do not make the primitive scale responsive; give the large roles (`inset-lg`, `stack-section`, `layout-margin`) a value per breakpoint mode and leave the small ones fixed.** Write the breakpoint widths in the documentation or a separate variable, since a Figma mode carries no width (see [spacing in Figma variables](spacing-tokens-by-intent-part-2.md#spacing-in-figma-variables)). *Weight: moderate.* GOV.UK is the one shipped per-breakpoint map and it shrinks only its large steps; the others keep the scale fixed and vary layout.

---

## Cheat sheet

| Decision | Do | Not |
|---|---|---|
| Base | 4px | 5px, or 8px with no 2, 4, 6 |
| Primitive names | `space-100` (multiplier, base stated) or `space-16` (value) | `space-m`, `spacing-medium` |
| Steps | 10 to 16 | one per request |
| Role families | `inset`, `stack`, `inline`, `layout` | a token per component per side |
| When to add a role | a mode will change it | it reads nicely |
| Role values | alias a primitive | a literal px |
| Control height | its own token; padding derived, less the border | padding plus line height plus border |
| Between components | the parent's `gap`, or a layout component | margins on components |
| Responsive | large roles per breakpoint, `min-width` queries; the scale fixed | a smaller scale on phones |

Part 2 has the [cheat sheet for platforms, Figma and migration](spacing-tokens-by-intent-part-2.md#cheat-sheet).

---

## The short version

Build your spacing model in two layers. The primitive layer is a 4px scale of 10 to 16 steps named by number, either as a multiplier with the base stated (`space-100` is 4px) or as the value itself (`space-16`), never by t-shirt size: Carbon, Orbit and TDesign each migrated away from t-shirt names because they leave no room for an in-between step. This part is strong.

On top of it, add role tokens in four families: `inset` for padding inside containers, `stack` for vertical gaps, `inline` for horizontal gaps and `layout` for page margins and region gaps, a handful of sizes each, every one an alias to a primitive. A role earns its place only when a mode will change it: density (SLDS and Ant remap their roles in compact), pointer (Primer), breakpoint or platform (Polaris's mobile card gap). A role that never changes is a second name for one decision, which is why Carbon removed its layout scale. Add component tokens only where one component needs its own knob. This part is moderate.

Use the roles where they belong. Inside a control, make height its own token and derive padding from it, less the border. Between components, the parent owns the gap through `gap` or a layout component, and components carry no outer margin; that part is strong. Keep the scale fixed across screens and give only the large roles a value per breakpoint, as GOV.UK does, with `min-width` queries; moderate. Tell the people downstream which breakpoint each platform uses, since no token carries it. [Part 2](spacing-tokens-by-intent-part-2.md) takes the model to code, Figma and a migration.

---

## What to re-check later

Researched 2026-11-16 from the systems' source files, documentation and migration guides, read that day.

- **Atlassian's `space.gap.*` and `space.inset.*`** are marked experimental in `@atlaskit/tokens` 20.12; names may change before they are stable.
- **`text-box-trim`** became Baseline in August 2026 per MDN; MDN's compatibility data lists Chrome and Edge 133, Safari 18.2 and Firefox 154.
- **Polaris** is archived on GitHub, and its docs redirect to shopify.dev, so the Box documentation was not read.
- **Not found:** Atlassian's reason for having no role tokens until now. Material 3's layout pages did not resolve, so its margins are unchecked.
- **Counts** (Primer about 44 role tokens; Spectrum about 387 literals to 88 aliases) were counted from the files by structure and are approximate.
- **Curtis's 2016 essay** was read on Substack (the Medium original refused the fetch); its images were not checked.
- **Corrections, 2026-11-17.** Worked cases now query `min-width`; the nested-radius trap no longer says no system documents it (Spectrum and Apple do).

---

## Sources

**Primary**

- [Atlassian, spacing foundations](https://atlassian.design/foundations/spacing)
- [Atlassian, spacing tokens JSON, `@atlaskit/tokens` 13.0.4](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@13.0.4/figma/atlassian-spacing.json)
- [Atlassian, spacing tokens raw, current](https://unpkg.com/@atlaskit/tokens/dist/es2019/artifacts/tokens-raw/atlassian-spacing.js)
- [Atlassian, Bleed primitive](https://atlassian.design/components/primitives/bleed/examples)
- [Polaris, `space.ts`](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/space.ts)
- [Polaris, `size` map 9.4.2](https://cdn.jsdelivr.net/npm/@shopify/polaris-tokens@9.4.2/dist/esm/src/size.mjs)
- [Polaris, border tokens 9.4.2](https://cdn.jsdelivr.net/npm/@shopify/polaris-tokens@9.4.2/dist/esm/src/themes/base/border.mjs)
- [Carbon, layout tokens](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/layout/tokens/layout.tokens.json)
- [Carbon, v11 migration guide](https://raw.githubusercontent.com/carbon-design-system/carbon/main/docs/migration/v11.md)
- [Carbon, issue #5602, consolidating layout into spacing](https://github.com/carbon-design-system/carbon/issues/5602)
- [Carbon, spacing overview](https://carbondesignsystem.com/elements/spacing/overview/)
- [Carbon, 2x grid overview](https://carbondesignsystem.com/elements/2x-grid/overview/)
- [Carbon, button mixins](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/components/button/_mixins.scss)
- [Primer, base size tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/base/size/size.json5)
- [Primer, functional size tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/size.json5)
- [Primer React, Stack](https://primer.style/product/components/stack/)
- [Spectrum, layout tokens](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/src/layout.json)
- [Fluent 2, global spacings](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/global/spacings.ts)
- [Fluent 2, Button styles](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-button/library/src/components/Button/useButtonStyles.styles.ts)
- [Ant Design, seed tokens](https://raw.githubusercontent.com/ant-design/ant-design/master/components/theme/themes/seed.ts)
- [Ant Design, size map derivation](https://raw.githubusercontent.com/ant-design/ant-design/master/components/theme/themes/shared/genSizeMapToken.ts)
- [Ant Design, customize theme](https://ant.design/docs/react/customize-theme)
- [GOV.UK Frontend, `_spacing.scss`](https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/settings/_spacing.scss)
- [GOV.UK Design System, spacing](https://design-system.service.gov.uk/styles/spacing/)
- [USWDS, spacing units](https://raw.githubusercontent.com/uswds/uswds/develop/packages/uswds-core/src/styles/tokens/units/spacing.scss)
- [Radix Themes, space tokens](https://raw.githubusercontent.com/radix-ui/themes/main/packages/radix-ui-themes/src/styles/tokens/space.css)
- [SLDS 2, spacing custom properties](https://cdn.jsdelivr.net/npm/@salesforce-ux/design-system@2.26.3/design-tokens/dist/spacing.custom-props.scss)
- [SLDS 1, design tokens](https://v1.lightningdesignsystem.com/design-tokens/)
- [TDesign, size tokens](https://raw.githubusercontent.com/Tencent/tdesign-common/develop/style/web/theme/_size.less)
- [Orbit, v16 migration guide](https://github.com/kiwicom/orbit/blob/master/docs/src/documentation/05-development/04-migration-guides/12-v16.mdx)
- [Braid, base tokens](https://raw.githubusercontent.com/seek-oss/braid-design-system/master/packages/braid-design-system/src/lib/themes/baseTokens/nvl.ts)
- [Braid, layout foundations](https://seek-oss.github.io/braid-design-system/foundations/layout)
- [Android, `PaneScaffoldDirective.kt`](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/adaptive/adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/PaneScaffoldDirective.kt)
- [Android, `PaddingValues`](https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/PaddingValues)
- [W3C DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/)
- [MDN, `text-box-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-box-trim)
- [caniuse, `text-box-trim`](https://caniuse.com/css-text-box-trim)
- [WCAG 2.2, Understanding 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

**Commentary**

- [Nathan Curtis, Space in Design Systems (2016)](https://nathanacurtis.substack.com/p/space-in-design-systems-188bcbae0d62)
- [Every Layout, the Stack](https://every-layout.dev/layouts/stack/)
- [Utopia, space calculator](https://utopia.fyi/space/calculator/)
