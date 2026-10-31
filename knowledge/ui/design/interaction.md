# Interaction: how an interface responds in the moment

The fundamentals of the design standard's Interaction area: what happens between a press and its result, and how the screen behaves meanwhile. It serves the principles *show state and give feedback*, *people in control, mistakes forgiven*, *discoverable* and *for everyone, in any context*, and applies design-standard rules 2, 3, 4 and 5. Everything else here is guidance, not a rule: raise it as a finding, never cite it as one. Flows across screens belong to UX; the words of a message to Content; the components that carry feedback, loading, dialogs and choices to the pattern pages linked in each section.

## Interaction states

**What good looks like**
- Every interactive element has the same small set of states, each drawn differently from rest.
- Pressed is stronger than hover; focus is a ring of its own, never the hover overlay.
- A state exists because the control can be in it.

**How:** which states a control has follows from what it does.
- *Rest, hover, focus, pressed*: every interactive element.
- *Selected*: a control that holds a value (tab, segment, option, toggle, selectable row).
- *Disabled*: only where the control can become available on this screen (see *Disabled, hidden or read-only*).
- *Loading*: a control whose action can pass about a second; it keeps its width and refuses a second press.
- *Error*: a control that takes input and can be invalid. A button has no error state; the error sits beside what failed.
- Hover and pressed are one translucent overlay with tokenised opacities, so every surface gets them free ([Material tokens](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-state.scss): hover 0.08, pressed 0.1; [eBay](https://playbook.ebay.com/design-system/tokens/opacity): 4% and 8%). In Figma, one `State` axis orthogonal to the variant axes.

**Cases**
- Hover at 4% vanishes on a mid-grey surface → fine for hover, a hint; selected and error must be seen without hovering.
- A Hover variant identical to rest → a product bug that leads the queue (figma-standard rule 31).
- A field shows only a red border on a bad value → add text; colour alone fails 3.3.1 and 1.4.1.
- A selected segment is marked only by a darker fill → add a second cue (weight, check, outline).

**Accessibility:** 2.4.7 Focus Visible (AA); 1.4.11 Non-text Contrast (AA) asks 3:1 for what identifies a component and its state, selected and focus included, while hover is supplementary; 1.4.1 Use of Color. Figma: figma-standard rule 31. Code: code-standard rule 9, code-standard rule 62.

**Build:**
- Each state is a selector, never a class: `:hover` (inside `@media (hover: hover)`), `:active`, `:focus-visible`, `:disabled` or `[aria-disabled="true"]`, and selected as `[aria-selected]`, `[aria-pressed]`, `[aria-current]` or `:checked` (code-standard rule 9).
- Hover and pressed are one overlay driven by the state tokens; how it is written, and why pressed wins by selector rather than load order (code-standard rule 44), is [CSS architecture: interaction states](../../code/css-architecture.md#interaction-states).
- The focus ring is its own mixin under `:focus-visible` ([accessibility: visible focus](../../code/accessibility.md#visible-focus)); the disabled dim is the host's, once (code-standard rule 62, [tokens: the disabled opacity, once](../../code/tokens.md#the-disabled-opacity-once)).
- A Figma `State` axis maps to these selectors, never to an attribute ([figma handoff: variants to attributes](../../code/figma-handoff.md#variants-to-attributes)).

**Check:** *Script*: could force `:hover`, `:active`, `:focus-visible` and `[disabled]` headlessly and fail an element whose computed style does not change, or whose state colour is not the token; on Figma, figma-components-audit reads figma-standard rule 31. *Judgement*: is each change noticeable on every surface it sits on?

**Sources:** [Polaris interaction states](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/design/interaction-states.mdx) ("informative, not decorative"; six input methods, most without hover). Material and eBay differ on opacities; the toolkit takes the mechanism, not a figure.

## Feedback and system status

**What good looks like**
- Every action gets a visible response where the person is looking, sized to what happened.
- The response says what changed.
- Nothing changes silently.

**How:**
- The least intrusive response that is enough, next to its cause; which component that is (badge, inline, banner, toast, dialog) is [feedback: choosing the feedback](../patterns/feedback.md#choosing-the-feedback), and toasts are [feedback: toasts](../patterns/feedback.md#toasts).
- A response outside the viewport is no response.

**Cases**
- "Copy link" clicked → the button reads "Copied" for a moment; no toast.
- 40 rows deleted → inline banner above the table, "40 findings deleted. Undo", kept until dismissed.
- A background sync fails → a banner at the top of the content; a toast would vanish unread.
- A filter returns nothing → the list says so and offers to clear it ([filtering: empty result](../patterns/filtering.md#empty-result)).

**Accessibility:** 4.1.3 Status Messages (AA): a status is "programmatically determined" so it is presented "without receiving focus". 3.3.1 Error Identification (A). Place kept on a region swap: code-standard rule 14.

**Build:**
- A response that does not move focus is written into a status element present from the first paint (`role="status"`, or `role="alert"` only when it must interrupt); [accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages) owns the markup.
- Write the status in the same handler that changes the view, and announce the outcome ("40 findings deleted"), not the region that changed (code-standard rule 14).
- A swapped region keeps the reader's focus and scroll ([JavaScript: re-rendering without losing focus or scroll](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll)).
- The component that carries it (badge, inline message, banner, toast) is built as its [feedback](../patterns/feedback.md#choosing-the-feedback) section says.

**Check:** *Script*: could perform each action and assert a DOM change within a bound, a status in a live region, inside the viewport. *Judgement*: does the message say what happened and what to do, at a proportionate intrusiveness?

**Sources:** [NN/g, visibility of system status](https://www.nngroup.com/articles/visibility-system-status/) ("a lack of information often equates to a lack of control"). Where Primer and Carbon differ on toasts: [feedback: toasts](../patterns/feedback.md#toasts).

## Response times and perceived performance

**What good looks like**
- The press is acknowledged at once, whatever the work takes.
- No indicator for waits under about a second.
- Long work moves out of the way and can be stopped.

**How:** one threshold table for the product.

| Wait | Show |
|---|---|
| Under 0.1 s | Only the pressed state; feels instantaneous |
| Under ~1 s | Nothing: a flash makes the product "feel slower than it is" ([Primer](https://primer.style/ui-patterns/loading)) |
| ~1–3 s | Indeterminate: a spinner, or a skeleton for a container |
| 3–10 s | Determinate progress where work can be measured ([Fluent](https://fluent2.microsoft.design/wait-ux)) |
| Over 10 s | Determinate progress as a background task, with Cancel |

- Delay the indicator; once shown, keep it long enough not to flicker. No system read publishes a spinner minimum; Adobe Commerce holds a progress bar at least 3 s ("To avoid flickering, the minimum time displayed of progress bar should be 3 seconds"). Pick one short minimum for the product and use it everywhere.
- The press itself answers in the next frame, before any network work: web.dev's INP guidance keeps an event callback to "just the logic required to apply visual updates for the next frame" ([optimize INP](https://web.dev/articles/optimize-inp)).
- Which indicator (skeleton, spinner, progress) and how it is drawn is [feedback: loading](../patterns/feedback.md#loading); a button's own loading state is [actions: loading buttons](../patterns/actions.md#loading-buttons).

**Cases**
- A filter on 200 rows answers in 150 ms → no indicator.
- An export takes 30 s → progress bar in the page, interface usable, Cancel offered.
- Search takes 1.5 s → a spinner in the field after about a second.
- A job of unknown length → indeterminate indicator with a line on what it is doing; never a blocking modal spinner.

**Accessibility:** 4.1.3 (AA) for "Loading" and "Done" without moving focus; 2.2.1 Timing Adjustable (A) if a wait ends in a limit. A busy region during a fetch is a [code candidate](../../code/candidates.md).

**Build:**
- Start the indicator on a timer and cancel it when the response lands, so a fast answer shows nothing; keep it a minimum time once shown:
  ```js
  const show = setTimeout(() => region.setAttribute('aria-busy', 'true'), DELAY);
  const data = await fetch(url, { signal }); clearTimeout(show);
  ```
- `aria-busy="true"` on the region being replaced while it loads (a [code candidate](../../code/candidates.md)), and a short "Loading results" in the status element if the wait passes a few seconds.
- Determinate progress is `<progress value max>`; indeterminate is `<progress>` with no `value`, so both carry a role and a value without ARIA.
- Long work is cancellable: an `AbortController` per request, wired to the Cancel button ([JavaScript: polling and live data](../../code/javascript.md#polling-and-live-data)).
- One `DELAY` constant for the product, from the threshold table, never a figure per component (code-standard rule 22).

**Check:** *Script*: could throttle the network, measure time to first change, to indicator and to content, and fail an indicator on a response under the threshold. *Judgement*: which operations deserve determinate progress?

**Sources:** [NN/g response times](https://www.nngroup.com/articles/response-times-3-important-limits/) (0.1, 1 and 10 s). [Lightning](http://spring-20.lightningdesignsystem.com/guidelines/loading/) (archived Spring '20) shows a stencil after 300 ms; Primer, Fluent and [React Spectrum](https://react-spectrum.adobe.com/v3/Button.html) ("After a 1 second delay") wait about a second, and [Adobe Commerce](https://developer.adobe.com/commerce/admin-developer/pattern-library/feedback-to-user/progress-indicator) 500 ms; the toolkit follows the one-second group. When to turn determinate also splits: Primer and Fluent at about 3 s, [NN/g progress indicators](https://www.nngroup.com/articles/progress-indicators/) at 10 ("use a looped indicator for delays of 2–9 seconds and a percent-done indicator for delays of 10 seconds or more"); the table follows Primer where the work can be measured. The 400 ms Doherty target ([Laws of UX](https://lawsofux.com/doherty-threshold/), commentary) is not used: its paper was not read. All these figures are old conventions, not new measurements.

## Skeletons and spinners

**What good looks like**
- The indicator matches the wait (*Response times* above) and the shape of what is coming; the full guidance is [feedback: loading](../patterns/feedback.md#loading).

**How:** a skeleton for a predictable container, a spinner for one module or action, built and sized as [feedback: loading](../patterns/feedback.md#loading) says; what matters here is that the swap moves nothing (*Layout stability*).

**Cases**
- Three skeleton rows become twenty → the page jumps; size it to the page's row count (*Layout stability*).

**Accessibility:** see [feedback: loading](../patterns/feedback.md#loading) (4.1.3, reduced motion).

**Build:**
- A skeleton is `aria-hidden="true"` boxes inside the region that is `aria-busy`; its height comes from the content type it stands for, not today's row count (code-standard rule 57).
- Its shimmer stops under `@media (prefers-reduced-motion: reduce)` ([accessibility: reduced motion and colour scheme in code](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).
- Sizing so the swap moves nothing is [performance: layout stability in code](../../code/performance.md#layout-stability-in-code).

**Check:** *Script*: could compare skeleton and loaded bounding boxes within `interface.shiftTolerance`. *Judgement*: is the layout predictable enough to skeleton?

**Sources:** as in [feedback: loading](../patterns/feedback.md#loading).

## Layout stability

**What good looks like**
- Nothing moves unless the person moved it.
- After a tab, file or filter switch the controls just used stay put (design-standard rule 2).
- Anything that can appear or load late has reserved space, or sits below the control that changed it.

**How:**
- Keep the footprint of a column, badge, action area or count that applies only sometimes; leave it empty rather than remove it.
- Explicit media dimensions; skeletons sized to content; `scrollbar-gutter: stable` where length varies.
- Loading and error states keep the control's size; a filter bar keeps its height, and on a narrow screen collapses to one "Filters" control rather than wrapping.
- In a design file, draw one screen's states as frames of one size and compare the controls' positions.
- A tool whose columns change per tab keeps the object's header bar and tab line fixed and lets only what is under them change ([sidebars: object header over a tool layout](../patterns/sidebars.md#object-header-over-a-tool-layout)); a capped work area beside regions that open and close is anchored, not centred in the space left.

**Cases**
- An action column and badge vanish for some files and the tabs rise 62px → keep both spaces; the evidence behind design-standard rule 2.
- An "applied filters" row appears above results → reserve it, or put it below the bar.
- A field's error message pushes the submit button down → acceptable: the person's own act, below the control.
- A late banner drops the page 48px mid-read → load into reserved space.

**Accessibility:** no WCAG criterion covers layout shift; magnifier users and anyone with a tremor pay most. Reading order through reflow: code-standard rule 2.

**Build:**
- Reserve space in CSS, not by script: `width` and `height` on media, `aspect-ratio` on embeds, a `min-height` from the content type, `scrollbar-gutter: stable` on a container whose length varies; the detail is [performance: layout stability in code](../../code/performance.md#layout-stability-in-code).
- Content that applies only sometimes keeps its box: an empty cell, a badge slot with `visibility: hidden`, not `display: none` or a removed node.
- A count that changes uses `font-variant-numeric: tabular-nums` in a slot of fixed width.
- Move with `transform`, never `width`, `top` or `margin`; a swap keeps the reader's place (code-standard rule 14).
- design-standard rule 2's own check is `tools/ui-check/check.mjs`; reading order through reflow is code-standard rule 2.

**Check:** *Script*: tools/ui-check/check.mjs: design-standard rule 2 (the tab list's position across switches, within `interface.shiftTolerance`); it could extend to every landmark and collect `layout-shift` entries flagged `hadRecentInput`. *Judgement*: which elements are the landmarks a reader aims at?

**Sources:** [web.dev CLS](https://web.dev/articles/cls) excludes shifts "within 500 milliseconds of user input", so CLS sees nothing on a tab or filter switch, exactly where tools jump; the check is position across states, measured directly. [Primer](https://primer.style/ui-patterns/loading) warns against "a jarring layout shift"; no system states the general rule.

## Undo or confirmation

**What good looks like**
- A reversible action commits at once and offers undo in place.
- Confirmation guards only the rare, irreversible and serious.
- A confirmation names object and consequence, with buttons named for outcomes.

**How:**
- Commit, then Undo beside the change, kept until dismissed; deletes become soft-deletes.
- Confirm permanent deletion, sending to others, external side effects.
- The confirmation dialog itself (title, consequence, outcome-named buttons, focus on the safe one) is [dialogs: confirmation dialogs](../patterns/dialogs.md#confirmation-dialogs); its wording is [content: confirmations and destructive wording](content.md#confirmations-and-destructive-wording).
- Undo shows its result, even off screen, and says what it undoes ([Apple](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo)).

**Cases**
- Archiving a finding → archive, then "Archived. Undo"; routine and reversible.
- Deleting a workspace with its history → a dialog naming both, focus on "Keep workspace".
- A dialog on every row deletion → people stop reading it; undo instead, a dialog only for "delete all".
- Removing a filter chip → neither; one click restores it.

**Accessibility:** 3.3.4 Error Prevention (AA): a review, undo or confirm step for consequential submissions. 2.5.2 Pointer Cancellation (A): completion on the up-event, or abort or undo.

**Build:**
- Undo is a `button` inside the persistent status element that reports the change ("Archived. Undo"), so it is announced and reachable; it calls the inverse of the action, and the server keeps a soft delete it can restore.
- After Undo, focus returns to the restored item, or to where the removed one was (code-standard rule 14; [accessibility: focus management](../../code/accessibility.md#focus-management)).
- A pointer action completes on `click` (the up-event), never on `pointerdown`, so moving off the control abandons it (2.5.2).
- The confirmation is a `dialog` opened with `showModal()`, with `autofocus` on the safe button ([HTML semantics: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- The irreversible action is a `form` with `method="post"`, so it works without script and the confirmation is a server page (code-standard rule 20).

**Check:** *Script*: could assert a destructive control's dialog focuses the safe button, closes on Escape with no effect and has no lone "OK" or "Yes"; and that undo restores state. *Judgement*: serious and irreversible enough to ask?

**Sources:** NN/g ("if you cry wolf too many times, people will stop paying attention") and Apple agree.

## Error prevention and validation timing

**What good looks like**
- Errors are prevented first: constrained inputs, format hints, forgiving formats.
- No error while a field is first being typed.
- An error clears the moment it is fixed; input is kept.

**How:** the toolkit's settled position, which `../patterns/forms.md` applies:
- Check a field on leaving it, only if changed; empty required fields on submit.
- Once in error, re-check on every keystroke so the error clears at once.
- Live checks only for constraints (password rules, character limits), as guidance.
- Submit-only is acceptable for short forms; then the error summary of [forms: error messages and the error summary](../patterns/forms.md#error-messages-and-the-error-summary).
- One timing per form; the message's wording is [content: error messages](content.md#error-messages).

**Cases**
- "Invalid email" after the first letter → check on leaving.
- Tabbing past an untouched required field turns it red → wait for submit.
- A postcode in error → re-check per keystroke, clear when valid.
- A password field → its rules as a live checklist from the start, not errors.

**Accessibility:** 3.3.1 Error Identification (A), 3.3.3 Error Suggestion (AA), 3.3.4 (AA), 1.4.1. The message is the field's description (code-standard rule 15); a live region mounting with its content announces nothing (a [code candidate](../../code/candidates.md)).

**Build:**
- Constrain with the platform first: the input `type`, `inputmode`, `autocomplete`, `required`, `maxlength` ([HTML semantics: forms markup](../../code/html-semantics.md#forms-markup)).
- The timing in code: the `change` event (it fires on leaving a field only when the value changed; `blur` fires on tabbing past), `input` once in error, the summary taking focus on submit. The error markup is [HTML semantics: form errors and validation](../../code/html-semantics.md#form-errors-and-validation).
- The message is the field's description with `aria-invalid="true"`, never part of its name (code-standard rule 15).
- A live constraint checklist (password rules) is a list whose items change state as text, not colour; it is guidance, so it carries no `aria-invalid`.
- Validation is repeated on the server; the client is a convenience (code-standard rule 20).

**Check:** *Script*: could type a partial invalid value and assert no error while focused, blur an untouched required field and assert none, submit and assert focus reaches a summary, fix a value and assert it clears. *Judgement*: does the timing fit the form's audience and length?

**Sources:** on blur from [Baymard](https://baymard.com/blog/inline-form-validation) (commentary; errors "disappearing the moment users enter a valid input"); submit-only from [GOV.UK](https://design-system.service.gov.uk/patterns/validation/) ("Do not validate when the user moves away from a field", for slower typists). The toolkit takes on blur as the default and allows submit-only for short forms, since both forbid mid-keystroke checks and both clear live. This section owns that position; other pages link here.

## Modality

**What good looks like**
- A modal only when the person must decide or finish something short, or to show an item's detail or an explanation (design-standard rule 13), and opened by them; everything else stays in the page.
- Which surface, and how a modal is focused, dismissed and sized, is [dialogs](../patterns/dialogs.md#choosing-the-surface).

**How:** take the least interrupting surface that does the job ([dialogs: choosing the surface](../patterns/dialogs.md#choosing-the-surface)); a modal takes focus, keeps it and gives it back ([dialogs: focus](../patterns/dialogs.md#focus-in-trapped-returned)), closes on Escape and never opens another ([dialogs: Escape, backdrop click and one at a time](../patterns/dialogs.md#escape-backdrop-click-and-one-at-a-time)).

**Cases**
- A session-expiry warning → a justified system modal, since time is running out (2.2.1).

**Accessibility:** 2.1.2 No Keyboard Trap (A), 2.4.3 Focus Order (A), 2.4.11 Focus Not Obscured (AA), as worked out in [dialogs](../patterns/dialogs.md#focus-in-trapped-returned). Code: code-standard rule 20 (opens without script), code-standard rule 19 (`details` gives no Escape).

**Build:**
- A modal is a `dialog` opened with `showModal()`: the browser makes the page inert, closes on Escape and returns focus; no focus-trap library ([HTML semantics: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- It opens without script through `popovertarget` and is enhanced to `showModal()` (code-standard rule 20); `details` gives no Escape (code-standard rule 19).
- Where focus goes on open and close is [accessibility: focus management](../../code/accessibility.md#focus-management).

**Check:** *Script*: see [dialogs: focus](../patterns/dialogs.md#focus-in-trapped-returned). *Judgement*: did the task need a modal?

**Sources:** APG, Carbon and Apple, as linked in [dialogs](../patterns/dialogs.md#choosing-the-surface).

## Saving: explicit or automatic

**What good looks like**
- A control that acts at once saves itself; a form saves with a button.
- Never both in one form.
- The person can always tell whether a change is saved.

**How:**
- Start a form explicit ([Primer saving](https://primer.style/ui-patterns/saving)). Toggle switches, segmented controls and single-select menus outside a form save automatically; checkboxes, radios and fields in a form wait.
- Beside auto-saved controls: "Saving…", "Saved", "Couldn't save. Retry"; input kept on failure.
- An unseen save is confirmed inline, or by banner after a reload; explicit forms warn before leaving unsaved.
- Auto-save removes the moment to reconsider; pair it with undo where it matters.

**Cases**
- Toggles above a "Save" button → mixed; make them checkboxes, or drop the button.
- "Show resolved" switch above a list → applies and saves at once.
- A five-field profile → "Save profile", values kept on failure.
- An auto-saving notes field → "Saved 10:42" beside it; on failure, Retry, never silent loss.

**Accessibility:** 4.1.3 (AA) for save status. 3.2.2 On Input (A): changing a setting causes no "change of context" unless announced first; auto-save updates content, never navigates or moves focus.

**Build:**
- An explicit form is a `form` with one submit button; an auto-saving control sits in its own small form whose submit the script hides and replaces with a request on `change` (code-standard rule 20).
- The save status is one persistent `role="status"` element beside the controls; a failure keeps the value and names the reason (code-standard rules 14 and 61).
- Unsaved explicit forms warn with `beforeunload`, added on the first edit and removed on save.
- All three are [JavaScript: saving automatically](../../code/javascript.md#saving-automatically).

**Check:** *Script*: could flag a form holding a switch and a submit button, and assert auto-save sends a request and a status without submit. *Judgement*: is the setting imperative or declarative?

**Sources:** Primer ("never mix save patterns in a single form"), the only system with a full rule set.

## Disabled, hidden or read-only

**What good looks like**
- The treatment follows the cause.
- A temporarily unavailable option stays in place, disabled (design-standard rule 5).
- A disabled control's reason is said nearby when not obvious.

**How:**

| Cause | Treatment |
|---|---|
| Unavailable until another choice | Disabled, in place, with the reason |
| Visible but locked to this person | Read-only: readable, copyable, reachable by screen reader |
| Not permitted | Hidden |
| Never applicable here | Not drawn (design-standard rule 5) |
| Outage | Hidden if minor; if critical, inactive with the failure explained ([Primer](https://primer.style/ui-patterns/degraded-experiences)) |

- Why a reason nearby: WCAG exempts inactive components from contrast, so disabled is hard to read by design, and it usually leaves the tab order, so keyboard and screen-reader users may never meet it. The reason goes in adjacent text, not a hover tooltip.
- A count that cannot be computed is hidden, never a false zero (Primer).
- A submit button stays enabled; validation says what is missing ([actions: disabled buttons](../patterns/actions.md#disabled-buttons)).

**Cases**
- Filter options at zero, an empty menu, a filter that can never apply → [filtering: unavailable options](../patterns/filtering.md#unavailable-options).
- "Publish" awaits approval → keep it disabled with "Needs one approval" beside it.
- A viewer on settings → read-only fields, not disabled inputs.
- A panel that reports values for reading and copying → a label-value list, not the editor greyed ([property editors: read-only inspect list](../patterns/property-editors.md#read-only-inspect-list)).

**Accessibility:** 1.4.3 and 1.4.11 exempt inactive components, hence the reason elsewhere. Code: code-standard rule 9, code-standard rule 62; the reason as a description, code-standard rule 15.

**Build:**
- Disabled is the control's own `disabled`, or `aria-disabled="true"` where it must stay focusable to explain itself; a link drops its `href` (code-standard rules 9 and 62; [HTML semantics: links and buttons](../../code/html-semantics.md#links-and-buttons)).
- The reason is visible text tied to the control with `aria-describedby` (code-standard rule 15), never a `title` or hover tooltip.
- Read-only text fields are `readonly`; a read-only screen renders values as text, or `inert` on a region; never `pointer-events: none` ([accessibility: hidden content](../../code/accessibility.md#hidden-content)).
- Hidden for permission means not rendered by the server, not `hidden` in the page; the server enforces it ([security: forms and cross-site request forgery](../../code/security.md#forms-and-cross-site-request-forgery)).
- The dim is the host's, once ([tokens: the disabled opacity, once](../../code/tokens.md#the-disabled-opacity-once)).

**Check:** *Script*: tools/ui-check/check.mjs: design-standard rule 5 (a menu with nothing to choose not disabled; an option hidden in place); it could also fail a disabled control with no description, and one disabled in every state. *Judgement*: what is the cause, and can this ever apply here?

**Sources:** [Carbon disabled states](https://carbondesignsystem.com/patterns/disabled-states/), [NN/g drop-downs](https://www.nngroup.com/articles/drop-down-menus/) ("Gray out any unavailable options"), [Smashing](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/) (commentary: disable and explain). Primer's "never disable" for outages is a different cause, applied to its own.

## Choosing a control for a choice

**What good looks like**
- The control follows what the choice changes: content, a view of the same content, or a value.
- Few choices are all in sight; many are a menu showing choice and counts.
- One bar per list (design-standard rule 3).

**How:**
- **Tabs**: views of one context, never to filter one table (design-standard rule 3; [navigation: tabs](../patterns/navigation.md#tabs)).
- **Segmented**: two to four short choices that apply at once (design-standard rule 4, `interface.maxSegments`); not navigation ([selection: segmented control](../patterns/selection.md#segmented-control)).
- **Menu**: past four, each option counted, opening on what "all" covers (design-standard rules 4, 11, 12; [filtering: facet controls](../patterns/filtering.md#facet-controls)).
- **Radios**: a value saved with a form; **checkboxes**: several values at once; which value control by option count is [selection: choosing the control](../patterns/selection.md#choosing-the-control).
- Order and narrow facets as design-standard rule 6 sets out ([filtering: faceted narrowing and order](../patterns/filtering.md#faceted-narrowing-and-order)).

**Cases**
- A filter of 12 values → a menu with counts; segmented past four wraps (design-standard rule 4).
- Three severity levels → segmented; a menu hides three choices (design-standard rule 4).
- Light and dark preview of one component → segmented: a view of the same content.
- A preference in a form with Save → radios; a segment promises an instant save.

**Accessibility:** 1.3.1 Info and Relationships (tablist roles; a named group for segments), 2.1.1 Keyboard (A), 3.2.2 On Input (A). Counts as descriptions: code-standard rule 15; current navigation item: code-standard rule 64.

**Build:**
- Tabs are the APG tabs pattern, or links with `aria-current` when they change the address ([accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex); code-standard rule 64).
- A segmented control that applies at once is a named `role="group"` of buttons with `aria-pressed`, or radios styled as segments inside a filter bar's GET form ([selection: segmented control](../patterns/selection.md#segmented-control) owns the build); a choice saved with a Save button is radios, not segments.
- A menu of values is a `select`, or a `popover` listbox when it needs counts and type-ahead; counts sit outside the option's name (code-standard rule 15).
- Radios and checkboxes in a form are `fieldset` and `legend` ([HTML semantics: forms markup](../../code/html-semantics.md#forms-markup)).

**Check:** *Script*: tools/ui-check/check.mjs: design-standard rules 3, 4 and 12; it could also check roles, arrow keys, and counts against rows. *Judgement*: content or view, and is a menu of four or fewer right here?

**Sources:** [eBay](https://playbook.ebay.com/design-system/components/segmented-button) (two to four), [Anvil](https://anvil.servicetitan.com/docs/web/patterns/filters.md), [Primer](https://github.com/primer/design/blob/main/content/components/segmented-control.mdx) (up to five), [Carbon tabs](https://carbondesignsystem.com/components/tabs/usage/). The toolkit takes four, with design-standard rule 4; Carbon's search-left table loses to design-standard rule 3. This section owns the segment-or-menu limit; the count of options for value controls is [selection: choosing the control](../patterns/selection.md#choosing-the-control).

## Keyboard parity and shortcuts

**What good looks like**
- Everything a pointer does, the keyboard does, in the screen's order.
- Standard keys keep their meaning: Tab between, arrows within, Enter and Space activate, Escape cancels.
- Shortcuts speed experts and never surprise anyone.

**How:**
- Native elements first; a custom widget follows its APG pattern in full; one tab stop per composite.
- Escape closes overlays and returns focus.
- Focus order is designed here (annotate where visual order is ambiguous); code-standard rule 2 keeps it.
- Never repurpose a standard shortcut ([Apple](https://developer.apple.com/design/human-interface-guidelines/keyboards)). A single-character shortcut can be turned off or remapped, or works only while its component has focus; shortcuts are listed and shown beside their commands.

**Cases**
- A row opens on click with no link → link the row's title; Enter and middle-click work (code-standard rule 21).
- A `role="menu"` answers no arrows → wire the APG keyboard or go native.
- `/` focuses search even inside a text field → only when no field has focus, and switchable off.
- A filter panel traps focus with no Escape → add Escape and close; only a modal holds focus.

**Accessibility:** 2.1.1 Keyboard (A); 2.1.2 No Keyboard Trap (A); 2.1.4 Character Key Shortcuts (A): off, remap, or "only active when that component has focus"; 2.4.3, 2.4.7. Code: code-standard rules 2, 14, 19, 21; Figma focus ring: figma-standard rule 31.

**Build:**
- Native elements give Tab, Enter and Space; a custom composite is one tab stop with the APG keys for its role ([accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex)).
- Tab order is DOM order; no positive `tabindex` (code-standard rule 2; [accessibility: keyboard access and modified clicks](../../code/accessibility.md#keyboard-access-and-modified-clicks)).
- Modified and middle clicks stay the browser's; a clickable row is a stretched link (code-standard rule 21).
- Shortcuts are one document listener that skips fields, are declared with `aria-keyshortcuts`, shown with `<kbd>`, and can be turned off ([accessibility: keyboard shortcuts](../../code/accessibility.md#keyboard-shortcuts)).
- Escape closes overlays: `dialog` and `popover` do it themselves; `details` does not (code-standard rule 19).

**Check:** *Script*: could tab-walk the page and fail an unreached control, an order leaving visual order, an overlay Escape does not close, dead arrows in a composite, or focus that cannot leave. *Judgement*: is the designed order logical where layout is ambiguous?

**Sources:** Apple, [APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [WCAG 2.1.4](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html) agree.

## Targets and pointer

**What good looks like**
- Every target at least 24 by 24 CSS pixels, or spaced as if it were.
- Touch-first surfaces at 44 pt or 48 dp.
- Frequent actions near the pointer; destructive ones apart.

**How:**
- 24×24 px floor; an undersized target passes if a 24px circle centred on it meets no other target; inline links are exempt ([WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)).
- A small icon gets a larger hit area through padding.
- Touch: 44×44 pt ([Apple](https://developer.apple.com/design/human-interface-guidelines/accessibility)); 48×48 dp, 8 dp apart ([Android](https://support.google.com/accessibility/android/answer/7101858)); no leaning on the spacing exception.
- Fitts: time depends on size and distance ([NN/g](https://www.nngroup.com/articles/fitts-law/)); primary action by its content, Delete away from Save.

**Cases**
- Row-action icons 16px, 4px apart → 24px hit areas, or spacing so circles do not meet.
- A 12px dialog "×" → a 24px (touch 44pt) hit area round the same glyph.
- Delete beside Save → separate them, or move delete into a menu.
- A mobile filter sheet with 32px chips → 44pt or 48dp rows.

**Accessibility:** 2.5.8 Target Size (Minimum) (AA). Figma: figma-standard rule 26 (stricter, no spacing allowance); page: a [code candidate](../../code/candidates.md); icon-only names: code-standard rule 18.

**Build:**
- Grow the hit area, not the glyph: padding on the `button`, or a pseudo-element extending its box, so a 16px icon has a 24px target.
- Under `@media (pointer: coarse)` widen gaps or rows to the touch figure; width says nothing about touch ([responsive: touch targets](../../code/responsive.md#touch-targets)).
- Target sizes are tokens, not literals (code-standard rule 22); an icon-only control has a name (code-standard rule 18).

**Check:** *Script*: could measure every interactive box and fail under 24×24 unless spaced, flagging under 44 on touch-first surfaces; figma-components-audit reads figma-standard rule 26. *Judgement*: which surfaces are touch-first?

**Sources:** WCAG, Apple and Android set different figures for different surfaces; the toolkit gates 24px everywhere and the platform figure on touch.

## Gestures and drag

**What good looks like**
- Anything done by dragging or gesture can be done with a single pointer, no path.
- The alternative is visible.
- Pointer actions complete on release and can be abandoned.

**How:**
- Sortable list: "Move up", "Move down" or "Move to…" per item, and keyboard reordering.
- Map or canvas: pan and zoom buttons. Slider: track clicks, arrow keys, a typed value where precision matters.
- Swipe actions repeated in a visible menu; pinch has a single-pointer equivalent.
- Drag shows a lifted state and drop indicator; dropping outside cancels.
- **The carried item** is a copy of the item under the pointer, held where it was grabbed, raised by a shadow, translucent or plain, never rotated (Atlassian: "Do not rotate the drag preview"; Apple: a "translucent representation… lets people see destinations").
- **Where it lands** is one of two marks. A line in the gap between items, the others still, is the design systems' default for lists and trees (Atlassian, React Aria, Fiori's lists). An in-place slot, the item itself dashed where it will land with the others easing aside, is Fiori's grid model and what sortable libraries draw; it shows the result rather than describing it, at the cost of rows moving under the pointer. Pick one per product.
- **In a tree** the mark shows depth: a line indented to the level the drop takes, or the slot inside the container's list; a drop *onto* a container is marked differently from a drop between items (Atlassian: a border around the target for "combine"). A collapsed container expands when hovered for about 500ms.
- **Items easing aside** take about 200ms on a quick-out, long-tail curve (react-beautiful-dnd: `0.2s cubic-bezier(0.2, 0, 0, 1)`; dnd-kit 250ms); under reduced motion they move without easing, and the mark carries the meaning.
- **Escape**, or a release off any target, puts the item back where it started (Fiori: "snap back to its initial position").

**Cases**
- Kanban cards move only by drag → a "Move to column" menu per card.
- Column reorder by drag → a "Columns" menu with up and down.
- A slot that moves with the drop flickers back and forth under a still pointer → the slot is hit-testable (not `inert`), a pointer over a gap or over a row still easing keeps the drop, and positions are read as laid out, not as transformed mid-ease.
- A resizable panel → a button stepping its width.
- An image cropper → handles take arrows; numeric fields too.

**Accessibility:** 2.5.7 Dragging Movements (AA): dragging "can be achieved by a single pointer without dragging". 2.5.1 Pointer Gestures (A): operable "with a single pointer" without a path. 2.5.2 (A); 2.1.1 (A).

**Build:**
- The single-pointer alternative is built first as plain buttons ("Move up", "Move to…") on the same move function; the drag is the enhancement (code-standard rules 20 and 36).
- Pointer events with `setPointerCapture()`, committing on `pointerup` and restoring on `pointercancel` or Escape; `touch-action: none` on the handle only, so the page still zooms.
- The new position is announced in a persistent status element, and focus stays on the moved item (code-standard rule 14).
- The detail is [JavaScript: dragging and its single-pointer alternative](../../code/javascript.md#dragging-and-its-single-pointer-alternative); a slider's keys are the native `input type="range"`'s.

**Check:** *Script*: could flag `draggable` elements or pointer-move handlers with no sibling control for the same action; equivalence is not scriptable. *Judgement*: does every drag and gesture have a visible single-pointer twin?

**Sources:** [WCAG 2.5.7](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html) (its examples: a sortable list with up and down controls, a map with directional buttons), [2.5.1](https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html), [2.5.2](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation.html). Visuals: [Atlassian, Pragmatic drag and drop design guidelines](https://atlassian.design/components/pragmatic-drag-and-drop/design-guidelines) and [drop indicator](https://atlassian.design/components/pragmatic-drag-and-drop/optional-packages/react-drop-indicator/about), [SAP Fiori, reorder](https://www.sap.com/design-system/fiori-design-web/v1-136/foundations/interaction/drag-and-drop/reorder), [Apple HIG, drag and drop](https://developer.apple.com/design/human-interface-guidelines/drag-and-drop), [React Aria, drag and drop](https://react-aria.adobe.com/dnd), [react-beautiful-dnd, animations](https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/about/animations.md), [dnd-kit, sortable](https://dndkit.com/presets/sortable). Polaris, Carbon and Fluent publish no reorder visuals; no system writes reduced-motion guidance for drag.

## Hover-only affordances

**What good looks like**
- Nothing that matters is reachable only by hover: no action, information or label.
- Hover hints at what is already visible or reachable.
- Content shown on hover or focus can be dismissed, hovered over, and persists.

**How:**
- Row actions show at rest or behind a visible "More" per row; keyboard and touch have no hover.
- A tooltip repeats or explains, and is never the only reason for a disabled state; what hover shows, focus shows. How tooltips behave, and how one names an icon button, is [dialogs: tooltips](../patterns/dialogs.md#tooltips).
- Hover or focus content: Escape dismisses it without moving pointer or focus; the pointer can move onto it; it stays until trigger leaves, dismissal, or invalidity.
- Menus open on click; truncated text has its full value reachable another way.

**Cases**
- Edit and delete icons appear on row hover → show them, or a visible "…" menu.
- A disabled button explains itself only in a tooltip → the reason in text beside it.
- A tooltip vanishes as the pointer heads for its link → keep it while hovered (1.4.13), or make it a click popover.
- A truncated file name full only on hover → [disclosure: show more and truncation](../patterns/disclosure.md#show-more-and-truncation).

**Accessibility:** 1.4.13 Content on Hover or Focus (AA): dismissible, hoverable, persistent. 2.1.1 Keyboard (A). 1.4.11 treats hover effects as supplementary, so they may be subtle and carry nothing essential.

**Build:**
- Anything revealed on hover is revealed on focus too: pair `:hover` with `:focus-within` on the same container, and keep hover-only styling inside `@media (hover: hover)`.
  ```css
  @media (hover: hover) {
    tr:not(:hover, :focus-within) [data-actions] { opacity: 0; }
  }
  ```
- Hide with `opacity`, never `display: none` or `visibility: hidden`, which take the actions out of the tab order; on a device without hover they show at rest.
- A menu opens on click: a `button` with `popovertarget`, or the APG menu button ([accessibility: menus, menu buttons and toolbars](../../code/accessibility.md#menus-menu-buttons-and-toolbars)).
- Hover-or-focus content follows 1.4.13 in code (Escape dismisses, the pointer can reach it): [accessibility: tooltips and toggletips](../../code/accessibility.md#tooltips-and-toggletips).

**Check:** *Script*: could find elements revealed only under `:hover` that hold interactive children and fail any not also revealed by `:focus-within`; could test hover popups close on Escape and survive the pointer moving onto them. *Judgement*: is anything learned or done only by hovering?

**Sources:** [WCAG 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html), Polaris (hover-revealed signifiers can never be the only one). NN/g suggests a hover explanation for a disabled option; the toolkit keeps it as a hint and requires the reason reachable without hover.
