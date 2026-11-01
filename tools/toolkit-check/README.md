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
| `check-runs.mjs` | Every assertion a skill's `tests/cases.md` says it runs still exists in the test it names. |
| `owned-check.mjs` + `owned.json` | `owned.json` lists the jobs the toolkit owns (token build, parity, lint…); the check fails a repo that writes one again instead of calling the toolkit. |
| `twins.mjs` | Warns when two projects each wrote the same job, before the toolkit owns it. |
| `readmes.mjs` | Every folder a newcomer opens has a README in the agreed shape (§D 22): a title, a lead, a command or import step, and links that resolve, each `#anchor` to a heading that is there. Tested by `test-readmes.mjs`. |
| `main-guards.mjs` | Every script's "am I the one being run" guard compares `realpathSync(process.argv[1])`, so a run through the skills symlink is not silently a no-op. |
| `project-names.sh` | The project names the toolkit may never carry, as one regex: bin/check searches the files for them and `.githooks/pre-push` the messages of the commits a push sends (`test-pre-push-names.mjs`). A names read that fails, or a projects root that is not there, is a failure, never no projects; an empty root (CI's) passes. |
| `test-missing-input.mjs` | The command lines that read a JSON input (the validator, the token build, the foundations audit's and the descriptions' scripts, the audit record's `rows.mjs`) say a missing, unreadable or empty input in one line naming it, never a stack. |
| `test-sandbox-paste.mjs` | Every script pasted into Figma's sandbox holds nothing the sandbox refuses whole (`import` before `(`, `//` or `/*`, comments included). |
| `review.md` | What the fourteen-day independent review checks (§D 11), point by point. |
| `closing.mjs` | The end-of-work pass: uncommitted and unpushed work, changed pages to look at, new rulings, the repo's open security alerts (full pass only, through `gh`), and the questions no script answers (§D 13). The Claude Code hooks read it ([claude-hooks](../claude-hooks/README.md)). |

## Test

```sh
for t in tools/toolkit-check/test-*.mjs; do node "$t" || exit 1; done
```
