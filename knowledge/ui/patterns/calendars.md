# Calendars

How time is shown on a calendar: choosing between the month grid, the week and day views and the list (agenda) view; the day cell, with its date, today, weekends, days outside the month and overflow; what an entry shows, including its colour and its status; moving between periods, with the heading, Previous, Next, Today and the view switch; the calendar on a phone; empty periods; and the semantics and keyboard model behind it. It serves the principles *show state and give feedback* (the reader always knows which period is on screen and which day is today), *consistent, not uniform* (the views and controls people know from shipping calendars) and *for everyone, in any context* (a calendar a keyboard and a screen reader can read). It applies design-standard rule 2 (the frame holds still when the period changes), design-standard rule 4 (a short view switch is segmented), design-standard rule 5 (a period that cannot be reached is disabled, not hidden) and design-standard rule 15 (an entry's status has one name, colour role and icon). Picking one date in a form is [selection: date and time entry](selection.md#date-and-time-entry). A grid of days coloured by a measure is a chart, [data visualisation: calendar heatmaps](data-visualisation.md#calendar-heatmaps). How dates and times are written is [data: dates and times](data.md#dates-and-times). Adding, moving and editing entries is [`calendar-events.md`](calendar-events.md), not this one. All-day entries beside timed ones are *All-day and timed entries together* below; time logged by the day or the hour is [`timesheets.md`](timesheets.md).

## Choosing the view

**Use when / don't use**
- [strong] **Month** for an overview of a span of weeks: which days are taken, which are free, what is coming. Atlassian uses its calendar "to visually present dates across the span of a month" ([Atlassian calendar](https://atlassian.design/components/calendar/usage)); Google Calendar, Zoom and Basecamp all offer a month view ([Google Calendar, change your view](https://support.google.com/calendar/answer/6110849?hl=en&co=GENIE.Platform%3DDesktop); [Zoom, viewing scheduled meetings](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060655); [Basecamp calendar](https://5.basecamp-help.com/article/1120-calendar)).
- [strong] **Week, work week or day** when entries have times and their length matters. Google offers Day, Week and 4 days; Zoom offers Day, Work Week and Week; Outlook lets the reader choose which days a work week holds ([Microsoft Support, change how you view your calendar](https://support.microsoft.com/en-us/office/change-how-you-view-your-calendar-a4e0dfd2-89a1-4770-9197-a3e786f4cd8f)).
- [strong] **List (agenda, schedule)** when the reader asks "what is next?" or reads one entry after another. Google, Zoom, Basecamp and FullCalendar each ship one ([FullCalendar list view](https://fullcalendar.io/docs/list-view)). Calendly's meetings page is only a list: "all your meetings in one timeline", "grouped by date" ([Calendly, manage your meetings](https://calendly.com/help/how-to-manage-your-meetings)).
- [moderate] **The list view for screen-reader users.** Google: "We recommend the use of schedule view, also called agenda view, with a screen reader" ([Google Calendar with a screen reader](https://support.google.com/calendar/answer/6101541?hl=en)). Its month view warns that "Multiple events may not show on screen" (same page).
- [weak] **Year** for a whole year at a glance; Google lists Year among its views ([Google](https://support.google.com/calendar/answer/6110849?hl=en&co=GENIE.Platform%3DDesktop)).
- [weak] **A grid and a list together** when the reader both scans for gaps and reads the detail. Basecamp 3 put "a grid showing the current month + the next month" above "a straightforward agenda view"; a click on a day moves the agenda to it ([Signal v. Noise, Basecamp 3 schedule design](https://signalvnoise.com/svn3/new-in-basecamp-3-an-all-new-schedule-design/)). Basecamp's current calendar toggles between a monthly view and a chronological list ([Basecamp calendar](https://5.basecamp-help.com/article/1120-calendar)).
- [moderate] Don't use a calendar where the dates are far from today. NN/g: calendar pickers suit dates "within less than a year"; further away they "require too much navigation" ([NN/g, date input](https://www.nngroup.com/articles/date-input/)). Carbon uses a calendar "when the user needs to know a date's relation to other days" ([Carbon date picker](https://carbondesignsystem.com/components/date-picker/usage/)).

**How**
- [strong] **Offer only the views the task needs.** MUI's scheduler limits the views with a `views` prop and sets the first with `defaultView` ([MUI event calendar views](https://mui.com/x/react-scheduler/event-calendar/views/)); FullCalendar offers preset list, day-grid and time-grid views from which a product picks; Zoom's mobile app offers three views where its desktop offers five ([Zoom](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060655)).
- [moderate] **Each view is one zoom level of the same data.** FullCalendar's `navLinks` makes a day or week label a link "to a view that represents the day/week" ([FullCalendar navLinks](https://fullcalendar.io/docs/navLinks)); Basecamp 3 moves the agenda to the day clicked in the grid (Signal v. Noise, above).
- [strong] **The week start follows the reader's locale or preference.** React Aria's calendar takes the week start from the locale, with `firstDayOfWeek` to override it ([React Aria calendar](https://react-aria.adobe.com/Calendar)); Basecamp sets it in personal preferences ([Basecamp](https://5.basecamp-help.com/article/1120-calendar)); `Intl.Locale.getWeekInfo()` returns the locale's first day and weekend days ([MDN getWeekInfo](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Locale/getWeekInfo)).

**Cases**
- A freelancer checks which days next month are still free → month view; the gaps show at a glance.
- A day of six timed calls → day or week view, where length and overlap show.
- A screen-reader user reviews tomorrow → the list view, as Google recommends.
- A booking two years away → a typed date field, not a calendar ([selection: date and time entry](selection.md#date-and-time-entry)).
- A product ships Day, 3 days, Week, Month, Year and List for a schedule nobody reads by the hour → month and list only.

**Accessibility**
- [required] 1.3.1 Info and Relationships (each view exposes the day an entry belongs to), 2.1.1 Keyboard (every view and every entry is reachable), 1.4.10 Reflow (a view used at 320px; WCAG exempts content that needs a two-dimensional layout, such as a grid of days, but not the controls around it).

**Build**
- [moderate] *Elements:* the month and week grids are tables of days; the list view is a list of days, each a heading with its entries in a `ul`. FullCalendar renders its month grid with `role="table"` and each day's entries with `role="list"` ([FullCalendar source, DayGridLayout](https://github.com/fullcalendar/fullcalendar/blob/main/packages/preact/src/daygrid/components/DayGridLayout.tsx); [DayGridCell](https://github.com/fullcalendar/fullcalendar/blob/main/packages/preact/src/daygrid/components/DayGridCell.tsx)).
- [weak] *ARIA and keyboard:* each view's semantics and keys are in *Semantics and keyboard* below.
- [weak] *States:* the current view is one value (`month`, `week`, `list`) held in the address (*Period navigation* below).
- [required] *Rules:* code-standard rule 1 (the markup reads in order without styles), code-standard rule 20 (each view renders on the server from its address).
- [weak] *Detail:* [code: tables for data](../../code/html-semantics.md#tables-for-data), [code: lists, description lists and figures](../../code/html-semantics.md#lists-description-lists-and-figures).

**Check**
- *Script:* could load each offered view with scripts off and assert it renders its period; assert the list view lists every entry the month view holds.
- *Judgement:* Which question does the reader bring: "when am I free", "what is next" or "how long is this"? Does each view answer one of them?

**Sources:** Atlassian, Carbon, NN/g, Google, Zoom, Microsoft, Basecamp, Calendly, MUI, FullCalendar, React Aria and MDN as linked. Products agree on month, week, day and list; they differ on whether a year view is offered.

## The month grid and the day cell

**Use when / don't use**
- [strong] Use the month grid when the reader needs weekdays and weeks in sight: seven columns under the day names. NN/g: calendar pickers "display a full calendar month" and "show the days of the week across the top" ([NN/g, date input](https://www.nngroup.com/articles/date-input/)); APG's date picker draws the same grid ([APG date picker dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/)), as do Carbon and Atlassian.
- [weak] Week numbers are an option, off by default. Fluent's `showWeekNumbers` adds "the week number (weeks 1 to 53) before each week row" and defaults to `false` ([Fluent calendar types](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-calendar-compat/library/src/components/Calendar/Calendar.types.ts)).

**How**
- [strong] A date picker's single month is about 240 to 320px wide: Cloudscape's grid 238 ([sizes.ts](https://github.com/cloudscape-design/components/blob/main/style-dictionary/visual-refresh/sizes.ts)), Carbon's calendar 288 ([`_date-picker.scss`](https://github.com/carbon-design-system/carbon/blob/main/packages/styles/scss/components/date-picker/_date-picker.scss)), Spectrum's single-month popover at least 320, two months 616, three 912 ([Spectrum tokens](https://unpkg.com/@adobe/spectrum-tokens@15.9.1/dist/json/variables.json)); Ant derives it from seven day cells and the padding ([panel style](https://github.com/ant-design/ant-design/blob/master/components/date-picker/style/panel.ts)).
- [strong] **Today is marked by more than colour.** Carbon calls out "Today's date" in its anatomy ([Carbon](https://carbondesignsystem.com/components/date-picker/usage/)); Fluent draws a today marker and sets `aria-current="date"` ([Fluent CalendarGridDayCell](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-calendar-compat/library/src/components/CalendarDayGrid/CalendarGridDayCell.tsx)); FullCalendar sets the same attribute ([FullCalendar DayGridCell](https://github.com/fullcalendar/fullcalendar/blob/main/packages/preact/src/daygrid/components/DayGridCell.tsx)); React Aria names the cell "Today, {date}" ([React Aria strings](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/intl/calendar/en-US.json)).
- [contested] **Days outside the month: shown or blank.** FullCalendar draws them by default (`showNonCurrentDates`, default `true`) ([FullCalendar showNonCurrentDates](https://fullcalendar.io/docs/showNonCurrentDates)); Carbon's anatomy labels a "Day in next/previous month" (Carbon). APG's example leaves those cells blank (APG date picker). React Aria disables a cell outside the month ([React Aria useCalendarCell](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/calendar/useCalendarCell.ts)). The project decides.
- [contested] **Six rows always, or as many as the month needs.** FullCalendar's `fixedWeekCount` defaults to `true`, always six weeks ([FullCalendar fixedWeekCount](https://fullcalendar.io/docs/fixedWeekCount)). Fluent's `showSixWeeksByDefault` defaults to `false` (Fluent calendar types). React Aria exposes `weeksInMonth` to override the locale's count (React Aria calendar). Six rows keep the grid's height from moving between months (design-standard rule 2 asks that controls do not move); the project decides.
- [strong] **Weekends can be dropped from the view.** FullCalendar's `weekends` option decides "Whether to include Saturday/Sunday columns" ([FullCalendar weekends](https://fullcalendar.io/docs/weekends)); Zoom offers a Work Week view (Zoom); Outlook lets the reader pick the work week's days (Microsoft Support); Fluent takes `workWeekDays`, Monday to Friday by default (Fluent calendar types).
- [moderate] **A compact grid marks a busy day with a dot.** Basecamp 3: "Every event or to-do that's due on a given day is represented by a dot" (Signal v. Noise); Fluent marks a day with a dot and adds "marked" to its name (Fluent CalendarGridDayCell; [Fluent strings](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-calendar-compat/library/src/utils/dateFormatting/dateFormatting.defaults.ts)).

**Cases**
- Today is a filled circle in the brand colour and nothing else → keep the circle and add `aria-current="date"` and "Today" in the cell's name; colour alone fails 1.4.1.
- February fits in four rows and the page jumps when the reader moves to March → six rows, or the controls above the grid, so nothing under the pointer moves.
- A team never works weekends → drop Saturday and Sunday from the grid, as a work-week view does.
- A small month grid in a sidebar → a dot per day with entries, named "marked" or with a count; the list beside it holds the detail.

**Accessibility**
- [required] 1.4.1 Use of Color (today, weekends and busy days are not told apart by colour alone), 1.4.11 Non-text Contrast (the today marker and the dot reach 3:1), 1.3.1 (a day's weekday is programmatic, not only visual).

**Build**
- [strong] *Elements:* one cell per day, holding the day number and the full date as text. FullCalendar puts the full date in visually hidden text and hides the day number from screen readers (FullCalendar DayGridCell); React Aria names each day with the weekday, day, month and year (React Aria useCalendarCell); Fluent names it with the day, month and year (Fluent CalendarGridDayCell).
- [strong] *ARIA and keyboard:* `aria-current="date"` on today's cell. ARIA defines it as "the current date within a collection of dates such as the current date within a calendar" ([MDN aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current)); Fluent and FullCalendar ship it.
- [moderate] *States:* outside the month and weekend are attributes on the cell the stylesheet reads; FullCalendar marks a disabled day with `aria-disabled` (FullCalendar DayGridCell), React Aria with `aria-disabled` on the gridcell (React Aria useCalendarCell).
- [required] *Rules:* code-standard rule 64 (where the reader is, by `aria-current`, the look styled off the attribute), code-standard rule 15 (a count beside the date is a description, not part of its name).
- [weak] *Detail:* [code: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions).

**Check**
- *Script:* could assert exactly one `aria-current="date"` per view, on the cell for today's date in the reader's time zone; that each cell's accessible name holds the weekday and the year; that the grid's height is the same for every month when six rows are chosen.
- *Judgement:* Do readers need the days outside the month, or do they only add noise?

**Sources:** NN/g, APG, Carbon, Atlassian, Fluent, FullCalendar, React Aria, Zoom, Microsoft, Basecamp and MDN as linked. They split on drawing days outside the month and on a fixed six rows, so both are `contested`.

## What an entry shows

**Use when / don't use**
- [moderate] Use an entry (an event block or chip in the cell) for anything with a date: a booking, a task due, a day off. Basecamp's calendar shows "a combined view of events and assignments" ([Basecamp](https://5.basecamp-help.com/article/1120-calendar)); Google types its events, among them out-of-office and focus time ([Google Calendar API, events](https://developers.google.com/workspace/calendar/api/v3/reference/events)).

**How**
- [strong] **An entry carries a status, and the status set is small.** iCalendar gives an event three: TENTATIVE, CONFIRMED and CANCELLED, and a to-do four: NEEDS-ACTION, COMPLETED, IN-PROCESS and CANCELLED ([RFC 5545, 3.8.1.11](https://www.rfc-editor.org/rfc/rfc5545#section-3.8.1.11)). Google's events use confirmed, tentative and cancelled ([Google Calendar API](https://developers.google.com/workspace/calendar/api/v3/reference/events)); Microsoft Graph shows an event as free, tentative, busy, out of office or working elsewhere ([Microsoft Graph event](https://learn.microsoft.com/en-us/graph/api/resources/event?view=graph-rest-1.0)).
- [moderate] **A status shows by pattern or shape, not colour alone.** New Outlook draws tentative as "blue slanted stripes" and out of office as "pink crosshatch". Free is a pale border and busy a solid fill ([Microsoft Support, availability status](https://support.microsoft.com/article/fbbf6d5c-bdb8-4018-a2e0-2e2f60642117)). Each status keeps one name, colour role and icon across the product (design-standard rule 15).
- [moderate] **Colour says which calendar or project an entry belongs to.** Google stores a colour per event (`colorId`) (Google Calendar API); Outlook colours its patterns in the calendar's colour (Microsoft Support, availability status). A legend or the entry's text names what each colour means (WCAG 1.4.1).
- [moderate] **A day with more entries than fit shows "+N more".** FullCalendar's `dayMaxEvents` caps the entries in a cell and "The rest will show up in a popover" through a +more link ([FullCalendar dayMaxEvents](https://fullcalendar.io/docs/dayMaxEvents)); Google's month view has a More button that shows all events ([Google with a screen reader](https://support.google.com/calendar/answer/6101541?hl=en)).
- [weak] **Declined or cancelled entries can be hidden.** Google has a "Show declined events" setting ([University of Michigan, Google Calendar declined events](https://teamdynamix.umich.edu/TDClient/30/Portal/KB/ArticleDet?ID=10542), a guide to Google's setting).

**Cases**
- A day booked as "maybe" and a confirmed day look the same pale blue → stripes or an outline for tentative, a solid fill for confirmed, with the word in the entry's name.
- Six projects in six hues, with no legend → a legend, or the project name in each entry; the hue alone cannot be read by everyone.
- Nine entries on one day overflow the cell → three, then "+6 more" opening the whole day.
- "Booked" on the calendar, "Reserved" in the list → one name everywhere (design-standard rule 15).

**Accessibility**
- [required] 1.4.1 Use of Color (status and project are text or pattern too), 1.4.3 Contrast (the entry's text on its fill), 2.5.8 Target Size (a "+N more" link is at least 24px).

**Build**
- [moderate] *Elements:* each entry is a list item holding a link or button to its detail; the status and project are in its text, visible or hidden. FullCalendar renders entries as list items and its more link as a control naming what it opens (`moreLinkHint`) ([FullCalendar hints](https://fullcalendar.io/docs/hints)).
- [weak] *ARIA and keyboard:* entries are focusable only when they do something; FullCalendar's `eventInteractive` makes "all events to be focusable/tabbable" ([FullCalendar accessibility](https://fullcalendar.io/docs/accessibility)).
- [moderate] *States:* the status is a data attribute from the data's status set (RFC 5545, Google), styled off the attribute; the colour a token for the calendar or project.
- [required] *Rules:* code-standard rule 12 ("+N more" renders only when there is more), code-standard rule 18 (an icon-only status carries a name), code-standard rule 15.
- [weak] *Detail:* [code: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions); telling a status badge from a chip is [chips: badges, pills, chips and tags](chips.md#badges-pills-chips-and-tags-telling-them-apart).

**Check**
- *Script:* could render a day with more entries than fit and assert a "+N more" control whose N equals the hidden count; assert every entry's accessible name holds its status; screenshot in greyscale and assert statuses still differ.
- *Judgement:* Which statuses does the reader act on? Are there more than the data model has?

**Sources:** RFC 5545, Google, Microsoft, FullCalendar, Basecamp and the University of Michigan guide as linked. Google's own appearance for tentative events could not be checked and is left out.

## All-day and timed entries together

**Use when / don't use**
- [strong] An all-day entry is a date with no time, kept apart from a timed one in the data. RFC 5545: such events "have a DATE value type for the "DTSTART" property instead of the default value type of DATE-TIME" ([RFC 5545 §3.6.1](https://www.rfc-editor.org/rfc/rfc5545#section-3.6.1)); Google: "For all-day events, use start.date and end.date instead" ([Google Calendar API, create events](https://developers.google.com/workspace/calendar/api/guides/create-events)); FullCalendar's `allDay` decides whether "the event is shown in the "all-day" section of relevant views" ([FullCalendar event object](https://fullcalendar.io/docs/event-object)).

**How**
- [strong] **Week and day views give all-day entries a row at the top.** Apple: "In Day or Week view, double-click in the "all-day" section at the top of the calendar" ([Apple Calendar, all-day events](https://support.apple.com/guide/calendar/set-up-all-day-multiday-or-repeating-events-icl1018/mac)); Outlook: a free all-day event "appears at the top of each day" ([Outlook, time away](https://support.microsoft.com/office/add-your-out-of-office-event-to-the-outlook-calendar-of-others-69fe38aa-7b5f-4225-8b69-47f47092e65e)); FullCalendar's `allDaySlot` shows the "all-day" slot "at the top of the calendar", default true ([FullCalendar allDaySlot](https://fullcalendar.io/docs/allDaySlot)); Productive's time calendar keeps a top section for "entries without a defined time of day" ([Productive calendar view](https://help.productive.io/en/articles/4922018-calendar-view-in-my-time)).
- [weak] **In a month cell, all-day and multi-day entries are bars and timed ones a dot with the time.** FullCalendar's default `eventDisplay` "renders the event as a solid rectangle if it is all-day or multi-day. If a timed event, will render it with a dot" ([FullCalendar eventDisplay](https://fullcalendar.io/docs/eventDisplay)).
- [weak] **An all-day entry shows no time.** FullCalendar: with `allDay` true "the time text is not displayed with the event" ([FullCalendar event object](https://fullcalendar.io/docs/event-object)).
- [strong] **The end date is exclusive.** RFC 5545: DTEND "specifies the non-inclusive end of the event", so 28 June to 8 July is stored with an end of 9 July ([RFC 5545 §3.6.1](https://www.rfc-editor.org/rfc/rfc5545#section-3.6.1)); Google's end is "The (exclusive) end time of the event" ([Google Calendar API, events](https://developers.google.com/workspace/calendar/api/v3/reference/events)); FullCalendar's end "value is exclusive" ([FullCalendar event object](https://fullcalendar.io/docs/event-object)).
- [weak] **The all-day row overflows like a cell.** FullCalendar's `dayMaxEvents` in the all-day section "limits the section to 5 rows, including the +more link" ([FullCalendar dayMaxEvents](https://fullcalendar.io/docs/dayMaxEvents)). The "+N more" link itself is *What an entry shows* above.

**Cases**
- A Full day booking and two calls on one date in the week view → the booking in the all-day row; the calls in the grid at their times.
- A three-day booking → one entry with a start date and an exclusive end date, not three single-day entries.
- A booking from 28 June to 8 July stored with an end of 8 July → it shows a day short; the end is exclusive, so store 9 July.

**Accessibility**
- [required] 1.3.1 Info and Relationships: "all day" or the times are in the entry's text or name, not told only by bar against dot. 1.4.1 Use of Color: the bar's fill is not the only mark of an all-day entry.

**Build**
- [strong] *Elements:* a date without a time is written `<time datetime="2026-11-23">`, a timed one `<time datetime="2026-11-23T09:00">` ([WHATWG, the time element](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-time-element); the element itself is *Semantics and keyboard* below); the all-day row comes before the timed entries in the DOM, as it does on screen (code-standard rule 2).
- [strong] *States:* all-day is a property of the entry's data, as RFC 5545's DATE value, Google's `start.date` and FullCalendar's `allDay` are (sources above); the markup carries it as an attribute (`data-all-day`) the stylesheet reads, as code-standard rule 9 maps a variant to an attribute.
- [required] *Rules:* code-standard rule 2 (DOM order is reading order).

**Check**
- *Script:* could render a day with an all-day and a timed entry and assert the all-day one comes first in the DOM, carries "all day" in its name, and has a date-only `datetime`; store a multi-day entry and assert its end is the day after the last.
- *Judgement:* can a reader of the month tell the whole-day entries from the timed ones without colour?

**Sources:** RFC 5545, Google's API, Apple, Outlook, FullCalendar and WHATWG as linked. How Google and Apple draw a month cell is not described in either's help; the month-cell item rests on FullCalendar alone.

## Period navigation

**Use when / don't use**
- [strong] Every calendar view has Previous, Next and a way back to today. Google: arrows "to move to recent dates in the past or future" and "click Today" ([Google](https://support.google.com/calendar/answer/6110849?hl=en&co=GENIE.Platform%3DDesktop)); Zoom: "Next to Today, click the back arrow" ([Zoom](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060655)); Fluent ships a "Go to today" link ([Fluent strings](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-calendar-compat/library/src/utils/dateFormatting/dateFormatting.defaults.ts)); FullCalendar's toolbar has prev, next and today.
- [moderate] A "go to date" control when readers jump far. Google's `g` goes "to a specific date" ([Google keyboard shortcuts](https://support.google.com/calendar/answer/37034?hl=en&co=GENIE.Platform%3DDesktop)); Zoom opens a date list from the current date (Zoom).

**How**
- [strong] **The period heading names what is on screen and is a heading.** FullCalendar's title is `role="heading"` with `aria-level` from `headingLevel` ([FullCalendar ToolbarSection](https://github.com/fullcalendar/fullcalendar/blob/main/packages/preact/src/component/ToolbarSection.tsx)); APG's month is an `h2` with `aria-live="polite"` (APG date picker); React Aria announces the visible range when it changes ([React Aria useCalendarBase](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/calendar/useCalendarBase.ts)).
- [strong] **Previous and Next step one period of the current view and name it.** FullCalendar names them "Previous $0" and "Next $0", the unit filled in (FullCalendar hints); Fluent "Previous month" and "Next month" (Fluent strings); React Aria "Previous" and "Next" (React Aria strings).
- [weak] **Today is disabled while today is on screen.** FullCalendar enables it only when the range does not contain today ([FullCalendar CalendarDataManager](https://github.com/fullcalendar/fullcalendar/blob/main/packages/preact/src/reducers/CalendarDataManager.ts)). Its label is "Today" in a day view and "This $0" otherwise (FullCalendar hints).
- [strong] **A period out of range is disabled, not hidden.** FullCalendar: with a `validRange`, "The prev/next buttons in the headerToolbar will be grayed out" ([FullCalendar validRange](https://fullcalendar.io/docs/validRange)); React Aria disables Previous and Next past `minValue` and `maxValue` (React Aria useCalendarBase); Fluent "will not allow navigation to" a date before `minDate` (Fluent calendar types). Design-standard rule 5 says the same of any choice.
- [moderate] **Past periods stay reachable by the same controls.** Basecamp 3 dropped its separate "Looking back" tab for the grid's own navigation (Signal v. Noise); Calendly shows upcoming and past meetings "on the same page" ([Calendly, the new calendar page](https://calendly.com/help/introducing-the-new-calendar-page)).
- [contested] **The view switch: tabs or toggles, or a menu.** FullCalendar makes two or more view buttons a `tablist` of tabs, and a lone view button a toggle with `aria-pressed` (FullCalendar ToolbarSection); Basecamp shows toggles (Basecamp). Google and Zoom put the views in a menu at the top right (Google; Zoom). Design-standard rule 4 departs from neither: up to four views are segmented, more a menu.
- [moderate] **Keyboard shortcuts for views and periods.** Google: `t` for today, `n` and `p` for the next and previous period, `d`, `w`, `m`, `y` and `a` for the views (Google with a screen reader; Google keyboard shortcuts). APG's date picker uses Page Up and Page Down for months (APG date picker).
- [required] **The view and period are in the address.** A calendar's view and date are the state of a list, which code-standard rule 67 puts in the URL; a reload, Back and a shared link reopen the same period ([ux: state persistence and restore](../design/ux.md#state-persistence-and-restore)).

**Cases**
- The heading reads "November" while the week view shows 30 Nov to 6 Dec → "30 Nov – 6 Dec 2026"; the heading names the range on screen.
- Next is an arrow with no name → "Next month" or "Next week", following the view.
- A booking calendar opens 60 days ahead and Next keeps working past day 60 into empty months → Next disabled at the last bookable month.
- A reload returns to this month after the reader paged to March → put the view and date in the address.
- Today is pressed while today is already in view and nothing happens → disable it in that state, as FullCalendar does, or let it move focus to today.

**Accessibility**
- [required] 2.4.6 Headings and Labels (the period heading names the range), 4.1.2 Name, Role, Value (icon-only Previous and Next have names; the selected view is exposed), 4.1.3 Status Messages (the new period is announced), 2.1.1 Keyboard.

**Build**
- [strong] *Elements:* Previous, Next and Today are `button`s, or links to the period's address; the heading is a real heading. FullCalendar uses `button type="button"` with `aria-label` from its hints (FullCalendar ToolbarSection).
- [strong] *ARIA and keyboard:* the heading in a polite live region, or an announcement on change (APG, React Aria); the view switch as tabs with `aria-selected` or toggles with `aria-pressed` (FullCalendar); the menu form is a menu button ([code: menus, menu buttons and toolbars](../../code/accessibility.md#menus-menu-buttons-and-toolbars)).
- [required] *States:* `disabled` on Previous or Next at the end of the range (code-standard rule 9: disabled is the control's own; code-standard rule 62 for a link, which drops its `href`); view and date as query parameters (code-standard rule 67).
- [required] *Rules:* code-standard rule 18 (icon-only buttons are named), code-standard rule 14 (focus stays on Previous or Next after the swap), code-standard rule 20 (a period's address renders without script), code-standard rule 21 (a modified click on a period link opens a tab).
- [weak] *Detail:* [code: state in the address and history](../../code/javascript.md#state-in-the-address-and-history), [code: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages), [code: keyboard shortcuts](../../code/accessibility.md#keyboard-shortcuts); walking long lists by page is [pagination](pagination.md).

**Check**
- *Script:* could press Next and assert the heading's text changes and is announced, focus stays on Next, and the address holds the new date; at the end of the valid range assert Next is disabled, not removed; reload and assert the same view and period.
- *Judgement:* How far ahead and back does the reader need to go? Is that range stated by the disabled controls?

**Sources:** Google, Zoom, Basecamp, Calendly, Fluent, FullCalendar, React Aria and APG as linked. They differ on the view switch's form and on disabling Today; design-standard rule 4 picks the form by count.

## Calendars on small screens

**Use when / don't use**
- [moderate] On a phone, offer the list and narrow time views; drop the wide ones. Zoom's mobile calendar offers Agenda, Day and 3 Day, where its desktop adds Week and Month ([Zoom](https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0060655)); Google's Android app names Schedule and Month ([Google Calendar on Android](https://support.google.com/calendar/answer/6110849?hl=en&co=GENIE.Platform%3DAndroid)).

**How**
- [moderate] **Swipe moves between periods, beside the buttons.** Zoom: "Swipe right to view previous scheduled meetings" (Zoom); Google: "swipe left or right" to change months (Google on Android).
- [moderate] **A compact month opens from the heading.** Google: "tap the month name in the top left" to open the month (Google on Android); Zoom: "tap the down arrow to show the calendar, then tap the date" (Zoom).
- [weak] **A phone's month view chooses how much each day shows.** Apple's iPhone month view offers Compact ("a single bar indicator for the events on each day"), Stacked, Details ("Show event titles") and List ([Apple, change how you view events](https://support.apple.com/guide/iphone/change-how-you-view-events-iphfd1054569/ios)).
- [moderate] **"Jump to today" stays in reach.** Google's Android app puts it at the top right (Google on Android); Zoom keeps Today next to the arrows (Zoom).

**Cases**
- A seven-column month on a 360px screen with entry titles cut to two letters → dots in the month and the list for detail, or the list view alone.
- Periods change only by swipe → keep Previous and Next buttons too; a swipe has no keyboard or single-pointer path of its own.

**Accessibility**
- [required] 2.5.1 Pointer Gestures (a swipe has a single-pointer alternative: the Previous and Next buttons), 1.4.10 Reflow (the controls and the list fit 320px), 2.5.8 Target Size.

**Build**
- [weak] *Elements:* the same views at every width, with the switch offering fewer at narrow widths, as Zoom's mobile app does (Zoom).
- [required] *ARIA and keyboard:* a swipe calls the same handler as Previous and Next, so both change the period one way (code-standard rule 36).
- [required] *States:* the view offered at a width is a default; an address that names a view keeps it, since a view the reader chose is not changed silently (design-standard rule 18).
- [required] *Rules:* code-standard rule 36 (one implementation for button and swipe), code-standard rule 54 (breakpoints written one way).
- [weak] *Detail:* [code: container queries](../../code/responsive.md#container-queries), [code: tables on small screens](../../code/responsive.md#tables-on-small-screens), [tables: responsive tables](tables.md#responsive-tables).

**Check**
- *Script:* could load the calendar at 320px and assert no horizontal scroll outside the grid, Previous and Next present, and targets at least 24px.
- *Judgement:* At phone width, which view answers the reader's usual question?

**Sources:** Zoom, Google and Apple as linked. Zoom and Google narrow the views on mobile and keep a list; neither documents a breakpoint.

## Empty periods

**Use when / don't use**
- [moderate] Show an empty period as empty days, not as an error. Basecamp 3's grid made free time visible: "Now you can see gaps in time" (Signal v. Noise). A list view with nothing in its range says so: FullCalendar shows "No events to display" ([FullCalendar list view](https://fullcalendar.io/docs/list-view)).

**How**
- [weak] **An empty list offers the next thing.** Basecamp: with no events in the next 7 days, "you'll see a message with the option to view all future events" ([Basecamp](https://5.basecamp-help.com/article/1120-calendar)).
- [weak] **A list can skip empty days.** MUI's agenda can hide them; it then "only lists the days of that month that have events" ([MUI views](https://mui.com/x/react-scheduler/event-calendar/views/)).
- [required] **The empty message appears only when the period is empty** (code-standard rule 12).

**Cases**
- An empty week shows a full-screen illustration over the grid → the grid with empty days; free days are the answer the reader came for.
- A list for next week reads "No events" and stops → "Nothing next week" with a link to the next period that has entries.

**Accessibility**
- [required] 4.1.3 Status Messages (an empty result after a period change is announced), 1.3.1 (the empty message is text, not an image).

**Build**
- [weak] *Elements:* an empty grid is the same table with empty cells (Signal v. Noise); an empty list is one message where the list would be (FullCalendar list view).
- [required] *ARIA and keyboard:* the message goes into the live region that persists across swaps (code-standard rule 14).
- [required] *States:* the server renders the empty message from the period's data (code-standard rule 20).
- [required] *Rules:* code-standard rule 12, code-standard rule 14.
- [weak] *Detail:* [feedback: empty states](feedback.md#empty-states), [ux: empty states](../design/ux.md#empty-states).

**Check**
- *Script:* could load a period with no entries and assert the grid keeps its cells and the list shows one message; load a period with entries and assert no message.
- *Judgement:* Is "empty" good news here (free days) or a gap to fill?

**Sources:** Basecamp, FullCalendar and MUI as linked.

## Semantics and keyboard

**Use when / don't use**
- [strong] **A calendar for choosing a date is a grid widget.** APG's date picker marks the `table` as a `grid`, so rows and cells take `row` and `gridcell` (APG date picker); React Aria gives its grid `role="grid"` and its cells `gridcell` (React Aria useCalendarCell); Fluent's cells are `gridcell` (Fluent CalendarGridDayCell).
- [moderate] **A calendar that is read, not chosen from, is a table.** APG suggests a static table "when content isn't interactive" ([APG grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)); FullCalendar's month is `role="table"` with `role="cell"` cells and the entries as lists (FullCalendar DayGridLayout; DayGridCell).

**How**
- [strong] **In a grid, one Tab stop and arrows between days.** APG's grid: "Only one of the focusable elements contained by the grid is included in the page tab sequence" (APG grid pattern). APG's date picker keys: arrows by day and week, Home and End to the week's ends, Page Up and Page Down by month, with Shift by year (APG date picker); React Aria handles the same keys (React Aria useCalendarGrid).
- [contested] **Disabled dates in focus order, or skipped.** Atlassian: "Disabled dates appear in the focus order, but can't be selected" ([Atlassian](https://atlassian.design/components/calendar/usage)). Fluent makes an out-of-range day focusable only when `allFocusable` is set (Fluent CalendarGridDayCell). The project decides.
- [strong] **Each day's name is the full date with its state.** React Aria: weekday, day, month and year, then "Today" and "selected" ([React Aria strings](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/intl/calendar/en-US.json)); Atlassian announces "the full date, including day, month, and year" (Atlassian); Fluent appends "marked" to a marked day (Fluent strings).
- [contested] **Day-name headers: read with their full name, or hidden.** APG's `th` has an `abbr` with "the full spelling of the name of the day" (APG date picker). React Aria hides the headers from screen readers, since each cell's name holds the weekday ([React Aria useCalendarGrid](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/calendar/useCalendarGrid.ts)). The project decides.
- [weak] **The date in an entry or cell is machine-readable.** HTML's `time` element carries a `datetime` value beside the text ([WHATWG, the time element](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-time-element)).

**Cases**
- A month of events built as a `grid` with every cell a Tab stop → a table, entries as links; or a grid with one Tab stop, not both.
- A screen reader hears "22" on a day → "Sunday, 22 November 2026, today".
- Page Down changes the month but focus stays on a cell now hidden → move focus to the same day in the new month, or the last day if it does not exist (APG).

**Accessibility**
- [required] 1.3.1 Info and Relationships (each day's weekday and month are programmatic), 2.1.1 Keyboard, 2.4.3 Focus Order, 2.4.7 Focus Visible, 4.1.2 Name, Role, Value (a day's selected and disabled states are exposed).

**Build**
- [strong] *Elements:* `table` with `th` day names and a cell per day; a picker adds `role="grid"` and a `button` per day; an event calendar keeps the native table (APG; FullCalendar).
- [strong] *ARIA and keyboard:* roving `tabindex` in a grid; `aria-selected` only on the selected date (APG date picker); `aria-current="date"` on today; `aria-disabled` on a day that cannot be chosen.
- [moderate] *States:* selected, today, disabled and outside the month as ARIA states or data attributes the stylesheet reads; React Aria exposes `data-disabled` and `data-unavailable` (React Aria calendar).
- [required] *Rules:* code-standard rule 9 (disabled is the control's own), code-standard rule 64 (`aria-current`), code-standard rule 2 (DOM order is reading order: weeks in rows, days in order), code-standard rule 66 (one focus ring).
- [weak] *Detail:* [code: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex), [code: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set), [code: tables for data](../../code/html-semantics.md#tables-for-data).

**Check**
- *Script:* could assert one Tab stop in a grid calendar, arrow keys moving focus by day and week, Page Down changing the heading, every day cell named with weekday and year, and at most one `aria-selected`.
- *Judgement:* Does the reader choose a date here, or read what is on it?

**Sources:** APG, React Aria, Fluent, Atlassian, FullCalendar and WHATWG as linked. They split on whether disabled dates take focus.
