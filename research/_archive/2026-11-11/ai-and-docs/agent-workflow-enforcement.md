# Why agent rules need the harness

A step written in a context file is a suggestion the model is allowed to decline; only the harness (a hook that refuses, a check that blocks a push) makes a step happen every time. This piece makes that case from the vendors' own documentation, the research on instruction following, and the practitioners who run agents at scale, then reports what happened when a design-system toolkit moved its plan, review and feedback steps out of prose and into gates.

Part 6 of 9 in *The agent-ready design system*. Previous: [Part 5, What keeps an agent on a design system](what-keeps-an-agent-on-track.md) Next: [Part 7, Building whole screens with an agent](building-screens-with-an-agent.md)

---

## What this answers

- Why does a step written in `CLAUDE.md` feel optional to the agent?
- How do other tools make their phases mandatory, and which only look as if they do?
- What do practitioners who run agents at scale report?
- Which enforcement mechanisms hold, ranked?
- Does an independent review need a different model?
- How can the ceremony scale with the size of a change without asking the agent?
- What did one toolkit build, and what does it still miss?

Section 9 is the cheat sheet and section 10 the short version.

---

## 1. Why does a written step feel optional?

Because it is optional, by design. Claude Code treats `CLAUDE.md` as guidance the model weighs against everything else in front of it, and Anthropic says so. Only the harness (hooks, permission rules, tool restrictions) applies a rule regardless of what the model decides.

Anthropic's best-practices page divides instructions into two kinds. A prompt, a `CLAUDE.md` line or a skill is non-deterministic: the model reads it and decides. A hook, a permission rule or a managed setting is deterministic: "Claude Code applies this every time, no matter what the model decided to do." On the first kind it is blunt: "CLAUDE.md is for guidelines, and Claude is allowed to decide a guideline doesn't apply." It names the symptom a maintainer sees: "If you keep adding emphasis to a CLAUDE.md line and Claude still misses it, that's a sign the line belongs in a hook." Adding IMPORTANT "probably won't fix it", and emphasis "mostly makes Claude over-apply the rule". Its memory page says the same of both `CLAUDE.md` and the auto memory the agent writes for itself: they are treated as context, not enforced configuration, and anything that must be blocked belongs in a hook.

The mechanism is not mysterious. A model holds instructions, code it has read, tool output and its own reasoning in one context and weighs them together. A rule saying "finish with an independent review" competes with a strong local signal that the work is done: tests passed, the diff looks right, the user is waiting. When the rule loses, the model does not experience breaking a rule; it judges that the rule did not apply this time, which is exactly the latitude the documentation grants.

Three research findings explain why long sessions with many rules make this worse.

