# Tokens

The one token build every project runs: it turns a project's stored Figma snapshot into DTCG token files and then into CSS and Sass, and checks that a project's generated stylesheets are exactly what that build writes. One build means two projects cannot drift into two conventions; the rules it applies are [code-standard](../../standards/code-standard.md) rules 51–55.

## Use

From a project repo, through its `bin/tokens` and `bin/check` (which call these):

```sh
node ~/Projects/toolkit/tools/tokens/build.mjs --repo .            # write the token files
node ~/Projects/toolkit/tools/tokens/build.mjs --repo . --check    # regenerate beside them and diff
node ~/Projects/toolkit/tools/tokens/check.mjs --repo .            # the token gates, exit 1 on a finding
```

**Needs:** Node 22.12+, and Style Dictionary installed in the project repo (`pnpm add -D style-dictionary`): it is the project's dependency, so the toolkit stays dependency-free.

**Reads** the snapshot's `tokens.json` (where `snapshot.config.json` puts it). **Writes** DTCG files in `dtcg/` beside the snapshot, and the stylesheets at the repo's `paths.styles`.

**Names a token in CSS** for every other reader: `names.mjs` `cssName(collection, name)` is the custom property the build writes for a variable (`Color/textStrong` → `--color-text-strong`) and `cssFamily(name)` the prefix its family shares (`--spacing-`), composed from the build's own two steps. The docs site, the docs MCP's validator, the parity engine's hints and the stylesheet lint call it; `test-names.mjs` holds it.

## How it fits

Both conversion steps live here, because every project's build runs them: snapshot → DTCG is `from-snapshot.mjs` over `dtcg.js` (which [figma-token-export](../../skills/figma-token-export/SKILL.md) also pastes into Figma for a live export), with `generate-ts.mjs` and `verify-ts.mjs` mirroring the result as TypeScript; DTCG → CSS and Sass is `build-tokens.mjs` ([frontend-build](../../skills/frontend-build/SKILL.md) explains it). Until 2026-10-31 they were those skills' scripts; the old `from-snapshot.mjs` and `build-tokens.mjs` paths forward here for one release. The snapshot router runs a project's `bin/tokens` after every snapshot ([tools/snapshot](../snapshot/README.md)).

## Test

```sh
node --test tools/tokens/test-check.mjs        # needs a project repo beside the toolkit with Style Dictionary installed
node --test tools/tokens/test-build-tokens.mjs # the CSS and Sass build
node tools/tokens/test-dtcg.js                 # snapshot names and values → DTCG
node --test tools/tokens/test-from-snapshot.mjs
```
