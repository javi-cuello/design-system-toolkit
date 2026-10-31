# Browser support and fallbacks

Which platform features a front end can use, and what it does where one is missing: Baseline as the support policy, progressive enhancement with feature queries, when a polyfill is worth it, testing across the three engines, the reader's motion and data preferences, and print. It serves the design-standard principles *for everyone, in any context* and *as little as possible, and no simpler*, and applies code-standard rule 20 (every interaction has a no-script path), code-standard rule 28 (write the one rule the feature is, let real need pull in edge cases) and code-standard rule 35 (a check pins the environment it reads). No code-standard rule is admitted for browser support yet. How scripts enhance markup is [javascript](javascript.md)'s; the reduced-motion block is [accessibility](accessibility.md#reduced-motion-and-colour-scheme-in-code)'s; load cost is [performance](performance.md)'s.

**Implements:** no single pattern; it sets what every pattern's Build part may assume, and [visual: motion](../ui/design/visual.md#motion) and [accessibility: motion and vestibular safety](../ui/design/accessibility.md#motion-and-vestibular-safety) in code.

## Baseline as the support policy

**What good looks like**
- A project states its support target once, as a Baseline level, and every feature choice is read against it.
- Baseline widely available features are used without a fallback; newly available ones get a fallback or are enhancements; limited ones are enhancements only.
- The target is one setting the tools read, not a sentence in a README.

**How**
- Baseline has two stages. "Newly available: The feature is supported by all of the core browsers"; "Widely available: 30 months have passed since the newly interoperable date". Before that a feature has limited availability. The core set is Chrome, Edge, Firefox and Safari, desktop and mobile ([web.dev, *Baseline*](https://web.dev/baseline); [MDN, *Baseline*](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility)).
- Each MDN page carries the feature's Baseline status at the top; the data comes from [web-features](https://web-platform-dx.github.io/web-features/). [Can I use](https://caniuse.com/) gives per-version detail.
- Tools read the target from one query: [Browserslist](https://github.com/browserslist/browserslist) accepts `baseline widely available` (and `baseline 2024`, or a date), and Autoprefixer, Babel, Stylelint and Lightning CSS read Browserslist.

  ```text
  # .browserslistrc
  baseline widely available
  ```

- Where audience data says otherwise (a public service with older devices, an internal tool on one managed browser), the project's context document records the target and why.

**Cases**
- A design uses `:has()` for a parent state → read its status on MDN against the target; use it plainly if it meets the target, and keep the state reachable without it if not.
- A component relies on CSS anchor positioning, newly available → position with a fallback that works (a fixed placement) and let `@supports` take over (below).
- A Next.js project adds a `.browserslistrc` → its CSS output changes, not only its JavaScript: with Next's default targets a selector list containing `:has()` was split into separate rules, and with the project's own Baseline target it was kept whole (one project, Oct 2026). Re-run the visual checks after adding or moving the target, not just the build.
- A team argues browser versions per feature in review → set the Baseline target once and point to it; the argument is then about the target, once.

**Accessibility**
- A feature that fails without a fallback can remove content or controls in an older browser, which fails 2.1.1 Keyboard or 1.3.1 Info and Relationships for its readers. The fallback is part of the accessible build.

**Check**
- *Script:* could compare the CSS properties, selectors and JavaScript APIs a build uses against web-features data for the project's target, and report each feature above it with no `@supports` or feature test around it. Stylelint has plugins that do this against Browserslist.
- *Judgement:* What does a reader on the oldest supported browser get from this page?

**Sources:** web.dev, MDN, web-features and Browserslist as linked. The toolkit defaults to Baseline widely available, with newly available as enhancement; a project's context document can move it.

## Progressive enhancement and feature queries

**What good looks like**
- The page works in HTML first, gets its look from CSS, and its conveniences from script; each layer adds and none is required for the core task.
- Newer CSS sits inside `@supports`, with the fallback written first and outside it.
- Script tests for a feature before using it, never sniffs the browser.

**How**
- MDN: progressive enhancement "provides a baseline of essential content and functionality to as many users as possible, while delivering the best possible experience only to users of the most modern browsers" ([MDN](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)). How a script enhances from the HTML path is [javascript: progressive enhancement](javascript.md#progressive-enhancement); this section is the feature tests.
- `@supports` tests a declaration, a selector or an at-rule ([MDN `@supports`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@supports)):

  ```css
  .grid { display: flex; flex-wrap: wrap; }
  @supports (display: grid) { .grid { display: grid; } }
  @supports selector(:has(+ *)) { /* parent-state styles */ }
  ```

- The cascade is its own fallback: an unknown property or value is ignored, so a declaration followed by its newer form works without a query (`height: 100vh; height: 100dvh;`).
- In script: `if ('showPopover' in HTMLElement.prototype)`, `CSS.supports('anchor-name: --a')`. A missing API leaves the HTML working (code-standard rule 20).
- The no-script and the old-browser paths are one path: the platform behaviour code-standard rule 20 requires is also the fallback.

**Cases**
- A modal opens only through `showModal()` → the `popovertarget` path in [html-semantics](html-semantics.md#disclosure-dialogs-and-popovers) first; the no-script path and the older-browser path are then the same path (code-standard rule 20).
- A script checks `navigator.userAgent` for Safari to switch a layout → test the feature it needs; the next Safari, or another engine, gets the wrong branch.
- A design uses `color-mix()` for a hover tint → a token for the hover colour as the plain declaration, with `color-mix()` after it; browsers without it keep the token.

**Accessibility**
- 4.1.2 Name, Role, Value: an enhanced control and its fallback both expose a role and name. Code-standard rules 17 and 20 apply to every fallback path.

**Check**
- *Script:* `tools/css-lint` gates `!important` outside reduced-motion blocks and `hidden` against the sheet (code-standard rules 4 and 17). Could also render each page with scripts off and assert every control named on the scripted page is present.
- *Judgement:* With this feature missing, can the reader still finish the task?

**Sources:** MDN as linked.

## Polyfills, and when not to

**What good looks like**
- A polyfill is added only for a feature the page needs, below the support target, with no acceptable fallback.
- It is self-hosted, pinned, loaded only where needed, and removed when the target passes it.
- Most of the time the answer is a fallback, not a polyfill.

**How**
- Ask, in order: is the feature within the target (then use it); does the cascade or the HTML give a fallback (then use that); is the enhancement optional (then feature-test and skip). Only then polyfill.
- Load conditionally, after a feature test, so modern browsers pay nothing:

  ```js
  if (!('Segmenter' in Intl)) await import('/vendor/intl-segmenter.js');
  ```

- Self-host and pin; the 2024 polyfill-service compromise, and the integrity hash that would have refused it, are [security: third-party scripts](security.md#third-party-scripts-and-subresource-integrity).
- A transpiler or bundler's automatic polyfills follow the Browserslist target; keep the target honest or they ship code for browsers nobody uses.
- Never polyfill behaviour that carries accessibility semantics (dialog focus trapping, popover light dismiss) with a partial copy; a fallback that is plain and complete beats an imitation that half works.

**Cases**
- A site loads a polyfill bundle for every visitor "to be safe" → remove it, check each feature against the target, and load what remains conditionally.
- `structuredClone` is polyfilled years after it is widely available → delete it; dead polyfills are code that runs and that nobody reads.
- An older-browser audience needs `<dialog>` → use the platform's maintained polyfill, test focus and Escape in the oldest supported browser, or fall back to a page.

**Accessibility**
- A polyfilled dialog or popover must still meet 2.1.2 No Keyboard Trap and 2.4.3 Focus Order; test it in the browser that loads it.

**Check**
- *Script:* could list every polyfill a build ships and the Baseline status of what it fills, flagging those within the target.
- *Judgement:* Which reader needs this polyfill, and is there a fallback instead?

**Sources:** MDN on each feature's status; [security](security.md#third-party-scripts-and-subresource-integrity) for the supply-chain case.

## Testing across engines

**What good looks like**
- Every change that touches layout, forms or behaviour is seen in all three engines: Blink (Chrome, Edge), Gecko (Firefox) and WebKit (Safari, and every browser on iOS).
- Automated browser tests run in all three; manual checks cover the devices the audience uses.
- Each run pins what it reads, so a failure is the code's and not the machine's.

**How**
- [Playwright](https://playwright.dev/docs/browsers) and similar runners drive Chromium, Firefox and WebKit from one test; run the end-to-end suite on each ([testing](testing.md)).
- GOV.UK's list from February 2026 is a reasonable public default: on Windows Edge, Chrome and Firefox; on macOS Safari, Chrome and Firefox; on iOS Safari, Chrome and Edge; on Android Chrome, Samsung Internet and Firefox, all at latest stable (Safari on supported OS versions), which GOV.UK says represents about 98% of the browsers used on GOV.UK ([GOV.UK, *Designing for different browsers and devices*](https://www.gov.uk/service-manual/technology/designing-for-different-browsers-and-devices)).
- Test on a real iOS device or simulator for touch, the on-screen keyboard and the dynamic viewport; a resized desktop window is not a phone.
- Pin locale, time zone, theme, viewport and fonts per run (code-standard rule 35); screenshot baselines are per engine.
- Screen readers are tested in the browser each is paired with (GOV.UK's page lists the pairings); the pass itself is [accessibility: testing with a keyboard and a screen reader](accessibility.md#testing-with-a-keyboard-and-a-screen-reader).

**Cases**
- A layout is built and reviewed in Chrome only and a flex gap collapses in Safari → add WebKit to the test run; the defect was there from the first commit.
- A date input looks different in each browser → expected; style what the platform allows and do not rebuild the control (code-standard rule 8).
- A check passes on one developer's machine and fails on another's → something is inherited, not pinned (code-standard rule 35).

**Accessibility**
- Screen readers differ by browser pairing; 4.1.2 Name, Role, Value is verified in the pairings the audience uses, not only in the browser's accessibility tree.

**Check**
- *Script:* could run the project's end-to-end and screenshot suites under each of the three engines. The toolkit's own browser checks run headless Chrome only today; that is a known limit, not coverage.
- *Judgement:* Which engines and screen readers has this change been seen in?

**Sources:** GOV.UK and Playwright as linked.

## Reduced motion and reduced data

**What good looks like**
- Motion that is not essential is reduced when the reader asks, not deleted wholesale: a fade can stay where a slide goes.
- Heavy media and prefetching respect a data-saving preference where the browser reports one, without depending on it.

**How**
- `prefers-reduced-motion: reduce` is widely available, across browsers since January 2020 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)), so it needs no fallback; the base block, its script form and the `!important` it is allowed are [accessibility: reduced motion and colour scheme in code](accessibility.md#reduced-motion-and-colour-scheme-in-code).
- `prefers-reduced-data` is experimental and limited availability ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-data)); `navigator.connection.saveData` is limited too ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData)). Use them as hints to skip autoplay, background video or prefetch; never as the only route to a light page. A light page by default is [performance](performance.md)'s.

**Cases**
- A parallax hero moves on scroll → no movement under reduced motion; parallax is a known trigger for vestibular disorders, and WCAG 2.3.3 names motion from interaction.
- A background video autoplays on a phone → do not autoplay under reduced motion or `saveData`; show the poster with a play button.

**Accessibility**
- WCAG 2.2 2.3.3 Animation from Interactions (AAA) ([Understanding](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)) and 2.2.2 Pause, Stop, Hide (A) for anything that moves for more than five seconds.

**Check**
- *Script:* could render each page with `prefers-reduced-motion: reduce` emulated and assert no running animation longer than a threshold.
- *Judgement:* With reduced motion on, does every state change still show?

**Sources:** MDN and W3C as linked. The toolkit reduces rather than removes motion, the stance in [candidates](candidates.md).

## Print styles

**What good looks like**
- A page someone might print (a receipt, an article, documentation, a table of results) prints its content on white, with navigation and controls left out.
- Link destinations that matter are visible on paper.
- Print styles live in the sheet, in a `print` media block, not in a separate print page.

**How**
- `@media print` hides the chrome, resets colours and lets content flow; `@page` sets margins ([MDN, *Printing*](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Printing)):

  ```css
  @media print {
    header nav, footer, [data-print="hide"] { display: none; }
    main a[href^="http"]::after { content: " (" attr(href) ")"; }
    tr, img, figure { break-inside: avoid; }
  }
  ```

- Print sets body text and background from the light tier of the colour tokens rather than restating colours in literals, so print follows the token tier (code-standard rule 53) and a dark theme never prints as a black page.
- Collapsed content (a `details`, a "read more") that matters on paper opens for print; `beforeprint` can open `details` elements.
- Test by printing to PDF in each engine; print rendering differs more than screen rendering.

**Cases**
- A dark-mode reader prints a page and gets white text on no background → print takes the light tier.
- A results table prints with rows split across pages → `break-inside: avoid` on rows, and repeat the header with a real `<thead>`.
- An article prints its cookie banner and sticky header on every page → hide them in print; fixed elements repeat on each printed page.

**Accessibility**
- None of WCAG's criteria names print. A printed page keeps the reading order of the screen (code-standard rule 2), and colour alone still carries no meaning on a greyscale printer (1.4.1 Use of Color).

**Check**
- *Script:* could emulate print media in a headless browser and assert the navigation is hidden, the body background is white and the text contrast holds.
- *Judgement:* Would someone who printed this page have what they printed it for?

**Sources:** MDN as linked.
