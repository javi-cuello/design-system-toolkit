# Gates 1–15

The first fifteen gates of the loop, each with its rule and why it exists. [SKILL.md](../SKILL.md) links here from its gates table.

## Contents

- [How the gates run](#how-the-gates-run)
- [Gate 1 · Snapshot at the latest release](#gate-1--snapshot-at-the-latest-release)
- [Gate 2 · Built or in the backlog](#gate-2--built-or-in-the-backlog)
- [Gate 3 · Every variant measured or waived](#gate-3--every-variant-measured-or-waived)
- [Gate 4 · Every code value mapped or `codeOnly`](#gate-4--every-code-value-mapped-or-codeonly)
- [Gate 5 · No value the comparison cannot name](#gate-5--no-value-the-comparison-cannot-name)
- [Gate 6 · Stale waivers and the waiver's shape](#gate-6--stale-waivers-and-the-waivers-shape)
- [Gate 7 · Generated files match what is committed](#gate-7--generated-files-match-what-is-committed)
- [Gate 8 · Coverage is total](#gate-8--coverage-is-total)
- [Gate 9 · Ready for dev, both ways](#gate-9--ready-for-dev-both-ways)
- [Gate 10 · Every recorded property compared or excused](#gate-10--every-recorded-property-compared-or-excused)
- [Gate 11 · A mapped layer owes an assertion](#gate-11--a-mapped-layer-owes-an-assertion)
- [Gate 12 · The measurement baseline](#gate-12--the-measurement-baseline)
- [Gate 13 · Component variants covered like screens](#gate-13--component-variants-covered-like-screens)
- [Gate 14 · What a layout says about its children](#gate-14--what-a-layout-says-about-its-children)
- [Gate 15 · The ruler must parse](#gate-15--the-ruler-must-parse)

## How the gates run

The gates are the toolkit's, in `tools/parity/gates.mjs`. Gates 3–5 enforce code-standard rule 33. The run runs them all, and so does the project's single pre-push check.

For the gates that need no browser, run:

```sh
node tools/parity/gates.mjs --repo <dir>
```

## Gate 1 · Snapshot at the latest release

The snapshot is at the latest release of both files.

## Gate 2 · Built or in the backlog

Every library component and icon is built or in the backlog.

## Gate 3 · Every variant measured or waived

Every variant the library declares for a built component is measured by some story or waived by name. A story lists what it measures. Nothing else may be read as covered.

The gate has to be written. Until it is, the run has no opinion about the variants nobody mentioned (ninety-one of them, on one Button). Prefer axis declarations (part 4), so the list cannot fall behind the file.

## Gate 4 · Every code value mapped or `codeOnly`

This is the other direction. Every value a component's controls offer in code is mapped by some story to a Figma variant. Otherwise it is waived under `codeOnly` with a reason.

A `tint` the library never drew is code ahead of the design. It is a question for the designer, not a free pass. Asked once on a finished build, this gate found four.

## Gate 5 · No value the comparison cannot name

No value the comparison cannot name passes. That means a hex fill or stroke, a literal text style or effect, or an unknown colour style. It also means an unbound padding, gap, radius, stroke or opacity. Each is reported, with the same waiver route, and never skipped.

## Gate 6 · Stale waivers and the waiver's shape

In [waivers.md](waivers.md#gate-6--stale-waivers-and-the-waivers-shape), with the waiver model.

## Gate 7 · Generated files match what is committed

Generated tokens and compiled CSS match what is committed.

## Gate 8 · Coverage is total

Every layer a screen composes and every element a component renders is measured. Otherwise the check fails naming it.

### An honest denominator

The denominator is made honest before the gate is made strict.

- **A library instance is one layer of a screen.** Component parity measures its insides in every variant, and the screen owns its placement. The exception is what the page puts in its slots.
- **An element is credited, not mapped, when a measured layer already covers it.** One case is an element sharing a measured relative's exact box. An example is a wrapper hugging the native control that carries the box model, which can live on only one of them.
- **A nested component is credited too**, when a measured layer's children comparison records it and its own story measures it.
- **What the design never draws is not counted**: an icon's vector innards, an accessibility-only element, a `display: contents` wrapper.

### A slot's contents are the screen's

Stopping at the instance hides a slot's contents from both halves at once. The component's own check renders the slot empty, so nothing there is compared. The screen counts the instance as one layer, so nothing there is mapped.

So the walk carries the owning instance rather than stopping.

- A layer below a slot is the screen's own, and is mapped like any other.
- A slot is the node Figma made one (`type: 'SLOT'`), whatever it is called. Never test the name. A test on "Content slot" walked other slots as their instance's chrome, and nobody counted what they held.
- Everything a component draws for itself is credited to the instance holding it. That also lets a block in one slot stand for its cousin in a second.

On the reference project the denominator went 1756 → 2933 layers. The 1177 layers that had been invisible held three real differences. Coverage below total is the loop at its blindest when a new design lands, which is when it must be loudest.

### A layer left out is named, with its reason

Silence is not an option. A decision nobody wrote down cannot be told from a layer nobody noticed.

- The gate takes the frame's own layers. The walk counts a library instance as one layer and descends only into what the page placed in its slots.
- It fails on any layer the mapping neither names nor excuses.
- An excuse sits beside the mapping, in the same file, saying why. Examples are a state the product deliberately does not draw, or a question open with the designer.
- An excuse goes stale like a waiver. An excuse for a layer the frame no longer draws fails.

**Prove it red before trusting it.** Delete one mapped layer from one mapping, and watch the frames that draw it fail by name. A coverage gate never seen red is a number, not a gate. One project that had just mapped every frame found 89 layers no mapping named, behind a green run.

## Gate 9 · Ready for dev, both ways

The loop takes only the frames the designer marked **Ready for dev**. A screens file holds work in progress beside work that is ready, so what the file offers is what the file marks.

- Ready for dev is Figma's own status. The plugin API exposes it on any frame directly under a page or section.
- Marking it saves a named version as a side effect: one gesture, both triggers.
- The gate runs both ways. A marked frame no map names is a screen nobody measures, and fails.
- A mapped screen whose frame has gone, unmarked or renamed, fails too. Otherwise a working check vanishes quietly.
- Prefer the file's own status over a name prefix or a repo-side draft list. A forgotten prefix is silent, while the status is visible where the designer works.

## Gate 10 · Every recorded property compared or excused

A property the snapshot records is compared, or says why not. Every key that appears in any spec is named in the schema's declared contract. The contract names the adapter rule that consumes it, or the reason no browser can be asked about it.

### The declaration is data

- The declaration is data beside the adapter, never a regex over the comparison's source. Grepping the runner credited any property its text happened to mention.
- Staleness applies only to excuses. A capability key no layer uses yet is the adapter ready for a future design, and is not flagged.
- An excuse is stale only when no registered project's snapshot records its key (`staleAcross`). One project's corpus cannot speak for another's.
- A new key from a new plugin release fails this gate until someone decides which it is.
- **The gate is the skill's, the declaration the project's.** `tools/parity/spec-keys.mjs` walks every component variant and screen tree, nested values included. It holds the project's declaration to one closed list of reasons.

The reference projects' defects often had one shape: a property recorded and never read. Rotation, an instance swap, `textStyle` and `effects` each sat in the snapshot unread. A text style or an effect each takes about two dozen lines to translate.

"Not yet translated" is a debt with a due date, not a resting state. A property the file carries and the eye can see is the first thing to translate. A text style is family, size, weight, line height and letter spacing. An effect is a box-shadow, compared layer by layer, with alpha quantised to the 1/255 a browser stores.

### The reasons are a closed list

None of the reasons means later. A gate that accepts a sentence accepts any sentence, and "not yet" is the one people write. So an excuse takes a reason code from this fixed set:

| Code | Means |
|---|---|
| `identity` | A name or a type, nothing to measure |
| `elsewhere` | Measured by another part of the loop |
| `carried` | Consumed by another key's rule |
| `notDrawn` | The design does not render it |
| `unobservable` | No property a browser reports corresponds |

A key that fits none of them is a key whose rule has not been written. That is a red check until it is.

### Two more checks finish the job

- **A declared rule that changes nothing is not a rule** (`unreadRules`). For every key the corpus carries, remove it from each layer that carries it and re-run the adapter. If the assertions never move, the rule is prose beside code that ignores it.
- **Try every carrier, not the first.** A gap is genuinely inert on a distributed row, and a stroke flag on a layer with no stroke. A one-sample check accuses working rules.
- **A dormant rule owes a fixture.** A rule waiting on something the library does not do yet is capability, not debt. It looks exactly like an unwired rule, so it is declared dormant and a fixture stands in for the corpus.

## Gate 11 · A mapped layer owes an assertion

"Measured" means assertions ran, not that a name appears in a map. Report and fail on any layer whose Figma node and selector both resolved and about which nothing was compared. Otherwise a missing parent or an untouched branch reads as agreement.

Coverage says what it credits. A layer credited to a mapped sibling is the same layer only if it holds the same thing. An example is the list rule that puts seven cards behind one selector.

- Compare credited siblings by child *type*, since a swapped icon renames a child without changing the structure.
- Never credit by name alone. That once counted a whole unrelated subtree as measured.
- Print the credits; a percentage hides them.

## Gate 12 · The measurement baseline

Nothing moves unmeant. Every run serialises what it measured: every part of every variant and screen, both tiers. It diffs that against the last run a person *accepted*, in exact numbers, with zero tolerance. Accepting is the same gesture that keeps the screenshots.

### What it answers

This is the Chromatic accept/deny model rebuilt on data. It answers "did anything change when nobody meant it to". It catches breaking one thing while fixing another within a single run. It needs no design file, so it is the one net that also governs what no frame draws.

### Turning it on

- Two consecutive runs must measure byte-identical before the gate is turned on. If they do not, fix the nondeterminism; never add a tolerance.
- The volatile fields are a stated choice in the tool, never a threshold. DOM join indices are not measurements.
- On a live page, the text, children, attributes and vertical extent belong to the content. A new feed item lengthens the list and shifts everything below it.
- So screens keep styling and horizontal geometry under the net. Components, with fixed sample content, are compared whole.

### Trusting it

- Prove it in both directions. A mutated style must fire, naming the layer and both values. A mutated content field must stay quiet.
- Review its diff for the unexpected, never only to confirm the expected. One accept of 460 "meant" rows held two wrong ones, a clip that had silently stopped applying.

### The tool

**The comparison is `tools/parity/baseline.mjs`**: dump, compare, accept, and the refusal to accept a scoped run. A project passes its suites and its volatile and content-sized fields. Only the project knows which of its numbers answer to live data.

## Gate 13 · Component variants covered like screens

A component's variants are asked what a screen's frames are asked. Gate 8 counts a screen's layers. Its mirror walks every layer of every variant a story measures. It fails on any layer that matches none of these:

- a mapped name resolves it;
- an explicit null addresses it;
- a same-name, same-parent, same-shape representative stands for it.

Without it, parity compares only the layers a story maps. On the reference project a variant carried a hidden date, a 1px divider and an unasserted label face, unseen.

### Credits

Credits mirror the DOM-side coverage.

- A state variant inherits its Rest sibling's mapping overrides.
- An auto-mapped focus ring counts.
- A nested library instance belongs to its own component's story.

### The first sweep teaches rulings

Expect the first sweep to teach translation rulings, not only mappings.

- Structural wrappers the target renders as siblings become explicit nulls.
- A placeholder's text lives on a pseudo-element the probe must learn to read.
- Any tolerance in a comparator, such as a stroke width read at ±1, is a place where newly asserted layers pass vacuously. Name those rather than waive them.

## Gate 14 · What a layout says about its children

An auto-layout frame states a direction, an alignment on each axis, a wrap and a clip. A text run states an alignment of its own. A loop that measures only boxes measures where things ended up, not what the design asked for.

The two agree until they do not. A header drawn as a centred column and built as a centred row renders identically at the canvas width. On a real screen the row puts the whole band against the left edge.

Translating all of it at once, on a library that renders correctly, produced about 2,500 differences. Most had nothing to observe, which gives the rules below. Each is an adapter rule with a fixture, never a waiver. A waiver here would be a hundred rows deep and would hide the four real ones.

### Where there is nothing to observe

- **An alignment is a choice about free space, so with none there is nothing to observe**. Figma records CENTER on a 16px box holding a 16px tick, and a browser reports `normal`.
- Compute free space from the spec: the frame, less its padding, less what its children and gaps take. Never waive it component by component.
- On the counter axis, free space is per child, because the alignment shows on the shorter ones.
- **Direction is unobservable below two in-flow children**. One child sits in the same place either way, and an absolutely positioned focus ring is not in the flow.
- **A clip is only a clip when a child leaves the box**, which the spec's own numbers settle. Gate 19 adds the rounded-corner case.
- **Text hugging its own width has no room to align in**. That is why Figma records LEFT on every such run while the code centres it with no visible effect.

### Ask the right question

- A gap is spacing along the layout: `column-gap` in a row, `row-gap` in a column. Asserting `row-gap` on a row checks a property that spaces nothing.
- *Which way the children run* and *where they sit* are read off the children's boxes, on the design's own axis. They are not read off `flex-direction` and `align-items`.
- A block container stacks its children as a flex column does.
- A grid of three column tracks runs its children in a row, whatever its auto-flow.
- A column centred by `margin-inline: auto` is centred, whatever `align-items` says.
- A one-child row justified to its end is the end-aligned column the design drew.
- The computed value answers only where the boxes cannot: fewer than two children, no free space, a baseline, or children wrapped onto several lines.

## Gate 15 · The ruler must parse

The probe that runs in the page is JavaScript inside a string. One stray backtick in a comment ended the template literal, and every variant reported hundreds of mismatches. That reads exactly like the code disagreeing with the design.

Parse the probe in the unit tests, before any browser starts. It costs milliseconds and says the real thing. More generally, a check's own instrument gets a test. A broken instrument's report cannot be told from a report of wrong work.
