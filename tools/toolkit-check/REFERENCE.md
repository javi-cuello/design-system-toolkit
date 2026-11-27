# Toolkit check reference

Detail moved from [README.md](README.md): what each file does, in full.

## `check-standards.mjs`

Every rule names a check that exists, every citation resolves, every setting is registered ([toolkit-standard](../../standards/toolkit-standard.md) §C). Reads rules through `rules.mjs` and code through `strip.mjs` (comments removed); `settings-allowlist.json` lists the few literals it must accept.

## `check-parallel.mjs`

bin/check's scheduler. bin/check lists its steps (`bin/check --list`: shares, function, arguments) and runs each as `bin/check --step <function> <arguments>`, two at a time by default (`--workers=N`; `--serial` runs them in one shell as before). A step's shares are declared in bin/check: its fixed steps in `steps_list`, its suites in `SUITE_SHARES`. Two steps holding a tag never overlap, `LIMITS` lets a counted tag (`chrome=1`) be held by that many, and a step with no declaration, or `alone`, runs with nothing beside it and nothing listed after it starts first. Each step's output is kept and printed whole in list order, and its failed and skipped names come back through `<state>/<n>.failed` and `.skipped`, so the output and the closing summary read as a serial run's. A step that exits non-zero and names nothing is named a failure. `test-check-parallel.mjs` runs it on stand-in steps.

## `test-check-shares.mjs`

Every step's declared shares cover what its code uses: a Chrome launch through `cdp.mjs`, a `launchctl` call, the measuring lock or the read cache, and each write. A write goes by the path on its statement. A path set from a temp folder, or from a function that makes one, is the step's own. One set from the home folder needs `home:<its first folder there>`. Any other, in a step's own code or its bin/check body, is the tree; git counts when it changes worktrees, branches or refs. It reads each step's entry files and the scripts they start by path whole, and their direct imports for a Chrome launch and a `launchctl` call only. A use an environment variable moves (`HOME`, `TOOLKIT_LOCK_DIR`) is not needed by a process whose start sets it: the start statement, the env object it passes, or the starter's top-level `process.env`. A line marked `not-shared: <why>` is not read; a tag past what the grep reads is set by hand, with `# <why>` on its `SUITE_SHARES` line. It also fails a `SUITE_SHARES` line naming a suite that is gone.

## `check-runs.mjs`

Every assertion a skill's `tests/cases.md` says it runs still exists in the test it names. `CHECK_RUNS_ROOT` here, and `STANDARDS_ROOT`, `STANDARDS_SCANNERS`, `STANDARDS_OPTS` and `STANDARDS_READERS` in `check-standards.mjs`, are test seams: they point a check at a fixture tree, never set in a real run.

## `owned-check.mjs` + `owned.json`

`owned.json` lists the jobs the toolkit owns (token build, parity, lint…); the check fails a repo that writes one again instead of calling the toolkit.

## `leftovers.mjs`

Worktrees, branches and stashes left behind. `sweep` (the closing pass, so the Stop hook) parks each piece of work's worktree (`.claude/worktrees/<work>`) unlanded and a week untouched — loose files committed on its branch first; its folder goes, its branch stays, `bin/worktree <work>` reopens it; never one a running session made, reopened or works in, one mid-merge, cherry-pick or rebase, or one holding an ignored file of its own (a `.env`) — and removes each worktree and its branch, and each other branch, that is clean, over a day old and merged into main (nothing past main, or merging it into main changes nothing: `git merge-tree` gives main's own tree, which holds for a rebase, a cherry-pick or a squash and not for a same-subject commit main lacks, or every commit's patch is on main, `git cherry` printing no `+` line, which holds for a branch landed as a rebased copy whose lines main has edited since; a worktree holding main never), and names each tip so a removal can be undone, and says so in a line; `leftovers` (bin/check, a warning) lists the rest over a day old (unmerged, dirty, every stash) with the session that left each when known. Nothing dirty, unmerged or stashed is ever removed.

## `twins.mjs`

Warns when two projects each wrote the same job, before the toolkit owns it.

## `readability.mjs`

Every README and skill reads plainly (§D 22, skill-standard §A clause I). Tested by `test-readability.mjs`.

## `readmes.mjs`

Every folder has a README in the agreed shape (§D 22). Tested by `test-readmes.mjs`.

