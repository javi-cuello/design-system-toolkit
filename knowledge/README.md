# Knowledge

What the toolkit knows about doing the work well, past what any run has proven: fundamentals, patterns, cases and practice. Each comes with its public sources.

[Toolkit-standard §D 21](../standards/toolkit-standard.md#21--knowledge-is-guidance-with-sources-never-rules) says what it may hold and how it is read. The pages are guidance, never rules. Each page cites a standard's rule by handle rather than restating it.

Any new UI work starts from the pages for what it builds, before its first line. In a project, the edit hook names them. The push refuses an interface commit without a `Knowledge:` trailer. Asked what the pages say, an agent answers from them alone. Each point cites its page and section, and the answer says where the pages are silent (§D 21).

| Folder | What it holds | Serves |
|---|---|---|
| `ui/design/` | The five areas' fundamentals: `ux.md`, `interaction.md`, `visual.md`, `content.md`, `accessibility.md` | design-standard |
| `ui/patterns/` | Finding your way (navigation, menus, sidebars, pagination, search, filtering). Choosing (selection, chips). Entering (forms, upload, steppers, authentication, settings, property editors, consent). Acting (actions, dialogs, disclosure, feedback). Showing data (tables, data grid, data, data visualisation, calendars, calendar events, timesheets). | design-standard |
| `ui/components/` | One page per component, covering design, Figma and code. Actions and wayfinding (button, link, tabs, breadcrumbs). Overlays and disclosure (modal dialog, drawer, popover, tooltip, accordion). Choices (checkbox, radio, switch, select, combobox, segmented control, slider). Text and status (text input, text area, search input, label, toast, alert, badge, chip, feedback message, progress indicator, spinner, card). | design-standard, figma-standard, code-standard |
| `ui/profiles/` | What a kind of product must specify: `documentation.md`, `dashboards.md`, `reports.md`, `editorial.md` (forms are `ui/patterns/forms.md`) | design-standard |
| `code/` | How to write front-end code. Markup and style (html semantics, accessibility, css architecture, tokens, token taxonomy, responsive). Handoff, scripts and agents (figma handoff, code connect, javascript, web components, react, agent prototyping, agent maintenance, adoption). Quality (performance, i18n, security, testing, browser support) and security past the browser (security server, security platform, security operations). Also `candidates.md`: lessons from single runs not yet rules, with the sources behind code-standard's rules. | code-standard |

The `frontend-build` skill walks these pages when it builds or audits.

## Page shapes

Each topic or pattern section follows one shape, in this order:

1. use when, or what good looks like;
2. how;
3. cases;
4. accessibility;
5. **build**: the code counterpart. It covers elements, the ARIA and keyboard model, states as attributes, and the code-standard rules it serves. It links the `code/` section that owns the detail;
6. check: what a script can measure, and what a reviewer asks;
7. sources.

Where sources disagree, the item is `contested` and names each side, and the project decides. A toolkit convention is a standard's rule, which the page cites (toolkit-standard §D 21).

A pattern page holds what spans components: choosing between them, and how they combine. A component's own guidance lives on its component page. The pattern page it came from links to it.

Every component page has one shape, checked by `check-standards`:

1. An intro naming what it owns and what stays in which pattern page.
2. **Overview**: *Use when / don't use*, *Anatomy*.
3. Its topic sections, each in the section shape above.
4. **In Figma**: *Layers*, *Properties*, *Variants and states*, *Tokens*, *Check*, *Sources*. It cites figma-standard's rules.
5. **Alignment with code**, with the parts below.
6. **In code**: *Element*, *Props*, *Check*, *Sources*.

| Alignment part | What it says |
|---|---|
| *Structure* | how code splits the component, and the Figma components that mirror it |
| *Mapping* | each Figma axis and property, to its prop, attribute or pseudo-class |
| *States* | which the browser sets, which a prop sets, and the combinations code cannot reach |
| *Differences* | where the Figma build departs from the code on purpose, and why |
| *Check*, *Sources* | as in any section |

[`ui/components/button.md`](ui/components/button.md) is the model. Text field and the components with no section of their own yet are written when work first needs them.

A design pattern never ships without its build part. A code page that implements a ui pattern names it in an **Implements:** line under its intro. A code page's own sections are the build, so they carry no build part.

## Weights

The pages hold evidence and how-to, never opinion. Evidence means a spec, shipped source, a tool's documented or tested behaviour, or what shipping systems do. A rule is a standard's, and a project's truth is its own. The toolkit's own reasoning is not admitted.

Every item on a page opens with a weight, so a reader knows how far to lean on it. The weights are `[required]`, `[strong]`, `[moderate]`, `[weak]` and `[contested]`. A weak item rests on one source. It is the research queue, and no reader acts on it.

[Toolkit-standard §D 21](../standards/toolkit-standard.md#21--knowledge-is-guidance-with-sources-never-rules) alone says what each weight means and what moves an item along the scale. It also says what each asks of an agent, and which lines carry none. `check-standards` refuses an item with no weight. When a source is added, checked or contradicted, the item's weight moves in the same change.
