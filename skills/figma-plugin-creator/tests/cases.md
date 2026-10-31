# Eval cases — figma-plugin-creator (v1.13.2)

**Walked: 2026-10-31 for 1.13.2** — `node tests/test-scaffold.mjs` 9/9, its header assertion now on `· skill-standard v`; `check.sh`'s new stamp warning is silent over every plugin. Other cases unchanged.

**Walked: 2026-10-31 against v1.13.1 — P1 executed (`node tests/test-scaffold.mjs`, 9/9).** `package.json.tpl` pins `@figma/plugin-typings` to an exact version where it read `*`; the scaffold's files are otherwise unchanged. P2–P6 untouched.

**Walked: 2026-10-31 against v1.13.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked: 2026-10-30 against v1.12.0 — P1 executed (`node tests/test-scaffold.mjs`, 7/7).** The scaffold is now a script: its files carry every P1 assertion, the same answers give the same files, a name with a quote keeps the manifest valid, and a missing answer is refused. P2–P6 untouched.

**Walked: 2026-10-29 against v1.11.1 — P1's ui-base assertion executed (`node plugins/_shared/sync.mjs --check`, exit 0).** The template held v1 of the block while the base was at v2, the same drift the 2026-08-09 walk found by hand; the sync wrote it, and planting a changed rule in a plugin's block makes `standards/tests/check.sh` error. P4 is affected (checklist §5 now reads any marker version) and its extraction was walked on the real plugins: all six blocks are v2 and found, and the planted drift is named. P4's strip-and-retest half is unchanged and not re-walked; P2, P3, P5 and P6 untouched.

**Walked: 2026-10-03 against v1.10.1 — P6 executed (`node tests/test-fetch-queue.mjs`, 6/6).** Re-observing at once, or with a flat 500ms, fails the new delay assertion. lucide-icon-importer's `tests/test-ui-fetch.mjs` 4/4 with the new copy, and fails with the old `retryOrFail` left in `ui.html`.

**Walked: 2026-10-03 against v1.10.0 — P6's pattern half executed (`node tests/test-fetch-queue.mjs`, 5/5).** Restoring the old prose's two shapes (calling the job bare, re-observing without unobserving) fails 3 of the 5, so the suite sees the defects it was written for. P1–P5 untouched by this change and not re-walked; P6's plugin half was walked 2026-08-09 and is not re-walked here.


**Reviewed against v1.9.0 on 2026-09-25** — 1.7.0 and 1.8.0 add to the conformance checklist only (the permissions grep in §1, the runtime traps in §5b). No case changed; P1–P6 still describe scaffolding and drift, none of which these touch. The traps in §5b are evidenced in `plugins/theme-switcher`'s changelog 3.0.0–3.5.0 rather than cased here, because reproducing them needs a Figma file and a published library.

**Reviewed against v1.11.0 on 2026-10-26** — 1.11.0 adds to checklist §5b only. No case changed; P1–P6 describe scaffolding and drift, which the new traps do not touch. The traps are evidenced by the 2026-10-26 rebuild of a screens file and `plugins/design-system-snapshot` 0.64.0–0.65.0, not cased here, because reproducing them needs a Figma file.

**Reviewed against v1.6.1 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Walked: 2026-08-09 — pass (6/6), and the walk found four defects the passes exposed.** P1 and P6 executed, P2/P3/P5 executed against fixtures, P4 by reconciliation on a planted fixture. Fixtures for P2, P3, P4 and the pre-fix half of P5 were **planted** in a scratch directory rather than taken from `plugins/`, following the precedent in `standards/tests/cases.md` — a case built on the repo's current state expires the moment the repo improves. P5's post-fix half and all of P6 ran against the real `plugins/lucide-icon-importer`, the plugin whose investigation produced both cases. The four defects are fixed in 1.5.0; each is recorded in the case that found it. No Figma connection was needed for any of this, which is why it should not have sat at "never" as long as it did.

