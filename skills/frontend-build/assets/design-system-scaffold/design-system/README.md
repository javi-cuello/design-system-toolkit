# Design system

Tokens, then CSS, then HTML, and JavaScript only where the browser does not
already provide the behaviour.

```
tokens/        the design decisions as custom properties
base/          reset, page layout, the utilities that carry behaviour
gallery/       the workbench at /design-system, off unless config opts in
components/
  button/
    button.php          the markup, registered as snippet('__PREFIX__/button')
    _button.sass        the styles, listed in index.sass
    button.stories.php  what the gallery renders and documents
```

A component owns its markup and its styles in one folder. The plugin at
`site/plugins/design-system/` derives the snippet name from the folder, so
**adding a component is adding a folder**. Sass cannot glob, so `bin/css`
writes `index.sass`'s components list from the folders (the toolkit's
`sass-entry.mjs`), between two marker lines no hand edits; `bin/css --check`
diffs it.

## Three kinds of component

The kind decides the implementation. Getting this wrong is how design systems
end up reimplementing the browser.

**1 · Visual — custom element plus CSS, no JavaScript.** Card, tag, avatar,
badge, divider. An undefined custom element is still a real, styleable
element, so these work with scripting off. Nothing registers them.

**2 · Native interactive — a custom element wrapping the real control.**
Button, link, checkbox, radio, select, input, textarea. The wrapper carries
the variant; the native element inside carries the behaviour, the semantics
and the accessibility.

```html
<!-- yes: the browser owns disabled, focus, activation, form submission -->
<__PREFIX__-button variant="primary"><button disabled>Save</button></__PREFIX__-button>

<!-- no: now JavaScript has to reimplement a button, badly -->
<__PREFIX__-button variant="primary" disabled>Save</__PREFIX__-button>
```

**3 · Behaviour-heavy — an actual Web Component with `customElements.define`.**
Dialog, tabs, accordion, combobox. Only where the behaviour genuinely does not
exist in HTML. Check first: `<details>` is a disclosure, `popover` is a popup,
and `<dialog>` is most of a modal — all three need no script.

## Which attributes a component takes

A design's variant axes become attributes, with two exceptions:

- **State** — Rest / Hover / Focus / Press are pseudo-classes. An attribute
  would let a template claim a state the control is not in.
- **Disabled** — the control's own `disabled` or `aria-disabled`, so the
  browser keeps it out of the tab order and out of form submission. The dim
  the design draws is the host's, once: `:has(> :disabled)` on the custom
  element, reading `--__PREFIX__-dim` before the token, which a dimming
  parent sets to 1 for what it holds (see `_button.sass`).

One axis usually cannot keep its name: `Role` becomes `variant`, because
`role` is ARIA's attribute and `role="primary"` would tell a screen reader
the button has a role called primary.

## A component's styles stop at its own edge

Every selector reaches the component's parts through **child combinators
only** — `__PREFIX__-button > :is(a, button)`, never
`__PREFIX__-button :is(a, button)`. A descendant combinator escapes into
whatever the component nests, and nothing about the rule says so.

## Where this goes next

The gallery reads the story files and nothing else, so it works before any
design source is connected. When one is, the same story files take a `parity`
block naming which design variant each control set is and which element plays
each layer — see the `design-code-parity` skill for that loop, its measurement
baseline and its waiver model. This scaffold is the shape it attaches to.
