# Docs site

A documentation site for a design system, generated from the project's
committed Figma snapshot. The engine names no project. It finds one the way
every reader in the toolkit does, through the snapshot contract
(`tools/snapshot/projects.cjs`, `layout()`), so where a project
keeps its snapshot, its display name, its phase and its page-marker legend
all come from the project, stated once.

    pnpm install --frozen-lockfile          # once, in this folder
    DOCS_PROJECT=<label> pnpm dev           # a project's label: its repo under ~/Projects/
    DOCS_PROJECT=<label> pnpm build             # → <project home>/site/
    DOCS_OUT=/tmp/<label>-site …                 # build somewhere else

A build, by hand or by the dashboard service, runs through `build.mjs`: it
waits for any other build of the engine to finish (Astro stages every build in
one folder, `.astro/.prerender`, and two at once break each other; the lock,
`lock.mjs`, is touched every 30 seconds while a build runs, so only one left
by a build that died goes stale, after two minutes; a stale lock whose holder
still runs, the same pid started at the same time, is kept, and any is dead
after six hours), builds
beside the site and swaps it in, so a failed build never leaves the site empty.

The toolkit is found by walking up from the working directory, so run it
from inside this folder. You rarely need to: the dashboard service
(`tools/figma-audit`) builds every project's site on start and again
whenever its inputs change, and serves it.

To change the docs, change Figma and take a new snapshot.

## What the phase changes

The phase is the `project` block in the project's context document.

| Phase | Shows |
|---|---|
| `design` | A handoff spec: guidance from each component's Figma description, the design preview (default variant, exported by the plugin), properties, tokens per layer, status from the page marker, and what changed in the last snapshot |
| `build` | The same, plus live previews from the project's built Storybook and whether each component is in code |
| `maintenance` | As build |

A component's status is its page marker, read through the project's legend
(figma-standard rule 11's `🚧`/`❖` by default, or a project's own review ladder), so
nobody maintains a second status.

## Where things come from

- **Tokens, specs, previews, icons, changes:** the paths `layout()` returns,
  which a repo sets in its `snapshot.config.json` `paths` and a design-only
  project gets by default under `<project home>/snapshot/`.
- **Properties:** each component's contract (`contract.json`, written beside
  its spec on every snapshot), read through `propsOf` in
  `tools/component-contract/contract-rows.mjs`, the reader figma-properties-table's
  table in Figma uses too. A component with no stored contract says so.
- **States:** the interaction states from the contract too, by the rule the
  contract editor uses (`statesOf` in `tools/component-contract/layers.mjs`):
  the axis derive marked as interaction, its default left out, a pointer
  state set by the browser and any other on that axis (Loading) by the
  product. A True/False property named for a condition (Disabled, Selected)
  is listed as set by that property.
- **Propose a change:** each component with a contract links to it in the
  project's contract editor (`tools/contract-editor`), at the project block's
  `editorPort` (9250 where it states none), where its API is edited and
  proposed. Shown only where the site is served from this machine, since the
  editor runs there; a published copy never offers it. The editor links back
  to the component's page, read from this site's `api/index.json`, which
  gives each set's `path`.
- **Guidance:** each component's description, parsed by the toolkit's
  `guidance.cjs` (purpose, Usage, Don't, Behaviour, Composition, Code gen
  notes). A Don't item naming another component links to it.
- **Stories:** matched to components by folder (a story file beside a spec is
  that component's). Build Storybook first; the `storybook` path's `hide`
  names stories that are machinery, and `themeGlobal` the global that
  switches light and dark.
- **Figma links:** the key from the project's routing block, per component
  file where a project spans several.
- **Parity (the tracker's second page):** a library's component pages against
  the components in its code: in code when it has one of the component's
  name, or of the name the project says it is built as (`frameworkComponents`). The project names the code on the
  library in its `audit-settings`, as `"code": { "repo": "~/Projects/<repo>",
  "components": "<folder from the repo's root>" }`. A component in code is a
  folder holding a file of its own name (`tools/shared/code-inventory.mjs`,
  shared with the audit). Read when the site is built, so a change in the
  code shows at the next build. Its second table, where a component may be in
  code under another name, is the audit's open `design-code-parity` rows read
  from the record: the page works none of them out.

Previews and the built Storybook are served under `/previews` and
`/storybook` on the site's own origin, in dev and in the build, so the site
deploys as one folder.

## Adding a section to a page

Give it an `h2`. Any sidebar page with more than one visible `h2` gets an
*On this page* column listing them, read from the page itself: a heading
without an anchor takes one from its text, and tabs, dashboard views and
filters redraw it by dispatching `contentchange`. A section that should be
spaced like the others is a `<section class="section">`. Nothing else is
registered anywhere.

## Where the code is

- `src/styles/system.css` — tokens, reset, plain elements, and the
  components both the pages and the dashboard draw (button, figures strip,
  segmented filter).
- `src/styles/site.scss` — the pages' own layout and components.
- `src/pages/changes.astro` — every recorded snapshot change, with the names
  behind each count; the overview's "Recent changes" is its last five.
- `src/dashboard/` — the audit dashboard: markup (`Dashboard.astro`),
  styles, the settings and check catalogue it bakes in for a read-only copy
  (`data.js`; the audit records are mounted beside the page at `/audit/`), and its
  behaviour as ES modules, one per concern, started by `main.js`: the record
  and the service (`record.js`, `api.js`), the queue, audits, Ask, scores,
  measures, views, owner labels (`labels.js`, shared with the overview).
  `check.mjs` proves every name each module uses is declared, imported or a
  browser global, and every import is exported.
- `src/lib/` — reading the snapshot, the audit record and the project.

## Publishing

`bin/deploy <project> --public` or `--password` uploads the site the service
built (`<project home>/site`) to Cloudflare as the Worker `<name>-docs`, serving
it as static assets at `<name>-docs.<account>.workers.dev` (Cloudflare folded
Pages into Workers; wrangler 4.138's Pages commands no longer deploy a folder),
at a domain root since the engine sets no base path. It needs `npx wrangler
login` once. It refuses without one of the two flags, so who may read a site is
decided when it is published. `--password` puts `tools/docs-site/deploy/password.js`
in front, the browser's sign-in box asking for the Worker's secret `PASSWORD`;
until it is set (`npx wrangler secret put PASSWORD --name <name>-docs`) the site
serves nothing. A project whose context document's `project` block says
`"publish": "password"` or `"public"` is redeployed by the dashboard service
after every build; otherwise run it by hand. A published copy's Audits page is
its read-only dashboard: no actions, no note fields, the record as of the build.

Why Cloudflare (decided 2026-09-19, the password added 2026-10-14): GitHub Pages
has no access control outside Enterprise, StatiCrypt is one shared password
re-encrypted on every build, and Tailscale needs every reader to install it.
Cloudflare Access (a login per person, free to 50 users) was the first choice;
the maintainer chose one password over it: no card, one password for everyone.

## Not here yet

- **Visual Do and Don't examples.** Parked (2026-09-19). The shape agreed:
  Claude drafts one frame per guidance bullet in Figma from real instances
  (named `Do / <bullet>`), the designer reviews them there, the snapshot
  exports them as it does previews, and a component page shows each beside
  its bullet. Pilot on one component first.
- **Specimen faces for design-only projects:** with no repo there is no font
  folder, so type specimens use the system face.
