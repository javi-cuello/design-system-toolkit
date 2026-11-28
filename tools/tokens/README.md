# Tokens

This is the one token build every project runs. It turns a project's stored Figma snapshot into DTCG token files, then into CSS and Sass. It also checks that a project's stylesheets are exactly what the build writes. With one build, two projects cannot drift into two conventions. The rules it applies are [code-standard](../../standards/code-standard.md) rules 51–55.

## What it needs

- Node 22.12+.
- Style Dictionary in the project repo: `pnpm add -D style-dictionary`. It is the project's dependency, so the toolkit stays dependency-free.

How this folder's own tests find Style Dictionary is under [What it needs](REFERENCE.md#what-it-needs).

## Run it

A project's `bin/tokens` and `bin/check` call these from its repo:

```sh
node ~/Projects/toolkit/tools/tokens/build.mjs --repo .            # write the token files
node ~/Projects/toolkit/tools/tokens/build.mjs --repo . --check    # regenerate beside them and diff
node ~/Projects/toolkit/tools/tokens/check.mjs --repo .            # the token gates, exit 1 on a finding
```

## What it reads and writes

It reads the snapshot's `tokens.json`, wherever `snapshot.config.json` puts it. It writes DTCG files in `dtcg/` beside the snapshot. It writes the stylesheets at the repo's `paths.styles`.

## What is in the folder

| File | Job |
|---|---|
| `build.mjs` | the command a project runs. Its `tokenBuild` is the same build for a caller: eval.mjs uses it to refuse a measure on stale tokens. |
| `check.mjs` | the token gates |
| `from-snapshot.mjs` | snapshot to DTCG files |
| `dtcg.js` | the converter `from-snapshot.mjs` runs |
| `discover.mjs` | reads a tokens folder's shape |
| `build-tokens.mjs` | DTCG to CSS and Sass |
| `modes.cjs` | how a collection's modes are named in code |
| `sheet.cjs` | a built token sheet read back as declarations |
| `names.mjs` | a token's CSS custom property name |
| `generate-ts.mjs` | mirrors the DTCG files as TypeScript |
| `verify-ts.mjs` | checks that TypeScript mirror |
| `fixture-snapshot.mjs` | an invented library the tests export |

Other tools name a token in CSS through `names.mjs`. See [Naming a token in CSS](REFERENCE.md#naming-a-token-in-css). How modes become attributes is under [Modes and the two conversion steps](REFERENCE.md#modes-and-the-two-conversion-steps).

## What the conversion does

The output is plain DTCG 2025.10 with a resolver file, so any DTCG tool can read it. The conversion reports every name it could not translate back. It never guesses a line height or font weight it could not read. Every mapping and its reasons are under [What the conversion does](REFERENCE.md#what-the-conversion-does).

## How it fits

- [REFERENCE.md](REFERENCE.md) holds the detail: type mapping, shadows, naming parity, failure modes and conformance.
- The snapshot router runs a project's `bin/tokens` after every snapshot. See [tools/snapshot](../snapshot/README.md).
- [frontend-build](../../skills/frontend-build/SKILL.md) explains the CSS and Sass build.

## Test

```sh
node tools/tokens/test-check.mjs              # the token gates, on a throwaway repo (77: skipped)
node tools/tokens/test-build-tokens.mjs         # the CSS and Sass build (run plainly: its skip exits 77)
node tools/tokens/test-dtcg.js                  # snapshot names and values → DTCG
node --test tools/tokens/test-from-snapshot.mjs # the converter, and the per-resolution reference check
node tools/tokens/test-schema.mjs               # an export against the DTCG 2025.10 schemas (run plainly: no ajv exits 77)
node tools/tokens/test-ts.mjs                   # generate-ts and verify-ts, each defect verify-ts exists for
node tools/tokens/test-names.mjs                # cssName and cssFamily
```

Exit 77 means skipped. See [Tests](REFERENCE.md#tests).
