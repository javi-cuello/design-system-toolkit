# Navigation

How people move between screens and within one: in-page navigation, an A–Z index, skip links and the Back button. Breadcrumbs and tabs are components with pages of their own, [`../components/breadcrumbs.md`](../components/breadcrumbs.md) and [`../components/tabs.md`](../components/tabs.md). It serves the principles *discoverable* (what can be reached is visible), *show state* (the reader can always tell where they are) and *consistent, not uniform* (navigation sits in the same place on every page). It applies design-standard rule 2 (the layout holds still when the reader switches a tab) and design-standard rule 3 (tabs choose what a screen shows, keep one row and scroll); the filter bar under the tabs is `filtering.md`'s, and search is `search.md`'s.

One test sorts most decisions here: **does activating it change the address?** If it does, it is a link and belongs to navigation; if it only changes what one screen shows, it is a control on that screen ([Primer navigation](https://primer.style/product/ui-patterns/navigation/)).

**Owned elsewhere.** Topics this page used to hold now have one owner each:
- *Global navigation:* the top bar of sections, the same on every page with the current section marked, is owned by [menus: top menu bar](menus.md#top-menu-bar); its submenus are [menus: navigation dropdowns](menus.md#navigation-dropdowns).
- *Local and side navigation:* a section's own pages in a left sidebar, its nesting and what it becomes on a phone are owned by [sidebars: navigation sidebar](sidebars.md#navigation-sidebar) and the sections after it.
- *Pagination, load more and infinite scroll:* whether to page a list, load more or scroll without end, and how the pager is built, are owned by [pagination: choosing pagination, load more or infinite scroll](pagination.md#choosing-pagination-load-more-or-infinite-scroll) and the sections after it.
- *Mega menus:* owned by [menus: mega menus](menus.md#mega-menus).
- *Mobile navigation:* visible links up to four destinations, a labelled Menu button past that, and bottom bars are owned by [menus: hamburger and mobile menus](menus.md#hamburger-and-mobile-menus).

## In-page navigation ("On this page")

**Use when / don't use**
- [weak] Use on a long page with four or more sections of its own: reference, guidelines, a long component page.
- [weak] Don't use it on a page that fits in two screens, or as a copy of the side navigation.

**How**
- [moderate] In a right rail on wide screens, labelled "On this page", sticky, with the section in view highlighted. In the body (narrow screens, or no rail), not sticky, because a sticky one competes with global navigation ([NN/g table of contents, Wang and Brown 2023](https://www.nngroup.com/articles/table-of-contents/)).
- [weak] Entries match the section headings word for word and skip none; one level, two at most.
- [strong] Each link targets a heading's `id`; the address takes the fragment, so a link to a section can be shared.
- [moderate] A sticky header must not cover the heading a link jumps to (`scroll-margin-top`).

**Cases**
- A right-rail list has no heading and goes unused → label it "On this page"; NN/g names right-rail blindness as the failure.
- Headings were renamed and the list was hand-written → generate it from the headings so they cannot drift.
- On a phone the rail disappears → place the list after the lede, not sticky.
- A jump lands the heading under the sticky bar → set a scroll margin equal to the bar's height, read from its token.

**Accessibility**
- [required] 2.4.5 Multiple Ways, 2.4.6 Headings and Labels, 2.4.11 Focus Not Obscured (the target heading visible after the jump), 1.3.1.
- [required] Implementation: code-standard rule 1 (a labelled `nav`, headings without gaps), code-standard rule 64 if the current section is marked (`aria-current="true"` or "location").

**Build**
- [required] A `nav` labelled by its visible "On this page" heading (`aria-labelledby`), holding a list of links to the headings' `id`s ([HTML semantics: *Navigation markup*](../../code/html-semantics.md#navigation-markup)).
- [required] Generated from the page's `h2`s (and `h3`s at most) at build time, so entries cannot drift from headings (code-standard rule 29).
- [strong] `scroll-margin-top` on headings from the sticky header's height token keeps the target visible after the jump (WCAG 2.4.11).
- [weak] The section in view, if marked, is set by an `IntersectionObserver` as `aria-current="true"`; the list works without it.
- [moderate] Sticky only in the wide-screen rail (`position: sticky` inside a media or container query); in the body it is static ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)).

**Check**
- *Script:* could check every entry's text equals its target heading's text, every target `id` exists, and the target heading's top is below any sticky header after the jump.
- *Judgement:* is the page long enough to need it?

**Sources:** NN/g as linked.

## A–Z index

**Use when / don't use**
- [moderate] Use for a large set of named things that readers look up by a name they already know: people, components, terms in a glossary, services. NN/g: "Alphabetical listings can work well when there is a well-known, common vocabulary for the terms used" ([NN/g breaking web conventions, Sherwin 2014](https://www.nngroup.com/articles/breaking-web-conventions/)).
- [moderate] Don't use it when readers don't know your names: "When visitors don't know your terminology, or when your site uses a lot of jargon, an alphabetical listing is not helpful" (same article). For most questions, "users don't know the name of the thing they want, making A–Z listings useless" ([NN/g alphabetical sorting, Nielsen 2010](https://www.nngroup.com/articles/alphabetical-sorting-must-mostly-die/)).
- [weak] It supplements navigation and search and never replaces them ([search: site search and list search](search.md#site-search-and-list-search)). A list short enough to scan needs no letters.

**How**
- [weak] **One page, a heading per letter, the entries in a list under each.** A row of letter links at the top jumps to each heading. NN/g's example is an index where "the A-Z list allows direct access to the designer of interest" ([NN/g in-page links, Schade 2017](https://www.nngroup.com/articles/in-page-links/)).
- [required] **All 26 letters, always.** A letter with no entries stays in the row, dimmed and not a link, so the row keeps its shape and the reader can see that nothing starts with Q (design-standard rule 5).
- [weak] **Index the reader's words, not only yours.** A synonym or an old name is an entry of its own that points at the real one ("Lozenge, see Tag"). The reader then finds the page under the word they came with. Cross-references read "see", and they link straight to the target entry.
- [weak] **Letter links look like jump links,** not like links to other pages. NN/g: "In-page links need to be differentiated from other links on the page so users understand where they will lead."
- [weak] **File each entry under its significant first letter:** "The Button guide" goes under B, and "É" under E.

**Cases**
- A component index lists 140 names, and readers arrive knowing "date picker" → an A–Z index with letter links helps. Search still matters for readers who don't know the name.
- A university-style "everything" list in internal jargon → no A–Z index. NN/g found such a listing "was not helpful for users", because visitors didn't know the official names.
- Readers look for "Lozenge" but the component is now "Tag" → add "Lozenge, see Tag" under L, linking to Tag's entry.
- The letter row hides X and Z because they have no entries, and the row changes length between sites → show them dimmed and not linked.
- A jump to "M" lands the heading under the sticky header → give letter headings a `scroll-margin-top` ([in-page navigation](#in-page-navigation-on-this-page)).

**Accessibility**
- [required] 2.4.5 Multiple Ways, 1.3.1 (a labelled `nav` and a heading per letter), 2.4.4 Link Purpose, 2.4.11 Focus Not Obscured after a jump, 2.5.8 Target Size for the letters.
- [required] Implementation: code-standard rule 1 (the labelled `nav` and headings without gaps), code-standard rule 62 (an empty letter is a link with no `href`), code-standard rule 29.

**Build**
- [required] Use `<nav aria-label="A to Z">` holding a `ul` of 26 `li`s. A letter with entries is `<a href="#letter-m">M</a>`, and each letter section is an `h2 id="letter-m"` followed by a `ul` of links ([HTML semantics: *Navigation markup*](../../code/html-semantics.md#navigation-markup)).
- [required] **An empty letter** is `<a aria-disabled="true">Q</a>` with no `href`, per code-standard rule 62. With no `href` it is not a link, so it takes no focus and is read as plain text. That is right, because there is nothing to reach. Never keep the `href` and add `aria-disabled`: MDN notes "`aria-disabled` does not change the focusability" of an element, so the letter stays in the tab order and still jumps ([MDN `aria-disabled`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-disabled)). The dim is styled off `[aria-disabled]`, from the disabled-state token.
- [weak] No heading is written for an empty letter. The row says the letter is empty; an empty heading adds a stop that says nothing.
- [required] Entries, letters and cross-references are generated from the pages and their recorded synonyms (code-standard rule 29). They are sorted with `Intl.Collator`, and grouped by a first letter taken after `normalize('NFD')` strips the accent, so "É" lands under E.
- [moderate] The row wraps rather than scrolls. Each letter keeps the touch-target size ([responsive: *Touch targets*](../../code/responsive.md#touch-targets)), and `scroll-margin-top` on the letter headings comes from the sticky header's height token.

**Check**
- *Script:* could check that the row has 26 items, that every `a[href^="#letter-"]` resolves to a heading, that every letter with no heading has no `href`, that no `a[href][aria-disabled]` exists, and that every "see" entry links to an entry on the page.
- *Judgement:* do readers know the names this index is sorted by? Which synonyms do they search for that the index lacks?

**Sources:** NN/g as linked; MDN for `aria-disabled`. GOV.UK, Carbon and Atlassian publish no A–Z index pattern. NN/g's own articles pull two ways: alphabetical order "must (mostly) die" for menus and categories, yet it works for an index of known names. The toolkit uses an A–Z index only for known-item lookup, with synonyms to cover the names readers bring.

## Skip links

**Use when / don't use**
- [moderate] Use on every page with repeated blocks before the content (a header, global navigation, breadcrumbs). GOV.UK requires one on every page ([GOV.UK skip link](https://design-system.service.gov.uk/components/skip-link/)).
- [required] A page whose navigation sits after the content may not need one ([W3C Understanding 2.4.1](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)); landmarks and headed sections are among its sufficient techniques, and the page keeps them either way.

**How**
- [moderate] The first focusable element, right after `<body>` (after a cookie banner if there is one), reading "Skip to main content", targeting `main`.
- [moderate] Visually hidden until focused, then visible with the focus ring, at the top left, above everything.
- [weak] Activating it moves focus to the target (GOV.UK added script to move focus for consistent screen-reader behaviour).

**Cases**
- The skip link targets `#content` but no element has that `id` → point it at `main`'s `id`; a link to nothing is a silent failure.
- The link appears on focus but behind the sticky header → raise its stacking order.
- A tool page has a long filter bar before the list → a second skip link "Skip to results" is reasonable; more than two becomes its own navigation.

**Accessibility**
- [required] 2.4.1 Bypass Blocks, 2.4.7 Focus Visible (visible on focus), 2.4.11 Focus Not Obscured.
- [required] Implementation: code-standard rule 1 (one `main`, landmarks), code-standard rule 2.

**Build**
- [moderate] `<a class="skip-link" href="#main">Skip to main content</a>` as the first child of `body`, and `<main id="main" tabindex="-1">` so focus lands there in every browser ([accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- [required] Hidden until focused with the visually-hidden utility, which releases on `:focus` ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)); never `display: none`, which removes it from the tab order.
- [required] On focus it sits above the sticky header with a stacking token, never a literal `z-index` (code-standard rule 22).
- [required] A second "Skip to results" link targets the list's heading `id`; landmarks do the rest (code-standard rule 1, [HTML semantics: *Landmarks*](../../code/html-semantics.md#landmarks)).

**Check**
- *Script:* could check the first focusable element is a link whose `href` fragment matches an existing element inside or equal to `main`, and that it is visible when focused.
- *Judgement:* none beyond the script; it is mechanical.

**Sources:** GOV.UK and W3C as linked.

## Back behaviour

**Use when / don't use**
- [moderate] Every view the reader perceives as a new page gets its own history entry, so Back returns to it: a tab that changes the address, a filter or sort change, a page of results, an opened overlay ([Baymard back button](https://baymard.com/blog/back-button-expectations)).
- [moderate] Don't push an entry for minor changes: each keystroke in a search box, a truncated "read more" ("Truncated content should in general never be implemented as a new 'page'", Baymard).
- [weak] Don't draw an in-page "Back" link where the browser's Back does the same thing, except in a linear journey (GOV.UK's back link in forms) or as a "Back to results" that restores filters.

**How**
- [moderate] Tabs, filters, sort and page number round-trip through the address, pushed for perceived view changes and replaced for typing ([ux: state persistence and restore](../design/ux.md#state-persistence-and-restore)).
- [moderate] Back closes an overlay the reader opened, and does not skip past the page under it; Baymard found 37% of sites fail this.
- [moderate] Returning to a list restores scroll position and the item the reader left from.

**Cases**
- A reader applies three filters, opens a row and presses Back → the list returns with the same three filters, page and scroll position.
- Back from an opened dialog leaves the site → push an entry when the dialog opens, close it on `popstate`.
- A breadcrumb is used as the back route from a filtered list → add a "Back to results" link that restores the filtered address; the breadcrumb goes to the unfiltered parent, by design.

**Accessibility**
- [required] 3.2.5 Change on Request (AAA, worth meeting: views change only when asked), 2.4.3 (focus lands at the top of the restored view or on the item left from), 3.3.4 for not losing entered data.
- [required] Implementation: code-standard rule 14 (keep the reader's place on a live swap), code-standard rule 20 (filters as GET forms make the address real without script).

**Build**
- [weak] Push for a view change (tab, filter, sort, page, an opened overlay), replace while typing; restore on `popstate` from `location.search` ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- [required] Filters and paging are GET forms and links first, so the browser makes the history entries without script (code-standard rule 20).
- [weak] An overlay that owns an entry: `pushState` on open, close on `popstate`, and `history.back()` from its close button so the entry does not linger.
- [required] Returning to a list restores scroll and focus: `history.scrollRestoration` stays `"auto"` for full loads; a scripted swap restores both itself ([javascript: *Re-rendering without losing focus or scroll*](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll); code-standard rule 14).
- [weak] An in-page "Back to results" is a link whose `href` is the filtered address, never `history.back()`, so it works from a shared link.

**Check**
- *Script:* could change a filter, a tab and a page, press Back three times, and assert each previous state returns; could assert the address after reload reproduces the view.
- *Judgement:* which changes would the reader call a new page?

**Sources:** Baymard as linked; GOV.UK tabs put the tab in the address so Back returns to the previous tab ([GOV.UK tabs](https://design-system.service.gov.uk/components/tabs/)).
