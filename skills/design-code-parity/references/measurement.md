# 5 · The measurement

How the run renders and reads each variant and screen: what it compares, the states, the render, and what the probe reads. [SKILL.md](../SKILL.md) links here.

## Contents

- [The run is the toolkit's](#the-run-is-the-toolkits)
- [What is compared](#what-is-compared)
- [And what each frame says](#and-what-each-frame-says)
- [And what each frame holds](#and-what-each-frame-holds)
- [The copy is asked where the page was written to match the frame](#the-copy-is-asked-where-the-page-was-written-to-match-the-frame)
- [Drive the states, and say which element takes each](#drive-the-states-and-say-which-element-takes-each)
- [The args the run asked for are the args the story got](#the-args-the-run-asked-for-are-the-args-the-story-got)
- [A layer mapped to null still has to resolve](#a-layer-mapped-to-null-still-has-to-resolve)
- [Two siblings may share a name](#two-siblings-may-share-a-name)
- [A mapping names a layer by its exact path, and nothing looser resolves](#a-mapping-names-a-layer-by-its-exact-path-and-nothing-looser-resolves)
- [Render inside the frame the design fixed](#render-inside-the-frame-the-design-fixed)
- [The story and the page load the SAME stylesheet, from one list](#the-story-and-the-page-load-the-same-stylesheet-from-one-list)
- [A legacy layer goes in a cascade layer](#a-legacy-layer-goes-in-a-cascade-layer)
- [Document the tokens where the components are, and generate the page](#document-the-tokens-where-the-components-are-and-generate-the-page)
- [Measure this page, not a page](#measure-this-page-not-a-page)
- [Let the render settle, and name what moved when it does not](#let-the-render-settle-and-name-what-moved-when-it-does-not)
- [Both tiers, and the environment pinned](#both-tiers-and-the-environment-pinned)
- [Measured twice, in one page](#measured-twice-in-one-page)
- [The renderer loads the site's fonts](#the-renderer-loads-the-sites-fonts)
- [What is read is the probe's](#what-is-read-is-the-probes)

## The run is the toolkit's

The run is `tools/parity/run.mjs --repo <dir>`. A project may keep a few-line `bin/parity` that execs it. `tools/project-check/init.mjs` does not write that file.

What the run does, in order:

1. It reads the project from the `parity` block of its `snapshot.config.json` and from its mapping files (`project.mjs`).
2. It runs every gate that needs no browser.
3. It builds and serves the story tool, or starts the app where the project says how (`session.mjs`).
4. It measures each rendered variant in each tier, judges it, and saves the verdict.

A mapping takes one of two forms. It is either axis declarations (`axes`), where a value may say which element a layer is where it draws it. Or it is a list of variants whose resting entries bring their state and disabled siblings, as the project's `parity.variants` describes its axes.

A screen measured on its route is driven into the state its frame draws (`page`). That covers fill, click, scroll and focus. A scroll goes in px, to the end, or to where the frame draws a layer, in the window or in the panel that scrolls.

What a project keeps is facts. A runner, a gate or a page harness of its own is the second copy toolkit-standard §D 1 forbids.

## What is compared

A headless browser renders every mapped variant and reads computed styles and boxes. Per layer, it compares:

- width and height, and padding;
- gap, or `justify-content` when the design's gap is *Auto*;
- radius, and strokes with their side and alignment;
- fills as resolved token values, and gradient stops;
- text style: family, size, weight, line height, letter spacing;
- effects, opacity and the focus ring;
- whether text was clipped.

A space-between layout keeps a leftover item spacing. It must not be read as a gap or as a missing binding.

Each layer is measured in each state the control has: rest, hover, focus, press, disabled.

Screens are measured against their frames the same way, on a canvas the width the frames were drawn at. There is at least one wider pass too, because a clip at exactly the canvas width passes.

## And what each frame says

This is code-standard rule 34. For every mapped layer, the run compares three more things.

**Where it sits in its parent**, on the axis the parent's layout does not already decide. A vertical stack positions children by height and gap, so x is the alignment. A row is the other way round.

**For an instance, its variant props as the element's attributes.** `Scroll=End` is `scroll="end"`, and `Home=True` is the `home` attribute. A checked control counts as `Selected`.

A link marked as ARIA marks one counts as `Selected` too. That is `aria-current` with any value but `false`, or `aria-selected="true"`. Without this, a navigation that marks its current page that way reads "unset" on every row.

**The design's copy**, where a story or map names the layer.

### The state a page is measured in

A page is measured in the state its frame declares:

- a scroll position;
- a viewport height;
- or a click driven the way a person would, for a state the page's own script owns (a disclosure open, a menu out).

A full-page comp is the page at its end. The page's own scripts keep reacting, and are never disabled.

Four corrections a designer once made by eye in one evening were each a prop, a position or a text. The snapshot already carried all of them.

## And what each frame holds

This is code-standard rule 31. For every mapped layer, the run lists the library instances inside it. It takes the outermost only, in order, with any label text that is not Figma's placeholder. It compares them with the component elements the code renders there.

Geometry alone once passed a nav bar whose links the library had dropped and whose toggle it had added. Every mapped layer still measured the same, and the user had to point at the drift by eye. The check exists so that never happens again.

When a snapshot lands, read its diff for anything parity cannot see before saying the build matches. That means instance swaps, overrides and icon changes.

## The copy is asked where the page was written to match the frame

**On a screen rendered from a story**, every word the frame draws must be on the page. Or it is named under `content`, with why. A text layer is said whole or line by line. A key may glob a family, such as `* 2026` for a feed's dates.

**Against the running product**, the copy is the mapping's `copy` layers. Real data is why a route has `appWaivers`.

One project's 54 screens went to their route over a pinned content set. Asking every word there would have reported 582 words of the day's feed against the frames' sample.

## Drive the states, and say which element takes each

Rest, Hover, Focus and Press are pseudo-classes, so the run forces them for the measurement. It uses the same "toggle element state" DevTools offers, through the debugging protocol. It never drives a pointer, which is flaky and cannot hold `:active` while a measurement runs.

### Force them as a pointer holds them

The function is `tools/shared/cdp.mjs` `forceState`.

- `:hover` and `:active` match the element and every ancestor, so a `.card:hover .title` rule fires.
- Focus is `:focus` and `:focus-visible` on the element.
- `:focus-within` goes on its ancestors, up to the section on a page of many, and never on its neighbours.

Forcing the one node left every rule keyed on an ancestor unfired. One project instead rewrote its state selectors into attributes. That reached only the one stylesheet and could not tell `:focus` from `:focus-visible`.

### Which element takes the state is per state, not per component

Focus belongs to the control. Hover belongs to whatever the pointer is actually over.

A Text input that forced hover on its `<input>` measured every Hover variant at its resting colour. Meanwhile the mapping's unused `state` selector sat there looking correct.

## The args the run asked for are the args the story got

Read the args back from the story runner, and fail naming any that did not arrive.

A runner that takes a variant's controls from the URL will sanitise them silently. It drops a control the story has not declared. It also drops a declared one whose inferred type it cannot match, which a union-typed prop always is. It then renders the default instead.

Four components once measured their "has a value" variant with an empty field for that reason. They stayed green, because nothing they assert about an empty field differs from a full one. A variant rendered as a different variant is the worst kind of pass.

## A layer mapped to null still has to resolve

A deliberate "not measured" and a mapping that points at a removed layer look identical if the null produces no document. The stale-mapping check then reports the honest one and stays quiet about the rotten one.

Emit a document for a null layer. It asserts nothing, but records whether the layer exists.

## Two siblings may share a name

A stepper draws `Icon button` twice, for minus and for plus. A layer index keyed on the path alone keeps the last. Then one of the two is measured twice and the other not at all.

Suffix the repeats (`#2`, `#3`) and let the mapping address them.

## A mapping names a layer by its exact path, and nothing looser resolves

The resolver is `tools/parity/layers.mjs`.

One project searched each segment of a path at any depth, shallowest first. Of its 2,016 resolutions, 1,799 used a path that was not the layer's own. The same name meant different layers in different frames.

A search like that rebinds in silence when a designer wraps a layer. An exact path goes absent instead, and the stale-mapping gate says so.

### Where paths differ

- Where a layer sits at a different path in different variants, each variant maps it where it is drawn.
- A screen frame that holds one page instance roots its paths in that instance (`root`). Frames that share a base then share their paths.

### Moving a project to exact paths

Use a codemod that proves, per path and per tree, that the old search and the exact path name the same node. It lists the names it cannot prove, for a person to map. Two names that found one layer become one mapping.

## Render inside the frame the design fixed

A component whose Figma root carries a FIXED width is drawn at that width. Where the height is fixed as well, it is drawn at that height too. Every FILL child in its tree is measured against it.

Rendered in whatever canvas the story runner provides, all those numbers are wrong. None of them are the code's fault.

A FILL root takes the same treatment for the same reason. The width is its parent's decision, but the file records the one it was given. Every child inside is measured against that number.

Only a hugging root takes the canvas, as it does on a page. Take the width from the variant's own sizing, so nothing is typed twice.

## The story and the page load the SAME stylesheet, from one list

A story runner and an application are two hosts for the same components. Each needs the token layers, the faces and the base. Written as two lists, they drift, and the drift is invisible from either side.

The reference project's Storybook had all three, while the app had none and a CSS framework on top. A login screen measured green in a story and shipped with a text field three times too tall.

Use one entry point, imported by both. **A measurement of something other than what ships is worth nothing.** When a page and its story disagree, suspect the stylesheet set before the component.

## A legacy layer goes in a cascade layer

Rebuilding an application screen by screen means old element styles (`input`, `button`, `table`) live beside the new components for months.

An element selector is not automatically weaker than a class. `input:not([type=…])` five times over is specificity (0,5,1), and beats `.field__control`.

Put the old base in `@layer legacy`, and leave the design system unlayered. An unlayered style beats every layered one whatever the specificity. Components then win without out-specifying anything, and nobody keeps score.

Do not reach for an escape hatch instead. That invites the second bug: `all: revert-layer` on `button.<component-class>` reverts to the user-agent style. It strips every property the component set.

## Document the tokens where the components are, and generate the page

A design system's colour, type, spacing and effect reference belongs beside its components, in the same tool. It is read from the same snapshot the stylesheets are generated from. A page typed by hand is wrong within a month.

- Group a colour's name by its path. `Colour/Text/Neutral/strong` sits beside `…/medium`, so 160 loose swatches become 30 legible ramps.
- Show every mode, not whichever the theme toolbar is on.
- Put the design's own name *and* the generated custom property on every row. One is for talking to the designer, the other for typing into a stylesheet.
- Use the documentation tool's own blocks where it has them. A swatch strip is a shape every reader already knows.

Those blocks may need the docs page's context rather than a bare story canvas.

## Measure this page, not a page

A navigation command returns before the new document is committed. A probe for "has the story rendered" then answers yes against the one still on screen. The run measures the previous variant under this variant's name.

Check the document's own address as well as its content before measuring. The race hides behind a fixed sleep that is long enough most of the time. That is the worst way for a race to behave.

## Let the render settle, and name what moved when it does not

Before the first pass, wait for three things:

1. the fonts to be ready;
2. the pictures the browser is loading to have decoded;
3. two animation frames.

Wait only on pictures it is loading. That is an eager one, or a lazy one within Chrome's fast-connection reach of 1,250 px below the fold.

A settle that waited on lazy pictures the browser never loads ran to its cap twice a render. The documented slow-connection reach of 2,500 px still did, on a local server. So a number taken from documentation is held to a measured run before it ships.

A component whose illustration had not decoded failed the twice-measured rule on nothing but its own picture.

When two passes do disagree, print the property and both values. "A measurement did not repeat" sends the reader to the component. But `img height: 0 → 120` names the cause outright.

## Both tiers, and the environment pinned

The colour scheme is stamped on the rendered page and asserted afterwards, never inherited. So is anything else the host decides for a headless run: locale, time zone, viewport, fonts.

Headless Chrome takes `prefers-color-scheme` from the machine. An unstamped check measures whichever tier the developer's OS is in, and never the other one.

Both tiers ship, so both are measured. A run says which it measured (code-standard rule 35).

## Measured twice, in one page

Each render measures every layer twice, a fifth of a second apart. A layer that reads differently the second time fails by name, and nothing from that run counts.

Otherwise an animation sampled mid-frame, a font still loading or a random id in a selector reads as a one-off pass or failure. A ruler that gives two answers is not a ruler.

The failure is refused rather than retried, so a flaky component gets fixed instead of re-run.

It is two passes in one page, not two page loads. The guarantee is the same, and the render saved pays for the second colour tier.

## The renderer loads the site's fonts

Fonts are self-hosted, and the renderer must load the same files the site does. A renderer that read from `file://` and rewrote the font path measured a whole page in the fallback face. It passed, because the fallback was close enough.

A page composed for the run holds many components' fragments, one section each. It is served at the site's own origin (`hosts.mjs` `fragments`). Its stylesheet, fonts and images then load over http, as the site's pages do.

## What is read is the probe's

The probe is `tools/parity/probe.mjs`. It reads in CSS's own names. Where the browser's answer is not the design's question, it answers the question.

| Value | What the probe reads |
|---|---|
| `width`, `height` | The border box, as Figma's w and h are. The computed width is the content box on a content-box element, and `auto` on an inline one. |
| Box | Read before transforms. Otherwise a spinner's turning rect differs between the two passes. |
| A gap nobody set | `0px`, not `normal`. |
| Focus ring | Read as drawn: the outline where it has a style, else a spread-only shadow. |
| Ring channels | `-ring-width`, `-ring-offset` and `-ring-color`, so a ring is asserted as a ring, never as a box of its own. |
| Positions | Document-relative: the rect plus the scroll. |

Viewport-relative tops once moved 2,582 values when an autofocused title scrolled a shared page.

A baseline reads a fixed core record beside whatever the plan asked.
