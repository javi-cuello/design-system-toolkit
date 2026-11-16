# Search input

A search input is the one-line field a person types a query into, to search a site or narrow a list. This page owns the search input as a component, in design, in Figma and in code: its element and landmark, the magnifier, the clear and submit buttons, Escape, and when it becomes a combobox. What spans search stays in [`../patterns/search.md`](../patterns/search.md): [the box's width, label and placeholder](../patterns/search.md#the-box-visible-wide-and-labelled), [placement](../patterns/search.md#placement), [instant or submitted](../patterns/search.md#instant-or-submitted), [keyboard](../patterns/search.md#keyboard) and [scoped search](../patterns/search.md#scoped-search); the form and its markup are [HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms). Everything it shares with the one-line field is the [text input](text-input.md)'s. Related: [combobox](combobox.md), [text input](text-input.md).

## Overview

**Use when / don't use**
- [moderate] A search input for a site search or a list's filter box; a field that picks one value from a list is a [combobox](combobox.md), even when people type into it.
- [moderate] A component of its own beside the text input: the type, the landmark, the magnifier and the clear behaviour come with it. SDS ships `Search` ([SDS Search.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Search/Search.tsx)), Carbon `Search` ([Carbon Search source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Search/Search.tsx)) and React Aria `SearchField` ([React Aria SearchField.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/SearchField.tsx)); MUI has none and passes `type` to `TextField` ([MUI TextField types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/TextField/TextField.d.ts)).

**Anatomy**
- [moderate] A label (visible or visually hidden), a leading magnifier, the field with the query or a short placeholder, a clear button at the inline end once there is text, and, for a submitted search, a submit button after the field. Carbon's renders a `label`, the magnifier, the `input` and a clear `button` (source above); SDS's a hidden `Label`, the `Input` and an icon button that is the magnifier when empty and the clear button when not (source above).
- [required] The label exists even where it is not shown: a magnifier and a placeholder are not a name ([search: the box](../patterns/search.md#the-box-visible-wide-and-labelled); WCAG 4.1.2).
- [required] A focus ring on the field (WCAG 2.4.7; figma-standard rule 39), a field and buttons at least 24 pixels (figma-standard rule 26).

## Search input

**Use when / don't use**
- [weak] Use the always-open box; an expandable search that starts as an icon only where width is truly short ([search: the box](../patterns/search.md#the-box-visible-wide-and-labelled)). Carbon ships it apart, as `ExpandableSearch` ([Carbon Search.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Search/Search.figma.ts)).

**How**
- [moderate] **`type="search"`** on the `input`: React Aria's `SearchField` defaults its `type` to `'search'` ([React Aria useSearchField](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/searchfield/useSearchField.ts)), SDS's `Search` renders `type="search"` (source above), and Carbon deprecated its `role` prop: "The `role` prop has been deprecated since <input type="search"> already provides correct semantics" ([Carbon Search source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Search/Search.tsx)). SDS is built on React Aria, so the two count as one source.
- [contested] **Where the `search` landmark goes.** MDN and the APG put it on the region that holds the search, around the form: the `search` element "is a semantic container for the `<form>`" ([MDN `search`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search)), and a search form takes the search landmark in place of the form one ([APG search landmark](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/search.html)). Carbon's `Search` puts `role="search"` on its own wrapper, so every instance is a landmark (source above). The toolkit keeps the landmark out of the component: the page wraps the form in `search` once, so a filter box in each of several lists does not add a landmark each. Where there are two, each has its own label (APG, above).
- [weak] **Magnifier** leads, decorative, since the label names the field; it is not the submit button unless it is a real, named button.
- [weak] **Placeholder** short and naming what can be found ("Search components"), the one field where a placeholder is fine ([text input: placeholder text](text-input.md#placeholder-text)).
- [weak] **Sizes** match the bar's controls: Carbon's search has `sm`, `md` and `lg` (Code Connect above) ([search: the box](../patterns/search.md#the-box-visible-wide-and-labelled)).

**Cases**
- A search box with `role="search"` on the `input` → `type="search"` on the input and the `search` element around the form; the role belongs to the region.
- Three list filters on one page, each a Carbon `Search` → three search landmarks; label each, or keep the landmark for the site search alone.
- A magnifier icon that submits but has no name → a `button type="submit"` named "Search", or a decorative icon and a separate submit.

**Accessibility**
- [required] 4.1.2: the input has a name independent of the placeholder. 1.3.1: the search region is a landmark, labelled where there is more than one. 1.4.11: the field's border at 3:1.
- [required] Implementation: code-standard rule 18 (icon-only buttons are named), code-standard rule 20 (a GET form that submits without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- [required] `<search><form method="get">`, a `label` (visually hidden if the design shows none), `<input type="search" name="q">`, and a submit `button`, as [HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms) sets out (code-standard rule 20).
- [weak] The landmark is the page's `search` element, outside the component; the component renders no `role="search"` of its own: the toolkit's pick from the contested *Where the `search` landmark goes* (MDN, APG, above).
- [moderate] `enterkeyhint="search"` gives phones the right key ([search: instant or submitted](../patterns/search.md#instant-or-submitted)); React Aria types `enterKeyHint` with `'search'` among its values (useSearchField, above).

**Check**
- *Script:* could flag a search `input` without `type="search"`, a `role="search"` on anything but the region around the form, and more than one search landmark without distinct labels.
- *Judgement:* is this a search, or a choice from a list that should be a combobox?

**Sources:** MDN and the APG for the landmark; React Aria, SDS and Carbon for the type; Carbon departs on the landmark, settled above.

## Clear and submit

**Use when / don't use**
- [moderate] A clear button once the field has text, gone when it is empty: Carbon hides it with no content (its `search-close--hidden` class), SDS swaps it for the magnifier (sources above).
- [weak] A submit button for a submitted site search; a list filter that runs as the person types needs none, though its form still submits on Enter ([search: instant or submitted](../patterns/search.md#instant-or-submitted)).

**How**
- [moderate] **The clear button is named** "Clear search": React Aria and SDS use those words (SDS is built on React Aria, so one source), Carbon "Clear search input" (sources above).
- [moderate] **Clearing returns focus to the field** and, for an instant filter, restores the full list. React Aria focuses the input on press start, so a phone keeps its keyboard (useSearchField, above).
- [moderate] **Escape clears** a field with text: React Aria clears on Escape and lets it through when the field is empty, so a dialog around it can still close (useSearchField, above); Carbon clears on Escape too (source above). With suggestions open, the first Escape closes them ([search: keyboard](../patterns/search.md#keyboard)).
- [contested] **Whether the clear button takes a Tab stop.** React Aria takes it out of the tab order (`excludeFromTabOrder: true`), since Escape does the same from the field (useSearchField, above); Carbon renders it as a plain `button`, in the tab order (source above). The toolkit keeps it in the tab order, so a keyboard user who does not know Escape can still clear, and it costs one stop only while there is text.
- [weak] **Enter submits**: natively in a form; React Aria calls `onSubmit` on Enter instead of the browser's submit when one is given (useSearchField, above).

**Cases**
- An unnamed "×" → "Clear search" (code-standard rule 18).
- Clearing with the mouse leaves focus on the vanished button → focus back in the field; a removed button drops focus to the page.
- SDS's empty-state magnifier is a button also named "Clear search", though it only focuses the field (source above) → a decorative icon, or a button named for what it does.

**Accessibility**
- [required] 4.1.2: the clear and submit buttons are named. 2.1.1: clearing works from the keyboard. 2.4.3: focus lands back in the field. 2.5.8: each button is at least 24 by 24.
- [required] Implementation: code-standard rule 18, code-standard rule 14 (focus is placed on purpose after clearing). Escape is the script's, since not every browser clears a search field on it ([HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).

**Build**
- [required] The clear button is `button type="button"` named "Clear search", shown only while the field has a value, which sets focus back on the `input` (code-standard rules 14 and 18).
- [moderate] Hidden while empty from CSS: `:placeholder-shown` where the field has a placeholder ([search: the box](../patterns/search.md#the-box-visible-wide-and-labelled)), or a data attribute such as React Aria's `data-empty` on its `SearchField` (source above). Hide the browser's own cross only when drawing one ([HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).
- [moderate] Escape is a `keydown` handler on the field that clears and stops the event only when there was text, as React Aria's does (useSearchField, above).
- [required] Submit is `button type="submit"`, named when icon-only (code-standard rule 18).

**Check**
- *Script:* could type, clear with the button and with Escape, and assert the field is empty, focus is in it, and an empty field's Escape reaches the dialog around it.
- *Judgement:* does this search need a submit, or does it filter as the person types?

**Sources:** React Aria, Carbon and SDS source as linked; they split on the clear button's tab stop, settled above.

## When a search becomes a combobox

**Use when / don't use**
- [moderate] A search input with a list of suggestions under it is a combobox: the APG's pattern, `role="combobox"` on the input with a popup `listbox` ([APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)). SDS builds its `Search` that way, on React Aria's `ComboBox` with a `Popover` and `ListBox` of results (source above).
- [weak] A search that only submits, or filters a list already on the page, stays a plain search input; the list it narrows is the page's content, not a popup.

**How**
- [moderate] **Suggestions follow the combobox page**: matching, keys, the no-results message and the status region are [combobox: combobox and autocomplete](combobox.md#combobox-and-autocomplete); their count and emphasis are [search: instant or submitted](../patterns/search.md#instant-or-submitted).
- [weak] **Enter on a suggestion** takes it; Enter with none highlighted submits the typed query, so the person can always search for what they typed.
- [weak] **One component per behaviour**: the plain search input and the search with suggestions share the field's look; the suggestion list is the combobox's popup, not an `Open` state of the search input.

**Cases**
- A site search that shows recent and popular queries under the box → the combobox pattern on the input; a `div` list under a plain input reads as nothing to a screen reader.
- A list filter that narrows a visible table as the person types → plain search input and a status region with the count; no popup.

**Accessibility**
- [required] 4.1.2: `role="combobox"`, `aria-expanded` and `aria-controls` once suggestions exist; 4.1.3: the count of suggestions is a status message; 2.1.1: arrow keys reach every suggestion (APG combobox, above).
- [required] Implementation: [accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set).

**Build**
- [required] The input keeps `type="search"` and gains `role="combobox"`, `aria-expanded`, `aria-controls` the `listbox`, and `aria-activedescendant` for the highlighted option; DOM focus stays in the input (APG combobox, above).
- [moderate] Without script it is the plain search form: the suggestions are an enhancement, never the only way to search (code-standard rule 20).

**Check**
- *Script:* could flag a search input with a visible popup list beside it and no `role="combobox"` or `aria-expanded`.
- *Judgement:* are the suggestions worth the extra keys, or would the results page do?

**Sources:** the APG combobox pattern; SDS for a search built on a combobox.

## In Figma

**Layers**
- [required] Auto layout throughout: the `Field` row holds `Leading icon` (the magnifier), `Value` and `Clear button`, then an optional `Submit button` after the field; a `Label` above, hidden by `Show label`, where the design shows one (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant (figma-standard rule 10); the clear and submit buttons are icon-button instances (figma-standard rule 27).
- [required] Leading and trailing parts sit in auto-layout order, never pinned, so the field mirrors where the project mirrors (figma-standard rule 50); the magnifier sits outside the `input` in code (component-validator rule W2).

**Properties**
- [required] `Value`, `Placeholder` and `Label` are text properties (figma-standard rules 21 and 37); the clear and submit buttons' names are text properties or annotations, since they are icon-only (figma-standard rule 40).
- [strong] `Has value` shows `Value` or `Placeholder`, as on the text input, and drives the clear button: `True` shows it, `False` hides it, so there is no separate `Show clear button` that could show a clear button on an empty field (figma-standard rule 30). SDS's kit draws `Value Type` (`Default`, `Placeholder`) ([SDS Search.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/Search.figma.ts)).
- [weak] `Show submit button` where the project has both submitted and instant searches; `Show label` where it shows a visible label in some places.

**Variants and states**
- [required] Axes in the order `Size → Has value → Disabled → State` (figma-standard rule 1); `Disabled` pairs only with Rest, and with Focus too where the code keeps it focusable (figma-standard rules 2 and 3); `State` runs `Rest → Focus → Hover`, as on the text input ([text input: *In Figma*](text-input.md#in-figma); figma-standard rule 4).
- [weak] No `Validation` axis by default: a search query is not validated, and neither SDS's nor Carbon's kit draws an error (Code Connect files above). A project whose search rejects input adds it as the text input has it.
- [weak] No `Open` state: suggestions are the combobox's popup ([when a search becomes a combobox](#when-a-search-becomes-a-combobox)). Carbon's `Expandable` and `Expanded` are drawn only where the project ships `ExpandableSearch`, as a set of its own (Carbon Search.figma.ts, above).
- [required] Sizes are `Size` with t-shirt values, largest first, matching the bar's controls (figma-standard rule 6).

**Tokens**
- [required] Every fill, stroke, radius, gap and padding binds a semantic variable; text takes text-role tokens (figma-standard rules 24, 28 and 29); the placeholder meets the contrast floor, since in a search box it says what can be found (figma-standard rule 32).
- [required] A state variant binds its own state's tokens (figma-standard rule 48); component tokens are `Component/Search input/<Element>/<property>[-<variant>][-<state>]` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above; the contract lists `Has value`, `Disabled` and `Size` for the parity report.
- *Judgement*: can a designer draw a clear button on an empty field? They should not be able to.

**Sources.** SDS and Carbon Code Connect files for the kit's properties; the text input page for the shared axes.

## Alignment with code

**Structure**
- [moderate] Code ships the search field as its own component in SDS, Carbon and React Aria, always with its label inside (a hidden `Label` in SDS, `labelText` in Carbon, `Label` in React Aria's `SearchField`; sources above); there is no bare-and-field split, so one `Search input` set with no `Show label` switch of components.
- [moderate] The search with suggestions is a different code component where the library separates them: React Aria's `SearchField` versus `ComboBox`, Carbon's `Search` versus `ComboBox` ([combobox: *Alignment with code*](combobox.md#alignment-with-code)). SDS's `Search` is the exception, a combobox always (source above); a project on SDS maps its `Search input` to that and records it.

**Mapping**
- [required] Each Figma axis maps to one attribute, property or pseudo-class, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Size` | `size` |
  | `Has value=False` | empty `value`; `Placeholder` is `placeholder`; styled from `:placeholder-shown` or React Aria's `data-empty` |
  | `Has value=True` | `value`; the clear button rendered |
  | `Disabled=True` | `disabled` on the `input`; the clear button disabled with it |
  | `State=Hover`, `Focus` | `:hover`, `:focus-visible`, set by the browser |
  | `Label`, `Show label` | the `label`, visible or visually hidden; never removed |
  | `Clear button` | a named `button type="button"`; Carbon `closeButtonLabelText` |
  | `Show submit button` | a `button type="submit"` in the form; React Aria `onSubmit` on Enter |

**States**
- [required] The browser sets hover, focus and `:placeholder-shown`; Escape and the clear button set the empty value from script. React Aria marks the field `data-empty`, `data-disabled`, `data-invalid` and `data-readonly` ([React Aria SearchField.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/SearchField.tsx)).
- [required] Code cannot reach a clear button on an empty field (Carbon hides it, SDS swaps it for the magnifier; sources above), which is why `Has value` drives it.
- [moderate] Code reaches focus with a value, the commonest frame of a search in use; the set draws it because `Has value` sits beside `State`.

**Differences**
- [weak] The landmark is not part of the component, where Carbon's `Search` renders `role="search"` on its own wrapper ([Search input](#search-input) for why).
- [weak] The clear button keeps its tab stop, where React Aria removes it ([clear and submit](#clear-and-submit)).
- [weak] Carbon's skeleton and `ExpandableSearch`, and React Aria's `isReadOnly` and `isInvalid` on a search field, are not drawn; a project that ships one adds it and records it here (toolkit reasoning).

**Check**
- *Script*: the component contract lists the set's axes beside the code's props; a clear button drawn on an empty field, or a set mapped to a combobox component with no line here, shows in the parity report (design-code-parity).
- *Judgement*: is the Figma set mapped to the plain search component or to the combobox, and does the behaviour match?

**Sources.** SDS, Carbon and React Aria source and Code Connect files as linked.

## In code

**Element**
- [required] A native `input type="search"` with its `label`, in a GET `form` inside the page's `search` element, the clear and submit buttons native `button`s ([HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms); code-standard rules 8 and 20).
- [moderate] Carbon, SDS and React Aria render the native `input` with `type="search"` (sources above; SDS rests on React Aria, so two sources); none renders a custom textbox.

**Props**
- [moderate] `value` (or `defaultValue`), `placeholder`, `disabled`, `size`, the label, an `onClear` and, for a submitted search, an `onSubmit` or a form around it. Carbon (`labelText`, `placeholder`, `size`, `closeButtonLabelText`, `onClear`, `autoComplete` defaulting to `off`; [Carbon Search source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Search/Search.tsx)), React Aria (`onSubmit`, `onClear`, `type`, `enterKeyHint`; [React Aria useSearchField](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/searchfield/useSearchField.ts)) and SDS (`placeholder`, `results`, `onSearch`; [SDS Search.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Search/Search.tsx)) share this shape.
- [weak] `name="q"` on the input, so the form's query lands in the address ([HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).

**Check**
- *Script*: the parity loop compares each variant's field, magnifier, clear button and ring with its frame (design-code-parity).
- *Judgement*: does the search still work with script off?

**Sources.** Carbon, React Aria and SDS source as linked; MDN and the APG for the landmark.
