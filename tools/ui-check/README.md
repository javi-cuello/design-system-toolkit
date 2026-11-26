# UI check

Checks a rendered web page in a headless Chrome against the rules a script can measure. Its `check.mjs` checks the [design-standard](../../standards/design-standard.md) rules. Its `axe.mjs` checks axe-core's WCAG 2.2 A and AA rules. It is what the [frontend-build](../../skills/frontend-build/SKILL.md) skill runs when it audits a built page, and what a project's `bin/check` can call over its own pages.

## Use

```sh
node tools/ui-check/check.mjs http://localhost:4321/ --project <label> --shots /tmp/shots
node tools/ui-check/axe.mjs   http://localhost:4321/ http://localhost:4321/about/
```

Both exit 0 when clean and 1 with findings, each naming the rule it breaks. They exit 2 when a page could not be checked.

| Option | What it does |
|---|---|
| `check.mjs --width <px>` | checks at that width instead of the settings' `viewportWidth` |
| `check.mjs --shots <dir>` | also saves each page at desktop width in light and dark, and at phone width, for a person to look at. The checks see what they measure; the screenshots show the rest. |
| `axe.mjs --disable <rule,rule>` | turns rules off for a run, for findings a project has ruled on. The caller says which and why, beside the call. |

**Needs:** Node 22.12+ and Google Chrome installed. Nothing to install in the project. The browser is driven by [tools/shared](../shared/README.md)'s `cdp.mjs`. Axe-core is vendored in `vendor/` at a pinned version, with its licence beside it, and injected into the page under test.

**Vendored axe.** The two files in `vendor/` are axe-core's own, from its npm package. They are at the version `vendor/package.json` names. That file is never installed. It is there so Dependabot proposes a new version, and `test-axe.mjs` fails while the files lag the version named.

To take a new version, set it in `vendor/package.json`, then run this from `tools/ui-check/vendor/`:

```sh
npm pack axe-core@$(node -p "require('./package.json').devDependencies['axe-core']") && tar -xzf axe-core-*.tgz package/axe.min.js package/LICENSE && mv package/axe.min.js axe.min.js && mv package/LICENSE axe-LICENSE.txt && rm -r package axe-core-*.tgz
```

**Reads** the limits it applies from settings, never numbers in the code. The settings are `interface` in [audit-settings.json](../../standards/audit-settings.json), or a project's own under the same key in its context document.

## Test

```sh
node tools/ui-check/test-check.mjs
node tools/ui-check/test-axe.mjs
node tools/ui-check/test-own-pages.mjs
```

`test-own-pages.mjs` runs axe over the toolkit's own pages. That means every page of the docs site, as `tools/figma-audit/server.mjs` builds and serves it, the dashboard's Audits page among them. It also checks the contract editor, empty and on a component's three tabs.

The project is the contract editor's made-up sample library in a temp projects root, so no project's data is read. It fails on a serious or critical violation and lists the rest as `note:` lines. It runs at desktop width, in light and in dark; a violation found in both is listed once, as "(light, dark)". Without Chrome, or without the docs site's packages, it exits 77.
