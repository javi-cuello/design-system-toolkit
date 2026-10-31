# Scanner checks — the deterministic layer

**This file documents `scanner/audit.js` and `scripts/probes.js`. It is not a
second implementation of either, and nothing here runs.** `scanner/audit.js` is
the audit: a session runs it, and so does the dashboard, which is what makes an
audit produce the same result whoever launched it. `scripts/probes.js` holds the
session's other deterministic work — discovery, the checks still at `backlog` or
`session` in `scanner/checks.json`, and the fix recipes — as `FCA.*` functions a
session loads once per file (`SKILL.md`, "Session probes"); nothing in it feeds
the dashboard. Read this to understand *why* a check exists, what failure it
was written for, and what it must not claim — then change the check in
`scanner/audit.js`, and update the entry here in the same commit.

**Checks documented here but not yet in `scanner/audit.js` are listed in the
porting backlog at the end of this file.** A probe in `scripts/probes.js` runs only
when a session calls it; it is not in the scanner until it is ported.


Each section names its engine — a rule in `scanner/audit.js` or an `FCA.*` function in `scripts/probes.js` — answering a binary question in `references/conventions-universal.md`, parameterized by the active library's rulebook (scales, collection keys, spelling, state vocabulary, baselines), never hardcoded, since a different library means different values. If the rulebook has not been resolved for this file yet, run discovery (judgment-protocol §1) first.

**Scanner output is candidates, not findings.** Every result routes through `references/judgment-protocol.md` §2 (verification) before it can reach the user; anything matching an accepted exception in the rulebook is suppressed there. Scripts are time-boxed and depth-limited: batch by page group (~100–150 variants per call), `timeout` 20000–30000.

**Before writing or trusting any check, read this list of traps.** Every one of these caused a false positive — or a silent miss — severe enough to make an audit untrustworthy:
- **Gap means three properties, not one.** `itemSpacing` is only the primary-axis gap. Wrapping auto-layouts also carry `counterAxisSpacing` (the cross-axis row gap), and GRID auto-layout (`layoutMode: "GRID"`) has its own gap properties. A walker that checks only `itemSpacing` silently passes every unbound wrap/grid gap — this shipped a false "fully clean" deep pass on calendar-style grid components. Check `itemSpacing` on flow auto-layout, `counterAxisSpacing` when `layoutWrap === "WRAP"`, and on GRID **only** `gridRowGap` and `gridColumnGap` — there `itemSpacing`/`counterAxisSpacing` are inert leftovers (§3.4; this bullet said the opposite until 2.12.0, contradicting §3.4 and the scanner). In reports, label GRID findings "grid row-gap" / "grid column-gap" and tell the maintainer they live in the **Grid layout** panel section, not the flow auto-layout gap field.


| Trap | Reality |
|---|---|
| Reading `strokeWeight` | Shorthand, carries no binding. Read the four per-side `stroke*Weight` properties |
| `paint.opacity < 1` on a bound paint | Figma caches the token's resolved alpha onto the paint. Not an override. Compare against `resolveForConsumer` if you must check |
| Scale from `collection.variableIds` | Only imported variables. Use `figma.teamLibrary.getVariablesInLibraryCollectionAsync` |
| Role from node type (`VECTOR → Icon`) | Wrong constantly. Only `TEXT ↔ Text-role` is safe |
| Collection identity by name | Names are not unique across libraries. Compare `key` |
| `instance.mainComponent` | Throws under dynamic-page access. Use `getMainComponentAsync()` |
| A finding on *every* component | Almost certainly a broken check or a house pattern — investigate before reporting |
| Indexing `fills` / `strokes` / `effects` | `figma.mixed` on a text node with per-character styling. Indexing it **throws mid-walk and loses every finding already collected** — silent under-reporting, no error surfaced. `Array.isArray` first, always |
| A property no layer references ⇒ unused | Variant axes live in `componentPropertyDefinitions` and are resolved at the set level, so **no layer ever references one**. Filter `type !== "VARIANT"` or you flag every axis of every set. `SLOT` properties fail the identical way for a different reason — filled by presence in the tree, not by a `componentPropertyReferences` entry — so the filter needs both exclusions, not one; detail in §3.10c |
| Treating `BOOLEAN_OPERATION` as a `GROUP` | It reports as its own type and is legitimate inside icons. Never widen a GROUP check to "any non-frame container" |
| `layoutSizingVertical` alone | Meaningless without an auto-layout parent. Read `textAutoResize` too, or you flag every text node in a non-auto-layout frame |
| `layoutSizingVertical: "FIXED"` as a second way to catch fixed text | Can read `FIXED` even under a genuine auto-layout parent when `textAutoResize` is `HEIGHT`/`WIDTH_AND_HEIGHT` — contradicting the resize mode outright, not merely meaningless. `textAutoResize` alone decides "fixed"; `layoutSizingVertical` is reported, never used to decide. 33 false hits on one real layer; detail in §3.10f |
| `paint.color` on a bound paint | The value cached for whichever mode the file is **currently displaying**. Resolve `valuesByMode` per mode, and follow `VariableAlias` chains to their target — treating an alias object as a colour yields `NaN`, which passes every threshold and reports clean |
| `itemSpacing` as "the gap" | Three properties, not one — see the gap note above this table, which also covers how to label GRID findings in a report |
| `!main` as the orphan test | Never fires. Deleting a main leaves `getMainComponentAsync()` returning it, `removed === false`, still findable by id — only its `parent` goes null. Test `!main` or `!main.parent`, either one; detail in §3.10d |
| `main.parent === null` on a REMOTE instance | Not proof of orphaning. A perfectly healthy remote component reads identically to a broken one whenever its source file isn't connected in the current session — nothing about the node tells you which. Gate on `main.key`: absent, trust `!main.parent`; present, verify live with `figma.importComponentByKeyAsync(main.key)` before flagging. A timeout on that call is not proof either — retry once, isolated, before reporting. Detail in §3.10d |
| "Non-canonical page" = doesn't start with one library's marker | A library uses other prefixes for work in progress (a status marker, say), and treating an unfamiliar one as non-canonical produces a wall of false positives from that page's own substructure. Read the real set from `componentPages`; exempt the pages `exemptPages` names. Detail in §3.9 |
| WCAG target-size minimum = 44 | 44×44 is SC 2.5.5 (**AAA**, also the common mobile-touch figure), not the AA baseline this skill actually claims. SC 2.5.8 (**AA**) is 24×24. Checking 44 against a real desktop-pointer library flagged nearly every interactive component as a single undifferentiated wall — the universal-finding signature. Detail in §3.7b |
| Diffing state variants with the variant root excluded | The root's *name* is `Axis=Value` and must be excluded (§3.10e's lesson) — but its **visual properties are where states render**: Disabled dims the root's `opacity`, Hover/Press paint a state fill on the root itself or on a `Content` frame. Excluding the whole root reported 44 non-rendering states on one library; 42 of them were the root's own opacity or fill, 2 were real. Exclude the root's name; keep its fills, strokes, effects and opacity in the signature. Detail in §3.5a |
| Resolving a colour variable and dropping its alpha | A resolved variable value is **rgba**, and low-alpha tints are how soft surfaces are built — a "soft" background token can be its palette's near-black at ~5% alpha, rendering light grey. A resolver that reads only `{r,g,b}` reports that token as opaque near-black: measured 2026-08-13, a fill-vs-track pair returned ratio 1.0 (black vs black) for a bar that visually shows ~15:1. Composite over the backdrop using `a` before computing luminance, or flag the pair as verify-by-eye when `a < 1`. Detail in §3.7c |
| A nested instance's own `opacity: 0.5` read as a double-dim | It is usually the disabled treatment itself. **An instance does not inherit its main component's root opacity** — a library that renders `Disabled` as a 0.5 on the variant root gives an *instance* of that variant an explicit 0.5, and clearing it makes the control look enabled. Only an override *inside* an already-dimmed parent multiplies. Test before touching it: compare the instance's opacity against `(await inst.getMainComponentAsync()).opacity`, and screenshot the set. |
| An exposed nested instance in `componentPropertyDefinitions` | It is never there. "Expose nested instance" sets `isExposedInstance` on the CHILD; the parent set's definitions do not change, so a check reading them reports a correctly exposed component as exposing nothing — a false finding on a component that was just fixed. Verify the consumer's view: `const p = set.createInstance(); p.exposedInstances; p.remove();` |
| "Does anything consume this token?" via variable-to-variable alias chains only | Misses **Style paint-stop bindings** (`style.paints[].boundVariables.color`) entirely — a real, legitimate consumption path distinct from one variable aliasing another. A token bound only there reports zero consumers under an alias-only search and reads as orphaned when it isn't. No check in this skill performs this walk today (the token-binding check in §3 runs the opposite direction — layer-binds-to-token, not token-has-consumers), so nothing here regresses; recorded because an ad-hoc version of exactly this search produced a real false "orphaned variable" finding on a live file, withdrawn only because the maintainer knew better. If this ever becomes a formal check, walk both paths before concluding a token is unused. |

