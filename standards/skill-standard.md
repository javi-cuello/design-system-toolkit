# Skill standard — definition of done for a skill and a plugin

**Version 1.6.1** — history in [`changelog/skill-standard.md`](changelog/skill-standard.md).

What a skill (`skills/`) and a plugin (`plugins/`) must be before they are committed. What every standard shares, including how these clauses are enforced and changed, is [`toolkit-standard.md`](toolkit-standard.md)'s; this file adds only what is particular to a skill or a plugin.

**Precedence.** An explicit instruction in the session outranks it. This file decides whether a skill or plugin is finished, never whether the design or code rules it applies are right.

---

## Part A · A skill

*Cited as `skill-standard §A clause <letter>`.*

A skill is **done** when every clause below holds. This is a checklist for authoring and reviewing, not a style guide: each clause exists because its absence has caused, or would cause, a concrete failure.

Scope: every directory under `skills/`. Clause B applies only to skills that consume per-project configuration; the rest apply to all.

Related: [`figma-standard.md`](figma-standard.md) governs the design and naming rules a skill applies when it runs; this file governs the skill itself.

---

### A — A version near the top, and a history that only records

`SKILL.md` declares its version in the form `**Version X.Y.Z**` within the first few lines after the H1. Its history lives beside it in `CHANGELOG.md`, newest first, one line per version saying what changed:

```markdown
# Skill Title

**Version 1.1.0** — history in CHANGELOG.md.
```

```markdown
# Changelog — skill-title

- 1.1.0 (2026-08-05): what changed, in one line.
- 1.0.0 (2026-08-01): first version.
```

A reason, a decision or a constraint lives in the skill's text, a reference or a case, never only in its history (toolkit-standard §C clause A). Each version appears once, and a skill whose files changed since HEAD carries a bump. **A change confined to `tests/` needs no bump:** the version describes the skill's behaviour, and cases carry their own provenance in the cases header and its `Walked:` line; if reviewing a cases file demanded a bump, the bump would move the version the header must match and re-break the header check, forever.

Semver, interpreted for skills: **patch** = wording, typos, clarifications that cannot change behaviour; **minor** = new capability, new step, changed default that stays backward-compatible; **major** = a run that would now produce materially different output from the same input.

*Why:* the version is the only thing that distinguishes a skill from a stale copy of itself: skills are symlinked, backed up and duplicated across environments. History kept inside `SKILL.md` was loaded into every run and grew to 139 KB in one skill, most of it reasoning its rules did not carry.

*Checked:* `standards/tests/check.sh` "no '**Version X.Y.Z**' line"; `standards/tests/check.sh` "changed since HEAD but still"; `tools/toolkit-check/check-standards.mjs` "one line of reference, under 300 characters".

### B — Project context block (conditional)

**Applies when** the skill reads anything that varies per project: naming conventions, token vocabulary, file keys, page anatomy, accepted deviations. **Does not apply** to skills that are pure functions of their input (a colour generator, a routing table).

Such a skill carries a `## Project context first` section immediately after its intro, before its first procedural step, establishing four things:

1. **The context document is authoritative.** It is the per-project configuration; the skill's own defaults apply only where the document is silent.
2. **Hydrate by `fileKey`.** Match the connected file's key against the document's registry and load the matching sections. Run discovery *only* for items the document marks `[TBD]` — never re-derive what is recorded.
3. **Environment-aware retrieval.** In Claude Code, the document is a file in the working folder, named by the project's `CLAUDE.md`. In claude.ai, it arrives via Project knowledge or in the conversation. State both paths; do not assume either.
4. **Rulings are written back.** New rulings produced by a run go into the document — updated in place in the same turn where it is a writable file, otherwise emitted as sections for the maintainer to paste back.

Copy the wording from `skills/figma-components-audit/SKILL.md`, which is the reference implementation. Rulings recorded in the document outrank file evidence; conflicts get reported, not silently re-derived.

*Why:* without this, every skill re-discovers the same conventions on every run, and — worse — reaches a different answer than the last skill did. The block is what makes a set of skills behave as one system.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — when a skill is admitted or changed: `standards/tests/check.sh` lists the skills with no context block, and the reviewer confirms each reads no per-project configuration. The list cannot fail.

### C — Vocabulary: "project", never "client"

The unit of per-project configuration is a **project**. Not a client, not a customer, not an account.

*Why:* "client" imports an agency framing that is wrong in most contexts the toolkit runs in — in-house teams, personal libraries, open-source systems — and it leaks into user-facing output. It is also ambiguous against the technical sense of client/server. Grep is the test; there is no acceptable exception.

*Checked:* `standards/tests/check.sh` "bare 'client'".

### D — Zero project-specific data embedded

No file keys, project names, team names, URLs to specific Figma files, collection names, or token names lifted from one project. Examples must be obviously generic or explicitly labelled as illustrative.

Variable *names* like `sourceFileKey` are fine; literal *values* like `fileKey: "abc123…"` are not.

**Illustrative node IDs and property keys use the `0:` page prefix.** `0:2345`, `Icon#0:45`, `Label text#0:2`. This is a convention, not a Figma rule — its whole purpose is to make the shapes separable without reading every one: anything with another prefix is either real data that escaped or a placeholder that should be renumbered, and both are worth a look. `standards/tests/scan-clause-d.py` reports on exactly that. A literal is still fine by this clause if it is obviously fabricated; renumbering it just keeps the scanner's output down to things that need thought.

