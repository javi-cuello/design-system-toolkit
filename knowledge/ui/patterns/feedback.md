# Feedback: messages, status, loading, empty and error states

How an interface tells people what happened, what state something is in, and what to do next: choosing among an inline message, a banner, a toast, a dialog and a status badge; loading indicators; empty states; error pages; success confirmations; and a notifications centre. It serves design-standard's principles *show state and give feedback*, *people in control, mistakes forgiven* and *honest*, applies design-standard rule 10 (a message says what changed and what it does to people) to every message here, and design-standard rule 2 (the layout holds still) to every message that appears and goes. It owns toasts, loading indicators, empty states and the notifications centre; other pages link here, and nothing here is a rule.

## Choosing the feedback

**Use when / don't use**
- Use this section before drawing any message: the choice of component is the first decision, and the wrong one cannot be fixed by wording.
- Pick by two questions: how wide is the scope (one field, one region, the page, the whole product) and how important is it (must the person act before going on, should they know, or may they ignore it).
- Don't use a dialog for news; don't use a toast for anything the person must act on or must not miss.

**How**
- Order the options from least to most intrusive and take the first that is enough: status badge, inline message, banner, toast, dialog. Lightning's [interface feedback patterns](http://spring-20.lightningdesignsystem.com/guidelines/notifications/interface-feedback/patterns/) also order its components from least to most intrusive, and its [principles](http://spring-20.lightningdesignsystem.com/guidelines/notifications/interface-feedback/overview/) say to skip feedback "where it is not needed".
- Map scope to component:

| Scope | Must act now | Should know | May ignore |
|---|---|---|---|
| One field or control | inline error (validation) | inline hint | none |
| One region, list or row | inline message in the region | inline message or status badge | status badge |
| The page | banner above the `h1` | banner | none, or a caption |
| The product, not tied to a place | dialog, only if it blocks | toast, or banner on the next page | notifications centre |

