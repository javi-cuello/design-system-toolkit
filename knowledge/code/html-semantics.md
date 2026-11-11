# HTML semantics

How a page's markup carries its meaning: metadata, share previews (Open Graph), the heading outline, landmarks, the element chosen for each job (links and buttons, navigation, lists, description lists, figures, tables and their sorting, disclosure, dialogs and popovers), forms and their errors, search and filter forms, images, charts, code samples, valid nesting and custom elements. Everything downstream reads the document rather than the rendering, so this is where most accessibility is decided for free. It serves code-standard rule 1 (markup stands on its own), code-standard rule 2 (DOM order is reading order), code-standard rule 3 (every band is a landmark holding one container), code-standard rule 8 (three kinds of component), code-standard rule 13 (slots) and code-standard rule 20 (a working no-script path), and design-standard's principles *for everyone, in any context* and *clear words, clear hierarchy*. ARIA, names, focus and live regions are [accessibility.md](accessibility.md)'s; the language and direction of a page are [i18n.md](i18n.md)'s; behaviour layered on the markup is [javascript.md](javascript.md)'s; the design half of accessibility is [ui/design/accessibility.md](../ui/design/accessibility.md).

## Document metadata

**What good looks like**
- [required] Every page starts with a doctype, a UTF-8 charset, a language and a title that names the page before the site (HTML; WCAG 2.4.2, WCAG 3.1.1).
- [required] The viewport lets the reader zoom (WCAG 1.4.4).
- [strong] The title changes when the view changes, including in a single-page app.

**How**
- [required] The minimum head, in this order (HTML):
  ```html
  <!doctype html>
  <html lang="en-GB">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Open orders – Example Shop</title>
  ```
