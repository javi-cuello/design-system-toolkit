# Contract editor

A contract is the list of a component's props and parts. This page lets designers and engineers write one before anyone draws or builds the component. They build it from blocks and leave with it as JSON. The [component-contract](../component-contract/README.md) tool derives the same contract from a finished drawing. The editor works the other way round, intent first, and also opens a library's stored contracts and writes them back with nothing lost.

## Who owns what

For a component Figma has drawn, the record is Figma's. Each snapshot derives its contract again, so a library component opens read-only. To change it, choose **Edit as draft**. You can then propose the change for review, push it to Figma as a new component, or update the library component in place. See [Who owns what](REFERENCE.md#who-owns-what).

## What it needs

- Node 22.12 or later.
- The Figma desktop app and a Figma library file.
- The snapshot plugin, imported from `plugins/design-system-snapshot/manifest.json`.

None of the toolkit's projects is needed.

## Quick start

1. Clone the toolkit. In Figma, choose **Plugins › Development › Import plugin from manifest…** and pick the snapshot plugin's manifest.
2. Start the editor and open http://localhost:9250/.
3. Run **Design system snapshot** in your library. When no project claims the library, the plugin shows a code.
4. In the editor's **Settings**, name the project, paste the library's address and type the code.

```sh
node tools/contract-editor/serve.mjs                       # no project yet; Settings makes one
node tools/contract-editor/serve.mjs --project <label>     # one registered project's library
node tools/contract-editor/serve.mjs --snapshot <dir>      # any snapshot folder, no project needed
```

Use `--port` to serve a second project. Use `--no-router` to skip starting the snapshot router. The full steps, including a sparse clone, are in [Quick start, in full](REFERENCE.md#quick-start-in-full).

## What it can do

Each capability needs something to read. A menu item that is off says what is missing.

| Capability | Needs |
|---|---|
| Edit a contract, keep drafts, propose | nothing |
| Keep settings for everyone | a project |
| Open the library's components | a snapshot |
| Push a new component to Figma | a project and a scratch file |
| Update a library component in place | its library open with the Desktop Bridge |
| Push a stylesheet to code | a code repo set in Settings |
| Pull from code | a parity mapping |

The tabs are Props, Anatomy, Variants, Preview and JSON. Each is described in the [reference](REFERENCE.md#props).

## What it reads and writes

It reads the project's settings, its stored contracts, its tokens and its icons. It writes nothing of its own, except a library's official contracts where it is their source. Otherwise the contract leaves as a download. The **Figma** and **Code** menus run the toolkit tool that owns each side. See [Reads and writes](REFERENCE.md#reads-and-writes).

## What is in the folder

| File | Job |
|---|---|
| `serve.mjs` | serves the page and runs each sync |
| `anatomy.mjs` | parts, token lists and the preview |
| `variants.mjs` | what each combination of values draws |
| `props.mjs` | the blocks and the contract they write |
| `icons.mjs` | block and part icons |
| `editor.js` | the page's script |
| `sample/` | a made-up library for the tests |

The page itself is `index.html` and `editor.css`. Each file's full job is under [Files](REFERENCE.md#files).

## How it fits

- [REFERENCE.md](REFERENCE.md) holds every menu, tab and panel, and the fields the editor adds to a contract.
- [component-contract](../component-contract/README.md) derives contracts from Figma.
- The page uses the toolkit's [stock-ui](../../stock-ui/README.md) stylesheet.

## Test

```sh
node tools/contract-editor/test-props.mjs
node tools/contract-editor/test-anatomy.mjs
node tools/contract-editor/test-variants.mjs
node tools/contract-editor/test-serve.mjs
node tools/contract-editor/test-editor.mjs --fixtures
```

The last one drives the page in headless Chrome. Without Chrome it prints `skip:` and exits 77. See [Tests](REFERENCE.md#tests).
