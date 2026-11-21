# The engine — target, inputs, command, report

How a run gets its trees, calls the engine and reads what comes back. [SKILL.md](../SKILL.md) says what to do and in what order; this file holds the detail its steps link to.

## Contents

- [Which target](#which-target)
- [The engine is the source of truth](#the-engine-is-the-source-of-truth)
- [Inputs](#inputs)
- [Running it](#running-it)
- [Output](#output)
- [Instances and the state axis](#instances-and-the-state-axis)
- [The report](#the-report)
- [What the engine cannot see](#what-the-engine-cannot-see)

## Which target

Ask, unless the context document already says. The three rule sets disagree on what is a finding, so running the wrong target gives a confident report about the wrong platform.

| Drawing | Web | iOS | Android |
|---|---|---|---|
| A `%` line height | Clean | A finding | — |
| A Hover state | A pseudo-class | iPad only | A state layer |
| A 32 pt toolbar | Fine | Under the hit target | Under the hit target |

One question, one answer per run: **web**, **ios** or **android**. A library that ships to more than one is validated once per target, with one table per target.

## The engine is the source of truth

The engine is the toolkit's `tools/component-validator/validate.mjs`. The router, the docs site and every repo's check call it too, so it is a tool (toolkit-standard §D 1). This skill keeps the live reader and runs the engine by repo path.

**A project wrapper knows only where its files live.** Resolving specs, choosing the target and printing belong to a project's script. What counts as a finding, which fields a class needs and how a stored shape is read belong to the engine. A wrapper that re-derives any of it drifts the first time the engine changes. The first wrapper carried its own paint mapping, line-height lookup and list of silent classes, and all three went stale within a day.

**There is no path where the agent reads the file and decides by eye.** A class the engine can detect is detected by script. A hand-read pass varies between runs and misses the twelfth component.

## Inputs

The engine reads `{ name, props, variants: [tree] }` per component. A tree is what [`scripts/walk-figma.js`](../scripts/walk-figma.js) returns. There are three ways to get it, and **the stored snapshot is the default**.

### From the project's snapshot (the default)

`--snapshot` reads the component trees the snapshot plugin stored. There is one `figma.json` per component folder.

Figma is read once, by the plugin, and every output reads what was stored. A tool that reads live what the snapshot already carries is a second reader of one fact. The two disagree (toolkit-standard §D 5).

The flag also tells the engine this shape's conventions. The plugin writes a field only where it differs from Figma's default, and names truncation `truncate`. So an absent truncation is off, which is what it means there.

### Live, for a file with no snapshot

Run `walk-figma.js` through `figma_execute` in the library file. It walks the current page, or the node ids in `const SCOPE = [ids];` prepended to it.

- Every lookup in it is the async form. A library file runs under `documentAccess: dynamic-page`, where the sync forms throw.
- Its output is not the snapshot plugin's shape (no boolean-flipped variants, no `compact`). The two are not interchangeable as a store.
- It is small enough to paste per run. A file outside any project (a stranger's library, a file being evaluated) still gets it.
- It stays because the skill runs alone, not because a project should use it.

### From any other stored tree

An export of another shape feeds in as it is. The engine reads paints given as variable names or hex literals, and an effect given as a style name. It takes line-height sources from a text-styles list (`--text-styles tokens.json`).

Fields the trees lack leave the classes that need them silent. The engine lists those under `silent` in its output, so the report can say so.

- A class that raised a finding is never called silent.
- One present field never vouches for a missing one.
- A class with two detectors where only one could run reads `(partly)`.
- Fields inside instances do not count as present, because the walk never enters an instance.

## Running it

```sh
node tools/component-validator/validate.mjs --target web|ios|android [--text-styles tokens.json] [--states '{"axis":…,"options":[…]}'] [--snapshot] components.json
```

| Flag | Meaning |
|---|---|
| `--target` | The rule set: web, ios or android |
| `--text-styles` | A text-styles list, for line-height sources |
| `--states` | The library's state axis (below) |
| `--snapshot` | The trees are the snapshot plugin's; an absent truncation is read as none |

## Output

The engine exits 1 when anything was found. It prints `{ target, silent, findings }`:

- `silent` is the class ids the input cannot show.
- `findings` is an array of `{ class, component, layer, detail, align, variants }`, one per decision. Identical findings collapse across variants.

Each finding also carries these fields:

| Field | Value |
|---|---|
| `key` | The class and the layer or shared cause, in the form below |
| `lands` | figma, both, code or accept, read from its advice |
| `expected` | The target's name for it, where it has one, so a row can render as a comparison |

The `key` form is `<class>|<layer or shared cause>`.

Findings collapse on their advice, not their detail. A layer gets one decision per advice, with every particular it covers kept. A layer that raises two different questions still gets two rows.

## Instances and the state axis

**An instance is visited, never entered.** What is inside it belongs to its main component and is audited under that name. Filing it against every parent that places the component sends a designer looking for a layer that is not there.

- A rule sees the instance node itself only when it declares `onInstance`. Those rules are about the placement: absolute position, icon size, MU8's square artboard.
- Smoothing, strokes, fills, effects and line heights inherited from the main component are not the parent's findings.

**The state axis is the library's, passed in.** Callers pass `states: { axis, options }`, read by `contract.validatorStates` from the library's `stateAxis` and `optionOrder`. The CLI takes `--states`.

- W7's axis check, WT1, I12 and the hit-target rules read that axis.
- With none recorded, they stay silent rather than guess.
- Advice says "the state axis", never one library's name for it.

## The report

A numbered table: `# · Component · Layer · Class · What · Align (Figma / code / accept)`. Order it worst first:

1. Classes that change the component's API: states as booleans (W7, I12, A12).
2. Structure the code must reshape (W1–W4, I8, A15).
3. Values: strokes, text, effects, colour.
4. Content.

A detector hit is not a defect until the agent has read the layer. A `Focus ring` clipped on purpose because the list scrolls is a ruling, not a bug. A `Hover` variant on an iOS library aimed at iPad is a choice.

## What the engine cannot see

Say these in the report, so it does not read as complete when it is not.

| Gap | Why |
|---|---|
| Screen-level classes (iOS safe areas, I14) | Not in a component tree |
| The iOS and Android tables on a real library | Every registered library so far records `codeTarget: web`; tested on fixtures only, so a first run there is a first walk |
| Whether a wrapper is needed (W1), a list (W12), a grid track (W8) | The engine reports the shape; the agent decides |
| Image scale modes (W14), masks (W15), corner smoothing (W13, I2), effect kinds | Reach the snapshot from plugin 0.33.0; an older snapshot leaves them silent, and the report says so |
| The reverse direction: a state or value the code offers that Figma never drew | Not visible from Figma; a parity check's coverage gate catches it after the build |
| A framework's own constraints | Read by the agent from the framework's docs, on top of the platform set |

Examples of framework constraints: a `TextField` that owns its adornment slots, or a Material component that sets its own minimum size.
