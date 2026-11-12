# Prototyping with a design system's real components

"Which AI prototyping tool should we use?" is two questions, and one test answers most of both. A prototype flow should be built from the components that will ship, and the cheapest way to get that, for a team already on Storybook, is Storybook itself; ideation should happen where designers work, from the published library, and the strongest route is an agent composing in the Figma file. The test that sorts every other tool takes minutes: open the generated code and read the imports.

Part 8 of 9 in *The agent-ready design system*. Previous: [Part 7, Building whole screens with an agent](building-screens-with-an-agent.md) Next: [Part 9, Measuring and showing agent readiness](measuring-agent-readiness.md)

---

## What this answers

- Are prototyping from code and ideating from Figma one job or two?
- What does "built from real components" mean, and how can a team tell?
- Can Storybook carry a multi-screen prototype, and who writes the flows?
- How does a Storybook prototype reach someone who has never heard of Storybook?
- Which hosted tools use a team's real components, and which draw lookalikes?
- Can an agent draw new screens in Figma with the team's own library?
- How does a prototype that wins become shipped code?
- What should two real projects each do? (the worked appendix)

Section 8 is the cheat sheet and section 9 the short version.

---

## 1. Are prototyping from code and ideating from Figma one job or two?

A prototype flow is a question about behaviour, best answered by the components that will ship. Ideation is a question about direction, best answered by something fast to throw away. No tool surveyed does both well for a custom library, and the ones that claim to usually do the second well and the first with lookalikes.

A flow (sign-up in three steps, a filter dialog over a list, an empty state turning into a populated one) is shown to people so they can react to how the product will behave. If the button in the prototype is not the product's button, they react to the wrong thing: spacing, focus ring, disabled state and error message all differ in small ways that matter to exactly the people being asked. That pushes the prototype toward the coded components, in a browser.

Ideation is the opposite trade. Three layouts for an onboarding screen, or "what if the sidebar were a command bar", are worth generating in bulk and mostly discarding. They need to look like the product so the idea is judged fairly, not to behave like it. For a team whose design happens in Figma, the natural home for them is the Figma file, built from the published library, where a designer can pick one up and continue.

The market blurs the line because one generator can emit either: Figma Make writes running React, UXPin Forge generates screens that Wire turns into flows, Claude Design produces concepts and clickable prototypes. What decides which job a tool can do is section 2's question.

**What to do.** Choose the prototype tool for fidelity to the coded components and for how easily a reviewer opens it, and the ideation tool for speed, staying inside the library, and how easily a designer continues. A tool that does both is a bonus, not the criterion.

---

## 2. How can a team tell real components from copies and lookalikes?

Three things are sold as "built from your components". Real components means the output imports the team's own package. Regenerated copies means the tool read the library and wrote new code that copies it. Styled lookalikes means it took the tokens and drew generic components in them. Only the first stays correct when the library changes.

| Level | What the output contains | Examples in the vendors' own docs | What breaks it |
|---|---|---|---|
| Real components | `import { Button } from '@team/design-system'` | v0's newer design-system import, which refuses any component, prop or token it cannot verify; Story UI, which checks every prop against the real type; UXPin Merge; Magic Patterns' npm route | Nothing the library does |
| Regenerated copies | Component source copied into the generated project | Lovable, which copies components into `src/design-system/<slug>/` and overwrites local edits on update; Bolt, which generates "a Storybook inside Bolt" | The next library release, until someone re-imports |
| Styled lookalikes | Generic components painted with the team's tokens | Figma Make kits from a library, which become a global CSS file of raw values; Anima's Figma import; Google Stitch | Any component whose behaviour, not colour, is the point |

The cause is that most hosted generators were built around one stack. v0's legacy guide says v0 is trained on the default shadcn/ui implementations; its newer guide warns that the default Next.js, shadcn and Tailwind starter may conflict with a system that brings its own components, styles or providers. Material UI (Emotion, a ThemeProvider at the root) and generated SCSS are both outside that default, and none of v0, Lovable, Bolt or Magic Patterns names MUI anywhere in its design-system docs.

The test: open the generated code and read the imports. From the team's package, it is real; from a folder the tool created, a copy; a `<button>` with a class and hex values, a lookalike. A second test: change a token or a prop default in the library and regenerate. Real components pick it up; the others do not.

**What to do.** For flows accept only the first level: a copy is a fork that starts drifting the day it is made. For ideation the third is acceptable for early concepts and the first is better, because a concept made of real parts can be handed over without being redrawn. Run the import test on any tool before adopting it.

---

## 3. Can Storybook carry a multi-screen prototype, and who writes the flows?

