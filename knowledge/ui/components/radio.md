# Radio

A radio button picks exactly one option from a small set shown in full, saved with its form. This page owns the radio as a component, in design, in Figma and in code: the radio, its group in a `fieldset`, preselection, conditional reveal and its states. What spans the selection controls stays in [`../patterns/selection.md`](../patterns/selection.md): choosing the control, option tiles, and the counts that hand a set over to a select. Related: [checkbox](checkbox.md), [select](select.md), [segmented control](segmented-control.md), [switch](switch.md).

## Overview

**Use when / don't use**
- [moderate] Radios for one choice from two to about five, saved with a form; a choice that applies at once is a segmented control. The rule and its cases are [radio buttons](#radio-buttons); the counts are [selection: choosing the control](../patterns/selection.md#choosing-the-control).
- [moderate] A radio never stands alone: the group is the unit, one question with its options, so the component pair is a radio and a group that names the question. Carbon's `RadioButtonGroup` requires `name` and takes `legendText` ([Carbon RadioButtonGroup source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/RadioButtonGroup/RadioButtonGroup.tsx)); the APG radio group is one `radiogroup` of radios ([APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)).

**Anatomy**
- [weak] A circle holding a dot when selected, a label after it, and an optional description under the label. Carbon names the label `labelText` ([Carbon RadioButton source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/RadioButton/RadioButton.tsx)).
- [strong] The group: a legend that asks the question, an optional hint, the options stacked, and an error message under the legend when the group fails validation ([forms: error messages and the error summary](../patterns/forms.md#error-messages-and-the-error-summary)).
- [required] The label is part of the target: a click on it selects the radio, as a `label` bound to its input does in HTML, so under WCAG 2.5.8 the circle and its label together are the target; figma-standard rule 26 departs: it asks the bare circle set for 24 by 24 on its own.
- [required] Focus shows a visible ring around the circle (WCAG 2.4.7; figma-standard rule 39).

## Radio buttons

**Use when / don't use**
- [moderate] Use for exactly one choice from two to about five, inside a form saved with a button.
- [moderate] Use in preference to a select whenever there is room, since all options stay in sight ([NN/g guideline 8](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- [strong] Don't use when more than one may hold; that is checkboxes ([GOV.UK radios](https://design-system.service.gov.uk/components/radios/)).
- [moderate] Don't use for a view or filter that applies at once; that is a segmented control (below).

**How**
- [moderate] **Stacked vertically**, one per line. Inline only for two short options such as Yes and No, and they stack again on a small screen ([GOV.UK radios](https://design-system.service.gov.uk/components/radios/)); Fluent prefers vertical and allows horizontal: "Horizontal alignment … work well in crowded layouts to save space" ([Fluent radio group](https://fluent2.microsoft.design/components/web/react/core/radiogroup/usage)).
- [strong] **Grouped** in a `fieldset` with a `legend` that asks the question; the same heading rule as checkboxes.
- [contested] **Selection at start.** In a question, preselect nothing. Once a radio is chosen the person cannot return to "no answer", so offer "I do not know" or "None of the above" where they are valid ([GOV.UK](https://design-system.service.gov.uk/components/radios/)). In a settings form, the current value is shown checked; that is the state, not a preselection.
- [weak] **Order** alphabetical by default, or by frequency; an "or" divider before an option that stands apart ([GOV.UK](https://design-system.service.gov.uk/components/radios/)).
- [weak] **Conditional reveal** only for a simple follow-up question, never for inline radios, and never to show anything other than a question; anything longer goes on the next page ([GOV.UK](https://design-system.service.gov.uk/components/radios/)).
- [weak] **States:** unselected, selected, each with hover, focus, disabled and error.
- [strong] **The error says what to select, by the shape of the question.** A yes-or-no question: "Select yes if [whatever it is is true]". Two options that are not yes and no: "Select if [whatever it is]", such as "Select if you are employed or self-employed". More than two: "Select [whatever it is]", such as "Select the day of the week you pay your rent" ([GOV.UK radios](https://design-system.service.gov.uk/components/radios/)).

**Cases**
- Seven delivery options as radios → keep radios if the page has room and the options must be compared on price and time; a select hides the comparison behind a click. Past fifteen, a select.
- "Yes / No" with the first preselected → remove the preselection; GOV.UK found it makes people miss the question and submit the wrong answer.
- A "Country" question with 190 radios → a combobox with autocomplete; nobody scans 190 options ([Baymard](https://baymard.com/blog/drop-down-usability)).
- A settings page shows the theme as three radios and applies each on click with no Save → make it a segmented control, or keep radios and add a Save; radios promise a submit ([NN/g guideline 12](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- "Have you used this service before?" with Yes, No and "I do not know" fails with "Select yes if you have used this service before" → "Select whether you have used this service before"; the yes-or-no wording stops fitting once a third answer is offered.
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

**Sources:** GOV.UK says never preselect; [NN/g's 2004 guideline 9](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/) says "Always offer a default selection". GOV.UK's reasons are tested failures (missed questions, wrong answers); NN/g's concern is a group that never shows a state.

## In Figma

**Layers**
- [required] Auto layout throughout. `Radio` is the circle alone. `Radio field` holds a `Radio` instance, then the text column with `Label` and `Description`; the label wraps and the field grows with it (figma-standard rule 33). `Radio group` holds the legend, its hint and message, then the options, as the checkbox group does ([checkbox: *In Figma*](checkbox.md#in-figma)). The split follows the code's ([Alignment with code](#alignment-with-code)).
- [required] Each layer is named for its role, the same in every variant: in `Radio`, `Circle` and its `Dot`; in `Radio field`, the nested `Radio`, `Label` and `Description` (figma-standard rule 10).
- [required] The circle leads and the text trails in auto-layout order, so a right-to-left page mirrors it, where the project mirrors (figma-standard rule 50).

**Properties**
- [required] `Radio field` has `Label` as a text property and `Show description` directly above a `Description` text property (figma-standard rules 5, 21 and 37).
- [strong] `Radio field` has no error message: a radio's error is its group's. Primer's `FormControl` renders no validation message for a radio, React Aria's `RadioField` takes a description and no error, and Carbon's kit maps `invalid` on `RadioButtonGroup` and never on `RadioButton` ([Primer FormControl source](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.tsx), [React Aria RadioGroup.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/RadioGroup.tsx), [Carbon RadioButton.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/RadioButton/RadioButton.figma.ts)).
- [required] `Radio group` holds `Legend`, `Show description` above `Description`, a `Validation` axis (`None`, `Error`) whose `Error` variant adds `Error message`, over the code's `invalid` ([Carbon RadioButtonGroup.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/RadioButton/RadioButtonGroup.figma.ts)), and its radio fields in a slot named for what it hosts (`Options slot`), so each radio keeps its own label across a variant switch (figma-standard rules 5, 21, 38 and 57). The group has no parent to defer to, so its message needs no boolean of its own; it sits where [checkbox: *In Figma*](checkbox.md#in-figma) puts the group's.
- [weak] The group's direction is a property only where the library draws inline pairs (Yes and No); Carbon's `orientation` and MUI's `row`, which its radio group takes from `FormGroup`, are the code's names for it ([Carbon RadioButtonGroup source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/RadioButtonGroup/RadioButtonGroup.tsx), [MUI FormGroup types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/FormGroup/FormGroup.d.ts)). Name the Figma property after the project's prop (figma-standard rule 21).

**Variants and states**
- [contested] **`Checked` or `Selected`.** Selection is a True/False variant on `Radio` and `Radio field`, `False` first (figma-standard rule 1), and kits name it differently: Primer's draws `checked?`, read into `Radio`'s `checked` ([Primer Radio.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Radio/Radio.figma.tsx)); Carbon's draws `Selected`, read into `RadioButton`'s `defaultChecked` ([Carbon RadioButton.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/RadioButton/RadioButton.figma.ts)). figma-standard rule 21 departs from Carbon's kit: it takes `Checked`, a bare state word and HTML's own prop, which cannot be renamed, where the radio has a `checked` prop, as HTML, Primer ([Primer Radio source](https://github.com/primer/react/blob/main/packages/react/src/Radio/Radio.tsx)), Carbon ([Carbon RadioButton source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/RadioButton/RadioButton.tsx)) and MUI ([MUI Radio types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Radio/Radio.d.ts)) do, and `Selected` where the code names the state so, as React Aria's `isSelected` and `[data-selected]` do ([React Aria RadioGroup.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/RadioGroup.tsx)). The value itself is held by the group ([Alignment with code](#alignment-with-code)).
- [weak] Selection stays on each radio, not on the group: the group's items live in a slot, and a component cannot set the variant of what fills its slot (figma-standard rule 38), so Figma cannot stop two radios in one group being checked. The group's description says one only; the toolkit's research accepts the same trade for Primer's segmented control ([research: *Nested child state*](../../../research/components-and-naming/what-the-state-axis-models.md#nested-child-state)). In code the group owns the value.
- [required] Both sets have the axes `Checked → Validation → Disabled → State`; `Validation` lists `None` then `Error`; `Disabled` pairs only with Rest and sits right after it, and pairs with Focus too where the code keeps it focusable; `State` runs `Rest → Focus → Hover → Press` (figma-standard rules 1 to 4 and 57). Disabled never combines with Error, for the reason [checkbox: *In Figma*](checkbox.md#in-figma) gives, so the bare radio is 18 variants: 2 `Checked` values × (4 states without error, 4 with error, 1 disabled).
- [required] The field owns its radio's state: it sets the nested `Radio`'s variant from its own axes and does not expose the instance, and hovering or pressing the label acts on the circle (figma-standard rule 7).
- [moderate] `Checked` and `Validation` sit beside `State`, not on it, for the reason [checkbox: *In Figma*](checkbox.md#in-figma) gives.
- [weak] There is no indeterminate radio: a group with nothing checked is every radio at `Checked=False`, the state a question starts in ([radio buttons: *How*](#radio-buttons)).

**Tokens**
- [required] Every fill, stroke, radius, gap and padding binds a semantic variable, never a primitive; the label takes a text-role token (figma-standard rules 24, 28 and 29).
- [required] A state variant binds its own state's tokens (figma-standard rule 48).
- [required] The circle's border meets 3:1 against its surface and the dot 3:1 against its fill (WCAG 1.4.11), in every mode (beyond figma-standard rule 32, which covers text).
- [required] Component tokens, where the project has them, are `Component/Radio/<Element>/<property>[-<variant>][-<state>]` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the contract lists `Checked`, so a library whose group holds no `value` shows it in the parity report.
- *Judgement*: does every example group on the page show at most one checked radio, and a question group none?

**Sources.** Primer's and Carbon's Code Connect files, and Primer, Carbon, MUI and React Aria source, for the selection property's name; Carbon and MUI for the group's direction; Primer, React Aria and Carbon for the field without a message; the toolkit's state-axis research for selection held per child.

## Alignment with code

**Structure**
- [strong] Code splits the radio as it splits the checkbox, into a bare circle, a field and a group, and the three sets mirror it: React Aria `RadioButton`, `RadioField` and `RadioGroup`, its single `Radio` deprecated for the pair ([React Aria RadioGroup.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/RadioGroup.tsx)); Primer a bare `Radio` placed in `FormControl`, and `RadioGroup` ([Primer Radio.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Radio/Radio.figma.tsx), [Primer RadioGroup.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/RadioGroup/RadioGroup.figma.tsx)); MUI `Radio` inside `FormControlLabel`, inside `RadioGroup` ([MUI FormControlLabel types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/FormControlLabel/FormControlLabel.d.ts), [MUI RadioGroup types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/RadioGroup/RadioGroup.d.ts)).
- [moderate] Carbon's `RadioButton` is always the field (`labelText`, a bare circle only through `hideLabel`) inside `RadioButtonGroup` ([Carbon RadioButton.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/RadioButton/RadioButton.figma.ts)); Radix ships `RadioGroup.Root`, `RadioGroup.Item` and `RadioGroup.Indicator` with no label or message ([Radix radio-group exports](https://github.com/radix-ui/primitives/blob/main/packages/react/radio-group/src/index.ts)). They map to `Radio field` and to `Radio` in a group.
- [strong] Unlike the checkbox, no library gives a lone radio a message, a validity or a requirement of its own: the value, the error and `required` are the group's. Primer's `FormControl` warns "An individual radio cannot be a required field" ([Primer FormControl source](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.tsx)); Carbon's `RadioButtonGroup` takes `invalid` and `invalidText` ([Carbon RadioButtonGroup.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/RadioButton/RadioButtonGroup.figma.ts)); React Aria's `RadioGroup` takes `isInvalid`. So the field has no message in [In Figma](#in-figma).

**Mapping**
- [required] Each Figma axis maps to one attribute, property or pseudo-class, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Checked=True` | the input's `checked` (Primer, Carbon, MUI), set from the group's `value` equalling this radio's `value`; styled from `:checked` |
  | `Checked=False` | the group's `value` is another radio's, or empty |
  | `Validation=Error` | on the group: `aria-invalid="true"` on each input or `:user-invalid`, the error tied to the `fieldset` with `aria-describedby` |
  | `Disabled=True` | `disabled` on the input, or on the `fieldset` for the whole group |
  | `State=Hover`, `Press`, `Focus` | `:hover`, `:active`, `:focus-visible`, set by the browser |
  | `Label`, `Description` | the `label`; the description tied with `aria-describedby` (code-standard rule 15) |
  | group `Legend` | the `legend` |

**States**
- [required] The browser sets `:checked` on the chosen radio and clears it on the others sharing its `name`, and the pointer and focus states in the mapping. A `required` group left empty makes every radio in it invalid ("both input elements will be suffering from being missing", [HTML: the radio state](https://html.spec.whatwg.org/multipage/input.html#radio-button-state-(type=radio))), so `:user-invalid` marks each radio after interaction or submit, the `Validation=Error` the fields take in a failed group.
- [required] `:indeterminate` matches every radio in a group with none checked ([HTML: `:indeterminate`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-indeterminate)), so a stylesheet that styles it for checkboxes scopes it to `[type=checkbox]`, or an unanswered question draws as mixed.
- [required] A prop sets the rest: the group's `value`, `disabled` on an input or on the `fieldset`, which disables every radio in it ([HTML: disabled form controls](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#concept-fe-disabled)), and `aria-invalid` for an error `required` cannot express. A chosen radio satisfies `required`, so `Checked=True` with `Validation=Error` (a server rejecting the choice) is reached only through `aria-invalid`.
- [required] Code cannot reach Disabled with Error: a disabled control is barred from constraint validation ([HTML: the disabled attribute](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-disabled)), and Carbon's group shows `invalid` only when `!readOnly && !disabled` ([Carbon RadioButtonGroup source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/RadioButtonGroup/RadioButtonGroup.tsx)).
- [moderate] React Aria marks each radio `data-invalid` from its group's state, and sets the pointer and focus states as data attributes ([React Aria RadioGroup.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/RadioGroup.tsx)), as [checkbox: *Alignment with code*](checkbox.md#alignment-with-code) describes for the checkbox.

**Differences**
- [moderate] Selection is drawn on each radio and held by the group in code, the trade [In Figma](#in-figma) explains. The kits draw it per radio too: Carbon's maps `Selected` to `defaultChecked` and Primer's `checked?` to `checked` on each radio, so only Primer's name mirrors its code (figma-standard rule 21) ([Carbon RadioButton.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/RadioButton/RadioButton.figma.ts), [Primer Radio.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Radio/Radio.figma.tsx)).
- [required] `Disabled` is an axis of its own where the Carbon and Primer kits fold it into `State`, and Read-only and Warning are not drawn, for the reasons [checkbox: *Alignment with code*](checkbox.md#alignment-with-code) gives (figma-standard rule 1).

**Check**
- *Script*: the component contract lists the three sets beside the code's components and props; a radio field with an error message, or a group with no `value`, shows in the parity report (design-code-parity).
- *Judgement*: does every failed group show one message, on the group, with every radio in it marked?

**Sources.** React Aria, Primer, MUI, Carbon and Radix source and Code Connect files as linked; the HTML standard for the radio group's validity, `:indeterminate` and disabled controls.

## In code

**Element**
- [required] Native `input type="radio"`s sharing one `name` in a `fieldset` with a `legend`, as [radio buttons: *Build*](#radio-buttons) sets out; the browser gives one tab stop and arrow keys (code-standard rule 8; [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [required] The group is the component that names the question and carries the `name`; a radio component alone cannot keep a group to one choice.

**Props**
- [strong] On the group: `name`, `value` (or `defaultValue`), a legend, `disabled`, `required` and a validation prop; on the radio: `value`, the label, `disabled`. Carbon (`name`, `valueSelected`, `legendText`, `orientation`, `invalid`; radio `value`, `labelText`), React Aria (`value`, `orientation`, `isInvalid`; [React Aria RadioGroup](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/RadioGroup.tsx)), MUI (`name`, `value`, `row`; [MUI RadioGroup types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/RadioGroup/RadioGroup.d.ts)) and Primer (radio `value`, `name`, `checked`, `disabled`, `required`; [Primer Radio source](https://github.com/primer/react/blob/main/packages/react/src/Radio/Radio.tsx)) share this shape.
- [strong] The selected value is the group's prop, never a `checked` passed to each radio by hand: Carbon, React Aria and MUI all hold it on the group.

**Check**
- *Script*: the parity loop compares each variant's circle, dot and ring with its frame (design-code-parity); the component contract flags a Figma axis with no prop.
- *Judgement*: does the group hold the value, so no template can check two?

**Sources.** Carbon, React Aria, MUI and Primer source as linked; the toolkit's state-axis research for the mapping.
