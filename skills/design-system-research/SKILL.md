---
name: design-system-research
description: |
  Research how real-world design systems handle any topic — naming conventions,
  design tokens, typography, color, spacing, components, theming, accessibility,
  platform organisation (web vs native), Figma library structure, or design-code
  alignment — by mining primary sources (official docs, token repos, GitHub/GitLab
  discussions, migration guides) rather than blog posts. Produces educational
  comparisons with pros/cons grounded in what systems like Polaris, Primer,
  Carbon, Material, Fluent, Atlassian, Apple HIG, Spectrum, Ant Design and
  GOV.UK actually ship.
  Two modes: light (a few targeted searches, a cited conversational answer)
  and deep (Claude's Research feature plus an educational markdown guide).
  Use whenever the user asks how design systems do something, wants approaches
  compared, asks for "deep research" or "best practices" on a design system or
  design token topic, mentions specific systems by name, or wants Figma
  guidance aligned with engineering — even without the word "research."
---

# Design Systems Research

**Version 2.7.0** — history in CHANGELOG.md.

A methodology for investigating any design system topic by studying what consolidated, real-world systems actually ship — and turning that into educational, practitioner-ready guidance.

The core belief behind this skill: the most reliable design system knowledge is not in think-pieces, it's in the shipping systems themselves — their docs, their token repositories, their migration guides, and especially their public arguments (GitHub discussions, issue trackers, RFC threads). A blog post tells you what one person believes; a v10→v11 migration guide tells you what a team with millions of users learned the hard way. Prioritise accordingly.

## Choose a mode first

**Light mode (the default).** A bounded question with a decision at its centre — "should loading be a state or a variant?", "how do systems name spacing tokens?", "boolean prop or enum for icon position?". Run Steps 1–7 in miniature: 4–8 targeted searches across a spread of systems, then answer **in chat, conversationally, with citations** — no file. Aim for the shape of a strong consulting answer: the reframing insight first (the fact that changes how the question should be asked), then the migration story, the counter-examples, the trade-off math, a short blueprint resolving to the user's context, and one honest caveat. Light mode is done in one turn.

**Deep mode.** Trigger when the user explicitly asks for deep/comprehensive research or a guide/report, or when Step 1 scoping reveals 3+ independent axes each needing its own multi-system comparison (the kind of investigation that would take 20+ searches). Two-stage flow:

1. *Kick off.* Give a genuinely useful direct answer first (a compressed light-mode pass — never a bare hand-off), then offer Claude's Research feature via its suggestion mechanism, with the offer as the final sentences of the reply. The button is the user's consent; don't ask for it in prose and don't claim research has started.
2. *Transform.* When the research completes (or if the user declines the feature and asks you to go deep yourself), do **not** deliver raw findings as a report. Write an educational markdown file in the voice defined in `references/deep-mode-voice.md` — read that file before writing, every time, because the voice rules there (structure by decision, protagonist systems, no em dashes, no lecturing) are the deliverable's identity, not decoration. Save the .md and present it to the user.

⚠️ **The most common failure of this skill happens right here.** The Research feature returns a polished-looking report artifact that renders automatically in the conversation. That artifact is *raw material*, never the deliverable — it is structured as findings (TL;DR, Key Findings, Details), not as the educational guide this skill produces. In the same turn the research result arrives: (a) read `references/deep-mode-voice.md`, (b) rewrite entirely in that voice, restructured by decision axis, (c) save and present the guide file. Announcing or summarising the research artifact and stopping there is skipping the Transform stage, and the user will have to ask for the rewrite. If the user provides an example document for tone, read it and match its register alongside the voice rules.

If unsure which mode fits, start light: a light answer that ends by noting what a deeper investigation could add is always acceptable, and the user can escalate.

## Step 1 — Scope the question into comparable axes

Before searching, turn the user's question into the decision they're actually facing and the axes real systems differ on. "How are text styles named?" decomposes into: what vocabulary for the size slot, whether weight appears in names, how many roles, how platforms are split. Most design system topics decompose the same way — find the 2–5 independent choices hiding inside the question, because those become your chapter structure and your comparison tables.

Also identify the user's context if stated (Figma-first? multi-platform? multi-brand? team size?), since recommendations should resolve to *their* situation, not a generic average.

Where the run sits inside a toolkit that keeps a knowledge base (this repo's `knowledge/`, toolkit-standard §D 21), start from it: read the section that owns the topic and the sources it already cites, and aim the search at what it lacks or may have outdated. Re-open a cited source before leaning on it; a claim that no longer holds is corrected in that section, in Step 8. The knowledge pages own the sources, each under the claim it backs; this skill keeps no list of them.

*Why:* research that starts from a blank page re-finds what an earlier run already sourced and misses what changed since; the knowledge base is where the last run left off.

## Step 2 — Apply the source hierarchy

Rank evidence in this order, and keep the ranking visible in the output:

1. **Primary — what systems ship and say about themselves.** Official documentation, token/component source repositories (read the actual token names and values), migration guides, changelogs, design blog posts *by the system's own team*, and public discussions in their trackers (GitHub issues/PRs/discussions, GitLab issues, community forums where staff respond). A PR that renames tokens, with its discussion thread, is top-tier evidence.
2. **Platform/standards documents.** W3C DTCG spec, WCAG, MDN, HTML spec changes, Figma's own best-practice docs and release notes, Apple HIG, Material spec.
3. **Commentary — practitioner essays and community threads.** Nathan Curtis/EightShapes, well-known practitioner blogs, forum debates. Useful for *explaining why* a pattern exists or voicing a tension — but never as sole evidence that a pattern works. When used, label it as commentary in the output ("stated most crisply in commentary…").
4. **Aggregator/SEO content, tutorials, cheatsheets.** Use only as a convenience for values (e.g., a pixel table), and flag them as convenient rather than canonical.

If a claim about a system comes only from a secondary write-up, verify it against the system's own docs before asserting it. If verification fails, either drop the claim or state the uncertainty.

One ranking correction that keeps the hierarchy honest: **evidence of user outcomes outranks evidence of adoption.** That six systems ship a pattern proves the pattern survives organizationally, not that it works for users. Where published user research exists — GOV.UK's design-research blog posts, WebAIM's screen-reader and low-vision surveys, academic accessibility studies, a team's own usability findings — it beats "everyone does it," even when it points against the shipping consensus. Search for it explicitly; absence of user research behind a popular pattern is itself a finding worth stating.

## Step 3 — Choose the system roster

Read `references/system-sources.md` for the roster of consolidated systems, what each is uniquely good evidence for, and where their primary sources live. Select 5–8 systems that span the *spectrum of approaches* on your axes — deliberately include systems that disagree with each other, plus at least one from an unusual context (government/accessibility-first, native-platform, or enterprise) because outliers expose assumptions the mainstream shares silently.

Guard against the roster becoming an echo chamber. The consolidated systems are excellent evidence for *what ships at scale*, but they form a cluster: Western, Anglophone, corporate, web-first, and staffed with dedicated design-system teams. So, where the topic allows, also include at least one system from outside that cluster (e.g., a major non-Western ecosystem like Ant Design or TDesign — CJK typography, different weight/italic conventions, and different density norms break assumptions the Western cluster shares) and at least one small-team, community, or headless system (their constraints resemble most readers' more than Google's do). And remember survivorship: the roster documents patterns that survived at well-resourced organizations; deprecated features, abandoned systems, and rejected RFCs are negative evidence worth hunting for on equal terms.

## Step 4 — Mine for the five kinds of gold

When reading a system's sources, hunt specifically for:

1. **Actual names and values, verbatim.** `--base-text-weight-semibold: 600`, `space.100 = 8px`, `heading-01`. Real identifiers make guidance concrete and let readers verify. Never invent plausible-looking token names.
2. **Documented rationale.** Teams occasionally explain *why* — Polaris explaining increments of 100, GOV.UK explaining pixel-named scale points. Quote sparingly (see quoting rules below); mostly paraphrase with attribution.
3. **Migrations and renames — the highest-value evidence there is.** When a major system renames something (Carbon v10→v11, Material 2→3, Polaris's component collapse), the before/after *plus the stated reason* is a controlled experiment run at scale. Always ask: what did each system rename *away from*, and why? The historical direction across systems (e.g., consolidation) is often the strongest finding.
4. **Measured outcomes.** Numbers beat opinions: Shopify's ~8% token coverage justified an entire redesign. Search for adoption metrics, coverage stats, and audit results in retrospectives.
5. **Counter-examples.** Find at least one shipping system that does the *opposite* of the emerging consensus (and one that deliberately considered-and-rejected an option). A guide with no counter-example hasn't looked hard enough, and counter-examples make the pros/cons honest rather than rhetorical.

## Step 5 — Build the comparison

- **Lay systems on a ladder** for each axis (e.g., role count from 2 to 11) — ladders reveal that many debates are really about *where meaning lives*, not more-vs-less.
- **Write pros AND cons for every approach**, each grounded in a system that demonstrates it. If a con is only theoretical, say so. Symmetry is the test: an approach that collects only cons has been set up to lose, and the reader can feel it. If you genuinely cannot find an advantage in an approach a real system ships, that is a sign you have not understood why they ship it, not a sign it has none.
- **Every claim carries its why, in the same breath.** Not "name layers semantically" but "name layers semantically, because override matching keys on the name and a rename drops overrides on existing instances." A recommendation without a mechanism is an aesthetic preference wearing a lab coat: the reader cannot tell whether it transfers to their situation, cannot argue with it, and cannot notice when the underlying reason stops being true. Prefer the causal why (what breaks, what it costs, who pays) over the authority why (system X does it). Where the real reason is only that a big system chose it and nobody knows why, say exactly that.
- **Make every major claim reproducible, and every trap nameable.** Two concrete forms carry this, and the deep-mode deliverable requires both (see `references/deep-mode-voice.md`). A *worked before/after case*: the situation, the version that looks reasonable, exactly what it costs in real values, the corrected version, written so the reader could reproduce the failure in their own file. And a *run of named traps* wherever a decision has more than one way to go wrong: each with its mechanism and what it breaks. Both exist because abstract costs beside specific benefits is an argument that has picked a side without making one, and because a claim that resists a worked example is usually a claim not yet understood well enough to publish.
- **Tell the story of a system that did it.** Wherever a claim would otherwise be abstract, reach for a named system that renamed, collapsed, measured or reversed something, and tell it in two or three sentences. Shopify collapsing seven Button booleans into two enums, Chakra dropping the `is` prefix in v3, GOV.UK's scale point 36 rendering at 27px on small screens: those are what a reader remembers and can retell in their own design review, and a principle they cannot attach to a story is a principle they will not use.
- **Derive "earns its place" tests** rather than fixed rules: instead of "use 5 roles," extract the principle the survivors share (e.g., a role earns existence through distinct *behaviour*, not size) and turn deleted/failed cases into litmus tests.
- **Note where total complexity is conserved** — often the choice only moves complexity between slots (roles vs sizes, styles vs props), and saying so defuses false debates.
- **Run an independence check before declaring consensus.** Major systems copy each other: staff move between them, docs cite each other, and much of the industry postdates an influential origin (Material, Bootstrap, Lightning's token concept). Before treating convergence as validation, check lineage — when did the pattern first appear, and do later systems cite or visibly derive from the earlier one? Six systems that agree may be one decision plus five echoes; independent convergence (systems with no shared lineage arriving at the same answer under different constraints) is far stronger evidence, and the distinction belongs in the output.
- **Label the constraint fit of every recommendation.** A pattern's success at a system with dedicated staff, thousands of components, and multi-brand theming is evidence *under those constraints*. State what each approach's evidence depends on (team size, component count, tooling budget, platform mix) so a reader with different constraints can tell which conclusions transfer and which don't. "Right for Shopify, overkill for a five-person team" is a legitimate and useful verdict.
- **Resolve to a recommendation twice: per axis, then overall.** Every main section ends with its own explicit recommendation, marked as such, resolving *that* axis for the user's context in one or two sentences. Then the deliverable closes with a consolidated blueprint. One recommendation at the end of a long document is not enough: a reader who needs only the section on naming booleans should not have to read to the last page and reverse-engineer which of fifteen numbered items applied to them, and an axis with no verdict quietly becomes an axis where the author had no opinion. Practitioners want an opinion. Present alternatives fairly, then say what you would do and why, and mark which parts are industry consensus and which are this guide's judgment.

## Step 6 — Ground in tooling and check recency

Design system advice detached from tooling reality is useless to practitioners:

- **Verify current tool mechanics** (Figma styles vs variables, binding limitations, picker behaviour, Dev Mode) via search — these change several times a year and training data is stale. State the as-of date for anything volatile.
- **A vendor's developer/API docs outrank its help-centre prose for mechanics claims, and a search engine's own summary is not a fetched source.** A help-centre page describes what a designer clicks; a developer-docs page describes what the system actually does — an API's return scope, a data model's boundary — and the two can differ in precision on the exact question a guide needs answered. When a search tool returns its own synthesized "based on the results" paragraph, that paragraph is one layer of digestion removed from the pages it read, not itself a source: fetch the primary page directly before asserting the claim, especially the vendor's developer docs where the claim is about mechanics rather than usage.
- **Where the documentation is silent on what a tool does, test it rather than infer it.** Build the smallest fixture in a scratch file the person names, observe, delete it, and mark each such claim as tested, with the date, in the guide. A forum consensus or a search summary describes what people saw; a test is what the tool does today. Ask for a safe file before writing anything, and say in *What to re-check later* what the test could not reach (a single file is not a library publish).
- **Cover the pipeline** where relevant: DTCG token format, Style Dictionary/Tokens Studio, how the Figma structure round-trips to code. Design–code name parity is almost always part of the answer.
- **Search for post-cutoff developments** on the topic (recent releases, spec versions, conference announcements) before finalising. Note explicitly what did *not* change — "X shipped nothing affecting this" is a finding.
- **Flag volatility in a caveats section**: which claims will age fastest, and what to re-verify.

## Step 7 — Synthesize for the audience

The deliverable depends on mode: light mode ends in a cited conversational answer in chat; deep mode ends in an educational markdown file written per `references/deep-mode-voice.md` (read it before writing). That file defines one register — numbered sections titled as questions, each opening with a short plain answer and closing with advice, prose carrying the explanation and tables supporting it, worked examples, a cheat sheet and a standalone short version — and it is the shape, not one option among several. Never deliver a raw research dump as the final artifact. In every format:

- **Structure by decision, not by system.** Chapters follow the axes from Step 1; systems appear as evidence within them. A system-by-system tour is raw material, not a deliverable.
- **Teach through cases.** Give each major point a protagonist system whose own history demonstrates both the appeal and the cost of an approach (GOV.UK demonstrating value-literal naming's benefits *and* traps is the model).
- **Explain the mechanism before judging it.** How the thing actually works comes first, then the verdict on it. A reader given only the verdict cannot tell whether it applies to their constraints, and cannot notice when the mechanism behind it changes. Define a load-bearing term where it first appears, and where two things are easy to confuse, say plainly that they differ and what each governs. Elaborate rather than compress: the failure mode of a technical guide is a correct sentence nobody can act on.
- **Prose explains; tables compare.** A table earns its place when it puts a before and after side by side, or compares options across axes the surrounding prose has already introduced. It fails when it is doing the explaining, because a reader who meets the concepts first in a table has to decode rather than read. Two tests before keeping one: could a reader who has read only the surrounding prose understand it, and does removing it lose information or only lose tidiness? A guide whose argument lives in its tables reads as a report, and the register here is a guide.
- **A reader must never finish a section unsure what it said.** Every numbered section opens with a short plain-language answer and closes with advice, and both are load-bearing. This is the single most common way a well-researched guide fails its reader.
- **Include a practical blueprint** the user can execute, warning signs mapped to fixes, and a sources section split into primary vs commentary.
- **Every source is a list item with a resolvable link.** A source line naming a document without its URL is not a citation, it is a memory aid: the reader cannot check the claim, and neither can the next session. Link what you actually opened, at the deepest URL you verified (the specific help article, the specific issue, the file in the repo), not the site's front page. If you know a source exists but never resolved its URL, say so on the line rather than guessing one, because a fabricated link is worse than an honest gap. This applies in light mode too: conversational answers carry inline links.
- **Watch the tone.** Educational, not paternalistic: no "here's something reassuring," no "as you'll remember," no lecturing imperatives, no manufactured punchlines. State things; don't perform them. If a humanizer skill is available and the user wants a natural read, apply it.
- **Create a file** for anything document-length; keep short comparative answers conversational.

## Step 8 — Feed the knowledge base

Where the research runs inside a toolkit that keeps a knowledge base (this repo's `knowledge/`, toolkit-standard §D 21), the guide is not the end of it. In the same change, carry what the toolkit should apply into the page that owns the topic, one section per topic in that page's shape: what good looks like or when to use, how, cases, accessibility, check, sources, and which way the toolkit goes where sources disagree. Public sources only, cited by URL; a standard's rule cited by handle, never restated; a topic another page owns gets a line and a link there, not a second copy. Where no page owns the topic, create the page in the folder it belongs to and add it to `knowledge/README.md`. The long-form guide stays wherever the person keeps it and is never linked from the knowledge base. A finding that a run here proves is a rule for its standard, not a knowledge line (toolkit-standard §C).

*Why:* research that ends as a guide in one person's folder teaches the next session nothing; the knowledge base grows only if each research run feeds it.

## Quoting and copyright rules

These are hard limits. Quote at most once per source, always under 15 words, and default to paraphrase with attribution ("Polaris describes these as referencing the primitive scales"). Verbatim *token names, values, and code identifiers* are facts, not prose — reproduce those freely and exactly. Never reproduce paragraphs of documentation, and never mirror a source's structure.

## Quality checklist before delivering

- Every approach discussed has at least one named shipping system behind it, with real identifiers shown.
- At least one migration/rename story and one counter-example appear.
- Commentary is labelled as commentary; unverified secondary claims are dropped or flagged.
- Every source is a list item carrying a resolvable link to the exact document consulted; any source whose URL was never resolved says so instead of carrying a guessed one.
- Recency was checked by search; volatile claims carry an as-of framing; a caveats section exists.
- Pros and cons are symmetric (no approach gets only cons), and each is as specific as the other.
- Every major claim has a worked before/after case with real values, and every decision with more than one failure mode carries a named run of traps. A guide whose disadvantages are abstract while its advantages are specific fails this line.
- Mechanisms are explained before verdicts, load-bearing terms are defined at first use, and abstract claims carry a named system's story where one exists.
- Every numbered section is titled as a question, opens with a short plain answer, and closes with advice that states its causal why and marks consensus against judgment. Read three sections at random: if any could be finished without the reader being able to state its conclusion, the draft fails.
- Every table was checked against both keeping tests: understandable from the surrounding prose alone, and removing it would lose information rather than tidiness. A table that introduces its own concepts is a paragraph that has not been written yet.
- Balance: at least one consulted system sits outside the Western corporate cluster or the big-team context; consensus claims passed the lineage/independence check; recommendations state the constraints their evidence depends on; user-outcome research was searched for, and its absence noted if not found.
- Quotes: at most one per source, under 15 words each.
- Deep mode: `references/deep-mode-voice.md` was read in the same turn the guide was written, and the file presented is the rewritten guide, never a raw report artifact. A cheat sheet and a standalone short version are present, the short version works for a reader who reads nothing else, and a guide past roughly fifteen sections carries a linked index whose anchors resolve.
- Deep mode: two self-reference checks over the body, excluding sources and re-check sections. `grep -niE "previous version|earlier draft|earlier revision|prior revision|this guide previously|got .{0,15}wrong|has been corrected|been reverted"` catches a guide narrating its own revision history; hits belong in `What to re-check later` instead. `grep -woiE "\bI\b|\bmy\b"`, excluding quoted titles and proper nouns, catches a narrator the anonymous register does not have.
