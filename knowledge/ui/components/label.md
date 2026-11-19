# Label

A label names a form field: the words above a text field or select, or beside a checkbox, that say what to enter, with the mark that says whether an answer is required and, under it, the hint that helps answer. This page owns the label as a component, in design, in Figma and in code: its own component or a layer of each field, the required and optional mark, the disabled label, wrapping, and the hint as the field's description. What spans the whole form stays in [`../patterns/forms.md`](../patterns/forms.md): what a label says and where it sits ([*Labels*](../patterns/forms.md#labels)), which fields to mark and how ([*Required and optional fields*](../patterns/forms.md#required-and-optional-fields)), and what a hint holds ([*Help and hint text*](../patterns/forms.md#help-and-hint-text)). The message on a field in error is [feedback message](feedback-message.md). Related: [checkbox](checkbox.md), [select](select.md), [combobox](combobox.md).

## Overview

**Use when / don't use**
- [required] Every form control has a label a person can see and a programmatic name that contains it (WCAG 3.3.2, 1.3.1, 2.5.3); the writing and placement are [forms: *Labels*](../patterns/forms.md#labels).
- [weak] Don't use the label component for a group's question: a set of radios or checkboxes is asked by a `legend` ([checkbox](checkbox.md#checkbox)), which may share the label's text style but is a different element.
- [weak] Don't use it for a heading over a block of fields or a caption under a table; those are text styles, not labels.

**Anatomy**
- [strong] The label's words, then the necessity mark (an asterisk, or "(optional)"), then, as a separate element, the hint. Code keeps the hint apart from the label in every library read: SDS `Label` and `Description` ([SDS Fieldset.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Fieldset/Fieldset.tsx)), Primer `FormControl.Label` and `FormControl.Caption` ([Primer FormControl.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.figma.tsx)), Carbon `labelText` and `helperText` ([Carbon TextInput source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/TextInput.tsx)), React Aria `Label` and `Text slot="description"` (as SDS wraps them).
- [contested] **Where the hint sits.** GOV.UK puts it between the label and the field, which [forms: *Help and hint text*](../patterns/forms.md#help-and-hint-text) follows; SDS lays a field out as label, control, description, error (`grid-template-areas` in [SDS fieldset.css](https://github.com/figma/sds/blob/main/src/ui/primitives/Fieldset/fieldset.css)), Primer renders the caption after the control and its validation ([Primer FormControl source](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.tsx)). A project picks one side and keeps it on every field; the field pages' layer orders show the above side.

## Label

**Use when / don't use**
- [required] Use a visible label on every field; a placeholder never stands in for one ([forms: *Labels*](../patterns/forms.md#labels)).
- [moderate] Use a visually hidden label only where the place says what the field is (a search box in a search landmark); Primer's `visuallyHidden` and Carbon's `hideLabel` keep the element and hide the box ([Primer FormControlLabel source](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControlLabel.tsx), [Carbon TextInput source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/TextInput.tsx)).

**How**
- [required] **Wraps, never truncates.** A long or translated label grows onto a second line and the field moves down with it; a cut label loses the words that say what to enter (WCAG 1.4.10 and 1.4.12; figma-standard rule 33, text hugs vertically).
- [strong] **Disabled.** The label of a disabled field dims with the field, in the disabled text token, set by the field rather than by hand: SDS sets `--field-label-color` to `--sds-color-text-disabled-default` under `[data-disabled]` ([SDS fieldset.css](https://github.com/figma/sds/blob/main/src/ui/primitives/Fieldset/fieldset.css)), Primer's label takes `--control-fgColor-disabled` from `data-control-disabled` ([Primer InputLabel.module.css](https://github.com/primer/react/blob/main/packages/react/src/internal/components/InputLabel.module.css)), MUI's `FormLabel` takes `palette.text.disabled` ([MUI FormLabel source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/FormLabel/FormLabel.js)), and Carbon adds `label--disabled` ([Carbon TextInput source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/TextInput.tsx)).
- [required] The dimmed label is exempt from the contrast minimum, as text of an inactive component ([WCAG 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum); figma-standard rule 32 exempts disabled text); keep it legible all the same, since the person still reads what the field was.
- [moderate] **Not red in error.** The label keeps its colour when the field fails; the message and the field's border carry the error. GOV.UK's label has no error form ([GOV.UK label template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/label/template.njk)), Primer's label styles only disabled and hidden, and SDS's only disabled (sources above); MUI turns the label `error.main` ([MUI FormLabel source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/FormLabel/FormLabel.js)).
- [weak] **One question page.** Where the field is the page's only question, the label is the `h1` (GOV.UK's `isPageHeading` wraps the label in one, [GOV.UK label template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/label/template.njk)).

**Cases**
- A German translation doubles a label's length and the Figma field clips it at one line → the label hugs and wraps; the field below moves down.
- A disabled field's label stays full black while the control dims → the person reads it as editable; the field dims both.
- A failed field turns its label, border and message red → the label stays; colour on three parts adds nothing the message does not say.

**Accessibility**
- [required] 3.3.2 Labels or Instructions, 1.3.1 Info and Relationships (the label is tied to its control), 2.5.3 Label in Name (the visible words start the accessible name), 2.4.6 Headings and Labels. 1.4.3 exempts the disabled label.
- [required] Implementation: code-standard rule 15 (the hint is a description, never inside the label), code-standard rule 62 (the dim is the host's, from the control's `disabled`). In Figma: figma-standard rule 26 (text at least 12px) and figma-standard rule 32 (contrast, disabled exempt).

**Build**
- [required] A `label` with `for` pointing at the control's `id`, or wrapping it; before a text field in the DOM, after a checkbox or radio ([forms: *Labels*](../patterns/forms.md#labels); [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [required] The disabled look comes from the control's own `disabled`, read by the field host (`:has(:disabled)`), never a class or a prop on the label alone (code-standard rule 9, code-standard rule 62).
- [weak] A visually hidden label keeps the `label` element with a visually-hidden class, never `display: none`, which drops it from the accessibility tree ([accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).

**Check**
- *Script:* could flag a control with no associated `label`, a label whose text is clipped (`text-overflow: ellipsis` or a fixed height), and a disabled control whose label computes the resting colour.
- *Judgement:* Does the label still read at 200% zoom and in the longest language the product ships?

**Sources:** SDS, Primer, MUI and Carbon source and GOV.UK templates as linked; WCAG 2.2 for the disabled exemption. They split only on colouring the label in error, where MUI stands alone.

## Required and optional mark

**Use when / don't use**
- [contested] Which fields carry a mark, and whether it is the asterisk, "(optional)" or both, is decided once per form by its layout: [forms: *Required and optional fields*](../patterns/forms.md#required-and-optional-fields) owns it. This section owns how the mark is drawn and built.

**How**
- [strong] **Inside the label, after the words.** Primer renders the label's text and then the mark in one flex row with a 4px gap ([Primer InputLabel source](https://github.com/primer/react/blob/main/packages/react/src/internal/components/InputLabel.tsx)), MUI appends a thin space and `*` ([MUI FormLabel source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/FormLabel/FormLabel.js)), and Spectrum appends an asterisk icon or the words "(required)" or "(optional)" from its `isRequired` and `necessityIndicator` props ([Spectrum Label source](https://github.com/adobe/react-spectrum/blob/main/packages/@adobe/react-spectrum/src/label/Label.tsx)).
- [required] The mark is never colour alone and meets contrast where it is coloured (WCAG 1.4.1, 1.4.3); an asterisk is explained at the start of the form ([forms: *Required and optional fields*](../patterns/forms.md#required-and-optional-fields)).
- [weak] **The words are translatable text.** Spectrum formats "(required)" and "(optional)" from its localised strings ([Spectrum Label source](https://github.com/adobe/react-spectrum/blob/main/packages/@adobe/react-spectrum/src/label/Label.tsx)); a mark baked into each label string drifts between fields.

**Cases**
- The asterisk is a red 8px glyph → 1.4.1 and 1.4.3 fail; draw it at the label's size, at contrast, and explain it above the form.
- A form marks required fields with "*" and the optional ones not at all, and has twelve fields → [forms](../patterns/forms.md#required-and-optional-fields) says to mark both; the label component offers both marks.
- A screen reader reads "Email star required" → the asterisk is hidden from it, since `required` already announces the state.

**Accessibility**
- [required] 3.3.2 (required input is indicated, technique H90), 1.4.1 Use of Color, 1.3.1 (the state is programmatic: `required`, or `aria-required` on a custom control).
- [contested] **Whether a screen reader hears the asterisk.** MUI sets `aria-hidden` on it, and Spectrum hides the "(required)" words from the name "because aria-required is set on the field" ([Spectrum Label source](https://github.com/adobe/react-spectrum/blob/main/packages/@adobe/react-spectrum/src/label/Label.tsx)); Primer leaves the `*` in the name unless `requiredIndicator` is false ([Primer InputLabel source](https://github.com/primer/react/blob/main/packages/react/src/internal/components/InputLabel.tsx)). Where the project hides it, as [forms](../patterns/forms.md#required-and-optional-fields) builds it, the state is announced once, from the control. "(optional)" stays in the name, since no attribute says it.

**Build**
- [weak] `<label for="email">Email <span aria-hidden="true">*</span></label>` with `required` on the control; "(optional)" is plain text inside the `label` ([forms: *Required and optional fields*](../patterns/forms.md#required-and-optional-fields)).
- [required] The mark and the `required` attribute come from one field definition, so they cannot disagree (code-standard rule 29), and the mark is styled from the markup, never a class (code-standard rule 9).

**Check**
- *Script:* could check that every label holding "*" sits on a `required` control and the reverse, and that every "(optional)" label sits on one without it.
- *Judgement:* Does each form explain its asterisk before the first field?

**Sources:** Primer, MUI and Spectrum source as linked; they agree on the place and differ on whether the asterisk is read.

## Hint

**Use when / don't use**
- [moderate] Use a hint for a format, a constraint or a reason, as [forms: *Help and hint text*](../patterns/forms.md#help-and-hint-text) sets out; leave it out when the label says enough.

**How**
- [strong] **The hint is the field's description**, a separate text element tied to the control, never part of the label. Its names in code: SDS and React Aria `description`, Primer `Caption`, Carbon and MUI `helperText`, GOV.UK `hint` (sources in [Anatomy](#overview)).
- [strong] **It dims with a disabled field.** SDS sets `--field-description-color` to the disabled token, Primer's caption takes `data-control-disabled` ([Primer FormControlCaption source](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControlCaption.tsx)), MUI's `FormHelperText` takes `text.disabled` ([MUI FormHelperText source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/FormHelperText/FormHelperText.js)) and Carbon adds `form__helper-text--disabled`.
- [contested] **Whether the hint stays when an error shows.** Carbon renders the validation message in place of the helper text (`normalizedProps.validation || helper`, [Carbon TextInput source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/TextInput.tsx)) and MUI uses one `FormHelperText` for both; SDS, Primer and GOV.UK show both ([feedback message](feedback-message.md#feedback-message)).

**Cases**
- A date field's hint "For example, 27 3 2007" disappears when the error "Date must be in the past" appears → keep both; the person needs the format to correct it.

**Accessibility**
- [required] 3.3.2: instructions are given; 1.3.1: the hint is associated with the field. code-standard rule 15: `aria-describedby`, never in the label.

**Build**
- [required] An element with an `id`, listed first in the control's `aria-describedby`, the message's `id` after it ([forms: *Help and hint text*](../patterns/forms.md#help-and-hint-text); code-standard rule 15). GOV.UK's input builds `describedBy` in that order ([GOV.UK input template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/input/template.njk)). Primer lists the validation `id` before the caption's, the reverse (`[validationMessageId, captionId]`, [Primer FormControl source](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.tsx)), so the hint-first order rests on GOV.UK alone and weighs as one system.

**Check**
- *Script:* could check that each hint's `id` is in its control's `aria-describedby`, before any message's.
- *Judgement:* Does the hint answer what people get stuck on here?

**Sources:** SDS, Primer, MUI, Carbon and GOV.UK as linked.

## In Figma

**Layers**
- [required] Auto layout throughout. A field draws, in order, `Label` (holding the label's `Text` and the `Required` or `Optional` mark in one horizontal row), then `Description`, then `Error message`, then the control (the order shown is for a project that places the hint and the message above the field, a `contested` choice the project decides; see [forms: *Help and hint text*](../patterns/forms.md#help-and-hint-text) and [*Error messages*](../patterns/forms.md#error-messages-and-the-error-summary)) ([Anatomy](#overview)); every text hugs vertically and wraps (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant: `Label`, `Description`, `Error message`, as the [checkbox](checkbox.md#in-figma), [select](select.md#in-figma) and [combobox](combobox.md#in-figma) pages name them (figma-standard rule 10).
- [required] The mark follows the words in auto-layout order, never by fixed position, so a right-to-left page mirrors it where the project mirrors (figma-standard rule 50).
- [contested] **Its own component, or a layer in each field.** Primer's kit draws `Label`, `Caption` and `Validation` as components of their own, each with its own Code Connect mapping ([Primer FormControl.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.figma.tsx)); SDS's and Carbon's kits draw the label as a layer of each field, read through the field's own `Has Label` and `Label`, or `Label text`, properties ([SDS InputField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/InputField.figma.ts), [Carbon TextInput.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextInput/TextInput.figma.ts)). A nested `Label` instance that the field switches to `Disabled` drops the text a designer typed into it (figma-standard rule 38), which a layer bound to the field's `Label` property, in the label's text style and tokens, avoids; a project that nests it, as Primer does, proves the text survives switching the field's `Disabled` before it publishes, and records the choice.

**Properties**
- [required] On a field: `Label` as a text property, `Show description` directly above `Description`, `Show error message` directly above `Error message` (figma-standard rules 5, 21 and 37). The asterisk is static text, exempt from a text property (figma-standard rule 37).
- [required] **The mark takes its code's props, named and valued as they are** (figma-standard rule 56), placed with the content axes before `Disabled` (figma-standard rules 1 and 2). Code has two: whether the field is required and how the mark shows. Spectrum's are `isRequired` and `necessityIndicator: 'icon' | 'label'`, so `Required` (`False`, `True`) and `Necessity indicator` (`Icon`, `Label`): `True` with `Icon` draws the asterisk, `True` with `Label` "(required)", `False` with `Label` "(optional)", `False` with `Icon` nothing ([Spectrum Label source](https://github.com/adobe/react-spectrum/blob/main/packages/@adobe/react-spectrum/src/label/Label.tsx)). Primer's are `required` on `FormControl` and a `requiredIndicator` boolean on its label, so `Required` and `Required indicator` ([Primer FormControlLabel source](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControlLabel.tsx)); a native build with `required` alone draws `Required` only. Neither shape lets a label be required and optional at once. No kit read maps the mark: Primer's `FormControl.Label` connects only its text ([Primer FormControl.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.figma.tsx)), and SDS's and Carbon's field mappings read no required prop ([SDS InputField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/InputField.figma.ts), [Carbon TextInput.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextInput/TextInput.figma.ts)).

**Variants and states**
- [required] The `Label` component has the mark's properties and no state axis: no `State`, since it takes no focus of its own, and no `Disabled`, since a nested label is exposed on the field and its axis would show there as a toggle a designer could set apart from the field's (figma-standard rules 7 and 35).
- [required] A field owns its label's state: its own `Disabled=True` dims the label and the description, and a designer never sets them apart (figma-standard rule 7).
- [moderate] No error variant on the label; error lives on the field's `Validation` axis and its message ([Label: *How*](#label)).

**Tokens**
- [required] The label takes a text-role token and a text style; the disabled label takes the disabled text token; every gap binds a spacing variable (figma-standard rules 28, 29 and 48).
- [required] The label and the description meet the contrast floor at rest; disabled text is exempt (figma-standard rule 32).
- [required] Component tokens, where the project has them, are `Component/Label/<Element>/<property>[-<variant>]`, aliasing semantic ones (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above; the snapshot's contract lists `Required` and the indicator property, so a value with no code counterpart shows in the parity report.
- *Judgement*: does a field keep the label text a designer typed after switching `Disabled` on and off?

**Sources.** Primer, SDS and Carbon Code Connect files as linked; Spectrum and Primer source for the mark's props; the toolkit's research article [naming inside Figma components](../../../research/components-and-naming/naming-inside-figma-components.md) for why text in a nested instance is lost on its variant switch.

## Alignment with code

**Structure**
- [strong] Code ships the label as its own component, which each field composes: SDS `Label` over React Aria's ([SDS Fieldset.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Fieldset/Fieldset.tsx)), React Aria `Label` ([React Aria Label.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Label.tsx)), Primer `FormControl.Label` over an internal `InputLabel`, MUI `FormLabel`, and Carbon's inputs rendering their own `labelText`. The Figma `Label` component mirrors the first four; the field's label layer mirrors Carbon's and SDS's field props.
- [strong] The hint is a separate component or slot in the same libraries (`Description`, `FormControl.Caption`, `FormHelperText`, `helperText`), which the field's `Description` layer mirrors.

**Mapping**
- [required] Each Figma property maps to one attribute or prop, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Label` | the `label` element's text (`label`, `labelText`, `children`) |
  | `Required` | `required` on the control (`isRequired` in Spectrum); the asterisk rendered from it, `aria-hidden` |
  | `Necessity indicator` or `Required indicator` | the mark prop as the code names it: Spectrum `necessityIndicator` (`icon`, `label`, where `label` with no `isRequired` renders "(optional)"), Primer `requiredIndicator` |
  | `Disabled=True` | `disabled` on the control, read by the field host |
  | `Show description`, `Description` | the hint element, its `id` first in `aria-describedby` |

**States**
- [required] The browser sets nothing on a `label`: its disabled look comes from the control it names (`:disabled`, read through `:has()`), and its required mark from `required`. A prop sets the rest.
- [moderate] Libraries pass the field's state down by context: Primer's `FormControl` hands `disabled` and `required` to its label ([Primer FormControlLabel source](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControlLabel.tsx)), MUI's `FormLabel` reads them from `FormControl`, SDS styles from `[data-disabled]`; a native build reads them from the markup.

**Differences**
- [required] None for the mark where the label takes its code's two props (figma-standard rule 56); a single three-value axis over `required` and the mark prop is a departure its Code Connect has to split ([In Figma](#in-figma)).
- [moderate] The field draws its label as a layer, not as the nested `Label` component that code composes, because of how Figma stores nested text ([In Figma](#in-figma)).

**Check**
- *Script*: the component contract lists the label's axes beside the code's props; a `Required` value with no matching `required` in the story is a finding (design-code-parity).
- *Judgement*: does every label in code come from the same definition as its field's `required`?

**Sources.** SDS, React Aria, Primer, MUI and Carbon source as linked.

## In code

**Element**
- [required] A native `label` tied by `for`, holding the words and the mark, the hint a sibling element with an `id` (code-standard rule 8, code-standard rule 15). Primer renders a `legend` or `span` through `as` when the label names a group or a non-labellable element ([Primer InputLabel source](https://github.com/primer/react/blob/main/packages/react/src/internal/components/InputLabel.tsx)); React Aria through `elementType`.

**Props**
- [strong] The text, the control it names (`htmlFor`), whether it is required, whether it is visually hidden, and the disabled state from its field: Primer (`requiredText`, `requiredIndicator`, `visuallyHidden`), Carbon (`labelText`, `hideLabel`), MUI (`required`, `disabled`, `error`) and Spectrum (`isRequired`, `necessityIndicator`) share this shape.

**Check**
- *Script*: the parity loop compares the label's text style, colour and gap at rest and disabled with the frames (design-code-parity).
- *Judgement*: is the asterisk out of the accessible name and the word "optional" in it?

**Sources.** Primer, Carbon, MUI and Spectrum source as linked.
