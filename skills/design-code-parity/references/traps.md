# Traps, each paid for once

Each trap below cost a project once, with the rule that closes it. [SKILL.md](../SKILL.md) links here.

## Contents

- [Mapping](#mapping)
- [The snapshot and its writer](#the-snapshot-and-its-writer)
- [Measuring](#measuring)
- [Waivers](#waivers)
- [The runner](#the-runner)

## Mapping

### A null address on a layer that paints hides its paint

Mapping a wrapper to `null` credits it as structural. On one project `Main` was null on every screen while it carried a page gradient and a 76 padding. Coverage read 100%, and the page stayed white until the designer pointed at it.

A null is honest only for a layer with no fill, stroke, effect or padding of its own. A text's fill is its colour, not a background. Anything else is mapped, or carries a `<key>.layer` waiver saying why. Examples: the dialog states that null the page behind them, or a divider drawn as its neighbour's inset shadow. Coverage refuses the rest.

### A pair the design draws and the DOM collapses maps the wrapper to nothing and the inner frame to the element

Examples: a card whose outer frame pads nothing and whose Content frame pads 20. Or a group that gaps 12 between a label and a list the fieldset holds as one box. The browser has one element for the two layers. Mapping the outer one gives a `pad` or `gap` difference where neither side is wrong.

Waiving it records the collapse as a disagreement and hides which layer the element is. Instead, map the wrapper `null` (it paints nothing, so coverage accepts it) and the inner frame to the element. That records the translation it is and keeps the box under the ruler. On one project this turned 52 of 56 new differences into mappings, and the four left were real.

### Map the layer the browser renders, not the one that covers the viewport

A modal's layer in the design file is usually the scrim: a full-frame box with the sheet inside it. The code's element is the sheet, which the browser puts in the top layer and centres there. Map only the scrim and every descendant is judged from the scrim's corner. The subtree then reads as displaced by exactly half the viewport.

Map the dialog's own layer to the same element beside it. The offsets then agree on both sides. The scrim keeps its own waiver for the size and fill the `::backdrop` carries.

### An instance's insides are in the spec only where the design overrode them

The snapshot carries an instance as its component's name and props. It walks inside only when a layer there was overridden. That is right: the insides are the other component's spec, measured by its own story. But the same layer path then resolves in some variants and not others.

Map what you need from an instance knowing most variants will report it `absent`. Credit the rest to the nested component's own run. Read a path that resolves nowhere as a stale mapping, nothing else.

### An attribute quietly renamed passes the component and fails the screen

Instance props compare as attributes under Figma's names. Take a code attribute named away from its Figma prop (`tint` for `Colour`). It measures fine in its own story, since nothing there compares the wrapper as an instance. It surfaces only when a screen holds the component.

Name attributes as Figma names the prop. Declare a translation only for a real collision (`Role` → `appearance`, because `role` is ARIA's), in one place the comparison owns.

### A state the map cannot reach passes as the rest state

A click selector matching nothing, or the wrong element, measures the page unchanged and reports agreement. Make a missed selector fatal, the way an unexpected theme is. On the reference project a filter modal measured shut for a day, behind waivers that read as if it were open. A script had moved the attribute the selector keyed on from the opener to the closer.

### A ready-for-dev status belongs to a top-level frame and nothing else

Figma allows the status only on a node directly under a page or section. So scenarios stacked inside one frame cannot each be marked. A screen moved inside a section stops being a screen: the section becomes one, under its own name.

## The snapshot and its writer

### The change report is read at the head, not the tail

The library grade once said BREAKING, with six renamed tokens, in the run's first lines. The reader looked at the last forty and saw the validator's list. A report that is not the first thing printed gets skipped.

### A long-running writer keeps writing with old code

Three snapshots in one day were written by a process started before its code was edited. Either it re-reads the code per payload (the toolkit's router does), or it is restarted after every edit. Say which in the project's README.

### A shared tool that names a project's collections has picked a project

This is part 3's rule, kept here because it does not present as a bug. The first project works perfectly and the second cannot start, which reads as the second library being wrong. The tell is an error message that names collections rather than describing a shape.

### Whoever is listening gets the payload

The plugin posts to a fixed port. A development plugin once sent no `fileKey`, so a writer could not ask whose library arrived. With a second project's receiver up, a snapshot lands in the wrong repo and overwrites its tokens. The file name does not save you: more than one library is called *UI library*.

The answer is one router that routes by the file's key, never two listeners. The id the plugin stamps is used only for a plugin before 0.67.0, since a copy carries its original's id. A clash once showed as `EADDRINUSE`, the lucky version: with only the other receiver running, the write would have succeeded silently.

**The repo states which library it accepts and refuses anything else, writing nothing.** Collection names are the signal: stable, and different between libraries. The first snapshot may set the expectation, but a later mismatch is a refusal, never a merge. A refused payload skips everything downstream. Otherwise the token generator and coverage run against the snapshot on disk and report success for a write that never happened.

### A writer that builds its own `_meta` drops what the plugin was telling it

The snapshot's `unrecorded` list holds the properties the plugin carried that the repo does not read. It is the input to gate 10, "every recorded property is compared, or says why not". A receiver that composes a fresh `_meta`, rather than extending the payload's, silently removes that evidence. Three defects in one day belonged to this class.

### Fixtures prove the rules; the library proves the shapes

Run the spec round-trip over every spec on disk, not only over hand-written cases. A tree shape the fixtures never imagined arrives the first time a designer draws one, already written. The same run fails a spec stored in full rather than as default plus deltas. That is a receiver that skipped the compaction: correct file, unreadable next diff.

### A dev plugin has no file key unless its manifest asks

`figma.fileKey` is undefined for an unpublished plugin without `enablePrivatePluginApi`. The snapshot plugin sets it (0.67.0), since a duplicated file carries its original's stamped id and only the key tells them apart. The dev manifest also needs an `id`, or its Tools entry dies on re-import.

### A publish takes a moment to reach the REST API

The release gate may read the previous version for a minute. Offer a re-pin that re-reads stamps only.

### The gate on last-modified cannot be cleared

This is part 1's rule. It is the most tempting first implementation, and it was the first one here.

### An asset the snapshot did not carry is reported, not substituted

A frame that draws an image as a raster fill, not an instance, leaves the exporter nothing to export. Say which asset is missing and carry on with the rest of the build. One project cropped the image from the frame render and keyed its background out by hand. The soft placeholder had to be replaced an hour later, when the designer sent the source.

### An instance swap is which component, and skipping it is skipping the picture

A swap property names the component the design placed; for an icon, the glyph a reader sees. Classed as content beside the text props, it is never compared. The children check cannot cover it either: `ds-icon` is `ds-icon` whichever glyph it holds. On the reference project a nav arrow became a house in the library and stayed an arrow on the page, behind a green run.

Compare the swap against the rendered icon's own name. Where a swap sits at the library's placeholder, the design chose nothing, and that is a waiver, not a comparison.

## Measuring

### A probe that returns nothing is a finding about the probe

A layer mapped to a selector that matches no element reports no differences. Count the matches and fail on zero.

### Geometry passed while the content drifted

Part 5's children comparison exists because of this. Do not ship parity without it and call the check complete.

### The fallback face measured close enough

Load the real fonts in the renderer and assert the family that rendered.

### A clip at exactly the canvas width passed

Render screens at a second, wider width.

### A measurement that flaps between runs is a browser question, never a suite question

Read `getComputedStyle` on the live element before re-running anything slow. One project spent six full runs on a focus ring that measured present on some runs and absent on others. The browser answered in seconds. `outline: none` leaves the width at the browser's default, so a computed-style check still reads a ring; `outline: 0` collapses it. The general rule is code-standard rule 40; the habit is to inspect first and re-run once to confirm.

### A screenshot is named for what it holds

Named after its first section, a full run's shot overwrote one component's baseline with a page of sixty. Every other baseline was then never rewritten and diffed clean for ever.

### A screenshot is taken where the state left the page

A clip in page coordinates starts at the document top, however far the run scrolled. So every scrolled frame's shot showed the hero and none of what was measured. The shots are the one place a person checks what no property comparison sees.

### A hidden element still takes its line if the component sets `display`

`[hidden]` is a UA rule, and any `display` in the component's own stylesheet outranks it. A component that renders a slot for a script to fill declares `&[hidden] { display: none }` beside it.

### A comparison asserts what a spec declares, and a variant that deliberately DROPS a property says none

The differ once emitted an effect assertion only where the spec carried one. A phone variant that dropped the desktop's shadow left the code's shadow uncompared. A fullscreen sheet then shipped with a card's elevation.

Where any sibling variant declares an effect on a layer, a variant without one owes an explicit "none". Two exceptions: states, since a focus ring may land as a shadow, and stroked layers, since a declared stroke legitimately occupies the box-shadow channel.

### A shared value resolved at compare time broke the moment renders ran at once

Token colours resolved through a module global set by the last render. Parallel light and dark measurements compared against whichever tier rendered last, giving 57 false differences. Anything the comparison resolves per tier or per viewport travels with the job. Never pass it through state a concurrent render can move.

## Waivers

### A waiver that compensates for a property the snapshot does not record is a place the check has stopped checking

Two such waivers stood in for a rotated layer's visible box, each deriving it differently and one wrongly. When a waiver's reason is arithmetic about how Figma stores something, record the thing instead.

### A content-owned waiver must survive the day the content coincides

Strict staleness read "the live list happens to match the frame today" as "this excuse died". The waiver went red on the date rollover that made the first feed group match, and would have flipped back the next day. A waiver may declare its difference content-owned, which excuses it from staleness. The reason still travels with every report.

### A waiver without a reason is a hidden difference

The reason is what the next reader needs. Require it in the story's shape, not in a convention.

### The baseline is accepted from a full run only

Accepting after a run scoped to one component or screen drops every other entry from the accepted set. The next full run then reports them all as new. Scope a run while iterating; never scope the run you accept.

## The runner

### Spawning a browser per render cost more than the render

About 1.4s of a 1.5s render was process startup. One browser with a tab per render cut the reference project's check by a third. Size a fan-out to what the pages fetch from. Against a single-threaded dev server, more than a couple of tabs queue on it, and the run gets slower.

### A cleanup trap under `set -e` stops at its first failing kill

The runner's exit trap killed the application it had started, then the static server, then the browser. When the application had already died, that first `kill` failed and `set -e` left the function. The server and the browser lived on: the next server could not bind, and a leftover browser answered on the DevTools port.

Every kill in a trap tolerates a process that is already gone. The server is killed by the port it holds as well as by its pid, as the browser already was.

### A route a test drives is a route in use

An orphan sweep that asked "who imports it, who links to it" deleted a page the driven suite restores its own deletions through. The suite broke on the next run. Unused means no importer, no link and no path in the driven suite. Grep the suite before removing a route.
