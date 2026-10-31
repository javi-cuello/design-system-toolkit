---
name: ds-model-routing
description: Advise on the right Claude model and Effort setting before starting any design systems task — library audits, contrast matrices, token tables, doc generation, OKLCH scales, component passes, plugin/skill creation, or design systems research. Use this skill at the START of any such task, even if the user doesn't ask about models, so they can switch before burning tokens on the wrong tier. Also use whenever the user asks which model or effort level to use, whether a task "needs Opus/Fable", or how to conserve rate limits on design systems work.
---

# Design systems model routing

**Version 1.2.10** — history in CHANGELOG.md.

Claude cannot change the model or Effort setting itself — only the user can, via the model picker. This skill's job is to check the current task against the routing table below and, when there is a mismatch, tell the user **before starting work** so they can switch. If the current model/effort already fits, say nothing about routing and just proceed.

## How to use this skill

1. Identify which task family the request belongs to (table below).
2. Compare against the model currently powering the session (from the system prompt) and, if known, the effort level.
3. If there's a mismatch, give a one-sentence recommendation with the reason, e.g.:
   - "This is a mechanical audit — Sonnet at default effort handles it and uses far less of your limit. Want to switch, or continue here?"
   - "Designing a new skill is one-time work that compounds — worth switching to Opus or Fable at high effort before we start."
4. If the user declines or doesn't respond to the suggestion, proceed with the current model without further comment. Never repeat the suggestion in the same conversation.
5. If the effort level isn't visible, only mention effort when it clearly matters (highest for plugin design and deep research; low is fine for pure math tasks).

## Routing table

| Task family | Skill | Model | Effort | Rationale |
|---|---|---|---|---|
| Library audit (component lint, token bindings, variant checks) | `figma-components-audit` | Sonnet | Default | Long mechanical MCP runs; thoroughness, not deep reasoning |
| Variable/style existence audit | `figma-variable-audit` | Sonnet | Low–default | Deterministic key lookups |
| Two-file diff (fork vs master, duplication check) | `figma-file-diff` | Sonnet | Default | Hashing and comparison live in scripts; what's left is procedure discipline (identity checks, stability re-runs) and saying what each difference means |
| Contrast matrix / ratios grid | `figma-contrast-matrix` | Sonnet | Low–default | Pure WCAG math + structured writes |
| Documentation generation / regeneration | `figma-doc-generator` | Sonnet | Default | Mirrors library data into tables |
| Token export to DTCG / Style Dictionary | `figma-token-export` | Sonnet | Default | Conversion and manifest logic live in a tested script; what's left is reading the skip/warning report and deciding the three project questions (colour format, unit, opacity scale) |
| Tokens mapping example tables | `figma-tokens-examples` | Sonnet | Default | Skill-guided, repeatable |
| Properties table for a component page | `figma-properties-table` | Sonnet | Low–default | Reads `componentPropertyDefinitions` and renders it; the component decides the content |
| Writing component descriptions | `figma-component-descriptions` | Sonnet | Default | Structured short-form prose against a recorded per-project shape. Step up where the judgement is *boundary* work — whether a component is one thing or two, whether a child is slot-only |
| OKLCH scale generation (standard) | `oklch-color-scale-system` | Sonnet | Default | Rule-following once the method is defined |
| Brand-color anchoring problems, ramps failing contrast | `oklch-color-scale-system` (anchored / hue-drift modes) | Opus (or Sonnet at high) | High | Genuine judgment and trade-offs |
| Capturing a project's conventions | `figma-context-capture` | Opus or Fable | Default–high | Read-only, but the output is what **every** later run hydrates from, so an error propagates instead of surfacing. Its hard parts are exactly the escalation triggers below: ambiguous convention calls, contradictory evidence, and knowing when to leave `[TBD]` rather than infer |
| Full component pass (audit + properties + descriptions) | `figma-component-pass` | Opus or Fable | Default–high | Multi-stage autonomy; model must catch its own mistakes |
| Creating or revising skills/plugins | `figma-plugin-creator`, and authoring work in this repo | Opus or Fable | High | One-time design decisions that compound; bad skills fail silently forever |
| Validating Figma components for a target platform (web, iOS, Android) before the build | `component-validator` | Sonnet | Default | The detectors are a tested script per target; what is left is reading each hit against the context document and the target's reference, and putting Figma / code / accept to the designer. Step up only when a finding's class is new to the reference, or a framework's own constraints must be read on top of the platform set |
| File-level audit (page order, names across the library, part prefixes) | `figma-foundations-audit` | Sonnet | Low–default | The checks live in a tested script; what is left is judging whether a flagged component is really a part |
| Whole-project audit (every audit into one record and dashboard) | `figma-project-audit` | Sonnet | Default | Sequencing only; each stage carries its own reasoning |
| Setting up or reading a design–code parity loop (snapshot, specs, stories, gates) | `design-code-parity` | Opus or Fable | Default–high | The scripts are written per project against a contract, and each waiver or gate decision is a ruling that outlives the session; reading a red report is Sonnet work once the loop exists |
| Building a front end from a design (HTML/Sass/tokens) | `frontend-build` | Sonnet | Default | Implementation against a design that already decided the hard parts; step up where the *architecture* is the question — stylesheet structure, theming strategy, breakpoint model |
| Light design systems research (few searches, cited answer) | `design-system-research` (light mode) | Sonnet | Default | Quick synthesis |
| Deep research (Research feature, many sources) | `design-system-research` (deep mode) | Opus or Fable | High | Broad multi-source synthesis earns the premium |
| Long-form docs prose, guides, narrative writing | — | Fable | Default | Tuned for long-form generation |
| Editing prose to remove AI tells | `humanizer` | Fable | Default | A rewriting job, which is what Fable is tuned for. The mechanical tells are handled by its scanner, so what is left is judgement about register and about which hits are quoted rather than used. Step up only when the source is dense technical prose where a wrong "simplification" would change a claim |

**Two skills appear twice, and the mode is what moves the tier** — `oklch-color-scale-system` in free/grey mode is rule-following, but anchored mode with a brand colour that fails contrast is a trade-off problem; `design-system-research` light is a few searches, deep is multi-source synthesis. Ask which mode before routing, because the skill name alone does not settle it.

**`ds-model-routing` is not in the table** because it is not a task — it is the thing you consult before one. Every other design-systems skill in the toolkit has a row; `kirby-cms` has none because it is a CMS working reference outside this table's scope, and routing CMS development work is not this skill's question.

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
