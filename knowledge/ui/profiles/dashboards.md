# Profile: dashboards and data tools

What a dashboard, report or data tool must specify: whether it is operational or analytical, summary before detail, layout and hierarchy, the filter bar under the tabs, when a table beats a chart, colour and legends across charts, empty, degraded and stale data, freshness captions, queues and triage lists, drill-down, timelines and activity, exports, and refresh. It binds the fundamentals (`../design/ux.md`, `../design/interaction.md`, `../design/visual.md`, `../design/content.md`, `../design/accessibility.md`) and the patterns (`../patterns/filtering.md`, `../patterns/tables.md`, `../patterns/data.md`, `../patterns/selection.md`, `../patterns/actions.md`, `../patterns/feedback.md`, `../patterns/search.md`, `../patterns/navigation.md`) to one kind of product. It serves the [design-standard](../../../standards/design-standard.md) principles *show state and give feedback*, *honest*, *efficient for people who know it* and *clear words, clear hierarchy*. design-standard rules 1, 3–6, 11 and 12 came from a dashboard and are applied here; design-standard rule 2 (the layout holds still), design-standard rule 8 (attributes as columns) and design-standard rule 10 (a finding says what changed and what it does) are applied too. The design-standard *Application profiles* entry names this file; it admits nothing as a rule. Chart construction in detail (marks, palettes, axes) is the dataviz guidance the toolkit points to from `../patterns/data.md`.

---

## Operational or analytical

**Use when**
- Starting a dashboard, or auditing one where the eye goes nowhere.
- A screen tries to answer "is anything wrong right now?" and "why did this happen last quarter?" at once.

**How**
- Declare the screen's kind before laying it out. **Operational**: imparts critical information quickly during time-sensitive tasks; watch and react. **Analytical**: helps people identify the need for further investigation; explore later ([NN/g, Dashboards](https://www.nngroup.com/articles/dashboards-preattentive/)). Carbon draws the same line between presentation dashboards (a big-picture view) and exploration dashboards (search, sort, filter, roll up, drill down) ([Carbon, Dashboards](https://carbondesignsystem.com/data-visualization/dashboards/)).
- What the kind decides:

| | Operational | Analytical |
|---|---|---|
| Top of screen | Status and exceptions now | The question the screen answers, and its period |
| Interaction | Little: acknowledge, open, act | Filter, sort, drill down, compare periods |
| Colour | Status colour reserved for what needs action | Categorical colour for series; status colour rare |
| Refresh | Automatic, with a visible time | On demand or on load, with the data's date |
| Density | Few large figures | More, smaller, in tables |

- Most internal tools sit between the two (a maintenance dashboard is analytical with an operational edge: did the last run fail?). Name the dominant kind and put the other's one need in a single place, usually a status line under the title.
- Write the kind into the screen's specification so a reviewer can ask whether the layout follows from it.

**Cases**
- A team's overview has twelve equal tiles and three charts → declare it. If operational, keep the two or three figures that trigger action at the top and move the rest to an analytical page.
- An audit dashboard is mostly "which components need work" with a "last run failed" banner → analytical, with the run status as the one operational element in the caption line.
- An on-call screen has filters, date pickers and drill-downs → operational screens need few controls; move exploration to a linked analytical view.

