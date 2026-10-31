# Disclosure: accordions, details, show more and expandable rows

Patterns that hide part of the content until the person asks for it: accordions, the `details` element, show more and truncation, expandable table rows, how deep disclosure may go, and what tabs and accordions become on small screens. It serves design-standard's principles *as little as possible, and no simpler* (hide only what most people do not need) and *discoverable* (what is hidden is plainly there), and works out how far progressive disclosure may go (two levels). The fundamental is in [`../design/ux.md`](../design/ux.md) (*Progressive disclosure*); floating disclosures (popovers, menus) are in [`dialogs.md`](dialogs.md); tabs are in [`navigation.md`](navigation.md) (*Tabs*).

## Accordions

**Use when / don't use**
- Several independent sections of which most people need one or two: FAQs, product details, reference sections, settings groups on a narrow screen. NN/g's [accordions on desktop](https://www.nngroup.com/articles/accordions-on-desktop/): use them "When users need only a few pieces of information on the page" and when sections are "independent and users are unlikely to need simultaneous access".
- Not when people will read most of it. Carbon's [accordion](https://carbondesignsystem.com/components/accordion/usage/): "If a user is likely to read all of the content, then don't use an accordion as it adds the burden of an extra click; instead use a full scrolling page with normal headers."
- Not for little content (NN/g: closed accordions make a short page "look mostly empty"), for deep hierarchies, for a series of questions (GOV.UK), or for anything everyone needs.
- Test the page without one first. GOV.UK's [accordion](https://design-system.service.gov.uk/components/accordion/): "Test your content without an accordion first", and prefer simplifying, splitting pages, headings on one page, or anchor links.

**How**
- **Accordion, tabs or a long page.** GOV.UK's decision: an accordion when the person needs more than one section at a time or there are many sections (they stack vertically); tabs when they switch quickly between few sections; one section of short, less important content is a `details`. A long page with headings and an "On this page" list when they read in order ([`navigation.md`](navigation.md), *In-page navigation*).
- **Start closed.** Carbon: "Accordions begin by default in the collapsed state with all content panels closed", which gives "a high level overview". NN/g's [accordions on mobile](https://www.nngroup.com/articles/mobile-accordions/) found an expanded first section hid the page's structure. Open a section at start only when evidence says most visitors need it, or when the address targets it.
- **Allow several open.** Carbon: "allowing for multiple sections to be open at once." NN/g: "Allow users to open or collapse multiple sections at a time"; auto-closing others stops people combining information. Exclusive groups (`details name`) only when sections are alternatives, such as one payment method at a time.
- **Expand all.** Offer "Show all sections" when there are many sections or people print; NN/g recommends it, and for printing to expand all.
- **Headings inside headings.** Each header is a button inside a heading whose level fits the page outline (W3C [accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/); GOV.UK uses `h2` and asks you to change the level to fit; Carbon: "Each title should be wrapped in a role heading"). Panels may contain sub-headings; never an accordion inside an accordion (GOV.UK).
- **Header text**: short, describes what will show, sentence case (GOV.UK: "Write the heading and summary line like any other button text"). A summary line only if needed, kept very short.
- **Signifier**: a chevron or plus at the end of the header; NN/g found "the caret and the plus work best"; Carbon puts it at the end so titles align with other text. Whole header clickable.
- **Scrolling**: the page scrolls, never the panel (Carbon: "Content should not scroll inside of an individual panel"). Don't scroll the opened section to the top: NN/g saw users think a new page had loaded and press Back. For a long open panel on mobile, a sticky header lets people close it (NN/g's Amazon example).
- **State**: GOV.UK remembers open sections within the session; with JavaScript off, all content shows under headings (code-standard rule 20).
- **Empty sections**: GOV.UK says "Do not disable sections"; remove the section, or explain inside it why it is empty.

