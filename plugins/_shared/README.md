# Shared plugin UI base

Every plugin's window is built from [FigUI3](https://github.com/rogie/figui3) (MIT core), the library behind Figma's PropsKit playground: `figui3/` holds its pinned `fig.css`, `fig.js` and `LICENSE`, at the version `sync.mjs` names. `ui-base.css` is the toolkit's thin frame on top: panels that scroll between a tab bar and a footer, the footer's inset, and spacing tokens; its opening comment says what it adds. A Figma plugin's UI is a single HTML file that cannot load other files at run time, so each plugin carries two generated copies inline: the ui-base block (FigUI3's stylesheet, then the frame) in its `<style>`, and the FigUI3 block in a `<script type="module">`.

## Changing it

Edit `ui-base.css` (bump the `vN` in its marker), or replace `figui3/` with a newer release (update `VERSION` in `sync.mjs`), then write every copy: each plugin's `ui.html` and [figma-plugin-creator](../../skills/figma-plugin-creator/SKILL.md)'s template and assets.

```sh
node plugins/_shared/sync.mjs           # write every copy
node plugins/_shared/sync.mjs --check   # list the copies that differ; bin/check runs it and fails on one
```

The copies are generated, never pasted (toolkit-standard §D 23). The rules for using them (controls are fig-* elements, composed, never restyled) are [skill-standard](../../standards/skill-standard.md) Part B §4.
