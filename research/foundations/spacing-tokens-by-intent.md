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

Take an illustrative library and see what each scheme does when it needs a new 20px step:

| Scheme | Names around 20px | Adding 20px |
|---|---|---|
| T-shirt | `spacing-m` (16), `spacing-l` (24) | needs `spacing-ml`, or a rename |
| Ordinal | `spacing-05` (16), `spacing-06` (24) | renumbers every step above it |
| Multiplier, 4px base | `space-400` (16), `space-600` (24) | `space-500`; nothing else moves |
| Value | `size-16`, `size-24` | `size-20`; nothing else moves |

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

Here is a card drawn with the three main roles marked.

<svg role="img" viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A card showing inset padding around its content, stack gaps between its heading, text and actions, and an inline gap between two buttons</title><rect x="0" y="0" width="640" height="260" fill="#ffffff"/><rect x="40" y="20" width="360" height="220" rx="12" fill="#f4f5f7" stroke="#c1c7d0"/><rect x="64" y="44" width="312" height="172" fill="none" stroke="#6554c0" stroke-width="2" stroke-dasharray="5 4"/><rect x="64" y="44" width="200" height="24" rx="4" fill="#253858"/><rect x="64" y="68" width="312" height="16" fill="#36b37e" opacity="0.35"/><rect x="64" y="84" width="312" height="14" rx="3" fill="#97a0af"/><rect x="64" y="104" width="260" height="14" rx="3" fill="#97a0af"/><rect x="64" y="118" width="312" height="58" fill="#36b37e" opacity="0.35"/><rect x="64" y="176" width="96" height="36" rx="6" fill="#0052cc"/><rect x="160" y="176" width="12" height="36" fill="#ff8b00" opacity="0.6"/><rect x="172" y="176" width="96" height="36" rx="6" fill="#ffffff" stroke="#0052cc"/><text x="420" y="50" font-family="sans-serif" font-size="14" fill="#5243aa">inset: padding inside the card</text><text x="420" y="80" font-family="sans-serif" font-size="14" fill="#1f845a">stack: heading to text (small)</text><text x="420" y="150" font-family="sans-serif" font-size="14" fill="#1f845a">stack: text to actions (larger)</text><text x="420" y="200" font-family="sans-serif" font-size="14" fill="#b65c02">inline: between buttons</text></svg>

The dashed line is the inset, the green bands are stack gaps, and the orange strip is the inline gap. Each is its own decision even when two of them land on the same number.

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

The trap runs the other way too. Fluent's `spacingHorizontalM` and `spacingVerticalM` are both 12px, and have been since they shipped. The split was made to allow them to diverge, a fair bet, but a role that never diverges is Carbon's layout scale again: two names, one decision.

**Add a role only where you can name the mode that will change it: density, pointer type, breakpoint or platform.** If the answer is "none, but it reads nicely", keep the primitive and write the usage in its description, as Atlassian did for years. *Weight: strong.* SLDS, Ant, Primer and Polaris each change role values per mode with no component edits, and Carbon removed a role scale that never changed.

---

## How many role tokens

A useful role layer is small, tens of tokens rather than hundreds, and component tokens appear only where one component needs a knob the roles cannot give.

The scene, a year on: the team has added `card-header-padding-top`, `card-header-padding-top-compact` and `modal-footer-gap-mobile`, one request at a time. Nobody remembers which of the 300 names alias a role and which hold a number someone typed.

Counting tells the story. Braid has one role name (`gutter`). Polaris has four aliases (`space-button-group-gap`, `space-card-gap`, `space-card-padding`, `space-table-cell-padding`). Fluent has 22, SLDS 24 variable tokens, Ant about 21 aliases plus per-component tokens, Primer about 44. Spectrum has several hundred, because it names relationships per component (`component-edge-to-text-100`, `field-label-to-component`, `card-edge-to-content-default-medium`).

Spectrum also shows what that count costs. Most of its layout values are written as literal pixels, not aliases: roughly 387 literals against 88 references in its layout file, and every card token is a literal. A literal in the semantic layer breaks the link to the scale, so changing the scale changes nothing below it, and an audit cannot tell an on-scale literal from an off-scale one. At that point the role layer has become a second scale.

The three layers line up like this, with the scene's card padding at 16px:

| Layer | Card padding | What changes it |
|---|---|---|
| Primitive | `space-400` = 16px | nothing; it is the scale |
| Role | `inset-md` → `space-400` | density, breakpoint, platform |
| Component | `card-padding` → `inset-md` | one component's own variant or brand |

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

Small roles hold, as GOV.UK's small units do; large ones step down.

**Do not make the primitive scale responsive; give the large roles (`inset-lg`, `stack-section`, `layout-margin`) a value per breakpoint mode and leave the small ones fixed.** Write the breakpoint widths in the documentation or a separate variable, since a Figma mode carries no width (see [Spacing in Figma variables](#spacing-in-figma-variables)). *Weight: moderate.* GOV.UK is the one shipped per-breakpoint map and it shrinks only its large steps; the others keep the scale fixed and vary layout.

---

## One model, three platforms

A platform-agnostic token is a name, a number and a unit; each platform's build turns it into rem, dp or pt, and the role words map onto each platform's own layout tools.

The scene: the same card ships on web, Android and iOS. Designers bind `inset-md` in Figma. The web team writes `padding: 16px`, Android writes `16.dp`, iOS writes `16`. Three numbers that agree today and three places to forget when compact mode arrives.

The token format sets the common ground. The W3C DTCG Format Module (2025.10, a final Community Group report of 28 October 2025) has a `dimension` type with a value and a unit, and the unit must be `px` or `rem`; there is no `spacing` type and no viewport unit.

Style Dictionary then converts per platform: `size/pxToRem` for CSS (base 16), `size/dp` and `size/compose/remToDp` for Android, `size/swift/remToCGFloat` for iOS. Its own documentation says DTCG 2025.10's object form is not fully supported yet, so check what the build emits.

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
- **Scopes.** A number variable's scopes decide which pickers show it. The plugin API has a `GAP` scope and no separate padding scope, while Figma's help page lists gap and padding under auto layout; in practice a `GAP` variable appears in both pickers. Scope primitives to nothing, so they never appear.
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

A card frame binds its four padding sides to `inset/lg` and its auto-layout gap to `stack/md`. Switching the page or frame to Compact previews the whole compact screen with no component change. Figma's own reference file keeps its scale in one `@size` collection (`space/050` to `space/4000`) and its responsive values in a separate collection.

Figma also has Check designs (Organization and Enterprise, announced June 2026), which flags hard-coded spacing and padding and suggests the closest variable by similarity, a page at a time. It is a useful first pass and an imperfect one: forum reports have it suggesting a radius token for a gap.

**Set up two collections, primitives hidden and unscoped, roles scoped to Gap with density or breakpoint modes, and give every role variable its code syntax for each platform you ship.** The padding picker then shows only roles, the code name matches the token the build generates, and a mode switch on a frame previews a whole density. *Weight: moderate.* Scopes, hiding, aliasing and code syntax are Figma's documented API; the overlap of gap and padding is reported rather than documented, so check it in your own file before relying on it.

---

# Part three: getting there

## Auditing what exists

An audit counts every space in use, in Figma and in code, and sorts each into exact match, near match, legacy token, dynamic value or off-scale value.

The scene's library has 15px, 18px and 22px typed into frames, two meanings of `spacing-medium`, and a helper function in code that multiplies a grid unit. Before any new name is chosen, the team needs to know how much of each there is, because the mapping table is built from what is used, not from what is defined.

The inventory has two halves.

**In Figma**, walk every auto-layout frame and read `itemSpacing`, `counterAxisSpacing`, the four padding sides and the grid gaps. A field with a non-zero value and nothing in `boundVariables` is unbound; record its value and where it is. A bound field counts against its variable. Figma's library analytics API reports bound variable usage (`variable/usages`) but never unbound values, so the walk is what finds the raw ones. Design Lint has no padding or gap check.

**In code**, run a linter in report-only mode. Atlassian's `ensure-design-token-usage` checks a `spacing` domain, resolves a bare `gridSize()` to 8px and does the arithmetic (`gridSize() * 2` is 16), and skips any call with arguments, because it cannot know what a custom helper returns.

Polaris's stylelint config bans px, rem and em on padding, margin and gap. Primer's `primer/spacing` rule allows base sizes and accepts anything within 1px of one. Mozilla's `use-design-tokens` rule warns that a px value equals its rem token only at a 16px root.

Then classify every value:

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
