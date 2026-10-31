# Design System Toolkit

Tools, Claude skills and standards for running a design system from Figma to code. A plugin takes a snapshot of a Figma library; from that one reading the toolkit generates the design tokens, a documentation site, an audit of how the library is built, and a measurement of how far the coded components are from the design. Claude skills do the work that needs judgement (auditing components, writing descriptions, building an interface) and the standards say what good looks like, each rule with its reason and its check.

The toolkit holds no project. Each project keeps its design-system files in its own repo, in a `figma-design-system/` folder, and the tools find every project by that one rule.

## What is inside

| Folder | What it holds |
|---|---|
| [`plugins/`](plugins/README.md) | Figma plugins: the snapshot plugin every other tool starts from, and smaller helpers. |
| [`tools/`](tools/README.md) | The shared code: the snapshot router, the docs site and audit service, the token build, the parity engine, the checks. |
| [`skills/`](skills/README.md) | Claude skills, one job each: audits, documentation, tokens, building and checking code. |
| [`standards/`](standards/README.md) | The rules everything is held to, each with its reason and the check that enforces it. |
| [`knowledge/`](knowledge/README.md) | Guidance past the rules, with sources: UI fundamentals, patterns and code practice. |
| [`bin/`](bin/README.md) | The commands you run: `bin/check`, `bin/closing`, `bin/audit`, `bin/deploy`. |

## Words used here

- **Snapshot**: what the snapshot plugin reads out of a Figma file (tokens, component specs, screens), stored as files. Every other output is built from it, never from Figma directly.
- **Context document**: a project's `design-system-context.md`, the one place a decision about that project is written (its naming, its libraries, its audit settings, its rulings).
- **Gate**: a check that fails a run, as opposed to one that reports.
- **Parity**: how far a coded component is from its Figma design, measured in a browser.
- **Desktop Bridge**: the Figma plugin that lets Claude and the audit service read and change an open Figma file.
- A handle like `toolkit-standard §D 12` or `code-standard rule 51` points at a rule in [`standards/`](standards/README.md).

## Getting started

**Only one tool?** Take it alone, with every toolkit folder it uses and nothing else. It is git's own sparse checkout, so the code is not copied, and `git pull` updates it:

```sh
git clone --filter=blob:none --sparse <this repo's url> toolkit && cd toolkit
git sparse-checkout set --cone bin
bin/get tools/contract-editor        # or plugins/<name>, skills/<name>; --list prints the folders and changes nothing
```

Then follow that tool's README. The rest of this section sets up the whole toolkit.

