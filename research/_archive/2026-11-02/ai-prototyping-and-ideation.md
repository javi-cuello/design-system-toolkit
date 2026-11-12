# AI prototyping and ideation from a real design system

Which tools can build multi-screen prototype flows from a project's real coded components, which can generate design concepts from its Figma library, and how each result reaches a non-technical reviewer as a link. Written for a design-systems lead running several projects at once, two of them in detail: Project B (Next.js 16, React 19, plain SCSS generated from Figma, Storybook 10 with the Storybook MCP addon) and Project A (a Material UI 9 wrapper library in a read-only monorepo, Storybook 10, published to a private npm feed).

Researched October 2026. Vendor mechanics were read from primary sources only: Figma's help centre and MCP developer docs, Storybook's AI and testing docs, Chromatic's docs and pricing, Vercel's deployment-protection docs, v0's two design-system guides, the shadcn registry spec, Lovable's and Bolt's support docs, UXPin's docs and changelog, Anima's and Builder.io's docs, Magic Patterns' docs, Anthropic's Claude Design and artifacts docs, and the README, source and releases of Southleft's Story UI and Figma Console MCP. The two projects were read from their own repositories and context documents as they stood on 14 October 2026. No tool was run hands-on for this guide; where a claim rests on a vendor's marketing page rather than its documentation, or where two of a vendor's own pages disagree, the text says so.

---

## What this answers

The question usually arrives as "which AI prototyping tool should we use?" and turns out to be several:

- Are prototyping from code and ideating from Figma one job or two?
- What does "built from real components" mean, and how can a team tell a real component from a lookalike?
- Can Storybook itself carry a multi-screen prototype with modals and form steps?
- Which AI tools write those flows using the project's own components?
- How does a Storybook prototype reach someone who has never heard of Storybook?
- Do v0, Lovable, Bolt and Magic Patterns use a team's real components?
- Is UXPin Merge, now with Wire and Forge, worth adopting for coded flows?
- What does Figma Make actually take from a team's design system?
- Can an agent draw new screens in Figma with the team's own library?
- Where do Claude Design and Claude artifacts fit?
- What about Anima, Builder.io, Tempo, Plasmic and the rest?
- What should Project B and Project A each do?

Section 13 is the cheat sheet. Section 14 is the short version, written to stand alone.

### Index

