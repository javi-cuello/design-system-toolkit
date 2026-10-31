---
name: figma-token-export
description: "Export a Figma library's variables and text styles as DTCG-compliant token files for Style Dictionary or any other DTCG consumer. Use whenever the user wants to export tokens, get tokens out of Figma, produce DTCG or W3C design-token JSON, feed Style Dictionary, set up a design-token pipeline, or sync a Figma library to code — even if they do not say \"DTCG\". Handles multi-collection, multi-mode libraries: one folder per collection and one file per mode, aliases preserved as real references, plus a manifest naming the source sets that form each theme build. Exports effect styles as shadow tokens too, inner shadows included, with layers in CSS paint order (top first), which is the reverse of Figma's effects array."
---

# Figma token export (DTCG)

**Version 2.8.2** — history in CHANGELOG.md.

Reads a Figma library and writes **DTCG 2025.10** token files that Style Dictionary (or any DTCG consumer) can build. The export is data-driven: collections, modes, groups and names come from the file at runtime, and nothing about a particular library is hardcoded.

**What it exports:** every local variable collection, every mode, and text styles as `typography` composite tokens.
**What it does not export:** nothing, as of 1.5.0 — effect styles export as `shadow` tokens, inner shadows included now that DTCG 2025.10 defines `inset`.

| File | When to read |
|---|---|
| `scripts/dtcg.js` | **Prepend first.** Pure logic — naming, type mapping, value conversion, files, manifest. Tested. |
| `scripts/collect.js` | **Prepend second.** Everything that needs `figma`: snapshots, `exportTokens()`, `takeFile()`, `verifyReferences()`. |
| `references/mapping.md` | Before answering "why did my token come out like that" — every type decision and its reason. |
| `scripts/discover.mjs` | Shared: reads a tokens directory's collections and modes off the filesystem. |
| `scripts/generate-ts.mjs` | After exporting, to mirror the tokens as TypeScript modules. Plain Node. |
| `scripts/verify-ts.mjs` | After generating. Checks the modules against the JSON. Plain Node. |
| `scripts/from-snapshot.mjs` | **The refresh.** The project's stored snapshot → the same files and manifest, then the TypeScript and its check, with no Figma open. |

## After the export: the downstream scripts

All three take the tokens directory as an argument and discover collections, modes
and groups from the files in it. **None of them knows a collection name, a mode
name or a brand** — pass a different library and they work unchanged.

```sh
node scripts/generate-ts.mjs  <tokens-dir>            # → <tokens-dir>/ts
node scripts/verify-ts.mjs    <tokens-dir>            # exits non-zero on failure
```

**CSS is not built here.** A project's stylesheets come from the toolkit's one
token build — `frontend-build`'s `build-tokens.mjs`, which a repo runs as
`bin/tokens` (code-standard rule 51) — and it reads exactly these files. Until
2.2.0 this skill shipped its own Style Dictionary config to copy into each
consuming project, which is the second build, with its own conventions, that the
rule exists to prevent.

The refresh reads the project's stored snapshot (Step 2), through the same
`dtcg.js`. The snapshot records an alias by name only, so the collection it
points into is found by looking the name up; text styles and shadow layers carry
their bindings; a snapshot older than plugin 0.24.0 is refused.

### The layout: one folder per collection, one file per mode

```
<tokens>/<collection>/<mode>.json     multi-mode collection    ← source, committed
<tokens>/<collection>/value.json      single-mode collection   ← source, committed
<tokens>/manifest.json                build metadata, not a collection
<tokens>/dist/ts/                     generated TypeScript     ← gitignored
```

Source at the root, everything generated under `dist/`. **Neither Style Dictionary
nor DTCG requires this** — Style Dictionary's docs say token files go wherever you
like as long as `source` points at them, and DTCG specifies a file format with
nothing to say about directories. It is convention, and it is the one that has
settled in shipping token repos: Primer's primitives keep DTCG source in
`src/tokens/` and gitignore `dist/` while publishing both, so a consumer can take
the build or run their own.

TypeScript belongs under `dist/` rather than beside the source because it is a
build product exactly as CSS is. The cost of that, worth knowing before adopting
it: a gitignored mirror produces no reviewable diff when the library changes, and
that diff is what makes a rename visible. Commit `dist/` instead where the repo is
a handover or context repo rather than a published package.

A single-mode collection still gets a folder, so the shape does not change the day
a second mode is added.

**The mode is the file and never part of a token path.** Every mode file declares
the same paths with different values, which is what lets a consumer swap one file
— or one built stylesheet — and change the theme with nothing rewritten. Folding a
collection's modes into one document is legal DTCG and costs exactly that: the
mode enters every path and every alias, `{primitive.palette.red.3}` becomes
`{primitive.light.palette.red.3}`, and a build tool needs a custom preprocessor to
strip the segment back out before it can theme anything.

