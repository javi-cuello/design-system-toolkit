# Parity

This folder is the design-to-code parity engine. It renders a coded component in a browser, measures it against its Figma spec and saves the verdict. Every project's `bin/parity` calls this one copy. A project never keeps its own copy of anything here (`tools/toolkit-check/owned.json`, code-standard 59).

## Two modes

- **Governed:** a project whose code follows the design runs the full loop from its own repo. A red result blocks.
- **Comparison:** a library someone else built is measured against the design as a drift report. Nothing blocks.

The method is the [design-code-parity](../../skills/design-code-parity/SKILL.md) skill: what is compared, the gates, waivers and what a red means. Read it before you set a project up.

## What it needs

- Node 22.12+ and Google Chrome.
- A governed project states its pages, host and baseline in the `parity` block of its `snapshot.config.json`.
- A comparison states its code in its context document. That is `code.repo`, and `code.parity` with the host, how to build it, its one tier, its token files and where its mappings are.

Both write their mappings in [one format](REFERENCE.md#the-mapping-format), and `project.mjs` reads either.

## Run it

```sh
# governed, from the project repo (its bin/parity calls this)
node ~/Projects/toolkit/tools/parity/run.mjs --repo .              # every gate and every variant; exit 0 is green
node ~/Projects/toolkit/tools/parity/run.mjs --repo . --gates      # only the gates that need no browser
node ~/Projects/toolkit/tools/parity/run.mjs --repo . --accept     # make this run's measurements the accepted baseline
node ~/Projects/toolkit/tools/parity/propose.mjs --repo . <screen-key> [/route] [--write]   # propose a screen's map; --write merges what it lacks

# comparison: a library someone else built, rendered in its own Storybook
node ~/Projects/toolkit/tools/parity/external.mjs --project <label> [component …]
```

The comparison also takes `--draft`, `--rebuild` and `--auto-pair`. Each is explained in [external.mjs](external.mjs)'s header and under [Comparison flags](REFERENCE.md#comparison-flags).

## What it reads and writes

It reads the project's stored Figma snapshot, its mappings and its rendered pages. It writes the verdict a docs site shows. A comparison writes `parity/report.json` in the project's `parity` folder. A governed run writes where the project's `paths.parity` says.

## What is in the folder

| File | Job |
|---|---|
| `run.mjs` | the governed run, every gate then every variant |
| `external.mjs` | the comparison of a library built elsewhere |
| `watch.mjs` | re-runs the comparison when an input changes; `--stories` builds a Storybook |
| `propose.mjs` | proposes a screen's map |
| `same-as.mjs` | pairs a design prop with a renamed code prop |
| `pair.mjs` | pairs rendered elements with the design by rule |
| `project.mjs` | loads a project as the engine sees it |
| `adapt.mjs` | turns Figma into expected values |
| `layers.mjs` | finds the layer a mapped path names |
| `probe.mjs` | reads values off a rendered element |
| `hosts.mjs` | puts a page on screen |
| `session.mjs` | builds, serves and opens a project's pages |
| `serve.mjs` | the static server for a built story tool |
| `diff.mjs` | judges expected values against measured ones |
| `schema.mjs` | what the differ can judge |
| `values.mjs` | parses what a browser reports |
| `gates.mjs` | every gate that needs no browser |
| `pages.mjs` | axe, structure and overflow gates on real pages |
| `waivers.mjs` | gate 6, the waiver policy |
| `spec-keys.mjs` | gate 10, every spec key compared or excused |
| `baseline.mjs` | gate 12, this run against the last accepted one |
| `measurements.mjs` | checks two passes of one render agree |
| `lessons.mjs` | lists new rulings when a run is accepted |
| `timing.mjs` | times each phase and warns on a slowdown |
| `shots.mjs` | advisory pictures |
| `parity-report.mjs` | writes the saved verdict |

Each module's full job is in its header comment and in the [modules table](REFERENCE.md#modules). The Chrome client lives in [tools/shared](../shared/README.md).

## How it fits

- [REFERENCE.md](REFERENCE.md) holds the detail: the mapping format, the config keys a project supplies, waiver shapes, translations, environment variables and what keeps a run fast.
- The [design-code-parity](../../skills/design-code-parity/SKILL.md) skill holds the method.
- A project's `bin/parity` is a few lines that run `run.mjs`.

## Test

```sh
for t in tools/parity/test-*.mjs; do node "$t" || break; done
```

Some tests need Chrome. Without it they print `skip:` and exit 77. See [Tests](REFERENCE.md#tests).
