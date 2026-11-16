# Segmented control

A segmented control is a row of joined buttons that picks one of two to four short choices which apply at once: a view, a filter, a sort. This page owns it as a component, in design, in Figma and in code. Which control fits a choice stays in [`../patterns/selection.md`](../patterns/selection.md#choosing-the-control) and [interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice); a single-choice chip is built as this component ([chips](../patterns/chips.md)). Related: [radio](radio.md), [tabs](tabs.md), [button](button.md), [chip](chip.md).

## Overview

**Use when / don't use**
- [required] Two to four short choices that apply at once (design-standard rule 4); when it gives way to radios, a menu or tabs is [*Segmented control*](#segmented-control).
- [strong] One component, a single-select group of toggle buttons, under whatever name: Primer `SegmentedControl` ([source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/SegmentedControl/SegmentedControl.tsx)), MUI `ToggleButtonGroup` with `exclusive` ([types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/ToggleButtonGroup/ToggleButtonGroup.d.ts)), React Aria `ToggleButtonGroup` with `selectionMode="single"` ([docs](https://react-aria.adobe.com/ToggleButtonGroup)), Radix `ToggleGroup` with `type="single"` ([source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/toggle-group/src/toggle-group.tsx)).

**Anatomy**
- [strong] A named group holding the segments, each a button with a short label; all four systems above build it this way.
- [weak] A segment may lead with an icon and carry a count: Primer's `SegmentedControl.Button` takes `leadingVisual` and `count`, and an icon-only segment is its own `SegmentedControl.IconButton` whose `aria-label` is required in its types ([source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/SegmentedControl/SegmentedControlIconButton.tsx)).
- [required] Each segment shows a focus ring and is a target of at least 24 by 24 CSS pixels (figma-standard rules 26 and 39; WCAG 2.5.8).

## Segmented control

**Use when / don't use**
- [required] Use for a facet of two to four short choices that apply at once: a view, a filter, a sort (design-standard rule 4).
- [weak] Don't use inside a form that saves with a button; radios carry that promise ([Primer segmented control](https://primer.style/product/components/segmented-control/guidelines/): "similar to radio inputs but without needing form submission").
- [required] Don't use past four choices; a menu with counts (design-standard rule 4, design-standard rule 11).
- [weak] Don't use as navigation between pages; that is tabs or links (`navigation.md`).

**How**
- [weak] One choice is always selected; a filter control has a segment that shows everything ([Primer](https://primer.style/product/components/segmented-control/guidelines/)). The selection applies on click.
- [weak] Labels short and of similar length; icons only with a text name for assistive tech ([Primer](https://primer.style/product/components/segmented-control/guidelines/): "must have a text label, even if the label is only accessible to screen readers").
- [weak] On a small screen, a control that no longer fits becomes a menu ([Primer](https://primer.style/product/components/segmented-control/guidelines/)); it never wraps.
- [required] The control keeps its size when its selection changes (design-standard rule 2).
- [weak] **States:** selected and unselected, each with hover, focus, disabled.

**Cases**
- Five sort orders as segments → a menu; Primer would allow five, design-standard rule 4 does not.
- Light, Dark, System for a preview → segmented; three choices applying at once.
- A segmented control in a settings form with Save → radios; segments promise immediacy.
- A segment for a filter value with no matching rows → disabled in place (design-standard rule 5).

**Accessibility**
- [required] 1.3.1 and 4.1.2: a group of `button`s with `aria-pressed`, or a radio group; one tab stop with arrows inside if a radio group. 3.2.2: selection changes content, never context.
- [required] Implementation: code-standard rule 8, code-standard rule 9 (selected is a state of the native control), code-standard rule 15 (a count is a description). In Figma: figma-standard rule 31 (selected draws differently from rest by more than colour), figma-standard rules 26 and 32.

**Build**
- [required] A `role="group"` with a name, holding `<button type="button" aria-pressed>`s; selected is styled from `[aria-pressed="true"]` (code-standard rule 9). That is the view switch outside any form. A segmented facet inside a filter bar's GET form is radios in a `fieldset` styled as segments, so it submits without script ([filtering: facet controls](../patterns/filtering.md#facet-controls)).
  ```html
  <div role="group" aria-label="View">
    <button type="button" aria-pressed="true">Table</button>
    <button type="button" aria-pressed="false">Cards</button></div>
  ```
- [moderate] One handler sets `aria-pressed` on every segment and changes the view, so exactly one is pressed ([accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex)).
- [weak] The choice lives in the address, so the no-script version is links or a GET form ([javascript: state in the address and history](../../code/javascript.md#state-in-the-address-and-history)).
- [required] An icon-only segment has a name (code-standard rule 18); a count is a description (code-standard rule 15).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 4 (more than four segments). It could also check that exactly one segment is pressed.
- *Judgement:* Does this apply at once, or is it a form value?

**Sources:** Primer as linked; the count and its sources are in [interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice).

## In Figma

**Layers**
- [required] Auto layout throughout; each segment hugs its label and the control hugs or fills, so a longer label grows the control rather than clipping (figma-standard rule 33).
- [required] The segments sit in a slot, `Segments slot`, because each carries its own label and has variants: a label typed into a nested instance is lost when that instance changes variant (figma-standard rules 21 and 38). Filling a slot makes the segment a public part, `Segmented control segment`, with no `_` (figma-standard rules 8 and 9).
- [required] Inside a segment the layers are named for their role, the same in every variant: `Label`, `Icon`, `Count` (figma-standard rule 10).

**Properties**
- [required] The control exposes `Size` and its `Segments slot`; the segment exposes `Label` as a text property, `Show icon` directly above the `Icon` swap, and `Show count` directly above `Count` (figma-standard rules 5, 21 and 37).
- [required] An icon-only segment exposes its accessible name as a text property or an annotation (figma-standard rule 40).
- [required] Every property drives a layer in every variant where that layer exists (figma-standard rule 30).

**Variants and states**
- [required] The segment's axes run `Size → Selected → Disabled → State`, `Selected` a True/False variant with False first; `State` runs `Rest → Focus → Hover → Press`, and Disabled pairs only with Rest (figma-standard rules 1 to 4).
- [required] Selected draws differently from unselected by more than colour, and each state differs from its Rest sibling (figma-standard rule 31).
- [weak] Selected lives on each segment and the designer picks one; the control cannot enforce that only one is on, which the toolkit's research accepts for this case, citing Primer's `SegmentedControl.Button` ([what the State axis models: nested child state](../../../research/components-and-naming/what-the-state-axis-models.md#nested-child-state)). Code enforces it: the group holds the value.
- [required] Sizes are `Size` with t-shirt values, largest first (figma-standard rule 6); Primer offers `small` and `medium`.

**Tokens**
- [required] Every fill, stroke, radius, padding and gap is bound to a semantic variable (figma-standard rules 24 and 29); the label takes a text-role token (figma-standard rule 28).
- [required] A Hover or Press variant binds its own state's tokens, selected and unselected alike (figma-standard rule 48).
- [required] Label contrast holds in every mode, selected and not (figma-standard rule 32); the selected segment's boundary meets 3:1 against its neighbours (WCAG 1.4.11).
- [required] Component tokens, where the project has them, are named `Component/Segmented control/<Element>/<property>…` and alias semantic ones (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the segment set; the snapshot's contract lists the axes, so a `Selected` with no code counterpart shows in the parity report.
- *Judgement*: can a designer draw every segment count from two to four, at every size, without detaching?

**Sources.** Primer's segmented control source for the parts and the icon-only name; MUI, React Aria and Radix for the shape of the group; the toolkit's state-axis research for where Selected lives. Figma's Simple Design System has no segmented control, so no Figma-to-code mapping from it is cited here.

## In code

**Element**
- [contested] A `role="group"` of `button`s with `aria-pressed`, or a radio group. Primer renders a labelled `ul` of buttons with `aria-pressed`; React Aria sets `role="radiogroup"` and `role="radio"` when the selection is single ([useToggleButtonGroup](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/button/useToggleButtonGroup.ts)), and Radix does the same for `type="single"`. The toolkit picks by context: buttons for a view switch, radios inside a form ([*Segmented control*](#segmented-control), Build).
- [required] A disabled segment keeps its place with `disabled` or `aria-disabled="true"` on its own button, never on the group (code-standard rules 9 and 62); Primer sets `aria-disabled`.

**Props**
- [strong] The group takes the value, a change handler and `size`; each segment takes its label, icon and `disabled`. Primer (`onChange(selectedIndex)`, `size`, `fullWidth`, segment `selected`, `leadingVisual`, `count`), MUI (`exclusive`, `value`, `onChange`, `size`, `fullWidth`) and React Aria (`selectionMode`, `selectedKeys`, `disallowEmptySelection`) share this shape.
- [moderate] `fullWidth` stretches the control to its container: Primer and MUI both name it so.
- [weak] Primer's `variant` switches the control, per viewport, to `hideLabels` or `dropdown`: the menu the *How* part asks for on a small screen.
- [required] An icon-only segment requires its accessible name in the API, as Primer's `SegmentedControl.IconButton` does (code-standard rule 18).

**From Figma**
- [required] Each Figma axis maps to one attribute or prop, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Size` | `size` |
  | `Selected=True` on a segment | the group's value; the segment gets `aria-pressed="true"`, or `checked` in a radio build |
  | `State=Rest` | nothing |
  | `State=Hover`, `Press` | `:hover`, `:active`, set by the browser |
  | `State=Focus` | `:focus-visible` |
  | `Disabled=True` | `disabled`, or `aria-disabled="true"` |
  | `Label`, `Icon`, `Count` | children, leading icon, count as a description (code-standard rule 15) |
  | `Segments slot` | the segments, children of the group |
- [moderate] Selected is one value held by the group, not a flag set on each segment: MUI's `value` and React Aria's `selectedKeys` both work this way, so two selected segments, which Figma allows, cannot happen in code.

**Check**
- *Script*: the parity loop compares each segment variant with its frame (design-code-parity); tools/ui-check/check.mjs counts segments (design-standard rule 4); a test could assert exactly one segment is pressed after any click.
- *Judgement*: does the control apply its choice at once, and does it become a menu where it no longer fits?

**Sources.** Primer, MUI, React Aria and Radix sources as linked; they split on the role (pressed buttons or radios), and the toolkit chooses by whether the control sits in a form.
