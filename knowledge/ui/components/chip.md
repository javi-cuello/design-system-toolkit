# Chip

A chip is a compact, rounded control for one value: a value to filter by, a value the person entered and can remove, or one choice of a few. This page owns the chip as a component, in design, in Figma and in code: filter, choice and input chips, removal, overflow and wrapping. Telling a chip from a badge or a tag, and tags used as metadata or links, stay in [`../patterns/chips.md`](../patterns/chips.md) ([badges, pills, chips and tags](../patterns/chips.md#badges-pills-chips-and-tags-telling-them-apart), [tags as metadata and links](../patterns/chips.md#tags-as-metadata-and-links)); applied filters shown back as chips are [filtering](../patterns/filtering.md#applied-filters-and-clear-all)'s. Related: [badge](badge.md), [segmented control](segmented-control.md), [combobox](combobox.md), [checkbox](checkbox.md).

## Overview

**Use when / don't use**
- [weak] A filter chip for a small facet of values that may hold together, an input chip for values the person entered; a single choice is a segmented control. The cases are [*Filter chips*](#filter-chips), [*Choice chips*](#choice-chips) and [*Input chips and tag entry*](#input-chips-and-tag-entry).
- [contested] One component or several. MUI ships one `Chip` that turns removable when `onDelete` is set ([Chip types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Chip/Chip.d.ts)); Material Web ships four elements, `md-assist-chip`, `md-filter-chip`, `md-input-chip` and `md-suggestion-chip` ([Material chips](https://github.com/material-components/material-web/blob/main/docs/components/chip.md)); Carbon four tags, `Tag`, `DismissibleTag`, `SelectableTag` and `OperationalTag` ([Carbon tag source](https://github.com/carbon-design-system/carbon/tree/main/packages/react/src/components/Tag)). The toolkit splits where the element changes, a toggle against a value with a remove button, and keeps one component where only the look does ([when to split or merge a component](../../../research/components-and-naming/when-to-split-or-merge-a-component.md#component-or-value)).

**Anatomy**
- [strong] A container with a label and, optionally, a leading icon or avatar, a check when selected, or a trailing remove button: MUI (`label`, `icon`, `avatar`, `deleteIcon`), Material Web (icons, and an `avatar` on input chips), Carbon (`renderIcon`, a close button on `DismissibleTag`) and Figma's Simple Design System (`Label` and `Removable` on `Tag`, `Label` and an `Icon` swap on `TagToggle`; [SDS tag files](https://github.com/figma/sds/tree/main/src/figma/primitives/tag)).
- [moderate] Chips come in a set with a name: Material says chips "should always appear in a set", and SDS's `TagToggleGroup` holds a `Label` and a `TagToggleList`.
- [required] The chip, and its remove button where it has one, each show a focus ring and meet the 24-pixel target (figma-standard rules 26 and 39; WCAG 2.5.8).

## Filter chips

**Use when / don't use**
- [weak] Use for a small, flat facet where several values may hold at once and seeing them all helps: tags, platforms, a handful of categories ([Material chips](https://github.com/material-components/material-web/blob/main/docs/components/chip.md): filter chips are "tags or descriptive words" that narrow content).
- [required] Past four values in one facet, use a menu with counts instead (design-standard rule 4); a row of chips that wraps is the failure that rule was written from.
- [weak] Don't use filter chips where the screen already has a filter bar for the same list ([filtering: filter bar, sidebar or filter dialog](../patterns/filtering.md#filter-bar-sidebar-or-filter-dialog)); one list, one filter control.
- [weak] Applied filters shown back as removable chips are a different job, [filtering's](../patterns/filtering.md#applied-filters-and-clear-all).

**How**
- [moderate] A labelled set: the facet's name sits before the chips or labels the group (Material: label the chip set).
- [required] Selected shows by more than colour: a check mark appears and the fill changes; the chip's width allows for the check so selection does not reflow the row (design-standard rule 2).
- [required] Each chip carries its count where the list can count it (design-standard rule 11), and a value with nothing behind it is disabled with its zero, not removed (design-standard rule 5).
- [weak] Values combine by OR within the set, AND with other facets ([filtering](../patterns/filtering.md)).
- [moderate] Selecting a chip updates the list at once and keeps focus on the chip.

**Cases**
- Six platform chips wrap to two rows at 1024px → a menu with checkboxes (design-standard rule 4).
- Selecting "Web" widens the chip by the check mark and shifts every chip after it → reserve the check's space in every chip.
- The selected chip differs only by a blue fill → add the check mark (1.4.1).
- A chip for "iOS" disappears when another filter leaves no iOS rows → keep it, disabled, with "(0)" (design-standard rule 5).

**Accessibility**
- [required] 4.1.2 (each chip exposes pressed or checked), 1.4.1, 1.4.11 (the selected state differs at 3:1), 2.1.1, 2.5.8 Target Size, 4.1.3 (the new total announced).

**Build**
- [required] *Elements:* a `fieldset` with a `legend` holding `input type="checkbox"` and `label` pairs styled as chips, inside the list's GET form; or `button`s with `aria-pressed` in a labelled `role="group"` when script runs the filter (code-standard rule 20).
- [strong] *ARIA and keyboard:* checkbox semantics (Space toggles) or [APG button](https://www.w3.org/WAI/ARIA/apg/patterns/button/) toggle semantics (Space and Enter; the label does not change when the state does). Each chip is a Tab stop; a [toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) with roving focus is allowed for three or more chips but makes the set one Tab stop, which readers must discover.
- [required] *States:* `checked` or `aria-pressed="true"`; native `disabled` for a zero value; the selection as query parameters (code-standard rule 9).
- [required] *Rules:* code-standard rule 20 (works as a form without script), code-standard rule 9 and code-standard rule 62 (disabled is the control's own), code-standard rule 15 (counts are descriptions), code-standard rule 14 (focus kept after the list updates).
- [weak] *Detail:* [code: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set), [code: search and filter forms](../../code/html-semantics.md#search-and-filter-forms), [code: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 4 (more than four buttons in a group); could assert each chip exposes a pressed or checked state, the row's height and the chips' positions do not change on selection, and a zero-count chip is disabled, not absent.
- *Judgement:* Is the set small and stable enough to stay in sight, or will it grow past four?

**Sources:** Material as linked; design-standard rule 4 sets the limit, which Material does not.

## Choice chips

**Use when / don't use**
- [weak] A set where exactly one holds ("Daily", "Weekly", "Monthly"). In the toolkit this is a segmented control and is built as one ([selection: segmented control](segmented-control.md#segmented-control)); calling it chips does not change what it is.
- [weak] Carbon lets selectable tags stand in for form controls in a form made only of tags ([Carbon tag](https://carbondesignsystem.com/components/tag/usage/)); the toolkit keeps radios or a segmented control, so a choice looks like a choice.
- [required] Don't use choice chips for more than four options (design-standard rule 4) or where "none" is a valid answer without a "None" option.

**How**
- [moderate] One selected at all times once a choice is made, with a sensible default selected ([ux: defaults](../design/ux.md#defaults)).
- [weak] Joined or evenly spaced in one row; the selected one by fill plus weight or a check.
- [weak] Changing the choice applies at once for a view setting, or waits for Submit inside a form, as the surrounding form does.

**Cases**
- "Popular / New / Sale" drawn as separate chips where one must hold → a segmented control.
- A "Choose a size" row of seven chips → a radio group or a select; seven is past the limit.
- Two choice chips can be on at once because they were built as toggles → radios; the build must match the rule.

**Accessibility**
- [required] 1.3.1 (the set's label names the question), 4.1.2 (radio semantics: one checked), 1.4.1, 2.1.1.

**Build**
- [strong] *Elements:* a `fieldset` and `legend` with `input type="radio"` and `label`s styled as segments (WCAG 1.3.1).
- [required] *ARIA and keyboard:* native radio keyboard (arrows move the selection within the group; one Tab stop), the same as the [APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) describes for custom builds.
- [strong] *States:* `checked`; never `aria-pressed` on single-choice segments.
- [required] *Rules:* code-standard rule 9, code-standard rule 20, code-standard rule 16 (native controls follow the theme).
- [weak] *Detail:* [code: forms markup](../../code/html-semantics.md#forms-markup), [code: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set).

**Check**
- *Script:* could flag a group of chips with `aria-pressed` where only one can ever be pressed (should be radios), and a choice set of more than four.
- *Judgement:* Must exactly one hold? Then it is a radio group, whatever it looks like.

**Sources:** Carbon as linked; the toolkit departs from Carbon's tags-as-form-controls to keep one control per kind of choice.

## Input chips and tag entry

**Use when / don't use**
- [weak] Use for values the reader entered or picked in a multi-value field: people, labels, email addresses ([Material](https://github.com/material-components/material-web/blob/main/docs/components/chip.md): input chips are discrete pieces of information the user entered).
- [weak] Use with a combobox when values come from a known list, or free text when new tags are allowed ([selection: combobox and autocomplete](combobox.md#combobox-and-autocomplete), [selection: multi-select](../patterns/selection.md#multi-select)).
- [weak] Don't use input chips for a value set that is short and fixed; checkboxes show every option without typing.

**How**
- [weak] Chips sit inside or directly above the field, in the order entered; the text cursor follows the last chip.
- [weak] A value commits on Enter or on choosing a suggestion; comma or Tab committing is a choice to state in the design and keep everywhere.
- [moderate] Each chip has its own remove button with a name ("Remove Ada Lovelace"); Backspace in the empty field selects, then removes, the last chip, as a shortcut beside the button, never instead of it. Primer's token also removes on Backspace or Delete when focused ([Primer Token](https://primer.style/product/components/token/)).
- [moderate] A duplicate or invalid value is refused with a message on the field, not silently dropped ([forms: error messages and the error summary](../patterns/forms.md#error-messages-and-the-error-summary)).
- [weak] Values that differ in kind (a person, a team) may carry an avatar or icon, and keep the text.

**Cases**
- Pressing Backspace once in the empty field deletes a chip outright → select it first, remove on the second press, or rely on the remove button; one stray key should not lose a value.
- Typing an address that is already a chip adds a second copy → refuse it and say it is already added.
- The field accepts comma to commit, but a company name contains a comma → commit on Enter and suggestion only.
- A reviewer field shows 14 chips and the input is pushed to a fourth line → collapse to "+10 more" (next section).
- The values are an ordered set, where the order means something (a select's options, a variant axis's values, a priority list) → each chip can move as well as go: Shift with Left or Right moves the focused chip, a single-pointer control or the chip's drag does the same (WCAG 2.5.7), and the move is announced with the new position. A comma-separated text field is not this: it hides each value's edge, cannot refuse one duplicate, and cannot move one value. Infragistics' chip area reorders the focused chip with Shift+Left and Shift+Right ([Ignite UI chip](https://www.infragistics.co.kr/products/ignite-ui-angular/angular/components/chip)); Airtable's option editor shows a drag handle beside each option for its order ([Airtable single select](https://support.airtable.com/docs/single-select-field)). Where one of the values is the default, choosing the chip itself makes it so (a pressed state on the chip), rather than a second control listing the same values again.

**Accessibility**
- [required] 1.3.1 and 4.1.2 (the field has a label; chips are announced as values), 2.1.1 (every chip removable by keyboard), 3.3.1 Error Identification, 4.1.3 (a removal or addition announced), 2.5.8 (the remove target).

**Build**
- [required] *Elements:* a `label`led text `input` (with a `datalist` or a combobox popup for suggestions); chips as a `ul` of `li`, each holding the value text and a `button` named "Remove {value}"; the committed values also as hidden inputs, so the form submits them (code-standard rule 20).
- [strong] *ARIA and keyboard:* the [APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) for the input (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; Down Arrow opens, Escape closes, Enter accepts); remove buttons are ordinary Tab stops.
- [strong] *States:* `aria-expanded` on the combobox; `aria-invalid` and `aria-describedby` on a refused value; a polite live region for "Ada Lovelace added".
- [required] *Rules:* code-standard rule 18 (remove buttons are named), code-standard rule 14 (focus moves to the next chip or the input after a removal), code-standard rule 20 (values submit as form fields), code-standard rule 15.
- [weak] *Detail:* [code: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set), [code: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages), [code: focus management](../../code/accessibility.md#focus-management).

**Check**
- *Script:* could add and remove values by keyboard alone and assert every remove button has a name, focus lands on a neighbour after removal, a duplicate is refused with a described error, and the form submits every chip's value.
- *Judgement:* Is the value set open (tag entry) or closed (a multi-select would do)?

**Sources:** Material, Primer and APG as linked; they agree on removable values with named remove controls, and the toolkit adds the two-step Backspace to protect against a stray key.

## Removing chips, overflow and wrapping

**Use when / don't use**
- [weak] Applies to any set of chips that can grow: applied filters, input chips, tags on a row.
- [required] Don't let a growing set push other controls around (design-standard rule 2).

**How**
- [strong] **Remove:** a trailing "×" button inside the chip, at least a 24px target, named for what it removes; the whole chip is not the remove target unless the chip does nothing else (WCAG 2.5.8).
- [strong] **After removal:** focus moves to the next chip, or the previous when the last was removed, or the field or bar when none is left.
- [weak] **Clear all** appears after two or more removable chips in a filter context ([filtering](../patterns/filtering.md#applied-filters-and-clear-all)).
- [moderate] **Wrapping:** in a field or a content area, chips may wrap inside their own container, which grows downward without moving anything above it. In a toolbar or table cell, they do not wrap: show as many as fit and a "+3 more" control.
- [weak] **Overflow control:** "+3 more" is a button that opens the full list in a popover, or expands the row in place (Carbon's operational tag discloses overflow tags in a popover or modal, [Carbon tag](https://carbondesignsystem.com/components/tag/usage/)).
- [moderate] **Long labels:** truncate with an ellipsis and keep the full text available on hover and focus (Carbon); a static label that truncates must be focusable or the full text must sit elsewhere, since Atlassian notes an unfocusable lozenge hides its truncated text ([Atlassian lozenge](https://atlassian.design/components/lozenge/usage)).
- [weak] Friedman asks for at least 8px between interactive tags and generous touch targets ([Friedman](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/), commentary).

**Cases**
- Removing a chip leaves focus on the document body → move it to the next chip.
- Tags in a table cell wrap to three lines and double the row height → show two and "+4 more".
- A truncated user-defined tag "Accessibility review for…" is a static span with no way to read the rest → put the full text in the overflow popover or the row's detail.
- The "×" is a 12px glyph with chips 2px apart → a 24px target and 8px gaps.

**Accessibility**
- [required] 2.5.8 Target Size (remove targets, spacing), 2.4.3 Focus Order (focus after removal), 1.4.10 Reflow (wrapping, not horizontal scroll, inside a field at 320px), 1.4.13 Content on Hover or Focus (a full-text tooltip is dismissable and hoverable), 4.1.2.

**Build**
- [strong] *Elements:* a remove `button type="button"` inside each chip; "+3 more" a `button` with `aria-expanded` controlling a popover or the hidden chips.
- [strong] *ARIA and keyboard:* the overflow follows the [APG disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) (Enter or Space toggles, `aria-expanded`); a popover closes on Escape.
- [moderate] *States:* hidden chips carry `hidden`; truncation in CSS with the full text in the DOM, never cut in the template.
- [required] *Rules:* code-standard rule 18, code-standard rule 14, code-standard rule 17 (`hidden` beats the stylesheet), code-standard rule 19 (a `details`-based overflow adds Escape), code-standard rule 29 (truncation logic lives in the model, not the template).
- [weak] *Detail:* [code: truncation and line clamps](../../code/responsive.md#truncation-and-line-clamps), [code: touch targets](../../code/responsive.md#touch-targets), [code: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers).

**Check**
- *Script:* could remove each chip by keyboard and assert where focus lands, measure remove targets at 24px or more and gaps between interactive chips, and assert a table row's height does not grow with its tag count.
- *Judgement:* Where can this set grow, and what moves when it does?

**Sources:** Carbon, Atlassian and Friedman as linked. Friedman's 48px touch target is a mobile figure; the toolkit holds 24px as the floor (2.5.8) and asks for larger on touch screens.

## In Figma

**Layers**
- [required] Auto layout throughout; the chip hugs its label, and a set wraps or not as [*Removing chips, overflow and wrapping*](#removing-chips-overflow-and-wrapping) says (figma-standard rule 33).
- [required] Layers named for their role, the same in every variant: `Label`, `Icon`, `Avatar`, `Check`; the remove button is an icon button instance and keeps its name (figma-standard rule 10). Positions are `Leading` and `Trailing`, never left and right (figma-standard rule 21).
- [weak] The unselected filter chip holds the check's space in its padding, so turning Selected on swaps space for the check and the chip keeps its width ([*Filter chips*](#filter-chips); design-standard rule 2).
- [required] A set of chips holds them in a slot, `Chips slot`, since each chip carries its own label and has variants (figma-standard rules 21 and 38); a chip filling a slot is public, with no `_` (figma-standard rule 8).

**Properties**
- [required] `Label` is a text property; `Show icon` sits directly above `Icon`, and on an input chip `Show avatar` above `Avatar` (figma-standard rules 5, 21 and 37).
- [required] `Show remove button` reveals the remove button. SDS names it `Removable` ([SDS Tag.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/tag/Tag.figma.ts)); figma-standard rule 21 writes `Show` for a boolean that reveals a layer.
- [required] Every property drives a layer in every variant where that layer exists (figma-standard rule 30).

**Variants and states**
- [weak] Filter chip and input chip are two sets: one is a toggle, the other a value with a button, and one `Type` axis across them would pair states one side cannot have (figma-standard rule 2).
- [required] The filter chip's axes run `Size → Selected → Disabled → State`, `State` as `Rest → Focus → Hover → Press`; Disabled pairs only with Rest (figma-standard rules 1 to 4).
- [required] Selected differs from unselected by the check and the fill, never colour alone, and each state differs from its Rest sibling (figma-standard rule 31; WCAG 1.4.1).
- [weak] The input chip has no `Selected`; its states are the remove button's, an instance carrying its own, plus Focus on the chip where the chip itself takes focus, as Primer's token does for Backspace ([Primer Token](https://primer.style/product/components/token/)).
- [required] Sizes are `Size` with t-shirt values, largest first (figma-standard rule 6).

**Tokens**
- [required] Fill, stroke, radius, padding and gap bound to semantic variables (figma-standard rules 24 and 29); the label in a text-role token (figma-standard rule 28), meeting contrast in every state and mode (figma-standard rule 32).
- [required] The chip's boundary, where it identifies the control, and the check meet 3:1 against adjacent colours in every state (WCAG 1.4.11), and each state variant binds its own state's tokens (figma-standard rule 48).
- [required] Component tokens, where the project has them, follow figma-standard rule 49: `Component/Chip/Container/…`.

**Check**
- *Script*: figma-components-audit runs the rules cited above; the parity report compares the chip's boxes selected and unselected, which must match in width.
- *Judgement*: can a designer build every set on the page from the slot without detaching a chip?

**Sources.** MUI, Material Web, Carbon and SDS for the parts and the split; Primer for a focusable input chip. Where the systems split, the toolkit follows the element.

## Alignment with code

**Structure**
- [contested] Code splits chips three ways: one component whose element changes by prop (MUI's `Chip` renders a button base when `clickable` or `onDelete` is set, a `div` otherwise; [Chip.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Chip/Chip.js)), one component per job (Carbon's four tags, *Overview*), or a collection with items (React Aria's `TagGroup` holds a `TagList` of `Tag`s, a `grid` with selection and an optional remove button; [useTagGroup](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/tag/useTagGroup.ts), [useTag](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/tag/useTag.ts)).
- [moderate] Kits do not always mirror their code's split: Carbon's Figma `Tag` carries a `Dismissible` boolean that Code Connect turns into a separate `DismissibleTag` ([Tag.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tag/Tag.figma.ts)), while `SelectableTag` is a set of its own ([SelectableTag.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tag/SelectableTag.figma.ts)); SDS draws `Tag` and `TagToggle` as two sets over two code components ([Tag.tsx](https://raw.githubusercontent.com/figma/sds/main/src/ui/primitives/Tag/Tag.tsx), [TagToggle.figma.ts](https://raw.githubusercontent.com/figma/sds/main/src/figma/primitives/tag/TagToggle.figma.ts)). This page's two sets, filter chip and input chip, split where SDS does: a toggle against a value with a remove button.
- [moderate] The set is a component where the code holds selection on it: SDS's `TagToggleGroup` wraps a `Label` and a `TagToggleList` ([TagToggleGroup.figma.ts](https://raw.githubusercontent.com/figma/sds/main/src/figma/primitives/tag/TagToggleGroup.figma.ts)), and React Aria gives each tag its `aria-selected` from the group's selection manager ([useGridListItem](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/gridlist/useGridListItem.ts)). The `Chips slot` mirrors that group ([*In Figma*](#in-figma), Layers).

**Mapping**
- [required] Each Figma property maps to one prop or attribute, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)). SDS maps `Removable` to an `onRemove` handler and `Label` to children:

  | Figma | Code |
  |---|---|
  | `Size` | `size` |
  | `Selected=True` | `checked`, or `aria-pressed="true"` |
  | `State=Rest` | nothing |
  | `State=Hover`, `Press` | `:hover`, `:active`, set by the browser |
  | `State=Focus` | `:focus-visible` |
  | `Disabled=True` | `disabled` on the control |
  | `Label`, `Icon`, `Avatar` | the text, a leading icon (`aria-hidden`), an avatar |
  | `Show remove button` | a remove handler and a `button` named "Remove {label}" (code-standard rule 18) |
  | `Chips slot` | the chips, inside the set's `fieldset` or labelled group |

**States**
- [required] Rest, Hover, Press and Focus are set by the browser on the chip's control (the checkbox's label, the toggle `button`, or the remove `button`); no prop sets them, so each needs its frame (code-standard rule 9).
- [strong] Selected is set by code, in an attribute that differs by library: `aria-pressed` on Carbon's `SelectableTag` ([SelectableTag.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Tag/SelectableTag.tsx)), `aria-selected` on React Aria's grid rows ([useGridListItem](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/gridlist/useGridListItem.ts)), `checked` in this page's checkbox build. MUI's `Chip` has no selected prop at all ([Chip types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Chip/Chip.d.ts)), so a filter chip there switches `variant` by hand.
- [moderate] A removable chip takes focus itself: React Aria removes a focused tag on Delete or Backspace ([useTag](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/tag/useTag.ts)), and MUI's `Chip` does the same when `onDelete` is set ([Chip.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Chip/Chip.js)). So the input chip draws Focus on the chip as well as the remove button's own states ([*In Figma*](#in-figma), Variants and states).
- [contested] Whether a removable chip can also be selected: MUI's `Chip` and SDS's removable `Tag` carry no selected state ([Chip types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Chip/Chip.d.ts), [Tag.tsx](https://raw.githubusercontent.com/figma/sds/main/src/ui/primitives/Tag/Tag.tsx)), while a React Aria `Tag` can be both, selectable through its group and removable through `onRemove` ([useTagGroup](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/tag/useTagGroup.ts)). This page follows MUI and SDS, so the input set draws no `Selected`.

**Differences**
- [weak] One filter-chip set serves the checkbox build and the `aria-pressed` build; the Mapping row names both, and the project's context document records which its code uses ([*Filter chips*](#filter-chips), Build).
- [weak] `Show remove button` is a boolean in Figma where code shows the button when a handler is passed (MUI `onDelete`, SDS `onRemove`; [*In code*](#in-code), Props), since Figma has no handler; SDS's `Removable` stands in the same way.
- [weak] The chip carries no tone axis, where Carbon's tags map a twelve-hue `Color` to `type` ([Tag.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tag/Tag.figma.ts)): tone is the [badge](badge.md)'s, and a chip's look changes only with its state.

**Check**
- *Script*: the component contract lists each set's axes beside the chip's props; `Selected` on the input chip, or a selected prop with no frame, is a finding unless *Differences* names it (design-code-parity).
- *Judgement*: does each Figma set match one element in code, a toggle or a value with a remove button, and could a developer build every frame from the selected attribute and the browser's states?

**Sources.** MUI's Chip source and types, React Aria's useTagGroup, useTag and useGridListItem, Carbon's Tag Code Connect files and SelectableTag source, and SDS's Tag source and Code Connect files, all as linked. They split on one component, several or a collection, and on the selected attribute; they agree that a removable chip takes focus, and split on whether it can also be selected.

## In code

**Element**
- [required] A filter chip is a checkbox in a `fieldset` or a `button` with `aria-pressed`; an input chip is a list item holding the value and a named remove `button`. The markup is in [*Filter chips*](#filter-chips) and [*Input chips and tag entry*](#input-chips-and-tag-entry), Build (code-standard rules 9 and 20).
- [contested] What the set is. Material Web makes every chip set a toolbar, one Tab stop with arrows inside; Carbon's `SelectableTag` is a plain `button` with `aria-pressed`, each its own Tab stop ([SelectableTag.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Tag/SelectableTag.tsx)). The toolkit makes each chip a Tab stop and allows a toolbar from three chips ([*Filter chips*](#filter-chips), Build).

**Props**
- [strong] A label, an icon, a selected state, `disabled`, `size`, and a remove handler for a removable chip: MUI (`label`, `icon`, `avatar`, `onDelete`, `disabled`, `size`), Carbon (`text`, `renderIcon`, `selected`, `onChange`, `disabled`, `size`) and SDS (`Tag`'s `onRemove`, `scheme`, `variant`; `TagToggle`'s `iconStart`).
- [moderate] Removable is a handler, not a flag: MUI shows the delete icon when `onDelete` is set, and SDS renders its remove button only when `onRemove` is ([Tag.tsx](https://raw.githubusercontent.com/figma/sds/main/src/ui/primitives/Tag/Tag.tsx)).

**Check**
- *Script*: the parity loop compares each variant with its frame (design-code-parity); a test could select a chip and assert its box and its neighbours' did not move.
- *Judgement*: does each chip's element match its job: a toggle that filters, or a value that can be removed?

**Sources.** MUI, Material Web, Carbon and SDS sources as linked; they agree on the parts and split on one component or several, and on whether the set is one Tab stop.
