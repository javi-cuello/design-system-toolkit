# Measuring and showing agent readiness

How a design-system team can tell whether its system is ready for agents, and show the answer without a vanity score.

Someone in a review asks whether the design system is ready for agents. There are two honest ways to find out. One is to open the files and check that what an agent needs is there: described components, typed props, bound tokens. The other is to give agents real tasks and look at what they build.

The first is quick. Only the second shows whether any of it changes the output.

---

## What this answers

- [Files versus runs](#files-versus-runs): whether files can show readiness, or only runs
- [Static measures worth keeping](#static-measures-worth-keeping): which static measures earn a place
- [Showing readiness](#showing-readiness): how readiness should be shown
- [One defensible number](#one-defensible-number): which one number is defensible
- [Screen-building evidence](#screen-building-evidence): how much screen-building has been measured

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs.

---

## Files versus runs

Files show whether the inputs an agent needs are present; only running agents shows whether those inputs change what it builds, and nobody has yet measured how well the first predicts the second.

Take one task an agent might be handed: add a password visibility toggle to a sign-in form. The library's files can show that a text field component exists, that its props are typed and described, and that its colours are bound to tokens. They can't show whether an agent given the task will import that component or write its own input with a raw grey.

That second question is the one that matters. [Part 1](what-makes-a-design-system-agent-ready.md#agent-ready-as-an-outcome) defines "ready" as an outcome: the agent uses real components, real props, tokens and imports, at an acceptable cost. A file check measures the inputs to that outcome, never the outcome itself.

The open-design-system-bench, an open benchmark for exactly this question, keeps the two kinds of evidence apart, and its design is worth copying. Its static half is a **Surface** score built from seven checks, weighted out of 100:

- enablement surface, 20
- catalogue quality, 20
- export hygiene, 15
- vocabulary, 15
- tokens, 10
- deprecation, 10
- docs greppability, 10

When a check can't measure something, it returns nothing, and its weight is shared among the others. It is never counted as zero.

The behavioural half runs agents. **Lift** compares guided runs with unguided ones, **Ceiling** says how good guided output gets, **Engagement** is the share of runs that used the system at all, and a behavioural vocabulary score sits beside them. The combined score carries a label (`surface-only`, `partial-behavioral` or `full-behavioral`), so a reader can see what it rests on.

The bench's author is candid about the gap between the halves. Static checks are weaker evidence than behaviour. The tiers (70 and up "AI-native", 40 "Invested", below 40 "Emerging") are an uncalibrated default. And no correlation between Surface and behaviour has been measured.

> **Aside.** The bench's latest release hardened the instrument rather than calibrating the tiers: rubrics a system cannot satisfy are withheld, the judge's claims are checked against the diff, and a judge can take three samples.

**A behavioural run, worked through.** The bench gives agents product tasks that never name a component: the password toggle, an account-deletion confirmation, a paginated activity log. Each runs with and without the system's context. A script scores each output for imports, invented components and props, raw values, accessibility and whether it compiles, and a model judge that doesn't know which configuration produced it adds its own grade.

The weights are imports 10, API fidelity 25, token discipline 15, static accessibility 10, compilation 10 and the judge 30. Say your agent answers the toggle task without guidance, and writes this (an illustrative output):

```tsx
import { PasswordInput } from '@acme/ui'    // not in the catalogue
<PasswordInput revealable color="#6b7280" />
```

That import alone costs 40 points and fails the run, because `PasswordInput` isn't in the catalogue the bench extracted from your code. Had the component existed, the invented prop `revealable` would cost 15 more and the raw hex colour 10. The guided run that imports your real text field, with props from its typed interface and a colour from its tokens, loses none of them.

Two details keep those numbers honest. The bench extracts the catalogue from the system's own code rather than from a hand-written list. And it isolates unguided runs from the operator's own context files, which had been leaking in and inflating the baselines.

Cost decides how big a run you can afford. At about $1.50 per cell, ten tasks at two context levels, on one model, with three repetitions, is 60 cells: about $90. One repetition per cell is only directional. Keeping a run honest takes baselines made under the same settings, pinned commits and a rule for voiding bad runs; Part 5 covers each, under [what an eval is](what-keeps-an-agent-on-track.md#evals-versus-tests) and [what keeps an eval honest](what-keeps-an-agent-on-track.md#honest-evals).

A static audit is like checking that a recipe's ingredients are on the shelf; a behavioural run is cooking the dish and tasting it. Where the analogy stops: a full shelf at least proves the dish can be made, while nobody has shown how often a full Surface score comes with good output.

Compute the static measures that pass the test in [static measures worth keeping](#static-measures-worth-keeping), and call them static wherever you show them. Keep the word "ready" for a behavioural run on tasks that never name a component. **Never average the two until someone shows they move together.** Keeping them apart is the bench author's own design and caveat, and it is settled practice there; the correlation that would justify a single figure hasn't been published by anyone.

---

## Static measures worth keeping

A static measure earns a place when it counts something an agent retrieves and acts on, and can only move when the system itself improves.

A team wants its Surface score up before the review. The quickest route is two files. The bench gives 15 points for an `llms.txt`, whether it is a curated index or a 2MB dump, and 20 for an `AGENTS.md` that restates the directory tree. Nothing an agent builds has to change for those points to arrive.

So the test is what has to happen in the library for a measure to rise. These pass it:

- interface completeness (typed, described props);
- coverage of the mapping from design components to code components;
- vocabulary distance, how far the library's names sit from the ones agents expect;
- token binding, with the share that is semantic;
- token descriptions;
- deprecation flags on items actually retired;
- freshness of the reference.

Each counts something an agent reads while choosing or filling in a component. The only way to move one is to fix the library: describe the prop, bind the value, map the component.

Surface presence (an `llms.txt`, an `AGENTS.md`, a server) mostly fails the test, but earns one yes-or-no check. In Atlassian's own test, the largest effect was the gap between giving agents no reference and giving them some (Part 4, [served on demand or all at once](how-the-system-reaches-the-agent.md#reference-on-demand)). Past that first step, counting files rewards adding files.

A survey shows what a presence count misses. Of 123 practitioners zeroheight asked, 48 percent run an MCP server, and 17 percent rate their docs very AI-ready. Presence is common and confidence isn't, and a presence count sees only the first.

Two traps sit in the arithmetic.

**Zero is not missing.** An input that was never collected has to show as "not measured", never as 0. A zero says the library has none of something, and it pulls down every figure built on it.

**A suspicious result is a finding about the instrument.** In a field test, 63 percent of one popular library's exports showed no props. The cause was a failure in the tool that generates documentation from code, not a property of the library. The bench now flags a catalogue as extraction-suspect when 30 percent or more of its exports show no props.

Before adding a check to your readiness page, ask what would have to change in your library for it to move. If the answer is "a new file", it becomes the single yes-or-no for whether any reference surface exists. **A measure that rises when a file is added, and not when the system improves, measures effort, not readiness.** That test is a judgement rather than a published standard; it follows from the bench's own warnings about presence checks.

---

## Showing readiness

Show readiness as a few separate ratios rather than one vanity score, each with its numerator and denominator visible and linked to the items that fail it, with unmeasured inputs said in words, and with no composite or tier until a behavioural run has calibrated one.

Back in the review, someone asks for the number. A single readiness score invites the file-adding described under [static measures worth keeping](#static-measures-worth-keeping), and it hides which input is weak. Two libraries at 62 can fail in opposite ways: say one has every component described and few values bound, and the other the reverse. The number is the same; the work each needs isn't.

A ratio doesn't have that problem. "121 of 122 components described" can only be moved by describing a component, and it names the one that is missing. Here is the same library shown both ways (the values are illustrative).

<svg role="img" viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Two ways to show one library's readiness. Left, a single score: 62, tier Invested. Right, three rows: components described, 121 of 122, with the missing one linked; deprecations naming a replacement, checked at the next full audit; behavioural run, its own row with run date and repetitions.</title>
<rect x="0" y="0" width="640" height="250" fill="#f7f6f2"/>
<text x="20" y="32" font-size="14" font-weight="600" fill="#1a1a1a">One number</text>
<rect x="20" y="48" width="200" height="180" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="120" y="135" font-size="56" font-weight="700" fill="#1a1a1a" text-anchor="middle">62</text>
<text x="120" y="170" font-size="15" fill="#5a5850" text-anchor="middle">Agent readiness: Invested</text>
<text x="260" y="32" font-size="14" font-weight="600" fill="#1a1a1a">Ratios, gaps one click away</text>
<rect x="260" y="48" width="360" height="56" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="276" y="72" font-size="14" fill="#1a1a1a">Components described</text>
<text x="604" y="72" font-size="14" font-weight="600" fill="#1a1a1a" text-anchor="end">121 of 122</text>
<text x="276" y="93" font-size="13" fill="#1f5fbf" text-decoration="underline">1 missing: see which</text>
<rect x="260" y="110" width="360" height="56" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="276" y="134" font-size="14" fill="#1a1a1a">Deprecations naming a replacement</text>
<text x="276" y="155" font-size="13" font-style="italic" fill="#5a5850">Checked at the next full audit</text>
<rect x="260" y="172" width="360" height="56" rx="8" fill="#ffffff" stroke="#c9c6bd" stroke-dasharray="4 3"/>
<text x="276" y="196" font-size="14" fill="#1a1a1a">Behavioural run (its own row)</text>
<text x="276" y="217" font-size="13" fill="#5a5850">Run date, repetitions, tasks</text>
</svg>

The 62 on the left can be raised by adding files. Each row on the right moves only when someone fixes the item it names, and the row with nothing measured says so in words.

Library health scores in general share the left side's shape. Southleft's `figma-console-mcp` scores a Figma library out of 100 across naming, tokens, components, accessibility, consistency and coverage, and links each finding to the variable or component that caused it. It is a good audit. It says nothing direct about what an agent builds.

A score and a gate also do different jobs. A score is a diagnostic: it tells a team where to look. A lint rule is a gate: it stops a change from shipping. Atlassian gates production with deterministic lint rules, not an AI-scored audit.

Southleft's own commentary draws the line for people. Automate the parsing, the scoring and the flagging, but a design system is "the encoded record of decisions an organization is accountable for". What gets deprecated stays a person's call.

**The toolkit's page, as a worked case.** The design-system toolkit's docs site has an *AI readiness* page in its overview's "Understandable" group. The page describes itself as what a person or an agent reading the Figma library can learn about intent. It says outright that whether an agent's code comes out right needs the code, or a run with real agents.

It shows these as ratios, each with its gaps listed:

- components whose description lacks Usage, Don't or Code gen notes, taken from the audit's open rows so there is one source;
- automatic layer names, and frames without auto layout;
- how old the snapshot is, and whether the file has been edited since;
- published tokens described (variables hidden from publishing or marked private aren't owed a description);
- deprecations that name a replacement.

There is no composite and no tier, and a check that hasn't run says "Checked at the next full audit" ([`ai-readiness.astro`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/src/pages/overview/ai-readiness.astro)). It covers the design-only half. The ratios that need the code (components mapped to code, the same words in both) aren't built.

The behavioural half exists separately. The toolkit's `tools/skill-evals` has screen tasks, graded by `validate`, that compare an agent with and without the system's MCP server (Part 5, [what keeps an eval honest](what-keeps-an-agent-on-track.md#honest-evals)). The readiness page doesn't show those results yet.

Show readiness as a small set of ratios, with the failing items one click from each. Label static measures as static. Give any behavioural result its own row, with its run date and repetition count, and leave tiers out until there is evidence to calibrate them. **A ratio names what to fix; a single score only says something is wrong.**

---

## One defensible number

When a review insists on a single figure, the defensible one is coverage: the share of a product built with the system's components and tokens, because it can be measured and it ties to a cost someone outside the team feels.

Shopify's admin shows why. Laura Griffee, writing about Polaris, reported its components in 70 percent of the admin, but its tokens in only 44 percent of admin components. She said that gap made large design changes very costly to ship. That's a cost felt outside the design-system team, which no readiness score can claim to measure.

The gap was worst in type. Polaris tracked an issue with a 90 percent coverage target across colour, motion, type and spacing. Typography token coverage in custom components stood at about 8 percent. At the time, type was spread across six components (`DisplayText`, `Heading`, `Subheading`, `Caption`, `TextStyle`, `VisuallyHidden`), which later collapsed into one `Text`.

Coverage stays honest only if its exceptions are visible. An exception log is the list of places that knowingly don't use the system. Stylelint's allow-list is one: each accepted deviation is an explicit entry, rather than an ignore comment buried in the code.

When the review insists on one number, give coverage, and compute it from your exception log so every point it is short of 100 is a named entry. **Keep the exception log primary and the coverage figure a rollup of it.** Coverage as the one defensible figure is a judgement; Polaris's own tracking is the evidence it can be kept.

---

## Screen-building evidence

Very little screen-building has been measured: no benchmark grades whether generated screens use a given design system or follow a product's layout conventions, and the few numbers that exist are self-reported, about components, or from small samples.

The team from the review now wants to know whether an agent builds a whole screen its way: the account-deletion confirmation, say, with the library's own dialog and the product's shell around it. It goes looking for a benchmark that answers that.

The public benchmarks each grade something else. Here is what each would say about that confirmation screen:

- **Design2Code** (2024) compares a generated page with an original. Across 484 pages, layout and missing elements were the main errors. It would say whether the screen looks like a reference, not what it imported.
- **Sketch2Code** (2024) starts from a sketch. The best single-turn result matched 36 percent of sketches well.
- **DesignBench** (2025) comes closest: it checks whether models split a page into components. They almost never do, 0.24 percent of the time in React. Whether those components are the team's isn't asked.
- **WebGen-Bench** (2025) grades whether features work, whether the delete button deletes. The best result tops out at 38 percent.

None asks whether a page used the right library or the product's shell.

The industry numbers don't fill the gap. Atlassian's figure for prototypes built in one pass is self-reported (Part 7, [rules, templates or example screens](building-screens-with-an-agent.md#rules-templates-or-examples)). Storybook's figures for Reshaped come with no published method (Part 4, [served on demand or all at once](how-the-system-reaches-the-agent.md#reference-on-demand)). Figma's Code Connect comparison covered 27 component cases, a component-level result (Part 7, [how a Figma screen becomes code](building-screens-with-an-agent.md#figma-screen-to-code)).

Whether prototypes like these help product decisions is barely studied. A 2026 study of 92 people rated AI prototypes usable but conventional. That's a judgement of the prototypes, not of what teams decided with them.

Measure it on your own system, because nobody else will. Keep a fixed set of screen tasks that never name a component, like the deletion confirmation. Run them with and without the system's context, and score each run with checks that read the output: imports, raw values, detached instances, missing states. Re-run after each change. **The absence of evidence is a finding.** The method is a judgement, the bench's task design carried up to whole screens, not a published standard.

---

## Cheat sheet

| Question | Measure it by | Not by |
|---|---|---|
| Is the reference current? | Snapshot age against the file's last edit | The docs build date alone |
| Are the inputs there? | Static ratios, labelled static | A count of files added |
| Is the system ready? | A behavioural run, tasks that never name a component | Any static score |
| Do screens come out on the system? | Your own screen tasks, with and without context, scored by checks | Vendor percentages |
| How should it be shown? | Ratios with their gaps linked; "not measured" in words | One number and a tier |
| What if one number is demanded? | Coverage, rolled up from your exception log | A readiness score |

---

## The short version

A file audit tells you whether the inputs an agent needs are there; only a run of real agents tells you whether they change what the agent writes. Compute the static measures that can only move when your system improves (interface completeness, mapping coverage, vocabulary distance, token binding, descriptions, deprecations, freshness), call them static, and keep the word "ready" for a behavioural run on tasks that never name a component.

Show the result as ratios, with numerators, denominators and failing items one click away, "not measured" in words, and no composite or tier until a behavioural run has calibrated one. If someone needs a single figure, give them coverage, rolled up from your exception log: it's the one number that ties to a cost people outside the team feel.

At screen level almost nothing is measured. The public benchmarks grade pixels and features, and the industry figures are self-reported. So measure it on your own system, with a fixed task set, before and after each change. Keeping static and behavioural apart is the bench's own practice; the ratio display, coverage as the single figure and the screen-task method are judgements built on it.

---

## What to re-check later

Researched November 2026, when this part was assembled from guides first researched between August and October 2026 and re-checked against primary sources that month.

- **Where this came from.** This part was assembled on 9 November 2026 from sections 7 and 8 of *Making a design system usable by AI agents* (archived at `_archive/2026-11-09/machine-readable-design-systems.md`) and section 7 of [Building whole screens with an agent](building-screens-with-an-agent.md). The toolkit was read from its repository on 2 November 2026.
- **The bench's tiers.** Uncalibrated as of release 1.4 (29 October 2026), the release that withheld unsatisfiable rubrics, checked judge claims against the diff and allowed three judge samples. Re-check before vendoring the tiers.
- **The toolkit's readiness page** covers the design-only half; the code-side ratios were not built as of November 2026. A behavioural run through `validate` is built as `tools/skill-evals` screen tasks; the page does not show its results.
- **A screen-level benchmark.** None grading design system use at screen level existed in November 2026. One appearing would replace most of [screen-building evidence](#screen-building-evidence).
- **Griffee's figures** come from her own post and Polaris's issue tracker; the version 10 typography page is read from a community mirror.
- **The evidence base is Western and vendor-heavy.** Every measured result comes from a US or Australian design-system team, a vendor selling the surface it measured, or an academic benchmark that grades something other than design system use.

---

## Sources

**Primary: benchmarks and studies**

- [christophhdesign, open-design-system-bench](https://github.com/christophhdesign/open-design-system-bench), with [`score.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/score.ts), [`rubric.config.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/rubric.config.ts), [`deprecation.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/deprecation.ts), [`surface.ts`](https://github.com/christophhdesign/open-design-system-bench/blob/main/src/audit/checks/surface.ts) and [`tasks/`](https://github.com/christophhdesign/open-design-system-bench/tree/main/tasks); release 1.4.
- [Si et al., Design2Code (2024)](https://arxiv.org/abs/2403.03163).
- [Sketch2Code (2024)](https://arxiv.org/html/2410.16232v1).
- [DesignBench (2025)](https://arxiv.org/html/2506.06251).
- [WebGen-Bench (2025)](https://arxiv.org/abs/2505.03733v2).
- [UICrit (UIST 2024)](https://arxiv.org/abs/2407.08850).
- [*Usable but Conventional* (2026)](https://arxiv.org/abs/2605.15124).

**Primary: vendor reports and surveys**

- [zeroheight, *State of AI in design systems*](https://zeroheight.com/resources/state-of-ai-in-design-systems/).
- [Southleft, `figma-console-mcp`](https://github.com/southleft/figma-console-mcp). The six-category health score.
- [Laura Griffee, *Putting the system back in our design system*](https://lauragriffee.medium.com/putting-the-system-back-in-our-design-system-b2c55a392dea).
- [Shopify, Polaris issue #4528](https://github.com/Shopify/polaris-react-archive/issues/4528) and [*Version 10 Typography*, community mirror](https://ss-polaris.vercel.app/whats-new/version-10-typography).
- [Storybook, *Storybook MCP for React* (23 Mar 2026)](https://storybook.js.org/blog/storybook-mcp-for-react/).

**Commentary**

- [Southleft, *Machine-Readable, Not Machine-Governed*](https://southleft.substack.com/p/machine-readable-not-machine-governed).
- [Vercel, v0 composite model family (1 Jun 2025)](https://vercel.com/blog/v0-composite-model-family): error-free rates only; not about design system use.

**Toolkit (public repository, read 2 November 2026)**

- [`tools/docs-site/src/pages/overview/ai-readiness.astro`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/src/pages/overview/ai-readiness.astro): the readiness page.
- [`tools/docs-site/src/lib/readiness.js`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/src/lib/readiness.js): the ratios behind it.
- [`skills/figma-components-audit/scanner/measures.json`](https://github.com/javi-cuello/design-system-toolkit/blob/main/skills/figma-components-audit/scanner/measures.json): the audit's measures.
- [`tools/skill-evals/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/skill-evals/README.md): the behavioural screen tasks.

---

Part 9 of 9 in *The agent-ready design system*. Previous: [Part 8, Prototyping with a design system's real components](prototyping-from-real-components.md).
