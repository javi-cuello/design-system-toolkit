# Making a design system usable by AI agents

An agent uses a design system well when the system's own content leaves it nothing to guess, when it can fetch that content on demand, and when something checks what it wrote. This piece argues that case, says what the evidence measures and what it does not, and ends on how to tell whether a system is ready without fooling yourself with a score.

Researched August to October 2026 and consolidated on 2 November 2026 from two earlier guides (*Making a design system readable by AI agents* and *AI-ready design systems*). Re-checked in November 2026 against primary sources: the arXiv record of Gloaguen et al. (now at version 3, 29 September 2026, with a revised conclusion), the DESIGN.md releases page (still 0.4.0, still no theming), Figma's Extended Collections help page (still Enterprise only), the DTCG site (2025.10 is still the only stable release), the Astryx README (still beta; it names codemods but no MCP server and no manifest), the Storybook MCP docs (10.6, still preview, nine tools), the npm registry for `@atlaskit/ads-mcp` (1.11.10, 29 October 2026) and `@primer/mcp` (1.1.2), and the open-design-system-bench releases (1.4, 29 October 2026, tiers still uncalibrated). The toolkit's own measures and pages were read from the toolkit's repository on 2 November 2026. Where a claim rests on one source or on vendor framing, the text says so. Extended on 4 November 2026 with a roster of the systems that ship servers, skills or `llms.txt` (section 5) and the lint rules that enforce component and token use (section 6), read from each system's own docs.

---

## What this answers

- What does "AI-ready" mean, stated as an outcome rather than a list of files?
- Which properties of the library itself decide whether an agent succeeds?
- Do names still matter once an agent can read the API?
- Where should rules, reference and snapshots live, and do `AGENTS.md` files help?
- Load everything at once, or serve it on demand?
- How does a system tell an agent what not to use, and check what it wrote?
- Can readiness be measured from files, or only by running agents?
- How should readiness be shown so it does not become a vanity score?
- How does any of it stay current?

Section 10 is the cheat sheet and section 11 the short version.

---

## 1. What does "AI-ready" mean?

**The short answer.** A design system is AI-ready to the degree that an agent given an ordinary product task uses the system's real components, with their real props, styled with its tokens, without being told which component to pick, at a cost in tokens and turns a team will tolerate. An MCP server, an `llms.txt` or a context file is a means to that, not the thing itself.

The definition matters because the failures are specific. An agent building against a design system goes wrong in four ways. It **invents a component** (`<Heading>` against a library whose text component is `Typography`). It **invents a prop** on a real component (`role="primary"` on a button that takes `buttonRole`). It **hard-codes a value** (`#1F6FEB` or `padding: 12px` where a token exists). Or it **rebuilds a component** it should have imported: a hand-made modal that looks right and bypasses the library's focus management. Each produces code that compiles and looks plausible, which is why each is expensive: a reviewer has to know the system to spot it.

Every source that measured anything describes the same four. Storybook's experiment on the Reshaped library found that agents left alone generate their own components. The open-design-system-bench encodes them in its scorers: an import of a component outside the extracted catalogue costs 40 points and fails the run, an invented prop costs 15, a raw colour 10.

So readiness has two halves. **Correctness**: does the output use the system faithfully? **Cost**: how many tokens, turns and seconds did it take? Atlassian's login-screen test (section 5) shows why both are needed: its portable `DESIGN.md` file got agents to more of the guidance than no context at all (about 30 percent against 5) and still cost more than no context (7.21M tokens against 4.20M), because the file loads in full on every turn. A measure that counted only correctness would call that file an improvement.

**What to do.** Write the outcome down before choosing tooling: real components, real props, tokens instead of literals, imports instead of rebuilds, at an acceptable cost. A system can ship every delivery surface and still fail all four tests.

---

## 2. Content before transport

**The short answer.** Five properties of the system's own content decide most of the outcome: every repeated thing is a component, every component has a typed and described interface, values are bound to semantic tokens, names sit close to the conventions agents already expect, and each design component is mapped to its code component. Delivery surfaces only carry what these five put there.

**The mechanism.** An agent choosing a component is doing retrieval, not reasoning. It matches the request against whatever text describes each component and picks the closest, then fills in props by matching the design's properties against what it knows of the code. Whatever the system leaves unstated, the agent fills from its training, which is mostly public web code. Every property below replaces a guess with a lookup.

- **Components, not drawings.** Figma's guidance for its MCP server lists six recommendations in order, and the first is that anything repeated should be a component. A detached frame that looks like a button reaches the agent as rectangles and text; there is nothing to import, so it writes markup.
- **A mapping from design to code.** Figma's second recommendation is Code Connect, "the number one way to get consistent component reuse", without which "the model is guessing". When a mapping exists, `get_design_context` returns its real import and usage in place of generated React and Tailwind. It needs a Full or Dev seat on a Professional, Education, Organization, Government or Enterprise plan; a Professional plan has one active library and one active framework (re-checked 9 November 2026).
- **A typed, described interface.** A typed prop is a closed set the agent cannot invent outside; a described prop is the only place intent ("use `tertiary` inside a dense table") can live. Storybook's AI docs ask for JSDoc on components and props, and its manifest passes the agent each `@summary`. The bench's catalogue-quality check weighs props tables 25, typed props 35, described props 25 and defaults 15 (the author's weights).
- **Bound, semantic tokens.** A model given `color-primary-500` pulls the value the team assigned to that role; given a hex value it can only copy it. Primer's `find_tokens` tool tells agents to search by intent (blue becomes accent, red becomes danger) and to check the result with its `lint_css` tool.
- **Conventional names.** Section 3.

**A worked case.** Project A's Figma Button exposes `Role: Primary`, `Feedback: Neutral` and `Left icon`. Its code, a wrapper over Material UI's Button, takes `buttonRole="primary"`, a Material UI `color` and `startIcon`. An agent reading the Figma instance with no mapping writes `<Button role="primary" feedback="neutral" leftIcon={...}>`: three plausible props, none valid. An agent that knows Material UI writes `variant="contained"`, which is valid Material UI and bypasses the wrapper's own prop. Every value in that Button is bound (Project A's audit recorded 31,772 bound properties and none unbound in October), so the colours are right; the interface is what fails. With a mapping, or the typed props in context, the output is correct, because the translation from `Role` to `buttonRole` is written once instead of guessed every time.

