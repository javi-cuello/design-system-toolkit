# Component Description Guide

What to write in a Figma component description, for any library. [SKILL.md](../SKILL.md) says which components get one and how it is applied; this guide says what goes in it.

The guide is library-agnostic: it assumes no particular axis names, roles or component sets. Treat any concrete name below as an example, not an expectation. Where it says "the internal prefix" or "the header component name", it means the rulebook's value, never a hard-coded default.

## Contents

- [Goal](#goal)
- [Structure](#structure)
- [What goes in each section](#what-goes-in-each-section)
- [Compact structure](#compact-structure-internal-prefixed-components)
- [Writing for a virtual set](#writing-for-a-virtual-set)
- [Content rules](#content-rules)
- [Language and dialect](#language-and-dialect)
- [Reference examples](#reference-examples)

## Goal

Write a description for each consumer-facing public component, in the full structure below. Apply it through `figma_set_description` with the `descriptionMarkdown` parameter. That renders rich text (headings, lists) in Figma's component panel and Dev Mode.

A private part and a slot-only child take the compact form instead. A virtual set shares one description among its members. SKILL.md step 2 decides which component takes which form, and which is skipped.

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

## Right to left
- [Only where the project's settings name rtlLanguages: what mirrors, what stays]
```

**Section rules:**

- The purpose paragraph opens the description, with no heading.
- Headings render from `##`: always use `##`, never plain text labels.
- List items use `-` and render as bullets: never type a manual `•`.
- Leave one blank line between the purpose paragraph and each heading, and between sections.
- Omit any of Behaviour, Composition, Usage, Don't and Code gen notes with nothing meaningful to say. A small static component may need only a purpose paragraph, Usage and Don't.
- Write Right to left only where the project's `audit-settings` name `rtlLanguages`, and then only for a component with something to say (below).

## What goes in each section

### Purpose (opening paragraph)

- The component name is the subject; say the user benefit, not the implementation.
- Name the key axes that define the component, and what they select, in plain terms.
- Keep it to one to three sentences.

The skill's generator writes Behaviour and Composition from the interface (SKILL.md step 5). Their rules stay here so a line that reads wrong can be judged against them, and fixed in the generator.

### Behaviour

- Say what each axis or state changes, by its verbatim name.
- Interactive states are set by code. List only the states the component has, in the State axis's order, and say the code manages them.
- Where a component has only a resting state and a disabled axis, note just that the disabled state is code-managed.
- Name runtime behaviour the code owns: opening and closing, animation, focus handling, sorting, scrolling.

### Composition (highest-value section)

- List every nested sub-component by its exact name, so code generation imports it rather than rebuilding it. This is the most useful signal for code generation.
- Note open content slots: an empty slot takes any custom content, passed in rather than hard-coded.
- Note swappable props (instance swap) by their exact prop name, and what they swap.
- **Never infer nesting from one variant**. A part a boolean or variant axis reveals is absent where that axis is off. Scan the whole set, and mark a part that appears only under one axis value as conditional ("revealed by the `<Boolean>` prop").
- A component that pairs with another, without nesting it, belongs in Usage as a pairing. Composition is for what the component contains.
- Omit this section for a flat component with no sub-components, no slots and no swaps.

### Usage

- Say when and how to use it, with grouping, placement and content guidance.
- For a multi-axis component, give the variant selection order: which axis to choose first, then the next. Note that interactive states are set by code, not applied in static designs.

### Don't

- List misuse cases, each countering a Usage item or closing a loophole.
- Always name the correct alternative component for the misuse.

### Code gen notes

- Import instructions for each nested sub-component named in Composition
- Slot handling: content passed through the slot as children, not hard-coded
- Swappable props resolved by their prop, not recreated
- Interactive states defined by code, not generated as static variants
- Values from tokens (colour, spacing, radius, elevation) not hard-coded

### Right to left

Write it only where the project's settings name `rtlLanguages` (figma-standard rule 50). The product mirrors in code. This section is where a developer, Dev Mode and the MCP server find what code cannot decide. Each line is a fact measured from the component, never a general remark:

| Line | Where |
|---|---|
| `- Mirrors: the order of its parts` | A horizontal auto layout holds two or more children in the flow |
| `- Mirrors: nothing beyond what follows` | Otherwise |
| `- Padding: <left> leading, <right> trailing` | Left and right padding differ; the values drawn |
| `- <layer>: pinned to the leading edge` (or trailing) | A layer positioned absolutely, or in a frame without auto layout, constrained left (or right) |
| `- <layer>: aligned to the trailing side` | A row aligned right, or a column whose items align right |
| `- Text: aligned to the leading side` (or trailing) | A text box wider than its text, aligned left (or right) |
| `- <text style>: uppercase in Latin only` | A style that sets a text case Arabic does not have |
| `- <text property>: either direction` | Text people type or the product fills in (a name, a title, a search term), so the developer isolates it. Text the team writes needs no line. |
| `- <layer>: corners <TL> <TR> <BR> <BL> (top leading, top trailing, bottom trailing, bottom leading)` | Corners differ left and right |
| `- Stays: <parts>` | What keeps its direction (playback controls, a chart, a phone number field) |
| `- Stays: nothing` | Nothing does |

figma-components-audit's `direction|note` finding composes the same lines from the same measurements, so a description reads the same either way.

Omit the section for a component with nothing to reorder, and nothing pinned, uneven or one-sided (an avatar, a spinner). An icon takes one line instead of the section:

- `Right to left: mirrors` for an icon pointing the way the reader moves (arrows, chevrons, undo, send)
- `Right to left: stays` for one that keeps its direction (playback, clocks)

## Compact structure (internal-prefixed components)

A private part (one with the internal prefix) and a slot-only child are building blocks, not consumer-facing subjects. They never get the full structure above.

They still get a description. An AI or a new teammate reading the file through MCP sees a private component as readily as a public one. An undocumented private component is a broken link the moment a public component's Composition names it.

```markdown
[One to two sentences: what it is, and its role relative to its parent. No heading, no sections, no bullets.]
```

- **Content**: what the piece is, plus why it is split out (a reason, not a restatement of the name) or which parents use it. Quote state names verbatim where they matter, as in the full structure.
- **Length discipline is the whole point**. A private description that grows past two sentences, or wants a Composition or Usage section, signals the component may deserve to be public. Flag it in the report rather than writing a long private description.
- Never write Behaviour, Composition, Usage, Don't or Code gen notes for a private component, even when the information is known. That structure serves consumers choosing between variants, and a private component has none.
- Apply it the same way as a full description (`descriptionMarkdown`, single or batched), and re-read it after writing (SKILL.md steps 6 and 8).
- Virtual-set grouping (step 2c) does not apply to private components. Each is described on its own, against its own parent. The grouping rule serves consumer-facing naming families, which private components are not part of.
- Skip a private component that already carries a description: report it with a preview, and never overwrite it unasked (SKILL.md step 9).
- Skip any private component that fails step 2e, alone on its page and unused. Some libraries stash unused private parts this way.

**Worked example:**

> The individual row inside `Sidebar (Secondary)`; renders one navigation item's icon, label, and selected/hover state. Not used outside the parent sidebar section.

## Writing for a virtual set

Consumers read published components sharing a name prefix before the separator as one component with a subpart axis. So they get one shared description, applied identically to each member.

- Open with the group as subject, never one member: "A top bar sits at the top of a screen", never "A top bar / Default is". The reader may have selected any member.
- Name the subparts and what each is for, so the reader can tell which to pick. This replaces the disambiguation separate components would need.
- Build the interface sections from the **union** of the members' props, and attribute anything that differs. An example: "the options differ by subpart: Default offers Back and Close; Main offers neither".
- Never claim an axis value only one member has as though the whole set had it.
- Don't items apply to the whole set, so phrase them against the subpart they constrain. Write "Use Main on a screen the user needs to navigate back from", not a bare "Use without a Back control".

## Content rules

| Rule | What it asks |
|---|---|
| Verbatim names | Quote prop names, axis names, and variant or state values exactly as Figma shows them, misspelled ones included. Never paraphrase, re-case or translate them, even in prose in another language. They map to the Figma UI and to code. |
| Strip property key suffixes | `componentPropertyDefinitions` gives non-variant property keys a `#nodeId` suffix: a boolean named `Icon` appears as `Icon#0:45`. Strip everything from `#` on before quoting it. The suffix is internal, and never appears in Figma's UI. |
| Anatomy and disambiguation | Where similar components exist, say when to choose this one and when a sibling instead. This is the most critical signal for an AI's choice. Put it in the purpose paragraph, or in Usage and Don't. |
| Interactive states | Never tell designers to build Hover, Focus, Press or Loading states by hand. Always frame them as code-managed, listing only the states present. |
| Slots and swaps over "cannot be customised" | Never claim a container is fixed without checking. If it exposes a content slot or a swappable prop, document that instead. Call a component fixed only when it has no slot and no swap. |
| Length | Two to three bullets for a simple component, three to five for a complex or semantic one. Never pad. |
| Cross-referencing | Name sibling components in disambiguation lines and Don't items, so the documentation forms a connected system. |
| Tone | Prescriptive and concise. No full stops ending list items. |

## Language and dialect

**What this skill writes takes the rulebook's `language`, always**: `language` in `audit-settings`, en-GB when absent. Text regenerated in en-GB into a library whose document records en-US is a silent reversion. The run reports success and the library goes backwards. So generated text never matches an old spelling "to be consistent": consistency with a dialect the project has left is not consistency.

**The library's existing descriptions are a separate question: a finding, not a decision to take here**. A project that has just switched still has a library in the old dialect. One example records `language: en-US` while 92 of its descriptions head a section `## Behaviour`. Renaming those means editing every documented component, so it is the project's open question, not this run's.

- Report the count, and name the conflict.
- Rewriting the descriptions this run does not otherwise touch is the maintainer's call.
- Writing the new ones in the recorded dialect is not.

### Writing in another language

Write in English, or in the rulebook's authoring language where the project sets one. Switch to another language only when the user explicitly asks. An earlier conversation in another language is no reason to default to it. When asked:

- **Translate the prose and the section headings**. Localise the purpose paragraph, every bullet and the `##` headings. A Spanish set of headings is: Comportamiento, Composición, Uso, No hacer, Notas de generación de código. The purpose paragraph stays unheaded.
- **Keep names verbatim in the source language**. Prop names, axis names, and variant or state values are never translated. Role, Breakpoint, Feedback, Validation, Selected and Disabled stay as Figma shows them, as do Focus, Hover, Press and Loading. They are identifiers mapping to the UI and to code, so translating them breaks the mapping.
- **Use one canonical interactivity line across the whole catalogue**. Pick one localised sentence and reuse it verbatim, inserting only each component's states, in axis order. Consistency across the set matters more than variation per component.
- **Keep the same section structure and omission rules**. Translation changes the language, not the shape.
- The generated Behaviour and Composition lines are English, so in another language both are written by hand (SKILL.md step 5).

A Spanish interactivity line: "Los estados interactivos (Focus, Hover, Press) y Disabled los gestiona el código; no se aplican manualmente en el diseño".

## Reference examples

### Button: multi-axis component with composition and variant order

```markdown
A button triggers an action or event. The Variant axis defines visual hierarchy: Primary for the main action, Secondary for supporting actions, Tertiary for low-emphasis actions, and Ghost for minimal prominence.

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
