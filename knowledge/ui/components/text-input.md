# Text input

A text input takes one line of free text: a name, an email address, a reference, an amount. This page owns the text input as a component, in design, in Figma and in code: the bare input and the field around it, prefixes, suffixes and icons, the clear button, read-only and disabled, placeholder text, and its states. What spans form fields stays in [`../patterns/forms.md`](../patterns/forms.md): [labels](../patterns/forms.md#labels), [hint text](../patterns/forms.md#help-and-hint-text), [field widths](../patterns/forms.md#field-widths), [input types and autocomplete](../patterns/forms.md#input-types-and-autocomplete-attributes), [validation timing](../patterns/forms.md#validation-timing) and [error messages](../patterns/forms.md#error-messages-and-the-error-summary). Related: [text area](text-area.md), [search input](search-input.md), [combobox](combobox.md), [select](select.md).

## Overview

**Use when / don't use**
- [strong] A text input for an answer of one line; more than a line is a [text area](text-area.md), a choice from a known list is a [select](select.md) or a [combobox](combobox.md), and a search box is the [search input](search-input.md) ([GOV.UK textarea](https://design-system.service.gov.uk/components/textarea/): "Do not use the textarea component if you need to let users enter shorter answers no longer than a single line").
- [strong] One component for every `type` (`text`, `email`, `tel`, `url`, `password`): the type changes the keyboard and the autofill, not the component. Primer's `TextInput` and Carbon's `TextInput` take `type` as a prop ([Primer TextInput source](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.tsx), [Carbon TextInput source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/TextInput.tsx)), as MUI's `TextField` does ([MUI TextField types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/TextField/TextField.d.ts)). Which type fits is [forms: input types](../patterns/forms.md#input-types-and-autocomplete-attributes).

**Anatomy**
- [strong] A visible label, an optional hint, an error message when it fails, and the field holding the value or the placeholder (their order is a contested choice the project decides, in [forms](../patterns/forms.md#help-and-hint-text)); the field may hold a leading icon or prefix and a trailing icon, suffix or action. SDS names `Label`, `Value`, `Description` and `Error` ([SDS InputField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/InputField.figma.ts)); Carbon `Label text`, `Helper text`, `Error text` and a count ([Carbon TextInput.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextInput/TextInput.figma.ts)); Primer a `FormControl.Label`, `FormControl.Caption` and `Form.Validation` around the input ([Primer TextInput.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.figma.tsx)).
- [moderate] Where the error message sits relative to the field is one choice for the product, made in [forms: error messages](../patterns/forms.md#error-messages-and-the-error-summary); this page draws it the same way.
- [required] A focus ring on the field (WCAG 2.4.7; figma-standard rule 39), a field at least 24 pixels high (figma-standard rule 26), and a border at 3:1 against its surface (WCAG 1.4.11).

## Text input

**Use when / don't use**
- [strong] Use for a short free answer whose width is known or bounded: size it to the answer ([forms: field widths](../patterns/forms.md#field-widths)).
- [moderate] Don't use `type="number"` for identifiers or for a number someone could nudge by scrolling; use a text input with `inputmode` ([GOV.UK text input](https://design-system.service.gov.uk/components/text-input/): "Do not use `<input type="number">` unless your user research shows that there's a need for it").

**How**
- [strong] **Label and hint** outside the field, always visible ([forms: labels](../patterns/forms.md#labels), [hint text](../patterns/forms.md#help-and-hint-text)).
- [strong] **Width** from the expected answer: fixed-length answers fixed, free text the column's width ([forms: field widths](../patterns/forms.md#field-widths)).
- [moderate] **Sizes** match the controls the field sits beside, from a t-shirt scale: Primer has `small`, `medium` and `large`, Carbon `xs` to `lg`, MUI `small` and `medium` (sources in [In code](#in-code)). A form uses one size throughout.
- [weak] **States:** rest, hover, focus, filled, error, read-only and disabled, each drawn ([In Figma](#in-figma)).

**Cases**
- A postcode field as wide as the address line → size it for the postcode; the width tells the person what is expected.
- A form mixes small and medium fields in one column → one size; the size belongs to the density, not the field.

**Accessibility**
- [required] 1.3.1 and 3.3.2: a visible, associated label. 1.3.5: `autocomplete` on fields about the person. 1.4.11: the field's border at 3:1. 2.4.7: a visible focus indicator.
- [required] Implementation: code-standard rule 8 (the native `input` inside the wrapper), code-standard rule 15 (hint and error are descriptions), code-standard rule 16 (native controls follow the theme). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- [required] A native `input` with its `label` before it, the hint and error tied with `aria-describedby`, inside the component's wrapper (code-standard rule 8; [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [required] `type`, `inputmode`, `autocomplete` and `spellcheck` on the `input` itself ([forms: input types](../patterns/forms.md#input-types-and-autocomplete-attributes)).
- [required] The error is `aria-invalid="true"` on the `input`, styled from `:user-invalid` or the attribute, never `:invalid`, which matches on load ([HTML semantics: *Form errors and validation*](../../code/html-semantics.md#form-errors-and-validation)).

**Check**
- *Script:* could flag an `input` with no associated label, a `type="number"` on a field whose label names a code or reference, and a field with no `autocomplete` whose label names personal data.
- *Judgement:* does the width say how long the answer is?

**Sources:** GOV.UK for the cases against `number`; Primer, Carbon and MUI for the type prop and the sizes.

## Prefixes, suffixes and icons

**Use when / don't use**
- [moderate] A prefix or suffix for a unit or a fixed part the person should not type (`£`, `kg`, `https://`); GOV.UK's input takes `prefix` and `suffix` ([GOV.UK input template](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/input/template.njk)), MUI an `InputAdornment` at `start` or `end` ([MUI InputAdornment types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/InputAdornment/InputAdornment.d.ts)).
- [weak] A leading icon only where it names the field's kind at a glance (a magnifier, a calendar); an icon that only decorates every field is noise.
- [weak] A trailing action (clear, show password, copy) is a button inside the field; Primer gives it its own slot, `trailingAction`, filled with `TextInput.Action`, beside `leadingVisual` and `trailingVisual` ([Primer TextInput source](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.tsx)).

**How**
- [moderate] **The unit is in the label or hint as well.** GOV.UK: "Do not rely on prefixes or suffixes alone, because screen readers will not read them out", and "say so in the input label or hint text as well" ([GOV.UK text input](https://design-system.service.gov.uk/components/text-input/)); its template renders each affix `aria-hidden="true"` (template above).
- [weak] **Leading or trailing, never in the middle.** An icon sits first or last in the field's row; MUI's `InputAdornment` takes only `start` or `end` (component-validator rule MU5).
- [weak] **Clear button** appears only when the field has a value, is named ("Clear"), and puts focus back in the field. Most single-line fields do not need one; a search, a filter or a long pasted value does ([search input: clear and submit](search-input.md#clear-and-submit)).
- [required] **Every trailing action is named** and at least 24 pixels square (code-standard rule 18; figma-standard rule 26).

**Cases**
- A price field shows `£` as a prefix and its label says "Price" → "Price in pounds", or a hint; the prefix is hidden from screen readers.
- A password field's eye icon has no name → a `button` named "Show password", which changes to "Hide password" when pressed.
- An icon placed between a prefix and the value → move it to the start or end; code has no slot in the middle.

**Accessibility**
- [required] 1.3.1 and 3.3.2: the unit the prefix shows is in the label or hint. 4.1.2: a trailing action has a name and a role. 1.1.1: a decorative leading icon is hidden from assistive technology. 2.5.8: a trailing action is at least 24 by 24.
- [required] Implementation: code-standard rule 18 (icon-only buttons are named). In Figma: figma-standard rule 40 (an icon-only part carries its name), figma-standard rule 26.

**Build**
- [required] The `input` is a void element, so an icon cannot sit inside it: the wrapper holds the icon, the affixes and the action as siblings, and the `input`'s inline padding makes room for them (component-validator rule W2; [HTML: the input element](https://html.spec.whatwg.org/multipage/input.html#the-input-element)).
- [required] Prefix and suffix are `aria-hidden="true"` text beside the `input`, the unit restated in the label or hint, as GOV.UK renders them.
- [required] A trailing action is a `button type="button"` with an accessible name (code-standard rule 18); Primer's `TextInput.Action` renders a button for its `trailingAction` slot ([Primer TextInput source](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.tsx)).
- [weak] Logical properties place them, so leading and trailing swap in right-to-left ([i18n: logical properties and mirroring](../../code/i18n.md#logical-properties-and-mirroring)).

**Check**
- *Script:* could flag a prefix or suffix not hidden from assistive technology whose text is missing from the label and hint, and an unnamed button inside a field wrapper.
- *Judgement:* does each icon earn its place, or decorate?

**Sources:** GOV.UK and MUI for affixes, Primer for the trailing action; the toolkit's component-validator for where code places icons.

## Read-only and disabled

**Use when / don't use**
- [moderate] Read-only for a value the person must see, select and copy, but not change here (an account number, a computed total); it is focusable, submitted with the form, and takes no constraint validation ([MDN `readonly`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/readonly): "read-only controls can still function and are still focusable, whereas disabled controls cannot receive focus").
- [moderate] Disabled for a field that does not apply until something else changes; it is skipped by focus and not submitted (MDN, as above). Prefer hiding a field that never applies, and say why one is disabled.
- [weak] Don't show a read-only value as a field at all when it is never copied or submitted; plain text is clearer.

**How**
- [weak] **Read-only looks different from editable and from disabled:** no field border or a muted one, full-contrast text, since it is content to read. Carbon and Primer each draw a read-only frame of its own (their Code Connect files map `Read-only` and `read-only` to `readOnly`; [Carbon TextInput.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextInput/TextInput.figma.ts), [Primer TextInput.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.figma.tsx)).
- [required] **Disabled text** is exempt from the contrast minimum (WCAG 1.4.3 exempts inactive components), but read-only text is not: it carries content.

**Cases**
- A greyed-out "Account number" the person needs to copy → read-only; a disabled field cannot be focused and its value is not submitted.
- A disabled field in error → never; it cannot be corrected ([Alignment with code](#alignment-with-code)).

**Accessibility**
- [required] 1.4.3: read-only text meets contrast. 2.1.1: a read-only value is reachable by keyboard. 4.1.2: the state is exposed by the attribute.
- [required] Implementation: code-standard rules 9 and 62 (disabled is the control's own attribute).

**Build**
- [required] `readonly` and `disabled` on the `input`, never on the wrapper (code-standard rules 9 and 62); styled from `:read-only` and `:disabled` on the input, or `:has(> input:disabled)` on the wrapper.
- [required] A `readonly` field takes no `required`: "The `required` attribute is not permitted on inputs with the `readonly` attribute specified" (MDN, as above).

**Check**
- *Script:* could flag `readonly` with `required` on one input, and read-only text under the contrast floor.
- *Judgement:* must the person copy this value, or only read it?

**Sources:** MDN for the behaviour of the two attributes; Carbon and Primer for a drawn read-only frame.

## Placeholder text

**Use when / don't use**
- [strong] A placeholder never stands in for a label, a hint or a format: it "vanishes when the user starts typing" ([GOV.UK text input](https://design-system.service.gov.uk/components/text-input/)), "Screen readers don't announce placeholder content by default" ([MDN `placeholder`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/placeholder)), and "Disappearing placeholder text strains users' short-term memory" ([NN/g, Sherwin](https://www.nngroup.com/articles/form-design-placeholders/)).
- [contested] **Whether to use one at all.** GOV.UK's text input says not to use it "for hints or examples", and NN/g recommends labels outside the field and no placeholder in their place; MDN allows one "to show an example of the type of data that should be entered", and Carbon's search wants "useful and short text hinting at what the user can search for" ([search: the box](../patterns/search.md#the-box-visible-wide-and-labelled)).

**How**
- [weak] Where a placeholder is used, it is an example in the expected format, never an instruction the person needs after typing; whatever must stay goes in the hint ([content: labels, hints and placeholder text](../design/content.md#labels-hints-and-placeholder-text-in-forms)).
- [required] Placeholder text that carries information meets the contrast floor (figma-standard rule 32), which MDN notes placeholders are given lower contrast "by design" to miss.

**Cases**
- "Email" and "Password" shown only as placeholders → visible labels above; after typing nobody can tell which is which.
- A date field's placeholder "DD/MM/YYYY" → move the format to the hint; it disappears at the first keystroke.
- A placeholder that looks like a value ("John Smith") → the person skips the field thinking it is filled (NN/g); remove it.

**Accessibility**
- [required] 3.3.2: the label is not the placeholder. 1.4.3: placeholder text that carries information meets contrast. 2.5.3: the visible label is in the accessible name.
- [required] Implementation: code-standard rule 15 (a hint is a description, never a placeholder). In Figma: figma-standard rule 32.

**Build**
- [required] The name comes from the `label`, never from `placeholder` alone ([accessibility: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions)); Carbon also writes `title` from its `placeholder` ([Carbon TextInput source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/TextInput.tsx)), which is no substitute for a label either.
- [moderate] An empty field is styled from `:placeholder-shown` only where a placeholder exists; otherwise from the value, so the filled style does not depend on one: the pseudo-class matches an `input` or `textarea` "currently displaying placeholder text" ([MDN `:placeholder-shown`](https://developer.mozilla.org/en-US/docs/Web/CSS/:placeholder-shown)).

**Check**
- *Script:* could flag an `input` or `textarea` whose only name comes from `placeholder`, and a placeholder under the contrast floor.
- *Judgement:* is anything in the placeholder needed after the first keystroke?

**Sources:** GOV.UK, MDN and NN/g agree on the label; they differ on examples, settled above.

## In Figma

**Layers**
- [required] Auto layout throughout: `Label`, `Description`, `Error message`, then the `Field` row holding `Leading icon`, `Prefix`, `Value`, `Suffix`, `Trailing icon` and `Trailing action` in that order (the order shown is for a project that places the hint and the message above the field, a `contested` choice the project decides; see [forms: *Help and hint text*](../patterns/forms.md#help-and-hint-text) and [*Error messages*](../patterns/forms.md#error-messages-and-the-error-summary)); `Value` fills the row and the field fills its container (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant; `Value` keeps one name whether it shows the value or the placeholder (figma-standard rule 10).
- [required] Leading parts lead and trailing parts trail in auto-layout order, never pinned by position, so a right-to-left page mirrors them where the project mirrors (figma-standard rule 50); an icon is first or last in the row, never between an affix and the value (component-validator rules W2 and MU5).

**Properties**
- [required] `Label`, `Value`, `Placeholder`, `Description`, `Prefix`, `Suffix` and `Error message` are text properties in the code's words (figma-standard rules 21 and 37); each optional part has its `Show …` boolean directly above it (`Show description`, `Show prefix`, `Show leading icon`), and each icon is an instance swap (figma-standard rule 5).
- [strong] Whether the field holds a value is `Has value`: `False` shows `Placeholder` in the placeholder colour, `True` shows `Value`. SDS draws it as `Value Type` (`Default`, `Placeholder`), Carbon as `Text filled`, Primer's text area as `text type` (`Value`, `Placeholder`) ([SDS InputField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/InputField.figma.ts), [Carbon TextInput.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextInput/TextInput.figma.ts), [Primer Textarea.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Textarea/Textarea.figma.tsx)); figma-standard rule 21 names it `Has` for content the component holds.
- [strong] `Show label` turns the label off for a field labelled by its surroundings (a table cell, a toolbar): the same set, not a second component. SDS switches between `InputField` and `Input` on `Has Label`, Primer connects two examples on `label?`, and Carbon's text area maps `Show label` to `hideLabel` (sources above; [Carbon TextArea.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextArea/TextArea.figma.ts)).
- [weak] `Show count` adds the character count under the field where code ships one (Carbon `enableCounter`, Primer `characterLimit`); its behaviour is [text area: character count](text-area.md#character-count).

**Variants and states**
- [required] Axes in the order `Size → Has value → Validation → Disabled → State` (figma-standard rule 1); `Validation` lists `None` then `Error`; `Disabled` pairs only with Rest and sits right after it, and pairs with Focus too where the code keeps it focusable (figma-standard rules 2 and 3).
- [moderate] `State` runs `Rest → Focus → Hover` (then `Read-only` where the code has it), with no `Press`: pressing a field focuses it, so a press frame would repeat Focus, and neither Material Web's outlined text field nor Primer's TextInput Code Connect has one ([Material Web _outlined-text-field.scss](https://github.com/material-components/material-web/blob/main/textfield/internal/_outlined-text-field.scss), [Primer TextInput.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.figma.tsx)). figma-standard rule 4 orders the rest; figma-standard rule 36 reads the archetype from the library's own fields.
- [moderate] Read-only, where the code has it, is a `State` value: Carbon's and Primer's kits each draw it there, mapping `Read-only` and `read-only` to `readOnly` ([Carbon TextInput.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/TextInput/TextInput.figma.ts), [Primer TextInput.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.figma.tsx)).
- [moderate] `Has value` and `Validation` sit beside `State`, not on it, because a focused field in error and an empty field in error are both frames code reaches ([research: *States on the axis*](../../../research/components-and-naming/what-the-state-axis-models.md#states-on-the-axis)); SDS puts `Disabled` and `Error` in one `State`, which cannot draw them ([SDS InputField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/InputField.figma.ts)).
- [required] Sizes are `Size` with t-shirt values, largest first, matching the code's steps (figma-standard rule 6).

**Tokens**
- [required] Every fill, stroke, radius, gap and padding binds a semantic variable; label, value, placeholder, hint, affix and error take text-role tokens (figma-standard rules 24, 28 and 29).
- [required] Placeholder and read-only text meet the contrast floor (figma-standard rule 32); the field's border meets 3:1 (WCAG 1.4.11).
- [required] A state variant binds its own state's tokens (figma-standard rule 48); component tokens, where the project has them, are `Component/Text input/<Element>/<property>[-<variant>][-<state>]` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above; component-validator raises an icon in the field row (W2) and one in the middle of it (MU5) as decisions for code; the contract lists `Has value`, `Validation`, `Disabled`, `Size` and any `State=Read-only` for the parity report.
- *Judgement*: can a designer draw every state the code reaches, including focus with error and an empty field in error?

**Sources.** Figma's Simple Design System, Carbon and Primer Code Connect files for property names and the one-set kit; the toolkit's state-axis research for what sits beside `State`; component-validator for where code places icons.

## Alignment with code

**Structure**
- [contested] **Whether code splits the bare input from its field.** SDS has `Input` and `InputField`, the field rendering React Aria's `TextField` around `Label`, `Input`, `Description` and `FieldError` ([SDS Input.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Input/Input.tsx)); React Aria's `TextField` is the container whose `Input` or `TextArea` child takes the field's props by context ([React Aria TextField.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/TextField.tsx)); Primer's `TextInput` is bare and goes inside `FormControl` with `FormControl.Label` and `FormControl.Caption` ([Primer FormControl.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/FormControl/FormControl.figma.tsx)); MUI's `TextField` wraps an input in a `FormControl` with `InputLabel` and `FormHelperText` ([MUI TextField source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/TextField/TextField.js)). Carbon's `TextInput` is always the field, bare only through `hideLabel` ([Carbon TextInput source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/TextInput.tsx)).
- [strong] Every kit read draws one set over that split: SDS's switches components on `Has Label`, Primer's `TextInput` connects two examples on `label?`, and Carbon's set is the field (Code Connect files above). The page's one `Text input` set with `Show label` follows them, as [select](select.md#alignment-with-code) does; *Differences* says why it does not split as the checkbox does.
- [strong] Icons, affixes and the trailing action are parts of one component in code, never components of their own: Primer's `leadingVisual`, `trailingVisual` and `trailingAction`, MUI's `startAdornment` and `endAdornment` ([MUI InputBase types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/InputBase/InputBase.d.ts)), GOV.UK's `prefix` and `suffix` (sources above). So the set nests icon instances and no `Field` sub-component.

**Mapping**
- [required] Each Figma axis maps to one attribute, property or pseudo-class, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Size` | `size` |
  | `Has value=False` | empty `value`; `Placeholder` is `placeholder`, styled from `:placeholder-shown` |
  | `Has value=True` | `value` |
  | `Validation=Error` | `aria-invalid="true"`, `Error message` tied with `aria-describedby`; styled from `:user-invalid` or the attribute |
  | `State=Read-only` | `readonly`, styled from `:read-only` |
  | `Disabled=True` | `disabled` on the `input` |
  | `State=Hover`, `Focus` | `:hover`, `:focus-visible`, set by the browser |
  | `Label`, `Description` | the `label`; the hint tied with `aria-describedby` (code-standard rule 15) |
  | `Show label=False` | the bare input, named by `aria-label` or `aria-labelledby` from what places it |
  | `Prefix`, `Suffix` | `aria-hidden` text beside the `input`; GOV.UK `prefix`, MUI `startAdornment` |
  | `Leading icon`, `Trailing icon` | Primer `leadingVisual`, `trailingVisual`; MUI `startAdornment`, `endAdornment` |
  | `Trailing action` | Primer `trailingAction`, a named `button` |
  | `Show count` | Primer `characterLimit`; Carbon `enableCounter` with `maxCount` |

**States**
- [required] The browser sets hover and focus, `:placeholder-shown` while the field is empty, `:read-only` from `readonly`, and `:user-invalid` once the person has interacted or submitted ([HTML: `:user-invalid`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-user-invalid)). A text field shows its focus however it was focused: MDN gives "a text box needing user input" as the case where focus is indicated after a click ([MDN `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)).
- [required] A prop sets `value`, `disabled`, `readonly`, `size` and the error: Primer writes `aria-invalid` from `validationStatus`, Carbon from `invalid`, MUI from `error` (sources above). React Aria sets `data-focused`, `data-focus-visible`, `data-hovered`, `data-disabled` and `data-invalid` on its `Input` from script ([React Aria Input.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Input.tsx)), so a stylesheet on it matches those attributes, as SDS's does ([SDS input.css](https://github.com/figma/sds/blob/main/src/ui/primitives/Input/input.css)).
- [required] Code cannot reach Disabled with Error, nor Read-only with Error, through validation: disabled and read-only controls are barred from constraint validation (MDN `readonly`, above), and Carbon drops `invalid` under either (`invalid: !readOnly && !disabled && invalid`, [Carbon useNormalizedInputProps](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/internal/useNormalizedInputProps.tsx)). So the set draws neither.
- [moderate] Code reaches focus with error and empty with error; the set draws them because `Has value` and `Validation` sit beside `State`. A read-only field also takes focus, which one `State` axis cannot draw beside `Read-only`; the set leaves read-only with focus undrawn (its ring is Focus's), a departure the project records (figma-standard rule 51).

**Differences**
- [required] One set where SDS, Primer, MUI and React Aria code has two; the Code Connect file switches component on `Show label`, as SDS's does (sources above) (figma-standard rule 54).
- [required] `Disabled` and `Validation` are axes of their own where the SDS, Carbon and Primer kits fold them into `State` (Code Connect files above); code sets each as a prop (figma-standard rule 1). `Read-only` stays in `State`, as Carbon's and Primer's kits draw it.
- [required] Carbon's `Warning` validation, its `Inline` style and its skeleton, Primer's `loading`, `contrast` and `monospace`, and MUI's `filled` and `standard` variants (sources above) are drawn only where the project's code renders them (figma-standard rule 51).

**Check**
- *Script*: the component contract lists the set's axes and properties beside the code's props; an icon property with no slot prop, or a `State=Read-only` over code with no `readOnly`, shows in the parity report (design-code-parity).
- *Judgement*: does the Code Connect file give the bare input where `Show label` is off?

**Sources.** SDS, React Aria, Primer, MUI, Carbon and GOV.UK source and Code Connect files as linked; the HTML standard and MDN for `:user-invalid`, `readonly` and `:focus-visible`.

## In code

**Element**
- [required] A native `input` inside the wrapper, its `label` before it, hint and message tied with `aria-describedby` (code-standard rules 8 and 15); icons, affixes and actions are siblings of the `input` inside the wrapper, as [prefixes, suffixes and icons: *Build*](#prefixes-suffixes-and-icons) sets out.
- [strong] Every library read renders the native element: Primer, Carbon and MUI an `input`, React Aria's `Input` an `input` with its state as data attributes (sources above).

**Props**
- [strong] `value` (or `defaultValue`), `placeholder`, `type`, `disabled`, `readOnly`, `required`, a validation prop, `size`, the label, a hint, and leading and trailing slots. Primer (`validationStatus`, `size`, `leadingVisual`, `trailingVisual`, `trailingAction`, `characterLimit`, `block`; [Primer TextInput source](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.tsx)), Carbon (`labelText`, `helperText`, `invalid`, `invalidText`, `warn`, `readOnly`, `size`, `enableCounter`, `maxCount`; [Carbon TextInput source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/TextInput/TextInput.tsx)) and MUI (`label`, `helperText`, `error`, `size`, with `startAdornment` and `endAdornment` on its input; [MUI TextField types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/TextField/TextField.d.ts)) share this shape.
- [moderate] The slots take nodes, not icon names, so the trailing action can be a real button: Primer's `trailingAction` takes a `TextInput.Action` element, MUI's adornments take any node.

**Check**
- *Script*: the parity loop compares each variant's field, border, ring and slots with its frame (design-code-parity); the component contract flags a Figma axis with no prop.
- *Judgement*: does every icon in the field have a slot prop, and every action a name?

**Sources.** Primer, Carbon, MUI, SDS and React Aria source as linked; the toolkit's state-axis research for the mapping.
