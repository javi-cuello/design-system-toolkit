# The project's other documents

The context document is one of the documents a person decides (toolkit-standard §D 12). This file holds the rules for the others, which [SKILL.md](../SKILL.md) summarises under *The project's other documents*. A prototype run that finds them missing, a comment that settles a decision (figma-prototype), or a person can ask for any of them.

## Contents

- [The product file](#the-product-file)
- [Recording a decision](#recording-a-decision)
- [Retiring a decision](#retiring-a-decision)
- [Guidance pages](#guidance-pages)

## The product file

`product-context.md` sits beside the context document: what the product is, who uses it, and its words. Its shape is [`assets/product-context-template.md`](../assets/product-context-template.md). Where there is none, or it is mostly `[TBD]`, fill it the easy way:

1. Draft it from evidence: the Figma file's page and screen names, and the code's pages, routes, sample data and README.
2. End each line with its source.
3. Ask the user at most five questions on the gaps, each with choices.
4. Show the draft, and write it only after their yes.

For a suite of products, the product file holds only what the apps share.

## Recording a decision

Append a dated row to the context document's §6, under its columns. A product decision takes Scope `Product`, or `Pattern` or `Screen`. The row gives:

| Column | What it holds |
|---|---|
| Ruling | The decision itself |
| Why | The reason, ending with its source's link |
| Decided by | Who decided |
| Confirms or overrides | A standard rule or knowledge page, where the log has this column |
| Checked by | The eval task, where the log has this column |

Then, in the same edit:

- Delete an open item the decision resolves: an open-items list holds only what is open, and the decision row keeps the outcome. After deleting numbered items, find every cross-reference to them and re-read each sentence that held one; a regex sweep breaks grammar silently.

- Strike through the decision of any older row it supersedes, and replace that row's line on a guidance page.
- Where it settles a word, change the product file's *Words* line.
- Add its date to the `rulings` of the project's Figma eval task, `tests/evals/figma-tasks.json`. A run that drops the decision then scores lower.

Dates and what they name:

- A day's second decision takes a letter, as in `2026-11-11b`. A prototype's receipt names a decision by that date first.
- A decision that reverses an older one says so, as in `supersedes 2026-11-02`. Its date replaces the older one in the task's `rulings`.
- A decision that only drops an older one retires it (below) and removes its date, adding none. A removal is nothing a frame can apply.

A decision about the library itself (a component, a variant, a convention) is a §6 row too. It takes the Scope the log uses for that library, and comes with the §3–§5 line it changes.

## Retiring a decision

Retire a decision when any of these holds:

- A later decision contradicts it.
- It names a screen or word the product no longer has.
- The library or the code now makes it redundant.

To retire it, strike its decision through where it stands, and add `retired <date>: <reason>` to its Why. Every reader skips a struck row, and its date leaves the task's `rulings`. Never retire a decision for going unused: a run that never touched its screen did not test it.

## Guidance pages

Where two or more live decisions share a topic (how tables sort, what the shell holds), offer a guidance page, `guidance/<topic>.md`, that gathers them. Its shape is [`assets/guidance-template.md`](../assets/guidance-template.md). Write it only after the user's yes.

A decision struck or superseded is struck or replaced on its guidance page in the same edit.
