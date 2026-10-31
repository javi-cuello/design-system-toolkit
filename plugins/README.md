# Plugins

Figma plugins the toolkit uses inside a design file: taking the snapshot every other tool reads, importing icons, switching themes, tidying layers and showing how components depend on each other. Each is plain JavaScript with no build step, and looks native because its UI uses Figma's own colour tokens.

## Install one

In the Figma desktop app: **Plugins → Development → Import plugin from manifest…**, then pick the plugin's `manifest.json` in this folder. It then appears under **Plugins → Development**. Nothing is published to the Figma Community; a plugin runs from this checkout.

## The plugins

| Plugin | What it does |
|---|---|
| [design-system-snapshot](design-system-snapshot/README.md) | Reads a library or a screens file and sends it to the snapshot router (or, with no router, saves it as one JSON file). The start of every other tool here. |
| [lucide-icon-importer](lucide-icon-importer/README.md) | Imports Lucide icons as components with size variants. |
| [theme-switcher](theme-switcher/README.md) | Switches a selection between a library's themes and brands. |
| [organize-layers](organize-layers/README.md) | Arranges layers on the canvas from their names. |
| [component-graph](component-graph/README.md) | Shows what a component is built from and what uses it. |
| [component-guidelines](component-guidelines/README.md) | Shows a selected instance's Usage and Don't guidelines from its description. |

[`_shared/ui-base.css`](_shared/ui-base.css) is the base stylesheet every plugin's UI copies inline, since a plugin cannot load files at run time; [`_shared/README.md`](_shared/README.md) says how it is kept in step.

## Writing or changing a plugin

A plugin meets [skill-standard](../standards/skill-standard.md) Part B (version, changelog, the shared UI base). The [figma-plugin-creator](../skills/figma-plugin-creator/SKILL.md) skill scaffolds a new one. `bin/check` from the repo root runs each plugin's tests.
