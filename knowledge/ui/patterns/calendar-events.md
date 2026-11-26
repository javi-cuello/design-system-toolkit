# Calendar events: adding, editing and days off

How a person adds, opens, edits, moves and deletes entries on a calendar, repeats them or books them over a range, and marks a day as unavailable. An entry is an event, a booking or a logged block of time. Views, the day cell and moving between periods are [`calendars.md`](calendars.md); this page starts where a person acts on a day or an entry. The surfaces it opens are [`dialogs.md`](dialogs.md), [`../components/popover.md`](../components/popover.md) and [`../components/modal-dialog.md`](../components/modal-dialog.md). The form inside them is [`forms.md`](forms.md), and its date and time fields are [selection: *Date and time entry*](selection.md#date-and-time-entry). Delete and undo build on [actions: *Destructive actions*](actions.md#destructive-actions) and [interaction: *Undo or confirmation*](../design/interaction.md#undo-or-confirmation). Dragging builds on [interaction: *Gestures and drag*](../design/interaction.md#gestures-and-drag).

## Creating an entry

**Use when / don't use**
- [strong] Offer two ways in: a click on an empty slot or day, and a Create or New button. Google Calendar: "click Create" or "click an empty time slot on your calendar grid" ([create an event](https://support.google.com/calendar/answer/72143)); Apple Calendar double-clicks a time or a day ([add events](https://support.apple.com/guide/calendar/icalwr13-events)); Basecamp's schedule has "New event" ([calendar](https://5.basecamp-help.com/article/1120-calendar)).
- [strong] Time trackers with a calendar view create from a click on an open slot. Toggl: "click anywhere on the calendar and a popup will appear" ([calendar view](https://support.toggl.com/tracking-time-in-the-calendar-view)); Clockify: "Click on any open time slot on the calendar" ([creating a time entry](https://clockify.me/help/time-tracking/creating-a-time-entry)).
- [moderate] Keep a route that needs no slot. Google pairs its Create button with a `c` key for "Create a new event" ([keyboard shortcuts](https://support.google.com/calendar/answer/37034)); Kendo opens an event's form with Enter on a focused item ([Kendo scheduler editing](https://www.telerik.com/kendo-angular-ui/components/scheduler/editing.md)).

**How**

| Entry | Surface | Who ships it |
|---|---|---|
| Click on an empty slot | Small popover: title, then Save | Google's "pop-up box"; Kendo's slot popover |
| Double-click a slot, or "More options" | Full editor | Kendo's "full editor"; Apple's event window |
| Create button | Full editor or dialog | Google's Create, then details |
| Drag across a time range | Popover with start and end filled | Toggl, Apple |

- [moderate] **Two tiers.** A click on a slot opens a quick popover with few fields; a fuller editor is one step further. Google: "enter a title in the pop-up box, and then click Save" ([create an event](https://support.google.com/calendar/answer/72143)). Kendo: "A single click on the slot opens a popover instead of the full edit dialog" ([Kendo scheduler editing](https://www.telerik.com/kendo-angular-ui/components/scheduler/editing.md)).
- [weak] **The popover stays small.** Apple: a popover is for "a few related tasks", and its example is "a calendar event popover" for changing the date or time ([Apple popovers](https://developer.apple.com/design/human-interface-guidelines/popovers)).
- [moderate] **Narrow screens get a sheet or a full-screen dialog,** not a popover. Apple: "Avoid displaying popovers in compact views" ([Apple popovers](https://developer.apple.com/design/human-interface-guidelines/popovers)); Primer makes any dialog with inputs full-screen on narrow screens ([dialogs](dialogs.md#choosing-the-surface)).
- [strong] **A long form is a page.** The choice between popover, dialog and page follows [dialogs: *Choosing the surface*](dialogs.md#choosing-the-surface) and [*A modal or a page of its own*](dialogs.md#a-modal-or-a-page-of-its-own).
- [moderate] **Drag to create a range.** Toggl: "click and drag on the screen to create a larger time entry, and we will pre-populate the start and end times" ([calendar view](https://support.toggl.com/tracking-time-in-the-calendar-view)); Apple: "Drag from the event's start time to its end time" ([add events](https://support.apple.com/guide/calendar/icalwr13-events)).

**Cases**
- A person clicks Tuesday 10:00 → a popover anchored to the slot asks for a title; Save adds it; "More options" opens the full form.
- A day-only calendar with a project, a note and a status per day → a click on the day opens a dialog; three fields fit one step.
- A create form with recurrence, guests and attachments → the Create button opens a page; the slot popover still takes a quick title.
- A phone-width calendar → the slot opens a full-screen dialog, not a popover that covers the grid.

**Accessibility**
- [required] 2.1.1 Keyboard: every slot that creates on click is reachable and operable by key, or the Create button covers the same job.
- [required] 3.2.1 On Focus: focusing a slot opens nothing; creating starts on activation ([dialogs](dialogs.md#choosing-the-surface)).
- [required] 2.4.3 Focus Order: the popover or dialog takes focus on open and gives it back on close ([modal dialog: focus](../components/modal-dialog.md#focus-in-trapped-returned)).

**Build**
- [required] The Create control is a `button`, or a link to the new-entry page with the date in the address (`<a href="/entries/new?date=2026-11-23">`), so it works without script (code-standard rule 20).
- [required] A slot that creates is a `button` named for its date and time ("Add entry, Tuesday 23 November"), not a click handler on a `div` ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- [required] The quick form is a `popover` opened by `popovertarget`; the full form a `dialog` with `showModal()` or a page ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- [required] Modified clicks on a link to the new-entry page go to the browser (code-standard rule 21).

**Check**
- *Script* could: assert every slot is a `button` or `a` with a name holding its date; assert a Create button exists outside the grid; Tab to a slot and press Enter, and assert a form opened with focus in it.
- *Judgement*: can a keyboard user add an entry for next Thursday without a pointer?

**Sources.** Google, Apple, Basecamp, Toggl, Clockify and Kendo agree on slot click plus a button. Google and Kendo state the two tiers. Zoom's desktop calendar is reported to open a quick popup on one click and the full scheduler on two, but only on a third-party help page, so it is not counted.

## The create form: first field and defaults

**Use when / don't use**
- [strong] Ask for the name or description first; everything else can wait. Google's slot popover asks for a title ([create an event](https://support.google.com/calendar/answer/72143)); Apple's Month view asks for "a name and duration in the title field" ([add events](https://support.apple.com/guide/calendar/icalwr13-events)); Clockify: "Enter the task description and select a Project" ([creating a time entry](https://clockify.me/help/time-tracking/creating-a-time-entry)).
- [strong] Time trackers ask for the project beside the description. Toggl's popup holds description, project, task and tags ([calendar view](https://support.toggl.com/tracking-time-in-the-calendar-view)); Clockify's "Add time entry" window holds description and project ([calendar view](https://clockify.me/help/time-tracking/calendar-view)); Bonsai's form asks "Project", "Task", "Hours" and "Description" ([add tracked time](https://intercom.help/bonsai/en/articles/3438791-how-can-i-manually-add-tracked-time)).

**How**
- [moderate] **The clicked slot is the default.** The date and time come from where the person clicked or dragged. Toggl fills start and end "based on" the drag ([calendar view](https://support.toggl.com/tracking-time-in-the-calendar-view)); Apple creates on the day or time double-clicked ([add events](https://support.apple.com/guide/calendar/icalwr13-events)).
- [moderate] **Context supplies the project.** Bonsai's form opened from a project asks only "Task", "Hours" and "Description" ([add tracked time](https://intercom.help/bonsai/en/articles/3438791-how-can-i-manually-add-tracked-time)). Basecamp's global calendar asks whether the event goes to a project or the account calendar ([calendar](https://5.basecamp-help.com/article/1120-calendar)).
- [strong] **All day is a checkbox,** not a time of 00:00 to 23:59. Google: "check the box next to All day" ([create an event](https://support.google.com/calendar/answer/72143)); Apple has an "all-day" section ([add events](https://support.apple.com/guide/calendar/icalwr13-events)); Basecamp: "make it an all-day event" ([calendar](https://5.basecamp-help.com/article/1120-calendar)).
- [weak] **A default duration is a setting.** Google lets users "configure default event durations and meeting buffers per calendar" ([Workspace updates, 16 Nov 2026](https://workspaceupdates.googleblog.com/2026/11/schedule-meetings-with-default-buffer-google-calendar.html)).
- [required] The fields follow [forms](forms.md#form-structure); date and time fields follow [selection: *Date and time entry*](selection.md#date-and-time-entry) and [*Time entry*](selection.md#time-entry).

**Cases**
- A click on Wednesday opens the form with Wednesday filled → the person types a title and saves; nothing else to set.
- A form opened from a project's own calendar asks "Which project?" → drop the field; the context answers it.
- An all-day booking stored as 00:00–23:59 → it shows as a timed block and spills across midnight in other time zones; use the all-day flag.

**Accessibility**
- [required] 3.3.2 Labels or Instructions: each field has a visible label; a prefilled date is a field value, never placeholder text ([forms: *Labels*](forms.md#labels)).
- [required] 2.4.3: focus lands on the first empty field, the title, when the form opens ([APG modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): "Generally, focus is initially set on the first focusable element").

**Build**
- [required] The clicked date travels as a value: `<input type="date" name="date" value="2026-11-23">` filled by the server from the address, so the no-script page gets it too (code-standard rule 20; [HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [required] All day is `<input type="checkbox" name="allDay">`; checking it hides the time fields with `hidden`, never removes them (code-standard rule 17).
- [moderate] Focus lands on the title field on open: APG moves focus into the dialog, by default to its first focusable element ([APG modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)), and `showModal()` sends it to the element marked `autofocus` ([HTML dialog focusing steps](https://html.spec.whatwg.org/multipage/interactive-elements.html#dialog-focusing-steps)).

**Check**
- *Script* could: open the form from a slot and assert the date field's value equals the slot's date; assert focus is in the title field.
- *Judgement*: is any field asked that the clicked slot or the page already answers?

**Sources.** Google, Apple, Toggl, Clockify, Bonsai and Basecamp agree on name first and the slot as the default date. None of the help pages checked says the form remembers the last-used project; that default is left out.

## Opening and editing an entry

**Use when / don't use**
- [strong] A click on an entry opens it. Google: "select the event, and choose Edit" ([edit an event](https://support.google.com/calendar/answer/37115)); Apple: "Double-click or force click the event to open it" ([add events](https://support.apple.com/guide/calendar/icalwr13-events)); Clockify: "click on the block to open the full view of the time entry" ([calendar view](https://clockify.me/help/time-tracking/calendar-view)).
- [moderate] Keep the calendar in view while a short edit happens. Apple's calendar event popover "disappears after the change, letting people continue reviewing the events on their calendar" ([Apple popovers](https://developer.apple.com/design/human-interface-guidelines/popovers)).

**How**
- [contested] **Details first, or straight to edit.** Google opens the event, then the person chooses Edit ([edit an event](https://support.google.com/calendar/answer/37115)); Kendo opens an overview popover with title, date, time and description, and edits from there ([Kendo scheduler editing](https://www.telerik.com/kendo-angular-ui/components/scheduler/editing.md)). Toggl opens an editable popup: "You can click on any field in the popup to edit it" ([calendar view](https://support.toggl.com/tracking-time-in-the-calendar-view)); Apple opens the event window to change it ([add events](https://support.apple.com/guide/calendar/icalwr13-events)). The project picks one.
- [moderate] **The edit form is the create form,** filled. Toggl and Clockify open the same popup fields for an existing entry as for a new one ([Toggl](https://support.toggl.com/tracking-time-in-the-calendar-view); [Clockify](https://clockify.me/help/time-tracking/calendar-view)).
- [moderate] **A repeating entry asks which ones change.** Google offers "This event", "This and following events" and "All events" on save ([edit an event](https://support.google.com/calendar/answer/37115)); Kendo prompts for the mode when none is given ([Kendo scheduler editing](https://www.telerik.com/kendo-angular-ui/components/scheduler/editing.md)).
- [moderate] **Keys for the open entry.** Google: `e` for "See an event's details", Ctrl or Cmd + `s` to save, Esc to "Return to calendar grid" ([keyboard shortcuts](https://support.google.com/calendar/answer/37034)); Kendo: focus an event and press Enter to open it ([Kendo scheduler editing](https://www.telerik.com/kendo-angular-ui/components/scheduler/editing.md)).
- [weak] **A nonmodal popover saves when it closes by itself.** Apple: "Always save work when automatically closing a nonmodal popover"; discard only on "an explicit Cancel button" ([Apple popovers](https://developer.apple.com/design/human-interface-guidelines/popovers)). In a modal dialog, X and Cancel discard ([actions: *Cancel, close and back*](actions.md#cancel-close-and-back)).

**Cases**
- A person clicks a booked day to read the note → a details view first avoids an accidental edit; an Edit button opens the form.
- A tracker where entries are changed many times a day → the popup is the editor; a details step costs a click each time.
- Changing next Monday's instance of a weekly entry → ask "This entry / This and following / All".

**Accessibility**
- [required] 4.1.2 Name, Role, Value: an entry chip is a `button` or link whose name carries title, date and time, not only the visible truncated title.
- [required] 2.1.1: an entry opens on Enter as well as click.
- [required] 2.4.3: closing the details or the editor returns focus to the entry ([modal dialog: focus](../components/modal-dialog.md#focus-in-trapped-returned)).

**Build**
- [required] An entry is a `button` that opens a `popover` or `dialog`, or an `<a href>` to the entry's page; never a `div` with a click handler ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- [required] Its accessible name is the full entry ("Design review, Tuesday 23 November, all day"); a truncated label keeps the full text for the name ([accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).
- [required] The edit form posts to the server, so it saves without script (code-standard rule 20).
- [strong] The edit `dialog` listens on `cancel` and asks before discarding typed changes ([modal dialog: *Escape, backdrop click and one at a time*](../components/modal-dialog.md#escape-backdrop-click-and-one-at-a-time)).

**Check**
- *Script* could: assert each entry chip is a `button` or `a` whose name includes its date; open one with Enter, close it with Escape, and assert focus is back on the chip.
- *Judgement*: how often are entries changed, and does a details step help or slow that?

**Sources.** Google and Kendo put details before edit; Toggl, Clockify and Apple open the editor directly. The split is the contested item; no source says which suits which product.

## Deleting an entry

**Use when / don't use**
- [strong] A deleted entry can be got back. Google keeps it in the calendar's trash "for 30 days" ([delete an event](https://support.google.com/calendar/answer/37113)) and has `z` for "Undo" ([keyboard shortcuts](https://support.google.com/calendar/answer/37034)); Toggl: "an 'undo' option will temporarily appear" ([undelete](https://support.toggl.com/can-i-undelete-time-entries-and-other-data)); Clockify: "you have 20 seconds to undo this action" ([editing time entries](https://clockify.me/help/time-tracking/editing-time-entries)).
- [strong] Prefer undo to a confirmation for a routine delete. NN/g: "if you cry wolf too many times, people will stop paying attention", and avoid confirmations for "routine actions" ([confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/)); Toggl and Clockify, above, delete first and offer undo ([interaction: *Undo or confirmation*](../design/interaction.md#undo-or-confirmation)).

**How**
- [contested] **Confirm a single delete, or not.** Clockify asks: "Click Delete again to confirm", and then offers undo ([editing time entries](https://clockify.me/help/time-tracking/editing-time-entries)); Kendo's sample opens a remove-confirmation dialog ([Kendo scheduler editing](https://www.telerik.com/kendo-angular-ui/components/scheduler/editing.md)). Google's and Apple's help list no confirmation step: "click Delete event"; "Select the event, then press the Delete key" ([Google](https://support.google.com/calendar/answer/37113); [Apple](https://support.apple.com/guide/calendar/icalwr13-events)). The project picks one; undo is offered either way.
- [moderate] **Delete from the opened entry and by key.** Google: click the event, then "Delete event", or right-click and "Delete"; Backspace or Delete ([delete an event](https://support.google.com/calendar/answer/37113); [keyboard shortcuts](https://support.google.com/calendar/answer/37034)). Toggl puts Delete in the popup's three-dot menu ([calendar view](https://support.toggl.com/tracking-time-in-the-calendar-view)).
- [moderate] **A repeating entry asks which ones go,** and says when that cannot be undone. Google: deleting "This and following events" means "the deleted events are not moved to the trash and can't be restored" ([delete an event](https://support.google.com/calendar/answer/37113)); Kendo prompts when no mode is set ([Kendo scheduler editing](https://www.telerik.com/kendo-angular-ui/components/scheduler/editing.md)). Apple's Mac calendar offers "Delete Only This Event", "Delete All Future Events" and "Delete All" ([Apple Calendar repeating events](https://support.apple.com/guide/calendar/set-up-all-day-multiday-or-repeating-events-icl1018/mac)).
- [required] Confirm what cannot be undone; the dialog is [confirmation dialogs](../components/modal-dialog.md#confirmation-dialogs) and its styling [actions: *Destructive actions*](actions.md#destructive-actions).

**Cases**
- Deleting one logged day → it goes at once; "Entry deleted. Undo" appears.
- Deleting every future instance of a weekly booking with no trash → a confirmation naming the count and that it cannot be undone.
- An undo toast that vanishes in four seconds → the person reading the calendar misses it; keep it until dismissed or for a stated time (Clockify states 20 seconds).

**Accessibility**
- [required] 3.3.4 Error Prevention: deleting data is reversible, checked or confirmed; undo meets "reversible" ([actions: *Destructive actions*](actions.md#destructive-actions)).
- [required] 4.1.3 Status Messages: "Entry deleted" with its Undo is announced without moving focus.
- [required] 2.4.3: focus after the entry disappears goes to the day it was on, not the page top (code-standard rule 14).

**Build**
- [required] Delete is a `form method="post"` with a `button`, so it works without script; the server soft-deletes so Undo can restore (code-standard rule 20; [interaction: *Undo or confirmation*](../design/interaction.md#undo-or-confirmation)).
- [required] "Entry deleted" and the Undo `button` are written into a `role="status"` region present from load ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- [required] After the delete, focus moves to the entry's day cell; after Undo, back to the restored entry (code-standard rule 14; [accessibility: *Focus management*](../../code/accessibility.md#focus-management)).

**Check**
- *Script* could: delete an entry and assert a status region announced it with an Undo control; press Undo and assert the entry is back; assert focus never lands on `body`.
- *Judgement*: is a confirmation here protecting something undo would not?

**Sources.** Google, Toggl and Clockify all keep a way back; NN/g and Apple favour undo over routine confirmation. Clockify and Kendo still confirm a single delete, hence the contested item.

## Days off and unavailable days

**Use when / don't use**
- [strong] Record an absence as its own kind of entry, not as an empty day. Google has "Out of office" beside events in the Create menu ([out of office](https://support.google.com/calendar/answer/7638168?co=GENIE.Platform%3DDesktop)); Outlook sets an all-day event's Show As to "Out of office" ([time away](https://support.microsoft.com/office/add-your-out-of-office-event-to-the-outlook-calendar-of-others-69fe38aa-7b5f-4225-8b69-47f47092e65e)); Basecamp has "Set Out of Office" with start and end dates ([37signals](https://updates.37signals.com/post/new-in-basecamp-admin-pro-pack-updates)).
- [moderate] An empty day and an unavailable day mean different things. Calendly separates available hours from dates marked unavailable: "Use date-specific hours to change your availability on certain days" ([set your availability](https://calendly.com/help/how-to-set-your-availability)); a holiday switched "On" marks you unavailable ([holidays](https://calendly.com/help/how-to-edit-holidays-within-calendly)).

**How**
- [strong] **A range in one go.** Google: "Select your out-of-office dates" ([out of office](https://support.google.com/calendar/answer/7638168?co=GENIE.Platform%3DDesktop)); Basecamp: "pick the start and end dates" ([37signals](https://updates.37signals.com/post/new-in-basecamp-admin-pro-pack-updates)); Calendly selects a date, or drags across several, in its calendar view ([set your availability](https://calendly.com/help/how-to-set-your-availability)).
- [moderate] **Whole days by default, part days allowed.** Google's out-of-office is all day unless the person deselects "All day", and "must last the entire day or extend past your regular working hours" for Gmail's status ([out of office](https://support.google.com/calendar/answer/7638168)); Outlook's is an all-day event ([time away](https://support.microsoft.com/office/add-your-out-of-office-event-to-the-outlook-calendar-of-others-69fe38aa-7b5f-4225-8b69-47f47092e65e)).
- [moderate] **Weekly patterns apart from one-off days.** Google's working hours "can only be set as a recurring weekly schedule" ([out of office](https://support.google.com/calendar/answer/7638168)); Calendly keeps "Weekly hours" apart from date-specific hours, and removes a weekday to be "unavailable each week" ([set your availability](https://calendly.com/help/how-to-set-your-availability)).
- [moderate] **An absence acts on bookings.** Google's calendar "declines all meetings when you're not available" ([out of office](https://support.google.com/calendar/answer/7638168?co=GENIE.Platform%3DDesktop)); Calendly blocks booking on an active holiday, and "Date-specific hours can't override an active holiday" ([holidays](https://calendly.com/help/how-to-edit-holidays-within-calendly)).
- [contested] **Time off added over an existing booking.** Float takes the day out and restores it if the time off is deleted ([Float time off](https://support.float.com/en/articles/440604-schedule-time-off)), but a team holiday means "any allocations already scheduled on these dates will be removed" ([Float holidays](https://support.float.com/en/articles/3281892-public-and-team-holidays)); Productive's resolver splits the booking, "with the time-off booking occupying the gap" ([Productive time-off conflicts](https://help.productive.io/en/articles/6065526-resolve-time-off-booking-conflicts)). The project decides.
- [weak] **A one-off day can override a weekly pattern.** In Calendly's calendar view a date is edited alone ("Edit date") or with its weekday ("Edit all [day of the week]") ([set your availability](https://calendly.com/help/how-to-set-your-availability)).

**Cases**
- A two-week holiday → one out-of-office entry from the first to the last day, not ten single days.
- Fridays never worked → a weekly unavailable day in the settings, not an entry per Friday.
- An empty Thursday in last month → unrecorded, not a day off; only an entry says it was a day off.
- A day off with a booking already on it → Google declines the meeting; a range booking is cut, split or removed, which is contested (above).

**Accessibility**
- [required] 1.4.1 Use of Color: a day off is told by text or an icon with a name ("Out of office"), never by a grey fill alone.
- [required] 1.3.1 Info and Relationships: the day cell's name includes its state ("Friday 27 November, out of office").

**Build**
- [strong] An absence is an entry with a kind (`kind="out-of-office"`), stored like any other and shown with a text label, not a missing row (Google, Outlook and Basecamp, above); its form posts without script (code-standard rule 20).
- [required] The state is an attribute on the day cell (`data-state="off"`), styled like any state ([css architecture: *Interaction states*](../../code/css-architecture.md#interaction-states)), plus text in the cell's name ([accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).
- [required] The date range is two `input type="date"` fields, start and end, in a `fieldset` with a `legend` ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).

**Check**
- *Script* could: assert every off day carries a text label in its accessible name; assert no day's state is carried by background colour alone.
- *Judgement*: can someone reading last month tell a day off from a day nobody recorded?

**Sources.** Google, Outlook, Basecamp and Calendly all model unavailability apart from an empty day. Calendly models it as missing availability hours, the others as an entry; Bonsai's help pages checked mention no day-off feature.

## Repeating entries and booked ranges

Two ways to put the same work on many days: an entry with a repeat rule, as calendars store it, or a booking over a date range, as resourcing tools store it. Deleting a repeating entry is [*Deleting an entry*](#deleting-an-entry); days off, and time off over a booking, are [*Days off and unavailable days*](#days-off-and-unavailable-days); how a booking becomes logged time is [timesheets: *Planned and logged time*](timesheets.md#planned-and-logged-time).

**Use when / don't use**
- [strong] **Calendars repeat an entry by a rule: a pattern and a range.** RFC 5545's RRULE takes an INTERVAL, BYDAY ("a COMMA-separated list of days of the week"), and UNTIL or COUNT, which "MUST NOT occur in the same 'recur'" ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.txt)); Google's `recurrence[]` is a "List of RRULE, EXRULE, RDATE and EXDATE lines for a recurring event, as specified in RFC5545" ([Google Calendar API events](https://developers.google.com/workspace/calendar/api/v3/reference/events)); Microsoft Graph splits a recurrence into a pattern, with `daysOfWeek` and `interval`, and a range: "endDate , noEnd , numbered" ([Graph recurrencePattern](https://learn.microsoft.com/en-us/graph/api/resources/recurrencepattern?view=graph-rest-1.0); [Graph recurrenceRange](https://learn.microsoft.com/en-us/graph/api/resources/recurrencerange?view=graph-rest-1.0)); Apple's Mac calendar sets a custom "Frequency" and an "End Repeat" ([Apple Calendar repeating events](https://support.apple.com/guide/calendar/set-up-all-day-multiday-or-repeating-events-icl1018/mac)). Google's model copies RFC 5545 and counts with it.
- [strong] **Resourcing tools book a range, filled by the person's working days.** Float: "The standard allocation unit at Float is hours per day" ([Float allocate time](https://support.float.com/en/articles/4188692-allocate-time)); Harvest Forecast: "Assignments are a period of time measured in hours per day, hours per week, or hours per month" ([Forecast adding assignments](https://support.getharvest.com/hc/en-us/articles/40045426702349)); Productive's booking takes a "Date range" with "Hours per day , Percentage , and Total" ([Productive booking details](https://help.productive.io/en/articles/9036702-booking-details-explained)); Resource Guru offers "Hours Per Day/Total Hours/Specific Time" ([Resource Guru bookings](https://help.resourceguruapp.com/en/articles/1955394)); Clockify: "Total hours are calculated based on working days and assigned hours" ([Clockify assignments](https://clockify.me/help/projects/manage-scheduled-team-assignments)).
- [strong] **A range booking can repeat too, from a short list.** Float has "nine different repeat settings" from "Weekly" ([Float repeat](https://support.float.com/en/articles/5260455-repeat-an-allocation-a-time-off-or-a-status)); Forecast: "check the box to Repeat weekly and select the number of weeks it should repeat" (Forecast adding assignments); Productive repeats "weekly or monthly for a defined number of occurrences" (Productive booking details); Resource Guru: "Weekly , Every 2 weeks , Monthly or Annually , or you can set a custom repeating pattern" (Resource Guru bookings).

**How**
- [moderate] **The repeat form: every N units, which weekdays, and an end.** Google's task form: "Under “Repeats every,” select day , week , month , or year", ending "Never", "On" a date, or "After" a number of occurrences ([Google repeating tasks](https://support.google.com/calendar/answer/12132599?hl=en)); Toggl Plan: "repeat this task every X days, weeks, months, years", to "go on forever, end on a specific date or after a set number of occurrences" ([Toggl Plan recurring tasks](https://support.plan.toggl.com/article/171-recurring-tasks)). Google's help does not list the fields of its event dialog; the API's three range types are the same three ends (above).
- [strong] **An edit asks which occurrences: this one, this and following, or all.** Google: "This event", "This and following events", "All events" ([Google repeating events](https://support.google.com/calendar/answer/37115?hl=en)); Clockify's API: `THIS_ONE`, `THIS_AND_FOLLOWING`, `ALL` ([Clockify API](https://docs.clockify.me/)); Resource Guru: "This event only , This and following events or All events" (Resource Guru bookings); Float: "This allocation This and all future allocations" (Float repeat); Forecast: "Just this one or This and all future" ([Forecast editing](https://support.getharvest.com/hc/en-us/articles/40045481696653)).
- [moderate] **"This and following" leaves the past alone.** Google: "Any events from the past won't be updated", and the choice "appears only when editing the second occurrence of an event or any occurrence after it" (Google repeating events); Forecast's "This and all future" makes "a new series" (Forecast editing); RFC 5545 describes truncating the rule with UNTIL or COUNT and creating "two new unbounded recurring calendar components for the future instances" (RFC 5545).
- [contested] **One edited occurrence: detached, or kept as a linked exception.** Resourcing tools detach it. Forecast: "Editing Just this one will remove the assignment from the existing series" (Forecast editing); Toggl Plan: "The task you've edited becomes a regular task" (Toggl Plan recurring tasks). Calendars keep it linked: Google's instance carries `recurringEventId` and an `originalStartTime` that identifies it "even if the instance was moved" ([Google recurring events guide](https://developers.google.com/workspace/calendar/api/guides/recurringevents)); RFC 5545's RECURRENCE-ID holds "the original value of the "DTSTART" property of the recurrence instance" (RFC 5545). The project decides.
- [strong] **A range splits in two.** Forecast: "Splitting allows you to cut one-time assignments into two" (Forecast editing); Productive: "Split : divides the booking into two" (Productive booking details); Resource Guru: "choose Split booking" (Resource Guru bookings); Clockify: "Click on the timeline to split" (Clockify assignments).
- [contested] **A changed range and the days already past.** Resource Guru asks: "Apply to future dates only keeps allocated hours up to and including today unchanged", or "Apply to the entire date range recalculates the whole booking, including past dates" ([Resource Guru total hours](https://help.resourceguruapp.com/en/articles/10258882)); Google's "All events" updates "past and future occurrences" (Google repeating events); Harvest's recurring time entries keep "entries in an approved or invoiced period" ([Harvest day view](https://support.getharvest.com/hc/en-us/articles/360048181892)). The project decides.
- [strong] **Non-working days are skipped and not counted.** Resource Guru: a booking "will automatically skip the time off just like it does with other non-working days, such as the weekend" (Resource Guru bookings); Productive: over a holiday "the hours won’t be counted" ([Productive holiday calendars](https://help.productive.io/en/articles/2179650-managing-holiday-calendars)); Float: "Public holiday days are automatically blocked out" ([Float holidays](https://support.float.com/en/articles/3281892-public-and-team-holidays)); Clockify's `includeNonWorkingDays` is "Default: false" (Clockify API).
- [weak] **Booking a non-working day is confirmed and counted as overtime.** Float: "you need to confirm the action with a Yes", and "All scheduled time is counted as overtime" ([Float weekends and holidays](https://support.float.com/en/articles/28906-work-on-weekends-and-public-holidays)). Forecast instead makes a weekend a work day for the person: "Click the Saturday and Sunday squares" ([Forecast weekends](https://support.getharvest.com/hc/en-us/articles/40048440122125)).


**Cases**
- A project booked Monday to Thursday from 1 March to 30 June → a range booking over the person's working days, or a weekly rule on four weekdays with an end date; the resourcing tools above take the first, calendars the second.
- One day of a booked range moves → the calendar keeps an exception linked to the series; Forecast and Toggl Plan detach it (above).
- The end date moves earlier after some days were logged → the logged entries stay; whether the past booked days change is the project's call (above).
- A public holiday falls inside a range → the day is skipped and not counted (above).

**Accessibility**
- [required] 1.3.1 and 4.1.2: weekday choices are a labelled group of checkboxes or toggle buttons with their state exposed: APG's toggle button is "A two-state button that can be either off (not pressed) or on (pressed)", `aria-pressed`, and a checkbox group takes "role group that has the property aria-labelledby" ([APG button](https://www.w3.org/WAI/ARIA/apg/patterns/button/); [APG checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)).
- [required] 2.1.1: each weekday choice is operable by keyboard.
- [strong] Space changes its state (APG button; APG checkbox).
- [required] 1.3.1: where an occurrence is marked as repeating, the mark is in its accessible name, as its status is ([*Entry status and conflicts*](#entry-status-and-conflicts)).

**Build**
- [moderate] Weekdays are native checkboxes in a `fieldset` with a `legend` ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)); the end is a radio group, never, on a date, after N (the three ends, above).
- [required] Where entries sync as iCalendar, the rule maps to RRULE, with UNTIL or COUNT but not both ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545.txt)).
- [moderate] **A calendar's rule is stored once and expanded on read.** RFC 5545 builds the set from RRULE and RDATE, "excluding any start DATE-TIME values specified by "EXDATE" properties" (RFC 5545); Google returns instances only when `singleEvents` is true, "The default is False" ([Google events.list](https://developers.google.com/workspace/calendar/api/v3/reference/events/list)); Graph's recurrence rule "allows recurring events to "expand" into individual occurrences" ([Graph recurring events](https://learn.microsoft.com/en-us/graph/outlook-schedule-recurring-events)).
- [moderate] **A changed or removed day is stored as an exception to the rule.** Google: "To modify a single instance (creating an exception)", and warns against editing instances one by one, which "creates lots of exceptions that clutter the calendar" (Google recurring events guide); Graph's event `type` is "singleInstance , occurrence , exception , seriesMaster" ([Graph event](https://learn.microsoft.com/en-us/graph/api/resources/event?view=graph-rest-1.0)).
- [weak] **A recurrence is capped.** The two cap different things, events and tasks, so they are not counted as one claim. Google: "a limit of 730 occurrences" (Google repeating events); Teamwork's repeating tasks with no end run for a "maximum of 1 year" ([Teamwork repeating tasks](https://support.teamwork.com/projects/project-sections/working-with-repeating-tasks)).

**Check**
- *Script* could: assert the weekday controls are in a `fieldset` with a `legend`, each with a checked state; edit one occurrence and assert the others are unchanged.
- *Judgement*: does the edit-scope question say plainly what changes and what stays?

**Sources.** RFC 5545, Google help and API, Microsoft Graph, Apple Calendar, Float, Harvest Forecast and Harvest, Productive, Resource Guru, Clockify, Teamwork and Toggl Plan, each page fetched raw and its quotes matched. Not found: the fields of Google's event Custom dialog (only its tasks page lists them), Outlook's end-user help (the page moved), a Float split article, Teamwork's range allocations, and any vendor's keyboard notes for weekday toggles.

## Moving and resizing by drag

**Use when / don't use**
- [strong] Drag an entry to move it and drag its edge to change its length. Apple: "drag the event to another day or time" and "drag the top or bottom edge" ([add events](https://support.apple.com/guide/calendar/icalwr13-events)); Clockify: "Drag the start/end time edges" and "Drag and drop the whole time block" ([calendar view](https://clockify.me/help/time-tracking/calendar-view)); Toggl: "drag the top and bottom of the entry" ([calendar view](https://support.toggl.com/tracking-time-in-the-calendar-view)).
- [required] Never drag alone. WCAG 2.5.7: "All functionality that uses a dragging movement for operation can be achieved by a single pointer without dragging" ([Understanding 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)).

**How**
- [strong] **The entry's form is the single-pointer path.** Its date, start and end fields move and resize it. Toggl's popup has "Start and End Time"; Clockify's window has "Date" and "Start/End Time" ([Toggl](https://support.toggl.com/tracking-time-in-the-calendar-view); [Clockify](https://clockify.me/help/time-tracking/calendar-view)); Apple's event popover lets people "change the date or time of an event" ([Apple popovers](https://developer.apple.com/design/human-interface-guidelines/popovers)).
- [weak] **Drags snap to a step.** Toggl's drag changes length "in 10 minute increments" at the highest zoom ([calendar view](https://support.toggl.com/tracking-time-in-the-calendar-view)).
- [strong] The lifted state, the drop mark and Escape to cancel follow [interaction: *Gestures and drag*](../design/interaction.md#gestures-and-drag).

**Cases**
- A booked day moved from Monday to Wednesday by drag → also possible by opening it and changing the date.
- Resizing a two-day booking to three → drag the end edge, or change the end date in the form.
- A drag that lands on a day off → the drop is allowed or refused by the same rule the form applies.

**Accessibility**
- [required] 2.5.7 Dragging Movements (AA) and 2.1.1 Keyboard (A): moving and resizing work by click and by key.
- [required] 2.5.2 Pointer Cancellation: the move commits on release; Escape or a drop outside a day puts it back.
- [required] 4.1.3: the new date is announced ("Moved to Wednesday 25 November").

**Build**
- [required] The form fields are built first; the drag is an enhancement that calls the same save (code-standard rules 20 and 36).
- [strong] Pointer events with `setPointerCapture()`, commit on `pointerup`, restore on `pointercancel` or Escape; states as `[data-dragging]` and `[data-drop-target]` ([javascript: *Dragging and its single-pointer alternative*](../../code/javascript.md#dragging-and-its-single-pointer-alternative)).
- [required] The new position goes into a `role="status"` region, and focus stays on the moved entry (code-standard rule 14).

**Check**
- *Script* could: flag a draggable entry with no date or time field reachable from it; move an entry by keyboard and assert the status text changed.
- *Judgement*: can every drag on the calendar be done through the entry's form?

**Sources.** Apple, Clockify and Toggl document drag to move and resize; WCAG 2.5.7 requires the alternative. None of their help pages names a keyboard move; the form is the path they share.

## Entry status and conflicts

**Use when / don't use**
- [strong] Mark how firm an entry is, apart from what it is. iCalendar's `STATUS` for an event is "TENTATIVE", "CONFIRMED" or "CANCELLED" ([RFC 5545 §3.8.1.11](https://www.rfc-editor.org/rfc/rfc5545#section-3.8.1.11)); Calendly reads an Outlook event marked "Tentative" apart from "Busy" ([busy vs free](https://calendly.com/help/how-to-manage-busy-vs-free-calendar-settings)); Google guests answer "Yes, No, or Maybe" ([add guests](https://support.google.com/calendar/answer/37161)).
- [strong] Whether an entry blocks time is a separate flag. iCalendar's `TRANSP`: events that consume time "SHOULD be recorded as OPAQUE", others "TRANSPARENT" ([RFC 5545 §3.8.2.7](https://www.rfc-editor.org/rfc/rfc5545#section-3.8.2.7)); Calendly "marks you as unavailable for events marked as Busy" ([busy vs free](https://calendly.com/help/how-to-manage-busy-vs-free-calendar-settings)); Outlook sends time away "with Show As set to Free" so it "does not block out any work time" ([time away](https://support.microsoft.com/office/add-your-out-of-office-event-to-the-outlook-calendar-of-others-69fe38aa-7b5f-4225-8b69-47f47092e65e)).

**How**
- [moderate] **Tentative still counts as taken by default.** Calendly: "By default, Calendly marks Outlook calendars as unavailable for events marked as Busy, Tentative", and the setting can change ([busy vs free](https://calendly.com/help/how-to-manage-busy-vs-free-calendar-settings)); iCalendar's default `TRANSP` is OPAQUE ([RFC 5545 §3.8.2.7](https://www.rfc-editor.org/rfc/rfc5545#section-3.8.2.7)).
- [weak] **Overlaps are shown side by side.** Clockify draws them as "blocks of time that are layered next to each other" ([overlapping entries](https://clockify.me/help/troubleshooting/permissions/overlapping-entries)). Whether an overlap is allowed, refused or overwritten is [timesheets: *What a timesheet refuses or warns about*](timesheets.md#what-a-timesheet-refuses-or-warns-about).
- [weak] **Booking tools refuse a clash instead.** Calendly "checks your calendar for busy times" and offers only free slots ([busy vs free](https://calendly.com/help/how-to-manage-busy-vs-free-calendar-settings)).
- [required] **Where entries sync as iCalendar,** tentative, confirmed and cancelled map to `STATUS`, and busy or free to `TRANSP` ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545)).

**Cases**
- A day pencilled in for a project, not yet agreed → status Tentative, drawn apart from confirmed days, and still blocking the day.
- A tentative day confirmed → the status changes in place; the entry is not deleted and re-added.
- Two projects on one day → both shown, side by side or stacked, each with its own label; whether the tool allows the overlap is [timesheets](timesheets.md#what-a-timesheet-refuses-or-warns-about).

**Accessibility**
- [required] 1.4.1: tentative is told in words or a named icon ("Tentative"), not by a lighter fill or dashed border alone.
- [required] 1.3.1: the status is part of the entry's accessible name or description.

**Build**
- [required] The status is a field of the entry (`<select name="status">` or radios in a `fieldset`), shown as an attribute on the chip (`data-status="tentative"`) styled from tokens ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [required] The chip's name carries the status text ("Design review, tentative") ([accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).

**Check**
- *Script* could: assert every tentative chip has the word in its accessible name; render two entries on one day and assert both are visible.
- *Judgement*: does the status say how firm the entry is, and does a separate flag say whether it blocks the day?

**Sources.** RFC 5545, Google, Outlook and Calendly agree that firmness and blocking are two properties. How a clash is handled differs: Calendly prevents bookings into it, and timesheets split on it ([timesheets](timesheets.md#what-a-timesheet-refuses-or-warns-about)). No checked source documents a warning on save.

## After saving

**Use when / don't use**
- [moderate] Return the person to the same view and period, with the entry in it. Google's Esc goes back to the "calendar grid from an event details page" ([keyboard shortcuts](https://support.google.com/calendar/answer/37034)); Apple's event popover "disappears after the change, letting people continue reviewing the events on their calendar" ([Apple popovers](https://developer.apple.com/design/human-interface-guidelines/popovers)).
- [strong] Give focus back to the entry or the slot that opened the form. APG: "focus returns to the element that invoked the dialog", or to "another element that provides logical work flow" if it is gone ([APG modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)).

**How**
- [contested] **Whether the new entry is feedback enough.** One side skips a message when the entry appears where the person clicked; the other keeps people informed of every outcome ([feedback: *Success confirmation*](feedback.md#success-confirmation)). The project decides.
- [weak] **A message when the result is off screen.** An entry saved to another week or month gets a status message; feedback confirms success where "its effect is off-screen" ([feedback: *Success confirmation*](feedback.md#success-confirmation)).
- [required] A server round trip lands back on the same period: the form's return address carries the view and date ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- [required] Errors keep the form open with the person's input ([forms: *Error messages and the error summary*](forms.md#error-messages-and-the-error-summary); [*Keeping input*](forms.md#keeping-input)).

**Cases**
- Saving from the week of 23 November → the week of 23 November reloads, scrolled where it was, the new entry in place.
- Saving a no-script form → the server redirects to `?view=month&date=2026-11` and the month shows the entry.
- Saving an entry dated next month from this month's view → "Entry added for 3 December", with a link to that month.

**Accessibility**
- [required] 2.4.3: focus returns to the invoking slot or entry after save or cancel ([modal dialog: focus](../components/modal-dialog.md#focus-in-trapped-returned)).
- [required] 4.1.3: an off-screen save is announced in a status region without moving focus.

**Build**
- [required] The form carries a return address (`<input type="hidden" name="return" value="/calendar?view=week&date=2026-11-23">`); the server redirects there after a POST (code-standard rule 20).
- [required] A script re-render keeps focus and scroll on the entry (code-standard rule 14; [javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll)).
- [required] An off-screen save writes its message into a `role="status"` region present from load ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).

**Check**
- *Script* could: save an entry from a non-current week and assert the same week is shown after; assert focus is on the new or edited entry.
- *Judgement*: after saving, does the person see what they saved without hunting for it?

**Sources.** Google, Apple and the APG agree on returning to the grid and the invoking element. No calendar help page checked documents a success message on save; the off-screen case rests on the interaction page.
