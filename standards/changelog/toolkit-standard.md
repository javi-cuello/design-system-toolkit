# History — toolkit-standard

Parts A and B moved to skill-standard in 2.0.0; a citation of the old form resolves through this map.

| Was | Now |
|---|---|
| toolkit-standard §A | skill-standard §A |
| toolkit-standard §B | skill-standard §B |

- 2.19.3 (2026-10-31): §D 22: a guide in `docs/` and `CONTRIBUTING.md` are held to the README rule; the root README split into them.
- 2.19.2 (2026-10-31): §D 11: the review reads against `tools/toolkit-check/review.md`, the list of what it checks.
- 2.19.1 (2026-10-30): §D 23's *Open:* line: the nine outputs it listed are generated; two narrower ones stay, named.
- 2.19.0 (2026-10-30): §C clause B: a section cited by its heading must exist, checked; clause D: what follows a `;` must be a pair, and a string holds no double quote; §D 1 and §D 13 point at the READMEs and the clause that hold what they cite.
- 2.18.2 (2026-10-30): §D 11: the review's closing commit names it independent in its `Review:` trailer; a change's own `Review:` trailer had closed the owed review in silence.
- 2.18.1 (2026-10-30): §D 23's *Open:* names the Figma-side outputs still assembled by hand, each checked in its skill; figma-plugin-creator's scaffold is now generated.
- 2.18.0 (2026-10-30): the plan for full-size work holds Claims: each claim its output's correctness or its scope rests on, how it is known, what being wrong costs, and the check that settles it before the work relies on it.
- 2.17.2 (2026-10-30): §D 23's *Open:* no longer names a component's markup, parity mapping and story list for React and web components: `component-contract/to-markup.mjs` generates them.
- 2.17.1 (2026-10-29): §D 23's *Open:* also names parity mappings, story variant lists and the Sass entry's components list; §D 22's check also holds `knowledge/README.md` to naming every page.
- 2.17.0 (2026-10-29): §D 23 — what the source determines is generated, never written: code, Figma and docs alike, regenerable and diffed by `--check`; the agent writes only what the source does not determine.
- 2.16.0 (2026-10-28): §D 13 — the gates count a script's own writes and unreviewed work another session left uncommitted, refuse a push of unreviewed full-size work or one made while a review runs, and wait for background reviews to report.
- 2.15.0 (2026-10-28): §D 13 — full-size work is gated: a plan before, a fresh-agent review after, then `Toolkit:`, `Open:` and `Docs:` lines (`tools/claude-hooks/gates.mjs`); §D 22 checked by the last.
- 2.14.0 (2026-10-26): §D 11 — the daily pass (`bin/maintain`) is retired: every session already runs `bin/check` before and after its work and at push, and its three recorded runs were red only on flakes and a hang; the fourteen-day review stays.
- 2.13.0 (2026-10-20): §D 21 enforced — the edit hook names the knowledge pages for an interface file beside its first change, and the push check refuses an interface commit without a `Knowledge:` trailer (pages, or `none — <why>`); §D 13's Learn row names both trailers.
- 2.12.0 (2026-10-15): §D 13 — the hooks speak to the session, never on screen: Stop keeps what is open for the next prompt instead of blocking, and the edit hook hands over an area's rules beside the first change instead of refusing it.
- 2.11.2 (2026-10-14): names that could identify a project are replaced in a fixture, an example or a comment; behaviour unchanged.
- 2.11.1 (2026-10-14): tool paths follow the move of the toolkit's own checks to tools/toolkit-check and of the project registry to tools/snapshot/projects.cjs; no rule or behaviour changed.
- 2.11.0 (2026-10-14): §D 22 — every folder a newcomer opens carries a README in the consensus shape, checked by tools/shared/readmes.mjs.
- 2.10.2 (2026-10-14): tool paths follow the renames (tools/snapshot, tools/component-contract, tools/docs-site, tools/css-lint, tools/ui-check, tools/project-check, tools/claude-hooks, tools/skill-evals); no rule changed.
- 2.10.1 (2026-10-14): §D 1 cites check.sh's "reads outside its folder" for clause H; share-skill.sh is retired.
- 2.10.0 (2026-10-14): §D 6: no file in the toolkit names a project, prose and walk records included, checked by bin/check; §D 12: a project's home is `~/Projects/<label>/figma-design-system/`, outside the toolkit.
- 2.9.0 (2026-10-13): §D 0 question 7 — the toolkit question also names a knowledge gap the work ran into, worth researching, with the page it would go in.
- 2.8.2 (2026-10-13): §D 13's Close row — the answer is given once a turn; a hook follow-up after it carries only the hook's lines.
- 2.8.1 (2026-10-13): §D 21 and §D 0 — the knowledge pages bind new UI work; other code reads code-standard.
- 2.8.0 (2026-10-13): §D 21 — new work built in code starts from the knowledge pages for what it builds; §D 0 asks it (question 12).
- 2.7.0 (2026-10-11): §D 21 — every design pattern carries its code counterpart (a Build part), checked.
- 2.6.0 (2026-10-11): §D 21 — knowledge/ holds guidance with sources, never rules, fed by research and asked for at closing (§D 0 question 7); the lifecycle says the front-end standards' candidates live there.
- 2.5.0 (2026-10-11): design-standard joins the table of standards.
- 2.4.2 (2026-10-08): a *Checked:* into a skill names a test bin/check runs or a file whose header says what runs it.
- 2.4.1 (2026-10-08): clause D says a *Reviewed:* opens with its prompt; §D 0 question 11 asks about the judgement rules bin/closing lists.
- 2.4.0 (2026-10-08): §D 20, the toolkit's words follow the project's dialect, moved from figma-standard.
- 2.3.0 (2026-10-08): clause D: two markers only, *No check yet.* refused, *Reviewed:* names the file that prompts it; naming-standard retired into figma-standard.
- 2.2.1 (2026-10-08): clause D names what comment removal cannot see; markers join their pairs with ";".
- 2.2.0 (2026-10-08): clause D: a *Checked:* opens with `path` "string" pairs joined by ";"; what follows is prose.
- 2.1.3 (2026-10-08): clause C's check names each string with its file.
- 2.1.2 (2026-10-08): clause C: the reason is checked, the evidence reviewed at admission.
- 2.1.1 (2026-10-08): §D 17–19 gain their reasons; precedence lets a project override figma, naming or code rules; *Checked:* markers name a file and a string.
- 2.1.0 (2026-10-08): §D 11: the three clocks of self-maintenance: heal on every check, a daily read-only pass, a review owed every fourteen days.
- 2.0.0 (2026-10-08): becomes the root standard: §C rewritten as the rule lifecycle with one enforcement marker for every standard; §D 14–19 moved in from house-standards; Parts A and B moved to skill-standard; history moved here, and the reasons it carried moved into the rules.
- 1.13.0 (2026-10-07): §D 13 Close step: the marked Answer carries everything relevant from the turn; the hook message says so.
- 1.12.0 (2026-10-06): §D 13 Close step: the Stop hook blocks once per item; another session's item gets one line; closing lines first, Answer last.
- 1.11.2 (2026-10-03): §D 0's Before step asks §D 5 again; three citations of the old `CLAUDE.md` repointed.
- 1.11.1 (2026-10-03): §D 13 Before step: the edit hook hands over an area's rule titles on the first change.
- 1.11.0 (2026-10-03): §D 13 gains the Prove step (`tools/evals`); the router runs the toolkit's stored-state checks for every project.
- 1.10.1 (2026-10-03): citations of `CLAUDE.md` items repointed after it became a pointer file; §D 2 takes the two-repo audit procedure.
- 1.10.0 (2026-10-03): new §D 13, the loop, with a trigger for every step.
- 1.9.0 (2026-10-03): §D 8: an accept with lessons is refused until `--triaged` names where they went.
- 1.8.2 (2026-10-03): §B rules 3, 5–7 and 9–13 triggered by `bin/closing`; code-standard and snapshot-standard rules marked *Checked by* or *No check yet*.
- 1.8.1 (2026-10-03): fixes to 1.8.0: §D 0 question count, §D 8 reads stylesheet comments, clause G's `[G]` exemption tightened.
- 1.8.0 (2026-10-03): clause G names its tell and `check.sh`'s `[G]` check; §D 0 gains the fifth question; §D 2 cites clause G.
- 1.7.0 (2026-10-03): Part D preamble: every *reviewed* names its moment; §D 0 owns the review questions; §D 2 gains `[D2]`; §D 8 moves to discovery.
- 1.6.1 (2026-10-02): §D 2 scaffold-copy check described as comparing bodies, not names.
- 1.6.0 (2026-10-02): §D 2 gains the scaffold copy, recorded as `scaffoldOwn` in `owned.json`.
- 1.5.2 (2026-10-01): §D 2: shared code lives by who calls it; `scripts/` for the skill alone, `tools/` when projects call it.
- 1.5.1 (2026-10-01): superseded by 1.5.2.
- 1.5.0 (2026-10-01): §D 2: a skill that tells every project to write the same code has buried it; `twins.mjs` added.
- 1.4.1 (2026-10-01): §C step 4's citation grep covers the whole repo; three new `check.sh` warnings (§A clause A, run paths, §B 8).
- 1.4.0 (2026-09-29): §B 13, plugin API traps that fail silently.
- 1.3.0 (2026-09-25): §B 2, `permissions` required when the code needs one; `check.sh` enforces `teamlibrary`.
- 1.2.0 (2026-09-20): §D 5 names the audit as its exception: the test is stored state against the present.
- 1.1.0 (2026-09-20): new §D 12, a project's truth lives in its context document; §D 1 citation fixed.
- 1.0.0 (2026-09-20): four standards merged into one, each part moved verbatim with handles unchanged.

