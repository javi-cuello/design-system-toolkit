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
- **The product:** `product-context.md` beside the context document (§D 12): what the product is, who uses it and its words, at suite level. A person owns it; an agent drafts it from evidence and writes after their yes. Its decisions go to the context document's §6, the project's one decision log, Scope `Product`.
- **Learning from feedback (2026-11-11):** each piece, its owner and its reader are in [how-it-fits.md](how-it-fits.md), *What a project knows, and how it learns*.
- **Direction:** screens flow one way, Figma through the snapshot into code. Nothing turns a coded screen back into Figma. A code prototype is continued in Figma by rebuilding it from the same template (Outcome 4).

---

## Outcome 1 — An agent uses the system's components, or says it could not

*Done when:* given a task that names no component, an agent writes only real components, with props and values the contract allows, styled with tokens. Anything it had to invent is marked and listed. Code that breaks this cannot be pushed.

| Gap today | Fix | Owner |
|---|---|---|
| `validate` flags raw elements where the library has a component, but not where a component is imported from, so a local copy or a styled non-native element passes | Done 2026-11-04: `validate` flags a library component defined in the code, and, given `--from`, one imported by name from anywhere else | `tools/system-mcp` `validate` |
| The check is optional, and an agent can skip it | Done 2026-11-04: the `validate` gate in the project's check, which its pre-push hook already runs, over the code a push changes; a class-named system rules it out. As in the audit, its findings are deterministic and never judged away; one that must stay is waived by a §6 ruling scoped `validate` naming its file and what was found (done the same day) | project-check (`check.mjs`) |
| An agent without MCP has no component reference in the repo | Point the agent at the built docs site's generated `api/` files, which already exist, and add no new format | `tools/docs-site` (already generated) |
| A slot's preferred components are stored only as Figma keys: across three stored libraries 16 of 23 resolve to a stored component | Done 2026-11-04 (snapshot plugin 0.69.0): each slot record gains `preferredNames`, this file's components named from the file, another library's by import, null where it cannot be named. Checked live on one library: what is stored matches Figma exactly, and only 2 of its 12 slots name any preferred component, so most of the gap is the designer's to fill, not the snapshot's. The names arrive at each library's next snapshot | the snapshot plugin (§D 5: extending it is the fix) |
| Nothing checks what an agent puts in a slot | Check a slot's children against its preferred components; blocked on the row above, since a check today would guess | `tools/system-mcp` `validate` |
| Figma's own MCP returns Tailwind for a frame when it should return the real import | Optional, for people working through Figma's MCP: generate Code Connect from the contract and the mapping. The toolkit's own route (Outcome 5) reads stored screens and needs no Code Connect | `component-contract`; needs a plan with Code Connect seats |
| The server is named for the docs site, though it serves the system: components, tokens, the validator and screen recipes | Renamed 2026-11-04 from `tools/docs-mcp`; each MCP client entry is pointed at the new path when the rename merges. When it reads the snapshot and contract store directly, so a project with no built site can use it, the shaping the site's API does (`tools/docs-site/src/pages/api/_shared.js`) moves to `tools/shared` for both callers, so the site and the server cannot answer differently | `tools/system-mcp`; the shared shaping, `tools/shared` once there are two callers |

**Not duplicated.** Storybook's MCP is used for its preview and test tools only (Outcome 3); the contract stays the one source of a component's API.

---

## Outcome 2 — An agent builds a screen the way the project builds screens

*Done when:* asked for "a settings screen" or "a list with a detail panel", the agent uses the project's own layout: its page shell, regions, the spacing between them and the states each must cover (empty, loading, error). It starts from a template, not from nothing.

