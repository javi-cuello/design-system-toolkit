# Component Graph

A Figma plugin that shows how the components in a file depend on each other. Pick a component and it shows what that component is built from and what uses it, one level deep each way. A sidebar lists every component the file knows about, so you can browse with nothing selected. Use it to see what a change will touch, or to find components nothing uses.

## Status

Its version is in `package.json` and its history in `CHANGELOG.md`. Notes for v1 to v3.5 are in [REFERENCE.md](REFERENCE.md#release-notes-before-the-changelog). Figma has issued it a plugin id, and the steps to publish it are in [the reference](REFERENCE.md#publishing-to-figma-community).

## What it needs

The Figma desktop app. There is no build step, and the plugin makes no network requests.

## Try it

In the Figma desktop app, choose **Plugins → Development → Import plugin from manifest…** and pick this folder's `manifest.json`. Then select a component on the canvas, or click one in the sidebar.

Everything works from the keyboard. Tab reaches the sidebar's rows, group heads and the graph's nodes. Arrow keys move through the list, and Enter or Space opens what is focused.

## What it reads and writes

It reads every page of the open file once and builds an index of components and their instances. It changes the file only when you ask, except one Tools-panel entry it writes on its first run. **Add to canvas** inserts the graph as an editable frame.

## Data this plugin stores

- On your machine: the library names it has learned, and a cached sidebar list for the five most recent files. It keeps names, ids, keys and counts only.
- In the file: one entry that puts the plugin in the Tools panel, written once. It also keeps whatever **Add to canvas** inserts.
- Nothing is sent anywhere.

The full detail is under [Data this plugin stores](REFERENCE.md#data-this-plugin-stores) in the reference.

## Limits

It sees this file only. "Unused" means unused in this file, so another file may still use a published component. The [known limitations](REFERENCE.md#known-limitations) list the rest.

## How it fits

- [REFERENCE.md](REFERENCE.md) holds the detail: publishing to Figma Community, how `code.js` is organised, limits, roadmap ideas and old release notes.
- The [plugins index](../README.md) lists the toolkit's other plugins.
- The [snapshot tools](../../tools/snapshot/README.md) build the same kind of graph from a stored snapshot, with no Figma open.

## Test

```sh
node plugins/component-graph/tests/test-graph.js           # the main thread, against a fake Figma
node plugins/component-graph/tests/test-ui-keyboard.mjs     # the window from the keyboard, in Chrome
```

`bin/check` runs both.
