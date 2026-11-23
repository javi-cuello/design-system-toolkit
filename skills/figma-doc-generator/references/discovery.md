# Roles, the bridge and discovery

Steps 0 to 2 in full. They settle the three roles, keep the bridge on the right file, find the doc components and read the source library. [SKILL.md](../SKILL.md) gives each step's action; this file gives its rules and reasons.

## Contents

- [Step 0: the three roles](#step-0-the-three-roles)
- [Step 0.1: the bridge](#step-01-the-bridge)
- [Step 1: doc component keys](#step-1-doc-component-keys)
- [The name contract](#the-name-contract)
- [Two discovery traps](#two-discovery-traps)
- [Step 1.1: fonts](#step-11-fonts)
- [Step 1.2: the probe](#step-12-the-probe)
- [Step 2: the source library](#step-2-the-source-library)
- [Variable binding by scenario](#variable-binding-by-scenario)

## Step 0: the three roles

The roles never come from the file active in the bridge. That file is as likely to be the doc component library, or something unrelated. Take them, in order of preference, from:

1. the user's message
2. the context document's registry for this file key
3. discovery inside a file the user named
4. an explicit answer

All three roles may point at one file, or any two may. Extract each file key from the URL segment after `/design/`.

| Case | What the user gave | What to do |
|---|---|---|
| **A** | Exactly one file: a URL, or a name that matches one file | That file is the source **and** the target. State it in one line and continue |
| **B** | Two or three files with roles ("document X into Y") | Use them as stated, and confirm the mapping in one line |
| **C** | No file, or a mapping that is unclear | Ask, but only for the roles still open |

**Case A**. Do not ask about either role. Say *"Documenting {file}'s own collections and styles into {file}"*, and go on. Step 1's discovery then finds the doc component library. It becomes a question only if every route fails.

**The plausibility check (case A)**. Run it right after pinning the bridge (Step 0.1). The named file must hold something to document: at least one local collection, text style or effect style. Two results mean it does not look like a source:

- It holds none of those.
- It *is* a doc component library. The full name contract is present as local components, and its only collections are its own styling primitives (`Primitives - Colour`, `Semantic`).

Then say what was found and ask which file holds the tokens. This blocks the classic failure: documenting the doc library's own styling variables as though they were the subject. That output looks plausible and is entirely wrong.

**Case B**. A role left unnamed follows case A (a single leftover file is source and target) or case C.

**Case C**. Ask only these, and only for the roles still open:

> 1. **Which file holds the variables, text styles and effect styles you want documented**? (the source library)
> 2. **Which file should the generated pages be written into**? If that's the same file, say so.

Do not ask about the doc component library even here; Step 1 usually answers it. Ask only when discovery has failed.

**Two decisions are not asked upfront**. The colour format waits for the coverage report (Step 0.2), with hex as the default. The text-style units wait for Step 2.1, which asks only when the group names do not answer it. Both questions wait until the data makes them real.

## Step 0.1: the bridge

Run `figma_list_open_files` and compare `activeFileKey` with the file key the user gave. In practice the two have diverged. Then pin:

```
figma_navigate({url: <source or target URL>, lock: true})
```

The bridge needs to be open only in the **source and target** files: one file, in single-file mode. The doc component library needs it only as the *last* resort, for an unpublished library. Key imports and the REST route both work without a bridge there.

The traps:

- **`figma_navigate` cannot open a file or launch the plugin**. It only switches between files that already run the Desktop Bridge. If the target is not connected, stop and ask the user to open the plugin in it.
- **The pin releases when the pinned file disconnects**. The target then silently reattaches to another connected file. A long session can come back with `targetLocked: true` on the wrong file.
- **Check the target again before every batch of writes**, not just at the start. Defect 6 in [failures.md](failures.md) lists the checks, most reliable first.
- **A call that hangs usually means a dead bridge**. A bare `figma_get_status` probe hangs too. Ask the user to restart the plugin rather than retrying.
- **But a timeout is not proof of a dead bridge**. A thrown error inside the executed code can arrive as a timeout with no message. Before blaming the bridge, probe it with `figma_get_status({probe: true})`. Then run a trimmed payload with the suspect operation removed, or wrapped in `try/catch` that returns the message.
- **The tell between the two:** a dead bridge fails *every* call, the probe included. A thrown error fails only that payload. So a probe that answers, or a smaller payload that returns, means the fault is in your code. A `loadFontAsync` rejecting a malformed font spec once read as slowness for several calls.
- **A hung call is not a failed call**. The bridge has died while *returning* a result, after the writes had committed. On reconnect, **read the current state before rebuilding anything**. A frame reported as half-built was once complete and correct. Query what exists, compare it with what you intended, then decide.
- **So write every generating call to be idempotent**. Before creating a frame or table, remove any existing one with the same identity: the frame name, or a table's `_Title` text. A retry after a hang is then always safe.

## Step 1: doc component keys

Try each route in order from inside the target file, and stop at the first that yields the contract.

| Route | How | Sees |
|---|---|---|
| 1. Local | The contract names exist as local `COMPONENT` or `COMPONENT_SET` nodes. `findAll` across pages | Unpublished components too |
| 2. Cached keys | `figma.root.getPluginData("docComponentKeys")` on the target | Published only |
| 3. Instances in the file | `getMainComponentAsync()` on one instance per contract name, then import by key | Published only |
| 4. Ask, then REST | Ask which file holds the doc components. Then `figma_get_library_components({libraryFileKey})` | Published only |

**Route 2**. Validate the map with a single `importComponentByKeyAsync` before trusting it. Keys survive library updates, but an unpublished or revoked library makes every import throw.

**Route 3**. Earlier generated pages, or any placed doc component, carry the keys. This is what "the file has the documentation library enabled" looks like from the plugin API. No call lists another library's components, but an instance is a live pointer to one. The snippet, the variant-set caveat and the persistence write are in [helpers.md](helpers.md) § *Doc component discovery by key*.

**Naming a library for route 4**. `figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()` can *name* the enabled libraries, from their variables only. Use it to phrase the question ("is 'DS Docs' the doc component library?"), never to skip it.

**Route 4 needs no bridge in that file**, but REST lists published components only. Only for an *unpublished* library, ask the user to open the bridge plugin in it and `findAll` there.

**Key imports reach published components only**. An unpublished doc library is reachable through route 1 and route 4 with the bridge alone. Say so rather than failing silently.

After any route succeeds, **persist the keys to the target's plugin data**, so the next run starts at route 2. Then probe every component type before use (Step 1.2). An imported component is no more trustworthy than a local one.

## The name contract

| Name | Type | Notes |
|---|---|---|
| `Section header` | COMPONENT_SET | `Subtitle=False/True`; props `Heading text`, `Subheading text` |
| `Table` | COMPONENT | Generic; prop `Row slot` (**singular**) |
| `Table - Colour` | COMPONENT_SET | `Alias=False/True`; prop `Rows slot`; ships at 720 |
| `Table - Global` | COMPONENT_SET | `Alias=False/True`; prop `Rows slot`; ships at 720 |
| `Table - Effects` | COMPONENT | prop `Rows slot`; ships at 860 |
| `Table - Text values` | COMPONENT | prop `Rows slot`; ships at 996 |
| `Table - Text sample` | COMPONENT | `Content slot` **must be a SLOT** (failures.md, *Loud failures*); ships at 720 |
| `Row - Colour` / `Row - Global` | COMPONENT_SET | `Alias` variant; `Content slot` SLOT |
| `Row - Effects` | COMPONENT | cells in FRAME `Content`, fixed 6 |
| `Row - Text style values` | COMPONENT | cells in FRAME `Content`, fixed 6; has also shipped as a `Content slot` SLOT, so accept either |
| `Row - Header` | COMPONENT | `Content slot` SLOT of `Cell - Header` |
| `Cell - Default` | COMPONENT_SET | `Content=Text/Alias/Status`; `Swatch` BOOL; `Label text` TEXT |
| `Cell - Header` | COMPONENT | `Label text` TEXT |
| `_Title` | COMPONENT | `Title text` TEXT, `Label` BOOL, `Label text` TEXT |
| `Preview - Effects` | COMPONENT | prop `Content slot` |
| `Effect item` | COMPONENT | ELLIPSE `Swatch` + `Label text` TEXT |
| `Pill` | COMPONENT_SET | `Appearance` variant, `Label text` TEXT |

Safe to ignore: Colour ramp, Colour matrix, Table - Progress status, Table - Properties, Status badge, Thumbnail, Header, Block, Column, List, Level *.

## Two discovery traps

**`_Title` will look missing on route 4, and on key imports (routes 2 and 3)**. The underscore prefix means it is deliberately unpublished. REST cannot list it and it has no importable key, yet it exists as a nested instance inside every table.

**Do not stop**. Instantiate one table and run `findOne(n => n.name === "_Title" && n.type === "INSTANCE")`. Treat it as missing only if that returns `null`.

**`Section header` may be duplicated**. Copies often hold two sets. One has `Content=Parts/Matrix/Component/Examples/Properties`; the other has `Subtitle=False/True`. **Choose by variant axis, not by page name**: pick the set whose children include `Subtitle=True`. Choosing by page name picks wrong.

Any other contract name genuinely missing: stop and report. Never silently skip the page it feeds.

## Step 1.1: fonts

`appendChild` of any instance holding text throws `unloaded font "<family> <style>"`. It kills the call **partway through**, leaving a half-built frame to clean up.

Plugin data survives between calls; loaded fonts do not. So persist the font list once, and load it at the top of every call that creates instances. The source file's text-style fonts are a different set, loaded before any `setTextStyleIdAsync`. The snippets are in [helpers.md](helpers.md) § *Font preload*.

## Step 1.2: the probe

Instantiate the component off-canvas, dump its real structure, then `remove()` it. `probeComponent(comp)` does this. Read:

- the property keys, whose `#nodeId` suffixes differ per copy
- the variant names on any COMPONENT_SET
- the row container: SLOT or FRAME, its name, and how many children ship by default
- the cell's inner nodes: **what type `Swatch` is, and whether a nested `Pill` exists**
- whether `appendChild` and `remove` succeed on the row container
- **how a slot or optional part renders, not just that it exists**

A property's name states the author's intent, not its layout. One doc library's `Section header` has a `Subtitle` boolean whose "subtitle" is an *inline 48px breadcrumb prefix* (`Subheading / Heading`). It is not a line beneath the title. A sentence of prose in it becomes a run-on heading at display size. So instantiate the variant and read the child text nodes' `y` and `fontSize` before deciding what belongs in it (defect 22).

The probe costs one call; skipping it has repeatedly cost three. Unprobed failures are silent: a `findOne` that missed returned `null`, and its placeholder rendered as something plausible. What to read in the output is in [helpers.md](helpers.md) § *Structural probe*.

## Step 2: the source library

Switch the bridge to the source file. Collect in one call, and persist to `figma.root` plugin data:

| What | Fields |
|---|---|
| Variable collections | `id, name, modes, vars[{id, name, resolvedType, description, valuesByMode}]` |
| `primMap` | `variableId → {name, type, description}` across **all** collections, for sync alias lookup |
| Text styles | **`boundVariables`** (font family, style and size, sometimes line height), and `letterSpacing` |
| Effect styles | per-effect **`boundVariables`**: color, offsetX, offsetY, radius, spread |

**Inside the source file, skip the plugin-data round trip**. `getLocalVariablesAsync()` returns every variable as a live object in one await. Then `primMap` is a plain index over it, and alias lookups are sync ([helpers.md](helpers.md) § *Live objects*).

**Keep the array order of `getLocalTextStylesAsync` and `getLocalEffectStylesAsync`**. It is the style-panel order, and it is meaningful (Step 3). Capture it at discovery; names cannot rebuild it later.

**Capture two more facts, to report rather than normalise:**

- whether a collection's modes still carry Figma's default names (`Mode 1`)
- whether a style's token name disagrees with its resolved value (`Font/Weight/normal` resolving to the font style `Regular`)

**Capturing `boundVariables` makes the alias rule possible**. Discovery that keeps only resolved values forces the generator to document literals where the library has tokens.

**Capture `description` on every run**, whatever format the user picked. It is the OKLCH source (Step 0.2), costs nothing now, and needs a second full pass later. Run the coverage count here, before any page is generated.

> **Plugin data is per file**. `setPluginData` writes to the `figma.root` of the file active at the time. Reading `getPluginData` in the target after discovering in the source returns an empty string, **silently**. Write the payload again onto the target's root after switching, or pass it through the conversation (defect 5).

> **Published library variables** (an external file): call `figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()`, then `getVariablesInLibraryCollectionAsync(collection.key)`. Import with `importVariableByKeyAsync`. They return in **random order**, so always sort the rows (`smartSort` or `orderRows`, Step 3). An unpublished collection returns no results.

## Variable binding by scenario

| Scenario | Approach |
|---|---|
| Generating **in the source file** | `getLocalVariableCollectionsAsync()`: full live bindings |
| External file, collection **published** | `importVariableByKeyAsync(key)`: full live bindings |
| External file, collection **not published** | `getVariableByIdAsync(aliasId)` through the semantic alias chain: partial, with static fills where a variable is unreachable |
| Text or effect styles **published** | `importStyleByKeyAsync(key)`: works from any file |
| Text or effect styles **not published** | Generate from within the source file |

**`hiddenFromPublishing` decides, and it is set per variable**. A collection can appear in `getAvailableLibraryVariableCollectionsAsync()` and still list **zero** variables, because every one is hidden. That is what a deliberately hidden primitive tier looks like from a consuming file. Importing such a variable by key throws although the key is valid.

**Test the mechanism; never infer it**. Run the same `importVariableByKeyAsync` against a **published** token from the same library. If that succeeds and the hidden one throws, the link is fine and the variable is simply not consumable. Report that, and stop hunting.

**Two limits to know before designing around them:**

- Remote variable ids (`VariableID:{key}/{internalId}`) **cannot be built** from the source's local ids, because the internal halves differ. A reference to an unimported variable cannot be assembled by hand.
- A remote collection's `variableIds` lists only what this file has already subscribed to. It grows as you import, so it cannot discover the rest.

The alias chain is the only route into a hidden tier, and it reaches only what published tokens point at. F12 in [failures.md](failures.md) says when to use it and when to go uniformly static.
