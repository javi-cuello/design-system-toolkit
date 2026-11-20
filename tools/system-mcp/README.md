# System MCP server

A read-only MCP server over **one** project's design system, as its docs site
publishes it. An agent such as Claude, Claude Code or any MCP client uses it.
The agent looks up the project's components, contracts, tokens, screen recipe,
change log and audit. It also checks the code it wrote (`validate`). Named `docs-mcp` until 2026-11-04: it serves the
system, not only its docs.

It reads the site's JSON API — `tools/docs-site/src/pages/api/`, written at build
time beside the pages — over HTTP. The local dashboard service and a deployed
copy of the site serve the same files, so the only thing that changes between
them is `DOCS_URL`.

**One instance, one project.** Projects are different customers. A server is
started with one project's URL. It has no way to name, list or reach another.
Each project is its own entry in the client's config.

## Tools

| Tool | What it returns |
|---|---|
| `overview` | the project, its components and totals |
| `search` | components, tokens and styles by name or text |
| `get_contract` | a component's contract: what to read before writing its markup |
| `validate` | generated code checked against the library and its contracts |
| `get_component` | one component's page in full |
| `get_tokens` | collections, or one collection's variables per mode |
| `get_changes` | the change log, newest first |
| `get_audit` | findings, component scores and recent runs |
| `get_project_knowledge` | what the project decided and how it designs |
| `get_screen_recipe` | how this project builds a screen, from its stored screens |
| `list_pages` | every page of the site, found by following its own links |
| `read_page` | any page as plain text, as a reader sees it |

[REFERENCE.md](REFERENCE.md#tools) says in full what each tool returns.

**Everything the site shows is readable.** The JSON tools answer exact
questions. Two tools, `list_pages` and `read_page`, cover every page. So a page added to
the site needs nothing here. The audit dashboard is the one exception: it is
drawn by script, and its data is `get_audit`.

## Use it

    (cd tools/system-mcp && pnpm install --frozen-lockfile)
    DOCS_URL=http://localhost:9232 node tools/system-mcp/server.mjs      # one project's port

In the Claude app, `~/Library/Application Support/Claude/claude_desktop_config.json`:

    "mcpServers": {
      "system-<label>": {
        "command": "/opt/homebrew/bin/node",
        "args": ["<toolkit>/tools/system-mcp/server.mjs"],
        "env": { "DOCS_URL": "http://localhost:<port>" }
      }
    }

Deployed, `DOCS_URL` is the site's address. The server needs nothing else.

## Before and after generating

The server's instructions tell an agent to read `get_contract` before writing a component's markup and to run what it wrote through `validate`. The same check is a command for a hook that runs once generation is done, in the repo that writes the code:

    node tools/system-mcp/validate.mjs <file>… (--docs <docs site URL> | --api <built site's api folder>) [--component <name>] [--from <import prefix>]…

| Option | What it does |
|---|---|
| `--from` | names where the system's components are imported from |
| `--api` | reads a built site's files with no service running |
| `--json` | answers the findings as data, each with its file |

It exits 1 on a finding. Project-check's `validate` gate runs it over the code a push changes. [REFERENCE.md](REFERENCE.md#validatemjs) says which imports it reads. `test-validate.mjs` holds its rules.

## Test

    node tools/system-mcp/smoke.mjs http://localhost:9232
    node tools/system-mcp/smoke.mjs <project home>/site      # a built site, served on a free port

The smoke test starts the server as a client would and calls every tool. It fails on any error
or empty answer. It also fails when the page list misses the foundations or changes pages. `bin/check` runs it on every project's built site. Without this folder's packages it is a skip (exit 77), never a pass.

    node tools/system-mcp/test-server.mjs

This test holds every tool's exact answer over `fixtures/site/`. That folder is a committed stand-in of what the docs site writes. So the server is tested where no project has a built site, CI included. `bin/check` always runs it; it skips as the smoke does. Both serve a folder with `serve-folder.mjs`. [REFERENCE.md](REFERENCE.md#test-fixture) says how the fixture is made and kept in step.

## Limits

- Needs the site built with the API: a project whose build fails serves none.
  The server still starts, and each tool answers with an error naming the URL
  and what it answered.
- A deployed site behind a login needs the server to send credentials. That is
  not written, because the one deployed site has no login. It is one project's,
  public since 2026-09-24.
