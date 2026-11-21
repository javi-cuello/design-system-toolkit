# Gates 16–31

The later gates of the loop, each with its rule and why it exists. [SKILL.md](../SKILL.md) links here from its gates table.

## Contents

- [Gate 16 · Clipped text](#gate-16--clipped-text)
- [Gate 17 · The DOM stops moving](#gate-17--the-dom-stops-moving)
- [Gate 18 · Overrides inside a placed instance](#gate-18--overrides-inside-a-placed-instance)
- [Gate 19 · A rounded clip's corners](#gate-19--a-rounded-clips-corners)
- [Gate 20 · A frame-height canvas hides shrinking](#gate-20--a-frame-height-canvas-hides-shrinking)
- [Gate 21 · Drive the product](#gate-21--drive-the-product)
- [Gate 22 · Stylesheet rules a measurement cannot express](#gate-22--stylesheet-rules-a-measurement-cannot-express)
- [Gate 23 · The check is the second reader](#gate-23--the-check-is-the-second-reader)
- [Gate 24 · An unreachable screen is moved, not excused](#gate-24--an-unreachable-screen-is-moved-not-excused)
- [Gate 25 · Measure the story and the route](#gate-25--measure-the-story-and-the-route)
- [Gate 26 · The gate's server and readiness probe](#gate-26--the-gates-server-and-readiness-probe)
- [Gate 27 · Props changed on nested instances](#gate-27--props-changed-on-nested-instances)
- [Gate 28 · Workers in windows, the build reused](#gate-28--workers-in-windows-the-build-reused)
- [Gate 29 · One library copy per component](#gate-29--one-library-copy-per-component)
- [Gate 30 · A path in a list names a layer](#gate-30--a-path-in-a-list-names-a-layer)
- [Gate 31 · Translations, stated once](#gate-31--translations-stated-once)

## Gate 16 · Clipped text

Ask every mapped layer whether it cuts the text it holds. No computed style and no Figma value says "this is clipped". So a loop built only from assertions cannot see the defect a designer sees first.

### The probe

- An element that clips is a text control, or anything with a hidden or scrolling overflow.
- It cuts the glyphs when its content box is shorter than its font's own line box.
- It also cuts them when its box leaves its nearest clipping ancestor.
- Read the font's natural line box from canvas metrics. Never append a probe element: mutating the page under a measurement makes its two passes disagree.
- The finding is not an assertion and takes no Figma value. It goes through the same waiver route and fails the same check.

### A line height below the font's own

A design's line height below the font's own is a layout box in Figma and a clipping box in a browser. The file paints the glyphs outside its 16px box and clips nothing. An `<input>` clips to its content box and cuts the descenders off every value.

The code takes the font's line box and gives the difference back as margin, so the field keeps the drawn height. The layer's own height and line height are then waived, with the question put to the designer. A line height at or above the font's own would let the file say what every browser will do.

## Gate 17 · The DOM stops moving

The settle step waits for fonts and images, and must also wait for the tree to stop being replaced. A story that re-renders between the two passes reports "a measurement did not repeat". The second pass looked for an element that was no longer the one the first pass measured. The tell is that one of the two values is a null.

- Watch the root with a mutation observer, and go when it has been quiet for a beat, capped.
- Kill stale headless browsers from earlier runs at the start of a run. They compete for the CPU the render needs and cause the same symptom.
- A probe that appends a measuring span to the page causes it directly (gate 16).

## Gate 18 · Overrides inside a placed instance

A frame that changes a value inside a component it places has said something, and the mapping owes it a layer. A screen maps a library instance as one layer, because the component's own story measures its insides. An override inside it is then drawn by no story and named by no screen layer.

### The gate

For every instance in a spec, resolve the component this repo builds from its `instanceOf`. Compare the instance's own visual fields against that component's:

- fills, strokes, and the strokes' sides and alignment;
- effects, radius and opacity;
- text style, line height and text alignment.

A difference must have its layer mapped, or a reason.

### Two cautions

- **Resolve the library spec; never read the compact form on disk**. A variant stored as a delta, read as a flat node, makes every unstated field look overridden.
- **An instance the repo has no spec for is skipped, not guessed.** An example is an icon that ships as an SVG. A recolour there is caught at the parent whose fill it belongs to, not on the glyph.

On the reference project a designer first found four form sections, each tinted in the file, all drawn purple. The gate found a second case the same hour, then stayed silent across twenty-seven screens.

## Gate 19 · A rounded clip's corners

A rounded clipping frame observes its clip where something paints into the corner. Gate 14's "a clip is only a clip when a child leaves the box" holds for a square frame. On a rounded one, a square child paints outside the corner with every child inside the box.

Assert the clip when all three hold:

- the frame is rounded and some child has a fill of its own;
- that child reaches the parent's edge;
- that child is rounded less than the parent.

All three are load-bearing. Without the fill it fires on every padded frame, and without the edge on every inset child. Without the radius it fires on a button's own content frame, which clips nothing visible. With none of them, it put 496 differences on a library that renders correctly.

## Gate 20 · A frame-height canvas hides shrinking

Screens are measured at the viewport their frame was drawn in (code-standard rule 35). A frame is as tall as its content, so every flex child gets the height it asks for. No `flex-shrink` ever bites.

A real window is shorter, and there the same tree squeezes. On the reference project a modal header shrank to nothing in a short window, behind a green run.

- Know that this is the class the loop is blind to.
- Look at a long page at a real window height before calling it done. A second, shorter viewport is the obvious answer, not the cheap one.
- Refuse the shape that causes it. A header or footer that must keep its height says so, and a review looks for the ones that do not.

## Gate 21 · Drive the product

A page at rest is a fraction of what ships. A story in its resting state cannot see what exists only after a press. Examples are a menu opening in the wrong place, a carousel of transparent pictures, or a select that opens and shuts at once.

So keep a second, small suite that **drives** the product: open the thing, press the control, read what happened.

- Run it beside the parity check, not inside it. It needs the application and its data, not a story, and answers a different question.
- A handful of paths can cover every interaction the design implies; eight did on the reference project.
- Where a frame draws a state the page reaches by a press, that frame is the parity check's business.
- Where the design draws no frame, this suite is the only thing looking.
- Its probes meet the mapping's bar. An exception in the page is the path's failure, never an undefined to read around. Use a helper that throws on the page's exception.

## Gate 22 · Stylesheet rules a measurement cannot express

A comparison reads computed styles on the elements a mapping names, so some defects are invisible to it by construction:

- a page rule that loses silently renders the component's own value, which is what the check compares against;
- an `outline: none` measures a ring that is never painted;
- an unlayered file is correct until another file loads before it;
- a literal typed where a token belongs measures the same as the token.

These gates are the toolkit's `tools/css-lint`, and its README's table names each. A project runs it beside the loop and writes none of its own:

```sh
node tools/css-lint/check.mjs --repo <dir>
```

A gate it lacks is added there, proven by breaking it. The six such gates:

| Gate | In css-lint |
|---|---|
| Every sheet layered | Yes |
| No page rule at a component's selector | Not yet |
| No `!important` outside a reduced-motion block | Yes |
| No style whose "off" leaves a value behind | Not yet |
| Every literal a token or a reason | Yes |
| No selector naming another component | Yes |

Each one not yet in css-lint is added there when a project next needs it, never written in the project.

## Gate 23 · The check is the second reader

The check is the second reader, never the first. Defects that reached a person's eye all had a green run over them. Each lay outside what a mapping named, the state a story rendered, or the size a frame was drawn.

So a build is not done when the run is green. It is done when someone has opened the product at a real window size, pressed what it draws, and looked. Write that into the project's own definition of done, because a green check makes the looking feel unnecessary.

## Gate 24 · An unreachable screen is moved, not excused

The backlog is the loop's honest escape hatch. It is also where a plausible sentence makes a gap invisible for good. On the reference project four Ready-for-dev frames were excused because their card lived in a route. That was a file in the wrong folder, and the card was then rebuilt wrong.

- A **screen** may be excused only by naming a capability the runner genuinely lacks.
- The capability comes from a **closed list** the toolkit keeps: `gates.mjs` `RUNNER_CANNOT`, an interaction the page state cannot drive.
- Scroll position left the list once the runner learnt to scroll.
- A sentence is refused, and so is any reason that mentions where the code lives. The failure message carries the fix.
- Adding to the list is a decision, not a typing job. It says the loop cannot see a whole class of thing.

The wider rule: **when a check cannot see something, make it able to see it; do not write down why it cannot**. An excuse is never revisited, and whoever builds next fills its gap from memory.

## Gate 25 · Measure the story and the route

The story is the harness; the route is the product. A story hands the component a fixture written to match the frame. A green run then compares the design to a copy of itself, and the page a person opens is never checked.

- A screen's mapping names its route beside its story.
- The run measures the live page too, signed in with a session the repo mints, at the frame's viewport.
- It uses the same spec, the same layers and the same waivers.
- The story remains for the states a route cannot reach without a press.
- A run that cannot get the application up does not skip that half. It starts the application itself, as a test suite creates its own database, and fails if it cannot.

On the reference project a page read "Contacts (148)" where the frame says "121 contacts", behind tens of thousands of green assertions. A printed note saying routes were not measured scrolled past.

## Gate 26 · The gate's server and readiness probe

The gate's own server and its readiness probe are part of the gate. Every variant is a reload of the whole preview with the cache off, and the static server must take that. A stock file server that resets connections under load makes failures move between variants. That reads as flakiness and is not.

Three things close it:

- a server that holds under the load;
- a runner that records every failed request, exception and console error since the last navigation. It prints them, with the page's own state, under a variant that did not render;
- a readiness probe that waits for **this** variant. It compares the story's id, its globals and its args one by one. It also waits for the story tool's own rendered signal.

Never compare the query as a string, because the story tool rewrites its own address once loaded. A probe matching the id alone is answered by the previous variant's document.

**A run with random failures that pass alone is this shape. Read what the browser said before touching a mapping**.

## Gate 27 · Props changed on nested instances

A prop the frame changes on an instance inside the one it places is an override too. Gate 18 reads a placed instance's own visual fields and stops there. A label's Indicator turned off one level in was invisible to it, and "Optional" shipped under every label.

So the nested instances are walked beside the library's own, by name.

- A prop that differs is a finding on that inner layer.
- That covers a switch or a variant (`Selected`, `Icon`, `Role`, `Feedback`, `Disabled`).
- It never covers a text prop or a glyph swap, which are content the copy gate reads.
- It is answered as gate 18 is: map the inner layer, which puts its box under the ruler, or give a reason.
- A reason may glob a family with `*`, as the live-data waivers do.

## Gate 28 · Workers in windows, the build reused

A worker measures in a window, never a tab. A headless browser backgrounds every tab but a window's active one. A backgrounded tab never runs `requestAnimationFrame`, which the settle step waits on, so tab workers measured nothing.

- Each worker gets a window of its own (`Target.createTarget` with `newWindow`).
- The browser cache stays on. The profile is fresh per run, so a stale build cannot be in it; with the cache off, every navigation re-fetched the whole preview.
- The story build is reused while nothing it is built from has changed.
- A page's own focus is blurred before measuring unless the variant is the focus state, because a worker's window is frontmost and draws the ring.

On the reference project the full gate went from thirteen minutes to three.

## Gate 29 · One library copy per component

A frame reaches each library component through one copy. A file keeps its own copy of each library component it imports, and accepting a library update moves the copy its main components use. An instance swapped to another variant inside a screen template can keep the old copy. The update never reaches it, while the library, its snapshot and its component run all say the fix landed.

The snapshot records each instance's library key and the file's id. The gate (`staleCopies`) fails on a key under two ids anywhere in the stored screens, and names both. That holds mapped or not, and outside a map's root too.

To fix it, swap the old copy's instances in the template to the current copy, then snapshot again.

## Gate 30 · A path in a list names a layer

A path in a list names a layer, or it is a finding. A map's `copy`, `runtime` and `children` lists act only on the mapped layers they name. A path left on a renamed layer's old name, or on a layer no selector maps, asserts nothing, and the run stays green.

- The waivers gate (6) names each such path that no frame or variant draws, or that no selector maps.
- Respell the path, map the layer, or delete the path.
- `children: true` is a switch, not a list.
- A screen inheriting its base's `runtime` for a layer it maps to null is a finding too.

## Gate 31 · Translations, stated once

In [waivers.md](waivers.md#gate-31--a-conversion-rule-is-a-translation-stated-once), with the waiver model.
