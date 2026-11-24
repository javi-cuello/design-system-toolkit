# Select

A select is a closed field that opens a list for one choice from more options than radios can show. This page owns the select as a component, in design, in Figma and in code: the native `select`, its placeholder option, its label, unavailable options, the chevron, and its states. What spans the selection controls stays in [`../patterns/selection.md`](../patterns/selection.md): choosing the control and its counts, the visible listbox, and multi-select; a filter bar's selects are [filtering: facet controls](../patterns/filtering.md#facet-controls). Related: [radio](radio.md), [combobox](combobox.md), [segmented control](segmented-control.md), [forms: labels](../patterns/forms.md#labels).

## Overview

**Use when / don't use**
- [moderate] A select for one choice from about six to fifteen options, where the options need no comparison; fewer is radios, more or known by heart is a combobox. The rule and its cases are [select (dropdown)](#select-dropdown); the counts are [selection: choosing the control](../patterns/selection.md#choosing-the-control).
- [weak] A select and a combobox are separate components, even where one library builds both on a listbox: the select has no text entry, and the person cannot type a value that is not in the list ([selection: *Build*](../patterns/selection.md#choosing-the-control) keeps controls that differ in kind apart; the APG calls the select's custom form a "select-only" combobox, [APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)).

**Anatomy**
- [strong] A visible label, an optional hint, an error message when it fails validation, and the field showing the chosen value or the placeholder option, with a chevron at its inline end; their order is a contested choice the project decides, in [forms: *Help and hint text*](../patterns/forms.md#help-and-hint-text). SDS names `Label`, `Value`, `Description` and `Error` ([SDS SelectField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/SelectField.figma.ts)); Carbon's `Select` takes `helperText` and `invalid` around a native `select` ([Carbon Select source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Select/Select.tsx)); Primer's `Select` takes a `placeholder` and `validationStatus` around a native `select` ([Primer Select source](https://github.com/primer/react/blob/main/packages/react/src/Select/Select.tsx)).
- [weak] The list that opens is the browser's for a native select; only a custom listbox has an anatomy of its own to draw, and that is [selection: visible listbox](../patterns/selection.md#visible-listbox)'s option shape in a popup.
- [required] A focus ring around the field (WCAG 2.4.7; figma-standard rule 39), and a field at least 24 pixels high (figma-standard rule 26).

## Select (dropdown)

**Use when / don't use**
- [moderate] Use for one choice from about six to fifteen options, where space is short and the options need no side-by-side comparison.
- [moderate] Don't use for fewer than about five; radios show them without a click ([Baymard](https://baymard.com/blog/drop-down-usability): 55% of test users opened an optional drop-down just to see its contents). [Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/): never for two options.
- [weak] Don't use when options must be compared (plans, delivery choices); radios with descriptions keep all in view.
- [moderate] Don't use for very long lists or values the person knows by heart (country, date of birth): a combobox or text fields ([NN/g, Li 2017](https://www.nngroup.com/articles/drop-down-menus/)).
- [moderate] Don't use a multiple select; use checkboxes ([GOV.UK select](https://design-system.service.gov.uk/components/select/)).

**How**
- [strong] **A minimum width, so the field stays wider than it is tall.** Fluent's Dropdown and Combobox have a 250px minimum ([Dropdown styles](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-combobox/library/src/components/Dropdown/useDropdownStyles.styles.ts)); GOV.UK's select 11.5em, so "it makes the Select wider than it is tall" and "fits comfortably on screens as narrow as 240px wide" ([select mixin](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/select/_mixin.scss)); Spectrum's picker and combobox 2 and 2.5 times the field's height ([Spectrum CSS picker](https://github.com/adobe/spectrum-css/blob/main/components/picker/index.css)). A combobox's field takes the same minimum ([combobox](combobox.md)).
- [moderate] **Native `select`** first. GOV.UK's research lists failures with selects: people "tried to type into the select", "confused focused items with selected items", could not close it, or did not know to scroll ([GOV.UK](https://design-system.service.gov.uk/components/select/)). A custom listbox repeats each of those unless it is built to the APG pattern.
- [moderate] **Placeholder option.** In a form question, nothing is preselected ([GOV.UK](https://design-system.service.gov.uk/components/select/)): the first option is empty in value and says what to choose ("Choose a country"), and the field is required where an answer is. That option carries no information beyond the instruction ([Carbon](https://carbondesignsystem.com/components/dropdown/usage/): "Do not put important information in placeholder text"). A filter menu instead opens on the option that names what "all" covers (design-standard rule 12).
- [moderate] **Label** visible above, like any field ([forms: labels](../patterns/forms.md#labels)). A select without a visible label is read by tools/ui-check/check.mjs as a filter menu.
- [weak] **Order** by the person's logic: frequency, size, or time; alphabetical when there is none.
- [required] **Unavailable options** stay in place, disabled (design-standard rule 5).
- [required] **Chevron** inside the field keeps the field's inset (design-standard rule 9; [visual: iconography](../design/visual.md#iconography)).

**Cases**
- "Title: Mr / Mrs / Ms" as a select → drop the field, or radios if it is truly needed; Baymard's test users opened short drop-downs just to scan them.
- A 4-option "Sort by" in a filter bar → segmented, since it applies at once and holds four (design-standard rule 4).
- A select that navigates the moment an option is chosen → apply on a button, or announce the behaviour first; WCAG 3.2.2 forbids an unannounced change of context ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html), failure F36 for auto-submit).
- A "State" select on an address form → offer address lookup or a text field with autocomplete; Baymard found typing beats scrolling a state list.
- A select whose only remaining option after another choice is "Standard" → show "Standard" as text ([Baymard](https://baymard.com/blog/drop-down-usability)).

**Accessibility**
- [required] 1.3.1 and 3.3.2: a visible, associated label. 3.2.2 On Input: changing the option never navigates or submits without warning. 2.1.1: a native select is keyboard-operable as shipped; a custom one follows the APG select-only combobox ([W3C APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)).
- [required] Implementation: code-standard rule 8 (wrap the native `select`), code-standard rule 16 (its menu follows the theme), code-standard rule 20 (a filter select submits a GET form without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- [required] A native `select` inside the wrapper (code-standard rule 8). In a question, the first option is `<option value="">Choose a country</option>` and the `select` is `required`.
- [required] Groups are `optgroup`; an unavailable option is `<option disabled>`, kept in place (design-standard rule 5).
- [required] The chevron is drawn on the `select` itself (`appearance: none` with a background image and inline-end padding from tokens), so the native popup and keyboard stay; `color-scheme` themes the popup (code-standard rule 16).
- [required] A filter select sits in a GET form with a submit the script removes (code-standard rule 20); the script applies the filter in place on `change`, never navigating away.
- [weak] Markup in [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 5 and design-standard rule 12 on selects without a visible label (it treats them as filter menus). It could also count options and flag a labelled form select of four or fewer, flag `select[multiple]`, and flag a `change` handler that navigates.
- *Judgement:* Would radios fit, and must these options be compared?

**Sources:** NN/g, Baymard and GOV.UK agree on avoiding selects for short and very long lists; they differ only on the exact count (above).

## In Figma

**Layers**
- [required] Auto layout throughout: `Label`, `Description`, `Error message`, then the `Field` holding `Value` and the chevron `Icon` (the order shown is for a project that places the hint and the message above the field, a `contested` choice the project decides; see [forms: *Help and hint text*](../patterns/forms.md#help-and-hint-text) and [*Error messages*](../patterns/forms.md#error-messages-and-the-error-summary)); the field fills its container's width and the value truncates only by design (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant: `Label`, `Field`, `Value`, `Icon`, `Description`, `Error message` (figma-standard rule 10); the value layer keeps one name whether it shows a value or the placeholder.
- [required] The chevron trails in auto-layout order, never pinned to the right edge, so a right-to-left page puts it at the inline end, where the project mirrors (figma-standard rule 50; design-standard rule 9 for its inset).

**Properties**
- [required] `Label`, `Value` and `Placeholder` are text properties, named as the code's props are (figma-standard rules 21 and 37); `Show description` sits directly above `Description`, and the error text is `Error message` (figma-standard rule 5).
- [required] Whether a value is chosen is `Has value`, the form figma-standard rule 21 gives content the component holds: `False` shows `Placeholder` in its placeholder colour, `True` shows `Value`. SDS reaches the same with a `Value Type` axis of `Default` and `Placeholder` over one `Value` string ([SDS SelectField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/SelectField.figma.ts)).
- [moderate] A select drawn without its label for a filter bar is the same component with its label turned off, not a second component ([Alignment with code](#alignment-with-code)). SDS's kit switches between `SelectField` and a bare `Select` on its `Has Label` boolean, over a code split ([SDS SelectField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/SelectField.figma.ts)); Carbon's maps `Show label` to `hideLabel` on its one `Select` ([Carbon Select.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Select/Select.figma.ts)); Primer's draws one `Select` holding `FormControl.Label` instances and maps no label toggle ([Primer Select.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Select/Select.figma.tsx)). `Show label` is figma-standard rule 21's word for it where the project writes the code; over Carbon's `hideLabel` used as shipped, the property takes the code's name. Its accessible name still comes from somewhere: [select (dropdown): *How*](#select-dropdown).

**Variants and states**
- [required] Axes in the order `Size → Has value → Open → Validation → Disabled → State`; `Validation` lists `None` then `Error`; `Disabled` pairs only with Rest and sits right after it, and pairs with Focus too where the code keeps it focusable; `State` runs `Rest → Focus → Hover → Press`; `Open` is drawn only where the open field has a look of its own: in a custom listbox, or a native select the project styles through `:open` ([Alignment with code](#alignment-with-code)) (figma-standard rules 1 to 4 and 57). SDS puts `Disabled` and `Error` as values of one `State` axis ([SDS SelectField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/SelectField.figma.ts)), which leaves no frame for a focused field in error ([research: *States on the axis*](../../../research/components-and-naming/what-the-state-axis-models.md#states-on-the-axis)).
- [required] An open field is an `Open` False/True property, as code's `aria-expanded` is, mapped to `aria-expanded` in a custom listbox, as Primer's `ActionMenu` and Carbon's `MenuButton` kits draw an open menu ([button: *In Figma*](button.md#in-figma)) (figma-standard rule 57); a native select's open popup is the browser's, so the frame shows the field only.
- [required] Sizes are `Size` with t-shirt values, largest first, matching the code's steps (figma-standard rule 6); Carbon's `Select` ships `xs`, `sm`, `md` and `lg`.

**Tokens**
- [required] Every fill, stroke, radius, gap and padding binds a semantic variable, never a primitive; the label, value, placeholder, hint and error take text-role tokens (figma-standard rules 24, 28 and 29).
- [required] The placeholder text meets the contrast floor like any text, since it carries the instruction (figma-standard rule 32); the field's border meets 3:1 against its surface (WCAG 1.4.11).
- [required] A state variant binds its own state's tokens (figma-standard rule 48); component tokens, where the project has them, are `Component/Select/<Element>/<property>[-<variant>][-<state>]` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the contract lists `Has value`, `Validation`, `Size` and `Disabled`, so an axis with no code counterpart shows in the parity report.
- *Judgement*: does the field read as a select, not a text input, at rest, with its chevron the only difference?

**Sources.** Figma's Simple Design System for the property names and its single `State` axis; Carbon and Primer for the native field and its props; the toolkit's state-axis research for `Open` and for validation beside `State`.

## Alignment with code

**Structure**
- [contested] **Whether code splits the control from its field.** Primer places a bare `Select` in `FormControl` with `FormControl.Label` and `FormControl.Validation` ([Primer Select.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Select/Select.figma.tsx)); MUI has `Select`, and `TextField` with `select`, which wraps it in a label and helper text ([MUI TextField types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/TextField/TextField.d.ts)); SDS has `Select` and `SelectField` ([SDS Select.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Select/Select.tsx)). Carbon's `Select` is always the field, bare only through `hideLabel` ([Carbon Select.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Select/Select.figma.ts)), and React Aria's `Select` is one container composing `Label`, a `Button` with `SelectValue`, a description, `FieldError` and a `Popover` with a `ListBox` ([React Aria Select.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Select.tsx)). Radix ships the control's parts (`Trigger`, `Value`, `Icon`, `Content`, `Item`) and no field label ([Radix select source](https://github.com/radix-ui/primitives/blob/main/packages/react/select/src/select.tsx)).
- [strong] Every kit that draws a select draws one set over that split: SDS's switches between `SelectField` and `Select` on its `Has Label` boolean ([SDS SelectField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/SelectField.figma.ts)), Carbon's maps `Show label` to `hideLabel`, and Primer's nests `FormControl.Label` and `Form.Validation` instances in its `Select`. The page's one `Select` set with `Show label` follows them; *Differences* says why it does not split as the checkbox does.
- [strong] The control is native in Primer and Carbon, each rendering a `select` element ([Primer Select source](https://github.com/primer/react/blob/main/packages/react/src/Select/Select.tsx), [Carbon Select source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Select/Select.tsx)), and in MUI with `native` ([MUI Select types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Select/Select.d.ts)); it is a custom listbox in MUI's default, a `role="combobox"` element with `aria-expanded` ([MUI SelectInput source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Select/SelectInput.js)), in SDS and React Aria, and in Radix. Which kind the project builds decides whether `Open` is drawn ([In Figma](#in-figma)).

**Mapping**
- [required] Each Figma axis maps to one attribute, property or pseudo-class, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Size` | `size` |
  | `Has value=False` | the empty first option selected; `Placeholder` is its text |
  | `Has value=True` | `value`; `Value` is the chosen option's text |
  | `Validation=Error` | `aria-invalid="true"` and `Error message` tied with `aria-describedby`; styled from `:user-invalid` or the attribute |
  | `Disabled=True` | `disabled` on the `select` |
  | `State=Hover`, `Press`, `Focus` | `:hover`, `:active`, `:focus-visible`, set by the browser |
  | `Open=True` | custom listbox: `aria-expanded="true"`; native select: `:open`, where the design gives the open field a look of its own |
  | `Label`, `Description` | the `label`; the hint tied with `aria-describedby` (code-standard rule 15) |
  | `Show label=False` | a name from `aria-label` or the filter bar's own label; never a nameless field |

**States**
- [required] The browser sets the pointer and focus states in the mapping; `:user-invalid` on a `required` select still on its empty placeholder option, once the person has interacted or submitted ([HTML: `:user-invalid`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-user-invalid)); and `:open` on a native select whose drop-down shows ([HTML: `:open`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-open)), in Chrome 133, Firefox 136 and Safari 26.5 by [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:open). So a native field can now match an `Open` frame drawn for its own border; the popup stays the browser's.
- [required] A prop sets `value`, `disabled`, `size` and the error: Primer writes `aria-invalid` from `validationStatus`, Carbon from `invalid`, MUI from `error` (sources above). A custom listbox sets `aria-expanded`, and marks an empty value for styling: React Aria's `SelectValue` takes `data-placeholder` and its root `data-open` ([React Aria Select.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Select.tsx)), Radix's trigger `data-placeholder` and `data-state="open"` ([Radix select source](https://github.com/radix-ui/primitives/blob/main/packages/react/select/src/select.tsx)). That is the `Has value=False` frame.
- [required] Code cannot reach Disabled with Error, nor Disabled with Open: a disabled control is barred from constraint validation and takes no clicks ([HTML: the disabled attribute](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-disabled)), and Carbon's `Select` runs `invalid` through the same `useNormalizedInputProps` that drops it under `disabled` ([Carbon Select source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Select/Select.tsx)).
- [moderate] Code reaches focus with error, and `Has value=False` with error, the commonest failed select: a required question left on its placeholder. The set draws both, since `Has value` and `Validation` sit beside `State` ([In Figma](#in-figma)).

**Differences**
- [required] One set where Primer, MUI and SDS code has two; the Code Connect file switches component on `Show label`, as SDS's does (sources above) (figma-standard rule 54).
- [required] `Disabled` and `Validation` are axes of their own where SDS's kit puts `Disabled` and `Error` in `State` and Carbon's adds `Warning` and `Read-only` there ([Carbon Select.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Select/Select.figma.ts)); code sets each as a prop (figma-standard rules 1 and 57).
- [required] Carbon's `Inline` style (`inline`), its `Warning` and `Read-only`, and Primer's full width (`fullWidth?` read as `block`) (sources above) are drawn only where the project's code renders them (figma-standard rule 51).

**Check**
- *Script*: the component contract lists the set's axes and properties beside the code's props; a `Show label` that maps to no component switch, or an `Open` frame on a native select with no `:open` rule, shows in the parity report (design-code-parity).
- *Judgement*: does the Code Connect file give the bare control where `Show label` is off, and does the native or custom choice match which frames are drawn?

**Sources.** Primer, MUI, SDS, Carbon, React Aria and Radix source and Code Connect files as linked; the HTML standard for `:user-invalid`, `:open` and disabled controls; MDN for browser support.

## In code

**Element**
- [required] A native `select` inside the wrapper, the placeholder an empty-valued first option, as [select (dropdown): *Build*](#select-dropdown) sets out (code-standard rule 8). Carbon and Primer wrap the native element ([Carbon Select source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Select/Select.tsx), [Primer Select source](https://github.com/primer/react/blob/main/packages/react/src/Select/Select.tsx)).
- [moderate] A custom listbox only when options need more than text, built to the APG select-only combobox ([APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)). SDS's select is one: a button and a popover listbox from React Aria ([SDS Select.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Select/Select.tsx)), which renders a hidden native `select` beside it so browser autofill still works ([React Aria HiddenSelect](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/select/HiddenSelect.tsx)).

**Props**
- [strong] `value` (or `defaultValue`), `placeholder`, `disabled`, `required`, a validation prop, `size`, the label and a hint; options as children. Primer (`placeholder`, `validationStatus`, `size`, `block`), Carbon (`helperText`, `invalid`, `inline`, `size`) and SDS (`label`, `description`, `errorMessage`, `placeholder`, `isDisabled`, `defaultSelectedKey`) share this shape.
- [weak] Primer's `placeholder` renders the empty first option, made `disabled` and `hidden` when the field is `required`, so the instruction cannot be chosen back; a project's own wrapper does the same.

**Check**
- *Script*: the parity loop compares each variant's field, chevron and ring with its frame (design-code-parity); the component contract flags a Figma axis with no prop.
- *Judgement*: is the native popup acceptable here, or does the design truly need a custom listbox?

**Sources.** Primer, Carbon, SDS and React Aria source as linked; the APG combobox pattern for the select-only form; the toolkit's state-axis research for `Open`.
