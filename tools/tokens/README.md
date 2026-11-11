# Tokens

The one token build every project runs: it turns a project's stored Figma snapshot into DTCG token files and then into CSS and Sass, and checks that a project's generated stylesheets are exactly what that build writes. One build means two projects cannot drift into two conventions; the rules it applies are [code-standard](../../standards/code-standard.md) rules 51–55.

## Use

From a project repo, through its `bin/tokens` and `bin/check` (which call these):

```sh
node ~/Projects/toolkit/tools/tokens/build.mjs --repo .            # write the token files
node ~/Projects/toolkit/tools/tokens/build.mjs --repo . --check    # regenerate beside them and diff
node ~/Projects/toolkit/tools/tokens/check.mjs --repo .            # the token gates, exit 1 on a finding
```

**Needs:** Node 22.12+, and Style Dictionary installed in the project repo (`pnpm add -D style-dictionary`): it is the project's dependency, so the toolkit stays dependency-free. This folder's own suites run through a pinned copy (`package.json` here, `pnpm install --frozen-lockfile`), so they run with no project, as in CI; without it and with no project to borrow from, they exit 77, a skip to `bin/check` and a failure in CI.

**Reads** the snapshot's `tokens.json` (where `snapshot.config.json` puts it). **Writes** DTCG files in `dtcg/` beside the snapshot, and the stylesheets at the repo's `paths.styles`.

**Names a token in CSS** for every other reader: `names.mjs` `cssName(collection, name)` is the custom property the build writes for a variable (`Color/textStrong` → `--color-text-strong`) and `cssFamily(name)` the prefix its family shares (`--spacing-`), composed from the build's own two steps. Its callers include the docs site, the system MCP's validator, the parity engine's hints, the stylesheet lint and the component-contract tools; `test-names.mjs` holds it.

## How it fits

Both conversion steps live here, because every project's build runs them: snapshot → DTCG is `from-snapshot.mjs` over `dtcg.js` (a tokens folder's shape, one folder per collection and one file per mode, is read by `discover.mjs`), with `generate-ts.mjs` and `verify-ts.mjs` mirroring the result as TypeScript. `from-snapshot.mjs` writes nothing unless every reference resolves inside each manifest build: `dtcg.js`'s `verifyReferences(files, manifest)`. `verify-ts.mjs` loads every module at once, so it cannot see a reference that resolves only in another build's sources; DTCG → CSS and Sass is `build-tokens.mjs` ([frontend-build](../../skills/frontend-build/SKILL.md) explains it). Until 2026-10-31 they were those skills' scripts; the old `build-tokens.mjs` path forwards here for one release, and the old `from-snapshot.mjs` path went with the figma-token-export skill (2026-11-05). The snapshot router runs a project's `bin/tokens` after every snapshot ([tools/snapshot](../snapshot/README.md)).

## What the conversion does

Moved here from the retired figma-token-export skill (2026-11-05), whose converter this folder runs. The command writes object colours, `px` and a root of 16; `dtcg.js`'s other options (`colorFormat: 'hex'`, `noExtensions`, an opacity scale, `rem` with a root size) are reachable from code only. Why each mapping is what it is: `git show 196b9581:skills/figma-token-export/references/mapping.md`.

### Naming parity is the thing to protect

A token system's value is that design and code name the same thing the same way, and the most common way that erodes is a tool quietly translating names on the way out. This conversion translates — it must, because DTCG paths cannot carry every character a Figma name can — so it reports every translation it could not make reversible, and says so rather than hiding it.

The check is deliberately narrow. Flagging every case change would flag every token and be read as noise; the first version of it also flagged every existing hyphen and returned 42 hits on a 565-variable library, where the true answer was two. A detector that fires on everything is the same failure as one that fires on nothing.

Three shapes to expect, all worth fixing at the source rather than in the pipeline:

- **A sign in a name** — `Position/-1` becomes `minus-1`. The Figma name reads as a number, the code name reads as a word.
- **Punctuation standing in for a decimal** — `Stroke/1_5` becomes `1-5`. A literal `1.5` would be worse, because a dot is the DTCG path separator.
- **Two names that collapse onto one path**, which is not a rename but a loss, and appears in `skipped` instead.

### One bundle per manifest entry is usually too many

The manifest says which source sets are *valid*, not how many files to ship. Before building one bundle per entry, diff two of them. Where a mode axis moves a single token — a brand switch that only repoints one alias is the common case — the bundles come out near-identical, and the right shape is one file per *theme* plus a small file of per-mode overrides scoped to an attribute.

Measured on a real library: two brand bundles of the same theme differed by **one declaration out of 593**, and each carried seven brand ramps nobody in that bundle used. Sixteen files became three, 15MB became 744KB, and every one of the sixteen combinations was still reproducible. The tell is cheap to check and easy to skip: `diff` two built bundles before deciding the shape.