**Reviewed against v1.4.1 on 2026-08-08.** the gap held three real behaviour changes and cases were written for two of them — P5 for the ui-base/bespoke-control collision check (1.2.0) and its extension to state styling (1.3.0), P6 for the network-fetch house pattern (1.4.0). 1.1.0’s mandatory ui-base rule was already covered by P4, which carries the amendment. 1.4.1 is formatting only.

## P1 · Scaffold is standard-complete
Fixture: "create a plugin called Layer Counter, no network, has UI".
Assert: folder contains manifest (with documentAccess, networkAccess ["none"], editorType), code.js (themeColors:true, async-only, try/catch+notify), ui.html (ui-base block between markers), package.json 0.1.0, tsconfig, CHANGELOG, README with "Data this plugin stores". An `id` equal to the folder name (since 1.6.0; before it the assertion read "No id" — reversed when a development plugin without one lost its relaunch data on re-import). No enableProposedApi.

**Walked 2026-08-09 — passes, after fixing three template defects it exposed.** The scaffold was built twice, by actually copying the templates rather than by reading them.

First pass, against v1.4.1's templates: **six files, no README, and `code.js` line 2 was `// {{purpose}}`.** Two assertions of this case failed at the template level — the README the standard requires did not exist as a template at all, and `// @ts-check`, which step 6 promises and checklist §4 checks, was never written. A scaffold produced by following step 2 therefore failed the conformance check step 7 tells you to run on it. Steps 6 and 7 do instruct the agent to repair both by hand, so a careful agent recovers; the trap is that nothing fails loudly if they don't. A third defect surfaced alongside: the ui-base block inlined in `ui.html.tpl` had drifted from `assets/ui-base.css`, missing its 9-line CAUTION about bare element selectors — the warning P5 exists to prevent, absent from exactly the file a new plugin author reads. `plugins/_shared/ui-base.css` and the skill's `assets/ui-base.css` were byte-identical, so the template was the only stale copy.

Second pass, against the fixed templates: seven files, `// @ts-check` on line 2, README carrying "Data this plugin stores", ui-base block byte-identical to canonical with CAUTION intact, no `id`, no `enableProposedApi`, version 0.1.0, banned-sync grep clean, and no `{{placeholder}}` left unfilled. **Standard-complete from the templates alone, nothing patched by hand.**

Walked live: 2026-08-09 — the scaffold built twice by copying the templates, once against v1.4.1's and once against the fixed ones.

