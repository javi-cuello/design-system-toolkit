# Building whole screens with an agent from the design system

How a team whose agent already picks the right components gets it to build the product's screens, and move them between Figma and code without redrawing them.

An agent is asked for a new settings page. It imports the library's `TextInput`, `Switch` and `Button`, and every colour comes from a token. The page still looks like someone else's product: a new header with the logo at 32px, a hand-rolled search box, no user menu, and a gap between the regions that no other screen uses.

The components were right. Everything that went wrong sits above them.

---

## What this answers

- [The layer above components](#the-layer-above-components): what a screen needs beyond components
- [Rules, templates or examples](#rules-templates-or-examples): which carries screen conventions best
- [Layouts and the MCP server](#layouts-and-the-mcp-server): whether the MCP server should serve layouts
- [Figma screen to code](#figma-screen-to-code): how a Figma screen becomes code
- [Code to Figma instances](#code-to-figma-instances): how code becomes Figma instances
- [The round trip](#the-round-trip): whether a screen can make the round trip

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs. How much of this has been measured is the subject of Part 9, [Measuring and showing agent readiness](measuring-agent-readiness.md).

---

## The layer above components

The page shell, the navigation, the regions, the spacing between regions and the states each region covers: a component catalogue carries none of them, so an agent that has only the catalogue invents all five.

Go back to the settings page. A component library answers "which `Button`, with which props". The screen asks other questions. Where does the page title sit? Is there a side panel, and how wide is it? What goes in the top bar? Is the gap between the filter row and the table one spacing step or two? What does the table show while it loads, when it is empty, when the request fails?

Here is that screen with the two kinds of answer separated.

<svg role="img" viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A settings screen in two layers. The components the catalogue covers, a text input, a switch and a button, are outlined in blue. Everything around them is labelled as what the agent must invent: the shell, the top bar navigation, the side section list, the gap between regions, and the loading, empty and error states of a region.</title>
<rect x="0" y="0" width="640" height="330" fill="#f7f6f2"/>
<rect x="20" y="20" width="400" height="290" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<rect x="20" y="20" width="400" height="40" rx="6" fill="#ece9e1" stroke="#c9c6bd" stroke-dasharray="4 3"/>
<text x="36" y="45" font-size="13" fill="#5a5850">Logo · Search · User menu</text>
<rect x="20" y="60" width="110" height="250" fill="#f1efe8" stroke="#c9c6bd" stroke-dasharray="4 3"/>
<text x="34" y="88" font-size="12" fill="#5a5850">General</text>
<text x="34" y="110" font-size="12" fill="#5a5850">Members</text>
<text x="34" y="132" font-size="12" fill="#5a5850">Billing</text>
<text x="150" y="88" font-size="15" font-weight="600" fill="#1a1a1a">Workspace settings</text>
<rect x="150" y="104" width="250" height="34" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="2"/>
<text x="162" y="126" font-size="12" fill="#1f5fbf">TextInput: Workspace name</text>
<rect x="150" y="148" width="250" height="30" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="2"/>
<text x="162" y="168" font-size="12" fill="#1f5fbf">Switch: Email digests</text>
<line x1="150" y1="190" x2="400" y2="190" stroke="#b5562b" stroke-dasharray="3 3"/>
<text x="275" y="204" font-size="11" fill="#b5562b" text-anchor="middle">gap: one step or two?</text>
<rect x="150" y="214" width="250" height="50" rx="4" fill="#ffffff" stroke="#c9c6bd" stroke-dasharray="4 3"/>
<text x="162" y="236" font-size="12" fill="#5a5850">Region: activity table</text>
<text x="162" y="254" font-size="11" fill="#5a5850">loading? empty? error?</text>
<rect x="300" y="274" width="100" height="28" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="2"/>
<text x="350" y="293" font-size="12" fill="#1f5fbf" text-anchor="middle">Button: Save</text>
<text x="440" y="44" font-size="14" font-weight="600" fill="#1a1a1a">Catalogue covers</text>
<rect x="440" y="56" width="16" height="12" fill="#ffffff" stroke="#1f5fbf" stroke-width="2"/>
<text x="464" y="67" font-size="13" fill="#1a1a1a">the components</text>
<text x="440" y="110" font-size="14" font-weight="600" fill="#1a1a1a">Agent invents</text>
<rect x="440" y="122" width="16" height="12" fill="#ece9e1" stroke="#c9c6bd" stroke-dasharray="4 3"/>
<text x="464" y="133" font-size="13" fill="#1a1a1a">the shell</text>
<text x="464" y="155" font-size="13" fill="#1a1a1a">the navigation</text>
<text x="464" y="177" font-size="13" fill="#1a1a1a">the regions</text>
<text x="464" y="199" font-size="13" fill="#b5562b">the gaps between them</text>
<text x="464" y="221" font-size="13" fill="#1a1a1a">each region's states</text>
</svg>

Only the three blue boxes come from the catalogue. The top bar, the section list, the gap and the table's states are all guesses unless something else tells the agent.

A design system usually answers these somewhere: in a patterns section, in page templates, in the product itself. It rarely answers them in a form an agent receives.

That this layer is where agents fail shows from two directions. [DesignBench](https://arxiv.org/html/2506.06251) ran 900 generation tasks across React, Vue and Angular, and the leading failures were wrong size, a missing element and wrong position: spatial errors, not component errors. And Atlassian's AI prototyping team found the chrome was where their models went wrong. The logo kept coming out wrong until it and the top navigation were taken out of the prompt's hands, a story told under [rules, templates or examples](#rules-templates-or-examples).

The servers design systems ship to agents mostly stop below this layer. Atlassian's and Carbon's serve nothing for layouts. Primer's goes furthest, with scenario patterns, while its `PageLayout` stays a component. The full roster is in Part 4, [How the design system reaches the agent](how-the-system-reaches-the-agent.md).

So a system can be fully "agent-ready" at the component level and still give its agent nothing about screens.

Treat screen conventions as their own deliverable, separate from the component catalogue. Before writing anything, take your product's most common screen and list what an agent would have to invent for it: the shell, the navigation, the regions, the gaps between them, and the states. **That list of five is what the rest of this guide finds a home for.** Treating the layer as missing is consensus among the teams that have written about it; the five-item list is a way of naming it, not a published standard.

---

## Rules, templates or examples

Templates and configuration carry screen conventions best, example screens next and written rules last, because something the agent edits beats something it only reads.

There are three ways to tell an agent how screens are built. A **written rule** is prose: "settings pages have a left section list and a single form column". A **template** is a runnable starting point, a settings page that already renders the shell, the section list and an empty form column for the agent to fill. **Example screens** are finished screens shown to the agent as references.

Atlassian tried more than one of these and [wrote down what happened](https://www.atlassian.com/blog/how-we-build/turning-handoffs-into-handshakes-integrating-design-systems-for-ai-prototyping-at-scale). Their first approach split guidance into per-topic files, `button.md`, `typography.md` and so on. Prototyping tools parsed these badly, so they moved to a single `guidelines.md` of about 2,000 lines with the priority rules at the top.

Prose still failed on the chrome: the models kept getting the logo wrong. The fix was to move the logo and the navigation into a JSON configuration the template reads, so that, in their words, the model edits the config, not the code. Logo errors dropped to near zero. They now ship two starter templates, Fast and Full, each with the instructions, feature flags, navigation and theme switcher already in place.

Their general lesson is that structured configuration beats open-ended prompting. The post gives one number: about 70 percent accuracy to the design system in one pass from a screenshot, with about 2,000 lines of custom instructions, without saying how that was measured. It gives no before-and-after counts for the logo. The models still made up imports and packages when told not to, and claimed the code was correct, and Atlassian names production-quality code at scale and automated evaluation as unsolved.

Here is the difference on the settings page's top bar, as an illustrative case built from that finding.

| | Written rule | Template plus config |
|---|---|---|
| What the agent gets | "The top bar holds the product logo at 24px, then the search field, then the user menu." | `shell.json`: `{ "logo": "product", "search": true, "userMenu": true }`, read by a `TopBar` the template already renders |
| What comes back | A new `<header>` with an `<img>` at 32px, a hand-rolled search box, no user menu | The same `TopBar` every other screen has, with the search turned on |
| What it costs you | A reviewer has to spot three deviations, and the next screen invents a fourth | Nothing to review in the chrome. Only the page body is new |

The rule was clear and the agent still rewrote the header. The template left nothing to rewrite.

The academic evidence points the same way, though it is thin. A [CHI 2026 extended abstract by Cha and colleagues](https://pure.seoultech.ac.kr/en/publications/design-system-compliant-user-interface-generation-with-llm-agents/) compared three ways of giving an agent a design system: the full style guide in the prompt, only the relevant guidance injected, and a registry of pre-built components. The registry scored highest, at 95% compliance. The sample was six interfaces, so it shows a direction, not a measure.

Example screens have one study of their own. [RAGG](https://arxiv.org/html/2412.11328v1) (Kolthoff and colleagues, 2024) retrieved existing screens as references for generation, and seven examples beat one or three on all eight rated qualities. Nobody has run the comparison that matters most here: example screens against written rules for the same product.

Templates have costs, and they are specific. A template is code, so it ages with the product: when the shell changes, every template has to change with it or it teaches the old shell. A template also anchors the agent. Asked for a screen no template covers, an agent bends the nearest template to fit rather than compose something new. Written rules have the opposite profile: cheap to change, and ignored under pressure.

Three traps come up again and again.

- **The scattered guideline set.** Per-topic files the agent must assemble itself. Atlassian found tools could not parse them; one ordered file worked better.
- **The chrome in prose.** Navigation, logo and shell described in words. Invention is most reliable here and most visible, because every screen shows it.
- **The template nobody owns.** A starter copied once from the product and never updated. It teaches the agent last year's shell with full confidence.

Put your shell and navigation into a configuration file that a template reads, and give the agent one template per common screen type. Keep prose for what a template can't express, such as which states a region must cover, and show example screens where they exist. **Generate each template from the real shell, or test it against the shell, so it can't drift.** Ranking templates above prose is consensus among the sources; placing example screens between them rests on two small studies, so treat that middle position as provisional.

---

## Layouts and the MCP server

An MCP server can point to layouts, but the screen itself reaches the agent as files (a starter repo, a registry page, a skill), and every system that ships screen conventions to agents ships them that way.

An MCP server answers questions during a session. That suits components, which are looked up one at a time: "what props does `Tabs` take?" A screen is different. To build the settings page the agent needs a whole tree of files to start from, not an answer to a question, and the systems that give agents screens all deliver files.

**shadcn/ui** is the clearest case. Its registry has an item type, [`registry:page`](https://ui.shadcn.com/docs/registry/registry-item-json), defined as pages or file-based routes, which must declare a `target` path. Its [blocks gallery](https://ui.shadcn.com/blocks) offers full screens such as `dashboard-01`, a dashboard with sidebar, charts and data table, installed with `npx shadcn add` into `app/dashboard/page.tsx`. Its [MCP server](https://ui.shadcn.com/docs/mcp) browses components, blocks and templates. So the server finds the screen and the CLI installs it.

**Shopify Polaris** publishes [App Home templates](https://shopify.dev/docs/api/app-home/patterns) named Homepage, Index, Details and Settings, plus compositions such as Index table and Setup guide. The same lists reach agents through a reference file in [Shopify's agent skill](https://github.com/Shopify/shopify-ai-toolkit), built on the `s-page` and `s-grid` web components.

**Ant Design** splits it the same way. Its [MCP server](https://ant.design/docs/react/mcp) has `antd_list`, `antd_info`, `antd_demo` and a prompt named `antd-page-generator`. The page conventions themselves live in [Ant Design Pro](https://github.com/ant-design/ant-design-pro), a starter repo with templates for Dashboard, Form, List, Profile, Result, Exception and Login, and its own `AGENTS.md`, `CLAUDE.md` and Claude skills.

Vercel's v0 looks at first like a counter-example. It used to take a design system as a [shadcn registry with example blocks](https://v0.app/docs/design-systems). Its [newer import](https://v0.app/docs/design-systems-2) installs the system as an npm package or a "design system skill", and labels the registry route legacy. That moves v0 away from blocks, not away from files: the skill is still a folder the agent reads.

These aren't copies of one idea. shadcn blocks and v0 are one ecosystem, linked by an "Open in v0" button, so they count as one decision. Atlassian, Polaris, Ant Design and Primer show no sign of copying each other or shadcn, and they reached the same split on their own: components through a server, screens through files.

One toolkit's server shows what that split looks like from the server's side. Its `get_screen_recipe` tool answers how one project builds a screen, derived from the project's stored screens: the screen templates with the code file each starts from, the shells and their overlays, and the repeated regions with their slots and spacing tokens. It names the files and never serves them, so the screens still reach the agent from the repo.

Keep your server for lookups: which template fits this task, which example screens exist, what each region must contain. Ship the templates themselves as files in the repo the agent works in, or as installable registry items. **If the server serves screen knowledge at all, make it an index that points to the files, never a second copy of them.** This is consensus across four systems that reached it independently.

---

## Figma screen to code

A Figma screen becomes code with real imports only where each instance is mapped to its code component through Code Connect or an equivalent; everything unmapped comes back as generated markup, and whole screens should be read region by region.

Say the settings page was drawn in Figma first, and an agent is asked to build it. Figma's MCP server returns code for "a layer or selection" through `get_design_context`, by default React with Tailwind classes. Where an instance is mapped with Code Connect, the server wraps it in a `<CodeConnectSnippet>` that carries the real import and the mapped props.

That wrapper is the whole difference. [Figma's own documentation](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/) calls Code Connect the most effective way to get an agent to reuse real components, because without it the agent has to guess which code component a Figma instance means.

Here is the settings frame with three components mapped and one that nobody connected.

<svg role="img" viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A settings frame read by Figma's MCP server. Button, TextInput and Switch are mapped with Code Connect and come back as real imports. The Stat card has no mapping and comes back as Tailwind markup with copied colours. The frame's own layout also comes back as Tailwind divs.</title>
<rect x="0" y="0" width="640" height="250" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">The Figma frame</text>
<rect x="20" y="42" width="280" height="190" rx="6" fill="#ffffff" stroke="#c9c6bd" stroke-dasharray="4 3"/>
<rect x="36" y="56" width="248" height="40" rx="4" fill="#ffffff" stroke="#b5562b" stroke-width="2" stroke-dasharray="5 3"/>
<text x="48" y="81" font-size="12" fill="#b5562b">Stat card (no mapping)</text>
<rect x="36" y="106" width="248" height="32" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="2"/>
<text x="48" y="127" font-size="12" fill="#1f5fbf">TextInput (mapped)</text>
<rect x="36" y="146" width="248" height="32" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="2"/>
<text x="48" y="167" font-size="12" fill="#1f5fbf">Switch (mapped)</text>
<rect x="184" y="190" width="100" height="30" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="2"/>
<text x="234" y="210" font-size="12" fill="#1f5fbf" text-anchor="middle">Button (mapped)</text>
<text x="340" y="30" font-size="14" font-weight="600" fill="#1a1a1a">What comes back</text>
<text x="340" y="81" font-size="13" fill="#b5562b">a div with copied gray-200 styles</text>
<text x="340" y="127" font-size="13" fill="#1f5fbf">import { TextInput }</text>
<text x="340" y="167" font-size="13" fill="#1f5fbf">import { Switch }</text>
<text x="340" y="210" font-size="13" fill="#1f5fbf">import { Button }</text>
<text x="340" y="236" font-size="12" fill="#5a5850">The frame itself: flex, gap-6, p-8 (Tailwind)</text>
</svg>

The blue rows arrive as the library's components. The orange one arrives as a lookalike, and the dashed frame around them all arrives as utility classes. In code, it looks like this (an illustrative case built from the documented behaviour):

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

Three of your four components are real. The fourth is a lookalike with copied colours, and the layout around them is Tailwind, not the product's layout components. A check that reads imports, the test in Part 8, [Prototyping with a design system's real components](prototyping-from-real-components.md), catches the Stat card. Nothing catches the layout unless the shell is a template.

The mechanism has documented limits that bite at screen scale.

- **Large selections return incomplete results.** [Figma's docs](https://developers.figma.com/docs/figma-mcp-server/avoid-large-frames/) say so, and recommend `get_metadata` for the frame's structure, then `get_design_context` on its parts.
- **Nested instances need their own mapping.** [Code Connect's React docs](https://developers.figma.com/docs/code-connect/react) say a nested instance must be connected separately. Unmapped content in a slot is omitted.
- **Mappings drop in transit.** Users reported the same node returning Code Connect output on one call and raw Tailwind on the next ([forum 57542](https://forum.figma.com/report-a-problem-6/dev-mode-mcp-get-design-context-returns-code-connect-output-sometimes-raw-react-tailwind-other-times-is-this-expected-57542)), snippets dropping once a component became a component set ([forum 50957](https://forum.figma.com/report-a-problem-6/mcp-get-design-context-drops-code-connect-snippets-as-soon-as-a-component-becomes-a-variant-set-component-set-50957)), and snippets dropping for library instances in a consumer file ([forum 59364](https://forum.figma.com/report-a-problem-6/remote-mcp-omits-code-connect-snippets-for-library-instances-in-consumer-files-59364)), which Figma fixed on 28 October 2026.
- **Seats.** [Code Connect](https://developers.figma.com/docs/code-connect/) needs a Dev or Full seat on a Professional, Organization or Enterprise plan.

How much does mapping help? Figma [measured it once](https://www.figma.com/blog/the-benefits-of-code-connect-in-mcp/). In August 2026 it ran 27 design-to-code cases with and without Code Connect: median time fell about 20%, tokens about 30%, and an LLM judge's quality score rose from 2 to 3 out of 4. Those were components, not screens. The other vendors that map components, [Builder.io](https://www.builder.io/c/docs/component-mapping-migration-guide) (now by indexing the repo), [Anima Frontier](https://docs.animaapp.com/docs/component-matching-copy) and [Locofy](https://www.locofy.ai/docs/plugin/design-system/overview/), publish no rate at which mapped components are actually used.

Map every component your screens use, nested ones included, before expecting real imports. Read a screen as its regions: `get_metadata` on the frame, then `get_design_context` on each region. **Run an import check on the result, because the fallback to markup is silent.** Give the agent the shell as a template so the layout around the components isn't invented. The mapping requirement and the reading by region come from Figma's own docs; the import check is added because nothing in the pipeline reports a dropped mapping.

---

## Code to Figma instances

Capture alone produces flat layers; real instances come only from an agent rebuilding the screen in Figma from the library, with the capture kept as a picture to copy.

Now run the settings page the other way. It exists in code, and the designers want it in the Figma file to iterate on. Figma launched [code to canvas](https://www.figma.com/blog/introducing-claude-code-to-figma/) in February 2026: its `generate_figma_design` tool captures a running page into Figma. The [developer docs](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/) describe the result as flat layers with no connection to the file's libraries.

Variables are the one exception. When the target file has a library with variables, matching colours, numbers and strings are bound. Components are not: a [feature request](https://forum.figma.com/suggest-a-feature-11/figma-mcp-generate-figma-design-should-resolve-html-elements-to-existing-library-components-instead-of-raw-frames-51286) from the same month describes the output as having no component instances, no variable bindings and no variant properties, and the one reply suggests rebuilding with the agent instead.

The plugins in this space behave the same way. [html.to.design](https://html.to.design/docs/import-options/) creates new local styles and never links to a library. [story.to.design](https://story.to.design/docs/subcomponents) creates new Figma components from stories and links nesting only to components it created itself.

The route that produces instances arrived in March 2026, when Figma [opened the canvas to agents](https://www.figma.com/blog/the-figma-canvas-is-now-open-to-agents/) with `use_figma`, which runs Plugin API code. Figma's [`figma-generate-design` skill](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-generate-design/SKILL.md) uses it in a fixed order:

1. find Code Connect mappings;
2. list the file's libraries;
3. search the design system for components and variables;
4. inventory existing screens;
5. import components by key and create instances;
6. set their properties and bind variables.

It runs `generate_figma_design` alongside only as a visual reference, then tells the agent to delete that output.

The weak point is the check at the end. The skill reads back node counts, takes a screenshot, confirms the product font and compares instance, style and bound-variable keys with the map it built. It has no scan for detached instances, and no full scan for values left unbound. On the settings page, that gap looks like this:

| What the agent did | What the skill's check sees | What a library audit sees |
|---|---|---|
| Instanced the library `Button`, then detached it to change the padding | A frame that looks right; nothing names the detached Button | A detached instance with padding 14, not the `space/300` it was bound to |
| Drew a divider as a 1px rectangle filled `#E5E5E5` | Correct in the screenshot, unless the key comparison happens to reach it | An unbound fill, where `color/border/subtle` exists |

Both rows pass a screenshot and both fail the system.

Southleft's [Figma Console MCP](https://docs.figma-console-mcp.southleft.com/tools.md) offers the same building blocks under other names, such as `figma_instantiate_component`, which imports from the published library and reports overrides that failed. It documents no screen workflow.

Don't treat a capture as the design. Compose from the library with the agent route, keep the capture as reference only, and **run a library audit over the composed frame that fails on detached instances and unbound values.** The capture's limits are documented by Figma; the audit is there because the vendor skill's own check stops at keys and screenshots.

---

## The round trip

Nobody tests a screen's round trip: vendors describe a round trip and claim near-complete coverage, but no one publishes a diff of the two sides or a list of what was lost.

A round trip means the settings page goes from Figma to code and back, or code to Figma and back, and arrives as the same thing: the same components, the same props, the same bound values, the same layout. Figma's [May 2026 post on the design-to-code loop](https://www.figma.com/blog/what-the-design-to-code-loop-unlocks/) says the loop completes the round trip, and speaks of getting close to 100% coverage. It offers no diff and no test.

Token-only round trips do exist: Figma Console MCP keeps variable IDs stable across export and import. No source tests a screen.

What fails to cross is predictable from the two legs above, [Figma to code](#figma-screen-to-code) and [code to Figma](#code-to-figma-instances), even without a vendor list.

- **Behaviour.** Figma's design-to-code skill calls its output a non-interactive prototype. Hover, focus, validation and transitions don't exist in the frame.
- **Data and states.** A frame is one state with one set of sample data. Loading, empty and error exist in code and usually not in the frame.
- **Responsive layout.** [Figma2Code](https://arxiv.org/abs/2604.13648) (ICLR 2026) found models strong on visual fidelity and weak on responsive layout, because they copy fixed visual values from the design data.
- **Anything unmapped.** An unmapped component comes back as markup in one direction and as flat layers in the other. It is lost both ways.

That leaves two different things to test. The bindings (which component, which props, which variables) can be compared exactly: read the screen back as a tree of instances and diff it against what was sent. The look can only be compared by measurement: render both sides and compare geometry and colour within a tolerance.

A round trip passes when the binding diff is empty and the measured differences are inside tolerance. Each leg should also say what it could not carry, so that a lost state is reported rather than silently dropped.

Treat a lossless round trip as unproven, and build it one screen at a time. Diff the instance tree for bindings, measure the render for the look, and make each direction list what it dropped. **Until that exists, the design is the source for layout and the code is the source for behaviour, and neither is regenerated from the other.** That nobody tests the round trip is a finding; the two-part test follows from the split between what can be compared exactly and what can only be measured.

---

## Cheat sheet

| For | Do this | Not this |
|---|---|---|
| The agent to use the product's shell | A template that renders the shell, with navigation in config | A paragraph describing the top bar |
| Screen conventions the agent can follow | One template per screen type, plus example screens | Per-topic guideline files |
| The design system's MCP to help with screens | An index of templates and example screens | A second copy of the templates |
| A Figma screen as code with real imports | Code Connect on every component, nested ones too; read by region; check imports after | One `get_design_context` call on the whole frame |
| A coded screen as a Figma frame of instances | The agent composes from the library (`use_figma`), capture as reference only; audit after | `generate_figma_design` output kept as the design |
| Proof a round trip worked | Diff the instance tree, measure the render, list what each leg dropped | A screenshot that looks the same |
| To know whether any of it helps | A fixed task set, with and without context, scored by checks ([Part 9](measuring-agent-readiness.md)) | Vendor percentages |

---

## The short version

Your agent can use the right components and still build a foreign-looking screen, because the shell, the navigation, the regions, their spacing and their states sit above the component and rarely reach it in a form it can use. The systems that do pass them on (Atlassian, Polaris, Ant Design Pro and shadcn's blocks) pass them on as files: starter templates, installable pages, skills. Their MCP servers stop at components and patterns. Atlassian's experience is the clearest lesson: prose failed on the chrome until the logo and navigation became configuration in a template, and then logo errors went to near zero.

Moving a screen between Figma and code keeps the real components only where a mapping exists. From Figma to code, that means Code Connect on every component, nested ones included, and reading region by region, because whole frames return incomplete results. From code to Figma, capture tools give flat layers, and only an agent rebuilding the screen from the library gives instances; Figma's own skill does this and compares keys but doesn't scan for detached instances, so add that check yourself. Nobody tests a round trip as lossless. The test you'd need has two halves: an exact diff of the instance tree for bindings, and a measured render comparison for the look.

There is almost no measured evidence for any of it, so measure it on your own system ([Part 9](measuring-agent-readiness.md)). Templates over prose and components through a server, screens through files, are consensus; the place of example screens, the import check, the composed-frame audit and the two-part round-trip test are judgements built on it.

---

## What to re-check later

Researched November 2026. Vendor developer docs, MCP server sources, skill files and forum reports were checked against each other, and the benchmarks and papers were read for what they actually measured. The section on what has been measured moved to Part 9, [Measuring and showing agent readiness](measuring-agent-readiness.md), on 9 November 2026.

- **Figma's MCP tools change monthly.** The large-frame advice, the Code Connect snippet behaviour and the forum-reported drops were checked in November 2026. The consumer-file drop was fixed on 28 October 2026.
- **`generate_figma_design`** binds variables but not components as of November 2026. A version that resolves elements to library components would change [code to Figma instances](#code-to-figma-instances).
- **Primer's** `list_patterns` and `get_pattern` were read in the server source of 14 October 2026; the public docs page did not load. Primer's `SplitPageLayout` is still alpha.
- **v0** labels its registry route legacy as of November 2026.
- **Atlassian's 70 percent** is self-reported with no stated method, and the logo result has no before-and-after counts.
- **The Cha et al. result** (95% with a registry) rests on six interfaces, and only the winning arm's figure was visible. RAGG's example-screen result is crowd-rated, with 45 participants after cleaning.
- **Unopened sources.** Shopify's Dev MCP tool names, the Salesforce SLDS docs and the Material 3 page could not be opened, so nothing here rests on them.

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

### Primary: code-to-Figma and round trip

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

### Cited without a URL

- Primer MCP server source, `packages/mcp/src/server.ts` (commit of 14 October 2026): read in the repository, repository URL not recorded.
- Interaction2Code (arXiv 2411.03292): seen only in search results.
- Shopify Dev MCP tool names and the Salesforce SLDS documentation pages: the pages returned errors.

---

Part 7 of 9 in *The agent-ready design system*. Previous: [Part 6, Why agent rules need the harness](agent-workflow-enforcement.md). Next: [Part 8, Prototyping with a design system's real components](prototyping-from-real-components.md).
