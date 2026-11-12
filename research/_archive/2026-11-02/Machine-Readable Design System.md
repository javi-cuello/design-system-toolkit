# Making a design system readable by AI agents

What to give an agent, where it should live, and the measured evidence for what actually moves the needle.

Researched August 2026, checked against primary sources where resolvable. A second controlled study on `AGENTS.md` efficiency landed since the prior pass, and a design system built agent-first from the ground up shipped in beta. Corrections against the prior draft are recorded in section 10.

---

## What this answers

Agents now read design systems. They pick components, generate markup, apply tokens, and get it wrong in ways that are expensive to notice. The questions this raises:

- What does an agent actually need, and where should it live?
- What belongs in per-component metadata, and what is padding?
- Should you put a health score on your library?
- Do `AGENTS.md` and `CLAUDE.md` files actually help? (Two studies now exist, and they measure different things.)
- Is it better to load everything or serve it on demand?
- How does any of it stay current?
- How do you document multi-brand theming so an agent does not have to guess?

Section 8 is a cheat sheet and section 9 is the short version.

---

## 1. What does an agent need, and where does it go?

**The short answer.** Three different kinds of knowledge, kept in three different places, because they fail differently.

The first is **rules**: short imperative constraints that tell an agent what never to do. A human writes these and they are always in context, so every line costs on every turn. The second is **reference**: the bulk of the system, meaning component APIs, token values and usage guidance. A pipeline generates this, and the agent fetches only the part it asks for. The third is a **snapshot**: one self-contained file describing the visual identity, generated and then hand-tuned, which travels anywhere but loads in full every time.

Keeping them apart matters because they fail in different ways. Rules rot when nobody prunes them. Reference goes stale when the pipeline stops running. A snapshot is out of date the moment it is written.

| Layer | What it holds | Where it lives | Loaded when | Written by |
|---|---|---|---|---|
| Rules | Thin, imperative instructions. What never to do | `AGENTS.md`, `CLAUDE.md`, `SKILL.md` | Always, or on trigger | A human, deliberately |
| Reference | The bulk: component APIs, token values, usage guidance | An MCP server, a CLI, skills, schema files | On demand, per query | A pipeline |
| Snapshot | One self-contained description of the visual identity | `DESIGN.md` | All at once, every time | Generated, then tuned |

**The tension everything else traces back to** is that the more complete the context, the more it costs and the less reliably it gets used. That is not a hunch. It is the finding of the two controlled studies covered in section 4, and of the only published head-to-head comparison by a design system team, in section 5.

A system now ships this split physically rather than as advice. Meta open-sourced Astryx in June 2026, a React and StyleX component library that grew inside the company over eight years and powers roughly 13,000 internal apps. Its own README states the architecture directly: "The API, docs, and CLI are designed together so a person and an AI assistant build the same way, from the same reference." The CLI (`@astryxdesign/cli`) and an MCP server carry the reference layer on demand; a short set of hand-written conventions carries the rules; nothing in the system tries to be a single all-purpose file. Astryx's own framing of the payoff: "every change that made Astryx easier for AI made it easier for people too."

**What to do.** Keep the three layers separate and resist the urge to merge them. The most common failure is a single enormous file that tries to be all three, which loads everything on every turn, costs on every turn, and buries the handful of instructions that actually change behaviour.

---

## 2. What belongs in per-component metadata?

**The short answer.** Generate the mechanical fields from the design source. Have a human write exactly three intent fields. Resist adding more, because hand-written fields are the ones that rot invisibly.

Several teams have published per-component schemas for agent consumption, and the overlap between them is the useful signal:

| Field group | Status |
|---|---|
| Identity: name, description, category | Consensus, and mechanically generatable |
| Props, variants, states | Consensus, and mechanically generatable |
| Usage: when to use, common patterns | Consensus, hand-written |
| Accessibility: role, keyboard, WCAG notes | Consensus |
| Anti-patterns: what not to do, and why | Emerging |
| AI hints: priority, keywords, selection criteria | Emerging |
| Composition and relationships | Emerging |
| Business context, semantic role | One team only |

**Understand the mechanism before judging the fields.** An agent selecting a component is doing retrieval, not reasoning. It matches the request against whatever text describes each component and picks the closest. That single fact explains the whole schema. Fields like keywords and selection criteria exist because they *are* the text the match happens against. Fields like anti-patterns exist because retrieval alone cannot tell an agent that the closest match is the wrong answer. The split between generated and hand-written fields follows directly: identity, props and variants can be read out of a Figma component set or a code definition, while intent cannot be derived from either and has to be authored.

