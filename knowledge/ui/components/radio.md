# Radio

A radio button picks exactly one option from a small set shown in full, saved with its form. This page owns the radio as a component, in design, in Figma and in code: the radio, its group in a `fieldset`, preselection, conditional reveal and its states. What spans the selection controls stays in [`../patterns/selection.md`](../patterns/selection.md): choosing the control, option tiles, and the counts that hand a set over to a select. Related: [checkbox](checkbox.md), [select](select.md), [segmented control](segmented-control.md), [switch](switch.md).

## Overview

**Use when / don't use**
- [moderate] Radios for one choice from two to about five, saved with a form; a choice that applies at once is a segmented control. The rule and its cases are [radio buttons](#radio-buttons); the counts are [selection: choosing the control](../patterns/selection.md#choosing-the-control).
- [strong] A radio never stands alone: the group is the unit, one question with its options, so the component pair is a radio and a group that names the question. Carbon's `RadioButtonGroup` requires `name` and takes `legendText` ([Carbon RadioButtonGroup source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/RadioButtonGroup/RadioButtonGroup.tsx)); SDS's `RadioGroup` takes radio fields as children ([SDS RadioGroup.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/radio/RadioGroup.figma.ts)); the APG radio group is one `radiogroup` of radios ([APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)).

**Anatomy**
- [moderate] A circle holding a dot when selected, a label after it, and an optional description under the label. SDS names them `Label` and `Description` ([SDS RadioField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/radio/RadioField.figma.ts)); Carbon `labelText` ([Carbon RadioButton source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/RadioButton/RadioButton.tsx)).
- [strong] The group: a legend that asks the question, an optional hint, the options stacked, and an error message under the legend when the group fails validation ([forms: error messages and the error summary](../patterns/forms.md#error-messages-and-the-error-summary)).
- [required] A focus ring visible on the focused control (WCAG 2.4.7; figma-standard rule 39); a target of at least 24 by 24, label included (figma-standard rule 26; WCAG 2.5.8).

## Radio buttons

**Use when / don't use**
- [moderate] Use for exactly one choice from two to about five, inside a form saved with a button.
- [moderate] Use in preference to a select whenever there is room, since all options stay in sight ([NN/g guideline 8](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- [strong] Don't use when more than one may hold; that is checkboxes ([GOV.UK radios](https://design-system.service.gov.uk/components/radios/)).
- [moderate] Don't use for a view or filter that applies at once; that is a segmented control (below).

**How**
- [moderate] **Stacked vertically**, one per line. Inline only for two short options such as Yes and No, and they stack again on a small screen ([GOV.UK radios](https://design-system.service.gov.uk/components/radios/)).
- [strong] **Grouped** in a `fieldset` with a `legend` that asks the question; the same heading rule as checkboxes.
- [contested] **Selection at start.** In a question, preselect nothing. Once a radio is chosen the person cannot return to "no answer", so offer "I do not know" or "None of the above" where they are valid ([GOV.UK](https://design-system.service.gov.uk/components/radios/)). In a settings form, the current value is shown checked; that is the state, not a preselection.
- [weak] **Order** alphabetical by default, or by frequency; an "or" divider before an option that stands apart ([GOV.UK](https://design-system.service.gov.uk/components/radios/)).
- [weak] **Conditional reveal** only for a simple follow-up question, never for inline radios, and never to show anything other than a question; anything longer goes on the next page ([GOV.UK](https://design-system.service.gov.uk/components/radios/)).
- [weak] **States:** unselected, selected, each with hover, focus, disabled and error.

**Cases**
- Seven delivery options as radios → keep radios if the page has room and the options must be compared on price and time; a select hides the comparison behind a click. Past fifteen, a select.
- "Yes / No" with the first preselected → remove the preselection; GOV.UK found it makes people miss the question and submit the wrong answer.
- A "Country" question with 190 radios → a combobox with autocomplete; nobody scans 190 options ([Baymard](https://baymard.com/blog/drop-down-usability)).
- A settings page shows the theme as three radios and applies each on click with no Save → make it a segmented control, or keep radios and add a Save; radios promise a submit ([NN/g guideline 12](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- A "How did you hear about us?" question with "Other" → reveal one text field under "Other"; a simple follow-up is what conditional reveal is for.

**Accessibility**
- [required] 1.3.1: the question is the `legend`. 2.1.1: Tab enters the group once, arrow keys move and select, Space selects the focused radio ([W3C APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)); native radios with a shared `name` do this already. 3.2.2 On Input: selecting a radio never navigates or submits. 4.1.2: the checked state is exposed.
- [required] Implementation: code-standard rule 8 (native `input type="radio"`), code-standard rule 9, code-standard rule 15, code-standard rule 20 (the form submits without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- [required] Native `<input type="radio">`s sharing a `name` in a `fieldset` with a `legend`; the browser gives one tab stop and arrow-key selection, so no roving script ([APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)).
- [contested] No `checked` in a question; in a settings form, `checked` from the stored value.
- [required] A conditional follow-up follows its radio in the DOM, shown by default; the script hides it on load and toggles `hidden` on `change` (code-standard rule 17, code-standard rule 20).
- [required] No `change` handler that submits or navigates (WCAG 3.2.2).
- [required] States from `:checked`, `:focus-visible` and `:disabled` (code-standard rule 9); markup in [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* tools/ui-check/check.mjs does not limit radios: design-standard rule 4 counts only button groups (`aria-pressed` buttons or `button[role="radio"]`), and treats native radio inputs as a form question. A script could check that radios in a question start unchecked, that every group has a `legend`, and that a `change` causes no navigation.
- *Judgement:* Is this a value saved with a form, or a view that should apply at once?

**Sources:** GOV.UK says never preselect; [NN/g's 2004 guideline 9](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/) says "Always offer a default selection". The toolkit follows GOV.UK for questions, because its reasons are tested failures (missed questions, wrong answers), and keeps the checked current value for settings, where NN/g's concern (a group that never shows a state) applies.

## In Figma

**Layers**
- [required] Auto layout throughout: the circle, then the text column holding `Label` and `Description`; the label wraps and the component grows with it (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant: `Circle`, its `Dot`, `Label`, `Description` (figma-standard rule 10).
- [required] The circle leads and the text trails in auto-layout order, so a right-to-left page mirrors it, where the project mirrors (figma-standard rule 50).

**Properties**
- [required] `Label` is a text property; `Show description` is a boolean directly above a `Description` text property (figma-standard rules 5, 21 and 37). SDS names the boolean `Has Description` ([SDS RadioField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/radio/RadioField.figma.ts)); rule 21 keeps `Has` for content the component holds.
- [required] Every property drives a layer in every variant where that layer exists (figma-standard rule 30).
- [required] The group holds a `Legend` text property and its radios in a slot named for what it hosts (`Options slot`), so each radio keeps its own label across a variant switch (figma-standard rules 21 and 38).
- [weak] The group's direction is a property only where the library draws inline pairs (Yes and No); Carbon's `orientation` and MUI's `row`, which its radio group takes from `FormGroup`, are the code's names for it ([Carbon RadioButtonGroup source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/RadioButtonGroup/RadioButtonGroup.tsx), [MUI FormGroup types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/FormGroup/FormGroup.d.ts)). Name the Figma property after the project's prop (figma-standard rule 21).

**Variants and states**
- [required] Selection is a True/False variant on the radio, `Selected`, `False` first (figma-standard rules 1 and 21); it maps to the group's `value`, not to a prop of the radio (*From Figma*, below). SDS's radio field maps no selection to code at all ([SDS RadioField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/radio/RadioField.figma.ts)), which leaves the selected frame with no prop to name.
- [weak] Selection stays on each radio, not on the group: the group's items live in a slot, and a component cannot set the variant of what fills its slot (figma-standard rule 38), so Figma cannot stop two radios in one group being checked. The group's description says one only; the toolkit's research accepts the same trade for Primer's segmented control ([research: *Nested child state*](../../../research/components-and-naming/what-the-state-axis-models.md#nested-child-state)). In code the group owns the value.
- [required] Axes in the order `Selected → Validation → Disabled → State`; `Validation` lists `None` then `Error`; `Disabled` pairs only with Rest and sits right after it; `State` runs `Rest → Focus → Hover → Press` (figma-standard rules 1 to 4).
- [moderate] `Selected` and `Validation` sit beside `State`, not on it, for the reason [checkbox: *In Figma*](checkbox.md#in-figma) gives.
- [weak] There is no indeterminate radio: a group with nothing checked is every radio at `Selected=False`, the state a question starts in ([radio buttons: *How*](#radio-buttons)).

**Tokens**
- [required] Every fill, stroke, radius, gap and padding binds a semantic variable, never a primitive; the label takes a text-role token (figma-standard rules 24, 28 and 29).
- [required] A state variant binds its own state's tokens (figma-standard rule 48).
- [required] The circle's border meets 3:1 against its surface and the dot 3:1 against its fill (WCAG 1.4.11), in every mode (beyond figma-standard rule 32, which covers text).
- [required] Component tokens, where the project has them, are `Component/Radio/<Element>/<property>[-<variant>][-<state>]` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the contract lists `Selected`, so a library whose group holds no `value` shows it in the parity report.
- *Judgement*: does every example group on the page show at most one checked radio, and a question group none?

**Sources.** Figma's Simple Design System for the property names and its missing selection mapping; Carbon and MUI for the group's direction; the toolkit's state-axis research for selection held per child.

## In code

**Element**
- [required] Native `input type="radio"`s sharing one `name` in a `fieldset` with a `legend`, as [radio buttons: *Build*](#radio-buttons) sets out; the browser gives one tab stop and arrow keys (code-standard rule 8; [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [required] The group is the component that names the question and carries the `name`; a radio component alone cannot keep a group to one choice.

**Props**
- [strong] On the group: `name`, `value` (or `defaultValue`), a legend, `disabled`, `required` and a validation prop; on the radio: `value`, the label, `disabled`. Carbon (`name`, `valueSelected`, `legendText`, `orientation`, `invalid`; radio `value`, `labelText`), React Aria (`value`, `orientation`, `isInvalid`; [React Aria RadioGroup](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/RadioGroup.tsx)), MUI (`name`, `value`, `row`; [MUI RadioGroup types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/RadioGroup/RadioGroup.d.ts)) and Primer (radio `value`, `name`, `checked`, `disabled`, `required`; [Primer Radio source](https://github.com/primer/react/blob/main/packages/react/src/Radio/Radio.tsx)) share this shape.
- [strong] The selected value is the group's prop, never a `checked` passed to each radio by hand: Carbon, React Aria and MUI all hold it on the group.

**From Figma**
- [required] Each Figma axis maps to one attribute, property or pseudo-class, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Selected=True` | the group's `value` equals this radio's `value`; the input is then `checked`, styled from `:checked` |
  | `Selected=False` | the group's `value` is another radio's, or empty |
  | `Validation=Error` | on the group: `aria-invalid="true"` on each input or `:user-invalid`, the error tied to the `fieldset` with `aria-describedby` |
  | `Disabled=True` | `disabled` on the input, or on the `fieldset` for the whole group |
  | `State=Hover`, `Press`, `Focus` | `:hover`, `:active`, `:focus-visible`, set by the browser |
  | `Label`, `Description` | the `label`; the description tied with `aria-describedby` (code-standard rule 15) |
  | group `Legend` | the `legend` |

**Check**
- *Script*: the parity loop compares each variant's circle, dot and ring with its frame (design-code-parity); the component contract flags a Figma axis with no prop.
- *Judgement*: does the group hold the value, so no template can check two?

**Sources.** Carbon, React Aria, MUI and Primer source as linked; the toolkit's state-axis research for the mapping.
