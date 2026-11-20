# Figma audit

This folder is a local service that serves each project's docs site, with the audit dashboard as its Audits page. The service talks to Figma through the Desktop Bridge plugin, so an audit can read the open file. Press **Audit** on the page and it runs the audit skills' own scanners on the library. It files what they find in the project's audit record and shows the queue. It also rebuilds the docs site whenever its inputs change, and publishes it where the project asks.

The audits belong to the skills, not to this service. It runs their scanners and holds no checks of its own. A session can also audit with the Figma bridge alone, so the service is optional. See [What the service runs](REFERENCE.md#what-the-service-runs).

## What it needs

- Node 22.23.4+ and the docs engine's packages, installed once. The steps are in [docs/setup.md](../../docs/setup.md).
- Figma's desktop app with the [Desktop Bridge plugin](https://github.com/southleft/figma-console-mcp), for audits.
- An Anthropic key in `~/.figma-dashboard-key`, for the chat and the audit's judgement pass. Without one the page still measures and tracks.

The key rules are under [Running it](REFERENCE.md#running-it).

## Run it

`install.sh` at the repo root installs the service as a login item. To run it by hand, from the repo root:

```sh
node tools/figma-audit/server.mjs --all                                   # every project with a port
node tools/figma-audit/server.mjs --data ~/Projects/acme/figma-design-system/audit --port 9231   # one project
bin/set-key audit                                                         # macOS: store the Anthropic key
```

To add a project, give its context document a free port from 9223 to 9232:

```json project
{"name": "Acme", "phase": "design", "port": 9232}
```

The service picks it up within a minute. Open `http://127.0.0.1:9232/audits/`.

Then open Figma, run the Desktop Bridge plugin in the library, and press **Audit**. Start the service before Figma, because the plugin looks for servers when it starts. The port rules are under [Adding a project](REFERENCE.md#adding-a-project-the-port).

From a Claude session with no API key, `bin/audit <project>` runs two stages through this service. The session judges them.

## What it reads and writes

It reads the skills' scanners, the project's snapshot and its context document. Settings and rulings come from the context document. It writes one audit record per library, in the project's `audit` folder. The record holds results only.

Several skills write to one record, so they share one writer and one set of rules. That is [the record contract](REFERENCE.md#the-record-contract). These commands file rows, print the queue, print scores, check the running services and check the bridge can draw:

```sh
node tools/figma-audit/rows.mjs --data <record> [--payload <file>] [--dry-run]
node tools/figma-audit/fix-queue.mjs --data <record> [--file-key <key>] [--owner <skill>] [--chat] [--links] [--page] [--held-back <text>] [--not-scanned <text>]
node tools/figma-audit/scores.mjs --data <record> [--file-key <key>] [--sets <scan.json>] [--scanner <dir>] [--json]
node tools/figma-audit/probe.mjs --project <label> [--file <fileKey>]
node tools/figma-audit/check-services.mjs
```

## What is in the folder

| File | Job |
|---|---|
| `server.mjs` | the service: API, Figma bridge, docs build |
| `frames.mjs` | the WebSocket transport |
| `rows.mjs` | the record's one writer |
| `audit-row.mjs` | a row's component, and whether it is open |
| `fix-queue.mjs` | prints the open rows |
| `scores.mjs` | prints component scores |
| `score-model.mjs` | the score arithmetic |
| `judge-rules.mjs` | what the judge is told |
| `breaking.mjs` | files breaking changes |
| `audit-session.mjs` | the `bin/audit` path |
| `probe.mjs` | checks the bridge can draw |
| `check-services.mjs` | checks running services |
| `services.mjs` | finds running services |

The routes, the page's constraints and what needs a restart are in [REFERENCE.md](REFERENCE.md).

## How it fits

- The [docs site engine](../docs-site/README.md) holds the dashboard page itself.
- The [figma-components-audit](../../skills/figma-components-audit/SKILL.md) skill owns the main scanner and its checks.
- The [figma-project-audit](../../skills/figma-project-audit/SKILL.md) skill decides which stages run.

## Test

```sh
node tools/figma-audit/test-rows.mjs           # the record's one writer, on fixture records
node tools/figma-audit/test-fix-queue.mjs      # the queue text, against the golden files in fixtures/
node tools/figma-audit/test-routes.mjs         # the HTTP routes, on a real service over a scratch project
node tools/figma-audit/test-claude.mjs         # the /claude proxy and its cap, against a fake API; the port guard
```

Each test names what it holds in its first lines. `bin/check` runs every one. See [Test](REFERENCE.md#test).
