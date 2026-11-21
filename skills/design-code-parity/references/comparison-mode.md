# Comparison mode and the component inventory

The measurement run as a report with nothing blocking. The audit of a library built elsewhere. The name-only comparison of which components each side has. [SKILL.md](../SKILL.md) links here.

## Contents

- [Comparison mode: a report, not a gate](#comparison-mode-a-report-not-a-gate)
- [What it needs](#what-it-needs)
- [What it reports](#what-it-reports)
- [A library built elsewhere](#a-library-built-elsewhere)
- [Promotion to the full loop](#promotion-to-the-full-loop)
- [Before measuring: which components exist on each side](#before-measuring-which-components-exist-on-each-side)
- [Resemblance is a suggestion, never a pair](#resemblance-is-a-suggestion-never-a-pair)

## Comparison mode: a report, not a gate

The measurement is the loop's core, and it works without the gates around it. Comparison mode runs it alone. Figma is canonical, and the report lists every difference by component, variant, layer and property, with both values. Nothing blocks.

Use it on a codebase that drifted before the loop existed, or on one the loop will never govern. Use it too when the question is "how far apart are these?" rather than "may this ship?".

## What it needs

It needs two inputs and no more:

- **The snapshot**, taken as the loop takes it. The design side is read by a machine at a release, never typed.
- **A mapping**: for each Figma variant, the URL or story that renders it, and for each layer, the selector of the element that plays it.

Nothing can infer the mapping. An element is the `Content` layer only because someone said so. So it is the one thing a person writes, and it is small. There are no waivers, no `unmeasured` entries and no backlog.

## What it reports

The report lists what it compared and, separately, what it could not:

- variants with no mapping;
- layers with no selector;
- selectors that matched nothing;
- values it could not name.

Those appear as *not compared*, never as passes and never as failures. A report that folds "unmapped" into "matches" is the silent skip code-standard rule 33 forbids. One that folds it into "differs" will be ignored by the second run.

The children check (code-standard rule 31) runs on every mapped layer, because drift in what a frame holds is the kind geometry hides.

A hand-written description of the code is not a substitute for the measurement. A tool that scores a typed code spec against a Figma node measures the typist, not the page. The Figma Console MCP has one, and a wrong transcription scores 100%. Render and read computed styles, or say plainly that the result is a reading and not a check.

## A library built elsewhere

A library built elsewhere is compared through the code audit, `tools/parity/external.mjs`.

| Side or fact | Where it comes from |
|---|---|
| The design | Each component's contract (`tools/component-contract`) |
| The code | The library's own Storybook, rendered |
| The code's API | The component's types, through what it extends, down to its framework's |
| The framework's facts | Its profile in audit-defaults `frameworks`, which the library's `framework` names |
| The library's own facts | Its context document, as `code.parity`, read by `project.mjs` `loadParity` |

The framework's facts are where its types are, its wrapper and root-class names, the props every component inherits, and its words for a prop's job. No framework is known to the code itself. The library's own facts are its repo, how its Storybook is built, its one tier, its token files and where its mappings are.

The engine's one session builds the Storybook into the project's home, where the docs site serves it.

**Props are joined by rule**: the same words, a shared vocabulary, or an enum the code accepts. So the project's mappings hold only what no rule can know: the story, a value spelled differently, and rulings. They use the one mapping format every project uses (`tools/parity/REFERENCE.md`, *The mapping format*). It is keyed by Figma's own names, with a layer by its stored path.

**Elements are paired by rule too** (`tools/parity/pair.mjs`). A contract element lands on the rendered element that shows the values it defines. A mapped layer is a ruling over the rule: another element, other fields, or `skip` with why.

**A mapping is checked when it is read**. A name the design does not have is refused, and so is a layer that is not exactly one element. A mapping that keeps props Figma has since renamed would otherwise be ignored in silence.

**The run checks its own mapping before any difference counts**. An element whose selector matches nothing, or whose fields mostly never match, is reported as a suspect mapping, never as findings. Tokens are compared the same way, name by name.

The report is shown on the docs site's Parity pages: Overview, Tokens, Properties and Visual. Figma is the reference, so a difference is said of the code, in one wording:

| Finding | Wording |
|---|---|
| The code's value differs | *Code differs* |
| The code names it differently | *Code renames it* |
| It renders alike | *Code looks the same* |
| It agrees | *Matches Figma* |
| Only the design has it | *Only in Figma* |
| Only the code has it | *Only in code* |

Mixed wording such as "Not in code" beside "Only in code" reads as comparing in both directions. A reader cannot tell what drove what. The test `tools/docs-site/test-parity-pages.mjs` refuses the retired words.

## Promotion to the full loop

Promotion is additive. Nothing written for comparison mode is thrown away.

1. The same mappings, in the same format, move beside the code (`parity.mappings`). What they leave out is then unrendered rather than joined by rule.
2. The differences that are accepted become waivers with reasons.
3. The unmapped variants become `unmeasured` entries, or get mapped.
4. The gates are turned on.

## Before measuring: which components exist on each side

The first difference between a design and its code is the plainest, and needs no rendering. It is a component one side has and the other does not. Comparison mode's measurement cannot see it, because a component with no counterpart has no mapping to measure.

The comparison is by name and nothing looser. A Figma component is in code when the code has a component of its name, written any way. "Autocomplete input" is `AutocompleteInput`. It is also in code under the name the project records it is built as in its framework. That name is what the code was written to, so it outranks Figma's.

A component in code is a folder holding a file of its own name. The project names the code on the library in its audit settings (`code: { repo, components }`). The comparison itself is `tools/shared/code-inventory.mjs`, the one the docs site's Parity page and the audit both use.

## Resemblance is a suggestion, never a pair

"Text area input" and `TextArea` are probably one component, and nothing in the two names proves it. So the audit's Code parity stage asks.

1. It hands the components left unpaired on each side to the judge, with [`scripts/pairing.txt`](../scripts/pairing.txt).
2. It files each proposed pair as this skill's row: `where` is the Figma component, and `key` is `pair|<code name>`.
3. A person confirms or dismisses it.

The project's rulings go into the question, so a pair once rejected is not proposed again. An answer naming a component on neither list is dropped, since a row about something that does not exist could never be closed. Nothing counts a suggestion as a match, and no page draws one as a pair.
