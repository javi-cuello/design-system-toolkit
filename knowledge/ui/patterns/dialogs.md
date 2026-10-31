# Dialogs, drawers, popovers and tooltips

Surfaces that appear over or beside a page: when to use a modal dialog, an inline expansion, a new page, a drawer or side sheet, a popover or a tooltip; when a task outgrows a modal and needs its own page; how a modal dialog is built, focused, dismissed, sized and scrolled; when a confirmation earns its place; and how drawers, popovers and tooltips behave. It serves design-standard's principles *people in control, mistakes forgiven* (an obvious exit, nothing lost), *serve a real need* (interrupt only when it matters) and *show state and give feedback*, and owns three things other pages link to: a dialog is opened by the person, takes focus, keeps it and gives it back; the confirmation dialog; and no dialog that opens a dialog (the commonest breach of the two-level disclosure limit). Modality as a fundamental is in [`../design/interaction.md`](../design/interaction.md) (*Modality*, *Undo or confirmation*); the button rules a dialog footer uses are in [`actions.md`](actions.md).

## Choosing the surface

**Use when / don't use**
- Use this before drawing any overlay: the choice of surface is the first decision, and no styling rescues the wrong one.
- Take the least interrupting surface that is enough: inline, then popover, then drawer, then modal dialog, then a new page when the task is too big for any of them.
- Don't open any of them without the person's action. Carbon's [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/): "Don't use when the user hasn't triggered the dialog."

**How**

| Need | Surface | Why |
|---|---|---|
| A hint about a control, a few words, nothing to click | Tooltip | Hover and focus only; never essential |
| Extra detail or a few controls tied to one element; page stays usable | Popover (non-modal, light dismiss) | Carbon: up to four grid columns, else a modal |
| Show more of the content itself, in reading flow | Inline disclosure ([`disclosure.md`](disclosure.md)) | Keeps context, no overlay |
| A preview or settings while the page stays in view | Drawer or side sheet | Carbon's non-modal dialog; Primer's right side sheet |
| A decision or short required input before going on | Modal dialog | Carbon: "critical information or request required input" |
| A long, multi-step or deep-linkable task | A page | Carbon: "A modal is not an alternative to page" |

