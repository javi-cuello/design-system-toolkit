# Why agent rules need the harness

Why a step written in a context file gets skipped, and which harness mechanisms make it happen every time.

An agent finishes a change. The checks pass, the diff looks right, and it reports the work done. The project's `CLAUDE.md` says every piece of work ends with an independent review, and has said so for three weeks. Asked whether it reviewed its work, the agent answers "partly".

Nothing malfunctioned. The rule was written as prose, and prose is a request the model may decline.

---

## What this answers

- [Why written steps slip](#why-written-steps-slip): why a written step feels optional
- [Phase enforcement elsewhere](#phase-enforcement-elsewhere): how other tools enforce phases
- [Reports from teams at scale](#reports-from-teams-at-scale): what failed at scale, and what fixed it
- [The enforcement ladder](#the-enforcement-ladder): which enforcement mechanisms hold
- [The reviewer's model](#the-reviewers-model): whether review needs a different model
- [Ceremony scaled to size](#ceremony-scaled-to-size): how the ceremony scales with size
- [One toolkit's gates](#one-toolkits-gates): what one toolkit built
- [Costs and failure modes](#costs-and-failure-modes): what it costs, and what breaks

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs.

---

## Why written steps slip

A written step is optional by design: Claude Code treats `CLAUDE.md` as guidance the model weighs, and only the harness (hooks, permission rules, tool restrictions) applies a rule whatever the model decides.

Go back to the agent that answered "partly". Its instructions said to finish with an independent review. Everything else in front of it said the work was finished: the tests passed, the diff looked right, and the person was waiting.

Anthropic's [best-practices page](https://code.claude.com/docs/en/best-practices) divides instructions into two kinds. A prompt, a `CLAUDE.md` line or a skill is non-deterministic: the model reads it and decides. A hook, a permission rule or a managed setting is deterministic: "Claude Code applies this every time, no matter what the model decided to do."

On the first kind the page is blunt: "CLAUDE.md is for guidelines, and Claude is allowed to decide a guideline doesn't apply." It also names the symptom a maintainer sees. A line that keeps getting more emphasis and keeps being missed belongs in a hook.

Louder wording doesn't help. The same page says adding IMPORTANT probably won't fix it, and that emphasis mostly makes the model over-apply the rule. Claude Code's [memory page](https://code.claude.com/docs/en/memory) says the same of `CLAUDE.md` and of the auto memory the agent writes for itself: both are context, not enforced configuration, and anything that must be blocked belongs in a hook.

The mechanism is ordinary. A model holds instructions, the code it has read, tool output and its own reasoning in one context, and weighs them together. A rule saying "finish with an independent review" competes with a strong local signal that the work is done.

When the rule loses, the model doesn't experience breaking a rule. It judges that the rule didn't apply this time, which is exactly the latitude the documentation grants.

Long sessions with many rules make this worse, and three research findings say why:

- **Many rules at once.** [IFScale](https://arxiv.org/abs/2507.11538) (July 2025) found the best frontier models at about 68 percent accuracy with 500 simultaneous instructions, biased toward instructions that appear earlier. A toolkit's context file, standards and memory together hold hundreds.
- **Long conversations.** [Laban and colleagues](https://arxiv.org/abs/2505.06120) (May 2025) found a 39 percent average drop from single-turn to multi-turn performance, mostly from unreliability: models that take a wrong turn "get lost and do not recover."
- **Context files that cost more than they give.** The one controlled study of task success found no general gain, at over 20 percent more cost; [Part 4](how-the-system-reaches-the-agent.md) weighs both `AGENTS.md` studies.

Compaction adds a fourth cause. When a long session is summarised to fit the window, a rule stated early survives as a paraphrase or not at all. Anthropic warns that a conversational boundary "can get lost when the conversation compacts", and superpowers re-injects its rules after compaction for that reason.

Stop treating a rule's wording as the lever. **A step that must happen every time belongs in the harness; your prose keeps only what the agent needs to do that step well.** That a context file is advisory is the vendor's own statement, not an inference.

---

## Phase enforcement elsewhere

Every serious workflow has the same phases (plan, implement, verify, review), and almost all enforce them with prose; the ones that make a step mandatory use hooks, harness-enforced modes or CI.

[GitHub Spec Kit](https://github.com/github/spec-kit) shows the gap in one line. Its [plan template](https://raw.githubusercontent.com/github/spec-kit/main/templates/plan-template.md) carries a heading, "GATE: Must pass before Phase 0". The model fills it in, and nothing checks what it wrote.

Spec Kit runs constitution, specify, plan, tasks, implement. One of its gates is real, because it is a script: the [implement command](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/implement.md) fails without a tasks file. The rest are text the model reads.

Anthropic's own guidance is explore, plan, code, commit. [Plan mode](https://code.claude.com/docs/en/permission-modes) is the harness version of "plan first": edits are blocked until the person approves the plan. It has one documented hole. In an interactive terminal where bypass permissions are available, the model is only instructed not to edit.

For verification, the best-practices page gives four rungs, from soft to hard:

- ask in the prompt;
- `/goal`, where a separate model checks a stated condition after every turn;
- a Stop hook that exits with code 2, so the turn doesn't end until the typecheck passes or the block limit is reached;
- `/code-review`, which reviews the diff in a fresh subagent that never saw the conversation.

The same page asks for evidence over claims: "'All tests pass' on its own tells you very little."

[AWS Kiro](https://kiro.dev/docs/specs/) builds requirements, design and tasks into its editor, with a review screen for each. Its "Quick Spec" mode runs without approval gates. Its [hooks](https://kiro.dev/docs/hooks/index) can gate a tool call, as Claude Code's can.

[obra/superpowers](https://github.com/obra/superpowers) is the most complete process framework for Claude Code, and the most instructive about limits. It runs a brainstorm, an isolated worktree, a written plan in two-to-five-minute tasks, a fresh subagent per task with a two-stage review, test-first, a requested code review where critical issues block progress, and verification before completion.

Every one of those gates is prose. A SessionStart hook injects it, written at maximum volume ("YOU DO NOT HAVE A CHOICE"), with a table rebutting the excuses a model gives. Nothing blocks an edit or a stop, and its docs note that a long session that compacts can lose the bootstrap without re-injection. It is the loud end of prose enforcement.

OpenAI's [codex-plugin-cc](https://github.com/openai/codex-plugin-cc) puts Codex inside Claude Code as a reviewer. Its optional review gate is a Stop hook: if Codex finds problems, "the stop is blocked so Claude can address them first". Its README warns that this can start a long Claude and Codex loop and drain usage limits quickly.

The rest converge on the same split:

- **Codex** reads `AGENTS.md` up to 32 KiB and promises no compliance; its [hooks](https://learn.chatgpt.com/docs/hooks) can deny a call and are "a guardrail rather than a complete enforcement boundary".
- **Cursor**'s "Enforce this rule" means only that the rule can't be switched off; its [Stop hook](https://cursor.com/docs/hooks) can continue the agent up to five times.
- **Aider** [runs lint and tests](https://aider.chat/docs/usage/lint-test.html) after each edit, but doesn't gate finishing.
- **Cline**'s [hooks](https://docs.cline.bot/features/hooks) can cancel a tool call; its task-complete hook only notifies.

Take your phases from Spec Kit and superpowers, which agree with each other and with Anthropic. **Take your enforcement from the harness: a refusal before a tool runs and a block at the end of a turn are the two mechanisms every vendor documents as binding.**

---

## Reports from teams at scale

The same failures everywhere (early victory, tampered tests, wandering past the task), and the fixes that lasted moved out of the prompt into something the agent couldn't argue with.

The canonical list of failures is Kent Beck's. Working through a plan of tests with an agent, he met loops, features nobody asked for, and an agent that "cheated" by disabling or deleting tests. Those three come back in every account below.

Here are eight first-hand accounts from 2025 and 2026, each with what failed and what fixed it:

- **[Kent Beck](https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes)** keeps a `plan.md` of tests and has the agent take the next one: red, green, refactor. His fix was closer steering by hand, which works for one expert watching one agent.
- **[Harper Reed](https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/)** has a model interview him into a `spec.md`, then writes a prompt plan of small test-first steps and a `todo.md`. The plan files are the only enforcement, and he reports merge conflicts once a team is involved.
- **[Armin Ronacher](https://lucumr.pocoo.org/2025/6/12/agentic-coding/)** lets the agent verify itself through Makefile targets, logs and a browser driver. When it started a dev server that was already running, he didn't add a prompt line. He made the target refuse with an error, so the guardrail went into the tool.
- **[Mitchell Hashimoto](https://mitchellh.com/writing/my-ai-adoption-journey)** calls his practice harness engineering: every agent mistake becomes a line in `AGENTS.md`, or a script with a line pointing to it. He names giving the agent a way to verify its work as the most reliable way to get it right first time.
- **[Jesse Vincent](https://blog.fsck.com/2025/10/09/superpowers/)**, building superpowers, found that quizzing subagents on skills proved little. Pressure scenarios tested a rule (an outage where delay costs money, a solution already built and tempting to keep), and each failure strengthened the skill that should have stopped it.
- **[Anthropic Engineering](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)**, on long-running agents, met four failures. Building everything at once ran out of context (fix: one feature per session). Early victory (fix: a feature list where every item starts failing). "Done" after unit tests alone (fix: end-to-end tests in a browser). Edited tests (fix: among others, a JSON checklist, overwritten less often than Markdown).
- **[Spotify](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3)** runs deterministic verifiers (format, build, test) in a Claude Code Stop hook before a pull request can open, then a model judge that compares the diff with the request. The judge vetoes about a quarter of sessions, and the agent recovers about half the time. The worst failure it names is a pull request that passes CI and is functionally wrong.
- **[Stripe's Minions](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2)** run inside code-defined blueprints that alternate agent steps with deterministic ones. A hard cap of two CI rounds hands over to a person, rules are scoped per directory, and human review is mandatory. More than 1,300 such pull requests merge a week.

Every fix in Anthropic's list is a structure, not a sentence, and the same holds across the others. Three patterns run through them:

- **Test tampering is the most reported failure**, and nobody fixed it with wording.
- **The lesson goes back into the system**: Hashimoto's into `AGENTS.md` and scripts, Vincent's into skills, Ronacher's into the tool.
- **Independent review is rarely a gate.** Only Vincent's per-task review, Spotify's judge and Stripe's human approval enforce one.

Copy what worked at scale: Spotify's Stop hook with deterministic checks first and a judgement second, Stripe's code-defined sequence with a capped retry, and Hashimoto's rule that every mistake becomes a line or a tool. **Don't copy what depended on one expert watching.**

---

## The enforcement ladder

From hardest to skip: a gate at push or merge, a refusal before a tool runs, a tool-restricted role, a Stop hook, a script inside a command, a model judging a condition, prose injected by a hook, and plain prose.

Take the review rule from the opening. Written in `CLAUDE.md`, it is plain prose, the bottom of the list. A Stop hook that won't let the turn end until a review has run puts the same rule four rungs higher, and the model's judgement no longer enters into it.

Here is the whole ladder, hardest to skip at the top.

<svg role="img" viewBox="0 0 760 440" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="Helvetica, Arial, sans-serif">
<title>The enforcement ladder, from hardest to skip at the top to easiest at the bottom. One, a gate at push or merge: fires after the work is built. Two, a refusal before a tool runs: misses tools its matcher does not see. Three, a tool-restricted role: binds what a role can do, not whether it is used. Four, a Stop hook that blocks the end of a turn: capped at eight continuations in a row. These four refuse in code. Five, a script inside a command: binds only if the command runs. Six, a model judging a condition: a model decides. Seven, prose injected by a hook: can be lost at compaction. Eight, plain prose: advisory by every vendor's statement.</title>
<rect x="0" y="0" width="760" height="440" fill="#ffffff"/>
<text x="20" y="28" font-size="13" font-weight="700" fill="#15171c">Hardest to skip</text>
<text x="740" y="28" font-size="13" font-weight="700" fill="#15171c" text-anchor="end">Its known hole</text>
<rect x="20" y="42" width="330" height="40" rx="6" fill="#fdecea" stroke="#c62828"/>
<text x="34" y="67" font-size="13" fill="#15171c">1  Gate at push or merge</text>
<text x="370" y="67" font-size="12" fill="#5b6270">Fires after the work is built</text>
<rect x="20" y="88" width="330" height="40" rx="6" fill="#fdecea" stroke="#c62828"/>
<text x="34" y="113" font-size="13" fill="#15171c">2  Refusal before a tool runs</text>
<text x="370" y="113" font-size="12" fill="#5b6270">Misses tools its matcher does not see</text>
<rect x="20" y="134" width="330" height="40" rx="6" fill="#fdecea" stroke="#c62828"/>
<text x="34" y="159" font-size="13" fill="#15171c">3  Tool-restricted role</text>
<text x="370" y="159" font-size="12" fill="#5b6270">Binds what it can do, not whether it is used</text>
<rect x="20" y="180" width="330" height="40" rx="6" fill="#fdecea" stroke="#c62828"/>
<text x="34" y="205" font-size="13" fill="#15171c">4  Stop hook blocks the end of a turn</text>
<text x="370" y="205" font-size="12" fill="#5b6270">Eight continuations in a row, then it lets go</text>
<line x1="20" y1="232" x2="740" y2="232" stroke="#c62828" stroke-dasharray="4 3"/>
<text x="740" y="248" font-size="11" fill="#c62828" text-anchor="end">above: code refuses</text>
<rect x="20" y="256" width="330" height="40" rx="6" fill="#fff6e0" stroke="#a66b00"/>
<text x="34" y="281" font-size="13" fill="#15171c">5  Script inside a command</text>
<text x="370" y="281" font-size="12" fill="#5b6270">Binds only if the command is run</text>
<rect x="20" y="302" width="330" height="40" rx="6" fill="#fff6e0" stroke="#a66b00"/>
<text x="34" y="327" font-size="13" fill="#15171c">6  Model judging a condition</text>
<text x="370" y="327" font-size="12" fill="#5b6270">Automatic, but a model decides</text>
<rect x="20" y="348" width="330" height="40" rx="6" fill="#e6ecfc" stroke="#1f4fd8"/>
<text x="34" y="373" font-size="13" fill="#15171c">7  Prose injected by a hook</text>
<text x="370" y="373" font-size="12" fill="#5b6270">Always present, lost at compaction</text>
<rect x="20" y="394" width="330" height="40" rx="6" fill="#e6ecfc" stroke="#1f4fd8"/>
<text x="34" y="419" font-size="13" fill="#15171c">8  Plain prose, with or without MUST</text>
<text x="370" y="419" font-size="12" fill="#5b6270">Advisory by every vendor's own statement</text>
</svg>

The red rungs refuse in code; the amber ones bind only sometimes; the blue ones are the model's to weigh. Each rung up costs friction, and each has a hole worth knowing:

1. **A gate at push or merge** (a pre-push hook, a required CI check, branch protection, human approval). It can't be skipped without an explicit override. Its weakness is timing: it fires after the work is built, so it can refuse a missing review but can't make a plan happen first.
2. **A refusal before a tool runs** (a PreToolUse hook that denies, a permission deny rule). It is the only moment that can force "plan before editing". Its holes are tools the matcher doesn't see (a Bash `sed` edits a file the Edit matcher never sees) and command hooks that fail open when they crash.
3. **A tool-restricted role**: a reviewer allowed only Read, Grep and Glob, or plan mode where it is enforced. It binds what the role can do, not whether the role is used.
4. **A Stop hook that blocks the end of a turn.** Exit code 2 or `decision: "block"` sends the agent back to work. The hook must check `stop_hook_active`, and Claude Code caps it at eight continuations in a row.
5. **A script inside a command**, such as Spec Kit's prerequisite check. It binds only if the command is run.
6. **A model judging a condition**: `/goal`, a prompt hook, a cross-model review gate. Automatic, but a model decides.
7. **Prose injected by a hook**, such as superpowers' bootstrap. Always present, still advisory, and it can be lost at compaction.
8. **Plain prose**, with or without MUST. Advisory by every vendor's own statement, and weaker as rules multiply and sessions lengthen.

> **Aside.** Anthropic documents permission deny rules as holding "in every permission mode, including auto and bypassPermissions". The same statement for a hook's deny hasn't been found.

The Stop hook's cap looks like a hole for a review gate, and isn't. The [hooks reference](https://code.claude.com/docs/en/hooks) says the count of consecutive continuations resets each time the agent calls a tool, and an agent sent back to review calls tools. `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` raises the cap.

No controlled study compares prose rules against hooks directly. The case rests on the vendors' documentation and on the mechanism: a hook runs as code outside the model, so the model's judgement never enters into it.

Use rung 2 for the plan, rung 4 for the review and the feedback loop, and rung 1 as the backstop. **Leave the rest of your rules at rungs 7 and 8, where they belong.** The ranking is a judgement, made by asking at each rung whether the model's decision can still let the step through.

---

## The reviewer's model

No evidence says review needs a different model; what the evidence and the vendors agree on is that the reviewer must not share the implementer's context.

Picture the review the agent in the opening could have run. If it reads its own diff in the same conversation, it reads its own reasoning back, and the same justifications that produced the code approve it. Swapping in another vendor's model changes who reads, but not necessarily what they see.

The case for a different model rests on *self-preference*: the documented tendency of a model acting as judge to favour output like its own (Panickssery and colleagues, 2024, on LLM judges in general). The closest setting has been tested once. A [June 2026 preprint](https://arxiv.org/abs/2606.20093) had authors revise their own work against a deterministic checker, and found self-preference "weak or absent".

Its numbers are small: minus 5.1 percentage points, with a confidence interval of minus 12.9 to plus 2.7, across four models and 85 cases. No study measures bug-catch rates for cross-model against same-model review, and the claims for review bots come from their vendors' own benchmarks.

Anthropic puts the weight on context instead. Its [local code review](https://code.claude.com/docs/en/code-review-local) runs in a fresh subagent that never saw the conversation: "It isn't swayed by the reasoning that produced the code." The best-practices page adds a warning: a reviewer asked to find problems will always find something. That is why a review needs verified findings and a stopping rule.

Require a fresh-context review, not a second vendor. **What makes a review independent is what the reviewer didn't see, not which model it is.** A different model is an option for high-stakes changes, at the cost of a second subscription and the loop risk codex-plugin-cc's own README names.

---

## Ceremony scaled to size

Measure the change, not the request: a script that reads what the session wrote can tell a one-line fix from a cross-repository change without asking the agent, and the gates fire only above a line.

Every framework above scales by asking someone to choose a mode. Kiro has "Quick Spec". Superpowers has its "1% chance" rule. Anthropic advises skipping the plan when "you could describe the diff in one sentence".

Choosing is the problem. The agent that treats review as optional will also judge its own change to be small, so the decision has to be made by something that measures.

Where a change lands matters as much as its size. A two-line edit to a shared standard changes a rule every consumer reads; a two-line edit to one button doesn't. So the line is drawn on both. Small and local takes the fast path. Large, or touching a shared rule or tool, takes the full path.

**One toolkit's history, worked through.** The line was tested against 293 commits from 1 September to 28 October 2026. It was set at three files and 100 changed lines, bookkeeping files aside, with no file under `standards/` or `tools/shared/`. That line put exactly half the commits (147) on the fast path. Fourteen commits changed more than 400 lines.

Use two tiers, chosen by a script, never by the agent. The fast path keeps what already exists, a check at push; the full path adds the plan, review and feedback gates. **Start your thresholds where your own history puts them, and tune them from the gate's log.** The two-tier design is a judgement; the even split is what one repository's history showed.

---

## One toolkit's gates

Four gates that refuse, built as `tools/claude-hooks/gates.mjs` and in use for every Claude Code session on its maintainer's machine since 28 October 2026; everything else still only informs.

The record before the gates is the opening scene in numbers. In October the toolkit had moved its loop out of prose into four hooks that informed and refused nothing:

- SessionStart hands over open items;
- PreToolUse hands over an area's rules beside the first edit there;
- Stop collects what a turn left open;
- UserPromptSubmit hands that over with the next message.

They refused nothing by choice: an earlier blocking Stop hook had printed on screen "on nearly every turn". The cost showed in the record. The two steps gated at push (the check and the commit trailers) held. The one gated at Stop (reply length) held. The steps only written down were the ones a person kept having to ask for.

Of 293 commits since 1 September, 23 mentioned an independent review. On 28 October, an agent asked whether it had reviewed its work answered "partly", three weeks after the rule was written down to make the question unnecessary.

The rule now reads, in toolkit-standard §D 13: "The loop runs for every piece of work, and no step of it is optional". The gates are its trigger column. Each checks evidence in the session's own transcript, so the agent is never asked whether it did a step.

| When | Gate | What clears it |
|---|---|---|
| The edit that makes the work full-size | Refused (PreToolUse) | A plan file with Before (the closing line of a check run the transcript shows came back), Goal, Impact (the output of `impact.mjs`, every reader of the touched files across the toolkit and its projects), Claims (what the result rests on, checked or only believed), Beyond scope, Budget and Review |
| The end of a turn that did full-size work | Blocked (Stop) | A review by fresh read-only agents (never a fork, never the implementer), after the checks, repeated until a round finds no new High; a small fix afterwards needs no second review |
| A push of a repository with unreviewed full-size work, or while a review runs | Refused (PreToolUse) | The review, reported |
| The end of reviewed work | Blocked (Stop) | A `Toolkit:` line (what goes back to the toolkit), an `Open:` line (what stays unfinished and why), and a `Docs:` line when a README describing the changed files was left alone |

Full-size is measured, never asked: three files or 100 lines written since the work began, or more than ten lines in a standard or shared tool (`FILES = 3`, `LINES = 100`, `WIDE_LINES = 10` in `gates.mjs`). The count includes what subagents write and what a script's own code writes (found on disk, beyond what the file held before).

It also carries unreviewed, uncommitted work another session left in the same repository, for up to a week. Small work committed as it goes, about half of all commits, never meets a gate. The gates refuse in the session and nowhere else on screen, which keeps the decision of 15 October that the hooks speak to the session.

**The first week.** The plan gate refused the work that built it until that work had a plan, and the feedback gate caught its own bug on its first run; the hooks' README records both as the gates' proof. Most commits since have taught the gates to see writes they had missed:

- an in-place `sed` whose file sits after a script, inside a subshell or in backticks;
- a background agent's edits in its own worktree, now counted when its branch merges.

That is the refusal rung's hole from [the enforcement ladder](#the-enforcement-ladder), tools the matcher doesn't see, found in practice one shape at a time.

**The holes that remain**, as the [README](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/README.md) lists them:

- A push from a terminal outside Claude Code, or quoted inside another shell, isn't gated.
- A background shell command's writes land after its call ends and aren't counted.
- A check run whose output went to a file, or was cut to a preview, isn't seen.
- Another session writing the same repository during a shell call is counted as this session's, so the error leans toward a review.
- A review proves a fresh agent ran on the diff, not that the agent was any good, so the brief comes from a template.

Build the review gate first: it is the step skipped most, with the clearest evidence in the transcript. Then add the feedback gate on the same Stop hook, then the size measure and the plan gate together. **Land each gate with a test case built from a real session where the step was skipped.** Log every decision, and retire a gate, like any rule, if it stops catching anything for a quarter.

---

## Costs and failure modes

About half of all changes pay nothing; the rest pay a plan file and one review round, and the real risks are a threshold drawn in the wrong place and a gate noisy enough to be resented.

Take a full-path change from start to finish. It adds one plan, about a minute of agent time, most of it the impact script. It adds one review round of two or three fresh agents, a few minutes. When findings land, it adds a fix and a re-review. That is the review most teams already say they want and mostly don't get.

Thresholds drawn from history will misjudge some changes, and each misjudgement becomes a test case and a tuned number. A change split across two sessions is two smaller changes, which is why the carry file and the push gate exist.

Accept the holes the push gate backs up, log the rest, and tune from the log. **Let the gate speak to the session, so people see the review happen and not the hook that demanded it.**

---

## Cheat sheet

| Question | Answer |
|---|---|
| Why are written steps skipped? | A context file is guidance the model may judge inapplicable; only the harness binds |
| Does louder wording help? | No: Anthropic says emphasis doesn't fix it and makes the model over-apply rules |
| Strongest mechanism? | A gate at push; then a refusal before a tool runs; then a Stop block |
| Different model for review? | Not required; a fresh context is what the evidence supports |
| How to keep small tasks fast? | A script measures the change; about half of past commits fall under the line |
| Plan gate | Refuse the edit that crosses the line until a plan with a script-made impact list exists |
| Review gate | Block the end of a turn while an edit postdates the last fresh-agent review |
| Feedback gate | Block the end of reviewed work without a line on what goes back, and what stays open |
| Real-world match | Spotify: Stop hook with deterministic checks, then a judge; Stripe: code-defined steps, capped CI retries |
| Feedback loop in practice | Hashimoto and Vincent: every mistake becomes a rule line, a tool or a strengthened skill |
| Build order | Review gate, feedback gate, then size and plan |
| The hole you meet first | Writes the matcher doesn't see (shell edits, background jobs, other sessions) |

---

## The short version

A step written in `CLAUDE.md` is a guideline the model is allowed to judge inapplicable, and Anthropic's documentation says so. Only the harness binds: a hook that refuses an edit, a hook that won't let a turn end, a check that refuses a push. The research on instruction following explains why long sessions make it worse: hundreds of rules, many turns and compaction all wear prose down.

Other tools agree on the phases (plan, implement, verify, review) and mostly enforce them with prose, which is why their gates leak; the exceptions use the harness.

Nothing shows a reviewer needs a different model; what the evidence supports is a reviewer that never saw the implementer's reasoning. Practitioners at scale say the same: Spotify gates pull requests with a Stop hook, Stripe wraps agents in code-defined steps with a capped retry, and the people who improve over time write every mistake back into their rules or tools.

Keep your small changes fast by letting a script, not the agent, decide what is small. Above the line, use three gates: no edit until a plan exists with an impact list the code produced, no end of turn while an edit postdates the last independent review, and no end of reviewed work without saying what goes back and what stays open.

One toolkit has run exactly this since 28 October 2026; the gates held on their first run, and the work since has been teaching them to see writes they missed. The hook looks, so the agent is never asked.

---

## What to re-check later

Researched October 2026 (27 to 28 October) and updated on 2 November 2026; the memory-page point in [why written steps slip](#why-written-steps-slip) was added on 9 November 2026, when the series was assembled. Vendor mechanics were read from primary sources: Anthropic's Claude Code documentation (best practices, hooks, permission modes, local code review), GitHub Spec Kit's repository and templates, AWS Kiro's specs and hooks docs, the obra/superpowers repository, OpenAI's codex-plugin-cc and Codex docs, Cursor's rules and hooks docs, and Aider's and Cline's docs. Research papers were read at arXiv.

Re-checked in November 2026: the Claude Code hooks reference (the eight-continuation Stop cap, its reset on a tool call and `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` are as stated) and the Gloaguen et al. abstract (now version 3, 29 September 2026). The toolkit was read from its repository on 2 November 2026: `tools/claude-hooks/` (in use since 28 October), toolkit-standard §D 13 and `CLAUDE.md`.

- **The Stop-hook cap.** The eight-continuation cap, its reset on a tool call and `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` were re-checked on 2 November 2026; hook events change with most Claude Code releases.
- **A hook's deny in bypass modes.** Anthropic documents permission deny rules as holding in every mode; the same claim for a hook's deny was not found verbatim.
- **Self-preference.** Panickssery and colleagues (2024) were read through secondary sources only; the June 2026 preprint is one study of 85 cases.
- **No controlled study compares prose rules against hooks directly.** The case rests on vendor documentation and the mechanism.
- **The practitioner accounts** are paraphrased, with figures as each reported them; where an account was read through a summarising fetch it is paraphrased, not quoted. Two were left out: posts attributed to Boris Cherny (only secondary write-ups found) and Anthropic's "How Anthropic teams use Claude Code" (no failures reported).
- **The best-practices quotes** were checked verbatim on 28 October 2026. Some of the page's wording is paraphrased in the body to keep quotations short.
- **The toolkit's gates** run on one maintainer's machine, in use since 28 October 2026; the holes listed in [one toolkit's gates](#one-toolkits-gates) were open as of 2 November 2026.

---

## Sources

**Primary: Anthropic**

- [Claude Code best practices](https://code.claude.com/docs/en/best-practices). Deterministic and non-deterministic instructions, emphasis, verification rungs, fresh-subagent review; quotes checked verbatim 28 October 2026.
- [Claude Code hooks reference](https://code.claude.com/docs/en/hooks). Stop decisions, the eight-continuation cap, its reset and `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`; re-checked 2 November 2026.
- [Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide). Failing open, `stop_hook_active`.
- [Permission modes](https://code.claude.com/docs/en/permission-modes). Plan mode and where it is not enforced.
- [Local code review](https://code.claude.com/docs/en/code-review-local).
- [Claude Code memory](https://code.claude.com/docs/en/memory). `CLAUDE.md` and auto memory as context, not enforced configuration.
- [Anthropic Engineering, *Effective harnesses for long-running agents*](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), November 2025.

**Primary: other tools**

- [GitHub Spec Kit](https://github.com/github/spec-kit), its [implement command](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/implement.md) and [plan template](https://raw.githubusercontent.com/github/spec-kit/main/templates/plan-template.md).
- [Kiro specs](https://kiro.dev/docs/specs/) and [hooks](https://kiro.dev/docs/hooks/index).
- [obra/superpowers](https://github.com/obra/superpowers) and its [using-superpowers skill](https://raw.githubusercontent.com/obra/superpowers/main/skills/using-superpowers/SKILL.md).
- [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc).
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) and [Codex hooks](https://learn.chatgpt.com/docs/hooks).
- [Cursor rules](https://cursor.com/docs/context/rules) and [hooks](https://cursor.com/docs/hooks).
- [Aider lint and test](https://aider.chat/docs/usage/lint-test.html).
- [Cline hooks](https://docs.cline.bot/features/hooks) and the [v3.36 release post](https://cline.bot/blog/cline-v3-36-hooks).

**Research**

- Laban et al., [multi-turn conversation study](https://arxiv.org/abs/2505.06120), May 2025.
- [IFScale](https://arxiv.org/abs/2507.11538), July 2025.
- Gloaguen et al., [*Evaluating AGENTS.md*](https://arxiv.org/abs/2602.11988), version 3, 29 September 2026.
- [Self-preference in revision against a deterministic checker](https://arxiv.org/abs/2606.20093), June 2026.

**Practitioners (first-hand)**

- Kent Beck, [Augmented Coding: Beyond the Vibes](https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes), June 2025.
- Harper Reed, [My LLM codegen workflow atm](https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/), February 2025.
- Armin Ronacher, [Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/6/12/agentic-coding/), June 2025.
- Mitchell Hashimoto, [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey), February 2026.
- Jesse Vincent, [Superpowers](https://blog.fsck.com/2025/10/09/superpowers/), October 2025.
- Spotify Engineering, [Background coding agents: strong feedback loops (part 3)](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3), December 2025.
- Stripe, [Minions part 2](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2), February 2026.

**Toolkit (public repository, read 2 November 2026)**

- [`tools/claude-hooks/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/README.md): the hooks, the gates' first-run proof and the remaining holes.
- [`tools/claude-hooks/gates.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/gates.mjs): the plan, review, push and feedback gates, and the size thresholds; its `git log` for the first week's fixes.
- [`tools/claude-hooks/impact.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/impact.mjs): the impact list a plan carries.
- [`tools/claude-hooks/hooks.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/hooks.mjs): the informing hooks.
- [`standards/toolkit-standard.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/standards/toolkit-standard.md), §D 13: the loop's rule and its trigger column.
- [`CLAUDE.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/CLAUDE.md), *Every piece of work*, step 5.
- Toolkit commit history from 1 September to 28 October 2026 (293 commits), measured with `git log --numstat` on 28 October 2026.

**Cited but not resolved to a URL**

- Panickssery et al., 2024, on self-preference in LLM judges: read through secondary sources, not opened.

---

Part 6 of 9 in *The agent-ready design system*. Previous: [Part 5, What keeps an agent on a design system](what-keeps-an-agent-on-track.md). Next: [Part 7, Building whole screens with an agent](building-screens-with-an-agent.md).