Design engineer Cristian Morales built two tools on this idea rather than only describing it: a metadata generator that documents usage patterns, anti-patterns and "when to use this instead of that" per component, and a separate reasoning layer for component selection that walks an agent through atoms-versus-molecules choices and when to reach for something custom instead. His stated mechanism matches the retrieval framing above: an agent building a form checks a component's use-case field to find candidates, checks its selection-criteria field to pick between variants, and checks its anti-patterns field to avoid the common mistakes a human contributor already knows about.

**The one team that measured this rather than reasoning about it** is Indeed, where design systems designer Diana Wolosin built a metadata pipeline turning MDX component documentation into structured JSON, then benchmarked it: 77 components parsed, eight MCP configurations, 1,056 prompts. The reported result was that Markdown ran around 30,000 tokens per query at 82 percent coverage with hallucinations present, while the structured JSON form used roughly 80 percent fewer tokens at about a fifth of the annual cost.

Treat the exact figures loosely, and treat them as loosely as the record itself does. Her original write-up of this benchmark sits behind a sign-in wall, several secondary summaries quote slightly different numbers, and her own case-study page reports an entirely different set of metrics for what appears to be a later, separate pilot (over 4,000 prototypes generated, most participating product managers reporting faster workflows, a minority of prototypes meeting baseline usability). None of those later figures confirm or contradict the original token and coverage numbers; they simply measure something else. The figure worth carrying is the direction, not the decimal: structured data beat prose documentation by a wide margin for machine consumption in a controlled comparison. The nuance she states alongside it is the part people drop, and it matters here: JSON for the component metadata an agent retrieves, Markdown for the natural-language rules a human writes.

**What the shipping sources actually give you.** Polaris ships metadata alongside token values, so a token carries a human-readable description as well as a value. Primer splits its agent-facing material in two files: `DESIGN_TOKENS_GUIDE.md` holds the logic and rules, `DESIGN_TOKENS_SPEC.md` holds raw token values, and the guide instructs agents plainly: "Never use raw values (hex, px, etc.). Only use semantic tokens." It also carries what amounts to a hallucination guard, telling agents to suffix any token name they are not certain exists with `/* check-token */` rather than asserting it. Astryx's own coverage describes a JSON manifest, generated by its CLI, that is meant to keep an agent from inventing a prop that does not exist; that specific mechanism is reported consistently across coverage of the launch but was not confirmed in Astryx's own README, so treat it as commentary until the primary docs state it directly.

**The counter-example is the interesting part.** Atlassian found that a *fuller* portable specification made agents re-create components instead of importing them, because a complete description of how a component looks is also a recipe for rebuilding it. Field richness helps green-field generation and actively hurts brownfield maintenance. That is a genuine reversal rather than a caveat: the same file that improves one workflow degrades the other.

**The honest costs of a rich schema.** Intent fields cannot be generated and rot silently, because nothing detects when a component's real usage drifts away from what was written a year ago. Completeness invites re-implementation, per Atlassian, which is worse than a missing field because it produces plausible code that bypasses the system entirely. And every field costs tokens on every load unless the transport is on demand, which section 5 argues it must be.

**What to do.** Generate the consensus core mechanically and require a human to fill exactly three intent fields: use cases, anti-patterns, and selection criteria. Cap it at three because of the rot problem: hand-authored fields are the only ones that go stale invisibly, so the right number is the smallest set that lets an agent reject a wrong match. Mark generated fields as generated, so a reviewer knows which lines a human is accountable for.

---

## 3. Should you score your library?

**The short answer.** Track coverage as a percentage, keep the exception log as the real artefact, and never let a score become a gate.

Numeric health scores are well precedented and now shipping as open source, so the shape is inspectable rather than described. Southleft's `figma-console-mcp` runs a deterministic audit producing an overall weighted score out of 100 across six category gauges: naming, tokens, components, accessibility, consistency and coverage, with severity indicators and diagnostic locations linking each finding back to the specific variable, component or collection that caused it. A plain-data tool (`figma_audit_design_system_report`) returns the report with per-finding remediation for any MCP client; a companion Design System Dashboard app renders it as a Lighthouse-style scorecard for clients that support the MCP Apps protocol. Its accessibility scorecard goes further than most, covering state coverage, focus-indicator quality and contrast, non-colour state differentiation, target size and colour-blind simulation.

That six-category shape recurs across tools in this space, and the categories overlap heavily: token usage and hard-coded values, naming, accessibility, and documentation presence.

