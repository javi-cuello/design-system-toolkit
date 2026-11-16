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
- [contested] **One tab set per region, never tabs inside a tab panel.** A switch inside a tab's content, or inside an inspector, is a segmented control or a select: Apple: "Use a tab view in the main window area — instead of a segmented control — for view switching… Consider using a segmented control to help people switch views in a toolbar or inspector pane" ([Apple segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)); Apple also caps a tab view: "Avoid providing more than six tabs" ([Apple tab views](https://developer.apple.com/design/human-interface-guidelines/tab-views)). Material allows secondary tabs "within a content area to further separate related content" ([Material tabs, Android docs](https://github.com/material-components/material-components-android/blob/master/docs/components/Tabs.md)); the toolkit does not, because two underlined tab rows read as one set with two current items.
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

**Sources:** Atlassian, Carbon, GOV.UK, Primer, W3C APG as linked; [eBay MIND fake tabs](https://ebay.gitbook.io/mindpatterns/navigation/fake-tabs) agrees that page-loading tabs are a list of links. GOV.UK's tabs update the URL fragment while staying a tab panel; the toolkit follows Primer and eBay: if the tab is in the address, it is navigation. GOV.UK warns its tabs component "has not yet been tried in research with users"; the toolkit uses tabs only where design-standard rule 3 allows them. Apple and Material disagree on secondary tabs; the toolkit takes Apple's segmented control for any switch inside a tab. This section owns tabs; other pages link here.

## In Figma

**Layers**
- [contested] Link tabs and panel tabs are separate Figma sets, as they are separate components in code ([*In code*](#in-code) weighs the split): `Tabs` and `Tab` for panel tabs, `Link tabs` and `Link tab` for link tabs, drawn alike, so a designer picks the one whose markup the screen needs (figma-standard rule 9).
- [required] Each kind has two components: the item (`Tab`), and the row (`Tabs`), which holds its tabs in a slot named `Tabs slot`, never as nested instances with text overrides: a tab has a Selected variant, and an override inside a nested instance is dropped when it switches (figma-standard rules 21 and 38). The Simple Design System's `Tabs` takes its `Tab` instances as children the same way ([SDS Tabs.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/tab/Tabs.figma.ts)).
- [required] Auto layout throughout; the label hugs, the row hugs or fills, and each layer is named for its role: `Label`, `Icon`, `Count`, `Indicator` (figma-standard rules 10 and 33).
- [required] The icon leads the label as `Leading`, never `Left`, so a mirrored row keeps its names true (figma-standard rule 21).

**Properties**
- [required] `Label` is a text property; the icon is an instance swap `Icon` with `Show icon` directly above it, and the count a text property `Count` with `Show count` above it (figma-standard rules 5, 21 and 37).
- [required] Every property drives a layer in every variant where that layer exists (figma-standard rule 30).

**Variants and states**
- [required] On the item, the axes run `Size → Selected → Disabled → State`; `Selected` is a True/False variant, a bare word, `False` first (figma-standard rules 1 and 21).
- [required] `State` runs `Rest → Focus → Hover → Press`; each draws differently from Rest and Focus shows a ring; `Disabled` pairs only with Rest (figma-standard rules 2, 4, 31 and 39).
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

## In code

**Element**
- [required] Link tabs are links in a `nav`, with no script; panel tabs are the behaviour-heavy kind, since HTML has no tab element (code-standard rule 8). The markup of each is [tabs](#tabs).

**Props**
- [strong] The row takes the selected value, the orientation and the activation mode: React Aria's `keyboardActivation`, Carbon's `activation: 'automatic' | 'manual'` and MUI's `selectionFollowsFocus` ([React Aria Tabs](https://react-aria.adobe.com/Tabs), [Carbon Tabs source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Tabs/Tabs.tsx), [MUI Tabs types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Tabs/Tabs.d.ts)). Automatic is the default where panels show without delay ([APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)).
- [strong] A tab takes its label, an icon, a count and `disabled`: MUI (`label`, `icon`, `disabled`), Primer (`icon`, `counter`) and SDS (the label as children).
- [contested] Link tabs and panel tabs as one component or two: Primer ships two; React Aria lets a `Tab` take an `href` inside one `Tabs` ([React Aria Tabs: Links](https://react-aria.adobe.com/Tabs)). The toolkit keeps them apart and never mixes them in one set ([tabs](#tabs)).

**From Figma**
- [required] Each Figma axis maps to one attribute or prop, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Tabs slot` | the tabs, children of the list |
  | `Label`, `Icon` | the tab's label and leading icon, `aria-hidden="true"` |
  | `Count` | the count, a description, not part of the name (code-standard rule 15) |
  | `Size` | `size` |
  | `Selected=True` | `aria-selected="true"` on a panel tab, `aria-current="page"` on a link tab |
  | `Disabled=True` | `disabled` on a panel tab; a link tab without `href`, `aria-disabled="true"` |
  | `State=Hover`, `Press` | `:hover`, `:active`, set by the browser |
  | `State=Focus` | `:focus-visible` |

**Check**
- *Script*: the parity loop compares each variant with its frame (design-code-parity); tools/ui-check/check.mjs runs design-standard rules 2 and 3 on the row.
- *Judgement*: after a switch, is focus still on the tab and is the row where it was?

**Sources.** React Aria, Carbon and MUI for the activation prop; Primer, MUI and SDS for the tab's props; Primer and React Aria for the split; the APG for automatic activation.
