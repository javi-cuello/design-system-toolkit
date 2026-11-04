# Plan: agent prototyping in code and Figma

**The goal.** An agent builds whole screens from a project's own components, tokens and screen conventions, in code and in Figma. A screen moves between the two without being redrawn. Written 2026-11-04 from [knowledge/code/agent-prototyping.md](../knowledge/code/agent-prototyping.md) and the research pieces *Prototyping with a design system's real components* and *Making a design system usable by AI agents*.

This plan is written as outcomes: what a designer or developer sees when each part is done. Tools come in only as the existing owner of each outcome, or as a gap where no owner exists yet.

## How the plan keeps to the standards

- **One job, one owner (toolkit-standard §D 1).** Each outcome names the part that already owns its job. A new owner appears only where none exists, and it is decided after a trial, not in advance.
- **One source per fact (§D 5, §D 23).** A component's API, anatomy and values are its contract, derived from the snapshot. Anything an agent reads about a component (a manifest, a Code Connect file, an MCP answer) is generated from that contract and never written by hand. That includes another tool's format, such as Storybook's manifest or Code Connect.
- **A project's truth lives in its context document (§D 12); generic guidance lives in `knowledge/` (§D 21).** A project's screen conventions go in its context document. Patterns that hold for any project are already in `knowledge/ui/patterns`, and the plan does not restate them.
- **Project-agnostic (§D 6).** Every outcome is built for any project and tried on whichever governed project has the material.
- **Uncertain is flagged, never guessed (§D 15).** What an agent invents, and what cannot cross from Figma to code, is said in its output.
- **Simple, proven, finished (§D 10).** Steps on new ground start with a trial. Vendor tools (Storybook's MCP, Figma's MCP and its generate-design skill) are used where they do the job, instead of being rebuilt.

---

## Outcome 1 — An agent uses the system's components, or says it could not

*Done when:* given a task that names no component, an agent writes only real components, with props and values the contract allows, styled with tokens. Anything it had to invent is marked and listed. Code that breaks this cannot be pushed.

| Gap today | Fix | Owner |
|---|---|---|
| `validate` flags raw elements where the library has a component, but not where a component is imported from, so a local copy or a styled non-native element passes | Add the import test to the existing output check | `tools/docs-mcp` `validate` |
| The check is optional, and an agent can skip it | Add `validate` as a gate in the project's check, which its pre-push hook already runs; a project with CI adds the same check there | project-check (`check.mjs`) |
| An agent without MCP has no component reference in the repo | Point the agent at the built docs site's generated `api/` files, which already exist, and add no new format | `tools/docs-site` (already generated) |
| A slot's preferred components are served (`get_contract` returns them), but nothing checks what an agent puts in a slot | Check a slot's children against its preferred components | `tools/docs-mcp` `validate` |
| Figma's own MCP returns Tailwind for a frame when it should return the real import | Generate Code Connect from the contract and the mapping | `component-contract`; needs a plan with Code Connect seats |

**Not duplicated.** Storybook's components manifest is turned on only for its story and test tools. The contract stays the one source of a component's API, and the agent rules say so.

---

## Outcome 2 — An agent builds a screen the way the project builds screens

*Done when:* asked for "a settings screen" or "a list with a detail panel", the agent uses the project's own layout: its page shell, regions, the spacing between them and the states each must cover (empty, loading, error). It starts from a template, not from nothing.

| Gap today | Fix | Owner |
|---|---|---|
| No project's screen conventions are written down, and no part reads screens for conventions (figma-context-capture reads a library only) | Trial first: derive by hand the patterns that repeat across a governed project's stored screens. If it holds, a script derives the recipes from the stored screens (regions, components, spacing tokens, required states), generated and not hand-written (§D 23), and capture records the project's choices about them in the context document | the derivation is new, and its owner (the snapshot's readers, or `component-contract`) is decided at the trial; recording stays figma-context-capture's |
| Agents cannot fetch screen knowledge | Serve recipes and stored screens on demand, as components are served now | `tools/docs-site` (renders them) → `docs-mcp` (one reader for agents) |
| Prose instructions fail on shells and navigation | Keep the shell and navigation as configuration that templates read | the project; the guidance goes into `knowledge/code/agent-prototyping.md` |
| No templates to start from | Make one template per recipe, in code and in Figma, held to parity | built through Outcomes 3 and 4; measured by `tools/parity` |

