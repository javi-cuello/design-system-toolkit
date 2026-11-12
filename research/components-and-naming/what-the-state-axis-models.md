# What the State axis models

What each value on a Figma `State` axis becomes in code, which states belong on it, and what a designer has to write down for the engineers.

A designer hands over a button whose `State` dropdown reads Rest, Hover, Focus, Press, Disabled, Loading. The developer goes looking for a `state` prop to set and finds none: hover is something the browser does on its own, while disabled and loading are props someone passes. Then the review stalls on the usual questions. Is Loading a state? Should Disabled be a toggle? Is Open an axis?

Most of that argument comes from not saying which values the browser sets and which a developer does. The axis models appearances that can't be drawn at once, not the code's API, and that is a legitimate job as long as the mapping back to code is written down.

---

## What this answers

- [State values in code](#state-values-in-code): what each State value is in code
- [States on the axis](#states-on-the-axis): which states belong on the axis
- [Loading as a State](#loading-as-a-state): whether Loading is a State value
- [Open menu triggers](#open-menu-triggers): how an open menu trigger is drawn
- [Nested child state](#nested-child-state): who owns a nested child's state
- [Cheat sheet](#cheat-sheet): what must be written down for the engineers

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in one paragraph.

---

## State values in code

Three State values are pseudo-classes the browser applies, and the rest are props or attributes that a developer or the component sets; no surveyed library has a `state` prop.

Back at the handover, the developer reads the dropdown top to bottom. Hover needs no code to happen, only a style for when it does. Disabled needs a prop on the button, and Loading needs another. The dropdown lists them as equals, but in code they arrive by three different routes.

Here is the same button across the axis, with what sets each value underneath.

<svg role="img" viewBox="0 0 640 210" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A Save button in six states: Rest, Focus, Hover, Press, Loading and Disabled. Rest is set by nobody. Focus, Hover and Press are set by the browser through :focus-visible, :hover and :active. Loading and Disabled are set by the developer through a loading prop and a disabled prop.</title>
<rect x="0" y="0" width="640" height="210" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">One State axis, three kinds of setter</text>
<rect x="20" y="58" width="88" height="36" rx="6" fill="#2b59c3"/>
<text x="64" y="81" font-size="14" fill="#ffffff" text-anchor="middle">Save</text>
<rect x="120" y="55" width="94" height="42" rx="9" fill="none" stroke="#1a1a1a" stroke-width="2"/>
<rect x="123" y="58" width="88" height="36" rx="6" fill="#2b59c3"/>
<text x="167" y="81" font-size="14" fill="#ffffff" text-anchor="middle">Save</text>
<rect x="226" y="58" width="88" height="36" rx="6" fill="#234aa3"/>
<text x="270" y="81" font-size="14" fill="#ffffff" text-anchor="middle">Save</text>
<rect x="329" y="58" width="88" height="36" rx="6" fill="#1b3a80"/>
<text x="373" y="81" font-size="14" fill="#ffffff" text-anchor="middle">Save</text>
<rect x="432" y="58" width="88" height="36" rx="6" fill="#2b59c3"/>
<text x="476" y="81" font-size="14" fill="#ffffff" fill-opacity="0.2" text-anchor="middle">Save</text>
<circle cx="476" cy="76" r="8" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="30 20"/>
<rect x="535" y="58" width="88" height="36" rx="6" fill="#d9d7d0"/>
<text x="579" y="81" font-size="14" fill="#8a877e" text-anchor="middle">Save</text>
<text x="64" y="122" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="middle">Rest</text>
<text x="167" y="122" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="middle">Focus</text>
<text x="270" y="122" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="middle">Hover</text>
<text x="373" y="122" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="middle">Press</text>
<text x="476" y="122" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="middle">Loading</text>
<text x="579" y="122" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="middle">Disabled</text>
<text x="64" y="144" font-size="12" fill="#5a5850" text-anchor="middle">nothing</text>
<text x="167" y="144" font-size="12" fill="#5a5850" text-anchor="middle">:focus-visible</text>
<text x="270" y="144" font-size="12" fill="#5a5850" text-anchor="middle">:hover</text>
<text x="373" y="144" font-size="12" fill="#5a5850" text-anchor="middle">:active</text>
<text x="476" y="144" font-size="12" fill="#5a5850" text-anchor="middle">loading</text>
<text x="579" y="144" font-size="12" fill="#5a5850" text-anchor="middle">disabled</text>
<rect x="20" y="164" width="88" height="28" rx="4" fill="#ebe9e3"/>
<text x="64" y="183" font-size="12" fill="#1a1a1a" text-anchor="middle">nobody</text>
<rect x="120" y="164" width="300" height="28" rx="4" fill="#dfe7f6"/>
<text x="270" y="183" font-size="12" fill="#1a1a1a" text-anchor="middle">the browser</text>
<rect x="432" y="164" width="191" height="28" rx="4" fill="#f4e4cf"/>
<text x="527" y="183" font-size="12" fill="#1a1a1a" text-anchor="middle">the developer</text>
</svg>

The six frames sit in one dropdown, but only the last two need anyone to write a prop. The middle three happen whether or not the code mentions them.

The full mapping, including the values a button doesn't have, looks like this:

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

Kits almost always fold these into one list anyway. [Nathan Curtis audited ten published text-input kits](https://medium.com/@nathanacurtis/the-sorry-state-of-states-89dd4668737e) (Material 3, Material UI, Salesforce Lightning, Primer, Carbon, Atlassian, Redwood, Newskit, Polaris and one more). Almost all put disabled, error, focus and hover in one mutually exclusive dropdown, while their code exposes them independently. Eight had focus inside the dropdown and none had it as a boolean. Only Atlassian kept `isDisabled` and error as separate properties, to match its code.

The Code Connect files tell the same story. A single `State` axis appears in 19 of 23 kits (33 of 46 in a blind re-run), often with `Disabled`, `Checked` or `Selected` kept beside it. And that axis is the largest single source of mismatch between Figma names and code props, because its values feed `disabled` or `loading`.

MUI makes the split concrete. Hover and press are plain CSS. `disabled`, `selected`, `checked`, `error` and `expanded` are props, and each adds a `.Mui-*` class to the element.

Focus is where it bites, because MUI has two focus classes. `.Mui-focusVisible` follows the `:focus-visible` heuristic on button-like components. `.Mui-focused` marks an input wrapper whenever its input has focus at all. Here is the version that looks right, and the one that is (the outline values are illustrative):

```js
// Ring shows on every mouse click
'&.Mui-focused': { outline: '2px solid' }

// Ring shows for keyboard focus only
'&.Mui-focusVisible': { outline: '2px solid' }
```

On a button, the first rule draws the focus ring when someone clicks it with a mouse. The Figma Focus frame said nothing about which class to use, so the developer had to guess.

Keep one `State` axis for what can't be drawn together, and write down next to each component which values are pseudo-classes and which are props. **The dropdown is a drawing device; the implementation notes are where it becomes code.** The [cheat sheet](#cheat-sheet) is the mapping to copy into them.

---

## States on the axis

Appearances that exclude each other go on the axis; anything that combines with everything else goes beside it, such as `Disabled` as a True/False variant, a validation status or `Selected`.

Take a text field. In a browser it can be hovered, focused and showing an error all at once. A static frame can only show one picture, and five independent booleans would make 32 cells to hold artwork for perhaps six real appearances. So kits reach for one dropdown, and it is a sensible reach.

The catch is the row nobody drew. Here is what the kit holds next to what a user sees on the first wrong keystroke.

<svg role="img" viewBox="0 0 640 230" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Top: the kit's four text field frames, Rest, Hover, Focus and Error, each drawn once. Bottom: what the browser shows while someone types a wrong email, a field that is focused and in error at once, with a focus ring around a red border. No frame in the kit shows that combination.</title>
<rect x="0" y="0" width="640" height="230" fill="#f7f6f2"/>
<text x="20" y="28" font-size="14" font-weight="600" fill="#1a1a1a">What the kit draws: one dropdown</text>
<rect x="20" y="44" width="130" height="36" rx="6" fill="#ffffff" stroke="#a9a59a"/>
<text x="32" y="67" font-size="13" fill="#8a877e">Email</text>
<text x="85" y="100" font-size="12" fill="#5a5850" text-anchor="middle">Rest</text>
<rect x="175" y="44" width="130" height="36" rx="6" fill="#ffffff" stroke="#5a5850"/>
<text x="187" y="67" font-size="13" fill="#8a877e">Email</text>
<text x="240" y="100" font-size="12" fill="#5a5850" text-anchor="middle">Hover</text>
<rect x="327" y="41" width="136" height="42" rx="9" fill="none" stroke="#2b59c3" stroke-width="2"/>
<rect x="330" y="44" width="130" height="36" rx="6" fill="#ffffff" stroke="#a9a59a"/>
<text x="342" y="67" font-size="13" fill="#8a877e">Email</text>
<text x="395" y="100" font-size="12" fill="#5a5850" text-anchor="middle">Focus</text>
<rect x="485" y="44" width="130" height="36" rx="6" fill="#ffffff" stroke="#c0392b" stroke-width="2"/>
<text x="497" y="67" font-size="13" fill="#1a1a1a">ana@</text>
<text x="550" y="100" font-size="12" fill="#5a5850" text-anchor="middle">Error</text>
<text x="20" y="140" font-size="14" font-weight="600" fill="#1a1a1a">What the browser shows</text>
<rect x="17" y="153" width="136" height="42" rx="9" fill="none" stroke="#2b59c3" stroke-width="2"/>
<rect x="20" y="156" width="130" height="36" rx="6" fill="#ffffff" stroke="#c0392b" stroke-width="2"/>
<text x="32" y="179" font-size="13" fill="#1a1a1a">ana@</text>
<text x="85" y="214" font-size="12" fill="#5a5850" text-anchor="middle">Focus and Error</text>
<rect x="175" y="156" width="440" height="36" rx="6" fill="none" stroke="#a9a59a" stroke-dasharray="4 3"/>
<text x="395" y="179" font-size="13" font-style="italic" fill="#5a5850" text-anchor="middle">No frame for this: the developer builds it unseen</text>
</svg>

Focused and errored at once is routine in a browser and has no frame in the kit. A developer builds it without a picture, and the mismatch turns up in QA.

That is why error belongs beside the axis rather than on it. Primer does the same one level down: its `validationStatus` (`error`, `success`; `warning` was dropped) folds the whole validation family into one enum of its own.

The toolkit's canon, tested across two project libraries, spells out the arrangement in its Figma standard (`standards/figma-standard.md`):

- Axes run `Size → Role → Feedback → Disabled → State`, with `State` last and `Disabled` a True/False variant directly before it (rule 1).
- Disabled pairs only with Rest (rule 2), and its variant sits straight after its Rest sibling (rule 3). In one library, 28 of 28 sets already did this.
- State runs `Rest → Focus → Hover → Press (→ Loading)` (rule 4).

That order matters in code too. Two CSS rules of equal specificity resolve by source order, the later one winning. So a `styleOverrides` block that puts `&:hover` after `&.Mui-focusVisible` lets hover win on a button that is hovered and focused at once, and the focus style disappears under the pointer.

Some cells are not merely unwanted but unreachable. A Disabled and Hover frame can't happen in MUI, since a disabled `ButtonBase` sets `pointer-events: none`.

Two further toolkit rules close gaps a dropdown invites. Each state must draw differently from Rest, with Focus a ring a keyboard user can see (rules 31 and 39). And each state variant binds its own state's tokens; Loading, which no token names, borrows the resting ones by design (rule 48).

Put the lifecycle on one `State` axis, and put `Disabled`, `Selected` and validation beside it, named after the code's props. **Draw Focus before Hover in the file and write it before hover in the stylesheet, so the later rule is the one you meant to win.** The axis order is the toolkit's tested rule; the reason for it is how CSS resolves a tie.

---

## Loading as a State

Loading is a State value in Figma; in code it is a boolean prop on Button in every library surveyed, never a component and never `state="loading"`.

A designer adding a loading frame to that Save button has two obvious options: a sixth value on `State`, or a `Loading` True/False property beside it. Both look tidy in the properties panel. Only one of them keeps the set small.

First, what code does. Every system read either puts a loading prop on Button or hands loading to something else entirely:

| System | Prop |
|---|---|
| MUI | `loading`, `boolean \| null`, default `null` (v6.4.0 on) |
| Primer | `loading`, plus `loadingAnnouncement` |
| React Aria, Spectrum S2 | `isPending` |
| Atlassian (redesigned button) | `isLoading`, shared by `Button`, `IconButton`, `LinkButton` |
| Polaris, Pajamas, Radix Themes, Chakra v3 | `loading` (Chakra renamed it from `isLoading`) |
| Ant Design | `loading`, or `{ delay, icon }` |
| Carbon | none: loading belongs to `InlineLoading` |

Now the Figma side, where arithmetic decides it. Say your button has 18 combinations before states (Size 3 × Emphasis 3 × Icon 2) and five state values. Before reading on, work out how many variants each option produces.

| Model | Calculation | Variants | Impossible cells |
|---|---|---|---|
| Loading as a sixth State value | 18 × 6 | 108 | 0 |
| Loading as a boolean beside State | 18 × 5 × 2 | 180 | 72 |

A value on an existing axis grows the set by one row. A boolean doubles it, and the doubled half is mostly loading-and-hover and loading-and-press, cells that can't occur.

[An analysis of Figma booleans on component-driven.dev](https://www.component-driven.dev/articles/boolean-flags-in-figma) lands in the same place, and adds a tell. Hiding the label during loading needed a negation boolean, a flag whose only job is to cancel another one.

So Loading behaves like Disabled: it excludes hover and press in appearance. It belongs on the axis that models exclusion, even though code reaches it by a different route. The toolkit recorded the same ruling under rule 4 on 22 September 2026. The finding "the State axis carries Loading" had been raised and ruled away on every audit of one library; the validator now writes the code mapping into the component's implementation notes instead of raising it.

The Loading frame still has to carry what a picture can't:

- It is built from the enabled style, never Disabled's grey. Disabled colours are often exempt from contrast requirements, and a busy control must still be readable.
- It keeps the resting width, so the layout doesn't jump.
- Its label is faded with `opacity`, never `visibility: hidden`, so it stays the button's accessible name.

The behaviour around it (focus kept with `aria-disabled`, a live region present from page load, a spinner shown after about a second and held a minimum time once shown, a server-side guard against a double press) lives in the toolkit's knowledge page on loading buttons, `knowledge/ui/patterns/actions.md#loading-buttons`.

One contradiction inside the toolkit needs fixing. Figma-standard rule 4 describes the build as "a `loading` prop with `aria-busy`". The actions page says `aria-busy` is not an adequate announcement. [Adrian Roselli's 2020 testing](https://adrianroselli.com/2020/11/more-accessible-skeletons.html) found only JAWS honoured it, and [Polaris issue #1212](https://github.com/Shopify/polaris/issues/1212) from 2018 recorded VoiceOver and NVDA users hearing stale labels or "alert unavailable busy save product". The actions page is right.

Add `Loading` as the last State value, drawn in Rest's colours at Rest's width, and point the implementation notes at `loading` with `aria-disabled` and a live region. **Don't hand over `aria-busy` as the announcement; screen readers mostly ignore it.** If your code target is MUI, only `Button` and `IconButton` take `loading` (the toolkit validator's case MU3), so a loading frame on any other component is a bespoke build or a named deviation.

---

## Open menu triggers

An open menu trigger is drawn as one `Open` appearance, usually reusing the pressed or selected look, not as an axis multiplied by every other state; in code it is `aria-expanded`.

Take a "Sort by" button that opens a menu. A designer adds an `Open` True/False property and crosses it with Rest, Focus, Hover and Press. The set now holds hover-while-open and focus-while-open as separate frames, and nobody needs them.

Systems that draw an open trigger at all mostly borrow a look they already have:

| System | Draws open? | Driven by | Looks like |
|---|---|---|---|
| Primer | yes | `aria-expanded` | its pressed state |
| Atlassian | yes | `isSelected` on the trigger | its selected state |
| Material 3 | split button only | checked state | selected, plus a turning chevron |
| Fluent 2 | yes | `aria-expanded` | its own style, from the selected tokens |
| Carbon, Polaris | chevron only | open class, `disclosure` | rotated or swapped arrow |
| MUI, Spectrum, Ant Design | no | nothing | unchanged |

One `Open` value draws the open look once. The focus ring then sits on top of it in code, as it does on any other state, without a frame of its own.

The table's last row carries a trap. Where the code target is MUI, the library draws nothing for an open trigger. Whatever the `Open` frame shows is a style the engineers have to add, keyed on `[aria-expanded="true"]`.

Add `Open` as a State value on the roles that open menus, and map it to `aria-expanded` in the implementation notes. **One value, not an axis: the combinations an axis adds are frames nobody uses.** [When to split or merge a component](when-to-split-or-merge-a-component.md) works through a real menu trigger folded into Button this way.

---

## Nested child state

The parent owns a nested child's state: the child is one component set with that state as an axis, the parent sets it and does not expose the nested instance, and the child is split per state only when designers need its other properties.

Take a floating action button that opens into a menu. The open FAB contains the button itself, and the button has an open look. If the parent exposes the nested button's properties so designers can change its icon, it exposes the button's state too. Now an open FAB can be made to hold a closed button.

That happens because of how Figma works: exposing a nested instance's properties is all or nothing. A designer can't expose the icon and hide the state. Selective exposure has been [requested on Figma's forum](https://forum.figma.com/suggest-a-feature-11/allow-selective-exposure-of-nested-component-properties-48984) since 2022 and hasn't shipped.

Kits answer in one of four ways, depending on what the parent needs from the child:

| What the parent needs from the child | Build | Kits | Invalid combinations |
|---|---|---|---|
| Nothing: the parent's state decides the child | one child set with the state axis; the parent picks the variant and does not expose the child | Carbon `MenuButton`, CMS `Accordion`, Coveo `Select` | reachable only by drilling into the layer |
| Some properties, not the state | split the child into ` / ` siblings per state and expose it | no kit found; Primer's `NavList.Item/SubItem` for the naming | none from the panel; a swap still could |
| Some properties, without a second component | a simplified copy of the child built inside the parent | GitLab Pajamas "integrated components" | none; the copy is kept in step by shared variables |
| The state belongs to each child | state on the child only | Primer `SegmentedControl.Button` | accepted: two selected buttons are possible |

The systems' own trackers show the strain. Carbon has logged props that sit on `Tabs` in code but on each tab item in Figma ([#17607](https://github.com/carbon-design-system/carbon/issues/17607)). [Pajamas avoids nesting full base components](https://design.gitlab.com/get-started/uik-components/) at all, citing file weight, hidden properties and less reliable nested overrides. In code, Material 3 makes the open FAB a separate `ToggleFloatingActionButton` inside `FloatingActionButtonMenu`, the nearest precedent for splitting a child per state.

The toolkit adopted the first row as rule 7 of its Figma standard on 7 October 2026, with the split as an exception the parent's description must explain. Its tested rule 38 adds a reason to put per-item content in slots when items have variants. A text edit inside a nested instance is dropped when that instance changes variant inside its parent.

Ask what the parent must expose from the child. If nothing, build one child set, let the parent drive its state, and don't expose it. If something, split the child per state with ` / ` and write the reason in the parent's description. **Either way, code has one prop for the state, set on the parent.**

---

## Cheat sheet

What to write in each component's implementation notes, value by value:

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

## The short version

A `State` axis models appearances you can't draw together. Hover, focus and press are pseudo-classes nobody sets; Disabled, Loading and Open arrive through props or attributes. Keep the lifecycle on one axis, put what combines with everything beside it, and write the mapping to code down for each component. Make Loading a sixth State value in Figma, because a boolean doubles the set for cells that can't occur, and hand it over as a boolean prop. Make Open one value mapped to `aria-expanded`, not an axis. When a parent drives a child's state, the parent owns it, and you split the child per state only to expose its other properties.

---

## What to re-check later

Researched August to October 2026 from component source code and documentation (MUI, Primer, React Aria and Spectrum, Polaris, Chakra, Ant Design, Radix Themes, GitLab Pajamas, Atlassian, Carbon, Fluent), Nathan Curtis's audit of ten published text-input kits, and the `State` axes in 23 kits' Code Connect files (46 in the blind re-run). Re-checked in November 2026: Primer issue #7881, MUI's current major (v9; v10 in preview), and the Figma request for selective exposure of nested properties.

- **Where this came from.** This guide merges the Figma half of the loading-state guide, the state section of the naming guide, the nested-state study and the open-state survey from the button-merge study. Loading *behaviour* now lives in the toolkit's `knowledge/ui/patterns/actions.md#loading-buttons`.
- **Selective exposure of nested properties.** Requested since 2022 and still unshipped in November 2026. If Figma ships it, the split in [nested child state](#nested-child-state) becomes unnecessary.
- **Primer's loading announcement.** Issue [#7881](https://github.com/primer/react/issues/7881) was open in November 2026, with [#7882](https://github.com/primer/react/pull/7882) proposed to document the built-in announcement.
- **figma-standard rule 4's `aria-busy` wording**, against `actions.md`.
- **Library loading behaviour** changes with versions; re-read the pinned version's source before relying on the table in [loading as a State](#loading-as-a-state).
- **Curtis's tenth kit** is counted in his totals but not named in the article.

---

## Sources

**Primary: library source and documentation**

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
- [Polaris issue #1212](https://github.com/Shopify/polaris/issues/1212)
- [Figma forum: selective exposure of nested properties](https://forum.figma.com/suggest-a-feature-11/allow-selective-exposure-of-nested-component-properties-48984)

**Commentary**

- [Nathan Curtis, The Sorry State of States](https://medium.com/@nathanacurtis/the-sorry-state-of-states-89dd4668737e): the ten-kit audit.
- [component-driven.dev, Avoid Component's boolean props in Figma](https://www.component-driven.dev/articles/boolean-flags-in-figma)
- [Adrian Roselli, More Accessible Skeletons](https://adrianroselli.com/2020/11/more-accessible-skeletons.html)

**Toolkit**

- `standards/figma-standard.md` rules 1 to 4, 7, 31, 38, 39, 48
- `knowledge/ui/patterns/actions.md#loading-buttons`
- `skills/component-validator/references/mui.md` (MU3, MU4)
