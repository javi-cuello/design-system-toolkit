# Tokens reference

The detail behind the token build's [README](README.md): what it needs, how a token is named in CSS, how modes and the two conversion steps fit, what the conversion does, and how the tests prove conformance. The rules it applies are [code-standard](../../standards/code-standard.md) rules 51–55.

## What it needs

Node 22.12+, and Style Dictionary installed in the project repo (`pnpm add -D style-dictionary`): it is the project's dependency, so the toolkit stays dependency-free. This folder's own suites run through a pinned copy (`package.json` here, `pnpm install --frozen-lockfile`), so they run with no project, as in CI; without it and with no project to borrow from, they exit 77, a skip to `bin/check` and a failure in CI.

## Reads and writes

**Reads** the snapshot's `tokens.json` (where `snapshot.config.json` puts it). **Writes** DTCG files in `dtcg/` beside the snapshot, and the stylesheets at the repo's `paths.styles`.

## Naming a token in CSS

For every other reader, `names.mjs` `cssName(collection, name)` is the custom property the build writes for a variable (`Color/textStrong` → `--color-text-strong`) and `cssFamily(name)` the prefix its family shares (`--spacing-`), composed from the build's own two steps. Its callers include the docs site, the system MCP's validator, the parity engine's hints, the stylesheet lint and the component-contract tools; `test-names.mjs` holds it.

## Which tokens are breakpoints

`build-tokens.mjs` `breakpointOf(path, values)` decides, and the docs site's Sass names read it. A token is a breakpoint, written to `_breakpoints.scss` and never as a property, when its name says so (a `Breakpoint/<name>` group, or a collection named for breakpoints) and it is one literal length in every mode of its collection: a media query reads neither a mode nor a `var()`. A collection named for breakpoints that has modes is a responsive axis, its tokens values per viewport (a padding, a font size), written as properties under `data-<collection>` like any other mode. An alias is not followed, so a breakpoint aliasing another token is written as a property; and a Mobile/Tablet/Desktop collection that then finds no `sm`/`md` fails the build, as before.

## Modes and the two conversion steps

How a collection's modes are named in code is `modes.cjs`'s, the one owner: collections sharing a mode set are one axis, written under one attribute (`data-theme` for Light/Dark, else `data-<first collection>`). `build-tokens.mjs` writes every mode, the base too, as that attribute after the page-wide switches (the system's dark preference, a breakpoint), re-declaring the axis's tokens and every single-mode token aliasing them, since a custom property's `var()` resolves where it is declared; so a layer Figma sets to a mode is that mode in code wherever it sits. A token of another axis aliasing it cannot be scoped and is warned about.

Both conversion steps live here, because every project's build runs them: snapshot → DTCG is `from-snapshot.mjs` over `dtcg.js` (a tokens folder's shape, one folder per collection and one file per mode, is read by `discover.mjs`), with `generate-ts.mjs` and `verify-ts.mjs` mirroring the result as TypeScript. `from-snapshot.mjs` writes nothing unless every reference resolves inside each resolution: `dtcg.js`'s `verifyReferences(files, resolutions)`. `verify-ts.mjs` loads every module at once, so it cannot see a reference that resolves only in another resolution's sources; DTCG → CSS and Sass is `build-tokens.mjs` ([frontend-build](../../skills/frontend-build/SKILL.md) explains it). Until 2026-10-31 they were those skills' scripts; the old `build-tokens.mjs` path forwards here for one release, and the old `from-snapshot.mjs` path went with the figma-token-export skill (2026-11-05). The snapshot router runs a project's `bin/tokens` after every snapshot ([tools/snapshot](../snapshot/README.md)).

## What the conversion does

Moved here from the retired figma-token-export skill (2026-11-05), whose converter this folder runs. The command writes object colours, `px` and a root of 16; `dtcg.js`'s other options (`colorFormat: 'hex'`, `noExtensions`, an opacity scale, `rem` with a root size) are reachable from code only. Why each mapping is what it is: `git show 196b9581:skills/figma-token-export/references/mapping.md`.