## `restated.mjs` + `restated.json`

Prose that restates what another file owns agrees with it (§D 22):

- every `node <path> --flag` in a markdown file runs a file that exists, and a flag it reads;
- a tool's README names each of its scripts, and each flag a script's usage line offers;
- that usage line offers each flag the script reads;
- each value `restated.json` registers (the Node floor, the ports) reads as its owner says.

Tested by `test-restated.mjs`.

## `main-guards.mjs`

Every script's "am I the one being run" guard compares `realpathSync(process.argv[1])`, so a run through the skills symlink is not silently a no-op, and calls it inside a try, so importing the script from a process whose argv[1] is no file does not throw.

## `project-names.sh`

The project names the toolkit may never carry, as one regex: bin/check searches the files for them and `.githooks/pre-push` the messages of the commits a push sends (`test-pre-push-names.mjs`). A names read that fails, or a projects root that is not there, is a failure, never no projects; an empty root (CI's) passes.

## `personal-info.mjs`

No tracked file carries a personal detail: an email (bar `noreply@anthropic.com` and example.com/.org/.net), a `/Users/<name>/` path (bar fixture placeholders) or the maintainer's name, read from `git config user.name` at run time. LICENSE, the author's notice and the repo's own address are skipped. bin/check runs it in the "no project is named" step (`test-pre-push-names.mjs`).

## `research-index.mjs`

It checks that:

- `research/index.html` lists every article in `research/` (bar `_archive/` and READMEs) with the file's current text, and nothing that is gone;
- each entry has a `researched` day (or month, or span of months);
- each entry has an `updated` day no older than `researched`, or than the file's last change (its last commit, or today while it is edited and uncommitted);
- an article updated after 2026-11-17 reads in 20 minutes or less (4,760 words);
- each entry has a `subtopic` its topic lists, where the topic lists any.

Nothing builds the page, so an article added or edited without it is caught here. Tested by `test-research-index.mjs`.

## `test-missing-input.mjs`

The command lines that read a JSON input (the validator, the token build, the foundations audit's and the descriptions' scripts, the audit record's `rows.mjs`) say a missing, unreadable or empty input in one line naming it, never a stack.

## `test-sandbox-paste.mjs`

Every script pasted into Figma's sandbox holds nothing the sandbox refuses whole (`import` before `(`, `//` or `/*`, comments included).

## `test-content-is-data.mjs`

Every skill that reads content it does not control says it is data, never instructions, and every prompt built from such content frames it ([toolkit-standard](../../standards/toolkit-standard.md) §D 24).

## `test-dependabot.mjs`

Every folder with a `package.json` is in `.github/dependabot.yml`'s npm directories, and every directory listed there holds one.

## `test-paste-hash.mjs`

The three scripts pasted into Figma with an integrity hash strip comments and hash alike, so the copies cannot drift apart.

## `review.md`

What the fourteen-day independent review checks (§D 11), point by point.

## `closing.mjs`

The end-of-work pass: uncommitted and unpushed work, changed pages to look at, new rulings, the repo's open security alerts (full pass only, through `gh`), and the questions no script answers (§D 13); `--queue` prints, as JSON, what was left for later since the last periodic review, and a waiting review branch is named. The Claude Code hooks read it ([claude-hooks](../claude-hooks/README.md)).

## `review-run.mjs`

The periodic review run without the maintainer (§D 11), behind `bin/review`:

1. a `review/<date>` branch in its own worktree, with its packages installed;
2. `bin/check`, and the queue;
3. one headless agent over `review.md`, with a narrowed tool list and a budget;
4. `bin/check` again on what it committed;
5. a fresh read-only reviewer agent. With no High issue, the merge is checked and pushed to `main`. A hold lands nothing and says why to the next run. There is one notification either way.

It runs one at a time. The toolkit's login agent runs it daily at 03:00 ([tools/service](../service/README.md)), only once installed by `REVIEW=on ./install.sh`.

## `route-probe.mjs`

Which skill a request reaches (`review.md` point 22): up to three headless turns per prompt with Skill the only tool, a line each with the skills called (or `none`) and the cost. The only way the review's agent reaches `claude`, with the flags fixed here; past 30 prompts in one call it says how many it left on stderr. `CLAUDE_BIN` (here and in `review-run.mjs`) names the `claude` binary to run, for a test or a machine where it is not on the PATH.
