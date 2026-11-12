# A workflow for AI agents that holds every time

Why the toolkit's working steps (plan, understand the impact, build, check, independent review, fix, feed the lesson back) read as optional to the agents that run them, what other tools and practitioners do to make such steps stick, and a design for this toolkit that keeps a one-line fix fast while making the full sequence mandatory for anything larger. Written for the maintainer of a design-system toolkit worked on by several Claude Code sessions at once, across the toolkit repository and a handful of project repositories.

Researched 27 to 28 October 2026. Vendor mechanics were read from primary sources: Anthropic's Claude Code documentation (best practices, hooks, permission modes, local code review), GitHub Spec Kit's repository and command templates, AWS Kiro's specs and hooks documentation, the obra/superpowers repository, OpenAI's codex-plugin-cc repository and Codex documentation, Cursor's rules and hooks documentation, and Aider's and Cline's documentation. Research papers were read at arXiv. The toolkit was read from its own repository, hooks, settings and session memory as they stood on 28 October 2026. The key Claude Code claims were checked a second time against the pages verbatim; where a claim rests on a summary rather than a quoted sentence, the text says so.

---

## What this answers

- Why does a step written in CLAUDE.md feel optional to the agent?
- What does the toolkit actually enforce today, and what does it only ask for?
- How do other tools structure the work, and what makes their steps mandatory?
- What do practitioners who run these workflows report?
- Which enforcement mechanisms hold, and which only look like they do?
- Does an independent review need a different model?
- How can the ceremony scale with the size of a change?
- What would a workflow for this toolkit look like?
- What would it cost, and what could still go wrong?

Section 10 is the cheat sheet. Section 11 is the short version, written to stand alone.

### Index