**What belongs in per-component metadata.** Several teams have published schemas for agent consumption, and the overlap is the signal:

| Field group | Status |
|---|---|
| Identity: name, description, category | Consensus, generatable |
| Props, variants, states | Consensus, generatable |
| Usage: when to use, common patterns | Consensus, hand-written |
| Accessibility: role, keyboard, WCAG notes | Consensus |
| Anti-patterns: what not to do, and why | Emerging |
| AI hints: priority, keywords, selection criteria | Emerging |
| Composition and relationships | Emerging |
| Business context, semantic role | One team only |

The retrieval mechanism explains the split. Identity, props and variants can be read out of a Figma component set or a code definition; intent cannot be derived from either. Keywords and selection criteria exist because they *are* the text the match runs against; anti-patterns exist because retrieval alone cannot tell an agent that the closest match is wrong. Cristian Morales built tools on exactly this (a metadata generator for usage, anti-patterns and "use this instead of that", and a selection layer for choosing between similar components).

The one team that measured it is Indeed, where Diana Wolosin turned MDX component docs into structured JSON and benchmarked 77 components across eight MCP configurations and 1,056 prompts: Markdown ran about 30,000 tokens per query at 82 percent coverage with hallucinations; structured JSON used about 80 percent fewer tokens at a fifth of the annual cost. Read the direction, not the decimals: the original write-up is behind a sign-in wall, secondary summaries quote slightly different numbers, and her case-study page reports a different, later pilot (over 4,000 prototypes). Her own nuance is the part people drop: JSON for the metadata an agent retrieves, Markdown for the rules a human writes.

**The counter-example.** Atlassian found that a *fuller* portable specification made agents re-create components instead of importing them, because a complete description of how a component looks is also a recipe for rebuilding it. Richness helps green-field generation and hurts brownfield maintenance. Hand-written fields also rot silently: nothing detects when a component's real use drifts from what was written a year ago.

**The toolkit's rule.** The toolkit settled the intent fields as a fixed structure in each Figma component's description, parsed by `tools/snapshot/guidance.cjs` into purpose, Usage, Don't, Behaviour, Composition and Code gen notes, with every Don't naming the alternative; the docs site links a Don't item that names another component to that component's page, and the audit raises a row for a public component missing Usage, Don't or Code gen notes (`tools/docs-site/README.md`, *Where things come from*; `knowledge/ui/profiles/documentation.md#the-component-page`). That is the "three intent fields" advice made checkable: use cases, anti-patterns with alternatives, and the notes a code generator needs.

**What to do.** Invest in content before transport, in Figma's own order: components for everything repeated, a mapping for every published component, types and short descriptions on every prop, semantic tokens bound everywhere. Generate the mechanical metadata, hand-write a small fixed set of intent fields, and mark which lines a human is accountable for.

---

## 3. Names still matter when the API is absent

**The short answer.** Less than people fear when the API is in context, much more than they hope when it is not. Agents fall back on the names that dominate public code, so a system whose names sit far from those conventions pays every time an agent works without full context, which is often.

The bench author mined a lexicon from 898 graded generations across six model configurations against two production systems: the names models invented when the system had no such name. The most frequent invented components were `Heading` and `Typography` (29 each), `Box` (26), `Card` (25) and `TextField` (21). The most frequent invented props were `as` (170), `spacing` (85, with `gap` as an alias), `color` (49), then `tone`, `variant`, `icon`, `label` and `fullWidth`. The bench turns this into a convention-distance score: a concept whose expected name exists is aligned, one where only a known alias exists (`Toggle` where agents expect `Switch`) is distance, and the score is 100 times one minus the occurrence-weighted share of distance.

A small controlled test on Project A's own components with Claude measured the effect from the other side (reported in [How closely Figma should match code](../figma-and-code/how-closely-figma-should-match-code.md), section 10). With the component API in context, naming made no difference: every condition was fully correct. Without it, aligning Figma's property names to the code's raised fully correct output from 33 to 52 percent and cut wrong props from 45 to 21. The failures that remained sat where Project A's code departs from Material UI: Claude wrote `variant` on every Button whatever the Figma property was called. Project A's parity comparison sizes the gap for one library: of 390 Figma properties across 52 components, 67 have no code counterpart, and of the other 323, 53 carry a different name in code (`Label text` is `children`, `Left icon` is `startIcon`) and 8 option values are renamed.

Three traps recur. **Assuming an MCP server makes names irrelevant**: it does only while the API is in context, and a quick prompt, an unmapped component or a design agent placing components by text search all fall back on names. **Aligning to the wrong convention**: renaming Figma's `Role` to match `buttonRole` fixes the design-to-code join and leaves the model's prior (`variant`) unbeaten. **Counting deliberate divergence as debt**: a considered name should carry its reason where agents read it.

