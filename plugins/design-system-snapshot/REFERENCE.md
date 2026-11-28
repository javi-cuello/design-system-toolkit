# Design system snapshot reference

The detail behind the plugin's [README](README.md): what it reads, how an audit runs it headless, using it without the toolkit, how it talks to the router, the first run, its known limits, what it expects of a library and the data it stores.

## What it reads

One click after a library publish or a named version: reads everything a codebase takes from a design file and posts it to the consuming repo's local server. From a **library**: variables with their aliases, text, colour and effect styles (a colour style's gradient stops by variable name, its angle from the handles and its transform — a node's own gradient fill records the transform too), every component's variants as measured node trees — plus, for each boolean property, every variant with that property flipped, named `<variant>, <Prop>=<value>` (a node filled with a colour style carries `fillStyle`, a bound number, or a visibility bound to a boolean variable (`bindings.visible`, 0.95.0 on), the variable's name under `bindings`, and a bound name another of the file's collections also holds its collection under `collections`, `{ name: collection }`, 0.96.0 on, an instance-swap prop the swapped component's name; a layer below the root, outside an instance, its place among all its parent's children, hidden ones counted, as `index`, 0.83.0 on; a set's variant its place in the set as `place`, and the set its size as `set`, 0.84.0 on; a vector a digest of its outline as `outline`, 0.85.0 on, and outside an instance its paths, up to 1000 characters, as `paths`, 0.86.0 on), and the icon SVGs per size, and the file's page list in order (category headers and dividers included, so a reader can group components the way the file does). From a **screens** file: every frame or section **directly under a page** that is **marked Ready for dev or Completed**, as the same tree plus a PNG of it scaled to 1200px on its longest side — an unmarked one is a draft and sends its name alone, so the receiver can report what it skipped. Nothing deeper is read: a screen moved inside a section stops being a screen, and the section, once marked, becomes one. The plugin decides which of the two it is in by whether the file has variable collections, or component sets and no frame marked Ready for dev.

It replaces running the same collector through a bridge plugin, which capped a call at 30 seconds, advanced the work only while a call was live, and wedged on icon exports in long sessions.

## Run headless by an audit

The same file runs with no UI as a function body, through the Desktop Bridge or inside another plugin, and returns instead of posting. The audit reads the live library this way, by this plugin's reader rather than a second one (toolkit-standard §D 5). The constants a caller prepends, and the header comment over `HEADLESS` in `code.js` details each:

| Constant | Returns | Read by |
|---|---|---|
| none, or `PAGES`, `SECTION`, `EXCLUDE`, `SCOPE` | the component specs a snapshot records | the validator stage, figma-properties-table |
| `FULL = true` | the whole library payload | a caller that posts it itself |
| `FACTS = true` | tokens, icon facts without SVGs, what components off the icon and scratch pages bind | the audit's tokens and icons stages |

Inside a plugin with a UI of its own, the caller first declares `const __html__ = undefined;`, so this file stays headless.

## Use it without the toolkit
Import it as the README says (from a copy of this folder, if you have only the plugin). Open a library or a screens file and run **Design system snapshot**. With no receiver listening on `localhost:9317`, the button reads **Download snapshot** and saves one JSON file: `{ kind, tokens, components, icons, … }` for a library, `{ kind, _meta, screens }` for a screens file. `payload.cjs` in the toolkit's `tools/snapshot` is its schema.

For the per-component files and contracts the router writes, run the toolkit's unpacker on it: `node tools/snapshot/unpack.mjs "<file>.json" snapshot/` (`unpack.mjs --zip <out.zip>` packages it to run on its own).

For DTCG token files (the W3C design-tokens format Style Dictionary reads), pass that file to the token build: `node tools/tokens/from-snapshot.mjs "<file>.json" tokens/`.

## The router
A changed manifest needs a re-import; "run last plugin" will not pick it up.

The router (`tools/snapshot`, a login agent; its README says how to install it) listens on `http://localhost:9317` and hands each payload to the project that owns the file (see `standards/snapshot-standard.md`). The first time the plugin reaches it, the window asks for this machine's **pairing code**: run `node tools/snapshot/pairing.cjs` in the toolkit and paste what it prints. The plugin keeps it, and the router refuses any snapshot without it, since a web page can reach localhost too. The payloads are `POST /library { tokens, components, icons, iconSets, graphics, previews }` and `POST /screens { _meta, screens }`; `tools/snapshot/payload.cjs` is their schema. Each component carries its `description` (Figma's markdown), and `previews` holds a 2x PNG of each component's default variant, plus `dark`, the same in the library's dark mode, when it has one.

