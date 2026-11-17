# Prototyping with a design system's real components

Which tools build prototype flows and early concepts from a team's own components, and the five-minute test that sorts the rest.

A team asks which AI prototyping tool to adopt, and a vendor demo answers with a polished three-step sign-up in the team's own colours. Then someone tabs through it. The focus ring is the wrong shape, the disabled button is the wrong grey, and the error message sits under the field instead of beside it. The demo was painted to look like the library; it wasn't built from it.

"Which tool?" turns out to be two questions, and opening the generated code and reading its imports answers most of both.

---

## What this answers

- [Flows versus ideation](#flows-versus-ideation): whether prototyping is one job or two
- [Real components or lookalikes](#real-components-or-lookalikes): real components, copies or lookalikes
- [Flows in Storybook](#flows-in-storybook): whether Storybook can carry a prototype flow
- [Writing the flow stories](#writing-the-flow-stories): who writes the flow stories
- [Sharing with reviewers](#sharing-with-reviewers): how a reviewer opens a prototype
- [Hosted tools](#hosted-tools): which hosted tools use real components
- [Agents composing in Figma](#agents-composing-in-figma): whether an agent can compose in Figma
- [Shipping a winning prototype](#shipping-a-winning-prototype): how a winning prototype ships
- [Two real projects](#two-real-projects): what two real projects would do

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs.

---

## Flows versus ideation

Prototyping is two jobs: a prototype flow tests behaviour and is best built from the components that will ship, while ideation tests direction and is best done fast, in the file where designers work.

Take the sign-up flow from the demo. A flow like it (sign-up in three steps, a filter dialog over a list, an empty state turning into a populated one) is shown to people so they can react to how the product will behave. If the button in the prototype isn't the product's button, they react to the wrong thing: spacing, focus ring, disabled state and error message all differ in small ways that matter to exactly the people being asked. That pushes the prototype toward the coded components, in a browser, and for a team already on Storybook the cheapest way there is Storybook itself.

Ideation is the opposite trade. Three layouts for an onboarding screen are worth generating in bulk and mostly discarding. They need to look like the product so the idea is judged fairly, not to behave like it. For a team whose design happens in Figma, their natural home is the Figma file, built from the published library, where a designer can pick one up and continue.

The market blurs the line because one generator can emit either, but no tool surveyed does both jobs well for a custom library; the ones that claim to usually do ideation well and flows with lookalikes.

Choose your prototype tool for fidelity to the coded components and for how easily a reviewer opens it. Choose your ideation tool for speed, for staying inside the library, and for how easily a designer continues from it. **A tool that does both is a bonus, not the criterion.**

---

## Real components or lookalikes

Only output that imports the team's own package counts as real components, and only that stays correct when the library changes.

Three different things are sold as "built from your components". The demo's sign-up flow could be any of them, and its screenshot looks the same in all three cases. The code doesn't.

| Level | What the output contains | Examples in the vendors' own docs | What breaks it |
|---|---|---|---|
| Real components | `import { Button } from '@team/design-system'` | v0's newer design-system import, which refuses any component, prop or token it cannot verify; Story UI, which checks every prop against the real type; UXPin Merge; Magic Patterns' npm route | Nothing the library does |
| Regenerated copies | Component source copied into the generated project | Lovable, which copies components into `src/design-system/<slug>/` and overwrites local edits on update; Bolt, which generates "a Storybook inside Bolt" | The next library release, until someone re-imports |
| Styled lookalikes | Generic components painted with the team's tokens | Figma Make kits from a library, which become a global CSS file of raw values; Anima's Figma import; Google Stitch | Any component whose behaviour, not colour, is the point |

A copy is right on the day it is made and drifts from then on. A lookalike was never right about behaviour, which is what the tab-through in the demo exposed.

Most hosted generators land on the lower two rows because they were built around one stack. [v0's legacy guide](https://v0.app/docs/design-systems) says v0 is trained on the default shadcn/ui implementations, and its [newer guide](https://v0.app/docs/design-systems-2) warns that the default Next.js, shadcn and Tailwind starter may conflict with a system that brings its own components, styles or providers. Material UI (Emotion, a ThemeProvider at the root) sits outside that default, and none of v0, Lovable, Bolt or Magic Patterns names MUI in its design-system docs.

Here is the test. Open the generated code and read the imports. From your package, it's real; from a folder the tool created, it's a copy; a `<button>` with a class and hex values is a lookalike. For a second test, change a token or a prop default in your library and regenerate: real components pick it up, and the others don't.

For flows, accept only the first level. For ideation, the third level is acceptable for early concepts and the first is better, because a concept made of real parts can be handed over without being redrawn. **Run the import test on any tool before adopting it.**

---

## Flows in Storybook

Storybook can carry one: a flow is a story that composes the real screen components with fixture data, and Storybook 10 has every mechanism a click-through needs, though the flow is written as code, not drawn.

Project B, one of the two projects this guide was researched for, shows how close a team already is. It keeps a story per screen state: `contacts-list.stories.tsx` holds `Default`, `Details`, `AddBadge`, `Filter`, `FilterResults`, `FilterNoResults`, `Search` and others, each rendering the real screen with fixtures. A state catalogue is most of a prototype. What it lacks is the clicks between the states.

Here are four of those states joined into a flow.

<svg role="img" viewBox="0 0 640 230" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Four screen-state stories from a contacts list, joined into one flow. Default leads to Filter on a click of the filter button. Filter leads to Filter results when the applied filter matches contacts, or to Filter no results when it matches none. The arrows are labelled with the mechanism that joins them: local state inside one story, or linkTo between stories.</title>
<rect x="0" y="0" width="640" height="230" fill="#f7f6f2"/>
<text x="20" y="28" font-size="14" font-weight="600" fill="#1a1a1a">Prototypes/Contacts filter (one flow story)</text>
<rect x="20" y="84" width="120" height="64" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="80" y="112" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="middle">Default</text>
<text x="80" y="132" font-size="11" fill="#5a5850" text-anchor="middle">contact list</text>
<rect x="230" y="84" width="120" height="64" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="290" y="112" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="middle">Filter</text>
<text x="290" y="132" font-size="11" fill="#5a5850" text-anchor="middle">dialog open</text>
<rect x="470" y="44" width="150" height="64" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="545" y="72" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="middle">FilterResults</text>
<text x="545" y="92" font-size="11" fill="#5a5850" text-anchor="middle">matches shown</text>
<rect x="470" y="128" width="150" height="64" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="545" y="156" font-size="13" font-weight="600" fill="#1a1a1a" text-anchor="middle">FilterNoResults</text>
<text x="545" y="176" font-size="11" fill="#5a5850" text-anchor="middle">empty state</text>
<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1f5fbf"/></marker></defs>
<line x1="140" y1="116" x2="226" y2="116" stroke="#1f5fbf" stroke-width="2" marker-end="url(#ah)"/>
<text x="183" y="106" font-size="11" fill="#1f5fbf" text-anchor="middle">click Filter</text>
<line x1="350" y1="106" x2="466" y2="80" stroke="#1f5fbf" stroke-width="2" marker-end="url(#ah)"/>
<text x="404" y="78" font-size="11" fill="#1f5fbf" text-anchor="middle">apply, matches</text>
<line x1="350" y1="126" x2="466" y2="156" stroke="#1f5fbf" stroke-width="2" marker-end="url(#ah)"/>
<text x="404" y="164" font-size="11" fill="#1f5fbf" text-anchor="middle">apply, none</text>
<text x="20" y="216" font-size="12" fill="#5a5850">Joined by useState inside one story, or by linkTo between separate stories</text>
</svg>

Every box already exists as a story; the arrows are the only new work. Four documented mechanisms supply them.

- **State inside the story.** A wrapper holds the current step in `useState` and swaps screens on the real components' events. Ordinary React, no addon.
- **Links between stories.** [`@storybook/addon-links`](https://github.com/storybookjs/storybook/tree/next/code/addons/links) provides `linkTo('Title', 'Story')` as an `onClick`, chaining separate screen stories into a click-through.
- **Play functions.** [They](https://storybook.js.org/docs/writing-stories/play-function) type, click and group steps with `step()` after render, and the [Interactions panel](https://storybook.js.org/docs/writing-tests/interaction-testing) steps through them. "Open filter, choose two options, apply" can be a story a reviewer watches.
- **Mocking.** [`sb.mock`](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules) (since 9.1) replaces modules; [`msw-storybook-addon`](https://github.com/mswjs/msw-storybook-addon) mocks network requests; the [`nextjs-vite` framework](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite) mocks the app router, so a flow across routes runs in one story.

Every pixel and behaviour is the shipping one, and a winning prototype becomes the real screen with no translation. The costs: a designer who doesn't write React depends on an engineer or an agent, and server-backed flows need fixtures for every state.

Write each flow as one story with local state, or a few stories joined with `linkTo`, and reuse the screens' existing fixtures. Add a play function where a sequence should be watched. **Keep flows in a `Prototypes/` group, so nobody mistakes them for component docs.**

---

## Writing the flow stories

A coding agent in the repository, with Storybook's MCP addon, writes them most reliably; Southleft's Story UI gives designers a prompt box instead, but doesn't document flows.

The contacts flow above is React code. Somebody has to write it, and the designer who wants the flow usually can't.

**The coding agent.** [`@storybook/addon-mcp`](https://storybook.js.org/docs/ai/mcp/overview) (10.6.5) serves `/mcp` from the dev server with nine tools: story-writing instructions, finding stories by component, preview links, a `test-run` that reports accessibility results so the agent fixes its own errors, and docs tools that need `features: { componentsManifest: true }` and a React, Angular-Vite or Vue-Vite framework. Storybook labels all of it preview. It is context, not a generator: it tells the agent what exists and checks what it wrote. Its separate repository, [`storybookjs/mcp`](https://github.com/storybookjs/mcp), was archived on 14 October 2026 when the code moved into Storybook itself.

Storybook's docs give an `AGENTS.md` snippet telling the agent to check props before writing and run `test-run` after; the addon's headline figures are weighed in Part 4, [How the design system reaches the agent](how-the-system-reaches-the-agent.md).

**Story UI.** Southleft's [Story UI](https://github.com/southleft/story-ui) (MIT, 5.23.0; version 5 within about fifteen months, so its API moves) adds a prompt box inside Storybook that writes a `.stories.tsx` from the project's components, discovered from type declarations, source and the Storybook index, with every prop checked against its real type. It ships a [Material UI preset](https://github.com/southleft/story-ui/blob/main/cli/setup.ts). Each story is verified in Playwright (overflow, a [click on each control](https://github.com/southleft/story-ui/blob/main/story-generator/verify/probes/interaction.ts), a vision model's verdict) and regenerated if it fails. It doesn't document play functions or linked multi-screen flows, so its screens still need wiring.

| | Coding agent with Storybook MCP | Story UI |
|---|---|---|
| Who drives it | Someone comfortable in a terminal | Anyone with Storybook open locally |
| Real components | Yes, from the repo and the manifest | Yes, by discovery and type checking |
| Multi-step flows | Yes, written like any code | Not documented |
| Self-check | The addon's test tool and the project's checks | Playwright render, interaction probe, vision review |

Turn on the component manifest and paste Storybook's snippet into your rules file. Ask for a receipt with every prototype: [Christine Vallaure's prompt](https://christinevallaure.substack.com/p/ai-prototyping-inside-your-design) asks the agent to use only the system's components, to mark anything missing, and to list what it had to invent. **Each invented item is a gap for the system's backlog, not a one-off to ship.** Trial Story UI where a designer wants screens without a terminal.

---

## Sharing with reviewers

Publish the Storybook to Chromatic and make it public, and every branch gets a stable link anyone can open without signing in, on the free plan.

The contacts flow is ready, and the product manager who asked for it has never heard of Storybook. Chromatic [publishes each build](https://www.chromatic.com/docs/permalinks) at `https://<branch>--<appid>.chromatic.com`, always the latest build of that branch, plus a commit-pinned form. Public visibility lets anyone with the link view it; [collaborators](https://www.chromatic.com/docs/collaborators) keep it private for reviewers willing to sign up, and [UI Review](https://www.chromatic.com/docs/review) adds comment threads. The [free plan](https://www.chromatic.com/pricing) includes 5,000 snapshots a month; its docs don't say whether publishing alone uses them.

A built Storybook is static files, so any host serves it:

| Route | Viewer needs an account | Private | Cost | Comments |
|---|---|---|---|---|
| Chromatic, public | No | No (anyone with the link) | Free plan | UI Review, for signed-in collaborators |
| Chromatic, collaborators | Yes | Yes | Free plan | Yes |
| Vercel preview with a [Shareable Link](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links) | No | By unguessable link | Free on all plans (one link on Hobby) | Vercel account needed |
| Vercel with a [password](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection) | No | Yes | Pro plus $20 a month per project | Vercel account needed |
| Netlify with a [password](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/) | No | Yes | Pro plan | No |
| GitHub Pages, [private](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site) | Yes, with repository access | Yes | Enterprise Cloud | No |

Send your reviewers the branch permalink pointing at the flow story's full-screen view. Use public Chromatic for non-confidential work, and a Viewer invitation or a Vercel Shareable Link, the cheapest private option, when it must stay private. **Keep the prototype on its own branch, so the permalink tracks it.**

---

## Hosted tools

Only v0's newer import, Magic Patterns' npm route and UXPin Merge document rendering a team's real package; Lovable and Bolt copy, Figma Make, Anima and Stitch paint lookalikes unless given a package, and Claude Design doesn't say.

For a team on Material UI or its own React components, the question for each tool is whether it can be pointed at a package at all, and on which plan.

- **v0.** The [newer route](https://v0.app/docs/design-systems-2) imports from GitHub, Figma frames, Storybook or docs links, with an installable package (public or private npm through a team `NPM_TOKEN`) as the source of truth. It saves the system as a `SKILL.md` and won't use a component, prop or token it can't verify. The older route is a Tailwind [shadcn registry](https://ui.shadcn.com/docs/registry). [Plans](https://v0.app/pricing) run Free, Plus ($30 per user a month) and Business ($100); which includes the import isn't stated.
- **Lovable** [copies components](https://docs.lovable.dev/features/design-systems) into each consuming project and replaces them on update. Wrapping a real npm package is Enterprise only. [Published apps](https://docs.lovable.dev/features/publish) are public or invite-only.
- **Bolt** [imports a system](https://support.bolt.new/building/design-system/add-design-system) on Teams ($30 per member a month) and generates a Storybook inside Bolt; whether apps then import the real package isn't stated.
- **Magic Patterns** [renders the team's package](https://www.magicpatterns.com/docs/documentation/design-systems/importing/npm-package) from npm, GitHub Packages or a tarball. Setup is by onboarding call.
- **UXPin Merge with Wire and Forge** is the only tool that puts a team's own coded React components on a designer's canvas and turns them into flows. [Merge](https://www.uxpin.com/docs/merge/) imports from Git (Enterprise), a published Storybook (Growth) or npm. [Wire](https://updates.uxpin.com/2026-06-26-introducing-uxpin-wire) (26 June 2026) links Merge screens into a flow with navigation, validation and state, published as a hosted link or exported as Vite and React. [Forge](https://www.uxpin.com/docs/forge/what-is-forge/) generates screens but not multi-step flows. [Plans](https://www.uxpin.com/pricing): Core $29/$49, Growth $40/$69, Enterprise custom. Merge calls React 19 support experimental.
- **Figma Make** takes, in a [Make kit](https://help.figma.com/hc/articles/39241689698839) (since April 2026), npm packages, variables and styles from published libraries, and Markdown guidelines. The library route pulls "a subset" of variables into a global CSS file of raw values and doesn't use library components, so a library-only kit is lookalike level. A [package](https://help.figma.com/hc/articles/43602872461079) must build under Vite with no workspace dependencies. [Publishing](https://help.figma.com/hc/en-us/articles/31304586129559) gives a `*.figma.site` link, optionally password-protected; code leaves as a [ZIP](https://help.figma.com/hc/en-us/articles/33649966245783) or a [one-way push](https://help.figma.com/hc/en-us/articles/35463818346647-Push-from-Figma-Make-to-GitHub) to GitHub.
- **Claude Design** ([research preview](https://www.anthropic.com/news/claude-design-anthropic-labs) from 17 April 2026, now an artifact template; standalone `claude.ai/design` [closes 14 December 2026](https://support.claude.com/en/articles/17440474-migrate-from-standalone-claude-design-to-claude)) [learns a system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design) from Figma files or, through Claude Code's `/design-sync`, from the codebase. Sharing is within the organisation, and whether its output imports the real components isn't documented.
- **Claude artifacts** give a public link from [Claude Code](https://code.claude.com/docs/en/artifacts) but load scripts only from public CDNs, so a private library must be bundled into the page (untested).
- **The rest.** [Anima's Figma import](https://docs.animaapp.com/docs/add-figma-design-system) produces a lookalike Storybook; [Builder.io](https://www.builder.io/c/docs/fusion-design-system-intelligence) is a code generator, not a prototyping canvas; [Tempo](https://docs.tempo.new/guides/migrate) retired its web editor on 14 June 2026. [Plasmic](https://docs.plasmic.app/learn/code-components/), Subframe, Framer, Onlook and Penpot were excluded on their own docs.

Don't adopt a hosted builder as your prototype tool on the strength of its docs. If you trial one, trial v0's newer import with a published package, and **run the import test on the first screen it builds.** Consider UXPin Merge with Wire only if designers who don't code must build flows often enough to justify a seat each, and trial its Storybook route first.

---

## Agents composing in Figma

An agent can compose in Figma, and for a Figma-first team it is the strongest ideation route, with two caveats: Figma's write tool is in beta, and no agent composes a good screen without being told which components and patterns to use.

Back to the onboarding screen and its three layouts. Composed by an agent in the Figma file, each concept is made of the library's instances and variables, sits where designers work, and shares as a Figma prototype link. The tools are the ones Part 7 sets out in [code to Figma instances](building-screens-with-an-agent.md#code-to-figma-instances): Figma's `use_figma` (beta, with its plan and image limits) or Southleft's Figma Console MCP, which place library instances, while `generate_figma_design` only captures flat layers, useful as a reference and not for ideation.

Because the Plugin API documents [prototype reactions](https://developers.figma.com/docs/plugins/api/Reaction/) (a trigger and a list of actions), an agent using either server should be able to wire frames into a clickable flow. Neither was tested for this. Figma's own [First Draft](https://help.figma.com/hc/en-us/articles/23955143044247) can't use a team's design system; the newer [Figma agent](https://help.figma.com/hc/en-us/articles/37998629035799-Work-with-the-Figma-agent-in-design-files) can attach a file's libraries, with prototyping marked "coming soon".

A prototype with ["Anyone" access](https://help.figma.com/hc/en-us/articles/360040531773-Share-or-embed-your-files-and-prototypes) reaches people outside the organisation; passwords need a paid plan, and an admin can disable public links. Figma staff on the [forum](https://forum.figma.com/t/sharing-a-prototype-without-having-user-required-to-sign-in-to-figma/40423/31) say it works signed out; users report occasional login prompts.

Have the agent compose on a sanctioned scratch page from library instances only, with your project's context document and component list as its instructions, and wire prototype connections when a flow is the point. Share with "Anyone" access and a password, and **open the link logged out before sending it.** Use Figma Make with a kit as a second route for clickable concepts, judged as concepts.

---

## Shipping a winning prototype

A winning prototype doesn't merge: an accepted idea is rebuilt on a feature branch from the same components, passes the same gates as any code, and a person approves it.

Say the contacts filter flow wins. The prototype runs on fixtures. Vallaure's handoff has four steps:

1. prototype on a design branch;
2. rebuild on a feature branch, with real data and its loading, error and empty states;
3. run CI: tests, accessibility, responsiveness, real-component use, performance;
4. have a person approve, because a green build only says the checks found nothing.

The rebuild is cheap only when the prototype was made from the real parts, which is where the [import test](#real-components-or-lookalikes) pays off. The real-component gate already exists as lint in published systems; the rules Atlassian, Primer and Salesforce ship are listed in Part 5, [What keeps an agent on track](what-keeps-an-agent-on-track.md), and [react-scanner](https://github.com/moroshko/react-scanner) counts which components and props a change uses. Brad Frost's [`vibe-killer` skill](https://github.com/bradfrost/skills) rebuilds a vibe-coded page from the system's components with a receipt of what it replaced, without a measured run.

There is also a case against wiring the agent to the whole codebase. Vallaure gives two reasons: noise, as the agent wades through helpers and old files, and drift, since "an agent copies whatever it finds most of". No controlled study of the drift claim exists. [Fluent's `AGENTS.md`](https://github.com/microsoft/fluentui/blob/master/AGENTS.md) writes the remedy into its instructions: "Never copy patterns from existing code without verifying they match these instructions."

Keep your prototypes on a branch that never merges, or as stories in a `Prototypes/` group. Rebuild the accepted ones on a feature branch, and **put a raw-element and raw-value lint into that branch's CI.** Ask your developers to run their checks on one prototype first, so the designers see what the gates catch.

---

## Two real projects

Both get flow stories written by a coding agent and published to Chromatic, plus agent-composed concepts in Figma; what differs is where the stories can live.

A worked case, as the two projects stood on 14 October 2026.

**Project B** keeps components and screens in `src/design-system` and `src/screens`, with a story per screen state and fixtures. It already runs `@storybook/addon-mcp` and `@chromatic-com/storybook`, and deploys every commit to `main` to production with no preview step. So its flows are stories in a `Prototypes/` group composing the existing screens, published to Chromatic. A Vercel preview of a `/prototype` route is the wrong channel: with no preview step, a merged route ships to production.

**Project A**'s code is a read-only clone. Its library, `@project-a/design-system` (MUI 9, MUI X Pro and Premium, Storybook 10 with `react-vite`), is published to a private Azure Artifacts feed. So its flows live in a small prototype repository outside the clone, with its own Storybook, installing the published package with a read token and writing flow stories exactly as for Project B. That keeps prototypes on released versions, which is what a reviewer should see. If designers must build flows without code, UXPin Merge with Wire through the Storybook route is the option, after a trial confirms React 19 and MUI 9; Story UI's MUI preset makes it a reasonable trial too.

If your projects look like either, start with what needs no new platform and no new spend: flow stories plus Chromatic, and agent-composed Figma concepts. **Add UXPin or a package-backed Figma Make only when a measured gap justifies the seats**, such as designers blocked on engineers or reviewers wanting a running app.

---

## Cheat sheet

| Tool | Job | Real components? | Flows and state | Sharing for non-technical viewers | Cost for this | MUI or custom React | Maturity |
|---|---|---|---|---|---|---|---|
| Storybook flow stories | Prototype | Yes, the shipping code | Full (state, links, play, mocks, router) | Via a host below | Free | Both | Stable |
| Coding agent + Storybook MCP addon | Writes prototypes | Yes | Full | Via a host | Agent usage | Both | Addon in preview |
| Story UI | Generates screens | Yes, type-checked | Local state; no documented flows | Commit and publish the story | Free, own model key | MUI preset | 5.x, fast-moving |
| Chromatic | Host | n/a | n/a | Public link, or invited collaborators | Free plan, 5,000 snapshots | n/a | Stable |
| Vercel previews | Host | n/a | n/a | Shareable Link free; password on Pro | Free to Pro | n/a | Stable |
| v0 (new import) | App builder | Yes, from a package | Full app | Vercel deployments | $30 to $100 per user | MUI not named | 2026 feature |
| Lovable | App builder | Copies; package on Enterprise | Full app | Public or invite-only | Enterprise for packages | MUI not named | GA |
| Bolt | App builder | Unstated | Full app | Site sharing | $30 per member | MUI not named | GA |
| Magic Patterns | App builder | Yes, from a package | Full app | Not established | By onboarding call | MUI not named | Onboarding only |
| UXPin Merge + Wire | Designer canvas, flows | Yes, via Git, Storybook or npm | Navigation, validation, state | Hosted link | $29 to $69 per seat; Git on Enterprise | Custom via Storybook or Git | Wire since June 2026 |
| Figma Make + kit | Clickable concepts | Lookalikes; real only via a package | Full app | `figma.site` link, optional password | Full seat $16 to $90 | Untested | Kits since April 2026 |
| Figma MCP `use_figma` | Ideation in Figma | Library instances and variables | Prototype connections via the Plugin API | Figma prototype link | Paid plan; free in beta | n/a | Beta |
| Figma Console MCP | Ideation in Figma | Library instances | Prototype connections via the Plugin API | Figma prototype link | Free, MIT | n/a | Active open source |
| Claude Design | Concepts, decks | Undocumented | Clickable prototypes | Organisation only | Pro and above | Via `/design-sync` | Research preview |
| Claude artifacts | Single-page demos | Only if bundled into the page | In-page | Public link | Pro and above | Private libraries must be inlined | GA |

---

## The short version

Prototyping flows from code and ideating from a Figma library are two jobs, and tools that claim both mostly do the second well and the first with lookalikes. The test takes minutes: read the generated code's imports. They come from your package, from a copy in the project, or from nowhere, with generic components drawn in your colours; only the first stays correct when the library changes and shows reviewers the behaviour that will ship.

For flows, if you're on Storybook you already have the most faithful and cheapest tool: a story composing the real screen components with local state, links, play functions and mocks, written by a coding agent with Storybook's MCP addon and published to Chromatic, where a public branch link opens without signing in. UXPin Merge with Wire is the one canvas that turns real coded components into a hosted flow for designers who don't code, at the price of a second platform. Of the hosted app builders, only v0's newer import and Magic Patterns document rendering a real package.

For ideation, an agent composing in your Figma file from library instances, wired with prototype connections and shared as a Figma link, keeps concepts made of the library and where designers work. Figma Make from a library alone paints lookalikes.

A prototype that wins isn't merged: rebuild it on a feature branch from the same parts, behind a lint that refuses raw elements and values, and have a person approve it. The two jobs and the three levels of "real" follow from the vendors' own docs; Storybook for flows and Figma composition for ideation are judgements for teams already working in both, and nothing here was run hands-on.

---

## What to re-check later

Researched October 2026 for a design-systems lead running several projects, two in detail: Project B (Next.js 16, React 19, SCSS generated from Figma, Storybook 10 with the Storybook MCP addon) and Project A (a Material UI 9 wrapper library in a read-only repository, Storybook 10, published to a private npm feed). Vendor mechanics were read from primary sources only; no tool was run hands-on. Release records were re-checked on 2 November 2026 and prices at each vendor's pricing page on 9 November 2026. Extended on 4 November 2026 after Christine Vallaure's *AI prototyping inside your design system*. The Figma write-to-canvas mechanics moved to Part 7 on 17 November 2026.

- **Nothing was run hands-on.** The first test for any adopted tool is the import test with the real library.
- **MUI in hosted builders.** No primary source for v0, Lovable, Bolt, Magic Patterns or Figma Make names MUI.
- **UXPin**: React 19 (experimental in Merge's docs), Storybook 10, Wire's password protection and viewer accounts are undocumented.
- **Untested inferences**: Story UI with flows and with a wrapper library; agent-wired Figma prototypes through the Plugin API.
- **Account-free viewing**: Figma's help centre doesn't say a viewer needs no account; Anthropic's two artifact pages disagree.
- **Vendor pages that disagree**: Figma Make kits (React only in one help page, "any web framework" in another); Lovable's FAQ on importing a repository. The Make password tier rests on a forum post.
- **Pace**: Claude Design changed form twice between April and October 2026.

---

## Sources

### Storybook and hosting

- [Southleft, Story UI](https://github.com/southleft/story-ui): README, [setup presets](https://github.com/southleft/story-ui/blob/main/cli/setup.ts), [interaction probe](https://github.com/southleft/story-ui/blob/main/story-generator/verify/probes/interaction.ts), [releases](https://github.com/southleft/story-ui/releases).
- Storybook: [AI overview](https://storybook.js.org/docs/ai), [MCP overview](https://storybook.js.org/docs/ai/mcp/overview), [manifests](https://storybook.js.org/docs/ai/manifests), [addon source](https://github.com/storybookjs/storybook/tree/next/code/addons/mcp), [play functions](https://storybook.js.org/docs/writing-stories/play-function), [interaction testing](https://storybook.js.org/docs/writing-tests/interaction-testing), [mocking modules](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules), [Next.js with Vite](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite), [addon-links](https://github.com/storybookjs/storybook/tree/next/code/addons/links), [storybookjs/mcp](https://github.com/storybookjs/mcp) (archived 14 October 2026).
- [MSW Storybook addon](https://github.com/mswjs/msw-storybook-addon).
- Chromatic: [pricing](https://www.chromatic.com/pricing), [permalinks](https://www.chromatic.com/docs/permalinks), [collaborators](https://www.chromatic.com/docs/collaborators), [UI Review](https://www.chromatic.com/docs/review).
- Vercel: [Shareable Links](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links), [password protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection), [pricing](https://vercel.com/pricing).
- [Netlify, password protection](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/); [GitHub Pages visibility](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site).

### Hosted builders and canvases

- v0: [design systems](https://v0.app/docs/design-systems), [design systems 2.0](https://v0.app/docs/design-systems-2), [pricing](https://v0.app/pricing); shadcn [registry](https://ui.shadcn.com/docs/registry).
- Lovable: [design systems](https://docs.lovable.dev/features/design-systems), [publish](https://docs.lovable.dev/features/publish), [GitHub import FAQ](https://lovable.dev/faq/github/import-github-repo).
- Bolt: [add a design system](https://support.bolt.new/building/design-system/add-design-system), [pricing](https://bolt.new/pricing).
- [Magic Patterns, importing an npm package](https://www.magicpatterns.com/docs/documentation/design-systems/importing/npm-package).
- UXPin: [Merge docs](https://www.uxpin.com/docs/merge/), [introducing Wire](https://updates.uxpin.com/2026-06-26-introducing-uxpin-wire), [Forge](https://www.uxpin.com/docs/forge/what-is-forge/), [pricing](https://www.uxpin.com/pricing).
- [Anima, Figma design system](https://docs.animaapp.com/docs/add-figma-design-system); [Builder.io, Design System Intelligence](https://www.builder.io/c/docs/fusion-design-system-intelligence); [Tempo migration](https://docs.tempo.new/guides/migrate); [Plasmic code components](https://docs.plasmic.app/learn/code-components/).

### Figma

- Make: [kits](https://help.figma.com/hc/articles/39241689698839), [npm packages](https://help.figma.com/hc/articles/43602872461079), [publish](https://help.figma.com/hc/en-us/articles/31304586129559), [download code](https://help.figma.com/hc/en-us/articles/33649966245783), [push to GitHub](https://help.figma.com/hc/en-us/articles/35463818346647-Push-from-Figma-Make-to-GitHub).
- [Features in beta](https://help.figma.com/hc/en-us/articles/4406787442711-What-Figma-features-are-in-beta), [First Draft](https://help.figma.com/hc/en-us/articles/23955143044247), [the Figma agent](https://help.figma.com/hc/en-us/articles/37998629035799-Work-with-the-Figma-agent-in-design-files), [pricing](https://www.figma.com/pricing/).
- [Share or embed files and prototypes](https://help.figma.com/hc/en-us/articles/360040531773-Share-or-embed-your-files-and-prototypes); [Plugin API: Reaction](https://developers.figma.com/docs/plugins/api/Reaction/).

### Anthropic

- [Introducing Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs); help: [set up a design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), [migrating from standalone](https://support.claude.com/en/articles/17440474-migrate-from-standalone-claude-design-to-claude); [Claude Code artifacts](https://code.claude.com/docs/en/artifacts).

### Prototype to pull request

- [react-scanner](https://github.com/moroshko/react-scanner); [Fluent AGENTS.md](https://github.com/microsoft/fluentui/blob/master/AGENTS.md); [Brad Frost, skills](https://github.com/bradfrost/skills).

### Commentary and community

- [Christine Vallaure, *AI prototyping inside your design system*](https://christinevallaure.substack.com/p/ai-prototyping-inside-your-design) (3 November 2026, part 2 of 3).
- [Figma forum, sharing a prototype without sign-in](https://forum.figma.com/t/sharing-a-prototype-without-having-user-required-to-sign-in-to-figma/40423/31).
- [Divriots, powering Google Stitch's export](https://divriots.com/blog/divriots-powers-google-stitch-export-feature).

### Worked-case project records

Private repositories, not linkable; read 14 October 2026: Project B's `package.json`, `.storybook/main.ts`, `AGENTS.md`, `src/screens/contacts-list/contacts-list.stories.tsx` and context document; Project A's `pnpm-workspace.yaml`, `apps/storybook/package.json`, `packages/design-system/package.json` and context document.

---

Part 8 of 9 in *The agent-ready design system*. Previous: [Part 7, Building whole screens with an agent](building-screens-with-an-agent.md). Next: [Part 9, Measuring and showing agent readiness](measuring-agent-readiness.md).
