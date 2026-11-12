# AI-ready design systems: what the term means, how to measure it, and how to show it

What makes a design system usable by coding and design agents, which of those properties can be measured without running an agent, which only show up when an agent is run, and how the toolkit that audits, snapshots and documents a team's Figma libraries could compute and display a readiness view from data it already holds.

Researched October 2026. Vendor mechanics were read from Figma's MCP server and Code Connect developer docs, Storybook's AI docs and its MCP benchmark post, the shadcn/ui registry schema and its `llms.txt`, Vercel v0's two design-system guides, Primer's token guide and the source of its MCP package, Atlassian's `llms.txt`, its npm MCP package and two engineering posts with measurements, and the zeroheight, Knapsack and Supernova pages that describe their MCP servers. Standards were read from llmstxt.org, agents.md and the DTCG 2025.10 format report. The open-design-system-bench repository was read file by file without running any of it. The toolkit's own data was inventoried from the repository on the day of writing, and the figures quoted for Suiteify and Inception were computed from their committed snapshot, audit record and parity report. Where a claim rests on one source or on vendor framing, the text says so.

---

## What this answers

The phrase "AI-ready" arrives in a planning meeting long before anyone agrees what it means. The questions it breaks into, in the order they usually come up:

- What does "AI-ready" actually mean for a design system?
- Which properties of the library itself make an agent succeed or fail?
- Do component and property names still matter once an agent has the API?
- How should the system be delivered to an agent?
- How does a system tell an agent what not to use?
- Can readiness be measured from files alone, or only by running agents?
- What does a behavioural evaluation look like, and what does it cost?
- Which static measures have a real mechanism behind them, and which are box-ticking?
- How should readiness be shown on a dashboard without becoming a vanity score?
- What could this toolkit measure today, how, and which measures should be built first?

Section 11 is the cheat sheet and section 12 is the short version. Two earlier guides in this folder cover neighbouring ground and are not repeated here: *Making a design system readable by AI agents* (where rules, reference and snapshots live, per-component metadata, `AGENTS.md` studies) and *Figma and code alignment* (naming parity and the Claude test on Suiteify components).

---

# Part one: what readiness is

## 1. What does "AI-ready" actually mean for a design system?

**The short answer.** A design system is AI-ready to the degree that an agent given an ordinary product task uses the system's real components, with their real props, styled with the system's tokens, without being told which component to pick, and at a cost in tokens and turns that a team will tolerate. Everything else people list under the heading (an MCP server, an `llms.txt`, a context file) is a means to that outcome, not the outcome itself.

The definition matters because the failures are specific and recognisable. When an agent builds a screen against a design system it can go wrong in four distinct ways. It can **invent a component** that does not exist, writing `<Heading>` against a library whose text component is `Typography`. It can **invent a prop** on a real component, writing `role="primary"` on a button whose code takes `buttonRole="primary"`. It can **hard-code a value**, writing `#1F6FEB` or `padding: 12px` where a token exists. Or it can **rebuild a component** it should have imported: a hand-made modal that looks right and bypasses the library's focus management. Each of these produces code that compiles and looks plausible, which is exactly why they are expensive: a reviewer has to know the system to spot them.

Shipping teams describe the same failures from their own measurements. Storybook's MCP experiment on the Reshaped library found that agents left alone tend to generate their own components instead of using the system's. Atlassian's test of its own design system, building a login screen with and without context, reports that an agent with no design-system context reached about 5 percent of the relevant guidance; the same task with Atlassian's MCP server reached about 80 percent and finished in fewer turns. The open-design-system-bench repository, a public benchmark for running coding agents against any React and TypeScript component library, encodes the four failures directly in its scorers: an import from outside the system costs points, an import of a component not in the extracted catalogue costs 40 points and fails the run, an invented prop costs 15, a raw colour costs 10.

That gives a working definition with two halves. **Correctness**: does the output use the system faithfully? **Cost**: how many tokens, turns and seconds did it take? Atlassian's table shows why both halves are needed. Its portable `DESIGN.md` file gave agents more context than nothing (about 30 percent against 5) yet cost more than having no context at all (7.21M tokens against 4.20M), because the file loads in full on every turn. A measure that only counted correctness would rate that file an improvement; a team paying for the tokens would not.

**What to do.** Define readiness by the outcome, in writing, before choosing any tooling: real components, real props, tokens instead of literals, imports instead of rebuilds, at an acceptable cost. The four failure modes are consensus across every source that measured anything. Treating the delivery surfaces as the definition is the common mistake, because a system can ship every surface and still fail all four tests.

---

## 2. Which properties of the library itself make an agent succeed or fail?

**The short answer.** Five properties of the system's own content: every repeated thing is a component, every component carries a typed and described interface, values are bound to semantic tokens rather than typed in, names follow the conventions agents already expect, and there is an explicit mapping from the design component to the code component. Delivery surfaces only carry what these five put there.

The mechanism behind all five is the same. An agent selecting a component is doing retrieval: it matches the task against whatever text describes each component and picks the closest. It then fills in props by matching the design's properties against what it knows of the code. Whatever the system leaves unstated, the agent fills from its training, which is mostly public web code. So every property below is a way of replacing a guess with a lookup.

**Components, not drawings.** Figma's own guidance for its MCP server lists six recommendations in order, and the first is that anything repeated should be a component. A detached frame that looks like a button reaches the agent as rectangles and text; there is nothing for it to import, so it writes markup.

**A mapping from design to code.** Figma's second recommendation is Code Connect, which it calls the number one way to get consistent component reuse, adding that without it the model is guessing. The mechanism is concrete: when a Code Connect file exists, Figma's `get_design_context` tool returns the mapping's real import and usage in place of generated React and Tailwind, so the agent copies a known import rather than inferring one from pixels. Code Connect needs a Dev or Full seat on an Organization or Enterprise plan, which is a real cost for smaller teams.

**A typed, described interface.** Storybook's AI documentation recommends JSDoc comments on components and their props, and its component manifest passes an agent the `@summary` (or a truncated description) of each one. The bench's catalogue-quality check scores the same thing from the code side: 25 percent for the share of exports that have a props table, 35 percent for props that carry a type, 25 percent for props with a description, 15 percent for props with a default. The weights are the bench author's judgment, but the reasoning is sound: a typed prop is a closed set the agent cannot invent outside, and a described prop is the only place intent ("use `tertiary` for actions inside a dense table") can live.

