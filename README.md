# Design System Toolkit

Claude skills, tools, Figma plugins and standards for building, documenting and checking a design system, in Figma and in code:

- **Audit a Figma library**: how each component is built, the file's structure and naming, broken variable links, the differences between two files, and what a platform (web, iOS, Android) cannot build as drawn.
- **Document it**: component descriptions, properties tables and token pages in Figma, and a documentation site generated from the library.
- **Colour and tokens**: perceptual OKLCH colour scales, WCAG contrast matrices, and design tokens exported and built for code.
- **Write a component's contract**: its props and parts, agreed by design and code before anyone draws or builds it, in a browser editor that can also push it to Figma.
- **Build and check the code**: an accessible, token-driven front end from a design, a measurement of how far coded components are from Figma, and checks for markup, styles and accessibility.
- **Figma plugins**: library snapshots, icon import, theme switching, layer tidying, component graphs and guidelines.
- **Standards and knowledge**: what good looks like, each rule with its reason and the check that enforces it, sourced guidance on UI and code, and research into how real design systems handle a topic.

The tools read a Figma library through one snapshot, taken by a plugin and stored with the project, so every output agrees with the others.

The toolkit holds no project. Each project keeps its design-system files in its own repo, in a `figma-design-system/` folder, and the tools find every project by that one rule.

## What is inside

| Folder | What it holds |
|---|---|
| [`plugins/`](plugins/README.md) | Figma plugins: the snapshot plugin every other tool starts from, and smaller helpers. |
| [`tools/`](tools/README.md) | The shared code: the snapshot router, the docs site and audit service, the token build, the parity engine, the checks. |
| [`skills/`](skills/README.md) | Claude skills, one job each: audits, documentation, tokens, building and checking code. |
| [`standards/`](standards/README.md) | The rules everything is held to, each with its reason and the check that enforces it. |
| [`knowledge/`](knowledge/README.md) | Guidance past the rules, with sources: UI fundamentals, patterns and code practice. |
| [`docs/`](docs/README.md) | Setting up the whole toolkit, and how its parts fit together. |
| [`bin/`](bin/README.md) | The commands you run: `bin/check`, `bin/closing`, `bin/audit`, `bin/deploy`. |

## Getting started

**Only one tool?** Take it alone, with every toolkit folder it uses and nothing else. It is git's own sparse checkout, so the code is not copied, and `git pull` updates it:

```sh
git clone --filter=blob:none --sparse https://github.com/javi-cuello/design-system-toolkit.git toolkit && cd toolkit
git sparse-checkout set --cone bin
bin/get tools/contract-editor        # or plugins/<name>, skills/<name>; --list prints the folders and changes nothing
```

A folder with packages of its own (the docs site) is named with its `pnpm install`; a skill goes into Claude Code with `./install.sh`. Then follow that tool's README.

**The whole toolkit**, with the skills in Claude Code, the services and a first project: [docs/setup.md](docs/setup.md). How the parts connect, and the words used across them: [docs/how-it-fits.md](docs/how-it-fits.md). To change the toolkit: [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

© Javier Cuello. Use and change it for your own projects; do not pass it on. The terms are in [LICENSE](LICENSE).
