# Toolkit check

The checks that keep the toolkit itself honest. They make sure the standards stay consistent and every rule's check exists. They make sure no project writes again a job the toolkit owns, and that every folder has a README. They also make sure nothing is left uncommitted or unanswered at the end of a piece of work. The commands `bin/check` and `bin/closing` run them.

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
| `check-standards.mjs` | Every rule names a check that exists, every citation resolves, every setting is registered ([toolkit-standard](../../standards/toolkit-standard.md) §C). |
| `rules.mjs`, `strip.mjs`, `settings-allowlist.json` | What `check-standards.mjs` reads rules, code and accepted literals through. |
| `check-runs.mjs` | Every assertion a skill's `tests/cases.md` says it runs still exists in the test it names. |
| `owned-check.mjs` + `owned.json` | Fails a repo that writes again a job the toolkit owns, instead of calling the toolkit. |
| `leftovers.mjs` | Worktrees, branches and stashes left behind. It removes what is clean, old and merged, and parks work left untouched for a week. |
| `twins.mjs` | Warns when two projects each wrote the same job, before the toolkit owns it. |
| `readability.mjs` + `readability.json` | Every README and skill reads plainly (§D 22, skill-standard §A clause I). |
| `readmes.mjs` | Every folder has a README in the agreed shape (§D 22). |
| `restated.mjs` + `restated.json` | Prose that restates what another file owns agrees with it (§D 22). |
| `main-guards.mjs` | Every script's "am I the one being run" guard works through a symlink and on import. |
| `project-names.sh` | The project names the toolkit may never carry, as one regex. |
| `personal-info.mjs` | No tracked file carries a personal detail. |
| `research-index.mjs` | `research/index.html` lists every article in `research/`, in step with its text. |
| `review.md` | What the fourteen-day independent review checks (§D 11), point by point. |
| `closing.mjs` | The end-of-work pass (§D 13). `--queue` prints, as JSON, what was left for later since the last periodic review. |
| `review-run.mjs` + `com.toolkit.review.plist` | The periodic review run without the maintainer (§D 11), behind `bin/review`. |
| `route-probe.mjs` | Which skill a request reaches (`review.md` point 22). |
| `test-*.mjs` | Each script's tests, and a few checks of their own, such as `test-missing-input.mjs`, `test-sandbox-paste.mjs`, `test-content-is-data.mjs`, `test-dependabot.mjs` and `test-paste-hash.mjs`. |

[REFERENCE.md](REFERENCE.md) says what each file does in full, with its test seams and exceptions.

## Test

```sh
for t in tools/toolkit-check/test-*.mjs; do node "$t" || exit 1; done
```