## Adding a check — the four things, none optional

Every trap in the table above was a check that shipped and then reported something false or missed something real. The pattern is consistent enough to be a procedure:

1. **Control-pass it before trusting a single hit** (toolkit-standard §D 18). Run the new check against output already known to be correct. Identical hits there mean you have found an artefact of the component or the template, not a defect — and "fixing" those damages correct output. This is the step that catches a check which is right about the mechanism and blind to the intent.
2. **State what the check does NOT flag**, with the reason, beside the script. Every check added in 1.3.0–1.4.0 needed one to two exclusions, and each exclusion was the difference between a useful check and one firing library-wide. If you cannot name a legitimate case that resembles a hit, you have not understood the check yet.
3. **Put the trap in the table above, not only in your section.** That table is what the file tells a future author to read first, so a trap recorded only where it was found is a trap nobody will meet in time. Five traps were inline-only until 1.6.0 for exactly this reason.
4. **Write the case, and make its sharpest assertion a negative one.** What must *not* be reported is the half that rots silently: a check that stops firing on a real defect reports success, and a report that looks normal is indistinguishable from a correct one. §11's rule is the general form — a finding on every instance means the check is wrong.

A check missing any of the four is a candidate, not a check. Say so in the report rather than presenting its hits as findings.

General notes:
- Use the async API variants (`getLocalVariableCollectionsAsync`, `getVariableByIdAsync`); the sync variants throw under dynamic-page document access.
- `await page.loadAsync()` before `findAllWithCriteria`.
- A bound value reports its variable id in `node.boundVariables[key]`. Absence of that key for a non-zero/non-default visual property is the signal for "raw value".

---

## 0. Locate a component set by page name

**Engine:** `FCA.locate(target, componentPages)` in `scripts/probes.js` — the page whose name contains `target` inside the project's `componentPages` filter (the same regex `scanner/audit.js` reads; absent, every page), and its component sets with id and variant count. A marker written into the call is one library's convention, and on a library that uses another it finds nothing and the audit reports clean (the trap table above says exactly this).

---

## 0.5 Discovery — establish this file's own vocabulary before checking anything

Run once per file (skip if already run this session against the same file). Do **not** carry any prior file's scales or colour spelling into a later call — take them from this probe's output.

> **CRITICAL:** query `figma.teamLibrary` for the COMPLETE library. `collection.variableIds` and `getLocalVariablesAsync()` return only variables *this file has already imported* — a scale built from those will be missing steps and a role list will be missing roles, producing false "off-scale" and "wrong role" findings on correct components.

**Engine:** `FCA.discover()` in `scripts/probes.js` — every library collection with its key, the numeric groups of each (`FCA.numericScales`: spacing, radius, stroke, opacity, size, font), the colour role segments (`FCA.colourRoles`: the first two segments of every colour or state variable), `allowedKeys` by collection key (local collections included, except a default-named one; a `remote` collection is never counted local), and each local collection with its variables and whether its name is Figma's default (`Collection N` — the finding; mode names are not, being invisible at one mode).

Feed the results into the project's audit settings (the `TOKENS` the scanner reads) and the `opts` of every later probe:

- the spacing and radius scales — from `scales`, complete.
- the allowed collection keys — from `allowedKeys`, which holds the library collections and this file's local collections (labelled `local :: <name>`); a stray default-named collection is left out, being a finding rather than a source. **Check bindings by collection KEY, never by name** — a file can subscribe to two different collections sharing a name (e.g. two called `Semantic` from different libraries), and only the key distinguishes them.
- the colour roles — from `colourRoles`, complete. A role you didn't discover is a gap in discovery, not a defect in a component.

Then sample two or three interactive component sets for the `State` axis vocabulary and order (libraries vary — mobile libraries typically have no `Hover`).

Summarize all of it to the user in one short note before auditing, so a wrong discovery is caught before it is baked into every finding. If two components disagree on spelling, that inconsistency is itself the finding — don't silently pick one.

---

## 1. Variant schema check

Axis order (the state axis last, the disabled axis before it, a project's `firstAxis` first) and a True/False axis's default-first order are the scanner's: `scanner/audit.js` `schema|axis-order|` and `schema|bool-default|`, which the dashboard runs too (figma-standard rule 1). The session probe reports what the scanner does not: a single-option axis and `State` options off the recorded vocabulary.

**Engine:** `FCA.schema(set, opts)` in `scripts/probes.js` (the pure half is `FCA.schemaFindings(defs, opts)`, tested). The state axis and its vocabulary are the project's, passed in: `opts.stateAxis`, `opts.states` (the recorded order) — and each missing one **skips** its check. The block this replaced hard-coded one library's `State`, `Disabled`, `Breakpoint` and `Rest · Focus · Hover · Press · Loading`, which a touch-first library with no `Hover` would have failed wholesale. It reports: the state axis not last; the disabled axis not immediately before it; the first axis not first; any axis with a single option; a `False`/`True` axis whose default is not its first option (default first, not a fixed `False` first); state options outside the vocabulary, and out of order among the known ones (ranking an unknown option `-1`, as the prose did, made a correct order read as out of order).

**The single-option-axis check is walked, both directions** (added 2026-08-13 on maintainer request; control-passed the same day — silent across all 54 sets of a live library the maintainer considers correct, and fires on a purpose-built probe set carrying a one-option axis beside a two-option control axis; case A23). What it does **not** flag: non-variant properties, which carry no `variantOptions` at all; any axis with two or more options. One shape it flags deliberately rather than excludes: a set with exactly one variant, whose one axis necessarily has one option — there the question the agent frames is the set's shape (should this be a plain component?), not the axis alone. A hit always routes to **Decide**: removing or merging an axis rewrites every variant name and every instance override, a breaking change, and a deliberately staged axis (options planned, or an API kept in step with a sibling library) is legitimate intent to record as a ruling in the rulebook.

---

## 2. Property naming check

Flags a text property ending in ` text` unless a code prop has it, an instance swap ending in ` swap`, and a property that is not sentence case (an all-capitals word is an acronym and passes), per figma-standard rule 21.

**Engine:** `FCA.propertyNaming(set, opts)` in `scripts/probes.js` (`FCA.propertyNamingFindings(defs, opts)`, tested). Flags an instance swap still carrying Figma's default name (`Instance…`, `Component…` — several swaps need unique names, so a qualifier like `Icon (Danger)` is fine). A property name's case, prefix and suffix are the scanner's (`naming|prop-case|`, `naming|prop-text|`, `naming|prop-boolean|`, `naming|prop-swap|`).

---

## 3. Token-binding check (the core check)

Walks every variant in the set (not just one) and flags any raw padding/gap/radius, any unbound fill/stroke, any colour token whose role doesn't match the layer, any off-scale spacing, and any text node missing a text style. Checking only the default/rest variant misses real defects that only appear on Hover, Press, or Disabled — widen to all variants by default; scoping down to one variant is the optimization, not the default.

**Before running it, the project's `TOKENS` must hold what section 0.5's discovery found** — a missing rule skips its check rather than falling back to another library's value.

**Engine: `scanner/audit.js`** — the token rules inside `checkFacts`, which every session and the dashboard run. Its scales and collection come from the project's `TOKENS`, never from constants in a snippet. Per non-instance, non-slot node: each non-zero padding unbound; the gap (below); each non-zero corner radius unbound — padding and gap noted *on the spacing scale* or *off the spacing scale; nearest step N* against `TOKENS.spacing`, radius against `TOKENS.radius`, and an off-scale padding of 80 or more filed as `review` asking whether it drives a fill (a progress bar or slider), since a mechanism is a question, not a defect; a visible solid fill unbound, or bound outside the `semantic` collection(s), or — on a `TEXT` node — bound outside the `textRole` segment, or — on any other node — bound **inside** it (a text role on a shape; only these two role assertions are made, because inferring icon or background roles from node type is wrong too often); a visible stroke's colour unbound, and its weight unbound — on the four per-side properties where the node has them, on the `strokeWeight` shorthand where it has none (vectors, lines, ellipses); a `TEXT` node with no text style or an unbound font family, size or style; with `TOKENS.allowedKeys`, any binding from a collection outside those keys (§3.5c); a Figma default layer name. It walks every variant and never descends into an instance. Each setting that is absent skips its note or check.

> The check flags a value **only when it is unbound**. A bound value on this file's scale (whatever section 0.5 discovered it to be) passes — the rule is binding, not arithmetic. > > **Every unbound non-zero gap is flagged** — an untokenised value is dead weight regardless of whether it shows today, and it is a latent defect (it activates the moment a second child is added). The *tier* depends on context: a gap that is currently effective (not space-between, 2+ visible children) is an **error**; a gap that is inert because the frame has a single child is still flagged, as **hygiene** (lower priority, no visual impact yet). The **only** exclusion is `SPACE_BETWEEN` ("Auto"): Figma ignores the stored number there and keeps an unclearable fallback, so flagging it is noise. Padding and radius always affect layout, so they are flagged whenever unbound. > > For an unbound padding the check says whether the value is on the project's spacing scale (safe auto-fix) or off it (needs a design decision). `SLOT` nodes are skipped: they are meant to be empty and filled by overrides. The walker handles both a `COMPONENT_SET` (all variants) and a plain `COMPONENT`. > > **On performance:** walking every variant instead of just one costs more time per call. If a set has many variants and the bridge times out, fall back to checking the default/rest variant first as a quick pass, but treat that as a reduced-coverage shortcut, not the standard — note explicitly in the report which variants were actually checked, and widen to the rest in follow-up calls rather than silently reporting a partial audit as complete.

---

## 3.4 GRID-mode nodes use different gap properties than HORIZONTAL/VERTICAL auto-layout

**This caused a confirmed false-positive incident**: `itemSpacing`/`counterAxisSpacing` are legacy properties that persist with stale, unbound, non-functional values once a node's `layoutMode` is switched to `"GRID"` (Figma's newer Grid-Beta auto-layout, distinct from `"HORIZONTAL"`/`"VERTICAL"` and from the unrelated "Layout Grid" guide feature). Reading them on a GRID node produces numbers that look raw and unbound — but they are inert leftovers with no UI control and no way to bind them, because GRID mode doesn't use them at all. The real, live, bindable gap properties on a GRID node are **`gridRowGap`** and **`gridColumnGap`**, bound via `boundVariables.gridRowGap` / `boundVariables.gridColumnGap`.