**You need:**
- a Mac (the services install as launchd agents; on Linux, run them by hand);
- Node 22.12 or later, pnpm, Google Chrome, and python3 (the Xcode Command Line Tools provide it);
- the Figma desktop app;
- Claude Code with the [figma-console MCP server](https://github.com/southleft/figma-console-mcp) and its Desktop Bridge plugin, for the skills that read or change a Figma file;
- optionally, an Anthropic API key in `~/.figma-dashboard-key` (for the audit page's chat and judgement pass; see [tools/figma-audit](tools/figma-audit/README.md)) and a Cloudflare account with `npx wrangler login` (to publish a docs site).

1. **Clone and install.** Put the repo at `~/Projects/toolkit` (projects are found beside it, in `~/Projects/`), then:

   ```sh
   cd ~/Projects/toolkit
   (cd tools/docs-site && pnpm install)    # the docs site's engine
   ./install.sh                            # checks the repo, links the skills into Claude Code, installs the services and the push hook
   ```

2. **Connect Claude Code to Figma.** Follow the figma-console MCP's setup (register the server with a Figma access token, import its Desktop Bridge plugin in Figma), then import this repo's snapshot plugin: **Plugins → Development → Import plugin from manifest…** → `plugins/design-system-snapshot/manifest.json`.

3. **Set up a project.** Create `~/Projects/<label>/figma-design-system/`, open the library in Figma with the Desktop Bridge running, and ask Claude Code to "capture the context of this Figma library into ~/Projects/<label>/figma-design-system" ([figma-context-capture](skills/figma-context-capture/SKILL.md)). The document it writes needs three blocks, all in [the template](skills/figma-context-capture/assets/context-template.md):
   - `project`: a display name and a `port` in 9223–9232 that no other project uses, counting down from 9232 (the audit service serves the project there; the Figma MCP takes ports from 9223 up);
   - `snapshot-routing`: the library's Figma file key, the part after `/design/` in its URL;
   - `audit-settings`: the library's naming conventions, which the audit reads.

4. **Take a snapshot.** In the library file, run **Plugins → Development → Design system snapshot**. The first time, the router replies with the id the plugin stamped on the file: add it beside the key in `snapshot-routing` and take the snapshot again. From then on it is stored in the project's folder, and everything built from it follows.

5. **Open the docs site** at `http://localhost:<port>/` (it builds within a minute). To audit: with the service already running, open Figma, run the Desktop Bridge plugin in the library, and press **Audit** on the site's Audits page ([tools/figma-audit](tools/figma-audit/README.md)).

**If the project has a code repo**, connect it so its tokens, checks and parity run from the toolkit: `node tools/project-check/init.mjs --repo ~/Projects/<label>` writes the files and hook, then lists the gates and decisions still open ([Connect a code repo](tools/project-check/README.md#connect-a-code-repo)). Then publish the docs site with `bin/deploy`, or ask Claude to use any [skill](skills/README.md).

## A project's home

A project is a repo under `~/Projects/` with a `figma-design-system/` folder at its root; the label is the repo's folder name. The tools find it there and nowhere else, so adding a project is adding that folder. A project with no code repo, or whose code repo is someone else's, gets a small private repo of its own holding just the folder.

```
~/Projects/<label>/figma-design-system/
  design-system-context.md   — everything decided about the project; the only
                               place a fact about it lives (toolkit-standard §D 12)
  snapshot/                  — what the plugin stored, machine-written (a code
                               repo may keep it elsewhere: snapshot.config.json)
  audit/<fileKey>.json       — one audit record per library: results, never settings
  parity/                    — the code audit's map and report, where it has one
  tokens/                    — a DTCG export, where the project keeps one here
  reports/                   — dated write-ups of a run or review, by hand
  site/, storybook/          — built, ignored by the folder's own .gitignore
```

Only the context document is written by hand: **a document records a decision, a snapshot records a reading.** A project that departs from a design or naming rule says so in one line of it, `**Overrides:** <standard> rule N — <why>`, beside a dated ruling. No credentials go in the folder.

## How they fit together

**The snapshot is the source of truth.** Figma is read once, by the snapshot plugin, and every output reads what it stored. A second reader of the same data would be a second answer, so each job has one owner.

| Stage | What runs | What it leaves |
|---|---|---|
| 1. Snapshot | In Figma, the snapshot plugin (`plugins/design-system-snapshot`) posts the library to `tools/snapshot`, which writes every project through its one store | the project's snapshot: tokens, component specs and the contract each derives (`tools/component-contract`), previews, screens (a repo's `design/` or `assets/`, or the project home's `snapshot/`) |
| 2. Tokens | The router runs the repo's `bin/tokens` (`snapshot.config.json` `after`) over `tools/tokens/build.mjs` (figma-token-export → frontend-build); a project with no repo runs `from-snapshot.mjs` | CSS and Sass in the repo; DTCG files and TypeScript |
| 3. Checks | After the project's own `after` steps, the router runs the toolkit's stored-state checks for every project with a code repo: `tools/project-check/validate.mjs` (component-validator) and the parity gates; the repo's `bin/check`, run by a person and by every push, calls `tools/project-check/check.mjs`, every gate the toolkit holds a project to (toolkit-standard §D 13) | findings for the designer; a green or red check |
| 4. Docs | `tools/figma-audit` rebuilds `tools/docs-site` for the project whenever its snapshot or the engine changes | the docs site at the project home's `site/`, served on the project's port |
| 5. Audit | The docs site's Audits page runs the audit skills' scanners through the bridge | `<project home>/audit/<fileKey>.json`, shown on the same page |
| 6. Parity | A repo's `bin/parity` calls `tools/parity` (design-code-parity's method) and measures the built components against the snapshot | the parity report, shown on each component's docs page |

Orchestrators exist where an agent must judge things in Figma: `figma-project-audit` runs the audits, `figma-component-pass` runs a component's pass. Where the sequence is mechanical (stages 1–4), it is code, not a skill: a skill describing it would be prose duplicating the code.

    figma-context-capture ──produces the context document all figma-* skills hydrate from

    figma-component-pass ──orchestrates──► figma-components-audit
                                           figma-properties-table
                                           figma-component-descriptions

    figma-project-audit ──orchestrates──► figma-foundations-audit
                                          figma-components-audit
                                          component-validator
                                          figma-variable-audit

    oklch-color-scale-system ──feeds──► figma-contrast-matrix
                                        figma-doc-generator

Three things worth knowing about the shape:

- **An orchestrator cannot work alone.** It names the skills it runs and stops at the first one it cannot reach, so hand it over with them. Naming a sibling to *run* is fine; reading a sibling's *files* is not, and that is the line to check before sending anything.
- **Small copies across skills are the price of standalone skills.** The WCAG contrast formula lives in both oklch-color-scale-system and figma-contrast-matrix, because neither may read the other. A copy is accepted only where sharing would break that rule.
- **Which skills to run first, for a whole engagement, lives per project.** A project's context document holds its suggested first runs, because the right order depends on what that library needs. The pipeline above is what happens after every snapshot, not a plan for an engagement.

## Working on the toolkit

- **Read the standard that governs the change first**: [toolkit-standard](standards/toolkit-standard.md) for anything here, [skill-standard](standards/skill-standard.md) for a skill or plugin. [`CLAUDE.md`](CLAUDE.md) is how a Claude session works in this repo.
- **Run `bin/check` before and after.** It runs every check and test the toolkit ships; the push hook runs it too.
- **A skill or standard change** bumps its version and history line in the same commit, and walks its `tests/cases.md`; a bug found in use becomes a case.
- **Nothing here names a project**, in code, prose or tests; `bin/check` refuses one. A lesson from a project is written with a stand-in ("one project", "Project A").
- **The Claude Code hooks** ([tools/claude-hooks](tools/claude-hooks/README.md)) keep a session to this loop: they say what is open at its start and what a turn left open with the next message.
- **Full-size work is gated, small work is not.** A script measures the change; past the line (see the hooks' README) the work is planned before it is built (goal, who reads what it touches, what nearby is broken, budget), reviewed by fresh agents before it is reported or pushed, and ends saying what went back to the toolkit, what stays open and which READMEs it updated. Nobody has to ask for any of it.

Because `install.sh` links the skills rather than copying them, an edit here is live in Claude Code at once.

## Licence

© Javier Cuello. Use and change it for your own projects; do not pass it on. The terms are in [LICENSE](LICENSE).
