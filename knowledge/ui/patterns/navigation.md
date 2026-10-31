# Navigation

How people move between screens and within one: breadcrumbs, tabs, in-page navigation, an A–Z index, skip links and the Back button. It serves the principles *discoverable* (what can be reached is visible), *show state* (the reader can always tell where they are) and *consistent, not uniform* (navigation sits in the same place on every page). It applies design-standard rule 2 (the layout holds still when the reader switches a tab) and design-standard rule 3 (tabs choose what a screen shows, keep one row and scroll); the filter bar under the tabs is `filtering.md`'s, and search is `search.md`'s.

One test sorts most decisions here: **does activating it change the address?** If it does, it is a link and belongs to navigation; if it only changes what one screen shows, it is a control on that screen ([Primer navigation](https://primer.style/product/ui-patterns/navigation/)).

**Owned elsewhere.** Topics this page used to hold now have one owner each:
- *Global navigation:* the top bar of sections, the same on every page with the current section marked, is owned by [menus: top menu bar](menus.md#top-menu-bar); its submenus are [menus: navigation dropdowns](menus.md#navigation-dropdowns).
- *Local and side navigation:* a section's own pages in a left sidebar, its nesting and what it becomes on a phone are owned by [sidebars: navigation sidebar](sidebars.md#navigation-sidebar) and the sections after it.
- *Pagination, load more and infinite scroll:* whether to page a list, load more or scroll without end, and how the pager is built, are owned by [pagination: choosing pagination, load more or infinite scroll](pagination.md#choosing-pagination-load-more-or-infinite-scroll) and the sections after it.
- *Mega menus:* owned by [menus: mega menus](menus.md#mega-menus).
- *Mobile navigation:* visible links up to four destinations, a labelled Menu button past that, and bottom bars are owned by [menus: hamburger and mobile menus](menus.md#hamburger-and-mobile-menus).

## Breadcrumbs

**Use when / don't use**
- Use on a site with three or more levels, where readers often arrive deep from search or a link.
- They show **hierarchy, not history**: "Breadcrumbs are not intended to show the history of pages traversed during a session on the site" ([NN/g breadcrumbs, Laubheimer 2018](https://www.nngroup.com/articles/breadcrumbs/)). The Back button holds history.
- Don't use them on a flat site of one or two levels, or to show progress through a form or a linear journey ([GOV.UK breadcrumbs](https://design-system.service.gov.uk/components/breadcrumbs/)); a step indicator does that.
- They supplement global navigation and never replace it.

**How**
- Placed at the top of the page, below the global bar and before `main`, so the skip link passes them ([GOV.UK](https://design-system.service.gov.uk/components/breadcrumbs/)).
- Start at home (or the section root of a tool), one link per level, separated by a `>` or `/` drawn as decoration.
- **The current page is last and not a link** ([NN/g](https://www.nngroup.com/articles/breadcrumbs/)), styled as plain text.
- **Small screens.** The trail stays one line and scrolls sideways, with the parent always in view; no level is hidden ([breadcrumbs on small screens](#breadcrumbs-on-small-screens) owns this).
- Labels match the target pages' titles exactly.

**Cases**
- A component's detail page is reached from a filtered list → the breadcrumb reads Home > Components > Button, never the filtered list; a "Back to results" link, if needed, is a separate control.
- A tool has only a list and its detail pages → no breadcrumb; a link back to the parent is enough ([Primer navigation](https://primer.style/product/ui-patterns/navigation/): one level deep, a parent link; deeper, a breadcrumb).
- The trail's last item is a link to the current page → render it as text with `aria-current="page"`; a self-link reloads the page and adds a dead tab stop.
- A five-level trail wraps to three lines at 360px → keep it on one line that scrolls, ending on the parent and the current page ([breadcrumbs on small screens](#breadcrumbs-on-small-screens)).

**Accessibility**
- 2.4.8 Location; 1.3.1 (an ordered list inside a labelled `nav`, "Breadcrumb"); 2.4.4 Link Purpose; separators hidden from assistive technology.
- Implementation: code-standard rule 64 (the current item), code-standard rule 1 (labelled landmark), code-standard rule 18 (decorative separators).

**Build**
- `nav aria-label="Breadcrumb"` holding an `ol`, before `main`; the last item is text with `aria-current="page"` ([APG breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/); the snippet is [HTML semantics: *Navigation markup*](../../code/html-semantics.md#navigation-markup)).
- Separators are CSS (`li + li::before`), never list items or text in the markup, so a screen reader neither reads nor counts them.
- On small screens the same list scrolls on one line (`overflow-x: auto`, no wrapping); no `li` is hidden at any width ([breadcrumbs on small screens](#breadcrumbs-on-small-screens) has the build).
- The trail is generated from the page tree, never hand-written per page, so its labels equal the pages' titles (code-standard rule 29).
- No keyboard model of its own: links in the tab order (code-standard rule 21 for any script on them).

**Check**
- *Script:* could check the last item is not an `a[href]`, carries `aria-current`, that the trail sits in a labelled `nav` before `main`, and that it occupies one line at 320px.
- *Judgement:* does every level in the trail exist as a page the reader would want to visit?

**Sources:** NN/g and GOV.UK disagree on the current page: NN/g includes it as the unlinked last item; GOV.UK ends at the parent (it removed its advice to include the current page in June 2020). The toolkit includes it, unlinked: it confirms where the reader is and costs one word, and code-standard rule 64 already marks it.

## Breadcrumbs on small screens

**Use when / don't use**
- Use whenever a trail that fits one line on a wide screen would wrap at phone width. NN/g warns that breadcrumbs "can quickly wrap to multiple lines and eat up valuable space", and that shrinking them instead fails on touch, where targets must stay large ([NN/g breadcrumbs](https://www.nngroup.com/articles/breadcrumbs/)).
- Don't hide the trail on small screens. Friedman's point is that readers then "have to rely on global navigation every time they want to navigate" ([Smashing, breadcrumbs, Friedman 2022](https://www.smashingmagazine.com/2022/04/breadcrumbs-ux-design/)).
- Don't collapse the middle into an ellipsis, and don't keep only the first and last items. Friedman on an ellipsis trail: "we are cutting the breadcrumbs, making it more difficult for users to explore the full path."

**How**
- **One line that scrolls sideways.** Every level stays in place and the row scrolls. This is Friedman's compromise: "A good compromise is to keep all breadcrumbs on the same line but avoid multi-line wrapping." He judges the scrolling version "compact and probably better than removing breadcrumbs altogether."
- **The parent is always in view.** "The parent of the current page should be visible at all times" (Friedman's checklist). The row starts scrolled to its end, so the parent and the current page show and the higher levels are a swipe away.
- **A part-cut item at the start edge** shows there is more to the left. Friedman's scrolling example adds a fade-out for the same reason.
- **Labels are not shortened.** A long label wraps inside its own item, or the row scrolls further. An ellipsis inside a crumb hides the word that tells two crumbs apart.

**Cases**
- Home > Components > Forms > Inputs > Text field doesn't fit at 360px → one scrolling row, scrolled to show "Inputs > Text field". Home and Components are a swipe away.
- A build uses a "first and last" option, and the trail ends at the current page → the parent is the item it hides. Switch to the scrolling row.
- A design draws "Home > … > Text field" with a tappable ellipsis that expands the trail (Friedman's "breadcrumbs accordion") → the scrolling row does the same with no control and no script. Use it instead.
- A detail page's trail is just Home > Components → it fits. There is nothing to do.

**Accessibility**
- 1.4.10 Reflow (the trail scrolls on its own; the page never does), 2.5.8 Target Size (crumbs keep their full size), 2.4.8 Location, and 2.4.11 Focus Not Obscured (a focused crumb scrolls into view).
- Implementation: code-standard rule 2 (the row is never reversed to show the end first; it is scrolled), code-standard rule 20.

**Build**
- The same `nav` and `ol` as [breadcrumbs](#breadcrumbs). Below the width where it fits, set `display: flex; flex-wrap: nowrap; overflow-x: auto` on the `ol`, and `white-space: nowrap` on each `li`. No `li` is ever `display: none` ([responsive: *Container queries*](../../code/responsive.md#container-queries)).
- To start at the end, a one-line enhancement runs on load: `ol.lastElementChild.scrollIntoView({ block: 'nearest', inline: 'end' })`. It works in right-to-left trails too. Without it the row starts at Home and still scrolls (code-standard rule 20).
- Never `flex-direction: row-reverse` to bring the end into view. It reverses the visual order against the DOM, and the tab key then moves backwards along the trail (code-standard rule 2).
- Each link keeps the touch-target size ([responsive: *Touch targets*](../../code/responsive.md#touch-targets)). The scroll container needs no `tabindex`, because its links already take focus and the browser scrolls to them.

**Check**
- *Script:* could check at 320px that the trail is one line, that no `li` computes `display: none`, that the parent's link is inside the visible part of the row after load, and that the page itself does not scroll sideways.
- *Judgement:* is the hidden part of the row really one swipe away? Would the reader guess that it scrolls?

**Sources:** sources disagree. GOV.UK's breadcrumbs can "only show the first and last items on mobile devices" ([GOV.UK breadcrumbs](https://design-system.service.gov.uk/components/breadcrumbs/)). NN/g allows "a single breadcrumb pointing up a level" on mobile only. Friedman warns against cutting the trail and asks for the parent always in view. The toolkit follows Friedman and scrolls. GOV.UK's trail ends at the parent, so its first-and-last option keeps the parent; the toolkit's trail ends at the current page, so the same option would drop the parent, the one link a phone reader most needs. NN/g's single parent link keeps the parent but removes every higher level, while the scrolling row keeps them all with no extra control.

## Sideways breadcrumbs

**Use when / don't use**
- Use when readers often jump between sibling pages (the other members of a family of reference pages, say) and there is no side navigation on screen that already lists them. Friedman calls these "sideways breadcrumbs which provide quick access to the siblings of the current page", and says the pattern "significantly speeds up jumps between siblings" ([Smashing, breadcrumbs, Friedman 2022](https://www.smashingmagazine.com/2022/04/breadcrumbs-ux-design/)).
- Don't use them where a side navigation already lists the siblings ([sidebars: navigation sidebar](sidebars.md#navigation-sidebar)). NN/g reviewed a trail whose parent link was a dropdown of siblings and concluded "A better design would have a separate UI for the local navigation" ([NN/g breadcrumbs](https://www.nngroup.com/articles/breadcrumbs/)).
- Don't put a dropdown on every crumb by default. Friedman's caution: "Arrows everywhere! Designing a navigation within the parts of breadcrumbs can be a quite challenging task."

**How**
- **Each crumb stays a link to its page.** A separate chevron button after it opens the list of that level's pages. A crumb is never turned into the trigger, which is the rule in [menus: navigation dropdowns](menus.md#navigation-dropdowns) that a trigger does one thing. Friedman's checklist also asks to "turn all breadcrumbs into links."
- **The chevron after a crumb lists that crumb's children,** which are the siblings of the next crumb. The chevron after the parent therefore lists the current page and its siblings, with the current page marked.
- **Add chevrons only on the levels where readers move sideways,** usually the parent. Friedman notes a missing chevron leaves the dropdown unclear, so every crumb that has one shows it.
- The list opens on click, closes on Escape, on a click outside and when a link is chosen, and only one is open at a time, as in [menus: navigation dropdowns](menus.md#navigation-dropdowns).

**Cases**
- A crumb "Inputs" both links to the Inputs page and opens a sibling list on hover → keep the link, and add a chevron button beside it that opens the list on click.
- A side navigation already lists every input, and the parent crumb gets a sibling dropdown too → drop the dropdown. Two lists of the same pages go out of step.
- On a phone the trail scrolls sideways and the open list is cut off by the row → make the list a popover, which draws above the scrolling row ([breadcrumbs on small screens](#breadcrumbs-on-small-screens)).
- Every crumb from Home down has a chevron → keep only the parent's. Higher levels belong to global navigation.

**Accessibility**
- 2.1.1 Keyboard, 4.1.2 Name, Role, Value (the button's `aria-expanded`), 2.4.4 Link Purpose, 2.4.3 Focus Order (the list's links follow their button), 2.5.8 Target Size (the chevron is a target of its own, not a sliver of the link).
- Implementation: code-standard rule 18 (the icon-only button is named), code-standard rule 19, code-standard rule 20, code-standard rule 64 (the current page in the list).

**Build**
- Use the APG's disclosure navigation pattern in its hybrid form, where each item holds "a top-level link and an associated disclosure button" ([APG disclosure navigation, hybrid](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation-hybrid/)). Inside the crumb's `li` go the `a`, a `button type="button" aria-expanded="false" aria-controls="…" aria-label="Pages in Inputs"` with an `aria-hidden` chevron, and the nested `ul` of links.
- Never `role="menu"`. The APG example "does not use the menu role because it does not provide the complex functionality that assistive technologies expect in a widget that has the menu role" ([accessibility: *Menus, menu buttons and toolbars*](../../code/accessibility.md#menus-menu-buttons-and-toolbars)).
- Make the list `popover="auto"`, opened by the button's `popovertarget`, so Escape, light dismiss and one-open-at-a-time come with no script. The popover also draws in the top layer, above the trail's sideways scroll ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)). A short script mirrors `aria-expanded` on the `toggle` event.
- The list is generated from the same page tree as the trail (code-standard rule 29). The current page is marked in it with `aria-current="page"`, as code-standard rule 64 asks of every navigation that lists it.

**Check**
- *Script:* could check that each crumb with a chevron is still an `a[href]`, that the chevron is a separate `button` with a name and `aria-expanded`, that there is no `[role=menu]` in the trail, and that Escape closes the list and returns focus to the button.
- *Judgement:* do readers really move sideways at this level, or would the side navigation serve them?

**Sources:** NN/g and Friedman disagree. NN/g prefers a separate local navigation to a dropdown in the trail; Friedman calls sideways breadcrumbs "a quite surprising and useful discovery for your users." The toolkit uses a separate side navigation where one exists, and sideways breadcrumbs only where none does. There, the separate chevron keeps NN/g's reading of the trail as links to places intact.

## Tabs

**Use when / don't use**
- Use to switch between views of one context: different, independent content the reader does not need side by side ([Atlassian tabs](https://atlassian.design/components/tabs/usage), [Carbon tabs](https://carbondesignsystem.com/components/tabs/usage/)). Design-standard rule 3 owns this.
- Don't use them to filter one list (that is the filter bar under them), for steps in a process, for content the reader must compare across tabs, or for reading in order ([GOV.UK tabs](https://design-system.service.gov.uk/components/tabs/)).
- Don't use them as a second global navigation bar.

**How**
- **One row, never wrapping.** Overflow scrolls horizontally (design-standard rule 3); Fluent moves overflow into a menu, Carbon scrolls with arrows. Keep the count low; Carbon says eight or fewer at large breakpoints.
- **Links or panels.** If activating a tab changes the address, the tabs are links styled as tabs, with `aria-current` on the current one; if it only swaps a panel on the same page, it is an ARIA tab set. Never mix the two in one set ([Primer navigation](https://primer.style/product/ui-patterns/navigation/)).
- **Placement.** What applies to every tab sits above the tab line; what belongs to the chosen tab sits under it ([Atlassian](https://atlassian.design/components/tabs/usage)).
- **First tab** is the one most readers want ([GOV.UK](https://design-system.service.gov.uk/components/tabs/)).
- **Stability.** Switching never moves the tabs or the bar under them (design-standard rule 2). In a tool where the columns change per tab, the tabs live in the object's header bar above every column ([sidebars: object header over a tool layout](sidebars.md#object-header-over-a-tool-layout)).
- **Keyboard** for a panel tab set ([W3C APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)): one tab stop, arrows move and wrap, automatic activation when panels are instant, manual (Enter or Space) when they load slowly. Link tabs are ordinary links in the tab order.
- **One tab set per region, never tabs inside a tab panel.** A switch inside a tab's content, or inside an inspector, is a segmented control or a select: Apple: "Use a tab view in the main window area — instead of a segmented control — for view switching… Consider using a segmented control to help people switch views in a toolbar or inspector pane" ([Apple segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)); Apple also caps a tab view: "Avoid providing more than six tabs" ([Apple tab views](https://developer.apple.com/design/human-interface-guidelines/tab-views)). Material allows secondary tabs "within a content area to further separate related content" ([Material tabs, Android docs](https://github.com/material-components/material-components-android/blob/master/docs/components/Tabs.md)); the toolkit does not, because two underlined tab rows read as one set with two current items.
- A count on a tab ("Open (12)") follows design-standard rule 11's counting.

**Cases**
- Tabs pick which library file an audit screen shows, and the file is in the address → build them as links with `aria-current`, so Back and a shared link restore the file.
- A designer puts "All / Errors / Warnings" as tabs over one table → those are filter values: a segmented facet in the filter bar (design-standard rule 4).
- Nine tabs at 768px wrap to two rows → make the row scroll (design-standard rule 3); tabs on two rows no longer read as one set.
- One tab set has three tabs that navigate and one that opens a panel → split them: the panel becomes a section of the page, or every tab navigates.
- An object's Variants tab holds its own row of Light / Dark / Compact tabs → a segmented control in the tab's toolbar; one tab set per region.
- A tab hides an action column only some files have, and the tabs jump → [interaction: layout stability](../design/interaction.md#layout-stability).

**Accessibility**
- 2.1.1 Keyboard, 4.1.2 Name, Role, Value (`tablist`, `tab`, `tabpanel`, `aria-selected`, or links with `aria-current`), 2.4.7 Focus Visible, 1.4.10 Reflow (scrolling tabs keep the focused one in view), 2.4.11 Focus Not Obscured.
- Implementation: code-standard rule 64 (link tabs), code-standard rule 14 (a live panel swap keeps the reader's place), code-standard rule 20 (link tabs work without script), code-standard rule 21. Figma: figma-standard rules 26, 31 and 32.

**Build**
- **Link tabs** (the address changes): a `nav` of links styled as tabs, `aria-current="page"` on the current one; they need no script (code-standard rule 20, code-standard rule 64; [HTML semantics: *Navigation markup*](../../code/html-semantics.md#navigation-markup)).
- **Panel tabs** (one page): `role="tablist"`, `tab` buttons with `aria-selected` and `aria-controls`, `tabpanel`s labelled by their tab, roving tabindex and arrow keys per the [APG tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/); the handler and the no-script form are [accessibility: *Composite widgets and roving tabindex*](../../code/accessibility.md#composite-widgets-and-roving-tabindex).
- Never both in one set: a `tablist` holds no `a[href]`.
- One row that scrolls: `display: flex; overflow-x: auto` on the list, and the selected tab scrolled into view with `scrollIntoView({ block: 'nearest', inline: 'nearest' })` after a switch (design-standard rule 3).
- Selected is styled from `[aria-selected="true"]` or `[aria-current]`, so look and state are one fact ([css-architecture: *Selectors that stay cheap and local*](../../code/css-architecture.md#selectors-that-stay-cheap-and-local)).
- One tabs module for the site, included where needed (code-standard rule 36); a panel swap keeps focus on the tab (code-standard rule 14).

**Check**
- *Script:* tools/ui-check/check.mjs: design-standard rule 3 (tabs keep one row and scroll) and design-standard rule 2 (the tab list holds its position after each switch). Could check that a tab set does not mix `role="tab"` and `a[href]`, and that only one tab is current.
- *Judgement:* is each tab independent content, or is it a filter or a step in disguise?

**Sources:** Atlassian, Carbon, GOV.UK, Primer, W3C APG as linked; [eBay MIND fake tabs](https://ebay.gitbook.io/mindpatterns/navigation/fake-tabs) agrees that page-loading tabs are a list of links. GOV.UK's tabs update the URL fragment while staying a tab panel; the toolkit follows Primer and eBay: if the tab is in the address, it is navigation. GOV.UK warns its tabs component "has not yet been tried in research with users"; the toolkit uses tabs only where design-standard rule 3 allows them. Apple and Material disagree on secondary tabs; the toolkit takes Apple's segmented control for any switch inside a tab. This section owns tabs; other pages link here.

## In-page navigation ("On this page")

**Use when / don't use**
- Use on a long page with four or more sections of its own: reference, guidelines, a long component page.
- Don't use it on a page that fits in two screens, or as a copy of the side navigation.

**How**
- In a right rail on wide screens, labelled "On this page", sticky, with the section in view highlighted. In the body (narrow screens, or no rail), not sticky, because a sticky one competes with global navigation ([NN/g table of contents, Wang and Brown 2023](https://www.nngroup.com/articles/table-of-contents/)).
- Entries match the section headings word for word and skip none; one level, two at most.
- Each link targets a heading's `id`; the address takes the fragment, so a link to a section can be shared.
- A sticky header must not cover the heading a link jumps to (`scroll-margin-top`).

**Cases**
- A right-rail list has no heading and goes unused → label it "On this page"; NN/g names right-rail blindness as the failure.
- Headings were renamed and the list was hand-written → generate it from the headings so they cannot drift.
- On a phone the rail disappears → place the list after the lede, not sticky.
- A jump lands the heading under the sticky bar → set a scroll margin equal to the bar's height, read from its token.

**Accessibility**
- 2.4.5 Multiple Ways, 2.4.6 Headings and Labels, 2.4.11 Focus Not Obscured (the target heading visible after the jump), 1.3.1.
- Implementation: code-standard rule 1 (a labelled `nav`, headings without gaps), code-standard rule 64 if the current section is marked (`aria-current="true"` or "location").

**Build**
- A `nav` labelled by its visible "On this page" heading (`aria-labelledby`), holding a list of links to the headings' `id`s ([HTML semantics: *Navigation markup*](../../code/html-semantics.md#navigation-markup)).
- Generated from the page's `h2`s (and `h3`s at most) at build time, so entries cannot drift from headings (code-standard rule 29).
- `scroll-margin-top` on headings from the sticky header's height token keeps the target visible after the jump.
- The section in view, if marked, is set by an `IntersectionObserver` as `aria-current="true"`; the list works without it.
- Sticky only in the wide-screen rail (`position: sticky` inside a media or container query); in the body it is static ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)).

**Check**
- *Script:* could check every entry's text equals its target heading's text, every target `id` exists, and the target heading's top is below any sticky header after the jump.
- *Judgement:* is the page long enough to need it?

**Sources:** NN/g as linked.

## A–Z index

**Use when / don't use**
- Use for a large set of named things that readers look up by a name they already know: people, components, terms in a glossary, services. NN/g: "Alphabetical listings can work well when there is a well-known, common vocabulary for the terms used" ([NN/g breaking web conventions, Sherwin 2014](https://www.nngroup.com/articles/breaking-web-conventions/)).
- Don't use it when readers don't know your names: "When visitors don't know your terminology, or when your site uses a lot of jargon, an alphabetical listing is not helpful" (same article). For most questions, "users don't know the name of the thing they want, making A–Z listings useless" ([NN/g alphabetical sorting, Nielsen 2010](https://www.nngroup.com/articles/alphabetical-sorting-must-mostly-die/)).
- It supplements navigation and search and never replaces them ([search: site search and list search](search.md#site-search-and-list-search)). A list short enough to scan needs no letters.

**How**
- **One page, a heading per letter, the entries in a list under each.** A row of letter links at the top jumps to each heading. NN/g's example is an index where "the A-Z list allows direct access to the designer of interest" ([NN/g in-page links, Schade 2017](https://www.nngroup.com/articles/in-page-links/)).
- **All 26 letters, always.** A letter with no entries stays in the row, dimmed and not a link, so the row keeps its shape and the reader can see that nothing starts with Q (design-standard rule 5).
- **Index the reader's words, not only yours.** A synonym or an old name is an entry of its own that points at the real one ("Lozenge, see Tag"). The reader then finds the page under the word they came with. Cross-references read "see", and they link straight to the target entry.
- **Letter links look like jump links,** not like links to other pages. NN/g: "In-page links need to be differentiated from other links on the page so users understand where they will lead."
- **File each entry under its significant first letter:** "The Button guide" goes under B, and "É" under E.

**Cases**
- A component index lists 140 names, and readers arrive knowing "date picker" → an A–Z index with letter links helps. Search still matters for readers who don't know the name.
- A university-style "everything" list in internal jargon → no A–Z index. NN/g found such a listing "was not helpful for users", because visitors didn't know the official names.
- Readers look for "Lozenge" but the component is now "Tag" → add "Lozenge, see Tag" under L, linking to Tag's entry.
- The letter row hides X and Z because they have no entries, and the row changes length between sites → show them dimmed and not linked.
- A jump to "M" lands the heading under the sticky header → give letter headings a `scroll-margin-top` ([in-page navigation](#in-page-navigation-on-this-page)).

**Accessibility**
- 2.4.5 Multiple Ways, 1.3.1 (a labelled `nav` and a heading per letter), 2.4.4 Link Purpose, 2.4.11 Focus Not Obscured after a jump, 2.5.8 Target Size for the letters.
- Implementation: code-standard rule 1 (the labelled `nav` and headings without gaps), code-standard rule 62 (an empty letter is a link with no `href`), code-standard rule 29.

**Build**
- Use `<nav aria-label="A to Z">` holding a `ul` of 26 `li`s. A letter with entries is `<a href="#letter-m">M</a>`, and each letter section is an `h2 id="letter-m"` followed by a `ul` of links ([HTML semantics: *Navigation markup*](../../code/html-semantics.md#navigation-markup)).
- **An empty letter** is `<a aria-disabled="true">Q</a>` with no `href`, per code-standard rule 62. With no `href` it is not a link, so it takes no focus and is read as plain text. That is right, because there is nothing to reach. Never keep the `href` and add `aria-disabled`: MDN notes "`aria-disabled` does not change the focusability" of an element, so the letter stays in the tab order and still jumps ([MDN `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled)). The dim is styled off `[aria-disabled]`, from the disabled-state token.
- No heading is written for an empty letter. The row says the letter is empty; an empty heading adds a stop that says nothing.
- Entries, letters and cross-references are generated from the pages and their recorded synonyms (code-standard rule 29). They are sorted with `Intl.Collator`, and grouped by a first letter taken after `normalize('NFD')` strips the accent, so "É" lands under E.
- The row wraps rather than scrolls. Each letter keeps the touch-target size ([responsive: *Touch targets*](../../code/responsive.md#touch-targets)), and `scroll-margin-top` on the letter headings comes from the sticky header's height token.

**Check**
- *Script:* could check that the row has 26 items, that every `a[href^="#letter-"]` resolves to a heading, that every letter with no heading has no `href`, that no `a[href][aria-disabled]` exists, and that every "see" entry links to an entry on the page.
- *Judgement:* do readers know the names this index is sorted by? Which synonyms do they search for that the index lacks?

**Sources:** NN/g as linked; MDN for `aria-disabled`. GOV.UK, Carbon and Atlassian publish no A–Z index pattern. NN/g's own articles pull two ways: alphabetical order "must (mostly) die" for menus and categories, yet it works for an index of known names. The toolkit uses an A–Z index only for known-item lookup, with synonyms to cover the names readers bring.

## Skip links

**Use when / don't use**
- Use on every page with repeated blocks before the content (a header, global navigation, breadcrumbs). GOV.UK requires one on every page ([GOV.UK skip link](https://design-system.service.gov.uk/components/skip-link/)).
- A page whose navigation sits after the content may not need one ([W3C Understanding 2.4.1](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)); landmarks and headed sections are among its sufficient techniques, and the page keeps them either way.

**How**
- The first focusable element, right after `<body>` (after a cookie banner if there is one), reading "Skip to main content", targeting `main`.
- Visually hidden until focused, then visible with the focus ring, at the top left, above everything.
- Activating it moves focus to the target (GOV.UK added script to move focus for consistent screen-reader behaviour).

**Cases**
- The skip link targets `#content` but no element has that `id` → point it at `main`'s `id`; a link to nothing is a silent failure.
- The link appears on focus but behind the sticky header → raise its stacking order.
- A tool page has a long filter bar before the list → a second skip link "Skip to results" is reasonable; more than two becomes its own navigation.

**Accessibility**
- 2.4.1 Bypass Blocks, 2.4.7 Focus Visible (visible on focus), 2.4.11 Focus Not Obscured.
- Implementation: code-standard rule 1 (one `main`, landmarks), code-standard rule 2.

**Build**
- `<a class="skip-link" href="#main">Skip to main content</a>` as the first child of `body`, and `<main id="main" tabindex="-1">` so focus lands there in every browser ([accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- Hidden until focused with the visually-hidden utility, which releases on `:focus` ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)); never `display: none`, which removes it from the tab order.
- On focus it sits above the sticky header with a stacking token, never a literal `z-index` (code-standard rule 22).
- A second "Skip to results" link targets the list's heading `id`; landmarks do the rest (code-standard rule 1, [HTML semantics: *Landmarks*](../../code/html-semantics.md#landmarks)).

**Check**
- *Script:* could check the first focusable element is a link whose `href` fragment matches an existing element inside or equal to `main`, and that it is visible when focused.
- *Judgement:* none beyond the script; it is mechanical.

**Sources:** GOV.UK and W3C as linked.

## Back behaviour

**Use when / don't use**
- Every view the reader perceives as a new page gets its own history entry, so Back returns to it: a tab that changes the address, a filter or sort change, a page of results, an opened overlay ([Baymard back button](https://baymard.com/blog/back-button-expectations)).
- Don't push an entry for minor changes: each keystroke in a search box, a truncated "read more" ("Truncated content should in general never be implemented as a new 'page'", Baymard).
- Don't draw an in-page "Back" link where the browser's Back does the same thing, except in a linear journey (GOV.UK's back link in forms) or as a "Back to results" that restores filters.

**How**
- Tabs, filters, sort and page number round-trip through the address, pushed for perceived view changes and replaced for typing ([ux: state persistence and restore](../design/ux.md#state-persistence-and-restore)).
- Back closes an overlay the reader opened, and does not skip past the page under it; Baymard found 37% of sites fail this.
- Returning to a list restores scroll position and the item the reader left from.

**Cases**
- A reader applies three filters, opens a row and presses Back → the list returns with the same three filters, page and scroll position.
- Back from an opened dialog leaves the site → push an entry when the dialog opens, close it on `popstate`.
- A breadcrumb is used as the back route from a filtered list → add a "Back to results" link that restores the filtered address; the breadcrumb goes to the unfiltered parent, by design.

**Accessibility**
- 3.2.5 Change on Request (AAA, worth meeting: views change only when asked), 2.4.3 (focus lands at the top of the restored view or on the item left from), 3.3.4 for not losing entered data.
- Implementation: code-standard rule 14 (keep the reader's place on a live swap), code-standard rule 20 (filters as GET forms make the address real without script).

**Build**
- Push for a view change (tab, filter, sort, page, an opened overlay), replace while typing; restore on `popstate` from `location.search` ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- Filters and paging are GET forms and links first, so the browser makes the history entries without script (code-standard rule 20).
- An overlay that owns an entry: `pushState` on open, close on `popstate`, and `history.back()` from its close button so the entry does not linger.
- Returning to a list restores scroll and focus: `history.scrollRestoration` stays `"auto"` for full loads; a scripted swap restores both itself ([javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll); code-standard rule 14).
- An in-page "Back to results" is a link whose `href` is the filtered address, never `history.back()`, so it works from a shared link.

**Check**
- *Script:* could change a filter, a tab and a page, press Back three times, and assert each previous state returns; could assert the address after reload reproduces the view.
- *Judgement:* which changes would the reader call a new page?

**Sources:** Baymard as linked; GOV.UK tabs put the tab in the address so Back returns to the previous tab ([GOV.UK tabs](https://design-system.service.gov.uk/components/tabs/)).