**The most defensible single metric is coverage**, because it is mechanically measurable and ties to a consequence someone outside the design system team can feel. Shopify published the canonical version. In *Putting the system back in our design system*, designer Laura Griffee reports that Polaris components appeared in 70 percent of the Shopify admin while Polaris tokens appeared in only 44 percent of admin components, and states the consequence plainly: "This lack of token coverage makes it infinitely challenging and costly to ship large design changes at scale." A tracked GitHub issue set a 90 percent coverage target across colour, motion, type and spacing. Elsewhere Shopify measured typography token coverage in custom components at roughly 8 percent, with six overlapping components (`DisplayText`, `Heading`, `Subheading`, `Caption`, `TextStyle`, `VisuallyHidden`) collapsed into a single `Text` component as the fix.

**The important part is the exception mechanism, not the score.** The code equivalent is stylelint's allow-list model, where an accepted deviation becomes an explicit entry in a list rather than an inline ignore comment. Shopify's own stylelint rules are grouped into categories specifically so coverage can be measured, and they include rules banning hard-coded units and flagging values that are not valid tokens.

**The counter-position is worth stating in full, not just noting.** Atlassian relies on deterministic lint rules that cost zero tokens rather than an AI-scored audit for production gating, on the argument that deterministic checks beat probabilistic scoring when the check is a gate. A separate piece of commentary from Southleft, arguing against what it calls "machine-governed" design systems, makes the same distinction from the governance side: automating the mechanical work (parsing, scoring, flagging) is sound, but a design system remains "the encoded record of decisions an organization is accountable for," and delegating what gets deprecated or what a score means to an AI judgment is a different thing than delegating the arithmetic. **A numeric AI score is a diagnostic, and a lint rule is a gate.** Confusing them produces either a gate that fails randomly or a diagnostic nobody can act on.

**What a score buys you**, honestly: a single number moving over time is the only artefact most stakeholders will look at, coverage percentage maps to a real cost, and publishing category weights forces an explicit statement of priorities.

**What it costs.** A single number invites gaming, and the failure is silent because the score still looks healthy. Scores drift from lint results, at which point teams trust neither. And an AI-judged qualitative layer is not reproducible, so it cannot gate anything and should not be described as if it could.

**What to do.** Keep the exception log as the primary artefact and treat any score as a rollup of it. Compute coverage as semantic-token adoption because it is the one number with both a precedent and a mechanism, publish the weighting so it can be argued with, and classify every finding by what remediation it needs so the log is actionable rather than merely long.

The threshold that should change your mind: if maintainers start optimising the number, or it diverges from lint results, demote it to per-category diagnostics and keep only coverage.

---

## 4. Do context files actually help?

**The short answer.** Two controlled studies now exist, and they answer different questions rather than contradicting each other. One found no general improvement in task success and a real cost increase. The other found a real efficiency gain and did not measure success at all. Neither licenses the confident claim either side of this argument tends to make.

`AGENTS.md` is the de facto standard for repository-level agent instructions. OpenAI released it in August 2025, and it was donated to the Linux Foundation's newly formed Agentic AI Foundation on 9 December 2025, alongside Anthropic's Model Context Protocol and Block's goose. The Foundation's announcement put adoption above 60,000 open source projects at that point and named Amp, Codex, Cursor, Devin, Factory, Gemini CLI, GitHub Copilot, Jules and VS Code among the tools reading it. Plain Markdown, no required schema, nearest file wins in monorepos.

**The first study.** Researchers at ETH Zurich and LogicStar.ai published *Evaluating AGENTS.md* in February 2026, revised June 2026. They evaluated four frontier models across three settings (no context file, an LLM-generated one, a human-written one) on SWE-bench-style tasks and on a novel set of issues from repositories with developer-committed context files. The headline: context files **do not generally improve task success rates while increasing inference cost by more than 20 percent on average**, holding across models, agents, and both generated and human-written files. The more useful distinction inside that result is which *part* of the file is dead weight: **repository overviews, though popular and recommended, proved unhelpful, while instructions in the context files were well followed.** That does not say "write less." It says which part of the file earns its tokens.

**The second study.** Lulla and colleagues, presented at ICSE's JAWs 2026 workshop, took a different approach: 10 repositories, 124 real GitHub pull requests, each task run twice with OpenAI's `gpt-5.2-codex` agent in an isolated Docker sandbox, once with the repository's own naturally-occurring `AGENTS.md` present and once without. Median wall-clock runtime dropped from 98.57 seconds to 70.34 seconds, a 28.64 percent reduction; median output tokens dropped from 2,925 to 2,440, a 16.58 percent reduction. The paper explicitly scopes itself to operational efficiency and states that task correctness is future work, not something this run measured.

