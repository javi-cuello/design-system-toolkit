# Data grid

When a table becomes a data grid and how to build one: the threshold between them; anatomy; the toolbar and bulk actions; column management (resize, reorder, hide, pin); editing; pagination or virtual scroll; the keyboard model and focus; roles; performance. A data grid is an interactive widget with a tabular structure: people move through it cell by cell, edit cells, select ranges, and manage its columns. Everything a grid shares with a table stays in [tables](tables.md) (what earns a column, alignment, cell content, density, sticky header, sorting, selection and bulk actions, empty and loading states, captions); filtering its rows is [filtering](filtering.md). This page adds only what a grid changes. It serves design-standard's principles *efficient for people who know it* and *for everyone, in any context*, and applies design-standard rule 2 (the layout holds still while the grid's rows change).

## Table or data grid

**Use when / don't use**
- A data grid when the primary purpose is to "edit or otherwise interact with the cells (like a spreadsheet)", or when "rows or columns support some kind of user interaction" ([Primer DataTable guidelines](https://primer.style/product/components/data-table/guidelines/)).
- A table for everything people read, sort, filter and act on by row: a link in the identifier cell, a checkbox and an overflow menu per row do not make a grid. Roselli: "Don't use ARIA grid roles unless you are making a spreadsheet (or something like it)" ([Roselli, it's still OK to use tables](https://adrianroselli.com/2017/11/hey-its-still-ok-to-use-tables.html)).
- Not a grid for one column of content ([Fluent DataGrid best practices](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-table/stories/src/DataGrid/DataGridBestPractices.md): "Don't … Use DataGrid to display single-column content").

**How**
- List the interactions the screen needs. Cell editing, range selection, keyboard movement between cells, column resizing or reordering by the person, or more rows than the browser can render: each pushes towards a grid. Sorting, filtering, pagination, row selection and row actions do not; a table has them all ([tables](tables.md)).
- Choose once per screen and state it in the design's notes: the choice decides the roles, the keyboard model and the cost of the build (a grid's keyboard is code the team owns, [APG grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/): it "Requires the author to provide code that manages focus movement inside it").
- Prefer a table that opens a record for editing (a page, a side panel, a dialog) when edits are occasional. Atlassian: "Use a modal dialog or dedicated page for entering content instead of input fields" in a table ([Atlassian dynamic table](https://atlassian.design/components/dynamic-table/usage)); NN/g: inline row editing "works only if the table is narrow" ([NN/g, data tables](https://www.nngroup.com/articles/data-tables/)).

**Cases**
- A findings table with sorting, a filter bar, checkboxes and a row menu → a table; none of it needs a grid.
- A token value editor where people change dozens of values in a row of a sheet → a grid.
- A table given `role="grid"` because a library defaulted to it, with no arrow-key support → a table: an unfinished grid promises a keyboard it does not have.

**Accessibility**
- 4.1.2: `role="grid"` tells a screen reader the content is "a fully interactive widget" (Roselli); the full keyboard model must follow, or the role must go.
- APG table pattern: a table "is not an interactive widget"; authors are "strongly encouraged to use a native HTML table element whenever possible" ([APG table](https://www.w3.org/WAI/ARIA/apg/patterns/table/)).

**Build**
- A table is a native `table` with no widget role ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)); its links, checkboxes and row menus are ordinary tab stops.
- A grid is the same `table` with `role="grid"` added and the full APG grid keyboard behind it ([code accessibility: *Data grids*](../../code/accessibility.md#data-grids)); never the role without the keyboard.
- Occasional edits open the record in a `dialog` or a page ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)), which keeps the table a table.
- The choice is one component kind per screen: a grid is a behaviour-heavy component, built once and reused (code-standard rule 8, code-standard rule 36).

**Check**
- *Script* could: flag `role="grid"` on an element where arrow keys do not move focus between cells, and a grid whose cells hold no editable or interactive content.
- *Judgement*: which interaction on this screen needs cell-level focus?

**Sources.** Primer, Roselli, Fluent and APG agree: a table unless cells are interactive. NN/g and Atlassian prefer editing outside the table; the toolkit follows them for occasional edits.

## Anatomy

**What good looks like**
- From top to bottom: a toolbar (search, filters, column settings, density, export, and the bulk action bar in its place when rows are selected); the header row with sort, resize and column-menu affordances; the body; a footer with the row count, pagination or the loaded range.
- The identifier column first and frozen when the grid scrolls sideways; a selection column before it when rows are selectable; row actions last.
- Editable cells look editable before they are entered.

**How**
- Toolbar and bar: [tables: selection and bulk actions](tables.md#selection-and-bulk-actions) owns the swap; Carbon's toolbar holds "global table actions such as table settings, complex filters, exporting, or editing table data", up to five ([Carbon data table](https://carbondesignsystem.com/components/data-table/usage/)). The filter bar follows design-standard rule 3 and [filtering](filtering.md).
- Column header: label, sort control ([tables: headers and sorting](tables.md#headers-and-sorting)), a resize handle at its trailing edge, and a column menu (sort, hide, pin) behind one button; nothing else in the header (Atlassian's dynamic table: "Never put additional controls like links or buttons in table headings").
- Editable cells: a subtle affordance (an edit cursor on hover and focus, a faint field outline, or a pencil in the header), never a field drawn in every cell at rest; Material marks editable fields with placeholder text ([Material data tables](https://m1.material.io/components/data-tables.html)).
- Footer: "101 to 150 of 1,204" or "1,204 rows", and pagination where used ([tables: pagination or load more](tables.md#pagination-or-load-more)).

**Cases**
- A grid with sort, filter, hide and pin icons on every header → one menu button per header beside the sort control.
- Every cell rendered as a text input at rest → plain values with an edit affordance on focus; inputs at rest make the grid a form and slow it.
- Row count shown only in the toolbar on page 1 → in the footer, always.

**Accessibility**
- The grid has an accessible name: `aria-labelledby` to its visible heading, or `aria-label` (Fluent DataGrid best practices).
- Header cells are `columnheader`, identifier cells `rowheader` ([MUI X accessibility](https://mui.com/x/react-data-grid/accessibility/) applies `rowheader` to the chosen column).

**Build**
- `<table role="grid" aria-labelledby="…">` under its visible heading; the toolbar is a `role="toolbar"` above it, outside the table ([code accessibility: *Composite widgets and roving tabindex*](../../code/accessibility.md#composite-widgets-and-roving-tabindex)).
- Headers are `th scope="col"`, the identifier `th scope="row"`; each header holds its sort `button` and one column-menu `button` with `aria-haspopup="menu"` and `aria-expanded` ([HTML semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour)).
- Editable cells carry an attribute (`data-editable`), styled at `:hover` and `:focus-visible`; an editor element exists only in edit mode (code-standard rule 6, code-standard rule 9).
- The footer's row count is a `p` with `role="status"` outside the table, so it is announced when it changes ([code accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- Icon-only header buttons are named, "Column menu: Owner" (code-standard rule 18).

**Check**
- *Script* could: assert the grid has an accessible name, a header row, and one `rowheader` per row; assert header controls are buttons with names.
- *Judgement*: can someone tell which cells they can change before entering one?

**Sources.** Carbon, Atlassian, Fluent, MUI X and Material; the single column menu is commentary.

## Column management

**Use when / don't use**
- Resize when content widths vary and people need to read more of one column; reorder and hide when people's tasks differ; pin when the grid scrolls sideways.
- Don't offer all four by reflex: each is a control on every header and a state to persist.

**How**
- Resize: drag the header's trailing edge, and also by keyboard (a column-menu item or arrow keys on the focused handle); a double-click fits the column to its content. React Spectrum: resizable columns let "users … dynamically adjust the width of a column" ([React Spectrum TableView](https://react-spectrum.adobe.com/react-spectrum/TableView.html)).
- Hide and reorder: a "Columns" panel from the toolbar listing every column with a checkbox and a drag handle, and "Hide" in each column menu ([MUI X column visibility](https://mui.com/x/react-data-grid/column-visibility/)). The identifier cannot be hidden (MUI X's `hideable: false`). NN/g: "Hiding and reordering columns must be easy to accomplish", with a visible sign that columns are hidden.
- Pin: identifier left, actions right ([MUI X column pinning](https://mui.com/x/react-data-grid/column-pinning/) pins to "either the left or right side"); the pinned set must fit the grid's minimum width. Smashing's complex-table write-up: "One of the frequent features of complex tables is pinned columns" ([Shestopalov, Smashing Magazine](https://www.smashingmagazine.com/2019/02/complex-web-tables/)).
- Persist the person's column state (widths, order, hidden, pinned) per person and grid, with a "Reset columns" action. A saved combination of columns, filters and sort is a saved view ([filtering: saved views](filtering.md#saved-views)).
- Which columns appear by default is still [tables: what earns a column](tables.md#what-earns-a-column); column settings are not a reason to ship thirty.

**Cases**
- Hiding a column leaves no trace → "3 columns hidden" by the Columns button.
- Column order resets on reload → persist it with the person's other settings.
- Resize only by mouse drag → a keyboard route in the column menu.

**Accessibility**
- 2.1.1: every column operation has a keyboard route. 2.5.7 Dragging Movements: reorder and resize have a single-pointer alternative (menu items, move left or right).
- 4.1.3: announce "Column Owner hidden" and similar.

**Build**
- The "Columns" panel is a `popover` or `dialog` holding a `fieldset` of checkboxes, one per column, with "Move up" and "Move down" buttons as the non-drag route ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- A resize handle is a focusable separator: `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow` in pixels, Left and Right arrows resize, and the column menu offers the same; pointer drag is the enhancement.
- Hidden columns leave the DOM (or take `hidden`), never `display: none` on a class that a later rule overrides (code-standard rule 17); `aria-colcount` and `aria-colindex` follow when columns are virtualised.
- Widths are written to a custom property per column (`--col-owner`), so one rule sizes the column (code-standard rule 38).
- Column state persists per person on the server or in storage, read before the first render so the grid does not reflow (code-standard rule 14; [javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll)).
- "Column Owner hidden" goes to a live region established in the page ([code accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).

**Check**
- *Script* could: assert each resize handle and drag handle has a keyboard alternative in the column menu; reload and assert column state persisted.
- *Judgement*: do people's tasks differ enough to need column settings?

**Sources.** MUI X, React Spectrum, NN/g and Smashing; persistence and reset are commentary.

## Editing

**Use when / don't use**
- Edit in place when people change many values in sequence and each change is small and independent.
- Edit in a panel, dialog or page when a change spans several fields, needs validation across fields, or is rare (*Table or data grid*).

**How**
- Cell mode by default, one cell at a time; row mode when a row's fields are saved together ([MUI X editing](https://mui.com/x/react-data-grid/editing/): "By default, only one cell can be editable at a time").
- Enter edit: Enter, F2, double-click or typing a character (typing replaces the value). Leave: Escape reverts, Tab and Enter commit; Enter moves down a column (MUI X; APG grid's Enter and F2 conventions).
- Validate on commit; an invalid value keeps the cell in edit with its message, and the change is not saved. Atlassian: "highlight the affected row or text input with a supporting error icon".
- Save model: each committed cell saves, with the saving and saved state shown in the cell and undo for the last change ([interaction: saving, explicit or automatic](../design/interaction.md#saving-explicit-or-automatic); [undo or confirmation](../design/interaction.md#undo-or-confirmation)). A batch model (edit many, then Save) needs a visible count of unsaved changes and a warning before leaving.
- The row looks different in edit mode, so people see what is editable (NN/g).

**Cases**
- An edit that saves on blur with no sign it saved → a saving then saved state in the cell, and undo.
- Escape that keeps the half-typed value → Escape reverts.
- An invalid value silently replaced by the old one → keep the cell in edit with the message.

**Accessibility**
- 3.3.1 Error Identification: the message is text tied to the cell (`aria-describedby`, code-standard rule 15); 3.3.4 for reversible changes.
- 4.1.3: "Saved" and errors are announced.

**Build**
- Edit mode, its keys and how the key handler steps aside are [code accessibility: *Data grids*](../../code/accessibility.md#data-grids); the editor is a native `input`, `select` or `textarea` labelled by its column header.
- An invalid value: `aria-invalid="true"` and the message in `aria-describedby` on the editor (code-standard rule 15).
- Saving and saved states are attributes on the cell (`data-state="saving"`), and the announcement goes to one persistent status region (code-standard rule 14).
- A failed save reports the server's reason in the cell, not a generic error (code-standard rule 61; [javascript: *Errors and an envelope's success flag*](../../code/javascript.md#errors-and-an-envelopes-success-flag)).
- The commit is a real request that works without the grid's script: each record also has an edit page or form (code-standard rule 20).

**Check**
- *Script* could: enter a cell with Enter, type, press Escape, and assert the value reverted; commit an invalid value and assert an error with a description.
- *Judgement*: is in-place editing faster than opening the record, for the edits people make?

**Sources.** MUI X and APG for keys; Atlassian and NN/g for when not to edit in place.

## Pagination or virtual scroll

**Use when / don't use**
- Pagination when people return to a position, share a link to it, or act across pages ([tables: pagination or load more](tables.md#pagination-or-load-more) owns the choice for tables).
- Virtual scroll when people scan a long set continuously, and the row count would make a full render slow; never infinite loading in a grid people act on in bulk.
- Neither for a few hundred rows: render them.

**How**
- Virtualisation renders only the visible rows and columns, plus a buffer: AG Grid "only renders what you see on the screen", with "10 rows before the first visible row and 10 rows after the last visible row" by default ([AG Grid DOM virtualisation](https://www.ag-grid.com/javascript-data-grid/dom-virtualisation/)). Fixed row heights keep scrolling and the scrollbar accurate.
- Pagination: AG Grid's pagination removes "the need for a vertical scroll to view more data" ([AG Grid pagination](https://www.ag-grid.com/javascript-data-grid/row-pagination/)); the page lives in the address ([ux: state persistence and restore](../design/ux.md#state-persistence-and-restore)).
- Sort, filter and select-all work on the whole set, not the rendered rows; say which is in force ("All 12,400 rows selected").
- The row count and the visible range are always shown, since virtual scroll hides the size of the set.
- Server-side data: a loading row at the end, not a spinner over the grid ([feedback: loading](feedback.md#loading)).

**Cases**
- A virtualised grid where Ctrl+F finds nothing below the fold → the grid's own search in the toolbar; browser find only sees rendered rows.
- Variable row heights making the scrollbar jump → fixed heights.
- "Select all" that selects only the rendered rows → select the set and say so.

**Accessibility**
- A virtualised grid sets `aria-rowcount` and `aria-colcount` to the totals and `aria-rowindex` and `aria-colindex` on each rendered row and cell ([APG grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/), Grid and Table Properties), because "screen readers assume all elements of the grid are loaded" ([AG Grid accessibility](https://www.ag-grid.com/javascript-data-grid/accessibility/)).
- Rows can appear out of DOM order in a virtualised grid (AG Grid); keep DOM order equal to visual order (code-standard rule 2), or disable virtualisation where screen-reader use matters more than speed.

**Build**
- Pagination is a labelled `nav` of links carrying the page in the address, `aria-current="page"` on the current one (code-standard rule 64; [javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Virtualisation sets `aria-rowcount`, `aria-colcount`, `aria-rowindex` and `aria-colindex` and keeps rendered rows in DOM order ([code accessibility: *Data grids*](../../code/accessibility.md#data-grids); code-standard rule 2).
- Fixed row heights come from the density token, so the scroll height is rows × one value ([tokens: *Density*](../../code/tokens.md#density)).
- Loading more rows uses an `IntersectionObserver` on a sentinel row, not a scroll listener ([javascript: *The platform before a library*](../../code/javascript.md#the-platform-before-a-library)).
- "All 12,400 rows selected" and the visible range are written to a status region (code-standard rule 14).

**Check**
- *Script* could: in a virtualised grid, assert `aria-rowcount` equals the data's total and each rendered row's `aria-rowindex` matches its position; assert DOM order of rows matches visual order.
- *Judgement*: does the person look for a position, or scan?

**Sources.** AG Grid, MUI X and APG; the choice between paging and scrolling defers to [pagination: choosing pagination, load more or infinite scroll](pagination.md#choosing-pagination-load-more-or-infinite-scroll).

## Keyboard model and focus

**What good looks like**
- The grid is one tab stop; arrow keys move between cells; Tab leaves the grid.
- The key set is APG's data grid, unchanged, so it works the same as every other grid people know.
- Focus is always visible and never hidden under a frozen header or column.

**How**
- One stop: "Only one of the focusable elements contained by the grid is included in the page tab sequence" ([APG grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)). Implement with a roving tabindex: the active cell has `tabindex="0"`, every other `-1` ([APG, developing a keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)); the code half is [code accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex).
- Navigation keys (APG): arrows one cell; Home and End to the row's first and last cell; Control+Home and Control+End to the grid's first and last cell; Page Up and Page Down "an author-determined number of rows". MUI X implements the same set ([MUI X accessibility](https://mui.com/x/react-data-grid/accessibility/)).
- Inside a cell: Enter or F2 enters the cell (an editor or the cell's widgets) and suspends grid navigation; Escape or F2 restores it (APG).
- Selection keys where selection exists (APG): Shift+Space selects the row, Control+Space the column, Control+A all, Shift+arrows extend.
- Focus lands on the cell or on the one control inside it: MUI X focuses "the first inner element with `tabIndex={0}`", else the cell. Fluent's DataGrid defaults to cell focus (`focusMode` "cell"), with composite and row modes ([Fluent DataGrid source](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-table/library/src/components/DataGrid/DataGrid.types.ts)).
- Returning by Tab restores the last active cell, not the first.
- Re-sorting or reloading keeps focus on the same record's cell where it still exists (code-standard rule 14).

**Cases**
- Tab moves through every cell of a 50 × 10 grid → one tab stop and arrows.
- Arrow keys scroll the page instead of moving between cells → handle them on the grid and prevent the default.
- Typing in an edited cell moves focus on arrow keys → in edit mode arrows move the caret; Escape returns to navigation.

**Accessibility**
- 2.1.1 Keyboard, 2.4.3 Focus Order, 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (frozen headers and columns, [tables: sticky header and first column](tables.md#sticky-header-and-first-column)).
- Keyboard shortcuts beyond APG's are documented in the grid's help and never use single printable characters without a way to turn them off (2.1.4).

**Build**
- The roving tabindex in two dimensions, the APG key set and edit mode are [code accessibility: *Data grids*](../../code/accessibility.md#data-grids), built on [*Composite widgets and roving tabindex*](../../code/accessibility.md#composite-widgets-and-roving-tabindex).
- The focused cell is styled with `:focus-visible` and the project's focus ring ([code accessibility: *Visible focus*](../../code/accessibility.md#visible-focus)); `scroll-padding` on the grid's scroller keeps it clear of frozen headers and columns.
- Focus survives a re-sort or reload by the record's id, not the cell's index (code-standard rule 14; [javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll)).
- One delegated `keydown` handler on the grid; arrows call `preventDefault` only when handled, so the page keeps its own keys.
- Extra shortcuts use modifiers, or can be turned off (2.1.4).

**Check**
- *Script* could: tab into the grid and assert one stop; press each APG key and assert the focused cell moved as specified; assert focus is visible and unobscured after each move.
- *Judgement*: does the grid add any key APG does not define, and is it needed?

**Sources.** APG is the source; MUI X and Fluent implement it. The toolkit uses APG's set unchanged.

## Roles

**What good looks like**
- A grid is `role="grid"` (or `treegrid` for nested rows) with `row`, `columnheader`, `rowheader` and `gridcell`; a table stays a native `table`.
- The roles are complete or absent.

**How**
- `role="grid"` may sit on a native `table` element, which keeps the table's structure for browsers and adds the widget semantics; Fluent's DataGrid sets `role: 'grid'` on its root ([Fluent useDataGrid source](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-table/library/src/components/DataGrid/useDataGrid.ts)), and AG Grid uses `grid` or `treegrid` ([AG Grid accessibility](https://www.ag-grid.com/javascript-data-grid/accessibility/)).
- Don't override the roles a grid component sets (Fluent: "Override the `role` attribute of DataGrid controls" is a don't).
- Sortable headers carry `aria-sort` as in a table; selected rows `aria-selected`; read-only cells `aria-readonly` in an otherwise editable grid.
- Prefer the table: "If it's not a widget, don't use role="grid", use role="table"" (Roselli), and better still, a `table` element.

**Cases**
- A `div` grid with `role="grid"` and no `row` or `gridcell` roles → complete them or use a `table`.
- A read-only report built with a grid library that sets `role="grid"` → configure the library to render a table, or override at the root only if the library supports it.

**Accessibility**
- 1.3.1 and 4.1.2: the roles convey the structure and that it is interactive; a partial set misleads.

**Build**
- `role="grid"` (or `treegrid`) on a native `table`, so `tr`, `th` and `td` supply `row`, `columnheader`, `rowheader` and `gridcell`; on `div`s every role is written by hand ([code accessibility: *Data grids*](../../code/accessibility.md#data-grids)).
- States are ARIA where HTML has none: `aria-sort` on the sorted header, `aria-selected` on selected rows, `aria-readonly` on read-only cells ([code accessibility: *ARIA: the first rule, and when it is needed*](../../code/accessibility.md#aria-the-first-rule-and-when-it-is-needed)).
- A library's roles are configured at its root, never patched cell by cell after each render.
- The grid is named by `aria-labelledby` pointing at its heading.

**Check**
- *Script* could: assert every `role="grid"` contains `row` and `gridcell` or `columnheader` descendants, and an accessible name.
- *Judgement*: is this content a widget?

**Sources.** APG, Roselli, Fluent and AG Grid agree.

## Performance

**What good looks like**
- Scrolling, sorting and filtering answer within the response limits in [interaction: response times and perceived performance](../design/interaction.md#response-times-and-perceived-performance).
- The DOM holds the rows people can see and a buffer, not the whole set, once the set is large.

**How**
- Virtualise rows past the point where a full render is slow on the slowest supported device; measure, don't guess. MUI X warns that disabling virtualisation will "drastically reduce the performance" and keeps it off only "for testing purposes or on small datasets" ([MUI X virtualisation](https://mui.com/x/react-data-grid/virtualization/)).
- Column virtualisation only when columns run to dozens; a grid needing it has a column problem first ([tables: what earns a column](tables.md#what-earns-a-column)).
- Sort, filter and aggregate on the server for large sets; the client sorts only what it holds in full.
- Fixed row heights; dynamic heights disable or slow virtualisation (MUI X disables column virtualisation with dynamic row height).
- Cheap cells: plain text at rest, rich editors only while editing; no per-cell listeners (one delegated handler, [code javascript: events and delegation](../../code/javascript.md#events-and-delegation)).
- Show the pressed state of a sort or filter at once, then render ([code performance](../../code/performance.md)).

**Cases**
- A 5,000-row grid that freezes for two seconds on sort → server-side sort, or virtualise and sort the data, not the DOM.
- Every cell a component with its own listeners → one delegated handler on the grid.
- Virtualisation turned off in production because a test needed a full DOM → off in the test environment only, as MUI X advises.

**Accessibility**
- Virtualisation's cost is in the *Pagination or virtual scroll* section: complete `aria-rowcount` and indexes.

**Build**
- Render visible rows plus a buffer; fixed row heights from the density token ([tokens: *Density*](../../code/tokens.md#density)); `content-visibility` is no substitute, since it keeps every row in the DOM.
- Cells are plain text at rest; editors mount only in edit mode ([code accessibility: *Data grids*](../../code/accessibility.md#data-grids)).
- One delegated handler on the grid ([javascript: *Events and delegation*](../../code/javascript.md#events-and-delegation)); sort and filter on the server for sets the client does not hold in full.
- The pressed state of a sort shows at once and the render follows, measured against INP ([performance: *Core Web Vitals*](../../code/performance.md#core-web-vitals)).
- Recycled row nodes keep focus and the status region in place (code-standard rule 14).

**Check**
- *Script* could: count rendered rows against the data's rows, and time a sort and a scroll on a throttled CPU against the response limits.
- *Judgement*: is the row count large enough to need virtualisation, and has the column count been cut first?

**Sources.** AG Grid and MUI X; the thresholds are measured per product, not given here.
