# The stages

Why the order holds, what each stage owns and hands on, and the judgements at the checkpoint and the descriptions stage. [SKILL.md](../SKILL.md) steps 2, 4, 5, 6 and 7 point here.

## Contents

- [Why this order](#why-this-order)
- [Scope](#scope)
- [What each stage owns](#what-each-stage-owns)
- [The audit](#the-audit)
- [The checkpoint](#the-checkpoint)
- [The properties table](#the-properties-table)
- [Descriptions](#descriptions)
- [Unbound text: a defect or not](#unbound-text-a-defect-or-not)

## Why this order

The Properties table mirrors `componentPropertyDefinitions`. The description quotes axis, property and value names verbatim. Both are **derived from the component's interface**.

The audit is the only stage that can **change** that interface. It may rename an axis, add a missing text property, or correct a mis-suffixed property. So it goes first. Run last, any fix it applies silently makes a table and a description from minutes earlier wrong. Nothing downstream notices, because both still look well-formed.

The concrete failure: a `Status` axis is renamed to `Feedback`. The Properties table keeps a `Status` row, and the description's Behaviour section names an axis that no longer exists. Neither looks broken. Both are wrong.

The table comes before the description because they read the same interface but differ in kind. The table is mechanical mirroring; the description takes judgement.

- Each stage reads the interface itself and takes no other stage's reading.
- The table reads it through `PT.plan()`; the descriptions read it through `enumerate.js` and `composition.js`.
- The table goes first because its own `audit()` checks it before any prose exists.
- The descriptions' `verify.js` re-reads `componentPropertyDefinitions` when it verifies. A component that changed between the two stages shows there, before the pass is reported.

## Scope

This skill decides only what the pass runs on. Every reading of the component is done by the stage that owns it.

Do not list the page's components in step 2. Each stage finds its own subjects in that scope:

| Stage | Finds its subjects with |
|---|---|
| Audit | its scanner |
| Properties table | `PT.plan()` |
| Descriptions | `enumerate.js` |

A list built here would be a fourth reading that none of them checks (toolkit-standard §D 4, §D 23).

## What each stage owns

**The interface**: properties, variants, nested instances resolved to their mains, and slots. Step 6's `PT.plan()` reads it for the table, and step 7's scripts read it again for the descriptions. This skill hands neither reading to the other.

The stages' walks key the instance dedupe on **the variant and the instance name together**, never the name alone. Take a stepper whose slot children are all named `Step item`. They resolve to `Step item / Horizontal` under one Layout value and `Step item / Vertical` under the other. A set-wide dedupe on the name keeps only whichever came first.

That short list is correct as far as it goes, so nothing downstream flags it. The descriptions stage's `composition.js` keys it per variant, and its own suite fails when the key is the name alone. So this skill carries that stage's composition list on and never recounts it.

**The library's vocabulary**: `audit-settings`, the house defaults and §6 rulings. Each stage reads them from the context document itself.

**The documentation conventions and the slot-only question.** Which targets are consumer-facing, and which are documented through a parent? `figma-component-descriptions` settles both before it writes. The second changes which descriptions are written and how the parent's Composition section reads. Where the library's naming convention and the slot-only heuristic disagree, that stage puts the precedent before the user. This skill carries the answer into the report.

## The audit

`figma-components-audit` reads the project's settings itself. This skill neither opens its files nor re-implements its checks. A skill that reads another's files is coupled to its internals and breaks when they move. That is why every stage is run by name.

## The checkpoint

The audit's "confirm before fixing" step is load-bearing, not a formality. It stops an unattended pipeline from restructuring someone's component. **Running inside this bundle is not implicit approval.** Present the findings and wait.

Then branch on the answer:

| Answer | What follows |
|---|---|
| No findings, or none that touch the interface | Continue to step 6. Layer names, unbound spacing or missing text styles are worth fixing, but they don't change what a consumer can set. |
| Interface-changing fixes approved and applied | Re-run detection on the same component to confirm each finding cleared, then continue. Steps 6 and 7 mirror the corrected component. |
| Fixes declined or deferred | Continue anyway: a table that mirrors an odd component is doing its job. The report names each open finding the table and description mirror. |

When presenting, flag interface-changing fixes as such. Flag breaking ones by the audit's two kinds:

- **Breaks the API.** A variant property or option rename keeps every instance and override. It breaks Code Connect mappings, scripts that set properties by name, and Swap library.
- **Loses consumers' work.** Deleting or retyping a property, re-pointing a nested instance, deleting a slot property, or renaming a layer in only some variants.

Never say a rename rewrites instance overrides. Tested in Figma, it does not.

## The properties table

`figma-properties-table` loads its own script and verifies its own tables. This skill does not load or call that script. Step 7 takes nothing from it as input: its own scripts read the interface.

## Descriptions

`figma-component-descriptions` reads the description format from the project's settings itself.

The interface check is that stage's own verification, not a comparison made here:

- Its `verify.js` re-reads `componentPropertyDefinitions` at verify time.
- It names every axis a description does not quote, and every quoted name the file does not define.
- Its `sections.mjs --check` names every generated Behaviour, Composition or Usage line a description lacks.

**That check runs against a fresh read, and it is load-bearing.**

In a shared file the component can change while you document it, and the change does not announce itself. A check against a plan captured minutes earlier agrees with itself and reports clean; `verify.js` re-reads by construction.

When the check fires, **re-run steps 6 and 7 together**, never the description alone. A table and a description of different versions of one component is the exact drift this skill prevents.

Apply the descriptions. The stage's own step 8, its verification and enumeration sweep, confirms nothing public was missed and nothing outside scope was written to. This skill reports what it returned.

**Do not document a defect as though it were a feature.** Say the audit found a hardcoded text layer with no property. Leave it out of the description rather than calling it fixed content. Note in the report that the description will need a line once it is fixed. Writing around a known defect quietly bakes it in.

## Unbound text: a defect or not

Decide first whether the unbound text is a defect at all. **Most text layers do need a text property.** The finding stands unless one of two narrow exceptions applies `[maintainer ruling]`:

| Exception | What it means | Examples |
|---|---|---|
| Static by design | The text names a fixed thing, not content anyone supplies. A property invites changing a value that should not change. | Weekday headings in a calendar grid, a mandatory-field asterisk, a currency symbol |
| Written by code at runtime | No one types it in Figma, so a text property would go unused. **Rarer than it looks**: confirm the value is produced at runtime. | A live `Uploading - 64%` readout |

The test is **whether a consumer would ever legitimately set it**, not whether it is editable today. A filename, a caption, a heading or a label is a gap. `Mo Tu We Th Fr Sa Su` is not.

**Treat both exceptions as the minority they are.**

An easy exclusion swallows the findings the check exists to produce, and "it's probably static" fits any text at all. Where the answer is unclear, report it as a question rather than resolving it either way. One real library held five components with unbound text: two static by design, one runtime-driven, two genuine gaps.
