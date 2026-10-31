# Responsive layout

How a page and its components respond to the space they are given: intrinsic layout first, grids that fill their rows, one page grid, container queries, breakpoints, fluid type, tables, viewport units, touch targets, zoom and reflow, truncation and line clamps, and safe areas. A design file shows three or four fixed widths because a design tool cannot show a continuum; translating them literally, three media queries for three layouts, leaves every width between the frames unattended. The order to reach for things is: nothing (normal flow already reflows), intrinsic sizing, container queries, and media queries last, because each step down states the design in one more place. It serves code-standard rule 3 (every band holds one container), code-standard rule 11 (a layout container is a component), code-standard rule 46 (a page dimension lives in one place), code-standard rule 54 (units, type and breakpoints written one way) and code-standard rule 57 (a fix holds for any value its input can take), and design-standard's principle *for everyone, in any context*. The design side of the page grid is [visual: layout and grid](../ui/design/visual.md#layout-and-grid); zoom, reflow and target size as design decisions are [accessibility](../ui/design/accessibility.md#zoom-reflow-and-text-spacing). Reduced motion is [accessibility.md](accessibility.md)'s, images (`srcset`, `sizes`, `picture`, dimensions and loading) [performance: images](performance.md#images)'s, logical properties and right-to-left [i18n.md](i18n.md)'s, and fallbacks for newer features [browser-support.md](browser-support.md)'s.

## Intrinsic layout first

**What good looks like**
- Most components carry no media query: they respond to the space they get through `min()`, `max()`, `clamp()`, `minmax()`, `auto-fit` and `flex-wrap`.
- No column, gap or inset is a number fitted to today's labels.
- Prose has a measure in `ch`; tables and dashboards run wider.

**How**
- A grid that wraps with no breakpoint. The `min(16rem, 100%)` matters: a bare `minmax(16rem, 1fr)` overflows any container narrower than 16rem, the commonest grid bug on small screens.
  ```css
  grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  ```
  `auto-fit` collapses empty tracks so the items stretch; `auto-fill` keeps them, so a short row stays at column width ([MDN `repeat()`](https://developer.mozilla.org/en-US/docs/Web/CSS/repeat)).
- A row that wraps when it runs out of room: `display: flex; flex-wrap: wrap; gap: var(--space-2)`, each item `flex: 1 1 12rem` where items should share the line, or `flex: none` where they hug ([MDN `flex-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap)).
- A measure: `max-inline-size: 65ch` on the prose block, never a fixed width.
- Space between siblings is `gap` on the parent, not a margin on each child, so nothing needs a `:last-child` exception.
- Columns sized by content: `grid-template-columns: max-content 1fr` or `minmax(min-content, 20rem)`, so a longer label widens its column instead of clipping (code-standard rule 57).
- Long strings (URLs, codes, identifiers) on any container that holds user content: `overflow-wrap: anywhere` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap)).

**Cases**
- A card list breaks into three, two and one columns at three breakpoints → one `auto-fit` grid; it also lays out correctly at every width between, which the three queries did not.
- A filter row's columns are typed as `140px 96px 200px` to fit today's labels → `max-content` columns or a wrapping flex row; one translated label longer and the fixed columns clip it.
- A tag list overflows its card at 320px → `flex-wrap: wrap` on the list; a wrapping row needs no query.
- A component sets `width: 360px` because the frame drew it at 360 → ask what it does when the space changes; usually `max-inline-size: 22.5rem` or nothing at all.

**Accessibility**
- 1.4.10 Reflow and 1.4.4 Resize Text are what intrinsic sizing protects; see *Zoom and reflow* below.
- code-standard rule 54 (lengths in rem), code-standard rule 57 (derive from the content).

**Check**
- *Script:* `tools/parity/pages.mjs overflow` reports a child drawn outside its parent at the project's `widths`, between the frames as well as at them. Could: flag a `px` width or a `grid-template-columns` of fixed lengths in component sheets.
- *Judgement:* name the input that breaks this layout: a longer label, one more item, a narrower parent. If one exists, what quantity should the size derive from?

**Sources:** [MDN `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp), [MDN `min()`](https://developer.mozilla.org/en-US/docs/Web/CSS/min), MDN `repeat()` and `flex-wrap` as linked. Every Layout's primitives (cited in [candidates.md](candidates.md)) take the same line as commentary.

## Grids that fill their rows

**What good looks like**
- A strip of tiles takes its column count from how many tiles it holds, so every row is full at every width: no tile alone on a last row, no empty cell, no placeholder.
- The same rules hold when a tile is added or removed; nothing is fitted to today's count.
- The design half (which counts split how, and when tiles should be a table) is [data: KPI tiles](../ui/patterns/data.md#kpi-tiles).

**How**
- **Count the children in CSS.** `:has()` matches an element when a relative selector matches one of its descendants ([MDN `:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has), Baseline since December 2023), so `:has(> :nth-child(3n):last-child)` means "a multiple of three children". A custom property carries the result to one grid declaration:
  ```css
  [data-tiles] { --cols: 1; display: grid; gap: var(--space-3);
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); }
  @container (inline-size >= 36rem) {
    [data-tiles]:has(> :nth-child(2n):last-child) { --cols: 2; } }
  @container (inline-size >= 60rem) {
    [data-tiles]:has(> :nth-child(3n):last-child) { --cols: 3; } }
  ```
  At the wide size add `:has(> :nth-child(4):last-child)` for 4 and `:nth-child(5)` for 5; an odd count stays one column until it fits in one row. The widths are the project's breakpoints, written once (code-standard rule 54), and the container is the strip's wrapper, since an element cannot query itself ([container queries](#container-queries)).
- **Not `auto-fill` or `auto-fit` alone.** Both wrap by width, never by count, so a short last row survives ([intrinsic layout first](#intrinsic-layout-first)); they suit an open-ended card list, not a fixed strip.
- **Equal heights for free.** Grid rows stretch their items, so a tile with a wrapped label lengthens its row, not its neighbours' content; no fixed height (code-standard rule 57).
- **Never pad with an empty element.** An `aria-hidden` filler tile is a hack to make the grid agree; cut a tile or move it to a table (code-standard rule 42).
- The tile itself (a link holding a `dl` or a heading and value) is [data: KPI tiles](../ui/patterns/data.md#kpi-tiles)' Build part.

**Cases**
- Five tiles in `repeat(auto-fill, minmax(14rem, 1fr))` leave one alone on the second row at tablet width → count the children; five stays one column there and one row of five on wide screens.
- A strip set to `repeat(4, 1fr)` for today's four tiles gets a fifth and wraps one → the count-derived rule handles both.
- A grey placeholder tile fills the gap → remove it.

**Accessibility**
- WCAG 2.2 1.4.10 Reflow: one column at 320px, by default. 1.3.2 Meaningful Sequence: grid placement keeps DOM order, so no `order` or explicit placement reorders tiles (code-standard rule 2).
- code-standard rule 57.

**Check**
- *Script:* could, at each of the project's `widths`, read the tiles' `offsetTop` and assert every row holds the same number of tiles, and flag an empty or `aria-hidden` child in a tile strip.
- *Judgement:* Remove one tile and add one: does every row still fill?

**Sources:** MDN `:has()` and `repeat()` as linked. Quantity queries on `:nth-child` are long-standing practice; `:has()` lets the parent read the count, which is what makes this a single rule.

## One page grid and one container element

**What good looks like**
- The page grid (maximum width, gutter, centring) is stated once, in one container element, and every band holds exactly one of it (code-standard rules 3, 11 and 46).
- Bands are full-bleed; content inside them starts on the same edge at every width.
- No stylesheet re-derives the grid with margin arithmetic.

**How**
- The container component owns the numbers; a page never declares them:
  ```css
  ds-container { display: block; inline-size: min(100% - 2 * var(--gutter), var(--page-width)); margin-inline: auto; }
  ```
- Full-bleed is the band's job (the `section` is full width, its background reaches the edges), so a "breakout" child needs no negative margins: it sits outside the container, in the band.
- Variants of the container (narrow, wide, centred children) are attributes on it (code-standard rule 11), not page rules.
- Where the design publishes the page width as a token, bind to it; where it only draws it, name it once in the base layer with a comment saying so (code-standard rule 46).

**Cases**
- Five stylesheets each centre their content with `margin-inline: max(var(--gutter), (100% - var(--page-width)) / 2)` → delete all five; put each band's content in the container. The arithmetic is the grid restated, and the copies drift by a pixel or two as each is edited.
- A hero and the body below it start at different x positions below the design's frame width → both inside the container; the misalignment is two definitions of the grid.
- A docs page wants prose narrower than the tables beside it → a `narrow` attribute on the container, or a `ch` measure on the prose block; not a second page width.
- A sidebar layout → a grid inside the container (`grid-template-columns: minmax(12rem, 16rem) 1fr`), collapsing to one column with `auto-fit` or a container query, not a separate max width.

**Accessibility**
- code-standard rule 2: DOM order stays reading order when the grid rearranges columns at a breakpoint.
- 1.4.10: the container's `min(100% - …)` keeps the page from scrolling sideways at 320px.

**Check**
- *Script:* `tools/css-lint/check.mjs` gate "a layout container is a component" (code-standard rule 11) fails a rule outside the components layer that sets the container's max width; gate "literal is a token" (code-standard rules 22 and 46) catches the page width typed where the design binds a token; `tools/parity/pages.mjs structure` asserts one `main` and named landmarks.
- *Judgement:* does every band hold one container, and does any rule outside it compute a left edge from the viewport?

**Sources:** code-standard rule 3's evidence is the incident; [MDN `min()`](https://developer.mozilla.org/en-US/docs/Web/CSS/min) for the arithmetic inside the one place it is allowed.

## Container queries

**What good looks like**
- A component that appears in more than one column width responds to its container, not the viewport.
- The query goes on a wrapper the component sits in, never on the element the query styles.
- Style queries switch a component's mode where a custom property already carries it.

**How**
- Size queries: the parent becomes a container, the child is styled by it.
  ```css
  ds-card-region { container: card / inline-size; }
  @container card (inline-size >= 30rem) { ds-card { grid-template-columns: 12rem 1fr; } }
  ```
- An element cannot query itself: a component that sets `container-type` on its root and queries that root never matches. Put the container on the component's host and style its parts, or on the slot the caller provides.
- `container-type: inline-size` applies size containment in the inline axis: the element's width no longer comes from its contents. A container that relied on shrink-to-fit (a flex item sized by its content, an inline-block) collapses; give it a width from its parent ([MDN `container-type`](https://developer.mozilla.org/en-US/docs/Web/CSS/container-type)).
- Container query units (`cqi`, `cqb`) size things relative to the container, for type or padding inside a card that must scale with the card.
- Style queries: `@container style(--density: compact) { … }`. Any element can be a style container without `container-type`; only custom properties can be queried so far ([MDN, size and style queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_size_and_style_queries)). Support arrived in Firefox last ([caniuse](https://caniuse.com/css-container-queries-style)); below the project's floor, the same mode as an attribute on the component is the fallback ([browser-support.md](browser-support.md)).

**Cases**
- The same card in the main column and in a sidebar → a size container on each region; one card stylesheet, no "sidebar card" variant.
- A list item that should go compact inside a dense panel → the panel sets `--density: compact`, the item answers with a style query; where style queries are below the support floor, the item takes a `density` attribute from its caller (code-standard rule 9) rather than reading its parent, which code-standard rule 50 warns against.
- A layout collapses to zero height after adding `container-type: inline-size` to a flex child → it had no width but its content's; give it `flex: 1` or an explicit inline size.
- A page-level change (the navigation becomes a menu button) → a media query; the navigation's width is the viewport's, and a container adds nothing.

**Accessibility**
- 1.4.10: a component that only responds to the viewport can overflow a narrow column at a wide viewport; a container query is how a component keeps reflow wherever it is placed.
- code-standard rule 2 holds when a query reorders parts.

**Check**
- *Script:* `tools/parity/pages.mjs overflow` sees a component overflowing its column at a width no frame drew. Could: flag an `@container` whose name is declared on the same element it styles.
- *Judgement:* does this component change because the page changed, or because its own space did? The second is a container query.

**Sources:** [CSS Conditional Rules Module Level 5](https://www.w3.org/TR/css-conditional-5/), MDN and caniuse as linked. Size queries are the default for a component's layout; the toolkit uses style queries only above the project's support floor.

## Breakpoints

**What good looks like**
- Breakpoints come from the design file's tokens, written by the token build as Sass variables in rem with one mixin (code-standard rule 54); nothing else names one.
- Queries run one direction, mobile first, `min-width` only.
- Each breakpoint is named for its rung on the ladder, never after a device.

**How**
- Where the design has a breakpoints collection, the build writes `$sm` … `$xl` and `@mixin from($bp)`; a component writes `@include from($md) { … }`. Why they are Sass variables, and the custom properties they re-point, is [tokens: custom properties or Sass variables](tokens.md#custom-properties-or-sass-variables).
- rem in a media query is relative to the browser's initial font size, never to a stylesheet's ([Media Queries 4, units](https://www.w3.org/TR/mediaqueries-4/)), so a reader who raises their default font size reaches the narrow layout sooner, which is what they need.
- Mobile first means `min-width` only. Mixing `min-width` and `max-width` produces overlapping ranges at the boundary and rules that fight; one direction removes the class of bug.
- Where the design has no breakpoints, use as few as the layout needs, at the width where it actually breaks (narrow the window until something looks wrong), and ask for the tokens so the design file records them (code-standard rules 24 and 51).
- A breakpoint is a page-level change: the navigation collapsing, a sidebar stacking. A component's own layout is a container query.
- Input and capability are separate queries: `@media (hover: hover)` for hover-only affordances, `@media (pointer: coarse)` for larger touch spacing ([MDN `hover`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/hover), [MDN `pointer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer)); width says nothing about touch.

**Cases**
- `$bp-tablet: 768px` → rename to its rung and convert to rem; "tablet" is also a phone in landscape, a split window and a small laptop.
- Every screen in the design file is drawn at one desktop width and none at a phone width → do not invent the small layouts in Sass. Build the intrinsic layout, ask for the phone frame and the breakpoint tokens, and record what is undecided in the project's context document.
- A design system's breakpoints collection holds both the canvas width the screens are drawn at and a container width inside it → the container width is the page grid's (`--page-width`), the canvas width is a breakpoint or nothing; check which one each binding means before writing either.
- A component set carries a `Breakpoint=sm|md` variant axis → it is not an attribute; render the component at that window width, or answer it with a container query, and map the axis to widths in the parity mapping.
- A stylesheet has both `@media (max-width: 47.99rem)` and `@media (min-width: 48rem)` → keep the `min-width` one and move the narrow rules to the base.

**Accessibility**
- 1.4.10 and 1.4.4: rem breakpoints keep the layout matched to the text size the reader chose.
- 1.3.4 Orientation: no breakpoint locks content to portrait or landscape ([Understanding 1.3.4](https://www.w3.org/WAI/WCAG22/Understanding/orientation.html)).

**Check**
- *Script:* `tools/tokens/check.mjs` fails a breakpoint variable or mixin that names nothing (code-standard rule 54). Could: flag a `max-width` media query, a breakpoint literal in a component sheet, and a breakpoint in `px`.
- *Judgement:* does each breakpoint mark a change in the page's layout, and is it from the tokens?

**Sources:** [MDN, using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries), Media Queries 4. The design side's breakpoint rulers (Primer, Carbon, GOV.UK) are in [visual](../ui/design/visual.md#layout-and-grid); the toolkit takes the project's set from its tokens.

## Fluid type

**What good looks like**
- Type comes from the design's text styles (code-standard rule 54); fluid sizing interpolates between values the design file holds, never values the stylesheet invents.
- Every fluid size has a rem term, so browser zoom and the reader's font size still move it.
- The largest size stays within about 2.5 times the smallest.

**How**
- `clamp(min, preferred, max)` with rem bounds and a preferred value of rem plus viewport:
  ```css
  --heading-lg-font-size: clamp(1.5rem, 1.1rem + 1.5vw, 2.25rem);
  ```
- A `vw`-only size does not grow with zoom: "Browsers do not scale viewport-based units when zooming the page", and a maximum no more than about 2.5 times the minimum always passes 1.4.4 ([Smashing, fluid type and accessibility](https://www.smashingmagazine.com/2023/11/addressing-accessibility-concerns-fluid-type/), commentary).
- Where the design's text styles carry modes (Desktop and Mobile, say), the token build writes both and switches them at a breakpoint. A clamp between the two mode values is a project's ruling, written into its context document; without one, step at the breakpoint.
- Line height stays unitless so it scales with the size; the text style's fields are applied whole with `@include text-style(name)` (code-standard rule 54).

**Cases**
- A heading set to `font-size: 4vw` → `clamp()` with rem bounds and a rem term; at 200% zoom the `vw` size does not move.
- A design has only desktop sizes and the build wants smaller phone sizes → ask for a Mobile mode in the design file; sizes invented in Sass have no record in the source and the next token build cannot reproduce them.
- A display size runs from 1rem to 4rem → narrow the range or test at 200% text; past 2.5 times the minimum, zoom can fail to reach 200%.

**Accessibility**
- 1.4.4 Resize Text (AA) ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)); 1.4.12 Text Spacing: unitless line height keeps a user's spacing override proportional.
- code-standard rule 54.

**Check**
- *Script:* could: flag a `font-size` with a viewport unit and no rem or em term, and a clamp whose maximum exceeds 2.5 times its minimum.
- *Judgement:* at 200% browser zoom, does every text size at least double, or reach 200% of its default?

**Sources:** [MDN `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp), WCAG Understanding 1.4.4, Smashing as commentary. The toolkit follows the design file's modes first and uses fluid interpolation only by ruling.

## Tables on small screens

**What good looks like**
- A table wider than its space scrolls inside its own container; the page does not scroll sideways.
- The scroll container is reachable by keyboard and named, so a screen reader announces what it is.
- Stacking a table into records is chosen deliberately, for tables read one row at a time.

**How**
- The container, per [Roselli](https://adrianroselli.com/2020/11/under-engineered-responsive-tables.html): a region named by the caption, focusable so the arrow keys scroll it.
  ```html
  <div role="region" aria-labelledby="cap-findings" tabindex="0"><table>
    <caption id="cap-findings">Findings by component</caption> … </table></div>
  ```
  with `[role="region"][aria-labelledby][tabindex] { overflow: auto }`, so the scroll style applies only where the semantics are present.
- Show that more columns exist: a shadow at the cut edge, and a focus ring on the container (it is a stop in the tab order).
- A sticky first column (`position: sticky; inset-inline-start: 0`) keeps the identifier in view; it needs a background or it shows the columns scrolling under it.
- Stacking: prefer rendering a list or description list for the narrow form over restyling `display` on table elements; when to choose which is [tables: responsive tables](../ui/patterns/tables.md#responsive-tables).

**Cases**
- A ten-column table widens its wrapper and the page scrolls sideways at 320px → the region container above; the page reflows and the table scrolls on its own axis.
- A table already scrolls with `overflow-x: auto` but a keyboard user cannot reach the hidden columns → add `tabindex="0"`, the role and the name; a mouse scrolls it, a keyboard has nothing to focus.
- A three-column contact table on a phone → a list of records at the narrow breakpoint; nobody compares down those columns.

**Accessibility**
- 1.4.10 Reflow excepts a data table's two-dimensional layout, not the page around it ([Understanding 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)); 2.1.1 Keyboard: the scroll container is focusable; 4.1.2 Name, Role, Value: the region has a name; 1.3.1 Info and Relationships: `caption`, `th` and `scope` survive the narrow form.
- code-standard rule 1 (markup stands on its own).

**Check**
- *Script:* `tools/parity/pages.mjs overflow` exempts a parent that scrolls, so a table inside a scroll container passes; it does not check the container's name or `tabindex`. Could: at 320px, assert no horizontal document scroll and that every scrolling container is focusable and named.
- *Judgement:* will people compare down columns on a phone, or read one record at a time?

**Sources:** Roselli as linked (practitioner, and the default here), WCAG Understanding 1.4.10, [tables: responsive tables](../ui/patterns/tables.md#responsive-tables).

## Viewport units

**What good looks like**
- Nothing full-height uses `100vh`.
- Full-height sections use `svh`, which is stable; only something that must track the browser's toolbars uses `dvh`.
- Full height is a minimum (`min-block-size`), never a fixed height around content.

**How**
- `svh` is the viewport with the browser's toolbars shown, `lvh` with them retracted, `dvh` follows them ([web.dev, viewport units](https://web.dev/blog/viewport-units)). `100vh` on mobile is the large viewport, taller than the visible area while the toolbars show, which is why a "100vh" section hides its bottom edge.
- `dvh` updates are throttled and some browsers debounce them by gesture (web.dev), so a layout sized in `dvh` can resize while the reader scrolls. Use `svh` for a hero; `dvh` for an app shell that must fill the screen exactly.
- `min-block-size: 100svh`, so content taller than the screen still grows.
- The virtual keyboard resizes only the visual viewport by default; `interactive-widget=resizes-content` in the viewport meta makes the layout respond to it ([MDN, viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element)).

**Cases**
- A landing hero at `height: 100vh` hides its call to action under the mobile toolbar → `min-block-size: 100svh`.
- A chat app's composer disappears under the virtual keyboard → `interactive-widget=resizes-content` and a `dvh` shell, tested on a device.
- A modal sized `height: 90vh` clips its content at 200% text → `max-block-size: 90svh; overflow: auto`.

**Accessibility**
- 1.4.4 and 1.4.10: a fixed viewport height around text clips it at zoom; use a minimum and let it grow.

**Check**
- *Script:* could: flag `100vh` and a `height` (not `min-block-size`) in viewport units on any element that holds text.
- *Judgement:* does the full-height block still show everything at 200% text and with the toolbars shown?

**Sources:** web.dev and MDN as linked; [CSS Values 4, viewport-relative units](https://www.w3.org/TR/css-values-4/#viewport-relative-units).

## Touch targets

**What good looks like**
- Every interactive target is at least 24 by 24 CSS px, or spaced so a 24px circle on it touches no other; touch-first controls aim for 44.
- The target is the element's box, made large with padding around the glyph, not by enlarging the glyph.
- A small visible control can have a larger hit area that overlaps nothing.

**How**
- `min-block-size` and `min-inline-size` from a sizing token, with padding: the control grows past the minimum when its content does.
- A hit area larger than the visual: a pseudo-element on the control, `inset: calc(-1 * var(--space-2))`, positioned against the control. It must not overlap a neighbouring target, or the spacing exception no longer holds.
- Under `@media (pointer: coarse)`, widen the gap between adjacent targets rather than the targets' look.
- The numbers, their exceptions and the platform defaults are [accessibility: target size](../ui/design/accessibility.md#target-size); the component floor in the design file is figma-standard rule 26.

**Cases**
- Three 16px icon buttons 4px apart in a table row → a 24px box each with padding, or one row menu.
- A close button whose 24px comes from its 24px icon → it meets 2.5.8 by its box; give it padding to 44 where it is a primary touch control, and keep the glyph at its drawn size.
- An inline link in a paragraph → exempt; do not pad links inside prose.

**Accessibility**
- 2.5.8 Target Size (Minimum) (AA) ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)); 2.5.5 Target Size (Enhanced) (AAA) for important controls ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html)). Both are code candidates after one clean run ([candidates.md](candidates.md)).

**Check**
- *Script:* could: on a built page, measure each interactive element's box and apply the 24px circle test to its neighbours.
- *Judgement:* is a small target truly inline or essential, as the exceptions require?

**Sources:** WCAG Understanding 2.5.8 and 2.5.5. The toolkit takes 24px as the floor and the platform default as the touch target.

## Zoom and reflow

**What good looks like**
- The page reflows to one column at 320 CSS px wide with no horizontal page scroll, which is a 1280px window at 400% zoom.
- Text reaches 200% with nothing clipped or overlapping.
- Pinch zoom is never disabled.

**How**
- rem for lengths (code-standard rule 54), so the layout follows the reader's font size; px only for radii, strokes, blur and shadow offsets.
- No fixed height around text: `min-block-size`, and padding for the look.
- Never `user-scalable=no` or a `maximum-scale` in the viewport meta: "Disabling zooming capabilities… prevents people experiencing low vision conditions from being able to read and understand page content" ([MDN, viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element)).
- Rows of controls wrap (`flex-wrap`) or move behind a menu button at the narrow breakpoint; a navigation bar is the usual failure.
- Test with browser zoom at 200% and 400%, with the window at 320px, and with the 1.4.12 spacing values applied (line height 1.5, paragraph spacing 2, letter spacing 0.12, word spacing 0.16 times the font size).

**Cases**
- A navigation bar of six links scrolls the page sideways at 320px → wrap it, or step its padding down at the narrow breakpoint and collapse it behind a menu button below that; this failure is the nearest reflow candidate to a rule ([candidates.md](candidates.md)).
- A segmented control's labels wrap onto two lines at 400% zoom → let it become a menu below the breakpoint; tabs that wrap onto rows are design-standard rule 3's finding.
- A card with a fixed height clips its third line once text spacing is applied → `min-block-size`, or truncate with a way to read the rest.
- A sticky header covers half the screen at 400% zoom and hides the focused field → unstick it at the narrow breakpoint (2.4.11 Focus Not Obscured).

**Accessibility**
- 1.4.10 Reflow (AA) ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)), 1.4.4 Resize Text (AA), 1.4.12 Text Spacing (AA) ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)), 2.4.11 Focus Not Obscured (Minimum) (AA) ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)).
- code-standard rule 54.

**Check**
- *Script:* `tools/parity/pages.mjs overflow` at the project's `widths` (include 320); `tools/ui-check/check.mjs` reports tabs that wrap onto rows (design-standard rule 3). Could: assert no horizontal document scroll at 320px, and no clipping after injecting the 1.4.12 values.
- *Judgement:* at 400% zoom, can a reader reach every control and read every line without scrolling in two directions?

**Sources:** WCAG Understanding 1.4.4, 1.4.10, 1.4.12, 2.4.11; MDN as linked. The design side is [accessibility: zoom, reflow and text spacing](../ui/design/accessibility.md#zoom-reflow-and-text-spacing).

## Truncation and line clamps

**What good looks like**
- Text wraps first; truncation is the exception, chosen in the design ([disclosure: show more and truncation](../ui/patterns/disclosure.md#show-more-and-truncation)).
- The whole text stays in the DOM; the cut is CSS, by lines, so it follows font size, zoom and language.
- Every cut has a keyboard-reachable way to read the rest, and the "Show more" control renders only when the text overflows.

**How**
- **One line**: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` on a box with a width; a table cell's case is [html-semantics: table behaviour](html-semantics.md#table-behaviour).
- **Several lines**: the standard [`line-clamp`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/line-clamp) is not Baseline ("Limited availability"); the prefixed form "only works in combination with the `display` property set to `-webkit-box`… and the `-webkit-box-orient` property set to `vertical`", and MDN says that combination "will continue to be supported".
  ```css
  [data-clamp] { display: -webkit-box; -webkit-box-orient: vertical;
    -webkit-line-clamp: var(--clamp-lines, 3); overflow: hidden; }
  [data-clamp][data-expanded] { display: block; -webkit-line-clamp: unset; }
  ```
- **Show more**: a `button type="button"` with `aria-expanded` and `aria-controls` that toggles the hook attribute (code-standard rule 6); the script renders it only when `scrollHeight > clientHeight` on the clamped box (code-standard rule 12), and re-measures on resize.
- **Not `title`.** A `title` tooltip is unreachable from the keyboard ([Primer truncate](https://primer.style/product/components/truncate/accessibility/)); link the item to its full page or reveal on focus.
- **Never on focusable content**: a clamp that hides a link or button leaves a focus stop the reader cannot see.

**Cases**
- A description cut to 120 characters in the template → keep the text whole and clamp to three lines; a character cut ignores zoom and language (code-standard rule 29, code-standard rule 57).
- "Show more" appears under a one-line description → measure overflow before rendering the control.
- A clamped excerpt contains a link that disappears below the cut → move the link out, or do not clamp that block.

**Accessibility**
- WCAG 2.2 1.4.12 Text Spacing (a cut needs a reveal, [Understanding 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)), 1.4.10 Reflow, 2.1.1 Keyboard, 4.1.2 (`aria-expanded`).
- code-standard rule 6, code-standard rule 12, code-standard rule 29, code-standard rule 57.

**Check**
- *Script:* could, at 320px and with the 1.4.12 spacing applied, find boxes with `text-overflow: ellipsis` or a line clamp whose content overflows and assert each sits in a link or beside a focusable reveal; and flag a Show more control on a box that does not overflow.
- *Judgement:* Would wrapping, or more room, remove the need to cut?

**Sources:** MDN, Primer and WCAG as linked.

## Safe areas

**What good looks like**
- A page draws edge to edge only when it means to, and then keeps content clear of notches, rounded corners and the home indicator.
- Fixed and sticky bars add the inset to their own padding; nothing else needs to know.

**How**
- Edge-to-edge drawing is opted into with `viewport-fit=cover` in the viewport meta; MDN "highly recommend[s]" the safe-area inset variables with it ([MDN, viewport meta](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element)).
- `env(safe-area-inset-top|right|bottom|left)` are 0 on a rectangular viewport with nothing occupying it, and a px value otherwise ([MDN `env()`](https://developer.mozilla.org/en-US/docs/Web/CSS/env)). Add them to the token, never replace it:
  ```css
  ds-bottom-bar { padding-block-end: calc(var(--space-3) + env(safe-area-inset-bottom)); }
  :root { --gutter: max(var(--space-4), env(safe-area-inset-left), env(safe-area-inset-right)); }
  ```
- The variables are physical (left, right); in a right-to-left page the mapping is [i18n.md](i18n.md)'s.

**Cases**
- A fixed bottom bar's buttons sit under the home indicator on a phone → add `env(safe-area-inset-bottom)` to its bottom padding.
- A landscape phone's notch covers the start of each line → the gutter the container reads takes the larger of its token and the inset, stated once where `--gutter` is defined.
- A page without `viewport-fit=cover` → the browser letterboxes it and the insets are not needed; do not add them speculatively.

**Accessibility**
- 2.4.11 Focus Not Obscured: a control under a notch or the home indicator is a control that cannot be seen or reached.

**Check**
- *Script:* could: flag `viewport-fit=cover` with no `env(safe-area-inset-*)` in any fixed or sticky element's padding.
- *Judgement:* on a notched phone in both orientations, is every control fully visible and reachable?

**Sources:** MDN `env()` and viewport meta, as linked.
