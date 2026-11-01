# Snapshot standard — how a design file reaches a project's snapshot, and how readers find it

**Version 2.22.0** — history in [`changelog/snapshot-standard.md`](changelog/snapshot-standard.md).

Governs the chain from a Figma file to a project's stored snapshot: the
**plugin** (`plugins/design-system-snapshot`), the **router**
(`tools/snapshot`), the one **store** that writes every project
(`store.cjs`, through `deliver.cjs`) — and the one way every reader (a docs
site, a tracker, the dashboard, the validator) finds a project's snapshot. It exists because those
pieces have to agree about whose payload this is, what it contains and where
it lands, and for months each had its own answer.

Precedence: an explicit instruction in the session outranks it, and a
project's context document decides the facts it states (which files, which
phase); this file decides how those facts are stated and read.

## Why there is a standard at all

The plugin posts to a **fixed** port on localhost. That is Figma's constraint:
a plugin's manifest allowlists exact origins, so the port cannot be chosen at
run time. One port means one listener, and **nothing in the transport says who
a payload is for**. Whichever process was listening wrote whatever was
snapshotted.

With one project that is invisible. With two it is a design source overwritten
by another project's, and two libraries both called "UI library" so the name
catches nothing. Everything below follows from that one fact.

## The rules

**1 · A file is identified by an id, never by a name.**
Not the file's name, not its collections', not its pages'. Names inside a file
belong to whoever is working in it, they change, and two projects can share
them. A guard that reads one is a guard that guesses.
*Why:* a guess that matches writes another project's design over this one's
source, and nothing downstream can tell the stored file was the wrong one.
*Evidence:* a chain audit found one receiver guarding by collection names, in
a setup where two projects' libraries were both called "UI library"
(2026-09-16).
*Checked:* `tools/snapshot/test-router.mjs` "an unknown id and a missing id are refused, and say what to do".


**2 · A file has two ids and a project states both; a copy is a new file.**
`key` is Figma's own `fileKey` — the only name its REST API accepts; the plugin
asks for it (`enablePrivatePluginApi`) and sends it. `id` is what the plugin stamps into the document
(`snapshotFileId`, root pluginData). A payload that carries the key is routed
by the key alone, so every entry states it; one from a plugin before 0.67.0
is routed by the id. An entry stating only an id cannot tell its file from a
duplicate, so its key is added only once the file is known to be that one.
Only `key` can be handed to Figma. A duplicated file carries its original's id but has a
key of its own, so it is addressed as a new file; an id another project
already claims is dropped from a copy kept to make a project of.
*Why:* neither id does both jobs: a run that cannot read plugin data (the MCP,
rule 26) sends no `id`, and `id` cannot be used to ask Figma anything, so a
project that states one either cannot be routed to or cannot be fetched. An id
copied with the file would route the copy's snapshot into the original's
project; stamping a copy afresh would also re-stamp a file a branch merges into.
*Evidence:* `figma.fileKey` was undefined for a plugin run from Development
until its manifest asked for it, so every payload had arrived anonymous and the
first router could address nothing until the plugin stamped its own id
(2026-09-16); the §D 11 review of 2026-10-30 found a duplicate kept that id.
*Checked:* `tools/snapshot/test-router.mjs` "a file is one file under either of its ids"; `tools/snapshot/test-router.mjs` "an unknown id and a missing id are refused, and say what to do".


