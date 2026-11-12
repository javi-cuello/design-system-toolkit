# What a design system's library should carry for an agent

Which parts of a library's own content decide what an agent builds from it, and which of them a person has to write.

A design-system team spends a quarter on an MCP server, and it works: an agent can ask for the Button and get it back. Then the agent writes `<Button role="primary" feedback="neutral">`, three plausible props of which none exist in code. The server carried the library faithfully. What the library said about its Button was the problem, and no server could have fixed that.

---

## What this answers

- [Five deciding properties](#five-deciding-properties): which properties decide what an agent builds
- [Component metadata](#component-metadata): what goes in it
- [The weight of names](#the-weight-of-names): do names still matter to an agent
- [Marking what to avoid](#marking-what-to-avoid): how a library flags what not to use

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs.

---

## Five deciding properties

Five properties of the library's own content decide most of the outcome: repeated things are components, each design component is mapped to its code, props are typed and described, values are bound to semantic tokens, and names sit close to what agents expect.

Servers and context files, the subject of [Part 4](how-the-system-reaches-the-agent.md), only carry what these five put there. To see why, it helps to watch an agent choose.

An agent choosing a component is doing retrieval, not reasoning. It matches the request against whatever text describes each component and picks the closest. Then it fills in props by matching the design's properties against what it knows of the code.

Whatever the library leaves unstated, the agent fills from its training, which is mostly public web code. Each of the five properties replaces a guess with a lookup.

- **Components, not drawings.** [Figma's guidance for its MCP server](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file) lists six recommendations in order, and the first is that anything repeated should be a component. A detached frame that looks like a button reaches the agent as rectangles and text. There's nothing to import, so it writes markup.
- **A mapping from design to code.** Figma's second recommendation is Code Connect, "the number one way to get consistent component reuse", without which the model is left guessing. When a mapping exists, the server's [`get_design_context` tool](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/) returns its real import and usage in place of generated React and Tailwind. It's a paid feature, tied to the seat and the plan.
- **A typed, described interface.** A typed prop is a closed set the agent can't invent outside. A described prop is the only place intent ("use `tertiary` inside a dense table") can live. [Storybook's AI docs](https://storybook.js.org/docs/ai/best-practices) ask for JSDoc on components and props, and its [manifest](https://storybook.js.org/docs/ai/manifests) passes the agent each `@summary`. The bench's catalogue-quality check, in the author's weights, gives props tables 25, typed props 35, described props 25 and defaults 15.
- **Bound, semantic tokens.** A model given `color-primary-500` pulls the value the team assigned to that role; given a hex value, it can only copy it. Primer's `find_tokens` tool tells agents to search by intent (blue becomes accent, red becomes danger) and to check the result with its `lint_css` tool.
- **Conventional names.** These get their own section, [the weight of names](#the-weight-of-names).

Here is what a missing mapping costs on one real component. Project A's Figma Button exposes `Role: Primary`, `Feedback: Neutral` and `Left icon`. Its code, a wrapper over Material UI's Button, takes `buttonRole="primary"`, a Material UI `color` and `startIcon`. The figure sets the two side by side, with what an agent writes when nothing connects them.

<svg role="img" viewBox="0 0 680 310" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Project A's Button in Figma and in code. Left, the Figma properties: Role Primary, Feedback Neutral, Left icon. Right, the code props: buttonRole primary, color, startIcon. Middle, what an agent writes with no mapping: role primary, feedback neutral, leftIcon, none of which exists; and what one that knows Material UI writes: variant contained, valid Material UI that skips the wrapper's own prop.</title>
<rect x="0" y="0" width="680" height="310" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">In Figma</text>
<rect x="20" y="44" width="190" height="150" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="36" y="76" font-size="13" fill="#5a5850">Role</text>
<text x="194" y="76" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="end">Primary</text>
<text x="36" y="116" font-size="13" fill="#5a5850">Feedback</text>
<text x="194" y="116" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="end">Neutral</text>
<text x="36" y="156" font-size="13" fill="#5a5850">Left icon</text>
<text x="194" y="156" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="end">On</text>
<text x="470" y="30" font-size="14" font-weight="600" fill="#1a1a1a">In code</text>
<rect x="470" y="44" width="190" height="150" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="486" y="76" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="#1a1a1a">buttonRole="primary"</text>
<text x="486" y="116" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="#1a1a1a">color</text>
<text x="486" y="156" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="#1a1a1a">startIcon</text>
<text x="340" y="30" font-size="14" font-weight="600" fill="#1a1a1a" text-anchor="middle">What the agent writes</text>
<rect x="230" y="44" width="220" height="150" rx="8" fill="#fdecea" stroke="#c62828" stroke-dasharray="4 3"/>
<text x="246" y="76" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="#c62828">role="primary"</text>
<text x="246" y="116" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="#c62828">feedback="neutral"</text>
<text x="246" y="156" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="#c62828">leftIcon={...}</text>
<text x="246" y="182" font-size="12" fill="#5a5850">From Figma alone: none exists</text>
<rect x="230" y="210" width="220" height="80" rx="8" fill="#fff6e0" stroke="#a66b00" stroke-dasharray="4 3"/>
<text x="246" y="238" font-size="13" font-family="ui-monospace, Menlo, monospace" fill="#a66b00">variant="contained"</text>
<text x="246" y="260" font-size="12" fill="#5a5850">From Material UI habit: valid</text>
<text x="246" y="276" font-size="12" fill="#5a5850">there, but skips buttonRole</text>
</svg>

Neither guess in the middle matches the right-hand column. An agent reading the Figma instance with no mapping writes `<Button role="primary" feedback="neutral" leftIcon={...}>`: three plausible props, none valid. An agent that knows Material UI writes `variant="contained"`, which is valid Material UI and bypasses the wrapper's own prop.

The colours, meanwhile, are right. Every value in that Button is bound: Project A's audit recorded 31,772 bound properties and none unbound. The interface is what fails.

With a mapping, or the typed props in context, the output is correct, because the translation from `Role` to `buttonRole` is written once instead of guessed every time.

Put your effort into content before transport, in Figma's own order: components for everything repeated, a mapping for every published component, types and short descriptions on every prop, semantic tokens bound everywhere. **A delivery surface can only carry what the library already states, so the library's content is where the first effort goes.** The order is Figma's own guidance. Putting it ahead of servers and context files is a judgement, resting on the one head-to-head test, Atlassian's, which [Part 4](how-the-system-reaches-the-agent.md) describes.

---

## Component metadata

Component metadata is a small fixed set of fields, most of them generated from the component itself, plus three that only a person can write: when to use it, when not to (naming the alternative), and the notes a code generator needs.

Several teams have published schemas for agent consumption, and the overlap between them is the signal. The table lists the field groups and how widely each is shared.

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

The split between generated and hand-written follows from retrieval. Identity, props and variants can be read out of a Figma component set or a code definition. Intent can't be derived from either.

Keywords and selection criteria exist because they *are* the text the match runs against. Anti-patterns exist because retrieval alone can't tell an agent that the closest match is wrong.

Cristian Morales built tools on exactly this, described in his essay [*Building an AI-Ready Design System*](https://www.giorris.dev/thoughts/building-an-ai-ready-design-system): a metadata generator for usage, anti-patterns and "use this instead of that", and a selection layer for choosing between similar components.

The one team that measured the format is Indeed. Diana Wolosin, in [her own write-up](https://www.designsystemscollective.com/ai-metadata-powering-a-design-system-mcp-b5deafcae8f5), turned MDX component docs into structured JSON and benchmarked 77 components across eight MCP configurations and 1,056 prompts.

Markdown ran about 30,000 tokens per query at 82 percent coverage, with hallucinations. Structured JSON used about 80 percent fewer tokens, at a fifth of the annual cost. Read the direction, not the decimals. Her own nuance is the part people drop: JSON for the metadata an agent retrieves, Markdown for the rules a human writes.

More isn't always better, though. Atlassian found that a *fuller* portable specification made agents re-create components instead of importing them, because a complete description of how a component looks is also a recipe for rebuilding it (the test is in [Part 4](how-the-system-reaches-the-agent.md)). Richness helps green-field generation and hurts brownfield maintenance.

Hand-written fields have a second cost: they rot silently. Nothing detects when a component's real use drifts from what was written a year ago.

The design-system toolkit shows one way to make the intent fields checkable. It settled them as a fixed structure in each Figma component's description. One parser, [`tools/snapshot/guidance.cjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/guidance.cjs), reads it into purpose, Usage, Don't, Behaviour, Composition and Code gen notes, with every Don't naming the alternative.

Two things then lean on that structure. The docs site links a Don't item that names another component to that component's page ([docs site README](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/README.md), *Where things come from*). And the audit raises a row for a public component missing Usage, Don't or Code gen notes ([documentation profile, the component page](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/profiles/documentation.md#the-component-page)).

That makes the three intent fields something a check can count: use cases, anti-patterns with alternatives, and the notes a code generator needs.

Generate your mechanical metadata, hand-write a small fixed set of intent fields, and mark which lines a person is accountable for. **Every Don't names the alternative, because retrieval finds the nearest component and only that line can say it's the wrong one.** The field groups marked consensus are shared across the published schemas. The three-field minimum is a judgement: it is the smallest set that covers what retrieval can't derive.

---

## The weight of names

Names matter less than people fear when the component's API is in the agent's context, much more than they hope when it isn't, and an agent often works without it.

Without the API, agents fall back on the names that dominate public code. So a library whose names sit far from those conventions pays every time.

How far do agents reach for public names? The bench author mined a lexicon from 898 graded generations across six model configurations against two production systems: the names models invented when the system had no such name.

- The most frequent invented components were `Heading` and `Typography` (29 each), `Box` (26), `Card` (25) and `TextField` (21).
- The most frequent invented props were `as` (170), `spacing` (85, with `gap` as an alias), `color` (49), then `tone`, `variant`, `icon`, `label` and `fullWidth`.

The bench turns this into a convention-distance score. A concept whose expected name exists is aligned. One where only a known alias exists (`Toggle` where agents expect `Switch`) is distance. The score is 100 times one minus the occurrence-weighted share of distance.

A small controlled test on Project A's own components with Claude measured the effect from the other side. It is reported in [How closely should a Figma library match its code?](../figma-and-code/how-closely-figma-should-match-code.md), under what alignment changes for AI.

With the component API in context, naming made no difference: every condition was fully correct. Without it, aligning Figma's property names to the code's raised fully correct output from 33 to 52 percent, and cut wrong props from 45 to 21.

The failures that remained sat where Project A's code departs from Material UI: Claude wrote `variant` on every Button, whatever the Figma property was called.

How big is that gap in one library? Project A's parity comparison sizes it. Of 390 Figma properties across 52 components, 67 have no code counterpart. Of the other 323, 53 carry a different name in code (`Label text` is `children`, `Left icon` is `startIcon`), and 8 option values are renamed.

Three traps recur.

**Assuming an MCP server makes names irrelevant.** It does only while the API is in context. A quick prompt, an unmapped component or a design agent placing components by text search all fall back on names.

**Aligning to the wrong convention.** Renaming Figma's `Role` to match `buttonRole` fixes the join between design and code, and leaves the model's prior (`variant`) unbeaten.

**Counting deliberate divergence as debt.** A considered name should carry its reason where agents read it.

Measure two distances: Figma to code, from a parity comparison, and code to convention, against a lexicon of names agents reach for. Close the first wherever your code is conventional. For the second, record each deliberate departure in the mapping and in the agent-facing rules. **A name far from public convention costs on every run without full context, so either move it or write down why it stays.** The evidence is one benchmark's lexicon and one small test, so treat the effect sizes as directional.

---

## Marking what to avoid

A library marks what to avoid by putting deprecation where agents read it, on the token or component itself, and keeping unpublished items out of view.

A deprecation that lives only in prose on a docs page is invisible to an agent that found the component by name. It never passes that page.

Two formats already have a place for the flag. The [DTCG 2025.10 format](https://www.designtokens.org/TR/2025.10/format/) defines `$deprecated` (true, or a string giving the reason) beside `$value` and `$description` on the token. TypeScript's `@deprecated` does the same for a component or a prop.

Hiding is the second half. [zeroheight's MCP](https://zeroheight.com/mcp/) keeps hidden content from agents, and Figma variables carry `hiddenFromPublishing`. A primitive that exists only to be aliased shouldn't appear in an agent's search, because an agent that finds `Blue/600` will use it over `Color/Text/Link`.

Here is the difference in one rename. A library renames `Spacing/md` to `Spacing/16` and keeps the old variable for a release. Without a flag, your export emits both, and an agent searching "medium spacing" finds the old one first, because it matches the word. With `$deprecated: "Use Spacing/16"` and the old variable hidden, the search returns one candidate.

The toolkit's docs site carries a version of this. Its AI readiness page counts deprecated components whose description names a replacement ([`readiness.js`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/src/lib/readiness.js)). It follows figma-standard rule 14 ("Deprecated: use List instead."), because an agent that meets the old name with no replacement has nowhere to go. The toolkit's token export doesn't emit `$deprecated`.

Flagging and hiding still depend on the agent reading the flag. The third move, a validator run on what the agent wrote, works whether or not it read anything. It belongs to the harness, and is covered with the lint rules that do the same job in [Part 5, What keeps an agent on track](what-keeps-an-agent-on-track.md), under what a guardrail is.

Put `$deprecated` in your exported tokens and `@deprecated` in code, and carry a deprecated status through the docs and any server. Make every deprecation name its replacement, and hide anything not for direct use from publishing. **A retired item has to say so on itself, because an agent reaches it by name and never passes the docs page that announces it.** The two flags are what the DTCG format and TypeScript define; naming the replacement is the toolkit's rule.

---

## Cheat sheet

| For an agent to | Put it here | Not here |
|---|---|---|
| Import the real component | A design-to-code mapping per component | Hope that an MCP server exists |
| Write valid props | Typed, described props; Figma and code names aligned | More documentation pages |
| Use tokens, never raw values | Bound semantic tokens, plus a validator on its output (Part 5) | A rule in a context file alone |
| Know when *not* to use a component | A Don't field naming the alternative | Prose on the docs site |
| Guess well when the API is absent | Names close to what agents reach for, departures recorded | Internal consistency only |
| Avoid retired items | `$deprecated`, `@deprecated`, hidden from publishing, a named replacement | A changelog's existence |

---

## The short version

What makes agents succeed is mostly your library's own content. Anything repeated is a component, so there's something to import. Each design component is mapped to its code component, so the agent stops translating `Role` into a guessed prop. Props are typed and described, so the agent can't invent outside the set and can read the intent. Tokens are semantic and bound everywhere, so the agent copies a role rather than a hex value.

Generate the mechanical metadata and hand-write a small fixed set of intent fields: when to use, when not to (naming the alternative), and notes for code generation. A fuller description isn't always better: Atlassian found a complete visual specification made agents rebuild components instead of importing them.

Names still matter, because agents fall back on public conventions whenever the API isn't in context. Measure the distance from Figma to code and from code to convention, close the first where your code is conventional, and record each deliberate departure. Finally, flag retired items on the token or component itself, name the replacement, and hide what isn't for direct use.

---

## What to re-check later

Researched November 2026, when this part was assembled from guides first researched between August and October 2026 and re-checked against primary sources that month.

- **Where this came from.** This part was split on 9 November 2026 out of *Making a design system usable by AI agents* (sections 2, 3 and the first half of 6), which had been consolidated on 2 November 2026 from two earlier guides. The original is archived at `_archive/2026-11-09/machine-readable-design-systems.md`; the two guides before it are in `_archive/2026-11-02/`. The toolkit was read from its repository on 2 November 2026. Rewritten into the current house voice on 11 November 2026, with no change of substance; the earlier text is in `_archive/2026-11-11/ai-and-docs/`.
- **Wolosin's figures.** The original write-up is behind a sign-in wall, secondary summaries quote slightly different numbers, and her case-study page reports a different, later pilot (over 4,000 prototypes). Treat the direction as the finding. Wolosin and Morales are practitioners writing commentary, not published studies.
- **No controlled study isolates one property** (binding, descriptions, naming) and measures its effect on agent output; the Project A test is the closest and is small.
- **The bench's lexicon** (version 1, mined 25 August 2026) is one author's mining, and the catalogue-quality weights are the author's own. Re-check before vendoring either.
- **Code Connect plans and seats**, checked 9 November 2026: it needs a Full or Dev seat on a Professional, Education, Organization, Government or Enterprise plan, and a Professional plan has one active library and one active framework.
- **Project A's audit figure** (31,772 bound properties, none unbound) is from October 2026.
- **The toolkit's token export** did not emit `$deprecated` as of November 2026.

---

## Sources

**Primary: specifications, vendor documentation and benchmarks**

- [Figma, *Structure your Figma file*](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file). The six recommendations and the Code Connect line.
- [Figma, MCP *Tools and prompts*](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/).
- [Figma, *Code Connect* help](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect). Plans and seats.
- [Figma Resource Library, *LLM context design*](https://www.figma.com/resource-library/llm-context-design/).
- [Storybook, AI best practices](https://storybook.js.org/docs/ai/best-practices) and [manifests](https://storybook.js.org/docs/ai/manifests).
- [Primer, `DESIGN_TOKENS_GUIDE.md`](https://github.com/primer/primitives/blob/main/DESIGN_TOKENS_GUIDE.md) and the [`@primer/mcp` README](https://raw.githubusercontent.com/primer/react/main/packages/mcp/README.md). `find_tokens` by intent.
- [Design Tokens Community Group, Format 2025.10](https://www.designtokens.org/TR/2025.10/format/). `$description`, `$deprecated`, aliases.
- [zeroheight, *MCP*](https://zeroheight.com/mcp/). Hidden content kept from agents.
- [christophhdesign, open-design-system-bench](https://github.com/christophhdesign/open-design-system-bench), with [`vocabulary.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/vocabulary.ts), [`convention-lexicon.json`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/convention-lexicon.json) and [`catalog-quality.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/catalog-quality.ts); release 1.4.
- [Atlassian, *What we learned testing portable design context in practice*](https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice). The rebuild-instead-of-import finding.

**Commentary**

- [Diana Wolosin, *AI Metadata: Powering a Design System MCP*](https://www.designsystemscollective.com/ai-metadata-powering-a-design-system-mcp-b5deafcae8f5) and her [case study](https://dianawolosin.com/use-cases/ai-metadata-systems); [Into Design Systems' write-up](https://intodesignsystems.substack.com/p/ai-design-system-mcp-example).
- [Cristian Morales, *Building an AI-Ready Design System*](https://www.giorris.dev/thoughts/building-an-ai-ready-design-system).

**Toolkit (public repository, read 2 November 2026)**

- [`tools/snapshot/guidance.cjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/guidance.cjs): the description parser.
- [`tools/docs-site/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/README.md): where the docs site's content comes from.
- [`tools/docs-site/src/lib/readiness.js`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/src/lib/readiness.js): the deprecation-with-replacement count.
- [`knowledge/ui/profiles/documentation.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/profiles/documentation.md): the component-page rules.

**Project records (private, not linkable)**

- Project A's snapshot, audit record and parity report, as computed on 10 October 2026.

---

Part 2 of 9 in *The agent-ready design system*. Previous: [Part 1, What makes a design system agent-ready?](what-makes-a-design-system-agent-ready.md) Next: [Part 3, One record, many outputs](design-system-docs-as-one-record.md).
