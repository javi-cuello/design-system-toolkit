# Chips, tags and badges

The small rounded labels an interface scatters across lists and fields, and which of them do something: telling a badge from a tag from a chip; filter chips, choice chips and input chips; removing chips, their overflow and wrapping; and tags as metadata and links. It serves the principles *discoverable* (what can be pressed looks pressable, and what cannot does not), *show state* (a selected chip reads as selected by more than colour) and *consistent, not uniform* (one look per job across the product). It applies design-standard rule 2 (chips never push the controls the reader is using), design-standard rule 4 (a facet past four values is a menu, not a row of chips) and design-standard rule 5. It supersedes the chips section selection.md used to hold, which now only points here. Status badges (Draft, Failed) are owned by [feedback: status badges and pills](feedback.md#status-badges-and-pills); applied filters shown as removable chips are [filtering: applied filters and clear all](filtering.md#applied-filters-and-clear-all); a single-choice set is built as [selection: segmented control](selection.md#segmented-control).

## Badges, pills, chips and tags: telling them apart

**Use when / don't use**
- **Badge:** static, never interactive; shows a status, a count or a change ("New", "3", "Draft"). Friedman treats badges as always static and never navigational ([Friedman, Badges vs. Pills vs. Chips vs. Tags](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/), commentary). Status badges are [feedback.md's](feedback.md#status-badges-and-pills); a count on a tab or nav item is a badge too.
- **Tag (static):** descriptive metadata that classifies an object: a topic, a category, a platform. Atlassian keeps tags for "lower-priority metadata" and its lozenge for status ([Atlassian tag](https://atlassian.design/components/tag/usage); [Atlassian lozenge](https://atlassian.design/components/lozenge/usage)).
- **Chip (interactive tag):** a tag that does something: filters, selects, or stands for a value the reader entered and can remove. Friedman calls chips and pills style names for interactive tags, and suggests a design system needs only two groups, static indicators and interactive elements.
- **Pill** is a shape, not a job; don't name a component for it.
- **Assist and suggestion chips** (Material's names for chip-shaped actions and suggested replies) are buttons, not selection or tags: build and style them as buttons ([actions](actions.md)).
- Don't let a static label and an interactive one look alike: GOV.UK refuses to make its tag a link or button because "interactive and non-interactive tags look the same" ([GOV.UK tag](https://design-system.service.gov.uk/components/tag/)); Carbon warns against one tag with several functions ([Carbon tag](https://carbondesignsystem.com/components/tag/usage/)).

**How**
- Give each job one look across the product: badges filled and compact with no border or hover; static tags subdued with no hover or pointer; chips with a border, a hover and a focus ring, so they read as controls.
- Name the components by job ("Status badge", "Filter chip", "Input chip"), as Friedman recommends, not by shape.
- Word static labels as adjectives or nouns ("Completed", "Colour"), never verbs, so nobody expects them to act (GOV.UK).
- Keep labels short and in sentence case; Atlassian truncates lozenges and tags past 200px and Carbon asks for under 20 characters where it can control the text.
- Carbon's tag types map onto the toolkit's: read-only tag = static tag; dismissible tag = input chip or applied-filter chip; selectable tag = filter chip; operational tag = the "+3 more" control (below).

**Cases**
- A table shows a grey "Colour" tag and, beside it, an identical grey "Colour" chip that filters on click → make the chip look like a control (border, hover) or make the tag a plain link; two looks for two jobs.
- A "Beta" badge on a nav item opens a menu on click → the badge stays static; the menu belongs to a button.
- The design system has Badge, Pill, Tag, Chip, Label and Lozenge → collapse to the jobs: status badge, count badge, tag, chip.
- A status shown as a tag in one place and a lozenge in another → status is a badge, everywhere ([feedback](feedback.md#status-badges-and-pills)).

**Accessibility**
- 1.4.1 Use of Color (category or status not by colour alone), 1.4.3 (label text contrast), 1.4.11 Non-text Contrast (a chip's boundary at 3:1 so it reads as a control), 4.1.2 Name, Role, Value (an interactive chip exposes a role; a static one exposes none). In Figma: figma-standard rule 31, figma-standard rule 32.

**Build**
- *Elements:* a badge or static tag is a `span` (or text inside a link or cell); a filter or choice chip is a `button` or a styled `input type="checkbox"`/`radio` with its `label`; an input chip is a `span` holding the value text and a separate remove `button`; a tag that navigates is an `a`.
- *ARIA and keyboard:* static labels have no role and are not focusable (Atlassian: lozenges cannot be focused). Interactive chips follow their control's APG pattern: [button](https://www.w3.org/WAI/ARIA/apg/patterns/button/) for toggles, checkbox or radio for selection.
- *States:* none on a static label; `aria-pressed`, `checked` or `aria-checked` on interactive chips; a count badge's number is part of a description, not the parent's name.
- *Rules:* code-standard rule 8 (the kind of component decides its implementation), code-standard rule 9 (a variant is an attribute, a state a pseudo-class), code-standard rule 15 (a count is a description, not part of a name).
- *Detail:* [code: links and buttons](../../code/html-semantics.md#links-and-buttons), [code: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions), [code: variants to attributes](../../code/figma-handoff.md#variants-to-attributes).

**Check**
- *Script:* could flag an element styled as a tag that has a click handler but no button or link role, a static tag with `cursor: pointer` or a hover style, and a chip whose boundary contrast is under 3:1.
- *Judgement:* For each rounded label: does it do anything? If it does, is it built and styled as that control; if not, is it plainly inert?

**Sources:** Friedman, GOV.UK, Atlassian and Carbon as linked; Primer's [Label](https://primer.style/product/components/label/) (contextual metadata) and [Token](https://primer.style/product/components/token/) (a compact, optionally removable representation of an object) split the same way. Carbon and Atlassian allow some tags to be interactive where GOV.UK allows none; the toolkit lets a tag be interactive only when it looks like a control.

## Filter chips

**Use when / don't use**
- Use for a small, flat facet where several values may hold at once and seeing them all helps: tags, platforms, a handful of categories ([Material chips](https://github.com/material-components/material-web/blob/main/docs/components/chip.md): filter chips are "tags or descriptive words" that narrow content).
- Past four values in one facet, use a menu with counts instead (design-standard rule 4); a row of chips that wraps is the failure that rule was written from.
- Don't use filter chips where the screen already has a filter bar for the same list ([filtering: filter bar, sidebar or filter dialog](filtering.md#filter-bar-sidebar-or-filter-dialog)); one list, one filter control.
- Applied filters shown back as removable chips are a different job, [filtering's](filtering.md#applied-filters-and-clear-all).

**How**
- A labelled set: the facet's name sits before the chips or labels the group (Material: label the chip set).
- Selected shows by more than colour: a check mark appears and the fill changes; the chip's width allows for the check so selection does not reflow the row (design-standard rule 2).
- Each chip carries its count where the list can count it (design-standard rule 11), and a value with nothing behind it is disabled with its zero, not removed (design-standard rule 5).
- Values combine by OR within the set, AND with other facets ([filtering](filtering.md)).
- Selecting a chip updates the list at once and keeps focus on the chip.

**Cases**
- Six platform chips wrap to two rows at 1024px → a menu with checkboxes (design-standard rule 4).
- Selecting "Web" widens the chip by the check mark and shifts every chip after it → reserve the check's space in every chip.
- The selected chip differs only by a blue fill → add the check mark (1.4.1).
- A chip for "iOS" disappears when another filter leaves no iOS rows → keep it, disabled, with "(0)" (design-standard rule 5).

**Accessibility**
- 4.1.2 (each chip exposes pressed or checked), 1.4.1, 1.4.11 (the selected state differs at 3:1), 2.1.1, 2.5.8 Target Size, 4.1.3 (the new total announced).

**Build**
- *Elements:* a `fieldset` with a `legend` holding `input type="checkbox"` and `label` pairs styled as chips, inside the list's GET form; or `button`s with `aria-pressed` in a labelled `role="group"` when script runs the filter.
- *ARIA and keyboard:* checkbox semantics (Space toggles) or [APG button](https://www.w3.org/WAI/ARIA/apg/patterns/button/) toggle semantics (Space and Enter; the label does not change when the state does). Each chip is a Tab stop; a [toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) with roving focus is allowed for three or more chips but makes the set one Tab stop, which readers must discover.
- *States:* `checked` or `aria-pressed="true"`; native `disabled` for a zero value; the selection as query parameters.
- *Rules:* code-standard rule 20 (works as a form without script), code-standard rule 9 and code-standard rule 62 (disabled is the control's own), code-standard rule 15 (counts are descriptions), code-standard rule 14 (focus kept after the list updates).
- *Detail:* [code: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set), [code: search and filter forms](../../code/html-semantics.md#search-and-filter-forms), [code: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 4 (more than four buttons in a group); could assert each chip exposes a pressed or checked state, the row's height and the chips' positions do not change on selection, and a zero-count chip is disabled, not absent.
- *Judgement:* Is the set small and stable enough to stay in sight, or will it grow past four?

**Sources:** Material as linked; design-standard rule 4 sets the limit, which Material does not.

## Choice chips

**Use when / don't use**
- A set where exactly one holds ("Daily", "Weekly", "Monthly"). In the toolkit this is a segmented control and is built as one ([selection: segmented control](selection.md#segmented-control)); calling it chips does not change what it is.
- Carbon lets selectable tags stand in for form controls in a form made only of tags ([Carbon tag](https://carbondesignsystem.com/components/tag/usage/)); the toolkit keeps radios or a segmented control, so a choice looks like a choice.
- Don't use choice chips for more than four options (design-standard rule 4) or where "none" is a valid answer without a "None" option.

**How**
- One selected at all times once a choice is made, with a sensible default selected ([ux: defaults](../design/ux.md#defaults)).
- Joined or evenly spaced in one row; the selected one by fill plus weight or a check.
- Changing the choice applies at once for a view setting, or waits for Submit inside a form, as the surrounding form does.

**Cases**
- "Popular / New / Sale" drawn as separate chips where one must hold → a segmented control.
- A "Choose a size" row of seven chips → a radio group or a select; seven is past the limit.
- Two choice chips can be on at once because they were built as toggles → radios; the build must match the rule.

**Accessibility**
- 1.3.1 (the set's label names the question), 4.1.2 (radio semantics: one checked), 1.4.1, 2.1.1.

**Build**
- *Elements:* a `fieldset` and `legend` with `input type="radio"` and `label`s styled as segments.
- *ARIA and keyboard:* native radio keyboard (arrows move the selection within the group; one Tab stop), the same as the [APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) describes for custom builds.
- *States:* `checked`; never `aria-pressed` on single-choice segments.
- *Rules:* code-standard rule 9, code-standard rule 20, code-standard rule 16 (native controls follow the theme).
- *Detail:* [code: forms markup](../../code/html-semantics.md#forms-markup), [code: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set).

**Check**
- *Script:* could flag a group of chips with `aria-pressed` where only one can ever be pressed (should be radios), and a choice set of more than four.
- *Judgement:* Must exactly one hold? Then it is a radio group, whatever it looks like.

**Sources:** Carbon as linked; the toolkit departs from Carbon's tags-as-form-controls to keep one control per kind of choice.

## Input chips and tag entry

**Use when / don't use**
- Use for values the reader entered or picked in a multi-value field: people, labels, email addresses ([Material](https://github.com/material-components/material-web/blob/main/docs/components/chip.md): input chips are discrete pieces of information the user entered).
- Use with a combobox when values come from a known list, or free text when new tags are allowed ([selection: combobox and autocomplete](selection.md#combobox-and-autocomplete), [selection: multi-select](selection.md#multi-select)).
- Don't use input chips for a value set that is short and fixed; checkboxes show every option without typing.

**How**
- Chips sit inside or directly above the field, in the order entered; the text cursor follows the last chip.
- A value commits on Enter or on choosing a suggestion; comma or Tab committing is a choice to state in the design and keep everywhere.
- Each chip has its own remove button with a name ("Remove Ada Lovelace"); Backspace in the empty field selects, then removes, the last chip, as a shortcut beside the button, never instead of it. Primer's token also removes on Backspace or Delete when focused ([Primer Token](https://primer.style/product/components/token/)).
- A duplicate or invalid value is refused with a message under the field, not silently dropped ([forms: error messages and the error summary](forms.md#error-messages-and-the-error-summary)).
- Values that differ in kind (a person, a team) may carry an avatar or icon, and keep the text.

**Cases**
- Pressing Backspace once in the empty field deletes a chip outright → select it first, remove on the second press, or rely on the remove button; one stray key should not lose a value.
- Typing an address that is already a chip adds a second copy → refuse it and say it is already added.
- The field accepts comma to commit, but a company name contains a comma → commit on Enter and suggestion only.
- A reviewer field shows 14 chips and the input is pushed to a fourth line → collapse to "+10 more" (next section).
- The values are an ordered set, where the order means something (a select's options, a variant axis's values, a priority list) → each chip can move as well as go: Shift with Left or Right moves the focused chip, a single-pointer control or the chip's drag does the same (WCAG 2.5.7), and the move is announced with the new position. A comma-separated text field is not this: it hides each value's edge, cannot refuse one duplicate, and cannot move one value. Infragistics' chip area reorders the focused chip with Shift+Left and Shift+Right ([Ignite UI chip](https://www.infragistics.co.kr/products/ignite-ui-angular/angular/components/chip)); Airtable's option editor shows a drag handle beside each option for its order ([Airtable single select](https://support.airtable.com/docs/single-select-field)). Where one of the values is the default, choosing the chip itself makes it so (a pressed state on the chip), rather than a second control listing the same values again.

**Accessibility**
- 1.3.1 and 4.1.2 (the field has a label; chips are announced as values), 2.1.1 (every chip removable by keyboard), 3.3.1 Error Identification, 4.1.3 (a removal or addition announced), 2.5.8 (the remove target).

**Build**
- *Elements:* a `label`led text `input` (with a `datalist` or a combobox popup for suggestions); chips as a `ul` of `li`, each holding the value text and a `button` named "Remove {value}"; the committed values also as hidden inputs, so the form submits them.
- *ARIA and keyboard:* the [APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) for the input (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; Down Arrow opens, Escape closes, Enter accepts); remove buttons are ordinary Tab stops.
- *States:* `aria-expanded` on the combobox; `aria-invalid` and `aria-describedby` on a refused value; a polite live region for "Ada Lovelace added".
- *Rules:* code-standard rule 18 (remove buttons are named), code-standard rule 14 (focus moves to the next chip or the input after a removal), code-standard rule 20 (values submit as form fields), code-standard rule 15.
- *Detail:* [code: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set), [code: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages), [code: focus management](../../code/accessibility.md#focus-management).

**Check**
- *Script:* could add and remove values by keyboard alone and assert every remove button has a name, focus lands on a neighbour after removal, a duplicate is refused with a described error, and the form submits every chip's value.
- *Judgement:* Is the value set open (tag entry) or closed (a multi-select would do)?

**Sources:** Material, Primer and APG as linked; they agree on removable values with named remove controls, and the toolkit adds the two-step Backspace to protect against a stray key.

## Removing chips, overflow and wrapping

**Use when / don't use**
- Applies to any set of chips that can grow: applied filters, input chips, tags on a row.
- Don't let a growing set push other controls around (design-standard rule 2).

**How**
- **Remove:** a trailing "×" button inside the chip, at least a 24px target, named for what it removes; the whole chip is not the remove target unless the chip does nothing else.
- **After removal:** focus moves to the next chip, or the previous when the last was removed, or the field or bar when none is left.
- **Clear all** appears after two or more removable chips in a filter context ([filtering](filtering.md#applied-filters-and-clear-all)).
- **Wrapping:** in a field or a content area, chips may wrap inside their own container, which grows downward without moving anything above it. In a toolbar or table cell, they do not wrap: show as many as fit and a "+3 more" control.
- **Overflow control:** "+3 more" is a button that opens the full list in a popover, or expands the row in place (Carbon's operational tag discloses overflow tags in a popover or modal, [Carbon tag](https://carbondesignsystem.com/components/tag/usage/)).
- **Long labels:** truncate with an ellipsis and keep the full text available on hover and focus (Carbon); a static label that truncates must be focusable or the full text must sit elsewhere, since Atlassian notes an unfocusable lozenge hides its truncated text ([Atlassian lozenge](https://atlassian.design/components/lozenge/usage)).
- Friedman asks for at least 8px between interactive tags and generous touch targets ([Friedman](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/), commentary).

**Cases**
- Removing a chip leaves focus on the document body → move it to the next chip.
- Tags in a table cell wrap to three lines and double the row height → show two and "+4 more".
- A truncated user-defined tag "Accessibility review for…" is a static span with no way to read the rest → put the full text in the overflow popover or the row's detail.
- The "×" is a 12px glyph with chips 2px apart → a 24px target and 8px gaps.

**Accessibility**
- 2.5.8 Target Size (remove targets, spacing), 2.4.3 Focus Order (focus after removal), 1.4.10 Reflow (wrapping, not horizontal scroll, inside a field at 320px), 1.4.13 Content on Hover or Focus (a full-text tooltip is dismissable and hoverable), 4.1.2.

**Build**
- *Elements:* a remove `button type="button"` inside each chip; "+3 more" a `button` with `aria-expanded` controlling a popover or the hidden chips.
- *ARIA and keyboard:* the overflow follows the [APG disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) (Enter or Space toggles, `aria-expanded`); a popover closes on Escape.
- *States:* hidden chips carry `hidden`; truncation in CSS with the full text in the DOM, never cut in the template.
- *Rules:* code-standard rule 18, code-standard rule 14, code-standard rule 17 (`hidden` beats the stylesheet), code-standard rule 19 (a `details`-based overflow adds Escape), code-standard rule 29 (truncation logic lives in the model, not the template).
- *Detail:* [code: truncation and line clamps](../../code/responsive.md#truncation-and-line-clamps), [code: touch targets](../../code/responsive.md#touch-targets), [code: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers).

**Check**
- *Script:* could remove each chip by keyboard and assert where focus lands, measure remove targets at 24px or more and gaps between interactive chips, and assert a table row's height does not grow with its tag count.
- *Judgement:* Where can this set grow, and what moves when it does?

**Sources:** Carbon, Atlassian and Friedman as linked. Friedman's 48px touch target is a mobile figure; the toolkit holds 24px as the floor (2.5.8) and asks for larger on touch screens.

## Tags as metadata and links

**Use when / don't use**
- **Static tags** classify an object where it is shown: a component's platforms, a page's topics.
- **Tags as links** when each tag has a page of its own listing everything that carries it (a docs site's topic pages). Carbon does not use tags as links ([Carbon tag](https://carbondesignsystem.com/components/tag/usage/)) and GOV.UK forbids it ([GOV.UK tag](https://design-system.service.gov.uk/components/tag/)); where tags link, they must look like links.
- Don't place tags inline in running text (Atlassian), and don't use a tag for status ([Atlassian tag](https://atlassian.design/components/tag/usage)); status is a badge.

**How**
- A fixed vocabulary per kind of tag, kept in one list so one idea never has two tags.
- Colour only when it carries meaning across the product; Carbon uses colour to tell categories apart, Atlassian reserves accent colours for user-made labels. With colour, keep text: never colour alone.
- A linking tag shows a link's cues (underline on hover, focus ring, pointer) and goes to a page titled with the tag; a filter-applying tag is a filter chip instead.
- Group a row of tags under a visible or programmatic label ("Topics").

**Cases**
- Topic tags on a docs page look like the filter chips on the index and navigate away → style them as links, or make them filter chips on the index only.
- "Accessibility", "A11y" and "Accessible" tags on one site → one tag; the vocabulary is the design.
- Category tags in six colours with no meaning behind the colours → one neutral colour, or document what each colour means.

**Accessibility**
- 2.4.4 Link Purpose (a link's text says where it goes: "Topic: Accessibility" where the context does not), 1.4.1, 1.3.1 (the tag list is a list with a label).

**Build**
- *Elements:* a `ul` of tags with a heading or `aria-label`; static tags as text in `li`, linking tags as `a` inside them.
- *ARIA and keyboard:* none beyond links; no APG pattern applies.
- *States:* none; a linking tag for the page being read carries `aria-current="page"`.
- *Rules:* code-standard rule 64 (current marked), code-standard rule 21 (modified clicks open a new tab), code-standard rule 8.
- *Detail:* [code: lists, description lists and figures](../../code/html-semantics.md#lists-description-lists-and-figures), [code: links and buttons](../../code/html-semantics.md#links-and-buttons).

**Check**
- *Script:* could list every tag's text across a site and flag near-duplicates by case and stem, and flag a tag with a link role that has no link styling cue.
- *Judgement:* Does the tag have a page worth visiting? If not, keep it static.

**Sources:** Carbon, GOV.UK and Atlassian as linked. Carbon and GOV.UK refuse linking tags; the toolkit allows them for topic pages only when they are styled as links, which answers GOV.UK's reason (looking the same as inert tags).
