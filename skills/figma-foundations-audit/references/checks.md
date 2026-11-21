# The checks

What each file-level check asks, the settings it reads, and the rules that govern every check. [SKILL.md](../SKILL.md)'s *What it checks* table points here.

## Contents

- [Each check](#each-check)
- [Rules for every check](#rules-for-every-check)
- [Mode pins](#mode-pins)
- [The part rule](#the-part-rule)
- [Not yet checked](#not-yet-checked)

## Each check

| Check | figma-standard rule | Reads |
|---|---|---|
| Categories run alphabetically, and the pinned categories come last in their recorded order | 11 | `categoryMarker`, `pinnedCategories`, `excludeCategories`, `deprecatedCategory` |
| Pages within a category run alphabetically | 11 | `pageMarker`, `dividerPage` |
| The component-page template: sections in order, and a Matrix exactly when the primary component has axes | 15 | `pageSections`, `pageSectionComponent`, `matrixSection` |
| A component on an in-progress page carries the marker, after a private part's `_`, and no other component does | 13 | `statusMarker`, `internalPrefix` |
| No two component names differ only in case | 19 | — |
| A grouped name uses the recorded separator, not a bare slash | 20 | `groupSeparator` |
| A part used inside exactly one parent carries that parent's name; a status marker is set aside first | 9 | `familySeparator`, `internalPrefix`, `familyCategories`, `statusMarker` |
| A deprecated component carries the deprecation marker, name prefix and category together, a private part's `_` first | 14 | `deprecatedMarker`, `deprecatedCategory` |
| Only one generation of a collection is pinned across the file, and a brand pin sits beside a theme pin | — | — |

The page-order checks are fixed once the project states its category marker. The separator and deprecation checks follow the project's choice. The part check needs a reader (*The part rule*).

## Rules for every check

**A key that is absent skips its check.** It never borrows a value, because a borrowed convention reports another project's answer as this project's defect. A check the gather path cannot read is skipped too. The report names every skipped check under *Not checked*.

**The separator and part-name checks compare against naming preferences.** These live in `standards/naming-preferences.json`, or the project's `naming-preferences` block. A departure is filed as `preference`: it works, but reads unlike the rest. A case collision and a private prefix behind a marker break something, and keep their tier.

**Scope follows the components audit's settings.** `componentPages` and `excludeSections` decide which components are in scope. An excluded section's pages are not ordered.

**The template check runs apart from Matrix generation.** A page's `Matrix` is generated with the Propstar plugin. Running Propstar, or any plugin, displaces the Desktop Bridge. So a live run of the template check never overlaps it, and only the maintainer regenerates a Matrix.

## Mode pins

A frame can pin a mode per collection, and those pins outlive the library they were made against. Reorganising a collection's modes does not rewrite them. A file can then hold several collection objects of one name, each with its own modes. Only the current one resolves to what the library publishes; the rest fall back to a default, silently.

**Severity comes from what the stale pin costs:**

| Where the stale pins sit | Severity |
|---|---|
| Inside a component | Error |
| Only in documentation furniture whose inner frames re-pin the current collection | Question: the nearest pin wins, so the frame renders correctly |
| Anywhere else | Warning |

A frame that pins a brand extension without a theme pin beside it is a question, not a defect. It inherits Light or Dark from wherever it sits.

**No check for pins left by a retired library.** Such a check would test whether the collection's library provides no variables. That cannot tell a retired collection from a live one whose variables are hidden from publishing, which is what a primitives tier is. One was written, and most of its findings were false. The gather therefore reads no variable counts at all.

## The part rule

**The part rule is a question, never a fix.** Figma-standard rule 9 binds parts, not public components that happen to be composed somewhere. A part used by more than one parent keeps a functional name.

- The script flags a private part, or a public one living on its only parent's page.
- Grouped-set members count as one parent.
- A part named for its parent with nothing but the privacy mark (`_Dialog` inside `Dialog`) already carries the name.
- A child of a child is not credited to its grandparent.

Whether the flagged component really is a part is the reader's call. Renaming one is the maintainer's.

## Not yet checked

Written down so silence is not read as coverage:

- The rest of figma-standard rule 15: the page header (the component name and the first sentence of its description), and one Properties table per component.
- Name case convention (figma-standard rule 18, which needs its carve-outs judged).
- Component words matching token words (figma-standard rule 22).
- Token names against the project's formula.
- Primitive tiers hidden from publishing (which runs against the token file).
- Effects and text styles coming from the library rather than local styles.
