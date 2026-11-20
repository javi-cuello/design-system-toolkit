# Shared plugin UI base

This folder holds the look every toolkit plugin window shares. It keeps one source, so all plugins look and behave alike.

## What is in it

| Part | What it is |
|---|---|
| `figui3/` | A pinned copy of [FigUI3](https://github.com/rogie/figui3), the library behind Figma's PropsKit playground. Its core is MIT. `sync.mjs` names the version. |
| `ui-base.css` | The toolkit's thin frame on top. It adds scrolling panels between a tab bar and a footer, the footer's inset, and spacing tokens. Its opening comment says what it adds. |
| `sync.mjs` | Writes the copies into each plugin. |

A plugin's window is one HTML file. It cannot load other files while it runs. So each plugin carries two generated copies inline. The styles go in its `<style>` tag, FigUI3's stylesheet first, then the frame. The FigUI3 script goes in a module `<script>` tag.

## Changing it

1. Edit `ui-base.css` and bump the `vN` in its marker. Or replace `figui3/` with a newer release and update `VERSION` in `sync.mjs`.
2. Write every copy. That is each plugin's `ui.html`, plus the template and assets of [figma-plugin-creator](../../skills/figma-plugin-creator/SKILL.md).

```sh
node plugins/_shared/sync.mjs           # write every copy
node plugins/_shared/sync.mjs --check   # list the copies that differ; bin/check runs it and fails on one
```

The copies are generated, never pasted (toolkit-standard §D 23).

## How it fits

The rules for using the base are in [skill-standard](../../standards/skill-standard.md) Part B §4. In short, controls are `fig-*` elements, composed and never restyled.
