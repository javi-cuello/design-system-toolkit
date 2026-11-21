# What the scripts decide, and why

The rules behind each part of a table. The scripts implement them; this page says why, so a run can judge their output. [SKILL.md](../SKILL.md) principle 1 points here.

## Contents

- [One reader](#one-reader)
- [Rows](#rows)
- [Types and options](#types-and-options)
- [Cells and donor rows](#cells-and-donor-rows)
- [Notes](#notes)
- [Title and label](#title-and-label)
- [Which component a page is about](#which-component-a-page-is-about)
- [Empty state](#empty-state)

## One reader

The table is the snapshot's own reader, run live rather than read from the store. Figma is where a property changes first, and the table lives in the same file. So the table is about the present (toolkit-standard §D 5, a maintainer ruling).

| Stage | Where it lives |
|---|---|
| The walk | the snapshot plugin's walk, run on the open file |
| The record | `store.cjs` `recordOf` |
| The rows | `contract-rows.mjs` `rowsOf`, the reader the docs site runs over the stored snapshot |

The docs site lists `propsOf` in `rowsOf`'s order. One reader and one set of rules serve both, the source differing only in when the file was read (a maintainer ruling).

The point of mirroring is determinism: the same file must always produce the same tables. Where two sources disagree, one is named authoritative here, once, never chosen per case at generation time. Where Figma reports nothing, the resulting convention is labelled as a convention. A table that faithfully reflects an odd component is doing its job.

## Rows

Rows come from `contract-rows.mjs`, in this order:

1. Variant axes, in declared order: an enum, or a boolean the contract marks `axis`.
2. Everything else, in layer order: the place of the first part each prop drives in the contract's anatomy.
3. Properties that drive no part, last.

A prop drives a part through `shows`, `sets`, `swaps` or a slot's part. The anatomy includes the parts the variant layers add.

Properties belonging to nested components are excluded. The contract holds the set's own, and the table documents what a consumer can set on *this* component.

## Types and options

The types are `Variant`, `Boolean`, `Editable string`, `Component swap` and `Slot`.

Options are Figma's, verbatim. An enum's come from its `figmaValues`. A False/True axis's come from the spec beside the contract, until the contract carries their order ([review-and-limits.md](review-and-limits.md), Known limits).

Options are never reordered: not to bring the default forward, not to normalise True/False axes, and not to match a sibling component. The order variants sit in on the canvas is a *different* value that sometimes disagrees. Neither is more authoritative, so `audit()` reports a disagreement as a hygiene finding, and it never changes the table.

`(default)` marks True/False axes and booleans only. Booleans have no option list in Figma at all. So listing them False then True is the one convention in the skill, and it exists because the data does not.

## Cells and donor rows

A cell often carries more than its text, such as a display variant or a swatch toggle. Rows are grown by cloning an existing row, so anything set by hand on the donor row would spread down the table. Every cell the script writes is reset to the cell component's own defaults, so a property row always renders as plain text. The defaults are read from the component, not listed here.

Only the outermost cells in a row are treated as columns. A cell can itself contain an instance matching the same description, a badge or an icon with a label. Counting that as one more column would shift every value one place along.

A page whose table is in its empty state has no row to clone. Switching it to the filled state yields an empty slot rather than a template row. Such a page borrows a donor row from the first table elsewhere in the file that has one. It never quietly produces a filled table with nothing in it.

## Notes

Notes are derived from the contract, never from property names. Names mislead often enough to matter: `Placeholder text` is governed by `value=false`. A `Label text` may be governed by `type=default` with nothing in the name to say so.

Two signals combine, both read off the part the prop drives:

- the innermost other boolean whose `shows` holds that part or an ancestor, such as `left icon=true`
- the contract's `when` on the part or its nearest ancestor. It gives the props' values the part is drawn under, exactly, such as `size=small`. Several values are joined by `or`.

Conditions are capped at two.

`contract-rows.mjs` returns evidence with each note: the parts, the gating boolean, the `when`. So a derived condition can be checked rather than trusted. Report derived notes when summarising. A condition the contract's `when` does not write (one that is not exact) is not noted.

The notes engine's tie-breaks are a pure function, so they are reproducible: prefer non-default, cap at two, fall back to `-`. The thresholds were chosen, not read off the file.

## Title and label

The title is the component name exactly, prefixes and slashes intact, except a leading status marker. So `🚧 Time input` is titled `Time input`, because the marker is a status rather than part of the name (figma-standard rule 13). The audit reports a title that still carries one.

The marker is `statusMarker` in the table config, set with `PT.setConfig({ statusMarker })` from the library's settings. It is kept across a re-profile. With none set, nothing is stripped.

The label boolean marks a table as documenting a part. It follows containment, not position: a component is labelled because something else on the page contains it, not because it came second in a list. A page holding a sibling family gets no labels at all, since peers are not parts of one another. Position is the fallback only when the containment scan could not finish.

## Which component a page is about

This is a judgement, and files express it differently. So it uses two signals that belong to Figma, not to any one file's naming habits:

- **The page name**, matched against the component name in full, or followed by a separator. Any non-alphanumeric character counts as a separator, since files namespace differently: `Top bar / Modal`, `Dropdown menu - Multiple selection`, `Sidebar (Primary)`.
- **Containment**: a component instantiated inside a sibling on the same page is a part of that sibling, whatever either is called.

Tree order breaks what remains. Among parts, the order their author put them in is better evidence than anything the script can infer, so it is left alone.

Containment reads every variant of a set, not just one. A part is often swapped in by a single variant: an open state, a vertical layout, a hug-width cell. Those are the parts most worth documenting. Reading only the first variant once disagreed with a file of 114 hand-built tables fifteen times, and the file was right every time.

The instance cap is divided across a set's variants for the same reason. A set with many variants samples all of them rather than spending its budget on the first.

A third signal was tried and removed: demoting components Figma hides from the assets panel (a leading dot or underscore). Containment already decides what leads, so all it did was reorder parts against their author's arrangement. Nothing here requires a file to follow a convention. A file that follows none still gets a stable order, and says so through `primaryGuessed`.

The containment scan resolves instances, so it runs to a time budget. A `containmentScanned: false` means it was abandoned and the order rests on the page name alone. Know that before trusting a page with several components on it.

## Empty state

A component with no properties gets the empty variant, set *before* any row work. Trimming rows to zero leaves exactly the blank table the empty variant exists to prevent. The loop that trims one surplus row will happily trim them all.
