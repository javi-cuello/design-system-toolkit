# Tools

The code every project shares, one copy each: the services that take a Figma snapshot and serve a project's docs and audit, and the engines a project's own `bin/` scripts call (token build, parity, checks). A project never keeps a copy of anything here; it calls it, so a fix reaches every project at once. Each folder's README says how to run it.

## In the order a design travels through them

| Tool | What it does | Runs as |
|---|---|---|
| [snapshot](snapshot/README.md) | Receives a snapshot from the Figma plugin and stores it in the project it belongs to; `projects.cjs` is how every tool finds a project and its files. | a local service (launchd), port 9317 |
| [component-contract](component-contract/README.md) | Derives what each component means (its props, parts and states) from the stored drawing. | a library the snapshot and parity call |
| [contract-editor](contract-editor/README.md) | A page for writing a component's contract before it is drawn or built, prop by prop, with what it will cost. | a local page, `serve.mjs`, port 9250 |
| [tokens](tokens/README.md) | Turns the snapshot's tokens into DTCG files, then CSS and Sass, and checks a project's are current. | a CLI each project's `bin/tokens` calls |
| [docs-site](docs-site/README.md) | Builds a project's documentation site from its snapshot (Astro). | built by the figma-audit service; `bin/deploy` publishes it |
| [figma-audit](figma-audit/README.md) | Serves a project's docs site locally with its audit dashboard, drives Figma through the Desktop Bridge plugin, and rebuilds the site when anything changes. | a local service (launchd), one port per project in 9223–9232 |
| [docs-mcp](docs-mcp/README.md) | An MCP server so Claude can answer questions about one project's docs. | registered in Claude's config |
| [parity](parity/README.md) | Measures rendered components against their Figma spec, in a headless Chrome. | a CLI each project's `bin/parity` calls |
| [css-lint](css-lint/README.md) | Checks a project's stylesheets against the code standard (tokens over literals, component boundaries). | a gate in project-check |
| [ui-check](ui-check/README.md) | Checks rendered pages against the design standard and axe-core's WCAG rules. | a CLI, and the frontend-build skill |
| [validator](validator/README.md) | What a code target (web, iOS, Android) cannot draw as a component is designed, from its stored tree. | a library project-check, the docs site and the dashboard call, and the component-validator skill |
| [project-check](project-check/README.md) | Every toolkit gate a project is held to, in one command, and the push hook that runs it. | each project's `bin/check` and pre-push hook |

## Keeping the toolkit itself in shape

| Tool | What it does |
|---|---|
| [toolkit-check](toolkit-check/README.md) | The toolkit's own checks and upkeep: standards, owned jobs, READMEs, the closing pass. |
| [claude-hooks](claude-hooks/README.md) | Claude Code hooks that make a session follow the working loop. |
| [skill-evals](skill-evals/README.md) | Runs an agent on a project's tasks and grades what it built by the project's own gates. |
| [shared](shared/README.md) | Small libraries more than one tool imports. |

## Requirements

Node 22.12 or later for everything; Google Chrome for parity, ui-check and the docs checks; pnpm inside `docs-site/` and `docs-mcp/` (`pnpm install` there once), the only folders with dependencies. Where a project lives is one rule: `~/Projects/<label>/figma-design-system/` ([setup](../docs/setup.md#a-projects-home)).