- **Modal** when the person must decide or supply something before continuing, or must not miss an urgent consequence of their own action. NN/g's [modal and nonmodal dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/): use modals "for important warnings", to request information "critical to continuing the current process", and avoid them for "nonessential information" and "complex decision making that requires additional sources of information unavailable in the modal".
- **Non-modal** when the person needs the page while the surface is open (find and replace, a comparison). Carbon: "Use when a user needs to compare or refer to information in the main page."
- **Page** when the task has steps, needs navigation inside it, or should have its own address. Primer's [dialog](https://primer.style/product/components/dialog/guidelines/) on deep linking: "it is often more advisable to avoid using a Dialog altogether" and create a dedicated page. Apple's [modality](https://developer.apple.com/design/human-interface-guidelines/modality): avoid "a modal experience that feels like an app within your app".
- **An item's detail or an explanation** (a row's checks, "what the levels mean") opens in a dialog or a side panel, not in place: design-standard rule 13 is the toolkit's choice between the inline and overlay rows above.
- **Never for news.** System messages go to toasts or banners ([feedback: choosing the feedback](feedback.md#choosing-the-feedback)); Carbon reserves modals for critical information "immediately related to their task".

**Cases**
- Editing one field of a record (a name) → inline edit in place; a modal for one field hides the record being edited.
- "Add item" with four fields → a modal dialog: short, self-contained, user-initiated (Carbon's example of a simple dialog task).
- A twelve-field create form with sections → a page; on a narrow screen Primer makes any dialog with inputs full-screen anyway.
- Choosing columns for a table → a popover from the "Columns" button: a few checkboxes, the table visible behind.
- A newsletter prompt three seconds after landing → none of them. NN/g reports "visceral disdain" for such modals.

**Accessibility**
- 3.2.1 On Focus and 3.2.2 On Input: no surface opens because focus arrived or a value changed without warning; opening is an explicit activation.
- 2.4.3 Focus Order: each surface has a designed focus entry and exit (sections below).
- Native elements first: `dialog`, `popover` and `details` before a registered component (code-standard rule 8); a modal opens from `popovertarget` before `showModal()` enhances it (code-standard rule 20).

**Build**
- Tooltip: `role="tooltip"` text tied by `aria-describedby` or `aria-labelledby`. Popover: `popover` opened by `popovertarget`. Inline disclosure: `details`. Modal: `dialog` with `showModal()`. Page: a link ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- Native elements before a registered component (code-standard rule 8); a hand-built overlay `div` is the last resort.
- Every surface has a no-script path: a `dialog` that is also a `popover` opens from `popovertarget` before the script upgrades it (code-standard rule 20).
- Nothing opens on load, scroll or a timer; opening is the trigger's click handler or `popovertarget`.
- A task with its own address is a page, or a dialog whose state lives in the address ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).

**Check**
- *Script* could: on load, assert no `dialog[open]`, open popover or overlay exists before any interaction; list overlays that opened after a scroll or timer.
- *Judgement*: is this the least interrupting surface that does the job, and would the task be better as a page?

**Sources.** Carbon, NN/g, Apple and Primer agree on modals for short, critical, user-initiated tasks and pages for anything larger. They differ on how much a dialog may hold: Primer treats dialogs as a way to "add responsive support, and avoid deeper navigations" for single-context features, while Carbon warns against data tables, tabs and accordions inside one. The toolkit follows Carbon's stricter line: a dialog holds one task.

## A modal or a page of its own

**Use when / don't use**
- Use this when the choice above has narrowed to a modal dialog or a page, which is where most wrong surfaces are chosen: a task starts small in a dialog and grows until it is a page drawn in a box.
- A modal for a short, one-step task that belongs to the page behind it and needs nothing the dialog cannot show. NN/g's [modal and nonmodal dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/): "Modal dialogs should be used for short, direct dialogs with the user."
- Never a page inside a dialog. Carbon's [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/): "Don't recreate a full app or page in a dialog"; Primer's [dialog](https://primer.style/product/components/dialog/guidelines/): "Avoid creating a whole page inside a Dialog."

**How**

| Signal | Modal | Page |
|---|---|---|
| Length | Fits the largest dialog size with little scrolling | Needs more than the largest size (Carbon: "displayed on a page of its own") |
| Steps | One | Several; NN/g: "it probably justifies dedicating a full page to it" |
| Address and Back | Nobody links to it; Back need not reopen it | Linked from outside, bookmarked or shared; Back must return to it |
| Information | Everything needed is in the dialog | Needs facts from elsewhere |
| Navigation inside | None | Tabs, sections, a side list |
| The page behind | Is the context, and stays meaningful | Is irrelevant to the task |

- **One page signal is enough.** A dialog that needs an address, Back, steps or its own navigation is imitating a page, and each imitation is script the browser already gives a page.
- **The address test first.** Primer: "It's crucial to consider if the Dialog should be accessible via a link"; a dialog opened from URL parameters dims a page the person never saw. Anything mailed, linked from help or bookmarked is a page.
- **Information from elsewhere.** Atlassian's [modal dialog](https://atlassian.design/components/modal-dialog/usage): "Avoid complex decision-making that requires additional information not available in the modal." Bring the fact into the dialog, or make the task a page; if the person must compare with the page behind, a non-modal drawer.
- **Steps.** Atlassian: "Avoid multiple steps that require navigation within the modal dialog." A multi-step task is a sequence of pages with a step indicator ([steppers: step indicators](steppers.md#step-indicators)).
- **Why short tasks stay modal.** Carbon: dialogs "are less disorientating than navigating a user to a new page for simple tasks or knowledge gathering". The page is the escalation, not the default.
- **GOV.UK** ships no modal in GOV.UK Frontend (its [backlog discussion](https://github.com/alphagov/govuk-design-system/discussions/6148) has been open since 2018) and builds tasks as [question pages](https://design-system.service.gov.uk/patterns/question-pages/), "just one question per question page", with a Back link to "the previous page they were on, in the state they last saw it".

**Cases**
- Editing a five-field address from an account overview → a modal: one step, and the overview is its context.
- An import with file choice, column mapping and review → three pages with a step indicator; Back returns to mapping with the choices kept.
- A help article links to "Change your plan" → a page; a link must land on the task, not on a page with a dialog to find.
- A dialog asks for an ID the person must look up on another screen → show the IDs in the dialog as a choice, or make it a page.
- A record's details with history and comments tabs, opened from a list → a page; a quick look stays a drawer.

**Accessibility**
- 2.4.2 Page Titled: a page has its own title, announced on arrival and kept in history; a dialog has only its accessible name.
- 2.4.5 Multiple Ways: a page can be reached from navigation, search and links; a dialog only from its trigger.
- 2.4.3 Focus Order: a page needs no trap or return; the focus contract below is complexity a page avoids.

**Build**
- A page task is a link to its own URL with a server-handled form, so the address, Back and a no-script path come free ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons); code-standard rule 20).
- A short task that also has a page can start as a link to that page that script upgrades to a `dialog`; modified clicks still open the page (code-standard rule 21; [accessibility: *Keyboard access and modified clicks*](../../code/accessibility.md#keyboard-access-and-modified-clicks)).
- A dialog that must have an address keeps its state in the URL and closes on Back ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Multi-step pages follow [steppers: *Step navigation*](steppers.md#step-navigation-back-continue-save-and-return) and [navigation: *Back behaviour*](navigation.md#back-behaviour).

**Check**
- *Script* could: flag a `dialog` holding a `tablist`, a `nav`, more than one `form` step or a body that scrolls well past its own height; flag a dialog opened from URL parameters that Back does not close.
- *Judgement*: would anyone link to, bookmark or press Back into this task? If so, it is a page.

**Sources.** NN/g, Carbon, Primer and Atlassian agree: short single-step tasks in a modal, multi-step, long or reference-heavy tasks on a page. GOV.UK goes furthest and treats pages as the default. Primer allows opening a dialog from URL parameters; the toolkit makes any task that needs an address a page, following Primer's own advice for links from outside and GOV.UK's practice, because Back and the title then work without imitation.

## Modal dialog anatomy

**Use when / don't use**
- Every modal dialog has a title, a body, actions, and a visible close.
- Don't add a description when the title says it all. Carbon's [modal](https://carbondesignsystem.com/components/modal/usage/): if "the title and the purpose are clear… a description is not needed."

**How**
- **Title**: names the task as a short verb phrase. Carbon: "If the modal is accessed by clicking a button, use the button label for the modal title" ("Create access group" opens "Create access group"). Primer: "The title is required for all Dialogs", visually hidden only for special cases such as a command palette.
- **Body**: only what the task needs. Carbon: "Include only fields, components, and embedded assistance that are relevant to completing the current task", and avoid links that take the person away.
- **Actions**: named for outcomes, never "OK" (see [`actions.md`](actions.md), *Button labels*). One primary per dialog, on the trailing side, Cancel leading (Carbon; Primer; Apple). A third action, if any, is quieter and at the far leading edge.
- **Close**: an always-visible close button in the header. Primer: "The close button is required and may not be visually hidden." The W3C [dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) recommends "a visible element with role button that closes the dialog". Close and Cancel discard; neither submits (Carbon).
- **Backdrop**: dims the page so the person sees it is unavailable. The W3C pattern marks a dialog modal only when outside content is both inert and visually obscured.
- **Validation**: errors show inside the dialog and it stays open. Carbon: "Validate a user's entries before the modal is closed."

**Cases**
- A button "New project" opens a dialog titled "Create a new project" → title "New project", matching the trigger; Carbon warns against mixing "New user" and "Create user".
- A dialog whose footer reads "OK / Cancel" → "Create project / Cancel".
- A dialog with no close button and only "Done" → add a close button and Cancel; Apple's [sheets](https://developer.apple.com/design/human-interface-guidelines/sheets): pair Done with Cancel, since "Relying solely on the Done button implies that completing the task is the only way to exit".

**Accessibility**
- 4.1.2 Name, Role, Value: the dialog is named by its visible title (`aria-labelledby`); the close button has a name (code-standard rule 18).
- 1.3.1 Info and Relationships: the title is a heading; long bodies keep their headings and lists.
- The W3C pattern advises omitting `aria-describedby` when the body has structure (lists, tables, several paragraphs), since it would be read "as a single unbroken string".

**Build**
- `dialog` named by its heading with `aria-labelledby`; header, body and footer as plain children, the footer a button group ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
  ```html
  <dialog id="new-project" aria-labelledby="np-h"><form method="dialog">
    <header><h2 id="np-h">New project</h2>
      <button value="cancel" formnovalidate aria-label="Close"><svg aria-hidden="true">…</svg></button></header>
    <div>…</div><footer>…</footer></form></dialog>
  ```
- A button in a `form method="dialog"` closes it with no script and sets `returnValue`; the close button is named and its glyph hidden (code-standard rule 18).
- `::backdrop` paints the dim from a token (code-standard rule 22).
- Validation errors render inside the dialog's `form`; the submit handler keeps it open until the server accepts ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- No `tabindex` on `dialog`; `aria-describedby` only for a short, unstructured body.

**Check**
- *Script* could: for each `dialog` or `role="dialog"`, assert an accessible name, a visible close button in the tab sequence, and no footer button named OK, Yes or No.
- *Judgement*: does the title name the task in the trigger's words?

**Sources.** Carbon, Primer, Apple and the W3C agree on the anatomy; only Primer makes the close button mandatory and never hidden, and the toolkit adopts that, since Escape is unknown to many pointer users.

## Focus: in, trapped, returned

**Use when / don't use**
- Every modal dialog. A dialog is opened by the person, takes focus, keeps it, and gives it back to its trigger on close.

**How**
- **In.** On open, focus moves inside. Where to, per the W3C [dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/):
  - generally the first focusable element;
  - the title or first paragraph (made focusable with `tabindex="-1"`) when the content is long or structured, so its start does not scroll out of view;
  - the least destructive action for "a process that is not easily reversible";
  - the most used button when the dialog only informs or continues.
  Carbon adds: the first field when there is a form, the primary button in a transactional dialog without inputs. MDN's [`dialog`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) recommends `autofocus` on the intended element.
- **Trapped.** Tab and Shift+Tab wrap inside the dialog; the page behind is inert. `showModal()` gives inertness and Escape.
- **Returned.** On close, focus goes back to the element that opened it, unless that element no longer exists or the next step logically lives elsewhere (W3C). After "Delete row", focus goes to the next row or the table, never to the document start.
- Design the return target in the file, as an annotation, for every dialog whose trigger disappears.

**Cases**
- A "Rename" dialog → focus in the name field, text selected.
- "Delete project?" → focus on Cancel; Enter pressed by reflex does nothing harmful.
- A terms dialog with six paragraphs → focus on the title, so a screen reader starts at the top and the person can read down.
- "Add rows" opens a dialog asking how many → after it closes, focus on the first new row (the W3C's own example).

**Accessibility**
- 2.4.3 Focus Order: entry and return as above; the W3C's Understanding 2.4.3 uses a modal dialog as its example.
- 2.1.2 No Keyboard Trap: a modal is a sanctioned trap only because Escape and the close button leave it ([W3C Understanding 2.1.2](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html): focus can be moved away "using only a keyboard interface").
- 2.4.11 Focus Not Obscured (Minimum): a sticky dialog footer does not cover the focused field while tabbing through a scrolling body.
- Return of focus is not yet a code-standard rule; code-standard rule 14 covers the related case of a live swap.

**Build**
- `showModal()` gives inertness, the trap and the focus return; `autofocus` marks the element to focus on open ([accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- Long or structured content: `tabindex="-1"` and `autofocus` on the heading, so reading starts at the top.
- Irreversible confirmation: `autofocus` on Cancel.
- Trigger gone on close: the `close` event handler focuses the designed target (the next row, the list heading), never `body` (code-standard rule 14).
  ```js
  dialog.addEventListener('close', () => { if (!trigger.isConnected) next.focus(); });
  ```
- No focus-trap library: `inert` comes with `showModal()` ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).

**Check**
- *Script*: mostly mechanical. Could: open each dialog by keyboard; assert focus is inside; Tab from the last element reaches the first; Escape closes; focus returns to the trigger; elements outside are inert while open.
- *Judgement*: is initial focus where the person's next action is, and is it the safe choice when the action is irreversible?

**Sources.** The W3C and Carbon disagree on a destructive confirmation without inputs: Carbon focuses the primary, the W3C advises the least destructive action, and Apple suggests making no button the default when people should read. The toolkit follows the W3C: focus Cancel in any irreversible confirmation.

## Escape, backdrop click and one at a time

**Use when / don't use**
- Escape closes every modal dialog, always.
- A backdrop click closes a dialog only when closing loses nothing.
- Only one modal surface at a time; never a dialog that opens a dialog.

**How**
- **Escape**: closes without submitting (W3C; Carbon lists Esc for every variant). Native `showModal()` provides it; a custom dialog must.
- **Backdrop click**: Carbon allows "click elsewhere" only for passive, information-only modals; transactional, progress and acknowledgment modals close by their buttons, the close icon and Escape. Primer dismisses on backdrop click by default, but "if the Dialog contains a form that can have unsaved changes, the backdrop won't dismiss the Dialog". The native `closedby` attribute on `dialog` sets this per dialog (MDN).
- **Unsaved input**: if any way of closing would lose what the person typed, confirm first. Apple's [modality](https://developer.apple.com/design/human-interface-guidelines/modality): "if closing the view could result in the loss of user-generated content, be sure to explain the situation and give people ways to resolve it."
- **One at a time**: Carbon: "One modal should never trigger another modal. If the first modal task is dependent on a confirmation modal to approve then that first task should not be preformed in a modal." Apple: "Let people dismiss a modal view before presenting another one", though an alert may appear over other modal views.
- **The one exception**: the discard-changes confirmation when closing a dirty dialog may sit over it (Apple's alert exception). Anything else that needs a second dialog belongs on a page.

**Cases**
- An information dialog ("What's new") → Escape, close button and backdrop click all close it.
- An edit dialog with typed changes → backdrop click does nothing; Escape or Cancel asks "Discard changes?" with "Discard" and "Keep editing".
- A settings dialog with a "Delete account" button that opens a confirmation dialog → move account deletion to a settings page, where its confirmation is the only dialog.

**Accessibility**
- 2.1.1 Keyboard: Escape is the keyboard's backdrop click; every dismissal a pointer has, the keyboard has.
- 2.1.2 No Keyboard Trap: Escape is the standard exit that makes the trap legitimate.
- `aria-modal` only when the page behind is truly inert (W3C note); `showModal()` sets it implicitly (MDN).

**Build**
- Escape: `showModal()` fires `cancel` then `close`; a dirty dialog calls `preventDefault()` on `cancel` and asks first.
- Backdrop: `closedby="any"` for an information dialog, `closedby="closerequest"` where typed input could be lost; where `closedby` is unsupported, a click whose target is the `dialog` itself closes it only for the passive kind ([MDN `dialog`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog); [browser support: *Progressive enhancement and feature queries*](../../code/browser-support.md#progressive-enhancement-and-feature-queries)).
- `aria-modal` is implicit with `showModal()`; never set it on a non-modal surface.
- One at a time: the open function refuses while another `dialog:modal` is open, except the discard-changes confirmation.
- One dialog module for the product (code-standard rule 36; [javascript: *One implementation per behaviour*](../../code/javascript.md#one-implementation-per-behaviour)).

**Check**
- *Script* could: open each dialog, type into a field, click the backdrop and assert the dialog is still open with the text intact; press Escape and assert a dialog closes or asks; assert no second `dialog[open]` appears from inside the first except a confirmation.
- *Judgement*: does every route out of this dialog keep the person's work?

**Sources.** Primer accepts up to two nested dialogs with correct focus management; Carbon forbids nesting outright; Apple allows only an alert over a modal. The toolkit follows Carbon with Apple's alert exception: nesting costs orientation and focus bugs, and a task that needs it is a page.

## Size and scrolling

**Use when / don't use**
- Size the dialog for its content from a small fixed set; scroll the body, never the whole dialog or sideways.
- When the largest size still scrolls a lot, it is a page.

**How**
- Carbon's [modal](https://carbondesignsystem.com/components/modal/usage/) has four sizes, each with a maximum height: "Modals with brief text should be extra small or small to avoid long single lines"; "If the large modal height is still not enough space then a full page might be needed instead."
- Long content: the body scrolls with header and footer fixed. Carbon: "The content should visibly fade at the end of the modal body area to indicate there is additional content out of view"; "Modal content should never scroll horizontally." Primer adds a divider between footer and body when the body scrolls.
- Body text no wider than a comfortable measure; Carbon keeps text at 80% of the modal's width while components may span it.
- **Narrow screens**: Primer turns a centred dialog into a full-screen dialog or a bottom sheet; "Dialogs that have one or more input fields should always use the full-screen variant." Apple: avoid popovers in compact views and use a sheet instead.
- Avoid an alert that scrolls (Apple's [alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)): keep confirmation text to two or three lines.

**Cases**
- A dialog whose whole frame scrolls, taking the footer off screen → fix header and footer, scroll the body, add the fade or divider.
- A dialog at 320px with a two-column form → one column; at narrow widths, full-screen.
- A dialog containing a data table with batch actions → a page; Carbon's [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/) says to "avoid preforming table functions like batch editing or batch actions inside the modal itself".

**Accessibility**
- 1.4.10 Reflow: at 320 CSS pixels the dialog's content reads without horizontal scrolling (a [code candidate](../../code/candidates.md) for pages).
- 1.4.4 Resize Text: at 200% text the footer stays reachable; fixed-height bodies scroll rather than clip.
- 2.4.11: a fixed footer does not cover the focused element in the scrolling body.

**Build**
- Sizes are a variant attribute, `size="sm|md|lg"`, each a `max-inline-size` token (code-standard rules 9 and 22).
- The dialog is a column grid with the body scrolling: header and footer stay, `overflow-x` never scrolls.
  ```css
  dialog > form { display: grid; grid-template-rows: auto 1fr auto; max-block-size: min(var(--dialog-max-h), 100svh - 2 * var(--space-32)); }
  dialog > form > div { overflow-y: auto; }   /* header, body, footer */
  ```
- `svh`, not `vh`, so the mobile toolbar does not cut the footer ([Maximum height and position](#maximum-height-and-position)) ([responsive: *Viewport units*](../../code/responsive.md#viewport-units)).
- Narrow screens with inputs: a container or breakpoint query makes it full screen ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)); reflow at 320px is [responsive: *Zoom and reflow*](../../code/responsive.md#zoom-and-reflow).
- Body text measure in `ch` or `max-inline-size`, not a fixed width ([i18n: *Text expansion and no fixed widths on text*](../../code/i18n.md#text-expansion-and-no-fixed-widths-on-text)).

**Check**
- *Script* could: open each dialog at 320px and at 200% zoom; assert no horizontal scroll inside it, the footer is visible, and the focused element is not covered by header or footer.
- *Judgement*: is this a dialog's worth of content?

**Sources.** Carbon and Primer agree on body scrolling and on a page for anything larger. Primer's narrow-screen rule (full screen whenever there are inputs) is stricter than Carbon's sizing; the toolkit adopts it, since a keyboard on a phone leaves little room for a centred box.

## Maximum height and position

**Use when / don't use**
- Every centred modal has a maximum height: the viewport's small height less a fixed gap at top and bottom. Its own height is its content's, up to that cap; past it, the body scrolls.
- Don't cap it with a percentage of the viewport alone. A percentage leaves a wide band on a tall monitor and almost none on a short laptop or a phone held sideways; a fixed gap is the same everywhere.
- Don't anchor it to the top to stop it moving. The toolkit centres every modal on both axes; a dialog that must not move gets a fixed height instead (below).

**How**
- **The gap to the window edges.** The systems that state one use a fixed length, not a fraction: Primer's dialog is `max-height: calc(100dvh - 64px)` (32px each side) in its [source](https://github.com/primer/react/blob/main/packages/react/src/Dialog/Dialog.module.css); Material's web dialog is `max-height: min(560px, calc(100% - 48px))` in its [source](https://github.com/material-components/material-web/blob/main/dialog/internal/_dialog.scss), and Android's dialog insets 80dp top and bottom ([Material Components, Dialog](https://github.com/material-components/material-components-android/blob/master/docs/components/Dialog.md)); Atlassian's [modal dialog](https://atlassian.design/components/modal-dialog/examples) sits 60px from the top with a cap of `100vh - 119px` in its published styles. The browser's own modal `dialog` is capped at `calc(100% - 6px - 2em)` (the [HTML rendering rules](https://html.spec.whatwg.org/multipage/rendering.html)), about 19px each side. Carbon is the exception: its [modal style](https://carbondesignsystem.com/components/modal/style/) caps each size at a percentage (extra small 48%, small 72%, medium 84%, large 96%), "in order to maintain a proper window ratio".
- **The minimum gap from the top.** At the cap, the top gap is the fixed gap: 2rem (32px), Primer's figure, which sits between Material's 24px and Atlassian's 60px and keeps the backdrop visible, so the page behind still reads as present and the dialog as on top of it. Primer drops it to 6px only when the viewport is 280px tall or less.
- **vh, svh and dvh.** `vh` is the large viewport, the one with the mobile toolbars retracted: MDN's [length](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length) page says "all default viewport units (vh, vw, etc.)" equal their large counterparts, so a dialog capped in `vh` runs under the toolbars when they show. `svh` is the viewport with them shown, stable; `dvh` follows them, and MDN warns its sizes "are not stable, even when the viewport itself is unchanged" ([web.dev, viewport units](https://web.dev/blog/viewport-units); [responsive: *Viewport units*](../../code/responsive.md#viewport-units)). A modal locks the page's scroll, so the toolbars do not move while it is open and `svh` and `dvh` agree; `svh` is the one that is never under a toolbar. Neither unit sees the on-screen keyboard, which is why a form goes full screen on a phone.
- **Header and footer fixed, the body scrolls.** The dialog is a column: header and footer keep their height, the body takes the rest and scrolls. Atlassian: "Once it reaches a certain threshold, the body content will scroll while the header and footer remain fixed"; Primer: "If the maximum height is reached, the body contents will scroll"; Polaris's [modal](https://shopify.dev/docs/api/app-home/latest/web-components/overlays/modal): "Content within the modal scrolls if it exceeds available height." The actions footer is therefore always on screen. Atlassian also offers scrolling the whole dialog in the viewport; the toolkit does not, since it takes the footer off screen ([Size and scrolling](#size-and-scrolling)).
- **Full screen or a sheet on small screens.** Below about 30rem wide, a modal with inputs fills the screen: Atlassian's modal goes full height below 30rem in its styles; Primer switches its narrow position (`bottom` or `fullscreen`) below 768px; Carbon says "On mobile devices, at the smaller break points the max-height does not apply." Material reserves the full-screen dialog for "a series of tasks", such as a calendar entry. Apple's [sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) rest at medium or large detents on iPhone and centre a page or form sheet on iPad, "on top of a dimmed background view"; "For complex or prolonged user flows, consider alternatives to sheets". A phone held sideways is wide but short: the height query makes it full screen too.
- **Centred without jumping.** A centred dialog that grows moves both edges by half the growth, so its title shifts when a field is revealed, an inline error appears or a list loads. For a dialog whose content changes while it is open, set its height to that of its largest state (Primer's `height="small|large"`, 480px and 640px; Atlassian's `height` prop), so it opens at the size it will need and the body scrolls inside it. For one whose content does not change, height from content is right. Polaris centres always: "The modal always renders centered in the viewport and cannot be repositioned."
- **Centre with the browser's own mechanism.** A modal `dialog` and a `[popover]` are already `position: fixed` with `inset: 0`, `height: fit-content` and `margin: auto` (the HTML rendering rules), which centres them on both axes with no transform; Material's web dialog keeps exactly that. A `translate: 0 -50%` does the same and can land the box on a half pixel; it also means overriding the defaults the browser already set.
- **A tall form is still a page.** A cap plus a scrolling body makes a long form fit, not usable: when the largest size scrolls a lot, it is a page ([A modal or a page of its own](#a-modal-or-a-page-of-its-own)). GOV.UK publishes no modal; the [modal dialogue backlog](https://github.com/alphagov/govuk-design-system/issues/6054) records its guidance to "avoid modals in most cases".

**Cases**
- A dialog capped at `85svh` on a 1,200px-tall monitor leaves 90px above and below for nothing, and on a 400px landscape phone 30px → `calc(100svh - 2 * 2rem)`, the same gap at every height.
- A dialog capped at `90vh` hides its footer under Safari's toolbar → `svh`.
- An "Add user" dialog shows a second section when a checkbox is ticked and its title jumps up 120px → give it the fixed height of its open state; the body scrolls.
- A three-field dialog on a 360px phone with the keyboard up covers its own Save button → full screen below 30rem wide or tall, footer pinned.

**Accessibility**
- 1.4.10 Reflow: at 400% zoom (320 CSS pixels) the viewport is also short; the fixed gap and the full-screen query keep header, body and footer usable rather than a sliver of body.
- 1.4.4 Resize Text: a fixed dialog height clips nothing because the body scrolls; never fix the height of the whole dialog without a scrolling body.
- 2.4.11 Focus Not Obscured (Minimum): the pinned footer does not cover the focused field in the body ([Focus: in, trapped, returned](#focus-in-trapped-returned)).

**Build**
- Centred by the defaults, capped with a fixed gap in `svh`; header and footer `flex: none`, body `overflow: auto` (code-standard rule 22 for the token).
  ```css
  dialog { inset: 0; margin: auto; block-size: fit-content;
    max-block-size: calc(100svh - 2 * var(--space-32)); display: flex; flex-direction: column; }
  dialog > .body { flex: 1 1 auto; overflow: auto; overscroll-behavior: contain; }
  dialog[data-height="fixed"] { block-size: min(var(--dialog-h), 100svh - 2 * var(--space-32)); }
  @media (max-width: 30rem), (max-height: 30rem) {
    dialog:has(input, select, textarea) { inset: 0; margin: 0; inline-size: 100%; block-size: 100svh; max-block-size: none; border-radius: 0; } }
  ```
- `overscroll-behavior: contain` stops a scroll that reaches the body's end from passing to the page behind.
- The breakpoint is a page dimension in one place ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)).

**Check**
- *Script* could: open each modal at 1280×1200, 1280×600, 844×390 and 360×640; assert the gap above and below is at least 2rem or the dialog is full screen, the footer is inside the viewport, and the dialog's top does not move when its content changes.
- *Judgement*: does this dialog change size while open, and if so, is its height fixed?

**Sources.** Primer, Material, Atlassian and the browser's defaults cap the height with a fixed gap; only Carbon uses percentages, per size. Primer and Material centre; Atlassian anchors to the top at 60px, and Primer offers that as an option. The toolkit centres, takes Primer's 32px gap, measures it in `svh` rather than Primer's `dvh` (equal while the page is locked, and `svh` is never under a toolbar), and stops jumping with a fixed height rather than a top anchor.

## Confirmation dialogs

**Use when / don't use**
- For an action that is serious, uncommon and cannot be undone: deleting an account, sending to everyone, a payment.
- Not for routine or reversible actions. NN/g's [confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/): "Do not use confirmation dialogs for routine actions"; "if you cry wolf too many times, people will stop paying attention to the question". Apple: avoid alerts "for common, undoable actions, even when they're destructive."
- Undo first, confirmation only when undo is impossible ([interaction: undo or confirmation](../design/interaction.md#undo-or-confirmation)). This section owns the confirmation dialog; its words follow [content: confirmations and destructive wording](../design/content.md#confirmations-and-destructive-wording).

**How**
- **Title**: a specific question naming the action and object. Primer's [confirmation dialog](https://primer.style/product/components/confirmation-dialog/guidelines/): "Delete repository?", never "Are you sure?" or "Confirm action".
- **Body**: the consequence, specifically. Primer: "Explain consequences, especially if they're irreversible" and "Mention specific items being affected." Name counts ("24 files").
- **Buttons**: the action verb and "Cancel". NN/g: labels that "summarize what will happen", such as "Delete file" and "Keep file". Apple's alerts: "Always use the title 'Cancel'" for the cancelling button.
- **Style and focus**: the confirming button in the danger style ([`actions.md`](actions.md), *Destructive actions*); initial focus on Cancel; NN/g suggests "it's probably best not to have a default answer at all".
- **Role**: an `alertdialog`, whose description points at the message (W3C [alert dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)).
- **Highest stakes**: ask the person to type the object's name before the confirming button enables.
- **Repetitive confirmations** for an action a person repeats many times: NN/g's [overlay guidance](https://www.nngroup.com/articles/overuse-of-overlays/) suggests a "Don't ask me this again" option.

**Cases**
- Archiving a project that can be unarchived → no confirmation; archive and offer Undo.
- Deleting a repository → "Delete repository?", body naming it and its history, "Delete repository" in danger style, focus on Cancel.
- Discarding a long unsaved form → "Discard changes?" with "Discard" and "Keep editing".

**Accessibility**
- 3.3.4 Error Prevention (Legal, Financial, Data): a confirmation satisfies "confirmed" where the action modifies or deletes user data or commits money ([W3C Understanding 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html)).
- 1.4.1: the danger is in the words, not only the red.
- Focus and Escape as in the sections above.

**Build**
- `dialog` with `role="alertdialog"`, named by its title (`aria-labelledby`) and described by the consequence (`aria-describedby`) ([APG alert dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)).
- `autofocus` on Cancel; the confirming button carries the danger variant ([actions: destructive actions](actions.md#destructive-actions)).
- `<form method="dialog">` returns the chosen button's `value` in `returnValue`; the caller acts only on the confirming value.
- Type-to-confirm: the confirming button is `aria-disabled` until the input matches, and the handler checks the match, not the attribute (code-standard rule 62).
- The server still guards the action ([security: *Forms and cross-site request forgery*](../../code/security.md#forms-and-cross-site-request-forgery)); focus after close is [accessibility: *Focus management*](../../code/accessibility.md#focus-management).

**Check**
- *Script* could: flag a dialog whose buttons are named only OK, Yes or No; assert initial focus in a danger-styled dialog is not on the danger button; flag a title that is "Are you sure?".
- *Judgement*: could this action be undone instead, and does anyone read this dialog after the fifth time?

**Sources.** NN/g, Apple, Primer and GOV.UK agree on the narrow use and outcome-named buttons. Carbon focuses the primary even in a danger modal; the toolkit follows the W3C and Apple and focuses Cancel.

## Drawers and side sheets

**Use when / don't use**
- A drawer slides from an edge and spans the viewport's height. Use it for a preview, details of a selected item, or a short configuration, when the page behind gives context.
- Don't use it for long create or edit forms. Primer: "Don't use side sheets to present create/edit forms, or flows that may contain a lot of information. For that, use a page instead."
- A left drawer is for global navigation; Primer reserves left side sheets for it.

**How**
- **Modal or not, decided once.** Primer's side sheets are modal ("interacting with the content in the background is not possible", with a backdrop covering the navigation). Carbon's non-modal dialog leaves the page usable. Choose modal when the drawer's task must finish before the page is touched; non-modal when the person compares the drawer with the page.
- **A close button**, at the top, always; Escape closes. NN/g's [bottom sheets](https://www.nngroup.com/articles/bottom-sheet/) found users miss grab handles: "include a visible a Close (or X) button".
- **No stacking.** NN/g: "Do Not Stack Bottom Sheets"; Primer's backdrop "prevents multiple side sheets from appearing simultaneously".
- **Short interactions only.** NN/g: a sheet "should not be used for displaying complex content".
- **Back dismisses it** on touch where it looks like a page (NN/g); on the web, a drawer that has its own address closes on Back.
- **Bottom sheets** are the narrow-screen form of a dialog or drawer (Primer); full width, backdrop, tapping the backdrop dismisses.

**Cases**
- Clicking a row in a list to glance at its details while scanning the list → a non-modal right drawer, so the list stays usable beside it; a list worked through item by item gets a panel in the layout instead ([sidebars: contextual side panels](sidebars.md#contextual-side-panels)).
- "Edit" in that drawer opening a twenty-field form → a page.
- A live preview the person compares with the work while editing → docked beside it, not a drawer ([sidebars: object header over a tool layout](sidebars.md#object-header-over-a-tool-layout)).
- A drawer that opens a second drawer for a sub-item → one drawer with a back step inside, or a page.
- A filter drawer on mobile → modal, full height, with "Show 42 results" and a close button (filtering: [`filtering.md`](filtering.md)).

**Accessibility**
- Modal drawers follow the dialog focus contract above. Non-modal drawers move focus in on open, do not trap, and return focus to the trigger on close; Tab can leave them.
- 2.4.11: a non-modal drawer does not cover the focused element on the page behind.
- 1.3.2: the drawer's DOM position follows its trigger or is a labelled region, so reading order makes sense (code-standard rule 2).

**Build**
- Modal drawer: a `dialog` opened with `showModal()`, positioned to an edge; it inherits the dialog focus contract ([accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- Non-modal drawer: a `dialog` opened with `show()`, or a labelled `aside` revealed by a `button` with `aria-expanded`; focus moves in on open, Tab can leave, Escape closes and returns focus.
- Placed with logical properties (`inset-inline-end: 0`), so a right-to-left page mirrors it ([i18n: *Logical properties and mirroring*](../../code/i18n.md#logical-properties-and-mirroring)).
- Slides with `transform`, stilled under `prefers-reduced-motion` ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code); [accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).
- A drawer with its own address closes on Back: open and close push and pop history ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Closed means `hidden` or closed `dialog`, never off screen and still tabbable (code-standard rule 17).

**Check**
- *Script* could: open a drawer and assert a close button exists, Escape closes it, focus returns; for a non-modal drawer assert Tab can reach the page and the focused element is never fully covered.
- *Judgement*: does the person need the page while the drawer is open, and is the task short?

**Sources.** Primer treats side sheets as modal dialogs; Carbon and NN/g describe non-modal panels and sheets. The toolkit lets the task decide and requires the choice to be stated per drawer in the design.

## Popovers

**Use when / don't use**
- A popover shows a little information or a few related controls tied to one trigger, and closes when the person moves on.
- Not for warnings. Apple's [popovers](https://developer.apple.com/design/human-interface-guidelines/popovers): "Avoid using a popover to show a warning. People can miss a popover or accidentally close it."
- Not for required input. Carbon's [disclosures pattern](https://carbondesignsystem.com/patterns/disclosures-pattern/): "Don't use to present critical information or request required input needed to complete a workflow. Use the modal component instead."
- Not on narrow screens for anything substantial; Apple uses a sheet there.

**How**
- **Opened by click**, never automatically (Carbon: "Disclosures should never open automatically").
- **Light dismiss**: closes on a click outside, on Escape, and on the trigger again. Carbon: close by clicking the trigger again "or anywhere outside of the open popover container"; the Popover API's `auto` state provides light dismiss natively ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)).
- **Save on light dismiss.** Apple: "Always save work when automatically closing a nonmodal popover… Discard people's work only when they click or tap an explicit Cancel button."
- **One at a time, never nested.** Carbon's [popover](https://carbondesignsystem.com/components/popover/usage/): "Only one popover can appear at a time"; "Avoid nesting popovers." Apple: "Never show a cascade or hierarchy of popovers."
- **Small.** Carbon: "If your popover exceeds four columns in width, use a modal instead." Apple: "Avoid making a popover too big."
- **Placement**: next to its trigger with a caret when the trigger has no pressed state (Carbon), not covering the trigger or content needed while using it (Apple).
- **A close button** only when it adds clarity, such as leaving without saving (Apple); Carbon places it top right when present.

**Cases**
- A "Columns" popover with ten checkboxes → each change applies at once and persists when the popover is light-dismissed.
- A popover that opens a second popover for "Advanced" → expand the advanced options inside the same popover, or use a dialog.
- A validation error shown in a popover by the field → an inline error under the field; a popover can be dismissed and missed.

**Accessibility**
- 2.1.1: Escape closes and focus returns to the trigger; the trigger exposes `aria-expanded`.
- Tab order: focusable content in the popover follows its trigger in the tab sequence (Carbon: interactive elements are "kept in the tab order of the page").
- `details` used as a popover does not give Escape or click-outside (code-standard rule 19); the Popover API does (code-standard rule 8).
- 1.4.13 applies when a popover opens on hover (Carbon allows hover triggers): it must be dismissible, hoverable and persistent.

**Build**
- `popover="auto"` opened by a `button` with `popovertarget`: light dismiss, Escape, one at a time and focus return come from the platform ([MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API); code-standard rule 8).
- The trigger reflects state with `aria-expanded`, set in the `toggle` event handler (code-standard rule 20 keeps it working before script).
- The popover follows its trigger in the DOM, so its controls come next in the tab order (code-standard rule 2).
- Placement next to the trigger with CSS anchor positioning where supported, a script fallback elsewhere ([browser support: *Progressive enhancement and feature queries*](../../code/browser-support.md#progressive-enhancement-and-feature-queries)).
- Work saved on dismiss: controls in the popover apply on `change`, not on a Close button.
- A `details` used as a popover adds Escape and click-outside itself (code-standard rule 19; [HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).

**Check**
- *Script*: code-standard rule 19's check in `tools/parity/pages.mjs` already asserts Escape and click-outside close a floating `details`. Could: for each `[popover]` or `aria-expanded` trigger, assert Escape closes, a click outside closes, focus returns, and only one is open at a time.
- *Judgement*: would losing this popover by accident cost the person anything?

**Sources.** Carbon, Apple and MDN agree on light dismiss, one at a time and no nesting. Carbon caps popovers at four columns and disclosures at six; the toolkit uses four for a popover and moves anything larger into a dialog or drawer.

## Tooltips

**Use when / don't use**
- A tooltip names an icon-only control or adds a short, non-essential hint to an interactive element, on hover and on keyboard focus.
- Never for information needed to complete the task. NN/g's [tooltip guidelines](https://www.nngroup.com/articles/tooltip-guidelines/): "Don't use tooltips for information that is vital to task completion." Carbon's [tooltip](https://carbondesignsystem.com/components/tooltip/usage/): "Since a tooltip disappears when a user hovers away, do not include pertinent information."
- Never with interactive content: links or buttons go in a toggletip or popover opened by click (Carbon).
- Never on non-interactive elements. Primer's [tooltip](https://primer.style/product/components/tooltip/guidelines/): "Never include Tooltips on non-interactive components (div, span, p)."

**How**
- **Ask first whether it can be on the page.** Primer's alternatives: persist the content, don't duplicate it, use a modal or a disclosure.
- **Content**: a few words; for icon buttons, Carbon asks for "a concise one- or two-word description of the button's function". No repeat of the visible label (NN/g).
- **Trigger**: hover and focus both (NN/g: "Support both mouse and keyboard hover"); after a short delay (W3C [tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)).
- **Stays while needed**: open while the pointer is over the trigger or the tooltip (W3C), until focus leaves, or until Escape.
- **Position**: not over related content; an arrow when several triggers are close (NN/g); flipped to stay in the viewport (Carbon).
- **Consistency**: all icon buttons in a set have tooltips, or none (NN/g).
- **Touch**: there is no hover. Essential labels must already be visible; a "?" toggletip opened by tap carries longer help (NN/g's popup tips).
- **Not the `title` attribute** for anything a keyboard user needs; Primer's [truncate accessibility](https://primer.style/product/components/truncate/accessibility/) notes `title` tooltips have "no browser-native mechanism" for keyboard users.

**Cases**
- Password rules in a tooltip on the password field → visible hint text under the field (NN/g's Amtrak example).
- A tooltip with a "Learn more" link → a toggletip opened by click, so the link can be reached.
- A truncated table cell with its full text in `title` → wrap the text or give an explicit expand control ([`disclosure.md`](disclosure.md), *Show more and truncation*).
- A tooltip explaining why a button is disabled → unreachable by keyboard on a `disabled` button; put the reason in text ([`actions.md`](actions.md), *Disabled buttons*).

**Accessibility**
- 1.4.13 Content on Hover or Focus: content that appears on hover or focus is **dismissible** without moving pointer or focus (Escape), **hoverable** (the pointer can move onto it without it vanishing) and **persistent** until the trigger is removed, the person dismisses it, or it is no longer valid ([W3C Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)). The browser's own `title` tooltip is exempt; a custom one is not.
- 4.1.2: a tooltip that names an icon button is its accessible name (`aria-labelledby`); one that adds a hint is a description (`aria-describedby`, code-standard rule 15). The W3C pattern: the trigger references the tooltip with `aria-describedby` and focus stays on the trigger.
- 2.1.1: anything a mouse user gets on hover, a keyboard user gets on focus.

**Build**
- `role="tooltip"` on the tip; the focusable trigger points at it with `aria-labelledby` (it names an icon button) or `aria-describedby` (a hint) (code-standard rules 15 and 18; [APG tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)).
- Shown on `pointerenter` and `focusin` after a delay; kept while the pointer is over trigger or tip; hidden on Escape without moving focus.
- No focusable content; help with a link is a toggletip, a `button` opening a `popover`.
- Not `title` for anything a keyboard or touch user needs.
- Wiring, events and the toggletip are [accessibility: *Tooltips and toggletips*](../../code/accessibility.md#tooltips-and-toggletips).

**Check**
- *Script* could: hover and focus each tooltip trigger; assert the tooltip appears in both cases, Escape hides it without moving focus, moving the pointer onto it keeps it, and it contains no focusable element; flag `role="tooltip"` on a non-focusable trigger.
- *Judgement*: if this tooltip never appeared, could the person still finish the task?

**Sources.** The W3C tooltip pattern is marked as work in progress without task-force consensus; WCAG 1.4.13 is normative and is what the toolkit checks against. Carbon, Primer and NN/g agree on supplementary-only content; Primer is the strictest (tooltips mainly to label icon buttons), and the toolkit follows Primer.