- [1. One job or two?](#1-are-prototyping-from-code-and-ideating-from-figma-one-job-or-two) · [2. Real or lookalike?](#2-what-does-built-from-real-components-mean-and-how-can-a-team-tell) · [3. Storybook as the prototype](#3-can-storybook-itself-carry-a-multi-screen-prototype) · [4. AI that writes the flows](#4-which-ai-tools-write-those-flows-with-the-projects-own-components) · [5. Sharing a Storybook](#5-how-does-a-storybook-prototype-reach-a-non-technical-reviewer)
- [6. Hosted app builders](#6-do-v0-lovable-bolt-and-magic-patterns-use-a-teams-real-components) · [7. UXPin Merge](#7-is-uxpin-merge-worth-adopting-for-coded-flows) · [8. Figma Make](#8-what-does-figma-make-actually-take-from-a-teams-design-system) · [9. Agents drawing in Figma](#9-can-an-agent-draw-new-screens-in-figma-with-the-teams-own-library) · [10. Claude Design and artifacts](#10-where-do-claude-design-and-claude-artifacts-fit) · [11. The rest](#11-what-about-anima-builderio-tempo-plasmic-and-the-rest)
- [12. Project B and Project A](#12-what-should-project-b-and-project-a-each-do) · [13. Cheat sheet](#13-cheat-sheet) · [14. The short version](#14-the-short-version) · [15. What to re-check later](#15-what-to-re-check-later) · [Sources](#sources)

---

## 1. Are prototyping from code and ideating from Figma one job or two?

**The short answer.** Two, and they want different tools. A prototype flow is a question about behaviour, answered best by the components that will ship. Ideation is a question about direction, answered best by something fast and cheap to throw away. No tool surveyed does both well for a custom library, and the ones that claim to do both usually do the second well and the first with lookalikes.

The difference is in what each job is for. A prototype flow (sign-up in three steps, a filter dialog over a list, an empty state turning into a populated one) is shown to people so they can react to how the product will behave. If the button in the prototype is not the button in the product, the reaction is to the wrong thing: the spacing, the focus ring, the disabled state and the error message all differ in small ways that matter to exactly the people being asked. That pushes the prototype toward the coded components, rendered in a browser, because nothing else behaves like them.

Ideation is the opposite trade. A concept for a new dashboard, three layouts for an onboarding screen, a "what if the sidebar were a command bar" are worth generating in bulk and discarding most of. They need to look like the product so the idea is judged fairly, but they do not need to behave like it. For a team whose design happens in Figma, as Project B's does by rule, the natural home for those concepts is the Figma file, built from the published library, where a designer can pick one up and continue.

The tool market blurs the line because the same generator can emit either. Figma Make writes running React; UXPin Forge generates screens and UXPin Wire turns them into flows; Claude Design produces both concepts and clickable prototypes. Sections 6 to 10 show that the blur is mostly in the marketing. What decides which job a tool can do is the question in section 2: does its output import the real components, or draw something that resembles them?

**What to do.** Treat the two capabilities as separate decisions with separate tools. Choose the prototype tool for fidelity to the coded components and for how easily a reviewer opens it. Choose the ideation tool for speed, for staying inside the Figma library, and for how easily a designer continues the work. Accept that a tool which does both is a bonus, not the selection criterion.

---

## 2. What does "built from real components" mean, and how can a team tell?

**The short answer.** Three different things are sold under the phrase. Real components means the output imports the team's own package and renders it. Regenerated components means the tool read the library and wrote new code that copies it. Styled lookalikes means the tool took the tokens (colours, type, spacing) and drew generic components in them. Only the first stays correct when the library changes.

The distinction is visible in the vendors' own documentation once it is looked for:

| Level | What the output contains | Example from the docs | What breaks it |
|---|---|---|---|
| Real components | `import { Button } from '@team/design-system'`, rendering the real package | v0's newer design-system flow, which builds from an installable package and refuses any component, prop or token it cannot verify in the sources; Story UI, which checks every prop against the component's real type; UXPin Merge; Magic Patterns' npm route | nothing the library does; this is the goal |
| Regenerated copies | component source copied or rewritten into the generated project | Lovable's design systems, which copy components into `src/design-system/<slug>/` and overwrite local edits on update; Bolt, which generates "a Storybook inside Bolt" from the imported system | the next library release, until someone re-imports |
| Styled lookalikes | generic components painted with the team's tokens | Figma Make kits, which turn a subset of library variables into a global CSS file of raw values; Anima, whose Figma design-system import produces a generated Storybook styled from Figma variables; Google Stitch | any component whose behaviour or structure, not colour, is the point |

The causal reason for the gap is that most hosted generators were trained on, and built around, one stack. v0's legacy guide says plainly that v0 is trained on the default shadcn/ui implementations; its newer guide warns that the default Next.js, shadcn and Tailwind starter may conflict with a design system that brings its own components, styles or providers. Material UI (Emotion styling, a ThemeProvider at the root) and Project B's generated SCSS are both outside that default, so any tool's design-system claim has to be tested against the actual library before it is believed. None of v0, Lovable, Bolt or Magic Patterns names MUI anywhere in its design-system documentation.

A quick test separates the three levels in minutes: open the generated code and look at the imports. If the button comes from the team's package, it is real. If it comes from a local folder the tool created, it is a copy. If it is a `<button>` with a class name and hex values, it is a lookalike. A second test is to change a token or a prop default in the library and regenerate: real components pick the change up, copies and lookalikes do not.

**What to do.** For prototype flows, accept only the first level; a regenerated copy is a fork that starts drifting on the day it is made. For ideation, the third level is acceptable for early concepts and the first is better, because a concept built from real parts can be handed over without being redrawn. Run the import test on any tool before adopting it; it takes less time than reading its marketing page.

---

## 3. Can Storybook itself carry a multi-screen prototype?

**The short answer.** Yes, and for a team that already keeps its components in Storybook it is the most faithful and cheapest option. Storybook has every mechanism a click-through flow needs: state inside a story, links between stories, scripted interactions, module and network mocking, and router mocks for Next.js. What it lacks is a designer-facing canvas; a flow is written as code.

A prototype in Storybook is a story that renders a whole screen, or a sequence of screens, from the project's own components with fixture data. Project B already works this way for its screens: `src/screens/contacts-list/contacts-list.stories.tsx` holds a story per state (`Default`, `Details`, `AddBadge`, `Filter`, `FilterResults`, `FilterNoResults`, `Search` and others), each rendering the real screen component with fixtures. That is a state catalogue, which is most of a prototype already. Turning it into a flow takes one of four mechanisms, all documented and all current in Storybook 10:

- **State inside the story.** A flow story renders a small wrapper that holds the current step in `useState` and swaps screens on the real components' events: submit on step one shows step two, the "Add badge" button opens the real dialog. This is ordinary React and needs no addon.
- **Links between stories.** `@storybook/addon-links` (10.6.2, current) provides `linkTo('Title', 'Story')` as an `onClick` handler and a `LinkTo` component, so separate screen stories can be chained into a click-through without a wrapper.
- **Play functions.** A play function runs after the story renders and can type, click and group steps with `step()`; the Interactions panel can pause, rewind and step through them, and modals rendered outside the canvas are reached through `screen`. Stories can reuse each other's play functions, so "open filter, choose two options, apply" can be a story a reviewer watches rather than performs.
- **Mocking.** `sb.mock`, shipped in Storybook 9.1, replaces modules from `.storybook/preview.ts` (no factory functions, extensions required); `msw-storybook-addon` 3.0.3 mocks network requests and supports Storybook 9 to 11. For Next.js, the `nextjs-vite` framework mocks the app router (`parameters.nextjs.appDirectory: true`) and exposes `getRouter()` to observe `push` and `back`, so a flow that navigates between routes can run inside one story.

The advantages are fidelity and cost. Every pixel and every behaviour is the shipping one, because it is the shipping code; the prototype costs nothing beyond the Storybook the project already runs; and a prototype that wins can become the real screen with no translation. In Project B's case it would also be measured by the same parity loop as everything else.

The disadvantages are real too. A flow is code, so a designer who does not write React depends on an engineer or an agent to make one. Storybook's chrome (sidebar, toolbar, addon panels) is unfamiliar to a non-technical reviewer, although a single story can be opened full screen through its iframe URL. And a flow that depends on server data needs fixtures or mocks for every state, which is work, though Project B's screens already carry `fixtures.ts` files.

**What to do.** Use Storybook as the prototype surface for any project whose components already live there. Write each flow as one story with local state (or a few stories joined with `linkTo`), reuse the screen stories' fixtures, and add a play function where a reviewer should watch a sequence rather than click it. Keep flow stories in a clearly named group (for example `Prototypes/`) so they are not mistaken for component documentation.

---

## 4. Which AI tools write those flows with the project's own components?

**The short answer.** Claude Code (or any coding agent) working in the repository, with Storybook's MCP addon for context, writes them most reliably today. Southleft's Story UI adds a designer-facing prompt box inside Storybook that generates whole screens from the real components and checks its own output, but it does not document writing multi-step flows or play functions, so flows still need an agent or a person to wire.

**Storybook's MCP addon.** `@storybook/addon-mcp` (10.6.2, moved into the Storybook monorepo at 10.6.0) serves an MCP endpoint at `/mcp` on the dev server. Its development tools give an agent instructions for writing stories (including interaction tests), find stories by component, and return preview links; its testing tool runs stories and reports accessibility results so the agent can fix its own errors; its docs tools list and show component documentation, which needs the component manifest switched on (`features: { componentsManifest: true }`, off by default). Storybook labels all of this a preview whose API may change. It is not React-only. What it does is make an agent write correct stories for existing components; Storybook's AI docs do not mention prototyping or screen generation, so it is context, not a generator. Project B already has it installed.

**Story UI.** Story UI is an MIT-licensed tool by Southleft (234 stars; v5.21.2 released 25 September 2026; version 5 within fifteen months of the first commit, so its API moves quickly). It adds a workspace inside Storybook 10 where a person describes a screen ("a settings page with a sidebar and a sticky save bar") and it writes a `.stories.tsx` file into `src/stories/generated/`, composed from the project's components. It runs a local Node server and calls Anthropic, OpenAI or Gemini with the project's own key, and it also exposes an MCP server with eight tools (generate, update, list, get and delete stories, list components, get component props) so a coding agent can drive it.

Three properties make it relevant here. It discovers components from package type declarations, local source and the Storybook index, and its README states that it cannot invent a component the project does not own and that every prop is checked against the component's real type; that is the first level in section 2. Its `init` has an explicit Material UI preset that wires in the ThemeProvider, and Southleft develops it against MUI's package shape. And it verifies each story: it renders it in Playwright, measures overflow and layout, clicks each control to see that something changes, and asks a vision model whether the screenshot is shippable, regenerating what fails. Versions are kept with a diff view, and a "hand it off" action commits the story to a branch and can open a pull request.

Its limits for this job are specific. The generator accepts `useState`, so a generated screen can hold local state, but nothing in the README or source describes writing play functions or linking screens into a flow, and when an attachment shows several screens the prompt asks for separate stories. Its hosted mode (`story-ui deploy` to Railway, Render or Fly) runs Storybook in dev mode behind Story UI's server and gates it with a token in the URL, which suits a team generating together, not a reviewer clicking through; the reviewer path is to commit the generated story and publish the static Storybook as in section 5. Whether it handles a wrapper library such as Project A's (MUI underneath, the project's own exports on top) rather than raw `@mui/material` is untested; its local-source discovery suggests it would.

| | Claude Code with Storybook MCP | Story UI |
|---|---|---|
| Who drives it | an engineer or designer comfortable in a terminal | anyone with the Storybook open locally |
| Uses real components | yes, by reading the repo and the manifest | yes, by discovery and type checking |
| Multi-step flows, play functions | yes, written like any code | not documented |
| Self-check | the addon's test tool, plus the project's own checks | Playwright render, interaction probe, vision review |
| Output | any file, reviewed as a diff | a story file, handed off as a branch or pull request |
| Maturity | preview API | fast-moving 5.x |

**What to do.** Use a coding agent with the Storybook MCP addon as the default author of prototype flows; it is already installed in Project B and free to add elsewhere. Trial Story UI where a designer wants to generate screens without a terminal, and treat its output as screens that an agent or engineer then wires into a flow. Turn on the component manifest so the docs tools have something to read.

---

## 5. How does a Storybook prototype reach a non-technical reviewer?

**The short answer.** Publish the Storybook to Chromatic and set its visibility to public: every branch gets a stable link that anyone can open without signing in, on the free plan. For a link that must stay private, Chromatic's external collaborators or a password-protected static host cost money or a sign-up; Vercel's free Shareable Links are the cheapest private option.

**Chromatic.** Chromatic, made by Storybook's maintainers, publishes each build at a permalink of the form `https://<branch>--<appid>.chromatic.com`, which always shows the latest build of that branch, and a commit-pinned form for a fixed version. Published Storybooks are private by default and viewers must sign in with access to the project; switching the Storybook's visibility to public lets anyone with the link view it without signing in, while the library, tests and settings stay private. Private sharing works through collaborators with Owner, Developer, Reviewer or Viewer roles, including external collaborators limited to one project, which suits a product manager or client contact who is willing to create an account. Chromatic's UI Review adds comment threads per snapshot. The free plan includes 5,000 snapshots a month (Starter is $179 a month for 35,000); projects and collaborators are unlimited on every plan. Whether publishing alone, without visual tests, consumes snapshots was not found in the docs. Project B already has the `@chromatic-com/storybook` addon installed. Chromatic also publishes the Storybook MCP docs server alongside the Storybook, private when the Storybook is private, which lets agents outside the repo read the library.

**Vercel and other static hosts.** A built Storybook is static files, so any host serves it. Vercel gives every branch and pull request a preview URL. Its Deployment Protection decides who can open it: Vercel Authentication sends visitors to a Vercel login, while Shareable Links (available on all plans, one link per account on Hobby) add a query-string bypass that lets anyone with the link view. Password Protection costs $20 a month per protected project on Pro and is not available on Hobby. Vercel's preview comments are free on all plans but require every commenter to have a Vercel account. Netlify's site password needs a Pro or Enterprise plan; private GitHub Pages needs GitHub Enterprise Cloud and repository read access for every viewer, which rules it out for outside reviewers.

| Route | Viewer needs an account | Private | Cost | Comments |
|---|---|---|---|---|
| Chromatic, public visibility | no | no (anyone with the link) | free plan | UI Review, for signed-in collaborators |
| Chromatic, collaborators | yes | yes | free plan | yes |
| Vercel preview with Shareable Link | no | by unguessable link | free on all plans | Vercel account needed |
| Vercel with password | no | yes | Pro seat plus $20 a month per project | Vercel account needed |
| Netlify with password | no | yes | Pro plan | no |
| GitHub Pages, private | yes, with repo access | yes | Enterprise Cloud | no |

The reviewer experience is the remaining problem. A Storybook link opens on Storybook's own interface, which a non-technical person reads as a developer tool. Linking straight to a story's full-screen view (Storybook's iframe URL for that story, or the "open in new tab" view) removes the chrome and shows only the prototype. That works identically on Chromatic and on any static host.

**What to do.** Publish prototype Storybooks to Chromatic with public visibility when the work is not confidential, and send reviewers the branch permalink pointing at the flow story's full-screen view. When the work must stay private, add the reviewer as a Chromatic Viewer if they will sign up, or host the build on Vercel behind a Shareable Link if they will not. Keep the prototype in its own branch so the permalink tracks it.

---

## 6. Do v0, Lovable, Bolt and Magic Patterns use a team's real components?

**The short answer.** Partly, and only on the right plan. v0's newer design-system import and Magic Patterns' npm route render the team's actual installed package; Lovable copies components into each project, or wraps a real package only on Enterprise; Bolt's docs do not say whether generated apps import the real package. None names MUI, and all are built around Tailwind and shadcn, so for Project B and Project A each would have to be proven with a test import first.

These four are hosted app builders: a prompt produces a running React app, deployed to a link. Their appeal for prototyping is that the result is real software a reviewer opens in a browser, with real navigation and state. Their weakness is the one in section 2: their defaults are Tailwind and shadcn, and a library outside that default is a guest.

**v0.** v0 has two design-system routes. The older one goes through a shadcn registry and an "Open in v0" button; it is Tailwind-based, and the registry must sit at a public URL (token-in-query only) without the `cssVars`, `css` or `envVars` features. The newer route imports from a Design Systems page, taking GitHub repositories, Figma frames, Storybook or docs links, and ZIP or tarball uploads, with an installable package (public or private npm, a tarball, or a folder with its own `package.json`) as the source of truth. v0 builds a starter app for review, saves the system as a `SKILL.md`, and points at up to three read-only GitHub sources; its rule is that a component, prop or token it cannot verify in those sources is not used. Private npm works through a team-level `NPM_TOKEN`. Projects publish to Vercel deployments, so the sharing in section 5 applies. Plans run from Free to Plus ($30 per user a month) and Business ($100); the pricing page does not say which plan includes design-system import.

**Lovable.** A Lovable design system is a dedicated project reused across a workspace, available on paid plans. Its components are copied into each consuming project and replaced on the next update; wrapping an existing npm package instead is Enterprise-only. Private Git repositories cannot be imported, only uploaded. Published apps are public or invite-only (viewers log in), with no password option. Lovable's FAQ contradicts itself on importing an existing repository.

**Bolt.** Bolt imports a design system on its Teams plan ($30 per member a month), from files, public docs, public GitHub, a published Storybook URL or npm packages (private registries with a token), limited to ten imports or syncs per team a week, and uses them to generate a Storybook inside Bolt. Whether generated apps then import the real package or regenerated components is not stated.

**Magic Patterns.** Magic Patterns renders the team's actual package from public npm, private npm, GitHub Packages or a tarball, with Storybook or an MCP server supplying documentation. Setup is by onboarding call, not self-serve, and pricing was not published in a form that could be read.

The shared advantage is a running app at a link with no repository work, which a product manager can open and a designer can iterate on by chat. The shared disadvantages are that the generated app lives outside the team's repository (v0 can sync to GitHub through pull requests; the others export or push one way), so a winning prototype is rebuilt rather than merged; that their starters assume Tailwind and shadcn, which Project B rejected by recorded decision; and that MUI's Emotion and ThemeProvider setup is undocumented in all four.

**What to do.** Do not adopt a hosted app builder as the prototype tool for either project on the strength of its documentation. If one is trialled, trial v0's newer design-system import with Project A's published package, because it is the only self-serve route that documents rendering the real package and refusing anything unverified, and run the import test from section 2 on the first screen it produces. Use Shareable Links or password protection from section 5 for the result.

---

## 7. Is UXPin Merge worth adopting for coded flows?

**The short answer.** It is the only tool surveyed that puts a team's own coded React components on a visual canvas for designers and turns them into flows with navigation, validation and state, published as a hosted link. That makes it the strongest fit for designer-built flows. The cost is a second platform, an integration that assumes webpack, and the Git route (the one suited to an internal library) on Enterprise pricing.

UXPin Merge imports real React components three ways: from Git (built with the team's webpack configuration, props read from TypeScript types or prop-types, pushed with `@uxpin/merge-cli`, whose latest release dates from October 2025), from a published Storybook (Storybook 6 or later, stories written with args, a Vite base-path setting required), or from npm. UXPin also documents a route where Claude Code writes the Merge wrappers, presets and tests for a package without modifying the source library. MUI ships as a built-in library, and UXPin added MUI 9 support on 28 August 2026; that built-in library is stock MUI, not a team's themed wrapper.

Two 2026 additions change what it does. **Wire**, launched 26 June 2026, links screens built from Merge code components into a flow with real navigation, form validation and state management, and publishes it as a hosted link that UXPin says anyone can open in a browser, or exports a Vite and React codebase. Wire works only with code components from one library at a time and does not accept UXPin's native drawing elements. **Forge** generates screens from prompts, images or URLs using MUI, Ant Design, shadcn or a custom Merge library, so it can generate with the team's own components; its docs say it does not build advanced interaction logic or multi-step flows, which is what Wire is for.

| Plan | Price per seat a month (annual / monthly) | Relevant inclusions |
|---|---|---|
| Core | $29 / $49 | built-in MUI in full, conditional logic, password-protected preview |
| Growth | $40 / $69 | Storybook integration, design systems |
| Enterprise | custom | Git integration, custom-library AI |

The advantages are that designers build flows with the real components without writing code, that the result is a hosted link with logic, and that a flow exports as runnable code. The disadvantages: neither React 19 nor Storybook 10 compatibility is documented; Git integration assumes a webpack build, which neither project uses (both are Vite); the Storybook route is the realistic one for a mid-tier plan and depends on Storybook's args being complete; whether Wire's link can be password-protected, which plan includes Wire, and whether viewers need an account are not stated; and it adds a platform that holds a copy of the library which must be re-pushed on every release.

**What to do.** Consider UXPin Merge with Wire only if designers who do not write code need to build flows themselves, often enough to justify a seat each. If so, trial the Storybook integration with Project A's published Storybook on the Growth plan, confirm React 19 rendering and Wire's sharing on a real flow, and only then talk to UXPin about Enterprise. Otherwise the Storybook route in sections 3 to 5 gives the same fidelity for the cost of an agent session.

---

## 8. What does Figma Make actually take from a team's design system?

**The short answer.** Tokens and styles from the published Figma library, guidelines written as markdown, and coded components only if they arrive as an npm package. The library's components are not used: Make turns a subset of the library's variables into a global CSS file of raw values. So Make with a library alone produces styled lookalikes, and Make with the team's npm package can produce real components, provided the package builds under Make's Vite setup.

Figma Make generates a running React app from a prompt inside Figma. Since April 2026 a **Make kit** bundles three kinds of context: npm packages, which tell Make which components, styles and tokens to use; variables and styles from published Figma Design libraries; and markdown guidelines on how to apply them. Figma's own help page says the library route pulls a subset of the variables into a global CSS file with raw values, a simplified version of the full library. Kits are for Full seats on paid plans, and organisation admins can approve kits and enable them by default.

The npm route has conditions. The package must build with Vite and carry no workspace dependencies; public packages come from the npm registry, and private packages go through a Figma-hosted registry available only on Organization and Enterprise plans. MUI and Emotion are not mentioned, so a themed MUI wrapper is unproven.

Sharing is Make's strongest point. Publishing gives a public `*.figma.site` URL, optionally password-protected (a forum post suggests passwords are limited to Organization and Enterprise; the help page does not say), and Organization and Enterprise plans can restrict viewers to signed-in members. Code leaves Make as a downloaded ZIP, a one-way push to a new GitHub repository Make creates, or, in a closed Mac-only beta, as pull requests against an existing repository. A Full seat costs $16 a month on Professional, $55 on Organization and $90 on Enterprise, with 3,000, 3,500 and 4,250 monthly AI credits respectively.

The advantages are speed, a link anyone can open, and staying inside the tool designers already use. The disadvantages are that a library-only kit is the third level in section 2, so a prototype's components look right and behave generically; that the real-component route needs a Vite-buildable package and, for a private one, an Organization plan; and that the code it writes lives in its own repository, so a winning concept is rebuilt rather than merged.

**What to do.** Use Figma Make for ideation where a clickable concept helps, with a kit carrying the project's library variables and written guidelines, and judge its output as concepts, not as flows. Do not rely on it for fidelity prototypes unless the team's package loads in it; for Project A that needs the Organization plan's private registry and a test that the MUI wrapper builds.

---

## 9. Can an agent draw new screens in Figma with the team's own library?

**The short answer.** Yes, with two caveats: the official Figma MCP server's `use_figma` tool is in beta, and neither it nor Southleft's Figma Console MCP produces a good design without a person directing it. Both can place real library component instances on a page, which makes this the strongest ideation route for a Figma-first team: the concepts are made of the library, sit in the Figma file, and can be shared as a Figma prototype link.

**Figma's MCP server, write to canvas.** `use_figma` lets an agent (Claude Code, Claude Desktop, Cursor, Codex and others) run Figma Plugin API code against a file, creating frames, components, variables and auto layout. Figma's help centre says agents build with the existing design system, using its components, variables and tokens, and its developer docs advise naming the libraries, components, variables or modes to use, adding that the best results come from matching what already exists in the file. It needs a Full seat to write outside drafts. Limits are a 20 KB response per call, no images or video, and no custom fonts. Figma calls the output beta quality that may need manual review, and the feature is free during the beta and will become usage-based. A separate tool, `generate_figma_design` (Code to Canvas), captures a running app into Figma as flat layers with no library connection; it is useful for getting a coded screen into Figma as a reference, not for ideation with the library.

**Figma Console MCP.** Southleft's open-source server (MIT, v1.40.9) works through a Desktop Bridge plugin in the Figma desktop app and exposes 121 tools locally. `figma_search_components` finds library components and `figma_instantiate_component` places them with properties set, while `figma_execute` runs arbitrary Plugin API code. Because it runs the Plugin API, and that API documents setting prototype reactions (a trigger plus a list of actions) on nodes, an agent should be able to wire prototype connections between frames and produce a clickable Figma flow, not only static frames; the same applies to `use_figma`, and neither was tested for this guide. It needs the desktop app, the bridge plugin and a personal access token. The toolkit already uses it for audits and scripted work.

**Figma's own AI.** First Draft cannot generate designs from a team's own design system; it uses libraries Figma built. The newer Figma agent in design files can attach any library available in the file to the chat, mention components and edit instances, with prototyping and interactions marked as coming soon. Figma's help pages disagree on whether it is in beta and whether it consumes AI credits.

**Sharing.** A Figma prototype shared with "Anyone" access reaches people outside the organisation; a prototype-only link and password protection need a paid plan, and an organisation admin can disable public links. Figma's help centre does not state that a viewer without a Figma account can open the link; community answers from Figma staff say "anyone with the link" or link plus password works without signing in, and users report occasional login prompts.

The advantages are that the concepts are made of the real library (instances, variables, text styles), that they live where the designers work, and that a promising one is already a Figma design rather than something to redraw. The disadvantages are that the output is beta quality and needs a designer's pass, that a 20 KB response limit pushes the agent into small steps, that images and custom fonts are unsupported in `use_figma`, and that an agent composing screens writes good layouts only when told which components and patterns to use.

**What to do.** Make this the default ideation route for every project with a published Figma library. Have the agent compose concepts on a sanctioned scratch page of the project's screens file from library instances only, give it the project's context document and the component list as instructions, and ask it to wire prototype connections when a flow is the point. Share the result as a Figma prototype link with "Anyone" access and a password, and test the link logged out before sending it.

---

## 10. Where do Claude Design and Claude artifacts fit?

**The short answer.** Claude Design is a capable ideation tool that can learn a design system from Figma files or, through Claude Code, from the codebase, but whether its output renders the real components is undocumented and its sharing is scoped to the organisation. Claude artifacts give a public link with no sign-in from Claude Code, but they load scripts only from public CDNs, so a private component library reaches them only if it is bundled into the page.

**Claude Design.** Anthropic announced Claude Design on 17 April 2026 as a research preview; it now runs as an artifact template in Claude, and the standalone `claude.ai/design` closes on 14 December 2026. It builds a design system from source material: from chat (connected apps, uploaded files, Figma files, decks, logos, fonts), from a linked codebase, or from Claude Code with `/design-sync`, which Anthropic says reads tokens and components directly and works best for product design systems in code. Design systems are a beta on Pro, Max, Team and Enterprise. Anthropic's example prompt is a four-screen onboarding flow, and output exports as ZIP, PDF, PPTX, Google Slides or HTML, or goes to Canva, Vercel or Wix, with `/design` handing a design to Claude Code. Sharing is view, comment or edit within the organisation; no public link is documented.

The advantages are breadth (concepts, flows and slides from one system) and an import path from both Figma and code. The disadvantages for this brief are that "easy to share by link with non-technical people" fails for anyone outside the organisation, that its output is not documented as importing the real components (so it should be treated as the regenerated or lookalike level until tested), and that it is a preview whose surface changed twice in six months.

**Claude artifacts.** An artifact is a single HTML page hosted on claude.ai. Anthropic's Claude Code docs say a public artifact link can be opened by anyone with no claude.ai sign-in, off by default on Team and Enterprise until an owner enables it; the claude.ai help page says everyone needs an account except for legacy artifacts published from a chat, so the two pages disagree. Pages are capped at 16 MiB with no backend, and scripts load only from cdnjs, unpkg, jsDelivr's npm path and two other CDNs. MUI is available as a CDN build (an ESM build on jsDelivr), but a private package such as Project A's is not, and Project B's components are not a package at all. A prototype built with Vite and inlined into one HTML file would carry the real components inside the page, which the size limit allows; that route is untested.

**What to do.** Use Claude Design for quick concepts and presentation material inside the organisation, and run `/design-sync` from the project repository rather than describing the system by hand. Do not use it, or artifacts, as the channel for prototypes that outside reviewers must open, until a hands-on test confirms real components and account-free viewing.

---

## 11. What about Anima, Builder.io, Tempo, Plasmic and the rest?

**The short answer.** None beats the routes above for these two needs. Anima produces Figma lookalikes; Builder.io generates code with a team's components in its repository but does not build prototypes from them on a canvas; Tempo and Plasmic render real components but are app builders without a reviewer-friendly sharing story for this use.

- **Anima.** Its design-system import is Figma-only: selected Figma components become a generated Storybook in an Anima Playground, styled from Figma variables. Code export can emit generic `@mui/material` code; reusing a team's own components and theme was the job of a VS Code extension now marked legacy, and agent access to a code library may need an Enterprise setup. Multi-screen flows come from Figma prototype links, and publishing gives an `animaapp.io` URL or custom domain. Lookalike level.
- **Builder.io (Visual Copilot and Fusion, now branded "Code").** It uses a connected repository, its components and patterns as context, imports Figma designs using those components (with `.mapper.tsx` mappings), and ships changes as branches and pull requests. Its Design System Intelligence indexing is listed under Enterprise on the pricing page while a docs page says the UI route is open on all plans. MUI support rests on a blog post, not the docs. Previews share with workspace members, with external sharing and password protection (Team, $40 per user a month, though another page says Pro). It is a code generator for the product, not a prototyping canvas.
- **Tempo.** Its canvas frames are live iframes of real routes and components from the team's own dev server, and edits write back to source; the web editor was retired on 14 June 2026 in favour of a desktop app, and no hosted reviewer link is documented.
- **Plasmic.** Renders real code components through an app-host page in the team's React app; a page builder rather than a flow prototyping tool.
- **Excluded on their own docs.** Subframe builds on its own Radix-based core and imports code by manual paste; Google Stitch generates new designs from a URL or a DESIGN.md file, not from a team's components; Framer's npm import is experimental; Onlook focuses on Next.js with Tailwind, with its hosted product in early access; Penpot has no React component import that could be found.

**What to do.** Leave these out of both workflows. Revisit Builder.io only if the goal moves from prototyping to generating production code from Figma, and Tempo only if it ships a hosted share link.

---

## 12. What should Project B and Project A each do?

**The short answer.** For prototype flows: Storybook flow stories written by Claude Code with the Storybook MCP addon, published to Chromatic with public visibility, for both projects; Project A's live in a small separate repository because its clone is read-only. For ideation: an agent composing concepts in Figma from the project's published library, through Figma Console MCP or the official `use_figma`, shared as a Figma prototype link; Figma Make with a kit for clickable concepts when a running app helps.

### Project B

The project's facts decide most of this. Its components and screens live in `src/design-system` and `src/screens` with a story for each screen state and fixture files, its Storybook 10 already has `@storybook/addon-mcp` and `@chromatic-com/storybook`, its design happens in Figma by rule, every commit to `main` deploys to production with no preview step, and Tailwind and shadcn were tried and reverted by recorded decision.

- **Prototype flows.** Write each flow as a story in a `Prototypes/` group that composes the existing screen components with local state, reusing the screens' fixtures, with a play function where a sequence should be watched. Claude Code with the MCP addon writes them; switching on the component manifest lets its docs tools read the library. Publish the Storybook to Chromatic (the addon is already in place) with public visibility, and send the branch permalink to the flow story's full-screen view. A Vercel preview of a `/prototype` route is the wrong channel here, because the project has no preview step and a route merged to `main` ships to production. Hosted app builders are ruled out by their Tailwind and shadcn starters and by the components not being a package.
- **Ideation.** Compose concepts on the screens file's scratch page from library instances through Figma Console MCP (already the toolkit's bridge) or `use_figma`, with the context document as instructions and prototype connections for flows, and share the Figma prototype link with a password. A Make kit with the UI library's variables and guidelines gives clickable concepts as a second route; its components will be lookalikes, which is acceptable for concepts.

### Project A

Project A's code is a read-only clone that the toolkit must not write to; its library `@project-a/design-system` (MUI 9, MUI X Pro and Premium, Storybook 10 with `react-vite`) is published to a private Azure Artifacts npm feed, and its Figma side is a Foundations file and two component libraries (Web and Mobile).

- **Prototype flows.** Create a small prototype repository outside the clone with its own Storybook 10, installing the published `@project-a/design-system` from the private feed with a read token, and write flow stories there exactly as for Project B; add the Storybook MCP addon so the agent reads the library. Publish to Chromatic with public visibility for non-confidential work, or invite reviewers as Viewers. This keeps the prototypes on the real package and on its released versions, which is what a reviewer should see. The second option, if designers must build flows without code, is UXPin Merge with Wire through the Storybook integration (Growth plan), after a trial confirms React 19 and MUI 9 rendering and Wire's sharing. Story UI's MUI preset makes it a reasonable trial for designer-generated screens in the prototype repository.
- **Ideation.** Compose concepts from the Web library through Figma Console MCP or `use_figma` on a scratch page of a consuming file, shared as a Figma prototype link. Figma Make can take the Web library's variables and guidelines today; using the real package in Make needs the Organization plan's private registry and a test that the wrapper builds under Make's Vite setup, and v0's newer design-system import is the one hosted builder worth a trial with the same package.

**What to do.** Start with the routes that need no new platform and no new spend: flow stories plus Chromatic, and agent-composed Figma concepts. Run the section 2 import test on any additional tool before it touches either project, and add UXPin or Figma Make with the real package only when a measured gap (designers blocked on engineers, reviewers wanting a running app) justifies the seat cost.

---

## 13. Cheat sheet

| Tool | Job | Real components? | Flows and state | Sharing for non-technical viewers | Cost to use for this | MUI / custom React | Maturity |
|---|---|---|---|---|---|---|---|
| Storybook flow stories | prototype | yes, the shipping code | full (state, links, play, mocks, router) | via host below | free | both | stable |
| Claude Code + Storybook MCP addon | writes prototypes | yes | full | via host below | agent usage | both | addon in preview |
| Story UI | generates screens | yes, type-checked | local state; no documented flows or play functions | token link in dev mode, or publish the story | free, own model key | MUI preset; local source | 5.x, fast-moving |
| Chromatic | host | n/a | n/a | public link with no sign-in, or invited collaborators | free plan, 5,000 snapshots | n/a | stable |
| Vercel previews | host | n/a | n/a | Shareable Link free; password $20 a month per project on Pro | free to Pro | n/a | stable |
| v0 (new design-system import) | app builder | yes, from a package (documented) | full app | Vercel deployments | Plus $30 or Business $100 per user | MUI not named | 2026 feature |
| Lovable | app builder | copies; package wrapper on Enterprise | full app | public or invite-only, no password | paid plans; Enterprise for packages | MUI not named | GA |
| Bolt | app builder | unstated | full app | site sharing | Teams $30 per member | MUI not named | GA |
| Magic Patterns | app builder | yes, from a package | full app | not established | by onboarding call | MUI not named | onboarding only |
| UXPin Merge + Wire | designer canvas, flows | yes, via Git, Storybook or npm | navigation, validation, state, logic | hosted link; password on Core and Growth previews | $29 to $69 per seat; Git on Enterprise | MUI 9 built in; custom via Storybook or Git | Wire since June 2026 |
| Figma Make + kit | ideation, clickable concepts | lookalikes from library; real only via npm package | full app | `figma.site` link, optional password | Full seat $16 to $90 | MUI untested; private packages on Organization | GA, kits since April 2026 |
| Figma MCP `use_figma` | ideation in Figma | library instances and variables | prototype connections via Plugin API | Figma prototype link | Full seat; free in beta | n/a (Figma side) | beta |
| Figma Console MCP | ideation in Figma | library instances | prototype connections via Plugin API | Figma prototype link | free, MIT | n/a | active open source |
| Figma agent, First Draft | ideation | agent edits library instances; First Draft cannot use a team's system | prototyping "coming soon" | Figma link | AI credits | n/a | beta |
| Claude Design | ideation, concepts, decks | undocumented | clickable prototypes | organisation only | Pro and above | via `/design-sync` from code | research preview |
| Claude artifacts | single-page demos | only if bundled into the page | in-page | public link without sign-in (Claude Code docs) | Pro and above | MUI from CDN; private libraries must be inlined | GA |
| Anima | Figma to code | lookalikes | flows from Figma links | `animaapp.io` link | Starter and above | generic MUI export | GA |
| Builder.io Code | production codegen | yes, in the repo | n/a | previews for members; password on Team | $24 to $40 per user; indexing Enterprise | MUI per a blog post | GA |

---

## 14. The short version

Prototyping flows from code and ideating from a Figma library are two jobs, and the tools that claim to do both mostly do the second well and the first with lookalikes. The test that sorts them takes minutes: open the generated code and check whether the components are imported from the team's own package, copied into the project, or drawn generically in the team's colours. Only the first stays correct when the library changes, and only the first gives reviewers the behaviour that will ship.

For prototype flows built from real coded components, the most faithful and cheapest route for a team already on Storybook is Storybook itself. A flow is a story that composes real screen components with local state, links between stories, play functions for sequences, and mocked modules, network and router. A coding agent with Storybook's MCP addon writes these reliably, and Southleft's Story UI lets a designer generate whole screens from the real components inside Storybook, with its own render and interaction checks, though it does not document writing flows. Chromatic publishes the result at a branch permalink that anyone can open without signing in when visibility is public, on the free plan; Vercel's free Shareable Links are the cheapest private alternative. UXPin Merge with Wire is the one tool that gives designers a canvas of real coded components and turns it into a hosted flow with logic, at the price of a second platform, a webpack-shaped Git integration on Enterprise, and undocumented React 19 support. The hosted app builders (v0, Lovable, Bolt, Magic Patterns) are built around Tailwind and shadcn, none documents MUI, and only v0's newer import and Magic Patterns document rendering the real package.

For ideation from a Figma design system, the strongest route for a Figma-first team is an agent composing concepts in the file from library instances, through Figma's `use_figma` (beta, Full seat, free during the beta) or Southleft's Figma Console MCP, wired with prototype connections and shared as a Figma prototype link. Figma Make gives clickable concepts at a `figma.site` link, but from a library alone its components are lookalikes painted with the library's variables; real components need an npm package that builds under Vite, and a private one needs Figma's Organization plan. Claude Design learns a system from Figma or code but shares only within the organisation and does not document using the real components. Figma's own First Draft cannot use a team's design system at all.

For Project B: flow stories in its own Storybook, published to Chromatic, and agent-composed concepts in its screens file. For Project A: the same flow stories in a small prototype repository that installs the published library from its private feed, because the clone is read-only, and agent-composed concepts from the Web library. Add UXPin Merge or a package-backed Figma Make only when designers are measurably blocked on engineers.

---

## 15. What to re-check later

- **Nothing was run hands-on.** Every capability here is as documented. The first test for any adopted tool is the import test in section 2 with the real library.
- **MUI in hosted builders.** No primary source for v0, Lovable, Bolt, Magic Patterns or Figma Make names MUI; whether MUI 9 with Emotion and a ThemeProvider renders in any of them is unknown.
- **React 19 and Storybook 10 in UXPin.** Neither is documented. Whether Wire's hosted link can be password-protected, which plan includes Wire, and whether viewers need a UXPin account are not stated.
- **Story UI flows and wrappers.** No documentation of play functions or linked multi-screen flows; behaviour with a wrapper library such as `@project-a/design-system`, rather than raw `@mui/material`, is inferred from its local-source discovery.
- **Agent-wired Figma prototypes.** Setting prototype reactions through `use_figma` or Figma Console MCP follows from the Plugin API docs and was not tested.
- **Account-free viewing.** Figma's help centre does not say a prototype link opens without an account (community answers say it does with "Anyone" access); Anthropic's two artifact pages disagree on whether a public artifact needs a claude.ai account; Claude Design documents no public link.
- **Vendor pages that disagree.** Figma's beta list and its agent article disagree on the agent's beta status and credit use; Builder.io's docs and pricing disagree on where Design System Intelligence and password-protected previews sit; Lovable's FAQ contradicts itself on importing an existing repository.
- **Figma Make passwords.** Which plans can password-protect a published Make site is stated only in a forum post (Organization and Enterprise).
- **Chromatic quota.** Whether publishing a Storybook without visual tests consumes snapshots was not found in the docs.
- **Prices.** Lovable's, Magic Patterns' and Anima's middle tiers did not render on their pricing pages; all prices are as of October 2026 and the AI-credit models behind them changed several times during the year.
- **Pace.** Claude Design changed form twice between April and October 2026, Figma's agent replaced First Draft as the entry point in May, UXPin shipped Wire in June, and Story UI reached version 5 in fifteen months. Sections 6 to 10 should be re-read against the vendors' docs before any purchase.

---

## Sources

### Primary: Storybook and hosting

- [Southleft: Story UI repository and README](https://github.com/southleft/story-ui)
- [Story UI: v5.21.2 release](https://github.com/southleft/story-ui/releases/tag/v5.21.2)
- [Story UI: setup presets, including Material UI](https://github.com/southleft/story-ui/blob/main/cli/setup.ts)
- [Story UI: interaction probe source](https://github.com/southleft/story-ui/blob/main/story-generator/verify/probes/interaction.ts)
- [Story UI: deployment guide](https://github.com/southleft/story-ui/blob/main/DEPLOYMENT.md)
- [Storybook: AI overview](https://storybook.js.org/docs/ai)
- [Storybook: MCP server overview](https://storybook.js.org/docs/ai/mcp/overview)
- [Storybook: MCP API](https://storybook.js.org/docs/ai/mcp/api)
- [Storybook: component manifests](https://storybook.js.org/docs/ai/manifests)
- [Storybook: sharing the MCP server](https://storybook.js.org/docs/ai/mcp/sharing)
- [Storybook: MCP addon source](https://github.com/storybookjs/storybook/tree/next/code/addons/mcp)
- [Storybook: play functions](https://storybook.js.org/docs/writing-stories/play-function)
- [Storybook: interaction testing](https://storybook.js.org/docs/writing-tests/interaction-testing)
- [Storybook: mocking modules](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-modules)
- [Storybook: mocking network requests](https://storybook.js.org/docs/writing-stories/mocking-data-and-modules/mocking-network-requests)
- [Storybook 9.1 release](https://storybook.js.org/releases/9.1)
- [Storybook: Next.js with Vite](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite)
- [Storybook: addon-links source](https://github.com/storybookjs/storybook/tree/next/code/addons/links)
- [MSW Storybook addon](https://github.com/mswjs/msw-storybook-addon)
- [Chromatic: pricing](https://www.chromatic.com/pricing)
- [Chromatic: permalinks](https://www.chromatic.com/docs/permalinks)
- [Chromatic: collaborators and visibility](https://www.chromatic.com/docs/collaborators)
- [Chromatic: UI Review](https://www.chromatic.com/docs/review)
- [Vercel: deployment protection](https://vercel.com/docs/deployment-protection)
- [Vercel: Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)
- [Vercel: password protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/password-protection)
- [Vercel: Shareable Links](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links)
- [Vercel: comments](https://vercel.com/docs/comments)
- [Vercel: sharing deployments](https://vercel.com/docs/deployments/sharing-deployments)
- [Vercel: pricing](https://vercel.com/pricing)
- [Netlify: password protection](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/)
- [GitHub: changing the visibility of a Pages site](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site)

### Primary: hosted app builders

- [v0: design systems (registry guide)](https://v0.app/docs/design-systems)
- [v0: design systems 2.0](https://v0.app/docs/design-systems-2)
- [v0: GitHub](https://v0.app/docs/github)
- [v0: deployments](https://v0.app/docs/deployments)
- [v0: pricing](https://v0.app/pricing)
- [shadcn: registry](https://ui.shadcn.com/docs/registry)
- [shadcn: registry-item.json](https://ui.shadcn.com/docs/registry/registry-item-json)
- [shadcn: Open in v0](https://ui.shadcn.com/docs/registry/open-in-v0)
- [Lovable: design systems](https://docs.lovable.dev/features/design-systems)
- [Lovable: publish](https://docs.lovable.dev/features/publish)
- [Lovable: importing a GitHub repository (FAQ)](https://lovable.dev/faq/github/import-github-repo)
- [Bolt: add a design system](https://support.bolt.new/building/design-system/add-design-system)
- [Bolt: design system best practices](https://support.bolt.new/building/design-system/best-practices)
- [Bolt: pricing](https://bolt.new/pricing)
- [Magic Patterns: importing an npm package](https://www.magicpatterns.com/docs/documentation/design-systems/importing/npm-package)

### Primary: designer canvases and code generators

- [UXPin: Merge](https://www.uxpin.com/merge)
- [UXPin: Merge documentation](https://www.uxpin.com/docs/merge/)
- [UXPin: Merge with React components](https://www.uxpin.com/docs/merge/using-react.js-components/)
- [UXPin: AI-assisted Merge integration](https://www.uxpin.com/docs/merge/ai-assisted-merge-integration/)
- [UXPin: Storybook integration](https://www.uxpin.com/docs/merge/storybook-integration/)
- [UXPin: product updates (MUI 9 support, Forge, Wire)](https://updates.uxpin.com/)
- [UXPin: introducing Wire](https://updates.uxpin.com/2026-06-26-introducing-uxpin-wire)
- [UXPin: opening Wire](https://www.uxpin.com/docs/wire/opening-wire/)
- [UXPin: what is Forge](https://www.uxpin.com/docs/forge/what-is-forge/)
- [UXPin: pricing](https://www.uxpin.com/pricing)
- [Anima: add a Figma design system](https://docs.animaapp.com/docs/add-figma-design-system)
- [Anima: MCP](https://docs.animaapp.com/docs/anima-mcp)
- [Anima: MUI](https://docs.animaapp.com/docs/mui-material-ui)
- [Anima: full flows](https://docs.animaapp.com/docs/advanced-feature-create-full-flows)
- [Anima: publish](https://docs.animaapp.com/docs/publish)
- [Builder.io: Fusion](https://www.builder.io/fusion)
- [Builder.io: projects from repositories](https://www.builder.io/c/docs/fusion-projects-from-repositories)
- [Builder.io: Design System Intelligence](https://www.builder.io/c/docs/fusion-design-system-intelligence)
- [Builder.io: component indexing](https://www.builder.io/c/docs/component-indexing)
- [Builder.io: project previews](https://www.builder.io/c/docs/projects-previews)
- [Builder.io: pricing](https://www.builder.io/pricing)
- [Tempo: canvas](https://docs.tempo.new/product/canvas)
- [Tempo: migration to the desktop app](https://docs.tempo.new/guides/migrate)
- [Plasmic: code components](https://docs.plasmic.app/learn/code-components/)
- [Subframe: importing components](https://docs.subframe.com/learn/components/importing)
- [Framer: npm](https://www.framer.com/npm/)
- [Onlook repository](https://github.com/onlook-dev/onlook)

### Primary: Figma

- [Figma: Make kits](https://help.figma.com/hc/articles/39241689698839)
- [Figma: npm packages in Make](https://help.figma.com/hc/articles/43602872461079)
- [Figma blog: introducing Make kits and Make attachments](https://www.figma.com/blog/introducing-make-kits-and-make-attachments/)
- [Figma: publish a Make file](https://help.figma.com/hc/en-us/articles/31304586129559)
- [Figma: download code from Make](https://help.figma.com/hc/en-us/articles/33649966245783)
- [Figma: push from Make to GitHub](https://help.figma.com/hc/en-us/articles/35463818346647-Push-from-Figma-Make-to-GitHub)
- [Figma: Make in a local codebase](https://help.figma.com/hc/en-us/articles/40775535020695-Make-in-your-local-codebase)
- [Figma: AI credits](https://help.figma.com/hc/en-us/articles/33459875669015)
- [Figma: pricing](https://www.figma.com/pricing/)
- [Figma: features in beta](https://help.figma.com/hc/en-us/articles/4406787442711-What-Figma-features-are-in-beta)
- [Figma: First Draft](https://help.figma.com/hc/en-us/articles/23955143044247)
- [Figma: the Figma agent in design files](https://help.figma.com/hc/en-us/articles/37998629035799-Work-with-the-Figma-agent-in-design-files)
- [Figma MCP server: write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas)
- [Figma: write to canvas and Code to Canvas](https://help.figma.com/hc/en-us/articles/39252411778583)
- [Figma Learn: code to canvas with a design system](https://help.figma.com/hc/en-us/articles/40287261761559-Code-to-canvas-with-your-design-system)
- [Figma: share or embed files and prototypes](https://help.figma.com/hc/en-us/articles/360040531773-Share-or-embed-your-files-and-prototypes)
- [Southleft: Figma Console MCP](https://github.com/southleft/figma-console-mcp)
- [Figma Plugin API: Reaction](https://developers.figma.com/docs/plugins/api/Reaction/)

### Primary: Anthropic

- [Anthropic: introducing Claude Design](https://www.anthropic.com/news/claude-design-anthropic-labs)
- [Claude help: set up a design system in Claude Design](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design)
- [Claude help: get started with Claude Design](https://support.claude.com/en/articles/14604416-get-started-with-claude-design)
- [Claude help: migrating from standalone Claude Design](https://support.claude.com/en/articles/17440474-migrate-from-standalone-claude-design-to-claude)
- [Claude help: share artifacts](https://support.claude.com/en/articles/9547008-share-artifacts)
- [Claude Code: artifacts](https://code.claude.com/docs/en/artifacts)
- [MUI on jsDelivr (ESM build)](https://cdn.jsdelivr.net/npm/@mui/material@7.0.0/+esm)

### Commentary and community

- [Builder.io blog: React and Material UI with AI](https://www.builder.io/blog/react-material-ui-ai) (vendor blog; the only source for Builder's MUI support)
- [Figma forum: sharing a prototype without requiring sign-in](https://forum.figma.com/t/sharing-a-prototype-without-having-user-required-to-sign-in-to-figma/40423/31)
- [Divriots: powering Google Stitch's export](https://divriots.com/blog/divriots-powers-google-stitch-export-feature) (secondary source for Stitch)

### Project sources (local)

- Project B: Project B's repository (`package.json`, `.storybook/main.ts`, `AGENTS.md`, `src/screens/contacts-list/contacts-list.stories.tsx`) and its context document in the toolkit's `projects/project-b/`
- Project A: Project A's repository (`pnpm-workspace.yaml`, `apps/storybook/package.json`, `packages/design-system/package.json`) and its context document in the toolkit's `projects/project-a/`
