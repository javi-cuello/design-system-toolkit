# Measuring and showing agent readiness

Files say whether the inputs an agent needs are present; only running agents says whether those inputs change what agents produce. Readiness is shown as a few ratios with their gaps named, never as one score.

Part 9 of 9 in *The agent-ready design system*. Previous: [Part 8, Prototyping with a design system's real components](prototyping-from-real-components.md)

A design-system team that has worked through the earlier parts will be asked whether the system is now "ready", and will be tempted to answer with a number. This piece sets out what can be measured from the files, what needs a run of real agents, what has been measured so far (very little, at screen level), and how to show the result without building a vanity score.

---

## What this answers

- Can readiness be measured from files, or only by running agents?
- Which static measures earn a place?
- How should readiness be shown so it does not become a vanity score?
- How much of an agent's screen-building has anyone measured?

The outcome being measured (real components, real props, tokens, imports, at an acceptable cost) is defined in [Part 1, section 4](what-makes-a-design-system-agent-ready.md#4-what-is-ready-stated-as-an-outcome). Section 5 is the cheat sheet and section 6 the short version.

---

## 1. Can readiness be measured from files, or only by running agents?

A static audit measures whether the inputs an agent needs are present and well formed; only running agents measures whether those inputs change what agents produce. Static measures are cheap leading indicators and should be labelled as such. Nobody has yet shown how well the first predicts the second.

The open-design-system-bench keeps the two apart, and its design is worth copying. Its static **Surface** score weighs seven checks: enablement surface 20, catalogue quality 20, export hygiene 15, vocabulary 15, tokens 10, deprecation 10, docs greppability 10. A check that cannot measure returns nothing and its weight is redistributed, rather than counted as zero.

Its behavioural run adds **Lift** (guided against unguided), **Ceiling** (how good guided output gets), **Engagement** (share of runs that used the system at all) and a behavioural vocabulary score. The composite is labelled `surface-only`, `partial-behavioral` or `full-behavioral`, so a reader can see what it rests on.

The author's own caveats carry the argument: static checks are weaker evidence than behaviour, the bands (70 "AI-native", 40 "Invested", below 40 "Emerging") are an uncalibrated default, and no correlation between Surface and behaviour has been measured. Release 1.4 (29 October 2026) hardened the instrument instead: rubrics that a system cannot satisfy are withheld, judge claims are checked against the diff, and a judge can take three samples.

**A behavioural run, concretely.** A fixed set of product tasks that never name a component (a password visibility toggle, an account-deletion confirmation, a paginated activity log), run with and without the system's context. Each output is scored mechanically for imports, invented components and props, raw values, accessibility and compilation, plus a model judge blind to the configuration.

The bench weighs imports 10, API fidelity 25, token discipline 15, static accessibility 10, compilation 10 and the judge 30. An import of a component outside the extracted catalogue costs 40 points and fails the run, an invented prop costs 15, a raw colour 10. It extracts ground truth from the system's code rather than writing it by hand, and isolates unguided runs from the operator's own context files, which had been inflating baselines.

Cost decides the size: about $1.50 per cell, so ten tasks, two context levels, one model and three repetitions is 60 cells, about $90. Single repetitions are only directional. How such a run stays honest (baselines made under the same settings, pinned commits, voided runs) is [Part 5, sections 7 and 8](what-keeps-an-agent-on-track.md#7-what-is-an-eval-and-why-is-it-not-just-a-bigger-test).

**What to do.** Compute the static measures that pass section 2's test, label them static, and reserve "ready" for a behavioural run. **Never average the two until someone shows they move together.** The split is the bench author's design and his own caveat; nobody has published the correlation.

---

## 2. Which static measures earn a place?

A measure passes when it counts something an agent retrieves and acts on, and when moving it requires fixing the system rather than adding a file. Interface completeness, design-to-code mapping coverage, vocabulary distance, token binding with a semantic share, token descriptions, deprecation flags on actual retired items, and freshness all pass.

Surface presence (an `llms.txt`, an `AGENTS.md`, a server) mostly fails. It is worth one binary check, because the gap between no reference and some is the largest effect in Atlassian's test ([Part 4, section 3](how-the-system-reaches-the-agent.md#3-should-the-reference-be-served-on-demand-or-all-at-once)). Beyond that it rewards adding files: the bench gives 15 points for an `llms.txt` whether it is a curated index or a 2MB dump, and 20 for an `AGENTS.md` that restates the directory tree.

zeroheight's survey of 123 practitioners shows the gap a checklist cannot see: 48 percent run an MCP server, 17 percent rate their docs very AI-ready.

Two traps are arithmetic.

- **Zero is not missing.** An input never collected shows as not measured, never as zero.
- **A suspicious result is a finding about the instrument.** The bench flags a catalogue as extraction-suspect when 30 percent or more of exports show no props, after a field test found 63 percent of one popular library's exports empty: a docgen failure rather than a property of the library.

**What to do.** Keep the measures that can only move when the system improves, and one yes-or-no for whether any reference surface exists. **A measure that rises when a file is added, and not when the system improves, measures effort, not readiness.** The test is this series' judgment, built on the bench's own warnings.

---

## 3. How should readiness be shown so it does not become a vanity score?

As a few separate measures, each a ratio with its numerator and denominator visible and linked to the items that fail it, with unmeasured inputs shown in words, and with no composite or tier until a behavioural run has calibrated one. A score is a diagnostic; a lint rule is a gate.

A single readiness number invites presence gaming and hides which input is weak: two libraries at 62 can fail in opposite ways. "121 of 122 components described" can only be moved by describing a component, and names the one that is missing.

Health scores generally have the same shape. Southleft's `figma-console-mcp` scores a Figma library out of 100 across naming, tokens, components, accessibility, consistency and coverage, each finding linked to the variable or component that caused it. It is a good audit that says nothing direct about agent output.

Atlassian gates production with deterministic lint rules rather than an AI-scored audit. Southleft's own commentary draws the governance line: automate the parsing, scoring and flagging, but a design system is "the encoded record of decisions an organization is accountable for", and what gets deprecated stays a person's call.

**Coverage is the most defensible single figure**, because it is measurable and ties to a cost someone outside the team feels. Shopify's Laura Griffee reported Polaris components in 70 percent of the admin but Polaris tokens in only 44 percent of admin components, a gap she said made large design changes very costly to ship.

A tracked issue set a 90 percent target across colour, motion, type and spacing. Typography token coverage in custom components was about 8 percent before six components (`DisplayText`, `Heading`, `Subheading`, `Caption`, `TextStyle`, `VisuallyHidden`) collapsed into one `Text`. Keep the exception log primary and any score a rollup of it, as stylelint's allow-list makes each accepted deviation an explicit entry rather than an inline ignore.

**What the toolkit built.** The design-system toolkit's docs site carries, in its overview's "Understandable" group, an *AI readiness* page. The page describes itself as what a person or an agent reading the Figma library can learn about intent, and says that whether an agent's code comes out right needs the code, or a run with real agents.

It shows, as ratios with their gaps listed:

- components whose description lacks Usage, Don't or Code gen notes (from the audit's open rows, so one source);
- automatic layer names, and frames without auto layout;
- how old the snapshot is, and whether the file has been edited since;
- published tokens described (variables hidden from publishing or marked private are not owed a description);
- deprecations that name a replacement.

There is no composite, no tier, and "Checked at the next full audit" where a check has not run ([`ai-readiness.astro`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/src/pages/overview/ai-readiness.astro)). It covers the design-only half; the code-dependent ratios (mapped to code, same words) were not built as of November 2026.

A behavioural run exists: the toolkit's `tools/skill-evals` has screen tasks, graded by `validate`, that compare an agent with and without the system's MCP server ([Part 5, sections 7 and 8](what-keeps-an-agent-on-track.md#8-what-keeps-an-eval-honest-baselines-pinned-commits-and-contamination)).

**What to do.** Show readiness as a small set of ratios with their gaps one click away, label static measures as static, keep any behavioural result in its own row with its run date and repetition count, and leave tiers out until there is evidence to calibrate them. **A ratio names what to fix; a single score only says something is wrong.**

---

## 4. How much of an agent's screen-building has anyone measured?

Very little. No benchmark grades whether generated screens use a given design system or follow a product's layout conventions. The few numbers that exist are self-reported, about components, or from small samples.

The public benchmarks grade something else.

- **Design2Code** (2024) compares 484 generated pages to their originals and found layout and missing elements were the main errors.
- **Sketch2Code** (2024) found the best single-turn result was 36 percent of sketches matched well.
- **DesignBench** (2025) found models almost never split a page into components: 0.24 percent of the time in React.
- **WebGen-Bench** (2025) grades whether features work and tops out at 38 percent.

None asks whether a page used the right library or the product's shell.

The industry numbers are self-reported and mostly component-level. Atlassian's one-pass prototyping figure is in [Part 7, section 2](building-screens-with-an-agent.md#2-rules-templates-or-example-screens-which-carries-screen-conventions); Storybook's Reshaped figures, with no published method, are in [Part 4, section 3](how-the-system-reaches-the-agent.md#3-should-the-reference-be-served-on-demand-or-all-at-once). Figma's Code Connect comparison covered 27 component cases ([Part 7, section 4](building-screens-with-an-agent.md#4-how-does-a-figma-screen-become-code-with-real-imports)).

On whether prototypes like these help product decisions, there is almost nothing: a 2026 study of 92 people rated AI prototypes usable but conventional, which is a judgment of the prototypes, not of what teams decided with them.

**What to do.** Measure on the team's own system, because nobody else will. Keep a fixed set of screen tasks that never name a component, run them with and without the system's context, and score each run with checks that read the output: imports, raw values, detached instances, missing states. Re-run after each change. **The absence of evidence is a finding; the method is this series' judgment.**

---

## 5. Cheat sheet

| Question | Measure it by | Not by |
|---|---|---|
| Is the reference current? | Snapshot age against the file's last edit | The docs build date alone |
| Are the inputs there? | Static ratios, labelled static | A count of files added |
| Is the system ready? | A behavioural run, tasks that never name a component | Any static score |
| Do screens come out on the system? | The team's own screen tasks, with and without context, scored by checks | Vendor percentages |
| How should it be shown? | Ratios with their gaps linked; "not measured" in words | One number and a tier |

---

## 6. The short version

A static audit says whether the inputs an agent needs are present; only a run of real agents says whether they change what the agent writes. Compute the static measures that can only move when the system improves (interface completeness, mapping coverage, vocabulary distance, token binding, descriptions, deprecations, freshness), label them static, and keep the word "ready" for a behavioural run on tasks that never name a component.

Show the result as ratios with their numerators, denominators and failing items one click away, with "not measured" in words and no composite or tier until a behavioural run has calibrated one. Coverage is the one single figure that ties to a cost people outside the team feel.

At screen level almost nothing is measured: the public benchmarks grade pixels and features, and the industry figures are self-reported. A team building this should measure it on its own system, with a fixed task set, before and after each change.

---

## 7. What to re-check later

Researched November 2026, when this part was assembled from guides first researched between August and October 2026 and re-checked against primary sources that month.

- **Where this came from.** This part was assembled on 9 November 2026 from sections 7 and 8 of *Making a design system usable by AI agents* (archived at `_archive/2026-11-09/machine-readable-design-systems.md`) and section 7 of [Building whole screens with an agent](building-screens-with-an-agent.md). The toolkit was read from its repository on 2 November 2026.
- **The bench's tiers.** Uncalibrated as of release 1.4 (29 October 2026). Re-check before vendoring them.
- **The toolkit's readiness page** covers the design-only half; the code-side ratios are not built. A behavioural run through `validate` is built as `tools/skill-evals` screen tasks; the page does not show its results.
- **A screen-level benchmark.** None grading design system use at screen level existed in November 2026. One appearing would replace most of section 4.
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