**Read together rather than as a contest.** The two studies differ on sample (files a research team wrote or generated for the test, versus files real maintainers already shipped), on model (four frontier models and several agents, versus one), and, most importantly, on what they measured (success rate against inference cost, versus wall-clock time and output tokens with no success check at all). A file that makes an agent finish faster without making it more likely to finish *correctly* is consistent with both results at once. Neither paper has been checked against the other's method yet, and nothing here licenses "AGENTS.md is proven to help" or "AGENTS.md is proven not to help." What both studies agree on, from opposite directions, is the shape of the risk: an unbounded or padded file spends tokens on every single invocation, so any efficiency claim for a good file is also a cost claim against a bad one.

**Four traps, in rough order of how often they appear:**

**The generated repository overview** is the most common opening section of an `AGENTS.md`, describing directory structure and architecture. The ETH Zurich study found it specifically unhelpful, and it is usually the longest section.

**The context file as documentation.** If a constraint can be discovered from the code, it does not belong here. The file's entire value is in what the code cannot say about itself.

**The auto-generated context file** is cheapest to produce and is the setting the ETH Zurich study found no success-rate benefit from. Generation is the wrong tool precisely because the useful content is the part that cannot be derived.

**The unbounded file**, where cost scales with length on every single invocation. Over 20 percent more inference cost without a matching gain, on the evidence that measured cost.

For skills specifically, Anthropic's own authoring guidance describes three loading levels: name and description load at startup at roughly 100 tokens per skill, the SKILL.md body loads once the skill triggers and should stay under 500 lines (a rough budget of a few thousand tokens), and bundled reference files load only when referenced, at no cost until they are.

**What to do.** Write context files by hand, keep them to imperative constraints, and delete the repository overview. The causal reason is specific: overviews duplicate what the agent can already read, so they buy nothing and get charged for on every turn, and nothing in either study contradicts that even though they disagree on the headline verdict.

And the corollary: if a constraint can be a lint rule instead, make it a lint rule. A deterministic check costs zero tokens and does not depend on the agent choosing to comply.

---

## 5. Load everything, or serve on demand?

**The short answer.** On demand, for an established codebase. The one published head-to-head is decisive, and the losing format used 92 percent more tokens to reach under half the design-system coverage.

Atlassian tested its own MCP server against Google's portable `DESIGN.md` format on the same task, building a login screen:

| Measure | Atlassian's MCP server | DESIGN.md |
|---|---|---|
| Design system context achieved | about 80% | about 30% |
| Tokens consumed | 3.75M | 7.21M |
| Time to completion | 5m 01s | 6m 46s |
| Average turns | 35.1 | 45.3 |

Atlassian named three causes, and the mechanism in each matters more than the verdict.

**All at once versus on demand.** The file loads completely on every turn. An MCP server can answer a narrow question with a narrow response, so hundreds of icons and an extensive semantic token set never enter the context window unless something asks for them.

**Portability forces compression, and compression removes the useful part.** To stay portable, Atlassian's file was squeezed to 80KB, about 19,800 tokens, against roughly 2.5MB of material the server can serve. In Atlassian's own words: "we had to remove much of the usage guidance from our 50+ components, heavily trim our foundation guidance, and cut a number of design tokens." What got cut is exactly the content section 2 identified as the part an agent cannot derive for itself.

**A complete visual specification is a build recipe.** The format only provides the spec for how to re-implement a component, which made agents more likely to re-create Atlassian's components than reach for the real ones. Atlassian also had to ship a separate dark-mode variant at its own URL, because the standard does not currently support theming.

**The counter-position, stated fairly**, because `DESIGN.md` is not trying to be an MCP server. It is a portable, self-contained, version-controllable description of a visual identity that works with any agent, in any tool, with no server to run and no authentication to configure. Google Labs publishes it as a format specification with token front matter and prose rationale, plus a CLI that lints against the spec, diffs two files and exports tokens to other formats (including, as of its 0.2.0 release, a Tailwind CSS v4 `@theme` block). For a green-field project, a small team, or a hand-off to someone outside the infrastructure, none of Atlassian's three objections applies with much force, and there is no MCP alternative that ships as one file in a repository. The format remains explicitly alpha; its latest release (0.4.0, July 2026) adds validation and export improvements but still no theming, though a pull request for multi-theme, per-token light/dark values was under review as of late June 2026.