**What to do.** Measure two distances: Figma to code (from a parity comparison) and code to convention (against a lexicon of names agents reach for). Close the first wherever the code is conventional. For the second, record each deliberate departure in the mapping and the agent-facing rules. The evidence is one benchmark's lexicon and one small test, so treat the effect sizes as directional.

---

## 4. Rules, reference and snapshots, kept apart

**The short answer.** Three kinds of knowledge, in three places, because they fail differently. **Rules** are short imperative constraints, written by a person and always in context, so every line costs on every turn. **Reference** is the bulk (component APIs, token values, usage), generated by a pipeline and fetched only when asked. A **snapshot** is one self-contained description of the visual identity, which travels anywhere and loads in full every time.

| Layer | What it holds | Where it lives | Loaded when | Written by |
|---|---|---|---|---|
| Rules | What never to do | `AGENTS.md`, `CLAUDE.md`, `SKILL.md` | Always, or on trigger | A person |
| Reference | Component APIs, token values, usage | An MCP server, a CLI, skills, schema files | On demand | A pipeline |
| Snapshot | The visual identity in one file | `DESIGN.md` | All at once | Generated, then tuned |

Rules rot when nobody prunes them, reference goes stale when the pipeline stops, and a snapshot is out of date the moment it is written. The common failure is one enormous file that tries to be all three, loads everything every turn, and buries the handful of instructions that change behaviour.