**3 · The project's context document is the only place that says so.**
In `<project home>/design-system-context.md` (a project's home is `~/Projects/<label>/figma-design-system/`, toolkit-standard §D 12), §5:

```json snapshot-routing
{ "repo": "~/Projects/<project>",
  "files": { "library": { "key": "…", "id": "…" },
             "screens": { "key": "…", "id": "…" } } }
```

A fact stated twice is a fact that drifts, and the copy that drifts is the one
that lets a stranger in. A repo states where the toolkit is, which project it
is, where it keeps each part of its snapshot, and what it builds from one, in
`<repo>/snapshot.config.json`:

```json
{ "toolkit": "~/Projects/toolkit", "project": "<project>",
  "paths": { "tokens": "design/figma.json", "components": "src/design-system" },
  "after": { "library": [{ "label": "tokens", "run": "bin/tokens", "required": true }] },
  "figmaToken": "…a command that prints the token…" }
```
*Why:* the router routes and refuses from what it reads here, so a second copy
of which files a project owns lets the two disagree, and the router then
writes a payload the project's own record would have refused.
*Evidence:* (Mechanism, not an incident.) The router re-reads every context
document per request and holds no list of its own, so a fact kept anywhere
else is one it never sees.
*Checked:* `tools/snapshot/test-router.mjs` "a project is discovered by its context document; one without a block claims nothing".


**4 · One implementation of the contract.**
`tools/snapshot/projects.cjs` — identity, discovery, routing,
layout, the exit codes. The router imports it, the store imports it, and so
does every repo script that needs to know where something lives. CommonJS so a
repo script can `require` it and ESM can import it.
*Why:* routing, writing and reading each decide whose payload this is and
where it lives, and three implementations of that decision can each be right
alone and still disagree, which is how a payload passes one guard and fails
the next.
*Evidence:* the 2026-09-16 chain audit found the router and two receivers each
with their own answer: one guarded by collection names, one copied the last
key onto an unidentified payload, and the router knew neither.
*Checked:* `tools/toolkit-check/owned-check.mjs` "a job the toolkit owns is written again in this repo" over `tools/toolkit-check/owned.json` "writing a snapshot" (and `tools/toolkit-check/owned.json` "reading a stored snapshot"), run by every repo's check.


**5 · One writer, for every project.**
`store.cjs` writes the snapshot — tokens, component specs, icons, graphics,
previews, screens, the changes log, the index — at the paths that project's
`snapshot.config.json` gives, and `deliver.cjs` is the only thing that calls
it, for a repo and for a design-only project alike. A project does not write
its own snapshot: its own steps run after the store, from its `after` list, so
a repo owns what it builds from a snapshot and nothing about the format. *Why:* three writers of one format is three formats. *Evidence:*
two repos each had a receiver and the toolkit a third writer; they wrote token
files of two shapes, screens in three layouts with three rules for a duplicate
name, and icons two ways, and each carried fixes the others lacked — one kept
a renamed component's spec, the other deleted it silently; one bounded the
size of a waived difference, the other never checked a waiver was still used.
*Checked:* `tools/snapshot/test-router.mjs` "the server writes each payload into the right repo", which both repos'
payloads were migrated through.

**6 · One entry point, and it is the toolkit's.**

    node tools/snapshot/deliver.cjs <project> library|screens <payload.json>

for a payload the router kept, `--pin` to re-read the release stamps alone and
`--pinned` for a check's gate. The kind is an argument, not a flag of its own,
so a third kind never adds a flag and nothing needs a table of who takes what.
Release pinning (`version.cjs`, behind `--pin` and `--pinned`) is the
toolkit's, and works for any project with a Figma token: `FIGMA_TOKEN`, a
`figmaToken` command in `snapshot.config.json`, or the machine's
`~/.config/figma/token` (`bin/set-key figma`). Each file a kind routes is
pinned to its own release, recorded beside its entry in `_meta.sources`, and
`--pinned` checks each file against its own; every Figma read has a timeout,
and a named version is looked for past the first page of versions.
*Why:* an entry point in each repo is a second way in that the toolkit's guard
and writer do not stand behind, and a fix to delivery has to be made once per
copy.
*Evidence:* until 2026-09-19 each repo ran its own `bin/figma-snapshot`, and a
second project's could not even bind the plugin's port while the first was up,
so snapshotting meant remembering which receiver to stop.
*Checked:* `tools/toolkit-check/owned.json` "bin/figma-snapshot", read by `tools/toolkit-check/owned-check.mjs`: a project may not carry that file; `tools/snapshot/test-router.mjs` "each library file a project routes is pinned to its own publish", seen to fail stamping the first file's publish; `tools/snapshot/test-router.mjs` "a named version behind a full page of autosaves is found".


**7 · Exit codes mean something.**

| Code | Meaning |
|---|---|
| `0` | written |
| `1` | failed — an exception, a bad argument, a write that did not finish |
| `4` | refused — handled cleanly and deliberately wrote nothing |

Refused is separated from failed on purpose: a payload from the wrong file is
the guard working, not a crash, and reporting it as a crash trains everyone to
ignore crashes.
*Why:* a caller acts on the code alone, so a refusal and a failure that share
one either hide the real crash or send someone to debug a guard that worked.
*Evidence:* the 2026-09-16 chain audit found a refusal reported as a crash.
*Checked:* `tools/snapshot/test-router.mjs` "the answer is the OUTCOME: a refusal is 409, a failed required step is 500".


**8 · The answer is the outcome, not the receipt.**
The router replies when the write and the project's own steps have finished:
200 written, 409 refused, 500 failed. The plugin shows the body. It used to reply the moment the payload
landed, so Figma said "done" over writes that had refused or crashed.
*Why:* the designer pressing the button sees only this answer, and a receipt
tells them the snapshot is stored when it may not be; the stale snapshot is
found later, by whoever builds from it.
*Checked:* `tools/snapshot/test-router.mjs` "the answer is the OUTCOME: a refusal is 409, a failed required step is 500".


**9 · One guard, at the door, and it refuses rather than guesses.**
The router routes by id, and nothing else decides where a payload lands. A
payload with no id is refused, so is one no project claims, so is one two
projects claim, and so is one arriving when a context document cannot be read
— "I could not tell" is not a reason to write over a design source. *Why:* the
second guard was a second implementation of the first. It existed while each
repo wrote its own files and could be handed a payload directly; with one
writer, reached one way, it was a copy to drift rather than a safety.
*Checked:* `tools/snapshot/test-router.mjs` "a malformed payload is refused before anything is written" and the unknown-id case.


**10 · One delivery at a time per project, and projects in parallel.**
Two payloads for one project would otherwise write the same files at once and
the loser leaves a half-finished tree that looks finished. A project's own
steps run asynchronously, so one repo's build never holds another's snapshot:
a blocking run made every other project wait its turn.
*Why:* a half-written snapshot is read as a whole one by every reader after
it, and serialising across projects would make one repo's slow build the
cost of everyone's snapshot.
*Evidence:* the 2026-09-16 chain audit found two payloads for one project
running two receivers over the same files at once.
*Checked:* `tools/snapshot/test-router.mjs` "deliveries to one project are serialised, and two projects still run at once".


**11 · Both loopback stacks.**
`localhost` is two addresses and macOS resolves `::1` first. Binding only
`127.0.0.1` leaves the other half to whoever wants it — something took it once
and answered every snapshot with a 404 while the router logged nothing.
Never `0.0.0.0` or `::`, which would put it on the network.
*Why:* the plugin cannot choose which address `localhost` resolves to, so an
unbound half sends snapshots to whatever holds it, and the router never sees
them to log the failure.
*Checked:* `tools/snapshot/test-router.mjs` "snapshot-standard 11: both loopback stacks answer, and no other address does", seen to fail with `::1` unbound.


**12 · A summary on screen, the detail in a file.**
A list long enough to scroll is a list nobody reads, and it buries the two
lines that say whether this run worked. Anything past a handful goes to
`<repo>/.snapshot-logs/`, newest five kept, gitignored.
*Why:* the reader of the answer is a designer in Figma deciding whether to
press the button again; a failure buried under a scroll of detail is read as
success, and the detail still has to exist for whoever debugs it.
*Evidence:* (Mechanism, not an incident.) The plugin shows the router's body
as it is, so whatever length the answer has is the length on screen.
*Checked:* `tools/snapshot/test-router.mjs` "snapshot-standard 12: a step's detail goes to .snapshot-logs, newest five kept, and the answer carries its first line only", seen to fail keeping six.


**13 · Nothing is inferred from the last write.**
No carrying a previous snapshot's fileKey onto an unidentified payload. A key
taken from history is a key that outlives the file it described, and it makes
every payload look identified — including one from another file.
*Why:* the guard can only refuse what it can see is unidentified; a borrowed
key turns the one payload it most needs to refuse into one it accepts.
*Evidence:* the 2026-09-16 chain audit found a receiver copying the last
snapshot's key onto an unidentified payload.
*Checked:* `tools/snapshot/test-router.mjs` "snapshot-standard 13: an unidentified payload after an identified one is refused, never given the last one's file".


**14 · A payload has one schema, checked before anybody writes it.**
`tools/snapshot/payload.cjs` states what a library and a screens
payload contain, and the router refuses (400) a payload that does not match,
before routing. Extra keys are never an error: the plugin carries keys older
receivers still read. *Why:* identity was contracted and contents were not, so
each receiver decided the shape, two receivers wrote the same file in
different shapes, and every reader either coupled itself to one repo's layout
or read Figma live. *Evidence:* a docs site needed a per-repo config naming
each file's location, and the component guidance it wanted was in no
receiver's output at all (zero `description` keys across every stored spec).
*Checked:* `tools/snapshot/test-payload.mjs` "each broken field is named" walks both directions, and every stored spec in
both repos passed the schema on the day it landed.

**15 · One spec module.**
`tools/snapshot/spec.cjs` is the only `compact()`, `resolve()`
and `slug()`; a repo re-exports it and keeps only its own helpers beside it.
*Why:* the compact form is only safe while its writer and reader agree, and a
copy per repo is two writers. *Evidence:* the two copies had already diverged
in one guard and their comments; replaying every stored spec through the
shared module rewrote none of them. *Checked:* `tools/snapshot/test-spec.cjs` "a single variant round-trips".

**16 · A project states its layout once, and every reader asks the contract.**
Where each part of a snapshot lives is the canonical layout in `store.cjs`,
overridden key by key by a repo's `snapshot.config.json` `paths` (a repo's
specs live beside its code; `false` for a part it does not take). The store
resolves its paths from there, and every reader calls
`contract.layout(projectsDir, label)`. *Why:* a path stated in two places is a
path that drifts. *Evidence:* a receiver's header listed its component specs
under a folder they had not lived in for weeks, and a docs site carried a
second config restating five of the same paths.
Needs a read: nothing can prove a hard-coded path is absent.
*Checked:* `tools/snapshot/test-router.mjs` "layout(projectsDir, 'studio')" in the DESIGN-ONLY case (`contract.layout`) and `tools/snapshot/test-router.mjs` "const P = store.paths(made[0].repo" in the --pin case.