**A third position exists between the two**, and it is worth naming because it resolves the trade-off differently rather than just picking a side. Astryx ships neither a single static snapshot nor only a server: its CLI serves machine-readable docs on demand, the same way an MCP server would, but without requiring one to be run and authenticated against. A CLI that answers a narrow query narrowly gets the on-demand property of an MCP server and the no-infrastructure property of a portable file at once. Whether that holds up under the same kind of head-to-head Atlassian ran is not yet published evidence, only an architecture worth watching.

**What to do.** Serve the bulk of the design system on demand and keep the portable snapshot for portability only.

The constraint this depends on is codebase maturity, and it is worth being explicit: **Atlassian's three objections are all brownfield objections.** On an established codebase where importing the real components is the entire point, on-demand wins decisively on the published numbers. On a green-field project or an external hand-off, ship the snapshot, add an explicit instruction preferring existing components over re-implementation, and expect to maintain one variant per theme until the format supports theming.

---

## 6. How does it stay current?

**The short answer.** Regenerate only the mechanically derivable parts, through a reviewed pull request, and keep hand-written conventions out of the automated path entirely.

Every architecture above degrades the same way: the source moves and the context does not. The failure is quiet, because a stale context file still produces confident output.

**The consensus pattern is regeneration from the source of truth.** A change in the design source triggers a webhook, a parser regenerates the machine-readable artefacts, and the result lands as a pull request rather than a direct write. Figma's own developer documentation confirms the trigger primitives: webhooks fire on `FILE_UPDATE` (within 30 minutes of editing inactivity), `FILE_DELETE`, `FILE_VERSION_UPDATE`, `FILE_COMMENT`, `DEV_MODE_STATUS_UPDATE`, and `LIBRARY_PUBLISH`, and the `LIBRARY_PUBLISH` payload specifically carries created, modified and deleted arrays for components, styles and variables, so a listener can tell exactly what changed without re-diffing the whole library. Figma's Variables REST API supports syncing variables to a tokens file and tokens back to variables through paired GitHub Actions workflows; the write-back direction (tokens to Figma) requires an editor seat and a write-scoped token in addition to full Enterprise-org membership, which is a real gate on who can run the automated half of the loop.

Astryx's own CLI carries a related but distinct piece of this: a codemod runner for migrating between versions, which is the maintenance-side counterpart to the capture-side webhook, migrating consumers forward rather than only reading the source.

**The staleness failure mode is worth naming precisely**, because teams expect it in the wrong place. Parity does not usually break at the component. It breaks at naming, token ownership and release timing. And agents given an incomplete specification compensate silently by reading through component implementations to recover the missing usage guidance, which costs tokens and produces conclusions nobody reviewed.

**The honest limit.** Token-level parity is close to solved. Component-level parity is not, and there is no reliable automated structural-parity solution as of August 2026. Nothing found in this pass changes that, which is itself worth stating: no vendor claims to have closed the gap. Do not architect a maintenance loop that promises automatic component API sync, because it will not deliver it and the gap gets discovered by whoever trusted it.

**What to do.** Make the canonical artefacts live in version control, regenerate only the derivable sections, and route every regeneration through a human-reviewed pull request.

The split matters: keep durable conventions and any record of maintainer decisions out of the automated path, because those are exactly the fields section 2 identified as impossible to generate, and a pipeline that overwrites them destroys the only content a human authored. Add a staleness check that flags when the source has changed since the last capture, since a loop with no detector is a loop that silently stops running.

---

## 7. How do you document multi-brand theming?

**The short answer.** Write down which layer switches. It is the one fact no tool can infer from your files.

The architecture itself is settled, and most disagreement is about mechanism rather than structure. Components consume **semantic** tokens only. A rebrand edits **primitive** tokens. A brand switch remaps the **semantic aliases**, or swaps a mode. The reason this layering matters is that it decides how many files a rebrand touches: with components bound to semantics, changing a brand edits the alias layer and no component file at all.

Where the switch physically happens has three shipping answers:

| Mechanism | How it works | Constraint |
|---|---|---|
| Figma Extended Collections | A core collection is published and extended per brand, inheriting base definitions with overrides | Enterprise plan only, rolled out from November 2025 |
| Multi-collection modes | Brands as modes within collections | Mode ceilings, and cross-collection modes cannot be told they are related |
| Theme packages | Each brand is a separate published package | Brand assets fenced at the package boundary |

Figma announced Extended Collections at Schema 2025 as a way to manage and scale multi-brand systems, with the extension staying tied to the parent so it inherits new variables and colour updates. As of this pass, Figma's own help documentation still states the feature is "available on the Enterprise plan," which is why the non-mode architectures remain live options rather than legacy ones; nothing found this session suggests that has changed or is scheduled to.