**Bound, semantic tokens.** Figma's third recommendation is variables for spacing, colour, radius and typography, and its resource-library page on LLM context gives the reason: a model given `color-primary-500` pulls the value the team assigned to that role, while a model given a hex value can only copy it. Primer pushes the same idea into its MCP server. The `find_tokens` tool's own description tells agents to search by intent rather than colour name (blue becomes accent, red becomes danger) and to validate the result with the server's `lint_css` tool. A semantic name carries the decision; a primitive name or a raw value carries only the colour.

**Conventional vocabulary.** Section 3 treats this on its own, because it is the property most teams assume does not matter.

A worked case from Suiteify shows how these combine. Suiteify's Figma Button exposes `Role: Primary`, `Feedback: Neutral` and `Left icon`. Its code, a wrapper over Material UI's Button, takes `buttonRole="primary"`, a Material UI `color` and `startIcon`. With no mapping and no API in context, an agent reading the Figma instance writes `<Button role="primary" feedback="neutral" leftIcon={...}>`: three invented props, all plausible, none valid. An agent that knows Material UI does no better on the first one: it writes `variant="contained"`, which is valid Material UI and bypasses the wrapper's own role prop. Every token in that Button is bound (Suiteify's audit record shows 31,772 bound properties and zero unbound across its web library), so the visual values are right. The interface is what fails. The same instance with a Code Connect mapping, or with the Button's typed props in context, comes out correct, because the translation from `Role` to `buttonRole` is written down once instead of guessed every time.

The advantages of investing in these five properties are that they serve every delivery surface at once (an MCP server, a docs site and a Code Connect panel all read the same descriptions) and that they help human contributors as much as agents. The costs are equally specific. Descriptions rot silently, because nothing fails when a component's real use drifts from what was written. Code Connect files are one more artefact per component to keep in step with both sides, and a stale mapping is worse than none because it is trusted. And full token binding in Figma is labour-intensive on a large legacy library; Shopify's published figure of roughly 8 percent typography token coverage in custom components before its Polaris v10 work is a reminder of where many libraries start.

**What to do.** Invest in the content before the transport: components for everything repeated, a mapping for every published component, types and short descriptions on every prop, semantic tokens bound everywhere. The ordering is Figma's own, and the retrieval mechanism explains it. The judgment call is where to stop on descriptions: a short description on every prop is cheaper to keep true than long usage essays on a few.

---

## 3. Do component and property names still matter once an agent has the API?

**The short answer.** Less than people fear when the API is in context, and much more than they hope when it is not. Agents fall back on the names that dominate public code, so a system whose names sit far from those conventions pays for it every time the agent works without full context, and that happens often.

The clearest evidence is a lexicon the open-design-system-bench author mined from 898 graded generations across six model configurations (Claude Sonnet run agentically, two DeepSeek models, a GPT model and a GLM model) run against two production systems. It records the component and prop names models invented when the system had no such name, weighted by how often each appeared. The most frequent invented component names were `Heading` and `Typography` (29 occurrences each), `Box` (26), `Card` (25) and `TextField` (21). The most frequent invented props were `as` (170), `spacing` (85, with `gap` as an alias), `color` (49), then `tone`, `variant`, `icon`, `label` and `fullWidth`. These are the names an agent reaches for by default, because they are the names in the code it was trained on.

The bench turns that into a static measure it calls vocabulary convention-distance. For each concept in the lexicon, it checks the system's catalogue: if the expected name exists, the concept is aligned; if only a known alias exists (`Toggle` where agents expect `Switch`), it counts as distance; if neither exists, the concept is left out rather than penalised. The score is 100 times one minus the occurrence-weighted share of distance. A system that calls its spacing prop `gap` where agents reach for `spacing` loses 85 weight units on that concept alone.

The test reported in *Figma and code alignment* (section 13) measured the effect from the other direction, on Suiteify's own components with Claude. With the component API in context, naming made no difference: every condition was fully correct. Without the API, aligning Figma's property names to the code's raised fully correct output from 33 to 52 percent and cut wrong props from 45 to 21. And the failures that remained were where Suiteify's code itself departs from Material UI convention: Claude wrote `variant` on every Button regardless of what the Figma property was called, because its knowledge of Material UI outweighed the name.

Suiteify's parity report quantifies the size of that gap for one library. Of the 390 Figma properties it compared across 52 components, 67 have no code counterpart. Of the remaining 323, 53 carry a different name in code (`Label text` is `children`, `Left icon` is `startIcon`, `Right icon` is `endIcon`) and 8 option values are renamed as well. Each of those is a place where an agent working from Figma alone will guess wrong. Each of those is a place where an agent working from Figma alone will guess wrong.

Three traps recur:

- **Assuming an MCP server makes names irrelevant.** It does only while the API is actually in the agent's context. A quick prompt, an unmapped component, or a design agent placing components in Figma by text search all fall back on names.
- **Aligning to the wrong convention.** Suiteify's Button takes `buttonRole` where Material UI, and every agent trained on it, uses `variant`; renaming the Figma property to match the code fixes the design-to-code join and leaves the model's prior unbeaten. Distance is measured against what agents reach for, not only against the other side.
- **Counting deliberate divergence as debt.** The bench treats a lexicon note marked "by design" as not applicable, and a system with a considered reason for its name should record the reason where agents read it rather than rename.

**What to do.** Measure two distances, not one: Figma to code (from a parity comparison) and code to convention (against a lexicon of names agents reach for). Close the first wherever the code is conventional, because it is cheap and helps every agent and every audit. For the second, record each deliberate departure in the mapping and the agent-facing rules, since neither aligned names nor the model's training will recover it. The evidence here is one benchmark's lexicon and one small controlled test, so treat the effect sizes as directional.

---

## 4. How should the system be delivered to an agent?

**The short answer.** On demand rather than all at once, from a source generated out of the system rather than written beside it, with a short hand-written rules file for the few things the system cannot say about itself. MCP servers, CLIs, skills, registries and `llms.txt` are all versions of the on-demand idea, and the measured differences between them are smaller than the difference between having any of them and having none.

The surfaces in use as of October 2026, briefly, because the earlier guide covers the architecture in depth:

- **MCP servers** expose tools an agent calls with a narrow question. Atlassian's `@atlaskit/ads-mcp` (version 1.11.0) offers `ads_search_components`, `ads_search_tokens`, `ads_get_a11y_guidelines` and an `ads_plan` tool; Primer's `@primer/mcp` registers about twenty, from `list_components` to `lint_css`; Storybook's addon serves a component manifest and a `test-run` tool from the running Storybook; Figma's server returns design context, variables and Code Connect mappings for a selection. zeroheight, Knapsack and Supernova each sell one over their documentation platforms.
- **CLIs** answer the same narrow questions from the terminal without a server to run. Atlassian reported in September 2026 that its CLI cut session time by 8 percent (352 to 325 seconds) and tokens by 8 percent (218k to 201k) against its MCP server, and that CLI usage had overtaken MCP usage.
- **Skills and context files** carry the rules. v0's newer design-system flow saves the whole design system as a `SKILL.md` with up to three verified reference sources, and instructs the model not to use any component, prop or token it cannot verify in those sources. `AGENTS.md`, now stewarded by the Agentic AI Foundation and used by more than 60,000 open-source projects by its own count, is the cross-tool convention for repository rules; the closest file to the edited code wins.
- **Registries** describe each item's files and dependencies in machine-readable JSON. shadcn/ui's `registry-item.json` schema carries `name`, `description`, `dependencies`, `registryDependencies`, `files`, `cssVars` and `docs`, so an agent installs the real source rather than generating a lookalike.
- **`llms.txt`** is a curated Markdown index at a site's root: an H1 with the project name (the only required part), a blockquote summary, then H2 sections of links, with an `Optional` section an agent may skip. The proposal also asks sites to serve each page as Markdown at the same URL plus `.md`. Atlassian splits its index into topic files (`llms-components.txt`, `llms-tokens.txt`, `llms-a11y.txt` and others) and also serves an `llms-full.txt`, which the proposal itself does not define. Primer's documentation site has no `llms.txt` at all (it returned 404 when checked), which shows that a mature system can rate well on everything else without one.

The measured evidence for on-demand delivery is a handful of vendor benchmarks, none with published sample sizes. Atlassian's login-screen table is the most complete:

| Context given to the agent | Guidance reached | Tokens | Time | Turns |
|---|---|---|---|---|
| None | about 5% | 4.20M | 6m 19s | 43 |
| Atlassian's MCP server | about 80% | 3.75M | 5m 01s | 35.1 |
| Atlassian's skill | about 80% | 4.43M | 5m 23s | 36 |
| Portable `DESIGN.md` | about 30% | 7.21M | 6m 46s | 45.3 |

Storybook reported a comparison on the Reshaped component library in March 2026 with its MCP docs against a baseline: 12.8 percent better code usage, 2.76 times faster, 27 percent fewer tokens. Atlassian calls its own results not conclusive, and Storybook does not publish its method. Read together, they agree on direction: an on-demand source beats nothing on both correctness and cost, and an all-at-once file can cost more than nothing.

The advantage of the server and CLI forms is that they scale: Atlassian's server can draw on about 2.5MB of material while answering each question in a few kilobytes. Their cost is infrastructure and freshness. A server is one more service to keep running, authenticated and in step with the library, and a stale server answers confidently. The advantage of the file forms (`llms.txt`, a skill, a registry) is that they need nothing running and travel with the repository. Their cost is that they either stay small and leave things out, or grow and load in full.

