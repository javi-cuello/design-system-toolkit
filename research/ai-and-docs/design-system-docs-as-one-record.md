# One record, many outputs: documenting a Figma-first design system

How a team that designs in Figma can give every docs page, token build, tracker and agent one committed record to read.

Jahia's Moonstone shipped its warning colour twice: `#E8B606` in the Figma file and `#FFBB00` in code. Nobody chose two yellows, and neither side was broken. Each was read from a different place, and nothing said which place was the record.

Every design system with more than one reader faces that moment. The ones that document well have settled which copy is the record and generate everything else from it; the ones that don't have as many silent disagreements as they have readers.

---

## What this answers

- [Figma as source of truth](#figma-as-source-of-truth): can Figma be the source of truth
- [One extraction, many outputs](#one-extraction-many-outputs): what the pattern looks like
- [The component contract](#the-component-contract): what a component contract is
- [Measured status and parity](#measured-status-and-parity): why compute status rather than type it
- [Docs before code](#docs-before-code): what docs show before code exists
- [Keeping the record current](#keeping-the-record-current): how the record stays current
- [One toolkit's build](#one-toolkits-build): what happened when one toolkit built it

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs.

---

## Figma as source of truth

Figma can be the source of truth, as the place the design is decided, while a committed, versioned extraction of it is what every other tool reads.

The Moonstone yellow shows what "source of truth" hides. There are two jobs in the phrase. The **authoring surface** is where a person makes the decision. The **source of record** is what other systems read, diff, version and validate against.

In a small team the two feel like one thing. They come apart the moment a second tool needs to read the design, because that tool has to read *something*, at *some moment*, in *some shape*.

The mature systems answer by putting the record in a repository and writing Figma as one of its outputs:

- **Spectrum** keeps a canonical dataset in `packages/design-data/` (tokens, 97 component files, mode sets, guidelines) and exports it to Figma Variables.
- **Atlassian** generates `@atlaskit/tokens` from TypeScript schemas and ships a Figma artefact beside the CSS.
- **Primer** builds CSS, docs, a Figma format and LLM guidance from DTCG JSON.
- **Carbon** made it formal in a 2026 architecture decision record: DTCG JSON is the only hand-edited source.

Almost none of them treats a live Figma file as the record, and the reasons are mechanical rather than cultural. Spectrum's authoring RFC gives Figma a view-only role for most contributors because Figma can't enforce a schema, a taxonomy or validation.

The platform limits are concrete too:

- the Variables REST API needs a Full seat in an Enterprise organisation;
- View and Collab seats are limited to about 20 file reads a month under the November 2025 rate limits;
- property descriptions exist in the Plugin API only for `SLOT` properties, and the REST API's property types still lack `SLOT`.

Spectrum also shows the way out. It keeps a Figma plugin as the *editing* interface for component option schemas, validated with Ajv, while the data lives in the repository. A Figma-first team reaches the same arrangement from the other side: design in Figma, extract with a plugin, and commit the extraction.

That committed file is versioned, diffable, reviewable, readable offline and identical for every consumer. A live file is none of those.

The systems that didn't separate the roles show the cost:

- **Carbon's** epic #23000 describes its DTCG source and Figma variables as disconnected. The audit that followed (#23252) found tokens in Figma missing from code, 106 of them in Tag alone, and #23253 states the symptom: every token change leaves Figma silently out of sync.
- **Moonstone** (#1480) is the yellow from the opening: `#E8B606` in Figma, `#FFBB00` in code.
- **Nuxt UI** (#6285) had its Figma kit on `bg-muted` where code used `bg-elevated`, a difference visible only in light mode.

Nobody chose drift. Each had two editable places and nothing that made one of them the record.

Three traps sit in this arrangement.

**Declaring a source without an extraction.** Carbon declared code the source and still found 106 Figma-only tokens. A declaration that nothing enforces is a wish.

**Treating the live file as the record.** Two consumers reading "the same" file at different moments, through different APIs with different access, can disagree without either being wrong.

**Letting the neutral format be a vendor's.** Material's Design System Package format, Salesforce's Theo and Fluent's token pipeline are all archived. DTCG, stable since 28 October 2025, is the survivor for tokens.

If your team says "Figma is the source of truth", write it down as **"Figma is where it is decided; the snapshot is what it is."** The arrangement holds only if the extraction runs often and is trusted; otherwise the committed copy becomes the stale one.

---

## One extraction, many outputs

One extractor writes a payload, a schema says what the payload holds, a test fails when it doesn't, and every reporting output reads the payload rather than the source.

Take a question every output answers: what is Button's default size? The docs page shows it, the token build uses it, the tracker lists it, and an agent asks for it. When each reads Figma itself, at its own moment and through its own API, there are four answers that usually agree. When each reads the payload, there is one answer, wrong in one place and fixed in one place.

Here are the two arrangements side by side.

<svg role="img" viewBox="0 0 640 270" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Two arrangements. Left, four readers (docs site, token build, tracker, agent) each read the live Figma file separately, at different moments. Right, one extractor reads Figma once and writes a committed payload checked by a schema; the same four readers read the payload.</title>
<rect x="0" y="0" width="640" height="270" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Every reader reads Figma</text>
<text x="340" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Every reader reads one payload</text>
<rect x="20" y="115" width="90" height="44" rx="8" fill="#ffffff" stroke="#1a1a1a"/>
<text x="65" y="142" font-size="13" text-anchor="middle" fill="#1a1a1a">Figma file</text>
<g fill="#ffffff" stroke="#c9c6bd">
<rect x="180" y="45" width="120" height="36" rx="6"/><rect x="180" y="97" width="120" height="36" rx="6"/><rect x="180" y="149" width="120" height="36" rx="6"/><rect x="180" y="201" width="120" height="36" rx="6"/>
<rect x="500" y="45" width="120" height="36" rx="6"/><rect x="500" y="97" width="120" height="36" rx="6"/><rect x="500" y="149" width="120" height="36" rx="6"/><rect x="500" y="201" width="120" height="36" rx="6"/>
</g>
<g font-size="12" fill="#1a1a1a" text-anchor="middle">
<text x="240" y="67">Docs site</text><text x="240" y="119">Token build</text><text x="240" y="171">Tracker</text><text x="240" y="223">Agent</text>
<text x="560" y="67">Docs site</text><text x="560" y="119">Token build</text><text x="560" y="171">Tracker</text><text x="560" y="223">Agent</text>
</g>
<g stroke="#c9533c" stroke-width="1.5" stroke-dasharray="4 3" fill="none">
<line x1="110" y1="130" x2="180" y2="63"/><line x1="110" y1="134" x2="180" y2="115"/><line x1="110" y1="140" x2="180" y2="167"/><line x1="110" y1="146" x2="180" y2="219"/>
</g>
<g font-size="10" fill="#c9533c">
<text x="120" y="252">read at four moments, four ways</text>
</g>
<rect x="340" y="60" width="80" height="36" rx="8" fill="#ffffff" stroke="#1a1a1a"/>
<text x="380" y="83" font-size="12" text-anchor="middle" fill="#1a1a1a">Figma file</text>
<line x1="380" y1="96" x2="380" y2="120" stroke="#1a1a1a" stroke-width="1.5"/>
<text x="388" y="113" font-size="10" fill="#5a5850">extract once</text>
<rect x="340" y="120" width="80" height="56" rx="8" fill="#e7eefa" stroke="#1f5fbf"/>
<text x="380" y="143" font-size="12" text-anchor="middle" fill="#1a1a1a">Payload</text>
<text x="380" y="161" font-size="10" text-anchor="middle" fill="#1f5fbf">schema + test</text>
<g stroke="#1f5fbf" stroke-width="1.5" fill="none">
<line x1="420" y1="140" x2="500" y2="63"/><line x1="420" y1="145" x2="500" y2="115"/><line x1="420" y1="152" x2="500" y2="167"/><line x1="420" y1="157" x2="500" y2="219"/>
</g>
<text x="340" y="252" font-size="10" fill="#1f5fbf">one committed copy, read the same way</text>
</svg>

On the left, four dashed reads can each be right about a different moment. On the right, a disagreement can only come from the payload, so it shows up in one diff.

Spectrum is the fullest public example. One dataset feeds token viewers, the docs site's options tables, `@adobe/spectrum-component-schemas`, an MCP server, a Rust CLI with `resolve --format dtcg`, and the Figma export. On the code side, Shoelace feeds its docs and its VS Code, JetBrains and Vue integrations from one Custom Elements Manifest.

Atlassian's changelog shows the pattern arriving and then being defended. Version 0.0.4 built three outputs with Style Dictionary. Version 0.13.3 added a `tokens-raw` entrypoint for the Figma plugin. Version 0.13.5 is in effect "correct Figma entrypoints to use raw JSON": a second path removed after it had crept in.

The opposite is best described by someone who measured it. Rachel Cantor's write-up of an agent working against a design system found the Storybook component manifest to be a lossy copy:

- `@deprecated` tags never reached the agent;
- a wrong docgen extractor left descriptions blank;
- the agent duplicated components because the guidance sat in a Docs tab it never read.

Nothing flagged any of it. Every reader was internally consistent; they read different things.

The pattern has two honest limits. First, neutral payload formats die young: Theo, the Design System Package format, Fluent's pipeline, and Open UI's component dataset, whose Atlassian entry was last updated in 2019. A team that builds its own payload should expect to own the schema for as long as it uses it, and keep tokens in DTCG.

Second, not every read can move to the payload. A tool that *fixes* a Figma file (renames a layer, rebinds a variable) has to read the live file, because it writes back to it. So the rule that survives real tooling is narrower than "everything reads the payload".

Build one extractor, give its payload a versioned schema with a test, route every reporting consumer through it, and make the extraction cheap enough to run on every meaningful change. A plugin run measured in seconds meets that; a manual export ritual doesn't. **Reads that report go through the payload; reads that edit stay live.**

---

## The component contract

A component contract is a statement of what a component is, in words no platform owns, derived from Figma, translated to code through a mapping a person writes, and checked against the code's own contract.

Back to the Button. Its contract lists its props and their allowed values, defaults, parts, states, the token each part uses, and a role per part. Ask where that list should come from, and each side has a claim.

Taken from one side only, it is in Nathan Curtis's phrase "testimony, not a contract". Adobe shows why. It authored both of these for one component, as they stood on 18 September 2026:

| Field | Spectrum `button.json` (design contract) | React Spectrum S2 `Button.tsx` (code) |
|---|---|---|
| Fill property name | `style` | `fillStyle` |
| Size values | `s`, `m`, `l`, `xl` | `'S' \| 'M' \| 'L' \| 'XL'` |
| Default variant | `accent` | `primary` |
| Extra variants | none | `premium`, `genai` |

Even the default variant differs. A docs page built from either would be internally consistent and wrong about the other, which is the argument for checking a contract against both sides rather than trusting either.

**The design half.** Curtis's "Analysis of Variants" asks for a spec that is **deterministic**: regenerate it with nothing changed and the diff is empty. It should also be **normalised**: the default stated once, each variant only as its difference. He counts more than 14,400 redundant properties in Figma's raw data for a typical component. His schema ships as `@directededges/specs-schema`.

Spectrum's `component-format.md` adds what a Figma-derived shape lacks: `states` with a `trigger` of `prop` or `interaction`, `tokenBindings`, `lifecycle` and `accessibility`. It justifies them by a failure it couldn't previously catch, a token naming a variant that didn't exist.

**The code half.** Code has contracts of its own, generated. The Custom Elements Manifest covers attributes, events, slots, CSS parts and properties. Storybook's component manifest was made default-on in 10.3.0 and turned back off in 10.3.5, and is still a preview. Neither knows variant axes, tokens per part or states.

**The mapping between them.** This is where most real disagreement lives. Primer's `Button.figma.tsx` (Code Connect) maps the Figma value `secondary` to code `default`, and splits the Figma `state` enum into the booleans `disabled` and `inactive`.

Code Connect's issues (#158, #291, #383) show what a rename does to a mapping. In CLI 2.0.1, a renamed property or layer failed the publish, but a renamed variant value inside an enum mapping passed, so the mapping broke silently.

**A worked case: the toolkit's contract.** The design-system toolkit's knowledge base now owns which layers a contract holds and how far each can be checked ([component contract, in the toolkit's knowledge base](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/figma-handoff.md#what-a-component-contract-covers)):

- **Diffed exactly:** the API, the structure, tokens per part per variant, layout intent, and states with the token changes they cause.
- **Taken from behaviour and accessibility:** only a role per part, read from a Dev Mode annotation, and the prop that supplies the accessible name.
- **Left elsewhere:** usage guidance stays on the docs page, resolved geometry with the snapshot and parity.

While the design is drawn first, the stored contract is derived from the snapshot. An API change is a reviewed proposal made in both design and code and then derived again, never a sync in either direction.

A project can instead make the contract the official source of a library's API, keyed by the Figma component key so a rename keeps its contract. The reason to key by component rather than name is Figma's own variables sync example: it matches "by name" and deletes nothing, so a renamed token leaves its old variable behind.

Treat your Figma-derived spec as the first half of the contract, normalised and deterministic. Add a thin authored layer for the mapping to code and a role per part. **Then check the result against the code's own contract, because each side alone is testimony.**

---

## Measured status and parity

Status and parity are measured because a status someone types goes stale silently, while one computed from something that already exists can't drift from it.

Picture the Button's status on the docs site: "Beta". The designer marked the Figma page ready a month ago; the code shipped last week. The badge still says Beta because someone had to remember to change it.

Every status a docs site or tracker shows can instead be computed from something already there: a page marker the designer sets, an audit score, an open finding, a snapshot fingerprint. Parity, whether design and code agree, can be computed the same way from a saved measurement.

**Status vocabularies are shrinking.** Primer went from six lifecycle statuses (Experimental, Alpha, Beta, Stable, Deprecated, Removed) to three (Experimental, Ready, Deprecated). Carbon is renaming `experimental` and `unstable` to `preview`. GOV.UK was still choosing its lifecycle names in August 2026 (#5426, #5477). Figma's own vocabulary is three: Ready for dev, Completed, and an automatic Changed when a ready design is edited.

A long list reads as precision and is maintained as guesswork. Primer's own source files and site disagree on several components' status.

Hand-maintained status fails quietly. One system's committed manifest reported 0.131.1 while its package was at 0.138.0, because nothing failed when it was out of date (brik-bds #1552).

**Parity is mostly not published.** Primer shows `React | ready`, `Rails | ready` and a link to Figma with no status. Material 3 has Available and Unavailable. Carbon's v9 cross-framework matrix is gone. Availability is published; agreement is not.

The one system found that publishes agreement is Altitude, built by the team behind a Figma console tool. Here is the shape of its display for one component, using its own status names.

<svg role="img" viewBox="0 0 640 210" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A parity display in Altitude's style. A caption reads: 41 of 41 mapped Figma sets observed, last read 2026-09-08. Below, three component rows with directional badges: Button, FIGMA AHEAD, with its property and token differences behind a disclosure; Tag, BOTH CHANGED; Tooltip, IN SYNC, with accessibility NOT RECORDED.</title>
<rect x="0" y="0" width="640" height="210" fill="#f7f6f2"/>
<text x="20" y="30" font-size="12" font-style="italic" fill="#5a5850">41 of 41 mapped Figma sets observed, last read 2026-09-08</text>
<g fill="#ffffff" stroke="#c9c6bd">
<rect x="20" y="44" width="600" height="46" rx="8"/><rect x="20" y="98" width="600" height="46" rx="8"/><rect x="20" y="152" width="600" height="46" rx="8"/>
</g>
<g font-size="14" fill="#1a1a1a">
<text x="36" y="72">Button</text><text x="36" y="126">Tag</text><text x="36" y="180">Tooltip</text>
</g>
<rect x="140" y="56" width="104" height="22" rx="11" fill="#fbe9e4" stroke="#c9533c"/>
<text x="192" y="71" font-size="11" font-weight="600" fill="#9a3a26" text-anchor="middle">FIGMA AHEAD</text>
<text x="264" y="72" font-size="12" fill="#1f5fbf" text-decoration="underline">2 property, 1 token differences</text>
<rect x="140" y="110" width="110" height="22" rx="11" fill="#fdf3dc" stroke="#b8862b"/>
<text x="195" y="125" font-size="11" font-weight="600" fill="#7a5a12" text-anchor="middle">BOTH CHANGED</text>
<rect x="140" y="164" width="80" height="22" rx="11" fill="#e7f2e1" stroke="#5f8a3a"/>
<text x="180" y="179" font-size="11" font-weight="600" fill="#3f6626" text-anchor="middle">IN SYNC</text>
<text x="264" y="180" font-size="12" fill="#5a5850">Accessibility: NOT RECORDED</text>
</svg>

Each badge says which side moved, and the caption says when the reading was taken. Where a check never ran, it prints "NOT RECORDED" in words rather than leaving a blank that looks like a pass. (The rows are illustrative; the caption is Altitude's own.)

Altitude's full set of statuses is `IN SYNC`, `FIGMA AHEAD`, `CODE AHEAD`, `BOTH CHANGED`, `NOT IN FIGMA` and `NOT TRACKED`, generated at build time, with property and token differences listed. Its weaknesses teach as much as its strengths:

- the code side is a hash of the source, so a comment edit counts as a change and nothing says what changed;
- `BOTH CHANGED` is its second-largest bucket (14 of 41), which may measure the sync ritual more than divergence;
- status is per component, not per variant.

A rendered, per-variant comparison against the design has none of those weaknesses.

Derive every status, and keep your vocabulary to three or four values. Show parity per component from a saved measurement, with its differences behind a disclosure, its last confirmed match, and "not measured" in words. **A status nobody computes is a status nobody notices going wrong.** The toolkit's knowledge base holds the display rules: status as a word in a badge, derived by the generator, and a provenance caption on every generated page ([change logs, status and versioning](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/profiles/documentation.md#change-logs-status-and-versioning); [provenance and freshness](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/profiles/documentation.md#provenance-and-freshness-on-generated-pages)).

---

## Docs before code

Docs show a handoff specification before code, and live previews with per-component parity after, switched by one field in the project's settings.

A developer is about to build the Button, and nothing exists in code yet. What they need from the docs page is not a live preview; there is nothing to preview. They need guidance, a design image, properties with intended code names, states, tokens per part, and what changed since the last snapshot.

Carbon's component checklist is the most explicit published version of that pre-code spec:

- colour and type tokens;
- structure and measurements for every size and content configuration;
- interaction states (hover, focus, selected, disabled, read-only, error, warning);
- behaviours (responsiveness, overflow and reflow, expansion, scrolling);
- accessibility (4.5:1 text, 3:1 non-text, focus flow).

Curtis's "Component Specifications" (2023) adds non-visual and code-only properties, touch targets, motion and component tokens. He argues that Figma's Inspect panel isn't enough, because components omit behaviour, code-only properties and accessibility.

Why the change list matters shows in the one user-facing data point, a vendor survey. Progress Telerik asked 222 respondents (82 percent in engineering) why handoff disappointed them. 65 percent said designs keep changing afterwards and are hard to track; 50 percent said they have to ask many questions. The first is the argument for a change record in the handoff, and a snapshot diff supplies one for nothing.

Figma covers part of this itself. Dev Mode has had annotations in Development, Interaction, Accessibility and Content categories since January 2024, plus Ready for dev and the automatic Changed status. What it lacks is the assembled view: one page per component with states, tokens per part and intended code names together.

The previews change with the phase. Before code, they are images of the design, exported by the same extraction and labelled as design. After, they are live stories from the project's own Storybook, served from the docs site's own origin so a frame can size itself and follow the theme. Each story is matched to its component by folder rather than by a story title, which breaks when retitled.

A preview from code and one from Figma answer different questions. Once both exist, the gap between them is the parity described in [measured status and parity](#measured-status-and-parity).

Make the phase one stated field in your project's settings, and let it switch the outputs, each showing nothing where its data is absent:

- before code, a handoff spec with a change list;
- after code, live previews and parity;
- while the library is being built, a tracker (status, readiness, blocking findings, decisions, changes since review);
- in every phase, a maintenance dashboard whose reporting reads the record and whose fixes write live.

**The phase decides what the page shows, so write the phase down once and let every output read it.**

---

## Keeping the record current

It stays current by regenerating only what is derivable, through a reviewed change, with the record's age on the page, and by writing down by hand the one fact no generator can infer.

Say the Button's border token is renamed in Figma on a Tuesday. If the extraction doesn't run, the docs, the token build and the agent's reference all keep answering with the old name, confidently. A stale or incomplete record doesn't fail loudly.

Agents show the cost most clearly. Given an incomplete specification, they compensate silently by reading component implementations to recover the missing guidance, which costs tokens and produces conclusions nobody reviewed.

The consensus answer is regeneration from the source. Figma's webhooks fire on `FILE_UPDATE` (after 30 minutes of editing inactivity), `FILE_VERSION_UPDATE`, `FILE_DELETE`, `FILE_COMMENT`, `DEV_MODE_STATUS_UPDATE` and `LIBRARY_PUBLISH`. The `LIBRARY_PUBLISH` payload carries created, modified and deleted arrays for components, styles and variables, so a listener knows what changed without re-diffing.

The Variables REST API supports two-way sync through GitHub Actions. The write-back direction needs Enterprise membership, an editor seat and a write-scoped token. Astryx's CLI carries the consumer-side counterpart, a codemod runner for migrating between versions.

How far can automation go? Token-level parity is close to solved. Automatic component-API sync is not, and no vendor claims it, so a loop that promises it is a loop that will break. The toolkit's narrower answer is the one in [the component contract](#the-component-contract): a release-pinned snapshot committed to git, a per-variant rendered comparison against it, and API changes made as reviewed proposals to a contract.

**The one fact no generator infers is which layer a brand switches.** Components consume semantic tokens, a rebrand edits primitives, and a brand switch remaps the semantic aliases or swaps a mode.

A generator reading a library can list collections, modes and values. It can't tell whether a mode is a brand, a theme or a platform, or which layer a rebrand should edit. So that has to be written down, with the brand-by-theme grid as a table and the mechanism chosen from these:

| Mechanism | How it works | Constraint |
|---|---|---|
| Figma Extended Collections | A core collection is published and extended per brand, inheriting with overrides | Enterprise plan only |
| Multi-collection modes | Brands as modes within collections | Mode ceilings; related modes across collections cannot be linked |
| Theme packages | Each brand a separate published package | Brand assets fenced at the package boundary |

DTCG handles theming without duplicating files, through group inheritance; 2025.10 is still its only stable release.

Keep your canonical artefacts in version control, and regenerate only the derivable sections through a human-reviewed change. Add a staleness check (snapshot age against the file's last edit) so a loop that stops running is seen. **Write down which layer your brands switch at, because nothing else in the pipeline records it.** Regeneration from the source is consensus; the staleness check and the written brand layer are judgements, made because both failures are otherwise silent.

---

## One toolkit's build

The toolkit that built it found that a payload schema and a single writer were the two pieces everything else was waiting on.

On 18 September 2026 the design-system toolkit had good parts that didn't form a system:

- at least six code paths reading component trees from Figma, and five reading variables;
- four routes from tokens to CSS;
- two component formats and two description parsers;
- a receiver per repository;
- no schema for what a snapshot contained.

An assessment that day named the missing schema and the per-repository receivers as the root problem. By November both were fixed and most of the outputs above existed. Here is what was built.

**A payload schema.** `tools/snapshot/payload.cjs` (schema version 1) calls itself "the one statement of the shape", checked by the same code wherever a payload or a stored file is read. It checks what consumers rely on and nothing more. An extra key is never an error, so a plugin may send ahead of a store that reads it.

Its header records the cost of that tolerance. Five convenience keys rode on it until plugin 0.32.0 removed them, long after the receivers they served were gone.

**One writer.** Rule 5 of the toolkit's snapshot standard says `store.cjs` writes every project's snapshot, and `deliver.cjs` is the only thing that calls it, for a repository and a design-only project alike; a project's own steps run after the store.

The evidence it cites: two repositories each had a receiver and the toolkit a third writer. They wrote token files of two shapes, screens in three layouts and icons two ways, each carrying fixes the others lacked. A router now sends each payload to the project that owns the file, so a design-only project has an extraction under its own folder.

**A docs site switched by phase.** In `design`, it shows the handoff spec: guidance from each component's description, the default-variant design preview the plugin exports, properties and states from the component's contract, tokens per layer, status from the page marker read through the project's legend, and what changed in the last snapshot. In `build` and `maintenance`, it adds live previews from the project's Storybook and whether each component is in code ([docs site README](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/README.md)).

**Guidance from descriptions.** One parser, `guidance.cjs`, reads each Figma description into purpose, Usage, Don't, Behaviour, Composition and Code gen notes. A Don't naming another component links to it.

**Parity as pages.** The tracker's Parity section lists which components are in code: a folder holding a file of the component's name, or the name the project says it is built as. For a component library built elsewhere, a *Visual* page reads a report from `tools/parity/external.mjs`, which renders the library in its own Storybook and measures it against the design's contracts.

**An agent's reference from the same record.** The site writes a JSON API beside its pages, and `tools/system-mcp` serves it; [Part 4](how-the-system-reaches-the-agent.md) tells that route.

Two things the September assessment proposed didn't happen as proposed. The "propose a change" path became its own tool, a contract editor the docs site links to, instead of a field on the page. And visual Do and Don't examples (one frame per guidance bullet, drawn from real instances) were parked on 19 September and remain so.

**What the page says is the knowledge base's.** The page-content findings of that assessment are now rules in the toolkit's [documentation profile](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/profiles/documentation.md):

- One site for design and code guidance. Atlassian and Primer both paid to merge two; Spectrum's split let its design side go stale; Polaris's move into a developer portal shrank its guidance to a footnote.
- A fixed component-page skeleton, in which "when not to use" names the alternative and an empty section says "Not applicable" or "No guidance yet".
- Health figures, never inventory figures, as headlines.
- Every generated table held to one test: does it help someone choose, build or check this component? Primer's PR #710 called its mixed props tables a "matrix of sadness".
- Semantic token tables with one column per mode, and primitives as ramps.
- Contrast only for defined pairs; Paste's "accessible pairing" popover is the one shipping example.

Three findings from that work aren't in the knowledge base and are worth keeping here.

**TDesign's similar components section** is the most compact guidance element found, and the reason every Don't should name an alternative.

**Carbon's hand-maintained 120 KB `color-tokens.js`** was fixed pull request by pull request ("match what we have in code", #4719). Atlassian's generated token page is the opposite failure: it reproduces a typo from its source ("Use for for backgrounds") word for word.

**GOV.UK removed its colour generator** during a colour rework (#5002). That shows the risk is a generator tied to a format being redesigned, not generation itself.

If your toolkit or team is where this one was in September, start where it did: give the payload a schema and make one writer. **Nearly every duplication follows from not having those two, and they are what makes a design-only project documentable at all.** Then let each output read the record, and retire a duplicate reader only when its replacement produces identical output.

---

## Cheat sheet

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

## The short version

The systems that document well keep one record and generate everything else from it. For almost all of them the record is a repository and Figma is an output. For your Figma-first team the same structure works with the roles reversed, provided the extraction is committed and treated as the record rather than the live file. Spectrum, Atlassian and Primer show the pattern working; Carbon's 106 Figma-only tokens, Moonstone's two warning colours and Nuxt UI's two backgrounds show what two editable sources cost.

On that record sits a component contract assembled from both sides: the normalised spec Figma gives, a thin mapping to code a person writes, and a check against the code's own contract. Adobe's two contracts for one Button disagree on the default variant, which is the argument for checking against both rather than trusting either.

Compute status and parity; never type them. Use a small derived vocabulary, and show per-component agreement from a saved, rendered measurement rather than a source hash. Let the documentation change with the phase, from a handoff spec with a change list before code to live previews and parity after.

Keep the record current by regenerating only what is derivable, through a reviewed change, with its age on the page. Which layer a brand switches is the one fact you have to write by hand. One toolkit that took this path found that a payload schema and a single writer were the two pieces everything else was waiting on.

---

## What to re-check later

Researched September 2026 and consolidated on 2 November 2026 from *Design system documentation as one ecosystem*. Component pages, token pages, repositories, issues and changelogs were opened directly for Carbon, Primer, Atlassian, GOV.UK, Polaris, Material 3, Spectrum, Fluent 2, Ant Design, TDesign, Wikimedia Codex, Twilio Paste, Salesforce SLDS, Radix and shadcn/ui, plus Figma's developer documentation and the DTCG report. Re-checked in November 2026: the npm registry (`@figma/code-connect` is now 2.1.0, `@directededges/specs-schema` 0.39.0); the DTCG site (2025.10 still the only stable release); the Storybook manifests page (still preview). The toolkit was read from the toolkit's repository on 2 November 2026, against the assessment the earlier guide made on 18 September; the list in [one toolkit's build](#one-toolkits-build) is as of that date. What a docs page should contain, section by section, now lives in the toolkit's knowledge base and is not repeated here. [Keeping the record current](#keeping-the-record-current) was added on 9 November 2026 from the ninth section of *Making a design system usable by AI agents*, now archived at `_archive/2026-11-09/machine-readable-design-systems.md`. Rewritten 11 November 2026 in the series' current voice; the original is archived at `_archive/2026-11-11/ai-and-docs/`.

- **Code Connect's CLI** was re-read at 2.0.1 on 1 October 2026; it is now 2.1.0.
- **Extended Collections below Enterprise**, which is what keeps the alternative brand architectures alive ("Available on the Enterprise plan", re-checked November 2026).
- **DTCG**: 2025.10 still the only stable release as of November 2026.
- **Code Connect's enum-mapping validation** under CLI 2.1.0; the silent-pass behaviour was confirmed only in 2.0.1.
- **Figma API limits**: the Enterprise requirement for the Variables REST API, the November 2025 rate limits, and `SLOT` in the REST types, all checked in September 2026.
- **Storybook component manifests**, still preview and still default-off.
- **Spectrum's design data** (`specVersion` `1.0.0-draft`) and whether its Figma export reached parity.
- **Carbon's DTCG migration** (ADR 0008) and whether the parity-gate proposal (#23255) shipped.
- **Where Polaris's former patterns and content guidance went** after the move to shopify.dev.
- **The toolkit's server** was named `docs-mcp` until 4 November 2026.
- **Evidence quality.** User research on documentation exists from GOV.UK only; the handoff figures come from one vendor survey (Telerik) and the multi-place documentation figure (68 percent of 294 respondents, Figma plus Storybook the most common pairing at 47 percent) from another (zeroheight). Altitude is a single small system. Curtis's work (2023 to 2026) is commentary with a real schema behind it. Cantor's 2026 write-up is commentary with a worked case.

---

## Sources

**Primary: single source, contracts and platform**

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

**Primary: status, parity and documentation**

- [Primer, component status](https://primer.style/product/getting-started/component-status/) and the [archived lifecycle guide](https://github.com/primer/design/blob/main/content/guides/component-lifecycle.mdx); [Primer design PR #710](https://github.com/primer/design/pull/710).
- [GOV.UK lifecycle issues #5426](https://github.com/alphagov/govuk-design-system/issues/5426) and [#5477](https://github.com/alphagov/govuk-design-system/issues/5477); [GOV.UK PR #5002](https://github.com/alphagov/govuk-design-system/pull/5002); [GOV.UK documentation research (2018)](https://designnotes.blog.gov.uk/2018/11/05/how-we-document-components-and-patterns-in-the-gov-uk-design-system/).
- [Material 3, develop for web](https://m3.material.io/develop/web); [Carbon v9 status matrix (Wayback)](https://web.archive.org/web/20240619012747/https://v9.carbondesignsystem.com/component-status/).
- [Altitude docs overview](https://altitude.pages.dev/docs/) and [Button](https://altitude.pages.dev/docs/components/button).
- [TDesign, React Button](https://tdesign.tencent.com/react/components/button); [Atlassian, all tokens](https://atlassian.design/components/tokens/all-tokens); [Twilio Paste, tokens list](https://github.com/twilio-labs/paste/tree/main/packages/paste-website/src/components/tokens-list).

**Commentary and vendor surveys**

- [Nathan Curtis, Component Contracts and Schemas (2026)](https://nathanacurtis.substack.com/p/component-contracts-and-schemas), [Analysis of Variants (2025)](https://nathanacurtis.substack.com/p/analysis-of-variants-9e440c30b93e), [Component Specifications (2023)](https://nathanacurtis.substack.com/p/component-specifications-1492ca4c94c).
- [Rachel Cantor, *Your agent is reading a different design system* (2026)](https://rachel.fyi/posts/your-agent-is-reading-a-different-design-system).
- [Progress Telerik, State of Designer-Developer Collaboration 2024](https://www.telerik.com/docs/default-source/whitepapers/state-of-designer-developer-collaboration-2024_telerik.pdf) (vendor).
- [zeroheight, Design Systems Report 2025](https://othr.zeroheight.com/hubfs/zeroheight%20-%20Design%20System%20Report%202025%20-%20release%20version.pdf) (vendor).

**Toolkit (public repository, read 2 November 2026)**

- [`tools/snapshot/payload.cjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/payload.cjs): the payload schema.
- [`tools/snapshot/store.cjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/store.cjs) and [`tools/snapshot/deliver.cjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/deliver.cjs): the one writer.
- [`tools/snapshot/guidance.cjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/guidance.cjs): the description parser.
- [`tools/snapshot/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/snapshot/README.md).
- [`standards/snapshot-standard.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/standards/snapshot-standard.md), rules 5 and 6.
- [`tools/docs-site/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/README.md) and [`src/pages/parity/`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/docs-site/src/pages/parity).
- [`tools/parity/external.mjs`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/parity/external.mjs): the external library's visual report.
- [`tools/system-mcp/README.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/tools/system-mcp/README.md).
- [`knowledge/ui/profiles/documentation.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/ui/profiles/documentation.md) and [`knowledge/code/figma-handoff.md`](https://github.com/javi-cuello/design-system-toolkit/blob/main/knowledge/code/figma-handoff.md).

**Cited but not resolved to a URL**

- Telekom Scale's neutral-theme package split and a Dow Jones multi-brand variables architecture, cited in an earlier version as non-mode alternatives for brand switching, not re-opened.

The full source list for the page-content chapters (component pages, token pages and previews across fifteen systems) is in the archived original, [`_archive/2026-11-02/design-system-docs-ecosystem.md`](../_archive/2026-11-02/design-system-docs-ecosystem.md).

---

Part 3 of 9 in *The agent-ready design system*. Previous: [Part 2, What a design system's library should carry for an agent](what-the-library-carries-for-an-agent.md). Next: [Part 4, How a design system reaches the agent](how-the-system-reaches-the-agent.md).
