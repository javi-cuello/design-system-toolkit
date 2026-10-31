# Eval cases — figma-token-export (v2.10.1)

**Walked: 2026-10-31 for 2.10.1, tests only** — A21 executed: `node tools/tokens/test-ts.mjs` 12/12; it found `verify-ts` blind inside a shadow's layers, fixed in `tools/tokens/verify-ts.mjs` (a tool, not this skill's files).

**Walked: 2026-10-31 for 2.10.1** — no case changed; `node tools/toolkit-check/check-runs.mjs` clean.

**Walked: 2026-10-31 for 2.10.0** — every case's `Runs:` line re-aimed at `tools/tokens/`: `node tools/tokens/test-dtcg.js` 107 passed, `node --test tools/tokens/test-from-snapshot.mjs` 12/12, `node tools/toolkit-check/check-runs.mjs` clean; the old `scripts/from-snapshot.mjs` with no arguments forwards and prints the usage, exit 2 (A22).

**Walked: 2026-10-31 against v2.9.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Walked: 2026-10-30 against v2.8.2** — `node ~/.claude/skills/figma-token-export/scripts/from-snapshot.mjs` with no arguments prints its usage and exits 2 through the link, as through the repo path; `node tests/test-from-snapshot.mjs` passes. Other cases untouched.

**Reviewed against v2.7.1 on 2026-10-01** — no case changed; the release is wording, comments or dead code only, and the suite passes.

**Walked: 2026-10-01 for 2.7.0** — `test-dtcg.js` 105/105, with A19's two changed assertions (layer order, no `$extensions` mirror) shown failing against 2.6.2 first; `test-from-snapshot.mjs` 11/11.

**Reviewed against v2.6.2 on 2026-09-30** — no case changed in substance; the project named in their evidence is Project B.

**Walked: 2026-09-19 for 2.6.0** — `test-from-snapshot.mjs` 11/11: the fixture now records its bindings, and a snapshot without them is refused (new). Real input: all four projects' snapshots carry `bound`; both repos regenerate byte-identical, Project B's export is identical, all four docs sites build.

