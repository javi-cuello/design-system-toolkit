# Selection controls

How a person picks one value or several: checkboxes, radio buttons, switches, selects, visible listboxes, comboboxes, segmented controls, multi-selects, dual listboxes, select all and clear all, date entry, time entry, and sliders. It serves the principles *discoverable* (few choices stay in sight), *as little as possible, and no simpler* (the lightest control that holds the set) and *people in control* (nothing changes until the person expects it to). It applies design-standard rule 4 (a facet of up to four choices is segmented, a longer one a menu), design-standard rule 5 (an option that leads nowhere is disabled, not hidden) and design-standard rule 12 (a collapsed filter menu names what "all" covers). Which control switches content, view or value in general is [interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice); whether a change saves itself or waits for a button is [interaction: saving](../design/interaction.md#saving-explicit-or-automatic); a filter bar's layout and facet controls are [filtering](filtering.md#facet-controls)'s. This page owns the value controls and the segmented control component. Chips are [chips](chips.md)'s: filter, choice and input chips, removal and overflow, and how they differ from badges and tags; a choice chip is built as a segmented control (below).

## Choosing the control

**Use when / don't use**
- Use before drawing any control that picks a value: it decides which section below applies. Choosing between tabs, a segmented control and a menu for a view or a filter is [interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice).

**How**

Two questions decide almost every case: **how many values can hold at once**, and **does the choice act now or wait for a submit**. Then the count of options sets the control.

| The person picks | Acts | Control | Why |
|---|---|---|---|
| one of 2–4 | at once (a view, a filter) | segmented control | all choices in sight; past four it wraps (design-standard rule 4) |
| one of 2–5 | with a form | radio buttons | all choices in sight, nothing applies until submit ([NN/g, Kaley 2020](https://www.nngroup.com/articles/listbox-dropdown/): radios for "5 or fewer") |
| one of about 6–15 | either | select (a menu) | a list too long to scan as radios; [NN/g](https://www.nngroup.com/articles/listbox-dropdown/) accepts either control from 5 to 15 |
| one of very many, or a value the person already knows | either | combobox with autocomplete, or a plain text field | scrolling a long list is slower than typing ([NN/g dropdowns, Li 2017](https://www.nngroup.com/articles/drop-down-menus/); [Baymard](https://baymard.com/blog/drop-down-usability)) |
| any of a few (up to about ten) | with a form | checkboxes | every option and its state visible |
| any of many | either | multi-select: a combobox that adds input chips, or a filtered checkbox list | a select cannot show several picks ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/): "Dropdown lists do not support multiselect") |
| on or off, taking effect now | at once | switch | a switch promises immediacy ([NN/g, Kendrick 2018](https://www.nngroup.com/articles/toggle-switch-guidelines/)) |
| on or off, saved with a form | with a form | a single checkbox | a checkbox promises a submit ([NN/g, Nielsen 2004](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/), guideline 12) |

- A kind that needs a title and a line of description to be chosen well is [option tiles](#option-tiles-and-picking-a-kind-in-a-dialog), up to six.
- Two more rules sit over the table. Before choosing any long-list control, ask whether a question earlier in the flow could cut the list ([GOV.UK select](https://design-system.service.gov.uk/components/select/): "try asking users questions which will allow you to present them with fewer options"). And a set with one remaining option is not a choice: show it as text, or preselect it ([Baymard](https://baymard.com/blog/drop-down-usability)).

**Cases**
- Four delivery speeds in a checkout form → radios: all in sight, nothing applies until Continue.
- A country picker as 200 radios → a combobox with autocomplete; the person knows the value.
- A switch for "Email me a weekly summary" in a form with Save → a checkbox: the switch promises an instant effect the form does not deliver.
- A select with one remaining option → show it as text.

**Accessibility**
- 1.3.1 Info and Relationships (a group's question is its `legend` or name), 2.1.1 Keyboard, 3.2.2 On Input (a control in a form changes nothing until submit).

**Build**
- Each row of the table has one native starting point: radios and checkboxes are `input`s in a `fieldset`, a select is `select`, a switch is a checkbox with `role="switch"`, a segmented control is a `role="group"` of `button`s with `aria-pressed` (radios styled as segments inside a filter form, *Segmented control*), and a combobox or multi-select enhances a `select`, a `datalist` or a checkbox list (code-standard rule 8).
- Controls that differ in kind are separate components, never variants of one ([figma-handoff: variants to attributes](../../code/figma-handoff.md#variants-to-attributes)).
- The enhanced controls' roles, states and keys are [accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set).

**Check**
- *Script:* could flag a `select` with fewer than three options or more than fifteen with no type-ahead, radios past five, and a switch inside a form with a submit button.
- *Judgement:* does the choice act now or wait for a submit, and how many values can hold at once?

**Sources:** NN/g, Baymard and GOV.UK as linked. The counts disagree at the edges. NN/g puts the radio-to-list boundary at five; [Baymard](https://baymard.com/blog/drop-down-usability) calls a drop-down "a poor choice for offering fewer than 5 or more than 10 options"; GOV.UK sets no count and treats a select as "a last resort". The toolkit takes five as the radio ceiling, fifteen as the select ceiling, and prefers radios over a select whenever there is room, as [NN/g's 2004 guideline 8](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/) does ("If possible, use radio buttons rather than drop-down menus"). This section owns the counts for value controls; the segment limit is design-standard rule 4.

## Checkbox

**Use when / don't use**
- Use for any number of choices from a list, including none, in a form saved with a button.
- Use a single checkbox for one setting saved with the form, or an agreement ("I agree to the terms").
- Don't use when only one choice may hold; that is radios ([GOV.UK checkboxes](https://design-system.service.gov.uk/components/checkboxes/)).
- Don't use as an action that happens on click ([NN/g, guideline 12](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)); that is a switch or a button.

**How**
- **Label to the right** of the box, and the label is part of the target: clicking the text toggles the box ([Carbon checkbox](https://carbondesignsystem.com/components/checkbox/usage/); [NN/g guideline 11](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- **Group** related boxes in a `fieldset` whose `legend` asks the question ("How would you like to be contacted?"). On a one-question page the legend is the page heading ([GOV.UK](https://design-system.service.gov.uk/components/checkboxes/)). Add the hint "Select all that apply" only when people are likely to pick one by habit.
- **Stack vertically**, one per line ([NN/g guideline 6](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/); [Carbon](https://carbondesignsystem.com/components/checkbox/usage/): "When possible, arrange the checkbox and radio button groups vertically").
- **Wording** positive and active: "Send me updates", never "Don't send me updates" ([NN/g guideline 7](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- **Order** alphabetical by default, or most to least common where research shows a few answers dominate ([GOV.UK](https://design-system.service.gov.uk/components/checkboxes/)).
- **"None of these"** where none is a valid answer: last, after an "or" divider, and exclusive (checking it clears the others) ([GOV.UK](https://design-system.service.gov.uk/components/checkboxes/)).
- **Indeterminate and select all.** A parent box over a sublist shows checked when all children are, empty when none are, and indeterminate when some are; checking the parent checks every child, unchecking clears them ([Carbon](https://carbondesignsystem.com/components/checkbox/usage/)). Indeterminate is a display state only: clicking an indeterminate parent checks all. Leave out the parent in a filter where "all" and "none" mean the same ([Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/)).
- **States:** unchecked, checked, indeterminate, each with hover, focus, disabled and error.

**Cases**
- A form shows six interests as checkboxes in two columns → one column; two columns break the scan and the reader misses the second ([NN/g guideline 6](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- A table has a header checkbox to select rows and 3 of 20 are ticked → the header shows indeterminate; clicking it selects all 20, and the action bar says how many are selected.
- "Do not share my data" ticked by default → reword to "Share my data with partners", unticked; a negative label makes the person reason through a double negative.
- A checkbox labelled "Dark mode" applies the theme on click inside a settings page with no Save → a switch; a checkbox that acts at once breaks its promise.
- A list of dietary needs has no way to say "none" → add "None of these" last, behind a divider, exclusive; otherwise a person with no needs cannot answer a required question.

**Accessibility**
- 1.3.1 Info and Relationships: the group's question is the `legend`. 3.3.2 Labels or Instructions: each box has its own label. 4.1.2 Name, Role, Value: the indeterminate state is exposed as mixed ([W3C APG checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/): `aria-checked="mixed"`; a native box sets its `indeterminate` property). 2.1.1 Keyboard: Space toggles. 2.5.8 Target Size: the label extends the target.
- Implementation: code-standard rule 8 (the native `input type="checkbox"` inside the wrapper), code-standard rule 9 and code-standard rule 62 (disabled is the control's own), code-standard rule 15 (a hint is a description), code-standard rule 16 (native controls follow the theme). In a Figma component: figma-standard rule 26, figma-standard rule 31 (checked, indeterminate, hover, focus and disabled each draw differently), figma-standard rule 32.

**Build**
- A native `<input type="checkbox">` inside the wrapper with its `label` after it, the group in a `fieldset` with a `legend` (code-standard rule 8; [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- States are pseudo-classes: `:checked`, `:indeterminate`, `:focus-visible`, `:user-invalid`, and `:disabled` dimmed on the host through `:has(> :disabled)` (code-standard rule 9, code-standard rule 62).
- A custom look draws on the input itself (`appearance: none`) so it keeps focus and its form value; never a hidden input behind a drawn `span`. Native boxes follow the theme (code-standard rule 16).
- Indeterminate is the `indeterminate` property, set by the script; the parent and its children change in one handler ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- "None of these" clears the others in a `change` handler; without script the server rejects the combination with an error.

**Check**
- *Script:* could check that every checkbox has a programmatic label, that a group of two or more sits in a `fieldset` with a `legend` or a labelled `role="group"`, that clicking a parent sets every child, and that no checkbox `change` causes navigation or a request without a submit.
- *Judgement:* Is the wording positive, and does a valid "none" answer exist?

**Sources:** GOV.UK, Carbon and NN/g as linked; they agree on every point used here.

## Radio buttons

**Use when / don't use**
- Use for exactly one choice from two to about five, inside a form saved with a button.
- Use in preference to a select whenever there is room, since all options stay in sight ([NN/g guideline 8](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- Don't use when more than one may hold; that is checkboxes ([GOV.UK radios](https://design-system.service.gov.uk/components/radios/)).
- Don't use for a view or filter that applies at once; that is a segmented control (below).

**How**
- **Stacked vertically**, one per line. Inline only for two short options such as Yes and No, and they stack again on a small screen ([GOV.UK radios](https://design-system.service.gov.uk/components/radios/)).
- **Grouped** in a `fieldset` with a `legend` that asks the question; the same heading rule as checkboxes.
- **Selection at start.** In a question, preselect nothing. Once a radio is chosen the person cannot return to "no answer", so offer "I do not know" or "None of the above" where they are valid ([GOV.UK](https://design-system.service.gov.uk/components/radios/)). In a settings form, the current value is shown checked; that is the state, not a preselection.
- **Order** alphabetical by default, or by frequency; an "or" divider before an option that stands apart ([GOV.UK](https://design-system.service.gov.uk/components/radios/)).
- **Conditional reveal** only for a simple follow-up question, never for inline radios, and never to show anything other than a question; anything longer goes on the next page ([GOV.UK](https://design-system.service.gov.uk/components/radios/)).
- **States:** unselected, selected, each with hover, focus, disabled and error.

**Cases**
- Seven delivery options as radios → keep radios if the page has room and the options must be compared on price and time; a select hides the comparison behind a click. Past fifteen, a select.
- "Yes / No" with the first preselected → remove the preselection; GOV.UK found it makes people miss the question and submit the wrong answer.
- A "Country" question with 190 radios → a combobox with autocomplete; nobody scans 190 options ([Baymard](https://baymard.com/blog/drop-down-usability)).
- A settings page shows the theme as three radios and applies each on click with no Save → make it a segmented control, or keep radios and add a Save; radios promise a submit ([NN/g guideline 12](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)).
- A "How did you hear about us?" question with "Other" → reveal one text field under "Other"; a simple follow-up is what conditional reveal is for.

**Accessibility**
- 1.3.1: the question is the `legend`. 2.1.1: Tab enters the group once, arrow keys move and select, Space selects the focused radio ([W3C APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)); native radios with a shared `name` do this already. 3.2.2 On Input: selecting a radio never navigates or submits. 4.1.2: the checked state is exposed.
- Implementation: code-standard rule 8 (native `input type="radio"`), code-standard rule 9, code-standard rule 15, code-standard rule 20 (the form submits without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- Native `<input type="radio">`s sharing a `name` in a `fieldset` with a `legend`; the browser gives one tab stop and arrow-key selection, so no roving script ([APG radio group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)).
- No `checked` in a question; in a settings form, `checked` from the stored value.
- A conditional follow-up follows its radio in the DOM, shown by default; the script hides it on load and toggles `hidden` on `change` (code-standard rule 17, code-standard rule 20).
- No `change` handler that submits or navigates.
- States from `:checked`, `:focus-visible` and `:disabled` (code-standard rule 9); markup in [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* tools/ui-check/check.mjs does not limit radios: design-standard rule 4 counts only button groups (`aria-pressed` buttons or `button[role="radio"]`), and treats native radio inputs as a form question. A script could check that radios in a question start unchecked, that every group has a `legend`, and that a `change` causes no navigation.
- *Judgement:* Is this a value saved with a form, or a view that should apply at once?

**Sources:** GOV.UK says never preselect; [NN/g's 2004 guideline 9](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/) says "Always offer a default selection". The toolkit follows GOV.UK for questions, because its reasons are tested failures (missed questions, wrong answers), and keeps the checked current value for settings, where NN/g's concern (a group that never shows a state) applies.

## Switch (toggle)

**Use when / don't use**
- Use for a single setting with two opposing states that takes effect the moment it flips ([NN/g, Kendrick 2018](https://www.nngroup.com/articles/toggle-switch-guidelines/); [Primer toggle switch](https://primer.style/product/components/toggle-switch/guidelines/): "instant-save controls for boolean settings").
- Don't use inside a form that is saved with a button: people cannot tell whether the switch has acted ([NN/g](https://www.nngroup.com/articles/toggle-switch-guidelines/)). Use a checkbox there.
- Don't use for more than two states, or for states that are not opposites ([Carbon toggle](https://carbondesignsystem.com/components/toggle/usage/)).
- Don't use for an agreement or a choice that needs confirming.

**How**
- **Label** names the setting that is on when the switch is on: "Email notifications", "Show line numbers". Not a command ("Turn on notifications"), which reads wrong once on, and not the state alone. NN/g's test: say the label with "on" and "off" after it; if either sounds wrong, rewrite it ([NN/g](https://www.nngroup.com/articles/toggle-switch-guidelines/)).
- **State text** "On" / "Off" beside the switch where the track alone is ambiguous ([Carbon](https://carbondesignsystem.com/components/toggle/usage/): three words or fewer; [Primer](https://primer.style/product/components/toggle-switch/guidelines/)).
- **Feedback.** The new state shows at once. If saving takes time or fails, say so beside the switch ("Saving…", "Couldn't save. Retry") and return it to its old state on failure (`../design/interaction.md` *Saving*).
- **Grouped settings** are a list of switches, each its own row with its own label; never a switch that governs others without saying so.
- **States:** off, on, each with hover, focus, disabled; a pending state if saving is not instant.

**Cases**
- A profile form mixes switches with text fields and a Save button → replace the switches with checkboxes; NN/g's mixed-form failure ([Primer saving](https://primer.style/ui-patterns/saving) says the same: never mix save patterns in one form).
- A switch labelled "Enable" beside a section heading → label it with the setting ("Weekly summary email"); "Enable" names nothing when read alone.
- A switch for "Delete account data" → a button with a confirmation; a switch is for reversible settings, not consequential actions.
- A theme switch with three values (light, dark, system) → a segmented control; a switch holds two states.
- A switch flips, the request fails, and the switch stays on → revert it and say why; a switch that shows a state the system does not have breaks *show state*.

**Accessibility**
- 4.1.2: a switch exposes its state; a native checkbox with `role="switch"` reads as on and off. 3.2.2 On Input: flipping it changes a setting, never the context (no navigation, no new window). 1.4.1 Use of Color: on and off differ by thumb position, not colour alone. 1.4.11 Non-text Contrast (a [code candidate](../../code/candidates.md)) for the track and thumb.
- Implementation: code-standard rule 8 (the native control carries the state), code-standard rule 9, code-standard rule 14 (if the save re-renders the region, focus stays on the switch). In Figma: figma-standard rule 31 (on and off differ beyond colour; focus visible), figma-standard rules 26 and 32.

**Build**
- `<input type="checkbox" role="switch">` with a `label` that never changes with the state; visible "On" and "Off" text is `aria-hidden`, since `checked` is announced ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- On and off are `:checked`; a pending save is `aria-busy="true"` on the host, styled from that attribute (code-standard rule 9).
- The `change` handler saves; on failure it restores `checked` and writes the reason into a `role="status"` element beside the switch that was in the page from the start ([accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).
- Without script, the switch sits in a small form whose submit the script removes (code-standard rule 20); a re-render keeps focus on it (code-standard rule 14).

**Check**
- *Script:* could check that no `form` with a submit button contains a `role="switch"`, that every switch has a name, and that a switch's state change does not navigate.
- *Judgement:* Does the setting take effect now, and does the label read right with "on" and "off" after it?

**Sources:** NN/g and Primer keep switches out of submitted forms; [Carbon](https://carbondesignsystem.com/components/toggle/usage/) says toggles "are commonly used in forms" while also requiring "instant application". The toolkit follows NN/g and Primer, because a form's Save button and an instant switch make contradictory promises in one view. Primer asks for a label "describing the action" and warns against "state-descriptive labels"; NN/g asks for what the control does when on. Both are met by naming the setting.

## Select (dropdown)

**Use when / don't use**
- Use for one choice from about six to fifteen options, where space is short and the options need no side-by-side comparison.
- Don't use for fewer than about five; radios show them without a click ([Baymard](https://baymard.com/blog/drop-down-usability): 55% of test users opened an optional drop-down just to see its contents). [Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/): never for two options.
- Don't use when options must be compared (plans, delivery choices); radios with descriptions keep all in view.
- Don't use for very long lists or values the person knows by heart (country, date of birth): a combobox or text fields ([NN/g, Li 2017](https://www.nngroup.com/articles/drop-down-menus/)).
- Don't use a multiple select; use checkboxes ([GOV.UK select](https://design-system.service.gov.uk/components/select/)).

**How**
- **Native `select`** first. GOV.UK's research lists failures with selects: people "tried to type into the select", "confused focused items with selected items", could not close it, or did not know to scroll ([GOV.UK](https://design-system.service.gov.uk/components/select/)). A custom listbox repeats each of those unless it is built to the APG pattern.
- **Placeholder option.** In a form question, nothing is preselected ([GOV.UK](https://design-system.service.gov.uk/components/select/)): the first option is empty in value and says what to choose ("Choose a country"), and the field is required where an answer is. That option carries no information beyond the instruction ([Carbon](https://carbondesignsystem.com/components/dropdown/usage/): "Do not put important information in placeholder text"). A filter menu instead opens on the option that names what "all" covers (design-standard rule 12).
- **Label** visible above, like any field ([forms: labels](forms.md#labels)). A select without a visible label is read by tools/ui-check/check.mjs as a filter menu.
- **Order** by the person's logic: frequency, size, or time; alphabetical when there is none.
- **Unavailable options** stay in place, disabled (design-standard rule 5).
- **Chevron** inside the field keeps the field's inset (design-standard rule 9; [visual: iconography](../design/visual.md#iconography)).

**Cases**
- "Title: Mr / Mrs / Ms" as a select → drop the field, or radios if it is truly needed; Baymard's test users opened short drop-downs just to scan them.
- A 4-option "Sort by" in a filter bar → segmented, since it applies at once and holds four (design-standard rule 4).
- A select that navigates the moment an option is chosen → apply on a button, or announce the behaviour first; WCAG 3.2.2 forbids an unannounced change of context ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html), failure F36 for auto-submit).
- A "State" select on an address form → offer address lookup or a text field with autocomplete; Baymard found typing beats scrolling a state list.
- A select whose only remaining option after another choice is "Standard" → show "Standard" as text ([Baymard](https://baymard.com/blog/drop-down-usability)).

**Accessibility**
- 1.3.1 and 3.3.2: a visible, associated label. 3.2.2 On Input: changing the option never navigates or submits without warning. 2.1.1: a native select is keyboard-operable as shipped; a custom one follows the APG select-only combobox ([W3C APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)).
- Implementation: code-standard rule 8 (wrap the native `select`), code-standard rule 16 (its menu follows the theme), code-standard rule 20 (a filter select submits a GET form without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- A native `select` inside the wrapper (code-standard rule 8). In a question, the first option is `<option value="">Choose a country</option>` and the `select` is `required`.
- Groups are `optgroup`; an unavailable option is `<option disabled>`, kept in place.
- The chevron is drawn on the `select` itself (`appearance: none` with a background image and inline-end padding from tokens), so the native popup and keyboard stay; `color-scheme` themes the popup (code-standard rule 16).
- A filter select sits in a GET form with a submit the script removes (code-standard rule 20); the script applies the filter in place on `change`, never navigating away.
- Markup in [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 5 and design-standard rule 12 on selects without a visible label (it treats them as filter menus). It could also count options and flag a labelled form select of four or fewer, flag `select[multiple]`, and flag a `change` handler that navigates.
- *Judgement:* Would radios fit, and must these options be compared?

**Sources:** NN/g, Baymard and GOV.UK agree on avoiding selects for short and very long lists; they differ only on the exact count (above).

## Visible listbox

**Use when / don't use**
- Use for one choice from about five to fifteen options that people make often, or change often, where the room is there: a listbox shown open costs no click to see the options ([NN/g listboxes vs dropdowns](https://www.nngroup.com/articles/listbox-dropdown/): "Low interaction cost") and "The ability to see multiple options at once can speed up decision making".
- Use when no option is a sensible default; NN/g's table says "There’s not a clear or optimal default option. Use a listbox."
- Don't use when space is short; listboxes "do tend to take up more screen space than dropdown lists" ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/)). A select is the compact form of the same choice.
- Don't use when the default suits most people and the alternatives should stay quiet; a closed dropdown is better there, since it works "to downplay alternatives and underemphasize the ability to make changes" ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/)).
- Don't use for fewer than about five options (radios), for very long lists (a combobox), or for commands; NN/g: "Use a button to trigger commands (verbs)."

**How**
- **Height** shows every option where they fit, so nothing hides below a scroll; past about ten rows it scrolls, and the selected option is scrolled into view when the list renders.
- **Selected** draws differently from focused and from rest by more than colour, the same distinction a select's popup needs ([select](#select-dropdown)).
- **Acts** like a select: in a form it waits for the submit; as a view switcher it applies at once and never changes context.
- **Several picks** are a filtered checkbox list, not a `select multiple` ([multi-select](#multi-select)). If a listbox of picks must scroll, show what is picked above it, as NN/g advises: "show selected items above the listbox as tokens or highlight the selected items in a nonscrollable list".
- **Option names** short, and not all starting with the same word ([APG listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/): "Avoiding very long option names facilitates understandability and perceivability for screen reader users").
- **States:** rest, hover, focus, selected, disabled option, error on the field.

**Cases**
- An editor where people switch between eight templates many times a session → a visible listbox of eight rows; one click per switch instead of open-then-pick.
- A one-off "Country" choice shown as an open list of 200 → a combobox; the open list helps only when the options can be seen at once.
- A listbox in a form's side column that pushes the form far down on a phone → a select at that width; the space argument reverses on a small screen (toolkit commentary).
- Options named "Report: weekly", "Report: monthly", "Report: yearly" → "Weekly", "Monthly", "Yearly" under a label that says "Report"; a shared prefix is read before every option.

**Accessibility**
- 1.3.1 and 3.3.2: a visible, associated label. 2.1.1: arrows move and select, typing a letter jumps to an option; a native listbox does both. 3.2.2 On Input: selecting never navigates unannounced. 4.1.2: the selected option is exposed.
- Implementation: code-standard rule 8 (the native `select`), code-standard rule 16 (it follows the theme), code-standard rule 20 (it submits without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- A native `select` with a `size` above one: "If the value is greater than 1 or the multiple attribute is present, browsers render a scrolling list box that has the specified number of rows visible" ([MDN `select`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select)). `size` equals the option count where the list fits; groups are `optgroup`.
- A custom list only where the native one cannot carry the content, built to the APG listbox ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- The narrow-screen swap is one control whose `size` the script sets from a media query, never two controls kept in step.
- Markup in [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup).

**Check**
- *Script:* could check that every `select[size]` and `role="listbox"` has a label, and flag a `size` smaller than the option count when the count is ten or fewer.
- *Judgement:* Is this choice made often enough to earn the space an open list takes?

**Sources:** NN/g, APG and MDN as linked; they agree. NN/g notes listboxes are "relatively seldom used"; the toolkit keeps them for frequent choices, where their low interaction cost pays for the space.

## Combobox and autocomplete

**Use when / don't use**
- Use for one choice from a very long list (countries, people, components), or a list the person knows well enough to type ([Baymard](https://baymard.com/blog/drop-down-usability): autocomplete is "a well-performing alternative to a drop-down" for country).
- Use where the value may be new as well as chosen (a tag, a label) ([Carbon combo box](https://carbondesignsystem.com/components/dropdown/usage/): "select from a list of suggested options or type in their own custom value").
- Don't use for a short list; radios or a select are simpler.
- Don't use when any free text is acceptable and no validation is needed; a plain text field is simpler still.

**How**
- **Model.** A text input with a popup list ([W3C APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)). Pick one of the APG's autocomplete behaviours and keep it: list with manual selection (suggestions shown, the person picks) is the safe default; inline completion and automatic selection suit expert tools.
- **Matching.** Match anywhere in the option text, accept common synonyms and abbreviations ("UK" finds "United Kingdom"), and ignore case and accents.
- **Keyboard.** Down Arrow enters the list, Enter accepts, Escape closes the popup; Alt + Down opens it without moving focus ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)).
- **No results.** Say so in the popup ("No countries match 'Atl'"), never an empty box.
- **Without script.** Start from a native `select` or a text input with a `datalist` and enhance it, so the form still works.
- **Small screens.** The popup sits below the field and the field scrolls into view above the on-screen keyboard.
- **States:** empty, typing with suggestions, no match, selected, error, disabled.

**Cases**
- A country field as a 250-option select → a combobox enhancing the select; Baymard and NN/g both favour typing for countries.
- A people picker that only finds names from their start ("Ann" misses "Mary-Ann") → match anywhere in the string.
- A combobox that selects the first suggestion on blur → leave the typed text and show an error on submit if it matches nothing; silent selection fills in a value the person never chose.
- A tag field that accepts new values → show "Create 'design-ops'" as the last option, so creating is explicit.

**Accessibility**
- 4.1.2: `role="combobox"` with `aria-expanded`, `aria-controls` and `aria-activedescendant` on the active option, per the APG. 4.1.3 Status Messages: the number of results is announced in a polite live region. 2.1.1: the keys above. 1.3.5 Identify Input Purpose where the field asks about the person (a country of residence takes `autocomplete="country-name"`).
- Implementation: code-standard rule 8 (behaviour-heavy only after native options are ruled out), code-standard rule 19 (Escape and light dismiss are built, not assumed), code-standard rule 20 (works without script). A composite role shipped with its keyboard is a [code candidate](../../code/candidates.md). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- Start from a native `select` or an `input` with a `datalist`, then enhance to the APG combobox: focus stays in the `input`, `aria-activedescendant` moves through the `listbox` ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- The result count goes into a polite status element present from load ([accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).
- Matching ignores case and accents with `Intl.Collator` at `sensitivity: 'base'` in the model, never a lower-cased string comparison ([i18n: locale-aware sorting](../../code/i18n.md#locale-aware-sorting)).
- A remote search is debounced and aborts the previous request ([javascript: debouncing input](../../code/javascript.md#debouncing-input)).
- Escape and a click outside close the popup in the script (code-standard rule 19); nothing is selected on blur; with scripts off the form still submits (code-standard rule 20).

**Check**
- *Script:* could check `role="combobox"` with `aria-expanded` and `aria-controls`, that Escape closes the popup, that a no-match message appears, and that the field is a working native control with script disabled.
- *Judgement:* Is the list long enough to need typing, and does matching find what people type?

**Sources:** APG, Baymard and Carbon as linked; they agree.

## Segmented control

**Use when / don't use**
- Use for a facet of two to four short choices that apply at once: a view, a filter, a sort (design-standard rule 4).
- Don't use inside a form that saves with a button; radios carry that promise ([Primer segmented control](https://primer.style/product/components/segmented-control/guidelines/): "similar to radio inputs but without needing form submission").
- Don't use past four choices; a menu with counts (design-standard rule 4, design-standard rule 11).
- Don't use as navigation between pages; that is tabs or links (`navigation.md`).

**How**
- One choice is always selected; a filter control has a segment that shows everything ([Primer](https://primer.style/product/components/segmented-control/guidelines/)). The selection applies on click.
- Labels short and of similar length; icons only with a text name for assistive tech ([Primer](https://primer.style/product/components/segmented-control/guidelines/): "must have a text label, even if the label is only accessible to screen readers").
- On a small screen, a control that no longer fits becomes a menu ([Primer](https://primer.style/product/components/segmented-control/guidelines/)); it never wraps.
- The control keeps its size when its selection changes (design-standard rule 2).
- **States:** selected and unselected, each with hover, focus, disabled.

**Cases**
- Five sort orders as segments → a menu; Primer would allow five, design-standard rule 4 does not.
- Light, Dark, System for a preview → segmented; three choices applying at once.
- A segmented control in a settings form with Save → radios; segments promise immediacy.
- A segment for a filter value with no matching rows → disabled in place (design-standard rule 5).

**Accessibility**
- 1.3.1 and 4.1.2: a group of `button`s with `aria-pressed`, or a radio group; one tab stop with arrows inside if a radio group. 3.2.2: selection changes content, never context.
- Implementation: code-standard rule 8, code-standard rule 9 (selected is a state of the native control), code-standard rule 15 (a count is a description). In Figma: figma-standard rule 31 (selected draws differently from rest by more than colour), figma-standard rules 26 and 32.

**Build**
- A `role="group"` with a name, holding `<button type="button" aria-pressed>`s; selected is styled from `[aria-pressed="true"]` (code-standard rule 9). That is the view switch outside any form. A segmented facet inside a filter bar's GET form is radios in a `fieldset` styled as segments, so it submits without script ([filtering: facet controls](filtering.md#facet-controls)).
  ```html
  <div role="group" aria-label="View">
    <button type="button" aria-pressed="true">Table</button>
    <button type="button" aria-pressed="false">Cards</button></div>
  ```
- One handler sets `aria-pressed` on every segment and changes the view, so exactly one is pressed ([accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex)).
- The choice lives in the address, so the no-script version is links or a GET form ([javascript: state in the address and history](../../code/javascript.md#state-in-the-address-and-history)).
- An icon-only segment has a name (code-standard rule 18); a count is a description (code-standard rule 15).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 4 (more than four segments). It could also check that exactly one segment is pressed.
- *Judgement:* Does this apply at once, or is it a form value?

**Sources:** Primer as linked; the count and its sources are in [interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice).

## Option tiles and picking a kind in a dialog

**Use when / don't use**
- Use option tiles (radio cards) when the person picks one of two to six kinds and each needs more than a word to tell apart: a title and one line of description, or an icon that shows the kind. Carbon: "Selectable tiles are used to present different options for users to select from"; "Use single-select tiles when the user can only select one tile" ([Carbon tile](https://carbondesignsystem.com/components/tile/usage/)). Radix ships them as RadioCards, "interactive cards where only one can be selected at a time" ([Radix radio cards](https://www.radix-ui.com/themes/docs/components/radio-cards)); shadcn's choice card wraps a radio item, a title and a description in one label ([shadcn radio group](https://ui.shadcn.com/docs/components/radio-group)).
- Don't use tiles for short values that need no explanation: those are radios (in a form) or a segmented control (applying at once, [segmented control](#segmented-control)). Apple's segmented control in an inspector chooses "attributes" of an object ([Apple segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)).
- Don't use tiles past about six kinds; a select (Apple's pop-up button, "a flat list of mutually exclusive options", "when space is limited", [Apple pop-up buttons](https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons)) with the description in the option or under the field.
- Choice chips are for picking among values in place, not for a form's kind ([chips: choice chips](chips.md#choice-chips)); Material's segmented button covers "two and five items. For more complex choices, or more than five items, use chips" ([Android segmented button](https://developer.android.com/develop/ui/compose/components/segmented-button)), and is deprecated in Material 3 Expressive for the connected button group.

**How**
- **The kind first, then its fields.** When the kind decides what the rest of the dialog asks, pick it first and show only its fields after; Figma picks a property's type before its "Create component property" modal opens, and the modal then holds only a name, a default that depends on the type, and "Create property" ([Figma, explore component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)). In one dialog: the kind as tiles or a segmented control at the top, the fields under it, the commit button at the bottom ([property editors](property-editors.md#property-editors)).
- **Tiles in one grid, all one size.** Equal widths in a row and equal heights across it, sized from the longest title and description, never per tile. Apple: "keep segment size consistent"; for radios, "Measure the space needed to accommodate the longest button label, and use that measurement consistently" ([Apple toggles](https://developer.apple.com/design/human-interface-guidelines/toggles)). Radix's default grid is `repeat(auto-fit, minmax(160px, 1fr))` with a 16px gap (Radix radio cards).
- **A tile shows its state more than by colour:** a radio dot or check in the tile (Carbon's single-select tiles show a radio icon), an accent border, and a faint accent fill ([visual: quiet chrome in a dense tool](../design/visual.md#quiet-chrome-in-a-dense-tool)). Text and icon at the dialog's sizes: the title at the body size in 600, the description in the secondary colour at the small size, an icon at 16 or 20px; a tile is not a hero card.
- **A default is selected.** NN/g: "Always offer a default selection for radio button lists" ([NN/g checkboxes vs radio buttons](https://www.nngroup.com/articles/checkboxes-vs-radio-buttons/)); Apple: "Provide a useful default selection" (pop-up buttons). The most common kind, or the last one used.
- **One size logic for every control in the dialog.** One control height for every field, select and segmented control (Carbon: "Individual input fields default to a 40px height in product regardless of context", sizes 32, 40, 48, [Carbon forms pattern](https://carbondesignsystem.com/patterns/forms-pattern/); [visual: one size scale per screen](../design/visual.md#one-size-scale-per-screen)); one column, labels above (Carbon: "Top-aligned labels are Carbon's default"); every field the column's width unless its answer has a known short length ([forms: field widths](forms.md#field-widths); Apple: "use consistent widths to create a more organized layout", [Apple text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields)). A segmented control or tile grid spans the column like the fields under it, so every left and right edge in the dialog lines up. Material's dialog runs from 280 to 560px wide ([material-web dialog source](https://github.com/material-components/material-web/blob/main/dialog/internal/_dialog.scss)); Carbon puts "24px or even 16px between inputs" in modals.
- **Labels left only on a desktop tool's settings,** in a column: SwiftUI's columns form style is "a trailing aligned column of labels next to a leading aligned column of values" ([SwiftUI ColumnsFormStyle](https://developer.apple.com/documentation/swiftui/columnsformstyle)). A web dialog keeps labels above ([forms: labels](forms.md#labels)).

**Cases**
- A "New property" dialog lists Boolean, Text, Variant and Slot as a select, then shows every field for every type → the kind as four tiles (or a segmented control if the names say enough) at the top; only that kind's fields under it.
- Kind tiles are 180px tall with 24px icons and 16px titles above 32px fields with 12px labels → tiles a fixed multiple of the field height, the title at the body size, a 16 or 20px icon.
- Three tiles fit their text and differ in width → one grid, equal columns.
- A dialog mixes a 40px select, a 32px text field and a 28px segmented control, some full width and some not → one height, all at the column's width.
- The selected tile differs only by a pale tint → add the radio dot and the accent border.

**Accessibility**
- 1.3.1 and 4.1.2: tiles are a radio group with a name (the question); each tile's title is its radio's label and its description the radio's description. 2.1.1: one tab stop, arrows move between tiles. 1.4.11: the selected tile's border and the radio dot meet 3:1; 1.4.1: selected is not colour alone.

**Build**
- *Elements:* a `fieldset` with a `legend`, each tile a `label` wrapping an `input type="radio"` (visually reduced to its dot, never `display: none`), the title and the description; the description linked by `aria-describedby` (code-standard rule 15). Native radios give the arrow keys and the single tab stop (code-standard rule 8).
- *States:* selected is styled from `:has(input:checked)` on the tile, focus from `:has(input:focus-visible)` (code-standard rule 9).
- *Layout:* the tile grid `grid-template-columns: repeat(auto-fit, minmax(<token>, 1fr))` with equal rows (`grid-auto-rows: 1fr`); dialog controls read one height token (code-standard rule 22, code-standard rule 38).

**Check**
- *Script:* could assert every tile in a group has the same rendered width and height, every control in a dialog the same height and the same inline start and end, a default checked, and each tile's radio reachable by Tab with arrows moving between them.
- *Judgement:* does each kind need its description to be chosen well, or would a word in a segmented control do?

**Sources:** Carbon, Radix, shadcn, Apple, Material, NN/g, Figma and SwiftUI as linked. Radix and shadcn ship radio cards with no guidance on when; Carbon's selectable tiles are the one usage source. Primer and Apple allow up to five to seven segments where design-standard rule 4 allows four ([interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice)). The toolkit takes six as the tile ceiling, from Apple's tab and segment counts, with no source setting it for tiles. Well-regarded design-tool panels on Dribbble ([Dimply property panels](https://dribbble.com/shots/19866493-Dimply-UI-Builder-Property-Panels), [Stratis modal components](https://dribbble.com/shots/20649877-Stratis-UI-Modal-components)) were found but not viewed, since Dribbble refuses automated reads; they support nothing here.

## Multi-select

**Use when / don't use**
- Use when several values may hold and the list is too long for checkboxes: more than about ten, or a list that grows.
- Use checkboxes instead when the options are few; every state stays visible.
- Don't use `select multiple`: it needs a modifier key nobody discovers ([GOV.UK select](https://design-system.service.gov.uk/components/select/): use checkboxes instead).
- Don't use a closed drop-down that hides what is picked ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/): "Do not use a dropdown list" for multiselect).

**How**
- Two shapes. **Combobox with input chips**: type to find, Enter to add, chips above or inside the field show what is picked. **Filtered checkbox list**: a search box over a scrolling list of checkboxes, best when people browse more than they type ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/): "a multiselect listbox with checkboxes").
- When collapsed, show the count and the first picks ("3 selected: Button, Card, …") ([Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/) shows a count tag).
- A clear-all once two or more are picked; select-all only where "all" differs from "none" ([Carbon](https://carbondesignsystem.com/components/dropdown/usage/)).
- Selected options keep their place in the list; they do not jump to the top while the list is open.

**Cases**
- A form asks for skills from a list of 60 → combobox with input chips; 60 checkboxes is a page of scrolling.
- A filter for "Components" with 40 options and checkboxes in a menu → keep it, show the count collapsed, and give the menu a search box.
- A multi-select whose picks vanish when it closes → show them as chips or a count; a hidden selection cannot be checked.

**Accessibility**
- 1.3.1: the list is a group or a listbox with `aria-multiselectable`. 4.1.2: each option exposes its checked state. 4.1.3: adding or removing a value is announced. 2.1.1: every action by keyboard.
- Implementation: code-standard rule 8, code-standard rule 14, code-standard rule 18, code-standard rule 20 (without script, a checkbox list in a `fieldset` submits). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- The no-script form is a `fieldset` of checkboxes, which submits (code-standard rule 20); the enhancement adds a filter input that sets `hidden` on labels that do not match (code-standard rule 17), or turns it into a combobox with input chips.
- A custom list is `role="listbox"` with `aria-multiselectable="true"` and `aria-selected` options ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- The collapsed label ("3 selected") is updated in the same handler that changes the selection; each add or remove is announced in a status element present from load.
- Options are never re-sorted while the list is open; a removed chip's focus goes on (code-standard rule 14), and remove buttons are named (code-standard rule 18).

**Check**
- *Script:* could flag `select[multiple]`, check that a collapsed multi-select shows its count, and that every chip has a named remove button.
- *Judgement:* Do people browse this list or type into it?

**Sources:** NN/g, GOV.UK and Carbon agree; none sets the exact count at which checkboxes give way, so "about ten" is the toolkit's commentary, taken from Baymard's ten-option ceiling for drop-downs.

## Dual listbox (transfer list)

**Use when / don't use**
- Use to pick several items from a long list when their **order** matters as well: NN/g, "Use a multiselect, dual listbox to accommodate both selection and reordering" ([NN/g listboxes vs dropdowns](https://www.nngroup.com/articles/listbox-dropdown/)). Report columns, a ranked shortlist, the steps of a sequence.
- Use when the chosen set must be reviewed apart from the pool; the second list gives "a clear overview of the items selected" ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/)).
- Don't use when order does not matter: a filtered checkbox list or a combobox with input chips does the same job in one list ([multi-select](#multi-select)).
- Don't use for a handful of items; checkboxes, with Up and Down beside each if order matters.
- Don't put links, buttons or checkboxes inside the options; a listbox "does not provide an accessible way to present a list of interactive elements" ([APG listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)).

**How**
- **Layout.** "The listbox on the left holds available options and the listbox on the right represents selected items" ([NN/g](https://www.nngroup.com/articles/listbox-dropdown/)); Add and Remove sit between them, Up and Down beside the chosen list. Below the width where both fit, the chosen list stacks under the available one.
- **Buttons** say what they do in text ("Add", "Remove", "Move up"), not arrows alone; each is disabled while it has nothing to act on (design-standard rule 5).
- **Labels** name each list and its count: "Available columns (14)", "Shown columns (4)".
- **Focus after a move** stays where the person is working. In the [APG rearrangeable example](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/), "pressing Enter in the available options list leaves focus in the available options list", on the next option still present; moving an option up keeps focus on that option, so it can be moved again.
- **Confirmation.** A "Last change:" line under the lists says what moved, as the APG example does.
- **A long pool** gets a filter box above it; added items leave the pool rather than showing twice.
- **States:** each option rest, focus, selected; each button enabled and disabled; an empty chosen list says what to do ("No columns chosen").

**Cases**
- Choose which of 20 columns a report shows, and in what order → a dual listbox with Up and Down; the order is part of the answer ([tables: column choice and order](tables.md#column-choice-and-order) for which columns belong).
- Grant 6 of 12 permissions, order irrelevant → a checkbox list; the second list only adds travel.
- Add moves an item and focus jumps to the top of the pool → keep focus on the next remaining option; the person was working down the list.
- The move buttons are "›" and "‹" → write "Add" and "Remove"; arrows leave the direction to be guessed.

**Accessibility**
- 4.1.2: two `listbox`es, each named, with `aria-multiselectable` where several can be picked; buttons named. 2.1.1: in the APG example Enter adds, Delete removes, Alt + Up and Alt + Down reorder, and the buttons expose these with `aria-keyshortcuts`. 2.4.3: focus as above. 4.1.3: the last change is announced.
- Implementation: code-standard rule 8, code-standard rule 14 (focus survives the move), code-standard rule 18 (icon buttons are named), code-standard rule 20 (works without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- The no-script form is a `fieldset` of checkboxes for the set, with a number field per item where order matters; it submits (code-standard rule 20).
- The enhancement builds two `role="listbox"` lists to the APG example, focus on the listbox with `aria-activedescendant` on the active option; three or more buttons sit in a `role="toolbar"`, one tab stop ([accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex); [selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- The "Last change" line is a status element present from load ([accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).
- One model holds both lists and the order; the hidden inputs the form submits are written from it in the same handler.

**Check**
- *Script:* could check both listboxes are named, every move button has a name, and, in a headless browser, that pressing Enter in the pool moves the option and leaves focus in the pool.
- *Judgement:* Does the order matter, or would one checkbox list do?

**Sources:** NN/g and APG as linked; they agree. None of the Carbon selection pages opened for this file documents a dual list, so the narrow-screen stacking is the toolkit's commentary.

## Select all and clear all

**Use when / don't use**
- Use select all on a list of options where picking all, or all but a few, is a real task: every permission for an administrator, every field in an export. Carbon offers it as a parent checkbox in a multiselect and says it "is not mandated to be present in all multiselect dropdowns" ([Carbon dropdown](https://carbondesignsystem.com/components/dropdown/usage/)).
- Don't offer select all where all and none mean the same: "We recommend not to use the parent checkbox in scenarios like filters when choosing all and choosing none means the same" ([Carbon](https://carbondesignsystem.com/components/dropdown/usage/)).
- Use clear all once two or more options are picked ([multi-select](#multi-select)). Clearing a filter bar's applied filters is [filtering: applied filters and clear all](filtering.md#applied-filters-and-clear-all); selecting rows in a table, across pages, is [tables: selection and bulk actions](tables.md#selection-and-bulk-actions).

**How**
- **Select all** is a parent checkbox first in the list, set off from the options by a divider, and named for the set: "All permissions (12)". Its three states and click behaviour are the [checkbox](#checkbox)'s indeterminate parent; this section does not repeat them.
- **Clear all** sits with the count of picks, in the field or the list's heading: Carbon's multiselect shows a tag "containing the total number of selected options" that "also provides a functionality to clear all the selected options" ([Carbon](https://carbondesignsystem.com/components/dropdown/usage/)).
- **With a filter typed into the list,** select all acts on the options that match, and its label says so: "Select all 6 matching". Clearing the filter keeps the picks and shows the ones it hid. A filter is the person saying what "all" means; selecting options they cannot see is a surprise (toolkit commentary).
- **Disabled options** are skipped by select all and stay in place (design-standard rule 5).
- **Long lists** keep select all in view while the options scroll.

**Cases**
- A "Severity" filter menu with a select-all box, where none checked shows everything → remove the box; Carbon's all-equals-none case.
- A role editor with 30 permissions where administrators get all → "All permissions (30)" as a parent checkbox; one click instead of thirty.
- The person types "button", presses select all, and 200 hidden options are picked → select the 6 matches and label the action with the number.
- Select all also checks two disabled options → skip them; a disabled option is one the person cannot choose.

**Accessibility**
- 4.1.2: the parent exposes mixed when some are picked, and its name says what it covers ("Select all permissions"). 4.1.3: the new count is announced. 2.4.3: after clear all, focus stays on the list or moves to its first option, never to the page top.
- Implementation: code-standard rule 12 (clear all renders only when there is something to clear), code-standard rule 14, code-standard rule 15 (the count is a description). In Figma: figma-standard rule 31 (checked, indeterminate and unchecked draw differently).

**Build**
- The parent is a native checkbox; its `indeterminate` property and every child change in one handler, which touches only children that are neither `disabled` nor `hidden` by the filter ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- Without script the parent is a checkbox with its own value that the server reads as "every option" (code-standard rule 20).
- The count and the clear-all control update in the same handler; the count is written to a status element present from load ([accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).

**Check**
- *Script:* could filter a list, click select all, and assert only the visible, enabled options are checked; then assert the parent is mixed after one child is unchecked.
- *Judgement:* Does all differ from none here, and does anyone ever want all?

**Sources:** Carbon as linked. No NN/g, Baymard or Carbon page opened for this file says what select all should do while a filter is active; the matching-only rule is the toolkit's commentary.

## Date and time entry

**Use when / don't use**
- Use **separate day, month and year fields** for a date the person knows or can look up without a calendar: a date of birth, a passport issue date ([GOV.UK date input](https://design-system.service.gov.uk/components/date-input/); [Adam Silver](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/): "Use three separate text boxes for dates").
- Use a **calendar** only when the person needs a date in the near future or recent past, the day of the week, or dates seen against each other ([GOV.UK dates pattern](https://design-system.service.gov.uk/patterns/dates/)).
- Don't use drop-downs for day, month and year of birth ([NN/g, Li 2017](https://www.nngroup.com/articles/drop-down-menus/)).
- Don't make a calendar the only way in: "Never make a calendar control that depends on JavaScript as the only input option" ([GOV.UK](https://design-system.service.gov.uk/patterns/dates/)).

**How**
- **Three fields** in a `fieldset` whose `legend` is the question, with a hint giving an example ("For example, 27 3 2007"; GOV.UK picks a day of 13 or more and a month of 9 or less so the order is clear). Widths fit two, two and four characters. `inputmode="numeric"` for the number keypad.
- **Date of birth** takes `autocomplete="bday-day"`, `"bday-month"` and `"bday-year"` ([GOV.UK](https://design-system.service.gov.uk/components/date-input/)).
- **Calendar** opens from a button beside a text field the person can type into; the typed value and the calendar stay in sync.
- **Errors** name the missing part ("Date of birth must include a year") or the impossibility ("must be a real date"), show only the highest-priority one, and mark only the parts in error ([GOV.UK](https://design-system.service.gov.uk/components/date-input/)).
- **Time** is [time entry](#time-entry)'s.

**Cases**
- A date-of-birth field opens a calendar on 2026 → three text fields; scrolling back decades through a calendar is the slowest route to a date the person knows.
- Booking an appointment next week → a calendar beside a typed field, with the day of the week shown; this is the case GOV.UK names.
- The year field rejects "07" → accept it with a clear rule, or the hint says four digits; either way the error says what to enter.
- A date range for a report filter → two typed date fields with a calendar each, the second unable to precede the first and saying so.

**Accessibility**
- 1.3.1: the three fields share a `legend`; each has its own label (Day, Month, Year). 1.3.5: date of birth carries the `bday-*` tokens. 3.3.1 and 3.3.3: errors in text, naming the part. 2.1.1: a calendar is fully keyboard-operable or optional.
- Implementation: code-standard rule 15 (the hint is a description), code-standard rule 20 (typing works without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- Three text inputs in a `fieldset`, the hint on the `fieldset`'s `aria-describedby` (code-standard rule 15):
  ```html
  <fieldset aria-describedby="dob-hint"><legend>Date of birth</legend>
    <p id="dob-hint">For example, 27 3 2007</p>
    <label for="dob-day">Day</label> <input id="dob-day" name="dob-day" inputmode="numeric" autocomplete="bday-day">
    …month (bday-month), year (bday-year)…</fieldset>
  ```
- Widths by the field's character variant ([forms: field widths](forms.md#field-widths)); `aria-invalid="true"` only on the parts in error.
- `input type="date"` only where its native picker suits the question; a custom calendar is a button beside the typed field opening a dialog with a day grid ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- The server parses and validates the three parts; typing works with scripts off (code-standard rule 20).

**Check**
- *Script:* could check that day, month and year fields are grouped with a `legend`, carry `inputmode="numeric"`, and that a date of birth uses the `bday-*` tokens; that any calendar sits beside a text input.
- *Judgement:* Does the person know this date, or do they need to see it on a calendar?

**Sources:** GOV.UK and Silver agree on separate fields; GOV.UK notes that whether month names help "needs more research", so this file does not rule on it.

## Time entry

**Use when / don't use**
- Use a **text field** for a time the person knows: an appointment they were given, when something happened. Carbon's time picker is a text field: "Time pickers provide the user with a text field in which they can input the hour and minutes" ([Carbon date and time pickers](https://carbondesignsystem.com/components/date-picker/usage/)).
- Use a **list of slots** (radios, or a select past about five) when only some times can be booked. NN/g's advice for dates carries over: "For a limited number of date options, provide a list of the applicable dates" ([NN/g date input](https://www.nngroup.com/articles/date-input/)).
- Don't make a clock face or a scrolling wheel the only way in; the reason is GOV.UK's for calendars ([date and time entry](#date-and-time-entry)).
- A time that goes with a date sits beside the date's fields, which are the section above; this section adds only what is particular to time.

**How**
- **Format.** Carbon: "Both the 12-hour and 24-hour time systems are allowed. If using the 12-hour format it must be accompanied by an AM/PM selection." Pick one for the product and state it in the hint with an example ("For example, 9:30am or 2:15pm"). Carbon's field shows "the hour and minutes, for example 11:30".
- **Writing a time** in labels, hints and messages follows the [GOV.UK style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/): "5:30pm (not 1730hrs)", "midday (not 12 noon, noon or 12pm)", "midnight (not 00:00)", and "10am to 11am (not 10-11am)".
- **Midnight** is ambiguous at a deadline: GOV.UK, "Midnight is the first minute of the day, not the last", and suggests "11:59pm" instead.
- **Time zone.** Carbon: "Specific times should specify a timezone", with an optional time zone select beside the field. GOV.UK adds "UK time" when the service serves people outside the UK.
- **Typed input** is read generously: "9", "9am", "09:00" and "21:00" all mean something; reject only what cannot be a time, and say what to enter (toolkit commentary).
- **Seconds** only where they matter.
- **A range that crosses midnight** (a night shift, 22:00 to 06:00) is accepted and shown as ending the next day, not rejected as end before start.

**Cases**
- "Register by midnight on 14 June" → "by 11:59pm on 14 June"; GOV.UK's example of a deadline read two ways.
- A product that states am/pm uses `input type="time"`, and some people see a 24-hour control → the browser chooses the display (below); use a text field where the product's convention must hold, or drop the stated convention.
- Delivery can be booked only in four two-hour slots → four radios naming the slots; a free time field invites times that will be refused.
- A meeting time shown to attendees in three countries → show the time zone with the time, as Carbon requires.

**Accessibility**
- 1.3.1 and 3.3.2: a visible label, and the format hint associated as a description. 3.3.1 and 3.3.3: an error says what was wrong and gives an example. 2.1.1: any picker is keyboard-operable, or optional beside the typed field. 1.4.1: the am/pm choice is text, never colour.
- Implementation: code-standard rule 8 (native inputs and selects), code-standard rule 15 (the hint is a description), code-standard rule 20 (typing works without script). In Figma: figma-standard rules 26, 31 and 32.

**Build**
- A text `input` with the hint on `aria-describedby`; an am/pm choice and a time zone, where used, are native `select`s beside it (code-standard rule 15; [forms: input types and autocomplete attributes](forms.md#input-types-and-autocomplete-attributes)).
- `input type="time"` where the browser's display is acceptable: its value "is always in 24-hour format that includes leading zeros: `HH:mm`, regardless of the input format, which is likely to be selected based on the user's locale (or by the user agent)" ([MDN `input type="time"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time)). `step` is in seconds, default 60; a value not divisible by 60 adds seconds to the control.
- A night range on `type="time"`: "By setting a `min` attribute greater than the `max` attribute, the valid time range will wrap around midnight" ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/time)).
- The server parses and validates the time; MDN warns "HTML form validation is _not_ a substitute for scripts that ensure that the entered data is in the proper format" (code-standard rule 20).
- Field width by its character variant ([forms: field widths](forms.md#field-widths)).

**Check**
- *Script:* could check every time field has a label and a hint, flag a `type="time"` whose `step` adds seconds, and flag "12pm", "12am", "00:00" and "noon" in interface text.
- *Judgement:* Can any time be chosen, or only some?

**Sources:** Carbon, GOV.UK, MDN and NN/g as linked; NN/g's advice is about dates and is applied to times by analogy. Carbon writes "AM" and "PM" ("Use uppercase letters and no periods"); GOV.UK writes "5:30pm". The toolkit follows the project's dialect: GOV.UK for British English, where its style guide is the house reference, Carbon's form where a product follows US convention.

## Slider

**Use when / don't use**
- Use for an approximate value in a moderate range where the person adjusts by feel and sees the result at once: volume, a zoom level, a price band in a filter.
- Don't use when the exact value matters; a number field is faster and precise ([NN/g steppers, Zhou 2018](https://www.nngroup.com/articles/input-steppers/): allow typing when "the exact value is important").
- Don't use for very large ranges (1–1000) or tiny ones (1–3) ([Carbon slider](https://carbondesignsystem.com/components/slider/usage/)).
- Don't use for values that are not numbers ([Carbon](https://carbondesignsystem.com/components/slider/usage/)).

**How**
- Pair the slider with a number input that shows and accepts the value ([Carbon](https://carbondesignsystem.com/components/slider/usage/)); a range slider has two.
- Show the minimum, maximum and unit; the current value is always visible, not only while dragging.
- Clicking the track moves the thumb there, so dragging is never the only way ([WCAG 2.5.7 Understanding](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)).
- Arrow keys step by one; a larger step with Shift or Page Up and Down; Home and End jump to the limits.
- A slider that filters waits for release before it re-queries, so the list does not jump at every step.

**Cases**
- A "quantity" slider from 1 to 100 → a number input; the exact count matters.
- A price filter from 0 to 5,000 → a range slider with two number inputs beside it; people often know their ceiling exactly.
- A brightness setting with no visible value → show the percentage beside it; a slider without a value hides state.
- A slider operable only by dragging the thumb → make the track clickable and the thumb keyboard-operable; 2.5.7 requires a single-pointer path.

**Accessibility**
- 2.5.7 Dragging Movements (AA): a single-pointer alternative (track click, or the paired input). 4.1.2: a native `input type="range"`, or `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` when the number needs a unit. 2.1.1: the keys above. 2.5.8: the thumb meets the target size.
- Implementation: code-standard rule 8 (wrap the native range input), code-standard rule 16 (it follows the theme). In Figma: figma-standard rule 26 (the thumb), figma-standard rules 31 and 32.

**Build**
- A native `<input type="range">` with `min`, `max` and `step`, paired with a labelled number field; the browser gives arrows, Home and End and a clickable track (code-standard rule 8).
  ```html
  <label for="price-max">Maximum price (£)</label>
  <input id="price-max" type="range" min="0" max="5000" step="50" value="2000">
  <input id="price-max-n" inputmode="numeric" value="2000" aria-label="Maximum price in pounds">
  ```
- One `input` handler keeps the two in step; a filter re-queries on `change`, which fires on release.
- A unit or a word for the value goes in `aria-valuetext`; a range of two is two labelled range inputs (minimum and maximum), since HTML has no two-thumb slider ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- Track and thumb follow the theme (`accent-color`, code-standard rule 16); the thumb's size is a token that meets the target size.

**Check**
- *Script:* could check that every range input has a name and an associated visible value or number input, and that a click on the track changes the value.
- *Judgement:* Does the person need an exact number here?

**Sources:** Carbon, NN/g and W3C as linked; they agree.
