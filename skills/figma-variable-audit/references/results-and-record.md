# The results table and the record

How Step 6's table is produced and read, and how Step 7 files rows to the project's record. [SKILL.md](../SKILL.md) says when each runs.

## Contents

- [The generated table](#the-generated-table)
- [Narrowing the scope](#narrowing-the-scope)
- [The finding's text and layers](#the-findings-text-and-layers)
- [What stays yours](#what-stays-yours)
- [Writing to the record](#writing-to-the-record)

## The generated table

Aggregate numbers ("224 broken across 9 components") are not actionable alone. Always pair them with a locatable table. **The counts and the table are generated, never written** (toolkit-standard §D 23). Save each `scan` result verbatim as JSON, one file per batch, and run:

```
node scripts/report.mjs --keys keys.json [--scope <property>,…] scan.json [scan-2.json …]
```

Paste what it prints:

- the counts, with distinct tokens as the union of the batches' `seen`, never their sum;
- what the run did not check;
- one row per finding, under the header below.

| Component | Severity | Finding | Layers | Fix |
|---|---|---|---|---|

Rows are sorted by page and component, errors before reviews. The output is the same bytes whatever order the batches are passed in.

`report.mjs` refuses:

| Input | Why |
|---|---|
| A batch handed fewer or more keys than `keys.json` holds | a trimmed key set reads valid keys as broken |
| Batches that name two files | one table covers one file |
| Two different batches that audited the same component | a retried batch overlapping another would sum its measures twice |

A batch passed twice is counted once. Still, pass each batch once.

## Narrowing the scope

Where Step 0's scope is narrower than everything, pass it as `--scope`: the properties the layer lines name.

| Scope | `--scope` |
|---|---|
| Colours | `fills,strokes,effects` |
| Text styles | `textStyleId` |
| Spacing | `itemSpacing,paddingLeft,…` |

A finding naming none of them is left out before the broken-link counts are taken. The output says how many it left out. **Never delete rows by hand:** the counts would still include them. The scanned-component and binding counts stay whole, since they say what was scanned.

## The finding's text and layers

Each scanner finding carries two strings. `text` states what is wrong, and `advice`, beside it, says what to do.

- Its `layers` are grouped by layer path, with each layer's properties gathered and variants counted.
- A path is cut to the leaf and its parent.
- A binding on the variant's own frame reads "the component frame".
- No variant prefix goes in the path, since the fix is made once on the component.
- A finding on a single variant names it: one with no variant reads as covering the whole component.

The component cell is the page and the component (`page › set`). The layer cell is the leaf and its parent, as the scanner cut it.

## What stays yours

What stays yours is what the scan does not determine. If the broken set clusters around one pattern, say so explicitly. An example is a whole semantic category that does not exist in the library. That reframes the fix from "something needs re-linking" to "the library is missing this category". It is a different conversation with the user.

Name the accepted orphans the context document suppressed, by count (SKILL.md, *Project context first*). Name the instance-scope limit once where relevant (SKILL.md, Step 3).

## Writing to the record

When the project keeps an audit record, write each broken link there as well as reporting it. The record is `<project>/audit/<fileKey>.json`, one per library, named in the context document's registry.

Write through the record's one writer, never by hand: `POST /rows` on the project's dashboard service, or `node tools/figma-audit/rows.mjs --data <record>` when no service runs. The payload is `{ owner: "figma-variable-audit", fileKey, full, scope, findings }`.

| Finding field | Value |
|---|---|
| one finding per | component and token |
| `rule` | `"link"` |
| `check` | the broken path |
| `where` | the component |
| bucket | 3, since relinking is a choice of which live token replaces the missing one |

Each finding also carries `key: link|<kind>|<token key>`. The writer then finds the row after a rewording, rather than orphaning it beside a new twin.

**A run closes only rows it owns**. A link that resolves again, on a run sent with `full: true`, is closed with the run's date. An accepted orphan is a ruling in the context document, never a row.