- Place the message next to its cause. Primer's [notification messaging](https://primer.style/ui-patterns/notification-messaging): "Whenever possible, place messages near the action they are related to."
- An indicator is passive and attached to an element; a validation is attached to input; a notification is about the system and is either passive or action-required ([NN/g, indicators, validations and notifications](https://www.nngroup.com/articles/indicators-validations-notifications/)). Name which of the three a message is before choosing its component.
- A dialog is for a decision the person must make before continuing. Carbon's [notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/): "Only use a modal when the message is critical and needs the user's immediate attention or action." The dialog's behaviour is [dialogs: focus](dialogs.md#focus-in-trapped-returned).
- Four severities, one vocabulary across every component: information, success, warning, error ([Carbon](https://carbondesignsystem.com/patterns/notification-pattern/)). Each severity has one colour role, one icon and one heading word, used everywhere.

**Cases**
- A save on a settings form fails because the server is down → a banner at the top of the form region saying what was not saved and that the form keeps the input, not a toast: the person must act, and a toast can vanish before they read it.
- A background export finishes while the person is on another page → a toast with no action, plus an entry in the notifications centre: global, passive, and findable again.
- A field's value is too long → an inline error under the field, never a banner or toast: the scope is one field (GOV.UK keeps validation out of its [notification banner](https://design-system.service.gov.uk/components/notification-banner/)).
- Deleting a project → a confirmation dialog with buttons named for the outcome ("Delete project", "Keep project"); deleting a draft comment → do it and offer undo. Undo or confirmation is [interaction: undo or confirmation](../design/interaction.md#undo-or-confirmation).
- Three messages compete on one page → keep the most severe in its component, fold the rest into it or into the notifications centre; GOV.UK combines banners into one and Carbon shows one banner at a time.

**Accessibility**
- 4.1.3 Status Messages: a message that appears without moving focus is exposed through a role or property ([W3C Understanding 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)). code-standard lists 4.1.3 among its candidates; until it is a rule, see each section below.
- 1.4.1 Use of Color: severity is never colour alone; it carries an icon and a word.
- 3.3.1 Error Identification: an error is described in text.
- Focus after a message replaces content is code-standard rule 14.

**Build**
- One element per kind: inline message (text tied by `aria-describedby`), banner (`section` labelled by its heading), toast (a persistent `role="status"` region), dialog (`dialog`), status badge (text in a custom element).
- Severity is one attribute, `tone="info|success|warning|error"`, mapped to one colour token, one icon and one heading word per tone (code-standard rules 9 and 22).
- A message that appears without moving focus goes through a live region present from load ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- A message that replaces content keeps the reader's place (code-standard rule 14; [javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll)).
- The icon beside a word is `aria-hidden` (code-standard rule 18).

**Check**
- *Script* could: after a scripted action, assert something visible changed within a time bound and sits inside the viewport; list every message component on a page and flag a dialog that opened without a person's action.
- *Judgement*: is this the least intrusive component that is enough, and is it next to its cause?

**Sources.** Lightning, Primer, Carbon and NN/g agree on ordering by intrusiveness and placing near the cause. Primer is the most sceptical of toasts; the toolkit follows it and makes inline the default.

## Toasts

**Use when / don't use**
- Use for brief, passive, product-level news that does not belong to a place on the page: an export finished, a setting saved elsewhere.
- Don't use for an error the person must fix, a field message, anything critical, or the only record of something.
- Don't use when the action and its effect share a screen; show the effect there instead.

**How**
- At most two lines of text. Carbon's ceiling is three ([notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/)); the toolkit sets two because a toast may leave before a slow reader finishes.
- No essential action. An Undo is the one action a toast may carry, and then it has no timer: Carbon says a toast with an action "should remain on screen until the user dismisses it".
- Auto-dismiss only when the same information can be found elsewhere (the notifications centre, the changed record, an activity log). W3C's [Understanding 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) treats a disappearing message as a time limit unless the user can get the information another way.
- One at a time. A second toast replaces the first or queues behind it; Carbon stacks them newest on top, and the toolkit does not, because a stack of vanishing messages is unreadable. No source gives a duration; set one in the project's context document and keep a close button on every toast.
- One region, in one corner, for the whole product. The toast never covers the control the person is using or the focused element (2.4.11).
- Wording: what happened, in the past tense, with the object named: "Report exported to Downloads". No "Success!".
- Small screens: full width at the bottom, above any bottom navigation.

**Cases**
- "Changes saved" after an explicit Save on the same screen → drop the toast and show the saved state beside the button: the effect is evident (see *Success confirmation*).
- A toast offering "Retry" for a failed upload → make it an inline message on the upload row: an action makes it essential.
- Bulk delete from a list in view → no toast: the list shows the change, and an inline message above it says "40 findings deleted. Undo", kept until dismissed. Deleting from a page that then closes leaves nothing on screen → a toast with Undo, no timer, dismissed by the person or replaced by the next action; the deletion is committed when it closes.
- A connection drop → a banner, not a toast: it is a condition that persists, and the person must know while it lasts.

**Accessibility**
- 4.1.3: the toast region is a persistent `role="status"` (or `role="alert"` only for the rare urgent case) present on load, and the text is inserted into it. code-standard's candidate notes that `aria-live` on an element that mounts with its content announces nothing.
- 2.2.1 Timing Adjustable: a timed toast whose content exists nowhere else fails unless the person can turn off, adjust or extend the timer.
- 2.1.1 Keyboard: a toast with Undo is reachable by keyboard without hunting; an icon-only close is code-standard rule 18.

**Build**
- One toast region per product, a `role="status"` element in the page from load; the script writes text into it, never mounts the region with its content ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
  ```html
  <div role="status" data-toasts></div>   <!-- in the layout, empty, from the start -->
  ```
- A toast with Undo has no timer and keeps the Undo `button` reachable; every toast has a named close button (code-standard rule 18).
- A timed toast pauses on hover and focus, and its duration is one token in the project.
- Positioned with `position: fixed` and logical insets, clear of safe areas ([responsive: *Safe areas*](../../code/responsive.md#safe-areas)); it never covers the focused element (2.4.11).
- Enters with `transform` and `opacity`, still under reduced motion ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).

**Check**
- *Script* could: find the toast region and confirm it is a live region present before any toast; flag a toast containing a button that auto-dismisses; flag toast text over two lines at the toast's width; flag an error that appears only in a toast.
- *Judgement*: is this message global enough to be a toast, and can it be found again?

**Sources.** Carbon allows three lines and stacking; Primer steers away from toasts; Lightning ties them to user actions. The toolkit goes with Primer's caution and W3C's 2.2.1 reading: two lines, one at a time, timed only when findable elsewhere.

## Banners and alerts

**Use when / don't use**
- Use a banner for something about the whole page or the whole product: an outage, a deadline, a stale data source, the outcome of the person's last action when they have not finished.
- Use an alert (an inline message with a severity) inside a region when the scope is that region.
- Don't use a banner for validation errors (GOV.UK [notification banner](https://design-system.service.gov.uk/components/notification-banner/)), for marketing, or for information directly relevant to the page's task, which belongs in the content.

**How**
- One banner per page. Combine messages or show only the most important (GOV.UK; Carbon: "Only show one banner at a time").
- Page banner: immediately before the page `h1`, as wide as the content (GOV.UK). Product banner: directly below the main header, scrolling with the page, not sticky ([Carbon](https://carbondesignsystem.com/patterns/notification-pattern/)).
- Severity drives colour role, icon and a heading word, so meaning never rests on colour (GOV.UK asks for a heading such as "Success" for this reason).
- Dismissible or not: a banner about a condition that still holds (outage, stale data, read-only mode) is not dismissible; it leaves when the condition ends. A banner of information the person has read is dismissible, and stays dismissed for that person. GOV.UK lists dismissal as an open question; this split is the toolkit's commentary.
- Body: the problem and its cause, then what the person can do, in one to two sentences. Atlassian's [error messages](https://atlassian.design/foundations/content/designing-messages/error-messages) asks for one to two sentences and not to invent a cause.
- Reserve its space or place it above the controls so its arrival or dismissal does not move them (design-standard rule 2).

**Cases**
- A dashboard's audit source failed but the snapshot loaded → a warning banner naming what is missing and how old the rest is; the sections that depend on the audit show "not measured", never zero ([ux: degraded states](../design/ux.md#degraded-offline-and-error-states)).
- A banner and an error summary on the same page → keep the error summary; GOV.UK says not to show both.
- A success banner after a multi-step journey ends → a confirmation page instead; GOV.UK prefers one at the end of a linear service.

**Accessibility**
- 1.3.1 and 2.4.1: a banner is a `role="region"` labelled by its heading so it can be found by landmark navigation (GOV.UK). A success banner that appears after a redirect takes focus on load (GOV.UK uses `role="alert"` for it); moving focus is code-standard rule 14's territory.
- 1.4.1 and 1.4.3: icon and heading carry the severity; text contrast is figma-standard rule 32 in a component.

**Build**
- A banner is a `section` named by its heading (`aria-labelledby`), so it is a region landmark; rendered by the server before the `h1` where it can be ([HTML semantics: *Landmarks*](../../code/html-semantics.md#landmarks)).
- Tone as an attribute (`tone="warning"`), with an `aria-hidden` icon and a visible heading word (code-standard rules 9 and 18).
- A banner inserted after load overlays or takes reserved space, never pushes the controls ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).
- Dismissal hides it with `hidden` and remembers it per person on the server or in storage; a condition banner has no close button (code-standard rule 17).
- A success banner after a redirect takes focus on load with `tabindex="-1"` ([accessibility: *Focus management*](../../code/accessibility.md#focus-management)).

**Check**
- *Script* could: count banners per page (more than one is a finding); confirm each has a heading and an accessible region name; flag a banner placed after the `h1` or inside the main content flow on a page that has one.
- *Judgement*: is the condition still true while the banner shows, and could the message live in the content instead?

**Sources.** GOV.UK and Carbon agree on one at a time and on placement; neither settles dismissal, so the toolkit splits it by whether the condition persists.

## Inline messages

**Use when / don't use**
- Use for feedback about one field, one row, one card or one region, placed beside it.
- Use for validation errors, hints that appear on a condition, and a region's own warning.
- Don't use for news unrelated to what is on screen.

**How**
- Next to the cause: under a field, at the top of a region, in the row. Carbon: "Place inline notifications near their related items"; keep the message under two lines.
- Persist until resolved or dismissed (Carbon). A validation message clears when the input is fixed; timing is [interaction: validation timing](../design/interaction.md#error-prevention-and-validation-timing).
- Wording: what is wrong and how to fix it, as [content: error messages](../design/content.md#error-messages) sets out.
- Reserve the message's line under a field, or accept the shift below the field only; a message never pushes the control the person is using (design-standard rule 2).
- A form with several errors also gets a summary ([forms: error messages and the error summary](forms.md#error-messages-and-the-error-summary)).

**Cases**
- A row in a table failed to sync → an inline warning icon and short text in a status column, with the detail on the row's page: the scope is one row.
- A field error shown only by a red border → add text and an icon: 3.3.1 and 1.4.1.
- An inline region message about the whole page → promote it to a banner; inline scope must match.
- An inline hint that appears on focus and disappears → keep hints static; text that vanishes is missed ([Apple writing](https://developer.apple.com/design/human-interface-guidelines/writing): "don't show crucial information that could then disappear").

**Accessibility**
- 3.3.1 and 3.3.3: the error is text and suggests the fix where known.
- A field's message is associated by `aria-describedby`, code-standard rule 15. A message inserted after load is 4.1.3; code-standard's candidate on mounting live regions applies.

**Build**
- A field message is a description: `aria-describedby` on the control, `aria-invalid="true"` while in error ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup); code-standard rule 15).
- Its line under the field is reserved, or the shift lands only below the field ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).
- A region message is a `p` or `div` at the region's top with a tone attribute; it is in the server HTML when the state is known at render (code-standard rule 20).
- A message inserted later into a region is announced through a separate live status line, not by putting `aria-live` on the message ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- The error state is styled from `[aria-invalid="true"]`, never a class (code-standard rule 6).

**Check**
- *Script* could: for each `aria-invalid="true"` control, assert a described-by message exists in text.
- *Judgement*: does the message name the actual cause and the fix?

**Sources.** Carbon and GOV.UK agree; the wording sources are in [content: error messages](../design/content.md#error-messages).

## Status badges and pills

**Use when / don't use**
- Use to show the state of an object in a list, table or header: Draft, Published, Failed, Needs review.
- Use a count badge for tallies; use a tag for descriptive metadata ([Atlassian lozenge](https://atlassian.design/components/lozenge/usage)).
- Don't make a status badge interactive; a badge that opens a menu is a button styled as one.
- Don't use semantic colours for decoration or for user-chosen categories (Atlassian's accent colours exist for that).

**How**
- Colour plus text, and an icon where the status must be scanned at density. Carbon's [status indicator pattern](https://carbondesignsystem.com/patterns/status-indicator-pattern/): rely on at least two of colour, shape and symbol, and add text; "Relying solely on color to convey status is insufficient."
- A fixed vocabulary: list every status the product uses, each with one label, one colour role and one icon, in the project's context document. The same state never has two names on two screens, and two states never share a colour.
- Short labels in sentence case (Atlassian: "Don't use long labels"; it truncates past 200px by default). One or two words.
- Three attention levels at most: high (act now: error), medium (no action needed: in progress), low (something changed or is ready) ([Carbon](https://carbondesignsystem.com/patterns/status-indicator-pattern/)).
- A dot-only status is allowed only in a dense column whose header names the status, and with the text available to assistive technology.

**Cases**
- A table uses green "Active", green "Live" and green "Published" for one state on three pages → one name, one badge, everywhere: the vocabulary is the design.
- A badge says "Error" in red with no explanation → keep the badge, and put the cause in the row's detail or a described-by text; a badge is a label, the message lives elsewhere.
- Twelve statuses in a workflow → group them into the three attention levels for colour, keep twelve labels; more colours than levels stop meaning anything.
- A grey "Disabled" badge at low contrast → disabled controls are exempt from 1.4.3, but a status badge is text and is not: it meets figma-standard rule 32.

**Accessibility**
- 1.4.1: text or icon beside colour. 1.4.11: a status shape needs 3:1 against its background; 1.4.3 for its text.
- A dot-only badge needs text in the accessible name or a visually hidden label; an icon-only badge is code-standard rule 18.

**Build**
- A visual component, a custom element with text and no script: `<ds-badge tone="error">Failed</ds-badge>` (code-standard rule 8).
- Tone is an attribute mapped to the project's status vocabulary; the icon is `aria-hidden` beside the text (code-standard rules 9 and 18).
- A dot-only badge keeps its text for assistive technology in a `visually-hidden` span ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).
- Colours are tokens, one per attention level, never per status (code-standard rule 22; [tokens: *Three tiers*](../../code/tokens.md#three-tiers)).
- Never a `button` or link; a badge that opens something is a button component with a badge look.

**Check**
- *Script* could: collect every badge's text on a site and flag a text with two colours or a colour with two meanings; flag a badge with no text node and no accessible name.
- *Judgement*: is the vocabulary one list, and does each status say something the reader acts on?

**Sources.** Carbon asks for three cues where Atlassian asks for text and an optional icon; the toolkit requires text always and an icon at density.

## Loading

**Use when / don't use**
- Use an indicator only when the wait is long enough to be noticed.
- Use a skeleton for a page or a container whose layout is predictable; a spinner for a single module or an action; determinate progress when the work can be measured.
- Don't skeleton toasts, overflow menus, dropdown items, dialogs or other loaders ([Carbon loading pattern](https://carbondesignsystem.com/patterns/loading-pattern/)); some items need only reserved blank space.

**How**
- How long a wait must be before anything shows, and when progress turns determinate, is [interaction: response times](../design/interaction.md#response-times-and-perceived-performance): nothing under about a second, then a skeleton for a region or a spinner for a module, determinate progress past a few seconds.
- Skeletons mirror the real layout, built from the same layout component and sized to the expected rows, so nothing moves when content arrives ([NN/g skeleton screens](https://www.nngroup.com/articles/skeleton-screens/): for waits under about ten seconds; a frame-only skeleton reads as broken). Cross-fade to the data with no blank frame between (Lightning's [loading](http://spring-20.lightningdesignsystem.com/guidelines/loading/)).
- Place the indicator where the content will be; replace a row of adjacent spinners with one (Primer). Load parts as they arrive.
- Never show "No results" while loading. Loading, empty and error are three states with three designs.
- A button that starts the work shows its own state, or none: [actions: loading buttons](actions.md#loading-buttons). The indicator for a region belongs to the region, not to the button that asked for it.
- Keep what is on screen during an update: a filter that refetches dims or marks the old rows busy rather than swapping them for a skeleton; a skeleton is for content not yet seen.

**Cases**
- A table fetch takes 400ms → no indicator; show the pressed state on the filter and swap the rows in place.
- A dashboard of six cards loads unevenly → each card shows its own skeleton and fills when ready; one failed card shows its error state while the rest render.
- A dropdown loads its options → "Loading…" inside the open list, never skeleton options.
- One chart refreshes → a spinner in that chart's box; the page stays live.
- A report generation takes 40s → a determinate bar with an estimate and "We'll notify you when it's ready", with the result also in the notifications centre.
- A skeleton three rows tall for a table that renders twenty → size it to the expected rows or to the container's reserved height; a mismatch causes the shift it was meant to prevent.

**Accessibility**
- 4.1.3: a persistent `role="status"` element carries the loading and loaded announcements; one announcement for a group of skeletons (Primer). `aria-busy="true"` on the updating region holds back partial content and is cleared when done (Primer). The announcement is the status text; `aria-busy` alone says nothing.
- 2.2.2 Pause, Stop, Hide: an animated indicator that runs over five seconds alongside other content needs a way to stop it, or is the only content. Under reduced motion a skeleton's shimmer stops; a spinner keeps a subtle motion, since Primer: loading animations "should not be disabled when for users that prefer reduced motion", but "should be kept as subtle as possible".

**Build**
- A skeleton is the real layout component rendered with placeholder rows, sized to the expected content ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)). Its placeholders are `aria-hidden="true"`; the region speaks once:
  ```html
  <p role="status" class="visually-hidden" data-results-status></p>  <!-- in the page from load -->
  <ul aria-busy="true" data-results>
    <li class="skeleton-row" aria-hidden="true"></li> <!-- × the expected row count -->
  </ul>
  ```
- The updating region carries `aria-busy="true"` until done; one `role="status"` line says "Loading results" and then "24 results" ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- A spinner on its own is `aria-hidden` with the status line beside it carrying a specific label (Primer: "loading status checks"), not a bare "Loading".
- Measured work is `<progress value max>` with a label; unmeasured is `<progress>` with no `value` ([MDN `progress`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)).
- The indicator appears after the project's threshold, not at once, and once shown holds a short minimum: one timer, as in [interaction: response times](../design/interaction.md#response-times-and-perceived-performance) and the button version in [actions: loading buttons](actions.md#loading-buttons).
- Shimmer stops under `prefers-reduced-motion`; a spinner slows or turns still ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).
- A framework's loading boundary (React's `Suspense`) is this section's loading branch: its fallback is the skeleton, and boundaries follow the design's loading sequence, not every component. React: "Suspense boundaries should not be more granular than the loading sequence that you want the user to experience." An update that would swap visible content for a fallback runs as a transition, so the old content stays (React: "Replacing visible UI with a fallback creates a jarring user experience").
- Loading, empty and error are three render branches; empty never renders while a request is pending.

**Check**
- *Script* could: with a throttled network, measure time to first visual change and confirm no indicator shows under the threshold; compare skeleton and loaded bounding boxes within a tolerance; flag an empty-state message rendered while a request is pending.
- *Judgement*: which waits deserve determinate progress, and is the layout predictable enough to skeleton?

**Sources.** Primer, Carbon, NN/g and Lightning as linked agree on skeleton shape; the thresholds and their disagreement (Lightning's 300ms) are in [interaction: response times](../design/interaction.md#response-times-and-perceived-performance). Reduced motion: [Primer's loading pattern](https://primer.style/product/ui-patterns/loading/) keeps the spinner moving, where a blanket reduced-motion block stops it; the toolkit follows Primer for spinners and stops shimmer, which conveys nothing a still skeleton does not. Boundaries: [React `Suspense`](https://react.dev/reference/react/Suspense).

## Empty states

**Use when / don't use**
- Use for every list, table, chart or region that can have nothing in it.
- Design four kinds separately: first use, no results, cleared (the person finished or removed everything), and error. Each says something different. This section owns the kinds and their copy; other pages link here.
- Don't leave a blank area or an empty grid with headers; don't show a first-use message on a filtered list.

**How**

| Kind | Say | Action |
|---|---|---|
| First use | what will appear here and why it matters | the one action that creates the first item |
| No results | that nothing matches, and what was searched or filtered | clear filters, or widen the search |
| Cleared | that the work is done, plainly | the next useful place, or none |
| Error | what failed, in plain words, no codes | retry, or where to go instead |

- Replace the element that would show: an empty table is replaced, headers and all ([Carbon empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/)).
- A heading, one to two sentences of reason, one primary action ([Atlassian empty state](https://atlassian.design/foundations/content/designing-messages/empty-state), [Primer empty states](https://primer.style/product/ui-patterns/empty-states/)). Titles as a positive statement: "Start by adding a data source", not "You have no data sources" (Carbon).
- No dead end: always a path forward (Carbon). Error states are not playful (Primer).
- Keep the region's size so the page does not collapse and jump when content arrives (design-standard rule 2).
- A filter that prevents empty results at the source is better than a good empty state: disabled options at zero are design-standard rule 5 and counts are design-standard rule 11.

**Cases**
- A search returns nothing → "No components match 'buton'", the query shown, and "Clear search"; never "Create your first component", which tells the reader to make what they already have.
- An inbox of findings worked to zero → "All findings resolved" with the date of the last audit; no illustration of confetti on a tool page.
- A chart with no data for the period → the empty state in place of the plot area, naming the period, and the axis frame removed: an empty axis reads as a zero.
- The source failed to load → the error kind, with "Try again"; showing "No items" here is a false claim (zero is a figure, missing is not).
- An editor's empty canvas, where items are added by dragging → the first-use state is also the drop target: an area the size of the first item, outlined as a place to drop rather than a message ("Drag a block here"), with the heading, the one sentence and a visible button that adds without dragging (WCAG 2.5.7). While something is dragged over it, it becomes that item's slot; once one item lands, it is gone. Builders draw their empty drop zones this way: Acquia Site Studio shows a placeholder in an empty drop zone and removes it once a component is in it ([Site Studio](https://docs.acquia.com/drupal-starter-kits/add-ons/site-studio/adding-components-your-page-using-visual-page-builder)), and Lightning's builder fills an empty area's drop target to the full width and a default row's height, with a drag handle button and keyboard equivalents ([Lightning drag and drop](https://spring-20.lightningdesignsystem.com/guidelines/builder/drag)).

**Accessibility**
- 1.3.1: the empty state's heading sits at the level of the region's heading. 4.1.3: an empty state that replaces results after a search is a status message ("No results returned" is W3C's own example), announced without moving focus.
- A fallback that appears only when there is nothing is code-standard rule 12.

**Build**
- The empty state replaces the element: the template renders it instead of the table, not an empty `tbody` (code-standard rule 12).
- A heading at the region's level, a paragraph, and one action: a link if it goes somewhere, a button if it acts ([HTML semantics: *Headings and the outline*](../../code/html-semantics.md#headings-and-the-outline)).
- The kind (`first-use`, `no-results`, `cleared`, `error`) is chosen in the model from the data and the request's outcome, not in the template (code-standard rule 29).
- A no-results state after a filter is announced through the existing status line ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- The region keeps a `min-block-size` from its content type, so arrival moves nothing ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).

**Check**
- *Script* could: render each data region with an empty data set and with a failed source, and assert a heading and an action exist and no empty `tbody` or axis frame remains; flag error text containing a status code.
- *Judgement*: does each kind say why it is empty, and is the action the one that fills it?

**Sources.** Carbon names three kinds, Primer three with different cuts; the toolkit splits "user action" into no results and cleared because their actions differ.

## Error pages

**Use when / don't use**
- Use when the primary content of a page cannot be shown at all: the address does not exist (404), the server failed (500), or the service is down on purpose (outage, maintenance).
- Don't use for a failed secondary section: drop or mark that section and keep the page ([ux: degraded states](../design/ux.md#degraded-offline-and-error-states)).

**How**
- Keep the global header and navigation on every error page; Primer: "Never suppress rendering of the global navigation header."
- **Not found**: heading "Page not found"; say the page cannot be found, suggest checking the address, and link to a place that helps (search, the home page, contact if it exists). No "404", no "oops", no humour, no blame ([GOV.UK page not found](https://design-system.service.gov.uk/patterns/page-not-found-pages/)).
- **Server problem**: heading "Sorry, there is a problem with the service"; "Try again later"; what happened to any answers in progress; contact or an alternative ([GOV.UK problem with the service](https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/)). No "500", no "technical difficulties".
- **Outage or maintenance**: when it will be back (day, date and time), what happened to work in progress, an alternative and contact. No vague "maintenance" or "improvements" ([GOV.UK service unavailable](https://design-system.service.gov.uk/patterns/service-unavailable-pages/)).
- No red text and no breadcrumbs on any of them (GOV.UK). The HTTP status code is sent by the server; it is not shown as the headline.

**Cases**
- A docs site's renamed page → redirect the old address; the 404 page is for addresses with no successor. GOV.UK asks for addresses in letters and forms to point to pages that exist.
- A 404 that says "Oops! Looks like you're lost" → "Page not found", then two sentences and links.
- A dashboard whose only data source is down → the server-problem page inside the product's shell, saying which source and since when, and linking to the last good report if one exists.
- A planned three-hour migration → the unavailable page with the return time, updated as soon as it changes.

**Accessibility**
- 2.4.2 Page Titled: the title names the problem and the site ("Page not found – site name").
- 1.3.1: one `h1`, which is the problem; code-standard rule 1 for the page's structure.

**Build**
- The server sends the real status (404, 500, 503 with `Retry-After`); the page is rendered in the product's shell, header and navigation included.
- One `h1` naming the problem; `title` names the problem and the site ([HTML semantics: *Document metadata*](../../code/html-semantics.md#document-metadata)).
- Error pages are static and self-contained, so they render when the app or its scripts fail (code-standard rule 20).
- A renamed page is a redirect (301), not a 404.
- No stack trace, path or status code in the visible text; the detail goes to the server log.

**Check**
- *Script* could: request a nonsense path and assert the response status is 404 and the page has the shell, a title naming the problem, and at least one link; flag "404", "500" or "oops" in visible text.
- *Judgement*: does the page say what the person can do now?

**Sources.** GOV.UK's three patterns are the only detailed published guidance and the toolkit follows them; their "Sorry" in the 500 heading is kept, though GOV.UK lists please and sorry as an open question.

## Success confirmation

**Use when / don't use**
- Confirm success only when the result is not evident from the screen: the action happened elsewhere, its effect is off-screen, or it took long enough that the person may have looked away.
- Don't confirm what the person can already see: a renamed item showing its new name, a toggled switch, a row that vanished after delete (offer undo there instead).

**How**
- Prefer showing the changed state in place (the new value, a "Saved" state beside the button, the item at the top of the list) over a separate message. Lightning's timely principle: skip feedback where it is not needed.
- When a message is needed, choose its component by scope as in *Choosing the feedback*: inline next to the action, a success banner when the person continues a journey (GOV.UK, removed on the next page), a confirmation page at the end of a linear journey (GOV.UK).
- Wording: name what happened to which object; one to two sentences; no "Success!", no "successfully", no exclamation marks ([Atlassian success messages](https://atlassian.design/foundations/content/designing-messages/success-messages)). Always dismissible (Atlassian).
- Frequent confirmations get shorter and quieter (Atlassian: "Timing and repetition are critical").

**Cases**
- "Item successfully deleted!" toast after a delete in a visible list → remove the toast, keep the list change, offer undo.
- An invite sent by email → "Invitation sent to the address entered", inline under the form: the effect happens elsewhere and is invisible.
- Saving a long form that stays open → a "Saved at 14:32" note beside the Save button, updated each time.
- Autosave → a quiet persistent state indicator; never mix explicit and automatic saving in one form ([interaction: saving](../design/interaction.md#saving-explicit-or-automatic)).

**Accessibility**
- 4.1.3: a success message that appears without moving focus is a status message in a live region. A success banner shown after a page load may take focus (GOV.UK).
- 1.4.1: the success colour carries a word or icon.

**Build**
- The changed state is the confirmation: the new value re-rendered in place, keeping focus (code-standard rule 14).
- "Saved at 14:32" is a `role="status"` element beside the Save button, present from load, with the time in a `time` element ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- A success banner on the next page is rendered by the server from a one-time flash value, so a refresh does not repeat it ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Success is reported only when the response says so, from its success flag ([javascript: *Errors and an envelope's success flag*](../../code/javascript.md#errors-and-an-envelopes-success-flag)).

**Check**
- *Script* could: flag the words "successfully" or "Success!" in messages; after a scripted save, assert a status message or a visible changed state exists.
- *Judgement*: would the person know it worked without the message?

**Sources.** Atlassian and GOV.UK agree on wording; the "only when not evident" rule is the toolkit's reading of Lightning's timely principle and NN/g's [visibility of system status](https://www.nngroup.com/articles/visibility-system-status/), and is commentary.

## Notifications centre

**Use when / don't use**
- Use when a product sends many system-generated messages, or when timed toasts need a place to be found again (*Toasts*).
- Don't use as the only route for anything urgent; don't add one for a product that sends a few messages a week.

**How**
- Opened and closed by the person; messages in reverse chronological order; a way to manage preferences ([Carbon notification panel](https://carbondesignsystem.com/patterns/notification-pattern/)).
- Each entry: what happened, to what, when (absolute time available, see the data patterns), and a link to the object.
- Unread count as a badge on the trigger, capped (for example "99+"); read state per entry and "Mark all as read".
- Give each notification type an urgency level from a written scale and let people change what they receive in the product (Apple's [managing notifications](https://developer.apple.com/design/human-interface-guidelines/managing-notifications)). Every team thinks its message is urgent; the scale stops inflation.
- Empty state: "No notifications", with a link to preferences.

**Cases**
- A toast for "Export ready" auto-dismisses → the same entry lands in the centre, which is what makes the timer acceptable (2.2.1).
- Fifty identical "Sync completed" entries a day → group them, or stop sending them: a passive event that recurs is noise.
- A release-blocking failure → a banner on the affected page and an entry in the centre; the centre alone would be missed.

**Accessibility**
- The trigger's name includes the unread count ("Notifications, 3 unread"); an icon-only trigger is code-standard rule 18.
- The panel is a dialog or a disclosure; Escape and light dismiss are code-standard rule 19 when built on `details`.
- New entries arriving while the panel is closed update the count without announcing each one.

**Build**
- A trigger `button` whose name includes the count ("Notifications, 3 unread"), the badge glyph `aria-hidden` (code-standard rule 18).
- The panel is a non-modal `popover` or a `dialog`, opened by the trigger; built on `details`, it adds Escape and light dismiss (code-standard rule 19; [HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- Entries are a list (`ol`, newest first), each a link to its object with a `time datetime`; an unread entry says so in text (a visually hidden "Unread"), not only by weight or a dot ([HTML semantics: *Lists, description lists and figures*](../../code/html-semantics.md#lists-description-lists-and-figures)).
- New entries arrive by polling or a stream; only the count updates while closed, without a live announcement per entry ([javascript: *Polling and live data*](../../code/javascript.md#polling-and-live-data)).
- "Mark all as read" is a form post, so it works without script (code-standard rule 20).

**Check**
- *Script* could: assert the trigger's accessible name changes with the count; assert entries are in descending time order and each carries a `time` element.
- *Judgement*: does each notification type have an urgency level, and is anything urgent only here?

**Sources.** Carbon and Apple agree on user control of notifications; Apple's four interruption levels are the written scale the toolkit points to.
