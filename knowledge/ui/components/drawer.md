# Drawer

A drawer slides in from an edge of the viewport and spans its height, holding a preview, an item's details or a short configuration beside the page that gives it context. This page owns the drawer and side sheet as a component, in design, in Figma and in code: when to use one, modal or not, and its parts, positions and sizes. What spans surfaces stays in [`../patterns/dialogs.md`](../patterns/dialogs.md): choosing between a tooltip, a popover, a drawer, a dialog and a page; a panel that stays in the layout is [`../patterns/sidebars.md`](../patterns/sidebars.md). Related: [modal dialog](modal-dialog.md), [popover](popover.md), [button](button.md), [sidebars](../patterns/sidebars.md), [filtering](../patterns/filtering.md).

## Overview

**Use when / don't use**
- [weak] Choose the surface before drawing it: [dialogs: *Choosing the surface*](../patterns/dialogs.md#choosing-the-surface) decides between a drawer and the rest; the drawer's own use is [drawers and side sheets](#drawers-and-side-sheets).
- [moderate] A drawer is either modal, over a backdrop, or inline beside the page, and the component says which: Fluent's Drawer takes `type="overlay|inline"` ([Fluent Drawer types](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-drawer/library/src/components/Drawer/Drawer.types.ts)), MUI's `variant="temporary|persistent|permanent"` ([MUI Drawer types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Drawer/Drawer.d.ts)), and Primer reaches only the modal kind, as a Dialog with `position="left|right"` ([Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)).
- [weak] A drawer that never closes is not a drawer but a panel in the layout (MUI's `permanent`); it belongs in [sidebars](../patterns/sidebars.md).

**Anatomy**
- [moderate] A full-height surface at one edge holding a header (title, close button, optional back), a scrolling body and an optional footer of actions; a modal one adds a backdrop. Fluent ships `DrawerHeader`, `DrawerHeaderTitle`, `DrawerHeaderNavigation`, `DrawerBody` and `DrawerFooter` ([Fluent react-drawer components](https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-drawer/library/src/components)); Primer's side sheet is its Dialog's header, body and footer at an edge ([Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)).
- [required] The close button is an icon button instance with its own accessible name (code-standard rule 18; figma-standard rules 27 and 40); it is always present ([drawers and side sheets](#drawers-and-side-sheets)).

## Drawers and side sheets

**Use when / don't use**
- [moderate] A drawer slides from an edge and spans the viewport's height. Use it for a preview, details of a selected item, or a short configuration, when the page behind gives context.
- [weak] Don't use it for long create or edit forms. Primer: "Don't use side sheets to present create/edit forms, or flows that may contain a lot of information. For that, use a page instead."
- [weak] A left drawer is for global navigation; Primer reserves left side sheets for it.

**How**
- [contested] **Modal or not, decided once.** Primer's side sheets are modal ("interacting with the content in the background is not possible", with a backdrop covering the navigation). Carbon's non-modal dialog leaves the page usable. Choose modal when the drawer's task must finish before the page is touched; non-modal when the person compares the drawer with the page.
- [moderate] **A close button**, at the top, always; Escape closes. NN/g's [bottom sheets](https://www.nngroup.com/articles/bottom-sheet/) found users miss grab handles: "include a visible a Close (or X) button".
- [moderate] **No stacking.** NN/g: "Do Not Stack Bottom Sheets"; Primer's backdrop "prevents multiple side sheets from appearing simultaneously".
- [weak] **Short interactions only.** NN/g: a sheet "should not be used for displaying complex content".
- [weak] **Back dismisses it** on touch where it looks like a page (NN/g); on the web, a drawer that has its own address closes on Back.
- [weak] **Bottom sheets** are the narrow-screen form of a dialog or drawer (Primer); full width, backdrop, tapping the backdrop dismisses.

**Cases**
- Clicking a row in a list to glance at its details while scanning the list → a non-modal right drawer, so the list stays usable beside it; a list worked through item by item gets a panel in the layout instead ([sidebars: contextual side panels](../patterns/sidebars.md#contextual-side-panels)).
- "Edit" in that drawer opening a twenty-field form → a page.
- A live preview the person compares with the work while editing → docked beside it, not a drawer ([sidebars: object header over a tool layout](../patterns/sidebars.md#object-header-over-a-tool-layout)).
- A drawer that opens a second drawer for a sub-item → one drawer with a back step inside, or a page.
- A filter drawer on mobile → modal, full height, with "Show 42 results" and a close button (filtering: [`filtering.md`](../patterns/filtering.md)).

**Accessibility**
- [strong] Modal drawers follow the dialog focus contract above. Non-modal drawers move focus in on open, do not trap, and return focus to the trigger on close; Tab can leave them.
- [required] 2.4.11: a non-modal drawer does not cover the focused element on the page behind.
- [required] 1.3.2: the drawer's DOM position follows its trigger or is a labelled region, so reading order makes sense (code-standard rule 2).

**Build**
- [required] Modal drawer: a `dialog` opened with `showModal()`, positioned to an edge; it inherits the dialog focus contract ([accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- [strong] Non-modal drawer: a `dialog` opened with `show()`, or a labelled `aside` revealed by a `button` with `aria-expanded`; focus moves in on open, Tab can leave, Escape closes and returns focus.
- [moderate] Placed with logical properties (`inset-inline-end: 0`), so a right-to-left page mirrors it ([i18n: *Logical properties and mirroring*](../../code/i18n.md#logical-properties-and-mirroring)).
- [moderate] Slides with `transform`, stilled under `prefers-reduced-motion` ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code); [accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).
- [weak] A drawer with its own address closes on Back: open and close push and pop history ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- [required] Closed means `hidden` or a closed `dialog`, never moved off screen where Tab still reaches it; a `hidden` drawer whose stylesheet sets `display` carries `[hidden] { display: none }` (code-standard rule 17).

**Check**
- *Script* could: open a drawer and assert a close button exists, Escape closes it, focus returns; for a non-modal drawer assert Tab can reach the page and the focused element is never fully covered.
- *Judgement*: does the person need the page while the drawer is open, and is the task short?

**Sources.** Primer treats side sheets as modal dialogs; Carbon and NN/g describe non-modal panels and sheets. The toolkit lets the task decide and requires the choice to be stated per drawer in the design.

## In Figma

**Layers**
- [required] Auto layout throughout: a vertical stack of `Header`, `Body` and `Actions`, filling the frame's height, with the body filling the space between and the title hugging vertically (figma-standard rule 33).
- [required] Parts are named for the family and their last word (`Drawer header`), and inside the drawer each layer keeps only the last word (figma-standard rules 9 and 10).
- [required] The close button sits at the header's trailing end by auto layout, and the drawer's own side is named by role (figma-standard rule 21); where the project mirrors, a right-to-left page then mirrors both (figma-standard rule 50).

**Properties**
- [required] `Title` is a text property; the body is a slot named `Slot` and the footer's buttons an `Actions slot`, revealed by `Show actions slot` directly above it, so each consumer's labels survive a variant switch (figma-standard rules 5, 21, 37 and 38).
- [required] A back button in the header, for a drawer with a step inside, is an icon button instance revealed by `Show back button` (figma-standard rules 21 and 27; one drawer with a back step rather than a second drawer, [drawers and side sheets](#drawers-and-side-sheets)).

**Variants and states**
- [strong] `Position` is an axis with the values `Trailing`, `Leading` and `Bottom`, never `Left` or `Right` (figma-standard rule 21, and figma-standard rule 50 where the project mirrors): Fluent's `position` is `start|end|bottom` ([Fluent Drawer types](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-drawer/library/src/shared/DrawerBase.types.ts)), MUI's `anchor` and Primer's `position` name the physical sides ([MUI Drawer types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Drawer/Drawer.d.ts), [Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)).
- [moderate] Width is a `Size` axis with t-shirt values, largest first (figma-standard rule 6); Fluent's `size` runs `small`, `medium`, `large` and `full` ([Fluent Drawer types](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-drawer/library/src/shared/DrawerBase.types.ts)).
- [weak] `Modal` is a True/False variant, drawing the backdrop and the elevation only where it is True, since the two kinds look different; the choice is stated per drawer in the design ([drawers and side sheets](#drawers-and-side-sheets); figma-standard rule 21 names it a bare word).
- [weak] No `State` axis: the surface takes no hover, press or focus; its buttons carry their own (beyond figma-standard rule 35).
- [required] The axes run `Size → Position → Modal`: `Size` first, then the drawer's own axes, `Modal` listing its default value first (figma-standard rule 1).

**Tokens**
- [required] Fill, border, shadow, padding, gap and the backdrop's colour are bound to variables, semantic and never primitive (figma-standard rules 24 and 29); text fills take text-role tokens (figma-standard rule 28).
- [required] Each `Size` value's width is a token, so code reads the same number (figma-standard rule 29); component tokens, where the project has them, are `Component/Drawer/<Element>/<property>` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the snapshot's contract lists every axis, property and slot for the parity report.
- *Judgement*: does each drawn drawer say whether it is modal, and is its task short enough for one?

**Sources.** Fluent, MUI and Primer for positions, sizes and the modal choice; the slot and naming rules of figma-standard. Fluent alone names its sides logically; the toolkit follows it, as its own naming rule does.

## In code

**Element**
- [required] The element for each kind, and what closed means, are in [drawers and side sheets: *Build*](#drawers-and-side-sheets).
- [required] It opens without script from `popovertarget` before the script upgrades it (code-standard rule 20).

**Props**
- [strong] Open state and a close callback, a position, a size and the modal choice, with the body and actions as children: Fluent (`open`, `position`, `size`, `type`, and `modalType` on its overlay drawer), MUI (`open`, `onClose`, `anchor`, `variant`) and Primer (`onClose`, `position`, `width`) ([Fluent Drawer types](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-drawer/library/src/shared/DrawerBase.types.ts), [MUI Drawer types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Drawer/Drawer.d.ts), [Primer Dialog source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Dialog/Dialog.tsx)).
- [required] The body and footer are slots, never a string or render prop (code-standard rule 13).

**From Figma**
- [required] Each Figma property maps to one attribute, prop or child, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Position=Trailing`, `Leading` | `position="end"` or `"start"`, placed with `inset-inline-end` or `inset-inline-start` |
  | `Position=Bottom` | `position="bottom"`, `inset-block-end: 0` |
  | `Size` | `size`, each value an `inline-size` token |
  | `Modal=True` | `showModal()`, with `::backdrop` painted from the token |
  | `Modal=False` | `show()`, or an `aside` with its trigger's `aria-expanded` |
  | `Title` | the heading, referenced by `aria-labelledby` |
  | `Slot`, `Actions slot` | the body's and footer's children |
  | `Show actions slot` | whether a footer is passed |
  | `Show back button`, close button | named `button` elements (code-standard rule 18) |
- [required] `position` names the logical side, so the same markup mirrors in a right-to-left page ([i18n: *Logical properties and mirroring*](../../code/i18n.md#logical-properties-and-mirroring)).

**Check**
- *Script*: the parity loop compares each variant with its frame (design-code-parity); the component contract flags a Figma property with no prop.
- *Judgement*: does the coded drawer's modality match the one the design stated?

**Sources.** Fluent, MUI and Primer for props; the behaviour each serves is in [drawers and side sheets](#drawers-and-side-sheets).
