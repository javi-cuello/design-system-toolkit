# Eval cases — design-system-research (v2.8.0)

**Walked: 2026-10-31 against v2.8.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.


**Walked: 2026-10-12 for 2.7.0** — A16 added and observed: the day's loading-indicator run started from actions.md *Loading buttons* and feedback.md *Loading*, re-opened Primer, and corrected feedback.md's stale Primer line in place. A1–A15 unchanged: the clause adds a first read inside Step 1 and changes no step they test.

**Walked: 2026-10-11 for 2.6.0** — A15 added and traced to the new Step 8. A1–A14 unchanged: Step 8 adds a step after the deliverable and changes none of the steps they test.

**Walked: 2026-10-01 for 2.5.0** — A14 added and observed: the two guides it comes from tested seventeen behaviours and mark each as tested. A1–A13 unchanged; the change is one Step 6 line.

**Reviewed against v2.4.1 on 2026-09-20** — citation only: the four standards governing the toolkit's parts became `standards/toolkit-standard.md`, and this skill's references point at its §A. No rule and no case changed.

**Walked: 2026-08-10 (fifth walk of the day) — pass (13/13).** A13 added and traced to the new Step 6 clause on developer/API docs outranking help-centre prose and search summaries. A10 amended: its grep assertion widened to match, and a second grep added for the new "no narrator" voice rule; both traced directly to a real guide produced this session, not to a hypothetical, so this counts as observed rather than merely traced for A10's revised half. A1–A9 and A11–A12 re-read against 2.4.0 and unchanged: the three changes touch self-reference checking and one research-method step, none of which the deliverable path, evidence hierarchy beyond the one new Step 6 line, register shape, or index/checklist mechanics depend on.

**Walked: 2026-08-10 (fourth walk of the day) — pass (12/12), A12 traced only, reader check pending.** A12 added and traced to the two new voice-file clauses ("State the claim before the caveat" and "At most one recurring image, and most guides need none") and to their placement against the existing rules they were checked not to duplicate ("Mixed feelings allowed" for the caveat ordering, "State things; don't perform them" for the image restraint). Per skill-standard §A clause E's reader rule, a rule about sentence-level register is not fully walked until a person reads it against real output; none has been produced under 2.3.0 yet, so this line says trace rather than claiming more, and the case should be re-walked as a read the next time this skill's deep mode runs. A1–A11 re-read against 2.3.0 and unchanged: both new rules are additive within Voice rules and touch neither the deliverable path, the evidence rules, the register's structural shape, nor the index/checklist mechanics A11 pins.

**Walked: 2026-08-10 (third walk of the day) — pass (11/11).** A11 added and traced to the new index clause in the voice file's structure block and the compressed checklist. A1 to A10 re-read against 2.2.0. None can distinguish it: the index requirement adds an artefact none of them assert, and the checklist compression merged overlapping lines without dropping a requirement, which was verified by checking each of the five removed items against the line that absorbed it. Per skill-standard §A clause E, this walk is a **trace**, not a reader check. A11's index half is mechanical and a trace is sufficient for it; A9's register assertions remain reader-evidenced from the 2.0.0 correction and were not re-tested here.

**Walked: 2026-08-10 (second walk of the day) — pass (10/10).** A10 added and traced to the new voice-file section "Narrate changes in the world, never changes in the document", the new "What to leave alone" section, and the new grep line in the checklist. A1–A9 re-read against 2.1.0 and unchanged: 2.1.0 adds a placement rule for corrections and a restraint clause, and touches neither the register (A9), the example requirements (A8), the evidence rules (A2, A3, A5), the deliverable path (A1, A4), the sources rule (A6) nor the per-axis verdict (A7). Both new rules were derived by auditing the seven guides 2.0.0 produced against the `humanizer` skill's patterns, which is the first time a rule in this skill has come from running a second skill over its output.

**Walked: 2026-08-10 — pass (9/9).** A9 added and traced to the four new clauses: the question-title and short-answer rules in the voice file's structure block and its new "Titling sections as questions" section, the tables-support-prose rule in Step 7 and the voice file's own section, the system-story clause in Step 5, and the five new checklist lines. **A8 was amended in the same pass**, because 2.0.0 contradicts the assertion it shipped with: A8 required "a table wherever two or more things are compared", which is exactly the rule this revision reverses. The case now asserts the worked-example and named-trap requirements it was really written for, and hands the register question to A9. A1–A7 re-read against 2.0.0 and unchanged: A1 pins that the voice file is read and a rewritten file delivered, which is orthogonal to what the file says; A6's links clause survives verbatim in the rewritten Mechanics section; A7's per-section verdict survives as the `**What to do.**` block ending every numbered section; A2, A3 and A5 govern evidence rather than form.

