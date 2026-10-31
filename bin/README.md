# bin

The commands you run from the repo root. Each is a short script that hands over to the tool that does the work, so the command stays the same when the code behind it moves.

| Command | What it does |
|---|---|
| `bin/check` | The toolkit's own check: the standards, the scanners and every test a skill or tool ships. Run it before and after a change; the pre-push hook runs it too, so a push cannot carry a red toolkit. By default it also heals what it safely can (it may rewrite a project setting that only repeats a house default); `--no-fix` changes nothing, `--quick` skips the test suites. |
| `bin/check-lib.sh` | Sourced by `bin/check`, not run: its step helpers and the closing summary, which names every step that failed so the last lines of a run say what blocked it. |
| `bin/get [--list] <folder>` | One tool from the toolkit, for someone who wants only it: in a clone made with `git clone --filter=blob:none --sparse`, sets git's sparse checkout to the tool's folder and every toolkit folder its code imports or names, followed until nothing new is named. A skill also brings the tools, standards and knowledge pages its `SKILL.md` and references name by repo path, and an orchestrator the skills it runs. The code is git's checkout, never a copy; `git pull` updates it. A kept folder with packages of its own is named on stderr with its `pnpm install --frozen-lockfile`; a file it used but could not check out, or a toolkit path a skill names that does not exist, is said there too. `bin/check` runs the contract editor and takes every skill from a checkout this made. |
| `bin/closing` | The end-of-work pass: what is uncommitted or unpushed across the toolkit and every project, and the questions no script can answer ([toolkit-standard](../standards/toolkit-standard.md) §D 13). `--brief` prints the open items alone (the session hooks read it); `--judgement <standard>… [--prompt <file>]` prints those standards' judgement rules, by handle and title, and with `--prompt` only those whose *Reviewed:* names that file. |
| `bin/audit <project> [fileKey]` | Runs two stages of a project's Figma audit from a Claude session, with no API key: the components scanner and the file-level (foundations) scanner, through the project's audit service, writing a payload for the session to judge ([tools/figma-audit](../tools/figma-audit/README.md)). `bin/audit --file <payload>` shows what filing it would add and close, and `--write` files it. The page's **Audit** also runs the validator and the token-link stages; from a session, run those skills ([component-validator](../skills/component-validator/SKILL.md), [figma-variable-audit](../skills/figma-variable-audit/SKILL.md)). |
| `bin/deploy <project> --public` or `--password` | Publishes a project's built docs site to Cloudflare ([tools/docs-site](../tools/docs-site/README.md)). |
| `bin/set-key [name]` | macOS only. The toolkit's two keys, Figma (`figma`) and Anthropic (`audit`), in one folder: `~/.config/keys/`, one file per key, with `keys.conf` beside them naming each key's prefix and who else must hear about it. The first run with no `keys.conf` copies `keys.conf.example` there. With a name it waits for a new key on the clipboard, tests it (a Figma token against Figma, an Anthropic key against Anthropic), writes it 600, clears the clipboard and hands it on: it links `~/.config/figma/token` and `~/.figma-dashboard-key`, where the snapshot and the audit service read them, updates figma-console's copy and restarts the audit service. `--again` hands the saved key on again after a hand-on that failed; with no name it says which keys work. A key of your own takes a line in your `keys.conf`, with a `test` line for its prefix and a `run` step for its hand-on; without a test it is saved and said to be untested. The key never passes through a chat. A `keys.conf` written before 2026-10-31 keeps working: see *Moving a keys.conf from the old set-key* below. |
| `bin/keys.conf.example` | Not a command: the `keys.conf` `bin/set-key` starts from, with the format of a line. |

```sh
bin/check            # everything: about six minutes
bin/check --quick    # the standards and the scanners only: under a minute
```

Each step prints how long it took. The full run is long because it runs every test suite, several in Chrome, and takes the contract editor and every skill from a fresh `bin/get` checkout; `--quick` is the one to run while working, the full one before a push (the push hook runs it anyway).

Every command needs Node 22.12 or later. `bin/deploy` also needs `npx wrangler login` once.

## Moving a keys.conf from the old set-key

Until 2026-10-31 `bin/set-key` also tested Brave (`BSA`), ElevenLabs (`sk_`) and Resend (`re_`) keys itself, and had an `ssh <host> <config path>` step that copied a key to a server and made its PHP config read it. Both came out: the toolkit keeps only its own keys. A `keys.conf` that relies on them is told so, never half-run:

- **A line with `ssh`** stops before any key is asked for, and set-key prints the line that replaces it, `<name> <prefix> run ~/.config/keys/hooks/ssh-php-config <host> <config path>`, with where to get the hook if it is not there yet (the old step, from git history).
- **A key whose prefix it no longer tests** is saved and said to be untested, and set-key prints the `test` line that runs the old test from your `keys.conf`.
- **A file where a `link` goes** (a `~/.figma-dashboard-key` written by hand, as the old setup said) is left alone and named; move it aside and run `bin/set-key <name> --again`.
