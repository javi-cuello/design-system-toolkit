# Skill evals

The gates hold the code a project ships, and an eval holds the agent that writes it. It gives headless Claude Code a task, such as "build this component from its design". The agent works in a throwaway copy of the project, and the project's own gates grade the result. Run it after a skill changes. Then compare with the task's last line: better, worse, or the same for less.

## What it needs

- The Claude Code CLI (`claude`) on the PATH.
- A project whose `snapshot.config.json` has an `evals` block. Its keys are under [A project's facts](REFERENCE.md#a-projects-facts).

## Run it

```sh
node tools/skill-evals/run.mjs --repo <dir> [task] [--trials N] [--rules on|off] [--brief snapshot|contract] [--context on|off] [--no-agent] [--keep-files] [--keep]
```

The flags are in `run.mjs`'s header and under [The run's switches](REFERENCE.md#the-runs-switches). An agent is not deterministic, so one run is a sample of one. Use `--trials 3` or more when you compare. See [Trials](REFERENCE.md#trials).

Before you trust a score, run with `--no-agent`. It grades the copy as prepared, with no agent. See [Proving the grade](REFERENCE.md#proving-the-grade).

## Three kinds of task

| Kind | The agent builds | Graded by |
|---|---|---|
| Parity | a component, from its design | parity and the stylesheet gates |
| Screen | a product screen described in words | the push gate's `validate.mjs` |
| Figma | a screen or flow in a Figma file | `figma-grade.js`, inside Figma |

A screen task is marked `"grade": "validate"`. See [Screen tasks](REFERENCE.md#screen-tasks).

A Figma task needs the desktop bridge. So a subagent of a session with the figma-console tools runs it, not `run.mjs`. It has three commands:

```sh
node tools/skill-evals/figma.mjs prompt <tasks.json> <task>
node tools/skill-evals/figma.mjs grade-config <tasks.json> <task> <run>
node tools/skill-evals/figma.mjs score <tasks.json> <task> <graded.json>
```

See [Figma tasks](REFERENCE.md#figma-tasks).

## What it reads and writes

It reads the project's tree at HEAD, or at a pinned commit. See [Pinned runs](REFERENCE.md#pinned-runs). It writes one line per run to the project's results file. The default is `tests/evals/results.jsonl`. A run that reads the original repo or changes the grade's inputs scores 0.

## What is in the folder

| File | Job |
|---|---|
| `run.mjs` | copies the project, runs the agent, then grades |
| `eval.mjs` | the pure parts: task shape, score, contamination |
| `figma.mjs` | a Figma task's prompt, grader config and score |
| `figma-grade.js` | the grader sent into Figma |

Each file's full job is in the [files table](REFERENCE.md#files).

## How it fits

- [REFERENCE.md](REFERENCE.md) holds the detail: switches, task kinds, project keys, trials, pinned runs and open gaps.
- `--rules` turns the rules hook of [tools/claude-hooks](../claude-hooks/README.md) on or off.
- Screen tasks are graded by [tools/system-mcp](../system-mcp/README.md).

## Test

```sh
node tools/skill-evals/test-eval.mjs
node tools/skill-evals/test-figma.mjs
```

`figma-grade.js` runs only inside Figma. It is proven by hand on a real file.