**17 · A project with no code repo is stored in its own home, and may span files.**
A `snapshot-routing` block with no `repo` stores the snapshot in
`<project home>/snapshot/` at the canonical layout — the same writer as a
repo's, with nothing after it. A kind may list
several files (`"library": [{…}, {…}]`), and each write merges: collections
and styles by name, components tracked by the file they came from, so
snapshotting one file never erases what another contributed. A name two files share is shown once, the last writer's (the owner with the highest `seq`), and the write warns naming the other source; a collection's other copies are kept under `shared[name][source]`, so `pass-c-scales.mjs` reads each library's own, and a style's are not. A name the last writer drops shows the other's kept copy; with none kept (a store from before `shared`, a tie on `seq` among entries from before it, a style) it goes, though the other still lists it, and the other's next write restores it: the dropper's values served as the other's would be wrong where missing is only missing. A writer that moved gives way to a live source's kept copy the same way, and with none kept its copy goes. A name the other wrote later (each source entry's `seq`, the store's write order; a day ties) is the other's copy, and a file dropping it leaves it. (Mechanism, not an incident.) A file entry may
name a `platform` (`"platform": "mobile"`): its components are stored as
`<platform>-<name>` and carry the platform, so a mobile library's Button lands
beside the web one instead of over it. A library entry names its `roles`:
`["tokens"]` for the file that holds the variables and styles, `["components"]`
for a library the audit scans, `["icons"]` for the library of icons,
illustrations and other assets, two where one file is both. A project with an
`icons` library shows it as its own docs section, named as the file is, with a
gallery per page; a project with none keeps its icons under Foundations.
They are the one place that says which libraries a project audits and which
one holds its tokens: the audit settings only override the house defaults
for a library routed here, and a components library's variable source is the tokens file, never a key copied into its settings. A file with
no role is snapshotted and audited by nothing. *Why:* a
design-only engagement had nowhere to store a snapshot, so every tool it used
read Figma live and nothing downstream (docs, tracker) could run for it. *Evidence:* the one
design-only project in the heaviest use splits its system across a Core file
for variables and a components file, so a single-file snapshot could not hold
it. The roles replaced a list of audited libraries kept by hand in the audit
settings, which named one of one project's three files: its tokens and icon
libraries were checked by nothing, and each components library repeated the
tokens file's key. *Checked:* `tools/snapshot/test-router.mjs` "DESIGN-ONLY: a project with no repo is stored in its own toolkit folder"; `tools/snapshot/test-router.mjs` "the routing block gives each library its roles"; `tools/snapshot/test-router.mjs` "tokens: a same-named collection or style from another source is warned of"