### Part A — a skill (was `skill-standard.md`)

- 1.10.1 (2026-09-10): reference implementation renamed to `figma-components-audit`. Wording only.
- 1.10.0 (2026-08-19): clause F adopts the Agent Skills limits on `name` and `description`; `check-frontmatter.sh` measures them.
- 1.9.0 (2026-08-19): clause G gains the delivery rules for engines in sandboxed hosts: cache, hash-gated write, normalised hash, named anti-pattern.
- 1.8.0 (2026-08-10): clause E gains a third kind of walk: output about reading needs the reader.
- 1.7.0 (2026-08-09): clause D gains a carve-out letting walk records point at `projects/<label>/`.
- 1.6.0 (2026-08-08): clause E fixes `Walked:` to a date or `never`.
- 1.5.0 (2026-08-08): clause A exempts changes confined to `tests/` from the version bump.
- 1.4.0 (2026-08-08): clause E defines the cases-header version; `check.sh` adds header-drift, missing-bump and routing-row checks.
- 1.3.0 (2026-08-08): clause D gains the `0:` prefix convention and the advisory `scan-clause-d.py`. Cases D1–D3.
- 1.2.0 (2026-08-08): verification becomes runnable via `check.sh`, with severities; clause C's grep matches the bare word.
- 1.1.1 (2026-08-08): clause F gains cases and `check-frontmatter.sh`. No clause changed.
- 1.1.0 (2026-08-08): clause F gains the frontmatter-is-not-prose rule.
- 1.0.1 (2026-08-07): formatting only. No clause changed.
- 1.0.0 (2026-08-05): initial standard.

