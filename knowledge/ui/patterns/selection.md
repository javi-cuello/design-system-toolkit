# Selection controls

How a person picks one value or several: choosing the control, visible listboxes, option tiles, multi-selects, dual listboxes, select all and clear all, date entry and time entry. It serves the principles *discoverable* (few choices stay in sight), *as little as possible, and no simpler* (the lightest control that holds the set) and *people in control* (nothing changes until the person expects it to). It applies design-standard rule 4 (a facet of up to four choices is segmented, a longer one a menu), design-standard rule 5 (an option that leads nowhere is disabled, not hidden) and design-standard rule 12 (a collapsed filter menu names what "all" covers). Which control switches content, view or value in general is [interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice); whether a change saves itself or waits for a button is [interaction: saving](../design/interaction.md#saving-explicit-or-automatic); a filter bar's layout and facet controls are [filtering](filtering.md#facet-controls)'s. The controls with pages of their own are [checkbox](../components/checkbox.md), [radio](../components/radio.md), [switch](../components/switch.md), [select](../components/select.md), [combobox](../components/combobox.md), [segmented control](../components/segmented-control.md) and [slider](../components/slider.md). Chips are [chips](chips.md)'s: filter, choice and input chips, removal and overflow, and how they differ from badges and tags; a choice chip is built as a segmented control.

## Choosing the control

**Use when / don't use**
- [weak] Use before drawing any control that picks a value: it decides which control's page applies ([checkbox](../components/checkbox.md), [radio](../components/radio.md), [switch](../components/switch.md), [select](../components/select.md), [combobox](../components/combobox.md), [segmented control](../components/segmented-control.md), [slider](../components/slider.md)) or which section below. Choosing between tabs, a segmented control and a menu for a view or a filter is [interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice).

**How**

Two questions decide almost every case: **how many values can hold at once**, and **does the choice act now or wait for a submit**. Then the count of options sets the control.

| The person picks | Acts | Control | Why |
|---|---|---|---|
| one of 2–4 | at once (a view, a filter) | segmented control | all choices in sight; past four it wraps (design-standard rule 4) |
| one of 2–5 | with a form | radio buttons | all choices in sight, nothing applies until submit ([NN/g, Kaley 2020](https://www.nngroup.com/articles/listbox-dropdown/): radios for "5 or fewer") |
| one of about 6–15 | either | select (a menu) | a list too long to scan as radios; [NN/g](https://www.nngroup.com/articles/listbox-dropdown/) accepts either control from 5 to 15 |
| one of very many, or a value the person already knows | either | combobox with autocomplete, or a plain text field | scrolling a long list is slower than typing ([NN/g dropdowns, Li 2017](https://www.nngroup.com/articles/drop-down-menus/); [Baymard](https://baymard.com/blog/drop-down-usability)) |
| any of a few | with a form | checkboxes | every option and its state visible |
| any of many | either | multi-select: a combobox that adds input chips, or a filtered checkbox list | a select cannot show several picks ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/): "Dropdown lists do not support multiselect") |
| on or off, taking effect now | at once | switch | a switch promises immediacy ([NN/g, Kendrick 2018](https://www.nngroup.com/articles/toggle-switch-guidelines/)) |
| on or off, saved with a form | with a form | a single checkbox | a checkbox promises a submit ([NN/g, Nielsen 2004](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/), guideline 12) |

- [weak] A kind that needs a title and a line of description to be chosen well is [option tiles](#option-tiles-and-picking-a-kind-in-a-dialog).
- [moderate] Two more rules sit over the table. Before choosing any long-list control, ask whether a question earlier in the flow could cut the list ([GOV.UK select](https://design-system.service.gov.uk/components/select/): "try asking users questions which will allow you to present them with fewer options"). And a set with one remaining option is not a choice: show it as text, or preselect it ([Baymard](https://baymard.com/blog/drop-down-usability)).
- [contested] The option count at which a list gets a search box. Seven: HubSpot's select adds one itself, "A search bar will be automatically included when there are more than seven options" ([HubSpot select](https://developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/standard-components/select)), and Iterable's Aurora asks for "a typeahead search at the top of the dropdown menu" at "7 or more options" ([Aurora select](https://aurora.iterable.com/latest/components/inputs/input-select/design-DIE51cqe)). Ten: Customer.io's Pluma, "Use the search for lists longer than 10 items" ([Pluma select](https://pluma.customer.io/components/select/design)). Fifteen to twenty for a filter facet: Baymard ([filtering: *Long value lists*](filtering.md#long-value-lists-truncation-and-a-filter-box)). Carbon and the Home Office set no count: Carbon's combo box is for a list that "may be very long or not predefined" ([Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/)), and the Home Office notes "for other services 30 options may be a long list" ([Home Office, long lists](https://design.homeoffice.gov.uk/design-system/patterns/help-users-to/long-lists)).

**Cases**
- Four delivery speeds in a checkout form → radios: all in sight, nothing applies until Continue.
- A country picker as 200 radios → a combobox with autocomplete; the person knows the value.
- A switch for "Email me a weekly summary" in a form with Save → a checkbox: the switch promises an instant effect the form does not deliver.
- A select with one remaining option → show it as text.

**Accessibility**
- [required] 1.3.1 Info and Relationships (a group's question is its `legend` or name), 2.1.1 Keyboard, 3.2.2 On Input (a control in a form changes nothing until submit).

**Build**
- [required] Each row of the table has one native starting point: radios and checkboxes are `input`s in a `fieldset`, a select is `select`, a switch is a checkbox with `role="switch"`, a segmented control is a `role="group"` of `button`s with `aria-pressed` (radios styled as segments inside a filter form, [segmented control](../components/segmented-control.md#segmented-control)), and a combobox or multi-select enhances a `select`, a `datalist` or a checkbox list (code-standard rule 8).
- [weak] Controls that differ in kind are separate components, never variants of one ([figma-handoff: variants to attributes](../../code/figma-handoff.md#variants-to-attributes)).
- [weak] The enhanced controls' roles, states and keys are [accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set).

**Check**
- *Script:* could flag a `select` with fewer than three options or more than fifteen with no type-ahead, radios past five, and a switch inside a form with a submit button.
- *Judgement:* does the choice act now or wait for a submit, and how many values can hold at once?

**Sources:** NN/g, Baymard and GOV.UK as linked. The counts disagree at the edges. NN/g puts the radio-to-list boundary at five; [Baymard](https://baymard.com/blog/drop-down-usability) calls a drop-down "a poor choice for offering fewer than 5 or more than 10 options"; GOV.UK sets no count and treats a select as "a last resort". Five as the radio ceiling and fifteen as the select ceiling are NN/g's, and radios win over a select whenever there is room, as [NN/g's 2004 guideline 8](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/) does ("If possible, use radio buttons rather than drop-down menus"). This section owns the counts for value controls; the segment limit is design-standard rule 4. For the search-box count, Primer's SelectPanel guidelines, Cloudscape's select and the UK Intelligence Community select page were opened and gave no count (Cloudscape's and the IC page's text did not load); the counts above are from vendor systems that each speak for their own product.

## Visible listbox

**Use when / don't use**
- [weak] Use for one choice from about five to fifteen options that people make often, or change often, where the room is there: a listbox shown open costs no click to see the options ([NN/g listboxes vs dropdowns](https://www.nngroup.com/articles/listbox-dropdown/): "Low interaction cost") and "The ability to see multiple options at once can speed up decision making".
- [weak] Use when no option is a sensible default; NN/g's table says "There’s not a clear or optimal default option. Use a listbox."
- [weak] Don't use when space is short; listboxes "do tend to take up more screen space than dropdown lists" ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/)). A select is the compact form of the same choice.
- [weak] Don't use when the default suits most people and the alternatives should stay quiet; a closed dropdown is better there, since it works "to downplay alternatives and underemphasize the ability to make changes" ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/)).
- [weak] Don't use for fewer than about five options (radios), for very long lists (a combobox), or for commands; NN/g: "Use a button to trigger commands (verbs)."

**How**
- [weak] **Height** shows every option where they fit, so nothing hides below a scroll; past about ten rows it scrolls, and the selected option is scrolled into view when the list renders.
- [weak] **Selected** draws differently from focused and from rest by more than colour, the same distinction a select's popup needs ([select](../components/select.md#select-dropdown)).
- [weak] **Acts** like a select: in a form it waits for the submit; as a view switcher it applies at once and never changes context.
- [weak] **Several picks** are a filtered checkbox list, not a `select multiple` ([multi-select](#multi-select)). If a listbox of picks must scroll, show what is picked above it, as NN/g advises: "show selected items above the listbox as tokens or highlight the selected items in a nonscrollable list".
- [moderate] **Option names** short, and not all starting with the same word ([APG listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/): "Avoiding very long option names facilitates understandability and perceivability for screen reader users").
- [weak] **States:** rest, hover, focus, selected, disabled option, error on the field.

**Cases**
- An editor where people switch between eight templates many times a session → a visible listbox of eight rows; one click per switch instead of open-then-pick.
- A one-off "Country" choice shown as an open list of 200 → a combobox; the open list helps only when the options can be seen at once.
- A listbox in a form's side column that pushes the form far down on a phone → a select at that width; the space argument reverses on a small screen, where the side column stacks in reading order (design-standard rule 19).
- Options named "Report: weekly", "Report: monthly", "Report: yearly" → "Weekly", "Monthly", "Yearly" under a label that says "Report"; a shared prefix is read before every option.

**Accessibility**
- [required] 1.3.1 and 3.3.2: a visible, associated label. 2.1.1: arrows move and select, typing a letter jumps to an option; a native listbox does both. 3.2.2 On Input: selecting never navigates unannounced. 4.1.2: the selected option is exposed.
- [required] Implementation: code-standard rule 8 (the native `select`), code-standard rule 16 (it follows the theme), code-standard rule 20 (it submits without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- [required] A native `select` with a `size` above one: "If the value is greater than 1 or the multiple attribute is present, browsers render a scrolling list box that has the specified number of rows visible" ([MDN `select`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select)). `size` equals the option count where the list fits; groups are `optgroup`.
- [moderate] A custom list only where the native one cannot carry the content, built to the APG listbox ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- [weak] The narrow-screen swap is one control whose `size` the script sets from a media query, never two controls kept in step.
- [weak] Markup in [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* could check that every `select[size]` and `role="listbox"` has a label, and flag a `size` smaller than the option count when the count is ten or fewer.
- *Judgement:* Is this choice made often enough to earn the space an open list takes?

**Sources:** NN/g, APG and MDN as linked; they agree. NN/g notes listboxes are "relatively seldom used"; NN/g's own "Low interaction cost" is why they suit frequent choices.

## Option tiles and picking a kind in a dialog

**Use when / don't use**
- [moderate] Use option tiles (radio cards) when the person picks one of a few kinds and each needs more than a word to tell apart: a title and one line of description, or an icon that shows the kind. Carbon: "Selectable tiles are used to present different options for users to select from"; "Use single-select tiles when the user can only select one tile" ([Carbon tile](https://carbondesignsystem.com/components/tile/usage/)). Radix ships them as RadioCards, "interactive cards where only one can be selected at a time" ([Radix radio cards](https://www.radix-ui.com/themes/docs/components/radio-cards)); shadcn's choice card wraps a radio item, a title and a description in one label ([shadcn radio group](https://ui.shadcn.com/docs/components/radio-group)).
- [weak] Don't use tiles for short values that need no explanation: those are radios (in a form) or a segmented control (applying at once, [segmented control](../components/segmented-control.md#segmented-control)). Apple's segmented control in an inspector chooses "attributes" of an object ([Apple segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)).
- [weak] Don't use tiles when the kinds outgrow the space; a select (Apple's pop-up button, "a flat list of mutually exclusive options", "when space is limited", [Apple pop-up buttons](https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons)) with the description in the option or as the field's hint.
- [weak] Choice chips are for picking among values in place, not for a form's kind ([choice chips](../components/chip.md#choice-chips)); Material's segmented button covers "two and five items. For more complex choices, or more than five items, use chips" ([Android segmented button](https://developer.android.com/develop/ui/compose/components/segmented-button)), and is deprecated in Material 3 Expressive for the connected button group.

**How**
- [weak] **The kind first, then its fields.** When the kind decides what the rest of the dialog asks, pick it first and show only its fields after; Figma picks a property's type before its "Create component property" modal opens, and the modal then holds only a name, a default that depends on the type, and "Create property" ([Figma, explore component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)). In one dialog: the kind as tiles or a segmented control at the top, the fields under it, the commit button at the bottom ([property editors](property-editors.md#property-editors)).
- [moderate] **Tiles in one grid, all one size.** Equal widths in a row and equal heights across it, sized from the longest title and description, never per tile. Apple: "keep segment size consistent"; for radios, "Measure the space needed to accommodate the longest button label, and use that measurement consistently" ([Apple toggles](https://developer.apple.com/design/human-interface-guidelines/toggles)). Radix's default grid is `repeat(auto-fit, minmax(160px, 1fr))` with a 16px gap (Radix radio cards).
- [moderate] **A tile shows its state more than by colour:** a radio dot or check in the tile (Carbon's single-select tiles show a radio icon), an accent border, and a faint accent fill ([visual: quiet chrome in a dense tool](../design/visual.md#quiet-chrome-in-a-dense-tool)). Text and icon at the dialog's sizes: the title at the body size in 600, the description in the secondary colour at the small size, an icon at 16 or 20px; a tile is not a hero card.
- [contested] **A default is selected.** NN/g: "Always offer a default selection for radio button lists" ([NN/g checkboxes vs radio buttons](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)); Apple: "Provide a useful default selection" (pop-up buttons). The most common kind, or the last one used.
- [moderate] **One size logic for every control in the dialog.** One control height for every field, select and segmented control (Carbon: "Individual input fields default to a 40px height in product regardless of context", sizes 32, 40, 48, [Carbon forms pattern](https://carbondesignsystem.com/patterns/forms-pattern/); [visual: one size scale per screen](../design/visual.md#one-size-scale-per-screen)); one column, labels above (Carbon: "Top-aligned labels are Carbon's default"); every field the column's width unless its answer has a known short length ([forms: field widths](forms.md#field-widths); Apple: "use consistent widths to create a more organized layout", [Apple text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)). A segmented control or tile grid spans the column like the fields under it, so every left and right edge in the dialog lines up. Material's dialog runs from 280 to 560px wide ([material-web dialog source](https://github.com/material-components/material-web/blob/main/dialog/internal/_dialog.scss)); Carbon puts "24px or even 16px between inputs" in modals.
- [weak] **Labels left only on a desktop tool's settings,** in a column: SwiftUI's columns form style is "a trailing aligned column of labels next to a leading aligned column of values" ([SwiftUI ColumnsFormStyle](https://developer.apple.com/documentation/swiftui/columnsformstyle)). A web dialog keeps labels above ([forms: labels](forms.md#labels)).

**Cases**
- A "New property" dialog lists Boolean, Text, Variant and Slot as a select, then shows every field for every type → the kind as four tiles (or a segmented control if the names say enough) at the top; only that kind's fields under it.
- Kind tiles are 180px tall with 24px icons and 16px titles above 32px fields with 12px labels → tiles a fixed multiple of the field height, the title at the body size, a 16 or 20px icon.
- Three tiles fit their text and differ in width → one grid, equal columns.
- A dialog mixes a 40px select, a 32px text field and a 28px segmented control, some full width and some not → one height, all at the column's width.
- The selected tile differs only by a pale tint → add the radio dot and the accent border.

**Accessibility**
- [required] 1.3.1 and 4.1.2: tiles are a radio group with a name (the question); each tile's title is its radio's label and its description the radio's description. 2.1.1: one tab stop, arrows move between tiles. 1.4.11: the selected tile's border and the radio dot meet 3:1; 1.4.1: selected is not colour alone.

**Build**
- [required] *Elements:* a `fieldset` with a `legend`, each tile a `label` wrapping an `input type="radio"` (visually reduced to its dot, never `display: none`), the title and the description; the description linked by `aria-describedby` (code-standard rule 15). Native radios give the arrow keys and the single tab stop (code-standard rule 8).
- [required] *States:* selected is styled from `:has(input:checked)` on the tile, focus from `:has(input:focus-visible)` (code-standard rule 9).
- [required] *Layout:* the tile grid `grid-template-columns: repeat(auto-fit, minmax(<token>, 1fr))` with equal rows (`grid-auto-rows: 1fr`); dialog controls read one height token (code-standard rule 22, code-standard rule 38).

**Check**
- *Script:* could assert every tile in a group has the same rendered width and height, every control in a dialog the same height and the same inline start and end, a default checked, and each tile's radio reachable by Tab with arrows moving between them.
- *Judgement:* does each kind need its description to be chosen well, or would a word in a segmented control do?

**Sources:** Carbon, Radix, shadcn, Apple, Material, NN/g, Figma and SwiftUI as linked. Radix and shadcn ship radio cards with no guidance on when; Carbon's selectable tiles are the one usage source. Primer and Apple allow up to five to seven segments where design-standard rule 4 allows four ([interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice)). No source sets a tile ceiling, so none is given. Well-regarded design-tool panels on Dribbble ([Dimply property panels](https://dribbble.com/shots/19866493-Dimply-UI-Builder-Property-Panels), [Stratis modal components](https://dribbble.com/shots/20649877-Stratis-UI-Modal-components)) were found but not viewed, since Dribbble refuses automated reads; they support nothing here.

## Multi-select

**Use when / don't use**
- [weak] Use when several values may hold and the list is too long for checkboxes, or grows ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/): "a multiselect listbox with checkboxes").
- [moderate] Use checkboxes instead when the options are few; every state stays visible.
- [moderate] Don't use `select multiple`: it needs a modifier key nobody discovers ([GOV.UK select](https://design-system.service.gov.uk/components/select/): use checkboxes instead).
- [moderate] Don't use a closed drop-down that hides what is picked ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/): "Do not use a dropdown list" for multiselect).

**How**
- [weak] Two shapes. **Combobox with input chips**: type to find, Enter to add, chips above or inside the field show what is picked. **Filtered checkbox list**: a search box over a scrolling list of checkboxes, best when people browse more than they type ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/): "a multiselect listbox with checkboxes").
- [weak] When collapsed, show the count and the first picks ("3 selected: Button, Card, …") ([Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/) shows a count tag).
- [weak] A clear-all once two or more are picked; select-all only where "all" differs from "none" ([Carbon](https://carbondesignsystem.com/components/dropdown/usage/)).
- [weak] Selected options keep their place in the list; they do not jump to the top while the list is open.

**Cases**
- A form asks for skills from a list of 60 → combobox with input chips; 60 checkboxes is a page of scrolling.
- A filter for "Components" with 40 options and checkboxes in a menu → keep it, show the count collapsed, and give the menu a search box.
- A multi-select whose picks vanish when it closes → show them as chips or a count; a hidden selection cannot be checked.

**Accessibility**
- [required] 1.3.1: the list is a group or a listbox with `aria-multiselectable`. 4.1.2: each option exposes its checked state. 4.1.3: adding or removing a value is announced. 2.1.1: every action by keyboard.
- [required] Implementation: code-standard rule 8, code-standard rule 14, code-standard rule 18, code-standard rule 20 (without script, a checkbox list in a `fieldset` submits). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- [required] The no-script form is a `fieldset` of checkboxes, which submits (code-standard rule 20); the enhancement adds a filter input that sets `hidden` on labels that do not match (code-standard rule 17), or turns it into a combobox with input chips.
- [required] A custom list is `role="listbox"` with `aria-multiselectable="true"` and `aria-selected` options ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- [weak] The collapsed label ("3 selected") is updated in the same handler that changes the selection; each add or remove is announced in a status element present from load.
- [required] Options are never re-sorted while the list is open; a removed chip's focus goes on (code-standard rule 14), and remove buttons are named (code-standard rule 18).

**Check**
- *Script:* could flag `select[multiple]`, check that a collapsed multi-select shows its count, and that every chip has a named remove button.
- *Judgement:* Do people browse this list or type into it?

**Sources:** NN/g, GOV.UK and Carbon agree; none sets the count at which checkboxes give way, so none is given.

## Dual listbox (transfer list)

**Use when / don't use**
- [weak] Use to pick several items from a long list when their **order** matters as well: NN/g, "Use a multiselect, dual listbox to accommodate both selection and reordering" ([NN/g listboxes vs dropdowns](https://www.nngroup.com/articles/listbox-dropdown/)). Report columns, a ranked shortlist, the steps of a sequence.
- [weak] Use when the chosen set must be reviewed apart from the pool; the second list gives "a clear overview of the items selected" ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/)).
- [weak] Don't use when order does not matter: a filtered checkbox list or a combobox with input chips does the same job in one list ([multi-select](#multi-select)).
- [weak] Don't use for a handful of items; checkboxes, with Up and Down beside each if order matters.
- [moderate] Don't put links, buttons or checkboxes inside the options; a listbox "does not provide an accessible way to present a list of interactive elements" ([APG listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)).

**How**
- [weak] **Layout.** "The listbox on the left holds available options and the listbox on the right represents selected items" ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/)); Add and Remove sit between them, Up and Down beside the chosen list. Below the width where both fit, the chosen list stacks under the available one (design-standard rule 19).
- [required] **Buttons** say what they do in text ("Add", "Remove", "Move up"), not arrows alone; each is disabled while it has nothing to act on (design-standard rule 5).
- [weak] **Labels** name each list and its count: "Available columns (14)", "Shown columns (4)".
- [weak] **Focus after a move** stays where the person is working. In the [APG rearrangeable example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/), "pressing Enter in the available options list leaves focus in the available options list", on the next option still present; moving an option up keeps focus on that option, so it can be moved again.
- [weak] **Confirmation.** A "Last change:" line under the lists says what moved, as the APG example does.
- [weak] **A long pool** gets a filter box above it; added items leave the pool rather than showing twice.
- [weak] **States:** each option rest, focus, selected; each button enabled and disabled; an empty chosen list says what to do ("No columns chosen").

**Cases**
- Choose which of 20 columns a report shows, and in what order → a dual listbox with Up and Down; the order is part of the answer ([tables: column choice and order](tables.md#column-choice-and-order) for which columns belong).
- Grant 6 of 12 permissions, order irrelevant → a checkbox list; the second list only adds travel.
- Add moves an item and focus jumps to the top of the pool → keep focus on the next remaining option; the person was working down the list.
- The move buttons are "›" and "‹" → write "Add" and "Remove"; arrows leave the direction to be guessed.

**Accessibility**
- [required] 4.1.2: two `listbox`es, each named, with `aria-multiselectable` where several can be picked; buttons named. 2.1.1: in the APG example Enter adds, Delete removes, Alt + Up and Alt + Down reorder, and the buttons expose these with `aria-keyshortcuts`. 2.4.3: focus as above. 4.1.3: the last change is announced.
- [required] Implementation: code-standard rule 8, code-standard rule 14 (focus survives the move), code-standard rule 18 (icon buttons are named), code-standard rule 20 (works without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- [required] The no-script form is a `fieldset` of checkboxes for the set, with a number field per item where order matters; it submits (code-standard rule 20).
- [moderate] The enhancement builds two `role="listbox"` lists to the APG example, focus on the listbox with `aria-activedescendant` on the active option; three or more buttons sit in a `role="toolbar"`, one tab stop ([accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex); [selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- [moderate] The "Last change" line is a status element present from load ([accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).
- [weak] One model holds both lists and the order; the hidden inputs the form submits are written from it in the same handler.

**Check**
- *Script:* could check both listboxes are named, every move button has a name, and, in a headless browser, that pressing Enter in the pool moves the option and leaves focus in the pool.
- *Judgement:* Does the order matter, or would one checkbox list do?

**Sources:** NN/g and APG as linked; they agree. None of the Carbon selection pages opened for this file documents a dual list, so the narrow-screen stacking applies design-standard rule 19.

## Select all and clear all

**Use when / don't use**
- [weak] Use select all on a list of options where picking all, or all but a few, is a real task: every permission for an administrator, every field in an export. Carbon offers it as a parent checkbox in a multiselect and says it "is not mandated to be present in all multiselect dropdowns" ([Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/)).
- [weak] Don't offer select all where all and none mean the same: "We recommend not to use the parent checkbox in scenarios like filters when choosing all and choosing none means the same" ([Carbon](https://carbondesignsystem.com/components/dropdown/usage/)).
- [weak] Use clear all once two or more options are picked ([multi-select](#multi-select)). Clearing a filter bar's applied filters is [filtering: applied filters and clear all](filtering.md#applied-filters-and-clear-all); selecting rows in a table, across pages, is [tables: selection and bulk actions](tables.md#selection-and-bulk-actions).

**How**
- [weak] **Select all** is a parent checkbox first in the list, set off from the options by a divider, and named for the set: "All permissions (12)". Its three states and click behaviour are the [checkbox](../components/checkbox.md#checkbox)'s indeterminate parent; this section does not repeat them.
- [weak] **Clear all** sits with the count of picks, in the field or the list's heading: Carbon's multiselect shows a tag "containing the total number of selected options" that "also provides a functionality to clear all the selected options" ([Carbon](https://carbondesignsystem.com/components/dropdown/usage/)).
- [required] **With a filter typed into the list,** select all acts on the options that match, and its label says so: "Select all 6 matching" (design-standard rule 17). Clearing the filter keeps the picks and shows the ones it hid (design-standard rule 18).
- [required] **Disabled options** are skipped by select all and stay in place (design-standard rule 5).
- [weak] **Long lists** keep select all in view while the options scroll.

**Cases**
- A "Severity" filter menu with a select-all box, where none checked shows everything → remove the box; Carbon's all-equals-none case.
- A role editor with 30 permissions where administrators get all → "All permissions (30)" as a parent checkbox; one click instead of thirty.
- The person types "button", presses select all, and 200 hidden options are picked → select the 6 matches and label the action with the number.
- Select all also checks two disabled options → skip them; a disabled option is one the person cannot choose.

**Accessibility**
- [required] 4.1.2: the parent exposes mixed when some are picked, and its name says what it covers ("Select all permissions"). 4.1.3: the new count is announced. 2.4.3: after clear all, focus stays on the list or moves to its first option, never to the page top.
- [required] Implementation: code-standard rule 12 (clear all renders only when there is something to clear), code-standard rule 14, code-standard rule 15 (the count is a description). In Figma: figma-standard rule 31 (checked, indeterminate and unchecked draw differently).

**Build**
- [moderate] The parent is a native checkbox; its `indeterminate` property and every child change in one handler, which touches only children that are neither `disabled` nor `hidden` by the filter ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- [required] Without script the parent is a checkbox with its own value that the server reads as "every option" (code-standard rule 20).
- [moderate] The count and the clear-all control update in the same handler; the count is written to a status element present from load ([accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).

**Check**
- *Script:* could filter a list, click select all, and assert only the visible, enabled options are checked; then assert the parent is mixed after one child is unchecked.
- *Judgement:* Does all differ from none here, and does anyone ever want all?

**Sources:** Carbon as linked. No NN/g, Baymard or Carbon page opened for this file says what select all should do while a filter is active; the matching-only rule is design-standard rule 17.

## Date and time entry

**Use when / don't use**
- [moderate] Use **separate day, month and year fields** for a date the person knows or can look up without a calendar: a date of birth, a passport issue date ([GOV.UK date input](https://design-system.service.gov.uk/components/date-input/); [Adam Silver](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/): "Use three separate text boxes for dates").
- [weak] Use a **calendar** only when the person needs a date in the near future or recent past, the day of the week, or dates seen against each other ([GOV.UK dates pattern](https://design-system.service.gov.uk/patterns/dates/)).
- [weak] Don't use drop-downs for day, month and year of birth ([NN/g, Li 2017](https://www.nngroup.com/articles/drop-down-menus/)).
- [weak] Don't make a calendar the only way in: "Never make a calendar control that depends on JavaScript as the only input option" ([GOV.UK](https://design-system.service.gov.uk/patterns/dates/)).

**How**
- [weak] **Three fields** in a `fieldset` whose `legend` is the question, with a hint giving an example ("For example, 27 3 2007"; GOV.UK picks a day of 13 or more and a month of 9 or less so the order is clear). Widths fit two, two and four characters. `inputmode="numeric"` for the number keypad.
- [required] **Date of birth** takes `autocomplete="bday-day"`, `"bday-month"` and `"bday-year"` ([GOV.UK](https://design-system.service.gov.uk/components/date-input/)) (WCAG 1.3.5).
- [weak] **Calendar** opens from a button beside a text field the person can type into; the typed value and the calendar stay in sync.
- [weak] **Errors** name the missing part ("Date of birth must include a year") or the impossibility ("must be a real date"), show only the highest-priority one, and mark only the parts in error ([GOV.UK](https://design-system.service.gov.uk/components/date-input/)).
- [weak] **Time** is [time entry](#time-entry)'s.

**Cases**
- A date-of-birth field opens a calendar on 2026 → three text fields; scrolling back decades through a calendar is the slowest route to a date the person knows.
- Booking an appointment next week → a calendar beside a typed field, with the day of the week shown; this is the case GOV.UK names.
- The year field rejects "07" → accept it with a clear rule, or the hint says four digits; either way the error says what to enter.
- A date range for a report filter → two typed date fields with a calendar each, the second unable to precede the first and saying so.

**Accessibility**
- [required] 1.3.1: the three fields share a `legend`; each has its own label (Day, Month, Year). 1.3.5: date of birth carries the `bday-*` tokens. 3.3.1 and 3.3.3: errors in text, naming the part. 2.1.1: a calendar is fully keyboard-operable or optional.
- [required] Implementation: code-standard rule 15 (the hint is a description), code-standard rule 20 (typing works without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- [required] Three text inputs in a `fieldset`, the hint on the `fieldset`'s `aria-describedby` (code-standard rule 15):
  ```html
  <fieldset aria-describedby="dob-hint"><legend>Date of birth</legend>
    <p id="dob-hint">For example, 27 3 2007</p>
    <label for="dob-day">Day</label> <input id="dob-day" name="dob-day" inputmode="numeric" autocomplete="bday-day">
    …month (bday-month), year (bday-year)…</fieldset>
  ```
- [moderate] Widths by the field's character variant ([forms: field widths](forms.md#field-widths)); `aria-invalid="true"` only on the parts in error.
- [weak] `input type="date"` only where its native picker suits the question; a custom calendar is a button beside the typed field opening a dialog with a day grid ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- [required] The server parses and validates the three parts; typing works with scripts off (code-standard rule 20).

**Check**
- *Script:* could check that day, month and year fields are grouped with a `legend`, carry `inputmode="numeric"`, and that a date of birth uses the `bday-*` tokens; that any calendar sits beside a text input.
- *Judgement:* Does the person know this date, or do they need to see it on a calendar?

**Sources:** GOV.UK and Silver agree on separate fields; GOV.UK notes that whether month names help "needs more research", so this file does not rule on it.

## Time entry

**Use when / don't use**
- [weak] Use a **text field** for a time the person knows: an appointment they were given, when something happened. Carbon's time picker is a text field: "Time pickers provide the user with a text field in which they can input the hour and minutes" ([Carbon date and time pickers](https://carbondesignsystem.com/components/date-picker/usage/)).
- [weak] Use a **list of slots** (radios, or a select past about five) when only some times can be booked. NN/g's advice for dates carries over: "For a limited number of date options, provide a list of the applicable dates" ([NN/g date input](https://www.nngroup.com/articles/date-input/)).
- [weak] Don't make a clock face or a scrolling wheel the only way in; the reason is GOV.UK's for calendars ([date and time entry](#date-and-time-entry)).
- [weak] A time that goes with a date sits beside the date's fields, which are the section above; this section adds only what is particular to time.

**How**
- [weak] **Format.** Carbon: "Both the 12-hour and 24-hour time systems are allowed. If using the 12-hour format it must be accompanied by an AM/PM selection." Pick one for the product and state it in the hint with an example ("For example, 9:30am or 2:15pm"). Carbon's field shows "the hour and minutes, for example 11:30".
- [weak] **Writing a time** in labels, hints and messages follows the [GOV.UK style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/): "5:30pm (not 1730hrs)", "midday (not 12 noon, noon or 12pm)", "midnight (not 00:00)", and "10am to 11am (not 10-11am)".
- [weak] **Midnight** is ambiguous at a deadline: GOV.UK, "Midnight is the first minute of the day, not the last", and suggests "11:59pm" instead.
- [moderate] **Time zone.** Carbon: "Specific times should specify a timezone", with an optional time zone select beside the field. GOV.UK adds "UK time" when the service serves people outside the UK.
- [required] **Typed input** is read generously: "9", "9am", "09:00" and "21:00" all mean something; reject only what cannot be a time, and say what to enter (design-standard rule 18).
- [weak] **Seconds** only where they matter.
- [weak] **A range that crosses midnight** (a night shift, 22:00 to 06:00) is accepted and shown as ending the next day, not rejected as end before start.

**Cases**
- "Register by midnight on 14 June" → "by 11:59pm on 14 June"; GOV.UK's example of a deadline read two ways.
- A product that states am/pm uses `input type="time"`, and some people see a 24-hour control → the browser chooses the display (below); use a text field where the product's convention must hold, or drop the stated convention.
- Delivery can be booked only in four two-hour slots → four radios naming the slots; a free time field invites times that will be refused.
- A meeting time shown to attendees in three countries → show the time zone with the time, as Carbon requires.

**Accessibility**
- [required] 1.3.1 and 3.3.2: a visible label, and the format hint associated as a description. 3.3.1 and 3.3.3: an error says what was wrong and gives an example. 2.1.1: any picker is keyboard-operable, or optional beside the typed field. 1.4.1: the am/pm choice is text, never colour.
- [required] Implementation: code-standard rule 8 (native inputs and selects), code-standard rule 15 (the hint is a description), code-standard rule 20 (typing works without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- [required] A text `input` with the hint on `aria-describedby`; an am/pm choice and a time zone, where used, are native `select`s beside it (code-standard rule 15; [forms: input types and autocomplete attributes](forms.md#input-types-and-autocomplete-attributes)).
- [required] `input type="time"` where the browser's display is acceptable: its value "is always in 24-hour format that includes leading zeros: `HH:mm`, regardless of the input format, which is likely to be selected based on the user's locale (or by the user agent)" ([MDN `input type="time"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time)). `step` is in seconds, default 60; a value not divisible by 60 adds seconds to the control.
- [required] A night range on `type="time"`: "By setting a `min` attribute greater than the `max` attribute, the valid time range will wrap around midnight" ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time)).
- [required] The server parses and validates the time; MDN warns "HTML form validation is _not_ a substitute for scripts that ensure that the entered data is in the proper format" (code-standard rule 20).
- [moderate] Field width by its character variant ([forms: field widths](forms.md#field-widths)).

**Check**
- *Script:* could check every time field has a label and a hint, flag a `type="time"` whose `step` adds seconds, and flag "12pm", "12am", "00:00" and "noon" in interface text.
- *Judgement:* Can any time be chosen, or only some?

**Sources:** Carbon, GOV.UK, MDN and NN/g as linked; NN/g's advice is about dates and is applied to times by analogy. Carbon writes "AM" and "PM" ("Use uppercase letters and no periods"); GOV.UK writes "5:30pm". The project's dialect decides: GOV.UK's form for British English, Carbon's for US convention.
