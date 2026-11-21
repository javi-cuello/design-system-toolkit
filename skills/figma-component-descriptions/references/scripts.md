# The scripts

How each step's script reaches Figma, what it takes and what it returns. [SKILL.md](../SKILL.md) says when to run each one; this file says how.

## Contents

- [Files](#files)
- [How a script reaches Figma](#how-a-script-reaches-figma)
- [enumerate.js](#enumeratejs)
- [consumer-usage.js](#consumer-usagejs)
- [composition.js](#compositionjs)
- [sections.mjs](#sectionsmjs)
- [apply.js](#applyjs)
- [sync-header.js](#sync-headerjs)
- [Verification](#verification)
- [Bridge traps](#bridge-traps)
- [MCP tools](#mcp-tools)

## Files

```
SKILL.md                              — orchestration, reporting rules
references/
  component-description-guide.md      — what to write, the same for every library
  subjects.md                         — discovery and step 2 in full
  scripts.md                          — this file
  quality-checklist.md                — the checks before reporting
scripts/                              — each a figma_execute body: fill its CONFIG, send the file
  enumerate.js                        — step 1 sweep, step 2e's bare pages, step 2c's virtual sets (read-only)
  sweep-diff.mjs                      — step 8, plain node: the re-run sweep against the targets
  consumer-usage.js                   — step 2f, run in the consumer file (read-only)
  composition.js                      — step 3, parts per variant across the whole set, and the interface (read-only)
  sections.mjs                        — step 5, plain node: the Behaviour and Composition lists, generated
  apply.js                            — step 6 batched write, clearing both fields on ""
  sync-header.js                      — step 7 header body write
  verify.js                           — deterministic verification, parameterized from the rulebook
tests/
  test-engines.mjs, test-verify.mjs   — plain node, against a fake file
  test-sections.mjs                   — plain node, against fixtures/
systems/                              — OPTIONAL local cache, generated, never shipped
  <library-name>.md                   — a library's discovered settings, privacy rulings and audit history
```

`references/` and `scripts/` are fixed content, the same for whichever Figma file the skill is pointed at. A library's settings live in the project's context document.

## How a script reaches Figma

Each script is short enough that the `figma_execute` call is the delivery. Read the file, fill its `CONFIG` from the rulebook and the run's ids, and send the whole body as the call's code.

Nothing is cached in the Figma file, so there is no copy there to drift: the file in `scripts/` is the single source. **Never retype the logic from memory or from an older transcript**. That is the copy that drifts. Each script's guards are exactly what a retyped version drops: variants are not components, and layers inside components are not page content or headers.

## enumerate.js

Step 1. Send it with `internalPrefix` and `separator` from the rulebook. It sweeps every page in one `figma_execute` call, rather than paginating a search.

| It returns | Holding |
|---|---|
| `pages` | Each non-empty page with its components (`id`, `name`, `type`, `descLen`) and step 2e's `alone` flag |
| `virtualSets` | Step 2c's groups: stem and members |

Variants are not listed, since a `COMPONENT` inside a `COMPONENT_SET` is not a separate component.

**Never judge a page's contents from `page.children` alone**. Libraries often wrap a whole page in one outer frame. The top level then shows one frame, with the components, header and tables inside it. The script uses `findAllWithCriteria`, which descends the full page. Reading only the top level makes a fully documented file look empty.

## consumer-usage.js

Step 2f. Send it through `figma_execute({ fileKey })` with the consumer file's key. It runs against a connected file without switching the active target.

It resolves every instance to its main; a variant counts as its set. It returns:

- `components`, most used first, each with its instance `count` and the `screens` it appears on (page › top-level frame)
- `broken`, the instances whose main Figma would not read

Then re-pin the library with `figma_navigate({ lock: true })` before writing.

## composition.js

Step 3, for full subjects only. **Never infer composition from one variant**. A part a boolean or axis reveals is absent where that axis is off, so reading `children[0]` under-reports. The script scans the whole set, deduping by variant *and* instance name, and keeps the per-variant counts.

Send it with `CONFIG.ids` set to the full-tier subjects. Save the result as JSON: it is step 5's input. For each subject it returns:

| Field | Holding |
|---|---|
| `variantCount`, `variantNames` | The set's variants |
| `parts` | The instances the subject places itself, each named by its main (or the main's set) |
| `properties` | The interface, with Figma's `#id` suffixes stripped |
| `sizes` | Each variant's width and height: a number where the side is fixed, `hug` where it grows |
| `broken` | Nested instances whose main does not exist or resolves to null (the latter with a `reason`) |

A part is marked `inEvery`, or lists the `variants` it appears in. It names the booleans that show or hide it (`toggledBy`) and the swap props bound to it (`swappedBy`).

`parts` never holds an instance inside a nested instance. That belongs to the nested component's composition, and its broken mains are that component's to report. A `broken` instance is reported, never ending the call and never vanishing.

The counts are the point. A part present in every variant is unconditional. One present in a subset is revealed by an axis or boolean, and Composition says so ("revealed by the `<Boolean>` prop"). Deduping by instance name alone loses this.

A component that pairs with another without nesting it belongs in Usage as a pairing. Composition is only for what the component contains.

## sections.mjs

Step 5. It prints the Behaviour and Composition lists per subject from the interface and step 3's result (toolkit-standard §D 23):

```sh
node skills/figma-component-descriptions/scripts/sections.mjs --composition <step 3 result>.json --settings <settings>.json --language <language>
```

The settings file is what `node tools/snapshot/projects.cjs settings <project> <fileKey>` prints. It holds the state and disabled axes, and the resting state as the first option of the state axis's recorded order.

| Flag | When | Effect |
|---|---|---|
| `--recipes <file>` | The component is a screen template (a stored screen is built on it) | A generated Usage line names the reference screens, from `tools/snapshot/recipes.cjs`'s output for the project. Your Usage lines go below it. |
| `--separator <separator>` | A virtual set (step 2c) | Its members come back as one entry (`ids`, `members`), the union of their lines. A line only some members have names the subpart ("in the `Default` subpart"). |
| `--check <file>` | Step 8 | Checks the applied descriptions against the generated lines |

An axis that switches a side between fixed and growing gets a generated line giving each option's size. With `--recipes`, the reference screens follow the snapshot rather than a hand copy.

**Paste each subject's `markdown` into the description as it stands**. Never reword a generated line. If one reads wrong, the fix goes in the script, so every description gets it.

For a virtual set, paste the one entry into every member, and write the purpose paragraph for the group.

The `gaps` list names what the source could not settle. Examples are what a boolean with no nested component shows, runtime behaviour the code owns, and which variants show a part no axis condition selects. Write one line for each. A gap that names a defect (a single-option axis, a broken instance) goes in the report, and stays out of the description.

The generated lines are English. For another language, write both lists by hand.

## apply.js

Step 6. For one component, `figma_set_description` is fine. Beyond about three, send `apply.js` through `figma_execute`, which applies and verifies in one round trip.

- Send it with `CONFIG.docs` as `[id, markdown]` pairs. Keep batches to six to nine, so the payload stays small and a failure does not force re-running a large batch.
- It reads each write back, and returns one row per pair: `ok` with the stored length, or the error. A missing id never stops the batch.
- Figma's harmless rewrites still read as `ok`. It drops trailing spaces and blank lines, and makes a `* ` bullet at a line's start `- ` (outside code).
- Anything else stored differently is `ok: false` with the whole `stored` text. An example is the backslash Figma doubles in an escaped `\|`. The node now holds `stored`: re-apply corrected text, without the escape, before moving on.
- An `ok: false` whose `stored` differs only in list markers (`+ `, `1)`) is Figma's rewrite, not a loss.
- A hard line break (two trailing spaces) does not survive, so never write one.
- Members of a virtual set all receive the same string.

Re-read what was written before moving on. Text assembled in code can pick up stray characters that the write itself reports as a success.

**To clear a description, set both fields**. Setting only `descriptionMarkdown` may leave the plain-text `description` intact. Given the empty string, `apply.js` clears both.

## sync-header.js

Step 7. Many libraries put a documentation header on each component page: an instance carrying a heading and a short paragraph. Where one exists, it must not drift from the description on the component.

**Write the description's first sentence into the header's body field, and only that sentence**. The header introduces; the sections belong in Figma's description panel.

Send it with `headerName` and `headerBodyLayer` from the rulebook, and `CONFIG.docs` as the `[componentId, markdown]` pairs just applied. It finds the header by name at any depth, never by position, and skips layers inside a component. It writes the first sentence with its backticks stripped, since canvas text renders no markdown. It returns one row per page:

| Row | Meaning |
|---|---|
| `written` | Done; with `drift` when it replaced text the new sentence does not start with |
| `no header` | The page has no header |
| `no body layer` | The header has no body layer |
| `mixed font` | The body is mixed-font text, which throws; skipped rather than aborting the batch |
| `not written` | Components on one page carry different first sentences |

- Only touch pages that already have a header. Never create one: a missing header or body layer is a report line, not a repair job.
- The `inComponent` guard is not optional. A real component can contain a layer sharing the header's name. A plain lookup by name matches it, and writes the purpose sentence into the component's own internals.
- For a virtual set, the header takes the shared first sentence. It names the group ("A top bar sits at the top of a screen"), never one subpart. The script writes it once per page.
- A `drift` row is drift that was already there between canvas and panel. Report it.

## Verification

Step 8 has three checks, in this order.

**1. The generated lines**. Run `sections.mjs` again with `--check <file>`, a file mapping each subject's id to the `descriptionMarkdown` just applied. It fails, naming every generated line a description lacks or reworded. With `--separator`, it holds each virtual-set member to the union.

**2. `verify.js`**. Send it through `figma_execute` against what was just written, with its `CONFIG` filled from the rulebook.

- It checks structure, headings, punctuation, the purpose paragraph, and that every interface axis is mentioned.
- Its `CONFIG` carries no defaults. A check whose setting is absent does not run, rather than borrowing another library's value.
- A layer that throws "does not exist" is skipped and listed by id in `brokenInstances`. It counts as inside a component, so it is never taken for loose page content.
- Any other error ends the check. A guard that swallowed it would report a fault in the script as a clean result.
- Its `virtualSets` lists every virtual set with its members, and `shared: false` where they do not hold byte-identical text.

**3. The sweep diff**. Re-run step 1's sweep, save its result, and diff it:

```sh
node scripts/sweep-diff.mjs <sweep.json> --against <targets.json> --internal-prefix <prefix>
```

The targets are every id the run wrote. The `--check` map serves when it holds the compact ones too. URL-form ids (`1-2`) are read as node ids.

| Flag | Use |
|---|---|
| `--exclude <ids.json>` | What the run left out on purpose: step 2b's slot fillers, a recorded ruling |
| `--scope <page>` | Once per page, when the run covered only some pages |

| Output | Meaning |
|---|---|
| `missed` | A public component the run did not write; exits 1 |
| `outOfScope` | A target with its reason: not a component in the sweep (a variant, a deleted node, another file's id), outside `--scope`, or named by `--exclude` |
| `missedPrivate` | Untargeted private components |
| `excluded` | What `--exclude` named |
| `unsure`, `onAlonePages` | Components on an `alone` page, which step 2e keeps only if something uses them |
| `unknownScope` | A `--scope` page the sweep never saw; exits 1, since a misspelt page makes an empty run look clean |

An input it cannot read, or a flag with no value, exits 2 in one line. **Never diff the two lists by eye**: a missed subject among dozens does not stand out.

## Bridge traps

- **A call that times out**. Probe with `figma_get_status({ probe: true })` before assuming the connection dropped. A healthy probe beside a hung call means the tool is at fault, not the transport.
- **The target missing from the connected list**. The plugin closed in that file: stop, and ask for it to be reopened. A pinned file that disconnects releases its pin. Later writes then land silently in whichever file is active.
- **`figma_search_components({ query: "" })`**. It can hang for minutes on a large library while the connection stays healthy. Never enumerate with it; keep it for looking up a few named components.

## MCP tools

| Tool | Used for |
|---|---|
| `figma_list_open_files` | Listing connected files before assuming the target (step 0) |
| `figma_navigate({ url, lock: true })` | Confirming and pinning the target before writing (step 0) |
| `figma_get_status({ probe: true })` | Checking the bridge responds, before a run and after any failed call (step 0) |
| `figma_execute` | Enumeration (1), inspection (3), batched writes (6), header sync (7), verification (8) |
| `figma_get_component_details({ componentKey })` | Axes and existing description for one named component |
| `figma_set_description({ nodeId, description, descriptionMarkdown })` | Applying one component's description |
