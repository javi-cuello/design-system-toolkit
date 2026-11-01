# Setting up the whole toolkit

Everything on one machine: the skills in Claude Code, the services, and a first project. For one tool alone, see [the root README](../README.md#getting-started); the words used here are in [how-it-fits.md](how-it-fits.md#words-used-here).

**You need:**
- a Mac (the services install as launchd agents; on Linux, run them by hand);
- Node 22.12 or later ([nodejs.org](https://nodejs.org), or `brew install node`), pnpm 12 (`brew install pnpm` or `npm install -g pnpm@12`; Node 25 and later no longer ship corepack), [Google Chrome](https://www.google.com/chrome/) (or `CHROME=/path/to/chrome` for another Chromium), and python3 (the Xcode Command Line Tools provide it: `xcode-select --install`);
- the Figma desktop app;
- Claude Code with the [figma-console MCP server](https://github.com/southleft/figma-console-mcp) and its Desktop Bridge plugin, for the skills that read or change a Figma file (last run with 1.46.0, as `figma-console-mcp@latest` resolved on 2026-11-01);
- optionally, an Anthropic API key in `~/.figma-dashboard-key`, put there by `bin/set-key audit` on macOS (for the audit page's chat and judgement pass; see [tools/figma-audit](../tools/figma-audit/README.md)) and a Cloudflare account with `npx wrangler login` (to publish a docs site).

1. **Clone and install.** Projects are found beside the toolkit, in the folder that holds its checkout (`TOOLKIT_PROJECTS_ROOT` points elsewhere), so put it where your projects will live. These steps use `~/Projects`:

   ```sh
   git clone https://github.com/javi-cuello/design-system-toolkit.git ~/Projects/toolkit && cd ~/Projects/toolkit
   (cd tools/docs-site && pnpm install --frozen-lockfile)  # the docs site's engine
   (cd tools/tokens && pnpm install --frozen-lockfile)     # the Style Dictionary the token suites run through
   ./install.sh                            # checks the repo, links the skills into Claude Code, installs the services and the push hook
   ```

   `install.sh` runs the standards guard first and stops on its errors; `SKIP_CHECKS=1 ./install.sh` links anyway, and `SKIP_SERVICES=1` leaves the services alone. Each service logs to `~/Library/Logs/toolkit/` (`figma-snapshot.log` and `.err`, `figma-audit.log` and `.err`). Then `bin/check` checks the whole toolkit: about six minutes, or `bin/check --quick` for the standards and scanners alone, in under a minute.

2. **Connect Claude Code to Figma.** Follow the figma-console MCP's setup (register the server with a Figma access token, import its Desktop Bridge plugin in Figma), then import this repo's snapshot plugin: **Plugins → Development → Import plugin from manifest…** → `plugins/design-system-snapshot/manifest.json`.

3. **Set up a project.** Create `~/Projects/<label>/figma-design-system/`, open the library in Figma with the Desktop Bridge running, and ask Claude Code to "capture the context of this Figma library into ~/Projects/<label>/figma-design-system" ([figma-context-capture](../skills/figma-context-capture/SKILL.md)). The document it writes needs three blocks, all in [the template](../skills/figma-context-capture/assets/context-template.md):
   - `project`: a display name, and a `port` in 9223–9232 that no other project uses, counting down from 9232 (the template's example is 9232). The port is optional in the template, but without it the audit service does not serve the project, so step 5 has no site; the Figma MCP takes ports from 9223 up;
   - `snapshot-routing`: the library's Figma file key, the part after `/design/` in its URL;
   - `audit-settings`: the library's naming conventions, which the audit reads.

4. **Take a snapshot.** In the library file, run **Plugins → Development → Design system snapshot**. The first time, the window asks for this machine's pairing code: run `node tools/snapshot/pairing.cjs` and paste what it prints. The router finds the project by the file key in `snapshot-routing` and stores the snapshot in the project's folder, and everything built from it follows.

5. **Open the docs site** at `http://localhost:<port>/` (it builds within a minute). To audit: with the service already running, open Figma, run the Desktop Bridge plugin in the library, and press **Audit** on the site's Audits page ([tools/figma-audit](../tools/figma-audit/README.md)).

**If the project has a code repo**, connect it so its tokens, checks and parity run from the toolkit: `node tools/project-check/init.mjs --repo ~/Projects/<label>` writes the files and hook, then lists the gates and decisions still open ([Connect a code repo](../tools/project-check/README.md#connect-a-code-repo)). Then publish the docs site with `bin/deploy`, or ask Claude to use any [skill](../skills/README.md).

## A project's home

A project is a repo beside the toolkit (here `~/Projects/<label>/`) with a `figma-design-system/` folder at its root; the label is the repo's folder name. The tools find it there and nowhere else, so adding a project is adding that folder. A project with no code repo, or whose code repo is someone else's, gets a small private repo of its own holding just the folder.

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
