# Claude Code hooks

The hooks that make Claude Code follow the toolkit's working loop ([toolkit-standard](../../standards/toolkit-standard.md) §D 13) without anyone having to remember it: at a session's start it is told what is left open, beside its first change in an area it is handed that area's rules (and, for an interface file, the knowledge pages to read before the first line, §D 21), and what a turn left open is handed to it with the next message. They speak to the session only, with one exception: the gates (`gates.mjs`), which refuse.

## The gates, for full-size work

Full-size is measured, never asked: files and lines written since the work began (counting what subagents write, except a background agent's edits in its own `.claude/worktrees/` checkout, which count when its branch is merged, and what a script's own code writes, found on disk inside the call and beyond what the file held before it; leaving out changelogs, case files and READMEs), or a file in a standard or shared tool changed by more than a few lines. The line is `FILES`, `LINES`, `WIDE` and `WIDE_LINES` in [`gates.mjs`](gates.mjs); the rule is [toolkit-standard](../../standards/toolkit-standard.md) §D 13. Small work that is committed as it goes, about half of all commits, never meets a gate; small changes left uncommitted add up, across sessions too (`$TMPDIR/toolkit-gates-carry.json` hands each session's unreviewed, uncommitted lines to the next session started in the same repo, until they are reviewed, committed or a week old), and closing reviewed work starts the count afresh.

| When | Gate | What clears it |
|---|---|---|
| The edit that makes the work full-size | refused (PreToolUse) | a plan at `$TMPDIR/toolkit-plan-<session>.md` with Before (the closing line of a `bin/check` run in each repo the work is in that has one, which the transcript shows came back, in the toolkit's words or the project's own; `late:` if it ran after the work's first edit there; and the answers to §D 1, §D 2 and §D 5), Aim (the main goal as agreed with the person, kept unchanged across pieces), Goal, Measure (a `before:` line: the goal measured end to end before any part is built, the command and what it said), Impact (the output of `impact.mjs`), Claims, Beyond scope, Budget and Review |
| The first write to a component's file whose knowledge page (`knowledge/ui/components/`) the session has not opened | refused once (PreToolUse), naming the page | opening the page (any tool call naming it), or the retry: refused once a page a session, so a page that cannot be read never blocks the work. Eval runs before it opened a named page in 3 of 41 (2026-11-16) |
| The end of a turn that did full-size work | blocked (Stop) | a review after the checks: fresh Explore agents with "review" in the description (never a fork), the code-review skill, or a review workflow (`isReview` in `gates.mjs`); small fixes after it need no second one |
| A `git push` of a repo with full-size work since the last review, or while a review runs | refused (PreToolUse) | the review, reported |
| The end of reviewed work, once every background review has reported (a day at most) | blocked (Stop) | the plan updated, not put aside: an `after:` line under its Measure written since the piece began and a `course:` line under its Goal (kept or corrected, and why) (a plan is archived only once it says `Status: done`; a new session is shown every plan another left open), a `Measure:` line (the plan's measure run again, before → after), a `Toolkit:` line (what goes back to the toolkit), an `Open:` line (what stays open, and why), and a `Docs:` line when a README describing the changed files, or a guide or README citing a standard rule the work changed, was left alone |

A refused push names the files changed since the last review was launched, with their lines: a review is credited when it is launched, so fixes made after it count toward the next one, and that list is what the next must cover. Any refused shell call says that none of its other parts ran (it is refused whole): a plan's end lines went with a refused push on 2026-11-20.

## The session's own edits, committed before a turn ends

At every Stop, after the gates: the files this session wrote (its transcript's edits and shell redirects) that are still uncommitted in the toolkit or a registered project block the turn once, listed by repo, to be committed with `git commit -- <paths>`, unfinished work too. Another session's paths are never named: a file this session wrote, then saw committed and changed again, is another's. An uncommitted tree blocks every other session's push (each repo's pre-push checks the tree), so this is the user's standing rule made mechanical. A file a script's own code wrote is not seen (only shell redirects and `sed -i` are), and a stop after the block passes, so a turn that cannot commit is not looped. `TOOLKIT_GATES=off` turns it off with the gates.

## The system's checker at the end of a turn

Any size of work: in a registered project that states `check.validate` and has a built docs site, the code files the session wrote and has not committed, in the push gate's own scope (`inScope` in `tools/system-mcp/validate.mjs`), go through `validate.mjs` at every Stop, before the gates, so a turn the review gate stops, and a fix made after a block, are read too. Each finding the project's §6 rulings do not waive blocks once: its key (file, kind, what was found, and which occurrence, so a second `<button>` is new) is kept for the session (`$TMPDIR/toolkit-validate-<session>`), so a finding argued for in words is not put again every turn; the push settles it. A checker that fails, or that runs past its 8 s share of the hook's 30 s (the closing pass after it has up to 20 s, less whatever the hook has already used, and at least 1 s; the gates and the uncommitted-files read are not timed, so 28 s is the aim, not a bound), says nothing and blocks nothing, since the push gate reads the same files. Occurrences are counted, not placed: a finding fixed and then written again in the same session, or one fixed while an identical one is added, is not put twice, and a new one written above a seen one is reported at the seen one's line; the push catches what this misses. A key that cannot be kept (the temp folder unwritable) makes no block, since only the kept key ends the loop, and a stop that follows a block skips the closing pass. `TOOLKIT_VALIDATE=off` turns it off. About 0.1 s over one file. Known limit: a project found only through its home folder (no `repo` in its context) is checked here though the push gate, which needs the repo, skips it.

`TOOLKIT_GATES=off` turns the gates off (not the checker above); a skill-evals copy (`TOOLKIT_EVAL_COPY`) is never gated, since an eval measures a skill, not the process.

## Status

In use since 2026-10-28 for every Claude Code session on this machine, in the toolkit and every registered project. Proven by `test-gates.mjs` and by their first run, on the work that built them (the plan gate refused it until it had a plan; the feedback gate caught its own bug). A gate that throws is said, not swallowed: the edit goes through with the error given to the session (once a session, beside the rule list), and the stop is blocked once a turn with it, where the gates act and are not switched off (a thrown error would otherwise exit 1, which Claude Code treats as a non-blocking error the session never reads). Fail loud, not closed: `onFailure: "block"` would refuse every edit, the one that fixes the gate included, and has no effect on Stop hooks (code.claude.com/docs/en/hooks, checked 2026-11-10). A hook that cannot start at all still passes with a notice. Known limits, accepted: a plan written before the Before section (toolkit-standard 2.22.0) is refused on the session's next counted edit until it has one; a state from the last gate version is carried forward (its single check is dropped, so a session that changes versions runs bin/check again), and one from any older version is read afresh from the transcript's start, skipping what a closed plan already ended (small work closed without a plan is read again); the check counts for the repo it ran in (the folder its path names, or the last `cd` before it; none when that folder is a variable or `cd -`) and for one piece of work, and the session's own run or a subagent's (one in its own `.claude/worktrees/` checkout is not, since it checks another tree), credited when its closing line comes back, which for a background run is its notification; `bin/check --quick` counts as a run; a run whose output went to a file, or was cut to a preview, is not seen (pipe it through `tail`); a session still working when the next one takes over its uncommitted share is counted in both (toward a review); a background shell command's writes land after its call ends, so they are not found; another session writing the same repo during a shell call is counted as this session's (the error is toward a review); a push from the terminal, outside Claude Code, or one quoted inside another shell (`bash -c '…'`), is not gated; an untracked file that was there before a script touches it is counted whole; a cp or mv behind an option that takes a value (`sudo -u root cp`), or folded into one (`-vt dir`), is not read; two sessions stopping in the same instant can lose one's carry update until its next stop. A shell call running beside an edit (a subagent's `git diff` while the session edits) counts that edit again, toward a review.

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
| `stop-items.mjs` | Remembers which open items a session has already been handed, so each comes once; `ownUncommitted` is the Stop check below. |
| `owners.mjs` | Which session owns a path (its transcript wrote it and has not committed it), a commit (its transcript shows git making it) or an agent's worktree, by the name Claude Code's session registry gives it. Both pre-push hooks run it when a push is refused, and the Stop gate names the sessions whose uncommitted work it counted, so a blocked session messages the owner (SendMessage) instead of touching its work. Not found is not said: a commit made from a terminal has no transcript. |
| `gates.mjs` | The plan, review, push and feedback gates: the work's size and the last review, read from the transcript where the last call stopped, from disk for a script's writes, and from the carry file for an earlier session's. |
| `validate-turn.mjs` | The Stop check above: the turn's uncommitted code in a project with `check.validate`, through the system's checker. |
| `impact.mjs` | Who reads the files a change touches, across the toolkit and every project: the plan's Impact section. `node tools/claude-hooks/impact.mjs <file>...` |

## Test

`test-hooks.mjs` also runs the loop end to end through `hooks.mjs` as Claude Code calls it: one session refused an unplanned full-size edit, let through once planned, held at the stop and the push until a reviewer reports, then closed and pushed.

```sh
node tools/claude-hooks/test-hooks.mjs
node tools/claude-hooks/test-standards-read.mjs
node tools/claude-hooks/test-stop-items.mjs
node tools/claude-hooks/test-validate-turn.mjs
node tools/claude-hooks/test-gates.mjs
```