**18 · The phase is stated once, in the project block.**
```json project
{ "name": "Display name", "phase": "design" }
```
in the context document; `phase` is `design`, `build` or `maintenance`, and
every output reads it through `contract.project()` / `layout()`. An optional
`markers` object is the page-marker legend in ladder order, where a project's
markers say more than figma-standard rule 11's two (`🚧` in progress, `❖` finished); a
component's status is read from its page name through it (`contract.status()`),
so the designer's marker is the status and nobody keeps a second one. `done`
names the rung, or rungs, that mean complete where that is not the last one (a
ladder that ends in "blocked", or two finished states), and the tracker counts
completion by it. An optional `publish` (`password` or `public`) says who may
read the project's published docs site: set, the dashboard service redeploys it
through `bin/deploy` after every build; absent, nothing is published but by
hand. An optional `port` (9223–9232, the range the Desktop
Bridge plugin scans) is where the figma-audit service serves the project's
docs site and audit; the service started with `--all` serves every project
that has one, so a new project needs no change to the service. *Why:* a
design-only project needs a handoff spec and a tracker, a project being built
needs parity, a project in maintenance needs neither tracker nor handoff; with
no phase anywhere, every output showed the same thing to all three.
*Evidence:* no phase concept existed in the dashboard, the context template or
the router when a docs site was first built over two projects in different
phases. *Checked:* `tools/snapshot/test-router.mjs` "a project block naming an unknown phase is refused"; `tools/snapshot/test-router.mjs` "a project block naming an unknown publish mode is refused"; `tools/snapshot/test-router.mjs` "a project block naming a port outside the bridge range is refused".

