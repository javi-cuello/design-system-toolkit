# Skill evals

The gates hold the code a project ships. An eval holds the agent that writes it: a task (build this component from its design) run by headless Claude Code in a throwaway copy of the project, graded by the project's own gates. Run it after a skill changes and compare with the task's last line: better, worse, or the same for less.

    node tools/skill-evals/run.mjs --repo <dir> [task] [--rules on|off] [--brief snapshot|contract] [--no-agent] [--keep-files] [--keep]

`--rules` runs the agent with the rules hook (`tools/claude-hooks/hooks.mjs edit`) on, the default, or off (the gates are always off in an eval copy: an eval measures the skill, not the process); each line records which, and a run is compared with the last clean one under the same setting (a void run — contaminated, or one that changed the grade's inputs — is never the baseline; a failed build is).

`--brief` names the file that holds the design in the agent's prompt: the snapshot (`figma.json`) or the component's contract (`contract.json`, tools/component-contract). Both stay in the copy, because parity grades against the snapshot; each line records which of the two the agent opened, so a contract that was not enough shows as a run that read the snapshot too.

| File | What it is |
|---|---|
| `run.mjs` | The run: a copy of HEAD's tree with no history (`git archive`), the task's files removed, the agent, then the grade — the project's build, a server for the copy when it serves its components, the parity run scoped to the task's target, the stylesheet gates. One line per run in the project's results file |
| `eval.mjs` | The pure parts: a task's shape, a parity summary read, the score (never green when the agent, parity or the stylesheet gate exited in a way its count does not explain: a crash or a timeout is named in the line's `why`), what moved since the last run, contamination — a transcript that read the original repo or ran git scores 0 — and the grade's inputs: the design, mappings, stories, config, and the tokens, screens, baseline and backlog wherever the config puts them; a run that changed any scores 0, and what a parity run itself writes (its latest measurements, the report, the `--shots` pictures) is never one |
| `test-eval.mjs` | `eval.mjs`'s tests; run by `bin/check` |

## A project's facts

In `evals` of its `snapshot.config.json`:

| Key | What it says |
|---|---|
| `tasks` | `[{ id, target, remove, prompt }]` — the parity target graded, the files the agent rebuilds, what it is asked |
| `link` | what the copy needs that git does not carry: a folder is linked (`node_modules`), a file copied (a local config Kirby will not load through a link) |
| `build` | the step before grading (`bin/css`); a failed build scores 0, since the copy would keep the original's compiled output. It runs in the copy after the agent has edited it, so what it runs is only as trusted as the copy: the agent's narrowed tools (toolkit-standard §D 24) do not reach it, so a copy whose files told the agent to rewrite the build script would have the grader run it. `serve` is the same. Open: run both from HEAD's tree rather than the copy |
| `serve` | the command that serves the copy's components, `{port}` filled; parity is pointed at it by `PARITY_HOST_BASE` |
| `results` | where the line goes, in the project repo (default `tests/evals/results.jsonl`) |
| `agentCommands`, `maxTurns`, `minutes` | what else the agent may run, and its limits. Each command is a prefix the project vouches for: the copy's files are data the agent must not take orders from, so `node` runs only the parity and stylesheet gates unless a script is named here (`node scripts/x.mjs`) |

## Proving the grade

Before trusting a score, `--no-agent` grades the copy as prepared: with the files removed it must score low, and with `--keep-files` it must score as the project does. Both projects were proven both ways on 2026-10-03 before the first agent ran. A removed score of 0 can mean the build failed or parity could not render, not a measured miss (one project's Storybook build fails without the component); that is still the right grade for a missing component, but it proves the grader reaches 0, not that it scores a partial build in between.