For a team whose components live in Storybook, a flow is a story that composes the real screen components with fixture data, and Storybook 10 has every mechanism a click-through needs. What it lacks is a designer-facing canvas: a flow is written as code.

Blackbook already keeps a story per screen state (`contacts-list.stories.tsx` holds `Default`, `Details`, `AddBadge`, `Filter`, `FilterResults`, `FilterNoResults`, `Search` and others, each rendering the real screen with fixtures). That is a state catalogue, which is most of a prototype. Four documented mechanisms turn it into a flow:

- **State inside the story.** A wrapper holds the current step in `useState` and swaps screens on the real components' events. Ordinary React, no addon.
- **Links between stories.** `@storybook/addon-links` provides `linkTo('Title', 'Story')` as an `onClick` and a `LinkTo` component, chaining separate screen stories into a click-through.
- **Play functions.** They type, click and group steps with `step()` after render; the Interactions panel pauses, rewinds and steps through them; modals outside the canvas are reached through `screen`. "Open filter, choose two options, apply" can be a story a reviewer watches.
- **Mocking.** `sb.mock` (since 9.1) replaces modules from `.storybook/preview.ts`; `msw-storybook-addon` 3.0.3 mocks network requests; the `nextjs-vite` framework mocks the app router (`parameters.nextjs.appDirectory: true`) and exposes `getRouter()`, so a flow across routes runs in one story.

The advantages are fidelity and cost: every pixel and behaviour is the shipping one, the prototype costs nothing beyond the Storybook already running, a winning prototype becomes the real screen with no translation, and in a project with a parity loop it is measured like everything else. The disadvantages: a designer who does not write React depends on an engineer or an agent; Storybook's chrome reads as a developer tool (a story's iframe URL removes it); and server-backed flows need fixtures for every state.

**Who writes the flows.** A coding agent in the repository with Storybook's MCP addon writes them most reliably. `@storybook/addon-mcp` (10.6.5) serves `/mcp` from the dev server with nine tools: story-writing instructions, finding stories by component, preview links, a `test-run` that reports accessibility results so the agent fixes its own errors, and docs tools that need `features: { componentsManifest: true }`. Storybook labels it all preview. It is context, not a generator. The docs tools need a React, Angular-Vite or Vue-Vite framework (Vue also needs `experimentalDocgenServer`); the development and test tools work in any Storybook. Its separate repository, `storybookjs/mcp`, was archived on 14 October 2026 and the code "moved to storybookjs/storybook as of Storybook v10.6.0", alongside a Claude Code plugin and a Codex plugin. Storybook's docs give a snippet for `AGENTS.md` or `CLAUDE.md` that tells the agent to list the documented components and check their props before writing ("CRITICAL: Never hallucinate component properties!") and to run `test-run` after. Storybook's headline figures for the addon, measured on Reshaped with no published method, are weighed in [Part 4, section 3](how-the-system-reaches-the-agent.md#3-should-the-reference-be-served-on-demand-or-all-at-once). Southleft's **Story UI** (MIT, 5.23.0, version 5 within about fifteen months, so its API moves) adds a prompt box inside Storybook that writes a `.stories.tsx` from the project's components, discovers them from type declarations, local source and the Storybook index, checks every prop against its real type, ships a Material UI preset, and verifies each story in Playwright (overflow, a click on each control, a vision model's verdict), regenerating what fails. It does not document play functions or linked multi-screen flows, so its screens still need wiring.

| | Coding agent with Storybook MCP | Story UI |
|---|---|---|
| Who drives it | Someone comfortable in a terminal | Anyone with Storybook open locally |
| Real components | Yes, from the repo and the manifest | Yes, by discovery and type checking |
| Multi-step flows, play functions | Yes, written like any code | Not documented |
| Self-check | The addon's test tool and the project's checks | Playwright render, interaction probe, vision review |
| Output | Any file, reviewed as a diff | A story, handed off as a branch or pull request |

**What to do.** Write each flow as one story with local state (or a few joined with `linkTo`), reuse the screens' fixtures, add a play function where a sequence should be watched, and keep flows in a `Prototypes/` group so they are not mistaken for component docs. Turn on the component manifest and paste Storybook's snippet into the rules file. Ask for a receipt with every prototype: Vallaure's prompt asks the agent to use only the system's components, to piece together and clearly mark anything missing, and to list what it had to invent. Each invented item is a gap for the system's backlog, not a one-off to ship. Trial Story UI where a designer wants screens without a terminal.

---

## 4. How does a Storybook prototype reach a reviewer?

