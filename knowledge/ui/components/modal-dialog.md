# Modal dialog

A modal dialog puts a short task or decision over the page and keeps the person in it until it is done or dismissed. This page owns the modal dialog as a component, in design, in Figma and in code: its anatomy, focus, dismissal, size and height, and the confirmation dialog. What spans surfaces stays in [`../patterns/dialogs.md`](../patterns/dialogs.md): choosing between a tooltip, a popover, a drawer, a dialog and a page, and when a task outgrows a modal. Related: [drawer](drawer.md), [popover](popover.md), [tooltip](tooltip.md), [button](button.md), [actions](../patterns/actions.md).

## Overview

**Use when / don't use**
- [weak] Choose the surface before drawing it: [dialogs: *Choosing the surface*](../patterns/dialogs.md#choosing-the-surface) and [*A modal or a page of its own*](../patterns/dialogs.md#a-modal-or-a-page-of-its-own) decide between this and the rest.
- [moderate] One dialog component for every modal task; the confirmation is the same component with `role="alertdialog"`, never a second one ([confirmation dialogs](#confirmation-dialogs)). Primer's Dialog takes `role?: 'dialog' | 'alertdialog'` ([Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)); Figma's Simple Design System builds every dialog from one `Dialog` and one `DialogBody` ([SDS DialogBody.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/dialog/DialogBody.figma.ts)).
- [moderate] A panel that slides from an edge is a [drawer](drawer.md), its own component even where the code builds it on the same element: Primer reaches it through Dialog's `position="left|right"`, Fluent through an `OverlayDrawer` that takes its dialog's `modalType` ([Fluent Drawer types](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-drawer/library/src/shared/DrawerBase.types.ts)).

**Anatomy**
- [strong] A surface over a backdrop, holding a header (title, optional description, close button), a body, and a footer of actions; what each part says and does is [modal dialog anatomy](#modal-dialog-anatomy). MUI splits these into `DialogTitle`, `DialogContent` and `DialogActions` ([MUI Dialog types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Dialog/Dialog.d.ts)); Primer into `title`, `subtitle`, the body and `footerButtons` ([Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)); SDS into `DialogClose`, `DialogTitle`, `DialogBody` and a button group ([SDS DialogBody.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/dialog/DialogBody.figma.ts)).
- [required] The close button is an icon button with an accessible name of its own (code-standard rule 18; figma-standard rule 40); SDS's `DialogClose` is an `IconButton` with `aria-label="Dismiss dialog"` ([SDS Dialog.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Dialog/Dialog.tsx)).
- [required] The close button and the footer's actions are instances of the library's icon button and button, never drawn inside the dialog (figma-standard rule 27); their ranks are [button hierarchy](button.md#button-hierarchy).

## Modal dialog anatomy

**Use when / don't use**
- [strong] Every modal dialog has a title, a body, actions, and a visible close.
- [weak] Don't add a description when the title says it all. Carbon's [modal](https://carbondesignsystem.com/components/modal/usage/): if "the title and the purpose are clear… a description is not needed."

**How**
- [moderate] **Title**: names the task as a short verb phrase. Carbon: "If the modal is accessed by clicking a button, use the button label for the modal title" ("Create access group" opens "Create access group"). Primer: "The title is required for all Dialogs", visually hidden only for special cases such as a command palette.
- [weak] **Body**: only what the task needs. Carbon: "Include only fields, components, and embedded assistance that are relevant to completing the current task", and avoid links that take the person away.
- [strong] **Actions**: named for outcomes, never "OK" (see [button: button labels](button.md#button-labels)). One primary per dialog, on the trailing side, Cancel leading (Carbon; Primer; Apple). A third action, if any, is quieter and at the far leading edge.
- [moderate] **Close**: an always-visible close button in the header. Primer: "The close button is required and may not be visually hidden." The W3C [dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) recommends "a visible element with role button that closes the dialog". Close and Cancel discard; neither submits (Carbon).
- [weak] **Backdrop**: dims the page so the person sees it is unavailable. The W3C pattern marks a dialog modal only when outside content is both inert and visually obscured.
- [weak] **Validation**: errors show inside the dialog and it stays open. Carbon: "Validate a user's entries before the modal is closed."

**Cases**
- A button "New project" opens a dialog titled "Create a new project" → title "New project", matching the trigger; Carbon warns against mixing "New user" and "Create user".
- A dialog whose footer reads "OK / Cancel" → "Create project / Cancel".
- A dialog with no close button and only "Done" → add a close button and Cancel; Apple's [sheets](https://developer.apple.com/design/human-interface-guidelines/sheets): pair Done with Cancel, since "Relying solely on the Done button implies that completing the task is the only way to exit".

**Accessibility**
- [required] 4.1.2 Name, Role, Value: the dialog is named by its visible title (`aria-labelledby`); the close button has a name (code-standard rule 18).
- [required] 1.3.1 Info and Relationships: the title is a heading; long bodies keep their headings and lists.
- [weak] The W3C pattern advises omitting `aria-describedby` when the body has structure (lists, tables, several paragraphs), since it would be read "as a single unbroken string".

**Build**
- [required] `dialog` named by its heading with `aria-labelledby`; header, body and footer as plain children, the footer a button group ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
  ```html
  <dialog id="new-project" aria-labelledby="np-h"><form method="dialog">
    <header><h2 id="np-h">New project</h2>
      <button value="cancel" formnovalidate aria-label="Close"><svg aria-hidden="true">…</svg></button></header>
    <div>…</div><footer>…</footer></form></dialog>
  ```
- [required] A button in a `form method="dialog"` closes it with no script and sets `returnValue`; the close button is named and its glyph hidden (code-standard rule 18).
- [required] `::backdrop` paints the dim from a token (code-standard rule 22).
- [weak] Validation errors render inside the dialog's `form`; the submit handler keeps it open until the server accepts ([HTML semantics: *Forms markup*](../../code/html-semantics.md#forms-markup)).
- [weak] No `tabindex` on `dialog`; `aria-describedby` only for a short, unstructured body.

**Check**
- *Script* could: for each `dialog` or `role="dialog"`, assert an accessible name, a visible close button in the tab sequence, and no footer button named OK, Yes or No.
- *Judgement*: does the title name the task in the trigger's words?

**Sources.** Carbon, Primer, Apple and the W3C agree on the anatomy; only Primer makes the close button mandatory and never hidden.

## Focus: in, trapped, returned

**Use when / don't use**
- [strong] Every modal dialog. A dialog is opened by the person, takes focus, keeps it, and gives it back to its trigger on close.

**How**
- [strong] **In.** On open, focus moves inside. Where to, per the W3C [dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/):
  - generally the first focusable element;
  - the title or first paragraph (made focusable with `tabindex="-1"`) when the content is long or structured, so its start does not scroll out of view;
  - the least destructive action for "a process that is not easily reversible";
  - the most used button when the dialog only informs or continues.
  Carbon adds: the first field when there is a form, the primary button in a transactional dialog without inputs. MDN's [`dialog`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) recommends `autofocus` on the intended element.
- [strong] **Trapped.** Tab and Shift+Tab wrap inside the dialog; the page behind is inert. `showModal()` gives inertness and Escape (HTML).
- [strong] **Returned.** On close, focus goes back to the element that opened it, unless that element no longer exists or the next step logically lives elsewhere (W3C). After "Delete row", focus goes to the next row or the table, never to the document start.
- [required] The return target is an annotation in the file for every dialog whose trigger disappears (figma-standard rule 52).

**Cases**
- A "Rename" dialog → focus in the name field, text selected.
- "Delete project?" → focus on Cancel; Enter pressed by reflex does nothing harmful.
- A terms dialog with six paragraphs → focus on the title, so a screen reader starts at the top and the person can read down.
- "Add rows" opens a dialog asking how many → after it closes, focus on the first new row (the W3C's own example).

**Accessibility**
- [required] 2.4.3 Focus Order: entry and return as above; the W3C's Understanding 2.4.3 uses a modal dialog as its example.
- [required] 2.1.2 No Keyboard Trap: a modal is a sanctioned trap only because Escape and the close button leave it ([W3C Understanding 2.1.2](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html): focus can be moved away "using only a keyboard interface").
- [required] 2.4.11 Focus Not Obscured (Minimum): a sticky dialog footer does not cover the focused field while tabbing through a scrolling body.
- [weak] Return of focus is not yet a code-standard rule; code-standard rule 14 covers the related case of a live swap.

**Build**
- [required] `showModal()` gives inertness, the trap and the focus return; `autofocus` marks the element to focus on open ([accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- [weak] Long or structured content: `tabindex="-1"` and `autofocus` on the heading, so reading starts at the top.
- [contested] Irreversible confirmation: `autofocus` on Cancel.
- [required] Trigger gone on close: the `close` event handler focuses the designed target (the next row, the list heading), never `body` (code-standard rule 14).
  ```js
  dialog.addEventListener('close', () => { if (!trigger.isConnected) next.focus(); });
  ```
- [required] No focus-trap library: `inert` comes with `showModal()` ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).

**Check**
- *Script*: mostly mechanical. Could: open each dialog by keyboard; assert focus is inside; Tab from the last element reaches the first; Escape closes; focus returns to the trigger; elements outside are inert while open.
- *Judgement*: is initial focus where the person's next action is, and is it the safe choice when the action is irreversible?

**Sources.** The W3C and Carbon disagree on a destructive confirmation without inputs: Carbon focuses the primary, the W3C advises the least destructive action, and Apple suggests making no button the default when people should read.

## Escape, backdrop click and one at a time

**Use when / don't use**
- [strong] Escape closes every modal dialog, always.
- [moderate] A backdrop click closes a dialog only when closing loses nothing.
- [contested] Only one modal surface at a time; never a dialog that opens a dialog.

**How**
- [strong] **Escape**: closes without submitting (W3C; Carbon lists Esc for every variant). Native `showModal()` provides it; a custom dialog must.
- [moderate] **Backdrop click**: Carbon allows "click elsewhere" only for passive, information-only modals; transactional, progress and acknowledgment modals close by their buttons, the close icon and Escape. Primer dismisses on backdrop click by default, but "if the Dialog contains a form that can have unsaved changes, the backdrop won't dismiss the Dialog". The native `closedby` attribute on `dialog` sets this per dialog (MDN).
- [weak] **Unsaved input**: if any way of closing would lose what the person typed, confirm first. Apple's [modality](https://developer.apple.com/design/human-interface-guidelines/modality): "if closing the view could result in the loss of user-generated content, be sure to explain the situation and give people ways to resolve it."
- [contested] **One at a time**: Carbon: "One modal should never trigger another modal. If the first modal task is dependent on a confirmation modal to approve then that first task should not be preformed in a modal." Apple: "Let people dismiss a modal view before presenting another one", though an alert may appear over other modal views.
- [weak] **The one exception**: the discard-changes confirmation when closing a dirty dialog may sit over it (Apple's alert exception). Anything else that needs a second dialog belongs on a page.

**Cases**
- An information dialog ("What's new") → Escape, close button and backdrop click all close it.
- An edit dialog with typed changes → backdrop click does nothing; Escape or Cancel asks "Discard changes?" with "Discard" and "Keep editing".
- A settings dialog with a "Delete account" button that opens a confirmation dialog → move account deletion to a settings page, where its confirmation is the only dialog.

**Accessibility**
- [required] 2.1.1 Keyboard: Escape is the keyboard's backdrop click; every dismissal a pointer has, the keyboard has.
- [required] 2.1.2 No Keyboard Trap: Escape is the standard exit that makes the trap legitimate.
- [required] `aria-modal` only when the page behind is truly inert (W3C note); `showModal()` sets it implicitly (MDN).

**Build**
- [required] Escape: `showModal()` fires `cancel` then `close`; a dirty dialog calls `preventDefault()` on `cancel` and asks first (HTML).
- [moderate] Backdrop: `closedby="any"` for an information dialog, `closedby="closerequest"` where typed input could be lost; where `closedby` is unsupported, a click whose target is the `dialog` itself closes it only for the passive kind ([MDN `dialog`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog); [browser support: *Progressive enhancement and feature queries*](../../code/browser-support.md#progressive-enhancement-and-feature-queries)).
- [required] `aria-modal` is implicit with `showModal()`; never set it on a non-modal surface (ARIA).
- [contested] One at a time: the open function refuses while another `dialog:modal` is open, except the discard-changes confirmation.
- [required] One dialog module for the product (code-standard rule 36; [javascript: *One implementation per behaviour*](../../code/javascript.md#one-implementation-per-behaviour)).

**Check**
- *Script* could: open each dialog, type into a field, click the backdrop and assert the dialog is still open with the text intact; press Escape and assert a dialog closes or asks; assert no second `dialog[open]` appears from inside the first except a confirmation.
- *Judgement*: does every route out of this dialog keep the person's work?

**Sources.** Primer accepts up to two nested dialogs with correct focus management; Carbon forbids nesting outright; Apple allows only an alert over a modal.

## Size and scrolling

**Use when / don't use**
- [moderate] Size the dialog for its content from a small fixed set; scroll the body, never the whole dialog or sideways.
- [moderate] When the largest size still scrolls a lot, it is a page.

**How**
- [weak] Carbon's [modal](https://carbondesignsystem.com/components/modal/usage/) has four sizes, each with a maximum height: "Modals with brief text should be extra small or small to avoid long single lines"; "If the large modal height is still not enough space then a full page might be needed instead."
- [strong] **Three to five named widths, the default between 480 and 640px.** Atlassian small 400, medium 600 (default), large 800, x-large 968 ([width.js](https://unpkg.com/@atlaskit/modal-dialog@17.3.0/dist/es2019/internal/width.js)); Primer small 296, medium 320, large 480, xlarge 640 (default) ([Dialog.module.css](https://github.com/primer/react/blob/main/packages/react/src/Dialog/Dialog.module.css)); Spectrum S 400, M 480 (default), L 640 ([Spectrum CSS dialog](https://github.com/adobe/spectrum-css/blob/main/components/dialog/index.css)); Cloudscape small 320, medium 600 (default), large 820, x-large 1024, xx-large 1280 ([modal styles](https://github.com/cloudscape-design/components/blob/main/src/modal/styles.scss)); Polaris small 380, default 620, large 980 ([Dialog.module.css](https://github.com/Shopify/polaris/blob/main/polaris-react/src/components/Modal/components/Dialog/Dialog.module.css)); MUI xs 444, sm 600 (default), md 900 ([Dialog.js](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Dialog/Dialog.js)); Bootstrap sm 300, 500 (default), lg 800, xl 1140 ([`_variables.scss`](https://github.com/twbs/bootstrap/blob/v5.3.8/scss/_variables.scss)); Chakra md 512 (default) on Tailwind's container scale ([sizes.ts](https://github.com/chakra-ui/chakra-ui/blob/main/packages/react/src/theme/tokens/sizes.ts)). Other defaults: Ant 520 ([Modal.tsx](https://github.com/ant-design/ant-design/blob/master/components/modal/Modal.tsx)), Base Web 500 ([constants.ts](https://github.com/uber/baseweb/blob/main/src/modal/constants.ts)), Mantine md 440 ([Modal.module.css](https://github.com/mantinedev/mantine/blob/master/packages/@mantine/core/src/components/Modal/Modal.module.css)).
- [contested] **Named sizes or one cap.** Most ship named sizes (above). Fluent caps at 600px ([DialogSurface styles](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-dialog/library/src/components/DialogSurface/useDialogSurfaceStyles.styles.ts)), Radix Themes at 600px ([base-dialog.css](https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/_internal/base-dialog.css)) and Material 3 web at 560px with a 280px minimum ([`_dialog.scss`](https://github.com/material-components/material-web/blob/main/dialog/internal/_dialog.scss)), with no names; the caller sets any other width.
- [contested] **Fixed width, maximum width, or a share of the viewport.** Atlassian, Primer, Spectrum, Ant, Mantine and Base Web fix the width and cap it at the viewport; MUI, Chakra, Cloudscape and Bootstrap set a maximum and fill up to it; Carbon sets a percentage per breakpoint (medium 84%, 60%, 48%) ([`_modal.scss`](https://github.com/carbon-design-system/carbon/blob/main/packages/styles/scss/components/modal/_modal.scss)) and SLDS 50% capped at 40rem ([SLDS modal CSS](https://unpkg.com/@salesforce-ux/design-system@2.264.3/css/modals/base/index.css)).
- [moderate] Long content: the body scrolls with header and footer fixed. Carbon: "The content should visibly fade at the end of the modal body area to indicate there is additional content out of view"; "Modal content should never scroll horizontally." Primer adds a divider between footer and body when the body scrolls.
- [weak] Body text no wider than a comfortable measure; Carbon keeps text at 80% of the modal's width while components may span it.
- [moderate] **Narrow screens**: Primer turns a centred dialog into a full-screen dialog or a bottom sheet; "Dialogs that have one or more input fields should always use the full-screen variant." Apple: avoid popovers in compact views and use a sheet instead.
- [weak] Avoid an alert that scrolls (Apple's [alerts](https://developer.apple.com/design/human-interface-guidelines/alerts)): keep confirmation text to two or three lines.

**Cases**
- A dialog whose whole frame scrolls, taking the footer off screen → fix header and footer, scroll the body, add the fade or divider.
- A dialog at 320px with a two-column form → one column; at narrow widths, full-screen.
- A dialog containing a data table with batch actions → a page; Carbon's [dialog pattern](https://carbondesignsystem.com/patterns/dialog-pattern/) says to "avoid preforming table functions like batch editing or batch actions inside the modal itself".

**Accessibility**
- [required] 1.4.10 Reflow: at 320 CSS pixels the dialog's content reads without horizontal scrolling (a [code candidate](../../code/candidates.md) for pages).
- [required] 1.4.4 Resize Text: at 200% text the footer stays reachable; fixed-height bodies scroll rather than clip.
- [required] 2.4.11: a fixed footer does not cover the focused element in the scrolling body.

**Build**
- [required] Sizes are a variant attribute, `size="sm|md|lg"`, each a `max-inline-size` token (code-standard rules 9 and 22).
- [moderate] The dialog is a column grid with the body scrolling: header and footer stay, `overflow-x` never scrolls.
  ```css
  dialog > form { display: grid; grid-template-rows: auto 1fr auto; max-block-size: min(var(--dialog-max-h), 100svh - 2 * var(--space-32)); }
  dialog > form > div { overflow-y: auto; }   /* header, body, footer */
  ```
- [moderate] `svh`, not `vh`, so the mobile toolbar does not cut the footer ([Maximum height and position](#maximum-height-and-position)) ([responsive: *Viewport units*](../../code/responsive.md#viewport-units)).
- [moderate] Narrow screens with inputs: a container or breakpoint query makes it full screen ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)); reflow at 320px is [responsive: *Zoom and reflow*](../../code/responsive.md#zoom-and-reflow).
- [weak] Body text measure in `ch` or `max-inline-size`, not a fixed width ([i18n: *Text expansion and no fixed widths on text*](../../code/i18n.md#text-expansion-and-no-fixed-widths-on-text)).

**Check**
- *Script* could: open each dialog at 320px and at 200% zoom; assert no horizontal scroll inside it, the footer is visible, and the focused element is not covered by header or footer.
- *Judgement*: is this a dialog's worth of content?

**Sources.** Carbon and Primer agree on body scrolling and on a page for anything larger. Widths from each system's source, read 2026-11-24; Spectrum 2's own source marks its widths "Copied from designs, not sure if correct" ([Modal.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/Modal.tsx)), so Spectrum CSS's are cited. How width tokens are named is [tokens: width tokens](../../code/tokens.md#width-tokens). Primer's narrow-screen rule (full screen whenever there are inputs) is stricter than Carbon's sizing.

## Maximum height and position

**Use when / don't use**
- [strong] Every centred modal has a maximum height: the viewport's small height less a fixed gap at top and bottom. Its own height is its content's, up to that cap; past it, the body scrolls.
- [moderate] Don't cap it with a percentage of the viewport alone. A percentage leaves a wide band on a tall monitor and almost none on a short laptop or a phone held sideways; a fixed gap is the same everywhere.
- [contested] Centred or anchored to the top: Primer and Material centre, Atlassian anchors to the top at 60px, and Primer offers that as an option (sources below). Where the project centres, a dialog that must not move gets a fixed height instead (below).

**How**
- [strong] **The gap to the window edges.** The systems that state one use a fixed length, not a fraction: Primer's dialog is `max-height: calc(100dvh - 64px)` (32px each side) in its [source](https://github.com/primer/react/blob/main/packages/react/src/Dialog/Dialog.module.css); Material's web dialog is `max-height: min(560px, calc(100% - 48px))` in its [source](https://github.com/material-components/material-web/blob/main/dialog/internal/_dialog.scss), and Android's dialog insets 80dp top and bottom ([Material Components, Dialog](https://github.com/material-components/material-components-android/blob/master/docs/components/Dialog.md)); Atlassian's [modal dialog](https://atlassian.design/components/modal-dialog/examples) sits 60px from the top with a cap of `100vh - 119px` in its published styles. The browser's own modal `dialog` is capped at `calc(100% - 6px - 2em)` (the [HTML rendering rules](https://html.spec.whatwg.org/multipage/rendering.html)), about 19px each side. Carbon is the exception: its [modal style](https://carbondesignsystem.com/components/modal/style/) caps each size at a percentage (extra small 48%, small 72%, medium 84%, large 96%), "in order to maintain a proper window ratio".
- [weak] **The minimum gap from the top.** At the cap, the top gap is the fixed gap: 2rem (32px), Primer's figure, which sits between Material's 24px and Atlassian's 60px and keeps the backdrop visible, so the page behind still reads as present and the dialog as on top of it. Primer drops it to 6px only when the viewport is 280px tall or less.
- [moderate] **vh, svh and dvh.** `vh` is the large viewport, the one with the mobile toolbars retracted: MDN's [length](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length) page says "all default viewport units (vh, vw, etc.)" equal their large counterparts, so a dialog capped in `vh` runs under the toolbars when they show. `svh` is the viewport with them shown, stable; `dvh` follows them, and MDN warns its sizes "are not stable, even when the viewport itself is unchanged" ([web.dev, viewport units](https://web.dev/blog/viewport-units); [responsive: *Viewport units*](../../code/responsive.md#viewport-units)). A modal locks the page's scroll, so the toolbars do not move while it is open and `svh` and `dvh` agree; `svh` is the one that is never under a toolbar. Neither unit sees the on-screen keyboard, which is why a form goes full screen on a phone.
- [strong] **Header and footer fixed, the body scrolls.** The dialog is a column: header and footer keep their height, the body takes the rest and scrolls. Atlassian: "Once it reaches a certain threshold, the body content will scroll while the header and footer remain fixed"; Primer: "If the maximum height is reached, the body contents will scroll"; Polaris's [modal](https://shopify.dev/docs/api/app-home/latest/web-components/overlays/modal): "Content within the modal scrolls if it exceeds available height." The actions footer is therefore always on screen. Atlassian also offers scrolling the whole dialog in the viewport, which takes the footer off screen ([Size and scrolling](#size-and-scrolling)).
- [strong] **Full screen or a sheet on small screens.** Below about 30rem wide, a modal with inputs fills the screen: Atlassian's modal goes full height below 30rem in its styles; Primer switches its narrow position (`bottom` or `fullscreen`) below 768px; Carbon says "On mobile devices, at the smaller break points the max-height does not apply." Material reserves the full-screen dialog for "a series of tasks", such as a calendar entry. Apple's [sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) rest at medium or large detents on iPhone and centre a page or form sheet on iPad, "on top of a dimmed background view"; "For complex or prolonged user flows, consider alternatives to sheets". A phone held sideways is wide but short: the height query makes it full screen too.
- [moderate] **Centred without jumping.** A centred dialog that grows moves both edges by half the growth, so its title shifts when a field is revealed, an inline error appears or a list loads. For a dialog whose content changes while it is open, set its height to that of its largest state (Primer's `height="small|large"`, 480px and 640px; Atlassian's `height` prop), so it opens at the size it will need and the body scrolls inside it. For one whose content does not change, height from content is right. Polaris centres always: "The modal always renders centered in the viewport and cannot be repositioned."
- [required] **Centre with the browser's own mechanism.** A modal `dialog` and a `[popover]` are already `position: fixed` with `inset: 0`, `height: fit-content` and `margin: auto` (the HTML rendering rules), which centres them on both axes with no transform; Material's web dialog keeps exactly that. A `translate: 0 -50%` does the same and can land the box on a half pixel; it also means overriding the defaults the browser already set.
- [moderate] **A tall form is still a page.** A cap plus a scrolling body makes a long form fit, not usable: when the largest size scrolls a lot, it is a page ([A modal or a page of its own](../patterns/dialogs.md#a-modal-or-a-page-of-its-own)). GOV.UK publishes no modal; the [modal dialogue backlog](https://github.com/alphagov/govuk-design-system/issues/6054) records its guidance to "avoid modals in most cases".

**Cases**
- A dialog capped at `85svh` on a 1,200px-tall monitor leaves 90px above and below for nothing, and on a 400px landscape phone 30px → `calc(100svh - 2 * 2rem)`, the same gap at every height.
- A dialog capped at `90vh` hides its footer under Safari's toolbar → `svh`.
- An "Add user" dialog shows a second section when a checkbox is ticked and its title jumps up 120px → give it the fixed height of its open state; the body scrolls.
- A three-field dialog on a 360px phone with the keyboard up covers its own Save button → full screen below 30rem wide or tall, footer pinned.

**Accessibility**
- [required] 1.4.10 Reflow: at 400% zoom (320 CSS pixels) the viewport is also short; the fixed gap and the full-screen query keep header, body and footer usable rather than a sliver of body.
- [required] 1.4.4 Resize Text: a fixed dialog height clips nothing because the body scrolls; never fix the height of the whole dialog without a scrolling body.
- [required] 2.4.11 Focus Not Obscured (Minimum): the pinned footer does not cover the focused field in the body ([Focus: in, trapped, returned](#focus-in-trapped-returned)).

**Build**
- [required] Centred by the defaults, capped with a fixed gap in `svh`; header and footer `flex: none`, body `overflow: auto` (code-standard rule 22 for the token).
  ```css
  dialog { inset: 0; margin: auto; block-size: fit-content;
    max-block-size: calc(100svh - 2 * var(--space-32)); display: flex; flex-direction: column; }
  dialog > .body { flex: 1 1 auto; overflow: auto; overscroll-behavior: contain; }
  dialog[data-height="fixed"] { block-size: min(var(--dialog-h), 100svh - 2 * var(--space-32)); }
  @media (max-width: 30rem), (max-height: 30rem) {
    dialog:has(input, select, textarea) { inset: 0; margin: 0; inline-size: 100%; block-size: 100svh; max-block-size: none; border-radius: 0; } }
  ```
- [required] `overscroll-behavior: contain` stops a scroll that reaches the body's end from passing to the page behind (CSS).
- [weak] The breakpoint is a page dimension in one place ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)).

**Check**
- *Script* could: open each modal at 1280×1200, 1280×600, 844×390 and 360×640; assert the gap above and below is at least 2rem or the dialog is full screen, the footer is inside the viewport, and the dialog's top does not move when its content changes.
- *Judgement*: does this dialog change size while open, and if so, is its height fixed?

**Sources.** Primer, Material, Atlassian and the browser's defaults cap the height with a fixed gap; only Carbon uses percentages, per size. Primer and Material centre; Atlassian anchors to the top at 60px, and Primer offers that as an option. `svh` equals Primer's `dvh` while the page is locked, and is never under a toolbar.

## Confirmation dialogs

**Use when / don't use**
- [strong] For an action that is serious, uncommon and cannot be undone: deleting an account, sending to everyone, a payment.
- [strong] Not for routine or reversible actions. NN/g's [confirmation dialogs](https://www.nngroup.com/articles/confirmation-dialog/): "Do not use confirmation dialogs for routine actions"; "if you cry wolf too many times, people will stop paying attention to the question". Apple: avoid alerts "for common, undoable actions, even when they're destructive."
- [moderate] Undo first, confirmation only when undo is impossible ([interaction: undo or confirmation](../design/interaction.md#undo-or-confirmation)). This section owns the confirmation dialog; its words follow [content: confirmations and destructive wording](../design/content.md#confirmations-and-destructive-wording).

**How**
- [weak] **Title**: a specific question naming the action and object. Primer's [confirmation dialog](https://primer.style/product/components/confirmation-dialog/guidelines/): "Delete repository?", never "Are you sure?" or "Confirm action".
- [weak] **Body**: the consequence, specifically. Primer: "Explain consequences, especially if they're irreversible" and "Mention specific items being affected." Name counts ("24 files").
- [moderate] **Buttons**: the action verb and "Cancel". NN/g: labels that "summarize what will happen", such as "Delete file" and "Keep file". Apple's alerts: "Always use the title 'Cancel'" for the cancelling button.
- [contested] **Style and focus**: the confirming button in the danger style ([`actions.md`](../patterns/actions.md), *Destructive actions*); initial focus on Cancel; NN/g suggests "it's probably best not to have a default answer at all".
- [required] **Role**: an `alertdialog`, whose description points at the message (W3C [alert dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)).
- [weak] **Highest stakes**: ask the person to type the object's name before the confirming button enables.
- [weak] **Repetitive confirmations** for an action a person repeats many times: NN/g's [overlay guidance](https://www.nngroup.com/articles/overuse-of-overlays/) suggests a "Don't ask me this again" option.

**Cases**
- Archiving a project that can be unarchived → no confirmation; archive and offer Undo.
- Deleting a repository → "Delete repository?", body naming it and its history, "Delete repository" in danger style, focus on Cancel.
- Discarding a long unsaved form → "Discard changes?" with "Discard" and "Keep editing".

**Accessibility**
- [required] 3.3.4 Error Prevention (Legal, Financial, Data): a confirmation satisfies "confirmed" where the action modifies or deletes user data or commits money ([W3C Understanding 3.3.4](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html)).
- [required] 1.4.1: the danger is in the words, not only the red.
- [strong] Focus and Escape as in the sections above.

**Build**
- [required] `dialog` with `role="alertdialog"`, named by its title (`aria-labelledby`) and described by the consequence (`aria-describedby`) ([APG alert dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/)).
- [contested] `autofocus` on Cancel; the confirming button carries the danger variant ([actions: destructive actions](../patterns/actions.md#destructive-actions)).
- [required] `<form method="dialog">` returns the chosen button's `value` in `returnValue`; the caller acts only on the confirming value (HTML).
- [required] Type-to-confirm: the confirming button is `aria-disabled` until the input matches, and the handler checks the match, not the attribute (code-standard rule 62).
- [weak] The server still guards the action ([security: *Forms and cross-site request forgery*](../../code/security.md#forms-and-cross-site-request-forgery)); focus after close is [accessibility: *Focus management*](../../code/accessibility.md#focus-management).

**Check**
- *Script* could: flag a dialog whose buttons are named only OK, Yes or No; assert initial focus in a danger-styled dialog is not on the danger button; flag a title that is "Are you sure?".
- *Judgement*: could this action be undone instead, and does anyone read this dialog after the fifth time?

**Sources.** NN/g, Apple, Primer and GOV.UK agree on the narrow use and outcome-named buttons. Carbon focuses the primary even in a danger modal; the W3C advises the least destructive action.

## In Figma

**Layers**
- [strong] The component set is `Dialog`, the name the code gives it (Primer's and MUI's `Dialog`, SDS's `Dialog`, HTML's `dialog`); this page says *modal dialog* only to tell it from the non-modal surfaces, and every Figma name derives from `Dialog`: parts `Dialog header`, `Dialog actions`, tokens `Component/Dialog/…` (figma-standard rules 9 and 49).
- [required] Auto layout throughout: the surface is a vertical stack of `Header`, `Body` and `Actions`, hugging its content's height; the body fills the width, and the title hugs vertically so a long title wraps (figma-standard rule 33).
- [required] Parts are named for the family and their last word (`Dialog header`, `Dialog actions`), and inside the dialog each layer keeps only the last word (`Header`, `Body`, `Actions`) (figma-standard rules 9 and 10; the toolkit's research article *Naming inside a Figma component* proposes the same `Dialog actions`).
- [required] The close button sits at the header's trailing end, positioned by auto layout, never pinned to a side, so where the project mirrors, a right-to-left dialog mirrors it (figma-standard rule 50).

**Properties**
- [required] `Title` and `Description` are text properties, with `Show description` directly above `Description`; no boolean hides the close button, which the anatomy requires ([modal dialog anatomy](#modal-dialog-anatomy); figma-standard rules 5, 21 and 37).
- [required] The body is a slot named `Slot`, and the footer's buttons sit in an `Actions slot`, so each consumer's button labels survive a variant switch (figma-standard rules 21 and 38). Figma's help centre gives the modal as its own example of what a slot is for: a consumer can "customize the modal with the type of content they needed" while it "still receive[s] library updates" ([slots, instance swaps and variants](https://help.figma.com/hc/en-us/articles/38741465279895-The-difference-between-slots-instance-swaps-and-variants)).
- [required] Property names follow the code: `Title` for Primer's `title` and MUI's `DialogTitle`. SDS names its property `Heading` and maps it onto `DialogTitle` ([SDS DialogBody.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/dialog/DialogBody.figma.ts)), the mismatch figma-standard rule 21 avoids.
- [required] The close button carries its accessible name in its own component, as a text property or an annotation (figma-standard rule 40).

**Variants and states**
- [weak] No `State` axis: the surface itself takes no hover, press or focus; its buttons carry their own states (beyond figma-standard rule 35, which forbids an axis that offers no real choice).
- [contested] **Width's name and values.** Width is one axis of fixed maximum widths, largest first, in every kit and code read; its name and values differ. Carbon's kit draws `Size` with `Large`, `Medium`, `Small` and `Extra small`, which its Code Connect translates to `ComposedModal`'s `size` `lg`, `md`, `sm` and `xs` ([Carbon ComposedModal.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/ComposedModal/ComposedModal.figma.ts)). Primer's code calls it `width` (`small` 296px, `medium` 320px, `large` 480px, `xlarge` 640px, [Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)), while Primer's kit draws `size` with `full` and two portrait values beside those four and leaves it unmapped ([Primer Dialog.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.figma.tsx)); MUI's is `maxWidth`, a breakpoint name or `false` ([MUI Dialog types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Dialog/Dialog.d.ts)). figma-standard rule 21 departs from kits that name it otherwise: `Size` with figma-standard rule 6's lowercase t-shirt values, largest first, which code the project writes takes too; over a library used as shipped, the library's own prop name and values.
- [strong] The narrow-screen form is a variant, since its structure changes, not only its numbers ([size and scrolling](#size-and-scrolling)): where a modal with inputs fills a narrow screen ([maximum height and position](#maximum-height-and-position)), that form is drawn beside the default. Both kits read that draw it name the property as their code does (figma-standard rule 21): SDS draws a full-width bottom sheet as `Type=Sheet` beside `Type=Card`, read into `Dialog`'s `type` ([SDS DialogBody.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/dialog/DialogBody.figma.ts), [dialog.css](https://github.com/figma/sds/blob/main/src/ui/primitives/Dialog/dialog.css)); Primer's kit draws `position` (`center`, `left`, `right`, `bottom`), read into the code's `position`, which also takes `fullscreen` per breakpoint ([Primer Dialog.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.figma.tsx), [Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)). MUI's code reaches full screen with a `fullScreen` boolean, so `Full screen` `False`/`True` ([MUI Dialog types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Dialog/Dialog.d.ts)). Where the code has no prop, a native `dialog` restyled at a breakpoint, the variant has no code partner and the mapping row says so; the toolkit's research article *Where responsive behaviour belongs in a Figma library* names "some modals" among the few components that earn such a variant.
- [required] The width axis comes first, then the narrow-form property, its default value first; a full-screen value takes the whole width, so it pairs with one width value only (figma-standard rules 1 and 2).
- [required] The confirmation is an instance of the same dialog with a danger action in its footer and an annotation saying `alertdialog`, no axis ([confirmation dialogs](#confirmation-dialogs)) (figma-standard rule 52).
- [weak] A dialog whose content changes while it is open is drawn at its fixed height, so the frame shows the body scrolling rather than the box growing ([maximum height and position](#maximum-height-and-position)).

**Tokens**
- [required] The surface's fill, radius, padding, gap, border and shadow, and the backdrop's colour, are bound to variables, semantic and never primitive (figma-standard rules 24 and 29); text fills take text-role tokens (figma-standard rule 28) and meet contrast on the surface in every mode (figma-standard rule 32).
- [required] Where the project has component tokens, they are named `Component/Dialog/<Element>/<property>` and alias semantic ones (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the snapshot's contract lists every axis, property and slot, so one with no code counterpart shows in the parity report.
- *Judgement*: does every route out of the drawn dialog (close, Cancel, the primary) exist in the frame, and does the narrow-screen variant keep the footer on screen?

**Sources.** Figma's Simple Design System, Primer and MUI for parts and names; Figma's help centre for slots; the toolkit's research articles *Naming inside a Figma component* and *Where responsive behaviour belongs in a Figma library* (research folder, August to November 2026). SDS's `Heading` is the one name read here that departs from its own code's.

## Alignment with code

**Structure**
- [strong] Code splits the dialog into a surface and named parts, so Figma draws `Dialog header` and `Dialog actions` as parts of one set, as [In Figma](#in-figma) does. Radix ships `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogTitle`, `DialogDescription` and `DialogClose` ([Radix dialog.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/dialog/src/dialog.tsx)); React Aria `DialogTrigger`, `ModalOverlay`, `Modal` and `Dialog`, whose title is a `Heading slot="title"` at level 2 and whose close is a `Button slot="close"` ([React Aria Dialog.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Dialog.tsx), [Modal.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Modal.tsx)); MUI `Dialog` with `DialogTitle`, an `h2` that takes its id from the dialog's context so `aria-labelledby` is wired for the consumer ([MUI DialogTitle.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/DialogTitle/DialogTitle.js)); Carbon `ComposedModal` with `ModalHeader`, `ModalBody` and `ModalFooter` ([Carbon ComposedModal.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/ComposedModal/ComposedModal.figma.ts), [ModalFooter.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/ComposedModal/ModalFooter.figma.ts)).
- [moderate] Libraries disagree on props against compound parts, not on the parts themselves. Primer's `Dialog` takes `title`, `subtitle` and `footerButtons` as props, and also accepts `Dialog.Header`, `Dialog.Body` and `Dialog.Footer` as slots that replace its defaults ([Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)); Carbon ships both a prop-driven `Modal` (`modalHeading`, `primaryButtonText`, `passiveModal`, `danger`) and the compound `ComposedModal`, and its Code Connect maps the Figma modal onto the compound one ([Carbon Modal.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Modal/Modal.tsx)). The Figma parts are the same under either; the `Slot` and `Actions slot` read most directly as the compound form's children.
- [weak] SDS draws the overlay as its own Figma component: `Dialog` connects to `DialogModal` (React Aria's `ModalOverlay` and `Modal`) and nests a `Dialog Body`, which connects to `Dialog` with `DialogClose`, `DialogTitle` and `DialogBody` ([SDS Dialog.figma.ts](https://raw.githubusercontent.com/figma/sds/main/src/figma/primitives/dialog/Dialog.figma.ts), [SDS DialogBody.figma.ts](https://raw.githubusercontent.com/figma/sds/main/src/figma/primitives/dialog/DialogBody.figma.ts), [SDS Dialog.tsx](https://raw.githubusercontent.com/figma/sds/main/src/ui/primitives/Dialog/Dialog.tsx)). A project whose code splits the overlay from the surface may mirror it the same way; one built on the native `dialog` has a single element and `::backdrop`, so one set.
- [moderate] The element under the parts differs and changes nothing drawn: Primer and MUI render a `div` with `role="dialog"` and `aria-modal` ([Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx), [MUI Dialog.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Dialog/Dialog.js)), while Carbon's `ComposedModal` moves to the native `dialog` behind its `enable-dialog-element` flag ([Carbon ComposedModal.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/ComposedModal/ComposedModal.tsx)). This page's element is in [In code](#in-code).

**Mapping**
- [required] Each Figma property maps to one attribute, prop or child, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | Width axis | the code's width prop (Carbon `size`, Primer `width`, MUI `maxWidth`), each value a `max-inline-size` token; `Size` with t-shirt values where the project writes the code (figma-standard rules 6 and 56) ([In Figma](#in-figma)) |
  | Narrow-form property | the code's prop as named (SDS `type`, Primer `position`, MUI `fullScreen`); on a native `dialog` with none, nothing: a breakpoint or container query restyles the one element ([maximum height and position](#maximum-height-and-position)) |
  | `Title` | the heading, referenced by `aria-labelledby` |
  | `Show description`, `Description` | a paragraph, referenced by `aria-describedby` only when it is short and unstructured |
  | `Slot` | the body's children |
  | `Actions slot` | the footer's buttons, inside the `form method="dialog"` |
  | Close button | a named `button` with `value="cancel"` and `formnovalidate` |
  | `alertdialog` annotation | `role="alertdialog"` |
- [required] The backdrop's colour is the token bound in Figma, painted on `::backdrop` (code-standard rule 22).

**States**
- [required] Open and modal are set by the browser when `showModal()` runs: the element carries `[open]` and matches `:open` and `:modal` ([HTML `:modal`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-modal), [HTML `:open`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-open)). No prop sets them, so the frame shows the open dialog over its backdrop and no closed frame exists.
- [moderate] Entering and exiting are states code reaches and no frame draws: React Aria marks the overlay `[data-entering]` and `[data-exiting]` ([React Aria Modal.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Modal.tsx)) and Radix sets `data-state="open|closed"` on the overlay and the content ([Radix dialog.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/dialog/src/dialog.tsx)). They are motion, specified by duration and easing tokens, never by a variant.
- [weak] Where focus lands on opening is set by a prop, not drawn as a state: Primer focuses the footer button marked `autoFocus`, or `initialFocusRef` ([Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)). A frame of the open dialog shows the ring on that element, the one [focus: in, trapped, returned](#focus-in-trapped-returned) chooses, so the developer reads the choice from the frame.
- [weak] Code reaches a non-modal open dialog with `show()` (`[open]` without `:modal`, no backdrop); it is a different surface, a popover or a non-modal drawer, so this set draws no frame for it.

**Differences**
- [moderate] On a native `dialog` the narrow form is a variant in Figma and no prop in code: the frame needs its own structure, the code restyles one element at a breakpoint (the mapping row). Where the code takes a prop, the property is that prop (figma-standard rule 56), as SDS's `Type` and Primer's `position` are ([In Figma](#in-figma)).
- [moderate] The close button is always drawn, while code can leave it out: Primer's default header always renders `Dialog.CloseButton` ([Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)), but React Aria and Radix leave it to the consumer as a `Button slot="close"` or a `DialogClose` ([React Aria Dialog.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Dialog.tsx), [Radix dialog.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/dialog/src/dialog.tsx)). The anatomy requires it ([modal dialog anatomy](#modal-dialog-anatomy)), so a coded dialog without one is the departure, not the frame.
- [moderate] Primer's kit departs from its own code on width: its Figma `size` runs `small` to `xlarge` plus `full`, `small-portrait` and `medium-portrait`, the code's prop is `width`, and its Code Connect leaves it unmapped: "No matching props could be found" ([Primer Dialog.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.figma.tsx), [Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)). Carbon's `Size` has a code value for each of its values, through a translation ([Carbon ComposedModal.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/ComposedModal/ComposedModal.figma.ts)). A value with no code partner is the drift the row exists to prevent.

**Check**
- *Script*: the component contract lists the width axis, the narrow-form property, `Title`, `Description`, the two slots and the close button beside the props and children the code takes; a row with no partner and no line under *Differences* is a finding (design-code-parity). A test can open the dialog and assert it matches `:modal` and is named by its title.
- *Judgement*: could a developer build each frame from the open element and its parts alone, and does the breakpoint that gives the narrow form in code match the width the frame was drawn at?

**Sources.** Library source and Code Connect files as linked: Radix, React Aria, MUI, Primer, Carbon and Figma's SDS; the HTML standard for `:open` and `:modal`. The libraries split on props against compound parts and on a `div` against the native `dialog`; the Figma parts come out the same under each.

## In code

**Element**
- [required] A `dialog` opened with `showModal()`, never a `div` with `role="dialog"`: the element gives inertness, the focus trap and return, Escape and the backdrop (code-standard rule 8; [focus: in, trapped, returned](#focus-in-trapped-returned)).
- [required] It opens without script from `popovertarget` before `showModal()` takes over (code-standard rule 20).
- [weak] HTML also defines a trigger that opens it as a modal with no script, `<button commandfor="new-project" command="show-modal">`, with `close` and `request-close` beside it ([HTML button `command`](https://html.spec.whatwg.org/multipage/form-elements.html#attr-button-command)); check its support before relying on it (beyond code-standard rule 20).
- [required] Backdrop dismissal is the `closedby` attribute, per dialog ([HTML `closedby`](https://html.spec.whatwg.org/multipage/interactive-elements.html#attr-dialog-closedby); [Escape, backdrop click and one at a time](#escape-backdrop-click-and-one-at-a-time)).
- [required] The confirmation is the same element with `role="alertdialog"` ([confirmation dialogs](#confirmation-dialogs)).

**Props**
- [strong] Open state and a close callback, a title, a width, and the body and actions as children: Primer (`title`, `subtitle`, `footerButtons`, `onClose`, `width`, `height`, `role`), MUI (`open`, `onClose`, `maxWidth`, `fullScreen`, `scroll`, with `DialogTitle`, `DialogContent` and `DialogActions` as children) and SDS (`DialogTitle`, `DialogBody`, `DialogClose`, `type`) share this shape ([Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx), [MUI Dialog types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Dialog/Dialog.d.ts), [SDS Dialog.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Dialog/Dialog.tsx)).
- [moderate] The close callback says how the dialog closed, so a dirty dialog can ask before it goes: Primer's `onClose` receives `'close-button' | 'escape'`; a native `form method="dialog"` leaves the pressed button's `value` in `returnValue` ([HTML `dialog`](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)).
- [required] The body and the footer are slots, never a string or render prop (code-standard rule 13).

**Check**
- *Script*: the parity loop compares each variant's geometry and fills with its frame (design-code-parity); the component contract flags a Figma property or slot with no prop.
- *Judgement*: does the coded dialog keep the person's work on every route out, as the frame promises?

**Sources.** Primer, MUI and Figma's SDS for props, the HTML standard for the element, `closedby` and button commands; the behaviour each prop serves is in the sections above.
