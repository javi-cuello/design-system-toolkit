# Toolkit standard — the root every other standard defers to

**Version 2.19.4** — history in [`changelog/toolkit-standard.md`](changelog/toolkit-standard.md).

What holds for everything the toolkit contains, whatever kind of thing it is: how a rule is admitted, enforced, tested, changed and retired (§C), and how the parts hold together as one system (§D). Anything common to two standards belongs here and nowhere else.

| Standard | Governs | Cite as |
|---|---|---|
| `toolkit-standard.md` (this file) | Rules, standards and the ecosystem | `toolkit-standard §C clause <letter>`, `toolkit-standard §D <n>` |
| [`skill-standard.md`](skill-standard.md) | A skill, a plugin | `skill-standard §A clause <letter>`, `skill-standard §B <n>` |
| [`figma-standard.md`](figma-standard.md) | How a library is built in Figma, and every name in it, which code takes as written | `figma-standard rule N` |
| [`snapshot-standard.md`](snapshot-standard.md) | A design file's path to a stored snapshot | `snapshot-standard rule N` |
| [`code-standard.md`](code-standard.md) | The front-end code a project ships | `code-standard rule N` |
| [`design-standard.md`](design-standard.md) | How an interface looks, behaves and reads: UX, interaction, visual, content, accessibility | `design-standard rule N` |

Guidance past the rules, fundamentals and patterns with their sources, is in [`knowledge/`](../knowledge/README.md) (§D 21). The values tools read from the standards (defaults and the registry of settings keys) are in [`audit-settings.json`](audit-settings.json); each standard's history is in [`changelog/`](changelog/); the cases that test the standards are in [`tests/cases.md`](tests/cases.md).

**Precedence.** An explicit instruction in the session outranks every standard. A project's context document decides the facts about that project, and overrides a figma, naming or code rule with a dated ruling and an `**Overrides:**` line (clause C). Where this file and a specific standard disagree on a rule's substance, the specific standard wins and this file has a bug.

---

## Part C · Rules and standards

*Cited as `toolkit-standard §C clause <letter>`.* This part governs form, never content: whether a naming rule is right is figma-standard's question; whether it states its reason, carries a handle and says how it is enforced is this one's.

### A — A version, and a history that only records

Each standard carries `**Version X.Y.Z**` under its H1, and its history in `standards/changelog/<standard>.md`: one line per version, newest first, saying what changed. A reason, a decision or a constraint lives in the rule it belongs to, never only in the history; the history is reference, read when someone asks when something changed.

*Why:* decisions written into changelog entries stopped governing anything: the rule they qualified read the same, so the next reader followed the rule and missed the decision. 25 KB of one standard's 74 KB was history, much of it reasoning its rules did not carry.

*Checked:* `tools/toolkit-check/check-standards.mjs` "history runs newest first"; `tools/toolkit-check/check-standards.mjs` "one line of reference".

### B — Scope and precedence declared, and kept true

The H1 states what the file governs after an em dash. The body states what outranks it. When scope moves, every citation to it moves in the same commit; a standard citing a section of another file by its heading, the file's path then the heading in italics, names a heading that file has.

*Why:* a stale scope line routes a reader away from the standard that governs the thing; one claimed "plugins have no standard yet" while a plugin standard sat at v1.4.2. Two of §D 1's and §D 13's pointers named `README.md` sections that had moved to other READMEs, and no rule handle showed it.

*Checked:* `standards/tests/check.sh` "H1 states no scope"; `tools/toolkit-check/check-standards.mjs` "a heading that file does not have".

### C — Every rule carries a handle, its reason and its evidence

- **Handle**: a number, or a letter for a clause, unique in its standard. A citation always names the standard (`figma-standard rule 9`), so a handle means one thing everywhere. Handles are retired, never renumbered or reused inside a standard: a withdrawn rule keeps a tombstone naming its date and successor.
- **Reason** (*Why:*): why the rule exists, not the rule in other words.
- **Evidence**: the run, incident or observation that admitted it. Cite the incident, never the project. A rule with no incident states its mechanism instead, labelled `(Mechanism, not an incident.)`, and never invents one; "this has always seemed right" is an honest weak evidence line; no line at all is imported opinion. Evidence found wrong is corrected in place, with a patch version, even when the rule does not depend on it.
- **A convention drawn in files** names every marker those files use: the next reader applies the prose, not the file.
- **Coverage**, for a rule meant to hold across projects, is computed, never recorded: a project overrides a rule with a line `**Overrides:** <standard> rule N — <why>` in its context document, and `grep -hE '\*\*Overrides:\*\* +[a-z]+-standard rule +[0-9]+' ~/Projects/*/figma-design-system/design-system-context.md` lists every override. Silence means agreement.

*Why:* bare rules cannot be defended, revised or retired, because nobody can reconstruct what they answered; a renumbered handle keeps resolving, to a different rule, and no reader notices.

*Checked:* `tools/toolkit-check/check-standards.mjs` "a rule its standard does not have"; `tools/toolkit-check/check-standards.mjs` "has no *Why:*".

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — the evidence line, when a rule is admitted or changed: whether a run proved it is a judgement no script makes.

### D — Every rule says how it is enforced

Each rule ends with one of two markers, and a rule without either is refused, never counted as debt: a rule with no check is a rule nobody sees broken.

- `*Checked:*` names what fails or warns when the rule is broken. It opens with pairs, `` `path` "string" `` or `` `path` `symbol` ``, joined by `;`; each is verified: the file exists and its code, comments removed, still holds the string; a skill's file must be a test `bin/check` runs, or say in its header what runs it (`@runs:`), since a script a session pastes checks nothing on its own. The first thing that is not a pair ends them, and what follows is prose that checks nothing, so a string meant as a check carries its own path; a `;` promises a pair, so what follows one is a pair or is refused, and a string holds no double quote. Comment removal is per file type and best effort: a regex literal holding a lone quote, or a quote inside a shell comment, can defeat it. A grammar rather than a reading of prose, because four review rounds each found a prose list the reading missed.
- `*Reviewed:*` names the moment a person or agent reads it, and opens, like `*Checked:*`, with the pair that names the file prompting that reading, so the moment is concrete: a step of the closing pass (`bin/closing`), an audit skill's step, a check's warning.

A judgement rule says so; a tool reporting on one is advisory and stays out of any blocking gate.

*Why:* an unenforced rule is obeyed by whoever remembers it. Three standards marked enforcement three different ways, and one in a separate file, so a moved check left its rule claiming coverage nobody gave. "Not yet translated" sat in a contract for a fortnight as a permanent exemption until its reasons became a closed list with a gate, and a waiver model with no staleness check gathered 109 dead waivers in one repo.

