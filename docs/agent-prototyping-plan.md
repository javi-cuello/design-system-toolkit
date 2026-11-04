# Plan: agent prototyping in code and Figma

**The goal.** An agent builds whole screens from a project's own components, tokens and screen conventions, in code and in Figma, directly in either. A Figma screen becomes code without being redrawn. Written 2026-11-04 from [knowledge/code/agent-prototyping.md](../knowledge/code/agent-prototyping.md) and the research pieces *Prototyping with a design system's real components* and *Making a design system usable by AI agents*. Outcomes 2, 4 and 5 were checked the same day against *Building whole screens with an agent from the design system*, and amended where it disagreed.

This plan is written as outcomes: what a designer or developer sees when each part is done. Tools come in only as the existing owner of each outcome, or as a gap where no owner exists yet.

## How the plan keeps to the standards

- **One job, one owner (toolkit-standard §D 1).** Each outcome names the part that already owns its job. A new owner appears only where none exists, and it is decided after a trial, not in advance.
- **One source per fact (§D 5, §D 23).** A component's API, anatomy and values are its contract, derived from the snapshot. Anything an agent reads about a component (a manifest, a Code Connect file, an MCP answer) is generated from that contract and never written by hand. That includes another tool's format, such as Code Connect; Storybook's own manifest is built from its stories and is not used for a component's API.
- **A project's truth lives in its context document (§D 12); generic guidance lives in `knowledge/` (§D 21).** Only a project's decisions about screens go in its context document (Outcome 2 says how small); what the stored screens already show is generated, never written there. Patterns that hold for any project are already in `knowledge/ui/patterns`, and the plan does not restate them.
- **Project-agnostic (§D 6).** Every outcome is built for any project and tried on whichever governed project has the material.
- **Uncertain is flagged, never guessed (§D 15).** What an agent invents, and what cannot cross from Figma to code, is said in its output.
- **Simple, proven, finished (§D 10).** Steps on new ground start with a trial. Vendor tools (Storybook's MCP, Figma's MCP and its generate-design skill) are used where they do the job, instead of being rebuilt.

## Where each truth lives

- **Components and tokens:** the Figma library, read once by the snapshot (§D 5), with each component's contract derived from it. A library in contract mode (`"source": "contract"`) makes the project's contract files official instead, and `to-figma --patch` writes them back to Figma. Either way, code, docs and the MCP read the contract.
- **Screen conventions:** the stored screens. Each holds its instance tree, with the component and its key, props, layout and bound tokens, under the name snapshot-standard rule 24 gives it: section, flow and step, Screen, and a State where there is one (`<Projects> 3-3 - Rename dialog - Error`). Recipes are generated from them, and templates in code and Figma are built from the recipes and held to parity.
- **Screen context, by part:**
  - what a screen type contains is derived from the stored screens;
  - designer notes travel with their layers (snapshot-standard rule 25);
  - decisions no screen shows go in the context document: which screen types exist, the states each must cover, and where the shell config lives;
  - generic patterns stay in `knowledge/ui/patterns`.
  - No markdown file is written per screen.
- **Behaviour (states, data, interaction):** the code. Figma does not hold it.
- **Prototypes:** never a source of truth. A code prototype is a branch or a story, and a Figma prototype is a scratch page.
- **Direction:** screens flow one way, Figma through the snapshot into code. Nothing turns a coded screen back into Figma. A code prototype is continued in Figma by rebuilding it from the same template (Outcome 4).

---

## Outcome 1 — An agent uses the system's components, or says it could not

*Done when:* given a task that names no component, an agent writes only real components, with props and values the contract allows, styled with tokens. Anything it had to invent is marked and listed. Code that breaks this cannot be pushed.