**Do context files help?** `AGENTS.md` is the cross-tool convention for repository rules (released by OpenAI in August 2025, donated to the Linux Foundation's Agentic AI Foundation on 9 December 2025, read by Codex, Cursor, Copilot, Gemini CLI and others; the nearest file to the edited code wins). Two controlled studies exist and they answer different questions.

- **Gloaguen et al.** (ETH Zurich and LogicStar.ai, arXiv:2602.11988, version 3 of 29 September 2026) ran four frontier models with no context file, a generated one and a developer-written one, on SWE-bench tasks and on issues from repositories that ship their own files. Context files "do not generally improve task success rates, while increasing inference cost by over 20% on average", across models, agents and both kinds of file. Inside that result: instructions are "well followed", while repository overviews, "although popular and recommended by model providers, are not helpful". The latest version's conclusion adds the useful half: context files "are useful for specifying non-standard coding practices", and any attempt to improve performance with them should be evaluated before it is deployed.
- **Lulla et al.** (ICSE JAWs 2026, arXiv:2601.20404) ran 124 real pull requests from 10 repositories twice with `gpt-5.2-codex`, with and without the repository's own `AGENTS.md`. Median runtime fell 28.64 percent (98.57 to 70.34 seconds) and median output tokens 16.58 percent (2,925 to 2,440). It measured efficiency only; correctness is stated as future work.

A file that makes an agent finish faster without making it finish correctly more often is consistent with both. Neither licenses "AGENTS.md is proven to help" or "proven not to". Both point the same way on what to write: the part of the file that earns its tokens is the instructions, especially the ones the code cannot say about itself, and the part that does not is the overview.

Four traps follow: the generated repository overview (usually the longest section and the one found unhelpful); the context file as documentation (anything discoverable from the code does not belong); the auto-generated file (cheapest, and the setting with no success benefit); and the unbounded file (cost scales with length on every call). For skills, Anthropic's guidance loads three levels: name and description at startup (about 100 tokens a skill), the body once triggered (under 500 lines), and bundled files only when referenced.

**The toolkit's tested rule.** Prose rules are advisory to the model however they are worded; the toolkit moved every step that must happen into hooks that refuse, and keeps prose for how to do a step well. That argument and its evidence are their own piece: [Why agent rules need the harness](agent-workflow-enforcement.md).

**What to do.** Write rules by hand as imperative constraints, delete the repository overview, and turn anything deterministic into a lint rule or a check: zero tokens, no compliance question.

---

## 5. On demand beats all at once

**The short answer.** For an established codebase, serve the reference on demand. The one published head-to-head is decisive, the vendors who measured agree on direction, and the remaining choice (server or CLI) is about a team's tooling, not settled evidence.

Atlassian ran the same task, building a login screen, with four kinds of context:

| Context given to the agent | Guidance reached | Tokens | Time | Turns |
|---|---|---|---|---|
| None | about 5% | 4.20M | 6m 19s | 43 |
| Atlassian's MCP server | about 80% | 3.75M | 5m 01s | 35.1 |
| Atlassian's skill | about 80% | 4.43M | 5m 23s | 36 |
| Portable `DESIGN.md` | about 30% | 7.21M | 6m 46s | 45.3 |

Atlassian named three causes. **All at once against on demand**: the file loads in full every turn, while a server answers a narrow question narrowly. **Portability forces compression, and compression cuts the useful part**: to stay portable the file was squeezed to 80KB (about 19,800 tokens) against roughly 2.5MB the server can draw on, and "we had to remove much of the usage guidance from our 50+ components, heavily trim our foundation guidance, and cut a number of design tokens". **A complete visual specification is a build recipe**: agents re-created Atlassian's components rather than importing them. Atlassian also had to ship a separate dark-mode file, because the format has no theming. It calls its own results not conclusive and publishes no run counts.

Storybook reported, for Reshaped with its MCP docs against a baseline, 12.8 percent better code usage, 2.76 times faster, 27 percent fewer tokens, without a published method. Atlassian's later CLI post reports an 8 percent cut in session time (352 to 325 seconds) and tokens (218k to 201k) against its own MCP server, and CLI usage overtaking MCP usage, which is one team's data.

**Who ships the on-demand route (as of 4 November 2026).** Atlassian's `@atlaskit/ads-mcp`, in Early Access, can run locally or from a hosted endpoint. Its tools are `ads_plan`, the search tools for tokens, components and icons, and axe-based accessibility tools, and its content is regenerated from ADS's structured content. Primer's `@primer/mcp` serves component APIs, examples, usage and accessibility guidelines, patterns, `find_tokens` "by intent or value" and `lint_css`. Carbon has a hosted server behind IBMid, serving "components, tokens, icons, guidance, and code"; its concepts page names the tools `code_audit`, `code_search`, `docs_search`, `get_charts` and `labs_search`. Spectrum ships `@react-spectrum/mcp`, agent skills and an `llms.txt`. Polaris folds its tooling into Shopify's `@shopify/dev-mcp`. Salesforce ships no server, only three agent skills that call the SLDS Linter. No official Fluent or GOV.UK server was found. `llms.txt` is live at atlassian.design, carbondesignsystem.com and react-spectrum.adobe.com, and returns 404 at primer.style and the GOV.UK design system. Atlassian's earlier prototyping post (26 November 2025) is the one with a number for prototyping: about 70 percent accuracy to the design system in one pass from a screenshot, with about 2,000 lines of custom instructions. To get there they collapsed per-component guideline files into one `guidelines.md` the tools could parse, and replaced prose prompting for the top navigation with a JSON config ("structured configuration beats open-ended prompting"), and paired it with two templates, Fast and Full, that come pre-coded with navigation, feature flags and a theme switcher. Logo errors dropped to "near zero" after the JSON config, though no before-and-after counts are given. The models still made up imports and packages when told not to and claimed the code was correct, and Atlassian names production-quality code at scale and automated evaluation as unsolved.

**The counter-position, fairly.** `DESIGN.md` is not trying to be a server. It is a portable, version-controllable description of an identity that works in any tool with nothing to run; Google Labs ships a CLI that lints, diffs and exports it (a Tailwind v4 `@theme` block since 0.2.0). For a green-field project, a small team or an outside hand-off, Atlassian's three objections lose most of their force. The format is still at 0.4.0 (27 July 2026), still pre-1.0, and still has no theming support in any release.

**The middle position.** A CLI that answers narrow questions gets the on-demand property of a server and the nothing-to-run property of a file. Meta's Astryx (open-sourced in beta in June 2026, React and StyleX, around 13,000 internal apps) states the design: "The API, docs, and CLI are designed together so a person and an AI assistant build the same way, from the same reference." **Correction:** earlier versions of this guide, following launch coverage, said Astryx also ships an MCP server and a JSON manifest that stops agents inventing props. Its README, re-read in November 2026, names a CLI for "component docs, templates, scaffolding, themes, and codemods" and mentions neither; treat both as unconfirmed.

**What to do.** Serve generated reference on demand from whatever the team already runs (a docs site's JSON, a server over it, or a CLI) and keep the rules file short. Add an `llms.txt` (an H1, a blockquote summary, H2 sections of links, an `Optional` section) and Markdown page variants when a docs site exists: an afternoon's work for agents that do not speak MCP. Atlassian's three objections are brownfield objections; for green-field work ship the snapshot with an explicit instruction to prefer existing components, and one file per theme until the format supports theming.

**What the toolkit built.** The toolkit took the on-demand route without a separate pipeline: its docs site writes a JSON API beside its pages at build time, and `tools/system-mcp` (named `docs-mcp` until 4 November 2026) is a read-only MCP server over that API for one project at a time, with `overview`, `search`, `get_contract`, `get_component`, `get_tokens`, `get_changes`, `get_audit`, `get_screen_recipe`, `list_pages`, `read_page` and `validate` (`tools/system-mcp/README.md`). The reference is whatever the site renders, so the server cannot say something the docs do not. It has no `llms.txt` and no Markdown page variants as of November 2026.

---

## 6. What not to use, and checking what was written

**The short answer.** Put deprecation where agents read (on the token or component itself), keep unpublished items out of view, and give the agent a validator. A deprecation that lives only in prose on a docs page is invisible to an agent that found the component by name, and a rule the agent may not read is advice while a check is a gate.

The DTCG 2025.10 format defines `$deprecated` (true, or a string giving the reason) beside `$value` and `$description` on the token; TypeScript's `@deprecated` does the same for a component or prop. Hiding is the second half: zeroheight's MCP keeps hidden content from agents, and Figma variables carry `hiddenFromPublishing`. A primitive that exists only to be aliased should not appear in an agent's search, because an agent that finds `Blue/600` will use it over `Color/Text/Link`. A worked case: a library renames `Spacing/md` to `Spacing/16` and keeps the old variable for a release. Without a flag, the export emits both and an agent searching "medium spacing" finds the old one first because it matches the word. With `$deprecated: "Use Spacing/16"` and the old variable hidden, the search returns one candidate.

Validation is the strongest of the three because it does not depend on the agent having read anything. Primer's `lint_css`, Atlassian's `ads_analyze_a11y`, zeroheight's code audit and v0's rule against anything it cannot verify in its sources are the same move: check the output against the closed set of real names.

The same check also ships as ordinary lint, which runs whether or not an agent wrote the code. Atlassian's `@atlaskit/eslint-plugin-design-system` bans raw elements one rule at a time (`no-html-button`, `no-html-anchor`, `no-html-text-input` and the rest) and enforces tokens with `ensure-design-token-usage`, which checks only colour unless its `domains` option is widened. Primer's stylelint config enforces its variables with `primer/colors`, `primer/spacing`, `primer/typography`, `primer/borders` and `primer/box-shadow`. Primer's ESLint plugin is mostly about deprecations and has no raw-element ban. Salesforce wraps the SLDS Linter in agent skills. The page that documents them reportedly warns that agents can skip the linter even when a skill marks it mandatory. The page returned 403, so that warning is unverified; it is still the argument for running lint in CI rather than in the prompt.

**The toolkit's version.** `tools/system-mcp/validate.mjs` checks generated code for raw colours (naming the token that holds each), token names the library lacks, prop values the component's contract does not have, and raw HTML where the library has a component (`<button>` where it has Button); it exits 1 on a finding, so a hook can run it once generation is done. The docs site's AI readiness page counts deprecated components whose description names a replacement (figma-standard rule 14, "Deprecated: use List instead."), because an agent that meets the old name with no replacement has nowhere to go (`tools/docs-site/src/lib/readiness.js`). The token export does not yet emit `$deprecated`.

**What to do.** `$deprecated` in exported tokens, `@deprecated` in code, a deprecated status that the docs and any server carry through; hide what is not for direct use; and run a validator on the agent's output, because it is the only one of the three that works when the agent skipped the others.

---

## 7. Measuring: files tell you about inputs, agents tell you about readiness

**The short answer.** A static audit measures whether the inputs an agent needs are present and well formed; only running agents measures whether those inputs change what agents produce. Static measures are cheap leading indicators and should be labelled as such. Nobody has yet shown how well the first predicts the second.

The open-design-system-bench keeps the two apart, and its design is worth copying. Its static **Surface** score weighs seven checks: enablement surface 20, catalogue quality 20, export hygiene 15, vocabulary 15, tokens 10, deprecation 10, docs greppability 10; a check that cannot measure returns nothing and its weight is redistributed rather than counted as zero. Its behavioural run adds **Lift** (guided against unguided), **Ceiling** (how good guided output gets), **Engagement** (share of runs that used the system at all) and a behavioural vocabulary score. The composite is labelled `surface-only`, `partial-behavioral` or `full-behavioral`, so a reader can see what it rests on. The author's own caveats carry the argument: static checks are weaker evidence than behaviour, the bands (70 "AI-native", 40 "Invested", below 40 "Emerging") are an uncalibrated default, and no correlation between Surface and behaviour has been measured. As of release 1.4 (29 October 2026) that is still so; 1.4 hardened the instrument instead (rubrics that a system cannot satisfy are withheld, judge claims are checked against the diff, a judge can take three samples).

**A behavioural run, concretely.** A fixed set of product tasks that never name a component (a password visibility toggle, an account-deletion confirmation, a paginated activity log), run with and without the system's context, each output scored mechanically for imports, invented components and props, raw values, accessibility and compilation, plus a model judge blind to the configuration. The bench weighs imports 10, API fidelity 25, token discipline 15, static accessibility 10, compilation 10 and the judge 30, extracts ground truth from the system's code rather than writing it by hand, and isolates unguided runs from the operator's own context files, which had been inflating baselines. Cost decides the size: about $1.50 per cell, so ten tasks, two context levels, one model and three repetitions is 60 cells, about $90. Single repetitions are only directional.

**Which static measures earn a place.** A measure passes when it counts something an agent retrieves and acts on, and when moving it requires fixing the system rather than adding a file. Interface completeness, design-to-code mapping coverage, vocabulary distance, token binding with a semantic share, token descriptions, deprecation flags on actual retired items, and freshness all pass. Surface presence (an `llms.txt`, an `AGENTS.md`, a server) mostly fails: worth one binary check, because the gap between no reference and some is the largest effect in Atlassian's table, and beyond that it rewards adding files. The bench gives 15 points for an `llms.txt` whether it is a curated index or a 2MB dump, and 20 for an `AGENTS.md` that restates the directory tree. zeroheight's survey of 123 practitioners shows the gap a checklist cannot see: 48 percent run an MCP server, 17 percent rate their docs very AI-ready.

Two traps are arithmetic. **Zero is not missing**: an input never collected shows as not measured. **A suspicious result is a finding about the instrument**: the bench flags a catalogue as extraction-suspect when 30 percent or more of exports show no props, after a field test found 63 percent of one popular library's exports empty, a docgen failure rather than a property of the library.

**What to do.** Compute the static measures that pass, label them static, reserve "ready" for a behavioural run, and never average the two until someone shows they move together.

---

## 8. Showing it: ratios with their gaps, never one number

**The short answer.** A few separate measures, each a ratio with its numerator and denominator visible and linked to the items that fail it, unmeasured inputs shown in words, and no composite or tier until a behavioural run has calibrated one. A score is a diagnostic; a lint rule is a gate.

A single readiness number invites presence gaming and hides which input is weak: two libraries at 62 can fail in opposite ways. "121 of 122 components described" can only be moved by describing a component, and names the one that is missing. Health scores generally have the same shape. Southleft's `figma-console-mcp` scores a Figma library out of 100 across naming, tokens, components, accessibility, consistency and coverage, each finding linked to the variable or component that caused it; it is a good audit that says nothing direct about agent output. Atlassian gates production with deterministic lint rules rather than an AI-scored audit, and Southleft's own commentary draws the governance line: automate the parsing, scoring and flagging, but a design system is "the encoded record of decisions an organization is accountable for", and what gets deprecated stays a person's call.

The most defensible single figure is coverage, because it is measurable and ties to a cost someone outside the team feels. Shopify's Laura Griffee reported Polaris components in 70 percent of the admin but Polaris tokens in only 44 percent of admin components: "This lack of token coverage makes it infinitely challenging and costly to ship large design changes at scale." A tracked issue set a 90 percent target across colour, motion, type and spacing; typography token coverage in custom components was about 8 percent before six components (`DisplayText`, `Heading`, `Subheading`, `Caption`, `TextStyle`, `VisuallyHidden`) collapsed into one `Text`. Keep the exception log primary and any score a rollup of it, as stylelint's allow-list makes each accepted deviation an explicit entry rather than an inline ignore.

**What the toolkit built.** The docs site's overview carries an "Understandable" group linking to an *AI readiness* page, described on the page itself as "what a person or an agent reading the Figma library can learn about intent", adding that whether an agent's code comes out right "needs the code, or a run with real agents". It shows, as ratios with their gaps listed: components whose description lacks Usage, Don't or Code gen notes (from the audit's open rows, so one source), automatic layer names and frames without auto layout, how old the snapshot is and whether the file has been edited since, published tokens described (variables hidden from publishing or marked private are not owed a description), and deprecations that name a replacement. There is no composite, no tier, and "Checked at the next full audit" where a check has not run (`tools/docs-site/src/pages/overview/ai-readiness.astro`). It covers the design-only half; the code-dependent ratios (mapped to code, same words) were not built as of November 2026. A behavioural run exists: the toolkit's `tools/skill-evals` has screen tasks, graded by `validate`, that compare an agent with and without the system's MCP server (see [What keeps an agent on track](what-keeps-an-agent-on-track.md), sections 7 and 8).

**What to do.** Show readiness as a small set of ratios with their gaps one click away, label static measures as static, keep any behavioural result in its own row with its run date and repetition count, and leave tiers out until there is evidence to calibrate them.

---

## 9. Keeping it current

**The short answer.** Regenerate only what is derivable, through a reviewed change, keep hand-written conventions out of the automated path, and put the reference's own age on the page. A stale reference still answers confidently.

The consensus pattern is regeneration from the source. Figma's webhooks fire on `FILE_UPDATE` (after 30 minutes of editing inactivity), `FILE_VERSION_UPDATE`, `FILE_DELETE`, `FILE_COMMENT`, `DEV_MODE_STATUS_UPDATE` and `LIBRARY_PUBLISH`, and the `LIBRARY_PUBLISH` payload carries created, modified and deleted arrays for components, styles and variables, so a listener knows what changed without re-diffing. The Variables REST API supports two-way sync through GitHub Actions; the write-back direction needs Enterprise membership, an editor seat and a write-scoped token. Astryx's CLI carries the consumer-side counterpart, a codemod runner for migrating between versions. Agents given an incomplete specification compensate silently by reading component implementations to recover missing guidance, which costs tokens and produces conclusions nobody reviewed.

Token-level parity is close to solved. Automatic component-API sync is not, and no vendor claims it; do not architect a loop that promises it. The toolkit's answer is narrower and measured: a release-pinned snapshot committed to git, a per-variant rendered comparison against it, and API changes made as reviewed proposals to a component contract rather than synced in either direction (`knowledge/code/figma-handoff.md#what-a-component-contract-covers`; the companion piece [One record, many outputs](design-system-docs-as-one-record.md)).

**The one fact no generator infers: which layer a brand switches.** Components consume semantic tokens, a rebrand edits primitives, and a brand switch remaps the semantic aliases or swaps a mode. A generator reading a library can list collections, modes and values; it cannot tell whether a mode is a brand, a theme or a platform, or which layer a rebrand should edit. Write it down, with the brand-by-theme grid as a table and the mechanism chosen:

| Mechanism | How it works | Constraint |
|---|---|---|
| Figma Extended Collections | A core collection is published and extended per brand, inheriting with overrides | Enterprise plan only (re-checked November 2026) |
| Multi-collection modes | Brands as modes within collections | Mode ceilings; related modes across collections cannot be linked |
| Theme packages | Each brand a separate published package | Brand assets fenced at the package boundary |

DTCG handles theming without duplicating files through group inheritance; 2025.10 is still its only stable release.

**What to do.** Keep the canonical artefacts in version control, regenerate only the derivable sections through a human-reviewed change, and add a staleness check (snapshot age against the file's last edit) so a loop that stops running is seen.

---

## 10. Cheat sheet

| If you want an agent to | Put it here | Not here |
|---|---|---|
| Import the real component | A design-to-code mapping per component | Hope that an MCP server exists |
| Write valid props | Typed, described props; Figma and code names aligned | More documentation pages |
| Use tokens, never raw values | Bound semantic tokens, plus a validator on its output | A rule in a context file alone |
| Know when *not* to use a component | A Don't field naming the alternative | Prose on the docs site |
| Guess well when the API is absent | Names close to what agents reach for, departures recorded | Internal consistency only |
| Avoid retired items | `$deprecated`, `@deprecated`, hidden from publishing | A changelog's existence |
| Understand the repository layout | Nowhere; delete the overview | The top of `AGENTS.md` |
| Be blocked from a mistake | A lint rule or a check it runs | Any context file |
| Know the brand-switching layer | A written statement and a table | Inferred from the Figma file |
| Work outside your infrastructure | A portable snapshot, or a CLI | A server with no fallback |

| Question | Measure it by | Not by |
|---|---|---|
| Is the reference current? | Snapshot age against the file's last edit | The docs build date alone |
| Is the system ready? | A behavioural run, tasks that never name a component | Any static score |
| How should it be shown? | Ratios with their gaps linked; "not measured" in words | One number and a tier |

---

## 11. The short version

A design system is AI-ready when an agent given an ordinary task uses the real components, with the real props, styled with tokens, without being told which component to pick, at a cost a team accepts. The four failures (an invented component, an invented prop, a hard-coded value, a rebuild instead of an import) are the same in every source that measured anything.

What makes agents succeed is mostly content: components for everything repeated, a mapping from each design component to its code, typed and described props, semantic tokens bound everywhere, and names near the conventions agents already know. Generate the mechanical metadata and hand-write a small fixed set of intent fields, each Don't naming the alternative.

Keep rules, reference and snapshots apart. Of the two `AGENTS.md` studies, one found no general gain in task success at over 20 percent more cost and the other found faster runs without checking correctness; both point at the same thing to keep, instructions the code cannot state about itself, and the same thing to delete, the repository overview. Serve the reference on demand: in Atlassian's test an all-at-once file cost more than no context at all.

Flag retired items where agents read, and run a validator on what they write, because a rule they may not read is advice and a check is a gate. Measure inputs statically as ratios that name their gaps, label them static, and keep the word "ready" for a behavioural run. Regenerate only what is derivable, through a reviewed change, and write down which layer your brands switch at, because nothing else in the pipeline records it.

---

## 12. What to re-check later

- **A study that tests success and efficiency on the same sample.** Gloaguen et al. (v3, September 2026) and Lulla et al. still measure different outcomes on different samples.
- **Vendor benchmarks without sample sizes.** Atlassian calls its results not conclusive; Storybook's March 2026 figures come without a method.
- **No controlled study isolates one property** (binding, descriptions, naming) and measures its effect on agent output; the Project A test is the closest and is small.
- **The bench's tiers and lexicon.** Uncalibrated as of 1.4; the lexicon (version 1, mined 25 August 2026) is one author's mining. Re-check before vendoring either.
- **`DESIGN.md` theming.** Still absent at 0.4.0; when it lands, section 5's one-file-per-theme workaround expires.
- **Astryx.** Still beta; whether it ships an MCP server or an agent manifest should be read from its own docs, not launch coverage.
- **Extended Collections below Enterprise**, which is what keeps the alternative brand architectures alive.
- **Storybook's MCP tool names**, which have changed between releases; those in use are from 10.6.
- **The toolkit's readiness page** covers the design-only half; the code-side ratios are not built. A behavioural run through `validate` is built as `tools/skill-evals` screen tasks ([What keeps an agent on track](what-keeps-an-agent-on-track.md), sections 7 and 8); the page does not show its results.
- **The evidence base is Western and vendor-heavy.** Every measured result comes from a US or Australian design-system team or a vendor selling the surface it measured.

---

## Sources

**Primary: studies, specifications and repositories**

- [Gloaguen, Mündler, Müller, Raychev and Vechev, *Evaluating AGENTS.md*, arXiv:2602.11988](https://arxiv.org/abs/2602.11988). Version 3, 29 September 2026; abstract quoted from it.
- [Lulla et al., *On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents*, arXiv:2601.20404](https://arxiv.org/abs/2601.20404).
- [Linux Foundation, *Formation of the Agentic AI Foundation*](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation). The donation and the 60,000-project figure.
- [agents.md](https://agents.md/). The format and nearest-file rule.
- [llmstxt.org](https://llmstxt.org/). The `llms.txt` proposal; `llms-full.txt` is not part of it.
- [Design Tokens Community Group, Format 2025.10](https://www.designtokens.org/TR/2025.10/format/). `$description`, `$deprecated`, aliases.
- [W3C DTCG, first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/).
- [google-labs-code/design.md](https://github.com/google-labs-code/design.md) and its [releases](https://github.com/google-labs-code/design.md/releases). 0.4.0, 27 July 2026.
- [facebook/astryx](https://github.com/facebook/astryx). Beta; the "designed together" quote; the CLI's codemods.
- [christophhdesign, open-design-system-bench](https://github.com/christophhdesign/open-design-system-bench), with [`score.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/score.ts), [`rubric.config.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/rubric.config.ts), [`vocabulary.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/vocabulary.ts), [`convention-lexicon.json`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/convention-lexicon.json), [`catalog-quality.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/catalog-quality.ts), [`deprecation.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/deprecation.ts), [`surface.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/surface.ts) and [`tasks/`](https://github.com/christophhdesign/open-design-system-bench/tree/main/tasks); release 1.4.
- [Anthropic, *Skill authoring best practices*](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) and [*Agent Skills overview*](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview).

**Primary: vendor documentation and measured reports**

- [Atlassian, *What we learned testing portable design context in practice*](https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice). The login-screen table, the 80KB figure and quote.
- [Atlassian, *Giving AI agents design system context from the terminal*](https://www.atlassian.com/blog/ai-at-work/giving-ai-agents-design-system-context-from-the-terminal-what-we-learned-building-a-cli). The CLI figures.
- [Atlassian, *Building the context engine for the AI era*](https://www.atlassian.com/blog/ai-at-work/atlassian-design-system-building-the-context-engine-for-the-ai-era).
- [npm, `@atlaskit/ads-mcp`](https://registry.npmjs.org/@atlaskit/ads-mcp). 1.11.10 as of 29 October 2026.
- [Atlassian, `llms.txt`](https://atlassian.design/llms.txt). Split topic files.
- [Atlassian, *Turning handoffs into handshakes*](https://www.atlassian.com/blog/how-we-build/turning-handoffs-into-handshakes-integrating-design-systems-for-ai-prototyping-at-scale) (26 November 2025), the [`@atlaskit/ads-mcp` README](https://cdn.jsdelivr.net/npm/@atlaskit/ads-mcp/README.md) and [`ensure-design-token-usage`](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage).
- [Primer MCP](https://primer.style/product/getting-started/foundations/mcp), [Primer stylelint config](https://github.com/primer/stylelint-config), [`eslint-plugin-primer-react`](https://github.com/primer/eslint-plugin-primer-react); [Carbon MCP](https://carbondesignsystem.com/getting-started/carbon-mcp/overview) and [concepts](https://carbondesignsystem.com/getting-started/carbon-mcp/concepts); [React Spectrum, AI](https://react-spectrum.adobe.com/ai.md); [Polaris, using MCP](https://shopify.dev/docs/api/polaris/using-mcp.md); [SLDS Linter agent skills](https://developer.salesforce.com/docs/platform/slds-linter/guide/get-started-linter-AI-skills.html) (403 when fetched).
- [Figma, *Structure your Figma file*](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file). The six recommendations and the Code Connect line.
- [Figma, MCP *Tools and prompts*](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/).
- [Figma, *Code Connect* help](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect). Plans and seats.
- [Figma Resource Library, *LLM context design*](https://www.figma.com/resource-library/llm-context-design/).
- [Figma, webhook events](https://developers.figma.com/docs/rest-api/webhooks-events/).
- [Figma, Variables GitHub Action example](https://github.com/figma/variables-github-action-example).
- [Figma, *Extend a variable collection*](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection). "Available on the Enterprise plan", re-checked November 2026.
- [Figma blog, *Schema 2025: Design systems for a new era*](https://www.figma.com/blog/schema-2025-design-systems-recap/). The help-centre page *What's new from Schema 2025* was removed (404 on 9 November 2026).
- [Storybook, MCP overview](https://storybook.js.org/docs/ai/mcp/overview), [manifests](https://storybook.js.org/docs/ai/manifests), [AI best practices](https://storybook.js.org/docs/ai/best-practices), [*Storybook MCP for React*](https://storybook.js.org/blog/storybook-mcp-for-react/) and the [Reshaped experiment](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1).
- [Primer, `DESIGN_TOKENS_GUIDE.md`](https://github.com/primer/primitives/blob/main/DESIGN_TOKENS_GUIDE.md) and the [`@primer/mcp` README](https://raw.githubusercontent.com/primer/react/main/packages/mcp/README.md).
- [shadcn/ui, `registry-item.json`](https://ui.shadcn.com/docs/registry/registry-item-json) and [`llms.txt`](https://ui.shadcn.com/llms.txt).
- [Vercel v0, *Design systems 2.0*](https://v0.app/docs/design-systems-2). The `SKILL.md` flow and the unverifiable-names rule.
- [zeroheight, *MCP*](https://zeroheight.com/mcp/) and [*State of AI in design systems*](https://zeroheight.com/resources/state-of-ai-in-design-systems/).
- [Southleft, `figma-console-mcp`](https://github.com/southleft/figma-console-mcp). The six-category health score.
- [Laura Griffee, *Putting the system back in our design system*](https://lauragriffee.medium.com/putting-the-system-back-in-our-design-system-b2c55a392dea).
- [Shopify, Polaris issue #4528](https://github.com/Shopify/polaris-react-archive/issues/4528) and [*Version 10 Typography*, community mirror](https://ss-polaris.vercel.app/whats-new/version-10-typography).

**Toolkit (the toolkit's repository)**

- `tools/system-mcp/README.md` and `validate.mjs`; `tools/skill-evals/README.md`; `tools/docs-site/README.md`, `src/lib/readiness.js`, `src/pages/overview/ai-readiness.astro`; `tools/snapshot/guidance.cjs`; `skills/figma-components-audit/scanner/measures.json`.
- `knowledge/ui/profiles/documentation.md`; `knowledge/code/figma-handoff.md`.
- Project A's snapshot, audit record and parity report, as computed on 10 October 2026.

**Commentary, labelled as such in the text**

- [Diana Wolosin, *AI Metadata: Powering a Design System MCP*](https://www.designsystemscollective.com/ai-metadata-powering-a-design-system-mcp-b5deafcae8f5) and her [case study](https://dianawolosin.com/use-cases/ai-metadata-systems); [Into Design Systems' write-up](https://intodesignsystems.substack.com/p/ai-design-system-mcp-example).
- [Cristian Morales, *Building an AI-Ready Design System*](https://www.giorris.dev/thoughts/building-an-ai-ready-design-system).
- [Southleft, *Machine-Readable, Not Machine-Governed*](https://southleft.substack.com/p/machine-readable-not-machine-governed).
- [Murphy Trueman, *Your design system is fragmenting into agent files*](https://blog.murphytrueman.com/your-design-system-is-fragmenting-into-agent-files/).
- [Hardik Pandya, *Expose your design system to LLMs*](https://hardik.substack.com/p/expose-your-design-system-to-llms).
- [Brad Frost, *Agentic design systems in 2026*](https://bradfrost.com/blog/post/agentic-design-systems-in-2026/).
- [MarkTechPost, *Meta Open-Sources Astryx*](https://www.marktechpost.com/2026/07/21/meta-open-sources-astryx-an-agent-ready-react-design-system-with-150-accessible-components-seven-themes-and-a-cli/). The source of the MCP and manifest claims the README does not support.

**Cited but not resolved**

- zeroheight's help-centre article on its remote MCP server (403), Supernova's MCP documentation (rendered empty) and the designsystemsforai.com criteria (script-rendered): nothing from them is asserted.
- Telekom Scale's neutral-theme package split and a Dow Jones multi-brand variables architecture, cited in an earlier version as non-mode alternatives, not re-opened.
