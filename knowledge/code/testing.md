# Testing and tooling

How a front end is tested and linted so that a green run means the page works: which level a test belongs at, what automated accessibility checks find and what they cannot, screenshot diffs, testing the page a person opens rather than a harness, the linters, a check that says "not run" instead of passing, CI gates, and fixtures kept as one module. It serves the design-standard principles *show state and give feedback* and *honest* (a check reports what it did), and applies code-standard rule 30 (a check that fires on nothing), code-standard rule 35 (a check pins its environment), code-standard rule 41 (a declared rule is proved to run), code-standard rule 49 (a check's verdict is its own) and code-standard rule 56 (the harness is not the product). Accessibility in code is [accessibility](accessibility.md)'s; the design-to-code loop is the `design-code-parity` skill's.

**Implements:** no single pattern; it proves the *Check* part of every ui page, script half.

## What to test at which level

**What good looks like**
- Logic that reads data (formatting, grouping, truncation, filtering) has unit tests on the model, with fixtures (code-standard rule 29).
- A component's behaviour (keyboard, states, what it announces) is tested rendered, through the roles and names a person meets.
- A few end-to-end tests drive the real routes through the paths that matter: sign in, the main task, the no-script path.
- Each test sits at the lowest level that can see the defect it guards.

**How**
- The pyramid: "Write lots of small and fast unit tests. Write some more coarse-grained tests and very few high-level tests" ([Martin Fowler, *The Practical Test Pyramid*](https://martinfowler.com/articles/practical-test-pyramid.html), commentary). Kent C. Dodds' "testing trophy" weights the middle, integration, more heavily ([commentary](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)).
- Query by role and accessible name, not by class or test id where a name exists: "The more your tests resemble the way your software is used, the more confidence they can give you" ([Testing Library, *Guiding principles*](https://testing-library.com/docs/guiding-principles/)). Where an element has no name, a data attribute (code-standard rule 6) is the hook.
- End-to-end in a real browser engine ([Playwright](https://playwright.dev/docs/test-snapshots) or equivalent) for what only a browser computes: focus, layout, the accessible name, `hidden` against a stylesheet. Which engines and devices is [browser-support: testing across engines](browser-support.md#testing-across-engines).

  ```js
  await page.getByRole('checkbox', { name: 'Design' }).check();
  await expect(page.getByRole('checkbox', { name: 'Design' })).toBeFocused();
  ```

**Cases**
- A date helper is tested only through a full page test that takes 20 seconds → unit-test the helper with the edge dates; keep one page test that it renders.
- A filter re-renders its list and focus falls to `body` → a browser test that toggles and asserts focus (code-standard rule 14); a DOM-only unit test cannot see focus.
- Tests find elements by CSS classes that a refactor renames → query by role and name; the test then fails when the name changes, which is what a person would notice.
- A count sits inside a checkbox's label → a test that reads the computed name finds it; one that reads the label's text does not (code-standard rule 15).

**Accessibility**
- Testing by role and name exercises 4.1.2 Name, Role, Value on every run. Keyboard paths in end-to-end tests exercise 2.1.1 Keyboard and 2.4.3 Focus Order.

**Check**
- *Script:* `tools/parity/pages.mjs` structure drives the rendered pages for code-standard rules 14, 15 and 19; a project's own tests carry the rest.
- *Judgement:* For this defect, what is the cheapest test that would have failed?

**Sources:** Fowler and Dodds are commentary and disagree on the middle; Testing Library is a library's stated principle. The toolkit goes with the lowest level that sees the defect, and with querying by role.

## Automated accessibility checks and their limits

**What good looks like**
- An automated checker (axe-core or equivalent) runs on every rendered page in CI, in every theme and at more than one width.
- Its "incomplete" results are read, not dropped.
- Nobody calls a page accessible because the checker is clean.

**How**
- axe-core: "you can find on average 57% of WCAG issues automatically", and it reports "incomplete" where it cannot be sure ([axe-core](https://github.com/dequelabs/axe-core)). The 57% is Deque's measure of issues by count across its audits ([Deque coverage report](https://www.deque.com/automated-accessibility-coverage-report/)); by criterion, much of WCAG needs a person.
- Playwright's own guidance: automated tests "can detect some common accessibility problems… But many accessibility problems can only be discovered through manual testing" ([Playwright, *Accessibility testing*](https://playwright.dev/docs/accessibility-testing)).
- Run it after interaction too: open each dialog, menu and disclosure, then scan; a closed popover is not scanned.
- Pin the theme, width and locale for each run and run every shipped theme (code-standard rule 35).
- What it cannot judge is the reviewer's: meaningful alt text, focus order, a name that matches its purpose, an announcement at the right moment. W3C's [evaluation resources](https://www.w3.org/WAI/test-evaluate/) pair tools with manual checks.

**Cases**
- A page passes axe and a keyboard user cannot reach the menu → axe does not press keys; add a keyboard path to the end-to-end test.
- Contrast passes in light mode only, because the machine was in light mode → run both themes (code-standard rule 35).
- A row dimmed with `opacity` passes every colour check → the composited contrast is the failure no declared-colour check sees; the lesson is in [candidates](candidates.md).
- Axe flags a false positive in a third-party widget → exclude that node by selector with the reason beside it, and nothing wider (code-standard rule 41).

**Accessibility**
- A checker covers part of 1.1.1 (that alt exists, not that it is right), 1.3.1, 1.4.3, 2.4.2, 3.1.1 and 4.1.2. It cannot settle 1.3.2 Meaningful Sequence, 2.4.3 Focus Order, 2.4.7 Focus Visible or 3.3.3 Error Suggestion.

**Check**
- *Script:* could run axe-core over each page `tools/parity/pages.mjs` already loads, per theme. `tools/ui-check/check.mjs` measures the design-standard rules a rendered page can be held to; neither replaces the other.
- *Judgement:* What did the reviewer check by keyboard and screen reader that no tool covers?

**Sources:** axe-core, Deque, Playwright and W3C as linked; they agree that automation finds a part. The toolkit treats a clean scan as necessary, never sufficient.

## Visual regression and screenshot diffs

**What good looks like**
- Screenshots catch what no property comparison sees: paint order, overlap, a clipped glyph.
- Baselines are taken in one pinned environment, and a diff is reviewed by a person before it is accepted.
- A screenshot diff complements measurement; it does not replace it.

**How**
- Compare against a stored baseline with a small tolerance; Playwright's `toHaveScreenshot()` is one implementation. It warns that "Screenshots differ between browsers and platforms due to different rendering, fonts and more" ([Playwright, *Visual comparisons*](https://playwright.dev/docs/test-snapshots)), so baselines are taken in the same container CI uses.
- Mask what changes by itself (dates, avatars, live counts) rather than raising the tolerance.
- Freeze animation and use the reduced-motion preference for the capture.
- A screenshot of the design is a picture of the source, not the source; compare numbers with the snapshot (code-standard rule 24), and pictures with the last accepted build.

**Cases**
- A diff fails on every run by a few pixels of font smoothing → run in a pinned container with the fonts installed; raising the tolerance hides real regressions too.
- A tooltip renders under a sticky header and every measured box is right → only a screenshot shows the overlap; this is the case the advisory diff in [candidates](candidates.md) is for.
- Fifty screenshots change after a token update and are accepted in one click → review a sample at least, and accept by component; a bulk accept turns the baseline into whatever shipped.

**Accessibility**
- A diff per theme and at 200% zoom catches regressions against 1.4.3 Contrast and 1.4.4 Resize Text that a single capture misses.

**Check**
- *Script:* could, as an advisory step beside the parity run; it is a candidate, not a gate, in [candidates](candidates.md).
- *Judgement:* Was each accepted change meant?

**Sources:** Playwright as linked.

## Testing the rendered page, not a harness

**What good looks like**
- The last check before "done" opens the real route, with real data and the real session, at the widths the design gives.
- A story or fixture is a tool for building, never the evidence of the finished page.

**How**
- Stories render a component with props written to match the design, so a loop over stories compares the design to a copy of itself; code-standard rule 56 owns this and says what to do.
- Drive the route the way a person does: signed in, with the content the server really has, with scripts off for the no-script path (code-standard rule 20).
- Read the page's own words: a heading built from a translation key can differ from the design's wording, and only the route shows it ([i18n](i18n.md)).
- Check a state that exists only while something is in flight — a busy button, a pending dialog — by watching for it as it happens (a `MutationObserver` on the attribute, installed before the press), never by reading it after a fixed wait: a local server can finish before the wait does, and the check then passes with the state unwired.

**Cases**
- Every story passes and the live page shows a different heading → open the route; the route built its own string ([i18n](i18n.md), *Strings a translator can work with*).
- A tab set works in its story and its panels are unreachable without script on the page → test the route with scripts off; the cause and the fix are [javascript: progressive enhancement](javascript.md#progressive-enhancement).
- A component test mounts the modal open → also open it from its trigger on the page; the trigger's `popovertarget` path is what a no-script reader gets.
- A path presses Save, waits 120 ms and asserts `aria-busy` → the local save landed in under 120 ms, so the path read a page that had already moved on and passed with the busy state removed from the button; it caught the regression only once it observed the attribute from the press onwards (one project, 12 Oct 2026, seen red both ways).

**Accessibility**
- 2.1.1 Keyboard and 4.1.2 Name, Role, Value are properties of the page, so they are tested there.

**Check**
- *Script:* `tools/parity/pages.mjs` structure and overflow load the project's own pages, not stories; `tools/ui-check/check.mjs` takes a URL.
- *Judgement:* Has someone opened this route, as a user, since the last change?

**Sources:** the toolkit's own (code-standard rule 56).

## Linting: styles, scripts and markup

**What good looks like**
- Stylesheets, scripts and rendered HTML each have a linter in CI, and a lint error fails the build.
- Warnings are either errors or off; a warning nobody reads is noise.
- The toolkit's own gates run for the rules a generic linter cannot know.

**How**
- [Stylelint](https://stylelint.io/) for CSS and Sass (syntax errors, unknown properties, physical properties where logical ones are wanted, [i18n](i18n.md)); [ESLint](https://eslint.org/) for JavaScript (unused symbols, unsafe sinks such as `innerHTML`, [security](security.md)); the [Nu Html Checker](https://validator.github.io/validator/) (`vnu`) for the rendered HTML, which catches duplicate ids, invalid nesting and bad attributes.
- Validate the HTML the server sends, not the templates; templates are not HTML.
- The toolkit's stylesheet gates (`tools/css-lint`) hold the code-standard rules no generic linter knows: layers, own parts, literal reasons, `hidden` beats the sheet and the rest, listed in the gate table in `tools/css-lint/README.md`.
- Unused code is an error; the lesson is in [candidates](candidates.md) ("Unused symbols are errors").

**Cases**
- 43 lint warnings accumulate → turn the rules that matter into errors, fix them once, and switch off the rest; the queue never drains otherwise.
- A duplicate `id` breaks a `label for` → `vnu` on the rendered page finds it; `tools/parity/pages.mjs` structure also checks ids appear once.
- A project adds its own script to ban `outline: none` → the toolkit already gates it (code-standard rule 40); call the toolkit's gate (code-standard rule 59).

**Accessibility**
- 4.1.1 Parsing is obsolete in WCAG 2.2, but invalid markup still breaks name computation: a duplicate id under `aria-labelledby` names the wrong control (4.1.2).

**Check**
- *Script:* `tools/css-lint/check.mjs` runs the stylesheet gates; `tools/parity/pages.mjs` structure checks ids, headings and landmarks on the rendered pages. Stylelint, ESLint and `vnu` are a project's tools, called from its check.
- *Judgement:* Does each warning that remains have a reason to exist?

**Sources:** Stylelint, ESLint and the Nu Html Checker as linked.

## A check that reports "not run"

**What good looks like**
- Every check has three outcomes: pass, fail, and did not run, and the third is loud and fails the build.
- Every check states what it examined (pages, swaps, rules) so a zero is visibly a zero of something.

**How**
- code-standard rule 30 applies to every check a project writes, the toolkit's own included.
- Print the count examined: "checked 14 pages, 3 swaps". A check with no browser, no server or no input exits non-zero and says which.
- A gate whose inputs a project does not supply prints *not run*, never *ok*; `tools/project-check/check.mjs` reports it as "RED — not run:".
- Prove each check fires: feed it a known violation and assert it fails (`tools/css-lint/test-lint.mjs` does this for every stylesheet gate; code-standard rule 41).
- A skip names what it looked for; the lesson is in [candidates](candidates.md) ("A skip is only for want of input").

**Cases**
- A headless check exits 0 and prints `skip` when it cannot find a browser → exit with a distinct non-zero status; the browser can vanish and the check go on reporting green.
- A rule exists in the standard with no detector → say "not checked" in the report; an unimplemented rule and a passing one are otherwise indistinguishable.
- A probe returns an empty list because the service it asked was down → read the envelope's success flag first; the lesson is in [candidates](candidates.md).

**Accessibility**
- None directly; an accessibility check that silently did not run is the most common false clean.

**Check**
- *Script:* `tools/project-check/check.mjs` "RED — not run:" for the toolkit's gates; `tools/ui-check/check.mjs` exits 2 for a page it could not check.
- *Judgement:* If the thing this check reads disappeared, what would it print?

**Sources:** the toolkit's own (code-standard rules 30 and 41).

## CI gates

**What good looks like**
- CI runs the same check a developer runs locally, from one entry point.
- Each gate's exit status reaches CI unaltered, and the job fails on red.
- The environment is pinned: browser version, fonts, locale, time zone, viewport, theme.

**How**
- One command (`bin/check` or the project's equivalent) runs everything; CI calls it, never a parallel list of steps that drifts.
- Never pipe a gate into `tail`, `grep` or a pager without `set -o pipefail`: the pipeline then exits with the last command's status (code-standard rule 49).
- Pin the environment the check reads and assert it after the render (code-standard rule 35); install dependencies from the lockfile ([security](security.md), *Dependency hygiene*).
- Keep CI fast enough to run on every push; split slow end-to-end suites by route rather than skipping them.

**Cases**
- A CI step runs `check | tail -20` and the job is green over a red check → `set -o pipefail`, or write to a file and read the status; this is code-standard rule 49's evidence.
- A test passes locally in dark mode and fails in CI in light mode → pin and run both themes.
- CI and local runs use different commands and one of them skips the style gates → one entry point.

**Accessibility**
- None directly.

**Check**
- *Script:* `tools/project-check/check.mjs` "verdicts" gate (code-standard rule 49) flags a check piped on without `pipefail` in a project's `bin/` and hooks.
- *Judgement:* Would CI fail if this gate failed?

**Sources:** the toolkit's own (code-standard rules 35 and 49).

## Test fixtures as one module

**What good looks like**
- A fixture used by more than one test or story is defined once and imported.
- Fixtures are realistic: long names, empty lists, the largest count, another language.

**How**
- One fixtures module per domain (navigation, a user, a list of items); tests and stories import it and override only what differs.
- Include the edge values code-standard rule 57 asks a fix to survive: the longest label, one more item, none at all.
- Pseudo-localised fixtures exercise text expansion ([i18n](i18n.md)).
- Copies of a fixture are a fork; the lesson is in [candidates](candidates.md) ("Copies of a fixture are a fork").

**Cases**
- Nine story files carry their own navigation fixture and one is two items short → one module, imported; nobody can see which copy is wrong.
- Every fixture has three short items and a page breaks with forty → add the forty-item and empty fixtures to the module.
- A fixture is written to match the design so a parity test passes → it then proves nothing about the route (code-standard rule 56); keep the route test beside it.

**Accessibility**
- Fixtures with real alt text and labels keep component tests honest about 1.1.1 and 4.1.2; an empty `alt` in a fixture passes for the wrong reason.

**Check**
- *Script:* could flag identical object literals over a size in two or more test or story files.
- *Judgement:* Which fixture would a new test copy, and does it import it instead?

**Sources:** the toolkit's own; the lesson is in [candidates](candidates.md).
