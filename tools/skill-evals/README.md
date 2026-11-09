# Skill evals

The gates hold the code a project ships. An eval holds the agent that writes it: a task (build this component from its design) run by headless Claude Code in a throwaway copy of the project, graded by the project's own gates. Run it after a skill changes and compare with the task's last line: better, worse, or the same for less.

    node tools/skill-evals/run.mjs --repo <dir> [task] [--rules on|off] [--brief snapshot|contract] [--context on|off] [--no-agent] [--keep-files] [--keep]

`--rules` runs the agent with the rules hook (`tools/claude-hooks/hooks.mjs edit`) on, the default, or off (the gates are always off in an eval copy: an eval measures the skill, not the process); each line records which, and a run is compared with the last clean one under the same setting (a void run — contaminated, or one that changed the grade's inputs — is never the baseline; a failed build is).

`--brief` names the file that holds the design in the agent's prompt: the snapshot (`figma.json`) or the component's contract (`contract.json`, tools/component-contract). Both stay in the copy, because parity grades against the snapshot; each line records which of the two the agent opened, so a contract that was not enough shows as a run that read the snapshot too.

## Screen tasks

A task with `"grade": "validate"` asks for a product screen in words that name no component ("a notification settings page where…"). It needs no parity target and usually removes nothing (`remove` is still honoured). The grade is `tools/system-mcp/validate.mjs`, the push gate's own checker, over the code files the agent created or changed (inside `check.validate.code`, outside `check.validate.system`), against the built docs site's api. The score is the share of written files with no finding; green is no finding at all; nothing written scores 0. A file written into the system's own code counts as not clean and is named, since validate does not read it and no reviewer reads an eval; an agent that did not exit cleanly (a timeout, its turn limit, an error) is never green. A file git would ignore (a build's output, an install) is not counted as written, and the project's §6 rulings scoped `validate` waive here as at the push (`validate.mjs` `unwaived`), so an existing file the agent touched is not charged for a ruled finding. The prompt never names the grade, though with the context on the system MCP offers the same checker as a tool: using it is part of what the context gives. The parity grade's inputs a screen agent adds (a story for its screen) do not void the run; changing one that was there does. The line records each finding kind's count and, up to 40, each finding as validate printed it.

A screen task may name its `chrome`: the modules the product's shell comes from (`["screens/templates/app-page", "screens/shell/app-shell"]`). When nothing the agent wrote imports one of them (alias or relative; a type-only import does not count), a `chrome` finding is added on the route's page and the run scores 0, since a screen built outside the shell, or around a shell it wrote itself, is wrong as a whole. A feedback task whose prompt named a path outside the shell got a page there, unstyled, and scored 1, because the grade read imports only (2026-11-04). That was a grader chosen for what it could score rather than for the question: decide what a task must show first, then build the grade for it. A parity grade needs a drawn frame, so it can only measure screens that are drawn, and there the frame already answers what the context would.

`--context on` (the default) gives the agent the system MCP (`tools/system-mcp/server.mjs`) over that site, served read-only for the run; `off` gives it no MCP server. Both pass `--strict-mcp-config`, so the user's own servers never load and the two differ by the context alone. Each line records the setting and whether the agent asked the system at all; a run is compared only with one under the same setting. A project with no `check.validate.system` or no built site is refused before a copy is made. A parity task takes `--context` only when it is named: without it the agent runs as before, with the user's own servers, so earlier parity lines stay comparable; named, the same two settings apply (`on` needs the built site, not `check.validate.system`), and a parity task whose target is a screen, rebuilt against its stored Figma frame under each, measures what the context does for layout, which validate does not grade.