**19 · What a record stores per file is the identity; the name is resolved
when it is read.**
Rule 1 guards the door: a payload is identified by an id. This is the same
rule one step later, for everything the store then writes — a change log
entry, a component's `file` in the index, an audit record, any row that says
which file something belongs to. It stores `key` or `id`, whichever the run
carried (rule 2), and a reader turns that into a name at the moment it draws
it, through `contract.fileLabel()`. `contract.fileIdent()` is the other half:
it folds a key, an id, or a name a record written before this carried, onto
one identity — and refuses to fold a name that two files share, because a
guess between them is worse than showing the name as it stands.
*Why:* a name is the one thing about a file that changes without anything
changing, and a record keyed by it splits its own history on the day someone
renames the file in Figma — half the rows under the old name, half under the
new, with nothing to say they are one file. Storing the identity makes a
rename cost nothing: one file, one history, named however it is called today.
*Evidence:* a Figma library renamed from `03. Web library` back to `02.`
put two chips on one project's Changes page for one file, one from the router's live
writes and one from a backfill run minutes earlier. The same afternoon, the
same file recorded under its key on its components and under its document id
on the page list those components are grouped by filed 61 of 62 components
under "Other" on the components index — the join returned nothing, and nothing
said so. *Checked:* `tools/snapshot/test-router.mjs` "the change log names each file by its identity"; `tools/docs-site/src/lib/snapshot.js` "and filed none of them" — the docs
reader throws when a file's page list matches its headers and files no page.

