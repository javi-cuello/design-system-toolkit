---
name: ds-model-routing
description: Advise on the right Claude model and Effort setting before starting any design systems task — library audits, contrast matrices, token tables, doc generation, OKLCH scales, component passes, plugin/skill creation, or design systems research. Use this skill at the START of any such task, even if the user doesn't ask about models, so they can switch before burning tokens on the wrong tier. Also use whenever the user asks which model or effort level to use, whether a task "needs Opus/Fable", or how to conserve rate limits on design systems work.
---

# Design systems model routing

**Version 1.4.0** — history in CHANGELOG.md.

This skill checks a design systems task against the routing table before work starts. When the session's model or effort does not fit the task, it tells the user so they can switch. Only the user can change the model or Effort setting, via the model picker; Claude cannot change either. If the current model and effort already fit, say nothing about routing and just proceed.

## How to use this skill

1. Read the routing table (*Routing table*). Never route from memory.
2. Find the task family the request belongs to, by its skill or by its task.
3. For `oklch-color-scale-system` or `design-system-research`, ask which mode before routing (*Modes that move the tier*).
4. Compare the row with the model powering the session (from the system prompt), and with the effort level if known.
5. If they match, say nothing about routing and proceed.
6. If they do not match, give a one-sentence recommendation with its reason, **before starting work**, and offer to switch or continue.
7. If the user declines or does not respond, proceed on the current model without further comment. Never repeat the suggestion in the same conversation.
8. If the user says "switch", explain that only they can switch, via the model picker. Never claim a switch has happened.

Two example recommendations:

- "This is a mechanical audit — Sonnet at medium effort handles it and uses far less of your limit. Want to switch, or continue here?"
- "Designing a new skill is one-time work that compounds — worth switching to Opus or Fable at high effort before we start."

### Naming effort

- Name the effort level, never "default". The default is medium on Opus 5.5 and Haiku 5.5, but high on Sonnet 5.5 and Fable 5.2 (Anthropic's model docs).
- If the effort level is not visible, mention effort only when it clearly matters.
- Effort clearly matters at the top: the highest level for plugin design and deep research. Low is fine for pure math tasks.

## Routing table

The table is data: `tools/shared/model-routing.json` in the toolkit, one row per task family. `node tools/shared/test-model-routing.mjs` holds it: every skill has a row.

| Field | Holds |
|---|---|
| `task` | The task family |
| `skills` | The skills the row covers |
| `model`, `effort` | The advice, as ranges you say to the user |
| `why` | The reason for the tier |
| `also` | What else the row covers, where it says |
| `keys` | The skill, or `skill:mode` in the skill's own mode names |
| `agent` | The single model and effort a workflow sets |

Two keys name no skill: `authoring`, for work on skills and plugins in the toolkit, and `long-form-prose`, for the row no skill owns. As modes, `grey` and `gray` both work.

### Modes that move the tier

Two skills appear twice, and the mode moves the tier. The skill name alone does not settle the route, so ask which mode first.

| Skill | Lower tier | Higher tier |
|---|---|---|
| `oklch-color-scale-system` | Free or grey mode: rule-following | Anchored mode, a brand colour failing contrast: a trade-off |
| `design-system-research` | Light: a few searches | Deep: multi-source synthesis |

### Skills with no row

- `ds-model-routing` has no row: it is not a task, but the thing you consult before one.
- `kirby-cms` has no row: it is a CMS working reference outside this table's scope. Routing CMS development work is not this skill's question.
- Every other design-systems skill in the toolkit has a row.

## In a workflow

A workflow script sets each `agent()`'s model and effort from the same table. A mechanical stage then runs on Sonnet, and a judging stage on Opus at high effort, without anyone choosing per run. This skill is the instruction to set `effort` there.

1. Run `node tools/shared/model-routing.mjs` from the toolkit. A script has no filesystem, so the routes go in as the Workflow's `args`.
2. Put its output in `args.routes`.
3. Spread a stage's route into its options, as below.
4. For a skill whose mode moves the tier, decide the mode before the stage. Such a skill has only `skill:mode` keys, such as `design-system-research:deep` or `oklch-color-scale-system:free`.

```js
agent(prompt, { ...args.routes['figma-components-audit'], phase: 'Audit' })
```

- A key that is not there spreads nothing, and the stage silently keeps the session's model.
- A Medium row's pick is `medium`, set explicitly, so a stage does not inherit a session running at `max`.
- A stage the table has no row for keeps the session's model and effort.

## Escalation triggers (regardless of task family)

Recommend stepping UP a tier, or raising effort, when the task involves:

- Ambiguous judgment calls (is this variant structure wrong, or just unconventional?)
- One-time design decisions (taxonomies, anchoring strategies, skill architecture)
- Long unsupervised multi-stage runs where errors compound
- Reconciling conflicting sources of truth (Figma vs code vs docs)

Recommend stepping DOWN when the task is:

- Deterministic (math, lookups, format conversion)
- Fully specified by an existing skill's procedure
- High-volume and repetitive (50 components × the same check)

## Context beats model choice

Well-structured context improves reliability more than a bigger model does. That means accurate component metadata, bound tokens, good descriptions and tight MCP servers. Practitioners report this again and again (TJ Pitre / Southleft, among others).

- If results on a design systems task are inconsistent, first check the library's metadata and the skills. Recommend a bigger model only after that.
- With good context, Sonnet at medium covers most of the table. Without it, even the top tier produces confident nonsense.

## Claude Code note

In Claude Code, routing can be *enforced* rather than advised; mention this to a user working there. Each agent definition can pin its own model, reasoning effort and tools in frontmatter. Examples: a cheap read-only explorer agent on Haiku or Sonnet, an audit agent on Sonnet, a skill-authoring agent on Opus. Offer to draft those agent files if relevant.
