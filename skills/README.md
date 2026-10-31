# Skills

Agent skills for design-system work: each folder teaches Claude one job, such as auditing a Figma library, exporting its tokens or keeping code equal to the design. A skill is a folder with a `SKILL.md` (its instructions, and its README), a `CHANGELOG.md`, `tests/cases.md` (what was verified, and how) and, where it needs them, `scripts/` and `references/`.

## Install

From the repo root, link every skill into Claude Code:

```sh
./install.sh            # links skills/ into ~/.claude/skills; the repo becomes the live source
```

Claude Code then loads each skill when a task matches its `description`. To use one in claude.ai, zip its folder and upload it under Settings → Capabilities → Skills. A skill that works on a project reads that project's context document (`~/Projects/<label>/figma-design-system/design-system-context.md`); without one it runs discovery and asks.

## The skills

| Skill | What it does |
|---|---|
| **Figma libraries: audit and fix** | |
| [figma-project-audit](figma-project-audit/SKILL.md) | Runs a project's whole Figma audit by sequencing the audit skills below into one record and one dashboard. |
| [figma-components-audit](figma-components-audit/SKILL.md) | Audits components in a library file: tokens, naming, auto-layout, variants, states, accessibility, descriptions. |
| [figma-foundations-audit](figma-foundations-audit/SKILL.md) | Audits a library file as a whole: page order, names that collide, separators, part naming. |
| [figma-variable-audit](figma-variable-audit/SKILL.md) | Checks that the variables and styles a file uses still exist in its source library. |
| [component-validator](component-validator/SKILL.md) | Says what a target platform (web, iOS, Android) cannot build as drawn, before anyone builds it. |
| [figma-file-diff](figma-file-diff/SKILL.md) | Compares two Figma files: variables, styles, component API and layer trees. |
| **Figma libraries: document** | |
| [figma-component-pass](figma-component-pass/SKILL.md) | Runs the audit, properties table and descriptions on one component, in order. |
| [figma-component-descriptions](figma-component-descriptions/SKILL.md) | Writes and applies component descriptions in the house structure. |
| [figma-properties-table](figma-properties-table/SKILL.md) | Inserts a Properties table documenting every axis, boolean, swap and slot. |
| [figma-doc-generator](figma-doc-generator/SKILL.md) | Generates documentation pages that mirror variable collections, effects and text styles. |
| [figma-tokens-examples](figma-tokens-examples/SKILL.md) | Builds or repairs the tokens-mapping example tables on a page. |
| [figma-contrast-matrix](figma-contrast-matrix/SKILL.md) | Fills a WCAG contrast-ratio grid between colour-scale steps. |
| [figma-context-capture](figma-context-capture/SKILL.md) | Reads a library's conventions into the project's context document, which every other skill reads. |
| **Tokens and colour** | |
| [figma-token-export](figma-token-export/SKILL.md) | Exports variables and text styles as DTCG token files for Style Dictionary. |
| [oklch-color-scale-system](oklch-color-scale-system/SKILL.md) | Generates perceptually even 12-step OKLCH colour scales, light and dark. |
| **Code** | |
| [frontend-build](frontend-build/SKILL.md) | Builds and audits an interface against the design and code standards. |
| [design-code-parity](design-code-parity/SKILL.md) | Keeps a coded design system measurably equal to its Figma source. |
| [kirby-cms](kirby-cms/SKILL.md) | A working reference for building sites on Kirby CMS 5. |
| [figma-plugin-creator](figma-plugin-creator/SKILL.md) | Scaffolds Figma plugins and checks them against the plugin standard. |
| **Research, writing and routing** | |
| [design-system-research](design-system-research/SKILL.md) | Researches how real design systems handle a topic, from primary sources. |
| [humanizer](humanizer/SKILL.md) | Removes the signs of AI-generated writing from a text. |
| [ds-model-routing](ds-model-routing/SKILL.md) | Advises which Claude model and effort suit a design-system task. |

## Writing or changing a skill

What a skill must be before it is committed is [skill-standard](../standards/skill-standard.md): a version and a history line in the same commit, its cases walked, no other skill's files read (a toolkit tool, standard or knowledge page it names by repo path is fine: `bin/get` brings it), no project's data. `bin/check` from the repo root checks what a script can see.