**Carve-out — walk records in `tests/cases.md` may identify their fixture.** A walked case records what was actually observed, and a record that cannot be traced back to a fixture cannot be re-checked, disputed or retired: "walked against a component" asserts nothing. So a walk record **may** identify the project by a fixed stand-in ("Project A", never its name: toolkit-standard §D 6) — a pointer the maintainer can resolve, not data — and **may** state the structural facts that make the result falsifiable: counts, ratios, variant and axis shapes, generic component names (`Button`, `Calendar`), and the behaviour observed.

It **may not** carry the project's *configuration*: file keys, node IDs, URLs, collection names or token names. Those are the half that leaks and the half that misleads — a shared skill folder carrying one project's collection names will apply them to a project that spells things differently — and they add nothing a walk record needs, because the evidence lives in the counts and the shapes, not in an identifier. "58 of 58 cells" is the finding; the page's node ID is not.

The split is deliberate: the pointer keeps traceability inside the repo, while the skill folder alone — the unit that actually gets handed over — carries no configuration for anyone to inherit. **This half needs a read, not a scan.** `scan-clause-d.py` catches keys and node IDs because they have a machine-readable shape; a collection name in prose does not, and no checker will tell you a sentence is quoting one.

*Why:* skills are shared artefacts. Embedded project data is a confidentiality leak in the best case and a wrong default in every other — a skill carrying one project's collection names will confidently apply them to a project that spells things differently.

*Why the carve-out:* the clause as first written banned project names outright, and the repo's own walked cases had cited their fixtures by name since the first live walk — so the standard forbade something its best evidence depended on, and a day of walks widened the gap to six files before anyone noticed. Banning the identifiers while permitting the pointer keeps both properties that were in tension. Admitted 2026-08-09, after a conformance sweep found four real node IDs and file keys that had escaped into two skills during a single day's walk write-ups.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — when a skill is changed: `bin/check` prints the candidates `standards/tests/scan-clause-d.py` finds, and the reviewer confirms each. The scan cannot fail.

### E — `tests/cases.md` with at least three assertion cases

Every skill carries `tests/cases.md`: a header naming the skill and the SKILL.md version the cases were last reviewed against, a `Walked:` line, and at least three cases, each with a fixture, an assertion and a marker saying how it was walked.

```markdown
# Eval cases — skill-name (v1.1.0)

**Walked: 2026-08-05 — pass (4/4).** `node tests/test-x.mjs`, and two cases traced to SKILL.md.

## A1 · Short title stating the behaviour
Fixture: the input condition.
Assert: what must be true of the output.
Runs: node tests/test-x.mjs — "the assertion's own name"
```

