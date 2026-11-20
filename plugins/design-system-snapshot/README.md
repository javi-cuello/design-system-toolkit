# Design system snapshot

A Figma plugin that reads a library or a screens file and sends everything code needs from it to the toolkit's snapshot router. That means tokens, styles, components, icons and screens. The router stores the snapshot in the project the file belongs to, and every other tool works from that stored copy. Run it after a library publish or a named version.

## Status

Its version is in `package.json` and its history in `CHANGELOG.md`. It is a development plugin, imported from this folder.

## What it needs

- The Figma desktop app.
- The toolkit's [snapshot router](../../tools/snapshot/README.md), listening on `localhost:9317`. Without it, the plugin saves one file instead.

## Try it

1. In the Figma desktop app, choose **Plugins → Development → Import plugin from manifest…** and pick this folder's `manifest.json`.
2. Open a library or a screens file.
3. Choose **Plugins → Development → Design system snapshot**, then **Take snapshot**.

The first time, the plugin asks for this machine's pairing code. Print it in the toolkit and paste it into the plugin's window:

```sh
node tools/snapshot/pairing.cjs
```

A changed manifest needs a fresh import. "Run last plugin" will not pick it up.

## What it reads and writes

From a library it reads variables, styles, every component's variants as measured trees, and the icons. From a screens file it reads each top-level frame or section marked Ready for dev or Completed, with a picture of it. [What it reads](REFERENCE.md#what-it-reads) has the full list.

It sends the result to the router. With no router running, the button reads **Download snapshot** and saves one JSON file.

## Without the toolkit

The saved file works on its own. The unpacker turns it into the per-component files the router would write. The token build turns it into DTCG token files, the format Style Dictionary reads.

```sh
node tools/snapshot/unpack.mjs "<file>.json" snapshot/
node tools/snapshot/unpack.mjs --zip <out.zip>               # package the unpacker to run on its own
node tools/tokens/from-snapshot.mjs "<file>.json" tokens/
```

[Use it without the toolkit](REFERENCE.md#use-it-without-the-toolkit) says what the file holds.

## Data this plugin stores

- In the file: the Tools-panel button, and a file id written once.
- On your machine: the pairing code, asked for once.
- Network: requests to the router on `localhost:9317` only.

The exact keys and requests are under [Data this plugin stores](REFERENCE.md#data-this-plugin-stores) in the reference.

## How it fits

- [REFERENCE.md](REFERENCE.md) holds the detail: the router's payloads, the first run, known limits and what the plugin expects of a library.
- The [snapshot router](../../tools/snapshot/README.md) receives and stores what this plugin sends.
- [snapshot-standard](../../standards/snapshot-standard.md) holds the rules for a snapshot and for adding a project.
- The [plugins index](../README.md) lists the toolkit's other plugins.

## Test

```sh
node plugins/design-system-snapshot/tests/test-walk.mjs
```

It runs the walk against a fake Figma. `bin/check` runs it.
