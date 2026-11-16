# Breadcrumbs

Breadcrumbs show where a page sits in the site: a trail of links from the top level down to the page being read. This page owns breadcrumbs as a component, in design, in Figma and in code: when a site needs them, the current page, the trail on small screens, and sideways breadcrumbs. What spans components stays in the pattern pages: in-page navigation and back behaviour in [`../patterns/navigation.md`](../patterns/navigation.md#back-behaviour), navigation dropdowns in [menus](../patterns/menus.md#navigation-dropdowns), local navigation in [sidebars](../patterns/sidebars.md#navigation-sidebar). Related: [link](link.md), [tabs](tabs.md), [menus](../patterns/menus.md).

## Overview

**Use when / don't use**
- [moderate] A site three or more levels deep, where readers arrive deep from search or a link; never for history or the steps of a journey ([breadcrumbs](#breadcrumbs)).
- [required] One component, the trail: each level places the [link](link.md) component in its standalone look, and the trail adds the list, the separators and the current page (figma-standard rule 53).

**Anatomy**
- [strong] A labelled `nav` holding an ordered list; each item a link to a level, separated from the next, and the last the current page. The APG, Carbon (`isCurrentPage`, a `nav` labelled "Breadcrumb") and Primer (`selected`, labelled "Breadcrumbs") build it so ([APG breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/), [Carbon BreadcrumbItem source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Breadcrumb/BreadcrumbItem.tsx), [Primer Breadcrumbs source](https://github.com/primer/react/blob/main/packages/react/src/Breadcrumbs/Breadcrumbs.tsx)). The toolkit renders the current page as text ([breadcrumbs](#breadcrumbs)).
- [required] The separator is decorative and directional: hidden from assistive technology (code-standard rule 18) and, where the project mirrors, mirrored in a right-to-left trail (figma-standard rule 50).
- [required] Each crumb is a target of at least 24 by 24 CSS pixels, with a focus ring (WCAG 2.5.8 and 2.4.7; figma-standard rules 26 and 39).

## Breadcrumbs

**Use when / don't use**
- [moderate] Use on a site with three or more levels, where readers often arrive deep from search or a link.
- [moderate] They show **hierarchy, not history**: "Breadcrumbs are not intended to show the history of pages traversed during a session on the site" ([NN/g breadcrumbs, Laubheimer 2018](https://www.nngroup.com/articles/breadcrumbs/)). The Back button holds history.
- [moderate] Don't use them on a flat site of one or two levels, or to show progress through a form or a linear journey ([GOV.UK breadcrumbs](https://design-system.service.gov.uk/components/breadcrumbs/)); a step indicator does that.
- [moderate] They supplement global navigation and never replace it.

**How**
- [weak] Placed at the top of the page, below the global bar and before `main`, so the skip link passes them ([GOV.UK](https://design-system.service.gov.uk/components/breadcrumbs/)).
- [moderate] Start at home (or the section root of a tool), one link per level, separated by a `>` or `/` drawn as decoration.
- [contested] **The current page is last and not a link** ([NN/g](https://www.nngroup.com/articles/breadcrumbs/)), styled as plain text.
- [contested] **Small screens.** The trail stays one line and scrolls sideways, with the parent always in view; no level is hidden ([breadcrumbs on small screens](#breadcrumbs-on-small-screens) owns this).
- [weak] Labels match the target pages' titles exactly.

**Cases**
- A component's detail page is reached from a filtered list → the breadcrumb reads Home > Components > Button, never the filtered list; a "Back to results" link, if needed, is a separate control.
- A tool has only a list and its detail pages → no breadcrumb; a link back to the parent is enough ([Primer navigation](https://primer.style/product/ui-patterns/navigation/): one level deep, a parent link; deeper, a breadcrumb).
- The trail's last item is a link to the current page → render it as text with `aria-current="page"`; a self-link reloads the page and adds a dead tab stop.
- A five-level trail wraps to three lines at 360px → keep it on one line that scrolls, ending on the parent and the current page ([breadcrumbs on small screens](#breadcrumbs-on-small-screens)).

**Accessibility**
- [required] 2.4.8 Location; 1.3.1 (an ordered list inside a labelled `nav`, "Breadcrumb"); 2.4.4 Link Purpose; separators hidden from assistive technology.
- [required] Implementation: code-standard rule 64 (the current item), code-standard rule 1 (labelled landmark), code-standard rule 18 (decorative separators).

**Build**
- [strong] `nav aria-label="Breadcrumb"` holding an `ol`, before `main`; the last item is text with `aria-current="page"` ([APG breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/); the snippet is [HTML semantics: *Navigation markup*](../../code/html-semantics.md#navigation-markup)).
- [strong] Separators are CSS (`li + li::before`), never list items or text in the markup, so a screen reader neither reads nor counts them.
- [contested] On small screens the same list scrolls on one line (`overflow-x: auto`, no wrapping); no `li` is hidden at any width ([breadcrumbs on small screens](#breadcrumbs-on-small-screens) has the build).
- [required] The trail is generated from the page tree, never hand-written per page, so its labels equal the pages' titles (code-standard rule 29).
- [required] No keyboard model of its own: links in the tab order (code-standard rule 21 for any script on them).

**Check**
- *Script:* could check the last item is not an `a[href]`, carries `aria-current`, that the trail sits in a labelled `nav` before `main`, and that it occupies one line at 320px.
- *Judgement:* does every level in the trail exist as a page the reader would want to visit?

**Sources:** NN/g and GOV.UK disagree on the current page: NN/g includes it as the unlinked last item; GOV.UK ends at the parent (it removed its advice to include the current page in June 2020). The toolkit includes it, unlinked: it confirms where the reader is and costs one word, and code-standard rule 64 already marks it.

## Breadcrumbs on small screens

**Use when / don't use**
- [moderate] Use whenever a trail that fits one line on a wide screen would wrap at phone width. NN/g warns that breadcrumbs "can quickly wrap to multiple lines and eat up valuable space", and that shrinking them instead fails on touch, where targets must stay large ([NN/g breadcrumbs](https://www.nngroup.com/articles/breadcrumbs/)).
- [weak] Don't hide the trail on small screens. Friedman's point is that readers then "have to rely on global navigation every time they want to navigate" ([Smashing, breadcrumbs, Friedman 2022](https://www.smashingmagazine.com/2022/04/breadcrumbs-ux-design/)).
- [weak] Don't collapse the middle into an ellipsis, and don't keep only the first and last items. Friedman on an ellipsis trail: "we are cutting the breadcrumbs, making it more difficult for users to explore the full path."

**How**
- [contested] **One line that scrolls sideways.** Every level stays in place and the row scrolls. This is Friedman's compromise: "A good compromise is to keep all breadcrumbs on the same line but avoid multi-line wrapping." He judges the scrolling version "compact and probably better than removing breadcrumbs altogether."
- [weak] **The parent is always in view.** "The parent of the current page should be visible at all times" (Friedman's checklist). The row starts scrolled to its end, so the parent and the current page show and the higher levels are a swipe away.
- [weak] **A part-cut item at the start edge** shows there is more to the left. Friedman's scrolling example adds a fade-out for the same reason.
- [weak] **Labels are not shortened.** A long label wraps inside its own item, or the row scrolls further. An ellipsis inside a crumb hides the word that tells two crumbs apart.

**Cases**
- Home > Components > Forms > Inputs > Text field doesn't fit at 360px → one scrolling row, scrolled to show "Inputs > Text field". Home and Components are a swipe away.
- A build uses a "first and last" option, and the trail ends at the current page → the parent is the item it hides. Switch to the scrolling row.
- A design draws "Home > … > Text field" with a tappable ellipsis that expands the trail (Friedman's "breadcrumbs accordion") → the scrolling row does the same with no control and no script. Use it instead.
- A detail page's trail is just Home > Components → it fits. There is nothing to do.

**Accessibility**
- [required] 1.4.10 Reflow (the trail scrolls on its own; the page never does), 2.5.8 Target Size (crumbs keep their full size), 2.4.8 Location, and 2.4.11 Focus Not Obscured (a focused crumb scrolls into view).
- [required] Implementation: code-standard rule 2 (the row is never reversed to show the end first; it is scrolled), code-standard rule 20.

**Build**
- [weak] The same `nav` and `ol` as [breadcrumbs](#breadcrumbs). Below the width where it fits, set `display: flex; flex-wrap: nowrap; overflow-x: auto` on the `ol`, and `white-space: nowrap` on each `li`. No `li` is ever `display: none` ([responsive: *Container queries*](../../code/responsive.md#container-queries)).
- [required] To start at the end, a one-line enhancement runs on load: `ol.lastElementChild.scrollIntoView({ block: 'nearest', inline: 'end' })`. It works in right-to-left trails too. Without it the row starts at Home and still scrolls (code-standard rule 20).
- [required] Never `flex-direction: row-reverse` to bring the end into view. It reverses the visual order against the DOM, and the tab key then moves backwards along the trail (code-standard rule 2).
- [moderate] Each link keeps the touch-target size ([responsive: *Touch targets*](../../code/responsive.md#touch-targets)). The scroll container needs no `tabindex`, because its links already take focus and the browser scrolls to them.

**Check**
- *Script:* could check at 320px that the trail is one line, that no `li` computes `display: none`, that the parent's link is inside the visible part of the row after load, and that the page itself does not scroll sideways.
- *Judgement:* is the hidden part of the row really one swipe away? Would the reader guess that it scrolls?

**Sources:** sources disagree. GOV.UK's breadcrumbs can "only show the first and last items on mobile devices" ([GOV.UK breadcrumbs](https://design-system.service.gov.uk/components/breadcrumbs/)). NN/g allows "a single breadcrumb pointing up a level" on mobile only. Friedman warns against cutting the trail and asks for the parent always in view. The toolkit follows Friedman and scrolls. GOV.UK's trail ends at the parent, so its first-and-last option keeps the parent; the toolkit's trail ends at the current page, so the same option would drop the parent, the one link a phone reader most needs. NN/g's single parent link keeps the parent but removes every higher level, while the scrolling row keeps them all with no extra control.

## Sideways breadcrumbs

**Use when / don't use**
- [weak] Use when readers often jump between sibling pages (the other members of a family of reference pages, say) and there is no side navigation on screen that already lists them. Friedman calls these "sideways breadcrumbs which provide quick access to the siblings of the current page", and says the pattern "significantly speeds up jumps between siblings" ([Smashing, breadcrumbs, Friedman 2022](https://www.smashingmagazine.com/2022/04/breadcrumbs-ux-design/)).
- [moderate] Don't use them where a side navigation already lists the siblings ([sidebars: navigation sidebar](../patterns/sidebars.md#navigation-sidebar)). NN/g reviewed a trail whose parent link was a dropdown of siblings and concluded "A better design would have a separate UI for the local navigation" ([NN/g breadcrumbs](https://www.nngroup.com/articles/breadcrumbs/)).
- [weak] Don't put a dropdown on every crumb by default. Friedman's caution: "Arrows everywhere! Designing a navigation within the parts of breadcrumbs can be a quite challenging task."

**How**
- [moderate] **Each crumb stays a link to its page.** A separate chevron button after it opens the list of that level's pages. A crumb is never turned into the trigger, which is the rule in [menus: navigation dropdowns](../patterns/menus.md#navigation-dropdowns) that a trigger does one thing. Friedman's checklist also asks to "turn all breadcrumbs into links."
- [weak] **The chevron after a crumb lists that crumb's children,** which are the siblings of the next crumb. The chevron after the parent therefore lists the current page and its siblings, with the current page marked.
- [weak] **Add chevrons only on the levels where readers move sideways,** usually the parent. Friedman notes a missing chevron leaves the dropdown unclear, so every crumb that has one shows it.
- [moderate] The list opens on click, closes on Escape, on a click outside and when a link is chosen, and only one is open at a time, as in [menus: navigation dropdowns](../patterns/menus.md#navigation-dropdowns).

**Cases**
- A crumb "Inputs" both links to the Inputs page and opens a sibling list on hover → keep the link, and add a chevron button beside it that opens the list on click.
- A side navigation already lists every input, and the parent crumb gets a sibling dropdown too → drop the dropdown. Two lists of the same pages go out of step.
- On a phone the trail scrolls sideways and the open list is cut off by the row → make the list a popover, which draws above the scrolling row ([breadcrumbs on small screens](#breadcrumbs-on-small-screens)).
- Every crumb from Home down has a chevron → keep only the parent's. Higher levels belong to global navigation.

**Accessibility**
- [required] 2.1.1 Keyboard, 4.1.2 Name, Role, Value (the button's `aria-expanded`), 2.4.4 Link Purpose, 2.4.3 Focus Order (the list's links follow their button), 2.5.8 Target Size (the chevron is a target of its own, not a sliver of the link).
- [required] Implementation: code-standard rule 18 (the icon-only button is named), code-standard rule 19, code-standard rule 20, code-standard rule 64 (the current page in the list).

**Build**
- [strong] Use the APG's disclosure navigation pattern in its hybrid form, where each item holds "a top-level link and an associated disclosure button" ([APG disclosure navigation, hybrid](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/)). Inside the crumb's `li` go the `a`, a `button type="button" aria-expanded="false" aria-controls="…" aria-label="Pages in Inputs"` with an `aria-hidden` chevron, and the nested `ul` of links.
- [strong] Never `role="menu"`. The APG example "does not use the menu role because it does not provide the complex functionality that assistive technologies expect in a widget that has the menu role" ([accessibility: *Menus, menu buttons and toolbars*](../../code/accessibility.md#menus-menu-buttons-and-toolbars)).
- [required] Make the list `popover="auto"`, opened by the button's `popovertarget`, so Escape, light dismiss and one-open-at-a-time come with no script. The popover also draws in the top layer, above the trail's sideways scroll ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)). A short script mirrors `aria-expanded` on the `toggle` event.
- [required] The list is generated from the same page tree as the trail (code-standard rule 29). The current page is marked in it with `aria-current="page"`, as code-standard rule 64 asks of every navigation that lists it.

**Check**
- *Script:* could check that each crumb with a chevron is still an `a[href]`, that the chevron is a separate `button` with a name and `aria-expanded`, that there is no `[role=menu]` in the trail, and that Escape closes the list and returns focus to the button.
- *Judgement:* do readers really move sideways at this level, or would the side navigation serve them?

**Sources:** NN/g and Friedman disagree. NN/g prefers a separate local navigation to a dropdown in the trail; Friedman calls sideways breadcrumbs "a quite surprising and useful discovery for your users." The toolkit uses a separate side navigation where one exists, and sideways breadcrumbs only where none does. There, the separate chevron keeps NN/g's reading of the trail as links to places intact.

## In Figma

**Layers**
- [required] `Breadcrumbs` holds `Breadcrumbs item` parts, the family's name and the part's last word, in an `Items slot`: an item has a Current variant, and per-item text in a nested instance is dropped when it switches (figma-standard rules 9, 21 and 38). The toolkit's naming research found the same shape in Qualcomm's `_Breadcrumb item` (*Naming inside Figma components*, research folder).
- [required] Auto layout throughout; the item's layers are named for their role, `Separator` then `Label` (figma-standard rules 10 and 33).
- [required] The separator leads each item and is hidden on the first, as `li + li::before` places it in code ([breadcrumbs](#breadcrumbs)) (figma-standard rule 51).
- [required] Where the project mirrors, the separator glyph records in its description whether it mirrors (figma-standard rule 50).

**Properties**
- [required] `Label` is a text property; the separator is an instance swap `Separator` with `Show separator` directly above it (figma-standard rules 5, 21 and 37).
- [weak] A sideways chevron is a placed icon button after the label, revealed by a `Show` boolean and carrying its own accessible name ([sideways breadcrumbs](#sideways-breadcrumbs); figma-standard rules 21 and 40).

**Variants and states**
- [required] On the item, `Current` is a True/False variant, a bare word, before `State` (figma-standard rules 1 and 21).
- [required] `State` runs `Rest → Focus → Hover → Press` on a linked item, each drawn differently, Focus with a ring; the current item is text, so `Current=True` pairs only with Rest (figma-standard rules 2, 4, 31 and 39).
- [contested] No collapsed or overflow-menu variant: the toolkit's trail scrolls on one line ([breadcrumbs on small screens](#breadcrumbs-on-small-screens)), where Primer's `overflow="menu"` and MUI's `maxItems` collapse it ([Primer Breadcrumbs source](https://github.com/primer/react/blob/main/packages/react/src/Breadcrumbs/Breadcrumbs.tsx), [MUI Breadcrumbs types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Breadcrumbs/Breadcrumbs.d.ts)).
- [required] Sizes, where the trail has them, are `Size` with t-shirt values, largest first; Carbon's Breadcrumb takes `sm` and `md` (figma-standard rule 6; [Carbon Breadcrumb source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Breadcrumb/Breadcrumb.tsx)).

**Tokens**
- [required] Every fill, stroke, padding and gap is bound to a semantic variable, never a primitive; the label and separator take text-role and icon tokens by their layer (figma-standard rules 24, 28 and 29).
- [required] Current and each state bind their own tokens (figma-standard rule 48).
- [required] Where the project has component tokens, they are named `Component/Breadcrumbs/<Element>/<property>[-<variant>][-<state>]` and alias semantic ones (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on both sets.
- *Judgement*: at phone width, does the frame show the trail as one scrolling row ending on the parent and the current page?

**Sources.** The toolkit's naming research for the part's name; Primer, MUI and Carbon for the overflow and size props they ship. The separator's place in the item is the toolkit's reasoning from the stylesheet.

## Alignment with code

**Structure**
- [strong] A trail and its items: Carbon's `Breadcrumb` and `BreadcrumbItem`, Primer's `Breadcrumbs` and `Breadcrumbs.Item`, React Aria's `Breadcrumbs` and `Breadcrumb` ([Carbon BreadcrumbItem source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Breadcrumb/BreadcrumbItem.tsx), [Primer Breadcrumbs source](https://github.com/primer/react/blob/main/packages/react/src/Breadcrumbs/Breadcrumbs.tsx), [React Aria Breadcrumbs source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Breadcrumbs.tsx)). MUI ships the trail alone, taking any links as children and wrapping each in an `li` ([MUI Breadcrumbs source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Breadcrumbs/Breadcrumbs.js)).
- [moderate] The kits mirror the two: Carbon's connects `Breadcrumb` and `BreadcrumbItem` ([Carbon Breadcrumb.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Breadcrumb/Breadcrumb.figma.ts), [Carbon BreadcrumbItem.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Breadcrumb/BreadcrumbItem.figma.ts)), Primer's `Breadcrumbs` and `Breadcrumbs.Item`, though its trail holds ten fixed layers, `1st parent` to `Current page`, where this page has an `Items slot` ([Primer Breadcrumbs.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Breadcrumbs/Breadcrumbs.figma.tsx); [In Figma](#in-figma)).
- [weak] Carbon's item renders Carbon's own `Link` when it has an `href` ([Carbon BreadcrumbItem source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Breadcrumb/BreadcrumbItem.tsx)), so the item's link states are the link's; see [link](link.md#alignment-with-code).
- [contested] Where the separator lives: Carbon and Primer draw it as each item's `::after`, hidden on the last ([Carbon breadcrumb styles](https://github.com/carbon-design-system/carbon/blob/main/packages/styles/scss/components/breadcrumb/_breadcrumb.scss), [Primer Breadcrumbs CSS](https://github.com/primer/react/blob/main/packages/react/src/Breadcrumbs/Breadcrumbs.module.css)); MUI inserts it as its own `li` with `aria-hidden` ([MUI Breadcrumbs source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Breadcrumbs/Breadcrumbs.js)); this page leads each item with it, as `li + li::before` ([In Figma](#in-figma)).

**Mapping**
- [required] Each Figma axis maps to one attribute or prop, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Items slot` | one `li` per level, generated from the page tree |
  | `Label` | the link text, the page's own title |
  | `Show separator`, `Separator` | `li + li::before`, never markup |
  | `Size` | `size` |
  | `Current=True` | text, no `href`, `aria-current="page"` |
  | `State=Hover`, `Press` | `:hover`, `:active`, set by the browser |
  | `State=Focus` | `:focus-visible` |
  | the sideways chevron | a `button` with `aria-expanded` ([sideways breadcrumbs](#sideways-breadcrumbs)) |

**States**
- [required] Hover, Press and Focus on a linked item are set by the browser, as `:hover`, `:active` and `:focus-visible`; no prop sets them (code-standard rule 9).
- [strong] Current is set by code: Carbon's `isCurrentPage` and Primer's `selected` on the item, each writing `aria-current="page"`, while React Aria derives it, marking the last item current ([Carbon BreadcrumbItem source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Breadcrumb/BreadcrumbItem.tsx), [Primer Breadcrumbs source](https://github.com/primer/react/blob/main/packages/react/src/Breadcrumbs/Breadcrumbs.tsx), [React Aria Breadcrumbs source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Breadcrumbs.tsx)).
- [moderate] Code cannot reach Current with Hover, Press or Focus: React Aria disables the current item, and Carbon renders it as text when it has no `href` (sources as above), so no frame pairs them (figma-standard rule 2).
- [weak] An item is a link, so the browser can set `:visited` on it, and the item has no Visited axis: the stylesheet keeps a visited item at Rest's colour, or code reaches a state no frame shows ([MDN `:visited`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:visited); the toolkit's reasoning).
- [moderate] Carbon's code reaches a separator after the current item unless the trail sets `noTrailingSlash`, which its Code Connect sets whenever an item is Current ([Carbon Breadcrumb.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Breadcrumb/Breadcrumb.figma.ts)); a set draws that separator only where its code renders it (figma-standard rule 51).

**Differences**
- [moderate] `Current` is a True/False variant on the item here, as in Carbon's kit (`Current`, or `State=Current`) and Primer's (`selected`) (Code Connect files as above), where React Aria takes it from the item's position; the mapping row writes it on the item either way.
- [contested] No overflow item: Carbon's kit draws `Type=Overflow`, which maps to a `BreadcrumbItem` holding an `OverflowMenu` ([Carbon BreadcrumbItem.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Breadcrumb/BreadcrumbItem.figma.ts)); this page draws none, as its trail scrolls ([In Figma](#in-figma)).
- [weak] No skeleton: Carbon's kit draws `State=Skeleton` on the item, which maps to a separate `BreadcrumbSkeleton` component (same source); a project that loads its trail late names its own here.

**Check**
- *Script*: the component contract lists every Figma axis and property of the trail and the item beside the props of each; a row in one with no partner in the other, and no line under *Differences*, is a finding (design-code-parity).
- *Judgement*: could a developer build the trail from the page tree, the current page and the browser's states alone, with the separator in the stylesheet?

**Sources.** Carbon, Primer, MUI and React Aria source, styles and Code Connect files as linked, read for the parts, the current item and where the separator lives; MDN for `:visited`. The separator leading each item is the toolkit's reasoning from its stylesheet.

## In code

**Element**
- [required] A `nav` labelled "Breadcrumb" holding an `ol` of links, the current page as text with `aria-current="page"`; the component itself needs no script, code-standard rule 8's visual kind, and the one line that starts the row at its end is a page enhancement the trail works without (code-standard rules 8 and 20; [breadcrumbs](#breadcrumbs), [breadcrumbs on small screens](#breadcrumbs-on-small-screens)).

**Props**
- [strong] The trail takes its items, the `nav`'s label, a size and a separator: Carbon (`aria-label` defaulting to "Breadcrumb", `size`, `noTrailingSlash`), Primer (`variant`, `overflow`) and MUI (`separator`, `maxItems`) ([Carbon Breadcrumb source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Breadcrumb/Breadcrumb.tsx), [Primer Breadcrumbs source](https://github.com/primer/react/blob/main/packages/react/src/Breadcrumbs/Breadcrumbs.tsx), [MUI Breadcrumbs types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Breadcrumbs/Breadcrumbs.d.ts)).
- [moderate] An item takes its `href` and a current flag: Carbon's `isCurrentPage`, Primer's `selected`, each setting `aria-current="page"`.
- [contested] No collapse props (`overflow="menu"`, `maxItems`, `itemsBeforeCollapse`): the trail scrolls ([breadcrumbs on small screens](#breadcrumbs-on-small-screens)).

**Check**
- *Script*: the parity loop compares each item's variants with their frames (design-code-parity); the checks in each section above cover the trail.
- *Judgement*: does the trail's code take its labels from the pages, never from the design's sample text?

**Sources.** Carbon, Primer and MUI for the props; the APG for the current item; the toolkit's sections above for what it leaves out.
