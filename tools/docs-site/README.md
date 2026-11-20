# Docs site

This folder builds a documentation site for a design system. It reads the project's stored Figma snapshot, so the site shows what the design holds. To change the docs, change Figma and take a new snapshot. The engine names no project. It finds each one through the snapshot contract, so a project states its own details once.

## What it needs

- Node and pnpm.
- A project with a stored snapshot, found through `layout()` in `tools/snapshot/projects.cjs`.
- Run it from inside this folder. The toolkit is found by walking up from there.

## Run it

```sh
pnpm install --frozen-lockfile          # once, in this folder
DOCS_PROJECT=<label> pnpm dev           # a project's label: its repo under ~/Projects/
DOCS_PROJECT=<label> pnpm build         # → <project home>/site/
DOCS_OUT=/tmp/<label>-site …            # build somewhere else
```

You rarely need to. The dashboard service in [tools/figma-audit](../figma-audit/README.md) builds every project's site when it starts. It builds again whenever the inputs change, and serves the site.

Every build runs through `build.mjs`. It waits for any other build to finish, using the lock in `lock.mjs`. It then builds beside the live site and swaps it in. A failed build never leaves the site empty.

## What it reads and writes

It reads the snapshot's tokens, specs, previews and change log. It reads each component's contract and its Figma description. In the build and maintenance phases it also reads the built Storybook and the last parity report. It writes the site to `<project home>/site/`.

The project's phase decides what a page shows:

| Phase | Shows |
|---|---|
| `design` | A handoff spec. There is no Parity tab, because there is no code yet. |
| `build` | The spec, plus live Storybook previews and the Parity tab. |
| `maintenance` | The same as `build`. |

A component's status is its Figma page marker. Nobody keeps a second status.

## Publish it

`bin/deploy <project> --public` or `--password` uploads the site to Cloudflare. It refuses to run without one of the two flags. That way, who may read a site is decided when it is published. See [bin/README.md](../../bin/README.md) and [Publishing](REFERENCE.md#publishing).

## How it fits

- [REFERENCE.md](REFERENCE.md) holds the detail. It covers the build lock and [where each part of a page comes from](REFERENCE.md#where-things-come-from). It also covers adding a section, the code's layout, publishing and what is parked.
- [stock-ui](../../stock-ui/README.md) is the design system the pages share with the dashboard.
- [tools/parity](../parity/README.md) writes the report the Parity pages read.
- `check-structure.mjs <site dir>` checks the markup of one page of each type. `bin/check` runs it on each project's built site.

## Test

```sh
node tools/docs-site/src/dashboard/check.mjs     # every name a dashboard module uses is declared
node tools/docs-site/test-lib.mjs                # format.js: escaping, names, dates
node tools/docs-site/test-empty-build.mjs        # a project with no component specs still builds
node tools/docs-site/check-structure.mjs <site dir>
```

Each other `test-*.mjs` here names what it holds in its first lines. `bin/check` runs them all. See [Tests](REFERENCE.md#tests).
