# Disclosure: accordions, details, show more and expandable rows

Patterns that hide part of the content until the person asks for it: show more and truncation, expandable table rows, how deep disclosure may go, and what tabs and accordions become on small screens. It serves design-standard's principles *as little as possible, and no simpler* (hide only what most people do not need) and *discoverable* (what is hidden is plainly there), and works out how far progressive disclosure may go (two levels). The fundamental is in [`../design/ux.md`](../design/ux.md) (*Progressive disclosure*); floating disclosures (popovers, menus) are in [`dialogs.md`](dialogs.md); accordions and the `details` element are [`../components/accordion.md`](../components/accordion.md); tabs are [`../components/tabs.md`](../components/tabs.md).

## Show more and truncation

**Use when / don't use**
- [weak] **Show more** when there is a lot of overflow content and the first part is enough for most people: a long description, a long list in a card, comment threads. Carbon's [overflow content](https://carbondesignsystem.com/patterns/overflow-content/): a "Show more" button "is used when there is a significant amount of overflow content."
- [weak] **Truncation with an ellipsis** for item names, URLs and paragraphs in tight containers; a breadcrumb trail scrolls instead of truncating ([breadcrumbs on small screens](../components/breadcrumbs.md#breadcrumbs-on-small-screens)). Carbon: "Truncation should not be used on page headers, titles, labels, error messages, validation messages, or notifications." Button labels are not truncated either ([`actions.md`](actions.md)).
- [weak] Prefer neither. Primer's [truncate accessibility](https://primer.style/product/components/truncate/accessibility/): "Can I wrap the text instead of truncating?" and "Can I give the element in question more real estate to expose all text?"

**How**
- [required] **Every truncation has a way to read the whole.** WCAG's [Understanding 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): ellipsis truncation is acceptable when "a mechanism is provided to reveal the truncated text" or the text is a link whose page reveals it; "if there is no mechanism to show the truncated text, it fails."
- [required] **That mechanism works for keyboard users.** A `title` tooltip does not: Primer warns there is "no browser-native mechanism to show title tooltips when navigating with a keyboard." Use an explicit control (Show more), a link to the full item, or a focusable element that reveals the text on focus (WCAG 2.1.1).
- [weak] **Never truncate interactive content.** Primer: "do not truncate text if it contains focusable elements such as links, buttons, and mentions/tags", nor hide focusable elements behind truncation.
- [weak] **Truncate meaningfully.** An ellipsis stands for three or more characters (Carbon). End-line for prose; mid-line when strings share beginnings and endings, such as file paths (Carbon); never mid-word in a name people compare.
- [weak] **Show more**: a button, labelled for what it reveals ("Show 12 more comments", "Show full description"), placed where the cut is; after expanding, "Show less" may collapse (Carbon). Carbon prefers it to fades or inner scrolling "as they are more prominent and actionable".
- [required] **Only when there is more.** The control renders only when content exceeds the cut (code-standard rule 12); the cut is decided in the page model with fixtures, not in the template (code-standard rule 29), and holds for any length the content can take (code-standard rule 57).
- [weak] **Cut by lines, not characters**, so the cut follows the reader's font size and language.
- [weak] **Load more** when performance is the reason (Carbon); pagination and loading are in [`pagination.md`](pagination.md).

**Cases**
- A card description cut at 120 characters with "…" and no way to read the rest → cut at three lines with "Show full description", or link the card to its page where the text is whole (1.4.12's link exception).
- File paths in a table column all start with the same long prefix → mid-line truncation keeps the distinguishing end visible, with the full path available on focus or in the detail view.
- A "Read more" link under every excerpt on a listing → name it for its article or make the title the link; repeated "Read more" says nothing out of context ([Primer content](https://primer.style/product/getting-started/foundations/content): link text should be "clear, unique, and informative").
- A "Show more" shown on a description that is already short → render it only when the text overflows (code-standard rule 12).
- An error message truncated to fit a toast → never; Carbon excludes error and validation messages from truncation.

**Accessibility**
- [required] 1.4.12 Text Spacing and 1.4.4 Resize Text: truncation that appears only when text is spaced or enlarged still needs a reveal.
- [required] 1.4.10 Reflow: at 320px, wrap before truncating.
- [required] 2.1.1 Keyboard: the reveal works by keyboard. 4.1.2: a Show more button exposes `aria-expanded` when it expands in place.
- [required] Focus after "Show 12 more" lands on the first new item, or stays on the button with its new count announced (code-standard rule 14).

**Build**
- [weak] Keep the whole text in the DOM and cut by lines in CSS; the prefixed line clamp is the dependable form today ([responsive: *Truncation and line clamps*](../../code/responsive.md#truncation-and-line-clamps) owns the snippet and its support note).
- [required] "Show more" is a `button type="button"` with `aria-expanded` and `aria-controls`, rendered only when the box overflows (code-standard rule 12); "Show 12 more" that appends items is a load-more link instead ([pagination: load more](pagination.md#load-more)).
- [required] No `title` as the reveal; a link to the full item, or the button (code-standard rule 18 when icon-only).
- [required] Mid-line truncation of paths is done on the server into two spans (start and end), with the full string as the accessible text, never by deleting characters (code-standard rule 29, code-standard rule 57).
- [weak] A repeated "Read more" gets a fuller name from the item's title through `aria-labelledby` or a visually hidden span ([accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).

**Check**
- *Script* could: find elements with `text-overflow: ellipsis` or `-webkit-line-clamp` whose content overflows, and assert each has a keyboard-reachable reveal or sits in a link; flag truncation inside headings, labels, buttons and alerts; flag a Show more control on content that does not overflow; flag link text "Read more" or "More" without a fuller accessible name.
- *Judgement*: would wrapping or more room avoid the truncation altogether?

**Sources.** Carbon pairs end-line truncation with a browser `title` tooltip in its code; Primer and WCAG's Understanding say that alone fails keyboard users. This section follows Primer and WCAG: an explicit, keyboard-reachable reveal.

## Progressive disclosure depth

**Use when / don't use**
- [moderate] Whenever a design hides advanced or rare options: one level of disclosure for the secondary set, rarely two, never three.
- [weak] Not to hide what most people need. Carbon's [disclosures pattern](https://carbondesignsystem.com/patterns/disclosures-pattern/): "Do not hide important information inside of a disclosure."

**How**
- [weak] This section owns disclosure depth; [ux: progressive disclosure](../design/ux.md#progressive-disclosure) keeps the principle.
- [moderate] **Two levels at most.** NN/g's [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): "designs that go beyond 2 disclosure levels typically have low usability"; with three or more, "consider simplifying your design" or chunk the advanced features into groups people can ignore.
- [weak] **Count across surfaces.** A card that opens a dialog that opens a drawer is three levels, whatever each component is called. A dialog that contains an accordion is two.
- [weak] **Get the split right.** NN/g: the split between initial and secondary features comes from task analysis and frequency of use. A wrong split charges frequent users a click on every visit.
- [moderate] **Make the step obvious.** NN/g: it "must be obvious how users progress from the primary to the secondary disclosure levels"; Primer: icons paired with descriptive text, and disclosure "used sparingly, only when it's necessary to truncate information".
- [strong] **Don't nest the same pattern.** GOV.UK: avoid accordions, tabs and details "within one another"; Carbon: "Do not nest one disclosure within another"; Apple: one disclosure button per view.
- [weak] **Keep context.** Primer: avoid interactions that "drastically disorient the user's initial point of focus"; expand in place, don't jump.

**Cases**
- A settings page: basics visible, "Advanced" disclosure, and inside it a second "Expert" disclosure → two levels is the limit; merge Expert into Advanced with sub-headings, or move it to its own page.
- An overview card → modal → drawer for a finding's detail → the card links to a detail page; the page uses one disclosure for raw measurements.
- A component page showing the verdict first and the measurement table behind one disclosure → one level, the right split.
- Tabs whose panels contain accordions whose panels contain `details` → flatten to tabs with headings inside, or accordions with headings inside.

**Accessibility**
- [required] 1.3.1: each level is a real heading or a labelled control, so the structure is perceivable.
- [required] 2.4.3: opening a level moves nothing; focus stays on the control that opened it unless the level is a dialog.
- [required] Every disclosed region works with scripts off (code-standard rule 20).

**Build**
- [required] Count depth in the markup: nested `details`, `[aria-expanded]` triggers and `dialog`s inside one another; a component never contains its own kind (code-standard rule 8).
- [weak] Every level is a real heading or a named control, so the outline holds the depth ([HTML semantics: *Headings and the outline*](../../code/html-semantics.md#headings-and-the-outline)).
- [weak] Opening a level expands in place and leaves focus on its trigger, except a `dialog`, which takes focus ([accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- [required] Every level's content is in the server-rendered page (code-standard rule 20).

**Check**
- *Script* could: from the first view, count nested disclosure controls (`aria-expanded`, `details`, dialog triggers inside dialogs) on the deepest path and flag more than two; flag a disclosure trigger with no text.
- *Judgement*: is the split based on what people open most, and does anyone frequent pay a click for it every time?

**Sources.** NN/g sets the two-level ceiling; GOV.UK, Carbon and Apple all forbid nesting their own disclosure components; Primer asks for restraint. No source found allows three.

## Expandable table rows

**Use when / don't use**
- [weak] Supplementary detail for a row that most people will not need for most rows, or that is slow to fetch. Carbon's [data table](https://carbondesignsystem.com/components/data-table/usage/): "Use the expanded section for supplementary information or data that needs additional query time."
- [weak] Not when the expanded area is cramped or holds a task. Carbon: then "consider taking the user to a dedicated page, side panel, or data table".
- [required] Not to hide a column people compare; comparison wants columns (design-standard rule 8, a fixed set of attributes is columns).

**How**
- [weak] **The control** is a disclosure button in the first column; with selection, the expand control comes first, left of the checkbox (Carbon).
- [weak] **Name it with the row**: "Show details for invoice 1042", so a list of buttons is usable.
- [weak] **Expanded content** spans the table's width under its row, in the row's reading order, at least as wide as the columns it explains.
- [weak] **Expand all** is off by default (Carbon: expanding every row "will typically negate" the saved loading); offer it in the header only when people need to scan everything.
- [weak] **Loading**: a skeleton in the expanded area while detail loads (Carbon); the row height above does not change (design-standard rule 2).
- [weak] **Several open** may be allowed; opening one never closes or moves another the person is reading.
- [weak] **Small screens**: a table that becomes cards can show the expanded content as a `details` inside each card; tables at small sizes are in [`tables.md`](tables.md).

**Cases**
- An invoices table with line items behind each invoice → expandable rows, line items fetched on expand, skeleton meanwhile.
- An expanded row holding an edit form with eight fields → a side panel or a page.
- Rows where the most important figure is only visible when expanded → make it a column.
- An "Expand all" that fires two hundred requests → remove it, or load summaries in one request.

**Accessibility**
- [required] 4.1.2: the row's button exposes `aria-expanded` and an accessible name with the row's identity (code-standard rule 18 when it is icon-only).
- [required] 1.3.1: the expanded content is associated with its row (in the row's following row, or with `aria-controls`); table semantics stay intact.
- [required] 2.5.8: the expand chevron's target is at least 24 by 24.
- [weak] Focus stays on the button after expanding.

**Build**
- [required] The trigger is a `button type="button"` with `aria-expanded` and `aria-controls` in the row's first cell, before any selection checkbox, named with the row ("Show details for invoice 1042"; code-standard rule 18).
- [weak] The detail is the next `tr` holding one `td colspan` across the table, `hidden` until opened; table semantics stay intact ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data), [*Table behaviour*](../../code/html-semantics.md#table-behaviour)).
  ```html
  <tr><td><button type="button" aria-expanded="false" aria-controls="d-1042">Show details for invoice 1042</button></td>…</tr>
  <tr id="d-1042" hidden><td colspan="6">…</td></tr>
  ```
- [required] Detail fetched on first open shows a skeleton of the final height, then swaps in place; focus stays on the button (code-standard rule 14).
- [required] Without script the button is a link to the row's detail page (code-standard rule 20).
- [weak] The chevron rotates from `[aria-expanded="true"]`; its target meets [responsive: *Touch targets*](../../code/responsive.md#touch-targets).

**Check**
- *Script* could: for each row expand button, assert a name that differs per row, `aria-expanded` toggles, and the rows above do not move when it opens; flag an expand-all control on a table whose expansions each fetch.
- *Judgement*: is anything people compare across rows hidden inside the expansion?

**Sources.** Carbon is the only system read that documents expandable rows in depth; the accessibility half applies the W3C [disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) to a row.

## Tabs or accordion on small screens

**Use when / don't use**
- [weak] When a design has content tabs (sections of one page, such as Overview, Specifications, Reviews) and must work at narrow widths.
- [required] View-switching tabs that choose what a screen shows are governed by design-standard rule 3 (one row, scroll when they overflow, never wrap) and stay tabs.

**How**
- [weak] **Content tabs become stacked sections.** GOV.UK's [tabs](https://design-system.service.gov.uk/components/tabs/): without JavaScript, tabbed content shows "on a single page, in order from first to last, with a table of contents that links to each of the sections", and "This is also how the component currently behaves on small screens, though more research is needed on this."
- [weak] **Or an accordion**, when sections are long, independent and most people need one. NN/g's [tabs, used right](https://www.nngroup.com/articles/tabs-used-right/): accordions "are particularly useful on mobile devices, where they work better than tabs due to the limited screen space", and on desktop tabs may be preferable because closed accordions "can make the page seem too empty".
- [required] **Decide the switch by the content**: tabs that overflow by a label or two keep one row that scrolls, never wrapped or truncated (design-standard rule 3; [tabs](../components/tabs.md#tabs)); when most labels would sit out of view, switch to sections or an accordion. NN/g: hidden tabs in a scrolling tab bar "become less discoverable".
- [weak] **Each section keeps a heading** that repeats its tab label (GOV.UK: "Include a heading at the beginning of each tab"), so the stacked or accordion form has the same outline.
- [required] **One source, two presentations**: the same markup renders as tabs at wide widths and sections or accordion at narrow ones; no duplicated content (code-standard rule 36 on one implementation).
- [weak] **The selected tab** maps to the open accordion section or the scrolled-to section, so a shared address opens the same content ([ux: state persistence and restore](../design/ux.md#state-persistence-and-restore)).

**Cases**
- A product page with five content tabs on a phone → stacked sections with an "On this page" list at the top, or an accordion if Reviews is very long.
- A dashboard's tabs choosing which file the screen shows (design-standard rule 3) → stay tabs and scroll horizontally on a phone.
- Three short content tabs that fit at 320px → keep tabs.
- An accordion on desktop that leaves the page nearly empty → tabs or headings at wide widths, accordion only on narrow ones (NN/g).

**Accessibility**
- [required] 1.3.1 and 2.4.6: headings persist in every presentation.
- [required] 1.4.10 Reflow: at 320px nothing scrolls sideways except a view-switching tab row, which design-standard rule 3 allows.
- [required] 4.1.2: tabs expose `tablist`, `tab`, `tabpanel` with selection; the accordion form exposes `aria-expanded`; each form is complete in its own semantics, never a mix.
- [required] The no-script form is the stacked form (code-standard rule 20).

**Build**
- [weak] One markup: headed sections in order. Wide, the script adds the [APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) roles and keys; narrow, it adds accordion buttons or nothing (stacked) ([accessibility: *Composite widgets and roving tabindex*](../../code/accessibility.md#composite-widgets-and-roving-tabindex)).
- [weak] Switch on a container query or a `matchMedia` listener tied to the same breakpoint token, tearing down one set of roles before adding the other, so the two semantics never mix ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)).
- [weak] The selected tab and the open section are the same fragment (`#reviews`), so one address opens the same content in both forms ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- [required] One module owns both presentations (code-standard rule 36); the stacked form is the no-script form (code-standard rule 20).

**Check**
- *Script*: tools/ui-check/check.mjs: design-standard rule 3 (tabs keep one row and scroll). Could: at 320px, assert content tabs either fit without truncation or render as sections with headings; assert the same headings exist in both presentations.
- *Judgement*: are these tabs views of one context (stay tabs) or sections of one page (stack them)?

**Sources.** GOV.UK stacks content tabs on small screens and flags it as needing research; NN/g recommends accordions on mobile. The items give each its case: GOV.UK's stacking as the default form, NN/g's accordion for long, independent sections.
