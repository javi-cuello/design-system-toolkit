# Eval cases — ds-model-routing (v1.2.10)

**Reviewed against v1.2.9 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Reviewed against v1.2.8 on 2026-09-10** — two rows added; the existing cases are unchanged.

**Reviewed against v1.2.7 on 2026-09-10** — rename only: the audit skill is now `figma-components-audit`; no case changed.

**Walked: 2026-08-21 — pass (5/5).** Re-walked for 1.2.5: one row for `component-validator`; A5's grep returns `kirby-cms` alone.

**Walked: 2026-08-21 — pass (5/5).** Re-walked for 1.2.4, which adds one row for `design-code-parity`. A5's row grep now returns `kirby-cms` alone, as the scoped claim says. A1–A4 re-read, unaffected.

**Walked: 2026-08-18 — pass (5/5).** Re-walked for 1.2.3, which adds rows for `figma-token-export` and `frontend-build`. Only A5 can see them, and running its row grep is what found the second: `frontend-build` had been rowless since it joined, undetected because nothing but this case looks. Both rows added, grep now returns `kirby-cms` alone — which is what the scoped claim says it should. The no-cross-reference grep still returns only this skill's own files. A1–A4 re-read, unaffected by table entries.

**Walked: 2026-08-12 — pass (5/5).** Re-walked for 1.2.2, which adds one table row for `figma-file-diff` and scopes the every-skill claim. Only A5 can see either change. Its row grep now finds a row for every skill except `kirby-cms`, which is exactly what the scoped sentence claims — the grep surfaced that gap, and the claim was corrected to match reality rather than the table stretched past its scope. The no-cross-reference grep still returns only this skill's own files. A1–A4 re-read, unaffected by table entries.

**Walked: 2026-08-10 — pass (5/5).** Re-walked for 1.2.1, which adds one table row for `humanizer`. Only A5 can see the change, and it still passes: re-ran its grep, and every skill in `skills/` has a row including the new one. A1 to A4 govern when and how routing is advised, which a table row cannot affect, so they were re-read rather than re-derived. Recording this walk rather than leaving the header to drift, because the drift warning is only useful if someone answers it.

**Walked: 2026-08-08 — pass (5/5), by reading rather than by running a live routing scenario.** A5 was checked against the shipped table: every skill in `skills/` has a row (verified by grep), the two mode-dependent skills appear twice, and `grep -rl ds-model-routing skills/` returns only this skill's own files. Earlier walk 2026-08-05 — pass (4/4). Checked against `SKILL.md` by reading: each assertion traced to the instruction that mandates it (A1 → the before-starting-work rule and step 3; A2 → "say nothing about routing and just proceed"; A3 → the opening "only the user can, via the model picker"; A4 → *Context beats model choice*). No live routing scenario was run.

## A1 · Routing is advised before work, not after
Fixture: a design systems task arrives on a model the table says is the wrong tier for it.
Assert: the recommendation is made *before* any work on the task begins, as a one-sentence note with the reason and an explicit continue-or-switch choice. Advising after the work is done is a failure — the point is to save the tokens, not to explain where they went.

Traced: 2026-08-05 — to SKILL.md's before-starting-work rule and step 3.

## A2 · A matching model produces silence (negative case)
Fixture: a mechanical audit running on the tier the table already prescribes.
Assert: nothing is said about routing at all; the task proceeds directly. Confirming the model is correct is noise and counts as a failure.

Traced: 2026-08-05 — to SKILL.md's "say nothing about routing and just proceed".

## A3 · The skill never claims to switch the model
Fixture: the user replies "yes, switch."
Assert: the response explains that only the user can change model or Effort, via the model picker — it never asserts a switch has happened. A claimed switch is the worst failure available here, because the session silently continues on the old tier.

Traced: 2026-08-05 — to SKILL.md's opening, "only the user can, via the model picker".

## A4 · Context problems are not answered with a bigger model
Fixture: inconsistent results on a library whose metadata and token bindings are unverified.
Assert: the recommendation checks library metadata and skill quality first, rather than escalating tier. Escalating without that check is a failure.

Traced: 2026-08-05 — to SKILL.md's *Context beats model choice*.

## A5 · The table routes by skill as well as by task family
Fixture: "run the audit on this library" with the session on Opus.
Assert: the recommendation names the `figma-components-audit` row and suggests stepping *down* to Sonnet, since a long mechanical MCP run wants thoroughness rather than deep reasoning. The Skill column exists so a request naming a skill does not have to be mapped onto a task family by hand first.
Assert the mode-dependent rows are not answered from the skill name alone: `oklch-color-scale-system` and `design-system-research` each appear twice, and asking which mode is required before routing. Answering "Sonnet, it's oklch" for an anchored brand colour that fails contrast fails this case.
Assert the negative: this skill is **not** referenced from any other skill's files, and must not be. Model choice happens before a skill loads, only the user can act on it, and ten embedded copies of one conclusion is the drift pattern this repo has fixed twice — in the context template's restatement of the working rules (now toolkit-standard §D 14, 15 and 16, and figma-standard rule 17), and in the audit's competing description structure.

Walked live: 2026-08-21 — the shipped table, grepped for a row per skill in `skills/`; returns `kirby-cms` alone.
