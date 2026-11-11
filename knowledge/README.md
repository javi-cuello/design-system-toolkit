# Knowledge

What the toolkit knows about doing the work well, past what any run has proven: fundamentals, patterns, cases and practice, each with its public sources. What it may hold, and how it is read, is [toolkit-standard §D 21](../standards/toolkit-standard.md#21--knowledge-is-guidance-with-sources-never-rules): guidance, never rules, each page citing a standard's rule by handle rather than restating it. Any new UI work starts from the pages for what it builds, before its first line; in a project the edit hook names them and the push refuses an interface commit without a `Knowledge:` trailer.

| Folder | What it holds | Serves |
|---|---|---|
| `ui/design/` | The five areas' fundamentals: `ux.md`, `interaction.md`, `visual.md`, `content.md`, `accessibility.md` | design-standard |
| `ui/patterns/` | Navigation, menus, sidebars, pagination, search, filtering, selection, chips, forms, upload, steppers, authentication, settings, property editors, consent, actions, dialogs, disclosure, feedback, tables, data grid, data, data visualisation | design-standard |
| `ui/profiles/` | What a kind of product must specify: `documentation.md`, `dashboards.md`, `editorial.md` (forms are `ui/patterns/forms.md`) | design-standard |
| `code/` | How to write front-end code: `html-semantics.md`, `accessibility.md`, `css-architecture.md`, `tokens.md`, `responsive.md`, `figma-handoff.md`, `javascript.md`, `web-components.md`, `react.md`, `performance.md`, `i18n.md`, `security.md`, `testing.md`, `browser-support.md`, `agent-prototyping.md`, `agent-maintenance.md`; and `candidates.md`, lessons from single runs not yet rules, with the sources behind code-standard's rules | code-standard |

Each topic or pattern section follows one shape: use when or what good looks like, how, cases, accessibility, **build** (the code counterpart: elements, ARIA and keyboard model, states as attributes, the code-standard rules it serves, linking the `code/` section that owns the detail), check (what a script can measure, what a reviewer asks), and sources, with the way the toolkit goes where sources disagree. A design pattern never ships without its build part, and a code page that implements a ui pattern names it in an **Implements:** line under its intro; a code page's own sections are the build, so they carry no build part. The `frontend-build` skill walks these pages when it builds or audits.

## Weights

Every item on a page opens with a weight, `[required]`, `[strong]`, `[moderate]`, `[weak]` or `[contested]`, so a reader knows how far to lean on it. What each weight means, what moves an item along the scale, what each asks of an agent and which lines carry none are [toolkit-standard §D 21](../standards/toolkit-standard.md#21--knowledge-is-guidance-with-sources-never-rules)'s alone; `check-standards` refuses an item with no weight. When a source is added, checked or contradicted, the item's weight moves in the same change.
