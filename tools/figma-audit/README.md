# Figma audit

A local service that serves each project's docs site, with its audit dashboard as the Audits page, and connects to Figma through the Desktop Bridge plugin so an audit can read the open file. Press **Audit** on the page and it runs the audit skills' own scanners on the library, files what they find in the project's audit record, and shows the queue; it also rebuilds the docs site whenever the snapshot, the record or the engine changes, and publishes it where the project asks.

## Install

`install.sh` at the repo root installs it as a login item (macOS launchd agent `com.toolkit.figma-audit`), together with the snapshot router. It serves every project whose context document states a `port`. By hand, from the repo root:

```sh
node tools/figma-audit/server.mjs --all                                   # every project with a port
node tools/figma-audit/server.mjs --data ~/Projects/acme/figma-design-system/audit --port 9231   # one project
```

**Needs:** Node 22.12+, the docs engine's packages (`(cd tools/docs-site && pnpm install --frozen-lockfile)` once; `corepack enable pnpm` first if pnpm is not installed), Figma's desktop app with the [Desktop Bridge plugin](https://github.com/southleft/figma-console-mcp) for audits, and, for the chat and the audit's judgement pass, an Anthropic key in `~/.figma-dashboard-key` (see *Running it* below).

## Add a project

Give the project's context document a port in its project block, one the other projects do not use, inside 9223–9232 (the only ports the Desktop Bridge plugin scans):

```json project
{"name": "Acme", "phase": "design", "port": 9232}
```

The service picks it up within a minute; nothing else changes. Then open `http://localhost:9232/audits/`. A project removed, or a port changed, takes effect at the service's next restart (`launchctl kickstart -k gui/$(id -u)/com.toolkit.figma-audit`).

## Use

Open Figma after the service is running (the plugin looks for servers when it starts), run the Desktop Bridge plugin in the library file, then press **Audit** on the project's Audits page. From a Claude session without an API key, `bin/audit <project>` runs the components and foundations stages through this service and the session judges them; the validator and token-link stages run from the page, or from their skills.

## Reference

**This is a UI, not an audit.** The audits belong to the skills: this service
reads `scanner/audit.js`, `scanner/sweep.js` and `scanner/judge.txt` straight
out of `figma-components-audit`, the file-level scanner out of
`figma-foundations-audit`, and the live reader and engine out of
`component-validator`, and runs those. So pressing **Audit** here runs the
project audit's stages — the components, the file as a whole, the library's code
target where its settings name one, and its token links where they name a
source library — the same way a session would, and each stage's rows carry its
skill's name. The page holds no checks
and no judgement prompt of its own. `--scanner`, `--foundations`,
`--validator` (component-validator's `scripts/`, for its live reader) and `--links` point elsewhere if a skill is installed outside
this repo; a missing one makes the page say that stage did not run. The validator's engine is `tools/validator/validate.mjs`, beside this service, and the service will not start without it. `--pairing`
does the same for design-code-parity's instruction that pairs a Figma and a
code component under two names, which `/scripts` serves. The fourth stage, the
variable audit's link check (`--links`), runs where the project routes a library
with the role `tokens` (snapshot-standard rule 17) and that file is open in Figma
beside the library.

The service also files rows by itself, with nothing open and no button
pressed, each from a check that lives elsewhere: the tokens and icon
libraries' own checks whenever the snapshot's tokens settle
(`figma-foundations-audit`, `scripts/library.mjs`); a library's consistency
with itself whenever the snapshot index settles
(`tools/component-contract/analyze.mjs`, under the target `consistency`); the
breaking changes the store graded (`breaking.mjs`); and the code audit, re-run
when the snapshot, the parity map or the code changes
(`tools/parity/watch.mjs`).

The skill does not depend on this service: a session audits a library with the
Figma bridge alone. This is optional.

## Inside the docs site

The service builds the project's docs site (`tools/docs-site`) into
`<project home>/site/` and serves it beside the API on the same origin;
the dashboard is its Audits page (`/audits/`: queue, scores, history and
About), in the site's layout and theme with the live API behind it. The
page itself lives in the docs engine, `tools/docs-site/src/dashboard/`: its
markup (`Dashboard.astro`), styles (`dashboard.css`, over the site's
`styles/system.css`), script (ES modules, one per concern, started by
`main.js`) and checker (`check.mjs`, which proves every name in every module
resolves).
This folder is the service: the API, the Figma bridge, the record. There is
no standalone page; until the site's first build a page request says it is
building.

Published anywhere else (a static host), the same page finds no service, reads
the context and check catalogue baked in at build and the audit record from
`/audit/<fileKey>.json` beside it (the build mounts the audit folder; a record
the build could not parse is served as it is, and the page says so), marks
itself read-only and hides every action.

The project is named by the folder its audit record sits in
(`<project home>/audit/`, one record per library). The site keeps itself current: the
service builds it on start, watches everything it is built from (the
project's snapshot, this audit record, the context document, the parity
report, the built Storybook's index, the engine's source) and rebuilds
a few seconds after any of them changes. Builds take a lock shared by every
process, write to a side folder and swap in whole, so the site never
disappears mid-build. Nothing to run after a snapshot, an audit or a parity
run.

## Why it isn't an artifact

An artifact is sandboxed: it cannot reach `localhost`, so its only route to Figma
is a cloud relay whose pairing code is **single use** — while Figma terminates a
plugin's iframe runtime every one to three minutes ([bridge issue #67][67]). That
combination means re-pairing constantly, and no client-side patch fixes it: the
plugin already stores its code and re-dials, and the server has already deleted it.

Served from `localhost`, the same page has no sandbox. The Desktop Bridge plugin
scans ports **9223–9232** on launch and dials in by itself — the same mechanism
that makes Local Mode survive the runtime kill. No pairing, no cloud and no Claude
session. The service itself imports nothing outside Node and this repo; the docs
site it builds needs its packages (`pnpm install` in `tools/docs-site` once).

[67]: https://github.com/southleft/figma-console-mcp/issues/67

## Changing it — what propagates, and what needs a restart

There is one copy of everything. Every project runs the same `server.mjs` and the
same dashboard page with a different `--data`, and both read the skill's
`scanner/` at request time. So a change reaches every project at once, and the
only question is what the reader has to do to see it:

| You changed | Every project gets it after |
|---|---|
| the page, `tools/docs-site/src/dashboard/*` — markup, styles, logic | its site rebuilding (seconds, automatic), then a browser refresh |
| the skill's `scanner/*` — checks, prompts, buckets, catalogue, scoring | a browser refresh |
| a project's audit records | a browser refresh (that project only) |
| `server.mjs` — routes, transport (`frames.mjs`) — and what it binds once: `breaking.mjs`, and the snapshot's `projects.cjs`, `spec.cjs` and `store.cjs` | restarting that project's service |

**A restart does not reload an open tab.** The page is fetched on load, so a tab left open across a `server.mjs` restart keeps running the page code it loaded; a page change tested from it is the old page. One whole Audit run was judged as "the fix did not work" that way. Refresh before testing anything in the page.

**Prefer the refresh.** Restarting drops the Desktop Bridge plugin's socket, and
the plugin only rescans while it has *no* connection — it usually still holds
Claude Code's — so a restart means reopening the plugin in Figma by hand. That is
the one cost in this arrangement, and it is avoidable for every change except a
`server.mjs` one.

Nothing is copied per project, so there is no propagation step to remember and no
project that can fall behind.

## Constraints the page keeps

Each was a real defect; the reason is what keeps the next edit from reintroducing it.

- **A hidden element is never measured.** `autosize` returns without writing while its element is not rendered, and an empty field is left to CSS: a height read from a hidden view is `0`, and one engine reports a whole drawer for an empty composer. Anything revealed later is measured then.
- **A value that can arrive later is resolved at render, not at build.** A row's deep link is set on every paint, because rows are built before the record's `figmaUrl` is read; built once, every link pointed nowhere.
- **A control that writes into a collapsed container opens it first.** Text written into a hidden composer looks exactly like a dead button.
- **The ask drawer opens by default only from 45rem**, beside the page; below that it is collapsed unless the reader opened it, and opens full width as a sheet.
- **The WebSocket upgrade checks `Origin` as the HTTP routes do,** admitting Figma's sandbox (absent or `"null"`) and figma.com, and logging a refusal: any page the user visits could otherwise take a plugin slot and answer `/exec` with results of its own. `"null"` is also what any sandboxed iframe or `file://` page sends, and it stays admitted because the plugin sends it too: telling them apart needs a secret the Desktop Bridge plugin would carry, and it is a third-party plugin (`~/.figma-console-mcp/plugin`) that carries none. So the socket holds what it can without one, each held by `test-socket.mjs`:
  - **its `Host` is checked on upgrade,** as the HTTP routes check it, so a name rebound to 127.0.0.1 gets no socket;
  - **an open file's slot is not taken from a socket that still answers.** A second socket saying `FILE_INFO` for that file is closed; the old socket is pinged, and gives the file up only when it is closed or silent for 3 s, which is what a runtime Figma tore down looks like (a socket whose peer left is closed, not held half-open);
  - **an answer counts only from the socket its call was sent down,** so another socket cannot guess an id and answer for Figma, and a call fails at once when its own socket goes.
  - **What stays open:** while no bridge is connected to a file, a page can open a socket, claim that file and answer the calls made to it. It sends `Origin: null`, which is admitted, then `FILE_INFO` for the file. What it needs is that file's key: it is in the file's URL and in the project's records, which this service serves to no other origin, so a page must have learnt it elsewhere (a shared link, a pasted URL). A key is not a secret, so the guard rests on the slot being held, not on the key. What it can do: see the code each call sends (the scanners, a fix the maintainer approved), and answer with results of its own, so an audit records findings the file does not have or misses ones it does, a fix reports success, and the dashboard shows what the page wrote. It cannot reach Figma: no code it sends runs there, and it can claim no file a bridge already holds. The page shows which files are connected and since when (`/status`); a file you did not open, or one connected before Figma was, is not the plugin. Such a socket keeps the file while it answers pings, so the real bridge cannot win it back: restart the service (`launchctl kickstart -k gui/$(id -u)/com.toolkit.figma-audit`) and the bridge reconnects first.
- **A known flake in `test-routes.mjs` and `test-socket.mjs`:** each serves on a free port in the bridge's range (9223–9232), so a Desktop Bridge plugin open in Figma on the same machine may dial in and appear in `/status`; close the plugin, or rerun.
- **The HTTP routes are held by `test-routes.mjs`,** on a real service over a scratch project: Host refused (421), a cross-site read or POST refused (403) while the plugin's `/health` probe is answered, `/status`, `/exec`'s failures (no code, `plugin_not_connected`, `wrong_file_not_open`), `PUT /data`'s record guard (an array of rows is not a record), `/patch`'s path guard, and the site folder served without a path out of it. A project that does not resolve gets no docs build, and `/status` says why (`buildError`), rather than a crash retried forever.
- **A socket message is capped at 2^29 bytes** (`frames.mjs`), longer than any string JSON.parse can be handed: a frame declaring more, or fragments adding up past it, closes the socket before anything is buffered.
- **A judge reply that does not parse is an error, never an empty verdict.** Its token budget scales with the candidates; a truncated reply once rendered as "nothing to fix" over nineteen real candidates.
- **Type has a floor:** 14px for UI, 16px for prose, with one exception stated in the token block, `--t-caps: 12px` for uppercase only, because uppercase reads at a size where sentence case does not. An unexplained carve-out spreads.
- **A role promises its behaviour:** `role="tablist"` implies arrow-key movement, and a status line that changes is `role="status"`, so it is announced.

## Running it

`--all` serves every project with a `port`; `--data <home>/audit --port <n>`, repeated, serves the ones named, one port each (the plugin tells projects apart by port). Then open `http://localhost:<port>/audits/`. Keep the port inside 9223–9232 — the plugin
scans only that range and its manifest permits no other. 9231 sits near the top
so it will not collide with the MCP servers Claude Code spawns from 9223 upward.

**Settings and rulings come from the project's context document, not the
record.** The service reads `design-system-context.md` beside the record's
`audit/` folder (`--context <path>` points elsewhere) on every request: its
fenced `json audit-settings` block, per library, and the rulings table in §6.
Beneath that it reads `audit-defaults` in `standards/audit-settings.json`, and a
project key overrides a house key per axis. The record holds results only. A library with no settings
entry makes the page refuse to audit, and say why, rather than scan without its
rules.

For the chat and the audit's judgement pass the service needs an Anthropic key,
from `ANTHROPIC_API_KEY` or from `~/.figma-dashboard-key` (`--key-file <path>`
names another file; the environment wins over either). Prefer the file: a
launch agent's plist is world-readable and gets committed by accident, a 600 file
in the home directory does not.

    bin/set-key audit      # macOS; then copy the key: tested, written 600, linked from ~/.figma-dashboard-key, the service restarted

On another system, write the key to `~/.figma-dashboard-key` yourself and `chmod 600` it. A `~/.figma-dashboard-key` you wrote by hand before is left alone by set-key, which says so: move it aside and run `bin/set-key audit --again`.

The key must be scoped to a workspace (Default will do): an unscoped one is
refused by the API for want of an `anthropic-workspace-id` header, which this
service does not send.

Without a key the page still measures, sweeps and tracks; the drawer hides itself
rather than offering something that cannot answer. The key stays in the service
and is never sent to the page.

A key that is not shaped like one (`sk-ant-` plus a long token) is **ignored with
a line on startup**, exactly as though none were set. A placeholder is worse than
an absent key: `/status` would report Claude as available, the page would offer
the judgement pass, and the run would fail at the end with an API error the reader
can do nothing about.

### Order matters: service first, then Figma

The plugin scans for servers **on launch**, and its `/health` discovery loop runs
only while it has *no* connection at all. So a plugin already attached to another
server — the MCP server Claude Code spawns on 9223, say — will not notice this one
appearing. Start the service before opening Figma and the launch scan finds it.

If you start the service afterwards, close and reopen the plugin once. That is the
only manual step, it is once per Figma session rather than once per audit, and
running as a login agent removes it entirely: the service is up before Figma is.

### As a login agent

`install.sh` writes `com.toolkit.figma-audit.plist` (this folder's template, with this checkout's paths) to `~/Library/LaunchAgents/` and loads it: no terminal window, starts with the Mac. It runs node through a `figma-audit` link beside this file, so Login Items names the service rather than "node". Restart it after a change to `server.mjs` with `launchctl kickstart -k gui/$(id -u)/com.toolkit.figma-audit`. Its output goes to `~/Library/Logs/toolkit/figma-audit.log`, and errors to `figma-audit.err` beside it, a folder only you can read.

### Changing how the service is launched

Edit the template, `com.toolkit.figma-audit.plist` in this folder, and re-run
`./install.sh`: it rewrites the agent and reloads it. `launchctl kickstart -k`
alone restarts an agent with the definition **launchd already holds**, not the
file on disk, so an edited plist takes effect only after that reload.

This is not a detail. When the audit records became one per library, the plist
was updated and every running service kept serving `audit/audit.json` — a file
that no longer existed — so a project with two audited libraries rendered as
never audited, beside a green "Figma connected". An absent record and an
unaudited library are the same answer from the page's side, which is why
nothing could see it.

Two things now catch it: the service **refuses to start** when `--data` names
the legacy `audit.json` while its folder holds other records (the shim's only
case — a `--data` naming a missing `<fileKey>.json` still starts), and
`node tools/figma-audit/check-services.mjs` (run by the toolkit's
`bin/check`) compares every running `--data` against what the projects
actually have.


## The record contract

Several skills write to one project's record, so they write rows the same way. This section is the contract, and it lives here rather than in any one skill, because no skill may read another's files.

**Rows are filed by one writer, never by hand.** `POST /rows` on this service, or `node tools/figma-audit/rows.mjs --data <record>` with the same payload when no service runs. The page's *Audit* goes through the same call. The payload is `{ owner, fileKey?, target?, full, scope?, findings[] }`, described at the top of `rows.mjs`; the writer mints the key, matches a row already there by owner, component and key — or wording, where the row or the finding has no key — before minting, reopens a closed row a run raises again, coerces severity, escapes wording, and closes by owner. It was code in the page and prose here, and the prose is what a session would have re-derived, differently, each run.

**The queue is read out the same way.** `node tools/figma-audit/fix-queue.mjs --data <record>` prints the open rows as figma-components-audit's `.md` mirror, and `--chat` as its chat report; the same record always gives the same text (toolkit-standard §D 23). `test-fix-queue.mjs` holds it to the golden files in `fixtures/`.

- **One row per finding**, found again by what it is about: every scanner sends a `key` — rule, subject, layer path, never wording — and the writer matches on it before it matches on the check's wording, so a reworded check or a moved measurement lands on the row it already has. A row filed before keys existed is found by wording once and takes the key. The row's id is minted from the component and the first 32 characters of the wording's slug, with a hash appended when that id is taken.
- **`owner`**: the skill that raised it, e.g. `figma-components-audit`, `figma-foundations-audit`, `component-validator`, `figma-variable-audit`, `design-code-parity`. Rows from before owners existed belong to `figma-components-audit`. One owner is not a skill: `figma-snapshot-router`, under *Breaking changes*, is the service filing each change the store graded major (for the designers' files that use the library, or for its code) as a decision — intended and announced, or reverted. It files each change once, keyed by the log entry, the rule, the subject and the one thing the change names (never the list its wording carries), from live entries the router graded at the moment of a snapshot (never history the backfill rebuilt, nor a grade the backfill took after the fact). It has no full run of a file, so before each filing the service sends the record's writer its upkeep (`breaking.mjs` `upkeep`): `rekey` for rows filed under an old key, and `close` for a row no live grade raises, saying "the change log's stored grade no longer raises this", or, where only a grade made after the fact raises it, "graded after the fact", with the revisions. Rows a person closed are left as they are. `test-breaking.mjs` proves it, and holds every project's records to every stored grade: an open row no live grade raises, a closed one worded as gone while a grade still raises it, one raised only after the fact and not worded so, or a live major with no row fails it.
- **`rule`**: the rule family or class id that raised it. **`check`**: the scanner's own wording, which is what a re-run matches on. **`fix`** and **`rec`**: arrays of short claims. **`where`**: the component, or `Page list` for a file-level finding. **`node`**: its id, where it has one.
- **`bucket`**: `b1` a safe programmatic fix, `b2` a Figma-UI-only step, `b3` a decision. **`sev`**: `error`, `warn` or `pref`; `pref` is a scanner's `preference`, a name that departs from the naming preferences, which holds no component back; the writer maps anything else a scanner says (`warning`, `review`, `hygiene`) to `warn`. **`target`**: the code target, for a skill that runs once per target; it is part of the row's identity.
- **A dismissal is said as one, with its reason.** A candidate the check raised and a judgement pass dropped is sent as `dismissed` with the judge's `why`, and its row closes saying the judge dismissed it and why; "no longer raised" is reserved for what the check stopped raising.
- **A skill closes only rows it owns, from a full run that says what it read.** A run sent with `full: true` and the `scope` it read closes its own rows it no longer raises inside that scope, for the `target` it ran, marking each done and verified with the run's date. It never touches another owner's row, and a partial run closes nothing. **The writer refuses the claims it cannot act on**, files the findings anyway, and names the clause in `refused`: `full` without `scope`; `full` from an owner whose scanner reports the checks it ran (`figma-foundations-audit`, `figma-components-audit`) without `ran`; and a payload field it does not take is an error. `exhaustive` says the scope is every component that exists, so a row naming anything else closes as renamed or removed — only a scanner that walks the whole file may say it.
- **Rulings are not rows.** A ruling goes to the context document's §6 table. A one-off acceptance of a single finding stays on that row, as `done` with a note.
- **What the judgement pass may do.** A deterministic finding (page order, a bare slash, a case collision, a broken link) is filed as raised and never judged. What is judged — the part-rule questions, the validator's classes — may be dropped only where a ruling names it; a mechanism, a deliberate-looking choice or a library-wide state is not grounds. Two runs of one unchanged file showed why: the judge dropped a real page-order finding both times, and dismissed six stroke findings on one run that it kept on the next.

## What it exposes

| route | |
|---|---|
| `GET /` | the docs site (the dashboard is at `/audits/`) |
| `GET /data`, `PUT /data` | the whole record |
| `POST /patch` | one entry — how a tick or note is saved without racing the rest |
| `POST /exec` | `{code}` straight to the Figma plugin |
| `POST /claude` | proxied to the Anthropic API |
| `GET /status` | is the plugin attached, and to which file |
| `GET /scripts` | the **skills'** scripts: the components scanner, sweep, judgement and fix instructions and measures from `figma-components-audit/scanner/`, the file-level scanner from `figma-foundations-audit`, the live reader from `component-validator`, the link check from `figma-variable-audit`, the pairing instruction from `design-code-parity`, and the snapshot plugin's code for headless use |
| `GET /context` | the project's settings (house defaults merged beneath) and its §6 rulings, read from the context document |
| `POST /ruling` | `{text, where, dryRun?}` appended as a row to the context document's §6 rulings table; refuses a ruling already there; `dryRun` answers without writing |
| `POST /validate` | `{target, specs?, components?, framework?, frameworkMap?, fileKey?}` run through the validator's engine (`tools/validator/validate.mjs`; the service refuses to start without it), which is node code the page cannot run itself |
| `POST /parity` | `{lib, figma[]}`: the library's component names against the components in the code its settings name, through `tools/shared/code-inventory.mjs`; answers what is in both, only in Figma and only in code, and writes nothing |
| `POST /rows` | `{owner, fileKey?, target?, full, scope, exhaustive?, ran?, origin?, findings[], dismissed[]?, why?, language?, dryRun?}` filed into the record by the one writer (`rows.mjs`): keys, matches, reopens and closes by owner; `scope` is required with `full`, `ran` with `full` from an owner whose scanner reports it, `why` is said on each row a full run closes; any other field is refused; `dryRun` reports and writes nothing |
| `GET /health` | what the plugin probes before opening a socket |

It binds to `127.0.0.1` only, **and that is not the protection** — the attacker's
code runs in the victim's browser, so `localhost` is reachable from any page the
user visits. A cross-site POST carrying `text/plain` is a CORS *simple* request:
no preflight, no consent, and the reply need never be read because running the
code is the whole attack. So every route checks `Origin` against this service's
own, with `/health` the one exception, because the plugin probes it from its own
sandbox origin before opening the socket.

**A session can use the same bridge.** When the figma-console MCP reports no files
connected, the project's service may still hold them: `GET /status` lists them, and
`POST /exec` with `{ code, fileKey, timeout }` and the header
`origin: http://localhost:<port>` runs the code in the file named; the value comes
back at `result.result`. Each project's service has its own port (see its plist).
`bin/audit` (`audit-session.mjs`) is that path for an audit with no API key, its components and foundations stages: the
scanners through `/exec`, the session's judgement, then `/rows`, dry-run first. Its filing half (`--file`) is held by
`test-session.mjs` on a real service over a scratch project; the scanning half needs a file open in Figma and is not run.

## Shared vs per-project — the thing to get right

| Shared — this directory, one copy | Per-project — `<project home>/audit/<fileKey>.json`, one per library |
|---|---|
| `server.mjs`, the page in `tools/docs-site/src/dashboard/` | rows, runs, scores, fingerprints, measures |
| the skill's `scanner/*`, `rows.mjs` | settings and rulings — in the project's context document, not the record |
| the checks, the scoring model, the queue's shape | `libraries/<fileKey>` — name, title, Figma URL |

**Every project runs these same files with a different `--data`**, so a change to
the page, the server or the scripts reaches all of them at once — when, is the
table under *Changing it*. Nothing is copied, so nothing drifts.

The scripts are served at `/scripts` rather than stored in each record, and that
is deliberate: they lived in the record first, which meant a new check reached
whichever projects someone remembered to update while the rest kept running last
month's scanner and reporting as current.

**Adding a check** happens entirely in the skill, never here:

1. the check itself in `scanner/audit.js`;
2. its rule mapped to a bucket in `scanner/buckets.json`;
3. its entry added or flipped to `status: "scanner"` in `scanner/checks.json` —
   a check absent there is invisible to the About tab and to scoring's
   "unscanned" arithmetic;
4. its rule mapped to a dimension in `scanner/scoring.json`, if it should move
   the score;
5. any project-specific opinion — a scale, a collection name, an accepted
   exception — read from that project's `audit-settings` block and §6 rulings
   in its context document (`/context`), never hard-coded. A
   check naming one library's scale reports false findings in the next project;
   it once produced 157 of them.

This service needs no change and no restart for any of it.

**A new project** needs its `figma-design-system/` folder with a context document carrying an `audit-settings` block and a `port` in its project block; the service finds it and creates each library's record on its first audit.

## The record

One record per LIBRARY (`audit/<fileKey>.json`) — a library is a Figma file and two files have two runs, so one record could not say that web had been audited and mobile had not. Version-controlled beside the project's design
system context document. Same shape the skill already writes:
`libraries` · `rows` · `runs` · `scores` · `fingerprints` · `asks`. Results only: settings and rulings are read from the context document.

Rows are keyed on the finding, never on a bucket number — numbers renumber every
render, and a key that renumbers reattaches last run's ruling to whatever now
sits in that position.