Publish the Storybook to Chromatic and make it public: every branch gets a stable link anyone can open without signing in, on the free plan. For a private link, Chromatic collaborators need an account; Vercel's free Shareable Links are the cheapest private option.

Chromatic publishes each build at `https://<branch>--<appid>.chromatic.com`, always the latest build of that branch, plus a commit-pinned form. Storybooks are private by default; public visibility lets anyone with the link view it while the project's tests and settings stay private. Collaborators (Owner, Developer, Reviewer, Viewer, including external ones limited to one project) suit a reviewer willing to sign up; UI Review adds comment threads. The free plan includes 5,000 snapshots a month (Starter $179 for 35,000), with unlimited projects and collaborators; whether publishing alone consumes snapshots is not in the docs. Chromatic can also publish the Storybook MCP server alongside, private when the Storybook is.

A built Storybook is static files, so any host serves it:

| Route | Viewer needs an account | Private | Cost | Comments |
|---|---|---|---|---|
| Chromatic, public | No | No (anyone with the link) | Free plan | UI Review, for signed-in collaborators |
| Chromatic, collaborators | Yes | Yes | Free plan | Yes |
| Vercel preview with a Shareable Link | No | By unguessable link | Free on all plans (one link on Hobby) | Vercel account needed |
| Vercel with a password | No | Yes | Pro plus $20 a month per project | Vercel account needed |
| Netlify with a password | No | Yes | Pro plan | No |
| GitHub Pages, private | Yes, with repository access | Yes | Enterprise Cloud | No |

**What to do.** Send reviewers the branch permalink pointing at the flow story's full-screen view, which removes Storybook's chrome on any host. Public Chromatic for non-confidential work; a Viewer invitation or a Vercel Shareable Link when it must stay private. Keep the prototype on its own branch so the permalink tracks it.

---

## 5. Which hosted tools use a team's real components?

Only v0's newer import, Magic Patterns' npm route and UXPin Merge document rendering a team's real package; Lovable and Bolt copy; Figma Make, Anima and Stitch paint lookalikes unless given a package; Claude Design does not say. Every hosted app builder is built around Tailwind and shadcn, and none documents MUI.

- **v0.** The newer route imports from GitHub, Figma frames, Storybook or docs links, or uploads, with an installable package (public or private npm through a team `NPM_TOKEN`) as the source of truth; it saves the system as a `SKILL.md`, reads up to three sources, and will not use a component, prop or token it cannot verify there. The older route is a Tailwind shadcn registry at a public URL. Results deploy to Vercel. Plans run Free, Plus ($30 per user a month), Business ($100); which includes the import is not stated.
- **Lovable** copies components into each consuming project and replaces them on update; wrapping a real npm package is Enterprise only; published apps are public or invite-only with no password. Its FAQ contradicts itself on importing an existing repository.
- **Bolt** imports a system on Teams ($30 per member a month), ten imports or syncs a week, and generates a Storybook inside Bolt; whether apps then import the real package is not stated.
- **Magic Patterns** renders the team's package from npm, GitHub Packages or a tarball; setup is by onboarding call.
- **UXPin Merge with Wire and Forge** is the only tool that puts a team's own coded React components on a designer's canvas and turns them into flows. Merge imports from Git (webpack-built, Enterprise), a published Storybook (Growth) or npm. Wire (26 June 2026) links Merge screens into a flow with navigation, validation and state, published as a hosted link or exported as Vite and React; it takes code components from one library at a time. Forge generates screens with MUI, Ant Design, shadcn or a custom Merge library, but not multi-step flows. Plans: Core $29/$49, Growth $40/$69, Enterprise custom. Merge's docs call React 19 support experimental (React 16 to 18 are supported); Storybook 10 compatibility is undocumented, as are Wire's password protection and plan.
- **Figma Make** takes, in a Make kit (since April 2026), npm packages, variables and styles from published libraries, and Markdown guidelines. Figma's own page says the library route pulls "a subset" of variables into a global CSS file of raw values; library components are not used, so a library-only kit is lookalike level. A package must build under Vite with no workspace dependencies; private packages need the Organization or Enterprise registry. Publishing gives a `*.figma.site` link, optionally password-protected (a forum post says Organization and above); code leaves as a ZIP or a one-way push to a new repository.
- **Claude Design** (research preview from 17 April 2026, now an artifact template; standalone `claude.ai/design` closes 14 December 2026) learns a system from Figma files or, through Claude Code's `/design-sync`, from the codebase, and exports to ZIP, PDF, PPTX, HTML, Canva, Vercel or Wix. Sharing is within the organisation; whether output imports the real components is not documented. **Claude artifacts** give a public link without sign-in from Claude Code (Anthropic's two help pages disagree), but load scripts only from public CDNs, so a private library reaches one only if bundled into the page (16 MiB limit; untested).
- **The rest.** Anima's Figma import produces a generated Storybook styled from variables (lookalike). Builder.io generates code with a repository's components and ships pull requests, but is a code generator, not a prototyping canvas. Tempo's canvas frames real routes from the team's dev server but retired its web editor on 14 June 2026 and documents no hosted link. Plasmic is a page builder. Subframe, Stitch, Framer's experimental npm import, Onlook and Penpot were excluded on their own docs.

