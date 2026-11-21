# Assembling the context document

How steps 6 to 9 of [SKILL.md](../SKILL.md) fill the template, where the result goes, and how the run closes. The template is [`assets/context-template.md`](../assets/context-template.md); its structure is the contract.

## Contents

- [Rules, not state](#rules-not-state)
- [How values are written](#how-values-are-written)
- [Where the document goes](#where-the-document-goes)
- [Overrides](#overrides)
- [The closing report](#the-closing-report)

## Rules, not state

The template is organised by **half-life**, and assembly respects it. That is what keeps the document from going stale the week after capture.

- **Durable facts go in §2–§6**: conventions, rulings, keys and roles.
- **State is omitted, not filed somewhere softer.** State is what a person could change in an afternoon's work. Examples: page counts, variant counts, description coverage, missing artifacts.
- Skills re-read state live for free. A recorded copy can only be redundant or wrong, and it goes wrong fast.
- One project's recorded state claimed 18 pages against 4, 3 grid styles against 8 and 47 icons against 43. A live read caught each error; the record itself caught none.
- Marking a figure "informational" does not stop a reader trusting it.
- **One exception:** output that is expensive to recompute, such as a full audit's deep-walked variant grids. It goes in §4 beside the fix queue it explains, dated and headed "re-run to refresh" (toolkit-standard §D 17).

## How values are written

- **Evidence is cited, not enumerated.** A rule carries a one-line justification ("consistent across 12 sampled sets"), never a table of the underlying data.
- **§1 is for humans.** Two prose paragraphs a new designer could read: the system's shape, its source of truth and its distinctive conventions. No keys and no counts. Write it last, from the filled sections.
- **Tags mark the exceptions.** An untagged value is confirmed. Tag only `[inferred]` (with its sample) and `[TBD]` (with where it resolves). Do not spray `[confirmed]` everywhere.
- **The maintainer's corrections at step 5 become rulings in §6**, dated.
- **Fields no pass could reach stay `[TBD]`.** A visible gap beats a plausible fabrication.
- **The template's routing preamble is kept verbatim.**

## Where the document goes

| Environment | Mode | Where |
|---|---|---|
| Claude Code | New project | `<project home>/design-system-context.md`, creating the home folder |
| Claude Code | Add a library, refresh | The same file, updated in place |
| claude.ai | New project | `/mnt/user-data/outputs/design-system-context-{project}.md`, the full document |
| claude.ai | Add a library, refresh | A `-delta` file in `/mnt/user-data/outputs/`, holding only the changed sections |

In Claude Code the document is committed in the project's repo. Only claude.ai, which has no home folder, writes to outputs, and the run presents the file.

## Overrides

Report which house defaults this project overrode. A §6 ruling from this run that contradicts a figma-standard rule is evidence that the rule has started to vary between projects.

- This run is the only moment that is visible. The override is a decision taken in the session, and nothing reads it back when it is taken.
- A capture in claude.ai writes to outputs, so it may never reach the toolkit. Where it does, coverage is recomputed only when someone challenges a rule.
- List them as a closing block, one line each: `<standard> rule N overridden — this project does X instead`, such as `figma-standard rule 4` or `figma-standard rule 18`.
- No project names and no project data: the rule number and the shape of the divergence are the whole payload.

A design or naming rule is meant to hold across projects (toolkit-standard §C clause C). The first override is the moment that claim becomes false, and this block is the only signal of it. A capture that overrides three house defaults and reports none leaves the standard asserting a consensus that no longer exists.

## The closing report

End the chat report with these, in order:

1. The open questions: the items that block `[TBD]` → `[confirmed]`.
2. Where the document is, and that it is to be committed.
3. In add or refresh mode, which sections changed.

In claude.ai only, items 2 and 3 change:

- Item 2 reminds the user to add the document to the Claude Project's knowledge by hand, since Claude cannot write project knowledge.
- Item 3 says exactly which sections of the existing document to replace.
- The template's **Deployment** block, in its preamble, carries the custom-instructions line to paste into the Project. Point the user at it rather than restating it in chat.
