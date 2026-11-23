# The loop's parts: files, snapshot, tokens, stories

Parts 1 to 4 of the loop: the two Figma files, the snapshot, the tokens, the build order and the stories. [SKILL.md](../SKILL.md) links here.

## Contents

- [The shape of the loop](#the-shape-of-the-loop)
- [1 · Two files, two moments](#1--two-files-two-moments)
- [2 · The snapshot](#2--the-snapshot)
- [3 · Tokens, under Figma's names](#3--tokens-under-figmas-names)
- [3b · Build a component after the components it holds](#3b--build-a-component-after-the-components-it-holds)
- [4 · Stories that map variants and layers](#4--stories-that-map-variants-and-layers)

## The shape of the loop

The loop has six parts, each with one job. A project that has all six can answer "does the code match the design?" without anyone looking at a screen. Parts 5 and 6, the measurement and the gates, have their own references.

## 1 · Two files, two moments

There are two Figma files:

- The **UI library**: tokens, components with their variants, icons.
- The **Screens** file: pages assembled from the library.

Each has exactly one moment that counts as ready. The library is **published**. A Screens version is **saved to history with a name**.

Figma's last-modified stamp moves on a canvas nudge, a page rename or a plugin's own storage write. None of those can be published, so nothing in the loop reacts to that stamp.

The release gate (code-standard rule 32) refuses a snapshot taken *behind* the latest release. It only *notes* edits made since one. The first version failed on those edits, and a nudge nobody could publish made it unclearable.

## 2 · The snapshot

A Figma plugin with one button reads the whole file and posts it to the toolkit's **router** on the developer's machine. The router is a local HTTP listener, with no API key and no cloud relay, one for every project. It writes into the repo through the one store every project shares (`tools/snapshot`).

### What it writes

- `tokens/figma.json`: every variable, text style, colour style and effect, with its name and aliases.
- One `figma.json` **beside each component's code**: the spec. It holds the layers the designer drew, in Figma's tree, with their measurements.
- One file per screen frame, under the parity tests.
- The icons as SVG.
- **The illustrations as raster**, at twice the size they are drawn.

### A text style is everything the style owns

That is family, weight, size, line height and letter spacing. It is **also its paragraph and list spacing**. These become the tokens `--<style>-paragraph-spacing` and `--<style>-list-spacing`, applied between siblings as `p + p` and `li + li`.

A designer once changed the last two on every Text style. A snapshot that stopped at letter spacing reported nothing, which is the one thing the loop promises never to do.

### Illustrations are not icons

An illustration has no size axis and no `currentColor`, and usually holds an image fill. Exported as SVG, it becomes that image base64'd inside a wrapper nobody wants. Left unexported, it arrives as a bare frame with no asset at all. Then every component that places one has a hole in it.

### Two properties that decide which CSS a translation may use

A stroke's *alignment* is the obvious one. The quieter one is whether the stroke is **included in the layout**: whether it shrinks the box or is drawn over its contents.

One library used it both ways on the same page. A text field's stroke took its pixel from the inner frame, and a list's did not. A CSS border always takes its room. Without the flag, a comparison is two pixels wrong on one of the two and cannot tell which.

With the flag, the stroke maps to the CSS that takes the same room. Code-standard 63 holds the table for all four cases, CENTER included.

The same applies to a **gradient painted on a node**. Read its angle and its stops on the node, not only where the file publishes one as a style. A reader that lives inside the style loop leaves a node's own gradient as the bare word for its type. Nothing downstream can render or compare that.

### The writer never deletes what it did not write

Pruning is right for what the snapshot owns. A spec the library no longer has, with nothing built on it, should not linger as a backlog entry.

Pruning is wrong for everything else. The test is not "is this folder still in the payload". A **rename is not a removal**, and a folder that never had a spec was never the receiver's to manage.

One receiver deleted a documentation folder and a hand-built component with no spec. It then deleted a whole built component because the designer fixed a typo in its name.

The rule that holds: remove a folder that contains **only** the generated spec. Report anything else and leave it. A folder with code beside its spec is a decision for a person.

### After the write

The router stamps the snapshot with the release it came from. Then it runs the project's own steps: the token stylesheets, coverage (part 6) and the validator. `snapshot.config.json` lists them under `after`. They are the only part of this a project owns.

### Both payloads are reported as change

The router does not only write them:

- The library is graded (below).
- Every screen frame is diffed against the file it replaces: layers added or removed, properties moved. Content is counted separately, so a changed sample never buries a changed binding.

The report is the first thing the run prints. A reader who scrolls to the tail reads the validator's list and misses the one line that moved.

Snapshotting twice with nothing changed writes nothing. The spec is the diffable record, and noise in it hides the one line that moved.

### The library is graded like an API version

A library payload is graded against what it replaces. It is graded separately for the designers' files that use the library and for the code built from it. A rename is a patch for one and major for the other.

The grade is stored on the change log entry. The docs site's Changes page shows it, and the audit queue picks up every major change as a decision (snapshot-standard rule 21). It is one line to triage a snapshot before reading any diff.

### Spec shape, and why each half matters

The spec holds one full **default** variant. Every other variant holds **only the deltas** against a named base. A hover variant is two lines, and a change in Figma reads once in a diff instead of thirty times.

Bound values are carried as **token names**: `Spacing/16`, or a fill as `Control/Neutral/inverse-rest`. Unbound values are raw numbers under a separate key. A 16 and a `Spacing/16` look identical on screen, and only the name says the design *chose* it.

Colour styles, effect styles and text styles are carried as style names. Instance children are carried as component names with their label text.

One module is the only reader and writer of this shape. A round-trip test holds the two to each other. Reading and writing a compressed form can disagree silently, and the first thing that corrupts is the diff everyone trusts.

The format is JSON, not YAML: nothing human writes it.

## 3 · Tokens, under Figma's names

### Every collection the file holds, under the name the file gives it

The snapshot carries variables as a map keyed by collection name, each with its own modes. It never uses a fixed set of buckets named after whichever project the tooling was written for.

The first shared plugin required four collections by name and refused a library missing any. A second project could not snapshot at all. A collection matching none of those names was carried only as far as an alias reached into it. That silently cost the second project a 163-variable primitive tier it publishes on purpose.

A project's tier model, its mode names and how many collections it keeps are **its** decisions. The tool reports what is there, and the project's own generator decides what to do with it.

The rule is the same as `figma-components-audit`'s. A value absent from a project's vocabulary skips its step. It never falls back to another project's answer.

### Figma's first mode is not the repo's base

A library may author Light first while the code's standing rule is dark on `:root`, with `[data-theme="light"]` overriding. Write the modes in Figma's order and every colour is inverted, in a file that looks entirely plausible.

Which mode is the base is a **project** decision, so it lives in the project's config. An unconfigured multi-mode collection takes Figma's first mode and *says* that it did.

The modes that are not the base get the override selectors. Taking "all but the first" writes `[data-theme="dark"]` under a `:root` that already holds dark.

### A weight is a name in Figma and a number in CSS

`fontName.style` is `SemiBold`. But `font-weight: SemiBold` is invalid and falls back to normal. That reads as a design that never landed, not as an error. Map the names, and report an unmapped one rather than passing it through.

### The token files

A script turns `tokens/figma.json` into custom-property files named as Figma names its collections and style groups: `_primitives`, `_semantic`, `_text-styles`, `_effect-styles`. There is no renaming layer for a human to maintain in two places.

Components reference those properties and never a raw value. Every literal in a component stylesheet is a token, or carries a comment saying why the design has no value for it.

The generated files are regenerated during the check and compared with what is committed. A hand edit cannot survive a push.

## 3b · Build a component after the components it holds

A Figma component is not a drawing. It is a tree with other components in it, and the spec says which: `instanceOf` on a layer names them. Read that list before writing the first line, and build the named components first.

Take a Button whose `Icon=True` variant instances `Icon/house` and whose `State=Loading` variant instances `Spinner`. That is three components. Built alone, it renders for the Rest variant and is not the design anywhere else.

The reference project's second build did exactly that. Button took any node as its icon and drew no spinner. Text input restated two components' type ramps inline and got its own text style wrong. Both passed every assertion, because the mapping named the five variants that happened to work. The maintainer said "the button looks nothing like the design", after green.

### The order is the dependency order

**A component's dependencies are read from its own spec, not guessed from its name.**

An icon set is a dependency like any other. It is generated from the exported SVGs into one component with the design's `Size` axis. It paints in `currentColor`, so the consumer binds the colour the way Figma binds it per instance. A glyph drawn by hand is the same defect one layer down.

### Fonts are a dependency too, and the loudest one

The faces the text styles name are self-hosted in the repo. A check fails when one is missing. A machine that has the family installed measures green, and one that does not measures a different font in silence.

The same project ran for a week with `Inter` resolving to Helvetica on the developer's machine. Every layout number was about half a pixel out per text run. A `font: inherit` control rendered its chrome in Times. The loop reported agreement.

## 4 · Stories that map variants and layers

Each component has a story beside its code. For parity it states three things:

1. Which Figma variant each combination of the component's controls is: `Size=lg, Appearance=Primary` is `size="lg" appearance="primary"`.
2. Which rendered element plays each Figma layer: `Content` is the component root's inner box, `Label` the span inside it.
3. Which element takes the states.

A story that maps a layer to nothing measures nothing there, and the gate in part 6 says so.

The story tree mirrors the design file's own page list: its divider pages, then its pages, then each page's frames as one story file. A reader then finds a frame where the designer put it. One project grouped its screens by a logic nobody could name, and the maintainer rejected the tree on sight.

### Declare what each axis VALUE means, not which variants you happen to render

A mapping that lists variant names is a list somebody stops extending. The reference project's Button drew 96 variants and its mapping named 5. The run said green, and the other 91 were measured by nothing and reported by nothing.

Declare the values instead:

- `Size=md` is `{ size: 'md' }`.
- `State=Hover` is a forced pseudo-class.
- `Icon=True` is the glyph the design places.

That expands every variant the spec holds and is complete by construction. A value nobody has declared fails the coverage gate instead of vanishing. Name individual variants only where a component has a handful.

### Axes become attributes, with two exceptions

Figma's variant axes become attributes. The mapping encodes two exceptions rather than arguing each time:

- **State** (`Rest / Hover / Focus / Press`) is a pseudo-class. An attribute lets a template claim a state the control is not in.
- **Disabled** is the control's own `disabled`, so the browser keeps it out of the tab order.

An axis whose name collides with a platform attribute is renamed in code, and the story carries the rename. For example, `Role` becomes `appearance`, because `role="primary"` is a lie to a screen reader.