**20 · A change is graded for each of its two audiences, and the grade is
stored with it.**
Every entry the store adds to the change log carries a `grade`: each change
with the rule that set it (`GRADE_RULES` in `store.cjs`, the one table) and a
level, major, minor or patch, for the **designers' files** that use the
library and, separately, for the **code** built from it. The two are never
merged before they are stored, because they part exactly where it matters: a
token, style, mode, collection or property rename keeps every Figma instance
(patch) and changes a name the code uses (major); a component or layer rename
is minor for code, because only what finds it by name needs the new one. The
levels are semver's, read the way design systems publish them: removing or
narrowing is major, adding or deprecating is minor, a value that moved is
minor because the output moves with it, and a size change is major for Figma
files because instances in fixed layouts reflow. What loses a consumer's work
in Figma is major for Figma however small it looks in code. A component is
graded Deprecated when "deprecated" newly appears in its name or its page.

A component is the one its node id names: a new id under an old name is a
removal and an addition, because the instances placed from the old one are
orphaned, except across a variant set and a single component under one folder
(a set collapsed to its one variant, or a component given an axis), where the
folder pairs them and the axes are graded as properties. Where the snapshot
carries no id, a rename is paired from evidence and the rule says so (the same
values in every mode and a name respelled in one segment; one property of a
type for one; nine in ten token names for a collection; sibling instances of
one component in order, when as many leave as arrive, and never plain layers,
which carry no such evidence); anything unpaired is a removal.

*Why:* a grade printed and thrown away cannot be read by anything after the
run, and one level for both audiences is wrong for one of them on every
rename. *Evidence:* the store graded every write from 1.9.0 of
`design-code-parity` and stored none of it. Tested in Figma on 2026-10-01:
renaming a variant value, a variant property, a slot property, a variable or a
layer kept every instance and override, which a single grade called breaking;
deleting a property, re-pointing a nested instance, deleting a slot and
deleting a mode lost consumers' work, and the grade called the first three
nothing it could see. Replayed over one project's git history, the first
version logged twelve renamed collections as twelve removals.
*Checked:* `tools/snapshot/test-router.mjs` "a change is graded per audience", its per-rule grading cases.

**21 · A change major for either audience is filed once, as a row to decide.**
The service that writes the audit record files each change that is major for
either audience as a row, once, from live entries only (never one the backfill
rebuilt from git or graded after the fact), and finds the row again by its key
alone (`tools/figma-audit/breaking.mjs`): the entry, the rule, the subject
and the one thing the change names, never the list its wording carries, which
a regrade may shorten. The service closes the router's rows itself, through
the record's writer and before it files: a row no stored grade raises says so,
and a row only a grade made after the fact raises says that. Every library
with a role (rule 17) has a record, the tokens and icon libraries included;
a file with no role has none, and its majors are graded and shown on the
Changes page but filed nowhere.
*Why:* a breaking change decided once should stay decided, and a row filed
against a library with no record would name the wrong file. (Mechanism, not an incident.)
*Checked:* `tools/figma-audit/test-breaking.mjs` "every project", which holds the filed rows and every stored grade to each other: an open row no live grade raises, a closed one still raised, or a live major with no row fails it.

**22 · A fix to the grader reaches the stored log by a regrade, never by hand.**
`backfill-changes.cjs --grades-only --regrade` grades a live entry across the
snapshot commits around it; a worktree pair ends at the first commit after its
start; a subject another live write touched between the same two commits keeps
the grade it was given, because that window cannot tell the two writes apart;
and the regrade rewrites the entry's lists and notes from the same replay. A
file's former keys fold onto it, so a re-keyed file's history pairs with
itself. Tokens are logged once per window. A field the old snapshot recorded
nowhere is the plugin's new record, not a change, unless both snapshots say
the same plugin release took them (`_meta.plugin`, 0.49.3 on). A grade the
router made stays the router's when regraded (it carries `regraded`) and is
still filed.
*Why:* a stored log that a fixed grader cannot reach keeps the old verdicts
forever. Absence alone cannot tell a field the plugin began to record from one the
library began to use. (Mechanism, not an incident.)
*Checked:* `tools/snapshot/test-changes.cjs` "every project".

