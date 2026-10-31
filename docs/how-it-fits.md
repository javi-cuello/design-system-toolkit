# How the parts fit together

The path from a Figma library to tokens, checks, docs, audits and parity, which part owns each stage, and the words used across the toolkit.

## The pipeline

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

- **An orchestrator brings its stages.** `bin/get` takes the skills it says to run with it, and a stage that is not installed is named and skipped while the rest run. Naming a sibling to *run* is fine; reading a sibling's *files* is not, and that is the line to check before sending anything.
- **Small copies across skills are the price of standalone skills.** The WCAG contrast formula lives in both oklch-color-scale-system and figma-contrast-matrix, because neither may read the other. A copy is accepted only where sharing would break that rule.
- **Which skills to run first, for a whole engagement, lives per project.** A project's context document holds its suggested first runs, because the right order depends on what that library needs. The pipeline above is what happens after every snapshot, not a plan for an engagement.

## Words used here

- **Snapshot**: what the snapshot plugin reads out of a Figma file (tokens, component specs, screens), stored as files. Every other output is built from it, never from Figma directly.
- **Context document**: a project's `design-system-context.md`, the one place a decision about that project is written (its naming, its libraries, its audit settings, its rulings).
- **Gate**: a check that fails a run, as opposed to one that reports.
- **Parity**: how far a coded component is from its Figma design, measured in a browser.
- **Desktop Bridge**: the Figma plugin that lets Claude and the audit service read and change an open Figma file.
- A handle like `toolkit-standard §D 12` or `code-standard rule 51` points at a rule in [`standards/`](../standards/README.md).
