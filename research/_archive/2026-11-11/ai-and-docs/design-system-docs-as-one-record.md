# One record, many outputs: documenting a Figma-first design system

A design system that is designed in Figma can still have one source of record, as long as the record is a committed extraction of the file rather than the live file itself. Every output that reports (the docs site, the token build, a tracker, a dashboard, an agent's reference) then reads that one extraction, status and parity are derived from it rather than typed, and the only reads that stay live are the ones that write back. The systems that document well already work this way with the roles reversed; the ones that do not have as many silent disagreements as they have readers.

Part 3 of 9 in *The agent-ready design system*. Previous: [Part 2, What a design system's library should carry for an agent](what-the-library-carries-for-an-agent.md) Next: [Part 4, How a design system reaches the agent](how-the-system-reaches-the-agent.md)

---

## What this answers

- Can Figma be the source of truth if the record has to live in git?
- What does "extract once, publish many ways" look like, and what breaks without it?
- What is a component contract, and why can it not come from one side alone?
- Why should status and parity be measured rather than maintained?
- What should the documentation be before code exists, and after?
- How does the record stay current, and what must be written by hand?
- What happened when one toolkit built this?

Section 8 is the cheat sheet and section 9 the short version.

---

## 1. Can Figma be the source of truth if the record has to live in git?

Figma can be where the design is decided while a committed, versioned extraction of it is what every other tool reads. Almost no mature system treats a live Figma file as the record, and the reasons are mechanical, not cultural.

"Source of truth" hides two things. The **authoring surface** is where a person makes the decision. The **source of record** is what other systems read, diff, version and validate against. In a small team they feel like one thing until a second tool needs to read the design, because that tool has to read *something*, at *some moment*, in *some shape*.

The mature systems put the record in a repository and write Figma as an output. Spectrum keeps a canonical dataset in `packages/design-data/` (tokens, 97 component files, mode sets, guidelines) and exports it to Figma Variables. Atlassian generates `@atlaskit/tokens` from TypeScript schemas and ships a Figma artefact beside the CSS. Primer builds CSS, docs, a Figma format and LLM guidance from DTCG JSON. Carbon made it formal in a 2026 architecture decision record: DTCG JSON is the only hand-edited source.

Their reasons are about what Figma cannot do. Spectrum's authoring RFC gives Figma a view-only role for most contributors because it cannot enforce a schema, a taxonomy or validation. The platform limits are concrete: the Variables REST API needs a Full seat in an Enterprise organisation; View and Collab seats are limited to about 20 file reads a month under the November 2025 rate limits; property descriptions exist in the Plugin API only for `SLOT` properties, and the REST API's property types still lack `SLOT`. Spectrum also shows the way out: it keeps a Figma plugin as the *editing* interface for component option schemas, validated with Ajv, while the data lives in the repository. A Figma-first team reaches the same arrangement from the other side: design in Figma, extract with a plugin, and **commit the extraction**. The committed file is versioned, diffable, reviewable, readable offline and identical for every consumer, which a live file is not.

Systems that did not separate the roles show the cost. Carbon's epic #23000 describes its DTCG source and Figma variables as disconnected; the audit that followed (#23252) found tokens in Figma missing from code, 106 of them in Tag alone, and #23253 states the symptom: every token change leaves Figma silently out of sync. Jahia's Moonstone (#1480) shipped a warning colour of `#E8B606` in Figma and `#FFBB00` in code. Nuxt UI (#6285) had its Figma kit on `bg-muted` where code used `bg-elevated`, visible only in light mode. Nobody chose drift; each had two editable places and nothing that made one the record.

Three traps. **Declaring a source without an extraction**: Carbon declared code the source and still found 106 Figma-only tokens. **Treating the live file as the record**: two consumers reading "the same" file at different moments, through different APIs with different access, can disagree without either being wrong. **Letting the neutral format be a vendor's**: Material's Design System Package format, Salesforce's Theo and Fluent's token pipeline are all archived; DTCG (stable since 28 October 2025) is the survivor for tokens.

**What to do.** Write "Figma is the source of truth" down as "Figma is where it is decided; the snapshot is what it is". The arrangement holds only if the extraction runs often and is trusted, or the committed copy becomes the stale one.

---

## 2. What does extract once, publish many look like, and what breaks without it?

One extractor writes a payload, a schema says what the payload holds and a test fails when it does not, and every reporting output reads the payload rather than the source. A question like "what is Button's default size" then has one answer everywhere, wrong in one place and fixed in one place.

Spectrum is the fullest public example: one dataset feeds token viewers, the docs site's options tables, `@adobe/spectrum-component-schemas`, an MCP server, a Rust CLI with `resolve --format dtcg`, and the Figma export. Atlassian's changelog shows the pattern arriving and then being defended: 0.0.4 built three outputs with Style Dictionary, 0.13.3 added a `tokens-raw` entrypoint for the Figma plugin, and 0.13.5 is in effect "correct Figma entrypoints to use raw JSON", a second path removed after it had crept in. On the code side Shoelace feeds its docs and its VS Code, JetBrains and Vue integrations from one Custom Elements Manifest.

The opposite is best described by someone who measured it. Rachel Cantor's 2026 write-up of an agent working against a design system (commentary, with a worked case) found the Storybook component manifest to be a lossy copy: `@deprecated` tags never reached the agent, a wrong docgen extractor left descriptions blank, and the agent duplicated components because the guidance sat in a Docs tab it never read. Nothing flagged anything. Every reader was internally consistent; they read different things.

Two honest limits. Neutral payload formats die young (Theo, the Design System Package format, Fluent's pipeline, Open UI's component dataset, whose Atlassian entry was last updated in 2019), so a team that builds its own should expect to own the schema for as long as it uses it, and keep tokens in DTCG. And not every read can move to the payload: a tool that *fixes* a Figma file (renames a layer, rebinds a variable) must read the live file, because it writes back to it. The rule that survives real tooling is narrower: **reads that report go through the payload; reads that edit stay live.**

**What to do.** One extractor, a versioned schema with a test, every reporting consumer routed through it, and the extraction cheap enough to run on every meaningful change. A plugin run measured in seconds meets that; a manual export ritual does not.

---

## 3. What is a component contract, and why can it not come from one side alone?

A component contract states what a component is (props and allowed values, defaults, parts, states, the token each part uses, and a role per part) in words no platform owns. It is derived from Figma for what Figma knows, translated to code through a mapping a person writes, and diffed against the code's own derived contract, because a contract taken from one side only is, in Nathan Curtis's phrase, "testimony, not a contract".

Curtis's 2025 "Analysis of Variants" (commentary with a shipping schema behind it) asks for a spec that is **deterministic** (regenerate with nothing changed and the diff is empty) and **normalised** (the default stated once, each variant only as its difference), and counts more than 14,400 redundant properties in Figma's raw data for a typical component. His schema ships as `@directededges/specs-schema` (0.39.0 as of November 2026). Spectrum's `component-format.md` adds what a Figma-derived shape lacks: `states` with a `trigger` of `prop` or `interaction`, `tokenBindings`, `lifecycle` and `accessibility`, justified by a failure it could not previously catch (a token naming a variant that did not exist). Code has contracts of its own, generated: the Custom Elements Manifest (attributes, events, slots, CSS parts and properties) and Storybook's component manifest (made default-on in 10.3.0, turned back off in 10.3.5, still preview). Neither knows variant axes, tokens per part or states.

Between the two sides sits a **mapping**, and most real disagreement lives there. Primer's `Button.figma.tsx` (Code Connect) maps the Figma value `secondary` to code `default` and splits the Figma `state` enum into the booleans `disabled` and `inactive`. Code Connect's issues (#158, #291, #383) show what a rename does: in CLI 2.0.1, a renamed property or layer failed the publish but a renamed variant value inside an enum mapping passed, so the mapping broke silently. Adobe's own two contracts for one component, on 18 September 2026:

| Field | Spectrum `button.json` (design contract) | React Spectrum S2 `Button.tsx` (code) |
|---|---|---|
| Fill property name | `style` | `fillStyle` |
| Size values | `s`, `m`, `l`, `xl` | `'S' \| 'M' \| 'L' \| 'XL'` |
| Default variant | `accent` | `primary` |
| Extra variants | none | `premium`, `genai` |

Adobe authored both. A docs page built from either would be internally consistent and wrong about the other, which is the argument for diffing a contract against both sides rather than trusting either.

**What the toolkit settled.** The toolkit's knowledge base now owns which layers a contract holds and how far each can be checked: the API, the structure, tokens per part per variant, layout intent and states (with the token changes they cause) diff exactly; from behaviour and accessibility it takes only a role per part, read from a Dev Mode annotation, and the prop that supplies the accessible name; usage guidance stays on the docs page and resolved geometry with the snapshot and parity. While the design is drawn first, the stored contract is derived from the snapshot, and an API change is a reviewed proposal made in both design and code and derived again, never a sync in either direction; a project can instead make the contract the official source of a library's API, keyed by the Figma component key so a rename keeps its contract ([component contract, in the toolkit's knowledge base](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/figma-handoff.md#what-a-component-contract-covers)). The reason to key by component rather than name is Figma's own variables sync example, which matches "by name" and deletes nothing, so a renamed token leaves its old variable behind.

**What to do.** Treat the Figma-derived spec as the first half of the contract, normalised and deterministic; add a thin authored layer for the mapping to code and a role per part; and check the result against the code's own contract.

---

## 4. Why should status and parity be measured rather than maintained?

Every status a docs site or tracker shows should be computed from something that already exists (a page marker the designer sets, an audit score, an open finding, a snapshot fingerprint), in a vocabulary of three or four values. Parity should be shown per component from a persisted measurement, directional, with the date of the last confirmed match and "not measured" where nothing was checked.

Status vocabularies are shrinking. Primer went from six lifecycle statuses (Experimental, Alpha, Beta, Stable, Deprecated, Removed) to three (Experimental, Ready, Deprecated). Carbon is renaming `experimental` and `unstable` to `preview`. GOV.UK was still choosing its lifecycle names in August 2026 (#5426, #5477). Figma's own vocabulary is three: Ready for dev, Completed, and an automatic Changed when a ready design is edited. A long list reads as precision and is maintained as guesswork; Primer's own source files and site disagree on several components' status. Hand-maintained status fails quietly: one system's committed manifest reported 0.131.1 while its package was at 0.138.0, because nothing failed when it was out of date (brik-bds #1552).

Parity is mostly not published. Primer shows `React | ready`, `Rails | ready` and a link to Figma with no status; Material 3 has Available and Unavailable; Carbon's v9 cross-framework matrix is gone. Availability is published, agreement is not. The one system found that publishes agreement is Altitude, built by the team behind a Figma console tool: per component, `IN SYNC`, `FIGMA AHEAD`, `CODE AHEAD`, `BOTH CHANGED`, `NOT IN FIGMA` or `NOT TRACKED`, generated at build time ("41 of 41 mapped Figma sets observed, last read 2026-09-08"), with property and token differences listed and "NOT RECORDED" printed where an accessibility pass was not run. Its weaknesses teach as much: the code side is a hash of the source, so a comment edit counts as a change and nothing says what changed; `BOTH CHANGED` is its second-largest bucket (14 of 41), which may measure the sync ritual more than divergence; and status is per component, not per variant. A rendered, per-variant comparison against the design has none of those weaknesses.

**What to do.** Derive every status; keep the vocabulary to three or four values; show parity per component from a saved measurement, with its differences behind a disclosure, its last confirmed match, and "not measured" in words. The toolkit's knowledge base holds the display rules: status as a word in a badge, derived by the generator, and a provenance caption on every generated page ([change logs, status and versioning](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/profiles/documentation.md#change-logs-status-and-versioning); [provenance and freshness](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/profiles/documentation.md#provenance-and-freshness-on-generated-pages)).

---

## 5. What should the documentation be before code exists, and after?

Before code exists, the docs site is a handoff specification: guidance, a design image, properties with intended code names, states, tokens per part, and what changed since the last snapshot. Once code exists it adds live previews and per-component parity. One field in the project's settings switches it, and each output shows nothing where its data is absent.

Carbon's component checklist is the most explicit published version of the pre-code spec: colour and type tokens, structure and measurements for every size and content configuration, interaction states (hover, focus, selected, disabled, read-only, error, warning), behaviours (responsiveness, overflow and reflow, expansion, scrolling) and accessibility (4.5:1 text, 3:1 non-text, focus flow). Curtis's "Component Specifications" (2023, commentary) adds non-visual and code-only properties, touch targets, motion and component tokens, and argues that Figma's Inspect panel is not enough because components omit behaviour, code-only properties and accessibility. The one user-facing data point is a vendor survey (Progress Telerik 2024, 222 respondents, 82 percent engineering): asked why handoff disappointed them, 65 percent said designs keep changing afterwards and are hard to track, and 50 percent said they have to ask many questions. The first is the argument for a change record in the handoff; a snapshot diff supplies it for nothing.

Figma covers part of this itself (Dev Mode annotations in Development, Interaction, Accessibility and Content categories since January 2024; Ready for dev and the automatic Changed status), but not the assembled view: one page per component with states, tokens per part and intended code names together.

Before code, previews are images of the design, exported by the same extraction and labelled as design; after, they are live stories from the project's own Storybook, served from the docs site's own origin so a frame can size itself and follow the theme, and matched to the component by folder rather than by a story title that breaks when retitled. A preview from code and one from Figma answer different questions; once both exist, the gap between them is section 4's parity.

**What to do.** Make the phase one stated field, and let it switch the outputs: a handoff spec with a change list before code, live previews and parity after, a tracker (status, readiness, blocking findings, decisions, changes since review) while the library is being built, and a maintenance dashboard in every phase whose reporting reads the record and whose fixes write live.

---

## 6. How does the record stay current, and what must be written by hand?

Regenerate only what is derivable, through a reviewed change, keep hand-written conventions out of the automated path, and put the reference's own age on the page, because a stale reference still answers confidently. The one fact no generator can infer is which layer a brand switches, and that has to be written down.

The consensus pattern is regeneration from the source. Figma's webhooks fire on `FILE_UPDATE` (after 30 minutes of editing inactivity), `FILE_VERSION_UPDATE`, `FILE_DELETE`, `FILE_COMMENT`, `DEV_MODE_STATUS_UPDATE` and `LIBRARY_PUBLISH`. The `LIBRARY_PUBLISH` payload carries created, modified and deleted arrays for components, styles and variables, so a listener knows what changed without re-diffing.

The Variables REST API supports two-way sync through GitHub Actions; the write-back direction needs Enterprise membership, an editor seat and a write-scoped token. Astryx's CLI carries the consumer-side counterpart, a codemod runner for migrating between versions.

A stale or incomplete record does not fail loudly. Agents given an incomplete specification compensate silently by reading component implementations to recover missing guidance, which costs tokens and produces conclusions nobody reviewed.

Token-level parity is close to solved. Automatic component-API sync is not, and no vendor claims it, so a loop that promises it is a loop that will break. The toolkit's narrower answer (a release-pinned snapshot committed to git, a per-variant rendered comparison against it, and API changes made as reviewed proposals to a contract) is section 3's.

**The one fact no generator infers: which layer a brand switches.** Components consume semantic tokens, a rebrand edits primitives, and a brand switch remaps the semantic aliases or swaps a mode. A generator reading a library can list collections, modes and values; it cannot tell whether a mode is a brand, a theme or a platform, or which layer a rebrand should edit. So it is written down, with the brand-by-theme grid as a table and the mechanism chosen:

| Mechanism | How it works | Constraint |
|---|---|---|
| Figma Extended Collections | A core collection is published and extended per brand, inheriting with overrides | Enterprise plan only (as of November 2026) |
| Multi-collection modes | Brands as modes within collections | Mode ceilings; related modes across collections cannot be linked |
| Theme packages | Each brand a separate published package | Brand assets fenced at the package boundary |

DTCG handles theming without duplicating files through group inheritance; 2025.10 is still its only stable release.

**What to do.** Keep the canonical artefacts in version control, regenerate only the derivable sections through a human-reviewed change, and add a staleness check (snapshot age against the file's last edit) so a loop that stops running is seen. **Write down which layer the brands switch at, because nothing else in the pipeline records it.** Regeneration from the source is consensus; the staleness check and the written brand layer are this series' judgment.

---

## 7. What happened when one toolkit built it?

On 18 September 2026 the design-system toolkit had good parts that did not form a system: at least six code paths reading component trees from Figma and five reading variables, four routes from tokens to CSS, two component formats, two description parsers, a receiver per repository, and no schema for what a snapshot contained. An assessment that day named the missing schema and the per-repository receivers as the root problem. By November both were fixed and most of the outputs above existed.

What was built, as of 2 November 2026:

- **A payload schema.** `tools/snapshot/payload.cjs` (schema version 1) is "the one statement of the shape, checked by the same code wherever a payload or a stored file is read". It checks what consumers rely on and nothing more: an extra key is never an error, so a plugin may send ahead of a store that reads it. Its header records the cost of that tolerance: five convenience keys rode on it until plugin 0.32.0 removed them, long after the receivers they served were gone.
- **One writer.** snapshot-standard rule 5: `store.cjs` writes every project's snapshot and `deliver.cjs` is the only thing that calls it, for a repository and a design-only project alike; a project's own steps run after the store. The evidence it cites: two repositories each had a receiver and the toolkit a third writer, and they wrote token files of two shapes, screens in three layouts and icons two ways, each carrying fixes the others lacked. A router routes each payload to the project that owns the file, so a design-only project now has an extraction under its own folder.
- **A docs site switched by phase.** `design` shows the handoff spec (guidance from each component's description, the default-variant design preview the plugin exports, properties and states from the component's contract, tokens per layer, status from the page marker read through the project's legend, what changed in the last snapshot); `build` and `maintenance` add live previews from the project's Storybook and whether each component is in code ([docs site README](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/README.md)).
- **Guidance from descriptions.** One parser, `guidance.cjs`, reads each Figma description into purpose, Usage, Don't, Behaviour, Composition and Code gen notes; a Don't naming another component links to it.
- **Parity as pages.** The tracker's Parity section lists which components are in code (a folder holding a file of the component's name, or the name the project says it is built as) and, for a component library built elsewhere, a *Visual* page reading a report from `tools/parity/external.mjs` that renders the library in its own Storybook and measures it against the design's contracts.
- **An agent's reference from the same record.** The site writes a JSON API beside its pages and `tools/system-mcp` (named `docs-mcp` until 4 November 2026) serves it (see [Part 4, section 4](how-the-system-reaches-the-agent.md#4-which-design-systems-ship-a-server-skills-or-an-llmstxt-and-what-do-they-serve)).

Two things the September assessment proposed did not happen as proposed. The "propose a change" path became its own tool, a contract editor the docs site links to, instead of a field on the page. And visual Do and Don't examples (one frame per guidance bullet, drawn from real instances) were parked on 19 September and remain so.

**What the page says is the knowledge base's.** The page-content findings of that assessment are now rules in the toolkit's [documentation profile](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/profiles/documentation.md): one site for design and code guidance (Atlassian and Primer both paid to merge two; Spectrum's split let its design side go stale; Polaris's move into a developer portal shrank its guidance to a footnote); a fixed component-page skeleton in which "when not to use" names the alternative and an empty section says "Not applicable" or "No guidance yet"; health figures, never inventory figures, as headlines; every generated table held to the test "does it help someone choose, build or check this component?" (Primer's PR #710 called its mixed props tables a "matrix of sadness"); semantic token tables with one column per mode and primitives as ramps; contrast only for defined pairs (Paste's "accessible pairing" popover is the one shipping example). Three findings from that work are not in the knowledge base and are worth keeping here: TDesign's **similar components** section, the most compact guidance element found, which is the reason every Don't should name an alternative; Carbon's hand-maintained 120 KB `color-tokens.js`, fixed pull request by pull request ("match what we have in code", #4719), against Atlassian's generated token page, which reproduces a typo from its source ("Use for for backgrounds") word for word; and GOV.UK's removal of its colour generator during a colour rework (#5002), which shows the risk is a generator tied to a format being redesigned, not generation.

**What to do.** If a toolkit or team is in the September position, start where this one did: schema the payload and make one writer, because nearly every duplication follows from not having them, and they are what makes a design-only project documentable at all. Then let each output read the record and retire a duplicate reader only when its replacement produces identical output.

---

## 8. Cheat sheet

| Question | Answer |
|---|---|
| Where is the source of truth? | Figma decides; the committed snapshot is the record |
| How many readers of Figma? | One for reporting; live reads only for tools that fix |
| What does the payload need? | A versioned schema and a test that fails on a missing field |
| Token format on disk | DTCG, derived from the payload |
| Component contract | Normalised spec from Figma, a thin authored mapping to code, a role per part, checked against code's own contract |
| Status | Three or four values, derived from page markers, scores and findings, never typed |
| Parity | Per component, directional, from a saved measurement, last confirmed match, "not measured" where true |
| Before code | A handoff spec with "changed since the last snapshot" |
| After code | Live stories from the project's Storybook, same origin, matched by folder |
| What the page contains | The knowledge base's documentation profile |
| Keeping it current | Regenerate the derivable parts through a reviewed change; show the snapshot's age |
| Brand switching | Written down: which layer a brand switches, the brand-by-theme grid, the mechanism |
| What not to write | A hand-maintained status table, a second reader of Figma, a section that only proves the data exists |

---

## 9. The short version

The systems that document well keep one record and generate everything else from it. For almost all of them the record is a repository and Figma is an output; for a Figma-first team the same structure works with the roles reversed, provided the extraction is committed and treated as the record rather than the live file. Spectrum, Atlassian and Primer show the pattern working; Carbon's 106 Figma-only tokens, Moonstone's two warning colours and Nuxt UI's two backgrounds show what two editable sources cost.

On that record sits a component contract assembled from both sides: the normalised spec Figma gives, a thin mapping to code a person writes, and a check against the code's own contract. Adobe's two contracts for one Button disagree on the default variant, which is the argument for checking against both rather than trusting either.

Status and parity should be computed, never typed: a small derived vocabulary, and per-component agreement from a saved, rendered measurement rather than a source hash. The documentation changes with the phase, from a handoff spec with a change list before code to live previews and parity after. The record stays current by regenerating only what is derivable, through a reviewed change, with its age on the page; which layer a brand switches is the one fact that has to be written by hand. One toolkit that took this path found that a payload schema and a single writer were the two pieces everything else was waiting on.

---

## 10. What to re-check later

Researched September 2026 and consolidated on 2 November 2026 from *Design system documentation as one ecosystem*. Component pages, token pages, repositories, issues and changelogs were opened directly for Carbon, Primer, Atlassian, GOV.UK, Polaris, Material 3, Spectrum, Fluent 2, Ant Design, TDesign, Wikimedia Codex, Twilio Paste, Salesforce SLDS, Radix and shadcn/ui, plus Figma's developer documentation and the DTCG report. Re-checked in November 2026: the npm registry (`@figma/code-connect` is now 2.1.0, `@directededges/specs-schema` 0.39.0); the DTCG site (2025.10 still the only stable release); the Storybook manifests page (still preview). The toolkit was read from the toolkit's repository on 2 November 2026, against the assessment the earlier guide made on 18 September. What a docs page should contain, section by section, now lives in the toolkit's knowledge base and is not repeated here (section 7). Where a claim rests on commentary or a vendor's report, it says so. Section 6 was added on 9 November 2026 from section 9 of *Making a design system usable by AI agents*, now archived at `_archive/2026-11-09/machine-readable-design-systems.md`.

- **Code Connect's CLI** was re-read at 2.0.1 on 1 October 2026; it is now 2.1.0.
- **Extended Collections below Enterprise**, which is what keeps the alternative brand architectures alive ("Available on the Enterprise plan", re-checked November 2026).
- **DTCG**: 2025.10 still the only stable release as of November 2026.
- **Code Connect's enum-mapping validation** under CLI 2.1.0; the silent-pass behaviour was confirmed only in 2.0.1.
- **Figma API limits**: the Enterprise requirement for the Variables REST API, the November 2025 rate limits, and `SLOT` in the REST types, all checked in September 2026.
- **Storybook component manifests**, still preview and still default-off.
- **Spectrum's design data** (`specVersion` `1.0.0-draft`) and whether its Figma export reached parity.
- **Carbon's DTCG migration** (ADR 0008) and whether the parity-gate proposal (#23255) shipped.
- **Where Polaris's former patterns and content guidance went** after the move to shopify.dev.
- **Evidence quality.** User research on documentation exists from GOV.UK only; the handoff figures come from one vendor survey (Telerik) and the multi-place documentation figure (68 percent of 294 respondents, Figma plus Storybook the most common pairing at 47 percent) from another (zeroheight). Altitude is a single small system. Curtis's work is commentary with a real schema behind it.

---

## Sources

### Single source, contracts and platform

- [Spectrum design data](https://github.com/adobe/spectrum-design-data), its [component files](https://github.com/adobe/spectrum-design-data/tree/main/packages/design-data/components), [component format spec](https://github.com/adobe/spectrum-design-data/blob/main/packages/design-data-spec/spec/component-format.md) and [RFC discussion #625](https://github.com/adobe/spectrum-design-data/discussions/625).
- [React Spectrum S2, `Button.tsx`](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/Button.tsx).
- [Atlassian frontend mirror](https://bitbucket.org/atlassian/atlassian-frontend-mirror) (the `@atlaskit/tokens` changelog).
- [Primer primitives, build system](https://github.com/primer/primitives/blob/main/contributor-docs/agents/build-system.md); [Primer React, `Button.figma.tsx`](https://github.com/primer/react/blob/main/packages/react/src/Button/Button.figma.tsx).
- [Carbon PR #23382, ADR 0008](https://github.com/carbon-design-system/carbon/pull/23382); issues [#23000](https://github.com/carbon-design-system/carbon/issues/23000), [#23252](https://github.com/carbon-design-system/carbon/issues/23252), [#23253](https://github.com/carbon-design-system/carbon/issues/23253), [#23255](https://github.com/carbon-design-system/carbon/issues/23255), [#20479](https://github.com/carbon-design-system/carbon/issues/20479); [Carbon component checklist](https://carbondesignsystem.com/contributing/component-checklist/); [Carbon website PR #4719](https://github.com/carbon-design-system/carbon-website/pull/4719).
- [Jahia Moonstone #1480](https://github.com/Jahia/moonstone/issues/1480); [Nuxt UI #6285](https://github.com/nuxt/ui/issues/6285); [brik-bds #1552](https://github.com/brikdesigns/brik-bds/issues/1552).
- [Material foundation, material-tokens (archived)](https://github.com/material-foundation/material-tokens); [Salesforce Theo (archived)](https://github.com/salesforce-ux/theo); [Microsoft fluentui-token-pipeline (archived)](https://github.com/microsoft/fluentui-token-pipeline); [Open UI component schema](https://github.com/openui/open-ui/blob/main/site/src/schemas/component.schema.json).
- [W3C DTCG, Format 2025.10](https://www.designtokens.org/tr/2025.10/format/) and [first stable version](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/).
- [Custom Elements Manifest](https://github.com/webcomponents/custom-elements-manifest); [Shoelace](https://github.com/shoelace-style/shoelace).
- [Storybook, AI manifests](https://storybook.js.org/docs/ai/manifests) and [changelog](https://github.com/storybookjs/storybook/blob/next/CHANGELOG.md).
- [Directed Edges, specs schema](https://github.com/DirectedEdges/specs).
- [facebook/astryx](https://github.com/facebook/astryx). The codemod runner.
- Figma: [Variables REST API](https://developers.figma.com/docs/rest-api/variables/), [rate limits](https://developers.figma.com/docs/rest-api/rate-limits/), [Code Connect](https://developers.figma.com/docs/code-connect/), [componentPropertyDefinitions](https://developers.figma.com/docs/plugins/api/properties/ComponentPropertiesMixin-componentpropertydefinitions/), [measurements and annotations](https://help.figma.com/hc/en-us/articles/20774752502935-Add-measurements-and-annotate-designs-in-Dev-Mode), [Dev Mode statuses](https://help.figma.com/hc/en-us/articles/26781702258583-Dev-Mode-statuses-and-notifications), [variables GitHub Action example](https://github.com/figma/variables-github-action-example), [webhook events](https://developers.figma.com/docs/rest-api/webhooks-events/), [*Extend a variable collection*](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection), [*Schema 2025: Design systems for a new era*](https://www.figma.com/blog/schema-2025-design-systems-recap/) (the help-centre page *What's new from Schema 2025* returned 404 on 9 November 2026); code-connect issues [#158](https://github.com/figma/code-connect/issues/158), [#291](https://github.com/figma/code-connect/issues/291), [#383](https://github.com/figma/code-connect/issues/383).

### Status, parity and documentation

- [Primer, component status](https://primer.style/product/getting-started/component-status/) and the [archived lifecycle guide](https://github.com/primer/design/blob/main/content/guides/component-lifecycle.mdx); [Primer design PR #710](https://github.com/primer/design/pull/710).
- [GOV.UK lifecycle issues #5426](https://github.com/alphagov/govuk-design-system/issues/5426) and [#5477](https://github.com/alphagov/govuk-design-system/issues/5477); [GOV.UK PR #5002](https://github.com/alphagov/govuk-design-system/pull/5002); [GOV.UK documentation research (2018)](https://designnotes.blog.gov.uk/2018/11/05/how-we-document-components-and-patterns-in-the-gov-uk-design-system/).
- [Material 3, develop for web](https://m3.material.io/develop/web); [Carbon v9 status matrix (Wayback)](https://web.archive.org/web/20240619012747/https://v9.carbondesignsystem.com/component-status/).
- [Altitude docs overview](https://altitude.pages.dev/docs/) and [Button](https://altitude.pages.dev/docs/components/button).
- [TDesign, React Button](https://tdesign.tencent.com/react/components/button); [Atlassian, all tokens](https://atlassian.design/components/tokens/all-tokens); [Twilio Paste, tokens list](https://github.com/twilio-labs/paste/tree/main/packages/paste-website/src/components/tokens-list).

### Commentary and vendor surveys

- [Nathan Curtis, Component Contracts and Schemas (2026)](https://nathanacurtis.substack.com/p/component-contracts-and-schemas), [Analysis of Variants (2025)](https://nathanacurtis.substack.com/p/analysis-of-variants-9e440c30b93e), [Component Specifications (2023)](https://nathanacurtis.substack.com/p/component-specifications-1492ca4c94c).
- [Rachel Cantor, *Your agent is reading a different design system* (2026)](https://rachel.fyi/posts/your-agent-is-reading-a-different-design-system).
- [Progress Telerik, State of Designer-Developer Collaboration 2024](https://www.telerik.com/docs/default-source/whitepapers/state-of-designer-developer-collaboration-2024_telerik.pdf) (vendor).
- [zeroheight, Design Systems Report 2025](https://othr.zeroheight.com/hubfs/zeroheight%20-%20Design%20System%20Report%202025%20-%20release%20version.pdf) (vendor).

### Toolkit (public repository, read 2 November 2026)

- [`tools/snapshot/payload.cjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/payload.cjs): the payload schema.
- [`tools/snapshot/store.cjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/store.cjs) and [`tools/snapshot/deliver.cjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/deliver.cjs): the one writer.
- [`tools/snapshot/guidance.cjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/guidance.cjs): the description parser.
- [`tools/snapshot/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/README.md).
- [`standards/snapshot-standard.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/standards/snapshot-standard.md), rules 5 and 6.
- [`tools/docs-site/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/README.md) and [`src/pages/parity/`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/src/pages/parity).
- [`tools/parity/external.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/parity/external.mjs): the external library's visual report.
- [`tools/system-mcp/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/system-mcp/README.md).
- [`knowledge/ui/profiles/documentation.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/profiles/documentation.md) and [`knowledge/code/figma-handoff.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/figma-handoff.md).

### Cited but not resolved

- Telekom Scale's neutral-theme package split and a Dow Jones multi-brand variables architecture, cited in an earlier version as non-mode alternatives for brand switching, not re-opened.

The full source list for the page-content chapters (component pages, token pages and previews across fifteen systems) is in the archived original, [`_archive/2026-11-02/design-system-docs-ecosystem.md`](../_archive/2026-11-02/design-system-docs-ecosystem.md).
