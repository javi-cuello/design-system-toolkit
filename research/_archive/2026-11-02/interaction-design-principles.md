# Interaction design principles for a design system

How an interface should respond in the moment: states, feedback, waiting, stability, reversibility, validation, dialogs, saving, unavailable controls, notifications, choosing controls, filter bars, keyboards and targets, with what a script can check on a rendered page and what stays a judgement call.

Researched October 2026. Every claim below was checked against a page opened during this pass: design-system documentation, token source files on GitHub, W3C specifications and Nielsen Norman Group articles. Three substitutions are worth stating. Salesforce's current Lightning Design System site renders nothing without JavaScript, so its loading and interface-feedback guidance is cited from the archived Spring '20 edition of the same pages. Shopify Polaris's interaction-states page is cited from its MDX source in the `Shopify/polaris` repository, which carries a banner saying the section is being reworked for Polaris v12. Primer's segmented-control guidance is cited from the `primer/design` repository source, because the rendered page truncates before the guidelines. One planned source was dropped: no Smashing Magazine article on confirmation versus undo could be found, so section 6 rests on Nielsen Norman Group and Apple alone. No WCAG success criterion covers layout shift, so section 5 cites web.dev rather than WCAG. Practitioner writing (Smashing Magazine, Baymard, Laws of UX) is labelled as commentary wherever it appears.

---

## What this answers

Interaction design here means how the interface responds in the moment: what happens between a press and a result, and how the screen behaves while it does. Flows across screens, navigation and information architecture are a separate subject with their own guide.

This guide is written for people building and auditing documentation sites, dashboards and internal tools, in Figma and in code. That audience has one advantage most interaction writing ignores: a rendered page can be measured. So every section ends by separating what a script can check deterministically from what still needs a person.

The questions, in order:

- How many states does a control need, and how should they be drawn?
- What counts as feedback, and where should it appear?
- How fast is fast enough, and when should a loading indicator appear?
- When is a skeleton the right placeholder?
- Why does the page jump, and how do you stop it?
- Confirm first, or let people undo?
- When should a form tell someone they made a mistake?
- When is a modal dialog justified?
- Save button or automatic save?
- Disable a control, hide it, or make it read-only?
- What are toasts for?
- Tabs, segmented control or menu?
- Where do filters and search go in a bar?
- Does everything work from the keyboard?
- How big does a target have to be?

Sections 16 and 17 are the cheat sheet and the short version.

---

## 1. Interaction states

**The short answer.** Every interactive element needs a consistent, small set of states: default, hover, focus, pressed, disabled, plus selected or active where the control holds a value. Draw hover and pressed as a translucent layer over the element, with the opacities as tokens, so every component gets the same states for free.

Material Design's answer is the state layer: a translucent overlay in the content colour, whose opacity changes per state. The current token file in the `material-web` repository, generated from Material 3 version 34.0.21, sets [hover at 0.08, focus at 0.1, pressed at 0.1, dragged at 0.16 and disabled at 0.38](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-state.scss). The point is not the numbers but the mechanism: one overlay, one opacity per state, and every surface colour in the system gets a hover state without anyone designing it.

eBay's Evo system ships the same idea with smaller steps. Its [opacity tokens page](https://playbook.ebay.com/design-system/tokens/opacity) lists `opacity.state.hover` at 4%, `opacity.state.focus` at 4%, `opacity.state.press` at 8% and `opacity.state.active` at 12%, and asks teams to "use them instead of custom opacity values to keep emphasis, layering, and state treatment consistent."

Shopify Polaris frames states as communication rather than decoration. Its [interaction states source](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/design/interaction-states.mdx) says states "communicate the status of an element in the interface, establish confidence once an action is taken, and suggest the ability (or inability) to interact with the element," and sets two principles: be subtle but clear ("Successful interaction feedback is informative, not decorative"), and keep things consistent. It also names three kinds of signifier: explicit (the label says what happens), hidden (revealed on hover or tab, such as an underline appearing) and negative (greyed out and unresponsive to hover). Polaris lists the input devices to design for: mouse, touch, keyboard, voice, game controller and refreshable braille display. Hover does not exist on most of them, which is why hover can never be the only signifier.

**Good practice.** Make states orthogonal to variants: a `State` axis on the component set, not a separate component per state. Keep focus out of the state-layer opacity and give it its own ring (the focus indicators guide covers why). Pressed should be visibly stronger than hover, which both Material's and eBay's tokens encode.

**Pros and cons.** The state-layer mechanism scales with almost no design effort and survives theming, because the overlay takes its colour from the content above it. The cost is subtlety: at 4% to 8%, hover on a mid-tone surface can be close to invisible, and nothing in WCAG requires hover to be visible at all. That is acceptable for hover, which is a hint, and not for anything that carries meaning.

**Checkable on a rendered page.** Force each state in a headless browser (`:hover`, `:active`, `:focus-visible`, `[disabled]`) and compare computed background against the token value; confirm every interactive element changes on hover and focus; confirm disabled elements ignore pointer events. **Judgement:** whether the change is noticeable enough on every surface.

**Recommendation.** Ship state opacities as tokens, apply them through one overlay mechanism, and audit that every interactive element actually changes in each state.

---

## 2. Feedback and system status

**The short answer.** Every action gets a response the person can see, placed where they are looking, proportionate to what happened. Silence is the failure; noise is the second failure.

