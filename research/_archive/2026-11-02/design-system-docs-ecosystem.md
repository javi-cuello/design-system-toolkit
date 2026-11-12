# Design system documentation as one ecosystem

How shipping design systems structure their documentation, whether design and code docs belong together, what a component contract is, and how a Figma-first toolkit can feed a docs site, a design-phase tracker, a maintenance dashboard and in-Figma documentation from one extraction instead of six.

Researched September 2026. Component pages, token pages, repositories, issues and changelogs were opened directly for Carbon, Primer, Atlassian, GOV.UK, Polaris, Material 3, Spectrum, Fluent 2, Ant Design, TDesign, Wikimedia Codex, Twilio Paste, Salesforce SLDS, Radix and shadcn/ui, plus the Figma developer documentation and the W3C DTCG report. Sites that render only with JavaScript were read through a headless browser. The toolkit assessment in Part four was made against the toolkit repository, the four project folders and the two project codebases as they stood on 18 September 2026. Where a claim rests on practitioner commentary or a vendor's own report, it says so.

---

## What this answers

The questions arrive in roughly this order when a team decides to build documentation from a Figma library rather than write it by hand:

- If the design happens in Figma, can Figma be the source of truth, or does the record have to live somewhere else?
- What does "extract once, publish many ways" look like in systems that actually do it, and what goes wrong without it?
- What is a component contract, and where should it come from?
- Should design documentation and code documentation be one site or two?
- What belongs on a component page, and what is just data filling space?
- Can Figma component descriptions carry real usage guidance?
- How should token pages be laid out and produced?
- Should previews be live code, Storybook, or images of the Figma component?
- Before any code exists, what do developers need from the docs?
- During a design project, how should progress and completion be tracked?
- Once code exists, how should documentation show where design and code agree and where they drift?
- Where does a maintenance dashboard sit next to all of this?
- How does the current toolkit measure up, and what should the ecosystem become?

Section 15 is the cheat sheet. Section 16 is the short version, written to stand alone.

### Index