Every gap check must branch on `layoutMode` and never read `itemSpacing`/`counterAxisSpacing` when it is `"GRID"`. Both halves of that branch are in the engines: `scanner/audit.js` reads `gridRowGap` and `gridColumnGap` on a GRID node and `itemSpacing` (except `SPACE_BETWEEN`) on any other; a wrapping frame's cross-axis gap, `counterAxisSpacing`, is **not** in the scanner, and `FCA.wrapRowGaps(set)` in `scripts/probes.js` is the session probe for it — never on GRID, where it is the inert leftover this section is about.

**Verification rule this incident reinforces**: before reporting *any* gap finding, dump the node's full raw `boundVariables` object (unfiltered, not just the one key you expect) and check for a `gridRowGap`/`gridColumnGap` entry — their presence means the property you were about to flag is the wrong one, not that the value is unbound.

Findings must report the **full layer path from the set root** (walk `parent` up to the page) and the node id — a finding the maintainer cannot locate is functionally a false positive.

---

---

## 3.5 Structural checks — states, slots, overlay anatomy

These implement rules in `conventions-universal.md §4` that previously had **no detection script**, which meant a "deep" audit silently reported clean on categories it never examined. Run them alongside the token walk.

> Note: `instance.mainComponent` **throws** under dynamic-page document access. Use `await instance.getMainComponentAsync()`.

### 3.5a Every non-Rest state actually renders (highest-priority check)

A `Press`/`Hover` variant identical to `Rest` is a product bug and outranks any token or naming finding.

**Engine: `scanner/audit.js`**, the `states` rule. For each variant whose state is not the resting one (`TOKENS.stateAxis`, resting value `SCALES[stateAxis][0]`), it finds the resting sibling equal on every other axis and compares a signature of every layer: fills, strokes, visible effects, opacity and visibility, the root included but for its name. Identical is a candidate. The block this replaced looked first for a "state layer" overlay instance — one library's mechanism — and left the diff to the reader; the scanner runs the diff, which catches every mechanism at once.

**The confirming diff must include the variant root's visual properties — fills, strokes, effects and `opacity` — excluding only its name.** Measured 2026-08-13 on a live library, in three iterations on one run: a diff excluding the root entirely (over-applying §3.10e's exclude-the-root rule, which is about the *name*) reported 44 non-rendering states across 13 sets. Including root opacity cleared 28 (Disabled dims the root — the 1.7.7 lesson, which named opacity but not the rest); including root fills cleared 14 more (Hover/Press paint a 3%-alpha state token on the root or a `Content` frame — the second-commonest state mechanism in that library after opacity). The 2 survivors were genuine product bugs, confirmed by the sibling test: the same set's other binary-axis side rendered its states correctly. A diff that reaches the right verdict only after three corrections would have reported 42 false product bugs on the first pass — verify against a known-good sibling before believing any non-rendering hit. Also include, for nested `INSTANCE` children: the resolved main component id (via `getMainComponentAsync`) and `componentProperties`, since a state passed down to a swapped child is invisible to a name-and-visibility signature.

### 3.5b Slots and overlay anatomy

**Engine:** `FCA.anatomy(set, opts)` in `scripts/probes.js`. Per variant, its direct children: no native `SLOT` is a candidate; with `opts.slotName`, a slot named otherwise; with `opts.parts` (for example `["Header", "Footer"]`), each part missing. The names are the library's, read from a sibling that gets it right — never this file's.

> Compare against a sibling that gets it right before reporting — if one overlay in the file uses `Header / Content slot / Footer` and another doesn't, that contrast *is* the finding. If none of them do, the library may simply have a different anatomy, and the convention doesn't apply.

### 3.5c Collection source (binding leaks to the wrong library)

**Engine: `scanner/audit.js`**, the `tokens|off-library` rule. With `TOKENS.allowedKeys` — the collection keys discovery found (§0.5), as a list or as `FCA.discover()`'s `allowedKeys` object — every binding on every non-instance node is resolved to its collection, and one whose **key** is outside the set is a warning naming the field and the token. By key, because names are not unique across libraries; the `semantic` check beside it still matches fills by name, and the two answer different questions (which collection a project intends, and which library a binding came from). Without `allowedKeys` the check does not run. Not yet walked live: whether a library collection's key from `teamLibrary` equals the imported collection's `key` that the scanner reads is assumed, not measured — the first live run with `allowedKeys` set must control-pass on a known-good library before a hit is believed.

### 3.5d State coverage — expected states that don't exist

The inverse of 3.5a: 3.5a catches states that exist but don't render; this catches states the archetype needs that are missing entirely. `BASELINE` comes from discovery (the state sets this library's own components of the same archetype actually use) — never from a fixed table.

