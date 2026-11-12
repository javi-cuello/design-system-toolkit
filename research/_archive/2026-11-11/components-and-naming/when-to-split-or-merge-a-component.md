# When to split or merge a component

Design systems keep reversing themselves on the same question: is this a new component, or a value on an existing one? The answer the reversals converge on is a single test. **Split when the element, its role or its keyboard behaviour changes; fold back in when only the appearance or the status does.** This piece walks that test through booleans, icon-only buttons, compact buttons, bare icons, loading buttons and menu triggers, with one project's button family as the worked case.

Researched August to October 2026 from the migration guides, source and issue trackers of thirteen systems (Material 3, MUI, Carbon, Polaris, Primer, Spectrum, Atlassian, Fluent 2, Ant Design, GOV.UK, Radix Themes, Chakra UI, Twilio Paste), and from one project's live Figma library and code read on 5 October 2026. Re-checked in November 2026: MUI's current major (v9, with v10 in preview) and the Figma slot limitations that bear on merged sets. Polaris's React library was archived in September 2026; its web components keep the merged button model. This piece merges the button-family study with the split-and-fold sections of the MUI guide, the toggle section of the naming guide and the "own component?" sections of the loading guide.

---

## What this answers

- What test decides between a new component and a new value?
- When are several booleans secretly one axis?
- Should icon-only buttons be their own component?
- Is a compact button, or a bare clickable icon, a component?
- When has loading outgrown the button?
- What does a merge cost in a Figma library, and how is it done without losing overrides?

---

## 1. The test: element, role, keyboard

**The short answer.** If a change alters the rendered element, its ARIA role or its keyboard behaviour, it is a different component. If it only changes appearance or reports a status, it is a prop.

MUI has now applied the test in both directions within two years. **A split:** in v4 an interactive list row was `<ListItem button>`; v5 made `ListItemButton` its own component, and v6 removed `button`, `disabled` and `selected` from `ListItem`, because an `<li>` is not interactive and a boolean was hiding a change of element, role and keys. `MenuItem` was re-parented the same way, from `ListItem` onto `ButtonBase`. **A fold:** `LoadingButton` lived in `@mui/lab` for years; v6.4.0 made loading a prop on `Button` and `IconButton`, because loading is a status a button passes through and changes none of the three. **A rename:** the better `Grid` took the good name in v7 and the old one became `GridLegacy`, deleted in v9; the best name goes to the thing people should use.

