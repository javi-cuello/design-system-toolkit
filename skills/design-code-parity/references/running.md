# Running it

How a project sets the loop up, builds components and screens against it, saves its verdict and reads a red report. [SKILL.md](../SKILL.md) links here from its workflow.

## Contents

- [Setting up a project](#setting-up-a-project)
- [Validate before building](#validate-before-building)
- [Building a component](#building-a-component)
- [Address a layer by name, never by position](#address-a-layer-by-name-never-by-position)
- [A component publishes the knobs a caller turns](#a-component-publishes-the-knobs-a-caller-turns)
- [A check that can fail silently is not a check](#a-check-that-can-fail-silently-is-not-a-check)
- [A layer that holds data says so in its name](#a-layer-that-holds-data-says-so-in-its-name)
- [Propose the map, do not type it](#propose-the-map-do-not-type-it)
- [Building a screen](#building-a-screen)
- [A screen has to render before it can be measured](#a-screen-has-to-render-before-it-can-be-measured)
- [Save the verdict through the one writer](#save-the-verdict-through-the-one-writer)
- [Reading a red report](#reading-a-red-report)

## Setting up a project

1. Confirm the two Figma files and their release mechanism.
2. Install the snapshot plugin.
3. State the project's `paths` and `after` steps in `snapshot.config.json`.
4. State its files in the context document's routing block. The toolkit writes the snapshot, so nothing is written per project.
5. Generate the tokens.
6. Give the first component a story.
7. Run the comparison for that one component until it is green.
8. Wire the gates into the pre-push check.

Never write the comparison for a component before its spec exists in the repo. A number typed from a screenshot is exactly what this loop replaces (code-standard rule 24).

## Validate before building

After every snapshot, and before a component starts in code, run `component-validator` over the new or changed trees. Give it the project's target platform (web, iOS or Android) and the snapshot's text styles. It asks for the target when the context document does not say.

It names what the target cannot reproduce as drawn. Under `silent` it lists the classes the snapshot's fields cannot show. The report carries those rather than reading as clean, and puts the choice to the designer: Figma, code or accept.

A waiver written later cites that ruling instead of inventing a reason. The step exists because one build ended with 86 waivers nobody had been asked about.

## Building a component

Figma comes first: draw, publish, snapshot. The spec folder appears and the check goes red. The builder then adds markup, styles and story beside it.

Run the one-component comparison until it matches, then the full check. The kind of component (visual, native interactive, behaviour-heavy) decides how much JavaScript it takes, usually none. That ruling is `frontend-build`'s and the project README's, not this skill's.

## Address a layer by name, never by position

`:nth-of-type` counts by element type and `:nth-child` by position. Both break on an edit nobody thinks of as a change. Giving one band a heading turns it from a `div` into a `section`, and every positional selector after it silently points at its neighbour.

Put a name on the thing, such as a data attribute saying which band it is. The mapping then survives the markup improving. It is the same reason a design's layers are addressed by name and not by index.

## A component publishes the knobs a caller turns

A page that writes a rule at a component's root has taken over a property the component measures itself on. A width, a colour or a suppressed opacity are examples. The component's own story and the page then disagree, and only one of them is checked.

Publish a custom property with the design's value as its default, such as `inline-size: var(--field-width, 320px)`, and let the page set it. This is code-standard rule 38. It matters twice here, because the alternative quietly moves a measured property out from under the measurement.

## A check that can fail silently is not a check

The build step in front of a comparison is part of the comparison. A build step that swallows its output reports a syntax error in a mapping as a run that measured nothing. That reads exactly like a component with no assertions. Print why it failed, and stop.

## A layer that holds data says so in its name

A frame's sample is one day's data: a count, a title, a feed of fifteen rows. A layer named `#…` holds data. It is the convention Google Sheets Sync reads, so designers already know it.

The engine reports what follows from a data layer as data rather than judging it:

- the size of a box that hugs data on that axis, or hugs inside a `#` layer;
- the place of a layer that the data pushes along a run.

A layer is pushed when it comes after one that hugs data along that run. In a run not packed from the start, any layer is pushed where a layer, itself included, hugs data.

Each such row still shows, as waived with that reason, and still matches when the two agree. It has no bound, so the measurement baseline is what catches a gap gone wrong behind it. The run's summary counts the rows it let through as data.

A bounded waiver already written on such a key (`within`, `is`, `'unset'`) goes stale, and the stale gate names it for deletion. An unbounded `content` waiver is exempt from that gate, so delete it by hand.

Mark the data in the screen templates' components, never in the instances. A snapshot then carries it to every frame. Before the convention, the reference project had about 250 waivers saying "content-driven", one frame at a time.

## Propose the map, do not type it

Run the proposer instead of typing selectors:

```sh
node tools/parity/propose.mjs --repo <dir> <screen-key> [/route] [--write]
```

It renders the page as the run does and walks the frame and the DOM together. It pairs each layer the coverage gate counts as unmapped with the element in the same place with the same shape. It names that element by an id, a landmark or a data hook. Failing those, it uses the tag under the nearest ancestor that has one, never a position.

It prints the proposal for a person to read, and says which layers nothing matched. With `--write` it merges what the map lacks into a JSON screens map. It adds only what the entry lacks as the run reads it, and counts what it skipped.

Some merges are refused, and a refused merge writes nothing:

- a based entry read through `layers`;
- a `layers` entry that others inherit from.

Each refusal names the rename to `nodes`, since `base` merges only `nodes`.

A new frame whose one child is an unpublished page component is mapped under it, and its `rootLayer` is written. Unpublished means `_` or `.` before its name or its component's name. A project's own wrapper only calls the proposer.

Hand-typing thirty selectors is the slow half of adding a screen, and the half that fails quietly. A proposal is safe because the same parity run checks it. A wrong pairing becomes a difference, which is the loud kind of wrong.

## Building a screen

Mark the frame Ready for dev, which saves the named version. Snapshot. Add one entry to the screens map: the page URL, and which element plays each frame layer.

**A screen is measured at the viewport its frame was drawn in**. Set it as the browser's real size, never as a height in a stylesheet. A frame's size is the window the designer chose to represent. Reproducing it in CSS makes the page scroll on a smaller screen, and asserting it compares the viewport against itself. The page asks for the viewport, and the run supplies the frame's.

Two consequences follow:

- The frame's own minimum height is an artefact of that canvas, and is waived by name.
- Only **one** box in the page may claim the viewport. Two stacked `100dvh` boxes make a page exactly one scrollbar taller than the window.

**Draw each scenario as its own top-level frame**: a scroll state, a modal open, an empty list. Stacked inside one frame, they cannot each be marked or addressed by the map. The reference project measured only the first of three for weeks that way. The frame's name becomes the key in every report, so `2 - Expired` earns its keep over `2`.

## A screen has to render before it can be measured

A screen that will not render is a permission problem as often as a styling one. An application's session guard usually matches everything but the framework's own build output. The fonts, icons and images served from the public directory are then answered with a redirect for anyone not signed in.

That hits the sign-in screen, the one page that needs them and the one page nobody is signed in on. It presents as a styling bug: a fallback face and a broken image.

Name the asset directories in the guard's exception list. Do not let any path with a dot through, which would also let a route with a dot in it past the session check. From then on, the live page is measured like a component.

## Save the verdict through the one writer

The run and the file it leaves for readers are both the toolkit's. Every project saves its per-component verdict with `tools/parity/parity-report.mjs`:

```js
saveReport(file, results, { fullRun })
```

The file is at the path `snapshot.config.json` names as `paths.parity`. The docs site, the dashboard and the record then read one shape on every project.

| Field | What it holds |
|---|---|
| Status | `match`, `drift` or `unmeasured` |
| Counts | Matched and failed |
| Differences | The first ones, in the run's words |
| Dates | When the verdict last changed, and when it last matched |

The file is merged, so a scoped run updates only what it measured. A component whose verdict is what the file already holds keeps its dates. A run that changes no verdict does not write the file. The report lives in a repo, and dates restamped on every run would leave it dirty after every push with nothing to say.

Count only real matches: a waived check is excused, not matched. The one writer exists because a project that only printed its verdict left the docs nothing to show.

## Reading a red report

Take the entries in this order:

1. The release gate.
2. Coverage: unbuilt, unmeasured, literals.
3. Stale waivers.
4. Measured differences.

A measured difference on a token-bound property, with the right token name in the code, means the token file is stale. Re-run the generator before touching the component. A difference in every variant at once is a base-layer change, not thirty bugs.