The DTCG format handles theming without file duplication through group inheritance, and reached its first stable version (2025.10) on 28 October 2025, with no newer stable release found this pass.

**What to do.** Record the switching layer as an explicit written statement.

The mechanism is specific and worth understanding, because it explains why this cannot be automated. A generator reading a Figma library can enumerate collections, modes and values. It cannot tell whether a mode represents a brand, a theme or a platform, and it cannot tell which layer a rebrand is supposed to edit. So write down which layer switches, publish the brand-by-theme grid as a table, keep brand-specific exceptions as an append-only list, and note which Figma mechanism is actually in use and why, so the next maintainer understands the file's shape rather than guessing at it.

---

## 8. Cheat sheet

| If you want an agent to | Put it here | Not here |
|---|---|---|
| Never use raw hex or px | `AGENTS.md`, as one imperative line | The token reference file |
| Know a component's props | Generated schema, served on demand | A hand-written context file |
| Know when *not* to use a component | An anti-patterns field in the schema | Nowhere, which is the current default |
| Understand the repository layout | Nowhere. Delete it | The top of `AGENTS.md` |
| Choose between two similar components | A selection-criteria field | Prose on the docs site |
| Know your brand switching layer | A written statement in the context document | Inferred from the Figma file |
| Work offline or outside your infrastructure | A portable snapshot, or a CLI that serves on demand without a server | An MCP server with no fallback |
| Be blocked from a mistake entirely | A lint rule | Any context file |

---

## 9. The short version

Three layers, kept apart: thin hand-written rules, generated reference served on demand, and a portable snapshot only where portability is genuinely needed. Meta's Astryx is the clearest evidence this is buildable rather than aspirational: a CLI and MCP server carry the reference layer, a short hand-written set of conventions carries the rules, and nothing tries to be both.

Generate the mechanical metadata and hand-write exactly three intent fields, because hand-written fields are the ones that rot invisibly.

Delete the repository overview from context files. Two controlled studies now exist rather than one. Neither found that overviews help; one found no general improvement in task success at a real cost increase, the other found real efficiency gains on naturally-occurring files without checking whether the task got done any better. Treat the honest state as unsettled on success, more settled on which parts of a file are dead weight.

Move anything that can be deterministic into a lint rule. Zero tokens, no compliance question, and it gates rather than advises.

Serve on demand rather than loading everything. Atlassian's published comparison had the all-at-once format using 92 percent more tokens to reach under half the context coverage, and pushing agents to re-create components rather than import them.

Keep the exception log primary and any score a rollup of it. Track semantic token coverage as the one number, and treat a low number as evidence the system is wrong rather than the users. Keep the judgment calls (what gets deprecated, what a low score means) with a person; automate the arithmetic, not the accountability.

Regenerate only what is derivable, through a reviewed pull request, and keep hand-authored conventions out of the automated path. Figma's `LIBRARY_PUBLISH` webhook already tells a listener exactly what changed.

Write down which layer your brands switch at, because nothing else in the pipeline records it.

And do not promise automated component-API parity. Tokens, yes. Components, not as of this pass.

**If Figma-first**, the shape falls out of the above: the library is the source of truth, so the generated-reference layer should be produced from it rather than maintained beside it, and capture tooling should emit the mechanical fields with the intent fields left explicitly blank for a human. The rules file stays short and hand-written. The snapshot, if one exists, is regenerable and never hand-edited, following Primer's guide-versus-spec split. And the one thing to write down that no tool will produce is the layer at which brands switch, plus the reasoning behind the Figma mechanism chosen.

---

## 10. What to re-check later

Everything here is dated, and this space moves monthly.

