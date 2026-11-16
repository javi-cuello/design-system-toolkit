# Popover

A popover shows a little information or a few related controls next to the one element that opened it, and closes when the person moves on. This page owns the popover as a component, in design, in Figma and in code: when to use one, light dismiss, size, placement and its caret. What spans surfaces stays in [`../patterns/dialogs.md`](../patterns/dialogs.md): choosing between a tooltip, a popover, a drawer, a dialog and a page; a list of actions behind a button is a menu ([`../patterns/menus.md`](../patterns/menus.md)). Related: [tooltip](tooltip.md), [modal dialog](modal-dialog.md), [drawer](drawer.md), [button](button.md), [menus](../patterns/menus.md).

## Overview

**Use when / don't use**
- [weak] Choose the surface before drawing it: [dialogs: *Choosing the surface*](../patterns/dialogs.md#choosing-the-surface) decides between a popover and the rest; the popover's own use is [popovers](#popovers).
- [weak] A popover holding a list of actions is a menu, with the menu's roles and keys ([split buttons and overflow menus](button.md#split-buttons-and-overflow-menus)); one holding a few words on hover is a [tooltip](tooltip.md).
- [moderate] Non-modal by default: the page stays usable behind it. Radix makes `modal` an opt-in prop of its Popover ([Radix Popover source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/popover/src/popover.tsx)), and HTML's `popover` attribute puts the element in the top layer without making the page inert ([HTML popover](https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute)).

**Anatomy**
- [moderate] A surface beside its trigger, an optional caret pointing at it, optional title and description, the content, and an optional close button. Radix exports `Trigger`, `Anchor`, `Content`, `Title`, `Description`, `Close` and `Arrow` ([Radix Popover source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/popover/src/popover.tsx)); Primer's Popover is a positioned box with a `caret` and a `Popover.Content` ([Primer Popover source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Popover/Popover.tsx)).
- [required] The trigger is a button and belongs to the page, not to the popover; a close button, where there is one, is an icon button instance with its own name (code-standard rule 18; figma-standard rules 27 and 40).

## Popovers

**Use when / don't use**
- [moderate] A popover shows a little information or a few related controls tied to one trigger, and closes when the person moves on.
- [weak] Not for warnings. Apple's [popovers](https://developer.apple.com/design/human-interface-guidelines/popovers): "Avoid using a popover to show a warning. People can miss a popover or accidentally close it."
- [weak] Not for required input. Carbon's [disclosures pattern](https://carbondesignsystem.com/patterns/disclosures-pattern/): "Don't use to present critical information or request required input needed to complete a workflow. Use the modal component instead."
- [weak] Not on narrow screens for anything substantial; Apple uses a sheet there.

**How**
- [weak] **Opened by click**, never automatically (Carbon: "Disclosures should never open automatically").
- [strong] **Light dismiss**: closes on a click outside, on Escape, and on the trigger again. Carbon: close by clicking the trigger again "or anywhere outside of the open popover container"; the Popover API's `auto` state provides light dismiss natively ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)).
- [weak] **Save on light dismiss.** Apple: "Always save work when automatically closing a nonmodal popover… Discard people's work only when they click or tap an explicit Cancel button."
- [strong] **One at a time, never nested.** Carbon's [popover](https://carbondesignsystem.com/components/popover/usage/): "Only one popover can appear at a time"; "Avoid nesting popovers." Apple: "Never show a cascade or hierarchy of popovers."
- [moderate] **Small.** Carbon: "If your popover exceeds four columns in width, use a modal instead." Apple: "Avoid making a popover too big."
- [moderate] **Placement**: next to its trigger with a caret when the trigger has no pressed state (Carbon), not covering the trigger or content needed while using it (Apple).
- [moderate] **A close button** only when it adds clarity, such as leaving without saving (Apple); Carbon places it top right when present.

**Cases**
- A "Columns" popover with ten checkboxes → each change applies at once and persists when the popover is light-dismissed.
- A popover that opens a second popover for "Advanced" → expand the advanced options inside the same popover, or use a dialog.
- A validation error shown in a popover by the field → an inline error under the field; a popover can be dismissed and missed.

**Accessibility**
- [required] 2.1.1: Escape closes and focus returns to the trigger; the trigger exposes `aria-expanded`.
- [moderate] Tab order: focusable content in the popover follows its trigger in the tab sequence (Carbon: interactive elements are "kept in the tab order of the page").
- [required] `details` used as a popover does not give Escape or click-outside (code-standard rule 19); the Popover API does (code-standard rule 8).
- [required] 1.4.13 applies when a popover opens on hover (Carbon allows hover triggers): it must be dismissible, hoverable and persistent.

**Build**
- [required] `popover="auto"` opened by a `button` with `popovertarget`: light dismiss, Escape, one at a time and focus return come from the platform ([MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API); code-standard rule 8).
- [required] The trigger reflects state with `aria-expanded`, set in the `toggle` event handler (code-standard rule 20 keeps it working before script).
- [required] The popover follows its trigger in the DOM, so its controls come next in the tab order (code-standard rule 2).
- [weak] Placement next to the trigger with CSS anchor positioning where supported, a script fallback elsewhere ([browser support: *Progressive enhancement and feature queries*](../../code/browser-support.md#progressive-enhancement-and-feature-queries)).
- [weak] Work saved on dismiss: controls in the popover apply on `change`, not on a Close button.
- [required] A `details` used as a popover adds Escape and click-outside itself (code-standard rule 19; [HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).

**Check**
- *Script*: code-standard rule 19's check in `tools/parity/pages.mjs` already asserts Escape and click-outside close a floating `details`. Could: for each `[popover]` or `aria-expanded` trigger, assert Escape closes, a click outside closes, focus returns, and only one is open at a time.
- *Judgement*: would losing this popover by accident cost the person anything?

**Sources.** Carbon, Apple and MDN agree on light dismiss, one at a time and no nesting. Carbon caps popovers at four columns and disclosures at six; the toolkit uses four for a popover and moves anything larger into a dialog or drawer.

## In Figma

**Layers**
- [required] Auto layout throughout: the surface hugs its content up to a maximum width, the text wraps and hugs vertically (figma-standard rule 33).
- [required] Layers are named for their role (`Caret`, `Title`, `Description`, `Body`, `Close`), the same in every variant (figma-standard rules 9 and 10).
- [weak] The trigger is not part of the component: a frame that shows the popover open places the trigger beside it as its own instance, so the popover can serve any trigger.

**Properties**
- [required] `Title` and `Description` are text properties, each revealed by a boolean directly above it (`Show title`, `Show description`); the content is a slot named `Slot` (figma-standard rules 5, 21, 37 and 38).
- [required] The caret is revealed by `Show caret`, and the close button by `Show close button` (figma-standard rule 21); [popovers](#popovers) says when each is wanted.

**Variants and states**
- [moderate] `Placement` is an axis naming the side the popover opens toward, which moves the caret to the facing edge: `Top`, `Bottom`, `Leading`, `Trailing`, never `Left` or `Right` (figma-standard rule 21, and rule 50 where the project mirrors). Radix places by `side` (`top`, `right`, `bottom`, `left`) and `align` (`start`, `center`, `end`) ([Radix Popper source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/popper/src/popper.tsx)); Primer's `caret` takes twelve values, a side and an end ([Primer Popover source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Popover/Popover.tsx)).
- [weak] Alignment along the side (start, centre, end) is drawn only where the library's frames need it; four `Placement` values cover most screens, and code computes the rest.
- [weak] No `State` axis: the surface takes no hover, press or focus; its controls carry their own (beyond figma-standard rule 35). The trigger shows the popover open with its own `Open` value ([button: *In Figma*](button.md#in-figma)).

**Tokens**
- [required] Fill, border, radius, shadow, padding and gap are bound to variables, semantic and never primitive, the caret taking the surface's fill and border (figma-standard rules 24 and 29); text fills take text-role tokens (rule 28).
- [required] The maximum width is a token, so code reads the same number ([popovers](#popovers) keeps it small); component tokens, where the project has them, are `Component/Popover/<Element>/<property>` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the snapshot's contract lists every axis, property and slot for the parity report.
- *Judgement*: would anything in this popover be missed if it were dismissed by accident?

**Sources.** Radix and Primer for parts and placement; the HTML standard for the attribute; figma-standard for names. Radix and Primer name sides physically; the toolkit's naming rule takes logical ones.

## In code

**Element**
- [required] The element and how it opens are [popovers: *Build*](#popovers).
- [required] HTML defines three states: `auto` closes other auto popovers and has light dismiss; `manual` does neither; `hint` closes only other hints ([HTML popover](https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute)). A popover the person opens takes `auto`.

**Props**
- [moderate] Open state and its change callback, the side and alignment, and the content as children: Radix (`open`, `onOpenChange`, `modal`, and `side`, `align`, `sideOffset` on its content) and Primer (`open`, `caret`, and `width` and `height` on its content) ([Radix Popover source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/popover/src/popover.tsx), [Radix Popper source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/popper/src/popper.tsx), [Primer Popover source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Popover/Popover.tsx)).
- [required] The content is a slot, never a string or render prop (code-standard rule 13).

**From Figma**
- [required] Each Figma property maps to one attribute, prop or child, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Placement` | the preferred side, a `placement` attribute read by the positioning; the side it lands on may flip to stay in view |
  | `Show caret` | the caret element, drawn on the edge facing the trigger |
  | `Show title`, `Title` | a heading, referenced by `aria-labelledby` when the popover has a role |
  | `Show description`, `Description` | a paragraph |
  | `Slot` | the popover's children |
  | `Show close button` | a named `button` with `popovertarget` and `popovertargetaction="hide"` |
- [required] `Leading` and `Trailing` resolve to the logical side, so a right-to-left page mirrors the placement ([i18n: *Logical properties and mirroring*](../../code/i18n.md#logical-properties-and-mirroring)).

**Check**
- *Script*: the parity loop compares each variant with its frame (design-code-parity); the component contract flags a Figma property with no prop.
- *Judgement*: does the coded popover close on every route the design expects, and keep what the person changed?

**Sources.** The HTML standard for the `popover` attribute and its states; Radix and Primer for props; the behaviour each serves is in [popovers](#popovers).
