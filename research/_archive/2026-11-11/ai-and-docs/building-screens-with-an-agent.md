# Building whole screens with an agent from the design system

How an agent learns to build a screen the way the product builds screens, and how that screen moves between Figma and code without being redrawn. Written for a design system team whose agents already use the right components and now get the layouts wrong.

Part 7 of 9 in *The agent-ready design system*. Previous: [Part 6, Why agent rules need the harness](agent-workflow-enforcement.md) Next: [Part 8, Prototyping with a design system's real components](prototyping-from-real-components.md)

---

## What this answers

- An agent uses the right Button and the right tokens, and the screen still looks foreign. What is missing?
- Should screen conventions be written as rules, given as templates, or shown as example screens?
- Should the design system's MCP server serve page layouts, or something else?
- When an agent turns a Figma screen into code, when does it get real imports and when does it get divs?
- When an agent puts a coded screen into Figma, when does it get library instances and when does it get flat layers?
- Can a screen make the round trip, and how would anyone know it arrived intact?

How much of this has been measured is in Part 9, [how much screen-building has been measured](measuring-agent-readiness.md#how-much-screen-building-has-been-measured). The cheat sheet (section 7) is the lookup table. The short version (section 8) is the whole guide in a few paragraphs.

---

## 1. What does an agent need beyond components to build a screen the product's way?

Most of what makes a screen look like the product is above the component: the page shell, the navigation, the regions, the spacing between regions, and the states each region has to cover. A component catalogue carries none of this, so an agent that has only the catalogue invents all of it.

A component library answers "which Button, with which props". A screen asks different questions. Where does the page title sit? Is there a side panel, and how wide is it? What goes in the top bar? Is the gap between the filter row and the table one spacing step or two? What does the table region show while it loads, when it is empty, when the request fails? A design system usually answers these somewhere, in a patterns section, in page templates, in the existing product. It rarely answers them in a form an agent receives.

The evidence that this layer is where agents fail comes from two directions. DesignBench (2025), which ran 900 generation tasks across React, Vue and Angular, found the leading failures were wrong size, a missing element and wrong position: spatial errors, not component errors. And Atlassian's AI prototyping team found that the chrome was where their models went wrong: the logo kept coming out wrong until it and the top navigation were taken out of the prompt's hands (section 2 tells that story).

The MCP servers that design systems ship today mostly stop below this layer: Atlassian's and Carbon's serve nothing for layouts, and Primer's goes furthest with scenario patterns while its `PageLayout` stays a component (the roster is in [Part 4, section 4](how-the-system-reaches-the-agent.md#4-which-design-systems-ship-a-server-skills-or-an-llmstxt-and-what-do-they-serve)).

So the gap is real and it is common. A system can be fully "agent-ready" at the component level and still give its agent nothing about screens.

**What to do.** Treat screen conventions as their own deliverable, separate from the component catalogue. Before writing anything, list the five things an agent would have to invent for the product's most common screen: the shell, the navigation, the regions, the gaps between them, and the states. That list is what the rest of this guide finds a home for. This much is consensus among the teams that have written about it; the order of the list is this guide's.

---

## 2. Rules, templates or example screens: which carries screen conventions?

Templates and configuration carry them best, example screens next, written rules last. Every source with evidence points the same way. Something the agent edits beats something the agent reads.

There are three ways to tell an agent how screens are built. A **written rule** is prose: "settings pages have a left section list and a single form column". A **template** is a runnable starting point: a settings page that already has the shell, the section list and an empty form column, which the agent fills. **Example screens** are existing finished screens shown to the agent as references.

Atlassian is the protagonist here, because they tried more than one and wrote down what happened. Their first approach split guidance into per-topic files, `button.md`, `typography.md` and so on. Prototyping tools parsed these badly, so they moved to a single `guidelines.md` of about 2,000 lines with the priority rules at the top. Prose alone still failed on the chrome: the models kept getting the logo wrong. The fix was to move both into a JSON configuration that the template reads, so that, in their words, the model edits the config, not the code. Logo errors then dropped to near zero. They now ship two starter templates, Fast and Full, each with the instructions, feature flags, navigation and theme switcher already in place. Their general lesson is that structured configuration beats open-ended prompting.

The post (26 November 2025) gives the one number for prototyping: about 70 percent accuracy to the design system in one pass from a screenshot, with about 2,000 lines of custom instructions, without saying how it was measured. Logo errors dropped to near zero after the JSON config, though no before-and-after counts are given. The models still made up imports and packages when told not to, and claimed the code was correct, and Atlassian names production-quality code at scale and automated evaluation as unsolved.

Here is the difference on one screen, as an illustrative case built from that finding.

| | Written rule | Template plus config |
|---|---|---|
| What the agent gets | "The top bar holds the product logo at 24px, then the search field, then the user menu." | `shell.json`: `{ "logo": "product", "search": true, "userMenu": true }`, read by a `TopBar` the template already renders |
| What comes back | A new `<header>` with an `<img>` at 32px, a hand-rolled search box, no user menu | The same `TopBar` every other screen has, with the search turned on |
| What it costs | A reviewer has to spot three deviations, and the next screen invents a fourth | Nothing to review in the chrome. Only the page body is new |

The academic evidence agrees, though it is thin. A CHI 2026 extended abstract by Cha and colleagues compared three ways of giving an agent a design system: the full style guide in the prompt, only the relevant guidance injected, and a registry of pre-built components. The registry scored highest, 95% compliance. The sample was six interfaces, so the result is a direction, not a measure. On example screens, the RAGG study (Kolthoff and colleagues, 2024) retrieved existing screens as references for generation, and seven examples beat one or three on all eight rated qualities. Nobody has run the comparison that matters most here, example screens against written rules for the same product.

Templates have costs, and they are specific. A template is code, so it ages with the product: when the shell changes, every template has to change with it or it teaches the old shell. A template also anchors the agent. Asked for a screen no template covers, an agent will bend the nearest template to fit rather than compose something new. Written rules have the opposite profile: cheap to change, and ignored under pressure.

Three traps come up repeatedly.

- **The scattered guideline set.** Per-topic files that an agent must assemble itself. Atlassian found tools could not parse them; one ordered file worked better.
- **The chrome in prose.** Navigation, logo and shell described in words. This is where invention is most reliable and most visible, because every screen shows it.
- **The template nobody owns.** A starter copied once from the product and never updated. It teaches the agent last year's shell with full confidence.

**What to do.** Put the shell and navigation into configuration that a template reads, and give the agent one template per common screen type. Keep prose for the rules a template cannot express, such as which states a region must cover. Show example screens where they exist. Generate templates from the real shell, or test them against it, so they cannot drift. The ranking of templates over prose is consensus among the sources; the claim that example screens sit between them is this guide's reading of thin evidence.

---

## 3. Should the design system's MCP server serve page layouts?

It can point to them, but the screen itself reaches the agent as files: a starter repo, a registry page, a skill. Every system studied that ships screen conventions to agents ships them that way.

An MCP server answers questions during a session. That suits components, which are looked up one at a time ("what props does Tabs take?"). A screen is different: the agent needs a whole tree of files to start from, not an answer to a question. The systems that give agents screens all deliver files.

**shadcn/ui** is the clearest case. Its registry has an item type `registry:page`, defined as pages or file-based routes, which must declare a `target` path. Its blocks gallery offers full screens such as `dashboard-01`, a dashboard with sidebar, charts and data table, installed with `npx shadcn add` into `app/dashboard/page.tsx`. Its MCP server browses components, blocks and templates, so the server finds the screen and the CLI installs it.

**Shopify Polaris** publishes App Home templates named Homepage, Index, Details and Settings, plus compositions such as Index table and Setup guide. The same lists reach agents through a reference file in Shopify's agent skill, built on the `s-page` and `s-grid` web components.

**Ant Design** splits it the same way. Its MCP server has `antd_list`, `antd_info`, `antd_demo` and a prompt named `antd-page-generator`. The page conventions themselves live in Ant Design Pro, a starter repo with templates for Dashboard, Form, List, Profile, Result, Exception and Login, and its own `AGENTS.md`, `CLAUDE.md` and Claude skills.

There is one counter-example worth knowing. Vercel's v0 used to take a design system as a shadcn registry, with example blocks. Its newer import installs the system as an npm package or a "design system skill", and labels the registry route legacy. That moves v0 away from blocks, not away from files: the skill is still a folder the agent reads.

The lineage check matters here. shadcn blocks and v0 are one ecosystem, linked by an "Open in v0" button, so they count as one decision. Atlassian, Polaris, Ant Design and Primer show no sign of copying each other or shadcn, and they reached the same split independently: components through a server, screens through files.

A toolkit's server shows the index in practice. Its `get_screen_recipe` tool answers how one project builds a screen, derived from the project's stored screens: the screen templates with the code file each starts from, the shells and their overlays, and the repeated regions with their slots and spacing tokens. It names the files and never serves them, so the screens still reach the agent from the repo.

**What to do.** Keep the server for lookups: which template fits this task, which example screens exist, what each region must contain. Ship the templates themselves as files in the repo the agent works in, or as installable registry items. If the server serves screen knowledge at all, make it an index that points to the files, never a second copy of them. This is consensus across four independent systems.

---

## 4. How does a Figma screen become code with real imports?

Only where each instance is mapped to its code component, through Code Connect or an equivalent. Everything unmapped comes back as generated markup, and reusing the real component there is left to the agent. Whole screens should be read region by region, not in one call.

Figma's MCP server returns code for "a layer or selection" through `get_design_context`. By default that code is React with Tailwind classes. Where an instance is mapped with Code Connect, the server wraps it in a `<CodeConnectSnippet>` that carries the real import and the mapped props. Figma's own documentation calls Code Connect the most effective way to get an agent to reuse real components, because without it the agent has to guess which code component a Figma instance means.

Here is what that means on one screen, as an illustrative case built from the documented behaviour. A settings frame holds a mapped `Button`, a mapped `TextInput`, a mapped `Switch`, and a `Stat card` that nobody connected.

```tsx
// what comes back
import { Button } from '@/design-system/button/button';
import { TextInput } from '@/design-system/text-input/text-input';
import { Switch } from '@/design-system/switch/switch';

<div className="flex flex-col gap-6 p-8">
  <div className="rounded-lg border border-gray-200 bg-white p-4">   {/* Stat card: unmapped */}
    <p className="text-sm text-gray-500">Seats used</p>
    <p className="text-2xl font-semibold">12 / 20</p>
  </div>
  <TextInput label="Workspace name" />
  <Switch label="Email digests" />
  <Button variant="primary">Save</Button>
</div>
```

Three of four components are real. The fourth is a lookalike with copied colours. The layout around them is Tailwind, not the product's layout components. A check that reads imports (the import test of [Part 8, section 2](prototyping-from-real-components.md#2-how-can-a-team-tell-real-components-from-copies-and-lookalikes)) catches the Stat card. Nothing catches the layout unless the shell is a template.

The mechanism has documented limits that bite at screen scale.

- **Large selections return incomplete results.** Figma's docs say so, and recommend `get_metadata` for the frame's structure, then `get_design_context` on its parts.
- **Nested instances need their own mapping.** Code Connect's React docs say a nested instance must be connected separately. Unmapped content in a slot is omitted.
- **Mappings drop in transit.** Forum reports from 2026 describe the same node returning Code Connect output on one call and raw Tailwind on the next; snippets dropped once a component became a component set; and snippets dropped for library instances in a consumer file (fixed by Figma on 28 October 2026).
- **Seats.** Code Connect needs a Dev or Full seat on a Professional, Organization or Enterprise plan.

Figma measured the gain once. In August 2026 it ran 27 design-to-code cases with and without Code Connect: median time fell about 20%, tokens about 30%, and an LLM judge's quality score rose from 2 to 3 out of 4. Those were components, not screens. The other vendors that map components, Builder.io (now by indexing the repo), Anima Frontier and Locofy, publish no rate at which mapped components are actually used.

**What to do.** Map every component the screens use, nested ones included, before expecting real imports. Read a screen as its regions. Run an import check on the result, because the fallback is silent. Give the agent the shell as a template so the layout around the components is not invented. The mapping requirement is consensus from Figma's own docs; reading by region is Figma's own advice; the import check is this guide's judgment.

---

## 5. How does a coded screen become a Figma frame of real instances?

Not by capture. The capture tools produce flat layers. Real instances come only from an agent rebuilding the screen in Figma from the library, using the capture as a picture to copy.

Figma launched code to canvas in February 2026. Its `generate_figma_design` tool captures a running page into Figma, and the developer docs are plain about the result: flat layers with no connection to the file's libraries. Variables are the one exception: when the target file has a library with variables, matching colours, numbers and strings are bound. A forum request from the same month describes the output as having no component instances, no variable bindings, no variant properties; the only reply, from a community member, suggests rebuilding with the agent instead. html.to.design creates new local styles and never links to a library. story.to.design creates new Figma components from stories and links nesting only to components it created itself.

The route that produces instances arrived in March 2026, when Figma opened the canvas to agents with `use_figma`, which runs Plugin API code. Figma's `figma-generate-design` skill uses it in a fixed order: find Code Connect mappings, list the file's libraries, search the design system for components and variables, inventory existing screens, import components by key, create instances, set their properties, and bind variables. It runs `generate_figma_design` alongside only as a visual reference, then tells the agent to delete that output.

The weak point is the check at the end. The skill reads back node counts, takes a screenshot, confirms the product font and compares instance, style and bound-variable keys with the map it built. It has no scan for detached instances, and no full scan for values left unbound. The difference matters on one screen.

| What the agent did | What the skill's check sees | What a library audit sees |
|---|---|---|
| Instanced the library `Button`, then detached it to change the padding | A frame that looks right; nothing names the detached Button | A detached instance with padding 14, not the `space/300` it was bound to |
| Drew a divider as a 1px rectangle filled `#E5E5E5` | Correct in the screenshot, unless the key comparison happens to reach it | An unbound fill, where `color/border/subtle` exists |

Both pass a screenshot and both fail the system. Figma Console MCP (Southleft) offers the same building blocks under other names, such as `figma_instantiate_component`, which imports from the published library and reports overrides that failed, but documents no screen workflow.

**What to do.** Do not treat a capture as the design. Compose from the library with the agent route, keep the capture as reference only, and run a library audit over the composed frame that fails on detached instances and unbound values. The capture limits are documented by Figma; the audit is this guide's judgment, filling a check the vendor skill leaves out.

---

## 6. Can a screen make the round trip, and how would anyone know?

Nobody tests it. Vendors describe a round trip and claim near-complete coverage, but no one publishes a diff of the two sides or a list of what was lost. The tests that would prove it have to be built.

A round trip means a screen goes from Figma to code and back, or code to Figma and back, and arrives as the same thing: the same components, the same props, the same bound values, the same layout. Figma's May 2026 post on the design-to-code loop says the loop completes the round trip, and speaks of getting close to 100% coverage. It offers no diff and no test. Token-only round trips exist: Figma Console MCP keeps variable IDs stable across export and import. No source found tests a screen.

What fails to cross is predictable from sections 4 and 5, even without a vendor list.

- **Behaviour.** Figma's design-to-code skill calls its output a non-interactive prototype. Hover, focus, validation and transitions do not exist in the frame.
- **Data and states.** A frame is one state with one set of sample data. Loading, empty and error exist in code and usually not in the frame.
- **Responsive layout.** Figma2Code (ICLR 2026) found models strong on visual fidelity and weak on responsive layout, because they copy fixed visual values from the design data.
- **Anything unmapped.** An unmapped component comes back as markup in one direction and as flat layers in the other. It is lost both ways.

That gives two different things to test. The bindings, meaning which component, which props and which variables, can be compared exactly: read the screen back as a tree of instances and diff it against what was sent. The look can only be compared by measurement: render both sides and compare geometry and colour within a tolerance. A round trip passes when the binding diff is empty and the measured differences are inside tolerance. Each leg should also say what it could not carry, so that a lost state is reported rather than silently dropped.

**What to do.** Treat a lossless round trip as unproven, and build it one screen at a time. Diff the instance tree for bindings, measure the render for the look, and make each direction list what it dropped. Until that exists, the design is the source for layout and the code is the source for behaviour, and neither should be regenerated from the other. That a round trip is untested is a finding; the two-part test is this guide's judgment.

---

## 7. Cheat sheet

| For | Do this | Not this |
|---|---|---|
| The agent to use the product's shell | A template that renders the shell, with navigation in config | A paragraph describing the top bar |
| Screen conventions the agent can follow | One template per screen type, plus example screens | Per-topic guideline files |
| The design system's MCP to help with screens | An index of templates and example screens | A second copy of the templates |
| A Figma screen as code with real imports | Code Connect on every component, nested ones too; read by region; check imports after | One `get_design_context` call on the whole frame |
| A coded screen as a Figma frame of instances | The agent composes from the library (`use_figma`), capture as reference only; audit after | `generate_figma_design` output kept as the design |
| Proof a round trip worked | Diff the instance tree, measure the render, list what each leg dropped | A screenshot that looks the same |
| To know whether any of it helps | A fixed task set, with and without context, scored by checks (Part 9) | Vendor percentages |

---

## 8. The short version

Agents that use the right components still build foreign-looking screens, because the shell, the navigation, the regions, their spacing and their states sit above the component and are rarely given to the agent in a form it can use. The systems that do give it, Atlassian, Polaris, Ant Design Pro and shadcn's blocks, give it as files: starter templates, installable pages, skills. Their MCP servers stop at components and patterns. Atlassian's experience is the clearest lesson: prose failed on the chrome until the logo and navigation became configuration in a template, after which logo errors went to near zero.

Moving a screen between Figma and code keeps the real components only where a mapping exists. From Figma to code, that is Code Connect on every component, nested ones included, read region by region because whole frames return incomplete results. From code to Figma, capture tools give flat layers, and only an agent rebuilding the screen from the library gives instances; Figma's own skill does this and compares keys, but has no scan for detached instances, so that check has to be added. Nobody tests a round trip as lossless. The test needs two halves: an exact diff of the instance tree for bindings, and a measured render comparison for the look.

There is almost no measured evidence for any of it, and a team building this has to measure it on its own system (Part 9).

---

## 9. What to re-check later

Researched November 2026. Vendor developer docs, MCP server sources, skill files and forum reports were checked against each other, and the benchmarks and papers were read for what they actually measured. The section on what has been measured moved to Part 9, [how much screen-building has been measured](measuring-agent-readiness.md#how-much-screen-building-has-been-measured) on 9 November 2026.

- Figma's MCP tools change monthly. The large-frame advice, the Code Connect snippet behaviour and the forum-reported drops were checked in November 2026. The consumer-file drop was fixed on 28 October 2026.
- `generate_figma_design` binds variables but not components as of November 2026. A version that resolves elements to library components would change section 5.
- Primer's `list_patterns` and `get_pattern` were read in the server source of 14 October 2026; the public docs page did not load. Primer's `SplitPageLayout` is still alpha.
- v0 labels its registry route legacy as of November 2026.
- The Cha et al. result (95% with a registry) rests on six interfaces, and only the winning arm's figure was visible. RAGG's example-screen result is crowd-rated, with 45 participants after cleaning.
- Shopify's Dev MCP tool names, the Salesforce SLDS docs and the Material 3 page could not be opened, so nothing here rests on them.

---

## Sources

### Primary: screen conventions for agents

- [Atlassian, *Turning handoffs into handshakes* (26 Nov 2025)](https://www.atlassian.com/blog/how-we-build/turning-handoffs-into-handshakes-integrating-design-systems-for-ai-prototyping-at-scale)
- [Atlassian, `@atlaskit/ads-mcp` README](https://unpkg.com/@atlaskit/ads-mcp/README.md)
- [Atlassian, llms.txt](https://atlassian.design/llms.txt)
- [shadcn/ui, registry-item.json](https://ui.shadcn.com/docs/registry/registry-item-json)
- [shadcn/ui, Blocks](https://ui.shadcn.com/blocks)
- [shadcn/ui, MCP server](https://ui.shadcn.com/docs/mcp)
- [v0, Design systems 2.0](https://v0.app/docs/design-systems-2)
- [v0, Design systems (legacy)](https://v0.app/docs/design-systems)
- [Primer, PageLayout](https://primer.style/product/components/page-layout/)
- [Shopify, App Home patterns](https://shopify.dev/docs/api/app-home/patterns)
- [Shopify, Dev MCP](https://shopify.dev/docs/apps/build/devmcp)
- [Shopify, shopify-ai-toolkit](https://github.com/Shopify/shopify-ai-toolkit)
- [Salesforce, sf-skills](https://github.com/forcedotcom/sf-skills)
- [Carbon, MCP concepts](https://www.carbondesignsystem.com/getting-started/carbon-mcp/concepts)
- [Android, Canonical layouts](https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts)
- [GOV.UK, Page template](https://design-system.service.gov.uk/styles/page-template/)
- [GOV.UK, Patterns](https://design-system.service.gov.uk/patterns/)
- [Ant Design, MCP](https://ant.design/docs/react/mcp)
- [Ant Design Pro](https://github.com/ant-design/ant-design-pro)
- [Fluent, AGENTS.md](https://github.com/microsoft/fluentui/blob/master/AGENTS.md)
- [Figma, Guidelines in Make](https://help.figma.com/hc/articles/33665861260823)
- [Figma, *Introducing Make kits and Make attachments* (2 Apr 2026)](https://www.figma.com/blog/introducing-make-kits-and-make-attachments/)

### Primary: Figma to code

- [Figma, MCP tools and prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)
- [Figma, Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)
- [Figma, Avoid large frames](https://developers.figma.com/docs/figma-mcp-server/avoid-large-frames/)
- [Figma, *Structure your Figma file*](https://developers.figma.com/docs/figma-mcp-server/structure-figma-file/)
- [Figma, Code Connect for React](https://developers.figma.com/docs/code-connect/react)
- [Figma, Code Connect overview](https://developers.figma.com/docs/code-connect/)
- [Figma, *The benefits of Code Connect in MCP* (5 Aug 2026)](https://www.figma.com/blog/the-benefits-of-code-connect-in-mcp/)
- [Code Connect issue 69, merged imports](https://github.com/figma/code-connect/issues/69)
- [Figma forum 57542, Code Connect output sometimes, Tailwind other times](https://forum.figma.com/report-a-problem-6/dev-mode-mcp-get-design-context-returns-code-connect-output-sometimes-raw-react-tailwind-other-times-is-this-expected-57542)
- [Figma forum 59364, snippets missing for library instances](https://forum.figma.com/report-a-problem-6/remote-mcp-omits-code-connect-snippets-for-library-instances-in-consumer-files-59364)
- [Figma forum 50957, snippets dropped for component sets](https://forum.figma.com/report-a-problem-6/mcp-get-design-context-drops-code-connect-snippets-as-soon-as-a-component-becomes-a-variant-set-component-set-50957)
- [Figma, Make kits with a code package](https://help.figma.com/hc/articles/43602872461079)
- [Builder.io, component mapping migration guide](https://www.builder.io/c/docs/component-mapping-migration-guide)
- [Anima, component matching](https://docs.animaapp.com/docs/component-matching-copy)
- [Locofy, design system overview](https://www.locofy.ai/docs/plugin/design-system/overview/)
- [Kombai, index a component library](https://docs.kombai.com/features/index-component-library)

### Primary: code to Figma and the round trip

- [Figma, Code to canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/)
- [Figma, *Introducing Claude Code to Figma* (17 Feb 2026)](https://www.figma.com/blog/introducing-claude-code-to-figma/)
- [Figma, *The Figma canvas is now open to agents* (24 Mar 2026)](https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/)
- [Figma, figma-generate-design skill](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-generate-design/SKILL.md)
- [Figma, *Code to canvas with your design system*](https://help.figma.com/hc/en-us/articles/40287261761559-Code-to-canvas-with-your-design-system)
- [Figma, *What the design-to-code loop unlocks* (12 May 2026)](https://www.figma.com/blog/what-the-design-to-code-loop-unlocks/)
- [Figma forum 51286, resolve HTML to library components](https://forum.figma.com/suggest-a-feature-11/figma-mcp-generate-figma-design-should-resolve-html-elements-to-existing-library-components-instead-of-raw-frames-51286)
- [html.to.design, import options](https://html.to.design/docs/import-options/)
- [story.to.design, subcomponents](https://story.to.design/docs/subcomponents)
- [Figma Console MCP, tools](https://docs.figma-console-mcp.southleft.com/tools.md)

### Primary: research and measured results

- [DesignBench (2025)](https://arxiv.org/html/2506.06251)
- [Figma2Code (ICLR 2026)](https://arxiv.org/abs/2604.13648)
- [Cha et al., Design system compliant UI generation with LLM agents (CHI 2026 EA)](https://pure.seoultech.ac.kr/en/publications/design-system-compliant-user-interface-generation-with-llm-agents/)
- [Kolthoff et al., RAGG (2024)](https://arxiv.org/html/2412.11328v1)

### Cited but not resolved to a URL

- Primer MCP server source, `packages/mcp/src/server.ts` (commit of 14 October 2026): read in the repository, repository URL not recorded.
- Interaction2Code (arXiv 2411.03292): seen only in search results.
- Shopify Dev MCP tool names and the Salesforce SLDS documentation pages: the pages returned errors.
