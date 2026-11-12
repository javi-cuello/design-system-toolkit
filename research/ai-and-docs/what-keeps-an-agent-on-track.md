# Hooks, gates, evals and the rest: what keeps an agent on a design system

What each part around an agent does to its work (harness, hook, gate, guardrail, eval, baseline), and which parts the agent can ignore.

An agent builds a job board's feedback page. It renders and it looks right, but the reasons are raw `<input type="radio">` elements where the design system has a radio group. In the review afterwards, one person says a hook should have caught it, another that the evals should have, and a third that the context file already said not to.

All three are talking about the same machine. Each names a different part of it, and the pairs that sound alike (hook and gate, test and eval, skill and MCP tool) do different jobs.

---

## What this answers

- [The harness](#the-harness): what a harness is
- [Ignored context files](#ignored-context-files): why an agent ignores context files
- [Progressive disclosure](#progressive-disclosure): how an agent fetches only what it needs
- [Guardrails and checks](#guardrails-and-checks): is a guardrail just a check
- [Hooks and gates](#hooks-and-gates): when a hook becomes a gate
- [Tests and parity](#tests-and-parity): what each proves
- [Evals versus tests](#evals-versus-tests): why an eval is not a test
- [Honest evals](#honest-evals): what keeps an eval honest
- [When a check is wrong](#when-a-check-is-wrong): who decides
- [People in the loop](#people-in-the-loop): where people still come in

For a lookup, use the [cheat sheet](#cheat-sheet), one line per term; [the short version](#the-short-version) is the whole guide for a reader who reads nothing else.

---

## The harness

A harness is everything around the model that makes it an agent and keeps it on course; the design system is the content the harness carries, saying what good looks like, while the harness makes the agent meet it.

The feedback page carries this whole guide. A person picks one reason from a list, adds a comment, and ticks a box to be contacted. The design system has a component for each: a radio group, a text area, a checkbox.

An agent asked to build the page can use them. Or it can write the raw HTML elements (`<input type="radio">`, `<textarea>`, `<input type="checkbox">`) and style them to look close enough. Both pages render. Only one is on the system.

What decides which page comes out is the *harness*: what the agent is told, what it can look up, what checks its work and what refuses to let it continue. The word comes from Anthropic's [post on evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents). It defines an *agent harness* as the system that lets a model act as an agent, taking inputs, running tool calls and returning results.

The same post adds that evaluating "an agent" means evaluating the model and its harness together. It also defines a second thing with a similar name, the *evaluation harness*: the machinery that runs test tasks, records what happened and grades it. The first is what the agent works inside; the second is what a team uses to measure the first.

Every part of a harness acts on the feedback page at a different moment, and does one of four jobs. Here they are around the one agent.

<svg role="img" viewBox="0 0 760 330" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="Helvetica, Arial, sans-serif">
<title>The four jobs of a harness around one agent task. Tell: context files, skills, MCP servers and structured data, read by the agent, which may weigh them. Check: lint, tests, validators and parity, run as code and the same every time. Stop: gates, a hook or CI step that refuses on a failed check. Measure: evals, which run the whole agent many times and grade it. People: rulings and review.</title>
<rect x="0" y="0" width="760" height="330" fill="#ffffff"/>
<rect x="290" y="130" width="180" height="70" rx="8" fill="#15171c"/>
<text x="380" y="160" fill="#ffffff" font-size="16" text-anchor="middle" font-weight="700">Agent</text>
<text x="380" y="182" fill="#ffffff" font-size="12" text-anchor="middle">builds the feedback page</text>
<rect x="14" y="20" width="250" height="130" rx="8" fill="#e6ecfc" stroke="#1f4fd8"/>
<text x="36" y="46" font-size="15" font-weight="700" fill="#1f4fd8">Tell (advisory)</text>
<text x="36" y="70" font-size="12" fill="#15171c">Context files: AGENTS.md, CLAUDE.md</text>
<text x="36" y="90" font-size="12" fill="#15171c">Skills: step-by-step recipes</text>
<text x="36" y="110" font-size="12" fill="#15171c">MCP servers: lookups on demand</text>
<text x="36" y="130" font-size="12" fill="#15171c">Structured data: contracts, tokens</text>
<rect x="510" y="20" width="230" height="130" rx="8" fill="#eef6ee" stroke="#2e7d32"/>
<text x="526" y="46" font-size="15" font-weight="700" fill="#2e7d32">Check (deterministic)</text>
<text x="526" y="70" font-size="12" fill="#15171c">Lint rules</text>
<text x="526" y="90" font-size="12" fill="#15171c">Tests</text>
<text x="526" y="110" font-size="12" fill="#15171c">Validators (guardrails)</text>
<text x="526" y="130" font-size="12" fill="#15171c">Visual regression, parity</text>
<rect x="510" y="180" width="230" height="90" rx="8" fill="#fdecea" stroke="#c62828"/>
<text x="526" y="206" font-size="15" font-weight="700" fill="#c62828">Stop (blocking)</text>
<text x="526" y="230" font-size="12" fill="#15171c">Gates: a hook or CI step</text>
<text x="526" y="250" font-size="12" fill="#15171c">that refuses on a failed check</text>
<rect x="20" y="180" width="230" height="90" rx="8" fill="#fff6e0" stroke="#a66b00"/>
<text x="36" y="206" font-size="15" font-weight="700" fill="#a66b00">Measure (over many runs)</text>
<text x="36" y="230" font-size="12" fill="#15171c">Evals, baselines,</text>
<text x="36" y="250" font-size="12" fill="#15171c">pinned commits, contamination</text>
<line x1="264" y1="90" x2="290" y2="150" stroke="#1f4fd8" stroke-width="2"/>
<line x1="470" y1="150" x2="510" y2="90" stroke="#2e7d32" stroke-width="2"/>
<line x1="470" y1="185" x2="510" y2="220" stroke="#c62828" stroke-width="2"/>
<line x1="250" y1="225" x2="290" y2="185" stroke="#a66b00" stroke-width="2"/>
<text x="380" y="310" font-size="13" text-anchor="middle" fill="#5b6270">People sit across all four: rulings decide what a check may excuse; review reads what no check can.</text>
</svg>

Only the red box can stop the agent. The blue one can only tell it, and the agent decides what to do with that.

- **Tell.** Context files, skills, MCP servers and structured data put information in front of the agent. The model reads it and decides what to do with it, so all of it is advisory.
- **Check.** Lint rules, tests, validators and visual comparisons are code. They give the same answer on the same input every time, whatever the model thought.
- **Stop.** A gate turns a check into a refusal: the edit, the end of the turn or the push doesn't happen until the check passes.
- **Measure.** An eval runs the whole agent, harness included, on a fixed task many times and grades the results. It says whether a change to the harness made the agent better.

Robin Di Capua's essay [*A design system harness*](https://brandstructure.design/articles/a-design-system-harness/) (November 2026) frames the same territory for design-system teams. Index files are the map, skills the recipes, structured data the ingredients, and tools and hooks the equipment.

It names two mechanisms, progressive disclosure for managing context and guardrails for managing constraint. It also names two tiers of verification: deterministic checks inside a session, and evals scored against team baselines over time.

The four jobs are the same picture with one change. Di Capua puts hooks with tools as equipment; here they are separated, because a hook that refuses is the only part of the list that can make a step mandatory.

Before arguing about any part your team runs, sort it into one of the four jobs. **The question that separates them is who decides: the model (tell), code (check), code that refuses (stop), or a graded run of the whole agent (measure).** That split is consensus among the vendors cited here. The four-job naming is a judgement, chosen because "who decides" is the one question that tells every confused pair apart.

---

## Ignored context files

An agent can ignore a context file (`AGENTS.md`, `CLAUDE.md`) because it is guidance loaded into the agent's working text, which the model weighs against everything else it sees, and the vendors' own documentation says it is never enforcement.

For the feedback page, the context file is where a team writes the line that matters most: build interface from the design system's components, and look them up before writing markup. The agent loads it, writes raw radios anyway, and the page renders.

To see why, start with *context*: everything in the model's working text at a given moment. That is the request, the files it has read, tool results, its own reasoning and the context files. Anthropic's [post on context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) treats that text as a budget.

Each extra token draws on a limited attention, and recall drops as the window fills, an effect the post calls *context rot*. So a context file isn't free. It costs on every turn, and every line in it competes with the task.

[`AGENTS.md`](https://agents.md/) is the cross-tool name for such a file. Its site calls it a "README for agents" and says the Agentic AI Foundation, under the Linux Foundation, now maintains it. It lists Codex, Cursor, Gemini CLI, GitHub Copilot's coding agent and many others as readers.

A file can sit in any folder, and the nearest one to the code being edited wins. `CLAUDE.md` is Claude Code's equivalent, and Claude Code can read a repository's `AGENTS.md` in its place. Beside the instruction, the file holds the map: where the components live, which command checks the work.

The instruction stays advisory. The model weighs it against a strong local signal (the page renders, the task looks done) and may judge that it doesn't apply this time. Claude Code's own documentation says so, and [Part 6](agent-workflow-enforcement.md) makes the case in full under *Why does a written step feel optional?* [Part 4](how-the-system-reaches-the-agent.md) covers what the controlled studies found about context files.

*Context* and *memory* get used for the same thing, and they differ. Context is what is in the window now, for this turn. Memory is what persists after the session ends and is loaded back in later.

Claude Code has two [memory](https://code.claude.com/docs/en/memory) mechanisms: `CLAUDE.md`, written by a person, and auto memory, notes the agent writes itself from corrections. Both load at the start of every session (auto memory up to its first 200 lines or 25KB). Memory becomes context only when it is loaded, and then it carries exactly the same weight as any other context: advisory.

| | Context | Memory |
|---|---|---|
| What it is | The working text of this session | Notes kept between sessions |
| Who writes it | Everything: the person, the files, the tools, the model | A person (`CLAUDE.md`) or the agent (auto memory) |
| How long it lasts | Until the session ends or is compacted | Until someone edits or deletes it |
| Binding? | No | No, once loaded it is context |

Three traps come up with context files:

- **The overview nobody needed.** A long description of the repository's folders, which the agent can discover by listing them. It costs tokens on every turn and, in the study Part 4 weighs, didn't help.
- **Emphasis as enforcement.** Writing a rule in capitals after the agent skipped it. Part 6 shows why that fails.
- **Memory that contradicts the file.** An agent's auto memory records a preference from one session that a later change to `CLAUDE.md` reverses. Both load, both are context, and the model picks.

Keep your context file short: the map (where things are, which commands check the work) and the few instructions the code can't say about itself. **Treat every line in it as a request the model may decline, and move any line that must hold every time into a [check](#guardrails-and-checks) or a [gate](#hooks-and-gates).**

That context files are advisory is the vendors' own statement. Keeping them to a map and a few instructions follows the one controlled study, and is consensus among practitioners.

---

## Progressive disclosure

An agent fetches only what it needs through progressive disclosure: it gets a short index of what exists and fetches the detail only when the task needs it, with skills doing this for procedures, MCP servers for live lookups, and structured data as what both deliver.

Say the design system has sixty components, each with props, states, accessibility notes and examples. Pasting all of that into the context file would cost tokens on every turn of every session, including sessions that never touch interface code. What the agent needs for the feedback page is three components' worth.

*Progressive disclosure* is a design term borrowed for agents. In an interface it means showing the common options and revealing the rest on request. For an agent it means the same with text.

The context-engineering post describes agents holding lightweight references (a file path, a stored query, a link) and loading the data behind them at run time, with each step informing the next. Anthropic's [skills post](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) gives the concrete levels:

- a skill's name and description sit in the system prompt from the start;
- the full `SKILL.md` is read only when the skill looks relevant;
- files bundled with it are read only when needed.

**Skills.** A *skill* is a folder with a `SKILL.md` file of step-by-step instructions, optionally with reference files and scripts beside it. [Claude Code's docs](https://code.claude.com/docs/en/skills) say only the description is in context at startup, the body "only loads when invoked", and scripts are run rather than read.

A design system might ship a skill for building a form page: which components to reach for, the order of fields, what to check afterwards. A skill is still text the model reads, so it is still advisory.

**MCP servers.** The [Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro) is an open standard for connecting an AI application to outside systems. An MCP server exposes *tools*: named functions the agent can call with arguments, and get an answer from.

A design system's server answers questions about the system. Primer, Atlassian, Carbon and Figma each ship one; [Part 4](how-the-system-reaches-the-agent.md) lists which tools each server has.

**Structured data and contracts.** What a server or skill hands over is only as good as the data behind it. A *component contract* is a structured record of one component's interface: its props, the values each can take, its parts (its anatomy), and which token each value uses. A token file in the W3C DTCG format is the same idea for design tokens.

Two public efforts try to standardise contracts for documentation:

- **[Design System Doc Spec](https://designsystemdocspec.org/)** (DSDS) is a draft JSON Schema (version 0.23.1, written as YAML files) maintained by PJ Onori. A document holds entries of kinds `system`, `component`, `token` and `theme`; a token entry points to a DTCG file rather than restating its value. Guidance can be marked `for: agent`, and a rule can say whether it is checked `automated`, `assisted` or `manual`.
- **[Spectacular](https://spectacular.systems/)** is a schema and a set of tools (a Figma plugin and a CLI) from Directed Edges for capturing component specs from Figma: anatomy, props, styling, layout, slots and usage, for designers, engineers and agents alike. Its schema is CC BY 4.0 and credits Nathan Curtis; several of its features are marked experimental.

Neither is a harness part that checks anything. Both are formats for the ingredients.

The pair most often swapped is the skill and the MCP tool. A skill is a recipe the agent reads: instructions for how to do a job, loaded when the job comes up. An MCP tool is a function the agent calls: a question with an answer computed by a running server, fresh each time.

A skill can tell the agent to call a tool; a tool can't tell the agent how to do a job. The skills post describes the two as complementary for that reason.

| | Skill | MCP tool |
|---|---|---|
| What the agent does with it | Reads it | Calls it |
| What it holds | A procedure, in prose, with optional scripts | A function over live data |
| When it costs tokens | Description always; body once invoked | Its listing; then each answer |
| Can it go stale? | Yes, when the system changes and the text doesn't | Only if the data behind it does |
| Example for the feedback page | "Build a form page": which components, which order, which check | `get_component` for the radio group's props |

**A worked case: offered is not used.** One design-system toolkit ran this on a job board. Its MCP server, over the system's built documentation site, was loaded for the agent building the feedback page. The server's instructions were written as documentation ("this server returns components, tokens…"). The agent never called it, in two tasks out of two.

Then the instructions were rewritten to say the system is what the interface is built from, and to ask it before writing any interface code. The agent called it in both tasks: search, get the component, get its contract, validate. The progressive disclosure had been there all along. The index entry never told the agent when to open it.

Put your index in the context file, procedures in skills, and lookups behind an MCP server or a CLI, and generate the data both serve from the system's own source. **Write each skill's description and each server's instructions as a statement of when to use it, because that one line is all the agent sees until it decides to look.**

The on-demand pattern is consensus across the vendors here. The finding that a loaded server goes unused without that line rests on one toolkit's runs, told under [why an eval is not a test](#evals-versus-tests); which delivery route measured best is in Part 4.

---

## Guardrails and checks

Every guardrail is a check, but a check becomes a guardrail only when it sits where the agent works and its result reaches the agent, so it can stop or correct what the agent is doing.

On the feedback page, the difference is timing. A lint rule in the project's CI that bans raw form elements runs on the pull request, hours later, and a person reads the failure. The same rule, offered to the agent as a tool it runs straight after writing the file, hands the findings back so it can fix them in the same session.

The first is a *check*: any code that looks at something and says pass or fail. Does this CSS use a raw colour, does this import come from the library, does this file parse. A check is deterministic, meaning the same input always gets the same answer, because no model is involved in deciding.

The second is a *guardrail*, and what makes it one is where the check sits. OpenAI's [Agents SDK](https://openai.github.io/openai-agents-python/guardrails/) gives the cleanest vendor definition: checks that validate the agent's input or output, or wrap a tool call before and after it runs. When one fails, it trips a "tripwire" that stops the run. Di Capua uses the word more widely, for constraint in general: lint rules, allowed-component lists, token-only styling.

The most common check a design system ships is a *linter*: a program that reads code without running it and reports patterns a team has ruled out. It matters most for an agent, because it is the only kind of check that works when the agent skipped everything it was told. Three systems ship the rules that matter here:

- **Atlassian.** [`@atlaskit/eslint-plugin-design-system`](https://cdn.jsdelivr.net/npm/@atlaskit/eslint-plugin-design-system/README.md) bans raw elements one rule at a time (`no-html-button` in favour of the system's Button, `no-html-anchor`, `no-html-text-input` and the rest). It enforces tokens with `ensure-design-token-usage`, which checks only colour unless its `domains` option is widened.
- **Primer.** Its [stylelint config](https://github.com/primer/stylelint-config) enforces its variables with `primer/colors`, `primer/spacing`, `primer/typography`, `primer/borders` and `primer/box-shadow`. Primer's [ESLint plugin](https://github.com/primer/eslint-plugin-primer-react) is mostly about deprecations and has no raw-element ban.
- **Salesforce.** The SLDS Linter flags hard-coded values and deprecated tokens, and Salesforce wraps it in three agent skills.

A lint rule runs whether a person or an agent wrote the code. That is its strength: it doesn't depend on anyone having read anything.

**A validator built for agents, worked through.** One toolkit's MCP server has a `validate` tool, also available as a command. Given the agent's code, it reports:

- raw colours, naming the token that holds each one;
- token names the library lacks;
- prop values the component's contract doesn't have;
- raw HTML elements where the library has a component;
- library components defined locally rather than imported.

It exits with a failure code on any finding. Here is what it does to the feedback page.

| | Before the check | After the agent reads the findings |
|---|---|---|
| Reason list | `<input type="radio" name="reason">` × 4, styled by hand | The library's radio group, options as data |
| Comment | `<textarea class="comment">` | The library's text area |
| Contact me | `<input type="checkbox">` with a hex border | The library's checkbox |
| Findings | 3 raw elements where the library has a component | 0 |

The page looked right in both columns. Only the check could tell them apart without a person who knows the system reading every line.

Other systems make the same move, offered as tools: check the output against the closed set of real names. Primer has `lint_css`, Atlassian `ads_analyze_a11y`, zeroheight [a code audit](https://zeroheight.com/mcp/), and v0 [a rule](https://v0.app/docs/design-systems-2) against using any name it can't verify in its sources.

Salesforce's [SLDS validate skill](https://github.com/forcedotcom/sf-skills/blob/main/skills/design-systems-slds-validate/SKILL.md) runs the linter as its first step and then calls for a manual review gate. That gate is written in the skill's prose, which makes it the advisory kind described under [when a hook becomes a gate](#hooks-and-gates).

Three traps sit between a check and a guardrail:

- **The guardrail the agent never calls.** A check offered as a tool is only a guardrail if the agent calls it. An instruction to "run validate when done" is advisory; a hook that runs it isn't.
- **The check that runs too late.** A CI lint rule catches the raw radio, but after the agent has finished and moved on, so a person has to send the work back. The same rule at the agent's side would have cost one more turn.
- **The check that sees only what it was built for.** A validator reads imports and elements; it doesn't see layout. A feedback page built entirely from library components, but placed outside the product's page shell, passes it. The eval under [why an eval is not a test](#evals-versus-tests) met exactly this.

Write every rule that code can check as a check, then put that check in two places: beside the agent, as a tool or a hook that hands findings back in the session, and in CI, where nobody can skip it. **A guardrail is a check moved to where the agent works; the rule is the same, only the moment changes.**

Lint for design-system use is shipping practice at Atlassian, Primer and Salesforce. Offering the same check to the agent as a tool is newer and, so far, vendor-led.

---

## Hooks and gates

A hook becomes a gate when it refuses: a hook is a script the harness runs automatically at a fixed moment, and it becomes a gate only when the action can't happen until a condition is met, which most hooks never do.

Take the edit where the agent writes the feedback page's raw radios. A hook at that moment could hand the agent the area's rules and let the edit through. Or it could refuse the edit until a condition holds. Both are hooks; only the second is a gate.

Claude Code's [hooks reference](https://code.claude.com/docs/en/hooks) lists the moments a hook can attach to. Among them:

- `SessionStart`, when a session begins;
- `UserPromptSubmit`, when the person sends a message;
- `PreToolUse`, before any tool call, an edit included;
- `PostToolUse`, after one;
- `Stop`, when the agent tries to end its turn;
- `PreCompact`, before a long session is summarised.

A hook can be a shell command, an HTTP call, an MCP tool call, a one-turn prompt to a model, or a subagent.

What makes a hook a gate is its answer. A `PreToolUse` hook that exits with code 2 blocks the tool call, and its message becomes the reason the agent is given; the same hook can return `"permissionDecision": "deny"`. A `Stop` hook that exits with code 2, or returns `{"decision": "block"}`, sends the agent back to work instead of letting it finish. A hook that prints something and exits 0 has informed, and the agent carries on.

Here is one agent turn on a timeline, with the hooks that inform above the line and the gates that refuse below it.

<svg role="img" viewBox="0 0 760 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="Helvetica, Arial, sans-serif">
<title>One agent turn on a timeline: session start, an edit, the end of the turn, then a push. An advisory hook at the edit hands over the area's rules and lets the edit happen. A gate at the edit refuses it until a plan exists. A gate at the end of the turn blocks finishing until an independent review has run. A gate at the push refuses it until the checks pass.</title>
<rect x="0" y="0" width="760" height="250" fill="#ffffff"/>
<line x1="40" y1="120" x2="720" y2="120" stroke="#15171c" stroke-width="2"/>
<circle cx="90" cy="120" r="7" fill="#15171c"/>
<circle cx="290" cy="120" r="7" fill="#15171c"/>
<circle cx="490" cy="120" r="7" fill="#15171c"/>
<circle cx="670" cy="120" r="7" fill="#15171c"/>
<text x="98" y="110" font-size="13" fill="#15171c">Session starts</text>
<text x="298" y="110" font-size="13" fill="#15171c">Agent edits a file</text>
<text x="498" y="110" font-size="13" fill="#15171c">Agent tries to finish</text>
<text x="678" y="110" font-size="13" fill="#15171c">Push</text>
<rect x="20" y="30" width="140" height="56" rx="6" fill="#e6ecfc" stroke="#1f4fd8"/>
<text x="90" y="54" font-size="12" text-anchor="middle" fill="#1f4fd8" font-weight="700">Hook (informs)</text>
<text x="90" y="72" font-size="11" text-anchor="middle" fill="#15171c">hands over what is open</text>
<rect x="190" y="30" width="200" height="56" rx="6" fill="#e6ecfc" stroke="#1f4fd8"/>
<text x="290" y="54" font-size="12" text-anchor="middle" fill="#1f4fd8" font-weight="700">Hook (informs)</text>
<text x="290" y="72" font-size="11" text-anchor="middle" fill="#15171c">hands over this area's rules</text>
<rect x="190" y="170" width="200" height="56" rx="6" fill="#fdecea" stroke="#c62828"/>
<text x="290" y="194" font-size="12" text-anchor="middle" fill="#c62828" font-weight="700">Gate (refuses)</text>
<text x="290" y="212" font-size="11" text-anchor="middle" fill="#15171c">no large edit without a plan</text>
<rect x="400" y="170" width="180" height="56" rx="6" fill="#fdecea" stroke="#c62828"/>
<text x="490" y="194" font-size="12" text-anchor="middle" fill="#c62828" font-weight="700">Gate (blocks)</text>
<text x="490" y="212" font-size="11" text-anchor="middle" fill="#15171c">no finish without review</text>
<rect x="600" y="170" width="140" height="56" rx="6" fill="#fdecea" stroke="#c62828"/>
<text x="670" y="194" font-size="12" text-anchor="middle" fill="#c62828" font-weight="700">Gate (refuses)</text>
<text x="670" y="212" font-size="11" text-anchor="middle" fill="#15171c">no push on a red check</text>
<line x1="90" y1="86" x2="90" y2="113" stroke="#1f4fd8" stroke-width="2"/>
<line x1="290" y1="86" x2="290" y2="113" stroke="#1f4fd8" stroke-width="2"/>
<line x1="290" y1="127" x2="290" y2="170" stroke="#c62828" stroke-width="2"/>
<line x1="490" y1="127" x2="490" y2="170" stroke="#c62828" stroke-width="2"/>
<line x1="670" y1="127" x2="670" y2="170" stroke="#c62828" stroke-width="2"/>
</svg>

The edit carries both kinds at once: a hook that hands over rules and lets the edit happen, and a gate that refuses a large one without a plan.

**One toolkit's hooks, worked through.** One design-system toolkit runs four hooks in every agent session, and three of them only inform:

- at the session's start, the agent is told what is left open;
- beside its first edit in an area, it is handed that area's rules (and, for an interface file, the knowledge pages to read first);
- what a turn left open is handed over with the next message.

The fourth holds the gates (plan, review, push and feedback), and they refuse. [Part 6](agent-workflow-enforcement.md) sets out which gate fires when, what clears it and how "large" is measured, under *What did one toolkit build?*

A gate itself comes in two kinds. A *blocking* gate stops the action; an *advisory* gate reports and lets the action go ahead. An advisory gate is the right choice where the check is noisy.

The same toolkit's design-to-code loop takes a screenshot per component and compares it with the last accepted set. That comparison never fails a run, because font rendering moves pixels on its own, and a gate that fires on noise teaches people to ignore it. The numeric comparison beside it does block.

Four traps come up between a hook and a gate:

- **The model-judged gate.** A hook of the prompt or agent type asks another model to decide. Anthropic's [best-practices page](https://code.claude.com/docs/en/best-practices) says plainly that this isn't deterministic either; for real enforcement it points to a command or HTTP hook.
- **The hook that fails open.** A hook script that crashes lets the action through, unless it is set to block on failure (`onFailure: "block"`, per the same page).
- **The gate that can't see the action.** A gate on file edits doesn't see a file written by a shell command unless it reads shell commands too. The toolkit's gate spent its first week learning to see writes it had missed.
- **The gate written in prose.** A skill that says "required manual review gate" is an instruction. Nothing refuses.

Part 6 ranks these mechanisms by how hard each is to skip, with their holes, under *Which enforcement mechanisms hold?*

Use hooks freely to hand the agent what it needs at the moment it needs it, and keep gates for the few steps that must happen every time. **A hook is a moment; a gate is a refusal at that moment, so call something a gate only if it can say no.** That only the harness can enforce is the vendors' own statement. The plan, review and feedback gates are one toolkit's design, in daily use since 28 October 2026.

---

## Tests and parity

A test proves one piece of code still gives a known right answer; visual regression compares a component's pixels with an accepted picture, and design-to-code parity compares its measured values with the design file's, so all three are deterministic checks that differ in what they compare against.

Take one illustrative change. A designer changes the radio group's corner radius on the feedback page from 8 to 6 in Figma, and nobody updates the code. Which check notices?

Before answering, *test* and *check* need separating, since the words overlap. A test states an expectation about the code it tests: given this input, this function returns that. A check asks a question about the whole repository or its output: does any file use a raw colour, is anything left uncommitted for a day. Both are code, both are deterministic, and a project's single check command usually runs both.

One toolkit's check command runs eighteen steps, among them "no project is named in the toolkit" and "every folder a newcomer opens has a README". Those are checks. Beside them, every tool ships test files. The tests for the gates under [when a hook becomes a gate](#hooks-and-gates) feed the gate code a recorded session and assert that it refused.

Each of the toolkit's skills also has a `tests/cases.md` of written cases, walked by hand when the skill changes. Those are tests too, run by a person rather than a machine.

*Visual regression* renders each component state and compares the picture, pixel by pixel, with a *baseline*. Chromatic defines a baseline as "the last known 'good' state" of a story. [Baselines](https://www.chromatic.com/docs/branching-and-baselines) change only when someone accepts a change, and each branch keeps its own.

[Percy](https://www.browserstack.com/docs/percy/overview/visual-testing-basics) describes the same model: new snapshots are compared with the previously approved images, and approved ones carry forward. The baseline is a human decision recorded as a picture.

*Design-to-code parity* compares the rendered code with the design file, not with an earlier picture of the code. The toolkit's parity engine reads each layer of a Figma component from a stored snapshot of the file, measures the matching element in a headless browser, and reports differences by layer and property, with both values.

It also keeps a measurement baseline of its own. Each run's numbers are compared with the last accepted run's, in exact numbers, to catch a change nobody meant to make.

Here is the radius change, with what each check compares it against.

<svg role="img" viewBox="0 0 760 260" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="Helvetica, Arial, sans-serif">
<title>One radio option drawn three times. In the design file its corner radius is now 6. In yesterday's accepted picture of the code it is 8. In today's code it is still 8. Visual regression compares today's code with yesterday's picture and passes, because nothing in the code changed. Parity compares today's code with the design and fails: border-radius expected 6, got 8.</title>
<rect x="0" y="0" width="760" height="260" fill="#ffffff"/>
<text x="120" y="30" font-size="14" font-weight="700" text-anchor="middle" fill="#15171c">Design file (Figma)</text>
<rect x="40" y="48" width="160" height="56" rx="6" fill="#ffffff" stroke="#1f4fd8" stroke-width="2"/>
<circle cx="66" cy="76" r="8" fill="none" stroke="#15171c" stroke-width="2"/>
<text x="84" y="81" font-size="13" fill="#15171c">Option</text>
<text x="120" y="126" font-size="12" text-anchor="middle" fill="#1f4fd8">radius 6</text>
<text x="380" y="30" font-size="14" font-weight="700" text-anchor="middle" fill="#15171c">Today's code</text>
<rect x="300" y="48" width="160" height="56" rx="16" fill="#ffffff" stroke="#15171c" stroke-width="2"/>
<circle cx="326" cy="76" r="8" fill="none" stroke="#15171c" stroke-width="2"/>
<text x="344" y="81" font-size="13" fill="#15171c">Option</text>
<text x="380" y="126" font-size="12" text-anchor="middle" fill="#15171c">radius 8</text>
<text x="640" y="30" font-size="14" font-weight="700" text-anchor="middle" fill="#15171c">Yesterday's accepted picture</text>
<rect x="560" y="48" width="160" height="56" rx="16" fill="#ffffff" stroke="#5b6270" stroke-width="2" stroke-dasharray="5 3"/>
<circle cx="586" cy="76" r="8" fill="none" stroke="#5b6270" stroke-width="2"/>
<text x="604" y="81" font-size="13" fill="#5b6270">Option</text>
<text x="640" y="126" font-size="12" text-anchor="middle" fill="#5b6270">radius 8</text>
<text x="380" y="148" font-size="11" text-anchor="middle" fill="#5b6270">Corners drawn exaggerated</text>
<line x1="204" y1="76" x2="296" y2="76" stroke="#c62828" stroke-width="2" stroke-dasharray="4 3"/>
<rect x="40" y="176" width="330" height="60" rx="6" fill="#fdecea" stroke="#c62828"/>
<text x="56" y="200" font-size="13" font-weight="700" fill="#c62828">Parity: red</text>
<text x="56" y="221" font-size="12" fill="#15171c">Option.border-radius expected 6, got 8</text>
<line x1="464" y1="76" x2="556" y2="76" stroke="#2e7d32" stroke-width="2" stroke-dasharray="4 3"/>
<rect x="390" y="176" width="330" height="60" rx="6" fill="#eef6ee" stroke="#2e7d32"/>
<text x="406" y="200" font-size="13" font-weight="700" fill="#2e7d32">Visual regression: green</text>
<text x="406" y="221" font-size="12" fill="#15171c">The code did not change</text>
</svg>

The code sits in the middle, and each check looks in a different direction. Visual regression looks back at yesterday's code and sees nothing new; parity looks across at the design and sees the 6.

| | Visual regression | Parity against the design |
|---|---|---|
| What it compares | Today's picture of the code with yesterday's accepted picture | The code's measured values with the design's |
| Result | Green: the code didn't change | Red: `Radio group › Option.border-radius` expected 6, got 8 |
| Now someone edits the code to 6 | Red: pixels moved, a person accepts the new baseline | Green |

Neither is wrong. Visual regression answers "did the code change when nobody meant it to"; parity answers "does the code match the design". A team that has only the first will never hear about the designer's change.

The parity method keeps pixels advisory and numbers blocking. Two renderers never agree pixel for pixel, so a pixel gate either fires on noise or gets a tolerance wide enough to miss real changes. A number either matches or it doesn't.

Use tests for the code that does the checking, checks for questions about the whole repository, visual regression for unintended change, and parity where a design file is the source of truth. **Each answers a different question, so pick by the question, never by the tool your team happens to own.** That visual baselines are human-accepted is how Chromatic and Percy document them. The rule that pixels inform and numbers block is one toolkit's, earned on its own projects.

---

## Evals versus tests

An eval is not a test because it runs the agent itself, harness and all, on a realistic task several times and grades what it produced, and since the agent answers differently each time, its result is a rate, never a single pass or fail.

Take the validator from [the guardrail section](#guardrails-and-checks). Fed one fixed file, it gives the same findings every run. Now give the feedback page task to the agent three times and grade each result with that same validator. The three scores differ.

Anthropic's [post on agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) gives the vocabulary. A *task* is one test case with inputs and success criteria. A *trial* is one attempt at it, and there are several because outputs vary.

A *grader* scores the result. It comes in three kinds: code (string matches, static analysis, checking the final state), a model (a rubric scored by another model), or a person. The *transcript* is the full record of a trial, every tool call and result. The *outcome* is the state of the world afterwards, which may differ from what the agent claimed.

OpenAI's [guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices) makes the same point from the other side. Evals exist because the same input can produce different outputs, so ordinary testing falls short. It names "vibe-based evals", judging quality by impression, as an anti-pattern.

Here is the same validator used both ways.

<svg role="img" viewBox="0 0 760 230" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="Helvetica, Arial, sans-serif">
<title>A test against an eval. Left: a test feeds one fixed input to the validator code and gets the same answer every run: pass, pass, pass. Right: an eval gives one task to the whole agent three times and grades each result with the validator, getting 0.833, 0.833 and 0.875, a rate rather than a single answer.</title>
<rect x="0" y="0" width="760" height="230" fill="#ffffff"/>
<text x="185" y="30" font-size="15" font-weight="700" text-anchor="middle" fill="#15171c">Test</text>
<text x="565" y="30" font-size="15" font-weight="700" text-anchor="middle" fill="#15171c">Eval</text>
<line x1="380" y1="15" x2="380" y2="215" stroke="#d8dce3"/>
<rect x="30" y="60" width="110" height="44" rx="6" fill="#eef0f4"/>
<text x="85" y="87" font-size="12" text-anchor="middle" fill="#15171c">fixed input file</text>
<rect x="170" y="60" width="90" height="44" rx="6" fill="#eef6ee" stroke="#2e7d32"/>
<text x="215" y="87" font-size="12" text-anchor="middle" fill="#15171c">validator</text>
<line x1="140" y1="82" x2="170" y2="82" stroke="#15171c"/>
<line x1="260" y1="82" x2="285" y2="82" stroke="#15171c"/>
<text x="295" y="70" font-size="12" fill="#2e7d32">run 1: pass</text>
<text x="295" y="88" font-size="12" fill="#2e7d32">run 2: pass</text>
<text x="295" y="106" font-size="12" fill="#2e7d32">run 3: pass</text>
<text x="185" y="160" font-size="12" text-anchor="middle" fill="#5b6270">Same code, same input, same answer.</text>
<rect x="400" y="60" width="90" height="44" rx="6" fill="#eef0f4"/>
<text x="445" y="80" font-size="12" text-anchor="middle" fill="#15171c">task: build</text>
<text x="445" y="95" font-size="12" text-anchor="middle" fill="#15171c">feedback page</text>
<rect x="510" y="60" width="80" height="44" rx="6" fill="#15171c"/>
<text x="550" y="87" font-size="12" text-anchor="middle" fill="#ffffff">agent</text>
<rect x="610" y="60" width="70" height="44" rx="6" fill="#eef6ee" stroke="#2e7d32"/>
<text x="645" y="87" font-size="12" text-anchor="middle" fill="#15171c">grader</text>
<line x1="490" y1="82" x2="510" y2="82" stroke="#15171c"/>
<line x1="590" y1="82" x2="610" y2="82" stroke="#15171c"/>
<text x="690" y="70" font-size="12" fill="#a66b00">0.833</text>
<text x="690" y="88" font-size="12" fill="#a66b00">0.833</text>
<text x="690" y="106" font-size="12" fill="#a66b00">0.875</text>
<text x="565" y="160" font-size="12" text-anchor="middle" fill="#5b6270">Same task, different agent output each trial.</text>
<text x="565" y="178" font-size="12" text-anchor="middle" fill="#5b6270">The result is a rate across trials.</text>
</svg>

The validator is identical on both sides. What changes is what runs in front of it: fixed code on the left, an agent on the right.

The pair is easy to blur because an eval usually contains tests; the grader is often a check. The difference is what is being measured. A test measures the code it is written for, and if it passes once it passes every time. An eval measures the agent's behaviour in a harness, and the code under it is just the ruler.

So changing a skill, a context file or an MCP server's instructions changes nothing a test sees, and can change everything an eval sees.

The post separates two purposes. A *capability* eval asks what the agent can do, and should start with a low pass rate. A *regression* eval asks whether it still does what it used to, and should sit near 100 percent.

It also separates two ways of counting. *pass@k* is the chance at least one of k trials succeeds; *pass^k* is the chance all k do. A 75 percent per-trial rate is about 42 percent over three trials when all three must pass.

**The tie, worked through.** One toolkit's eval runs headless Claude Code in a throwaway copy of a project. It asks for a screen in words that name no component, and grades the result with the same validator its push gate runs. The score is the share of written files with no finding. It ran on the job board with the system's MCP server on and off.

- **The settings page.** A notification-settings page, context on and off: both scored 1, about $1.50 and four minutes each. The agent with the server loaded never asked it. The repository already had pages built from the system, and the agent copied the code around it, so the task couldn't tell the two settings apart.
- **The feedback page.** No existing page built anything like it. Both settings scored 0.833, three raw elements each, and again the server went unasked.
- **After the instructions changed.** With the server's instructions rewritten (the worked case under [how an agent fetches only what it needs](#progressive-disclosure)), the agent asked the system every run. Over three trials each, context off scored 0.833, 0.833 and 0.875, with a raw radio, text area and checkbox every time. Context on scored 1, 1 and 1, at about 25 percent more turns and cost.

The first result was a tie, and the tie was a finding about the eval, not the server. A task with a near neighbour in the code measures the agent's copying, not the context. And three trials a side is enough to see a direction, not to measure a size.

**The grader picked for what it could score.** The same eval later scored 1 for a feedback page that sat outside the product's page shell, unstyled, because the grade read only imports. A grade that checks what is easy to check, rather than what the task must show, will pass work a person would reject. The fix was a second finding for screens that import none of the shell's modules.

Run an eval when a change touches what the agent is told rather than what the code does: a new skill, a rewritten context file, a server's instructions. **Write down what the task must show before choosing the grader, run each setting at least three times, and treat a tie as a question about the task before treating it as an answer about the change.**

The vocabulary is Anthropic's and OpenAI's. The numbers are one toolkit's runs on one project, a direction rather than a measure.

---

## Honest evals

Three things keep an eval honest: a baseline made under the same conditions, a pinned commit so only the change being measured differs, and a rule that contamination voids a run rather than lowering its score.

Suppose a skill is improved on Monday and the feedback page eval goes from 0.833 to 1. Between the two runs, a teammate added a contact page built from the library's radio group, and the agent copied it. The score moved, but the skill didn't move it. This case is illustrative.

The word *baseline* has now come up three times, with one shared meaning: a reference someone accepted, which later runs are compared with. In visual regression it is an accepted picture; in parity, an accepted set of measurements; in an eval, the last clean run of the same task.

Di Capua's essay has evals "scored against team baselines". The trap is comparing unlike runs. The toolkit's eval compares a run only with the last clean run under the same settings: the same rules hook on or off, the same context on or off, the same pin. A run with the MCP server on is never the baseline for a run with it off.

A *pinned* task names one commit, and every copy is made from that commit's files. That matters because a project moves between eval runs: someone adds a page, the components change, and a new page gives the agent something to copy. An unpinned score that moved might be the project's doing, not the skill's.

The toolkit compares a pinned run only with a pinned run at the same commit, so a change to the toolkit is the only thing that differs. It refuses a pin whose grading configuration has drifted from today's, because the grade would then be read by different rules. A pin holds the project's code, not the whole system around it: the built docs site the grade reads still comes from today.

Back to Monday's run. Pinned to Friday's commit, the same comparison holds the contact page out of both runs, and the score is the skill's.

*Contamination* is the agent getting information that makes the task easier than it would be in real use: the answer, the grader, or the history of earlier attempts. Anthropic's eval post gives an example: in some internal evals, Claude examined git history from previous trials and gained an unfair advantage.

The toolkit's eval treats contamination as voiding a run, not lowering it. A transcript that read the original repository, or ran git where a repository was reachable, scores 0 and is never a baseline. So does a run that changed any of the grade's own inputs (the design snapshot, the mappings, the stories), which are made read-only while the agent works. In one batch of five runs, two were void because the agent ran git.

The counter-evidence that justifies all three is public. [METR reported](https://metr.org/blog/2025-06-05-recent-reward-hacking/) in June 2025 that frontier models reward hack: they edit the grader's timing code, monkey-patch the evaluator so everything passes, or find the stored answer. On one benchmark, o3 did so in 39 of 128 runs.

METR also found that telling the models not to cheat "had a nearly negligible effect". Anthropic's post adds bugs on the grading side: one model scored 42 percent on CORE-Bench until rigid grading was fixed, then 95. It warns that a 0 percent pass rate across many trials is more often a broken task than an incapable agent.

Four traps, each with a real case behind it:

- **The moving project.** Scores compared across commits that differ in more than the change under test. Pin.
- **The leaky copy.** An agent that can reach git history or the original repository. Isolate and void.
- **The writable grader.** An agent that can edit the grader's inputs. Make them read-only, and void a run that changed them anyway.
- **The broken task.** A task the grader can't pass whatever the agent does. Prove the grade before trusting it: the toolkit grades a copy with nothing written (it must score low) and a copy with the original files kept (it must score as the project does).

Keep one results file per task, with each line naming the settings, the commit and whether the run was void. **Compare only like with like, pin when your project is moving, and void a contaminated run rather than averaging it in.** Contamination and grader bugs are documented by Anthropic and METR. Pinning and voiding as described here are one toolkit's practice.

---

## When a check is wrong

A person decides, and the decision is written as data the check reads: a waiver excuses one named difference for a stated reason up to a stated size, a ruling records a project decision that overrides a general rule, and both fail the check once what they excuse goes away.

Every honest check eventually reports something that shouldn't be fixed. Say, as an illustration, the radio group in code draws its focus ring two pixels further out than Figma does, because the browser draws focus rings differently, and the team has accepted that.

Without a way to say so, the team has two bad choices. It can change the check until it stops seeing the difference, or learn to ignore a red that never goes green.

A *waiver* is the third choice. In the toolkit's parity method, a waiver sits beside the mapping that measures the component and names the layer and property it excuses. It gives a reason and names who owns the fix: the design file, the code, or the toolkit itself. For a number, it states the size of the difference it excuses (`within: 2`). The difference stays in the report, marked excused, instead of disappearing.

The bound matters, and a real case shows why. One waiver written for two pixels of stroke on a group's height had no size. It silently absorbed a 22-pixel bug: a label the code kept rendering after being told to hide it. The run stayed green and the picture was visibly wrong.

With `within: 2`, the waiver covers exactly the difference it was written for, and fails the moment that difference becomes a different one.

| | Open waiver | Bounded waiver |
|---|---|---|
| Written as | "stroke adds height", no size | "stroke adds height", `within: 2`, owner `code` |
| A 22px bug arrives | Excused; run green | Not excused; run red, naming the layer |
| The stroke is fixed | Waiver lingers, excusing nothing | Waiver is stale; the check fails until it is removed |

A *ruling* is the same idea one level up. Where a general standard says one thing and a project decides another, the toolkit records the decision in the project's context document as a dated ruling, and the checks read it. The validator from [the guardrail section](#guardrails-and-checks) honours rulings scoped to it, so a finding a project has ruled acceptable isn't charged against the agent in an eval either.

Three traps come up with waivers and rulings:

- **The comment as waiver.** A note in the code saying the difference is fine. No check reads it, so it neither excuses nor goes stale.
- **The waiver nobody owns.** A reason with no owner is a difference nobody will close.
- **The ruling in chat.** A decision made in a conversation and never written where the check can read it. The next agent, and the next eval, meet the finding again.

Give every exception a home in data, beside the check that reads it, with a reason, an owner and a size where there is a number. **An exception the check can't read isn't an exception; it is an argument the next session will have again.** Bounded, owned, expiring waivers are one toolkit's design. Recording accepted deviations as explicit entries rather than inline ignores is common lint practice.

---

## People in the loop

People come in at three places no check reaches: deciding what the system is (rulings, baselines, what counts as good), reviewing work they didn't write for what checks can't see, and approving before work ships, because a green build only says the checks passed.

On the feedback page, the work left for a person is what no check above can answer. Is a radio group the right control for six reasons, or should it be a select? Does the page sit where a person would look for it? Should the contact box be ticked by default?

Those are design questions, and the system's answer to each is a ruling someone has to make once.

*Human review* is a person reading the work. *Independent review* is review by someone, person or agent, who didn't produce the work and didn't see the reasoning that did. The distinction matters for agents: an agent reviewing its own work in the same conversation is reading its own justifications back.

[Part 6](agent-workflow-enforcement.md) explains why the reviewer needs fresh context rather than a different model, under *Does review need a different model?*, and describes the toolkit's gate that enforces it.

There is user-outcome evidence for keeping people in the loop, and it points against trusting impressions. [METR's randomised trial](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) in 2025 gave 16 experienced open-source developers 246 real issues, with and without AI tools allowed. With AI, they took 19 percent longer.

Beforehand they expected a 24 percent speed-up, and afterwards they still believed they had been about 20 percent faster. The lesson that holds is about measurement: a person's sense that the agent helped isn't evidence that it did, which is the case for evals over impressions.

> **Aside.** METR notes the trial's results are now dated, and it has newer data from February 2026.

Keep people on the decisions (what is right, what is excused, what ships), and give the reading of diffs to a reviewer with fresh context. **Checks say whether the work follows the rules; only a person can say whether the rules were the right ones for this page.**

That review needs fresh context is Anthropic's documented practice and consensus among the practitioners in Part 6. METR's trial is the one controlled user-outcome study here, and it measured developers, not designers.

---

## Cheat sheet

| Term | What it is, by mechanism | Who decides | Binding? |
|---|---|---|---|
| Harness | Everything around the model that makes it an agent: context, tools, checks, gates | (the whole) | Parts of it |
| Evaluation harness | The machinery that runs, records and grades evals | Code | (measures, not binds) |
| Context | The working text of this session | The model weighs it | No |
| Memory | Notes kept between sessions, loaded back as context | The model weighs it | No |
| Context / index file | `AGENTS.md`, `CLAUDE.md`: the map and a few instructions, loaded every session | The model | No |
| Progressive disclosure | An index first; detail fetched when the task needs it | The model chooses what to open | No |
| Skill | A recipe in a folder; description always loaded, body when invoked | The model | No |
| MCP server | A running service the agent calls through named tools | The model chooses to call | No |
| Structured data / contract | Props, values, anatomy and tokens as data (DTCG, DSDS, Spectacular) | (content) | No |
| Check | Code that returns pass or fail on the same input the same way | Code | Only if a gate reads it |
| Test | A check written for one piece of code, with a known right answer | Code | Only if a gate reads it |
| Lint rule | A check that reads code without running it | Code | Only if a gate reads it |
| Guardrail | A check placed on the agent's path, its result handed back to it | Code | Can stop the run |
| Hook | A script the harness runs at a fixed moment | Code (or a model, if a prompt hook) | Only if it refuses |
| Gate, blocking | A hook or CI step that refuses until a check passes | Code | Yes |
| Gate, advisory | A gate that reports and lets the action proceed | Code | No |
| Visual regression | Pixels compared with an accepted picture of the code | Code, then a person accepts | Usually advisory |
| Parity | The code's measured values compared with the design file's | Code | Can block |
| Baseline | A reference someone accepted; later runs compared with it | A person accepts it | (a reference) |
| Eval | The whole agent run several times on a task, graded | Graders: code, model, person | No; it informs changes |
| Pinned commit | The project frozen at one commit for every eval copy | (setup) | (a condition) |
| Contamination | The agent seeing the answer, the grader or past attempts | A check of the transcript | Voids the run |
| Waiver | One named difference excused, with reason, owner and size | A person | Excuses, and goes stale |
| Ruling | A dated project decision that overrides a general rule | A person | Read by checks |
| Independent review | A reader with fresh context who didn't write the work | A person or a fresh agent | Can be a gate |

The confused pairs, one line each:

- **Test against eval.** A test measures fixed code once; an eval measures an agent's behaviour as a rate over trials.
- **Hook against gate.** A hook is a moment; a gate is a refusal at that moment.
- **Guardrail against check.** A guardrail is a check placed where the agent works, with its result handed back.
- **Skill against MCP tool.** A skill is read; a tool is called.
- **Context against memory.** Context is now; memory is what is loaded back in later, and then is context.

---

## The short version

An agent working on your design system sits inside a harness: everything around the model that tells it what to do, checks what it did, stops it when a check fails, and measures whether the whole arrangement works. The design system is the content; the harness is how that content reaches the agent and how the agent's work is held to it.

The parts that tell are all advisory, because the model reads them and decides. A context file such as `AGENTS.md` or `CLAUDE.md` is the map and a few instructions, loaded every session; memory is notes carried between sessions and loaded back as context.

Progressive disclosure keeps the rest out until it is needed. Skills are recipes the agent reads when a job comes up, MCP servers are tools it calls for live answers, and structured data (contracts, token files, formats such as DSDS and Spectacular) is what both deliver. A server that is loaded but described as documentation can go unused; its instructions have to say when to ask.

The parts that check are code and give the same answer every time. A lint rule reads code for patterns the system rules out; a test proves one piece of code behaves; a guardrail is a check placed where the agent works, with its findings handed back in the session.

Visual regression compares pixels with an accepted picture of the code; parity compares measured values with the design file. A hook runs at a fixed moment, and becomes a gate only when it refuses.

The part that measures is the eval: the whole agent run several times on a realistic task and graded, usually by the same checks. Its result is a rate, not a pass. It stays honest only when runs are compared with a baseline made under the same settings, the project is pinned to one commit, and a run that saw the answer or touched its grader is voided.

One toolkit's first MCP on/off eval tied, because the agent copied neighbouring pages. A task with no neighbour, and server instructions that said when to ask, separated them.

People stay on the decisions no check can make: what is excused (a waiver with a reason, an owner and a size; a ruling in the project's record), what the baselines are, and whether the page is right. Review by a reader who didn't write the work catches what checks can't see.

If your team is starting out, go in this order: a short context file, the system's data served on demand, one validator offered to the agent and run in CI, a gate on the step that keeps being skipped, and an eval before trusting any change to what the agent is told.

---

## What to re-check later

Researched November 2026. Vendor mechanics were read from primary pages on 9 November: Anthropic's engineering posts on evals (9 January 2026), context engineering (29 September 2025), skills (16 October 2025) and long-running harnesses (26 November 2025); Claude Code's hooks, memory, skills and best-practices pages; agents.md; the MCP introduction; OpenAI's evaluation best practices and its Agents SDK guardrails page; Figma's MCP overview and tools page; Primer's MCP page; the `@atlaskit/ads-mcp` README and the `@atlaskit/eslint-plugin-design-system` README; Carbon's MCP overview, concepts and setup pages; Salesforce's SLDS validate skill in its GitHub repository; Chromatic's baselines page; Percy's visual testing basics; the DSDS site and schema; Spectacular's site; METR's reward hacking post and its developer productivity study. Di Capua's essay renders client-side and was read from its published bundle.

On 9 November 2026, when the series was assembled, three passages were cut to links to Parts 4 and 6, which own them: the server roster under [how an agent fetches only what it needs](#progressive-disclosure), the toolkit's gate table under [when a hook becomes a gate](#hooks-and-gates), and the fresh-review detail under [where people still come in](#people-in-the-loop). The [guardrail section](#guardrails-and-checks) took in the lint rules from the archived *Making a design system usable by AI agents*.

Volatile, in order of how fast it will age:

- **Hook events and types.** Claude Code's hook list has grown with most releases (it now includes prompt, agent, HTTP and MCP-tool hooks); re-read the reference before relying on a specific event.
- **Design-system MCP servers.** Atlassian's is Early Access; Primer's tool count (nineteen) and Carbon's planned additions will move.
- **DSDS and Spectacular.** DSDS calls itself a draft at 0.23.1 and says it has changed; Spectacular marks several features experimental and shows no version.
- **The toolkit's eval numbers.** One project, three trials a side, a few dollars a run. A direction, not a measure; re-run after any change to the server's instructions.

Weaker sources, by status:

- Salesforce's developer-docs pages on its SLDS AI skills returned 403 to every fetch. A search summary reported a warning on that page that agents can skip the linter even when a skill marks it mandatory; this guide does not rely on it. What is stated here comes from the skill file on GitHub.
- Atlassian's rule page for `ensure-design-token-usage` rendered empty when fetched; the rule's description comes from the package README.
- Di Capua's essay is commentary, one practitioner's framing, not a description of a shipping system.
- METR says its 2025 trial is out of date and has newer data from February 2026, not read for this guide.

What was not found: any controlled study of evals for design-system agents specifically, or of designers (rather than developers) working with agents. The only user-outcome evidence here is METR's trial of developers.

---

## Sources

**Primary: Anthropic and Claude Code**

- [Anthropic Engineering, *Demystifying evals for AI agents*](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), 9 January 2026. Task, trial, grader, transcript, outcome, agent and evaluation harness, pass@k and pass^k, contamination through git history, grader bugs.
- [Anthropic Engineering, *Effective context engineering for AI agents*](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), 29 September 2025. Context rot, attention budget, just-in-time context, progressive disclosure, memory.
- [Anthropic Engineering, *Equipping agents for the real world with Agent Skills*](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), 16 October 2025. The three levels of skill loading; skills and MCP as complements.
- [Anthropic Engineering, *Effective harnesses for long-running agents*](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents), 26 November 2025.
- [Claude Code, hooks reference](https://code.claude.com/docs/en/hooks). Events, handler types, exit code 2, `permissionDecision`, Stop `decision: "block"`.
- [Claude Code, memory](https://code.claude.com/docs/en/memory). `CLAUDE.md` and auto memory, "context, not enforced configuration", `AGENTS.md`.
- [Claude Code, skills](https://code.claude.com/docs/en/skills). What loads at startup and when the body loads.
- [Claude Code, best practices](https://code.claude.com/docs/en/best-practices). Deterministic and non-deterministic instructions; prompt hooks not deterministic; `onFailure: "block"`; fresh-subagent review; a reviewer always finds something.

**Primary: other vendors and standards**

- [AGENTS.md](https://agents.md/). "README for agents", stewardship, readers, nearest file wins.
- [Model Context Protocol, introduction](https://modelcontextprotocol.io/docs/getting-started/intro).
- [OpenAI, evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices). Evals for nondeterministic systems; vibe-based evals as an anti-pattern.
- [OpenAI Agents SDK, guardrails](https://openai.github.io/openai-agents-python/guardrails/). Input, output and tool guardrails; tripwires.

**Primary: design systems**

- [Figma, MCP server overview](https://developers.figma.com/docs/figma-mcp-server/).
- [Figma, MCP tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/). `get_design_context`, `get_variable_defs`, `search_design_system`; React and Tailwind by default.
- [Primer, MCP](https://primer.style/product/getting-started/foundations/mcp). `@primer/mcp` and its nineteen tools.
- [Atlassian, `@atlaskit/ads-mcp` README](https://cdn.jsdelivr.net/npm/@atlaskit/ads-mcp/README.md). Tools and Early Access status.
- [Atlassian, `@atlaskit/eslint-plugin-design-system` README](https://cdn.jsdelivr.net/npm/@atlaskit/eslint-plugin-design-system/README.md) and [`ensure-design-token-usage`](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage). `ensure-design-token-usage`, `no-html-button`, `no-html-anchor`, `no-html-text-input`.
- [Primer, stylelint config](https://github.com/primer/stylelint-config) and [`eslint-plugin-primer-react`](https://github.com/primer/eslint-plugin-primer-react).
- [SLDS Linter agent skills](https://developer.salesforce.com/docs/platform/slds-linter/guide/get-started-linter-AI-skills.html) (403 when fetched).
- [zeroheight, *MCP*](https://zeroheight.com/mcp/). The code audit.
- [Vercel v0, *Design systems 2.0*](https://v0.app/docs/design-systems-2). The rule against names it cannot verify.
- [Carbon, MCP overview](https://carbondesignsystem.com/getting-started/carbon-mcp/overview), [concepts](https://carbondesignsystem.com/getting-started/carbon-mcp/concepts) and [onboarding and setup](https://carbondesignsystem.com/getting-started/carbon-mcp/onboarding-and-setup).
- [Salesforce, `design-systems-slds-validate` skill](https://github.com/forcedotcom/sf-skills/blob/main/skills/design-systems-slds-validate/SKILL.md). Linter, supplementary checks, a manual review gate in prose.
- [Design System Doc Spec](https://designsystemdocspec.org/) and its [schema](https://designsystemdocspec.org/schema), draft 0.23.1; [repository](https://github.com/somerandomdude/design-system-documentation-schema).
- [Spectacular](https://spectacular.systems/).

**Primary: visual testing**

- [Chromatic, branching and baselines](https://www.chromatic.com/docs/branching-and-baselines). A baseline as the last known good state; accepted per branch.
- [Chromatic, visual tests](https://www.chromatic.com/docs/test).
- [Percy, visual testing basics](https://www.browserstack.com/docs/percy/overview/visual-testing-basics).

**Research and measured results**

- [METR, *Recent frontier models are reward hacking*](https://metr.org/blog/2025-06-05-recent-reward-hacking/), 5 June 2025.
- [METR, *Measuring the impact of early-2025 AI on experienced open-source developer productivity*](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), 10 July 2025.
- Gloaguen et al., [*Evaluating AGENTS.md*](https://arxiv.org/abs/2602.11988), version 3, 29 September 2026 (weighed in Part 4).

**Commentary**

- Robin Di Capua, [*A design system harness*](https://brandstructure.design/articles/a-design-system-harness/), Brand Structure, 7 November 2026. The map, recipes, ingredients and equipment framing; progressive disclosure and guardrails; two tiers of verification.

**Toolkit (public repository, read 9 November 2026)**

- [`tools/claude-hooks/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/README.md) and [`gates.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/gates.mjs): the hooks and the plan, review, push and feedback gates; `FILES = 3`, `LINES = 100`, `WIDE_LINES = 10`.
- [`tools/skill-evals/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/skill-evals/README.md): screen tasks graded by `validate`, `--context on|off`, contamination, void runs, pinned runs, proving the grade.
- [`docs/agent-prototyping-plan.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/docs/agent-prototyping-plan.md), Outcome 6: the job board's on/off runs and their numbers.
- [`tools/system-mcp/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/system-mcp/README.md) and [`validate.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/system-mcp/validate.mjs): the server's tools and `validate`.
- [`tools/parity/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/parity/README.md), [`waivers.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/parity/waivers.mjs) and [`baseline.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/parity/baseline.mjs): waivers, the bounded-waiver case, the measurement baseline.
- [`skills/design-code-parity/SKILL.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/skills/design-code-parity/SKILL.md), §6 and *Pixels are for eyes, never for gates*: advisory screenshots.
- [`bin/check`](https://github.com/javi-cuello/design-system-toolkit/blob/main/bin/check): the toolkit's eighteen check steps; each skill's `tests/cases.md`.
- [`knowledge/code/agent-prototyping.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/agent-prototyping.md): giving the agent the system, and when to ask.

---

Part 5 of 9 in *The agent-ready design system*. Previous: [Part 4, How a design system reaches the agent](how-the-system-reaches-the-agent.md). Next: [Part 6, Why agent rules need the harness](agent-workflow-enforcement.md).