| File | What it is |
|---|---|
| `run.mjs` | The run: a copy of HEAD's tree with no history (`git archive`), the task's files removed, the agent, then the grade — the project's build, a server for the copy when it serves its components, the parity run scoped to the task's target, the stylesheet gates. One line per run in the project's results file |
| `eval.mjs` | The pure parts: a task's shape, a parity summary read, the score (never green when the agent, parity or the stylesheet gate exited in a way its count does not explain: a crash or a timeout is named in the line's `why`), what moved since the last run, contamination — a transcript that read the original repo, or ran git where a repository was reachable or pointed it elsewhere, scores 0 — and the grade's inputs: the design, mappings, stories, config, and the tokens, screens, baseline and backlog wherever the config puts them; they are read-only in the copy while the agent works, a run that changed any anyway scores 0 and is never graded (no build, server or gate runs over it), and what a parity run itself writes (its latest measurements, the report, the `--shots` pictures) is never one |
| `test-eval.mjs` | `eval.mjs`'s tests; run by `bin/check` |

## A project's facts

In `evals` of its `snapshot.config.json`:

| Key | What it says |
|---|---|
| `tasks` | `[{ id, target, remove, prompt }]` — the parity target graded, the files the agent rebuilds, what it is asked; a screen task is `{ id, grade: "validate", prompt, chrome? }`; either may add `commit` |
| `link` | what the copy needs that git does not carry: a folder is linked (`node_modules`), a file copied (a local config Kirby will not load through a link) |
| `build` | the step before grading (`bin/css`); a failed build scores 0, since the copy would keep the original's compiled output. It runs in the copy after the agent has edited it, so what it runs is only as trusted as the copy: the agent's narrowed tools (toolkit-standard §D 24) do not reach it, so a copy whose files told the agent to rewrite the build script would have the grader run it. `serve` is the same. Open: run both from HEAD's tree rather than the copy |
| `serve` | the command that serves the copy's components, `{port}` filled; parity is pointed at it by `PARITY_HOST_BASE` |
| `commit` | the commit every copy is made from, as a hash; a task's own `commit` outranks it. Unset, HEAD. See *Pinned runs* |
| `results` | where the line goes, in the project repo (default `tests/evals/results.jsonl`) |
| `agentCommands`, `maxTurns`, `minutes` | what else the agent may run, and its limits. Each command is a prefix the project vouches for: the copy's files are data the agent must not take orders from, so `node` runs only the parity and stylesheet gates unless a script is named here (`node scripts/x.mjs`) |

## Pinned runs

A project moves between runs, so an unpinned score that moved may be the project's doing, not the skill's. A pinned task's copy is that commit's tree, its line records `commit` and `pinned: true`, and it is compared only with a line at the same commit: a toolkit change is then the only thing that differs. A pin that is not a hash, or not a commit in the repo, is refused before any copy is made. What still comes from today: the task list and the rest of `evals` (read from the working tree), what `link` links, and for a screen task the built docs site it is graded against and the context document's rulings; a pin holds the project's code, not its system.

## What the agent can still run

The gates the agent may run are not inert: parity imports the copy's mapping modules and token modules and runs a mapping command, all of them files from the copy. The mapping modules and the files under `tests/parity` are grade inputs, so they are read-only while the agent works and a changed one voids the run before any gate runs over it. Open: a file the agent may write that those modules import (a helper, a component file a mapping command's script includes), a token module outside the grade's inputs, and a new file a mapping glob matches. The gate the agent runs mid-work imports each before the tamper check at the end sees it. Closing that would mean running the gates from HEAD's tree rather than the copy, the same open item as `build` and `serve` above.

## Proving the grade

Before trusting a score, `--no-agent` grades the copy as prepared: with the files removed it must score low, and with `--keep-files` it must score as the project does. Both projects were proven both ways on 2026-10-03 before the first agent ran. A screen task's `--no-agent` run scores 0 ("wrote no code"); its grade was proven on 2026-11-04 by a stub agent that wrote one file with a raw colour and a raw `<button>` and one clean file: 0.5, both findings named, under either context. A removed score of 0 can mean the build failed or parity could not render, not a measured miss (one project's Storybook build fails without the component); that is still the right grade for a missing component, but it proves the grader reaches 0, not that it scores a partial build in between.
