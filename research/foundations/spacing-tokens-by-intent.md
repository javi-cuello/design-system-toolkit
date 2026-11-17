# Spacing tokens by intent

How to build a spacing model that says what a space is for as well as how big it is: the primitive scale, the roles on top of it, how components and layouts use them, how it reaches Figma and three platforms, and how to get there from the tokens a library already has.

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
- [One model, three platforms](#one-model-three-platforms): how one token becomes CSS, Compose and SwiftUI
- [Spacing in Figma variables](#spacing-in-figma-variables): collections, scopes, modes and code syntax

**Getting there**
- [Auditing what exists](#auditing-what-exists): finding every space a library and its code use today
- [Migrating old tokens](#migrating-old-tokens): moving names and values without breaking screens
- [Documenting the model](#documenting-the-model): what each token's page should say

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs. Space between paragraphs and headings in long-form text is its own question, answered in [space between prose elements](space-between-prose-elements.md).

---

# Part one: the model

## The primitive scale

A primitive spacing scale is a short list of sizes on a 4px base, named by number rather than by t-shirt size, and it carries no meaning beyond the size.

The scene is a library whose scale grew by request. It has `spacing-xs`, `spacing-s`, `spacing-m`, `spacing-l`, then someone needed something between small and medium, and `spacing-sm` arrived. A year later there is `spacing-m-plus`. Nobody can say where a new 20px step would go without renaming half the list.

The mechanism behind that mess is that t-shirt names encode order, not distance. Between `s` and `m` there is no room, so every in-between value breaks the naming. Numbers have room. That is why the systems that ship at scale have moved from words to numbers, and three of them did it as a migration:

- **Carbon** deleted its t-shirt aliases (`$spacing-4xs` to `$spacing-3xl`) in v11 and kept only ordinals, `$spacing-01` to `$spacing-13`: 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 160px.
- **Orbit** (Kiwi.com) renamed `spaceXXSmall`, `spaceSmall`, `spaceMedium` and `spaceLarge` to `space100`, `space300`, `space400` and `space600` in v16. The reason it gave was more flexibility in the spacing values, which it used at once to add in-between steps (`space150`, `space500`).
- **TDesign** (Tencent) marked its old `@spacer` set deprecated and moved to ordinal `--td-size-1` to `--td-size-16`.

There are three ways to number a scale, and each has a system behind it.

**Multiplier names** read as a percentage of a base unit. Atlassian's `space.100` is 8px, `space.050` is 4px, `space.150` is 12px, and its docs say the suffix is the percentage of the base. Polaris does the same on a 4px base: `--p-space-100` is 4px, `--p-space-400` is 16px. The appeal is room on both sides: `050`, `075` and `150` slot in without renaming anything.

**Ordinal names** count steps: Carbon's `$spacing-05` is the fifth step (16px), Radix's `--space-3` is 12px, GOV.UK's spacing unit 4 is 20px. They are short, and they are silent about the value.

**Value names** put the pixel value in the name. Primer's `base.size.12` is 12px and `base.size.16` is 16px. Nobody has to look anything up, and the name can never drift from the value, which also means a value cannot change without a rename.

Here is the catch with multiplier names. The number multiplies a base, and bases differ. Atlassian's `space.200` is 16px; Polaris's `space-200` is 8px. Spectrum uses the same shape of name as an index rather than a multiplier, so its `spacing-200` is 12px. A designer who moves between two of these libraries reads the same word three ways.

> **Aside.** SLDS shows how far a t-shirt word stretches: `medium` is 1rem in its aliases file and 0.5rem in its density override file, which remaps `VAR_SPACING_MEDIUM` for compact. That one is deliberate, a role changing with a mode, and it is the subject of [where roles pay](#where-roles-pay); but a reader who meets the word alone cannot tell which `medium` is meant.

How many steps? Closed scales in shipping systems run from 9 to 19: Radix and Ant Design 9, Fluent 11, SLDS 12, Carbon 13, Atlassian 14, Spectrum 15, TDesign 16, Polaris 18, Primer 19. The base is 4px in most (Polaris, Ant, Radix, Tailwind, SLDS, TDesign). Atlassian, Carbon and USWDS call 8px the base but all add 2, 4 and 6px steps below it, which makes them 4px scales in practice. GOV.UK alone steps by 5px.

Take an illustrative ten-step scale where a 20px step arrives late, written in all three schemes.

<svg role="img" viewBox="0 0 640 286" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A ten-step spacing scale on a 4px base named three ways, with a 20px step added late: multiplier and value names stay put, ordinals below it shift by one</title><rect x="0" y="0" width="640" height="286" fill="#ffffff"/><text x="20" y="24" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">px</text><text x="330" y="24" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">Multiplier</text><text x="450" y="24" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">Ordinal</text><text x="560" y="24" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">Value</text><text x="20" y="50" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">4</text><rect x="50" y="38" width="16" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="50" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-100</text><text x="450" y="50" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">01</text><text x="560" y="50" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-4</text><text x="20" y="74" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">8</text><rect x="50" y="62" width="32" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="74" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-200</text><text x="450" y="74" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">02</text><text x="560" y="74" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-8</text><text x="20" y="98" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">12</text><rect x="50" y="86" width="48" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="98" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-300</text><text x="450" y="98" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">03</text><text x="560" y="98" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-12</text><text x="20" y="122" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">16</text><rect x="50" y="110" width="64" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="122" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-400</text><text x="450" y="122" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">04</text><text x="560" y="122" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-16</text><rect x="10" y="130" width="620" height="22" rx="0" fill="#fff7d6" stroke="none" stroke-width="1"/><text x="20" y="146" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">20</text><rect x="50" y="134" width="80" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="146" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-500</text><text x="450" y="146" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">05 (new)</text><text x="560" y="146" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-20</text><text x="20" y="170" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">24</text><rect x="50" y="158" width="96" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="170" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-600</text><text x="450" y="170" font-family="monospace" font-size="12" fill="#de350b" text-anchor="start" font-weight="normal">06 (was 05)</text><text x="560" y="170" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-24</text><text x="20" y="194" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">32</text><rect x="50" y="182" width="128" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="194" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-800</text><text x="450" y="194" font-family="monospace" font-size="12" fill="#de350b" text-anchor="start" font-weight="normal">07 (was 06)</text><text x="560" y="194" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-32</text><text x="20" y="218" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">40</text><rect x="50" y="206" width="160" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="218" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-1000</text><text x="450" y="218" font-family="monospace" font-size="12" fill="#de350b" text-anchor="start" font-weight="normal">08 (was 07)</text><text x="560" y="218" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-40</text><text x="20" y="242" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">48</text><rect x="50" y="230" width="192" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="242" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-1200</text><text x="450" y="242" font-family="monospace" font-size="12" fill="#de350b" text-anchor="start" font-weight="normal">09 (was 08)</text><text x="560" y="242" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-48</text><text x="20" y="266" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">64</text><rect x="50" y="254" width="256" height="14" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.8"/><text x="330" y="266" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">space-1600</text><text x="450" y="266" font-family="monospace" font-size="12" fill="#de350b" text-anchor="start" font-weight="normal">10 (was 09)</text><text x="560" y="266" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">size-64</text></svg>

The highlighted row is the newcomer. The multiplier and value names around it stay where they were; every ordinal below it moves down by one, and every file that used `06` now means a different size.

Ordinal is the scheme that suffers most here, which is why Carbon added its new largest value, `$spacing-13` (160px), at the top rather than in the middle.

**Use a 4px base with multiplier or value names, and keep the scale between 10 and 16 steps.** Multiplier names (`space-100` = 4px) leave room for steps you have not needed yet, and value names (`space-16`) never need a lookup; pick the multiplier if you expect to change a value without a rename, and state the base in the scale's description so `space-200` is never read as 16px. Drop t-shirt names from the primitive layer; they come back, usefully, one layer up. *Weight: strong.* Four systems moved from t-shirt names to numbers by migration, and none moved the other way.

---

## Roles on top

A role token names what a space does (pad a container, separate stacked items, separate items in a row) and points at a primitive, so the value can change for one role without touching the others.

Back to the scene: card padding, row padding, field gap and page margin are all `space-4`. Each is a different decision that happens to share a value today. A primitive can only say "16px". A role says "this is the inside of a container", and when the phone layout needs tighter cards, the role changes and the other three do not.

The vocabulary comes from Nathan Curtis's 2016 essay [Space in Design Systems](https://nathanacurtis.substack.com/p/space-in-design-systems-188bcbae0d62). He named spatial concepts by the relationship they express, not by the CSS property:

- **Inset**: space inside a container, equal on all sides (a card, a panel).
- **Squish inset**: an inset with less above and below than at the sides (a button, a table cell, a list row).
- **Stretch inset**: more above and below than at the sides (a text area).
- **Stack**: vertical space between stacked items.
- **Inline**: horizontal space between items in a row that may wrap (tags, breadcrumbs).

Here is one invoice card, with each role shaded in turn. First the inset: the padding between the card's edge and everything in it.

<svg role="img" viewBox="0 0 640 318" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>An invoice card with its 24px padding shaded on all four sides</title><rect x="0" y="0" width="640" height="318" fill="#ffffff"/><rect x="40" y="30" width="450.0" height="258.0" rx="12" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="40.0" y="30.0" width="450.0" height="36.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.28"/><rect x="40.0" y="252.0" width="450.0" height="36.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.28"/><rect x="40.0" y="66.0" width="36.0" height="186.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.28"/><rect x="454.0" y="66.0" width="36.0" height="186.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.28"/><text x="76.0" y="93.0" font-family="sans-serif" font-size="22" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="76.0" y="136.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="76.0" y="166.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="76.0" y="198.0" width="150.0" height="54.0" rx="6" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="151.0" y="232.5" font-family="sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="238.0" y="198.0" width="150.0" height="54.0" rx="6" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="313.0" y="232.5" font-family="sans-serif" font-size="16" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="514.0" y="55.5" font-family="sans-serif" font-size="14" fill="#6554c0" text-anchor="start" font-weight="bold">inset-lg · 24</text><text x="514.0" y="81.0" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">all four sides</text></svg>

The shaded frame is one decision, made once for the card, whatever sits inside it.

Next the stack: the vertical gaps between the things inside.

<svg role="img" viewBox="0 0 640 294" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>The same invoice card with its two vertical gaps shaded: 8px under the heading, 16px above the buttons</title><rect x="0" y="0" width="640" height="294" fill="#ffffff"/><rect x="40" y="30" width="450.0" height="234.0" rx="12" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><text x="64.0" y="81.0" font-family="sans-serif" font-size="22" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><rect x="64.0" y="90.0" width="402.0" height="12.0" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><text x="64.0" y="124.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="64.0" y="154.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="64.0" y="162.0" width="402.0" height="24.0" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><rect x="64.0" y="186.0" width="150.0" height="54.0" rx="6" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="139.0" y="220.5" font-family="sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="226.0" y="186.0" width="150.0" height="54.0" rx="6" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="301.0" y="220.5" font-family="sans-serif" font-size="16" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="514.0" y="99.0" font-family="sans-serif" font-size="14" fill="#1f845a" text-anchor="start" font-weight="bold">stack-sm · 8</text><text x="514.0" y="123.0" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">heading to its details</text><text x="514.0" y="180.0" font-family="sans-serif" font-size="14" fill="#1f845a" text-anchor="start" font-weight="bold">stack-md · 16</text><text x="514.0" y="201.0" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">details to the actions</text></svg>

There are two gaps and they differ on purpose: the heading's details sit close to it, and the actions stand further off.

Last the inline: the gap between items in a row.

<svg role="img" viewBox="0 0 640 294" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>The same invoice card with the 8px gap between its Pay now and Download buttons shaded</title><rect x="0" y="0" width="640" height="294" fill="#ffffff"/><rect x="40" y="30" width="450.0" height="234.0" rx="12" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><text x="64.0" y="81.0" font-family="sans-serif" font-size="22" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="64.0" y="124.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="64.0" y="154.5" font-family="sans-serif" font-size="16" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="64.0" y="186.0" width="150.0" height="54.0" rx="6" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="139.0" y="220.5" font-family="sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="214.0" y="186.0" width="12.0" height="54.0" rx="0" fill="#ff8b00" stroke="none" stroke-width="1" opacity="0.55"/><rect x="226.0" y="186.0" width="150.0" height="54.0" rx="6" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="301.0" y="220.5" font-family="sans-serif" font-size="16" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="514.0" y="210.0" font-family="sans-serif" font-size="14" fill="#a54800" text-anchor="start" font-weight="bold">inline-sm · 8</text><text x="514.0" y="231.0" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">between the buttons</text></svg>

It is 8px, the same number as the first stack gap, and still a separate decision: a compact mode might tighten the stack and leave the buttons alone.

Shipping systems name these roles in different words, and the words matter less than the split. Primer uses `stack.padding.condensed|normal|spacious` for inset and `stack.gap.*` for stack, all aliasing its base sizes (8, 16, 24px). Fluent splits by axis only, `spacingHorizontalM` and `spacingVerticalM`. Ant Design has `padding`, `paddingContentHorizontal` and the `margin*` family.

Atlassian's recent move is the useful story. Its spacing page carried usage bands in prose for years (0 to 8px for compact UI inside components, 12 to 24px for larger components, 32 to 80px for page layout) and said density was for the future.

Prose cannot be linted: nothing can tell whether `space.200` was used as a gap or as an inset. Now `@atlaskit/tokens` 20.12 adds experimental `space.gap.*` and `space.inset.*` tokens, each description warning against using one where the other belongs. Splitting inset from gap is the first step toward density, and Atlassian is taking it.

The counter-story is Carbon. Before v11 it had a second scale, `$layout-01` to `$layout-07`, for space between larger regions. Issue #5602 proposed folding it into the spacing scale, and v11 removed it: `$layout-01` became `$spacing-05`, both 16px, and so on down the list. A context-named scale that only repeats the primitive values, never changing for any mode, adds a second name and no meaning. That is the test any role has to pass.

> **Aside.** Every Layout and Braid argue for fewer role tokens from the code side: components carry no outer space, and layout components (`Stack`, `Inline`, `Box`) own every gap. Braid ships exactly one role name, `gutter` (24px). Both approaches separate inset from gap; one does it with token names, the other with component boundaries. They combine well, as [space in layouts](#space-in-layouts) shows.

Here is the worked case, on a roomier version of the scene where every container is padded 24px (`space-600`) instead of 16. Your cards are padded 24px and should drop to 16px on phones, as the [responsive spacing](#responsive-spacing) table has it; nothing else should move.

```css
/* Primitives: the change has to find every space-600 that pads a card */
.card     { padding: var(--space-600); }
.row      { padding: var(--space-600); }
.field    { margin-block-end: var(--space-600); }
@media (max-width: 40rem) { .card { padding: var(--space-400); } }   /* and the next card-like thing someone forgets */
```

```css
/* Roles: the card's padding is an inset; the change is one line, in one place */
:root { --inset-lg: var(--space-600); --stack-lg: var(--space-600); }
@media (max-width: 40rem) { :root { --inset-lg: var(--space-400); } }
.card, .panel { padding: var(--inset-lg); }
.form   { display: grid; gap: var(--stack-lg); }
```

In the first version the phone rule is per component, and the row, which also happens to be 24px, is only safe because someone remembered it is not a card. In the second, every container padded by `inset-lg` tightens together and the form's gap stays put, because it was never the same decision.

**Add a role layer with four families, `inset`, `stack`, `inline` and `layout` (page margins and region gaps), each with three to five sizes, every one aliasing a primitive.** Treat squish and stretch as named sizes inside `inset` where a component needs them (`inset-squish-md`), not as families of their own. The words are yours to choose; keep inset apart from gap, because that split is what lets density and breakpoints change one without the other. *Weight: moderate.* Primer, Fluent, Ant and SLDS ship a role layer and Atlassian is adding one, while Carbon's removed layout scale shows that a role which never varies is not worth keeping.

---

## Where roles pay

A role token earns its place when its value changes with a mode (density, pointer, breakpoint or platform) while the primitive under it does not.

The scene again: the team wants a compact mode for data-heavy screens. With primitives in every component, compact means a second rule per component, or a search and replace that has to tell a card's `space-600` from a page margin's. With roles, compact is one remapping table.

Four systems show the mechanism with real numbers.

- **SLDS** ships a compact override file for its variable spacing tokens. `VAR_SPACING_MEDIUM` goes from 16px to 8px, `VAR_SPACING_HORIZONTAL_MEDIUM` from 16px to 12px, and `VAR_SPACING_VERTICAL_MEDIUM` from 16px to 8px. The horizontal and vertical roles diverge only under density, which is exactly why they are two names.
- **Ant Design** derives every size from two seeds, `sizeUnit: 4` and `sizeStep: 4`. Its compact algorithm lowers the step by 2, so `size` goes from 16px to 8px and `sizeLG` from 24px to 16px, and every `padding*` alias follows without a line of component code.
- **Primer** switches by pointer, not by screen. `controlStack.medium.gap.auto` is 8px in its fine-pointer file and 12px in its coarse-pointer file, and `control.minTarget.auto` is 16px and 44px.
- **Polaris** overrides one role per theme. In its `light-mobile` theme, `space-card-gap` drops from `space-400` (16px) to `space-200` (8px). No component changed.

Now the worked case, with the scene's card. Your card is padded 24px by default, compact should take it to 16px, and the page margin must stay 24px.

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

The first version needs a compact rule in every component that pads with 24px, and each of those rules is a place to forget one. The second needs one line per role, however many components use it.

Here is that card in both modes, inside a page whose margin is a role of its own.

<svg role="img" viewBox="0 0 640 292" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>The invoice card in comfortable and compact modes: its inset and stack gaps shrink, the page margin stays 24px</title><rect x="0" y="0" width="640" height="292" fill="#ffffff"/><text x="160" y="22" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">Comfortable</text><rect x="10" y="34" width="300" height="250" rx="0" fill="#f4f5f7" stroke="#c1c7d0" stroke-width="1"/><rect x="10" y="34" width="24" height="250" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="286" y="34" width="24" height="250" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="34" y="58" width="252" height="172" rx="6.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="34" y="58" width="252" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="34" y="206" width="252" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="34" y="82" width="24" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="262" y="82" width="24" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="58" y="100" font-family="sans-serif" font-size="19" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><rect x="58" y="106" width="204" height="8" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><text x="58" y="129" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="58" y="149" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="58" y="154" width="204" height="16" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><rect x="58" y="170" width="90" height="36" rx="4.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="103.0" y="193" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="156" y="170" width="90" height="36" rx="4.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="201.0" y="193" font-family="sans-serif" font-size="14" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="160" y="272" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">inset-lg 24 · stack-sm 8 · stack-md 16</text><text x="480" y="22" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">Compact</text><rect x="330" y="34" width="300" height="250" rx="0" fill="#f4f5f7" stroke="#c1c7d0" stroke-width="1"/><rect x="330" y="34" width="24" height="250" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="606" y="34" width="24" height="250" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="354" y="58" width="252" height="144" rx="6.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="354" y="58" width="252" height="16" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="354" y="186" width="252" height="16" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="354" y="74" width="16" height="112" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="590" y="74" width="16" height="112" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="370" y="92" font-family="sans-serif" font-size="19" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><rect x="370" y="98" width="220" height="4" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><text x="370" y="117" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="370" y="137" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="370" y="142" width="220" height="8" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><rect x="370" y="150" width="90" height="36" rx="4.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="415.0" y="173" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="468" y="150" width="90" height="36" rx="4.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="513.0" y="173" font-family="sans-serif" font-size="14" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="480" y="272" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">inset-lg 16 · stack-sm 4 · stack-md 8</text></svg>

The card's inset and its stack gaps shrink; the blue page margin does not move, because nothing in compact touched `layout-margin`.

The trap runs the other way too. Fluent's `spacingHorizontalM` and `spacingVerticalM` are both 12px, and have been since they shipped. The split was made to allow them to diverge, a fair bet, but a role that never diverges is Carbon's layout scale again: two names, one decision.

**Add a role only where you can name the mode that will change it: density, pointer type, breakpoint or platform.** If the answer is "none, but it reads nicely", keep the primitive and write the usage in its description, as Atlassian did for years. *Weight: strong.* SLDS, Ant, Primer and Polaris each change role values per mode with no component edits, and Carbon removed a role scale that never changed.

---

## How many role tokens

A useful role layer is small, tens of tokens rather than hundreds, and component tokens appear only where one component needs a knob the roles cannot give.

The scene, a year on: the team has added `card-header-padding-top`, `card-header-padding-top-compact` and `modal-footer-gap-mobile`, one request at a time. Nobody remembers which of the 300 names alias a role and which hold a number someone typed.

Counting tells the story. Braid has one role name (`gutter`). Polaris has four aliases (`space-button-group-gap`, `space-card-gap`, `space-card-padding`, `space-table-cell-padding`). Fluent has 22, SLDS 24 variable tokens, Ant about 21 aliases plus per-component tokens, Primer about 44. Spectrum has several hundred, because it names relationships per component (`component-edge-to-text-100`, `field-label-to-component`, `card-edge-to-content-default-medium`).

Spectrum also shows what that count costs. Most of its layout values are written as literal pixels, not aliases: roughly 387 literals against 88 references in its layout file, and every card token is a literal. A literal in the semantic layer breaks the link to the scale, so changing the scale changes nothing below it, and an audit cannot tell an on-scale literal from an off-scale one. At that point the role layer has become a second scale.

The three layers line up like this, with the scene's card padding at 24px:

<svg role="img" viewBox="0 0 640 180" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Primitive, role and component spacing tokens as three boxes, each aliasing the one to its left, with what changes each</title><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5e6c84"/></marker></defs><rect x="0" y="0" width="640" height="180" fill="#ffffff"/><rect x="20" y="40" width="160" height="70" rx="8" fill="#dfe1e6" stroke="none" stroke-width="1"/><text x="100" y="66" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">Primitive</text><text x="100" y="90" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="middle" font-weight="normal">space-600 = 24px</text><text x="100" y="138" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">changes: never;</text><text x="100" y="154" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">it is the scale</text><rect x="240" y="40" width="160" height="70" rx="8" fill="#eae6ff" stroke="none" stroke-width="1"/><text x="320" y="66" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">Role</text><text x="320" y="90" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="middle" font-weight="normal">inset-lg → space-600</text><text x="320" y="138" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">changes with a mode:</text><text x="320" y="154" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">density, breakpoint, platform</text><rect x="460" y="40" width="160" height="70" rx="8" fill="#e3fcef" stroke="none" stroke-width="1"/><text x="540" y="66" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">Component</text><text x="540" y="90" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="middle" font-weight="normal">card-padding → inset-lg</text><text x="540" y="138" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">changes for one component</text><text x="540" y="154" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">or one brand</text><line x1="458" y1="75" x2="402" y2="75" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><line x1="238" y1="75" x2="184" y2="75" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><text x="420" y="30" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">aliases</text><text x="210" y="30" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">aliases</text></svg>

Each arrow is an alias. A mode re-points the middle box, a brand or a one-off variant re-points the right one, and the left one never changes.

**Start with roles only, and add a component token when one component needs a value its role cannot give in some mode, or a brand overrides it alone.** Every token in either layer aliases the layer below; a literal there is a defect. *Weight: moderate.* The small role layers (Primer, Polaris) stay aliased; Spectrum's hundreds drifted into literals.

---

# Part two: using it

## Space inside components

Inside a control, height and padding are one decision, so make one of them the token, derive the other, and subtract the border.

The scene: a medium button is drawn 32px tall with 12px side padding and 8px between icon and label. In the browser it comes out 34px. Nothing is off-scale. The extra 2px is a 1px border on each side, which the browser adds outside the padding unless something takes it away.

Systems set control height in one of two ways.

**A height token, with padding derived.** Primer's `control.medium.size` is 32px, and its block padding is 6px; the height is fixed and the padding fits inside it, border included. Spectrum's `component-height-100` is 32px on desktop and 40px on mobile, with `component-edge-to-text-100` (12px desktop, 15px mobile) for the sides. Carbon goes furthest: its button's block padding is half of the height minus one line, minus 1px, and the source comments that the 1px compensates for the border.

Atlassian's button is `2rem` tall, with 12px side padding.

**Padding, with height emerging.** Fluent's button is `padding: 5px` plus `spacingHorizontalM` (12px), and comes out at 5 + 20 + 5 + 2px of border = 32px. That holds until the font's line height changes, and then every button changes height with it.

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

Gaps inside a component are roles of their own. Primer has `control.*.gap` (4px small, 8px medium and up) for icon to label; Spectrum has `text-to-visual-100` (6px desktop, 8px mobile). Spectrum's `field-label-to-component` is 0px, because the label's own line box supplies the gap, and its quiet variants go negative. These are worth naming because they are the gaps a designer most often judges by eye.

Size and space are separate questions. Spectrum keeps `spacing-*` (unchanged between desktop and mobile) apart from `component-height-*` (which changes); Carbon keeps `layout.size.height` apart from `$spacing-*`; Polaris feeds `space-*`, `height-*` and `width-*` from one size map. Primer uses one `base.size` scale for both. Mixing them works until a mode changes heights but not gaps, or the reverse.

A few more traps live inside components:

- **Optical nudges.** Fluent drops a button's padding when it holds only an icon, and Carbon widens the end padding to leave room for one. Without a named place for these, hard-coded nudges spread.
- **Nested radius.** An inner corner looks right when its radius is the outer radius minus the padding. None of the systems read here documents it as a token, and a CSS issue asking for it is still open.
- **The text box.** Figma measures padding from the text layer's box; CSS adds half-leading above and below the text. `text-box-trim` closes that gap and became Baseline in August 2026.
- **Touch targets.** A compact control can look 20px and still needs a 24px target (WCAG 2.5.8). Primer keeps `control.minTarget.coarse` (44px) apart from the visual size.

**Make control height a token of its own, separate from the spacing scale, and derive block padding from it with the border subtracted; name icon-to-label and label-to-field gaps as roles.** Do the subtraction once, in the component's styles, and write in the component's documentation that the drawn padding includes the border. *Weight: moderate.* Primer, Spectrum, Carbon and Atlassian fix the height; Fluent's padding-only button changes height with the font.

---

## Space in layouts

Between components, the parent owns the gap: a layout component or a layout role sets it, and components carry no outer margin.

The scene: a card is given `margin-bottom: 24px` so cards stack nicely. Then the card goes into a grid with a 16px gap, and every row is now 40px apart. Put it last in a padded panel and the panel's bottom gets 24px more than its top.

Every Layout states the mechanism: space belongs to the relationship between siblings, so the context should set it, not the element. Its Stack sets `margin-block-start` on every child after the first, so the first and last children carry nothing outward. CSS `gap` does the same without the selector.

Most large systems now ship layout components that take spacing tokens as props:

- **Atlassian**: `Box`, `Stack`, `Inline`, `Flex`, `Grid`, and `Bleed`, which pulls content out through its parent's padding by a `space.*` value.
- **Polaris**: `Box`, `BlockStack`, `InlineStack`, `InlineGrid` and `Bleed`, each taking responsive objects such as `padding={{xs: '400', sm: '500'}}`.
- **Primer React**: `Stack`, whose `gap` and `padding` take `none`, `tight`, `condensed`, `cozy`, `normal` and `spacious` (0, 4, 8, 12, 16, 24px), also responsive.
- **Braid**: `Stack`, `Inline`, `Columns` and `Box`, with `space="gutter"`; Braid says this keeps white space predictable.

This is where the role words meet code: `Stack gap="normal"` is the stack role, and `Box padding="400"` is an inset. A layout component is the place a role gets used.

Page structure sits one level up. Carbon's 2x grid has a 32px gutter (16px each side) and margins of 0 at small widths, 16px from medium, and 24px at its widest. GOV.UK uses a 30px gutter. Android's adaptive panes have no spacer in the compact and medium width classes and 24dp from expanded up. These are `layout` roles: they change with the screen even where component spacing does not.

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

GOV.UK shows the sound version of a responsive scale. Its responsive spacing map leaves units 0 to 3 (0, 5, 10, 15px) identical at every width and shrinks only the large ones on mobile: unit 6 is 20px on a phone and 30px from tablet up, unit 9 is 40px and 60px. Small gaps hold; large ones shrink.

Every other system read here keeps the scale itself fixed. Polaris changes values through component props (`padding={{xs: '400', sm: '500'}}`), Carbon offers four separate fluid tokens (`fluid-spacing-01` to `04`, in viewport units), and Atlassian has no responsive spacing yet.

Fluid spacing is the other route. Utopia generates `clamp()` pairs such as `--space-s: clamp(1.125rem, 1.0739rem + 0.2273vw, 1.25rem)`, which grow smoothly between two screen widths. It suits editorial pages. It does not fit a design tool, because a Figma variable holds one number per mode, and it does not fit the token format, because a DTCG dimension allows only px and rem.

For the worked case, here is the scene's mobile layout as roles with two modes:

| Role | Mobile | Tablet and up | Primitives |
|---|---|---|---|
| `inset-md` | 16 | 16 | `space-400` |
| `inset-lg` | 16 | 24 | `space-400`, `space-600` |
| `stack-section` | 32 | 48 | `space-800`, `space-1200` |
| `layout-margin` | 16 | 24 | `space-400`, `space-600` |

Small roles hold, as GOV.UK's small units do; large ones step down. Here is the same card on a phone and a tablet, at full size.

<svg role="img" viewBox="0 0 640 474" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>The invoice card at full size on a phone and a tablet: the page margin and the card inset grow on the tablet, the 8px gap between its buttons stays the same</title><rect x="0" y="0" width="640" height="474" fill="#ffffff"/><text x="20" y="24" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="start" font-weight="bold">Phone, 360 wide</text><text x="380" y="24" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="end" font-weight="normal">layout-margin 16 · inset-lg 16 · inline-sm 8</text><rect x="20" y="32" width="360" height="180" rx="12" fill="#f4f5f7" stroke="#172b4d" stroke-width="1.5"/><rect x="20" y="32" width="16" height="180" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="364" y="32" width="16" height="180" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="36" y="40" width="328" height="156" rx="6.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="36" y="40" width="328" height="16" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="36" y="180" width="328" height="16" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="36" y="56" width="16" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="348" y="56" width="16" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="52" y="74" font-family="sans-serif" font-size="19" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="52" y="103" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="52" y="123" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="52" y="144" width="100" height="36" rx="4.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="102.0" y="167" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="152" y="144" width="8" height="36" rx="0" fill="#ff8b00" stroke="none" stroke-width="1" opacity="0.55"/><rect x="160" y="144" width="100" height="36" rx="4.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="210.0" y="167" font-family="sans-serif" font-size="14" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="20" y="256" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="start" font-weight="bold">Tablet, 600 wide</text><text x="620" y="256" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="end" font-weight="normal">layout-margin 24 · inset-lg 24 · inline-sm 8</text><rect x="20" y="264" width="600" height="196" rx="12" fill="#f4f5f7" stroke="#172b4d" stroke-width="1.5"/><rect x="20" y="264" width="24" height="196" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="596" y="264" width="24" height="196" rx="0" fill="#0065ff" stroke="none" stroke-width="1" opacity="0.18"/><rect x="44" y="272" width="552" height="172" rx="6.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="44" y="272" width="552" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="44" y="420" width="552" height="24" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="44" y="296" width="24" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="572" y="296" width="24" height="124" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="68" y="314" font-family="sans-serif" font-size="19" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="68" y="343" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="68" y="363" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="68" y="384" width="100" height="36" rx="4.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="118.0" y="407" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="168" y="384" width="8" height="36" rx="0" fill="#ff8b00" stroke="none" stroke-width="1" opacity="0.55"/><rect x="176" y="384" width="100" height="36" rx="4.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="226.0" y="407" font-family="sans-serif" font-size="14" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text></svg>

The page margin and the card's inset step up on the tablet; the 8px gap between the two buttons is the same on both.

**Do not make the primitive scale responsive; give the large roles (`inset-lg`, `stack-section`, `layout-margin`) a value per breakpoint mode and leave the small ones fixed.** Write the breakpoint widths in the documentation or a separate variable, since a Figma mode carries no width (see [Spacing in Figma variables](#spacing-in-figma-variables)). *Weight: moderate.* GOV.UK is the one shipped per-breakpoint map and it shrinks only its large steps; the others keep the scale fixed and vary layout.

---

## One model, three platforms

A platform-agnostic token is a name, a number and a unit; each platform's build turns it into rem, dp or pt, and the role words map onto each platform's own layout tools.

The scene: the same card ships on web, Android and iOS. Designers bind `inset-md` in Figma. The web team writes `padding: 16px`, Android writes `16.dp`, iOS writes `16`. Three numbers that agree today and three places to forget when compact mode arrives.

The token format sets the common ground. The W3C DTCG Format Module (2025.10, a final Community Group report of 28 October 2025) has a `dimension` type with a value and a unit, and the unit must be `px` or `rem`; there is no `spacing` type and no viewport unit.

Style Dictionary then converts per platform: `size/pxToRem` for CSS (base 16), `size/dp` and `size/compose/remToDp` for Android, `size/swift/remToCGFloat` for iOS. Its own documentation says DTCG 2025.10's object form is not fully supported yet, so check what the build emits.

Here is one token taking that path.

<svg role="img" viewBox="0 0 640 272" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>One DTCG dimension token, inset-lg at 24px, built three ways: 1.5rem in CSS, 24.dp in Compose and a 24-point CGFloat in SwiftUI, each used as padding</title><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5e6c84"/></marker></defs><rect x="0" y="0" width="640" height="272" fill="#ffffff"/><rect x="220" y="20" width="200" height="64" rx="8" fill="#eae6ff" stroke="none" stroke-width="1"/><text x="320" y="46" font-family="monospace" font-size="14" fill="#172b4d" text-anchor="middle" font-weight="bold">inset-lg</text><text x="320" y="68" font-family="monospace" font-size="10" fill="#5e6c84" text-anchor="middle" font-weight="normal">$type dimension · value 24, unit px</text><line x1="320" y1="86" x2="110" y2="140" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="20" y="144" width="180" height="86" rx="8" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><text x="110" y="166" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">Web, size/pxToRem</text><text x="110" y="192" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="bold">--inset-lg: 1.5rem</text><text x="110" y="216" font-family="monospace" font-size="10" fill="#5e6c84" text-anchor="middle" font-weight="normal">padding-inline, padding-block</text><line x1="320" y1="86" x2="320" y2="140" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="230" y="144" width="180" height="86" rx="8" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><text x="320" y="166" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">Android, size/dp</text><text x="320" y="192" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="bold">insetLg = 24.dp</text><text x="320" y="216" font-family="monospace" font-size="10" fill="#5e6c84" text-anchor="middle" font-weight="normal">Modifier.padding(insetLg)</text><line x1="320" y1="86" x2="530" y2="140" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="440" y="144" width="180" height="86" rx="8" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><text x="530" y="166" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">iOS, size/swift/…</text><text x="530" y="192" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="bold">insetLg: CGFloat = 24</text><text x="530" y="216" font-family="monospace" font-size="10" fill="#5e6c84" text-anchor="middle" font-weight="normal">.padding(insetLg)</text><text x="320" y="258" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">Style Dictionary transforms; the number changes unit, the name keeps its words.</text></svg>

The number changes unit on the way out; the name keeps its words, so a designer saying `inset-lg` and an engineer reading `insetLg` mean the same field.

The role words map cleanly onto each platform:

| Role | CSS | Jetpack Compose | SwiftUI |
|---|---|---|---|
| inset | `padding-block`, `padding-inline` | `Modifier.padding(PaddingValues(...))` | `.padding(EdgeInsets(...))` |
| stack | `gap` on a column | `Column(verticalArrangement = Arrangement.spacedBy(x))` | `VStack(spacing: x)` |
| inline | `gap` on a row | `Row(horizontalArrangement = Arrangement.spacedBy(x))` | `HStack(spacing: x)` |

Direction matters in all three. CSS logical properties (`padding-inline-start`), Compose's `start` and `end`, and SwiftUI's `leading` and `trailing` flip in right-to-left layouts; Compose's `PaddingValues.Absolute` and CSS's physical `padding-left` do not. Figma's padding fields are physical (`paddingLeft`), so a component padded unevenly in Figma has to be named by start and end in code.

Units behave differently too. A rem value grows when a reader raises the browser's text size; a dp or pt value does not. That is usually right for the web, where space should grow with text, but it means the same token renders differently under text scaling on each platform.

The worked case, with the scene's card in its two modes:

```css
/* Web: rem, mobile first */
:root { --space-400: 1rem; --space-600: 1.5rem; --inset-lg: var(--space-400); }
@media (min-width: 40rem) { :root { --inset-lg: var(--space-600); } }
.card { padding-block: var(--inset-lg); padding-inline: var(--inset-lg); }
```

```kotlin
// Compose: the mode is a runtime switch on the window size class
val insetLg = if (widthAtLeastMedium) 24.dp else 16.dp
Column(Modifier.padding(insetLg), verticalArrangement = Arrangement.spacedBy(stackMd)) { /* ... */ }
```

```swift
// SwiftUI: the mode is the horizontal size class
let insetLg: CGFloat = sizeClass == .regular ? 24 : 16
VStack(spacing: stackMd) { /* ... */ }.padding(insetLg)
```

The breakpoint differs: 640px (40rem) in this CSS, 600dp for Android's medium width class. Figma's two modes carry no width at all, so each platform picks its own threshold, and the documentation has to say which.

**Store every spacing token as a DTCG `dimension` in px, generate rem, dp and pt from it, and name every side by start and end, never left and right.** Write the breakpoint each platform uses beside the role table, since no token carries it. *Weight: moderate.* The DTCG format and Style Dictionary's transforms are shipped and documented; the platform mapping is each platform's own API.

---

## Spacing in Figma variables

In Figma, primitives and roles are two number-variable collections: primitives hidden and unscoped, roles scoped to gap with a mode per density or breakpoint, each carrying its code name.

The scene: designers can pick any of 40 number variables in the padding field, including radii, icon sizes and grid column widths. Half the cards use `space/400`, half `inset/md`, and nobody can tell which was meant.

Figma's mechanics, as of November 2026:

- **Bindable fields.** Auto-layout gap (`itemSpacing`), wrap gap (`counterAxisSpacing`), each padding side, and grid row and column gaps can all be bound to a number variable.
- **Scopes.** A number variable's scopes decide which pickers show it. The plugin API has a `GAP` scope and no separate padding scope, while Figma's help page lists gap and padding under auto layout; reports differ on whether a `GAP` variable reaches the padding picker, so check it in your own file (see *What to re-check later*). Scope primitives to nothing, so they never appear.
- **Hiding.** A collection or a single variable can be hidden from publishing, and aliases to it still resolve. That keeps primitives in the file and out of consumers' pickers.
- **Aliasing.** A variable can point at another of the same type, across collections and libraries.
- **Modes.** Up to 10 per collection on Professional, 20 on Organization, unlimited on Enterprise. Three breakpoints times two densities is six; put density and breakpoint in separate collections if both apply.
- **Code syntax.** Each variable can carry a name for Web, Android and iOS, shown in Dev Mode. It is display only and generates nothing.
- **Units.** Number variables have none. The export assigns px, and the build converts to rem.
- **Negatives.** Allowed. Figma's own Simple Design System has `space/negative-100` to `negative-600`.

The worked case, set up as two collections:

```
Primitives (1 mode, hidden from publishing, no scopes)
  space/100   4        code syntax WEB: var(--space-100)
  space/400  16
  space/600  24

Spacing (modes: Comfortable | Compact; scope: Gap)
  inset/md    → space/400 | space/300     WEB: var(--inset-md)   ANDROID: Spacing.insetMd
  inset/lg    → space/600 | space/400
  stack/md    → space/400 | space/200
  inline/sm   → space/200 | space/100
```

Here is what that looks like in Figma's variables panel, drawn as a sketch.

<svg role="img" viewBox="0 0 640 310" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A sketch of Figma’s variables panel: a hidden Primitives collection and a Spacing collection whose roles alias primitives, one column per mode, Comfortable and Compact</title><rect x="0" y="0" width="640" height="310" fill="#ffffff"/><rect x="10" y="10" width="620" height="290" rx="8" fill="#ffffff" stroke="#d9d9d9" stroke-width="1"/><rect x="10" y="10" width="620" height="32" rx="8" fill="#fafafa" stroke="none" stroke-width="1"/><text x="26" y="31" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Local variables</text><line x1="170" y1="42" x2="170" y2="300" stroke="#e6e6e6" stroke-width="1"/><text x="24" y="64" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Collections</text><text x="28" y="88" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">Primitives</text><text x="110" y="88" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">hidden</text><rect x="18" y="98" width="144" height="24" rx="4" fill="#e5f4ff" stroke="none" stroke-width="1"/><text x="28" y="115" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Spacing</text><text x="190" y="64" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Name</text><text x="380" y="64" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Comfortable</text><text x="510" y="64" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Compact</text><line x1="180" y1="72" x2="620" y2="72" stroke="#e6e6e6" stroke-width="1"/><text x="190" y="92" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">inset</text><text x="190" y="116" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">#</text><text x="204" y="116" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">inset/md</text><rect x="374" y="102" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="382" y="116" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/400</text><rect x="504" y="102" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="512" y="116" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/300</text><text x="190" y="142" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">#</text><text x="204" y="142" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">inset/lg</text><rect x="374" y="128" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="382" y="142" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/600</text><rect x="504" y="128" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="512" y="142" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/400</text><text x="190" y="168" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">stack</text><text x="190" y="192" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">#</text><text x="204" y="192" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">stack/md</text><rect x="374" y="178" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="382" y="192" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/400</text><rect x="504" y="178" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="512" y="192" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/200</text><text x="190" y="218" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">inline</text><text x="190" y="242" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">#</text><text x="204" y="242" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">inline/sm</text><rect x="374" y="228" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="382" y="242" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/200</text><rect x="504" y="228" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="512" y="242" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/100</text><text x="190" y="290" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">A sketch of Figma’s variables panel; labels may differ in your version.</text></svg>

Primitives sits in the sidebar, hidden from publishing. The Spacing collection lists each role once, with an alias chip under each mode instead of a number.

A card frame binds its four padding sides to `inset/lg` and its auto-layout gap to `stack/md`. Switching the page or frame to Compact previews the whole compact screen with no component change. Figma's own reference file keeps its scale in one `@size` collection (`space/050` to `space/4000`) and its responsive values in a separate collection.

And here is a card on the canvas with its auto-layout fields bound, beside the settings of the variable it uses.

<svg role="img" viewBox="0 0 640 306" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A sketch of a card frame in Figma with padding and gap bound to the inset/lg and stack/md variables, beside the variable’s settings: scoping set to Gap only, and code syntax for Web and Android</title><rect x="0" y="0" width="640" height="306" fill="#ffffff"/><text x="20" y="30" font-family="sans-serif" font-size="11" fill="#0d99ff" text-anchor="start" font-weight="normal">Card</text><rect x="20" y="36" width="250.0" height="146.2" rx="5.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="20.0" y="36.0" width="250.0" height="20.4" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="20.0" y="161.8" width="250.0" height="20.4" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="20.0" y="56.4" width="20.4" height="105.39999999999999" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="249.6" y="56.4" width="20.4" height="105.39999999999999" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="40.4" y="71.69999999999999" font-family="sans-serif" font-size="16.15" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><rect x="40.4" y="76.8" width="209.2" height="6.8" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><text x="40.4" y="96.35" font-family="sans-serif" font-size="11.9" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="40.4" y="113.35" font-family="sans-serif" font-size="11.9" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="40.4" y="117.6" width="209.2" height="13.6" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><rect x="40.4" y="131.2" width="68.0" height="30.599999999999998" rx="3.4" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="74.4" y="150.75" font-family="sans-serif" font-size="11.9" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="115.2" y="131.2" width="68.0" height="30.599999999999998" rx="3.4" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="149.2" y="150.75" font-family="sans-serif" font-size="11.9" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><rect x="20" y="36" width="250" height="146.2" rx="0" fill="none" stroke="#0d99ff" stroke-width="1.5"/><rect x="290" y="16" width="170" height="282" rx="6" fill="#ffffff" stroke="#d9d9d9" stroke-width="1"/><text x="302" y="40" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Auto layout</text><text x="302" y="70" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Gap</text><rect x="302" y="78" width="146" height="22" rx="4" fill="#f1edff" stroke="#6554c0" stroke-width="1"/><text x="310" y="93" font-family="monospace" font-size="11" fill="#6554c0" text-anchor="start" font-weight="normal">stack/md</text><text x="302" y="126" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Horizontal padding</text><rect x="302" y="134" width="146" height="22" rx="4" fill="#f1edff" stroke="#6554c0" stroke-width="1"/><text x="310" y="149" font-family="monospace" font-size="11" fill="#6554c0" text-anchor="start" font-weight="normal">inset/lg</text><text x="302" y="178" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Vertical padding</text><rect x="302" y="186" width="146" height="22" rx="4" fill="#f1edff" stroke="#6554c0" stroke-width="1"/><text x="310" y="201" font-family="monospace" font-size="11" fill="#6554c0" text-anchor="start" font-weight="normal">inset/lg</text><text x="302" y="236" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">Fields show a variable</text><text x="302" y="250" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">chip, not a number.</text><rect x="476" y="16" width="154" height="282" rx="6" fill="#ffffff" stroke="#d9d9d9" stroke-width="1"/><text x="488" y="40" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Edit variable</text><text x="488" y="62" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">inset/lg</text><text x="488" y="88" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Scoping</text><rect x="488" y="100" width="11" height="11" rx="2" fill="#0d99ff" stroke="#0d99ff" stroke-width="1"/><text x="506" y="110" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">Gap</text><rect x="488" y="122" width="11" height="11" rx="2" fill="#ffffff" stroke="#b3b3b3" stroke-width="1"/><text x="506" y="132" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">Corner radius</text><rect x="488" y="144" width="11" height="11" rx="2" fill="#ffffff" stroke="#b3b3b3" stroke-width="1"/><text x="506" y="154" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">Width and height</text><rect x="488" y="166" width="11" height="11" rx="2" fill="#ffffff" stroke="#b3b3b3" stroke-width="1"/><text x="506" y="176" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">Stroke</text><text x="488" y="202" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Code syntax</text><text x="488" y="222" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">Web</text><text x="488" y="236" font-family="monospace" font-size="10" fill="#172b4d" text-anchor="start" font-weight="normal">var(--inset-lg)</text><text x="488" y="254" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">Android</text><text x="488" y="268" font-family="monospace" font-size="10" fill="#172b4d" text-anchor="start" font-weight="normal">Spacing.insetLg</text><text x="488" y="286" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">iOS: Spacing.insetLg</text></svg>

The gap and padding fields show variable chips rather than numbers; the heading and its details sit in a nested frame of their own, whose gap is bound to `stack/sm`. The variable is scoped to Gap alone, so it is offered in the gap picker and nowhere else (whether the padding picker offers it too is untested here), and its code syntax carries one name per platform.

To set this up in your own file (Figma as of November 2026; menu labels move between releases):

1. Open the variables panel and create a collection named `Primitives` with one mode. Add a number variable per step, `space/100` (4) to `space/1600` (64).
2. Select all of them, edit them together, and clear every scope, so no picker offers a primitive.
3. Mark the collection hidden from publishing; aliases into it keep working.
4. Create a second collection, `Spacing`. Rename its first mode `Comfortable` and add a mode `Compact` (and, in a separate collection, breakpoint modes if you need them).
5. Add each role as a number variable (`inset/md`, `inset/lg`, `stack/md`, `inline/sm`, `layout/margin`) and, in each mode's cell, choose an alias to a primitive instead of typing a number.
6. Edit each role: under scoping, tick Gap only, then check that your padding picker offers it (reports differ); under code syntax, enter the Web, Android and iOS names your build generates.
7. On each component, select the frame, and in the auto-layout section bind the gap and each padding field to a role through the variable picker.
8. To preview compact, set the frame's or the page's mode for the `Spacing` collection to Compact; every bound field follows.

Figma also has Check designs (Organization and Enterprise, announced June 2026), which flags hard-coded spacing and padding and suggests the closest variable by similarity, a page at a time. It is a useful first pass and an imperfect one: forum reports have it suggesting a radius token for a gap.

**Set up two collections, primitives hidden and unscoped, roles scoped to Gap with density or breakpoint modes, and give every role variable its code syntax for each platform you ship.** The gap picker then shows only roles, the code name matches the token the build generates, and a mode switch on a frame previews a whole density. *Weight: moderate.* Scopes, hiding, aliasing and code syntax are Figma's documented API; the overlap of gap and padding is reported rather than documented, so check it in your own file before relying on it.

---

# Part three: getting there

## Auditing what exists

An audit counts every space in use, in Figma and in code, and sorts each into exact match, near match, legacy token, dynamic value or off-scale value.

The scene's library has 15px, 18px and 22px typed into frames, two meanings of `spacing-medium`, and a helper function in code that multiplies a grid unit. Before any new name is chosen, the team needs to know how much of each there is, because the mapping table is built from what is used, not from what is defined.

The inventory has two halves.

**In Figma**, walk every auto-layout frame and read `itemSpacing`, `counterAxisSpacing`, the four padding sides and the grid gaps. A field with a non-zero value and nothing in `boundVariables` is unbound; record its value and where it is. A bound field counts against its variable. Figma's library analytics API reports bound variable usage (`variable/usages`) but never unbound values, so the walk is what finds the raw ones. Design Lint has no padding or gap check.

**In code**, run a linter in report-only mode. Atlassian's `ensure-design-token-usage` checks a `spacing` domain, resolves a bare `gridSize()` to 8px and does the arithmetic (`gridSize() * 2` is 16), and skips any call with arguments, because it cannot know what a custom helper returns.

Polaris's stylelint config bans px, rem and em on padding, margin and gap. Primer's `primer/spacing` rule allows base sizes and accepts anything within 1px of one. Mozilla's `use-design-tokens` rule warns that a px value equals its rem token only at a 16px root.

Here is what the Figma walk finds on one card, with an illustrative tally for a whole library beside it.

<svg role="img" viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>The invoice card as the Figma walk sees it: an 18px top padding and the 15px gap above the buttons are typed numbers, the heading gap and the bottom padding are bound; beside it, an illustrative tally of values in five classes</title><rect x="0" y="0" width="640" height="250" fill="#ffffff"/><rect x="20" y="40" width="230" height="156" rx="6.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><text x="36" y="74" font-family="sans-serif" font-size="19" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="36" y="103" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="36" y="123" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="36" y="144" width="95" height="36" rx="4.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="83.5" y="167" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="139" y="144" width="95" height="36" rx="4.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="186.5" y="167" font-family="sans-serif" font-size="14" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><rect x="20" y="40.0" width="230" height="16" rx="0" fill="#de350b" stroke="none" stroke-width="1" opacity="0.22"/><line x1="252" y1="48.0" x2="264" y2="48.0" stroke="#de350b" stroke-width="1"/><rect x="264" y="39.0" width="84" height="18" rx="9" fill="#ffffff" stroke="#de350b" stroke-width="1"/><text x="306" y="52.0" font-family="sans-serif" font-size="10" fill="#de350b" text-anchor="middle" font-weight="bold">18 · typed</text><rect x="36" y="80.0" width="198" height="8" rx="0" fill="#1f845a" stroke="none" stroke-width="1" opacity="0.22"/><line x1="252" y1="84.0" x2="264" y2="84.0" stroke="#1f845a" stroke-width="1"/><rect x="264" y="75.0" width="84" height="18" rx="9" fill="#ffffff" stroke="#1f845a" stroke-width="1"/><text x="306" y="88.0" font-family="sans-serif" font-size="10" fill="#1f845a" text-anchor="middle" font-weight="bold">stack-sm</text><rect x="36" y="128.0" width="198" height="16" rx="0" fill="#de350b" stroke="none" stroke-width="1" opacity="0.22"/><line x1="252" y1="136.0" x2="264" y2="136.0" stroke="#de350b" stroke-width="1"/><rect x="264" y="127.0" width="84" height="18" rx="9" fill="#ffffff" stroke="#de350b" stroke-width="1"/><text x="306" y="140.0" font-family="sans-serif" font-size="10" fill="#de350b" text-anchor="middle" font-weight="bold">15 · typed</text><rect x="20" y="180.0" width="230" height="16" rx="0" fill="#1f845a" stroke="none" stroke-width="1" opacity="0.22"/><line x1="252" y1="188.0" x2="264" y2="188.0" stroke="#1f845a" stroke-width="1"/><rect x="264" y="179.0" width="84" height="18" rx="9" fill="#ffffff" stroke="#1f845a" stroke-width="1"/><text x="306" y="192.0" font-family="sans-serif" font-size="10" fill="#1f845a" text-anchor="middle" font-weight="bold">inset-md</text><text x="20" y="218" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">red: typed numbers · green: bound to a variable</text><rect x="360" y="60" width="10" height="10" rx="0" fill="#36b37e" stroke="none" stroke-width="1"/><text x="378" y="69" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Exact match</text><text x="378" y="84" font-family="monospace" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">16 → space-400</text><text x="620" y="69" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="end" font-weight="normal">212</text><rect x="360" y="94" width="10" height="10" rx="0" fill="#00b8d9" stroke="none" stroke-width="1"/><text x="378" y="103" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Near match</text><text x="378" y="118" font-family="monospace" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">15, 17 → nearest</text><text x="620" y="103" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="end" font-weight="normal">31</text><rect x="360" y="128" width="10" height="10" rx="0" fill="#6554c0" stroke="none" stroke-width="1"/><text x="378" y="137" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Legacy token</text><text x="378" y="152" font-family="monospace" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">spacing-medium</text><text x="620" y="137" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="end" font-weight="normal">96</text><rect x="360" y="162" width="10" height="10" rx="0" fill="#5e6c84" stroke="none" stroke-width="1"/><text x="378" y="171" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Dynamic</text><text x="378" y="186" font-family="monospace" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">gridSize(3)</text><text x="620" y="171" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="end" font-weight="normal">7</text><rect x="360" y="196" width="10" height="10" rx="0" fill="#de350b" stroke="none" stroke-width="1"/><text x="378" y="205" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Off-scale</text><text x="378" y="220" font-family="monospace" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">18, 22</text><text x="620" y="205" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="end" font-weight="normal">46</text><text x="360" y="44" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Library tally (illustrative)</text></svg>

The red fields hold typed numbers; the green ones are already bound. The tally sorts every value the walk and the linter find into five classes:

| Class | Example | What happens to it |
|---|---|---|
| Exact match | `16px` where `space-400` is 16 | replaced automatically |
| Near match | `15px`, `17px` | the nearest step, reviewed (Primer allows 1px either way) |
| Legacy token | `spacing-medium` | renamed through the mapping table |
| Dynamic | `gridSize(3)`, `calc()` | skipped and flagged for a person |
| Off-scale | `18px`, `22px` | a new step, the nearest step, or a recorded exception |

The worked case is the scene's 18px. Say it appears 40 times, all as a card's top padding. That is not noise: it is a missing role with a consistent value. Moving it to 16px changes 40 cards visibly; moving it to 20px adds a step. A single 22px in one frame is noise and goes to the nearest step. The counts decide, which is why the inventory comes before the model.

**Inventory both sides before choosing names: walk Figma's auto-layout fields for unbound values, run the code linter in report mode, and sort every value into the five classes with its count.** A value that appears often and consistently off the scale is a missing step or role; a rare one is noise. *Weight: moderate.* The Figma walk follows the plugin API's documented binding model; the classes are what Atlassian's, Polaris's and Primer's tools each implement in part.

---

## Migrating old tokens

A migration is a table from old name to new name with values, a codemod for exact matches, a flag on everything else, and a lint rule that ratchets so nothing new arrives.

The scene's team now has its new model and 600 uses of the old one. The temptation is to change names and values in one pass, tidying as it goes. Then a screen that moved by 4px cannot be traced: was it the rename, the rounding, or a bug?

Four migrations show the parts.

**Carbon v10 to v11** kept every value and changed names: `$layout-01` became `$spacing-05` (1rem), `$layout-04` became `$spacing-09` (3rem), `$layout-07` became `$spacing-13` (10rem). It removed `$spacing-4xs` to `$spacing-3xl` with no replacement. Its stylelint plugin has a `carbon/layout-use` rule with auto-fix and an allow-list for accepted exceptions.

**Polaris v11 to v12** renamed with no value change, `--p-space-4` to `--p-space-400` across 16 steps, run as `npx @shopify/polaris-migrator v12-styles-replace-custom-property-space`, then checked with a search for the old names until it found none. The one deliberate value change, a legacy card's padding from 20px to 16px, was documented apart from the rename.

Earlier Polaris codemods converted raw `16px`, `1rem` and `rem(16px)` on padding, margin and gap to a token, and left a comment on anything they could not convert, asking for a manual upgrade.

**Primer** published a table from Sass to custom properties (`$spacer-3` to `--base-size-16`, and so on), and for values between steps advised the raw value or the closest step. Its linter auto-fixes within 1px.

**Atlassian** shipped spacing linting with a preview that warned on spacing while colour stayed an error, then made spacing an error by default in version 8. Its autofix applies only exact matches; `gridSize() * 7` (56px) and `* 9` (72px) have no token and stay flagged.

The worked case, with the scene's table. Note the 18px row and the two `spacing-medium` rows.

| Old | Value | New | Value | Kind |
|---|---|---|---|---|
| `spacing-xs` | 4 | `space-100` | 4 | rename |
| `spacing-s` | 8 | `space-200` | 8 | rename |
| `spacing-medium` (file A) | 16 | `space-400` | 16 | rename |
| `spacing-medium` (file B) | 8 | `space-200` | 8 | rename, by file |
| `18px` (40 card tops) | 18 | `inset-md` | 16 | value change, reviewed |
| `gridSize() * 7` | 56 | none | | flagged, by hand |

Run it in this order. Renames first, in their own change, with no visible difference anywhere. Value changes second, each reviewed on screen. Flagged items last, by hand. Then turn the lint rule on, with remaining exceptions marked by a generated comment (Polaris marks its own "DO NOT COPY") so the backlog stays visible and nothing new joins it.

Here is the order as a line.

<svg role="img" viewBox="0 0 640 166" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Migration as four steps in order: renames with no visible change, reviewed value changes, hand-fixed leftovers, then the lint rule switched to error</title><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5e6c84"/></marker></defs><rect x="0" y="0" width="640" height="166" fill="#ffffff"/><rect x="10" y="30" width="140" height="92" rx="8" fill="#ffffff" stroke="#6554c0" stroke-width="2"/><rect x="10" y="30" width="140" height="8" rx="4" fill="#6554c0" stroke="none" stroke-width="1"/><text x="80" y="64" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">1  Renames</text><text x="80" y="88" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">same values,</text><text x="80" y="104" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">nothing moves</text><line x1="152" y1="76" x2="176" y2="76" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="168" y="30" width="140" height="92" rx="8" fill="#ffffff" stroke="#ff8b00" stroke-width="2"/><rect x="168" y="30" width="140" height="8" rx="4" fill="#ff8b00" stroke="none" stroke-width="1"/><text x="238" y="64" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">2  Value changes</text><text x="238" y="88" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">each one reviewed</text><text x="238" y="104" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">on screen</text><line x1="310" y1="76" x2="334" y2="76" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="326" y="30" width="140" height="92" rx="8" fill="#ffffff" stroke="#de350b" stroke-width="2"/><rect x="326" y="30" width="140" height="8" rx="4" fill="#de350b" stroke="none" stroke-width="1"/><text x="396" y="64" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">3  Leftovers</text><text x="396" y="88" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">flagged items,</text><text x="396" y="104" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">fixed by hand</text><line x1="468" y1="76" x2="492" y2="76" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="484" y="30" width="140" height="92" rx="8" fill="#ffffff" stroke="#36b37e" stroke-width="2"/><rect x="484" y="30" width="140" height="8" rx="4" fill="#36b37e" stroke="none" stroke-width="1"/><text x="554" y="64" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">4  Lint to error</text><text x="554" y="88" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">exceptions marked,</text><text x="554" y="104" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">nothing new joins</text><text x="320" y="150" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="normal">Only step 2 changes what a person sees.</text></svg>

Only the second step changes anything a person can see, which is why it is the one reviewed screen by screen.

In Figma the same table drives a plugin pass: rebind each matching field with `setBoundVariable`, keep the old variables as aliases to the new ones for one release so files built on them still resolve, then deprecate and delete. Re-run the audit's walk to confirm the unbound count dropped.

**Migrate in three separate passes (renames with no value change, then reviewed value changes, then hand-fixed leftovers), and only then switch the lint rule to error with the remaining exceptions marked.** Keep old Figma variables as aliases for one release so files built on them do not break. *Weight: strong.* Carbon and Polaris separated renames from value changes; Polaris and Atlassian codemodded exact matches only and flagged the rest; Atlassian ratcheted from warning to error.

---

## Documenting the model

Each token's documentation says what it is for, what it is not for, which modes change it and what it aliases, with a picture of it in use.

The scene's designers will choose between `inset-md` and `stack-md` dozens of times a day. If the page lists only values, they pick by number, and the roles collapse back into a scale.

Systems document spacing at three depths. Carbon lists `$spacing-01` to `$spacing-13` with values and no per-token guidance. Atlassian gives usage bands per range and, for its newer tokens, a sentence each, including what not to use it for. Primer attaches a usage rule to every functional token, written so that an agent can read it as well as a person: "use condensed for dense lists, normal for standard layouts".

The worked case is one role, as its documentation entry:

```
inset-lg
  Use for: padding inside cards, panels and dialogs.
  Not for: gaps between items (stack-*, inline-*); page margins (layout-margin).
  Value: space-600 (24px). Compact: space-400 (16px). Mobile: space-400 (16px).
  Code: var(--inset-lg) · Spacing.insetLg (Android) · Spacing.insetLg (iOS)
  Figma: Spacing/inset/lg, scope Gap.
```

Here is the same entry as a docs page shows it, with the picture of it in use.

<svg role="img" viewBox="0 0 640 270" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A documentation entry for the inset-lg role: a card with its inset shaded, beside use-for and not-for lines, its value in each mode, and its code and Figma names</title><rect x="0" y="0" width="640" height="270" fill="#ffffff"/><rect x="10" y="10" width="620" height="250" rx="10" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><text x="30" y="44" font-family="monospace" font-size="18" fill="#172b4d" text-anchor="start" font-weight="bold">inset-lg</text><text x="30" y="66" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">Padding inside cards, panels and dialogs.</text><rect x="30" y="84" width="250.0" height="129.0" rx="5.0" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="30.0" y="84.0" width="250.0" height="18.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="30.0" y="195.0" width="250.0" height="18.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="30.0" y="102.0" width="18.0" height="93.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="262.0" y="102.0" width="18.0" height="93.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="48.0" y="115.5" font-family="sans-serif" font-size="14.25" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="48.0" y="137.25" font-family="sans-serif" font-size="10.5" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="48.0" y="152.25" font-family="sans-serif" font-size="10.5" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="48.0" y="168.0" width="67.5" height="27.0" rx="3.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="81.75" y="185.25" font-family="sans-serif" font-size="10.5" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="121.5" y="168.0" width="67.5" height="27.0" rx="3.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="155.25" y="185.25" font-family="sans-serif" font-size="10.5" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="155" y="229" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="middle" font-weight="normal">the shaded band is inset-lg</text><text x="304" y="100" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Use for</text><text x="392" y="100" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">card, panel and dialog padding</text><text x="304" y="124" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Not for</text><text x="392" y="124" font-family="sans-serif" font-size="11" fill="#de350b" text-anchor="start" font-weight="normal">gaps (stack-*, inline-*), page margin</text><text x="304" y="148" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Comfortable</text><text x="392" y="148" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space-600 · 24px</text><text x="304" y="172" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Compact</text><text x="392" y="172" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space-400 · 16px</text><text x="304" y="196" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Code</text><text x="392" y="196" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">var(--inset-lg) · Spacing.insetLg</text><text x="304" y="220" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Figma</text><text x="392" y="220" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">Spacing/inset/lg · scope Gap</text></svg>

The shaded band is the token, drawn where it lives; the red not-for line is the one most pages leave out.

That entry answers the four questions a designer and an engineer ask, and its not-for line is what keeps inset and gap apart.

**Write a use-for line, a not-for line, the value per mode and the code names for every role token, in the Figma variable's description and on the docs page, from one source.** The not-for line is the one that holds the roles apart in daily use. *Weight: moderate.* Atlassian and Primer document usage per token; Carbon's values-only page leaves the choice to the number.

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
| Responsive | large roles per breakpoint; the scale fixed | a smaller scale on phones |
| Direction | start and end | left and right |
| Format | DTCG `dimension` in px; build to rem, dp, pt | three hand-typed numbers |
| Figma | primitives hidden, unscoped; roles scoped to Gap, with modes and code syntax | every number variable in every picker |
| Audit | Figma walk and code lint, five classes, with counts | choosing names first |
| Migration | renames, then values, then leftovers; then ratchet the lint | everything in one pass |
| Docs | use for, not for, value per mode, code names | a table of values |

---

## The short version

Build your spacing model in two layers. The primitive layer is a 4px scale of 10 to 16 steps named by number, either as a multiplier with the base stated (`space-100` is 4px, `space-400` is 16px) or as the value itself (`space-16`), never by t-shirt size: Carbon, Orbit and TDesign each migrated away from t-shirt names because they leave no room for an in-between step. This part is strong.

On top of it, add role tokens in four families: `inset` for padding inside containers, `stack` for vertical gaps, `inline` for horizontal gaps and `layout` for page margins and region gaps, a handful of sizes each, every one an alias to a primitive. A role earns its place only when a mode will change it: density (SLDS and Ant remap their roles in compact), pointer (Primer), breakpoint or platform (Polaris's mobile card gap). A role that never changes is a second name for one decision, which is why Carbon removed its layout scale. Add component tokens only where one component needs its own knob. This part is moderate.

Use the roles where they belong. Inside a control, make height its own token and derive padding from it, less the border, or your 32px button renders 34px. Between components, the parent owns the gap through `gap` or a layout component (`Stack`, `Inline`, `Box`, `Bleed`), and components carry no outer margin; that part is strong. Keep the scale fixed across screens and give only the large roles a value per breakpoint, as GOV.UK does. Store tokens as DTCG dimensions in px, generate rem, dp and pt, and name sides start and end. In Figma, primitives go in a hidden, unscoped collection; roles go in a collection scoped to Gap, with density or breakpoint modes and code syntax per platform. Those parts are moderate.

Get there by auditing first: walk Figma's auto-layout fields for unbound values and lint the code in report mode, then sort every value into exact match, near match, legacy token, dynamic or off-scale, with counts, because a frequent off-scale value is a missing role. Migrate in three passes, renames first with no visible change, then reviewed value changes, then leftovers by hand, and only then make the lint an error, as Polaris, Carbon and Atlassian did; that is strong. Write each role's use-for and not-for lines in the Figma description and the docs from one source, and tell the people downstream which breakpoint each platform uses, since no token carries it. Every system read here has renamed its spacing at least once; keep the old names as aliases for a release and nobody's file breaks.

---

## What to re-check later

Researched 2026-11-16 from the systems' source files, documentation and migration guides, read that day.

- **Figma (volatile).** The padding scope: the plugin API lists only `GAP`, Figma's help page lists gap and padding, and a forum report of April 2026 says padding is not offered as a scope; not tested here. Mode caps per plan and Check designs' plan availability (Organization and Enterprise, June 2026) change with pricing. The REST variables API needs an Enterprise full seat.
- **Atlassian's `space.gap.*` and `space.inset.*`** are marked experimental in `@atlaskit/tokens` 20.12; names may change before they are stable.
- **Style Dictionary and DTCG 2025.10.** Object-form dimensions are not fully supported as of this date.
- **`text-box-trim`** became Baseline in August 2026 per MDN; caniuse lists Chrome 133, Edge 132, Safari 18.2 and Firefox 154.
- **Polaris** is archived on GitHub, and its docs now redirect to shopify.dev, so the Box documentation was not read. Its Card's JSDoc and code disagree on the default padding (`{xs: '400', sm: '500'}` against `{xs: '400'}`).
- **Not found:** a stated reason for Polaris's v12 rename; Atlassian's reason for having no role tokens until now; any published adoption number for spacing tokens. Material 3's layout pages did not resolve, so its margins (often quoted as 16 and 24dp) are unchecked; Apple's 44pt and Material's 48dp targets were not re-read here.
- **GOV.UK's page width** is 960px in source and 1020px in its docs; not settled.
- **Counts** (Primer about 44 role tokens; Spectrum about 387 literals to 88 aliases) were counted from the files by structure and are approximate.
- **Figures.** The two Figma figures are sketches drawn from Figma's documentation, not screenshots; panel labels and the setup steps' menu names change between releases. The audit tally's counts are illustrative.
- **Curtis's 2016 essay** was read on Substack (the Medium original refused the fetch); its images, which may hold token names, were not checked.

---

## Sources

**Primary**

- [Atlassian, spacing foundations](https://atlassian.design/foundations/spacing)
- [Atlassian, spacing tokens JSON, `@atlaskit/tokens` 13.0.4](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@13.0.4/figma/atlassian-spacing.json)
- [Atlassian, spacing tokens raw, current](https://unpkg.com/@atlaskit/tokens/dist/es2019/artifacts/tokens-raw/atlassian-spacing.js)
- [Atlassian, introducing the spacing scale (community post, 2023-01-23)](https://community.developer.atlassian.com/t/introducing-the-spacing-scale-the-beginnings-of-an-atlassian-spacing-system/65393)
- [Atlassian, Bleed primitive](https://atlassian.design/components/primitives/bleed/examples)
- [Atlassian, Button compiled CSS, 25.8.1](https://unpkg.com/@atlaskit/button@25.8.1/dist/es2019/new-button/variants/shared/button-base.compiled.css)
- [Polaris, `space.ts`](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-tokens/src/themes/base/space.ts)
- [Polaris, migrating from v11 to v12](https://raw.githubusercontent.com/Shopify/polaris-react-archive/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)
- [Polaris, Button styles](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-react/src/components/Button/Button.module.css)
- [Carbon, layout tokens](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/layout/tokens/layout.tokens.json)
- [Carbon, v11 migration guide](https://raw.githubusercontent.com/carbon-design-system/carbon/main/docs/migration/v11.md)
- [Carbon, issue #5602, consolidating layout into spacing](https://github.com/carbon-design-system/carbon/issues/5602)
- [Carbon, spacing overview](https://carbondesignsystem.com/elements/spacing/overview/)
- [Carbon, 2x grid overview](https://carbondesignsystem.com/elements/2x-grid/overview/)
- [Carbon, button mixins](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/components/button/_mixins.scss)
- [Primer, base size tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/base/size/size.json5)
- [Primer, functional size tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/size.json5)
- [Primer, migrating from Sass](https://primer.style/product/primitives/migrating/)
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
- [Tailwind CSS v4 theme](https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/packages/tailwindcss/theme.css)
- [Radix Themes, space tokens](https://raw.githubusercontent.com/radix-ui/themes/main/packages/radix-ui-themes/src/styles/tokens/space.css)
- [SLDS 2, spacing custom properties](https://cdn.jsdelivr.net/npm/@salesforce-ux/design-system@2.26.3/design-tokens/dist/spacing.custom-props.scss)
- [SLDS 1, design tokens](https://v1.lightningdesignsystem.com/design-tokens/)
- [TDesign, size tokens](https://raw.githubusercontent.com/Tencent/tdesign-common/develop/style/web/theme/_size.less)
- [Orbit, v16 migration guide](https://github.com/kiwicom/orbit/blob/master/docs/src/documentation/05-development/04-migration-guides/12-v16.mdx)
- [Braid, base tokens](https://raw.githubusercontent.com/seek-oss/braid-design-system/master/packages/braid-design-system/src/lib/themes/baseTokens/nvl.ts)
- [Braid, layout foundations](https://seek-oss.github.io/braid-design-system/foundations/layout)
- [GitLab Pajamas, spacing](https://design.gitlab.com/product-foundations/spacing)
- [Figma, Simple Design System tokens](https://raw.githubusercontent.com/figma/sds/main/scripts/tokens/tokens.json)
- [Figma plugin API, `VariableScope`](https://developers.figma.com/docs/plugins/api/VariableScope/)
- [Figma plugin API, `VariableBindableNodeField`](https://developers.figma.com/docs/plugins/api/VariableBindableNodeField/)
- [Figma help, guide to variables](https://help.figma.com/hc/en-us/articles/15145852043927-Guide-to-variables-in-Figma)
- [Figma help, modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)
- [Figma help, plans and features](https://help.figma.com/hc/en-us/articles/360040328273)
- [Figma help, Check designs](https://help.figma.com/hc/en-us/articles/39592284074263)
- [Figma forum, padding as a variable scope (April 2026)](https://forum.figma.com/report-a-problem-6/in-variables-is-there-an-option-for-padding-in-scope-53027)
- [Figma REST API, library analytics](https://developers.figma.com/docs/rest-api/library-analytics-endpoints/)
- [W3C DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/)
- [Style Dictionary, predefined transforms](https://styledictionary.com/reference/hooks/transforms/predefined/)
- [Style Dictionary, DTCG support](https://styledictionary.com/info/dtcg/)
- [Android, window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)
- [Android, `PaneScaffoldDirective.kt`](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/adaptive/adaptive-layout/src/commonMain/kotlin/androidx/compose/material3/adaptive/layout/PaneScaffoldDirective.kt)
- [Android, `PaddingValues`](https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/PaddingValues)
- [MDN, `text-box-trim`](https://developer.mozilla.org/en-US/docs/Web/CSS/text-box-trim)
- [caniuse, `text-box-trim`](https://caniuse.com/css-text-box-trim)
- [WCAG 2.2, Understanding 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [CSSWG issue #7707, matching nested radius](https://github.com/w3c/csswg-drafts/issues/7707)
- [Mozilla, `use-design-tokens` space rule](https://firefox-source-docs.mozilla.org/code-quality/lint/linters/stylelint-plugin-mozilla/rules/use-design-tokens/space.html)

**Commentary**

- [Nathan Curtis, Space in Design Systems (2016)](https://nathanacurtis.substack.com/p/space-in-design-systems-188bcbae0d62)
- [Nathan Curtis, Naming Tokens in Design Systems (2020)](https://nathanacurtis.substack.com/p/naming-tokens-in-design-systems-9e86c7444676)
- [Every Layout, the Stack](https://every-layout.dev/layouts/stack/)
- [Utopia, space calculator](https://utopia.fyi/space/calculator/)
- [Cloud Four, the math behind nesting rounded corners](https://cloudfour.com/thinks/the-math-behind-nesting-rounded-corners/)

**Cited but not resolved to a URL**

- Atlassian's `@atlaskit/eslint-plugin-design-system` rule sources were read inside the npm package (16.16.0), not at a web URL.
- Polaris's stylelint-polaris and polaris-migrator docs were read in the archived repository's content folder; the public pages redirect.
