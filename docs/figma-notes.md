# Working through Figma's bridges

What Figma and the toolkit's bridges do that no tool's own docs say. Each item was hit in a real run. A project's own facts (its files, conventions and rulings) are in its context document, `~/Projects/<label>/figma-design-system/design-system-context.md`; read that first.

## The two bridges

- **figma-console MCP**: `figma_execute`, 5 s by default, `timeout` up to 300 s. If it failed to connect when the session started, it stays down until `/mcp` reconnects it. It can show "No files connected" while a project's dashboard still has them: check the dashboard's `/status` before calling the bridge down.
- **A project's dashboard**: `POST http://127.0.0.1:<port>/exec` with the header `origin: http://127.0.0.1:<port>` (without it the answer is `cross_origin`) and the body `{ code, fileKey, timeout }`. The value comes back at `result.result`. `GET /status` lists the connected files. Each project's port is in its service settings.
- **Batch discovery.** Each `figma_execute` is a round trip through the Desktop Bridge, so eight small probes are far slower than one script that returns everything. Fetch component keys, variant definitions, variable keys and text style keys in one call, then build in one more. Check up front which library collections are enabled in the target file; a sibling file is often different.

## Five ways a call fails

1. **Dropped connection** (another plugin, a file switch): run `figma_get_status({ probe: true })` first. A dropped call says nothing about the file.
2. **A payload bug**: only that payload fails; the probe answers.
3. **The library API stalls in one file**: the probe answers, but imports and `loadFontAsync` hang. The fix is reopening the plugin in that file, which only the person at the machine can do.
4. **A port clash between sessions**: each session's bridge takes a port in 9223–9232, and the plugin connects over `::1`. Set `FIGMA_WS_HOST: "::1"` in `~/.claude.json`; it takes effect on `/mcp` reconnect. Stop another session's bridge only with its owner's go. The same clash hits a dashboard: a console MCP holds `[::1]` on the first free port while the services listen on IPv4, so a dashboard on a held port shows `plugin:false`. `services.mjs` dials 127.0.0.1; give the project a port no MCP holds (`lsof -nP -iTCP -sTCP:LISTEN`).
5. **A plugin degraded after hours**: nodes inside instances "do not exist" on every call. `figma_reload_plugin` does not fix it; restarting the plugin does. Ask for that early: waiting cost an hour.

## Traps

- A timed-out write has often landed already: read the state back before running it again.
- The active file drifts, and `figma_navigate({ lock: true })` does not hold it. Every write checks the file key or `figma.currentPage.name` and refuses otherwise. Ask which file is safe before building a scratch fixture, and leave it as found.
- A long run that crawls: bring Figma to the front. A Figma browser tab in the background runs timers about once a minute (one component took 17 minutes; Pitre, southleft.substack.com, 2026-11-12). Whether the desktop app throttles the same way is unchecked.
- `figma_list_open_files` shows only files with the Desktop Bridge running, so a missing file is usually closed.
- People edit the same files while a session works: re-read before each batch of writes.
- The cloud connector (`use_figma`) cannot write text in a font Figma's cloud lacks (SF Pro, Inter Display), so compose through the bridge. Its `get_screenshot` lags bridge edits by minutes: check with `figma_capture_screenshot` or by reading nodes back.
- Large tool results land in `tool-results/*.txt` and cost about 300 tokens to receive, so grepping a saved 5 MB snapshot is cheaper than a 25 KB result read into context.

## Overrides

Text overrides in nested instances against slots are figma-standard rule 38; a clone losing its `componentPropertyReferences` is in figma-components-audit's `references/scanner-checks.md`. Measured 2026-10-08, and held nowhere else:

- A layer-name override on a nested instance resets when the parent switches variant: name layers inside the component.
- A component property cannot be bound to a layer inside a nested instance.
- A component cannot change the variant of what sits in its slot.

## Descriptions

Setting `node.description`, even for a small string replace, wipes its markdown: `## Behavior` headings and `-` bullets render as flat lines. Figma derives the rich text from `descriptionMarkdown`, so every description edit reads and writes that field (figma-component-descriptions' `scripts/apply.js`). On 2026-10-12 a plain edit flattened eleven components' descriptions.

## Version history

- Version history (REST, `Versions: Read`) is reachable through figma-console's own token, and through scripts that read `~/.config/figma/token` with `version.cjs`'s `tokenFor` without printing it. `/v1/me` answers 403 to a working file token (missing scope) and 401 to a bad one, so test a token on a file's `/versions`.
- `figma_get_file_at_version` with no `depth` closes the connection and kills the server: every `figma-console` tool disappears until `/mcp` reconnects. A `depth: 6` call returned 5.3 MB and did the same. Cheap probes: `node_ids` with `depth: 1` returns a node's name at that version, or `null` before it existed, so a binary search over the versions finds when a node was made or renamed. `figma_diff_versions` returns added, removed and renamed pages for two API calls.
- The publish dialog's "Modified" is not the snapshot's doing (2026-10-23, again 2026-10-30): a `documentchange` listener over a full collect saw no event outside the temporary page, and components stayed CURRENT across a snapshot run. The flag is readable without the dialog: `node.getPublishStatusAsync()` returns CURRENT, CHANGED or UNPUBLISHED (hidden `_` components read UNPUBLISHED). What flips it later is not yet found.
- A Development plugin gets `figma.fileKey` when its manifest sets `enablePrivatePluginApi`. `setPluginData` from a bridge run lands in the bridge's namespace, not the snapshot plugin's.