**Walked: 2026-08-09 (fourth walk of the day) — pass (8/8).** A8 added and traced to the new Step 5 example clause, the new Step 7 mechanism clause, the rewritten `references/deep-mode-voice.md` structure block, and the two new checklist lines. A1–A7 re-read against 1.5.0. Two needed checking rather than assertion, because 1.5.0 rewrote the file they depend on: **A6** still passes (the voice file's Mechanics section retains the links-at-deepest-URL clause verbatim and now names the "Cited but not resolved to a URL" heading the properties guide already uses), and **A7** still passes (the structure block retains `**Recommendation.**` ending every numbered section, and the consolidated recommendation is explicitly "in addition to the per-section verdicts, never instead of them"). A1 holds unchanged: the mechanic it pins is that the voice file is read and a rewritten file delivered, which is orthogonal to what that file now says. A2, A3 and A5 govern evidence rather than form and cannot distinguish the two revisions.

**Walked: 2026-08-09 (third walk of the day) — pass (7/7).** A7 added and traced to the amended Step 5 clauses. A1–A6 re-read against 1.4.0 and unchanged: 1.4.0 constrains how an argument is built and where verdicts sit, not which mode runs, what gets verified, or what the deliverable is.

**Walked: 2026-08-09 (second walk of the day) — pass (6/6).** A6 added and traced to the new Step 7 clause it pins. A1–A5 re-read against 1.3.0 and unchanged: the link requirement constrains how a sources section is written, not which mode runs, what gets verified, or what the deliverable is.

**Walked: 2026-08-09 — pass (5/5).** Checked against `SKILL.md` by reading, not by running a live research task: each assertion was traced to the instruction that mandates it. 1.2.0 changes only `references/system-sources.md`, so A1–A4 were re-read and left untouched — none of them can distinguish a longer roster from a shorter one. A5 is new, and was written *because* of the change: the roster now names an index and a survey series, and Step 2 puts both in tier 4, so the failure they invite needed pinning before it happened rather than after.

**Earlier walks.** 2026-08-08, reviewed against v1.1.1 (formatting only — prose reflowed, verified word-for-word identical ignoring whitespace; no case could distinguish the two revisions). 2026-08-05 — pass (4/4), the first walk; A4 was amended during it, see its note.

## A1 · The Research artifact is never the deliverable
Fixture: deep mode; Claude's Research feature returns its report artifact.
Assert: in the same turn, `references/deep-mode-voice.md` is read and a rewritten guide file is produced and presented. Announcing or summarising the raw artifact and stopping is a failure, however polished the artifact looks.

Traced: 2026-08-09 — to SKILL.md's deep-mode instruction that the voice file is read and a rewritten guide delivered.

## A2 · Secondary-sourced claims are verified or dropped
Fixture: a claim about a named system that appears only in a third-party write-up, with the system's own docs silent on it.
Assert: the claim is verified against primary sources before assertion — otherwise dropped or stated as uncertain. Never asserted flat on the secondary source alone.

Traced: 2026-08-09 — to SKILL.md's evidence rules, by reading rather than by running a live research task.

## A3 · Adoption does not outrank user outcomes
Fixture: six rostered systems ship pattern X; one published user-research finding points against it.
Assert: the user-research evidence is weighted above the shipping consensus, and the disagreement is stated rather than averaged away.

Traced: 2026-08-09 — to SKILL.md's evidence rules, by reading rather than by running a live research task.

## A4 · Light mode produces no file (negative case)
Fixture: a single bounded question — "boolean prop or enum for icon position?"
Assert: the answer lands in chat with citations, in one turn. No markdown file is written, and the Research feature is not launched as the route to the deliverable. Writing a guide here is a failure even if the guide is good.

> Amended on the 2026-08-05 walk. The case originally asserted the Research feature "is not offered" at all, which the skill contradicts by design: "start light … ending by noting what a deeper investigation could add is always acceptable." The skill's behaviour is right and the assertion was over-strict, so the case was narrowed to the deliverable path rather than the mention.

Traced: 2026-08-09 — to SKILL.md's light-mode deliverable path ("start light … ending by noting what a deeper investigation could add is always acceptable").

## A5 · An index is cited through, never cited (negative case)
Fixture: The Component Gallery shows five systems calling the same component "Disclosure"; a practice survey reports a token-adoption percentage.
Assert: the output cites those five systems' own documentation for the naming claim, and the index appears at most as how they were found — never as the evidence that five systems agree. The survey may evidence the state of the practice; it may not be used as a claim about any single system, and it does not outrank a user-research finding. An index or survey standing as the sole support for a claim is a failure even when the claim is true.

Traced: 2026-08-09 — to Step 2's tier 4 ("use only as a convenience … flag them as convenient rather than canonical").

## A7 · Every axis gets its own verdict, and every claim its mechanism
Fixture: a deliverable covering five decision axes, one of which has a shipping system on each side and no clear winner.
Assert: each of the five sections ends with its own marked recommendation, and the consolidated blueprint at the end is in addition to them, not instead. Each recommendation states a causal why (what breaks, what it costs, who pays), not an appeal to who does it. The undecided axis still gets a verdict, phrased as judgment with the split named, rather than a survey that declines to resolve. No approach in the document carries only disadvantages, and the advantages are as specific as the disadvantages.

> Added at v1.4.0. Found by reading a delivered guide against the checklist rather than by any check: it argued well, cited well, and resolved exactly once, on the last page, which left twelve of its twenty sections ending on a survey. The pros-and-cons rule had existed since 1.0 and was being satisfied by presence rather than by weight.

Traced: 2026-08-09 — to the amended Step 5 clauses.

## A6 · Sources carry links, and absent links are admitted
Fixture: a deliverable citing eight pages from one help centre, one GitHub issue, one book, and one document the run knew of but never opened.
Assert: every source is a list item with a resolvable link at the deepest URL actually resolved. The eight help-centre pages get eight lines, not one prose run. The book, having no canonical URL, and the unopened document both say so on their line. No URL is invented for anything. A correctly split and labelled sources section with no links is a failure of this case even though it passes every other one.

> Added at v1.3.0 from a production failure, not a review: a 550-line guide shipped with a sources section that was correctly split into primary and commentary, correctly labelled, and entirely unlinked. Every prior case passed on it. The skill had specified the split since 1.0 and never the link.

Traced: 2026-08-09 — to the new Step 7 clause it pins.

## A8 · Costs are worked, not asserted
Fixture: deep mode on a topic with four decision axes. Each advantage is illustrated through a named system's history; each disadvantage is stated as a one-line caution.
Assert: mechanism is explained before verdict. Every major claim carries a worked before/after case with real values a reader could reproduce in their own file, and every decision with more than one failure mode carries a run of named traps stating what each looks like and what it breaks. A guide that scopes well, cites well and argues well, but shows its advantages concretely while stating its disadvantages abstractly, fails this case on that asymmetry alone.

> Added at v1.5.0, **amended at v2.0.0.** As written it also asserted the register: numbered sections, a core-problem table early, and "a table wherever two or more things are compared". 2.0.0 reverses that last clause, so the case would have failed a conforming guide. The register assertions moved to A9 and the example requirements stayed here, which is what the case was really for. The lesson worth keeping: a case that pins form and substance in one assertion cannot survive a change to either.

Traced: 2026-08-09 — to the new Step 5 example clause and the new Step 7 mechanism clause.

## A9 · The reader finishes each section knowing what it said
Fixture: deep mode on a topic with six decision axes. The draft has numbered sections titled with topic nouns (`## 3. The boolean prefix`), each opening with a comparison table of five systems and closing with a one-sentence marked recommendation. Every claim is cited and correct.
Assert: the delivered file fails and is rewritten. Sections are titled as the question a practitioner asks (`## 3. Should it be isDisabled or disabled?`), each opens with a short plain-language answer a reader could stop at, and each closes with advice rather than a ruling. The concepts are introduced in prose before any table uses them, and every surviving table passes both keeping tests: understandable from the surrounding prose alone, and its removal would lose information rather than tidiness. A `What this answers` opener lists the questions in the order they arrive, and a standalone `The short version` section works for a reader who reads nothing else. At least one otherwise-abstract claim per part is carried by a named system's story.
A guide that is accurate, well cited, correctly structured and passes A1 through A8 still fails this case if a reader could finish one of its sections unable to state that section's conclusion.

Traced: 2026-08-10 — to the question-title and short-answer rules, the tables-support-prose rule in Step 7, and the system-story clause in Step 5.

## A10 · Corrections go at the end, no narrator appears, and a good section is left alone
Fixture: a revision of an existing guide. Three of its claims have expired: CSS gained a unit the guide called invalid, a browser shipped a feature the guide called unsupported, and one recommendation cited a technique that does not actually permit it. A fourth section is unchanged and already reads well. The draft under test also carries two stray first-person asides in its advice ("the default I would suggest," "the one I got wrong first time").
Assert: the body of each revised section states the current truth without reference to what the guide previously said. The two changes in the world are narrated in the body, because they are the most interesting thing in their sections. The guide's own error is corrected silently in the body and recorded in `What to re-check later`. `grep -niE "previous version|earlier draft|earlier revision|prior revision|this guide previously|got .{0,15}wrong|has been corrected|been reverted"` over the body, excluding the sources and re-check sections, returns nothing. `grep -woiE "\bI\b|\bmy\b"` over the body, excluding quoted titles and proper nouns, also returns nothing: the two first-person asides are rewritten to state the position without a narrator. The fourth section is returned unchanged, and rewriting it is a failure of this case even if the rewrite is good.

> Amended at v2.4.0: the grep widened from `previous version\|earlier draft` to also catch "earlier revision," "prior revision," "this guide previously," "got wrong," "has been corrected" and "been reverted," and a second grep added for stray first-person. Both changes trace to the same production guide: six real self-referential lines in it matched none of the original narrow pattern, and two more were bare first-person the rule set had never named. A rule existing and being violated in the wild, unnoticed by its own check, is exactly what clause 4 of this repo's own "before calling a session done" list warns about.

> Added at v2.1.0. Found by running the `humanizer` skill's pattern list over the seven guides this skill had just produced, which is a different method from the previous nine cases and worth noting as one: almost nothing fired, because the voice rules already ban the loud tells, and the two things that did fire were both invisible to a maintainer reading for correctness. The diff-anchored half had five sites across three guides, all of them opening a section by correcting an earlier draft of itself. The leave-it-alone half is the older lesson, since both of this skill's known failures were over-corrections: 1.5.0 turned an essay into wall-to-wall tables, and 2.0.0's first pass stripped one guide from thirteen tables to one before settling.

Walked live: 2026-08-10 — both greps run over a real guide produced that session, which the walk line records as observed rather than merely traced.

## A11 · A long guide has a way in, and the checklist stays readable
Fixture: deep mode on a topic that decomposes into 21 sections across three parts. The draft carries a `What this answers` opener listing the questions in the order they arrive, and no index.
Assert: the opener also carries a linked index, grouped by part, covering every numbered section. Every anchor resolves to a real heading, and the anchors were generated from the headings rather than typed. A guide of eight sections is returned without an index and adding one is a failure there, because the question list already does that job at that length.
The second half is a standing constraint rather than a fixture: the quality checklist in `SKILL.md` stays under about 15 items. A revision that adds a checklist line without either merging two or showing the new line covers something no existing line does fails this case.

> Added at v2.2.0, both halves from this skill's own output. The index half: a 587-line guide shipped with 21 sections and no way to reach one, because the structure block had a question list and nothing else. The checklist half is the offsetting removal, since three revisions running had been net-additive, and it exists because a 19-item checklist fails the same way a 21-section guide with no index fails. Past a certain length nobody reads to the end, which is the argument this skill makes about every document except itself.

> Added at v2.0.0 from direct reader feedback, which is the first time a case in this file has come from that rather than from a maintainer reading the output. Seven production guides had been brought to the 1.5.0 register in one session and every one of them passed the mechanical checks; the reader's verdict was that they were very technical, hard to follow, full of tables, and sometimes left him with no idea what a section had said. The 1.5.0 evidence for that register had been which guides *looked* reused, inferred from the artifacts, never asked of the person reading them. Worth pinning as a negative case too: the failing draft in the fixture is not sloppy, it is the previous revision's ideal output.

> Added at v1.2.0, when the roster gained its first index (component.gallery) and its first survey series. Traced to Step 2's tier 4 — "use only as a convenience … flag them as convenient rather than canonical" — and to the roster's own instruction to cite what the index points at. The rule pre-existed; nothing had ever named a source that could break it.

Traced: 2026-08-10 — to the new index clause in the voice file's structure block and the compressed checklist.

## A12 · Claim precedes caveat, and at most one recurring image
Fixture: deep mode on a topic where one section's advice is genuinely conditional (works well only under specific circumstances), and the topic offers a relationship abstract enough that a metaphor could describe it (e.g., a shared layer with two things built on top of it).
Assert: the qualified claim states its position before its exception ("Shared core wins where both sides are live. It costs more where one side is still being written.") rather than hedging before committing ("in some contexts a shared core can work well, though..."). At most one image resurfaces across the whole guide, and only where introduced for a relationship a reader would otherwise have to hold abstractly; most sections carry no metaphor at all, and real token names and worked cases remain the primary texture. A guide that leads three or more qualified claims with a hedge before their position, or that introduces a fresh metaphor per section, fails this case even where every individual sentence is accurate on its own.

> Added at v2.3.0, sourced from reading three practitioner voices (Yesenia Perez-Cruz, TJ Pitre, Brad Frost) directly rather than from auditing this skill's own output or a reader's reaction to it, the first time a voice rule has come from that route. A third pattern the same reading turned up, Frost's short punchy bursts ("Hell no!", "Nope!"), was deliberately left out: it sits close to the manufactured-punchlines line 2.0.0 already drew, and was cut on request rather than adopted. Per skill-standard §A clause E, a rule about sentence-level register is not fully walked until a person reads it against real output; this case has been traced to its instructions but not yet reader-confirmed, and the header's Walked line says so rather than overclaiming.

Traced: 2026-08-10 — to the two new voice-file clauses, "State the claim before the caveat" and "At most one recurring image, and most guides need none"; the reader check is pending.

## A13 · A search summary is not a fetched source
Fixture: a claim about a tool's underlying mechanics (an API's return scope, a data model's boundary) where a WebSearch call returns only its own synthesized "based on the results" paragraph, with no verbatim quote from any page, and the vendor's developer/API documentation, distinct from its help-centre prose, plausibly holds the precise answer.
Assert: the developer/API documentation page is fetched directly before the claim is asserted, and the source list cites that fetched page, not the search result list or the search tool's own summary paragraph. A claim resting only on a WebSearch synthesis, with no page independently opened, fails this case even if the synthesis turns out to be accurate: the failure is in what was verified, not in what was concluded.

> Added at v2.4.0, from a live instance in this session rather than a hypothetical. A claim about Figma's variable-library dependency mechanics was first asserted from a WebSearch synthesis and forum threads, shipped with an appropriate hedge, then re-verified on request against Figma's developer docs specifically and found a materially more precise primary source, `getAvailableLibraryVariableCollectionsAsync`'s own scope description, that had not been reached for the first time. Step 2 already ranked primary documentation above commentary; it did not name a search tool's own summary paragraph as a layer beneath primary and above commentary, easy to mistake for having already done the check because it reads like a synthesis of primary sources rather than a secondary opinion about them.

Traced: 2026-08-10 — to the new Step 6 clause on developer/API docs outranking help-centre prose and search summaries.

## A14 · A behaviour no documentation states is tested, not inferred
Fixture: a guide whose argument depends on a tool behaviour that neither the vendor's developer docs nor its help centre state, with forum threads that disagree (for example, whether renaming a layer inside a published component keeps consumers' overrides).
Assert: the run asks for a safe scratch file, builds the smallest fixture that shows the behaviour, records the result, deletes the fixture, and marks the claim in the guide as tested with its date; *What to re-check later* names what the test could not reach.
Assert also (negative): the claim is not asserted from forum consensus or a search summary alone, and no fixture is built in a file the person did not name.

