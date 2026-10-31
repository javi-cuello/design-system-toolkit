# Project check

toolkit-standard §D 13: every change goes round one loop — standards, work, lesson, back to the toolkit — and each step has a trigger. This folder holds the two triggers a project repo fires: its check and its push.

| File | What it is |
|---|---|
| `check.mjs` | Every gate the toolkit holds a project to, in one entry: `node tools/project-check/check.mjs --repo <dir> [--no-browser] [--plan]`. The stylesheet gates, the front-end standard, the spec round-trip, one owner per job, the pinned snapshot, the commit trailers (`Toolkit:` and, on interface commits, `Knowledge:`), the push hook, a check's verdict reaching whoever runs it (code-standard 49), parity, the markup contract, axe-core's WCAG 2.2 A and AA rules on the same pages, and overflow. A gate a project cannot feed is RED until the project supplies the fact or rules it out in `check.without`; `--plan` runs only the cheap gates and lists the rest (`bin/closing` reads it) |
| `loop.mjs` | `where` (is an answer a toolkit file that exists, or a `none` with its reason), `undeclared` (the commits in a range with no valid `Toolkit:` trailer, content-only commits aside), `renderChanged` (did a push change anything a render follows), `pages` and `unread` (the interface commits with no valid `Knowledge:` trailer) |
| `pre-push.mjs` | The push hook: lets a content-only push through, skips a tree that already passed on this clone, refuses a push of anything but the checked-out commit with nothing uncommitted beside it (`bin/check` reads the working tree), otherwise runs the repo's `bin/check` with `CHECK_BASE` set |
| `validate.mjs` | What the code target cannot draw as designed, off the stored snapshot (component-validator's engine). The router runs it after every library snapshot, for every project |
| `test-loop.mjs` | `loop.mjs` over a throwaway repo; run by `bin/check` |
| `init.mjs` | Connects a code repo: writes what *Connect a code repo* lists where nothing is, keeps what is, and shows the gate plan |
| `test-init.mjs` | `init.mjs` over a throwaway repo: a dry run writes nothing, a second run keeps everything; run by `bin/check` |
| `test-pre-push.mjs` | the push hook over a throwaway repo: it checks only the commit checked out with nothing beside it, and caches only what it checked |

## Connect a code repo

A project whose code lives in a repo of its own connects it so that each snapshot lands in the repo, the token build runs after it, and the repo's check and push hook run the toolkit's gates. The repo is `~/Projects/<label>/`, with the project's design-system files in `figma-design-system/` at its root ([setup](../../docs/setup.md) shows how to start one). Write the context document first, then:

```sh
node ~/Projects/toolkit/tools/project-check/init.mjs --repo ~/Projects/<label> [--project <label>] [--dry-run]
```

It overwrites nothing: a file or setting already there is kept and reported, with what it lacks (a `bin/check` that does not run the gates, a hook that does not hand the push on). `--dry-run` says what it would write and writes nothing. The project is the one the repo's `snapshot.config.json` names, else `--project`, else the repo's folder name: a repo kept apart from its project's home names it (the contract editor's Settings does). What it does:

1. **Routes snapshots to the repo**: adds `"repo"` to the context document's `snapshot-routing` block. Without it the snapshot stays in the project's home and nothing in the repo runs.
2. **Writes `snapshot.config.json`**: `toolkit`, `project`, the `paths` that keep the snapshot inside `figma-design-system/` (without them it is written at the repo root), `paths.styles` for the generated token CSS and Sass (a default to move), and `after`, which runs `bin/tokens` after every library snapshot.
3. **Writes `bin/tokens`**, the token build ([tools/tokens](../tokens/README.md)).
4. **Writes `bin/check`**, running `check.mjs`; the repo's own steps go beside that line.
5. **Writes the push hook** `.githooks/pre-push`, a shim handing the push to `pre-push.mjs`, and sets `core.hooksPath`.
6. **Runs `check.mjs --plan`** and lists what is left to a person.

What it leaves to a person, because each is a decision: the context document ([figma-context-capture](../../skills/figma-context-capture/SKILL.md)); `pnpm add -D style-dictionary`; the `parity` mapping ([design-code-parity](../../skills/design-code-parity/SKILL.md)); `styles`, the facts the stylesheet gates read ([tools/css-lint](../css-lint/README.md)); and each gate the plan shows RED.

The gates are `styles`, `tokens`, `componentStyles` (each component's generated stylesheet matches its contract: `to-code.mjs --check`), `specs`, `owned`, `pinned`, `lessons`, `knowledge`, `hook`, `verdicts`, `parity`, `structure`, `axe` and `overflow`. A gate the project cannot feed yet is RED until it supplies the fact the line names, or rules the gate out with a reason in `snapshot.config.json`:

```json
"check": {
  "exempt":  ["content/"],
  "renders": ["src/", "public/"],
  "without": { "parity": "no coded components yet", "pinned": "no Figma token on this machine" }
}
```

`exempt` lists paths whose commits need no `Toolkit:` or `Knowledge:` trailer; `renders` lists the paths a rendered page follows, so a push that changes none of them skips the browser gates. `node ~/Projects/toolkit/tools/project-check/check.mjs --repo . --plan` lists what would run.

## The trailer

Every commit in a project names where what it taught went:

    Toolkit: standards/code-standard.md rule 64
    Toolkit: none — the copy of one posting

A path must exist in the toolkit; `none` takes three words of reason. A commit that touches only `check.exempt` paths needs none.

A commit that touches an interface file (markup, a component, a stylesheet; not a story or a parity fixture: `tools/shared/knowledge.mjs`) also names the knowledge pages it was built from (toolkit-standard §D 21), each a file under the toolkit's `knowledge/`:

    Knowledge: knowledge/ui/patterns/dialogs.md, knowledge/ui/design/visual.md
    Knowledge: none — a colour token renamed, nothing drawn differently
