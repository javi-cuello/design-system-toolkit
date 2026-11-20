# System MCP server reference

Detail moved from [README.md](README.md).

## Tools

What each tool returns, in full.

| Tool | What it returns |
|---|---|
| `overview` | project, snapshot, every component with a one-line summary and open findings, token collections, change-log and audit totals |
| `search` | components by name or guidance text, tokens and styles by name |
| `get_contract` | a component's contract: props, anatomy and what each value changes, every value a token — what to read before writing its markup |
| `validate` | generated code checked. See the list below. |
| `get_component` | one page in full: sets, properties, guidance, implementation notes, change log, findings |
| `get_tokens` | collections, or one collection's variables per mode (filterable) |
| `get_changes` | the change log, newest first, by component or date |
| `get_audit` | open (or all) findings and 0–100 component scores, by component, and recent runs with their cost |
| `get_project_knowledge` | what the project decided and how it designs. See the list below. |
| `get_screen_recipe` | how this project builds a screen, from its stored screens. See the list below. |
| `list_pages` | every page of the site, found by following its own links |
| `read_page` | any page as plain text, as a reader sees it — foundations, components, tracker, changes |

`validate` checks generated code for:

- raw colours, and the token that holds each;
- token names the library lacks;
- prop values the contract does not have;
- raw HTML elements the library has a component for (`<button>` where it has Button);
- library components defined in the code (a copy);
- given `from`, library components imported from anywhere else.

`get_project_knowledge` reads `api/knowledge.json` (`tools/shared/project-knowledge.cjs`). It returns:

- its product file;
- its live §6 decisions, with scope and the two optional columns;
- its guidance pages.

It answers by part, scope or topic. Each part may be absent; a site built before it answers with a note.

`get_screen_recipe` reads `api/screens.json` (`tools/snapshot/recipes.cjs`). It returns:

- screen templates, with the code file each starts from;
- shells and their overlays;
- repeated regions and slots, with their spacing tokens;
- what varies;
- each screen type's states.

It answers by section or region path. A site built before it answers with a note.

## validate.mjs

- `--from` names where the system's components are imported from (`@/design-system/`, which also passes the `@/design-system` barrel). Without it, imports are not read.
- `import * as` and `import type` are not read.
- A framework part sharing a library name (`Link` from `next/link`) is listed in `--from` to pass.
- The system's own files are not what it checks.
- `--api` reads a built site's files with no service running, and `--json` answers the findings as data, each with its file. Project-check's `validate` gate runs it so over the code a push changes.

## Test fixture

`test-server.mjs` holds every tool's exact answer over `fixtures/site/`, a committed stand-in of what the docs site writes (`api/` and four pages).

- Its `api/screens.json` is `recipes.cjs`'s `derive` over `fixtures/screens.json`.
- Its `api/knowledge.json` is `tools/shared/project-knowledge.cjs`'s `read` of `fixtures/project/`.
- The test fails when either parts from its source: regenerate it.
- Both tests serve a folder with `serve-folder.mjs`.
- A change to what the docs site's API writes (`tools/docs-site/src/pages/api/`) moves the fixture with it.
