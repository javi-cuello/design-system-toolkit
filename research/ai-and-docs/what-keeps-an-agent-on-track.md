# Hooks, gates, evals and the rest: what keeps an agent on a design system

What each part around an agent does to its work (harness, hook, gate, guardrail, eval, baseline), and which parts the agent can ignore.

An agent builds a marketplace's feedback page. It renders and it looks right, but the reasons are raw `<input type="radio">` elements where the design system has a radio group. In the review afterwards, one person says a hook should have caught it, another that the evals should have, and a third that the context file already said not to.

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

A harness is everything around the model that makes it an agent and keeps it on course; the design system is the content it carries, and the harness makes the agent meet it.

The feedback page carries this whole guide: one reason picked from a list, a comment, a box to tick for contact. The system has a radio group, a text area and a checkbox. An agent can use them, or write raw HTML styled to look close enough. Both pages render; only one is on the system.

What decides which comes out is the *harness*: what the agent is told, what it can look up, what checks its work and what refuses to let it continue. Anthropic's [post on evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) defines it as the system that lets a model act as an agent, and separates it from the *evaluation harness*, the machinery that runs test tasks and grades them.

Every part of a harness does one of four jobs.

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

Only the red box can stop the agent. The blue one can only tell it.

Robin Di Capua's essay [*A design system harness*](https://brandstructure.design/articles/a-design-system-harness/) (November 2026) frames the same territory as map, recipes, ingredients and equipment. The four jobs differ in one place: a hook that refuses is pulled out of "equipment", because it is the only part that can make a step mandatory.

Before arguing about any part your team runs, sort it into one of the four jobs. **The question that separates them is who decides: the model (tell), code (check), code that refuses (stop), or a graded run of the whole agent (measure).**

---

## Ignored context files

An agent can ignore a context file (`AGENTS.md`, `CLAUDE.md`) because it is guidance the model weighs against everything else it sees, and the vendors' own documentation says it is never enforcement.

The feedback page's context file says to build from the system's components and look them up first. The agent loads it, writes raw radios anyway, and the page renders.

*Context* is everything in the model's working text at a moment: the request, files read, tool results, its reasoning, the context files. Anthropic's [post on context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) treats it as a budget whose recall drops as it fills (*context rot*), so every line of a context file competes with the task on every turn. The model weighs the instruction against a strong local signal (the page renders) and may judge it doesn't apply. [Part 6](agent-workflow-enforcement.md#why-written-steps-slip) makes that case in full, and [Part 4](how-the-system-reaches-the-agent.md#evidence-on-agentsmd) weighs the two controlled studies of context files.