## P2 · dynamic-page never added over dirty code
Fixture: existing plugin whose code.js contains figma.getNodeById(.
Assert: conformance report classifies it, documentAccess NOT added; the fix (→ getNodeByIdAsync) is proposed first; manifest change sequenced after.

**Walked 2026-08-09 — passes.** Fixture planted: a "Selection Tools" plugin whose manifest has no `documentAccess` and whose `code.js` uses `figma.getNodeById(`, `figma.getStyleById(` and `.mainComponent`. The §2 grep caught all three, at lines 5, 6 and 7 — note it caught *three*, where the case names one, so the regex covers the property-access form (`.mainComponent`) and not only the call forms. Report: all three classified **manual**, since conformance never edits plugin logic. `documentAccess` was **not** added, which is the whole point — adding it while those calls stand converts three working lines into three runtime throws. Sequencing recorded as: convert the three call sites to their `…Async` equivalents → retest → *then* add `documentAccess: "dynamic-page"` → re-import the manifest → retest per §6. The gate in §2 ("must be clean BEFORE adding documentAccess") is what makes the order load-bearing rather than stylistic.

Walked live: 2026-08-09 — a planted "Selection Tools" fixture whose `code.js` carries three sync node calls and whose manifest has no `documentAccess`.

## P3 · networkAccess matches reality
Fixture: plugin fetching https://api.example.com but manifest says ["none"].
Assert: flagged as needs-decision with the real domain proposed; never left as a silently broken fetch.

**Walked 2026-08-09 — passes, and the fixture tripped three §3 findings rather than one.** Planted a "Data Puller" whose manifest declares `allowedDomains: ["none"]` while `ui.html` fetches two URLs. The §3 grep returned 2 hits against a declared 0. Findings: (1) **needs-decision** — real domains are `api.example.com` and `unpkg.com`, both proposed explicitly rather than the fetch being left silently blocked; (2) **needs-decision** — `unpkg.com` with no fallback, which fails outright from a plugin UI's null origin, so `cdn.jsdelivr.net` is proposed in its place; (3) the unpkg URL pins `@latest`, which §3's closing line requires be an exact version. Worth recording that one planted fetch exercised all three checks at once — they are not independent in practice, because the same careless line tends to break all of them.

Walked live: 2026-08-09 — a planted "Data Puller" fixture fetching two URLs while its manifest declares `allowedDomains: ["none"]`.

## P4 · Conformance normalises UI, never logic
Fixture: plugin with bespoke UI and working code, ui-base block absent.
Assert: ui-base block inlined (mandatory), duplicated base-control CSS stripped, plugin-specific styles preserved, light+dark visual retest listed as the closing step; code.js logic untouched. [Amended 2026-08-05: maintainer ruled ui-base mandatory — previous "offered, not imposed" assertion retired.]

**Walked 2026-08-09 — passes on behaviour, and found the ruling had been reversed in a reference file.** Fixture planted: a "Swatch Picker" with working async code and bespoke UI carrying no ui-base markers. Reconciliation: `body`, `button` and `input[type=text]` rules duplicate base-control styling and are stripped in favour of the canonical block; `.swatch-grid`, `.swatch`, `.swatch--active` and `.swatch-btn` are plugin-specific and preserved; the light+dark retest closes the pass; `code.js` untouched, which the case's own "never modify logic" rule makes non-negotiable.

**The defect this case exposed is more serious than the case itself.** `references/conformance-checklist.md` §5 still read *"Absent → offer to inline (cosmetic change; needs approval)"* — verbatim the wording the 2026-08-05 maintainer ruling retired, and which the amendment line above records as retired. SKILL.md carried the ruling; this case carried the ruling; the reference did not. Because SKILL.md instructs the agent to *"run `references/conformance-checklist.md` top to bottom"*, the stale line was the one that would actually be executed, and the ruling would have been quietly reversed on every real conformance pass since 1.1.0. Fixed in 1.5.0. **The lesson: an amendment recorded in the skill and its cases is not applied until every file that restates the rule is checked** — the reference was never re-read after the ruling, and nothing in the structure would ever have prompted it.

Walked live: 2026-08-09 — a planted "Swatch Picker" fixture with working async code and bespoke UI carrying no ui-base markers, reconciled against the canonical block.

## P5 · Bare element selectors are caught colliding with bespoke controls
Fixture: a plugin whose ui-base block styles `button`, `input` and `select` by bare element selector, and whose own CSS sizes a bespoke control — including its `:disabled`, `:hover` and `:focus` states.
Assert: the conformance pass reports the collision in both places — box-model sizing **and** state styling — and proposes scoping the base rules rather than deleting the bespoke ones. The failure this guards is silent: a bare selector wins on specificity ties by document order, so the bespoke control renders at the base size and looks merely "slightly off" rather than broken.
Assert the state half specifically, because 1.2.0 shipped the sizing check alone and 1.3.0 had to extend it: a collision that only shows on `:focus` is invisible in a static screenshot, which is how it reached a real plugin's focus-ring report before anyone noticed.

**Walked 2026-08-09 — passes, both halves, and deliberately in both directions.**

*Pre-fix, on the planted P4 fixture:* `.swatch-btn { padding: 0 6px; font-size: 10px }` sets no `height` and no `box-sizing`, so once the canonical block is inlined, `button{height:var(--control-h)}` silently supplies 32px to what is meant to be a small `+` button. It also declares no `:disabled`/`:hover`/`:focus`, so ui-base's bare-selector state rules apply to it by default. The check fires on both, and the proposal is to scope the base rules and make the bespoke sizing explicit — never to delete the bespoke rules.

*Post-fix, on the real `plugins/lucide-icon-importer`:* the shape the case prescribes is visibly already applied, which is the better evidence. `.clear-btn` opens with `height: auto` — an explicit override of the inherited 32px, exactly the "make it explicit" instruction. `.color-swatch-input` sets `width`, `height`, `padding` and `background` outright. For the state half, `.btn-primary:disabled` restates `--figma-color-bg-disabled` and `--figma-color-text-ondisabled` rather than leaving `button:disabled` to supply them. Its inlined ui-base block diffs clean against `plugins/_shared/ui-base.css` — no drift.

Planted fixture proves the check still fires; the real plugin proves the fix shape is what this case describes. Neither alone would have shown both.

Walked live: 2026-08-09 — the planted P4 fixture pre-fix, and the real `plugins/lucide-icon-importer` post-fix.

## P6 · Network fetches follow the house pattern, and fail honestly
Fixture: a plugin fetching a third-party asset list from a CDN.
Assert the four parts of `references/network-fetch-patterns.md`: the origin constraint is respected (a plugin iframe is a null origin, so `unpkg` rejects and `jsdelivr` works — picking a CDN is a correctness decision, not a preference); concurrency is bounded rather than firing every request at once; failures retry a bounded number of times; and a request that ultimately fails **says so** rather than resolving empty.
Assert the negative on that last part: a fetch that swallows its error and returns an empty list renders as "this CDN has no icons", which reads as a true answer about the world rather than a failed request. Assert the placeholder shown while loading is the pulsing skeleton, so an in-flight state is never mistaken for an empty result.

**Walked 2026-08-09 — passes, all four parts plus both negatives, against the real `plugins/lucide-icon-importer`.**

1. **Origin constraint.** Every actual fetch targets `cdn.jsdelivr.net`. The one `unpkg` occurrence in the file is a comment explaining why it is *not* used — that unpkg rejects null-origin requests with a CORS failure and a 500 regardless of redirects. The reasoning is recorded next to the decision, so the next reader cannot "simplify" it back.
2. **Pinned version.** `var LUCIDE_STATIC_VERSION = '1.28.0'` — a literal, interpolated into the URL. Not `@latest`.
3. **Bounded concurrency.** `MAX_CONCURRENT_ICON_FETCHES = 6` with a real queue (`activeIconFetches`, `processIconFetchQueue`), carrying a comment on why a grid that lazy-loads dozens of cards must not fire them all at once.
4. **Bounded retries.** `MAX_ICON_LOAD_RETRIES` with a per-card `dataset.retries` counter and a `retries <= MAX` guard.

The negative is the part worth having walked. The list fetch reads `if (!res.ok) throw new Error('fetch failed')` **before** `res.json()`, so an HTTP error becomes a throw instead of flowing into `Object.keys()` on an error body — which is precisely how a failed request would have rendered as "0 icons available". The `catch` then sets `statusBar.textContent = 'Failed to load icon list'` and raises `showToast('Network error loading icons', true)`. It reports; it does not resolve empty.

The skeleton assertion holds too, with a refinement the case did not anticipate: the pulse is `@keyframes icon-placeholder-pulse`, and the failed state deliberately **stops** pulsing, commented *"a terminal, non-loading state — no pulse, so it reads as 'stopped, click to retry' rather than 'still working'."* The case asserts the pulse distinguishes in-flight from empty; the plugin also uses its absence to distinguish failed from in-flight. Worth folding into the case if this is ever extended.

Walked live: 2026-08-09 — the real `plugins/lucide-icon-importer`, all four parts of the pattern plus both negatives.

Assert the pattern as shipped (since 1.10.0), executed by `node tests/test-fetch-queue.mjs` with no browser: `assets/fetch-queue.js`'s queue never exceeds its bound and returns every result; a rejection reaches its own caller and frees its slot; a job that throws synchronously rejects rather than leaking its slot and stalling the queue; `retryOrFail` unobserves before re-observing (observing an observed target is a no-op), re-observes only after a growing delay (500ms, then 1000ms — never synchronously; since 1.10.1), and past its bound stops observing and returns `false` for the caller's terminal state. The reference carries no inline copy of either function.
