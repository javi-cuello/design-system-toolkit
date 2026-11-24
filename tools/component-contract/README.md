# Component contract

This folder turns a component's Figma drawing into a contract: what the drawing means, in words no platform owns. The stored spec, `figma.json`, measures the drawing. The contract, `contract.json` beside it, says the props, their defaults, the parts, what each prop changes and which combinations do not exist. Code, agents and docs read it when they need intent rather than pixels.

## Status

In use. The snapshot router writes a contract beside every stored spec on each library snapshot. A check holds each contract to its spec, and every stored variant must rebuild from it. On 2026-10-05 all 419 stored components rebuilt exactly.

## What it needs

- Node.
- A project's stored Figma snapshot, with its component specs.
- Google Chrome for the commands that read code.
- The Desktop Bridge for the commands that draw in Figma.

## Run it

```sh
# write every contract beside its spec, after derive.cjs changes
node tools/component-contract/write.cjs <components dir>

# from the contract to code: stylesheets, then markup and stories
node tools/component-contract/to-code.mjs --project <label> [component…]
node tools/component-contract/to-code.mjs --project <label> --check
node tools/component-contract/to-markup.mjs --project <label> --framework react

# from code back to a contract, and back into Figma
node tools/component-contract/from-code.mjs --project <label> <component>
node tools/component-contract/from-code.mjs --project <label> <component> --rebuild --code-only
node tools/component-contract/to-figma.mjs <contract> --run --project <label> --into <scratch fileKey>
node tools/component-contract/to-figma.mjs <contract> --verify --project <label> --into <scratch fileKey>
node tools/component-contract/to-figma.mjs <contract>… --lookup <keys file> --project <label>
node tools/component-contract/to-figma.mjs <contract> --patch <set id> --base <contract> --project <label> --library <key> --folder <name>
node tools/component-contract/looks.mjs --project <label> [components…] --out <dir>

# the whole round trip held to its goal
node tools/component-contract/eval.mjs --project <label> --fields --causes --diff --panel --check
node tools/component-contract/eval.mjs --project <label> --accept
node tools/component-contract/eval.mjs --project <label> --make-panel <n>
node tools/component-contract/eval.mjs --project <label> --draw <scratch fileKey> --keep-unchanged
node tools/component-contract/eval.mjs --project <label> --self --twice --changed --jobs 4 --second
node tools/component-contract/eval.mjs --projects <label,label…> --legs self,second --jobs 4 --log <file>
node tools/component-contract/eval.mjs --projects <label,label…> --mechanisms --top 25 --near 15

# which contract is official, and a component's properties table
node tools/component-contract/official.mjs --project <label>
node tools/component-contract/contract-rows.mjs --live <project> <page name…> --file <library key>
```

Each script's header comment gives its full usage. The [modules](REFERENCE.md#modules) section of the reference says what every flag does.

## What it reads and writes

It reads a project's stored specs and, for the code commands, the project's rendered code. It writes `contract.json` beside each spec. The code commands write stylesheets and markup into the project's repo. These are generated files that nobody edits. A project can also make its own contract files official instead of Figma's reading.

## What is in the folder

| File | Job |
|---|---|
| `derive.cjs` | reads a spec into a contract and checks it rebuilds |
| `layers.mjs` | draws one combination from the contract's layers |
| `write.cjs` | writes every contract in a folder |
| `rules.mjs` | the translation table between Figma, the contract and CSS |
| `css.mjs` | turns a contract part into CSS declarations |
| `to-code.mjs` | writes each component's stylesheet |
| `to-markup.mjs` | writes each component's markup, mapping and stories |
| `site.mjs` | renders a library with no project code |
| `from-code.mjs` | reads a contract back from code |
| `read-cache.mjs` | keeps the self reading's page answers, so a reinterpretation skips Chrome (`TOOLKIT_READ_CACHE=off` bypasses it) |
| `to-figma.mjs` | draws a contract in Figma as a component set |
| `looks.mjs` | compares the drawn set with the library by pixels |
| `geometry.mjs` | holds the drawn set's reading to the library's, layer by layer |
| `eval.mjs` | runs the whole round trip and scores it |
| `official.mjs` | decides which contract is the official one |
| `contract-rows.mjs` | a component's properties table, from its contract |
| `analyze.mjs` | finds where a library disagrees with itself |
| `capabilities.json` | what Figma and CSS can each say |
| `figma-facts.json` | the facts about Figma the translation rests on |

Each module's full job is in its header comment and in the [modules](REFERENCE.md#modules) section.

## How it fits

- [REFERENCE.md](REFERENCE.md) holds the detail: every module, [the contract's shape](REFERENCE.md#the-shape-contract-1) and how it is checked.
- [snapshot](../snapshot/README.md) stores the specs this folder reads.
- [parity](../parity/README.md) holds code to the spec, which stays the source of truth.
- [contract-editor](../contract-editor/README.md) writes a contract before anyone draws the component.
- "Contract" here means the component's. The routing contract in `tools/snapshot/projects.cjs` is a different thing.

## Test

```sh
node tools/component-contract/test-contract.mjs
```

That test covers derive, expand and the self-check on a fixture built to hit each case. Each module has its own `test-<module>.mjs`, and `bin/check` runs every one. Tests that need Chrome skip without it.
