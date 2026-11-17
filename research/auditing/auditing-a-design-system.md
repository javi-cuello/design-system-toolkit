# Auditing a design system for people and agents

What an audit of a Figma library is for, which ways of running one fit which team, and why an audit that doesn't know the system's own rules gets it confidently wrong.

A developer points an agent at a settings screen in Figma and asks for the code. The result renders and looks close. Then someone reads it: the toggle is a hand-built `div` with a hex grey, the spacing is `padding: 14px`, and a wrapper is called `Frame1337`. Nobody told the agent to do any of that. It read the file, and the file said exactly that: the toggle had been detached months ago, its fill unbound, its frame never renamed.

The agent didn't invent the mess. It copied it, faster than a person would have, and into code.

---

## What this answers

**Why audit**

- [What an audit buys](#what-an-audit-buys): who gains, and what
- [Messy library, messy output](#messy-library-messy-output): why library defects reappear in generated UI
- [What an audit covers](#what-an-audit-covers): which parts of a library to check

**Ways of auditing**

- [Auditing by hand](#auditing-by-hand): what a person sees that no tool does
- [Figma's Check designs](#figmas-check-designs): what the built-in check finds
- [Library analytics](#library-analytics): what usage data tells an audit
- [Lint plugins](#lint-plugins): where community plugins fit
- [Agent audits](#agent-audits): what an LLM adds, and what it costs
- [Choosing a method](#choosing-a-method): which mix fits which team

**Running it well**

- [Audits without context](#audits-without-context): what goes wrong when the audit doesn't know the system
- [Ranking the findings](#ranking-the-findings): how to sort a long list into work
- [Audit cadence](#audit-cadence): one-off, recurring or continuous

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs. This piece sits beside the series *The agent-ready design system* and links to it where the series covers a topic.

---

# Part one: why audit

## What an audit buys

An audit turns drift nobody can see into a list of named items someone can fix, and the same list pays three readers: the designers who use the library, the agents that read it, and the product built from both.

Drift is quiet by nature. A designer detaches a button to change its padding on a deadline. Another picks `#6B7280` from a screenshot because the token was hard to find. Each choice is reasonable, each file still looks right, and nothing announces that the library and its screens have stopped agreeing. Salesforce found thousands of such detaches across its SLDS 2 components, each one a copy that no longer receives accessibility, behaviour or branding fixes; the numbers, and how to read them, are in [detaches](../figma-and-code/measuring-design-system-adoption.md#detaches).

People gain time and a library they trust: Figma's 2019 task study, the one measured figure, is weighed in [design and code together](../figma-and-code/measuring-design-system-adoption.md#design-and-code-together). Agents gain lookups where they would otherwise guess, since a bound colour becomes a token in their output and an unbound one a hex value. The product gains changes that land everywhere: a rebrand or a new focus ring reaches every screen whose instances are attached and whose values are bound, and misses the rest.

Pitch the audit by what it protects. **Tell stakeholders which changes the library can no longer deliver everywhere, and how many places that is.** Most circulating ROI figures trace back to one model, Speicher and Baena Wehrmann's 135 percent for a hypothetical company, which its authors call an approximation ([Smashing, the ROI of a design system](https://www.smashingmagazine.com/2022/09/formula-roi-design-system)); if you quote it, say it is a model.

---

## Messy library, messy output

Generated UI inherits the library's defects one for one: an agent reading a Figma file turns each unbound value into a raw value, each detached component into hand-written markup, and each vague name into a guess.

Back to the settings screen. The agent reached the file through Figma's MCP server, which hands an agent the selected frame as structured data: layers, properties, bound variables, and where a team has set it up, the mapped code component. Whatever that data leaves out, the agent fills in. The mechanism is retrieval, not reasoning, and the series' [Part 2](../ai-and-docs/what-the-library-carries-for-an-agent.md) covers it in depth. monday.com's engineers saw it when developers pasted Figma links into Cursor: the output hard-coded its colours and overrode type defaults, and their diagnosis was "Without that context, it guessed" ([monday.com engineering](https://engineering.monday.com/how-we-use-ai-to-turn-figma-designs-into-production-code/)).

Here is what the agent did with each defect in the settings screen.

<svg role="img" viewBox="0 0 680 290" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Three library defects and the code an agent writes from each. A detached toggle becomes a hand-built div. A fill of #6B7280 with no variable becomes color #6B7280. A frame named Frame 1337 becomes a wrapper called Frame1337. On the right, the same three after an audit: an attached Switch instance becomes an import of Switch, a fill bound to text/subtle becomes var(--text-subtle), a frame named settings-row becomes a SettingsRow.</title>
<rect x="0" y="0" width="680" height="290" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">In the file</text>
<text x="180" y="30" font-size="14" font-weight="600" fill="#1a1a1a">What the agent writes</text>
<text x="370" y="30" font-size="14" font-weight="600" fill="#1a1a1a">After the audit</text>
<text x="530" y="30" font-size="14" font-weight="600" fill="#1a1a1a">What it writes now</text>
<rect x="20" y="48" width="140" height="56" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="30" y="72" font-size="13" fill="#1a1a1a">Toggle, detached</text>
<text x="30" y="92" font-size="12" fill="#5a5850">a frame of shapes</text>
<rect x="180" y="48" width="170" height="56" rx="6" fill="#fbeee9" stroke="#d9a593"/>
<text x="190" y="81" font-size="12" font-family="ui-monospace, monospace" fill="#8a2f12">&lt;div class="toggle"&gt;</text>
<rect x="370" y="48" width="140" height="56" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="380" y="72" font-size="13" fill="#1a1a1a">Switch instance</text>
<text x="380" y="92" font-size="12" fill="#5a5850">attached, mapped</text>
<rect x="530" y="48" width="130" height="56" rx="6" fill="#eaf3ea" stroke="#9cc29c"/>
<text x="540" y="81" font-size="12" font-family="ui-monospace, monospace" fill="#1f5a1f">&lt;Switch /&gt;</text>
<rect x="20" y="120" width="140" height="56" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="30" y="144" font-size="13" fill="#1a1a1a">Fill #6B7280</text>
<text x="30" y="164" font-size="12" fill="#5a5850">no variable</text>
<rect x="180" y="120" width="170" height="56" rx="6" fill="#fbeee9" stroke="#d9a593"/>
<text x="190" y="153" font-size="12" font-family="ui-monospace, monospace" fill="#8a2f12">color: #6B7280</text>
<rect x="370" y="120" width="140" height="56" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="380" y="144" font-size="13" fill="#1a1a1a">Fill bound to</text>
<text x="380" y="164" font-size="12" fill="#5a5850">text/subtle</text>
<rect x="530" y="120" width="130" height="56" rx="6" fill="#eaf3ea" stroke="#9cc29c"/>
<text x="540" y="153" font-size="11" font-family="ui-monospace, monospace" fill="#1f5a1f">var(--text-subtle)</text>
<rect x="20" y="192" width="140" height="56" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="30" y="216" font-size="13" fill="#1a1a1a">Frame 1337</text>
<text x="30" y="236" font-size="12" fill="#5a5850">default name</text>
<rect x="180" y="192" width="170" height="56" rx="6" fill="#fbeee9" stroke="#d9a593"/>
<text x="190" y="225" font-size="12" font-family="ui-monospace, monospace" fill="#8a2f12">&lt;div class="Frame1337"&gt;</text>
<rect x="370" y="192" width="140" height="56" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="380" y="216" font-size="13" fill="#1a1a1a">settings-row</text>
<text x="380" y="236" font-size="12" fill="#5a5850">named for its job</text>
<rect x="530" y="192" width="130" height="56" rx="6" fill="#eaf3ea" stroke="#9cc29c"/>
<text x="540" y="225" font-size="12" font-family="ui-monospace, monospace" fill="#1f5a1f">&lt;SettingsRow&gt;</text>
<text x="20" y="276" font-size="12" fill="#5a5850">Illustrative. Left: the defects an audit flags. Right: what the agent reuses once they are fixed.</text>
</svg>

Every red box on the left is something an audit catches; every green box on the right is something the agent could only write because the library now says it.

Figma's guidance on [structuring a file for its MCP server](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file) reads like an audit checklist. Its seven recommendations, in order: use components, connect them to code with Code Connect, use variables, name layers clearly, use auto layout, add annotations, add dev resources. Code Connect is the mapping from a Figma component to its code component; without it, the agent guesses which code component a drawing stands for.

A library audited for people is most of the way to one audited for agents. What agents add is literalness: a person reads past "Frame 1337" and a hex value that happens to match the token; an agent can't.

Audit the library before you connect an agent to it, not after the first bad output. **Treat every unbound value, detached instance and default layer name as a line of code the agent will write wrong.** *Weight: moderate.* Figma's own guidance and every team report found say so; how much cleaning improves the output has been measured only by vendors (the series' [Part 9](../ai-and-docs/measuring-agent-readiness.md) covers what exists).

---

## What an audit covers

A useful audit checks a library at two levels, each component and the file as a whole, across a short list of areas where drift hides; the list is the same for people and agents, but agents raise the stakes on names, descriptions and properties.

Even the reattached Switch has more tests to pass: a track colour bound to a semantic token like `surface/selected`, a disabled state that differs in more than opacity, a label property named as code names it. One working audit groups such tests into these areas:

- **Token use.** Every fill, stroke, radius, gap and padding bound to a variable; text set with a text style.
- **The tokens themselves.** One naming grammar, semantic tokens over primitives in components, descriptions that say when to use each.
- **Token links.** Bindings that resolve to the library the file is meant to use, not a retired copy.
- **Properties.** Axes, booleans and text properties named consistently and close to their code names; none that does nothing.
- **States.** Hover, focus, pressed, disabled and error drawn where the component has them, each with its own tokens.
- **Structure and hygiene.** Auto layout, no default layer names, no stray groups or hidden layers.
- **Descriptions.** What the component is for, when not to use it, and its name in code.
- **Accessibility.** Contrast in every mode, focus indicators, target sizes, text that can grow without clipping.
- **Right to left.** Padding and icons that mirror, where the product ships to Arabic or Hebrew readers.
- **File structure.** Page order, naming across the library, parts that carry their parent's name.
- **Icons.** One size system, bound colours, names that say what the icon shows.
- **Platform fit.** Whether the target platform can build it as drawn: a centre-aligned stroke has no direct CSS equivalent.

The first four matter most to an agent, which reads them to choose and fill in a component. The series' [Part 1](../ai-and-docs/what-makes-a-design-system-agent-ready.md#layers-of-readiness) sets out which layers of a system carry readiness; this list is the Figma half of it.

Start with token use and properties on your five most-used components. **Audit the file as a whole as well as component by component, since page order and name collisions never show up in a component-by-component walk.** *Weight: weak.* The area list is one working audit's, not a published standard.

---

# Part two: ways of auditing

## Auditing by hand

A person walking the library is the only audit that sees intent, and it is slow, inconsistent between auditors and impossible to repeat every week.

A designer opens the settings screen and the Switch side by side and notices that the screen's toggle is a few pixels taller than the library's. No tool flags that: the toggle is attached, every value is bound, and the height comes from a padding override that is itself a token. The designer knows it looks wrong.

The classic method is Brad Frost's interface inventory: screenshot every instance of each kind of thing in a product, group them, and look at the spread ([Frost, interface inventory](https://bradfrost.com/blog/post/interface-inventory/); [*Atomic Design*, chapter 4](https://atomicdesign.bradfrost.com/chapter-4/)). Pointed at a library, it shows how many near-duplicate cards survive. It gives judgement of intent, a sense of what's missing, and a conversation with the people who'll fix it; it costs hours per component, depends on who audits, and never re-runs to say whether a fix held.

**A person should spend their audit time on intent and gaps, not on counting unbound fills.** *Weight: weak.* One author argues that split; the tools below exist because hand counting doesn't scale.

---

## Figma's Check designs

Check designs is Figma's built-in, deterministic check: it finds hard-coded values, detached components, components from libraries the file doesn't use and contrast failures in a selection, and suggests library replacements, on Organization, Enterprise, Government and K-12 Education plans.

A designer selects the settings screen and opens Check designs. It lists the `#6B7280` fill and suggests `text/subtle`, the `14` padding and the nearest spacing variable, and the detached toggle. One click applies a suggestion; another applies all of them. Figma's help page says it uses no LLM: suggestions are ranked by how close a variable's value is, by naming and hierarchy, and by how often the variable is used ([Figma, Check designs](https://help.figma.com/hc/en-us/articles/39592284074263)), so two runs say the same thing. Its history and what it reports for adoption are in [raw values](../figma-and-code/measuring-design-system-adoption.md#raw-values).

Its limits come from the same design. It replaces values but not components, so a detached instance is swapped back by hand. It can't swap colour styles. It runs on one page at a time, capped at 25,000 layers. And it checks against the connected libraries, not the system's own rules. That last limit is where it misfires: within days of its launch on 4 June 2026, designers asked on Figma's forum for a way to ignore suggestions, because deliberate exceptions such as disabled states, which WCAG doesn't require to pass contrast, were being flagged ([forum request](https://forum.figma.com/suggest-a-feature-11/check-designs-ignore-or-exclude-suggestions-54643)).

**A worked case.** Say Check designs reports 47 items on your settings screen, and 6 are disabled-state contrast failures. Apply all 47, and six disabled toggles get darker text and stop looking disabled. Apply in groups instead: values first, contrast by hand.

Use Check designs as the everyday check on screens if your plan has it. **Apply its value suggestions in bulk and its contrast suggestions one at a time.** For the library itself, its blindness to your conventions means it needs a second check beside it.

---

## Library analytics

Library analytics shows where a library is used and where it is abandoned, which makes it the best evidence of what to audit first, though it can't say why anyone detached anything.

Was the toggle one designer's shortcut, or does everyone detach it? Figma's library analytics answers that, listing per asset its instances, inserts and detaches. What it counts, what it can't see and its plans are set out in [what Figma counts](../figma-and-code/measuring-design-system-adoption.md#what-figma-counts); how to read detaches, with the Salesforce and athenahealth stories, in [detaches](../figma-and-code/measuring-design-system-adoption.md#detaches).

For an audit, one rule from there matters most: divide. A detach count says how big a component's backlog is; its detach rate, detaches over instances, says whether it is failing the people using it.

Read analytics before you audit, and pick targets by detach rate. **A high detach rate is a question for the people detaching, not a finding against them.** *Weight: weak.* The analytics shows where to look; the reason has to come from asking.

---

## Lint plugins

Community lint plugins run on any plan and check a library against generic rules, which makes them the cheapest start and the weakest at knowing what the system intends.

A team on Figma's Professional plan has neither Check designs nor library analytics. It runs a lint plugin over the Switch and gets a list: unbound fills, a missing text style, a layer named "Frame 12". FigmaLint, from the consultancy Southleft, adds component-level checks (property naming, missing states, accessibility) and a score per component ([Southleft, introducing FigmaLint](https://www.southleft.com/insights/design-systems/designing-for-developers-introducing-figmalint)).

They are cheap, fast, repeatable, and give two teams the same yardstick. The catch is whose rules they apply: the plugin author's. One that wants every radius bound flags a deliberate `0`, and one that lags Figma's API (slots, new variable types) reports what it can't read as missing.

Use a lint plugin when your plan has no built-in check, or as a fast first pass. **Before trusting its count, check three of its findings against your own conventions.** How often a generic linter misreads deliberate choices is unmeasured for any named plugin.

---

## Agent audits

An agent audit points an LLM at the library and adds what deterministic checks can't (judging descriptions, names and intent) at the price of answers that vary between runs and confident findings that can be wrong.

Asked to audit the Switch, an agent comes back with judgements no counting tool makes: the description says what the Switch is but not when to use a Checkbox instead, and the property `Toggle` is named for the gesture, while code calls it `checked`. There are two main routes. **Figma's own agent,** in Figma Design since May 2026 (beta), can be connected to a library and asked to audit against it; Figma's [audit solution page](https://www.figma.com/solutions/ai-design-system-audit/) describes it scanning for detached components, hard-coded values and token drift. **An agent in a coding tool** (Claude Code, Cursor) reads the file through Figma's MCP server or a bridge such as Southleft's `figma-console-mcp`, running a team's own audit skill or script.

The costs are specific. The same audit, run twice, can return different lists, and a finding that comes and goes can't be closed. A wrong finding arrives in the same tone as a right one, with unknown conventions filled from training. And agent use is metered or credit-based; Figma's agent is free only during its beta.

The strongest setups split the work. A script does the counting: every unbound value, every detached instance. The agent judges only what a script can't, and filters the script's candidates against the team's recorded decisions rather than raising its own.

**Never let an agent's audit be the only record of what's wrong, because a list that changes between runs can't be worked through.** *Weight: weak.* The split is drawn from one working audit and fits the series' advice on [checks versus evals](../ai-and-docs/what-keeps-an-agent-on-track.md#evals-versus-tests); no published comparison of agent and scripted audits was found.

---

## Choosing a method

No single method covers an audit: the working mix is a deterministic check for anything countable, usage data to choose where to look, and a person or an agent for intent, chosen by plan and library size.

Each method saw something different about the same toggle: how often it's detached, its unbound fill, its height, its gesture-named property.

| Method | Finds best | Misses | Repeatable | Plan (as of Nov 2026) |
|---|---|---|---|---|
| By hand | Intent, gaps, "looks wrong" | Anything at scale | No | Any |
| Check designs | Hard-coded values, detaches, contrast on screens | The team's conventions; deliberate exceptions | Yes | Organization, Enterprise, Government, K-12 Education |
| Library analytics | Where the library is abandoned | Why | Yes | Same; API Enterprise only |
| Lint plugins | Unbound values, default names | The team's conventions | Yes | Any |
| Agent audit | Descriptions, names, intent | Stability; anything it wasn't told | No | Figma's agent: paid plans in beta; MCP: varies by seat |

A small team on Professional runs a lint plugin and a hand walk of the most-used components, then an agent for descriptions. An Organization or Enterprise team adds analytics to choose targets, Check designs on screen files and a scripted audit of the library against its conventions. A team about to connect agents does all of that on the components agents will reach first, plus a check that each has a Code Connect mapping.

**Use a deterministic check as the record, and people or agents to judge what it can't count.** *Weight: weak.* The mix is reasoning; each part is backed for its own job above.

---

# Part three: running it well

## Audits without context

An audit that doesn't know a system's own conventions reports that system's deliberate choices as defects, confidently and at scale; recording the conventions, and having a check skip rather than guess where none is recorded, fixes most of it.

Every check carries an assumption. "Fills should come from the semantic collection" assumes the audit knows which collection that is. A check that doesn't know falls back on what it does know, and that is usually some other library's answer.

**A worked case.** One audit scanner, shared across several libraries, carried constants left over from the first library it was written for: a semantic collection called `Semantic`, and a pattern for text tokens that expected `/Text/` after another segment. It was then run on a second library, whose collection is called `2. Semantic` and whose text tokens start with `Text/`.

Before reading on, work out what a correctly bound fill in the second library looks like to that check.

<svg role="img" viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same scan of one library, without and with its conventions. Left: the check expects a collection named Semantic; the library's fill comes from 2. Semantic/Surface/Muted; the scan raises 227 candidates, 157 of them reading expected Semantic, all wrong. Right: the check reads the library's own collection name, 2. Semantic; the scan raises 70 candidates, and the 157 are gone.</title>
<rect x="0" y="0" width="680" height="250" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Borrowed convention</text>
<text x="360" y="30" font-size="14" font-weight="600" fill="#1a1a1a">The library's own convention</text>
<rect x="20" y="44" width="300" height="50" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="32" y="65" font-size="12" fill="#5a5850">Check expects collection</text>
<text x="32" y="84" font-size="13" font-family="ui-monospace, monospace" fill="#1a1a1a">Semantic</text>
<rect x="20" y="104" width="300" height="50" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="32" y="125" font-size="12" fill="#5a5850">Fill, correctly bound, comes from</text>
<text x="32" y="144" font-size="12" font-family="ui-monospace, monospace" fill="#1a1a1a">2. Semantic/Surface/Muted</text>
<rect x="20" y="164" width="300" height="66" rx="6" fill="#fbeee9" stroke="#d9a593"/>
<text x="32" y="190" font-size="22" font-weight="700" fill="#8a2f12">227 candidates</text>
<text x="32" y="214" font-size="13" fill="#8a2f12">157 read "expected Semantic", all wrong</text>
<rect x="360" y="44" width="300" height="50" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="372" y="65" font-size="12" fill="#5a5850">Check reads the recorded collection</text>
<text x="372" y="84" font-size="13" font-family="ui-monospace, monospace" fill="#1a1a1a">2. Semantic</text>
<rect x="360" y="104" width="300" height="50" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="372" y="125" font-size="12" fill="#5a5850">Same fill, same binding</text>
<text x="372" y="144" font-size="12" font-family="ui-monospace, monospace" fill="#1a1a1a">2. Semantic/Surface/Muted</text>
<rect x="360" y="164" width="300" height="66" rx="6" fill="#eaf3ea" stroke="#9cc29c"/>
<text x="372" y="190" font-size="22" font-weight="700" fill="#1f5a1f">70 candidates</text>
<text x="372" y="214" font-size="13" fill="#1f5a1f">the 157 never generated</text>
</svg>

The scan raised 227 candidates. 157 of them said `fill from 2. Semantic/Surface/Muted (expected Semantic)`, against bindings that were all correct, and the text-token pattern failed the same way. Nothing errored; each finding was plausible and neatly worded. Given the library's own collection name, spacing scale and text pattern, the same scan raised 70 candidates, and the 157 stopped being generated, because they had never been about that library.

That is the failure to fear. A wrong finding that looks wrong gets fixed. 157 that look right teach a maintainer that the tool is noise, and the 70 real ones go down with them. The same shape shows up elsewhere: Check designs flags disabled states that may fail contrast, a check that inferred a "retired" library from a collection publishing no variables was wrong on three findings of four, and an agent with no conventions in front of it applies those of the public libraries it was trained on.

Context means three kinds of record:

- **Conventions:** the facts a check needs (which collection is semantic, the spacing scale, the name separator, which pages hold components).
- **Decisions:** rulings that could go either way, such as "disabled states are exempt from contrast".
- **Exceptions:** named items that knowingly break a rule, each with a reason.

The rule that made the difference is stronger than "set the defaults right": a check whose convention isn't recorded is skipped and reported as not checked, never run on a borrowed default. Precision beats coverage, for the reason the Ditto team gave for its copy linter: false positives cost trust in aggregate, while a missed suggestion costs almost nothing ([Quinn Keast, AI style guides for product copy](https://quinnkeast.com/writing/what-we-learned-building-ai-style-guides-for-product-copy)).

Write your conventions, decisions and exceptions down where the audit (and any agent) can read them, before the first scan. **If the audit can't find a convention, have it skip the check and say so, rather than guess.** *Weight: strong.* Recording conventions is common advice, and skip-don't-guess was measured on one run of 157 avoidable findings.

---

## Ranking the findings

Sort audit findings by the action they need (a safe mechanical fix, a decision, or a question for someone) and within each by what the defect costs, because a single severity scale mixes items one person can fix in a minute with ones that need a meeting.

The settings-screen audit, run across the library, returns 300 findings. Sorted by severity alone, the top mixes 120 unbound paddings a script could bind in seconds, a `Toggle` property that needs renaming in Figma and code together, and a question about whether the disabled state should exist at all. Grouping by action makes the list workable:

1. **Safe fixes.** Mechanical, reversible, no one's decision: bind a raw value that matches a token exactly, rename a default layer. A script or Check designs applies these in bulk.
2. **Decisions.** Changes consumers will see or that touch code: renaming a property, merging near-duplicates, retiring a token. These go to the system's owner, with the cost of each option.
3. **Questions.** Things the audit can't judge: a deliberate-looking exception, an off-scale 80 that may be a progress bar's fill, a detach spike. These go to the people closest to the work.

Within each group, rank by how many instances or screens the defect reaches (from analytics) and whether an agent will read it (the first four areas in [what an audit covers](#what-an-audit-covers)). And a finding count isn't a health score: 300 findings where 250 are one-click bindings is a healthier library than 40 where 30 are naming decisions, so show the count by group; the series' [Part 9](../ai-and-docs/measuring-agent-readiness.md#showing-readiness) argues the same for readiness.

**Order the queue by who has to act, then by how far the defect reaches.** *Weight: weak.* The three groups come from one working audit's fix queue; design-debt commentary scores severity, reach and effort, and no design system's own model was found.

---

## Audit cadence

Run one full audit to set a baseline, then keep it current with checks that run on every change and a lighter recurring pass, because a one-off audit starts going stale the day it's delivered.

Six weeks after the settings-screen audit, someone detaches the Switch again. The report still says it's fixed. Nothing re-ran. Teams that keep a system healthy run three rhythms at once:

- **A baseline audit,** once and again after a major change (a rebrand, a library split, a migration). Full, slow and partly by hand.
- **A recurring pass,** weekly to quarterly. Figma's audit page suggests monthly or quarterly for its agent; Pinterest's adoption scan ran nightly over recently edited handoff files ([what Figma counts](../figma-and-code/measuring-design-system-adoption.md#what-figma-counts)).
- **A gate on every change,** where a script can check the rule. In code that is a lint rule, such as Atlassian's [`ensure-design-token-usage`](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage). Hardik Pandya's token audit script blocks a commit on any hard-coded colour or spacing; his project went from 418 hard-coded values across 28 files to none ([Pandya, expose your design system to LLMs](https://hvpandya.com/llm-design-systems)).

Figma has no gate on publishing a library, so the Figma side relies on the recurring pass, and that pass must give the same list each run, so a finding closes when it's fixed and only then.

**An audit that doesn't re-run can only tell you how the library was, not how it is.** *Weight: moderate.* The systems found all check continuously; the cadence should follow how often the library changes.

---

## Cheat sheet

| Situation | Do | Don't |
|---|---|---|
| Pitching the audit | Name the changes the library can't deliver everywhere | Quote a modelled ROI as a measured one |
| About to connect an agent | Audit token use, properties, names and Code Connect first | Wait for the first bad output |
| Choosing what to audit first | Rank components by detach rate (detaches ÷ instances) | Rank by raw detach count |
| On Professional | Lint plugin plus a hand walk | Assume Check designs is there |
| On Organization or Enterprise | Analytics, then Check designs on screens, then a scripted library audit | Rely on Check designs for the library's own conventions |
| Using Check designs | Apply values in bulk, contrast one by one | "Apply all" over disabled states |
| Using an agent | Descriptions, names, intent; filter a script's candidates | Make its list the record |
| A convention isn't recorded | Skip the check and say "not checked" | Fall back on a default |
| A long findings list | Group by safe fix, decision, question | Rank everything on one severity scale |
| After the audit | Recurring deterministic pass; lint gate in code | Treat the report as current |

---

## The short version

An audit turns quiet drift (detached instances, raw values, default names) into a list someone can fix. People gain time, the product gains changes that land everywhere, and agents gain lookups where they'd otherwise guess, since an agent reads a Figma file literally. Audit the library before you connect an agent, starting with token use, properties, names and Code Connect mappings.

No one method covers it. Analytics tells you where to look (rank by detach rate). Check designs finds hard-coded values and detaches on screens but can't tell deliberate exceptions from mistakes; lint plugins do similar work on any plan with the author's rules. A person sees intent; an agent judges descriptions and names but varies between runs. Use a deterministic check as the record.

Write your conventions, decisions and exceptions down before the first scan: one scanner raised 157 confident, wrong findings because it assumed another library's collection name. If a convention isn't recorded, the check should skip and say so.

Sort findings by who has to act, then by reach. Do one baseline audit, then a recurring deterministic pass, and a lint gate wherever the system reaches code. Auditing before agents and continuous checking weigh moderate; skip-don't-guess weighs strong; the mix of methods, the sort and the cadence weigh weak.

---

## What to re-check later

Researched 14 November 2026, against Figma's help centre, developer docs and blog, the team write-ups linked below, and one toolkit's audit skills and test cases. Re-checked 17 November 2026: Check designs' dates and plans, and the MCP file guidance (seven recommendations).

- **Check designs**: early access from October 2025, launched 4 June 2026 for Organization and Enterprise; the help page now also lists Government and K-12 Education, not Professional. No ignore option as of November 2026; if one ships, the contrast advice changes.
- **Code Connect plan.** The docs now list Professional, Organization and Enterprise (Dev or Full seat); earlier docs said Organization and Enterprise only.
- **Figma's agent** (20 May 2026) is in beta with no credit cost; credits apply at general availability.
- **The 157-finding case and the mode-pin check** come from one toolkit's audit test cases and notes, anonymised. The scanner was scripted; that agents fail the same way is inference.
- **The evidence base is Western and vendor-heavy**, and no user-outcome research on audits was found.

---

## Sources

**Primary: Figma**

- [Figma help, Check designs](https://help.figma.com/hc/en-us/articles/39592284074263)
- [Figma forum, Check designs launch post (4 June 2026)](https://forum.figma.com/product-updates-3/check-designs-catch-what-s-off-ship-what-s-right-54551)
- [Figma forum, request to ignore or exclude suggestions (June 2026)](https://forum.figma.com/suggest-a-feature-11/check-designs-ignore-or-exclude-suggestions-54643)
- [Figma help, track library and component usage](https://help.figma.com/hc/en-us/articles/360039238353-Track-library-and-component-usage)
- [Figma developer docs, structure your Figma file for the MCP server](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file)
- [Figma developer docs, Code Connect](https://developers.figma.com/docs/code-connect)
- [Figma help, work with the Figma agent in design files](https://help.figma.com/hc/en-us/articles/37998629035799-Work-with-the-Figma-agent-in-design-files)
- [Figma blog, *The Figma Design Agent is here* (20 May 2026)](https://www.figma.com/blog/the-figma-agent-is-here/)
- [Figma, AI design system audit](https://www.figma.com/solutions/ai-design-system-audit/)

**Primary: design system teams**

- [monday.com engineering, AI from Figma designs to production code (2 February 2026)](https://engineering.monday.com/how-we-use-ai-to-turn-figma-designs-into-production-code/)
- [Atlassian, ESLint rule `ensure-design-token-usage`](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage)
- [Southleft, *Designing for developers: introducing FigmaLint* (2 July 2025)](https://www.southleft.com/insights/design-systems/designing-for-developers-introducing-figmalint)
- One toolkit's audit skills (a components audit's test cases and a foundations audit). Cited anonymously; not resolved to a public URL.

**Commentary**

- [Brad Frost, *Interface inventory*](https://bradfrost.com/blog/post/interface-inventory/) and [*Atomic Design*, chapter 4](https://atomicdesign.bradfrost.com/chapter-4/)
- [Smashing Magazine, Speicher and Baena Wehrmann, *One formula to rule them all: the ROI of a design system* (9 September 2022)](https://www.smashingmagazine.com/2022/09/formula-roi-design-system)
- [Hardik Pandya, *Expose your design system to LLMs*](https://hvpandya.com/llm-design-systems)
- [Quinn Keast, *What we learned building AI style guides for product copy* (August 2025)](https://quinnkeast.com/writing/what-we-learned-building-ai-style-guides-for-product-copy)

**Elsewhere in the magazine**

- [Measuring design system adoption](../figma-and-code/measuring-design-system-adoption.md): library analytics, detaches (Salesforce, athenahealth), Figma's 2019 study, Pinterest's and Shopify's figures.
- The series: [Part 1](../ai-and-docs/what-makes-a-design-system-agent-ready.md), [Part 2](../ai-and-docs/what-the-library-carries-for-an-agent.md), [Part 5](../ai-and-docs/what-keeps-an-agent-on-track.md), [Part 9](../ai-and-docs/measuring-agent-readiness.md).

---

A companion to *The agent-ready design system*, written for a workshop day on auditing a design system.
