# Shared plugin UI base

`ui-base.css` is the one source of the base stylesheet every plugin's panel uses: Figma's injected `--figma-color-*` tokens for colour, Figma-native sizes for buttons, inputs and selects. A Figma plugin's UI is a single HTML file that cannot load other files at run time, so each plugin carries a copy of this stylesheet inline, between the markers `/* ui-base vN start */` and `/* ui-base vN end */`.

## Changing it

Edit `ui-base.css`, bump the `vN` in its marker, then write it into every copy: each plugin's `ui.html` and [figma-plugin-creator](../../skills/figma-plugin-creator/SKILL.md)'s template and asset.

```sh
node plugins/_shared/sync.mjs           # write every copy
node plugins/_shared/sync.mjs --check   # list the copies that differ; bin/check runs it and fails on one
```

The copies are generated, never pasted (toolkit-standard §D 23). The rules for using it, including how a plugin with its own controls avoids inheriting these sizes, are [skill-standard](../../standards/skill-standard.md) Part B §4.
