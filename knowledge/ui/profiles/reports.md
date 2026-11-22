# Profile: reports

What a report must specify: a period summary read to act on, such as what to bill, hours per project or time per person. It covers how a report differs from a dashboard, choosing the period, summary before detail, grouping and subtotals, totals rows and figures, rounding, what counts (billable, booked), the empty period, drill-down to the entries, itemised lines for invoicing, and export, print and the invoice handoff. It ends with the accessibility of grouped tables. Layout, filters, freshness captions, charts and colour are [dashboards](dashboards.md), which this page does not restate; it says only where a report differs. It binds the patterns `../patterns/tables.md`, `../patterns/data.md`, `../patterns/pagination.md`, `../patterns/filtering.md`, `../patterns/feedback.md` and `../patterns/calendars.md` to one kind of product. It applies design-standard rule 1 (where figures come from), design-standard rule 11 (a choice says how much it leads to), design-standard rule 17 (an action on a set acts on what the reader sees) and design-standard rule 18 (nothing the reader chose is dropped silently). The design-standard *Application profiles* entry admits nothing from this page as a rule.

---

## Report or dashboard

**Use when**
- [weak] Starting a screen that totals recorded work over a period, to bill it, pay it or review it.

**How**
- [moderate] A dashboard is a glance: NN/g defines it as "a single-page view" that "imparts at-a-glance information on which users can act quickly", "not intended as expansive views of complex data" ([NN/g dashboards](https://www.nngroup.com/articles/dashboards-preattentive/)). Time trackers ship reports as separate views with a period, totals and a list of entries behind them ([Toggl summary report](https://support.toggl.com/summary-report); [Clockify summary report](https://clockify.me/help/reports/summary-report)).
- [strong] A report is built on a chosen period. Every product opened puts a date range at the top of its report: Toggl's date selector ([Toggl summary report](https://support.toggl.com/summary-report)), Clockify's date picker ([Clockify scheduled vs tracked](https://clockify.me/help/reports/scheduled-vs-tracked-report)), Basecamp's Timesheet filter "by project, person, or date range" ([Basecamp Timesheet](https://updates.37signals.com/post/new-in-basecamp-timesheet)), Calendly's "date range and filters at the top of the dashboard" ([Calendly analytics](https://calendly.com/help/calendly-analytics)).
- [moderate] A report ends in a handoff: an export or an invoice. Toggl's summary report "can also be converted into an invoice or Saved and Shared" ([Toggl summary report](https://support.toggl.com/summary-report)); Clockify links to creating an invoice "from time reports" ([Clockify summary report](https://clockify.me/help/reports/summary-report)).
- [weak] What differs from [dashboards](dashboards.md): the period is the first control, not a freshness caption; figures add up to totals the reader will copy elsewhere; and the page must survive export and print. Refresh and live data ([dashboards: refresh and real-time](dashboards.md#refresh-and-real-time)) rarely apply; a report reads recorded data on load.

**Cases**
- A "reports" screen shows tiles for this week with no way to pick last month → it is a dashboard; add the period control and the totals table, or rename it.
- A report updates every 30 seconds while the reader copies figures into an invoice → load on request; the figures hold still.

**Accessibility**
- [required] 1.3.1 Info and Relationships: the period, the totals and the table are text and markup, not an image of a table. 2.4.6 Headings and Labels: the page heading names the report and its period.

**Build**
- [required] The report is a page whose address holds the period, the grouping and the filters, so the same report reopens from a link (code-standard rule 67; [javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- [required] It renders on the server from the address alone and works without script (code-standard rule 20).

**Check**
- *Script:* could load the report's address in a fresh session and compare its totals with the first load.
- *Judgement:* does the reader leave this page with a figure to act on, or only an impression?

**Sources:** [NN/g dashboards](https://www.nngroup.com/articles/dashboards-preattentive/), [Toggl summary report](https://support.toggl.com/summary-report), [Clockify summary report](https://clockify.me/help/reports/summary-report), [Clockify scheduled vs tracked](https://clockify.me/help/reports/scheduled-vs-tracked-report), [Basecamp Timesheet](https://updates.37signals.com/post/new-in-basecamp-timesheet), [Calendly analytics](https://calendly.com/help/calendly-analytics), all opened here. NN/g does not discuss reports; the contrast is drawn from its definition of a dashboard.

---

## Choosing the period

**Use when**
- [weak] Every report: the period is what the totals are totals of (see *Report or dashboard*).

**How**
- [moderate] Offer whole periods as presets and a custom range. Toggl's presets are today and yesterday; this week, month, quarter, semester or year; last week, two weeks, month, 30 days, 90 days, quarter, semester, 12 months or year; and week, month or year to today ([Toggl date range](https://support.toggl.com/selecting-a-date-range)). Custom ranges take a start and an end, picked or typed (same source). Clockify filters "by date in the date picker" ([Clockify scheduled vs tracked](https://clockify.me/help/reports/scheduled-vs-tracked-report)).
- [moderate] Default to the current period. Toggl: "By default, all reports in Toggl Track will display data from This Week" ([Toggl date range](https://support.toggl.com/selecting-a-date-range)). Google Calendar's Time Insights follow the calendar's own range: "To view Time Insights for a different date range, change your calendar view" ([Google Calendar Time Insights](https://support.google.com/calendar/answer/10738043?hl=en)).
- [weak] Let the reader change the default and keep it. Toggl sets a new default from the picker: hover a preset and choose "Default" ([Toggl date range](https://support.toggl.com/selecting-a-date-range)). Toggl does not say whether a range picked once is remembered. Changing a remembered choice silently is design-standard rule 18's concern.
- [weak] A preset is dynamic: it moves with today. Toggl calls them "dynamic dates", and "navigating to a past or future date will turn the dynamic date into a static date" ([Toggl date range](https://support.toggl.com/selecting-a-date-range)). A saved or shared report states which kind it holds.
- [weak] Future periods. Toggl's presets offer only current and past periods; none reaches ahead ([Toggl date range](https://support.toggl.com/selecting-a-date-range)). No source opened forbids a future range: Toggl lets the reader navigate to a future date (same source). Where booked work exists, a future period shows it as booked (see *What counts*).
- [weak] The week's first day is a setting, not a constant. Toggl's "First Day of the Week" setting "determines the first day you are shown when you use presets like This Week/Last week" ([Toggl date range](https://support.toggl.com/selecting-a-date-range)).
- [moderate] Products cap the range, and say so. Harvest's reports: "The timeframe supplied cannot exceed 1 year (365 days)" ([Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports)). Calendly tracks "data up to one year" ([Calendly analytics](https://calendly.com/help/calendly-analytics)). Toggl makes longer ranges a paid feature ([Toggl date range](https://support.toggl.com/selecting-a-date-range)).
- [weak] No source opened defaults a report to the last complete period (last week, last month) rather than the current one. Toggl offers both as presets.

Stepping between periods (Previous, Next, the current period) is [calendars: *Period navigation*](../patterns/calendars.md#period-navigation); the period in the address follows [pagination: paging with filters, sort and the address](../patterns/pagination.md#paging-with-filters-sort-and-the-address). Picking the dates of a custom range is [selection: *Date and time entry*](../patterns/selection.md#date-and-time-entry).

**Cases**
- A monthly billing report opens on this week → offer "Last month" one click away, or let the reader make it the default.
- A custom range of 2 Nov to 30 Nov is shared and reopens on this week → keep the static range in the address.
- A report silently cuts a two-year range to one year → say the cap at the control and show the range actually used.

**Accessibility**
- [required] 1.3.1 and 2.4.6: the period is stated in text in the heading or caption ("Hours by project, 1 to 31 October 2026"), not only in the control. 3.2.2 On Input: choosing a preset does not move focus.
- [required] 2.1.1 Keyboard: a custom range can be typed, not only picked on a calendar (Toggl allows both).

**Build**
- [required] The period is two dates in the address (`?from=2026-10-01&to=2026-10-31`) or a named preset (`?period=last-month`), resolved on the server (code-standard rule 67). Harvest's own reports take the same pair: "both the `from` and `to` parameters" ([Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports)).
- [required] The control is a GET form: a select of presets and two date inputs, with a submit (code-standard rule 20; [html-semantics: *Search and filter forms*](../../code/html-semantics.md#search-and-filter-forms)).
- [required] The heading's period is two `time` elements joined by "to" ([data: dates and times](../patterns/data.md#dates-and-times)).
- [weak] A stored default is a per-reader preference applied only when the address has no period, so a shared link always wins.

**Check**
- *Script:* could load the report with no period and assert the current period; assert the heading's dates match the address; assert a range past the cap is reported, not cut.
- *Judgement:* is the default the period this reader acts on most often?

**Sources:** [Toggl date range](https://support.toggl.com/selecting-a-date-range), [Google Calendar Time Insights](https://support.google.com/calendar/answer/10738043?hl=en), [Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports), [Calendly analytics](https://calendly.com/help/calendly-analytics), [Clockify scheduled vs tracked](https://clockify.me/help/reports/scheduled-vs-tracked-report), all opened here. Zoom's usage report caps a search at one month, per university help pages ([Cornell, Zoom reports](https://it.cornell.edu/zoom/use-zoom-reports)); Zoom's own page was not reached.

---

## Summary first, then detail

**Use when**
- [weak] A report has both totals and the entries behind them.

**How**
- [strong] Two levels: a summary of totals per group, and a detailed list of entries. Toggl ships a Summary report and a Detailed report that "shows each individual time entry" ([Toggl summary report](https://support.toggl.com/summary-report); [Toggl detailed report](https://support.toggl.com/detailed-report)). Clockify's Summary report groups entries; clicking a group opens the Detailed report filtered to it ([Clockify summary report](https://clockify.me/help/reports/summary-report)). Basecamp's Timesheet report "shows totals across your projects", and each project's full entries sit behind "See the Timesheet" ([Basecamp Timesheet](https://updates.37signals.com/post/new-in-basecamp-timesheet)).
- [moderate] The summary opens with a few headline totals. Toggl's summary bar shows up to four, among them total hours, billable hours and percentage, and revenue ([Toggl summary report](https://support.toggl.com/summary-report)). The tile itself is [data: KPI tiles](../patterns/data.md#kpi-tiles); the order on the page is [dashboards: summary before detail](dashboards.md#summary-before-detail-layout-and-hierarchy).
- [weak] An "all" total sits with the group totals, so the reader sees the whole and its parts. Toggl's summary bar holds the total above the grouping table ([Toggl summary report](https://support.toggl.com/summary-report)).
- [moderate] The total states its period and unit beside it: a table title should cover "what the data is and the geography and time period it relates to" ([Analysis Function, tables](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-tables/)).

**Cases**
- The page opens with 200 entries and the month's total in the last row → move the total and the per-project totals above the entries.
- A total reads "84.5" → "84.5 hours, October 2026".

**Accessibility**
- [moderate] The summary is readable without the table: a list of key facts. GOV.UK's summary list is for "information as a list of key facts" and uses a `dl`, but not "for tabular data" ([GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/)).
- [required] 1.3.1: each total's label and value are associated.

**Build**
- [moderate] The headline totals are a `dl`, each `dt` the measure and each `dd` the figure ([GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/); [html-semantics: *Lists, description lists and figures*](../../code/html-semantics.md#lists-description-lists-and-figures)).
- [required] The summary and the detail come from one query over the same period and filters, so they cannot disagree (code-standard rule 29; design-standard rule 11).
- [required] Bands in reading order: `h1` with the period, the totals, then the grouped table (code-standard rule 2).

**Check**
- *Script:* could sum the detail and compare it with the summary's total for the same address.
- *Judgement:* can the reader answer "how much, for what, over when" from the top of the page?

**Sources:** [Toggl summary report](https://support.toggl.com/summary-report), [Toggl detailed report](https://support.toggl.com/detailed-report), [Clockify summary report](https://clockify.me/help/reports/summary-report), [Basecamp Timesheet](https://updates.37signals.com/post/new-in-basecamp-timesheet), [GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/), [Analysis Function, tables](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-tables/), all opened here.

---

## Grouping and subtotals

**Use when**
- [weak] Totals are read per customer, per project, per task or per person.

**How**
- [strong] Group by what the reader bills or reviews. Harvest's reports total hours for each customer, project, task or user ([Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports)). Clockify groups by project, customer, user, group, tag or date ([Clockify summary report](https://clockify.me/help/reports/summary-report)). Toggl groups by a primary and a secondary choice ([Toggl summary report](https://support.toggl.com/summary-report)).
- [moderate] Nest a second and third level under the first. Toggl: "Click on the > next to each primary grouping in the table to expand and see line items for the secondary grouping under it" ([Toggl summary report](https://support.toggl.com/summary-report)). Clockify gives a three-level example, "group -> user -> date" ([Clockify summary report](https://clockify.me/help/reports/summary-report)), and its scheduled report groups "on three levels" ([Clockify scheduled vs tracked](https://clockify.me/help/reports/scheduled-vs-tracked-report)). No source opened sets customer, then project, then task as a default order.
- [weak] Each group row carries its subtotal; the reader expands it to the level below (Toggl, Clockify as above).
- [moderate] Deep hierarchy strains one table: the W3C suggests restructuring multi-level tables "to make them less complex for all readers" ([W3C, multi-level headers](https://www.w3.org/WAI/tutorials/tables/multi-level/)). Row groups and header levels in depth are [tables: grouping and header hierarchy](../patterns/tables.md#grouping-and-header-hierarchy).
- [weak] The grouping chosen shapes the export too: Clockify's grouping by user with a description subgroup "produces the same structure in the file" ([Clockify export](https://clockify.me/help/reports/exporting-reports)).

**Cases**
- A flat list of 80 tasks across six projects → group by project with a subtotal each, tasks expandable under it.
- Four nested levels in one table → keep two in the table and drill to the entries for the rest (see *Drill-down to the entries*).

**Accessibility**
- [required] 1.3.1: each group is a row group whose header names it, so a cell is announced with its group (see *Accessibility of grouped tables*).
- [required] 4.1.2 Name, Role, Value: an expandable group exposes its expanded state.

**Build**
- [required] One `tbody` per group, its header a `th scope="rowgroup"` ([W3C, irregular headers](https://www.w3.org/WAI/tutorials/tables/irregular/)); the subtotal is the group's last row, with a "Subtotal" row header.
- [strong] An expandable group's toggle is a `button` with `aria-expanded` in the group's header cell, controlling the rows below; without script all levels render open ([html-semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers); code-standard rule 20).
- [required] The grouping is a parameter in the address (`?group=project,task`) and is computed in the model, not the template (code-standard rule 67, code-standard rule 29).

**Check**
- *Script:* could assert each group's subtotal equals the sum of its rows, and each group header is a `th scope="rowgroup"`.
- *Judgement:* does the first level match what the reader bills or reviews by?

**Sources:** [Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports), [Clockify summary report](https://clockify.me/help/reports/summary-report), [Clockify scheduled vs tracked](https://clockify.me/help/reports/scheduled-vs-tracked-report), [Clockify export](https://clockify.me/help/reports/exporting-reports), [Toggl summary report](https://support.toggl.com/summary-report), [W3C multi-level](https://www.w3.org/WAI/tutorials/tables/multi-level/) and [irregular](https://www.w3.org/WAI/tutorials/tables/irregular/) headers, all opened here. Harvest's help-centre pages on its time report refused automated fetches and are not cited.

---

## Totals rows and figures

**Use when**
- [weak] A table of figures that the reader adds up or copies.

**How**
- [moderate] A totals row surfaces column totals. Polaris: "Include a summary row to surface the column totals" and "Not include calculations within the summary row" ([Polaris data table](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/tables/data-table.mdx)). GOV.UK's example ends with a total row ([GOV.UK table](https://design-system.service.gov.uk/components/table/)).
- [contested] Where the totals row sits. The Analysis Function: totals "are traditionally placed at the bottom or right of the table", or at the top or left if users need them first ([Analysis Function, tables](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-tables/)). Polaris offers a footer position "to reposition the totals row in a more appropriate location based on the data stored in the table" ([Polaris data table](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/tables/data-table.mdx)). The project decides.
- [weak] Mark the totals row with a rule above it and restrained weight: lines "above and below summary statistics"; bold may help, but do not "overuse bold text" (Analysis Function, as above).
- [strong] Numbers right-aligned, in tabular figures, one precision per column: [tables: alignment and figures](../patterns/tables.md#alignment-and-figures).
- [moderate] The unit stated once, in the header: Polaris headers "Include units of measurement symbols so they aren't repeated throughout the columns" ([Polaris data table](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/tables/data-table.mdx)); the Analysis Function puts units in headings, or in the title when all data share one unit. Units in depth are [data: numbers](../patterns/data.md#numbers).
- [moderate] A money column whose rows mix currencies keeps one total per currency. Toggl's revenue is computed "in each of the currencies that the report has data from" ([Toggl summary report](https://support.toggl.com/summary-report)); Harvest returns totals per currency ([Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports)).

**Cases**
- "7.5 h" in every cell → header "Hours", cells "7.5".
- A totals row in the same weight and no rule, read as one more project → a rule above it and the label "Total".
- Two currencies summed into one figure → one total per currency.

**Accessibility**
- [required] 1.3.1: the totals row has a row header ("Total") so each total is announced with it.
- [required] 1.4.1 Use of Colour: the totals row is not told apart by colour alone; the label does it.

**Build**
- [required] The totals row is in a `tfoot` (or the first `tbody` where it sits on top), its first cell `th scope="row"` reading "Total" ([HTML tfoot](https://html.spec.whatwg.org/multipage/tables.html#the-tfoot-element); [html-semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)).
- [required] Numeric columns take `data-type="number"`, which sets `text-align: end` and `tabular-nums` ([html-semantics: *Table behaviour*](../../code/html-semantics.md#table-behaviour)).
- [required] Totals are computed in the model from the same rows the table shows, never typed or summed in the template (code-standard rule 29).
- [strong] Figures come from one `Intl.NumberFormat` per measure, raw values kept in `<data value>` ([data: numbers](../patterns/data.md#numbers)).

**Check**
- *Script:* could assert the totals row equals the column sum (or a rounding note explains the gap), that numeric cells compute to `end` and `tabular-nums`, and that no numeric cell repeats the header's unit.
- *Judgement:* can the reader find the total without reading every row?

**Sources:** [Polaris data table](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/tables/data-table.mdx), [GOV.UK table](https://design-system.service.gov.uk/components/table/), [Analysis Function, tables](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-tables/), [Toggl summary report](https://support.toggl.com/summary-report), [Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports), all opened here. Polaris and the Analysis Function differ on the totals row's place.

---

## Rounding

**Use when**
- [moderate] Durations are billed in increments (a quarter hour, a tenth) rather than to the minute.

**How**
- [moderate] Rounding is a display setting on the report, and the entries keep their recorded length. Clockify: "Time rounding doesn't change any data, only how it's displayed, which can always be turned on/off" ([Clockify time rounding](https://clockify.me/help/track-time-and-expenses/time-rounding)). Toggl puts a Rounding button "next to the export button" on its reports ([Toggl rounding](https://support.toggl.com/rounding)).
- [moderate] Rounding is up, down or to the nearest interval. Toggl offers intervals from 1 minute to 4 hours, 15 minutes among them, with Round Up To, Round to Nearest and Round Down To ([Toggl rounding](https://support.toggl.com/rounding)); Clockify offers the same three methods ([Clockify time rounding](https://clockify.me/help/track-time-and-expenses/time-rounding)).
- [contested] What is rounded. Clockify rounds each entry, then adds: "Clockify will first round the duration of each time entry, and then add them up" ([Clockify time rounding](https://clockify.me/help/track-time-and-expenses/time-rounding)). Toggl rounds each entry in a detailed view, but a grouped total after adding: "we total the individual entries in a group or sub-group as is, then apply the rounding setting to that sub-total" ([Toggl rounding](https://support.toggl.com/rounding)). For a grouped total the two give different figures for the same entries. The project decides, and the report says which.
- [moderate] Rounded figures follow into exports and amounts. Clockify: "durations and values will be rounded in the export too", and billable value uses rounded entries ([Clockify time rounding](https://clockify.me/help/track-time-and-expenses/time-rounding)). Harvest's report hours follow its Time Rounding settings ([Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports)).
- [weak] Say when totals will not equal the sum of their parts. The Analysis Function: rounding "usually means that the reported totals no longer equal the sum of the component parts" ([Analysis Function, tables](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-tables/)).

**Cases**
- Two entries of 7 minutes, rounded to the nearest 15 → per entry 0 + 0 = 0; per group 14 rounds to 15. State the method.
- Rounding is on, and the export shows exact minutes → the export carries the same rounding as the screen, or says it does not.

**Accessibility**
- [required] 1.3.1: the rounding note is text near the table, not only a toggle's state.

**Build**
- [required] The model stores exact durations; rounding is a function applied at report time, named by a parameter in the address (`?round=15-nearest`) (code-standard rule 29, code-standard rule 67).
- [required] The rounding switch is a checkbox in the report's GET form, so it works without script (code-standard rule 20).
- [weak] The caption names the method ("Rounded to the nearest 15 minutes, per entry").

**Check**
- *Script:* could compute both methods over the same entries and assert the report's totals match the method its caption names.
- *Judgement:* is the method the one the customer's agreement uses?

**Sources:** [Clockify time rounding](https://clockify.me/help/track-time-and-expenses/time-rounding), [Toggl rounding](https://support.toggl.com/rounding), [Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports), [Analysis Function, tables](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-tables/), all opened here. Clockify and Toggl differ on rounding a group's total.

---

## What counts: billable, non-billable and booked

**Use when**
- [weak] Some time is billed and some is not, or some work is booked ahead and not yet done.

**How**
- [strong] Show billable and non-billable apart, with the total. Harvest returns `total_hours` and `billable_hours` side by side ([Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports)). Clockify's chart shows "how much of it is billable (dark green) vs non-billable (light green)" ([Clockify summary report](https://clockify.me/help/reports/summary-report)). Toggl's summary bar shows billable hours with their percentage ([Toggl summary report](https://support.toggl.com/summary-report)).
- [moderate] Amounts can be hidden for a reader who should see hours only. Clockify's export takes "Hide amount" ([Clockify export](https://clockify.me/help/reports/exporting-reports)); Harvest shows amounts only to roles allowed to view rates ([Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports)).
- [moderate] Booked work never adds into the done total. Harvest's time reports count entries by their `spent_date`, recorded time only ([Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports)). Clockify reports booked work in its own columns: "Scheduled", "Tracked" and "Difference" ([Clockify scheduled vs tracked](https://clockify.me/help/reports/scheduled-vs-tracked-report)).
- [weak] Shown separately or excluded: Clockify shows booked work beside tracked work, counting only "published assignments" (same source); Harvest's time reports leave it out. No source opened says which a billing report should do.
- [weak] Uninvoiced is its own view. Harvest's Uninvoiced report "highlights the uninvoiced hours and expenses for all billable projects in a given timeframe" ([Harvest uninvoiced report API](https://help.getharvest.com/api-v2/reports-api/reports/uninvoiced-report)).
- [weak] What counts as time is stated. Google Calendar counts a meeting only if accepted, with another guest, marked busy and under 8 hours, and lists unanswered invitations apart as "Need to respond" ([Google Calendar Time Insights](https://support.google.com/calendar/answer/10738043?hl=en)).

**Cases**
- Next week's booked days are summed into "Hours this month" → show "Done 62 h" and "Booked 24 h" apart, or leave booked out of the billing report.
- A shared report shows rates to a reader who should see only hours → hide amounts for that view.

**Accessibility**
- [required] 1.4.1 Use of Colour: billable and non-billable, done and booked, are told apart by label, not only by shade.

**Build**
- [required] Done and booked are different states in the model; the totals query filters on the state, never on whether a date is past (code-standard rule 29).
- [weak] Booked rows render in their own row group or column with a text label ("Booked"), not a lighter style alone.

**Check**
- *Script:* could assert the done total equals the sum of entries in the recorded state, whatever the period.
- *Judgement:* could a reader mistake booked time for billable time anywhere on the page?

**Sources:** [Harvest time reports API](https://help.getharvest.com/api-v2/reports-api/reports/time-reports), [Harvest uninvoiced report API](https://help.getharvest.com/api-v2/reports-api/reports/uninvoiced-report), [Clockify summary report](https://clockify.me/help/reports/summary-report), [Clockify export](https://clockify.me/help/reports/exporting-reports), [Clockify scheduled vs tracked](https://clockify.me/help/reports/scheduled-vs-tracked-report), [Toggl summary report](https://support.toggl.com/summary-report), [Google Calendar Time Insights](https://support.google.com/calendar/answer/10738043?hl=en), all opened here.

---

## Empty period

**Use when**
- [weak] The chosen period has no entries, or the filters exclude them all.

**How**
- [weak] Say the period is empty and offer the way on: another period, or clearing filters. The kinds of empty state and their copy are [feedback: empty states](../patterns/feedback.md#empty-states).
- [weak] An empty report can be a missing period, not missing work. Toggl's help: if "nothing shows up on the summary Report when you first load it", define a date range ([Toggl summary report](https://support.toggl.com/summary-report)).
- [weak] A period with no entries totals zero; a period that could not be read is "Not measured" ([data: numbers](../patterns/data.md#numbers)).

No source opened says whether an empty period keeps its table headers or exports an empty file.

**Cases**
- Last month has no entries and the page shows column headers only → "No time recorded from 1 to 31 October 2026", with "Previous period" and "Clear filters".

**Accessibility**
- [required] 4.1.3 Status Messages: a report that turns empty after a period change says so without moving focus.

**Build**
- [required] The template branches on an empty result set, not on a total of 0 (code-standard rule 12, code-standard rule 29).
- [strong] The empty message sits in a persistent `role="status"` region ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).

**Check**
- *Script:* could load a period with no entries and assert a message naming the period, and no table with headers and no rows.
- *Judgement:* does the empty message say why and what to try next?

**Sources:** [Toggl summary report](https://support.toggl.com/summary-report), opened here; empty states as linked from feedback.

---

## Drill-down to the entries

**Use when**
- [weak] A total has entries behind it that the reader will check or correct before billing.

**How**
- [moderate] A group's total opens the entries filtered to it. Clockify: clicking a user, project or other item opens the Detailed report with the matching filter applied ([Clockify summary report](https://clockify.me/help/reports/summary-report)). Basecamp opens a project's full entries from "See the Timesheet" ([Basecamp Timesheet](https://updates.37signals.com/post/new-in-basecamp-timesheet)).
- [weak] The detail lets the reader correct an entry in place. Toggl: "To edit your entry click on the field you wish to change", saved when focus leaves ([Toggl detailed report](https://support.toggl.com/detailed-report)).
- [weak] The drilled view keeps the report's period. Drill-down in general (the filter in the address, Back returning as it was) is [dashboards: drill-down](dashboards.md#drill-down).

**Cases**
- Clicking "Project A, 32 h" opens all entries for all time → open project A's entries in the report's period, totalling 32 h.

**Accessibility**
- [required] 2.4.4 Link Purpose: the link names the group and the figure ("Project A, 32 hours"), not "View".
- [required] 2.1.1 Keyboard: every drill target is a link reachable without a pointer.

**Build**
- [required] Each group's figure is an `a href` to the detail with the group and the period in the address (`/entries?project=a&from=…&to=…`) (code-standard rule 20, code-standard rule 21, code-standard rule 67).
- [required] The detail's total for that address equals the summary's figure, because both run the same query (code-standard rule 29).

**Check**
- *Script:* could follow each group link and assert the detail's total equals the group's figure.
- *Judgement:* can the reader fix a wrong entry and come back to the same report?

**Sources:** [Clockify summary report](https://clockify.me/help/reports/summary-report), [Basecamp Timesheet](https://updates.37signals.com/post/new-in-basecamp-timesheet), [Toggl detailed report](https://support.toggl.com/detailed-report), all opened here.

---

## Itemised lines for invoicing

**Use when**
- [moderate] The report's figures become the lines of an invoice or a statement for a customer.

**How**
- [moderate] Offer two shapes: one line per group, or one line per entry. Toggl: a summary invoice line shows "the project name, total time, and total amount for the period"; a detailed invoice is "line-by-line, with each time entry listed separately" ([Toggl invoices](https://support.toggl.com/creating-invoices-in-toggl-track)). Clockify lets the invoice "Group entries or display them individually", grouped by "project, task" ([Clockify create invoice](https://clockify.me/help/invoices/create-invoice)).
- [weak] A line carries what was done, when and how much. Clockify's export holds task, start and end dates, duration and billable amount ([Clockify export](https://clockify.me/help/reports/exporting-reports)). No source opened sets the columns of an invoice line.
- [weak] Customers ask for dates on the lines. Toggl's support: "the invoice you create from a report does not include start/stop times"; it suggests attaching the Detailed report's export instead ([Toggl community answer](https://community.toggl.com/t/how-do-i-show-times-and-the-date-for-each-line-item-on-an-invoice/594)).
- [weak] A run of days is a range with "to", not a hyphen: "Hyphens are read out by screen readers as 'hyphen', which can lead to confusion"; abbreviated months take "the first 3 letters" ([Atlassian date and time](https://atlassian.design/foundations/content/date-time)). Listing scattered day numbers ("3, 4 and 10 Oct") is in no source opened.
- [weak] The period on the invoice is the report's period: Toggl's summary line totals "for the period" (Toggl invoices, as above).

**Cases**
- One invoice line "Design, 32 h" and the customer asks which days → one line per task with its date range ("Design, 3 to 14 Oct 2026, 32 h"), or attach the entries.
- A range written "3–14 Oct" → "3 to 14 Oct".

**Accessibility**
- [required] 1.3.1: the invoice preview's lines are a table with column headers (task, dates, quantity, unit, amount).

**Build**
- [required] Lines are generated in the model from the same grouped query as the report (code-standard rule 29); the shape (per group or per entry) is a parameter.
- [required] Each date is a `time` element; a range is two joined by "to" ([data: dates and times](../patterns/data.md#dates-and-times)).
- [strong] Quantities use the report's rounding and number format ([data: numbers](../patterns/data.md#numbers)).

**Check**
- *Script:* could assert the invoice lines sum to the report's billable total for the same period and rounding; flag hyphenated date ranges.
- *Judgement:* could the customer check each line against their own record?

**Sources:** [Toggl invoices](https://support.toggl.com/creating-invoices-in-toggl-track), [Toggl community answer](https://community.toggl.com/t/how-do-i-show-times-and-the-date-for-each-line-item-on-an-invoice/594), [Clockify create invoice](https://clockify.me/help/invoices/create-invoice), [Clockify export](https://clockify.me/help/reports/exporting-reports), [Atlassian date and time](https://atlassian.design/foundations/content/date-time), all opened here. Bonsai's and Harvest's help pages on invoicing tracked time refused automated fetches. Bonsai's product page says only that billable time is invoiced "in just one click" ([Bonsai time tracking](https://www.hellobonsai.com/time-tracking)), a vendor's claim, cited for no item.

---

## Export, print and the invoice handoff

**Use when**
- [weak] The reader takes the report elsewhere: a spreadsheet, a PDF, a printed page, an invoice.

**How**
- [strong] Offer CSV for data and PDF for reading. Toggl exports "as a PDF, CSV or Excel file" ([Toggl detailed report](https://support.toggl.com/detailed-report)); Clockify "in PDF (Free plan) or CSV/Excel" ([Clockify export](https://clockify.me/help/reports/exporting-reports)); Basecamp's Timesheet downloads "a CSV file" ([Basecamp Timesheet](https://updates.37signals.com/post/new-in-basecamp-timesheet)); Calendly exports "to a CSV file" ([Calendly analytics](https://calendly.com/help/calendly-analytics)).
- [required] The export holds what the reader sees. Clockify: "If you have filters applied, the export will only contain data that matches the selected filter criteria" ([Clockify export](https://clockify.me/help/reports/exporting-reports)). The scope and its label are design-standard rule 17; [dashboards: exports](dashboards.md#exports) owns the rest.
- [weak] A summary export and a detailed export differ. Clockify: "Export of Summary report doesn't contain timestamps"; export the Detailed report for them ([Clockify export](https://clockify.me/help/reports/exporting-reports)).
- [weak] Dates in a data export use ISO 8601, "YYYY-MM-DD" ([Atlassian date and time](https://atlassian.design/foundations/content/date-time)).
- [moderate] A PDF is laid out for paper. Toggl offers portrait or landscape ([Toggl detailed report](https://support.toggl.com/detailed-report)); Clockify caps a PDF at 3000 rows and lets the reader hide parts and add a logo ([Clockify export](https://clockify.me/help/reports/exporting-reports)).
- [moderate] The invoice is made from the report as filtered. Toggl: filter the report, then Export, then "Create Invoice" ([Toggl invoices](https://support.toggl.com/creating-invoices-in-toggl-track)). Harvest's Uninvoiced report lists what has not been billed in a timeframe ([Harvest uninvoiced report API](https://help.getharvest.com/api-v2/reports-api/reports/uninvoiced-report)).

**Cases**
- A filtered report exports every project → export the filtered set and say so on the control.
- A printed report loses its column headers after page one → repeat the header row.
- A PDF printed from the screen includes the navigation and the period control → hide them in print; keep the period in the heading.

**Accessibility**
- [required] 2.4.4 Link Purpose: each export control names its format ("Download CSV").
- [weak] A PDF export keeps the table's structure. No source opened tests an export tool's PDF tagging.

**Build**
- [strong] Each format is `<a href="…same address…&format=csv" download>`, carrying the period, grouping, filters and rounding from the address (code-standard rule 67; [html-semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- [required] Print uses `@media print` to hide controls and navigation; "these styles will only be used for printed content" ([MDN printing](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing)).
- [required] The header row is a `thead`, which a printer may repeat: "Print user agents may repeat header rows on each page spanned by a table" ([CSS 2.1 tables](https://www.w3.org/TR/CSS21/tables.html)). "May" is not "must"; check the engines the project supports.
- [required] The CSV, the PDF and the page render from one data set, so their totals agree (code-standard rule 29).

**Check**
- *Script:* could compare the CSV's row count and total with the page for the same address; print to PDF in a headless browser and assert headers repeat and controls are hidden.
- *Judgement:* could the customer read the PDF without the app?

**Sources:** [Toggl detailed report](https://support.toggl.com/detailed-report), [Toggl invoices](https://support.toggl.com/creating-invoices-in-toggl-track), [Clockify export](https://clockify.me/help/reports/exporting-reports), [Basecamp Timesheet](https://updates.37signals.com/post/new-in-basecamp-timesheet), [Calendly analytics](https://calendly.com/help/calendly-analytics), [Harvest uninvoiced report API](https://help.getharvest.com/api-v2/reports-api/reports/uninvoiced-report), [Atlassian date and time](https://atlassian.design/foundations/content/date-time), [MDN printing](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing), [CSS 2.1 tables](https://www.w3.org/TR/CSS21/tables.html), all opened here. Zoom's usage report exports a CSV, per university help pages ([Cornell, Zoom reports](https://it.cornell.edu/zoom/use-zoom-reports)); Zoom's own page was not reached.

---

## Accessibility of grouped tables

**Use when**
- [required] Any report table with groups, subtotals or a totals row.

**How**
- [moderate] A caption names the table and its period: "A caption functions like a heading for a table", and in tables mode "captions are the primary mechanism to identify tables" ([W3C caption and summary](https://www.w3.org/WAI/tutorials/tables/caption-summary/)). Captions in depth are [tables: captions, header cells and scope](../patterns/tables.md#captions-header-cells-and-scope).
- [weak] A complex table gets a short summary of how it is organised, linked by `aria-describedby` or in a `figcaption` (W3C caption and summary, as above). The W3C's example: "Column one has the location and size of accommodation, other columns show the type and number of properties available."
- [required] Row groups are `tbody` elements, each with a `th scope="rowgroup"`: "To define row groups wrap the corresponding rows in `<tbody>` elements", and "the `scope` attribute of header cells spanning rows has to be set to `rowgroup`" ([W3C irregular headers](https://www.w3.org/WAI/tutorials/tables/irregular/)).
- [required] Each row's identifier is `th scope="row"`, so a figure is announced with its task or project. GOV.UK: "Use the `scope` attribute to help users of assistive technology distinguish between row and column headers" ([GOV.UK table](https://design-system.service.gov.uk/components/table/)).
- [contested] Header levels deeper than one row: the W3C gives markup for them; others advise flattening. Both sides are in [tables: grouping and header hierarchy](../patterns/tables.md#grouping-and-header-hierarchy).
- [moderate] The totals are readable without the table: the headline totals stand as a list of key facts above it (see *Summary first, then detail*; [GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/)).

**Cases**
- Group names in a full-width `td` → a `th scope="rowgroup"` in its own `tbody`.
- A screen reader reads "32" with no project → make the project cell `th scope="row"`.

**Accessibility**
- [required] 1.3.1 Info and Relationships; 2.4.6 Headings and Labels; 1.4.10 Reflow lets a data table scroll in two dimensions ([html-semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)).

**Build**
- [required] The markup ([W3C irregular headers](https://www.w3.org/WAI/tutorials/tables/irregular/); [html-semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)):
  ```html
  <table aria-describedby="report-summary">
    <caption>Hours by project and task, 1 to 31 October 2026</caption>
    <thead><tr><th scope="col">Task</th><th scope="col" data-type="number">Hours</th></tr></thead>
    <tbody><tr><th scope="rowgroup" colspan="2">Project A</th></tr>
      <tr><th scope="row">Design</th><td data-type="number">20.0</td></tr>
      <tr><th scope="row">Subtotal</th><td data-type="number">32.0</td></tr></tbody>
    <tfoot><tr><th scope="row">Total</th><td data-type="number">84.5</td></tr></tfoot>
  </table>
  ```
- [required] The table reads correctly with no CSS (code-standard rule 1).
- [strong] A wide report table scrolls in a named, focusable container ([responsive: *Tables on small screens*](../../code/responsive.md#tables-on-small-screens)).

**Check**
- *Script:* could assert every report table has a caption naming a period, each `tbody` group header has `scope="rowgroup"`, each row identifier is `th scope="row"`, and the totals row sits in `tfoot` or carries a "Total" row header.
- *Judgement:* with a screen reader, is each figure announced with its group, its row and its column?

**Sources:** [W3C caption and summary](https://www.w3.org/WAI/tutorials/tables/caption-summary/), [W3C irregular headers](https://www.w3.org/WAI/tutorials/tables/irregular/), [W3C multi-level headers](https://www.w3.org/WAI/tutorials/tables/multi-level/), [GOV.UK table](https://design-system.service.gov.uk/components/table/), [GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/), all opened here. None covers subtotal rows; the subtotal's row header applies the W3C's row-header markup.
