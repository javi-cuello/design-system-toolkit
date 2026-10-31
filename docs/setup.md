# Setting up the whole toolkit

Everything on one machine: the skills in Claude Code, the services, and a first project. For one tool alone, see [the root README](../README.md#getting-started); the words used here are in [how-it-fits.md](how-it-fits.md#words-used-here).

**You need:**
- a Mac (the services install as launchd agents; on Linux, run them by hand);
- Node 22.12 or later, pnpm, Google Chrome, and python3 (the Xcode Command Line Tools provide it);
- the Figma desktop app;
- Claude Code with the [figma-console MCP server](https://github.com/southleft/figma-console-mcp) and its Desktop Bridge plugin, for the skills that read or change a Figma file;
- optionally, an Anthropic API key in `~/.figma-dashboard-key`, put there by `bin/set-key audit` on macOS (for the audit page's chat and judgement pass; see [tools/figma-audit](../tools/figma-audit/README.md)) and a Cloudflare account with `npx wrangler login` (to publish a docs site).

1. **Clone and install.** Put the repo at `~/Projects/toolkit` (projects are found beside it, in `~/Projects/`), then:

   ```sh
   git clone https://github.com/javi-cuello/design-system-toolkit.git ~/Projects/toolkit && cd ~/Projects/toolkit
   (cd tools/docs-site && pnpm install --frozen-lockfile)  # the docs site's engine
   ./install.sh                            # checks the repo, links the skills into Claude Code, installs the services and the push hook
   ```

2. **Connect Claude Code to Figma.** Follow the figma-console MCP's setup (register the server with a Figma access token, import its Desktop Bridge plugin in Figma), then import this repo's snapshot plugin: **Plugins → Development → Import plugin from manifest…** → `plugins/design-system-snapshot/manifest.json`.

3. **Set up a project.** Create `~/Projects/<label>/figma-design-system/`, open the library in Figma with the Desktop Bridge running, and ask Claude Code to "capture the context of this Figma library into ~/Projects/<label>/figma-design-system" ([figma-context-capture](../skills/figma-context-capture/SKILL.md)). The document it writes needs three blocks, all in [the template](../skills/figma-context-capture/assets/context-template.md):
   - `project`: a display name and a `port` in 9223–9232 that no other project uses, counting down from 9232 (the audit service serves the project there; the Figma MCP takes ports from 9223 up);
   - `snapshot-routing`: the library's Figma file key, the part after `/design/` in its URL;
   - `audit-settings`: the library's naming conventions, which the audit reads.

4. **Take a snapshot.** In the library file, run **Plugins → Development → Design system snapshot**. The first time, the router replies with the id the plugin stamped on the file: add it beside the key in `snapshot-routing` and take the snapshot again. From then on it is stored in the project's folder, and everything built from it follows.

5. **Open the docs site** at `http://localhost:<port>/` (it builds within a minute). To audit: with the service already running, open Figma, run the Desktop Bridge plugin in the library, and press **Audit** on the site's Audits page ([tools/figma-audit](../tools/figma-audit/README.md)).

**If the project has a code repo**, connect it so its tokens, checks and parity run from the toolkit: `node tools/project-check/init.mjs --repo ~/Projects/<label>` writes the files and hook, then lists the gates and decisions still open ([Connect a code repo](../tools/project-check/README.md#connect-a-code-repo)). Then publish the docs site with `bin/deploy`, or ask Claude to use any [skill](../skills/README.md).

## A project's home

A project is a repo under `~/Projects/` with a `figma-design-system/` folder at its root; the label is the repo's folder name. The tools find it there and nowhere else, so adding a project is adding that folder. A project with no code repo, or whose code repo is someone else's, gets a small private repo of its own holding just the folder.

```
~/Projects/<label>/figma-design-system/
  design-system-context.md   — everything decided about the project; the only
                               place a fact about it lives (toolkit-standard §D 12)
  snapshot/                  — what the plugin stored, machine-written (a code
                               repo may keep it elsewhere: snapshot.config.json)
  audit/<fileKey>.json       — one audit record per library: results, never settings
  parity/                    — the code audit's map and report, where it has one
  tokens/                    — a DTCG export, where the project keeps one here
  reports/                   — dated write-ups of a run or review, by hand
  site/, storybook/          — built, ignored by the folder's own .gitignore
```

Only the context document is written by hand: **a document records a decision, a snapshot records a reading.** A project that departs from a design or naming rule says so in one line of it, `**Overrides:** <standard> rule N — <why>`, beside a dated ruling. No credentials go in the folder.