| Gap today | Fix | Owner |
|---|---|---|
| `validate` flags raw elements where the library has a component, but not where a component is imported from, so a local copy or a styled non-native element passes | Done 2026-11-04: `validate` flags a library component defined in the code, and, given `--from`, one imported by name from anywhere else | `tools/docs-mcp` `validate` |
| The check is optional, and an agent can skip it | Add `validate` as a gate in the project's check, which its pre-push hook already runs; a project with CI adds the same check there | project-check (`check.mjs`) |
| An agent without MCP has no component reference in the repo | Point the agent at the built docs site's generated `api/` files, which already exist, and add no new format | `tools/docs-site` (already generated) |
| A slot's preferred components are served (`get_contract` returns them), but nothing checks what an agent puts in a slot | Check a slot's children against its preferred components | `tools/docs-mcp` `validate` |
| Figma's own MCP returns Tailwind for a frame when it should return the real import | Optional, for people working through Figma's MCP: generate Code Connect from the contract and the mapping. The toolkit's own route (Outcome 5) reads stored screens and needs no Code Connect | `component-contract`; needs a plan with Code Connect seats |
| The server is named for the docs site, though it serves the system: components, tokens, the validator, and soon screen recipes | Rename `tools/docs-mcp` to `tools/system-mcp` (14 files, and each project's MCP client entry). When it reads the snapshot and contract store directly, so a project with no built site can use it, the shaping the site's API does (`tools/docs-site/src/pages/api/_shared.js`) moves to `tools/shared` for both callers, so the site and the server cannot answer differently | `tools/docs-mcp` → `tools/system-mcp`; the shared shaping, `tools/shared` once there are two callers |

**Not duplicated.** Storybook's MCP is used for its preview and test tools only (Outcome 3); the contract stays the one source of a component's API.

---

## Outcome 2 — An agent builds a screen the way the project builds screens

*Done when:* asked for "a settings screen" or "a list with a detail panel", the agent uses the project's own layout: its page shell, regions, the spacing between them and the states each must cover (empty, loading, error). It starts from a template, not from nothing.

| Gap today | Fix | Owner |
|---|---|---|
| No project's screen conventions are written down, and no part reads screens for conventions (figma-context-capture reads a library only) | Trial first: derive by hand the patterns that repeat across a governed project's stored screens. If it holds, a script derives the recipes from the stored screens (regions, components, spacing tokens, required states), generated and not hand-written (§D 23), and capture records the project's choices about them in the context document | the derivation is new, and its owner (the snapshot's readers, or `component-contract`) is decided at the trial; recording stays figma-context-capture's |
| Agents cannot fetch screen knowledge | Serve an index on demand, the recipe as generated data with links to the template, example stored screens, the project's screen decisions and the pattern pages: which template fits a task, which stored screens are examples of it, what each region must contain. The templates themselves stay files, never a second copy in the server (every system that gives agents screens ships them as files: shadcn `registry:page`, Polaris templates, Ant Design Pro, Atlassian's starters) | `tools/docs-site` (renders them) → `docs-mcp`, `system-mcp` after the rename (one reader for agents) |
| Prose instructions fail on shells and navigation | Keep the shell and navigation as configuration that templates read: a JSON file in the project's code repo, which the context document points to rather than copies | the project; the guidance is in `knowledge/code/agent-prototyping.md` |
| Context documents are already 336 to 933 lines | Keep the screens section to one table of decisions (screen type, required states, shell config). Measure it at the trial; only if it does not fit, amend §D 12 so a context document may be a folder (an index and a file per section), for every project at once | figma-context-capture records it; the amendment, if needed, is toolkit-standard's |
| No templates to start from | Make one template per recipe, in code and in Figma, held to parity. Templates are the main carrier, recipes the index: the evidence ranks templates and config first, example screens next, prose last | built through Outcomes 3 and 4; measured by `tools/parity` |

---

## Outcome 3 — A code prototype anyone can review, which never ships by accident

*Done when:* a flow prototype runs on the real components, opens from a link without an account, and lists what it invented. An accepted prototype is rebuilt on a feature branch behind the gate. A prototype branch cannot reach production.

| Gap today | Fix | Owner |
|---|---|---|
| No workflow to compose a screen from a recipe and return a receipt | Add a prototype mode to the skill that already builds UI | frontend-build (§D 1: building UI has one owner). Parity stories stay design-code-parity's: they map variants for measuring, while a prototype is a screen being built |
| Flows have no home | Write templates as stories in a `Templates/` group and flows as stories in a `Prototypes/` group: local state, links, play functions, mocked data | frontend-build's guidance; the method is in the research piece |
| An agent cannot see or test what it built | Turn on Storybook's MCP in the project for its preview and test tools (`stories-preview`, `test-run`); leave its documentation tools off, so the contract stays the one source of a component's API | the project; the guidance, still to add, goes in `knowledge/code/agent-prototyping.md`, whose Storybook snippet today points agents at the documentation tools too |
| Nothing stops a prototype branch being merged | Refuse merges from prototype branches at the push gate | project-check |
| Reviewers need a link | Publish per branch, linked to the full-screen view of the story | the project's host; guidance only |

