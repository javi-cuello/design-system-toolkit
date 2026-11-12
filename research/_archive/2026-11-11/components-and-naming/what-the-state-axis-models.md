# What the State axis models

A Figma `State` axis puts browser pseudo-classes and developer-set props in one dropdown, and most arguments about states (is Loading a state? where does Disabled go? is Open an axis?) come from not saying which is which. The argument here: the axis models **appearances that cannot be drawn at once**, not the code's API, and that is a legitimate job as long as the mapping back to code is written down.

Researched August to October 2026 from component source code and documentation (MUI, Primer, React Aria and Spectrum, Polaris, Chakra, Ant Design, Radix Themes, GitLab Pajamas, Atlassian, Carbon, Fluent), Nathan Curtis's audit of ten published text-input kits, and the `State` axes in 23 kits' Code Connect files (46 in the blind re-run). Re-checked in November 2026: Primer issue #7881 on its loading announcement (still open, with a docs pull request, #7882, proposed), MUI's current major (v9; v10 in preview), and the open Figma request for selective exposure of nested properties (unshipped). This piece merges the Figma half of the loading-state guide, the state section of the naming guide, the nested-state study and the open-state survey from the button-merge study; loading *behaviour* now lives in the toolkit's `~/Projects/toolkit/knowledge/ui/patterns/actions.md#loading-buttons`.

---

## What this answers

- What is each value on a `State` axis in code?
- Which states belong on the axis, and which beside it?
- Is Loading a State value, a boolean or a component?
- How is an open menu trigger drawn?
- When a parent drives a nested child's state, how is invalid combination prevented?
- What must be written down for the engineers?

---

## 1. What is each State value in code?

**The short answer.** Three are pseudo-classes the browser applies; the rest are props a developer passes. No surveyed library has a `state` prop.

| Figma value | In code | Who sets it | Combines with |
|---|---|---|---|
| Rest | the absence of the others | nobody | n/a |
| Hover | `:hover` | the browser | focus |
| Focus | `:focus-visible` | the browser | hover |
| Press | `:active` | the browser | hover, focus |
| Disabled | `disabled`, or `aria-disabled` | the developer | blocks the others |
| Loading | `loading`, `isLoading` or `isPending` | the developer | blocks the others |
| Open | `aria-expanded`, set by the menu | the component | hover, focus |
| Error | an `error` or `validationStatus` prop | the developer | everything |

Curtis's audit of ten kits (Material 3, Material UI, Salesforce Lightning, Primer, Carbon, Atlassian, Redwood, Newskit, Polaris and one more) found the Figma kits almost all fold disabled, error, focus and hover into one mutually exclusive dropdown while the code exposes them independently; eight had focus inside the dropdown, none as a boolean, and only Atlassian kept `isDisabled` and error as separate properties to match its code. The Code Connect sweep agrees: a single `State` axis in 19 of 23 kits (33 of 46 in the re-run), with `Disabled`, `Checked` or `Selected` often kept beside it, and the `State` axis the largest single source of mismatch between Figma names and code props, because its values feed `disabled` or `loading`.

MUI makes the split concrete: hover and press are CSS; `disabled`, `selected`, `checked`, `error` and `expanded` are props that each add a `.Mui-*` class. Focus has two classes, and choosing the wrong one is a real bug: `.Mui-focusVisible` follows the `:focus-visible` heuristic on button-like components, `.Mui-focused` marks an input wrapper whenever its input has focus at all, so a ring keyed on `.Mui-focused` for a button appears on mouse click.

**What to do.** Keep one `State` axis for what cannot be drawn together, and publish beside each component which values are pseudo-classes and which are props (section 6).

---

## 2. What goes on the axis, and what beside it?

**The short answer.** On the axis: appearances that exclude each other. Beside it: anything that combines with everything (`Disabled` as a True/False variant, a validation status, `Selected`).

The case for one dropdown is drawing: a static frame cannot show a control hovered, focused and errored at once, and five independent booleans would make 32 cells with artwork for perhaps six. The cost is the row nobody drew: focused *and* errored is routine in a browser and inexpressible in the kit, so a developer implements it unseen and the mismatch surfaces in QA. Primer's `validationStatus` (`error`, `success`; `warning` was dropped) folds the validation family into one enum, which is the same move one level down.