### Plain DTCG, so any tool can take it

The export is the standard, with the house's additions only where the standard leaves room for them (`$extensions`): [DTCG Format 2025.10](https://www.designtokens.org/tr/2025.10/format/) token files, and beside them `tokens.resolver.json`, a [Resolver Module 2025.10](https://www.designtokens.org/tr/2025.10/resolver/) document saying which files make which theme. It assumes no tool: a team that wants none of the house CSS points any DTCG tool at the files, and at the resolver once its tool reads one. The house build is Style Dictionary, which reads the token files today and composes the modes itself until it reads resolvers ([issue 1590](https://github.com/style-dictionary/style-dictionary/issues/1590)); then it can take the resolver as it stands. The resolver's description says the export wrote it, and that is how an export knows a folder is its own: a resolver someone else wrote, at the same suggested name, is refused rather than cleared. Until then the export wrote a house `manifest.json`, which an export still recognises as its own and removes.

- **The resolver.** The single-mode collections and styles are one set (`base`). A collection holding nothing DTCG can type (only booleans) is left out, folder and axis, rather than multiplying the resolutions with empty files; two modes, collections or style roots whose names slug alike refuse the export, since they would share one file. Each distinct set of mode names is one modifier, its contexts the modes, slugged as the file names are, and its default Figma's default (the first collection's first mode). Figma has no name for a mode axis, so a modifier is named by the collections that move on it, joined with `+` (`primitives-colour+semantic`), and its description lists them. References are relative to the resolver. Style Dictionary does not read resolvers yet ([issue 1590](https://github.com/style-dictionary/style-dictionary/issues/1590)), so the house build composes the same files itself.
- **Typography** carries the spec's five members (§9.8 requires all five): a style with no tracking gets zero. The one exception is a line height the snapshot could not measure: it stays out, never invented, and the warning says that token falls short of DTCG. Paragraph and list spacing have no member, so they ride in the token's `$extensions` under `com.figma.variables`, beside the tracking fraction a mode-bound size needs. The key is Figma's namespace holding the toolkit's reading of Figma, kept from before this change so stored exports do not churn. A conforming tool ignores them, and the house build writes them as `--<style>-paragraph-spacing` and `--<style>-list-spacing`.

### Naming parity is the thing to protect

A token system's value is that design and code name the same thing the same way, and the most common way that erodes is a tool quietly translating names on the way out. This conversion translates — it must, because DTCG paths cannot carry every character a Figma name can — so it reports every translation it could not make reversible, and says so rather than hiding it.

The check is deliberately narrow. Flagging every case change would flag every token and be read as noise; the first version of it also flagged every existing hyphen and returned 42 hits on a 565-variable library, where the true answer was two. A detector that fires on everything is the same failure as one that fires on nothing.

Three shapes to expect, all worth fixing at the source rather than in the pipeline:

- **A sign in a name** — `Position/-1` becomes `minus-1`. The Figma name reads as a number, the code name reads as a word.
- **Punctuation standing in for a decimal** — `Stroke/1_5` becomes `1-5`. A literal `1.5` would be worse, because a dot is the DTCG path separator.
- **Two names that collapse onto one path**, which is not a rename but a loss, and appears in `skipped` instead.

### One bundle per resolution is usually too many

The build never lists the resolutions to check them: every reference is checked per axis (defined in the single-mode files, in its own mode's file, or in every mode of another axis), which is exact because the axes are independent. A library with a dozen mode collections has millions of resolutions; listing them ran one out of memory.

The resolver says which source sets are *valid*, not how many files to ship. Before building one bundle per resolution, diff two of them. Where a mode axis moves a single token — a brand switch that only repoints one alias is the common case — the bundles come out near-identical, and the right shape is one file per *theme* plus a small file of per-mode overrides scoped to an attribute.

Measured on a real library: two brand bundles of the same theme differed by **one declaration out of 593**, and each carried seven brand ramps nobody in that bundle used. Sixteen files became three, 15MB became 744KB, and every one of the sixteen combinations was still reproducible. The tell is cheap to check and easy to skip: `diff` two built bundles before deciding the shape.

### Type mapping

| Figma | DTCG `$type` | Conversion |
|---|---|---|
| COLOR | `color` | `{colorSpace: 'srgb', components, alpha, hex}`, or a hex string through `colorFormat: 'hex'`. `hex` is always 6-digit — the spec's fallback may not carry alpha. |
| FLOAT | `dimension` | `{value, unit}`. **A bare number is not a dimension in 2025.10** and is the most common export defect. |
| FLOAT that is a font weight: scoped `FONT_WEIGHT`, named for one (`Font weight`, `Font/Weight`; `weight` alone is also a stroke's) or bound by a text style as one, or linked to one by aliases | `fontWeight` | The number as it is, `400`, never `25rem`. Only where every value is a whole number from 1 to 1000 and no scope is a length's; a target is one only where all that alias it are, and where an alias and its target would differ both stay `dimension`. |
| FLOAT with an `opacity…` segment anywhere in its name | `number` | Divided by 100 where the collection's values, per mode, are authored 0–100. `Opacity/disabled` and `State/Disabled/opacity` are both opacity; reading only the first segment exported the second as a `50px` dimension. |
| STRING whose name says no kind, which Figma scopes to font family (`FONT_FAMILY`) or a text style binds as its family, or which such a string aliases | `fontFamily` | Material 3's `Display Large/Font`, and the theme's `Font/Brand` it aliases. The name rules below come first; a string weight is never taken from a scope; and a scoped string stays untyped where an alias it holds lands on anything but a family, or its name is also a group. |
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
- **A name that is a token and also a group** (Atlassian's `color.text.warning` beside `color.text.warning.inverse`) is written as the group with its own token under `$root` (DTCG 2025.10 §6.2), in every mode's file alike, and a reference to it says `{….$root}`. CSS names it as the group (`--color-text-warning`, never `-root`). Style Dictionary 5.5.3 resolves a `$root` reference but cannot write it as `var()` (its match pattern leaves the `$` unescaped), so the build hands it the segment `@root`, which no slug can produce.
- **Another library's collections** (sent `remote` by the snapshot, for the variables a component binds) are exported beside the file's own. One whose slug a local collection, or an earlier remote one, already takes is numbered (`🌮 Spacing` beside `Spacing` is `spacing-2/`), by one table (`dtcg.js collectionSlugs`) that the build, the mode axes (`modes.cjs`) and to-figma all read. Two local collections that slug alike are still refused. A remote variable whose CSS name an earlier variable already holds is left out (CSS drops the collection, so the two could not be told apart), and a reference to it goes to the holder.
- **Mode names are the join key, not mode ids.** Ids are file-local; a name survives a re-export and a different file.
- **`$extensions` provenance is deliberate.** Every variable token carries its Figma collection, original name, mode and hidden flag, so an export can be traced back without opening Figma. `dtcg.js`'s `noExtensions: true` gives a leaner file; a text style's paragraph and list spacing and its tracking fraction are written whatever the option, being the design rather than provenance, and the house build reads them under whichever vendor key the export used.

## Tests

The two Style Dictionary suites use this folder's pinned copy, else one a registered project installed ([What it needs](#what-it-needs)). `test-from-snapshot.mjs` and `test-schema.mjs` export the same invented library, `fixture-snapshot.mjs`.

**Conformance is the standard's, not a tool's.** `test-schema.mjs` validates every file the fixture export writes, and its resolver, against the DTCG group's own JSON Schemas, copied into `schemas/dtcg-2025.10/`, with ajv (test-only, in this folder's `package.json`; no project installs it). A tool accepting a file proves only that the tool is lenient: one built the old export whose typography carried two members DTCG does not have, and the schema rejects that file. It checks the fixture's export, file by named file, and that the resolver names exactly those files. One known gap is pinned rather than hidden: a text style whose AUTO line height the snapshot could not measure is exported without `lineHeight`, warned, and that token fails the schema. The schemas check shape, not meaning; a reference to a missing token stays `verifyReferences`'s to catch.
