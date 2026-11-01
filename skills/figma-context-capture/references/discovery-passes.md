# Discovery passes

Every pass is **read-only**. Nothing in this skill ever writes to a Figma file. **Call sizing (hard rule, learned from a bridge crash):** run passes as small, single-file `figma_execute` calls with an explicit `fileKey`. Never combine page loads (`loadAllPagesAsync`, `page.loadAsync`) or `mainComponent` walks with `figma_execute_across_files` — parallel heavy calls can crash the Desktop Bridge. Cross-file parallelism is only for light, load-free reads.

The sandbox accepts **modern JavaScript** — verified 2026-08-08 against Desktop Bridge plugin 1.39.0 by running arrow functions, `const`/`let`, template literals, spread, destructuring, `??`, `?.`, `class` and `globalThis` in one call. This file previously required ES5; that was probably true once and was never re-tested. The scripted passes are written in ES5 and stay that way — they work — but nothing obliges new code to be.

**Passes A, C, D, E, F (with S4), S1, S2 and S3 are scripts** in `scripts/`, each a `figma_execute` body: read the file, fill its `CONFIG` where it has one, and send the whole body as the call's code. They are short enough that the call is the delivery, so nothing is cached in the Figma file and the script is the single source; do not retype them. **Pass B and the registry run in node** over what those return (`scripts/pass-b-naming.mjs`, `scripts/registry.mjs`): save each call's result as JSON and pass the files. `tests/test-passes.mjs` runs all of them against a fake file. What is left is judgement over what the scripts return, or questions (M); never count by hand what a script counts (toolkit-standard §D 23). Batch per page group, timeout 20000–30000. After any failed or hung call, `figma_get_status({ probe: true })` before retrying.

Each pass ends with **what to record** and its **confidence tag**. Three tags, used throughout the output:

- `[confirmed]` — read directly from data, with the evidence noted
- `[inferred]` — derived from a pattern (e.g. majority spelling); cite the sample size
- `[TBD]` — not discoverable or contradictory; becomes an open question

Never promote `[inferred]` to `[confirmed]` because it "looks obvious". A wrong value here bakes errors into every future skill run against this project.

---

## Pass A — Identity & inventory

Send `scripts/pass-a-inventory.js`, after `figma_list_open_files` + `figma_navigate({lock:true})` + `figma_get_status({probe:true})`. It returns `fileKey`, `fileName` and, per page, `sets`, `comps` (variants are not counted), `described`, the flat `names` list, and `setIds` — each component set's `{ name, id }`, which pass D takes as its `CONFIG.ids`.

Never judge a page from `page.children` — libraries wrap pages in one outer frame; `findAllWithCriteria` descends fully.

**Record:** fileKey, file name, page inventory, component/set counts, description coverage ratio. `[confirmed]`. The name list feeds passes B and D.

## Pass B — Naming conventions (prefix, separator, suffixes)

Run `scripts/pass-b-naming.mjs` in node, with pass A's saved output and pass D's (`<pass-a.json> [<pass-d.json>]`). It counts what the rules below count: each leading mark with its pages and examples (`recordable` at three or more), the stems two or more siblings share per candidate separator, every name carried both prefixed and bare (`contradictions`), and the layer endings found in two or more of pass D's sampled sets (pass D returns each set's first-variant layer names). What it cannot decide is yours:

