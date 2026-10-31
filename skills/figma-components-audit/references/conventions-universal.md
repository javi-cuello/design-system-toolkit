# Universal conventions

Portable rules that hold in any well-formed component library. None of these encode a particular system's vocabulary — wherever a concrete value is needed (a scale, a state list, a suffix), the rule defers to the active library's rulebook — the project's context document, or the local `systems/` cache standing in for it. Each rule is tagged with the layer that owns it: **[scanner]** = fully decidable by script; **[agent]** = requires judgment; **[scanner→agent]** = script surfaces candidates, agent decides.

Each section states **why** it exists before its rules. The reason is not decoration for a human reader: every `[agent]` and `[scanner→agent]` rule is a judgement call, and a detector without a stated intent is what produces confident false positives (toolkit-standard §D 18). A checker that knows what a rule is *for* can tell a violation from a mechanism serving the same end by other means.

Where a reason cites no incident, it states the mechanism instead. Rules that arrived from outside this toolkit — an external checklist, another system's documentation — are **candidates** until a run here confirms them, and say so.

## 1. Token binding

*Why:* a raw value is a decision that cannot be changed centrally. It survives every theme switch, every rebrand and every scale revision untouched, and it is invisible — nothing about a hard-coded 12 announces that it was meant to be `Spacing/12`. Binding is what makes a library a system rather than a set of drawings.

- **[scanner]** Every non-zero padding, gap, and per-corner radius is bound to a variable. Raw values are defects. (Which collection and which scale: system.)
- **[scanner]** Every visible fill and stroke colour is bound. (Semantic-vs-primitive policy: system.)
- **[scanner]** Stroke weight binds via the four per-side properties (`strokeTopWeight` etc.) or the shorthand; reading only the shorthand false-positives on correctly bound strokes — check all five.
- **[scanner]** Every text node carries a text style AND bound `fontFamily`, `fontSize`, `fontStyle` (weight is the most-missed).
- **[scanner]** Bindings resolve to an allow-listed collection **key** — names are not unique across libraries. (The allow-list itself: system.)
- **[scanner]** Gap exemptions: `SPACE_BETWEEN` gaps are ignored entirely; a single-child (inert) unbound gap is hygiene, not error.
- **[scanner]** `SLOT` nodes and `INSTANCE` subtrees are out of scope.
- **[agent]** A bound value that looks odd is not a finding. A raw value serving a mechanism (progress fill, overlap) may be legitimate — mechanism recognition is judgment.
- **[scanner]** GRID-mode auto-layout nodes (`layoutMode === "GRID"`) bind gap via `gridRowGap`/`gridColumnGap`, never `itemSpacing`/`counterAxisSpacing` — those are stale on GRID nodes and reading them produces confirmed false positives. Branch on `layoutMode` before checking any gap property.

## 2. Naming

*Why:* a layer name is the only description most of a component ever gets. It is what a developer reads in Dev Mode, what a generated component gets called, and what a search has to match — so `Frame 12` doesn't merely look untidy, it deletes the one piece of authorial intent that survives export.

- **[scanner]** No Figma default names anywhere (`Frame 12`, `Rectangle 4`, `Instance`, `Component 1`, `Collection 1`).
- **[scanner]** Property naming follows a consistent, predictable pattern. (The pattern itself — suffixes, casing — is system.)
- **[agent]** Layer names are semantic — a script can catch defaults, only a reader can catch a misleading name.

## 3. Variant schema

*Why:* the variant grid is the component's public API. Its axis names and option values appear in every consumer's property panel and in generated code, so a defect here is copied into every instance and cannot be fixed without breaking them. This is the section where mistakes get most expensive to reverse.

