# Text area

A text area takes free text longer than one line: a description, a message, a reason. This page owns the text area as a component, in design, in Figma and in code: its height and resizing, auto-grow, the character count, and its states. Everything it shares with the one-line field (the bare control and the field around it, read-only and disabled, placeholder text, the `Has value` and `Validation` axes) is the [text input](text-input.md)'s, and this page names only where it differs. What spans form fields stays in [`../patterns/forms.md`](../patterns/forms.md): [labels](../patterns/forms.md#labels), [hint text](../patterns/forms.md#help-and-hint-text), [validation timing](../patterns/forms.md#validation-timing) and [error messages](../patterns/forms.md#error-messages-and-the-error-summary). Related: [text input](text-input.md).

## Overview

**Use when / don't use**
- [strong] A text area when the answer may run past one line; a short answer is a [text input](text-input.md) ([GOV.UK textarea](https://design-system.service.gov.uk/components/textarea/): "Use the textarea component when you need to let users enter an amount of text that's longer than a single line").
- [strong] A component of its own, not a mode of the text input: the element changes (`textarea`, not `input`), and so do Enter, which makes a new line, and the height. SDS ships `Textarea` and `TextareaField` ([SDS Textarea.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Textarea/Textarea.tsx)), Primer `Textarea` ([Primer Textarea source](https://github.com/primer/react/blob/main/packages/react/src/Textarea/Textarea.tsx)), Carbon `TextArea` ([Carbon TextArea source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextArea/TextArea.tsx)) and React Aria `TextArea` ([React Aria TextArea.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/TextArea.tsx)); MUI alone folds it into `TextField` with `multiline` ([MUI TextField types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/TextField/TextField.d.ts)). The split test is the toolkit's research on [when to split or merge a component](../../../research/components-and-naming/when-to-split-or-merge-a-component.md).

**Anatomy**
- [strong] The text input's anatomy without icons or affixes: label, hint, the multi-line field, an optional character count under it, and the error message. SDS names `Label`, `Value`, `Description` and `Error` ([SDS TextareaField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/TextareaField.figma.ts)); Carbon adds `Show count` to `Label text`, `Helper text` and `Error text` ([Carbon TextArea.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextArea/TextArea.figma.ts)).
- [required] A resize handle at the bottom inline-end corner where the field resizes; the browser renders it, so the frame draws it (figma-standard rule 51).
- [required] A focus ring on the field (WCAG 2.4.7; figma-standard rule 39) and a border at 3:1 against its surface (WCAG 1.4.11).

## Height and resizing

**Use when / don't use**
- [strong] The height says how much is expected: "Make the height of a textarea proportional to the amount of text you expect users to enter" ([GOV.UK textarea](https://design-system.service.gov.uk/components/textarea/)). A one-word reason gets two or three rows, a cover letter ten.
- [contested] **Fixed rows or auto-grow.** GOV.UK, Carbon and Primer set a fixed `rows` (GOV.UK's template defaults to 5, [GOV.UK textarea template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/textarea/template.njk); Carbon 4; Primer 7, sources above) and let the person resize; MUI's `multiline` grows between `minRows` and `maxRows` through its `TextareaAutosize` ([MUI InputBase types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/InputBase/InputBase.d.ts)).

**How**
- [weak] **Resize vertically** only: a horizontal resize pushes the column wider. SDS resizes vertically and turns resizing off when disabled ([SDS textarea.css](https://github.com/figma/sds/blob/main/src/ui/primitives/Textarea/textarea.css)); Primer defaults to `both` and takes `resize` as a prop (source above).
- [moderate] **Auto-grow** starts at its minimum rows and stops at a maximum, then scrolls inside; it never grows past the viewport (MUI's `minRows` and `maxRows`, above; [MDN `field-sizing`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/field-sizing): a textarea grows in height "When a height constraint is then reached, they will then start to show a scrollbar").
- [weak] **Width** is the column's, capped at a readable measure; the text area is free text ([forms: field widths](../patterns/forms.md#field-widths)).

**Cases**
- A "Reason for leaving" text area of one row → three or more rows; one row reads as a text input and invites one word.
- A comment box that grows without limit pushes the submit button off screen → cap it at about ten rows and scroll inside.
- A text area resizable in both directions breaks the form's column → `resize: vertical`.

**Accessibility**
- [required] 1.4.4 and 1.4.10: the height is set in rows or `lh`, so it follows the text size, and the field never forces horizontal scrolling at 320 CSS pixels. 2.1.1: the content is reachable by keyboard when it scrolls inside.
- [required] Implementation: code-standard rule 54 (lengths in rem or relative units), code-standard rule 8 (the native `textarea`).

**Build**
- [required] A native `textarea` with `rows` for its height, never a fixed pixel `height` (code-standard rules 8 and 54).
- [weak] `resize: vertical` in the component's stylesheet, `resize: none` under `:disabled`.
- [moderate] Auto-grow is `field-sizing: content` with a `min-block-size` and `max-block-size` in `lh` units, where the project's browsers support it: MDN marks it "Baseline 2026, Newly available. Since June 2026" (above), so older browsers keep the `rows` height and the field still works. A script measuring `scrollHeight`, as MUI's `TextareaAutosize` does, is the fallback where auto-grow must hold everywhere.

**Check**
- *Script:* could flag a `textarea` with a fixed pixel `height`, `resize: both` inside a form column, and an auto-grow field with no maximum.
- *Judgement:* does the height match the answer people are expected to write?

**Sources:** GOV.UK for proportional height; GOV.UK, Carbon, Primer and MUI for fixed and grown heights; MDN for `field-sizing`.

## Character count

**Use when / don't use**
- [moderate] A count only where a real limit applies: "Only use the character count component when there is a good reason for limiting the number of characters users can enter", and where a backend limit keeps stopping people, "try to increase the limit rather than use a character count" ([GOV.UK character count](https://design-system.service.gov.uk/components/character-count/)).
- [contested] **A soft limit or a hard one.** GOV.UK lets people type past the limit and tells them ("This component does not restrict the user from entering information", GOV.UK, above; its script removes `maxlength`, [GOV.UK character-count.mjs](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/character-count/character-count.mjs)); Primer's `characterLimit` does the same and turns the field to error when over ([Primer Textarea source](https://github.com/primer/react/blob/main/packages/react/src/Textarea/Textarea.tsx)). Carbon sets `maxLength` from `maxCount`, so typing stops at the limit, and in word mode trims the extra words ([Carbon TextArea source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextArea/TextArea.tsx)).

**How**
- [moderate] **State the limit up front** in the field's description: GOV.UK and Primer both write "You can enter up to N characters" into it, read with the field (GOV.UK's [character count template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/character-count/template.njk), Primer source above).
- [moderate] **Count down** under the field ("12 characters remaining", then "3 characters too many"), turning to the error style when over; the over-limit text is itself the error when the form is submitted.
- [weak] **Show it late** where most answers are well under the limit: GOV.UK's `threshold` shows the count only past a percentage of the limit (GOV.UK, above).
- [weak] **Words or characters** as the limit is really set: Carbon's `counterMode` and GOV.UK's `maxwords` count words (sources above).

**Cases**
- A 500-character field that cuts a pasted paragraph at 500 → let it overflow, show "48 characters too many", and leave the cut to the person.
- A count that announces every keystroke → announce after a pause, politely.
- A 2,000-character limit on a field people fill with a sentence → set a threshold, or drop the count.

**Accessibility**
- [required] 3.3.2: the limit is an instruction given before typing. 4.1.3: the changing count is a status message, read without moving focus. 3.3.1: going over is described in text, not colour alone.
- [contested] **How the count is announced.** GOV.UK updates a polite live region once typing has paused for a second (`aria-live: polite` and a 1000 ms wait in its script, above); Primer sends the message to a shared status region after a delay (source above); Carbon writes it to a `role="alert"` with `aria-live="assertive"` on each change ([Carbon TextInput source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/TextInput.tsx)). The polite, debounced side is built in [accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages).
- [required] Implementation: code-standard rule 15 (the limit is a description), code-standard rule 20 (the server enforces the limit when script is off).

**Build**
- [required] The limit sentence is an element in the `textarea`'s `aria-describedby`; the visible count is `aria-hidden`, and, where the project takes the polite side, a separate polite status region, present from load, carries the announcement (code-standard rule 15; [accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).
- [required] The server checks the limit whatever the client does (code-standard rule 20); where the project takes the soft limit, a `maxlength` in the markup is removed by the script that adds the count, as GOV.UK's does, so the no-script path still has a limit.
- [required] Over the limit, the field takes `aria-invalid="true"` and the error style; Primer sets it from the same over-limit test (source above).

**Check**
- *Script:* could type past the limit and assert the text is kept, the field is marked invalid, and one polite announcement follows a pause.
- *Judgement:* is the limit real, and set where people write?

**Sources:** GOV.UK, Primer and Carbon source as linked; they split on hard limits and on announcement, settled above.

## In Figma

**Layers**
- [required] Auto layout throughout: `Label`, `Description`, `Error message`, the `Field` holding `Value` and the `Resize handle`, then `Count` under the field (the order shown is for a project that places the hint and the message above the field, a `contested` choice the project decides; see [forms: *Help and hint text*](../patterns/forms.md#help-and-hint-text) and [*Error messages*](../patterns/forms.md#error-messages-and-the-error-summary)); the field fills its container's width and `Value` wraps inside it (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant (figma-standard rule 10); the text input's names where the part is the same ([text input: *In Figma*](text-input.md#in-figma)).
- [required] The field's height is drawn at the rows the code defaults to, with the value wrapping and clipping inside it; `Value` is not hugged, since a fixed-rows field does not grow with its text (figma-standard rule 51).

**Properties**
- [required] `Label`, `Value`, `Placeholder`, `Description`, `Count` and `Error message` are text properties; `Show description` and `Show count` sit directly above what they reveal (figma-standard rules 5, 21 and 37).
- [strong] `Has value` and `Show label` as on the text input: SDS's `Value Type` and `Has Label` ([SDS TextareaField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/TextareaField.figma.ts)), Primer's `text type` and `label?` ([Primer Textarea.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Textarea/Textarea.figma.tsx)), Carbon's `Text filled` and `Show label` ([Carbon TextArea.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextArea/TextArea.figma.ts)).
- [required] `Show resize handle` only where the project's code lets some text areas resize and not others; otherwise the handle is drawn always or never, as the code renders it (figma-standard rule 51).

**Variants and states**
- [required] The text input's axes and order, `Has value → Validation → Disabled → State` (`Read-only` a `State` value where the code has it), without `Size` unless the code has one; `Disabled` pairs only with Rest, and with Focus too where the code keeps it focusable (figma-standard rules 1 to 3; [text input: *In Figma*](text-input.md#in-figma)).
- [weak] Over the limit is `Validation=Error` with the count in the error style, not a value of its own: Primer turns over-limit into its error status (source above).
- [weak] No `Size` axis by default: none of SDS, Primer, Carbon or React Aria gives its text area a size prop (sources above); rows set its height in code.

**Tokens**
- [required] Every fill, stroke, radius, gap and padding binds a semantic variable; text takes text-role tokens (figma-standard rules 24, 28 and 29); the count's error colour is the error text token.
- [required] Placeholder and count text meet the contrast floor (figma-standard rule 32); a state variant binds its own state's tokens (figma-standard rule 48); component tokens are `Component/Text area/<Element>/<property>[-<variant>][-<state>]` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above; the contract lists `Has value`, `Validation`, `Disabled`, `Show count` and any `State=Read-only` for the parity report.
- *Judgement*: does the drawn height match the rows the code sets?

**Sources.** SDS, Primer and Carbon Code Connect files for the kit's properties; the text input page for the shared axes.

## Alignment with code

**Structure**
- [contested] **Bare control and field**, as on the text input: SDS splits `Textarea` from `TextareaField`; React Aria's `TextField` hosts a `TextArea` child as it hosts an `Input` ([React Aria TextField.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/TextField.tsx)); Primer's `Textarea` goes inside `FormControl`; Carbon's `TextArea` is always the field, bare through `hideLabel`; MUI's is `TextField multiline` (sources above). Every kit read draws one set with a label boolean, so one `Text area` set with `Show label` follows them ([text input: *Alignment with code*](text-input.md#alignment-with-code) for why).
- [strong] A text area is a separate code component from the text input everywhere but MUI ([Overview](#overview)), so it is a separate Figma set, mirroring the code one to one.

**Mapping**
- [required] The text input's mapping holds, with these rows added or changed (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | the field's drawn height | `rows`: GOV.UK `rows`, Carbon `rows`, Primer `rows`, MUI `minRows` and `maxRows` |
  | `Show resize handle` | `resize: vertical`; Primer `resize`, SDS `isResizable` |
  | `Show count`, `Count` | Primer `characterLimit`; Carbon `enableCounter` with `maxCount` and `counterMode`; GOV.UK's character count around the textarea |
  | `Validation=Error` over the limit | `aria-invalid="true"` from the over-limit test |

**States**
- [required] The browser sets hover, focus, `:placeholder-shown`, `:read-only` and `:user-invalid`, as on the text input; nothing native marks a soft limit passed, so the script sets `aria-invalid` and the error style from the count.
- [required] Code cannot reach Disabled with Error, nor Read-only with Error, through validation ([text input: *Alignment with code*](text-input.md#alignment-with-code)), and SDS drops resizing under disabled (`resize: none` on `[data-disabled]`, [SDS textarea.css](https://github.com/figma/sds/blob/main/src/ui/primitives/Textarea/textarea.css)).
- [moderate] An auto-grow field's height is a state the browser sets from the content; the set draws its minimum, and the parity loop compares at that height.

**Differences**
- [required] Carbon's `Warning` and skeleton, Primer's `contrast`, and MUI's variants (sources above) are drawn only where the project's code renders them (figma-standard rule 51).
- [required] `Disabled` and `Validation` are axes of their own where the kits put them in `State` (Code Connect files above; figma-standard rule 1); `Read-only` stays a `State` value, as there ([text input: *In Figma*](text-input.md#in-figma)).

**Check**
- *Script*: the component contract lists the set's axes beside the code's props; a `Show count` with no counter prop, or a drawn height that matches no `rows`, shows in the parity report (design-code-parity).
- *Judgement*: does the Code Connect file pass `rows` matching the frame?

**Sources.** SDS, React Aria, Primer, Carbon, MUI and GOV.UK source and Code Connect files as linked.

## In code

**Element**
- [required] A native `textarea` inside the wrapper, its `label` before it, the limit sentence, hint and message tied with `aria-describedby` (code-standard rules 8 and 15). Every library read renders one (sources above).

**Props**
- [strong] The text input's props without `type` or slots, plus `rows`, a resize choice and a limit. Primer (`rows`, `resize`, `minHeight`, `maxHeight`, `characterLimit`, `validationStatus`; [Primer Textarea source](https://github.com/primer/react/blob/main/packages/react/src/Textarea/Textarea.tsx)), Carbon (`rows`, `cols`, `enableCounter`, `maxCount`, `counterMode`, `invalid`, `readOnly`; [Carbon TextArea source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextArea/TextArea.tsx)) and MUI (`multiline`, `rows`, `minRows`, `maxRows`; [MUI TextField types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/TextField/TextField.d.ts)) share this shape.
- [weak] The limit is a number prop; whether it is soft is the component's behaviour, not a prop, and the project's wrapper picks the side ([character count](#character-count)).

**Check**
- *Script*: the parity loop compares each variant's field, border and ring with its frame at its default rows (design-code-parity).
- *Judgement*: is the count announced once per pause, and does the server enforce the limit?

**Sources.** Primer, Carbon, MUI, SDS, React Aria and GOV.UK source as linked; MDN for `field-sizing`.
