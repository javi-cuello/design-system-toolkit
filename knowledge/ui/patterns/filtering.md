# Filtering

How a person narrows a list or table to the rows they want: where the filters sit, which control each facet gets, how a long facet is truncated and filtered, the counts on its options, how facets narrow each other, facets scoped to one kind of row, what happens to options that lead nowhere, how applied filters are shown and cleared, when filters apply, how they live in the address, what an empty result offers, how sorting differs, quick presets and saved views. It serves the principles *show state* (what is applied is always visible), *discoverable* (choices in sight where they fit), *people in control* (every filter undone in one step) and *honest* (a count says what a choice leads to). It applies design-standard rule 2, design-standard rule 3, design-standard rule 4, design-standard rule 5, design-standard rule 6, design-standard rule 11 and design-standard rule 12. The search box in the bar is `search.md`'s.

Vocabulary: a **facet** is one aspect of the rows (level, area, component); its **values** are the choices within it. Filters combine by AND across facets and OR within one ([Baymard](https://baymard.com/blog/allow-applying-of-multiple-filter-values)).

## Filter bar, sidebar or filter dialog

**Use when / don't use**
- **Filter bar** (one horizontal row above the list) when there are few facets: a tool or docs screen with up to about six. Baymard finds horizontal toolbars "can be troublesome if there are more than 6–8 filter types" ([Baymard, Horizontal Filtering Toolbars, 2025 update](https://baymard.com/blog/horizontal-filtering-sorting-design)). This is the house default for tool screens (design-standard rule 3).
- **Sidebar** (a vertical panel left of the list) when there are many facets, many values per facet, or readers need to scan values across facets at once; Baymard calls sidebar filtering "a proven and familiar implementation" and recommends it for most e-commerce sites. Carbon places multiple categories "vertically on the left side of the page or horizontally at the top of the data set" ([Carbon filtering](https://carbondesignsystem.com/patterns/filtering/)).
- **Filter dialog or tray** on small screens, or when facets outnumber what either fits: a "Filters" button opens a panel over the results ([NN/g mobile tray, Whitenton 2015](https://www.nngroup.com/articles/mobile-faceted-search/)).
- Don't use two of these for the same list on one screen; "nothing else filters the same list" (design-standard rule 3).
- Don't build facets at all where one simple filter does; facets "are significantly more expensive to create and maintain," and "A simple filter can often be easier to understand and faster to use" ([NN/g filters vs facets, Whitenton 2014](https://www.nngroup.com/articles/filters-vs-facets/)).

**How**
- **Bar:** one row under the tabs; facets and toggles first, search last, actions after the search (design-standard rule 3). Most-used facet first ([Anvil filters](https://anvil.servicetitan.com/docs/web/patterns/filters)), subject to design-standard rule 6's order. Widths stable so a choice does not reflow the bar (design-standard rule 2).
- **Sidebar:** facets as labelled groups, the most used at the top ("The filter categories placed higher in the list will receive more attention", [NN/g filter categories, Moran 2018](https://www.nngroup.com/articles/filter-categories-values/)); long value lists truncated with "Show all".
- **Dialog or tray:** opened by a "Filters" button that shows the number applied when closed (Carbon); results stay visible beside it where space allows, and the total count stays in view ([NN/g](https://www.nngroup.com/articles/mobile-faceted-search/)). Closes with a "Show 42 results" button, Escape and a close button, and returns focus to the trigger.
- **Small screens:** the bar's facets collapse into the Filters button; the search keeps its own row. Primer turns a filter sidebar into a menu on narrow viewports, or a bottom-sheet dialog when there are too many options, suggesting 15 items as the most for a menu ([Primer navigation](https://primer.style/product/ui-patterns/navigation/)).

**Cases**
- An audit screen has three facets and a search → a bar under the file tabs (design-standard rule 3).
- A component catalogue has nine facets with up to 30 values each → a sidebar; a bar of nine menus hides every value behind a click, Baymard's first drawback.
- A bar's facets wrap to a second row at 900px → collapse facets into a Filters button below that width; a wrapped bar moves the list and reads as broken.
- A page has a sidebar of facets and a bar of chips for the same table → keep one; two controls for one list make the reader work out which narrowed which.
- The mobile tray hides the result count → keep the total visible in the tray's header or apply button.

**Accessibility**
- 1.4.10 Reflow (the bar usable at 320px without horizontal scroll), 2.4.3 Focus Order (bar order equals reading order), 1.3.1 (each facet a labelled group), 2.1.2 No Keyboard Trap and focus return for a dialog, 2.4.11 Focus Not Obscured (a sticky bar does not cover focused rows).
- Implementation: code-standard rule 2 (DOM order), code-standard rule 20 (filters are a GET form that works without script), code-standard rule 17 (a collapsed panel's `hidden` beats the stylesheet). Figma: figma-standard rules 26, 31 and 32 for each control in the bar.

**Build**
- Every form of it is one GET `form`, named for its list (`aria-label="Filter findings"`), whose fields are the address's parameters; one list, one form ([HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).
- Bar, sidebar and tray are presentations of the same markup chosen by container or media query, never three copies (code-standard rule 36; [responsive: *Container queries*](../../code/responsive.md#container-queries)).
- The tray is a `dialog` opened from `<button type="button" popovertarget="filters">Filters <span data-count>2</span></button>` and enhanced to `showModal()`; focus in and back are the platform's ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- Its "Show 42 results" is the form's submit button; Escape and the close button discard pending changes.
- A collapsed sidebar group uses `hidden`, which beats the stylesheet (code-standard rule 17); DOM order is the bar's visual order (code-standard rule 2).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 3 ("facets and toggles come first, search last"; tabs keep one row) and design-standard rule 2 (the tab list's position across tab switches; it does not yet measure the bar itself). Could check the bar's height is one row at every width above its collapse point, and that one list has one filter form.
- *Judgement:* How many facets do readers actually use, and do they need to see values across facets at once?

**Sources:** Baymard, Carbon, NN/g, Primer and Anvil as linked. Baymard leans to sidebars for shops with many filter types; the toolkit defaults to a bar for tool and docs screens, which have few facets, and moves to a sidebar past about six facets, inside Baymard's 6–8 limit.

## Facet controls

**Use when / don't use**
- **Segmented buttons** for a single-choice facet of up to four values, all in sight (design-standard rule 4; the count's sources are in [interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice); the component is [selection: segmented control](selection.md#segmented-control)).
- **A menu** past four values, showing the current choice and each value's count (design-standard rule 4, design-standard rule 11).
- **Checkboxes** when a facet allows several values at once (levels: Error and Warning), in a sidebar group, or in a menu of checkable items; within a facet they combine by OR.
- **A toggle** (switch or checkbox) for a facet with one meaningful state ("Show resolved").
- Don't use tabs for facet values (design-standard rule 3), radio buttons in a bar (they take more room than a segmented control and look like a form), or a free-text box for a facet with a known set of values.

**How**
- A segmented facet shows an "All" segment first when one is meaningful; buttons in sight may say "All" (design-standard rule 12).
- A menu opens on the option that names what "all" covers (design-standard rule 12; the wording is [content: filter and menu labels and counts](../design/content.md#filter-and-menu-labels-and-counts)). Collapsed, it shows its current choice ("Area: Colour"), the label-and-selection form Anvil shows ([Anvil filter bar](https://anvil.servicetitan.com/docs/web/components/filter-bar/design)).
- A multi-select menu collapsed shows the count chosen ("Levels: 2") and the chips row lists which (*Applied filters* below).
- The menu's chevron sits at the control's own inset (design-standard rule 9; [visual: iconography](../design/visual.md#iconography)).
- Values in a meaningful order (severity, then alphabetical; never random), with the default the value most people want ([Anvil](https://anvil.servicetitan.com/docs/web/patterns/filters): "If a specific filter option is used by 80% of users, make that the default").
- Value labels the reader can predict: "Unintelligible jargon has no place in filters" ([NN/g](https://www.nngroup.com/articles/filter-categories-values/)).

**Cases**
- A filter of 12 values, or one of three made a menu → [interaction: choosing a control for a choice](../design/interaction.md#choosing-a-control-for-a-choice).
- A facet grows from four values to five after a data change → it becomes a menu; say in the design notes that the facet flips, since the reader loses the values in sight.
- Two menus side by side both open on "All" → name each ([content: filter and menu labels and counts](../design/content.md#filter-and-menu-labels-and-counts); the check flags it).
- Readers need errors and warnings together → make level multi-select with checkboxes, OR within the facet.

**Accessibility**
- 4.1.2 Name, Role, Value (segmented as a radio group or buttons with `aria-pressed`; a menu as a native `select` or a listbox with its keyboard), 1.3.1 (the facet's label names the group), 2.1.1, 1.4.11 Non-text Contrast (the selected segment differs at 3:1), 1.4.1 (selected not by colour alone).
- Implementation: code-standard rule 15 (the count is a description, not part of the option's name), code-standard rule 9 and code-standard rule 62 (a disabled value uses the control's own `disabled`), code-standard rule 19 (a `details`-based menu adds Escape). Figma: figma-standard rule 31 (selected, hover, focus, disabled each draw differently), figma-standard rule 26.

**Build**
- Segmented single choice: radios in a `fieldset` with a `legend`, styled as segments from `:checked` and `:focus-visible`; they submit and need no `aria-pressed` ([HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).
- A menu past four values: a labelled native `select` first; a custom listbox only with the APG keyboard in full ([accessibility: *Selection controls past the native set*](../../code/accessibility.md#selection-controls-past-the-native-set)).
- Multi-select: checkboxes in a `fieldset`, or a `popover` of checkboxes opened by a button whose text is its collapsed label ("Levels: 2"); the popover gives Escape and light dismiss (code-standard rule 19).
- A one-state facet is a checkbox, or `input type="checkbox" role="switch"` where it acts at once.
- Each control's `name` is the facet's parameter and `value` a stable identifier, never the display label (code-standard rule 6 for any hook the script reads).
- The count sits outside the option's name (code-standard rule 15); disabled is the control's own (code-standard rule 9, code-standard rule 62).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 4 ("a facet is a menu": more than four buttons in a group) and design-standard rule 12 ("its first option names what"). Could check that a multi-select menu's collapsed label reflects its selection.
- *Judgement:* Is a menu of four or fewer actually a facet (a script cannot tell it from a form field), and is the facet single or multi-select by the reader's task?

**Sources:** [Carbon filtering](https://carbondesignsystem.com/patterns/filtering/) says multiple categories "should never be put within a menu or dropdown"; the toolkit keeps one menu per facet past four values, as design-standard rule 4 records, and meets Carbon's closed-container rule by showing the choice in the collapsed label.

## Long value lists: truncation and a filter box

**Use when / don't use**
- **Truncate** a facet's values in a sidebar or tray once there are more than about ten: show the first ten and a "Show all" control. Baymard found truncated lists beat both showing every value and an inline scroll area, because a full list pushes the other facets out of sight and readers then pick whichever facet happens to be visible ([Baymard, truncation design](https://baymard.com/blog/truncation-design)).
- **Add a filter box** inside the facet once it has more than about 15 to 20 values; Baymard found 46% of benchmarked sites give no reliable way to search within a facet ([Baymard, search within long filter lists](https://baymard.com/blog/allow-search-for-long-filter-options-lists)). Friedman suggests the same for a brands filter of hundreds: "compliment the filter with a search autocomplete and an alphabetical view" ([Smashing](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/), commentary).
- Don't truncate below six values (Baymard: readers took a short truncated list to be complete) and never to hide a single value; the control takes the room the value would.
- Don't use either inside a bar's menu: past about 15 values the menu becomes a dialog or sheet (*Filter bar, sidebar or filter dialog*), and a menu that needs a filter box is a [selection](selection.md) panel.

**How**
- **Truncation:** the most used or most specific values first, in the facet's own order (*Facet controls*); "Show all 34" directly under its own group, styled as a link with a plus or chevron and more space above it than between values, so it does not read as one more value (Baymard). Expanded, the list grows in the page, never into a nested scroller, and offers "Show fewer".
- Selected values always show, even when they fall past the cut; a choice the reader made never hides behind "Show all".
- **Filter box:** at the top of the facet, labelled with the facet ("Filter components"), narrowing the values as the reader types; each match keeps its count, the matching text is highlighted, and an × clears the box (Baymard's three details).
- Typing filters the values, not the list; nothing is applied until a value is checked. Checked values stay put while the box narrows the others (Primer: "When users search for new items, maintain their current selections", [Primer SelectPanel](https://primer.style/product/components/select-panel/)).
- No matches says so in the facet ("No components match 'buton'"), with the box still editable.

**Cases**
- A component facet lists 80 values and the area facet below it is off-screen → truncate at ten with "Show all 80" and add a filter box; the reader sees both facets at once.
- "Show all" sits flush between two groups and readers think it belongs to the next → put it under its own group with the extra space above.
- A reader checks "Tooltip", which sits past the cut, then collapses the list and "Tooltip" vanishes → keep checked values in view in the collapsed state.
- A facet of eight values is truncated to five with "Show 3 more" → show all eight.

**Accessibility**
- 1.3.1 and 3.3.2 (the filter box has a label naming its facet), 4.1.2 (the "Show all" control exposes expanded or collapsed), 4.1.3 (the number of matching values announced as the reader types), 2.4.3 (after "Show all", focus stays on the control, now "Show fewer", and the next value follows it in order).
- Implementation: code-standard rule 12 ("Show all" renders only when there is more), code-standard rule 20 (without script every value shows), code-standard rule 17 (hidden values use `hidden`), code-standard rule 15 (counts stay descriptions).

**Build**
- The full list is in the markup; the script hides past the tenth with `hidden` and adds a `button aria-expanded` "Show all 34", so with no script nothing is lost (code-standard rule 20; [HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- The filter box is an `input type="search"` with a `label`, outside the form's submitted fields (no `name`, or `form` pointing nowhere), so typing never writes the address; it toggles `hidden` on non-matching values, never removes them ([HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).
- Matching runs on each `input` event over values already in the page; for a facet loaded from the server, debounce and abort ([javascript: *Debouncing input*](../../code/javascript.md#debouncing-input)).
- The match count ("6 of 80 components") goes to the facet's status text, polite ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- Long value labels wrap rather than truncate, since they are what the reader compares ([responsive: *Truncation and line clamps*](../../code/responsive.md#truncation-and-line-clamps)).

**Check**
- *Script:* could assert a facet with more than 15 values has a labelled filter box, a truncated facet hides at least two values, every checked value is visible when collapsed, and with script off every value renders.
- *Judgement:* Does the order put the values readers want inside the first ten?

**Sources:** Baymard, Smashing and Primer as linked. Friedman shows 7 to 10 values before an expander, Baymard at least six and up to ten; the toolkit cuts at ten, inside both. Baymard's evidence is from shops; tool screens have fewer values, so most facets never reach the cut.

## Counts

**Use when / don't use**
- Use on every filter option: design-standard rule 11 requires the count; this section says what to count and when to recount.
- This section owns how counts are computed; their wording is [content: filter and menu labels and counts](../design/content.md#filter-and-menu-labels-and-counts).
- Show the total number of results near the list as soon as it changes ([Smashing, Friedman 2021](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/), commentary).
- Don't show a count you cannot compute; a false zero is worse than none ([data: numbers](data.md#numbers)).

**How**
- Counts are faceted: each facet's counts are computed within the other facets' current choices and the search (design-standard rule 6), so choosing the value shows exactly that many rows.
- In a menu: "Colour (14)". On a segmented button or tab: the count after the label, in a lighter weight.
- The total sits beside or above the list ("42 of 508 findings"), and updates with each change.
- Recompute on every change; a count that lags the list is a bug.

**Cases**
- The area menu shows 508 under "All areas" while the list shows the 31 rows of the chosen component → count within the component (design-standard rule 6, design-standard rule 11).
- Rows are counted per finding but the menu counts components → count the same unit the list shows.
- A count service is down → hide the counts and keep the options; never show 0 for unknown.
- A tab reads "Open (12)" but the list under it, with a level filter applied, shows 4 → the tab counts within the filter, or the list says "4 of 12".

**Accessibility**
- 1.3.1 (the count is associated with its option), 4.1.3 Status Messages (the total announced when it changes), 1.4.3 (the lighter count still meets contrast).
- Implementation: code-standard rule 15 (counts as descriptions, `aria-describedby`, not inside the name). Figma: figma-standard rule 32.

**Build**
- Counts come from the same query function as the list, per facet with that facet's own choice removed, so a count and the rows it leads to cannot disagree (code-standard rule 36).
- In markup the count is a separate element: `<label><input type="checkbox" name="level" value="error"> Error</label> <span id="c-error">(14)</span>`, tied by `aria-describedby="c-error"` (code-standard rule 15; [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)). In a native `select` the count stays in the option text, the only place it can go.
- Numbers are formatted with `Intl.NumberFormat` in the page's language ([i18n: *Numbers, dates, plurals and lists*](../../code/i18n.md#numbers-dates-plurals-and-lists)).
- The total ("42 of 508 findings") is written to a status region present from page load ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- An unknown count renders nothing, never `0` (code-standard rule 12).

**Check**
- *Script:* could choose each option in turn and assert the rows shown equal the option's count; could assert the total updates and sits in a polite live region.
- *Judgement:* Do the count and the list count the same thing?

**Sources:** Smashing and Primer as linked; [NN/g, User Intent Affects Filter Design](https://www.nngroup.com/articles/applying-filters/) notes counts help readers avoid zero-result choices.

## Faceted narrowing and order

**Use when / don't use**
- Use whenever a screen has two or more facets: each offers only what fits the choices in the others, and the facet with the most choices comes first (design-standard rule 6).
- Don't let a second facet offer values the first has ruled out as if they were live; disable them (next section).

**How**
- AND across facets, OR within one ([Baymard](https://baymard.com/blog/allow-applying-of-multiple-filter-values)).
- Order left to right (or top to bottom in a sidebar) from the most specific facet to the least: a component before the areas of its findings, so the area menu offers only that component's areas as live choices, the rest disabled at "(0)" in place (design-standard rules 6 and 5; *Unavailable options*).
- Changing an earlier facet recomputes the later ones; a later choice that no longer fits resets to "All" and says so in the chips row, never silently.
- Within that order, the most used facets come first where specificity does not decide ([Anvil](https://anvil.servicetitan.com/docs/web/patterns/filters); [NN/g](https://www.nngroup.com/articles/filter-categories-values/)).

**Cases**
- Area sits before component, and after choosing an area the component menu still lists every component → put component first; then area offers only its areas, the others disabled at "(0)" (design-standard rules 6 and 5).
- A reader picks component "Button", then area "Spacing", then switches component to "Card", which has no spacing findings → reset area to "All areas", keep the change visible, and show the count.
- A file filter and a level filter: which first? → the one with more values first; the file narrows the levels, rarely the reverse.

**Accessibility**
- 3.2.2 On Input: a facet that changes the options of others is no change of context; announce the new total (4.1.3) so the effect is perceived.
- Implementation: code-standard rule 14 (recomputing menus keeps focus on the control just used).

**Build**
- DOM order is the facet order, most specific first (code-standard rule 2).
- Recompute later facets' options and counts in the same handler that applies the change, then re-render them in place keyed by value, so focus stays on the control just used (code-standard rule 14; [javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll)).
- A later choice that no longer fits is reset in the form and removed from the address, and the chips row says so; the server applies the same reset for a no-script submit (code-standard rule 20).

**Check**
- *Script:* could choose a value in the first facet and assert every enabled value in the second has at least one matching row.
- *Judgement:* design-standard rule 6 is read at review: is the most specific facet first?

**Sources:** Baymard as linked; no source states the ordering itself, which rests on design-standard rule 6.

## Scoped filters

**Use when / don't use**
- Use when the rows differ by kind and each kind has attributes of its own: once a scope is chosen (a category, a tab, a section), offer the facets that belong to it beside the shared ones. NN/g: "once the user has selected Refrigerators, new range-specific facets such as Freezer volume will be displayed" ([NN/g, User Intent Affects Filter Design](https://www.nngroup.com/articles/applying-filters/)); Baymard finds people mostly want to filter by a category's own attributes, not only the generic ones, and that 38% of benchmarked sites miss filters for attributes their lists display ([Baymard, filters for all list item info](https://baymard.com/research-articles/have-filters-for-list-item-info)).
- NN/g: "You’ll obviously need different filter categories for appliances than you’ll need for adoptable pets or rental cars" ([NN/g filter categories](https://www.nngroup.com/articles/filter-categories-values/)).
- Don't show a scope's facets before the scope is chosen; a facet that cannot apply to the current rows is not drawn (design-standard rule 5).
- A search box limited to one part of a site is scoped search, which [search: scoped search](search.md#scoped-search) owns.

**How**
- The scope is the most specific facet, so it comes first and the rest narrow from it (design-standard rule 6): a tab or a category facet above, its own facets below or after the shared ones.
- Find a scope's facets from the attributes its rows already show: every attribute in a row or column is a candidate facet (Baymard).
- Shared facets keep their place and their choice when the scope changes; scoped facets appear after them, so a change of scope moves nothing the reader just used (design-standard rule 2).
- Changing the scope drops the old scope's choices and says so in the chips row ("Removed: Freezer volume"), never silently; readers expect filters to survive navigation, Friedman notes ("customers expecting the filters to still be applied even if they go back to previous categories", [Smashing](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/), commentary), so keep every shared one.
- Counts on scoped facets count within the scope (*Counts*).

**Cases**
- A catalogue of components and tokens offers "Variant count" and "Token type" together on every view → show "Variant count" only once Components is the scope, "Token type" only under Tokens.
- Readers pick Tokens and the shared Status facet resets → keep Status; only Tokens' own facets are new.
- Switching from Components to Tokens removes "Variants: 3+" without a word → note the removal in the chips row and announce the new total.
- The table shows a "Platform" column under Components but no facet filters it → add the facet; a column the reader can read but not filter is Baymard's gap.

**Accessibility**
- 3.2.2 On Input (new facets appearing after a scope choice is no change of context; focus stays on the scope control), 4.1.3 (the new total and any removed filter announced), 1.3.1 (scoped facets labelled as groups like the rest), 2.4.3 (the new facets follow the scope in focus order).
- Implementation: code-standard rule 14 (focus held on the control just used), code-standard rule 2 (DOM order is facet order).

**Build**
- One GET form for the list; scoped facets are rendered by the server from the scope parameter, so a no-script submit gets the right facets (code-standard rule 20; [HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).
- With script, re-render the facet region keyed by facet name, so shared facets keep their nodes and focus stays put (code-standard rule 14; [javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll)).
- Dropping a scope's choices removes their parameters from the address in the same change ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)); the server ignores and reports parameters that do not belong to the scope, so an old link still loads.
- The facets for each scope come from one table of scope to attributes shared with the list's columns, never a list kept by hand per page.

**Check**
- *Script:* could choose each scope and assert every facet shown has at least one matching row, shared facets keep their choice, and every filterable column has a facet.
- *Judgement:* Do the rows really differ by kind enough to earn scoped facets, or would one shared set do?

**Sources:** NN/g, Baymard and Smashing as linked; they agree. NN/g's own advice on scoped search warns that readers overlook a scope, which is why the toolkit makes the scope the first facet, always in sight with its current choice.

## Unavailable options

**Use when / don't use**
- Use whenever a choice leaves an option, a whole menu or a whole control with nothing behind it: design-standard rule 5 sorts the three cases, and this section applies it to filters.
- The option currently selected stays visible even at zero.
- Every source that addresses it disables rather than hides: "Gray out any unavailable options," because "If disabled items are removed, the interface loses spatial consistency and becomes harder to learn" ([NN/g drop-down menus](https://www.nngroup.com/articles/drop-down-menus/)); Friedman agrees and adds that hiding shrinks the filter area and shifts the layout ([Smashing](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/)).

**How**
- Decide by cause, as [interaction: disabled, hidden or read-only](../design/interaction.md#disabled-hidden-or-read-only) sets out ([PatternFly menus](https://www.patternfly.org/components/menus/menu/design-guidelines) applies it to menus): for a filter option the usual cause is another choice the reader can change, so disable it, keep its place and show its zero.
- A disabled option shows "(0)" so the reason is visible; saying why in words is guidance, not yet a rule.
- A disabled segment keeps the segmented control's shape; a disabled menu item keeps the menu's length.

**Cases**
- An area menu lists seven areas at zero for this component → keep them, disabled with "(0)" (design-standard rule 5; the check flags an option hidden in place).
- The selected area drops to zero after a component change → if the choice resets (previous section), fine; if it is kept, it stays visible and selected at zero, with the empty-result message below.
- A menu reads only "All areas (0)" → disable the whole menu.
- A Component menu appears on a tokens file that has no components → don't draw it; a control that can never be enabled is noise.
- A level filter is disabled because the audit service is down → hide the counts and explain in the bar that levels are unavailable; a silent disabled state reads as "no levels exist".

**Accessibility**
- 4.1.2 (disabled exposed as disabled), 1.4.3 (a disabled control is exempt from contrast, so its zero is not the only cue when it matters), 1.3.1. Disabled options in a native `select` are skipped by the keyboard, so the count in the label carries the information.
- Implementation: code-standard rule 9 and code-standard rule 62 (disabled is the control's own attribute; the dim is drawn once), code-standard rule 17. Figma: figma-standard rule 31 (Disabled draws differently from Rest).

**Build**
- An option at zero keeps its place with the control's own `disabled` (an `option`, a radio or a checkbox), and its count still renders ("(0)") (code-standard rule 9, code-standard rule 62).
- The dim is the host's one disabled style, never per control ([tokens: *The disabled opacity, once*](../../code/tokens.md#the-disabled-opacity-once)).
- The selected option is never disabled, even at zero, so the form still submits it.
- A whole facet with nothing to choose is a `fieldset disabled` or a disabled `select`; a facet that can never apply is not rendered (design-standard rule 5).
- In a custom listbox an unavailable option is `aria-disabled="true"`, so arrows still reach it ([accessibility: *Menus, menu buttons and toolbars*](../../code/accessibility.md#menus-menu-buttons-and-toolbars) has the same rule for menus).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 5 ("offers nothing to choose and is not disabled"; "disabled, not hidden"). Could check that the selected option is present in its control even at zero.
- *Judgement:* Can this control ever apply on this view? If not, remove it.

**Sources:** NN/g, Smashing and PatternFly as linked; every source that addresses it disables rather than hides, which design-standard rule 5 admits.

## Applied filters and clear all

**Use when / don't use**
- Always show what is applied, beside the list. Baymard: "sites should therefore always display applied filters in an overview"; 28% of benchmarked sites show none ([Baymard applied filters](https://baymard.com/blog/how-to-design-applied-filters)).
- A count of applied filters alone performed poorly in testing; show the values ([Baymard](https://baymard.com/blog/how-to-design-applied-filters)).
- On a bar of single-choice facets whose collapsed labels show their selection ("Area: Colour"), the bar itself is the overview; chips add nothing.

**How**
- **Chips** in one row under the bar (or above the list beside a sidebar), one per applied value: "Level: Error ×". Each removes its value.
- **Clear all** after the chips when two or more filters are applied; it returns every facet to its default ([Carbon filtering](https://carbondesignsystem.com/patterns/filtering/)), keeps the search unless the search is shown as a chip.
- The chips row keeps its height when empty, or sits below the list's header so it pushes nothing the reader just used (design-standard rule 2).
- On small screens the chips scroll horizontally in one row ([Baymard](https://baymard.com/blog/how-to-design-applied-filters)).
- A closed filter dialog shows the number applied and lets the reader clear without reopening it ([Carbon](https://carbondesignsystem.com/patterns/filtering/)).
- Clear all and the Filters button keep their place across screens ([Anvil filter bar](https://anvil.servicetitan.com/docs/web/components/filter-bar/design)).

**Cases**
- A multi-select level menu collapses to "Levels: 2" → add chips for the two levels; the count alone hides which.
- Removing the last chip makes the row vanish and the list jumps up 40px → reserve the row's height, or place the chips where their removal moves nothing above the reader's focus (design-standard rule 2).
- Clear all also wipes the search the reader typed → keep the search, or show it as a chip so clearing it is visible.
- A docs bar has two single-choice menus showing their values → no chips; a "Reset" link appears when either is off its default.

**Accessibility**
- 4.1.2 (each chip's remove button named "Remove Level: Error"), 2.4.3 (after removing a chip, focus moves to the next chip, or to the bar when none is left), 4.1.3 (the new total announced), 2.5.8 Target Size for the remove control.
- Implementation: code-standard rule 18 (icon-only remove buttons are named), code-standard rule 14 (focus is kept after the swap), code-standard rule 12 (clear all renders only when there is something to clear). Figma: figma-standard rule 26 (24px remove target).

**Build**
- Chips are a `ul` labelled "Applied filters"; each chip's remove control is a link to the current address without that value, or a `button` once enhanced, named "Remove Level: Error" (code-standard rule 18, code-standard rule 20).
- Clear all is a link to the list's clean address, rendered only when two or more filters apply (code-standard rule 12).
- After removing a chip, focus moves to the next chip's button, else the previous, else the bar's first control (code-standard rule 14; [accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- The row reserves its height with `min-block-size` from a token when empty, so removing the last chip moves nothing (design-standard rule 2).
- On small screens the row is one line with `overflow-x: auto`, a named, focusable scroller ([responsive: *Zoom and reflow*](../../code/responsive.md#zoom-and-reflow)).

**Check**
- *Script:* could apply two filters and assert a chip per value, each removing only its value, a clear-all that restores the default address, and a list position unchanged by removing a chip.
- *Judgement:* Is the overview where the reader looks after choosing?

**Sources:** Baymard, Carbon and Anvil as linked. Baymard found no placement winner on desktop; the toolkit puts chips under the bar so they sit where the eye goes after a choice.

## Instant or Apply

**Use when / don't use**
- **Instant** (each choice updates the list) by default: for few facets, fast data and exploring readers ([NN/g](https://www.nngroup.com/articles/applying-filters/); Carbon's instant method suits single-category filtering; NN/g found immediate updates help readers notice an overly narrow choice, [NN/g mobile tray](https://www.nngroup.com/articles/mobile-faceted-search/)).
- **Apply** (choices batch, one button runs them) when the data is slow, when readers set several criteria they already know, or in a filter dialog on a phone where each update would redraw behind the panel ([Carbon](https://carbondesignsystem.com/patterns/filtering/)).
- Don't mix the two in one bar; one facet applying instantly beside another waiting for Apply confuses which is in force.

**How**
- Instant: never freeze the page on a choice and never auto-scroll ("Never freeze the UI on a single input", "Never auto-scroll users on a single input", [Smashing](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/), commentary). Keep focus on the control just used; update the total.
- Apply: the button says what it will show ("Show 42 results") where counts can be computed live; a pending change is visibly unapplied until pressed; Cancel or Escape discards it.
- Without script, the bar is a GET form with a submit button; the script removes the button and applies on change (code-standard rule 20).
- Past about a second, show that the list is updating, in place of the old rows ([interaction: response times](../design/interaction.md#response-times-and-perceived-performance)).

**Cases**
- A bar of three facets over data in the browser → instant.
- A sidebar of nine facets over a server query that takes two seconds → Apply, with the projected count on the button.
- On a phone the tray updates the list behind it on every tap and the scroll position jumps → batch in the tray with "Show N results".
- Choosing a value scrolls the page to the top of the list → stop; the reader loses the bar.

**Accessibility**
- 3.2.2 On Input (instant filtering updates content without changing context or moving focus; it never navigates away), 4.1.3 (the new total announced), 2.2.1 not affected.
- Implementation: code-standard rule 14, code-standard rule 20.

**Build**
- The bar is a GET form with a submit button; for instant, the script listens to `change` on the form (one delegated listener), applies, and removes the submit button (code-standard rule 20; [javascript: *Events and delegation*](../../code/javascript.md#events-and-delegation)).
- For Apply, the button stays and its label carries the projected count; pending state is an attribute on the form (`data-pending`), styled from it, cleared on submit or Cancel.
- Slow updates mark the list `aria-busy="true"` and keep the old rows until the new ones land; the fetch is aborted when a newer change starts ([javascript: *Debouncing input*](../../code/javascript.md#debouncing-input)).
- Focus and scroll hold across the swap (code-standard rule 14); never `scrollIntoView` the list on a choice.

**Check**
- *Script:* could change a facet and assert focus stays on it, the scroll position holds, and the list updates without a full page load; with script off, assert the form submits and filters.
- *Judgement:* Is the data fast enough for instant?

**Sources:** NN/g, Carbon and Smashing as linked. Friedman's commentary favours an Apply button alongside live updates; the toolkit defaults to instant for tool screens, whose data is small, and uses Apply where the data is slow.

## Filters in the address

**Use when / don't use**
- Always: every facet, the search, the sort and the page live in the address, so reload, Back and a shared link restore the view ([Baymard back button](https://baymard.com/blog/back-button-expectations)).
- Each filter change is a new history entry ([ux: state persistence and restore](../design/ux.md#state-persistence-and-restore) owns push, replace and Baymard's evidence).

**How**
- One parameter per facet, values by stable identifier (`?component=button&area=colour`); defaults are omitted, so the clean address is the default view.
- A parameter naming a value that no longer exists falls back to "All" and says so.

**Cases**
- A reviewer sends a link to "Button, colour findings" and the colleague sees all findings → write both facets to the address.
- Back after three filter changes leaves the screen → push an entry per change.
- An old link carries `area=spacing`, renamed to `area=space` → map the old value, or fall back to "All areas" with a note.

**Accessibility**
- 3.2.5 Change on Request (AAA): the view changes only on the reader's action, including on Back.
- Implementation: code-standard rule 20 (a GET form puts filters in the address without script).

**Build**
- The form's `name`s are the parameters, so a no-script submit writes the address (code-standard rule 20); the script builds the same string with `URLSearchParams(new FormData(form))`, drops defaults, pushes per change and restores on `popstate` ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Values are stable identifiers; the server maps retired values and falls back to "All" with a note, so old links keep working.
- On load, the server renders every control from the address, so the page is right before the script runs.

**Check**
- *Script:* could set each facet, reload, and assert the same controls and rows; could press Back and assert the previous filter returns.
- *Judgement:* none beyond the script; it is mechanical.

**Sources:** Baymard as linked.

## Empty result

**Use when / don't use**
- When the filters and search leave no rows, say so and give a way back; never a blank area, and never "no records" while loading.
- Prevent it where you can: counts and disabled options (above) stop most dead ends before the click.

**How**
- Name what is applied: "No findings match Button and Spacing."
- Offer the step most likely to work: remove the last filter, or clear all, as buttons; where counts exist, say where the rows are ("12 in all areas").
- Keep the bar and the chips in place; the empty message sits where the list was, at a height that does not collapse the page (design-standard rule 2).
- Distinguish "nothing matches" from the other kinds of empty state ([feedback: empty states](feedback.md#empty-states)).

**Cases**
- A search plus two facets return nothing → "No components match 'buton' in Errors", with "Clear search" and "Clear all filters".
- The list area collapses to a line and the footer jumps up → keep a minimum height for the empty message.
- A file genuinely has no findings → "No findings in this file" with no clear-filters button, since no filter caused it.
- The list shows "No results" for a moment before rows arrive → render the empty message only after the data has loaded (code-standard rule 12).

**Accessibility**
- 4.1.3 Status Messages (the empty result announced), 2.4.3 (focus stays on the control the reader used; the clear buttons are next in order).
- Implementation: code-standard rule 12 (a fallback renders only when its subject is missing), code-standard rule 14.

**Build**
- The empty block renders only when the finished query returned no rows, never while a request is pending (code-standard rule 12).
- It replaces the list in the same container with a `min-block-size`, so the page keeps its height ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).
- "Clear search" and "Clear all filters" are links to the addresses without them, upgraded by the script like the chips (code-standard rule 20).
- The message goes into the status region, once; focus stays on the control used (code-standard rule 14; [accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).

**Check**
- *Script:* could choose a disabled-at-zero combination via the address and assert a message naming the filters and at least one clear control; could assert no empty message renders while a request is pending.
- *Judgement:* Does the message point to the step that will bring rows back?

**Sources:** [NN/g empty states](https://www.nngroup.com/articles/empty-state-interface-design/) and [Primer empty states](https://primer.style/ui-patterns/empty-states).

## Sorting and filtering

**Use when / don't use**
- Sorting reorders the rows; filtering removes some. Keep them as separate controls so readers do not mistake one for the other.
- In a table, sort from the column headers ([Carbon data table](https://carbondesignsystem.com/components/data-table/usage/)); in a list without headers, a "Sort" menu at the end of the bar, after the actions or beside the total.
- Don't offer a sort as a facet value ("Newest" among "Error / Warning") or a filter inside the sort menu.

**How**
- Three states per sortable column: unsorted, ascending, descending; only the sorted column keeps its icon ([Carbon data table](https://carbondesignsystem.com/components/data-table/usage/)).
- A default sort the reader would choose (severity, then name), stated in the header or menu.
- Sorting keeps every filter and resets to page 1. The sort is in the address and has its own history entry; Back restores the previous direction ([Baymard](https://baymard.com/blog/back-button-expectations)).
- Sorting never changes counts.

**Cases**
- A sort menu reads "Errors first / Warnings first / Only errors" → "Only errors" is a filter; move it to the level facet.
- A list sorted by date loses its sort when a filter changes → keep the sort.
- A table's headers sort but nothing shows which column is sorted → show the arrow on the sorted column and expose the state.

**Accessibility**
- 4.1.2 and 1.3.1 (`aria-sort` on the sorted header; the header's sort control is a button), 4.1.3 (announce the new order), 2.1.1.
- Implementation: code-standard rule 18 (an icon-only sort button is named), code-standard rule 14.

**Build**
- In a table: a `button` inside each sortable `th`, `aria-sort` on the sorted header only, and a no-script link with `?sort=&dir=` ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour)).
- In a list: a labelled `select name="sort"` at the end of the bar, inside the same form so the sort joins the filters in the address.
- Sorting keeps every filter parameter and drops `page` ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Locale-aware ordering of text columns with `Intl.Collator` ([i18n: *Locale-aware sorting*](../../code/i18n.md#locale-aware-sorting)).
- The new order is announced once through the status region; focus stays on the header button (code-standard rule 14).

**Check**
- *Script:* could check exactly one header carries `aria-sort` other than none, the sort is in the address, and changing it leaves the filter parameters intact.
- *Judgement:* Is each control in the sort menu a reordering?

**Sources:** Carbon and Baymard as linked.

## Filter presets

**Use when / don't use**
- Use quick presets when a few combinations cover most visits ("My open findings", "Errors this week"): one click sets several facets at once. Baymard finds that promoting popular filters above the list gives readers a shortcut, especially on phones where the filters sit behind a button, and that 61% of benchmarked sites do not ([Baymard, promoting product filters](https://baymard.com/research-articles/promoting-product-filters)).
- A preset is set by the team that designs the screen; a combination the reader names and keeps is a saved view (*Saved views*, next). Jira's saved filters are the second kind: "saving filters will allow you to save, reuse, and easily access them later" ([Atlassian, save your filters](https://support.atlassian.com/jira-software-cloud/docs/save-your-filters-in-business-projects/)).
- A one-facet shortcut is not a preset; it is that facet's control, made visible (a segmented facet or [filter chips](chips.md#filter-chips)).
- Don't add presets the reader cannot see inside: a preset that hides which filters it set breaks *show state*.

**How**
- Presets sit before the facets, at the start of the bar or above a sidebar, as a single-choice group (design-standard rule 4: segmented up to four, a menu past four), so one is in force at a time; Jira likewise applies "only one at a time" (Atlassian).
- Choosing a preset sets the facets themselves, which stay visible and editable; the chips row shows what it set. Baymard: a promoted filter must still appear in its usual place in the filters.
- Editing any facet after a preset clears the preset's selected state, or marks it "Edited", never leaves it claiming a state that no longer holds (*Saved views* derives this the same way).
- Name a preset for the rows it shows, in the reader's words ("Assigned to me"), not for how it filters ("Owner = current user"); the wording follows [content: filter and menu labels and counts](../design/content.md#filter-and-menu-labels-and-counts), and each preset carries its count (design-standard rule 11).
- A preset is an address: its link can be bookmarked and shared, and the default view is the clean address (*Filters in the address*). Carbon's reset returns "the filters to their original default starting state" ([Carbon filtering](https://carbondesignsystem.com/patterns/filtering/)); Clear all does the same and leaves no preset selected.

**Cases**
- Most readers open the findings screen and set Level to Error and Owner to themselves → a "My errors" preset at the start of the bar.
- A reader picks "My errors", then adds an Area, and "My errors" still shows selected → clear its selection, or mark it edited.
- A preset sets three facets but the bar shows none of them changed → set the controls and show the chips; a preset is a shortcut, not a hidden filter.
- Seven presets crowd the bar → keep the most used three as segments with a menu for the rest, or move the rest to saved views.

**Accessibility**
- 4.1.2 (the preset group exposes which one is selected), 1.3.1 (the group labelled "Presets" or "Quick filters"), 3.2.2 (choosing a preset changes the list, not the context), 4.1.3 (the new total announced).
- Implementation: code-standard rule 20 (a preset is a link to its address and works without script), code-standard rule 14 (focus stays on the preset just chosen), code-standard rule 64 when presets are a list of links (the current one marked `aria-current`).

**Build**
- Each preset is a link to its address (`?owner=me&level=error`), rendered by the server, so it works without script and opens in a new tab (code-standard rule 20; [accessibility: *Keyboard access and modified clicks*](../../code/accessibility.md#keyboard-access-and-modified-clicks)).
- The current preset is derived by comparing the address with each preset's, marked with `aria-current="page"`, never stored as a separate flag (code-standard rule 64; [HTML semantics: *Navigation markup*](../../code/html-semantics.md#navigation-markup)).
- With script, a click sets the form's fields and runs the same apply path as a facet change, one handler for both ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Presets live in one definition shared by the links and their counts, so a count and the rows behind it cannot disagree.

**Check**
- *Script:* could follow each preset's link and assert the facets show its values, exactly one preset is current when the address matches, and none after a facet edit.
- *Judgement:* Do the presets match combinations readers actually repeat, and are they few enough to stay in sight?

**Sources:** Baymard, Atlassian and Carbon as linked. No Primer or NN/g page opened in this session covers presets or saved filters. Baymard promotes single popular filter values; the toolkit extends the idea to named multi-facet presets on tool screens, and keeps Baymard's condition that the filters themselves stay in place and in sight.

## Saved views

**Use when / don't use**
- Use when readers return daily to the same combination of filters, sort and columns (my open findings, this file's errors).
- Don't build it before the address holds the full state; a bookmark of the address is the first saved view and costs nothing.

**How**
- A saved view is a name for an address: the facets, search, sort and columns it restores.
- Saved views sit with the tabs or before the facets as a menu named "Views", opening on the default view's name; picking one sets the bar's controls, which stay editable.
- A view edited after loading shows that it differs ("Edited") with Save and Reset; never save silently.
- Shared views (for a team) are marked apart from personal ones.

**Cases**
- Readers ask for "my filters" → first make sure the address carries them and say a bookmark works; add saved views only if that is not enough.
- A view loads, the reader changes a facet, and the view's name still shows unchanged → mark it edited.
- A saved view refers to a component since removed → load the rest and show the missing value as a removable chip with a note.

**Accessibility**
- 4.1.2 (the views menu names its current view), 3.2.2 (choosing a view changes the list, not the page context), 4.1.3 (announce the loaded view's total).
- Implementation: code-standard rule 20 (a view is a link to an address, so it works without script), code-standard rule 64 if views are a list of links (the current one marked).

**Build**
- A saved view is a stored address: render each as a link to it, so it works without script (code-standard rule 20).
- A list of views is a `nav` of links with `aria-current="page"` on the loaded one when the address matches exactly (code-standard rule 64; [HTML semantics: *Navigation markup*](../../code/html-semantics.md#navigation-markup)); a menu of views is a native `select` that navigates only from a Go button or on submit, never on `change` (3.2.2, [accessibility: *Keyboard access and modified clicks*](../../code/accessibility.md#keyboard-access-and-modified-clicks)).
- "Edited" is derived by comparing the current address with the view's, not tracked as a separate flag that can drift.
- Saving is a POST to the server with the address; the view's name and owner live there, never in `localStorage` only ([security: *Forms and cross-site request forgery*](../../code/security.md#forms-and-cross-site-request-forgery)).

**Check**
- *Script:* could load each saved view's address and assert the controls match its stored state.
- *Judgement:* Do readers repeat the same combination often enough to name it?

**Sources:** no published source opened in this session sets rules for saved views; this section is house practice built on the address rules above.