- **[scanner]** Axis order follows a consistent grammar with state-like axes last. (The exact grammar: system.)
- **[scanner]** Boolean-style axes contain exactly their two options, ordered default-first.
- **[scanner]** No stray options left over from renames.
- **[scanner→agent]** Sparse variant grids (fewer variants than the axis product) are candidates only — if sparseness follows a consistent file-wide pattern, it is a house convention, not a gap.
- **[scanner]** No unused component properties — a property declared on the component but applied to no layer, i.e. not present in any descendant's `componentPropertyReferences`. *Why:* **Figma ignores the whole component when the library is published** (maintainer-confirmed 2026-08-08, reproduced on a live file). Not the property — the component. Consumers never receive it, and the library reports a successful publish, so the absence is discovered by whoever goes looking for a component that should be there. Figma marks it in the properties panel with a warning icon, which is easy to miss and impossible to see from outside the file. `error`, always, and it outranks anything cosmetic in the same queue.
- **[scanner→agent]** A variant axis whose only effect is toggling one subtree's visibility should be a boolean property instead. *Why:* it doubles the variant count for something a boolean expresses, and every axis added later multiplies against it. Agent-confirmed because the diff may have missed a second difference that justifies the axis.
- **[scanner→agent]** No variant axis with a single option. *Why:* an axis offering exactly one value gives consumers nothing to choose — it widens the API and stamps `Axis=Value` into every variant name while doing a constant's job. It is usually a remnant: options deleted down to one, a boolean that lost its pair, a migration that never got its second value. Agent-confirmed because a single-option axis can be deliberate — staged for planned options, or kept to mirror a sibling library's API — which is a ruling to record, not a defect; and removing or merging an axis is a breaking change, so a hit is always **Decide**, never a batch fix. (Maintainer-requested 2026-08-13; walked the same day — silent across a 54-set live library, fires on a purpose-built probe. Case A23.)

## 4. States

*Why:* states are the part of a component users actually experience and the part least visible while designing, because the canvas shows every state at once and the product shows one at a time. A state that renders identically to rest is indistinguishable from a working one on the canvas and completely broken in use.

- **[scanner]** Interactive components carry a state axis whose options match the system vocabulary, in the system order.
- **[scanner→agent]** Coverage: a component missing a state its archetype baseline includes is a candidate gap; whether it is intentional is judgment. Absence of a state library-wide is conformance, never a gap.
- **[scanner→agent]** Rendering: every non-rest state must produce a visible treatment. The script diffs subtrees — **including the variant root's own visual properties: `opacity`, fills, strokes, effects** (only its *name* is excluded, since that is `Axis=Value` by construction). Dimming the root is the commonest way Disabled renders; a state fill painted on the root or a `Content` frame is the commonest Hover/Press treatment — a diff blind to either flags correctly-built variants wholesale (44 false hits on one library, 2026-08-13; detail in `scanner-checks.md` §3.5a). The agent rules on borderline diffs and house patterns (shared overlay layers, focus rings), and confirms any survivor against a correctly-rendering sibling before reporting.
- **[agent]** A disabled or pressed state identical to rest is a product bug and outranks every cosmetic finding in the report.

## 5. Accessibility structure

(Structural checks only — never presented as a substitute for a specialist audit.)

*Why:* these are the accessibility defects that are structural rather than perceptual — present or absent in the file itself, and therefore findable without judging anyone's visual design. Keeping the section to that boundary is what stops the audit implying it has cleared a component for accessibility when it has only checked that a focus ring exists.

- **[scanner→agent]** Focus indication exists and visibly differs from rest on focusable components.
- **[scanner→agent]** Interactive targets meet a minimum size; text meets a minimum size. (The minimum: system if the library states one — then violations are errors; otherwise the WCAG reference values — **24×24 CSS px for target size, SC 2.5.8, AA** — and violations are questions. 44×44 is SC 2.5.5, AAA, a stricter and different criterion this skill does not claim to enforce by default; a real run confused the two and flagged nearly every interactive component in a library before the mistake was caught. Detail: `scanner-checks.md` §3.7b.)
- **[agent]** Text-on-surface contrast below WCAG AA is always a question, not a verdict — the fix usually belongs to the token. **Resolve across every mode the collection defines, not just the default.** Checking one mode is how a pairing that passes in light and fails in dark ships unnoticed: the canvas shows the mode the designer is working in, and the failing one is the one nobody opened.

