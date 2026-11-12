# When to split or merge a component

One test for whether a change to a design is a new component or a new value on an existing one, walked through the button family.

A designer proposes an Icon button. Someone else wants a Compact button, a third a Loading button, and the library already has a Context button that opens menus and an Interactive icon that is just a clickable glyph. Each looks like its own thing on the canvas. Design systems keep reversing themselves on exactly this question, splitting a component one year and folding it back the next.

The reversals converge on a single test. **Split when the element, its role or its keyboard behaviour changes; fold back in when only the appearance or the status does.**

---

## What this answers

- [Component or value](#component-or-value): new component, or a new value
- [Booleans as one axis](#booleans-as-one-axis): when several booleans are one axis
- [Separate icon buttons](#separate-icon-buttons): whether icon buttons should be separate
- [Compact buttons and bare icons](#compact-buttons-and-bare-icons): whether compact buttons and bare icons are components
- [Four buttons become two](#four-buttons-become-two): how one library's four buttons became two
- [Loading beyond a boolean](#loading-beyond-a-boolean): when loading has outgrown the button
- [New looks as theme variants](#new-looks-as-theme-variants): whether a new look is a theme variant

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in one paragraph.

---

## Component or value

If a change alters the rendered element, its ARIA role or its keyboard behaviour, it is a different component; if it only changes the appearance or reports a status, it is a prop.

Take a list of settings where each row can be clicked. In MUI v4 that row was written as a list item with a flag on it:

```jsx
// v4: a boolean changes the element
<ListItem button>Notifications</ListItem>

// v5 on: its own component
<ListItemButton>Notifications</ListItemButton>
```

The flag looked like a small style option. It wasn't: an `<li>` isn't interactive, so `button` was quietly turning the row into a different element, with a different role and different keys. v5 made `ListItemButton` its own component, and v6 removed `button`, `disabled` and `selected` from `ListItem` altogether. `MenuItem` was re-parented the same way, from `ListItem` onto `ButtonBase`.

MUI has applied the test in the other direction too, within the same two years. `LoadingButton` lived in `@mui/lab` for years. Then v6.4.0 made loading a prop on `Button` and `IconButton`, because loading is a status a button passes through and changes none of the three.

The test settles names as well as boundaries. When MUI built a better `Grid`, the new one took the good name in v7 and the old one became `GridLegacy`, deleted in v9. The best name goes to the thing people should use.

Atlassian shows the fold inside a single npm package. The legacy `@atlaskit/button` keeps `isLoading` on a separate `LoadingButton`. The redesigned `Button`, `IconButton` and `LinkButton` share it on `CommonButtonProps`.

The argument for a separate loading component was bundle weight: [MUI's 2024 issue](https://github.com/mui/material-ui/issues/42684) complained of installing a lab package for one button. That has no analogue in Figma, where an unused variant costs a file nothing.

Run the test whenever someone proposes a new Figma family: does the element, the role or the keyboard behaviour change? **Write the answer into the component's description, so the next proposal starts from it.**

---

## Booleans as one axis

Several booleans are one axis when they can't both be true, or when nobody designed their combination; MUI's written rule is a boolean for two values, an enum for three or more, and booleans defaulting to `false`.

The arithmetic compounds fast. Seven booleans make 128 combinations, and perhaps six of them were ever designed. The rest are cells a designer can reach in the properties panel and nobody can say what they should look like.

Polaris ran this experiment in public. By v11 its `Button` had seven interacting booleans. v12 replaced them with two enums, `variant` and `tone`:

| Polaris v11 | Polaris v12 |
|---|---|
| `<Button plain />` | `<Button variant="plain" />` |
| `<Button primary plain />` | `<Button variant="tertiary" />` |
| `<Button destructive />` | `<Button variant="primary" tone="critical" />` |
| `<Button primarySuccess />` | `<Button variant="primary" tone="success" />` |
| `outline`, `monochrome` | removed; the default button |
| `connectedDisclosure` | removed |

The second row is the tell: `primary` and `plain` together meant a third thing, tertiary, that neither flag named. The same release collapsed `Modal`'s `small`, `large` and `fullScreen` into `size`. It renamed Banner's `status` and Icon's `color` both to `tone`, so one word meant one thing everywhere, and shipped a `polaris-migrator` codemod to make the move.

In Figma a variant property is the dropdown and a boolean property is the toggle. So a kit with separate Primary and Destructive toggles has rebuilt Polaris v11.

MUI breaks its own rule twice, and both breaks are instructive:

- **Card** carries `variant="outlined"` and a `raised` boolean, three appearances on two props. It survives only because `raised` predates `variant`: legacy, not design.
- **Alert** carries `severity` and `color` with overlapping values, and that one is right. Meaning and colour are separable, so a brand can recolour a severity without lying about it.

[John Gozde of Imply](https://imply.io/blog/an-opinionated-guide-to-component-apis/) argues for the other fix. After N toggles a component handles 2^N modes, so move the variation into composition. Consolidate when the variants share their markup; compose when they diverge. Genuinely independent switches such as `disabled` and `fullWidth` stay booleans.

The toolkit applies the converse as well. An axis whose only effect is showing or hiding one subtree is a boolean, not a variant (`~/Projects/toolkit/standards/figma-standard.md` rule 35).

For any two toggles on your component, ask whether both can be true and whether anyone designed that. **If not, they are one dropdown, or two components.**

---

## Separate icon buttons

More systems split than merge, MUI among them, and a separate component is where an accessible name can be made required; but Fluent merged and stayed merged, so it is a real choice.

A button with only a magnifying-glass icon has no visible label. Something still has to tell a screen reader it says "Search". Where that requirement lives depends on whether the icon-only button is its own component.

Systems fall into three groups:

| Model | Systems |
|---|---|
| Separate icon button | MUI, Material 3 Compose, Primer, Atlassian, Spectrum (`ActionButton`, by emphasis), Radix Themes |
| One hands off to the other | Carbon (`hasIconOnly` renders `IconButton`), Chakra (`IconButton` is `Button` with no padding), Material Android Views |
| Icon-only is a state of Button | Fluent 2 (derived from `icon` and no text), Polaris, Ant Design (`icon-only` class), Twilio Paste (`primary_icon` variants) |

The count needs one caution. Primer, Atlassian, Radix and Chakra share an ecosystem and partly echo each other. Fluent, Polaris and Ant Design reached the merged answer independently.

Fluent's story is the clearest merge. Its [v9 migration](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/docs/MIGRATION.md) maps `<IconButton>` to `<Button appearance="subtle" icon={…}/>`. It keeps separate components only where behaviour differs: `MenuButton`, `SplitButton`, `ToggleButton`. That is the element, role and keyboard test applied straight.

Atlassian split for render speed, about 10%, a code reason that doesn't transfer to Figma. Its split also shows the cost. `ButtonAppearance` offers `danger` and `warning`; the narrower `IconButtonAppearance` offers neither. Carbon reaches the same restriction by rule: a danger button can't be icon-only.

What the split buys is accessibility:

- Primer makes `aria-label` required; Atlassian and Carbon require a `label`.
- A merged Button has to keep the same prop optional, so Polaris can only recommend `accessibilityLabel`.
- Carbon always wraps an icon button in a tooltip, and Primer turned one on by default.

The toolkit requires both the name and the tooltip when a button is icon-only, plus an accessible-name property or annotation on the Figma component (`~/Projects/toolkit/knowledge/ui/patterns/actions.md#icon-only-buttons`, `figma-standard.md` rule 40).

Keep your icon button separate unless the team accepts one larger set. **Either way, make the accessible name required in the API, and say so in the Figma description.**

---

## Compact buttons and bare icons

Neither is a component: compactness is always a size or density value, and a bare clickable icon is always the icon button's lowest-emphasis appearance.

Nobody ships a CompactButton. Every system read reaches it through a size:

- MUI's `size="small"`, which its docs call "the dense button styling"
- Atlassian's `spacing="compact"`
- Polaris's `micro` and `slim`
- Carbon's `xs` and `sm`
- Material 3 Expressive's extra-small size

The bare icon, a glyph with no container that still acts as a button, is the same story. It is Material 3's "standard" icon button, Primer's `variant="invisible"`, Atlassian's `appearance="subtle"`, Carbon's `kind="ghost"`, Spectrum's `isQuiet` and Radix's `variant="ghost"`. Merged systems reach it as Fluent's `appearance="transparent"` and Ant Design's `type="text"`.

MUI inverts the vocabulary a team expects, and that is the trap. Its `IconButton` has **no container by default**: just a glyph with a ripple, and no `variant` prop. A request for a contained one was closed as not planned ([#37443](https://github.com/mui/material-ui/issues/37443)).

So in a team on MUI, the designers' "interactive icon" is MUI's icon button. The designers' contained icon button is something MUI doesn't offer, and has to be built on `Button`. A developer reading "IconButton" in a ticket pictures the bare one.

Add a size, never a compact component, and treat the bare icon as a `Ghost` role of your icon button. **Keep the toolkit's 24px minimum target for it**, which is rule 26 and stricter than [WCAG 2.2's 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), since that criterion also lets spacing pass.

---

## Four buttons become two

Four became two by the test: one project's library had Button, Icon button, Context button (a menu trigger) and Interactive icon (a bare glyph), and the last two folded into the first two, which stayed apart.

How much does a merge cost? The library, read on 5 October 2026, answers it in two numbers per component: variants, which a designer pays for every time the set opens, and instances to swap, which the team pays once.

| Component | Variants | Instances to swap (inside components + on canvas) |
|---|---|---|
| Button | 108 | n/a |
| Icon button | 45 (no Primary, no Loading) | n/a |
| Context button | 72 (`Type`, `Size`, `Feedback`, `Open`, states) | 592 (14 + 578, mostly its own docs page) |
| Interactive icon | 20 (16 and 20px glyphs on 24 and 36px targets) | 78 (56 + 22) |

The code already agreed with the outcome. Its `IconButton` was a styled `Button` with `iconLarge`, `iconMedium` and `iconSmall` sizes. `ContextButton` and `InteractiveIcon` sat apart on MUI's `ButtonBase`.

Here is the merge in one picture, with each family's variant count.

<svg role="img" viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Before: four components, Button with 108 variants, Context button with 72, Icon button with 45 and Interactive icon with 20, 245 in all. After: two components, Button with 114 variants and Icon button with 63, 177 in all. Context button folds into both Button and Icon button; Interactive icon folds into Icon button as its Ghost role.</title>
<rect x="0" y="0" width="640" height="250" fill="#f7f6f2"/>
<text x="20" y="28" font-size="14" font-weight="600" fill="#1a1a1a">Before: 4 components, 245 variants</text>
<text x="420" y="28" font-size="14" font-weight="600" fill="#1a1a1a">After: 2 components, 177</text>
<rect x="20" y="44" width="220" height="40" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="34" y="69" font-size="14" fill="#1a1a1a">Button</text>
<text x="226" y="69" font-size="13" fill="#5a5850" text-anchor="end">108</text>
<rect x="20" y="94" width="220" height="40" rx="6" fill="#ffffff" stroke="#c9c6bd" stroke-dasharray="4 3"/>
<text x="34" y="119" font-size="14" fill="#1a1a1a">Context button</text>
<text x="226" y="119" font-size="13" fill="#5a5850" text-anchor="end">72</text>
<rect x="20" y="144" width="220" height="40" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="34" y="169" font-size="14" fill="#1a1a1a">Icon button</text>
<text x="226" y="169" font-size="13" fill="#5a5850" text-anchor="end">45</text>
<rect x="20" y="194" width="220" height="40" rx="6" fill="#ffffff" stroke="#c9c6bd" stroke-dasharray="4 3"/>
<text x="34" y="219" font-size="14" fill="#1a1a1a">Interactive icon</text>
<text x="226" y="219" font-size="13" fill="#5a5850" text-anchor="end">20</text>
<rect x="420" y="74" width="200" height="40" rx="6" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.5"/>
<text x="434" y="99" font-size="14" font-weight="600" fill="#1a1a1a">Button</text>
<text x="606" y="99" font-size="13" fill="#1a1a1a" text-anchor="end">114</text>
<rect x="420" y="164" width="200" height="40" rx="6" fill="#ffffff" stroke="#1a1a1a" stroke-width="1.5"/>
<text x="434" y="189" font-size="14" font-weight="600" fill="#1a1a1a">Icon button</text>
<text x="606" y="189" font-size="13" fill="#1a1a1a" text-anchor="end">63</text>
<g stroke="#8a877e" stroke-width="1.5" fill="none">
<path d="M240 64 L420 94"/>
<path d="M240 114 L420 94"/>
<path d="M240 114 L420 184"/>
<path d="M240 164 L420 184"/>
<path d="M240 214 L420 184"/>
</g>
<text x="330" y="146" font-size="12" fill="#5a5850" text-anchor="middle">Tertiary, Open</text>
<text x="330" y="226" font-size="12" fill="#5a5850" text-anchor="middle">Role=Ghost</text>
</svg>

The two dashed families disappear as components but not as designs. Each survives as a role or a state on something that already drew it.

Taking each move in turn:

- **Context button into Button and Icon button.** It changes no element, role or keys. It is a Tertiary button at Button's 40 and 32px heights with a value and a badge, and its icon-only type is Icon button's Tertiary square. Primer (`aria-expanded`, a `count` badge), Atlassian (`isSelected`) and Polaris (`disclosure`) keep menu triggers on Button; Fluent and Carbon keep a `MenuButton`. `Open` becomes one State value on Tertiary, as [what the State axis models](what-the-state-axis-models.md) argues for menu triggers.
- **Interactive icon into Icon button**, as `Role=Ghost`. Its own two sizes stay on Ghost only, so a designer can't pick a 24px contained button nobody drew.
- **Not Icon button into Button.** The merged set would be 153 variants (159 after the first merge, 222 if icon-only took every role). `Size` would mean both a 64 to 80px labelled button and a 40px square. Icon button's missing roles would become holes the picker refuses. And the code already exposes two names, so keeping two keeps Figma and code one-to-one.

| | Before | After |
|---|---|---|
| Components | 4 | 2 |
| Variants | 245 | 177 (Button 114, Icon button 63) |
| Largest set | 108 | 114 |
| Places to swap | n/a | 670 |

The swaps carry three traps, all about overrides.

**Layer and property names must match first.** A swap from one set to another keeps an instance's edits only where layer names match. So the retired components' `Label`, `Icon` and value layers are renamed to the survivor's names before swapping. Their properties are renamed to the survivor's too (`Label text` to `Label`, `Value text` to `Value`, the revealing boolean to `Show value`), so the swap renames once, not twice.

**The colours didn't quite match.** The trigger's label was `Neutral/secondary` where Button Tertiary's was `Neutral/primary`. Swapped triggers would read a step darker unless the team decided first which was right.

**Retired is not deleted.** The old components are deprecated, not removed, so product files migrate on their own schedule (`figma-standard.md` rule 14).

Price every merge twice: the variant count a designer pays each time the set opens, and the one-off swap count. **Merge where a retired component is already a role and size that the survivor draws.** Before you swap, match layer and property names, settle any token differences, and deprecate rather than delete.

---

## Loading beyond a boolean

Loading outgrows the button when the design has to show success or failure in place, not only "in progress": a boolean has two values, and that design has four.

A Save button spins while a form submits. Then the designer adds a frame where it shows a checkmark for a moment, and another where it shows an error. A `loading` boolean can't say any of that.

Two systems hit this fork and went opposite ways.

[Carbon](https://carbondesignsystem.com/components/inline-loading/usage/) gives Button no loading prop at all and owns the whole sequence in `InlineLoading`. Its status is `active`, `inactive`, `finished` or `error`. The finished state shows for 1.5 seconds before an optional `onSuccess` fires.

Fluent weighed the same extension in [issue #29724](https://github.com/microsoft/fluentui/issues/29724). Part of the demand came from teams unwilling to reuse disabled styling, because the label must keep its contrast. Fluent closed it in March 2024 with a composition recipe instead, judging that building it in "complicates the component without bringing a lot of value".

So there are two verdicts on one fork: own the state machine centrally, or document a composition over a primitive.

Keep the loading boolean until a frame shows a checkmark, a timed confirmation or an in-progress-to-result sequence. **At that point, choose Carbon's shape or Fluent's on purpose, rather than growing more booleans on Button.**

---

## New looks as theme variants

A new look is a theme variant when the new treatment works across the full grid of sizes and roles; in MUI that costs a theme `variants` entry and a TypeScript augmentation, while a new component costs an export and docs and buys different props.

Say a team wants an "AI" button with its own treatment. In MUI the cheap route is to declare a new variant value and style it in the theme:

```ts
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides { ai: true; }
}
```

The new value then combines with every `color` and `size` for free. That is the benefit and also the check: if half of those combinations would be meaningless, the treatment isn't really a variant.

The dividing line is the element, role and keyboard test from [component or value](#component-or-value), plus one Figma check. If the new treatment shares the full `Size` and role grid, it is an axis value. If half the combinations become meaningless, it is a component.

The toolkit names the two outcomes differently. A flavour built as its own component takes ` - ` (`Button - CTA`, rule 20). A boolean that only switches a style stays bare (`AI`, rule 21).

Lay your new treatment over the existing grid before building it. **If it fills the grid, add a variant; if it leaves half the grid empty, make a component.**

---

## Cheat sheet

| Question | Industry answer | Default |
|---|---|---|
| New component or new value? | element, role or keyboard changes: component | apply the test, record it |
| Several toggles | one enum when they exclude each other (Polaris v12) | consolidate or compose |
| Icon-only button | split slightly more common; merged works (Fluent, Polaris, Ant) | separate, name required |
| Compact button | always a size | add a size |
| Bare clickable icon | the icon button's lowest emphasis | `Ghost` role |
| Danger icon-only | often restricted (Carbon forbids) | write the restriction down |
| Loading | a prop, never a component (MUI folded `LoadingButton`) | State value in Figma |
| Success and error in place | a status component (Carbon) or a recipe (Fluent) | decide which |
| Menu trigger | a Button state in Primer, Atlassian, Polaris | `Open` on Tertiary |

---

## The short version

Split a component when its element, role or keyboard behaviour changes; fold it back when only its look or status does. MUI split `ListItemButton` from `ListItem` and folded `LoadingButton` into `Button` on exactly that test. Booleans that exclude each other are one enum, as Polaris learnt when seven button booleans became `variant` and `tone`. Compact is a size and a bare icon is the icon button's ghost, in every system read. Icon-only buttons are a genuine split: separate in MUI and Primer, merged in Fluent and Polaris, and wherever yours live, make the accessible name required. In a Figma library, price a merge in variants and in swaps, and match layer and property names before you swap, or the swapped instances lose their content.

---

## What to re-check later

Researched August to October 2026 from the migration guides, source and issue trackers of thirteen systems (Material 3, MUI, Carbon, Polaris, Primer, Spectrum, Atlassian, Fluent 2, Ant Design, GOV.UK, Radix Themes, Chakra UI, Twilio Paste), and from one project's live Figma library and code read on 5 October 2026. Re-checked in November 2026: MUI's current major (v9, with v10 in preview) and the Figma slot limitations that bear on merged sets.

- **Where this came from.** This guide merges the button-family study with the split-and-fold sections of the MUI guide, the toggle section of the naming guide and the "own component?" sections of the loading guide.
- **Polaris web components** (`s-button`): Polaris's React library was archived in September 2026, and its web components keep the merged button model. Check whether they keep the merged props.
- **Material 3 Expressive** sizes and icon-button widths were read from Android docs and snippets; m3.material.io renders only in a browser.
- **Why MUI, Primer and Spectrum split** the icon button: documented, never explained.
- **User research** on icon-only buttons: none found beyond NN/g's 2014 icon-usability article and research Carbon cites; the case for labels is argued, not measured.
- **The worked case's counts** were read on 5 October 2026; product files were not counted.

---

## Sources

**Primary**

- [MUI v5 component changes](https://mui.com/material-ui/migration/v5-component-changes/), [Upgrade to v6](https://mui.com/material-ui/migration/upgrade-to-v6/), [Upgrade to v9](https://mui.com/material-ui/migration/upgrade-to-v9/), [API design approach](https://mui.com/material-ui/guides/api/), [Creating themed components](https://mui.com/material-ui/customization/creating-themed-components/)
- [MUI issue #42684](https://github.com/mui/material-ui/issues/42684), [PR #44637](https://github.com/mui/material-ui/pull/44637), [issue #37443](https://github.com/mui/material-ui/issues/37443), [IconButton API](https://mui.com/material-ui/api/icon-button/), [Density](https://mui.com/material-ui/customization/density/)
- [Polaris v11 to v12 migration (repository)](https://github.com/Shopify/polaris-react/blob/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx), [Polaris web components Button](https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button)
- [Carbon Button usage](https://carbondesignsystem.com/components/button/usage/), [Carbon Button source](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Button/Button.tsx), [Carbon Inline loading](https://carbondesignsystem.com/components/inline-loading/usage/)
- [Primer IconButton](https://primer.style/product/components/icon-button/), [Primer issue #2008](https://github.com/primer/react/issues/2008), [Primer Button types](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Button/types.ts)
- [Atlassian, Evolving buttons and links](https://atlassian.design/whats-new/evolving-button-and-links), [IconButton types](https://unpkg.com/@atlaskit/button/dist/types/new-button/variants/icon/types.d.ts), [appearance types](https://unpkg.com/@atlaskit/button/dist/types/new-button/variants/types.d.ts), [legacy report.api.md (mirror)](https://github.com/pioug/atlassian-frontend-mirror/blob/master/design-system/button/report.api.md)
- [Fluent 2 button migration](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/docs/MIGRATION.md), [useButton](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-button/library/src/components/Button/useButton.ts), [issue #29724](https://github.com/microsoft/fluentui/issues/29724)
- [Ant Design Button](https://raw.githubusercontent.com/ant-design/ant-design/master/components/button/index.en-US.md), [Radix Themes IconButton](https://www.radix-ui.com/themes/docs/components/icon-button), [Chakra IconButton source](https://raw.githubusercontent.com/chakra-ui/chakra-ui/main/packages/react/src/components/button/icon-button.tsx), [Twilio Paste Button types](https://raw.githubusercontent.com/twilio-labs/paste/main/packages/paste-core/components/button/src/types.ts)
- [Material Components Android: Icon buttons](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/IconButton.md), [Compose icon buttons](https://developer.android.com/develop/ui/compose/components/icon-button)
- [W3C, Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

**Commentary**

- [John Gozde, An Opinionated Guide to Component APIs](https://imply.io/blog/an-opinionated-guide-to-component-apis/)
- [NN/g, Icon Usability](https://www.nngroup.com/articles/icon-usability/)

**Toolkit**

- `~/Projects/toolkit/knowledge/ui/patterns/actions.md` (button hierarchy, icon-only buttons)
- `~/Projects/toolkit/standards/figma-standard.md` rules 14, 20, 21, 26, 35, 40