Observed: 2026-10-01 — `figma-and-code-differences.md` and `breaking-changes-figma-and-code.md`; seventeen tests, three of which overturned what the research had been told.
Traced: 2026-10-08 — to SKILL.md Step 6, "Where the documentation is silent on what a tool does, test it rather than infer it."

## A15 · Research feeds the knowledge base in the same change
Fixture: a deep-mode run on "how should a form mark required fields", inside the toolkit repo.
Assert: besides the guide, the run updates the section that owns the topic in `knowledge/ui/patterns/forms.md` (practice, cases, public sources, the way the toolkit goes), cites standards by handle, links nothing private, and leaves other pages a line and a link at most.
Negative: a run that delivers only the guide, or copies the topic into a second page.
Traced: 2026-10-11 for 2.6.0 — to SKILL.md Step 8.

## A16 · Research starts where the knowledge base left off
Fixture: a run on "when should a button show a loading spinner", inside the toolkit repo, where `knowledge/ui/patterns/actions.md` *Loading buttons* already cites Carbon and Primer.
Assert: before searching, the run reads that section and its sources, re-opens the ones it leans on, aims the search at what the section lacks (a delay threshold, double-submit, systems not yet cited), and corrects a cited claim that no longer holds in that section.
Negative: a run that searches from scratch and re-cites what the section already had, or keeps its own list of sources.
Traced: 2026-10-12 for 2.7.0 — to SKILL.md Step 1.