- **The AGENTS.md efficiency picture is now two studies, not one**, and this is the main correction from the prior pass, which treated the ETH Zurich paper as the only controlled evidence. Read both abstracts before citing either: Gloaguen et al. (arXiv:2602.11988, revised June 2026) on task success and cost, Lulla et al. (arXiv:2601.20404, ICSE JAWs 2026) on runtime and token efficiency without a correctness check. Watch for a follow-up that tests both outcomes on the same sample.
- **`AGENTS.md` project adoption** stood above 60,000 projects at the December 2025 announcement; treat that as a floor. Separately, the Agentic AI Foundation itself (organisation membership, not project adoption) reported 180 member organisations by May 2026 after adding 43 in one quarter. The two numbers measure different things and should not be combined.
- **`DESIGN.md` is at 0.4.0** as of July 2026, still explicitly alpha, still with no theming support, though a pull request adding per-token light/dark mode values was under review as of late June 2026. Expect that gap to close eventually, at which point section 5's dark-mode workaround expires.
- **Astryx shipped in beta in June 2026** and is new enough that almost nothing about it is independently measured yet: no published benchmark of its MCP server against another architecture, no confirmation from its own README of the `--dense` flag or the hallucination-preventing manifest claimed in launch coverage. Worth a dedicated re-check once it has been in the wild for two or three more months.
- **Figma Extended Collections** remain Enterprise-only as confirmed against Figma's help documentation this pass. Availability below Enterprise is the thing to re-check, because it is what keeps the alternative architectures alive.
- **DTCG 2025.10** is stable with reference implementations shipping, and no newer stable release was found this pass. Verify the specific tool in use rather than assuming ecosystem-wide support.
- **Component-level parity remains unsolved by automation**, and no vendor found this pass claims otherwise. If that changes, section 6's honest limit is the first paragraph to revisit.
- **Several claims here rest on single sources or on commentary that could not be independently confirmed**, listed under the unresolved heading below. The per-component schema field lists in section 2 are the weakest part of the evidence base: a small number of teams publishing their own work, no independent replication, and no measured outcome for most of the emerging fields.
- **Measured outcomes are still scarce.** Shopify's coverage figures and Atlassian's head-to-head are the clearest real measurements available. The Lulla et al. efficiency numbers are a third, narrower one. Everything else is architecture reasoning, which is legitimate and is not the same as evidence.

---

## Sources

**Primary: specifications, repositories, studies and vendor documentation**