- **Internal prefix:** a candidate prefix (`_`, `.`, `Internal /`, `🔒`…) needs ≥3 components (`recordable`) and must correlate with *not being consumed as a top-level subject* (spot-check 2–3: are they nested inside other components' instances?). One prefixed component alone is `[TBD]`, not a convention.
- **Virtual-set separator:** names sharing a pre-separator stem (`Top bar / Default`, `Top bar / Main`). Requires ≥1 group of ≥2 siblings to record; a lone slash-name is not evidence.
- **Suffixes:** recurring layer endings (`-icon`, `-label`), from the 3–5 sets pass D sampled; a suffix in one set alone is not listed.

**Record:** prefix, separator, suffixes — each with example names as evidence. Contradictions (same conceptual child prefixed on one page, bare on another) go to open questions verbatim; that's a maintainer ruling, never a guess.

## Pass C — Token scales & vocabularies

Enumerate **source libraries**, never just imported variables (`getLocalVariablesAsync` returns only what the file happens to use — gaps guaranteed): send `scripts/pass-c-libraries.js`. It returns each consumable collection's `key`, `name`, `library`, `count` and up to 400 variable `names` — `truncated` is true when the cap bit, and a scale read from a truncated list must not be recorded as complete — plus the file's `localCollections` with their mode counts.

**When `getAvailableLibraryVariableCollectionsAsync` exceeds the timeout budget** — it did on a 49-page consumer file, three times at the 30000ms ceiling, while the bridge probed healthy at 6ms between attempts — do not keep retrying. Capture the same structure from the **source** file with pass S, which reads local collections directly and is not a network call. What you lose is only the consumer-side *symptom* (a hidden collection enumerating 0); the mechanism itself is visible in pass S as per-variable `hiddenFromPublishing`. Say which of the two you actually observed.

From the name lists derive: full numeric spacing/radius scales (sorted, note gaps — "0–32, no 10" is a finding), colour role vocabulary and the token grammar's **structure** (how many slots, what populates each). The slots' official NAMES are maintainer convention, not derivable from data — record slot vocabularies with placeholder labels tagged `[TBD — confirm official slot names]` and ask at the step-2 summary; a wrong invented label (calling the Element slot "Type") propagates into every downstream document. Also derive spelling (`colour` vs `color` — count both; majority is `[inferred]`, unanimity `[confirmed]`), mode names (light/dark). Collection identity is the **key**, never the name — names collide across libraries.

**Record:** collection keys + names, scales, grammar, spelling, modes, local collections (legitimate unless default-named). This section doubles as the library-dependency-graph evidence: which upstream libraries this file consumes.

## Pass D — State vocabulary, axis grammar, sparse-grid stance

Sample 3–5 interactive component sets (buttons, inputs, checkboxes — pick from A's `setIds`) and send `scripts/pass-d-axes.js` with their ids in `CONFIG.ids`. Per set it returns the `axes` in authored order (name, type, options), `variantCount`, and `fullGrid`, the product of the variant axes' option counts. An id that is not a set, or a set Figma refuses to read ("existing errors"), comes back as an `error` row rather than being dropped.

Derive: the state option set and its **order as authored**, axis ordering pattern (is State last? Size first?), boolean naming style, and the sparse-grid stance — `variantCount` below `fullGrid` is a sparse set. Consistent sparseness (e.g. `Disabled=True` only pairs with `State=Rest`, across every sampled set) is a house convention `[inferred]`; a single sparse set among full ones is an open question, not a stance.

**Record:** state vocabulary + order, axis grammar, sparse stance with the pairing rule spelled out and which sets evidenced it.

## Pass E — Description dialect & documentation furniture

- Send `scripts/pass-e-descriptions.js` (empty `CONFIG.ids` samples the first three described components; or fill it from A's ids, a private one among them). It reads `descriptionMarkdown` (never `description` — it strips markdown) and returns per component the headings as written, bullets and how many end in a full stop, and spelling pairs counted (`colour`/`color`…). Read off from it the heading spellings, the dialect, the punctuation habit and whether private components carry compact descriptions.
- It also returns `headerCandidates`: on the first sample's page, instances **outside any component** whose name says header, with their main component and text-layer names. Which one is the canvas documentation header, and its body text layer, is yours. Note plainly it was checked on one page — header conventions can be page-specific, so tag `[inferred]`.
- If zero components carry descriptions: every field here is `[TBD]` and the summary should say the description settings will be established by the *first* figma-component-descriptions run, not by this capture.

## Pass F — Documentation & properties-table apparatus (optional per file)

Only when the file registry says this file plays a doc role, or pass A's page names suggest it (`Documentation`, `Tokens`, pages named `1 - Colour - …`):

- **Doc components present?** Send `scripts/pass-f-doc-apparatus.js` after `const TOKENS = …;`, the library's settings as `node tools/snapshot/projects.cjs settings <project>` prints them (its `pageSectionComponent` and `ratiosGrid` name the section header and the contrast matrix): per name of the doc-generator contract (`Table - `, `Section header`, `Row - `, `Cell - `, `Preview - `) it counts local components, instances and remote instances (with their library components' keys), and returns the page names and the `_Ratios grid` instances per page. Present as local components → this file is a doc component library candidate; present as instances → a previous generation ran here (target candidate). Record which.
- **Doc-generator plausibility:** a file holding *only* its own styling primitives as collections and the full doc name contract is a doc library, not a source — record that explicitly so the classic "documented the doc library's own variables" failure stays unreachable.
- **Properties table:** if the `figma-properties-table` skill is installed, run that skill to profile the file (it loads its own script; this pass never pastes it) and record the config it returns (columns by header label, schema, seenOnPages) instead of probing by hand; an `error` beside it means nothing was stored, so record the error and that no table was confirmed, not the config. Check `titleResolvedBy` before trusting a cached profile.
- **Existing generated pages:** read one Line-height cell per text-style frame group — `%` = as-authored units, bare number = converted — and one colour cell for format (hex/rgb/oklch). These are the doc-generator's two sticky formatting decisions; capturing them prevents a future refill silently flipping every value.

## Pass G — Accessibility minima & annotations (light touch)

- Stated minima: search page/section names and any style-guide text nodes for WCAG mentions. Found → record; not found → record "WCAG 2.2 AA fallback `[TBD — confirm with maintainer]`".
- Annotations: `figma_get_annotations` on one or two state-bearing sets, just to record whether the library uses Dev Mode annotations at all (yes/no/sparse).

## Pass M — Maintainer-only facts (asked, never read)

**This pass runs no code.** Its four items are invisible to every Figma read, and unlike the rest of this reference they cannot be inferred from a sample, a majority or a pattern. They exist as a pass because the failure mode is silence: without a prompt, a capture simply omits them and the resulting document looks complete.

Ask all four at the step-2 summary, in one block, each defaulting to `[TBD]` if the maintainer doesn't know:

- **Lifecycle & status** — what statuses exist, what advances a component between them, and **what each status exempts from audit**. Push for the exemption specifically; maintainers volunteer the ladder and omit the consequence, and the consequence is the part downstream skills act on.
- **Versioning & deprecation** — how the library versions, when deprecated things are removed, and **how a deprecation is marked inside Figma**. The marking is the only part with a mechanical trace, so if any answer is worth chasing to `[confirmed]` it is this one; ask for an example component and verify the marking on it.
- **Platforms & parity** — which platforms ship and where they may legitimately diverge. Skip entirely for a single-platform project rather than recording "n/a".
- **Governance** — who may change the library, who may issue a ruling, how a change reaches published.

**The trap: file evidence that looks like an answer.** A page named `WIP`, a component prefixed `[deprecated]`, two libraries that look like a web/native pair — each of these is a *hypothesis* to put to the maintainer, never a finding. Record it as `[TBD]` with the observation attached ("`Deprecated` page exists — is this the marking convention?"). The distinction matters more here than anywhere else in this reference: an inferred naming convention is wrong about a name, whereas an inferred deprecation convention makes later skills silently ignore live components.

**Record:** each answer, or `[TBD]` with where it resolves. Maintainer answers here are `[confirmed]` with "maintainer-stated" as evidence, and any that overturns a house default becomes a §6 ruling with the maintainer named in **Decided by**.


## Pass S — Source / foundations library (replaces C–F when the file IS the variable source)

Pass C reads a library **from the outside** (team enumeration) and is blind to anything `hiddenFromPublishing`. When the captured file is itself the variable source, capture from **inside** instead — this is the only vantage point that explains publish visibility, modes, and internal token structure.

**S1 — Local collections, modes, publish mechanics.** Send `scripts/pass-s1-collections.js` in the source file. It returns, per local collection, its `key`, `name`, `modes` (the names, in order), `count`, `unread` (variables that would not read, counted rather than dropped) and `hidden` — `"collection"`, `"every variable"`, `"some variables"` (with `hiddenVariables`) or `"none"`. The script reads; the meaning below is yours.

Record, per collection: key, count, **mode names** (mode names are architecture: `Light/Dark` = theming; brand/vertical names = multi-brand switching; a single default mode = plain values), and **where hiding lives** — collection-level vs per-variable `hiddenFromPublishing`. A collection that enumerates as 0 from a consumer file but holds N variables here, all `[hidden]`, is *deliberately internal*: record that as the mechanism behind a semantic-only consumption rule, and note it for variable-audit (bindings into it are defects).

**S2 — Internal structure of hidden primitive collections.** Send `scripts/pass-s2-primitives.js` after S1: for each hidden collection (or those named in `CONFIG.collections`) it returns the ramps (variables grouped by parent path), each ramp's steps in library order and count, the steps carrying a marker, the alpha ramps and `stepCounts`, how many ramps have each length. Derive from it the grammar: step counts per ramp (e.g. 12-step), what the **anchor/source markers** mean (`8-anchor`, `7-source` — brand colours verbatim at that step), alpha ramps (`Alphas/A0..`), per-vertical brand families. These feed oklch-scale/contrast-matrix work later; capture the grammar, not every value.

**S3 — Styles (the non-variable half of the source).** Send `scripts/pass-s3-styles.js` in the source file. It returns `text` and `effect` — each the style `names` in library order (capped at 400, `truncated` saying when it bit), their `count`, and `groups`, the distinct first segments in first-seen order — and the `paint` and `grid` style counts. The groups are what to record verbatim; the role/size grammar and the shadow taxonomy are your reading of the names.

Record text-style **group names verbatim** (they drive the doc-generator's per-group unit rule), the role/size grammar and suffixes, and the effect-style taxonomy.

**S4 — Documentation state.** Send `scripts/pass-f-doc-apparatus.js` (pass F's script). Compare its page names against the doc-generator page contract (one page per collection + `Shadows` + per-group `Text styles - *` pages, numbered section frames) — a read, because the contract is the doc generator's own. If it matches, record that future doc-generator runs are **refills, not first generation**. Its `furniture` counts say whether the doc furniture instances are **remote**: if they are, their source library is thereby identified as the doc component library — record it in the registry with the evidence (the keys). Its `ratiosGrid` says whether `_Ratios grid` (contrast matrix) instances exist yet on the primitive colour page: absent is a useful "not built yet" fact.

**S5 — What NOT to run here.** Passes B, D, E target component conventions and usually have nothing to bite on in a source file (no component sets); run them only if pass A found local components.

---

## Cross-file passes (project level)

When several files are captured in one engagement:

- **Registry:** `scripts/registry.mjs`, run in node with each file's pass A output and its pass C output after `--c`, prints the template's §2 rows, one per file, each role a proposal from the inventory tagged `[inferred]` and audience `[TBD]`. Correct the role from the evidence (Pass F findings, Pass C's consumed-libraries list) at the step-2 summary — never silently assigned.
- **Dependency graph:** the same command prints the dependency line: file X consumes collections whose `libraryName` is file Y → edge Y → X, with the collection **keys** behind each edge.
- **Shared conventions:** a convention goes in the shared section only when independently evidenced in **every** captured library. Anything true in one and unchecked in another stays in that library's own section. Copying a convention "because they're the same project" is exactly the cross-library contamination the downstream skills warn about.