**Walked: 2026-09-19 for 2.5.0** — the refresh server and `tests/test-refresh-server.mjs` removed; A20 retired to a pointer, A22 re-aimed at `from-snapshot.mjs`, A29 and A30 added and executed (`node --test tests/test-from-snapshot.mjs` 10/10; A29 fails against 2.4.0's whole-folder replace). `test-dtcg.js` 105/105. Real input: Project B's Foundations snapshot exported and TypeScript-verified (74/74), compared token by token with the live export.

**Walked: 2026-09-19 for 2.4.0** — one case added and executed (`test-from-snapshot.mjs` 8/8): a bound shadow colour stays a reference, a foreign blur keeps its literal. `test-dtcg.js` 105/105; both repos regenerate byte-identical.

**Walked: 2026-09-19 for 2.3.0** — one case added and executed in `test-from-snapshot.mjs` (7/7): a recorded binding wins over the naming convention, a foreign one keeps the literal, and a snapshot that records bindings is not second-guessed. `test-dtcg.js` 105/105; both registered repos regenerate byte-identical (their snapshots predate `bound`).

**Walked: 2026-09-19 for 2.2.1** — A27 and A28 added and executed (`node --test tests/test-from-snapshot.mjs`, 6/6); A27 fails against 2.2.0's lookup, which sent the alias home to its own collection. The rest unchanged: `test-dtcg.js` 105/105.

The mapping layer is pure, so most of this is executable without Figma. A1–A8 and A12 run against `tools/tokens/dtcg.js`; A9–A11 describe live behaviour and were observed against a real library.

**Walked: 2026-08-18 — pass (77/77), re-walked for 1.1.2.** 1.1.2 adds guidance about how many bundles to ship, which no case asserts and the exporter does not implement, so no case moved and none was added. The guidance was walked by doing it: the sixteen-bundle build was diffed (one declaration differed out of 593), rebuilt as three files, and checked by the project's own `verify.mjs` — 69 checks, each of which was then shown to fail against a deliberately broken output rather than merely passing against a good one.

**Walked: 2026-08-18 — pass (77/77), re-walked for 1.1.1.** 1.1.1 changes only Step 4's Style Dictionary guidance, which no case asserts, so no case moved. The guidance itself was walked instead, by running the thing it describes: Style Dictionary 5.5.1 over the exported files, 16 builds, 48 output files, 593 variables each. That is what corrected the previous claim about object colours needing a hex fallback, and what produced the `expand` and `javascript/esm` findings now in the text. No case was added, because the findings are about a downstream tool's configuration rather than this skill's behaviour — the place they are kept executable is the project's own `build.mjs`.

**Walked: 2026-08-18 — pass (77/77 executed for A1–A8 and A12–A14).** Run `node tests/test-dtcg.js` from the skill directory to reproduce; it exits non-zero on any failure. `node --check scripts/collect.js` is the only gate the live layer can have.

**Walked live: 2026-08-18 — A9, A10 and A11 observed against a four-collection, 12-mode, 565-variable library (fixture: `projects/project-b/`).** 1103 tokens across 14 files, `verifyReferences()` clean, five string variables skipped and reported. A11 is the case that run produced: the manifest returned 32 builds where 16 are correct, because two collections sharing a Light/Dark mode set were multiplied as independent axes. Fixed, re-checked live at 16 builds with the correct source sets, and pinned as an executable regression.

**Walked: 2026-08-18 — pass (88/88), re-walked for 1.5.0.** Effect-style export added, proven against a real library: 11 styles → 11 tokens, references intact through to CSS, one BACKGROUND_BLUR layer reported and omitted. Style Dictionary's handling of `inset` was established by probe (a token with `inset: true` renders `inset 0px 2px 4px 0px rgb(...)`, and a layered token as one comma-separated value), not from its documentation.

**Walked: 2026-08-18 — pass, re-walked for 1.4.0.** 1.4.0 moves generated output under `dist/` and changes no behaviour any case asserts, so no case moved and none was added; the layout claim was walked by running it — regenerated into `dist/ts` and `dist/css`, verify-ts 48/48, verify-css 39/39, 77 pure checks. The convention behind it was checked against sources rather than asserted: Style Dictionary's package-structure docs, and Primer's primitives repo, whose `.gitignore` carries `/dist/` while its `package.json` ships both `dist` and `src/tokens`.

**Walked: 2026-09-19 — pass, re-walked for 2.2.0.** `node tests/test-dtcg.js` 105/105 (A3's run-together `semibold` added), `node --test tests/test-from-snapshot.mjs` 4/4 (A26, new), `node tests/test-refresh-server.mjs` 11/11. The refresh test had been failing for a reason outside the server: its fixed port 9231 was taken by a local dashboard, so it now picks a free port in the plugin's range. A26 also ran on real input: two projects' stored snapshots through `tools/tokens/build.mjs`, whose output matched each project's previous stylesheets property for property. A25's downstream assertion was re-probed against the one build (`frontend-build`'s `build-tokens.mjs`), this skill's own Style Dictionary asset being gone: real gradients render as `linear-gradient(180deg, var(--palette-pink-4) 25%, …)`, references kept. The 135° → `to bottom right` half met no real gradient at that angle, so it is executed on a fixture instead: `frontend-build` case B9. A15's grep over `scripts/*.mjs` finds only prose in `from-snapshot.mjs`.

**Walked: 2026-08-21 — pass (103/103), re-walked for 2.1.0.** A23–A25 added and executed in `node tests/test-dtcg.js`. The Style Dictionary half of A25 was probed in a scratch build against 5.5.1 (two-mode semantic tier plus a colour-style folder): `linear-gradient(180deg, var(--ds-semantic-background-soft) 50%, var(--ds-semantic-background-medium) 100%)` and `linear-gradient(to bottom right, …, rgb(0 255 0 / 0.5) 85%)`, with and without `--oklch`; `generate-ts.mjs` emitted the stops as nested objects with per-mode colour references. **Walked live the same day against a 29-component library over the desktop bridge** (fixture: a real UI library, 280 variables, 18 text styles, 4 colour styles): `snapshotPaintStyles` returned 4/4 styles, every stop a bound reference (`{3-semantic.background.supportive.pink.soft}` …), angles 180 and 135 as authored; `measureAuto` measured Inter Display 28px AUTO at 34px (1.2143 — the font's 1.2109 metric rounded to whole pixels, which is exactly the value CSS `normal` does not give) in 78 ms for four styles and left no node on the page; `classify` over all 280 variables: 171 color, 67 dimension, 21 fontWeight, 20 fontFamily, 1 number, **0 unsupported** — before 2.1.0 the 41 families and weights were skipped and the opacity exported as `50px`. One limit met on the way: the whole bundle with all 18 styles measured in one call exceeded the bridge's 30 s cap, so the walk ran in two calls; the refresh server (A20) has no such cap.

## A1 · A dimension is an object, never a bare number
Fixture: a FLOAT variable of 8, exported with `unit: 'px'`; the same at `unit: 'rem'` with root 16 and with root 10.
Assert: `$value` is `{value: 8, unit: 'px'}`, `{value: 1.5, unit: 'rem'}` for 24px at root 16, and `{value: 2, unit: 'rem'}` for 20px at root 10.
Assert also: `$type` is `dimension`. An export that emitted `8` would validate as a `number` token and lose the unit with no error anywhere in the chain.

Runs: node tools/tokens/test-dtcg.js — "dimension is an object, not a number"

## A2 · Colour follows the 2025.10 object form, and hex never carries alpha
Fixture: opaque red, and red at 50% alpha, in both `object` and `hex` formats.
Assert: object form is `{colorSpace: 'srgb', components: [1,0,0], alpha: 1, hex: '#ff0000'}`; the 50% colour's `hex` is still six digits, with the alpha in `alpha`.
Assert also: `hex` format yields `#ff000080` at 50% and `#ff0000` when opaque. An eight-digit `hex` inside the object form is a spec violation that renders correctly everywhere, which is why it is asserted rather than eyeballed.

Runs: node tools/tokens/test-dtcg.js — "object colour is the 2025.10 shape"

## A3 · A display font weight becomes a number, and an unknown one is rejected
Fixture: `"Semi Bold"`, `"SemiBold"`, `"semibold"`, `"Regular"`, `"700"`, `"1400"`, `"Chonky"`.
Assert: 600, 600, 600, 400, 700, `null`, `null`. The first two are the same weight spelled two ways by the same file — one as a variable value, one as `fontName.style`.
Assert also (negative): an unknown weight is skipped and reported, never defaulted to 400 in a variable export. A wrong weight renders, so nobody finds it.

Runs: node tools/tokens/test-dtcg.js — "unknown weight is rejected, not guessed"

## A4 · A string that is not a font family or weight is skipped and reported
Fixture: a STRING variable outside `Font/`, e.g. a currency symbol.
Assert: no token is emitted for it, and `report.skipped` names it with a reason.
Assert also (negative): the exporter does not invent a `$type` for it, and does not fall back to `fontFamily`. There is no DTCG string type; producing one would make an invalid file that validates in no tool and is discovered only downstream.

Runs: node tools/tokens/test-dtcg.js — "the untyped string was skipped, not invented"

## A5 · Aliases export as references, identical across modes
Fixture: a semantic colour aliasing a primitive, in Light and Dark.
Assert: `$value` is `{primitive-scale.palette.blue.4}` in both files — the same string, because the mode lives in the file and not in the path.
Assert also: the value is never resolved to a colour. A flattened export builds fine and throws away the tier structure the library exists for.

Runs: node tools/tokens/test-dtcg.js — "an alias exports as a DTCG reference"

## A6 · Percent typography converts, and AUTO is omitted rather than faked  *(since 2.1.0 an AUTO the collector measured is exported — A24; the clause binds the unmeasured case)*
Fixture: a style at 32px with 115% line height and -2% letter spacing; a second style with `AUTO` line height.
Assert: `lineHeight` is `1.15` (unitless multiplier) and `letterSpacing` is `{value: -0.64, unit: 'px'}` — percent resolved against that style's own font size, which is known at conversion time.
Assert also (negative): the `AUTO` style has **no** `lineHeight` key, and `report.warnings` names it. Inventing a multiplier would ship a value nobody authored.

Runs: node tools/tokens/test-dtcg.js — "percent line height becomes a unitless multiplier"

## A7 · Bound properties export as references, unbound as literals
Fixture: a text style binding `fontFamily` but not `fontSize`.
Assert: `$value.fontFamily` is a reference, `$value.fontSize` is a dimension object.
Assert also: the weight bound through Figma's `fontStyle` lands on DTCG's `fontWeight`. The two names differ, and mapping by name rather than by meaning drops every bound weight.

Runs: node tools/tokens/test-dtcg.js — "a bound family exports as a reference"

## A8 · Opacity scale is decided per group, from the data
Fixture: a group of `[0, 4, 50]`; a group of `[0, 0.04, 0.5]`; the first with an explicit `unit` override.
Assert: divisors 100, 1, and 1. A group whose maximum exceeds 1 is authored 0–100.
Assert also: the explicit setting wins over the detection, so a library that mixes both can still be exported correctly while the mix is fixed in Figma.

Runs: node tools/tokens/test-dtcg.js — "a 0-100 group is detected as percent"

## A9 · The export refuses to be run from the wrong file
Fixture: a consuming file that subscribes to the library rather than owning it.
Assert: the skill directs the run to the source file rather than exporting what it can see. A consuming file has no local variables, cannot enumerate styles at all, and cannot reach a `hiddenFromPublishing` tier even by key — so every alias into that tier would dangle.
Assert also (negative): an empty snapshot is reported as a wrong-file finding, never as an empty library.

Walked live: 2026-08-18 — a four-collection, 12-mode, 565-variable library (fixture: `projects/project-b/`).

## A10 · Every reference resolves in at least one build
Fixture: a real multi-collection library with cross-collection aliases.
Assert: `verifyReferences()` returns `dangling: []` and a build count matching the manifest. Observed clean over 1103 tokens.
Assert also: the check runs over the **built files**, not the snapshot. A dangling reference is silent in Figma and fatal in Style Dictionary, so verifying intent rather than output would prove nothing.

Walked live: 2026-08-18 — the same library: `verifyReferences()` clean over 1103 tokens in 14 files.

## A11 · Collections sharing a mode-name set share one axis
Fixture: three multi-mode collections — two carrying Light/Dark, one carrying an unrelated set.
Assert: the manifest produces 2 × N builds, not 2 × 2 × N; each Light build carries the Light file of **both** Light/Dark collections; no build mixes Light from one tier with Dark from another.
Assert also (negative): a build named `light-dark-…` must never appear. This is the defect the first live run produced — 32 builds where 16 are correct — and it is invisible in a fixture with only one multi-mode collection.

Runs: node tools/tokens/test-dtcg.js — "collections sharing a mode set share an axis — 2x2, not 2x2x2"

## A12 · What is not exported is reported with a count  *(superseded by A19 for effect styles; the clause still binds anything else the export cannot carry)*
Fixture: a library containing effect styles.
Assert: `report.notExported` names effect styles with the correct count and a reason.
Assert also (negative): the export does not silently drop inner shadow layers. (Until 2.7.0 this also forbade an invented `inset` field; DTCG 2025.10 defines `inset`, so the clause is retired.)

Runs: node tools/tokens/test-dtcg.js — "the effect styles this version does not export are reported"

## A13 · A leading minus is preserved, and a real collision is reported
Fixture: a group holding `Offset/1`, `Offset/-1` and `Offset/_1`.
Assert: `-1` lands at `offset.minus-1` with value -1, `1` lands at `offset.1` with value 1, and the third — which slugs onto an occupied path — is skipped with a collision reason.
Assert also (negative): the surviving token is never overwritten. The original defect exported `-1` as a token named `1`, which counts correctly, validates correctly, and is wrong in the only way that matters. It was found by reading the JSON; no count could have shown it.

Runs: node tools/tokens/test-dtcg.js — "a genuine collision is skipped, not written over"

## A14 · Lossy renames are reported; ordinary casing is not
Fixture: the segments `Semi Bold`, `Blue`, `8-anchor`, `primary-translucent`, `1_5`, `-1`; and a two-mode collection holding `Stroke/1_5` beside `Spacing/8`.
Assert: only `1_5` and `-1` are lossy; the report names the Figma name and the path it became (`Stroke/1_5 -> scale.stroke.1-5`), and lists it **once**, not once per mode.
Assert also (negative): an existing hyphen is never a rename, because it maps to itself. The first version of this check flagged every hyphen and returned 42 hits on a 565-variable library where the true answer was two — a detector that fires on everything fails the same way as one that fires on nothing, and both look like results.

Runs: node tools/tokens/test-dtcg.js — "the report names the Figma name and the path it became"

## A15 · The downstream scripts know no collection, mode or brand names
Fixture: any tokens directory, passed as an argument.
Assert: `generate-ts.mjs` and `verify-ts.mjs` discover collections from `<slug>.<mode>.json` filenames, emit one module per collection, and never mention a collection slug, mode name or brand in their source. `grep -iE 'light|dark|semantic|brand' tools/tokens/{generate-ts,verify-ts,discover}.mjs` returns only generic prose and pattern matching, never a lookup keyed by one.
Assert also (negative): a library with different collection and mode names produces modules without editing the scripts. The project-shaped originals had a `MODULE_OF` table of slugs, `startsWith('light-')` comparisons, and assertions on a brand count — all three are gone.

Walked live: 2026-09-19 — a grep over `scripts/*.mjs`, which found only prose in `from-snapshot.mjs`.

## A16 · A cross-axis reference expands over the target's modes
Fixture: a collection whose modes are brands, aliasing a collection whose modes are themes.
Assert: the emitted token is `{ light, dark }` — an object over the *target's* modes — not an index by the referencing file's own mode.
Assert also (negative): indexing by the current mode must not be silently emitted. It compiles, and throws only at import time with `Cannot read properties of undefined`. This was invisible while both collections happened to share the mode names light and dark, and appeared the moment the script stopped assuming them.

Not walked.

## A17 · Values are resolved per mode, never through one shared index
Fixture: two collections, each with light and dark files defining the same token paths.
Assert: the verifier builds one index per mode and compares each mode's output against its own; a colour in the dark file is never compared against the light file's value.
Assert also (negative): a single global index passes just as loudly while resolving half the library to whichever file was loaded last. The tell is that the failure count stays at zero — which is why the check that the comparison examined anything at all sits beside it.

Not walked.

## A18 · A collection is a folder; a mode is a file inside it
Fixture: a two-mode collection and a single-mode one.
Assert: `fileName` returns `semantic/light.json` and `primitive-scale/value.json`; the manifest's sources use those same paths; a single-mode collection still gets a folder rather than a bare file.
Assert also (negative): the mode never appears in a token path. Every mode file of a collection declares the identical set of paths, and an alias reads `{primitive-scale.palette.blue.4}` in both — never `{primitive-scale.light.palette.blue.4}`. Folding modes into one document is legal DTCG and would break exactly this: a theme stops being a file swap and every consumer needs a preprocessor to strip the mode segment.

Runs: node tools/tokens/test-dtcg.js — "a mode is a file inside its collection folder"

## A19 · Effect styles export, inner shadows and layer order included
Fixture: a drop shadow, an inner shadow, a two-layer composite, a hidden layer, and a background-blur layer.
Assert: each becomes a `shadow` token; bound colours and offsets stay references; the inner shadow carries `inset: true` with no `$extensions` mirror; the composite is an array listed top first, so the inner shadow that is Figma's second (topmost) effect is the token's first layer.
Assert also (negative): the hidden layer and the background blur are omitted **with a warning naming the type**, never approximated into a shadow; a style with nothing expressible is skipped rather than emitted empty. The order clause exists because Figma paints its last effect on top and CSS its first: a composite copied through in Figma's order renders reversed, which a single-colour fixture cannot show.

Runs: node tools/tokens/test-dtcg.js — "an inner shadow carries inset"

## A23 · The kind of a variable is read from any segment of its name
Fixture: STRING variables `Label/md/family` and `Label/md/weight`; FLOAT variables `State/Disabled/opacity` (50) and `State/Focus/stroke-width` (2).
Assert: the strings classify as `fontFamily` and `fontWeight`; the opacity is a `number` at `0.5`; its neighbour stays a `dimension` of `{value: 2, unit: 'px'}`. Reading only the first segment skipped the strings and exported the opacity as `50px` — found on a real library whose naming put the kind last.

Runs: node tools/tokens/test-dtcg.js — "a trailing family segment is fontFamily"

## A24 · A measured AUTO line height is exported; an unmeasured one is omitted
Fixture: a 16px style whose collector measured AUTO at 19px (`{unit: 'MEASURED', value: 19}`); the same style with `AUTO` unmeasured.
Assert: the first exports `lineHeight: 1.1875` with no warning; the second has no `lineHeight` and a warning saying it could not be measured. A6's rule stands: nothing is invented, the measured value is what Figma rendered.

Runs: node tools/tokens/test-dtcg.js — "a measured AUTO becomes the multiplier the render used"

## A25 · Colour styles export as color and gradient; what DTCG cannot carry is reported
Fixture: a bound solid, a two-stop linear gradient with one bound stop and one literal, a radial gradient, an image paint.
Assert: the solid is a `color` reference; the gradient is `[{color, position}]` with the reference kept and the literal converted, angle in `$extensions`; radial and image are skipped **by name**; colour styles get `color-style/value.json` and a single-mode axis; `paintStyles: false` lands in `report.notExported` with the count.
Assert also (downstream): Style Dictionary renders the gradient as `linear-gradient(…)` with references as `var()` and a 135° angle as `to bottom right` — probed, not read.

Runs: node tools/tokens/test-dtcg.js — "a linear gradient is DTCG gradient stops, bound where bound, literal where not"

## A26 · A stored snapshot exports without Figma, and keeps what the snapshot only names — *executed*
Fixture: a snapshot tokens file (`tools/tokens/test-from-snapshot.mjs`): values resolved, aliases recorded by name only, colours as CSS strings, text styles with no bindings, one inner shadow, one gradient with a bound stop.
Assert: `#ff0000` and `rgb(0 0 0 / 0.5)` parse back to channels and a variable name does not parse as a colour; the alias `Palette/Grey/12`, recorded by name in `Semantic`, becomes `{primitives-colour.palette.grey.12}` — the collection found by looking the name up — with its description kept and an opacity authored 0–100 divided to 0–1; the text style `Heading/lg` binds its size to `Heading/lg/size` in `Responsive type`, exported as `{responsive-type.heading.lg.size}`; the inner shadow keeps `inset: true`, the gradient keeps its bound stop as a reference and its 180° angle.
Assert also: the files and manifest come from `dtcg.js`, the same converter a live export uses, so no type decision lives in two places.

Runs: node --test tools/tokens/test-from-snapshot.mjs — "an alias recorded by name stays a reference into the collection that defines it"

## A27 · An alias never points at its own collection *(regression)* — *executed*
Fixture: `Brand` defines `Palette/Grey/12` as an alias to `Palette/Grey/12`, listed before `Primitives - Colour`, which defines the same name.
Assert: the alias resolves to `Primitives - Colour`. Looked up by first definer, it pointed at `Brand` itself, a reference to itself.

Runs: node --test tools/tokens/test-from-snapshot.mjs — "an alias to a same-named variable points at the other collection, never itself"

## A28 · An export refuses to clear a folder it did not write *(regression)* — *executed*
Fixture: a non-empty folder with no `manifest.json`; then a folder a previous export wrote.
Assert: the first throws and leaves its file in place; the second is replaced without complaint.

Runs: node --test tools/tokens/test-from-snapshot.mjs — "an export refuses to clear a non-empty folder it did not write"

## A20 · *retired in 2.5.0* — a refresh is one call, and it writes to disk itself
The refresh server this case walked is gone: it read the library live beside the snapshot every other output reads. Its guarantees moved: the TypeScript generate-and-verify step runs in `from-snapshot.mjs`'s CLI (A29), a vanished collection is handled by the owned-only replacement (A29), and the multi-byte chunk lesson lives in the snapshot router, which buffers and decodes a body once.

Not walked.

## A21 · A reference must never survive as a literal string — *executed*
Fixture: a layered shadow whose `$value` is an array of objects, each holding `{…}` references (`tools/tokens/test-ts.mjs`, written by `writeDtcg` from a snapshot shaped like the plugin's).
Assert: every reference inside every layer is emitted as an expression into the owning module. The generator walks arrays, objects and scalars with one recursive function rather than special-casing composites.
Assert also (negative): `verify-ts` fails when any leaf is still a `{a.b.c}` string, and fails when a whole token is missing — it resolves each token path from the JSON rather than counting leaves. Counting leaves with `>=` is unfalsifiable wherever composites exist: a shadow expands into several leaves, so deleting whole tokens still passes. Both checks were shown to fail against the defect that actually shipped under "51/51 passed". Run for the first time on 2026-10-31, the brace-text half did not fail: `verify-ts`'s leaf walk stopped at arrays, so a shadow layer's brace text and a layer's reference to nothing both passed. It walks arrays now.

Runs: node tools/tokens/test-ts.mjs — "a reference left as a literal string", "a reference inside a shadow layer pointed at nothing", "a whole token missing"

## A22 · A required argument has no default *(since 2.5.0 for `from-snapshot.mjs`; the refresh server's write endpoint is retired with it)*
Fixture: `node tools/tokens/from-snapshot.mjs` with no output directory.
Assert: it exits 2 and names both arguments. The directory must never default to the cwd: when the retired server did, a project's whole token export landed inside this skill, 816KB, committed, past two checkers that do not look at `.json` under `scripts/`.

Not walked.

## A29 · A refresh replaces only what the export owns — *executed*
Fixture: an export folder holding a README, `dist/ts/index.ts` and a collection folder the snapshot no longer has (`tools/tokens/test-from-snapshot.mjs`).
Assert: the README and `dist/` stay, the vanished collection goes, the new files are written. Before 2.5.0 the folder was replaced whole, so a project's README and TypeScript went with every refresh. The CLI then runs `generate-ts.mjs` and `verify-ts.mjs`, and a failure in either exits 1 saying the JSON is written and the TypeScript is not trustworthy.

Runs: node --test tools/tokens/test-from-snapshot.mjs — "a refresh replaces only what the export owns: a README and dist/ stay, a vanished collection goes"

## A30 · Bindings and hidden tiers survive a snapshot export — *executed*
Fixture: a snapshot whose text style is bound to variables outside the `<style>/<field>` convention, a shadow layer bound to a semantic colour and to a variable from another library, and a primitive listed in its collection's `hidden`.
Assert: the recorded bindings become references and the foreign ones keep their literals; a snapshot that records bindings is never second-guessed by the convention; the hidden primitive exports with `hiddenFromPublishing: true` and a public one with `false`. Walked on real input for the bindings: Project B's Foundations snapshot against its live export of August, 990 tokens identical, no reference turned literal, the remaining differences the library's own changes since. The hidden half walked the same day on Project B's snapshot from plugin 0.26.0: all 316 primitives of the hidden tier exported `hiddenFromPublishing: true`, none flipped to public.

Runs: node --test tools/tokens/test-from-snapshot.mjs — "a text style takes the bindings the snapshot records, over the naming convention, and drops a foreign one"

## A31 · A downloaded snapshot exports like a stored one — *executed*
Fixture: the whole file the snapshot plugin saves when no receiver listens (0.59.0), `{ kind, tokens, components, … }`, and a stored `tokens.json`.
Assert: both give the same tokens to the converter, so someone without the toolkit's router can export DTCG from the plugin's download.

Runs: node --test tools/tokens/test-from-snapshot.mjs — "a file the plugin downloaded reads as its tokens, a stored tokens.json as itself"
