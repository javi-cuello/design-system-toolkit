# Feedback message

A feedback message is the short line on one form field that says what is wrong with its value, and where a system has them, that the value carries a warning, has been accepted or needs a note. Libraries call it `FieldError` (SDS, React Aria), `FormControl.Validation` (Primer), `FormHelperText` in its error form (MUI), `invalidText` and `warnText` (Carbon), or an error message (GOV.UK, Atlassian). This page owns the message as a component, in design, in Figma and in code: its types, its icon, its place beside the hint, and how it reaches a screen reader. What spans the form stays in [`../patterns/forms.md`](../patterns/forms.md): what the message says and where it sits ([*Error messages and the error summary*](../patterns/forms.md#error-messages-and-the-error-summary)) and when it appears ([*Validation timing*](../patterns/forms.md#validation-timing)); a message about a region rather than a field is [feedback: *Inline messages*](../patterns/feedback.md#inline-messages) and the [alert](alert.md). Related: [label](label.md), [checkbox](checkbox.md), [select](select.md).

## Overview

**Use when / don't use**
- [strong] Use on a field whose value failed validation, worded as the fix ("Enter your email address"); the wording is [content: *Error messages*](../design/content.md#error-messages).
- [moderate] Use the warning, success or info form only where the product's code has it: Carbon's `warn` and `warnText`, Primer's `FormControl.Validation` `variant` of `error` or `success`, Atlassian's `ValidMessage` ([Carbon TextInput.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextInput/TextInput.figma.ts), [Primer FormControl.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.figma.tsx), [Atlassian form messages](https://unpkg.com/@atlaskit/form@18.3.3/dist/esm/messages.js)).
- [moderate] Don't use for a message about a whole form, page or region; that is the error summary or an [alert](alert.md) ([feedback: *Inline messages*](../patterns/feedback.md#inline-messages)).
- [weak] Don't use for help that is always true of the field; that is the hint ([label: *Hint*](label.md#hint)).

**Anatomy**
- [contested] **An icon, then the text.** Primer's validation leads with `AlertFillIcon` for error and `CheckCircleFillIcon` for success ([Primer InputValidation source](https://github.com/primer/react/blob/main/packages/react/src/internal/components/InputValidation.tsx)) and Atlassian with its error and success status icons ([Atlassian form messages](https://unpkg.com/@atlaskit/form@18.3.3/dist/esm/messages.js)); Carbon puts its `WarningFilled` icon inside the input, not in the message ([Carbon useNormalizedInputProps](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/internal/useNormalizedInputProps.tsx)); SDS, MUI and GOV.UK draw text alone ([SDS fieldset.css](https://github.com/figma/sds/blob/main/src/ui/primitives/Fieldset/fieldset.css), [MUI FormHelperText source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/FormHelperText/FormHelperText.js), [GOV.UK error message template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/error-message/template.njk)). Every item on this page that names the icon (the types, its place, its layers, tokens and mapping) applies where the project takes the icon side; WCAG 1.4.1 asks for a visible cue besides colour: the icon is one, GOV.UK's thick border or a visible "Error:" another; the hidden type word serves screen readers only.
- [strong] A visually hidden word naming the type before the text ("Error:"), so a screen reader hears what kind of message it is: GOV.UK prefixes it by default ([GOV.UK error message template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/error-message/template.njk)), and [forms](../patterns/forms.md#error-messages-and-the-error-summary) builds it.

## Feedback message

**Use when / don't use**
- [required] Use one message per field in error, in text, tied to the field (WCAG 3.3.1); colour, a border or an icon alone never carries it (WCAG 1.4.1).

**How**
- [moderate] **Types.** `Error` always; `Warning`, `Success` and `Info` only as the code supports them (Overview). Each type has its own icon and its own colour, and the text says what to do.
- [weak] **The icon is decorative and fixed by type.** Primer wraps it in `aria-hidden="true"` and gives the `id` to the text alone, so `aria-describedby` reads only the words ([Primer InputValidation source](https://github.com/primer/react/blob/main/packages/react/src/internal/components/InputValidation.tsx)); the hidden "Error:" prefix carries the type to a screen reader. Atlassian labels its icons ("error", "success") instead, which reads the type twice where a prefix is also present ([Atlassian form messages](https://unpkg.com/@atlaskit/form@18.3.3/dist/esm/messages.js)). Primer alone, with Atlassian doing the opposite.
- [moderate] **The icon sits on the first line.** Primer sizes the icon's box to the text's line height, so a two-line message keeps its icon beside the first line ([Primer InputValidation source](https://github.com/primer/react/blob/main/packages/react/src/internal/components/InputValidation.tsx)).
- [required] **Wraps, never truncates.** A message cut at one line loses the fix (WCAG 1.4.10, 1.4.12; figma-standard rule 33).
- [contested] **Beside the hint, or in its place.** Carbon shows the message instead of the helper text and MUI uses one `FormHelperText` for both ([Carbon TextInput source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/TextInput.tsx)); SDS, Primer and GOV.UK show both ([label: *Hint*](label.md#hint)). Which side of the field it sits on is [forms](../patterns/forms.md#error-messages-and-the-error-summary)'s contested item.
- [required] **The layout holds.** The control never moves while the person uses it: a message above the field appears on submit ([forms: *Validation timing*](../patterns/forms.md#validation-timing)), or its line is reserved ([feedback: *Inline messages*](../patterns/feedback.md#inline-messages)). MUI reserves it with a `helperText` of one space, which it renders as a zero-width space ([MUI FormHelperText source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/FormHelperText/FormHelperText.js)).
- [moderate] **No message on a disabled field.** Carbon drops `invalid` and `warn` when `disabled` or `readOnly` is set ([Carbon useNormalizedInputProps](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/internal/useNormalizedInputProps.tsx)), and a disabled control is barred from constraint validation, as the [checkbox](checkbox.md#alignment-with-code) page sets out.

**Cases**
- A field in error shows a red border and a red line of text that reads like the hint → add a visible cue besides colour (the icon, where the project takes that side) and the hidden "Error:"; a person who cannot see red sees two hints.
- A success tick appears under every valid field as the person tabs → keep `Success` for a value the system checked (a username available), not for every field filled; a column of ticks is noise.
- A message appears while the person types and pushes the field down → show it on submit, or reserve the line.

**Accessibility**
- [required] 3.3.1 Error Identification (in text), 3.3.3 Error Suggestion, 1.4.1 Use of Color (icon and text, not colour), 1.4.3 for the text and 1.4.11 for the icon against the surface.
- [required] Implementation: code-standard rule 15 (the message is a description of the field), code-standard rule 17 (an empty message stays hidden). In Figma: figma-standard rule 31 (the error variant draws differently) and figma-standard rule 32 (contrast).

**Build**
- [required] An element with an `id` after the hint's in the control's `aria-describedby`, starting with a visually hidden type word, and the control takes `aria-invalid="true"` ([forms: *Error messages and the error summary*](../patterns/forms.md#error-messages-and-the-error-summary); code-standard rule 15). The hint-first order comes from GOV.UK alone ([GOV.UK input template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/input/template.njk)); Primer lists the validation `id` before the caption's (`[validationMessageId, captionId]`, [Primer FormControl source](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.tsx)), so the order itself is weak.
- [weak] The icon is an inline SVG with `aria-hidden="true"`, outside the element the `id` names, as Primer wraps it ([Primer InputValidation source](https://github.com/primer/react/blob/main/packages/react/src/internal/components/InputValidation.tsx)).
- [required] Style the error from `[aria-invalid="true"]` or `:user-invalid`, never a class (code-standard rule 6, code-standard rule 9); the markup and cases are [HTML semantics: *Form errors and validation*](../../code/html-semantics.md#form-errors-and-validation).
- [moderate] Render it only while there is a message: React Aria's `FieldError` returns nothing unless the field is invalid ([React Aria FieldError.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/FieldError.tsx)), and a server render writes it only for a failed field (code-standard rule 20).

**Check**
- *Script:* could check that every `aria-invalid="true"` control names a message in its `aria-describedby`, that the message has text and a hidden type word, and that its icon is `aria-hidden`.
- *Judgement:* Can a person who cannot see colour tell the message from the hint?

**Sources:** Primer, Atlassian, Carbon, SDS, MUI, React Aria and GOV.UK as linked. They split on the icon (Primer and Atlassian in the message, Carbon in the field, the rest none) and on keeping the hint.

## Announcing the message

**Use when / don't use**
- [required] The message reaches a screen reader as a description of its field, read when the field takes focus (code-standard rule 15).

**How**
- [contested] **`aria-describedby` or `aria-errormessage`.** WAI-ARIA defines `aria-errormessage` for this, used only with `aria-invalid` ([WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/#aria-errormessage): "Authors MUST use aria-invalid in conjunction with aria-errormessage"), and Carbon uses it ([Carbon TextInput util](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/util.ts)). React Aria uses `aria-describedby` "because aria-errormessage is unsupported using VoiceOver or NVDA" ([React Aria useField](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/label/useField.ts); [the 2020 comment](https://github.com/adobe/react-spectrum/issues/1346#issuecomment-740136268), old enough to recheck), as do Primer ([Primer FormControl source](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.tsx)) and GOV.UK ([GOV.UK input template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/input/template.njk)). code-standard rule 15 associates a description with `aria-describedby`, which every reader announces; `aria-invalid="true"` goes beside it.
- [contested] **A live region, or none.** Atlassian wraps its messages in `aria-live="polite"`, and its `MessageWrapper` must be in the page before the message so the reader registers it ([Atlassian form messages](https://unpkg.com/@atlaskit/form@18.3.3/dist/esm/messages.js)); React Aria's `FieldError`, Primer's validation and GOV.UK's message carry none (sources above). A live region on each message hurts on submit, where every failed field speaks at once while focus moves to the error summary, and on validation as the person types, where it speaks at each key; and one mounted with its text announces nothing ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)). With none on the message, the summary takes focus on submit, and the description is read on return to the field. A form that validates on leaving a field and must announce it uses one polite status line for the form, present from load, not one per message.

**Cases**
- Ten field messages each carry `aria-live="assertive"` and a submit fails → the reader speaks ten messages over the summary; remove the live regions and let the summary take focus.
- `aria-errormessage` alone on a field, and a VoiceOver user hears no error → add the message's `id` to `aria-describedby`, as React Aria does.

**Accessibility**
- [required] 4.1.2 Name, Role, Value (`aria-invalid` exposes the state), 3.3.1, and 4.1.3 Status Messages where a message appears without focus moving and the person must know at once.

**Build**
- [required] `aria-describedby="email-hint email-error"` and `aria-invalid="true"` on the control while it fails; both removed when it passes, and the message with them ([forms: *Error messages and the error summary*](../patterns/forms.md#error-messages-and-the-error-summary)).
- [weak] Where a project adds `aria-errormessage`, it points at the same `id` and keeps `aria-describedby` too; test it with the readers the product supports for a double reading ([Adrian Roselli: Exposing field errors](https://adrianroselli.com/2023/04/exposing-field-errors.html)).

**Check**
- *Script:* could flag `aria-errormessage` with no `aria-invalid="true"`, a message element with `aria-live` or `role="alert"` inside a field, and a message `id` missing from `aria-describedby`.
- *Judgement:* With a screen reader, submit a form with three errors: is each heard once, from the summary and then on its field?

**Sources:** WAI-ARIA 1.2; React Aria, Carbon, Primer, GOV.UK and Atlassian as linked. The 2020 support note is dated; a project that relies on `aria-errormessage` checks current reader support first.

## In Figma

**Layers**
- [required] Auto layout, horizontal: `Icon` then `Text`, the icon top-aligned to the first line and the text hugging vertically and filling the width (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant: `Icon`, `Text`; inside a field the message's layer is `Error message`, as the [checkbox](checkbox.md#in-figma) and [select](select.md#in-figma) pages name it (figma-standard rule 10).
- [required] The icon leads in auto-layout order, so a right-to-left page mirrors it where the project mirrors; a status icon does not mirror (figma-standard rule 50).
- [contested] **Its own component, or a layer in each field.** Primer's kit draws `FormControl.Validation` and `InlineMessage` as components of their own ([Primer FormControl.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.figma.tsx), [Primer InlineMessage.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/InlineMessage/InlineMessage.figma.tsx)); SDS's and Carbon's kits draw the error text as a layer of each field, read through its `Error` or `Error text` property when `State=Error` ([SDS InputField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/InputField.figma.ts), [Carbon TextInput.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextInput/TextInput.figma.ts)). A nested instance whose type the field switches drops its typed text (figma-standard rule 38), which a layer bound to the field's `Error message`, in the message's style and tokens, avoids. A project that nests it proves the text survives switching the field's `Validation`, and records the choice.

**Properties**
- [required] `Text` is a text property (figma-standard rule 37).
- [required] On a field: `Show error message` directly above `Error message` (figma-standard rules 5 and 21), with the field's `Validation` axis choosing the look.

**Variants and states**
- [moderate] One axis for the type, named in the project's token words (figma-standard rule 22): `Feedback` with `Error`, then `Warning`, `Success` and `Info` as the code has them (figma-standard rule 1 places a `Feedback` axis after `Size`). Primer names it `variant` ([Primer InlineMessage.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/InlineMessage/InlineMessage.figma.tsx)).
- [moderate] `Size` only where the code has one: Primer's `InlineMessage` has `small` and `medium`, and the small one takes a filled 12px icon ([Primer InlineMessage source](https://github.com/primer/react/blob/main/packages/react/src/InlineMessage/InlineMessage.tsx)); figma-standard rule 6 names the values.
- [moderate] No `State` and no `Disabled` axis: the message takes no focus, and a disabled field shows none ([Feedback message: *How*](#feedback-message)).
- [required] The field owns the message's type: the field's `Validation=Error` shows its `Error` look, and a designer never sets them apart (figma-standard rule 7).

**Tokens**
- [required] The text binds the type's text-role token (`Text/Feedback/Danger/…` or the project's words), the icon its icon token, the gap a spacing variable (figma-standard rules 22, 28 and 29).
- [required] The text meets 4.5:1 and the icon 3:1 against the surface, in every mode (figma-standard rule 32; WCAG 1.4.11 for the icon).
- [required] Component tokens, where the project has them, are `Component/Feedback message/<Element>/<property>[-<variant>]`, aliasing semantic ones (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above; the snapshot's contract lists `Feedback`, so a type the code lacks shows in the parity report.
- *Judgement*: does each type differ from the others by its icon as well as its colour?

**Sources.** Primer, SDS and Carbon Code Connect files as linked; the toolkit's research article [naming inside Figma components](../../../research/components-and-naming/naming-inside-figma-components.md) for nested text on a variant switch.

## Alignment with code

**Structure**
- [strong] Code ships the message as its own component, which the field composes: SDS `FieldError` over React Aria's ([SDS Fieldset.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Fieldset/Fieldset.tsx), [React Aria FieldError.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/FieldError.tsx)), Primer `FormControl.Validation` over an internal `InputValidation`, MUI `FormHelperText`, Atlassian `ErrorMessage`, `ValidMessage` and `HelperMessage`. Carbon builds it inside each input from `invalidText` and `warnText`. The Figma `Feedback message` mirrors the first group; the field's `Error message` layer mirrors Carbon's and SDS's field props.
- [moderate] A general inline message beside the field one is a separate component where the code has one: Primer's `InlineMessage` (`critical`, `warning`, `success`, `unavailable`) beside `FormControl.Validation` (`error`, `success`) ([Primer InlineMessage source](https://github.com/primer/react/blob/main/packages/react/src/InlineMessage/InlineMessage.tsx)). A project with one inline message in code draws one component.

**Mapping**
- [required] Each Figma property maps to one attribute or prop, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Feedback=Error` | the field's `aria-invalid="true"`; the message is `FieldError`, `variant="error"`, `invalidText` or `error` |
  | `Feedback=Warning` | `warn` and `warnText` (Carbon), `variant="warning"` (Primer `InlineMessage`); no `aria-invalid` |
  | `Feedback=Success` | `variant="success"` (Primer), `ValidMessage` (Atlassian); no `aria-invalid` |
  | `Text` | the message's children, its `id` in `aria-describedby` after the hint's |
  | `Icon` | rendered from the type, `aria-hidden="true"` |
  | the field's `Show error message` | the message rendered or not |

**States**
- [required] The browser sets `:user-invalid` on the control once the person has interacted or submitted, and a stylesheet may show the message from it; every other type is set by a prop, since no pseudo-class means warning or success.
- [required] Code cannot reach a message on a disabled field: a disabled control is barred from constraint validation, and Carbon drops `invalid` and `warn` under `disabled` ([Carbon useNormalizedInputProps](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/internal/useNormalizedInputProps.tsx)). So Figma draws none.
- [moderate] Carbon lets only one of `invalid` and `warn` hold, `invalid` winning (same source); the one `Feedback` axis draws the same.

**Differences**
- [moderate] Where the project takes the icon side, the icon is in the message, where Carbon's code puts it inside the input; a project on Carbon draws the icon in the field and the message as text, and records that.
- [weak] The field draws the message as a layer, not the nested component code composes, for the reason in [In Figma](#in-figma).
- [moderate] The text property is `Error message`, after SDS's `errorMessage` prop; Primer's is the `Validation` slot's children and Carbon's `invalidText`. The mapping row is where a project's names meet its kit's (figma-standard rule 21).

**Check**
- *Script*: the component contract lists `Feedback`'s values beside the code's types; a type drawn with no prop, or a prop with no frame and no line under *Differences*, is a finding (design-code-parity).
- *Judgement*: does each field in error in code name its message in `aria-describedby`, as the Figma frame shows it?

**Sources.** SDS, React Aria, Primer, MUI, Atlassian and Carbon source as linked.

## In code

**Element**
- [required] A `p` or `span` with an `id`, after the hint, holding a visually hidden type word, an `aria-hidden` icon and the text, named in the control's `aria-describedby` (code-standard rule 15). GOV.UK renders a `p` ([GOV.UK error message template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/error-message/template.njk)), MUI a `p` ([MUI FormHelperText source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/FormHelperText/FormHelperText.js)), React Aria a `span` unless told otherwise ([React Aria FieldError.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/FieldError.tsx)).

**Props**
- [strong] The text and the type: React Aria `children` or the field's `validationErrors`; Primer `variant` (`error`, `success`); Carbon `invalid` with `invalidText` and `warn` with `warnText`; MUI `error`; Primer's `InlineMessage` `variant` and `size`. The field passes its `id` and state down, so the message never names its control by hand.

**Check**
- *Script*: the parity loop compares each type's icon, colour and gap with its frame (design-code-parity).
- *Judgement*: does a server render write the message for a failed field with no script?

**Sources.** GOV.UK, MUI, React Aria, Primer and Carbon source as linked.
