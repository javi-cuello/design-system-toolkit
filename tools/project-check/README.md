# Project check

The two triggers a project repo fires: its check and its push. Toolkit-standard §D 13 says every change goes round one loop: standards, work, lesson, back to the toolkit. Each step of that loop has a trigger, and this folder holds the project's.

## Use

```sh
node tools/project-check/check.mjs --repo <dir> [--quick] [--no-browser] [--plan]
```

This runs every gate the toolkit holds a project to, in one entry. A gate a project cannot feed is RED. It stays RED until the project supplies the fact, or rules it out in `check.without`.

Run from a git worktree of a project, it checks that worktree, not the main checkout:

- It finds the project through the worktree's main checkout.
- It sets `TOOLKIT_WORKTREE`, so every tool it runs reads the worktree's files.
- It gives the app a free port, so parity never measures the main checkout's server.
- It copies the main checkout's accepted parity measurements once, as they are not in git.
- It reads the main checkout's docs site while the project folder is unchanged.
- Without an upstream branch it counts commits from `origin`'s default branch.

It redirects the one design system it found; in a repo with several, the others still read the main checkout. Files git does not hold, such as `.env.local`, come from the project's own worktree setup, or the gates that need them go red.

| Option | What it does |
|---|---|
| `--plan` | runs only the cheap gates and lists the rest. `bin/closing` reads it. |
| `--quick` | skips the gates that measure: the browser gates and the round trip, which takes the measuring lock. Under a minute, for the check before work; the push runs them all. |
| `--no-browser` | skips the browser gates |

| File | What it is |
|---|---|
| `check.mjs` | every gate the toolkit holds a project to, in one entry |
| `loop.mjs` | the helpers the gates share for trailers and renders |
| `pre-push.mjs` | the push hook, which runs the repo's `bin/check` |
| `validate.mjs` | what the code target cannot draw as designed, off the stored snapshot |
| `init.mjs` | connects a code repo, as below |
| `test-loop.mjs`, `test-init.mjs`, `test-pre-push.mjs`, `test-check.mjs` | the tests, each over a throwaway repo |

[REFERENCE.md](REFERENCE.md#files) says what each file does in full, and lists the gates.

## Connect a code repo

A project whose code lives in a repo of its own connects it. Then each snapshot lands in the repo, and the token build runs after it. The repo's check and push hook run the toolkit's gates. 

The repo is `~/Projects/<label>/`, with the project's design-system files in `figma-design-system/` at its root. [Setup](../../docs/setup.md) shows how to start one. Write the context document first, then:

```sh
node ~/Projects/toolkit/tools/project-check/init.mjs --repo ~/Projects/<label> [--project <label>] [--dry-run]
```

It overwrites nothing. A file or setting already there is kept and reported, with what it lacks. `--dry-run` says what it would write and writes nothing. The project is the one the repo's `snapshot.config.json` names, else `--project`, else the repo's folder name. What it does:

1. **Routes snapshots to the repo**, in the context document's `snapshot-routing` block.
2. **Writes `snapshot.config.json`**, whose `after` runs `bin/tokens` after every library snapshot.
3. **Writes `bin/tokens`**, the token build ([tools/tokens](../tokens/README.md)).
4. **Writes `bin/check`**, running `check.mjs`. The repo's own steps go beside that line.
5. **Writes the push hook** `.githooks/pre-push`, a shim handing the push to `pre-push.mjs`, and sets `core.hooksPath`.
6. **Runs `check.mjs --plan`** and lists what is left to a person.

[REFERENCE.md](REFERENCE.md#what-initmjs-writes) has each step in full. What it leaves to a person, because each is a decision:

- the context document ([figma-context-capture](../../skills/figma-context-capture/SKILL.md));
- `pnpm add -D style-dictionary`;
- the `parity` mapping ([design-code-parity](../../skills/design-code-parity/SKILL.md));
- `styles`, the facts the stylesheet gates read ([tools/css-lint](../css-lint/README.md));
- each gate the plan shows RED.

A gate the project cannot feed yet is RED until it supplies the fact the line names. Or the project rules the gate out with a reason in `snapshot.config.json`:

```json
"check": {
  "exempt":  ["content/"],
  "renders": ["src/", "public/"],
  "without": { "parity": "no coded components yet", "pinned": "no Figma token on this machine" }
}
```

`exempt` lists paths whose commits need no `Toolkit:` or `Knowledge:` trailer. `renders` lists the paths a rendered page follows. A push that changes none of them skips the browser gates. To list what would run:

```sh
node ~/Projects/toolkit/tools/project-check/check.mjs --repo . --plan
```

## The trailer

Every commit in a project names where what it taught went:

    Toolkit: standards/code-standard.md rule 64
    Toolkit: none — the copy of one posting

A path must exist in the toolkit; `none` takes three words of reason. A commit that touches only `check.exempt` paths needs none.

A commit that touches an interface file also names the knowledge pages it was built from (toolkit-standard §D 21). An interface file is markup, a component or a stylesheet, not a story or a parity fixture (`tools/shared/knowledge.mjs`). Each page is a file under the toolkit's `knowledge/`:

    Knowledge: knowledge/ui/patterns/dialogs.md, knowledge/ui/design/visual.md
    Knowledge: none — a colour token renamed, nothing drawn differently

## Test

```sh
for t in tools/project-check/test-*.mjs; do node "$t" || exit 1; done
```