**Cases**
- A product page with Description, Specifications, Delivery, Returns → an accordion, all closed, several may open; Delivery may start open if most visitors ask about it.
- An application-requirements page people read end to end → headings on one page with an "On this page" list (NN/g's university example).
- An FAQ of 30 questions → an accordion of questions with "Show all sections", or grouped under headings with an accordion per group.
- An accordion inside an accordion for a course structure → one level of accordion with sub-headings inside panels, or a tree view (Carbon) for real hierarchy.
- A section with no content for this user → remove it, or open to "No invoices yet" (GOV.UK). Note this differs from a filter option at zero, which design-standard rule 5 keeps visible and disabled.

**Accessibility**
- 4.1.2 Name, Role, Value: each header button exposes `aria-expanded`; the W3C pattern lets the button be "the only element inside the heading element".
- 1.3.1 Info and Relationships and 2.4.6 Headings and Labels: headers are real headings at the right level; markup is code-standard rule 1.
- 2.1.1 Keyboard: Enter and Space toggle; every header is in the Tab sequence (W3C).
- The W3C advises `role="region"` on panels except when more than about six can be open at once, to avoid landmark proliferation.
- Hidden panels are hidden from assistive technology too; `hidden` must beat the stylesheet (code-standard rule 17).

**Build**
- Each header is a `button type="button"` with `aria-expanded` and `aria-controls`, the only child of a heading at the outline's level; Enter and Space toggle, every header is a tab stop ([APG accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/); the snippet is [HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- Panels use `hidden="until-found"`, so find-in-page and a fragment link open them; listen for `beforematch` to set `aria-expanded` ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).
- The server renders headings and open panels; the script adds the buttons and hides panels when it starts, so no script reads as a headed page (code-standard rule 20).
- `role="region"` with `aria-labelledby` on panels only up to about six that can be open at once (APG).
- Open state is styled from `[aria-expanded="true"]`, the chevron rotated by that selector; an "Expand all" button sets every header in one handler (code-standard rule 9).
- Open sections persist in `sessionStorage` keyed by panel `id`, read before first paint to avoid a jump; a targeted fragment wins.

**Check**
- *Script* could: for each `aria-expanded` header, assert it is a button inside a heading, toggles its panel, and the heading levels fit the outline; assert every panel's content is present with scripts off (code-standard rule 20); flag an accordion nested in another.
- *Judgement*: would most visitors open most sections? If so, it should be a page with headings.

**Sources.** The W3C allows single-open accordions; Carbon, NN/g and GOV.UK default to several open. The toolkit allows several, because auto-closing breaks comparison and printing. NN/g's 2014 [desktop accordion article](https://www.nngroup.com/articles/accordions-complex-content/) argues long pages are often better on desktop; the toolkit agrees and treats the accordion as the exception there.

## Details and summary

**Use when / don't use**
- One section of help or detail that only some people need, below the content it explains. GOV.UK's [details](https://design-system.service.gov.uk/components/details/): "Use the details component instead of tabs or an accordion if you only have 1 section of content."
- Not for information most people need: "Do not use the details component to hide information that the majority of your users will need" (GOV.UK).
- Not as a menu or popover without adding Escape and click-outside (code-standard rule 19).

**How**
- Native `details` and `summary` first: open state and keyboard come free, and content shows without scripts (code-standard rules 8 and 20).
- **Summary text**: short and descriptive, so people can tell if they need it (GOV.UK: "Make the link text short and descriptive"), such as "Help with nationality". Never "More" or "Click here".
- **Signifier**: a triangle or chevron next to descriptive text. Primer's [progressive disclosure](https://primer.style/product/ui-patterns/progressive-disclosure/): "Pair progressive disclosure icons with descriptive text"; text-only toggles are discouraged. Apple's [disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls): "Provide a descriptive label… like 'Advanced Options.'"
- **Visual weight**: less prominent than an accordion (GOV.UK), so reserve it for secondary help.
- **Exclusive groups**: `details` elements sharing a `name` let only one open at a time (MDN [`details`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)); use that only for true alternatives.
- **Advanced options**: Apple puts the controls people most use at the top level and hides advanced ones behind one disclosure; "Use no more than one disclosure button in a single view."

**Cases**
- A form question with a "Why we ask this" explanation → a `details` under the field.
- Four `details` stacked as a pseudo-accordion → use the accordion pattern, with headings.
- A `details` used as a dropdown menu that stays open after a click elsewhere → add click-outside and Escape, or use a popover (code-standard rule 19).
- An "Advanced settings" `details` holding the one setting most people change → move that setting out.

**Accessibility**
- 4.1.2: `summary` is exposed as a button with expanded state natively. GOV.UK's research notes some voice-control users may need to call it a button, and some people avoid clicking because they expect it to navigate; descriptive text and a triangle help.
- 2.4.6: the summary text describes what opens.

**Build**
- Native `details` and `summary`: open state, keyboard and the expanded state come free; `open` is the state attribute to style from (`details[open] > summary::before`) ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- A shared `name` makes an exclusive group with no script; use it only for alternatives.
- The marker is replaced by a drawn triangle on `summary` (`list-style: none`, plus `::-webkit-details-marker { display: none }`), kept beside the text (code-standard rule 22 for its colour).
- Floating as a menu needs Escape and click-outside added, or a `popover` instead (code-standard rule 19; [accessibility: *Menus, menu buttons and toolbars*](../../code/accessibility.md#menus-menu-buttons-and-toolbars)).
- Nothing interactive inside `summary` but its text; a link there competes with the toggle (code-standard rule 8).

**Check**
- *Script*: code-standard rule 19 is checked in `tools/parity/pages.mjs` for floating `details`. Could: flag `summary` with fewer than two words or generic text; flag more than one advanced-options disclosure in a view.
- *Judgement*: would most people need what is inside?

**Sources.** GOV.UK styles the summary as a link; Primer and Apple pair an icon with text. The toolkit pairs a triangle or chevron with descriptive text, which addresses GOV.UK's own research finding that link styling makes some people expect navigation.

## Show more and truncation

**Use when / don't use**
- **Show more** when there is a lot of overflow content and the first part is enough for most people: a long description, a long list in a card, comment threads. Carbon's [overflow content](https://carbondesignsystem.com/patterns/overflow-content/): a "Show more" button "is used when there is a significant amount of overflow content."
- **Truncation with an ellipsis** for item names, URLs and paragraphs in tight containers; a breadcrumb trail scrolls instead of truncating ([navigation: breadcrumbs on small screens](navigation.md#breadcrumbs-on-small-screens)). Carbon: "Truncation should not be used on page headers, titles, labels, error messages, validation messages, or notifications." Button labels are not truncated either ([`actions.md`](actions.md)).
- Prefer neither. Primer's [truncate accessibility](https://primer.style/product/components/truncate/accessibility/): "Can I wrap the text instead of truncating?" and "Can I give the element in question more real estate to expose all text?"

**How**
- **Every truncation has a way to read the whole.** WCAG's [Understanding 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): ellipsis truncation is acceptable when "a mechanism is provided to reveal the truncated text" or the text is a link whose page reveals it; "if there is no mechanism to show the truncated text, it fails."
- **That mechanism works for keyboard users.** A `title` tooltip does not: Primer warns there is "no browser-native mechanism to show title tooltips when navigating with a keyboard." Use an explicit control (Show more), a link to the full item, or a focusable element that reveals the text on focus.
- **Never truncate interactive content.** Primer: "do not truncate text if it contains focusable elements such as links, buttons, and mentions/tags", nor hide focusable elements behind truncation.
- **Truncate meaningfully.** An ellipsis stands for three or more characters (Carbon). End-line for prose; mid-line when strings share beginnings and endings, such as file paths (Carbon); never mid-word in a name people compare.
- **Show more**: a button, labelled for what it reveals ("Show 12 more comments", "Show full description"), placed where the cut is; after expanding, "Show less" may collapse (Carbon). Carbon prefers it to fades or inner scrolling "as they are more prominent and actionable".
- **Only when there is more.** The control renders only when content exceeds the cut (code-standard rule 12); the cut is decided in the page model with fixtures, not in the template (code-standard rule 29), and holds for any length the content can take (code-standard rule 57).
- **Cut by lines, not characters**, so the cut follows the reader's font size and language.
- **Load more** when performance is the reason (Carbon); pagination and loading are in [`pagination.md`](pagination.md).

**Cases**
- A card description cut at 120 characters with "…" and no way to read the rest → cut at three lines with "Show full description", or link the card to its page where the text is whole (1.4.12's link exception).
- File paths in a table column all start with the same long prefix → mid-line truncation keeps the distinguishing end visible, with the full path available on focus or in the detail view.
- A "Read more" link under every excerpt on a listing → name it for its article or make the title the link; repeated "Read more" says nothing out of context ([Primer content](https://primer.style/product/getting-started/foundations/content): link text should be "clear, unique, and informative").
- A "Show more" shown on a description that is already short → render it only when the text overflows (code-standard rule 12).
- An error message truncated to fit a toast → never; Carbon excludes error and validation messages from truncation.

**Accessibility**
- 1.4.12 Text Spacing and 1.4.4 Resize Text: truncation that appears only when text is spaced or enlarged still needs a reveal.
- 1.4.10 Reflow: at 320px, wrap before truncating.
- 2.1.1 Keyboard: the reveal works by keyboard. 4.1.2: a Show more button exposes `aria-expanded` when it expands in place.
- Focus after "Show 12 more" lands on the first new item, or stays on the button with its new count announced (code-standard rule 14).

**Build**
- Keep the whole text in the DOM and cut by lines in CSS; the prefixed line clamp is the dependable form today ([responsive: *Truncation and line clamps*](../../code/responsive.md#truncation-and-line-clamps) owns the snippet and its support note).
- "Show more" is a `button type="button"` with `aria-expanded` and `aria-controls`, rendered only when the box overflows (code-standard rule 12); "Show 12 more" that appends items is a load-more link instead ([pagination: load more](pagination.md#load-more)).
- No `title` as the reveal; a link to the full item, or the button (code-standard rule 18 when icon-only).
- Mid-line truncation of paths is done on the server into two spans (start and end), with the full string as the accessible text, never by deleting characters (code-standard rule 29, code-standard rule 57).
- A repeated "Read more" gets a fuller name from the item's title through `aria-labelledby` or a visually hidden span ([accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).

**Check**
- *Script* could: find elements with `text-overflow: ellipsis` or `-webkit-line-clamp` whose content overflows, and assert each has a keyboard-reachable reveal or sits in a link; flag truncation inside headings, labels, buttons and alerts; flag a Show more control on content that does not overflow; flag link text "Read more" or "More" without a fuller accessible name.
- *Judgement*: would wrapping or more room avoid the truncation altogether?

**Sources.** Carbon pairs end-line truncation with a browser `title` tooltip in its code; Primer and WCAG's Understanding say that alone fails keyboard users. The toolkit follows Primer and WCAG: an explicit, keyboard-reachable reveal.

## Progressive disclosure depth

**Use when / don't use**
- Whenever a design hides advanced or rare options: one level of disclosure for the secondary set, rarely two, never three.
- Not to hide what most people need. Carbon's [disclosures pattern](https://carbondesignsystem.com/patterns/disclosures-pattern/): "Do not hide important information inside of a disclosure."

**How**
- This section owns disclosure depth; [ux: progressive disclosure](../design/ux.md#progressive-disclosure) keeps the principle.
- **Two levels at most.** NN/g's [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/): "designs that go beyond 2 disclosure levels typically have low usability"; with three or more, "consider simplifying your design" or chunk the advanced features into groups people can ignore.
- **Count across surfaces.** A card that opens a dialog that opens a drawer is three levels, whatever each component is called. A dialog that contains an accordion is two.
- **Get the split right.** NN/g: the split between initial and secondary features comes from task analysis and frequency of use. A wrong split charges frequent users a click on every visit.
- **Make the step obvious.** NN/g: it "must be obvious how users progress from the primary to the secondary disclosure levels"; Primer: icons paired with descriptive text, and disclosure "used sparingly, only when it's necessary to truncate information".
- **Don't nest the same pattern.** GOV.UK: avoid accordions, tabs and details "within one another"; Carbon: "Do not nest one disclosure within another"; Apple: one disclosure button per view.
- **Keep context.** Primer: avoid interactions that "drastically disorient the user's initial point of focus"; expand in place, don't jump.

**Cases**
- A settings page: basics visible, "Advanced" disclosure, and inside it a second "Expert" disclosure → two levels is the limit; merge Expert into Advanced with sub-headings, or move it to its own page.
- An overview card → modal → drawer for a finding's detail → the card links to a detail page; the page uses one disclosure for raw measurements.
- A component page showing the verdict first and the measurement table behind one disclosure → one level, the right split.
- Tabs whose panels contain accordions whose panels contain `details` → flatten to tabs with headings inside, or accordions with headings inside.

**Accessibility**
- 1.3.1: each level is a real heading or a labelled control, so the structure is perceivable.
- 2.4.3: opening a level moves nothing; focus stays on the control that opened it unless the level is a dialog.
- Every disclosed region works with scripts off (code-standard rule 20).

**Build**
- Count depth in the markup: nested `details`, `[aria-expanded]` triggers and `dialog`s inside one another; a component never contains its own kind (code-standard rule 8).
- Every level is a real heading or a named control, so the outline holds the depth ([HTML semantics: *Headings and the outline*](../../code/html-semantics.md#headings-and-the-outline)).
- Opening a level expands in place and leaves focus on its trigger, except a `dialog`, which takes focus ([accessibility: *Focus management*](../../code/accessibility.md#focus-management)).
- Every level's content is in the server-rendered page (code-standard rule 20).

**Check**
- *Script* could: from the first view, count nested disclosure controls (`aria-expanded`, `details`, dialog triggers inside dialogs) on the deepest path and flag more than two; flag a disclosure trigger with no text.
- *Judgement*: is the split based on what people open most, and does anyone frequent pay a click for it every time?

**Sources.** NN/g sets the two-level ceiling; GOV.UK, Carbon and Apple all forbid nesting their own disclosure components; Primer asks for restraint. No source found allows three.

## Expandable table rows

**Use when / don't use**
- Supplementary detail for a row that most people will not need for most rows, or that is slow to fetch. Carbon's [data table](https://carbondesignsystem.com/components/data-table/usage/): "Use the expanded section for supplementary information or data that needs additional query time."
- Not when the expanded area is cramped or holds a task. Carbon: then "consider taking the user to a dedicated page, side panel, or data table".
- Not to hide a column people compare; comparison wants columns (design-standard rule 8, a fixed set of attributes is columns).

**How**
- **The control** is a disclosure button in the first column; with selection, the expand control comes first, left of the checkbox (Carbon).
- **Name it with the row**: "Show details for invoice 1042", so a list of buttons is usable.
- **Expanded content** spans the table's width under its row, in the row's reading order, at least as wide as the columns it explains.
- **Expand all** is off by default (Carbon: expanding every row "will typically negate" the saved loading); offer it in the header only when people need to scan everything.
- **Loading**: a skeleton in the expanded area while detail loads (Carbon); the row height above does not change (design-standard rule 2).
- **Several open** may be allowed; opening one never closes or moves another the person is reading.
- **Small screens**: a table that becomes cards can show the expanded content as a `details` inside each card; tables at small sizes are in [`tables.md`](tables.md).

**Cases**
- An invoices table with line items behind each invoice → expandable rows, line items fetched on expand, skeleton meanwhile.
- An expanded row holding an edit form with eight fields → a side panel or a page.
- Rows where the most important figure is only visible when expanded → make it a column.
- An "Expand all" that fires two hundred requests → remove it, or load summaries in one request.

**Accessibility**
- 4.1.2: the row's button exposes `aria-expanded` and an accessible name with the row's identity (code-standard rule 18 when it is icon-only).
- 1.3.1: the expanded content is associated with its row (in the row's following row, or with `aria-controls`); table semantics stay intact.
- 2.5.8: the expand chevron's target is at least 24 by 24.
- Focus stays on the button after expanding.

**Build**
- The trigger is a `button type="button"` with `aria-expanded` and `aria-controls` in the row's first cell, before any selection checkbox, named with the row ("Show details for invoice 1042"; code-standard rule 18).
- The detail is the next `tr` holding one `td colspan` across the table, `hidden` until opened; table semantics stay intact ([HTML semantics: *Tables for data*](../../code/html-semantics.md#tables-for-data), [*Table behaviour*](../../code/html-semantics.md#table-behaviour)).
  ```html
  <tr><td><button type="button" aria-expanded="false" aria-controls="d-1042">Show details for invoice 1042</button></td>…</tr>
  <tr id="d-1042" hidden><td colspan="6">…</td></tr>
  ```
- Detail fetched on first open shows a skeleton of the final height, then swaps in place; focus stays on the button (code-standard rule 14).
- Without script the button is a link to the row's detail page (code-standard rule 20).
- The chevron rotates from `[aria-expanded="true"]`; its target meets [responsive: *Touch targets*](../../code/responsive.md#touch-targets).

**Check**
- *Script* could: for each row expand button, assert a name that differs per row, `aria-expanded` toggles, and the rows above do not move when it opens; flag an expand-all control on a table whose expansions each fetch.
- *Judgement*: is anything people compare across rows hidden inside the expansion?

**Sources.** Carbon is the only system read that documents expandable rows in depth; the accessibility half applies the W3C [disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) to a row.

## Tabs or accordion on small screens

**Use when / don't use**
- When a design has content tabs (sections of one page, such as Overview, Specifications, Reviews) and must work at narrow widths.
- View-switching tabs that choose what a screen shows are governed by design-standard rule 3 (one row, scroll when they overflow, never wrap) and stay tabs.

**How**
- **Content tabs become stacked sections.** GOV.UK's [tabs](https://design-system.service.gov.uk/components/tabs/): without JavaScript, tabbed content shows "on a single page, in order from first to last, with a table of contents that links to each of the sections", and "This is also how the component currently behaves on small screens, though more research is needed on this."
- **Or an accordion**, when sections are long, independent and most people need one. NN/g's [tabs, used right](https://www.nngroup.com/articles/tabs-used-right/): accordions "are particularly useful on mobile devices, where they work better than tabs due to the limited screen space", and on desktop tabs may be preferable because closed accordions "can make the page seem too empty".
- **Decide the switch by the content**: tabs that overflow by a label or two keep one row that scrolls, never wrapped or truncated (design-standard rule 3; [navigation: tabs](navigation.md#tabs)); when most labels would sit out of view, switch to sections or an accordion. NN/g: hidden tabs in a scrolling tab bar "become less discoverable".
- **Each section keeps a heading** that repeats its tab label (GOV.UK: "Include a heading at the beginning of each tab"), so the stacked or accordion form has the same outline.
- **One source, two presentations**: the same markup renders as tabs at wide widths and sections or accordion at narrow ones; no duplicated content (code-standard rule 36 on one implementation).
- **The selected tab** maps to the open accordion section or the scrolled-to section, so a shared address opens the same content ([ux: state persistence and restore](../design/ux.md#state-persistence-and-restore)).

**Cases**
- A product page with five content tabs on a phone → stacked sections with an "On this page" list at the top, or an accordion if Reviews is very long.
- A dashboard's tabs choosing which file the screen shows (design-standard rule 3) → stay tabs and scroll horizontally on a phone.
- Three short content tabs that fit at 320px → keep tabs.
- An accordion on desktop that leaves the page nearly empty → tabs or headings at wide widths, accordion only on narrow ones (NN/g).

**Accessibility**
- 1.3.1 and 2.4.6: headings persist in every presentation.
- 1.4.10 Reflow: at 320px nothing scrolls sideways except a view-switching tab row, which design-standard rule 3 allows.
- 4.1.2: tabs expose `tablist`, `tab`, `tabpanel` with selection; the accordion form exposes `aria-expanded`; each form is complete in its own semantics, never a mix.
- The no-script form is the stacked form (code-standard rule 20).

**Build**
- One markup: headed sections in order. Wide, the script adds the [APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) roles and keys; narrow, it adds accordion buttons or nothing (stacked) ([accessibility: *Composite widgets and roving tabindex*](../../code/accessibility.md#composite-widgets-and-roving-tabindex)).
- Switch on a container query or a `matchMedia` listener tied to the same breakpoint token, tearing down one set of roles before adding the other, so the two semantics never mix ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)).
- The selected tab and the open section are the same fragment (`#reviews`), so one address opens the same content in both forms ([javascript: *State in the address and history*](../../code/javascript.md#state-in-the-address-and-history)).
- One module owns both presentations (code-standard rule 36); the stacked form is the no-script form (code-standard rule 20).

**Check**
- *Script*: tools/ui-check/check.mjs: design-standard rule 3 (tabs keep one row and scroll). Could: at 320px, assert content tabs either fit without truncation or render as sections with headings; assert the same headings exist in both presentations.
- *Judgement*: are these tabs views of one context (stay tabs) or sections of one page (stack them)?

**Sources.** GOV.UK stacks content tabs on small screens and flags it as needing research; NN/g recommends accordions on mobile. The toolkit stacks by default, since nothing is hidden, and uses an accordion when sections are long and independent.
