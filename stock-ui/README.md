# stock-ui

The toolkit's own design system, in code only. Everything the toolkit draws for people is built on its stylesheet and scripts, and a project can build on them too. It holds only what is shared. A surface or a project adds its own components on top, and changes the look through tokens. It never copies a file of this folder or edits one for itself.

| File | What it holds |
|---|---|
| `stock-ui.css` | Tokens, the reset, the base look of plain elements, the shared components and the page frame. [REFERENCE.md](REFERENCE.md#stock-uicss) lists each. |
| `frame.js` | The frame's behaviour: the sections' Menu button on a phone, and the masthead's measured height |
| `theme.js` | The theme switch: System, Light, Dark, remembered in the browser, wired to every `[data-theme-choice]` button |

Who uses it:

- the docs site and its audit dashboard (`tools/docs-site`, imported by `src/layouts/Base.astro`);
- the contract editor (`tools/contract-editor`, served by `serve.mjs`);
- the audit-lite plugin, whose colour tokens `plugins/audit-lite/sync.mjs` reads from it.

## Loading it

Load `stock-ui.css` before the surface's own stylesheet. Its first line declares the layer order, `tokens, reset, base, layout, components, utilities`, and every rule in it sits in one of those layers.

- A bundler (Vite, Astro, Next.js): import the file by its path in the toolkit.
- A page served by a toolkit server: serve the file from here, as `tools/contract-editor/serve.mjs` does.
- Load `frame.js` and `theme.js` at the end of `<body>`.
- The stored theme is applied before paint by one line in the page's head (`document.documentElement.dataset.theme = localStorage.getItem('theme')`, in a `try`), and `theme.js` wires the buttons.

It is read from the toolkit checkout. So a project built or deployed where the toolkit is not cannot load it yet. That needs it published as a package, which has not been done.

## Extending it

As design systems that ship a base do it ([css-architecture: cascade layers](../knowledge/code/css-architecture.md#cascade-layers), [tokens: themes and modes](../knowledge/code/tokens.md#themes-and-modes)):

- **Theme by tokens.** A surface re-points stock-ui's tokens in its own `@layer tokens` block (`:root { --accent: …; }`); every component follows. It never restyles a stock-ui component at its own selector.
- **Add components in the same layers.** A surface's own components go in its own sheet under `@layer components`, loaded after this one. They are named for the surface, so they never collide with a stock-ui name. Nothing a surface writes is unlayered: an unlayered rule beats every layer here.
- **Knobs, not overrides.** Where a surface needs a stock-ui component to differ, the component gets a custom property with a default (`--modal-width`). The surface sets it (code-standard rule 38). A knob is added here, in the one file, when a second surface needs it.
- **Something two surfaces need moves here.** A component one surface wrote and another wants moves into `stock-ui.css`, and both use it (toolkit-standard §D 2). It is never copied across.

## Naming

Classes follow one convention: `block`, `block__part`, `block--variant`. State is an attribute or a pseudo-class, and script hooks are data attributes.

Code-standard rule 6 prefers custom elements and attributes. Stock-ui keeps the class convention its first surface argued for, in the header of `tools/docs-site/src/styles/site.scss`. The docs site renders markup it does not write, so element selectors would style that content too. css-architecture.md's *Naming* allows this when it is stated.

The names carry no prefix yet, so a project's own `.button` would meet stock-ui's. Name a project's components for the project until a prefix is decided.
