# Toolkit check

The checks that keep the toolkit itself honest: the standards stay consistent and every rule's check exists, no job the toolkit owns is written again in a project, every folder has a README, and nothing is left uncommitted or unanswered at the end of a piece of work. `bin/check` and `bin/closing` are the commands that run them.

## Use

```sh
bin/check                                              # runs all of these, and every test
node tools/toolkit-check/check-standards.mjs           # the standards against themselves; --fix heals what it safely can
node tools/toolkit-check/owned-check.mjs --repo <dir>  # a repo writing a job the toolkit owns (every project's check runs it)
bin/closing                                            # what is open across the toolkit and every project
```

## What each file does

| File | Job |
|---|---|
| `check-standards.mjs` | Every rule names a check that exists, every citation resolves, every setting is registered ([toolkit-standard](../../standards/toolkit-standard.md) §C). Reads rules through `rules.mjs` and code through `strip.mjs` (comments removed); `settings-allowlist.json` lists the few literals it must accept. |
| `check-runs.mjs` | Every assertion a skill's `tests/cases.md` says it runs still exists in the test it names. `CHECK_RUNS_ROOT` here, and `STANDARDS_ROOT`, `STANDARDS_SCANNERS`, `STANDARDS_OPTS` and `STANDARDS_READERS` in `check-standards.mjs`, are test seams: they point a check at a fixture tree, never set in a real run. |
| `owned-check.mjs` + `owned.json` | `owned.json` lists the jobs the toolkit owns (token build, parity, lint…); the check fails a repo that writes one again instead of calling the toolkit. |
| `twins.mjs` | Warns when two projects each wrote the same job, before the toolkit owns it. |
| `readmes.mjs` | Every folder a newcomer opens has a README in the agreed shape (§D 22): a title, a lead, a command or import step, and links that resolve, each `#anchor` to a heading that is there. Tested by `test-readmes.mjs`. |
| `restated.mjs` + `restated.json` | Prose that restates what another file owns agrees with it (§D 22): every `node <path> --flag` in a markdown file runs a file that exists and a flag it reads, a tool's README names each of its scripts and each flag a script's usage line offers, that usage line offers each flag the script reads, and each value `restated.json` registers (the Node floor, the ports) reads as its owner says. Tested by `test-restated.mjs`. |
| `main-guards.mjs` | Every script's "am I the one being run" guard compares `realpathSync(process.argv[1])`, so a run through the skills symlink is not silently a no-op, and calls it inside a try, so importing the script from a process whose argv[1] is no file does not throw. |
| `project-names.sh` | The project names the toolkit may never carry, as one regex: bin/check searches the files for them and `.githooks/pre-push` the messages of the commits a push sends (`test-pre-push-names.mjs`). A names read that fails, or a projects root that is not there, is a failure, never no projects; an empty root (CI's) passes. |
| `personal-info.mjs` | No tracked file carries a personal detail: an email (bar `noreply@anthropic.com` and example.com/.org/.net), a `/Users/<name>/` path (bar fixture placeholders) or the maintainer's name, read from `git config user.name` at run time. LICENSE, the author's notice and the repo's own address are skipped. bin/check runs it in the "no project is named" step (`test-pre-push-names.mjs`). |
| `research-index.mjs` | `research/index.html` lists every article in `research/` (bar `_archive/` and READMEs) with the file's current text, and nothing that is gone. Nothing builds the page, so an article added or edited without it is caught here. Tested by `test-research-index.mjs`. |
| `test-missing-input.mjs` | The command lines that read a JSON input (the validator, the token build, the foundations audit's and the descriptions' scripts, the audit record's `rows.mjs`) say a missing, unreadable or empty input in one line naming it, never a stack. |
| `test-sandbox-paste.mjs` | Every script pasted into Figma's sandbox holds nothing the sandbox refuses whole (`import` before `(`, `//` or `/*`, comments included). |
| `test-content-is-data.mjs` | Every skill that reads content it does not control says it is data, never instructions, and every prompt built from such content frames it ([toolkit-standard](../../standards/toolkit-standard.md) §D 24). |
| `test-dependabot.mjs` | Every folder with a `package.json` is in `.github/dependabot.yml`'s npm directories, and every directory listed there holds one. |
| `test-paste-hash.mjs` | The three scripts pasted into Figma with an integrity hash strip comments and hash alike, so the copies cannot drift apart. |
| `review.md` | What the fourteen-day independent review checks (§D 11), point by point. |
| `closing.mjs` | The end-of-work pass: uncommitted and unpushed work, changed pages to look at, new rulings, the repo's open security alerts (full pass only, through `gh`), and the questions no script answers (§D 13); `--queue` prints, as JSON, what was left for later since the last periodic review, and a waiting review branch is named. The Claude Code hooks read it ([claude-hooks](../claude-hooks/README.md)). |
| `review-run.mjs` | The periodic review run without the maintainer (§D 11), behind `bin/review`: a `review/<date>` branch in its own worktree with its packages installed, `bin/check`, the queue, one headless agent over `review.md` with a narrowed tool list and a budget, and `bin/check` again on what it committed; then a fresh read-only reviewer agent, and with no High issue the merge is checked and pushed to `main` (a hold lands nothing and says why to the next run; one notification either way). It runs one at a time. `com.toolkit.review.plist` is its daily launch agent, installed only by `REVIEW=on ./install.sh`. |
| `route-probe.mjs` | Which skill a request reaches (`review.md` point 22): up to three headless turns per prompt with Skill the only tool, a line each with the skills called (or `none`) and the cost. The only way the review's agent reaches `claude`, with the flags fixed here; past 30 prompts in one call it says how many it left on stderr. `CLAUDE_BIN` (here and in `review-run.mjs`) names the `claude` binary to run, for a test or a machine where it is not on the PATH. |

## Test

```sh
for t in tools/toolkit-check/test-*.mjs; do node "$t" || exit 1; done
```
