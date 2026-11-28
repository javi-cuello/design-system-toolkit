# Snapshot router reference

The detail behind the snapshot router's [README](README.md): pairing, the routes without the router or without the Figma app, the login agent, why the router exists, how it decides, what a payload holds and where it lands, failed writes, options, the contract, the other files and screen recipes. The rules themselves are [snapshot-standard](../../standards/snapshot-standard.md).

## Pairing

The first time the plugin reaches the router it asks for this machine's
pairing code. Print it and paste it into the plugin's window:

    node tools/snapshot/pairing.cjs

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

## Without the router

The plugin saves one file when nothing is listening (0.59.0). `node unpack.mjs
<file>.json <out-dir>` writes it through the same store, so `<out-dir>` holds
what a project's `snapshot/` holds: `tokens.json`, `index.json`, and per
component `figma.json` and `contract.json`, previews and icons. To hand it to
someone without the toolkit, `node unpack.mjs --zip <out.zip>` packages this
command and only the files it runs.

## Without the Figma app: the MCP

An agent with the official Figma MCP can take a library snapshot with no Figma
app open (snapshot-standard rule 26):

    node tools/snapshot/mcp.mjs script            # the two calls of a whole run, as JSON: pass each to use_figma in turn
    node tools/snapshot/mcp.mjs parts             # a large library: the read-only plan code, then
    node tools/snapshot/mcp.mjs parts <plan.json> #   the calls to make, as JSON, given what the plan returned
    node tools/snapshot/mcp.mjs collect <project> <holder id>…  # the id(s) the run returned; delivers through deliver.cjs
    node tools/snapshot/mcp.mjs cleanup           # the code that removes the temporary page; pass it to use_figma

`script` is the plugin's own code.js, its whole-line comments dropped, in two
calls: the tokens call, then the components call (icons, graphics and previews
included) on the tokens it read. One call held it all in 49,507 of use_figma's
50,000 characters (2026-11-28), so the next change would not have fitted. Each
call leaves its payload as shared plugin data
on the plugin's temporary page, which `collect` reads back over the REST API
with the machine's Figma token; collect both holders, the tokens one first or not. A token is looked for in this order (`version.cjs`
`tokenFor`, the one reader): `FIGMA_TOKEN` in the environment; for release
pinning in a repo, the `figmaToken` command its `snapshot.config.json` names
(`collect` does not run it); then `~/.config/figma/token` (`FIGMA_TOKEN_FILE`
names another file; `bin/set-key figma` writes it). Test a token on a file's `/versions`: `/v1/me` answers 403 to a working file token (it lacks that scope) and 401 to a bad one. A project routing several library files is
told which one the run was in with `--file <key>`; `--repo <dir>` delivers into a copy of the
repo instead, and `--save <file>` keeps the payload. A run can outlast the
tool's answer: when the call reports it lost, look for the temporary page
before running it again. Libraries only; screens are not served.
A large library outlasts one call's time limit (a 64-page one did, 2026-11-25),
so `parts` takes it in parts. Pass the plan code to `use_figma` and save what it
returns as a file: each set's id and its walks, variants × (1 + booleans).
`parts <plan.json>` then lists the calls; make them in that order. The tokens call reads the
variables, styles and icon names. The next call stores the walk on the
temporary page and runs the first part; each later call runs what is stored.
A part holds about 500 walks, and a set over that goes alone (a part of 1,485
walks ran Figma out of memory on a 117-page library, and one of 589 heavy
table and picker walks on another). A part of several sets that still runs out
of memory is split by hand: its call ends `(pages, [set ids])`; make it twice,
each with half of the ids in their order (where it says `null`, every set on
those pages: take their ids from the plan). Collect every holder the calls
return, the tokens one included, in one `collect`. It refuses unless the parts walked every set the tokens call found, each once, in its
order. The parts send no icon files, graphics or previews.
Make them one at a time: parts run at once ran Figma out of memory.
`test-mcp.mjs` holds every call to the cap, the read-back to its chunks, and
the parts, run on a stand-in file, to what one whole walk gives.

## As a login agent

Started from a terminal it dies with the terminal, and after a restart every
snapshot fails until someone remembers it. `install.sh` at the repo root
installs the toolkit's one login agent, `com.toolkit` ([tools/service](../service/README.md)),
whose supervisor runs this router: it starts with the Mac and restarts if it stops.
Output goes to
`~/Library/Logs/toolkit/figma-snapshot.log`, and errors to `figma-snapshot.err`
beside it, a folder only you can read.
After a change to `router.mjs` or anything it imports, it restarts itself once no
snapshot is being read or delivered, and the supervisor brings it back
([`stale-self.mjs`](../shared/stale-self.mjs)); a router started by hand only says so in its log.

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

