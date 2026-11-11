---
name: ds-model-routing
description: Advise on the right Claude model and Effort setting before starting any design systems task — library audits, contrast matrices, token tables, doc generation, OKLCH scales, component passes, plugin/skill creation, or design systems research. Use this skill at the START of any such task, even if the user doesn't ask about models, so they can switch before burning tokens on the wrong tier. Also use whenever the user asks which model or effort level to use, whether a task "needs Opus/Fable", or how to conserve rate limits on design systems work.
---

# Design systems model routing

**Version 1.3.2** — history in CHANGELOG.md.

Claude cannot change the model or Effort setting itself — only the user can, via the model picker. This skill's job is to check the current task against the routing table (`tools/shared/model-routing.json`, printed as the *Routing table* section says) and, when there is a mismatch, tell the user **before starting work** so they can switch. If the current model/effort already fits, say nothing about routing and just proceed.

## How to use this skill

1. Identify which task family the request belongs to (the routing table's families).
2. Compare against the model currently powering the session (from the system prompt) and, if known, the effort level.
3. If there's a mismatch, give a one-sentence recommendation with the reason, e.g.:
   - "This is a mechanical audit — Sonnet at default effort handles it and uses far less of your limit. Want to switch, or continue here?"
   - "Designing a new skill is one-time work that compounds — worth switching to Opus or Fable at high effort before we start."
4. If the user declines or doesn't respond to the suggestion, proceed with the current model without further comment. Never repeat the suggestion in the same conversation.
5. If the effort level isn't visible, only mention effort when it clearly matters (highest for plugin design and deep research; low is fine for pure math tasks).

## Routing table

The table is data: `tools/shared/model-routing.json` in the toolkit, one row per task family — `task`, the `skills` it covers, the advised `model` and `effort` (ranges, as you say them to the user), `why`, `also` (what else the row covers, where it says), `keys` (the skill, or `skill:mode` in the skill's own mode names, plus `authoring` for work on skills and plugins in the toolkit and `long-form-prose` for the row no skill owns; `grey` and `gray` both work), and `agent`, the single pick a workflow sets. Read it before advising; never route from memory. `node tools/shared/test-model-routing.mjs` holds it: every skill has a row.

**Two skills appear twice, and the mode is what moves the tier** — `oklch-color-scale-system` in free/grey mode is rule-following, but anchored mode with a brand colour that fails contrast is a trade-off problem; `design-system-research` light is a few searches, deep is multi-source synthesis. Ask which mode before routing, because the skill name alone does not settle it.

**`ds-model-routing` is not in the table** because it is not a task — it is the thing you consult before one. Every other design-systems skill in the toolkit has a row; `kirby-cms` has none because it is a CMS working reference outside this table's scope, and routing CMS development work is not this skill's question.

## In a workflow

A workflow script sets each `agent()`'s model and effort from the same table, so a mechanical stage runs on Sonnet and a judging stage on Opus at high effort without anyone choosing per run. A script has no filesystem, so pass the routes in as the Workflow's `args`: run `node tools/shared/model-routing.mjs` from the toolkit, put its output in `args.routes`, and spread a stage's route into its options — `agent(prompt, { ...args.routes['figma-components-audit'], phase: 'Audit' })`. A skill whose mode moves the tier has only `skill:mode` keys (`design-system-research:deep`, `oklch-color-scale-system:free`): decide the mode before the stage, since a key that is not there spreads nothing and the stage silently keeps the session's model. A Default row's pick is `medium`, set explicitly, so a stage does not inherit a session running at `max`. This skill is the instruction to set `effort` there; a stage the table has no row for keeps the session's model and effort.

## Escalation triggers (regardless of task family)

Recommend stepping UP a tier or raising effort when the task involves:
- Ambiguous judgment calls (is this variant structure wrong, or just unconventional?)
- One-time design decisions (taxonomies, anchoring strategies, skill architecture)
- Long unsupervised multi-stage runs where errors compound
- Reconciling conflicting sources of truth (Figma vs code vs docs)

Recommend stepping DOWN when the task is:
- Deterministic (math, lookups, format conversion)
- Fully specified by an existing skill's procedure
- High-volume and repetitive (50 components × the same check)

## Context beats model choice

A recurring practitioner finding (TJ Pitre / Southleft, among others): well-structured context — accurate component metadata, bound tokens, good descriptions, tight MCP servers — improves reliability more than upgrading models does. If results are inconsistent on a design systems task, first check whether the underlying library metadata and skills are in order before recommending a bigger model. With good context, Sonnet at default covers most of the table; without it, even the top tier produces confident nonsense.

## Claude Code note

If the user works in Claude Code, mention that routing can be *enforced* there rather than advised: each agent definition can pin its own model, reasoning effort, and tools in frontmatter (e.g. a cheap read-only explorer agent on Haiku/Sonnet, an audit agent on Sonnet, a skill-authoring agent on Opus). Offer to draft those agent files if relevant.
