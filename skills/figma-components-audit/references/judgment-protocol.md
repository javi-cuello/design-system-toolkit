# Judgment protocol — the agent layer

Everything the scanner cannot decide. Scanner output is hypotheses; nothing reaches the user without passing this layer.

## 1. Discovery (only for what the rulebook does not already record)

Fills a library's rulebook in the project's context document the first time this skill audits it (copied into `systems/<library-name>.md` where a local cache is in use). Never derive scales or role vocabularies from *imported* variables (`getLocalVariablesAsync` returns only what the file happens to use — gaps guaranteed); enumerate the source libraries themselves:

```js
await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()          // -> name, key, libraryName
await figma.teamLibrary.getVariablesInLibraryCollectionAsync(collectionKey)    // -> complete variable list
```

Record: collection **keys** (names collide across libraries — the key is the identity), full numeric scales, colour role vocabulary, token spelling, state vocabulary per archetype (sample interactive sets), the sparse-grid pattern (how `Disabled=True` pairs with states), axis grammar, naming suffixes, local collections (legitimate unless default-named), stated accessibility minima (else note WCAG fallback). Summarize to the user and get confirmation **before** the first audit — a wrong discovery bakes errors into every finding.

## 2. Verification (every candidate, no exceptions)

1. **Fresh re-read.** `getNodeByIdAsync` the specific node and reproduce the defect in raw data. Not reproducible → drop silently. Never report with a hedge.
2. **Universality test.** A candidate firing on every instance of something means the check misread the API or found a house pattern. Investigate the check first. (This is how sparse grids, space-between gaps, and per-side stroke weights became exemptions rather than findings.)
3. **Sibling test.** A near-identical sibling with the correct binding names the intended token and confirms the defect. All siblings agreeing indicts the check.
4. **Exception match.** Suppress candidates matching an accepted exception in the active library's rulebook.
5. **Assumption audit.** Any check depending on *where* Figma stores a value (shorthand vs per-side, authored vs resolved/cached) gets validated against one known-good component before its findings count.

## 3. Mechanism recognition

Raw values serving a mechanism are questions, not defects: negative gaps creating overlaps (tooltip beaks), large off-scale paddings driving fills (progress, sliders), transparent hit-area frames enlarging touch targets, 1px hairline grids. Signals: the value is load-bearing for geometry rather than rhythm; siblings use the same "wrong" value; no token could express it (negative, computed). Route to **Decide**, never to auto-fix.

## 4. Judgment-only checks

Run after scanning, on the components in scope:

- **State renders** — diff non-rest subtrees against rest. Identical = product bug, leads the report. **The signature includes the variant root's visual properties — `opacity`, fills, strokes, effects — excluding only its name** (which is `Axis=Value` by construction, §3.10e). Dimming the root is the most common Disabled treatment (measured 2026-08-08: a root-blind diff flagged 6 of 9 correct Disabled variants); a state fill painted on the root or a `Content` frame is the most common Hover/Press treatment (measured 2026-08-13: a diff with root opacity but not root fills still reported 14 false non-rendering states; the full-root signature left exactly the 2 real ones, confirmed by a correctly-rendering sibling in the same set). Detail: `scanner-checks.md` §3.5a.
- **Coverage intent** — missing-state candidates vs the archetype baseline: library-wide absence is conformance; single-component absence is a Decide item with the keyboard/touch implications spelled out.
- **Descriptions** — beyond non-empty (scanner): does it match **the heading set the project's context document records** (conventions-universal §6)? This skill asserts no structure of its own — the shape is per-project and the quality spec belongs to `figma-component-descriptions`. The one content check that is universal is **Composition**: a composite component whose description omits the line naming its sub-components is incomplete whatever the project calls its headings, because that line is what stops the component being reimplemented rather than imported. Is it stale against the current axes/props? Draft replacements; never write without approval.
- **Contrast** — resolved WCAG ratios on text/surface pairs, **across every mode the collection defines, not just the displayed one** (scanner-checks 3.7c). Report failing token *pairs* with the ratio and the mode; a pairing that passes in light and fails in dark is the finding, and naming only the pairing sends the maintainer to a component that looks correct on screen. The fix belongs to tokens; always Decide.
- **Content resilience / composition fit** — fixed-size prop-bound text without truncation, boolean-hidden parts that leave holes, spacing ownership inconsistencies. Questions per element.
- **Detached-instance confirmation** — for each scanner candidate (conventions-universal §8), confirm no `mainComponent` reference and check for drift (stale tokens, outdated naming) before treating it as a real duplicate; a frame that merely wraps a legitimate instance is not a finding.
- **Annotation gaps** — for each state-bearing variant, judge whether it carries spec detail (cursor/opacity rules, timing, conditional visibility, ARIA role) that belongs in a Dev Mode annotation rather than prose. Never invent the actual values (a timing number, a cursor keyword) — draft the annotation only from what's confirmable in the file or from the maintainer directly.

## 5. Classification into the fix queue

- **Approve & I fix**: programmatic, unambiguous, matches a discovered token or naming rule exactly, non-breaking. (Rebind on-scale raw values, layer renames applied identically to every variant of the set, approved descriptions — public descriptions follow the full structure, private ones the compact one-to-two-sentence form; both per the `figma-component-descriptions` skill's format if it's available, otherwise draft inline using the same principle: state what it is and its role, nothing more, for private components.)
- **Quick manual fixes**: correct-by-inspection but API-impossible (axis order, variant option order — Figma UI drag only). Give exact steps + deep link.
- **Decide**: mechanisms, coverage intent, system-rule questions (a repeated "violation" that may mean the rule should change), anything where two legitimate outcomes exist. Present options + a recommendation; a decision yields a fix or a system-file entry.
- **Breaking — schedule**: two kinds, and the blast radius names which. **Loses consumers' work** (tested in Figma, 2026-10-01): deleting or retyping a component property (instances fall back to the default, so typed text is gone), pointing a nested instance at another component or variant (overrides on it are dropped), deleting a slot property (slot content is deleted), and a layer rename that leaves one layer named differently across variants (overrides are dropped when a consumer switches variant). **Changes the API, keeps the file**: renaming a variant property or option keeps every instance and override, but breaks Code Connect enum mappings silently (the CLI does not check mapping keys), scripts that set properties by name, and Swap library, which matches by name. Structural rework belongs to whichever kind it does. Never batch either with safe fixes.

Product-visible defects (non-rendering states, missing focus indication) lead the queue regardless of category.

## 6. After the user rules

Same session: accepted → add to the active library's rulebook, under Accepted exceptions, with the reason; rejected → add the fix to the queue and apply per its bucket; system-rule changed (e.g. new scale step) → update the rulebook entry, note the date, and mention that previously suppressed candidates may resurface on the next run.

## 7. Applying fixes

Batch approved safe fixes per component, then **re-run the relevant scanner check on the touched components** to confirm clearance — a fix that doesn't clear its finding is a new finding. Variant property renames: warn (breaking) → approval → rename → verify. Never silently restructure layer trees or change visual values.
