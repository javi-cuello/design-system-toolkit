# Building, auditing and common mistakes

How a section's rows are cloned into place, how a new section is scaffolded, what the audit checks, and the mistakes worth checking for.

## Contents

- [Building a branch](#building-a-branch)
- [Adding a new category section](#adding-a-new-category-section)
- [The audit](#the-audit)
- [Common mistakes](#common-mistakes)

## Building a branch

A full leaf, one token sample cell, is a chain:

**Role frame → Type frame (or `Empy`) → Emphasis frame → State frame (or `Empy`) → Level token instance.**

Build the chain that `rows` mode returned. Its `tree` says which Role, Type, Emphasis and State frames exist, and which Level cell is `Empy`. The fastest reliable way to make them is to **clone an existing correct chain** and edit it. Don't instantiate components and hand-assemble auto-layout frames.

1. Clone a Role frame, such as an existing "Accent", as the shell for a new Role. Empty its inner `Content` frame's children before adding Type frames.
2. Clone a Type frame the same way for each Type.
3. For each Emphasis leaf, clone an existing chain of one Emphasis with one State. Prune the State siblings down to what that leaf really has, often just one.
4. Where the category has no State column at all, set the remaining State's `Level 3-4` to `Empy: "True"`.
5. On the `Level token` instance inside, run the script's `token` mode, batched per section. It sets the `Content` variant, binds the swatch and sets the label ([anatomy.md](anatomy.md), *Binding a swatch*).
6. **After cloning, rename the frame's own `.name`** to match its Level label text.
7. Assemble Role frames into the Table's top-level `Content` frame, with a Divider clone between each.

The label is lowercase and dot-separated, mirroring the path: `background.feedback.danger.soft.rest`, `icon.accent.primary.medium`.

Step 6 matters because cloning copies only the label *property*. The layer name stays whatever the source was. A frame named "Soft" whose label says "Inverse" looks fine in the table. But it confuses anyone browsing the layer panel, and it breaks any later script that finds children by `.name`.

**Dividers**, the thin separator vector, go only between sibling Role frames and sibling Type frames. Never insert one between Emphasis or State siblings. That is not the existing convention, and it looks wrong once several Emphasis rows stack up.

## Adding a new category section

- [ ] Clone an existing category section, not just the Table, so the Section header component comes along.
- [ ] Set the Section header's title text property to the new category name. Find the property key at run time, as for Level labels.
- [ ] Clear the cloned Table's `Content` frame entirely before rebuilding. It starts as a copy of its source.
- [ ] Place the new section beside the others, not on top. Offset `x` by the previous section's `width` plus a gap.
- [ ] Confirm its place in the `Sections` container, in the intended left-to-right order.
- [ ] Run the full audit before calling it done.

## The audit

A screenshot can look right and still be wrong. A 3% mistint is nearly invisible, and a label that does not match its binding shows only when both are checked. So after building or editing a table, run `scripts/tokens-mapping.js` with this prepended:

```js
const MODE = "audit"; const TABLE_ID = "…";
```

It walks every `Level token` under the table and reports, per cell:

| Finding | Rule it checks |
|---|---|
| A pill bound to a variable | The pill is always the flat neutral overlay |
| A layer that must stay neutral is bound, or a `Stroke` `Sample` has fills | [anatomy.md](anatomy.md)'s Content table |
| A swatch layer not where the table says | A finding about the name, never a skipped cell |
| A swatch not bound, or bound to a variable that does not resolve | Every token cell is bound |
| A label that is not the bound variable's dot-notation name | Label and binding agree |
| A frame whose name differs from its Level label | Step 6 of *Building a branch* |

The frame-name check covers every frame whose direct child is a filled `Level 1`, `Level 2` or `Level 3-4`.

It returns `{ cells, found, issues, measures }`. `measures.cells` and `measures.levelFrames` say how much it saw. A zero there is a probe that recognised nothing, not a clean table.

**Always check that `issues` is empty.** For full coverage, compare `found` against the variable list. For a representative sample, confirm every intended row is bound correctly. Re-run the audit after any bulk edit: it is cheap and catches the most common regression.

Whether a finding is a defect stays your call. Case T1 records a file whose pills are bound to a neutral token on purpose, against the pill rule, as an open question.

## Common mistakes

| Mistake | What goes wrong | Guard |
|---|---|---|
| **Binding the pill instead of the swatch** | The pill still renders a colour, often a leftover from the clone's source, so the row looks filled | Name the swatch layer ([anatomy.md](anatomy.md)) |
| **Variant-switch bleed** | An old override carries onto a same-named layer in the new variant | Reset the "must stay neutral" layers after every switch |
| **Stale frame `.name`** | A cloned, relabelled frame keeps its source's name | Step 6 of *Building a branch* |
| **Wrong Feedback type names** | One category says "Warning" where another still says "Yellow", or lacks a type | Read names per category from its variables |
| **Assuming symmetry** | Not every Emphasis has the same States; not every Role has a Type split | Build each branch from its own variables |
