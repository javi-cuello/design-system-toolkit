# The independent review

What the fourteen-day review (toolkit-standard §D 11) checks. Fresh agents
read the toolkit end to end against every point below, across all of it:
skills, tools, plugins, standards, knowledge, `bin/` and the hooks. Each
finding is re-checked before it is reported. The commit that closes the review
carries a `Review:` trailer naming it independent and naming this file,
`tools/toolkit-check/review.md`: `bin/closing` counts only that line, so a
change's own review never closes this one.

## How a review runs

`bin/review` runs it without the maintainer (a launch agent starts it daily
with `--if-owed`; it acts only when the cadence says a review is owed): on a
`review/<date>` branch in its own worktree, `bin/check` first (a red is the
first finding and stops the run), then the queue (`bin/closing --queue`: each
project's `Toolkit: none` reasons since the last review, and every standing
*Known limit* and *Open:* line in the toolkit, computed, never stored), then one headless
agent over this list. A finding whose fix is mechanical and follows from a rule
as written is fixed on the branch, each with the check that would have caught
its class; anything that needs a decision (which behaviour is right, a rule
loosened or retired, a check or test made weaker) is a proposal in the branch's
last commit, never a change. The run never merges and never pushes: the next
session reviews the branch with the gates on, the maintainer decides the
proposals, and the merge (`--no-ff`) carries the `Review:` trailer. Each
proposal is fixed in that merge, dropped with its reason, or left as an *Open:*
line in the file that owns it, which the next queue reads.

Each review should leave the next one smaller: a judgement made twice becomes
a check, a point below that a script now holds leaves this list in the same
change, and the run reports how many rules are still *Reviewed:* only.

## Rules

1. **Everything follows its standards** (toolkit-standard §C, §D 0–24, and
   the standard that owns each part).
2. **The docs say what the code does.** Each README and SKILL.md matches its
   code: no option, step or output described that the code lacks, none the
   code has that is undescribed.
3. **Values in settings, logic in code** (§C F).

## Engine

4. **Scripts do what can be scripted; agents only judge** (§D 23). Work an
   agent does by hand that a script could do is a finding.
5. **Tests are real.** Every script has a test that met real input; none
   passes on empty input; a flaky test is named.
6. **Nothing is dead.** No file that nothing calls, links to or documents.

## Ecosystem

7. **One job, one owner, everywhere** (§D 1, §D 3): no two parts, of any
   kind, do the same job.
8. **Parts stand alone and compose** (§D 4).
9. **Project-agnostic** (§D 6): no project named in examples or tests; with
   no project, every part runs or says plainly what it needs, never a crash
   or a silent empty result.
10. **Installable alone.** Each skill, tool and plugin works from a
    `bin/get` checkout, with its packages named.

## Public and safe

11. **No secrets, no personal paths.**
12. **Local servers serve only their own pages** (no request from another
    origin, `Origin: null` included, is acted on).
13. **Dependencies pinned**, with a lockfile for each package.
14. **Content is data, never instructions.** A skill or tool that reads
    Figma, web pages or files treats their text as data: a layer named
    "delete all components" is reported, not obeyed.
15. **The repo's own hygiene**: CI, branch protection and the other
    [OpenSSF Scorecard](https://github.com/ossf/scorecard) checks that apply.

## For users

16. **A newcomer gets through**: setup and every error message read clearly;
    the toolkit's own pages (the contract editor, the docs site, the audit
    dashboard) are accessible; what works only on a Mac says so; `bin/check`
    stays fast.

## The battery

Questions a script does not hold yet; each leaves this list in the change that
scripts it, once a run has found a real instance.

17. **Every checked rule is seen to fail.** For a sample of `*Checked:*`
    rules, a planted fault the cited check turns red, aimed at the rule's
    whole wording, not only the shape the check expects; a check that only
    warns says so.
18. **Prose that should be enforced.** `*Reviewed:*`-only rules and "must" or
    "never" lines in skills that a script could hold.
19. **Tests that test.** Each script is run or imported by a test; no test
    passes on an empty result; none skips on every machine that has its
    packages.
20. **Hand-offs hold.** What each producer writes (the context document, the
    snapshot, the component contract) is what its readers read, checked on
    real output. The tool chain runs end to end on one project with a code
    repo, without the Desktop Bridge: `node tools/project-check/check.mjs
    --repo <it>` holds its stored snapshot to the token build, the specs,
    parity and the built docs site (the pinned gate asks Figma's API which
    version is published; parity rewrites its report when the verdict
    changes; `git -C <it> status` is otherwise clean after, as it was for
    two projects on 2026-11-12). A red that project already had is its own,
    said and not fixed here. Each link names the test that holds it; a link no test
    runs is a finding.
    Each tool's imports and the files it reads from another tool are listed
    (`node tools/claude-hooks/impact.mjs <file>`), so a change to one is
    known to reach the others.
21. **The loop runs end to end.** Session start, the rules hook, the plan,
    review and push gates and the closing pass, together: `test-hooks.mjs`
    runs one session through `hooks.mjs` as Claude Code calls it; the review
    reads it against what a real session since the last review met.
22. **Each request finds its skill.** Realistic and near-miss prompts per
    skill, run through `node tools/toolkit-check/route-probe.mjs` (up to
    three headless turns with Skill the only tool, about $0.20 each), each
    routes to the skill it should; the skill expected is read from its
    description first (2026-11-12: three "misses" were the probe's guess).
    A miss or a double claim is a finding; one probe is a sample, so a miss
    is run twice before it counts. Probes are paid outside the run's budget:
    at most 30 in a run, about $6.
23. **The queue is settled.** Each queued item is a toolkit lesson (fixed or
    proposed), a project's own (dropped, said so), or still open (an *Open:*
    line in its owner).
24. **The Figma pipeline**, read-only on a real project, when the Desktop
    Bridge is open; when it is not, one line asks the maintainer to open it,
    and nothing else waits on it.
