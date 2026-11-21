# How the audit is built

What this skill rests on, how its files divide the work, and what every project shares. [SKILL.md](../SKILL.md) says what to do and in what order; this file says why the parts sit where they do.

## Contents

- [Grounding](#grounding)
- [The two axes](#the-two-axes)
- [Files](#files)
- [One scanner, three launchers](#one-scanner-three-launchers)
- [No project's vocabulary in shared code](#no-projects-vocabulary-in-shared-code)
- [Shared and per-project](#shared-and-per-project)
- [Adding a check](#adding-a-check)
- [Setting up a second project](#setting-up-a-second-project)

## Grounding

The dimensions and their priority order rest on published practice, not house opinion.

| Source | What this skill takes from it |
|---|---|
| TJ Pitre / Southleft ("Anatomy of an AI-Ready Design System", and FigmaLint) | The core thesis: what makes a design system AI-ready also makes it readable. AI is the strictest reader a file gets, since it cannot infer, ask or squint at the canvas. FigmaLint's measured weights set the rough priority order. |
| Nathan Curtis / EightShapes | Pass, Fail and N/A review criteria, and the auditor as a second pass: the builder checks their own work, and a distinct reviewer verifies it. |
| Brad Frost | Inventory first: know what exists before judging one piece. The atomic split between public components and private building blocks. |

FigmaLint's weights, in priority order: tokens (about 25%) and real instances over detached frames come first. Component properties (about 22%) come next, then interactive states (about 20%). Boundaries, naming and hygiene add roughly 30% across many small items.

Descriptions score only about 3%, yet they are the biggest practical lever: they are the prompt an AI reads before generating anything. The composition line ("uses Avatar, Badge, IconButton") is the most useful sentence in a description. It stops an AI reinventing components that already exist.

**Where this skill departs from the source**. Pitre treats a fully populated variant matrix as an unqualified good. This skill's evidence differs: a consistent, file-wide sparse pattern (`Disabled=True` pairing only with `State=Rest`) can be a deliberate house convention, not a gap.

Both agree on the failure, an AI improvising a missing variant. They differ on the fix: always fill the matrix, or document the pattern so nothing needs improvising. The library's rulebook records which stance it has earned.

## The two axes

Every check sits on two independent axes, and the file layout mirrors them, so anyone can see what is checked and why.

### Who checks

- **Scanner (deterministic)**. Yes-or-no questions a script answers once given its settings: is this value bound, does this axis come last, is this description empty. The script is `scanner/audit.js`, and [scanner-checks.md](scanner-checks.md) says why each check exists. Its output is candidate findings only, which never reach the maintainer directly.
- **Every candidate carries `text` and `advice`**. The text says what goes wrong and what it does to the people using the component; the advice is the fix (design-standard rule 10). A session audit refuses a candidate with no advice rather than filing a stock line.
- **Agent (judgement)**. Everything a script cannot decide: verifying candidates against raw nodes, recognising mechanisms (a −1 overlap, a progress-fill padding), and ruling on intent. Coverage questions, composition and content resilience are the agent's too. The protocol is [judgment-protocol.md](judgment-protocol.md), and only findings that survive it reach the maintainer.

The boundary is strict. A check that needs to know *why* something was built that way is the agent's, and the scanner may only raise it as a candidate. A check fully decidable from node data and the convention files is the scanner's, and the agent only verifies it.

### Why the rule exists

| Source | Where it lives | What it holds |
|---|---|---|
| Universal | [conventions-universal.md](conventions-universal.md), shipped with the skill | Portable practice for any well-formed library: values bound, no default layer names, states that render, public components described, focus shown. |
| System | The library's rulebook, in the project's context document | One library's opinions: its spelling, scales, state words and order, axis grammar, naming suffixes and accepted exceptions. |
| Knowledge | `knowledge/ui/components/<name>.md` (toolkit-standard §D 21), read in step 4b | What one component's build needs on the evidence: its parts, names, axes and values. |

**A rulebook is not shipped with this skill**. It is discovered the first time the skill audits a Figma file, recorded per project, and read by `fileKey` on every later run. A skill used across projects meets several rulebooks, each named by its `fileKey`, and no single file stands for "the" system. A local `systems/<library-name>.md` holds a copy of a resolved rulebook, never the source.

**Knowledge is copied into no scanner or convention file**. So a run without the knowledge base loses this layer and nothing else.

The same defect can differ by source. "Spacing should be bound to a token" is universal; "the spacing scale is 0–32 with no 10" is system. A finding names its source, because the fix conversation differs. A universal violation is simply wrong. A system violation may mean the rule should change: a raw 10 appearing twice may mean the scale lacks a step.

**Never treat a rulebook as portable**. A rule found in one library's evidence has no authority over another. Mixing them produces false findings on the first run against anything new.

## Files

```
SKILL.md                    orchestration: what to do, in what order
scanner/                    THE audit: executable and data, and the only copy of either
  audit.js                  every scanner check, given its settings by the rulebook
  sweep.js                  the fingerprint pass
  judge.txt                 the judgement layer's instruction ({{CONVENTIONS}}/{{RULINGS}}/{{CANDIDATES}})
  judge.json                the model and effort every project's judgement pass runs with, and why
  fix.txt                   how a bucket-1 fix is written ({{FINDING}}/{{REC}}/{{DESCRIPTION_STRUCTURE}}…)
  buckets.json              which bucket a rule lands in: the reporting contract
  checks.json               the check catalogue, and the ONLY statement of what runs vs what is backlog
  scoring.json              the on-request score's dimensions, weights and rule mapping
  measures.json             the measures an audit reports: what each counts, its threshold and why
scripts/
  probes.js                 a session's other deterministic work as FCA.*: discovery, probes, fix recipes
tests/                      cases.md; test-audit.mjs, test-probes.mjs, test-sweep.mjs, plain node
references/                 portable, ships with the skill, the same for every library
  architecture.md           this file
  scan-and-probes.md        running the scanner and the probes, scope, composed frames, tools
  knowledge-pages.md        step 4b: reading a set against its knowledge page
  judgment-protocol.md      verification, mechanisms, classification, discovery
  conventions-universal.md  portable rules, each tagged [scanner] or [agent]
  scanner-checks.md         WHY each check in audit.js and probes.js exists; not a second implementation
  fix-queue.md              the report's rules and the chat template
  record.md                 delivery, the record, filing rows, re-audit, sweep, the dashboard
  scoring.md                the on-request 0–100 score
systems/                    OPTIONAL local cache, generated, never shipped
  <library-name>.md         a copy of a resolved rulebook, for persistent environments only
```

## One scanner, three launchers

**`scanner/` is the source of truth, and there is exactly one of it**. A session runs its files, and the dashboard fetches the same files and runs them too. So an audit gives the same result whoever launched it, which is the whole requirement. A second scanner drifts, and then nothing says which audit just ran.

The **Audit lite** plugin (`plugins/audit-lite`) is the third launcher, for a library with nothing else set up. It carries the scanner, the judge prompt, the bucket map and the universal conventions as a generated block. Its sync script writes that block, and `bin/check` checks it. It runs them on the house settings and hands the judgement to whichever Claude the report is uploaded to.

**Everything the audit decides is in `scanner/`, not in whatever launched it.**

| File | What it decides |
|---|---|
| `audit.js` | What to check |
| `judge.txt` | What survives judgement |
| `fix.txt` | How a fix is written |
| `buckets.json` | Which bucket a finding lands in |
| `checks.json` | What the audit covers at all |

The dashboard fetches all five and decides only how to draw the result. A copy of any of them held elsewhere drifts.

**The dependency runs one way**. This skill does not depend on the dashboard. The scanner is plain JavaScript run through `figma_execute`, so a session audits a library with nothing but the bridge: no service, port, record or browser. The dashboard depends on the skill and fetches these files at run time. The skill is mandatory, and the dashboard is an optional UI for it; anything the dashboard can do that a session cannot is a defect.

**The dashboard is not here**. It is one shared copy at `tools/figma-audit/`: the page, the server and the scripts every project runs. This skill ships no copy of the page, because a copy of something that lives elsewhere in the repo is always the stale one.

**The references cite each other, and nothing checks that they agree**. For example, `judgment-protocol.md` cites `conventions-universal.md` for what a description must cover, and `scanner-checks.md` for how contrast resolves. A rule changed in one leaves the others asserting the old one, plausibly and silently. So changing a rule in one reference means grepping the others in the same commit. This is toolkit-standard §C's rule on re-reading a rule's citations, applied to a skill.

**`references/` is fixed content**. The same files apply to a web library, a mobile library or any other Figma file.

A library's rulebook lives in the context document and keeps changing. When the maintainer rules on an open question, the ruling moves into it. An accepted one becomes an exception the scanner suppresses, and a rejected one returns as a fix. The `systems/` folder starts empty and stays empty unless caching a resolved rulebook between sessions pays.

## No project's vocabulary in shared code

Every library-specific value reaches the scanner in `TOKENS`, from the `audit-settings` block in the project's context document. That covers the semantic collection's name, the spacing scale, the text-role segment, the component pages and the state axis. The one baseline beneath it is the house `audit-defaults` block, which a project key overrides per setting.

**A rule absent from both layers skips its check; it never falls back to a default**. A default in shared code is another project's answer. A borrowed one does not fail loudly: it files confident, plausible, wrong findings (case A57).

Where a project has no record yet, the rulebook comes from discovery ([judgment-protocol.md](judgment-protocol.md) §1), and `TOKENS` is built from what discovery established. A value discovery could not settle is left out, and its check does not run. The report names it under *Not scanned*.

**What a project's settings carry**. Every key, its meaning and what reads it are listed once, in the `audit-keys` registry in `standards/audit-settings.json`. The house `audit-defaults` give the house's answer, and a project's `audit-settings` override only what differs.

A project supplies what no house can know: `semantic`, `spacing`, `radius`, `excludeSections` and `familyCategories`. The first is the semantic collection's exact name, or a list of names; the next two are its recorded scales.

`tools/toolkit-check/check-standards.mjs`, run by `bin/check`, refuses four things. They are an unregistered key, a key nothing reads, and a value that only restates the house default (healed with `--fix`). The fourth is a house value quoted in scanner code. See `optionOrder` for the same principle applied to axis order.

## Shared and per-project

Getting this wrong is how a fix reaches one project and not the others.

| Shared: one copy in the toolkit's `tools/` | Per library: in `<project>/audit/<fileKey>.json` |
|---|---|
| `server.mjs`, and the page in `tools/docs-site/src/dashboard/` | The record: rows, runs, scores, fingerprints, measures |
| `scanner/*`: checks, prompts, buckets, catalogue, scoring, measures | Settings and rulings, in the project's context document, not the record |
| The checks, the scoring model, the queue's shape | `libraries/<fileKey>`: name, title, Figma URL |

**Every project runs the same files with a different `--data`**. A change to the page, the server or the scripts reaches all of them when the service restarts. Nothing is copied, so nothing drifts. The service serves the scripts at `/scripts`; a script kept in a project's record reaches only the projects someone remembers to update.

## Adding a check

1. Put it in `scanner/audit.js`.
2. Give its rule a bucket in `scanner/buckets.json`.
3. Add or flip its entry in `scanner/checks.json`. A check absent there is invisible to the About tab and to scoring's "unscanned" arithmetic.
4. Map its rule to a dimension in `scanner/scoring.json`, if it should affect the score.
5. Run `node plugins/audit-lite/sync.mjs` so the plugin carries it.
6. Where it needs an opinion, read it from the settings (`TOK.<key>`). Register the key in `audit-keys`, and give the house's answer in `audit-defaults` if the house has one. Name the check under its rule in `rule-checks`.

`bin/check` refuses each of these left out. [scanner-checks.md](scanner-checks.md), *Adding a check*, lists what its documentation needs.

A finding names the setting it applied, never a standard's rule number. The setting is what the project can change, and a number is one standard's numbering. A check that names one library's scale files false findings in the next project (A57).

Nothing needs copying to any project. Every project's service reads these files at request time, so a refresh is the whole step.

## Setting up a second project

1. An `audit/<fileKey>.json` holding a `libraries/<fileKey>` entry with `name` and `figmaUrl`. The file registry in the project's context document names it.
2. An `audit-settings` block in that same document.
3. A service instance on its own port.

Nothing in the page or the scripts is project-specific. A file key or a rulebook baked into either is a page that quietly audits the wrong library.
