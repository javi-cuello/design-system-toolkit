# Sidebars: side navigation, icon rails, nesting, side panels, resizing and workspace switching

How a vertical panel beside the content works: a navigation sidebar listing a section's pages, a sidebar that collapses to an icon rail, expandable groups inside it, what it becomes on a small screen, a contextual panel that shows details beside a list, a sidebar that scrolls on its own or is resized, the several regions of a tool's window each shown and hidden on its own, an app sidebar's header, body and footer, and the workspace switcher in its header. It serves the principles *discoverable* (a section's pages are in sight while reading one of them), *show state* (the current page is marked), *consistent, not uniform* (the sidebar is in the same place across a section) and *efficient for people who know it* (a rail and a resizable panel serve daily use). It applies design-standard rule 2 (opening a group or choosing a page never moves the controls the reader is using). This page owns local and side navigation, which navigation.md now only points to. The top bar is [`menus.md`](menus.md)'s; a filter sidebar is [`filtering.md`](filtering.md#filter-bar-sidebar-or-filter-dialog)'s; drawers and side sheets that overlay the page are [`dialogs.md`](dialogs.md#drawers-and-side-sheets)'s; what an inspector holds is [`property-editors.md`](property-editors.md)'s; in-page "On this page" lists are navigation.md's.

## Navigation sidebar

**Use when / don't use**
- Use when a section has more pages than the top bar can hold, readers move between them, compare across them or arrive on inner pages from search: a docs section, a settings area, a tool's sub-views ([NN/g local navigation](https://www.nngroup.com/articles/local-navigation/)). Carbon uses its left panel past five secondary items, or when readers switch between them often ([Carbon UI shell left panel](https://carbondesignsystem.com/components/UI-shell-left-panel/usage/)).
- Use a vertical list for a broad or growing structure: it "can accommodate as many top-tier items as needed" and offers "room for growth" ([NN/g vertical navigation](https://www.nngroup.com/articles/vertical-nav/)).
- Don't use it on a small site of a handful of pages; the top bar is enough (NN/g local navigation).
- Don't make it louder than the global bar: "local navigation should not be more salient than the global navigation" (NN/g).
- Don't use it for views of one context that don't change the address; those are tabs ([Primer navigation](https://primer.style/product/ui-patterns/navigation/): a NavList item changes the URL, a tab switches views within one context).

**How**
- **Position:** left of the content, under the top bar, forming the inverted L NN/g describes; readers look at the left half of the screen most of the time ([NN/g vertical navigation](https://www.nngroup.com/articles/vertical-nav/)).
- **Width:** wide enough for the longest label without truncation at the default text size, and fixed across the section; NN/g notes a sidebar lowers the content-to-chrome ratio, which matters at mid widths and hardly at all on large screens.
- **Grouping:** related pages under short group headings; a long flat list becomes five to eight groups. Primer's NavList groups items under titled groups and names the whole region with a heading ([Primer NavList](https://primer.style/product/components/nav-list/)).
- **Order:** by the reader's task or the content's own order (getting started first, reference after); less important items at the bottom, where they may fall below the fold (NN/g vertical navigation).
- **Labels:** text always; an icon may sit beside the label, never instead of it on a wide screen ("A word is worth a thousand pictures", NN/g vertical navigation).
- **Current page:** marked by more than colour and with `aria-current`, its group open and its ancestors marked; weaker than or equal to the global bar's current marker (NN/g salience).
- **Trailing information** (a count, an external-link icon) sits after the label and is not part of its name ([Primer NavList](https://primer.style/product/components/nav-list/)).

**Cases**
- A settings area has 40 pages in one flat list → five to eight groups under headings; a 40-item list is a search problem.
- The sidebar marks the current page in strong brand colour and the top bar in grey → swap the weights; local is never louder than global.
- Labels truncate with an ellipsis at the sidebar's width → widen the sidebar or shorten the labels; a truncated navigation label hides the one thing it is for.
- A tool's "Overview, Activity, Settings" switch views of one record without changing the address → tabs, not a sidebar.

**Accessibility**
- 2.4.8 Location, 1.3.1 Info and Relationships (groups and nesting in markup), 2.4.3 Focus Order (sidebar before or after `main` consistently in visual and DOM order), 3.2.3 Consistent Navigation, 1.4.1 (current not by colour alone), 1.4.10 Reflow.
- Figma: figma-standard rule 31 (current, hover and focus draw differently), figma-standard rule 26, figma-standard rule 32.

**Build**
- *Elements:* a `nav` with its own accessible name (a visible heading referenced by `aria-labelledby`, as Primer's NavList heading does), group headings as headings, each group a `ul` of `a`. A second `nav` on the page always has a different name from the global one.
- *ARIA and keyboard:* landmark and links only; Tab moves through the links. Not a `tree` and not a `menu`: Primer states a tree view "is never an accessible replacement for navigation" because assistive technology does not recognise it as navigation ([Primer NavList](https://primer.style/product/components/nav-list/)), and the APG's menu roles are for commands ([APG disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)).
- *States:* `aria-current="page"` on the current link, `aria-current="true"` on its section link where the page has no link of its own ([MDN aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current)); styling off the attribute.
- *Rules:* code-standard rule 64, code-standard rule 1 (a labelled landmark, headings and lists), code-standard rule 2, code-standard rule 15 (a trailing count is a description, not part of the link's name), code-standard rule 21.
- *Detail:* [code: landmarks](../../code/html-semantics.md#landmarks), [code: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions), [code: lists, description lists and figures](../../code/html-semantics.md#lists-description-lists-and-figures).

**Check**
- *Script:* could check one `aria-current` per sidebar, a distinct accessible name per `nav`, no `role="tree"` or `role="menu"` on a list of links, no truncated label at the default width, and that the sidebar's current-item weight does not exceed the global bar's.
- *Judgement:* Does the grouping match how readers think of the content, or how the team is organised?

**Sources:** NN/g, Carbon, Primer, MDN and the APG as linked; they agree.

## Collapsible sidebar and icon rail

**Use when / don't use**
- Use a collapsible sidebar in a tool used every day, where readers want the content wider once they know the navigation: NN/g calls collapsing to icons "a realistic compromise for applications used every day" ([NN/g vertical navigation](https://www.nngroup.com/articles/vertical-nav/)).
- Don't collapse by default on a website visited occasionally; NN/g: "not a recommended strategy" there, and "don't be tempted to hide your desktop navigation".
- Don't collapse a documentation sidebar to icons: docs pages have no icons readers would recognise.

**How**
- **Expanded is the default** on wide screens; the reader collapses it with a visible control at the sidebar's top or bottom edge, and the choice is remembered across pages and visits ([UX: state persistence and restore](../design/ux.md#state-persistence-and-restore)).
- **The rail** keeps one icon per top-level item, in the same order and at the same height as when expanded, so the reader's spatial memory holds; each icon shows its label on hover and on keyboard focus.
- **Groups in the rail:** Atlassian's sidebar shows each collapsed group as a single icon whose items open in a fly-out ([Atlassian AUI sidebar](https://aui.atlassian.com/aui/9.1/docs/sidebar.html)); the fly-out opens on click, like any dropdown ([menus: navigation dropdowns](menus.md#navigation-dropdowns)).
- **Push, not overlay,** when expanded on a wide screen; at mid widths the expanded sidebar floats over the content and closes on Escape or a click outside. Atlassian's navigation system collapses its side nav automatically below 1024px and opens it there as an overlay, inline from 1024px up ([Atlassian layout examples](https://atlassian.design/components/navigation-system/layout/examples)); its older AUI sidebar switched at 1280px.
- **Auto-collapse** at a mid width is acceptable; a reader's explicit choice wins over it, and the page renders in the remembered state from the first paint, not after script runs (Atlassian sets the initial state in markup for this reason).
- **Current item** stays marked in the rail.
- **Motion** short, and none under reduced motion; animating the content's width reflows the page on every toggle (Atlassian's documentation warns of this), so prefer an instant change.

**Cases**
- A dashboard's sidebar collapses to unlabelled icons by default → expanded by default; collapsed only by the reader's choice.
- The rail reorders icons by usage → keep the expanded order; the reader finds items by place.
- A reader collapses the sidebar, reloads and it flashes open then closes → render the remembered state server-side or in the first paint.
- Icons in the rail show their label only on hover → also on focus, and as the accessible name.

**Accessibility**
- 4.1.2 (the collapse control exposes its state; each rail icon has a name), 1.4.13 Content on Hover or Focus (labels shown on hover are dismissable and hoverable), 2.4.7 Focus Visible, 1.4.1, 2.5.8 (rail icons meet the target), 2.3.3 Animation from Interactions.
- Figma: figma-standard rule 26, figma-standard rule 31.

**Build**
- *Elements:* the same `nav` and lists; a `button` for collapse, its visible text or name "Collapse sidebar" / "Expand sidebar". Rail icons are the same `a` elements with their text visually hidden, never removed, so the name survives.
- *ARIA and keyboard:* the collapse button carries `aria-expanded` and `aria-controls`; a rail group's fly-out follows the APG disclosure navigation pattern ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)); hover labels are a tooltip that also shows on focus ([dialogs: tooltips](dialogs.md#tooltips)).
- *States:* `aria-expanded` on the button; a `data-sidebar="expanded|collapsed"` attribute on the layout styles both; the remembered state is read before render (a cookie or server-side preference), not written during render.
- *Rules:* code-standard rule 18 (icon-only links in the rail are named), code-standard rule 20 (without script the sidebar is expanded and every link works; a render never writes the preference), code-standard rule 9 (collapsed is a state attribute, not a separate component), code-standard rule 64, code-standard rule 17.
- *Detail:* [code: hidden content](../../code/accessibility.md#hidden-content) (visually hidden text), [code: state in the address and history](../../code/javascript.md#state-in-the-address-and-history), [code: layout stability in code](../../code/performance.md#layout-stability-in-code).

**Check**
- *Script:* could collapse the sidebar and assert every rail link keeps an accessible name, the order matches the expanded list, the state survives a reload with no layout shift, and the collapse button's `aria-expanded` matches what is shown.
- *Judgement:* Do readers of this product use it daily enough to know the icons?

**Sources:** NN/g and Atlassian as linked. Atlassian's navigation system states its collapse behaviour in its [layout examples](https://atlassian.design/components/navigation-system/layout/examples): a toggle button in the top nav, an optional Ctrl+[ shortcut, a hover flyout, a resize range and the 1024px breakpoint; the older AUI documentation is still cited for the rail's fly-out groups and for setting the initial state in markup, and NN/g for when to collapse at all.

## Nesting and expandable groups

**Use when / don't use**
- Use expandable groups when a section's pages fall into a second level and the full list is too long to show open.
- Keep to two levels in the sidebar. Carbon's left panel "does not support three tiers of navigation" ([Carbon UI shell left panel](https://carbondesignsystem.com/components/UI-shell-left-panel/usage/)); Primer allows up to four and says past that to rethink the design ([Primer NavList](https://primer.style/product/components/nav-list/)); NN/g notes vertical navigation suits deep structures poorly because each tier indents into the content ([NN/g local navigation](https://www.nngroup.com/articles/local-navigation/)).
- Don't drill into nested views that replace the list with a "Back" button on a wide screen; Atlassian's older side navigation did, and said to keep nesting minimal and always offer a way back ([Atlassian side navigation](https://atlassian.design/components/side-navigation/usage)). Expanding in place keeps the whole structure in view.

**How**
- **A parent's job is decided once:** in Primer's NavList an item with sub-items is a toggle, not a link ([Primer NavList](https://primer.style/product/components/nav-list/)). The toolkit's form: the parent is a toggle, and its overview page is the first child link ("Overview"). Where a parent must also be a page, the label is the link and a separate chevron button toggles, with a target of its own; never one element doing both.
- **Open by default:** the group holding the current page; others stay as the reader left them across pages.
- **Hierarchy shown:** children indented and lighter than parents, so visual hierarchy reflects information hierarchy (NN/g).
- **Many groups open at once** are allowed; an accordion that closes one when another opens fights the reader who compares.
- **A third level** goes into the page as an in-page list, or the branch becomes its own section.

**Cases**
- A parent label both links to its overview and expands on click → make it a toggle and add "Overview" as its first child, or split label (link) and chevron (button).
- One branch needs a third level → move the third level into the pages as an "On this page" list, or make the branch a section.
- Opening "Tokens" closes "Components" → let both stay open.
- The current page's group is closed on arrival → open it by default.

**Accessibility**
- 1.3.1 (nesting as nested lists), 4.1.2 (each toggle exposes expanded state and a name), 2.4.8 Location (the current page's ancestors marked), 2.5.8 (a separate chevron meets the target on its own).

**Build**
- *Elements:* nested `ul` inside the parent's `li`; the toggle a `button` (or a `details`/`summary` with the child list inside). Collapsed children are `hidden` and leave the tab order.
- *ARIA and keyboard:* the disclosure pattern: `aria-expanded` and `aria-controls` on the toggle; Enter or Space toggles; Tab moves through visible links only ([APG disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)). Not the APG treeview: although the APG has a navigation tree example, a tree's arrow-key model and single tab stop ([APG treeview](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)) are not what readers of a website expect, and Primer warns it is not recognised as navigation. A tree is for a file or object hierarchy inside a tool, not for pages.
- *States:* `aria-expanded` on each toggle, `hidden` on closed child lists, `aria-current="page"` on the current link, its ancestors' open state set server-side so the right group is open without script. Ancestors are styled from a hook attribute (`data-ancestor`) or `aria-current="true"` on a section link, never a second `aria-current="page"`.
- *Rules:* code-standard rule 20 (without script every group is open), code-standard rule 17, code-standard rule 18 (a chevron-only toggle is named "Show Tokens pages"), code-standard rule 64, code-standard rule 1.
- *Detail:* [code: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers), [code: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex) (why a tree is a composite widget, and when one is right).

**Check**
- *Script:* could check nesting depth is two or less, each toggle is a `button` (or `summary`) with `aria-expanded` and a name, no element is both a link and a toggle, the current page's group is open on load, and with script disabled every link is visible.
- *Judgement:* Does a reader need the whole hierarchy in the sidebar, or would a section split serve better?

**Sources:** Carbon, Primer, NN/g, Atlassian and the APG as linked. They disagree on depth: Carbon stops at two, Primer at four. The toolkit stops at two for the reason NN/g gives, that each tier eats into the content's width.

## Sidebars on small screens

**Use when / don't use**
- Below the width where sidebar and content both fit at a readable measure, the sidebar leaves the layout. What replaces it depends on what it holds ([Primer navigation](https://primer.style/product/ui-patterns/navigation/)):
  - **An index of pages:** hidden on detail pages; the reader returns to the parent page for the list, with a back link one level deep or a breadcrumb deeper.
  - **Filters:** a filter menu or sheet ([`filtering.md`](filtering.md#filter-bar-sidebar-or-filter-dialog)).
  - **Both:** filters to a menu, page links to the parent's index view.
- Don't add a second menu button for the sidebar beside the global one: one Menu button holds the global items and then the section's pages ([menus: hamburger and mobile menus](menus.md#hamburger-and-mobile-menus)).

**How**
- **Three forms,** chosen once per product: the section's pages inside the global Menu (after the global items, the current section open); a "Pages in this section" disclosure at the top of the content; or Primer's index-and-detail split, where the list is its own page on a phone. Never two of these for the same list.
- **A full-screen overlay** form behaves as a modal dialog (Primer's sidebar has a full-screen variant below 768px that covers the viewport like one, [Primer SplitPageLayout](https://primer.style/product/components/split-page-layout/)).
- **Breakpoint** from the content: the width at which content plus sidebar stops fitting at a readable measure, not a device list.
- **Current page** still marked in whichever form holds the list.

**Cases**
- On a phone the docs sidebar becomes a drawer behind a second hamburger beside the global one → one Menu, global items first, then this section's pages open.
- A settings area's sidebar on a phone → the list of settings is the parent page; each setting page has "Back to settings" (Primer's one-level form).
- A component catalogue's sidebar holds both page links and filters → filters to a "Filters" button, page links to the catalogue's index.
- The sidebar stays inline above the content on a phone and pushes the content 1,200px down → a collapsed "Pages in this section" disclosure, or the Menu.

**Accessibility**
- 1.4.10 Reflow (no horizontal scroll at 320px), 2.4.3 Focus Order (focus into an overlay and back to its trigger), 2.1.2 No Keyboard Trap, 3.2.3 (the same list, the same order, at every width), 2.4.8 Location.

**Build**
- *Elements:* one `nav` in the DOM, restyled at the breakpoint; a disclosure form wraps it in `details` or a toggle `button`; an overlay form uses `dialog` opened with `showModal()`, or the Popover API for a non-modal panel.
- *ARIA and keyboard:* the disclosure pattern for an inline form; the dialog's focus contract (focus in, trapped, returned, Escape) for an overlay ([dialogs: focus](dialogs.md#focus-in-trapped-returned)).
- *States:* `aria-expanded` on the toggle, `hidden` when closed, `open` on `details` or `dialog`; `aria-current` unchanged.
- *Rules:* code-standard rule 20 (a modal opens from `popovertarget` before `showModal()` takes over; without script the list shows), code-standard rule 17, code-standard rule 19, code-standard rule 36 (the same toggle script as the global menu, included once), code-standard rule 2.
- *Detail:* [code: breakpoints](../../code/responsive.md#breakpoints), [code: container queries](../../code/responsive.md#container-queries), [code: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers).

**Check**
- *Script:* could check at 320px for no horizontal scroll, that the sidebar's links exist once in the DOM, that only one menu toggle is visible, and that an overlay returns focus to its trigger on Escape.
- *Judgement:* Which of the three forms suits how readers move through this section on a phone?

**Sources:** Primer as linked; its index-and-detail form and the toolkit's single Menu agree that one list has one way in.

## Contextual side panels

**Use when / don't use**
- Use a side panel beside a list when the reader works through items one by one and needs the list in view while reading each: a queue, an inbox, a list of findings. Primer's parent-detail split keeps the "parent" sidebar on screen while the reader moves between detail views ([Primer navigation](https://primer.style/product/ui-patterns/navigation/)).
- Use a panel anchored to a header control for product-wide tools (notifications, help, a switcher); Carbon's right panels float over the page, one open at a time ([Carbon UI shell right panel](https://carbondesignsystem.com/components/UI-shell-right-panel/usage/)).
- Don't use a panel for a long create or edit form, or for a detail the reader reads once and leaves: those are pages ([dialogs: drawers and side sheets](dialogs.md#drawers-and-side-sheets)).
- Panel, drawer or page: a **panel** is part of the layout and stays while the reader works the list; a **drawer** overlays for a short task; a **page** holds anything long, linkable or worked alone.

**How**
- **Position:** the list on the left, the panel on the right (or the panel at the end, in Primer's terms, configurable per breakpoint, [Primer PageLayout](https://primer.style/product/components/page-layout/)).
- **Selection drives the panel:** choosing an item fills the panel and marks the item as current; the selected item is in the address, so a reload or a shared link reopens it ([UX: state persistence and restore](../design/ux.md#state-persistence-and-restore)).
- **Empty panel state:** before anything is chosen, the panel says what choosing does, never blank ([feedback: empty states](feedback.md#empty-states)).
- **Next and previous** inside the panel let the reader work the list without returning to it.
- **Narrow screens:** list and detail stack; the detail becomes its own view with a way back to the list (Primer navigation).
- **One panel at a time** in one region (Carbon).

**Cases**
- An audit queue opens each finding on its own page and the reader loses their place → a list with a detail panel, the finding in the address.
- A details panel opens over the list, hiding the next item → make it part of the layout (push), or a non-modal drawer that leaves the list usable.
- "Edit" in the panel opens a twenty-field form inside it → a page.
- On a phone the list and panel squeeze side by side at 160px each → stack them.

**Accessibility**
- 2.4.3 Focus Order (focus moves into the panel when an item is chosen by keyboard, and back to the item on close), 4.1.3 Status Messages (if focus stays in the list, the panel's update is announced or the panel is a labelled region), 1.3.1 (the panel is a labelled region), 2.4.11 Focus Not Obscured (an overlay panel never hides the focused item).

**Build**
- *Elements:* the list's items are links (each item's detail has an address) or buttons in a listbox if selection is not navigation; the panel is an `aside` or a `section` with an accessible name, or `main`'s second column. An overlaying panel is a non-modal `dialog` or a popover.
- *ARIA and keyboard:* the chosen item carries `aria-current="true"` (links) or `aria-selected` (a listbox, [code: composite widgets](../../code/accessibility.md#composite-widgets-and-roving-tabindex)); the panel is labelled by its heading.
- *States:* the selected item's id in the address (`?item=…`), `aria-current` on it, the panel's content swapped in place keeping focus.
- *Rules:* code-standard rule 14 (a live swap keeps the reader's place), code-standard rule 20 (without script each item is a link to its own page), code-standard rule 21, code-standard rule 64, code-standard rule 12 (the empty panel renders only when nothing is chosen).
- *Detail:* [code: state in the address and history](../../code/javascript.md#state-in-the-address-and-history), [code: re-rendering without losing focus or scroll](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll), [code: focus management](../../code/accessibility.md#focus-management).

**Check**
- *Script:* could choose an item and assert the address carries it, a reload reopens it, the item carries `aria-current`, focus does not jump unexpectedly, the panel has an accessible name, and with script disabled the item's link opens its own page.
- *Judgement:* Does the reader work through the list item by item (panel), or open one item and leave (page)?

**Sources:** Primer and Carbon as linked. Primer's split keeps the list in the layout; Carbon's right panels overlay for system-level tools. The toolkit uses the layout panel for list work and the overlay only for product-wide tools.

## Resizable and sticky sidebars

**Use when / don't use**
- **Sticky with its own scroll** for every sidebar longer than the viewport: the sidebar stays in view and scrolls inside itself, the page does not scroll it away. Primer's panes stick by default and offset below a sticky header ([Primer PageLayout](https://primer.style/product/components/page-layout/)).
- **Resizable** only where readers' content varies in width and they work there for long (a code tree, a list-detail tool): Primer and Atlassian both ship resizing off by default ([Primer PageLayout](https://primer.style/product/components/page-layout/); [Atlassian AUI sidebar](https://aui.atlassian.com/aui/9.1/docs/sidebar.html)).
- Don't make a docs sidebar resizable; a well-chosen fixed width serves it.

**How**
- **Sticky:** top offset equal to the sticky header's height, height the viewport minus that, overflow scrolling inside; the current item scrolled into view on load.
- **Resize handle:** on the sidebar's inner edge, with a visible affordance on hover and focus, a minimum and maximum width (Primer's minimum defaults to 256px; Atlassian's side nav runs from 240px to 50% of the viewport, its panel from its default width to 50% of the content area, [Atlassian layout examples](https://atlassian.design/components/navigation-system/layout/examples)), and a double-click action, which Primer makes a reset and Atlassian a collapse. Apple: "Set reasonable defaults for minimum and maximum pane sizes" so the divider stays visible, and "Prefer the thin divider style" ([Apple split views](https://developer.apple.com/design/human-interface-guidelines/split-views)).
- **Remembered width:** stored per reader and applied before first paint; Primer warns that restoring from browser storage after hydration shifts the layout.
- **Collapse from the handle:** Enter on the handle collapses the pane and restores it (the APG window splitter's model, [APG window splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/)).

**Cases**
- A long docs sidebar scrolls away with the page and the reader scrolls back up to change page → sticky, with its own scroll.
- The sticky sidebar's top hides under the sticky header → offset by the header's height, the same value the header uses.
- A resizable panel is dragged to 40px and its labels vanish → enforce a minimum width, or collapse to the rail at the minimum.
- A reader resizes the sidebar and each page load flashes the default width first → apply the stored width server-side or before paint.

**Accessibility**
- 2.1.1 Keyboard (the handle resizes by keyboard), 4.1.2 (the handle has a name and a value), 2.5.7 Dragging Movements (a single-pointer alternative to dragging: the keyboard, a collapse button or preset widths), 2.4.7 Focus Visible (the handle shows focus), 1.4.10 Reflow (a sticky sidebar stops sticking when the viewport is short).

**Build**
- *Elements:* the sidebar `nav` with `position: sticky`, `top` and `max-block-size` from the header's height token, `overflow-y: auto`; the handle a focusable element between sidebar and content.
- *ARIA and keyboard:* the APG window splitter: `role="separator"`, focusable, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-controls` pointing at the sidebar, and a name from the sidebar's label (`aria-labelledby`) or `aria-label`; Left and Right Arrow move it, Enter collapses and restores, Home and End are optional. The APG marks this pattern as under review, so test it with screen readers ([APG window splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/)).
- *States:* width as a custom property (`--sidebar-width`) on the layout, `aria-valuenow` kept in step with it; the stored width read at render, written only on resize end.
- *Rules:* code-standard rule 38 (the width reaches the component through a custom property), code-standard rule 22 (min, max and default widths are tokens or carry their reasons), code-standard rule 46 (the header height the offset uses lives in one place), code-standard rule 20 (a render never writes the stored width; without script the sidebar has its default width and still scrolls), code-standard rule 57 (minimums derived from the content, not fitted to today's labels).
- *Detail:* [code: custom properties](../../code/css-architecture.md#custom-properties), [code: zoom and reflow](../../code/responsive.md#zoom-and-reflow), [code: layout stability in code](../../code/performance.md#layout-stability-in-code), [code: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex).

**Check**
- *Script:* could scroll a long page asserting the sidebar stays in view and its last item is reachable by its own scroll; focus the handle and assert arrow keys change the width and `aria-valuenow`, Enter collapses and restores; assert the width persists across a reload with no layout shift and respects its minimum.
- *Judgement:* Does anyone need to resize this, or is the default width wrong?

**Sources:** Primer, Atlassian, Apple and the APG as linked. Primer and Atlassian agree on resizing as opt-in and differ on double-click (reset or collapse); the toolkit picks one per product. The APG gives the keyboard model and is still under review, which the toolkit notes rather than waits on.

## Showing and hiding panels in a tool layout

**Use when / don't use**
- Use when a tool's window holds the work in the middle and supporting regions round it: navigation on the leading side, a tool palette, an inspector or preview on the trailing side, perhaps a bottom panel. Apple's model is Keynote: navigator, presenter notes and inspector surround the canvas, and people hide the navigator and notes "when they want to edit slide content" ([Apple split views](https://developer.apple.com/design/human-interface-guidelines/split-views)).
- Let a region be hidden when the work gains from the room or from fewer distractions; Apple: "Consider letting people hide a pane when it makes sense" (split views).
- Don't hide the navigation sidebar by default; Apple: "Avoid hiding the sidebar by default to ensure that it remains discoverable" ([Apple sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars)).
- Don't put what people need always in sight into a region they will hide; VS Code: don't use its Panel "for Views that are meant to be always visible since users often minimize the Panel" ([VS Code panel](https://code.visualstudio.com/api/ux-guidelines/panel)).
- A region is part of the layout and pushes the work aside; a drawer or sheet overlays for a short task ([dialogs: drawers and side sheets](dialogs.md#drawers-and-side-sheets)). Atlassian draws the same line between its layout Panel, which "presents content alongside the main area", and a modal "in a layer above the page" ([Atlassian layout usage](https://atlassian.design/components/navigation-system/layout/usage)); Fluent between an inline drawer that "sits side-by-side with main page content" and an overlay one ([Fluent drawer](https://fluent2.microsoft.design/components/web/react/core/drawer/usage)); Material between a standard side sheet and a modal one with a scrim ([Material side sheets, Android docs](https://github.com/material-components/material-components-android/blob/master/docs/components/SideSheet.md)).

**How**
- **Each region has one toggle, on the window's chrome, on the region's side.** Apple's toolbar puts the sidebar's control "at the far leading edge" and "buttons that open nearby inspectors" at the trailing edge, where they "remain visible at all window sizes" ([Apple toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)); VS Code's title bar holds controls that "toggle the visibility of the main UI elements (Side bars and Panel region)" ([VS Code custom layout](https://code.visualstudio.com/docs/configure/custom-layout)); Carbon's right panels are "invoked by icons on the right side of the header" ([Carbon right panel](https://carbondesignsystem.com/components/UI-shell-right-panel/usage/)). The toggle stays put whether the region is shown or hidden, so the way back is where the way out was. A close button in the region's own header may be added, never instead.
- **The toggle shows its state.** Carbon outlines the triggering icon while its panel is open; Atlassian's `isSelected` marks a top nav item "when a corresponding popup or panel is open" and "exposes the state to assistive technology" ([Atlassian top nav items](https://atlassian.design/components/navigation-system/top-nav-items/usage)).
- **The button's name is the region's and stays put** ("Inspector", "Sidebar"), the state carried by `aria-expanded`. A menu command flips its text: Apple: "Ensure that each show/hide item title reflects the current state", Show Toolbar when hidden, Hide Toolbar when shown ([Apple menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar)). A button whose name and `aria-expanded` both flip is heard as "Hide inspector, expanded", the state said twice.
- **More than one way in.** Apple: "Provide multiple ways to reveal hidden panes… a toolbar button or a menu command, including a keyboard shortcut" (split views). The shortcut appears in the toggle's tooltip, as Atlassian's `shortcut` prop does so it is "discoverable for keyboard users" (top nav items).
- **Shortcuts people already know:** Cmd+B or Ctrl+B for the primary side bar in VS Code ([VS Code default keybindings](https://code.visualstudio.com/docs/reference/default-keybindings)), Option+Cmd+B or Ctrl+Alt+B for its secondary side bar (custom layout); Option+Command+I to "Display an inspector window" on Apple platforms ([Apple keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards)); Ctrl+[ for Atlassian's side nav, off by default ([Atlassian layout examples](https://atlassian.design/components/navigation-system/layout/examples)). Each carries a modifier ([code: keyboard shortcuts](../../code/accessibility.md#keyboard-shortcuts), 2.1.4).
- **Hiding a region that holds focus moves focus to its toggle,** or, where the toggle is itself hidden at a narrow width, to the work area's heading or the selected item; otherwise focus falls to the body. Showing a region by its toggle leaves focus on the toggle; by a shortcut it may move into the region, as VS Code's "Show Explorer / Toggle Focus" does. No source states the hide rule; it follows from 2.4.3 ([Understanding 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)).
- **Each region remembers its own visibility and width.** VS Code "will remember the layout of views and panels across your sessions" (custom layout); Atlassian: a resized area "retains its resized width after it's collapsed or expanded" (layout examples). Read and write them as [collapsible sidebar and icon rail](#collapsible-sidebar-and-icon-rail) and [resizable and sticky sidebars](#resizable-and-sticky-sidebars) say for one sidebar, per region.
- **Regions in the layout may all be open; overlays come one at a time.** Carbon: "only one [right panel] can be expanded at any time"; Fluent: "Don't invoke multiple overlay drawers at a time" (drawer). In practice a navigation sidebar, one trailing inspector and at most one bottom panel; a tool palette and an inspector share one trailing column as tabs or sections, not two columns.
- **As the window narrows, regions give way in a declared order, then become overlays.** Atlassian's side nav and panel are inline from 1024px and overlays below it, the overlay at most 320px or 90% of the screen below 768px (layout examples); Apple: "Consider automatically hiding and revealing a sidebar when its container window resizes" (sidebars); Material's standard drawers "aren't suitable for mobile devices" ([Material navigation drawer, Android docs](https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationDrawer.md)), and the same docs mark the drawer as deprecated in Material 3 Expressive in favour of an expanded navigation rail. Write down which region goes first (usually the one furthest from the task) and at which widths, measured from the content.
- **An automatic collapse never overwrites the reader's choice.** When the window widens, the region returns to what the reader last chose; a toggle pressed at a narrow width opens an overlay without changing the stored preference (Atlassian: opening the side nav manually there "will open it as an overlay").
- **An overlay region closes on Escape** and returns focus to its toggle, and has a close control; Material's Android docs require Escape for drawers. An inline region does not close on Escape: Escape inside an inspector belongs to the field being edited.
- **Hover-to-open is an extra.** Atlassian opens a collapsed side nav as a flyout on hovering its toggle and keeps it open while a menu inside is open (layout examples); a click always works, and the flyout is hoverable and dismissable (1.4.13).
- **Motion short, none under reduced motion.** Slide an overlay with `transform`; change an inline region's width instantly, since animating it reflows the work every frame (Atlassian changes instantly in Firefox, which shows instant is acceptable). Keep the region in the DOM until its exit ends, then hide it (Atlassian's `ExitingPersistence`, layout usage).
- **Widths: one per region, from a short list.** shadcn's sidebar is 16rem (256px) wide, 3rem (48px) as an icon rail, its rows 32px (`h-8`) ([shadcn sidebar source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/ui/sidebar.tsx)); Primer's pane starts at 256px minimum (above); Framer's plugin windows default to 240px ([Framer plugin interface](https://www.framer.com/developers/interface)). A dense tool's navigation sidebar and its inspector take 240 to 320px, one value each, the same on every screen; no primary source publishes Figma UI3's panel widths. Figma keeps its panels "fixed, but still resizable" after floating ones "cramped the canvas" ([Figma, our approach to UI3](https://www.figma.com/blog/our-approach-to-designing-ui3/)); how a tool's chrome looks is [visual: quiet chrome in a dense tool](../design/visual.md#quiet-chrome-in-a-dense-tool).
- **A focus mode** that hides every region is one more toggle with its own shortcut, restoring each region's state on exit; VS Code's Zen mode is Cmd+K Z and leaves on Escape twice (default keybindings).

**Cases**
- The inspector's only toggle is an × in its own header, so once hidden only a menu brings it back → a toolbar button at the trailing edge, always present, with a shortcut; the × may stay.
- A toggle reads "Hide sidebar" and announces "Hide sidebar, expanded" → name it "Sidebar" with `aria-expanded`; Show and Hide text belongs on a menu command.
- The reader presses the inspector's shortcut while typing in one of its fields and focus disappears → focus moves to the inspector's toggle.
- The window narrows to 900px, the sidebar collapses, the window widens and the sidebar stays collapsed → an automatic collapse never wrote the preference; it reopens.
- A tool palette and an inspector open as two trailing columns and the canvas shrinks to 300px → one trailing region with tabs, or the palette moves into the toolbar.
- Opening the notifications panel leaves the help panel open beneath it → overlays one at a time.
- Hidden regions sit off screen and still take Tab → `hidden`, or `inert` during the exit animation and then `hidden`.
- The inspector, resized to 420px, comes back at 320px after a hide → the width survives a hide.

**Accessibility**
- 4.1.2 Name, Role, Value (each toggle a named button exposing its state), 2.4.3 Focus Order (focus is never lost when a region hides), 2.1.1 Keyboard, 2.1.4 Character Key Shortcuts, 1.3.1 (each region a named landmark), 1.4.13 (a hover flyout), 2.4.11 Focus Not Obscured (an overlay never covers the focused item), 2.3.3 Animation from Interactions, 1.4.10 Reflow (at 320px each region is an overlay or stacked), 2.5.8 (toolbar toggles).
- Atlassian keeps landmarks in one DOM order, "banner, top nav, side nav, main, panel", because it "determines the keyboard tab order, screen reader reading order, and skip link order", each with a "unique, meaningful label" that does not repeat the role (layout usage). Carbon names its icon-only header buttons by default and shows the name on hover and focus ([Carbon header accessibility](https://carbondesignsystem.com/components/UI-shell-header/accessibility/)).

**Build**
- *Elements:* each region an `aside` (or `nav` for navigation) named by its heading; each toggle a `button` in the toolbar or header. An overlay form is a non-modal `dialog` or a popover at narrow widths, the same element restyled, not a second copy.
- *ARIA and keyboard:* the [APG disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) pattern: `aria-expanded`, optionally `aria-controls`, Enter and Space toggle. A toolbar of view toggles may use `aria-pressed` instead when the button sets a mode rather than revealing a region; one per product, never both on one button. Shortcuts are registered once at application level, each with a modifier, shown in the tooltip and as `aria-keyshortcuts`; a shortcut that hides a region holding focus moves focus to the toggle first.
- *States:* one attribute per region on the layout root (`data-inspector="shown|hidden"`), widths as custom properties (`--inspector-width`); the region `hidden` when hidden, `inert` while an exit runs. An automatic collapse sets a separate attribute (`data-inspector-fit="overlay"`) and never writes the stored value.
- *Rules:* code-standard rule 9 (shown and hidden are state attributes, not separate components), code-standard rule 17 (hidden leaves the tab order), code-standard rule 18 (icon-only toggles named), code-standard rule 20 (without script every region is shown; a render never writes the preference), code-standard rule 38 (widths through custom properties).
- *Detail:* [code: focus management](../../code/accessibility.md#focus-management), [code: keyboard shortcuts](../../code/accessibility.md#keyboard-shortcuts), [code: layout stability in code](../../code/performance.md#layout-stability-in-code), [code: reduced motion and colour scheme](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code).

**Check**
- *Script:* could press each region's toggle and assert `aria-expanded` matches visibility, the region is `hidden` and out of the tab order, and its visibility and width survive a reload with no layout shift; focus a field inside a region, fire the hide shortcut and assert focus is on the toggle; narrow the viewport past each declared width and assert the regions collapse in order, then widen and assert the stored choice returns; assert no unmodified character key is bound; open two overlay panels and assert one stays open.
- *Judgement:* Which regions does the reader need while doing the main task, and which gives way first when space runs out?

**Sources:** Apple HIG, VS Code, Atlassian's navigation system, Carbon UI shell, Fluent, Material components for Android, the APG and WCAG as linked. They agree that a hidden region keeps a way back on the window's chrome, that the layout remembers the choice, and that overlays come one at a time. They differ on the narrow form (Atlassian overlays below 1024px; [Primer PageLayout](https://primer.style/product/components/page-layout/) only hides per breakpoint) and on shortcuts. No source says where focus goes when a region holding it hides; the toolkit's rule above is derived from 2.4.3.

## Object header over a tool layout

**Use when / don't use**
- Use when a tool works on one object at a time (a component, a file, a record) and several views of it are tabs: the object's name, its actions and its tabs go in one header bar spanning the window above every column. Primer's PageLayout renders its header full width above the row that holds content and pane ([Primer PageLayout source](https://github.com/primer/react/blob/main/packages/react/src/PageLayout/PageLayout.tsx)), and its PageHeader "arranges elements that apply context and provide navigation for the current page", with an UnderlineNav in its navigation slot ([Primer PageHeader](https://primer.style/product/components/page-header/)). What applies to every tab sits above the tab line ([navigation: tabs](navigation.md#tabs)).
- Don't put the object's tabs inside one column (the work area or the inspector) when the tabs change what the other columns show; Apple: "Make sure the controls within a pane affect content only in the same pane" ([Apple tab views](https://developer.apple.com/design/human-interface-guidelines/tab-views)).
- Don't use the bar for app-wide navigation; that is the window's top bar or sidebar ([menus: top menu bar](menus.md#top-menu-bar)).

**How**
- **The bar never moves.** Its height, the name's position, the tabs and the actions are identical on every tab and every object; this is what "the controls just used stay put" protects (design-standard rule 2, [interaction: layout stability](../design/interaction.md#layout-stability)). An action that applies to only some tabs keeps its slot, disabled with its reason or left empty, never removed. NN/g: decide where shared elements "will live and make them consistent across all pages" ([NN/g consistency and standards](https://www.nngroup.com/articles/consistency-and-standards/)).
- **The columns under the bar are set per tab, declared, and fixed for that tab.** A tab whose content needs the width (a wide matrix, a dense table) takes the full width; the others keep the work area and the one trailing column. Polaris gives a full-width page "only when the content benefits from the available width, such as a dense data view", and its aside renders only on the base width ([Shopify, migrating from Polaris React](https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react)). NN/g's ideal is the opposite, "each in-page tab should have the same layout but with different data" ([NN/g tabs used right](https://www.nngroup.com/articles/tabs-used-right/)); the toolkit reconciles the two by keeping the bar and the tab line fixed and letting only what is under them change, once per tab, never within one.
- **One trailing column, the same on every tab that has it:** same side, same width, same toggle on the bar's trailing edge, where Apple's toolbar items "remain visible at all window sizes" ([Apple toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)). A full-width tab hides it as a layout of that tab, like an automatic collapse: the stored preference is untouched and the column returns on the next tab that has it ([above](#showing-and-hiding-panels-in-a-tool-layout)). The toggle stays in its slot on the full-width tab, disabled with its reason.
- **A live preview the person compares with the work is docked, not a drawer.** Fluent: "Use inline drawers when it's helpful to view and interact with main content and drawer content at the same time", an overlay one "to draw more attention to the content in the drawer" ([Fluent drawer](https://fluent2.microsoft.design/components/web/react/core/drawer/usage)); Atlassian: "don't present people with a task in a drawer if they need to reference the content in the UI behind the drawer" ([Atlassian drawer](https://atlassian.design/components/drawer/usage)). An overlay makes the person hold one side in memory, which NN/g names as the failure: the interface "requires them to keep in their working memory more than what their brains can hold" ([NN/g working memory](https://www.nngroup.com/articles/working-memory-external-memory/)). VS Code's "Open Preview to the Side" keeps editor and preview synchronised side by side ([VS Code Markdown](https://code.visualstudio.com/docs/languages/markdown)); Storybook's controls panel edits "and see the results in real-time" beside the canvas ([Storybook controls](https://storybook.js.org/docs/essentials/controls)). An overlay preview suits a glance after the work, not during it, or a narrow window where the docked form cannot fit.
- **A capped work area starts at the leading edge, or centres in the window, never in the space left over.** Centred in the remaining space, it jumps sideways each time a neighbouring region opens or closes: Primer centres capped content in whatever the pane leaves and marks the gap in its own source ("TODO: Account for pane width when centering content", [Primer PageLayout CSS](https://github.com/primer/react/blob/main/packages/react/src/PageLayout/PageLayout.module.css)). VS Code makes centring an opt-in "useful when working with a single editor on a large monitor" ([VS Code user interface](https://code.visualstudio.com/docs/getstarted/userinterface)); Atlassian's main area "will expand to fill available space" ([Atlassian layout examples](https://atlassian.design/components/navigation-system/layout/examples)). Centre only a work area nothing opens beside, such as a reading column or a canvas the person pans.

**Cases**
- The object's tabs sit inside the work column and the inspector beside them changes with each tab → move name, actions and tabs into one bar across the window; the inspector belongs to the tab.
- A Variants tab needs the full width for its matrix and the inspector squeezes it to 500px → the tab is declared full width; the inspector's toggle stays in its slot, disabled with "Not used on Variants", and the inspector returns on the next tab.
- A Delete action appears only on two tabs and the tabs shift left on the others → keep its slot on every tab.
- A live preview opens as an overlay drawer over the editor, and the person toggles it to compare each change → dock it as the trailing column, or split the work area.
- A centred 960px editor slides 160px when the inspector opens → anchor it to the leading edge, or centre it in the window and let the inspector cover margin only.

**Accessibility**
- 1.3.1 (the bar a `header` or labelled region, the tabs one tab set), 2.4.3 Focus Order (bar, then work, then trailing column, in one DOM order whatever a tab shows), 3.2.3 Consistent Navigation (the bar's controls in the same order on every tab), 3.2.2 On Input (choosing a tab never moves focus off it).

**Build**
- *Elements:* the bar a `header` inside `main`'s parent, holding the object's `h1`, its actions and the tab set (links with `aria-current` when tabs change the address, an APG tab set otherwise, [navigation: tabs](navigation.md#tabs)); under it a grid whose columns come from the current tab.
- *States:* the layout root carries `data-tab="variants"` and a per-tab layout attribute (`data-layout="full|with-inspector"`) set from one table of tabs, never computed by each tab; the trailing column's stored preference is a separate attribute the layout attribute only overrides.
- *CSS:* `grid-template-columns` switches on the layout attribute; a capped work area uses `max-inline-size` with `margin-inline-end: auto`, or is centred against the window with a fixed inset, never `margin-inline: auto` inside a column that changes width; the bar's height and the tab line from custom properties, so no tab can move them.
- *Rules:* code-standard rule 9 (layout per tab is a state attribute), code-standard rule 14 (a tab switch keeps the bar and focus in place), code-standard rule 38 (widths through custom properties); design-standard rule 2's check measures the tab list across switches.

**Check**
- *Script:* tools/ui-check/check.mjs measures design-standard rule 2's tab list across switches; it could extend to every control in the bar, assert the trailing column's width is equal on every tab that shows it, and toggle each region asserting the work area's leading edge moves by no more than `interface.shiftTolerance` when it is anchored.
- *Judgement:* Which tabs need the full width, and is that declared? Does the person compare the preview with the work while editing it?

**Sources:** Primer, Polaris, Apple, NN/g, Fluent, Atlassian, VS Code and Storybook as linked. No source states the object-header-over-columns layout as a rule; Primer's markup and Polaris's per-page width are the evidence, and Shopify's own community asks how to render full-width content above an aside. NN/g prefers one layout across tabs; the toolkit fixes the bar and lets the layout under it vary per tab. No source rules on centring against shifting regions; the anchored rule derives from design-standard rule 2, and Primer's TODO shows the problem is real.

## App sidebar: header, body and footer

**Use when / don't use**
- Use the three regions in a tool whose sidebar is its main navigation: a dashboard, an admin, a workspace product. NN/g: "Place vertical navigation on the left and use a noticeable design" ([NN/g vertical navigation](https://www.nngroup.com/articles/vertical-nav/)).
- Don't give a documentation sidebar a header and footer of controls: its job is the section's pages, and the account and site controls belong in the top bar ([menus: top menu bar](menus.md#top-menu-bar)).

**How**
- **Header, sticky at the top:** who and where: the workspace switcher ([below](#workspace-switcher)) or the product's name. shadcn's sidebar: "Sticky at the top; use for branding, titles, or workspace switchers" ([shadcn sidebar](https://ui.shadcn.com/docs/components/sidebar)).
- **Body, the only part that scrolls:** the primary pages first, then the reader's own (pinned items, recent, projects), then groups with a visible label each. NN/g: "In long menus, place less-important ones at the bottom".
- **Footer, sticky at the bottom:** the account menu ([menus: account menu](menus.md#account-menu)), and settings or help when they are not inside it; shadcn: "use for user menus, settings, or actions". An upgrade prompt, if any, sits here and never between pages.
- **Depth:** two tiers in the sidebar at most; Carbon's left panel "does not support three tiers of navigation", and a third tier is tabs on the page ([Carbon UI shell left panel](https://carbondesignsystem.com/components/UI-shell-left-panel/usage/); [navigation: tabs](navigation.md#tabs)).
- **One account control per product:** where the sidebar's footer holds the account menu there is none top-right, and the other way round. Both placements are common (shadcn and Notion at the bottom; Carbon, GitHub and Vercel top-right); pick one and keep it on every page.

**Cases**
- The account menu sits top-right and again in the sidebar footer → keep one.
- "Upgrade" sits between "Reports" and "Settings" → move it to the footer; a sales prompt is not a page.
- The whole sidebar scrolls and the switcher scrolls away → header and footer stay put, the body scrolls.
- A group of eight projects has no label → give it a heading the reader can scan.

**Accessibility**
- 2.4.6 (group labels describe their group), 2.4.8 Location (AAA, worth meeting: the current page and workspace are both in view), 3.2.3 Consistent Navigation (the regions are in the same order on every page), 1.3.1 (groups are structure, not only spacing).

**Build**
- *Elements:* an `aside` holding a `header`, a `nav` with `aria-label` for the body, and a `footer`; each group a heading followed by a `ul` of `a`. The switcher and the account menu are `button`s outside the `nav`, because they are not pages.
- *ARIA and keyboard:* the body's links are links, with `aria-current="page"` on the current one; the header's and footer's buttons are menu buttons ([APG menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)), since what they open is a list of commands and choices. A collapsible group follows [nesting and expandable groups](#nesting-and-expandable-groups).
- *States:* `aria-current` on the page link; the collapsed state as in [collapsible sidebar and icon rail](#collapsible-sidebar-and-icon-rail).
- *Rules:* code-standard rule 64 (the current page carries `aria-current`), code-standard rule 18 (an avatar-only or icon-only trigger is named), code-standard rule 5 (the sidebar's styles stop at its own edge).
- *Detail:* [code: landmarks](../../code/html-semantics.md#landmarks), [code: navigation markup](../../code/html-semantics.md#navigation-markup).

**Check**
- *Script:* could scroll the sidebar's body and assert the header and footer stay in view, and that the account menu appears once per page.
- *Judgement:* Is everything in the body a page, and everything in the header and footer about who and where?

**Sources:** shadcn, NN/g and Carbon as linked. The placement of the account menu varies across products; the toolkit asks for one place, not a particular one.

## Workspace switcher

**Use when / don't use**
- Use when one sign-in reaches several separate tenants (workspaces, organisations, teams), each with its own members and data. Linear: "You can create multiple workspaces in Linear under a single account" ([Linear workspaces](https://linear.app/docs/workspaces)).
- Don't use it for separate identities: a second email is a second account ([authentication: switching accounts](authentication.md#switching-accounts)). Figma keeps the two apart: the team switcher by the organisation's name, and account switching in the account menu ([Figma switch accounts](https://help.figma.com/hc/en-us/articles/1500005165741-Switch-between-accounts)).
- Don't confuse it with a product switcher (Carbon's, the far-right icon in the header, moves between apps, not tenants: [Carbon UI shell header](https://carbondesignsystem.com/components/UI-shell-header/usage/)).

**How**
- **Place it top-left, on the current tenant's name:** Slack ("Click your workspace icon in the top left", [Slack](https://slack.com/help/articles/1500002200741-Switch-between-workspaces)), Linear, Vercel ("team switcher at the top left of the navigation bar", [Vercel](https://vercel.com/docs/accounts)) and Stripe ([Stripe](https://docs.stripe.com/get-started/account/multiple-accounts)) all do. Notion has moved it to the bottom of the sidebar ([Notion](https://www.notion.com/help/create-delete-and-switch-workspaces)); top-left is the common case.
- **The trigger shows the name,** with a logo or initial tile, and the plan or role where it matters; shadcn's team switcher shows logo, name and plan with an up-down chevron ([shadcn team switcher](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/blocks/sidebar-07/components/team-switcher.tsx)). An icon alone asks people to learn it.
- **The list:** every tenant with the current one marked; then a separator and "Create workspace" or "Join". Past about ten, a search field filters it. Keyboard shortcuts by position (shadcn's ⌘1…; Notion's Ctrl+Shift+number) serve daily users.
- **Make the tenant hard to mistake:** its name in the page title and the header, and where the stakes differ (production and test, a client's and your own) a colour in the chrome; AWS lets an account carry a colour shown in the console's navigation bar for "quick visual identification" ([AWS account colour](https://aws.amazon.com/about-aws/whats-new/2025/08/aws-management-console-assigning-color-aws-account)). Colour supports the name; it never replaces it.
- **The tenant is in the address** (`/acme/projects`), so a link opens in the right one, a reload keeps it and two tabs can show two tenants. A default tenant is where sign-in lands; Vercel calls it the default team ([Vercel](https://vercel.com/docs/accounts)).
- **Two levels, organisation and workspace, are two controls.** Where the top level is a boundary of members, billing or security, it is switched apart from the level inside it, and the menu shows one organisation's workspaces at a time: Supabase has an organisation picker in the header and "only the Projects for that" organisation in view ([Supabase dashboard navigation](https://supabase.com/changelog/33670-upcoming-breaking-change-to-dashboard-navigation)); Azure switches directory in its own pane and filters subscriptions within it ([Azure portal preferences](https://learn.microsoft.com/en-us/azure/azure-portal/set-preferences)); Google Cloud's project picker puts the organisation in a drop-down that scopes the list ([Google Cloud folders](https://docs.cloud.google.com/resource-manager/docs/manage-folders)); Atlassian lists organisations in a column beside the sites they own ([Atlassian switcher](https://support.atlassian.com/platform-experiences/docs/how-to-switch-between-apps-and-organizations/)). Three shapes follow: a pair of switchers side by side (*Organisation / Workspace*, each its own menu), a two-pane popover (organisations left, the chosen one's workspaces right), or the organisation switched on its own page. Mixing organisations and workspaces as rows of one list is what products built for jumping straight to a leaf do (Railway groups projects by team, [Railway](https://railway.com/changelog/2022-12-09-project-nav); Notion lists every workspace for the email); it blurs which boundary the reader is crossing.
- **Choosing another organisation lands on its last-used workspace,** or its default: Supabase returns to "your last active organization", Azure offers "Last visited", and Clerk's switcher leaves the landing to the app ([Clerk OrganizationSwitcher](https://clerk.com/docs/react/reference/components/organization/organization-switcher)).
- **Create where it belongs:** "New workspace" in the workspace menu, scoped to the current organisation by its label or place; "New organisation" with the organisations (Clerk) or in the account menu (Neon, [Neon organisations](https://neon.com/docs/manage/orgs-manage)), never as a peer of either.
- **The trigger shows the tenant, never a person.** A person avatar is the account's ([menus: account menu](menus.md#account-menu)); a company shows its logo or a lettermark. Atlassian's users could not tell "which organisation's home page they are logged in to" until they opened the switcher ([ATLAS-234](https://jira.atlassian.com/browse/ATLAS-234)).
- **No switcher when there is nothing to switch:** the Ministry of Justice's organisation switcher: "Do not use this component if the user has access to only one organisation" ([MoJ organisation switcher](https://design-patterns.service.justice.gov.uk/components/organisation-switcher)); the name stays, the chevron goes.
- **On switch:** go to the same page in the target when it exists there (Projects to Projects), otherwise to its home; warn first if unsaved work would be lost ([UX: state persistence and restore](../design/ux.md#state-persistence-and-restore)). No public source states this; it follows from *people in control, mistakes forgiven*.

**Cases**
- The trigger is an unlabelled logo → show the name beside it.
- The list does not mark the current tenant → mark it, as a checked item, not only by bold.
- Staging and production look identical and someone deletes in the wrong one → the tenant's name in the title and a colour band in the header, with destructive dialogs naming the tenant ([interaction](../design/interaction.md)).
- One menu lists the current company's workspaces, then "Other companies" as more rows, then "New workspace" → the company is its own control (a second switcher, a left pane, or a page), "New workspace" is labelled for the current company, and the trigger carries the company's logo, not a person icon.
- A trigger that looks like a switcher opens nothing (Railway's users "go back to dashboard" to switch, [Railway feedback](https://station.railway.com/feedback/tiny-but-worthy-ux-improvement-4da96a37)) → it opens the switcher, or carries no chevron.
- Switching drops the reader on the new tenant's home from a deep page that exists there too → keep the page.
- Switching changes tenant on a `select`'s change → a menu of choices; a change of context waits for an explicit choice ([W3C Understanding 3.2.2](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html)).

**Accessibility**
- 3.2.2 On Input (choosing a tenant is an explicit action, never a side-effect of moving through a list), 1.4.1 (the tenant colour is never the only cue), 2.4.2 Page Titled (the tenant's name in the title is good practice, not a requirement: [W3C](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html)), 4.1.2, 2.4.7.
- A switch that loads a new page needs no announcement; one that updates in place announces the new tenant in a status message ([W3C Understanding 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)).

**Build**
- *Elements:* a `button` showing the tenant's name; each tenant a link to its address, so it opens in a new tab like any link; "Create workspace" a link or a button.
- *ARIA and keyboard:* a short list is an [APG menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) with `menuitemradio` items, the current one `aria-checked="true"` ([APG menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)); a searchable list is an [APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) with a listbox, focus staying in the field. Escape closes and returns focus to the trigger.
- *States:* `aria-expanded` on the trigger; `aria-checked` on the current tenant; a long name truncated with the full name as the item's accessible name.
- *Rules:* code-standard rule 18 (a logo-only trigger is named), code-standard rule 20 (each tenant is a link that works without script; the tenant is read from the address, never stored during render).
- *Detail:* [code: state in the address and history](../../code/javascript.md#state-in-the-address-and-history), [menus: navigation dropdowns](menus.md#navigation-dropdowns).

**Check**
- *Script:* could open the switcher and assert the current tenant is checked, each item's address names its tenant, the page title carries the tenant's name, and a switch from a page that exists in both lands on that page.
- *Judgement:* Could someone act in the wrong tenant without noticing?

**Sources:** Linear, Slack, Vercel, Stripe, Notion, Figma, AWS, Supabase, Azure, Google Cloud, Atlassian, Clerk, Railway, Neon, the Ministry of Justice, shadcn, Carbon, W3C and APG as linked. Sources split on two levels: products built for jumping to a leaf (Vercel's cross-team favourites, Railway, Notion) mix organisations and workspaces; products where the organisation is a billing or security boundary keep it apart, which the toolkit follows. None states truncation, widths or which level is more prominent. Material 3, Polaris, Fluent 2 and Primer were sought and gave no loadable guidance on switchers.
