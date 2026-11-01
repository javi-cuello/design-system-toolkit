# Snapshot router

    node router.mjs

Then in Figma, in any project's file: **Plugins › Development › Design system
snapshot › Take design snapshot**. The payload goes to the project that owns
that Figma file.

### Pairing

The first time the plugin reaches the router it asks for this machine's
pairing code. Print it and paste it into the plugin's window:

    node pairing.cjs

The code is made once, in `~/.toolkit/pairing-code` (only you can read it;
`TOOLKIT_PAIRING` moves it, for a test), and the plugin keeps it in its own
clientStorage. The router refuses every snapshot and every `?file=` question
that does not carry it (`?code=`), before routing and before anything is kept:
`localhost` is reachable from any web page, and a sandboxed frame on a page
sends the same `Origin: null` as the plugin, so the code is what a page cannot
have. Delete the file to make a new one (the next request makes it; nothing
needs restarting); each plugin then asks again.

A library no project claims is refused, and its snapshot is kept for a day
under a one-time code the plugin shows, the five newest, in
`~/.toolkit/snapshot-unclaimed`, a folder no other user may read
(`projects.keepUnclaimed`; `TOOLKIT_UNCLAIMED` moves it); the rules are
snapshot-standard's, *Adding a project*. The contract editor,
started on no project, makes a project of it from a name, the library's address
and that code, and delivers it. The login agent runs the router it started
with: restart it after an update. The editor started that way also starts this
router, where nothing holds the port.

### Without the router

The plugin saves one file when nothing is listening (0.59.0). `node unpack.mjs
<file>.json <out-dir>` writes it through the same store, so `<out-dir>` holds
what a project's `snapshot/` holds: `tokens.json`, `index.json`, and per
component `figma.json` and `contract.json`, previews and icons. To hand it to
someone without the toolkit, `node unpack.mjs --zip <out.zip>` packages this
command and only the files it runs.

### Without the Figma app: the MCP

An agent with the official Figma MCP can take a library snapshot with no Figma
app open (snapshot-standard rule 26):

    node mcp.mjs script            # the code to pass to use_figma as it is, on the library
    node mcp.mjs collect <project> <holder id>   # the id that run returned; delivers through deliver.cjs
    node mcp.mjs cleanup           # the code that removes the temporary page; pass it to use_figma

`script` is the plugin's own code.js, its whole-line comments dropped to fit
use_figma's 50,000 characters. The run leaves the payload as shared plugin data
on the plugin's temporary page, which `collect` reads back over the REST API
with the machine's Figma token. A token is looked for in this order (`version.cjs`
`tokenFor`, the one reader): `FIGMA_TOKEN` in the environment; for release
pinning in a repo, the `figmaToken` command its `snapshot.config.json` names
(`collect` does not run it); then `~/.config/figma/token` (`FIGMA_TOKEN_FILE`
names another file; `bin/set-key figma` writes it). A project routing several library files is
told which one the run was in with `--file <key>`; `--repo <dir>` delivers into a copy of the
repo instead, and `--save <file>` keeps the payload. A run can outlast the
tool's answer: when the call reports it lost, look for the temporary page
before running it again. Libraries only; screens are not served.
`test-mcp.mjs` holds the script to the cap and the read-back to its chunks.

### As a login agent