### Part B — a plugin (was `plugin-standard.md`)

- 1.9.0 (2026-09-29): new §13, plugin API traps that fail silently.
- 1.8.0 (2026-09-25): §2 requires `permissions` when the code needs one; `check.sh` enforces `teamlibrary`.
- 1.7.0 (2026-08-21): §2 requires `id` on every plugin.
- 1.6.0 (2026-08-09): §8 documents the `· standard vX.Y.Z` audit stamp in the code.js header.
- 1.5.0 (2026-08-09): §1 adds `tsconfig.json` and `// @ts-check` on code.js line 2.
- 1.4.2 (2026-08-07): formatting only. No rule changed.
- 1.4.1 (2026-08-07): formatting only. No rule changed.
- 1.4.0 (2026-08-06): new §9 (CORS and null origin), §10 (settings hygiene), §11 (`pluginData` scope); old §9 renumbered §12.
- 1.3.0 (2026-08-06): §4 collision-safety rule extended to state styling.
- 1.2.0 (2026-08-06): §4 collision-safety rule added for bespoke controls.
- 1.1.0 (2026-08-05): §4 ui-base block mandatory for all plugins, with a light and dark retest.
- 1.0.0 (2026-08-05): initial standard.

### Part C — a standard (was `meta-standard.md`)

- 1.3.1 (2026-08-09): clause C's description of how coverage is obtained corrected. Rule unchanged.
- 1.3.0 (2026-08-08): clause C requires coverage to be available; computing preferred, a stamp the fallback.
- 1.2.0 (2026-08-08): clause C gains Coverage for cross-project standards.
- 1.1.0 (2026-08-08): clause C gains retire-never-renumber and the citation gloss; Updating gains step 4.
- 1.0.0 (2026-08-08): initial standard.

### Part D — the ecosystem (new)

- 1.0.0 (2026-09-19): initial standard.
