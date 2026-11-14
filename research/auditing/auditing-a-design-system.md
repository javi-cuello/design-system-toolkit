# Auditing a design system for people and agents

What an audit of a Figma library is for, which ways of running one fit which team, and why an audit that doesn't know the system's own rules gets it confidently wrong.

A developer points an agent at a settings screen in Figma and asks for the code. The result renders and looks close. Then someone reads it: the toggle is a hand-built `div` with a hex grey, the spacing is `padding: 14px`, and a wrapper is called `Frame1337`. Nobody told the agent to do any of that. It read the file, and the file said exactly that: the toggle had been detached months ago, its fill unbound, its frame never renamed.

The agent didn't invent the mess. It copied it, faster than a person would have, and into code. That is the case for auditing the library first.

---

## What this answers

**Why audit**

- [What an audit buys](#what-an-audit-buys): who gains from an audit, and what
- [Messy library, messy output](#messy-library-messy-output): why library defects reappear in generated UI
- [What an audit covers](#what-an-audit-covers): which parts of a library to check

**Ways of auditing**

- [Auditing by hand](#auditing-by-hand): what a person sees that no tool does
- [Figma's Check designs](#figmas-check-designs): what the built-in check finds, and on which plans
- [Library analytics](#library-analytics): what usage and detach data can and can't tell
- [Lint plugins](#lint-plugins): where community plugins fit
- [Agent audits](#agent-audits): what an LLM adds, and what it costs
- [Choosing a method](#choosing-a-method): which mix fits which team

**Running it well**

- [Audits without context](#audits-without-context): what goes wrong when the audit doesn't know the system
- [Ranking the findings](#ranking-the-findings): how to sort a long list into work
- [Audit cadence](#audit-cadence): one-off, recurring or continuous

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs. This piece sits beside the nine-part series *The agent-ready design system* (in `../ai-and-docs/`) and links to it where the series already covers a topic.

---

# Part one: why audit

## What an audit buys

An audit turns drift nobody can see into a list of named items someone can fix, and the same list pays three readers: the designers who use the library, the agents that read it, and the product built from both.

Drift is quiet by nature. A designer detaches a button to change its padding on a deadline. Another picks `#6B7280` from a screenshot because the token was hard to find. Each choice is reasonable, each file still looks right, and nothing announces that the library and the screens built from it have stopped agreeing.

Salesforce's Lightning team found this at scale. A Figma audit turned up thousands of detached instances of SLDS 2 components; their button icon alone had more than 3,000 detaches in a year, across almost a million instances. The team's write-up names the cost plainly: a detached instance stops receiving fixes to accessibility, behaviour and branding, and the drawing drifts away from the code ([Salesforce, Figma component health](https://www.salesforce.com/blog/figma-component-health/)).

**For people,** the gain is time and trust. In a 2019 experiment by Figma's data science team, designers with an up-to-date library finished a task 34 percent faster than with old files, each designer acting as their own control. The author calls that the best case, because the library fitted the task exactly ([Figma, measuring the value of design systems](https://www.figma.com/blog/measuring-the-value-of-design-systems/)). An audit is what keeps a library close to that best case rather than drifting from it.

**For agents,** the gain is fewer guesses. An agent fills every gap in a file from its training data, which is mostly public web code. A bound colour becomes a token in the output; an unbound one becomes a hex value. The next section works through how.

**For the product,** the gain is that a change made once lands everywhere. A rebrand, a contrast fix or a new focus ring reaches every screen whose instances are attached and whose values are bound, and misses every screen where they aren't.

> **Aside.** Return-on-investment figures for design systems circulate widely, and most trace back to one model. Speicher and Baena Wehrmann's Smashing article computes 135 percent ROI ($646,000 cost against $1,517,400 in gains) for a hypothetical company with 5 designers and 10 developers, built on productivity figures averaged from other studies; the authors call it an approximation resting on many assumptions ([Smashing, the ROI of a design system](https://www.smashingmagazine.com/2022/09/formula-roi-design-system)). It is a planning model, not a measurement, and vendor posts that quote it as an outcome have dropped that label.

Pitch the audit by what it protects, not by a borrowed ROI figure. **Tell stakeholders which changes the library can no longer deliver everywhere, and how many places that is.** The SLDS and Figma figures are measured; any ROI number you quote is a model, and say so.

---

## Messy library, messy output

Generated UI inherits the library's defects one for one: an agent reading a Figma file turns each unbound value into a raw value, each detached component into hand-written markup, and each vague name into a guess.

Back to the settings screen. The agent reached the file through Figma's MCP server, a connection that hands an agent the selected frame as structured data: layers, properties, bound variables, and where a team has set it up, the mapped code component. Whatever that data leaves out, the agent fills in.

So the mechanism is retrieval, not reasoning. The series' [Part 2](../ai-and-docs/what-the-library-carries-for-an-agent.md) covers it in depth; the short form is that each property of the file either gives the agent a lookup or leaves it a guess. monday.com's engineering team saw exactly this when developers pasted Figma links into Cursor: the output looked roughly right, hard-coded its colours and overrode type defaults. Their diagnosis: "Without that context, it guessed" ([monday.com engineering](https://engineering.monday.com/how-we-use-ai-to-turn-figma-designs-into-production-code/)).

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

Every red box on the left is something an audit catches; every green box on the right is something the agent could only write because the library now says it. Figma's own example in [*Why you should care about design context*](https://www.figma.com/blog/why-you-should-care-about-design-context) makes the same point with a card: a layer called "card" carries meaning that "Frame 1337" doesn't, and the cleanest file produced code that reused the codebase's real components.

Figma's guidance on [structuring a file for its MCP server](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file) reads, item by item, like an audit checklist. In order: use components, connect them to code with Code Connect, use variables, name layers clearly, use auto layout, add annotations, add dev resources. Code Connect is the mapping from a Figma component to its code component; without it, the agent has to guess which code component a drawing stands for.

The same holds for prototyping tools. An agent composing a screen in Figma, Figma Make building from a team's package, or a design-to-code pass all start from the library as it is. A library audited for people (are things findable, consistent, documented?) is most of the way to one audited for agents. What agents add is literalness: a person reads past "Frame 1337" and a hex value that happens to match the token; an agent can't.

> **Aside.** The trust gap is real but often misquoted. Figma's 2025 AI report, a survey of 2,500 users, found 68 percent of developers use prompts to generate code, and only 32 percent of designers and developers together say they can rely on AI output ([Figma, 2025 AI report](https://www.figma.com/blog/figma-2025-ai-report-perspectives/)). Figma's [MCP post](https://www.figma.com/blog/design-systems-ai-mcp/) shortens the first to "use AI to write code".

Audit the library before you connect an agent to it, not after the first bad output. **Treat every unbound value, detached instance and default layer name as a line of code the agent will write wrong.** That a messy file yields messy generated code is consensus across Figma's own guidance and every team report found; how much cleaning improves the output has been measured only by vendors (the series' [Part 9](../ai-and-docs/measuring-agent-readiness.md) covers what exists).

---

## What an audit covers

A useful audit checks a library at two levels, each component and the file as a whole, across a short list of areas where drift hides; the list is the same for people and agents, but agents raise the stakes on names, descriptions and properties.

Picture the Switch from the settings screen after it has been reattached. It still has to pass more than one test. Its track colour has to be bound, and bound to the right kind of token: a semantic one like `surface/selected`, not a raw palette step. Its `On` and `Off` states have to exist as variants, with a disabled state that differs in more than opacity. Its label property has to be named the way code names it. And it has to sit on the right page, under a name that doesn't collide with a lower-case `switch` elsewhere in the file.

Those tests group into areas. One working audit uses these, and each catches something different:

- **Token use.** Every fill, stroke, radius, gap and padding bound to a variable, and text set with a text style. An unbound value is a decision nobody can change centrally.
- **The tokens themselves.** Names that follow one grammar, semantic tokens over primitives in components, descriptions that say when to use each.
- **Token links.** Bindings that resolve to the library the file is meant to use, not a retired copy or another team's file with the same collection names.
- **Properties.** Variant axes, booleans and text properties named consistently and close to their code names; no property that does nothing.
- **States.** Hover, focus, pressed, disabled and error drawn where the component has them, each using its own state's tokens.
- **Structure and hygiene.** Auto layout over absolute positioning, no default layer names, no groups where frames belong, no hidden layers left from experiments.
- **Descriptions.** What the component is for, when not to use it, and what it is called in code.
- **Accessibility.** Contrast in every mode, focus indicators, target sizes, text that can grow without clipping.
- **Right to left.** Padding and icons that mirror, where a product ships to Arabic or Hebrew readers.
- **File structure.** Page order, naming across the library, parts that carry their parent's name.
- **Icons.** One size system, bound colours, names that say what the icon shows.
- **Platform fit.** Whether the target platform can build the component as drawn: a centre-aligned stroke, for instance, has no direct CSS equivalent.

The first four matter most to an agent, because they are what it reads to choose and fill in a component. The last few matter most to people, because an agent rarely sees page order or icon naming. The series' [Part 1](../ai-and-docs/what-makes-a-design-system-agent-ready.md#layers-of-readiness) sets out which layers of a system carry readiness; this list is the Figma half of it.

Start a first audit with token use and properties on your five most-used components, because that's where both people and agents feel drift first. **Audit the file as a whole as well as component by component, since page order and name collisions never show up in a component-by-component walk.** The area list is one working audit's, not a published standard; the order of priority is judgement.

---

# Part two: ways of auditing

## Auditing by hand

A person walking the library is the only audit that sees intent, and it is slow, inconsistent between auditors and impossible to repeat every week.

A designer opens the settings screen and the Switch side by side and notices that the screen's toggle is a few pixels taller than the library's. No tool flags that: the toggle is attached, every value is bound, and the height comes from a padding override that is itself a token. The designer knows the product and knows it looks wrong.

The classic method is Brad Frost's interface inventory: screenshot every instance of each kind of thing in a product (every button, every input, every heading), group them, and look at the spread ([Frost, interface inventory](https://bradfrost.com/blog/post/interface-inventory/); [*Atomic Design*, chapter 4](https://atomicdesign.bradfrost.com/chapter-4/)). It was built for the start of a system, to show a team how many buttons it has. Pointed at a library, the same walk shows how many near-duplicate cards or three-generation-old icon sets survive.

What a hand audit gives that nothing else does:

- judgement of intent ("this works, but it reads as a different product");
- a sense of what's missing, which no check can count;
- the conversation it starts, since the people walking the library are often the people who'll fix it.

What it costs:

- hours per component on a large library;
- findings that depend on who audits, and drift between two auditors' calls;
- no repeat run, so nothing tells the team whether a fix held.

Use a hand audit for what only judgement can see, and hand everything countable to a tool. **A person should spend their audit time on intent and gaps, not on counting unbound fills.** That split is consensus among the systems found; the tools below exist because hand counting doesn't scale.

---

## Figma's Check designs

Check designs is Figma's built-in, deterministic check: it finds hard-coded values, detached components, components from libraries the file doesn't use and contrast failures in a selection, and suggests library replacements; it runs on Organization, Enterprise, Government and K-12 Education plans.

A designer selects the settings screen and opens Check designs. It lists the `#6B7280` fill and suggests `text/subtle` from the connected library, the `14` padding and the nearest spacing variable, and the detached toggle. One click applies a suggestion; another applies all of them.

How it works matters for trusting it. Figma's help page says it uses no LLM: suggestions are ranked by how close a variable's value is to the hard-coded one, by naming and hierarchy, and by how often the variable is used ([Figma, Check designs](https://help.figma.com/hc/en-us/articles/39592284074263)). That makes it repeatable. Run it twice and it says the same thing.

Its limits come from the same design:

- It replaces values but not components. A detached instance is flagged, and swapping it back is manual.
- It binds a hard-coded colour to a variable but can't swap colour styles.
- It runs on one page at a time, capped at 25,000 layers.
- It checks against the libraries connected to the file. It doesn't know the system's own rules, such as which collection components should draw from, or which exceptions are deliberate.

That last limit is where it misfires. Within days of launch in June 2026, designers asked on Figma's forum for a way to ignore or exclude suggestions, because deliberate exceptions were being flagged. One example was disabled states, which fail contrast but which WCAG doesn't require to pass ([forum request](https://forum.figma.com/suggest-a-feature-11/check-designs-ignore-or-exclude-suggestions-54643)). There's no way to mark an exception, so the count includes items nobody should fix.

**A worked case.** Say Check designs reports 47 items on your settings screen, and 6 are disabled-state contrast failures. If you apply all 47, six disabled toggles get darker text and stop looking disabled. Apply in groups instead: values first, contrast by hand.

Use Check designs as the everyday check on screens if your plan has it, since it's included with the plan and repeatable. **Apply its value suggestions in bulk and its contrast suggestions one at a time.** It's the right default for screen files; for auditing the library itself, its blindness to your conventions means it needs a second check beside it.

---

## Library analytics

Library analytics shows where a library is used and where it is abandoned (inserts, instances and detaches per component, style and variable), which makes it the best evidence of what to audit first, though it can't say why anyone detached anything.

Back to the toggle that was detached months ago. Was it one designer's shortcut, or does everyone detach that component? Analytics answers that. Figma's library analytics lists, per asset, its instances, inserts and detaches, with drill-down to the files and teams using it, over 30, 60 or 90 days or a rolling year ([Figma, track library and component usage](https://help.figma.com/hc/en-us/articles/360039238353-Track-library-and-component-usage)). It's on the same plans as Check designs; its REST API is Enterprise only.

The caveats change how the numbers read:

- Usage in other people's drafts isn't tracked.
- A nested component doesn't count as an insertion; only the outer one does. A variable used inside an inserted component isn't counted either.
- Style and variable tracking began on 10 October 2024.

**A detach count needs its denominator.** The SLDS button icon's "more than 3,000 detaches" sounds like a crisis. Against almost a million instances it is about 0.3 percent. A component with 40 detaches out of 200 instances, 20 percent, is the one to audit first. Always divide.

Big systems turn this into routine. athenahealth's Forge team, handling around 100,000 insertions a month, watched detaches and traced a spike to an auto layout bug in a container component; one of its designers put it as wanting to know why anyone detaches ([Figma, making metrics matter](https://www.figma.com/blog/design-systems-104-making-metrics-matter/)). Pinterest went further: a nightly job over the REST API scored each handoff frame by the share of its layers coming from the Gestalt library, then rolled that up by team, which ranged from about 50 percent down to 2 ([Figma, how Pinterest measures adoption](https://www.figma.com/blog/how-pinterests-design-systems-team-measures-adoption/)). Shopify's version of the same idea, coverage of components and tokens across its admin, is told in the series' [Part 9](../ai-and-docs/measuring-agent-readiness.md#one-defensible-number).

What to count, which denominator keeps it honest and how to report it is the subject of [measuring design system adoption](../figma-and-code/measuring-design-system-adoption.md).

Read analytics before you audit, and sort components by detach rate, not detach count. **A high detach rate is a question for the people detaching, not a finding against them.** The pattern of watching detaches is consensus across the systems above; the analytics only shows where to look, and the reason has to come from asking.

---

## Lint plugins

Community lint plugins run on any plan and check a library against generic rules, which makes them the cheapest start and the weakest at knowing what the system intends.

A team on Figma's Professional plan has neither Check designs nor library analytics. It installs a lint plugin, runs it over the Switch, and gets a list: unbound fills, a missing text style, a layer named "Frame 12".

That is what these plugins do well: walk the selected layers and report anything that isn't attached to a style, a variable or a component. FigmaLint, from the consultancy Southleft, adds component-level checks (property naming, missing states, accessibility) and a score per component ([Southleft, introducing FigmaLint](https://www.southleft.com/insights/design-systems/designing-for-developers-introducing-figmalint)). Smashing's 2026 piece on [making a design system AI-ready](https://smashingmagazine.com/2026/06/how-make-design-system-ai-ready/) recommends it as the audit step.

The trade-off is in where their rules come from:

- **For:** free or cheap, on any plan, fast, and repeatable.
- **For:** a fixed rule set gives two teams the same yardstick.
- **Against:** the rules are the plugin author's, not the system's. A plugin that wants every radius bound will flag a deliberate `0`; one that checks names against a pattern doesn't know the team's pattern.
- **Against:** third-party maintenance. A plugin that lags Figma's API (slots, new variable types) reports what it can't read as missing.

Use a lint plugin when your plan has no built-in check, or as a fast first pass. **Before trusting its count, check three of its findings against your own conventions.** That a generic linter misreads deliberate choices follows from how it works; how often it does is unmeasured for any named plugin.

---

## Agent audits

An agent audit points an LLM at the library through an MCP connection or Figma's built-in agent, and adds what deterministic checks can't (judging descriptions, names and intent) at the price of answers that vary between runs and confident findings that can be wrong.

A team asks an agent to audit the Switch. It reads the component through the MCP server and comes back with judgements no counting tool makes: the description says what the Switch is but not when to use a Checkbox instead; the property `Toggle` is named for the gesture, while code calls it `checked`; the disabled state differs from the resting one only by opacity.

There are two main routes:

- **Figma's own agent,** in Figma Design since May 2026 (beta), can be connected to a library and asked to audit against it; Figma's [audit solution page](https://www.figma.com/solutions/ai-design-system-audit/) describes it scanning for detached components, hard-coded values and token drift, and saving an audit as a reusable skill.
- **An agent in a coding tool** (Claude Code, Cursor) reading the file through Figma's MCP server or a bridge such as Southleft's `figma-console-mcp`, running a team's own audit skill or script.

What an agent adds:

- judgement on text: whether a description helps, whether a name reads as its job;
- comparison across components ("Switch and Checkbox describe the same use");
- a fix in the same session, where a deterministic tool only reports.

What it costs:

- **Variance.** The same audit, run twice, can return different lists. A finding that comes and goes can't be closed.
- **Confident errors.** An agent states a wrong finding in the same tone as a right one, and it fills unknown conventions from its training, the same failure as in generated code.
- **Price and plan.** Agent use is metered or credit-based once out of beta; Figma's agent is free only during its beta.

The strongest setups split the work. A script does the counting, deterministically: every unbound value, every detached instance. The agent then judges only what a script can't, and filters the script's candidates against the team's recorded decisions rather than raising its own. That keeps the countable findings stable between runs and puts the LLM's judgement where it earns its cost.

Use an agent for descriptions, names and intent, and a script for anything countable. **Never let an agent's audit be the only record of what's wrong, because a list that changes between runs can't be worked through.** The split is judgement, drawn from one working audit and consistent with the series' advice on [checks versus evals](../ai-and-docs/what-keeps-an-agent-on-track.md#evals-versus-tests); no published comparison of agent and scripted audits was found.

---

## Choosing a method

No single method covers an audit: the working mix is a deterministic check for anything countable, usage data to choose where to look, and a person or an agent for intent, chosen by plan and library size.

The settings-screen team has now met all five. Each answered a different question about the same toggle: analytics said how often it's detached, Check designs found its unbound fill, a hand look saw that it's too tall, and an agent noticed its property is named for a gesture. None of them saw all four.

This table compares the methods on the axes the sections above introduced.

| Method | Finds best | Misses | Repeatable | Plan (as of Nov 2026) |
|---|---|---|---|---|
| By hand | Intent, gaps, "looks wrong" | Anything at scale | No | Any |
| Check designs | Hard-coded values, detaches, contrast on screens | The team's conventions; deliberate exceptions | Yes | Organization, Enterprise, Government, K-12 Education |
| Library analytics | Where the library is abandoned | Why | Yes | Same; API Enterprise only |
| Lint plugins | Unbound values, default names | The team's conventions | Yes | Any |
| Agent audit | Descriptions, names, intent | Stability; anything it wasn't told | No | Figma's agent: paid plans in beta; MCP: varies by seat |

By team, that resolves to:

- **A small team on Professional:** a lint plugin plus a hand walk of the most-used components, then an agent for descriptions.
- **An Organization or Enterprise team:** analytics to choose targets, Check designs on screen files, a scripted audit of the library itself against the team's conventions, and an agent for the text.
- **A team about to connect agents to the library:** all of the above on the components agents will reach first, plus a check that each has a Code Connect mapping.

Pick by plan, then fill the gaps. **Use a deterministic check as the record, and people or agents to judge what it can't count.** The mix is judgement; its parts are each consensus for the job named.

---

# Part three: running it well

## Audits without context

An audit that doesn't know a system's own conventions reports that system's deliberate choices as defects, confidently and at scale; recording the conventions, and having a check skip rather than guess where none is recorded, fixes most of it.

Every check carries an assumption. "Fills should come from the semantic collection" assumes the audit knows which collection that is. "Text tokens should be text roles" assumes it knows how text tokens are named. A check that doesn't know falls back on what it does know, and that is usually some other library's answer.

**A worked case.** One audit scanner, shared across several libraries, carried constants left over from the first library it was written for: a semantic collection called `Semantic`, and a pattern for text tokens that expected `/Text/` after another segment. It was then run on a second library of 64 component sets, whose collection is called `3. Semantic` and whose text tokens start with `Text/`.

Before reading on, work out what a correctly bound fill in the second library looks like to that check.

<svg role="img" viewBox="0 0 680 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same scan of one library, without and with its conventions. Left: the check expects a collection named Semantic; the library's fill comes from 3. Semantic/Background/Neutral/soft; the scan raises 227 candidates, 157 of them reading expected Semantic, all wrong. Right: the check reads the library's own collection name, 3. Semantic; the scan raises 70 candidates, and the 157 are gone.</title>
<rect x="0" y="0" width="680" height="250" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Borrowed convention</text>
<text x="360" y="30" font-size="14" font-weight="600" fill="#1a1a1a">The library's own convention</text>
<rect x="20" y="44" width="300" height="50" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="32" y="65" font-size="12" fill="#5a5850">Check expects collection</text>
<text x="32" y="84" font-size="13" font-family="ui-monospace, monospace" fill="#1a1a1a">Semantic</text>
<rect x="20" y="104" width="300" height="50" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="32" y="125" font-size="12" fill="#5a5850">Fill, correctly bound, comes from</text>
<text x="32" y="144" font-size="12" font-family="ui-monospace, monospace" fill="#1a1a1a">3. Semantic/Background/Neutral/soft</text>
<rect x="20" y="164" width="300" height="66" rx="6" fill="#fbeee9" stroke="#d9a593"/>
<text x="32" y="190" font-size="22" font-weight="700" fill="#8a2f12">227 candidates</text>
<text x="32" y="214" font-size="13" fill="#8a2f12">157 read "expected Semantic", all wrong</text>
<rect x="360" y="44" width="300" height="50" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="372" y="65" font-size="12" fill="#5a5850">Check reads the recorded collection</text>
<text x="372" y="84" font-size="13" font-family="ui-monospace, monospace" fill="#1a1a1a">3. Semantic</text>
<rect x="360" y="104" width="300" height="50" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="372" y="125" font-size="12" fill="#5a5850">Same fill, same binding</text>
<text x="372" y="144" font-size="12" font-family="ui-monospace, monospace" fill="#1a1a1a">3. Semantic/Background/Neutral/soft</text>
<rect x="360" y="164" width="300" height="66" rx="6" fill="#eaf3ea" stroke="#9cc29c"/>
<text x="372" y="190" font-size="22" font-weight="700" fill="#1f5a1f">70 candidates</text>
<text x="372" y="214" font-size="13" fill="#1f5a1f">the 157 never generated</text>
</svg>

The scan raised 227 candidates. 157 of them said `fill from 3. Semantic/Background/Neutral/soft (expected Semantic)`, against bindings that were all correct. The text-token pattern failed the same way, marking every text fill in the library as not a text role. Nothing errored. Each finding was plausible and neatly worded. Given each library's own collection name, spacing scale and text pattern, the same scan raised 70 candidates, and the 157 simply stopped being generated, because they had never been about that library.

That is the failure to fear. A wrong finding that looks wrong gets fixed. 157 that look right teach a maintainer that the tool is noise, and the 70 real ones go down with them.

The same shape shows up elsewhere:

- **Built-in checks.** Check designs doesn't know that disabled states are allowed to fail contrast, so it flags them (see [Figma's Check designs](#figmas-check-designs)).
- **Inferred rules.** The same team wrote a check for mode pins left by a retired library, inferring "retired" from a collection that publishes no variables. A live primitives collection hidden from publishing looks identical, and the check was wrong on three findings of four. It was dropped.
- **Agents.** An agent asked to audit with no conventions in front of it applies the conventions of the public libraries it was trained on, and states them as rules.

Context fixes most of it, and context means three kinds of record:

- **Conventions:** the facts a check needs (which collection is semantic, the spacing scale, the name separator, which pages hold components).
- **Decisions:** rulings on questions that could go either way, such as "disabled states are exempt from contrast" or "this radius of 0 is deliberate".
- **Exceptions:** named, individual items that knowingly break a rule, each with a reason.

The rule that made the difference in the worked case is stronger than "set the defaults right": a check whose convention isn't recorded is skipped and reported as not checked, never run on a borrowed default. A borrowed default is always some other library's answer, and it fails silently. Precision beats coverage here, for the reason the Ditto team gave for its copy linter: false positives cost trust in aggregate, while a missed suggestion costs almost nothing ([Quinn Keast, AI style guides for product copy](https://quinnkeast.com/writing/what-we-learned-building-ai-style-guides-for-product-copy)).

Write your library's conventions, decisions and exceptions down where the audit (and any agent) can read them, before the first scan. **If the audit can't find a convention, have it skip the check and say so, rather than guess.** Recording conventions is consensus; skip-don't-guess is judgement, proven on one run of 157 avoidable findings.

---

## Ranking the findings

Sort audit findings by the action they need (a safe mechanical fix, a decision, or a question for someone) and within each by what the defect costs, because a single severity scale mixes items one person can fix in a minute with ones that need a meeting.

The settings-screen audit, run across the library, returns 300 findings. Sorted by severity alone, the top of the list is a mix: 120 unbound paddings that a script could bind in seconds, sitting beside a Switch whose `Toggle` property needs renaming in Figma and code together, and a question about whether the disabled state should exist at all.

Those three need different people. Grouping by action makes the list workable:

1. **Safe fixes.** Mechanical, reversible, no one's decision: bind a raw value that matches a token exactly, rename a default layer. A script or Check designs can apply these in bulk.
2. **Decisions.** Changes consumers will see or that touch code: renaming a property, merging two near-duplicate components, retiring a token. These go to whoever owns the system, with the cost of each option.
3. **Questions.** Things the audit can't judge: a deliberate-looking exception, an off-scale value of 80 that may be a progress bar's fill, a detach spike. These go to the people closest to the work.

Within each group, rank by cost. Commentary on design debt commonly scores items by severity, reach and effort, and plots them on an impact against effort grid; no design system's own published model was found. Two inputs make cost concrete: how many instances or screens the defect reaches (from analytics), and whether an agent will read it (the first four areas in [what an audit covers](#what-an-audit-covers)).

One trap sits in the counting. A finding count isn't a health score. 300 findings where 250 are one-click bindings is a healthier library than 40 where 30 are naming decisions. Show the count by group, not as one number; the series' [Part 9](../ai-and-docs/measuring-agent-readiness.md#showing-readiness) argues the same for readiness.

Hand the safe fixes to a tool the same day, and put the decisions on the system team's agenda with a recommendation each. **Order the queue by who has to act, then by how far the defect reaches.** The three groups are judgement, from one working audit's fix queue; ranking by reach and cost is common practice without a primary source behind any one formula.

---

## Audit cadence

Run one full audit to set a baseline, then keep it current with checks that run on every change and a lighter recurring pass, because a one-off audit starts going stale the day it's delivered.

Six weeks after the settings-screen audit, someone detaches the Switch again. The audit report still says it's fixed. Nothing re-ran.

Teams that keep a system healthy run three rhythms at once:

- **A baseline audit,** once and again after a major change (a rebrand, a library split, a migration). Full, slow and partly by hand.
- **A recurring pass,** weekly to quarterly. Figma's audit page suggests monthly or quarterly for its agent; Pinterest's adoption job ran nightly over every recently edited handoff file.
- **A gate on every change,** where a script can check the rule. In code this is a lint rule: Atlassian publishes an ESLint rule, [`ensure-design-token-usage`](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage), that flags values which should be tokens. Hardik Pandya's setup for AI-built prototypes adds a token audit script that exits with an error on any hard-coded colour or spacing, so it can block a commit; his project went from 418 hard-coded values across 28 files to none ([Pandya, expose your design system to LLMs](https://hvpandya.com/llm-design-systems)).

Figma has no equivalent gate on publishing a library, so the Figma side relies on the recurring pass. That makes the recurring pass's stability matter: it has to give the same list each run, so a finding closes when it's fixed and only then. That's another reason to keep the counting in a deterministic check and the judgement in a person or agent.

Do the baseline once, put a deterministic recurring pass on a calendar, and gate whatever reaches code. **An audit that doesn't re-run can only tell you how the library was, not how it is.** Continuous checking is consensus among the systems found; the exact cadence is judgement and should follow how often the library changes.

---

## Cheat sheet

| Situation | Do | Don't |
|---|---|---|
| Pitching the audit | Name the changes the library can't deliver everywhere | Quote a modelled ROI as a measured one |
| About to connect an agent | Audit token use, properties, names and Code Connect first | Wait for the first bad output |
| Choosing what to audit first | Sort components by detach rate | Sort by detach count |
| On Professional | Lint plugin plus a hand walk | Assume Check designs is there |
| On Organization or Enterprise | Analytics, then Check designs on screens, then a scripted library audit | Rely on Check designs for the library's own conventions |
| Using Check designs | Apply values in bulk, contrast one by one | "Apply all" over disabled states |
| Using an agent | Descriptions, names, intent; filter a script's candidates | Make its list the record |
| A convention isn't recorded | Skip the check and say "not checked" | Fall back on a default |
| A long findings list | Group by safe fix, decision, question | Rank everything on one severity scale |
| After the audit | Recurring deterministic pass; lint gate in code | Treat the report as current |

---

## The short version

An audit turns quiet drift (detached instances, raw values, default names) into a list someone can fix. People gain time and a library they trust; the product gains changes that land everywhere at once; and agents gain lookups where they'd otherwise guess. That last one is the new stake: an agent reads a Figma file literally, so every unbound fill becomes a hex value in code and every detached toggle becomes a hand-built `div`. Audit the library before you connect an agent to it, starting with token use, properties, names and Code Connect mappings on the components agents will reach first.

No one method covers it. Library analytics tells you where to look (divide detaches by instances). Check designs, on Organization and Enterprise plans, finds hard-coded values and detaches on screens and suggests fixes, but can't tell deliberate exceptions from mistakes. Lint plugins do similar work on any plan with the author's rules rather than yours. A person sees intent and gaps; an agent judges descriptions and names, but its answers vary between runs. Use a deterministic check as the record and people or agents for judgement.

Write your conventions, decisions and exceptions down before the first scan. An audit that doesn't know them reports your choices as defects: one shared scanner raised 157 confident, wrong findings on a single library because it assumed another library's collection name, and given the right name, they never appeared. If a convention isn't recorded, the check should skip and say so, not guess.

Sort the findings by who has to act (safe fixes, decisions, questions), then by reach. Do one baseline audit, then a recurring deterministic pass, and a lint gate wherever the system reaches code. Consensus covers the case for auditing, the mix of methods and continuous checking; the three-way sort, the skip-don't-guess rule and the specific cadence are judgement drawn from one working audit.

---

## What to re-check later

Researched 14 November 2026, against Figma's help centre, developer docs and blog, the team write-ups linked below, and one toolkit's audit skills and test cases.

- **Plans move fast.** Check designs launched on 4 June 2026 for Organization and Enterprise; the help page now also lists Government and K-12 Education. A June 2026 news item claimed "team plans"; Figma's help page does not list Professional, so that claim is treated as wrong.
- **Code Connect plan.** The developer docs and help centre now list Professional, Organization and Enterprise (Dev or Full seat); earlier docs and 2026 forum reports said Organization and Enterprise only. Re-check before telling a Professional team it can map components.
- **Figma's agent.** Announced 20 May 2026 for Full seats on Professional, Organization and Enterprise, in beta, with no credit cost during the beta. The current help page lists Starter and Education too. Credits apply at general availability.
- **MCP server.** The remote server is listed for all plans; the desktop server needs a Dev or Full seat on a paid plan. Rate limits by plan were not confirmed from Figma's own pricing page.
- **Check designs and exceptions.** No ignore or exclude option as of November 2026; the forum request had no staff reply. If one ships, the advice on applying contrast suggestions changes.
- **FigmaLint** was in beta at its July 2025 launch; its price and whether it calls an LLM were not confirmed. Other plugins found in search (Offspec, ComponentQA, Pixel Audit) were not checked and are left out.
- **The 157-finding case** comes from one toolkit's audit test case, walked on 5 September 2026, anonymised here. It was a scripted scanner, not an LLM; the claim that agents fail the same way is inference from the mechanism, not a measured run.
- **The mode-pin check** (three false findings of four) is from the same toolkit's foundations audit notes.
- **Figma 2019 study:** sample size not stated; 34 percent is the author's best case.
- **Smashing ROI model:** a model with a hypothetical company; the $646,000 and $1,517,400 figures are inputs and outputs of that model.
- **Atlassian's ESLint rule:** the docs page renders client-side and was not read in full; the package `@atlaskit/eslint-plugin-design-system` exists (16.16.0 on npm). An interview figure of a 95 percent adoption goal at Atlassian could not be opened and is left out.
- **Severity models:** no design system's own published triage model was found; the impact and effort framing is commentary.
- **The evidence base is Western and vendor-heavy.** Every team story is from a US company or Figma itself. No user-outcome research on audits was found; the outcome evidence is Figma's 2019 task study.

---

## Sources

**Primary: Figma**

- [Figma help, Check designs](https://help.figma.com/hc/en-us/articles/39592284074263)
- [Figma forum, Check designs launch post (4 June 2026)](https://forum.figma.com/product-updates-3/check-designs-catch-what-s-off-ship-what-s-right-54551)
- [Figma forum, request to ignore or exclude suggestions (June 2026)](https://forum.figma.com/suggest-a-feature-11/check-designs-ignore-or-exclude-suggestions-54643)
- [Figma help, track library and component usage](https://help.figma.com/hc/en-us/articles/360039238353-Track-library-and-component-usage)
- [Figma help, guide to the Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Dev-Mode-MCP-Server)
- [Figma developer docs, structure your Figma file for the MCP server](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file)
- [Figma developer docs, Code Connect](https://developers.figma.com/docs/code-connect)
- [Figma help, Code Connect](https://help.figma.com/hc/en-us/articles/23920389749655)
- [Figma help, work with the Figma agent in design files](https://help.figma.com/hc/en-us/articles/37998629035799-Work-with-the-Figma-agent-in-design-files)
- [Figma blog, *The Figma Design Agent is here* (20 May 2026)](https://www.figma.com/blog/the-figma-agent-is-here/)
- [Figma, AI design system audit](https://www.figma.com/solutions/ai-design-system-audit/)
- [Figma, design system audits](https://www.figma.com/solutions/design-system-audits/)
- [Figma help, use your design system package in Make kits](https://help.figma.com/hc/en-us/articles/35946832653975-Use-your-design-system-package-in-Make-kits)
- [Figma blog, Thomas Lowry, *Why you should care about design context* (24 September 2025)](https://www.figma.com/blog/why-you-should-care-about-design-context)
- [Figma blog, Ana Boyer, *Design systems and AI: why MCP servers are the unlock* (6 August 2025)](https://www.figma.com/blog/design-systems-ai-mcp/)
- [Figma blog, *Figma's 2025 AI report: perspectives* (24 April 2025)](https://www.figma.com/blog/figma-2025-ai-report-perspectives/)
- [Figma blog, Clancy Slack, *Measuring the value of design systems* (19 December 2019)](https://www.figma.com/blog/measuring-the-value-of-design-systems/)

**Primary: design system teams**

- [Salesforce, Amanda Page, Figma component health (25 March 2025)](https://www.salesforce.com/blog/figma-component-health/)
- [Figma blog, Carly Ayres, *Design systems 104: making metrics matter* (11 February 2025)](https://www.figma.com/blog/design-systems-104-making-metrics-matter/): the athenahealth Forge account.
- [Figma blog, Ravi Lingineni, *How Pinterest's design systems team measures adoption* (3 February 2023)](https://www.figma.com/blog/how-pinterests-design-systems-team-measures-adoption/)
- [monday.com engineering, Rivka Ungar, AI from Figma designs to production code (2 February 2026)](https://engineering.monday.com/how-we-use-ai-to-turn-figma-designs-into-production-code/)
- [Atlassian, ESLint rule `ensure-design-token-usage`](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage)
- [Southleft, TJ Pitre, *Designing for developers: introducing FigmaLint* (2 July 2025)](https://www.southleft.com/insights/design-systems/designing-for-developers-introducing-figmalint)
- One toolkit's audit skills (a components audit's test cases and check catalogue, and a foundations audit). Cited anonymously; not resolved to a public URL.

**Commentary**

- [Brad Frost, *Interface inventory*](https://bradfrost.com/blog/post/interface-inventory/) and [*Atomic Design*, chapter 4](https://atomicdesign.bradfrost.com/chapter-4/)
- [Smashing Magazine, Maximilian Speicher and Guido Baena Wehrmann, *One formula to rule them all: the ROI of a design system* (9 September 2022)](https://www.smashingmagazine.com/2022/09/formula-roi-design-system)
- [Smashing Magazine, Vitaly Friedman, *How to make your design system AI-ready* (3 June 2026)](https://smashingmagazine.com/2026/06/how-make-design-system-ai-ready/)
- [Hardik Pandya, *Expose your design system to LLMs*](https://hvpandya.com/llm-design-systems)
- [Quinn Keast, *What we learned building AI style guides for product copy* (August 2025)](https://quinnkeast.com/writing/what-we-learned-building-ai-style-guides-for-product-copy)

**In the series**

- [Part 1, What makes a design system agent-ready?](../ai-and-docs/what-makes-a-design-system-agent-ready.md)
- [Part 2, What a design system's library should carry for an agent](../ai-and-docs/what-the-library-carries-for-an-agent.md)
- [Part 5, Hooks, gates, evals and the rest](../ai-and-docs/what-keeps-an-agent-on-track.md)
- [Part 9, Measuring and showing agent readiness](../ai-and-docs/measuring-agent-readiness.md)

---

A companion to *The agent-ready design system*, written for a workshop day on auditing a design system.