| Gap today | Fix | Owner |
|---|---|---|
| No project's screen conventions are written down, and no part reads screens for conventions (figma-context-capture reads a library only) | Trial first: derive by hand the patterns that repeat across a governed project's stored screens. If it holds, a script derives the recipes from the stored screens (regions, components, spacing tokens, required states), generated and not hand-written (§D 23), and capture records the project's choices about them in the context document | the derivation is new, and its owner (the snapshot's readers, or `component-contract`) is decided at the trial; recording stays figma-context-capture's |
| Agents cannot fetch screen knowledge | Serve an index on demand, the recipe as generated data with links to the template, example stored screens, the project's screen decisions and the pattern pages: which template fits a task, which stored screens are examples of it, what each region must contain. The templates themselves stay files, never a second copy in the server (every system that gives agents screens ships them as files: shadcn `registry:page`, Polaris templates, Ant Design Pro, Atlassian's starters) | `tools/docs-site` (renders them) → `system-mcp` (one reader for agents) |
| Prose instructions fail on shells and navigation | Keep the shell and navigation as configuration that templates read: a JSON file in the project's code repo, which the context document points to rather than copies | the project; the guidance is in `knowledge/code/agent-prototyping.md` |
| Context documents are already 336 to 933 lines | Keep the screens section to one table of decisions (screen type, required states, shell config); done 2026-11-11 as the context template's §3 *Screens*, asked by figma-context-capture's pass M (2.13.0). Measure it at the trial; only if it does not fit, amend §D 12 so a context document may be a folder (an index and a file per section), for every project at once | figma-context-capture records it; the amendment, if needed, is toolkit-standard's |
| No templates to start from | Make one template per recipe, in code and in Figma, held to parity. Templates are the main carrier, recipes the index: the evidence ranks templates and config first, example screens next, prose last. Figma, 2026-11-04: one per shell the recipe found (the app shell, 99 screens; the standalone page, 15), each a private component (`_Template / …`) with the page body in a Content slot, every value bound, on a scratch page of one library; the feedback page was rebuilt from the app shell's and checks clean. A composer fills the template's own slot by its place, never the first slot found: the first found was a menu slot inside the Sidebar. Whether they move into the library is the designer's call. In code, 2026-11-05: `AppPage` (shell, Page header, a Section of Blocks) with a `Templates/App page` story, and agents start undrawn screens from it (Outcome 6, Template). Where a project's screens are already instances of template components, the recipe reads them as templates and pairs each with its code file from `templates` in `snapshot.config.json`, any framework (2026-11-05: a project with 12 Figma templates, desktop and mobile, over 6 server templates); `get_screen_recipe` serves the pair | built through Outcomes 3 and 4; measured by `tools/parity` |

**The trial, by hand (2026-11-04), over one governed project's 114 stored screens.** The patterns hold, and a script can read them, because every frame and gap is bound to a token:

- *Two shells.* 99 screens are the app shell: a sidebar beside a main region whose children are a page header and one section, with a dialog, toast, side panel or action bar laid over it. 15 are standalone: 13 a main region holding one container (sign-in, onboarding, a confirmation), and 2 shared views with a page header and a section but no sidebar.
- *Two kinds of content.* A form or settings screen is a section of blocks (gap `Spacing/8`), each block a container padded `Spacing/80` and `Spacing/32` holding a column of a section marker and its content. A collection is a container holding a tool bar (a title, or filter chips), then summary cards or an empty state. Edit and create screens add a page footer.
- *States are named, not structured.* What a screen covers shows only in its name (success 10, error 10, dialog 7, empty 5): a recipe's required states can be read from the names in a section of screens, and a missing one is a gap to report.
- *A drift the derivation would surface.* A block's column gap is `Spacing/32` or `Spacing/40` (by hand 74 and 33 blocks; the script, counting every occurrence, 76 and 43, and one `Spacing/20`). A recipe states one value; which is the designer's ruling (§6), not the script's.

The derivation is built: `tools/snapshot/recipes.cjs` (README, *Screen recipes*), the snapshot's readers being the one reader of a project's design (§D 1). Over the same 114 screens it finds the two shells, 68 repeated regions (slots included: what each dialog, tab bar and card holds), 10 regions whose spacing varies (16 gap or padding values), unbound values to fix (a padding of 204, of 40) and 66 screen types with their states. system-mcp serves it as `get_screen_recipe`, and Outcome 6 measures whether it helps.

---

## Outcome 3 — A code prototype anyone can review, which never ships by accident

*Done when:* a flow prototype runs on the real components, opens from a link without an account, and lists what it invented. An accepted prototype is rebuilt on a feature branch behind the gate. A prototype branch cannot reach production.

