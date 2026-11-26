# Timesheets: time by the day and by the hour

How a timesheet records work billed or planned by the day beside work billed by the hour: which unit an entry records, the setting that turns hours into days, logging tasks under a day, entering hours as a duration or a start–end range, showing entries with no time of day beside timed ones, task time against project time, fixed-fee and retainer work, planned against logged time, the views time is entered in (a day list, a week grid, a calendar), and what a timesheet refuses or warns about. The calendar views, the day cell and how an entry is drawn are [`calendars.md`](calendars.md), and how all-day and timed entries share a view is its [*All-day and timed entries together*](calendars.md#all-day-and-timed-entries-together). Adding, editing and deleting an entry are [`calendar-events.md`](calendar-events.md); a day nobody filled in, a day logged as 0 and a day off are [data: *No entry, zero and none*](data.md#no-entry-zero-and-none). Totals, rounding and invoice lines from logged time are [`../profiles/reports.md`](../profiles/reports.md). Time fields are [selection: *Time entry*](selection.md#time-entry).

## Day or hour: the unit an entry records

**Use when / don't use**
- [weak] Hours are tracked even against work sold by the day. Productive's day unit "Represents a full working day", yet "Users track work in hour units, even though the service is measured in days" ([Productive tracking units](https://help.productive.io/en/articles/12049022-tracking-units-hours-days-or-pieces)).
- [strong] Trackers bill logged time by the hour. The rates of Toggl, Clockify, Bonsai and Everhour are hourly: "the hourly rate you bill your clients" ([Toggl billable rates](https://support.toggl.com/billable-rates)); "Clockify offers 5 levels of hourly rates" ([Clockify hourly rates](https://clockify.me/help/reports/hourly-rates)); a service rate needs "the Per Hour billing type" ([Bonsai service rate](https://intercom.help/bonsai/en/articles/10021416-how-to-set-service-hourly-rate)); "T&M (members rate)" bills "based on the hourly rate for each member" ([Everhour billing](https://support.everhour.com/article/502-ways-to-bill-your-project)).
- [moderate] A day unit lives on what is sold: the service, the estimate and the invoice line. Productive charges a service "by hour, day, or piece" ([Productive services](https://help.productive.io/en/articles/9330991-adding-services-to-a-budget)), and its invoice line's unit is hour, piece or day ([Productive API, line items](https://developer.productive.io/line_items.html)). Bonsai's estimate line takes "Flat fee, hourly, or day rate" ([Bonsai estimate builder](https://intercom.help/bonsai/en/articles/10731093-the-estimate-builder)).
- [strong] Whole and part days are a time-off choice. Clockify: "Time-off can be tracked as full-day, half-day, or hourly entry depending on the policy" ([Clockify time off](https://clockify.me/help/track-time-and-expenses/track-holidays-time-off)); Everhour offers "full day, 3/4, 1/2, 1/4 day or set your custom period" ([Everhour time off](https://support.everhour.com/article/308-how-to-track-time-offs)); Harvest Forecast: "If the person is not off the whole day, un-check the All day option and add the number of hours" ([Forecast time off](https://support.getharvest.com/hc/en-us/articles/40045592077581-Forecast-Scheduling-time-off)).

**How**
- [weak] **A day sold as a priced unit, the hours kept apart.** Harvest: "Although Harvest doesn't explicitly support tracking time by day instead of by hour, you can track day rates using the workaround below": an expense category with a unit price and the unit "day", then "Enter 1 for the Amount to track an expense for 1 day"; the hours go on tasks with no billable rate, and "this method won't work if you need to track both day rates and hourly rates on the same project" ([Harvest day rates](https://support.getharvest.com/hc/en-us/articles/360048181872-How-do-I-track-day-rates-in-Harvest)).
- [moderate] **A priced unit carries its name.** Productive's invoice line has a unit of hour, day or piece, and its amount is "unit price × quantity" ([Productive API, line items](https://developer.productive.io/line_items.html)); Harvest's expense category, which its day-rate workaround uses, has a `unit_name` and a `unit_price` ([Harvest API, expense categories](https://help.getharvest.com/api-v2/expenses-api/expenses/expense-categories/)). Lines built from tracked hours are [reports: *Itemised lines for invoicing*](../profiles/reports.md#itemised-lines-for-invoicing).

**Cases**
- A project billed per day, logged on 23 November as a half day → the entry's quantity is 0.5 day; the invoice line reads "0.5 day × day rate".
- A project billed per day whose tasks also take logged time → Harvest's workaround bills the day and keeps the task hours unbilled; whether a project does the same is its call, since one product documents it.
- A day project and an hourly project on one date → two entries, one in days and one in hours; neither is converted into the other's unit to be billed.
- "8" in a cell with no unit anywhere → hours or days? Name the unit.

**Accessibility**
- [required] 1.3.1 Info and Relationships: a unit carried by a column header is tied to its cells by table markup. 3.3.2 Labels or Instructions: a field's unit ("Hours", "Days") is in its label.

**Build**
- [weak] An invoice line stores its quantity and its unit as data: Productive's line item has `quantity` and `unit_id` ([Productive API, line items](https://developer.productive.io/line_items.html)).
- [required] Where a Full day / Half day choice is offered, it is radios in a `fieldset` with a `legend` ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)); it posts without script (code-standard rule 20) and uses native inputs (code-standard rule 8).
- [required] A unit shown only in a header is tied to the cell by table markup ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)).

**Check**
- *Script* could: assert every duration figure on the page has a unit in its own text, its header or its label.
- *Judgement*: is each project's billed unit visible where its time is entered?

**Sources.** Productive, Toggl, Clockify, Bonsai, Everhour and Harvest as linked. Productive is the only product checked with a day unit on the service and the invoice; Harvest reaches one through expenses, and Bonsai's help puts a day rate in estimates only, though its marketing page speaks of "hourly or daily rates" for roles ([Bonsai rate card](https://www.hellobonsai.com/rate-card)). None of the help pages checked (Bonsai, Harvest, Toggl, Clockify, Teamwork, FreshBooks, Everhour, Productive) offers Full day or Half day for a work entry; that is a failed search, not proof none does. Scoro's help refused automated reading and is not counted.

## The length of a day

**Use when / don't use**
- [strong] Turning hours into days needs a day length, and products make it a setting. Productive: "The length of a day is defined in Settings > General > Work Time > Person Day (e.g., 8 hours)" ([Productive tracking units](https://help.productive.io/en/articles/12049022-tracking-units-hours-days-or-pieces)); Resource Guru asks "How many hours equals a day" ([Resource Guru hours per day](https://help.resourceguruapp.com/en/articles/1957250)); Tempo sets "the Hours per day in Jira Time Tracking settings" from its daily maximum ([Tempo logging options](https://help.tempo.io/timesheets/latest/configuring-logging-time-options)).

**How**
- [strong] **Days are shown from hours.** Productive's person day "converts hours worked into day units in reports": with a 6-hour day, 40 hours is "6.67 person-days" ([Productive person days](https://help.productive.io/en/articles/12442141-person-days)); Resource Guru's booking form reads "Total: 40h (5d)" ([Resource Guru total hours](https://help.resourceguruapp.com/en/articles/10258882)), and "Your reports will display data in days as well as hours" ([Resource Guru hours per day](https://help.resourceguruapp.com/en/articles/1957250)); Tempo's Timetracker shows "1d 2h 30m for Pretty Duration, 1.2d for Days, or 10.5h by default" ([Tempo Timetracker preferences](https://help.tempo.io/timetracker/latest/user-preferences)).
- [strong] **One length for the account, overridden where it differs.** Productive's person day "applies organization-wide", and a budget can override it ([Productive person days](https://help.productive.io/en/articles/12442141-person-days)); Clockify's workweek setting "acts as a default for new members that can be overridden on their profile" ([Clockify workspace settings](https://clockify.me/help/getting-started/workspace-settings)); Float sets work days and hours for the company, with custom hours per person ([Float default hours](https://support.float.com/en/articles/28942-default-work-days-and-hours); [Float custom hours](https://support.float.com/en/articles/28934-individual-custom-hours-and-work-days)).
- [moderate] **A length per weekday.** Teamwork's working hours are set per day, "8 hours on Monday and 6 hours on Tuesday" ([Teamwork working hours](https://support.teamwork.com/projects/your-profile/updating-your-working-hours)); Tempo's workload scheme sets "the number of working hours" for each day of the week ([Tempo workload schemes](https://help.tempo.io/planner/latest/creating-workload-schemes)).
- [weak] **Eight hours by default.** Resource Guru: "By default, the number of hours in a day for people resources is 8, and for non-human resources it is 24" ([Resource Guru hours per day](https://help.resourceguruapp.com/en/articles/1957250)). Productive gives 8 as its example, not as a default.
- [weak] **Changing the length moves what was planned.** Float: lowering a day's hours turns time already scheduled past them into overtime ([Float default hours](https://support.float.com/en/articles/28942-default-work-days-and-hours)).

**Cases**
- A 6-hour day and 40 logged hours → "6.67 days", as Productive computes; the 40 hours stay the record.
- The day length changes from 8 to 7 hours in March → every report shown in days changes, past periods too; a report that must not move keeps the hours.
- A half day on a project with an 8-hour day → 4 hours expected; task hours past 4 show as over.

**Accessibility**
- [required] 3.3.2: the day-length setting's label names its unit ("Hours in a working day").

**Build**
- [moderate] Days are computed from hours and the day length where they are shown, as Productive's reports and Resource Guru's "40h (5d)" are (sources above).
- [required] The setting has a visible label (WCAG 3.3.2) and a hint, such as "For example, 7.5", as its description (code-standard rule 15).
- [weak] It is a text input with `inputmode="decimal"`, since a day length such as 7.5 is a decimal and GOV.UK advises against `type="number"` ([forms: *Input types and autocomplete attributes*](forms.md#input-types-and-autocomplete-attributes)).

**Check**
- *Script* could: change the day length and assert stored hours are unchanged while day figures follow.
- *Judgement*: who reads days here, and is the length they assume the one set?

**Sources.** Productive, Resource Guru, Tempo, Clockify, Float and Teamwork as linked. Bonsai, Harvest Forecast and Everhour keep hours per day as planning capacity only, with no conversion found ([Bonsai member settings](https://intercom.help/bonsai/en/articles/15139825-how-to-configure-settings-for-individual-members); [Forecast capacity](https://support.getharvest.com/hc/en-us/articles/40048434242573-Forecast-Setting-and-editing-capacity); [Everhour schedule](https://support.everhour.com/article/487-schedule-basic-information)).

## Tasks under a day

**Use when / don't use**
- [moderate] Time on the tasks of day-sold work is logged in hours. Productive's people "track work in hour units" against a day service ([Productive tracking units](https://help.productive.io/en/articles/12049022-tracking-units-hours-days-or-pieces)); Harvest's day-rate workaround keeps the hours on tasks and bills the day as one unit ([Harvest day rates](https://support.getharvest.com/hc/en-us/articles/360048181872-How-do-I-track-day-rates-in-Harvest)).

**How**
- [strong] **Planners split a day in hours per day.** Float: "The standard allocation unit at Float is hours per day" ([Float allocate time](https://support.float.com/en/articles/4188692-allocate-time)); Harvest Forecast assigns "hours per day, hours per week, or hours per month" ([Forecast assignments](https://support.getharvest.com/hc/en-us/articles/40045426702349-Forecast-Adding-time-assignments)); Tempo's plan is "Per day" or "Total" ([Tempo plan time](https://help.tempo.io/planner/latest/the-plan-time-form)); Teamwork takes "either the allocation's total hours or the hours per day" ([Teamwork allocations](https://support.teamwork.com/projects/schedule/allocate-and-manage-resources)); Everhour has an hours-per-day stepper ([Everhour schedule](https://support.everhour.com/article/487-schedule-basic-information)).
- [strong] **Planners spread a total over the days.** Teamwork: "Total hours are spread evenly across the date range" ([Teamwork allocations](https://support.teamwork.com/projects/schedule/allocate-and-manage-resources)); Tempo: "the total is divided equally by the number of days planned" ([Tempo plan time](https://help.tempo.io/planner/latest/the-plan-time-form)); Resource Guru books "a total number of hours across a date range" ([Resource Guru bookings](https://help.resourceguruapp.com/en/articles/1955394)).
- [moderate] **A share of capacity instead of hours.** Float: "you can choose to allocate a percentage of a person's working time", where "100% represents their full capacity" ([Float allocate time](https://support.float.com/en/articles/4188692-allocate-time)); Productive's Percentage booking is "scheduled relative to their total capacity" ([Productive booking details](https://help.productive.io/en/articles/9036702-booking-details-explained)). Both are planning, not logged time.
- [strong] **Planners show past the day's hours, not refuse it.** Float: for overtime "the background behind the allocation will turn red" ([Float allocate time](https://support.float.com/en/articles/4188692-allocate-time)); Bonsai: "only the days that are over capacity will turn red" ([Bonsai capacity](https://intercom.help/bonsai/en/articles/9103114-setting-and-tracking-team-capacity)); Tempo's planner marks over-allocation in red ([Tempo resources](https://help.tempo.io/planner/latest/viewing-resources-and-their-plans)).

**Cases**
- A full day with three tasks of 3, 3.5 and 1.5 hours on an 8-hour day → "8 h of 8 h"; the day is billed once.
- A half day with 5 task hours → "5 h of 4 h"; whether a log past the day is refused or shown is the project's call, since the sources above are planners.
- A day project's task logged as "0.5" → half the day or half an hour? Name the unit in the field.

**Accessibility**
- [required] 1.4.1 Use of Color: over the day's hours is said in text ("1 h over"), not by red alone.
- [required] 4.1.3 Status Messages: a running total under the task list ("6.5 h of 8 h") updates in a status region without moving focus.

**Build**
- [required] Each task row is a labelled duration field ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)); the total is text in a `role="status"` region ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- [required] Over is a variant attribute on the total (`data-over`), with text beside it, never a pseudo-class or colour alone (code-standard rule 9).

**Check**
- *Script* could: enter task hours past the day's length and assert a text "over" appears beside any colour.
- *Judgement*: does the reader see at once how much of the day the tasks fill?

**Sources.** Float, Harvest Forecast, Tempo, Teamwork, Everhour, Resource Guru, Productive, Bonsai and Harvest as linked. No help page checked describes splitting a logged Full day or Half day entry across tasks, in hours or in fractions; the items above are the nearest documented practice, from planners and from Productive's day services. Tempo's Capacity Planner is reported in search results to show planned time "as a percentage of the working day"; that page was not opened, so it is not counted.

## Hourly entries: duration, range or both

**Use when / don't use**
- [strong] Accept a duration, a start–end range, or both. Productive: "as a total (e.g. 5 hours), a time range (e.g. 9:00am–2:00pm), or both" ([Productive day view](https://help.productive.io/en/articles/9464612-day-view-in-my-time)); Clockify: "Set the start and end time, or add time by duration" ([Clockify adding time](https://clockify.me/help/track-time-and-expenses/adding-time-manually)); FreshBooks tracks time by duration or by start and end time, as a preference ([FreshBooks time](https://support.freshbooks.com/hc/en-us/articles/225525527-How-do-I-track-my-time)); Harvest's timer mode tracks "via duration or via start and end times" ([Harvest timesheet settings](https://support.getharvest.com/hc/en-us/articles/360048181812-Timesheet-settings)).

**How**
- [contested] **Both in one entry, or one mode for the account.** Productive takes both in one entry (above); Teamwork links them: "Click the lock to maintain the time spent when adjusting the start or end time" ([Teamwork track time](https://support.teamwork.com/projects/time-tracking/track-time)). Harvest and FreshBooks make it an account or preference choice (above). The project decides.
- [strong] **A typed duration is read in several forms.** FreshBooks takes a decimal (1.5), hours and minutes (1h30m) or a colon (1:30) ([FreshBooks time](https://support.freshbooks.com/hc/en-us/articles/225525527-How-do-I-track-my-time)); Toggl treats numbers without units as hours and reads 5:30 as hours and minutes ([Toggl timesheet](https://support.toggl.com/adding-time-entries-in-timesheet-view)); Tempo takes "whole hours or in hh mm format (such as 2h 30m)" ([Tempo log time](https://help.tempo.io/timesheets/latest/the-log-time-form)).
- [strong] **Hours and minutes or decimal hours is a display setting.** Clockify: Full (hh:mm:ss), Compact (h:mm) and Decimal (h.hh) ([Clockify duration format](https://clockify.me/help/track-time-and-expenses/duration-format)); Teamwork: hours and minutes ("4h 30m") or decimal ("4.5") ([Teamwork time tracking](https://support.teamwork.com/projects/getting-started/time-tracking-overview)); Harvest: "HH:MM shows on timesheets only; on reports and invoices, time always appears in decimal format" ([Harvest timesheet settings](https://support.getharvest.com/hc/en-us/articles/360048181812-Timesheet-settings)).
- [strong] **Several entries on one date.** Clockify: "end time of the previous entry will be the start time of the next one" ([Clockify adding time](https://clockify.me/help/track-time-and-expenses/adding-time-manually)); FreshBooks lists every entry logged on a day together ([FreshBooks time](https://support.freshbooks.com/hc/en-us/articles/225525527-How-do-I-track-my-time)); Teamwork has "Save and log another" ([Teamwork track time](https://support.teamwork.com/projects/time-tracking/track-time)). Overlapping entries are [*What a timesheet refuses or warns about*](#what-a-timesheet-refuses-or-warns-about).

Whether a week grid takes ranges, and what time of day a grid cell's entry gets, is [*Entry views*](#entry-views-day-list-week-grid-and-calendar).

**Cases**
- 9:00–12:30 and 14:00–16:00 on one date → two entries, 3.5 h and 2 h, total 5.5 h.
- A person types "1.5" in a field showing hh:mm → it is read as 1 h 30 min, not refused, as FreshBooks and Toggl read decimals (above).
- "1" typed in a timesheet set to minutes → Clockify reads 1 minute, in decimal 1 hour ([Clockify timesheet](https://clockify.me/help/track-time-and-expenses/timesheet-view)); the hint states which.

**Accessibility**
- [required] 3.3.2: the duration field's hint gives the accepted forms ("For example, 1.5 or 1:30"). 3.3.1 Error Identification: an error names what is wrong, such as an end before the start.

**Build**
- [required] The time fields work with scripts off and so are read on the server (code-standard rule 20); which control each is, is [selection: *Time entry*](selection.md#time-entry). A start and end grouped under the date are a `fieldset` with a `legend` ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [required] The hint is the field's description (code-standard rule 15).
- [moderate] Durations are stored as a number, not text: FreshBooks' API holds "The length of time in seconds" ([FreshBooks API, time entries](https://www.freshbooks.com/api/time_entries)); Harvest's holds "Number of (decimal time) hours" ([Harvest API, time entries](https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/)).

**Check**
- *Script* could: submit "1.5", "1:30" and "1h30m" and assert each saves as 90 minutes; add two ranges on one date and assert both show.
- *Judgement*: does the person know start and end, or only how long?

**Sources.** Productive, Clockify, FreshBooks, Harvest, Teamwork, Toggl and Tempo as linked.

## Day entries beside timed entries

Entries with no time of day get a row above the timed grid, in Productive's time calendar as in Apple, Outlook and FullCalendar: [calendars: *All-day and timed entries together*](calendars.md#all-day-and-timed-entries-together) holds that item and its sources.

**Use when / don't use**
- [moderate] A tracker's time grid holds only ranged entries. Clockify: "Only events with a start and end time appear in the Calendar view" ([Clockify calendar](https://clockify.me/help/track-time-and-expenses/calendar-view)); Productive's draft with a duration but no range "doesn't appear in the grid at all" ([Productive calendar view](https://help.productive.io/en/articles/4922018-calendar-view-in-my-time)).

**How**
- [moderate] **Hours with no times leave as all-day events.** Float: entries "booked in hours only, such as four hours on Thursday, sync as all-day events while your status remains Free", while timed ones and full-day time off show as Busy ([Float Google Calendar](https://support.float.com/en/articles/2795210-google-calendar)); Harvest Forecast's items "will appear as all-day events on your calendar since Forecast assignments don't have start/end times" ([Forecast calendar feed](https://support.getharvest.com/hc/en-us/articles/40046753739149-Forecast-Viewing-your-schedule-in-a-calendar-app)).
- [weak] **An allocation's hours are changed by its height.** Float: "Grab & drag vertically to extend or shorten the allocated hours per day" ([Float quick start](https://support.float.com/en/articles/13686089-quick-start-guide)); no product checked states that height is proportional to hours.

**Cases**
- A Full day on project A and two timed ranges on project B on one date → the Full day in the top row; the ranges as blocks below, or, in a month cell, as time and title.
- A day entry exported to a calendar feed → an all-day event marked free, as Float does, so it does not block the timed meetings.

**Accessibility**
- [required] 1.3.1: an entry's name says "full day", "half day" or its times ("Project A, full day"; "Project B, 9:00 to 12:30"), not only its row ([calendar events: *Opening and editing an entry*](calendar-events.md#opening-and-editing-an-entry)).

**Build**
An entry with no times carries its date only, and one with times a start and an end, so the data tells the two apart: [calendars: *All-day and timed entries together*](calendars.md#all-day-and-timed-entries-together) holds that item and its sources.

**Check**
- *Script* could: render a date with a day entry and a ranged entry and assert the day entry is in the top row and the ranged one in the grid.
- *Judgement*: can the reader tell at a glance which of a day's entries are billed by the day?

**Sources.** Productive, Clockify, Float and Harvest Forecast as linked; the data shape's sources are calendars'. Toggl's calendar does not import all-day events from a linked calendar ([Toggl calendar integration](https://support.toggl.com/integrating-calendar-view-with-google-and-outlook-calendars)), which says nothing of its own entries, so it is not counted. Teamwork's timesheet calendar and Harvest's calendar view were opened, but neither page says where a duration-only entry is drawn.

## Task time and project time

**Use when / don't use**
- [strong] An entry names its project and its task, so the task's time is the entry's time. Toggl's tasks are "a sub-project", picked "from the "Project" field when creating time entries" ([Toggl tasks](https://support.toggl.com/tasks)); Clockify's tasks are "an extra layer of hierarchy within a project, functioning like sub-projects" ([Clockify tasks](https://clockify.me/help/projects/working-with-tasks)); Harvest's entry asks "Choose your project and task" ([Harvest day view](https://support.getharvest.com/hc/en-us/articles/360048181892-Tracking-time-Day-view)); Bonsai's form asks "Project Task Hours Description" ([Bonsai manual entries](https://intercom.help/bonsai/en/articles/3438791-manually-adding-time-tracking-entries)); Productive lets an entry "Pin a task to the time entry" ([Productive time entries](https://help.productive.io/en/articles/2179623-time-entries-in-a-budget)).
- [strong] A project's time is its entries' time, those with a task and those without. Teamwork: "The Time section shows all time logged to the project itself (or to any of its tasks)" ([Teamwork tracked time](https://support.teamwork.com/projects/time-tracking/view-tracked-time)); Clockify: entries of a deleted task "will become without a task but will still be linked to the project" ([Clockify tasks](https://clockify.me/help/projects/working-with-tasks)); Everhour: "You can start a timer or log manual time directly to a selected project without assigning it to any task" ([Everhour time without a task](https://support.everhour.com/article/175-tracking-time-without-a-task)).

**How**
- [contested] **Whether a task is required.** Harvest requires one: "task_id integer required" ([Harvest API, time entries](https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/)). Teamwork makes it optional: "choose a project and, optionally, a task" ([Teamwork track time](https://support.teamwork.com/projects/time-tracking/track-time)). Toggl, Clockify, Everhour and Productive make it a setting ([Toggl required fields](https://support.toggl.com/en/articles/2206946-required-fields-for-time-entries); [Clockify required fields](https://clockify.me/help/track-time-and-expenses/required-fields); [Everhour](https://support.everhour.com/article/175-tracking-time-without-a-task); [Productive required fields](https://help.productive.io/en/articles/15176383-required-time-entry-fields)). The project decides.
- [strong] **Time with no task keeps its project and gets its own group.** Toggl: "the "without task" filter in reports" ([Toggl tasks](https://support.toggl.com/tasks)); Clockify's task filter "Includes filters for All, Active, Done, and Without task" ([Clockify reports](https://clockify.me/help/getting-started/understand-use-your-reports)); Bonsai's invoice: "Entries without tasks appear under "No task"" ([Bonsai invoicing](https://intercom.help/bonsai/en/articles/1898575-invoicing-your-tracked-time)); Everhour's invoice shows project-level entries "under the line item "No task"" ([Everhour](https://support.everhour.com/article/175-tracking-time-without-a-task)).
- [strong] **One figure beside logged time is the task's estimate or budget.** Toggl: "Each task will show you the actual hours logged against its estimate" ([Toggl estimates](https://support.toggl.com/project-time-estimates)); Clockify: "compare estimated vs tracked in a project's Status tab" ([Clockify project progress](https://clockify.me/help/projects/tracking-project-progress)); Everhour shows "total time spent on a task vs. original estimate" ([Everhour estimates](https://support.everhour.com/article/131-task-estimates)); Harvest sets "an hourly budget for every task" ([Harvest budgets](https://support.getharvest.com/hc/en-us/articles/360048686811)).
- [moderate] **An entry attaches to what is sold, and may also name a task.** Productive's entries are "always connected to a service" and can "Pin a task to the time entry" ([Productive service and task](https://intercom.help/productive/en/articles/13723255-assigning-a-service-to-a-task); [Productive time entries](https://help.productive.io/en/articles/2179623-time-entries-in-a-budget)); FreshBooks' entry takes an optional service (Sources).

The invoice bills the entries' hours, by task, project or person, or one line per entry: [reports: *Itemised lines for invoicing*](../profiles/reports.md#itemised-lines-for-invoicing). Billing a day apart from its task hours is Harvest's workaround in [*Day or hour*](#day-or-hour-the-unit-an-entry-records).

**Cases**
- An hourly project with 9:00–17:00 logged and a task given 3 h on a separate tab → two figures for one day; the products above record the 3 h as one of the day's entries (9:00–12:00, with its task) and the rest with another task or none, so 8 h is one total.
- Invoicing that project by task → a line for each task and one for "No task", adding to the same 8 h.

**Accessibility**
- [required] 1.3.1: in a report grouped by task, each group, the one with no task included, is a row group with a header ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)); its label follows the products' "No task" (above).

**Build**
- [moderate] The task is a field of the entry, not a separate record of hours: Harvest's entry holds `task_id` ([Harvest API, time entries](https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/)), and Toggl and Clockify pick the task in the entry's own project field (sources above).
- [required] The project and task fields are labelled native controls, or a [combobox](../components/combobox.md) where the list is long (code-standard rule 8).

**Check**
- *Script* could: sum a project's entries by task and assert the groups, "No task" included, add to the project total.
- *Judgement*: does any screen show task hours that are not entries?

**Sources.** Toggl, Clockify, Harvest, Bonsai, Everhour, Teamwork and Productive as linked; FreshBooks' item on an entry is a service, and optional ([FreshBooks time](https://support.freshbooks.com/hc/en-us/articles/225525527-How-do-I-track-my-time)). No product opened records task hours inside a longer project entry; that is a failed search, not proof none does. Productive's required-fields page says both that an entry missing a required field is "blocked" and that it "saves as a draft"; it is counted only for the setting.

## Fixed fee and retainer work

**Use when / don't use**
- [strong] Time is logged on fixed-fee work too, and the fee, not the hours, is invoiced. Harvest: "Fixed Fee projects bill a set price, no matter how many hours are worked" ([Harvest project types](https://support.getharvest.com/hc/en-us/articles/360048686931)); Everhour: "These projects will have a set price, no matter how many hours are worked" ([Everhour billing](https://support.everhour.com/article/502-ways-to-bill-your-project)); Bonsai: "Revenue is fixed regardless of time spent", while "Costs still track time and expenses" ([Bonsai billing types](https://intercom.help/bonsai/en/articles/9948855-project-billing-types)); FreshBooks shows a flat rate as one invoice line, however many entries are tracked ([FreshBooks billing methods](https://support.freshbooks.com/hc/en-us/articles/115005920788-What-are-billing-methods)).

**How**
- [strong] **Logged hours are compared with the fee or a budget.** Harvest's "If billed hourly column" shows "what your hypothetical fees would be if the project were billed hourly" ([Harvest project types](https://support.getharvest.com/hc/en-us/articles/360048686931)); Toggl's chart "shows the progress against the Fixed fee amount set for the project" ([Toggl project dashboard](https://support.toggl.com/en-us/article/project-dashboard-xmtsal/)); Clockify's budget bar shows "how much was spent and how much remains" ([Clockify project budget](https://clockify.me/help/projects/project-budget)); Bonsai's budget shows the total, the amount used and the remaining amount ([Bonsai budgets](https://intercom.help/bonsai/en/articles/8916128-project-budgets)).
- [contested] **Whether fixed-fee time is billable.** FreshBooks marks every entry on a flat-rate project non-billable ([FreshBooks billing methods](https://support.freshbooks.com/hc/en-us/articles/115005920788-What-are-billing-methods)); Bonsai's retainer advice is to enter hours as billable "as a $0/hour rate" ([Bonsai billing types](https://intercom.help/bonsai/en/articles/9948855-project-billing-types)); a third way keeps a billable figure beside the worked one on each entry, as Productive does: "Adjust the worked time and its range. Adjust the billable time" ([Productive time entries](https://help.productive.io/en/articles/2179623-tracking-and-managing-time-entries-in-budgets)). FreshBooks' side is paraphrased, its page unread raw. The project decides.
- [strong] **A recurring fee or budget resets each period.** Harvest: with "Fees reset monthly" turned on, "Harvest bills that fee every calendar month" ([Harvest recurring fee](https://support.getharvest.com/hc/en-us/articles/47889121432461)); Toggl multiplies a recurring fee "by the number of billing periods that fall within your selected date range" ([Toggl fixed fee](https://support.toggl.com/en/articles/6361632-fixed-fee-projects)); Clockify resets an estimate by week, month or year ([Clockify project budget](https://clockify.me/help/projects/project-budget)); Everhour resets a budget "every Day, week, Month, Quarter and Year" ([Everhour budgeting](https://support.everhour.com/article/501-budgeting)).
- [contested] **Unused retainer hours: carried over or lost.** Teamwork can "Add unspent hours to next period's budget" ([Teamwork retainers](https://support.teamwork.com/projects/project-budgets/retainer-budgets)); Productive rolls over "the deficit/surplus of billable (approved) hours" ([Productive rollover](https://help.productive.io/en/articles/9902502-retainer-hours-rollover)). FreshBooks carries no unused retainer time into the next period, and bills time over it as excess hours at another rate ([FreshBooks retainers](https://support.freshbooks.com/hc/en-us/articles/360015379391-What-are-retainers); paraphrased, unread raw). Teamwork offers carry-over as an option. The project decides.

**Cases**
- A fixed-fee site build logged at 62 h against a fee worth 50 h at the usual rate → the invoice carries the fee; the report shows 62 h used against the budget.
- A monthly retainer of 20 h with 14 h used → 6 h carried into next month, or lost, by the project's rule, stated on the report.

**Accessibility**
- [required] 1.1.1 Non-text Content and 1.3.1: a budget bar's figures are in text ("14 h of 20 h used"), so the bar is never their only carrier.

**Build**
- [moderate] The billing type is a field of the project, not of each entry: Harvest, Everhour, Bonsai and FreshBooks each set it on the project (sources above). Whether entries follow it is the contested item above.
- [required] A budget bar is a `meter`, which HTML defines as "a scalar measurement within a known range, or a fractional value" ([HTML, the meter element](https://html.spec.whatwg.org/multipage/form-elements.html#the-meter-element)), with its figures in text beside it.

**Check**
- *Script* could: invoice a fixed-fee project and assert one fee line and no hour lines.
- *Judgement*: does the reader see hours used against the fee, apart from what is billed?

**Sources.** Harvest, Everhour, Bonsai, FreshBooks, Toggl, Clockify, Productive and Teamwork as linked; FreshBooks' help could not be read raw here, so its lines are paraphrased. Hubstaff's budgets take cost or hours and a reset, but no fixed-price type was found in its help ([Hubstaff projects](https://support.hubstaff.com/projects-overview/)).

## Planned and logged time

**Use when / don't use**
- [strong] Planned and logged time are kept apart and compared; the report side, booked work never adding into the done total, is [reports: *What counts*](../profiles/reports.md#what-counts-billable-non-billable-and-booked). Float: "Scheduled hours show what was planned, logged hours show what actually happened" ([Float log team](https://support.float.com/en/articles/16603855-log-team-close-the-gap-between-planned-and-actual)); Harvest with Forecast: "The Delta column highlights the difference between the scheduled and tracked hours for the project" ([Harvest and Forecast](https://support.getharvest.com/hc/en-us/articles/360048686031)); Clockify's report compares "the assignments you've scheduled with the time you've actually spent on them" ([Clockify scheduled vs tracked](https://clockify.me/help/reports/scheduled-vs-tracked-report)).

**How**
- [moderate] **A plan becomes logged time by an action, unless automatic logging is on.** Float's suggestions are "log time recommendations based on the Schedule" that "can be edited or deleted as needed" ([Float time tracking](https://support.float.com/en/articles/3616990-time-tracking)). Calendar events work the same way: Clockify copies a calendar event "as time entry" ([Clockify calendar integration](https://clockify.me/help/getting-started/integrate-google-outlook-with-your-clockify-account)); Harvest greys out an event once used, and it "can't be used to make more time entries" ([Harvest calendar](https://support.getharvest.com/hc/en-us/articles/360048180932)); Toggl's copy needs "a project, tags, and other details" assigned "manually" ([Toggl calendar integration](https://support.toggl.com/integrating-calendar-view-with-google-and-outlook-calendars)).
- [weak] **Automatic logging is opt-in.** Float: "When Automatic time logging is enabled, Float automatically logs all log time suggestions for the selected period" ([Float settings](https://support.float.com/en/articles/13619139-time-tracking-settings)).
- [weak] **Automatically logged time is still approved.** Productive's auto-tracked entries "will still need to be approved to become recognized" ([Productive automatic tracking](https://help.productive.io/en/articles/3158736-automatic-time-tracking)).
- [moderate] **Logged time from a plan is a real entry, made on the day.** Harvest's recurring entries: "Harvest adds each entry at the start of its scheduled day … so future days stay empty until that day begins" ([Harvest day view](https://support.getharvest.com/hc/en-us/articles/360048181892)); Float's automatic logging runs "between 6 and 7 am" ([Float time tracking settings](https://support.float.com/en/articles/13619139-time-tracking-settings)); Productive's auto-tracking runs at "End of day … (at 23:59)" or "Start of day … (at 00:01)" ([Productive automatic tracking](https://help.productive.io/en/articles/3158736-automatic-time-tracking)).
- [weak] **Tentative plans produce no logged time.** Float: "No logged time suggestions will appear for tentative allocations" ([Float time tracking](https://support.float.com/en/articles/3616990-time-tracking)).
- [weak] **Tentative plans are left out of scheduled hours.** Productive's tentative bookings "do not count toward a person's total scheduled hours" ([Productive tentative bookings](https://help.productive.io/en/articles/8582323-tentative-bookings)). Whether a tentative entry still blocks the day on a calendar is [calendar events: *Entry status and conflicts*](calendar-events.md#entry-status-and-conflicts), where it does by default.
- [weak] **Logging leaves the plan alone.** Float: adding or removing a suggestion "does not affect the allocation on the Schedule" ([Float time tracking](https://support.float.com/en/articles/3616990-time-tracking)).

**Cases**
- A day booked for next Tuesday → planned; on Tuesday Float would offer it as a suggestion, logged once confirmed.
- A tentative half day → shown on the plan, offered for nothing until confirmed ([calendar events: *Entry status and conflicts*](calendar-events.md#entry-status-and-conflicts)).
- A billing report for last month → logged figures; planned beside them, or left out, is the project's call ([reports: *What counts*](../profiles/reports.md#what-counts-billable-non-billable-and-booked)).

**Accessibility**
- [required] 1.4.1: planned and logged entries differ in text or a named pattern ("Planned"), not by a paler fill alone.

**Build**
- [required] The status is in the entry's accessible name, as [calendar events: *Entry status and conflicts*](calendar-events.md#entry-status-and-conflicts) builds it.

**Check**
- *Script* could: assert every planned entry carries "Planned" in its accessible name.
- *Judgement*: can the reader tell what was planned from what was done on any day?

**Sources.** Float, Harvest with Forecast, Clockify, Toggl and Productive as linked. Everhour can sync calendar events into entries automatically, a further opt-in ([Everhour calendar](https://support.everhour.com/article/603-calendar-integrations)).

## Entry views: day list, week grid and calendar

The views a tracker offers for entering time; reporting it is [reports](../profiles/reports.md).

**Use when / don't use**
- [strong] **Several views over the same entries.** Toggl: "you can view time entries in three ways: Calendar , List , and Timesheet" ([Toggl timer page](https://support.toggl.com/en-us/article/the-timer-page-x46p31/)); Productive: "You can log time in three views: Day , Timesheet , and Calendar" ([Productive manual tracking](https://help.productive.io/en/articles/2179597-manual-time-tracking)); Hubstaff edits time "via Daily, Weekly , and Calendar Timesheets views" ([Hubstaff manual time](https://support.hubstaff.com/how-to-add-delete-and-edit-manual-time-entries/)); Everhour's timesheet "shows mostly the same data but in a different interpretation" ([Everhour time page](https://support.everhour.com/article/452-about-time-page)).
- [moderate] **The week grid is for entering a lot of time at once, after the fact.** Harvest's Week view is "ideal for adding a lot of time at once" ([Harvest week view](https://support.getharvest.com/hc/en-us/articles/360048687531)); Clockify's timesheet is "designed for users who prefer to enter time manually at the end of the day or week" ([Clockify timesheet](https://clockify.me/help/track-time-and-expenses/timesheet-view)) and "ideal if you prefer to enter time for the entire week at once" ([Clockify creating an entry](https://clockify.me/help/track-time-and-expenses/creating-a-time-entry)).
- [weak] **The list or day view is for a timer and an entry's details.** Harvest's Day view: "you can either start a timer to run while you take care of a task or add entries for work you've already done" ([Harvest day view](https://support.getharvest.com/hc/en-us/articles/360048181892)); Toggl's list is where entries are edited field by field ([Toggl list view](https://support.toggl.com/en-us/article/tracking-time-in-list-view-1pt3xo2/)).
- [moderate] **The calendar is for finding gaps.** Toggl: "look for gaps in your day" ([Toggl calendar view](https://support.toggl.com/en-us/article/tracking-time-in-the-calendar-view-1fftm9r/)); Clockify: "making it easy to fill in gaps" ([Clockify creating an entry](https://clockify.me/help/track-time-and-expenses/creating-a-time-entry)).
- [contested] **Start and end times in the week grid.** Harvest: "in the case of start and end times, you won't be able to track using the Week view" ([Harvest week view](https://support.getharvest.com/hc/en-us/articles/360048687531)); Clockify keeps start and end out of the cell, shown on hover with the description and tags ([Clockify timesheet](https://clockify.me/help/track-time-and-expenses/timesheet-view)). Hubstaff's weekly view holds ranges, each added or edited in a dialog: "Select the Date and the From and To times" ([Hubstaff manual time](https://support.hubstaff.com/how-to-add-delete-and-edit-manual-time-entries/)). The project decides.

**How**
- [strong] **The list or day view adds an entry at the top or from a form.** Toggl: "At the top is a bar where you can easily enter a new time entry" ([Toggl timer page](https://support.toggl.com/en-us/article/the-timer-page-x46p31/)); Clockify: "Click the What are you working on? box" ([Clockify creating an entry](https://clockify.me/help/track-time-and-expenses/creating-a-time-entry)); Everhour's search at the top starts "a live timer, or log hours manually" ([Everhour methods](https://support.everhour.com/article/128-time-tracking-methods)); Harvest's "+Track time" opens a form ([Harvest day view](https://support.getharvest.com/hc/en-us/articles/360048181892)); Bonsai: "Click Add Time." ([Bonsai manual entries](https://intercom.help/bonsai/en/articles/3438791-manually-adding-time-tracking-entries)).
- [moderate] **A list row is edited in place.** Toggl: "To edit an entry, click on the relevant field and insert your changes" ([Toggl list view](https://support.toggl.com/en-us/article/tracking-time-in-list-view-1pt3xo2/)); Everhour: "edit logged hours inline" ([Everhour methods](https://support.everhour.com/article/128-time-tracking-methods)). Harvest's grid cells are edited the same way: "Click into the field in question and change it" ([Harvest week view](https://support.getharvest.com/hc/en-us/articles/360048687531)).
- [moderate] **A list can group same-detail entries.** Toggl: entries "that share the same details … are displayed as a single time entry", and "Editing the group will edit each individual time entry in the group" ([Toggl list view](https://support.toggl.com/en-us/article/tracking-time-in-list-view-1pt3xo2/)); Clockify's grouping is a profile setting ([Clockify profile settings](https://clockify.me/help/getting-started/manage-your-profile-settings)).
- [weak] **Productive's day view groups by what the entry names, each group with its own add.** Productive: "Group the time entries in the Day view by client, project, budget, service, or task", and "Each group has its own + button" ([Productive day view](https://help.productive.io/en/articles/9464612-day-view-in-my-time)).
- [strong] **The grid: rows are project and task, columns are days, a cell takes a duration.** Harvest: "Click + Add row … Choose your project and task and click Save row" ([Harvest week view](https://support.getharvest.com/hc/en-us/articles/360048687531)); Toggl: "+ Add row", then "click on the desired cell you would like to Add time to" ([Toggl timesheet view](https://support.toggl.com/en-us/article/adding-time-entries-in-timesheet-view-5qe6a6/)); Clockify: "Enter the amount of time you worked in the cell corresponding to that day" ([Clockify timesheet](https://clockify.me/help/track-time-and-expenses/timesheet-view)); Everhour: "Click any cell to add or update hours directly" ([Everhour methods](https://support.everhour.com/article/128-time-tracking-methods)); Productive: "services are listed on the left, with time entries for each day on the right" ([Productive timesheet view](https://help.productive.io/en/articles/4522791-timesheet-view-in-my-time)).
- [contested] **A cell that holds several entries.** Toggl merges entries with the same details into one cell and, when a cell is lowered, picks which entry to shorten by rule, ending "(Priority 3) The Time Entry with a Longer duration" ([Toggl timesheet view](https://support.toggl.com/en-us/article/adding-time-entries-in-timesheet-view-5qe6a6/)). Productive keeps them apart: "You can add multiple time entries for the same day and service", and a click opens "A pop-up … where you can assign the entry to a task, start the timer, or add a note" ([Productive timesheet view](https://help.productive.io/en/articles/4522791-timesheet-view-in-my-time)). The project decides.
- [contested] **Notes in the grid.** Harvest: "It is not possible to add notes to entries in the Week view" ([Harvest week view](https://support.getharvest.com/hc/en-us/articles/360048687531)); Clockify: "you won't see the description field by default. This view is designed for fast time input across the week" ([Clockify description missing](https://clockify.me/help/troubleshooting/optimize-tracking/description-field-missing)). Productive's cell opens a pop-up where you can "add a note" ([Productive timesheet view](https://help.productive.io/en/articles/4522791-timesheet-view-in-my-time)). The project decides.
- [strong] **Removing a grid row removes its week's time.** Harvest: to delete "a week’s worth of time for a project/task: Click the x to the right of the row" ([Harvest week view](https://support.getharvest.com/hc/en-us/articles/360048687531)); Clockify: "all time associated with that task, for that week, will be deleted" ([Clockify timesheet](https://clockify.me/help/track-time-and-expenses/timesheet-view)); Toggl's row x will "delete all time entries created that are associated with the row" ([Toggl timesheet view](https://support.toggl.com/en-us/article/adding-time-entries-in-timesheet-view-5qe6a6/)).
- [contested] **A cell's entry and the time of day.** Toggl gives it one: "A new entry will be created at 8 AM", with the description "System Added Time Entry" ([Toggl timesheet view](https://support.toggl.com/en-us/article/adding-time-entries-in-timesheet-view-5qe6a6/)). Productive gives it none and its calendar draws it apart: "Top section : entries without a defined time of day" ([Productive calendar view](https://help.productive.io/en/articles/4922018-calendar-view-in-my-time)). Which suits a project is [*Day entries beside timed entries*](#day-entries-beside-timed-entries). The project decides.
- [strong] **Last week's rows are copied, with or without their hours.** Harvest: "Harvest will not copy the time entered, only the project/task combinations", and copies rows into a new week by itself ([Harvest week view](https://support.getharvest.com/hc/en-us/articles/360048687531)); Toggl: "Display Last Week's Projects" or "Copy All Entries & Projects from Last Week" ([Toggl timesheet view](https://support.toggl.com/en-us/article/adding-time-entries-in-timesheet-view-5qe6a6/)); Clockify: "Copy activities only" or "Copy activities and time" ([Clockify timesheet](https://clockify.me/help/track-time-and-expenses/timesheet-view)).
- [moderate] **Copying fills only an empty period.** Clockify's copy "only works if your current week is completely empty" ([Clockify can't copy](https://clockify.me/help/troubleshooting/optimize-tracking/cant-copy-last-week)); Productive duplicates onto "a day with no time entries" ([Productive duplicating](https://help.productive.io/en/articles/6911714-duplicating-time-entries-from-yesterday)).
- [moderate] **Totals per day and per week.** Productive: "The day header shows the total hours logged for that day" and "The week total appears at the top left under Total" ([Productive timesheet view](https://help.productive.io/en/articles/4522791-timesheet-view-in-my-time)); Float: "A daily tally of hours logged is displayed next to each day, and the total hours logged for the week are shown in the top-right of the screen" ([Float time tracking](https://support.float.com/en/articles/3616990-time-tracking)); Everhour's grid has "daily totals across the week" ([Everhour methods](https://support.everhour.com/article/128-time-tracking-methods)). Where the week total sits differs (Productive top left, Float top right).
- [weak] **A day total off its target is marked.** Everhour: "all smaller and higher daily totals (except today)… will be highlighted in orange" ([Everhour colour coding](https://support.everhour.com/article/491-color-coding-of-time-entries)).
- [moderate] **Planned time can pre-fill the entry view as suggestions.** Float's "pre-filled timesheet" ([Float log my time](https://support.float.com/en/articles/16603887)); Productive's "Scheduled" suggestions ([Productive manual tracking](https://help.productive.io/en/articles/2179597-manual-time-tracking)). How a plan becomes logged time is [*Planned and logged time*](#planned-and-logged-time).
- [weak] **Days not worked are greyed.** Productive greys dates for absence, holidays and weekends ([Productive manual tracking](https://help.productive.io/en/articles/2179597-manual-time-tracking)); Bonsai's timesheet "only shows weekdays" by default ([Bonsai timesheets](https://intercom.help/bonsai/en/articles/9073093-tracking-time-with-timesheets)).

Periods move as [calendars: *Period navigation*](calendars.md#period-navigation) sets out. Adding and editing in the calendar view is [calendar events: *Creating an entry*](calendar-events.md#creating-an-entry) and [*Moving and resizing by drag*](calendar-events.md#moving-and-resizing-by-drag).

**Cases**
- A person who logs a week on Friday from memory → the week grid; one who runs a timer as they work → the list.
- Hourly work logged as start and end times → the list or day view, or the calendar; Harvest offers no week grid for it.
- A grid cell lowered from 3 h to 2 h when it holds two entries → Toggl shortens one by its rule; Productive keeps the entries apart (above). The project decides.

**Accessibility**
- [required] 1.3.1: the week grid is a `table` with day column headers and project or task row headers, so a cell is announced with its row and day ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data)).
- [required] 1.3.1 and 4.1.2: each cell's input is named by its row and column ("Design, Tuesday 3 March, hours") ([accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).
- [required] 4.1.3: a changed total is text the screen reader can reach; an autosave that changes nothing on screen says so in a status region ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).

**Build**
- [weak] The three views read one store of entries (Everhour's "same data but in a different interpretation", above).
- [required] Each cell is a native input (code-standard rule 8).
- [weak] Tab moves across the week (beyond code-standard rule 8): Toggl: "you can use the Tab key to move quickly across your week within the same project" ([Toggl timesheet view](https://support.toggl.com/en-us/article/adding-time-entries-in-timesheet-view-5qe6a6/)).

**Check**
- *Script* could: assert the week grid is a `table` with `th` for days and rows, and every cell input has an accessible name with its row and day.
- *Judgement*: does the view the person opens first match how they log, live or after the fact?

**Sources.** Harvest (Zendesk API), Toggl, Clockify, Bonsai (intercom mirror), Everhour, Productive, Float and Hubstaff help, each page fetched raw and its quotes matched. Not found: what Harvest's, Clockify's or Everhour's grid cell does with several entries, and whether Float's page is a grid or a list.

## What a timesheet refuses or warns about

**Use when / don't use**
- [strong] Past periods can be locked. Toggl: "stop members from adding, editing or deleting entries on or before a date you choose. Admins can still change locked entries" ([Toggl admin guide](https://support.toggl.com/premium-onboarding-guide-for-toggl-track-admin)); Harvest: "no one can add, edit, or delete time or expense entries on or before the lock date" ([Harvest timesheet lock](https://support.getharvest.com/hc/en-us/articles/46563687732877)); Clockify: "You cannot use the Lock feature for current or future dates" ([Clockify lock](https://clockify.me/help/track-time-and-expenses/lock-timesheets)); Everhour's lock "can be applied to members, but not admins or supervisors" ([Everhour lock](https://support.everhour.com/article/492-lock-time-editing)).
- [strong] Approval and invoicing lock what they cover. Harvest: "Approving a timesheet locks all the time and expense entries for that calendar week" ([Harvest approval](https://support.getharvest.com/hc/en-us/articles/360048181912)); Teamwork: "After a timesheet is approved, it is locked for the submitter" ([Teamwork approvals](https://support.teamwork.com/projects/time-tracking/time-approvals)); Everhour's approved weeks "are locked and can only be edited by admins" ([Everhour approval](https://support.everhour.com/article/473-time-approval-admin)); Productive: invoiced entries "can't be edited, moved or deleted" ([Productive time entries](https://help.productive.io/en/articles/2179623-time-entries-in-a-budget)).

**How**
- [moderate] **Required fields let a timer start but not stop.** Toggl: "Time entries can be started without defined fields but can only be stopped once the required fields are filled" ([Toggl required fields](https://support.toggl.com/en/articles/2206946-required-fields-for-time-entries)); Clockify: "The timer can be started but can't be stopped until you add a project and tag" ([Clockify required fields](https://clockify.me/help/track-time-and-expenses/required-fields)).
- [contested] **Overlapping entries: allowed, refused or overwritten.** Clockify: "By default, Clockify allows overlapping entries" ([Clockify overlapping](https://clockify.me/help/troubleshooting/permissions/overlapping-entries)); Productive's policy refuses them: "a warning message appears and the time range of the new entry is cleared" ([Productive policies](https://help.productive.io/en/articles/11769095-setting-up-time-tracking-policies)); Hubstaff: "Manual time entries added over existing time entries will overwrite them" ([Hubstaff manual time](https://support.hubstaff.com/how-to-add-delete-and-edit-manual-time-entries/)). The project decides.
- [strong] **A limit on hours a day or week.** Everhour: "Limit is the number of hours that a user is allowed to track per day, week or month. Once reached, it cannot be overridden by a member" ([Everhour limits](https://support.everhour.com/article/522-member-capacity-and-limits)); Hubstaff can "set member limits for the maximum number of hours that can be logged in a week, or a day" ([Hubstaff limits](https://support.hubstaff.com/user-limits/)); Productive can "Disable time tracking completely by setting the maximum value to 0h" ([Productive policies](https://help.productive.io/en/articles/11769095-setting-up-time-tracking-policies)).
- [contested] **Past the budget: refused or allowed.** Productive refuses: "You can't track this amount of time on this service because it would exceed the limit" ([Productive budget limit](https://help.productive.io/en/articles/12570473-budget-overrun-limitations-disable-time-tracking-at-the-service-limit)); Everhour can "prohibit reporting time for anyone (including admins) if the budget is exceeded" ([Everhour budgeting](https://support.everhour.com/article/501-budgeting)). Harvest "does not have a way to automatically prevent your teammates from tracking time to a project that's met its budget" ([Harvest budget](https://support.getharvest.com/hc/en-us/articles/4407035124749)). The project decides.
- [weak] **Timer and manual time can make one entry.** Productive lists "both timer and manual entries" making up one entry ([Productive timer](https://help.productive.io/en/articles/3903111-using-the-timer-to-track-time)).
- [weak] **Manual time is told apart.** Hubstaff: "Time added manually will always be recorded with 0% activity" ([Hubstaff manual time](https://support.hubstaff.com/how-to-add-delete-and-edit-manual-time-entries/)).
- [weak] **Manual entry can be switched off.** Clockify's Force timer "disables manual time entries" ([Clockify force timer](https://clockify.me/help/track-time-and-expenses/force-timer)).
- [moderate] **Idle time is offered back.** Harvest: "By default, the idle timer alert will go off at 10 minutes", with an option to add the minutes as a new entry ([Harvest idle](https://support.getharvest.com/hc/en-us/articles/360048685231)); Clockify offers to discard idle time, keep it or add it as a new entry ([Clockify desktop app](https://clockify.me/help/apps/windows-desktop-app)).

**Cases**
- An edit to an entry in an approved week → refused with the reason ("This week is approved"), not a silent failure.
- Two entries, 9:00–12:00 and 11:00–13:00 → shown side by side, refused or overwritten, by the project's rule (above).
- A timer stopped with no project where a project is required → the stop asks for the project; the time is kept.

**Accessibility**
- [required] 3.3.1 Error Identification and 3.3.3 Error Suggestion: a refusal says what was refused and what would be allowed ([forms: *Error messages and the error summary*](forms.md#error-messages-and-the-error-summary)). 4.1.3: a warning that does not stop the save is announced without moving focus.

**Build**
- [strong] The server enforces locks, limits and required fields, so a request that skips the page is refused too as security server's items "Access is denied unless a rule grants it" and "The server validates every input" require ([security server: *Access control on every object and action*](../../code/security-server.md#access-control-on-every-object-and-action); [*Validation and injection*](../../code/security-server.md#validation-and-injection)).
- [required] A locked entry shows the reason in text (WCAG 3.3.1, above); a control kept focusable to explain itself uses `aria-disabled`, not `disabled` (code-standard rule 9).

**Check**
- *Script* could: post an edit to a locked date and assert the server refuses it with a message; post overlapping entries and assert the project's rule holds.
- *Judgement*: is each refusal one the person can understand and act on?

**Sources.** Toggl, Harvest, Clockify, Everhour, Teamwork, Productive and Hubstaff as linked. No product opened refuses an entry on a future date; Productive accepts them for later approval ([Productive approvals](https://help.productive.io/en/articles/2179594-approving-time-overview)).
