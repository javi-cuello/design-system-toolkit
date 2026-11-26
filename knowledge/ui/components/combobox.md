# Combobox

A combobox is a text field with a list of suggestions: the person types to narrow a long list, then picks, or enters a value of their own where the field allows it. This page owns the single-value combobox as a component, in design, in Figma and in code: its model, matching, keys, the no-results message, the no-script path, the list's size and placement, and its states. What spans the selection controls stays in [`../patterns/selection.md`](../patterns/selection.md): choosing the control, the visible listbox, and the multi-select that adds chips to a combobox. Related: [select](select.md), [chip](chip.md), [popover](popover.md), [search](../patterns/search.md).

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
- [contested] **Matching: from the start, or anywhere.** Fluent's combobox moves the active option to the first one that starts with the typed text (`optionText.toLowerCase().indexOf(searchString) === 0`) and keeps the whole list ([Fluent useInputTriggerSlot](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-combobox/library/src/components/Combobox/useInputTriggerSlot.ts)). react-select, under Atlassian's Select, filters to options containing the text anywhere by default (`matchFrom: 'any'`) ([react-select filters](https://github.com/JedWatson/react-select/blob/master/packages/react-select/src/filters.ts)). The project decides; from the start suits times ("9" finds 9:00, not 19:00), anywhere suits names.
- [weak] **Synonyms, case and accents.** Accept common synonyms and abbreviations ("UK" finds "United Kingdom"), and ignore case and accents.
- [weak] **The list opens on the chosen option.** MUI's slot list scrolls the selected option into view, or its reference value when empty ([MUI DigitalClock source](https://github.com/mui/mui-x/blob/master/packages/x-date-pickers/src/DigitalClock/DigitalClock.tsx)).
- [moderate] **Keyboard.** Down Arrow enters the list, Enter accepts, Escape closes the popup; Alt + Down opens it without moving focus ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)).
- [weak] **No results.** Say so in the popup ("No countries match 'Atl'"), never an empty box.
- [moderate] **Without script.** Start from a native `select` or a text input with a `datalist` and enhance it, so the form still works.
- [weak] **Small screens.** The popup sits below the field and the field scrolls into view above the on-screen keyboard.
- [weak] **States:** empty, typing with suggestions, no match, selected, error, disabled.

**Cases**
- A country field as a 250-option select → a combobox enhancing the select; Baymard and NN/g both favour typing for countries.
- A people picker that only finds names from their start ("Ann" misses "Mary-Ann") → anywhere matching, the side that suits names (above).
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

**Sources:** APG, Baymard, Carbon, Fluent, react-select and MUI as linked; they split on matching from the start or anywhere.

## List size and placement

How wide and how tall a combobox's list is, and where it opens. The mechanics every anchored popup shares (the top layer, anchor positioning, flipping, the script fallback, scroll) are [popover: *Placement*](popover.md#placement).

