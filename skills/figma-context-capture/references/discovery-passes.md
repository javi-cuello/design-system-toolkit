# Discovery passes

The read-only passes that steps 3 and 4 of [SKILL.md](../SKILL.md) run, what each script returns, and what to record from it.

## Contents

- [Before any pass](#before-any-pass)
- [Confidence tags](#confidence-tags)
- [Pass A — Identity and inventory](#pass-a--identity-and-inventory)
- [Pass B — Naming conventions](#pass-b--naming-conventions)
- [Pass C — Token scales and vocabularies](#pass-c--token-scales-and-vocabularies)
- [Pass D — States, axes and sparse grids](#pass-d--states-axes-and-sparse-grids)
- [Pass E — Description dialect](#pass-e--description-dialect)
- [Pass F — Documentation apparatus](#pass-f--documentation-apparatus)
- [Pass G — Accessibility and annotations](#pass-g--accessibility-and-annotations)
- [Pass M — Maintainer-only facts](#pass-m--maintainer-only-facts)
- [Pass S — Source or foundations library](#pass-s--source-or-foundations-library)
- [Cross-file passes](#cross-file-passes)

## Before any pass

Every pass is **read-only**: nothing in this skill ever writes to a Figma file.

**Call sizing is a hard rule**, learned from a bridge crash:

- Run passes as small, single-file `figma_execute` calls with an explicit `fileKey`.
- Never combine page loads (`loadAllPagesAsync`, `page.loadAsync`) or `mainComponent` walks with `figma_execute_across_files`. Parallel heavy calls can crash the Desktop Bridge.
- Cross-file parallelism is only for light reads that load no pages.
- Batch per page group, with a timeout of 20000–30000.
- After any failed or hung call, run `figma_get_status({ probe: true })` before retrying.

**The sandbox accepts modern JavaScript**, verified on Desktop Bridge plugin 1.39.0. That covers arrow functions, block-scoped declarations, template literals, spread, destructuring, nullish coalescing, optional chaining, classes and `globalThis`. The scripted passes are written in ES5 and stay that way, since they work, but new code need not be.

**Most passes are scripts** in `scripts/`. Never retype them, and never count by hand what a script counts (toolkit-standard §D 23).

| Pass | Script | Where it runs |
|---|---|---|
| A | `pass-a-inventory.js` | `figma_execute` |
| B | `pass-b-naming.mjs` | node, over A's and D's output |
| C | `pass-c-libraries.js`, then `pass-c-scales.mjs` | `figma_execute`, then node |
| D | `pass-d-axes.js` | `figma_execute` |
| E | `pass-e-descriptions.js` | `figma_execute` |
| F and S4 | `pass-f-doc-apparatus.js` | `figma_execute` |
| S1, S2, S3 | `pass-s1-collections.js`, `pass-s2-primitives.js`, `pass-s3-styles.js` | `figma_execute` |
| Registry | `registry.mjs` | node, over A's and C's output |

- A `figma_execute` script is the call's body. Read the file, fill its `CONFIG` where it has one, and send the whole body as the code.
- They are short enough that the call is the delivery. Nothing is cached in the Figma file, and the script is the single source.
- A node script takes the earlier calls' results, each saved as a JSON file and passed by path.
- `tests/test-passes.mjs` runs all of them against a fake file.
- What is left for you is judgement over what the scripts return, and pass M's questions.

## Confidence tags

Each pass ends with **what to record** and its tag. Three tags are used throughout the output:

| Tag | Meaning |
|---|---|
| `[confirmed]` | Read directly from data, with the evidence noted |
| `[inferred]` | Derived from a pattern, such as a majority spelling; cite the sample size |
| `[TBD]` | Not discoverable, or contradictory; it becomes an open question |

Never promote `[inferred]` to `[confirmed]` because it "looks obvious". A wrong value here bakes errors into every later skill run against the project.

## Pass A — Identity and inventory

Send `scripts/pass-a-inventory.js` after `figma_list_open_files`, `figma_navigate({lock:true})` and `figma_get_status({probe:true})`.

- It returns `fileKey` and `fileName`.
- Per page it returns `sets`, `comps` (variants are not counted), `described`, the flat `names` list, and `setIds`.
- `setIds` holds each component set's `{ name, id }`, which pass D takes as its `CONFIG.ids`.
- Never judge a page from `page.children`. Libraries wrap pages in one outer frame, and `findAllWithCriteria` descends fully.

**Record:** fileKey, file name, page inventory, component and set counts, description coverage ratio, all `[confirmed]`. The name list feeds passes B and D.

## Pass B — Naming conventions

Run `scripts/pass-b-naming.mjs` in node: `<pass-a.json> [<pass-d.json>]`. It counts:

- each leading mark, with its pages and examples (`recordable` at three or more);
- the stems that two or more siblings share, per candidate separator;
- every name carried both prefixed and bare (`contradictions`);
- the layer endings found in two or more of pass D's sampled sets. Pass D returns each set's first-variant layer names.

What it cannot decide is yours:

| Convention | Rule |
|---|---|
| Internal prefix | A candidate mark (`_`, `.`, `Internal /`, `🔒`…) needs ≥3 components, which the script marks recordable. It must also correlate with *not being consumed as a top-level subject*. Spot-check 2–3: are they nested inside other components' instances? One prefixed component alone is `[TBD]`, not a convention. |
| Virtual-set separator | Names sharing a stem before the separator (`Top bar / Default`, `Top bar / Main`). It needs at least one group of two or more siblings. A lone slash-name is not evidence. |
| Suffixes | Recurring layer endings (`-icon`, `-label`), from the 3–5 sets pass D sampled. A suffix in one set alone is not listed. |

**Record:** prefix, separator and suffixes, each with example names as evidence. A contradiction, such as the same child prefixed on one page and bare on another, goes to open questions verbatim. That is a maintainer ruling, never a guess.

## Pass C — Token scales and vocabularies

### Reading the libraries

Enumerate **source libraries**, never just imported variables. `getLocalVariablesAsync` returns only what the file happens to use, so gaps are guaranteed. Send `scripts/pass-c-libraries.js`. It returns:

- each consumable collection's `key`, `name`, `library`, `count`, and up to 400 variable `names`;
- `truncated`, true when that cap bit. A scale read from a truncated list must not be recorded as complete;
- the file's own name (`file`), and its `localCollections`, each with its mode count, `count` and `names`.

A library that is its own source has no library collection: its scales are in its locals. `pass-c-scales.mjs` reads those as the library named `file`. An output without `file`, read with `--tokens`, reads nothing and says so.

**When `getAvailableLibraryVariableCollectionsAsync` exceeds the timeout**, do not keep retrying. On one 49-page consumer file it failed three times at the 30000 ms ceiling while the bridge probed healthy in 6 ms. Capture the same structure from the **source** file with pass S, which reads local collections directly and makes no network call.

- What you lose is only the consumer-side *symptom*: a hidden collection enumerating 0.
- The mechanism itself shows in pass S as per-variable `hiddenFromPublishing`.
- Say which of the two you actually observed.

### Counting the scales

Run `scripts/pass-c-scales.mjs` in node over pass C's saved output: `<pass-c.json> --tokens <tokens.json>`. The second file is the **source library's stored snapshot tokens**: `tokens.json` in its snapshot store (`tools/snapshot/store.cjs`). Take a snapshot of the source first if it has none.

**A name's number is not its value.** `Spacing/4` may be 16px and `space/100` 8px, and the audit compares raw px. Pass C's library read returns names only, so px come from the snapshot and from nowhere else.

### How a collection joins the snapshot

Each pass C collection is looked up only in the snapshot collection of its own name, owned by its own library's source file.

- **The join is by file name.** Pass C gives a collection's `libraryName`, the library file's name, and never its file key. The snapshot source whose `file` equals it is taken as that library.
- A library renamed since its snapshot matches nothing until it is snapshotted again.
- A same-named variable in another collection, or another library's same-named collection, is never read.
- A collection that more than one source owns is read from the library's own copy. That is the shown copy when its source wrote it last (highest `seq`). Otherwise it is the copy the store keeps under `shared.collections[name][source]`.
- A store that names no copy as the library's (from before `shared`, or a tie) is not read.
- Every source carrying the library's file name is considered.
- A matched collection's names come from the snapshot, which is complete, not from pass C's list, which is capped at 400.

Each collection that did not match is listed in `notInSnapshot`, with why and the snapshot's source files. `shared: true` marks one whose reason is shared ownership.

- **Resolve every `notInSnapshot` entry**, with the right store or a fresh snapshot. Otherwise record its scale as `[TBD]` in the Tokens prose.
- While any collection is unmatched, never record what matched as the whole scale.
- When nothing matched at all, `audit` is null, `auditWhy` says why, and the command exits 1.

### What the script returns per family

Per collection it lists every family with two or more numbered names, matched without case. Given `--tokens`, a family with two or more numeric values counts too. Each family carries:

| Field | What it holds |
|---|---|
| `nameSteps` | The numbers read from the names (`4px` reads 4, `-4` reads −4) |
| `px` | The union of every mode's resolved values |
| `pxByMode` | Each mode's own list; a density collection's Compact and Comfortable both belong on the scale |
| `gaps` | Jumps larger than the step on both sides, in each list. "0–32, no 10" is a finding |
| `steps` | Where the step changes |
| `unparsed` | Names that are not a plain number (`0-5`, `full`) |
| `notNumeric` | Values that are no number (`"1rem"`, null, an alias the snapshot did not follow), each with its mode |
| `kind` | Read from whole words of the family's name |
| `complete` | False when the names are pass C's truncated list |

- A missing first or last step cannot be seen, and is never reported as a gap.
- Never record a scale with `complete: false` as complete. Say it was truncated, or take a snapshot.
- Families that are not scales but may hide one go to `skipped`, with what they hold. Examples: a lone `Radius/8`, mostly unparsed names, or a spacing or radius family with no number (`Radius/sm`, `md`, `lg` with no snapshot).

Beside the families it gives:

- the grammar's **structure**: the separator, how many names carry each slot count, and each slot's values with counts;
- the `colour`/`color` counts in `spelling`, with their tag;
- `audit`: `{ spacing, radius }`, from px only. A kind with no values is left out, never written as `[]`.

The `audit` block goes into the context document's audit-settings, `libraries[<fileKey>].tokens`, for each component file that consumes this library. The audit's scanner reads it as `TOKENS.spacing` and `TOKENS.radius`.

**Without a snapshot**, `audit` is null:

- Leave `spacing` and `radius` out of the audit-settings JSON, so the audit skips its on- or off-scale verdict.
- Put `[TBD — px from the source's snapshot]` in the Tokens prose.
- Record the name steps as name steps, never as the audit's scale.

### What stays yours

Never read a scale off the name list by eye. One missed name records a false gap, which then flags every legitimate use of it. What the script cannot decide is yours:

- whether each `kind` is right; a family it could not name is in no `audit` list;
- whether a gap or a step change is intended;
- what an unparsed step or a non-numeric value stands for;
- the colour role vocabulary, read from the grammar's slot values.

**Slot names are asked, never invented.** The slots' official names are maintainer convention, not derivable from data. Record slot vocabularies with placeholder labels tagged `[TBD — confirm official slot names]`, and ask at the step 5 summary. A wrong invented label, such as calling the Element slot "Type", spreads into every downstream document.

- **Spelling** comes from the script's `spelling`: a majority is `[inferred]`, unanimity `[confirmed]`, and a tie is asked.
- **Mode names** (light, dark) are not in pass C's library output; its local collections carry only a mode count. Pass S1 on the source returns them in order.
- **Collection identity is the key**, never the name, since names collide across libraries.

**Record:** collection keys and names, scales, grammar, spelling, modes, and local collections (legitimate unless default-named). This section doubles as the evidence for the library dependency graph: which upstream libraries this file consumes.

## Pass D — States, axes and sparse grids

Sample 3–5 interactive component sets (buttons, inputs, checkboxes), picked from A's `setIds`. Send `scripts/pass-d-axes.js` with their ids in `CONFIG.ids`. Per set it returns:

- the `axes` in authored order, each with name, type and options;
- `variantCount`, and `fullGrid`, the product of the variant axes' option counts;
- an `error` row, rather than a dropped row, for an id that is not a set or a set Figma refuses to read ("existing errors").

Derive from it:

- the state option set, and its **order as authored**;
- the axis ordering pattern: is State last? Size first?
- the boolean naming style;
- the sparse-grid stance. A `variantCount` below `fullGrid` is a sparse set.

Consistent sparseness is a house convention, `[inferred]`. An example: `Disabled=True` pairs only with `State=Rest`, across every sampled set. A single sparse set among full ones is an open question, not a stance.

**Record:** state vocabulary and order, axis grammar, and the sparse stance, with the pairing rule spelled out and the sets that evidenced it.

## Pass E — Description dialect

Send `scripts/pass-e-descriptions.js`. An empty `CONFIG.ids` samples the first three described components; or fill it from A's ids, a private one among them.

- It reads `descriptionMarkdown`, never `description`, which strips markdown.
- Per component it returns the headings as written, the bullets and how many end in a full stop, and spelling pairs counted (`colour`/`color`…).
- Read off from it the heading spellings, the dialect, the punctuation habit, and whether private components carry compact descriptions.

It also returns `headerCandidates`: on the first sample's page, instances **outside any component** whose name says header. Each comes with its main component and text-layer names.

- Which one is the canvas documentation header, and which is its body text layer, is yours to decide.
- Say plainly it was checked on one page. Header conventions can be page-specific, so tag it `[inferred]`.

If no component carries a description, every field here is `[TBD]`. The summary then says the description settings will be set by the *first* figma-component-descriptions run, not by this capture.

## Pass F — Documentation apparatus

Optional per file. Run it only when the registry says the file plays a doc role, or pass A's page names suggest one (`Documentation`, `Tokens`, pages named `1 - Colour - …`).

**Doc components present?** Send `scripts/pass-f-doc-apparatus.js` after `const TOKENS = …;`. That constant is the library's settings as `node tools/snapshot/projects.cjs settings <project>` prints them. Its `pageSectionComponent` and `ratiosGrid` name the section header and the contrast matrix.

- Per name in the doc-generator contract (`Table - `, `Section header`, `Row - `, `Cell - `, `Preview - `), it counts local components, instances and remote instances. Remote instances come with their library components' keys.
- It also returns the page names, and the `_Ratios grid` instances per page.
- Present as local components: this file is a doc component library candidate.
- Present as instances: a previous generation ran here, so it is a target candidate.
- Record which.

**Doc-generator plausibility.** A file holding *only* its own styling primitives as collections, plus the full doc name contract, is a doc library, not a source. Record that explicitly. It keeps the classic failure out of reach: documenting the doc library's own variables.

**Properties table: not profiled here**. Profiling stores its config in the file, and this skill never writes to Figma. `figma-properties-table` profiles a file on its own first run. Record only whether the doc-generator's `Table - ` components or instances are present, so the doc role is known.

**Existing generated pages.** These hold the doc-generator's two sticky formatting decisions; capturing them stops a later refill silently flipping every value.

- Read one Line-height cell per text-style frame group: `%` means as-authored units, a bare number means converted.
- Read one colour cell for its format: hex, rgb or oklch.

## Pass G — Accessibility and annotations

A light touch.

- **Stated minima:** search page and section names, and any style-guide text nodes, for WCAG mentions. Found: record them. Not found: record "WCAG 2.2 AA fallback `[TBD — confirm with maintainer]`".
- **Annotations:** run `figma_get_annotations` on one or two state-bearing sets. Record only whether the library uses Dev Mode annotations at all: yes, no or sparse.

## Pass M — Maintainer-only facts

**This pass runs no code.** Its items are invisible to every Figma read, and cannot be inferred from a sample, a majority or a pattern. They are a pass because their failure mode is silence. Without a prompt, a capture simply omits them, and the document looks complete.

Ask them all at the step 5 summary, in one block. Each defaults to `[TBD]` if the maintainer does not know.

| Item | Ask | Push for |
|---|---|---|
| Lifecycle and status | What statuses exist, and what moves a component between them | **What each status exempts from audit**. Maintainers give the ladder and omit the consequence, which is what downstream skills act on |
| Versioning and deprecation | How the library versions, and when deprecated things are removed | **How a deprecation is marked inside Figma**. It is the only part with a mechanical trace: ask for an example component and verify the marking on it |
| Platforms and parity | Which platforms ship, and where they may legitimately diverge | Skip it entirely for a single-platform project, rather than recording "n/a" |
| Governance | Who may change the library, who may issue a ruling, how a change reaches published | — |
| Screens | Only where the project registers a screens file: screen types, each one's template, the states each must cover, where the shell config lives | Never what a screen contains |

- What a screen contains is derived from the stored screens (`recipes.cjs`, `get_screen_recipe`), and a copy here would drift.
- A state the stored screens show, such as a frame named `… - Empty`, is a hypothesis to put to the maintainer, never the answer.

**The trap: file evidence that looks like an answer**. Examples: a page named `WIP`, a component prefixed `[deprecated]`, two libraries that look like a web and native pair. Each is a *hypothesis* to put to the maintainer, never a finding.

- Record it as `[TBD]` with the observation attached: "`Deprecated` page exists — is this the marking convention?"
- This matters more here than anywhere else. An inferred naming convention is wrong about a name. An inferred deprecation convention makes later skills silently ignore live components.

**Record:** each answer, or `[TBD]` with where it resolves. Answers here are `[confirmed]` with "maintainer-stated" as evidence. Any answer that overturns a house default becomes a §6 ruling, with the maintainer named in **Decided by**.

## Pass S — Source or foundations library

Pass S replaces C–F when the captured file IS the variable source. Pass C reads a library **from the outside**, by team enumeration, and is blind to anything `hiddenFromPublishing`. Pass S reads from **inside**: the only vantage point that explains publish visibility, modes and internal token structure.

### S1 — Local collections, modes, publish mechanics

Send `scripts/pass-s1-collections.js` in the source file. Per local collection it returns:

- its `key`, `name`, `modes` (the names, in order) and `count`;
- `unread`: variables that would not read, counted rather than dropped;
- `hidden`: where hiding lives, as the table below says.

| `hidden` | Meaning |
|---|---|
| `"collection"` | The collection itself is hidden from publishing |
| `"every variable"` | Every variable is hidden, one by one |
| `"some variables"` | Some are hidden; `hiddenVariables` names them |
| `"none"` | Nothing is hidden |

The script reads; the meaning is yours. Record per collection its key and count, and:

- **Mode names**, since they are architecture. `Light/Dark` means theming; brand or vertical names mean multi-brand switching; a single default mode means plain values.
- **Where hiding lives**: on the collection, or per variable with `hiddenFromPublishing`.
- A collection that enumerates as 0 from a consumer file but holds N variables here, all hidden, is *deliberately internal*. Record that as the mechanism behind a semantic-only consumption rule.
- Note it for variable-audit too: bindings into such a collection are defects.

### S2 — Inside the hidden primitive collections

Send `scripts/pass-s2-primitives.js` after S1. It reads each hidden collection, or those named in `CONFIG.collections`, and returns:

- the ramps, which are variables grouped by parent path;
- each ramp's steps in library order, and their count;
- the steps carrying a marker, and the alpha ramps;
- `stepCounts`: how many ramps have each length.

Derive the grammar from it:

- the step count per ramp, such as 12-step;
- what the **anchor or source markers** mean (`8-anchor`, `7-source`): brand colours verbatim at that step;
- the alpha ramps (`Alphas/A0..`), and per-vertical brand families.

These feed later scale and contrast-matrix work. Capture the grammar, not every value.

### S3 — Styles

The non-variable half of the source. Send `scripts/pass-s3-styles.js` in the source file. It returns:

- `text` and `effect`: each one's style `names` in library order, their `count`, and `groups`, the distinct first segments in first-seen order;
- a cap of 400 names, with `truncated` saying when it bit;
- the `paint` and `grid` style counts.

Record the text-style **group names verbatim**, since they drive the doc-generator's per-group unit rule. Record the role and size grammar with its suffixes, and the effect-style taxonomy, too. Those are your reading of the names.

### S4 — Documentation state

Send `scripts/pass-f-doc-apparatus.js`, pass F's script.

- Compare its page names against the doc-generator's page contract: one page per collection, `Shadows`, per-group `Text styles - *` pages, numbered section frames. The comparison is a read, because the contract is the doc generator's own.
- If it matches, record that later doc-generator runs are **refills, not first generation**.
- Its `furniture` counts say whether the doc furniture instances are **remote**. If they are, their source library is the doc component library: record it in the registry, with the keys as evidence.
- Its `ratiosGrid` says whether `_Ratios grid` (contrast matrix) instances exist yet on the primitive colour page. Absent is a useful "not built yet" fact.

### S5 — What not to run here

Passes B, D and E target component conventions. They usually have nothing to bite on in a source file, which has no component sets. Run them only if pass A found local components.

## Cross-file passes

When several files are captured in one engagement:

- **Registry.** Run `scripts/registry.mjs` in node, with each file's pass A output and its pass C output after `--c`. It prints the template's §2 rows, one per file. Each role is a proposal from the inventory, tagged `[inferred]`, with audience `[TBD]`.
- Correct each role from the evidence (pass F's findings, pass C's consumed libraries) at the step 5 summary. A role is never silently assigned.
- **Dependency graph.** The same command prints the dependency line. File X consuming collections whose `libraryName` is file Y gives the edge Y → X, with the collection **keys** behind each edge.
- **Shared conventions.** A convention goes in the shared section only when it is independently evidenced in **every** captured library.
- Anything true in one library and unchecked in another stays in that library's own section. Copying a convention "because they're the same project" is the cross-library contamination the downstream skills warn about.