When a review names a class of defect, the deliverable is a check that refuses the class; fixing the listed instances leaves it open, and it returns.

*Checked:* `tools/toolkit-check/check-standards.mjs` "has no enforcement marker".

### E — Checkable rules have cases

`standards/tests/cases.md` holds a case per checkable clause, with a fixture and an assertion, and records when the cases were last walked: executed, exit code observed.

*Why:* a rule no case can falsify is a rule nothing stops from regressing.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — when a standard changes, at step 4 of the lifecycle below.

### F — Logic in code, values in settings

A tool holds logic only. Every value it applies (an axis name, a marker, a scale, a threshold) is a key registered in `audit-settings.json`'s `audit-keys`, with the house's answer in `audit-defaults` where the house has one, merged under a project's `audit-settings`. A check whose key is absent does not run; it never borrows a value. A project never restates a house value.

*Why:* a value hard-coded in a shared tool is one project's answer applied to the next; it produced 157 confident, wrong findings in a single scan.

*Checked:* `tools/toolkit-check/check-standards.mjs` "is not in audit-keys"; `tools/toolkit-check/check-standards.mjs` "restates the house default".

### The lifecycle of a rule

1. **Admit.** A rule enters when a real run proves it, or when the maintainer decrees it (`Maintainer-decreed <date>` in its evidence). A decreed rule's cross-project check is verification, not admission: it is recorded as owed until run, never assumed. External material is a candidate until a run here confirms it, and a standard may set a higher bar and say so (code-standard keeps a lesson from a single run as a candidate where a rule from it would be premature). Both front-end standards keep their candidates in the knowledge pages (§D 21), not in the standard.
2. **Enforce.** Write its marker (clause D) and, if a tool applies a value, its key (clause F).
3. **Test.** A checkable rule gets its case (clause E).
4. **Change.** Edit the rule, its reason and evidence; check every citation still reads true (`git grep -n "<standard> rule N"`, the whole repo, because tools, READMEs and project documents cite rules too); walk the cases; bump the version and add one history line, in the same commit.
5. **Retire.** Replace the rule with a tombstone (`7. *Retired YYYY-MM-DD: superseded by rule 12.*`); its number is never reused, and a citation to it is reported.

### Verifying

```sh
node tools/toolkit-check/check-standards.mjs   # handles, markers, citations, settings; run by bin/check with --fix
standards/tests/check.sh                # versions, scope lines, markdown shape
```

---

## Part D · The ecosystem

*Cited as `toolkit-standard §D <number>`.*

Governs the toolkit as a whole: how work is divided between the toolkit and a
project, what may exist twice, what a project may decide for itself, and how
what one project learns reaches the others. The other standards govern a kind
of thing — a skill, a plugin, a standard, the snapshot chain, the design
defaults, the code defaults. This one governs the relationships between them,
which is where the expensive failures have been.

**Each rule says how it is enforced**, in the form §C clause D sets.

### 0 · Check the standards before the work, and again after it

**Every piece of work in every repo begins and ends at the standards.** Before:
read the one that governs what you are touching, ask §D 1, §D 2 and §D 5 (does the
toolkit already own this job; would the next project want what I am about to
write; is a new reader about the stored state or the present); for new UI work, read the knowledge pages for what it builds (§D 21), and for any other code, code-standard; and run the repo's check so the state you inherited is known — a red
you did not cause is a finding, not a mess to step into. After: run it again,
walk the cases of whatever changed, bump the version and write the changelog
line in the same commit.

**And every review, audit brief and closing pass asks these questions beside
correctness**, because a check only sees what it measures:

1. **Is any job done twice** — in two projects, in a project and the toolkit,
   in a skill and a tool (§D 1, §D 2)?
2. **Was any check loosened** — a tolerance, a slack, a bound or a waiver
   widened, a gate deleted — to make it pass? A loosening is a finding to
   report, never a fix.
3. **Did run time or cost grow** — compared before and after on the same
   input, the way output is compared?
4. **Does anything the toolkit claims lack a trigger** — a *reviewed* with no
   moment, a rule with no check, a cache with no stale test?
5. **Is any deterministic work described in prose instead of shipped as an
   engine** — an algorithm, a mapping applied mechanically, a computation an
   agent or a project re-derives by hand each run (skill-standard §A clause G)?
6. **Did you look at what users see**, for every page the changed files draw?
7. **The toolkit question, showing its work:** what lesson belongs in a skill,
   a standard or a knowledge page (§D 21), and what was checked before
   answering "nothing"? And which gap in the knowledge the work ran into —
   a subject it needed that no page covers, or covers thinly — is worth
   researching to fill, named with the page it would go in?
8. **Did the work stay inside the budget** stated before it started, agent
   time and review rounds, and if not, was that said?
9. **Does any document restate a rule** instead of citing the one that owns it?
10. **Did audits and generated output keep §D 14–19**: every finding
    classified, an uncertain value flagged rather than guessed, no anatomy
    invented, no live-readable state recorded, a new detector control-passed,
    a ruled deviation written where the next run reads it?
11. **Did a change get read against the judgement rules `bin/closing` lists for it**,
    the rules no script checks?
12. **Did new UI work follow the knowledge pages** for what it builds
    (§D 21), read before the code was written, with `knowledge/ui/design/` as
    the design where none was provided, and does the change say which? Any
    other code, code-standard?

This list is owned here; `bin/closing` reads it from this file and prints it, and every brief cites it. A review's findings are fixed in its change or filed as rows in the audit queue; no review document is kept, because a list of open findings in a file is a decision buried where nothing reads it.

*Why:* a standard consulted only when someone remembers it is a standard that
governs nothing, and a check first run at the end of a day tells you late what
it could have told you early. And a review briefed on correctness alone finds
only correctness. The closing pass is a script (`bin/closing`), not a list in
prose, because the session that wrote the list skipped two of its items.

*Evidence:* a suite in this repo had been red for weeks because nothing ran it
at either end; the run that found it was the first `bin/check` of the toolkit
as a whole. Three review rounds over the parity merge (2026-10-02) looked only
at verdicts, counts, bounds and ownership: meanwhile two projects had each
built the engine the skill described as "method" (§D 2); agents told to make
checks pass had left a slack uncapped (bounds to 33px), 47 waivers unbounded
and one bound at 5,822px; and one project's run had gone from 24 s to 146 s
with nothing measuring time. Every one of those was visible to a question
nobody had been briefed to ask.

