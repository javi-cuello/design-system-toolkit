# Conformance checklist (run top to bottom)

Every item of the conformance check, in the order to run it. [SKILL.md](../SKILL.md) *Check an existing plugin* points here. The rules themselves are [skill-standard Part B](../../../standards/skill-standard.md), cited as §B; this page says how each is checked.

**`scripts/conformance.mjs` runs every mechanical item below.** Those are §1's fields and permissions, §2's grep, and §3's counts and CDN rules. They are also §4, §5's drift, §5a's sizing half and §5c. It prints each finding with its class. What is left for a read is marked *read*. The greps below are what the script runs, kept as the account of each rule.

## Contents

- [1 · Manifest](#1--manifest)
- [2 · Banned sync APIs](#2--banned-sync-apis-must-be-clean-before-adding-documentaccess)
- [3 · Network truth](#3--network-truth)
- [4 · Metadata](#4--metadata)
- [4b · Settings hygiene](#4b--settings-hygiene-read)
- [5 · ui-base drift](#5--ui-base-drift)
- [5a · ui-base collision](#5a--ui-base-collision-sizing-scripted-states-read)
- [5b · Runtime traps that produce no error](#5b--runtime-traps-that-produce-no-error-read)
- [5c · FigUI3, composed and never restyled](#5c--figui3-composed-and-never-restyled-scripted)
- [6 · Retest protocol](#6--retest-protocol-after-any-manifest-change)

## 1 · Manifest

The required fields are §B 2's. The checks:

- Required: name, editorType (an array), `documentAccess: "dynamic-page"`, main, ui (if any) and networkAccess.
- `api` is pinned.
- `id` is always present: development plugins lose relaunch data and `pluginData` without one.
- Flag any `id` change as a data-loss risk.
- relaunchButtons appear only if the code calls setRelaunchData.

**Permissions, the silent one.** Each gated API the code calls needs its entry in the manifest's `permissions`.

```
grep -nE 'figma\.teamLibrary|figma\.payments|figma\.currentUser|figma\.activeUsers' code.js
```

| A hit on | Needs the permission |
|---|---|
| `figma.teamLibrary` | `teamlibrary` |
| `figma.payments` | `payments` |
| `figma.currentUser` | `currentuser` |
| `figma.activeUsers` | `activeusers` |

A missing permission does not stop the plugin loading. Instead, every call to that API throws at runtime: `"<name>" permission not specified in manifest.json`. A plugin that catches or races those calls turns the throw into an empty result. That reads as "this file has nothing", and it passed live test runs. `standards/tests/check.sh` enforces the `teamlibrary` case.

## 2 · Banned sync APIs (must be clean BEFORE adding documentAccess)

```
grep -nE 'getNodeById\(|getStyleById\(|getFileThumbnailNode\(|getLocalTextStyles\(|getLocalPaintStyles\(|getLocalEffectStyles\(|getLocalGridStyles\(|getVariableById\(|getVariableCollectionById\(|getLocalVariables\(|getLocalVariableCollections\(|\.mainComponent\b|\.instances\b|\.consumers\b|currentPage\s*=|figma\.root\.findAll|\.masterComponent\b' code.js
```

- Any hit: convert it to the …Async equivalent, or to `PageNode.loadAsync` or `loadAllPagesAsync`.
- Do this BEFORE the manifest gains dynamic-page.
- *Read:* the script leaves `.instances` and `.consumers` to a read. A plugin's own arrays and maps carry those names as often as nodes do.
- A generated block is not grepped. It is marked `/* <name> generated start … <name> generated end */` and written by a sync script. Its code is its source's, which runs under dynamic-page where it is written.
- Only a block whose two markers carry the same name, one `conformance.mjs` `GENERATORS` lists, counts as generated. `check.sh` runs each of those generators with `--check`. A hand-typed or mismatched marker hides nothing.

| Manifest change | Effect |
|---|---|
| Adding dynamic-page | Behaviour-changing: sync APIs throw |
| Adding networkAccess | Behaviour-changing: fetches are blocked |
| Adding or changing `id` | Behaviour-changing: storage is re-keyed |
| editorType, api, relaunchButtons | Inert |

## 3 · Network truth

The rule is §B 9's. Count the network calls:

```
grep -cE 'fetch\(|XMLHttpRequest|WebSocket' code.js ui.html
```

- Generated blocks are left out of the count, in code.js as in ui.html: their source answers for them (§2).
- 0 hits: `allowedDomains` is `["none"]`.
- Hits: enumerate the real domains, with scheme and subdomain wildcards as the standard says.
- *Read:* the domains each fetch should be allowed.
- A fetch from unpkg.com with no fallback, for any versioned npm asset, is needs-decision. unpkg rejects a plugin UI's null origin outright, a confirmed failure.
- jsdelivr (`cdn.jsdelivr.net/npm/...`) is the confirmed-working default. See [network-fetch-patterns.md](network-fetch-patterns.md).
- Confirm such a fetch targets a pinned version, not `@latest`.

## 4 · Metadata

The files are §B 1's and the versioning is §B 8's. The checks:

- package.json holds the version, in SemVer: it is the source of truth.
- The code.js header comment mirrors it.
- The header carries the audit stamp, `· skill-standard vX.Y.Z`: the standard version last audited against.
- A plugin last audited before the standards merged carries `· plugin-standard vX.Y.Z` instead.
- A lagging stamp is the signal; a missing one is the defect. Update it only when an audit actually happens.
- CHANGELOG.md is present.
- README.md has a "Data this plugin stores" section.
- tsconfig.json is present. Copy it from `assets/tsconfig.json.tpl` if missing.
- `// @ts-check` is code.js's second line, right after the version header.

## 4b · Settings hygiene (*read*)

The rule is §B 10's. For every `settings.<field>` read in code.js, confirm the property it flows into matches the field's name and description.

- A value landing on a decorative or chrome property unrelated to the setting's purpose is needs-decision, not a style nit.
- Example: an "icon stroke width" setting silently driving a boundary-chrome stroke.
- Re-derive the setting's real intended purpose before changing anything.
- Changing an unrelated setting's default is not a fix for a wiring bug.

## 5 · ui-base drift

Extract the block between `/* ui-base vN start */` and `/* ui-base vN end */` in ui.html. Any version counts: the marker is bumped with the block. Diff it against `assets/ui-base.css`.

| Found | Do |
|---|---|
| Drift | Re-inline the canonical block only |
| Absent | **Inline it: mandatory, not offered** `[maintainer ruling, skill 1.1.0]` |

Then:

- Reconcile by stripping plugin CSS that duplicates base control styling. Keep plugin-specific rules.
- Rebuild controls from fig-* elements (§5c, §B 4). The plugin's own content keeps its CSS.
- Never touch code.js logic.
- Close with a visual retest in light and dark theme.

## 5a · ui-base collision (sizing *scripted*, states *read*)

Since ui-base v4 the controls are fig-* elements. So this applies only to a native control the plugin keeps: one §5c names and a decision keeps.

**Why it collides.** FigUI3's stylesheet styles native `button`, `input` and `select` by bare selector. ui-base sets `*{box-sizing:border-box}`. A bespoke class that resizes the control and omits either value gets the shared one by accident.

**What the script checks.** Each class on a native control in the markup, on an element with no ui-base class:

| Control | Counted |
|---|---|
| `<button>` | Always |
| `<input>` | Not checkbox, radio, range, color, file or hidden |
| `<select>`, `<textarea>` | Always |

It warns when the class's own non-state rules set any of these, logical sides included:

- padding;
- a border's width;
- `font` or font-size;
- line-height;
- a height or block-size.

The warning clears when those rules, or the plugin's rule on the tag, set both `height` and `box-sizing: border-box`.

| Rule | Counts as the tag's rule? |
|---|---|
| `#toolbar button`, `input[type=text]`, `input:not([type=checkbox])` | Yes |
| A state, such as `input:focus` | No |
| `button:not(:disabled)` | Yes |
| `input[type=checkbox]` | Only for checkboxes |

A control with no `type` is its default: a text input, a submit button. Each control is judged on the rules that reach it. A compound (`.big.small`) counts only for a control carrying every class in it. A class rule with a state or an attribute (`.tab:hover`, `.tab[aria-selected]`) is a state.

**What is left to read.**

- Classes code assigns at runtime are outside the markup. Check them for `height` and `box-sizing:border-box` the same way.
- Make both explicit even when the inherited value already matches.
- The `:disabled`, `:hover` and `:focus` rules: ui-base may already treat a state correctly on a bare selector. A more specific plugin rule for that state must not shadow it with something worse.

## 5b · Runtime traps that produce no error (*read*)

Each of these shipped in a real plugin in this repo. Each was found in a Figma file, not in review. They share one shape: the plugin looks like it is working. §B 13 holds the traps that bind any plugin-API code. These are the ones met in plugins.

| Trap | What to do |
|---|---|
| **A cache set before its work finishes.** `if (!cache) { cache = []; …await… }` lets a second caller see a warm cache mid-flight. It skips the fast path and queues behind the slow one. | Memoise the **promise**, not the result: `if (!p) { p = doTheWork(); } var out = await p;` |
| **A guard that cannot tell a timeout from a refusal.** Racing a slow API against a timeout is right. The call `getVariablesInLibraryCollectionAsync` once never returned for one collection. Catching the rejection and returning a neutral value in the same wrapper is not. It turned a missing permission into "no library collections". | Report the first real error you swallow. |
| **`setExplicitVariableModeForCollection` and `clear…` take the collection NODE.** The id-string form throws `Cannot call … with a collection id in incremental mode`. A pin whose collection cannot be resolved cannot be removed by any route. | Pass the node. Count unresolvable pins and say so, rather than catching and moving on. |
| **An extension's pin is cleared through its PARENT.** `clearExplicitVariableModeForCollection(extension)` does nothing, and throws nothing. Setting the extension's mode replaces the parent's entry, since they share a slot. | Clear through the parent. Count leftovers from what is still on the node afterwards: a call that does nothing cannot be detected any other way. |
| **`loadAllPagesAsync()` is not a one-off cost.** Every page stays in memory while the plugin runs. In a large file Figma itself feels heavy, and the plugin window stutters when dragged. | Prefer `page.loadAsync()` in a loop that can stop early, and only when what you have does not answer the question. |
| **A remote collection's id is not stable across published generations.** In `VariableCollectionId:<key>/<local>`, the local half changes when the library republishes. Comparing whole ids reports "not pinned" on a pinned layer. | Compare the key. |
| **Depth is a decision, not a detail.** A mode pinned on a nested frame overrides the one set on its parent. A shallow "clear" reports success and changes nothing on screen. | Decide whether the change must reach nested frames that carry their own pin. Afterwards re-read the explicit modes on the node and its descendants, not the call's return or the screen. |
| **`getNodeByIdAsync` can hang on an id inside an instance.** It never resolved for sublayer ids read from `instance.overrides`. The bridge reported a lost connection rather than an error. | Build an id map from `instance.findAll(() => true)` and look the ids up there. |
| **An instance read before it joins a SLOT keeps stale sublayer ids.** Say you read its children, to load their fonts. Appending it into a slot then leaves those nodes detached. Later writes fail on ids that no longer exist. | Load fonts from the main component instead, or read after appending. |
| **Overrides on a slot's contents are listed on the instance that holds the slot,** not on the nested instance. A copy that gathers overrides per instance misses them. | Gather overrides across the whole frame. |
| **A GRID frame's tracks are fragile.** A HUG track passed with a `value` is stored as FIXED. Setting `primaryAxisSizingMode` on a GRID frame resets its tracks. | Pass `{ type: 'HUG' }` alone. `setGridChildPosition` takes only a child with an anchor index of 0 or more. |
| **A gradient's stops carry their own variable bindings,** apart from the paint's. Uncopied, the stops render in their raw colour. | Copy them with `createVariableAlias`. |
| **SLOT properties cannot go through `setProperties`,** and a renamed property keeps its `#id` suffix. | Map properties by suffix, and fill a slot by appending to it. |
| **A text written by segments loses its text style.** Setting font, size or fills per range leaves it styled "literal". Nothing throws, and it looks the same until the style changes. | Set the style (`setTextStyleIdAsync`) after the characters, or set only the properties that differ. |
| **Check a copied frame field by field, not by eye.** A rebuild that looked right had lost hundreds of text styles. It had also lost variant overrides in slots and icon swaps. | Walk both trees by position. Compare every field (style ids, variant values, each instance's main component) before calling the copy done. |
| **In the UI, an `<svg>` has no `hidden` property.** Setting `svg.hidden = false` does nothing, so the icon never shows. | Use `toggleAttribute('hidden', …)`. |
| **In the UI, a top-level `var status` is `window.status`.** Assigning an element to it turns the element into a string. | Name the variable anything else. |

## 5c · FigUI3, composed and never restyled (*scripted*)

The rule is §B 4's: the look is FigUI3's.

| Finding | Class |
|---|---|
| A plugin rule outside the ui-base block whose selector reaches a `fig-*` element or the old `.switch` | needs-decision |
| A native control in the markup where FigUI3 has an element (list below) | needs-decision |
| A `fig-button` in a `fig-footer` without `size="large"` (an `icon` button excepted) | auto-fixable |
| Text inside a `fig-switch` or `fig-checkbox` in a `fig-field`, between its tags or in its `label` attribute | auto-fixable |

The native controls are a `<button>`, a checkbox, a radio, a text input, a `<select>` and a `role="tab"` element. A hidden file picker is not counted. A link-like action is `fig-button variant="link"`. Text in a field row's switch or checkbox belongs in the row's label.

*Read:* controls code builds at runtime (innerHTML strings) are outside the markup. Check them by hand the same way.

## 6 · Retest protocol (after ANY manifest change)

1. Re-import the manifest.
2. Run in a trivial file.
3. Run in a large multi-page file: no sync-API throws, no unexpected "loading pages".
4. Verify stored settings still load.
5. Bump the version and add the changelog line.
