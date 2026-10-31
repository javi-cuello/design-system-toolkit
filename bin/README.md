# bin

The commands you run from the repo root. Each is a short script that hands over to the tool that does the work, so the command stays the same when the code behind it moves.

| Command | What it does |
|---|---|
| `bin/check` | The toolkit's own check: the standards, the scanners and every test a skill or tool ships. Run it before and after a change; the pre-push hook runs it too, so a push cannot carry a red toolkit. By default it also heals what it safely can (it may rewrite a project setting that only repeats a house default); `--no-fix` changes nothing, `--quick` skips the test suites. |
| `bin/check-lib.sh` | Sourced by `bin/check`, not run: its step helpers and the closing summary, which names every step that failed so the last lines of a run say what blocked it. |
| `bin/get [--list] <folder>` | One tool from the toolkit, for someone who wants only it: in a clone made with `git clone --filter=blob:none --sparse`, sets git's sparse checkout to the tool's folder and every toolkit folder its code imports or names, followed until nothing new is named. The code is git's checkout, never a copy; `git pull` updates it. A kept folder with packages of its own is named on stderr with its `pnpm install`. `bin/check` runs the contract editor from a checkout this made. |
| `bin/closing` | The end-of-work pass: what is uncommitted or unpushed across the toolkit and every project, and the questions no script can answer ([toolkit-standard](../standards/toolkit-standard.md) §D 13). |
| `bin/audit <project> [fileKey]` | Runs a project's Figma audit from a Claude session, with no API key: scans through the project's audit service and writes what it found ([tools/figma-audit](../tools/figma-audit/README.md)). `bin/audit --file <payload> --write` files it. |
| `bin/deploy <project> --public` or `--password` | Publishes a project's built docs site to Cloudflare ([tools/docs-site](../tools/docs-site/README.md)). |
| `bin/set-key [name]` | Every key on this machine, in one folder: `~/.config/keys/`, one file per key, with `keys.conf` beside them naming each key's prefix and who else must hear about it (figma-console, the audit service, or a server over `ssh`, whose config, named by its path from the host's home, is made to read the key from a file there). With a name it waits for a new key on the clipboard, tests it with Figma, Anthropic or Brave, writes it, clears the clipboard and hands it on; `--again` hands the saved key on again after a hand-on that failed; with no name it says which keys still work. The key never passes through a chat. |

```sh
bin/check            # everything
bin/check --quick    # the standards and the scanners only
```

Every command needs Node 22.12 or later. `bin/deploy` also needs `npx wrangler login` once.
