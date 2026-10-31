# Knowledge

What the toolkit knows about doing the work well, past what any run has proven: fundamentals, patterns, cases and practice, each with its public sources. Its rule is toolkit-standard §D 21: guidance, never rules; a page cites a standard's rule by handle and restates none; it grows as the work needs, with no proven case behind each line. A practice a run proves becomes a rule in its standard, and the page then cites it.

| Folder | What it holds | Serves |
|---|---|---|
| `ui/design/` | The five areas' fundamentals: `ux.md`, `interaction.md`, `visual.md`, `content.md`, `accessibility.md` | design-standard |
| `ui/patterns/` | Navigation, menus, sidebars, pagination, search, filtering, selection, chips, forms, upload, steppers, authentication, settings, property editors, consent, actions, dialogs, disclosure, feedback, tables, data grid, data, data visualisation | design-standard |
| `ui/profiles/` | What a kind of product must specify: `documentation.md`, `dashboards.md` (forms are `ui/patterns/forms.md`) | design-standard |
| `code/` | How to write front-end code: `html-semantics.md`, `accessibility.md`, `css-architecture.md`, `tokens.md`, `responsive.md`, `figma-handoff.md`, `javascript.md`, `web-components.md`, `react.md`, `performance.md`, `i18n.md`, `security.md`, `testing.md`, `browser-support.md`; and `candidates.md`, lessons from single runs not yet rules, with the sources behind code-standard's rules | code-standard |

Each topic or pattern section follows one shape: use when or what good looks like, how, cases, accessibility, **build** (the code counterpart: elements, ARIA and keyboard model, states as attributes, the code-standard rules it serves, linking the `code/` section that owns the detail), check (what a script can measure, what a reviewer asks), and sources, with the way the toolkit goes where sources disagree. A design pattern never ships without its build part, and a code page names the ui pattern it implements in an **Implements:** line under its intro; a code page's own sections are the build, so they carry no build part. The `frontend-build` skill consults these pages when it builds or audits; any session may.
