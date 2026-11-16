# Toast

A toast is a brief message that appears over the page, in one corner, about something not tied to a place on it: an export finished, a setting saved elsewhere. This page owns the toast as a component, in design, in Figma and in code. Choosing a toast over an inline message, a banner or a dialog stays in [feedback: choosing the feedback](../patterns/feedback.md#choosing-the-feedback), and the record a toast must never be the only copy of is the [notifications centre](../patterns/feedback.md#notifications-centre). Related: [alert](alert.md), [badge](badge.md), [button](button.md), [feedback](../patterns/feedback.md).

## Overview

**Use when / don't use**
- [weak] Passive news about the product, findable again elsewhere; never an error to fix or the only record. The cases are [*Toasts*](#toasts).
- [moderate] A component of its own, apart from the in-page alert, because its placement, timer and live region differ; it shares the alert's tones. Carbon keeps `ToastNotification` beside `InlineNotification`, both with `kind`, `title` and `subtitle` ([Notification.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Notification/Notification.tsx)); MUI keeps `Snackbar` (placement and timer, no tone) apart from `Alert` ([Snackbar types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Snackbar/Snackbar.d.ts)).

**Anatomy**
- [strong] A container holding an optional tone icon, a title or message, at most one action, and a close button. Carbon's toast has `title`, `subtitle`, `caption` and a close button unless `hideCloseButton`; MUI's snackbar `message` and `action`; Radix's parts are `ToastTitle`, `ToastDescription`, `ToastAction` and `ToastClose` ([toast.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/toast/src/toast.tsx)).
- [moderate] The toasts live in one region on the page: Radix's `ToastViewport` is a `role="region"` labelled "Notifications ({hotkey})", reached with F8 by default; MUI places each snackbar by `anchorOrigin`.
- [required] The close button is named and at least 24 by 24 CSS pixels (code-standard rule 18; figma-standard rule 26).

## Toasts

**Use when / don't use**
- [moderate] Use for brief, passive, product-level news that does not belong to a place on the page: an export finished, a setting saved elsewhere.
- [moderate] Don't use for an error the person must fix, a field message, anything critical, or the only record of something.
- [weak] Don't use when the action and its effect share a screen; show the effect there instead.

**How**
- [weak] At most two lines of text. Carbon's ceiling is three ([notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/)); the toolkit sets two because a toast may leave before a slow reader finishes.
- [weak] No essential action. An Undo is the one action a toast may carry, and then it has no timer: Carbon says a toast with an action "should remain on screen until the user dismisses it".
- [required] Auto-dismiss only when the same information can be found elsewhere (the notifications centre, the changed record, an activity log). W3C's [Understanding 2.2.1](https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable.html) treats a disappearing message as a time limit unless the user can get the information another way.
- [contested] One at a time. A second toast replaces the first or queues behind it; Carbon stacks them newest on top, and the toolkit does not, because a stack of vanishing messages is unreadable. Carbon and MUI set no duration by default and Radix 5,000 ms ([*In code*](#in-code)); set one in the project's context document and keep a close button on every toast.
- [required] One region, in one corner, for the whole product. The toast never covers the control the person is using or the focused element (2.4.11).
- [weak] Wording: what happened, in the past tense, with the object named: "Report exported to Downloads". No "Success!".
- [weak] Small screens: full width at the bottom, above any bottom navigation.

**Cases**
- "Changes saved" after an explicit Save on the same screen → drop the toast and show the saved state beside the button: the effect is evident (see *Success confirmation*).
- A toast offering "Retry" for a failed upload → make it an inline message on the upload row: an action makes it essential.
- Bulk delete from a list in view → no toast: the list shows the change, and an inline message above it says "40 findings deleted. Undo", kept until dismissed. Deleting from a page that then closes leaves nothing on screen → a toast with Undo, no timer, dismissed by the person or replaced by the next action; the deletion is committed when it closes.
- A connection drop → a banner, not a toast: it is a condition that persists, and the person must know while it lasts.

**Accessibility**
- [required] 4.1.3: the toast region is a persistent `role="status"` (or `role="alert"` only for the rare urgent case) present on load, and the text is inserted into it. code-standard's candidate notes that `aria-live` on an element that mounts with its content announces nothing.
- [required] 2.2.1 Timing Adjustable: a timed toast whose content exists nowhere else fails unless the person can turn off, adjust or extend the timer.
- [required] 2.1.1 Keyboard: a toast with Undo is reachable by keyboard without hunting; an icon-only close is code-standard rule 18.

**Build**
- [required] One toast region per product, a `role="status"` element in the page from load; the script writes text into it, never mounts the region with its content ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
  ```html
  <div role="status" data-toasts></div>   <!-- in the layout, empty, from the start -->
  ```
- [required] A toast with Undo has no timer and keeps the Undo `button` reachable; every toast has a named close button (code-standard rule 18).
- [strong] A timed toast pauses on hover and focus, and its duration is one token in the project (WCAG 2.2.1).
- [required] Positioned with `position: fixed` and logical insets, clear of safe areas ([responsive: *Safe areas*](../../code/responsive.md#safe-areas)); it never covers the focused element (2.4.11).
- [weak] Enters with `transform` and `opacity`, still under reduced motion ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).

**Check**
- *Script* could: find the toast region and confirm it is a live region present before any toast; flag a toast containing a button that auto-dismisses; flag toast text over two lines at the toast's width; flag an error that appears only in a toast.
- *Judgement*: is this message global enough to be a toast, and can it be found again?

**Sources.** Carbon allows three lines and stacking; Primer steers away from toasts; Lightning ties them to user actions. The toolkit goes with Primer's caution and W3C's 2.2.1 reading: two lines, one at a time, timed only when findable elsewhere.

## In Figma

**Layers**
- [required] Auto layout throughout, text hugging vertically, so a second line grows the toast downward (figma-standard rule 33).
- [required] Layers named for their role: `Icon`, `Title`, `Message`; the action and the close are instances of the library's button and icon button and keep those names unless two must be told apart (figma-standard rule 10).
- [weak] The toast has a fixed maximum width at which the message wraps to its two lines (the line limit is [*Toasts*](#toasts)); it is drawn at that width, never stretched to the frame.

**Properties**
- [required] `Title` and `Message` are text properties (figma-standard rule 37); `Show icon` reveals the tone's icon and `Show action` the action button (figma-standard rules 5 and 21).
- [moderate] The icon follows the tone and is drawn in each `Feedback` variant, not offered as a swap, as on the [alert](alert.md#in-figma), whose tones the toast shares.
- [weak] No boolean for the close button: every toast has one ([*Toasts*](#toasts), Build). Figma's Simple Design System gives its notification a `Dismissible` boolean ([SDS Notification.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/Notification.figma.ts)) because the same component serves in-page messages, which may not be dismissible.
- [required] Every property drives a layer in every variant where that layer exists (figma-standard rule 30).

**Variants and states**
- [required] One tone axis, `Feedback`, in figma-standard rule 1's slot, its values the project's status token words (figma-standard rule 22), such as `Info`, `Success`, `Warning`, `Error`, the same as the alert's and the badge's. With `State` (below) its order is `Feedback → State` (figma-standard rule 1).
- [moderate] A `State` axis of `Rest` and `Focus` only: the toast is no control, but Radix and React Aria make it focusable, so code reaches a focus ring a frame must show ([Alignment with code](#alignment-with-code)); hover and press change nothing, and its action and close buttons are instances that carry their own states.
- [weak] No timing in Figma: a duration is a product token in code, and a toast with an action has none.

**Tokens**
- [required] Fills, strokes, radius, padding and gap bound to semantic variables (figma-standard rules 24 and 29); text in text-role tokens (figma-standard rule 28), meeting contrast in every mode and tone (figma-standard rule 32).
- [required] The shadow is an effect style whose colour, offsets, blur and spread bind variables (figma-standard rule 43).
- [required] Component tokens, where the project has them, follow figma-standard rule 49: `Component/Toast/Container/background-error`.

**Check**
- *Script*: figma-components-audit runs the rules cited above; the snapshot's contract lists the tone values, which the parity report compares with the code's.
- *Judgement*: does the drawn toast hold its two lines at its width in the longest language the product ships?

**Sources.** Carbon, MUI and Radix for the parts; SDS for a notification's Figma properties. The toolkit drops the close boolean because its toasts always close.

## Alignment with code

**Structure**
- [strong] Code splits the toast into a region and the toasts in it, so Figma draws one toast and the region exists only in code. Radix ships `ToastProvider`, `ToastViewport` (a `role="region"` labelled "Notifications ({hotkey})"), `Toast`, `ToastTitle`, `ToastDescription`, `ToastAction` and `ToastClose` ([Radix toast.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/toast/src/toast.tsx)); React Aria a `ToastRegion` fed by a `ToastQueue`, each `Toast` holding a `ToastContent` with `Text slot="title"`, `Text slot="description"` and a `Button slot="close"`, all still exported as `UNSTABLE_` ([React Aria Toast.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Toast.tsx)); MUI's `Snackbar` places and times a `SnackbarContent` that holds `message` and `action` ([MUI Snackbar.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Snackbar/Snackbar.js), [SnackbarContent.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/SnackbarContent/SnackbarContent.js)).
- [moderate] Carbon splits by whether the toast has an action: its Figma toast's `Actionable=True` connects to `ActionableNotification`, whose role defaults to `alertdialog`, and otherwise to `ToastNotification`, whose `Time text` becomes `caption` ([Carbon ToastNotification.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Notification/ToastNotification.figma.ts), [Carbon Notification.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Notification/Notification.tsx)). The toolkit's `Show action` keeps one component, as Radix's optional `ToastAction` and MUI's optional `action` do; the mapping row says what the action changes.
- [weak] Figma's SDS has no toast: one `Notification`, with a `Variant` of `Message` or `Alert`, serves in-page and floating messages alike ([SDS Notification.figma.ts](https://raw.githubusercontent.com/figma/sds/main/src/figma/primitives/Notification.figma.ts)).

**Mapping**
- [required] Each Figma property maps to one prop or attribute, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Feedback` | `tone`, the same word lowercased (Carbon `kind`) |
  | `State=Focus` | `:focus-visible` on the focusable toast, set by the browser |
  | `Title`, `Message` | the title and message text |
  | `Show icon` | the tone's icon, chosen by tone, `aria-hidden` (code-standard rule 18) |
  | `Show action` | an action button; the toast loses its timer |
  | close button | a named `button`; SDS names its own "Dismiss notification" ([Notification.tsx](https://raw.githubusercontent.com/figma/sds/main/src/ui/primitives/Notification/Notification.tsx)) |
  | none | the duration: one product token |

**States**
- [moderate] The toast takes keyboard focus, so code reaches a focus ring a frame must show: Radix renders each toast as an `li` with `tabIndex={0}` in a viewport that F8 focuses ([Radix toast.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/toast/src/toast.tsx)), and React Aria makes each toast an `alertdialog` with `tabIndex: 0`, styled by `[data-focus-visible]` ([React Aria useToast.ts](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/toast/useToast.ts), [Toast.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Toast.tsx)). The browser sets it as `:focus-visible`; [In Figma](#in-figma) draws it as `State=Focus`.
- [moderate] Paused is a state code reaches with nothing to draw: Radix stops every toast's timer while the pointer moves over the viewport or focus is inside it, and while the window is blurred ([Radix toast.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/toast/src/toast.tsx)); React Aria marks the region `[data-hovered]` and `[data-focused]` ([React Aria Toast.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Toast.tsx)). The toast looks the same paused or running.
- [weak] Swipe and motion states are drawn in no frame: Radix sets `data-swipe` to `start`, `move`, `cancel` or `end` and `data-swipe-direction` on the toast ([Radix toast.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/toast/src/toast.tsx)); they are motion, given by tokens.

**Differences**
- [weak] Figma draws no region and no stack: the region's role, label and position are code (the structure above), and the toolkit shows one toast at a time ([*Toasts*](#toasts)).
- [weak] No close boolean, where Carbon's Figma toast has a `Close` boolean that becomes `hideCloseButton` ([Carbon ToastNotification.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Notification/ToastNotification.figma.ts)): the toolkit's toasts always close ([In Figma](#in-figma)), so a coded `hideCloseButton` is the departure.
- [weak] The role is code's alone and the libraries split on it (Carbon and Radix `status`, MUI's `SnackbarContent` `alert`, React Aria `alertdialog`; [SnackbarContent.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/SnackbarContent/SnackbarContent.js)); nothing drawn changes with it, and the toolkit's choice is in [In code](#in-code).

**Check**
- *Script*: the component contract lists `Feedback`, `State`, `Title`, `Message`, `Show icon` and `Show action` beside the props the code takes (design-code-parity). A test can fire a toast, assert the region existed before it, then focus the toast by keyboard and compare its ring with the `Focus` frame.
- *Judgement*: could a developer tell from the frames alone that the region, the timer and its pause are theirs to build?

**Sources.** Radix, React Aria, MUI and Carbon source and Code Connect files as linked, with SDS's. They agree on a region apart from the toasts; Radix and React Aria make the toast focusable, and the libraries split on its role.

## In code

**Element**
- [required] One live region per product, present from load, that the script writes each toast into; the markup is [*Toasts*](#toasts)'s Build.
- [moderate] `role="status"`, polite, by default: Carbon's `role` defaults to `status` and allows `alert` or `log`; Radix gives every toast `role="status"`, raising `aria-live` to assertive for a foreground toast, with a comment that `role="alert"` makes screen readers stutter.

**Props**
- [strong] A tone, a title or message, an optional action and a close handler: Carbon (`kind`, `title`, `subtitle`, `onClose`), MUI (`message`, `action`, `onClose`) and Radix (`ToastTitle`, `ToastDescription`, `ToastAction`, `onOpenChange`).
- [contested] Whether a toast times out by default. Carbon's `timeout` defaults to 0 and MUI's `autoHideDuration` to `null`, so neither closes on its own; Radix closes after 5,000 ms. The toolkit times a toast only when its content is findable elsewhere, and never one with an action ([*Toasts*](#toasts)).
- [weak] Radix requires an `altText` on the action: "an alternate way to carry out the action", for screen-reader users "who will not be able to navigate to the button easily/quickly".

**Check**
- *Script*: the parity loop compares each tone with its frame (design-code-parity); a test could fire a toast and assert the live region existed before it and holds its text.
- *Judgement*: if the person looked away, can they find the message again?

**Sources.** Carbon, MUI and Radix sources as linked; they agree on the parts, split on the timer, and mostly choose a polite role, though MUI's `SnackbarContent` defaults to `alert`.
