# Prototyping with an agent against the design system

How a coding agent builds a prototype from the design system's real components instead of drawing its own: what to hand it, how to ask, what checks its output, and how a prototype that wins becomes shipped code. It serves the design-standard principles *consistent, not uniform* (a prototype made of the shipping parts is judged on the shipping behaviour) and *honest* (what the agent invented is said, not hidden). What a component's data holds is [figma-handoff: what a component contract covers](figma-handoff.md#what-a-component-contract-covers); lint and CI gates in general are [testing](testing.md)'s; choosing a tool is the research piece *Prototyping with a design system's real components*, not this page.

**Implements:** no single pattern; it is how any ui page's pattern gets prototyped by an agent before it is built for real.

## Real components, not lookalikes

**What good looks like**
- [weak] The prototype imports the team's own package or source (`import { Button } from '@team/design-system'`); nothing is copied into the prototype or redrawn in it.
- [weak] A change to a token or a prop default in the library shows up in the prototype on the next run without anyone regenerating it.

**How**
- [weak] The import test: open the generated code and read the imports. If they come from the team's package, the components are real. If they come from a folder the tool created, they are a copy, and a `<button>` with a class and hex values is a lookalike. Vallaure's audit prompt asks the agent which file a component was imported from and which props it set, then compares that with the system's own component ([Vallaure, *AI prototyping inside your design system*](https://christinevallaure.substack.com/p/ai-prototyping-inside-your-design), commentary).
- [weak] A tool's own docs say which of the three it does. Lovable: "The design system's React components are copied into the connected project at `src/design-system/<slug>/`" ([Lovable](https://docs.lovable.dev/features/design-systems)). v0's newer import installs the package: "If a component, prop, or token cannot be verified from the sources, v0 should not use it" ([v0, design systems 2.0](https://v0.app/docs/design-systems-2)). Figma's MCP returns React and Tailwind reference code unless Code Connect maps the component to a real import ([Figma, Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)).

**Cases**
- A generated screen looks right, but its Button is a local `button.tsx` with the library's colours copied in, so the next library release changes nothing in it. That is a copy. Prototype where the package is installed.
- Claude Design's output carried the right props and tokens but dropped the headless primitives and the types; its own handover note calls it "a recreation for design and prototyping" (Vallaure, as above). Judge it as a concept, never as a starting point for the build.

**Accessibility**
- [weak] A lookalike carries none of the real component's keyboard model, name or focus ring, so an accessibility check on it says nothing about the product. Only real components make a prototype's accessibility result mean something.

**Check**
- *Script:* `tools/system-mcp/validate.mjs` with `--from <the system's import prefix>` fails on a library component imported by name from anywhere else (`import * as` is not read) or defined in the prototype, and on raw HTML where the library has a component. project-check's `validate` gate runs it on the code each push changes.
- *Judgement:* Change one token in the library. Did the prototype change?

**Sources:** Lovable, v0 and Figma are vendor docs. Vallaure is commentary. The toolkit counts only the first level, imports from the package.

## Giving the agent the system

**What good looks like**
- [moderate] The agent looks the system up during each session instead of answering from memory. It gets a closed list of components, props, allowed values and tokens.
- [weak] That list is generated from the source, never written by hand, and it is served on demand rather than pasted whole into the rules file.

**How**
- [weak] A component manifest: one entry per component with its purpose, every prop, its allowed values and its default. Storybook 10 builds one from the stories and types once `features: { componentsManifest: true }` is set in `.storybook/main.ts`; it is "off by default". `@storybook/addon-mcp` serves it at `/mcp` from the dev server. Its tools include `docs-list`, `docs-show`, `stories-find-by-component`, `stories-preview` and `test-run`. Storybook labels the whole feature preview ([Storybook, MCP overview](https://storybook.js.org/docs/ai/mcp/overview)). The docs tools need a React, Angular-Vite or Vue-Vite framework. The development and test tools work in any Storybook.
- [weak] Where the system already serves its contracts (the toolkit's `tools/system-mcp`), turn on Storybook's MCP for its development and test tools only (`stories-preview` for a reviewer's link, `test-run` after a change) and leave its component manifest off, so an agent has one answer for a component's API, not two that can drift.
- [weak] Storybook's docs give a snippet for the project's `AGENTS.md`/`CLAUDE.md`. It tells the agent to list the documented components and check their props before writing, and to run `test-run` after: "Never hallucinate component properties!" (same page).
- [moderate] A system with its own server serves the same closed set. Atlassian's `@atlaskit/ads-mcp` has `ads_plan`, `ads_search_components` and `ads_search_tokens`, plus axe-based accessibility tools ([README](https://cdn.jsdelivr.net/npm/@atlaskit/ads-mcp/README.md)). Primer's `@primer/mcp` has `list_components`, `get_component`, `find_tokens` "by intent or value" and `lint_css` ([Primer MCP](https://primer.style/product/getting-started/foundations/mcp)). Carbon has a hosted server ([Carbon MCP](https://carbondesignsystem.com/developing/carbon-mcp/overview/)). The toolkit's own is `tools/system-mcp`, which reads a project's docs site.
- [weak] A small system can skip the server: a generated manifest file the agent reads does the same job.
- [weak] Two formats aim to make the contract itself portable, not served. The Design System Doc Spec is a JSON Schema for documentation, draft 0.23.1, whose guidance can be marked `for: agent` ([schema](https://designsystemdocspec.org/schema), [repository](https://github.com/somerandomdude/design-system-documentation-schema)). Spectacular captures component specs from Figma into a published schema ([Spectacular](https://spectacular.systems/)). The Doc Spec can say how a guideline is checked (`checkedBy`, [Doc Spec](https://designsystemdocspec.org/)) and point at the check (`checks`, [schema](https://designsystemdocspec.org/schema)), but runs none; Spectacular's visual testing, marked experimental, checks its own emitted code against Figma ([Spectacular, testing](https://spectacular.systems/testing)), not code an agent wrote. So the check below is still needed.

**Cases**
- An agent pointed at the whole repository rebuilds a component that already exists, or copies an old pattern because it appears more often than the new one. Give it the manifest or the server, not the source tree. This is Vallaure's warning. The toolkit found no controlled study of agents copying the majority pattern. Fluent writes the instruction into its `AGENTS.md`: "Never copy patterns from existing code without verifying they match these instructions" ([Fluent AGENTS.md](https://github.com/microsoft/fluentui/blob/master/AGENTS.md)).
- Atlassian found that per-component guideline files were hard for prototyping tools to parse, so they went back to one `guidelines.md`. They also found a JSON config for the top navigation worked better than prose: "structured configuration beats open-ended prompting" ([Atlassian, *Turning handoffs into handshakes*](https://www.atlassian.com/blog/how-we-build/turning-handoffs-into-handshakes-integrating-design-systems-for-ai-prototyping-at-scale)). Even with instructions, their models still got packages and code samples wrong while saying the code was right, which is why the check below runs on the output and not on trust in the prompt.

**Accessibility**
- [weak] Serve each component's accessibility guidance with its API (Primer's `get_component_accessibility_guidelines`). An agent that can find the props but not the labelling rules will set the props and skip the labels.

**Check**
- *Script:* the manifest is regenerated in CI and differs from the committed copy only when the components changed.
- *Judgement:* Did the agent call the lookup before writing, or answer from memory?

**Sources:** Storybook, Atlassian, Primer and Carbon are vendor docs; the Doc Spec and Spectacular are their own sites. Storybook's figures for Reshaped (27% fewer tokens, 2.76× faster, 12.8% better code usage, [blog](https://storybook.js.org/blog/storybook-mcp-for-react/)) come with no published method, so read them as a direction, not a measure.

## Asking for a prototype

**What good looks like**
- [weak] The prompt allows only the system's components. Where something does not exist, the agent builds it from what does, marks it in the output, and lists it.
- [weak] Every prototype ends with a short receipt of the components used and what was invented. Each invented item is a gap in the system for someone to rule on.

**How**
- [weak] Vallaure's prompt: "Use only components from my system. If something does not exist, piece it together from what is there, mark it clearly, and tell me what you had to invent." When the same corrections keep coming back, package them as a skill. Read a third-party skill first, because "a skill can run code on your machine" (Vallaure, as above).
- [weak] A question the brief has not settled is marked as open, and an agent that meets one stops and asks rather than filling it in. Groos's component documents prefix such a line `[open]`, design closes each one, and a build agent stops at any left ([Groos, 2026](https://www.designsystemscollective.com/probabilistic-isnt-a-dirty-word)). toolkit-standard §D 15 marks a token a run could not confirm the same way.
- [weak] Brad Frost's `vibe-killer` skill does the same for a page that already exists. It catalogues the page's regions, maps each to a real component, a composition or a recorded system gap, converts it using only verified components and tokens, renders the result, and writes a receipt of what it replaced and what the system lacks ([bradfrost/skills](https://github.com/bradfrost/skills)).

**Cases**
- A prototype needs a stepper the system lacks. The agent builds one from Button and Text, marks it `/* invented: Stepper */` and lists it. The receipt goes to the system's backlog instead of being shipped as a one-off.

**Accessibility**
- [weak] An invented composition has no reviewed keyboard model. The receipt says so, and the build gives it one before it ships.

**Check**
- *Script:* none in the toolkit. A project can diff the receipt's "used" list against the prototype's imports.
- *Judgement:* Is anything in the prototype neither in the receipt nor in the system?

**Sources:** Vallaure, Frost and Groos are practitioners, and none reports a measured run.

## Building a screen, not a component

**What good looks like**
- [moderate] The agent starts a screen from a template that already renders the product's shell, navigation and regions, and fills the page body. Nothing in the chrome is new.
- [weak] Each region covers the states the product requires (loading, empty, error), and the screen passes the same checks as a component prototype.

**How**
- [weak] Put the shell and navigation in configuration a template reads, not in prose. Atlassian's models got the logo wrong until it and the top navigation moved into a JSON config: "The model edits the config, not the code" ([Atlassian, as above](https://www.atlassian.com/blog/how-we-build/turning-handoffs-into-handshakes-integrating-design-systems-for-ai-prototyping-at-scale)). Their Fast and Full starter templates carry the instructions, navigation and theme.
- [moderate] Ship screens as files, and let a lookup server point to them. shadcn's registry has a `registry:page` item type with a required `target`, ([shadcn registry-item.json](https://ui.shadcn.com/docs/registry/registry-item-json)), and full screens such as `dashboard-01` ([shadcn blocks](https://ui.shadcn.com/blocks)). Polaris publishes Homepage, Index, Details and Settings templates ([Shopify App Home patterns](https://shopify.dev/docs/api/app-home/patterns)). Ant Design keeps page templates in its Pro starter ([Ant Design Pro](https://github.com/ant-design/ant-design-pro)); its MCP server has a page-generation prompt, `antd-page-generator`, but no templates ([Ant Design MCP](https://ant.design/docs/react/mcp)). Primer's MCP stops at patterns (`list_patterns`, `get_pattern`), and Atlassian's and Carbon's at components and tokens.
- [strong] Say when to ask, not only what the server holds. With a system MCP loaded and instructions that read as documentation, an agent building a page never called it, in two tasks; once the instructions said the interface is built from the system and to ask before writing any interface code, it called it every run, and a feedback page built without the system (three runs with no server loaded, one with it loaded but unasked) hand-built three form elements every time (a radio, a text area and a checkbox where the run recorded them), while every run that asked used the library's (three of three) (the toolkit's screen evals, `tools/skill-evals`, 2026-11-04).
- [strong] Derive the screen recipe from the screens the designers drew, never write it: the regions each shell lays out, the spacing tokens between them, what each slot holds and which states each screen type was drawn in (`tools/snapshot/recipes.cjs`, served as `get_screen_recipe`). Over one project's 114 screens it found two shells, the slots' contents and the drift a hand-written recipe would have frozen.
- [moderate] Show example screens where you have them. Seven retrieved example screens beat one on every rated quality, and three on all but one, in a crowd study ([Kolthoff et al., RAGG](https://arxiv.org/html/2412.11328v1)). A registry of built components beat a style guide in the prompt (95% compliance, six interfaces; [Cha et al., CHI 2026 EA](https://pure.seoultech.ac.kr/en/publications/design-system-compliant-user-interface-generation-with-llm-agents/)).
- [moderate] Figma to code: a screen gets real imports only for instances mapped with Code Connect, and a nested instance must be connected separately ([Figma, Code Connect for React](https://developers.figma.com/docs/code-connect/react)); the default output is React and Tailwind ([Figma, MCP tools](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/)). Large frames "return incomplete results", so read a screen region by region ([Figma, avoid large frames](https://developers.figma.com/docs/figma-mcp-server/avoid-large-frames/)).
- [moderate] Code to Figma: `generate_figma_design` captures the page as flat layers "without a connection to your libraries", binding matching variables only when the target file already has a library with them ([Figma, code to canvas](https://developers.figma.com/docs/figma-mcp-server/code-to-canvas/)). Instances come from an agent rebuilding the screen with `use_figma` from the library, as Figma's `figma-generate-design` skill does, with the capture as a reference only ([skill](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-generate-design/SKILL.md)).

**Cases**
- A Figma settings screen with three mapped components and an unmapped stat card comes back with three real imports and a `div` with copied grey and white classes. The import check catches the card. Only a template keeps the layout around the components from being invented.
- An agent composed a table screen from the bare app-shell template and got the toolbar, row count and height wrong, while the designer's own table screen, an instance of the same template, sat one page away (the toolkit's Figma trial, 2026-11-10). The screens already built on a template are its examples, and the closest one is a better start than the template alone.
- An agent drafting a share-image frame with `use_figma` could not set the library's display text style: Figma's cloud runtime has no Inter Display, and the failure reached `appendChild` too, even for a clone of text already on the canvas. The same script ran through the desktop bridge (`figma_execute`), which loads the designer's own fonts, once `textStyleId =` became `await setTextStyleIdAsync()`, which the bridge's dynamic-page access requires (one project, 2026-11-10). Text in a font the cloud lacks is written through the bridge.
- An agent places the library Button in Figma, then detaches it to change the padding. The vendor skill compares instance, style and bound-variable keys with its map, but has no scan for detached instances, so nothing names the detached Button. A library audit of the frame does.

**Accessibility**
- [weak] A template carries the shell's landmarks, [skip link](../ui/patterns/navigation.md#skip-links) and heading order, so every screen started from it has them. A shell the agent writes from prose has whatever it remembered.

**Check**
- *Script:* the import check from the first section on the code. A library audit of the Figma frame that fails on detached instances and unbound values.
- *Judgement:* Is anything in the chrome new? Does each region show its loading, empty and error states?

**Sources:** Atlassian, shadcn, Shopify, Ant Design, Primer and Figma are vendor docs. Kolthoff et al. and Cha et al. are small studies, so read them as a direction. No benchmark grades screens for design system use, and no vendor tests a screen's round trip as lossless. The toolkit goes with templates and config over prose, because every source with evidence points that way.

## Feedback on a prototype

**What good looks like**
- [moderate] A person gives feedback where they look at the design: a comment on the layer. The next run reads it before composing anything new, and handles it once.
- [moderate] Each correction lands at the lowest level that holds it. A one-off is fixed on the frame. A decision about the product becomes a dated project ruling with its why and who decided. A rule for every project waits for evidence it is not a one-off, such as the same correction in a second project, and a person's yes.
- [moderate] A ruling, once made, is applied and never asked again. The rule set stays small: a new ruling replaces the one it contradicts, and one that is outdated or redundant is retired by a person.

**How**
- [moderate] Shipping agents agree on the store and differ on the channel. Feedback arrives in chat or comments, and it is shared and durable when it is written to a plain-text rules file loaded on every run: Figma Make's `guidelines/Guidelines.md` ("multiple short guidelines files are better than a few large files", [Figma Help](https://help.figma.com/hc/articles/43602393097239)), Cursor's rules ("under 500 lines", [Cursor](https://cursor.com/docs/context/rules)), Copilot's instruction files ([GitHub](https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-repository-instructions)), Claude Code's CLAUDE.md, where contradictory instructions are followed arbitrarily ([Claude Code](https://code.claude.com/docs/en/memory)). Windsurf keeps its own memories local and says to write anything lasting as a rule ([Windsurf](https://docs.windsurf.com/windsurf/cascade/memories)); Devin suggests what to remember from feedback, and a person edits or dismisses each suggestion before it is kept ([Devin](https://docs.devin.ai/product-guides/knowledge)).
- [moderate] Memory that only grows can make an agent worse. ExpeL keeps its insights with add, edit, upvote and downvote, and removes one whose count reaches zero ([Zhao et al., 2024](https://arxiv.org/html/2308.10144v3)); agents copy whatever stored experience looks like the task at hand, so a flawed record spreads, and storing everything did worst while selective deletion helped ([Xiong et al., 2025](https://arxiv.org/abs/2505.16067)).
- [moderate] Which level a correction belongs to is the design system's oldest question: Brad Frost's governance process asks whether new work is a one-off "snowflake" or part of the system, and only system work goes to the system's backlog and changelog ([Frost, 2019](https://bradfrost.com/blog/post/a-design-system-governance-process/)). A decision is kept with its rationale, as a design system decision record ([Thoughtworks Radar, 2023](https://www.thoughtworks.com/radar/techniques/design-system-decision-records)).
- [moderate] Figma's comments API returns each comment's layer (`client_meta.node_id`), its thread (`parent_id`) and `resolved_at`, and takes replies and reactions; it has no call to resolve a comment ([Figma](https://developers.figma.com/docs/rest-api/comments-types/), [endpoints](https://developers.figma.com/docs/rest-api/comments-endpoints/)), so a reply is what an agent can leave to mark a thread handled.
- [strong] Error analysis reads notes and lets the kinds emerge (open, then axial coding), at least 100 traces, until new ones stop revealing failure modes, and 20 to 50 outputs reviewed by hand after any significant change ([Husain](https://hamel.dev/blog/posts/evals-faq/)); 20 to 50 tasks drawn from real failures make a good first eval set ([Anthropic, 2026](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)); and criteria drift as people judge outputs ([Shankar et al., 2024](https://arxiv.org/abs/2404.12272)). A reading of ten is a first look, not a count.
- [moderate] A rule is pruned when it contradicts another, is outdated or is redundant ([Claude Code](https://code.claude.com/docs/en/memory)), and an eval check is retired only once it always passes ([Husain](https://hamel.dev/blog/posts/evals-faq/)); no source found retires a rule for going unused over a few runs.
- [weak] A product file need not be written from nothing: Claude Code's `/init` drafts its memory file from the codebase, and in its newer, opt-in form fills gaps with follow-up questions and presents a reviewable proposal before writing any files ([Claude Code](https://code.claude.com/docs/en/memory)); Devin lets a person edit or dismiss each suggested item before it is kept ([Devin](https://docs.devin.ai/product-guides/knowledge)).
- [moderate] A correction that recurs becomes a test: "converting user-reported failures into test cases ensures your suite reflects actual usage" ([Anthropic, 2026](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)). Write checks "for errors you discovered, not errors you imagine", and every so often sort the corrections into kinds and work on the largest kind, not the latest comment ([Husain](https://hamel.dev/blog/posts/evals-faq/)).

**Cases**
- A designer answers a question the agent left on a Sort button: keep the toolbar sort. The next run records it as a project ruling, replies where it went, and from then on applies it with no comment. The question is never asked again.
- A comment asks for "New employee" as the dialog title. It is fixed on that frame and on every composed frame of the flow that shows the same dialog; if it is the product's term everywhere, it is a §6 decision instead.

**Check**
- *Script:* figma-prototype's `scripts/figma-feedback.mjs` lists the open threads, unresolved with a person's message last, logs each handled one with a note and lists the notes for a reading every ten (`kinds`); the receipt names the decisions each frame applied, and the Figma eval scores a run that drops one.
- *Judgement:* Was each correction filed at the lowest level that holds it, and did any ruling contradict an older one left in place?

**Sources:** vendor documentation for the stores; two peer-reviewed or preprint studies on agent memory; practitioners (Frost, Husain) and Anthropic's engineering guidance for routing and evals. None measures a design agent learning from design comments; the loop here is assembled from them, unproven as a whole.

## Where a project's knowledge lives

**What good looks like**
- [moderate] An agent designing a screen reads a short account of the product first: what it does, who uses it, its words and its flows, and the decisions already made about it. It is separate from the library's conventions, which it does not need, and from general design guidance, which is shared.
- [weak] Each kind of knowledge has one home and one owner, and a correction moves only as far up as it holds: a frame, the product, the library, or every project.

**How**
- [moderate] Vendors keep product context apart from rules and keep both short. Lovable's project knowledge lists what the application does, user personas, domain terminology and architecture decisions, up to 10,000 characters ([Lovable](https://docs.lovable.dev/features/knowledge)); Figma Make's guidelines open with the product's character and link out to detailed files ([Figma Help](https://help.figma.com/hc/articles/43602393097239)); Linear gives agents workspace and team guidance that can point at documents ([Linear](https://linear.app/docs/agents-in-linear)).
- [moderate] Size matters because the file is loaded every run. Claude Code's guidance is to target under 200 lines, since longer files reduce adherence ([Claude Code](https://code.claude.com/docs/en/memory)); Cursor's is rules under 500 lines, split when larger ([Cursor](https://cursor.com/docs/context/rules)); Anthropic's is the smallest set of high-signal tokens ([Anthropic](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). Chroma reports models growing less reliable as input lengthens ([Chroma](https://www.trychroma.com/research/context-rot); read from summaries only, unchecked).
- [weak] A product's words are one vocabulary for users and builders, Evans' ubiquitous language ([Fowler](https://martinfowler.com/bliki/UbiquitousLanguage.html)): a comment that settles a word changes the glossary, not only the screen.
- [weak] A decision is recorded with its context and consequences, and a reversed one is marked superseded, never deleted ([Nygard, 2011](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)).
- [weak] An option that was rejected is recorded with its reason, so an agent researching best practice does not propose it again; in a project it is a decision like any other, logged where its decisions go (the Check below). Groos keeps a "Ruled out" list in each component's document for this, apart from the requirements, and logs a decision only if "someone could plausibly propose the opposite" ([Groos, 2026](https://www.designsystemscollective.com/probabilistic-isnt-a-dirty-word); eight months in production, with only anecdotal evidence, by her own account).

**Cases**
- A project's context document grew to 763 lines about its library and said nothing about its users, domain or flows; a prototype run read all of it and still did not know what the product was. The product went to a file of its own, beside it.

**Check**
- *Judgement:* Did the run read the product file first, or draft one from evidence with a source per line and the user's yes; is it under 200 lines; does every decision the run recorded go to the context document's §6 and name who made it?

**Sources:** vendor documentation (Lovable, Figma, Linear, Claude Code, Cursor, Anthropic); Fowler and Nygard for vocabulary and decision records; Groos is a practitioner. No study measures whether product context improves a design agent's screens; the case rests on vendor practice and the general findings on context length.

## From prototype to pull request

**What good looks like**
- [weak] The prototype lives on a branch that is never merged. If an idea is accepted, it is rebuilt on a feature branch from the same components, with real data and its loading, error and empty states. The pull request is opened from there.
- [weak] The pull request passes the same gates as any other code. A person approves it, because a green build is not a yes.

**How**
- [moderate] The gates: tests, accessibility, responsiveness, a check that every component used is a real one, and performance (Vallaure, as above). For the "real component" check, lint rules that ban raw elements and values do the work. Atlassian's `@atlaskit/eslint-plugin-design-system` has `no-html-button`, `no-html-anchor` and the rest of that family, plus `ensure-design-token-usage` ([Atlassian](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage)). Primer's stylelint has `primer/colors`, `primer/spacing` and `primer/typography` ([primer/stylelint-config](https://github.com/primer/stylelint-config)). An adoption scanner such as [react-scanner](https://github.com/moroshko/react-scanner) counts what the change imports.
- [weak] The rebuild is cheap when the prototype was made from the real parts: the feature branch keeps the composition and adds state and data. Brad Frost's `storybook-to-product` skill takes a Storybook page to a pull request ([bradfrost/skills](https://github.com/bradfrost/skills)).

**Cases**
- A prototype route is added to an app that deploys `main` straight to production. Merging it ships it. Keep prototypes as stories or on an unmerged branch.
- A review step written only in a skill's prose is a request, not a gate. Salesforce's `design-systems-slds-validate` skill pairs its linter with a "required manual review gate" that nothing enforces: the agent decides whether to run it ([skill](https://github.com/forcedotcom/sf-skills/blob/main/skills/design-systems-slds-validate/SKILL.md)). A step that must happen is a check that fails, or a hook that refuses.
- The prototype was green on every check and still did the wrong thing for the ticket. An optional AI review that reads the change against the ticket helps, but a person still decides.

**Accessibility**
- [weak] The feature branch runs the project's accessibility checks. A prototype that passed them in Storybook has passed them on fixtures only.

**Check**
- *Script:* CI on the feature branch, plus the lint rules above.
- *Judgement:* Was the pull request built on the feature branch, or merged from the prototype branch?

**Sources:** Vallaure is commentary. Atlassian, Primer, react-scanner and Salesforce's skill are the tools' own docs. The toolkit follows the unmerged-branch rule because it keeps throwaway code out of the product's history.
