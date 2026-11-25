# Snapshot router

A local service that receives a design snapshot from the Figma plugin and stores it in the project that owns that Figma file. Every tool then reads the snapshot through one store. `projects.cjs` beside it is how every tool finds a project and its files. Without the router, whichever repo happened to be listening on the plugin's one port wrote every snapshot. [Why it exists](REFERENCE.md#why-it-exists) tells that story.

## Status

Working, and run as a macOS login agent. The repo's `install.sh` sets that up, so the router starts with the Mac and restarts if it stops. After a change to `router.mjs` or anything it imports, it restarts itself between snapshots.

## What it needs

- Node and the toolkit checkout.
- The [Design system snapshot](../../plugins/design-system-snapshot/README.md) plugin in Figma.
- A project whose context document claims the Figma file. [How it decides](REFERENCE.md#how-it-decides) shows the block it reads.

## Run it

```sh
node tools/snapshot/router.mjs                      # listens on port 9317 [--projects <dir>] [--port <n>]
node tools/snapshot/pairing.cjs                     # print this machine's pairing code for the plugin
launchctl kickstart -k gui/$(id -u)/com.toolkit   # restart the login agent (the audit service too)
```

Then, in any project's Figma file, choose **Plugins › Development › Design system snapshot › Take design snapshot**. The first time, paste the pairing code into the plugin's window. The router refuses any snapshot without that code, because any web page can reach `localhost`.

Other ways in, each explained in [REFERENCE.md](REFERENCE.md):

```sh
node tools/snapshot/unpack.mjs <file>.json <out-dir>          # a file the plugin saved with no router running
node tools/snapshot/unpack.mjs --zip <out.zip>                # package the unpacker to run on its own
node tools/snapshot/mcp.mjs script                            # snapshot through the Figma MCP, with no Figma app open
node tools/snapshot/mcp.mjs parts [<plan.json>]               # a large library: the plan, then the calls it sizes
node tools/snapshot/mcp.mjs collect <project> <holder id>… [--file <key>] [--repo <dir>] [--save <file>]
node tools/snapshot/mcp.mjs cleanup
node tools/snapshot/deliver.cjs <project> library <payload.json>   # re-run a failed write from its kept payload
node tools/snapshot/deliver.cjs <project> --pin                    # re-read the release stamps
node tools/snapshot/deliver.cjs <project> --pinned                 # is what is stored at the release?
node tools/snapshot/backfill-changes.cjs <label> [--out <file>] [--write] [--grades-only [--regrade]] [--projects <dir>]
node tools/snapshot/graph.cjs --project <label>               # the component dependency graph
node tools/snapshot/check-specs.cjs <components dir>          # every stored spec is compact and round-trips
node tools/snapshot/recipes.cjs --repo <project repo>         # what a project's screens repeat
node tools/snapshot/projects.cjs homes
```

## What it reads and writes

It reads each project's context document to learn which Figma files the project owns. It routes by the file's key, or the id it stamped, never by a name. It writes tokens, component specs, icons, previews, screens, a changes log and an index, at the paths the project's `snapshot.config.json` gives. Then it runs the steps that file lists under `after`.

A file no project claims is refused. When a write fails, the router keeps the payload and prints the command to re-run it.

## What is in the folder

| File | Job |
|---|---|
| `router.mjs` | the service the plugin posts to |
| `projects.cjs` | identity, discovery, routing and layout |
| `pairing.cjs` | the machine's pairing code |
| `payload.cjs` | the schema for both payloads |
| `store.cjs` | the stored layout and its one reader |
| `owns.cjs` | what a file owns, live or stored |
| `deliver.cjs` | writes a payload through the store |
| `spec.cjs` | compacts and resolves component specs |
| `unpack.mjs` | unpacks a saved snapshot file |
| `mcp.mjs` | the snapshot through the Figma MCP |
| `version.cjs` | a file's last release, for pinning |
| `guidance.cjs` | reads a description as guidance |
| `tokens.cjs` | a token's value by name and mode |
| `graph.cjs` | the component dependency graph |
| `check-specs.cjs` | checks every stored spec |
| `backfill-changes.cjs` | rebuilds the changes log from git |
| `at-rev.cjs` | a stored library at a git revision |
| `recipes.cjs` | what a project's screens repeat |

[The other files](REFERENCE.md#the-other-files) and each file's header comment say more.

## How it fits

- [REFERENCE.md](REFERENCE.md) holds the detail: pairing, the MCP route, the login agent, routing, what lands where, failed writes, options and [screen recipes](REFERENCE.md#screen-recipes).
- [snapshot-standard](../../standards/snapshot-standard.md) holds the rules and the checklist for adding a project.
- The [Design system snapshot](../../plugins/design-system-snapshot/README.md) plugin sends what the router stores.

## Test

```sh
for t in tools/snapshot/test-*.mjs tools/snapshot/test-*.cjs; do node "$t" || exit 1; done
```

`test-router.mjs` walks discovery, each route, an unknown key, a missing key and a duplicate claim. It also runs a real server handing two payloads to two repos. `test-check-specs.cjs` plants each defect in a folder the store writes.