**What to do.** Do not adopt a hosted builder as the prototype tool on the strength of its docs. If one is trialled, trial v0's newer import with a published package and run the import test on the first screen. Consider UXPin Merge with Wire only if designers who do not code must build flows often enough to justify a seat each, and trial its Storybook route first.

---

## 6. Can an agent draw new screens in Figma with the team's own library?

For a Figma-first team this is the strongest ideation route: the concepts are made of the library's instances and variables, sit in the file where designers work, and share as a Figma prototype link. Two caveats: Figma's write tool is beta, and no agent composes a good screen without being told which components and patterns to use.

**Figma's MCP server, write to canvas.** `use_figma` lets an agent run Plugin API code against a file (frames, components, variables, auto layout), and Figma advises naming the libraries, components, variables or modes to use. As of November 2026 the feature is in beta and free to use during it, and Figma says it will "eventually become a usage-based paid feature". It needs a Professional, Education, Organization or Enterprise plan, edit access and a supported client. `use_figma` cannot add images itself, but an agent can add them with `upload_assets` or create them with `generate_image`; components containing images or video are not yet supported, and fonts work if uploaded to the Figma account (not if only installed locally). Each call returns at most 20 KB. A separate tool, `generate_figma_design` (Code to Canvas), captures a running app as flat layers with no library connection, useful as reference, not for ideation.

**Southleft's Figma Console MCP** (MIT, 1.46.0) works through a Desktop Bridge plugin and exposes over a hundred tools locally: `figma_search_components` finds library components, `figma_instantiate_component` places them with properties set, `figma_execute` runs arbitrary Plugin API code. Because the Plugin API documents prototype reactions (a trigger and a list of actions), an agent using either server should be able to wire frames into a clickable flow; neither was tested for this.

**Figma's own AI.** First Draft cannot use a team's design system. The newer Figma agent can attach a file's libraries and edit instances, with prototyping marked "coming soon"; Figma's pages disagree on its beta status and credit use.

**Sharing.** A prototype with "Anyone" access reaches people outside the organisation; prototype-only links and passwords need a paid plan, and an admin can disable public links. Figma's help centre does not say a viewer needs no account; Figma staff on the forum say "anyone with the link" works signed out, and users report occasional login prompts.

**What to do.** Have the agent compose on a sanctioned scratch page from library instances only, with the project's context document and component list as instructions, wiring prototype connections when a flow is the point. Share with "Anyone" access and a password, and open the link logged out before sending it. Use Figma Make with a kit as a second route for clickable concepts, judged as concepts.

---

## 7. How does a prototype that wins become shipped code?

The prototype branch is never merged. If an idea is accepted, it is rebuilt on a feature branch from the same components, with real data and its loading, error and empty states. That branch passes the same gates as any code, including a check that every component used is a real one. A person approves the result, because a green build only says the checks found nothing.

Vallaure's handoff has four steps: prototype on a design branch, rebuild on a feature branch, run CI (tests, accessibility, responsiveness, real-component use, performance), and have a person approve. An AI review of the change against the ticket is optional. The rebuild is cheap only when the prototype was made from the real parts. That is section 2's import test paying off. A prototype made of copies or lookalikes has to be built from scratch.

