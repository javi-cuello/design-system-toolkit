# Dialogs, drawers, popovers and tooltips

Surfaces that appear over or beside a page: when to use a modal dialog, an inline expansion, a new page, a drawer or side sheet, a popover or a tooltip, and when a task outgrows a modal and needs its own page. Each surface is a component with its own page: [`../components/modal-dialog.md`](../components/modal-dialog.md) (built, focused, dismissed, sized, scrolled, and the confirmation dialog), [`../components/drawer.md`](../components/drawer.md), [`../components/popover.md`](../components/popover.md) and [`../components/tooltip.md`](../components/tooltip.md). It serves design-standard's principles *people in control, mistakes forgiven* (an obvious exit, nothing lost), *serve a real need* (interrupt only when it matters) and *show state and give feedback*, and, with the modal dialog's page, owns three things other pages link to: a dialog is opened by the person, takes focus, keeps it and gives it back; the confirmation dialog; and no dialog that opens a dialog (the commonest breach of the two-level disclosure limit). Modality as a fundamental is in [`../design/interaction.md`](../design/interaction.md) (*Modality*, *Undo or confirmation*); the button rules a dialog footer uses are in [`../components/button.md`](../components/button.md) and [`actions.md`](actions.md).

## Choosing the surface

**Use when / don't use**
- [weak] Use this before drawing any overlay: the choice of surface is the first decision, and no styling rescues the wrong one.
- [strong] Take the least interrupting surface that is enough: inline, then popover, then drawer, then modal dialog, then a new page when the task is too big for any of them.
- [strong] Don't open any of them without the person's action. Carbon's [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/): "Don't use when the user hasn't triggered the dialog."

**How**

| Need | Surface | Why |
|---|---|---|
| A hint about a control, a few words, nothing to click | Tooltip | Hover and focus only; never essential |
| Extra detail or a few controls tied to one element; page stays usable | Popover (non-modal, light dismiss) | Carbon: up to four grid columns, else a modal |
| Show more of the content itself, in reading flow | Inline disclosure ([`disclosure.md`](disclosure.md)) | Keeps context, no overlay |
| A preview or settings while the page stays in view | Drawer or side sheet | Carbon's non-modal dialog; Primer's right side sheet |
| A decision or short required input before going on | Modal dialog | Carbon: "critical information or request required input" |
| A long, multi-step or deep-linkable task | A page | Carbon: "A modal is not an alternative to page" |