*Checked:* `.githooks/pre-push` "push refused" — each repo's `bin/check`, run by the pre-push hook, so a
push cannot carry a red repo (`git config core.hooksPath .githooks`, once per
clone). *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — the before half, at the SessionStart hook and step 1 of
`CLAUDE.md`'s *Every piece of work* — the first `bin/check` of a session and
§D 0's questions; no hook can make you read the rule first.

### 1 · One job, one owner

**Two things doing one job is a defect, whichever two.** Two skills, two
scripts, two gates, a skill and a tool: when a job has two implementations they
disagree, and the disagreement surfaces as a wrong answer nobody can trace.
Adding a second implementation is never the fix — extending the first, or
deciding which one owns the job and deleting the other, is.

*Why:* a copy is not a backup. It is a second decision, taken later, by someone
who could not see the first, and the two drift in the direction nobody is
looking.

*Evidence:* two project repos ran the same design-to-code loop with about
twenty pieces of it written twice. Each side held fixes the other lacked: one
kept a renamed component's spec, the other deleted it silently; one bounded a
waived difference by its size, the other never noticed 109 waivers whose
differences had gone; one read a file's release history, the other recorded
`version: null` for want of the same forty lines. Every one of those fixes was
made deliberately, by someone who did not know the other copy existed.

*Checked:* `tools/toolkit-check/owned-check.mjs` "a job the toolkit owns is written again in this repo" over `tools/toolkit-check/owned.json`, run by each
repo's own check: a file the toolkit owns, or a name only a re-implementation
would define, fails and names what to call instead. *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — the first of
§D 0's questions, at every review and closing pass; two skills claiming
one job is answered by the owner map in `skills/README.md` (*The skills*), where a new
skill earns a row or replaces one.

### 2 · Nothing shared stays buried in a project

**A mechanism that would help the next project belongs in the toolkit, in the
same change that writes it.** A project keeps what is genuinely its own: its
paths, its tolerances, its content, what it builds after a snapshot. Everything
else — the writer, the reader, the gate, the parser, the report — is the
toolkit's, and the project calls it.

**A skill that tells every project to write the same code has buried it in
every project.** Method a project follows is prose; code each project would
write the same way is the toolkit's to ship, where §A clause G puts an engine
(the skill's own `scripts/`, or `tools/` once projects call it, as they call
the token build and the parity engine) — and the prose becomes the account of
that code. The test is §D 2's own question asked
of the skill instead of the project: would the next project have to write
this? A project's facts — paths, which layer is which element, how its pages
are served, its tolerances, its waivers — are configuration it passes in, and
nothing more of the job stays behind.

**A scaffold copy is the one sanctioned second copy.** A file a scaffold
writes into a project — a skill's starter stylesheet, which compiles inside
the project's own build and deploy, where the toolkit is not — is one job
whose source is the scaffold. Each project keeps a copy, in its own syntax and
under its own token names for the same roles; the copy names its source, a
change lands in the scaffold first, and `owned.json` records it as
`scaffoldOwn { source, copies }`. That is not `projectOwn`, which rules a
shared file name a coincidence of two genuinely project-own jobs.

**The audit is the backstop, not the mechanism.** When a second project starts
doing a job the first already does, take both implementations, name what each
does that the other does not, and move the union into the toolkit with both
repos calling it. Prove the move by replaying real input through the old path
and the new one and diffing every file they write: a swap that changes no
output can be trusted, and one that changes output has said which side was
wrong. (Moved here from `CLAUDE.md`, 2026-10-03.)

*Why:* the alternative is discovering it later, by audit, after both copies
have grown their own bugs. The cost of moving a thing at the moment it is
written is minutes; the cost of merging two grown copies is a day, and the
merge has to be proven against real data. A skill that describes an engine
instead of shipping it produces exactly that, once per project, by design.

*Evidence:* release pinning sat in one project's `ops/` for weeks while the
other recorded no release at all; the measurement baseline, the pixel diff and
the post-snapshot validator were each written in one project and unavailable to
the other; the snapshot receiver existed three times. And `design-code-parity`
described its comparison — adapter, schema, differ — as a shape for each
project to build: two projects built it, as `adapt.js`, `schema.js` and
`diff.js` in each, with two expectation formats and two browser drivers, and
the audit that moved twenty shared pieces left the engine behind as "method".

*Checked:* `tools/toolkit-check/twins.mjs` "file name(s) in two project repos" — a warning in `bin/check`, for a job the toolkit does not own yet (one it owns is code-standard 59, above):
a code file name two project repos both carry, unless `owned.json`'s
`projectOwn` rules it a coincidence with the reason or its `scaffoldOwn` names
it a scaffold copy; a scaffold copy whose mixins differ from its source's,
bodies and defaults included (custom property names set aside), is listed too
(its evidence: the two hairline copies, one taking a width and one taking
nothing, before either named the scaffold; and a review's plants, an inset
body and a `2px` default, that a names-only comparison passed).
`standards/tests/check.sh`'s `[D2]` warns on a skill that tells a project to
write its own scripts, adapter, differ, schema or engine (the sentence the
parity skill carried for a month). *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — §D 0's first question at every
review and closing pass, and before code is written in a project (`CLAUDE.md`,
*Every piece of work*, steps 1 and 3) — "different representations" or "it is method" is not a
reason to keep two. "When a second project starts doing a job the first already
does" was the review until 1.7.0; nothing fires at that moment, and two
engines were built under it.

### 3 · Ownership is legible

**Anything in the toolkit says what its job is, in its first paragraph, and
nothing else claims that job.** A skill's description, a script's header, a
standard's scope line: a reader who opens the wrong file must be able to tell
in one sentence.

*Why:* an owner nobody can name is an owner nobody can call, and the next
person writes their own.

*Evidence:* a validator, a docs site and a token build each grew their own
reader of the same snapshot data, each under a name that did not say so; the
owner map that fixed it took an afternoon and removed three readers.

*Checked:* `standards/tests/check.sh` "H1 states no scope after an em dash" (a skill has a description, a version and
a changelog; a standard has a scope line). *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — the session rule that
every citation still resolves (`CLAUDE.md`, *Session rules*) — a script's header is a citation of itself, read whenever
its file is touched.

### 4 · Parts that stand alone and compose

**Every skill runs by itself, and composes into a pipeline without knowing it
is in one.** A skill reads its inputs from the project's stored data or its own
arguments, never from another skill's files; an orchestrator sequences skills
and owns nothing they own.

*Why:* a part that only works inside a pipeline cannot be tested, replaced or
lent to a project that needs just that part.

*Evidence:* the audit dashboard runs the validator's own engine rather than a
copy, and the validator still runs alone on a file with no project; the snapshot
router calls the store, and the store is what a replay calls by hand.

