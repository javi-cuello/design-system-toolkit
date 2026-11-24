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
- [strong] **A maximum width near 300 to 480px.** Polaris 400 ([Popover CSS](https://github.com/Shopify/polaris-react/blob/main/polaris-react/src/components/Popover/Popover.module.css)), Carbon 368 ([`_popover.scss`](https://github.com/carbon-design-system/carbon/blob/main/packages/styles/scss/components/popover/_popover.scss)), Radix Themes 480 by default ([popover props](https://github.com/radix-ui/themes/blob/main/packages/radix-ui-themes/src/components/popover.props.tsx)), Chakra 20rem ([popover recipe](https://github.com/chakra-ui/chakra-ui/blob/main/packages/react/src/theme/recipes/popover.ts)), shadcn 18rem ([popover.tsx](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/popover.tsx)). Named sizes where they exist: Cloudscape small 210, medium 310, large 482 ([popover container](https://github.com/cloudscape-design/components/blob/main/src/popover/container.scss)); SLDS small to 15rem, medium from 20rem, large 25rem to 512px ([SLDS popovers](https://github.com/salesforce-ux/design-system/blob/master/ui/components/popovers/base/_index.scss)).
- [moderate] **Placement**: next to its trigger with a caret when the trigger has no pressed state (Carbon), not covering the trigger or content needed while using it (Apple).
- [moderate] **A close button** only when it adds clarity, such as leaving without saving (Apple); Carbon places it top right when present.

**Cases**
- A "Columns" popover with ten checkboxes → each change applies at once and persists when the popover is light-dismissed.
- A popover that opens a second popover for "Advanced" → expand the advanced options inside the same popover, or use a dialog.
- A validation error shown in a popover by the field → an inline error on the field; a popover can be dismissed and missed.

**Accessibility**
- [required] 2.1.1: Escape closes and focus returns to the trigger; the trigger exposes `aria-expanded`.
- [moderate] Tab order: focusable content in the popover follows its trigger in the tab sequence (Carbon: interactive elements are "kept in the tab order of the page").
- [required] `details` used as a popover does not give Escape or click-outside (code-standard rule 19); the Popover API does (code-standard rule 8).
- [required] 1.4.13 applies when a popover opens on hover (Carbon allows hover triggers): it must be dismissible, hoverable and persistent.

**Build**
- [required] `popover="auto"` opened by a `button` with `popovertarget`: light dismiss, Escape, one at a time and focus return come from the platform ([MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API); code-standard rule 8).
- [required] The trigger reflects state with `aria-expanded`, set in the `toggle` event handler (code-standard rule 20 keeps it working before script).
- [required] The popover follows its trigger in the DOM, so its controls come next in the tab order (code-standard rule 2).
- [weak] Work saved on dismiss: controls in the popover apply on `change`, not on a Close button.
- [required] A `details` used as a popover adds Escape and click-outside itself (code-standard rule 19; [HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).

Placement next to the trigger, with CSS anchor positioning where supported and a script fallback elsewhere, is [placement](#placement).

**Check**
- *Script*: code-standard rule 19's check in `tools/parity/pages.mjs` already asserts Escape and click-outside close a floating `details`. Could: for each `[popover]` or `aria-expanded` trigger, assert Escape closes, a click outside closes, focus returns, and only one is open at a time.
- *Judgement*: would losing this popover by accident cost the person anything?

**Sources.** Carbon, Apple and MDN agree on light dismiss, one at a time and no nesting. Carbon caps popovers at four columns and disclosures at six.

## Placement

Where any popup anchored to a trigger sits on screen: a popover, a menu, a select's picker, a combobox's list. A combobox list's own width and height are [combobox: *List size and placement*](combobox.md#list-size-and-placement).

**What good looks like**
- [required] **Never clipped, never resizing its container.** A popup in the top layer generates boxes as if it were a sibling of the root element. It "cannot be clipped by anything in the document", and an ancestor's `overflow`, `opacity` or `mask` cannot affect it ([CSS Positioned Layout 4, §3](https://drafts.csswg.org/css-position-4/#top-layer)). A popup left inside its container adds to that container's scrollable overflow instead, since the area counts every box the container is the containing block for ([CSS Overflow 3, §3.3](https://drafts.csswg.org/css-overflow-3/#scrollable-overflow-calculation)). So a dialog or a scrolling panel grows a scroll bar, or clips the popup at its edge.
- [strong] **Beside its trigger, flipping to the other side when there is no room.** React Aria flips by default (`shouldFlip = true`, [useOverlayPosition source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/overlays/useOverlayPosition.ts)). Radix flips while `avoidCollisions` is on, its default ([Radix Popper source](https://github.com/radix-ui/primitives/blob/main/packages/react/popper/src/popper.tsx), [Radix Popover docs](https://www.radix-ui.com/primitives/docs/components/popover)). Carbon's combo box flips under its experimental `autoAlign` ([Carbon ComboBox source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ComboBox/ComboBox.tsx)). react-select's `menuPlacement: 'auto'` flips "when there isn't enough space below the control" ([react-select Select source](https://github.com/JedWatson/react-select/blob/master/packages/react-select/src/Select.tsx)).
- [strong] **A capped height, with scroll inside.** Radix's docs cap `max-height` at the space left between trigger and boundary, `--radix-popover-content-available-height` (Radix Popover docs). React Aria's `maxHeight` "will take all space up to the current viewport height" by default (useOverlayPosition source). Floating UI's `size` sets `maxHeight` from `availableHeight` ([Floating UI size](https://floating-ui.com/docs/size)). The UA stylesheet gives every `[popover]` `overflow: auto` ([MDN: Using the Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using)).
- [contested] **When the page behind scrolls, follow the trigger or close.** Follow: Floating UI's `autoUpdate` re-places on ancestor scroll by default ([Floating UI autoUpdate](https://floating-ui.com/docs/autoUpdate)), and Radix and Carbon run it (sources as above); Polaris re-measures on each scroll of the activator's scroll containers ([Polaris PositionedOverlay source](https://github.com/Shopify/polaris/blob/main/polaris-react/src/components/PositionedOverlay/PositionedOverlay.tsx)); CSS anchor positioning moves the popup with its default anchor ([CSS Anchor Positioning, §3.3](https://drafts.csswg.org/css-anchor-position-1/#scroll)). Close: React Aria closes the popup when an ancestor of the trigger scrolls ([useCloseOnScroll source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/overlays/useCloseOnScroll.ts)); react-select offers `closeMenuOnScroll`, off by default, for "a scrollable modal" with a portaled menu (react-select Select source).
- [contested] **A menu's width: most sit between a minimum near 112 to 160px and a maximum near 280 to 320px.** Material 112 and 280, in steps of 56 ([Flutter popup_menu.dart](https://github.com/flutter/flutter/blob/master/packages/flutter/lib/src/material/popup_menu.dart)); Carbon 10rem (12rem with icons) to 18rem ([`_menu.scss`](https://github.com/carbon-design-system/carbon/blob/main/packages/styles/scss/components/menu/_menu.scss)); Fluent 138 to 300 ([MenuPopover styles](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-menu/library/src/components/MenuPopover/useMenuPopoverStyles.styles.ts)); SLDS 6rem to 20rem, with min-width presets x-small 12rem to large 25rem ([dropdown](https://github.com/salesforce-ux/design-system/blob/master/ui/components/menus/dropdown/_index.scss)); Primer's overlay from 192px, sized small 256, medium 320, large 480, xlarge 640 ([Overlay CSS](https://github.com/primer/react/blob/main/packages/react/src/Overlay/Overlay.module.css)). Against them, Atlassian's runs from 160 to 800 ([dropdown CSS](https://unpkg.com/@atlaskit/dropdown-menu@22.1.0/dist/es2019/dropdown-menu-top-layer.compiled.css)), Primer's goes to 640, and shadcn and Chakra set only an 8rem minimum, no maximum.
- [contested] **A menu as wide as its trigger, or sized to its items.** By default Ant's dropdown takes at least its trigger's width ([rc-dropdown](https://github.com/react-component/dropdown/blob/master/src/Dropdown.tsx)), as does Cloudscape's button dropdown ([internal.tsx](https://github.com/cloudscape-design/components/blob/main/src/button-dropdown/internal.tsx)); Atlassian (`shouldFitContainer`), Fluent (`matchTargetSize`) and Mantine (`width="target"`) offer it as an option; Material, Carbon, Primer, shadcn and Radix size the menu to its items. A combobox's list is the exception, matched to its field ([combobox: list size and placement](combobox.md#list-size-and-placement)).
- [moderate] **Hidden once its trigger scrolls out of view**, where it follows. Floating UI's `hide` reports when the reference "is fully clipped" ([Floating UI hide](https://floating-ui.com/docs/hide)); Carbon sets `visibility: hidden` from it (Carbon ComboBox source); Radix offers `hideWhenDetached`, off by default (Radix Popover docs). CSS has `position-visibility: anchors-visible` ([MDN: Fallback options and conditional hiding](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Try_options_hiding)).

**How**
- [required] **Top layer.** `showPopover()` on a `popover` element and `showModal()` on a `dialog` put the element in the top layer ([MDN: Top layer](https://developer.mozilla.org/en-US/docs/Glossary/Top_layer)). A dialog's `show()` does not ([HTML: `showModal()`](https://html.spec.whatwg.org/multipage/interactive-elements.html#dom-dialog-showmodal)). Each later top-layer element paints over the earlier ones, so a popover opened from a modal dialog draws above it (CSS Positioned Layout 4, §3).
- [required] **Anchor it, or it centres.** The UA stylesheet gives `[popover]` `position: fixed; inset: 0; margin: auto` (MDN: Using the Popover API). A popover and the button that opens it with `popovertarget` share an implicit anchor. `position-area` adopts it and resolves the auto margins and insets to 0; placing with `anchor()` needs `margin: 0` and `position-anchor: auto` (same page, *Popover anchor positioning*).
- [required] **CSS anchor positioning.** The trigger takes `anchor-name: --name`. The popup, absolutely or fixed positioned, takes `position-anchor: --name`. `position-area` places it on a 3×3 grid around the anchor, and `anchor-size(width)` sizes it from the anchor ([MDN: Using CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Using)). Chromium first shipped `position-area` as `inset-area`, with the same values ([MDN `position-area`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-area)).
- [required] **Flipping in CSS.** `position-try-fallbacks: flip-block` moves a popup that overflows below to above (MDN: Fallback options and conditional hiding). The browser takes the first option that does not overflow the containing block, and keeps it until it overflows again ([CSS Anchor Positioning, §6.5](https://drafts.csswg.org/css-anchor-position-1/#fallback-apply)). If none fits, the original placement is used (MDN, as above).
- [strong] **Support, as of 2026-11-22.** caniuse lists partial support from Chrome and Edge 125, Firefox 147 and Safari 26, and full support in Safari 27. The gaps it notes are `position-anchor: normal`, animating `anchor()` and two `position-visibility` values ([caniuse](https://caniuse.com/css-anchor-positioning), [its data](https://github.com/Fyrd/caniuse/blob/main/features-json/css-anchor-positioning.json)). MDN marks `position-area` Baseline 2026, newly available since January 2026 (MDN `position-area`). Web Platform Status rates the feature as a whole "limited": Chrome and Edge 157, Safari 27, no Firefox ([webstatus.dev](https://webstatus.dev/features/anchor-positioning)). So it ships behind a feature query ([browser support: *Progressive enhancement and feature queries*](../../code/browser-support.md#progressive-enhancement-and-feature-queries)).
- [strong] **The script fallback.** Read the trigger's `getBoundingClientRect()`, which is relative to the viewport ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)). Place the popup with `position: fixed`, and re-place it on scroll and resize. Radix and Carbon use Floating UI with `strategy: 'fixed'` and `autoUpdate` (sources as above); Polaris re-measures on scroll (Polaris PositionedOverlay source). Floating UI says `fixed` can break the popup out of a clipping ancestor in many cases ([Floating UI computePosition](https://floating-ui.com/docs/computePosition)). `autoUpdate` listens to ancestor scroll, ancestor resize, a `ResizeObserver` on both elements, and layout shift (Floating UI autoUpdate).
- [required] **A transformed ancestor captures `position: fixed`.** An ancestor with `transform`, `perspective` or `filter` becomes the containing block of a fixed descendant ([MDN `position`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position)). So a fixed popup inside an animated dialog is placed against the dialog. A top-layer popup with `position: fixed` takes the viewport (CSS Positioned Layout 4, §3.1).
- [moderate] **Floating UI's middleware.** `flip` "changes the placement of the floating element to keep it in view", and goes before `shift`, which "shifts the floating element to keep it in view" ([Floating UI flip](https://floating-ui.com/docs/flip), [Floating UI shift](https://floating-ui.com/docs/shift)). `size` gives the available width and height (Floating UI size). Radix runs `shift`, `flip`, `size` and `hide` (Radix Popper source); Carbon runs `flip` and `hide` (Carbon ComboBox source); Headless UI depends on `@floating-ui/react` ([Headless UI package](https://unpkg.com/@headlessui/react/package.json)).

**Cases**
- A menu inside a card with `overflow: hidden` is cut off at the card's edge → the menu becomes a `popover`, drawn in the top layer.
- A list opened in a modal dialog makes the dialog scroll, or grow → the list in the top layer adds nothing to the dialog's overflow.
- A list opened near the bottom of the window runs off screen → `position-try-fallbacks: flip-block`, or Floating UI's `flip`.
- A list portaled to the end of `body` from a `showModal()` dialog ignores clicks → it is inert; keep it inside the dialog (*Accessibility*).

**Accessibility**
- [required] While a modal dialog is open, every node outside it becomes inert, except the dialog and its flat tree descendants ([HTML: modal dialogs and inert subtrees](https://html.spec.whatwg.org/multipage/interaction.html#modal-dialogs-and-inert-subtrees)). A popup moved out of a `showModal()` dialog, as a portal to `body` does, can then be neither clicked nor focused. Kept inside the dialog's DOM as a `popover`, it stays usable and still escapes the dialog's clipping.
- [required] The top layer moves the box, not the element: the box is laid out apart from its place in the document (CSS Positioned Layout 4, §3). So a `popover` kept after its trigger keeps its place in the tab order, where a portal moves it to the end of the page (code-standard rule 2).

**Build**
- [required] The popup is a `popover` element placed after its trigger in the DOM, inside any dialog it opens from (code-standard rules 2 and 8; *Accessibility* above).
- [required] Inside `@supports (anchor-name: --a)`: `position-area` for the side, `position-try-fallbacks: flip-block` for the flip, and a `max-height` with `overflow: auto` (MDN pages as above). In script, `CSS.supports('anchor-name: --a')` picks the fallback ([browser support: *Progressive enhancement and feature queries*](../../code/browser-support.md#progressive-enhancement-and-feature-queries)).
- [strong] The fallback places the popup with `position: fixed` from the trigger's rect, re-placed on scroll and resize, or with Floating UI's `computePosition` and `autoUpdate` (*How* above).
- [contested] On scroll, the code follows or closes, whichever the project picked under *What good looks like*.

**Check**
- *Script*: could open each popup inside a modal dialog and inside an `overflow: hidden` container, and assert that the container's `clientHeight` and `scrollHeight` are unchanged, the popup's rect lies in the viewport, and it matches `:popover-open`.
- *Judgement*: opened near the bottom of a short window, does it flip? Scrolled away, does it follow or close as the project chose?

**Sources.** The CSS Positioned Layout 4, CSS Overflow 3 and CSS Anchor Positioning drafts and the HTML standard for the top layer, overflow, fallback and inertness. MDN for the Popover API, anchor positioning and `position: fixed`. caniuse, MDN and Web Platform Status for support, read 2026-11-22. React Aria, Radix, Carbon, Polaris, react-select and Floating UI source and docs for flipping, height and scroll; they disagree only on following or closing on scroll.

## In Figma

**Layers**
- [required] Auto layout throughout: the surface hugs its content up to a maximum width, the text wraps and hugs vertically (figma-standard rule 33).
- [required] Layers are named for their role (the pointer by the code's word for it, below; `Title`, `Description`, `Body`, `Close`), the same in every variant (figma-standard rules 9 and 10).

**Properties**
- [required] `Title` and `Description` are text properties, each revealed by a boolean directly above it (`Show title`, `Show description`); the content is a slot named `Slot` (figma-standard rules 5, 21, 37 and 38).
- [required] The close button is revealed by `Show close button` (figma-standard rule 21); [popovers](#popovers) says when it and the pointer are wanted.
- [weak] The pointer is revealed by `Show` plus the code's word for it (figma-standard rule 21): `Show caret` for Primer's and Carbon's `caret`, `Show arrow` for Radix's `Arrow` part (sources in [Alignment with code](#alignment-with-code) and [In code](#in-code)). Carbon's kit calls it `Caret tip` ([Carbon Popover.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Popover/Popover.figma.ts)), where figma-standard rule 21 departs.

**Variants and states**
- [moderate] `Placement` is an axis naming the side the popover opens toward, which moves the caret to the facing edge: `Top`, `Bottom`, `Leading`, `Trailing`, which code the project writes takes too; over a library's `side` used as shipped, a `Side` axis with its `Left` and `Right` (figma-standard rules 21 and 56, and figma-standard rule 50 where the project mirrors). Radix places by `side` (`top`, `right`, `bottom`, `left`) and `align` (`start`, `center`, `end`) ([Radix Popper source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/popper/src/popper.tsx)); Primer's `caret` takes twelve values, a side and an end ([Primer Popover source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Popover/Popover.tsx)).
- [weak] Alignment along the side (start, centre, end) is drawn only where the library's frames need it; four `Placement` values cover most screens, and code computes the rest.
- [weak] No `State` axis: the surface takes no hover, press or focus; its controls carry their own (beyond figma-standard rule 35). The trigger shows the popover open with its own `Open` property ([button: *In Figma*](button.md#in-figma)).

**Tokens**
- [required] Fill, border, radius, shadow, padding and gap are bound to variables, semantic and never primitive, the caret taking the surface's fill and border (figma-standard rules 24 and 29); text fills take text-role tokens (figma-standard rule 28).
- [required] The maximum width is a token, so code reads the same number ([popovers](#popovers) keeps it small); component tokens, where the project has them, are `Component/Popover/<Element>/<property>` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the snapshot's contract lists every axis, property and slot for the parity report.
- *Judgement*: would anything in this popover be missed if it were dismissed by accident?

**Sources.** Radix and Primer for parts and placement; the HTML standard for the attribute; figma-standard for names. Radix and Primer name sides physically; figma-standard rule 21 takes logical ones.

## Alignment with code

**Structure**
- [contested] Whether the trigger is part of the component: Radix has a `Trigger` part ([Radix Popover source](https://github.com/radix-ui/primitives/blob/main/packages/react/popover/src/popover.tsx)) and Carbon takes the trigger as the first child of `Popover`, the surface in `PopoverContent` ([Carbon Popover source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Popover/index.tsx)); Primer's `Popover` and MUI's take none, MUI positioning against an `anchorEl` ([Primer Popover.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Popover/Popover.figma.tsx), [MUI Popover types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Popover/Popover.d.ts)). No kit draws the trigger: Carbon's Code Connect writes a placeholder `button` ([Carbon Popover.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Popover/Popover.figma.ts)), and this page leaves it out ([In Figma](#in-figma)).
- [moderate] The surface's parts: Radix splits `Content`, `Title`, `Description`, `Close` and `Arrow`, wiring `aria-labelledby` and `aria-describedby` from the title and description it finds ([Radix Popover source](https://github.com/radix-ui/primitives/blob/main/packages/react/popover/src/popover.tsx)); Primer's kit maps `heading` and `body` strings into `Popover.Content` ([Primer Popover.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Popover/Popover.figma.tsx)); React Aria's caret is a separate `OverlayArrow` that the popover passes its placement ([React Aria Popover source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Popover.tsx)). Radix's parts are this page's `Title`, `Description`, `Close` and `Caret` layers.

**Mapping**
- [required] Each Figma property maps to one attribute, prop or child, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Placement` | the preferred side, a `placement` attribute read by the positioning; the side it lands on may flip to stay in view |
  | `Show caret` or `Show arrow` | Primer's and Carbon's `caret`, Radix's `Arrow`: the pointer, drawn on the edge facing the trigger |
  | `Show title`, `Title` | a heading, referenced by `aria-labelledby` when the popover has a role |
  | `Show description`, `Description` | a paragraph |
  | `Slot` | the popover's children |
  | `Show close button` | a named `button` with `popovertarget` and `popovertargetaction="hide"` |
- [required] `Leading` and `Trailing` resolve to the logical side, so a right-to-left page mirrors the placement ([i18n: *Logical properties and mirroring*](../../code/i18n.md#logical-properties-and-mirroring)).

**States**
- [required] The surface has no pointer states; Open is its one state, set by a prop (`open` in Radix, MUI, Carbon and Primer, sources as above) or, on a `popover` element, by the browser, and matched by `:popover-open` ([MDN `:popover-open`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:popover-open)).
- [strong] The side it lands on is set at run time, not by the design: Radix writes `data-side` and `data-align` after flipping to stay in view ([Radix Popper source](https://github.com/radix-ui/primitives/blob/main/packages/react/popper/src/popper.tsx)), React Aria `data-placement` ([React Aria Popover source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Popover.tsx)), and Carbon's `autoAlign` moves it when it would not be visible ([Carbon Popover source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Popover/index.tsx)). So code reaches every `Placement` value whatever the preferred side, and the caret follows the side it landed on.
- [moderate] Entering and exiting are states code sets for animation, React Aria's `data-entering` and `data-exiting` and Radix's `data-state` (sources as above); Figma draws none of them.
- [weak] Code reaches alignments the kits leave undrawn: Carbon's `align` takes twelve values, `left-start` and `right-end` among them, but its kit's `Left` and `Right` positions have no `Alignment` ([Carbon Popover source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Popover/index.tsx), [Carbon Popover.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Popover/Popover.figma.ts)); this page draws alignment only where a screen needs it ([In Figma](#in-figma)).

**Differences**
- [moderate] `Placement` names a logical side here and a physical one in code: Radix's `side`, Carbon's `align`, Primer's `caret` (sources as above; figma-standard rule 21). The mapping's second item resolves `Leading` and `Trailing` against the page's direction.
- [weak] Carbon's kit has a `Visible` boolean that maps to `open` ([Carbon Popover.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Popover/Popover.figma.ts)); this page has no open property, since a closed popover draws nothing and the trigger shows Open ([In Figma](#in-figma)).
- [weak] Carbon's kit toggles `Caret tip` and `Shadow`, mapping to `caret` and `dropShadow` (same source); this page has `Show caret` or `Show arrow` and binds the shadow to a token, with no toggle ([In Figma](#in-figma)).

**Check**
- *Script*: the component contract lists every Figma axis, property and slot beside the popover's props and parts; a row in one with no partner in the other, and no line under *Differences*, is a finding (design-code-parity).
- *Judgement*: does each `Placement` frame show the caret where the code would draw it after a flip, and does nothing in the frame depend on the trigger being inside the component?

**Sources.** Radix, Carbon, Primer, MUI and React Aria source and Code Connect files as linked, read for the parts, the trigger and the placement code sets at run time; MDN for `:popover-open`.

## In code

**Element**
- [required] The element and how it opens are [popovers: *Build*](#popovers).
- [required] HTML defines three states: `auto` closes other auto popovers and has light dismiss; `manual` does neither; `hint` closes only other hints ([HTML popover](https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute)). A popover the person opens takes `auto`.

**Props**
- [moderate] Open state and its change callback, the side and alignment, and the content as children: Radix (`open`, `onOpenChange`, `modal`, and `side`, `align`, `sideOffset` on its content) and Primer (`open`, `caret`, and `width` and `height` on its content) ([Radix Popover source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/popover/src/popover.tsx), [Radix Popper source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/popper/src/popper.tsx), [Primer Popover source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Popover/Popover.tsx)).
- [required] The content is a slot, never a string or render prop (code-standard rule 13).

**Check**
- *Script*: the parity loop compares each variant with its frame (design-code-parity); the component contract flags a Figma property with no prop.
- *Judgement*: does the coded popover close on every route the design expects, and keep what the person changed?

**Sources.** The HTML standard for the `popover` attribute and its states; Radix and Primer for props; the behaviour each serves is in [popovers](#popovers).