**23 · One detector finds the changes.**
`tokenFacts`, `componentFacts` and their parts in `store.cjs` find every change;
the change log's lists and notes, the grade, and through `gradeOf` the Changes
page's level and the queue's wording are all read from their facts, never found
again. Each note carries the rule of the change it belongs to, and a reader
joins on that alone. A change's type (Added, Removed, Renamed, Restyled,
Changed, Deprecated, Docs) is read from `GRADE_RULES` when the entry is read,
never stored, so a new type reaches stored history without a rewrite; a size
change is Restyled, and its grade is what marks it. The detector's names are
registered in `tools/toolkit-check/owned.json`, so a second detector fails
`tools/toolkit-check/owned-check.mjs` (toolkit-standard §D 1).
*Why:* two detectors disagree. *Evidence:* the first version found changes
twice, once for the log's notes and once for the grade, and on a renamed layer
the page read "Layers" beside a grade of "renamed".
*Checked:* `tools/toolkit-check/owned.json` "tokenFacts"; `tools/snapshot/test-router.mjs` "one detector: the change log and the grade name the same change the same way".

**24 · A screen is named by a taxonomy, and addressed by where it sits.**
A frame marked ready in a screens file is named `<Section> <flow>-<step> -
<Screen>` or `<Section> <flow>-<step> - <Screen> - <State>`: `<Projects> 2-1 -
List`, `<Projects> 3-3 - Rename dialog - Error`, `<Login> 1-2 - Login - Error
1`. The prefix is the section the frame sits in (the nearest header page above
its page, which the plugin sends; the page itself in a file with no sections),
so the name says where it belongs and a frame moved without renaming is caught.
The flow and step are digits and set the order only. The Screen is what is on
screen, a noun in sentence case (`List`, `Rename dialog`). The State is one
from the list in `store.cjs` `STATES` (Initial, Empty, Filled, In progress,
Ready, Error, Success, Scrolled, Selected, Menu open, No results, Deleted,
Expired), which a project extends in `snapshot.config.json` `screens.states`;
a trailing digit tells two of one state apart. A frame with no State is its
Screen's default. The store addresses the frame by its section, its page and
its name without the prefix or the numbers:
`projects--main-screens--rename-dialog-error`. So two sections may each hold a
`-- Main screens`, and reordering a flow renames no folder. A name the
taxonomy refuses, a prefix that is not the frame's section, or two frames on
one folder or one number within a page, refuses the whole snapshot and names
each frame with the fix.
*Why:* a frame skipped quietly is a screen measured stale. *Evidence:* the
store keyed on the frame name and fell back to the page name, so the PROJECTS
and TEAMS sections, each with a `-- Main screens` drawing `2-1 - List`, were
one key; both were dropped, the stale folders stayed, and the projects list
was built from a frame a week old and reported as a duplicate in the design
(one project, 13 Oct 2026).
*Checked:* `tools/snapshot/test-router.mjs` "screens: addressed by section".

**25 · A designer's annotation travels with its layer, and a new one is said.**
The plugin records each layer's Dev Mode annotations as `notes` (text,
category, pinned properties), and every screens run counts them and lists in
full each one that is new or changed since the stored frame, naming the
screen and the layer. A note is behaviour to build; the run says so once and
the mapping or the code answers it.
*Why:* an annotation is the one place a frame says what no measurement can
see. *Evidence:* the Screens file's sidebar carried three Development notes —
show the workspace switcher only with something to switch, the account
header read-only with one account, Add account opening the login page — and
nothing in the snapshot carried them; the code had built the first one
differently (one project, 13 Oct 2026).
*Checked:* `tools/snapshot/test-router.mjs` "a new note is listed whole".

