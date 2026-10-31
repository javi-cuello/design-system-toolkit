# Component Description Guide

A reference for AI agents writing Figma component descriptions for any design system library. It is library-agnostic: it assumes nothing about specific axis names, roles, or component sets. Treat any concrete names below as examples, not expectations.

---

## System file

Per-project specifics (internal prefix, authoring dialect, punctuation constraints, section heading spelling, building-block grouping, slot-only signals, virtual set separator, header component/body layer names) are **not** stored in this guide. This guide is portable — the same file applies whether the target is a web app library, a mobile library, or any other Figma file.

Instead, project-specific settings live in the project's context document, keyed by the Figma `fileKey` (a local `systems/<library-name>.md` cache may hold a copy). SKILL.md workflow step 0 covers hydrating from it, or discovering what it marks `[TBD]`. Never reuse one library's settings against a different `fileKey` — a rule discovered from one library's evidence has no authority over another.

Everything below this section is generic and assumes a rulebook has already been loaded into context. Where this guide says "the internal prefix" or "the header component name," it means the value the rulebook provides — never a hardcoded default.

---

## Goal

Write a description for each consumer-facing public component. Descriptions are applied via `figma_set_description` using the `descriptionMarkdown` parameter, which renders rich text (headings, lists) in Figma's component panel and Dev Mode.

Three kinds of component are skipped, all decided in step 2 of the workflow:

1. **Internal components**, conventionally prefixed with `_`.
2. **Slot fillers**, published but only composed into a parent on the same page (see below).
3. **Components sitting alone on their page**, where the page holds no content outside the component itself. Usually re-published system or platform chrome.

Separately, two or more published components sharing a name prefix before the separator form a **virtual set** and share one description between them.

---

## Slot-only children

Some components are published yet are only meant to be composed into a parent component on the same page. A Tab item used inside a Tab bar is the canonical case: it is a real published component set, but no consumer places a Tab item directly.

**A slot-only child takes the compact description, not the full structured one** — one to two sentences, no headings, stating what it is and which component composes it. This is the same form private components take, and for the same reason: the parent carries the usage guidance, so repeating axis-by-axis behaviour on the child duplicates it in a second place that will drift. **Name the child in the parent's Composition section too**, so code generation still imports it rather than reimplementing it.

