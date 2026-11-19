# Tabs

Tabs switch between views of one context without leaving it: a row of labels over the view they choose. This page owns tabs as a component, in design, in Figma and in code: when to use them, link tabs and panel tabs, one row that scrolls, and the keyboard model. What spans components stays in the pattern pages: in-page navigation and back behaviour in [`../patterns/navigation.md`](../patterns/navigation.md), and tabs or an accordion on a small screen in [disclosure: tabs or accordion on small screens](../patterns/disclosure.md#tabs-or-accordion-on-small-screens). Related: [segmented control](segmented-control.md), [accordion](accordion.md), [link](link.md), [sidebars](../patterns/sidebars.md).

## Overview

**Use when / don't use**
- [contested] Two components share the look and never the markup: link tabs, which change the address, and panel tabs, which swap a panel on the page ([tabs](#tabs); the split is weighed in [*In code*](#in-code)). Primer ships them apart, as `UnderlineNav` (links with `aria-current`) and `UnderlinePanels` (a `tablist`) ([UnderlineNav item source](https://github.com/primer/react/blob/main/packages/react/src/UnderlineNav/UnderlineNavItem.tsx), [UnderlinePanels source](https://github.com/primer/react/blob/main/packages/react/src/experimental/UnderlinePanels/UnderlinePanels.tsx)).
- [contested] A switch inside a tab, a toolbar or an inspector is a [segmented control](segmented-control.md), never a second row of tabs ([tabs](#tabs)).

**Anatomy**
- [strong] A tab list holding the tabs, each a label with an optional leading icon and count, an indicator under the selected tab, and the panel (or, for link tabs, the page) below. MUI's Tab (`label`, `icon`), Primer's (`icon`, `counter`) and Figma's Simple Design System (`Label`) build it so ([MUI Tab types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Tab/Tab.d.ts), [UnderlinePanels source](https://github.com/primer/react/blob/main/packages/react/src/experimental/UnderlinePanels/UnderlinePanels.tsx), [SDS Tab.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/tab/Tab.figma.ts)).
- [required] A focus ring on the focused tab, and each tab a target of at least 24 by 24 CSS pixels (WCAG 2.4.7 and 2.5.8; figma-standard rules 26 and 39).

## Tabs

**Use when / don't use**
- [strong] Use to switch between views of one context: different, independent content the reader does not need side by side ([Atlassian tabs](https://atlassian.design/components/tabs/usage), [Carbon tabs](https://carbondesignsystem.com/components/tabs/usage/)). Design-standard rule 3 owns this.
- [moderate] Don't use them to filter one list (that is the filter bar under them), for steps in a process, for content the reader must compare across tabs, or for reading in order ([GOV.UK tabs](https://design-system.service.gov.uk/components/tabs/)).
- [weak] Don't use them as a second global navigation bar.

**How**
- [required] **One row, never wrapping.** Overflow scrolls horizontally (design-standard rule 3); Fluent moves overflow into a menu, Carbon scrolls with arrows. Keep the count low; Carbon says eight or fewer at large breakpoints.
- [strong] **Links or panels.** If activating a tab changes the address, the tabs are links styled as tabs, with `aria-current` on the current one; if it only swaps a panel on the same page, it is an ARIA tab set. Never mix the two in one set ([Primer navigation](https://primer.style/product/ui-patterns/navigation/)).
- [weak] **Placement.** What applies to every tab sits above the tab line; what belongs to the chosen tab sits under it ([Atlassian](https://atlassian.design/components/tabs/usage)).
- [weak] **First tab** is the one most readers want ([GOV.UK](https://design-system.service.gov.uk/components/tabs/)).
- [required] **Stability.** Switching never moves the tabs or the bar under them (design-standard rule 2). In a tool where the columns change per tab, the tabs live in the object's header bar above every column ([sidebars: object header over a tool layout](../patterns/sidebars.md#object-header-over-a-tool-layout)).
- [strong] **Keyboard** for a panel tab set ([W3C APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)): one tab stop, arrows move and wrap, automatic activation when panels are instant, manual (Enter or Space) when they load slowly. Link tabs are ordinary links in the tab order.
- [contested] **Tabs inside a tab panel.** A switch inside a tab's content, or inside an inspector, is a segmented control or a select: Apple: "Use a tab view in the main window area — instead of a segmented control — for view switching… Consider using a segmented control to help people switch views in a toolbar or inspector pane" ([Apple segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)); Apple also caps a tab view: "Avoid providing more than six tabs" ([Apple tab views](https://developer.apple.com/design/human-interface-guidelines/tab-views)). Material allows secondary tabs "within a content area to further separate related content" ([Material tabs, Android docs](https://github.com/material-components/material-components-android/blob/master/docs/components/Tabs.md)).
- [required] A count on a tab ("Open (12)") follows design-standard rule 11's counting.

**Cases**
- Tabs pick which library file an audit screen shows, and the file is in the address → build them as links with `aria-current`, so Back and a shared link restore the file.
- A designer puts "All / Errors / Warnings" as tabs over one table → those are filter values: a segmented facet in the filter bar (design-standard rule 4).
- Nine tabs at 768px wrap to two rows → make the row scroll (design-standard rule 3); tabs on two rows no longer read as one set.
- One tab set has three tabs that navigate and one that opens a panel → split them: the panel becomes a section of the page, or every tab navigates.
- An object's Variants tab holds its own row of Light / Dark / Compact tabs → a segmented control in the tab's toolbar; one tab set per region.
- A tab hides an action column only some files have, and the tabs jump → [interaction: layout stability](../design/interaction.md#layout-stability).

**Accessibility**
- [required] 2.1.1 Keyboard, 4.1.2 Name, Role, Value (`tablist`, `tab`, `tabpanel`, `aria-selected`, or links with `aria-current`), 2.4.7 Focus Visible, 1.4.10 Reflow (scrolling tabs keep the focused one in view), 2.4.11 Focus Not Obscured.
- [required] Implementation: code-standard rule 64 (link tabs), code-standard rule 14 (a live panel swap keeps the reader's place), code-standard rule 20 (link tabs work without script), code-standard rule 21. Figma: figma-standard rules 26, 31 and 32.

**Build**
- [required] **Link tabs** (the address changes): a `nav` of links styled as tabs, `aria-current="page"` on the current one; they need no script (code-standard rule 20, code-standard rule 64; [HTML semantics: *Navigation markup*](../../code/html-semantics.md#navigation-markup)).
- [strong] **Panel tabs** (one page): `role="tablist"`, `tab` buttons with `aria-selected` and `aria-controls`, `tabpanel`s labelled by their tab, roving tabindex and arrow keys per the [APG tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/); the handler and the no-script form are [accessibility: *Composite widgets and roving tabindex*](../../code/accessibility.md#composite-widgets-and-roving-tabindex).
- [strong] Never both in one set: a `tablist` holds no `a[href]`.
- [required] One row that scrolls: `display: flex; overflow-x: auto` on the list, and the selected tab scrolled into view with `scrollIntoView({ block: 'nearest', inline: 'nearest' })` after a switch (design-standard rule 3).
- [required] Selected is styled from `[aria-selected="true"]` or `[aria-current]`, so look and state are one fact ([css-architecture: *Selectors that stay cheap and local*](../../code/css-architecture.md#selectors-that-stay-cheap-and-local)).
- [required] One tabs module for the site, included where needed (code-standard rule 36); a panel swap keeps focus on the tab (code-standard rule 14).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 3 (tabs keep one row and scroll) and design-standard rule 2 (the tab list holds its position after each switch). Could check that a tab set does not mix `role="tab"` and `a[href]`, and that only one tab is current.
- *Judgement:* is each tab independent content, or is it a filter or a step in disguise?

**Sources:** Atlassian, Carbon, GOV.UK, Primer, W3C APG as linked; [eBay MIND fake tabs](https://ebay.gitbook.io/mindpatterns/navigation/fake-tabs) agrees that page-loading tabs are a list of links. GOV.UK's tabs update the URL fragment while staying a tab panel; Primer and eBay treat a tab in the address as navigation. GOV.UK warns its tabs component "has not yet been tried in research with users"; design-standard rule 3 says where tabs are allowed. Apple and Material disagree on secondary tabs. This section owns tabs; other pages link here.

## In Figma

**Layers**
- [contested] Link tabs and panel tabs are separate Figma sets, as they are separate components in code ([*In code*](#in-code) weighs the split): `Tabs` and `Tab` for panel tabs, `Link tabs` and `Link tab` for link tabs, drawn alike, so a designer picks the one whose markup the screen needs (figma-standard rule 9).
- [required] Each kind has two components: the item (`Tab`), and the row (`Tabs`), which holds its tabs in a slot named `Tabs slot`, never as nested instances with text overrides: a tab has a Selected variant, and an override inside a nested instance is dropped when it switches (figma-standard rules 21 and 38). The Simple Design System's `Tabs` takes its `Tab` instances as children the same way ([SDS Tabs.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/tab/Tabs.figma.ts)).
- [required] Auto layout throughout; the label hugs, the row hugs or fills, and each layer is named for its role: `Label`, `Icon`, the count (named as its property, below), `Indicator` (figma-standard rules 10 and 33).
- [required] The icon leads the label as `Leading`, never `Left`, so a mirrored row keeps its names true (figma-standard rule 21).

**Properties**
- [required] `Label` is a text property; the icon is an instance swap `Icon` with `Show icon` directly above it (figma-standard rules 5, 21 and 37).
- [weak] The count is a text property named as the code's prop with its `Show` boolean above it: `Counter` and `Show counter` for Primer's `counter`, the bare noun `Count` where the code has no prop (figma-standard rules 5, 21 and 37). Primer's kit draws the count as a nested `CounterLabel` instance whose `text` its Code Connect reads into `counter`, behind a `counter?` boolean on the panel tab, where figma-standard rule 21 departs ([Primer UnderlinePanels.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/experimental/UnderlinePanels/UnderlinePanels.figma.tsx), [Primer UnderlineNav.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/UnderlineNav/UnderlineNav.figma.tsx)).

**Variants and states**
- [required] On the item, the axes run `Size → Selected → Disabled → State`; `Selected` is a True/False variant, a bare word, `False` first (figma-standard rules 1 and 21).
- [required] `State` runs `Rest → Focus → Hover → Press`; each draws differently from Rest and Focus shows a ring; `Disabled` pairs only with Rest, and with Focus too where the code keeps it focusable (figma-standard rules 2, 4, 31 and 39).
- [moderate] Selection lives on each `Tab`, not on the row: a component cannot change the variant of what fills its slot, so a frame can hold two selected tabs and the designer keeps one. The toolkit's state-axis research records the same trade for Primer's `SegmentedControl.Button` (*What the State axis models*, research folder; figma-standard rule 38).
- [required] Sizes, where the tabs have them, are `Size` with t-shirt values, largest first (figma-standard rule 6).

**Tokens**
- [required] Every fill, stroke, padding and gap is bound to a semantic variable, never a primitive; the label takes a text-role token (figma-standard rules 24, 28 and 29).
- [required] Selected and each state bind their own tokens, the indicator's included (figma-standard rule 48).
- [required] Where the project has component tokens, they are named `Component/Tab/<Element>/<property>[-<variant>][-<state>]` and alias semantic ones (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on every set.
- *Judgement*: at the narrowest frame the product draws, does the row scroll on one line, with the selected tab in view?

**Sources.** Figma's Simple Design System for the two components and the slot; Primer and MUI for the item's parts; the toolkit's state-axis research for where Selected lives.

## Alignment with code

**Structure**
- [strong] Panel tabs are compound in code, a root, a list, the tabs and the panels: Radix's `Root`, `List`, `Trigger` and `Content` ([Radix Tabs source](https://github.com/radix-ui/primitives/blob/main/packages/react/tabs/src/tabs.tsx)), React Aria's `Tabs`, `TabList`, `Tab` and `TabPanel` ([React Aria Tabs source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Tabs.tsx)), which SDS wraps ([SDS Tab.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Tab/Tab.tsx)), and Carbon's `Tabs`, `TabList`, `Tab`, `TabPanels` and `TabPanel` ([Carbon Tabs source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Tabs/Tabs.tsx)). MUI's core ships only `Tabs` and `Tab`, its panels in `@mui/lab` ([MUI Lab TabPanel](https://github.com/mui/material-ui/blob/master/packages/mui-lab/src/TabPanel/TabPanel.tsx)).
- [strong] Figma mirrors the list and the tab, never the panel: SDS's `Tabs` connects to a `TabList` of its `Tab` children and writes one placeholder `TabPanel` ([SDS Tabs.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/tab/Tabs.figma.ts)), Carbon's says its panels are "not mapped in Figma" ([Carbon Tabs.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Tabs/Tabs.figma.ts)), and Primer's `UnderlinePanels` maps only its tabs ([Primer UnderlinePanels.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/experimental/UnderlinePanels/UnderlinePanels.figma.tsx)). So `Tabs` and `Tab` here are the list and the tab; the panel is the screen's content.
- [moderate] Where code splits a kind of tab into its own component, the kit gives it its own mapping: Primer's link tabs (`UnderlineNav`, `aria-current`) and panel tabs (`UnderlinePanels`) each have one ([Primer UnderlineNav.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/UnderlineNav/UnderlineNav.figma.tsx)), as this page's two kinds do ([In Figma](#in-figma)); Carbon's kit draws an icon-only tab as `Type=Icon only`, which maps to its separate `IconTab` ([Carbon Tab.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Tabs/Tab.figma.ts)).

**Mapping**
- [required] Each Figma axis maps to one attribute or prop, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Tabs slot` | the tabs, children of the list |
  | `Label`, `Icon` | the tab's label and leading icon, `aria-hidden="true"` |
  | `Counter` or `Count` | Primer's `counter`, or the count; a description, not part of the name (code-standard rule 15) |
  | `Size` | `size` |
  | `Selected=True` | `aria-selected="true"` on a panel tab, `aria-current="page"` on a link tab |
  | `Disabled=True` | `disabled` on a panel tab; a link tab without `href`, `aria-disabled="true"` |
  | `State=Hover`, `Press` | `:hover`, `:active`, set by the browser |
  | `State=Focus` | `:focus-visible` |

**States**
- [required] Hover, Press and Focus are set by interaction, never a prop: `:hover`, `:active` and `:focus-visible`, which React Aria, and SDS on it, report as `data-hovered`, `data-pressed` and `data-focus-visible` ([React Aria Tabs source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Tabs.tsx), [SDS tab.css](https://github.com/figma/sds/blob/main/src/ui/primitives/Tab/tab.css); code-standard rule 9).
- [strong] Selected on a panel tab is set by the row in code: Carbon's `selectedIndex`, MUI's `value` and Radix's `value`, against which each tab sets its own `aria-selected` ([Carbon Tabs source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Tabs/Tabs.tsx), [MUI Tabs source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Tabs/Tabs.js), [Radix Tabs source](https://github.com/radix-ui/primitives/blob/main/packages/react/tabs/src/tabs.tsx)). A link tab carries its own `aria-current`, as Primer maps its `state=selected` ([Primer UnderlineNav.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/UnderlineNav/UnderlineNav.figma.tsx)).
- [strong] Disabled is a prop on the tab (MUI's and Radix's `disabled`, React Aria's `isDisabled`), rendered as the native `disabled` by Radix and Carbon, so a disabled tab takes no focus or pointer state and no frame pairs it with one (figma-standard rule 2).
- [strong] Code reaches Selected with Focus every time the row is entered by keyboard: the selected tab is the row's one tab stop, Radix's roving `active` item, MUI's `activeItemId` and Carbon's `tabIndex` of 0 (sources as above). So `Selected=True, State=Focus` is a frame that must exist.
- [weak] Code also reaches Selected with Hover, and SDS gives it no style of its own (`[data-hovered]:not([data-selected])`, [SDS tab.css](https://github.com/figma/sds/blob/main/src/ui/primitives/Tab/tab.css)); a frame drawn identical to Selected Rest is then flagged by figma-standard rule 31, so either draw the hover or record the sameness under *Differences*.

**Differences**
- [moderate] Selection lives on each `Tab` here, and on the row in code: a component cannot set the variant of what fills its slot ([In Figma](#in-figma); figma-standard rule 38). The mapping row writes each tab's `aria-selected`, and the row's value is whichever tab the frame draws Selected.
- [moderate] The indicator is a layer in each tab here; MUI renders one indicator on the row that slides to the selected tab (its `indicator` slot, [MUI Tabs types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Tabs/Tabs.d.ts)), and SDS draws it as each tab's bottom border ([SDS tab.css](https://github.com/figma/sds/blob/main/src/ui/primitives/Tab/tab.css)). Either code matches the frame while the indicator sits on the selected tab's edge.
- [weak] `Size` is on the tab here and on the list in code: Carbon's `size` is a `TabList` prop, and Carbon's own kit draws `Size` on the tab too, its Code Connect reading it from the first nested tab ([Carbon Tabs.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Tabs/Tabs.figma.ts)); a row cannot set the variant of the tabs in its slot (figma-standard rule 38).
- [required] `Disabled` is a True/False variant before `State` (figma-standard rule 1), where Carbon's kit draws `State=Disabled` and Primer's folds `selected` into its `state` axis ([Carbon Tab.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Tabs/Tab.figma.ts), [Primer UnderlineNav.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/UnderlineNav/UnderlineNav.figma.tsx)); each maps to a boolean or an attribute, never to a state.

**Check**
- *Script*: the component contract lists every Figma axis and property of `Tab` and `Tabs` beside the props of the tab and the list; a row in one with no partner in the other, and no line under *Differences*, is a finding (design-code-parity).
- *Judgement*: does each frame say which tab the row's value selects, and is there a focused selected tab to build the keyboard entry from?

**Sources.** Radix, React Aria, Carbon, MUI, Primer and SDS source and Code Connect files as linked, read for the parts, where selection lives and the tab stop; figma-standard rule 38 for why selection sits on the tab in Figma.

## In code

**Element**
- [required] Link tabs are links in a `nav`, with no script; panel tabs are the behaviour-heavy kind, since HTML has no tab element (code-standard rule 8). The markup of each is [tabs](#tabs).

**Props**
- [strong] The row takes the selected value, the orientation and the activation mode: React Aria's `keyboardActivation`, Carbon's `activation: 'automatic' | 'manual'` and MUI's `selectionFollowsFocus` ([React Aria Tabs](https://react-aria.adobe.com/Tabs), [Carbon Tabs source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Tabs/Tabs.tsx), [MUI Tabs types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Tabs/Tabs.d.ts)). Automatic is the default where panels show without delay ([APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)).
- [strong] A tab takes its label, an icon, a count and `disabled`: MUI (`label`, `icon`, `disabled`), Primer (`icon`, `counter`) and SDS (the label as children).
- [contested] Link tabs and panel tabs as one component or two: Primer ships two; React Aria lets a `Tab` take an `href` inside one `Tabs` ([React Aria Tabs: Links](https://react-aria.adobe.com/Tabs)). Primer and eBay treat link tabs as navigation, a list of links ([tabs](#tabs)).

**Check**
- *Script*: the parity loop compares each variant with its frame (design-code-parity); tools/ui-check/check.mjs runs design-standard rules 2 and 3 on the row.
- *Judgement*: after a switch, is focus still on the tab and is the row where it was?

**Sources.** React Aria, Carbon and MUI for the activation prop; Primer, MUI and SDS for the tab's props; Primer and React Aria for the split; the APG for automatic activation.