Started from a terminal it dies with the terminal, and after a restart every
snapshot fails until someone remembers it. `install.sh` at the repo root
installs it as a login agent (this folder's `com.toolkit.figma-snapshot.plist`,
with this checkout's paths): it starts with the Mac and restarts if it stops.
It runs node through a `figma-snapshot` link beside this file, made by
`install.sh`, so Login Items names it rather than "node". Output goes to
`~/Library/Logs/toolkit/figma-snapshot.log`, and errors to `figma-snapshot.err`
beside it, a folder only you can read.
After changing `router.mjs`, restart it:
`launchctl kickstart -k gui/$(id -u)/com.toolkit.figma-snapshot`.

## Why it exists

The snapshot plugin posts to a **fixed** port on localhost — 9317, pinned by
its manifest's `devAllowedDomains`, which is a Figma constraint and not a
choice. One port means one listener, so a second project's receiver could not
even bind while the first was running.

That made working on two projects a matter of remembering to stop one receiver
before snapshotting the other, and forgetting was not a small mistake: nothing
in the transport says who a payload is for, so whichever repo happened to be
listening **wrote it**. Another library's tokens over yours, or another
project's frames over every frame yours measures against — after which the
parity run reports it as a hundred regressions in code nobody touched.

## How it decides

By the file's **id, and nothing else**. Never a name: not the file's, not its
collections', not its pages'. Names inside a file belong to whoever is working
in it and two projects can share them (two libraries both called "UI library" is
ordinary), so anything leaning on one would be guessing.

A file has two names and the block states both. `key` is Figma's own
`fileKey`, which is the one name its REST API accepts; the plugin (v0.67.0+)
asks for it and sends it. `id` is what the plugin
(v0.17.0+) stamps into the document once. A run that sends the key is routed
by the key alone (a copy carries its original's id), so an entry that states
only an id needs its `key` added; a run before v0.67.0 is routed by the id.
Only `key` can be handed to Figma. A duplicated file carries its original's id but
has a key of its own, so it is never written as the original.

It scales to any number of projects because there is no list to grow: the
projects directory is the registry, read fresh on every request.

It holds no list of its own. **The projects directory is the registry** — a
project with a context doc is a project — and each project's
`design-system-context.md` states which files it owns, in §5:

    ```json snapshot-routing
    { "repo": "~/Projects/<label>",
      "files": { "library": { "key": "<Figma fileKey>", "id": "<stamped id>" },
                 "screens": { "key": "…", "id": "…" } } }
    ```

That block is the only copy of that fact, and the router is the only thing that
reads it to decide where a payload lands. Adding a project is adding its doc; everything is re-read on every request, because a router you have to
remember to restart is one that quietly serves a stale map.

A project whose doc has no block **claims nothing** and is skipped rather than
treated as a catch-all — a project part-way through setup must never become the
place every unrecognised snapshot lands.

## What a payload contains, and where it lands

`payload.cjs` is the schema for both payloads; a payload that does not match
is refused with a 400 naming the field, before anything is routed.
`spec.cjs` is the one compact/resolve for component specs, and every repo
re-exports it. `store.cjs` owns the canonical layout (`tokens.json`,
`components/<slug>/figma.json`, `icons/`, `graphics/`, `previews/`,
`screens/`, `changes.json`), which a repo overrides key by key in its
`snapshot.config.json` `paths`, and is the one reader of what it writes: a
component spec through `readSpec(dir, folder)` / `readSpecs(dir)` (resolved,
or as stored with `{ compact: true }`; a file that does not parse throws,
naming it), a screen through `readScreen` / `readScreens`. Every reader finds a project with
`contract.layout(projectsDir, label)` and nothing else, and reads the
project's name and phase from the `project` block in its context document.

A project whose routing block has **no repo** is design-only: the router
writes its snapshot itself, into `<project home>/snapshot/`. Such a project
may list several library files; each write merges into what the others
contributed. A file that moves to a new key (duplicated, its stamped id
carried along) leaves records under the old one: once every routed file has
reported under its current identity, what only a key nobody routes owned —
index entries, specs, icon lists, a token source and anything only it held —
is removed. Each write records what moved in `changes.json` — which fields of each
changed component, and a rename as one event paired by the set's node id —
which the docs site renders whole at `/changes` (the overview shows the last few) and, per
component, as the Change log section of its docs page: every fact with its
value before and after, graded per audience (snapshot-standard rule 20).
Claude-written day summaries were generated here until 1 Oct 2026 and
removed: they restated the facts beside them.
`backfill-changes.cjs <label> [--write] [--grades-only [--regrade]]` rebuilds the facts from the
snapshot's git history with the same differ, one entry per commit pair and
file; `at-rev.cjs` is the reader it uses, and it reads the repository the
project's layout names — a code project's own, at the paths its
`snapshot.config.json` gives, as readily as the toolkit's folder for a
project with none. Where the routing names one library, a spec from a
revision before the index recorded a file is that library's; where it names
several the pair is logged under "all files" and says so. `--grades-only`
grades the entries already in the log and changes nothing else in it: an
ungraded one, and one graded against a worktree a commit has since replaced;
with `--regrade`, every graded live entry too, and every entry's lists and
notes from the same replay, so a fix to the grader reaches the history
(snapshot-standard rule 22 says how a live entry's window is read). A file's
former keys, read from the index history, fold onto its present one.

`guidance.cjs` reads a component's description as guidance (purpose, Usage,
Don't, and the rest of the descriptions skill's structure), and
`contract.status()` reads a component's status from its page marker through
the project's legend.

    node --test test-payload.mjs test-spec.cjs test-router.mjs test-guidance.cjs test-changes.cjs
    node test-graph.cjs
    node test-check-specs.cjs    # check-specs on a folder the store writes, each defect planted, and an empty folder failed

## What it writes, and what a project writes

It writes every project itself, through the one store (`store.cjs`, called by
`deliver.cjs`): tokens, component specs, icons, previews, screens, the changes
log and the index, at the paths that project's `snapshot.config.json` gives.
Then it runs what that file lists under `after` — `bin/tokens`, a coverage
check, a validator — which is the only part a project owns, because it is the
only part that is about that project rather than about the format.

Two repos used to write their own, and the toolkit a third for projects with
no repo: one format, three shapes, and fixes in each that the others lacked.

A key nobody claims is refused with the known keys listed, and two projects
claiming one key is refused naming both rather than guessing.

## When a write fails

The router keeps the payload it routed — the newest three per project and kind,
in the system temp directory, because they are megabytes of machine output and
a repo is for things a person wrote. A write that fails partway is the one
moment you want the exact bytes that caused it, without reopening Figma and
without the design having moved underneath.

The path is printed **only** when a snapshot fails, with the command to re-run
it (`deliver.cjs <project> <kind> <payload>`). `deliver.cjs <project> --pin`
re-reads the release stamps without collecting again, and `--pinned` asks
whether what is stored is at the release, as a check's gate. Each routed file is pinned to its own release (beside its entry in
`_meta.sources`) and checked against it, and `--pinned`, while a file is at its release, notes a version Figma saved after the file's last delivery on this machine (each delivery is timed in `~/.toolkit/snapshot-runs.json`, outside every repo; `TOOLKIT_SNAPSHOT_RUNS` names another file): edits in it may not be in the snapshot. "May": Figma saves a version some time after the edits it holds, and a kept payload replayed later is timed at the replay. A Figma read gives up after 30 s, and a named version is looked for over up to twenty pages of versions. On a good run it is noise, and noise is what buries the one line
that matters.

## Options

| Flag | Default |
|---|---|
| `--projects <dir>` | none: every `<label>/figma-design-system/` in the folder that holds the toolkit, or in `TOOLKIT_PROJECTS_ROOT` (a folder of `<label>/` homes, for tests) |
| `--port <n>` | `9317`, the port the plugin posts to |

`node test-router.mjs` walks it: discovery, each route, an unknown key, a
missing key, a duplicate claim, and a real server handing two payloads to two
repos.

## The contract

`projects.cjs` is the one implementation of all of this — identity, discovery,
routing, layout and what an exit code means. The router imports it, the store
imports it, and so does every repo script that needs to know where something
lives — because these things have to agree and they each used to have their
own answer. The
rules it encodes, and the checklist for adding a project, are
[`standards/snapshot-standard.md`](../../standards/snapshot-standard.md).