The toolkit's canon, tested across two project libraries: axes run `Size → Role → Feedback → Disabled → State`, `Disabled` a True/False variant directly before `State`, which comes last (`~/Projects/toolkit/standards/figma-standard.md` rule 1); Disabled pairs only with Rest (rule 2), and its variant sits immediately after its Rest sibling (rule 3; 28 of 28 sets in one library already did); the State order is `Rest → Focus → Hover → Press (→ Loading)` (rule 4). That order matters in code too: two rules of equal specificity resolve by source order, so a `styleOverrides` block that puts `&:hover` after `&.Mui-focusVisible` lets hover win on a hovered, focused button. A Disabled-and-Hover cell is not merely unwanted in MUI but unreachable, since a disabled `ButtonBase` sets `pointer-events: none`.

Two further toolkit rules close the gaps a dropdown invites: each state must draw differently from Rest, with Focus a ring a keyboard user can see (rules 31 and 39), and each state variant binds its own state's tokens, with Loading, which no token names, borrowing the resting ones by design (rule 48).

**What to do.** One `State` axis for the lifecycle; `Disabled`, `Selected` and validation beside it, named after the code; Focus before Hover in the file and in the stylesheet.

---

## 3. Is Loading a State value?

**The short answer.** Yes, in Figma. In code it is a boolean prop on Button in every library surveyed, never a component and never `state="loading"`.

| System | Prop |
|---|---|
| MUI | `loading`, `boolean \| null`, default `null` (v6.4.0 on) |
| Primer | `loading`, plus `loadingAnnouncement` |
| React Aria, Spectrum S2 | `isPending` |
| Atlassian (redesigned button) | `isLoading`, shared by `Button`, `IconButton`, `LinkButton` |
| Polaris, Pajamas, Radix Themes, Chakra v3 | `loading` (Chakra renamed it from `isLoading`) |
| Ant Design | `loading`, or `{ delay, icon }` |
| Carbon | none: loading belongs to `InlineLoading` |

The arithmetic decides the Figma side. Take a button with 18 combinations before states (Size 3 × Emphasis 3 × Icon 2) and five state values:

| Model | Calculation | Variants | Impossible cells |
|---|---|---|---|
| Loading as a sixth State value | 18 × 6 | 108 | 0 |
| Loading as a boolean beside State | 18 × 5 × 2 | 180 | 72 |

A value on an existing axis grows the set by one row; a boolean doubles it, and the doubled half is mostly loading-plus-hover and loading-plus-press. The component-driven.dev analysis of Figma booleans reaches the same place, and adds the tell: hiding a label during loading needed a negation boolean, a flag whose only job is cancelling another. Loading excludes hover and press in appearance exactly as Disabled does, so it belongs on the axis that models exclusion, even though code reaches it by a different mechanism. The toolkit records the same ruling (rule 4, 22 September 2026), after the finding "the State axis carries Loading" was raised and ruled away on every audit of one library; its validator writes the code mapping into the component's implementation notes instead of raising it.

What the Loading frame must specify is the part the picture cannot carry: built from the enabled style, never Disabled's grey (disabled colours are often exempt from contrast, and a busy control must still be read); the resting width kept; the label faded with `opacity`, never `visibility: hidden`, so it stays the accessible name. The behaviour (focus kept with `aria-disabled`, a live region present from load, a spinner after about a second and held a minimum once shown, a server-side guard against the double press) is the toolkit's `~/Projects/toolkit/knowledge/ui/patterns/actions.md#loading-buttons`.

One contradiction inside the toolkit is worth fixing: figma-standard rule 4 describes the build as "a `loading` prop with `aria-busy`", while `actions.md` (and the source reading behind this piece) says `aria-busy` is not an adequate announcement: Adrian Roselli's 2020 testing found only JAWS honoured it, and Polaris's own 2018 issue recorded VoiceOver and NVDA users hearing stale labels or "alert unavailable busy save product". `actions.md` holds.

