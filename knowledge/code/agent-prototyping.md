# Prototyping with an agent against the design system

How a coding agent builds a prototype from the design system's real components instead of drawing its own: what to hand it, how to ask, what checks its output, and how a prototype that wins becomes shipped code. It serves the design-standard principles *consistent, not uniform* (a prototype made of the shipping parts is judged on the shipping behaviour) and *honest* (what the agent invented is said, not hidden). What a component's data holds is [figma-handoff: what a component contract covers](figma-handoff.md#what-a-component-contract-covers); lint and CI gates in general are [testing](testing.md)'s; choosing a tool is the research piece *Prototyping with a design system's real components*, not this page.

**Implements:** no single pattern; it is how any ui page's pattern gets prototyped by an agent before it is built for real.

## Real components, not lookalikes

**What good looks like**
- The prototype imports the team's own package or source (`import { Button } from '@team/design-system'`); nothing is copied into the prototype or redrawn in it.
- A change to a token or a prop default in the library shows up in the prototype on the next run without anyone regenerating it.

**How**
- The import test: open the generated code and read the imports. If they come from the team's package, the components are real. If they come from a folder the tool created, they are a copy, and a `<button>` with a class and hex values is a lookalike. Vallaure's audit prompt asks the agent which file a component was imported from and which props it set, then compares that with the system's own component ([Vallaure, *AI prototyping inside your design system*](https://christinevallaure.substack.com/p/ai-prototyping-inside-your-design), commentary).
- A tool's own docs say which of the three it does. Lovable: "The design system's React components are copied into the connected project at `src/design-system/<slug>/`" ([Lovable](https://docs.lovable.dev/features/design-systems)). v0's newer import installs the package: "If a component, prop, or token cannot be verified from the sources, v0 should not use it" ([v0, design systems 2.0](https://v0.app/docs/design-systems-2)). Figma's MCP returns React and Tailwind reference code unless Code Connect maps the component to a real import ([Figma, Code Connect integration](https://developers.figma.com/docs/figma-mcp-server/code-connect-integration/)).

**Cases**
- A generated screen looks right, but its Button is a local `button.tsx` with the library's colours copied in, so the next library release changes nothing in it. That is a copy. Prototype where the package is installed.
- Claude Design's output carried the right props and tokens but dropped the headless primitives and the types; its own handover note calls it "a recreation for design and prototyping" (Vallaure, as above). Judge it as a concept, never as a starting point for the build.

**Accessibility**
- A lookalike carries none of the real component's keyboard model, name or focus ring, so an accessibility check on it says nothing about the product. Only real components make a prototype's accessibility result mean something.

**Check**
- *Script:* list the prototype's imports and fail on any component that does not come from the system package. `tools/docs-mcp/validate.mjs` flags raw HTML where the library has a component.
- *Judgement:* Change one token in the library. Did the prototype change?

**Sources:** Lovable, v0 and Figma are vendor docs. Vallaure is commentary. The toolkit counts only the first level, imports from the package.

## Giving the agent the system

**What good looks like**
- The agent looks the system up during each session instead of answering from memory. It gets a closed list of components, props, allowed values and tokens.
- That list is generated from the source, never written by hand, and it is served on demand rather than pasted whole into the rules file.

**How**
- A component manifest: one entry per component with its purpose, every prop, its allowed values and its default. Storybook 10 builds one from the stories and types once `features: { componentsManifest: true }` is set in `.storybook/main.ts`; it is "off by default". `@storybook/addon-mcp` serves it at `/mcp` from the dev server. Its tools include `docs-list`, `docs-show`, `stories-find-by-component`, `stories-preview` and `test-run`. Storybook labels the whole feature preview ([Storybook, MCP overview](https://storybook.js.org/docs/ai/mcp/overview)). The docs tools need a React, Angular-Vite or Vue-Vite framework. The development and test tools work in any Storybook.
- Storybook's docs give a snippet for the project's `AGENTS.md`/`CLAUDE.md`. It tells the agent to list the documented components and check their props before writing, and to run `test-run` after: "Never hallucinate component properties!" (same page).
- A system with its own server serves the same closed set. Atlassian's `@atlaskit/ads-mcp` has `ads_plan`, `ads_search_components` and `ads_search_tokens`, plus axe-based accessibility tools ([README](https://cdn.jsdelivr.net/npm/@atlaskit/ads-mcp/README.md)). Primer's `@primer/mcp` has `list_components`, `get_component`, `find_tokens` "by intent or value" and `lint_css` ([Primer MCP](https://primer.style/product/getting-started/foundations/mcp)). Carbon has a hosted server ([Carbon MCP](https://carbondesignsystem.com/developing/carbon-mcp/overview/)). The toolkit's own is `tools/docs-mcp`, which reads a project's docs site.
- A small system can skip the server: a generated manifest file the agent reads does the same job.

**Cases**
- An agent pointed at the whole repository rebuilds a component that already exists, or copies an old pattern because it appears more often than the new one. Give it the manifest or the server, not the source tree. This is Vallaure's warning. The toolkit found no controlled study of agents copying the majority pattern. Fluent writes the instruction into its `AGENTS.md`: "Never copy patterns from existing code without verifying they match these instructions" ([Fluent AGENTS.md](https://github.com/microsoft/fluentui/blob/master/AGENTS.md)).
- Atlassian found that per-component guideline files were hard for prototyping tools to parse, so they went back to one `guidelines.md`. They also found a JSON config for the top navigation worked better than prose: "structured configuration beats open-ended prompting" ([Atlassian, *Turning handoffs into handshakes*](https://www.atlassian.com/blog/how-we-build/turning-handoffs-into-handshakes-integrating-design-systems-for-ai-prototyping-at-scale)). Their models still made up imports and packages when told not to, and said the code was correct, which is why the check below runs on the output and not on trust in the prompt.

**Accessibility**
- Serve each component's accessibility guidance with its API (Primer's `get_component_accessibility_guidelines`). An agent that can find the props but not the labelling rules will set the props and skip the labels.

**Check**
- *Script:* the manifest is regenerated in CI and differs from the committed copy only when the components changed.
- *Judgement:* Did the agent call the lookup before writing, or answer from memory?

**Sources:** Storybook, Atlassian, Primer and Carbon are vendor docs. Storybook's figures for Reshaped (27% fewer tokens, 2.76× faster, 12.8% better code usage, [blog](https://storybook.js.org/blog/storybook-mcp-for-react/)) come with no published method, so read them as a direction, not a measure.

## Asking for a prototype

**What good looks like**
- The prompt allows only the system's components. Where something does not exist, the agent builds it from what does, marks it in the output, and lists it.
- Every prototype ends with a short receipt of the components used and what was invented. Each invented item is a gap in the system for someone to rule on.

**How**
- Vallaure's prompt: "Use only components from my system. If something does not exist, piece it together from what is there, mark it clearly, and tell me what you had to invent." When the same corrections keep coming back, package them as a skill. Read a third-party skill first, because "a skill can run code on your machine" (Vallaure, as above).
- Brad Frost's `vibe-killer` skill does the same for a page that already exists. It catalogues the page's regions, maps each to a real component, a composition or a recorded system gap, converts it using only verified components and tokens, renders the result, and writes a receipt of what it replaced and what the system lacks ([bradfrost/skills](https://github.com/bradfrost/skills)).

**Cases**
- A prototype needs a stepper the system lacks. The agent builds one from Button and Text, marks it `/* invented: Stepper */` and lists it. The receipt goes to the system's backlog instead of being shipped as a one-off.

**Accessibility**
- An invented composition has no reviewed keyboard model. The receipt says so, and the build gives it one before it ships.

**Check**
- *Script:* none in the toolkit. A project can diff the receipt's "used" list against the prototype's imports.
- *Judgement:* Is anything in the prototype neither in the receipt nor in the system?

**Sources:** Vallaure and Frost are practitioners, and neither reports a measured run.

## From prototype to pull request

**What good looks like**
- The prototype lives on a branch that is never merged. If an idea is accepted, it is rebuilt on a feature branch from the same components, with real data and its loading, error and empty states. The pull request is opened from there.
- The pull request passes the same gates as any other code. A person approves it, because a green build is not a yes.

**How**
- The gates: tests, accessibility, responsiveness, a check that every component used is a real one, and performance (Vallaure, as above). For the "real component" check, lint rules that ban raw elements and values do the work. Atlassian's `@atlaskit/eslint-plugin-design-system` has `no-html-button`, `no-html-anchor` and the rest of that family, plus `ensure-design-token-usage` ([Atlassian](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage)). Primer's stylelint has `primer/colors`, `primer/spacing` and `primer/typography` ([primer/stylelint-config](https://github.com/primer/stylelint-config)). An adoption scanner such as [react-scanner](https://github.com/moroshko/react-scanner) counts what the change imports.
- The rebuild is cheap when the prototype was made from the real parts: the feature branch keeps the composition and adds state and data. Brad Frost's `storybook-to-product` skill takes a Storybook page to a pull request ([bradfrost/skills](https://github.com/bradfrost/skills)).

**Cases**
- A prototype route is added to an app that deploys `main` straight to production. Merging it ships it. Keep prototypes as stories or on an unmerged branch.
- The prototype was green on every check and still did the wrong thing for the ticket. An optional AI review that reads the change against the ticket helps, but a person still decides.

**Accessibility**
- The feature branch runs the project's accessibility checks. A prototype that passed them in Storybook has passed them on fixtures only.

**Check**
- *Script:* CI on the feature branch, plus the lint rules above.
- *Judgement:* Was the pull request built on the feature branch, or merged from the prototype branch?

**Sources:** Vallaure is commentary. Atlassian, Primer and react-scanner are the tools' own docs. The toolkit follows the unmerged-branch rule because it keeps throwaway code out of the product's history.