The **Export icons** switch (icons, graphics and component previews; shown for a library only) can be turned off for a run that only moved tokens or components; the icon set names are sent either way, so coverage stays exact and the receiver keeps the files it has.

## First run
The first run in a file writes the Tools-panel button (relaunch data), which Figma counts as an edit after the release; a receiver that notes snapshots taken after unreleased edits will note that first one. The manifest's `id` is what keeps the button across re-imports: without one, a development plugin gets a fresh id each import and the button points at nothing.

## Known limit
A component set Figma holds in error ("Component set has existing errors") cannot have its properties read; the walk lists it under `unreadable` and goes on. The code, with whole-line comments dropped, must stay under use_figma's 50,000 characters for the MCP path (`tools/snapshot/mcp.mjs`, checked by its test); at 0.76.0 it is about 50 under, so a change that adds code must take some out.

The manifest sets `enablePrivatePluginApi`, so a development run carries `_meta.fileKey` too, and the router addresses a payload by it. The plugin also stamps `_meta.fileId` into the document once. A duplicated file carries that id too, but its key is its own, so it is never written as the original. A project's context document states both ids (snapshot-standard rule 2).

## Expects of the library
**Text styles from another library.** A component file whose type lives in a foundations file has no local text style; the walk sends, beside the local ones, each text style another library publishes that its components' text uses, marked `remote` (a local style of the same name is that one).

**Variables from another library.** The same for variables: a component file whose colours, spaces and radii live in a foundations file has none local, so the walk sends each collection of another library that its components bind, as this file reads it, marked `remote` (a local collection of the same name is that one). The store keeps such a collection, and a remote text style, where no file owns that name, never over the copy of the file that does.

**Any variable collections, named anything.** The payload's `collections` key carries every collection under its own Figma name, with each of its modes, values and aliases, and its default mode by name as `defaultMode` (0.88.0 on) — that is what a new repo reads, and no library has to be renamed or grow a collection to satisfy this plugin. A file with no variable collections is still a library when it holds component sets and marks no frame Ready for dev: a system may keep its components in a file of their own, and its tokens are then simply empty.

Every collection ships under its own name, with its own modes, and the payload assumes nothing about what any of them is called. Five named lookups (`global`, `semantic`, `layout`, `breakpoints`, `type`) shipped alongside until 0.32.0, for two repo receivers that no longer exist; they compiled five collection names and four mode names into a plugin that serves every project, and nothing read them.

Also expects an icon page named `Icon` or `Icons` whose component sets carry a `Size=N` axis. A page named `Scratch` (after any marker; alone or followed by a spaced dash, a colon or a bracket) is skipped: it holds trials, not the library.

## Data this plugin stores
One relaunch-data entry on the document root, `snapshot`, which is what puts the **Take design snapshot** button in the file's right-panel Tools section after the first run; remove it with the button's own "—". One root pluginData key, `snapshotFileId`, written once so the file can say which file it is. One clientStorage key, `pairingCode`: this machine's router pairing code, asked for once. All to `http://localhost:9317` (declared under `devAllowedDomains`): on open, and again after a pairing code is pasted, two GETs, one asking which kind the router records for this file (carrying the code as `?code=`) and a bare one asking whether anything listens; on each run the same two, then one POST carrying the code, or, with nothing listening, a file saved to the user's machine instead. No other network access. Run through the Figma MCP instead (tools/snapshot/mcp.mjs), the payload is left as `toolkit.snapshot` shared plugin data on a temporary page, removed by the code `node tools/snapshot/mcp.mjs cleanup` prints.