*Checked:* `standards/tests/check.sh` "reads another skill's files" (skill-standard §A clause H), `bin/check` "every skill, from bin/get, has what it names" and `standards/tests/check.sh` "clause G says an engine in scripts/" (§A clause G). *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — §D 0's
first question — an orchestrator that owns logic is a second owner of it.

### 5 · Figma is the source of truth; the snapshot is its representation

**Figma is read once, by the plugin, and every output reads what was stored.** A
tool that reads Figma live for data the snapshot carries is a second reader of
one fact, and the two will disagree. Extending the plugin is the fix; a live
reader is not.

*Why:* three live readers of one file's text styles disagreed about line
heights and bindings, which is three answers to a question with one answer.

*Evidence:* the docs site, the token build, the validator and the documentation
generator all read the snapshot now; the maintainer accepted "take a snapshot
first" as the price. Writing to Figma still goes through the bridge — this rule
is about reading.

**The audit is the exception, and it is about the question, not the data.**
`figma-components-audit` and the stages the dashboard runs with it read the
live file, and should. Every other output describes a *stored state* and must
be reproducible from it: a docs page, a token export, a parity run against a
pinned design. An audit answers "what is wrong with this library **now**", and
a snapshot cannot answer that — fix three things in Figma, re-run, and a
snapshot-backed audit reports all three again, because the file it read is
this morning's. The bridge is already open when a maintainer audits, because
applying a fix needs it.

So the test is not "does the snapshot carry this data" but "is this output
about the stored state or about the present". Where it is about the present,
the live read is the correct one and the rule does not bind; where it is about
the stored state, a live read is a second reader and this rule does. Skills
keep a snapshot path for their own sake — the rules run against fixtures in
CI, and against a file with no project — but the dashboard runs them live.

*Checked:* `tools/toolkit-check/owned.json` "writing a snapshot", enforcing snapshot-standard's one writer, one schema, one layout and one reader per stored format. *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — the Before step of §D 0, which asks of
any new tool or reader — is this about the stored state or about the present,
and if the stored state, does the snapshot already carry it?

### 6 · Project-agnostic by construction

**Nothing in the toolkit knows a project's name.** A project is a context
document plus a config: its files, its paths, its phase, what it builds after a
snapshot, where its token lives. Adding a project is adding those; it is never
editing the toolkit. Nor does any file in the toolkit name one, prose and walk
records included: a lesson says "one project" or a fixed stand-in ("Project A"),
so the repo can be handed to someone outside without a project in it.

*Why:* a project name in shared code is a fork with extra steps, and the second
project pays for it.

*Evidence:* a scanner hard-coded one library's collection name and reported 210
false findings against another; a docs site needed a per-repo config until the
snapshot contract stated the layout once. Today the router discovers projects
by reading the projects directory, and a repo states only where its own files
live.

*Checked:* `standards/tests/scan-clause-d.py` "no ID-shaped candidates" (no project data in `skills/`);
`bin/check` "no project is named in the toolkit" (every label, every tracked
file); `bin/check` "no tool builds a
project's path itself" — the snapshot contract's `homeOf()` / `layout()` is the
only path resolver. *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — §D 7's
moment, a shared tool's first run over a second project — an option only one
project needs shows there, and the question is whose need it is and whether it
can be stated as data.

### 7 · A project's names are its own; the toolkit reads them

**No shared tool assumes what a collection, a style, a mode, a page or a
platform is called.** Names belong to whoever works in the file: one library's
`Semantic` is another's `3. Semantic`, one file's modes are Light and Dark and
another's are Desktop and Mobile, one project marks a page `🚧` and another
draws its own ladder. A tool reads the names from the snapshot or from the
project's context document — by position, by presence, by matching without
case — and where a name really must be known, the project states it as data.

*Why:* a name assumed is a project silently excluded. The tool does not fail
on the second project; it reports confidently about something it never read.

*Evidence:* a scanner with one library's `Semantic` hard-coded raised 210
findings against another whose collection is `3. Semantic` and whose bindings
were all fine; a token resolver written against one project's convenience keys
returned nothing for the other until it looked values up by name and mode
across the collections, matching the mode without case; a page-marker legend
is per project because two projects' ladders differ.

