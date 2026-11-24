# bin

The commands you run from the repo root. Each is a short script that hands over to the tool that does the work. So the command stays the same when the code behind it moves.

## Try it

```sh
bin/check            # everything
bin/check --quick    # the standards and the scanners only: under a minute
```

Every command needs Node 22.12 or later. `bin/deploy` also needs `npx wrangler login` once.

## The commands

| Command | What it does |
|---|---|
| `bin/check` | The toolkit's own check: the standards, the scanners and every test a skill or tool ships. Run it before and after a change. The pre-push hook runs it too, so a push cannot carry a red toolkit. |
| `bin/worktree <work>` | Makes or reopens the worktree for one piece of work, and prints its folder. Work is done there, never in the main checkout, which other sessions share. |
| `bin/land [<branch or folder>]` | Lands a worktree's branch on main: a quick check first (red: not queued), then one queue that is checked and pushed as a batch. |
| `bin/check-lib.sh` | Sourced by `bin/check`, not run: its step helpers and the closing summary. |
| `bin/get [--list] <folder>` | Takes one tool from the toolkit, for someone who wants only it, with every toolkit folder it uses. |
| `bin/closing` | The end-of-work pass: what is left uncommitted or unpushed, and the questions no script can answer. |
| `bin/review` | The periodic independent review, run without the maintainer. |
| `bin/audit <project> [fileKey]` | Runs two stages of a project's Figma audit from a Claude session, with no API key. |
| `bin/deploy <project> --public` or `--password` | Publishes a project's built docs site to Cloudflare ([tools/docs-site](../tools/docs-site/README.md)). |
| `bin/set-key [name] [--again]` | macOS only. The one command that writes the toolkit's keys. |
| `bin/keys.conf.example` | Not a command: the `keys.conf` `bin/set-key` starts from, with the format of a line. |

[REFERENCE.md](REFERENCE.md) says what each command does in full.

## Options

| Option | What it does |
|---|---|
| `bin/check --no-fix` | changes nothing. By default the check heals what it safely can. |
| `bin/check --quick` | skips the test suites |
| `bin/land --queue` | lists the queue |
| `bin/get --list` | prints the folders and changes nothing |
| `bin/closing --brief` | prints the open items alone. The session hooks read it. |
| `bin/closing --queue` | prints, as JSON, what was left for later since the last periodic review |
| `bin/closing --judgement <standard>… [--prompt <file>]` | prints those standards' judgement rules, by handle and title. With `--prompt`, only those whose *Reviewed:* names that file. |
| `bin/review --if-owed` | what the daily launch agent passes |
| `bin/review --dry-run` | everything but the agent |
| `bin/review --budget <usd>` | the spending limit, default 20 |
| `bin/audit --file <payload>` | shows what filing the payload would add and close |
| `bin/audit --write` | files it |
| `bin/set-key <name> --again` | hands the saved key on again, after a hand-on that failed (the script's header) |

## Test

Each step of `bin/check` prints how long it took. The full run is long, because it runs every test suite, several in Chrome. `--quick` is the one to run while working. Run the full one before a push; the push hook runs it anyway.

Tests sit beside the commands as `test-<command>.mjs`, and `bin/check` finds them by discovery. [REFERENCE.md](REFERENCE.md#tests) says what each stubs.