## 6. Metadata

*Why:* the description is the only channel that reaches someone who never opens the file — a developer in Dev Mode, a teammate browsing the asset panel, a model reading the library. Everything else in this document governs what the component *is*; this governs whether anyone can find out.

- **[scanner]** Public components carry a non-empty, non-placeholder description. Empty blocks handoff.
- **[agent]** **The structure is not this skill's to define.** Take the project's heading set and order from its context document; the quality spec for writing one belongs to `figma-component-descriptions`. This skill detects gaps and never asserts a shape.

  *This bullet used to restate a five-part structure — Purpose · Behavior · Composition · Usage · Code-gen notes — and it was wrong twice over: it named "Purpose" as a heading where the owning skill has it as an unheaded lead paragraph, and it omitted `Don't`, which both captured projects use. So an audit could call a description complete with `Don't` missing, and could flag a heading that is deliberately absent. No standard fixes description headings: they vary by project on purpose, and `figma-component-descriptions` owns their shape, so a second definition living here could only drift from that one.*

- **[agent]** **Composition is the one content check this skill does make**, because it is the highest-leverage line and the most often skipped: naming the sub-components a component uses internally ("uses Avatar, Badge, IconButton") is what stops an AI or a new teammate reimplementing something that already exists. An absent Composition line on a composite component is its own finding, whatever the project's headings are called. Leaf components legitimately omit it.

  **What the check does NOT flag: a component whose only nested instances are icon payloads delivered through an `INSTANCE_SWAP` property.** A swapped icon is content the consumer supplies, not a part the component is built from, so naming it would not stop anyone reimplementing anything — which is the entire reason the Composition line exists. Resolve each nested instance to its main and ask whether it arrives through a swap property or is structural. Walked 2026-08-09 against one project's library: counting every nested instance made 6 of 7 undocumented components "composite", including `Interactive icon`, whose whole purpose is to be one swappable icon, and `Alert`, which composes nothing but `triangle-alert`/`info`/`check`. Excluding swap payloads left the two real findings — `Toggle`, which contains `_Switch button`, and `Breadcrumb item`, which contains `_Breadcrumb button`. Both are genuine structural parts and both descriptions omit Composition. This is the §3.10c mistake in another costume: a check that does not distinguish a payload from a part fires on nearly everything and teaches the maintainer to skim.
- **[agent]** Stale descriptions are worse than absent — check against the current axes/props before trusting one, not just against emptiness.
- **[scanner]** Private (system-prefixed) components require a description too, but a lighter one: a single sentence or two stating what it is and its role relative to its parent — not the project's full public structure. Empty is `warning`, not `hygiene` — it shows in the default report, just below public-component `error`s. (Full compact-format spec and write rules: the `figma-component-descriptions` skill, which this skill defers to for actually drafting and applying description text — this skill only detects the gap.)

## 7. Structure & composition

*Why:* structure is what decides whether a component survives contact with real content. Everything here is invisible while the component holds the placeholder text it was drawn with, and load-bearing the moment it holds anything else.

