# Pagination

How a long list is split and walked: whether to page it, load more on request or load as the reader scrolls; what a pager holds and how it shortens on a small screen; how many items a page shows; the range, total and a way to jump; and how paging lives with filters, sorting, the address and the Back button. It serves the principles *show state* (the reader always knows where in the list they are and how much is left), *people in control* (the reader asks for more; nothing loads or moves on its own) and *for everyone, in any context* (paging that a keyboard and a screen reader can use, and a footer that stays reachable). It applies design-standard rule 2 (the pager does not move when the page changes) and design-standard rule 11 (the total counts what the list counts). It supersedes the short section navigation.md used to hold, which now only points here; paging inside a data grid is [data grid: pagination or virtual scroll](data-grid.md#pagination-or-virtual-scroll), and a table's own pager is [tables: pagination or load more](tables.md#pagination-or-load-more). Moving through a linear journey such as a form is never pagination: it is a Continue button and a Back link ([forms](forms.md#form-structure)).

## Choosing pagination, load more or infinite scroll

**Use when / don't use**
- **Pagination** when readers look for something specific, compare items, return to a place or share it: every page has an address, Back returns to it and the footer is reachable. NN/g suits it to "goal-driven" listings, where each page is a manageable set the reader can refind ([NN/g infinite scrolling, Neusesser 2022](https://www.nngroup.com/articles/infinite-scrolling-tips/)). This is the toolkit's default for tools, dashboards and documentation.
- **Load more** when most readers need only the first batch and the rest is browsed: it keeps the footer reachable and leaves the reader in charge, at the cost of a click per batch ([NN/g](https://www.nngroup.com/articles/infinite-scrolling-tips/)).
- **Infinite scroll** only for a feed of similar items browsed with no particular goal; NN/g advises against it when readers need to "Find something specific" or "Compare items in a long list" ([NN/g](https://www.nngroup.com/articles/infinite-scrolling-tips/)). GOV.UK says to avoid it because it "causes problems for keyboard users" ([GOV.UK pagination](https://design-system.service.gov.uk/components/pagination/)). Friedman's own advice ends at the same place: when in doubt, page ([Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/03/designing-better-infinite-scroll/), commentary).
- **No paging at all** when the whole list loads fast and stays usable: GOV.UK splits content only when it improves performance or usability, and NN/g says linear content such as an article should "almost never be broken up" ([NN/g, View All, Nielsen](https://www.nngroup.com/articles/item-list-view-all/)).
- Don't page a form, a wizard or any sequence the reader must take in order ([Carbon pagination](https://carbondesignsystem.com/components/pagination/usage/); GOV.UK).

**How**
- Decide by the reader's task, written in the design notes: "find, compare, return" picks pagination; "browse the first few" picks load more; "pass time in a feed" is the only case for infinite scroll.
- Decide once per kind of list across a product, so every queue, log and catalogue pages the same way (design-standard principle *consistent, not uniform*).
- Start short: NN/g's advice is a fairly short first page with a way to go further, not a long one that scrolls past what most readers need.

**Cases**
- A change log of 900 entries → pagination with the page in the address; readers return to "where I was", and an infinite list sends them back to the top.
- An icon gallery is browsed, rarely searched → load more, with focus on the first new icon.
- A team asks for infinite scroll on a triage queue → pagination: the queue is worked item by item, linked to and returned to.
- A component list of 40 entries → no paging; it loads in one go and the reader can use find-in-page.
- An article split across five pages "to raise page views" → one page; linear content is not paged.

**Accessibility**
- 2.1.1 Keyboard (an infinite list keeps keyboard users from the footer), 2.4.5 Multiple Ways (a paged list with an address can be reached directly), 2.4.8 Location (the reader can tell where in the list they are), 3.2.3 Consistent Navigation (the same paging on every list of a kind).

**Build**
- *Elements:* pagination is a `nav` of real links (`a href="?page=3"`); load more is a `button`; infinite scroll is the only one that needs script to exist at all.
- *ARIA and keyboard:* no APG pattern governs a pager; it is a navigation landmark ([APG landmarks](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/)) holding links. An infinite list borrows the [APG feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) (below).
- *States:* `aria-current="page"` on the current page link.
- *Rules:* code-standard rule 20 (paging works without script), code-standard rule 64 (the current page is marked), code-standard rule 1 (the pager is a labelled landmark).
- *Detail:* [code: progressive enhancement](../../code/javascript.md#progressive-enhancement), [code: navigation markup](../../code/html-semantics.md#navigation-markup).

**Check**
- *Script:* could flag a list that loads on scroll with no paged or load-more fallback, and a list whose footer cannot be reached by tabbing.
- *Judgement:* What is the reader's task with this list: find, browse or pass time? Is it written down?

**Sources:** NN/g, GOV.UK, Carbon and Friedman as linked. NN/g says no option is "overall superior"; the toolkit defaults to pagination for tools and docs because their lists are worked, linked and returned to, and allows load more for galleries.

## Pagination anatomy

**Use when / don't use**
- **Numbered pager** (Previous, page numbers, Next) for pages of similar items: search results, logs, queues ([GOV.UK pagination](https://design-system.service.gov.uk/components/pagination/), its list style).
- **Previous and Next only, labelled with the neighbour's title** for a short run of related pages read in order, such as a guide split into parts (GOV.UK's block style).
- Don't show a pager when there is only one page (GOV.UK).

**How**
- **Order:** Previous, numbers, Next, left to right in reading order; Previous is absent on the first page and Next on the last (GOV.UK), never shown disabled, so nothing in the pager invites a click that does nothing.
- **Which numbers:** always the first and last page, the current page and at least one either side; an ellipsis stands for each skipped run ("1 … 4 [5] 6 … 20"). On a small screen GOV.UK keeps first, previous, current, next and last; Atlassian caps at seven slots including ellipses on small screens and 14 on large ([Atlassian pagination](https://atlassian.design/components/pagination/usage)); Primer defaults to one page at each end and two around the current ([Primer pagination](https://primer.style/product/components/pagination/)).
- **The ellipsis is not a control.** Atlassian: it cannot be selected; the reader picks a nearby number. A reader who must reach page 37 of 80 directly gets a jump field (*Range, total and jump to page* below).
- **Current page:** marked by more than colour (filled background or a heavy underline plus weight), and not looking like hover.
- **Fixed width:** the pager keeps one width as the reader pages, so Next does not slide under the pointer when the numbers change length (design-standard rule 2). Reserve room for the widest arrangement, or keep Previous and Next at the ends with the numbers centred between them.
- **Placement:** under the list, where the reader finishes it; for a long table, also above it, the same pager twice, never two different ones. Carbon fixes its table pager directly under the table with no gap ([Carbon pagination](https://carbondesignsystem.com/components/pagination/usage/)).
- **Labels:** "Previous" and "Next" as words beside the arrows; an arrow alone is a guess at small sizes.

**Cases**
- Page 7 of 7 still shows a greyed Next → remove it; GOV.UK omits it.
- Going from page 9 to page 10 moves Next 12px right and the reader's second click lands on "10" → keep the pager's width stable (design-standard rule 2).
- A pager shows 1–20 as twenty links → first, last, current and one either side with ellipses; twenty links wrap and bury the current page.
- A guide in four parts uses numbers 1–4 → Previous and Next labelled with the neighbouring part's title; numbers say nothing about what is on the next page.
- The ellipsis is a button that opens a menu of hidden pages → keep it inert and give a jump field if direct access matters.

**Accessibility**
- 1.4.1 Use of Color (current page not by colour alone), 2.4.4 Link Purpose (each number's name says "Page 3"), 2.5.8 Target Size (numbers are at least 24px targets, larger on touch), 1.4.10 Reflow (the pager fits 320px without scrolling), 2.4.7 Focus Visible. In Figma: figma-standard rule 26 (targets), figma-standard rule 31 (current, hover and focus draw differently), figma-standard rule 32.

**Build**
- *Elements:* `<nav aria-label="Pagination">` holding a `ul` of `li > a`; the ellipsis an `li` with the character and no link; `rel="prev"` and `rel="next"` on the neighbours (GOV.UK's markup).
- *ARIA and keyboard:* no composite widget, so no arrow-key model: each link is a Tab stop and Enter follows it. Each number carries a name ("Page 3") through visible text plus a visually hidden prefix or `aria-label` (GOV.UK, Atlassian).
- *States:* `aria-current="page"` on exactly one link ([MDN aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-current): "Only mark one element in a set of elements as current"); Previous and Next are absent, not `disabled`, at the ends.
- *Rules:* code-standard rule 64 (current page), code-standard rule 20 (links, not buttons that call script), code-standard rule 21 (modified clicks open a page in a new tab), code-standard rule 18 (an arrow-only control is named), code-standard rule 12 (no pager renders for one page).
- *Detail:* [code: navigation markup](../../code/html-semantics.md#navigation-markup), [code: links and buttons](../../code/html-semantics.md#links-and-buttons), [code: keyboard access and modified clicks](../../code/accessibility.md#keyboard-access-and-modified-clicks).

**Check**
- *Script:* could assert one `aria-current` per pager, no Previous on page 1 and no Next on the last, every page control an `a[href]`, no pager when there is one page, the pager's bounding box the same on page 1 and page 9, and its height one row at 320px.
- *Judgement:* Does the reader need to reach arbitrary pages (numbers) or only the next one (Previous and Next)?

**Sources:** GOV.UK, Atlassian, Primer, Carbon and MDN as linked. They differ on how many numbers to show (Atlassian up to 14, Primer five around and two at the ends, GOV.UK at least one either side); the toolkit takes GOV.UK's minimum and adds numbers only while the pager stays one row.

## Page size and items per page

**Use when / don't use**
- One sensible default page size for every list, chosen for the reader's task, and no selector unless readers ask to see more at once.
- A **page-size selector** on data tables where some readers scan many rows (Carbon puts one in its table pager, [Carbon pagination](https://carbondesignsystem.com/components/pagination/usage/)).
- **View all** for a list that cannot be sorted well, capped: NN/g sets the upper limit at "around 100 items" ([NN/g, View All](https://www.nngroup.com/articles/item-list-view-all/)).
- Don't offer a menu of near choices (10, 20, 30, 40): NN/g calls it overkill.

**How**
- Default to a size that fills a screen or two of the list at its usual density: 20–50 rows for a tool table, fewer for cards. Friedman suggests starting smaller on mobile than on desktop ([Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/03/designing-better-infinite-scroll/), commentary).
- If a selector exists, two or three choices that differ substantially (NN/g's example: 10 and 50; close choices mean "use Next instead").
- Remember the reader's choice and use it next time (NN/g); put it in the address too, so a shared link shows the same page.
- Changing the page size keeps the first visible item in view: recompute the page that holds it, rather than jumping to page 1.
- On a small screen the selector may go (Carbon drops it at the small breakpoint) while range, total, Previous and Next stay.

**Cases**
- A findings table offers 10, 25, 50, 75 and 100 → 25 and 100; the middle choices add reading, not value.
- A reader on page 4 at 25 per page switches to 100 → show the page holding item 76, not page 1.
- A catalogue of 60 icons → no paging, or View all; 60 fits a scan.
- A list of 4,000 log lines with View all → cap it, or keep paging; NN/g's 100-item limit exists because a huge page is slow and hard to scan.

**Accessibility**
- 1.3.1 (the selector is a labelled control: "Rows per page"), 3.2.2 On Input (changing the size updates the list without moving focus or context), 4.1.3 Status Messages (the new range announced).

**Build**
- *Elements:* a native `select` with a visible `label`, inside the same GET form as the list's filters, so it works without script; a View all link carries `?per_page=all` or its equivalent.
- *ARIA and keyboard:* native select keyboard; no APG pattern needed.
- *States:* the selected size is the select's `selected` option and a query parameter.
- *Rules:* code-standard rule 20 (a GET form), code-standard rule 14 (focus stays on the select after the list swaps), code-standard rule 16 (the native select follows the theme).
- *Detail:* [code: search and filter forms](../../code/html-semantics.md#search-and-filter-forms), [code: state in the address and history](../../code/javascript.md#state-in-the-address-and-history).

**Check**
- *Script:* could assert the page size is a query parameter, survives a reload, and that changing it keeps the first visible item on screen.
- *Judgement:* Does anyone need a different size, or is the default right for nearly everyone?

**Sources:** NN/g and Carbon as linked; NN/g prefers one default plus View all to a selector, and the toolkit follows it for lists and keeps Carbon's selector for data tables only.

## Range, total and jump to page

**Use when / don't use**
- Always show the range and total near the list ("41–60 of 213"), counted the way the list counts (design-standard rule 11). Carbon's table pager shows both the item range and the page count ([Carbon pagination](https://carbondesignsystem.com/components/pagination/usage/)).
- A **jump to page** field or select only when readers have a reason to reach a page by number: very long lists sorted by something meaningful (date, name).
- Don't show a total you cannot compute; say "Showing 1–50" and offer Next, or "more than 1,000" when the backend can only estimate ([data: numbers](data.md#numbers)).

**How**
- The range sits above the list, beside its heading or the filter bar, where the reader looks first; the pager below repeats the page position ("Page 3 of 11").
- The page number goes into the document title: "Search results (page 3 of 11)" ([GOV.UK pagination](https://design-system.service.gov.uk/components/pagination/)).
- Jump to page is a small number field with a Go button, accepting only 1 to the last page, with an error that says the range; or a select of pages when there are fewer than about 50.
- A sorted list says what it is sorted by next to the range, so a page number means something ("Page 3, newest first").

**Cases**
- A pager shows page numbers but never the total rows → add "41–60 of 213"; the reader cannot judge whether to narrow the list.
- The count service times out → show the range without a total and keep Next; never "of 0".
- A 300-page audit log sorted by date → jump to page is less useful than a date filter; offer the filter.
- Two tabs of the window both read "Results" → put the page number in the title so they can be told apart.

**Accessibility**
- 2.4.2 Page Titled (page number in the title), 1.3.1 (the range is text associated with the list, not a decoration), 3.3.1 and 3.3.3 (a jump field's error says the valid range), 4.1.3 (a changed range announced politely when the list updates in place).

**Build**
- *Elements:* the range as text in the list's header, or a `caption` for a table; jump to page a `form method="get"` with `input type="number" min="1" max="N"` and a submit button.
- *ARIA and keyboard:* none beyond native; a range that updates without reload sits in a polite live region (`role="status"`).
- *States:* the page, size and sort are all query parameters, so the title and range are rendered by the server from them.
- *Rules:* code-standard rule 15 (the count is a description, not part of a control's name), code-standard rule 20, code-standard rule 12 (no total renders when it is unknown).
- *Detail:* [code: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages), [code: document metadata](../../code/html-semantics.md#document-metadata), [code: form errors and validation](../../code/html-semantics.md#form-errors-and-validation).

**Check**
- *Script:* could assert the title contains the page number, the range equals the rows shown, the total equals the unpaged count, and a jump beyond the last page is refused with a message.
- *Judgement:* Would a filter serve better than jumping by number?

**Sources:** Carbon and GOV.UK as linked; they agree on showing position, and the toolkit adds the total wherever it can be counted, per design-standard rule 11.

## Load more

**Use when / don't use**
- Use when most readers need only the first batch and the rest is browsed: galleries, related items, comments.
- Use as the hand-off after a few automatic batches where infinite scroll is kept (Friedman's hybrid: load on scroll for a while, then switch to a button, [Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/03/designing-better-infinite-scroll/), commentary).
- Don't use it for lists people search, compare or return to deep inside; pagination keeps their place more cheaply.

**How**
- One button after the last item, saying what it does: "Show 20 more", with what remains where known ("Show 20 more of 140").
- On press, the button shows it is working and stays put; the new items appear above it; focus moves to the first new item so a keyboard or screen-reader reader continues from there.
- The number loaded so far goes in the address (`?shown=60`), so a reload or Back returns to the same depth.
- When everything is loaded the button goes and the end is stated ("All 140 shown"); the footer follows.
- A load that fails keeps the items already shown and turns the button into a retry with the reason ([feedback: inline messages](feedback.md#inline-messages)).

**Cases**
- After Load more, focus stays on the button, now below 20 new cards → move focus to the first new card; otherwise a screen-reader reader hears nothing new.
- Back from an item detail returns to 20 items, not the 80 loaded → keep the count in the address.
- The button reads "Load more" with no count, in a list of 3,000 → say how many it adds and how many remain, or page the list.
- The last batch arrives and the button is still there, doing nothing → remove it and say the list is complete.

**Accessibility**
- 2.4.3 Focus Order (focus to the first new item), 4.1.3 Status Messages ("20 more loaded"), 2.5.8 Target Size, 2.1.1.

**Build**
- *Elements:* a `button` inside a form or an `a href="?shown=40"` that script enhances to fetch in place; the new items appended to the same list element.
- *ARIA and keyboard:* no APG pattern; borrow focus management from [APG feed](https://www.w3.org/WAI/ARIA/apg/patterns/feed/) only so far as setting `aria-busy="true"` on the list while it changes. Move focus with `tabindex="-1"` on the first new item.
- *States:* `aria-busy` on the list while loading; `hidden` on the button once all are shown; the loaded count in the address via `history.replaceState`. "20 more loaded" goes into a status region that was in the page from load, since a region inserted with its message is often not announced.
- *Rules:* code-standard rule 20 (the link works without script), code-standard rule 14 (a swap keeps the reader's place), code-standard rule 17 (`hidden` beats the stylesheet), code-standard rule 36 (one enhancement script for every load-more list).
- *Detail:* [code: focus management](../../code/accessibility.md#focus-management), [code: re-rendering without losing focus or scroll](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll).

**Check**
- *Script:* could press Load more and assert focus is on the first new item, the address reflects the count, a reload restores the depth, and the button is gone when the list is complete.
- *Judgement:* Do readers browse this list, or look for something in it?

**Sources:** Friedman and NN/g ([infinite scrolling](https://www.nngroup.com/articles/infinite-scrolling-tips/)) as linked; both treat load more as the middle ground, which the toolkit accepts for browsed lists.

## Infinite scroll

**Use when / don't use**
- Only for a feed of similar items browsed without a goal ([NN/g](https://www.nngroup.com/articles/infinite-scrolling-tips/)); never in a tool, docs site or searched list.
- If a product owner insists elsewhere, the toolkit's answer is load more, and this section says what infinite scroll must carry if it ships anyway.

**How**
- **Keep the footer reachable:** after a few automatic batches, switch to a Load more button, and give a way to reach the footer without racing the loader ([Smashing, Friedman 2022](https://www.smashingmagazine.com/2022/03/designing-better-infinite-scroll/), commentary; NN/g).
- **Restore position:** Back from an item returns to the same item, not the top ([NN/g](https://www.nngroup.com/articles/infinite-scrolling-tips/)).
- **Give landmarks:** a position indicator ("120 of 600") and visible breaks between batches so a reader can say where they stopped (NN/g; Friedman suggests marking where new items begin).
- **Signal loading** at the end of the list, so the end of what has loaded is not mistaken for the end of the list (NN/g).
- **Put position in the address** without filling the history: replace the address as batches load, so a shared link opens at that depth and Back still leaves the page (Friedman).
- **Load modestly:** smaller batches on slow connections (NN/g).

**Cases**
- A feed loads forever and the footer's contact link is unreachable → switch to Load more after three batches.
- Back from item 85 lands at the top → restore the scroll position and the loaded depth.
- Each batch pushes a history entry, so Back steps through ten batches before leaving → replace, do not push.
- Screen-reader readers hear nothing when new items arrive → mark the list as a feed with `aria-busy` during loads (Build below).

**Accessibility**
- 2.1.1 Keyboard and 2.4.1 Bypass Blocks (a way past the feed to the content after it), 2.2.2 Pause, Stop, Hide (content that updates automatically can be paused; load more satisfies it), 4.1.3, 2.4.3.

**Build**
- *Elements:* a list of `article` elements; a real paged URL behind it for no-script readers and crawlers. Loading is an `IntersectionObserver` watching a sentinel placed before a real load-more link, which stays as the fallback and as the hand-off that keeps the footer reachable.
- *ARIA and keyboard:* the [APG feed pattern](https://www.w3.org/WAI/ARIA/apg/patterns/feed/): the container `role="feed"` with a label, each item `role="article"` (or `article`) labelled by its title, `aria-posinset` and `aria-setsize` (`-1` when the total is unknown), `aria-busy="true"` while articles are added; recommended keys Page Down and Page Up between articles, Ctrl+End and Ctrl+Home to leave the feed, documented where readers find them, since APG says no convention exists.
- *States:* `aria-busy` during loads; the depth in the address by `replaceState`.
- *Rules:* code-standard rule 20 (a paged fallback), code-standard rule 14 (position kept on return), code-standard rule 36 (one implementation).
- *Detail:* [code: state in the address and history](../../code/javascript.md#state-in-the-address-and-history), [code: keyboard shortcuts](../../code/accessibility.md#keyboard-shortcuts), [code: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages).

**Check**
- *Script:* could scroll the feed and assert the footer becomes reachable by keyboard, the history length does not grow per batch, `aria-busy` returns to false, and Back restores the item in view.
- *Judgement:* Is this truly a goal-free feed? If anyone looks for something in it, page it.

**Sources:** NN/g, Friedman, GOV.UK and APG as linked. GOV.UK says avoid; NN/g and Friedman give conditions; the toolkit avoids it in everything it builds and keeps the conditions for a feed.

## Paging with filters, sort and the address

**Use when / don't use**
- Applies to every paged list that can also be filtered, searched or sorted ([filtering](filtering.md#filters-in-the-address), [filtering: sorting and filtering](filtering.md#sorting-and-filtering)).

**How**
- **Filter and sort the whole list, then page it:** never sort only the rows on the current page ([GOV.UK pagination](https://design-system.service.gov.uk/components/pagination/)).
- **Reset to page 1** after any filter, search or sort change (GOV.UK), and say so by the range updating.
- **A page that no longer exists** (page 9 after the list shrank to 3) goes to the first page, or the last valid one with the range explaining (GOV.UK sends the reader to the first).
- **One address holds everything:** page, size, sort and filters as query parameters, so a link, a reload and Back all reproduce the view ([javascript: state in the address](../../code/javascript.md#state-in-the-address-and-history)).
- **Back means the previous page of results:** each page change is a navigation with its own history entry; a filter change may replace rather than push, by the product's one choice.
- **Cursor or offset:** a backend that pages by cursor (after item X) cannot jump to page 37 or count pages; the design then shows Previous and Next with the range, and no numbers. Decide the pager with the engineers before drawing numbers the data cannot support.
- **Defaults that keep pages few:** GOV.UK asks for defaults that mean fewer pages to click through; a useful default sort puts what most readers want on page 1.

**Cases**
- A reader on page 5 filters to two pages of results and sees an empty page 5 → reset to page 1.
- Sorting by date sorts only the 20 rows shown → sort the whole set, then page.
- A shared link to page 3 opens page 1 because the page lives in script state → put it in the address.
- The design shows numbered pages, but the API pages by cursor → Previous and Next with "Showing 41–60"; or ask for offset paging if direct access matters.
- Back after changing the sort steps through every intermediate page the reader never chose → push one entry per page visited, not per redraw.

**Accessibility**
- 3.2.2 On Input (a filter change that resets to page 1 is announced through the range, not a context change), 4.1.3, 2.4.8 Location.

**Build**
- *Elements:* the filter form, the sort control and the pager share one GET form or build the same query string; the pager's links carry every current parameter.
- *ARIA and keyboard:* none beyond the parts' own.
- *States:* every view state as a query parameter; the server renders the page from the address alone.
- *Rules:* code-standard rule 20 (GET forms and links), code-standard rule 14 (focus kept on the control that changed the list), code-standard rule 36 (one script builds the query for filters, sort and pager).
- *Detail:* [code: state in the address and history](../../code/javascript.md#state-in-the-address-and-history), [code: search and filter forms](../../code/html-semantics.md#search-and-filter-forms).

**Check**
- *Script:* could apply a filter on page 5 and assert the list shows page 1, request a page past the end and assert a redirect to a valid page, and assert every pager link carries the current filters and sort.
- *Judgement:* Does the backend's paging support the pager drawn?

**Sources:** GOV.UK as linked; the cursor consequence is a mechanism, not a cited rule, and no source disagrees.
