# Universal conventions

Portable rules that hold in any well-formed component library. None encodes a particular system's vocabulary. Wherever a rule needs a concrete value (a scale, a state list, a suffix), it defers to the active library's rulebook. That is the project's context document, or the local `systems/` cache standing in for it.

## Contents

- [How to read the rules](#how-to-read-the-rules)
- [1. Token binding](#1-token-binding)
- [2. Naming](#2-naming)
- [3. Variant schema](#3-variant-schema)
- [4. States](#4-states)
- [5. Accessibility structure](#5-accessibility-structure)
- [6. Metadata](#6-metadata)
- [7. Structure & composition](#7-structure--composition)
- [8. Real instances, not detached frames](#8-real-instances-not-detached-frames)
- [9. Variant annotations (Dev Mode)](#9-variant-annotations-dev-mode)
- [10. Hidden and orphan layers](#10-hidden-and-orphan-layers)
- [11. Reporting-side universals](#11-reporting-side-universals)

## How to read the rules

Each rule is tagged with the layer that owns it:

| Tag | Meaning |
|---|---|
| **[scanner]** | Fully decidable by script |
| **[agent]** | Requires judgement |
| **[scanner→agent]** | The script surfaces candidates and the agent decides |

Each section states **why** it exists before its rules. Every `[agent]` and `[scanner→agent]` rule is a judgement call. A detector without a stated intent produces confident false positives (toolkit-standard §D 18). A checker that knows what a rule is *for* can tell a violation from a mechanism serving the same end.

Where a reason cites no incident, it states the mechanism instead. Rules that came from outside this toolkit, such as an external checklist or another system's documentation, are **candidates** until a run here confirms them. They say so.

## 1. Token binding

*Why:* a raw value is a decision that cannot be changed centrally. It survives every theme switch, rebrand and scale revision untouched. It is also invisible: nothing about a hard-coded 12 says it was meant to be `Spacing/12`. Binding is what makes a library a system rather than a set of drawings.

- **[scanner]** Every non-zero padding, gap and per-corner radius is bound to a variable. Raw values are defects. Which collection and which scale is the system's.
- **[scanner]** Every visible fill and stroke colour is bound. The semantic-or-primitive policy is the system's.
- **[scanner]** Stroke weight binds through the four per-side properties (`strokeTopWeight` and its siblings) or the shorthand. Reading only the shorthand flags correctly bound strokes, so check all five.
- **[scanner]** Every text node carries a text style and bound `fontFamily` and `fontSize`. It also binds a weight, as `fontStyle` or as a number variable on `fontWeight`. Weight is the most often missed.
- **[scanner]** Bindings resolve to an allow-listed collection **key**, since names are not unique across libraries. The allow-list itself is the system's.
- **[scanner]** Gap exemptions: `SPACE_BETWEEN` gaps are ignored entirely. A single-child (inert) unbound gap is hygiene, not an error.
- **[scanner]** `SLOT` nodes and `INSTANCE` subtrees are out of scope.
- **[agent]** A bound value that looks odd is not a finding. A raw value serving a mechanism (a progress fill, an overlap) may be legitimate: mechanism recognition is judgement.
- **[scanner]** GRID auto-layout nodes bind their gap through `gridRowGap` and `gridColumnGap`. Their `itemSpacing` and `counterAxisSpacing` are stale, and reading them produced confirmed false positives. Branch on `layoutMode` before checking any gap property.

## 2. Naming

*Why:* a layer name is the only description most of a component ever gets. A developer reads it in Dev Mode, a generated component is called by it, and a search has to match it. So `Frame 12` is not merely untidy: it deletes the one piece of authorial intent that survives export.

- **[scanner]** No Figma default names anywhere: `Frame 12`, `Rectangle 4`, `Instance`, `Component 1`, `Collection 1`.
- **[scanner]** Property naming follows a consistent, predictable pattern. The pattern itself (suffixes, casing) is the system's.
- **[agent]** Layer names are semantic. A script can catch defaults; only a reader can catch a misleading name.

## 3. Variant schema

*Why:* the variant grid is the component's public API. Its axis names and option values appear in every consumer's property panel and in generated code. A defect here is copied into every instance and cannot be fixed without breaking them. Mistakes in this section are the most expensive to reverse.

- **[scanner]** Axis order follows a consistent grammar, with state-like axes last. The exact grammar is the system's.
- **[scanner]** Boolean-style axes contain exactly their two options, default first.
- **[scanner]** No stray options left over from renames.
- **[scanner→agent]** Sparse variant grids (fewer variants than the axis product) are candidates only. If the sparseness follows a consistent file-wide pattern, it is a house convention, not a gap.
- **[scanner→agent]** A variant axis whose only effect is toggling one subtree's visibility should be a boolean property. *Why:* it doubles the variant count for something a boolean expresses, and every later axis multiplies against it. The agent confirms, because the diff may have missed a second difference that justifies the axis. The change is breaking: instances on the deleted side's variants are orphaned silently.

**[scanner] No unused component properties**. An unused property is one declared on the component but applied to no layer: no descendant's `componentPropertyReferences` holds it. *Why:* **Figma ignores the whole component when the library is published** (maintainer-confirmed, reproduced on a live file). Not the property: the component. Consumers never receive it, and the library reports a successful publish.

The absence is found only by whoever looks for a component that should be there. Figma marks it with a warning icon in the properties panel, easy to miss and invisible from outside the file. It is an `error`, always, and outranks anything cosmetic in the same queue.

**[scanner→agent] No variant axis with a single option**. *Why:* such an axis gives consumers nothing to choose. It widens the API and stamps `Axis=Value` into every variant name while doing a constant's job. It is usually a remnant: options deleted down to one, a boolean that lost its pair, or a migration that never got its second value.

The agent confirms, because a single-option axis can be deliberate. It may be staged for planned options, or kept to mirror a sibling library's API; that is a ruling to record, not a defect. Removing or merging an axis is a breaking change, so a hit is always **Decide**, never a batch fix. The check was walked silent across a 54-set live library and fires on a purpose-built probe (case A23).

## 4. States

*Why:* states are the part of a component users actually experience, and the part least visible while designing. The canvas shows every state at once; the product shows one at a time. A state that renders like rest looks fine on the canvas and is broken in use.

- **[scanner]** Interactive components carry a state axis whose options match the system vocabulary, in the system order.
- **[scanner→agent]** Coverage: a component missing a state its archetype baseline includes is a candidate gap. Whether it is intentional is judgement. A state absent library-wide is conformance, never a gap.
- **[agent]** A disabled or pressed state identical to rest is a product bug. It outranks every cosmetic finding in the report.

**[scanner→agent] Rendering: every non-rest state must produce a visible treatment**. The script diffs subtrees, **including the variant root's own visual properties: `opacity`, fills, strokes, effects**. Only the root's *name* is excluded, since it is `Axis=Value` by construction.

Dimming the root is the commonest way Disabled renders. A state fill on the root or a `Content` frame is the commonest Hover and Press treatment. A diff blind to either flags correctly built variants wholesale: 44 false hits on one library ([scanner-checks.md](scanner-checks.md) §3.5a). The agent rules on borderline diffs and house patterns (shared overlay layers, focus rings). It confirms any survivor against a correctly rendering sibling before reporting.

## 5. Accessibility structure

These are structural checks only, never presented as a substitute for a specialist audit.

*Why:* these defects are structural rather than perceptual. They are present or absent in the file itself, so they are findable without judging anyone's visual design. Keeping to that boundary stops the audit implying it cleared a component for accessibility when it only checked that a focus ring exists.

- **[scanner→agent]** Focus indication exists and visibly differs from rest on focusable components.
- **[agent]** Text-on-surface contrast below WCAG AA is always a question, not a verdict; the fix usually belongs to the token. **Resolve it across every mode the collection defines, not just the default**. The canvas shows the designer's working mode. A pairing that fails in dark ships unnoticed because nobody opened dark.

**[scanner→agent] Interactive targets meet a minimum size, and text meets a minimum size**. The minimum is the system's if the library states one; violations are then errors. Otherwise use the WCAG reference values, and violations are questions. For target size that is **24×24 CSS px, SC 2.5.8, AA**.

44×44 is SC 2.5.5, AAA: a stricter, different criterion this skill does not enforce by default. A real run confused the two and flagged nearly every interactive component in a library. Detail: [scanner-checks.md](scanner-checks.md) §3.7b.

## 6. Metadata

*Why:* the description is the only channel that reaches someone who never opens the file. That is a developer in Dev Mode, a teammate browsing the asset panel, or a model reading the library. The rest of this document governs what the component *is*; this governs whether anyone can find out.

- **[scanner]** Public components carry a non-empty, non-placeholder description. Empty blocks handoff.
- **[agent]** Stale descriptions are worse than absent. Check one against the current axes and properties before trusting it, not just against emptiness.

**[agent] The structure is not this skill's to define**. Take the project's heading set and order from its context document. The quality spec for writing one belongs to `figma-component-descriptions`. This skill detects gaps and never asserts a shape.

No standard fixes description headings: they vary by project on purpose. A second definition here could only drift from the owning skill's. An earlier copy of a five-part structure did drift: it made "Purpose" a heading where the owner has an unheaded lead, and it omitted `Don't`.

**[agent] Composition is the one content check this skill does make**. It is the highest-leverage line and the most often skipped. Naming the sub-components a component uses internally ("uses Avatar, Badge, IconButton") stops an AI or a new teammate reimplementing something that exists. An absent Composition line on a composite component is its own finding, whatever the project's headings are called. Leaf components legitimately omit it.

**What Composition does NOT flag: a component whose only nested instances are icons delivered through an `INSTANCE_SWAP` property**. A swapped icon is content the consumer supplies, not a part the component is built from. Naming it would stop no one reimplementing anything. Resolve each nested instance to its main, and ask whether it arrives through a swap property or is structural.

On one live library, counting every nested instance made 6 of 7 undocumented components "composite". They included `Interactive icon`, one swappable icon, and `Alert`, which composes only `triangle-alert`, `info` and `check`.

Excluding swap payloads left the two real findings: `Toggle` (holds `_Switch button`) and `Breadcrumb item` (holds `_Breadcrumb button`). A check that cannot tell a payload from a part fires on nearly everything and teaches the maintainer to skim.

**[scanner] Private (system-prefixed) components need a description too, but a lighter one**. One or two sentences state what it is and its role relative to its parent, not the project's full public structure. Empty is `warning`, not `hygiene`: it shows in the default report, just below public-component `error`s. The compact format and the write rules belong to `figma-component-descriptions`, which drafts and applies the text. This skill only detects the gap.

## 7. Structure & composition

*Why:* structure decides whether a component survives real content. Everything here is invisible while the component holds its placeholder text, and carries weight the moment it holds anything else.

- **[scanner]** Auto-layout throughout. The private-component prefix is used only on private components.
- **Page organisation** is figma-standard rule 11, checked once per file by `figma-foundations-audit`, not by this skill.
- **[scanner]** No `GROUP` nodes inside a component. *Why:* a group has no layout behaviour of its own. It resizes to its bounding box and ignores the auto-layout rules around it, so one group opts a subtree out of the layout system. This is the findable violation of the auto-layout rule above. (Candidate, from an external checklist.)
- **[agent]** Open content areas use the system's slot mechanism consistently. A closed composition where a sibling is open is a question, not automatically a gap.
- **[agent]** Content resilience (overflow strategy on dynamic text) and composition fit (spacing ownership) are questions per element, never verdicts. The vertical-hug rule below is the mechanical half. The judgement half is horizontal strategy, wrapping, and which element owns the spacing when text grows.
- **[agent]** One responsibility per component set. An overloaded set holds two unrelated jobs, told apart only by a variant. That is a boundary question, not a naming one. Splitting it usually serves humans and generated code better than any description.

**[scanner→agent] Text a consumer would legitimately set is exposed as a text property**. Ask the separating question from the start: **would a consumer ever legitimately set this string?** Use variance across variants only to rank what turns up. **Variance is evidence, never the trigger.**

A single-variant component's text cannot vary, nor can text held identical across a set. A check keyed on variance is blind to exactly the components most likely to miss the property. A one-variant message card holding a lorem paragraph, with no property, once passed a full audit clean. It surfaced only when someone wrote its description.

*Why:* content a consumer cannot reach is the commonest reason an instance gets detached. The detachment then reports as a §8 finding: the same defect twice, with the cause here. The agent confirms, because some varying text is genuinely fixed per variant, such as a state label that is part of the state's meaning.

**Excluded: text layers placed directly inside a `SLOT`** (maintainer ruling). Slot content is replaced wholesale by the consumer, so it is placeholder, not interface, and a text property on it would go unused. Text *deeper* inside a slot but owned by a nested instance is that component's concern, not the slot host's.

**[scanner→agent] Text nodes hug vertically**. A `TEXT` node with a fixed height cannot grow, so longer content clips instead of reflowing. Fixed means `textAutoResize: "NONE"`, or `layoutSizingVertical: "FIXED"` inside auto-layout. *Why:* the defect is invisible at rest. The component looks correct with its drawn string and fails only on real content, usually in production, in an untested locale.

Fixed height is the commonest cause of text clipping in a library that otherwise uses auto-layout well. The agent confirms four legitimate exceptions rather than the scanner assuming them:

| Exception | Example |
|---|---|
| A deliberately truncating label | `textTruncation: "ENDING"`, or `maxLines` set |
| Text set to fill vertically | `FILL` inside a stretched parent |
| A single-line control whose height is its spec | An input's inner text, a fixed-height table cell |
| Text with a guaranteed maximum length | Decorative or numeric text |

Anything else is a finding. Severity `warning`, and **user-visible**: it leads its bucket, because when it fails the user sees clipped words.

## 8. Real instances, not detached frames

An AI reading the file through MCP sees a `FRAME` and an `INSTANCE` as different things. A frame with no component reference is not "an existing component", however closely it resembles one, and gets reimplemented from scratch. This applies wherever example or usage frames sit beside the real component pages: documentation pages, cover compositions, deprecated copies left after a rebuild.

- **[scanner]** On non-canonical pages, flag any `FRAME` or `GROUP` whose name matches or closely resembles a top-level component set name. This is the detached-duplicate signature. Non-canonical means outside the project's `componentPages` filter, never a marker assumed here: documentation, cover, deprecated.
- **[agent]** Confirm by inspection. A genuine detached copy usually has no `mainComponent` reference and a drifted structure (missing recent token updates, stale naming). A frame that merely *contains* an instance (a compositional wrapper) is not a finding: check the node's own type and its children first.
- **[agent]** The fix is almost never programmatic: replace the frame with a real instance of the matching component, then verify no visual regression. It is **Decide** or **Approve & I fix** by confidence, never auto-applied blind.

**[scanner] The inverse signature: an `INSTANCE` whose main component no longer exists**. *Why:* it stops receiving updates while still looking correct, so it drifts silently. The failure equals a detached frame's, but the node's type does not reveal it. (Candidate, from an external checklist.)

A main with no locally visible parent is evidence of this only when it also carries no publish key. With a key, a null parent just as often means a healthy remote component whose source file is not connected this session. The scanner must then verify live (`figma.importComponentByKeyAsync`) before treating it as gone. Detail: [scanner-checks.md](scanner-checks.md) §3.10d.

## 9. Variant annotations (Dev Mode)

Annotations are distinct from descriptions. A description explains the *component family*; an annotation is the *spec sheet for one exact variant*. It holds detail too specific for prose but too important to leave unwritten. Examples are cursor behaviour, exact transition timing, or an ARIA role for one state. Figma's Dev Mode MCP returns annotations as structured key/value pairs, which AI tools read more reliably than prose.

- **[scanner]** For each state-bearing variant in scope, check whether annotations exist at all (`figma_get_annotations`, or the node's annotation list). Absence is not automatically an error: most variants need none. Presence should go with behaviour a screenshot cannot convey: disabled cursor and opacity rules, motion specs, conditional visibility, accessibility roles.
- **[agent]** Judge per variant whether the state carries spec detail that belongs in an annotation rather than prose. If it does and the annotation is absent, that is a **Decide** item. Draft the annotation and confirm the exact values with the maintainer: never invent a cursor or timing value. A purely visual variant with nothing to spec is correctly silent.
- This dimension is new compared with the rest of this skill's checks, and most libraries have written no annotations yet. Expect a library's first audit to surface a backlog, not a small fix list. Treat it as its own conversation with the maintainer, not folded silently into Decide.

## 10. Hidden and orphan layers

Hidden layers still ship through the MCP payload. An AI reading the file cannot tell "hidden because conditional" from "hidden because dead", and both confuse generation.

- **[scanner]** Flag any `visible: false` layer inside a component set that no boolean property references: nothing in `componentPropertyReferences` ties its visibility to a toggle. Hidden and not conditionally controlled is the signature of dead weight.
- **[agent]** Two legitimate outcomes. The layer is dead: delete it. Or it is a real conditional the property model never captured: model it as a boolean property, a bigger, Decide-level change. Never delete without ruling out the second.
- **[agent]** Deleting the layer is breaking unless no instance shows it: a consumer can turn a hidden layer on and type into it. Library analytics or a search of consuming files tells.
- **[scanner]** Orphan layers are a lighter version of the same candidate. They are in the tree and visible, but disconnected from any property, slot or layout role a same-type sibling has. Report them as hygiene unless they visibly affect layout.

**[scanner] Disabled paints: any entry in `fills`, `strokes` or `effects` whose own `visible` is `false`**. *Why:* toggling a fill off in the panel does not remove it. The paint stays in the array, adding nothing visible while carrying a colour, a binding and a maintenance cost. A later editor cannot tell an abandoned experiment from a staged alternative.

**Hygiene**, always: nothing a user sees changes, so it belongs in the tracked queue, not the default report. (Candidate, from an external checklist.)

## 11. Reporting-side universals

*Why:* an audit's credibility is spent, not earned. A maintainer who acts on one wrong finding discounts the next twenty, the correct ones included. These rules keep the report worth reading rather than complete.

- A finding on **every** instance of something is evidence the check is wrong or the pattern is a house rule. Investigate; do not report.
- Withdrawn findings are withdrawn plainly, not restated as softened concerns.
- Unscanned areas are named. Silence means something only where scanning happened.