- **[scanner]** Auto-layout throughout; private-component prefix used only on private components.
- **Page organisation** is figma-standard rule 11, checked once per file by `figma-foundations-audit`, not by this skill.
- **[scanner]** No `GROUP` nodes inside a component. *Why:* a group has no layout behaviour of its own — it resizes to its bounding box and ignores the auto-layout rules around it, so a single group silently opts a subtree out of the layout system the rest of the component obeys. This is the specific, findable violation of the auto-layout rule above. (Candidate, from an external checklist.)
- **[scanner→agent]** Text a consumer would legitimately set should be exposed as a text property. **Variance across variants is evidence, never the trigger** — a single-variant component's text cannot vary by construction, and neither can text held identical across every variant of a set, so a check keyed on variance is blind to exactly the components most likely to be missing the property. Found 2026-08-14 on a live pass: a one-variant message card whose only content was a lorem paragraph with no property at all passed a full audit clean, and surfaced only when someone sat down to write its description and had to decide whether the message was settable. The maintainer's response — "you should have flagged this before" — is the right verdict: the defect was in scope and the check could not reach it. Ask the separating question from the start (**would a consumer ever legitimately set this string?**), and use variance only to rank what turns up. *Why:* content a consumer cannot reach is the most common reason an instance gets detached, and the detachment then reports as a §8 finding — the same defect twice, with the cause in this section. Agent-confirmed because some varying text is genuinely fixed per variant (a state label that is part of the state's meaning). **Excluded: text layers placed directly inside a `SLOT`** `[maintainer ruling 2026-08-13]` — slot content is replaced wholesale by the consumer, so it is placeholder, not interface, and a text property on it would go permanently unused. Ruled on a live finding: a sidebar's `Title` sitting directly inside its header slot had been queued for a text property it never needed. Text *deeper* inside a slot but owned by a nested component instance is that component's concern, not the slot host's.
- **[agent]** Open content areas use the system's slot mechanism consistently; a closed composition where a sibling is open is a question, not automatically a gap.
- **[scanner→agent]** **Text nodes hug vertically.** A `TEXT` node whose height is fixed — `textAutoResize: "NONE"`, or `layoutSizingVertical: "FIXED"` inside auto-layout — cannot grow, so longer content clips instead of reflowing. *Why:* the defect is invisible at rest. The component holds the string it was drawn with, looks correct, and fails only against real content — usually in production, in the locale nobody tested. Fixed height is the single most common cause of text clipping in a library that otherwise uses auto-layout correctly.

  Four legitimate exceptions, all of which the agent confirms rather than the scanner assuming: a deliberately truncating label (`textTruncation: "ENDING"` or `maxLines` set), text set to `FILL` vertically inside a stretched parent, a single-line control whose height is the control's spec (an input's inner text, a fixed-height table cell), and decorative or numeric text with a guaranteed maximum length. Anything else is a finding. Severity `warning`, and **user-visible** — it leads its bucket, because when it fails the user sees clipped words.

- **[agent]** Content resilience (overflow strategy on dynamic text) and composition fit (spacing ownership) are surfaced as questions per element, never verdicts. The vertical-hug rule above is the mechanical half of this; what remains here is the judgement half — horizontal strategy, wrapping behaviour, and which element owns the spacing when text grows.
- **[agent]** One responsibility per component set. An overloaded set (two unrelated jobs living in one component, distinguished only by a variant) is a boundary question, not a naming one — splitting it usually serves both humans and generated code better than any amount of description-writing.

## 8. Real instances, not detached frames

An AI reading the file via MCP sees a `FRAME` and an `INSTANCE` as fundamentally different things — a frame with no component reference is invisible as "an existing component" no matter how closely it resembles one, and gets faithfully reimplemented from scratch. This applies to the library file itself wherever example/usage frames sit alongside the real component pages (documentation pages, cover compositions, deprecated copies left after a rebuild).