- [required] **Title.** The WHATWG asks for "titles that identify their documents even when they are used out of context, for example in a user's history or bookmarks, or in search results" ([HTML `title`](https://html.spec.whatwg.org/multipage/semantics.html#the-title-element)). Specific first, site last; the wording is [content: headings and page titles](../ui/design/content.md#headings-and-page-titles).
- [required] **Viewport.** `width=device-width, initial-scale=1` and nothing that stops zoom; why, and the rest of zoom and reflow, is [responsive: zoom and reflow](responsive.md#zoom-and-reflow).
- [required] **Language.** `lang` on `html`, never on `body` ([W3C, *Declaring language in HTML*](https://www.w3.org/International/questions/qa-html-language-declarations)); tags, direction and passages in another language are [i18n: language and direction](i18n.md#language-and-direction).

**Cases**
- A template's title is the site name on every page → put the page's own name first; a screen reader announces the title on load, and ten tabs called the same thing are one tab.
- A filter changes the view without a page load → update `document.title` with the new state ("Shipped – Orders – Example Shop"), as a page load would.
- A mobile layout "looks broken when pinched" and someone adds `maximum-scale=1` → remove it and fix the layout; the zoom is the reader's.

**Accessibility**
- [required] WCAG 2.2 2.4.2 Page Titled ([Understanding 2.4.2](https://www.w3.org/WAI/WCAG22/Understanding/page-titled.html)), 3.1.1 Language of Page ([Understanding 3.1.1](https://www.w3.org/WAI/WCAG22/Understanding/language-of-page.html)), 1.4.4 Resize Text ([Understanding 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)).

**Check**
- *Script:* could, in `tools/parity/pages.mjs` structure: a non-empty `lang` on `html`, a non-empty `title` that differs between pages, and no `user-scalable=no` or `maximum-scale` below 2 in the viewport.
- *Judgement:* Read the titles of five pages in a row as tab labels: can you tell them apart?

**Sources:** WHATWG, W3C Internationalization and MDN as linked; they agree.

## Share previews

**What good looks like**
- [strong] A shared link shows the page's own title, a description and an image made for sharing, on every platform that reads Open Graph.
- [strong] A changed image reaches people who share the link after the change, without anyone asking a platform to forget the old one.

**How**
- [required] Open Graph's four required properties are `og:title`, `og:type`, `og:image` and `og:url`; a page with an image "should specify `og:image:alt`", "a description of what is in the image (not a caption)" ([ogp.me](https://ogp.me/)). Give `og:image:width` and `og:image:height` too: Facebook can then render the preview before it has downloaded the image ([Meta, images in link shares](https://developers.facebook.com/docs/sharing/webmasters/images/)).
- [strong] Size: 1200 × 630 or larger, as close to 1.91:1 as possible; under 600 × 315 Facebook drops the large preview, under 200 × 200 it rejects the image, and files over 8 MB are refused ([Meta, as above](https://developers.facebook.com/docs/sharing/webmasters/images/)). X's own card documentation could not be read for this page (it answered 402), so its limits are unchecked here.
- [strong] Facebook caches an image by its URL ([Meta, as above](https://developers.facebook.com/docs/sharing/webmasters/images/)), so a changed image needs a new URL, versioned as any cached asset is ([performance: caching and compression](performance.md#caching-and-compression)); a query (`card.png?v=<hash of what it is drawn from>`) does it without renaming files. Old shares keep the old picture.
- [moderate] A per-page image drawn on the server (a title and logo on a fixed background) can be cached by a key of its inputs, written aside and renamed into place, and fall back to the site's card on any failure, redirecting before an image content type is set, so that two requests at once never serve a half-written file and a failure never goes out labelled as an image (one project, 2026-11-10).

**Cases**
- LinkedIn stores its own 480 px copy of the image (`articleshare-shrink_480` in its CDN address; larger sizes on the same address answer 403) and, since 2024, shows an unpaid link post as a small thumbnail beside the title; only paid posts get the large card ([dsmn8](https://dsmn8.com/blog/linkedin-link-preview-changes/), [Postline](https://postline.ai/blog/linkedin-link-preview-card)). Post Inspector shows that 480 px copy stretched to the large card, which looks blurry; a 2× image does not change either view. In the feed that thumbnail measured about 256 CSS px wide, so the card's text has to read at that size (one project, observed on a live post, 2026-11-10).
- PHP's GD could not read the site's `.woff2` face, so the server that drew text needed the same face as a static TTF; and GD has no letter-spacing, so its lines ran slightly wider than the design's tracking (one project, 2026-11-10).

**Accessibility**
- [moderate] `og:image:alt` is the image's text alternative where a platform shows one ([ogp.me](https://ogp.me/)); it describes the image, and the title already says the rest.

**Check**
- *Script:* could: every page carries the four required properties, an `og:image` that answers 200 with an image type, and `og:image:alt`.
- *Judgement:* Paste a page into each platform's inspector (LinkedIn Post Inspector, Facebook Sharing Debugger) and look at the result at the size it really appears in a feed.

**Sources:** Open Graph protocol and Meta as linked; LinkedIn's layout from two practitioner blogs, as LinkedIn publishes none, and its stored size from a run. They agree.

## Headings and the outline

**What good looks like**
- [required] One `h1`, inside `main`, naming the page (code-standard rule 1).
- [required] Levels descend without gaps; a level is chosen for its place in the outline, never for its size (code-standard rule 1).
- [strong] Every section a reader might jump to starts with a heading.

**How**
- [required] The WHATWG rule, now normative: "Each heading following another heading lead in the outline must have a heading level that is less than, equal to, or 1 greater than lead's heading level" ([HTML, headings and outlines](https://html.spec.whatwg.org/multipage/sections.html#headings-and-outlines)). An `h3` straight under an `h1` is its own non-conforming example.
- [required] The old outline algorithm (an `h1` in every `section`, ranked by nesting) is gone from the standard; write explicit levels (HTML).
- [required] Size is the stylesheet's: a prose scale restores heading sizes where a reset flattened them (code-standard rule 7), and a component heading takes its text style from the component's stylesheet or an attribute (code-standard rule 6), not from a different level.
- [weak] A heading inside a reusable component takes its level from the caller (a `level` attribute or a slot for the heading itself), because the component cannot know where it will sit. With no level given it renders a `p` in the same style: a component placed where its title introduces nothing (an empty state under its section's own heading) should not add a heading.
- [required] A skipped level breaks the HTML standard's "must" above, and the WAI tutorial says it "should be avoided where possible" ([WAI, *Heading ranks*](https://www.w3.org/WAI/tutorials/page-structure/headings/)). WCAG itself fixes no level: H42's example "is not intended to prescribe what level of heading should be used for a particular section" ([H42](https://www.w3.org/WAI/WCAG22/Techniques/html/H42)). An audit reports a skip as non-conforming HTML and against code-standard rule 1, not as a 1.3.1 failure on its own; a level chosen only for its look is one, through [F43](https://www.w3.org/WAI/WCAG22/Techniques/failures/F43).

**Cases**
- A card list under an `h2` gives every card an `h4` because it "looked right" → `h3`, styled smaller; a heading-list reader sees a gap and assumes a missing section.
- A hero has a large brand line in an `h1` and the page title in an `h2` → the page title is the `h1`; the brand line is a `p`.
- A dashboard has tiles with titles but no headings → make each title a heading at the right level, so a screen-reader user can move tile to tile with one key.
- A heading-audit checklist says "style by class, not by tag" → in a system styled by attributes and element context (code-standard rule 6) the same aim is met by a reset that flattens `h1`–`h6` and sizes from the component's stylesheet or the prose scale (code-standard rule 7). What the checklist guards against is a level picked for its default size; check that, not whether a class exists.
- A modal's title is an `h2` on a page whose outline goes to `h4` → keep the `h2`; it names the dialog through `aria-labelledby`, and the page's outline behind a modal is inert while it is open.

**Accessibility**
- [required] WCAG 2.2 1.3.1 Info and Relationships ([Understanding 1.3.1](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html)), 2.4.6 Headings and Labels ([Understanding 2.4.6](https://www.w3.org/WAI/WCAG22/Understanding/headings-and-labels.html)), 2.4.1 Bypass Blocks (headings are one of its sufficient techniques).
- [required] code-standard rule 1 (one `h1` inside `main`, no gaps) and code-standard rule 7 (a prose scale, not a level, for size).

**Check**
- *Script:* `tools/parity/pages.mjs` structure reports "<n> <h1> elements", "the <h1> sits outside <main>" and "heading jump h2 → h4" (outside an `article`) on every page it renders.
- *Judgement:* Read only the headings, in order: is that a table of contents for the page?

**Sources:** WHATWG as linked. Older advice to restart at `h1` in every `section` came from the withdrawn outline algorithm; the toolkit follows the standard's explicit levels and code-standard rule 1's single `h1`.

## Landmarks

**What good looks like**
- [required] One `main`, holding everything that is the page's own content (HTML).
- [required] One banner and one contentinfo: a `header` and a `footer` that are children of `body`, not inside any sectioning element (ARIA).
- [strong] Every other region a reader would jump to is a landmark with a name; two of the same kind have different names.
- [required] No content sits outside a landmark (code-standard rule 3).

**How**
- [required] **Which elements become landmarks** ([HTML-AAM](https://www.w3.org/TR/html-aam-1.0/), [APG landmark regions](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)):

  | Element | Landmark | Only when |
  |---|---|---|
  | `header` | banner | its context is `body`; inside `article`, `aside`, `main`, `nav` or `section` it is not |
  | `footer` | contentinfo | the same: scoped to `body` |
  | `main` | main | always; exactly one not `hidden` |
  | `nav` | navigation | always |
  | `aside` | complementary | its context is `body` or `main`; inside another sectioning element, only when named |
  | `section` | region | it has an accessible name; otherwise generic |
  | `search` | search | always |
  | `form` | form | it has an accessible name (APG) |

- [required] **One `main`.** "A document must not have more than one `main` element that does not have the `hidden` attribute specified", and its ancestors are limited to `html`, `body`, `div`, an unnamed `form` and autonomous custom elements ([HTML `main`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-main-element)).
- [required] **Header and footer inside sectioning.** A `header` inside an `article` or `section` is that section's introduction, not a banner ([HTML `header`](https://html.spec.whatwg.org/multipage/sections.html#the-header-element)); a `footer` "represents a footer for its nearest ancestor sectioning content element" ([HTML `footer`](https://html.spec.whatwg.org/multipage/sections.html#the-footer-element)). Use them freely there.
- [strong] **Names.** "If a specific landmark role is used more than once on a page, provide each instance of that landmark with a unique label" ([APG](https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/)). Prefer `aria-labelledby` pointing at the section's visible heading; `aria-label` where there is none.
  ```html
  <nav aria-label="Primary">…</nav>
  <section aria-labelledby="h-results"><h2 id="h-results">Results</h2>…</section>
  ```
- [required] **Search.** `<search>` "defines a search landmark. This removes the need for adding `role=search` to a `<form>` element" ([MDN `search`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/search)).
- [required] **Bands.** The page is a stack of bands, each a landmark holding one container (code-standard rule 3); the container is a `div` or custom element inside the band, never another landmark.

**Cases**
- A hero `<header>` sits between the site header and `main` → two banner landmarks, and the hero is outside the main content; move it to be the first band inside `main`, where a `header` is no longer a banner.
- A header and a footer navigation are both `nav` with no names → "navigation, navigation" in a landmark list; name them "Primary" and "Footer".
- Every `section` is named because the structure check reports "unnamed <section>" → that is the intent: a `section` with no name is a generic box, so either give it its heading as a name or make it a `div`.
- A cookie banner is the first thing in `body` and outside any landmark → put it in a named region (or a `dialog` if it blocks), so it is neither lost nor in the way.
- An article page has a byline `footer` inside the `article` → correct as it is; only the page footer is contentinfo.

**Accessibility**
- [required] WCAG 2.2 1.3.1 Info and Relationships, 2.4.1 Bypass Blocks ([Understanding 2.4.1](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html)), 4.1.2 Name, Role, Value for the names.
- [required] code-standard rule 1 (landmarks present and labelled), code-standard rule 3 (every band a landmark holding one container); the skip link that pairs with landmarks is [navigation: skip links](../ui/patterns/navigation.md#skip-links), built as [accessibility: focus management](accessibility.md#focus-management).

**Check**
- *Script:* `tools/parity/pages.mjs` structure reports "<n> <main> elements" and "unnamed <nav>", "unnamed <aside>", "unnamed <section>". Could add: more than one `header` or `footer` whose nearest sectioning ancestor is `body`, and text nodes outside any landmark.
- *Judgement:* Open a screen reader's landmark list: does every entry say what it is, and is anything you would want to jump to missing?

**Sources:** WHATWG, HTML-AAM, APG and MDN as linked. The toolkit names every `nav`, `aside` and `section` even where only one exists, because the structure check asks it and a landmark list reads better with names; APG asks for names only where a role repeats.

## Links and buttons

**What good looks like**
- [strong] It goes somewhere: `<a href>`. It does something here: `<button type="button">`. It submits: `<button type="submit">` (HTML).
- [moderate] Every button in a form states its `type`.
- [required] No `div`, `span` or `href="#"` stands in for either (HTML).

**How**
- [required] **The test is the result, not the look.** "If the `a` element has an `href` attribute, then it represents a hyperlink"; without one it is "a placeholder for where a link might otherwise have been placed" ([HTML `a`](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element)). A design's "button" that changes the address is a link styled as a button; choosing between them is [actions: buttons or links](../ui/patterns/actions.md#buttons-or-links).
- [required] **`type` always.** A `button` with no `type` is in the Auto state and is a submit button unless it has `command`/`commandfor` or sits in a `select` ([HTML `button`](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element)). A toggle or a "show password" button inside a form submits the form without `type="button"`.
  ```html
  <button type="button" aria-expanded="false" aria-controls="filters">Filters</button>
  <button type="submit">Save changes</button>
  ```
- [required] **A disabled link** drops its `href` and says `aria-disabled="true"` (code-standard rule 62); a link has no `disabled`.
- [weak] **A whole card clickable** is one real link (the title) stretched over the card with a pseudo-element, not a click handler on the card; the other controls in the card stay above it.

**Cases**
- A table row navigates on click through a script → a link in the first cell, stretched across the row; it opens in a new tab, shows its address on hover and needs no modifier handling (code-standard rule 21's evidence).
- "Show password" inside a sign-in form submits the form → `type="button"`.
- `<a href="#" onclick="openMenu()">` → `<button type="button">`; the link adds `#` to the address, scrolls to the top and is announced as a link.
- A "Download report" control fetches a file → a link with `download` if the file has a URL; a button only if it is generated on click.

**Accessibility**
- [required] WCAG 2.2 4.1.2 Name, Role, Value ([Understanding 4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)), 2.1.1 Keyboard (a native link and button bring Enter, and Space for the button).
- [required] code-standard rule 8 (the native control inside the component), code-standard rule 9 (disabled is the control's own), code-standard rule 21 (modified clicks), code-standard rule 62 (a disabled link).

**Check**
- *Script:* could flag `a` without `href` that carries a click handler, `a[href="#"]`, elements with `onclick` and no interactive role, and any `button` inside a `form` without `type`. `tools/css-lint/lint.mjs` *modified clicks go to the browser* already reads click handlers that navigate.
- *Judgement:* For each control: does it change the address? Then it is a link.

**Sources:** WHATWG and the APG ([read me first](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/): "A role is a promise") agree.

## Navigation markup

**What good looks like**
- [required] Every set of destinations is a list of links in a named `nav`; the reader's place in it is `aria-current`, and the style reads that attribute (code-standard rule 64).
- [strong] Breadcrumbs, pagination, link tabs and side navigation are all this one shape; none needs a widget role or a keyboard model of its own.
- [strong] A collapsible navigation is a disclosure (a `button` with `aria-expanded` and a list), never `role="menu"`.
- [weak] This section implements [navigation](../ui/patterns/navigation.md) (breadcrumbs, link tabs, in-page navigation), [menus](../ui/patterns/menus.md) (the top bar, dropdowns and the mobile menu), [sidebars](../ui/patterns/sidebars.md) (side navigation) and [pagination](../ui/patterns/pagination.md).

**How**
- [strong] **Breadcrumbs** ([APG breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/)): "Breadcrumb trail is contained within a navigation landmark region", labelled; the current page carries `aria-current="page"`, and APG makes it optional when that item is not a link. An ordered list carries the levels; separators are drawn by CSS (a pseudo-element or a background), so they are never read.
  ```html
  <nav aria-label="Breadcrumb"><ol>
    <li><a href="/">Home</a></li><li><a href="/components/">Components</a></li>
    <li><span aria-current="page">Button</span></li></ol></nav>
  ```
- [moderate] **Pagination**: a `nav aria-label="Pagination"` holding a list of real links to `?page=n`, the current one `aria-current="page"`; Previous and Next are links that are absent, not disabled, at either end ([GOV.UK pagination](https://design-system.service.gov.uk/components/pagination/)). Ellipses are text, not links. "Load more" is the same next-page link, intercepted by script ([javascript: progressive enhancement](javascript.md#progressive-enhancement)).
- [required] **Side navigation**: nested `ul` inside one `nav`; a parent with children is a link to its overview plus a separate `button aria-expanded` that shows and hides the child list with `hidden` (code-standard rule 17). The current page's ancestors are marked with a class-free attribute such as `data-ancestor` (code-standard rule 6), never a second `aria-current="page"`.
- [strong] **Link tabs** are this shape styled as tabs, `aria-current="page"` on the current one; the ARIA tab set is only for panels on one page ([accessibility: composite widgets](accessibility.md#composite-widgets-and-roving-tabindex)).
- [strong] **In-page navigation**: a `nav` labelled by its visible "On this page" heading, links to heading `id`s; [`scroll-margin-top`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-margin-top) on headings, set from the sticky header's height token, keeps the target out from under it. The section in view, if marked, is `aria-current="true"`.
- [required] **Style from the state**: `[aria-current="page"]` and `[aria-expanded="true"]` select the look ([css-architecture: selectors](css-architecture.md#selectors-that-stay-cheap-and-local)), so the announced state and the drawn one cannot disagree (code-standard rule 64).

**Cases**
- A breadcrumb's last item is a link to the page itself → plain text with `aria-current="page"`.
- Separators are `<li>/</li>` items → a screen reader counts and reads them; draw them in CSS.
- A pagination's Next on the last page is `aria-disabled` → remove it; there is nowhere to go.
- A mobile menu is `role="menu"` with links inside → a `button aria-expanded` and the plain list; menu roles promise an arrow-key model a site navigation does not need ([accessibility: composite widgets](accessibility.md#composite-widgets-and-roving-tabindex) has the source).
- A detail page marks both its section and itself `aria-current="page"` in two navigations → the global bar's section item takes `aria-current="true"` (or a data attribute), only the breadcrumb's own item is `page`.

**Accessibility**
- [required] WCAG 2.2 1.3.1, 2.4.8 Location, 4.1.2 (`aria-current`, `aria-expanded`), 2.4.11 Focus Not Obscured for in-page jumps.
- [required] code-standard rule 1 (named `nav`), code-standard rule 17, code-standard rule 20 (every link works without script), code-standard rule 21, code-standard rule 64.

**Check**
- *Script:* could assert every `nav` is named, at most one `aria-current="page"` per page, no `a[href]` as a breadcrumb's last item, no `[role=menu]` inside a `nav`, and every pagination link an `a[href]` carrying the page in its query.
- *Judgement:* Remove the stylesheet: does each navigation still read as a list of places with the current one said?

**Sources:** APG and GOV.UK as linked; MDN for `scroll-margin-top`.

## Lists, description lists and figures

**What good looks like**
- [required] A set of like things is `ul` or `ol`; a sequence that matters is `ol` (code-standard rule 1).
- [required] Key–value pairs are `dl`, `dt` and `dd` (code-standard rule 1).
- [required] Self-contained content with a caption (a chart, a code sample, an image with credit) is a `figure` with a `figcaption` (WCAG 1.3.1).

**How**
- [required] **Lists.** A `ul`'s content model is "zero or more `li` and script-supporting elements" ([HTML `ul`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-ul-element)): nothing else is a direct child. A screen reader announces "list, 12 items", which is information the reader cannot get from a stack of `div`s.
- [strong] **Navigation is a list of links** inside `nav`.
- [required] **Description lists.** `dl` "represents an association list consisting of zero or more name-value groups" ([HTML `dl`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-dl-element)); a `div` may wrap each `dt`/`dd` group for layout.
  ```html
  <dl><div><dt>Status</dt><dd>Open</dd></div>
      <div><dt>Owner</dt><dd>Design</dd></div></dl>
  ```
- [required] **Figures.** `figure` is content "that is self-contained… and is typically referenced as a single unit from the main flow" ([HTML `figure`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-figure-element)); the `figcaption` is its visible caption, not a replacement for an image's `alt`.
- [weak] **List styling.** VoiceOver with Safari drops list semantics when CSS removes the markers ([O'Hara](https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html), commentary); where the count matters, add `role="list"` to that `ul`, and elsewhere accept it: a navigation's `nav` already says what it is.

**Cases**
- A metadata block shows "Status: Open · Owner: Design · Updated: 3 Oct" as spans → a `dl`; each value is announced with its name.
- A results list is `div`s with `role="listitem"` → a `ul` with `li`; the native list needs no ARIA.
- A chart with a caption and a source line → `figure` holding the chart and a `figcaption` with the caption and source (design-standard rule 1 for the source).
- A single link in a "list" → no list; a list of one is noise.

**Accessibility**
- [required] WCAG 2.2 1.3.1 Info and Relationships.
- [required] code-standard rule 1 (lists as lists, key–value data as `dl`).

**Check**
- *Script:* could flag a parent whose three or more children share a tag and class with no list or table semantics, and `dt` or `dd` outside a `dl`. The Nu checker ([validator.w3.org/nu](https://validator.w3.org/nu/)) reports invalid list children.
- *Judgement:* Is anything a list, a set of name–value pairs or a captioned unit that the markup does not say is one?

**Sources:** WHATWG as linked.

## Tables for data

**What good looks like**
- [required] A `table` is used for data with rows and columns, and only for that (HTML).
- [strong] It has a `caption`, header cells in `th`, and a `scope` where the direction is not obvious.
- [strong] A table wider than its space scrolls in a named, focusable container.

**How**
- [required] "Tables must not be used as layout aids" ([HTML tables](https://html.spec.whatwg.org/multipage/tables.html#the-table-element)); a layout is grid or flex.
- [strong] The markup a data table needs:
  ```html
  <table><caption>Findings by component</caption>
    <thead><tr><th scope="col">Component</th><th scope="col">Open</th></tr></thead>
    <tbody><tr><th scope="row">Button</th><td>3</td></tr></tbody></table>
  ```
- [weak] Captions, header cells and scope as design decisions are [tables: captions, header cells and scope](../ui/patterns/tables.md#captions-header-cells-and-scope); the scrolling container is [responsive: tables on small screens](responsive.md#tables-on-small-screens).
- [weak] **Don't change a table's `display`** to make it stack: "using `display: block | grid | inline | …` on table elements will also override native semantics" ([Roselli](https://adrianroselli.com/2018/02/tables-css-display-properties-and-aria.html), commentary), which is why the scrolling container is the default.

**Cases**
- A table overflows its wrapper with no way to scroll it from the keyboard and no name → the named, focusable container in [responsive](responsive.md#tables-on-small-screens); axe reports the missing keyboard access as `scrollable-region-focusable` ([Deque](https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable)).
- A comparison grid of features built from `div`s with CSS grid → a `table`; it is data with two axes and a screen reader can then read a cell with its row and column.
- A form laid out in a two-column `table` → a single column of fields ([forms: form structure](../ui/patterns/forms.md#form-structure)); the table announces "row 3, column 2" for nothing.

**Accessibility**
- [required] WCAG 2.2 1.3.1 Info and Relationships, 2.1.1 Keyboard for a scrolling container, 1.4.10 Reflow ("data tables (not individual cells)" may scroll in two dimensions, [Understanding 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)).
- [required] code-standard rule 1, code-standard rule 57.

**Check**
- *Script:* `tools/parity/pages.mjs` overflow reports a box that leaves the box meant to hold it, which is how a wide table shows up. Could check every `table` has a `caption` or `aria-labelledby` and at least one `th`, and that a scrolling ancestor of a table is focusable and named.
- *Judgement:* Is it data with two axes? If not, it is not a table; if so, can a screen-reader user tell what each cell means?

**Sources:** WHATWG, [W3C tables tutorial](https://www.w3.org/WAI/tutorials/tables/), Roselli and Deque as linked. Chrome made scrollers with no focusable children keyboard-focusable by default from Chrome 130 (moved to 132) ([Chrome](https://developer.chrome.com/blog/keyboard-focusable-scrollers)); the toolkit keeps the explicit `tabindex="0"` and name, since other engines and the region's name are not covered by that.

## Table behaviour

**What good looks like**
- [strong] A sortable header is a `button` inside the `th`; the sorted column alone carries `aria-sort`.
- [moderate] Selection is native checkboxes, each named by its row; the header checkbox shows the mixed state.
- [strong] Sticky headers and frozen columns stick inside the table's own scroll container, and numeric columns align on the decimal place.
- [weak] Everything here enhances a `table` that already reads correctly ([*Tables for data*](#tables-for-data)); this section implements [tables: headers and sorting](../ui/patterns/tables.md#headers-and-sorting), [selection and bulk actions](../ui/patterns/tables.md#selection-and-bulk-actions), [sticky header and first column](../ui/patterns/tables.md#sticky-header-and-first-column) and [alignment and figures](../ui/patterns/tables.md#alignment-and-figures).

**How**
- [strong] **Sorting.** "The header text of sortable columns is wrapped in a `button` element"; `aria-sort` "is set on the column header of the currently sorted column" and removed from it when another column is sorted; one off-screen sentence describing the sort buttons goes in the caption, "instead of to each button to prevent repetitious verbosity" ([APG sortable table](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)). The direction icon is inside the button and `aria-hidden`; a short status message announces the new order, since not every screen reader announces `aria-sort` changing ([Roselli](https://adrianroselli.com/2021/04/sortable-table-columns.html)).
  ```html
  <th scope="col" aria-sort="descending">
    <button type="button" data-sort="size">Size (KB) <svg aria-hidden="true">…</svg></button></th>
  ```
- [required] **Without script**, the sort is a link to the same address with `?sort=size&dir=desc`, rendered sorted by the server (code-standard rule 20); the script upgrades it to a button that re-sorts in place and writes the address ([javascript: state in the address and history](javascript.md#state-in-the-address-and-history)).
- [moderate] **Selection.** Each row checkbox is labelled with its row's identifier (`aria-labelledby` pointing at the row header and a visually hidden "Select"). The header checkbox's mixed state "cannot be set using an HTML attribute"; set `input.indeterminate = true` from script, and note it is "purely a visual change" that does not alter what the form submits ([MDN checkbox](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/checkbox)). Selected rows are styled from `tr:has(:checked)`, so the state lives in one place.
- [required] **Sticky.** `position: sticky` with `inset-block-start: 0` on the `thead th` (or `inset-inline-start: 0` on the row header); a sticky element "sticks" to its nearest ancestor with a scrolling mechanism, and without an inset it behaves as `relative` ([MDN `position`](https://developer.mozilla.org/en-US/docs/Web/CSS/position)). Give sticky cells an opaque background and a token border; keep focus clear of them with `scroll-padding` ([accessibility: visible focus](accessibility.md#visible-focus)).
- [required] **Figures.** Numeric cells take `text-align: end` and `font-variant-numeric: tabular-nums` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric)), from a column attribute such as `data-type="number"` on the `th` and cells (code-standard rule 6), never from a class per cell; `end`, not `right`, so a right-to-left table mirrors ([i18n: logical properties and mirroring](i18n.md#logical-properties-and-mirroring)).
- [required] **Truncation** is CSS (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`) on a cell with a set width, so the full value stays in the DOM (code-standard rule 29).

**Cases**
- `aria-sort="none"` on every unsorted header → remove it; only the sorted column carries the attribute.
- A sort icon that is the only clickable thing in the header → the whole header text is the button.
- A header checkbox with `aria-checked="mixed"` on a native `input` → set the `indeterminate` property; ARIA on a native checkbox competes with its own state.
- A sticky header inside a wrapper with `overflow: hidden` never sticks to the page → it sticks to that wrapper; make the wrapper the scroll container or remove the overflow.
- A selected row styled by a class the script adds and forgets to remove on "Clear" → style from `:has(:checked)`.

**Accessibility**
- [required] WCAG 2.2 1.3.1, 4.1.2 (sort state and checkbox state), 4.1.3 Status Messages (the sort and selection announcements, through a live region established first, [accessibility: live regions](accessibility.md#live-regions-and-status-messages)), 2.4.11 Focus Not Obscured.
- [required] code-standard rule 6, code-standard rule 14 (focus stays on the header button through the re-render), code-standard rule 18 (the icon), code-standard rule 20.

**Check**
- *Script:* none yet. Could assert at most one `th[aria-sort]` per table and that it is not `none`, a `button` inside every sortable header, a name containing the row identifier on each row checkbox, and computed `text-align: end` with `tabular-nums` on cells of a numeric column.
- *Judgement:* With the keyboard alone, sort a column and select three rows: is focus where it was, and was each change announced once?

**Sources:** APG, MDN and Roselli as linked. APG's example states no announcement; the toolkit adds Roselli's status message, since a change of `aria-sort` alone is not reliably announced.

## Disclosure, dialogs and popovers

**What good looks like**
- [required] Show-and-hide content is `details` and `summary`; an exclusive group shares a `name` (code-standard rule 1).
- [required] A modal is a `dialog` opened with `showModal()` (code-standard rule 20).
- [required] A non-modal overlay (a menu panel, a picker) is a `popover` opened by `popovertarget`, which works without script (code-standard rules 8, 20).
- [required] A behaviour-heavy web component is written only when none of the three covers it (code-standard rule 8).

**How**
- [required] **`details`.** "Only one of the grouped `<details>` elements can be open at a time" when they share a `name` ([MDN `details`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)). It gives open state, keyboard and exclusivity, and nothing else: Escape and a click outside are the script's (code-standard rule 19).
- [strong] **Accordion.** Where the sections need headings in the outline, an "Expand all" control or `role="region"` panels, `details` stops being enough: each header is a `button type="button"` with `aria-expanded` and `aria-controls`, the only element inside a heading at the outline's level ([APG accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)), and the panel is shown and hidden with `hidden="until-found"`, so find-in-page and a fragment link still open it ([accessibility: hidden content](accessibility.md#hidden-content)). Rendered open, with no buttons, until the script runs (code-standard rule 20). Choosing it is [disclosure: accordions](../ui/patterns/disclosure.md#accordions).
  ```html
  <h3><button type="button" aria-expanded="false" aria-controls="p-delivery">Delivery</button></h3>
  <div id="p-delivery" hidden="until-found">…</div>
  ```
- [required] **`dialog`.** Opened with `showModal()`, the rest of the page is inert and `::backdrop` paints behind it ([MDN `dialog`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)); the browser records the previously focused element and returns focus to it on close ([HTML `dialog`](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)). Opened with the `open` attribute it is non-modal. The standard says "the `tabindex` attribute must not be specified on `dialog` elements", and asks authors to put `autofocus` on the element the reader is expected to use first.
- [required] **`popover`.** `popover="auto"` "closes other popovers when opened; has light dismiss and responds to close requests" ([HTML popover](https://html.spec.whatwg.org/multipage/popover.html)); a `button` with `popovertarget` opens it with no script ([MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API), Baseline 2025).
- [required] **The no-script modal.** A `dialog` that is also a `popover` opens from `popovertarget` before the script loads; the script then intercepts the click and calls `showModal()` for inertness (code-standard rule 20, and code-standard rule 8's evidence).
  ```html
  <button type="button" popovertarget="filters">Filters</button>
  <dialog id="filters" popover aria-labelledby="filters-h"><h2 id="filters-h">Filters</h2>…</dialog>
  ```
- [weak] Choosing the surface is [dialogs: choosing the surface](../ui/patterns/dialogs.md#choosing-the-surface); choosing disclosure is [disclosure: details and summary](../ui/patterns/disclosure.md#details-and-summary).

**Cases**
- A modal opens only from a script click handler → no script, no modal; add `popover` and `popovertarget`, then enhance to `showModal()`.
- A hand-built modal `div` with a focus-trap library → a `dialog`; the platform's inertness and focus return replace the library.
- An accordion of `details` that should keep one open → give them one `name`; no script.
- A dropdown menu built on `details` closes on nothing but its own summary → add Escape and click-outside in the script, or make it a `popover`, which light-dismisses on its own.
- A collapsed description hidden by a script → render it open and let the script collapse it, so it reads in full without script (code-standard rule 20).

**Accessibility**
- [required] WCAG 2.2 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 4.1.2 Name, Role, Value (a dialog's name from its heading via `aria-labelledby`).
- [required] code-standard rule 8, code-standard rule 19, code-standard rule 20. Focus on open and close is [accessibility: focus management](accessibility.md#focus-management).

**Check**
- *Script:* `tools/parity/pages.mjs` structure checks every `details` whose content floats closes on Escape and on a click outside ("stays open on Escape (code-standard 19)"). Could flag a `dialog` with `tabindex`, a `[role="dialog"]` on anything but `dialog`, and a modal trigger with no `popovertarget` or `href` (no no-script path).
- *Judgement:* With scripts off, does every overlay still open and every collapsed block still read?

**Sources:** WHATWG and MDN as linked. The APG's modal dialog pattern predates `dialog` and builds the same behaviour on a `div`; the toolkit uses the element and keeps APG for the keyboard contract.

## Forms markup

**What good looks like**
- [required] Every control has a `label` tied to it; a group of radios or checkboxes, or a field in parts, sits in a `fieldset` with a `legend` (WCAG 1.3.1).
- [strong] The input `type`, `inputmode` and `autocomplete` say what the answer is.
- [required] A form is a real `form` with an `action` and a submit button, so it works without script (code-standard rule 20).

**How**
- [required] **Labels.** `<label for="email">` matched to the control's `id`, or the control inside the label. Only a labelable element can be labelled, and only the first matching `id` counts ([MDN `label`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)). Don't put links or buttons inside a label: MDN warns it "makes it difficult for people" to activate the control.
- [required] **Groups.** `fieldset` and `legend` name a group ([MDN `fieldset`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/fieldset)); a screen reader reads the legend before each option.
  ```html
  <fieldset><legend>Contact method</legend>
    <label><input type="radio" name="contact" value="email"> Email</label>
    <label><input type="radio" name="contact" value="phone"> Phone</label></fieldset>
  ```
- [required] **Types.** `email`, `tel`, `url`, `search`, `date` give the right keyboard and validation ([MDN `input`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input)); `inputmode="numeric"` gives a number pad for a digit string that is not a quantity (a code, a card number).
- [required] **Autocomplete.** Personal data fields carry their token (`name`, `email`, `street-address`, `current-password`, `one-time-code`); valid tokens satisfy 1.3.5 ([MDN `autocomplete`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete)). MDN notes `autocomplete="off"` does not stop password managers.
- [required] **Paste.** Never cancel `paste` on a password or code field; a password manager or a copied code is how many readers meet 3.3.8 Accessible Authentication ([accessibility: accessible authentication](../ui/design/accessibility.md#accessible-authentication)).
- [required] **Hints and errors.** A hint and an error message are descriptions: `aria-describedby` on the control, `aria-invalid="true"` when in error (code-standard rule 15). `required` on a required field, so the markup agrees with the visible mark.
- [required] **Read-only.** `readonly` for text a person may see but not change; it is supported on text controls only ([MDN `readonly`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/readonly)). A choice control that may not change is `disabled`, or rendered as text.
- [weak] What to ask, where labels go and how errors read are [forms](../ui/patterns/forms.md) (above all *Labels*, *Input types and autocomplete attributes*, *Error messages and the error summary*).

**Cases**
- Placeholder text is the only label → a visible `label`; the placeholder vanishes on typing and is a poor accessible name ([APG naming, *Avoid Browser Fallback*](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/): placeholder is a fallback that "typically yields low quality accessible names").
- A read-only mode applied with `pointer-events: none` → the keyboard still edits every field; `readonly` or `disabled` on the controls, or values rendered as text ([accessibility: hidden content](accessibility.md#hidden-content) has the choices).
- A filter form works only through a script → a GET form whose submit is in a `noscript` where the script removes it (code-standard rule 20); the address then carries the filters.
- A count beside each checkbox is inside the label → move it out of the name with `aria-hidden` or `aria-describedby` (code-standard rule 15).
- A date of birth asked as three selects with no group → one `fieldset` with the legend "Date of birth" and labelled day, month, year inputs.

**Accessibility**
- [required] WCAG 2.2 1.3.1 Info and Relationships, 1.3.5 Identify Input Purpose ([Understanding 1.3.5](https://www.w3.org/WAI/WCAG22/Understanding/identify-input-purpose.html)), 2.5.3 Label in Name ([Understanding 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)), 3.3.1 Error Identification ([Understanding 3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html)), 4.1.2.
- [required] code-standard rule 15 (a description is not part of a name), code-standard rule 20 (a real form).

**Check**
- *Script:* `tools/parity/pages.mjs` structure reads each checkbox's and radio's computed name for a count ("(code-standard 15)") and reports an `aria-describedby` that "points at nothing". Could flag a control with no label, radios sharing a `name` outside a `fieldset`, and personal-data field names without `autocomplete`.
- *Judgement:* Fill the form with a screen reader and no mouse: does every field say what it wants, and does every error say where it is?

**Sources:** MDN, APG and WCAG as linked; GOV.UK's form guidance, as cited in `forms.md`, agrees.

## Form errors and validation

**What good looks like**
- [strong] The markup carries the constraints (`required`, `type`, `min`, `max`, `pattern`, `maxlength`), the server checks them again, and the script only adds its own messages on top.
- [required] A field in error says so in its attributes, not only in its border: `aria-invalid="true"` and a message tied by `aria-describedby` (WCAG 3.3.1).
- [moderate] A failed submit renders an error summary that takes focus and links to each field.
- [moderate] A submit sends one request, however often it is clicked.

**How**
- [required] **Error styling from state.** `:user-invalid` matches a field that fails its constraints "after the user has interacted with it", where `:invalid` matches from load ([MDN `:user-invalid`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:user-invalid), Baseline 2023). Style the client's error from `:user-invalid` and the server's from `[aria-invalid="true"]`, one rule for both; never from a class (code-standard rule 9).
  ```css
  :is(input, select, textarea):is(:user-invalid, [aria-invalid="true"]) { /* the error variant's tokens */ }
  ```
- [moderate] **The field message** sits between the hint and the control, in the control's `aria-describedby` after the hint's id, with a visually hidden "Error:" prefix (beyond code-standard rule 15).
  ```html
  <label for="email">Email address</label>
  <p id="email-hint">We will send your receipt here</p>
  <p id="email-error"><span class="visually-hidden">Error:</span> Enter an email address</p>
  <input id="email" name="email" type="email" autocomplete="email" aria-invalid="true" aria-describedby="email-hint email-error">
  ```
- [moderate] **The summary** is a `div` with `tabindex="-1"` at the top of `main`, headed, holding a list of links whose `href` is each field's `id` (`#dob-day` for the first part of a date). On a server render, the page focuses it on load; after a scripted submit, `summary.focus()`. The page `title` gains "Error: " either way.
- [weak] **Own messages.** The script adds `novalidate` to the form, runs `checkValidity()` on submit, writes the messages and the summary itself, and leaves the markup constraints for the no-script path ([javascript: the platform before a library](javascript.md#the-platform-before-a-library)).
- [required] **One submit.** Ignore a second submit while the first is in flight (a flag on the form, cleared on the response), and keep the button enabled (code-standard rule 9, code-standard rule 62); a slow request shows its progress on the button ([actions: loading buttons](../ui/patterns/actions.md#loading-buttons)).
- [required] **Values survive.** The server re-renders every field with the submitted value (except a password); a scripted re-render restores values and focus (code-standard rule 14).
- [weak] What the messages say and when they appear is [forms: error messages and the error summary](../ui/patterns/forms.md#error-messages-and-the-error-summary) and [forms: validation timing](../ui/patterns/forms.md#validation-timing).

**Cases**
- Red borders from `:invalid` on an empty required field the moment the page loads → `:user-invalid`; `:invalid` matches before anyone has typed.
- An error message carries `aria-live` and mounts with its text → nothing is announced and the summary is skipped; make it a description and focus the summary ([accessibility: live regions](accessibility.md#live-regions-and-status-messages)).
- The summary's links point at the field wrappers' ids → focus lands on nothing focusable; point them at the controls.
- A Pay button disabled after the first click to stop a double charge → it drops out of the tab order and the reader loses focus; keep it enabled and ignore the second submit.

**Accessibility**
- [required] WCAG 2.2 3.3.1 Error Identification, 3.3.3 Error Suggestion, 2.4.2 Page Titled (the "Error:" prefix), 2.4.3 Focus Order (focus to the summary), 1.4.1 Use of Color (the message, not the border, carries the error).
- [required] code-standard rule 14, code-standard rule 15, code-standard rule 17 (an empty summary is `hidden` and stays hidden), code-standard rule 20 (the server validates and re-renders).

**Check**
- *Script:* `tools/parity/pages.mjs` structure reports an `aria-describedby` that "points at nothing". Could submit each form empty and assert the summary exists, has focus, and links only to focusable ids; flag `:invalid` (rather than `:user-invalid`) in an error rule; and send two submits in quick succession and count the requests.
- *Judgement:* With scripts off, does a failed submit come back with every value, every message and a summary?

**Sources:** MDN as linked; the summary and message markup follow GOV.UK's [error summary](https://design-system.service.gov.uk/components/error-summary/) and [error message](https://design-system.service.gov.uk/components/error-message/) components, as cited in `forms.md`.

## Search and filter forms

**What good looks like**
- [strong] A search or a filter bar is a GET `form` whose field names are the address's parameters, so it works, reloads and shares with no script (beyond code-standard rule 20).
- [strong] A site search sits in a `search` landmark; a list's filter form is its own named form, one per list.
- [required] The script enhances that form (instant update, removing the submit button), never replaces it (code-standard rule 20).
- [weak] This section implements [search](../ui/patterns/search.md) and [filtering](../ui/patterns/filtering.md).

**How**
- [strong] **The search box**: `input type="search"` named `q`: "`q` is the most common `name` given to search inputs", and an input with no `name` submits nothing ([MDN `input type="search"`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/search)). A visible or visually hidden `label` names it; the placeholder never does ([*Forms markup*](#forms-markup)).
  ```html
  <search><form action="/search" method="get">
    <label for="q">Search the docs</label>
    <input type="search" id="q" name="q" value="focus ring">
    <button type="submit">Search</button></form></search>
  ```
- [moderate] **Clear and Escape.** Some browsers draw their own clear cross and Chrome also clears on Escape (MDN); that is not every engine, so a designed clear button is a named `button type="button"` (code-standard rule 18) and Escape is the script's.
- [required] **Facets** are `fieldset`s with a `legend` (checkboxes or radios), or a labelled `select`, each `name` one parameter; a segmented facet is radios styled as segments, so it submits ([selection](../ui/patterns/selection.md)). Counts sit outside the option's name (code-standard rule 15).
- [required] **No-script submit**: the filter form carries a submit button the script removes when it starts applying on `change` (code-standard rule 20); the address is built from the same form ([javascript: state in the address and history](javascript.md#state-in-the-address-and-history)).
- [strong] **Results**: a heading that echoes the query and count, then an `ol` or `ul` of results, each a link with an excerpt; the count is also written to a status element that is in the page from the start ([accessibility: live regions](accessibility.md#live-regions-and-status-messages)).
- [strong] **Matches** are `mark`: "used, for example, to indicate the words that matched a search operation" ([MDN `mark`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/mark)). Most screen readers do not announce it; leave it unannounced unless missing it changes the meaning (MDN).

**Cases**
- A search input outside any form, run by a keyup handler → wrap it in a GET form with an `action`; Enter then works with no script.
- The script writes `?query=` but the field is `name="q"` → derive the address from the form ([javascript](javascript.md#state-in-the-address-and-history) has the case).
- A filter bar of `div` buttons with click handlers → radios and checkboxes in a form; they submit, carry state natively and need no `aria-pressed`.
- A `mark` with `::before` "highlight start" text on every match in every excerpt → remove it; it doubles the reading for nothing the excerpt does not already say.

**Accessibility**
- [required] WCAG 2.2 1.3.1 (`fieldset` groups, the `search` landmark), 3.3.2 Labels or Instructions, 4.1.3 Status Messages (the count), 3.2.2 On Input (instant filtering changes no context).
- [required] code-standard rule 1, code-standard rule 15, code-standard rule 18, code-standard rule 20.

**Check**
- *Script:* could assert every `input[type=search]` has a `name` and a label independent of `placeholder`, every filter form has `method="get"`, and with script disabled submitting the form reproduces the scripted address.
- *Judgement:* With scripts off, can a reader search, filter and share the result?

**Sources:** MDN as linked; GOV.UK and the APG agree on labelled inputs and grouped choices.

## Images and alt

**What good looks like**
- [required] Every `img` has an `alt` attribute: words that do the image's job, or empty when the image adds nothing (WCAG 1.1.1).
- [required] An image that is a link or a button has `alt` naming where it goes or what it does (WCAG 1.1.1).
- [required] Decorative graphics are hidden from assistive technology; informative ones are not CSS backgrounds (WCAG 1.1.1).

**How**
- [required] **The rule.** "The `alt` attribute must be specified and its value must not be empty" unless a case below says otherwise; an icon beside text that says the same thing takes `alt` that is "present but must be empty" ([HTML, alternative text](https://html.spec.whatwg.org/multipage/images.html#alt)). With `alt` missing, "screen readers might read the image filename" ([WebAIM](https://webaim.org/techniques/alttext/)).
- [strong] **Deciding.** Walk the [W3C alt decision tree](https://www.w3.org/WAI/tutorials/images/decision-tree/): does it carry information, is it a link or button, is it text, is it decorative.
- [required] **Inline SVG.** Informative: `role="img"` and a name (`aria-label` or a `title` child). Decorative or doubled by text: `aria-hidden="true"` (code-standard rule 18).
- [strong] **Complex images** (a chart, a diagram) take a short `alt` and a longer description nearby or a data table ([data visualisation: long descriptions and data tables](../ui/patterns/data-visualisation.md#long-descriptions-and-data-tables)).
- [weak] Writing the words is [content: alt text](../ui/design/content.md#alt-text); which images need an alternative is [accessibility: alternatives for images, media and charts](../ui/design/accessibility.md#alternatives-for-images-media-and-charts).

**Cases**
- A logo linking home with `alt="logo"` → `alt` naming the destination ("Acme home"); the alt of a linked image is the link's name.
- An avatar beside the person's name → `alt=""`; the name is already read.
- An icon-only "close" button with an SVG and no text → `aria-label="Close"` on the button and `aria-hidden="true"` on the SVG (code-standard rule 18).
- A hero photo as a CSS background carries the page's message in the image → an `img` with `alt`, or the message in text; a background has no alternative.

**Accessibility**
- [required] WCAG 2.2 1.1.1 Non-text Content ([Understanding 1.1.1](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html)), 2.4.4 Link Purpose (In Context) for linked images, 4.1.2.
- [required] code-standard rule 18 (icon-only controls named, decorative images empty).

**Check**
- *Script:* `tools/css-lint/lint.mjs` *icon controls are named* rejects an empty `aria-label`. Could flag an `img` without `alt`, an `svg` with neither `aria-hidden` nor `role="img"` and a name, and an `alt` equal to a file name or to "image".
- *Judgement:* Read the page with images off: is anything lost, and is anything read twice?

**Sources:** WHATWG and the W3C tutorial as linked; they agree.

## Video, audio and captions

**What good looks like**
- [strong] Recorded speech in a `video` carries a captions track in the page's language, on by the person's choice, never burned into the picture.
- [required] Audio-only content has a transcript beside it, as text on the page (WCAG 1.2.1).
- [strong] Media never plays on its own with sound, and the native controls stay unless the replacement does everything they do from the keyboard.

**How**
- [required] Captions are a WebVTT file on a `track`: `<track kind="captions" src="intro.vtt" srclang="en" label="English" default>`. `kind="captions"` (speech and meaningful sound) is what deaf readers need; `kind="subtitles"` is translation only (HTML).
- [strong] Keep `controls` on the element. A custom player rebuilds play, pause, seek, volume, captions and full screen, each a named button reachable by Tab.
- [moderate] A transcript sits after the media in a `details` or a plain section, so it is searchable and reads without the player.
- [required] Autoplay only muted (`muted autoplay playsinline`), for decorative loops, with a pause control (2.2.2).

**Cases**
- A product walkthrough video with a voice-over → a captions track and a transcript; a reader in a quiet office uses the captions, a screen-reader user the transcript.
- A silent looping background video → muted, `aria-hidden="true"` if purely decorative, a pause button, and the reduced-motion preference stops it ([accessibility in code](accessibility.md#reduced-motion-and-colour-scheme-in-code)).
- A podcast episode → a transcript on the page; `audio` with `controls`.

**Accessibility**
- [required] 1.2.1 (audio-only and video-only alternatives), 1.2.2 (captions, prerecorded), 1.2.3 and 1.2.5 (audio description), 2.2.2 (pause, stop, hide), 1.4.2 (audio control). The design half (a captions control, room for captions that cover nothing essential) is [accessibility in design](../ui/design/accessibility.md#alternatives-for-images-media-and-charts).

**Check**
- *Script:* could flag a `video` with an audio track and no `track[kind=captions]`, and `autoplay` without `muted`.
- *Judgement:* do the captions match the speech and name meaningful sounds; is the transcript complete?

**Sources:** [MDN `<track>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/track); [W3C WAI captions and subtitles](https://www.w3.org/WAI/media/av/captions/); [Understanding 1.2.2](https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html).

## Charts in markup

**What good looks like**
- [strong] A chart is a `figure`: the graphic, a visible one-sentence summary of its message, a `figcaption` with the source, and its data as a real `table` beside it.
- [strong] The graphic is inline SVG (or `canvas`) with one accessible name that states the message; its marks are not each read out.
- [weak] Series colours come from tokens and are pinned to a series by an attribute, not by position.

**How**
- [strong] **One name, from visible text.** `role="img"` on the `svg` with `aria-labelledby` pointing at the summary sentence. MDN's SVG [`title`](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/title): "If an element can be described by visible text, it is recommended to reference that text with an `aria-labelledby` attribute rather than using the `<title>` element." `role="img"` hides the marks' text from assistive technology, which is why the table carries the values.
  ```html
  <figure>
    <p id="trend">Open findings fell from 120 to 48 between June and October.</p>
    <svg role="img" aria-labelledby="trend" viewBox="0 0 400 200">…</svg>
    <figcaption>Source: audit of <time datetime="2026-10-09">9 Oct 2026</time></figcaption>
    <details><summary>Show data</summary><table>…</table></details>
  </figure>
  ```
- [strong] **The long description is structured.** The W3C's [complex images tutorial](https://www.w3.org/WAI/tutorials/images/complex/) presents it "as headings, text, and a table" inside a `figure`, and warns that through `aria-describedby` screen readers "do not have access to structural information, such as any headings and tables"; so the table sits in the page, never in a description attribute.
- [required] **Series by attribute.** Each series carries `data-series="errors"`; the stylesheet maps series to the categorical palette's custom properties (`[data-series="errors"] { --series: var(--color-data-1); }`), so a filter that removes a series leaves the others' colours alone (code-standard rule 6, code-standard rule 22). Status colours are not series colours.
- [required] **Themes.** Marks read `fill: var(--series)` and `stroke: currentColor` for axes, so a theme switch recolours the chart without a redraw (code-standard rule 53, [tokens: themes and modes](tokens.md#themes-and-modes)).
- [strong] **Motion.** Entry and transition animation sits inside `prefers-reduced-motion: no-preference` ([accessibility: reduced motion and colour scheme in code](accessibility.md#reduced-motion-and-colour-scheme-in-code)).
- [required] **Drill targets are links** in the table or a list beside the chart; a click handler on a bar is not the only way in (code-standard rule 20, code-standard rule 21).
- [weak] A chart library is loaded only on the page that draws a chart ([performance: JavaScript delivery](performance.md#javascript-delivery)). Which chart and how it is drawn are [data visualisation: choosing a chart by its job](../ui/patterns/data-visualisation.md#choosing-a-chart-by-its-job) and [data visualisation: colour by job](../ui/patterns/data-visualisation.md#colour-by-job).

**Cases**
- An SVG chart with no role and a `text` element per tick → a screen reader reads forty numbers out of order; `role="img"`, a named summary and the table.
- `aria-label="Chart"` on the svg → name it with the message ("Open findings fell from 120 to 48…"); "Chart" says nothing.
- A canvas chart with no alternative → the same `figure`, with the summary and the table; canvas content is invisible to assistive technology.
- Series colours assigned by index, so filtering out the first series recolours the rest → `data-series` per series.

**Accessibility**
- [required] WCAG 2.2 1.1.1 Non-text Content, 1.3.1 Info and Relationships (the table), 1.4.1 Use of Color and 1.4.11 Non-text Contrast (direct labels or the table meet both).
- [required] code-standard rule 1, code-standard rule 18, code-standard rule 20.

**Check**
- *Script:* could flag an `svg` or `canvas` larger than an icon with no `role="img"` and name, a chart `figure` with no `table`, and series fills that are literals rather than custom properties.
- *Judgement:* Read the page with a screen reader: does the chart's name state its message, and can every value be reached in the table?

**Sources:** MDN and the W3C tutorial as linked; they agree that a visible description beats a hidden one.

## Code samples and live examples

**What good looks like**
- [moderate] A code sample is `pre` and `code`, its language named, its text exactly what pastes and runs.
- [required] A copy button is a real `button` with a name, and says it copied in a status message (WCAG 4.1.3).
- [strong] A live example in an `iframe` has a `title` naming what it shows, and a link that opens it alone.
- [weak] It implements [documentation: examples](../ui/profiles/documentation.md#examples-do-and-dont-live-examples-code).

**How**
- [strong] **Markup:** `<pre><code class="language-html">…</code></pre>`, with `<`, `>` and `&` escaped in the source ([security: escaping by context](security.md#escaping-by-context-xss)); the highlighter's spans are presentational and add nothing to the text.
- [strong] **Long lines scroll inside the block**: `overflow-x: auto` on the `pre`, which then needs `tabindex="0"` and a name to scroll by keyboard, as axe's `scrollable-region-focusable` asks ([Deque](https://dequeuniversity.com/rules/axe/4.10/scrollable-region-focusable)); never wrap code by breaking words.
- [required] **Copy:** `navigator.clipboard.writeText()` returns a promise "resolved once the system clipboard has been updated" and works only in a secure context, failing with `NotAllowedError` when not allowed ([MDN `writeText()`](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText)); write "Copied" or "Couldn't copy" into a `role="status"` element on the outcome, not on the click.
  ```js
  button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(code.textContent); status.textContent = 'Copied'; }
    catch { status.textContent = "Couldn't copy: select the code and copy it"; }
  });
  ```
- [required] **No script:** the copy button is rendered by the script, since it cannot work without one; the code stays selectable (code-standard rule 20).
- [strong] **Live examples:** `<iframe title="Text input, with error" src="…">` ([MDN `iframe`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe): without a title readers "have to navigate into the `<iframe>` to determine what its embedded content is"), followed by an ordinary link "Open this example in a new tab: text input, with error".
- [weak] Do and don't pairs are a `figure` each with a `figcaption` that starts with the word "Do" or "Don't" ([lists, description lists and figures](#lists-description-lists-and-figures)).

**Cases**
- The copy button is an icon `div` with a click handler → a `button` with an accessible name (code-standard rule 18) and a status message.
- "Copied" appears for a second as a tooltip and is never announced → a persistent `role="status"` element beside the button.
- A sample shows `&lt;button&gt;` on the page → the source was escaped twice; escape once, at output.
- Five live examples are untitled iframes → each gets a `title` naming the component and state.

**Accessibility**
- [required] WCAG 2.2 4.1.2 Name, Role, Value (copy button, iframe title), 4.1.3 Status Messages (copied), 2.1.1 Keyboard (scrollable code and the example's own controls), 1.4.1 for do and don't.
- [required] code-standard rule 15 (the caption is a description), code-standard rule 18, code-standard rule 20.

**Check**
- *Script:* could flag an `iframe` without `title`, a scrollable `pre` without `tabindex`, and a copy control that is not a `button` or has no name.
- *Judgement:* Does each sample paste and run as shown?

**Sources:** MDN and Deque as linked; GOV.UK's open-in-a-new-tab link is cited in [documentation](../ui/profiles/documentation.md#examples-do-and-dont-live-examples-code).

## Valid nesting and no div soup

**What good looks like**
- [required] Each element sits where its content model allows; the page passes a validator with no errors (HTML).
- [required] A `div` or `span` appears only where no element with meaning fits (code-standard rule 1).
- [required] No interactive element inside another (HTML).

**How**
- [required] **Content models** say what an element may contain ([HTML content models](https://html.spec.whatwg.org/multipage/dom.html#content-models)). The ones that bite:
  - `a`: "there must be no interactive content descendant, `a` element descendant, or descendant with the `tabindex` attribute specified".
  - `button`: phrasing content, "no interactive content descendant and no descendant with the `tabindex` attribute specified" ([HTML `button`](https://html.spec.whatwg.org/multipage/form-elements.html#the-button-element)).
  - `p`: phrasing content only; a `div` inside a `p` closes the paragraph in the parser, so the DOM differs from the source.
  - `ul`/`ol`: only `li` (and script-supporting elements) as children.
- [required] **Div as last resort.** The WHATWG calls `div` "an element of last resort" ([HTML `div`](https://html.spec.whatwg.org/multipage/grouping-content.html#the-div-element)); code-standard rule 1 allows it for a box a layout needs and nothing semantic provides.
- [strong] **Validate.** The [Nu HTML Checker](https://validator.w3.org/nu/) reports content-model errors, duplicate ids and bad attribute values; run it on rendered output, not on templates.

**Cases**
- A card is an `a` wrapping a heading, text and a "Save" button → the button cannot sit inside the link; make the title the link and stretch it, with the button above it.
- A template emits `<p><div data-note>` → the parser closes the `p` before the `div` and the stylesheet's `p > [data-note]` matches nothing; use a `div` for the wrapper or a `span` inside.
- Twelve nested `div`s to centre one heading → one container element and the heading (code-standard rule 3); each wrapper is a box someone will style.
- A semantic element chosen for its default look (a `blockquote` for indentation, an `h5` for small bold text) → the right element, styled by its context or an attribute (code-standard rules 1 and 6).

**Accessibility**
- [required] WCAG 2.2 1.3.1 Info and Relationships, 4.1.2 Name, Role, Value (nested interactive elements have no reliable name or role).
- [required] code-standard rule 1; code-standard rule 50 for why a selector that follows markup breaks when nesting changes.

**Check**
- *Script:* `tools/parity/pages.mjs` structure reports duplicate ids. Could run the Nu checker over each rendered page in a project's check and fail on errors.
- *Judgement:* For each `div`: is there an element that says what this is?

**Sources:** WHATWG and the Nu checker as linked.

## Custom elements

**What good looks like**
- [required] A component's host is an autonomous custom element whose name contains a hyphen (HTML).
- [required] The native control lives inside it and carries the behaviour; the host carries the variant (code-standard rule 8).
- [required] No attribute name the platform already gives meaning to (code-standard rules 9 and 10).

**How**
- [required] **The name.** A valid custom element name starts with a lower-case ASCII letter, has no upper-case letters and "contains a U+002D (-)"; the hyphen guarantees no future HTML element will collide ([HTML custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name)).
- [strong] **Autonomous, not customised built-ins.** MDN: Safari "does not plan to support" customised built-in elements (`is="…"`) ([MDN, using custom elements](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements)); wrap the native element instead.
- [required] **No semantics of its own.** An undefined or script-free custom element is a generic inline box with no role. It never takes a role to impersonate a native control; a `<ds-button>` holds a `<button>` (code-standard rule 8).
  ```html
  <ds-button variant="primary" size="md"><button type="submit">Save</button></ds-button>
  ```
- [required] **Content goes in slots** in the template language (code-standard rule 13); a registered element is written only for behaviour HTML lacks (code-standard rule 8), and its script is written once (code-standard rule 36).
- [required] **Display.** An unknown element is inline by default, so the host's stylesheet sets its `display` (CSS).
- [weak] How a registered one is built is [web-components.md](web-components.md); the same component in React is the native element itself, [react.md](react.md).

**Cases**
- `<ds-button disabled>` → the `disabled` is on a box that is not a control; it goes on the inner `button` (code-standard rule 9).
- A container takes `align="center"` → every descendant's text centres from the presentational hint; rename it (code-standard rule 10's evidence).
- A design-system `Role` axis written as `role="primary"` → a screen reader is told of an ARIA role called "primary"; rename to `variant` (code-standard rule 9).
- A tabs component is a registered web component with shadow DOM because "components should be web components" → tabs need script, so a registered element can be right, but check first that links with `aria-current` (navigation tabs) do not already do the job.

**Accessibility**
- [required] WCAG 2.2 4.1.2 Name, Role, Value: the role and state come from the native element inside.
- [required] code-standard rules 8, 9, 10, 13, 36.

**Check**
- *Script:* `tools/css-lint/lint.mjs` gates *a state is a pseudo-class, disabled the control's own* (no non-ARIA `role` or `disabled` on a custom element) and *no presentational attribute as a variant*.
- *Judgement:* Does every interactive component have a native control inside it doing the work?

**Sources:** WHATWG and MDN as linked.