### Type mapping

| Figma | DTCG `$type` | Conversion |
|---|---|---|
| COLOR | `color` | `{colorSpace: 'srgb', components, alpha, hex}`, or a hex string through `colorFormat: 'hex'`. `hex` is always 6-digit — the spec's fallback may not carry alpha. |
| FLOAT | `dimension` | `{value, unit}`. **A bare number is not a dimension in 2025.10** and is the most common export defect. |
| FLOAT with an `opacity…` segment anywhere in its name | `number` | Divided by 100 where the collection's values, per mode, are authored 0–100. `Opacity/disabled` and `State/Disabled/opacity` are both opacity; reading only the first segment exported the second as a `50px` dimension. |
| STRING with a `family…` segment anywhere | `fontFamily` | Verbatim. `Font/Family/text` and `Label/md/family` are both families. |
| STRING with a `weight…` segment anywhere | `fontWeight` | Mapped to a number. `"Semi Bold"` and `"SemiBold"` both → 600; an unknown weight is **rejected and reported**, never guessed. |
| STRING, anything else; BOOLEAN | — | No DTCG type exists. Skipped and reported. |
| Alias, any type | — | A real `{group.token}` reference wherever its target is in the snapshot, never resolved to a value: flattening an alias throws away the tier structure that made the library worth exporting. |
| Text style | `typography` | Family/size/weight bound to a variable in this snapshot export as references (another library's stay literal); percent line height becomes a unitless multiplier; percent letter spacing resolves against that style's own font size into an absolute dimension, and where the size is bound to a variable (which can change by mode) the fraction also rides in `$extensions` as `letterSpacingEm`, which the Style Dictionary build writes as `em`. An `AUTO` line height is **measured** by the snapshot plugin on a rendered text node (Figma's AUTO is the font's ascender + descender rounded to whole pixels, which CSS `normal` does not reproduce) and exported as that multiplier. Where it cannot be measured the plugin falls back to a font metric and records `lineHeightSource: 'metric'`, which the conversion does not read yet, so that value goes out unflagged. |
| Colour style, solid | `color` | A reference when the paint is bound, a colour otherwise. |
| Colour style, linear gradient | `gradient` | DTCG stops `[{color, position}]`, each colour a reference where bound. The type defines no direction, so the angle rides in `$extensions` — read from the gradient handles in the node's unit square, where a diagonal stretches with the frame as CSS corner keywords do and a degree value does not. The Style Dictionary build renders `linear-gradient(…)` with diagonals as keywords. Radial, angular and image paints have no DTCG type and are reported. |

### Shadows

Effect styles export as `shadow` tokens, single-layer or an array, with each layer's colour, offset, blur and spread kept as references wherever the style binds a variable. An inner shadow carries `inset: true`, a member the DTCG Format defines since its 2025.10 report. Style Dictionary's `shadow/css/shorthand` renders it (`inset 0px 2px 4px 0px rgb(…)`, verified against 5.5.1).

**Layers are listed top first.** Figma's effects array paints its **last** entry on top — tested on 2026-10-01 with two opaque, offset shadows — while a CSS shadow list paints its **first** on top, and Style Dictionary writes the array in order. So the export walks the effects from the end. DTCG itself does not define the order of a shadow array; top first is the CSS reading, and the one every consumer here renders. Copying Figma's order straight through reverses the stack, which is invisible for shadows of one colour and wrong for any style that layers two.

A **hidden layer** is dropped by the snapshot plugin, without a warning. A layer that is not a drop or inner shadow — a background blur, say — is omitted, its type named in the report (the command prints only the name), because DTCG's shadow type has nothing to express it with.

### Failure modes worth knowing

- **An alias whose target is not in the snapshot becomes its resolved value, silently** (`from-snapshot.mjs`): the token keeps its value and loses its tier, and nothing reports it yet.
- **Mode names are the join key, not mode ids.** Ids are file-local; a name survives a re-export and a different file.
- **`$extensions` provenance is deliberate.** Every variable token carries its Figma collection, original name, mode and hidden flag, so an export can be traced back without opening Figma. `dtcg.js`'s `noExtensions: true` gives a leaner file.

## Test

```sh
node tools/tokens/test-check.mjs              # the token gates, on a throwaway repo (77: skipped)
node tools/tokens/test-build-tokens.mjs         # the CSS and Sass build (run plainly: its skip exits 77)
node tools/tokens/test-dtcg.js                  # snapshot names and values → DTCG
node --test tools/tokens/test-from-snapshot.mjs # the converter, and the per-build reference check
node tools/tokens/test-ts.mjs                   # generate-ts and verify-ts, each defect verify-ts exists for
node tools/tokens/test-names.mjs                # cssName and cssFamily
```

The two Style Dictionary suites use this folder's pinned copy, else one a registered project installed (**Needs**, above).
