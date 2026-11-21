# The fix queue

How the report is shaped, the chat template, and the rules that keep each bucket readable. The script `tools/figma-audit/fix-queue.mjs` renders the template from the record. The rules below are what it implements.

## Contents

- [Rendering it](#rendering-it)
- [Report rules](#report-rules)
- [Chat report template](#chat-report-template)
- [Keeping each bucket a table](#keeping-each-bucket-a-table)
- [Matching the surface](#matching-the-surface)
- [Filling it](#filling-it)

## Rendering it

**Generated from the record, never written** (toolkit-standard §D 23).

```sh
node tools/figma-audit/fix-queue.mjs --data <project>/audit/<fileKey>.json          # the .md mirror
node tools/figma-audit/fix-queue.mjs --data <project>/audit/<fileKey>.json --chat   # the chat report
```

| Flag | Effect |
|---|---|
| `--links` | Deep links in the Where cells, on a surface that renders links |
| `--owner <skill>` | Narrows the queue to one skill's rows |
| `--held-back`, `--not-scanned` | Take the run's own words for the closing line |
| `--page` | Prints the results page ([record.md](record.md), *Delivery*) |

What it prints on stderr as `written by the run:` are the gaps it cannot fill. Those are a missing closing line, a claim over the cell budget, and a record with no run. Shorten an over-long claim in the record and render again.

Paste its output as it stands. A row that reads wrong is fixed in the record, or in the check that worded it, and rendered again. A run with no record renders from a scratch record ([record.md](record.md), *Filing rows*).

## Report rules

The report is exception-based and leans toward action.

- **The closing metrics block is mandatory**. Every audit report ends with exactly three lines, regardless of findings. They are `Coverage: <semantic-token coverage %> (sampled/full, N bindings)`, then `Scope: <sets/components scanned, exclusions named>`, then `Date: <YYYY-MM-DD>`. The coverage figure also lands in the context document's audit line for the library.
- **Coverage is the tracked metric**. Semantic-token coverage per library, in every closing metrics block, is the one metric tracked over time, and it is never omitted. No composite score is given unless the maintainer asks ([scoring.md](scoring.md)). One number moving over time is legible, while a composite hides which of its parts moved.
- **Report it every time**. A figure reported only when it looks notable is an anecdote, not a metric. Recorded coverage is the deliberate carve-out to toolkit-standard §D 17. It costs a full walk to recompute, unlike the page and collection counts that rule bans.
- **Count coverage over the nodes the checks look at**. Each raw value counts as one event, never as one deduplicated queue row. Otherwise twenty raw fills weigh as one against twenty bindings, and the figure reads 100 regardless.
- **Silence on pass**. No matrix, no totals per dimension, no praise inventory. One coverage line states what was scanned and at what depth, so silence means something. For example: "scanned all 116 sets, every variant, tokens + schema + naming + states + metadata; a11y structure not checked". An unscanned area is named, because there silence means nothing.
- **Group by the action required, not by rule category**. The four buckets come in the order below.
- **Every item carries** the deep link (`figma.com/design/<fileKey>?node-id=…`), the one-line defect, the proposed fix, its severity and its rule source.
- **Severity** is error, warning, review, preference or hygiene, with a distinct marker when the defect is user-visible.
- **Preference** is a name that departs from `standards/naming-preferences.json` or the project's `naming-preferences` block. It is also a build that departs from a `moderate` knowledge item. Either works and holds nothing back, but reads unlike the rest.
- **The rule source** is `universal`, `system` or `knowledge`, the last written as `rule: knowledge:<page>#<part>`. A repeated system violation is grounds to question the system rule, and the report should invite that.
- **Buckets order by action; severity orders rows within each bucket**. User-visible defects lead their bucket, whatever their tier.
- **Hygiene stays out of the default report**. It is tracked in the record and the `.md` mirror. The chat report holds it back unless the maintainer asks for the full queue. It is shown too when the open queue is short enough that including it costs nothing.
- **Chat first**. The fix queue renders in chat, in the template below. The `.md` mirror is an optional, fuller copy (the same items, deep links and fuller option text), never a substitute. HTML only as the page step 2c offers.
- **Findings the maintainer has seen and not acted on** are listed once, not argued again.

| Bucket | What goes in it |
|---|---|
| 1 · Approve & I fix | Safe, unambiguous, programmatic fixes. One approval applies the batch. |
| 2 · Quick manual fixes | Operations only the Figma UI can do (axis and option reorders), as concrete steps with deep links. |
| 3 · Decide | Each item is a question with the options laid out and a recommendation. A decision creates either a fix or a rulebook entry; there is no third outcome. |
| 4 · Breaking — schedule | Fixes that lose consumers' work or change the component API, stated bluntly with their blast radius. |

## Chat report template

The record holds three buckets, since `rows.mjs` files every finding into buckets 1–3. So a rendered queue carries a breaking change as a bucket 3 question, as the dashboard does. Bucket 4 is drawn only by hand.

Open with one delta line, then the key, then the buckets. **Every bucket is a compact table in chat** (# / Sev / Where / Fix), bucket 1 included. Its rows share one approval, stated in the bucket heading. The checkbox form lives only in the `.md` mirror, where checkboxes work. Close with one line for what was held back and not scanned, and nothing else.

**Every row carries a bucket-scoped number, `N.M`**: bucket `N`, position `M` within it, in report order. A row can then be addressed as "3.2" without restating its Where cell.

Severity markers: 🔴 error · 🟡 warning · 🔵 needs ruling · ◽ preference · ⚪ hygiene · ⚠️ appended when user-visible, which leads its bucket.

```markdown
**Re-run:** <N> sets scanned · **<n> new** · **<n> fixed** (<what>) · everything below is still open.

**Key:** 🔴 error · 🟡 warning · 🔵 needs ruling · ◽ preference · ⚠️ = user-visible impact, leads the queue

### 1 · Approve & I fix (one approval applies all)
| # | Sev | Where | Fix |
|---|---|---|---|
| 1.1 | 🔴 | `<Set › layer path>` | <fix + why it matters, one clause> |

### 2 · Quick manual fixes (~<time>)
| # | Sev | Where | Fix |
|---|---|---|---|
| 2.1 | 🔴 | [`<Set › layer path>`](https://www.figma.com/design/<fileKey>?node-id=<id>) | <exact UI step, incl. which panel shows the value> |

### 3 · Decide
| # | Sev | Where | Question | Rec |
|---|---|---|---|---|
| 3.1 | 🔵⚠️ | [`<Set › layer or panel>`](https://www.figma.com/design/<fileKey>?node-id=<id>) | <question, with the user-facing consequence in parentheses> | <recommendation, 1–3 words> |

### 4 · Breaking — schedule
| # | Sev | Where | Fix | Blast radius |
|---|---|---|---|---|
| 4.1 | 🔴 | [`<Set › layer or panel>`](https://www.figma.com/design/<fileKey>?node-id=<id>) | <exact fix> | <what breaks — instance overrides, API consumers> |

*Held back: <hygiene summary>. Not scanned: <honest gaps>.*

Answer any row by its number or name + choice (e.g. "3.2: accept" or "tooltip: accept") and I'll action it.
```

## Keeping each bucket a table

A bucket can fail to render as a table for reasons its author cannot see. So before sending, count the pipes in each row: they must equal the column count plus one.

- **No pipe characters inside a cell, escaped or not**. A terminal renderer does not honour an escaped pipe. The row splits at each one, the column count stops matching the header, and the whole bucket degrades to plain text. Separate option values with `·` (`Type{Default · Outline · Ghost}`), or move the list below the table.
- **Keep every cell short: roughly 120 characters**. A terminal renderer reflows a table it cannot fit, and past some width drops the grid for key-value pairs. Put anything longer below the table as a named note, or in the `.md` mirror.
- **One claim per line, in every column**. A record row's two columns, what is wrong and what to do, each hold a list of claims, never a paragraph. A bulleted problem beside a prose recommendation is half a fix. Store claims as arrays rather than strings, so the shape is a property of the data.
- **This is not a licence to lengthen**. The 120-character budget is per claim, and three bullets that each break it are worse than the paragraph they replaced. Write claims separately rather than splitting sentences after the fact. Before any mechanical split, check for abbreviations such as "e.g." or "vs.", which break a bullet mid-thought.
- **A finding's supporting detail is not a cell**. Cells hold the claim, and the paragraph under the table holds the argument. A row a reader cannot take in at a glance has stopped being scannable, which is the whole reason for the format.

## Matching the surface

In chats a browser renders (claude.ai), markdown links collapse to their label, so Where cells wrap their deep links inline. In a terminal (Claude Code), an inline link prints as its full raw URL, and a queue of long Figma URLs is unreadable.

So in a terminal the chat report carries **no inline URLs**. Where cells are plain code paths (set › layer), and the deep links move to the `.md` mirror. The mirror is then **mandatory**, and the chat names its path. A finding the maintainer cannot locate is unverified, so the links must exist somewhere. Everything else about the template holds on any surface.

## Filling it

- **One row per node, always**. Never combine two components or two locations in one row, even when they share the question or the fix. "Autocomplete input + Dropdown input" as one row is the mistake. Each gets its own row so it can be ticked, located and numbered on its own.
- **Paths that differ in one segment still get a row each**, such as two calendar variants, never joined with "+". A scannable table beats a compact one.
- **A shared root cause is stated once, below the table**, not repeated in every Fix cell. This applies to any bucket.
- **Every Where cell is the full path in code format**: `Set › layer › layer`, or `Set — properties panel` for schema items. It is wrapped in its deep link where the surface allows. A finding the maintainer cannot locate is treated as unverified.
- **Numbering follows the sorted order**, after severity and the ⚠️ lift, never the order of writing. So `3.1` is always the top row of bucket 3 as rendered.
- **Numbers belong to one report**. A re-run renumbers from `N.1` in its own order and does not keep a prior run's numbers. The Where cell and deep link carry identity across runs; the number is a handle within one conversation.
- **Empty buckets are left out**, and numbering does not skip to cover the gap. With nothing in bucket 2, `1.x` is followed by `3.x`.
- **A first-ever run replaces the delta line with a coverage line**: "audited <N> sets, every variant — tokens, schema, naming, states, metadata; a11y not scanned".
- **The closing prompt line always invites short rulings** by number or name.
- **The chat report has no Done column**. A chat message is static, and a checkbox there ticks nothing. Done appears only in the `.md` mirror, where it works (GitHub, most editors).