- **[scanner]** On non-canonical pages (documentation, cover, deprecated, or any page outside the project's component pages — its `componentPages` filter, never a marker assumed here), flag any `FRAME`/`GROUP` node whose name matches or closely resembles an existing top-level component set name. This is the detached-duplicate signature.
- **[agent]** Confirm by inspection: a genuine detached copy usually has no `mainComponent` reference and drifted structure (missing recent token updates, stale naming). A frame that merely *contains* an instance (a compositional wrapper) is not a finding — check the node's own type and its children before flagging.
- **[agent]** Fix is almost never programmatic: replace the frame with a real instance of the matching component, then verify no visual regression. Always **Decide** or **Approve & I fix** depending on confidence, never auto-applied blind.
- **[scanner]** The inverse signature: an `INSTANCE` whose main component no longer exists. *Why:* it stops receiving updates while continuing to look correct, so it drifts silently and indefinitely — the failure is identical to a detached frame, but nothing about the node's type reveals it. (Candidate, from an external checklist.) A component with no locally-visible parent is only evidence of this when it also carries no publish key — with a key, a null parent just as often means a perfectly healthy remote component whose source file isn't connected this session, and the scanner must verify live (`figma.importComponentByKeyAsync`) before treating it as gone. Detail and the incident that found it: `scanner-checks.md` §3.10d.

## 9. Variant annotations (Dev Mode)

Distinct from descriptions. A description explains the *component family*; an annotation is the *spec sheet for one exact variant* — the kind of detail too specific for prose but too load-bearing to leave as tribal knowledge (cursor behavior, exact transition timing, an ARIA role that only applies to this state). Figma's Dev Mode MCP returns annotations as structured key/value pairs, which AI tools consume more reliably than prose buried in a description.

- **[scanner]** For each state-bearing variant in scope, check whether annotations exist at all (`figma_get_annotations` / the node's annotation list). Absence is not automatically an error — most variants don't need one — but its presence should correlate with variants that have behavior a screenshot can't convey (disabled cursor/opacity rules, motion specs, conditional visibility, accessibility roles).
- **[agent]** Judgment call per variant: does this state carry a spec detail that belongs in an annotation rather than prose? If yes and it's absent, that's a **Decide** item (draft the annotation, confirm the exact values with the maintainer — never invent a cursor or timing value). If the variant is purely visual with nothing to spec, absence is correct and silent.
- This is a genuinely new dimension relative to the rest of this skill's checks — most libraries will have written none of these yet. Expect the first audit of a library to surface this as a backlog, not a small fix list; treat it as its own conversation with the maintainer rather than folding it silently into Decide alongside one-off items.

## 10. Hidden and orphan layers

Hidden layers still ship through the MCP payload — an AI reading the file cannot tell "hidden because conditional" from "hidden because dead and forgotten," and both confuse generation.

- **[scanner]** Flag any `visible: false` layer inside a component set that is **not** referenced by a boolean property (i.e., nothing in `componentPropertyReferences` ties its visibility to a toggle). That combination — hidden, and not conditionally controlled — is the signature of dead weight.
- **[agent]** Two legitimate outcomes: the layer is genuinely dead (delete it — safe, non-breaking) or it represents a real conditional the property model never captured (model it as a boolean property — a bigger, Decide-level change). Never delete without confirming it isn't the second case.
- **[scanner]** Orphan layers — present in the tree, visible, but disconnected from any property, slot, or layout role a sibling of the same type has — are a lighter-weight version of the same candidate; report as hygiene unless they visibly affect layout.
- **[scanner]** Disabled paints: any entry in `fills`, `strokes` or `effects` whose own `visible` is `false`. *Why:* toggling a fill off in the panel does not remove it — the paint stays in the array, contributing nothing visually while still carrying a colour, a binding and a maintenance cost. It also reads as intent to a later editor, who cannot tell an abandoned experiment from a deliberately staged alternative. **Hygiene**, always: it affects nothing a user sees, so it belongs in the tracked queue rather than the default report. (Candidate, from an external checklist.)

## 11. Reporting-side universals

*Why:* an audit's credibility is spent, not earned — a maintainer who acts on one wrong finding discounts the next twenty, including the correct ones. These rules exist to keep the report worth reading rather than to keep it complete.

- A finding on **every** instance of something is evidence the check is wrong or the pattern is a house rule — investigate, don't report.
- Withdrawn findings are withdrawn plainly, not restated as softened concerns.
- Unscanned areas are named; silence is only meaningful where scanning happened.
