# Tooltip

A tooltip is a few words that appear beside an interactive element on hover and on keyboard focus: the name of an icon-only control, or a short hint that the task does not depend on. This page owns the tooltip as a component, in design, in Figma and in code: when to use one, its content, trigger, timing and position, and when it is a name or a description. What spans surfaces stays in [`../patterns/dialogs.md`](../patterns/dialogs.md): choosing between a tooltip, a popover, a drawer, a dialog and a page; help with a link in it is a toggletip, a [popover](popover.md). Related: [button: icon-only buttons](button.md#icon-only-buttons), [popover](popover.md), [disclosure](../patterns/disclosure.md).

## Overview

**Use when / don't use**
- [weak] Choose the surface before drawing it: [dialogs: *Choosing the surface*](../patterns/dialogs.md#choosing-the-surface); the tooltip's own use and limits are [tooltips](#tooltips).
- [moderate] A tooltip is either the trigger's name or its description, and the component is told which: Primer's Tooltip takes `type="label|description"` ([Primer Tooltip source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.tsx)), MUI's `describeChild` switches from name to description ([MUI Tooltip types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Tooltip/Tooltip.d.ts)).
- [weak] Anything longer than a short phrase, or with a heading and a body, is a toggletip or a popover, not a tooltip ([tooltips](#tooltips)). SDS's Tooltip carries a `Title` and an optional `Body` and is built on a React Aria popover holding a dialog ([SDS Tooltip.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/Tooltip.figma.ts), [SDS Tooltip.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Tooltip/Tooltip.tsx)): a toggletip by this page's terms.

**Anatomy**
- [strong] A small surface holding one line or two of text, with an optional caret pointing at the trigger. Primer's takes a `text` string ([Primer Tooltip source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.tsx)), MUI's a `title` and an `arrow` boolean ([MUI Tooltip types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Tooltip/Tooltip.d.ts)), Radix's a content and an `Arrow` ([Radix Tooltip source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/tooltip/src/tooltip.tsx)).
- [moderate] No focusable content inside: the tooltip is text, and anything to click belongs in a toggletip ([tooltips](#tooltips)).

## Tooltips

**Use when / don't use**
- [strong] A tooltip names an icon-only control or adds a short, non-essential hint to an interactive element, on hover and on keyboard focus.
- [strong] Never for information needed to complete the task. NN/g's [tooltip guidelines](https://www.nngroup.com/articles/tooltip-guidelines/): "Don't use tooltips for information that is vital to task completion." Carbon's [tooltip](https://carbondesignsystem.com/components/tooltip/usage/): "Since a tooltip disappears when a user hovers away, do not include pertinent information."
- [moderate] Never with interactive content: links or buttons go in a toggletip or popover opened by click (Carbon).
- [weak] Never on non-interactive elements. Primer's [tooltip](https://primer.style/product/components/tooltip/guidelines/): "Never include Tooltips on non-interactive components (div, span, p)."

**How**
- [weak] **Ask first whether it can be on the page.** Primer's alternatives: persist the content, don't duplicate it, use a modal or a disclosure.
- [moderate] **Content**: a few words; for icon buttons, Carbon asks for "a concise one- or two-word description of the button's function". No repeat of the visible label (NN/g).
- [moderate] **Trigger**: hover and focus both (NN/g: "Support both mouse and keyboard hover"); after a short delay (W3C [tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)).
- [required] **Stays while needed**: open while the pointer is over the trigger or the tooltip (W3C), until focus leaves, or until Escape (WCAG 1.4.13).
- [moderate] **Position**: not over related content; an arrow when several triggers are close (NN/g); flipped to stay in the viewport (Carbon).
- [weak] **Consistency**: all icon buttons in a set have tooltips, or none (NN/g).
- [weak] **Touch**: there is no hover. Essential labels must already be visible; a "?" toggletip opened by tap carries longer help (NN/g's popup tips).
- [moderate] **Not the `title` attribute** for anything a keyboard user needs; Primer's [truncate accessibility](https://primer.style/product/components/truncate/accessibility/) notes `title` tooltips have "no browser-native mechanism" for keyboard users.

**Cases**
- Password rules in a tooltip on the password field → visible hint text on the field (NN/g's Amtrak example).
- A tooltip with a "Learn more" link → a toggletip opened by click, so the link can be reached.
- A truncated table cell with its full text in `title` → wrap the text or give an explicit expand control ([`disclosure.md`](../patterns/disclosure.md), *Show more and truncation*).
- A tooltip explaining why a button is disabled → unreachable by keyboard on a `disabled` button; put the reason in text ([button: disabled buttons](button.md#disabled-buttons)).

**Accessibility**
- [required] 1.4.13 Content on Hover or Focus: content that appears on hover or focus is **dismissible** without moving pointer or focus (Escape), **hoverable** (the pointer can move onto it without it vanishing) and **persistent** until the trigger is removed, the person dismisses it, or it is no longer valid ([W3C Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)). The browser's own `title` tooltip is exempt; a custom one is not.
- [required] 4.1.2: a tooltip that names an icon button is its accessible name (`aria-labelledby`); one that adds a hint is a description (`aria-describedby`, code-standard rule 15). The W3C pattern: the trigger references the tooltip with `aria-describedby` and focus stays on the trigger.
- [required] 2.1.1: anything a mouse user gets on hover, a keyboard user gets on focus.

**Build**
- [required] `role="tooltip"` on the tip; the focusable trigger points at it with `aria-labelledby` (it names an icon button) or `aria-describedby` (a hint) (code-standard rules 15 and 18; [APG tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)).
- [required] Shown on `pointerenter` and `focusin` after a delay; kept while the pointer is over trigger or tip; hidden on Escape without moving focus (WCAG 1.4.13).
- [moderate] No focusable content; help with a link is a toggletip, a `button` opening a `popover`.
- [moderate] Not `title` for anything a keyboard or touch user needs.
- [weak] Wiring, events and the toggletip are [accessibility: *Tooltips and toggletips*](../../code/accessibility.md#tooltips-and-toggletips).

**Check**
- *Script* could: hover and focus each tooltip trigger; assert the tooltip appears in both cases, Escape hides it without moving focus, moving the pointer onto it keeps it, and it contains no focusable element; flag `role="tooltip"` on a non-focusable trigger.
- *Judgement*: if this tooltip never appeared, could the person still finish the task?

**Sources.** The W3C tooltip pattern is marked as work in progress without task-force consensus; WCAG 1.4.13 is normative. Carbon, Primer and NN/g agree on supplementary-only content; Primer is the strictest (tooltips mainly to label icon buttons).

## In Figma

**Layers**
- [required] Auto layout throughout: the surface hugs its text up to a maximum width, past which the text wraps, and the text hugs vertically (figma-standard rule 33).
- [required] Layers are named for their role (`Label`, and the pointer by the code's word for it, below), the same in every variant (figma-standard rule 10).

**Properties**
- [required] The text is one text property named as the code's prop: `Text` where the code says `text` (Primer), `Title` where it says `title` (MUI, SDS) (figma-standard rules 21 and 37; [SDS Tooltip.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/Tooltip.figma.ts)).
- [strong] A boolean reveals the pointer, `Show` plus the code's word for it (figma-standard rule 21): `Show arrow` for MUI's `arrow` boolean ([MUI Tooltip types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Tooltip/Tooltip.d.ts)), Radix's `TooltipArrow` and React Aria's `OverlayArrow` ([Alignment with code](#alignment-with-code)), `Show caret` for the `caret` of Carbon's `Popover`, on which its `Tooltip` is built ([Carbon Popover source](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Popover/index.tsx)). None of the SDS, Primer or Carbon Code Connect files reads a pointer property ([SDS Tooltip.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/Tooltip.figma.ts), [Primer Tooltip.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.figma.tsx), [Carbon Tooltip.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tooltip/Tooltip.figma.ts)).
- [required] Whether the tooltip names its trigger or describes it is an annotation on the frame that places it, not a property (figma-standard rule 52).

**Variants and states**
- [contested] **The side axis's name and values.** One axis names the side the tooltip opens toward, which moves the pointer to the facing edge. SDS's kit names it as its code does, `Placement` for `placement`, valued `Top`, `Bottom`, `Left` and `Right` ([SDS Tooltip.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/Tooltip.figma.ts)); Carbon's draws `Position` and `Alignment` for the one prop `align` ([Carbon Tooltip.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tooltip/Tooltip.figma.ts)). The code's names differ: MUI's and React Aria's `placement`, Radix's `side` (`top`, `right`, `bottom`, `left`), Primer's `direction` with eight compass values ([Primer Tooltip source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.tsx), [MUI Tooltip types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Tooltip/Tooltip.d.ts), [Radix popper.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/popper/src/popper.tsx)). figma-standard rules 21 and 56 depart from both kits where the project writes the tooltip: it names the axis as the code's prop (`Placement`, `Side`, `Direction`) and writes its values `Top`, `Bottom`, `Leading`, `Trailing`, which the code takes too, never `Left` or `Right`; over a library's `placement` the project uses as shipped, it takes the library's `Left` and `Right` (and figma-standard rule 50 where the project mirrors).
- [weak] No `State` axis and no hover or focus frame: the tooltip has no interaction of its own; its trigger's Hover and Focus variants are where it shows (beyond figma-standard rule 35).

**Tokens**
- [required] Fill, radius, padding and the caret are bound to variables, semantic and never primitive (figma-standard rules 24 and 29); the text takes a text-role token (figma-standard rule 28) and meets contrast on the tooltip's fill in every mode (figma-standard rule 32), which an inverted tooltip must check in both.
- [required] The maximum width is a token, so code wraps at the same point; component tokens, where the project has them, are `Component/Tooltip/<Element>/<property>` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the snapshot's contract lists every axis and property for the parity report.
- *Judgement*: is every tooltip drawn in the library a few words, and does each icon-only trigger that needs one have it?

**Sources.** Figma's SDS, Primer, MUI, Radix, React Aria and Carbon for parts and names, SDS's and Carbon's Code Connect for what their kits call the side axis; figma-standard for names. SDS's tooltip carries a title and a body, more than the supplementary label [tooltips](#tooltips) describes.

## Alignment with code

**Structure**
- [strong] Code keeps the tip apart from its trigger and wires the two together, so the Figma component is the tip alone and the frame that places it supplies the trigger, as [In Figma](#in-figma) says. Radix ships `TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipPortal`, `TooltipContent` and `TooltipArrow` ([Radix tooltip.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/tooltip/src/tooltip.tsx)); React Aria `TooltipTrigger`, `Tooltip` and `OverlayArrow` ([React Aria Tooltip.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Tooltip.tsx)); Primer and MUI one `Tooltip` that clones its single child to add the events and `aria-labelledby` or `aria-describedby` ([Primer Tooltip source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.tsx), [MUI Tooltip.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Tooltip/Tooltip.js)).
- [moderate] Kits disagree on whether the trigger is inside the Figma component. Carbon's carries it as a `Trigger` instance swap, and its `Type=Definition` switches the code to another component, `DefinitionTooltip` ([Carbon Tooltip.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tooltip/Tooltip.figma.ts)); Primer's connects a single `Label` text property to `text` ([Primer Tooltip.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.figma.tsx)), and SDS's a `Title`, a `Body` and `Placement`, with no trigger ([SDS Tooltip.figma.ts](https://raw.githubusercontent.com/figma/sds/main/src/figma/primitives/Tooltip.figma.ts)). figma-standard rule 53 keeps the trigger outside the component, as Primer and SDS do.
- [weak] Radix's `TooltipProvider` holds the delay for every tip on the page ([Radix tooltip.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/tooltip/src/tooltip.tsx)); Figma draws nothing for it, as the delay is one product constant ([In code](#in-code)).

**Mapping**
- [required] Each Figma property maps to one attribute, prop or child, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Text` or `Title` | the tip's text, and the trigger's name when it labels it |
  | `Placement` (Radix `Side`, Primer `Direction`) | the preferred side, `placement`, `side` or `direction`; the side it lands on may flip to stay in view |
  | `Show arrow` or `Show caret` | MUI's `arrow`, Radix's `TooltipArrow`, React Aria's `OverlayArrow`, Carbon's `caret`: the pointer, on the edge facing the trigger |
  | Name or description annotation | `aria-labelledby` or `aria-describedby` on the trigger |
- [required] `Leading` and `Trailing` resolve to the logical side, so a right-to-left page mirrors the placement ([i18n: *Logical properties and mirroring*](../../code/i18n.md#logical-properties-and-mirroring)).

**States**
- [required] Shown is set by the browser's events on the trigger, never by a prop the frame chooses; where the tip is a popover it matches `:popover-open` while shown ([HTML `:popover-open`](https://html.spec.whatwg.org/multipage/semantics-other.html#selector-popover-open)), which Primer calls `showPopover()` for and tests ([Primer Tooltip source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.tsx)). Figma draws the shown tip only.
- [strong] Focus opens the tip only when it is keyboard focus: MUI opens on focus only when the target is focus-visible, Radix ignores a focus that follows a pointer press and closes on click, and Carbon ignores focus by mouse ([MUI Tooltip.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Tooltip/Tooltip.js), [Radix tooltip.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/tooltip/src/tooltip.tsx), [Carbon Tooltip.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Tooltip/Tooltip.tsx)). So the tip is drawn beside the trigger's `Hover` and `Focus` frames, its `:hover` and `:focus-visible`, and never beside `Press`.
- [strong] The side the tip lands on is decided at run time, so every `Placement` value needs its frame whatever the preferred side: React Aria exposes it as `[data-placement]`, MUI's popper as `data-popper-placement`, and Primer moves to another direction when the asked one has no room ([React Aria Tooltip.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Tooltip.tsx), [MUI Tooltip.js](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Tooltip/Tooltip.js), [Primer Tooltip source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.tsx)).
- [required] Timing states have no frame: Radix's `data-state` tells `delayed-open` from `instant-open`, the second for a tip that opens right after another closed ([Radix tooltip.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/tooltip/src/tooltip.tsx)); React Aria's `[data-entering]` and `[data-exiting]` are motion (figma-standard rule 52).

**Differences**
- [moderate] Both kits that draw a side draw `Left` and `Right` for the side (SDS's `Placement`, Carbon's `Position`; sources in [In Figma](#in-figma)), where figma-standard rules 21 and 56 write `Leading` and `Trailing` unless the code is a library's that keeps `left` and `right`; the mapping row resolves them to the logical side.
- [weak] `Placement` has four sides, where Primer's `direction` takes eight compass values and Carbon's Figma pairs `Position` with an `Alignment` of `Start`, `Center` or `End` to give `top-start` and the rest ([Carbon Tooltip.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tooltip/Tooltip.figma.ts)).
- [weak] A kit's own property can stray from its code's name: Primer's Figma says `Label` for the prop `text` ([Primer Tooltip.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.figma.tsx)). figma-standard rule 21 names the property as the code does, so the mapping row has nothing to translate.
- [moderate] Name or description is a prop in code (Primer's `type`, MUI's `describeChild`; sources above) and an annotation in Figma (figma-standard rule 52); the mapping row carries it to `aria-labelledby` or `aria-describedby`.

**Check**
- *Script*: the component contract lists the text, the side axis and the pointer's boolean beside the props the code takes (design-code-parity). A test can focus the trigger by keyboard, assert the tip shows, and compare its text with the trigger's accessible name or description.
- *Judgement*: does each placement frame match where the code puts the tip when it flips, and is the trigger in every frame a real instance of its own component?

**Sources.** Radix, React Aria, MUI, Primer and Carbon source and Code Connect files as linked, with SDS's; MUI's types and Carbon's Popover source for the pointer's prop; the HTML standard for `:popover-open`. The libraries agree that the trigger is separate and opens the tip on hover and keyboard focus; their Figma kits split on whether the trigger is drawn inside.

## In code

**Element**
- [required] The tip's role and how the trigger references it are [tooltips: *Build*](#tooltips).
- [weak] The tip can sit in the top layer as a `popover`. HTML's `hint` state closes only other hints, so a tooltip opening over an open `auto` popover, such as a menu, does not close it ([HTML popover](https://html.spec.whatwg.org/multipage/popover.html#the-popover-attribute)); Primer sets `popover="auto"` instead ([Primer Tooltip source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.tsx)). Check `hint`'s support before relying on it.

**Props**
- [strong] The text, the side, and whether it names or describes the trigger: Primer (`text`, `direction`, `type`, `delay`), MUI (`title`, `placement`, `arrow`, `describeChild`, `enterDelay`) and Radix (content, `side`, `delayDuration`) share this shape ([Primer Tooltip source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/TooltipV2/Tooltip.tsx), [MUI Tooltip types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Tooltip/Tooltip.d.ts), [Radix Tooltip source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/tooltip/src/tooltip.tsx)).
- [contested] The delay before showing has no agreed figure: MUI's `enterDelay` defaults to 100 ms ([MUI Tooltip source](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Tooltip/Tooltip.js)), Radix's `delayDuration` to 700 ms ([Radix Tooltip source](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/tooltip/src/tooltip.tsx)), and Primer offers `short`, `medium` and `long`. It is one product constant, never a figure per instance.
- [required] The tip stays while the pointer moves onto it (WCAG 1.4.13): an option that turns that off, MUI's `disableInteractive` or Radix's `disableHoverableContent`, stays off.

**Check**
- *Script*: the parity loop compares each placement with its frame (design-code-parity); the component contract flags a Figma property with no prop.
- *Judgement*: does the coded tooltip's text match the trigger's accessible name where it labels it?

**Sources.** Primer, MUI and Radix for props and delays; the HTML standard for popover states; WCAG 1.4.13 for what no option may switch off. The wiring is [accessibility: *Tooltips and toggletips*](../../code/accessibility.md#tooltips-and-toggletips).