So two independent triggers put a component on the compact form: **it is unpublished** (carries the library's internal prefix), **or** it is a subcomponent published only because a parent uses it: every use sits inside other components on its own page, in a slot or directly. A component used anywhere off its own page keeps the full form. Either is sufficient. `scripts/verify.js` derives the second from real instances (`derivedCompact`).

**The trigger is structural, never the name.** A child called `Tab item` and one called `Menu` are decided the same way — by where the component is actually used, resolved from real instances. Naming patterns like a trailing "item" are not evidence and must not be used as a shortcut `[maintainer ruling 2026-08-09]`.

*This section said "do not write a standalone description" until 2026-08-09. That was wrong in the direction that loses information: it left real published components with nothing at all, so a consumer who did open one found blank metadata and no pointer to its parent. Compact says the same thing in two sentences and keeps the pointer.*

Identify slot-only children using these signals, in order of reliability:

1. **Project grouping**: The project may separate slot-only parts from consumer components by placing them in a dedicated section or frame; for example, a "Parts" frame beside a "Component" frame. Check the rulebook's Building-block grouping setting, then skip anything under it.
2. **Explicit list**: If grouping is not reliable, check the rulebook for an explicit list of slot-only names, or a ruling on how the file's privacy convention extends beyond its prefix — a library whose rulebook records one is the worked example.
3. **Structural evidence**: The component appears only as a nested instance or instance-swap inside a single parent component on the same page, and nowhere as a directly placed consumer component. Treat such a component as slot-only.

**Resolving the parent — the trap that makes this test lie.** To find what composes a child, walk up from each instance to the nearest ancestor that is *either* a component root *or* an instance of one, resolving that instance to its main. Walking only to the nearest **component root** skips straight through any intervening instance and attributes the child to its grandparent. A menu option nested in a menu nested in a combobox then reads as "used by Combobox" — several different parents on several different pages — and the slot-only test fails on a component that is textbook slot-only. Found 2026-08-09: the flawed walk reported four parents across three pages for a child that has exactly one, and it was given a full structured description on that basis.

   Two more things this test needs. **A virtual set counts as one parent**, so a child composed into both members of a `Foo / A` + `Foo / B` pair has one parent, not two — compare parent name stems. And **documentation example instances placed loose on a page are not consumer usage**; counting them as direct placement disqualifies almost every real slot-only child, since these pages exist to show the component in use.

Signal 1 is a project-declared convention, which is why it is allowed to reference a frame. It is not an invitation to infer subjects from layout generally: workflow step 2d still applies, and where no such convention has been recorded, canvas position decides nothing.

### Resolving slot-only children

Before applying the slot-only heuristic, check whether the library states its own privacy convention: most commonly a naming prefix on private components. That convention takes precedence over the heuristic:

- Child component **carries the internal prefix** → private. Skip it, and reference it in the parent's Composition.
- Child component **has no prefix** and the library uses the prefix consistently elsewhere → the library has published it deliberately. Treat as consumer-facing unless the user says otherwise.
- **No privacy convention in the file** → fall back to the slot-only heuristic and skip children that only ever compose into a parent on the same page.

When the convention and the heuristic disagree, ask rather than choosing. Gather this evidence before asking, because it usually decides the answer:

- Whether sibling children on the same page already carry descriptions. Existing descriptions on some children are a precedent that the project documents them; a single undocumented sibling among documented ones is more likely an oversight than a policy.
- Whether the same conceptual child is prefixed on one page and unprefixed on another. That contrast is deliberate and tells you the unprefixed one is public.

Present the evidence with the question so the user is confirming a reading rather than starting from scratch. Do not rely on the absence of an existing description alone as a signal, since consumer components can also be undocumented.

---

## Writing for a virtual set

When published components share a name prefix before the separator, consumers read them as one component with a subpart axis, so they get one shared description applied identically to each member.

- Open with the group as subject, not any one member: "A top bar sits at the top of a screen", never "A top bar / Default is". The reader may have selected any member.
- Name the subparts and what each is for, so the reader can tell which to pick. This replaces the Disambiguation that separate components would need.
- Build the interface sections from the **union** of the members' props, and attribute anything that differs: "the options differ by subpart: Default offers Back and Close; Main offers neither".
- Never claim an axis value that only one member has as though the whole set had it.
- Don't items apply to the whole set, so phrase them against the subpart they constrain: "Use Main on a screen the user needs to navigate back from" rather than a bare "Use without a Back control".

---

## Structure

Every description follows the same section order. Include a section only when it carries real information, and omit it otherwise. Never pad a section to fill the shape.

```markdown
[Purpose paragraph: no heading]

## Behaviour
- [What the axes and states do]

## Composition
- [Nested sub-components, by name]
- [Open content slots and swappable props]

## Usage
- [When and how to use it, variant selection order]

## Don't
- [Misuse cases, each naming the correct alternative]

## Code gen notes
- [Import instructions, slot handling, tokens, code-owned states]
```

**Section rules:**
- The purpose paragraph opens the description and has no heading.
- Headings render from `##`: always use `##`, never plain text labels.
- List items use `-` and render as bullets: never type manual `•` characters.
- One blank line between the purpose paragraph and each heading, and between sections.
- Omit any of Behaviour, Composition, Usage, Don't, Code gen notes when the component has nothing meaningful to say there. A small static component may only need a purpose paragraph plus Usage and Don't.

---

## What goes in each section

### Purpose (opening paragraph)
- Component name as the subject, user benefit not implementation.
- Name the key axes that define the component and what they select, in plain terms.
- Keep it to one to three sentences.

Behaviour and Composition below are what the skill's generator produces from the interface (SKILL.md step 5); the rules are kept here so a line that reads wrong can be judged against them and fixed in the generator.

### Behaviour
- What each axis or state changes, described by its verbatim name.
- Interactive states are set by code. List only the states the component actually has, in the order they appear on the State axis, and say the code manages them. Where a component only has a resting state plus a disabled axis, note just that the disabled state is code-managed.
- Runtime behaviour the code owns: opening and closing, animation, focus handling, sorting, scrolling.

### Composition (highest-value section)
- List every nested sub-component by its exact name so code generation imports it rather than rebuilding it. This is the single most useful signal for downstream code-gen.
- Note open content slots explicitly: an empty slot takes any custom content, and that content is passed in rather than hardcoded.
- Note swappable props (instance-swap) by their exact prop name, and what they swap.
- **Do not infer nesting from a single variant.** A sub-component that a boolean or variant axis reveals is absent from variants where that axis is off. Scan the whole set, and when a sub-component appears only under a particular axis value, mark it conditional ("revealed by the `<Boolean>` prop") rather than stating it unconditionally.
- A component that pairs with another component not nested inside it belongs in Usage as a pairing, not here. Composition is for what the component actually contains.
- Omit this section entirely for flat components with no sub-components, no slots, and no swaps.

### Usage
- When and how to use it, grouping and placement rules, content guidance.
- Variant selection order for multi-axis components: state which axis to choose first, then the next, and note that interactive states are set by code and not applied in static designs.

### Don't
- Misuse cases, each one directly countering a Usage item or closing a loophole.
- Always name the correct alternative component for the misuse.

### Code gen notes
- Import instructions for each nested sub-component named in Composition.
- Slot handling: content passed through the slot as children, not hardcoded.
- Swappable props resolved by their prop, not recreated.
- Interactive states defined by code, not generated as static variants.
- Values that come from tokens (colour, spacing, radius, elevation) are not hardcoded.

---

## Compact structure (internal-prefixed components)

Components matching the Internal prefix are private building blocks, not consumer-facing subjects — they never get the full Structure above. They still get a description, because an AI or new teammate reading the file via MCP sees an internal-prefixed component exactly as readily as a public one; an undocumented private component is a broken link the moment a public component's Composition section names it.

```markdown
[One to two sentences: what it is, and its role relative to its parent. No heading, no sections, no bullets.]
```

- **Content**: what the piece is, plus either what it's split out for (a reason, not just a restatement of the name) or which parent(s) use it. State names quoted verbatim where they matter to the sentence, same as the full structure.
- **Length discipline is the whole point.** If a private component's description grows past two sentences or starts wanting a Composition/Usage section, that's a signal the component may actually deserve to be public — flag it in the report rather than writing a long private description.
- Never write Behaviour, Composition, Usage, Don't, or Code gen notes for a private component, even when the information is known. That structure exists to serve consumers choosing between variants; a private component has no such consumer.
- Applied the same way as a full description (`descriptionMarkdown` via `figma_set_description` / batched writes), and re-read after writing, same as step 6/8.
- Virtual-set grouping (2c) does not apply to private components — each is described individually against its own parent relationship, since the grouping rule exists for consumer-facing naming families, which private components aren't part of.
- Skip entirely: private components already carrying a description (report with a preview per existing step 9 behavior, still don't overwrite unasked), and any private component that fails step 2e (sits alone on its page — some libraries do stash unused private parts this way).

**Worked example:**

> The individual row inside `Sidebar (Secondary)`; renders one navigation item's icon, label, and selected/hover state. Not used outside the parent sidebar section.

---

## Content rules

- **Verbatim names**: Prop names, axis names, and variant or state values are quoted exactly as they appear in Figma. Do not paraphrase, re-case, or translate them, even when the surrounding prose is in another language. They map directly to the Figma UI and to code.
- **Strip property key suffixes**: Component property keys returned by `componentPropertyDefinitions` carry a `#nodeId` suffix on non-variant properties, so a boolean named `Icon` appears as `Icon#0:45`. Strip everything from `#` onwards before quoting the name. The suffix is an internal identifier and never appears in the Figma UI.
- **Anatomy and disambiguation**: When similar components exist, state when to choose this one and when to choose a sibling instead. This is the most critical signal for AI decision-making; place it in the purpose paragraph or in Usage and Don't.
- **Interactive states**: Never instruct designers to build Hover, Focus, Press, or Loading states manually. Always frame them as code-managed, listing only the states present.
- **Slots and swaps over "cannot be customised"**: Do not claim a container is fixed or uncustomisable without checking. If it exposes a content slot or a swappable prop, document that instead. Only describe a component as fixed when it genuinely has no slot and no swap.
- **Length**: Two to three bullets for simple components, three to five for complex or semantic ones. Never pad.
- **Cross-referencing**: Name sibling components explicitly in disambiguation lines and Don't items, so the documentation forms an interconnected system.
- **Tone**: Prescriptive and concise. No full stops at the end of list items.

---

## Reference examples

### Button: multi-axis component with composition and variant order

```markdown
A button triggers an action or event. The Role axis defines visual hierarchy: Primary for the main action, Secondary for supporting actions, Tertiary for low-emphasis actions, and Ghost for minimal prominence.

## Behaviour
- The Loading state indicates the action is in progress
- Interactive states (Focus, Hover, Press, Loading) and Disabled are managed by code and not applied in static designs

## Composition
- The icon is swapped through the Icon swap prop; import the icon component rather than recreating it

## Usage
- Use Primary for the single most important action in a screen or dialog
- Use Secondary for supporting actions, Tertiary for low emphasis, and Ghost for minimal prominence
- Choose Role first based on hierarchy, then Breakpoint based on platform
- Limit Primary buttons to one per context

## Don't
- Use more than one Primary button in the same context
- Use Primary for navigation: use a link or a Tertiary button
- Disable a button without communicating why the action is unavailable

## Code gen notes
- The icon is swapped via the Icon swap prop; import the icon component instead of recreating it
- Interactive states are defined by code; do not generate static variants for them
- Spacing and colour come from tokens; do not hardcode values
```

### Text input: input component with disambiguation

```markdown
A text input allows users to enter a single line of free-form text. The Validation axis surfaces an Error state with its message, and Layout controls the label position (Vertical or Horizontal).

## Behaviour
- The Validation axis activates the Error state with its associated message
- Interactive states (Focus, Hover) and Disabled are managed by code and not applied in static designs

## Usage
- Use for short, single-line entry such as names, email addresses, or identifiers
- Always provide a visible label for accessibility
- Set Validation based on form state and Layout based on the label position

## Don't
- Use for multi-line entry: use a text area
- Use for selecting from a fixed list: use a dropdown input
- Use without a visible label

## Code gen notes
- Validation maps to the form's validation state
- Interactive states are defined by code; do not generate static variants for them
```

### Card: container with an open content slot

```markdown
A card is a generic container that groups related content within a bounded surface. The Content slot takes any custom content.

## Composition
- The Content slot takes any custom content

## Usage
- Use as a flexible container to group related content under one theme
- Fill the Content slot with whatever components each case requires
- Keep a single purpose per card

## Don't
- Use when the content is fixed and structured: use a specialised card instead
- Nest cards within cards without a clear hierarchy

## Code gen notes
- Content is passed through the Content slot; do not hardcode it
- Padding, radius, and elevation come from tokens; do not hardcode values
```

### Spinner: flat static component (purpose plus Usage and Don't only)

```markdown
A spinner communicates that a process is loading when the duration is unknown. The Size axis offers Small and Large, and Inverted adapts it to dark backgrounds.

## Usage
- Use for short, indeterminate loading states
- Centre it within the area it represents while loading
- Enable Inverted over dark or coloured backgrounds

## Don't
- Use for deterministic progress: use a progress bar
- Use multiple spinners on one screen: consolidate loading states

## Code gen notes
- The animation is controlled by code; do not generate static frame variants
```

---

## Writing translations (aside)

By default, write descriptions in English, or the authoring language set in the rulebook if the project overrides it. Everything above assumes that default. Do not switch to another language unless the user explicitly asks; a previous conversation being in another language is not a reason to default to it. This section applies only when the user asks for descriptions in another language.

When writing in another language:

- **Translate the prose and the section headings.** Localise the purpose paragraph, all bullet content, and the `##` headings themselves. For example, a Spanish set of headings is: Comportamiento, Composición, Uso, No hacer, Notas de generación de código, with the purpose paragraph left unheaded as usual.
- **Keep names verbatim in the source language.** Prop names, axis names, and variant or state values are never translated: Role, Breakpoint, Feedback, Validation, Selected, Disabled, and states such as Focus, Hover, Press, Loading stay exactly as they appear in Figma. They are identifiers that map to the UI and to code, so translating them breaks the mapping.
- **Use one canonical phrasing for the interactivity line, applied identically across the whole catalogue.** Pick a single localised sentence and reuse it verbatim everywhere, inserting only the states each component has, in axis order. Consistency across the set matters more than per-component variation. A Spanish example: "Los estados interactivos (Focus, Hover, Press) y Disabled los gestiona el código; no se aplican manualmente en el diseño".
- **Keep the same section structure and omission rules.** Translation changes the language, not the shape of the description.

---

## Tooling

The MCP calls for enumerating, inspecting, applying, and verifying descriptions live in the skill's operational steps in `SKILL.md`, and the verification checks are in `scripts/verify.js`. This guide covers only what to write, not how to apply it.
