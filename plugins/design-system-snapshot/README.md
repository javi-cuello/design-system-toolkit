# Design system snapshot

Reads a Figma library or screens file and sends everything code needs from it (tokens, styles, components, icons, screens) to the toolkit's snapshot router, which stores it in the project it belongs to. Every other tool works from that stored snapshot.

**Install:** in the Figma desktop app, **Plugins → Development → Import plugin from manifest…** → this folder's `manifest.json`. **Run:** open the file, then **Plugins → Development → Design system snapshot** → **Take snapshot**. With no router running it offers **Download snapshot** instead and saves one JSON file.

## What it reads

One click after a library publish or a named version: reads everything a codebase takes from a design file and posts it to the consuming repo's local server. From a **library**: variables with their aliases, text, colour and effect styles (a colour style's gradient stops by variable name, its angle from the handles and its transform — a node's own gradient fill records the transform too), every component's variants as measured node trees — plus, for each boolean property, every variant with that property flipped, named `<variant>, <Prop>=<value>` (a node filled with a colour style carries `fillStyle`, a bound number the variable's name under `bindings`, an instance-swap prop the swapped component's name), and the icon SVGs per size, and the file's page list in order (category headers and dividers included, so a reader can group components the way the file does). From a **screens** file: every top-level frame **marked Ready for dev or Completed** as the same tree — an unmarked frame is a draft and sends its name alone, so the receiver can report what it skipped. Only frames **directly under a page** are collected: Figma allows the ready-for-dev status nowhere else, so a screen moved inside a section stops being a screen and the section becomes one. The plugin decides which of the two it is in by whether the file has variable collections, or component sets and no frame marked Ready for dev.

It replaces running the same collector through a bridge plugin, which capped a call at 30 seconds, advanced the work only while a call was live, and wedged on icon exports in long sessions.

## Use it without the toolkit
Import it as above (from a copy of this folder, if you have only the plugin). Open a library or a screens file and run **Design system snapshot**. With no receiver listening on `localhost:9317`, the button reads **Download snapshot** and saves one JSON file: `{ kind, tokens, components, icons, … }` for a library, `{ kind, _meta, screens }` for a screens file. `payload.cjs` in the toolkit's `tools/snapshot` is its schema.

For the per-component files and contracts the router writes, run the toolkit's unpacker on it: `node tools/snapshot/unpack.mjs "<file>.json" snapshot/` (`unpack.mjs --zip <out.zip>` packages it to run on its own).

For DTCG token files (the W3C design-tokens format Style Dictionary reads), pass that file to the token export (the `figma-token-export` skill runs it): `node tools/tokens/from-snapshot.mjs "<file>.json" tokens/`.

## Run
Figma → Plugins → Development → Import plugin from manifest → select this folder's `manifest.json`. A changed manifest needs a re-import; "run last plugin" will not pick it up.

The router (`tools/snapshot`, a login agent; its README says how to install it) listens on `http://localhost:9317` and hands each payload to the project that owns the file (see `standards/snapshot-standard.md`). The first time the plugin reaches it, the window asks for this machine's **pairing code**: run `node tools/snapshot/pairing.cjs` in the toolkit and paste what it prints. The plugin keeps it, and the router refuses any snapshot without it, since a web page can reach localhost too. The payloads are `POST /library { tokens, components, icons, iconSets, graphics, previews }` and `POST /screens { _meta, screens }`; `tools/snapshot/payload.cjs` is their schema. Each component carries its `description` (Figma's markdown), and `previews` holds a 2x PNG of each component's default variant, plus `dark`, the same in the library's dark mode, when it has one.

"Export images" (icons, graphics and component previews) can be switched off for a run that only moved tokens or components; the icon set names are sent either way, so coverage stays exact and the receiver keeps the files it has.

## First run
The first run in a file writes the Tools-panel button (relaunch data), which Figma counts as an edit after the release; a receiver that notes snapshots taken after unreleased edits will note that first one. The manifest's `id` is what keeps the button across re-imports: without one, a development plugin gets a fresh id each import and the button points at nothing.

## Known limit
The manifest sets `enablePrivatePluginApi`, so a development run carries `_meta.fileKey` too, and the router addresses a payload by it. The plugin also stamps `_meta.fileId` into the document once. A duplicated file carries that id too, but its key is its own, so it is never written as the original. A project's context document states both ids (snapshot-standard rule 2).

## Expects of the library
**Any variable collections, named anything.** The payload's `collections` key carries every collection under its own Figma name, with each of its modes, values and aliases — that is what a new repo reads, and no library has to be renamed or grow a collection to satisfy this plugin. A file with no variable collections is still a library when it holds component sets and marks no frame Ready for dev: a system may keep its components in a file of their own, and its tokens are then simply empty.

Every collection ships under its own name, with its own modes, and the payload assumes nothing about what any of them is called. Five named lookups (`global`, `semantic`, `layout`, `breakpoints`, `type`) shipped alongside until 0.32.0, for two repo receivers that no longer exist; they compiled five collection names and four mode names into a plugin that serves every project, and nothing read them.

Also expects an icon page named `Icon` or `Icons` whose component sets carry a `Size=N` axis.

## Data this plugin stores
One relaunch-data entry on the document root, `snapshot`, which is what puts the **Take design snapshot** button in the file's right-panel Tools section after the first run; remove it with the button's own "—". One root pluginData key, `snapshotFileId`, written once so the file can say which file it is. One clientStorage key, `pairingCode`: this machine's router pairing code, asked for once. One GET on open and one POST per run to `http://localhost:9317`, each carrying the code as `?code=` (declared under `devAllowedDomains`), or, with nothing listening there, a file saved to the user's machine; no other network access. Run through the Figma MCP instead (tools/snapshot/mcp.mjs), the payload is left as `toolkit.snapshot` shared plugin data on the temporary page, which `mcp.mjs cleanup` removes.