- **The header's version** is the SKILL.md revision the cases were last reviewed against, not the file's own. A mismatch says the skill moved and someone should decide whether a case moves with it; a citation fix may honestly need none, so `check.sh` warns rather than fails.
- **`Walked:`** takes a date or `never`, nothing else, so `grep -rl "Walked: never"` finds every unwalked file.
- **Cases are falsifiable**: an assertion the skill could fail, at least one of them negative (something the skill must not do). Prefer behaviour that has been got wrong before.
- **Every case carries one marker** for the kind of walk it had: `Runs:` (the command and the assertion's name, because a green suite says nothing about which case it covered), `Walked live:` (a dated run against a real file), `Traced:` (followed to the instruction that mandates it, a real walk but not an observation), `Read by:` (a person judged the output), or `Not walked.` A case with no marker is not allowed.
- **A test selects what it asserts on by a stable key, never by the output's wording.** A filter on wording matches nothing once the wording changes, and an assertion over nothing passes: when one audit skill's finding texts were rewritten on 2026-10-11, 24 of its assertions would have gone on passing while checking no finding at all. Where a selection can come back empty, the test asserts it is not.
- **A rule about how output reads is walked only by its reader.** Register, tone and readability are judged by the person who reads the output; tracing and observing cannot reach them.

*Why:* the cases are the executable half of the version number, and they could not tell a walked case from a claimed one: a maintainer was told four times in one day that a defect was fixed by someone who had re-read the rule rather than re-run it. A research skill once passed every case and every clause and had seven guides rejected by their reader, because nothing had asked the reader.

*Checked:* `standards/tests/check.sh` "the floor is 3"; `tools/toolkit-check/check-runs.mjs` "is in no assertion of"; `standards/tests/check.sh` "no 'Walked:' line"; `standards/tests/check.sh` "say how they were walked", which counts the cases with no marker.

### F — Frontmatter carries `name` and `description` only, one key per line, within the Agent Skills limits

```yaml
---
name: skill-name
description: What it does and when to use it.
---
```

No `version:` key. No other keys.

*Why:* **a `version` key in frontmatter breaks `.skill` packaging.** The version lives in the body (clause A) precisely because it cannot live here. This is the one clause where the obvious-looking fix is the bug.

**Frontmatter is not prose. Never reflow it.** Each key stays on its own line. Any tool that rewraps markdown — a formatter, a linter, an unwrap script, a model editing the file — must hold the `---` block out verbatim and transform only the body below it. Folding `name:` and `description:` onto one line yields `name: skill-name description: …`, which is not valid YAML at all — a plain scalar may not contain `": "`, so the block fails to parse (`mapping values are not allowed in this context`). The loader does not hard-fail on that. It falls back to a name derived from the directory or the document's H1 and loads the skill with **no description**, so the skill still appears in the listing while having lost the only thing that makes it triggerable by intent.

*Why:* this failure is invisible to the check most likely to be running when it happens. A reflow is verified by diffing content ignoring whitespace — and collapsing a newline **is** a whitespace change, so the diff passes while the skill is broken. The symptom to recognise is the skill listing degrading from a full description to a bare title. Verify frontmatter structurally, per the awk below, not by whitespace-insensitive comparison.

**The two keys have hard limits, set by the [Agent Skills specification](https://agentskills.io/specification), not by this repo.** `name` is 1–64 characters, lowercase `a-z`, `0-9` and hyphens only, no leading, trailing or doubled hyphen, and **must match the parent directory name**. `description` is 1–1024 characters. These are format constraints on the artefact, so a violation is a violation regardless of whether the loader in front of you happens to tolerate it — a skill is handed over as a folder and read by tools this repo does not control.

*Why:* admitted by maintainer instruction (2026-08-19) rather than by a run here, and the sweep that followed found the repo already conformant on every rule but one: **two descriptions were over the cap** — 1202 and 1111 characters — and had been for several versions, because nothing measured them. Both were carrying operational detail their bodies already state, which is what a description overruns with. Directory/`name` agreement, the name charset, the layout (`scripts/`, `references/`, `assets/`, one level deep) and the frontmatter shape all held on all 18 skills. The spec's *recommendations* are not adopted as clauses: `SKILL.md` under 500 lines is a good instinct and two skills exceed it deliberately, so it stays a read, not a gate.

*Checked:* `standards/tests/check-frontmatter.sh` "over the 1024-char limit".

### G — Deterministic work belongs in a script, not in prose

**When a skill's work is deterministic and repeated, it goes in `scripts/` as an engine the agent calls. The agent is left with what the engine cannot decide.**

This is toolkit-standard §D 23 (what the source determines is generated) applied to a skill's own steps.

Code that projects call as well as the skill is the same engine with more callers: it lives in `tools/`, and the skill points at it (§D 2). A skill's own `scripts/` is for what only the skill runs.

The trigger is narrow and mechanical: **the same input must always produce the same output, and the skill must do it more than once.** The tell, in a skill as written, is a fenced block of code eight lines or longer in `SKILL.md` or a reference: prose asking an agent to paste or retype an algorithm each run. `standards/tests/check.sh`'s `[G]` names each skill's count of them; a block is an account of shipped code, not a hit, only when every name it defines is defined in the skill's `scripts/`, and indented fences count. The parity skill described adapter → schema → differ as prose for a month, two projects each built one, and the check saw nothing because it looked only for code files at a skill's root; a sweep on 2026-10-03 then found 59 such blocks in 10 skills by hand, and the check names them per skill — most of them `figma-components-audit`'s scanner checks and fix recipes, `figma-doc-generator`'s probe and verification and `figma-tokens-examples`' whole engine — each listed in the review notes of 2026-10-02 (round 4) as the debt this warning carries until the engines ship. Sorting a token list, converting a unit, computing a contrast ratio, deriving a page structure from a set of names — these have one right answer and no judgement in them. A skill that instead *describes* that logic in prose has the model retype it into every run, where it cannot be tested, varies between runs, and costs tokens each time.

Skills whose work is genuinely judgement — comparing how design systems approach a problem, writing a component description, deciding which model to use — have no engine and need none. This clause does not ask them to invent one.

#### The boundary, which is the part that matters

The engine decides **what follows from the data**. The agent decides **what the data means and what the project wants.** Four things stay with the agent, all four learned by getting them wrong:

- **Intent checks** stay with the agent: a detector hit is not a defect until it is control-passed (toolkit-standard §D 18).
- **Questions.** Colour format, unit conventions, root size, anything with no safe default.
- **Ruled deviations** stay with the agent: the engine regenerates the source value and reports success, so re-applying a standing exception after the fill is the agent's (toolkit-standard §D 19).
- **Platform-forced sequencing.** `resize()` does not reflow synchronously, so a measurement must come from a later call than the resize it judges. No amount of scripting collapses that.

*Why:* proved three times before it was written. `oklch-color-scale-system` has carried a generator plus 320 executable checks since it shipped, and is the most trustworthy skill in the repo. `figma-contrast-matrix` computes its ratios in a script and its cases run 38 assertions. `figma-doc-generator` kept 1119 lines of specified functions as prose in a reference file and retyped them per call; extracting them on 2026-08-08 immediately surfaced a bug no run had caught — a page-planning function returning "ask the user" where it should have returned a single page, which would have multiplied documentation pages on any platform-organised library. A test found it before a file did.

#### Shape

- **`scripts/`** holds every executable file. Not the skill root.
- **`tests/`** holds the tests, named `test-<subject>`. An engine that can be tested without the host application **must** be, and the case file says so; one that cannot (it needs a live Figma node, a browser) is syntax-checked instead, and that limit is stated rather than left implied.
- **Filenames are kebab-case**, like every other name in this repo.
- **No install step.** Plain `node` or `python3`, no `package.json`, no dependency beyond the language's own standard library. A skill is handed over as a folder; anything needing `npm install` is not self-contained.
- Where an engine splits into layers, the prose says which order they load in and why — a layer that calls another at runtime cannot be prepended after it.

#### Getting the engine to the runtime

**If the engine runs somewhere that cannot read the repo, the skill must define how it gets there — and the answer is never "retype it each run".** A sandboxed host (a Figma plugin, a browser console, anything reached over an RPC bridge) has no filesystem, so the only channel is the agent's own output. An engine that costs tens of kilobytes of transcription per session is one the agent will route around, and the moment it does, the deterministic core stops being deterministic.

Four rules, all paid for:

- **Load once per host, then bootstrap.** Each script is a named factory that stores its own source in the host's persistent storage (`figma.root` plugin data, `localStorage`, whatever the host offers), and the skill documents a short bootstrap that restores it. The paste is a one-time cost per file; every later call is three lines. **Say where the cache lives**, so the next session checks before pasting.
- **The hash gates the write; it never reports after it.** Storing first and validating second means a corrupt transcription is already cached and will outlive the session that made it. Refuse the write instead.
- **Hash comment-stripped, whitespace-insensitive source.** Two consequences, both wanted: a reworded comment cannot reject a functionally identical paste, and the paste itself can have its comments stripped to shrink it — measured at 87KB → 59KB on a three-file engine, with byte-identical hashes.
- **Name the anti-pattern, because it is the likely one.** Faced with a large paste, an agent will judge the transcription risky and hand-write the logic instead. That is the failure this clause exists to prevent, arriving by a different door: it produced a session of many round-trips where the scripted path was a handful, and it re-introduced by hand a defect the engine did not have.

*Why:* `figma-doc-generator` had a correct, tested engine and a documented load protocol, and a real session still ran almost none of it — because neither target file had ever been seeded, and seeding meant 87KB of retyping with no way to verify it short of the hash. The route around it was hand-written cell logic, which is precisely what that skill's own history says produces silent defects. The gate, when it was finally used, earned its place immediately: it caught a **single mis-typed character class** in 22KB (`[^\s·]` for `[^\s\u00b7]`) and refused to cache it. Checked before assuming a nicer channel exists: a plugin `fetch` to a localhost file server is blocked by the host's own network allowlist, and no tool on the bridge carries arbitrary code — so the paste-once-and-cache protocol is not a workaround, it is the mechanism.

Existing skills predating this clause are **debt, reported and never blocking** — `check.sh` names them. Migrating one is a version bump for that skill, not a repo-wide sweep, and moving a documented entry point breaks every invocation in its `SKILL.md`, so it is done deliberately or not at all.

*Checked:* `standards/tests/check.sh` "fenced code block(s) of 8+ lines".

### H — A skill reads only its own files and the toolkit's, never another skill's

A skill's own files are its `references/`, `scripts/` and `tests/`. It may also run a toolkit tool, cite a standard or point at a knowledge page by its path from the repo root (`node tools/figma-audit/fix-queue.mjs`, `standards/audit-settings.json`, `knowledge/code/tokens.md`), and `bin/get` takes each one it names with it: the paths in its `SKILL.md` and `references/*.md`, in a code span, a fenced block or after `node `, and every skill it says to run (run `figma-components-audit`). A `bin/` path the toolkit lacks is a project's own command (`bin/tokens`). It may name another skill to run, never read that skill's files, because a skill that reads another's files is coupled to its internals and breaks when they move.

*Why:* a skill that reads another's files breaks when they move. A toolkit tool is shared on purpose (toolkit-standard §D 1), and a skill that names it travels with it only if the path is one `bin/get` reads. *Evidence:* an orchestrating skill read its stages' files until 2026-09-10, when it was changed to run them by name (figma-component-pass 1.5.0); until 2026-10-31 `bin/get` followed only code, and six skills whose `SKILL.md` runs `tools/` came out of it without them (maintainer decision that day: skills may call the tools `bin/get` follows).

*Checked:* `standards/tests/check.sh` "reads another skill's files" and "names what the toolkit does not have" (warned per skill); `bin/check` "every skill, from bin/get, has what it names" (each skill taken alone, every path it names on disk); a reader confirms a sibling a skill names is named to run, not read.

### Verifying a skill

Run the checks over every skill at once, from the repo root:

```sh
standards/tests/check.sh            # A, C, E, F, G over all skills; B as information
standards/tests/check.sh --strict    # warnings become errors — the release gate
```

`install.sh` runs it before linking, so nothing reaches `~/.claude/skills` while clause F is failing. Every design-systems skill also has a row in `ds-model-routing`'s table, which names the skills outside its scope; no script checks it, so it is read when a skill is added.

**Severity is part of the standard, not an implementation detail.** Clause F is an **error**: folded frontmatter breaks the skill at load time, and refusing to install is the correct response. A, C, E and G are **warnings** — real conformance debt, but the skill still works, and blocking every install over a missing `cases.md` would leave a maintainer with no toolkit rather than an imperfect one. `--strict` collapses the distinction; use it as a release gate once standing debt is paid off, not as the daily command.

The per-clause greps, for checking one skill by hand:

```sh
S=skills/<name>
grep -m1 -E '\*\*Version [0-9]+\.[0-9]+\.[0-9]+\*\*' $S/SKILL.md   # A: version
test -f $S/CHANGELOG.md && ! grep -q '^## Changelog' $S/SKILL.md     # A: history in CHANGELOG.md
grep -c '^## Project context first' $S/SKILL.md                     # B: if applicable
grep -oiE 'client[a-z]*' $S/SKILL.md | grep -ciE '^clients?$'       # C: expect 0
awk '/^---$/{c++;next} c==1&&/^[a-z_-]+:/{print $1}' $S/SKILL.md    # F: expect BOTH name: and description:
standards/tests/check-frontmatter.sh $S/SKILL.md                    # F: keys, name/dir match, charset, 1024 cap
grep -c '^## ' $S/tests/cases.md                                    # E: expect >= 3
find $S -maxdepth 1 -name '*.js' -o -maxdepth 1 -name '*.py'        # G: expect none — code lives in scripts/
```

The clause F line prints one key per line, so it is also the folded-frontmatter test: two keys means the block is intact, a lone `name:` means `description:` was folded into it and the skill is loading without a description.

Clause C matches the bare word, not any string containing it. `clientStorage` is a Figma API name, not the agency framing the clause bans, and a check that cannot tell them apart gets ignored — which is worse than no check.

Clause B cannot be decided mechanically either — whether it applies depends on what a skill reads, which no grep can determine. The check lists the skills lacking the block and leaves the judgement to you; a skill on that list is a finding only if it does consume per-project configuration.

Clause D still needs a read — whether a literal is one project's data or a generic illustration is a judgement, not a pattern. `standards/tests/scan-clause-d.py` narrows where to look by reporting the *shapes*: node IDs and property keys without the `0:` prefix, Figma URLs, and file keys. It is advisory and deliberately not wired into `install.sh`; a judgement call does not belong in a gate that stops a maintainer installing their own toolkit. Look hardest at examples, sample output, and anything pasted in from a real run.

Passing the greps is necessary, not sufficient: clause E's cases must actually be run against the skill's behaviour, not merely exist.

---

## Part B · A plugin

*Cited as `skill-standard §B <number>`.*

Definition of done for every plugin in `plugins/`. New plugins are scaffolded by the `figma-plugin-creator` skill; existing plugins conform structurally AND visually — the ui-base block is mandatory (§4). (Grounded in the Aug 2026 plugin-standards research; re-verify manifest fields against developers.figma.com on major revisions.)


### 1 · Files (per plugin, no build step)
manifest.json · code.js (hand-written vanilla JS, `// Plugin Name — vX.Y.Z` header) · ui.html (single file; ui-base block inlined — see §4) · package.json (`{version, private:true}`) · CHANGELOG.md (Keep-a-Changelog + SemVer) · README.md (purpose, run instructions, **"Data this plugin stores"** section) · **tsconfig.json**, with **`// @ts-check` as code.js's second line**, immediately after the version header. Canonical shared assets live in `plugins/_shared/`.

*Why:* each file answers a question a maintainer would otherwise have to ask the code: which version this is, what changed, how to run it, and what it leaves in a user's document. The type-check pair: "no build step" removes the compiler, not the class of bug it catches, and these two files restore the checking without reintroducing a build — the editor type-checks `code.js` against `@figma/plugin-typings` and nothing has to be compiled, installed or run. Fixing the position as line 2 is a findability convention rather than a technical requirement: TypeScript honours the pragma anywhere in the leading comment block, so an unfixed position means a reviewer must read the whole header to learn whether checking is on at all.

*Evidence:* both files were already present in **every plugin in the repo** and enforced by the creating skill's conformance checklist, while this standard's file list stopped at README and mentioned neither — so a universal, enforced practice had no home in the standard that governs it, and the skill compensated by citing a section of this file that does not exist. Admitted 2026-08-09 after a conformance sweep read the citation against its target `[4/4 plugins]`. One plugin carried the pragma on line 5 behind a three-line rationale comment, which is the deviation the fixed position exists to make visible.

*Checked:* `skills/figma-plugin-creator/scripts/conformance.mjs` "missing tsconfig.json"; `skills/figma-plugin-creator/scripts/conformance.mjs` "has no // @ts-check" (both run over `plugins/` by `standards/tests/check.sh`).

### 2 · manifest.json — required fields
`name` · `editorType` (array) · `documentAccess: "dynamic-page"` · `main` · `ui` · `networkAccess` (default `{ "allowedDomains": ["none"] }`; enumerate real domains otherwise; `"*"` requires `reasoning`; use `devAllowedDomains` for localhost). Keep `api` pinned. `id`: **always**, published or not — a development plugin without one is assigned a fresh id on every import, so relaunch data and `pluginData` written by earlier runs point at a plugin that no longer exists; and **never change an id once storage exists** (clientStorage/pluginData are keyed to it). `permissions`: **required whenever code.js touches an API that is gated by one** — `figma.teamLibrary` needs `["teamlibrary"]`, and without it every call throws `"teamlibrary" permission not specified in manifest.json`, at runtime, in the file, where a plugin that swallows its errors reports nothing at all. Optional per need: `relaunchButtons` (only with matching `setRelaunchData` in code), `capabilities`, `menu`, `parameters`. Never ship `enableProposedApi`.

*Why:* every field the manifest gets wrong fails at runtime, in a user's file, and most fail quietly: a missing permission throws inside code that may catch it, a missing id orphans stored data, and an open network list widens what the plugin can reach without anyone deciding to.

*Evidence:* one plugin's manifest never declared `teamlibrary`, so every library call threw and its timeout guard turned each rejection into an empty list; it reported "this file has no library collections" through three shipped versions and two live test runs, until Figma put the error on screen in a third file (2026-09-25).

*Checked:* `skills/figma-plugin-creator/scripts/conformance.mjs` "manifest.json does not parse"; `skills/figma-plugin-creator/scripts/conformance.mjs` "permission: every call throws at runtime"; `skills/figma-plugin-creator/scripts/conformance.mjs` "a sync API dynamic-page refuses"; `skills/figma-plugin-creator/scripts/conformance.mjs` "while allowedDomains is" (run over `plugins/` by `standards/tests/check.sh`).

### 3 · dynamic-page discipline
No sync document APIs — the banned list and grep regex live in the skill's `references/conformance-checklist.md`. `figma.skipInvisibleInstanceChildren = true` before read-only traversal; scope `find*` to the smallest subtree; `loadAllPagesAsync()` only when cross-page data is genuinely needed.

*Why:* a large library is where a plugin is needed most, and every page it loads stays in memory while the plugin is open; the user pays in a slow, stuttering window, and the plugin works on the small test file where nobody notices.

*Evidence:* one plugin called `loadAllPagesAsync()` and never set `skipInvisibleInstanceChildren`; dragging its window stuttered, and on a 28-page library its full pass took 4.6 s. Loading other pages one at a time, only when needed, brought it to 1.2 s.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — by `figma-plugin-creator`'s conformance checklist whenever the plugin's files change; `bin/closing` names every plugin changed since the upstream.

### 4 · UI baseline (native look, no framework)
Always `figma.showUI(__html__, { themeColors: true, width, height })`. Colour comes ONLY from injected `--figma-color-*` tokens; metrics come from the shared baseline (Inter 11px base, 32px buttons, 30px inputs, radii 2/6px, 4/8/16/24 spacing). **Figma loads `ui.html` as a single document — a relative `<link>` to a local css file does not resolve at runtime.** Therefore the baseline is INLINED into each ui.html between markers: `<style>/* ui-base v2 start */ … /* ui-base v2 end */</style>` Canonical copy: `plugins/_shared/ui-base.css`. **The inlined ui-base block is MANDATORY in every plugin — existing and new.** Bespoke plugin styles build on top of the base (override selectors after the block), never fork or replace it. Conformance includes: inline the block if absent, re-inline on drift, and reconcile — strip plugin CSS that duplicates base control styling (buttons, inputs, body typography), keep genuinely plugin-specific rules. A UI normalisation always ends with a visual retest in light AND dark theme.
- **Collision safety, rich-control plugins:** ui-base's control rules use bare element selectors and apply to every matching tag. Any bespoke control class that doesn't explicitly set `height` + `box-sizing:border-box` will silently inherit ui-base's sizing instead of its own — accidental, not a crash, but not intentional either. Conformance on a plugin with more than a couple of custom controls must audit every bespoke button/input/select class against ui-base's element selectors and add explicit overrides so nothing is left to accidental cascade, even where the inherited value happens to already match. **This extends to states, not just sizing:** if ui-base already defines a correct `:disabled`/`:hover`/`:focus` treatment on a bare selector, a plugin's own more-specific rule for that same state must be checked against it — silently re-implementing the state worse (e.g. dimming a brand colour via opacity instead of using `--figma-color-bg-disabled`) is the same collision, just on a state property instead of a box-model one.

Persist window size in clientStorage; resize via `figma.ui.resize`.

*Why:* a plugin that does not look like Figma reads as foreign and breaks in the theme nobody tested; one shared baseline keeps every plugin native in both themes, and a fix to it reaches all of them. The collision rules exist because the baseline's bare selectors reach every bespoke control that does not restate them, and the result looks deliberate.

*Evidence:* the block was made mandatory by maintainer ruling (2026-08-05). The collision half was met for real: ui-base's `button:hover` outranked `.btn-secondary` on specificity, so secondary buttons in every plugin turned brand-blue under the pointer until each restated its hover (2026-09-16).

*Checked:* `plugins/_shared/sync.mjs` "no ui-base block to write into"; `plugins/_shared/sync.mjs` "differs from plugins/_shared/ui-base.css"; `standards/tests/check.sh` "sync.mjs --check" (each copy is written by the sync, toolkit-standard §D 23).

### 5 · Messaging
Discriminated union `{ type, ...payload }`. UI→main: `parent.postMessage({ pluginMessage: msg }, '*')`; main→UI: `figma.ui.postMessage(msg)` read from `event.data.pluginMessage`. Correlation `id` for request/response. Structured-clone data only.

*Why:* the UI and the main thread share nothing but this channel. Without a `type` every handler guesses what it received, without an `id` two replies in flight can be matched to the wrong request, and a value that cannot be cloned fails when posted.

*Evidence:* (Mechanism, not an incident.) `postMessage` copies by structured clone across the iframe boundary, so functions and Figma node objects cannot cross, and replies arrive in completion order, not request order.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — by `figma-plugin-creator`'s conformance checklist whenever the plugin's files change; `bin/closing` names every plugin changed since the upstream.

### 6 · Storage boundaries
Preferences → `clientStorage` (5 MB/plugin) · document data this plugin owns → `setPluginData` (≤100 kB/entry, enforced since 2025-03-17) · cross-plugin interop only → `setSharedPluginData` (namespace ≥3 chars).

*Why:* each store has a different owner and reach. A preference written into the document follows the file to every collaborator, document data kept in `clientStorage` is lost on another machine, and shared data is readable and writable by any plugin, so the wrong choice leaks, loses or exposes data without an error.

*Evidence:* (Mechanism, not an incident.) `clientStorage` is per user and per machine, `pluginData` travels with the file but only its own plugin can read it, and `sharedPluginData` is open to every plugin that knows the namespace.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — by `figma-plugin-creator`'s conformance checklist whenever the plugin's files change; `bin/closing` names every plugin changed since the upstream.

### 7 · Errors & lifecycle
try/catch around async work; user-facing failures via `figma.notify(msg, { error: true })`; `figma.closePlugin()` when a no-UI command completes.

*Why:* an error a plugin catches and does not show is an error the user reads as a result. A no-UI command that never closes leaves its spinner running, and the user cannot tell whether it is still working.

*Evidence:* one plugin's guard caught every rejected library call and returned an empty list, so a missing permission read as "this file has no library collections" through three versions; it now reports the first error it swallows through `figma.notify` (2026-09-25).

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — by `figma-plugin-creator`'s conformance checklist whenever the plugin's files change; `bin/closing` names every plugin changed since the upstream.

### 8 · Versioning
SemVer in package.json (source of truth) mirrored in the code.js header comment; CHANGELOG.md entry per release. The manifest has no version field, and a README states no version of its own.

The header also carries **` · skill-standard vX.Y.Z`** — the version of *this* standard the plugin was last audited against, updated only when an audit actually happens. A stamp from before the standards merged (2026-10-08) names **` · plugin-standard vX.Y.Z`**, the retired file it was audited against, whose versions are Part B of `changelog/toolkit-standard.md`; a stamp is never renamed to this file's numbering without an audit, since the two count differently. **It is expected to lag, and the lag is the signal**, not a defect to tidy: a plugin stamped three minor versions back is telling you which rules have never been applied to it. Do not bump every stamp when this file is revised; that would erase the only record of which plugins have been re-checked.

*Why:* rules arrive in this standard because a real plugin failed, and the plugins that already existed do not get re-audited automatically. Without the stamp there is nothing at all distinguishing "checked and clean under the current rules" from "never looked at since".

*Evidence:* one plugin sat stamped at v1.1.0 while the collision-safety rule arrived in 1.2.0 and its state half in 1.3.0. Read on 2026-08-09, the stamp was exactly right — an audit against those two rules found its segmented control inheriting `height` from ui-base's bare `button` selector, and its `:hover` declaring `color` alone so that ui-base's `button:hover` supplied a brand background to the inactive half. A second plugin stamped at the same version was audited the same day and was **clean**, because it declares no control elements for those rules to bite on. Both outcomes were only visible because the stamp said where to look `[4/4 plugins carry it]`.

*Checked:* `skills/figma-plugin-creator/scripts/conformance.mjs` "README says v"; `skills/figma-plugin-creator/scripts/conformance.mjs` "audit stamp names" (run over `plugins/` by `standards/tests/check.sh`).

### 9 · Network fetch from plugin UI — CORS and the null origin
A Figma plugin UI (`ui.html`) runs inside a **sandboxed `data:` URL iframe**, which has origin `'null'` by spec. This has a real, confirmed consequence: **some CDNs reject fetches from a null origin outright** — `unpkg.com` does, returning a CORS block *and* a 500, independent of whether the URL involves a redirect (`@latest` redirects to a pinned version; pinning the version alone did NOT fix it — the direct, non-redirected request was rejected identically). **`cdn.jsdelivr.net`** is confirmed to work: it documents unconditional `Access-Control-Allow-Origin: *` on every response, specifically for cross-origin cases like this.
- **Prefer jsdelivr over unpkg** for any npm-package asset a plugin UI fetches directly (`https://cdn.jsdelivr.net/npm/{package}@{version}/{path}`).
- **Always pin an exact version**, never `@latest` — avoids depending on a redirect's CORS behavior at all, and keeps behavior reproducible.
- **This class of failure is invisible to remote/API diagnostics.** Checking `figma.root.getPluginData`, retrying, or reasoning about the code cannot surface a CORS rejection — only the actual browser console can (right-click the plugin UI → Inspect → Console). Treat "the UI shows blank/stuck content and I can't explain why from the code" as a cue to ask for a console log *before* proposing further code changes.
- **Bounded concurrency + retry is still correct practice**, but is not a substitute for fixing a hard CORS wall — no retry count fixes a deterministic policy rejection. Use a small (~6) concurrent-fetch queue for any grid/list that lazy-loads many external resources via `IntersectionObserver`, with a bounded per-item retry (2-3) and an honest terminal "failed, click to retry" state — never leave a lazy-loaded item blank forever with a silently-swallowed error.

*Why:* a policy rejection looks like flakiness from every place but the browser console, so the obvious fixes (retry, throttle, pin) are engineered against the wrong problem and each appears to half-work.

*Evidence:* one plugin's icon grid showed blank gaps through several versions; a retry loop and then a concurrency queue were both added for it before a console log showed every fetch failing against unpkg's null-origin rejection, which pinning the version did not fix and moving to jsdelivr did (2026-08-06).

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — by `figma-plugin-creator`'s conformance checklist whenever the plugin's files change; `bin/closing` names every plugin changed since the upstream.

### 10 · Settings hygiene
A setting must drive exactly what it's named for — never wire a similarly-purposed value into an unrelated property "because it's already there." A decorative/chrome element a user cannot meaningfully customize (e.g., a component-set boundary stroke that only exists to mimic Figma's own "Combine as variants" chrome) should be a **hardcoded constant**, not read from settings, even if a plausibly-named setting exists. If audit finds a setting's default was "fixed" to resolve a symptom without confirming what that setting is actually *for*, that's a signal to re-derive the setting's real purpose before changing its default — changing an unrelated setting's default is not a fix.

*Why:* a setting wired to the wrong property moves two things when the user changes one, and every fix aimed at the visible symptom changes the setting's default and breaks the property it was really for.

*Evidence:* one plugin wired its component-set chrome stroke to the icon import's border-thickness setting. Several versions changed that setting's default and added a one-time migration to make the chrome thinner, none of which stuck, until the chrome took a hard-coded constant and the setting went back to the value its own purpose needed (2026-08-06).

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — by `figma-plugin-creator`'s conformance checklist whenever the plugin's files change; `bin/closing` names every plugin changed since the upstream.

### 11 · `pluginData` is scoped per-plugin-id — a debugging trap
`figma.root.getPluginData(key)` / `setPluginData` are private to the calling plugin's own ID, even for the same key name and the same file. A diagnostic script run through a **different** plugin (e.g. a bridge/dev-tools plugin used for live inspection) reading `getPluginData('someOtherPluginsKey')` reads that DIFFERENT plugin's own (likely empty) namespace — NOT the target plugin's actual stored data. This can produce completely misleading "storage is empty" results that look like solid evidence but aren't. The only reliable way to inspect a plugin's real stored data is from within that same plugin's own code (e.g., a temporary debug message type it can print via its own `figma.ui.postMessage`), or by asking the user to check via that specific plugin's own UI/Settings.

*Why:* an empty read looks like evidence, and it is the cheapest read a diagnostic session can make, so it gets made early and steers every step after it.

*Evidence:* in one plugin's settings investigation, every "storage is empty" check ran through the bridge plugin and read the bridge's own namespace; a one-time migration was built for a stored value that was never the problem (2026-08-06).

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — by `figma-plugin-creator`'s conformance checklist whenever the plugin's files change; `bin/closing` names every plugin changed since the upstream.

### 12 · Change workflow
edit → grep the banned-API regex → re-import manifest in Figma → run in a small file AND a large multi-page file → verify stored settings load → bump version + changelog → commit.

*Why:* each step catches what the step before it cannot see: the editor does not run the plugin, a small file hides what only a large multi-page file costs, and a fresh install hides what a file with saved settings does with a new default.

*Evidence:* one plugin changed a setting's default and the change never took effect in any file already used with it, because the value each file had saved overrode the new default, and the release note had assumed it would apply (2026-08-06).

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — by `figma-plugin-creator`'s conformance checklist whenever the plugin's files change; `bin/closing` names every plugin changed since the upstream.

### 13 · Plugin API traps that fail silently
Each of these returns success or a plausible result while doing nothing, so a script that does not re-read its own effect reports work it did not do. They bind any code running the plugin API — a plugin, or a script sent over the Desktop Bridge. Not mechanically checkable; needs a read.

- **An extended collection's mode is cleared through its parent.** `clearExplicitVariableModeForCollection(extension)` throws nothing and leaves the mode set; passing the collection it extends (`parentVariableCollectionId`) clears it. The id-string form is refused in incremental mode, so the object is the only form.
- **A hidden library variable cannot be imported by key.** `importVariableByKeyAsync` answers "could not find variable" (or hangs) for a variable hidden from publishing, even when its key is right. It reaches a consumer file only through a published component that binds it, so reuse the id an existing instance already carries — find it by scanning bound variables for the source collection's key. A consumer's remote id suffix is not the source file's local id, so the id cannot be built from the source.
- **A timed-out bridge call keeps running, and later calls queue behind it.** The 30 s limit ends the reply, not the script; writes land after "timed out", and the next call waits for them. Snapshot the state a write must preserve before sending it (into `setSharedPluginData`, removed after), check against the snapshot instead of re-running, and send small batches one at a time — two calls sent together both timed out, where one at a time finished in milliseconds.

*Why:* all three look like a finished step. The mode clear and the failed import read as success or as "the variable is missing"; the timeout reads as failure while the work continues, and a blind re-run then races it.

*Evidence:* one session's cleanup of a consumer library. Clearing modes on 274 frames left 121 still set, all on one extended collection, until the parent was passed. Relinking 5,360 bindings to a resource library's hidden variables failed by key and succeeded through ids already present on that library's instances. Resetting overrides on 43 header instances timed out five times while completing; a before-snapshot showed 25 of 25 unchanged and caught four that never finished.

*Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — by `figma-plugin-creator`'s conformance checklist whenever the plugin's files change; `bin/closing` names every plugin changed since the upstream.