**Accessibility**
- 2.2.2 Pause, Stop, Hide applies to an operational screen that auto-updates beside other content. 1.4.1 Use of Colour: status is never colour alone, on either kind.
- Implementation: code-standard rule 14 (a refreshed region keeps the reader's place).

**Build**
- The kind changes the markup only through what it puts first: the status line or the question is the first content under the `h1` in `main`, in DOM order as well as on screen (code-standard rule 2; [HTML semantics: headings and the outline](../../code/html-semantics.md#headings-and-the-outline)).
- An operational screen's automatic refresh writes into a persistent status region and keeps focus and scroll ([javascript: polling and live data](../../code/javascript.md#polling-and-live-data); code-standard rule 14).

**Check**
- *Script:* could check that the screen's specification declares a kind. Nothing measures the layout against it.
- *Judgement:* is what sits at the top what this kind of user needs first?

**Sources:** [NN/g dashboards](https://www.nngroup.com/articles/dashboards-preattentive/); [Carbon dashboards](https://carbondesignsystem.com/data-visualization/dashboards/), opened here. The table is the toolkit's synthesis of the two.

---

## Summary before detail: layout and hierarchy

**Use when**
- Laying out any dashboard page or report: a KPI strip, charts, a table.

**How**
- Order the page: title, freshness caption (design-standard rule 1), a short **KPI strip** of the few figures that decide what to do, then detail (charts, then tables or the queue). Carbon: "Prioritize data by importance, then create a clear visual hierarchy"; "Place the most important at the top of the page"; "The most important data should have the highest contrast and occupy the largest area" ([Carbon dashboards](https://carbondesignsystem.com/data-visualization/dashboards/)).
- **A KPI tile** states one number, what it counts and over what period; the tile itself is [data: KPI tiles](../patterns/data.md#kpi-tiles).
- **Health, not inventory**, and how many tiles a strip holds: [data: KPI tiles](../patterns/data.md#kpi-tiles).
- A tile that leads somewhere is a link to the filtered detail (see *Drill-down*), with the whole tile as the target.
- Grid: tiles in one row on wide screens, two columns on narrow, never shrinking the figure below legible size. Charts share one layout and spacing ([Carbon](https://carbondesignsystem.com/data-visualization/dashboards/)).
- Headings sit with what they introduce (design-standard rule 7).

**Cases**
- The page opens with a 40-row table and puts totals in the footer → move the totals to a KPI strip at the top; the table stays below.
- A tile reads "374" → add what it counts and the period: "374 variables, snapshot of 9 Oct". Better, ask whether it is a health figure at all; if not, drop it.

**Accessibility**
- 1.3.1: a tile's label and value are associated (a description list or a labelled group), so a screen reader hears "Open failures, 3". 1.4.1: trend direction is a word or sign, not colour. 1.4.10 Reflow: tiles reflow at 320px without horizontal scroll.
- Implementation: code-standard rule 1 (headings and landmarks for each band), code-standard rule 2 (reading order follows the visual order of the strip), code-standard rule 57 (tile widths computed from content, not today's numbers).

**Build**
- Bands in reading order: `h1`, the provenance `p`, the KPI strip, then each detail region under its own heading (code-standard rule 1, code-standard rule 2; [html-semantics: *Headings and the outline*](../../code/html-semantics.md#headings-and-the-outline)).
- The strip is a list of tiles, each a link holding label and value; the tile's markup is [data: KPI tiles](../patterns/data.md#kpi-tiles)' Build part.
- Columns come from the tile count, so no row is short at any width: [responsive: *Grids that fill their rows*](../../code/responsive.md#grids-that-fill-their-rows) (code-standard rule 57).
- Charts share one container component for size and spacing, so every chart region lays out alike (code-standard rule 11).

**Check**
- *Script:* could count tiles above the first chart or table, check each tile has a label and a value, and check a trend carries text.
- *Judgement:* is the most important figure the most prominent? Is each tile a health figure someone acts on?

**Sources:** [Carbon dashboards](https://carbondesignsystem.com/data-visualization/dashboards/) (quoted above, opened here); [ONS chart text](https://service-manual.ons.gov.uk/data-visualisation/guidance/chart-text). The health versus inventory distinction is practitioner commentary on generated docs sites; the toolkit adopts it because a figure nobody acts on wastes the top of the page.

---

## Filter bar under tabs

**Use when**
- A dashboard lists or charts records that the reader narrows: by file, platform, area, status, owner.

**How**
- Tabs choose the context (a file, a platform); one filter bar under them narrows it (design-standard rule 3). What a dashboard must specify, each owned by a filtering section: the bar's layout ([filtering: filter bar, sidebar or filter dialog](../patterns/filtering.md#filter-bar-sidebar-or-filter-dialog)); each facet's control, segmented up to four, a menu past four (design-standard rule 4; [facet controls](../patterns/filtering.md#facet-controls)); counts and what "all" covers (design-standard rules 11 and 12; [counts](../patterns/filtering.md#counts)); narrowing order (design-standard rule 6; [faceted narrowing and order](../patterns/filtering.md#faceted-narrowing-and-order)); unavailable options (design-standard rule 5; [unavailable options](../patterns/filtering.md#unavailable-options)); applied filters ([applied filters and clear all](../patterns/filtering.md#applied-filters-and-clear-all)); instant or Apply ([instant or Apply](../patterns/filtering.md#instant-or-apply)); and the view in the address ([filters in the address](../patterns/filtering.md#filters-in-the-address)).
- Filtering in depth is `../patterns/filtering.md`.

**Cases**
- Two chip rows filter the same table → one bar under the tabs; the second row becomes a facet menu (design-standard rule 3).
- An area facet with 12 values is a row of chips that wraps → a menu with counts, opening on "All areas (508)" (design-standard rules 4 and 12).
- Choosing a component leaves the area menu listing areas the component has no rows in → recount the area options for the component and disable those at "(0)" in place (design-standard rules 6, 5 and 11; [filtering: unavailable options](../patterns/filtering.md#unavailable-options)).
- Switching from a file with actions to one without moves the tabs up → [interaction: layout stability](../design/interaction.md#layout-stability).

**Accessibility**
- 4.1.3 Status Messages: the result count after filtering is announced. 2.4.3 Focus Order and 3.2.2 On Input: changing a facet does not move focus or the page. 2.5.8 Target Size on segmented buttons.
- Implementation: code-standard rule 14 (the list swap keeps focus), code-standard rule 15 (a count beside an option is a description), code-standard rule 19 (a `details` menu needs Escape), code-standard rule 20 (filters work as a GET form without script).

**Build**
- Tabs that change the context are links with `aria-current="page"` when they change the address, a `tablist` only when they swap a panel in place (code-standard rule 64; [accessibility: *Composite widgets and roving tabindex*](../../code/accessibility.md#composite-widgets-and-roving-tabindex)).
- The bar is one GET `form` under them; each facet's control and its counts are built as the filtering sections' Build parts say ([filtering: facet controls](../patterns/filtering.md#facet-controls)).
- Filter state round-trips through the address, and a swap of the list keeps focus and scroll ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history), [javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll)).
- The result count is a persistent `role="status"` line, present in the first render ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).

**Check**
- *Script:* `tools/ui-check/check.mjs`: design-standard rule 2 (the tab list's position across tab switches), design-standard rule 3 ("tabs keep one row and scroll"; "facets and toggles come first, search last"), design-standard rule 4 ("a facet is a menu"), design-standard rule 5 ("offers nothing to choose and is not disabled"; "disabled, not hidden") and design-standard rule 12 ("its first option names what"). Could: check that applied filters show a clear control and that filter state round-trips through the URL.
- *Judgement:* does anything else on the screen filter the same list? Do counts agree with the list below (design-standard rule 11)?

**Sources:** design-standard rules 3–6, 11 and 12 and their evidence; the sources and their disagreements are in the filtering sections linked above.

---

## Tables or charts

**Use when**
- Deciding how to show a set of figures: a table, a chart, or both.
- Specifying a data table on a dashboard.

**How**
- **A table** when people look up, compare exact values, or act on rows. NN/g names four table tasks: find records, compare them, view or edit one, act on several ([NN/g, Data tables](https://www.nngroup.com/articles/data-tables/)).
- **A chart** when the shape matters: a trend, a distribution, a ranking. Encode quantity by length or position (bars, lines, dots); area and angle (pies, donuts, gauges) are poor for comparison, colour does not convey magnitude, and 3D is avoided ([NN/g dashboards](https://www.nngroup.com/articles/dashboards-preattentive/)).
- **Both** when a chart summarises and the table is the detail; the table is then the chart's accessible equivalent.
- A table's specification names which task it serves, its identifier column, default sort, row height, sticky header and toolbar; each is a section of [tables](../patterns/tables.md#table-list-or-cards). Which chart, and how it is drawn, is [data visualisation: choosing a chart by its job](../patterns/data-visualisation.md#choosing-a-chart-by-its-job).
- Small screens: a chart keeps its axis labels legible or switches to the table.

**Cases**
- A donut shows six categories of similar size → a sorted bar chart; angle hides differences of a few percent.
- A chart is the only way to read exact counts → add the table below or as a toggle; readers who need the number get it without hovering.
- A findings table's first column is a generated ID → [tables: column choice and order](../patterns/tables.md#column-choice-and-order).

**Accessibility**
- 1.1.1 Non-text Content: every chart has a text alternative that states its point, or a linked table. 1.3.1: tables use header cells and scope; sortable headers expose `aria-sort`. 1.4.11 Non-text Contrast: lines, bars and their boundaries reach 3:1 against the background. 1.4.1: series are told apart by more than colour (direct labels, markers or patterns).
- Implementation: code-standard rule 1 (tables as tables), code-standard rule 18 (names for icon-only sort and toolbar buttons).

**Build**
- A table is a `table` with `caption` and `th scope` ([html-semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)); its sorting, sticky header and toolbar are [tables](../patterns/tables.md#headers-and-sorting)' Build parts.
- A chart is a `figure` with a named summary, the graphic and its table, rendered from the same data ([html-semantics: *Charts in markup*](../../code/html-semantics.md#charts-in-markup)).
- "Both" is one data array rendered twice, so the chart and its table cannot disagree (code-standard rule 29).
- On narrow screens the chart's region switches to the table by a container query, not by a second page ([responsive: *Container queries*](../../code/responsive.md#container-queries)).

**Check**
- *Script:* could check each table has header cells, at most one sorted column with `aria-sort`, at most five visible toolbar actions, and a single row height; could flag pie, donut and 3D chart types.
- *Judgement:* is the form chosen for the task (look up versus see a shape)? Is the identifier column the one people scan for?

**Sources:** [NN/g data tables](https://www.nngroup.com/articles/data-tables/); [Carbon data table](https://carbondesignsystem.com/components/data-table/usage/); [NN/g dashboards](https://www.nngroup.com/articles/dashboards-preattentive/).

---

## Colour and legends across charts

**Use when**
- A screen has more than one chart, or a chart has more than one series.

**How**
- One colour per data set across every chart on the screen: "Always use consistent colors for each data set within a dashboard" ([Carbon dashboards](https://carbondesignsystem.com/data-visualization/dashboards/)).
- Palette order, sequential and diverging palettes and status colours are [data visualisation: colour by job](../patterns/data-visualisation.md#colour-by-job); what a dashboard adds is that the pinning holds across every chart on the screen.
- Legends sit in the same place relative to the chart area on every chart: "have legends in the same position relative to the charting area" (Carbon dashboards). Direct labels at the end of a line beat a legend when there are few series.
- Colour is applied by role from tokens ([visual: colour roles](../design/visual.md#colour-roles-and-semantics)), and a dark theme has its own validated chart palette.
- Carbon's palettes do not address contrast against the background; check it separately.

**Cases**
- "Errors" is red in one chart and blue in the next → assign it one colour from the sequence for the whole screen.
- Legends sit below one chart and right of another → one position for all.
- Six categories use red, orange, yellow, green and two blues → red to green reads as status; use the categorical sequence.

**Accessibility**
- 1.4.1 Use of Colour: series are distinguishable by label, marker or pattern too. 1.4.11 Non-text Contrast: marks reach 3:1 against the surface, in each theme. 1.4.3 for legend and label text.
- Implementation: code-standard rule 53 (themes and modes), code-standard rule 22 (colours from tokens).

**Build**
- Every mark carries `data-series="<name>"`; one stylesheet rule per series maps it to a categorical custom property, shared by every chart on the screen, so the same series is the same colour everywhere ([html-semantics: *Charts in markup*](../../code/html-semantics.md#charts-in-markup); code-standard rule 6).
- The palette is a token set redefined per theme, and marks read it through custom properties (code-standard rule 22, code-standard rule 53; [tokens: *Themes and modes*](../../code/tokens.md#themes-and-modes)).
- A legend is one component with one position, its items in series order and marked up as a list with a swatch and the series name; direct labels are SVG `text` beside the line's end.

**Check**
- *Script:* could map each series name to its rendered colour across charts and flag a name with two colours, and compute mark contrast against the surface.
- *Judgement:* could a reader with no colour vision tell the series apart?

**Sources:** [Carbon dashboards](https://carbondesignsystem.com/data-visualization/dashboards/) (quoted, opened here); [Carbon palettes](https://carbondesignsystem.com/data-visualization/color-palettes/).

---

## Empty, degraded and stale data

**Use when**
- A region has nothing to show, a source failed, or the data is older than the reader would assume.

**How**
- **Empty**: the four kinds and their copy are [feedback: empty states](../patterns/feedback.md#empty-states).
- **Degraded**: secondary content fails quietly, primary content fails to an error page ([ux: degraded states](../design/ux.md#degraded-offline-and-error-states)).
- **Missing is not zero** ([data: numbers](../patterns/data.md#numbers)): a failed figure reads "Not measured" with the reason.
- **Stale**: the caption carries each source's date (next section), so an old source is visibly old. When a source is past its expected age, say so in the caption ("audit of 2 Sep, older than the snapshot").
- Feedback states in depth are `../patterns/feedback.md`.

**Cases**
- A filtered table shows only headers → replace with "No findings match these filters" and a "Clear filters" action.
- The audit failed and its tiles show 0 → show "Not measured: the audit of 11 Oct did not complete", with a link to the run.
- A side panel's counts fail to load → drop the counts, keep the page (Primer: secondary content).
- A first-time project has no snapshot → "No snapshot yet. Take one to see the library here", with the action.

**Accessibility**
- 4.1.3 Status Messages: a region that becomes empty or fails announces it without moving focus. 1.4.1: a warning icon carries a text label.
- Implementation: code-standard rule 12 (a fallback renders only when its subject is missing), code-standard rule 61 (a failure reports why), code-standard rule 17 (`hidden` beats the stylesheet when a region is swapped).

**Build**
- The template branches on the model's state (empty, failed, missing, stale), never on a count of 0 or a blank string (code-standard rule 12, code-standard rule 29).
- A failed fetch reads the envelope's success flag and renders the reason it carries ([javascript: *Errors and an envelope's success flag*](../../code/javascript.md#errors-and-an-envelopes-success-flag); code-standard rule 61).
- A region that turns empty or fails says so in a persistent `role="status"` line, not by a toast ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- A swapped-out region is hidden with `hidden`, which the stylesheet must not override (code-standard rule 17; [accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).

**Check**
- *Script:* could flag a table with headers and no rows, the strings "undefined", "NaN" or "null" in rendered text, and a figure of 0 whose source record is absent.
- *Judgement:* does every empty state say why and offer the way forward?

**Sources:** as linked from feedback, ux and data. None covers stale data; marking staleness in the caption is the toolkit's judgement, following design-standard rule 1.

---

## Freshness captions

**Use when**
- Any dashboard page or chart built from recorded data (design-standard rule 1).

**How**
- The caption, a chart's own source line, the data's date and two sources out of order are [data: provenance and freshness](../patterns/data.md#provenance-and-freshness) (design-standard rule 1). A dashboard adds:
- Live data shows the time of the last update ("Updated 14:32"); a relative time ("2 minutes ago") gives access to the exact timestamp ([data: dates and times](../patterns/data.md#dates-and-times)).

**Cases**
- An operational screen shows no update time → add "Updated 14:32" beside the title, refreshed with the data.

**Accessibility**
- 1.3.1: the caption is text near the heading, not a heading. 4.1.3: on a live screen, the update time changes silently; announce only material changes (see *Refresh and real-time*).
- Implementation: none specific; ordinary content.

**Build**
- The caption and its dates are built as [data: provenance and freshness](../patterns/data.md#provenance-and-freshness)' Build part says: a `p` after the `h1` with a `<time datetime>` per source.
- On a live screen, "Updated 14:32" is a `time` updated in the function that patches the data, outside any live region, so each tick is silent ([javascript: *Polling and live data*](../../code/javascript.md#polling-and-live-data)).
- Its slot keeps a fixed width with tabular figures, so the title row does not shift as the time changes ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).

**Check**
- *Script:* could check every data page has a dated caption and flag an audit date earlier than its snapshot date. `tools/ui-check/check.mjs` does not check design-standard rule 1; it is read at the closing pass.
- *Judgement:* could a reader tell from the caption whether to trust the figures?

**Sources:** design-standard rule 1; the rest as linked from data.

---

## Queues and triage lists

**Use when**
- A screen lists items for someone to work through: findings, breaking changes, review requests, alerts.

**How**
- Each row leads with what changed and what it does to people, in the reader's words, then who it affects and when; the rule's identifier stays out of that sentence (design-standard rule 10).
- Each row ends with a recommendation: the action that resolves it. A finding without one is a dead end (Carbon's empty-state rule "Always offer a path forward" is the nearest sourced principle). Phrasing the row as a question with a recommendation is a house register; no source tests it.
- Order by what needs action first: severity, then age. A sort the reader chooses persists in the address.
- **Bulk actions**: [tables: selection and bulk actions](../patterns/tables.md#selection-and-bulk-actions).
- An action on a row gives feedback in place and, where it removes the row, offers undo rather than a confirmation ([interaction: undo or confirmation](../design/interaction.md#undo-or-confirmation)).
- Rows already resolved leave the queue or move to a filtered "Done" view; counts in tabs and facets update (design-standard rule 11).

**Cases**
- A row reads as a bare category → rewrite it as change and consequence ([content: messages a tool writes about findings](../design/content.md#messages-a-tool-writes-about-findings)).
- A row has no recommendation → add the action ("Replace instances with Button/Secondary") or say who decides.

**Accessibility**
- 4.1.3 Status Messages: selection count and action results are announced. 2.4.3 Focus Order: after a row is removed, focus goes to the next row, not to the top. 1.3.1: each row's checkbox is labelled with the row's identifier.
- Implementation: code-standard rule 14 (focus kept across the list swap), code-standard rule 15 (row context as a description), code-standard rule 62 (disabled is the control's attribute).

**Build**
- A queue is a `table` when rows have several compared fields, an `ol` when order is the point; each row's checkbox is named by the row's identifier, its context a description (code-standard rule 15; [html-semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- The sort is a link or a GET parameter, so it lives in the address ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Removing a row moves focus to the next row's first control, or to the list's heading when it was the last ([accessibility: *Focus management*](../../code/accessibility.md#focus-management); code-standard rule 14).
- Selection count and action results go to one persistent `role="status"` line; per-row actions take the control's own `disabled` while rows are selected (code-standard rule 62).
- Undo is the action's inverse kept for the length of the notice, not a confirmation dialog.

**Check**
- *Script:* `tools/figma-audit/test-breaking.mjs` checks design-standard rule 10 for the breaking-change writer. Could check that each queue row carries a recommendation field and that per-row actions are disabled while rows are selected.
- *Judgement:* can the reader decide what to do from the row alone?

**Sources:** design-standard rule 10; [Carbon data table](https://carbondesignsystem.com/components/data-table/usage/) (batch actions); [Carbon empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/).

---

## Drill-down

**Use when**
- A summary figure or chart has detail behind it that someone will want next.

**How**
- A tile, bar or row opens the detail already filtered to it: the destination is the same list with the facet set, so the reader can widen it again. Carbon lists roll up and drill down among exploration actions ([Carbon dashboards](https://carbondesignsystem.com/data-visualization/dashboards/)).
- The drilled view shows its filter in the bar and in the address; Back returns to the summary as it was.
- Linked charts update together when one is filtered or zoomed: "Mirror chart modifications like filter and zoom" (Carbon).
- Two levels at most from summary to record; deeper hierarchies want a list with facets ([disclosure: progressive disclosure depth](../patterns/disclosure.md#progressive-disclosure-depth)).
- A drill target is a real link with visible affordance on focus and hover, not a hidden click handler on a chart.

**Cases**
- Clicking "3 open failures" opens the full findings list unfiltered → open it with the failure facet set, count matching the tile.
- A bar in a chart is clickable with no sign of it → add a link affordance and a text link list or table that does the same.
- Drilling replaces the page and Back loses the filters → push the state into the address.

**Accessibility**
- 2.1.1 Keyboard: every drill target is reachable and operable by keyboard; a chart's marks are not the only way in. 2.4.4 Link Purpose: "3 open failures" as the link text, not "View".
- Implementation: code-standard rule 21 (modified clicks open in a new tab), code-standard rule 20 (the link works without script).

**Build**
- Every drill target is an `a href` whose address carries the filter (`/findings?status=open`), so it opens in a new tab, survives a reload and works without script (code-standard rule 20, code-standard rule 21; [html-semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- A whole-tile target is one link around the tile, or a stretched link from its heading, never a click handler on a `div` ([accessibility: *Keyboard access and modified clicks*](../../code/accessibility.md#keyboard-access-and-modified-clicks)).
- A chart's marks are not the only way in: the chart's table or a list beside it holds the same links ([html-semantics: *Charts in markup*](../../code/html-semantics.md#charts-in-markup)).
- Back restores the summary because its state was in the address all along ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).

**Check**
- *Script:* could check that each tile with a destination is an `a` with an `href` carrying the filter, and that the destination's count equals the tile's.
- *Judgement:* does the drilled view answer the question the summary raised?

**Sources:** [Carbon dashboards](https://carbondesignsystem.com/data-visualization/dashboards/), opened here.

---

## Timelines and activity

**Use when**
- A dashboard shows how a project has been moving: how much happened on each day, and what exactly changed.
- Don't use a heatmap or a feed when the question is a trend (more or less than last month); a line or bar chart answers that ([data visualisation: choosing a chart by its job](../patterns/data-visualisation.md#choosing-a-chart-by-its-job)).

**How**
- **Pick the form by the question.** *Is the trend rising?* A line: "If you want to show a data trend over time, a line chart will work better than a bar chart" ([NN/g, choosing chart types](https://www.nngroup.com/articles/choosing-chart-types/)); bars for a few discrete periods, which Carbon also allows for "trends over time" ([Carbon simple charts](https://carbondesignsystem.com/data-visualization/simple-charts/)). *When is work done, and where are the gaps?* A calendar heatmap. *What changed, and who did it?* A feed. A dashboard often wants a chart or heatmap on top and the feed below, filtered by the same period.
- **Calendar heatmap** (contribution-graph style): one cell per day, weeks as columns, weekday rows labelled, month labels above. A sequential single-hue scale in four or five steps, light to dark: "Sequential scales use a blended progression, typically of a single color" ([Carbon spatial charts](https://carbondesignsystem.com/data-visualization/spatial-charts/)). Step boundaries come from the data's spread, not from numbers that suit today (code-standard rule 57).
- A legend states what each step counts ("None, 1–3, 4–9, 10+ changes") and sits in one place ([colour and legends across charts](#colour-and-legends-across-charts)). An empty day is a visible empty cell, distinct from a day with no data ("not recorded"): missing is not zero ([data: numbers](../patterns/data.md#numbers)).
- Colour carries magnitude here, which NN/g warns against: "color should not be used to communicate information about quantitative values or magnitude" ([NN/g dashboards](https://www.nngroup.com/articles/dashboards-preattentive/)). The toolkit keeps the heatmap for the pattern of gaps and bursts and puts the exact count in each cell's text and in the table, so no figure depends on reading a shade. Carbon notes the 3:1 contrast floor "does not apply to heat maps"; the toolkit still wants the empty cell's outline at 3:1, so the grid's shape survives.
- **Activity feed**: newest first, grouped under day headings ("Today", "Yesterday", "9 Oct 2026"). Each entry says what changed and its effect, then who, then when (design-standard rule 10), and links to the change itself (the commit, the run, the record). An icon for the type carries a text label: Primer's timeline asks that icons used as badges "include a text alternative when they convey essential information" ([Primer timeline accessibility](https://primer.style/product/components/timeline/accessibility/)).
- Timestamps: relative for recent entries, absolute past a week, and the exact time always reachable ([data: dates and times](../patterns/data.md#dates-and-times)). Atlassian switches to a date stamp after seven days and says to "always provide a way for people to see the actual timestamp" ([Atlassian date and time](https://atlassian.design/foundations/content/date-time)); Primer's relative time defaults to a 30-day threshold ([Primer relative time](https://primer.style/product/components/relative-time/)). The toolkit takes the week: under day headings, "3 weeks ago" says less than the date.
- Filter a feed by type (runs, releases, findings) and by who, as facets in the address ([filtering: filters in the address](../patterns/filtering.md#filters-in-the-address)); a long feed pages or loads more, never infinitely under a footer.

**Cases**
- A heatmap's darkest step is "5+" and half the year is dark → derive the steps from the year's spread.
- A day with no snapshot looks the same as a quiet day → mark it "not recorded", outlined differently.
- A feed reads "Variable updated" twenty times → say which variable and what it changes, group repeats ("12 variables renamed in Colour"), link to the diff.
- Someone asks whether activity is slowing → a weekly line, not the heatmap.

**Accessibility**
- 1.1.1 and 1.3.1: the heatmap has a short name stating its message and a table of its days as the long description; the W3C asks for "a two-part text alternative" for complex images ([W3C complex images](https://www.w3.org/WAI/tutorials/images/complex/)). 1.4.1: each step has a count in text. 2.1.1: drill-down from a day is reachable without the grid. 1.3.1: feed day headings are headings, the feed a list.
- Implementation: code-standard rule 1 (lists as lists), code-standard rule 18 (type icons named), code-standard rule 20 (filters and paging work without script).

**Build**
- The heatmap is a chart `figure`: an `svg role="img"` named by its summary sentence, its legend, and a `table` of week by weekday with counts ([html-semantics: *Charts in markup*](../../code/html-semantics.md#charts-in-markup); [data visualisation: long descriptions and data tables](../patterns/data-visualisation.md#long-descriptions-and-data-tables)). The cells are not 365 tab stops; links to a day sit in the table, or the cells become one `grid` with a roving tabindex and arrow keys, as the [W3C grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) describes ([accessibility: *Composite widgets and roving tabindex*](../../code/accessibility.md#composite-widgets-and-roving-tabindex)).
- Each cell's step is a class or `data-level` set from the model's thresholds; the colours are a sequential token set per theme ([tokens: *Themes and modes*](../../code/tokens.md#themes-and-modes)).
- The feed is an `ol` per day under an `h3` holding a `<time datetime>`; each entry is an `li` with a link to the change and its own `time`. MDN: `datetime` translates dates "into machine-readable format" ([MDN time](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time)). Grouping by day happens in the model, in the reader's time zone (code-standard rule 29; [i18n: *Numbers, dates, plurals and lists*](../../code/i18n.md#numbers-dates-plurals-and-lists)).
- The heatmap, the table and the feed render from one event list, so their counts agree (code-standard rule 29).

**Check**
- *Script:* could check that a heatmap `svg` has a name and a table with one row per weekday, that every feed entry has a `time` with `datetime` and a link, and that a day heading's count equals its entries.
- *Judgement:* does each feed entry say what changed in the reader's words? Would a chart answer the question better?

**Sources:** [Carbon spatial charts](https://carbondesignsystem.com/data-visualization/spatial-charts/), [Carbon simple charts](https://carbondesignsystem.com/data-visualization/simple-charts/), [NN/g choosing chart types](https://www.nngroup.com/articles/choosing-chart-types/), [NN/g dashboards](https://www.nngroup.com/articles/dashboards-preattentive/), [Primer timeline accessibility](https://primer.style/product/components/timeline/accessibility/), [Primer relative time](https://primer.style/product/components/relative-time/), [Atlassian date and time](https://atlassian.design/foundations/content/date-time), [W3C complex images](https://www.w3.org/WAI/tutorials/images/complex/), [W3C grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/), [MDN time](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/time), all opened here. Carbon and NN/g disagree on colour for magnitude, and Primer and Atlassian on the relative-time threshold; the toolkit's choices are stated above. No source opened covers grouping a feed by day; it is the toolkit's judgement.

---

## Exports

**Use when**
- People take the data elsewhere: a spreadsheet, a report, a ticket.

**How**
- Export sits in the table toolbar, which Carbon reserves for global actions "such as table settings, complex filters, exporting, or editing table data" ([Carbon data table](https://carbondesignsystem.com/components/data-table/usage/)).
- Export what the reader is looking at: the current filters and sort, all pages, with the option of everything stated in the menu ("Export 42 filtered rows" / "Export all 508").
- The file carries its provenance: source names and dates in a header row or the filename, following design-standard rule 1. (The toolkit's judgement; no source opened specifies it.)
- Column names in the file match the screen; values are raw (numbers as numbers, dates in ISO form), not formatted for display.
- A long export runs in the background with progress and a notice when ready ([interaction: response times](../design/interaction.md#response-times-and-perceived-performance)).

**Cases**
- Export downloads all 508 rows while the reader filtered to 42 → export the filtered set by default and label the choice.
- A CSV's dates read "3 days ago" → write ISO dates; relative times are for the screen.
- A chart has no export and people screenshot it → offer the underlying table as CSV.

**Accessibility**
- 4.1.3 Status Messages: "Export ready" is announced. 2.4.4 Link Purpose: the control says what it exports and in what format.
- Implementation: code-standard rule 18 (an icon-only export button has a name).

**Build**
- A file that exists at an address is `<a href="…?status=open&format=csv" download>`, carrying the current filters and sort; a file generated on request is a `button` ([html-semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- The file is written from raw values: numbers unformatted, dates in ISO 8601, column names matching the screen's headers from one definition (code-standard rule 29).
- Provenance goes in the filename and a header row, from the same source record the caption reads.
- A background export reports progress and "Export ready" in a persistent `role="status"` line ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)); an icon-only export control is named (code-standard rule 18).

**Check**
- *Script:* could compare the exported row count with the filtered count on screen.
- *Judgement:* is what the reader gets what they expected from what they saw?

**Sources:** [Carbon data table](https://carbondesignsystem.com/components/data-table/usage/). Carbon's dashboards page does not cover exports; the rest is the toolkit's judgement.

---

## Refresh and real-time

**Use when**
- Data changes while the page is open, or the reader can ask for new data.

**How**
- **Analytical**: refresh on load or on request; the caption carries the data's date. **Operational**: refresh automatically at an interval matched to how fast the data matters, with "Updated 14:32" visible.
- Updates never move what the reader is using: sort, filters, scroll position, focus and an open row stay put (design-standard rule 2). New rows arrive with a notice ("4 new findings. Show") rather than pushing the list down under the pointer.
- Indicators follow [interaction: response times](../design/interaction.md#response-times-and-perceived-performance): no indicator under about a second.
- A manual Refresh control says when it last ran, and acknowledges at once even when the work takes longer (design-standard principles).
- A failed refresh keeps the last good data on screen, marked with its time, and says the refresh failed; it never blanks the page.
- Auto-updating content can be paused.

**Cases**
- A queue refreshes every 30 seconds and the row under the pointer jumps → hold new rows behind a "Show new" notice.
- A refresh fails and tiles show 0 → keep the last values, mark "Last updated 14:02; refresh failed", offer Retry.
- A spinner flashes on every 200 ms refresh → no indicator under a second; update quietly.
- An operational wall screen has no time shown → add the update time beside the title.

**Accessibility**
- 2.2.2 Pause, Stop, Hide: auto-updating information shown beside other content can be paused, stopped or hidden. 4.1.3 Status Messages: announce material changes (new items, failure), not every tick. 2.2.1 Timing Adjustable if a session expires.
- Implementation: code-standard rule 14 (a live swap keeps the reader's place), code-standard rule 61 (a failed refresh reports why).

**Build**
- Polling chains `setTimeout`, pauses on `visibilitychange`, aborts the stale request and backs off on failure; or `EventSource` where the server can push ([javascript: *Polling and live data*](../../code/javascript.md#polling-and-live-data)).
- Updates patch rows by id and keep focus, scroll, sort and an open row ([javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll); code-standard rule 14).
- New rows wait behind a "Show 4 new findings" `button`; only that summary is announced, in a persistent polite live region.
- A pause control is a `button` with `aria-pressed`, set in the same handler that stops the schedule.
- A failed refresh keeps the rendered data and its `time`, and shows the reason the envelope carries (code-standard rule 61).

**Check**
- *Script:* `tools/ui-check/check.mjs` measures design-standard rule 2 for tab switches; could do the same across a refresh, and check that an auto-updating region has a pause control.
- *Judgement:* does the refresh rate match how fast the reader must act?

**Sources:** response-time sources in interaction; [Primer degraded experiences](https://primer.style/product/ui-patterns/degraded-experiences/). Carbon's dashboards page does not cover refresh.
