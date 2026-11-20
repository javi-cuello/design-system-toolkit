# bin reference

Detail moved from [README.md](README.md).

## The commands in full

### bin/check

The toolkit's own check: the standards, the scanners and every test a skill or tool ships. Run it before and after a change; the pre-push hook runs it too, so a push cannot carry a red toolkit.

- By default it also heals what it safely can. It may rewrite a project setting that only repeats a house default.
- `--no-fix` changes nothing.
- `--quick` skips the test suites.

Each step prints how long it took. The full run is long because it runs every test suite, several in Chrome, and takes the contract editor and every skill from a fresh `bin/get` checkout. `--quick` is the one to run while working, the full one before a push (the push hook runs it anyway).

### bin/worktree

`bin/worktree <work>` makes or reopens the worktree for one piece of work, and prints its folder ([tools/shared](../tools/shared/README.md) `worktree.mjs`).

- The worktree is `.claude/worktrees/<work>`, on branch `worktree-<work>` from `origin/main`.
- The main checkout's installs are linked in.
- Work is done there, never in the main checkout, which other sessions share.

### bin/land

`bin/land [<branch or folder>]` lands a worktree's branch on main ([tools/shared](../tools/shared/README.md) `land.mjs`).

- It joins one queue.
- Whoever holds the measuring lock replays every queued branch onto main, runs one full check of the batch and pushes.
- `bin/land --queue` lists the queue.

### bin/check-lib.sh

Sourced by `bin/check`, not run: its step helpers and the closing summary. The summary names every step that failed, so the last lines of a run say what blocked it.

### bin/get

`bin/get [--list] <folder>` takes one tool from the toolkit, for someone who wants only it.

- It works in a clone made with `git clone --filter=blob:none --sparse`.
- It sets git's sparse checkout to the tool's folder and every toolkit folder its code imports or names, followed until nothing new is named.
- A skill also brings the tools, standards and knowledge pages its `SKILL.md` and references name by repo path. An orchestrator also brings the skills it runs.
- The code is git's checkout, never a copy; `git pull` updates it.
- A kept folder with packages of its own is named on stderr with its `pnpm install --frozen-lockfile`.
- A file it used but could not check out, or a toolkit path a skill names that does not exist, is said there too.
- `bin/check` runs the contract editor and takes every skill from a checkout this made.

### bin/closing

The end-of-work pass: what is uncommitted or unpushed across the toolkit and every project, and the questions no script can answer ([toolkit-standard](../standards/toolkit-standard.md) §D 13).

- `--brief` prints the open items alone (the session hooks read it).
- `--queue` prints, as JSON, what was left for later since the last periodic review.
- `--judgement <standard>… [--prompt <file>]` prints those standards' judgement rules, by handle and title. With `--prompt`, only those whose *Reviewed:* names that file.

### bin/review

The periodic independent review ([toolkit-standard](../standards/toolkit-standard.md) §D 11), run without the maintainer.

1. It makes a `review/<date>` branch in its own worktree.
2. It runs `bin/check`, reads the queue (`bin/closing`'s `--queue`), and runs one headless agent over [`review.md`](../tools/toolkit-check/review.md).
3. A fresh read-only reviewer then judges the branch.
4. With no High issue and `bin/check` green on the merge, it is pushed to `main`. Otherwise it is held, with the reason handed to the next run.

Options: `--if-owed` (what the daily launch agent passes), `--dry-run` (everything but the agent), `--budget <usd>` (default 20).

### bin/audit

`bin/audit <project> [fileKey]` runs two stages of a project's Figma audit from a Claude session, with no API key ([tools/figma-audit](../tools/figma-audit/README.md)).

- The two stages are the components scanner and the file-level (foundations) scanner.
- It runs them through the project's audit service, and writes a payload for the session to judge.
- `bin/audit --file <payload>` shows what filing it would add and close, and `--write` files it.
- The page's **Audit** also runs the validator and the token-link stages. From a session, run those skills: [component-validator](../skills/component-validator/SKILL.md) and [figma-variable-audit](../skills/figma-variable-audit/SKILL.md).

### bin/deploy

`bin/deploy <project> --public` or `--password` publishes a project's built docs site to Cloudflare ([tools/docs-site](../tools/docs-site/README.md)). It needs `npx wrangler login` once.

### bin/set-key

`bin/set-key [name] [--again]`. macOS only. The one command that writes the toolkit's keys.

| Key | Name |
|---|---|
| Figma | `figma` |
| Anthropic | `audit` |
| the agent's own Figma account, optional | `figma-claude`, which figma-prototype's feedback replies post as |

- It writes one file each in `~/.config/keys/`.
- `keys.conf` sits beside them, saying each key's prefix and who else must hear of it. It is copied from `keys.conf.example` on the first run.
- With a name, it waits for the key on the clipboard, tests it, saves it 600 and hands it on. So the key never passes through a chat.
- With no name, it says which keys work.
- The usage and the `keys.conf` line format are in the script's header ([set-key](set-key)) and [keys.conf.example](keys.conf.example).
- A `keys.conf` written before 2026-10-31 keeps working: see [Moving a keys.conf from the old set-key](#moving-a-keysconf-from-the-old-set-key) below.

## Tests

Tests sit beside the commands as `test-<command>.mjs`, run by `bin/check` by discovery.

- `test-set-key.mjs` runs in a temp `HOME` with fake keys, and with `pbpaste`, `pbcopy`, `curl`, `launchctl` and `sleep` stubbed. It covers that a key its test rejects, or with no network, is never saved, and the steps' refusals.
- `test-deploy.mjs` runs with `npx` stubbed. It covers its refusals, both flags at once and an unknown flag beside a valid one among them, and the wrangler call it would make. Nothing is published.

## Moving a keys.conf from the old set-key

Until 2026-10-31 `bin/set-key` also tested Brave (`BSA`), ElevenLabs (`sk_`) and Resend (`re_`) keys itself, and had an `ssh <host> <config path>` step that copied a key to a server and made its PHP config read it. Both came out: the toolkit keeps only its own keys. A `keys.conf` that relies on them is told so, never half-run:

- **A line with `ssh`** stops before any key is asked for, and set-key prints the line that replaces it, `<name> <prefix> run ~/.config/keys/hooks/ssh-php-config <host> <config path>`, with where to get the hook if it is not there yet (the old step, from git history).
- **A key whose prefix it no longer tests** is saved and said to be untested, and set-key prints the `test` line that runs the old test from your `keys.conf`.
- **A file where a `link` goes** (a `~/.figma-dashboard-key` written by hand, as the old setup said) is left alone and named; move it aside and run `bin/set-key <name> --again`.
