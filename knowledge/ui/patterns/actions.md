# Actions: buttons, links, menus and toolbars

How an interface offers things to do, across its controls: button or link, how destructive actions are styled and guarded, how buttons group and order, Cancel, close and Back, toolbars and bulk actions. The button itself (its ranks, labels, icon-only form, loading and disabled states, split buttons and the floating action button) is [`../components/button.md`](../components/button.md); the link is [`../components/link.md`](../components/link.md). It serves design-standard's principles *clear words, clear hierarchy*, *people in control, mistakes forgiven*, *discoverable* and *consistent, not uniform*. It applies design-standard rule 2 (the layout holds still) to loading and disabled states and design-standard rule 5 (disabled, not hidden) to menu items, and the button's page owns button hierarchy and button labels. The fundamentals are in [`../design/interaction.md`](../design/interaction.md) (*Undo or confirmation*, *Disabled, hidden or read-only*, *Hover-only affordances*) and [`../design/content.md`](../design/content.md) (*Button and link labels*).

## Buttons or links

**Use when / don't use**
- [strong] A link takes the person somewhere (a page, an address, a file); a button does something here (submits, saves, opens a dialog, toggles, deletes).
- [strong] Decide by what happens, never by how the design draws it.
- [strong] Don't navigate with a button. Carbon's [button usage](https://carbondesignsystem.com/components/button/usage/): "Do not use buttons as navigational elements."

**How**
- [moderate] Ask whether the address changes or someone could open it in a new tab. Yes is a link. GOV.UK's [start button](https://design-system.service.gov.uk/components/button/) looks like a button and is built as a link, because start buttons "do not usually submit form data".
- [moderate] Match the look to the function where the design allows. The W3C [button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/): "both the appearance and role of a widget match the function it provides"; restyling is "a better solution" than patching the role.
- [required] A link styled as a button keeps link behaviour (middle-click, new tab); a button styled as a link keeps button behaviour (HTML).
- [moderate] A button that opens a dialog may end with an ellipsis ("Save as…"), a convention the W3C pattern and Apple's [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons) record. Use it everywhere or nowhere.
- [moderate] A link that opens a new tab says so in its name and with an icon (Carbon's launch icon).

**Cases**
- "Export CSV" → a link when the file exists at an address; a button when the export is generated on request.
- "Sort by date" in a table header → a button, even when the sort is written to the address: the person acts, they do not leave.
- "Cancel" that returns to the previous page → a link beside the submit button, as in GOV.UK's button group.
- Tabs that change the address → links with `aria-current`; tabs that swap a panel → a tab list ([tabs](../components/tabs.md#tabs)).

**Accessibility**
- [required] 4.1.2 Name, Role, Value: the role says what activation does. 2.1.1 Keyboard: links activate on Enter, buttons on Enter and Space.
- [required] The element table is in [HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons); modified clicks go to the browser (code-standard rule 21).

**Build**
- [required] `<a href>` for a destination, `<button type="button">` for an action here, `<button type="submit">` in a form; the element table, `type` always and the stretched-link card are [HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons).
- [required] One component draws both looks: the native element inside carries the behaviour, the wrapper the variant, `<ds-button variant="primary"><a href="/start">Start now</a></ds-button>` (code-standard rules 8 and 9).
- [required] A link in a set that marks the current place takes `aria-current` (code-standard rule 64); a button that opens a dialog gets its no-script path from `popovertarget` (code-standard rule 20).
- [required] A link that opens a new tab says so in its name, or in a visually hidden span ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).
- [required] A script that takes over a link's click leaves modified clicks to the browser (code-standard rule 21; [accessibility: *Keyboard access and modified clicks*](../../code/accessibility.md#keyboard-access-and-modified-clicks)).

**Check**
- *Script* could: flag `<a>` without `href`, `href="#"` or `javascript:` links, and buttons whose handler changes `location`.
- *Judgement*: for each control drawn as a button, does activating it leave the page?

**Sources.** The W3C, Carbon and GOV.UK agree; none recommends a button for navigation.

## Destructive actions

**Use when / don't use**
- [weak] Anything that deletes, removes, revokes, stops or overwrites what the person cares about.
- [moderate] Make it reversible and say so; confirm only the irreversible and serious ([interaction: undo or confirmation](../design/interaction.md#undo-or-confirmation)).
- [moderate] Don't put it in the primary position of an ordinary form.

**How**
- [weak] **Style by emphasis.** Carbon's danger button has primary, tertiary and ghost styles: primary danger when destruction "is a required or primary step", tertiary or ghost when it is one of several. A row's "Delete" is ghost danger or a menu item; the confirming button in its dialog is primary danger.
- [weak] **Never icon-only.** Carbon: "Do not use a danger button in an icon only form for a destructive action."
- [required] **Never colour alone.** GOV.UK's [warning button](https://design-system.service.gov.uk/components/button/): "Do not only rely on the red colour"; the label names action and object ("Delete project") (WCAG 1.4.1).
- [weak] **Two steps for the irreversible.** GOV.UK: another style for the first call to action, the warning button "for the final confirmation".
- [weak] **Not the default.** Apple: "Don't assign the primary role to a button that performs a destructive action, even if that action is the most likely choice." The confirmation dialog, its focus included, is [confirmation dialogs](../components/modal-dialog.md#confirmation-dialogs).
- [moderate] **Undo for the common case.** Apple's [alerts](https://developer.apple.com/design/human-interface-guidelines/alerts): "Avoid displaying alerts for common, undoable actions, even when they're destructive." Do it, show what happened, offer Undo in place (toasts with actions: [`feedback.md`](feedback.md)).
- [weak] **Apart in space.** Last in a menu after a divider; away from the primary in a group.

**Cases**
- Deleting a comment just written → delete, then "Comment deleted. Undo".
- Deleting a repository with its history → a confirmation naming it and what goes with it, primary danger inside ([Primer confirmation dialog](https://primer.style/product/components/confirmation-dialog/guidelines/)); a quieter danger trigger on the page.
- A red "Delete" beside a blue "Save" → move Delete away (its own section), so a slip does not hit it.
- A bulk "Delete 240 items" → the count in the label and the dialog title.

**Accessibility**
- [required] 3.3.4 Error Prevention (Legal, Financial, Data): deleting user data is reversible, checked or confirmed ([W3C Understanding 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html)); undo meets "reversible".
- [required] 1.4.1: the danger is in the words. 4.1.3 Status Messages: "deleted, undo" is announced without focus (a [code candidate](../../code/candidates.md)). Focus after a row disappears is code-standard rule 14.

**Build**
- [required] Danger is a variant value on the same component, `variant="danger"` (or a `tone` axis when the design crosses danger with emphasis), drawn from danger tokens (code-standard rules 9 and 22).
- [required] The label names action and object in text; an icon beside it is `aria-hidden` (code-standard rule 18).
- [required] Undo: after the delete, write "Comment deleted" into a `role="status"` region present from load, with the Undo button next to it ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- [required] When the deleted row held focus, focus moves to the next row or the list heading, never `body` (code-standard rule 14; [accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- [required] The irreversible case opens a `dialog` (see [confirmation dialogs](../components/modal-dialog.md#confirmation-dialogs)); the server still checks the request ([security: *Forms and cross-site request forgery*](../../code/security.md#forms-and-cross-site-request-forgery)).

**Check**
- *Script* could: flag a danger button with no visible text or with the primary role in a neutral form; after a scripted delete, assert an undo control or a dialog appeared.
- *Judgement*: could this be undoable instead of confirmed?

**Sources.** Apple does not style the button confirming an action the person deliberately chose (Empty Trash); Carbon's danger modal and GOV.UK's warning button do. On the web this section follows Carbon and GOV.UK: the colour is the last cue before an irreversible step. Apple's point survives as "not the default".

## Button groups and order

**Use when / don't use**
- [weak] Two or three related actions together: a form's submit and cancel, a dialog footer, a wizard's back and next.
- [weak] More than three → a menu button or a toolbar (Carbon: "Any more than three actions should be grouped meaningfully using menu buttons").

**How**
- [weak] One high-emphasis button per group (Carbon: "Do not use two high-emphasis buttons in a button group"); one size; Carbon also matches widths to the longest label.
- [strong] **Where the primary goes:**
  - Dialog, sheet, or a wizard inside a dialog: trailing side, Cancel leading. Carbon's [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/): "Cancel is always the outmost left button option and the primary action is always the outmost right button." [Primer dialog](https://primer.style/product/components/dialog/guidelines/) and Apple's alerts agree.
  - Foot of a full-page form: leading edge, aligned with the fields. GOV.UK: "Align the primary action button to the left edge of your form." Carbon: "on full-page designs, the primary button is on the left side of the page." A full-page multi-step flow is a form: Continue at the leading edge, Back at the top of the page ([steppers: step navigation](steppers.md#step-navigation-back-continue-save-and-return)).
  - Vertical stack: primary on top (Carbon, Apple).
- [moderate] Right-to-left languages mirror the group.
- [weak] Pick once per product. NN/g's [OK–Cancel](https://www.nngroup.com/articles/ok-cancel-or-cancel-ok/): "Following platform conventions is more important than optimizing an individual dialog box."

**Cases**
- A dialog with "Discard", "Save draft", "Publish" → Publish primary far right, Save draft beside it, Discard ghost far left (Carbon's progress arrangement).
- Five header actions of equal weight → the most used as a button, the rest in a menu labelled for what they share, or "Actions" (Carbon [menu buttons](https://carbondesignsystem.com/components/menu-buttons/usage/)).
- A wizard whose "Next" moves between steps → one position throughout, and the last step's "Next" renamed for the final action (Carbon).

**Accessibility**
- [required] 1.3.2 and 2.4.3: DOM order is reading and tab order; `row-reverse` to put the primary right breaks it (code-standard rule 2). Write buttons in reading order.
- [required] 3.2.4 Consistent Identification: one action, one label, everywhere.

**Build**
- [required] Buttons are written in reading order in the DOM; the layout places them, never `order` or `row-reverse` (code-standard rule 2).
- [required] The group is a layout container with its own element, `<ds-button-group>`, whose gap and alignment are tokens (code-standard rule 11).
  ```css
  ds-button-group { display: flex; flex-wrap: wrap; gap: var(--space-3); }
  dialog ds-button-group { justify-content: flex-end; }
  ```
- [required] Leading and trailing are logical (`justify-content: flex-end`, `margin-inline-start`), so a right-to-left page mirrors with no extra rule ([i18n: *Logical properties and mirroring*](../../code/i18n.md#logical-properties-and-mirroring)).
- [required] Equal widths, where the design asks, come from the grid (`grid-auto-columns: 1fr`), never a typed width (code-standard rule 57).
- [required] A Cancel that returns to a page is a link beside the submit button ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).

**Check**
- *Script* could: assert a dialog's primary is last in DOM order and visually trailing; flag groups of mixed height or of more than three buttons.
- *Judgement*: does every dialog and form put the primary in the same place?

**Sources.** NN/g's 2008 web advice was OK first (following Windows); Apple, Carbon and Primer put it last in dialogs; GOV.UK and Carbon put it first at the foot of a page. This section follows Carbon, which states the split, and NN/g's point that consistency outweighs either.

## Cancel, close and back

**Use when / don't use**
- [moderate] **Cancel**: abandons a task the person started (a form, a dialog, a wizard) and discards what it changed.
- [moderate] **Close (X)**: dismisses a surface (a dialog, a panel, a banner). It is always present on a modal dialog ([modal dialog anatomy](../components/modal-dialog.md#modal-dialog-anatomy)); Atlassian's [modal dialog](https://atlassian.design/components/modal-dialog/usage): "A close button in the header should always be used, except in extremely rare circumstances."
- [weak] **Back**: returns to the previous step of a linear journey. Elsewhere the browser's Back does the job ([navigation: back behaviour](navigation.md#back-behaviour)).

**How**
- [weak] **Say what the X does.** NN/g's [cancel vs close](https://www.nngroup.com/articles/cancel-vs-close/): "The main issue lies with the common lack of a text label for the X icon": people cannot tell close-and-keep from cancel-and-discard. Where work is at stake, add a labelled Cancel, "an emergency exit out of the process".
- [contested] **Cancel and X discard in a modal.** Carbon's [modal](https://carbondesignsystem.com/components/modal/usage/): the X will "close the modal without submitting any data"; "Cancel undoes all applied changes." Neither submits.
- [moderate] **Ask before discarding typed work**, from Cancel, X and Escape alike ([Escape, backdrop click and one at a time](../components/modal-dialog.md#escape-backdrop-click-and-one-at-a-time)); nothing typed means no question.
- [moderate] **Labels.** "Cancel" for abandoning, never "No" or "Close" on a task; "Close" for a footer button on a dialog that only informs (Atlassian: "decide whether a ‘cancel’ or 'close’ button is needed in the footer"). Placement is *Button groups and order*: Cancel leading in a dialog, beside the submit at a form's foot.
- [weak] **A Back link** sits at the top, before `main`; GOV.UK's [back link](https://design-system.service.gov.uk/components/back-link/): "Always place back links at the top of a page, before the `<main>` element", says "Back" or "Go back to [page]", and takes the person "to the previous page they were on, in the state they last saw it". GOV.UK: "Never use the back link component together with the Breadcrumbs component."

**Cases**
- An edit dialog whose X saves and whose Cancel discards → both discard; a save is the primary button's job.
- A filter panel that applies as the person ticks → its X closes and keeps the filters, since nothing is pending (NN/g's close case).
- Cancel on page 3 of an application → leave the journey to its start page, answers kept as a draft where the service saves them ([forms: keeping input](forms.md#keeping-input)).
- A Back link that returns to page 2 with its answers blank → restore them; GOV.UK's "in the state they last saw it".

**Accessibility**
- [required] 4.1.2: the X is a named button, "Close" or "Close dialog" (code-standard rule 18). 2.1.1: Escape does what the X does.
- [required] 3.3.4 Error Prevention: a Cancel that throws away entered data is checked first. 2.4.3: closing returns focus to the trigger (dialogs).

**Build**
- [required] In a dialog, Cancel and X are `<button value="cancel" formnovalidate>` inside `form method="dialog"`, closing with no script; the dirty check listens on `cancel` ([dialogs](../components/modal-dialog.md#escape-backdrop-click-and-one-at-a-time); [HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- [moderate] A Cancel that leaves a page is a link to where the person came from, not `history.back()` ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- [required] A Back link is an `<a href>` to the previous step's address, rendered by the server so it works without script (code-standard rule 20); the step restores its answers from the saved draft ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- [required] The X glyph is `aria-hidden` and the button named (code-standard rule 18; [accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).

**Check**
- *Script* could: type in each dialog, press X, Cancel and Escape, and assert each asks or keeps nothing submitted; flag a Back link without `href`, one after `main`, or a page with both a back link and breadcrumbs.
- *Judgement*: if the person presses X now, will they get what they expect?

**Sources.** NN/g advises that an ambiguous X should "err on the side of caution and save any intermediate work"; Carbon makes the X discard. The contested item follows Carbon inside a modal dialog, where a primary button exists to save, and asking before discarding typed work meets NN/g's worry; on a surface that applies changes live, close keeps them, as NN/g says.

## Toolbars and bulk actions

**Use when / don't use**
- [strong] A toolbar groups three or more controls acting on one region. The W3C [toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/): "only if the group contains 3 or more controls."
- [moderate] A bulk bar appears once items are selected and offers what applies to all of them.
- [weak] No selection controls in an action bar. Primer: "Buttons are the only controls allowed in an ActionBar." Filters belong to the filter bar (design-standard rule 3).

**How**
- [moderate] Carbon's table toolbar holds "up to five actions"; the rest overflow. Apple's [toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars): decide which items overflow as the bar narrows.
- [weak] No primary in an action bar (Primer); icon buttons ghost.
- [strong] Related actions grouped, divided, in a fixed order; "More" keeps the bar's order.
- [required] Bulk: a bar naming the count ("3 selected"), its actions, and Cancel; per-row actions disabled meanwhile (Carbon). It replaces the toolbar at the same height so the table does not move (design-standard rule 2).
- [weak] A header checkbox selects the visible page; "Select all 240" is a separate step.

**Cases**
- A rich-text editor with twelve buttons → one toolbar, one tab stop, arrows between, rarest in "More" when narrow.
- Selecting rows inserts a new bar that pushes the table down → the bar takes the toolbar's place.
- A formatting toolbar with "Bold" on → a toggle with `aria-pressed`; Primer's ActionBar forbids selected states, so an editor toolbar and an action bar are different components.

**Accessibility**
- [strong] 2.1.1 and 2.4.3: one tab stop, arrows inside, entry on the first enabled control (W3C). 4.1.2: the toolbar has a name. 4.1.3: "3 selected" is announced.

**Build**
- [strong] `role="toolbar"` with a name, a roving tabindex across its buttons, and toggles carrying `aria-pressed`; the [APG toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) keys ([accessibility: *Menus, menu buttons and toolbars*](../../code/accessibility.md#menus-menu-buttons-and-toolbars)).
- [required] The bulk bar replaces the toolbar in the same slot: both are rendered, the inactive one `hidden`, and the slot keeps one height (code-standard rule 17; [performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).
- [required] "3 selected" is written into a `role="status"` element present from load, not announced by re-rendering the bar ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- [required] Row selection is checkboxes with labels naming the row; the header checkbox's mixed state is `indeterminate` set from script ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [moderate] Overflow into "More" keeps the bar's order; which items overflow is decided by a container query on the bar, not the viewport ([responsive: *Container queries*](../../code/responsive.md#container-queries)).

**Check**
- *Script* could: assert `role="toolbar"` has three or more controls and a name and takes one Tab; select a row and assert the first row did not move (design-standard rule 2's method).
- *Judgement*: does each toolbar act on one region, and is anything in it a filter?

**Sources.** The W3C, Carbon, Primer and Apple agree on grouping and overflow.
