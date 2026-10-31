# Claude Code hooks

The hooks that make Claude Code follow the toolkit's working loop ([toolkit-standard](../../standards/toolkit-standard.md) §D 13) without anyone having to remember it: at a session's start it is told what is left open, beside its first change in an area it is handed that area's rules (and, for an interface file, the knowledge pages to read before the first line, §D 21), and what a turn left open is handed to it with the next message. They speak to the session only, with one exception: the gates (`gates.mjs`), which refuse.

## The gates, for full-size work

Full-size is measured, never asked: files and lines written since the work began (counting what subagents write, except a background agent's edits in its own `.claude/worktrees/` checkout, which count when its branch is merged, and what a script's own code writes, found on disk inside the call and beyond what the file held before it; leaving out changelogs, case files and READMEs), or a file in a standard or shared tool changed by more than a few lines. The line is `FILES`, `LINES`, `WIDE` and `WIDE_LINES` in [`gates.mjs`](gates.mjs); the rule is [toolkit-standard](../../standards/toolkit-standard.md) §D 13. Small work that is committed as it goes, about half of all commits, never meets a gate; small changes left uncommitted add up, across sessions too (`$TMPDIR/toolkit-gates-carry.json` hands each session's unreviewed, uncommitted lines to the next session started in the same repo, until they are reviewed, committed or a week old), and closing reviewed work starts the count afresh.

| When | Gate | What clears it |
|---|---|---|
| The edit that makes the work full-size | refused (PreToolUse) | a plan at `$TMPDIR/toolkit-plan-<session>.md` with Goal, Impact (the output of `impact.mjs`), Claims, Beyond scope, Budget and Review |
| The end of a turn that did full-size work | blocked (Stop) | a review by fresh Explore agents with "review" in the description (never a fork), after the checks; small fixes after it need no second one |
| A `git push` of a repo with full-size work since the last review, or while a review runs | refused (PreToolUse) | the review, reported |
| The end of reviewed work, once every background review has reported (a day at most) | blocked (Stop) | a `Toolkit:` line (what goes back to the toolkit), an `Open:` line (what stays open, and why), and a `Docs:` line when a README describing the changed files was left alone |

`TOOLKIT_GATES=off` turns them off; a skill-evals copy (`TOOLKIT_EVAL_COPY`) is never gated, since an eval measures a skill, not the process.

## Status

In use since 2026-10-28 for every Claude Code session on this machine, in the toolkit and every registered project. Proven by `test-gates.mjs` and by their first run, on the work that built them (the plan gate refused it until it had a plan; the feedback gate caught its own bug). Known limits, accepted: a session still working when the next one takes over its uncommitted share is counted in both (toward a review); a background shell command's writes land after its call ends, so they are not found; another session writing the same repo during a shell call is counted as this session's (the error is toward a review); a push from the terminal, outside Claude Code, or one quoted inside another shell (`bash -c '…'`), is not gated; an untracked file that was there before a script touches it is counted whole; a cp or mv behind an option that takes a value (`sudo -u root cp`), or folded into one (`-vt dir`), is not read; two sessions stopping in the same instant can lose one's carry update until its next stop. A shell call running beside an edit (a subagent's `git diff` while the session edits) counts that edit again, toward a review.

## Install

Register the four hooks once per machine in `~/.claude/settings.json`, under `hooks`:

```json
"SessionStart": [{ "hooks": [{ "type": "command", "command": "node ~/Projects/toolkit/tools/claude-hooks/hooks.mjs start", "timeout": 30 }] }],
"Stop": [{ "hooks": [{ "type": "command", "command": "node ~/Projects/toolkit/tools/claude-hooks/hooks.mjs stop", "timeout": 30 }] }],
"UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node ~/Projects/toolkit/tools/claude-hooks/hooks.mjs prompt", "timeout": 10 }] }],
"PreToolUse": [{ "matcher": "Edit|Write|MultiEdit|NotebookEdit|Bash", "hooks": [{ "type": "command", "command": "node ~/Projects/toolkit/tools/claude-hooks/hooks.mjs edit", "timeout": 15 }] }]
```

They act only inside the toolkit or a project repo (one with a `figma-design-system/` folder); anywhere else they do nothing, except the Stop gates, which follow the files a session wrote wherever it started. `TOOLKIT_RULES=off` in the environment turns off the rule list `edit` hands over (the plan gate still runs); the skill evals set it to measure a run without it.

## What each file does

| File | Job |
|---|---|
| `hooks.mjs` | The entry point: `start`, `stop`, `prompt` and `edit`, as above. Reads `bin/closing --brief` for what is open. |
| `standards-read.mjs` | Which standard, and which part of it, governs a file, so `edit` hands over the right rules; `knowledge` names the pages an interface file is built from (`tools/shared/knowledge.mjs`). |
| `stop-items.mjs` | Remembers which open items a session has already been handed, so each comes once. |
| `gates.mjs` | The plan, review, push and feedback gates: the work's size and the last review, read from the transcript where the last call stopped, from disk for a script's writes, and from the carry file for an earlier session's. |
| `impact.mjs` | Who reads the files a change touches, across the toolkit and every project: the plan's Impact section. `node tools/claude-hooks/impact.mjs <file>...` |

## Test

```sh
node tools/claude-hooks/test-hooks.mjs
node tools/claude-hooks/test-standards-read.mjs
node tools/claude-hooks/test-stop-items.mjs
node tools/claude-hooks/test-gates.mjs
```