Atlassian shows the fold inside one npm package: the legacy `@atlaskit/button` keeps `isLoading` on a separate `LoadingButton`, while the redesigned `Button`, `IconButton` and `LinkButton` share it on `CommonButtonProps`. The case for a separate loading component was bundle weight (MUI's 2024 issue complained of installing a lab package for one button), which has no analogue in Figma, where an unused variant costs a file nothing.

**What to do.** Apply the test whenever a new Figma family is proposed, and record the answer in the component's description.

---

## 2. When several booleans are one axis

**The short answer.** Two booleans that cannot both be true, or whose combination nobody designed, are one enum. MUI's written rule: a boolean for two values, an enum for three or more, booleans defaulting to `false`.

The arithmetic compounds: seven booleans make 128 combinations, of which perhaps six were designed. Polaris ran the experiment in public. By v11 its `Button` had seven interacting booleans, and v12 replaced them with `variant` and `tone`:

| Polaris v11 | Polaris v12 |
|---|---|
| `<Button plain />` | `<Button variant="plain" />` |
| `<Button primary plain />` | `<Button variant="tertiary" />` |
| `<Button destructive />` | `<Button variant="primary" tone="critical" />` |
| `<Button primarySuccess />` | `<Button variant="primary" tone="success" />` |
| `outline`, `monochrome` | removed; the default button |
| `connectedDisclosure` | removed |

The same release collapsed `Modal`'s `small`, `large` and `fullScreen` into `size`, and renamed Banner's `status` and Icon's `color` both to `tone`, so one word meant one thing everywhere; a `polaris-migrator` codemod shipped with it. In Figma a variant property is the dropdown and a boolean property is the toggle, so a kit with separate Primary and Destructive toggles has rebuilt Polaris v11.

MUI breaks its own rule twice, and both are instructive. Card carries `variant="outlined"` and a `raised` boolean, three appearances on two props, surviving only because `raised` predates `variant`: legacy, not design. Alert carries `severity` and `color` with overlapping values, and that one is right: meaning and colour are separable, so a brand can recolour a severity without lying about it.

John Gozde (Imply) argues the other fix: after N toggles a component handles 2^N modes, so move the variation into composition. Consolidate when the variants share their markup; compose when they diverge. Genuinely independent switches (`disabled`, `fullWidth`) stay booleans. The toolkit applies the converse too: an axis whose only effect is showing or hiding one subtree is a boolean, not a variant (`~/Projects/toolkit/standards/figma-standard.md` rule 35).

**What to do.** For any two toggles, ask whether both can be true and whether anyone designed that. If not, one dropdown or two components.

---

## 3. Should icon-only buttons be their own component?

**The short answer.** More systems split than merge, including MUI, and a separate component is where an accessible name can be required. But Fluent merged and stayed merged, so it is a real choice.

| Model | Systems |
|---|---|
| Separate icon button | MUI, Material 3 Compose, Primer, Atlassian, Spectrum (`ActionButton`, by emphasis), Radix Themes |
| One hands off to the other | Carbon (`hasIconOnly` renders `IconButton`), Chakra (`IconButton` is `Button` with no padding), Material Android Views |
| Icon-only is a state of Button | Fluent 2 (derived from `icon` and no text), Polaris, Ant Design (`icon-only` class), Twilio Paste (`primary_icon` variants) |

Fluent's v9 migration maps `<IconButton>` to `<Button appearance="subtle" icon={…}/>` and keeps separate components only where behaviour differs (`MenuButton`, `SplitButton`, `ToggleButton`). Atlassian split for render speed (about 10%, a code reason that does not transfer to Figma), and its split shows the cost: `ButtonAppearance` offers `danger` and `warning`, the narrower `IconButtonAppearance` neither. Carbon reaches the same restriction by rule: a danger button cannot be icon-only. Primer, Atlassian, Radix and Chakra share an ecosystem and partly echo each other; Fluent, Polaris and Ant Design reached the merged answer independently.

The split buys accessibility: Primer makes `aria-label` required, Atlassian and Carbon a `label`, while a merged Button must keep the same prop optional (Polaris can only recommend `accessibilityLabel`); Carbon always wraps a tooltip and Primer turned one on by default. The toolkit requires both when a button is icon-only, and an accessible-name property or annotation on the Figma component (`~/Projects/toolkit/knowledge/ui/patterns/actions.md#icon-only-buttons`, `figma-standard.md` rule 40).

**What to do.** Keep the icon button separate unless the team accepts one larger set; either way, require the name in the API and say so in the Figma description.

---

## 4. Compact buttons and bare icons

**The short answer.** Compactness is always a size or density value, never a component. A bare clickable icon is always the icon button's lowest-emphasis appearance.

Nobody ships a CompactButton: MUI's `size="small"` is "the dense button styling", Atlassian has `spacing="compact"`, Polaris `micro` and `slim`, Carbon `xs` and `sm`, Material 3 Expressive an extra-small size. The bare icon is Material 3's "standard" icon button, Primer's `variant="invisible"`, Atlassian's `appearance="subtle"`, Carbon's `kind="ghost"`, Spectrum's `isQuiet`, Radix's `variant="ghost"`, and in merged systems Fluent's `appearance="transparent"` and Ant Design's `type="text"`.

MUI inverts the vocabulary a team expects. Its `IconButton` has **no container by default**, just a glyph with a ripple, and no `variant` prop; a request for a contained one was closed as not planned ([#37443](https://github.com/mui/material-ui/issues/37443)). So a team's "interactive icon" is MUI's icon button, and a team's contained icon button is something MUI does not offer and has to be built on `Button`. A developer reading "IconButton" in a ticket pictures the bare one.

**What to do.** Add a size, never a compact component. Treat the bare icon as a `Ghost` role of the icon button, and keep the toolkit's 24px minimum target (rule 26, stricter than WCAG 2.2's 2.5.8, which also lets spacing pass).

---

## 5. Worked case: four button-like components into two

**The short answer.** One project's library had Button, Icon button, Context button (a menu trigger) and Interactive icon (a bare glyph). The test merges the last two into the first two and keeps those two apart.

| Component | Variants | Instances to swap (inside components + on canvas) |
|---|---|---|
| Button | 108 | n/a |
| Icon button | 45 (no Primary, no Loading) | n/a |
| Context button | 72 (`Type`, `Size`, `Feedback`, `Open`, states) | 592 (14 + 578, mostly its own docs page) |
| Interactive icon | 20 (16 and 20px glyphs on 24 and 36px targets) | 78 (56 + 22) |

The code already agreed: its `IconButton` was a styled `Button` with `iconLarge`, `iconMedium` and `iconSmall` sizes, while `ContextButton` and `InteractiveIcon` sat apart on MUI's `ButtonBase`.

- **Context button into Button and Icon button.** It changes no element, role or keys; it is a Tertiary button at Button's 40 and 32px heights with a value and a badge, and its icon-only type is Icon button's Tertiary square. Menu triggers stay on Button in Primer (`aria-expanded`, a `count` badge), Atlassian (`isSelected`) and Polaris (`disclosure`); Fluent and Carbon keep a `MenuButton`. `Open` becomes one State value on Tertiary (see [what the State axis models](what-the-state-axis-models.md), section 4).
- **Interactive icon into Icon button**, as `Role=Ghost` with its own two sizes kept on Ghost only, so a designer cannot pick a 24px contained button nobody drew.
- **Not Icon button into Button.** The merged set would be 153 variants (159 after the first merge, 222 if icon-only took every role), `Size` would mean both a 64 to 80px labelled button and a 40px square, Icon button's missing roles would become holes the picker refuses, and the code already exposes two names, which keeps Figma and code one-to-one.

| | Before | After |
|---|---|---|
| Components | 4 | 2 |
| Variants | 245 | 177 (Button 114, Icon button 63) |
| Largest set | 108 | 114 |
| Places to swap | n/a | 670 |

**Three traps, all about overrides.** A swap from one set to another keeps an instance's edits only where layer names match, so the retired components' `Label`, `Icon` and value layers are renamed to the survivor's names before swapping, and their properties renamed to the survivor's (`Label text` to `Label`, `Value text` to `Value`, the revealing boolean to `Show value`) so the swap renames once, not twice. The trigger's label was `Neutral/secondary` where Button Tertiary's was `Neutral/primary`, so swapped triggers would read a step darker unless the team decided first. And the retired components are deprecated, not deleted, so product files migrate on their own schedule (`figma-standard.md` rule 14).

**What to do.** Price every merge twice: the variant count a designer pays every time the set opens, and the one-off swap count. Merge where a retired component is already a role and size the survivor draws.

---

## 6. When has loading outgrown the button?

**The short answer.** When the design must show success or failure in place, not only "in progress". A boolean has two values; that design has four.

Carbon gives Button no loading prop at all and owns the sequence in `InlineLoading`: a status of `active`, `inactive`, `finished` or `error`, the finished state shown for 1.5 seconds before an optional `onSuccess` fires. Fluent weighed the same extension ([#29724](https://github.com/microsoft/fluentui/issues/29724), partly from teams unwilling to reuse disabled styling because the label must keep its contrast) and closed it in March 2024 with a composition recipe instead, because building it in "complicates the component without bringing a lot of value". Two verdicts on one fork: own the state machine centrally, or document a composition over a primitive.

**What to do.** Keep the boolean until a frame shows a checkmark, a timed confirmation or an in-progress-to-result sequence; then choose Carbon's shape or Fluent's deliberately.

---

## 7. A new value in the theme, or a new component?

**The short answer.** In MUI a new value is a theme `variants` entry plus a TypeScript augmentation, and it combines with every `color` and `size` for free; a new component costs an export and docs and buys different props.

```ts
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides { ai: true; }
}
```

The dividing line is section 1's test plus one Figma check: if the new treatment shares the full `Size` and role grid, it is an axis value; if half the combinations become meaningless, it is a component. The toolkit names a flavour built separately with ` - ` (`Button - CTA`, rule 20), and a boolean that only switches its style stays bare (`AI`, rule 21).

---

## 8. Cheat sheet

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

## 9. The short version

Split a component when its element, role or keyboard behaviour changes; fold it back when only its look or status does. MUI split `ListItemButton` from `ListItem` and folded `LoadingButton` into `Button` on exactly that test. Booleans that exclude each other are one enum, as Polaris learnt when seven button booleans became `variant` and `tone`. Compact is a size and a bare icon is the icon button's ghost, in every system read. Icon-only buttons are a genuine split: separate in MUI and Primer, merged in Fluent and Polaris, and wherever they live the accessible name should be required. In a Figma library, price a merge in variants and in swaps, and match layer and property names before swapping or the swapped instances lose their content.

---

## 10. What to re-check later

- **Polaris web components** (`s-button`): whether they keep the merged props now the React library is archived.
- **Material 3 Expressive** sizes and icon-button widths were read from Android docs and snippets; m3.material.io renders only in a browser.
- **Why MUI, Primer and Spectrum split** the icon button: documented, never explained.
- **User research** on icon-only buttons: none found beyond NN/g's 2014 icon-usability article and research Carbon cites; the case for labels is argued, not measured.
- **The worked case's counts** were read on 5 October 2026; product files were not counted.

---

## Sources

- [MUI v5 component changes](https://mui.com/material-ui/migration/v5-component-changes/), [Upgrade to v6](https://mui.com/material-ui/migration/upgrade-to-v6/), [Upgrade to v9](https://mui.com/material-ui/migration/upgrade-to-v9/), [API design approach](https://mui.com/material-ui/guides/api/), [Creating themed components](https://mui.com/material-ui/customization/creating-themed-components/)
- [MUI issue #42684](https://github.com/mui/material-ui/issues/42684), [PR #44637](https://github.com/mui/material-ui/pull/44637), [issue #37443](https://github.com/mui/material-ui/issues/37443), [IconButton API](https://mui.com/material-ui/api/icon-button/), [Density](https://mui.com/material-ui/customization/density/)
- [Polaris v11 to v12 migration (repository)](https://github.com/Shopify/polaris-react/blob/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx), [Polaris web components Button](https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button)
- [John Gozde, An Opinionated Guide to Component APIs](https://imply.io/blog/an-opinionated-guide-to-component-apis/) (commentary)
- [Carbon Button usage](https://carbondesignsystem.com/components/button/usage/), [Carbon Button source](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Button/Button.tsx), [Carbon Inline loading](https://carbondesignsystem.com/components/inline-loading/usage/)
- [Primer IconButton](https://primer.style/product/components/icon-button/), [Primer issue #2008](https://github.com/primer/react/issues/2008), [Primer Button types](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Button/types.ts)
- [Atlassian, Evolving buttons and links](https://atlassian.design/whats-new/evolving-button-and-links), [IconButton types](https://unpkg.com/@atlaskit/button/dist/types/new-button/variants/icon/types.d.ts), [appearance types](https://unpkg.com/@atlaskit/button/dist/types/new-button/variants/types.d.ts), [legacy report.api.md (mirror)](https://github.com/pioug/atlassian-frontend-mirror/blob/master/design-system/button/report.api.md)
- [Fluent 2 button migration](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/docs/MIGRATION.md), [useButton](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-button/library/src/components/Button/useButton.ts), [issue #29724](https://github.com/microsoft/fluentui/issues/29724)
- [Ant Design Button](https://raw.githubusercontent.com/ant-design/ant-design/master/components/button/index.en-US.md), [Radix Themes IconButton](https://www.radix-ui.com/themes/docs/components/icon-button), [Chakra IconButton source](https://raw.githubusercontent.com/chakra-ui/chakra-ui/main/packages/react/src/components/button/icon-button.tsx), [Twilio Paste Button types](https://raw.githubusercontent.com/twilio-labs/paste/main/packages/paste-core/components/button/src/types.ts)
- [Material Components Android: Icon buttons](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/IconButton.md), [Compose icon buttons](https://developer.android.com/develop/ui/compose/components/icon-button)
- [W3C, Understanding SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); [NN/g, Icon Usability](https://www.nngroup.com/articles/icon-usability/) (commentary)
- Toolkit: `~/Projects/toolkit/knowledge/ui/patterns/actions.md` (button hierarchy, icon-only buttons); `~/Projects/toolkit/standards/figma-standard.md` rules 14, 20, 21, 26, 35, 40