| Gap today | Fix | Owner |
|---|---|---|
| No workflow to compose a screen from a recipe and return a receipt | Add a prototype mode to the skill that already builds UI | frontend-build (§D 1: building UI has one owner). Parity stories stay design-code-parity's: they map variants for measuring, while a prototype is a screen being built |
| Flows have no home | Write templates as stories in a `Templates/` group and flows as stories in a `Prototypes/` group: local state, links, play functions, mocked data | frontend-build's guidance; the method is in the research piece |
| An agent cannot see or test what it built | Turn on Storybook's MCP in the project for its preview and test tools (`stories-preview`, `test-run`); leave its documentation tools off, so the contract stays the one source of a component's API | the project; the guidance is in `knowledge/code/agent-prototyping.md` (*Giving the agent the system*) |
| Nothing stops a prototype branch being merged | Refuse merges from prototype branches at the push gate | project-check |
| Reviewers need a link | Publish per branch, linked to the full-screen view of the story | the project's host; guidance only |

---

## Outcome 4 — A Figma prototype made of the library, which a designer can continue

*Done when:* an agent composes a screen or a short flow on a scratch page from library instances and variables only, starting from the Figma template for its recipe. A code prototype that should continue in Figma is rebuilt here from the same template, never converted. Prototype connections are wired where a flow is the point, and the receipt has the same format as Outcome 3's. A check confirms that nothing in it is detached or unbound.