**Engine:** `FCA.stateCoverage(set, expected, opts)` in `scripts/probes.js` — the states in `expected` (this archetype's baseline from discovery) that the set's `opts.stateAxis` lacks, and whether it has `opts.disabledAxis`. The archetype is decided per component during scoping.

> A missing state is only a finding when the baseline actually contains it — if no component in the file has `Hover`, its absence is conformance (touch-first library), not a gap. Whether the audited component is a loading-capable control (and so should carry the library's loading state) is a judgment call — surface it, don't assume.

---

## 3.6 Metadata check — descriptions on the set and its properties

**Scanner:** `audit.js` raises `metadata|description` for an empty description, an `error` on a public set and `hygiene` on a private one (the `internalPrefix`), and `metadata|placeholder` for a placeholder — matching `descriptionPlaceholder`, repeating the set's name, or shorter than `minDescription` — as an `error`. Each setting absent skips its part.

**Probe:** `FCA.metadata(set)` in `scripts/probes.js` raises nothing; it lists every property with whether it carries a description, and the set's documentation links: which properties *need* one is judgement (text props and plain nouns rarely do; booleans and swaps with abstract names — Compact, Asset, Emphasis — usually do), so the probe lists and the agent decides.

> Stale descriptions (referencing removed variants or old names) can't be detected mechanically — during verification, skim the description against the current axis/property list and flag mismatches as `warning`. > > If `description` comes back `undefined` on **every** property, the running API version doesn't expose property descriptions — that's a limitation of the check, not a finding. Mark the criterion `Not checked`, per the universal-finding rule in the traps table.

---

## 3.7 Accessibility structural checks

These parameterize from discovery: `minTarget` / `minText` are the library's own discovered minima when it states them (findings tier `error`), or the WCAG reference values 24 / 12 when it doesn't (findings tier `review`). Contrast is always `review`.

**`minTarget`'s WCAG reference is 24, not 44 — a real near-miss, not a hypothetical one.** WCAG 2.2 SC 2.5.8 (Target Size Minimum, **AA**) sets 24×24 CSS px. 44×44 is SC 2.5.5 (Target Size Enhanced, **AAA** — also the common mobile-touch-target figure), a stricter, different criterion this skill has never claimed to enforce. Against a real desktop-pointer web library, checking 44 flagged nearly every interactive component in the file — buttons, icon buttons, checkboxes, switches — as a single, undifferentiated wall of findings, which is exactly the universal-finding signature §11 says to investigate rather than report. Checking 24 (matching the project's own WCAG 2.2 AA accessibility floor) found none of those, because they all genuinely clear it. Caught before reporting, not after — the snippet's placeholder carried the wrong figure until this fix, and the house settings' `minTarget` is 24.

### 3.7a Focus renders (ring diff, not overlay diff)

**Engine:** `FCA.focusRings(set, { stateAxis, focus, rest })` in `scripts/probes.js` — the project's words for all three, or it skips. Each Focus variant is matched to the Rest sibling equal on every other axis, and their stroke signatures — paints and the four per-side weights, to depth 4 — must differ. §3.5a's scanner rule leaves Focus to this one: a ring is a stroke, not a fill.

> Some libraries draw focus as a dedicated `Stroke`/ring *layer* visible only on the Focus variant — the signature diff catches that too (the layer's strokes appear in one signature and not the other). If the diff fires on every Focus variant in the *library*, suspect the check (house pattern), per the universal-finding rule.

### 3.7b Target size and text size

**Scanner, target size:** `audit.js` raises `accessibility|target` as a `review` for the variants under `minTarget` on either side, naming the smallest (figma-standard rule 26). Without `minTarget` in the settings it does not run.

**Probe, text size:** `FCA.textSizes(set, { minText })` in `scripts/probes.js` lists text below `minText` to depth 6, from the settings (the house defaults give WCAG's 12); without it nothing is measured against a guess. It iterates *variants* — a plain `COMPONENT` is measured itself; the prose block iterated `set.children`, which on a plain component is its layers, and so did §3.7a's.

> A visually small control can still meet the target via a larger invisible hit area — before reporting, check for a transparent hit-area frame around the shape (a common pattern), and skip components that are not interactive (a divider is allowed to be 1px tall). Disabled-state text is exempt from text-size and contrast minima.

### 3.7c Text-on-surface contrast (resolved values, every mode)

**Scanner, the mode on screen:** `audit.js` raises `accessibility|contrast` as an error for each text layer over an opaque surface inside the same component, in the mode each variant resolves to, the text's alpha blended over the surface, 4.5:1 or 3:1 for large text (24px, or 18.66px at weight 700), disabled variants exempt. It also feeds the Contrast measure and the score's Accessibility dimension. It is the one contrast engine: its luminance is `tools/shared/colour.js`'s, held to it character for character by `tools/shared/test-colour.mjs`. What one reading cannot see stays the agent's, as a `review`: every other mode, and a translucent surface (which the scanner does not judge).

> Report the pairing and the ratio — resolve the two bound variables to token names so the report says *which tokens* fail together. The fix usually belongs to the token, not the component; never "fix" contrast by unbinding or rebinding a semantic color. Semi-transparent overlay fills and blended alpha make the naive nearest-solid-ancestor model approximate — treat borderline ratios (within ~0.3 of the threshold) as "verify by eye", and skip disabled-state variants entirely.

**Check the other modes, not only the one resolved.** A paint's `color` is the value cached for the mode a variant resolves to, so the scanner checks that mode and is silent about the rest. The mode nobody has open is exactly the one that ships broken. For each other mode, resolve the pair's two bound variables in it with `FCA.resolveInMode` and take the ratio with `contrastRatio` from `tools/shared/colour.js` (node).

```js
// Enumerate the modes to iterate, then re-resolve each failing pair per mode.
const cols = await figma.variables.getLocalVariableCollectionsAsync();
return cols.map(c => ({ collection: c.name, key: c.key, modes: c.modes.map(m => m.name) }));
```

For each mode, resolve the two bound variables explicitly rather than re-reading the cached paint. **Engine:** `FCA.resolveInMode(varId, modeName)` in `scripts/probes.js` — one bound variable in one mode, following each alias **by mode name**, falling back to the first mode only where the target has no mode of that name; it returns the value with its alpha, or `undefined` for a missing variable or a chain that does not end within six hops. Its lookups are injectable, which is how the test proves the dark value is not the light one.

**Follow the alias by mode NAME, not to the target's first mode — measured, and getting this wrong is invisible.** A `VariableAlias` must be followed before it yields a colour: treating the alias object as one produces `NaN`, which passes every threshold and reports clean. But following it into `modes[0]` is worse, because it returns a real colour that is simply the wrong one. On a live library every sampled semantic token resolved its **Dark** value to the **Light** colour that way — `Colour/Text/Neutral/inverse` came back near-white in dark mode instead of near-black — so every dark-mode ratio was computed from light-mode colours and Light and Dark reported identical ratios. That reads as a theme-invariant token rather than as a broken resolver.

**The resolved value is rgba — never drop `a`.** Measured 2026-08-13: a soft-surface token resolving to its palette's near-black at low alpha was compared against an opaque near-black fill, returning ratio 1.0 for a pairing that renders at roughly 15:1. A translucent token must be alpha-composited over its actual backdrop before luminance is computed; where the backdrop is unknown, report the pair as verify-by-eye rather than computing a confident wrong number. This is the concrete, variable-resolution form of the semi-transparent caveat below.

Figma provides no mapping between one collection's modes and another's, so name matching is the available heuristic. Where a target collection has no mode of that name — a single-mode primitive collection, say — the first mode is correct, which is why the fallback stays. Report a failure as *token pair + mode*: the same pairing passing in one mode and failing in another is the finding, and a report naming only the pairing sends the maintainer to a component that looks correct on screen.

---

## 3.8 Text property coverage, and the overflow question

**One walk, both questions** — which text layers have no property (the gap), and which have one but cannot grow (the overflow risk). They were two sections until 2026-08-14, and splitting them is what hid a defect for as long as it did: the older §3.8 ended in `.filter(t => t.boundToProp)`, returning **only** layers that already had a property, so the population the conventions §7 rule is actually about was discarded before anything could look at it. A rule with no detector is not a check, and a check that discards the rule's subject is worse than none — it occupies the space where coverage appears to be.

**Engine:** `FCA.textCoverage(set)` in `scripts/probes.js` — one walk returning `missing` (a text layer with no `characters` property) and `overflow` (one with a property, `textAutoResize: NONE` and no `ENDING` truncation), each with variant, layer, id, character count and a 40-character sample. It stops at instances (that component's concern), excludes text inside a `SLOT` (ruling 2026-08-13: slot content needs no property), and handles a plain `COMPONENT` as itself. The prose carried this walk twice — the second block was the first one's `missing` half, under a comment saying the first still had the plain-component bug it did not have; they are one function now.

`overflow` surfaces *setup*, not behaviour. Turn each row into a question in the report ("what should `Label text` do at 40 characters?") rather than a verdict — truncate, wrap or grow is a design decision. `missing` is the gap check, and everything below governs it.

**Status of the `missing` half: walked, both directions, 2026-08-14 — promoted from candidate to check.** (`overflow` is inherited unchanged from the pre-merge §3.8 and carries no walk of its own.) Silent on five components that expose their text correctly, including `Button` across all 54 variants and the 7-variant `Text input`. Silent on `Avatar` *after* its `Initials text` property was added, having fired on it before — the same component answering both ways across one fix is the strongest fixture available, because it holds everything except the defect constant. The library sweep hit **7 of 71 sets (10%)**, which is the lumpy distribution a working check produces rather than the universal-finding signature §11 warns about.

**The sweep's own results are the best argument for the agent layer.** Four of the seven hits are cleared on sight by the static-by-design exception, and two of them are the exact examples this file already names: `Calendar`'s 28 weekday `Label` layers (`Mo`, `Tu`, …) and `_Label / Default`'s `Asterisk` (`*`), alongside two `Optional` markers. A scanner-only version of this check would have reported all four as defects and taught the maintainer to skim the rest. The remaining three — an upload status `Caption`, a chat disclaimer `Caption`, and an empty-state `Title` and `Message` pair — are genuine judgement calls that route to **Decide**, not to a batch fix.

**Still unexercised:** the `SLOT` exclusion. No component in that library holds text directly inside a slot in its main, so the branch ran but never had to suppress anything. It stays proven by the 2026-08-13 ruling that produced it, not by this walk.

**Variance is evidence, not the trigger.** The obvious implementation compares a layer's `characters` across variants and flags only what differs — and that check cannot fire on a one-variant component or on text held identical across a set, which is where missing properties actually collect. Measured 2026-08-14: a single-variant message card holding a lorem paragraph with no property passed a full clean audit, and was caught only when a human went to write its description. Rank by `chars` and by whether the string reads like content, but do not gate on variance.

What this deliberately does **not** flag, each cleared by the agent rather than assumed by the scanner:

- **Text inside a `SLOT`** — replaced wholesale by the consumer (ruling 2026-08-13, conventions §7).
- **Text owned by a nested `INSTANCE`** — the nested component's concern; the walk stops at instances.
- **Static by design** — a value naming a fixed thing rather than carrying supplied content: weekday headings in a calendar, a mandatory-field asterisk, a currency symbol. A property here invites changing a value that has no business changing.
- **Written by code at runtime** — a live readout such as `Uploading - 64%`, which no one types in Figma. **Rarer than it looks**; confirm rather than assume from the wording.

The separating question is **whether a consumer would ever legitimately set this string**, not whether it happens to vary today. A filename, a caption, a heading, a message, a person's initials: findings. `Mo Tu We Th Fr Sa Su`: not. Both exceptions are a minority, and an exclusion reached for freely swallows the findings the check exists to produce.

---

## 3.8b Page organisation — category and page ordering

**Moved to `figma-foundations-audit` on 2026-09-10** (its foundations scanner, figma-standard rule 11). This skill no longer checks page order and holds no walk for it; the heading stays so older cases that cite §3.8b still resolve. The lessons that section carried travelled with the check: compare with `localeCompare` and `sensitivity: "base"`, never `<`; furniture (cover, dividers) is excluded, not sorted; a category the project pins last is a setting (`pinnedLast`), not a violation; a page move is a safe, visible fix.

## 3.8c Naming case — splits, and conformance to the recorded convention

**The collision half moved to `figma-foundations-audit` on 2026-09-10**: whether two names in one name space differ only in case (figma-standard rule 19) is that skill's check, filed under its name. What stays here is the second question — conformance to the recorded case convention (figma-standard rule 18), which needs the project's carve-outs judged and is a session check. The script below classifies every name space for the convention half only, and reports no collision.

Two questions that look like one. **Whether a name space contains two names differing only in case** is preference-free and decidable here: it is **figma-standard rule 19**, it holds whatever convention a project picked, and for an exported name it is always a defect, because every export path lowercases and the two collapse into one token. **Which case the project uses** is a convention, and this skill does not know it and must not state it. Read it from the active project's context document (§3, language and naming); where the document is silent, cite **figma-standard rule 18** by handle and apply it as the default. Never restate that rule's text here or in a report — a copy freezes at the date it was written and, because a project document outranks house defaults, silently overrides the rule it copied.

So the engine **classifies and never judges**. It returns the case shape of every segment and the minority members of each name space; the agent compares that against the hydrated convention and decides. Clause G's boundary in its usual place: the engine says what follows from the data, the agent says what the project wants.

**Engine:** `FCA.nameSpaces()` in `scripts/probes.js` gathers the name spaces — one per local variable collection, the text styles, the effect styles, and the components — and hands them to `FCA.classifyNameSpaces(spaces)` (tested), which returns per space the **minorities** (figma-standard rule 18's evidence: case shapes outnumbered at the same depth, with the majority's count and up to eight examples). `FCA.caseShape` classifies a segment as `lower`, `initial-cap`, `upper`, `camel-inner` or `mixed`, and a segment not starting with a letter as nothing. Moving it found one defect: the prose tested `camel-inner` before `upper`, and every acronym (`AI`, `WCAG`) matches the camel pattern, so `upper` — which its own comment named for exactly those — could never be returned.

**Walked 2026-08-20 against a live 19-page library, and the control pass is the reason this check is usable.** Run against the corrected library it should have been silent, and it fired four times — which is a finding about the check, per toolkit-standard §D 18, not about the file. Two were bugs and both are fixed in the engine:

- **Segments with a leading digit were classified as `mixed`.** `Palette/Blue/9-source` has letters, so it escaped the non-alpha guard and became evidence of a case convention it cannot have. `Utils/white` and its two siblings were then reported as the minority against eight `N-source` leaves, all four correct. A segment that does not start with a letter is now excluded rather than classified.
- **All non-leaf segments were pooled.** In `Heading/md-medium/size` the group is capitalised and the size is not, both correctly, and pooling them reported 54 lowercase against 54 capitalised in one collection — the convention flagged as its own violation. Bucketing by depth fixed it. Worth naming because the first draft claimed to have fixed exactly this by splitting leaf from the rest, and had only moved it one level in.

After both fixes: silent across all five variable collections and both style types. The two surviving hits on components were correct, and were the two shapes this check then told apart — **one real split** (a `switch` graphic beside the `Switch` component set, two components differing only in case; since 2.35.0 that half is figma-foundations-audit's alone) and **one legitimate minority** (20 lowercase icon and graphic names against 22 capitalised components, which is the imported-asset carve-out).

- **A minority is a candidate, never a finding.** Asset names imported from an icon set sit in the minority permanently and legitimately, and `Elevation/Raised` is a capitalised leaf that figma-standard rule 18 carries as an explicit allowlist. Check the context document's carve-outs before reporting one.
- **A split in an *exported* name space — variables, styles — is a defect every time**, needing no convention to interpret: the two names become one token downstream. figma-standard rule 19's evidence is a project that carried such a split across several library versions with nothing measuring it.
- **A split among *component* names is advisory**, not a figma-standard rule 19 violation: components are not exported as tokens, so nothing collapses. It is still worth reporting, because a picker search returns both and a code-gen mapping cannot tell them apart.
- **Report the majority count beside the minority.** A maintainer deciding whether five is a defect or a carve-out needs to see that the majority is 268; a finding naming only the five invites the wrong call.

## 3.9 Detached-frame candidates (real instances, not copies)

Scan non-canonical pages for frames whose names collide with real component names. **Confirmed false-positive trap**: "non-canonical" is not just "doesn't start with the usual marker" — a library may use other prefixes for in-progress or grouped work (one file marks WIP component pages with a status marker). Treating an unfamiliar prefix as automatically non-canonical produces a wall of false positives from that page's own internal substructure. Read the full set of component-bearing page prefixes from `componentPages` (or, where it is `[TBD]`, ask, or note every prefix seen among pages that contain `COMPONENT_SET`/`COMPONENT` nodes) rather than hardcoding one. Exclude the pages `exemptPages` names outright — a cover is decorative, not a product surface, and any name collision there is exempt.

**Engine:** `FCA.detachedScan(exemptPages)` in `scripts/probes.js`. Pass one loads every page and collects the names of top-level components (parent a page, section or frame) and the prefixes of pages that hold them; pass two loads each candidate page (`FCA.isCandidatePage`: not among the `exemptPages` the settings name — none by default — and not sharing a component page's prefix) and returns each frame or group named like a component (`FCA.detachedSuspects`). The prose block read a page's children **before** `loadAsync`, which under dynamic-page access sees an unloaded page as empty; the engine loads first.

Candidates only — judgment-protocol §4 confirms each: check the ancestry chain (`node.parent` walked up) for a `COMPONENT_SET`/`COMPONENT` ancestor before treating a name collision as a real detached duplicate. A frame that's internal substructure of a *different* legitimate component (reusing a common name like "Divider" for its own sub-part) is not a finding.

## 3.10 Hidden / orphan layers

**Engine: `scanner/audit.js`**, the `structure|hidden` rule — a layer with `visible: false` and no `visible` property reference, every variant, never inside an instance.

## 3.10a Disabled paints, strokes and effects (hygiene)

A paint toggled off in the panel stays in the array with its own `visible: false`. Distinct from 3.10, which finds hidden *nodes*; this finds dead *style entries* on visible nodes.

**Engine:** `FCA.disabledPaints(set)` in `scripts/probes.js` — each `fills`, `strokes` or `effects` entry with `visible: false`, by variant, layer, property and index, never inside an instance.

`Array.isArray` is not optional, and this is measured rather than reasoned: on a probe with per-character fills, the same walk without the guard **threw and returned `[]`**, losing the disabled fill it would otherwise have reported. The throw itself surfaces as a failed `figma_execute` — the danger is that this walk is batched per page group, so one failed batch returns nothing while the rest succeed, and an audit that does not check every call presents the union of the survivors as complete.

## 3.10b No GROUP nodes inside components

**Engine: `scanner/audit.js`**, the `structure|group` rule — every `GROUP` node in every variant, never inside an instance.

`BOOLEAN_OPERATION` nodes report as their own type, not `GROUP`, and are legitimate inside icons — do not widen this to "any non-frame container". **Walked 2026-08-08, three directions:** silent across 55 real components (the type census contained no `GROUP` at all), fires on a probe containing one, and correctly ignores a probe whose only container is a `BOOLEAN_OPERATION`.

## 3.10c Unused component properties

A property no layer references. Walked against a real 54-variant set on 2026-08-08 and returned `[]`, correctly.

**Engine: `scanner/audit.js`**, the `properties|unused` rule — every reference in every variant collected, and each definition that is neither `VARIANT` nor `SLOT` and that no layer references reported as an `error` naming its consequence.

**The trap this walk exists to avoid, now confirmed against a real file.** Variant axes appear in `componentPropertyDefinitions` and are never referenced by any layer, because Figma resolves them at the set level. On the control run the same walk *without* the `type !== "VARIANT"` filter returned `["Size", "Role", "Disabled", "State"]` — every axis of a component the maintainer considers correct, and by extension every axis of every set in the library. Conventions §11 calls a finding on everything evidence the check is wrong; this is the check that would have produced it. Filter before comparing.

**A second, structurally identical trap, found on a real file 2026-08-10: `SLOT` properties fail the same way, for the same reason.** A `SLOT` node is filled by whatever a consumer places inside it — nothing in the surrounding tree carries a `componentPropertyReferences` entry pointing back at the slot property, because there is no *layer* to reference it, only the slot's own presence. A two-variant set with a genuinely conditional `Menu slot` (a `SLOT` node correctly present only on the variant where it should show, absent on the other) flagged `unused` under the pre-fix filter — confirmed by direct inspection: the `SLOT` node existed exactly where expected, conditionally, correctly built. `type !== "VARIANT"` alone was never enough; the filter needed both exclusions from the start, and shipped with only one for several versions before this file's own audit caught it on a real set.

**`unused` is an `error`, and the consequence is the whole component.** Figma **ignores the component at publication** when it declares a property applied to no layer — maintainer-confirmed 2026-08-08 and reproduced live. Not a dropped property: consumers never receive the component at all, while the publish reports success. Figma flags it with a warning icon in the properties panel, visible only to someone already inside the file. Report it with that consequence stated — "this component will not publish" is the sentence that gets it fixed; "unused property" is the one that gets it deferred.

**A second check lived here until 1.6.2 and should never have been written.** It compared each variant's exposed properties against the union across the set, reporting any variant "missing" one — a rule nobody had asked for, invented from a misreading of the requirement above. The real requirement was always the one this check now implements: a property applied to *no layer at all*. On the known-good Button the invented check flagged **54 of 54 variants**, and every flag was correct design: 30 expose a 20px icon swap, 15 expose the 16px one because they are the small size, and 9 expose nothing because `State=Loading` shows a spinner. Properties are **conditional on an axis value** — the sparse-grid principle applied to properties rather than variants.

It is not salvageable as a script. Telling *conditional-by-design* from *lost-in-a-rename* requires knowing which axes govern content — `Size` and `State` do on Button, `Role` does not — and that is judgement. Do not reintroduce it.

## 3.10cc A layer wired in some variants and not in others

**The mirror image of 3.10c, and the one it cannot see.** 3.10c asks whether a
declared property is used; it collects every reference in the set into one set
of keys, so a property is "used" the moment a *single* layer anywhere points at
it. A component set can therefore declare `Label text`, have one variant wire
its label to it, and leave the other hundred labels hard-coded — and this file
reports the set clean, because the property is used, every text node has a
style, every font field is bound and nothing is a raw value. Nothing is wrong
with any one layer. What is wrong is that its twins disagree.

Read the other direction. Within one set, for each layer, for each of the three
reference kinds (`characters`, `mainComponent`, `visible`): count the variants
where it carries a reference and the variants where it does not. Report only
when **both** are non-empty. That guard is what makes the check quiet enough to
run:

- a layer no variant wires — a spinner, a static caption, a divider — is
  `off`-only and never fires, so the file's deliberate static content is not
  swept up;
- a layer every variant wires is `on`-only and never fires;
- a layer that exists in only some variants is counted only where it exists, so
  an error message present under `Validation=Error` alone is not a finding.

**Key by PATH, never by name.** This is the whole check, and keying by name
failed on the first live sweep: one variant of a text field holds four layers
called `Label` — the label part's instance, the text inside it, the field's
static placeholder and the error message's text — and a name key collapsed all
four into one 9-on/9-off finding, on three different components, every one of
them wrong. The path below the variant root is what a twin shares across
variants; the root's own name is left out, because it *is* the variant name.

**Give same-named siblings an ordinal.** A dialog footer holds two layers both
called `Button`: the primary, always visible, and the secondary, wired to a
boolean. They share a path, so the path alone reads them as one layer wired in
half its variants — the second false positive of that same sweep. `Button` and
`Button[2]` tell present twins apart rather than dropping the path and losing
the coverage.

With both refinements the sweep over an 88-set library went from four findings,
all false, to one, which was real and which a maintainer had to find by eye.

**A path is where a layer sits, not what it is.** The ordinal assumed child
order is stable across a set's variants, and it is — but the *set* of children
is not, and when one is missing the same path names a different layer. Five
rows on one 120-set library, all false, in two shapes. A Button's `Loading`
variants hold one `Icon container` in `Content` — the spinner, correctly wired
to nothing — where every other variant holds the left icon, a label and the
right icon; the path named the spinner in 18 variants and the left icon in 90,
and the row read "wired to nothing in 18". An input whose leading icon exists
only when it has a value made `Field > Icon container` the chevron in the empty
variants and the leading icon in the filled ones. The tell was in the data: the
unwired variants fell exactly on one axis value, which is a design's signature.
So a layer is keyed by its path *and* what it is — its type, and for an
instance the names of what it holds — and, for the `visible` kind only, whether
it is its parent's only child: a boolean cannot hide the only child of a
container without emptying it, so an icon that stands alone in `Icon only`
variants and beside a label elsewhere is two slots. That last is a class, not
an exemption: a wrapper's only child wired in six variants and forgotten in
four still fires, as `tests/test-audit.mjs` shows. The genuine finding that
motivated the check — a label whose text reference was lost at two sizes — is
the same layer in every variant and still fires with the same counts.

*Why it exists:* a `Button` drawn at three sizes was merged into one set, and
the three `Label text` properties collapsed into one. The `md` and `sm` labels
lost their `characters` reference in the merge — 36 of 108 still bound, 72 wired
to nothing — and every check in this file passed over it. The maintainer found
it by eye and said so. A defect class that survives a scan is only a defect
class until someone writes the check; after that it is a line of output.

## 3.10d Instances whose main component is gone

**Engine:** `FCA.orphans(set)` in `scripts/probes.js` (tested with stand-in nodes). Per instance, via `getMainComponentAsync()`: no main is an orphan; a main with a parent is healthy; a parentless main with no key is a local main detached from the document; a parentless main **with** a key is verified with `figma.importComponentByKeyAsync`, once per key with one retry, and only a failure on both tries is reported. It never descends into an instance.

**Walked 2026-08-08, both directions, and the original rule was wrong.** `!main` alone never fires: removing a main component leaves `getMainComponentAsync()` still returning it, with `removed === false` and still findable by id. What changes is that it loses its parent. So the test became `!main || !main.parent`.

**That fix was itself wrong, found on a real audit 2026-08-10 and confirmed by hand against the maintainer's correction.** `!main.parent` is not proof of orphaning — it is also exactly what a **perfectly healthy remote component** looks like when its own source file is not connected in the current bridge session: the plugin has no local visibility into that file's page tree, so the parent chain reads as null regardless of whether the component is fine. Four instances of a remote icon library — the icon and its default swap value, used across several sets — were all flagged this way. Every one resolved cleanly via `figma.importComponentByKeyAsync(main.key)` on the first correctly-isolated retry, proving they were never broken. The maintainer caught it by direct knowledge of the source file, not by any report signal.

This also means the 1.7.4 validation — "37 of 40 real instances were remote and none was flagged, because a remote main keeps its parent" — was true only because that session's remote source file happened to be connected too, giving the plugin local visibility it normally would not have. The measurement was real; the generalisation drawn from it was not, and nothing before this walk had a fixture where the source file was disconnected. **The corrected rule gates on `main.key`:** absent a key, `!main.parent` alone is trustworthy (the original, narrower case this check was built for). Present a key, a null parent means only "not verified yet" — resolve it live before deciding. A resolution failure is itself not instant proof either: three back-to-back `importComponentByKeyAsync` calls timed out in the same session that then had every one of them succeed on an isolated retry, most likely a rate-limit or bridge-saturation artefact rather than a broken component. Retry once, isolated, before reporting a remote key as failed.

## 3.10f Text nodes with a fixed height

Text that cannot grow clips instead of reflowing. The scanner finds fixed-height text; the agent clears the four legitimate exceptions in conventions §7.

**Engine:** `FCA.fixedText(set)` in `scripts/probes.js` — a text node with `textAutoResize: NONE`, not `FILL` vertically, and not truncating (`ENDING` or a `maxLines`), reported with its resize mode, vertical sizing, whether its parent is auto-layout, height and character count. Never inside an instance.

Four things this deliberately does **not** flag, each of which would otherwise fire across a whole library:

- `textAutoResize: "TRUNCATE"`, `textTruncation: "ENDING"` or a `maxLines` value — clipping is the intended behaviour, and reporting it proposes breaking a designed truncation.
- `layoutSizingVertical: "FILL"` — the text is stretching by instruction, not stuck.
- `layoutSizingVertical` on a node with no auto-layout parent, where the property is meaningless — it reports `FIXED` regardless. **This exclusion was documented and not implemented until 1.7.2**, and a probe caught it: a text node with `textAutoResize: "HEIGHT"` inside a plain frame was flagged, because the check ORed the two properties instead of gating the second on the parent. Reading both is not enough; the read of `layoutSizingVertical` has to be conditional. A genuinely fixed-height node in a plain frame still flags — verified separately, so the fix does not silence the real case.
- **`layoutSizingVertical: "FIXED"` under a genuine auto-layout parent, when `textAutoResize` is `HEIGHT` or `WIDTH_AND_HEIGHT`.** Found on a real file 2026-08-10, not reasoned about: 33 instances of one layer (`Value`, inside `Menu button`) were flagged, every one a false positive. The node's own `textAutoResize` read `WIDTH_AND_HEIGHT` — it hugs both dimensions and cannot clip, full stop — while `layoutSizingVertical` still reported `FIXED` even though the parent genuinely was auto-layout. The 1.7.2 fix gated `layoutSizingVertical` on the parent existing; this shows the gate isn't sufficient, because the property can lie even when its precondition holds. **The fix is not a third gate — it's removing `layoutSizingVertical` from the positive determination of "fixed" entirely.** It is reported alongside each finding for context, never used to decide one. 33 hits on one layer is also the universal-finding signature (§11): every variant of one component flagging identically is a check bug, not 33 defects.

**Report the character count with each hit.** A fixed-height node holding 4 characters is a numeric badge; one holding 60 is a description waiting to clip, and the agent needs that to rank them. Do not report the height alone — it says nothing about how close to overflowing the node already is.

## 3.10e Variant axes that only toggle visibility

Candidate-only. Compares each pair of variants differing on exactly one axis; if the sole structural difference is one subtree's `visible`, the axis is doing a boolean's job.

**Engine:** `FCA.visibilityAxes(set)` in `scripts/probes.js` (tested). For every pair of variants differing on exactly one axis it compares a signature of path, name, type and visibility for every layer below the variant root, to depth 6, never inside an instance. An axis is a suspect only when **every** such pair on it differs in visibility alone. The paragraph below said so and the prose's code reported an axis on any one matching pair; the engine does what the paragraph says.

The signature deliberately excludes fills, sizes and text content — two variants differing in colour will not match, which is correct. Report an axis only when **every** compared pair on it shows visibility-only differences; one matching pair proves nothing.

**This check could not fire at all until 1.7.3, and a clean result from it meant nothing.** The signature included the variant root, whose name is literally `Axis=Value` — so every pair differed on the root's name, every pair was disqualified, and the check returned an empty list for any component set ever passed to it. Run against a real 54-variant Button it reported nothing across 207 pairs, which read exactly like a pass. It was found by probing the positive direction: a purpose-built two-variant set differing *only* in one rectangle's visibility also reported nothing, which nothing about a real-library run would have revealed. A check that cannot report is worse than a missing one, because it occupies the space where coverage appears to be.

## 3.11 Variant annotations

Not a `figma_execute` script — annotations are read via the dedicated MCP tools (`figma_get_annotations`, `figma_get_annotation_categories`), not the plugin API's node walk. Check presence per state-bearing variant; judgment-protocol §4 decides whether absence is a real gap (spec detail with nowhere else to live) or correctly empty (purely visual variant).

## 4. Fixes

Apply only after the user approves. Re-run the matching detection afterwards to confirm.

### 4a. Bind a raw spacing/radius to a primitive token

**Engine:** `FCA.fix.bindVariable(nodeId, field, source)` in `scripts/probes.js` — `source` is a variable id, or `{ sibling: nodeId }` to copy the binding a correctly bound sibling carries on the same field. It binds, re-reads the node fresh and returns the variable names now bound there.

> Remote tokens often aren't in `getLocalVariablesAsync`. The reliable path is to **copy the binding id from a sibling layer that is already bound correctly** (read `sibling.boundVariables.itemSpacing.id`, then `figma.variables.getVariableByIdAsync(id)` → `setBoundVariable`). Prefer matching an existing correct example over guessing a token.

### 4a-2. Rebind a fill/stroke color variable

`setBoundVariable` on the node directly **fails** for `fills`/`strokes` (Figma's API requires paint-level binding: `Error: in setBoundVariable: fills and strokes variable bindings must be set on paints directly`). Paints need their own API.

**Engine:** `FCA.fix.bindPaint(nodeId, "fills" | "strokes", source, index)` in `scripts/probes.js` — the same `source` forms; it binds the paint at `index` (default 0) with `setBoundVariableForPaint`, reassigns the array, and returns the names now bound. Only that paint changes: the prose assigned `[newPaint]`, which dropped every other paint on the node.

**Verify after writing** — both fixes read the node back fresh (`getNodeByIdAsync` again, not the same in-memory reference) and return the bound variable's name; confirm it is the token you intended rather than trusting the write call's success.

### 4b. Reorder variant options (e.g. boolean axes to `False, True`, or `State` to canonical order)

Option order is derived from the order of child components, and is **not exposed as a writable field**: calling `set.editComponentProperty("State", { variantOptions: [...] })` throws `Unrecognized key(s) in object: 'variantOptions'`. There is no reliable plugin-API path to rewrite option order directly. **This is always a manual fix**: tell the user to drag the options into place in Figma's Variants panel. Don't attempt to reinsert child components to force an order — it's fiddly, easy to scramble instance overrides, and there's no clean programmatic path around the API limitation above.

### 4b-2. Add a component property, and bind a layer to it

Adding a property is **additive and non-breaking** — existing instances keep working and simply gain a control — which makes it the one interface change that can sit in *Approve & I fix* rather than *Breaking*. Two steps: declare it on the set, then point the layer at the returned key.

**Engine:** `FCA.fix.addProperty(setId, name, type, layerIds, defaultValue)` in `scripts/probes.js` — declares the property, takes the **key** it returns (`name#id`; the name alone will not bind), and sets the matching reference (`characters`, `visible` or `mainComponent`) on every listed layer, merged into what each already carries. For `INSTANCE_SWAP` with no default it uses the first listed instance's main **node id**. It re-reads each layer and returns how many are bound and which are not.

**Spread the existing references, never replace them.** A layer can carry `visible`, `characters` and `mainComponent` at once; assigning a fresh object silently drops whichever ones you left out, and nothing errors.

**A layer inside a nested instance cannot be bound.** Setting a property reference on a sublayer of an instance throws `Cannot set component property references on instance sublayer`: put the content in a slot (figma-standard rule 38): exposing the nested component's properties on the parent does not keep a per-item value when the item switches variant. Tested 2026-10-08.

**A component cloned into another set loses its property references.** Cloning a component into a different component set drops every `componentPropertyReferences`; re-wire from the source by layer path, and verify with a diff that includes the references, since one without them reads the clone as identical. Tested 2026-10-08.

**The `INSTANCE_SWAP` default is a node id.** Passing `main.key` — the obvious guess, and the value every other API in this file wants — throws `Property value is incompatible with component property type`, which names the type and not the field, so it reads as though the property type were wrong. Found 2026-08-14 by reading what a working sibling actually stored (`"0:6907"`, plainly a node id) rather than by reasoning about the error. Bind the layer for **every** variant the property applies to, not just the one you read the default from, then re-read the set and confirm each variant's `componentPropertyReferences` — a partially-bound property is not a publication blocker the way an unused one is (§3.10c), so nothing will tell you.

### 4c. Rename a layer

Rename the layer in every variant of the set, never in one: overrides survive a rename on update, but a layer named differently across variants loses them when a consumer switches.

```js
const set = await figma.getNodeByIdAsync("SET_ID");
const renamed = [];
for (const v of set.children) for (const n of v.findAll((x) => x.name === "OLD_NAME")) { n.name = "Helper text"; renamed.push(n.id); }
return { renamed: renamed.length, variants: set.children.length };
```

### 4d. Rename a property

```js
// Renaming an OPTION value:
const set = await figma.getNodeByIdAsync("SET_ID");
// editComponentProperty exists on COMPONENT_SET for VARIANT props; for non-variant props use the same API.
// Renaming a PROPERTY (not an option) changes the component API → breaking. Confirm first.
set.editComponentProperty("Value", { name: "Value text" });
return "renamed";
```

> Renaming a variant **property** or **option** keeps every instance on its variant with its overrides — tested 2026-10-01 — but it is a breaking **API** change: Code Connect enum mappings keyed on the old value stop matching without failing the publish, and scripts and Swap library match by name. Always surface it as such and get explicit approval. Renaming a layer (4c) is safe only when every variant's layer gets the same new name: a name that differs across variants drops consumers' overrides when they switch variant.

### 4e. A missing or placeholder description

**This audit flags it; it does not write it.** `figma-component-descriptions`
owns writing a description — the full structured form for a public component,
the compact one for a private one — along with the dialect it infers from the
library and the slot-only resolution protocol that decides what a part's
description should even say. A recipe here would be a second, shorter answer
to the same question, drifting from the one that knows those things, and
`figma-component-pass` exists precisely to run the two in order.

So the row this audit files is the finding, and the fix is a hand-off: report
the component, say what is missing, and name the skill that writes it. The
check itself (what counts as missing, what counts as a placeholder) stays in
`checks.json` where the rest of this audit's rows live.

---

## 5. Whole-library sweep (schema only)

For a fast file-wide pass, run the probe's schema checks (single-option axes, state vocabulary) and its default-swap-name check across all sets without the deep token walk (the token walk is too heavy to run on every set in a file at once — a library of even a few dozen sets can time out the bridge in one call). Iterate pages in batches, collecting axis/property findings, then deep-token-check only the components that the user wants fixed.

**Engine:** `FCA.sweepSchema(componentPages, opts)` in `scripts/probes.js` — every component set on the project's component pages through `FCA.schemaFindings` and `FCA.propertyNamingFindings`, the same two functions §1 and §2 call, so the sweep cannot drift from them. Axis order, default-first and a property name's case are the scanner's, not the sweep's: run the scanner for those. The prose version read `TOK.componentPages`, which exists only inside `scanner/audit.js`; pasted on its own it threw a `ReferenceError` before reading a page. §0 had the same reference.

---

## 6. Output contract

No aggregation, no matrix, no score. The scanner emits per-batch: a coverage line (pages, sets, variants, nodes walked — so the agent can state honestly what was scanned) and the raw candidate list tagged by rule, node id, and value. Everything else — verification, suppression via accepted exceptions, bucketing into the fix queue — happens in the judgment layer. If a batch returns zero candidates, verify the walk actually visited nodes (return node/binding counts) before treating silence as clean.

---

## Coverage and the porting backlog — see `scanner/checks.json`

**Do not restate the backlog here.** `scanner/checks.json` is the catalogue: every
check, its dimension, its tier, who raises it, and a `status` that is the single
statement of whether it runs —

- `scanner` — implemented in `scanner/audit.js`. Runs identically from a session
  and from the dashboard.
- `session` — agent-layer. Only a full session run originates it, because the
  dashboard's judgement pass *filters* scanner candidates and never raises its
  own.
- `backlog` — documented, implemented nowhere. Does not run unless a run writes
  it by hand.

The split is derived, not restated — a hardcoded one said `14 / 8 / 20 / 3` of
45 for as long as it stood, and a `scanner` check had been added under it
without anyone touching the one sentence in this repo that states coverage.
This is the file whose job is to not overstate coverage, so it prints the
figure instead of remembering it:

```sh
python3 -c "import json,collections;d=json.load(open('skills/figma-components-audit/scanner/checks.json'));\
w=lambda o:[o['status']] if isinstance(o,dict) and isinstance(o.get('status'),str) else \
[x for v in (o.values() if isinstance(o,dict) else o if isinstance(o,list) else []) for x in w(v)];\
c=collections.Counter(w(d));print(dict(c),'total',sum(c.values()))"
```

The two file-level checks belong to `figma-foundations-audit` and are not in
here. The dashboard's About tab renders this file, marking anything that is
not `scanner`, so the page cannot claim coverage the scanner does not have.

A backlog entry closes by porting the check into `scanner/audit.js`, flipping its
`status`, and confirming it against **two** libraries — one library cannot tell a
real check from that library's own constant (case A57). Contrast (§3.7c) ranks
first: it is the only missing check that is user-visible by definition.

This file stays the place that explains *why* each check exists and what it must
not claim. It is prose about an executable, and holds no second copy of it.