**What good looks like**
- [strong] **As wide as the field.** MUI sets its Popper's `width` to the input's `clientWidth` ([MUI Autocomplete source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Autocomplete/Autocomplete.js)). Carbon sets the list's width to its field's `clientWidth` ([Carbon ComboBox source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ComboBox/ComboBox.tsx)). Polaris opens its Combobox popover `fullWidth`, documented as "Allow popover to stretch to the full width of its activator" ([Polaris Combobox source](https://github.com/Shopify/polaris/blob/main/polaris-react/src/components/Combobox/Combobox.tsx), [Polaris Popover source](https://github.com/Shopify/polaris/blob/main/polaris-react/src/components/Popover/Popover.tsx)). Atlassian's Select runs on a fork of react-select ([`@atlaskit/select` package](https://unpkg.com/@atlaskit/select/package.json)), whose menu is `width: '100%'` of the control, or the control's measured width when portaled ([react-select Menu source](https://github.com/JedWatson/react-select/blob/master/packages/react-select/src/components/Menu.tsx)).
- [strong] **Libraries without a fixed width expose the field's.** React Aria sets `--trigger-width` on the ComboBox popover, and its docs style it `width: var(--trigger-width)` ([React Aria ComboBox docs](https://react-aria.adobe.com/ComboBox), [React Aria ComboBox.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/ComboBox.tsx)). Radix sets `--radix-popper-anchor-width` ([Radix Popper source](https://github.com/radix-ui/primitives/blob/main/packages/react/popper/src/popper.tsx)), and its Popover docs match "the trigger width" with `--radix-popover-trigger-width` ([Radix Popover docs](https://www.radix-ui.com/primitives/docs/components/popover)). Headless UI exposes `--input-width` and `--button-width` on `ComboboxOptions`, with `w-(--input-width)` in its example ([Headless UI Combobox](https://headlessui.com/react/combobox)).
- [weak] **At least as wide, so a long option can widen it.** Floating UI's `size` example sets `minWidth`, not `width`, to the reference's width ([Floating UI size](https://floating-ui.com/docs/size)).
- [strong] **A few rows tall, then it scrolls.** Carbon caps the list at 5.5 rows ("item height * 5.5 items shown", [Carbon list-box styles](https://github.com/carbon-design-system/carbon/blob/main/packages/styles/scss/components/list-box/_list-box.scss)). MUI's listbox takes `maxHeight: '40vh'` and `overflow: auto` (MUI Autocomplete source). react-select, and so Atlassian's Select, defaults `maxMenuHeight` to 300 and `minMenuHeight`, the height below which it flips, to 140 ([react-select Select source](https://github.com/JedWatson/react-select/blob/master/packages/react-select/src/Select.tsx), [`@atlaskit/react-select` build](https://unpkg.com/@atlaskit/react-select@4.12.17/dist/es2019/select.js)). The systems agree on a cap and differ on its size.
- [weak] **Half a row showing at the cut.** Carbon's cap of 5.5 rows leaves the last visible row cut in half (Carbon list-box styles).
- [strong] **Opens below the field.** React Aria's ComboBox places its popover at `'bottom start'` (React Aria ComboBox.tsx). Polaris defaults `preferredPosition` to `'below'` (Polaris Combobox source). react-select defaults `menuPlacement` to `'bottom'` (react-select Select source). Headless UI's `anchor` defaults to `bottom` (Headless UI Combobox). Flipping above is [popover: *Placement*](popover.md#placement).
- [strong] **Never pushes the layout.** Every system above draws the list out of flow. Carbon's list is `position: absolute` (Carbon list-box styles), and `fixed` under `autoAlign` (Carbon ComboBox source). react-select's menu is `position: absolute` (react-select Menu source). MUI portals its Popper unless `disablePortal` is set (MUI Autocomplete source). Polaris renders its popover in a `Portal` (Polaris Popover source). Headless UI portals the options once `anchor` is set (Headless UI Combobox).
- [required] **In a dialog, opening the list leaves the dialog's height alone.** An absolutely positioned list inside the dialog still adds to the dialog's scrollable overflow; a list in the top layer adds nothing and is not clipped ([popover: *Placement*](popover.md#placement), first item).

**How**
- [strong] **The width tracks the field.** MUI re-renders when the input resizes, through a `ResizeObserver` (MUI Autocomplete source). React Aria measures the input on resize with `useResizeObserver` (React Aria ComboBox.tsx). Floating UI's `autoUpdate` re-runs on either element's resize ([Floating UI autoUpdate](https://floating-ui.com/docs/autoUpdate)).
- [moderate] **Measured across the input and its button.** React Aria spans from the leftmost to the rightmost of input and button, or takes its `Group` (React Aria ComboBox.tsx). Headless UI exposes the input's and the button's widths apart (Headless UI Combobox).
- [moderate] **Height from the space left.** React Aria fills up to the viewport's height by default ([useOverlayPosition source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/overlays/useOverlayPosition.ts)). Radix publishes `--radix-popper-available-height` for a `max-height` (Radix Popper source). A fixed cap, as above, applies inside that.

**Cases**
- A country combobox in a modal dialog adds a scroll bar to the dialog when the list opens → the list moves to the top layer, still inside the dialog's DOM.
- A list narrower than its field, sized by its longest option → `width` from the field, or `min-width` where long options must not wrap.
- A list of 250 options runs past the bottom of the window → a capped height with scroll inside, and a flip above when the space below is short.

**Accessibility**
- [required] The list stays inside a modal dialog's DOM, or it turns inert while the dialog is open ([popover: *Placement*](popover.md#placement), *Accessibility*).
- [moderate] The list is a non-modal popup: focus stays in the input. The APG keeps DOM focus on the combobox ([APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)), and React Aria opens the ComboBox popover with `isNonModal: true`, so it takes no `role="dialog"` (React Aria ComboBox.tsx, [React Aria Popover.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Popover.tsx)).

**Build**
- [required] The `listbox` is a `popover` inside the field's markup, so a dialog around the field holds it too ([popover: *Placement*](popover.md#placement), *Build*).
- [strong] Width with anchor positioning is `width: anchor-size(width)` ([MDN: Using CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Using)). In a library it is the variable it exposes: `--trigger-width`, `--radix-popper-anchor-width`, `--input-width`. In the script fallback, the field's `clientWidth` is written on resize, as MUI and Carbon do (sources as above).
- [strong] The `listbox` carries a `max-height` and `overflow-y: auto`, as MUI's and Carbon's do (sources as above).

**Check**
- *Script*: could open the list inside a modal dialog and assert the dialog's height and `scrollHeight` are unchanged, and that the list's width equals the field's.
- *Judgement*: does the longest option fit the field's width, or wrap?

**Sources.** MUI, Carbon, Polaris, react-select and its Atlassian fork, React Aria, Radix and Headless UI source and docs, read for width, height, placement and portals; Floating UI for `minWidth`; MDN for `anchor-size()`. They agree on matching the field's width and on capping the height; the cap's size differs.

## In Figma

**Layers**
- [required] Auto layout throughout: `Label`, `Description`, `Error message`, then the `Field` holding `Value` and the trailing `Icon` button (the order shown is for a project that places the hint and the message above the field, a `contested` choice the project decides; see [forms: *Help and hint text*](../patterns/forms.md#help-and-hint-text) and [*Error messages*](../patterns/forms.md#error-messages-and-the-error-summary)); the field fills its container (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant (figma-standard rule 10); the popup is a part named for its family and last word, `Combobox list`, with its rows `Combobox option`, and inside the field's frames it keeps the last word, `List` (figma-standard rule 9).
- [required] The button sits last in auto-layout order, never pinned to the right edge, so a right-to-left page puts it at the inline end, where the project mirrors (figma-standard rules 33 and 50).

**Properties**
- [required] `Label`, `Value`, `Placeholder`, `Description` and `Error message` are text properties named as the code's props are; `Show description` sits directly above `Description` (figma-standard rules 5, 21 and 37).
- [required] `Has value` says whether text is in the field, the form figma-standard rule 21 gives content the component holds.
- [required] Each option's text lives in the list's slot, named for what it hosts (`Options slot`), never in text overrides on nested option instances, since options change variant as the active one moves (figma-standard rule 38).

**Variants and states**
- [required] The field's axes run `Size → Has value → Open → Validation → Disabled → State`; `Validation` lists `None` then `Error`; `Disabled` pairs only with Rest, and with Focus too where the code keeps it focusable; `State` runs `Rest → Focus → Hover → Press` (figma-standard rules 1 to 4 and 57), and `Open` sits before `Validation` (figma-standard rule 57).
- [weak] **`Press` stays**, where the [text input](text-input.md#in-figma) drops it: pressing a combobox's field opens the list, a change of its own, not only focus. MUI's input opens the popup on mouse down (`handleInputMouseDown`, [MUI useAutocomplete source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/useAutocomplete/useAutocomplete.js)).
- [required] **Open is a boolean.** Code holds it as a boolean: React Aria's `ComboBox` `isOpen`, exposed as `data-open` ([React Aria ComboBox.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/ComboBox.tsx)), MUI's `open` ([MUI useAutocomplete types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/useAutocomplete/useAutocomplete.d.ts)), `aria-expanded` on the input. Carbon's `ComboBox` kit reads no open property ([Carbon ComboBox.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ComboBox/ComboBox.figma.ts)); where a kit draws an open menu, it is a boolean, as Primer's `ActionMenu` `open` and Carbon's `MenuButton` `Open` ([button: *Variants and states*](button.md#in-figma)). The toolkit's research article drew it as one value on the field's `State` ([research: *Open menu triggers*](../../../research/components-and-naming/what-the-state-axis-models.md#open-menu-triggers)). figma-standard rule 57 takes the boolean, as code and the kits do. The field owns whether the list shows (figma-standard rule 7).
- [weak] The list's contents (options, no match, loading, "Create 'design-ops'") are one axis on `Combobox list`, not on the field, so the field's set does not multiply by every list state and no frame shows two at once (figma-standard rule 2's reasoning). The states themselves are in [combobox and autocomplete: *How*](#combobox-and-autocomplete).
- [strong] An option's active look is drawn distinctly from its selected one: the APG tells them apart as `aria-activedescendant` and `aria-selected`, and GOV.UK's research found people confusing focused with selected items in selects ([select (dropdown): *How*](select.md#select-dropdown)).
- [moderate] Active and selected are two properties on `Combobox option`, since code sets them independently and an option can be both: `Selected` a False/True variant, and active its `State=Focus`. React Aria's `ListBoxItem` sets `data-selected` and `data-focused` apart ([React Aria ListBox.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/ListBox.tsx)); Carbon's menu item kit draws `Selected` True/False beside a `State` that carries hover and focus ([Carbon MenuItem.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Menu/MenuItem.figma.ts)). Carbon puts the active look on `State`; Primer's single-select item draws `currentSelection` as a boolean read into `active` ([Primer ActionList.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/ActionList/ActionList.figma.tsx)), but that marks the current item (`aria-current`), a different concept from the active option. figma-standard rule 56 gives two code props two properties.

**Tokens**
- [required] Every fill, stroke, radius, gap and padding binds a semantic variable, never a primitive; text layers take text-role tokens (figma-standard rules 24, 28 and 29).
- [required] A state variant binds its own state's tokens (figma-standard rule 48); the field's border meets 3:1 against its surface (WCAG 1.4.11).
- [required] Component tokens, where the project has them, are `Component/Combobox/<Element>/<property>[-<variant>][-<state>]` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the field, the list and the option; the contract lists their axes, so one with no code counterpart shows in the parity report.
- *Judgement*: is there a frame for no match, and can the active option be told from the selected one without colour?

**Sources.** Carbon, React Aria and MUI for the custom-value prop and the popup's messages; React Aria, MUI and the Carbon and Primer kits for `Open`, React Aria and Carbon for the option's properties; figma-standard rules 7, 9 and 38 for the parts.

## Alignment with code

**Structure**
- [strong] Code builds the combobox as one field component composing a text input, a toggle button and a popup list, and the page's three sets mirror its parts: `Combobox` the field, `Combobox list` the listbox, `Combobox option` its item. React Aria's `ComboBox` composes `Label`, `Input`, `Button`, a description, `FieldError` and a `Popover` with a `ListBox` ([React Aria ComboBox.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/ComboBox.tsx)); Carbon's `ComboBox` is one field with `titleText`, `helperText`, `invalidText` and its `items` ([Carbon ComboBox.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ComboBox/ComboBox.figma.ts)); MUI's `Autocomplete` must render "a `TextField` component or a compatible custom component" for its input, which brings the label, helper text and error ([MUI Autocomplete types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Autocomplete/Autocomplete.d.ts)).
- [moderate] Primer keeps the field outside: `Autocomplete` holds `Autocomplete.Input`, `Autocomplete.Overlay` and `Autocomplete.Menu`, placed in `FormControl` for the label and validation, and its kit draws the input as a nested `TextInput` with `label?` and `caption?` ([Primer Autocomplete.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Autocomplete/Autocomplete.figma.tsx)). Radix ships no combobox ([Radix packages](https://github.com/radix-ui/primitives/tree/main/packages/react)), so there is no bare control to mirror: the field set is the component, as in Carbon and React Aria.

**Mapping**
- [required] Each Figma axis maps to one attribute, property or pseudo-class, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Size` | `size` |
  | `Has value` | the input's value is not empty; `Placeholder` shows otherwise |
  | `Validation=Error`, `Error message` | `aria-invalid="true"`, and the `errorMessage` prop's text tied with `aria-describedby` |
  | `Disabled=True` | `disabled` on the input |
  | `State=Hover`, `Press`, `Focus` | `:hover`, `:active`, `:focus-visible`, set by the browser |
  | `Open=True` (*Variants and states*) | `aria-expanded="true"` on the input, the listbox shown; React Aria `data-open`, MUI `open` |
  | list contents (options, no match, loading) | the listbox's children, and the count in the status region |
  | `Combobox option` `State=Focus` | the active option, whose id is in `aria-activedescendant`; React Aria `data-focused` |
  | `Combobox option` `Selected=True` | `aria-selected="true"`; React Aria `data-selected` |
  | `Label`, `Description` | `label` and `description` props: the `label` element, and the description tied with `aria-describedby` (code-standard rule 15) |
  | `Show description` | whether a hint is passed |
  | `Value`, `Placeholder` | the input's `value` and `placeholder` |
  | `Options slot` | the listbox's options |

**States**
- [required] The browser sets the pointer and focus states on the input, and `:user-invalid` only where the input is `required` and left empty ([HTML: `:user-invalid`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-user-invalid)). A typed value that matches no option breaks no constraint the browser knows, so that error is `aria-invalid` from code.
- [required] Script sets the rest: `aria-expanded` for `Open`, `aria-activedescendant` for the active option and `aria-selected` for the chosen one ([APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)); React Aria also marks its root `data-open`, `data-focused` and `data-invalid` ([React Aria ComboBox.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/ComboBox.tsx)).
- [required] Code cannot reach Disabled with Error, nor Disabled with Open: a disabled input is barred from constraint validation and takes neither focus nor clicks ([HTML: the disabled attribute](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#attr-fe-disabled)), and Carbon's `ComboBox` runs `invalid` through the `useNormalizedInputProps` that drops it under `disabled` ([Carbon ComboBox source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ComboBox/ComboBox.tsx)).
- [moderate] Code reaches focus with error whenever a person returns to fix the field, and Carbon gives it a class of its own, `combo-box--invalid--focused` ([Carbon ComboBox source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ComboBox/ComboBox.tsx)); the field set draws it, since `Validation` sits beside `State`; an `Open=True` frame carries the focus ring, since the input keeps focus while the list shows.

**Differences**
- [required] `Open` is a boolean in code (`isOpen`, `open`, `aria-expanded`) and in the kits that draw an open menu (*Variants and states*; figma-standard rule 57).
- [weak] An `Open=True` frame is drawn with the focus ring; React Aria also renders the toggle button pressed while the list shows (`isPressed: state.isOpen`, [React Aria ComboBox.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/ComboBox.tsx)), so a project on it draws the `Open` frame's button in its pressed look.
- [required] `Disabled` and `Validation` are axes of their own where Carbon's kit puts `Disabled`, `Error`, `Warning` and `Read-only` in one `State` ([Carbon ComboBox.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ComboBox/ComboBox.figma.ts)); code sets each as a prop (figma-standard rules 1 and 57).
- [required] Carbon's `Warning` and `Read-only` (its kit, above) and MUI's `multiple`, a combobox of several values shown as chips, are drawn only where the project's code renders them (figma-standard rule 51).
- [moderate] `Label` and `Placeholder` take the common prop names; Carbon's are `titleText` and `placeholder`, the latter drawn in its kit as `Filter text`, and the mapping row is where they meet (figma-standard rule 21).

**Check**
- *Script*: the component contract lists the field's, the list's and the option's axes beside the code's props and parts; a list state or option state with no code counterpart shows in the parity report (design-code-parity).
- *Judgement*: does the project's library put the label inside its combobox or around it, and does the Code Connect file follow?

**Sources.** React Aria, Carbon, MUI, Primer and Radix source and Code Connect files as linked; the APG combobox pattern; the HTML standard for `:user-invalid` and disabled controls.

## In code

**Element**
- [required] An `input` with `role="combobox"`, `aria-expanded`, `aria-controls` and `aria-activedescendant`, controlling a `listbox` of `option`s, enhanced from a native `select` or an `input` with a `datalist`, as [combobox and autocomplete: *Build*](#combobox-and-autocomplete) sets out ([APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/); code-standard rules 8 and 20).
- [moderate] `aria-autocomplete="list"` for the default behaviour, suggestions shown and the person picking; React Aria sets exactly that on its input (React Aria useComboBox) and the APG documents it as list autocomplete.

**Props**
- [strong] `value` (or `defaultValue`), `inputValue`, the options, `onChange`, a custom-value flag, `disabled`, a validation prop, `placeholder`, `size`, and the no-results and loading text. MUI (`freeSolo`, `loading`, `loadingText`, `noOptionsText`, `size`), Carbon (`allowCustomValue`, `typeahead`, `invalid`, `warn`, `placeholder`, `readOnly`, `size`) and React Aria (`allowsCustomValue`, `isInvalid`, `defaultFilter`; [React Aria ComboBox](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/ComboBox.tsx)) share this shape.
- [weak] The filter is a prop with a locale-aware default, as React Aria's `defaultFilter` is, so a project can add synonyms ("UK" finds "United Kingdom") without forking the component.

**Check**
- *Script*: the parity loop compares each field variant and the list's states with their frames (design-code-parity); the component contract flags a Figma axis with no prop.
- *Judgement*: does the active option stay visible while the arrow keys move it through a long list?

**Sources.** The APG combobox pattern; Carbon, React Aria and MUI source as linked; React Aria, MUI, the Carbon and Primer kits and the toolkit's state-axis research for `Open`.