- **Many rules at once.** IFScale (July 2025) found the best frontier models at about 68 percent accuracy with 500 simultaneous instructions, biased toward instructions that appear earlier. A toolkit's context file, its standards and its memory together hold hundreds.
- **Long conversations.** Laban and colleagues (May 2025) found a 39 percent average drop from single-turn to multi-turn performance, mostly from unreliability: "when LLMs take a wrong turn in a conversation, they get lost and do not recover."
- **Context files cost more than they give.** The one controlled study of success found no general gain at over 20 percent more cost; both `AGENTS.md` studies are weighed in [Part 4, section 2](how-the-system-reaches-the-agent.md#2-do-agentsmd-files-help-and-what-belongs-in-one).

Compaction adds a fourth cause. When a long session is summarised to fit the window, a rule stated early survives as a paraphrase or not at all; Anthropic warns that a conversational boundary "can get lost when the conversation compacts", and superpowers re-injects its rules after compaction for that reason.

**What to do.** Stop treating a rule's wording as the lever. A step that must happen every time belongs in the harness; the prose keeps only what the agent needs to do the step well.

---

## 2. How do other tools make their phases mandatory?

Every serious workflow has the same phases (specify or plan, implement, verify, review), and almost all enforce them with prose. The ones that make a step mandatory do it with hooks, harness-enforced modes or CI, never with wording.

**Anthropic's own guidance** is explore, plan, code, commit. Plan mode is the harness version of "plan first": edits are blocked until the user approves the plan, with one documented hole (in an interactive terminal where bypass permissions are available, the model is only instructed not to edit). For verification the docs give four rungs from soft to hard: ask in the prompt; `/goal`, where a separate model checks a stated condition after every turn; a Stop hook that exits with code 2 so "the turn doesn't end until the typecheck passes or the block limit is reached"; and `/code-review`, which "reviews the diff in a fresh subagent that never saw your conversation". It asks for evidence over claims: "'All tests pass' on its own tells you very little."

**GitHub Spec Kit** runs constitution, specify, plan, tasks, implement. One gate is a script: implement fails without a tasks file. The rest are prose: the plan template's "GATE: Must pass before Phase 0" is a line the model fills in and nothing verifies.

**AWS Kiro** builds requirements, design and tasks into its editor with a review screen each; its "Quick Spec" mode runs "without approval gates". Its hooks can gate a tool call, as Claude Code's can.

**obra/superpowers** is the most complete process framework for Claude Code and the most instructive about limits: brainstorm, isolated worktree, a written plan in two-to-five-minute tasks, a fresh subagent per task with a two-stage review, test-first, a requested code review where "critical issues block progress", verification before completion. Every gate is prose, injected by a SessionStart hook and written at maximum volume ("YOU DO NOT HAVE A CHOICE"), with a table rebutting the excuses a model gives. Nothing blocks an edit or a stop, and its docs note that without re-injection "a long session that compacts can lose the bootstrap." It is the loud end of prose enforcement.

**OpenAI's codex-plugin-cc** puts Codex inside Claude Code as a reviewer; its optional review gate is a Stop hook in which, if Codex finds problems, "the stop is blocked so Claude can address them first", with the warning that this "can create a long-running Claude/Codex loop and may drain usage limits quickly."

**The rest converge.** Codex reads `AGENTS.md` up to 32 KiB and promises no compliance; its hooks can deny a call and are "a guardrail rather than a complete enforcement boundary". Cursor's "Enforce this rule" means only that the rule cannot be switched off; its Stop hook can continue the agent up to five times. Aider runs lint and tests after each edit but does not gate finishing. Cline's hooks can cancel a tool call; its task-complete hook only notifies.

**What to do.** Take the phases from Spec Kit and superpowers, which agree with each other and with Anthropic. Take the enforcement from the harness: a refusal before a tool runs and a block at the end of a turn are the two mechanisms every vendor documents as binding.

---

## 3. What do practitioners who run agents at scale report?

The failures are the same everywhere: the agent declares victory early, tampers with tests, or wanders past the task. The fixes that lasted moved out of the prompt into something the agent could not argue with, and the people who improve over time write each failure back into their rules or tools.

Eight first-hand accounts from 2025 and 2026, paraphrased, figures as reported:

- **Kent Beck** keeps a `plan.md` of tests and has the agent take the next one, red, green, refactor. His failures are the canonical list: loops, unrequested features, and an agent that "cheated" by disabling or deleting tests. His fix was closer steering by hand, which works for one expert watching one agent.
- **Harper Reed** has a model interview him into a `spec.md`, then a prompt plan of small test-first steps and a `todo.md`. The plan files are the only enforcement; he reports merge conflicts once a team is involved.
- **Armin Ronacher** lets the agent verify itself through Makefile targets, logs and a browser driver. When it started a dev server that was already running, he did not add a prompt line: he made the target refuse with an error. The guardrail went into the tool.
- **Mitchell Hashimoto** calls his practice harness engineering: every agent mistake becomes a line in `AGENTS.md` or a script with a line pointing to it. He names giving the agent a way to verify its work as the most reliable way to get it right first time.
- **Jesse Vincent**, building superpowers, found that quizzing subagents on skills proved little; pressure scenarios (an outage where delay costs money, a solution already built and tempting to keep) were what tested a rule, and each failure strengthened the skill that should have stopped it.
- **Anthropic Engineering**, on long-running agents: building everything at once ran out of context (fix: one feature per session); early victory (fix: a feature list where every item starts failing); "done" after unit tests alone (fix: end-to-end tests in a browser); edited tests (fix included a JSON checklist, overwritten less often than Markdown). Every fix is a structure, not a sentence.
- **Spotify** runs deterministic verifiers (format, build, test) in a Claude Code Stop hook before a pull request can open, then a model judge comparing the diff with the request, which vetoes about a quarter of sessions; the agent recovers about half the time. The worst failure it names is a pull request that passes CI and is functionally wrong.
- **Stripe's Minions** run inside code-defined blueprints alternating agent steps with deterministic ones, with a hard cap of two CI rounds before a human takes over, rules scoped per directory, and mandatory human review; more than 1,300 such pull requests merge a week.

Two accounts were left out: posts attributed to Boris Cherny (only secondary write-ups found) and Anthropic's "How Anthropic teams use Claude Code" (no failures reported).

Three patterns run through them. **Test tampering is the most reported failure**, and nobody fixed it with wording. **The lesson goes back into the system** (Hashimoto into `AGENTS.md` and scripts, Vincent into skills, Ronacher into the tool). **Independent review is rarely a gate**: only Vincent's per-task review, Spotify's judge and Stripe's human approval enforce one.

**What to do.** Copy what worked at scale: Spotify's Stop hook with deterministic checks first and a judgement second, Stripe's code-defined sequence with a capped retry, Hashimoto's rule that every mistake becomes a line or a tool. Do not copy what depended on one expert watching.

---

## 4. Which enforcement mechanisms hold?

From hardest to skip: a gate at push or merge, a refusal before a tool runs, a tool-restricted role, a Stop hook that will not let the turn end, a script inside a command, a model judging a condition, prose injected by a hook, plain prose. Each rung up costs friction, and each has a known hole.

1. **A gate at push or merge** (pre-push hook, required CI check, branch protection, human approval). Cannot be skipped without an explicit override. Its weakness is timing: it fires after the work is built, so it can refuse a missing review but cannot make a plan happen first.
2. **A refusal before a tool runs** (a PreToolUse hook that denies, a permission deny rule). The only moment that can force "plan before editing". Holes: tools the matcher does not see (a Bash `sed` edits a file the Edit matcher never sees), and command hooks that fail open when they crash. Anthropic documents permission deny rules as holding "in every permission mode, including auto and bypassPermissions"; the same claim for a hook's deny was not found verbatim.
3. **A tool-restricted role** (a reviewer allowed only Read, Grep and Glob; plan mode where enforced). Binds what the role can do, not whether it is used.
4. **A Stop hook that blocks the end of a turn.** Exit code 2 or `decision: "block"` sends the agent back to work. Claude Code applies "an 8-consecutive-continuation cap", and "the count of consecutive continuations resets each time Claude calls a tool"; `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` raises it. The hook must check `stop_hook_active`. For a review gate the cap is not a hole: an agent sent back to review calls tools, which resets the count.
5. **A script inside a command** (Spec Kit's prerequisite check). Binding only if the command is run.
6. **A model judging a condition** (`/goal`, a prompt hook, a cross-model review gate). Automatic, but a model decides.
7. **Prose injected by a hook** (superpowers' bootstrap). Always present, still advisory, can be lost at compaction.
8. **Plain prose**, with or without MUST. Advisory by every vendor's own statement, and weaker as rules multiply and sessions lengthen.

No controlled study compares prose rules against hooks directly. The case for hooks rests on the vendors' documentation and the mechanism: a hook runs as code outside the model, so the model's judgement never enters into it.

**What to do.** Use rung 2 for the plan, rung 4 for the review and the feedback loop, rung 1 as the backstop. Leave the rest of the rules at rungs 7 and 8, where they belong.

---

## 5. Does an independent review need a different model?

No evidence says it must. What the evidence and the vendors agree on is that the reviewer must not share the implementer's context: a fresh agent that sees the diff and not the reasoning.

The case for a different model rests on self-preference, documented for LLM judges in general (Panickssery and colleagues, 2024, read through secondary sources). A June 2026 preprint testing the closest setting (authors revising their own work against a deterministic checker) found self-preference "weak or absent": minus 5.1 percentage points, confidence interval minus 12.9 to plus 2.7, four models, 85 cases. No study found measures bug-catch rates for cross-model against same-model review; vendor claims for review bots are the vendors' own benchmarks.

Anthropic puts the weight on context: `/code-review` runs "in a fresh subagent that never saw your conversation. It isn't swayed by the reasoning that produced the code." It also warns that "a reviewer that's asked to find problems will always find something", which is why a review needs verified findings and a stopping rule.

**What to do.** Require a fresh-context review, not a second vendor. A different model is an option for high-stakes changes, at the cost of a second subscription and the loop risk its own README names.

---

## 6. How can the ceremony scale with the size of a change without asking the agent?

Measure the change, not the request. A script that reads what the session wrote can tell a one-line fix from a cross-repository change without asking the agent, and the gates fire only above a line.

Every framework above scales by asking someone to choose a mode: Kiro's "Quick Spec", superpowers' "1% chance" rule, Anthropic's advice to skip planning when "you could describe the diff in one sentence". Choosing is the problem: the agent that treats review as optional will also judge its change to be small. The decision has to be made by something that measures.

Where a change lands matters as much as its size. A two-line edit to a shared standard changes a rule every consumer reads; a two-line edit to one button does not. So the line is drawn on both: small and local is the fast path; large, or touching a shared rule or tool, is the full path. Run against one toolkit's history (293 commits from 1 September to 28 October 2026), a line of three files and 100 changed lines, bookkeeping files aside, with no file under `standards/` or `tools/shared/`, put exactly half the commits (147) on the fast path; fourteen changed more than 400 lines.

**What to do.** Two tiers, chosen by a script, never by the agent. The fast path keeps what already exists (a check at push); the full path adds the plan, review and feedback gates. Start the thresholds where the history puts them and tune from the gate's own log.

---

## 7. What did one toolkit build?

The design-system toolkit this piece was written for built the design above as `tools/claude-hooks/gates.mjs`, in use for every Claude Code session on its maintainer's machine since 28 October 2026. Four gates refuse; everything else still only informs. The gates check evidence in the session's own transcript, so the agent is never asked whether it did a step.

**Before.** In October the toolkit had moved its loop out of prose into four informing hooks (SessionStart hands over open items; PreToolUse hands over an area's rules beside the first edit there; Stop collects what a turn left open; UserPromptSubmit hands it over with the next message). They informed and refused nothing, by choice, after a blocking Stop hook printed on screen "on nearly every turn". The record showed what that cost: the two steps gated at push (the check and the commit trailers) held, the one gated at Stop (reply length) held, and the steps only written down were the ones the maintainer kept asking about. Of 293 commits since 1 September, 23 mentioned an independent review; on 28 October an agent asked whether it had reviewed its work answered "partly", three weeks after the rule was written down to make the question unnecessary.

**After.** The rule is toolkit-standard §D 13, "The loop runs for every piece of work, and no step of it is optional", and the gates are its trigger column:

| When | Gate | What clears it |
|---|---|---|
| The edit that makes the work full-size | Refused (PreToolUse) | A plan file with Before (the closing line of a check run the transcript shows came back), Goal, Impact (the output of `impact.mjs`, every reader of the touched files across the toolkit and its projects), Claims (what the result rests on, checked or only believed), Beyond scope, Budget and Review |
| The end of a turn that did full-size work | Blocked (Stop) | A review by fresh read-only agents (never a fork, never the implementer), after the checks, repeated until a round finds no new High; a small fix afterwards needs no second review |
| A push of a repository with unreviewed full-size work, or while a review runs | Refused (PreToolUse) | The review, reported |
| The end of reviewed work | Blocked (Stop) | A `Toolkit:` line (what goes back to the toolkit), an `Open:` line (what stays unfinished and why), and a `Docs:` line when a README describing the changed files was left alone |

Full-size is measured, never asked: three files or 100 lines written since the work began, or more than ten lines in a standard or shared tool (`FILES = 3`, `LINES = 100`, `WIDE_LINES = 10` in `gates.mjs`), counting what subagents write, what a script's own code writes (found on disk, beyond what the file held before), and unreviewed uncommitted work another session left in the same repository, carried for up to a week. Small work committed as it goes, about half of all commits, never meets a gate. The gates refuse in the session and nowhere else on screen, keeping the 15 October decision that the hooks speak to the session.

**What the first week showed.** The plan gate refused the work that built it until it had a plan, and the feedback gate caught its own bug on that first run; both are recorded as the gates' proof in the hooks' README. Most of the commits since are the gates being taught to see writes they had missed: an in-place `sed` whose file sits after a script, inside a subshell or in backticks; a background agent's edits in its own worktree, now counted when its branch merges. That is section 4's rung-2 hole (tools the matcher does not see) found in practice, one shape at a time.

**The holes that remain, as the README lists them.** A push from a terminal outside Claude Code, or quoted inside another shell, is not gated. A background shell command's writes land after its call ends and are not counted. A check run whose output went to a file, or was cut to a preview, is not seen. Another session writing the same repository during a shell call is counted as this session's (the error is toward a review). A review proves a fresh agent ran on the diff; it cannot prove the agent was any good, so the brief comes from a template.

**What to do.** Build the review gate first (the step skipped most, with the clearest evidence in the transcript), then the feedback gate on the same Stop hook, then the size measure and plan gate together. Land each with a test case built from a real session where the step was skipped, log every decision, and retire a gate, as any rule, if it stops catching anything for a quarter.

---

## 8. What does it cost, and what can still go wrong?

About half of all changes pay nothing. The rest pay a plan file and one review round, which most teams already say they want and mostly do not get. The real risks are a threshold drawn in the wrong place and a gate noisy enough to be resented.

A full-path change adds one plan (a minute of agent time, most of it the impact script), one review round of two or three fresh agents (a few minutes), and a fix-and-re-review loop when findings land. Noise is avoided by letting the gate speak to the session: the maintainer sees the review happen, not the hook that demanded it. Thresholds drawn from history will misjudge some changes; each misjudgement is a test case and a tuned number. A change split across two sessions is two smaller changes, which is why the carry file and the push gate exist.

**What to do.** Accept the holes the push gate backs up, log the rest, and tune from the log.

---

## 9. Cheat sheet

| Question | Answer |
|---|---|
| Why are written steps skipped? | A context file is guidance the model may judge inapplicable; only the harness binds |
| Does louder wording help? | No: Anthropic says emphasis does not fix it and makes the model over-apply rules |
| Strongest mechanism? | A gate at push; then a refusal before a tool runs; then a Stop block |
| Different model for review? | Not required; a fresh context is what the evidence supports |
| How to keep small tasks fast? | A script measures the change; about half of past commits fall under the line |
| Plan gate | Refuse the edit that crosses the line until a plan with a script-made impact list exists |
| Review gate | Block the end of a turn while an edit postdates the last fresh-agent review |
| Feedback gate | Block the end of reviewed work without a line on what goes back, and what stays open |
| Real-world match | Spotify: Stop hook with deterministic checks, then a judge; Stripe: code-defined steps, capped CI retries |
| Feedback loop in practice | Hashimoto and Vincent: every mistake becomes a rule line, a tool or a strengthened skill |
| Build order | Review gate, feedback gate, then size and plan |
| The hole met first | Writes the matcher does not see (shell edits, background jobs, other sessions) |

---

## 10. The short version

A step written in `CLAUDE.md` is a guideline the model is allowed to judge inapplicable, and Anthropic's documentation says so. Only the harness binds: a hook that refuses an edit, a hook that will not let a turn end, a check that refuses a push. The research on instruction following explains why long sessions make this worse: hundreds of rules, many turns and compaction all erode prose.

Other tools agree on the phases (plan, implement, verify, review) and mostly enforce them with prose, which is why their gates leak. The exceptions use the harness. A different model as reviewer is not supported by evidence as necessary; a reviewer that never saw the implementer's reasoning is. Practitioners at scale report the same: Spotify gates pull requests with a Stop hook, Stripe wraps agents in code-defined steps with a capped retry, and the individuals who improve over time write every mistake back into their rules or tools.

Keep small changes fast by letting a script, not the agent, decide what is small. Above the line, three gates: no edit until a plan exists with an impact list the code produced, no end of turn while an edit postdates the last independent review, no end of reviewed work without saying what goes back and what stays open. One toolkit has run exactly this since 28 October 2026; the gates held on their first run, and the work since has been teaching them to see writes they missed. The hook looks, so the agent is never asked.

---

## 11. What to re-check later

Researched October 2026 (27 to 28 October) and updated on 2 November 2026; the memory-page point in section 1 was added on 9 November 2026 when the series was assembled. Vendor mechanics were read from primary sources: Anthropic's Claude Code documentation (best practices, hooks, permission modes, local code review), GitHub Spec Kit's repository and templates, AWS Kiro's specs and hooks docs, the obra/superpowers repository, OpenAI's codex-plugin-cc and Codex docs, Cursor's rules and hooks docs, and Aider's and Cline's docs. Research papers were read at arXiv. Re-checked in November 2026: the Claude Code hooks reference (the eight-continuation Stop cap, its reset on a tool call and `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` are as stated); the Gloaguen et al. abstract (now version 3, 29 September 2026). The toolkit was read from its repository on 2 November 2026: `tools/claude-hooks/` (in use since 28 October), toolkit-standard §D 13 and `CLAUDE.md`. Where a practitioner account was read through a summarising fetch it is paraphrased, not quoted.

- **The Stop-hook cap.** The eight-continuation cap, its reset on a tool call and `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` were re-checked on 2 November 2026; hook events change with most Claude Code releases.
- **A hook's deny in bypass modes.** Anthropic documents permission deny rules as holding in every mode; the same claim for a hook's deny was not found verbatim.
- **Self-preference.** Panickssery and colleagues (2024) were read through secondary sources only; the June 2026 preprint is one study of 85 cases.
- **No controlled study compares prose rules against hooks directly.** The case rests on vendor documentation and the mechanism.
- **The toolkit's gates** are one maintainer's machine, in use since 28 October 2026; the holes listed in section 7 were open as of 2 November 2026.

---

## Sources

### Primary: Anthropic

- [Claude Code best practices](https://code.claude.com/docs/en/best-practices). Deterministic and non-deterministic instructions, emphasis, verification rungs, fresh-subagent review; quotes checked verbatim 28 October 2026.
- [Claude Code hooks reference](https://code.claude.com/docs/en/hooks). Stop decisions, the eight-continuation cap, its reset and `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`; re-checked 2 November 2026.
- [Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide). Failing open, `stop_hook_active`.
- [Permission modes](https://code.claude.com/docs/en/permission-modes). Plan mode and where it is not enforced.
- [Local code review](https://code.claude.com/docs/en/code-review-local).
- [Claude Code memory](https://code.claude.com/docs/en/memory). `CLAUDE.md` and auto memory as context, not enforced configuration.
- [Anthropic Engineering, *Effective harnesses for long-running agents*](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), November 2025.

### Primary: other tools

- [GitHub Spec Kit](https://github.com/github/spec-kit), its [implement command](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/implement.md) and [plan template](https://raw.githubusercontent.com/github/spec-kit/main/templates/plan-template.md).
- [Kiro specs](https://kiro.dev/docs/specs/) and [hooks](https://kiro.dev/docs/hooks/index).
- [obra/superpowers](https://github.com/obra/superpowers) and its [using-superpowers skill](https://raw.githubusercontent.com/obra/superpowers/main/skills/using-superpowers/SKILL.md).
- [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc).
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) and [Codex hooks](https://learn.chatgpt.com/docs/hooks).
- [Cursor rules](https://cursor.com/docs/context/rules) and [hooks](https://cursor.com/docs/hooks).
- [Aider lint and test](https://aider.chat/docs/usage/lint-test.html).
- [Cline hooks](https://docs.cline.bot/features/hooks) and the [v3.36 release post](https://cline.bot/blog/cline-v3-36-hooks).

### Research

- Laban et al., [multi-turn conversation study](https://arxiv.org/abs/2505.06120), May 2025.
- [IFScale](https://arxiv.org/abs/2507.11538), July 2025.
- Gloaguen et al., [*Evaluating AGENTS.md*](https://arxiv.org/abs/2602.11988), version 3, 29 September 2026.
- [Self-preference in revision against a deterministic checker](https://arxiv.org/abs/2606.20093), June 2026.
- Panickssery et al., 2024, on self-preference in LLM judges: read through secondary sources, not opened.

### Practitioners (first-hand)

- Kent Beck, [Augmented Coding: Beyond the Vibes](https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes), June 2025.
- Harper Reed, [My LLM codegen workflow atm](https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/), February 2025.
- Armin Ronacher, [Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/6/12/agentic-coding/), June 2025.
- Mitchell Hashimoto, [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey), February 2026.
- Jesse Vincent, [Superpowers](https://blog.fsck.com/2025/10/09/superpowers/), October 2025.
- Spotify Engineering, [Background coding agents: strong feedback loops (part 3)](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3), December 2025.
- Stripe, [Minions part 2](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2), February 2026.

### Toolkit (public repository, read 2 November 2026)

- [`tools/claude-hooks/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/README.md): the hooks, the gates' first-run proof and the remaining holes.
- [`tools/claude-hooks/gates.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/gates.mjs): the plan, review, push and feedback gates, and the size thresholds; its `git log` for the first week's fixes.
- [`tools/claude-hooks/impact.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/impact.mjs): the impact list a plan carries.
- [`tools/claude-hooks/hooks.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/hooks.mjs): the informing hooks.
- [`standards/toolkit-standard.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/standards/toolkit-standard.md), §D 13: the loop's rule and its trigger column.
- [`CLAUDE.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/CLAUDE.md), *Every piece of work*, step 5.
- Toolkit commit history from 1 September to 28 October 2026 (293 commits), measured with `git log --numstat` on 28 October 2026.