- [strong] **Modal** when the person must decide or supply something before continuing, or must not miss an urgent consequence of their own action. NN/g's [modal and nonmodal dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/): use modals "for important warnings", to request information "critical to continuing the current process", and avoid them for "nonessential information" and "complex decision making that requires additional sources of information unavailable in the modal".
- [moderate] **Non-modal** when the person needs the page while the surface is open (find and replace, a comparison). Carbon: "Use when a user needs to compare or refer to information in the main page."
- [strong] **Page** when the task has steps, needs navigation inside it, or should have its own address. Primer's [dialog](https://primer.style/product/components/dialog/guidelines/) on deep linking: "it is often more advisable to avoid using a Dialog altogether" and create a dedicated page. Apple's [modality](https://developer.apple.com/design/human-interface-guidelines/modality): avoid "a modal experience that feels like an app within your app".
- [required] **An item's detail or an explanation** (a row's checks, "what the levels mean") opens in a dialog or a side panel, not in place (design-standard rule 13 picks this between the inline and overlay rows above).
- [moderate] **Never for news.** System messages go to toasts or banners ([feedback: choosing the feedback](feedback.md#choosing-the-feedback)); Carbon reserves modals for critical information "immediately related to their task".

**Cases**
- Editing one field of a record (a name) → inline edit in place; a modal for one field hides the record being edited.
- "Add item" with four fields → a modal dialog: short, self-contained, user-initiated (Carbon's example of a simple dialog task).
- A twelve-field create form with sections → a page; on a narrow screen Primer makes any dialog with inputs full-screen anyway.
- Choosing columns for a table → a popover from the "Columns" button: a few checkboxes, the table visible behind.
- A newsletter prompt three seconds after landing → none of them. NN/g reports "visceral disdain" for such modals.

**Accessibility**
- [required] 3.2.1 On Focus and 3.2.2 On Input: no surface opens because focus arrived or a value changed without warning; opening is an explicit activation.
- [required] 2.4.3 Focus Order: each surface has a designed focus entry and exit, on its component page ([modal dialog: focus](../components/modal-dialog.md#focus-in-trapped-returned), [drawer](../components/drawer.md), [popover](../components/popover.md), [tooltip](../components/tooltip.md)).
- [required] Native elements first: `dialog`, `popover` and `details` before a registered component (code-standard rule 8); a modal opens from `popovertarget` before `showModal()` enhances it (code-standard rule 20).

**Build**
- [required] Tooltip: `role="tooltip"` text tied by `aria-describedby` or `aria-labelledby`. Popover: `popover` opened by `popovertarget`. Inline disclosure: `details`. Modal: `dialog` with `showModal()`. Page: a link ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- [required] Native elements before a registered component (code-standard rule 8); a hand-built overlay `div` is the last resort.
- [required] Every surface has a no-script path: a `dialog` that is also a `popover` opens from `popovertarget` before the script upgrades it (code-standard rule 20).
- [strong] Nothing opens on load, scroll or a timer; opening is the trigger's click handler or `popovertarget`.
- [moderate] A task with its own address is a page, or a dialog whose state lives in the address ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).

**Check**
- *Script* could: on load, assert no `dialog[open]`, open popover or overlay exists before any interaction; list overlays that opened after a scroll or timer.
- *Judgement*: is this the least interrupting surface that does the job, and would the task be better as a page?

**Sources.** Carbon, NN/g, Apple and Primer agree on modals for short, critical, user-initiated tasks and pages for anything larger. They differ on how much a dialog may hold: Primer treats dialogs as a way to "add responsive support, and avoid deeper navigations" for single-context features, while Carbon warns against data tables, tabs and accordions inside one. Carbon's stricter line is the one taken: a dialog holds one task.

## A modal or a page of its own

**Use when / don't use**
- [weak] Use this when the choice above has narrowed to a modal dialog or a page, which is where most wrong surfaces are chosen: a task starts small in a dialog and grows until it is a page drawn in a box.
- [strong] A modal for a short, one-step task that belongs to the page behind it and needs nothing the dialog cannot show. NN/g's [modal and nonmodal dialogs](https://www.nngroup.com/articles/modal-nonmodal-dialog/): "Modal dialogs should be used for short, direct dialogs with the user."
- [moderate] Never a page inside a dialog. Carbon's [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/): "Don't recreate a full app or page in a dialog"; Primer's [dialog](https://primer.style/product/components/dialog/guidelines/): "Avoid creating a whole page inside a Dialog."

**How**

| Signal | Modal | Page |
|---|---|---|
| Length | Fits the largest dialog size with little scrolling | Needs more than the largest size (Carbon: "displayed on a page of its own") |
| Steps | One | Several; NN/g: "it probably justifies dedicating a full page to it" |
| Address and Back | Nobody links to it; Back need not reopen it | Linked from outside, bookmarked or shared; Back must return to it |
| Information | Everything needed is in the dialog | Needs facts from elsewhere |
| Navigation inside | None | Tabs, sections, a side list |
| The page behind | Is the context, and stays meaningful | Is irrelevant to the task |

- [weak] **One page signal is enough.** A dialog that needs an address, Back, steps or its own navigation is imitating a page, and each imitation is script the browser already gives a page.
- [moderate] **The address test first.** Primer: "It's crucial to consider if the Dialog should be accessible via a link"; a dialog opened from URL parameters dims a page the person never saw. Anything mailed, linked from help or bookmarked is a page.
- [moderate] **Information from elsewhere.** Atlassian's [modal dialog](https://atlassian.design/components/modal-dialog/usage): "Avoid complex decision-making that requires additional information not available in the modal." Bring the fact into the dialog, or make the task a page; if the person must compare with the page behind, a non-modal drawer.
- [moderate] **Steps.** Atlassian: "Avoid multiple steps that require navigation within the modal dialog." A multi-step task is a sequence of pages with a step indicator ([steppers: step indicators](steppers.md#step-indicators)).
- [weak] **Why short tasks stay modal.** Carbon: dialogs "are less disorientating than navigating a user to a new page for simple tasks or knowledge gathering". The page is the escalation, not the default.
- [weak] **GOV.UK** ships no modal in GOV.UK Frontend (its [backlog discussion](https://github.com/alphagov/govuk-design-system/discussions/6148) has been open since 2018) and builds tasks as [question pages](https://design-system.service.gov.uk/patterns/question-pages/), "just one question per question page", with a Back link to "the previous page they were on, in the state they last saw it".

**Cases**
- Editing a five-field address from an account overview → a modal: one step, and the overview is its context.
- An import with file choice, column mapping and review → three pages with a step indicator; Back returns to mapping with the choices kept.
- A help article links to "Change your plan" → a page; a link must land on the task, not on a page with a dialog to find.
- A dialog asks for an ID the person must look up on another screen → show the IDs in the dialog as a choice, or make it a page.
- A record's details with history and comments tabs, opened from a list → a page; a quick look stays a drawer.

**Accessibility**
- [required] 2.4.2 Page Titled: a page has its own title, announced on arrival and kept in history; a dialog has only its accessible name.
- [required] 2.4.5 Multiple Ways: a page can be reached from navigation, search and links; a dialog only from its trigger.
- [required] 2.4.3 Focus Order: a page needs no trap or return; the [focus contract](../components/modal-dialog.md#focus-in-trapped-returned) is complexity a page avoids.

**Build**
- [required] A page task is a link to its own URL with a server-handled form, so the address, Back and a no-script path come free ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons); code-standard rule 20).
- [required] A short task that also has a page can start as a link to that page that script upgrades to a `dialog`; modified clicks still open the page (code-standard rule 21; [accessibility: *Keyboard access and modified clicks*](../../code/accessibility.md#keyboard-access-and-modified-clicks)).
- [weak] A dialog that must have an address keeps its state in the URL and closes on Back ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- [weak] Multi-step pages follow [steppers: *Step navigation*](steppers.md#step-navigation-back-continue-save-and-return) and [navigation: *Back behaviour*](navigation.md#back-behaviour).

**Check**
- *Script* could: flag a `dialog` holding a `tablist`, a `nav`, more than one `form` step or a body that scrolls well past its own height; flag a dialog opened from URL parameters that Back does not close.
- *Judgement*: would anyone link to, bookmark or press Back into this task? If so, it is a page.

**Sources.** NN/g, Carbon, Primer and Atlassian agree: short single-step tasks in a modal, multi-step, long or reference-heavy tasks on a page. GOV.UK goes furthest and treats pages as the default. Primer allows opening a dialog from URL parameters; a task that needs an address is a page, by Primer's own advice for links from outside and GOV.UK's practice, because Back and the title then work without imitation.
