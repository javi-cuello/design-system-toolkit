# Combobox

A combobox is a text field with a list of suggestions: the person types to narrow a long list, then picks, or enters a value of their own where the field allows it. This page owns the single-value combobox as a component, in design, in Figma and in code: its model, matching, keys, the no-results message, the no-script path and its states. What spans the selection controls stays in [`../patterns/selection.md`](../patterns/selection.md): choosing the control, the visible listbox, and the multi-select that adds chips to a combobox. Related: [select](select.md), [chip](chip.md), [popover](popover.md), [search](../patterns/search.md).

## Overview

**Use when / don't use**
- [moderate] A combobox for one choice from a very long list, or a value the person knows well enough to type; a short list is radios or a select. The rule and its cases are [combobox and autocomplete](#combobox-and-autocomplete); the counts are [selection: choosing the control](../patterns/selection.md#choosing-the-control).
- [strong] Whether a typed value outside the list is accepted is one prop of the same component, not a second component: Carbon's `ComboBox` has `allowCustomValue` ([Carbon ComboBox source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ComboBox/ComboBox.tsx)), React Aria's `allowsCustomValue` ([React Aria useComboBox](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/combobox/useComboBox.ts)), MUI's Autocomplete `freeSolo` ([MUI Autocomplete types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Autocomplete/Autocomplete.d.ts)).
- [weak] Several values at once are the [multi-select](../patterns/selection.md#multi-select), which builds on this component and adds chips; this page does not repeat it.

**Anatomy**
- [moderate] A visible label, a text input, an optional button at its inline end that opens the list, and a popup list of options under the field, with a no-results message and a loading message in the same popup. MUI names the messages `noOptionsText` and `loadingText` beside a `loading` flag (MUI Autocomplete types); Carbon's combo box carries a `placeholder` and `invalid` and `warn` states (Carbon ComboBox source).
- [required] A polite status region outside the popup, present from load, announcing the count of results ([combobox and autocomplete: *Build*](#combobox-and-autocomplete)).
- [required] A focus ring on the input while focus stays there, and a visible active option in the list as the arrow keys move (WCAG 2.4.7; figma-standard rule 39; the APG keeps DOM focus on the combobox, [APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)).

## Combobox and autocomplete

**Use when / don't use**
- [moderate] Use for one choice from a very long list (countries, people, components), or a list the person knows well enough to type ([Baymard](https://baymard.com/blog/drop-down-usability): autocomplete is "a well-performing alternative to a drop-down" for country).
- [weak] Use where the value may be new as well as chosen (a tag, a label) ([Carbon combo box](https://carbondesignsystem.com/components/dropdown/usage/): "select from a list of suggested options or type in their own custom value").
- [weak] Don't use for a short list; radios or a select are simpler.
- [weak] Don't use when any free text is acceptable and no validation is needed; a plain text field is simpler still.

**How**
- [moderate] **Model.** A text input with a popup list ([W3C APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)). Pick one of the APG's autocomplete behaviours and keep it: list with manual selection (suggestions shown, the person picks) is the safe default; inline completion and automatic selection suit expert tools.
- [weak] **Matching.** Match anywhere in the option text, accept common synonyms and abbreviations ("UK" finds "United Kingdom"), and ignore case and accents.
- [moderate] **Keyboard.** Down Arrow enters the list, Enter accepts, Escape closes the popup; Alt + Down opens it without moving focus ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)).
- [weak] **No results.** Say so in the popup ("No countries match 'Atl'"), never an empty box.
- [moderate] **Without script.** Start from a native `select` or a text input with a `datalist` and enhance it, so the form still works.
- [weak] **Small screens.** The popup sits below the field and the field scrolls into view above the on-screen keyboard.
- [weak] **States:** empty, typing with suggestions, no match, selected, error, disabled.

**Cases**
- A country field as a 250-option select → a combobox enhancing the select; Baymard and NN/g both favour typing for countries.
- A people picker that only finds names from their start ("Ann" misses "Mary-Ann") → match anywhere in the string.
- A combobox that selects the first suggestion on blur → leave the typed text and show an error on submit if it matches nothing; silent selection fills in a value the person never chose.
- A tag field that accepts new values → show "Create 'design-ops'" as the last option, so creating is explicit.

**Accessibility**
- [required] 4.1.2: `role="combobox"` with `aria-expanded`, `aria-controls` and `aria-activedescendant` on the active option, per the APG. 4.1.3 Status Messages: the number of results is announced in a polite live region. 2.1.1: the keys above. 1.3.5 Identify Input Purpose where the field asks about the person (a country of residence takes `autocomplete="country-name"`).
- [required] Implementation: code-standard rule 8 (behaviour-heavy only after native options are ruled out), code-standard rule 19 (Escape and light dismiss are built, not assumed), code-standard rule 20 (works without script). A composite role shipped with its keyboard is a [code candidate](../../code/candidates.md). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- [moderate] Start from a native `select` or an `input` with a `datalist`, then enhance to the APG combobox: focus stays in the `input`, `aria-activedescendant` moves through the `listbox` ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- [moderate] The result count goes into a polite status element present from load ([accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).
- [weak] Matching ignores case and accents with `Intl.Collator` at `sensitivity: 'base'` in the model, never a lower-cased string comparison ([i18n: locale-aware sorting](../../code/i18n.md#locale-aware-sorting)).
- [weak] A remote search is debounced and aborts the previous request ([javascript: debouncing input](../../code/javascript.md#debouncing-input)).
- [required] Escape and a click outside close the popup in the script (code-standard rule 19); nothing is selected on blur; with scripts off the form still submits (code-standard rule 20).

**Check**
- *Script:* could check `role="combobox"` with `aria-expanded` and `aria-controls`, that Escape closes the popup, that a no-match message appears, and that the field is a working native control with script disabled.
- *Judgement:* Is the list long enough to need typing, and does matching find what people type?

**Sources:** APG, Baymard and Carbon as linked; they agree.

## In Figma

**Layers**
- [required] Auto layout throughout: `Label`, then the `Field` holding `Value` and the trailing `Icon` button, then `Description` and `Error message`; the field fills its container (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant (figma-standard rule 10); the popup is a part named for its family and last word, `Combobox list`, with its rows `Combobox option`, and inside the field's frames it keeps the last word, `List` (figma-standard rule 9).
- [required] The button sits last in auto-layout order, never pinned to the right edge, so a right-to-left page puts it at the inline end, where the project mirrors (figma-standard rules 33 and 50).

**Properties**
- [required] `Label`, `Value`, `Placeholder`, `Description` and `Error message` are text properties named as the code's props are; `Show description` sits directly above `Description` (figma-standard rules 5, 21 and 37).
- [required] `Has value` says whether text is in the field, the form figma-standard rule 21 gives content the component holds.
- [required] Each option's text lives in the list's slot, named for what it hosts (`Options slot`), never in text overrides on nested option instances, since options change variant as the active one moves (figma-standard rule 38).
- [required] Every property drives a layer in every variant where that layer exists (figma-standard rule 30).

**Variants and states**
- [required] The field's axes run `Size → Has value → Validation → Disabled → State`; `Validation` lists `None` then `Error`; `Disabled` pairs only with Rest; `State` runs `Rest → Focus → Hover → Press → Open`, `Open` drawn with the focus ring, since the input keeps focus while the list shows (figma-standard rules 1 to 4).
- [moderate] Open is one value on the field's `State`, not a boolean beside it ([research: *Open menu triggers*](../../../research/components-and-naming/what-the-state-axis-models.md#open-menu-triggers)); the field owns whether the list shows (figma-standard rule 7).
- [weak] The list's contents (options, no match, loading, "Create 'design-ops'") are one axis on `Combobox list`, not on the field, so the field's set does not multiply by every list state and no frame shows two at once (figma-standard rule 2's reasoning). The states the moved section lists are [combobox and autocomplete: *How*](#combobox-and-autocomplete).
- [strong] An option's active and selected looks are an axis on `Combobox option`, active drawn distinctly from selected: the APG tells them apart as `aria-activedescendant` and `aria-selected`, and GOV.UK's research found people confusing focused with selected items in selects ([select (dropdown): *How*](select.md#select-dropdown)).

**Tokens**
- [required] Every fill, stroke, radius, gap and padding binds a semantic variable, never a primitive; text layers take text-role tokens (figma-standard rules 24, 28 and 29).
- [required] A state variant binds its own state's tokens (figma-standard rule 48); the field's border meets 3:1 against its surface (WCAG 1.4.11).
- [required] Component tokens, where the project has them, are `Component/Combobox/<Element>/<property>[-<variant>][-<state>]` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the field, the list and the option; the contract lists their axes, so one with no code counterpart shows in the parity report.
- *Judgement*: is there a frame for no match, and can the active option be told from the selected one without colour?

**Sources.** Carbon, React Aria and MUI for the custom-value prop and the popup's messages; figma-standard rules 7, 9 and 38 for the parts; the toolkit's state-axis research for `Open`. Figma's Simple Design System ships no combobox among its primitives ([SDS primitives](https://github.com/figma/sds/tree/main/src/ui/primitives)), so no Code Connect file was read for this page.

## In code

**Element**
- [required] An `input` with `role="combobox"`, `aria-expanded`, `aria-controls` and `aria-activedescendant`, controlling a `listbox` of `option`s, enhanced from a native `select` or an `input` with a `datalist`, as [combobox and autocomplete: *Build*](#combobox-and-autocomplete) sets out ([APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/); code-standard rules 8 and 20).
- [moderate] `aria-autocomplete="list"` for the default behaviour, suggestions shown and the person picking; React Aria sets exactly that on its input (React Aria useComboBox) and the APG documents it as list autocomplete.

**Props**
- [strong] `value` (or `defaultValue`), `inputValue`, the options, `onChange`, a custom-value flag, `disabled`, a validation prop, `placeholder`, `size`, and the no-results and loading text. MUI (`freeSolo`, `loading`, `loadingText`, `noOptionsText`, `size`), Carbon (`allowCustomValue`, `typeahead`, `invalid`, `warn`, `placeholder`, `readOnly`, `size`) and React Aria (`allowsCustomValue`, `isInvalid`, `defaultFilter`; [React Aria ComboBox](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/ComboBox.tsx)) share this shape.
- [weak] The filter is a prop with a locale-aware default, as React Aria's `defaultFilter` is, so a project can add synonyms ("UK" finds "United Kingdom") without forking the component.

**From Figma**
- [required] Each Figma axis maps to one attribute, property or pseudo-class, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Size` | `size` |
  | `Has value` | the input's value is not empty; `Placeholder` shows otherwise |
  | `Validation=Error`, `Error message` | `aria-invalid="true"`, and the `errorMessage` prop's text tied with `aria-describedby` |
  | `Disabled=True` | `disabled` on the input |
  | `State=Hover`, `Press`, `Focus` | `:hover`, `:active`, `:focus-visible`, set by the browser |
  | `State=Open` | `aria-expanded="true"` on the input, the listbox shown |
  | list contents (options, no match, loading) | the listbox's children, and the count in the status region |
  | option active | the option whose id is in `aria-activedescendant` |
  | option selected | `aria-selected="true"` |
  | `Label`, `Description` | `label` and `description` props: the `label` element, and the description tied with `aria-describedby` (code-standard rule 15) |
  | `Show description` | whether a hint is passed |
  | `Value`, `Placeholder` | the input's `value` and `placeholder` |
  | `Options slot` | the listbox's options |

**Check**
- *Script*: the parity loop compares each field variant and the list's states with their frames (design-code-parity); the component contract flags a Figma axis with no prop.
- *Judgement*: does the active option stay visible while the arrow keys move it through a long list?

**Sources.** The APG combobox pattern; Carbon, React Aria and MUI source as linked; the toolkit's state-axis research for `Open`.