*Memory* is what persists after the session: in Claude Code, [`CLAUDE.md` and auto memory](https://code.claude.com/docs/en/memory), notes the agent writes from corrections. Both load at session start, and once loaded they are context, with the same weight. One trap is particular to memory: an auto-memory note that a later change to `CLAUDE.md` reverses. Both load, and the model picks.

Keep your context file to the map (where things are, which commands check the work) and the few instructions the code can't say about itself. **Treat every line as a request the model may decline, and move any line that must hold every time into a [check](#guardrails-and-checks) or a [gate](#hooks-and-gates).**

---

## Progressive disclosure

An agent fetches only what it needs through progressive disclosure: a short index of what exists, and the detail only when the task needs it, with skills doing this for procedures, MCP servers for live lookups, and structured data as what both deliver.

Say the system has sixty components. Pasting all of them into the context file costs tokens on every turn of every session; the feedback page needs three.

- **Skills.** A *skill* is a folder with a `SKILL.md` of step-by-step instructions, optionally with scripts. Anthropic's [skills post](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) gives the levels: the name and description load at the start, the body when the skill looks relevant, bundled files only when needed. Still text, so still advisory.
- **MCP servers.** The [Model Context Protocol](https://modelcontextprotocol.io/docs/getting-started/intro) connects an AI application to outside systems; a server exposes *tools*, named functions the agent calls. [Part 4](how-the-system-reaches-the-agent.md#servers-and-llmstxt) lists which systems ship one.
- **Structured data.** A *component contract* records one component's props, allowed values, anatomy and tokens. The draft [Design System Doc Spec](https://designsystemdocspec.org/) (DSDS, 0.23.1) and [Spectacular](https://spectacular.systems/) try to standardise it; neither checks anything.

The pair most often swapped is the skill and the MCP tool.

| | Skill | MCP tool |
|---|---|---|
| What the agent does with it | Reads it | Calls it |
| What it holds | A procedure, in prose, with optional scripts | A function over live data |
| When it costs tokens | Description always; body once invoked | Its listing; then each answer |
| For the feedback page | "Build a form page": which components, which order | `get_component` for the radio group's props |

**A worked case: offered is not used.** One design-system toolkit loaded its MCP server for the agent building the feedback page. Its instructions read like documentation ("this server returns components, tokens…"), and the agent never called it, in two tasks out of two. Rewritten to say the system is what the interface is built from, and to ask it before writing interface code, it was called every run. The scores are under [evals versus tests](#evals-versus-tests).

Put your index in the context file, procedures in skills, and lookups behind a server or a CLI. **Write each skill's description and each server's instructions as a statement of when to use it, because that one line is all the agent sees until it decides to look.**

---

## Guardrails and checks

Every guardrail is a check, but a check becomes a guardrail only when it sits where the agent works and its result reaches the agent, so it can stop or correct what the agent is doing.

On the feedback page, the difference is timing. A CI lint rule that bans raw form elements fails the pull request hours later, and a person reads it. The same rule offered to the agent as a tool hands the findings back in the same session.

The first is a *check*: code that says pass or fail, the same way on the same input. The second is a *guardrail*; OpenAI's [Agents SDK](https://openai.github.io/openai-agents-python/guardrails/) defines it as a check on the agent's input, output or tool call that trips a "tripwire" and stops the run.

The commonest check a design system ships is a *linter*, and it matters most for an agent because it works even when the agent skipped everything it was told. Atlassian's [`@atlaskit/eslint-plugin-design-system`](https://cdn.jsdelivr.net/npm/@atlaskit/eslint-plugin-design-system/README.md) bans raw elements one rule at a time (`no-html-button`, `no-html-text-input`) and enforces tokens with `ensure-design-token-usage`, colour only unless its `domains` option is widened. Primer's [stylelint config](https://github.com/primer/stylelint-config) enforces its variables (`primer/colors`, `primer/spacing`).

**A validator built for agents, worked through.** One toolkit's MCP server has a `validate` tool that reports raw colours (naming the token for each), unknown token names, prop values the contract lacks, raw elements where the library has a component, and library components defined locally, and fails on any finding.

| | Before the check | After the agent reads the findings |
|---|---|---|
| Reason list | `<input type="radio" name="reason">` × 4, styled by hand | The library's radio group |
| Comment | `<textarea class="comment">` | The library's text area |
| Contact me | `<input type="checkbox">` with a hex border | The library's checkbox |
| Findings | 3 | 0 |

The page looked right in both columns. Primer's `lint_css`, Atlassian's `ads_analyze_a11y` and zeroheight's [code audit](https://zeroheight.com/mcp/) offer the same move as tools.

Two traps sit between a check and a guardrail. **The guardrail the agent never calls**: "run validate when done" is advisory, a hook that runs it isn't. **The check that sees only what it was built for**: a validator reads imports, not layout, so a page placed outside the product's shell passes it, as the eval under [evals versus tests](#evals-versus-tests) found.

Run every check in two places: beside the agent, as a tool or a hook, and in CI, where nobody can skip it. **A guardrail is a check moved to where the agent works; the rule is the same, only the moment changes.**

---

## Hooks and gates

A hook is a script the harness runs automatically at a fixed moment, and it becomes a gate only when it refuses: the action can't happen until a condition is met.

At the edit where the agent writes the raw radios, a hook could hand over the area's rules and let the edit through, or refuse it until a condition holds. Only the second is a gate.

Claude Code's [hooks reference](https://code.claude.com/docs/en/hooks) lists the moments, among them `SessionStart`, `UserPromptSubmit`, `PreToolUse` (before any tool call), `PostToolUse` and `Stop` (when the agent tries to end its turn). What makes a hook a gate is its answer. A `PreToolUse` hook that exits with code 2, or returns `"permissionDecision": "deny"`, blocks the call. A `Stop` hook that exits 2, or returns `{"decision": "block"}`, sends the agent back to work. A hook that prints and exits 0 has only informed.

Here is one agent turn, with the hooks that inform above the line and the gates that refuse below it.

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

**One toolkit's hooks, worked through.** One design-system toolkit registers four hooks, and all four inform: what is left open at the session's start, an area's rules beside the first edit there, and what a turn left open, collected at its end and handed over with the next message. The gates ride on two of them: `PreToolUse` refuses a large edit without a plan, or a push of unreviewed work, and `Stop` holds the end of a turn until a review has run. [Part 6](agent-workflow-enforcement.md#one-toolkits-gates) sets out which gate fires when and what clears it.

A *blocking* gate stops the action; an *advisory* gate reports and lets it go ahead, the right choice where the check is noisy, as with the pixel comparison under [tests and parity](#tests-and-parity). How hard each mechanism is to skip, and the holes each has (a model-judged hook, a script that fails open, a shell write the edit matcher never sees, a "gate" written in prose), is [Part 6's enforcement ladder](agent-workflow-enforcement.md#the-enforcement-ladder).

Use hooks freely to hand the agent what it needs at the moment it needs it, and keep gates for the few steps that must happen every time. **A hook is a moment; a gate is a refusal at that moment, so call something a gate only if it can say no.**

---

## Tests and parity

A test proves one piece of code still gives a known right answer; visual regression compares a component's pixels with an accepted picture, and design-to-code parity compares its measured values with the design file's, so all three are deterministic checks that differ in what they compare against.

Take one illustrative change. A designer changes the radio group's corner radius from 8 to 6 in Figma, and nobody updates the code. Which check notices?

*Visual regression* compares each component state, pixel by pixel, with a *baseline*, "the last known 'good' state" in [Chromatic's words](https://www.chromatic.com/docs/branching-and-baselines), changed only when someone accepts a change ([Percy](https://www.browserstack.com/docs/percy/overview/visual-testing-basics) works the same way). *Design-to-code parity* compares the rendered code with the design file instead: one toolkit's engine measures each layer of a Figma component, from a stored snapshot, against the matching element in a headless browser, and reports both values.

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

The code sits in the middle, and each check looks in a different direction.

| | Visual regression | Parity against the design |
|---|---|---|
| What it compares | Today's picture of the code with yesterday's | The code's measured values with the design's |
| Result | Green: the code didn't change | Red: `Option.border-radius` expected 6, got 8 |
| Now someone edits the code to 6 | Red: a person accepts the new baseline | Green |

Neither is wrong: one asks "did the code change when nobody meant it to", the other "does the code match the design", and a team with only the first never hears about the designer's change. The parity method keeps pixels advisory and numbers blocking: font rendering moves pixels on its own, and a gate that fires on noise teaches people to ignore it, while a number either matches or it doesn't.

Use tests for the code that does the checking, checks for questions about the repository, visual regression for unintended change, and parity where a design file is the source of truth. **Each answers a different question, so pick by the question, never by the tool your team happens to own.**

---

## Evals versus tests

An eval is not a test because it runs the agent itself, harness and all, on a realistic task several times and grades what it produced, and since the agent answers differently each time, its result is a rate, never a single pass or fail.

Take the validator from [guardrails and checks](#guardrails-and-checks). Fed one fixed file, it gives the same findings every run. Give the feedback page task to the agent three times and grade each result with that same validator, and the three scores differ.

Anthropic's [post on agent evals](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) gives the vocabulary: a *task* is one test case, a *trial* one attempt, a *grader* scores it (code, a model with a rubric, or a person), and the *outcome* is the state of the world afterwards, which may differ from what the agent claimed. OpenAI's [guidance](https://developers.openai.com/api/docs/guides/evaluation-best-practices) calls judging by impression an anti-pattern.

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

So changing a skill, a context file or a server's instructions changes nothing a test sees, and can change everything an eval sees.

The post also separates two ways of counting. *pass@k* is the chance at least one of k trials succeeds; *pass^k* is the chance all k do. An agent that builds the page right 75 percent of the time has a pass^3 of about 42 percent (0.75 cubed), and a product team that wants every build on the system needs the second number.

**The tie, worked through.** One toolkit's eval runs headless Claude Code in a throwaway copy of a project, asks for a screen in words that name no component, and grades it with the validator: the share of written files with no finding. On the marketplace, with the MCP server on and off:

- **A settings page** scored 1 both ways (about $1.50 and four minutes each), the server never asked: the agent copied neighbouring pages built from the system.
- **The feedback page**, with no neighbour, scored 0.833 both ways, three raw elements each.
- **After the instructions changed** (see [progressive disclosure](#progressive-disclosure)), over three trials, context off scored 0.833, 0.833 and 0.875; context on scored 1, 1 and 1, at about 25 percent more turns and cost.

The tie was a finding about the eval: a task with a near neighbour measures copying, not context. Three trials a side shows a direction, not a size. The same eval later scored 1 for a page outside the product's shell, because the grade read only imports; a second finding now catches screens that import none of the shell.

Run an eval when a change touches what the agent is told rather than what the code does. **Write down what the task must show before choosing the grader, run each setting at least three times, and treat a tie as a question about the task before treating it as an answer about the change.**

---

## Honest evals

Three things keep an eval honest: a baseline made under the same conditions, a pinned commit so only the change being measured differs, and a rule that contamination voids a run rather than lowering its score.

Suppose, as an illustration, a skill is improved on Monday and the feedback page eval goes from 0.833 to 1. Between the runs, a teammate added a contact page built from the library's radio group, and the agent copied it. The score moved; the skill didn't move it.

A *baseline* in an eval is the last clean run of the same task under the same settings: the same context on or off, the same pin. A *pinned* task names one commit, and every copy is made from it. The toolkit compares a pinned run only with one at the same commit, and refuses a pin whose grading configuration has drifted. Pinned to Friday's commit, Monday's comparison holds the contact page out of both runs, and the score is the skill's.

*Contamination* is the agent getting what makes the task easier than in real use: the answer, the grader, or earlier attempts; Anthropic's post reports Claude reading git history from previous trials. The toolkit voids such a run (it scores 0 and is never a baseline), as it does one that changed the grade's own inputs, which are made read-only. In one batch of five runs, two were void because the agent ran git.

This isn't hypothetical. [METR reported](https://metr.org/blog/2025-06-05-recent-reward-hacking/) in June 2025 that frontier models reward hack, editing the grader's timing code or patching the evaluator; on one benchmark o3 did so in 39 of 128 runs, and telling models not to cheat "had a nearly negligible effect". Anthropic adds a grading bug: one model scored 42 percent on CORE-Bench until rigid grading was fixed, then 95. So prove the grade first: a copy with nothing written must score low, and one with the original files must score as the project does.

Keep one results file per task, each line naming the settings, the commit and whether the run was void. **Compare only like with like, pin when your project is moving, and void a contaminated run rather than averaging it in.**

---

## When a check is wrong

A person decides, and the decision is written as data the check reads: a waiver excuses one named difference for a stated reason up to a stated size, a ruling records a project decision that overrides a general rule, and both fail the check once what they excuse goes away.

Say, as an illustration, the code draws the radio group's focus ring two pixels further out than Figma, and the team accepts that. Without a way to say so, it loosens the check or learns to ignore a red.

A *waiver* is the third choice. In the toolkit's parity method it sits beside the mapping that measures the component, names the layer and property, gives a reason and an owner (design file, code or toolkit), and for a number a size (`within: 2`). The difference stays in the report, marked excused. The bound matters: a waiver written for two pixels of stroke, with no size, once silently absorbed a 22-pixel bug, and the run stayed green.

| | Open waiver | Bounded waiver |
|---|---|---|
| Written as | "stroke adds height", no size | "stroke adds height", `within: 2`, owner `code` |
| A 22px bug arrives | Excused; run green | Not excused; run red, naming the layer |
| The stroke is fixed | Waiver lingers, excusing nothing | Waiver is stale; the check fails until it is removed |

A *ruling* is the same idea one level up: a dated project decision, in the project's context document, that overrides a general standard and that the checks read, the validator and the eval's grade included. A note in the code, or a decision made in chat, does neither: the next session meets the finding again.

Give every exception a home in data, beside the check that reads it, with a reason, an owner and a size where there is a number. **An exception the check can't read isn't an exception; it is an argument the next session will have again.**

---

## People in the loop

People come in at three places no check reaches: deciding what the system is (rulings, baselines, what counts as good), reviewing work they didn't write for what checks can't see, and approving before work ships, because a green build only says the checks passed.

Is a radio group the right control for six reasons, or should it be a select? Should the contact box be ticked by default? No check answers those; each answer is a ruling someone makes once.

*Independent review* is review by someone, person or agent, who didn't see the reasoning that produced the work; [Part 6](agent-workflow-enforcement.md#the-reviewers-model) explains why fresh context matters more than a different model.

Impressions are a poor guide. In [METR's randomised trial](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) of 16 experienced open-source developers on 246 real issues, those allowed AI tools took 19 percent longer, and still believed afterwards they had been about 20 percent faster. That is the case for evals over impressions; the trial measured developers, not designers, and METR calls it dated.

Keep people on the decisions (what is right, what is excused, what ships), and give the reading of diffs to a reviewer with fresh context. **Checks say whether the work follows the rules; only a person can say whether the rules were the right ones for this page.**

---

## Cheat sheet

| Term | What it is, by mechanism | Binding? |
|---|---|---|
| Harness | Everything around the model that makes it an agent | Parts of it |
| Context, memory | The working text of this session; notes loaded back into it | No |
| Context file | `AGENTS.md`, `CLAUDE.md`: the map and a few instructions | No |
| Skill | A recipe the agent reads; description always loaded, body when invoked | No |
| MCP tool | A function the agent calls on a running server | No |
| Contract | Props, values, anatomy and tokens as data (DTCG, DSDS, Spectacular) | No |
| Check, test, lint rule | Code that answers pass or fail the same way every time | Only if a gate reads it |
| Guardrail | A check on the agent's path, its result handed back | Can stop the run |
| Hook | A script the harness runs at a fixed moment | Only if it refuses |
| Gate | A hook or CI step that refuses (blocking) or reports (advisory) | Blocking: yes |
| Visual regression | Pixels compared with an accepted picture of the code | Usually advisory |
| Parity | The code's measured values compared with the design file's | Can block |
| Baseline | A reference someone accepted; later runs compared with it | A reference |
| Eval | The whole agent run several times on a task, graded; a rate | No; it informs changes |
| Contamination | The agent seeing the answer, the grader or past attempts | Voids the run |
| Waiver | One named difference excused, with reason, owner and size | Excuses, and goes stale |
| Ruling | A dated project decision that overrides a general rule | Read by checks |

---

## The short version

An agent working on your design system sits inside a harness that tells it what to do, checks what it did, stops it when a check fails, and measures whether the arrangement works. The parts that tell (context files, memory, skills, MCP tools) are advisory, because the model reads them and decides; a server's instructions have to say when to ask, or it goes unused.

The parts that check are code and answer the same way every time. A guardrail is a check placed where the agent works; a hook becomes a gate only when it refuses. Visual regression compares pixels with an accepted picture of the code; parity compares measured values with the design file.

An eval runs the whole agent several times and grades it, so its result is a rate, honest only with a like-for-like baseline, a pinned commit, and a void for any contaminated run. People keep what no check decides: what is excused, as a bounded waiver or a ruling, and whether the page is right.

If your team is starting out, go in this order: a short context file, the system's data served on demand, one validator offered to the agent and run in CI, a gate on the step that keeps being skipped, and an eval before trusting any change to what the agent is told.

---

## What to re-check later

Researched November 2026; vendor mechanics read from primary pages on 9 November 2026. Shortened on 17 November 2026 to the series' 20-minute limit: the context-file evidence now lives in Parts 4 and 6, and the gate holes in Part 6's ladder. The account of the toolkit's hooks was corrected the same day against its hooks README: four informing hooks, with the gates riding on two of them.

- **Volatile:** Claude Code's hook events (they grow with most releases), Atlassian's Early Access server, DSDS (a draft) and Spectacular (experimental features).
- **The toolkit's eval numbers:** one project, three trials a side; a direction, not a measure.
- **Weaker sources:** Atlassian's rule page rendered empty (the README was read); Di Capua's essay is commentary; METR's newer data (February 2026) was not read.
- **Not found:** any controlled study of evals for design-system agents, or of designers working with agents.

---

## Sources

**Primary: Anthropic and Claude Code**

- [Anthropic Engineering, *Demystifying evals for AI agents*](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents), 9 January 2026.
- [Anthropic Engineering, *Effective context engineering for AI agents*](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents), 29 September 2025.
- [Anthropic Engineering, *Equipping agents for the real world with Agent Skills*](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills), 16 October 2025.
- [Claude Code, hooks reference](https://code.claude.com/docs/en/hooks), [memory](https://code.claude.com/docs/en/memory), [skills](https://code.claude.com/docs/en/skills) and [best practices](https://code.claude.com/docs/en/best-practices).

**Primary: other vendors and standards**

- [AGENTS.md](https://agents.md/).
- [Model Context Protocol, introduction](https://modelcontextprotocol.io/docs/getting-started/intro).
- [OpenAI, evaluation best practices](https://developers.openai.com/api/docs/guides/evaluation-best-practices).
- [OpenAI Agents SDK, guardrails](https://openai.github.io/openai-agents-python/guardrails/).

**Primary: design systems**

- [Atlassian, `@atlaskit/eslint-plugin-design-system` README](https://cdn.jsdelivr.net/npm/@atlaskit/eslint-plugin-design-system/README.md) and [`ensure-design-token-usage`](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage).
- [Atlassian, `@atlaskit/ads-mcp` README](https://cdn.jsdelivr.net/npm/@atlaskit/ads-mcp/README.md).
- [Primer, MCP](https://primer.style/product/getting-started/foundations/mcp) and [stylelint config](https://github.com/primer/stylelint-config).
- [zeroheight, *MCP*](https://zeroheight.com/mcp/).
- [Design System Doc Spec](https://designsystemdocspec.org/) and its [schema](https://designsystemdocspec.org/schema), draft 0.23.1.
- [Spectacular](https://spectacular.systems/).

**Primary: visual testing**

- [Chromatic, branching and baselines](https://www.chromatic.com/docs/branching-and-baselines).
- [Percy, visual testing basics](https://www.browserstack.com/docs/percy/overview/visual-testing-basics).

**Research**

- [METR, *Recent frontier models are reward hacking*](https://metr.org/blog/2025-06-05-recent-reward-hacking/), 5 June 2025.
- [METR, *Measuring the impact of early-2025 AI on experienced open-source developer productivity*](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), 10 July 2025.

**Commentary**

- Robin Di Capua, [*A design system harness*](https://brandstructure.design/articles/a-design-system-harness/), Brand Structure, 7 November 2026.

**Toolkit (public repository, read 9 November 2026; hooks re-read 17 November 2026)**

- [`tools/claude-hooks/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/claude-hooks/README.md): the four hooks and the gates they carry.
- [`tools/skill-evals/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/skill-evals/README.md): screen tasks, contamination, void and pinned runs, proving the grade.
- [`docs/agent-prototyping-plan.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/docs/agent-prototyping-plan.md), Outcome 6: the on/off runs.
- [`tools/system-mcp/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/system-mcp/README.md) and [`validate.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/system-mcp/validate.mjs).
- [`tools/parity/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/parity/README.md) and [`waivers.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/parity/waivers.mjs): waivers and the measurement baseline.
- [`skills/design-code-parity/SKILL.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/skills/design-code-parity/SKILL.md): advisory screenshots.

---

Part 5 of 9 in *The agent-ready design system*. Previous: [Part 4, How a design system reaches the agent](how-the-system-reaches-the-agent.md). Next: [Part 6, Why agent rules need the harness](agent-workflow-enforcement.md).