**What to do.** `Loading` as the last State value, drawn from Rest's colours at Rest's width. In MUI only `Button` and `IconButton` take `loading` (the toolkit validator's case MU3), so a drawn loading state elsewhere is a bespoke component or a named deviation.

---

## 4. How is an open menu trigger drawn?

**The short answer.** As one `Open` appearance, usually reusing pressed or selected, not as an axis multiplied by every other state. In code it is `aria-expanded`.

| System | Draws open? | Driven by | Looks like |
|---|---|---|---|
| Primer | yes | `aria-expanded` | its pressed state |
| Atlassian | yes | `isSelected` on the trigger | its selected state |
| Material 3 | split button only | checked state | selected, plus a turning chevron |
| Fluent 2 | yes | `aria-expanded` | its own style, from the selected tokens |
| Carbon, Polaris | chevron only | open class, `disclosure` | rotated or swapped arrow |
| MUI, Spectrum, Ant Design | no | nothing | unchanged |

An `Open` True/False axis crossed with Rest, Focus, Hover and Press draws hover-while-open and focus-while-open as separate frames nobody needs; one `Open` value draws it once and lets the focus ring sit on top in code. Where the code target is MUI, whatever the frame shows is a style the engineers must add, keyed on `[aria-expanded="true"]`, because MUI draws nothing.

**What to do.** `Open` as a State value on the roles that open menus, mapped to `aria-expanded` in the implementation notes. The worked case is in [when to split or merge a component](when-to-split-or-merge-a-component.md), section 5.

---

## 5. When a parent drives a nested child's state

**The short answer.** The parent owns the state; the child is one set with that state as an axis; the parent sets it and does not expose the nested instance. Split the child per state only when designers must reach its other properties.

The constraint is Figma's: exposing a nested instance's properties is all or nothing, so an exposed child shows its state axes too, and an open FAB can be made to hold a closed button. Selective exposure has been requested since 2022 and was still unshipped in November 2026. Kits answer in three ways:

| What the parent needs from the child | Build | Kits | Invalid combinations |
|---|---|---|---|
| Nothing: the parent's state decides the child | one child set with the state axis; the parent picks the variant and does not expose the child | Carbon `MenuButton`, CMS `Accordion`, Coveo `Select` | reachable only by drilling into the layer |
| Some properties, not the state | split the child into ` / ` siblings per state and expose it | no kit found; Primer's `NavList.Item/SubItem` for the naming | none from the panel; a swap still could |
| Some properties, without a second component | a simplified copy of the child built inside the parent | GitLab Pajamas "integrated components" | none; the copy is kept in step by shared variables |
| The state belongs to each child | state on the child only | Primer `SegmentedControl.Button` | accepted: two selected buttons are possible |

Carbon has tracked the related mismatch in its own tracker (props that sit on `Tabs` in code but on each tab item in Figma, [#17607](https://github.com/carbon-design-system/carbon/issues/17607)); Pajamas avoids nesting full base components at all, citing file weight, hidden properties and less reliable nested overrides. In code, Material 3 makes the open FAB a separate `ToggleFloatingActionButton` inside `FloatingActionButtonMenu`, the nearest precedent for a per-state split.

The toolkit adopted the first row as its rule (`~/Projects/toolkit/standards/figma-standard.md` rule 7, 7 October 2026), with the split as the exception that must be explained in the parent's description. Its tested rule 38 adds why per-item content belongs in slots when items have variants: a text edit inside a nested instance is dropped when that instance changes variant inside its parent.

**What to do.** Ask what the parent must expose from the child. Nothing: one set, parent-driven, not exposed. Something: split per state with ` / ` and write the reason in the description. Either way, code has one prop.

---

## 6. What to hand the engineers

| Figma value | Write in code | Do not write | Set by |
|---|---|---|---|
| Rest | nothing | a `state` prop | nobody |
| Hover | `:hover` | `state="hover"` | the browser |
| Focus | `:focus-visible` (MUI: `.Mui-focusVisible` on buttons) | `:focus`; `.Mui-focused` on a button | the browser |
| Press | `:active` | `state="pressed"` | the browser |
| Disabled | `disabled` on the native control, or `aria-disabled` where it must stay focusable | `disabled` on a wrapper | the developer |
| Loading | `loading` / `isLoading` / `isPending`, with `aria-disabled` and a live region | native `disabled`; `aria-busy` alone | the developer |
| Open | `aria-expanded="true"`, styled to match the frame | a designer-set prop | the menu |

---

## 7. The short version

A `State` axis models appearances that cannot be drawn together. Hover, focus and press are pseudo-classes nobody sets; Disabled, Loading and Open arrive through props or attributes. Keep the lifecycle on one axis, put what combines with everything beside it, and write the mapping down per component. Loading is a sixth State value in Figma, because a boolean doubles the set for cells that cannot occur, and a boolean prop in code. Open is one value mapped to `aria-expanded`, not an axis. A parent that drives a child's state owns it, and splits the child per state only to expose its other properties.

---

## 8. What to re-check later

- **Selective exposure of nested properties.** If Figma ships it, section 5's split becomes unnecessary.
- **Primer's loading announcement.** Issue [#7881](https://github.com/primer/react/issues/7881) was open in November 2026, with [#7882](https://github.com/primer/react/pull/7882) proposed to document the built-in announcement.
- **figma-standard rule 4's `aria-busy` wording**, against `actions.md`.
- **Library loading behaviour** changes with versions; re-read the pinned version's source before relying on the table in section 3.
- **Curtis's tenth kit** is counted in his totals but not named in the article.

---

## Sources

- [Nathan Curtis, The Sorry State of States](https://medium.com/@nathanacurtis/the-sorry-state-of-states-89dd4668737e) (commentary; the ten-kit audit)
- [component-driven.dev, Avoid Component's boolean props in Figma](https://www.component-driven.dev/articles/boolean-flags-in-figma) (commentary)
- [MUI Button](https://mui.com/material-ui/react-button/), [How to customize](https://mui.com/material-ui/customization/how-to-customize/), [PR #44637](https://github.com/mui/material-ui/pull/44637)
- [Primer ButtonBase source](https://github.com/primer/react/blob/main/packages/react/src/Button/ButtonBase.tsx) and [ButtonBase styles](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Button/ButtonBase.module.css) (`aria-expanded` selectors)
- [React Aria Button](https://react-aria.adobe.com/Button), [React Spectrum Button](https://react-spectrum.adobe.com/react-spectrum/Button.html)
- [Atlaskit new-button types (mirror)](https://github.com/pioug/atlassian-frontend-mirror/blob/master/design-system/button/src/new-button/variants/types.tsx)
- [Chakra Button](https://www.chakra-ui.com/docs/components/button), [Ant Design Button](https://ant.design/components/button), [Radix Themes Button](https://www.radix-ui.com/themes/docs/components/button), [Pajamas Button](https://design.gitlab.com/components/button/), [Polaris web components Button](https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button)
- [Carbon Inline loading](https://carbondesignsystem.com/components/inline-loading/usage/), [Carbon MenuButton Code Connect](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/MenuButton/MenuButton.figma.tsx), [Carbon issue #17607](https://github.com/carbon-design-system/carbon/issues/17607)
- [Fluent 2 Button types](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-button/library/src/components/Button/Button.types.ts)
- [CMS Accordion Code Connect](https://github.com/CMSgov/design-system/blob/main/packages/design-system/src/components/Accordion/Accordion.figma.tsx), [Coveo Select Code Connect](https://github.com/coveo/plasma/blob/master/packages/figma/src/Select.figma.tsx)
- [GitLab Pajamas UI kit components](https://design.gitlab.com/get-started/uik-components/)
- [Compose Material 3 reference](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary) (`ToggleFloatingActionButton`)
- [Adrian Roselli, More Accessible Skeletons](https://adrianroselli.com/2020/11/more-accessible-skeletons.html); [Polaris issue #1212](https://github.com/Shopify/polaris/issues/1212)
- [Figma forum: selective exposure of nested properties](https://forum.figma.com/suggest-a-feature-11/allow-selective-exposure-of-nested-component-properties-48984)
- Toolkit: `~/Projects/toolkit/standards/figma-standard.md` rules 1–4, 7, 31, 38, 39, 48; `~/Projects/toolkit/knowledge/ui/patterns/actions.md#loading-buttons`; `~/Projects/toolkit/skills/component-validator/references/mui.md` (MU3, MU4)
