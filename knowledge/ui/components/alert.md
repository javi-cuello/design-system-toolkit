# Alert

An alert is a message with a severity, shown in the page: a banner about the whole page or product, or an alert at the top of one region. This page owns banners and alerts as one component, in design, in Figma and in code. Choosing it over a toast, a dialog or a status badge stays in [feedback: choosing the feedback](../patterns/feedback.md#choosing-the-feedback); a message under one field or in one row is [feedback: inline messages](../patterns/feedback.md#inline-messages), and a form's error summary is [forms](../patterns/forms.md#error-messages-and-the-error-summary). Related: [toast](toast.md), [badge](badge.md), [modal dialog](modal-dialog.md), [feedback](../patterns/feedback.md).

## Overview

**Use when / don't use**
- [weak] A banner for the page or the product, an alert for one region; never for validation or marketing. The cases are [*Banners and alerts*](#banners-and-alerts).
- [moderate] One component serves the page and the region, sized or placed by the caller: Primer's `Banner` has a `layout` (`default`, `compact`) and `flush` ([Banner.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/Banner.tsx)), and MUI's `Alert` is one component ([Alert types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Alert/Alert.d.ts)). Carbon splits by behaviour instead: `InlineNotification`, `ActionableNotification`, `Callout` ([Carbon notification](https://carbondesignsystem.com/components/notification/usage/)).

**Anatomy**
- [strong] A container holding a tone icon, a title, a body, optional actions and an optional close button. Primer: `title`, `description`, a tone icon (a custom `leadingVisual` only for `info` and `upsell`), `primaryAction`, `secondaryAction`, `onDismiss`; MUI's slots: `icon`, `message`, `action`, `closeButton`; Carbon's inline notification: `title`, `subtitle` and a close button unless `hideCloseButton` ([Notification.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Notification/Notification.tsx)); Figma's Simple Design System: `Icon`, `Title`, `Body`, a button and `Dismissible` ([SDS Notification.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/Notification.figma.ts)).
- [required] The close button, where there is one, is named and at least 24 by 24 CSS pixels (code-standard rule 18; figma-standard rule 26).

## Banners and alerts

**Use when / don't use**
- [moderate] Use a banner for something about the whole page or the whole product: an outage, a deadline, a stale data source, the outcome of the person's last action when they have not finished.
- [weak] Use an alert (an inline message with a severity) inside a region when the scope is that region.
- [weak] Don't use a banner for validation errors (GOV.UK [notification banner](https://design-system.service.gov.uk/components/notification-banner/)), for marketing, or for information directly relevant to the page's task, which belongs in the content.

**How**
- [moderate] One banner per page. Combine messages or show only the most important (GOV.UK; Carbon: "Only show one banner at a time").
- [moderate] Page banner: immediately before the page `h1`, as wide as the content (GOV.UK). Product banner: directly below the main header, scrolling with the page, not sticky ([Carbon](https://carbondesignsystem.com/patterns/notification-pattern/)).
- [required] Severity drives colour role, icon and a heading word, so meaning never rests on colour (GOV.UK asks for a heading such as "Success" for this reason; WCAG 1.4.1).
- [weak] Whether a banner can be dismissed is open: GOV.UK lists dismissal as an open question, and the project decides.
- [weak] Body: the problem and its cause, then what the person can do, in one to two sentences. Atlassian's [error messages](https://atlassian.design/foundations/content/designing-messages/error-messages) asks for one to two sentences and not to invent a cause.
- [required] Reserve its space or place it above the controls so its arrival or dismissal does not move them (design-standard rule 2).

**Cases**
- A dashboard's audit source failed but the snapshot loaded → a warning banner naming what is missing and how old the rest is; the sections that depend on the audit show "not measured", never zero ([ux: degraded states](../design/ux.md#degraded-offline-and-error-states)).
- A banner and an error summary on the same page → keep the error summary; GOV.UK says not to show both.
- A success banner after a multi-step journey ends → a confirmation page instead; GOV.UK prefers one at the end of a linear service.

**Accessibility**
- [contested] 1.3.1 and 2.4.1: on GOV.UK's and Primer's side, a banner is a `role="region"` labelled by its heading so it can be found by landmark navigation; Carbon defaults to `role="status"` and MUI to `role="alert"` ([In code](#in-code)). A success banner that appears after a redirect takes focus on load (GOV.UK uses `role="alert"` for it); moving focus is code-standard rule 14's territory.
- [required] 1.4.1 and 1.4.3: icon and heading carry the severity; text contrast is figma-standard rule 32 in a component.

**Build**
- [contested] On GOV.UK's and Primer's side, a banner is a `section` named by its heading (`aria-labelledby`), so it is a region landmark; rendered by the server before the `h1` where it can be ([HTML semantics: *Landmarks*](../../code/html-semantics.md#landmarks)).
- [required] Tone as an attribute (`tone="warning"`), with an `aria-hidden` icon and a visible heading word (code-standard rules 9 and 18).
- [weak] A banner inserted after load overlays or takes reserved space, never pushes the controls ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).
- [required] Dismissal hides it with `hidden` and remembers it per person on the server or in storage; a condition banner has no close button (code-standard rule 17).
- [weak] A success banner after a redirect takes focus on load with `tabindex="-1"` ([accessibility: *Focus management*](../../code/accessibility.md#focus-management)).

**Check**
- *Script* could: count banners per page (more than one is a finding); confirm each has a heading and an accessible region name; flag a banner placed after the `h1` or inside the main content flow on a page that has one.
- *Judgement*: is the condition still true while the banner shows, and could the message live in the content instead?

**Sources.** GOV.UK and Carbon agree on one at a time and on placement; neither settles dismissal.

## In Figma

**Layers**
- [required] Auto layout throughout; the container fills its parent's width and the text hugs vertically, so a longer body grows the alert downward (figma-standard rule 33).
- [required] Layers named for their role, the same in every tone: `Icon`, `Title`, `Body`, `Actions`; nested buttons keep their component's name (figma-standard rule 10).

**Properties**
- [required] `Title` and `Body` are text properties, in the code's words: Primer says `title` and `description`, SDS `Title` and `Body` (figma-standard rules 21 and 37).
- [moderate] The icon follows the tone and is drawn in each `Feedback` variant, not offered as a swap: Primer's `Banner` picks its icon from `variant` (`critical` a stop sign, `warning` an alert sign), and MUI's `iconMapping` maps an icon to each severity.
- [required] `Show close button` reveals the close; `Show actions slot` reveals the `Actions slot` (figma-standard rules 5 and 21). SDS's `Dismissible` is a bare word, which figma-standard rule 21 keeps for a boolean that switches a style and reveals nothing.

**Variants and states**
- [required] One tone axis, `Feedback`, in figma-standard rule 1's slot, its values the project's status token words (figma-standard rule 22), such as `Info`, `Success`, `Warning`, `Error`, the same as the toast's and the badge's. Unless colour is split off (below), it is the alert's only axis, so its order is `Feedback` alone. The systems' words differ: Primer `critical`, `info`, `success`, `upsell`, `warning`; MUI `success`, `info`, `warning`, `error`; Carbon adds `info-square` and `warning-alt`.
- [contested] **Tone and colour as one axis or two.** MUI keeps `severity` and `color` as separate props ([MUI Alert.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Alert/Alert.js)); Primer's `variant` and Carbon's `kind` set tone and colour together (sources below). A project splits them only where its brand must recolour a severity.
- [weak] No `State` axis on the alert; its buttons are instances carrying their own states.

**Tokens**
- [required] Fills, strokes, radius, padding and gap bound to semantic variables (figma-standard rules 24 and 29); text in text-role tokens (figma-standard rule 28), meeting contrast in every tone and mode (figma-standard rule 32).
- [required] The icon's colour meets 3:1 against the alert's fill (WCAG 1.4.11).
- [required] Component tokens, where the project has them, are named by figma-standard rule 49: `Component/Alert/Container/background-warning`.

**Check**
- *Script*: figma-components-audit runs the rules cited above; the parity report compares the tone values with the code's.
- *Judgement*: read in greyscale, does each tone still say its severity by icon and title?

**Sources.** Primer, MUI, Carbon and SDS for the parts and tone names, and MUI against them for colour apart from severity.

## Alignment with code

**Structure**
- [strong] Code builds the alert as one component whose title, body and actions are props or children, so Figma draws one set with `Title`, `Body` and an `Actions slot`, as [In Figma](#in-figma) does. Primer's `Banner` takes `title`, `description`, `primaryAction`, `secondaryAction` and `onDismiss`, and also exports `Banner.Title`, `Banner.Description`, `Banner.PrimaryAction` and `Banner.SecondaryAction` ([Primer Banner index.ts](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/index.ts), [Banner.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/Banner.tsx)); MUI's `Alert` takes `severity`, `action` and `onClose`, its title a separate `AlertTitle` child ([MUI Alert.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Alert/Alert.js), [AlertTitle.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/AlertTitle/AlertTitle.js)); SDS's `Notification` takes `variant`, `icon` and `isDismissible`, with the title and body as `TextStrong` and `Text` children ([SDS Notification.tsx](https://raw.githubusercontent.com/figma/sds/main/src/ui/primitives/Notification/Notification.tsx)).
- [strong] The close button is built inside the component, never passed in: Primer renders an `IconButton` named "Dismiss banner" when `onDismiss` is set, MUI one named by `closeText` ("Close" by default) when `onClose` is set, and SDS one named "Dismiss notification" ([Banner.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/Banner.tsx), [MUI Alert.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Alert/Alert.js), [SDS Notification.tsx](https://raw.githubusercontent.com/figma/sds/main/src/ui/primitives/Notification/Notification.tsx)). So Figma nests an icon button instance behind `Show close button`, never a slot.
- [weak] Carbon splits by behaviour and its Figma follows: one Figma inline notification connects to `InlineNotification`, or to `ActionableNotification` when `Actionable=True`, and a separate Figma `Callout` to `Callout` ([Carbon InlineNotification.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Notification/InlineNotification.figma.ts), [Callout.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Notification/Callout.figma.ts)).

**Mapping**
- [required] Each Figma property maps to one prop or attribute, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Feedback` | `tone`, the same word lowercased (Primer `variant`, MUI `severity`, Carbon `kind`) |
  | `Title`, `Body` | the heading and body text |
  | the tone's icon | an `aria-hidden` icon chosen by tone (code-standard rule 18) |
  | `Show actions slot`, `Actions slot` | the actions, buttons or links |
  | `Show close button` | a dismiss handler and a named close `button` |

**States**
- [moderate] The browser sets no state on the alert itself; its buttons carry their own. Primer gives the `section` `tabIndex={-1}` so a script can move focus to it ([Banner.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/Banner.tsx)), which GOV.UK does only for a success banner after a redirect ([*Banners and alerts*](#banners-and-alerts)); MUI's `Alert` is a `div` with `role="alert"` and no focus of its own ([MUI Alert.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Alert/Alert.js)).
- [moderate] Dismissed is no state but an unmount: `onDismiss` and `onClose` are handlers, and the consumer removes the alert ([Banner.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/Banner.tsx), [MUI Alert.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Alert/Alert.js)). No frame shows a dismissed alert.
- [weak] A combination some code cannot reach: MUI renders the close button only when no `action` is passed ([MUI Alert.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Alert/Alert.js)), while Primer renders both ([Banner.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/Banner.tsx)). On MUI, a frame with `Show actions slot` and `Show close button` both on has no code; the project draws it only where its code reaches it.
- [weak] A combination code reaches that a frame may need: Primer's `hideTitle` keeps the title for assistive technology and hides it on screen, and its Figma `Title?` boolean maps onto it ([Primer Banner.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/Banner.figma.tsx)). A project that uses it draws the compact alert with its `Title` text still filled and hidden, never emptied, so the region keeps its name.

**Differences**
- [strong] `Show close button` is a boolean where code has a handler: Primer's Figma `Dismissible?` becomes `onDismiss`, SDS's `Dismissible` becomes `isDismissible`, and Carbon's `Close` becomes `hideCloseButton`, inverted ([Primer Banner.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/Banner.figma.tsx), [SDS Notification.figma.ts](https://raw.githubusercontent.com/figma/sds/main/src/figma/primitives/Notification.figma.ts), [Carbon InlineNotification.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Notification/InlineNotification.figma.ts)). The Figma name says what it reveals (figma-standard rule 21) and the mapping row turns it into the handler.
- [weak] The icon is fixed per tone, though Primer's code takes a `leadingVisual` for `info` and `upsell` and its Figma exposes an `Icon` instance ([Banner.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/Banner.tsx), [Primer Banner.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Banner/Banner.figma.tsx)); Primer's `variant` and MUI's `iconMapping` tie the icon to severity ([In Figma](#in-figma)), so a custom icon is a project's ruling.

**Check**
- *Script*: the component contract lists the `Feedback` values, `Title`, `Body`, `Show close button` and the actions slot beside the props the code takes (design-code-parity). A test can assert that an alert with a close has a named button and that pressing it removes the alert.
- *Judgement*: does every frame with the close shown stand for a condition that can end, and could the code reach every combination of actions and close the frames show?

**Sources.** Primer, MUI, Carbon and Figma's SDS source and Code Connect files as linked. They agree on one component with the close built in and on dismissal as a handler; Carbon alone splits by behaviour into components.

## In code

**Element**
- [contested] The role. GOV.UK's notification banner is a `role="region"` labelled by its title, and `role="alert"` for a success banner ([GOV.UK](https://design-system.service.gov.uk/components/notification-banner/)); Primer renders a `section` with `aria-labelledby` its title; Carbon's inline notification defaults to `role="status"`; MUI's `Alert` defaults to `role="alert"`. The [APG alert](https://www.w3.org/WAI/ARIA/apg/patterns/alert/) notes screen readers do not announce an alert already on the page when it loads. [*Banners and alerts*](#banners-and-alerts)' Build is GOV.UK's and Primer's side, a region named by its heading, with focus moved only after a redirect; a project taking another side records it.
- [required] A message inserted after load goes through a live region present from load, never by mounting an element with `role="alert"` and its text together ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).

**Props**
- [strong] A tone, a title, a body, actions and a dismiss handler: Primer (`variant`, `title`, `description`, `primaryAction`, `secondaryAction`, `onDismiss`), MUI (`severity`, `action`, `onClose`), Carbon (`kind`, `title`, `subtitle`, `onClose`), SDS (`variant`, `icon`, `isDismissible`).
- [moderate] Dismissible is a handler, not only a flag: Primer shows a dismiss button when `onDismiss` is set, and MUI a close button when `onClose` is set and no `action` is.
- [weak] Primer's `hideTitle` keeps the title for assistive technology while hiding it on screen, so a compact alert still names its region.

**Check**
- *Script*: the parity loop compares each tone with its frame (design-code-parity); a test could assert each alert is a named region or sits inside one.
- *Judgement*: is the role right for when the alert appears: on load, after a redirect, or in place?

**Sources.** GOV.UK, Primer, Carbon, MUI and SDS as linked; they split on the role.
