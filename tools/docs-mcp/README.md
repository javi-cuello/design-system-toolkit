# Docs MCP server

A read-only MCP server over **one** project's docs site. Ask Claude (the app,
Claude Code, any MCP client) about that project's components, tokens, change
log and audit.

It reads the site's JSON API — `tools/docs-site/src/pages/api/`, written at build
time beside the pages — over HTTP. The local dashboard service and a deployed
copy of the site serve the same files, so the only thing that changes between
them is `DOCS_URL`.

**One instance, one project.** Projects are different customers. A server is
started with one project's URL and has no way to name, list or reach another;
each project is its own entry in the client's config.

## Tools

| Tool | What it returns |
|---|---|
| `overview` | project, snapshot, every component with a one-line summary and open findings, token collections, change-log and audit totals |
| `search` | components by name or guidance text, tokens and styles by name |
| `get_contract` | a component's contract: props, anatomy and what each value changes, every value a token — what to read before writing its markup |
| `validate` | generated code checked: raw colours (and the token that holds each), token names the library lacks, prop values the contract does not have, raw HTML elements the library has a component for (`<button>` where it has Button) |
| `get_component` | one page in full: sets, properties, guidance, implementation notes, change log, findings |
| `get_tokens` | collections, or one collection's variables per mode (filterable) |
| `get_changes` | the change log, newest first, by component or date |
| `get_audit` | open (or all) findings and 0–100 component scores, by component, and recent runs with their cost |
| `list_pages` | every page of the site, found by following its own links |
| `read_page` | any page as plain text, as a reader sees it — foundations, components, tracker, changes |

**Everything the site shows is readable.** The JSON tools answer exact
questions; `list_pages` and `read_page` cover every page, so a page added to
the site needs nothing here. The audit dashboard is the one exception: it is
drawn by script, and its data is `get_audit`.

## Use it

    cd tools/docs-mcp && pnpm install --frozen-lockfile
    DOCS_URL=http://localhost:9232 node server.mjs      # one project's port

In the Claude app, `~/Library/Application Support/Claude/claude_desktop_config.json`:

    "mcpServers": {
      "docs-<label>": {
        "command": "/opt/homebrew/bin/node",
        "args": ["<toolkit>/tools/docs-mcp/server.mjs"],
        "env": { "DOCS_URL": "http://localhost:<port>" }
      }
    }

Deployed, `DOCS_URL` is the site's address. The server needs nothing else.

## Before and after generating

The server's instructions tell an agent to read `get_contract` before writing a component's markup and to run what it wrote through `validate`. The same check is a command for a hook that runs once generation is done, in the repo that writes the code:

    node tools/docs-mcp/validate.mjs <file> --docs <docs site URL> [--component <name>]

It exits 1 on a finding. `test-validate.mjs` holds its rules.

## Test

    node smoke.mjs http://localhost:9232
    node smoke.mjs <project home>/site      # a built site, served on a free port

Starts the server as a client would, calls every tool, and fails on any error
or empty answer, or when the page list misses the foundations or changes pages. `bin/check` runs it on every project's built site; without this folder's packages it is a skip (exit 77), never a pass.

## Limits

- Needs the site built with the API: a project whose build fails serves none,
  and the server exits saying which URL answered what.
- A deployed site behind a login needs the server to send credentials; not
  written, because the one deployed site (one project's, public since 2026-09-24)
  has no login.