**What to do.** Serve generated reference on demand from whatever the team already runs (a docs site's JSON, an MCP server over it, or a CLI), and keep the hand-written rules file short. Add an `llms.txt` and Markdown page variants when a docs site exists, because they cost an afternoon and serve agents that do not speak MCP. The on-demand verdict is consensus among the vendors who measured; the choice between server and CLI is still moving and is a judgment about the team's tooling, not a settled finding.

---

## 5. How does a system tell an agent what not to use?

**The short answer.** In machine-readable form, at the point of use: a deprecation flag on the token or component itself, unpublished items kept out of the agent's view entirely, and a validation step the agent runs on its own output. A deprecation that lives only in prose on a docs page is invisible to an agent that retrieved the component by name.

The mechanism is the same retrieval problem in reverse. An agent that finds `Color/Background/Brand/legacy` by searching tokens has no way to know it is retired unless the token says so where the agent reads it. The DTCG 2025.10 format, the stable token specification since 28 October 2025, defines a `$deprecated` property that may be `true` or a string explaining the reason, sitting beside `$value` and `$description` on the token itself. TypeScript's `@deprecated` JSDoc tag does the same for a component or prop, and editors and docgen tools surface it. The bench's deprecation check looks for exactly these signals: 20 points for `@deprecated` tags, 25 for a changelog or migration guide, 15 for version headings a machine can parse, 25 for codemods (its maximum is 85, not 100).

Hiding is the second half. zeroheight's MCP page states that hidden content stays hidden, so agents work only from published, approved guidelines. Figma variables have a `hiddenFromPublishing` flag for the same reason. A primitive token that exists only to be aliased should not appear in an agent's search results, because an agent that finds `Blue/600` will use it over `Color/Text/Link`.

Validation is the third, and the strongest, because it does not depend on the agent having read anything. Primer's `lint_css` tool and the instruction in `find_tokens` to validate with it, Atlassian's `ads_analyze_a11y`, zeroheight's `lint-code` and v0's rule against anything it cannot verify are all the same move: close the loop by checking the output against the closed set of real names. A rule in a context file is advice; a check the agent runs is a gate.

A worked case. A library renames `Spacing/md` to `Spacing/16` and keeps the old variable for a release. Without a flag, the token export emits both with no distinction, the docs site lists both, and an agent searching for medium spacing finds the old name first because it matches the word. With `$deprecated: "Use Spacing/16"` in the export and the old variable hidden from publishing, the agent's search returns one candidate and the docs site can mark the old one.

**What to do.** Put deprecation where agents read: `$deprecated` in exported tokens, `@deprecated` in code, a deprecated status that the docs and any MCP server carry through. Hide what is not meant for direct use. And give the agent a validator, because it is the only one of the three that works when the agent skipped the others. The DTCG property and validator pattern are consensus; how much to invest in codemods depends on how many consumers a rename breaks.

---

# Part two: measuring it

## 6. Can readiness be measured from files alone, or only by running agents?

**The short answer.** Both, and they answer different questions. A static audit of the system's files measures whether the inputs an agent needs are present and well formed; running agents measures whether those inputs actually change what agents produce. Static measures are cheap leading indicators and should be shown as such. Only a behavioural run can say the system is ready, and nobody has yet shown how well the first predicts the second.

The open-design-system-bench is the clearest public example of keeping the two apart, and its design is worth understanding. Its static audit produces a **Surface** score from seven checks, weighted: enablement surface 20, catalogue quality 20, export hygiene 15, vocabulary 15, tokens 10, deprecation 10, docs greppability 10. A check that cannot measure returns nothing, and its weight is redistributed rather than counted as zero. Its behavioural run produces four more sub-scores: **Lift** (how much guided agents beat unguided ones), **Ceiling** (how good guided output gets, and how often it avoids failing), **Engagement** (the share of runs that used the system at all) and a behavioural vocabulary score (how many invented names match the lexicon). The composite is the equal-weight mean of whatever is present, labelled `surface-only`, `partial-behavioral` or `full-behavioral` so a reader can see what it rests on.

Three of the author's own caveats carry the argument. The code states that static checks are weaker evidence than measured behaviour and that the report never blurs the two. Its readiness bands (70 and above "AI-native", 40 and above "Invested", below 40 "Emerging") are marked as an uncalibrated starting default, to be recalibrated once there are reference runs against open-source systems. And no correlation between Surface and the behavioural scores has been measured; the stated thesis is that identical composite scores can hide opposite failure modes.

The other scores on the market are health scores rather than readiness scores. Southleft's `figma-console-mcp` produces a Lighthouse-style score out of 100 across naming, tokens, components, accessibility, consistency and coverage, with a remediation class on each finding. It is a good audit of a Figma library and says nothing direct about agent output. zeroheight's survey of 123 design-system practitioners found only 17 percent rate their documentation as very AI-ready, while 48 percent already run an MCP server; that gap between shipping the surface and trusting the content is exactly what a static checklist cannot see.

The trap static measures fall into is presence scoring. The bench gives 15 points for an `llms.txt` whether it is a curated index or a 2MB dump (it adds a context-cost warning above 1MB but no penalty), and 20 for an `AGENTS.md` whether it says something useful or restates the directory tree, which the ETH Zurich study discussed in the earlier guide found unhelpful. A team optimising the number would add files. That is why the measures in section 8 favour coverage and distance over presence.

**What to do.** Treat static measures as diagnostics that point at inputs to fix, label them as static wherever they are shown, and reserve the word "ready" for a behavioural result. Never combine the two into one number until someone has shown they move together. The separation is the bench author's explicit position and the only one the evidence supports; that the static measures are still worth computing is this guide's judgment, on the grounds that they are cheap and each one names a concrete fix.

---

## 7. What does a behavioural evaluation look like, and what does it cost?

**The short answer.** A fixed set of product tasks written without naming any component, run by an agent with and without the system's context, each output scored mechanically for imports, invented components and props, raw values, accessibility and compilation, plus a model judge for whether the result does what the task asked. A small useful run is tens of cells and a few hundred dollars, repeated when the system or the delivery surface changes.

The bench is a complete worked example. Its ten starter tasks are domain-neutral product requests (a password visibility toggle, a settings section with toggles, an account-deletion confirmation, form validation errors, a paginated activity log), with four harder ones held back. Each prompt states intent and never names a component, and a validation step checks for leaks, because a task that says "use the Dialog" measures nothing about whether the agent can find the Dialog. The agent runs in a sandbox with file tools only, no shell and no web, and since version 1.3 the unguided runs are isolated from the operator's own context files, which had been inflating baselines.

Each output is scored on six dimensions, weighted: imports 10, API fidelity 25, token discipline 15, static accessibility 10, compilation 10, and a model judge 30. The mechanical scorers are simple and auditable. API fidelity starts at 100, loses 40 for each imported component not in the catalogue and 15 for each invented prop, and scores zero if the output imported nothing from the system. Token discipline loses 10 per raw hex, inline colour or arbitrary value. The judge (a small model by default) scores each task's weighted rubric blind to which configuration produced the output. Ground truth is always extracted from the system's code (through react-docgen-typescript, an existing catalogue or Stencil's docs output), never written by hand, so the benchmark cannot drift from the library it measures.

Cost is the deciding constraint. The bench estimates about $1.50 per cell, where a cell is one task run once by one model with one context level. Ten tasks, two context levels (none and the system's guidance), one model and three repetitions is 60 cells, about $90; adding a second model doubles it. The repetitions are not optional: the author notes that single-repetition scores are only directional. Atlassian's and Storybook's benchmarks are the same shape at larger scale, and neither publishes its run count, which is the main reason their figures are hard to compare.

The advantages are that it is the only measure that answers the question directly, that its mechanical half is reproducible, and that it catches failures no static check can, such as an agent that ignores a perfectly good catalogue. The costs are money and maintenance: every run spends real tokens, tasks age as the system grows, and the judge is a model whose verdicts can shift between versions. The rubrics also measure generic interface judgment, not the system's own composition rules, unless the team writes its own.

**What to do.** Run a small behavioural evaluation before claiming readiness and after any change to the delivery surface, with tasks that never name a component, at least three repetitions, and the mechanical scores reported separately from the judge's. Keep the task set small and stable so runs are comparable over time. The method is the bench's, built on Murphy Trueman's case for design-system evals; the size recommendation is judgment fitted to a team without a dedicated evaluation budget.

---

## 8. Which static measures have a real mechanism behind them, and which are box-ticking?

**The short answer.** A static measure earns a place when it counts something an agent will actually retrieve and act on, and when moving it requires fixing the system rather than adding a file. Coverage and distance measures pass that test. Presence measures mostly do not, with two exceptions: whether any machine-readable reference exists at all, and whether it is fresh.

Applying that test to the measures the sources propose:

- **Interface completeness** (share of components and props that are typed, described and defaulted) passes. The agent's prop choices come straight from these fields, and raising the number means writing types and descriptions.
- **Design-to-code mapping coverage** (share of published components with a Code Connect file or equivalent) passes. Figma's own ranking puts it first after componentisation, and the mapping is what replaces a guess with an import.
- **Vocabulary distance** (to the other side, and to the names agents reach for) passes. Section 3's evidence shows it predicts invented props when the API is absent.
- **Token binding and semantic share** (share of values bound to variables, share of tokens that alias a semantic layer) passes, with a caveat: a fully bound library can still be all primitives, which is why Primer's guide insists on semantic tokens only.
- **Guidance coverage on tokens** (share of semantic tokens with a description) passes. A description is the only place a token can say when to use it.
- **Deprecation legibility** (deprecated items flagged in machine-readable form) passes when it counts flags on actual retired items, and fails when it only checks that a changelog file exists.
- **Surface presence** (an `llms.txt`, an `AGENTS.md`, an MCP server) mostly fails. It is worth one binary check, does any machine-readable reference exist, because the gap between none and some is the largest measured effect in Atlassian's table. Beyond that, presence rewards adding files.
- **Freshness** passes. A reference generated from last month's library answers confidently and wrongly, and the bench's freshness bonus (agent-facing docs at least as new as the newest component change) is the right shape, though it deliberately only rewards and never penalises.

Two further traps are about the arithmetic rather than the measure. **Zero is not missing.** A measure whose inputs were never collected must show as not measured, not as zero; the bench returns null and redistributes the weight, and the toolkit's own `measures.json` already renders no tile rather than a zero for a measure with missing inputs. **A suspicious result is a finding about the instrument.** The bench flags a catalogue as extraction-suspect when 30 percent or more of exports show zero props, after a field test found 63 percent of one popular library's exports with no props, which was a docgen failure rather than a property of the library.

**What to do.** Prefer coverage and distance measures, keep presence to a single "some machine-readable reference exists" check plus freshness, and show unmeasured inputs as unmeasured. The test (counts what an agent retrieves, moves only by fixing the system) is this guide's judgment; each measure that passes it has at least one vendor or benchmark source behind its mechanism.

---

# Part three: showing it

## 9. How should readiness be shown on a dashboard without becoming a vanity score?

**The short answer.** As a few separate measures, each a ratio with its numerator and denominator visible, each linked to the list of items that fail it, with unmeasured inputs shown as such and no composite score or tier until a behavioural run has calibrated one. Static and behavioural results sit in different places and are never averaged together.

The reasoning follows from section 6. A single readiness number invites the presence gaming the bench's own caveats describe, and it hides which input is weak: two libraries at 62 can fail in opposite ways. A ratio such as "121 of 122 components described" is harder to game, because the only way to move it is to describe a component, and it is directly actionable, because the one missing component can be named. The earlier guide reached the same verdict for health scores generally: keep the exception list primary and treat any score as a rollup of it.

Altitude, a smaller design system whose overview publishes Figma parity per component (described in *The design-system docs ecosystem*, section 11), shows the "not recorded" habit worth copying: where a check was never run, the page says so in words rather than leaving a blank or a zero. The bench's labelling of its composite as `surface-only` or `full-behavioral` is the same idea applied to a score.

A worked comparison. One version of an "AI readiness" card shows a single figure, 78, with a band labelled "Invested". A reader cannot tell whether the 22 missing points are undescribed components, unmapped code, or a missing `llms.txt`, and nothing on the card says what to do next. A second version, filled with Suiteify's real figures where they exist, shows four columns, each a ratio: mapped to code 47 of the 52 components the parity comparison covers, same words 270 of 323 props, described 121 of 122 components and 516 of 612 variables, and a freshness line giving the snapshot's age against the file's last edit. Every column names its gap, and every gap has an owner.

**What to do.** Show readiness as a small set of ratios with their gaps one click away, label static measures as static, keep any behavioural result in its own row with its run date and repetition count, and leave out tiers until there is evidence to calibrate them. The ratio-over-score position is judgment backed by the bench author's caveats and by the earlier guide's finding on health scores.

---

# Part four: this toolkit

## 10. What could this toolkit measure today, how, and which measures should be built first?

**The short answer.** Most of the static measures in section 8 can be computed from data the toolkit already commits per project: the Figma snapshot, the audit record, the parity report, the token export and the docs site's JSON. Four are cheap and worth building first: code mapping coverage, Figma-to-code vocabulary distance, guidance coverage across components and variables, and reference freshness. A small behavioural run through the docs MCP server's `validate` tool is the fifth, and the costly one.

### What the toolkit holds

The inputs are worth stating precisely, because a measure is only as good as the data it reads and the toolkit's rule is one source for every fact.

- **The snapshot** (`projects/<label>/snapshot/`, held in the toolkit for Inception and Suiteify; Blackbook and the job board keep theirs in their own repositories). `index.json` lists components; each `components/<folder>/figma.json` carries the description, props, variant trees, the component key, and per node either a variable name or a raw value for fills, strokes and spacing (`"literal"` where a text or effect style is unbound); `contract.json` maps each code prop to its Figma name (`"labelText": {"type": "string", "figma": "Label text"}`). `tokens.json` carries every collection's values, aliases, `descriptions` and `hidden` lists, and a `_meta` block with `snapshotAt` and the file version. It does not capture variable `codeSyntax`, variable scopes, or property descriptions other than a slot's.
- **The audit record** (`projects/<label>/audit/<fileKey>.json`). Per library, `metrics` holds `sets`, `described`, `bound`, `unbound` and `coverage`; `rows` hold findings with rule, severity, owner and status; `scores` hold per-component scores on five dimensions.
- **The measures registry** (`skills/figma-components-audit/scanner/measures.json`). It already defines `coverage` (bound share of bindable properties, good at 99.5 percent), `described` (described sets over sets, whose rationale already names a model reading the library) and two backlog measures that bear directly on readiness: `propDesc` (properties with a description) and `annotated` (sets with Dev Mode annotations). A measure with missing inputs renders no tile.
- **The parity report** (`projects/suiteify/parity/report.json`, comparison mode). Per component: the code component, each Figma prop with its code prop and findings (`renamed`, `value-renamed`, `not-in-code`, `code-only-prop`), and token agreement by type (colour 454 of 454 matching).
- **The token export** (`projects/<label>/tokens/`). DTCG files with `$description` from each variable; no `$deprecated`.
- **The docs site and its MCP server.** The static JSON API (`/api/index.json`, `/api/tokens.json`, `/api/audit.json`, `/api/components/<slug>.json`) and `tools/docs-mcp`, whose tools include `search`, `get_contract`, `get_tokens` and `validate`, which checks code for raw colours, unknown tokens and raw HTML where a library component exists. There is no `llms.txt`, no Markdown page variant, no `AGENTS.md` and no Code Connect file anywhere in the toolkit's projects.

### Candidate measures

Each candidate below says what it counts, where the count comes from, and what it costs to build. "Cheap" means a function over committed JSON; "medium" means a change to what the snapshot plugin or exporter captures; "costly" means running agents.

**Code mapping coverage.** Published component sets that have a code counterpart a tool can resolve, over published sets. Today the counterpart is a `codeComponent` the parity report resolved without error (47 of Suiteify's 52 compared components), or an entry in the context document's `frameworkComponents`; a Code Connect file would count once one exists. The snapshot's `contract.json` does not count: it is generated from the Figma side, with code names derived from Figma names, so every component has one whether or not code exists. Cheap. It is the readiness version of Figma's top recommendation, and for a design-phase project with no code it should show as not applicable rather than zero.

**Figma-to-code vocabulary distance.** Figma props whose code counterpart has the same name, over Figma props that have a code counterpart, from the parity report's prop findings. For Suiteify that is 270 of 323, with 53 renamed and 8 option values renamed; the list of renamed props is the gap view. Cheap, but only for projects with a parity comparison, and with one caveat found while computing it: for some props the report compares against the Material UI base component rather than the project's wrapper, so it records Button's `Role` as `variant` while the wrapper exposes `buttonRole`. The measure is only as true as the pairing underneath it, and that pairing should be checked before the figure is shown.

**Convention distance.** The bench's lexicon scoring applied to the code-facing names in `contract.json`: how many concepts agents reach for (`spacing`, `variant`, `startIcon`, `TextField`) the library names differently. The lexicon is a JSON file in an MIT-licensed repository, so it could be vendored with attribution and a version pin. Cheap to compute; medium to own, because the lexicon is one author's mining and would need re-checking when it changes.

**Guidance coverage.** Three ratios read from the snapshot and audit: components described (`described / sets`, already in the audit), semantic variables described (from `tokens.json` `descriptions`, restricted to collections the context document marks semantic), and props described (the backlog `propDesc` measure). The first two are cheap and would immediately show real gaps: Suiteify's `Semantic` collection has 227 of 227 described but `Primitive - Global` 0 of 65, and Inception's `04. Semantic` has none. The third is medium, because the snapshot plugin does not yet capture property descriptions.

**Raw values in components.** Count of unbound fills, strokes, spacing, and `"literal"` text and effect styles across snapshot component trees. Cheap. It overlaps the audit's existing `coverage` measure, which is already shown under Library health, so on a readiness card it should link there rather than recompute it.

**Deprecation legibility.** Components on a page carrying the project's deprecated marker (`🚫` in Suiteify's context document) and tokens hidden or renamed in `changes.json`, against how many of them reach agents flagged: today none do, because the token export emits no `$deprecated` and the docs API carries status but the MCP `search` tool does not filter on it. Medium, because the fix is in the exporter and the docs API, and the measure is only meaningful once they carry the flag.

**Reference freshness.** Days between the snapshot's `_meta.snapshotAt` and the Figma file's last edit (`_meta.version.editedSince`), and whether the published docs site was built from the current snapshot. Cheap. It is the condition every other measure depends on: a readiness card reading a month-old snapshot describes a library that no longer exists.

**Agent surface.** One binary check per surface: docs JSON API, docs MCP server, `llms.txt`, Markdown page variants, a rules file for agents, Code Connect. Cheap, and low in evidence for the reasons in section 6. Worth showing as a short checklist, not as a ratio, and worth acting on mainly for `llms.txt` and Markdown variants, which the docs site could generate from data it already renders.

**Behavioural pass rate.** A fixed set of five to ten product tasks per project, run by an agent with and without the docs MCP server, each output scored by the server's own `validate` tool (raw colours, unknown tokens, raw HTML in place of library components) and by whether every imported component and prop exists in the contracts. Costly: about $1.50 per cell on the bench's estimate, and a task set to write and keep current per project. It is the only candidate that measures readiness rather than its inputs.

The cost and placement of each, side by side:

| Measure | Reads | Cost | Shown as |
|---|---|---|---|
| Code mapping coverage | `contract.json`, parity report, context doc | Cheap | Column on the readiness card |
| Figma-to-code vocabulary distance | parity report prop findings | Cheap | Column on the readiness card |
| Convention distance | `contract.json` and a vendored lexicon | Cheap to compute, medium to own | Later column |
| Guidance coverage (components, variables) | audit `metrics`, `tokens.json` | Cheap | Column on the readiness card |
| Guidance coverage (props) | snapshot after a plugin change | Medium | Joins the guidance column |
| Raw values in components | snapshot trees | Cheap | Link to Library health, not a new figure |
| Deprecation legibility | page markers, `changes.json`, export | Medium | Later column |
| Reference freshness | snapshot `_meta`, site build | Cheap | Column on the readiness card |
| Agent surface | file and endpoint checks | Cheap | Checklist line under the card |
| Behavioural pass rate | agent runs scored by `validate` | Costly | Separate row with run date and repetitions |

### How it would appear on the Overview

The Overview already has the shape this needs: Library health renders measures from `measures.json` as tiles with a good threshold, and a measure with missing inputs renders nothing. An "AI readiness" card would sit beside Library health and follow the same conventions, with four columns in its first version: **Mapped to code**, **Same words**, **Described** and **Fresh**. Each column shows its ratio, turns its good or warning state from a threshold kept in `measures.json` beside the existing ones, and links to the list of components or tokens that fail it, the way Needs attention links to pages. A project in the design phase, with no code, shows the two code-dependent columns as not applicable. Below the columns, one line lists which agent surfaces exist. There is no composite figure and no tier. If a behavioural run exists, it appears as a separate row under the card with its date, task count, repetitions and pass rate, and its absence reads "not run".

Defining these as measures in `measures.json` rather than as a separate system keeps one registry for every graded figure, which the toolkit's rule of one source per fact requires, and means the docs MCP server's `get_audit` tool and the JSON API carry them to agents without new plumbing.

### The ones to build first

1. **Reference freshness**, because every other figure on the card is only true if the snapshot is current, and it costs two timestamps already in `tokens.json`.
2. **Guidance coverage for components and variables**, because it is the most direct static measure of what an agent can learn about intent, the data is already committed, and it immediately names real gaps (Inception's semantic collection has no descriptions).
3. **Code mapping coverage**, because a mapping is Figma's top-ranked lever for agent output and the parity report and context document already hold the pairings for it to count.
4. **Figma-to-code vocabulary distance**, because the parity report already lists every rename and the Suiteify test showed renames are where agents without the API go wrong.
5. **A small behavioural run**, built after the four above and kept off the card's columns, because it is the only measure that can say whether the others matter for these libraries, and the docs MCP server's `validate` tool already does most of the scoring.

Convention distance, property descriptions and deprecation legibility follow once the plugin and exporter capture what they need. Agent-surface presence stays a checklist line.

**What to do.** Build the four cheap measures as entries in `measures.json` with a readiness card that shows ratios and their gaps, leave the composite out, and add a behavioural run once the card exists so its numbers can be checked against what agents actually do. The measures and their mechanisms rest on the sources in Parts one to three; the choice and order of the first five is this guide's judgment, fitted to data the toolkit holds on the day of writing.

---

## 11. Cheat sheet

| Question | Measure it by | Not by |
|---|---|---|
| Will an agent import the real component? | Share of components with a design-to-code mapping | Whether an MCP server exists |
| Will it write valid props? | Typed and described props; Figma-to-code name agreement | Number of documentation pages |
| Will it use tokens? | Bound share of values; semantic share; validator in the loop | A rule in a context file alone |
| Will it guess names when the API is missing? | Distance from the names agents reach for | Internal naming consistency only |
| Will it avoid retired items? | `$deprecated` and `@deprecated` on the items themselves | A changelog's existence |
| Is the reference current? | Snapshot age against last Figma edit | The docs site's build date alone |
| Is the system ready? | A behavioural run with tasks that never name a component | Any static score |
| How should it be shown? | Ratios with their gaps linked; "not measured" in words | One number and a tier |

---

## 12. The short version

A design system is AI-ready when an agent given an ordinary task uses the real components, with the real props, styled with tokens, without being told which component to pick, at a cost a team accepts. The four ways agents fail (inventing a component, inventing a prop, hard-coding a value, rebuilding instead of importing) are consistent across every vendor and benchmark that measured anything.

What makes agents succeed is mostly content, not transport: components for everything repeated, a mapping from each design component to its code, typed and described props, semantic tokens bound everywhere, and names close to the conventions agents already know. Delivery matters second: on-demand sources (an MCP server, a CLI, a skill, a docs JSON API, an `llms.txt`) beat nothing by a wide margin, and an all-at-once file can cost more than nothing. Retired items need flags where agents read them, and agents need a validator to check their own output, because a rule they may not read is advice and a check is a gate.

Static audits of the files measure whether those inputs are present; only running agents measures whether they work, and nobody has yet shown how well the first predicts the second. So static measures should be ratios that name their gaps and are labelled as static, and the word "ready" belongs to a behavioural run.

For this toolkit, the first readiness card should show four ratios computed from committed data (reference freshness, guidance coverage on components and variables, code mapping coverage, and Figma-to-code vocabulary distance), with no composite score, and a small behavioural run through the docs MCP server's `validate` tool should follow as a separate row. Convention distance, property descriptions and deprecation flags come next, once the snapshot plugin and token exporter capture what they need.

---

## 13. What to re-check later

- **Every vendor benchmark here lacks a published sample size.** Atlassian calls its results not conclusive; Storybook's March 2026 figures come without a method. Re-check both for follow-ups before quoting the numbers as anything but direction.
- **No controlled study isolates a single property** (token binding, descriptions, naming) and measures its effect on agent output. The closest is the small Suiteify test in the companion guide. A study that does would change the weights any readiness card implies.
- **The open-design-system-bench is young**: created August 2026, version 1.3.0 on 5 October 2026, with uncalibrated tiers, no published results for any named system, and a roadmap its code refers to that is not in the repository. Its lexicon (version 1, mined 25 August 2026) is one author's mining across six model configurations and two systems. Re-check the lexicon and the weights before vendoring either.
- **Storybook's MCP tool names have changed** between releases; the names here are from the version 10.6 docs. Older names appear in secondary sources.
- **Atlassian's CLI overtaking its MCP server** is one team's usage data from September 2026. Whether CLIs replace MCP servers for design-system reference is open.
- **Several vendor pages could not be read first-hand**: zeroheight's help-centre article on its remote MCP server returned 403, Supernova's MCP documentation rendered as an empty page, and the criteria of the designsystemsforai.com assessment are rendered by script and were not readable. Claims from those are kept out of the body.
- **`llms-full.txt` is not part of the llms.txt proposal** as published on llmstxt.org, even though Atlassian and others serve one. Watch for it being added.
- **The toolkit inventory is dated 10 October 2026.** The figures for Suiteify and Inception (bound and unbound counts, description coverage, parity renames) were computed from committed files that day and will move with the next snapshot or audit.
- **The evidence base is Western and vendor-heavy.** Every measured result comes from a US or Australian design-system team or a tool vendor selling the surface it measured. The bench's changelog mentions field-testing against Ant Design, which is the only non-Western system touched, and only as a fix to an extraction check.

---

## Sources

**Primary: vendor documentation, specifications, repositories and measured reports**

- [Figma, *Tools and prompts* (MCP server)](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/). The tool list (`get_design_context`, `get_variable_defs`, `get_code_connect_map`, `search_design_system`, `create_design_system_rules`) and Code Connect output in responses.
- [Figma, *Structure your Figma file*](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file). The six recommendations in order and the "without it, the model is guessing" line on Code Connect.
- [Figma, *Guide to the Figma MCP server*](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server). Remote and desktop servers and seat requirements.
- [Figma, *Code Connect* developer docs](https://developers.figma.com/docs/code-connect/). Template and legacy APIs, the UI and CLI routes.
- [Figma, *Code Connect* help article](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect). Plan and seat availability, and the statement that mappings improve MCP guidance to agents.
- [Figma Resource Library, *LLM context design*](https://www.figma.com/resource-library/llm-context-design/). The semantic-token example used in section 2.
- [Storybook, *MCP overview*](https://storybook.js.org/docs/ai/mcp/overview). Toolsets and tool names in version 10.6.
- [Storybook, *Manifests*](https://storybook.js.org/docs/ai/manifests). The components manifest and how it is enabled.
- [Storybook, *AI best practices*](https://storybook.js.org/docs/ai/best-practices). The JSDoc recommendation and `@summary`.
- [Storybook, *ds-mcp-experiment-reshaped* discussion](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1). The observation that unguided agents generate their own components.
- [Storybook, *Storybook MCP for React*](https://storybook.js.org/blog/storybook-mcp-for-react/). The Reshaped comparison: 12.8 percent better code usage, 2.76 times faster, 27 percent fewer tokens.
- [shadcn/ui, `llms.txt`](https://ui.shadcn.com/llms.txt). A live example of the format.
- [shadcn/ui, *registry-item.json*](https://ui.shadcn.com/docs/registry/registry-item-json). The item schema fields.
- [shadcn/ui, *MCP server*](https://ui.shadcn.com/docs/mcp). Setup and namespaced registries.
- [Vercel v0, *Design systems* (legacy registry guide)](https://v0.app/docs/design-systems). The registry as a way to pass design-system context to models.
- [Vercel v0, *Design systems 2.0*](https://v0.app/docs/design-systems-2). The `SKILL.md` flow and the rule against unverifiable components, props and tokens.
- [Primer, `DESIGN_TOKENS_GUIDE.md`](https://raw.githubusercontent.com/primer/primitives/main/DESIGN_TOKENS_GUIDE.md). Semantic tokens only, pairing rules.
- [Primer, `@primer/mcp` README](https://raw.githubusercontent.com/primer/react/main/packages/mcp/README.md). The MCP package and its tools.
- [npm registry, `@primer/mcp`](https://registry.npmjs.org/@primer/mcp). Version and publication date.
- [Atlassian, `llms.txt`](https://atlassian.design/llms.txt). The split topic files.
- [npm registry, `@atlaskit/ads-mcp`](https://registry.npmjs.org/@atlaskit/ads-mcp). Version and tool names.
- [Atlassian, *What we learned testing portable design context in practice*](https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice). The login-screen table, including the no-context row.
- [Atlassian, *Giving AI agents design system context from the terminal*](https://www.atlassian.com/blog/ai-at-work/giving-ai-agents-design-system-context-from-the-terminal-what-we-learned-building-a-cli). The CLI figures and usage overtaking MCP.
- [zeroheight, *MCP*](https://zeroheight.com/mcp/). Hidden content kept from agents; off-system code audit.
- [zeroheight, *State of AI in design systems*](https://zeroheight.com/resources/state-of-ai-in-design-systems/). 17 percent rate docs very AI-ready; 48 percent run an MCP server.
- [Knapsack, *Intelligent tools*](https://docs.knapsack.cloud/intelligent-tools). Per-workspace MCP endpoint and data sources.
- [Supernova, *Design system MCP servers*](https://www.supernova.io/blog/design-system-mcp-servers). Vendor comparison table; vendor framing.
- [llmstxt.org](https://llmstxt.org/). The `llms.txt` proposal and the Markdown page convention.
- [agents.md](https://agents.md/). The `AGENTS.md` format, stewardship and nearest-file rule.
- [Design Tokens Community Group, *Format* 2025.10](https://www.designtokens.org/TR/2025.10/format/). `$description`, `$deprecated`, aliases.
- [W3C DTCG, first stable version announcement](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/). The 28 October 2025 date.
- [christophhdesign, open-design-system-bench](https://github.com/christophhdesign/open-design-system-bench). The benchmark and static audit described in sections 3, 6 and 7.
- [open-design-system-bench, `rubric.config.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/rubric.config.ts). Behavioural dimension weights.
- [open-design-system-bench, `src/audit/score.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/score.ts). Surface weights, sub-scores, bands and the uncalibrated note.
- [open-design-system-bench, `src/audit/checks/catalog-quality.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/catalog-quality.ts). Catalogue-quality formula and extraction-suspect flag.
- [open-design-system-bench, `src/audit/checks/vocabulary.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/vocabulary.ts). Convention-distance scoring.
- [open-design-system-bench, `src/audit/convention-lexicon.json`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/convention-lexicon.json). The lexicon and its weights.
- [open-design-system-bench, `src/audit/checks/deprecation.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/deprecation.ts). Deprecation legibility points.
- [open-design-system-bench, `src/audit/checks/surface.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/surface.ts). Enablement-surface points and the freshness bonus.
- [open-design-system-bench, `tasks/`](https://github.com/christophhdesign/open-design-system-bench/tree/main/tasks). The starter task set.
- [Southleft, `figma-console-mcp` README](https://raw.githubusercontent.com/southleft/figma-console-mcp/main/README.md). The six-category design-system health score.
- [Shopify Polaris, *Version 10 Typography*, community mirror](https://ss-polaris.vercel.app/whats-new/version-10-typography). The roughly 8 percent typography token coverage figure.

**Toolkit files read for Part four** (local, in `~/Projects/toolkit`)

- `projects/suiteify/snapshot/` and `projects/inception/snapshot/`: `index.json`, `tokens.json`, `components/*/figma.json`, `components/*/contract.json`.
- `projects/suiteify/audit/aFZOiPGOKbu9DyXbcIZeXj.json` and `projects/inception/audit/DOS51Hm6NEtNnTrNjbXZAU.json`.
- `projects/suiteify/parity/report.json`.
- `skills/figma-components-audit/scanner/measures.json` and `scoring.json`.
- `skills/figma-token-export/scripts/dtcg.js`.
- `tools/docs/src/pages/index.astro`, `tools/docs/src/pages/api/`, `tools/docs-mcp/server.mjs` and `validate.mjs`.

**Commentary, labelled as such in the text**

- [Murphy Trueman, *Your design system is fragmenting into agent files*](https://blog.murphytrueman.com/your-design-system-is-fragmenting-into-agent-files/). Context for the agent-file landscape and the evals method the bench follows.
- [Hardik Pandya, *Expose your design system to LLMs*](https://hardik.substack.com/p/expose-your-design-system-to-llms). A practitioner's token-discipline before and after (418 hard-coded values to zero).
- [Brad Frost, *Agentic design systems in 2026*](https://bradfrost.com/blog/post/agentic-design-systems-in-2026/). The constrained-materials argument.

**Companion guides in this folder**

- *Making a design system readable by AI agents* (`Machine-Readable Design System.md`). Rules, reference and snapshot layers; the `AGENTS.md` studies; health scores as diagnostics.
- *Figma and code alignment* (`figma-code-alignment.md`). Section 13's Claude test on Suiteify components.
- *The design-system docs ecosystem* (`design-system-docs-ecosystem.md`). Section 11's account of Altitude's parity overview.

**Cited but not resolved to a URL**

- zeroheight's help-centre article on its remote MCP server (tool names such as `lint-code`): the page returned 403, so tool names are taken only from its public MCP page's description of an audit flow.
- Supernova's MCP documentation at learn.supernova.io rendered empty; nothing from it is asserted.
- The designsystemsforai.com assessment's criteria could not be read.
- Diana Wolosin's Indeed benchmark is cited in the companion guide from secondary sources and is not relied on here.