**Modes live inside a TypeScript module (`{ light, dark }`) and in the file name
for JSON.** Both are right for the same reason: JSON cannot express a mode and
TypeScript can.

**A reference from one mode axis into another expands rather than indexes.** A
collection whose modes are brands, referencing a collection whose modes are
themes, shares no mode name with it — so the token becomes `{ light, dark }`
instead of pointing at a mode that does not exist. Indexing blindly by the current
mode compiles and throws at import time, which is how it was found once the
scripts stopped assuming light and dark.

## Use the scripts; do not re-derive them

Two layers, prepended in this order because the second calls the first at runtime:

1. `dtcg.js` — no `figma`, one global `DTCG`, gated by `node tests/test-dtcg.js`
2. `collect.js` — needs a live file, so `node --check` is the only gate it can have

The split rule is mechanical: **needs a node → layer 2; doesn't → layer 1, with a test.** Converting a percent line height, mapping a weight name to a number, deciding which files form a build — none of that needs Figma, so none of it belongs in a prompt. A hand-written conversion is where the defects come from, and it cannot be re-checked next time.

**Patching an exported function does not patch its internal call sites.** `buildFiles` calls the module's own `buildManifest`; assigning `DTCG.buildManifest = …` in a later bridge call changes the export and nothing else. Re-paste the layer instead. Learned the slow way, on a run where a fixed manifest kept producing the old output.

## Project context first

