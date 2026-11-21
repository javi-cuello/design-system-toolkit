# Scanner checks — the deterministic layer

**This file documents `scanner/audit.js` and `scripts/probes.js`. It is not a second implementation of either, and nothing here runs**. Read it for *why* a check exists, what failure it was written for, and what it must not claim. Then change the check in `scanner/audit.js`, and update its entry here in the same commit.

## Contents

- [The two engines](#the-two-engines)
- [Traps: read before writing or trusting a check](#traps-read-before-writing-or-trusting-a-check)
- [Adding a check — the four things, none optional](#adding-a-check--the-four-things-none-optional)
- [0. Locate](#0-locate-a-component-set-by-page-name) and [0.5 Discovery](#05-discovery--establish-this-files-own-vocabulary-before-checking-anything)
- [1. Variant schema](#1-variant-schema-check) and [2. Property naming](#2-property-naming-check)
- [3. Token binding](#3-token-binding-check-the-core-check), [3.4 GRID gaps](#34-grid-mode-nodes-use-different-gap-properties-than-horizontalvertical-auto-layout)
- [3.5 States, slots, collection source, coverage](#35-structural-checks--states-slots-overlay-anatomy)
- [3.6 Metadata](#36-metadata-check--descriptions-on-the-set-and-its-properties) and [3.7 Accessibility](#37-accessibility-structural-checks)
- [3.8 Text properties](#38-text-property-coverage-and-the-overflow-question), [3.8b](#38b-page-organisation--category-and-page-ordering), [3.8c Naming case](#38c-naming-case--splits-and-conformance-to-the-recorded-convention)
- [3.9 Detached frames](#39-detached-frame-candidates-real-instances-not-copies)
- [3.10 Hidden, disabled, grouped, unused, orphaned, fixed and visibility-only](#310-hidden--orphan-layers)
- [3.11 Annotations](#311-variant-annotations), [3.12 Right to left](#312-right-to-left-opt-in-figma-standard-rule-50), [3.13 Composed frame](#313-a-composed-frame-library-instances-and-bound-values-only)
- [4. Fixes](#4-fixes), [5. Sweep](#5-whole-library-sweep-schema-only), [6. Output contract](#6-output-contract)
- [Coverage and the porting backlog](#coverage-and-the-porting-backlog--see-scannerchecksjson)

## The two engines

| Engine | What it is | Who runs it |
|---|---|---|
| `scanner/audit.js` | The audit | A session, and the dashboard too. So an audit gives the same result whoever launched it. |
| `scripts/probes.js` | The session's other deterministic work, as `FCA.*` functions | A session only, loaded once per file ([scan-and-probes.md](scan-and-probes.md), *Loading the probes*). Nothing in it feeds the dashboard. |

`scripts/probes.js` holds discovery, the checks still at `backlog` or `session` in `scanner/checks.json`, and the fix recipes. A probe runs only when a session calls it. It is not in the scanner until it is ported; the backlog lives in `scanner/checks.json` ([the last section](#coverage-and-the-porting-backlog--see-scannerchecksjson)).

Each section below names its engine: a rule in `scanner/audit.js` or an `FCA.*` function. Each answers a yes-or-no question in [conventions-universal.md](conventions-universal.md). Each is parameterised by the active library's rulebook (scales, collection keys, spelling, state vocabulary, baselines), never hard-coded. If the rulebook is not resolved for this file yet, run discovery first ([judgment-protocol.md](judgment-protocol.md) §1).

**Scanner output is candidates, not findings**. Every result goes through [judgment-protocol.md](judgment-protocol.md) §2 (verification) before it reaches the user. Anything matching an accepted exception in the rulebook is suppressed there. Scripts are time-boxed and depth-limited: batch by page group (about 100–150 variants per call), with `timeout` 20000–30000.

General API notes:

- Use the async API variants (`getLocalVariableCollectionsAsync`, `getVariableByIdAsync`). The sync variants throw under dynamic-page document access.
- Call `await page.loadAsync()` before `findAllWithCriteria`.
- A bound value reports its variable id in `node.boundVariables[key]`. For a non-zero, non-default visual property, absence of that key is the signal for "raw value".

## Traps: read before writing or trusting a check

Every trap below caused a false positive, or a silent miss, severe enough to make an audit untrustworthy.

**Gap means three properties, not one**. `itemSpacing` is only the primary-axis gap. Wrapping auto-layouts also carry `counterAxisSpacing`, the cross-axis row gap. GRID auto-layout (`layoutMode: "GRID"`) has its own gap properties. A walker reading only `itemSpacing` passes every unbound wrap or grid gap; this shipped a false "fully clean" pass on calendar-style grids.

| Layout | Gap properties to check |
|---|---|
| Flow auto-layout | `itemSpacing` |
| Flow, `layoutWrap === "WRAP"` | `itemSpacing` and `counterAxisSpacing` |
| GRID | **Only** `gridRowGap` and `gridColumnGap`. The flow properties are inert leftovers (§3.4). |

In reports, label GRID findings "grid row-gap" and "grid column-gap". Tell the maintainer they live in the **Grid layout** panel section, not the flow auto-layout gap field.

| Trap | Reality |
|---|---|
| Reading `strokeWeight` | A shorthand that carries no binding. Read the four per-side `stroke*Weight` properties. |
| `paint.opacity < 1` on a bound paint | Figma caches the token's resolved alpha onto the paint. It is not an override. Compare against `resolveForConsumer` if you must check. |
| A scale from `collection.variableIds` | Only imported variables. Use `figma.teamLibrary.getVariablesInLibraryCollectionAsync`. |
| A role from the node type (`VECTOR` means Icon) | Wrong constantly. Only text node to text role is safe. |
| An instance's layer name as what it is | Layers are renamed freely ("Forward" holding a chevron-down). Read the main component's name, and its variant's in a set. Fall back to the layer name only when those say nothing. The first right-to-left run flagged 8 vertical chevrons as directional (§3.12). |
| Collection identity by name | Names are not unique across libraries. Compare `key`. |
| `instance.mainComponent` | Throws under dynamic-page access. Use `getMainComponentAsync()`. |
| A finding on *every* component | Almost certainly a broken check or a house pattern. Investigate before reporting. |
| Indexing `fills`, `strokes` or `effects` | On a text node with per-character styling it is `figma.mixed`. Indexing it **throws mid-walk and loses every finding already collected**: silent under-reporting, no error surfaced. Check `Array.isArray` first, always. |
| A property no layer references means unused | Variant axes are resolved at the set level, so **no layer ever references one**. Slot properties fail the same way, being filled by presence in the tree. Filter out both `VARIANT` and `SLOT` (§3.10c). |
| Treating `BOOLEAN_OPERATION` as a `GROUP` | It reports as its own type and is legitimate inside icons. Never widen a GROUP check to "any non-frame container". |
| `layoutSizingVertical` alone | Meaningless without an auto-layout parent. Read `textAutoResize` too, or every text node in a plain frame is flagged. |
| `layoutSizingVertical: "FIXED"` as a second test for fixed text | It can read `FIXED` under a real auto-layout parent while the resize mode hugs. The resize mode alone decides "fixed"; the other is reported, never used to decide. 33 false hits on one layer (§3.10f). |
| `paint.color` on a bound paint | The value cached for the mode the file is **currently displaying**. Resolve `valuesByMode` per mode, and follow `VariableAlias` chains. An alias read as a colour yields `NaN`, which passes every threshold and reports clean. |
| `itemSpacing` as "the gap" | Three properties, not one: see the gap note above this table, which also says how to label GRID findings. |
| `!main` as the orphan test | Never fires. A deleted main is still returned, with `removed === false`, and still findable by id; only its `parent` goes null. Test `!main` or `!main.parent` (§3.10d). |
| `main.parent === null` on a remote instance | Not proof of orphaning: a healthy remote main reads the same when its source file is not connected. Gate on `main.key`. Absent, trust `!main.parent`; present, verify live with `figma.importComponentByKeyAsync(main.key)`. A timeout is not proof either: retry once, isolated (§3.10d). |
| "Non-canonical page" means it lacks one library's marker | A library may use other prefixes for work in progress, such as a status marker. Treating an unfamiliar one as non-canonical floods the report from that page's own substructure. Read the real set from `componentPages`, and exempt the pages `exemptPages` names (§3.9). |
| A WCAG target-size minimum of 44 | 44×44 is SC 2.5.5 (**AAA**, also the common mobile-touch figure). The AA baseline this skill claims is SC 2.5.8, 24×24. Checking 44 on a desktop-pointer library flagged nearly every interactive component, the universal-finding signature (§3.7b). |
| Diffing state variants with the variant root excluded | Exclude the root's *name*, which is `Axis=Value`. Keep its fills, strokes, effects and opacity: that is where states render. Excluding the whole root reported 44 non-rendering states on one library, and only 2 were real (§3.5a). |
| Resolving a colour variable and dropping its alpha | A resolved value is **rgba**, and low-alpha tints build soft surfaces. A reader of `{r,g,b}` only saw a near-black at 5% alpha as opaque, and returned 1.0 for a pair showing about 15:1. Composite over the backdrop using `a`, or flag the pair verify-by-eye when `a < 1` (§3.7c). |
| A nested instance's own `opacity: 0.5` read as a double dim | It is usually the disabled treatment itself. **An instance does not inherit its main component's root opacity**, so it carries an explicit 0.5, and clearing it makes the control look enabled. Only an override inside an already-dimmed parent multiplies. Compare against `(await inst.getMainComponentAsync()).opacity`, and screenshot the set. |
| An exposed nested instance in `componentPropertyDefinitions` | It is never there. "Expose nested instance" sets `isExposedInstance` on the child, and the parent set's definitions do not change. Verify the consumer's view: `const p = set.createInstance(); p.exposedInstances; p.remove();` |
| "Does anything consume this token?" through alias chains only | Misses **style paint-stop bindings** (`style.paints[].boundVariables.color`), a real consumption path. No check here does this walk today, but an ad-hoc one produced a false "orphaned variable" finding. A formal check walks both paths before calling a token unused. |

## Adding a check — the four things, none optional

Every trap above was a check that shipped and then reported something false or missed something real. The pattern is consistent enough to be a procedure:

1. **Control-pass it before trusting a single hit** (toolkit-standard §D 18). Run the new check against output already known to be correct. Identical hits there mean an artefact of the component or the template, not a defect, and "fixing" them damages correct output. This step catches a check that is right about the mechanism and blind to the intent.
2. **State what the check does NOT flag**, with the reason, beside the script. Most checks needed one or two exclusions, and each one separated a useful check from one firing library-wide. If you cannot name a legitimate case that resembles a hit, you have not understood the check yet.
3. **Put the trap in the table above, not only in your section**. That table is what this file tells a future author to read first. A trap recorded only where it was found is one nobody meets in time.
4. **Write the case, and make its sharpest assertion a negative one**. What must *not* be reported is the half that rots silently. A check that stops firing on a real defect reports success, and that looks just like a correct report. Conventions §11 is the general form: a finding on every instance means the check is wrong.

A check missing any of the four is a candidate, not a check. Say so in the report rather than presenting its hits as findings.

## 0. Locate a component set by page name

**Engine:** `FCA.locate(target, componentPages)` in `scripts/probes.js`. It returns the page whose name contains `target`, within the project's `componentPages` filter, and that page's component sets with id and variant count. The filter is the same regex `scanner/audit.js` reads; absent, every page counts.

Never write a page marker into the call. A marker is one library's convention: on a library that uses another, it finds nothing, and the audit reports clean.

## 0.5 Discovery — establish this file's own vocabulary before checking anything

Run it once per file; skip it if it already ran this session against the same file. Never carry a prior file's scales or colour spelling into a later call: take them from this probe's output.

> **CRITICAL:** query `figma.teamLibrary` for the COMPLETE library. `collection.variableIds` and `getLocalVariablesAsync()` return only variables this file has already imported. A scale built from those misses steps, and a role list misses roles. That produces false "off-scale" and "wrong role" findings on correct components.

**Engine:** `FCA.discover()` in `scripts/probes.js`. It returns:

| Output | What it holds |
|---|---|
| Collections | Every library collection, with its key |
| `scales` | The numeric groups of each collection (`FCA.numericScales`): spacing, radius, stroke, opacity, size, font |
| `colourRoles` | The first two segments of every colour or state variable (`FCA.colourRoles`) |
| `allowedKeys` | By collection key: the library collections and the local ones, labelled `local :: <name>` |
| Local collections | Each with its variables, and whether its name is Figma's default |

A default-named local collection (`Collection N`) is left out of `allowedKeys`: it is a finding, not a source. A `remote` collection is never counted local. Mode names are not checked, being invisible at one mode.

Feed the results into the project's audit settings (the `TOKENS` the scanner reads) and the `opts` of every later probe:

- **The spacing and radius scales**: from `scales`, complete.
- **The allowed collection keys**: from `allowedKeys`. **Check bindings by collection KEY, never by name**. A file can subscribe to two collections sharing a name, such as two called `Semantic` from different libraries. Only the key tells them apart.
- **The colour roles**: from `colourRoles`, complete. A role you did not discover is a gap in discovery, not a defect in a component.

Then sample two or three interactive component sets for the `State` axis vocabulary and order. Libraries vary: mobile libraries typically have no `Hover`.

Summarise all of it to the user in one short note before auditing. A wrong discovery is then caught before it is baked into every finding. If two components disagree on spelling, that inconsistency is itself the finding: never silently pick one.

## 1. Variant schema check

The scanner owns these, and the dashboard runs them too (figma-standard rule 1):

| Rule id | Raises |
|---|---|
| `schema\|axis-order\|` | The state axis not last, the disabled axis not just before it, or a project's `firstAxis` not first |
| `schema\|bool-default\|` | A True/False axis whose default is not its first option |
| `properties\|single-option\|` | An axis with a single option; breaking |

The session probe reports what the scanner does not: `State` options off the recorded vocabulary.

**Engine:** `FCA.schema(set, opts)` in `scripts/probes.js`. Its pure half, `FCA.schemaFindings(defs, opts)`, is tested.

The state axis and vocabulary are the project's, passed in as `opts.stateAxis` and `opts.states` (the recorded order). Each one missing **skips** its check. Never hard-code one library's axes or states: a touch-first library with no `Hover` would fail wholesale.

It reports:

- the state axis not last, or the disabled axis not immediately before it;
- the first axis not first, or any axis with a single option;
- a `False`/`True` axis whose default is not its first option (default first, not a fixed `False` first);
- state options outside the vocabulary, or out of order among the known ones. Never rank an unknown option `-1`: that makes a correct order read as out of order.

**The single-option-axis check is walked, both directions**. It is silent across all 54 sets of a live library the maintainer considers correct. It fires on a probe set carrying a one-option axis beside a two-option control axis (case A23).

- **Not flagged**: non-variant properties, which carry no `variantOptions`, and any axis with two or more options.
- **Flagged on purpose**: a set with exactly one variant, whose one axis necessarily has one option. There the agent asks about the set's shape (should it be a plain component?), not the axis alone.
- **Always Decide**. Removing or merging an axis rewrites every variant name and instance override: a breaking change. A deliberately staged axis (options planned, or an API kept in step with a sibling library) is intent to record as a ruling.

## 2. Property naming check

Per figma-standard rule 21, it flags:

- a text property ending in ` text`, unless a code prop has it;
- an instance swap ending in ` swap`;
- a property that is not sentence case. An all-capitals word is an acronym and passes.

**Engine:** `FCA.propertyNaming(set, opts)` in `scripts/probes.js`, whose pure half `FCA.propertyNamingFindings` is tested.

It flags an instance swap still carrying Figma's default name (`Instance…`, `Component…`). Several swaps need unique names, so a qualifier like `Icon (Danger)` is fine.

A property name's case, prefix and suffix are the scanner's: `naming|prop-case|`, `naming|prop-text|`, `naming|prop-boolean|` and `naming|prop-swap|`.

## 3. Token-binding check (the core check)

It walks every variant in the set, not just one. It flags any raw padding, gap or radius, and any unbound fill or stroke. It flags a colour token whose role does not match the layer, off-scale spacing, and a text node missing a text style.

Checking only the rest variant misses defects that appear only on Hover, Press or Disabled. All variants is the default; scoping down to one variant is the optimisation.

**Before running it, the project's `TOKENS` must hold what discovery (§0.5) found**. A missing setting skips its check rather than falling back to another library's value.

**Engine: `scanner/audit.js`**, the token rules inside `checkFacts`, which every session and the dashboard run. Its scales and collections come from the project's `TOKENS`, never from constants in a snippet. It checks every non-instance, non-slot node, in every variant, and never descends into an instance. Each absent setting skips its note or check.

| Property | Raised when | Note or advice |
|---|---|---|
| Padding | Non-zero and unbound | *On the spacing scale*, or *off the spacing scale; nearest step N*, against `TOKENS.spacing`. Off-scale and 80 or more is filed as `review`, asking whether it drives a fill. |
| Gap | Unbound (detail below) | On or off the spacing scale, as for padding |
| Corner radius | Non-zero and unbound | On or off scale against `TOKENS.radius` |
| Visible solid fill | Unbound | Names the colour variable holding exactly that colour (detail below) |
| Fill colour | Bound outside the `semantic` collection(s) | The project's intended collection |
| Fill colour on a `TEXT` node | Bound outside the `textRole` segment | Text takes a text role |
| Fill colour on any other node | Bound **inside** the `textRole` segment | A text role on a shape |
| Visible stroke | Colour unbound, or weight unbound | Weight is read per side where the node has the four properties, else from the shorthand (vectors, lines, ellipses) |
| `TEXT` node | No text style, or an unbound font family, size or weight | A weight bound as `fontStyle`, or as a number on `fontWeight`, counts |
| Any binding | From a collection outside `TOKENS.allowedKeys` | §3.5c |
| Layer name | A Figma default name | — |

**Only two role assertions are made**: text roles on text, and none on shapes. Inferring icon or background roles from the node type is wrong too often.

**An off-scale padding of 80 or more is a question**. A mechanism (a progress bar or slider fill) is a question, not a defect.

**A raw colour's advice**. It names the colour variable holding exactly that colour. Else it names the closest one within an OKLab distance of 0.03, a hand-drawn copy. Else it says none is close.

It reads the `semantic` collection(s) when they hold any colours, else all of them. It reads the file's local colour variables, each collection's default mode (`file.colours`); none passed, no suggestion. A stroke's colour gets the same advice.

> The check flags a value **only when it is unbound**. A bound value on this file's scale passes: the rule is binding, not arithmetic.

**Every unbound non-zero gap is flagged**. An untokenised value is dead weight even when it does not show. It is a latent defect that activates the moment a second child is added. The tier depends on context:

| Gap | Tier |
|---|---|
| Effective: not space-between, two or more visible children | **error** |
| Inert: the frame has a single child | **hygiene** (lower priority, no visual impact yet) |
| `SPACE_BETWEEN` ("Auto") | Not flagged |

`SPACE_BETWEEN` is the **only** exclusion. Figma ignores the stored number there and keeps a fallback that cannot be cleared, so flagging it is noise. Padding and radius always affect layout, so they are flagged whenever unbound.

For an unbound padding, the check says whether it is on the project's spacing scale or off it. On the scale is a safe auto-fix; off it is a design decision. Slot nodes are skipped: they are meant to be empty and filled by overrides. The walker handles both a `COMPONENT_SET` (all variants) and a plain `COMPONENT`.

**On performance**. Walking every variant costs more time per call. If a set has many variants and the bridge times out, check the rest variant first as a quick pass. Treat that as reduced coverage, not the standard.

Name in the report which variants were checked, and widen to the rest in later calls. Never report a partial audit as complete.

## 3.4 GRID-mode nodes use different gap properties than HORIZONTAL/VERTICAL auto-layout

**This caused a confirmed false-positive incident**. The flow gap properties (`itemSpacing`, `counterAxisSpacing`) persist with stale, unbound values once a node's `layoutMode` becomes `"GRID"`. GRID is Figma's newer grid auto-layout, distinct from HORIZONTAL and VERTICAL and from the unrelated "Layout Grid" guides. Read on a GRID node, those values look raw and unbound. They are inert leftovers with no UI control and no way to bind them.

The live, bindable gap properties on a GRID node are **`gridRowGap`** and **`gridColumnGap`**. They bind through `boundVariables.gridRowGap` and `boundVariables.gridColumnGap`.

Every gap check must branch on `layoutMode` and must never read the flow properties on `"GRID"`. Both halves of that branch are in the engines:

| Engine | Reads |
|---|---|
| `scanner/audit.js` | `gridRowGap` and `gridColumnGap` on GRID; `itemSpacing` (except `SPACE_BETWEEN`) on any other node |
| `FCA.wrapRowGaps(set)` in `scripts/probes.js` | A wrapping frame's cross-axis gap, `counterAxisSpacing`, which the scanner does not read. Never on GRID. |

**Before reporting any gap finding, dump the node's full raw `boundVariables` object**, unfiltered, not just the key you expect. A `gridRowGap` or `gridColumnGap` entry means you were about to flag the wrong property, not that the value is unbound.

Findings must report the **full layer path from the set root** (walk `parent` up to the page) and the node id. A finding the maintainer cannot locate is in effect a false positive.

## 3.5 Structural checks — states, slots, overlay anatomy

These implement the rules in [conventions-universal.md](conventions-universal.md) §4. Without a script for them, a "deep" audit reported clean on categories it never examined. Run them alongside the token walk.

> `instance.mainComponent` **throws** under dynamic-page document access. Use `await instance.getMainComponentAsync()`.

### 3.5a Every non-Rest state actually renders (highest-priority check)

A `Press` or `Hover` variant identical to `Rest` is a product bug. It outranks any token or naming finding.

**Engine: `scanner/audit.js`**, the `states` rule. The state axis is `TOKENS.stateAxis`, and the resting value is `SCALES[stateAxis][0]`. For each variant not at rest, it finds the resting sibling equal on every other axis.

It compares a signature of every layer: fills, strokes, visible effects, opacity and visibility. The root is included, except its name. Identical is a candidate.

The scanner runs the diff, which catches every state mechanism at once. Never look first for one library's "state layer" overlay instance and leave the diff to the reader.

**The confirming diff includes the variant root's fills, strokes, effects and `opacity`, excluding only its name**. One live run needed three tries:

| Diff | False non-rendering states |
|---|---|
| Root excluded entirely (§3.10e's rule over-applied: it is about the *name*) | 44, across 13 sets |
| Root opacity included (Disabled dims the root) | 16: 28 cleared |
| Root fills included too (Hover and Press paint a 3%-alpha state token on the root or a `Content` frame) | 2: 14 more cleared |

The 2 survivors were real product bugs. The sibling test confirmed them: the same set's other binary-axis side rendered its states correctly. Verify against a known-good sibling before believing any non-rendering hit.

For nested `INSTANCE` children, the signature also includes the resolved main component id (through `getMainComponentAsync`) and `componentProperties`. A state passed down to a swapped child is invisible to a name-and-visibility signature.

### 3.5b Slots and overlay anatomy

**Engine:** `FCA.anatomy(set, opts)` in `scripts/probes.js`. Per variant, it reads the direct children:

- no native `SLOT` is a candidate;
- with `opts.slotName`, a slot named otherwise is a candidate;
- with `opts.parts` (for example `["Header", "Footer"]`), each missing part is a candidate.

The names are the library's, read from a sibling that gets it right, never assumed for this file.

> Compare against a sibling that gets it right before reporting. If one overlay uses `Header / Content slot / Footer` and another does not, that contrast *is* the finding. If none do, the library may have a different anatomy, and the convention does not apply.

### 3.5c Collection source (binding leaks to the wrong library)

**Engine: `scanner/audit.js`**, the `tokens|off-library` rule. It runs only with `TOKENS.allowedKeys`: the collection keys discovery found (§0.5), as a list or as `FCA.discover()`'s `allowedKeys` object. Every binding on every non-instance node is resolved to its collection. One whose **key** is outside the set is a warning naming the field and the token.

It matches by key, because names are not unique across libraries. The `semantic` check beside it still matches fills by name. The two answer different questions: which collection a project intends, and which library a binding came from.

**Not yet walked live**. It is assumed, not measured, that a collection's key from `teamLibrary` equals the imported collection's `key` the scanner reads. The first live run with `allowedKeys` set must control-pass on a known-good library before a hit is believed.

### 3.5d State coverage — expected states that don't exist

The inverse of 3.5a. That one catches states that exist but do not render; this one catches states the archetype needs that are missing. The baseline comes from discovery: the states this library's own components of the same archetype use. Never take it from a fixed table.

**Engine:** `FCA.stateCoverage(set, expected, opts)` in `scripts/probes.js`. It returns the states in `expected` (the archetype's baseline) that the set's `opts.stateAxis` lacks, and whether the set has `opts.disabledAxis`. The archetype is decided per component during scoping.

> A missing state is a finding only when the baseline contains it. If no component in the file has `Hover`, its absence is conformance (a touch-first library), not a gap. Whether a component is loading-capable, and so needs the library's loading state, is a judgement call: surface it, never assume it.

## 3.6 Metadata check — descriptions on the set and its properties

**Scanner**. `audit.js` raises these; each absent setting skips its part:

| Rule id | Raised when | Tier |
|---|---|---|
| `metadata\|description` | Empty description on a public set | `error` |
| `metadata\|description` | Empty description on a private set (the `internalPrefix`) | `hygiene` |
| `metadata\|placeholder` | Matches `descriptionPlaceholder`, repeats the set's name, or is shorter than `minDescription` | `error` |

**Probe**. `FCA.metadata(set)` in `scripts/probes.js` raises nothing. It lists every property with whether it carries a description, and the set's documentation links. Which properties *need* one is judgement, so the probe lists and the agent decides. Text props and plain nouns rarely need one. Booleans and swaps with abstract names (Compact, Asset, Emphasis) usually do.

> Stale descriptions (citing removed variants or old names) cannot be detected mechanically. During verification, skim the description against the current axis and property list, and flag mismatches as `warning`.
>
> If `description` comes back `undefined` on **every** property, the running API version does not expose property descriptions. That is a limit of the check, not a finding: mark the criterion `Not checked`, per the universal-finding rule.

## 3.7 Accessibility structural checks

These take their values from discovery:

| Value | Library states one | Library states none |
|---|---|---|
| `minTarget` | The library's own; findings `error` | WCAG reference 24; findings `review` |
| `minText` | The library's own; findings `error` | Reference 12; findings `review` |
| Contrast | Always `review` | Always `review` |

**`minTarget`'s WCAG reference is 24, not 44: a real near-miss**. WCAG 2.2 SC 2.5.8 (Target Size Minimum, **AA**) sets 24×24 CSS px. 44×44 is SC 2.5.5 (Target Size Enhanced, **AAA**), also the common mobile-touch figure. It is a stricter, different criterion this skill has never claimed to enforce.

On a desktop-pointer web library, checking 44 flagged nearly every interactive component: buttons, icon buttons, checkboxes, switches. That wall of findings is the universal-finding signature, to investigate rather than report. Checking 24, the project's WCAG 2.2 AA floor, found none, because they all clear it. The house settings' `minTarget` is 24.

### 3.7a Focus renders (ring diff, not overlay diff)

**Engine:** `FCA.focusRings(set, { stateAxis, focus, rest })` in `scripts/probes.js`. All three are the project's words, or it skips.

Each Focus variant is matched to the Rest sibling equal on every other axis. Their stroke signatures must differ. A signature is the paints and the four per-side weights, to depth 4. The scanner rule in §3.5a leaves Focus to this one, since a ring is a stroke, not a fill.

> Some libraries draw focus as a dedicated `Stroke` or ring *layer* visible only on the Focus variant. The signature diff catches that too: the layer's strokes appear in one signature and not the other. If the diff fires on every Focus variant in the *library*, suspect the check (a house pattern).

### 3.7b Target size and text size

| Rule id | Raised when | Tier | Without the setting |
|---|---|---|---|
| `accessibility\|target` | A variant is under `minTarget` on either side; names the smallest (figma-standard rule 26) | `review` | No `minTarget`: does not run |
| `accessibility\|small-text` | A text layer is under `minText` (house default 12); once per layer, naming the sizes and variants | `warning`, seen by users | No `minText`: does not run |

A text of mixed sizes is read by its smallest run, and disabled variants are exempt from `small-text`. It replaced the probe `FCA.textSizes`, which only listed sizes.

> A visually small control can still meet the target through a larger invisible hit area. Before reporting, check for a transparent hit-area frame around the shape, a common pattern. Skip components that are not interactive: a divider may be 1px tall. Disabled-state text is exempt from text-size and contrast minima.

### 3.7c Text-on-surface contrast (resolved values, every mode)

**Scanner, the mode on screen**. `audit.js` raises `accessibility|contrast` as an `error`. It judges each text layer over an opaque surface inside the same component, in the mode each variant resolves to.

- **Thresholds**: 4.5:1, or 3:1 for large text (24px, or 18.66px at weight 700).
- **Alpha**: the text's alpha is blended over the surface.
- **Exempt**: disabled variants.
- **Opacity 0**: a layer at opacity 0 and its children are skipped. The exception is an opacity bound to a variable that is not 0 in every mode, which another mode may show. That test runs live only, so a headless run judges every bound 0.

It also feeds the Contrast measure and the score's Accessibility dimension. It is the one contrast engine. Its luminance is `tools/shared/colour.js`'s, held to it character for character by `tools/shared/test-colour.mjs`. What one reading cannot see stays the agent's, as a `review`: every other mode, and a translucent surface, which the scanner does not judge.

> Report the pairing and the ratio. Resolve the two bound variables to token names, so the report says *which tokens* fail together. The fix usually belongs to the token: never "fix" contrast by unbinding or rebinding a semantic colour. Semi-transparent fills make the nearest-solid-ancestor model approximate. Treat ratios within about 0.3 of the threshold as "verify by eye", and skip disabled-state variants entirely.

**Check the other modes, not only the one resolved**. A paint's `color` is cached for the mode a variant resolves to, so the scanner is silent about the rest. The mode nobody has open is the one that ships broken. For each other mode, resolve the pair's two bound variables with `FCA.resolveInMode`. Take the ratio with `contrastRatio` from `tools/shared/colour.js` (node).

```js
// Enumerate the modes to iterate, then re-resolve each failing pair per mode.
const cols = await figma.variables.getLocalVariableCollectionsAsync();
return cols.map(c => ({ collection: c.name, key: c.key, modes: c.modes.map(m => m.name) }));
```

**Engine:** `FCA.resolveInMode(varId, modeName)` in `scripts/probes.js`: one bound variable in one mode, never the cached paint. It follows each alias **by mode name**, falling back to the first mode only where the target has no mode of that name. It returns the value with its alpha. It returns `undefined` for a missing variable, or a chain that does not end within six hops. Its lookups are injectable, which is how the test proves the dark value is not the light one.

**Follow the alias by mode NAME, not to the target's first mode**. An alias object read as a colour gives `NaN`, which passes every threshold. Following it into `modes[0]` is worse: it returns a real colour that is the wrong one. On one live library, every sampled semantic token resolved its Dark value to the Light colour that way. Light and Dark then reported identical ratios, which reads as a theme-invariant token, not a broken resolver.

**The resolved value is rgba: never drop `a`**. A soft-surface token at low alpha, compared as opaque near-black, returned 1.0 for a pair rendering at about 15:1. Composite a translucent token over its real backdrop before computing luminance. Where the backdrop is unknown, report the pair as verify-by-eye rather than a confident wrong number.

Figma maps no collection's modes to another's, so name matching is the available heuristic. Where a target has no mode of that name (a single-mode primitive collection, say), the first mode is correct: that is why the fallback stays. Report a failure as *token pair + mode*. A pairing passing in one mode and failing in another is the finding. Naming only the pairing sends the maintainer to a component that looks correct on screen.

## 3.8 Text property coverage, and the overflow question

**One walk, both questions**: which text layers have no property (the gap), and which have one but cannot grow (the overflow risk). Never filter the walk to layers that already have a property. An older walk did, and so discarded the very population conventions §7 is about. A check that discards the rule's subject is worse than none: it fills the space where coverage appears to be.

**Engine:** `FCA.textCoverage(set)` in `scripts/probes.js`. One walk returns two lists, each row with variant, layer, id, character count and a 40-character sample:

| List | A text layer that |
|---|---|
| `missing` | Has no `characters` property |
| `overflow` | Has a property, `textAutoResize: NONE` and no `ENDING` truncation |

It stops at instances (that component's concern) and excludes text inside a `SLOT` (a maintainer ruling: slot content needs no property). It handles a plain `COMPONENT` as itself.

The `overflow` list surfaces *setup*, not behaviour. Turn each row into a question in the report, not a verdict. Ask, for example, "what should `Label text` do at 40 characters?" Truncate, wrap or grow is a design decision. The `missing` list is the gap check, and the rest of this section governs it.

**The `missing` half is walked, both directions, and is a check, not a candidate**. (`overflow` carries no walk of its own.) It is silent on five components that expose their text correctly. They include `Button` across all 54 variants and the 7-variant text input. It went silent on `Avatar` after its `Initials text` property was added, having fired before. The same component answering both ways across one fix is the strongest fixture available.

The library sweep hit **7 of 71 sets (10%)**: the lumpy distribution a working check produces, not the universal-finding signature.

**The sweep's results argue for the agent layer**. Four of the seven hits are static by design, cleared on sight. They are 28 calendar weekday labels (Mo, Tu, …), a label's asterisk (*) and two Optional markers. A scanner-only check would report all four and teach the maintainer to skim.

The other three are judgement calls for **Decide**, not a batch fix. They are an upload status caption, a chat disclaimer caption, and an empty state's title and message.

**Still unexercised: the `SLOT` exclusion**. No component in that library holds text directly inside a slot, so the branch never had to suppress anything. It rests on the maintainer ruling that produced it.

**Variance is evidence, not the trigger**. The obvious build compares a layer's `characters` across variants and flags what differs. That cannot fire on a one-variant component, or on text held identical across a set, which is where missing properties collect. A one-variant message card with a lorem paragraph and no property once passed a clean audit. Rank by `chars` and by whether the string reads like content, but never gate on variance.

What this deliberately does **not** flag, each cleared by the agent rather than assumed by the scanner:

| Not flagged | Why |
|---|---|
| Text inside a `SLOT` | Replaced wholesale by the consumer (a maintainer ruling, conventions §7) |
| Text owned by a nested `INSTANCE` | The nested component's concern; the walk stops at instances |
| Static by design | A value naming a fixed thing, not supplied content: calendar weekday headings, a mandatory-field asterisk, a currency symbol. A property invites changing what should not change. |
| Written by code at runtime | A live readout such as `Uploading - 64%`, which no one types in Figma. **Rarer than it looks**: confirm rather than assume from the wording. |

The separating question is **whether a consumer would ever legitimately set this string**, not whether it varies today. A filename, a caption, a heading, a message, a person's initials: findings. `Mo Tu We Th Fr Sa Su`: not. Both exceptions are a minority. An exclusion reached for freely swallows the findings the check exists to produce.

## 3.8b Page organisation — category and page ordering

**Moved to `figma-foundations-audit`** (its foundations scanner, figma-standard rule 11). This skill no longer checks page order and holds no walk for it; the heading stays so older cases citing §3.8b still resolve.

The lessons travelled with the check:

- compare with `localeCompare` and `sensitivity: "base"`, never `<`;
- furniture (cover, dividers) is excluded, not sorted;
- a category the project pins last is a setting (`pinnedLast`), not a violation;
- a page move is a safe, visible fix.

## 3.8c Naming case — splits, and conformance to the recorded convention

Two questions that look like one:

| Question | Owner |
|---|---|
| Does a name space hold two names differing only in case? (figma-standard rule 19) | `figma-foundations-audit`, filed under its name. This skill reports no collision. |
| Do names conform to the recorded case convention? (figma-standard rule 18) | This skill, as a session check, since the project's carve-outs need judging |

**figma-standard rule 19 is preference-free**. It holds whatever convention a project picked. For an exported name it is always a defect: every export path lowercases, and the two collapse into one token.

**Which case the project uses is a convention, and this skill must not state it**. Read it from the active project's context document (§3, language and naming). Where the document is silent, cite **figma-standard rule 18** by handle and apply it as the default. Never restate that rule's text here or in a report. A copy freezes when written and, since a project document outranks house defaults, silently overrides the rule it copied.

So the engine **classifies and never judges**. It returns the case shape of every segment and the minority members of each name space. The agent compares that with the convention and decides (clause G's boundary: the engine says what the data shows, the agent what the project wants).

**Engine:** `FCA.nameSpaces()` in `scripts/probes.js` gathers the name spaces: one per local variable collection, the text styles, the effect styles and the components. It hands them to `FCA.classifyNameSpaces(spaces)` (tested). Per space, that returns the **minorities**, figma-standard rule 18's evidence. A minority is a case shape outnumbered at the same depth, with the majority's count and up to eight examples.

`FCA.caseShape` classifies a segment as lower, initial-cap, `upper`, `camel-inner` or mixed.

Test `upper` before `camel-inner`. Every acronym (AI, WCAG) matches the camel pattern, so the other order never returns `upper`.

**The control pass is what makes this check usable**. On a corrected live 19-page library it should have been silent, and it fired four times. That is a finding about the check (toolkit-standard §D 18), not the file. Two were bugs, both fixed in the engine:

- **A segment that does not start with a letter is excluded, not classified**. `Palette/Blue/9-source` has letters, so it was classified `mixed`. It became evidence of a convention it cannot have. Correct names were then reported as the minority.
- **Segments are bucketed by depth, never pooled**. In `Heading/md-medium/size` the group is capitalised and the size is not, both correctly. Pooling reported 54 lowercase against 54 capitalised: the convention flagged as its own violation. Splitting only leaf from the rest moved the bug one level in.

After both fixes it was silent across all five variable collections and both style types. The two surviving hits on components were correct, and were the two shapes the check tells apart. One was a real split: a `switch` graphic beside the `Switch` set (now the foundations audit's half). The other was a legitimate minority: 20 lowercase icon names against 22 capitalised components, the imported-asset carve-out.

- **A minority is a candidate, never a finding**. Names imported from an icon set sit in the minority permanently and legitimately. `Elevation/Raised` is a capitalised leaf that figma-standard rule 18 allowlists. Check the context document's carve-outs before reporting one.
- **A split in an *exported* name space (variables, styles) is a defect every time**. It needs no convention to interpret: the two names become one token downstream.
- **A split among *component* names is advisory**, not a figma-standard rule 19 violation. Components are not exported as tokens, so nothing collapses. Still report it: a picker search returns both, and a code-gen mapping cannot tell them apart.
- **Report the majority count beside the minority**. A maintainer deciding whether five is a defect or a carve-out needs to see the majority is 268.

## 3.9 Detached-frame candidates (real instances, not copies)

Scan non-canonical pages for frames whose names collide with real component names.

**Confirmed false-positive trap: "non-canonical" is not "lacks the usual marker"**. A library may use other prefixes for in-progress or grouped work, such as a status marker on WIP pages. Treating an unfamiliar prefix as non-canonical floods the report from that page's own substructure.

- Read the full set of component-bearing page prefixes from `componentPages`.
- Where it is `[TBD]`, ask, or note every prefix among pages holding `COMPONENT_SET` or `COMPONENT` nodes.
- Never hard-code one prefix.
- Exclude the pages `exemptPages` names outright. A cover is decorative, not a product surface, so a name collision there is exempt.

**Engine:** `FCA.detachedScan(exemptPages)` in `scripts/probes.js`, in two passes:

1. Load every page. Collect the names of top-level components (parent a page, section or frame), and the prefixes of the pages holding them.
2. Load each candidate page and return each frame or group named like a component (`FCA.detachedSuspects`). A candidate page (`FCA.isCandidatePage`) is not in `exemptPages` (none by default) and shares no component page's prefix.

Always load a page before reading its children. Under dynamic-page access, an unloaded page reads as empty.

Candidates only: judgment-protocol §4 confirms each. Before treating a name collision as a detached duplicate, walk `node.parent` up for a `COMPONENT_SET` or `COMPONENT` ancestor. A frame that is substructure of a *different* legitimate component is not a finding. An example is one reusing a common name like "Divider" for its own part.

## 3.10 Hidden / orphan layers

**Engine: `scanner/audit.js`**, the `structure|hidden` rule. It raises a layer with `visible: false` and no `visible` property reference, in every variant, never inside an instance.

## 3.10a Disabled paints, strokes and effects (hygiene)

A paint toggled off in the panel stays in the array with its own `visible: false`. Distinct from 3.10, which finds hidden *nodes*: this finds dead *style entries* on visible nodes.

**Engine:** `FCA.disabledPaints(set)` in `scripts/probes.js`. It returns each fills, strokes or effects entry with `visible: false`, by variant, layer, property and index. It never looks inside an instance.

**`Array.isArray` is not optional: measured**. On a probe with per-character fills, the walk without the guard **threw and returned `[]`**, losing the disabled fill. The throw shows as a failed `figma_execute`. The danger is batching: one failed batch returns nothing while the rest succeed. An audit that does not check every call presents the survivors as complete.

## 3.10b No GROUP nodes inside components

**Engine: `scanner/audit.js`**, the `structure|group` rule. It raises every `GROUP` node in every variant, never inside an instance.

`BOOLEAN_OPERATION` nodes report as their own type, not `GROUP`, and are legitimate inside icons. Never widen this to "any non-frame container".

**Walked, three directions**. It is silent across 55 real components, whose type census holds no `GROUP`. It fires on a probe holding one. It ignores a probe whose only container is a `BOOLEAN_OPERATION`.

## 3.10c Unused component properties

A property no layer references. Walked against a real 54-variant set, it correctly returned `[]`.

**Engine: `scanner/audit.js`**, the `properties|unused` rule. It collects every reference in every variant. Each definition that is neither `VARIANT` nor `SLOT`, and that no layer references, is an `error` naming its consequence.

**Trap 1: variant axes**. They appear in `componentPropertyDefinitions`, and no layer ever references them, because Figma resolves them at the set level. On the control run, the walk without the `type !== "VARIANT"` filter returned `["Size", "Role", "Disabled", "State"]`. Those are every axis of a correct component, and so of every set in the library. Filter before comparing.

**Trap 2: `SLOT` properties fail the same way**. A `SLOT` node is filled by whatever a consumer places inside it. No layer carries a `componentPropertyReferences` entry pointing back at the slot property: only the slot's own presence. A two-variant set with a correctly conditional `Menu slot`, present only where it should show, was flagged `unused`. The filter needs both exclusions.

**`unused` is an `error`, and the consequence is the whole component**. Figma **ignores the component at publication** when it declares a property applied to no layer (maintainer-confirmed, reproduced live). Consumers never receive the component, while the publish reports success. Figma's warning icon in the properties panel is visible only to someone inside the file. Report it with the consequence: "this component will not publish" gets it fixed; "unused property" gets it deferred.

**Never reintroduce a per-variant "missing property" check**. One compared each variant's exposed properties against the set's union. On the known-good Button it flagged **54 of 54 variants**, every one correct design. 30 expose a 20px icon swap, 15 the 16px one (the small size), and 9 nothing (`State=Loading` shows a spinner). Properties are **conditional on an axis value**: the sparse-grid principle applied to properties.

It cannot be salvaged as a script. Telling conditional-by-design from lost-in-a-rename needs to know which axes govern content: `Size` and `State` do on Button, `Role` does not. That is judgement.

## 3.10cc A layer wired in some variants and not in others

**The mirror image of 3.10c, and the one it cannot see**. 3.10c collects every reference in the set into one set of keys. A property is "used" the moment a *single* layer points at it.

So a set can declare `Label text`, wire one variant's label, and leave a hundred labels hard-coded. 3.10c reports that set clean. Nothing is wrong with any one layer; what is wrong is that its twins disagree.

Read the other direction. Within one set, take each layer and each reference kind (`characters`, `mainComponent`, `visible`). Count the variants where it carries a reference and where it does not. Report only when **both** counts are non-empty. That guard keeps the check quiet:

- a layer no variant wires (a spinner, a static caption, a divider) is off-only and never fires, so deliberate static content is not swept up;
- a layer every variant wires is on-only and never fires;
- a layer in only some variants is counted only where it exists, so an error message present only under `Validation=Error` is not a finding.

**Key by PATH, never by name**. One text field variant holds four layers called `Label`: the label part's instance, its text, the static placeholder and the error text. A name key collapsed all four into one 9-on/9-off finding, on three components, all wrong. The path below the variant root is what a twin shares across variants. The root's own name is left out, because it *is* the variant name.

**Give same-named siblings an ordinal**. A dialog footer holds two layers called `Button`. The primary is always visible; the secondary is wired to a boolean. They share a path, so the path alone reads them as one layer wired in half its variants. The names `Button` and `Button[2]` tell present twins apart without losing the coverage.

With both refinements, a sweep of an 88-set library went from four findings, all false, to one, which was real. A maintainer had found it by eye.

**A path is where a layer sits, not what it is**. Child order is stable across a set's variants, but the *set* of children is not. When one is missing, the same path names a different layer. One 120-set library gave five false rows, in two shapes:

- A Button's `Loading` variants hold one `Icon container` in `Content`, the spinner, wired to nothing. The other variants hold the left icon, a label and the right icon. The path named the spinner in 18 variants and the left icon in 90.
- An input whose leading icon exists only with a value made `Field > Icon container` the chevron when empty and the leading icon when filled.

The tell was in the data: the unwired variants fell exactly on one axis value, a design's signature.

So a layer is keyed by its path *and* what it is. That is its type, and for an instance the names of what it holds. For the `visible` kind only, the key adds whether it is its parent's only child. A boolean cannot hide a container's only child without emptying it. So an icon alone in `Icon only` variants and beside a label elsewhere is two slots.

That last is a class, not an exemption: a wrapper's only child wired in six variants and forgotten in four still fires (`tests/test-audit.mjs`). The motivating finding still fires with the same counts: a label whose text reference was lost at two sizes, the same layer in every variant.

*Why it exists:* a `Button` drawn at three sizes was merged into one set, and three `Label text` properties collapsed into one. The `md` and `sm` labels lost their `characters` reference: 36 of 108 still bound, 72 wired to nothing. Every other check passed over it, and the maintainer found it by eye.

## 3.10d Instances whose main component is gone

**Engine:** `FCA.orphans(set)` in `scripts/probes.js`, tested with stand-in nodes. It never descends into an instance. Per instance, through `getMainComponentAsync()`:

| Main | Verdict |
|---|---|
| None | Orphan |
| Has a parent | Healthy |
| No parent, no key | A local main detached from the document: orphan |
| No parent, has a key | Verify with `figma.importComponentByKeyAsync`, once per key with one retry. Report only a failure on both tries. |

**`!main` alone never fires: walked, both directions**. Removing a main leaves `getMainComponentAsync()` still returning it, with `removed === false`, still findable by id. What changes is that it loses its parent. So the local test is `!main || !main.parent`.

**`!main.parent` is not proof of orphaning for a remote main**. It is also how a healthy remote component looks when its source file is not connected in the current bridge session. The plugin cannot see that file's page tree, so the parent reads null. Four instances of a remote icon library were flagged this way. Every one resolved through `figma.importComponentByKeyAsync(main.key)` on an isolated retry.

An earlier validation found no false hits only because that session happened to have the remote source file connected. **So the rule gates on `main.key`:**

- **No key**: `!main.parent` alone is trustworthy, the narrow case this check was built for.
- **A key**: a null parent means only "not verified yet". Resolve it live before deciding.
- **A failed resolution is not instant proof**. Three back-to-back import calls once timed out and then all succeeded on isolated retries, most likely a rate limit or a saturated bridge. Retry once, isolated, before reporting a remote key as failed.

## 3.10f Text nodes with a fixed height

Text that cannot grow clips instead of reflowing. The scanner finds fixed-height text; the agent clears the four legitimate exceptions in conventions §7.

**Engine:** `FCA.fixedText(set)` in `scripts/probes.js`. It raises a text node with `textAutoResize: NONE`, not filling vertically, and not truncating (`ENDING` or a max line count). Each hit reports the resize mode, vertical sizing, whether the parent is auto-layout, height and character count. Never inside an instance.

Four things it deliberately does **not** flag, each of which would otherwise fire across a whole library:

| Not flagged | Why |
|---|---|
| `textAutoResize: "TRUNCATE"`, `textTruncation: "ENDING"` or a `maxLines` value | Clipping is intended; reporting it proposes breaking a designed truncation |
| `layoutSizingVertical: "FILL"` | The text stretches by instruction; it is not stuck |
| `layoutSizingVertical` with no auto-layout parent | Meaningless there: it reads `FIXED` regardless |
| `layoutSizingVertical: "FIXED"` under a real auto-layout parent, with `textAutoResize` `HEIGHT` or `WIDTH_AND_HEIGHT` | The node hugs and cannot clip; the sizing property lies |

**The read of `layoutSizingVertical` must be conditional, not ORed**. A text node with `textAutoResize: "HEIGHT"` in a plain frame was flagged because the check ORed the two properties. A genuinely fixed-height node in a plain frame still flags; that was verified separately.

**Never use `layoutSizingVertical` to decide "fixed"**. 33 instances of one layer (`Value`, in `Menu button`) were flagged, all false. Each read `textAutoResize: WIDTH_AND_HEIGHT`, while the sizing property said `FIXED` under a real auto-layout parent.

Gating on the parent was not enough, because the property lies even when its precondition holds. It is reported with each finding for context only. 33 hits on one layer is also the universal-finding signature: a check bug, not 33 defects.

**Report the character count with each hit**. A fixed-height node holding 4 characters is a numeric badge; one holding 60 is a description waiting to clip. The agent needs that to rank them. The height alone says nothing about how close to overflowing the node is.

## 3.10e Variant axes that only toggle visibility

Candidate only. It compares each pair of variants differing on exactly one axis. If the sole structural difference is one subtree's `visible`, the axis is doing a boolean's job.

**Engine:** `FCA.visibilityAxes(set)` in `scripts/probes.js` (tested). For each such pair, it compares a signature of path, name, type and visibility for every layer below the variant root. It goes to depth 6, never inside an instance.

**An axis is a suspect only when every compared pair on it differs in visibility alone**. One matching pair proves nothing. The signature deliberately excludes fills, sizes and text content, so two variants differing in colour do not match, which is correct.

**Exclude the variant root from the signature**. Its name is literally `Axis=Value`, so including it disqualified every pair, and the check returned nothing for any set. On a real 54-variant Button it reported nothing across 207 pairs, which read exactly like a pass. Probing the positive direction found it: a two-variant set differing *only* in one rectangle's visibility also reported nothing. A check that cannot report is worse than a missing one.

## 3.11 Variant annotations

Not a `figma_execute` script. Annotations are read through the dedicated MCP tools (`figma_get_annotations`, `figma_get_annotation_categories`), not the plugin API's node walk. Check presence per state-bearing variant. Judgment-protocol §4 decides whether absence is a real gap (spec detail with nowhere else to live) or correctly empty (a purely visual variant).

## 3.12 Right to left (opt-in, figma-standard rule 50)

**Engine:** `scanner/audit.js`, rule family `direction`. It runs only when the settings name `rtlLanguages`. Every library has a left padding and an end-aligned row, so without the switch each check would be noise. With it, the rules answer the questions in figma-standard rule 50, every variant walked.

**Names are read as words**. Before the word tests, a camelCase or PascalCase name is split at its capitals with a hyphen. So `ArrowLeft` becomes `Arrow-Left`, and `Fast-Forward` still matches the media words. So a library naming icons that way reads like one using `arrow-left`.

**A `Direction` axis**. Where a set has a `Direction` axis holding `RTL`, its RTL variants are the mirror. They are checked against their LTR twins (`rtl-order`, `rtl-align`). The side-labelled notes (pinned, padding, end-align, corners, text-align) read the LTR variants only. So a correctly mirrored 8/12 padding is not noted beside the LTR 12/8.

**Hidden layers are skipped throughout the family**; the structure family already raises them.

Rules on any set (with `rtlLanguages`):

| Rule id | Raised when | Exempt, or trap |
|---|---|---|
| `direction\|no-autolayout\|` | A frame without auto layout holds two visible layers side by side (x ranges apart, y ranges overlapping): a row with no order to reverse | A frame drawn only in shapes (a logo, an illustration) is a drawing. It replaces the structure family's review of the same frame, so one cause is one row. |
| `direction\|pinned\|` | A layer that is absolute, or off-centre in an overlay frame, with horizontal constraint `MIN` or `MAX`, neither centred nor covering both edges | Detail below the table |
| `direction\|flat-icon\|` | A `VECTOR` or `BOOLEAN_OPERATION` named chevron, arrow or caret, inside a component that is not itself an icon | Up-or-down-only names are skipped |
| `direction\|side-name\|` | Left or right as a word, or inside camelCase or PascalCase (`iconLeft`, `LeftIcon`), in a layer name. The advice renames it by role, in the same case. | Detail below the table |
| `direction\|side-prop\|`, `direction\|side-option\|` | The same in a property name, or in a variant axis's options: one row per axis, every rename named | A rename there is breaking, and the advice says so. Icons are skipped. |
| `direction\|fixed-icon\|` | An icon instance whose name or main holds a directional word, that no instance-swap property controls | Detail below the table |
| `direction\|padding\|` | Any auto layout, horizontal or vertical, with different left and right padding | One row per set, every distinct pair on its line (Size S at 8/4 and L at 12/8 are two) |
| `direction\|end-align\|` | A horizontal row aligned `MAX` on its main axis, or a vertical frame `MAX` on its cross axis | **Trap:** an enum, invisible to a scan for numbers. A chat bubble's side was exactly this, and a padding-and-radius scan called it clean. |
| `direction\|corners\|` | Per-corner radii whose left pair differs from the right pair, outside icons | One row per distinct set of radii |
| `direction\|icon-decision` | An icon whose name holds a directional word, and whose description has neither `Right to left: mirrors` nor `Right to left: stays` | Detail below the table |
| `direction\|note` | A component with any of the above, or a row that reverses, whose description has no `Right to left` heading | — |
| `direction\|text-align\|` | A text box wider than its text (not hugging) aligned left or right | **Trap:** every text layer is aligned left by default, so a hugging label is exempt. Figma's alignment is physical and no mode changes it, so code must write it as start or end |

**`pinned`, in full**. It covers a layer with `layoutPositioning: "ABSOLUTE"`, or one off-centre in an overlay frame without auto layout. An overlay frame is one where another visible layer covers it (a badge on an avatar's image). Drawn shapes inside a frame that is itself a drawing (a checkmark in a checkbox) are exempt.

**`pinned` trap: position decides, not the constraint**. Absolute layers default to `MIN`, so a focus ring drawn 2px outside its control reads as pinned left by constraint alone. Counting stretched layers put a 120-variant icon-only set in the wrong column of the measured library.

**`side-name` exemptions**. Icons are skipped, since their glyph really points that way; the same holds for property names and options. Text layers are exempt, being named after their copy ("3 days left"). So are instances still named after their component (`arrow-left`), or whose component cannot be resolved.

**`fixed-icon`, in full**. An icon is decided by its main component's structure, so a Next button in a pager is not one. Media controls are excepted. A name pointing only up or down (chevron-down in a select) stays the same in Arabic. It is skipped here, in `flat-icon` and in `icon-decision`.

**`fixed-icon` trap**. An instance takes its direction from its main component and variant when they name one. So a layer called Forward holding chevron-down is skipped. The first live run raised eight such among thirteen.

**`icon-decision`, in full**. An icon here is a lone component of shapes, 64px or less. It is decided by structure, because another plugin's data is unreadable here. Only the name counts, not the description: prose like "takes you back" is no direction.

Rules per text style (with `rtlLanguages`):

| Rule id | Raised when | Note |
|---|---|---|
| `direction\|font-fixed\|` | The style's font family is not bound to a variable, on the style or the layer, so a right-to-left mode cannot switch the typeface | Warning: the letters fall back to a device font. Detail below. |
| `direction\|tracking\|` | Positive letter spacing not bound to a variable | It pulls joined Arabic letters apart, so the right-to-left mode needs 0 |
| `direction\|text-case\|` | A text case other than original (uppercase, small caps) | Arabic has none; the line says it is Latin only |

`font-fixed` is raised once per style for the whole file, under the first set using it. It points at the source library when the style is remote. Icon fonts and code type keep their face and are exempt: mono, code, symbols or icons in the family or style name. A text layer with no style is already the tokens family's `textStyle` error.

Rules only with `rtlInFigma: true`:

| Rule id | Raised when |
|---|---|
| `direction\|no-variant` | A set with anything that must mirror and no `Direction` axis holding `RTL` |
| `direction\|by-hand` | A set needing the variant whose name matches `rtlByHand`: a `review`, since such a row may keep its order |
| `direction\|rtl-order\|`, `direction\|rtl-align\|` | With a Direction axis: an `RTL` variant whose rows or text boxes do not mirror its `LTR` twin |
| `direction\|rtl-parts` | A row whose parts differ from the twin's by name, not just order (`Leading` against `Trailing`); gives the reversed LTR names to use |
| `direction\|rtl-twin` | An `RTL` variant with no twin: a `review` |

**`no-variant`, in full**. Not only a row needs the variant, because an instance can swap none of these. Each of the following needs it:

- uneven padding;
- content aligned to the right;
- text aligned to a side in a box wider than it;
- one-sided corners;
- a pinned layer;
- a row without auto layout;
- a directional icon placed as an instance no swap property controls, or drawn in.

An icon a swap property controls is the instance's to change, and gives no reason. The finding names every reason. A row of two only with a hidden part still counts. It is named as shown by a boolean when the part's visibility is bound to one, else as hidden. A row-only count misses uneven padding, side-aligned text and one-sided corners.

**`by-hand` and `rtlStays`**. `rtlByHand` names media controls, phone numbers, clocks and code fields. A set whose name matches `rtlStays` (charts) raises neither rule. A pattern that is not a string or does not compile is named in the result's `settings`.

**`rtl-order` and `rtl-align`, in full**. Each `RTL` variant is checked against its `LTR` twin, the one with the same other properties. Layers are matched by their path of names, every level down. Each horizontal row's in-flow parts must be the twin's reversed; hidden parts count, since a boolean shows them. Each text box wider than its text must be aligned to the twin's other side.

An instance's own parts are skipped: they come from its component, checked in its own set. The advice names the exact order, or the layer and the side. **Limit:** two siblings sharing a name are compared as one.

**Measures.**

| Measure | What it counts |
|---|---|
| `rtlSets`, `rtlVariants` | The sets, and their variants, with a horizontal auto layout holding two or more children in the flow, or a `no-autolayout` row |
| `rtlVerdicts` (only with `rtlInFigma: true`) | One line per set, with its variant count and the reasons. The verdicts are variant, has variant, `covered`, by hand, stays and `none`. |

For `rtlSets`, hidden children count, since a boolean shows them; absolute ones do not. **Trap:** counted from first variants only, the measured library read 41 sets and 238 variants against the true 58 and 461. It put the primary Button among the safe.

For `rtlVerdicts`, `covered` means a set with nothing of its own to mirror. It holds, at any depth, a component that gets the variant, hidden instances and hidden frames included; `by` names them. Only sets in the same run count, so a scoped run can leave a holder `none`. An overview of the work is counted from this. A hand-written walk for the same counts drifted from the scanner on its first day.

**What it does not check:**

- rotation: a rotated chevron that code mirrors still points the right way, and a flip may read as rotation 180;
- a row drawn as a Group;
- language-specific exceptions;
- line height: whether Arabic reads tight is a judgement on real text;
- whether a note is right, rather than present.

## 3.13 A composed frame: library instances and bound values only

**Engine:** `FCA.composedFrame(frame, componentNames?)` in `scripts/probes.js`; its pure half, `FCA.composedFindings`, is tested with stand-in nodes. It is not a library check. It reads one screen composed from the library (an agent's prototype, a designer's page). So it is not in `scanner/checks.json`, whose dimensions score components.

**The receipt**. With `{ receipt: true }` (an agent's frame), it also reads the frame's receipt. That is shared plugin data (namespace fca, key receipt), so any plugin or bridge reads what another wrote. No receipt, or one that does not parse, is `no-receipt`. One with no `reference` is `no-reference`: the composer started from the bare template.

**`FCA.references(template)` is its companion before composing**. It lists every visible instance of the template's variants, one row per instance; a variant passed is read as its set. It skips instances inside a component or inside an instance's own drawing. One in an instance's slot counts, a slot's default content included.

Each row names its screen (the frame just under the page or a section) and its page. A screen with a receipt is `composed`, a past prototype, and sorts last.

**What was composed** is the root (unless it is an instance) plus whatever was put in a slot of a placed instance, at any depth. The rest is the library's: an instance's own drawing, and a slot's default content. They are told apart by id. A slot child whose id, relative to the placed instance, names a node of that instance's main came with it. Content put in a slot does not (seen live).

In what was composed, it raises:

| Finding | Raised for |
|---|---|
| `raw` | A node that is not a frame, component, section or instance. A group too, and its children are still read. |
| `unbound` | A frame's non-zero gap or wrap gap (unless spaced between), grid gaps, padding (with auto layout) or corner radius. Also each visible solid fill and stroke without a style. |
| `orphan` | A placed instance whose main does not resolve, or is a local main gone from the document |
| `detached` | A non-root frame named like a component placed in the frame, or one in `componentNames`. Also any frame Figma marks detached (`detachedInfo`). |

A `detached` finding's `by` says which test caught it (`figma` or `name`). Its `root` is set when the root itself is the detached copy, typically a screen detached from a template.

**What it returns besides findings.**

- A raw text says whether it carries a text style (`styled`; a mixed one does).
- `checked` counts what was judged, bound or not: non-zero values, visible solid paints, texts. A caller turns findings into a share.
- `keys` counts the placed instances by their main component's key, so a caller can tell which library they come from. The Adoption score widget (`plugins/adoption-score`) does.
- Hidden layers are skipped. Gradients, images and fully transparent paints are not judged.

**Why:** a composition trial built a page from library instances. Its own background was a raw white that only a probe of this shape caught. **Walked live** on that page, rebuilt from its template: 9 placed instances, no finding. A copy with a rectangle and an unbound white frame in its content slot gave exactly one `raw` and two `unbound`. A fresh template instance, slots at their defaults, gave none.

**Limits.**

- An orphan here is what resolves locally. A remote key that fails to import is §3.10d's (`FCA.orphans`), which retries it.
- A detached copy of a component the frame does not otherwise place is caught by `detachedInfo` (the root's included). A copy Figma no longer marks is caught only when its name is in `componentNames`.
- A detached frame's own layers are still read as composed, so its raw drawing counts as raw.

## 4. Fixes

Apply only after the user approves. Re-run the matching detection afterwards to confirm.

### 4a. Bind a raw spacing/radius to a primitive token

**Engine:** `FCA.fix.bindVariable(nodeId, field, source)` in `scripts/probes.js`. `source` is a variable id, or `{ sibling: nodeId }` to copy the binding a correctly bound sibling carries on the same field. It binds, re-reads the node fresh, and returns the variable names now bound there.

> Remote tokens often are not in `getLocalVariablesAsync`. The reliable path is to **copy the binding id from a correctly bound sibling layer**. Read `sibling.boundVariables.itemSpacing.id`, then `figma.variables.getVariableByIdAsync(id)`, then `setBoundVariable`. Prefer an existing correct example over guessing a token.

### 4a-2. Rebind a fill/stroke color variable

`setBoundVariable` on the node directly **fails** for fills and strokes. Figma requires paint-level binding: `Error: in setBoundVariable: fills and strokes variable bindings must be set on paints directly`.

**Engine:** `FCA.fix.bindPaint(nodeId, "fills" | "strokes", source, index)` in `scripts/probes.js`, with the same source forms. It binds the paint at the index (default 0) with `setBoundVariableForPaint`. It reassigns the array and returns the names now bound. **Only that paint changes**. Never assign `[newPaint]`, which drops every other paint on the node.

**Verify after writing**. Both fixes read the node back fresh (`getNodeByIdAsync` again, not the in-memory reference) and return the bound variable's name. Confirm it is the token you intended rather than trusting the write call's success.

### 4b. Reorder variant options (e.g. boolean axes to `False, True`, or `State` to canonical order)

Option order comes from the order of child components, and is **not a writable field**. `set.editComponentProperty("State", { variantOptions: [...] })` throws `Unrecognized key(s) in object: 'variantOptions'`. No reliable plugin-API path rewrites option order.

**This is always a manual fix**: tell the user to drag the options into place in Figma's Variants panel. Never reinsert child components to force an order. It is fiddly, easily scrambles instance overrides, and has no clean path around the API limit.

### 4b-2. Add a component property, and bind a layer to it

Adding a property is **additive and non-breaking**: existing instances keep working and gain a control. That makes it the one interface change that can sit in *Approve & I fix* rather than *Breaking*. Two steps: declare it on the set, then point the layer at the returned key.

**Engine:** `FCA.fix.addProperty(setId, name, type, layerIds, defaultValue)` in `scripts/probes.js`.

1. It declares the property and takes the **key** it returns (`name#id`); the name alone will not bind.
2. It sets the matching reference (`characters`, `visible` or `mainComponent`) on every listed layer, merged into what each already carries.
3. For `INSTANCE_SWAP` with no default, it uses the first listed instance's main **node id**.
4. It re-reads each layer and returns how many are bound and which are not.

**Spread the existing references, never replace them**. A layer can carry `visible`, `characters` and `mainComponent` at once. Assigning a fresh object silently drops the ones left out, and nothing errors.

**A layer inside a nested instance cannot be bound** (tested). Setting a reference on an instance's sublayer throws `Cannot set component property references on instance sublayer`. Put the content in a slot instead (figma-standard rule 38). Exposing the nested component's properties on the parent does not keep a per-item value when the item switches variant.

**A component cloned into another set loses its property references** (tested). Cloning into a different set drops every `componentPropertyReferences`. Re-wire from the source by layer path. Verify with a diff that includes the references, since one without them reads the clone as identical.

**The `INSTANCE_SWAP` default is a node id**. Passing `main.key`, the value every other API here wants, throws `Property value is incompatible with component property type`. The error names the type, not the field, so it reads as though the property type were wrong. A working sibling stored a node id (`"0:6907"`).

**Bind the layer for every variant the property applies to**, not just the one you read the default from. Then re-read the set and confirm each variant's `componentPropertyReferences`. A partially bound property is not a publication blocker the way an unused one is (§3.10c), so nothing will tell you.

### 4c. Rename a layer

Rename the layer in every variant of the set, never in one. Overrides survive a rename on update, but a layer named differently across variants loses them when a consumer switches.

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

> Renaming a variant **property** or **option** keeps every instance on its variant with its overrides (tested). It is still a breaking **API** change. Code Connect enum mappings keyed on the old value stop matching without failing the publish, and scripts and Swap library match by name. Always surface it as breaking and get explicit approval.
>
> Renaming a layer (4c) is safe only when every variant's layer gets the same new name. A name that differs across variants drops consumers' overrides when they switch variant.

### 4e. A missing or placeholder description

**This audit flags it; it does not write it**. `figma-component-descriptions` owns writing a description. That is the full structured form for a public component, and the compact one for a private one. It also owns the dialect it infers from the library. And it owns the slot-only protocol that decides what a part's description says.

A recipe here would be a second, shorter answer that drifts from the one that knows those things. The skill `figma-component-pass` exists to run the two in order.

So the row this audit files is the finding, and the fix is a hand-off. Report the component, say what is missing, and name the skill that writes it. The check itself (what counts as missing or placeholder) stays in `checks.json` with the rest of this audit's rows.

## 5. Whole-library sweep (schema only)

For a fast file-wide pass, run the probe's schema checks and its default-swap-name check across all sets, without the deep token walk. The schema checks are single-option axes and the state vocabulary. The token walk is too heavy for every set at once: even a few dozen sets can time out the bridge in one call. Iterate pages in batches, collecting axis and property findings. Then deep-check tokens only on the components the user wants fixed.

**Engine:** `FCA.sweepSchema(componentPages, opts)` in `scripts/probes.js`. It runs every component set on the project's component pages through `FCA.schemaFindings` and `FCA.propertyNamingFindings`. Those are the two functions §1 and §2 call, so the sweep cannot drift from them.

Axis order, default-first and a property name's case are the scanner's, not the sweep's: run the scanner for those. Never reference `TOK.componentPages` outside `scanner/audit.js`, where alone it exists. Pasted on its own, it throws a `ReferenceError` before reading a page.

## 6. Output contract

No aggregation, no matrix, no score. The scanner emits, per batch:

- a coverage line: pages, sets, variants and nodes walked, so the agent can state honestly what was scanned;
- the raw candidate list, tagged by rule, node id and value.

Everything else happens in the judgment layer: verification, suppression by accepted exceptions, bucketing into the fix queue. If a batch returns zero candidates, verify the walk visited nodes (return node and binding counts) before treating silence as clean.

## Coverage and the porting backlog — see `scanner/checks.json`

**Do not restate the backlog here**. `scanner/checks.json` is the catalogue: every check, its dimension, its tier, who raises it, and a `status`. The `status` is the single statement of whether a check runs:

| `status` | Meaning |
|---|---|
| `scanner` | Implemented in `scanner/audit.js`. Runs identically from a session and from the dashboard. |
| `session` | Agent layer. Only a full session run originates it, because the dashboard's judgement pass *filters* scanner candidates and never raises its own. |
| `backlog` | Documented, implemented nowhere. It does not run unless a run writes it by hand. |

The split is derived, never restated. A hard-coded split once stood unchanged while a `scanner` check was added under it. This file's job is to not overstate coverage, so it prints the figure instead of remembering it:

```sh
python3 -c "import json,collections;d=json.load(open('skills/figma-components-audit/scanner/checks.json'));\
w=lambda o:[o['status']] if isinstance(o,dict) and isinstance(o.get('status'),str) else \
[x for v in (o.values() if isinstance(o,dict) else o if isinstance(o,list) else []) for x in w(v)];\
c=collections.Counter(w(d));print(dict(c),'total',sum(c.values()))"
```

The two file-level checks belong to `figma-foundations-audit` and are not in here. The dashboard's About tab renders `checks.json`, marking anything that is not `scanner`, so the page cannot claim coverage the scanner lacks.

A backlog entry closes in three steps: port the check into `scanner/audit.js`, flip its `status`, and confirm it against **two** libraries. One library cannot tell a real check from that library's own constant (case A57). Contrast (§3.7c) ranks first: it is the only missing check that is user-visible by definition.

This file stays the place that explains *why* each check exists and what it must not claim. It is prose about an executable, and holds no second copy of it.
