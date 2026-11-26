# Timesheets: time by the day and by the hour

How a timesheet records work billed or planned by the day beside work billed by the hour: which unit an entry records, the setting that turns hours into days, logging tasks under a day, entering hours as a duration or a start–end range, and showing entries with no time of day beside timed ones. The calendar views, the day cell and how an entry is drawn are [`calendars.md`](calendars.md), and how all-day and timed entries share a view is its [*All-day and timed entries together*](calendars.md#all-day-and-timed-entries-together). Adding, editing and deleting an entry are [`calendar-events.md`](calendar-events.md); a day nobody filled in, a day logged as 0 and a day off are [data: *No entry, zero and none*](data.md#no-entry-zero-and-none). Totals, rounding and invoice lines from logged time are [`../profiles/reports.md`](../profiles/reports.md). Time fields are [selection: *Time entry*](selection.md#time-entry).

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
- A project billed per day whose tasks also take logged time → the day is the billed quantity; the task hours are a record under it, not a second charge (Harvest keeps them unbilled).
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
- [required] The setting is a number `input` with a visible label and a hint as its description ([forms: *Input types and autocomplete attributes*](forms.md#input-types-and-autocomplete-attributes); code-standard rule 15).

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
- [strong] **Several entries on one date.** Clockify: "end time of the previous entry will be the start time of the next one" ([Clockify adding time](https://clockify.me/help/track-time-and-expenses/adding-time-manually)); FreshBooks lists every entry logged on a day together ([FreshBooks time](https://support.freshbooks.com/hc/en-us/articles/225525527-How-do-I-track-my-time)); Teamwork has "Save and log another" ([Teamwork track time](https://support.teamwork.com/projects/time-tracking/track-time)); Productive's policy can block entries "whose start and end time overlaps with an existing one" ([Productive policies](https://help.productive.io/en/articles/11769095-setting-up-time-tracking-policies)).
- [moderate] **A week grid takes durations.** Harvest: "in the case of start and end times, you won't be able to track using the Week view" ([Harvest day view](https://support.getharvest.com/hc/en-us/articles/360048181892-Tracking-time-Day-view)); Clockify's timesheet: "Enter the amount of time you worked in the cell corresponding to that day" ([Clockify timesheet](https://clockify.me/help/track-time-and-expenses/timesheet-view)).
- [moderate] **A duration with no range gets a start time made up.** Toggl: "A new entry will be created at 8 AM", or in free slots between entries ([Toggl timesheet](https://support.toggl.com/adding-time-entries-in-timesheet-view)); Clockify starts the next entry at the previous one's end (above).

**Cases**
- 9:00–12:30 and 14:00–16:00 on one date → two entries, 3.5 h and 2 h, total 5.5 h.
- A person types "1.5" in a field showing hh:mm → it is read as 1 h 30 min, not refused, as FreshBooks and Toggl read decimals (above).
- "1" typed in a timesheet set to minutes → Clockify reads 1 minute, in decimal 1 hour ([Clockify timesheet](https://clockify.me/help/track-time-and-expenses/timesheet-view)); the hint states which.

**Accessibility**
- [required] 3.3.2: the duration field's hint gives the accepted forms ("For example, 1.5 or 1:30"). 3.3.1 Error Identification: an error names what is wrong, such as an end before the start.

**Build**
- [required] Start and end are labelled time fields and the duration a text `input`, all parsed on the server (code-standard rule 20; [selection: *Time entry*](selection.md#time-entry)); a start and end grouped under the date are a `fieldset` with a `legend` ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [required] The hint is the field's description (code-standard rule 15).
- [moderate] Durations are stored as a number, not text: FreshBooks' API holds "The length of time in seconds" ([FreshBooks API, time entries](https://www.freshbooks.com/api/time_entries)); Harvest's holds "Number of (decimal time) hours" ([Harvest API, time entries](https://help.getharvest.com/api-v2/timesheets-api/timesheets/time-entries/)).

**Check**
- *Script* could: submit "1.5", "1:30" and "1h30m" and assert each saves as 90 minutes; add two ranges on one date and assert both show.
- *Judgement*: does the person know start and end, or only how long?

**Sources.** Productive, Clockify, FreshBooks, Harvest, Teamwork, Toggl and Tempo as linked. Overlapping ranges are allowed by default in Clockify ([calendar events: *Entry status and conflicts*](calendar-events.md#entry-status-and-conflicts)) and can be blocked by Productive's policy.

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
- [strong] An entry with no times carries its date only; one with times carries a start and an end, so the data tells the two apart. RFC 5545 gives an all-day event "a DATE value type for the "DTSTART" property instead of the default value type of DATE-TIME" ([RFC 5545 §3.6.1](https://www.rfc-editor.org/rfc/rfc5545#section-3.6.1)); Google: "For all-day events, use start.date and end.date instead" ([Google Calendar API, create events](https://developers.google.com/workspace/calendar/api/guides/create-events)).

**Check**
- *Script* could: render a date with a day entry and a ranged entry and assert the day entry is in the top row and the ranged one in the grid.
- *Judgement*: can the reader tell at a glance which of a day's entries are billed by the day?

**Sources.** Productive, Clockify, Float, Harvest Forecast, RFC 5545 and Google's API as linked. Toggl's calendar does not import all-day events from a linked calendar ([Toggl calendar integration](https://support.toggl.com/integrating-calendar-view-with-google-and-outlook-calendars)), which says nothing of its own entries, so it is not counted. Teamwork's timesheet calendar and Harvest's calendar view were opened, but neither page says where a duration-only entry is drawn.