If a **design system context document** is available — in Claude Code, as a file in the working folder (the project's CLAUDE.md names it); in claude.ai, via Project knowledge or provided in the conversation — it is the authoritative per-project configuration. Match the connected file's `fileKey` against its registry and hydrate every setting this skill needs from the matching sections — run discovery **only** for items the document marks `[TBD]`. Rulings recorded there outrank file evidence; report conflicts rather than re-deriving. New rulings produced by a run are recorded in the document: when it is a writable file (Claude Code), update it in place in the same turn; otherwise output the updated sections for the maintainer to paste back.

Settings this skill will look for before asking: colour value format, dimension unit and root size, opacity scale, and which collections are in scope.

## Step 0 — Run in the source library file

Run against the file that **owns** the variables. Two reasons, both hard limits rather than preferences:

- There is no library API that enumerates **styles**. Text styles are reachable only as local styles, so a consumer file cannot see them at all.
- A hidden tier is invisible from outside. `hiddenFromPublishing` variables are not listed by `teamLibrary.getVariablesInLibraryCollectionAsync()` and `importVariableByKeyAsync()` **throws on them even with a valid key** — so a primitive tier deliberately hidden from publishing cannot be exported from a consuming file, and every alias into it would dangle.

Pin the bridge to that file (`figma_navigate` with `lock: true`) if more than one file is connected.

## Step 1 — Ask only what has no safe default

Three questions, and they are the only ones. Each has a default that is defensible, so ask once and move on; record the answers in the context document.

| Question | Default | Why it cannot be inferred |
|---|---|---|
| Colour value format | `object` (spec-compliant) | DTCG 2025.10 requires the object form; Style Dictionary v4 consumes hex strings today. `colorFormat: 'hex'` emits the legacy string. Both are defensible; the project decides. |
| Dimension unit and root size | `px`, root `16` | `rem` divides by the root size, and the root is a project decision no file states. |
| Opacity scale | auto-detect | A group whose maximum exceeds 1 is read as 0–100 and divided; a 0–1 group is left alone. `opacity` set to `'percent'` or `'unit'` overrides. |

## Step 2 — Export

**From the snapshot, which is every project's source of truth.** Take a design-system snapshot of the library in Figma (the snapshot plugin, one click), then:

```sh
node scripts/from-snapshot.mjs <snapshot tokens.json, or the file the plugin downloaded> <tokens-dir>
```

It writes every collection folder and `manifest.json`, then runs `generate-ts.mjs` and `verify-ts.mjs`; a failure in either exits 1 saying the JSON is written and the TypeScript is not trustworthy. Only what an export owns is replaced (the manifest and the collection folders), so a README and `dist/` beside them stay, and a collection the library no longer has is removed. The tokens directory is a required argument with no default: a refresh that once defaulted to the cwd wrote a project's whole export into this skill. CSS is not built here: see *After the export*.

Why not read Figma directly: the snapshot already read the library, and every other output (the docs site, the token build, the audits) reads the snapshot. A second reader is a second answer. Until 2.5.0 this step was a refresh server serving `collect.js` to the plugin; it produced the same files by reading the library a second time, and was retired once the snapshot carried everything it did (bindings, hidden tiers).

### Doing it by hand, for a file with no snapshot

A library outside any project has no stored snapshot. Paste the two layers through the bridge and export live:

```js
// call 1: paste dtcg.js, then collect.js. They cache themselves on globalThis.
// call 2:
await exportTokens({ colorFormat: 'object', unit: 'px', rootSize: 16 })
```

`exportTokens` returns **sizes and a report, not the JSON** — a full library runs to hundreds of KB and one oversized result is the usual reason an export appears to fail. The files sit in the sandbox; `takeFile(name)` hands over one at a time, and you write it to disk on the other side.

Read the report before writing anything. It has four lists and each one matters:

- `skipped` — variables with no DTCG type. String variables that are not a font family or weight are the common case; there is no DTCG string type, so they cannot be expressed. Offer them as a sibling non-DTCG file or leave them in Figma; do not invent a type for them.
- `warnings` — typography that lost something, e.g. an `AUTO` line height, which has no DTCG equivalent and is omitted rather than faked.
- `notExported` — whole categories this version does not cover, with counts.
- `renamed` — **naming parity**: tokens whose code name diverged from their Figma name in a way a designer cannot predict. Lowercasing and space-to-hyphen are universal and not reported; what is reported is a segment the exporter had to make a decision about — punctuation it collapsed, or a sign it spelled out. Take these back to Figma and rename there. Accepting the translation means design and code now call the same token two different things, and only the exporter knows both.

## Step 3 — Verify before handing over

```js
verifyReferences()   // { builds, dangling: [], ok: true }
```

Every `{a.b.c}` must resolve inside at least one manifest build. A dangling reference is silent in Figma and fatal in Style Dictionary, and it is exactly what an alias into an unreachable tier produces — which is how this check earns its place rather than existing in case.

**A count is not a verification.** Compare a handful of exported values against the file itself, especially a token whose alias crosses collections and one in each mode.

## Step 4 — Wire up Style Dictionary

The manifest is the part nobody should have to re-derive. Per-mode files repeat the same token paths, so feeding all of them to one build collides; the manifest lists the source sets that are actually valid, one per theme permutation.

**Collections that share a mode-name set share an axis.** A primitive tier and a semantic tier both carrying Light/Dark are one theme switch, not two independent ones. Multiplying them would double the build count and produce combinations — primitive Light with semantic Dark — that no one would ship. The manifest groups them; a hand-written config usually does not.

```js
// style-dictionary config for a non-CSS platform, one build per manifest entry
manifest.builds.forEach(b => new StyleDictionary({
  source: b.sources.map(f => `tokens/${f}`),
  usesDtcg: true,
  platforms: { js: { transformGroup: 'js', files: [{ destination: `${b.name}.js`, format: 'javascript/es6' }] } }
}).buildAllPlatforms())
```

Three things about Style Dictionary itself, all checked against **5.5.1** on 2026-08-18 rather than inferred from its docs:

- **Object colours are fine.** DTCG 2025.10's object form resolves to plain hex with no configuration. The `colorFormat: 'hex'` escape hatch exists for older consumers, not for Style Dictionary.
- **`expand` is right for JS/TS and wrong for CSS.** Off, a `typography` token collapses into the CSS `font` shorthand, which cannot carry letter-spacing, so it is dropped with a warning per style. On, letter-spacing returns and every dimension shatters into `-value` and `-unit` halves, which no stylesheet can use. Expand the JS platform, not the CSS one.
- **`javascript/es6` pairs with `typescript/es6-declarations`.** `javascript/esm` emits a nested default export while the declarations file declares flat consts; both files build without error and the types describe a module that does not exist. This one is silent in both directions, which is why it is named here.

## Naming parity is the thing to protect

A token system's value is that design and code name the same thing the same way, and the most common way that erodes is a tool quietly translating names on the way out. This exporter translates — it must, because DTCG paths cannot carry every character a Figma name can — so it reports every translation it could not make reversible, and says so rather than hiding it.

The check is deliberately narrow. Flagging every case change would flag every token and be read as noise; the first version of it also flagged every existing hyphen and returned 42 hits on a 565-variable library, where the true answer was two. A detector that fires on everything is the same failure as one that fires on nothing.

Three shapes to expect, all worth fixing at the source rather than in the pipeline:

- **A sign in a name** — `Position/-1` becomes `minus-1`. The Figma name reads as a number, the code name reads as a word.
- **Punctuation standing in for a decimal** — `Stroke/1_5` becomes `1-5`. A literal `1.5` would be worse, because a dot is the DTCG path separator.
- **Two names that collapse onto one path**, which is not a rename but a loss, and appears in `skipped` instead.

### One bundle per manifest entry is usually too many

The manifest says which source sets are *valid*, not how many files to ship. Before building one bundle per entry, diff two of them. Where a mode axis moves a single token — a brand switch that only repoints one alias is the common case — the bundles come out near-identical, and the right shape is one file per *theme* plus a small file of per-mode overrides scoped to an attribute.

Measured on a real library: two brand bundles of the same theme differed by **one declaration out of 593**, and each carried seven brand ramps nobody in that bundle used. Sixteen files became three, 15MB became 744KB, and every one of the sixteen combinations was still reproducible. The tell is cheap to check and easy to skip: `diff` two built bundles before deciding the shape.

## Type mapping

| Figma | DTCG `$type` | Conversion |
|---|---|---|
| COLOR | `color` | `{colorSpace: 'srgb', components, alpha, hex}`, or a hex string on request. `hex` is always 6-digit — the spec's fallback may not carry alpha. |
| FLOAT | `dimension` | `{value, unit}`. **A bare number is not a dimension in 2025.10** and is the most common export defect. |
| FLOAT with an `opacity…` segment anywhere in its name | `number` | Divided by 100 where the group is authored 0–100. `Opacity/disabled` and `State/Disabled/opacity` are both opacity; reading only the first segment exported the second as a `50px` dimension. |
| STRING with a `family…` segment anywhere | `fontFamily` | Verbatim. `Font/Family/text` and `Label/md/family` are both families. |
| STRING with a `weight…` segment anywhere | `fontWeight` | Mapped to a number. `"Semi Bold"` and `"SemiBold"` both → 600; an unknown weight is **rejected and reported**, never guessed. |
| STRING, anything else | — | No DTCG type exists. Skipped and reported. |
| Alias, any type | — | A real `{group.token}` reference. Never resolved to a value: flattening an alias throws away the tier structure that made the library worth exporting. |
| Text style | `typography` | Bound family/size/weight export as references; percent line height becomes a unitless multiplier; percent letter spacing resolves against that style's own font size into an absolute dimension. An `AUTO` line height is **measured** by the collector on a rendered text node (Figma's AUTO is the font's ascender + descender rounded to whole pixels, which CSS `normal` does not reproduce) and exported as that multiplier; one that could not be measured is omitted and reported, never faked. |
| Colour style, solid | `color` | A reference when the paint is bound, a colour otherwise. |
| Colour style, linear gradient | `gradient` | DTCG stops `[{color, position}]`, each colour a reference where bound. The type defines no direction, so the angle rides in `$extensions` — read from the gradient handles in the node's unit square, where a diagonal stretches with the frame as CSS corner keywords do and a degree value does not. The Style Dictionary build renders `linear-gradient(…)` with diagonals as keywords. Radial, angular and image paints have no DTCG type and are reported. |

## Shadows

Effect styles export as `shadow` tokens, single-layer or an array, with each layer's colour, offset, blur and spread kept as references wherever the style binds a variable. An inner shadow carries `inset: true`, a member the DTCG Format defines since its 2025.10 report. Style Dictionary's `shadow/css/shorthand` renders it (`inset 0px 2px 4px 0px rgb(…)`, verified against 5.5.1).

**Layers are listed top first.** Figma's effects array paints its **last** entry on top — tested on 2026-10-01 with two opaque, offset shadows — while a CSS shadow list paints its **first** on top, and Style Dictionary writes the array in order. So the export walks the effects from the end. DTCG itself does not define the order of a shadow array; top first is the CSS reading, and the one every consumer here renders. Copying Figma's order straight through reverses the stack, which is invisible for shadows of one colour and wrong for any style that layers two.

Two things are reported rather than guessed: a **hidden layer** is omitted with a warning, and a layer that is not a drop or inner shadow — a background blur, say — is omitted with its type named, because DTCG's shadow type has nothing to express it with.

## Failure modes worth knowing

- **A snapshot that returns nothing is a finding about the snapshot.** `getLocalVariablesAsync()` returns nothing in a consuming file, because nothing there is local — that is not an empty library.
- **An unresolvable alias is recorded, not skipped.** It means the target left the file, and a blank cell would hide it.
- **Mode names are the join key, not mode ids.** Ids are file-local; a name survives a re-export and a different file.
- **`$extensions` provenance is deliberate.** Every token carries its Figma collection, original name, mode and hidden flag, so an export can be traced back without opening Figma. Pass `noExtensions: true` for a leaner file.
