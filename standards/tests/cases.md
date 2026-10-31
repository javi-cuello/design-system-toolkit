# Eval cases — the standards in `standards/`

Cases for the standards themselves, not for any one skill (toolkit-standard §C clause E). Prefixes name what they test: `F` frontmatter (skill-standard §A clause F), `D` project data (§A clause D), `G` deterministic work (§A clause G), `P` plugins (skill-standard §B), `S` the structural checks of `check.sh` and `bin/check`, `M` a standard's shape (toolkit-standard §C), `R` rules, citations, history and settings (`tools/toolkit-check/check-standards.mjs`), `C` code-standard.

Three scripts live in this directory, all run from the repo root: `check-frontmatter.sh` (clause F), `check.sh` (skills, plugins, markdown shape and each standard's scope line, delegating clause F), and `scan-clause-d.py` (advisory: clause D needs a read). Rules, citations, histories and settings are `tools/toolkit-check/check-standards.mjs`'s, run by `bin/check`.

**Walked: 2026-10-30, for toolkit-standard 2.19.1** — §D 23's *Open:* line edited, no rule changed: `node tools/toolkit-check/check-standards.mjs` is clean. Before that, **for toolkit-standard 2.19.0, skill-standard 1.4.5, snapshot-standard 2.19.1 and figma-standard 2.20.2** — R1 and R3's new assertions: `node tools/toolkit-check/test-check-standards.mjs` 87 pass, seven new, six failing on HEAD's check; S7 loses its unchecked (c); `node tools/toolkit-check/check-standards.mjs` clean on the repo. Before that, **for toolkit-standard 2.18.2** — §D 11's trailer: `node tools/toolkit-check/test-cadence.mjs` 4 pass, one new; on this repo `bin/closing` names the review owed again (last 2026-10-14). Before that, **for toolkit-standard 2.18.1** — §D 23's *Open:* line edited, no rule changed: `node tools/toolkit-check/check-standards.mjs` is clean. Before that, **for snapshot-standard 2.18.0** — rule 26 (the MCP route): `node tools/snapshot/test-mcp.mjs` 12 pass, `node plugins/design-system-snapshot/tests/test-walk.mjs` 27 pass, `node tools/snapshot/test-router.mjs` 54 pass, one new; and the rule's evidence re-run on one library version both ways. Before that, **for toolkit-standard 2.18.0** — the plan row's Claims section: `node tools/claude-hooks/test-gates.mjs` passes with the plan text carrying it, and a plan without it is refused naming "the Claims section". Before that, **for toolkit-standard 2.17.2** — §D 23's *Open:* line edited, no rule changed: `standards/tests/check.sh` exits 0 and `node tools/toolkit-check/check-standards.mjs` is clean on the repo. And snapshot-standard 2.17.1 (the router's cap on a post): `node tools/snapshot/test-router.mjs` 52 pass, one new, a 257 MB post answered 413. And code-standard 1.31.0 (rule 6's component class): read against to-code's class naming, which generates exactly the root and part classes the rule now allows.

**Walked: 2026-10-08, for the split of the standards** — `node tools/toolkit-check/test-check-standards.mjs` 27 passed; `standards/tests/check.sh` exits 0; `node tools/toolkit-check/check-standards.mjs` clean on the repo. Earlier walks are in git history.

---

## F1 · Intact frontmatter passes
Fixture: a `SKILL.md` whose frontmatter carries `name:` and `description:` on separate lines.
Assert: the check reports pass and exits 0.

## F2 · Folded frontmatter is caught (the regression case)
Fixture: a `SKILL.md` whose `name:` and `description:` have been folded onto one line, as a prose reflow that does not hold the `---` block out verbatim will produce.
Assert: the check reports FAIL naming the file, and exits non-zero. This is the bug that shipped once: five skills with folded frontmatter, all loading with no description.
Assert also: a content diff that ignores whitespace is **not** accepted as evidence of an intact reflow. It cannot see this failure, because collapsing a newline is itself a whitespace change. Any procedure that reflows a `SKILL.md` and verifies only with such a diff fails this case regardless of the file's actual state.

## F3 · A colon inside a description is not mistaken for a folded key (negative case)
Fixture: a `SKILL.md` whose `description:` value legitimately contains `": "` — e.g. `description: "Use when: the user asks. Triggers: audit, review."` — on a single line.
Assert: the check reports pass and exits 0. It must not flag folding merely because `": "` appears in a value; keys are read only at line start, inside the frontmatter block. A check that cannot tell these apart is useless, because real descriptions in this repo contain colons.

## F4 · A `version:` key is rejected
Fixture: a `SKILL.md` whose frontmatter adds `version: 1.0.0` alongside the two permitted keys.
Assert: the check reports FAIL listing the unexpected keys, and exits non-zero. Clause F bans the key because it breaks `.skill` packaging, and the version lives in the body instead.

## F5 · Every installed skill currently conforms
Fixture: the repo as committed, no arguments passed.
Assert: the check discovers every `skills/*/SKILL.md`, reports pass for all of them, and exits 0. A skill added without conforming frontmatter fails this case on the next run.

## F6 · `name` must match its directory, and the charset is not advisory
Fixture: three planted skill folders — one conforming, one whose `name:` reads `not-the-dir` inside `bad-name/`, and one named `Bad--Name` (uppercase and a doubled hyphen) matching its directory exactly.
Assert: the conforming one passes and exits 0; the mismatch FAILs naming both the value and the directory; the charset violation FAILs saying which rule it broke. The two must report differently — a name that disagrees with its folder and a name that is malformed have different fixes, and one message for both sends a reader to the wrong one.
Assert the negative: the check must not merely test the charset, or the mismatch case passes (`not-the-dir` is perfectly well-formed).
Walked 2026-08-19 against planted fixtures, all three directions observed by exit code.

## F7 · The 1024-character description cap is measured, not assumed
Fixture: the two skills as committed at `269a72a` — `figma-doc-generator` and `figma-library-audit` — whose descriptions had sat at 1202 and 1111 characters for several versions.
Assert: both FAIL with the measured length, and the trimmed versions pass. This is the regression case for the whole clause-F addition: the repo was conformant on every other rule the specification states, and failed only on the one nothing measured.
Assert the measurement folds a multi-line plain scalar the way YAML does — continuation lines joined with a single space, indent stripped — since a raw byte count of the block over-reports by the indent and would fail a conforming file.
Assert it counts **characters, not bytes**. A first cut used awk's `length()`, which counts bytes on this platform, and reported 1210 for a 1202-character description: an em dash is three bytes, and this repo's descriptions are full of them. A byte count is silently stricter than the specification near the cap.
Walked 2026-08-19, all four directions: both pre-trim files FAIL with the exact lengths, both trimmed files pass inside the 18-file repo run, a folded multi-line fixture measures correctly, and the byte-vs-character error was caught by comparing the checker against an independent count.

## S1 · Clause F errors, A/C/E only warn
Fixture: a skill with a folded frontmatter and, separately, a skill missing its version line, its changelog, and its cases file.
Assert: the folded frontmatter reports as `ERROR [F]` and forces exit 1; the A/C/E violations report as `warn` and, alone, exit 0. The severities must not be equal: F breaks a skill at load time, A/C/E leave it working. A build that refuses to install over a missing `cases.md` leaves the maintainer with no toolkit rather than an imperfect one, which is the worse failure.

## S2 · `--strict` promotes warnings to errors
Fixture: a temporary skill carrying clause A and E violations — no version line and no `tests/cases.md`. Planted, never ambient: a fixture that *is* the current repo stops testing anything the moment the repo improves.
Assert: the default run exits 0 and says `pass with debt`; `--strict` on the same input exits 1 and counts those same violations as errors. Both numbers must agree — `--strict` changes severity only, never what is detected.
Assert also, against the repo as committed: with zero warnings, both the default run and `--strict` exit 0 and the summary reports a clean pass. `--strict` must not invent a failure when there is nothing to promote.

## S3 · Clause C matches the bare word, not any string containing it (negative case)
Fixture: a `SKILL.md` containing `clientStorage` (a Figma API name) and no bare use of the word.
Assert: no clause C warning is raised. `grep -ic 'client'`, the check the standard shipped before v1.2.0, fails this case — it flagged `figma-plugin-creator` on every run. A check that cries wolf gets ignored, which is worse than no check at all.
Assert also: a `SKILL.md` containing "we deliver this to the client" **is** flagged, so the case cannot be passed by disabling clause C.

## S4 · Clause B reports, never fails
Fixture: the repo, where some skills legitimately carry no `## Project context first` block because they read no per-project configuration.
Assert: they are listed as information under `[B]`, contribute zero warnings and zero errors, and the run still reports pass. Whether clause B applies depends on what a skill reads, which no grep can decide; a check that guessed would train the maintainer to ignore it.

## S5 · Standing debt is visible on every install, and never blocks it
Fixture: `./install.sh` with a temporary skill present that has no `tests/cases.md`.
Assert: the offending skill is printed before any linking happens, and linking still proceeds to every skill including that one. Conformance debt should be impossible to forget and unnecessary to fix before working, per S1's severity rule.
Assert also, against the repo as committed: with no debt, the run prints no debt list and links every skill. Silence here must mean "nothing owed", which it can only mean if the list is genuinely absent rather than empty-but-printed.

**Walking this case links the fixture.** `install.sh` links every skill it finds, so the temporary skill lands in `~/.claude/skills` as a real symlink and is left dangling when the fixture directory is deleted. Remove `~/.claude/skills/<fixture-name>` as part of the teardown and verify with `find ~/.claude/skills -maxdepth 1 -type l ! -exec test -e {} \; -print`. This happened on the walk of 2026-08-08 — the case that proves installs are never blocked is, unavoidably, the one that mutates the live install.

## D1 · The clause D scanner catches every banned shape
Fixture: a `SKILL.md` with a component ID (`84:668`), a property key (`Label text#84:5`) and a Figma URL carrying a file key planted in it.
Assert: all three are reported, each with file, line and surrounding context, and the run exits 1. Removing them returns the run to exit 0.
Assert also: the report says each hit needs a read. A scanner for a clause the standard calls unmechanisable must not present its output as a verdict.

## D2 · Conforming placeholders are silent (negative case)
Fixture: the repo as committed, where every illustrative ID uses the `0:` page prefix.
Assert: no ID-shaped candidates are reported and the run exits 0. A tool that lists a dozen known-fine hits on every run gets ignored, and then the real one is ignored with it — which is why the placeholders were renumbered rather than allowlisted.
Assert also: contrast ratios in prose (`3:1`, `4.5:1`) are never reported. Node IDs are distinguished by a multi-digit suffix.

## D3 · Soft matches are separated from actionable ones
Fixture: the repo, which uses the word "Foundations" both as a genre descriptor ("a Foundations-style file") and inside a changelog entry quoting a collection name that was removed.
Assert: both appear under a clearly-labelled soft-match list, contribute nothing to the exit code, and are suppressed by `--quiet`. Whether a proper noun is one project's naming or an ordinary word cannot be decided by a regex, and mixing the two into one list would make the actionable list untrustworthy.

## M1 · A standard quoting the shapes it mandates is not a violation (the regression case)
Fixture: `standards/skill-standard.md` as committed, whose clause A shows a `# Changelog` file and a version line inside fenced examples, and whose clause E shows an `## A1 · …` case heading inside another.
Assert: `check.sh` and `check-standards.mjs` report nothing for those examples and exit 0: fenced blocks are blanked before any count or citation is read. The fix is in the checkers, never in the standard: rewriting a standard to dodge a count destroys the illustration it depends on.

## M3 · A scopeless H1 is caught
Fixture: a temporary standard whose H1 is a bare title (`# Colour rules`) with no ` — <scope>` after it.
Assert: a `[B]` warning names it. This is the clause whose evidence is live: `CLAUDE.md` asserted "`plugins/` has no formal standard yet" while `toolkit-standard.md` sat at v1.4.2 governing that directory, and nothing read the claim back.

## M4 · The judgement half of clause C is never reported on (negative case)
Fixture: a temporary standard carrying a numbered rule with a marker but no reason and no evidence.
Assert: neither checker reports the missing reason or evidence and both exit 0. Whether a stated reason is a real reason is not decidable by grep, and a script that guessed would cry wolf; that half of clause C needs a read. What clause C's *Checked:* covers is the mechanical half: a citation must resolve (R3).

## S6 · The install gate reports everything and blocks on little
Fixture: `./install.sh` on a repo carrying a markdown or clause warning and no load-time failure.
Assert: the warning is printed and linking still proceeds; a documentation defect never leaves the maintainer with no toolkit. Citations and rule markers are `bin/check`'s (R1–R4), which gates a push, not an install.
Assert what does block: folded frontmatter, an unparseable manifest, a wrong `documentAccess`, and ui-base rules differing from canonical — each stops the thing working rather than merely being untidy.

## P1 · A manifest that cannot run is an error; conformance debt only warns
Fixture: a plugin whose manifest sets `documentAccess: "page"`, gives `editorType` as a string, and ships `enableProposedApi`.
Assert: `documentAccess` and `enableProposedApi` report as `ERROR` and force exit 1; the `editorType` shape, missing files, and a missing `code.js` version header report as `warn`. The split is the house pattern — only what stops the plugin working, or must never be published, blocks. Assert against the repo as committed: all four plugins pass clean.

## P2 · An unparseable manifest reports once, not as a cascade
Fixture: a plugin whose `manifest.json` is malformed JSON.
Assert: one error naming the parse failure, and the per-field checks are skipped for that plugin rather than reporting seven "missing field" warnings for fields that may well be present. A checker that turns one fault into nine makes the real fault harder to find.

## P3 · The version header and package.json must agree
Fixture: a plugin whose `code.js` header reads `v1.2.0` while `package.json` says `9.9.9`, and one whose `package.json` omits `private: true`.
Assert: both warn, naming both values so the disagreement is visible without opening either file. Two version numbers that can drift apart will, and the header is what a maintainer reads while the package is what tooling reads.

## D4 · A skill's systems/ cache is never committed and never scanned
Fixture: `skills/figma-library-audit/systems/project-a.md` containing a real file key.
Assert two things. `.gitignore` covers `skills/*/systems/`, so a cache cannot be committed into the shareable unit. And `scan-clause-d.py` skips the directory, so a legitimate cache does not report a hit on every run — the pre-1.2.0 clause C lesson.
Assert the third route is now a human step: handing a skill folder to a project means checking it carries no `systems/` cache, no project data and no read into a sibling skill. A script did that between 2026-08-08 and its removal the same day; it was deleted for never having been used, and the check moved into `README.md`'s hand-over note (now `docs/how-it-fits.md`) rather than being automated ahead of a hand-over that has not happened.

## S7 · Drift that used to need remembering is now checked
Fixture: (a) a skill edited in the working tree whose `**Version**` still matches HEAD; (b) a skill whose cases header names an older version than its `SKILL.md`. (A third, a skill with no ds-model-routing row, was listed here with no check behind it; removed 2026-10-30, the row is read when a skill is added, skill-standard *Verifying a skill*.)
Assert: each warns and none errors. Both are derivable from the repo, so they are checked rather than remembered — which is the point: they replace manual upkeep instead of adding a rule to keep.
Assert (b) is a **warning by design**, not a failure. The header records the SKILL.md revision the cases were last *reviewed against*, so a mismatch means "decide whether a case should have moved too", and the honest answer is sometimes no — a patch changing a citation needs no new case. Six of thirteen headers disagreed when the check was written.
Assert the bump guard **exempts changes confined to `tests/`**. Without that exemption the two checks chase each other: reviewing a cases file demands a bump, the bump moves the version the header must match, and the header check re-breaks — forever. Verified by clearing six real header mismatches and watching the guard fire on all six.
Assert a third: a file declaring a version with no matching `- <version> ` line in its changelog warns. This is the one invariant a fenced block cannot hide, and it is there because stripping fences — which is what lets a standard quote the shapes it mandates, case M1 — is also what let three real changelog entries sit inside `toolkit-standard.md`'s own example while the file declared a version its changelog had never reached. Every structural check in this repo reads unfenced content, so anything inside a fence is invisible to all of them; checking the version against the changelog catches that without needing to see in. It catches the ordinary miss too: bumping a version and forgetting the line.
Assert the negative that this case was written for: `$d` carries a trailing slash, so `"$d/SKILL.md"` yields `skills/x//SKILL.md`. The filesystem tolerates the doubled separator and `git show HEAD:path` does not — it returns nothing, so the bump guard **failed open** and reported a clean tree on an unbumped edit. A guard that fails silently open is worse than no guard, because it answers the question wrongly rather than declining to answer.

## S8 · Markdown structure a diff stat cannot show
Fixture: two shapes, both taken from real damage done on 2026-08-08 rather than invented — (a) a five-row table flattened onto one 674-character line by a prose reflow, replayed verbatim from the commit that carried it; (b) a fenced block deleted by line range, leaving its opening ``` without a closing one.
Assert: (a) warns `[MD] … table separator inside a longer line`, naming the file and line; (b) warns `[MD] … code fences, unbalanced`. Assert the negative on both: a correctly formed table and a correctly closed fence are silent, and the repo's current tree reports neither.
Both were injected into the real tree and removed again, not only tested against fixtures — the point is that every other check in this file passed while the damage was present. That is the whole reason the case exists: the content parsed, the diff stat looked like an ordinary deletion, and what broke was the structure *around* the change.
Deliberately narrow to those two shapes. A general markdown linter would report style, and style is not what went wrong.

**(c) added and walked 2026-09-22 — the third `[MD]` check counted nothing.** The cell-count and escaped-pipe check gathered its hits into `$hits` and then read them with `printf '%s' "$hits" | while … warn`. A pipeline runs in a subshell, so `warn` incremented a copy of the counter that died with it, and `printf '%s'` writes no trailing newline, so `read` dropped the last hit as well. Both proven in isolation before the change: two hits through the pipe counted **0** and read **1**; the same two through a heredoc counted **2** and read **2**. The rule is stated verbatim in a comment eight lines below the violation.
Assert: a file with a pipe-damaged table row raises the total warning count, not only a printed line; and `--strict` **refuses** a tree where that check is the only finding. Assert the last hit is reported — a fixture whose final line is a hit must warn on it.
This is why it matters and why it went unseen: `--strict` is the documented release gate, and it reported "pass … clean" on a tree carrying these. Turning the counter on surfaced **7 findings that had been printing for as long as the check existed**, two of them real broken tables — `projects/project-b/design-system-context.md:587` (7 cells against a 6-cell header) and `projects/project-a/design-system-context.md:252` (6 against 4) — in the document class that outranks the toolkit's design and naming rules. A check whose warnings nobody counts is a check nobody has.

## S9 · A version is changelogged once
Fixture: a standard or `SKILL.md` with two `- X.Y.Z ` entries under one heading.
Assert: `check.sh` warns `[A] <name> — two changelog entries for X.Y.Z`. Negative: a history file with sections may repeat a number across them, and is silent, because the count is per heading.
Why: a second entry under a version already shipped is a change released without a bump; `figma-components-audit` carried two 1.60.0 entries and no check saw them.
Assert also: a suffixed label counts against its `X.Y.Z` — `- 1.0.0+1` beside `- 1.0.0` warns for 1.0.0. The first fix for the real hit relabelled the second entry `1.60.0+1`, and the old `X.Y.Z ` pattern stopped seeing it.

## S10 · A command a doc tells you to run exists
Fixture: `node tools/<missing>.mjs` or `./bin/<missing>` in `README.md`, `CLAUDE.md`, a standard or a skill's `tests/cases.md`.
Assert: `check.sh` warns `[CMD] <file> — runs <path>, which does not exist`. Negative: a bare `bin/tokens` (a project repo's bin) and a path with a placeholder (`<name>`, `*`, `$`) are silent — skipped whole, never cut at the placeholder: `node tools/parity/test-*.mjs` was once checked as `tools/parity/test-` and warned.
Why: a case pointed at `tools/figma-audit/check.mjs` after it moved; a walk that runs a missing path fails at the walk, or is skipped as unrunnable.

## S11 · A job written in two projects is named before the toolkit owns it — WALKED 2026-10-01
Fixture: the registered project repos as they are (`~/Projects/*/figma-design-system/design-system-context.md` → each repo).
Assert: `node tools/toolkit-check/twins.mjs` lists every code file name two project repos both carry, minus `owned.json`'s `projectOwn` and `scaffoldOwn`, and exits 1; with nothing left, exits 0. `bin/check` shows it as a warning.
Walked: first run listed 8 (`check`, `graphics`, `parity`, `tokens`, `adapt.js`, `diff.js`, `schema.js`, `spec.js`); the four entry points were read — `bin/tokens` execs the toolkit's build in both, `bin/check` runs the toolkit's gates, `bin/parity` is judged by the engine files, `graphics` is two different jobs — and ruled with reasons, leaving the four engine files, which are the two parity engines toolkit-standard 1.5.0 §D 2 is about. A name check over function definitions was tried first and found two hits, both wrappers over the toolkit's own: dropped.
Why: `check.mjs` sees only a job the toolkit already owns; two parity engines grew where it could not look.
Assert also: names compare extension-stripped within one family (stylesheet, script, PHP, shell, Python, bin), stylesheets included, and a file carrying the token build's banner is not a twin. Walked 2026-10-02: the old whole-basename, scripts-only run was green over a hairline mixin written in both projects; the new run lists exactly two — `_hairline (style)` and `_fonts (style)` (one project generates its font faces, the other writes them by hand). Stripping without families first gave 17, of which 12 shared a name across languages (ten a component's stylesheet against another project's PHP template, plus `index` and `route`) and 3 were the token build's own output: the families and the banner cut those. That walk recorded two left; the run listed three (`_focus (style)` too), which a review found (R15).
Assert also: a ruling names the key as printed, family included (`parity (bin)` does not silence a `parity.mjs`); a partial's leading underscore is stripped, and a component's own sheet in a folder of its name (`button/_button.sass`) is skipped; a ruling that matches nothing is listed; a `scaffoldOwn` copy whose mixins differ from its source's, bodies and defaults included, is listed. Walked 2026-10-02: stripping the underscore alone gave 17, ten of them each project's own component sheet (`button`, `checkbox`, `text-input` …), which the folder rule cuts to 7 — the four bin entry points and `fonts`, `focus`, `hairline` — all ruled, so the run exits 0 with "scaffold copies match"; the old rulings, keyed without a family, were each listed as matching nothing. Project C's hairline set back to `@mixin below` (its shape before ee73282fec) is listed as `has below(), the scaffold below(width)` and exits 1; restored, 0.
Assert also: the comparison sets aside comments (line and block), module lines (`@use`, `@forward`, `@import`), SCSS against indented Sass, a signature split over lines and custom property names, and nothing else — a rule placed before the first `@mixin` is drift too (walked 2026-10-03, `tools/toolkit-check/test-twins.mjs` 8: both planted on a copy of 1a629251's `twins.mjs`, the block comment listed as drift and the leading rule invisible; both right now); a folder below the repo root carrying its own `LICENSE`/`LICENCE`/`COPYING` is not read. Walked 2026-10-02 (`tools/toolkit-check/test-twins.mjs`): the review's two plants on a hairline copy, an `inset 0 -1px 0 0` body and a `$width: 2px` default, each fail the names-only comparison's test and are listed now; the real copies still match. With the named `kirby` skip removed and no licence rule, the run lists `eslint.config (script)` from the CMS's own panel; with the licence rule, exit 0.

## S12 · A change left uncommitted for over a day is named, once, at its real age — WALKED 2026-10-02
Fixture: a scratch repo holding a modified tracked file, a staged rename, and a file copied in with `cp -p` from one dated months back; the step's Python run with the clock moved two days on, and at the real clock.
Assert: `bin/check`'s "nothing left uncommitted for over a day" lists the modified file, the rename's new path and the copied file at 2d with the clock moved, and nothing at the real clock. Negative: the rename's source path is never read as a change (it is a separate `-z` field), and a preserved mtime does not make a new file read old — age is the inode's change time.
Walked: HEAD's step at the real clock reported `274d copied.txt`; with the clock moved it also listed `a-src.txt`, an ignored file whose name the rename source's `[3:]` slice produced. The new step: silent at the real clock; with the clock moved, the three real changes at 2d and nothing else.
Why: the step cites a real six-day event and had no case; review 38 found both faults by reading.

## G1 · Executable code at the skill root is reported
Fixture: a skill carrying `generate.js` beside its `SKILL.md` rather than in `scripts/`.
Assert: warns `[G] … executable file(s) at the skill root`, with the count. Assert the negative: a skill whose code is entirely under `scripts/` and `tests/` is silent. Both were observed against the repo as it stood — two skills at the root, two conforming — rather than planted.

## G2 · Filenames are kebab-case
Fixture: a skill carrying `build_matrix_script.py` and `test_matrix.py` — planted. These were real files in `figma-contrast-matrix` when the case was written and were migrated to kebab-case on 2026-08-08, so the case is now planted rather than observed, per this file's rule that a case must not expire when the repo improves.
Assert: one warning per snake_case file, naming it. Assert the negative: `test-docgen.js`, `figma-helpers.js` and `verify.js` produce nothing. The convention is not arbitrary — every other name in this repo is kebab, and the three exceptions were the only ones.

## G3 · Clause G is debt, never a block
Fixture: the repo with five clause-G non-conformances present.
Assert: `check.sh` exits 0 and `install.sh` still links. Moving a documented entry point breaks every invocation in that skill's own `SKILL.md`, so migration is a decision a maintainer makes per skill, not something a gate forces. Assert also that `--strict` promotes them, so a release gate can still refuse.

## G4 · An engine that cannot reach its runtime
Fixture: observed, not planted — `figma-doc-generator` on 2026-08-19, against the two Figma files it documents. The skill ships a three-file engine, a documented load protocol and a hash gate; neither target file had ever been seeded, and seeding meant ~87KB of transcription through the model with no cheaper way to verify it.
Assert, on the standard: clause G requires a skill whose engine runs in a sandboxed host to (a) cache the source in host storage and document **where**, (b) gate the write on the hash rather than reporting after it, and (c) hash comment-stripped, whitespace-insensitive source. Assert the negative: a skill whose engine runs under plain `node`/`python3` needs none of this and the clause must not ask for it.
Assert, on behaviour, which is the half a grep cannot see: **the failure mode is the agent routing around the load, not the load failing.** Faced with the paste, the run hand-wrote the cell logic instead — turning a handful of scripted calls into many round-trips and re-introducing by hand a class of defect the engine does not have. A case that only checked the protocol *existed* would have passed throughout, because it did exist.
Walked both directions on the same day. Forward: the three scripts were pasted comment-stripped (87KB → 59KB), and the gate **refused** the first one — computed `2319cc71` against an expected `9a5ff502` — over a single mis-typed character class in 22KB, then accepted it once corrected; the bootstrap was then proven by deleting the globals and restoring the whole API from plugin data alone. Backward: the nicer channels were tested and do not exist — a plugin `fetch` to a localhost file server returns `Failed to fetch` (the host honours only its manifest's network allowlist), and no tool on the bridge carries arbitrary code.

## P4 · The inlined ui-base is checked against the source it names
Fixture: a plugin whose inlined ui-base block has (a) a changed CSS rule, and separately (b) only reworded comment text.
Assert: (a) is an **ERROR** and exits 1 — a real rendering difference between a plugin and the baseline it claims to inline. (b) is **information** and exits 0 — the guidance text drifts as the baseline is revised, and failing on wording would make the check noise.
Assert the distinction is the point. The block's own first line reads `canonical: plugins/_shared/ui-base.css` and nothing verified it; three of four plugins had drifted when this was added, and the drift was **entirely comment** — the CSS rules were byte-identical. Reporting that as a rendering defect would have been wrong, and syncing it blindly would have been acting without knowing which. What the three were missing was the collision-safety CAUTION paragraph, and one of them was `lucide-icon-importer`, whose focus-ring report produced that lesson in the first place.
Assert the **scaffolder's** copy is checked too. `figma-plugin-creator/assets/ui-base.css` is a third copy of the baseline, and it cannot be removed — a skill is self-contained and must not read `plugins/_shared/`. It is the worst-placed duplication in the repo: drift there does not affect any existing plugin, it silently makes every newly scaffolded one start stale, and nothing else in the repo would notice.
Assert the fixture uses the **minified** rule text (`*{box-sizing:border-box}`, no space). A first attempt searched for `box-sizing: border-box` with a space, matched nothing, changed no file, and the unchanged run was misread as the check failing to fire — a vacuous fixture reports the same as a broken check.

## P5 · The no-build type-check pair is checked, and its position is the point
Fixture: a plugin whose `code.js` carries `// @ts-check` on line 5 rather than line 2, behind a rationale comment; and separately a plugin missing `tsconfig.json`.
Assert: both are **warnings**, not errors — a displaced pragma is conformance debt, not a plugin Figma refuses to load, and clause P1's split between "cannot run" and "not yet tidy" applies here too.
Assert the check distinguishes **displaced** from **absent**, and says which. They have different fixes and different meanings: absent means type-checking was never on, displaced means someone turned it on and a later edit pushed it down. Reporting both as "no @ts-check" would send a reader looking for a pragma that is already there.
Assert the negative, because this is where the check could be vacuous: on the conforming repo it must produce **nothing at all**. It was control-passed both ways when added — silent across all four plugins, then fired on exactly one line when a comment was inserted above the pragma in a single plugin, and silent again when that was reverted.
Why the position is worth checking rather than just the presence: TypeScript honours the pragma anywhere in the leading comment block, so a displaced one still *works*. What it costs is findability — a reviewer has to read the whole header to learn whether checking is on. One plugin sat at line 5 for two versions and no check saw it; it was found by reading four files by hand during a conformance sweep, which is exactly the labour a checkable rule should not require.


## P6 · A gated API is checked against the permission it needs — WALKED 2026-09-25
Fixture: `plugins/theme-switcher`, whose `code.js` calls `figma.teamLibrary`, with and without `"permissions": ["teamlibrary"]` in its manifest.
Assert: without the permission the run is an **ERROR** naming the plugin, the API and §B 2; with it, silence. Both were walked on the day the check was added — the error fired on exactly one line, and restoring the manifest silenced it.
Assert this is an error rather than a warning: unlike a displaced `@ts-check`, the plugin loads and then throws on every call to that API, in the file, in front of the user.
Why it is worth a check at all. The plugin shipped **three versions** and passed two live test runs in real Figma files with this missing. Every `figma.teamLibrary` call threw `"teamlibrary" permission not specified in manifest.json`, and the plugin's own timeout guard caught the rejection and returned an empty list — so the symptom was "this file has no library collections", which is indistinguishable from a file that genuinely has none. It was found only when Figma put the error on screen in a third file. The guard now reports the first error it swallows, which is the other half of the fix: a check in this repo cannot see a plugin silencing itself at runtime.

## P7 · A plugin README does not carry its own version
Fixture: a plugin README with `**Version X.Y.Z**` that differs from its `package.json`.
Assert: `check.sh` warns `[8] <plugin> — README says vX, package.json vY (skill-standard §B 8)`. A README with no version line, or one that matches, is silent.
Why: §B 8 names package.json the source; two READMEs had drifted (2.0.0 against 2.0.3, 1.0.0 against 1.11.0).

## C1 · Every code-standard rule carries its reason and its evidence
Fixture: `standards/code-standard.md` as committed.
Assert: the count of numbered rules (`^[0-9]+\. \*\*`) equals the count of `*Why:*` lines and the count of `*Evidence:*` lines (toolkit-standard §C clause C). Each rule's enforcement marker is R1's.

## C2 · A candidate never carries a handle
Fixture: `knowledge/code/candidates.md`, where code-standard's candidates live since 2026-10-11 (toolkit-standard §D 21).
Assert: no line begins with a number followed by a dot. A candidate is not a rule and nothing may cite it as one; a numbered candidate would be citable, which is the failure. Walked 2026-08-21: 0 numbered items; 2026-08-22 at 1.3.0 and 1.4.0: 0 (the three candidates are bullets); 2026-10-11 against the knowledge page: 0.

## C3 · A rule about a file convention names every marker the reference file uses — WALKED 2026-09-07
Fixture: figma-standard rule 11 before 1.18.0 ("pages grouped into named categories", component pages `❖`/`🚧`) and a reader asked to restructure a 27-page library to it, with a registered reference file at hand that draws `🔷 CATEGORY` headers, `---` dividers and `AUXILIARY` last.
Assert: the rule as written lets the reader produce `❖ CAPITALS` headers with no dividers and no catch-all, and the audit detector of the day (§3.8b, `^❖`) passes that result and would have classified the reference file's `🔷` headers as furniture — the rule underspecified the convention it claimed to state.
Assert: 1.18.0 names the header marker, the divider and the pinned catch-all, and §3.8b reads `🔷` as a header.
Assert: the meta-lesson is recorded where a reader will meet it before acting: apply a file convention from a registered file's own page list, and read the rule as the summary of it, never the reverse.

## S13 · A skill that tells a project to write its own engine is named — WALKED 2026-10-03
Fixture: `skills/design-code-parity/SKILL.md` as it stood before 1.45.0 (`git show 20cbd42b^:skills/design-code-parity/SKILL.md`), which says "A second project writes its own scripts to this contract"; and every SKILL.md at HEAD.
Assert: `standards/tests/check.sh` warns `[D2]` naming the file, the line and the sentence for the old text, and warns nothing at HEAD (toolkit-standard §D 2). A sentence quoting the old wording as history ("until 1.5.x", "for a month") is not a hit.
Walked 2026-10-03: the grep the check runs, applied to the old file, hits its line 10 ("…A second project writes its own scripts to this contract…"); over HEAD's skills it hits nothing; `check.sh` exits 0 with no `[D2]` line.

## S14 · bin/check says how long each step took — WALKED 2026-10-03
Fixture: `bin/check` run over the toolkit.
Assert: every step's verdict carries its duration in seconds, so a step that got slow is visible without anyone looking for it (toolkit-standard §D 0's third question); durations are printed, never gated — nothing has fired on real content yet.
Walked 2026-10-03: `bin/check --quick` printed a duration beside every verdict.

## S15 · Deterministic work in a skill's prose is named — WALKED 2026-10-03
Fixture: every skill's `SKILL.md` and `references/*.md` at HEAD; `figma-component-descriptions`, whose fenced blocks name functions `scripts/verify.js` defines.
Assert: `standards/tests/check.sh` warns `[G]` once per skill with the count of fenced `js`/`python` blocks of eight lines or more in its prose (skill-standard §A clause G, 1.8.0); a block whose first `function`/`const` is defined under the skill's `scripts/` is not counted; a skill with none warns nothing.
Walked 2026-10-03: the sweep that preceded the check counted 59 blocks in 10 skills by hand; the check names 8 skills and 57 blocks (`figma-components-audit` 29, `figma-doc-generator` 10, `figma-component-descriptions` 6 — one of its seven exempt, every name it defines shipped in `verify.js` — `figma-variable-audit` 4, `figma-context-capture` 3, `figma-plugin-creator` 2, `figma-tokens-examples` 2, `figma-contrast-matrix` 1, an indented fence); the two the sweep counted beyond are blocks under eight lines. A copy of 1.8.0's check exempted a 27-line paste-and-run engine on one shared name and missed the indented fence. `check.sh` exits 0, "pass with debt — 8 warning(s)".

## S17 · CLAUDE.md stays a pointer file — WALKED 2026-10-03
Fixture: `CLAUDE.md` over 8,000 bytes.
Assert: `check.sh` warns `[CL]` with its size and says to move what a standard owns there and point at it; a file under the budget passes.
Walked: the 22,819-byte file before 2026-10-03 warned; the 4,283-byte rewrite passes.

## S18 · New UI work is asked about the knowledge pages it followed — WALKED 2026-10-13
Fixture: `bin/closing` at toolkit-standard 2.8.1, after a session built the docs site's icon dialog from judgement and read `knowledge/ui/design/visual.md` only when the maintainer asked.
Assert: the closing pass prints §D 0's question 12 — which knowledge pages the work followed, with `knowledge/ui/design/` as the design where none was provided — so a session closing such a change meets the question without remembering it (toolkit-standard §D 21).
Walked 2026-10-13: `node tools/toolkit-check/closing.mjs` lists "12. Did new UI work follow the knowledge pages for what it builds (§D 21)…"; re-walked at 2.8.1 after the scope narrowed to UI; against the icon dialog the honest answer was "none, until asked", and the pages then corrected its spacing, its category label and its button ranks.

## R1 · Every rule says how it is enforced, and a named check exists — WALKED 2026-10-08
Fixture: throwaway trees in which a rule has no marker; a `*Checked:*` pair names a file that no longer holds its string, or a path that does not exist; a path names a project's own file; a standard has no handle pattern; a rule is marked *No check yet.*
Assert: each is refused, naming the standard and handle, except the project's path, which is an example and not verified, and *No check yet.*, which passes and is counted as debt. A standard the check cannot read is refused, never skipped.
Runs: node tools/toolkit-check/test-check-standards.mjs — "a rule with no enforcement marker is refused", "a *Checked:* pair whose file no longer holds its string is refused", "a *Checked:* path that does not exist is refused", "a path outside the repo's own folders is a project's example, not verified", "a standard the check has no handle pattern for is refused, not skipped", "a rule marked *No check yet.* passes and is counted as debt"
Assert also (walked 2026-10-30, the six fail on HEAD's check and pass on the new one): a `;` with no pair after it is refused, whether a path with no test name, a name broken across a line or a dangling `;`; a name holding a double quote is refused, not checked as its first part. On the repo the first shape found two: snapshot-standard rule 23 named `test-router.mjs` with no test, and figma-standard rule 44 repeated its marker after a `;`.
Runs: node tools/toolkit-check/test-check-standards.mjs — "a second pair with no test name is refused, not passed", "a second pair whose name breaks across a line is refused", "a dangling ; before the next marker is refused", "a name holding a double quote is refused, not checked as its first part"

## R2 · History is one line of reference per version — WALKED 2026-10-08
Fixture: a standard whose version has no history line; a history entry long enough to carry reasoning; a standard with its own `## Changelog`.
Assert: each is refused (toolkit-standard §C clause A).
Runs: node tools/toolkit-check/test-check-standards.mjs — "a version with no history line is refused", "a history entry longer than one line of reference is refused", "a standard carrying its own changelog is refused"

## R3 · A citation resolves, and a moved one heals — WALKED 2026-10-08
Fixture: a citation of a rule its standard does not have; a list of real rules and a fenced example; a citation a history file's `| Was | Now |` map retires, in either case, beside a longer number and a changelog section; a retired standard's name, and a list in its old form.
Assert: the missing rule and the retired citation are refused with file and line; the list and the example pass; `--fix` rewrites the retired citation through the map and touches neither the longer number nor the history.
Runs: node tools/toolkit-check/test-check-standards.mjs — "a citation of a rule its standard does not have is refused", "a list of real rules passes, and a fenced example is not a citation", "a citation a history map retires is refused", "--fix rewrites it through the map, either case, and leaves other numbers and history alone", "a retired standard's name, and a list in its old form, are refused"
Assert also (walked 2026-10-30): a standard citing another file's section by its heading names a heading that file has (toolkit-standard §C clause B); on the repo it found §D 1's and §D 13's `README.md` sections, which had moved. A bare part with no handle (`§A for …`) is not a citation the check resolves: its owner by letter would be skill-standard, which has an §A, so §D 13's stale one was read, not caught.
Runs: node tools/toolkit-check/test-check-standards.mjs — "a standard citing a heading its file lacks is refused", "…and one in a file that does not exist", "…and a heading the file has passes"

## R4 · Values live in the settings, registered and stated once — WALKED 2026-10-08
Fixture: an unregistered house default or project key; a project restating a house value (a multi-line one included); a scanner reading an unregistered key, quoting a house value, writing a marker or a rule number; a key read only in a comment.
Assert: each is refused; `--fix` removes a restated value and only its lines, keeping the author's layout; a house word in ordinary English, and a literal the allowlist names with a reason, pass (toolkit-standard §C clause F).
Runs: node tools/toolkit-check/test-check-standards.mjs — "restating a house value is refused, booleans included", "--fix removes only the restated lines and keeps the author's layout", "a scanner reading an unregistered key is refused, dotted or bracketed", "a house value quoted, in a regex or as variant syntax is refused; in ordinary English it is not", "a registered key read only in a comment counts as unread", "an allowlisted literal passes"
