# The build, step by step

The detail behind each build step in [SKILL.md](../SKILL.md), *Build*. SKILL.md says what to do and in what order; this file says how. Every rule cited here is owned by a standard or a knowledge page, and is linked, not restated.

## Contents

- [Orient before writing anything](#orient-before-writing-anything)
- [The order of work](#the-order-of-work)
- [Reporting back from a build](#reporting-back-from-a-build)

## Orient before writing anything

Answer these five questions before writing anything.

1. **Is there a stylesheet already?** An existing architecture is a constraint, not a suggestion.
2. **What builds the CSS?** A bundler, a Sass script, or nothing. If nothing compiles it, plain CSS with custom properties is a complete answer.
3. **What renders the HTML?** It decides where a class or attribute lives. This skill says nothing about the runtime.
4. **What does the design contain?** Read the token collections, text styles and component set, not the frames: `knowledge/code/figma-handoff.md`. With no design file, the knowledge base is the design (SKILL.md, step 1).
5. **Which platform features may it use?** Read the project's Baseline target, and what a feature outside it falls back to, in `knowledge/code/browser-support.md`. For a feature no knowledge page covers, that page's *Baseline as the support policy* says where to read it. The build cites what it used.

## The order of work

Each step's output is the next step's input.

### Inventory

List the components the design implies. For each, note its element, variants and states, and the content it must survive.

- The design will lack hover, focus, disabled, loading, empty, error and long content. Ask now, while it is free.
- A component's page in `knowledge/ui/components/` says what it needs in design, in Figma and in code (a button, a select, a dialog).
- A pattern page in `knowledge/ui/patterns/` says what it needs beside its neighbours (a form, a table).

### Tokens

Tokens are generated, never written, by one build (code-standard rules 51–55).

| Piece | What it does |
|---|---|
| `tools/tokens/build-tokens.mjs` | The token build, over Style Dictionary |
| `tools/tokens/build.mjs` | Runs that build from the snapshot |
| `bin/tokens` | A repo's command, which calls it |
| `bin/tokens --check` | Regenerates beside the files and diffs |

Tiers, theming and what not to tokenise: `knowledge/code/tokens.md`.

### Base

Write the reset, element defaults, typography and the `prefers-reduced-motion` block once. Declare the layer order before any rule exists (code-standard rule 4). The detail is in `knowledge/code/css-architecture.md`, and the reduced-motion block in `knowledge/code/accessibility.md`.

### Layout

Size intrinsically first, with `min()`, `clamp()`, `minmax()` and `auto-fit`.

Add a breakpoint only where the layout changes (code-standard rules 3, 46, 54; `knowledge/code/responsive.md`). Use the widths the project's `guidance/layout.md` names, where it has one.

### Components

**A component Figma has drawn has its stylesheet generated, never written.** `tools/component-contract/to-code.mjs` writes it from the component's contract. A repo runs it as `bin/component-styles`, after `bin/tokens`; `--check` diffs.

- **Markup to the hooks.** The build writes the markup to the hooks the generated sheet's header names. Those are the classes of its parts, nested as the anatomy nests them, and the attribute or pseudo-class that chooses each prop value.
- **The component's own sheet** holds only what the header lists as *Not written*, and behaviour the design does not draw (transitions, cursor, reduced motion). It never holds a value the generated sheet sets.
- **No stored contract yet** (the scaffold's worked component, a component designed in code first): the sheet is written by hand until the component is drawn.

**Generated markup.** A repo's snapshot config may name a `framework`. There the markup is generated too, and its gaps are filled at this step (SKILL.md, step 6).

**Shape and accessibility.** The markup's shape is code-standard rules 5, 6, 8–13, 38, 60 and 62. Accessibility in code is code-standard rules 14–19 and 64 (`knowledge/code/accessibility.md`).

**A mismatch is decided where it is found.** A component may reveal a Figma↔code mismatch, a trap or a ruling. Decide in that change where it lives (toolkit-standard §D 8):

| It is | It goes to |
|---|---|
| A project fact | The project's context document |
| A toolkit lesson | A standard's rule, a scaffold file or an engine |

Write it there in the same commit. The comment you are about to write, explaining why the code differs from the design, is the lesson.

### Audit and look

Audit what you built (SKILL.md, *Audit*). No interface change ships before its screenshots are looked at (SKILL.md, *Audit*, step 3).

## Reporting back from a build

A build makes decisions the design did not. Say which, as they happen:

- what the design did not specify, and what was chosen;
- where the build deviates and why (a contrast failure fixed in the token layer, a target padded to 24px);
- what the design implies but does not contain (a missing empty state).

A build that silently corrects a design teaches nobody anything, and gets reverted at review.
