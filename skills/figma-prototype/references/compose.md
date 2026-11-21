# Compose, step by step

Each step of [SKILL.md](../SKILL.md)'s *Compose* in full. Step numbers match SKILL.md.

## Contents

- [Step 0 — read what was decided and what was said](#step-0--read-what-was-decided-and-what-was-said)
- [Step 1 — know the whole system](#step-1--know-the-whole-system)
- [Step 2 — find the reference](#step-2--find-the-reference)
- [Step 3 — walk the knowledge base](#step-3--walk-the-knowledge-base)
- [Step 4 — compose](#step-4--compose)
- [Step 5 — settle conflicts without blocking](#step-5--settle-conflicts-without-blocking)
- [Step 6 — write the receipt](#step-6--write-the-receipt)
- [Step 7 — check it](#step-7--check-it)

## Step 0 — read what was decided and what was said

Read these in order. A project may lack any piece but the context document (no product file, no feedback log, no eval task). Skip what is absent and say so.

| Order | What | Where | How to use it |
|---|---|---|---|
| 1 | The product file | `product-context.md`, beside the context document | Read it whole: what the product is, who uses it, its words. |
| 2 | The decisions | The context document's §6, the project's one decision log | Library, product, pattern and screen decisions, by Scope. Read the §3–§5 lines they produced too. |
| 3 | The guidance pages | `guidance/<topic>.md`, and `layout.md` for the breakpoints | Read the pages for the patterns and components the screen will use. |
| 4 | The open feedback | `figma-feedback.mjs <fileKey>` (command below) | Handle feedback on a prototype before composing anything new. |

**The product file.** Where there is none, or it is mostly `[TBD]`, run `figma-context-capture` to draft it (its *The product file*) before composing. At run time, ask only about a `[TBD]` the screen being composed needs.

**The system MCP.** Where it is configured, `get_project_knowledge` serves the same three pieces: the product file, the live decisions and the guidance pages. A code agent reads them the same way.

**Guidance pages.** Each gathers the live §6 decisions on one topic (figma-context-capture's *Retiring a decision, and guidance pages*). Where a page and §6 disagree, §6 wins and the page is stale: say so.

**Precedence.** Decisions, and the pages gathering them, outrank the knowledge base and the reference screen. Apply them and never re-ask one. A decision struck through (superseded or retired) is dead. Offer to retire one that has gone stale; [feedback.md](feedback.md), *Step 4*, says which.

**The open feedback.** This command lists every unresolved thread whose last message is a person's, with the layer it is pinned to:

```sh
node skills/figma-prototype/scripts/figma-feedback.mjs <fileKey>
```

Without the toolkit, use `figma_get_comments` and apply the same test.

## Step 1 — know the whole system

List every component the library offers, not only those the reference screen holds.

- With a snapshot: the system MCP's `overview`, then `search` and `get_component` for each candidate.
- With no snapshot: `figma_get_library_components`.

Use only these components. Anything the screen needs that none covers is invented, built from what exists and marked in the receipt.

## Step 2 — find the reference

- With a snapshot: the system MCP's `get_screen_recipe` lists every screen in the file built on the template.
- Without one: run `figma-components-audit` and ask it for those screens.

Start from a copy of the closest screen, never the bare template. Change only what the content decides.

## Step 3 — walk the knowledge base

Where the toolkit is present, read `knowledge/README.md` first. Then read every page the screen touches:

- its patterns (a table, a dialog, a form);
- the five design fundamentals;
- a profile, where one fits;
- the code pages those pages name.

Read each beside the project's guidance page for it, read at step 0. The guidance page wins where they differ. A run without the toolkit (an outside agent) skips this step and says so in the receipt.

## Step 4 — compose

Work through Figma Console in the desktop app, which has the team's fonts.

- Set a text property by its name.
- Re-find nodes after each `setProperties`.
- Put an overlay in an auto-layout frame at `layoutPositioning = "ABSOLUTE"`.
- Bind every gap and padding to a variable.
- Load each font once per call, and reuse it. Loading a font per text node is what times a call out.
- Set a variant by Figma's own option names, read from the component set (`Added`). Never use the snapshot's lowercased values (`added`).
- Write real copy, never "Label".

## Step 5 — settle conflicts without blocking

Where the knowledge base and the reference disagree, decide by who owns the question:

| Case | What to do |
|---|---|
| The content decides it (a read-only value drawn as a disabled input; a toast confirming what the screen already shows) | Fix it. |
| A decision or a guidance page already settles it | Apply it, with no comment. |
| The knowledge item is `weak` (toolkit-standard §D 21) | Keep the drawing; the receipt notes it. |
| Anything else the designer's pattern decides | Keep it as drawn, and post one Figma comment on that layer. |

**The comment.** It is written for a person, in plain text, since the comments API has no bold or link text. Its shape:

- a short title;
- two or three bullets: what conflicts, the option, the question;
- no file paths and no quotes;
- after a blank line, `More:`, with the full link on the next line.

The link goes to the knowledge section on the toolkit's public repository: `https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/…#<heading>`.

Post it with this command:

```sh
node skills/figma-prototype/scripts/figma-feedback.mjs <fileKey> --on <nodeId> <message>
```

It posts as the agent's own Figma account where `figma-claude` holds its key. Otherwise it posts with the toolkit's key and puts `From Claude:` first, so a run knows its own messages.

**A comment, not an annotation.** A comment reaches the file's people by their notification settings, takes a reply and is resolved. The answer is feedback, handled as [feedback.md](feedback.md) says. This step is skipped when step 3 was.

## Step 6 — write the receipt

Write it on each frame as shared plugin data, so any bridge reads it: `setSharedPluginData("fca", "receipt", json)`. Overwrite any receipt a copied frame brought with it.

| Field | Holds |
|---|---|
| `reference` | The reference screen's name |
| `components` | The components used |
| `invented` | Each invented item, with what stands in for it |
| `knowledge` | The knowledge and guidance pages read |
| `rulings` | Each decision or ruling applied, by its date and a few words |

Wire the flow's prototype connections where a flow is the point.

## Step 7 — check it

Run `figma-components-audit`'s composed-frame check on every frame, with its receipt check. A clean frame has:

- no raw layer, unbound value, orphan or detached copy;
- a receipt naming its reference.

Then take a screenshot of each frame. Report the receipt's invented items: each is a gap in the system for someone to rule on.
