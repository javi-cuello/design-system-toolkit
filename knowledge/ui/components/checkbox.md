# Checkbox

A checkbox picks any number of options from a set, none included, or turns one setting on that is saved with its form. This page owns the checkbox as a component, in design, in Figma and in code: the single box, the group in its `fieldset`, the indeterminate parent, "None of these", and its states. What spans the selection controls stays in [`../patterns/selection.md`](../patterns/selection.md): choosing the control, select all and clear all, multi-select and the dual listbox. Related: [radio](radio.md), [switch](switch.md), [chip](chip.md), [tables: selection and bulk actions](../patterns/tables.md#selection-and-bulk-actions).

## Overview

**Use when / don't use**
- [strong] A checkbox for any number of choices, or one setting, saved with a form; one choice of several is a radio and an instant setting a switch. The rule and its cases are [checkbox](#checkbox); the count that decides between checkboxes and a multi-select is [selection: choosing the control](../patterns/selection.md#choosing-the-control).
- [moderate] One component for the box; the group is a container around boxes, never a second kind of checkbox. Figma's Simple Design System ships `CheckboxField` and a `CheckboxGroup` whose children are checkbox fields ([SDS CheckboxGroup.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/checkbox/CheckboxGroup.figma.ts)); Carbon's `CheckboxGroup` takes a required `legendText` around its boxes ([Carbon CheckboxGroup source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/CheckboxGroup/CheckboxGroup.tsx)).

**Anatomy**
- [moderate] A box holding its mark (a tick, or a dash when indeterminate), a label after it, and an optional description under the label. SDS names them `Label` and `Description` ([SDS CheckboxField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/checkbox/CheckboxField.figma.ts)); Carbon `labelText` and `helperText` ([Carbon Checkbox source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Checkbox/Checkbox.tsx)).
- [strong] The group: a legend that asks the question, an optional hint, the options stacked, and an error message under the legend when the group fails validation ([forms: error messages and the error summary](../patterns/forms.md#error-messages-and-the-error-summary)).
- [required] A focus ring visible on the focused control (WCAG 2.4.7; figma-standard rule 39); a target of at least 24 by 24, label included (figma-standard rule 26; WCAG 2.5.8).

## Checkbox

**Use when / don't use**
- [strong] Use for any number of choices from a list, including none, in a form saved with a button.
- [moderate] Use a single checkbox for one setting saved with the form, or an agreement ("I agree to the terms").
- [strong] Don't use when only one choice may hold; that is radios ([GOV.UK checkboxes](https://design-system.service.gov.uk/components/checkboxes/)).
- [strong] Don't use as an action that happens on click ([NN/g, guideline 12](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)); that is a switch or a button.

**How**
- [moderate] **Label to the right** of the box, and the label is part of the target: clicking the text toggles the box ([Carbon checkbox](https://carbondesignsystem.com/components/checkbox/usage/); [NN/g guideline 11](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- [strong] **Group** related boxes in a `fieldset` whose `legend` asks the question ("How would you like to be contacted?"). On a one-question page the legend is the page heading ([GOV.UK](https://design-system.service.gov.uk/components/checkboxes/)). Add the hint "Select all that apply" only when people are likely to pick one by habit.
- [moderate] **Stack vertically**, one per line ([NN/g guideline 6](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/); [Carbon](https://carbondesignsystem.com/components/checkbox/usage/): "When possible, arrange the checkbox and radio button groups vertically").
- [weak] **Wording** positive and active: "Send me updates", never "Don't send me updates" ([NN/g guideline 7](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- [weak] **Order** alphabetical by default, or most to least common where research shows a few answers dominate ([GOV.UK](https://design-system.service.gov.uk/components/checkboxes/)).
- [weak] **"None of these"** where none is a valid answer: last, after an "or" divider, and exclusive (checking it clears the others) ([GOV.UK](https://design-system.service.gov.uk/components/checkboxes/)).
- [moderate] **Indeterminate and select all.** A parent box over a sublist shows checked when all children are, empty when none are, and indeterminate when some are; checking the parent checks every child, unchecking clears them ([Carbon](https://carbondesignsystem.com/components/checkbox/usage/)). Indeterminate is a display state only: clicking an indeterminate parent checks all. Leave out the parent in a filter where "all" and "none" mean the same ([Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/)).
- [weak] **States:** unchecked, checked, indeterminate, each with hover, focus, disabled and error.

**Cases**
- A form shows six interests as checkboxes in two columns → one column; two columns break the scan and the reader misses the second ([NN/g guideline 6](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- A table has a header checkbox to select rows and 3 of 20 are ticked → the header shows indeterminate; clicking it selects all 20, and the action bar says how many are selected.
- "Do not share my data" ticked by default → reword to "Share my data with partners", unticked; a negative label makes the person reason through a double negative.
- A checkbox labelled "Dark mode" applies the theme on click inside a settings page with no Save → a switch; a checkbox that acts at once breaks its promise.
- A list of dietary needs has no way to say "none" → add "None of these" last, behind a divider, exclusive; otherwise a person with no needs cannot answer a required question.

**Accessibility**
- [required] 1.3.1 Info and Relationships: the group's question is the `legend`. 3.3.2 Labels or Instructions: each box has its own label. 4.1.2 Name, Role, Value: the indeterminate state is exposed as mixed ([W3C APG checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/): `aria-checked="mixed"`; a native box sets its `indeterminate` property). 2.1.1 Keyboard: Space toggles. 2.5.8 Target Size: the label extends the target.
- [required] Implementation: code-standard rule 8 (the native `input type="checkbox"` inside the wrapper), code-standard rule 9 and code-standard rule 62 (disabled is the control's own), code-standard rule 15 (a hint is a description), code-standard rule 16 (native controls follow the theme). In a Figma component: figma-standard rule 26, figma-standard rule 31 (checked, indeterminate, hover, focus and disabled each draw differently), figma-standard rule 32.

**Build**
- [required] A native `<input type="checkbox">` inside the wrapper with its `label` after it, the group in a `fieldset` with a `legend` (code-standard rule 8; [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [required] States are pseudo-classes: `:checked`, `:indeterminate`, `:focus-visible`, `:user-invalid`, and `:disabled` dimmed on the host through `:has(> :disabled)` (code-standard rule 9, code-standard rule 62).
- [required] A custom look draws on the input itself (`appearance: none`) so it keeps focus and its form value; never a hidden input behind a drawn `span`. Native boxes follow the theme (code-standard rule 16).
- [required] Indeterminate is the `indeterminate` property, set by the script; the parent and its children change in one handler ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- [weak] "None of these" clears the others in a `change` handler; without script the server rejects the combination with an error.

**Check**
- *Script:* could check that every checkbox has a programmatic label, that a group of two or more sits in a `fieldset` with a `legend` or a labelled `role="group"`, that clicking a parent sets every child, and that no checkbox `change` causes navigation or a request without a submit.
- *Judgement:* Is the wording positive, and does a valid "none" answer exist?

**Sources:** GOV.UK, Carbon and NN/g as linked; they agree on every point used here.

## In Figma

**Layers**
- [required] Auto layout throughout: the box, then the text column holding `Label` and `Description`; the label wraps and the component grows with it (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant: `Box`, its mark `Icon`, `Label`, `Description` (figma-standard rule 10); a text layer bound to a property takes the property's name.
- [required] The box leads and the text trails in auto-layout order, never by fixed position, so a right-to-left page mirrors it, where the project mirrors (figma-standard rule 50).
- [weak] The box aligns to the label's first line, not the centre of a wrapped label, so a two-line label does not float its box (toolkit reasoning).

**Properties**
- [required] `Label` is a text property; `Show description` is a boolean directly above a `Description` text property (figma-standard rules 5, 21 and 37). SDS names the boolean `Has Description` ([SDS CheckboxField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/checkbox/CheckboxField.figma.ts)); rule 21 keeps `Has` for content the component holds and `Show` for a boolean that reveals a layer.
- [required] Every property drives a layer in every variant where that layer exists (figma-standard rule 30).
- [required] A group component, if the library draws one, holds a `Legend` text property and its boxes in a slot named for what it hosts (`Options slot`), never nested checkbox instances whose labels are text overrides, which a variant switch inside the parent drops (figma-standard rules 21 and 38).

**Variants and states**
- [required] The checked value is one axis, `Checked` with `False`, `True` and `Indeterminate`, default first, never a `Checked` and an `Indeterminate` boolean side by side: a box both checked and indeterminate is a selection that contradicts itself (figma-standard rules 1 and 2). SDS draws the same single axis as `Value Type`, mapping `Checked` and `Indeterminate` to `defaultSelected` and `Indeterminate` alone to `isIndeterminate` ([SDS CheckboxField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/checkbox/CheckboxField.figma.ts)).
- [required] Axes in the order `Checked → Validation → Disabled → State`; `Validation` lists `None` then `Error`; `Disabled` pairs only with Rest and sits right after it; `State` runs `Rest → Focus → Hover → Press` (figma-standard rules 1 to 4). The states the moved section lists are [checkbox: *How*](#checkbox).
- [moderate] `Checked` and `Validation` sit beside `State`, not on it, because each combines with every pointer state: a focused box in error is a frame the developer otherwise builds unseen, and code sets both as props while the browser sets the pointer states ([research: *States on the axis*](../../../research/components-and-naming/what-the-state-axis-models.md#states-on-the-axis)). The [radio](radio.md#in-figma) and [switch](switch.md#in-figma) link here.

**Tokens**
- [required] Every fill, stroke, radius, gap and padding binds a semantic variable, never a primitive; the label takes a text-role token (figma-standard rules 24, 28 and 29).
- [required] A state variant binds its own state's tokens (figma-standard rule 48); the mark keeps one token across pointer states where it never changes.
- [required] The unchecked box's border meets 3:1 against its surface, and the mark 3:1 against the checked fill (WCAG 1.4.11), in every mode (beyond figma-standard rule 32, which covers text).
- [required] Component tokens, where the project has them, are `Component/Checkbox/<Element>/<property>[-<variant>][-<state>]` aliasing semantic ones (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the snapshot's contract lists `Checked`, `Validation` and `Disabled`, so an axis with no code counterpart shows in the parity report.
- *Judgement*: can a designer draw a select-all parent in each of its three states, and never a box that is checked and indeterminate at once?

**Sources.** Figma's Simple Design System for the single checked axis and the property names, Carbon for the group's legend; the toolkit's research article *What the State axis models* (research folder, November 2026) for what sits beside `State`. SDS puts Disabled as a value of `State` rather than an axis of its own; the toolkit keeps figma-standard rule 1's separate `Disabled`, since code sets it as a prop and the browser sets the pointer states.

## In code

**Element**
- [required] The native `input type="checkbox"` inside the wrapper, its `label` after it, the group a `fieldset` with a `legend`, as [checkbox: *Build*](#checkbox) sets out (code-standard rule 8). Radix renders a `button role="checkbox"` with `aria-checked="mixed"` and a hidden input for forms ([Radix checkbox source](https://github.com/radix-ui/primitives/blob/main/packages/react/checkbox/src/checkbox.tsx)); the native input needs neither.
- [required] Indeterminate has no HTML attribute: it is the `indeterminate` property, set by script and matched by `:indeterminate`, so server-rendered markup cannot carry it ([HTML: the checkbox state](https://html.spec.whatwg.org/multipage/input.html#checkbox-state-(type=checkbox))).

**Props**
- [strong] `checked` (or `defaultChecked`), `indeterminate`, `disabled`, `required`, a validation prop, the label and a description. Primer (`indeterminate`, `disabled`, `required`, `validationStatus`; [Primer Checkbox source](https://github.com/primer/react/blob/main/packages/react/src/Checkbox/Checkbox.tsx)), Carbon (`indeterminate`, `invalid`, `warn`, `labelText`, `helperText`), MUI (`indeterminate`, `size`, `color`; [MUI Checkbox source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Checkbox/Checkbox.js)) and React Aria (`isSelected`, `isIndeterminate`, `isInvalid`; [React Aria Checkbox](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Checkbox.tsx)) share this shape.
- [strong] Indeterminate is a boolean beside `checked` in code, though one axis in Figma: Primer, Carbon, MUI and React Aria do this; Radix alone folds it into `checked: boolean | 'indeterminate'`. The mapping below joins the two.

**From Figma**
- [required] Each Figma axis maps to one attribute, property or pseudo-class, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Checked=False` | no `checked` |
  | `Checked=True` | `checked`, styled from `:checked` |
  | `Checked=Indeterminate` | the `indeterminate` property set by script, styled from `:indeterminate` |
  | `Validation=Error` | `aria-invalid="true"` and the group's error tied with `aria-describedby`; styled from `:user-invalid` or the attribute |
  | `Disabled=True` | `disabled` on the input |
  | `State=Hover`, `Press`, `Focus` | `:hover`, `:active`, `:focus-visible`, set by the browser |
  | `Label`, `Description` | the `label`; the description tied with `aria-describedby` (code-standard rule 15) |

**Check**
- *Script*: the parity loop compares each variant's box, mark and ring with its frame (design-code-parity); the component contract flags a Figma axis with no prop.
- *Judgement*: does the indeterminate parent survive a server render, set by script after load?

**Sources.** Primer, Carbon, MUI, React Aria and Radix source as linked; the HTML standard for the indeterminate property; the toolkit's state-axis research for the mapping table.