- [Gloaguen, Mündler, Müller, Raychev and Vechev, *Evaluating AGENTS.md*, arXiv:2602.11988](https://arxiv.org/abs/2602.11988). The controlled study in section 4: no general task-success improvement, the 20 percent cost figure, and the overviews-versus-instructions distinction.
- [Lulla et al., *On the Impact of AGENTS.md Files on the Efficiency of AI Coding Agents*, arXiv:2601.20404](https://arxiv.org/abs/2601.20404). The second study in section 4: 10 repositories, 124 pull requests, the 28.64 percent runtime and 16.58 percent output-token reductions, and the explicit scope limit to efficiency rather than correctness.
- [Linux Foundation, *Formation of the Agentic AI Foundation*](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation). The 9 December 2025 announcement, the `AGENTS.md` donation, the 60,000-project figure and the adopting tool list.
- [Agentic AI Foundation, membership growth announcement](https://www.hpcwire.com/aiwire/2026/05/18/agentic-ai-foundation-adds-43-new-members-as-adoption-of-open-agent-standards-accelerates/). The May 2026 figure of 180 member organisations, cited in section 10 as distinct from project-adoption counts.
- [Atlassian, *What we learned testing portable design context in practice*](https://www.atlassian.com/blog/how-we-build/atlassians-design-md-is-here-what-we-learned-testing-portable-design-context-in-practice). The head-to-head table in section 5, the three named causes, the 80KB compression figure and quote, and the dark-mode workaround.
- [Atlassian, *Building the context engine for the AI era*](https://www.atlassian.com/blog/ai-at-work/atlassian-design-system-building-the-context-engine-for-the-ai-era). The wider architecture behind the MCP server used in the comparison.
- [`@atlaskit/ads-mcp` on npm](https://www.npmjs.com/package/@atlaskit/ads-mcp). The server the comparison ran against.
- [google-labs-code/design.md](https://github.com/google-labs-code/design.md). The format specification repository and its release history, including the 0.4.0 changelog checked this pass.
- [DESIGN.md specification](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md). Front-matter token structure, prescribed sections and the alpha status.
- [Anthropic, *Skill authoring best practices*](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices). The under-500-lines guidance and the concise-SKILL.md rationale.
- [Anthropic, *Agent Skills overview*](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview). The three-level loading table, including the roughly 100-tokens-per-skill metadata figure and the under-5,000-token instruction-body figure.
- [GitHub Primer, `DESIGN_TOKENS_GUIDE.md`](https://github.com/primer/primitives/blob/main/DESIGN_TOKENS_GUIDE.md). The guide-versus-spec split, the no-raw-values instruction, and the `/* check-token */` hallucination guard, quoted directly.
- [Laura Griffee, *Putting the system back in our design system*](https://lauragriffee.medium.com/putting-the-system-back-in-our-design-system-b2c55a392dea). The 70 percent component adoption against 44 percent token adoption, and the stated cost, quoted directly.
- [Shopify, Polaris issue #4528](https://github.com/Shopify/polaris/issues/4528). The 90 percent coverage goal tracked as work, across colour, motion, type and spacing.
- [Shopify Polaris, *Version 10 Typography*, community mirror](https://ss-polaris.vercel.app/whats-new/version-10-typography). The roughly 8 percent typography token coverage figure and the six-component-to-one-component collapse; cited via this mirror because the original `polaris-react.shopify.com` URL now redirects to a generic docs page that no longer carries this content.
- [Figma, webhook event reference](https://developers.figma.com/docs/rest-api/webhooks-events/). The full event list (`PING`, `FILE_UPDATE`, `FILE_DELETE`, `FILE_VERSION_UPDATE`, `LIBRARY_PUBLISH`, `FILE_COMMENT`, `DEV_MODE_STATUS_UPDATE`) and confirmation that the `LIBRARY_PUBLISH` payload carries created/modified/deleted arrays for components, styles and variables.
- [Figma, Variables GitHub Action example](https://github.com/figma/variables-github-action-example). The two-way sync workflows and their access requirements (Enterprise org membership, editor seat and write-scoped token for the write-back direction).
- [Figma, *What's new from Schema 2025*](https://help.figma.com/hc/en-us/articles/35794667554839-What-s-new-from-Schema-2025). Extended Collections and the November 2025 rollout.
- [Figma, *Extend a variable collection*](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection). Current Enterprise-plan-only availability, checked this pass.
- [Design Tokens Community Group, *first stable version*](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/). The 2025.10 release.
- [Southleft, `figma-console-mcp`](https://github.com/southleft/figma-console-mcp). The open-source audit behind section 3: six weighted categories, severity indicators, diagnostic locations, the `figma_audit_design_system_report` tool and the MCP-Apps dashboard.
- [Southleft, `figma-audit-accessibility` skill](https://github.com/southleft/figma-console-mcp-skills/blob/main/skills/figma-audit-accessibility/SKILL.md). The accessibility scorecard's coverage, including colour-blind simulation.
- [facebook/astryx](https://github.com/facebook/astryx). The primary repository behind section 1's example: the eight-year internal history, the roughly 13,000 internal apps, the seven bundled themes, React 19+ and StyleX, and the "designed together" and "easier for AI made it easier for people" quotes from the README.

**Commentary, labelled as such in the text**

- [Diana Wolosin, *AI Metadata: Powering a Design System MCP*](https://www.designsystemscollective.com/ai-metadata-powering-a-design-system-mcp-b5deafcae8f5). Her own account of the Indeed pipeline and benchmark in section 2. Behind a sign-in wall at the time of writing, so the figures here come from her case study and secondary summaries rather than the article body.
- [Diana Wolosin, AI metadata systems case study](https://dianawolosin.com/use-cases/ai-metadata-systems). Confirms component count and gives a separate, non-overlapping set of pilot metrics, discussed in section 2 as evidence the original benchmark figures should be read directionally.
- [Into Design Systems, *How Indeed Made Their Design System Machine-Readable*](https://intodesignsystems.substack.com/p/ai-design-system-mcp-example). A secondary write-up of the same benchmark, partly paywalled; used only to cross-check the configuration and prompt counts.
- [Cristian Morales, *Building an AI-Ready Design System*](https://www.giorris.dev/thoughts/building-an-ai-ready-design-system). The metadata-generator and component-selection-reasoning tools described in section 2.
- [Southleft, *Machine-Readable, Not Machine-Governed*](https://southleft.substack.com/p/machine-readable-not-machine-governed). The governance-versus-automation argument in section 3, including the "encoded record of decisions" framing.
- [MarkTechPost, *Meta Open-Sources Astryx*](https://www.marktechpost.com/2026/07/21/meta-open-sources-astryx-an-agent-ready-react-design-system-with-150-accessible-components-seven-themes-and-a-cli/). Secondary coverage of Astryx's launch, used for the `--dense` flag and manifest claims in section 1 and 2 that Astryx's own README does not state directly.

**Cited but not resolved to a URL**

- Southleft's specific auto-fixable / needs-a-decision / manual-work three-way remediation classification: `figma-console-mcp`'s own documentation describes severity indicators and per-finding remediation, not that exact three-class taxonomy, and no other primary source for it was found this pass, so it is not reasserted here.
- Telekom Scale's neutral-theme package split, and a Dow Jones multi-brand variables architecture, both cited in an earlier version of section 7 as non-mode alternatives; not re-opened this pass.
- The design-system parity literature behind the general claim in section 6 that structural component parity has no automated solution; this is stated as an absence (nobody claims to have solved it) rather than sourced to a specific document.
