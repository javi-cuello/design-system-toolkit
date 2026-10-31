# CSS lint

`lint.mjs` holds the gates, as functions of what they read; `check.mjs` runs
them over a project, which states only facts in `styles` in its
`snapshot.config.json` (the header of `check.mjs` lists the keys). Each
project's check calls:

    node tools/css-lint/check.mjs --repo <dir>

A codebase with no snapshot names its sheets in a file holding only
`styles`, read from that file's folder: the toolkit's own docs site is
`tools/docs-site/styles.config.json`, and `bin/check` runs it.

    node tools/css-lint/check.mjs --config tools/docs-site/styles.config.json

| Gate | code-standard | What it reads |
|---|---|---|
| layers | 4 | every top-level statement of the compiled sheets is a layer, keyframes or a face |
| own parts | 5 | a component names no other component (parts named by block), or has no descendant combinator and goes no further than a nested component's host (parts as attributes) |
| `!important` | 4 | none outside a reduced-motion block |
| `outline: none` | 40 | none |
| anchor reset | 48 | no component sheet un-underlines its links; the base layer does, once |
| literal reason | 22 | a literal carries its reason beside it (brace and indented Sass) |
| literal is a token | 22, 46 | a length on a property the design binds, equal to a token of that family, is the token — read off the specs the snapshot stored |
| hidden beats the sheet | 17 | an element a script hides has `[hidden] { display: none }` |
| icon controls are named | 18 | no empty `aria-label` |
| no presentational attribute as a variant | 10 | no `align`, `bgcolor`, `border` and kin on any element, no `width` or `height` on a custom one |
| modified clicks go to the browser | 21 | a click handler that cancels navigation and navigates itself reads the modifier keys |
| native controls follow the theme | 16 | a dark tier comes with a `color-scheme` declaration (every sheet as written, generated tokens included) |
| a hook name reaches only its own | 39 | no rule outside the components layer reaches, by a descendant combinator, a data attribute a component uses for a part |
| a state is a pseudo-class, disabled the control's own | 9 | no state spelled as a class or attribute; no non-ARIA `role` or `disabled` on a custom element |
| one enhancement, one implementation | 36 | no inline script body in two templates |
| a client boundary pays for its own behaviour | 47 | no file under the client directive without a hook, a browser global or a handler it defines |
| a layout container is a component | 11 | no rule outside the components layer sets the max width a container component sets |
| no declaration made to agree with a check | 42 | no height computed as a text's size times its line height |
| a function never crosses to the client | 43 | no inline function handed from a server module to a component imported from a client module |

This table is the one list of the rules these gates hold; the files that
mention the gates point here rather than copy it. Code-standard rule 15 (a count is not part
of a name) needs the rendered page, so it is `tools/parity/pages.mjs`
structure's.

A gate whose inputs a project does not name prints *not run*, never *ok*.
`test-lint.mjs` feeds each gate a violation and the shape it must allow;
`bin/check` runs it by discovery.
