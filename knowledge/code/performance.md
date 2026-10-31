# Performance

How a page loads fast, responds at once and holds still: the Core Web Vitals and what moves them, images, fonts, CSS and JavaScript delivery, caching and compression, third-party scripts, layout stability in code, measurement and budgets. No code-standard rule is admitted for performance yet; the page applies code-standard rule 20 (the HTML path is also the fastest path), code-standard rule 47 (a client boundary is a cost), code-standard rule 54 (font stacks and units) and code-standard rule 57 (a size derived from content, not typed to fit). It serves the design-standard principles *for everyone, in any context* (slow devices and networks are part of "any context"), *show state and give feedback* and *as little as possible, and no simpler*. How a script behaves is [javascript.md](javascript.md); fluid layout and breakpoints are [responsive.md](responsive.md), which leaves images, responsive ones included, to this page; which features may be relied on is [browser-support.md](browser-support.md).

**Implements:** [feedback: loading](../ui/patterns/feedback.md#loading), [interaction: response times and perceived performance](../ui/design/interaction.md#response-times-and-perceived-performance), [interaction: layout stability](../ui/design/interaction.md#layout-stability) and [ux: performance as UX](../ui/design/ux.md#performance-as-ux).

## Core Web Vitals

**What good looks like**
- At the 75th percentile of real page loads, on mobile and desktop separately: LCP at most 2.5 s, INP at most 200 ms, CLS at most 0.1 ([web.dev Web Vitals](https://web.dev/articles/vitals)).
- Each metric is traced to the code that moves it, not tuned as a score.
- Field data decides whether a page passes; lab data explains why.

**How**
- **Thresholds** ([web.dev thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)):

| Metric | Measures | Good | Poor |
|---|---|---|---|
| LCP, Largest Contentful Paint | loading: when the largest text block or image paints | ≤ 2500 ms | > 4000 ms |
| INP, Interaction to Next Paint | responsiveness: input to the next frame, across the visit | ≤ 200 ms | > 500 ms |
| CLS, Cumulative Layout Shift | visual stability: unexpected movement | ≤ 0.1 | > 0.25 |

- **What moves LCP** ([optimize LCP](https://web.dev/articles/optimize-lcp), [top Core Web Vitals](https://web.dev/articles/top-cwv)): server response (TTFB), the LCP resource discoverable in the HTML, its priority (`fetchpriority="high"`), never lazy-loaded, and no render-blocking CSS or script in front of it. TTFB and FCP are its diagnostics.
- **What moves INP** ([INP](https://web.dev/articles/inp), [optimize INP](https://web.dev/articles/optimize-inp)): long tasks on the main thread, heavy event handlers, large DOM updates. Do the least work in a handler, update the screen first and yield before the rest.
- **What moves CLS** ([CLS](https://web.dev/articles/cls), [optimize CLS](https://web.dev/articles/optimize-cls)): media without dimensions, late-inserted content, web fonts swapping, animations of layout properties. Shifts within 500 ms of a discrete input are excluded, so a shift the reader caused does not count.

**Cases**
- The hero image is the LCP element and carries `loading="lazy"` from a global default → remove it and add `fetchpriority="high"`; web.dev: "Never lazy-load your LCP image".
- A filter click takes 600 ms to show anything because the handler re-renders 2,000 rows → show the pressed state at once, then yield and render in chunks (or render fewer rows, [tables: pagination](../ui/patterns/tables.md#pagination-or-load-more)).
- A cookie banner pushes the page down a second after load → overlay it, or reserve its space from the first paint (Layout stability below).
- Lab LCP is 1.2 s and field LCP is 3.8 s → the lab device and network are not the readers'; trust the field, then reproduce with the slower profile (Measuring below).

**Accessibility**
- No WCAG criterion names speed. Layout shift relates to 2.4.3 Focus Order and 3.2.1 On Focus when it moves a target under the pointer or the focus; a slow response is *show state and give feedback*: acknowledge at once ([feedback: loading](../ui/patterns/feedback.md#loading)).
- code-standard rule 20.

**Check**
- *Script:* none in the toolkit. Could run Lighthouse in CI per template and fail on LCP, TBT (INP's lab proxy) and CLS over budget; could collect field values with `web-vitals`.
- *Judgement:* Which element is the LCP on each template, and is it discoverable in the HTML?

**Sources:** web.dev as linked. Google sets the thresholds and the 75th percentile; the toolkit adopts them as they stand.

## Images

**What good looks like**
- Every image is served at the size it renders, in a modern format, with its space reserved.
- Images in the first viewport load eagerly, the LCP image at high priority; images below the fold load lazily.
- Decorative images cost nothing to assistive technology and as little as possible to the network.

**How**
- **Dimensions:** `width` and `height` attributes on every `img`, with `max-inline-size: 100%; block-size: auto` in the base, so the browser reserves the box from its aspect ratio ([MDN `<img>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img), [optimize CLS](https://web.dev/articles/optimize-cls)).
- **Sizes:** `srcset` with width descriptors and a `sizes` that says how wide the image renders at each layout ([MDN responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images)). `<picture>` for art direction (a tighter crop at narrow widths) or format fallback, with the `alt` and dimensions on the `img` inside ([MDN `<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/picture)).
  ```html
  <img src="card-640.jpg" srcset="card-320.jpg 320w, card-640.jpg 640w, card-1280.jpg 1280w"
       sizes="(min-width: 64rem) 20rem, 100vw" width="640" height="400" alt="…">
  ```
- **A frame of fixed proportion** whatever the image: `aspect-ratio: 16 / 9; object-fit: cover` ([MDN `aspect-ratio`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/aspect-ratio)).
- **Formats:** AVIF and WebP compress better than JPEG and PNG; give AVIF a fallback through `<picture>` ([MDN image types](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Image_types)). SVG for icons and line art.
- **Lazy:** `loading="lazy"` below the fold only; web.dev: "Don't lazy-load images that are likely to be in-viewport when the page loads, especially LCP images" ([browser-level lazy loading](https://web.dev/articles/browser-level-image-lazy-loading)).
- **Priority:** `fetchpriority="high"` on the LCP image, nowhere else by habit ([Fetch Priority](https://web.dev/articles/fetch-priority)). An LCP image named only in CSS is found late; put it in the HTML or preload it.
- `alt` is [html-semantics: images and alt](html-semantics.md#images-and-alt); transparent artwork from a design file is code-standard rule 26 ([figma-handoff.md](figma-handoff.md)); a placeholder renders only when there is no image (code-standard rule 12).

**Cases**
- A 2400 px photo renders at 400 px in a card → `srcset` at 400, 800 and 1200 w with `sizes="(min-width: 60rem) 25vw, 100vw"` (the `sizes` derived from the layout, code-standard rule 57).
- Every image gets `loading="lazy"` from a component default → the component takes a `priority` input; the first-viewport instances pass it and render eager.
- A hero is a CSS `background-image` → the preload scanner cannot see it; use an `img` with `object-fit: cover`, or `<link rel="preload" as="image">`.
- A logo is a 60 KB PNG → SVG, inlined or as a file, a fraction of the size and sharp at any density.
- A wide banner whose subject is unreadable when scaled down → `picture` with a tighter crop for narrow widths.

**Accessibility**
- 1.1.1 Non-text Content (alt text), 1.4.5 Images of Text (text stays text, which is also lighter).
- code-standard rule 18 (decorative images have empty alt), code-standard rule 26.

**Check**
- *Script:* could flag any `img` without `width` and `height`, a `srcset` with `w` descriptors and no `sizes`, `loading="lazy"` on an image above the fold at the check's viewport, an LCP image without `fetchpriority="high"`, and an image whose intrinsic width exceeds twice its rendered width. `tools/parity/pages.mjs` overflow catches images that overflow their container.
- *Judgement:* Which image is the LCP on this template at mobile width, and does `sizes` describe the width each image actually renders at?

**Sources:** MDN and web.dev as linked. Sources agree.

## Fonts

**What good looks like**
- Text renders at once in a fallback that takes the same room as the web font, so the swap moves nothing.
- Only the weights, styles and character ranges the page uses are downloaded, in WOFF2.
- The one or two fonts the first view needs are discovered early.

**How**
- **Format and subset:** WOFF2 only ("Use only WOFF2 and forget about everything else", quoted in [font best practices](https://web.dev/articles/font-best-practices)); subset to the scripts used and split with `unicode-range` ([MDN `unicode-range`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/unicode-range)).
- **`font-display`:** `optional` when no layout shift matters most (at most 100 ms of invisible text, no swap); `swap` when the web font must show, delivered early enough not to shift ([font best practices](https://web.dev/articles/font-best-practices); values at [MDN `font-display`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display)). Without it, browsers hide the text while the font loads (the `auto` behaviour, which in Chromium and Firefox is a block of up to 3 s).
- **Matched fallback:** a second `@font-face` over a local font with `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` so the fallback occupies the web font's box ([Chrome font fallbacks](https://developer.chrome.com/blog/font-fallbacks), [MDN `size-adjust`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/size-adjust)):
  `@font-face { font-family: "Body fallback"; src: local(Arial); size-adjust: 104%; }` then `font-family: Body, "Body fallback", <system stack>;` (the stack itself is code-standard rule 54). The percentages are computed from the two fonts' metrics, never tuned by eye (code-standard rule 57).
- **Preload sparingly:** `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the one face the first view uses; preload "comes at the cost of taking away browser resources" from others, and fonts need `crossorigin` even on the same origin ([MDN preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload)).
- **Third-party fonts:** `preconnect` to the font origin ([MDN preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect)), or self-host with the same subsetting.

**Cases**
- Headings jump when the web font arrives → add a metric-matched fallback face; the swap then moves nothing.
- Six weights are loaded and two are used → load the two, or one variable font if the design uses a range.
- Every weight is preloaded → preload the body face only; the rest compete with the LCP image.
- A site serving one language loads the full Latin Extended, Cyrillic and Greek sets → subset to what the content uses ([i18n.md](i18n.md) for multilingual sites).

**Accessibility**
- 1.4.4 Resize Text and 1.4.12 Text Spacing: a matched fallback must still reflow at 200% and with overridden spacing; never fix heights to a font's metrics (code-standard rule 42).
- code-standard rule 54.

**Check**
- *Script:* could flag `@font-face` without `font-display`, non-WOFF2 sources, font preloads without `crossorigin`, and more than two font preloads; could measure CLS with fonts throttled.
- *Judgement:* Does the fallback take the same room as the web font at body and heading sizes?

**Sources:** web.dev, Chrome and MDN as linked. web.dev declines to pick one `font-display`; the toolkit defaults to `swap` with a matched fallback and an early load, and uses `optional` where the brand allows a fallback on slow loads.

## CSS delivery

**What good looks like**
- The CSS the first view needs arrives in the first round trips; the rest does not block rendering.
- One stylesheet per page or a small set, linked early in `head`, with no `@import` chains.
- Unused CSS is found and removed, not shipped "in case".

**How**
- **Link early, never `@import`:** `<link>` in `head` is discovered at once; `@import` inside a sheet is discovered only after that sheet arrives ([font best practices](https://web.dev/articles/font-best-practices) on stylesheet delivery).
- **Critical CSS:** inline the rules the above-the-fold content needs and load the rest without blocking; aim to keep above-the-fold content under 14 KB compressed, about what the first round trip carries ([extract critical CSS](https://web.dev/articles/extract-critical-css)). Worth it for content pages with a heavy sheet; for a small layered stylesheet, one cached file is simpler.
- **Layers stay intact:** critical extraction must keep the `@layer` order statement first, or the inlined rules change precedence (code-standard rule 4).
- **Rendering cost:** `content-visibility: auto` with `contain-intrinsic-size` skips layout of long off-screen sections ([MDN `content-visibility`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility)).
- Stylesheet architecture and Sass output are [css-architecture.md](css-architecture.md).

**Cases**
- A theme sheet `@import`s four partials at run time → compile them into one file at build time.
- A long documentation page lays out 40 sections on load → `content-visibility: auto` on each section, with an intrinsic size estimate so the scrollbar holds still.
- Critical CSS is inlined but the `@layer` statement is in the deferred file → put the layer order statement in the inlined block first.

**Accessibility**
- A flash of unstyled or reflowing content moves focus targets (2.4.3); keep critical CSS complete for what the first view shows.
- code-standard rule 4.

**Check**
- *Script:* `tools/css-lint/check.mjs` "layers" (code-standard rule 4) holds the layer structure of the compiled sheets. Could flag `@import` in compiled CSS and measure render-blocking bytes per template.
- *Judgement:* Is critical CSS worth its build step here, or is one small cached file enough?

**Sources:** web.dev and MDN as linked.

## JavaScript delivery

**What good looks like**
- No script blocks parsing or rendering of the first view.
- Each page loads the code its own behaviour needs, not the application's.
- A size limit per route is set and checked.

**How**
- **`defer`** runs after parsing, in order, before `DOMContentLoaded`; **`async`** runs whenever it arrives, out of order; **`type="module"`** is deferred by default ([MDN `<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script)). Enhancements use `type="module"` or `defer`; `async` is for independent scripts such as analytics.
- **Code splitting:** `import()` loads a module when it is needed, such as a chart library when its tab opens ([code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)).
- **Client boundaries** put code in the bundle; mark only the components that need the client (code-standard rule 47; [javascript.md: islands](javascript.md#client-and-server-boundaries-and-islands)).
- **Long tasks:** break work up and yield to the main thread ([optimize long tasks](https://web.dev/articles/optimize-long-tasks)); `scheduler.yield()` where supported ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield)), `setTimeout` otherwise.
- **Prefer the platform:** each feature replaced by `dialog`, `popover` or `details` is code not shipped ([javascript.md: the platform before a library](javascript.md#the-platform-before-a-library)).

**Cases**
- A 300 KB bundle loads on every page for a chart on one → split the chart into a dynamic import on that page.
- A synchronous script in `head` delays the first paint → `defer` it or make it a module.
- A date library is imported for one format call → `Intl.DateTimeFormat`, which the browser already has.
- Twenty-six components are marked client and most have no behaviour → the directive comes off (code-standard rule 47's evidence).

**Accessibility**
- A page that is painted but not yet interactive invites clicks that do nothing; the no-script path makes those clicks work anyway (code-standard rule 20).
- code-standard rules 20 and 47.

**Check**
- *Script:* `tools/css-lint/check.mjs` "a client boundary pays for its own behaviour" (code-standard rule 47). Could fail a build whose per-route JavaScript exceeds its budget and flag scripts in `head` without `defer`, `async` or `type="module"`.
- *Judgement:* What does this page's script do that HTML could not?

**Sources:** MDN and web.dev as linked.

## Caching and compression

**What good looks like**
- Versioned assets are cached for a year and never revalidated; HTML is revalidated on every visit.
- Text is compressed with Brotli or gzip; already-compressed formats are not compressed again.
- Back and Forward restore pages from the back/forward cache.

**How**
- **Versioned URLs** (a content hash in the file name) get `Cache-Control: max-age=31536000`, optionally `immutable`; **unversioned** ones (the HTML) get `no-cache`, which means "revalidate before use", not "do not store"; `no-store` only for responses that must never be stored ([web.dev HTTP cache](https://web.dev/articles/http-cache), [MDN `Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)).
- **Compression:** serve HTML, CSS, JS, SVG and JSON with Brotli (`br`) or gzip per `Accept-Encoding`; MDN cites reductions of up to 70% for some documents ([MDN compression](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Compression)). Images, video and WOFF2 are already compressed.
- **Back/forward cache:** "never use the unload event"; use `pagehide`; a page served with `Cache-Control: no-store` may not be eligible ([web.dev bfcache](https://web.dev/articles/bfcache)). A restored page should refresh stale live data on `pageshow` with `persisted`.

**Cases**
- `app.css` is cached for a year and a release changes it → readers keep the old file; hash the file name, and cache the HTML that names it with `no-cache`.
- A whole site sends `no-store` to be safe → Back reloads every page and bfcache is lost; reserve `no-store` for pages with personal data.
- An analytics snippet listens for `unload` → switch to `pagehide` or `visibilitychange`, so bfcache works.

**Accessibility**
- None directly; fast Back keeps the reader's place, which [ux: state persistence and restore](../ui/design/ux.md#state-persistence-and-restore) asks for.

**Check**
- *Script:* could fetch each asset and assert the cache headers by type (hashed name → long max-age; HTML → `no-cache`), a `content-encoding` on text responses, and no `unload` listeners in shipped scripts.
- *Judgement:* Which responses carry personal data and so need `no-store`?

**Sources:** web.dev and MDN as linked.

## Third-party scripts

**What good looks like**
- Every third-party script has an owner, a purpose and a budget, and is reviewed for removal.
- None blocks rendering or the first interaction.
- Heavy embeds load only when the reader asks for them.

**How**
- web.dev's list: favour the vendor that sends the least code, "use performance budgets for third-party content", "don't use the same functionality from two different vendors", and "routinely audit and clean out redundant third-party scripts" ([web.dev third-party JavaScript](https://web.dev/articles/third-party-javascript)).
- **Load late:** `async` or `defer`, or inject after load; `preconnect` to an origin that is needed early ([efficiently load third-party JavaScript](https://web.dev/articles/efficiently-load-third-party-javascript)).
- **Facades:** a static element that looks like the embed (a video poster, a chat button) and loads the real thing on interaction ([Lighthouse third-party facades](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades)).
- **A/B testing scripts** often block display even when loaded asynchronously (web.dev); weigh the test against the delay it adds to every visit.
- Content Security Policy and integrity for third-party code are [security.md](security.md).

**Cases**
- Two analytics tools and two tag managers are on the page → keep one of each.
- A video embed adds 500 KB before anyone presses play → a poster image with a play button that loads the player on click.
- A chat widget is the LCP element's competitor on mobile → load it after the page is interactive, behind a facade button.

**Accessibility**
- A facade must be a real `button` with an accessible name and must move focus into the loaded embed (2.1.1, 2.4.3, 4.1.2).

**Check**
- *Script:* could list every third-party origin a page requests, with bytes and main-thread time, and fail on an origin not in the project's allow list.
- *Judgement:* What would break if this script were removed today?

**Sources:** web.dev and Chrome as linked.

## Layout stability in code

**What good looks like**
- Everything that will appear has its space from the first paint: media, embeds, ads, banners, late data.
- Content arrives below the reader, never above them, unless the reader asked for it.
- Animation moves things with `transform`, not with layout properties.

**How**
- **Reserve space:** `width` and `height` on images and video; `aspect-ratio` on embeds and placeholders ([MDN `aspect-ratio`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/aspect-ratio)); a `min-height` for a slot whose height is known from its content type, derived from that type and not typed to today's content (code-standard rule 57).
- **Avoid late inserts above content:** banners overlay or are rendered by the server; new feed items wait behind a "show new" control ([javascript.md: polling](javascript.md#polling-and-live-data)).
- **Skeletons match the final layout** in size, so the swap moves nothing ([feedback: loading](../ui/patterns/feedback.md#loading)).
- **Animate `transform` and `opacity`;** composited `translate` animations "can't impact other elements, and so don't count toward CLS" ([optimize CLS](https://web.dev/articles/optimize-cls)).
- **Content that comes and goes keeps its space** (design-standard rule 2), for example a filter's result count rendered with a reserved width.

**Cases**
- Lazy-loaded images without dimensions shift the page as the reader scrolls → add `width` and `height`; web.dev names lazy content "without space reserved" as a common post-load CLS cause.
- An error message appears above a form and pushes the fields down → reserve the summary area or place it where the reader is ([forms: error messages](../ui/patterns/forms.md#error-messages-and-the-error-summary)).
- A "loaded 3 s ago" label changes width every second → tabular figures and a fixed-width slot.
- A sidebar slides in by animating `width` → animate `transform: translateX()` instead.

**Accessibility**
- 2.4.11 Focus Not Obscured: an inserted banner must not cover the focused element. 2.3.3 Animation from Interactions (AAA) and `prefers-reduced-motion` for motion ([accessibility.md](accessibility.md)).
- code-standard rule 57; design-standard rule 2.

**Check**
- *Script:* `tools/parity/pages.mjs` overflow catches content wider than its container. Could record layout shifts with a `PerformanceObserver` during load and during a scripted scroll, and flag `transition` on `width`, `height`, `top`, `left` or `margin`.
- *Judgement:* What on this page appears after the first paint, and where is its space?

**Sources:** web.dev and MDN as linked.

## Measuring

**What good looks like**
- Field data from real readers decides whether a page is fast; lab runs reproduce and explain.
- Lab runs use a device and network profile close to the slow end of the audience.
- A regression is caught before release, not by a reader.

**How**
- **Lab vs field:** lab tools run "in a controlled environment with predefined device and network settings"; field tools collect from real visits, and the two often disagree ([lab and field differences](https://web.dev/articles/lab-and-field-data-differences)). INP needs real interactions; the lab uses Total Blocking Time to diagnose it.
- **Lighthouse** is "an open-source, automated tool" for lab audits, in DevTools, the CLI or CI ([Lighthouse overview](https://developer.chrome.com/docs/lighthouse/overview)). Run it on each template, not just the home page, and pin its throttling (code-standard rule 35).
- **Field:** the `web-vitals` library, "a tiny (~3K, brotli'd), modular library", reports LCP, INP and CLS the way Chrome measures them; its attribution build names the element or interaction responsible ([web-vitals](https://github.com/GoogleChrome/web-vitals)):
  `import { onLCP, onINP, onCLS } from 'web-vitals'; onINP(send);`
- **Read the 75th percentile,** split by mobile and desktop, never the mean.

**Cases**
- Lighthouse scores 98 on a fast laptop and readers on phones complain → read field INP and LCP; rerun the lab with mobile throttling.
- Only the home page is tested and the search results page is slow → one lab run per template, with realistic data volume.
- Field CLS is high and the lab shows none → the shift happens after load (scroll, lazy content, a late banner); use the attribution build to find it.
- A check's result changes between machines → pin the viewport, network and CPU profile in the check (code-standard rule 35).

**Accessibility**
- Lighthouse's accessibility audits are a start, not a pass; [testing.md](testing.md) and [accessibility.md](accessibility.md) own accessibility testing.

**Check**
- *Script:* could run Lighthouse CI per template on each change and send `web-vitals` field data to the project's analytics.
- *Judgement:* Do the lab profiles resemble the readers' devices?

**Sources:** web.dev, Chrome and the web-vitals repository as linked. Sources agree that field data is the verdict.

## Performance budgets

**What good looks like**
- A budget states limits before work starts, per template, and the build fails when it is crossed.
- It mixes quantity limits (bytes, requests) with user-centred timings (LCP, INP, CLS).
- Crossing it forces a choice: optimise, remove something, or raise the budget on purpose.

**How**
- **Three kinds of metric** ([performance budgets 101](https://web.dev/articles/performance-budgets-101)): *quantity-based* (maximum image size, number of web fonts, script size, number of third-party resources), *milestone timings* (user-centric metrics such as LCP), and *rule-based* scores (Lighthouse).
- Quantity limits are easy to check in a build; web.dev warns they "don't tell you much about the user experience", so pair them with timings.
- Set the numbers from the project's current field data and the Core Web Vitals thresholds, per template, and write them where the check reads them (one place, as a setting).
- Third-party content gets its own line in the budget ([third-party JavaScript](https://web.dev/articles/third-party-javascript)).

**Cases**
- A new feature adds 80 KB of script and the budget is 150 KB for the route → split it, defer it, or remove something; raising the budget is a decision written down.
- The budget counts only bytes and LCP still regresses because the hero loads late → add an LCP timing to the budget.
- Every template shares one budget → the search page and a content page differ; set each.

**Accessibility**
- None directly; budgets protect readers on slow devices and networks, *for everyone, in any context*.

**Check**
- *Script:* none in the toolkit. Could fail a build when a route's compressed JavaScript, CSS or image bytes exceed the budget, and Lighthouse CI on timings.
- *Judgement:* Who decided this budget, from what data, and when was it last reviewed?

**Sources:** web.dev as linked. The numbers are each project's; no source sets a universal byte budget, and the toolkit does not either.