---

## Outcome 3 — A code prototype anyone can review, which never ships by accident

*Done when:* a flow prototype runs on the real components, opens from a link without an account, and lists what it invented. An accepted prototype is rebuilt on a feature branch behind the gate. A prototype branch cannot reach production.

| Gap today | Fix | Owner |
|---|---|---|
| No workflow to compose a screen from a recipe and return a receipt | Add a prototype mode to the skill that already builds UI | frontend-build (§D 1: building UI has one owner). Parity stories stay design-code-parity's: they map variants for measuring, while a prototype is a screen being built |
| Flows have no home | Write flows as stories in a `Prototypes/` group: local state, links, play functions, mocked data | frontend-build's guidance; the method is in the research piece |
| Nothing stops a prototype branch being merged | Refuse merges from prototype branches at the push gate | project-check |
| Reviewers need a link | Publish per branch, linked to the full-screen view of the story | the project's host; guidance only |

---

## Outcome 4 — A Figma prototype made of the library, which a designer can continue

*Done when:* an agent composes a screen or a short flow on a scratch page from library instances and variables only. Prototype connections are wired where a flow is the point, and the receipt has the same format as Outcome 3's. A check confirms that nothing in it is detached or unbound.

| Gap today | Fix | Owner |
|---|---|---|
| No route has been chosen for composing in Figma | Trial Figma's `use_figma` with its generate-design skill, and Figma Console, on one recipe. Use the vendor skill if it does the job with our context; add a toolkit skill only for what it cannot do | decided by the trial; no new owner before it |
| Nothing checks a composed frame: the scanner reads library components only, and detached instances come from a session probe | Add a frame scope to figma-components-audit: the detached-instance probe plus an instances-only and bound-values check, not a second scanner | figma-components-audit |
| Two receipt formats would drift | One receipt format, moved to `tools/shared` once Outcome 4's trial gives it a second caller; until then it lives with frontend-build | frontend-build, then `tools/shared` |

---

## Outcome 5 — A screen crosses between Figma and code without being redrawn

*Done when:* a Figma screen becomes a code prototype, and a code prototype becomes a Figma frame of real instances. Both directions use the same contracts. A round trip changes nothing that parity measures, and each leg names what it could not carry.

| Gap today | Fix | Owner |
|---|---|---|
| A component crosses both ways, but a screen crosses neither way | Extend the contract tools from one component to a screen's tree of instances: Figma → markup with imports, code → Figma instances. Use `generate_figma_design`'s flat layers for reference only | `component-contract` (already owns `to-figma`, `to-markup` and `from-code`) |
| No proof that a round trip is lossless | Make the round trip a test in both directions: bindings by extending `to-figma --verify`, which already reads a drawing back against its contract, and the look by parity | `component-contract` (bindings), `tools/parity` (the look) |
| Silent loss | Each leg reports the data, behaviour and states Figma does not draw | as above, §D 15 |

---

## Outcome 6 — We know whether it works

*Done when:* a fixed set of product tasks that never name a component is run with and without the system's context. Each result is scored by Outcome 1's check and kept with its date, and the set is re-run after each outcome lands.

- **Owner:** `tools/skill-evals`, extended. Today its tasks are "build this component" runs that need a parity target and are graded by parity. The gap: tasks with no target, graded by `validate`. Context on and off extends its existing `--rules` and `--brief` switches.
- **Signals:** invented components, invented props and raw values (all should fall), invented items in receipts (should fall as recipes grow), and round-trip differences (should be zero).

---

## Order

1. Outcome 1, then Outcome 6's baseline. Every later outcome is measured against both.
2. Outcome 2's trial, then its recipes. Outcomes 3 and 4 need them.
3. Outcomes 3 and 4, which can run side by side.
4. Outcome 5, new ground, starting with one screen in each direction.

## Open

- Code Connect needs a Figma plan with the right seats. Check this for each project before building anything for it.
- A project whose code is a read-only clone prototypes in a separate repo on its published package. Outcome 3's gate applies there.
- Figma Make kits with a package are parked until Vallaure's Part 3 (10 November) and a trial show that they import the package.

## Beyond scope

Hosted app builders, wiring production data, and a canvas for designers who don't code. The research weighed each of these and set it aside.
