# UI check

Checks a rendered web page in a headless Chrome against the rules a script can measure: the [design-standard](../../standards/design-standard.md) rules (`check.mjs`) and axe-core's WCAG 2.2 A and AA rules (`axe.mjs`). It is what the [frontend-build](../../skills/frontend-build/SKILL.md) skill runs when it audits a built page, and what a project's `bin/check` can call over its own pages.

## Use

```sh
node tools/ui-check/check.mjs http://localhost:4321/ --project <label> --shots /tmp/shots
node tools/ui-check/axe.mjs   http://localhost:4321/ http://localhost:4321/about/
```

Both exit 0 when clean, 1 with findings (each naming the rule it breaks), 2 when a page could not be checked. `check.mjs --width <px>` checks at that width instead of the settings' `viewportWidth`; `--shots <dir>` also saves each page at desktop width in light and dark and at phone width, for a person to look at: the checks see what they measure, the screenshots show the rest. `axe.mjs --disable <rule,rule>` turns rules off for a run, for findings a project has ruled on; the caller says which and why, beside the call.

**Needs:** Node 22.12+ and Google Chrome installed. Nothing to install in the project: the browser is driven by [tools/shared](../shared/README.md)'s `cdp.mjs`, and axe-core is vendored in `vendor/` at a pinned version (its licence beside it) and injected into the page under test.

**Vendored axe.** `vendor/axe.min.js` and `vendor/axe-LICENSE.txt` are axe-core's own files from its npm package, at the version `vendor/package.json` names; that file is never installed, it is there so Dependabot proposes a new version and `test-axe.mjs` fails while the file lags the version named. To take a new version, set it in `vendor/package.json`, then from `tools/ui-check/vendor/`:

```sh
npm pack axe-core@$(node -p "require('./package.json').devDependencies['axe-core']") && tar -xzf axe-core-*.tgz package/axe.min.js package/LICENSE && mv package/axe.min.js axe.min.js && mv package/LICENSE axe-LICENSE.txt && rm -r package axe-core-*.tgz
```

**Reads** the limits it applies from settings (`interface` in [audit-settings.json](../../standards/audit-settings.json), or a project's own under the same key in its context document), never numbers in the code.

## Test

```sh
node tools/ui-check/test-check.mjs
node tools/ui-check/test-axe.mjs
```