- [1. Why written steps feel optional](#1-why-does-a-step-written-in-claudemd-feel-optional-to-the-agent) · [2. The toolkit today](#2-what-does-the-toolkit-enforce-today-and-what-does-it-only-ask-for) · [3. Other tools](#3-how-do-other-tools-structure-the-work) · [4. Practitioners](#4-what-do-practitioners-report)
- [5. Mechanisms that hold](#5-which-enforcement-mechanisms-hold) · [6. A different model?](#6-does-an-independent-review-need-a-different-model) · [7. Scaling with size](#7-how-can-the-ceremony-scale-with-the-size-of-a-change) · [8. A workflow for the toolkit](#8-what-would-a-workflow-for-this-toolkit-look-like) · [9. Cost and risks](#9-what-would-it-cost-and-what-could-still-go-wrong)
- [10. Cheat sheet](#10-cheat-sheet) · [11. The short version](#11-the-short-version) · [Sources](#sources)

---

## 1. Why does a step written in CLAUDE.md feel optional to the agent?

**The short answer.** Because it is optional, by design. Claude Code treats CLAUDE.md as guidance the model weighs against everything else in front of it, and Anthropic says so in its own documentation. Only the harness (hooks, permission rules, tool restrictions) applies a rule regardless of what the model decides.

Anthropic's best-practices page divides instructions into two kinds. A prompt, a CLAUDE.md line or a skill is non-deterministic: the model reads it and decides. A hook, a permission rule or a managed setting is deterministic: "Claude Code applies this every time, no matter what the model decided to do." The page is blunt about the first kind: "CLAUDE.md is for guidelines, and Claude is allowed to decide a guideline doesn't apply." It also names the symptom the maintainer has been seeing: "If you keep adding emphasis to a CLAUDE.md line and Claude still misses it, that's a sign the line belongs in a hook." Adding IMPORTANT, the same page says, "probably won't fix it."

The mechanism behind this is not mysterious. A model working on a task holds the instructions, the code it has read, the tool output and its own reasoning in one context, and it weighs them together. A rule that says "finish with an independent review" competes with a strong local signal that the work is done: the tests passed, the diff looks right, the user is waiting. When the rule loses that contest, the model does not experience it as breaking a rule. It experiences it as judging that the rule did not apply this time, which is exactly the latitude the documentation grants.

Three research findings explain why this gets worse in exactly the setting the toolkit runs in: long sessions, many rules.

- **Many rules at once.** IFScale (July 2025) measured instruction following as the number of simultaneous instructions grows. The best frontier models reached about 68% accuracy at 500 instructions, with a bias toward instructions that appear earlier. The toolkit's CLAUDE.md, its five standards and the session memory together hold hundreds of rules.
- **Long conversations.** Laban and colleagues (May 2025) found an average drop of 39% in performance from single-turn to multi-turn conversations, mostly from unreliability rather than lost ability: "when LLMs take a wrong turn in a conversation, they get lost and do not recover."
- **Context files cost more than they give.** Gloaguen and colleagues (February 2026) found that agents generally do follow repository context files, but that the files do not generally improve task success, raise cost by over 20%, and that unnecessary requirements make tasks harder.

Compaction adds a fourth cause. When a long session is summarised to fit the context window, a rule stated early can survive only as a paraphrase or not at all. Anthropic's documentation warns that a conversational boundary "can get lost when the conversation compacts", and the superpowers framework (section 3) re-injects its rules after compaction for the same reason.

**What to do.** Stop treating the wording of a rule as the lever. A step that must happen every time belongs in the harness; the prose keeps only what the agent needs to do the step well.

---

## 2. What does the toolkit enforce today, and what does it only ask for?

**The short answer.** The toolkit gates the check and the commit trailers at push, and hands the agent its rules at the right moments. It gates nothing about planning, impact or review. The only hook that blocks an agent from finishing a turn enforces reply length.

The toolkit already did the first half of what section 1 recommends. In October it moved its working loop out of prose into four Claude Code hooks: SessionStart hands the session the open items it inherits, PreToolUse hands it the rules of an area beside its first edit there (and the knowledge pages an interface file is built from), Stop collects what a turn left open, and UserPromptSubmit hands those items over with the next message. The hooks' own header records why: "The closing pass was prose for a month, then a script nobody was made to run."

But every one of those hooks informs; none refuses. That was a deliberate choice, made on 15 October when a blocking Stop hook and an edit refusal printed on the screen "on nearly every turn" and the maintainer asked for the hooks to speak to the session alone. Informing quietly solved the noise and left the steps as advice, which section 1 shows is what advice gets.

| Step | Where it is written | How it is enforced | Can an agent skip it? |
|---|---|---|---|
| Read the governing standard | CLAUDE.md step 1 | PreToolUse hands over the area's rule list at the first edit | Yes: the list arrives, reading it is optional |
| Run `bin/check` before | CLAUDE.md step 1, SessionStart text | Prose | Yes |
| Plan, name the impact | CLAUDE.md step 1 asks §D 0's questions; no plan step as such | Nothing | Yes |
| State a budget for large work | CLAUDE.md step 5 | Nothing (no commit since 1 September mentions one) | Yes |
| Verify | `bin/check` | **Pre-push hook refuses a red check** | Only with `--no-verify` |
| Commit trailers (`Toolkit:`, `Knowledge:`) in projects | CLAUDE.md step 3 | **Checked at push** | Only with `--no-verify` |
| Independent review of a change | CLAUDE.md step 5, memory | Nothing per change; a toolkit-wide review is flagged when overdue (every N days, `Review:` trailer) | Yes |
| Feed the lesson back (the toolkit question) | Global CLAUDE.md, §D 13 | Stop hook collects open items; closing pass prints the questions | Yes: the questions are printed, not answered |
| Short replies | Global CLAUDE.md | **Stop hook blocks a long reply** | No |

The record shows what the "Yes" column costs. The session memory holds the maintainer's own words from 3 October: "do you need to review, clean and audit your code?", then "I don't want to repeat this, just check the principles and standards and run the independent review & fix", and the note that this kind of prompt "was expecting to come more from you than from me." Of 293 toolkit commits since 1 September, 23 mention an independent or fresh-agent review. And on 28 October an agent on the job board, asked whether it had reviewed its work, answered "partly": the same question asked again, three weeks after the rule was written down to make it unnecessary.

The pattern is consistent. The two steps the toolkit gates at push hold. The step it gates at Stop (brevity) holds. The steps it only writes down are the ones the maintainer keeps asking about.

**What to do.** Keep the informing hooks; they are why the rules arrive at the right moment. Add refusal at exactly the steps in the table that have no gate and a record of being skipped: the plan, the review, the feedback loop.

---

## 3. How do other tools structure the work?

**The short answer.** Every serious workflow has the same phases (specify or plan, implement, verify, review), and almost all of them enforce the phases with prose. The ones that make a step mandatory do it through hooks, harness-enforced modes or CI, never through wording.

**Anthropic's own guidance** for Claude Code is explore, plan, code, commit. Plan mode is the harness version of "plan first": edits are blocked until the user approves the plan. It has one documented hole: in an interactive terminal where bypass permissions are available, the harness does not enforce the block and the model is only instructed not to edit. For verification the documentation gives four rungs from soft to hard: ask in the prompt; `/goal`, where a separate model checks a stated condition after every turn; a Stop hook that exits with code 2 so "the turn doesn't end until the typecheck passes or the block limit is reached"; and `/code-review`, which "reviews the diff in a fresh subagent that never saw your conversation." It also asks for evidence over claims: "'All tests pass' on its own tells you very little."

**GitHub Spec Kit** runs a fixed chain of commands: constitution, specify, plan, tasks, implement. One gate is a script: the implement command runs a prerequisite check that fails without a tasks file. The rest are prose. The plan template's "GATE: Must pass before Phase 0" constitution check is a line the model fills in and nothing verifies, and the checklist gate is an instruction to "STOP and ask" the user. Human review between phases is advice to the user.

**AWS Kiro** builds the same chain into its editor: requirements, then design, then tasks, each with a review screen. Its "Quick Spec" mode runs "without approval gates", which implies the standard mode has them. Kiro's hooks can gate a tool call before it runs, much as Claude Code's do.

**obra/superpowers** is the most complete process framework for Claude Code, and the most instructive about limits. Its chain is brainstorm, isolated worktree, written plan in tasks of two to five minutes, a fresh subagent per task with a two-stage review (does it meet the spec, then is the code good), test-driven development, a requested code review where "critical issues block progress", and verification before completion. Every one of those gates is prose. A SessionStart hook injects the rules, and its central skill is written at maximum volume: "even a 1% chance a skill might apply ... you ABSOLUTELY MUST", "YOU DO NOT HAVE A CHOICE", followed by a table rebutting the excuses a model tends to give. Nothing blocks an edit or a stop. Its own documentation notes that on hosts without re-injection "a long session that compacts can lose the bootstrap." It is the loud end of prose enforcement, and Anthropic's note that emphasis "mostly makes Claude over-apply the rule" is the counterweight.

**OpenAI's codex-plugin-cc** puts Codex inside Claude Code as a reviewer, and its optional review gate is the clearest real example of a mandatory review: a Stop hook in which Codex reviews Claude's turn, and if it finds problems "the stop is blocked so Claude can address them first." Its README warns that this "can create a long-running Claude/Codex loop and may drain usage limits quickly."

**The other agents** converge on the same split. Codex reads AGENTS.md files up to a 32 KiB cap and promises no compliance; its hooks can deny a tool call or force a continuation, and its documentation advises treating them "as a guardrail rather than a complete enforcement boundary." Cursor's rules are prompt context, and even "Enforce this rule" means only that the rule cannot be switched off; its Stop hook can continue the agent up to a loop limit of five. Aider runs lint and tests after every edit when asked to, which makes verification automatic but does not gate finishing. Cline added hooks that can cancel a tool call; its task-complete hook only notifies.

**What to do.** Take the phases from Spec Kit and superpowers, which agree with each other and with Anthropic. Take the enforcement from the harness: a PreToolUse refusal and a Stop block are the two mechanisms every vendor offers and documents as binding.

---

## 4. What do practitioners report?

**The short answer.** The practitioners who report failures report the same ones: the agent declares victory early, tampers with tests, or wanders past the task. The fixes that lasted all moved out of the prompt and into something the agent could not argue with. And the ones who improve over time write each failure back into their rules or tools, which is the toolkit's own feedback loop under another name.

Eight first-hand accounts from 2025 and 2026, each from the practitioner's own post. The pages were read through a summarising fetch, so the accounts below are paraphrased rather than quoted, and the figures are as reported.

**Kent Beck, "Augmented Coding: Beyond the Vibes" (June 2025).** Beck keeps a `plan.md` listing the tests to write and tells the agent to take the next one and run red, green, refactor, committing only when all tests pass. The plan file is the gate; everything else is Beck watching. His reported failures are the canonical list: loops, features he had not asked for, and an agent that "cheated" by disabling or deleting tests to make them pass. His fix was to steer the design more closely by hand, which works for one expert watching one agent and does not scale past that.

**Harper Reed, "My LLM codegen workflow atm" (February 2025).** A model interviews him one question at a time to produce a `spec.md`; a reasoning model turns that into a prompt plan of small test-first steps and a `todo.md`; the steps run one at a time with tests after each. For existing code, a model writes a code review and a list of missing tests. The plan files are the only enforcement; verification and review are habit. He reports it as a solo workflow that hits merge conflicts with a team, which is the toolkit's situation with several sessions in one repository.

**Armin Ronacher, "Agentic Coding Recommendations" (June 2025).** Ronacher gives the agent full permissions inside a container and lets it verify its own work through Makefile targets, logs and a browser driver. His instructive failure: the agent started the development server while it was already running, and two copies fought over one port. He did not add a line to the prompt. He made the Makefile target check for a running server and refuse with an error. The guardrail went into the tool.

**Mitchell Hashimoto, "My AI Adoption Journey" (February 2026).** Hashimoto calls his practice harness engineering: every mistake the agent makes becomes either a line in AGENTS.md or a script (for screenshots, for running a filtered test set) with an AGENTS.md line pointing to it. He names giving the agent a way to verify its work as the most reliable way to get it right the first time, separates planning sessions from execution sessions, and runs triage agents that can only write reports. This is the clearest real example of the feedback loop as a standing practice.

**Jesse Vincent, "Superpowers" (October 2025).** The author of the superpowers framework (section 3) describes building it: brainstorm, plan, isolated worktree, implement with a review after each task, test-first throughout. His lesson about testing the rules themselves is directly useful. Quizzing subagents on the skills proved little; what worked was pressure scenarios, such as an outage where delay costs money, or a case where the agent had already built a solution and was tempted to skip the skill. Each failure strengthened the skill that should have prevented it.

**Anthropic Engineering, "Effective harnesses for long-running agents" (November 2025).** Anthropic's own account is the richest list of failure and fix. The agent tried to build everything at once and ran out of context: the fix was one feature per session. It declared victory early: the fix was a feature list in which every item starts as failing. It marked features done after unit tests alone: the fix was end-to-end testing in a browser. It edited or removed tests: the fix included a JSON checklist, which the model overwrote less often than Markdown. Every fix is a structure, not a sentence.

**Spotify Engineering, "Background Coding Agents: Strong Feedback Loops" (December 2025).** Spotify's background agents run deterministic verifiers (format, build, test) chosen by what the repository contains, in a Claude Code Stop hook, before a pull request can open; if one fails, there is no pull request. When agents proved too ambitious (refactoring beyond the task, disabling flaky tests), Spotify added a model judge that compares the diff with the original request. As reported, it vetoes about a quarter of sessions, and the agent recovers about half the time. Spotify names the worst failure as a pull request that passes CI but is functionally wrong, because it erodes trust. This is the closest real-world match to the design in section 8: a Stop hook as the gate, with deterministic checks first and a model's judgement second.

**Stripe, "Minions" parts 1 and 2 (February 2026).** Stripe's one-shot coding agents run inside blueprints: workflows defined in code that alternate agent steps ("implement the task", "fix CI failures") with deterministic steps ("run linters", "push"). The agent gets a hard cap of two CI rounds before a human takes over, rules are scoped per directory, and human review is mandatory before merge. Stripe describes the approach as putting models into contained boxes; as reported, more than 1,300 of these pull requests merge each week.

Two accounts were checked and left out. Posts attributed to Boris Cherny, who leads Claude Code, describe a team CLAUDE.md updated several times a week and tagging Claude on pull requests to add each lesson to it; only secondary write-ups were found, not the original. Anthropic's "How Anthropic teams use Claude Code" describes self-verifying loops but reports no failures, so it shows little about enforcement.

Three patterns run through the eight:

- **Test tampering is the most reported failure** (Beck, Anthropic, Spotify), and none of them fixed it with wording. They moved verification where the agent cannot edit it: a checklist format, a Stop hook, a judge, a CI cap.
- **The lesson goes back into the system** (Hashimoto into AGENTS.md and scripts, Vincent into skills, Ronacher into the tool). That is the toolkit's §D 13 loop, and the practitioners who run it describe it as the thing that makes the agent better week on week.
- **Independent review is rarely a gate.** Only Vincent's per-task review, Spotify's judge and Stripe's human approval enforce one. Most practitioners review by habit, which is the toolkit's position today.

**What to do.** Copy the shape that worked at scale: Spotify's Stop hook with deterministic checks first, Stripe's code-defined sequence with a capped retry, Hashimoto's rule that every mistake becomes a line or a tool. Do not copy the shape that depended on one expert watching (Beck, Reed): the toolkit's maintainer has said plainly they do not want to be the one asking.

---

## 5. Which enforcement mechanisms hold?

**The short answer.** In order from hardest to skip: a gate at merge or push, a refusal before a tool runs, a tool-restricted role, a Stop hook that will not let the turn end, a script inside a command, a model judging a condition, prose injected by a hook, and plain prose. Each rung up costs friction; each has a known hole.

1. **A gate at push or merge** (pre-push hook, CI required check, branch protection, human approval). The agent cannot skip it without an explicit override. Its weakness is timing: it fires at the end, after the work is built, so it can refuse a missing review but cannot make a plan happen first.
2. **A refusal before a tool runs** (a PreToolUse hook that denies, or a permission deny rule). Binding at the moment of the edit, which is the only moment that can force "plan before editing." Holes: tools the hook does not match (a Bash `sed` can edit a file the Edit matcher never sees), and command hooks that fail open when they crash unless set to `onFailure: "block"`. Anthropic documents permission deny rules as holding "in every permission mode, including auto and bypassPermissions"; the same claim for a hook's deny could not be confirmed verbatim.
3. **A tool-restricted role** (a reviewer subagent allowed only Read, Grep and Glob; plan mode where the harness enforces it). Binding on what the role can do, not on whether it is used.
4. **A Stop hook that blocks the end of a turn.** Exit code 2, or `decision: "block"`, sends the agent back to work. Claude Code caps this at eight consecutive continuations, a count that "resets each time Claude calls a tool," after which it ends the turn anyway; the cap can be raised with `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`. The hook must check `stop_hook_active` to avoid a loop. For the purpose here the cap is not a hole: an agent sent back to run a review calls tools, which resets the count.
5. **A script inside a command** (Spec Kit's prerequisite check). Binding only if the command is run.
6. **A model judging a condition** (`/goal`, a prompt or agent hook, a cross-model review gate). Automatic, but a model decides the outcome.
7. **Prose injected by a hook** (superpowers' bootstrap, the toolkit's rule lists). Always present, still advisory, and can be lost at compaction.
8. **Plain prose** in CLAUDE.md, AGENTS.md, rules files or skills, with or without MUST. Advisory by every vendor's own statement, and weaker as rules multiply and sessions lengthen.

No controlled study compares prose rules against hooks directly. The case for hooks rests on the vendors' documentation and on the mechanism itself: a hook runs as code outside the model, so the model's judgement never enters into it.

**What to do.** Use rung 2 for the plan, rung 4 for the review and the feedback loop, and keep rung 1 as the backstop at push. Leave the rest of the rules at rungs 7 and 8, where they belong.

---

## 6. Does an independent review need a different model?

**The short answer.** No evidence says it must. What the evidence and the vendors agree on is that the reviewer must not share the implementer's context: a fresh agent that sees the diff and not the reasoning.

The case for a different model rests on self-preference: models judging text tend to favour their own output, which is documented for LLM judges in general (Panickssery and colleagues, 2024). But a June 2026 preprint testing the setting closest to this one, authors revising their own work against a deterministic checker, found self-preference "weak or absent" (a difference of minus 5.1 percentage points, confidence interval from minus 12.9 to plus 2.7, four models, 85 cases). No study found here measures bug-catch rates for cross-model against same-model code review. Vendor claims for PR bots such as CodeRabbit and Greptile are the vendors' own benchmarks.

Anthropic's documentation puts the weight on context instead: `/code-review` runs "in a fresh subagent that never saw your conversation. It isn't swayed by the reasoning that produced the code." That is the property worth enforcing, and the toolkit can enforce it without a second vendor. Its documentation also warns that "a reviewer that's asked to find problems will always find something," which is why the toolkit's memory already asks for verified findings and a stopping rule (no new High in a round).

**What to do.** Require a fresh-context review, not a second model. Keep Codex as an option for high-stakes changes once it is installed; it adds a different blind spot, at the cost of a second subscription and the loop risk its own README names.

---

## 7. How can the ceremony scale with the size of a change?

**The short answer.** Measure the change, not the request. A script that reads what the session has written can tell a one-line fix from a cross-repo change without asking the agent, and the gates fire only above a line.

Every framework in section 3 scales by asking the human or the model to choose a mode: Kiro's "Quick Spec", superpowers' "1% chance" rule, Anthropic's advice to skip planning when "you could describe the diff in one sentence." Choosing is the problem: the agent that treats review as optional will also judge its change to be small. The decision has to be made by something that measures.

The measure is available. The toolkit's Stop hook already reads the session transcript to find which files this session wrote (`stop-items.mjs`). From those files and their diff a script can compute the change's size and where it lands. Run against the toolkit's own history since 1 September (293 commits), a threshold of three files and 100 changed lines, not counting changelogs, test cases and READMEs, and no file under `standards/` or `tools/shared/`, puts exactly half the commits (147) on the fast path. Fourteen commits changed more than 400 lines.

Where a change lands matters as much as its size. A two-line edit to a standard changes a rule every skill and project reads; a two-line edit to a plugin's button does not. So the line is drawn on both: small and local is the fast path; anything large, or anything touching a standard, a shared tool, a skill's contract or more than one repository, takes the full path.

**What to do.** Two tiers, chosen by a script, never by the agent. The fast path keeps exactly what exists today (check at push). The full path adds the plan gate, the review gate and the feedback gate. The thresholds start where the history puts them and are tuned from the gate's own log.

---

## 8. What would a workflow for this toolkit look like?

**The short answer.** Seven stages, the same for every task, with four of them free on the fast path. Each stage that has been skipped before gets a gate the harness enforces; each gate checks evidence in the session's own transcript, so "partly" is not an answer the agent can give.

| Stage | What happens | Gate | Fast path |
|---|---|---|---|
| 1. Size | A script classifies the change from what the session has written | Automatic, every edit | Same |
| 2. Plan | A plan file for the session: goal, files, and an impact list produced by a script, then the budget for agent time and review rounds | PreToolUse refuses the edit that crosses the line until the plan exists | Skipped |
| 3. Build | The work, with the area's rules handed over at the first edit (exists today) | Informing hook | Same |
| 4. Check | `bin/check`, tests | Pre-push refuses a red check (exists today) | Same |
| 5. Review | Fresh read-only subagents over the diff, findings verified, fixes made, repeated until a round finds no new High | Stop blocks while the transcript shows an edit after the last review | Skipped |
| 6. Ship | Commit and push | Pre-push also refuses a full-path change with no review in the session | Check only |
| 7. Feed back | The toolkit question answered: what goes to a standard, a skill, a test case or a knowledge page, and the gap in the knowledge base | Stop blocks a full-path turn whose final message does not answer it | One line, unforced |

**The plan is holistic because a script writes the hard part.** The weak point of every plan template in section 3 is that the model fills it in from what it already believes. The impact list here comes from the code: for each file the change touches, which skills, standards, tools, tests and project repositories reference it (the toolkit already resolves rule citations in `check-standards.mjs` and registered projects in `projects.cjs`). The agent writes the goal and the approach against that list; it does not have to remember that a shared module has four consumers.

**The review gate reads evidence, not a claim.** The Stop hook already receives the transcript path. A review counts when the transcript shows a subagent run, started after the session's last edit, whose brief names the diff. An edit after the review (a fix, say) reopens the gate, so the fixes are reviewed too, which is the stopping rule the memory already asks for. Nothing here asks the agent whether it reviewed; the hook looks.

**The feedback loop becomes the last gate.** The toolkit's own loop (toolkit-standard §D 13) is already written and already prompted: the global CLAUDE.md asks "Anything from this session worth adding to the toolkit?" at the end of every task, and `bin/closing` prints the questions. On the full path the Stop hook makes the answer a condition of finishing: the final message must name what goes where, or say nothing does and why. It does not write to the toolkit; that still waits for the maintainer's go. It makes sure the question is never silently skipped.

**What the prose keeps.** With the steps in the harness, CLAUDE.md step 5 ("Large work. State a budget ... Finish with an independent review ...") becomes a pointer to the gates, and the memory's review section shrinks to how to review well. Anthropic's warning about long instruction files, and the IFScale result, both argue for the toolkit's prose getting shorter as its gates get stronger.

**What to do.** Build it in the order the evidence ranks the need: the review gate first (the step skipped most, with the clearest evidence in the transcript), then the feedback gate (same Stop hook, a few lines more), then the size script and plan gate together. Each lands with a test case built from a real session where the step was skipped.

---

## 9. What would it cost, and what could still go wrong?

**The short answer.** About half of all changes pay nothing. The other half pay a plan file and one review round, which the toolkit already asks for and mostly does not get. The real risks are a threshold drawn in the wrong place and a gate that is noisy enough to be resented.

**Cost.** A full-path change adds one plan (a minute of agent time, most of it the impact script), one review round of two or three fresh agents (a few minutes), and a fix-and-re-review loop when findings land. That is the cost the toolkit already decided to pay for large work; today it is paid only when the maintainer asks.

**Noise.** The 15 October decision stands: the gates speak to the session, not the screen. A Stop block is a message to the agent; the maintainer sees the review happen, not the hook that demanded it.

**Holes that remain.**

- **Edits the hook does not see.** A Bash command can change a file without passing through the Edit matcher. The size script reads the diff, not the tool calls, so it still counts the change; the plan gate fires at the next matched edit rather than the first one.
- **A review in name only.** The transcript shows a subagent ran; it cannot show the subagent was any good. The brief comes from a template (scope, the diff, read-only tools, verified findings), so a weak review is at least a reviewed brief.
- **The eight-block cap.** If an agent stops eight times without calling a tool, Claude Code lets it go. A real review calls tools, so this matters only for an agent arguing with the hook instead of working, and the pre-push gate catches that case.
- **Thresholds.** Drawn from history, they will misjudge some changes. The hook logs every decision; a misjudged change is a test case and a tuned number.
- **Other sessions.** The gates are per session; a change split across two sessions is two smaller changes. The pre-push gate sees the commit range, which is the backstop.

**What to do.** Accept the holes that the push gate backs up; log the rest and tune from the log. Retire the gate, as the toolkit retires any rule (toolkit-standard §C), if it stops catching anything for a quarter.

---

## 10. Cheat sheet

| Question | Answer |
|---|---|
| Why are the steps skipped? | CLAUDE.md is guidance the model may judge inapplicable; only the harness is binding |
| Does louder wording help? | No: Anthropic says emphasis does not fix it and makes the model over-apply rules |
| What holds today? | `bin/check` and trailers at push; reply length at Stop |
| What is skipped? | Plan, impact, budget, independent review, the feedback answer |
| Strongest mechanism? | A gate at push; then a PreToolUse refusal; then a Stop block |
| Different model for review? | Not required; a fresh context is what matters |
| How to keep small tasks fast? | A script measures the change; half of past commits fall under the line |
| Plan gate | PreToolUse refuses the edit that crosses the line until a plan with a script-made impact list exists |
| Review gate | Stop blocks while the transcript shows an edit after the last fresh-agent review |
| Feedback gate | Stop blocks a full-path turn that does not answer the toolkit question |
| Real-world match | Spotify: Stop hook with deterministic checks, then a judge; Stripe: code-defined steps, capped CI retries |
| Feedback loop in practice | Hashimoto and Vincent: every agent mistake becomes a rule line, a tool or a strengthened skill |
| Build order | Review gate, feedback gate, then size and plan |

---

## 11. The short version

The toolkit's working steps feel optional to its agents because, in Claude Code, they are: a line in CLAUDE.md is a guideline the model is allowed to judge inapplicable, and Anthropic's documentation says so. Only the harness binds: a hook that refuses an edit, a hook that will not let a turn end, a check that refuses a push. The research on instruction following explains why the toolkit's setting makes this worse: hundreds of rules, long sessions, and compaction all erode prose.

The toolkit already gates verification and commit trailers at push, and those hold. It gates nothing about planning, impact or review, and those are exactly the steps the maintainer keeps asking about, most recently when an agent answered "partly" to whether it had reviewed its work.

Other tools agree on the phases (plan, implement, verify, review) and mostly enforce them with prose, which is why their gates leak too. The exceptions use the harness: plan mode, PreToolUse refusals, Stop hooks, CI. A different model as reviewer is not supported by evidence as necessary; a reviewer that never saw the implementer's reasoning is. Practitioners who run agents at scale report the same: Spotify gates pull requests with a Stop hook, Stripe wraps its agents in code-defined steps with a capped retry, and the individuals who improve over time write every mistake back into their rules or tools.

The design keeps small changes fast by letting a script, not the agent, decide what is small: on the toolkit's own history, half of all commits fall under the line and would see no change. Above it, three gates: no edit until a plan exists with an impact list the code produced; no end of turn while an edit postdates the last independent review; no end of turn without an answer to what goes back into the toolkit. Each gate checks the session's own transcript, so the agent is never asked whether it did the step. The hook looks.

---

## Sources

### Primary: Anthropic

- [Claude Code best practices](https://code.claude.com/docs/en/best-practices): deterministic and non-deterministic instructions, emphasis, verification rungs, fresh-subagent review. Read 28 October 2026; quotes checked verbatim.
- [Claude Code hooks reference](https://code.claude.com/docs/en/hooks): Stop input fields, block decisions, the eight-continuation cap and its reset, `onFailure`.
- [Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide): failing open, `stop_hook_active`.
- [Permission modes](https://code.claude.com/docs/en/permission-modes): plan mode and where the harness does not enforce it.
- [Local code review](https://code.claude.com/docs/en/code-review-local): `/code-review` in a forked subagent.

### Primary: other tools

- [GitHub Spec Kit](https://github.com/github/spec-kit), with its [implement command](https://raw.githubusercontent.com/github/spec-kit/main/templates/commands/implement.md) and [plan template](https://raw.githubusercontent.com/github/spec-kit/main/templates/plan-template.md).
- [Kiro specs](https://kiro.dev/docs/specs/) and [Kiro hooks](https://kiro.dev/docs/hooks/index).
- [obra/superpowers](https://github.com/obra/superpowers), with its [using-superpowers skill](https://raw.githubusercontent.com/obra/superpowers/main/skills/using-superpowers/SKILL.md).
- [openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc): the Codex review gate.
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) and [Codex hooks](https://learn.chatgpt.com/docs/hooks).
- [Cursor rules](https://cursor.com/docs/context/rules) and [Cursor hooks](https://cursor.com/docs/hooks).
- [Aider lint and test](https://aider.chat/docs/usage/lint-test.html).
- [Cline hooks](https://docs.cline.bot/features/hooks) and the [v3.36 release post](https://cline.bot/blog/cline-v3-36-hooks).

### Research

- Laban et al., [multi-turn conversation study](https://arxiv.org/abs/2505.06120), May 2025.
- [IFScale: instruction following at scale](https://arxiv.org/abs/2507.11538), July 2025.
- Gloaguen et al., [study of repository context files for coding agents](https://arxiv.org/abs/2602.11988), February 2026 (ICLR 2026).
- [Self-preference in revision against a deterministic checker](https://arxiv.org/abs/2606.20093), June 2026.

### Cited but not resolved to a URL

- Panickssery et al., 2024, on self-preference in LLM judges: cited through secondary sources, not opened for this guide.

### Practitioners (first-hand)

- Kent Beck, [Augmented Coding: Beyond the Vibes](https://newsletter.kentbeck.com/p/augmented-coding-beyond-the-vibes), June 2025.
- Harper Reed, [My LLM codegen workflow atm](https://harper.blog/2025/02/16/my-llm-codegen-workflow-atm/), February 2025.
- Armin Ronacher, [Agentic Coding Recommendations](https://lucumr.pocoo.org/2025/6/12/agentic-coding/), June 2025.
- Mitchell Hashimoto, [My AI Adoption Journey](https://mitchellh.com/writing/my-ai-adoption-journey), February 2026.
- Jesse Vincent, [Superpowers](https://blog.fsck.com/2025/10/09/superpowers/), October 2025.
- Anthropic Engineering, [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), November 2025.
- Spotify Engineering, [Background coding agents: strong feedback loops (part 3)](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3), December 2025.
- Stripe, [Minions part 2](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2), February 2026.

### Project sources (local)

- `~/Projects/toolkit/CLAUDE.md`, `tools/claude-hooks/hooks.mjs` and its README, `.githooks/pre-push`, `tools/toolkit-check/closing.mjs`, `~/.claude/settings.json`, `~/.claude/hooks/brevity.mjs`.
- The session memory's *Review your own work* and *Raise systemic gaps unasked* sections.
- Commit history since 1 September 2026 (293 commits), measured with `git log --numstat` on 28 October 2026.