- **Part one: the architecture**
  - [1. Can Figma be the source of truth if the record lives in git?](#1-can-figma-be-the-source-of-truth-if-the-record-lives-in-git)
  - [2. What does "extract once, publish many ways" look like, and what breaks without it?](#2-what-does-extract-once-publish-many-ways-look-like-and-what-breaks-without-it)
  - [3. What is a component contract, and where should it come from?](#3-what-is-a-component-contract-and-where-should-it-come-from)
- **Part two: the documentation**
  - [4. Should design docs and code docs be one site or two?](#4-should-design-docs-and-code-docs-be-one-site-or-two)
  - [5. What belongs on a component page, and what is noise?](#5-what-belongs-on-a-component-page-and-what-is-noise)
  - [6. Can component descriptions carry real guidance?](#6-can-component-descriptions-carry-real-guidance)
  - [7. How should token pages be laid out, and should they be generated?](#7-how-should-token-pages-be-laid-out-and-should-they-be-generated)
  - [8. Should previews be live code, Storybook, or images of the design?](#8-should-previews-be-live-code-storybook-or-images-of-the-design)
- **Part three: the phases**
  - [9. Before any code exists, what do developers need from the docs?](#9-before-any-code-exists-what-do-developers-need-from-the-docs)
  - [10. How should a design-phase tracker report progress?](#10-how-should-a-design-phase-tracker-report-progress)
  - [11. Once code exists, how should the docs show parity and drift?](#11-once-code-exists-how-should-the-docs-show-parity-and-drift)
  - [12. Where does a maintenance dashboard fit?](#12-where-does-a-maintenance-dashboard-fit)
- **Part four: the toolkit**
  - [13. How does the current toolkit measure up?](#13-how-does-the-current-toolkit-measure-up)
  - [14. What should the ecosystem become, and in what order?](#14-what-should-the-ecosystem-become-and-in-what-order)
- [15. Cheat sheet](#15-cheat-sheet) · [16. The short version](#16-the-short-version) · [17. What to re-check later](#17-what-to-re-check-later) · [Sources](#sources)

---

# Part one: the architecture

## 1. Can Figma be the source of truth if the record lives in git?

**The short answer.** Yes, if the two roles are separated. Figma can be the place where the design is authored, while a committed, versioned extraction of it is the record every other tool reads. Almost no mature system treats a live Figma file as the record, and the reasons are mechanical rather than cultural.

Two different things hide inside the phrase "source of truth". One is the **authoring surface**: the tool where a person makes the decision, drags the padding, picks the colour. The other is the **source of record**: the artifact other systems read, diff, version and validate against. In a small team the two feel like the same thing because nobody has had to separate them. They stop being the same thing the first time a second tool needs to read the design, because the second tool has to read *something*, at *some moment*, in *some shape*.

The mature systems surveyed almost all put the source of record in a repository and write Figma as an output. Adobe's Spectrum keeps a canonical dataset in `packages/design-data/` (tokens, 97 component files, mode sets, guidelines) and exports it to Figma Variables. Atlassian generates `@atlaskit/tokens` from TypeScript schema files and ships a `figma/atlassian-light.json` artifact beside the CSS. Primer's primitives build emits CSS, docs, a Figma format and LLM guidance from DTCG JSON in the repo. Carbon adopted the same position formally in an architecture decision record in 2026: DTCG JSON files are the only hand-edited source, and Figma sync was explicitly not a driver of the change.

The stated reasons are worth reading closely, because they are about what Figma cannot do rather than about preference. Spectrum's RFC on authoring gives Figma a secondary, view-only role for most contributors because Figma cannot enforce a schema, a taxonomy or validation rules. Nathan Curtis, writing about component contracts, calls a definition extracted untransformed from one party's point of view "testimony, not a contract" (commentary). The platform limits are concrete: the Figma Variables REST API requires a Full seat in an Enterprise organisation, View and Collab seats are limited to about 20 file reads a month under the rate limits effective November 2025, component property descriptions exist in the Plugin API only for `SLOT` properties, and the REST API's `ComponentPropertyType` still has no `SLOT` at all.

Spectrum also shows the way out of the apparent contradiction. It keeps a Figma plugin, `tools/component-options-editor`, as the editing interface for component option schemas, validated with Ajv, while the data lives in the repository. Figma is where people edit; git is where the truth is kept. A Figma-first team can reach the same arrangement from the other side: design in Figma, extract with a plugin, and **commit the extraction**. The committed file is then the record. It is versioned, diffable, reviewable in a pull request, readable offline, and identical for every consumer, which a live file is not.

The failure this prevents is visible in systems that did not separate the roles. Carbon's epic #23000 describes its DTCG source and Figma variables as disconnected, with no enforcement of which is the source of truth. An audit that followed (#23252) found tokens in Figma missing from code, 106 of them in Tag alone, and #23253 states the symptom plainly: every token change leaves Figma silently out of sync. Jahia's Moonstone (#1480) shipped a warning colour of `#E8B606` in Figma and `#FFBB00` in code. Nuxt UI (#6285) had its Figma kit using `bg-muted` where the code used `bg-elevated`, visible only in light mode. None of these teams chose drift. Each had two places that could be edited and nothing that made one of them the record.

**Traps.**

- **Declaring a source without an extraction.** Carbon declared code the source and still found 106 tokens that existed only in Figma. A declaration does not reconcile history.
- **Treating the live file as the record.** Every consumer that reads a live file reads it at a different moment, through a different API, with different access rights. Two consumers of "the same" file can disagree without either being wrong.
- **Letting the neutral format be a vendor format.** Material's earlier neutral token payload, Adobe's Design System Package format produced by Material Theme Builder, is archived. So are Salesforce's Theo and Fluent's token pipeline. DTCG, which reached a stable Final Community Group Report on 28 October 2025, is the survivor for tokens.

**What to do.** Keep Figma as the authoring surface and make a committed extraction the source of record. This matches the consensus in substance: every mature system reads a versioned artifact, not a live canvas. It departs from the consensus only in which side authors, and that departure is defensible for a studio whose work begins in Figma months before any code exists. The judgment here is that "Figma is the source of truth" should be written down as "Figma is where it is decided, the snapshot is what it is". The evidence depends on one constraint: the extraction must run often and be trusted, or the committed copy becomes the stale one.

---

## 2. What does "extract once, publish many ways" look like, and what breaks without it?

**The short answer.** One extraction writes a neutral, schema-validated payload, and every output (docs site, token build, dashboard, generated Figma pages, agent tooling) reads that payload rather than reading the source again. Systems that do this have one bug when the data is wrong. Systems that do not have as many silent disagreements as they have readers.

The pattern has three parts. An **extractor** reads the source and writes a payload. A **schema** says what the payload contains, and a test fails when a payload does not match it. **Consumers** read only the payload, and each renders it in the form it needs. The value is not the neatness. It is that a question like "what is the Button's default size" has exactly one answer everywhere, and when that answer is wrong it is wrong in one place and fixed in one place.

Spectrum is the fullest public example. One dataset feeds S1 and S2 token viewers, the docs site's component options tables, `@adobe/spectrum-component-schemas`, an MCP server for agents, a Rust CLI with a `resolve --format dtcg` output, and the Figma Variables export. Atlassian's changelog shows the same pattern arriving in stages: version 0.0.4 was built with Style Dictionary into three outputs (CSS, Figma synchronisers, a token name map); 0.13.3 added a `tokens-raw` entrypoint so the Figma plugin could import token information; and 0.13.5 is titled, in effect, "correct Figma entrypoints to use raw JSON". That last entry is the pattern being enforced after a second path had crept in. On the code side, Shoelace extracts one Custom Elements Manifest and feeds its docs site and its VS Code, JetBrains and Vue integrations from it.

The cost of the opposite is best described by someone who measured it. Rachel Cantor's 2026 write-up of an agent working against a design system found the Storybook component manifest to be a lossy copy: `@deprecated` tags never reached the agent, a wrong docgen extractor silently left descriptions blank, and the agent duplicated components because the guidance lived in a Docs tab it never read (commentary, with a worked case). Her summary of the pipeline was that nothing flagged anything. Every reader was internally consistent. They simply read different things.

Two honest limits apply. First, neutral payload formats die young: Theo, the Design System Package format, Fluent's token pipeline and Open UI's component dataset (its Atlassian entry last updated in 2019) are all archived or stale. A team building its own payload should expect to own its schema for as long as it uses it, and should keep tokens in DTCG where a standard exists. Second, not every read can move to a payload. A tool that *fixes* a Figma file (renames a layer, rebinds a variable) must read the live file, because it writes back to it. The rule that survives contact with real tooling is narrower: **reads that report go through the payload; reads that edit stay live.**

**What to do.** Build one extractor, give its payload a versioned schema with a test, and route every reporting consumer through it. This is consensus among the systems that publish their pipelines. The judgment added here is the split between reporting reads and editing reads, which keeps the rule honest instead of absolute. The approach depends on the extraction being cheap enough to run on every meaningful change; a plugin run measured in seconds meets that, a manual export ritual does not.

---

## 3. What is a component contract, and where should it come from?

**The short answer.** A component contract is a neutral, machine-readable statement of what a component *is*: its properties and allowed values, its defaults, its parts, its states, the tokens each part uses, and ideally its accessibility and behaviour. It should be derived from Figma for what Figma knows, supplemented by an authored layer for what Figma cannot express, and checked against the code's own derived contract.

The idea comes most clearly from Nathan Curtis (commentary, but with a shipping schema behind it). His 2025 "Analysis of Variants" proposes a component spec that is **deterministic** (regenerate it with nothing changed and the diff is empty) and **normalised** (the default stated once, every variant stored only as what differs from it). He counts more than 14,400 redundant properties in Figma's raw data for a typical component, which is exactly the redundancy normalisation removes. His 2026 "Component Contracts and Schemas" goes further: a contract is the artifact every implementation signs, React, iOS, web components and Figma alike, and "a rotted contract is worse than no contract at all". The schema behind it ships as `@directededges/specs-schema` (0.32.0), whose `Component` object carries `metadata, title, anatomy, props, default, variants, invalidVariantCombinations, subcomponents, instanceExamples, slotContentExamples, images, source`, with prop types `BooleanProp, StringProp, EnumProp, SlotProp, NumberProp, ImageProp`. It leaves behaviour, accessibility and motion for a later pass.

Spectrum's `component-format.md` is the other serious example, and it adds the fields the Figma-derived shape lacks. `button.json` carries `options` (with `values[]`, each able to hold its own lifecycle, because a later rule bans bare `enum`), `slots`, `anatomy`, `states` (each with a `trigger` of `prop` or `interaction`, a `precedence` and a `layered` flag), `tokenBindings`, `lifecycle` and `accessibility` (`role, intents, focusable, keyboardIntents, wcag[]`). The spec's own justification is a failure it could not previously catch: a token naming `component: "button"` with `variant: "foo"` was undetectable as invalid because nothing said which variants existed.

Code has contracts of its own, derived automatically. The Custom Elements Manifest (schema 2.1.0) lists attributes, members, events, slots, CSS parts and CSS properties, and ships in the `package.json` of Shoelace, Web Awesome, Spectrum Web Components, Lion, Material Web and Vaadin. Storybook 10 generates `/manifests/components.json` from stories and prop types, with `reactDocgen.props` carrying `required, tsType, description, defaultValue`. Neither has a notion of variant axes, tokens per part, or states. Storybook's manifest was made default-on in 10.3.0 and turned back off in 10.3.5.

Between the design contract and the code contract sits a **mapping**, and the mapping is where most real disagreement lives. Primer's `Button.figma.tsx` (a Figma Code Connect file) maps the Figma variant value `secondary` to the code value `default`, and splits the Figma `state` enum into the code booleans `disabled` and `inactive`. That file is a contract translation written by hand, and Code Connect's issue tracker (#158, #291, #383) shows what happens when one side renames. A renamed property or layer now fails the publish, but a renamed variant value does not: the CLI (2.0.1) checks property names and not the keys of an enum mapping, so the mapping breaks, validation passes, and the failure appears only in Figma's interface. A worked example of the mismatch, from Spectrum's own two contracts on 18 September 2026:

| Field | Spectrum `button.json` (design contract) | React Spectrum S2 `Button.tsx` (code) |
|---|---|---|
| Fill property name | `style` | `fillStyle` |
| Size values | `s`, `m`, `l`, `xl` | `'S' \| 'M' \| 'L' \| 'XL'` |
| Default variant | `accent` | `primary` |
| Extra variants | none | `premium`, `genai` |

Adobe authored both. Neither is wrong on its own terms, and a docs page built from either would be internally consistent and wrong about the other. This is why the contract cannot be *only* derived from one side: something has to say which translation is intended, and something has to diff the two.

A minimal contract that serves documentation, audit, parity and code generation needs, with the evidence for each field:

- **Identity and lifecycle** (name, id, status, deprecation): Spectrum, CEM, Specs `metadata`.
- **Properties** with type, allowed values and default: every source.
- **The axis-to-code mapping** (renames, enum-to-boolean splits, pseudo-class states): only Code Connect carries it, and no neutral schema does.
- **Slots**: Spectrum, CEM, Specs `SlotProp`, Figma `SLOT`.
- **Anatomy** (named parts): Spectrum, Specs, Open UI, CEM `cssParts`.
- **States**, marked as set by a prop or by interaction: Spectrum only.
- **Tokens per part**: Spectrum `tokenBindings`, SLDS styling hooks, Specs element styles.
- **Guidance** (purpose, usage, don't): in no schema; in Figma descriptions when a team writes them in a structure (section 6).
- **Accessibility intent** (role, keyboard pattern): Spectrum only; otherwise a link to the WAI-ARIA Authoring Practices pattern.

**What to do.** Treat the Figma-derived spec as the first half of the contract, normalised and deterministic in Curtis's sense, and add an authored layer for the mapping to code, states, guidance and accessibility intent. The evidence-weighted position, which is a judgment rather than consensus, is a third artifact assembled from the two derived contracts and checked against both, because the one system that authored a standalone contract (Spectrum) has already drifted from its own code. The parts of this a Figma-first toolkit already owns are covered in section 13.

---

# Part two: the documentation

## 4. Should design docs and code docs be one site or two?

**The short answer.** One site. Every system that ran two eventually merged them or let one side decay, and the only arrangement of "two" that holds up is a single design site that links out to per-platform code references it does not try to reproduce.

The history here is unusually consistent. Atlassian merged its design guidelines site and Atlaskit into one home in August 2020, rewriting 27 of 60 components along the way, and said openly that navigating two sites was unpleasant. Primer ran sibling sites for design, CSS, React and ViewComponents until 2023, began exploring React docs on the design site in January 2023 (PR #366), and removed the React docs sub-site in September 2024 (PR #4822), leaving one page per component with guidelines, API and a per-implementation status block. GOV.UK has always put guidance, HTML and Nunjucks code, and published research on one page. Carbon keeps one site with `Usage | Style | Code | Accessibility` tabs, where the Code tab is a live Storybook demo plus links to React, Web Components, Angular and Vue Storybooks.

The counter-cases are instructive because they show what separation costs. Spectrum still has a design site and a code site. The design site's button changelog stops at 12 September 2022 and its design checklist still asks for an XD kit; the React Spectrum S2 button page no longer links back to any guidance, where the v3 page did. Polaris merged in the other direction: polaris.shopify.com now redirects every guidance, patterns and content URL to an API landing page on shopify.dev, where what remains is a short "Best practices" section at the bottom of each component. Separation let Spectrum's two sides drift; merging into a developer portal let Polaris's guidance shrink to almost nothing. Both are the same failure seen from different ends: one audience's content stops being maintained once it no longer sits beside the other's.

Commentary agrees. Curtis wrote in 2018 to be wary of a design and code split, and, if forced to choose, to write for engineers first. Brad Frost's 2023 ecosystem essay describes a reference website that brings design and code together, with Figma and Storybook as workshops rather than as the documentation. Survey data from zeroheight (a vendor, so treat with care) found 68% of 294 respondents document their system in multiple places, with Figma plus Storybook the most common pairing at 47%. That is what teams do, not evidence that it works.

"One site" does not mean one page holding everything. Fluent 2 shows a workable middle: one design site with Web, iOS, Android and Windows switchers, where each platform's page links out to that platform's Storybook or GitHub source rather than restating its API. The code reference stays where the code is; the design site owns guidance and links.

**What to do.** Build one site and let it link to the code reference (Storybook, or the source) rather than rebuild it. This is consensus by migration: Atlassian and Primer both paid to merge. Tabs are optional; GOV.UK, Codex, Ant Design and Spectrum all use single long pages, so the page count matters less than the rule that guidance and code sit on the same page for the same component. The one condition: if the code reference is generated elsewhere, the site must link to the exact story or symbol, or the link becomes the new place drift hides.

---

## 5. What belongs on a component page, and what is noise?

**The short answer.** A small, fixed skeleton in a fixed order: what it is and when to use it, a preview, the properties, the states, the tokens a developer needs, and accessibility intent. Anything that does not help someone choose, build or check the component is noise, however easy it is to generate.

The only published user research on documentation structure comes from GOV.UK. In 2018 the team researched with designers, developers, product managers and business analysts and concluded that documentation had to be consistent, clear, useful and honest, and that a component is only as good as the guidance explaining it. That research produced a fixed page order (when to use, when not to use, how it works, research, help improve) written down as a content pattern in the backlog repository. A 2022 survey of 106 users asked for more examples, more evidence and more accessibility guidance. No other surveyed system published research on documentation structure, which is itself worth knowing: most page layouts are inherited, not tested.

The shipping skeletons overlap more than their tab names suggest. Carbon's Usage tab runs live demo, accessibility testing status, overview, when to use, when not to use, variants, formatting, anatomy, content, behaviours. Primer's contribution guide prescribes Overview, Guidelines and Accessibility tabs, and explicitly allows "minimum viable documentation" for a component that has not earned more. Atlassian runs Examples, Code, Usage, Changelog. Ant Design runs When To Use, Examples, API, Semantic DOM, Design Token, FAQ. The common core, ignoring labels: purpose and when to use, a preview, properties, states and behaviour, accessibility.

Two findings argue for restraint. First, Primer's own pull request #710 calls the mix of hand-written and generated props tables a "matrix of sadness"; more tables did not mean better docs. Second, generation makes data cheap, and cheap data fills pages. A generated docs site can list every token a component binds across 216 variants, every variable in every collection, every count. Altitude's overview page draws the useful line well: its figures are health figures ("measured, not asserted", with Figma parity and accessibility results), not inventory figures. An inventory number (374 variables, 715 variants) does not help anyone make a decision; a health number (8 of 59 components not yet built, 3 with open accessibility failures) does.

A worked contrast for a Button page:

| Section | Keep | Cut or collapse |
|---|---|---|
| Opening | One-line purpose, status, links to Figma and code | A count of variants as the headline |
| Guidance | Use when, don't (each naming the alternative) | Paragraphs restating the property table |
| Preview | Live story or design image, with a picker for the main variants | One frame per story, all loaded at once |
| Properties | Name, type, values, default, and the code name where it differs | Instance-swap internals nobody sets |
| States | Which states exist and what sets each (prop or interaction) | A full variant-by-state grid of 216 cells |
| Tokens | Per part: fill, text, stroke, spacing, for the default and each state that changes | Every token across every variant in one flat list |
| Accessibility | Role, keyboard pattern, link to the APG pattern, known gaps | Generic WCAG boilerplate repeated per page |

**What to do.** Adopt a fixed skeleton (purpose and guidance, preview, properties, states, tokens per part, accessibility) and hold every generated table to one test: does it help someone choose, build or check this component? GOV.UK's research supports the fixed order; the restraint rule is this guide's judgment, informed by Primer's props-table history and the observation that generated sites fail by excess rather than omission. Where data exists only to be complete (every token across every variant), put it behind a disclosure or in a machine-readable export, not on the page.

---

## 6. Can component descriptions carry real guidance?

**The short answer.** Yes, if they are written in a fixed structure and extracted as data. A structured description (purpose, usage, don't, each don't naming the alternative) is enough to turn a technical page into a useful one, and it is the only place a Figma-first team can store guidance next to the component itself.

Figma component descriptions appear in the Assets panel, the instance menu and Dev Mode's Inspect panel, and Figma's own guidance treats them as the first layer of documentation. The Plugin API exposes both `description` (plain text) and `descriptionMarkdown`. Nothing in Figma enforces a structure, which is why most libraries' descriptions are a sentence or empty.

Shipping systems show what the guidance layer contains when it exists. Paste uses a `<DoDont>` component; Atlassian's Usage tab carries best practices and content guidelines; TDesign's pages carry 何时使用 (when to use), 推荐/慎用示例 (recommended and use-with-care examples) and 相似组件 (similar components); Polaris's surviving guidance is a "Best practices" and "Limitations" pair. The most compact and most useful element across all of them is the one TDesign names outright: **similar components**. A "don't" that says what to use instead is worth more than three that only forbid.

The danger is the Polaris outcome: guidance compressed until it is a footnote. The opposite danger is a description field used as a long-form document, which Figma's panels truncate and nobody reads in the canvas. The structure that balances the two keeps each section short and puts the load on naming alternatives:

```
Primary action for a single decision in a view.

## Usage
- Use Primary for the one most important action in a screen or dialog
- Choose Role first, then Size

## Don't
- Use two Primary buttons in one context: use Secondary for the second
- Use a button to navigate: use a link
```

A docs site can split that into a lede (the first paragraph), a Do and Don't pair (the two lists), and links (any alternative component named in a Don't item that matches a component page). The same text serves the designer in the canvas, the developer in Dev Mode and the reader of the site, which is the single-source argument from section 2 applied to prose.

**What to do.** Write descriptions in a fixed structure, extract `descriptionMarkdown` with the rest of the snapshot, and render purpose, usage and don't on the component page, with alternatives linked. The structure itself is this guide's judgment, informed by TDesign's similar-components section and Polaris's shrinkage; the extraction is required by the single-source argument. It depends on one constraint: someone has to write the descriptions, and a page that renders an empty guidance section should say "no guidance yet" rather than hide it, because GOV.UK's "honest" criterion applies to gaps too.

---

## 7. How should token pages be laid out, and should they be generated?

**The short answer.** Semantic tokens as a table with one column per mode, showing the alias and the value, with search and copy. Primitives as compact ramps. Generate the pages from the same payload the code uses, unless the token source is small and changing shape, in which case hand-maintained data can be simpler.

Atlassian's all-tokens page is the strongest model: one page, `Token and description | Light value | Dark value`, the value shown as the palette alias (`Lime100`) rather than hex, a description and an "introduced in" version per token, a token picker, filters, a syntax toggle and exact search. Fluent uses `Alias token | Global token light | Global token dark` with a row per interaction state. Carbon uses a theme switcher and `Token | Role | Value`, with copy-hex and copy-token actions. Primer shows only the active theme and sends readers to Storybook for the others. Codex shows hex beside the referenced token and flags deprecated ones. Paste added an "accessible pairing" popover listing colours that pass contrast with the selected token, the only contrast feature found; no surveyed system prints ratios in its tables.

Generation is the majority practice where the source is public. Codex imports its token JSON directly into the page. Paste imports built themes. Ant Design runs typedoc over its token interfaces. Atlassian's npm artifacts carry a codegen header, and the site reproduces a typo from the token source ("Use for for backgrounds") word for word, which is good evidence the site is generated. The counter-examples are real. Carbon hand-maintains a 120 KB `color-tokens.js` and fixes drift pull request by pull request (#4719 updated a border token to "match what we have in code"). GOV.UK went the other way on purpose: pull request #5002 in November 2025 removed its generator because maintaining colours by hand was simpler than maintaining the helper, during a colour-system rework. The lesson is not that generation is wrong; it is that a generator coupled to one source format breaks when that format is being redesigned.

A token page generated from a snapshot is at little risk of GOV.UK's problem, because the generator reads a stable payload shape rather than Sass. Its risk is the one in section 5: listing everything. Three collections of 374 variables rendered in full is a reference dump. The useful subset for most readers is the semantic layer; primitives matter to the people maintaining the semantic layer.

**What to do.** Generate token pages from the committed payload, lead with the semantic tokens in a per-mode table with alias, value, description, search and copy, and show primitives as ramps on a secondary page. This is consensus for layout (Atlassian, Fluent, Codex converge) and majority practice for generation. Contrast ratios for defined foreground and background pairs would be a genuine differentiator, but only once the pairs are defined; computing every combination is noise.

---

## 8. Should previews be live code, Storybook, or images of the design?

**The short answer.** Live code once it exists, embedded from the project's own Storybook. Before code exists, images of the Figma component, exported by the same extraction. Never both on the same page without saying which is which.

Live previews dominate where code exists: Primer and Atlassian offer editable examples, GOV.UK renders real HTML in resizable iframes with HTML and Nunjucks tabs, Carbon's Code tab is a Storybook iframe with theme and variant selectors, React Spectrum S2 and Codex offer playgrounds with prop controls. Static images dominate where it does not: Material 3's design site has no live code at all, and even material-web's docs use `images/button/types.webp`, with the interactive demo in its source commented out.

An embedded story has two practical requirements that decide whether it works. It must be served from the same origin as the docs, so the frame can size itself to its content and follow the site's theme; and it must be matched to the component exactly, not by a naming convention that breaks the first time a story is retitled. Matching by the story file's location (the story sits in the same folder as the component's spec) meets both.

For a design-only project, images are the honest preview. The snapshot plugin in this toolkit already exports illustrations as 2x PNG and screen frames as PNG; the same call can export each component's default variant, or its component set as drawn. The label matters: a preview rendered from code and one rendered from Figma answer different questions, and once both exist the gap between them is the parity question of section 11.

**What to do.** Embed live stories from the project's own Storybook when code exists, matched by file location and served on the site's origin; show Figma-exported images, labelled as design, before it does. The live-over-static preference is consensus. Labelling the source of every preview is this guide's judgment, and it becomes load-bearing the moment a project has both.

---

# Part three: the phases

## 9. Before any code exists, what do developers need from the docs?

**The short answer.** A specification, not a showcase: every state, the tokens per part, the properties mapped to intended code names, focus and keyboard behaviour, spacing and all size configurations, overflow rules, and a record of what changed since the last handoff.

Carbon's component checklist is the most explicit published version. Its design spec is described as the blueprint developers build from, and it requires colour tokens, type tokens, structure and measurements (every configuration of size and content), interaction states (hover, focus, selected, disabled, read-only, error, warning), behaviours (responsiveness, overflow and reflow, expansion, scrolling) and accessibility (4.5:1 text, 3:1 non-text, focus flow documented). Its code checklist then requires the component to be built to that spec. Curtis's "Component Specifications" (2023, commentary) lists anatomy, properties including non-visual ones, layout and spacing, text wrapping and overflow, responsiveness, touch targets, behaviour, animation, accessibility (screen reading, focus order, announced order) and component tokens, and argues that Figma's Inspect panel is not enough because components omit behaviour, code-only properties and accessibility.

The one user-facing data point comes from a vendor survey (Progress Telerik 2024, 222 respondents, 82% on the engineering side). Asked why handoff disappointed them, 65% said designs keep changing afterwards and are hard to track, and 50% said they have to ask many questions. The first number is the argument for a change record in the handoff docs; the second is the argument for completeness.

Figma's own tooling covers part of this. Annotations and measurements arrived with Dev Mode's general availability in January 2024, with default categories Development, Interaction, Accessibility and Content. Dev Mode statuses mark a section "Ready for dev", and Figma sets "Changed" automatically when a ready design is edited. What Figma does not provide is the assembled view: one page per component listing states, tokens per part and intended code names together.

Ranked by how many sources require it: states (Carbon, Curtis); tokens per part (Carbon, Curtis); properties mapped to code names (Curtis, Primer's Code Connect); keyboard and focus with the ARIA pattern (Carbon, Curtis, the WAI-ARIA APG); spacing and all configurations (Carbon, Curtis); overflow and responsive behaviour (Carbon, Curtis); change history (Curtis, Figma's Changed status, Telerik's 65%); motion (Curtis).

**What to do.** In a design-only phase, the docs site should be a handoff spec: per component, states, tokens per part, properties with intended code names, keyboard and focus intent linked to the APG pattern, and a "changed since last snapshot" list. This is consensus between Carbon's checklist and Curtis's specification format. A snapshot diff supplies the change list for free, which answers the most common developer complaint in the only survey found.

---

## 10. How should a design-phase tracker report progress?

**The short answer.** Per component, a small closed set of statuses that mean something to the people waiting (in progress, in review, ready for dev, changed since ready), plus what is blocking each one. The tracker is about completion; it is not the audit.

Status vocabularies have been shrinking, which is the most useful finding for anyone designing one. Primer went from six lifecycle statuses (Experimental, Alpha, Beta, Stable, Deprecated, Removed) to three (Experimental, Ready, Deprecated). Carbon is renaming `experimental` and `unstable` to `preview`, and its checklist uses Draft, Preview candidate, Preview, Stable, where Stable means complete across code, kit, docs and design. GOV.UK was still choosing its lifecycle names in August 2026 (issues #5426 and #5477). Figma's own vocabulary is three: Ready for dev, Completed, and the automatic Changed. A long status list reads as precision and is maintained as guesswork; Primer's own source files and site disagree on several components' status, which is what an over-fine vocabulary produces.

A design-phase tracker in a studio context has a second job the product systems do not: it shows a client or a team lead how far the library is from done, and what is waiting on whom. The inputs for that already exist in a Figma-first workflow. Page markers (`🚧` in progress, `❖` finished) are a status the designer sets in the file. An audit score per component says how close to the library standard it is. Open findings say what is blocking. A rulings log says what was decided in review and when. Snapshot fingerprints say which components changed since the last review. Each of these is a fact the tracker can read rather than a field someone has to maintain.

Hand-maintained status is the failure to avoid. One design system's committed status manifest reported 0.131.1 while its package was at 0.138.0, because nothing failed when it was out of date (brik-bds #1552). Material Web keeps a hand-written roadmap with a freshness stamp and an owner, which helps, and still lists 17 components never built. The pattern that holds is derived status: every status the tracker shows is computed from something that already exists.

**What to do.** Build the tracker as a view over data the workflow already produces: page markers for in progress and finished, the audit score and open findings for readiness, rulings for decisions taken in review, and snapshot fingerprints for "changed since last review". Keep the vocabulary to three or four statuses. The shrinking vocabularies are consensus; the derived-status rule is judgment backed by the stale-manifest failure. The tracker and the audit dashboard read some of the same data but answer different questions: the tracker says how far along, the dashboard says what to fix.

---

## 11. Once code exists, how should the docs show parity and drift?

**The short answer.** Per component, generated from a measurement, directional (Figma ahead, code ahead, both changed, in sync), with the date of the last confirmed match and an explicit "not measured" where nothing was checked. Never a hand-maintained table.

The most mature systems mostly do not publish parity. Primer shows `React | ready`, `Rails | ready` and `Figma | View in Figma`, giving Figma a link but no status, and omits the row when there is no Figma asset. Material 3 has an availability table (`Type | Resource | Status`, values Available and Unavailable). Carbon's v9 site had a cross-framework matrix; the current site does not, and its community component index is marked deprecated. Atlassian shows one release phase per component, not per implementation. Availability is published; agreement is not.

Altitude, a smaller system built by the team behind a Figma console tool, is the one found that publishes agreement. Its overview reports Figma parity in six categories (`IN SYNC`, `FIGMA AHEAD`, `CODE AHEAD`, `BOTH CHANGED`, `NOT IN FIGMA`, `NOT TRACKED`), generated at build time, with a line such as "41 of 41 mapped Figma sets observed, last read 2026-09-08". Each component page shows its status, a count of property differences, the last confirmed sync date and per-property and per-token-binding differences such as `[prop] missing-in-code`. It also prints "NOT RECORDED" for accessibility passes that were not run instead of leaving a blank.

Its weaknesses are as instructive as its strengths. The code side of Altitude's comparison is a hash of the component source, so a comment edit counts as a change and the system cannot say what changed. `BOTH CHANGED` is its second-largest bucket (14 of 41), which may measure the sync ritual more than real divergence. Status is per component, not per variant. A measurement that compares rendered output against the design, variant by variant, would not have those weaknesses, and the toolkit's parity loop is exactly that kind of measurement (section 13).

**What to do.** Show parity per component on the docs site, generated from a persisted measurement: status, number of differences, the differences themselves behind a disclosure, the last confirmed match, and "not measured" where applicable. Altitude's categories are a good starting vocabulary; a rendered, per-variant measurement is a better source than a source hash. This is a judgment, because the large systems publish availability and not agreement, but the failure of hand-maintained status tables is well evidenced, and a measured parity report is only useful if it is saved somewhere the docs can read it.

---

## 12. Where does a maintenance dashboard fit?

**The short answer.** The dashboard is the working tool for the people keeping the library correct, in every phase: it runs the audits, holds the findings, and records rulings. It should read the same payload as everything else for what it reports, and read Figma live only for what it fixes.

The docs site, the tracker and the dashboard have different audiences and different verbs. The docs site is read by people building with the system. The tracker is read by people waiting on the system. The dashboard is used by people maintaining the system: it lists what is wrong, lets someone approve a fix or rule on an exception, and writes those decisions back. The first two are views; the third is a tool with side effects.

That difference sets the one boundary worth drawing. A dashboard that fixes Figma must talk to the live file, because its writes go there. But much of what a dashboard *shows* (the inventory, the scores, the history of runs, which components changed) is reporting, and reporting from a separate live read reintroduces the second-reader problem of section 2. The systems surveyed do not publish their maintenance tooling, so this section rests on the architecture argument rather than on a shipping example.

**What to do.** Keep the dashboard as the maintenance tool for every phase, with audits that read live and fixes that write live, but have its reporting (inventory, change detection, the history of runs) read the committed payload and its findings stored as data that the docs site and tracker can also read. This is this guide's judgment; no surveyed system publishes enough of its internal tooling to confirm or refute it.

---

# Part four: the toolkit

## 13. How does the current toolkit measure up?

**The short answer.** The parts are good and they do not form a system yet. There are at least six separate code paths reading component trees from Figma and five reading variables, four routes from tokens to CSS, two component formats, two description parsers, and no schema for the snapshot payload. The docs site built this week is agnostic and generated, which is right, but it depends on one project's receiver layout, throws away the status the designers set, shows no guidance, and cannot run at all for a design-only project.

### The ecosystem as it stands

What reads Figma today, and how:

| Reader | Reads | Route | Output |
|---|---|---|---|
| Snapshot plugin (`plugins/design-system-snapshot`) | Variables, styles, component props and variant trees, icons, graphics, screen frames | Plugin, into a repo receiver | Per-repo files |
| Components audit scanner | Component trees, bindings, axes, description presence | Live bridge | `audit.json` rows |
| Foundations audit | Pages, names, separators | Live bridge | `audit.json` rows |
| Component validator (`walk-figma.js`) | Component trees, including truncation and blend mode | Live bridge | `components.json` |
| Variable audit (`links.js`) | Variable and style keys | Live bridge, two files | Report and rows |
| File diff | Variables, styles, component API, trees | Live bridge, two files | Diff report |
| Token export (`collect.js`) | Variables and styles | Live bridge | DTCG folders |
| Doc generator, properties table, tokens examples, contrast matrix | Variables, styles, props | Live bridge | Pages written into Figma |
| Descriptions skill (`verify.js`) | `descriptionMarkdown` | Live bridge | Descriptions written into Figma |
| Component guidelines plugin | Plain `description` | Plugin | A panel on the canvas |

What writes code from tokens: `figma-token-export` (DTCG, then Style Dictionary), `frontend-build`'s `tokens-to-css.mjs` (DTCG to CSS), Project B's `bin/tokens` (snapshot to custom properties) and the marketplace's `bin/tokens.js` (snapshot to Sass variables). Four generators, three input shapes.

### What works, and should be kept

- **The snapshot chain's identity contract.** `snapshot-standard.md` and `contract.cjs` settle whose payload a snapshot is (file ids, not names; one implementation; exit codes that mean something). This is the hardest part of an extraction layer and it is done.
- **The normalised component spec.** Each component's `figma.json` already stores one full default variant and every other variant as its difference from it, which is Curtis's normalised model, reached independently and round-trip tested in Project B.
- **The parity loop.** A rendered, per-variant, per-layer measurement against the Figma spec with a baseline and waivers is a better parity source than anything published, Altitude's hash included.
- **The docs engine's shape.** It names no project, reads committed data, matches stories to components by folder, serves Storybook on its own origin, and reads the Figma key through the snapshot contract rather than copying it. Generated from the payload, it cannot drift the way Carbon's hand-maintained colour file does.
- **The audit record and rulings log.** `audit.json` with runs, scores and fingerprints, plus an append-only rulings log in each context document, is most of the data a design-phase tracker needs.

### What does not, stated plainly

- **There is no payload schema.** `contract.cjs` checks identity only. What a payload contains is defined by each repo's receiver, and the two receivers disagree: the marketplace's token file carries legacy `global`, `semantic`, `layout` and `type` keys and numbered collection names that Project B's does not, and the two repos' screen files have different shapes. The receivers, the token generators and the parity libraries are forked per repo, by design of the parity skill, which multiplies every fix.
- **Design-only projects have no extraction at all.** Project C and Project D have no repo and no receiver, so every tool they use reads Figma live, and the docs site cannot build for them. The two projects in the phase where documentation most needs to be a handoff spec are the two that cannot have it.
- **The snapshot omits exactly the data the outputs need.** No component descriptions (zero `description` keys across every spec), no variable descriptions (the doc generator needs them), no page status markers beyond what survives in the page name, no truncation or blend mode (so the validator walks live), and no audit results.
- **The docs site discards the designers' status.** It strips `❖` and `🚧` from page names to make tidy titles, which removes the one status signal the designers maintain.
- **The docs site is technical only.** It has no guidance because the snapshot carries no descriptions. By GOV.UK's standard (docs are only as good as the guidance), it is a reference, not documentation.
- **It reports inventory, not health.** Its overview leads with 374 variables and 715 variants. Its token page lists every token across every variant under a disclosure. Its dimensions page draws a bar for every number. Section 5's test (does it help someone choose, build or check?) fails on much of it.
- **It is phase-blind.** It renders the same pages for a project with no code and a project in maintenance. There is no phase concept anywhere in the toolkit: not in the dashboard, not in the context template, not in the router.
- **Parity is measured and then lost.** Project B's parity run measures every variant against the design and prints the result to the terminal. Nothing persists a report the docs site, tracker or dashboard could read.
- **Audit output is written twice.** Project C's dated audit markdown files restate what `audit.json` holds, in a different shape, by hand.
- **Some documentation is stale.** The toolkit README names a dashboard `scripts/` folder that does not exist; the snapshot plugin's README contradicts the snapshot standard on the port and on plugin data.

**What to do.** Keep the identity contract, the normalised spec, the parity measurement, the audit record and the docs engine's core. Treat the absence of a payload schema and of a toolkit-owned receiver as the root problem, because nearly every duplication and every gap listed above follows from it. This assessment is a judgment made against the evidence in Part one; the inventory behind it is in the toolkit data-flow map produced on the same day.

---

## 14. What should the ecosystem become, and in what order?

**The short answer.** Four layers: Figma as the authoring surface; one extraction with a versioned schema, received by one toolkit-owned library into one layout; component contracts assembled from the spec plus a small authored layer; and modular outputs that switch on by project phase. Built in order of what removes the most duplication first.

### The layers

**Authoring (Figma).** Designers decide in Figma, and three things they already do become data: page markers as status, structured descriptions as guidance, Dev Mode's Ready for dev where the team uses it.

**Extraction (one plugin, one schema, one receiver).** The snapshot plugin stays the only reporting reader. It gains the fields the outputs need: `descriptionMarkdown` per component, variable descriptions, the page marker as a status field, truncation and blend mode, and a default-variant image for design-only previews. Its payload gets a JSON Schema, versioned, with a test that fails on an unknown or missing field. The receiver logic (writing files, compacting specs) moves from each repo into the toolkit as one library, writing one layout under a project-chosen root. For a project with no repo, the root is the project's folder in the toolkit (`projects/<label>/snapshot/`), which the toolkit's rules already allow for project data outside `skills/`.

**Contract (derived, plus a thin authored layer).** Each component's contract is the normalised spec (from the payload), its guidance (from the description), and, once code exists, the axis-to-code mapping that Project B already writes per component in `parity.mjs`. That file already holds what Primer's Code Connect holds: which Figma axis and value become which code prop, which states are pseudo-classes. It is the authored layer, and it exists. States and accessibility intent can live beside it when a project needs them.

**Outputs (modules, switched on by phase).**

| Output | Design only | Design and code | Maintenance |
|---|---|---|---|
| Docs site | Handoff spec: guidance, design images, properties, states, tokens per part, changed since last snapshot | Adds live stories and a parity status per component | Same, with parity as the headline health figure |
| Tracker | On: status, readiness, blocking findings, decisions, changes since review | Shrinks to what is not yet built | Off |
| Dashboard | On: audits, fixes, rulings | On | On |
| Figma documentation pages | Generated from the payload | Same | Same |
| Token build | One: payload to DTCG to CSS | Same | Same |
| Parity report | Off | On, persisted as data | On, as a gate |

The phase is one field in the project's context document, read by every output. Nothing else about the phase needs configuring, because each output already knows what it needs and shows nothing where the data is absent.

### What collapses

- **Six reporting readers become one.** The audits keep their live reads, because they fix what they find. The validator reads truncation and blend mode from the payload once the plugin sends them. The file diff, the doc generator's reads and the token export's reads come from the payload.
- **Four token generators become one path.** The payload's tokens convert to DTCG with the token export's existing, tested `dtcg.js`, and `frontend-build`'s `tokens-to-css.mjs` turns DTCG into CSS for every project. Project B's and the marketplace's `bin/tokens` retire once their output matches; the live `collect.js` retires with them.
- **Two component formats become one.** The validator reads the normalised spec instead of its own `components.json`.
- **Two description parsers become one module**, used by the plugin, the descriptions check and the docs site.
- **Two audit outputs become one.** The dated markdown reports become a rendering of `audit.json` at a run, not a second record.
- **The dashboard, the tracker and the docs site become one site shell** reading the same data, with the dashboard's live actions available when its local service is running (the plan already agreed for the dashboard).

### The order

Each step removes something and is useful on its own, so the program can stop after any of them.

1. **Schema the payload and extend the plugin** (descriptions, variable descriptions, page status, truncation, blend mode, default-variant image). Everything downstream depends on this, and it is the smallest change with the widest reach.
2. **Move the receiver into the toolkit** as one library writing one layout, with the project folder as the root for design-only projects. Project C and Project D gain an extraction; the per-repo receivers shrink to a call.
3. **Refit the docs site to the schema and add the phase switch**: guidance from descriptions, status from page markers, design images before code, stories after, health figures instead of inventory, and a "changed since last snapshot" list.
4. **Persist the parity report as data** and show it per component on the docs site.
5. **Build the tracker view** over page status, audit scores, open findings, rulings and fingerprints.
6. **Move the dashboard into the same site shell**, with its reporting reading the payload.
7. **Collapse the token generators and the reporting readers** one at a time, each retired only when its replacement produces identical output.

**What to do.** Start with step 1 and step 2; they are where the duplication comes from, and they are what makes a design-only project documentable at all. The architecture is supported by Spectrum, Atlassian and Primer's pipelines and by the drift failures of Carbon, Moonstone and Nuxt UI; the ordering and the phase matrix are this guide's judgment. One constraint governs all of it: the toolkit's own rule that machinery earns its place by catching something real. Every step above answers a duplication or gap found in the files on 18 September 2026, and any step that stops answering one should be dropped rather than built.

---

## 15. Cheat sheet

| Question | Answer |
|---|---|
| Where is the source of truth? | Figma authors; the committed snapshot is the record |
| How many readers of Figma? | One for reporting (the snapshot); live reads only for tools that fix |
| Token format on disk | DTCG, derived from the payload |
| Token path to code | Payload → DTCG → one CSS generator |
| Component contract | Normalised spec (from Figma) + description + axis-to-code mapping (`parity.mjs`) |
| One site or two? | One, linking to Storybook or source for the code reference |
| Component page order | Purpose and guidance, preview, properties, states, tokens per part, accessibility |
| Preview before code | Design image from the snapshot, labelled as design |
| Preview after code | Project Storybook, same origin, matched by folder |
| Token page lead | Semantic tokens, one column per mode, alias and value, search and copy |
| Status vocabulary | Three or four values, derived, never typed |
| Parity display | Per component, directional, last confirmed match, "not measured" where true |
| Overview figures | Health (unbuilt, drifting, failing), not inventory (variable counts) |
| Tracker | Design phase only: status, readiness, blockers, decisions, changes since review |
| Dashboard | Every phase: audits, fixes, rulings |
| What not to write | A hand-maintained status table, a second reader of Figma, a page section that only proves the data exists |

---

## 16. The short version

The systems that document well keep one record and generate everything else from it. For almost all of them the record lives in a repository and Figma is an output; for a Figma-first studio the same structure works with the roles reversed, as long as the extraction is committed and treated as the record rather than the live file. Spectrum, Atlassian and Primer show the pattern working; Carbon, Moonstone and Nuxt UI show what two editable sources cost.

On that record sits a component contract: the normalised spec Figma already gives, the guidance a structured description gives, and the mapping to code that a project writes once the code exists. Adobe's own design and code contracts disagree on Button's default variant, which is the argument for checking a contract against both sides rather than trusting either.

Documentation belongs on one site. Atlassian and Primer paid to merge two; Spectrum's split let its design side go stale and Polaris's merge into a developer portal let its guidance shrink to a footnote. The page itself should be short and fixed: purpose and guidance, a preview, properties, states, tokens per part, accessibility. GOV.UK's research is the only published evidence on documentation structure, and it asks for consistent, clear, useful and honest pages, which rules out padding them with generated data.

The site should change with the project. Before code, it is a handoff spec with a record of what changed since the last snapshot, answering the most common complaint in developer surveys. During design, a tracker derived from page markers, audit scores, open findings and rulings shows how far along the library is, without anyone maintaining a status table. Once code exists, a measured, per-component parity report replaces availability labels; the toolkit's parity loop already produces a better measurement than the one published example, and only needs to save it.

The toolkit has the hard parts (an identity contract for snapshots, a normalised spec, a real parity measurement, an audit record) and is held back by one missing piece: a schema for what a snapshot contains and a single, toolkit-owned place that receives it. With those two in place, six readers become one, four token generators become one, design-only projects become documentable, and the docs site, tracker and dashboard become views over the same data. That is the first thing to build.

---

## 17. What to re-check later

- **Code Connect validation, re-checked 1 October 2026** against the CLI 2.0.1 source: renamed properties and layers fail the publish; renamed variant values inside an enum mapping still pass. The mapping paragraph in section 3 was narrowed to say which.

- **Figma API limits.** The Variables REST API's Enterprise requirement, the November 2025 rate limits, the absence of `SLOT` in the REST types and the slot-only property descriptions were all checked in September 2026 and change often.
- **Storybook component manifests.** Default-on in 10.3.0, default-off in 10.3.5; the feature is in preview and supports React, Angular (Vite) and Vue 3 (Vite) only.
- **Spectrum's design data.** `specVersion` is `1.0.0-draft`; the component schema moved into `packages/design-data` recently and the old `component-schemas` path returns 404 for individual files. Its Figma export parity is still an open phase.
- **Carbon's DTCG migration.** ADR 0008 and the parity-gate proposal (#23255) were open work in 2026; whether a parity gate shipped is worth checking.
- **Primer's status labels.** Its source files and site disagree for several components; the mechanism behind the site's label was not verified.
- **Polaris guidance.** Where the former patterns and content guidance went after the move to shopify.dev was not found; an announcement may exist.
- **Evidence quality.** User research on documentation exists from GOV.UK only. The handoff figures come from one vendor survey (Telerik); the multi-place documentation figure from another vendor (zeroheight). Altitude is a single small system. Curtis's contract work is commentary with a real schema behind it, not a shipping system's documentation.
- **Toolkit facts.** The duplication counts in section 13 describe the repository on 18 September 2026 and will change as soon as step 1 of section 14 starts.

---

## Sources

### Primary: component pages and docs structure

- [Carbon, Button usage](https://carbondesignsystem.com/components/button/usage/)
- [Carbon, Button code](https://carbondesignsystem.com/components/button/code/)
- [Carbon, Button accessibility](https://carbondesignsystem.com/components/button/accessibility/)
- [Carbon, documentation contribution templates](https://carbondesignsystem.com/contributing/documentation/)
- [Carbon, component checklist](https://carbondesignsystem.com/contributing/component-checklist/)
- [Carbon website issue #2085, template migration](https://github.com/carbon-design-system/carbon-website/issues/2085)
- [Carbon community component index (deprecated)](https://carbondesignsystem.com/community/component-index/)
- [Carbon v9 component status matrix (Wayback)](https://web.archive.org/web/20240619012747/https://v9.carbondesignsystem.com/component-status/)
- [Primer, Button](https://primer.style/product/components/button/)
- [Primer, Button accessibility](https://primer.style/product/components/button/accessibility)
- [Primer, component status](https://primer.style/product/getting-started/component-status/)
- [Primer, documentation contribution guide](https://primer.style/design/guides/contribute/documentation)
- [Primer, adding new components](https://primer.style/product/contribute/adding-new-components/)
- [Primer, Figma](https://primer.style/product/getting-started/figma/)
- [Primer React, Button.docs.json](https://github.com/primer/react/blob/main/packages/react/src/Button/Button.docs.json)
- [Primer React, Button.figma.tsx (Code Connect)](https://github.com/primer/react/blob/main/packages/react/src/Button/Button.figma.tsx)
- [Primer design PR #366, React docs on the design site](https://github.com/primer/design/pull/366)
- [Primer design PR #462, Rails docs](https://github.com/primer/design/pull/462)
- [Primer design PR #706, React docs migration](https://github.com/primer/design/pull/706)
- [Primer design PR #710, props tables](https://github.com/primer/design/pull/710)
- [Primer React PR #4822, remove docs sub-site](https://github.com/primer/react/pull/4822)
- [Primer, archived component lifecycle guide](https://github.com/primer/design/blob/main/content/guides/component-lifecycle.mdx)
- [Atlassian, Button examples](https://atlassian.design/components/button/examples)
- [Atlassian, Button usage](https://atlassian.design/components/button/usage)
- [Atlassian, release phases](https://atlassian.design/release-phases)
- [Atlassian, new home announcement (2020)](https://community.developer.atlassian.com/t/our-new-home-for-atlassian-design-system/40698)
- [GOV.UK Design System, Button](https://design-system.service.gov.uk/components/button/)
- [GOV.UK, design system content pattern](https://github.com/alphagov/govuk-design-system-backlog/blob/master/docs/DESIGN_SYSTEM_CONTENT_PATTERN.md)
- [GOV.UK, contribution criteria](https://design-system.service.gov.uk/community/contribution-criteria/)
- [GOV.UK lifecycle status issue #5426](https://github.com/alphagov/govuk-design-system/issues/5426)
- [GOV.UK lifecycle status issue #5477](https://github.com/alphagov/govuk-design-system/issues/5477)
- [Material 3, Buttons specs](https://m3.material.io/components/buttons/specs)
- [Material 3, Buttons overview](https://m3.material.io/components/buttons/overview)
- [Material 3, develop for web](https://m3.material.io/develop/web)
- [Material 3, develop for Flutter](https://m3.material.io/develop/flutter)
- [Material Web, maintenance mode discussion #5642](https://github.com/material-components/material-web/discussions/5642)
- [Material Web, button docs](https://github.com/material-components/material-web/blob/main/docs/components/button.md)
- [Material Web, roadmap](https://github.com/material-components/material-web/blob/main/docs/roadmap.md)
- [Material 3 Figma design kit announcement](https://m3.material.io/blog/material-3-figma-design-kit)
- [Spectrum, Button](https://spectrum.adobe.com/page/button/)
- [React Spectrum v3, Button](https://react-spectrum.adobe.com/v3/Button.html)
- [React Spectrum S2, Button](https://react-spectrum.adobe.com/Button)
- [React Spectrum v1.0 release notes](https://react-spectrum.adobe.com/releases/v1-0-0.md)
- [Fluent 2, React Button usage](https://fluent2.microsoft.design/components/web/react/core/button/usage)
- [Fluent 2, iOS Button usage](https://fluent2.microsoft.design/components/ios/core/button/usage)
- [Fluent UI React Storybook, Button docs](https://react.fluentui.dev/iframe.html?viewMode=docs&id=components-button-button--docs)
- [Ant Design, Button](https://ant.design/components/button)
- [Ant Design, Button source markdown](https://github.com/ant-design/ant-design/blob/master/components/button/index.en-US.md)
- [Ant Design, button spec](https://ant.design/docs/spec/buttons)
- [Ant Design, MCP](https://ant.design/docs/react/mcp/)
- [TDesign, React Button](https://tdesign.tencent.com/react/components/button)
- [Wikimedia Codex, Button](https://doc.wikimedia.org/codex/latest/components/demos/button.html)
- [Wikimedia Codex, component demos contributing guide](https://doc.wikimedia.org/codex/latest/contributing/component-demos.html)
- [Twilio Paste, Button pages source](https://github.com/twilio-labs/paste/tree/main/packages/paste-website/src/pages/components/button)
- [Twilio Paste PR #4399, retire docs site](https://github.com/twilio-labs/paste/pull/4399)
- [Shopify Polaris web components, Button](https://shopify.dev/docs/api/app-home/latest/web-components/actions/button)
- [Shopify, Polaris web components stable (changelog)](https://shopify.dev/changelog/polaris-unified-web-components-are-now-stable)
- [Shopify partners blog, Polaris goes stable](https://www.shopify.com/partners/blog/polaris-goes-stable-the-future-of-shopify-app-development-is-here)
- [Polaris React archive](https://github.com/Shopify/polaris-react-archive)
- [Shopify, app design guidelines](https://shopify.dev/docs/apps/design)
- [Salesforce SLDS 2, Button](https://www.lightningdesignsystem.com/2e1ef8501/p/7733f8-button/b/09e06c)
- [Radix, Tabs](https://www.radix-ui.com/primitives/docs/components/tabs)
- [Radix website, Tabs source](https://github.com/radix-ui/website/blob/main/data/primitives/docs/components/tabs.mdx)
- [shadcn/ui, Button](https://ui.shadcn.com/docs/components/button)
- [Altitude docs overview](https://altitude.pages.dev/docs/)
- [Altitude, Button](https://altitude.pages.dev/docs/components/button)

### Primary: tokens and docs tooling

- [Atlassian, all tokens](https://atlassian.design/components/tokens/all-tokens)
- [Atlassian, colour foundations](https://atlassian.design/foundations/color)
- [Primer, colour primitives](https://primer.style/product/primitives/color/)
- [Primer, typography primitives](https://primer.style/product/primitives/typography/)
- [Primer, size primitives](https://primer.style/product/primitives/size/)
- [Primer primitives, build system](https://github.com/primer/primitives/blob/main/contributor-docs/agents/build-system.md)
- [Primer old site, colour page source](https://github.com/primer/design/blob/main/content/foundations/primitives/color.mdx)
- [Primer doctocat, global search](https://github.com/primer/doctocat-nextjs/blob/main/packages/theme/components/layout/global-search/GlobalSearch.tsx)
- [Primer design PR #934, new docs experience](https://github.com/primer/design/pull/934)
- [Carbon website, ColorTokenTable](https://github.com/carbon-design-system/carbon-website/blob/main/src/components/ColorTokenTable/ColorTokenTable.js)
- [Carbon website, colour tokens page](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/elements/color/tokens.mdx)
- [Carbon website, spacing page](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/elements/spacing/overview.mdx)
- [Carbon website PR #4719, border token drift](https://github.com/carbon-design-system/carbon-website/pull/4719)
- [Carbon PR #23382, ADR 0008 adopt DTCG](https://github.com/carbon-design-system/carbon/pull/23382)
- [Carbon issue #23000, source of truth epic](https://github.com/carbon-design-system/carbon/issues/23000)
- [Carbon issue #23252, Figma-only tokens audit](https://github.com/carbon-design-system/carbon/issues/23252)
- [Carbon issue #23253, silent Figma drift](https://github.com/carbon-design-system/carbon/issues/23253)
- [Carbon issue #23255, parity gate proposal](https://github.com/carbon-design-system/carbon/issues/23255)
- [Carbon issue #20479, preview naming](https://github.com/carbon-design-system/carbon/issues/20479)
- [GOV.UK, colour](https://design-system.service.gov.uk/styles/colour/)
- [GOV.UK, spacing page source](https://github.com/alphagov/govuk-design-system/blob/main/src/styles/spacing/index.md)
- [GOV.UK PR #5002, remove colour generator](https://github.com/alphagov/govuk-design-system/pull/5002)
- [GOV.UK issue #4997, manual colours](https://github.com/alphagov/govuk-design-system/issues/4997)
- [Wikimedia Codex, colour tokens](https://doc.wikimedia.org/codex/latest/design-tokens/color.html)
- [Wikimedia Codex, colour page source](https://github.com/wikimedia/design-codex/blob/main/packages/codex-docs/docs/design-tokens/color.md)
- [Wikimedia Codex, token demo components](https://github.com/wikimedia/design-codex/tree/main/packages/codex-docs/src/components/tokens)
- [Wikimedia Codex, VitePress config](https://github.com/wikimedia/design-codex/blob/main/packages/codex-docs/docs/.vitepress/config.ts)
- [Fluent 2, colour tokens](https://fluent2.microsoft.design/color-tokens)
- [Twilio Paste, tokens list source](https://github.com/twilio-labs/paste/tree/main/packages/paste-website/src/components/tokens-list)
- [Twilio Paste, Airtable integration](https://github.com/twilio-labs/paste/blob/main/internal-docs/engineering/doc-site/airtable-integration.md)
- [Twilio Paste, docs search](https://github.com/twilio-labs/paste/blob/main/internal-docs/engineering/doc-site/docsearch.md)
- [Polaris archive, TokenList](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/src/components/TokenList/TokenList.tsx)
- [Polaris archive, colour tokens page](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/tokens/color.mdx)
- [Shopify community, Polaris token reference thread](https://community.shopify.dev/t/polaris-design-token-reference-anywhere/37635)
- [Ant Design, TokenTable](https://github.com/ant-design/ant-design/blob/master/.dumi/theme/builtins/TokenTable/index.tsx)
- [Ant Design, generate-token-meta](https://github.com/ant-design/ant-design/blob/master/scripts/generate-token-meta.ts)
- [Spectrum S2 tokens viewer](https://github.com/adobe/spectrum-design-data/blob/main/docs/s2-tokens-viewer/index.html)

### Primary: single source, contracts and platform

- [Spectrum design data repository](https://github.com/adobe/spectrum-design-data)
- [Spectrum design data, component files](https://github.com/adobe/spectrum-design-data/tree/main/packages/design-data/components)
- [Spectrum design data, component schemas package](https://github.com/adobe/spectrum-design-data/tree/main/packages/component-schemas)
- [Spectrum design data, component format spec](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data-spec/spec/component-format.md)
- [Spectrum design data, Token Studio sunset](https://github.com/adobe/spectrum-design-data/blob/main/docs/token-studio-sunset.md)
- [Spectrum design data, RFC discussion #625](https://github.com/adobe/spectrum-design-data/discussions/625)
- [Spectrum design data, multiplatform SDK strategy](https://github.com/adobe/spectrum-design-data/blob/main/SPECTRUM_MULTIPLATFORM_SDK_STRATEGY.md)
- [React Spectrum S2, Button.tsx](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/Button.tsx)
- [Material foundation, material-tokens (archived)](https://github.com/material-foundation/material-tokens)
- [Material foundation, material-color-utilities](https://github.com/material-foundation/material-color-utilities)
- [Salesforce Theo (archived)](https://github.com/salesforce-ux/theo)
- [Salesforce design system, Button _doc.scss](https://github.com/salesforce-ux/design-system/blob/master/ui/components/buttons/_doc.scss)
- [Salesforce LWC, base components accessibility](https://developer.salesforce.com/docs/platform/lwc/guide/base-components-accessibility.html)
- [Atlassian frontend mirror](https://bitbucket.org/atlassian/atlassian-frontend-mirror)
- [Shopify Polaris monorepo (archived)](https://github.com/Shopify/polaris)
- [Microsoft fluentui-token-pipeline (archived)](https://github.com/microsoft/fluentui-token-pipeline)
- [W3C DTCG, Format 2025.10](https://www.designtokens.org/tr/2025.10/format/)
- [W3C DTCG issue #220, handoff contract](https://github.com/design-tokens/community-group/issues/220)
- [Open UI, site sources and schemas](https://github.com/openui/open-ui/tree/main/site/src)
- [Open UI, component schema](https://github.com/openui/open-ui/blob/main/site/src/schemas/component.schema.json)
- [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest)
- [Shoelace](https://github.com/shoelace-style/shoelace)
- [Storybook, AI manifests](https://storybook.js.org/docs/ai/manifests)
- [Storybook, MCP overview](https://storybook.js.org/docs/ai/mcp/overview)
- [Storybook changelog](https://github.com/storybookjs/storybook/blob/next/CHANGELOG.md)
- [shadcn/ui, registry item schema](https://ui.shadcn.com/schema/registry-item.json)
- [Directed Edges, specs schema](https://github.com/DirectedEdges/specs)
- [Figma, Variables REST API](https://developers.figma.com/docs/rest-api/variables/)
- [Figma, REST rate limits](https://developers.figma.com/docs/rest-api/rate-limits/)
- [Figma, Code Connect developer docs](https://developers.figma.com/docs/code-connect/)
- [Figma, componentPropertyDefinitions](https://developers.figma.com/docs/plugins/api/properties/ComponentPropertiesMixin-componentpropertydefinitions/)
- [Figma, Code Connect help](https://help.figma.com/hc/en-us/articles/23920389749655-Code-Connect)
- [Figma, measurements and annotations](https://help.figma.com/hc/en-us/articles/20774752502935-Add-measurements-and-annotate-designs-in-Dev-Mode)
- [Figma, Dev Mode statuses](https://help.figma.com/hc/en-us/articles/26781702258583-Dev-Mode-statuses-and-notifications)
- [Figma, Check designs](https://help.figma.com/hc/en-us/articles/39592284074263-Check-designs-in-Figma)
- [Figma, component descriptions](https://help.figma.com/hc/en-us/articles/7938814091287-Add-descriptions-to-styles-components-and-variables)
- [Figma, document and manage a system (lesson)](https://help.figma.com/hc/en-us/articles/14552804059927-Lesson-4-Document-and-manage-your-system)
- [Figma blog, introducing Dev Mode](https://figma.com/blog/introducing-dev-mode/)
- [Figma blog, Dev Mode GA](https://www.figma.com/blog/dev-mode-ga/)
- [Figma blog, introducing Code Connect](https://www.figma.com/blog/introducing-code-connect/)
- [Figma blog, Config 2024 recap](https://www.figma.com/blog/config-2024-recap/)
- [Figma blog, MCP server](https://www.figma.com/blog/introducing-figma-mcp-server/)
- [Figma blog, design context everywhere](https://www.figma.com/blog/design-context-everywhere-you-build/)
- [Figma code-connect issue #158](https://github.com/figma/code-connect/issues/158)
- [Figma code-connect issue #291](https://github.com/figma/code-connect/issues/291)
- [Figma code-connect issue #383](https://github.com/figma/code-connect/issues/383)
- [Chromatic, Figma plugin](https://www.chromatic.com/docs/figma-plugin/)
- [W3C WAI-ARIA APG, Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [W3C WAI-ARIA APG, read me first](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)
- [Jahia Moonstone issue #1480](https://github.com/Jahia/moonstone/issues/1480)
- [Jahia Moonstone issue #1481](https://github.com/Jahia/moonstone/issues/1481)
- [Nuxt UI issue #6285](https://github.com/nuxt/ui/issues/6285)
- [brik-bds issue #1552, stale status manifest](https://github.com/brikdesigns/brik-bds/issues/1552)
- [figma-drift](https://github.com/effinrich/figma-drift)

### Primary: user research

- [GOV.UK, how we document components and patterns (2018)](https://designnotes.blog.gov.uk/2018/11/05/how-we-document-components-and-patterns-in-the-gov-uk-design-system/)
- [GOV.UK, help us shape the design system (2022)](https://designnotes.blog.gov.uk/2022/02/23/help-us-shape-the-gov-uk-design-system/)
- [GOV.UK, introducing the design system (2018)](https://gds.blog.gov.uk/2018/06/22/introducing-the-gov-uk-design-system/)

### Commentary

- [Nathan Curtis, Component Contracts and Schemas (2026)](https://nathanacurtis.substack.com/p/component-contracts-and-schemas)
- [Nathan Curtis, Analysis of Variants (2025)](https://nathanacurtis.substack.com/p/analysis-of-variants-9e440c30b93e)
- [Nathan Curtis, Components as Data (2025)](https://nathanacurtis.substack.com/p/components-as-data-2be178777f21)
- [Nathan Curtis, Component Specifications (2023)](https://nathanacurtis.substack.com/p/component-specifications-1492ca4c94c)
- [Nathan Curtis, Documenting Components (2018, Wayback)](https://web.archive.org/web/2024/https://medium.com/eightshapes-llc/documenting-components-9fe59b80c015)
- [Brad Frost, The design system ecosystem (2023)](https://bradfrost.com/blog/post/the-design-system-ecosystem/)
- [Rachel Cantor, Your agent is reading a different design system (2026)](https://rachel.fyi/posts/your-agent-is-reading-a-different-design-system)
- [Adobe Design, designing design systems for implementation](https://adobe.design/stories/design-for-scale/designing-design-systems-supporting-implementation-and-adoption)
- [Figma blog, Design systems 103: documentation (vendor)](https://www.figma.com/blog/design-systems-103-documentation-that-drives-adoption/)
- [zeroheight, Design Systems Report 2025 (vendor)](https://othr.zeroheight.com/hubfs/zeroheight%20-%20Design%20System%20Report%202025%20-%20release%20version.pdf)
- [Progress Telerik, State of Designer-Developer Collaboration 2024 (vendor)](https://www.telerik.com/docs/default-source/whitepapers/state-of-designer-developer-collaboration-2024_telerik.pdf)

### Cited but not resolved to a URL

- Material's design system database (DSDB): known only from paths in the m3.material.io JavaScript bundle; no public description found.
- Carbon's Code Connect blog post (September 2024): known from a search snippet; the page was blocked.
- EightShapes Specs Figma plugin article: the Directed Edges repository was used instead.