The real-component gate already exists as lint in published systems; the rules Atlassian, Primer and Salesforce ship are listed in [Part 5, section 4](what-keeps-an-agent-on-track.md#4-what-is-a-guardrail-and-is-it-the-same-as-a-check). react-scanner counts which components and props a change uses. Brad Frost's `storybook-to-product` skill carries a Storybook page through to a pull request, and his `vibe-killer` rebuilds an already vibe-coded page from the system's components. `vibe-killer` writes a receipt of the hard-coded values it replaced and the gaps it found in the system. Vallaure reports not having used it, and neither skill comes with a measured run.

**The case against wiring the agent to the whole codebase.** Vallaure's reasons: noise, because the agent wades through helpers and old files, and drift, because "an agent copies whatever it finds most of". Her warning signs are an agent rebuilding a component that exists, copying an old pattern, and sessions getting slower and costlier. No controlled study of the drift claim was found. Fluent's `AGENTS.md` writes the remedy into its instructions: "Never copy patterns from existing code without verifying they match these instructions." A manifest or a design-system server keeps the agent on the current set. A small system can skip the server.

**What to do.** Keep prototypes on a branch that never merges, or as stories in a `Prototypes/` group. Rebuild the accepted ones on a feature branch, and put a raw-element and raw-value lint into that branch's CI. Ask the developers to run their checks on one prototype first, so the designers see what the gates catch.

---

## 8. Cheat sheet

| Tool | Job | Real components? | Flows and state | Sharing for non-technical viewers | Cost for this | MUI or custom React | Maturity |
|---|---|---|---|---|---|---|---|
| Storybook flow stories | Prototype | Yes, the shipping code | Full (state, links, play, mocks, router) | Via a host below | Free | Both | Stable |
| Coding agent + Storybook MCP addon | Writes prototypes | Yes | Full | Via a host | Agent usage | Both | Addon in preview |
| Story UI | Generates screens | Yes, type-checked | Local state; no documented flows | Commit and publish the story | Free, own model key | MUI preset | 5.x, fast-moving |
| Chromatic | Host | n/a | n/a | Public link, or invited collaborators | Free plan, 5,000 snapshots | n/a | Stable |
| Vercel previews | Host | n/a | n/a | Shareable Link free; password on Pro | Free to Pro | n/a | Stable |
| v0 (new import) | App builder | Yes, from a package | Full app | Vercel deployments | $30 to $100 per user | MUI not named | 2026 feature |
| Lovable | App builder | Copies; package on Enterprise | Full app | Public or invite-only | Paid; Enterprise for packages | MUI not named | GA |
| Bolt | App builder | Unstated | Full app | Site sharing | $30 per member | MUI not named | GA |
| Magic Patterns | App builder | Yes, from a package | Full app | Not established | By onboarding call | MUI not named | Onboarding only |
| UXPin Merge + Wire | Designer canvas, flows | Yes, via Git, Storybook or npm | Navigation, validation, state | Hosted link | $29 to $69 per seat; Git on Enterprise | MUI 9 built in; custom via Storybook or Git | Wire since June 2026 |
| Figma Make + kit | Clickable concepts | Lookalikes; real only via a package | Full app | `figma.site` link, optional password | Full seat $16 to $90 | Untested | Kits since April 2026 |
| Figma MCP `use_figma` | Ideation in Figma | Library instances and variables | Prototype connections via the Plugin API | Figma prototype link | Paid plan; free in beta | n/a | Beta |
| Figma Console MCP | Ideation in Figma | Library instances | Prototype connections via the Plugin API | Figma prototype link | Free, MIT | n/a | Active open source |
| Claude Design | Concepts, decks | Undocumented | Clickable prototypes | Organisation only | Pro and above | Via `/design-sync` | Research preview |
| Claude artifacts | Single-page demos | Only if bundled into the page | In-page | Public link (per the Claude Code docs) | Pro and above | Private libraries must be inlined | GA |

---

## 9. The short version

Prototyping flows from code and ideating from a Figma library are two jobs, and tools that claim both mostly do the second well and the first with lookalikes. The test takes minutes: read the generated code's imports. From the team's package, copied into the project, or drawn generically in the team's colours; only the first stays correct when the library changes and shows reviewers the behaviour that will ship.

For flows, a team on Storybook already has the most faithful and cheapest tool: a story composing the real screen components with local state, links, play functions and mocked modules, network and router, written by a coding agent with Storybook's MCP addon and published to Chromatic, where a public branch link opens without signing in. UXPin Merge with Wire is the one canvas that turns real coded components into a hosted flow for designers who do not code, at the price of a second platform. The hosted app builders are built around Tailwind and shadcn; only v0's newer import and Magic Patterns document rendering a real package.

For ideation, an agent composing in the Figma file from library instances, through Figma's beta `use_figma` or Figma Console MCP, wired with prototype connections and shared as a Figma link, keeps concepts made of the library and where designers work. Figma Make from a library alone paints lookalikes. Run the import test before any tool touches a project.

A prototype that wins is not merged: it is rebuilt on a feature branch from the same parts, behind a lint that refuses raw elements and values, and a person approves it.

---

## 10. What to re-check later

Researched October 2026 for a design-systems lead running several projects, two in detail: blackbook (Next.js 16, React 19, SCSS generated from Figma, Storybook 10 with the Storybook MCP addon) and suiteify (a Material UI 9 wrapper library in a read-only repository, Storybook 10, published to a private npm feed). Vendor mechanics were read from primary sources only: Figma's help centre and MCP developer docs, Storybook's AI and testing docs, Chromatic's docs and pricing, Vercel's deployment-protection docs, v0's two design-system guides, the shadcn registry spec, Lovable's and Bolt's support docs, UXPin's docs and changelog, Anima's and Builder.io's docs, Magic Patterns' docs, Anthropic's Claude Design and artifacts docs, and Southleft's Story UI and Figma Console MCP. No tool was run hands-on. Re-checked on 2 November 2026: Figma's write-to-canvas page (still beta and free during it; the plan requirement and image and font limits have changed, section 6), the npm and GitHub release records (`@storybook/addon-mcp` and `@storybook/addon-links` 10.6.5, Story UI 5.23.0 of 26 October, Figma Console MCP 1.46.0 of 29 October, `msw-storybook-addon` 3.0.3, `@uxpin/merge-cli` 3.7.2), and the Storybook MCP docs (10.6, still preview). Prices were re-checked at each vendor's pricing page on 9 November 2026 (Chromatic, Vercel, v0, Bolt, UXPin, Figma) and were unchanged. Extended on 4 November 2026 after Christine Vallaure's *AI prototyping inside your design system* (3 November 2026), with primary sources: section 7 (prototype to pull request) was added, and section 3 gains the Storybook MCP's move into the Storybook repository and its agent snippet.

- **Figma's write-to-canvas limits moved** between October and November 2026: the page no longer names a seat type (it had said a Full seat), and the earlier "no images and no custom fonts" limit gave way to `upload_assets`, `generate_image` and uploaded fonts.
- **Nothing was run hands-on.** The first test for any adopted tool is the import test with the real library.
- **MUI in hosted builders.** No primary source for v0, Lovable, Bolt, Magic Patterns or Figma Make names MUI.
- **UXPin**: React 19 (experimental in Merge's docs), Storybook 10, Wire's password protection, plan and viewer accounts are undocumented.
- **Story UI** with flows and with a wrapper library, inferred rather than documented.
- **Agent-wired Figma prototypes** through the Plugin API, untested.
- **Account-free viewing**: Figma's help centre is silent; Anthropic's two artifact pages disagree; Claude Design documents no public link.
- **Vendor pages that disagree**: Figma's beta list and agent article; Builder.io's docs and pricing; Lovable's FAQ.
- **Prices**, re-checked 9 November 2026 at Chromatic's, Vercel's, v0's, Bolt's, UXPin's and Figma's pricing pages; several AI-credit models changed during the year.
- **Figma Make kits and frameworks**: one help page says React only (React 18), another "any web framework"; Figma staff on the forum say code components come only from the npm package. "Code Sources", named by Vallaure, has no public Figma doc; Part 3 of her series (10 November 2026) covers Figma.
- **Storybook's MCP numbers** have no published method.
- **Pace**: Claude Design changed form twice between April and October 2026, Figma's agent replaced First Draft as the entry point in May, `use_figma`'s limits changed between October and November.

---

## Appendix: a worked case, two projects

*A worked example, not general advice: it applies sections 1 to 7 to two of the projects this piece was researched for, as they stood on 14 October 2026.*

Both projects get flow stories written by a coding agent and published to Chromatic, and agent-composed concepts in Figma. What differs is where the stories can live.

**Blackbook** keeps components and screens in `src/design-system` and `src/screens` with a story per screen state and fixtures, already runs `@storybook/addon-mcp` and `@chromatic-com/storybook`, designs in Figma by rule, deploys every commit to `main` to production with no preview step, and reverted Tailwind and shadcn by recorded decision. So: flows as stories in a `Prototypes/` group composing the existing screens, published to Chromatic. A Vercel preview of a `/prototype` route is the wrong channel, because with no preview step a merged route ships to production. Hosted builders are ruled out by their starters and by the components not being a package.

**Suiteify**'s code is a read-only clone; its library `@arc/design-system` (MUI 9, MUI X Pro and Premium, Storybook 10 with `react-vite`) is published to a private Azure Artifacts feed. So: a small prototype repository outside the clone with its own Storybook, installing the published package with a read token, writing flow stories exactly as for blackbook, with the MCP addon. That keeps prototypes on released versions, which is what a reviewer should see. If designers must build flows without code, UXPin Merge with Wire through the Storybook route, after a trial confirms React 19 and MUI 9. Story UI's MUI preset makes it a reasonable trial in the prototype repository; whether it handles a wrapper rather than raw `@mui/material` is untested.

**What to do.** Start with what needs no new platform and no new spend (flow stories plus Chromatic, agent-composed Figma concepts), and add UXPin or a package-backed Figma Make only when a measured gap (designers blocked on engineers, reviewers wanting a running app) justifies the seats.

---

## Sources

### Storybook and hosting

- [Southleft, Story UI](https://github.com/southleft/story-ui): README, [setup presets](https://github.com/southleft/story-ui/blob/main/cli/setup.ts), [interaction probe](https://github.com/southleft/story-ui/blob/main/story-generator/verify/probes/interaction.ts), [deployment guide](https://github.com/southleft/story-ui/blob/main/DEPLOYMENT.md), [releases](https://github.com/southleft/story-ui/releases).
- Storybook: [AI overview](https://storybook.js.org/docs/ai), [MCP overview](https://storybook.js.org/docs/ai/mcp/overview), [MCP API](https://storybook.js.org/docs/ai/mcp/api), [manifests](https://storybook.js.org/docs/ai/manifests), [sharing the MCP server](https://storybook.js.org/docs/ai/mcp/sharing), [addon source](https://github.com/storybookjs/storybook/tree/next/code/addons/mcp), [play functions](https://storybook.js.org/docs/writing-stories/play-function), [interaction testing](https://storybook.js.org/docs/writing-tests/interaction-testing), [mocking modules](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules), [mocking network requests](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-network-requests), [9.1 release](https://storybook.js.org/releases/9.1), [Next.js with Vite](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite), [addon-links](https://github.com/storybookjs/storybook/tree/next/code/addons/links).
- [MSW Storybook addon](https://github.com/mswjs/msw-storybook-addon).
- Chromatic: [pricing](https://www.chromatic.com/pricing), [permalinks](https://www.chromatic.com/docs/permalinks), [collaborators](https://www.chromatic.com/docs/collaborators), [UI Review](https://www.chromatic.com/docs/review).
- Vercel: [deployment protection](https://vercel.com/docs/deployment-protection), [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication), [password protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection), [Shareable Links](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links), [comments](https://vercel.com/docs/comments), [pricing](https://vercel.com/pricing).
- [Netlify, password protection](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/); [GitHub Pages visibility](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site).

### Hosted builders and canvases

- v0: [design systems](https://v0.app/docs/design-systems), [design systems 2.0](https://v0.app/docs/design-systems-2), [GitHub](https://v0.app/docs/github), [deployments](https://v0.app/docs/deployments), [pricing](https://v0.app/pricing); shadcn [registry](https://ui.shadcn.com/docs/registry), [registry-item.json](https://ui.shadcn.com/docs/registry/registry-item-json), [Open in v0](https://ui.shadcn.com/docs/registry/open-in-v0).
- Lovable: [design systems](https://docs.lovable.dev/features/design-systems), [publish](https://docs.lovable.dev/features/publish), [GitHub import FAQ](https://lovable.dev/faq/github/import-github-repo).
- Bolt: [add a design system](https://support.bolt.new/building/design-system/add-design-system), [best practices](https://support.bolt.new/building/design-system/best-practices), [pricing](https://bolt.new/pricing).
- [Magic Patterns, importing an npm package](https://www.magicpatterns.com/docs/documentation/design-systems/importing/npm-package).
- UXPin: [Merge](https://www.uxpin.com/merge), [docs](https://www.uxpin.com/docs/merge/), [React components](https://www.uxpin.com/docs/merge/merge-connect-your-library/#integrating-your-own-components), [AI-assisted integration](https://www.uxpin.com/docs/merge/merge-start/#ai-assisted-merge-integration), [Storybook integration](https://www.uxpin.com/docs/merge/merge-connect-your-library/#storybook-integration) (all three moved into two pages; re-found 9 November 2026), [updates](https://updates.uxpin.com/), [introducing Wire](https://updates.uxpin.com/2026-06-26-introducing-uxpin-wire), [opening Wire](https://www.uxpin.com/docs/wire/opening-wire/), [Forge](https://www.uxpin.com/docs/forge/what-is-forge/), [pricing](https://www.uxpin.com/pricing).
- Anima: [Figma design system](https://docs.animaapp.com/docs/add-figma-design-system), [MCP](https://docs.animaapp.com/docs/anima-mcp), [MUI](https://docs.animaapp.com/docs/mui-material-ui), [flows](https://docs.animaapp.com/docs/advanced-feature-create-full-flows), [publish](https://docs.animaapp.com/docs/publish).
- Builder.io: [Fusion](https://www.builder.io/fusion), [projects from repositories](https://www.builder.io/c/docs/fusion-projects-from-repositories), [Design System Intelligence](https://www.builder.io/c/docs/fusion-design-system-intelligence), [component indexing](https://www.builder.io/c/docs/component-indexing), [previews](https://www.builder.io/c/docs/projects-previews), [pricing](https://www.builder.io/pricing).
- [Tempo canvas](https://docs.tempo.new/product/canvas) and [migration](https://docs.tempo.new/guides/migrate); [Plasmic code components](https://docs.plasmic.app/learn/code-components/); [Subframe importing](https://docs.subframe.com/learn/components/importing); [Framer npm](https://www.framer.com/npm/); [Onlook](https://github.com/onlook-dev/onlook).

### Figma

- Make: [kits](https://help.figma.com/hc/articles/39241689698839), [npm packages](https://help.figma.com/hc/articles/43602872461079), [kits announcement](https://www.figma.com/blog/introducing-make-kits-and-make-attachments/), [publish](https://help.figma.com/hc/en-us/articles/31304586129559), [download code](https://help.figma.com/hc/en-us/articles/33649966245783), [push to GitHub](https://help.figma.com/hc/en-us/articles/35463818346647-Push-from-Figma-Make-to-GitHub), [local codebase](https://help.figma.com/hc/en-us/articles/40775535020695-Make-in-your-local-codebase).
- [AI credits](https://help.figma.com/hc/en-us/articles/33459875669015), [pricing](https://www.figma.com/pricing/), [features in beta](https://help.figma.com/hc/en-us/articles/4406787442711-What-Figma-features-are-in-beta), [First Draft](https://help.figma.com/hc/en-us/articles/23955143044247), [the Figma agent](https://help.figma.com/hc/en-us/articles/37998629035799-Work-with-the-Figma-agent-in-design-files).
- [MCP server: write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas) (re-checked 2 November 2026), [write to canvas and Code to Canvas](https://help.figma.com/hc/en-us/articles/39252411778583), [code to canvas with a design system](https://help.figma.com/hc/en-us/articles/40287261761559-Code-to-canvas-with-your-design-system).
- [Share or embed files and prototypes](https://help.figma.com/hc/en-us/articles/360040531773-Share-or-embed-your-files-and-prototypes); [Plugin API: Reaction](https://developers.figma.com/docs/plugins/api/Reaction/).
- [Southleft, Figma Console MCP](https://github.com/southleft/figma-console-mcp).

### Anthropic

- [Introducing Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs); help: [set up a design system](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design), [get started](https://support.claude.com/en/articles/14604416-get-started-with-claude-design), [migrating from standalone](https://support.claude.com/en/articles/17440474-migrate-from-standalone-claude-design-to-claude), [share artifacts](https://support.claude.com/en/articles/9547008-share-artifacts); [Claude Code artifacts](https://code.claude.com/docs/en/artifacts); [MUI on jsDelivr](https://cdn.jsdelivr.net/npm/@mui/material@7.0.0/+esm).

### Prototype to pull request

- Storybook: [MCP for React](https://storybook.js.org/blog/storybook-mcp-for-react/) (the Reshaped figures), [the Reshaped RFC](https://github.com/storybookjs/ds-mcp-experiment-reshaped/discussions/1), [storybookjs/mcp](https://github.com/storybookjs/mcp) (archived 14 October 2026).
- [react-scanner](https://github.com/moroshko/react-scanner); [Fluent AGENTS.md](https://github.com/microsoft/fluentui/blob/master/AGENTS.md); [Brad Frost, skills](https://github.com/bradfrost/skills).

### Commentary and community

- [Christine Vallaure, *AI prototyping inside your design system*](https://christinevallaure.substack.com/p/ai-prototyping-inside-your-design) (3 November 2026, part 2 of 3).

- [Builder.io blog, React and Material UI with AI](https://www.builder.io/blog/react-material-ui-ai) (vendor blog, the only source for Builder's MUI support).
- [Figma forum, sharing a prototype without sign-in](https://forum.figma.com/t/sharing-a-prototype-without-having-user-required-to-sign-in-to-figma/40423/31).
- [Divriots, powering Google Stitch's export](https://divriots.com/blog/divriots-powers-google-stitch-export-feature).

### Project records for the appendix (private repositories, not linkable; read 14 October 2026)

- Blackbook project file: `package.json`.
- Blackbook project file: `.storybook/main.ts`.
- Blackbook project file: `AGENTS.md`.
- Blackbook project file: `src/screens/contacts-list/contacts-list.stories.tsx`.
- Blackbook project context document.
- Suiteify project file: `pnpm-workspace.yaml`.
- Suiteify project file: `apps/storybook/package.json`.
- Suiteify project file: `packages/design-system/package.json`.
- Suiteify project context document.
