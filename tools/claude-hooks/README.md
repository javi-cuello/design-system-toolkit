# Claude Code hooks

These hooks make Claude Code follow the toolkit's working loop, so nobody has to remember it. The loop is [toolkit-standard](../../standards/toolkit-standard.md) §D 13. At a session's start the hooks say what is left open. Before the first change in an area, they hand over that area's rules and the knowledge pages to read. Most hooks only speak to the session, but the gates in `gates.mjs` refuse.

## Status

In use since 2026-10-28 for every Claude Code session on this machine. They run in the toolkit and in every registered project. A gate that throws an error says so and does not block the fix. The known limits are under [Status and known limits](REFERENCE.md#status-and-known-limits).

## Install

Register the four hooks once per machine in `~/.claude/settings.json`, under `hooks`:

```json
"SessionStart": [{ "hooks": [{ "type": "command", "command": "node ~/Projects/toolkit/tools/claude-hooks/hooks.mjs start", "timeout": 30 }] }],
"Stop": [{ "hooks": [{ "type": "command", "command": "node ~/Projects/toolkit/tools/claude-hooks/hooks.mjs stop", "timeout": 30 }] }],
"UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node ~/Projects/toolkit/tools/claude-hooks/hooks.mjs prompt", "timeout": 10 }] }],
"PreToolUse": [{ "matcher": "Edit|Write|MultiEdit|NotebookEdit|Bash", "hooks": [{ "type": "command", "command": "node ~/Projects/toolkit/tools/claude-hooks/hooks.mjs edit", "timeout": 15 }] }]
```

They act only inside the toolkit or a project repo. See [Where they act](REFERENCE.md#where-they-act).

## The gates, for full-size work

Small work that is committed as it goes never meets a gate. Full-size work is measured by the files and lines written since the work began. The limits are `FILES`, `LINES`, `WIDE` and `WIDE_LINES` in [`gates.mjs`](gates.mjs).

| When | What clears it |
|---|---|
| The edit that makes work full-size | a plan in the state folder |
| A commit naming a knowledge page not read whole | reading every line of it |
| The first write to a component without its knowledge page | opening the page |
| The end of a turn with full-size work | a fresh review |
| A push before that review | the review, reported |
| The end of reviewed work | the plan updated with its end lines |

Each gate in full is under [Full-size work](REFERENCE.md#full-size-work).

At every stop the hooks check three more things. First, a memory file the session wrote, in a folder that breaks toolkit-standard §D 25, blocks the turn once with the findings (`tools/memory-check`).

Second, files the session wrote but did not commit block the turn once. See [The session's own edits](REFERENCE.md#the-sessions-own-edits-committed-before-a-turn-ends). Third, in a project with a built docs site, the turn's code also goes through the system's checker. See [The system's checker](REFERENCE.md#the-systems-checker-at-the-end-of-a-turn).

## Switches

| Variable | Turns off |
|---|---|
| `TOOLKIT_GATES=off` | the gates and the uncommitted-files check |
| `TOOLKIT_VALIDATE=off` | the system's checker |
| `TOOLKIT_RULES=off` | the rule list `edit` hands over |
| `TOOLKIT_WORKTREES=off` | the worktree rule in the main checkout |

`TOOLKIT_STATE_DIR` moves the state folder from `~/.claude/toolkit-state/`.

## What is in the folder

| File | Job |
|---|---|
| `hooks.mjs` | the entry point: `start`, `stop`, `prompt` and `edit` |
| `gates.mjs` | the plan, review, push and feedback gates |
| `standards-read.mjs` | which rules govern a file |
| `knowledge-read.mjs` | the commit gate for unread knowledge pages |
| `stop-items.mjs` | hands each open item over once |
| `owners.mjs` | which session owns a path or commit |
| `validate-turn.mjs` | the system's checker at a stop |
| `state-dir.mjs` | where plans and gate state live |
| `impact.mjs` | who reads the files a change touches |
| `clear-prune.mjs` | moves the session a `/clear` left to the Trash |

Each file's full job is under [What each file does](REFERENCE.md#what-each-file-does). A plan's Impact section comes from this command:

```sh
node tools/claude-hooks/impact.mjs <file>...
```

## How it fits

- [REFERENCE.md](REFERENCE.md) holds the detail: each gate, the stop checks and the known limits.
- [tools/skill-evals](../skill-evals/README.md) runs with the gates off, since an eval measures a skill, not the process.
- [tools/system-mcp](../system-mcp/README.md) owns the checker the stop runs.

## Test

```sh
node tools/claude-hooks/test-hooks.mjs
node tools/claude-hooks/test-standards-read.mjs
node tools/claude-hooks/test-stop-items.mjs
node tools/claude-hooks/test-validate-turn.mjs
node tools/claude-hooks/test-gates.mjs
node tools/claude-hooks/test-knowledge-read.mjs
```

`test-hooks.mjs` runs the whole loop end to end. See [The end-to-end test](REFERENCE.md#the-end-to-end-test).