| Gap today | Fix | Owner |
|---|---|---|
| No route has been chosen for composing in Figma | First trial 2026-11-04, Figma Console on one library: a feedback page no one has drawn, composed from the recipe (the app shell: Sidebar and Main; Main's header, then Section › Block › Container › Column with a Section marker and Content). Eight scripted calls built it from 98 library instances with every gap and padding bound to a Spacing variable, the selection group's slot filled with its own list items, and the copy set through component properties. Three lessons: a property set by name reaches nested instances too (the page header's button took the new label), so a composer scopes every set to the node it means; this file's access mode needs `getMainComponentAsync`; and the composer's own background was a raw white until the check below caught it. Second trial 2026-11-10, a four-frame flow (table, detail drawer, edit dialog, saved toast) on another project's app-shell template, 167 instances, wired as a Figma prototype, `FCA.composedFrame` clean on all four. Figma's `use_figma` route failed on its first write: the cloud has no font a team installs locally (here Inter Display), so moving or editing any instance that holds such text throws; Figma Console, running in the desktop app, has the fonts. Two more lessons: a text property is set by its name, never as an instance's first text property (a field's Label instance lists Description first, and every label stayed "Label"); and a field's `Required` variant also switches an Optional indicator, so a read-only label needs its indicator off. Route: Figma Console, until a project's fonts reach the cloud (an organisation's shared fonts; unchecked) | none; the route chosen is Figma Console |
| A composer starts from the bare template while the file holds reference screens built on it: the 2026-11-10 trial built its table from the template and missed the designer's own table screen (a toolbar with its toggle group, ten rows, the hug-height variant), because it read the template and not the instances of it | Done 2026-11-10 (figma-components-audit 2.44.0, frontend-build 2.11.0): before composing, the composer lists the whole library (the system MCP's `overview`, or the library listing with no snapshot), since a screen may need components no reference holds; `FCA.references(template)` lists every screen built on the template, and the composer starts from a copy of the closest; it walks the knowledge base from `knowledge/README.md` where the toolkit is present, not only the pattern pages. Each frame carries a receipt (shared plugin data `fca` / `receipt`: reference, components, invented, knowledge read), and `FCA.composedFrame` with `{ receipt: true }` fails a frame with none or naming no reference. The rebuilt trial flow started from the table screen. Where a library is snapshotted, `get_screen_recipe` serves the same example screens | figma-components-audit (the probe beside `FCA.composedFrame`, and the check); the receipt's field, frontend-build (row below) |
| Nothing checks a composed frame: the scanner reads library components only, and detached instances come from a session probe | Add a frame scope to figma-components-audit: the detached-instance probe plus an instances-only and bound-values check, not a second scanner. The trial's own probe (every frame outside an instance has bound gaps, paddings and fills; every instance has a main component; no other node outside an instance) found the one raw value, so the check is the right size. Done 2026-11-05 (2.42.0): `FCA.composedFrame` reads what was composed, the frame and what was put in its instances' slots, never a slot's default content; live on the trial page, clean, and it named three planted defects | figma-components-audit |
| A composer meets a reference screen the knowledge base disagrees with (the 2026-11-10 trial: read-only values as disabled inputs, a toast after a visible save, a Sort button, a drawer with tabs under a dialog) | Done 2026-11-10 (frontend-build 2.12.0): fix what the content decides, keep the designer's pattern, and post a Figma comment on the layer citing the page; never a blocker | frontend-build |
| A receipt's invented items go nowhere | Each invented item is filed as a decision row (`b3`) through the audit's row writer, so system gaps reach the same queue and rulings as audit findings; a second backlog is not made | `tools/figma-audit/rows.mjs` (the one writer) |
| Two receipt formats would drift | One receipt format, moved to `tools/shared` once Outcome 4's trial gives it a second caller; until then it lives with figma-prototype (2026-11-10: its Figma form, `{ reference, components, invented, knowledge, rulings }`, in *Compose*; a code prototype's receipt takes the same fields, `reference` naming the template or story it started from) | figma-prototype, then `tools/shared` |

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
- **Status (2026-11-04):** the tool is built: a task with `"grade": "validate"` and the `--context on|off` switch (`tools/skill-evals/README.md`, *Screen tasks*), proven with a stub agent. First baseline, one project's notification-settings task: context off and on both scored 1 (green, 12–13 files, no finding, about $1.50 and 4 minutes each), and the context-on agent never asked the system. The task cannot tell the two apart: in a repo with the system's code and pages built on it, the agent copies the code around it. A second task with no near neighbour (a feedback page needing a single choice from a list, which no page builds yet) scored 0.833 both ways, 3 raw elements each, and again the context-on agent never asked the system. Offering the context is not enough: an agent with the system MCP loaded does not call it unprompted. The first lever was the server's own instructions, which read as documentation: rewritten to say the system is what the interface is built from and to ask it before writing any interface code, the context-on agent called it in both tasks (search, get_component, get_contract, validate) and the feedback task went 0.833 → 1, the settings task staying at 1, for about 25% more turns and cost. With two repeats each on the feedback task (the first run above included): off 0.833, 0.833, 0.875 (a raw radio, text area and checkbox every run); on 1, 1, 1. Each line now records what validate found, not only how much.
- **Layout (2026-11-04):** validate does not grade layout, so a parity task removes a drawn screen's code and asks for it back, graded by parity against the stored frame, with `--context` named for both settings. A screen with a near-identical sibling (an empty projects page beside an empty contacts page) scored 1 three times each way, at about $0.80; so did a screen with no sibling (a freelancer's confirmation page, 1364 measurements), at about $1.10. The context-on agent never asked the system in any of them. Where a frame is drawn, the stored frame and the parity loop are enough to rebuild its layout exactly, and the recipe adds nothing there; its use is a screen with no frame, which validate's tasks already measure. A screen whose mapping measures its live route cannot be graded in an eval copy yet: the copy's linked dependencies stop the app from starting (pnpm, then Turbopack, refuse a `node_modules` outside the project).
- **Template (2026-11-05):** an undrawn screen, the notifications page, asked for with no path and graded by validate, context on. Before the code template existed, both valid runs added a third tab to the drawn account settings screen; that kept the shell but changed a measured screen, and one agent said so itself (the frames draw two tabs). With `AppPage` and one AGENTS.md line, the valid run built a new page from it under the shelled routes, and so did the void one, by its note. Every valid run (three) scored 1: the score can't tell "extended a drawn screen" from "started from the template", and only the agents' notes show it. The runs before the template predate the `chrome` field (a page that imports no shell module scores 0), so they were not graded on it. Two runs of five were void because the agent ran git. The earlier feedback miss (a page outside the shell, unstyled) came from a prompt that named a path there.
- **Figma (2026-11-11):** a Figma task (`tools/skill-evals/README.md`, *Figma tasks*): a fresh subagent composes a flow in the file by figma-prototype's *Compose*, graded by figma-components-audit's probes on its own page (clean, a real reference in the receipt, knowledge read, no loose layers, the screens and flow asked). The grader was proven on a hand-built flow (1) and a broken frame (0.4). First run, an add-employee flow: 0.944, three screens copied from the table reference and wired; one screen not clean, a raw text layer standing in for a dialog note the library has no slot for, which the agent named as invented. A run is one sample; trials and a context-off arm are not run yet.
- **Unstated requirements (parked 2026-11-12, not dropped; first step when picked up: a rubric for the `notifications-page` task):** today a task is graded only on what its prompt states (validate, chrome, parity). Add a rubric item per task for what the project knows but the prompt leaves out (a ruling, a product flow, a template), and run it on tasks of rising complexity: if the context helps, the context-on score should hold as tasks get harder. The split comes from Groos ([*Probabilistic isn't a dirty word*, 2026](https://www.designsystemscollective.com/probabilistic-isnt-a-dirty-word)), who plans it but has not run it.
- **Held-out tasks (parked 2026-11-12):** once the task set reaches about 20 (the toolkit's guess, from the 20 to 50 a first eval set takes in [agent-prototyping](../knowledge/code/agent-prototyping.md)), hold a share out as [testing: evals](../knowledge/code/testing.md#evals-testing-the-agent-not-the-code) describes; with a handful today, a held-out set would be one or two tasks and prove nothing.
- **Signals:** invented components, invented props and raw values (all should fall), invented items in receipts (should fall as recipes grow), and differences between a stored screen and its generated code (should be zero).

---

## Order

1. Outcome 1, then Outcome 6's baseline. Every later outcome is measured against both.
2. Outcome 2's trial, then its recipes. Outcomes 3 and 4 need them.
3. Outcomes 3 and 4, which can run side by side.
4. Outcome 5, new ground, starting with one stored screen.
5. The shared shaping lands with the server reading the snapshot.

## Open

- **Project knowledge has one door** (closed 2026-11-11): the product file, live decisions and guidance pages are served by the system MCP's `get_project_knowledge`, so a code agent in a playground reads what a Figma run reads.
- Code Connect needs a Figma plan with the right seats. It is only needed for the Figma MCP route, so check it for each project before building that.
- A project whose code is a read-only clone prototypes in a separate repo on its published package. Outcome 3's gate applies there. Where the package's feed needs a token the toolkit does not hold, the package is built from the clone with its own build script and packed (`pnpm pack`), named by the clone's commit so the lockfile's checksum stays true, and kept out of git (13 MB a copy); set up for one project 2026-11-10, parked until its templates exist.
- Figma Make kits with a package are parked until a trial shows that they import the package; Vallaure's Part 3, expected 10 November, is not yet read here (as of 2026-11-11).

## Ideas, not yet committed

From Knapsack's Context product ([MCP docs](https://knapsack.docs.buildwithfern.com/context/mcp.md), [overview](https://knapsack.docs.buildwithfern.com/context/overview.md)), read 2026-11-04. Each needs a trial before it becomes a row.

- **Corrections an owner accepts.** Knapsack's `remember` tool lets a team correct what agents are told, and a correction takes effect only once an owner accepts it. The audit already has this shape, so nothing new is built: the correction is filed as a decision row (bucket `b3`) through the audit's one row writer (`tools/figma-audit/rows.mjs`), it appears in the dashboard's queue, and once decided it becomes a ruling in the context document's §6 table through the service's `POST /ruling` (§D 8, §D 12). The `system-mcp` tool only files the row. It joins Outcome 1, after the gate.
- **What each agent received.** Knapsack keeps a record of what was delivered to each agent. Ours would be a `system-mcp` log of the answers a session asked for, so Outcome 6 can tie a bad result to the context it lacked. The audit record already keeps each run with its cost; whether a prototype run is kept the same way, or beside it, is decided at the trial. It joins Outcome 6, after the baseline.

Already covered, so not taken: their `check_usage` is `validate`, and their `render_ui` (a JSON screen spec rendered with real components) is what Outcome 5 does from stored screens. Knapsack has no screens, patterns or Figma flow, and its eval claims have no method.

## Beyond scope

Hosted app builders, wiring production data, and a canvas for designers who don't code. The research weighed each of these and set it aside.

Turning a coded screen into a Figma frame of instances. No tool does it (captures are flat layers), the only route is an agent rebuilding the screen, and nobody tests it. Outcome 4 covers the need by building from the same template in Figma.