**26 · A library snapshot through the Figma MCP is the plugin's own, and is proved equal.**
`tools/snapshot/mcp.mjs` serves the plugin's `code.js` to `use_figma`, never a
copy of its walk, and delivers what it returns through `deliver.cjs`. Where
Figma's cloud differs, the shared code falls back, each fallback dormant
wherever the app's own call succeeds: pages load one by one; an instance in a
font the cloud lacks stays where it was made; an AUTO line height whose font
will not load is measured from one-line text already set in that style. A
description handed back HTML-escaped is unescaped on both routes. The file's name comes from the REST answer, and the store writes an
icon's attributes sorted, which rewrites every project's icon files once on
the next delivery by either route. What still differs is named: the file's
snapshot id is null, since the cloud refuses plugin data (the key routes it); the images come
from another rasteriser, within 17 of 255 per channel on anti-aliased edges,
so switching routes rewrites the image files once; and the cloud can list a
collection's variables in another order, which moves a line in the stored
tokens and nothing generated from them. A run outlasts the call's answer on a
large library: the call can report the answer lost while the run completes,
so the temporary page is looked for before a run is repeated. A project that
routes several library files names the one the run was in (`collect --file
<key>`); the first file is never assumed. Screens are not served.
*Why:* a second payload builder drifts from the first without anyone noticing,
and a route that differs in what it writes churns every file it touches.
*Evidence:* the same library version was taken both ways, the plugin's code
run in the app through the bridge and through `use_figma`, and delivered into two copies of one repo. Every tree,
token and style was equal. The differences were the file's name ("Document"),
two escaped icon descriptions, the attribute order in 87 of 138 icons, one
variable's place in its collection, and the pixels of 1192 images, none moved
by more than 17. With the fixes, a second pair of runs wrote the same files
but for the images, that variable's line and the timestamps (one project,
30 Oct 2026).
*Checked:* `tools/snapshot/test-mcp.mjs` "the payload reads back whole, across frames, its characters as they were"; `tools/snapshot/test-mcp.mjs` "the file's name is Figma's own, since use_figma calls every file Document"; `plugins/design-system-snapshot/tests/test-walk.mjs` "pages load one by one where loading them all is refused"; `plugins/design-system-snapshot/tests/test-walk.mjs` "a style's line is measured from one-line text already drawn in it, never the run's own"; `plugins/design-system-snapshot/tests/test-walk.mjs` "a description the cloud hands back escaped reads as typed"; `tools/snapshot/test-router.mjs` "an icon is stored with its attributes sorted, so the app and the cloud write the same file". `tools/snapshot/test-mcp.mjs` "with several, --file names the one read, never the first by default".

## Adding a project

Nothing is registered and no existing project changes. Three steps:

1. **A context document** at `<project home>/design-system-context.md` with a
   `project` block (name, phase, and the `port` the audit service serves it on) and a `snapshot-routing` block naming
   whatever file keys are known, and the repo if there is one. Until the
   routing block exists the project claims nothing, which is correct: a
   project part-way through setup must never become the place strays land.
2. **With a repo:** `<repo>/snapshot.config.json` (`toolkit`, `project`,
   `paths` wherever the repo departs from the canonical layout, and the
   `after` steps that build from the snapshot). The repo writes no receiver of
   its own (rule 6). **Without one:** nothing; the router stores it in
   `<project home>/snapshot/`.
3. **Snapshot each file once.** It is refused, and the refusal prints the
   file's `"key"` and stamped `"id"` (a copy's key alone: the id it carries is
   its original's); paste them into the block as that kind's entry.

For a design-only project with one library, the contract editor started on no
project writes step 1's document from a name, the library's key and its id
(`projects.create`), refusing a label that has a home or names the toolkit's
own folder, a file another project claims, and any project while one's
routing cannot be read (rule 9). Step 3 need not come second: the router
keeps a library snapshot no project claims (`projects.keepUnclaimed`, for a
day, the five newest, under a one-time code the router answers with, in a
folder under the user's home that no other user may read, never in a project),
and the editor makes the project from it by a name, the library's address and
that code, the file's id taken from the snapshot, then delivers it through
`deliver.cjs` as a kept payload is. Any page can post to the router, so a kept
snapshot is taken only by its code, which only the sender was shown, and is
refused where it says it is another file than the address given (one from a
plugin run from Development says no file). A screens file is not
kept: a project is made from its library. No post to the router, library or
screens, is read past 256 MB (`projects.LARGEST`, well past the largest
snapshot met), nor more than that held at once by the posts being read and answered: the sender is
answered 413 or 503, and nothing is written. Started on no project, the editor
starts the router too where nothing holds its port.

The router picks all of this up on the next request — no restart. Proven by
`test-router.mjs`, which adds a third project mid-suite and asserts the two
already there are untouched by its arrival.