*Checked:* `tools/toolkit-check/owned-check.mjs` "a job the toolkit owns is written again in this repo"; `standards/tests/scan-clause-d.py` "no ID-shaped candidates"
(a project's data has no place in shared code). *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — the moment a project's
`figma-design-system/` folder first appears or `twins.mjs` names a job in two repos: every shared
tool is run over the new project before that day closes (the toolkit's
`bin/check` runs the suites, the project's own `bin/check` the gates). A tool is not
portable until it has read a second project.

### 8 · What one project learns, the toolkit keeps

**A fix, a trap or a rule found while working in a project is written where
every project reads it, in the same change.** The project keeps the symptom;
the toolkit keeps the lesson. **The moment is the moment of discovery, not the
session's close.** When implementing a design reveals a Figma↔code mismatch, a
workaround, a trap or a ruling, the change that writes it decides whether it is
a project fact (the project's context document, §D 12) or a toolkit lesson (a
code- or figma-standard rule, a scaffold file, an engine rule in
`tools/parity`, a skill rule), and writes it there in the same commit. The
signal is a comment in a project stylesheet that explains why the code differs
from the design ("Figma draws X, so…"), or a waiver, a decision or an `'unset'`
ruling in its parity mapping.

*Why:* a lesson kept in one repo is a lesson the next project pays for again,
and the person paying will not know it was already known. And a closing
question asked once a day, with nothing to show it, keeps answering "nothing".

*Evidence:* this standard exists because a day's work in two repos produced
nine rules, four scripts and two gates that had all been learned before, in the
other repo, and forgotten. Then, for a month, the closing question answered
"nothing" while Inter 3.19, the focus ring's geometry, the hairline and the
disabled dim — each found while implementing a design — sat in two projects'
stylesheets, and reached the toolkit only through a review (2026-10-02).

*Checked:* `standards/tests/check.sh` "changed since HEAD but still" for a skill, and `tools/toolkit-check/check-standards.mjs` "no line for v" for a standard; design-code-parity's `--accept` lists every ruling new
since the last accepted run — the mapping's waivers, decisions and `'unset'`
rulings, and the stylesheet comments that explain a deviation from the design
(`parity.stylesheets` names the folders) — as *lessons to triage*, and names a
*toolkit candidate* where another registered project rules the same property
in the same words; an accept that finds any refuses, before a browser opens,
until `--triaged "<where they went>"` names the context-document entry,
standard rule or skill case, so a list is never absorbed unread. A run that
lists nothing has not asked the question. *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — three moments: the change
that writes a ruling or a deviating comment in a project (frontend-build's
Components step, design-code-parity's *The loop to work in*); the accepted
run's list; and the closing toolkit question, which shows its work — the new
rulings, the new stylesheet comments, the new context-document entries it read
— before it answers "nothing" (`bin/closing` asks it).

### 9 · Retired — merged into §C clause D (2026-10-08)

### 10 · Simple, proven, finished

**The smallest thing that does the job, proven against real input, with its
gaps named.** No hack, no workaround, no number that only fits today's content.
A change is finished when it has run against real data, its check has been seen
to fail, and what it does not cover has been said out loud.

*Why:* an unproven check is worse than none — it reads as coverage. A gap
nobody names is inherited silently by the next person.

*Evidence:* a wrong layer name reported 58 of 58 bound while 21 cells were
never examined; a coverage gate that had never been seen red was counting
layers nobody mapped; a snapshot writer's migration was only trustworthy
because both projects' real payloads were replayed through the old and new
paths and every written file diffed.

*Checked:* `standards/tests/check.sh` "say how they were walked", which counts every case not yet walked; walking them before a commit is `CLAUDE.md`'s step 2. *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — the session rule to
name the gaps before saying done (`CLAUDE.md`) — what has
never run against real input, and which claims are sourced only as far as the
*Not found* list admits.

### 11 · Drift is the toolkit's problem, not the maintainer's

**Claude proposes the audit, writes the check and names the divergence; the
maintainer decides.** The maintainer should be asked for decisions — which of
two behaviours is right, whether a project may diverge — never for vigilance.
A question that is really "did you notice?" is a failure of this standard.

*Why:* the maintainer cannot see a second copy growing inside a repo, and
should not have to.

*Evidence:* every duplicate found in the sharing audit was invisible from
outside the two files that held it; the maintainer's only signal was a rising
sense that the two projects behaved differently.

**The toolkit maintains itself on two clocks**, so no refactor waits for
someone to notice drift:

- **Every check heals what is safe.** `bin/check` runs
  `tools/toolkit-check/check-standards.mjs --fix`, which removes a project setting that
  restates a house default and rewrites a citation through any history file's
  `| Was | Now |` map; everything else it refuses, naming the file.
- **Every session starts with what is open.** `bin/closing`, read by the
  SessionStart and Stop hooks, names what is open and an independent review
  owed every fourteen days: fresh agents read the toolkit end to end against
  what `tools/toolkit-check/review.md` lists, and the
  commit that closes the review carries a `Review:` trailer naming it
  independent, which is the only record kept (a change's own review may carry
  a `Review:` trailer too, and does not close it).

*Checked:* `tools/toolkit-check/closing.mjs`
"REVIEW_DAYS"; `tools/toolkit-check/test-cadence.mjs` "a review is owed"; `tools/toolkit-check/test-cadence.mjs` "a change's own Review: trailer is not the independent review". *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" —
§D 2's triggers — the question asked before code is written in a project and
the first question; when either names a job twice, the sharing audit runs and
reports what it found, unasked.

### 12 · A project's truth lives in its context document

**Everything project-specific has one home: `~/Projects/<label>/figma-design-system/design-system-context.md`.**
A project is a repo beside the toolkit with that folder at its root (the label
is the repo's folder name), so a new project is that folder and nothing else,
and its files are versioned with the project, outside the toolkit.
Its conventions, its library keys and ids, its audit settings, its rulings, its
overrides of a house default, its phase and its page markers — a tool that
needs to know something about a project reads it there, and a decision taken
about a project is written back there in the same session. Beside it sit the
machine-written files the same project owns: its `snapshot/` (the plugin's
output, never hand-edited) and its `audit/` record (results, never settings).
The document is what a person decides; the snapshot is what Figma said.

The document outranks every shared default in the toolkit's standards. It does not
outrank an explicit instruction in the session, and where it contradicts the
stored snapshot about *state* — a page count, a collection's size — the
snapshot wins and the document should not have recorded it (§D 17).

Divergence is allowed where it is about the project, and it is stated there as
data, not as code: its paths and which parts it takes; what it builds after a
snapshot; the tolerances its own measurement needs; its content, its copy, its
waivers and their reasons. Anything else is the toolkit's, and a project that
needs something different from the toolkit has found a toolkit bug — that is
the finding, not the workaround.

*Why:* a project fact with two homes has none. The alternative to one document
is the fact living in whichever tool happened to need it first — a collection
name in a scanner, a file key in a script, a ruling in a chat log — where the
next tool cannot find it and re-derives it differently. This is the rule §D 6
and §D 7 depend on: shared code can refuse to know a project's names only
because there is somewhere those names are written down.

*Evidence:* a scanner with one library's collection name compiled in raised 210
false findings against another, and the fix was to read the name from the
document; the routing block in the same document is what lets one router serve
four projects; a library id absent from it made the router refuse a real
snapshot until the id was recorded there rather than special-cased in the
router.

*Checked:* `standards/tests/scan-clause-d.py` "no ID-shaped candidates" (project data has no place in
`skills/`) and `tools/toolkit-check/owned-check.mjs` "a job the toolkit owns is written again in this repo" (a job the toolkit owns is not written
again in a project). *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — §D 8's moment — the change that finds a fact
decides it is the project's and writes it to the document, or the toolkit's;
and a fact a tool needs about a project is read from there, never compiled in.

### 13 · The loop runs for every piece of work, and no step of it is optional

**Every change, in the toolkit or in any project, goes round one loop:
standards first, then the work, then what it taught, back to the standard,
skill or tool that owns it, with its evidence.** Each step has a trigger that
fires whether or not anyone remembers it:

| Step | What it asks | Trigger |
|---|---|---|
| Before | which standard governs this; what state was inherited | the SessionStart hook (`tools/claude-hooks/hooks.mjs start`) hands the session the open items and this loop; the edit hook (`hooks.mjs edit`) hands over, beside the first change in each area, that area's rule list, retrieved from the governing standard as it stands |
| Plan, for full-size work | what done means, who reads what this touches, what the result rests on and how that is known, what nearby is broken, what it may cost | the edit hook refuses the call that makes the session's work full-size (the line is `FILES`, `LINES`, `WIDE` and `WIDE_LINES` in `tools/claude-hooks/gates.mjs`: files and lines changed since the work began, bookkeeping aside, or a file in a standard or shared tool changed by more than `WIDE_LINES` lines, counting what subagents write, what a script's own code writes (found on disk inside the call, beyond what the file held before it), and unreviewed work another session left uncommitted in the repo the session starts in; measured, never asked) until the session's plan file holds a Goal, an Impact (the output of `tools/claude-hooks/impact.mjs`: every reader of the touched files, across the toolkit and every project), a Claims (each claim the output's correctness or the work's scope rests on, so the result can be trusted: checked, by the probe run or the primary source read, or only believed; what being wrong would cost; and the check that settles a believed one before the work relies on it, a "cannot" that would drop or shrink the work probed first), a Beyond scope (what nearby is broken, missing or stale, and whether this change fixes it), a Budget and a Review |
| Work, held the same way everywhere | did every gate the toolkit owns run | `tools/project-check/check.mjs`, the one entry each project's check calls; a gate a project cannot feed fails until the project supplies the fact or rules it out in `check.without` with a reason |
| Review, for full-size work | did someone who never saw the reasoning read it | the Stop hook blocks a turn whose edits since the last review are full-size until a review runs: the checks first, then fresh read-only agents (never a fork, never an implementer), each on one area, re-verified findings, repeated until a round finds no new High within the plan's budget; a small fix after a review needs no second one, and a `git push` of a repo with full-size work since the last review, or while a review is still running, is refused. The close waits for each review launched in the background to report (a day at most). A different model for one reviewer is optional: no study found shows it catches more, and a fresh context is what the evidence supports |
| Learn | where did what this change taught go | a `Toolkit:` trailer on every project commit, naming the toolkit file it went to or `none — <why>`, and a `Knowledge:` trailer on every commit touching interface files, naming the knowledge pages it followed or `none — <why>` (§D 21), both checked at push (`loop.mjs`); parity's `--accept --triaged` asks the same of the rulings it lists, through the same verifier |
| Feed back | is it written where every project reads it, with its evidence | §C for a standard's rule, skill-standard §A clause E for a skill's case, the context document for a project's fact (§D 12) |
| Close | what is left open, and what nobody asked | the Stop hook (`hooks.mjs stop`) keeps each open item not yet handed over (`stop-items.mjs`), and the prompt hook (`hooks.mjs prompt`) gives them to the session with the user's next message: each that is the session's is closed, an item another session owns is not worked on, and the user hears only what needs their decision. The hooks speak to the session, never on screen: a Stop block printed on nearly every turn, and the maintainer (15 Oct): "you can check what you want but I don't need to see it". The toolkit question and one unasked finding close a finished task, in a line each (the user's own rules); reviewed full-size work is blocked from ending until its last message carries a `Toolkit:` line answering it, an `Open:` line naming what is unfinished, untested or left beyond the scope (anything closable is closed first), and, when a README describing the changed files was left alone, a `Docs:` line saying it was updated or is still right (§D 22). The gates are the exception to speaking only to the session: they refuse, and a refusal shows |
| Prove | did a skill change make the agent better or worse | `tools/skill-evals`: a task an agent runs in a history-free copy of a project, graded by that project's own gates, a transcript that touched the original repo or git scoring 0; `bin/closing` asks for a run whenever a skill changed |
| Push | the same gates, before anything leaves the machine | each project's pre-push hook is a shim to `tools/project-check/pre-push.mjs`, so every project skips and caches the same way |

The loop is project-agnostic by construction: everything above is the
toolkit's, and a project supplies facts — `check.exempt` (its content),
`check.renders` (what a render follows), `check.without` (a gate ruled out,
with its reason) — never a step of its own. A new project joins by
registering, writing the shim and calling the entry; every gate added later
reaches it on its next check.

`CLAUDE.md` may point at the standards without restating them only because the
Before step's edit hook hands each area's rules to a session on its first change
there; removing the hook removes that condition, and `tools/skill-evals --rules on|off`
measures whether it helps. The Learn step's verifier refuses a `Toolkit:` trailer
or a `--triaged` value naming a file that does not exist. The Close step puts the
automated lines first and short and the answer last and marked: mixed, the answer
is lost among them, and answer-first was tried and rejected.

*Why:* a loop with an optional step is a loop that stops at that step, and it
stops in the direction nobody is looking — at "would the next project want
this?", which no reviewer sees skipped. And a gate a project picks for itself
is a gate the next project does not pick: the toolkit's gates have to arrive
as one set or they drift as a set.

*Evidence:* on 2026-10-03 the two registered projects ran different subsets of
the toolkit's gates — one the markup, overflow and pinned-snapshot gates, the
other none of them — and different push hooks, one skipping content-only
pushes and caching a green tree, the other neither; nothing said so until the
entry's first `--plan`. The same day, fourteen rulings from one navigation
decision were listed at an accept and would have been absorbed unread; the
closing question had answered "nothing" for a month while four lessons sat in
two projects' stylesheets (§D 8); and the maintainer, not the session, was the
one who asked for the loop to be enforced. The plan and review rows were prose in `CLAUDE.md` until 2026-10-28: the maintainer asked for the review again on 2026-10-03 ("I don't want to repeat this"), and on 2026-10-28 an agent asked whether it had reviewed its work answered "partly". Anthropic's Claude Code best-practices page says a `CLAUDE.md` line is a guideline the model may judge does not apply, and a hook is applied every time. Maintainer-decreed 2026-10-28, reversing the 15 Oct ruling for these gates only: "I shouldn't need to ask again", "I don't want to be a nanny", small tasks not slowed (half the commits since 2026-09-01 fall under the line). The research is in the maintainer's guide *A workflow for AI agents that holds every time*.

*Checked:* `tools/project-check/check.mjs` "id: 'lessons'" (every gate, the `lessons` trailer gate
and the `hook` gate) in each project's check and push; `tools/project-check/test-loop.mjs` "a commit with no trailer";
`tools/parity/test-lessons.mjs` "--triaged" for `--triaged`; `tools/claude-hooks/test-gates.mjs` "plan gate: the call that makes the work full"; `tools/claude-hooks/test-gates.mjs` "review gate: a turn with full-size edits"; `tools/claude-hooks/test-gates.mjs` "feedback gate: a turn that ran a review"; `tools/claude-hooks/test-gates.mjs` "a background review is waited on"; `tools/claude-hooks/test-gates.mjs` "push gate"; `tools/claude-hooks/test-gates.mjs` "a script's own writes"; `tools/claude-hooks/test-gates.mjs` "carried into the next session"; `tools/claude-hooks/test-gates.mjs` "subagent's edits are the session's work"; `tools/claude-hooks/test-gates.mjs` "a Stop block's feedback does not let the next stop through"; `tools/claude-hooks/gates.mjs` "FILES = 3"; `bin/closing` lists each
project's gate plan. *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — the Stop hook's block, which is the closing
pass's moment; a session without the hooks registered has no such moment,
which `tools/claude-hooks/README.md` (*Install*) says how to fix.

---

### 14 · Every finding is classified, and an accepted deviation becomes a ruling

A finding is `auto-fixable`, `needs-ruling` or `manual`; a deviation the maintainer accepts becomes a ruling in the context document, never a silent skip.

*Why:* the three buckets differ by **who has to act**, which is the only thing a maintainer needs from a queue before deciding what to do with their afternoon. An unclassified list reads as uniformly blocking, so it gets deferred whole. The second clause matters more than the first: a deviation accepted in conversation and skipped silently is indistinguishable next run from a check that never fired, and gets re-litigated forever.

*Evidence:* in the toolkit's first set of defaults (2026-08-05), distilled from two projects; no incident is recorded.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the closing pass, question 10 of §D 0.

### 15 · An uncertain value is flagged, never guessed

A token or name a run could not confirm in the source is written with `[check-token]` beside it, never filled in from the pattern it seems to follow.

*Why:* a name matching the project's formula is evidence about the *formula*, not about the token's existence, and the two are indistinguishable in output. Unmarked, a plausible invented name gets pasted into code, where it fails as a missing variable long after the run that produced it. The flag costs nothing when wrong and prevents the one failure that is expensive to trace back.

*Evidence:* in the toolkit's first set of defaults (2026-08-05), distilled from two projects; no incident is recorded.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the closing pass, question 10 of §D 0.

### 16 · A documentation run refills; it never invents anatomy

A run that writes documentation fills the structure a page already has, and adds a section or reshapes a page only on a ruling.

*Why:* generation invents structure and refilling preserves it. Without the rule, each run is free to reshape a page that a human arranged deliberately, and the reshaping arrives looking like normal output — the same failure shape as §D 19, where what the next run reads decides what survives.

*Evidence:* in the toolkit's first set of defaults (2026-08-05), distilled from two projects; no incident is recorded.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the closing pass, question 10 of §D 0.

### 17 · Never record live-readable state

Rules and rulings belong in a context document; counts, coverage and inventory do not. Anything one tool call can read is re-read live, never quoted from a document. A recorded figure that "never outranks the file" can only be redundant or wrong, and in practice it goes wrong — one project's snapshot simultaneously claimed 18 pages against 4, 3 grid styles against 8, and 47 icons against 43, and every error was caught by a live read contradicting it rather than by the snapshot. The exception is output expensive to recompute, such as a full audit's deep-walked variant grids: keep that beside the fix queue it explains, dated and labelled as evidence of a past run, never as current truth.

*Why:* a figure in a document is read with the document's authority, so a stale count is quoted onward as fact by every run that trusts the document, and the live read that would correct it is skipped because the answer already seems to be there.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the closing pass, question 10 of §D 0.

### 18 · Control-pass a detector before acting on it

When a check fires, run the same check against known-good existing output before treating the hit as real. Identical hits there mean a pre-existing artefact of the component or template, not a regression you introduced. One project's overflow detector flagged four cells; the same detector found eleven identical hits on a page generated weeks earlier, settling it in a single call — where "fixing" them would have damaged correct output. This is the cheap, concrete form of the broader rule that every detector needs an intent check, not just a mechanism check.

*Why:* a hit says the detector matched, not that this run caused it; acting on it unchecked spends the session "fixing" output that was already correct and adds new defects to it.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the closing pass, question 10 of §D 0.

### 19 · A ruled deviation from source must be recorded as a standing exception

Where a maintainer rules that generated output should deliberately differ from what the source holds, record it in the project's per-skill configuration, not only in the rulings log. Refills regenerate from source and will silently revert anything not written into the instructions the next run reads — the reversion looks like normal output and reports nothing.

*Why:* the rulings log records what was decided and the configuration is what a run obeys; a ruling only in the log is lost on the next refill, and the maintainer finds out by spotting the page has changed back, if at all.

*Evidence:* one project's maintainer ruled that a Breakpoints table's Value cells carry ranges (`mobile ≤ 768`) where the variables store bare numbers, and the ruling was recorded only in the rulings log, which no refill reads (2026-08-08). That a refill then reverts it is the generator's mechanism, not yet observed.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the closing pass, question 10 of §D 0.

### 20 · Words the toolkit writes follow the project's dialect; names never change

A heading, a column label or a sentence a tool writes for a project is spelt in that project's dialect, set once as `language` in its context document's `audit-settings` (`en-US`, `en-GB`; absent means en-GB, the toolkit's own). A name the project owns, a token, a component, a property, a description, is never respelt, and a name a tool looks up is matched as written. The toolkit's own source stays en-GB.

*Why:* a documentation run wrote "Colour" into a library whose convention was en-US, because the toolkit's words were British by default; respelling a project's own names would break every lookup that matches them.

*Evidence:* maintainer-decreed 2026-09-22, with the setting kept out of the house defaults so a project's choice has one place.

*Checked:* `tools/shared/dialect.cjs` "!== 'en-us'"; `tools/snapshot/projects.cjs` "settings.language" — the one translator every writer calls, and where it reads the setting.

### 21 · Knowledge is guidance with sources, never rules

`knowledge/` holds what the toolkit knows about doing the work well, past what any run has proven: fundamentals, patterns, cases and practice, each with its sources. It grows as far as the work needs, with no proven case behind each line, which is what keeps it out of a standard (§C admits rules only from a run or a decree) and out of a skill (a skill holds how to do one job). A page restates no rule: it cites a standard's rule by handle and says how to apply it. A skill, a standard or a session consults a page by its path; a standard may cite one as the evidence for a rule it admits, and a practice a run proves becomes a rule in its standard and the page then cites it. A design pattern never ships without its code counterpart: every section of a pattern page carries a **Build** part (the elements, roles and keyboard model, states as attributes, the code-standard rules it serves, linking the code page that owns the detail), and a code page names the pattern it implements. A page names its public sources inline, carries no project's data (§D 6) and links nothing outside the repo but public URLs. A shared skill that cites a page gets the same dead-path warning as one that cites a standard. Any new UI work, in any repo and the toolkit's own docs site and dashboards included, starts from the pages for what it builds: a dialog reads the dialog pattern, a grid of tiles the visual fundamentals, before its first line is written, and the change names the pages it followed. In a project this is enforced: the edit hook names the pages for an interface file beside the first change to it (`tools/shared/knowledge.mjs`, by the file's kind and the words in its path), and the push check refuses a commit touching interface files without a `Knowledge: <page>[, <page>…]` or `Knowledge: none — <why>` trailer (`loop.mjs` `unread`, the `knowledge` gate). The pages are the default specification wherever the project's own code or context document is silent, and where no design was provided `knowledge/ui/design/` is the design: its layout, spacing, type, colour and emphasis decide what a designer otherwise would. Research done for the toolkit lands in the page that owns its topic in the same change (§D 8; `design-system-research` Step 8), and a session's closing pass asks for it (§D 0, question 7).

*Why:* design guidance for whole interfaces outgrew both homes on its first day: as candidates in a standard it read as twelve rules and a list, and inside one skill it was unreachable from every other and broke the skill's one job. Guidance that two standards and several skills draw on needs one owner of its own (§D 1).

*Evidence:* maintainer-decreed 2026-10-20 that it be enforced, the way the `Toolkit:` trailer is, after a session built a whole screen without reading the pages. Maintainer-decreed 2026-10-13 for UI work (code that is not UI reads code-standard, §D 0), after the docs site's icon dialog was built from judgement and the knowledge base was read only when the maintainer asked: its spacing, its category label and its button ranks were then each corrected from `knowledge/ui/design/visual.md`. Maintainer-decreed 2026-10-11, after design-standard's depth was written into frontend-build's references and the maintainer asked for it to live outside any skill, consultable from anywhere.

*Reviewed:* `tools/toolkit-check/closing.mjs` "what no script answers" — §D 0's question 12, at every closing pass; no script can tell a page was read, only that the change names it. *Checked:* `tools/project-check/test-loop.mjs` "an interface commit with no Knowledge: trailer"; `tools/claude-hooks/test-hooks.mjs` "names the knowledge pages to read"; `tools/toolkit-check/check-standards.mjs` "a knowledge page links a path outside the repo"; `tools/toolkit-check/check-standards.mjs` "has no Build part" — every citation in a page resolves like any other, and a local path is refused.

### 22 · Every folder a newcomer opens says what it is

**The repo root, each top-level folder, and each tool and plugin folder carries a `README.md` written for someone who has never seen the toolkit.** It opens with a `# ` title and one paragraph saying what the folder is and why it exists, then, in this order where they apply: its status if it is not in use; what it needs (requirements, setup); the smallest working example to copy — a command for a tool, the import step from `manifest.json` for a Figma plugin; what it reads and what it writes; how it fits with the rest (who calls it, what it calls), as relative links; and how to test it. Reference detail lives in the code, a standard or `knowledge/`, and the README links there rather than restating it (§D 12's one home per fact). A skill is exempt: its `SKILL.md` is its README and a skill folder carries no other docs (skill-standard §A); `skills/README.md` is the index. No README names a project (§D 6). A guide in `docs/` and the root's `CONTRIBUTING.md` are held to the same title, lead paragraph and working links, and `docs/README.md` links every guide.

*Why:* the toolkit is handed to people who were not there when it was built; a folder that does not say what it is costs each of them the time it took to find out, and they guess. The consensus says the same: GitHub's *About READMEs* (what it does, why it is useful, how to get started, where to get help, who maintains it), Google's documentation guide (every top-level directory of a code package has an up-to-date README: what it is, its status, how to use it with copyable commands, links to more), makeareadme.com (a description first, the smallest example, explicit steps for a novice), and Diátaxis (a README orients; tutorials, how-to, reference and explanation live elsewhere).

*Evidence:* maintainer-decreed 2026-10-14, when the repo became shareable with people outside it: ten folders had no README (`bin/`, `standards/`, `skills/`, `plugins/`, `tools/` and five tool folders) and four READMEs still carried names from before their folders were renamed.

*Checked:* `tools/claude-hooks/test-gates.mjs` "names the READMEs that describe it" (reviewed full-size work says each README describing it is updated or still right, §D 13); `tools/toolkit-check/readmes.mjs` "no README.md", "no lead paragraph", "nothing to copy", "no import step", "a link does not resolve", "the index does not name", "the index does not link" (run by `bin/check`); `tools/toolkit-check/test-readmes.mjs` "a docs page the index does not link is named"; `tools/toolkit-check/test-readmes.mjs` "CONTRIBUTING.md needs a lead paragraph". *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — whether the words help a newcomer is a read.

### 23 · What the source determines is generated, never written

**Where an output follows from a source that the toolkit can read (a snapshot, a contract, the token files, a context document), a script produces it, and the same input always gives the same output.** That covers code, Figma drawings and documentation alike. The agent writes only what the source does not determine, and skill-standard §A clause G draws that boundary. A generated output says it is generated and is never edited by hand (code-standard rule 23 holds how it is regenerated and diffed). Where an output is part generated and part written, the generated part is marked, and the written part fills only the gaps the generator names. Generated documentation fills the structure a page already has; the structure itself changes only on a ruling (§D 16).

*Open:* still written by hand though a source determines them: a description's Behaviour and Composition lists in a language other than English (`skills/figma-component-descriptions/scripts/sections.mjs` writes en-GB and en-US); and a style's values in figma-file-diff's tables, which `manifest.js` reads only as a hash. Generated since 2.19.1, each leaving only the gaps it names: the markup of a Kirby repo (`to-markup.mjs --framework kirby`), the Sass entry's components list (frontend-build `scripts/sass-entry.mjs`), figma-file-diff's and figma-variable-audit's tables (each skill's `scripts/report.mjs`), the components audit's fix queue (`tools/figma-audit/fix-queue.mjs`), the doc generator's verify step (`scripts/verify.js`), the contrast matrix's hexes from a ramp (`scripts/read-ramp-hexes.js`), tokens-examples' rows (`tokens-mapping.js` rows mode) and context-capture's S1 and S3 (`scripts/pass-s1-collections.js`, `pass-s3-styles.js`).

*Why:* a written copy of what a source determines is a fork of that source. Two runs write it differently, nothing proves either is right, and the next change to the source reaches it only when someone remembers. A generator is right or wrong once, for every project, and a `--check` diff proves which.

*Evidence:* maintainer-decreed 2026-10-29. The token stylesheets (`tools/tokens/build.mjs`, over frontend-build's `build-tokens.mjs`) and each component's CSS (`tools/component-contract/to-code.mjs`, with `selfCheck` replaying every combination) are generated from the snapshot and diffed by `--check`, and are the outputs no review has had to argue over. A component's markup, which its contract also determines (parts, slots, props, roles), was still written by an agent per build, so two builds of one contract could differ; that was found while planning the contract editor's Push to code. skill-standard §A clause G's evidence is the same lesson inside skills.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change": whether an output is determined by its source is a judgement no script makes; a script could find a banner, but not an output that should carry one and does not.
