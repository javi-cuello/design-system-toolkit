# Search

How a person types to find something: a site search that covers everything, and a search box that narrows one list. It covers the box itself (visible, wide enough, labelled), where it sits, its wording, when it runs, the results page and its no-results state, matches shown in results, the query in the address, keyboard access and scoped search. It serves the principles *discoverable* (search is a box in sight, never a hidden link), *efficient for people who know it* (a shortcut and an address that holds the query) and *people in control* (Escape clears, Back returns). It applies design-standard rule 3 (in a filter bar the search sits last, after the facets) and design-standard rule 2 (results changing never moves the box). Filters beside the search are `filtering.md`'s; navigation around it is `navigation.md`'s.

First decide which search it is. **Site search** finds pages across a site or tool and lands on a results page. **List search** narrows the rows of one list or table in place, as one more filter. They look alike and behave differently; a box that does one while looking like the other misleads.

## Site search and list search

**Use when / don't use**
- **Site search** when the site has more pages than its navigation can show at once, or readers arrive knowing a name (a component, a token, a setting). Carbon: "Use at a global level when searching an entire site" ([Carbon search](https://carbondesignsystem.com/components/search/usage/)).
- **List search** when one list or table is long enough that scanning fails, typically past a screen or two of rows. Carbon: "at a component level when searching data in a component, like a data table".
- Don't add site search to a site of a dozen pages; good navigation is cheaper and better.
- Don't put two boxes on one screen that both look global; if a page has both, the list search sits in the filter bar and is labelled with what it searches.

**How**
- Site search lives in the global bar, the same place on every page. List search lives in the list's filter bar, after the facets (design-standard rule 3).
- Each box says what it searches, in its label and placeholder: "Search the docs", "Search components".
- Site search lands on a results page with its own address. List search narrows the list in place and adds its query to the list's address.
- A list search combines with the facets by AND: the rows shown match the query and every chosen facet ([Baymard](https://baymard.com/blog/allow-applying-of-multiple-filter-values)).

**Cases**
- A docs site has a box in the header and another above its token table → label them "Search the docs" and "Search tokens"; two unlabelled boxes make the reader guess which one ran.
- A tool's list search is used to jump to another page → make it a site search in the header, or keep it narrowing only; one box, one behaviour.
- A list of 15 rows has a search box → remove it; the rows fit in sight.
- Typing in a list search leaves the facet counts unchanged → recount the facets within the query; counts follow what the list shows (design-standard rule 11).

**Accessibility**
- 1.3.1 and 4.1.2: a site search is a `form` with `role="search"` (or the `search` element); the input has a programmatic label. 3.3.2 Labels or Instructions: the label says what is searched. 3.2.3 and 3.2.4: the same search, the same place and name on every page.
- Implementation: code-standard rule 1 (a labelled search landmark), code-standard rule 20 (site search is a real GET form that works without script), code-standard rule 15 (a hint or count beside the box is a description, not part of the name).

**Build**
- **Site search**: a `search` element wrapping a GET `form` with an `action` (the results page) and an `input type="search" name="q"`; the snippet is [HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms).
- **List search**: the same input inside the list's filter form, so `q` joins the facets in one address; no `search` landmark of its own unless the page has no site search ([HTML semantics: *Landmarks*](../../code/html-semantics.md#landmarks)).
- Each input's `label` says what it searches; two search landmarks on one page each get a name (code-standard rule 1).
- The list search's AND with the facets and its recount come from one query function over the form's values, not two filters (code-standard rule 36).
- code-standard rule 15 and code-standard rule 20 apply as the section's Accessibility part says.

**Check**
- *Script:* could check that every `input[type=search]` has an accessible name, that a site search is inside a search landmark, that no page has two search inputs with the same name, and that a site search form has a GET `action`.
- *Judgement:* Does each box search what the reader would expect from where it sits?

**Sources:** Carbon as linked; Carbon also offers page-level search for one page's content.

## The box: visible, wide and labelled

**Use when / don't use**
- Search is a box in sight, "a type-in field and not a link", on every page where it applies ([NN/g, Search: Visible and Simple](https://www.nngroup.com/articles/search-visible-and-simple/)). Replacing a link with a box raised search use by 91% in the author's own test.
- Don't hide the box behind an icon on a wide screen. An icon that expands into a box is acceptable only where space is truly short (a phone header).

**How**
- **Width.** Wide enough "to contain the typical query" ([NN/g](https://www.nngroup.com/articles/search-visible-and-simple/)); NN/g gives no character count. Size it from the queries this product gets (the longest common component or token name, plus a margin), so a typical query never scrolls inside the box.
- **Label.** A visible label or a label the screen reader reads; a magnifier icon and a placeholder are not a label.
- **Placeholder** hints at what can be searched: "Useful and short text hinting at what the user can search for" ([Carbon](https://carbondesignsystem.com/components/search/usage/)). "Search components" or "Name or token", never "Type here…", never an example the reader might mistake for an entered value.
- **Clear button** appears once there is text and clears it ([Carbon](https://carbondesignsystem.com/components/search/usage/)); it has a name.
- **Submit.** A site search has a submit button (an icon with a name is enough); a list search that runs as you type needs none, but its form still submits on Enter without script.
- **Height** matches the controls beside it in the bar; Carbon's sizes are 24, 32, 40 and 48px, and a target is at least 24px (figma-standard rule 26).
- **States:** rest, hover, focus (a visible ring), filled, and disabled only if the list it searches is unavailable.

**Cases**
- A designer draws a 120px box for queries like "Colour/Background/Neutral/strong" → widen it, or let it grow on focus; a query that scrolls out of view cannot be checked.
- The box has only a placeholder "Search" and no label → add an accessible label naming what it searches; a placeholder disappears when typing begins.
- The header shows a magnifier icon that opens a box on click, on a 1440px screen → show the box; there is room, and a hidden box is a link.
- The clear button is an unnamed "×" → name it "Clear search" (code-standard rule 18).

**Accessibility**
- 3.3.2 Labels or Instructions, 4.1.2 (the input's name), 1.4.11 Non-text Contrast (the box's border at 3:1 against its surface), 2.4.7 Focus Visible, 2.5.8 Target Size for the clear and submit buttons, 1.4.3 for placeholder text if it carries information.
- Implementation: code-standard rule 18 (icon-only clear and submit buttons are named), code-standard rule 16 (the native input follows the theme). In a Figma component: figma-standard rule 26 (24px targets), figma-standard rule 31 (focus visibly different), figma-standard rule 32 (placeholder and value text contrast in every mode).

**Build**
- `<label>` plus `input type="search"`; a visually hidden label is acceptable where the design shows none, never `placeholder` alone ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- Width in `ch` or `rem` from the typical query (`inline-size: min(100%, 32ch)`), so it scales with the reader's font size ([responsive: *Zoom and reflow*](../../code/responsive.md#zoom-and-reflow)).
- The designed clear button is `button type="button" aria-label="Clear search"`, rendered while the field has a value (`:placeholder-shown` hides it in CSS), and returns focus to the input; hide the browser's own cross only when drawing one (`::-webkit-search-cancel-button`) (code-standard rule 18).
- Submit is a `button type="submit"`, named when icon-only.
- States as pseudo-classes: `:hover`, `:focus-visible` on the input, filled as `:not(:placeholder-shown)`, `disabled` the control's own (code-standard rule 9, code-standard rule 62).
- The input follows the theme with `color-scheme` (code-standard rule 16).

**Check**
- *Script:* could check the input's rendered width holds the product's typical query at its font size, that it has an accessible name independent of `placeholder`, and that the clear button has a name.
- *Judgement:* Does the placeholder tell the reader what they can find?

**Sources:** NN/g and Carbon as linked.

## Placement

**Use when / don't use**
- Site search: in the global bar; NN/g found "the top of the page, usually in the right hand corner" works, and the left side "almost as well" ([NN/g](https://www.nngroup.com/articles/search-visible-and-simple/)). Pick one and hold it on every page.
- List search: in the list's single filter bar, after the facets and toggles, with the screen's actions after the search (design-standard rule 3).
- Don't put a list search above the tabs; the tabs choose what the screen shows and the search narrows what they chose.

**How**
- The bar reads facets, toggles, search, actions, left to right, in one row on wide screens (design-standard rule 3).
- The search takes the remaining width between the facets and the actions, within the width limits above.
- On a narrow screen the facets collapse into a "Filters" button and the search keeps its own full-width row, so the most used control stays in sight.
- A results count sits next to the list, close to the bar, and updates as the query changes.

**Cases**
- An audit screen puts its search left of the facets → move it after them (design-standard rule 3; the check flags it).
- A large table whose main task is finding one row, built on Carbon → Carbon's data table puts its always-open search on the left under the title, stretching to the actions; the toolkit keeps the house order, since one order across every screen is learned once. Record the divergence if a project overrides it.
- A dashboard header has site search right and the filter bar's search also right, stacked → keep both; label each, so the reader can tell the global box from the list box.
- At 375px the bar wraps facets, search and actions onto three rows → collapse facets into a menu, keep search on its own row, move actions to an overflow menu.

**Accessibility**
- 2.4.3 Focus Order: the tab order follows the bar's visual order. 1.4.10 Reflow at 320px without horizontal scroll. 3.2.3 Consistent Navigation for the site search's place.
- Implementation: code-standard rule 2 (DOM order matches the visual order; never reorder the search with `order`).

**Build**
- DOM order is the bar's visual order: facets, toggles, search, actions; never `order` or `flex-direction: row-reverse` to move the search (code-standard rule 2).
- The search takes the free width with `flex: 1 1 auto` between its limits; the bar wraps or collapses by container query, measured from the content ([responsive: *Container queries*](../../code/responsive.md#container-queries)).
- On narrow screens the facets move behind a Filters disclosure and the search keeps its own row, from the same markup ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)).
- The results count beside the list is the status region of [accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 3 ("facets and toggles come first, search last"). Could check the site search's position is the same on every page.
- *Judgement:* Is search the reader's main tool on this screen, and if so does it get the width it needs?

**Sources:** [Carbon data table](https://carbondesignsystem.com/components/data-table/usage/) places the search left; NN/g accepts either side for site search. The toolkit puts list search last in the filter bar, by design-standard rule 3, and does not follow Carbon's table.

## Instant or submitted

**Use when / don't use**
- **Instant** (results update as the person types) for list search over data already loaded or quick to fetch: it is a filter, and filters suit instant updates when the data is fast ([NN/g, User Intent Affects Filter Design](https://www.nngroup.com/articles/applying-filters/)).
- **Submitted** (Enter or the button runs it) for site search, and for any search whose results take longer than about a second ([NN/g response times](https://www.nngroup.com/articles/response-times-3-important-limits/)). Carbon's search submits on Enter ([Carbon](https://carbondesignsystem.com/components/search/usage/)).
- Don't run a slow search on every keystroke; it freezes the page and flickers the list.

**How**
- Instant search waits for a short pause in typing (a debounce) before running, keeps the box focused and the caret in place, and never moves the box (design-standard rule 2).
- Show the result count as it changes, announced politely; never announce every keystroke.
- **Suggestions** (autocomplete) for a site search: up to 10 on desktop and 4 to 8 on mobile; arrow keys move through them and Enter submits the highlighted one; emphasise the predicted part, not what the person typed ([Baymard autocomplete](https://baymard.com/blog/autocomplete-design)).
- Under about one second, no spinner; longer, show that results are loading, in place of the old ones ([interaction: response times](../design/interaction.md#response-times-and-perceived-performance)).
- A minimum query length only where one character returns everything; say so in the hint.

**Cases**
- A token list of 600 rows filters in the browser → instant, run after a short pause in typing, with the count beside the list.
- A docs site search calls a server index that takes 1.5s → submitted, landing on a results page with the query in the address.
- Each keystroke replaces the table and focus jumps to the top → keep focus in the box across the swap (code-standard rule 14).
- Autocomplete bolds the letters typed → reverse it: bold the suggested completion ([Baymard](https://baymard.com/blog/autocomplete-design)).

**Accessibility**
- 4.1.3 Status Messages (the new count announced without moving focus), 3.2.2 On Input (typing narrows results; it never navigates away), 2.1.1 (suggestions reachable by arrow keys), 4.1.2 for a combobox (`aria-expanded`, `aria-activedescendant`).
- Implementation: code-standard rule 14 (a live swap keeps focus in the box), code-standard rule 20 (Enter submits a GET form without script). A combobox with suggestions follows the [W3C APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), keyboard included.

**Build**
- Both start as a submitted GET form; instant is the script listening to `input`, debouncing the fetch and the history write, and aborting the previous request ([javascript: *Debouncing input*](../../code/javascript.md#debouncing-input)).
- The list is swapped in place with focus and caret left in the input (code-standard rule 14; [javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll)).
- The count goes once per settled query into a status region present from page load ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- Suggestions are the [APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) on the input (`role="combobox"`, `aria-expanded`, `aria-controls` a `listbox`, `aria-activedescendant`), built as in [accessibility: *Selection controls past the native set*](../../code/accessibility.md#selection-controls-past-the-native-set).
- `enterkeyhint="search"` gives phones the right key; Enter submits the form natively (code-standard rule 20).
- A loading state past a second is an attribute on the list (`aria-busy="true"`, styled from it), cleared when the swap lands.

**Check**
- *Script:* could type into a list search and assert focus stays in the input, the box does not move, a polite live region updates once per settled query, and the listed rows all contain the query.
- *Judgement:* Is the data fast enough for instant, and is a mid-query result useful or noise?

**Sources:** NN/g, Carbon and Baymard as linked.

## Results page and no results

**Use when / don't use**
- A site search always lands on a results page with its own address; a list search shows its results in the list.
- Don't send a single exact match straight to its page without saying so; show the results page or say "Showing the only match".

**How**
- **Query echoed:** the box at the top of the results still holds the query, ready to edit, and the heading says it: "12 results for 'focus ring'".
- **Count** of results, counted the way the list counts.
- Each result: its title as the link, where it lives (section or breadcrumb), and a short excerpt showing the match.
- **Grouping** by type (components, tokens, guides) when the site has distinct kinds, each with its count; a tab per type only if the types are independent (design-standard rule 3).
- **No results** ([NN/g no-results pages](https://www.nngroup.com/articles/search-no-results-serp/)): say clearly that nothing matched the query; restate the query; keep the box with the query in it; offer spelling corrections in the body of the page and similar queries that do return results; advise fewer or different words. Don't fill the space with unrelated links the reader may mistake for results.
- **List search with no rows:** [filtering: empty result](filtering.md#empty-result).
- Never show "No results" while results are loading.

**Cases**
- A docs search for "colour" finds nothing because the site spells "color" → offer "Search for 'color'" in the body; NN/g found a "Did you mean" placed above the results tabs went unseen.
- A results page heading reads "Search results" and the box is empty → echo the query in both.
- A list search returns nothing because a facet excluded every match → say so: "No matches in Errors. 4 matches in all levels", with a link that clears the facet.
- Results show a spinner then "No results" flashes before the real list → hold the empty state until the request finishes.

**Accessibility**
- 2.4.2 Page Titled (the title includes the query and count), 4.1.3 Status Messages (the count and the no-results message announced), 2.4.6 Headings and Labels, 1.3.1 (results as a list, each with a heading or link).
- Implementation: code-standard rule 12 (an empty state renders only when there is nothing to show), code-standard rule 1 (results as a list under one `h1`).

**Build**
- The results page reads `q` on the server: `<title>` and the `h1` echo the query and count, the box is rendered with `value` set ([HTML semantics: *Document metadata*](../../code/html-semantics.md#document-metadata)).
- Results are an `ol` of items, each a heading-level link, its location (a breadcrumb or section name) and an excerpt ([HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).
- Groups by type are `section`s named by their headings, each with its count; tabs only under design-standard rule 3 ([navigation: tabs](navigation.md#tabs)).
- The no-results block renders only when the finished query returned nothing, never while loading (code-standard rule 12); its spelling suggestion is a link to `?q=<suggestion>`.
- A list search's empty list is [filtering: empty result](filtering.md#empty-result).

**Check**
- *Script:* could submit a nonsense query and assert the page says no results matched, shows the query, keeps it in the box, and offers at least one way forward; could assert the title contains the query.
- *Judgement:* Does the no-results page give a next step that is likely to work?

**Sources:** NN/g as linked.

## Highlighting matches

**Use when / don't use**
- Use in results lists and excerpts so the reader sees why each result matched.
- Don't highlight in a list search that shows whole names a few characters long; the match is the row.

**How**
- Mark the matched text with `mark`, drawn as a background or a weight change that reads in both themes, and never by colour alone.
- In autocomplete, emphasise the predicted part, the reverse of results ([Baymard](https://baymard.com/blog/autocomplete-design)).
- Highlight whole matched terms, case-insensitively; don't highlight inside the result's link text so heavily that it stops reading as a link.

**Cases**
- An excerpt marks matches in the same yellow in dark mode, failing contrast → use a highlight token per mode; the marked text keeps its contrast (figma-standard rule 32).
- Twenty matches in one excerpt turn it into a stripe → highlight the first few occurrences per excerpt.
- A screen reader announces nothing about the highlight → that is acceptable; the excerpt's text carries the match.

**Accessibility**
- 1.4.1 Use of Color (a highlight that is only a colour shift needs a second cue such as weight or background), 1.4.3 Contrast for text on the highlight.
- Implementation: code-standard rule 22 (the highlight colour is a token). Figma: figma-standard rule 32.

**Build**
- Wrap each matched term in `mark`, built on the server or by escaping the text first and only then inserting the tags, never by injecting the query as HTML ([javascript: *Escaping and templating safely*](../../code/javascript.md#escaping-and-templating-safely)).
- Style `mark` from a highlight token per theme, background plus weight, never the browser's default yellow (code-standard rule 22; [tokens: *Themes and modes*](../../code/tokens.md#themes-and-modes)).
- No `::before` "highlight start" text: MDN keeps that for when missing the highlight changes the meaning, which a search excerpt does not ([HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).
- Matching is case- and accent-insensitive with `Intl.Collator` (`sensitivity: 'base'`), so "Colour" highlights "colour" ([i18n: *Locale-aware sorting*](../../code/i18n.md#locale-aware-sorting)).

**Check**
- *Script:* could check each `mark`'s text against its background for 4.5:1 in every theme.
- *Judgement:* Does the highlight help the reader pick the right result?

**Sources:** no published source opened in this session states a rule for highlighting in results; this section is house practice. The autocomplete rule is Baymard's.

## The query in the address

**Use when / don't use**
- Always: a site search's results page and a list search's narrowed list both carry the query in the address (`?q=focus+ring`), so reload, Back and a shared link restore it.
- Don't create a history entry per keystroke ([ux: state persistence and restore](../design/ux.md#state-persistence-and-restore)).

**How**
- A site search is a GET form whose input is named `q`; the results page reads it. Without script it still works.
- A list search replaces the history entry while typing and pushes one when the query settles or is submitted, so Back undoes the search as one step.
- The query combines with the facets in one address (`?q=button&level=error`).
- Clearing the search removes the parameter.

**Cases**
- A reader sends a colleague a link to a filtered audit list, and the search is lost → put `q` in the address beside the facets.
- Back after typing "button" steps back through "butto", "butt", "but" → replace while typing.
- A results page works only with script → make the form a real GET with an `action` (code-standard rule 20).

**Accessibility**
- 3.2.5 Change on Request (AAA): nothing navigates until asked.
- Implementation: code-standard rule 20.

**Build**
- The input is `name="q"` in a GET form; the server reads it, so reload and a shared link work with no script (code-standard rule 20).
- The script builds the address from the form with `URLSearchParams(new FormData(form))`, replaces while typing, pushes on settle or submit, and restores on `popstate` ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- An empty query removes `q` from the address rather than writing `q=`.

**Check**
- *Script:* could type a query, reload, and assert the box and the list show the same query and rows; could press Back once and assert the search is gone.
- *Judgement:* none; it is mechanical.

**Sources:** Baymard as linked.

## Keyboard

**Use when / don't use**
- Every search is fully usable from the keyboard: reach it, type, submit, move through suggestions, clear.
- A single-key shortcut to focus search suits tools used daily; GitHub uses S or / to "Focus the search bar" ([GitHub keyboard shortcuts](https://docs.github.com/en/get-started/accessibility/keyboard-shortcuts)).

**How**
- **/ to focus** the main search, ignored while focus is in any text field. Show the shortcut as a hint in or beside the box.
- **Escape** clears the box ([Carbon](https://carbondesignsystem.com/components/search/usage/)); if suggestions are open, the first Escape closes them and the second clears.
- **Enter** submits; in suggestions, Enter takes the highlighted one.
- **Arrow keys** move through suggestions and loop at the end ([Baymard](https://baymard.com/blog/autocomplete-design)).
- A single-character shortcut can be turned off or remapped, or works only when the page has focus outside fields (WCAG 2.1.4). GitHub lets people turn off character-key shortcuts in its accessibility settings.

**Cases**
- Pressing / while typing a comment jumps to search → ignore the shortcut while focus is in an input, textarea or editable region.
- Escape in the box closes a dialog the box sits in → stop it at the box when the box has text; Escape clears first.
- The shortcut hint is shown but the key does nothing on a page without search → show the hint only where the shortcut works.

**Accessibility**
- 2.1.1 Keyboard, 2.1.4 Character Key Shortcuts (turn off, remap, or active only on focus), 2.4.7 Focus Visible, 2.1.2 No Keyboard Trap.
- Implementation: code-standard rule 21 (modified clicks and keys pass to the browser), code-standard rule 19 (Escape is added by script, not given by the platform).

**Build**
- `/` focuses the search from a document `keydown` handler that ignores the key when focus is in an input, `textarea`, `select` or `[contenteditable]`, and when a modifier is held (code-standard rule 21):
  ```js
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    e.preventDefault(); searchInput.focus();
  });
  ```
- The shortcut can be turned off by a stored preference (2.1.4), and is shown as a `kbd` hint only where the handler is registered.
- Escape clears the box in the script (Chrome's native clear is not every engine, [HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)), and calls `stopPropagation` only when it cleared something, so an enclosing dialog still closes on the next press (code-standard rule 19).
- Arrows and Enter inside suggestions are the combobox's ([accessibility: *Selection controls past the native set*](../../code/accessibility.md#selection-controls-past-the-native-set)).

**Check**
- *Script:* could press / with focus on the body and assert the search is focused, press / inside another input and assert nothing moves, and press Escape in a filled box and assert it is empty.
- *Judgement:* Is the product used often enough to earn a shortcut?

**Sources:** GitHub, Carbon and Baymard as linked.

## Scoped search

**Use when / don't use**
- A scope limits a site search to one part (this section, this file, components only). Use it when the scopes are clearly delimited and answer real problems ([NN/g](https://www.nngroup.com/articles/search-visible-and-simple/)).
- Default to searching everything; NN/g calls scoped search "dangerous" in general because readers overlook the scope.
- A list search is already scoped to its list; it needs no scope control, only a label saying what it searches.

**How**
- Search the whole site by default; state the active scope at the top of the results; offer one click to widen to the whole site ([NN/g](https://www.nngroup.com/articles/search-visible-and-simple/)).
- A scope selector beside the box follows design-standard rule 4 (segmented up to four scopes, a menu past four) and design-standard rule 12 if it is a menu ("All docs", not "All").
- A scope that cannot apply on this page is not offered (design-standard rule 5).
- Advanced search, if any, is linked from the results page ("Didn't find it? Try advanced search"), never from the home page ([NN/g](https://www.nngroup.com/articles/search-visible-and-simple/)).

**Cases**
- A search inside the Components section silently searches only components and misses a guide → default to the whole site and offer "Only in Components" as a refinement on the results page.
- Results for a scoped search say nothing about the scope → add "Showing results in Tokens. Search all docs" above them.
- A scope menu opens on "All" beside a facet menu that also opens on "All" → name each ([content: filter and menu labels and counts](../design/content.md#filter-and-menu-labels-and-counts)).

**Accessibility**
- 3.3.2 (the scope is part of the label or described), 4.1.3 (a scope change that changes results is announced), 1.3.1 (the scope control is grouped with the box).
- Implementation: code-standard rule 15 (the scope as a description of the box, not part of its name).

**Build**
- The scope is one more GET parameter (`?q=focus&scope=tokens`) on the same form, omitted for the default, everything ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Up to four scopes: radios styled as segments in a `fieldset` with a `legend`; past four, a labelled `select` (design-standard rule 4; [HTML semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).
- The scope describes the box (`aria-describedby` pointing at the scope's text), never joins its name (code-standard rule 15).
- The results page states the scope in text and offers "Search all docs" as a link to the same address without `scope`.

**Check**
- *Script:* could check that a results page with a scope parameter states the scope in text and offers a link without it.
- *Judgement:* Would readers rather search everything and filter after?

**Sources:** NN/g as linked.