---

## Outcome 4 — A Figma prototype made of the library, which a designer can continue

*Done when:* an agent composes a screen or a short flow on a scratch page from library instances and variables only, starting from the Figma template for its recipe. A code prototype that should continue in Figma is rebuilt here from the same template, never converted. Prototype connections are wired where a flow is the point, and the receipt has the same format as Outcome 3's. A check confirms that nothing in it is detached or unbound.

| Gap today | Fix | Owner |
|---|---|---|
| No route has been chosen for composing in Figma | Trial Figma's `use_figma` with its generate-design skill, and Figma Console, on one recipe. The skill already composes from library instances and variables and compares their keys with its map; what it lacks is a scan for detached instances and a full scan for unbound values, which the next row adds. Use the vendor skill if it does the job with our context; add a toolkit skill only for what it cannot do | decided by the trial; no new owner before it |
| Nothing checks a composed frame: the scanner reads library components only, and detached instances come from a session probe | Add a frame scope to figma-components-audit: the detached-instance probe plus an instances-only and bound-values check, not a second scanner | figma-components-audit |
| Two receipt formats would drift | One receipt format, moved to `tools/shared` once Outcome 4's trial gives it a second caller; until then it lives with frontend-build | frontend-build, then `tools/shared` |

---

## Outcome 5 — A Figma screen becomes code without being redrawn

*Done when:* a stored Figma screen becomes a code prototype made of the real components, with their imports, props and tokens, inside the template for its recipe. What parity measures matches the stored screen, and the output names what it could not carry.

| Gap today | Fix | Owner |
|---|---|---|
| A component crosses from Figma to code, but a screen does not | Extend `to-markup` from one component to a stored screen's tree: each instance's key and props, through its contract, become the real import and props, and its layout and bound tokens become the template's regions. It reads the snapshot, not Figma live (§D 5), so it needs no Code Connect and no large-frame workaround | `component-contract` (already owns `to-markup`) |
| No proof the screen arrived intact | Test it: the generated tree's components and props diffed against the stored screen's instances, and the look measured by parity | `component-contract` (bindings), `tools/parity` (the look) |
| Silent loss | The output lists the data, behaviour and states Figma does not draw, and any instance with no contract | as above, §D 15 |

---

## Outcome 6 — We know whether it works

*Done when:* a fixed set of product tasks that never name a component is run with and without the system's context. Each result is scored by Outcome 1's check and kept with its date, and the set is re-run after each outcome lands.

- **Owner:** `tools/skill-evals`, extended. Today its tasks are "build this component" runs that need a parity target and are graded by parity. The gap: tasks with no target, graded by `validate`. Context on and off extends its existing `--rules` and `--brief` switches.
- **Signals:** invented components, invented props and raw values (all should fall), invented items in receipts (should fall as recipes grow), and differences between a stored screen and its generated code (should be zero).

---

## Order

1. Outcome 1, then Outcome 6's baseline. Every later outcome is measured against both.
2. Outcome 2's trial, then its recipes. Outcomes 3 and 4 need them.
3. Outcomes 3 and 4, which can run side by side.
4. Outcome 5, new ground, starting with one stored screen.
5. The rename to `tools/system-mcp` can land any time; the shared shaping lands with the server reading the snapshot.

## Open

- Code Connect needs a Figma plan with the right seats. It is only needed for the Figma MCP route, so check it for each project before building that.
- A project whose code is a read-only clone prototypes in a separate repo on its published package. Outcome 3's gate applies there.
- Figma Make kits with a package are parked until Vallaure's Part 3 (10 November) and a trial show that they import the package.

## Beyond scope

Hosted app builders, wiring production data, and a canvas for designers who don't code. The research weighed each of these and set it aside.

Turning a coded screen into a Figma frame of instances. No tool does it (captures are flat layers), the only route is an agent rebuilding the screen, and nobody tests it. Outcome 4 covers the need by building from the same template in Figma.
