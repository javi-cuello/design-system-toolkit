# Eval cases — humanizer (v2.9.4)


**Reviewed against v2.9.3 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Walked: 2026-08-10 (second walk) — pass (6/6), plus `python3 tests/test-scan-tells.py` 23/23.** Re-walked for 2.9.2, which made the scanner region-aware. H5 was amended: it previously asserted that the scanner reports hits inside examples and the model dismisses them, which was true when dismissing was entirely manual. The scanner now does the region half itself, so the case asserts the split and keeps the judgement half, which is the part no tool can take. Dogfooding is now cleaner evidence than before: `SKILL.md` reports 18 quoted hits and zero prose hits, and the run that introduced the split immediately found a real prose hit the old flat output had buried, namely the house version line's em dash on line 8.

**Walked: 2026-08-10 — pass (6/6), plus `python3 tests/test-scan-tells.py` 15/15.** The executable half is real: the scanner was run against fixtures and against `SKILL.md` itself. The six cases below were checked by reading, tracing each assertion to the instruction that mandates it, except H5 which was observed: running the scanner over `SKILL.md` returned twelve hits, every one inside a `>` blockquote in a **Before** example.

## H1 · Pasted-text mode delivers all three parts
Fixture: a paragraph pasted into the conversation with no file path and no mention of another task. It contains an em dash, a rule of three, and the word `vibrant`.
Assert: the reply contains a draft rewrite, brief bullets answering "what still reads as AI", and a final rewrite, in that order. The final rewrite has no em dash. Delivering only the final text is a failure in this mode, because the audit bullets are the part a user can argue with.

Traced: 2026-08-10 — to "Invocation Modes" (pasted text: deliver the draft, the audit bullets, and the final rewrite) and the closing paragraph of "Process and Output".

## H2 · A vague claim is never made specific by invention (negative case)
Fixture: the sentence "Experts believe the river plays a crucial role in the regional ecosystem", with no source given anywhere in the input and no source supplied by the user.
Assert: the rewrite either drops the claim or states it without the invented authority. It does not name a university, a study, a percentage, a date, or a named expert. Producing "A 2019 study by the Institute of Freshwater Ecology found..." is a failure of this case **even though it reads more human than the original**, which is the exact trade the skill forbids.

Traced: 2026-08-10 — to §5's closing parenthetical, "Never invent one to make a sentence sound sourced; an unsupported claim gets cut, not decorated", and step 3 of "Process and Output".

## H3 · A writing sample outranks the em dash ban
Fixture: the user supplies two paragraphs of their own previous writing that use em dashes roughly once per paragraph, then asks for a new draft to be humanized.
Assert: the final rewrite keeps em dashes at roughly the sample's frequency rather than removing them, and the reply does not claim the dashes were removed. §14's hard rule yields to Voice Calibration here. Scrubbing them anyway is a failure, because matching the author is the point and the dash ban is a proxy for it.

Traced: 2026-08-10 — to "Voice Calibration": a sample outranks this skill's style rules, including the em dash rule in §14.

## H4 · Discussed phrases are not rewritten (negative case)
Fixture: a style guide whose body includes the sentence `Avoid promotional wording such as "nestled in the heart of".`
Assert: the quoted phrase survives verbatim. The skill rewrites text that *uses* a watched phrase, never text that *names* one, per the secondhand-text entry in the false-positive list. Rewriting the quotation into "avoid promotional wording such as describing a location's setting" destroys the guide's meaning and is a failure.

Traced: 2026-08-10 — to the "Secondhand text" entry under "What NOT to flag (false positives)".

## H5 · The scanner reports; the model decides
Fixture: a document containing an em dash inside a fenced code block, an em dash inside a quotation attributed to a named person, and an em dash in the author's own prose.
Assert: `scripts/scan-tells.py` reports all three and separates them. The two inside the fence and the quotation are listed as quoted and do not set the exit code; the one in the author's own prose does. The rewrite changes only the third. Treating a quoted hit as a required edit is a failure of this case, and so is assuming the split is always right: the region rule is a good default, not a verdict, and a document that quotes itself badly can still need the quoted text changed.

> This skill's own `SKILL.md` is the standing fixture. The scanner finds 18 tells in it, all inside **Before** examples or inline code that exist to show the reader what the tell looks like, and reports zero in prose. A version of this skill that "fixed" them would delete its own teaching material. Version 2.9.1 did exactly that to two of them before the scanner learned to tell the difference.

Walked live: 2026-08-10 — `scripts/scan-tells.py` run over this skill's own `SKILL.md`: 18 quoted hits, zero in prose.

## H6 · Embedded mode outputs prose only (negative case)
Fixture: another skill calls this one as one step of writing a PR description, and passes it a draft.
Assert: the output is the final text and nothing else. No draft, no audit bullets, no summary of changes, no preamble. Returning "Here is the humanized version:" followed by the text is a failure, since that opener is itself pattern §20.

Traced: 2026-08-10 — to "Invocation Modes", embedded mode: output only the final text, no draft, no audit bullets, no summary.