A library payload may carry `unreadable`: the component sets the plugin could not read because Figma holds them in error (conflicting variant names), each with Figma's reason. The store prints them as a warning, so a missing component never reads as the library's choice.

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
contributed, by name: a collection or style two files both name is shown once,
the last writer's, and the write warns naming the other source; the other
copies are kept under `shared[kind][name][source]`, and one of them takes the
place of a name the last writer drops (with none kept — a store from before `shared`, a tie on `seq` — the name
goes until the other file's next snapshot restores it; one the other wrote later stays). Another library's collection or text style a file sends marked `remote` (its components bind it) is no file's own: shown where no file owns that name, never over the owner's copy, never warned of, and dropped only once no file still sends it. A file that moves to a new key (duplicated, its stamped id
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
`backfill-changes.cjs <label> [--out <file>] [--write] [--grades-only [--regrade]] [--projects <dir>]`
(without `--write` it prints the entries, or writes them to `--out`) rebuilds the facts from the
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

## The contract

`projects.cjs` is the one implementation of all of this — identity, discovery,
routing, layout and what an exit code means. The router imports it, the store
imports it, and so does every repo script that needs to know where something
lives — because these things have to agree and they each used to have their
own answer. The
rules it encodes, and the checklist for adding a project, are
[`standards/snapshot-standard.md`](../../standards/snapshot-standard.md).

## The other files

| File | What it is |
|---|---|
| `graph.cjs` | The component dependency graph (what each is built from, what places it), from a stored snapshot alone: `node tools/snapshot/graph.cjs --project <label>`. |
| `tokens.cjs` | A token's value by name, in a mode, from a snapshot's collections. |
| `version.cjs` | The point a file was last released (a library's publish, a design file's named version), for pinning; `tokenFor` is the one reader of the Figma token. |
| `check-specs.cjs` | `node tools/snapshot/check-specs.cjs <components dir>`: every stored spec is in the compact shape and round-trips. |
| `at-rev.cjs` | A project's stored library at a git revision, for the changes backfill. |

## Screen recipes

    node tools/snapshot/recipes.cjs --repo <project repo>

`recipes.cjs` reads a project's stored screens and prints, as JSON, what they repeat, so an agent building a screen can follow how this project builds one (knowledge/code/agent-prototyping.md). It is derived, never written by hand (§D 23): the next snapshot changes it.

- `screens`: how many were read.
- `shells`: the top-level regions a screen lays out, each keyed by its node type: `{component}` for an instance, `{frame}`, and any other type by its own name, lowercased (`{text}`, `{group}`), how many screens use each, the overlays seen on it and the sections that use it. A child the design places `absolute` is an overlay, not a region, at the top level or deeper: a dialog or a toast, and also chrome pinned in place (a page header kept at the top of a scrolled screen), which the same component laid out in flow elsewhere is not; the counts show both, and which a screen type wants is the designer's.
- `regions`: every frame path two or more screens repeat (`screens`, and `occurrences` counting each repeat within one), with its children and overlays, components and frames tallied apart (a frame named like a component is not that component), and its gap and padding tokens. Only a frame is a region: an instance's insides belong to its component, except its slots, which each screen fills and are read as regions under the component (`Dialog/_Dialog modal/Content slot`, naming each instance between); shapes and text are neither. Padding reads top, right, bottom, left. Not read: what sits inside an absolute frame (an absolute instance's slots are read), or inside a group or section in a screen's content; and a path names a frame and a component alike, so a frame named like the component beside it shares its path. A side with no token shows as its number, marked `(unbound)`; a space-between row's gap is `auto`, and a grid's is not read. A path is the same path under either shell (`Main`), so a value can vary because two shells share it.
- `varies`: a region whose gap or padding is not one token, each value counted. It is a drift, or two kinds of content sharing one path; the designer tells which, and a drift's value is their ruling.
- `unnamed`: screens whose name snapshot-standard rule 24's taxonomy does not read: listed, never dropped.
- `screenTypes`: each section's screens and the states drawn for each, read by that taxonomy.
- `templates`: each screen template, a component a screen is an instance of (the screen's one laid-out child, recorded with its layers): its screens (`screens` counts them, `names` lists them), sections and the regions inside it. Any component that is a screen's whole content counts, a library Dialog too, since what it lays out is that screen's page; the variants of one set are one template, keyed by the set's name. Such a template is entered as the page, so its frames are regions under its name (`_Screen templates - Desktop/_Home/Main/Section`), where a library instance stays closed but for its slots. `code` is the file that implements it, from `templates` in the repo's `snapshot.config.json` (`{ "<template component>": "<repo path>" }`, any framework); `missing: true` when that file is not there.
- `unusedCode`: names `templates` maps that no stored screen uses: a renamed template, or a typo.

The docs site publishes it as `api/screens.json` and the system MCP serves it as `get_screen_recipe` (tools/system-mcp). A screen whose `figma.json` does not parse is skipped by `readScreens`, as everywhere else, and so is missing from `screens`.

`test-recipes.mjs` holds it to a fixture.