Nielsen's first heuristic is the root. Nielsen Norman Group's [article on visibility of system status](https://www.nngroup.com/articles/visibility-system-status/) (Aurora Harley, 2018) argues that knowing a system's current state is what lets people decide their next step, that "a lack of information often equates to a lack of control," and that simple cues such as a colour change or a progress indicator prevent repeated clicks. It also argues that silent state changes erode trust: removing an out-of-stock item from a wish list without saying so is worse than showing the status and letting the person decide.

Salesforce's Lightning Design System turns this into principles. Its [interface feedback overview](http://spring-20.lightningdesignsystem.com/guidelines/notifications/interface-feedback/overview/) defines interface feedback as something that "provides reactive responses and contextual information that help instill trust in the system," and distinguishes it from notifications: notifications "are traceable, meaning a user can view or dismiss a notification, and revisit its content later," while dismissed feedback is gone, and feedback "is the system's response to direct user input." The principles are short and right: timely ("Provide feedback at the right time", and skip it where it is not needed), informative ("Say what's necessary and not much more"), and actionable. The companion [patterns page](http://spring-20.lightningdesignsystem.com/guidelines/notifications/interface-feedback/patterns/) orders the components from least to most intrusive, from inline text through popovers and toasts to modals.

GitHub's Primer adds placement. Its [notification messaging pattern](https://primer.style/ui-patterns/notification-messaging) sorts messages into system updates, feedback on a user action, and awareness, and says: "Whenever possible, place messages near the action they are related to." Banners go at the top of the relevant content, inline messages next to the field or action.

**Good practice.** Match intrusiveness to consequence: an inline message for a field, a banner for a page, a dialog only when the person must decide something. Put the response next to the cause. Say what changed, not that something happened.

**Pros and cons.** Inline feedback is the least disruptive and the easiest to miss if it lands outside the viewport. Centralised feedback (a toast corner, a status bar) is easy to build once and always far from the action. Primer's rule, near the action whenever possible, is the better default for dashboards, where the action and its effect usually share a screen.

**Checkable on a rendered page.** After a scripted action, assert that something in the DOM changed within a time bound; that a status message exists in a live region; that the message is within the viewport. **Judgement:** whether the wording tells the person what happened and what to do.

**Recommendation.** Treat "every action gets a visible response near its cause" as a testable rule, and pick the component by consequence, least intrusive first.

---

## 3. Response times and perceived performance

**The short answer.** Under about a second, show nothing; between one and three seconds, an indeterminate indicator; beyond that, determinate progress where you can measure it; beyond ten seconds, let people get on with something else. The surprising part is the first rule: a spinner that flashes for 200 ms makes the product feel slower.

The thresholds come from Nielsen Norman Group's [response times article](https://www.nngroup.com/articles/response-times-3-important-limits/): "0.1 second is about the limit for having the user feel that the system is reacting instantaneously," "1.0 second is about the limit for the user's flow of thought to stay uninterrupted," and "10 seconds is about the limit for keeping the user's attention focused on the dialogue." Beyond ten seconds it recommends a percent-done indicator and an easy way to interrupt.

Three systems turn those limits into rules for indicators, and they agree closely:

| System | Under ~1 s | ~1–3 s | Longer |
|---|---|---|---|
| [Primer, loading](https://primer.style/ui-patterns/loading) | "Don't show a loading state" | Indeterminate | 3–10 s determinate if possible; over 10 s determinate and treat as a background task |
| [Fluent 2, wait UX](https://fluent2.microsoft.design/wait-ux) | No indicator, "as the flash on the screen may be confusing" | Spinner | Over 3 s, progress bar or a content string |
| [Lightning, loading](http://spring-20.lightningdesignsystem.com/guidelines/loading/) | "For less than 300 ms, just show the data" | Stencil (skeleton) after 300 ms | Spinners for slow computations |

Primer gives the reason for the first column: a loading indicator flashing on screen "could be distracting and make the product feel slower than it is." It also gives the reason determinate progress waits until about three seconds: shorter waits do not give people time to read it.

Laws of UX, a practitioner reference rather than a standard, cites the [Doherty threshold](https://lawsofux.com/doherty-threshold/): Doherty and Thadani's 1982 IBM paper set 400 ms as the response-time target, replacing the earlier two-second standard, and the site's takeaway is to "provide system feedback within 400 ms." The original paper was not opened in this pass; treat the 400 ms figure as a commonly cited target rather than a measured limit.

**Good practice.** Acknowledge the press instantly (pressed state, button busy state) even when the result takes longer; delay the loading indicator so fast responses never show one; once shown, keep it visible long enough not to flicker; move anything over ten seconds into the background.

**Pros and cons.** A delayed indicator removes flicker at the cost of a short window where nothing appears to happen; the instant pressed state covers that window. Determinate progress is reassuring and expensive: it needs a real measure of work done. An indeterminate spinner is cheap and, past a few seconds, reads as "stuck".

**Checkable on a rendered page.** Throttle the network and measure time from input to first visual change, time to indicator, time to content; assert no indicator appears for responses under the threshold; assert the indicator, once shown, stays above a minimum duration. **Judgement:** which operations deserve determinate progress.

**Recommendation.** Adopt one threshold table for the whole system (Primer's is the most complete) and enforce it with a throttled-network test rather than a design review.

---

## 4. Skeletons

**The short answer.** Use a skeleton for a whole page or a large container whose layout you can predict, for waits under about ten seconds. Draw it as the real layout in grey, not an empty frame, and never skeleton a menu, toast or dialog.

Nielsen Norman Group's [skeleton screens article](https://www.nngroup.com/articles/skeleton-screens/) is the clearest on when: "skeleton screens should be used with a wait time that's under 10 seconds"; spinners suit a single module ("a video or a card which is on a dashboard"); and "if a page takes less than 1 second to load, skeleton screens or spinners aren't necessary." It distinguishes content-placeholder skeletons, which mirror the layout, from frame-display skeletons, which show only header and footer, and advises against the second because a mostly blank page reads as broken.

IBM Carbon's [loading pattern](https://carbondesignsystem.com/patterns/loading-pattern/) adds where: "Only use skeleton states on container-based components like tiles and structured lists," and "Never represent toast notifications, overflow menus, dropdown items, modals, and loaders with skeleton states." It also notes that not everything needs a skeleton: an item can be "expressed as negative or white space until they load," with the example of a 600 by 600 image holding a 600 by 600 blank area.

Primer agrees in fewer words: skeletons "may be used when we can approximate the visual shape the loaded content will create on the page." Lightning's stencils add the transition rule: the stencil "cross-fades to the data," and "Do not have a 'white flash' between stencils and data."

**Good practice.** Build the skeleton from the same layout component as the content, so its boxes are the content's boxes. Size it to the expected content, not to a guess. Cross-fade, do not blank.

**Pros and cons.** A good skeleton sets expectations and reserves space, which is half of section 5's job done. A bad one, sized differently from the content, guarantees a layout shift at the moment content arrives. Skeletons also cost a second rendering path per component; Carbon's restriction to containers keeps that cost bounded.

**Checkable on a rendered page.** Capture bounding boxes of the skeleton and the loaded content and assert they match within a tolerance; assert no frame between them shows an empty container. **Judgement:** whether the layout is predictable enough to skeleton at all.

**Recommendation.** Skeletons for containers and full pages only, generated from the real layout, verified by comparing skeleton geometry to loaded geometry.

---

## 5. Layout stability

**The short answer.** Nothing should move unless the person moved it. Reserve the space for anything that can appear, disappear or load, including controls that only apply in some states. Remarkably, no design system checked here names this as a principle; it lives in performance documentation and in scattered component rules.

The nearest the systems come are fragments. Carbon reserves white space at the loaded size (section 4). Lightning forbids the white flash between stencil and data. Primer's loading pattern says: "Avoid creating a jarring layout shift when the loaded content replaces the loading indicator." Smashing Magazine's filter guidance (commentary, section 13) says to "avoid layout shifts on filter input." None states the general rule.

The measurable definition comes from web.dev's [Cumulative Layout Shift article](https://web.dev/articles/cls): "A layout shift occurs any time a visible element changes its position from one rendered frame to the next," and sites should aim for a CLS of 0.1 or less. One detail matters a great deal for dashboards and tools: "Layout shifts that occur within 500 milliseconds of user input will have the hadRecentInput flag set," so they are excluded from the score. That exclusion is reasonable for a page that expands because you clicked "show more". It also means CLS is blind to the shifts that most annoy people in tools: the ones caused by switching a tab, a filter or a file.

**Worked example.** The toolkit's audit dashboard has a header that shows a table of findings for the selected Figma file. One column held row actions, and for files with nothing actionable the column was removed. Switching between two files therefore made the header and everything below it jump by 62px. Every frame was correct in isolation, every design review passed, and CLS reported nothing, because each jump followed a click. The fix was to keep the column's space whether or not it had content. The lesson generalises: a control or column that applies only sometimes should keep its footprint, and the only reliable check is to measure the same element's position across states yourself.

**Good practice.** Give images and media explicit dimensions. Size skeletons to content. Keep conditionally empty columns, badges and action areas at their full size. Use `scrollbar-gutter: stable` where content length varies. Put anything that loads late below the fold or in reserved space.

**Pros and cons.** Reserving space occasionally leaves visible emptiness, an empty column or a gap, which some reviewers read as a bug. That is the right trade: emptiness is a cosmetic cost, movement is a usability cost that breaks aim and reading position. The alternative, animating the change, makes the movement easier to follow but does not remove it.

**Checkable on a rendered page.** This is the most checkable topic in the guide. Record the bounding box of every landmark (header, toolbar, first table row) in each state of every switch, and fail on any difference; collect `layout-shift` entries including those with `hadRecentInput`, which standard CLS tooling discards. **Judgement:** almost none, beyond deciding which elements are landmarks.

**Recommendation.** Write "nothing moves unless the person moved it" as a system principle, and enforce it with a cross-state geometry test, because CLS will not catch interaction-triggered shifts.

---

## 6. Undo versus confirm

**The short answer.** Prefer undo. Confirm only what cannot be undone and matters, name the consequence in the dialog, and label the buttons with the outcomes.

Nielsen Norman Group's [confirmation dialog article](https://www.nngroup.com/articles/confirmation-dialog/) is precise: "Use a confirmation dialog before committing to actions with serious consequences," especially "before actions that cannot be undone," but "Do not use confirmation dialogs for routine actions," because "if you cry wolf too many times, people will stop paying attention to the question." It asks for buttons that "summarize what will happen for each possible response" (Delete file and Keep file rather than Yes and No), suggests "it's probably best not to have a default answer at all," and says to "go to great lengths to provide undo."

Apple's [undo and redo guidance](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo) covers what good undo looks like: help people predict the result (menu labels such as "Undo Typing"), "Show the results of an undo or redo," especially when the change is off screen, and avoid "unnecessary limits on the number of times people can undo or redo."

The W3C's [modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) adds the keyboard half: for a final, hard-to-reverse action, "set focus on the least destructive action," so a reflexive Enter does no harm.

**Good practice.** Commit reversible actions immediately and offer undo in context. Reserve confirmation for irreversible, high-consequence actions; name the object and the consequence; label buttons with verbs; focus the safe option.

**Pros and cons.** Undo keeps flow and respects intent, and it costs engineering: the action must be reversible, which for deletes means soft-delete and for external side effects (emails sent, webhooks fired) may be impossible. Confirmation is cheap to build and degrades with every use. A dialog people click through without reading is worse than none, because it also delays them.

**Checkable on a rendered page.** For a destructive action: a dialog appears, its initial focus is on the least destructive button, Escape closes it without effect, and button labels are not "OK"/"Yes". For reversible actions: an undo control appears and restores state. **Judgement:** which actions are serious enough to confirm.

**Recommendation.** Default to undo, confirm only the irreversible, and test the dialog's focus and labels automatically.

---

## 7. Error prevention and validation timing

**The short answer.** Two respected sources disagree on when to validate a field. Baymard says on leaving the field; GOV.UK says on submit. They agree on everything else: never validate while someone is still typing, clear an error as soon as it is fixed, and say exactly what is wrong.

Baymard's [inline validation research](https://baymard.com/blog/inline-form-validation) (commentary from usability testing of e-commerce checkouts) found participants "often frustrated by overzealous inline validation" and concludes that "the validity of each field input should be checked when the user leaves the field," with an exception for fields of known length such as postcodes and card numbers. It is equally firm on removal: "the error message must live update on a keystroke level, disappearing the moment users enter a valid input."

The GOV.UK Design System's [validation pattern](https://design-system.service.gov.uk/patterns/validation/) takes the opposite position on timing: "Do not validate when the user moves away from a field"; validate when they try to move on, usually on submit, because early validation "can cause problems – especially for users who type more slowly." On failure it says to "show an Error summary component at the top of the page, and move keyboard focus to it," and to prefix the page title with "Error: ".

**The consensus.** Both forbid validating mid-keystroke. Both want specific messages next to the field. The disagreement reflects audience: Baymard optimises a short commercial checkout for speed; GOV.UK serves everyone, including slow typists and screen-reader users for whom an error appearing on blur, while they are already in the next field, is an interruption they may not hear. For a tool or dashboard form used by practitioners, on-blur validation with live clearing is reasonable; for anything public or long, submit-time validation with an error summary is the safer default.

**Good practice.** Prevent errors before reporting them: constrain input types, show format hints, accept forgiving formats. Validate on blur or on submit, never on keystroke. Clear on keystroke. Keep the person's input on failure.

**Pros and cons.** On-blur catches mistakes while the field is fresh and can interrupt. On-submit is calmer and accessible and makes people scroll back. Neither is wrong; mixing them in one form is.

**Checkable on a rendered page.** Type a partial invalid value and assert no error appears while focused; submit and assert focus moves to the error summary; fix the value and assert the error clears without another submit; assert errors are associated to fields (`aria-describedby`). **Judgement:** which timing fits the audience.

**Recommendation.** Pick one timing per product and write it down: on blur for short practitioner forms, on submit for public or long forms. Both clear errors live.

---

## 8. Modality and dialogs

**The short answer.** A modal dialog is justified when the person must decide or finish something before continuing. Keep it short, give it an obvious exit, never stack one on another, and manage focus exactly as the W3C pattern describes.

Apple's [modality guidance](https://developer.apple.com/design/human-interface-guidelines/modality) says: "Present content modally only when there's a clear benefit," because a modal "takes people out of their current context and requires an action to dismiss." It asks for modal tasks that are "simple, short, and streamlined," warns against "a modal experience that feels like an app within your app," requires "an obvious way to dismiss," and says to let people dismiss one modal view before presenting another.

Carbon's [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/) separates modal dialogs, for critical information or required input, from non-modal ones, which let people keep working, such as a find-and-replace panel. It reserves dialogs for user-initiated tasks, sending system-generated alerts to toasts, and is blunt about nesting: "One modal should never trigger another modal."

The W3C's [modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) gives the mechanics. Tab and Shift+Tab "do not move focus outside the dialog"; Escape closes it; focus "is initially set on the first focusable element," or on a static element at the top for long content, or on the least destructive action for a hard-to-reverse one; on close, "focus returns to the element that invoked the dialog." `aria-modal="true"` is set only when outside content is genuinely inert.

**Good practice.** Use the native `<dialog>` element with `showModal()`, which provides inertness and Escape. Title the dialog with its task. Confirm before closing if closing would lose input.

**Pros and cons.** Modals guarantee attention and break context. For dashboards, a side panel or inline expansion often keeps the data visible while the person works, which a modal hides. The cost of non-modal surfaces is focus management without a trap, which is harder to get right.

**Checkable on a rendered page.** This is almost fully scriptable: on open, focus is inside the dialog; Tab from the last element wraps to the first; Escape closes; on close, focus returns to the trigger; outside content is inert; no second dialog opens from the first. **Judgement:** whether the task needed a modal at all.

**Recommendation.** Modal only for decisions and short required tasks, built on native `<dialog>`, with the APG focus contract tested on every dialog.

---

## 9. Saving: explicit or automatic

**The short answer.** Controls that act immediately (toggle switches, segmented controls) save automatically; forms save explicitly. Never mix the two in one form.

Primer's [saving pattern](https://primer.style/ui-patterns/saving) is the clearest rule set found: "When designing a form, start with an explicit saving pattern"; "never mix save patterns in a single form"; "Automatic saving should be used when the user expects instant feedback from the change they made"; imperative controls (toggle switches, segmented controls, and single-select menus outside a form) save automatically, while declarative controls such as checkboxes and radios in a form save explicitly. After a save whose effect is not obvious in the viewport, "provide feedback to let the user know that the change occurred successfully," inline if the page stays, as a banner if it reloads. Primer also says to avoid toasts for this on github.com.

**Good practice.** Let the control type decide the pattern: a toggle switch promises immediacy, a checkbox promises a submit. Show the save state ("Saved", "Saving…", "Couldn't save") next to auto-saved controls. Keep input on failure.

**Pros and cons.** Automatic saving removes a step and removes a safety net: there is no moment to reconsider, so it pairs naturally with undo (section 6). Explicit saving gives control and risks lost work if people navigate away; a leave-page warning covers that.

**Checkable on a rendered page.** For auto-save controls, assert a network request or state change follows the interaction without a submit, and a status message appears; for explicit forms, assert nothing persists until submit; assert no form contains both. **Judgement:** whether a given setting is imperative or declarative.

**Recommendation.** Adopt Primer's imperative-versus-declarative rule, and audit for forms that mix toggles with a save button.

---

## 10. Disabled, hidden or read-only

**The short answer.** Disable what is temporarily unavailable and say why; make read-only what people need to see but cannot change; hide what they are not allowed to use at all. When a whole control could never apply in this context, do not show it.

Carbon's [disabled states pattern](https://carbondesignsystem.com/patterns/disabled-states/) gives the three-way split. Disabled "Cannot be clicked, selected or interacted with," and "In a temporarily disabled scenario the component should never fully disappear from the user's view." Read-only means "The user cannot interact with it but content is still readable and accessible to a screen reader," for content "still relevant to the user or important to task completion." Hidden is for when someone "does not have permission to view, interact with, or take action."

Nielsen Norman Group's [drop-down menu guidelines](https://www.nngroup.com/articles/drop-down-menus/) apply this to menu items: "Gray out any unavailable options," because "If disabled items are removed, the interface loses spatial consistency and becomes harder to learn," and suggest a short explanation on hover. Smashing Magazine's [filter guidance](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/) (Vitaly Friedman, 2021, commentary) says the same for filters: "rather than hiding them automatically, we can disable them, but also explain why they are disabled," noting that hiding them reduces the height of the filter area and shifts the layout.

Primer's [degraded experiences pattern](https://primer.style/ui-patterns/degraded-experiences) is the useful counterweight, for a different cause. When a control does not work because a service is down: "Never disable an interactive control that is non-functional due to availability issues." Hide non-critical ones; for critical ones, keep an inactive control that explains the failure. And "When the data required to calculate a count is unavailable, default to hiding the number," rather than showing a zero that is false.

**Reconciling them.** The rules differ by cause. Logically unavailable now, available after another choice: disable, keep its place, explain. Not permitted: hide. Broken by an outage: hide or explain, never a silent disabled state that looks like a logical rule. Never applicable in this context, on this file or this page: do not render it, since a permanently disabled control is noise.

**Pros and cons.** Disabled controls teach the interface and preserve layout, and they are hard to read (WCAG exempts inactive components from contrast requirements) and usually unfocusable, so screen-reader users may never learn they exist. Hiding is clean and teaches nothing. Read-only is underused and the right answer for most "you can see but not change" cases.

**Checkable on a rendered page.** Every disabled control has an accessible explanation (a tooltip trigger, `aria-describedby`, or adjacent text); no control is disabled in every state of the page (a sign it should not be shown); no layout shift when options become available. **Judgement:** classifying the cause.

**Recommendation.** Decide by cause: disable and explain for temporary, read-only for visible-but-locked, hide for permissions and outages, omit for never-applicable.

---

## 11. Transient notifications: toasts

**The short answer.** A toast is for brief, low-stakes, system-level news that does not belong to a spot on the page. Anything with an action, anything critical and anything about a specific field belongs inline.

Carbon's [notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/) says toasts are "best used with system-generated messages that do not correspond to a specific section of the UI," and are "more disruptive than inline notifications." Toasts without actions can auto-dismiss; toasts with actions "persist until dismissed by user"; messages "should not exceed three lines"; and, under accessibility: "Don't use notifications that dismiss on a timer for critical or emergency messages." It gives no auto-dismiss duration.

Primer's position is more sceptical. Its notification pattern points to banners, inline messages and dialogs as alternatives "in situations where you may be inclined to use toast notifications," and its saving pattern says to avoid toasts on github.com for now. Lightning ties toasts to user actions: "A toast appears in reaction to user action: creating, editing, deleting."

**Good practice.** One toast region, announced through a live region, in a predictable corner. No actions on a timed toast, or if there must be one (Undo), no timer. Never the only record of an error.

**Pros and cons.** Toasts are cheap and non-blocking and they appear far from the action, vanish before slow readers finish, and may be missed by screen-reader users if the live region is wrong. For dashboards and tools, where actions and their effects share a screen, inline feedback usually wins.

**Checkable on a rendered page.** Toasts render inside an `aria-live` or `role="status"` region; any toast containing a button does not auto-dismiss; toast text length under a limit; no error appears only as a toast. **Judgement:** whether a message is global enough to be a toast.

**Recommendation.** Default to inline; use toasts only for global, actionless, non-critical news, and never put a timer on a toast with a button.

---

## 12. Controls for choosing: tabs, segmented control or menu

**The short answer.** Tabs switch between sections of content; a segmented control switches how one piece of content is shown, filtered or sorted, for a handful of short options; a menu holds the rest. The systems converge on four or five as the most a segmented control should hold.

Tabs are for different content in the same context. Atlassian's [tabs guidance](https://atlassian.design/components/tabs/usage) says to "switch between views within the same context," and not to "use tabs to separate information that users need at the same time, such as filtering data within a single table." Carbon's [tabs guidance](https://carbondesignsystem.com/components/tabs/usage/) agrees: "When toggling between different formats of the same content or filtering the same content, use content switcher instead." GOV.UK's [tabs component](https://design-system.service.gov.uk/components/tabs/) is the most cautious, warning that "not everyone will notice them or understand how they work," and stating that the component "has not yet been tried in research with users."

Segmented controls are for small, fixed sets that apply immediately:

| System | Limit | Beyond the limit |
|---|---|---|
| [eBay, segmented button](https://playbook.ebay.com/design-system/components/segmented-button) | "two to four segments"; "Don't use more than 4" | Dropdown, radio buttons or selection cell for 4+ |
| [Primer, segmented control](https://github.com/primer/design/blob/main/content/components/segmented-control.mdx) | "2–5 choices with text labels, or up to 6 icon-only segments" | "a group of radio inputs or a dropdown menu"; in narrow spaces, "Convert to an action menu" |
| [Anvil (ServiceTitan), filters](https://anvil.servicetitan.com/docs/web/patterns/filters.md) | "switching between 2–4 views" | Filter Bar selects |

Primer is explicit that its segmented control is for sort, filter and formatting choices ("Filter control: Activating a segment affects the visibility of items in a list, and there is a segment that shows the full list"), and that selection is applied immediately, which is what distinguishes it from a radio group in a form. eBay is explicit that segmented buttons "should not be considered a replacement for navigational tabs."

Overflow differs by control. Fluent's [tablist](https://fluent2.microsoft.design/components/web/react/core/tablist/usage) says "Tablists don't wrap; if there isn't enough room, additional tabs go into an overflow menu," while admitting that tablists are "less effective in smaller layouts that push several tabs into an overflow menu." Carbon scrolls tabs with arrows rather than wrapping. Primer turns a segmented control into an action menu.

Keyboard behaviour comes from the W3C's [tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): Tab enters the tablist on the active tab, arrow keys move between tabs and wrap, Home and End are optional, and tabs should "activate automatically when they receive focus" when panels appear "without noticeable latency." Carbon gives the corollary: manual activation (arrow to move, Enter or Space to select) when panels load slowly.

**Worked example.** The toolkit's audit dashboard needed filter controls whose choices vary per file. It settled on these rules. Up to four choices: segmented buttons. More than four: a menu, with a count beside each option. Where there are two such menus, they are faceted: each menu's counts are computed within the other menu's current choice, so the numbers always describe what selecting the option would show. An option with a count of zero is disabled, not removed, so the list keeps its shape (section 10). A menu with nothing to choose, because every option but one is empty, is disabled. A control that can never apply to this file, such as a component filter on a file with no components, is not shown at all. The four-choice boundary follows eBay and Anvil; Primer would allow five.

**Good practice.** Ask what the control changes. Different content: tabs. A different view of the same content: segmented control, at most four or five short labels. More options, or long labels: a menu. Show counts where options filter data.

**Pros and cons.** Segmented controls show every option at once and cost horizontal space, which makes them brittle in responsive layouts; menus scale and hide their options behind a click. Tabs are familiar and, as GOV.UK notes, routinely missed. Faceted counts are the most informative and the most expensive to compute correctly.

**Checkable on a rendered page.** Count options per segmented control and fail above the limit; check roles (`tablist`/`tab`/`tabpanel`, or a radio group for segmented controls) and arrow-key behaviour; assert each count equals the result rows the option would produce; assert zero-count options are disabled. **Judgement:** whether a switch changes content or view.

**Recommendation.** Tabs for content, segmented control for up to four view or filter choices, a menu with counts beyond that, and the counts tested against the data.

---

## 13. Filter bar layout

**The short answer.** There is no consensus. The common pattern in tools puts filters and toggles on the left and search on the right; Carbon's data table puts search on the left. Pick one for the system and hold it.

Carbon's [data table usage](https://carbondesignsystem.com/components/data-table/usage/) places an always-open search field on the left under the table title, where it "stretches until it meets the actions on the right," and caps the toolbar at five actions before an overflow menu. Anvil's filters pattern puts the filter bar first and toolbar actions after it, with the toolbar set to its own width so it "doesn't push the filters around," and says "Most usable filters should always be placed first" and "If a specific filter option is used by 80% of users, make that the default." It does not say where search goes. Smashing Magazine's filter article (commentary) asks for result counts "as soon as possible" and no layout shift on filter input.

The left-filters, right-search arrangement treats search as an escape hatch beside the structured choices; Carbon's arrangement treats search as the primary tool, read first in a left-to-right scan. For a dashboard whose filters are few and whose search is secondary, filters first is defensible; for a large table whose main task is finding a row, Carbon's order is.

**Good practice.** Most-used filter first. Sensible defaults. Stable widths so selecting a filter does not reflow the bar. A visible count of results. A clear-all when more than one filter is active.

**Pros and cons.** Either order works; inconsistency across pages is what costs. Filters that wrap to a second row on narrow screens move everything below them, which section 5 forbids; a collapse to a single "Filters" menu is steadier.

**Checkable on a rendered page.** The order of controls in the bar is identical across pages; bar height does not change when a filter value changes; a result count is present and matches the rows. **Judgement:** the order itself.

**Recommendation.** Choose an order once (filters left, search right is reasonable for tools), note the conflict with Carbon in the system's docs, and test that the bar's geometry is stable.

---

## 14. Input methods and keyboard parity

**The short answer.** Everything a pointer can do, the keyboard can do, in a logical order, with standard keys. Escape cancels, Tab moves between controls, arrows move within composite widgets.

Apple's [keyboards guidance](https://developer.apple.com/design/human-interface-guidelines/keyboards) asks apps to "Support Full Keyboard Access when possible," to "Respect standard keyboard shortcuts," and, in general, not to "repurpose standard keyboard shortcuts for custom actions." Its standard table includes Esc to "Cancel the current action or process" and Shift-Tab to navigate controls in reverse. The W3C's ARIA Authoring Practices give the web contract per widget: the dialog and tabs patterns cited above are the two this guide relies on most, and both depend on the composite-widget model, where Tab enters and leaves a group and arrows move within it.

Polaris's list of input devices (section 1) is the reminder of why: hover, drag and right-click have no keyboard equivalent unless you build one.

**Good practice.** Native elements first; they carry keyboard behaviour for free. One tab stop per composite widget. Visible focus everywhere. A keyboard path for drag and drop. No keyboard traps outside modal dialogs.

**Pros and cons.** Keyboard parity costs little if native elements are used and a great deal if custom widgets are, because each needs its APG behaviour rebuilt. The payoff reaches beyond screen-reader users to every power user of a tool.

**Checkable on a rendered page.** Tab through the page and record focus order, asserting it follows visual order and reaches every interactive element; assert Escape closes every overlay; assert arrow keys move within tablists, menus and radio groups; assert no element captures focus permanently. **Judgement:** whether the order is logical when visual order is ambiguous.

**Recommendation.** Use native elements, follow the APG pattern for every custom widget, and run a scripted tab-order walk on every page.

---

## 15. Targets

**The short answer.** WCAG AA requires 24 by 24 CSS pixels, or enough spacing; Apple recommends 44 by 44 points on touch; Android recommends 48 by 48 dp. Design to the platform figure; the WCAG figure is the floor.

[WCAG 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), Level AA, says "The size of the target for pointer inputs is at least 24 by 24 CSS pixels," except where undersized targets are spaced so that a 24 CSS pixel circle centred on each does not intersect another target, where an equivalent control exists, where the target is inline in text, where the user agent sets the size, or where the presentation is essential.

Apple's [accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility) gives a default and a minimum per platform: 44×44 pt default and 28×28 pt minimum on iOS and iPadOS, 28×28 pt and 20×20 pt on macOS, and suggests about 12 points of padding around bezelled elements and about 24 around unbezelled ones. Android's [touch target guidance](https://support.google.com/accessibility/android/answer/7101858) says: "Consider making touch targets at least 48x48dp, separated by 8dp of space or more," which is "about 9mm, regardless of screen size."

Fitts's law explains the stakes. Nielsen Norman Group's [summary](https://www.nngroup.com/articles/fitts-law/) (Raluca Budiu, 2022): "The movement time to a target depends on the size of the target and the distance to the target." Bigger and closer is faster; screen edges help mouse users and offer "no advantage for touchscreens"; targets placed too close invite overshooting.

**Good practice.** Make the hit area larger than the visible shape where the shape is small (padding or a pseudo-element). Space icon buttons in dense toolbars. Put frequent actions near where the pointer already is.

**Pros and cons.** Large targets cost density, which dashboards value. The WCAG spacing exception exists precisely so a dense desktop toolbar can keep small icons, provided they are spaced; touch layouts should not lean on it.

**Checkable on a rendered page.** Fully: measure every interactive element's bounding box and fail under 24×24 unless the spacing test passes; flag under 44 or 48 for touch-first surfaces. **Judgement:** which surfaces are touch-first.

**Recommendation.** Enforce 24 px with the spacing exception as an automated gate everywhere, and design touch surfaces to 44 pt or 48 dp.

---

## 16. Cheat sheet

| Design intent | Ship this | Not this | Script can check |
|---|---|---|---|
| Hover and pressed | One overlay with tokenised opacities | Hand-picked colours per component | State colours match tokens |
| Feedback | A visible response near the cause | Silence, or a toast in a far corner | DOM change within a bound |
| A wait under ~1 s | No indicator | A spinner flash | No indicator below threshold |
| A wait of 1–3 s | Indeterminate indicator | Determinate progress nobody can read | Time to indicator |
| A wait over 10 s | Determinate progress, run in the background | A blocking spinner | Interface stays interactive |
| Loading a container | Skeleton matching the real layout | A frame-only skeleton, or one on a menu | Skeleton and content geometry match |
| A column or control that applies sometimes | Keep its space | Remove it and let the page jump | Landmark positions identical across states |
| Reversible destructive action | Commit, then offer undo | "Are you sure?" | Undo restores state |
| Irreversible action | Dialog naming the consequence, safe option focused | Yes/No with focus on Yes | Initial focus, labels |
| Field validation | On blur or on submit, cleared live | On every keystroke | No error while typing |
| Required decision | Native modal dialog, APG focus contract | A modal opened from a modal | Focus trap, Escape, focus return |
| Toggle switch or segmented control | Automatic save with status | A save button beside a toggle | No mixed forms |
| Temporarily unavailable | Disabled, in place, explained | Removed | Explanation present |
| Not permitted, or never applicable | Not shown | Disabled forever | No permanently disabled controls |
| Outage | Hidden or explained | Silently disabled; a false zero | Counts hidden when data missing |
| Global, actionless news | Toast in a live region | A timed toast with a button | Live region; no timer with actions |
| Different content | Tabs | Tabs for filtering one table | Roles and arrow keys |
| Two to four views or filters | Segmented control | Seven segments | Option count |
| More choices | Menu with faceted counts, zero options disabled | A long segmented row | Counts match data |
| Filter bar | One order across the system, stable width | Bars that reflow on selection | Bar height stable |
| Keyboard | Native elements, APG patterns | Pointer-only interactions | Tab-order walk |
| Targets | 24 px minimum, 44 pt / 48 dp on touch | Tiny unspaced icons | Bounding-box sizes |

---

## 17. The short version

Most of interaction design is deterministic enough to test, and the toolkit's audience can render pages, so it should. States, timing, layout stability, focus movement, option counts and target sizes are measurable. Wording, which actions are serious, and which control fits a choice remain judgement.

Give every control the same small set of states through one overlay mechanism with tokenised opacities. Respond to every action, near its cause, at the lowest intrusiveness that does the job.

Do not show a loading indicator under about a second; it makes things feel slower. Use an indeterminate indicator up to about three seconds and determinate progress beyond, and move anything over ten seconds into the background. Skeletons are for containers and pages, built from the real layout.

Nothing should move unless the person moved it. No design system states this plainly, and CLS ignores shifts within 500 ms of input, which is exactly when tools jump. A dashboard header that dropped 62px between files because an action column vanished is the canonical case; keeping the column's space fixed it. Test landmark positions across states yourself.

Prefer undo to confirmation; confirm only the irreversible, with outcome-named buttons and focus on the safe one. Validate on blur or on submit, never mid-keystroke, and clear errors live; GOV.UK and Baymard disagree on the first part and agree on the rest. Modals only for required decisions, never stacked, with the APG focus contract. Toggles save themselves; forms have a button; never both in one form.

Disable and explain what is temporarily unavailable, hide what is not permitted, and do not render what can never apply. Toasts are for global, actionless news.

Tabs switch content; a segmented control switches a view of the same content and holds four or five options at most; beyond that, a menu with counts. Pick one filter-bar order and keep its geometry stable. Make everything work from the keyboard with native elements and APG patterns, and enforce 24 px targets everywhere, 44 pt or 48 dp on touch.

**When something feels wrong, this is usually why.** A page that jumps on a click: a conditional element without reserved space. A product that feels slow but measures fast: a spinner flashing under a second. People clicking through a dialog: it guards something routine. A control nobody can use and nobody can explain: disabled with no reason, or disabled because it can never apply. Errors that appear while someone types: validation on keystroke.

---

## 18. What to re-check later

- **Material's state-layer opacities** are generated token files that change with Material versions; the values here come from the `latest` file at version 34.0.21. Re-read the file before quoting them.
- **Polaris interaction states** carries a "being reworked for Polaris v12" banner. The principles quoted may change.
- **Lightning Design System** guidance is cited from the Spring '20 archive because the current site needs JavaScript to render. Confirm the 300 ms stencil rule survives in the current edition before quoting it as current.
- **GOV.UK tabs** have not been researched with users, by the team's own statement. Watch for findings.
- **CLS's 500 ms input exclusion** is why section 5 recommends a custom cross-state check. If the metric changes to include interaction-triggered shifts, the custom check could become redundant.
- **Almost none of the timing figures are recent measurements.** Nielsen's limits and Doherty's 1982 target are decades old; the system thresholds are conventions built on them. They hold up in practice, but they are not new evidence.

---

## Sources

**Primary: specifications and standards**

- [W3C, Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html). The 24 CSS pixel rule and its exceptions.
- [W3C ARIA Authoring Practices, Dialog (Modal) pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Focus trap, Escape, initial focus, focus return, `aria-modal`.
- [W3C ARIA Authoring Practices, Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Arrow keys, Home and End, automatic versus manual activation.
- [web.dev, Cumulative Layout Shift](https://web.dev/articles/cls). The definition, the 0.1 threshold, the 500 ms `hadRecentInput` exclusion, session windows.
- [Android Accessibility Help, Touch target size](https://support.google.com/accessibility/android/answer/7101858). 48×48 dp, 8 dp spacing, about 9 mm.

**Primary: design systems**

- [Material Web, `_md-sys-state.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-state.scss). State-layer opacities.
- [eBay Playbook, Opacity tokens](https://playbook.ebay.com/design-system/tokens/opacity) and [Segmented button](https://playbook.ebay.com/design-system/components/segmented-button). State opacities; two to four segments and the decision flow.
- [Shopify Polaris, `interaction-states.mdx`](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/design/interaction-states.mdx). Principles, signifiers, input devices.
- [Salesforce Lightning Design System (Spring '20), Interface feedback overview](http://spring-20.lightningdesignsystem.com/guidelines/notifications/interface-feedback/overview/), [Interface feedback patterns](http://spring-20.lightningdesignsystem.com/guidelines/notifications/interface-feedback/patterns/) and [Loading](http://spring-20.lightningdesignsystem.com/guidelines/loading/). Feedback principles; the 300 ms stencil rule and no white flash.
- [GitHub Primer, Notification messaging](https://primer.style/ui-patterns/notification-messaging), [Loading](https://primer.style/ui-patterns/loading), [Saving](https://primer.style/ui-patterns/saving), [Degraded experiences](https://primer.style/ui-patterns/degraded-experiences) and [`segmented-control.mdx`](https://github.com/primer/design/blob/main/content/components/segmented-control.mdx).
- [Microsoft Fluent 2, Wait UX](https://fluent2.microsoft.design/wait-ux) and [Tablist usage](https://fluent2.microsoft.design/components/web/react/core/tablist/usage).
- [IBM Carbon, Loading pattern](https://carbondesignsystem.com/patterns/loading-pattern/), [Dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/), [Disabled states](https://carbondesignsystem.com/patterns/disabled-states/), [Notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/), [Tabs usage](https://carbondesignsystem.com/components/tabs/usage/) and [Data table usage](https://carbondesignsystem.com/components/data-table/usage/).
- [Atlassian Design System, Tabs usage](https://atlassian.design/components/tabs/usage).
- [GOV.UK Design System, Validation pattern](https://design-system.service.gov.uk/patterns/validation/) and [Tabs component](https://design-system.service.gov.uk/components/tabs/).
- [ServiceTitan Anvil, Filters pattern](https://anvil.servicetitan.com/docs/web/patterns/filters.md).
- [Apple Human Interface Guidelines: Undo and redo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo), [Modality](https://developer.apple.com/design/human-interface-guidelines/modality), [Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards) and [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility).

**Primary: research organisations**

- [Nielsen Norman Group, Visibility of System Status](https://www.nngroup.com/articles/visibility-system-status/) (Aurora Harley, 2018).
- [Nielsen Norman Group, Response Time Limits](https://www.nngroup.com/articles/response-times-3-important-limits/).
- [Nielsen Norman Group, Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/).
- [Nielsen Norman Group, Confirmation Dialogs Can Prevent User Errors](https://www.nngroup.com/articles/confirmation-dialog/).
- [Nielsen Norman Group, Dropdowns: Design Guidelines](https://www.nngroup.com/articles/drop-down-menus/).
- [Nielsen Norman Group, Fitts's Law and Its Applications in UX](https://www.nngroup.com/articles/fitts-law/) (Raluca Budiu, 2022).

**Commentary, labelled as such in the text**

- [Baymard Institute, inline form validation](https://baymard.com/blog/inline-form-validation). Validate on blur, clear on keystroke. The article's own figures for sites lacking inline validation are inconsistent (31% and 32%), so neither is quoted here.
- [Vitaly Friedman, *Designing Filters That Work*, Smashing Magazine, 2021](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/). Disable and explain rather than hide; counts; no layout shift on filter input.
- [Laws of UX, Doherty Threshold](https://lawsofux.com/doherty-threshold/). The 400 ms figure and its 1982 origin.

**Planned but not confirmed, and dropped**

- A Smashing Magazine article on confirmation versus undo. Searches found only a mailing-list summary of an article that could not be located, so nothing from it is used.
- A WCAG success criterion for layout shift. None exists; section 5 cites web.dev instead.
- Doherty and Thadani's 1982 IBM Systems Journal paper, cited only through Laws of UX.
- The current, JavaScript-rendered Lightning Design System pages, which returned no content; the Spring '20 archive was used instead.
