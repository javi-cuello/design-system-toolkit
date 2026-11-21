# Running the scan and the probes

How a session runs the scanner and the probes through the Figma bridge, the scope every count obeys, and the tools it uses. [SKILL.md](../SKILL.md) step 3 and *Session probes* point here.

## Contents

- [Running the scanner](#running-the-scanner)
- [Scope and usage counts](#scope-and-usage-counts)
- [Session probes](#session-probes)
- [Loading the probes](#loading-the-probes)
- [A composed frame](#a-composed-frame)
- [Tools](#tools)
- [Bridge traps](#bridge-traps)

## Running the scanner

Execute `scanner/audit.js` through `figma_execute`, with three constants prepended. The first is `const TARGETS`. The other two, `const SCALES` and `const TOKENS`, are pasted exactly as this command prints them:

```sh
node tools/snapshot/projects.cjs settings <project> <fileKey>
```

It prints the library's settings merged over the house defaults, flat, with the derived values filled in.

- **Batch the calls per page group**, every variant, about 100–150 variants per call, with a timeout of 20000–30000.
- **Never re-implement its checks**, and never compose a walk from [scanner-checks.md](scanner-checks.md), which documents why each check exists. A walk composed by hand drops checks silently, and a second implementation drifts from the first.
- **With no `figma` in scope**, the body returns `checkFacts`, its pure half. That is how `tests/test-audit.mjs` drives the checks in node.
- **A `settings` list in the result** names a setting the scanner ignored as invalid. An example is a `spacing` or `radius` that is not a list of numbers. Say so in the report and fix the context document, since the check it feeds did not run.
- **Collect candidates across every dimension**: tokens, naming, schema, states, accessibility, metadata, structure, detached instances, annotations, hidden and orphan layers, and reporting hygiene.
- **Right to left** is checked too where the project names `rtlLanguages` ([scanner-checks.md](scanner-checks.md) §3.12).

## Scope and usage counts

**Every count obeys the scope in the closing metrics block, style and token usage counts included**. A component-library file holds far more than its components. Documentation furniture, examples, matrices and page headers all carry real styles and bindings, and a file-wide `findAll` sweeps them in. That can make a style used only on documentation cards look like an ungoverned style at scale. The same sweep can also miss a style the components really use.

**Check the distribution before believing a usage count**. Roughly equal hits on every page is furniture repeating per page. Real component usage is lumpy, concentrated in the sets that need it. When a count looks suspicious, resolve each node's nearest component-set ancestor: a node with none is not a component's usage.

## Session probes

Everything deterministic a session does beyond the scan is one file of `FCA.*` functions, `scripts/probes.js`. It holds discovery (scanner-checks §0.5), the probes for each check `checks.json` marks `backlog` or `session`, and the whole-library schema sweep. It also holds the composed-frame check and the fix recipes.

A check the scanner runs is never a probe too: contrast, target size and an empty or placeholder description belong to the scanner alone. The reference [scanner-checks.md](scanner-checks.md) names the function under each section and says why it exists.

**Call a probe; never retype one from the prose or hand-write a walk it already does**. Faced with a large paste, writing the logic by hand looks safer. It is the failure this file exists to prevent, because it brings back defects the engine no longer has.

What stays with the agent is skill-standard §A clause G's boundary:

- Every probe returns **candidates** for [judgment-protocol.md](judgment-protocol.md) §2.
- Project words come from the context document: the state axis and its values, slot and part names, minima, and the component-page filter. A probe given none skips rather than guessing.
- Fixes run only after approval.

`tests/test-probes.mjs` runs every probe over plain objects in node; the live calls are only syntax-checked.

## Loading the probes

Load the file once per Figma file, then bootstrap each call. The source caches itself in `figma.root` plugin data, under `fca.probes.v1` with its hash in `fca.probes.hash`. Check there before pasting.

1. `node skills/figma-components-audit/scripts/probes.js` prints the expected hash.
2. On the first call in a file, or after the bootstrap reports stale, send one `figma_execute`. It holds `globalThis.__FCA_EXPECT = "<hash>";`, then the file, then `return globalThis.__FCA_LOADED;`.
3. Comments may be stripped from the file, since the hash ignores them and all whitespace. The call returns `{ hash, expected, cached }`.
4. **The hash gates the write**. A mismatch, or no expectation, caches nothing, so a corrupt transcription is refused rather than reused by every later session. Paste again until `cached` is `true`.
5. Every later call, in this session or another, starts with the bootstrap and then calls a probe:

```js
const want = "<hash from step 1>";
if (figma.root.getPluginData("fca.probes.hash") !== want) return "probes absent or stale: paste scripts/probes.js";
(0, eval)("(" + figma.root.getPluginData("fca.probes.v1") + ")")();
return FCA.textCoverage(await figma.getNodeByIdAsync("<set id>"));
```

A changed `probes.js` changes the hash, so the bootstrap refuses a stale cache rather than running the last version's probes.

## A composed frame

A screen composed from the library, by an agent or by hand, is not a component, and the scanner does not read it. Asked to check one ("is this frame all library?", or at the end of composing one), call `FCA.composedFrame(frame)` after the bootstrap. It names every raw layer, unbound value, orphaned instance and detached copy in what was composed.

It also counts what it judged (`checked`). So the Adoption score widget can score a whole file from it. It scores the frame and its templates' slot contents, never what the library drew ([scanner-checks.md](scanner-checks.md) §3.13). Its findings go to the composer as a list, not into the library's record.

Check an agent's frame with `{ receipt: true }`. A frame with no receipt, or with one naming no reference screen, is a finding. The receipt is shared plugin data `fca` / `receipt`, readable through any bridge.

Before composing, `FCA.references(template)` lists every screen in the file built on the template, so the composer starts from the closest (figma-prototype, *Compose*). A variant is read as its set. Prototypes, the frames already carrying a receipt, come last.

## Tools

| Tool | Use |
|---|---|
| `figma_list_open_files()` | List the connected files before assuming which is the target. |
| `figma_navigate({ url, lock: true })` | Confirm and pin the target library. Run it again if the connection silently switches files. |
| `figma_get_status({ probe: true })` | Check the bridge is responsive, not just open, before a run. It is cheap, and catches a stale or switched connection early. |
| `figma_execute({ code, timeout })` | Runs `scanner/audit.js` and the probes in `scripts/probes.js`. |
| The project service's `POST /exec` | The same, when figma-console has no file connected but the dashboard does (`tools/figma-audit/REFERENCE.md`, *What it exposes*). |
| `figma_get_annotations({ nodeId, include_children, depth })` | Variant annotations (dimension 9), which `figma_execute` cannot reach. |
| `figma_get_annotation_categories()` | Category ids, needed before writing a new annotation. |
| `figma_set_annotations({ nodeId, annotations })` | Only after explicit approval of the exact values. Never invent a timing or cursor value ([judgment-protocol.md](judgment-protocol.md) §4). |
| `figma_get_file_data` | Not for a component subtree. Its `depth` counts from the document root, and it rejects `0` though it advertises it. Read a component with `figma_execute` or a component-level tool. |

Token discovery reads the complete library, not just what the file imported. `FCA.discover()` calls `figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()` and `getVariablesInLibraryCollectionAsync(collectionKey)` to do it.

## Bridge traps

- Use the async API only, such as `getLocalVariableCollectionsAsync`.
- Call `await page.loadAsync()` before `findAllWithCriteria`.
- A collection's identity is its **key**, never its name.
- After a connection error, run `figma_get_status({ probe: true })` again before retrying. The connection can switch files silently when more than one Figma tab runs the bridge plugin. The audit would then report against the wrong file.
- A timeout means the bridge stopped waiting, not that Figma stopped the code. A write may still land, so read again before retrying one.
