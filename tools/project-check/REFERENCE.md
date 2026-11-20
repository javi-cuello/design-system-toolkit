# Project check reference

Detail moved from [README.md](README.md).

## Files

| File | What it is |
|---|---|
| `check.mjs` | Every gate the toolkit holds a project to, in one entry: the command in the README. The stylesheet gates, the front-end standard, the spec round-trip, one owner per job, the pinned snapshot, the commit trailers (`Toolkit:` and, on interface commits, `Knowledge:`), the push hook, changed code using the system's components and tokens (`validate`), a check's verdict reaching whoever runs it (code-standard 49), parity, the markup contract, axe-core's WCAG 2.2 A and AA rules on the same pages, and overflow. A gate a project cannot feed is RED until the project supplies the fact or rules it out in `check.without`; `--plan` runs only the cheap gates and lists the rest (`bin/closing` reads it) |
| `loop.mjs` | `where` (is an answer a toolkit file that exists, or a `none` with its reason), `undeclared` (the commits in a range with no valid `Toolkit:` trailer, content-only commits aside), `renderChanged` (did a push change anything a render follows), `pages` and `unread` (the interface commits with no valid `Knowledge:` trailer) |
| `pre-push.mjs` | The push hook: lets a content-only push through, skips a tree that already passed on this clone, refuses a push of anything but the checked-out commit with nothing uncommitted beside it (`bin/check` reads the working tree), otherwise runs the repo's `bin/check` with `CHECK_BASE` set |
| `validate.mjs` | What the code target cannot draw as designed, off the stored snapshot, through the engine in `tools/component-validator/`. The router runs it after every library snapshot of a project with a code repo (`deliver.cjs`), once the snapshot has stored components; a project with no repo is validated by the audit service's validator stage instead |
| `test-loop.mjs` | `loop.mjs` over a throwaway repo; run by `bin/check` |
| `init.mjs` | Connects a code repo: writes what *Connect a code repo* lists where nothing is, keeps what is, and shows the gate plan |
| `test-init.mjs` | `init.mjs` over a throwaway repo: a dry run writes nothing, a second run keeps everything; run by `bin/check` |
| `test-pre-push.mjs` | the push hook over a throwaway repo: it checks only the commit checked out with nothing beside it, and caches only what it checked |
| `test-check.mjs` | `check.mjs --plan` over a throwaway repo on the canonical layout: a project saying nothing in `paths` is held by the gates that read its stored specs, not skipped for want of a setting; the `validate` gate asks where the system's own code is, and run, is RED on a finding, waived by a ruling naming it, and RED on a base git cannot read |

## The gates

The gates are `styles`, `tokens`, `componentStyles` (each component's generated stylesheet matches its contract: `to-code.mjs --check`), `specs`, `owned`, `pinned`, `lessons`, `knowledge`, `hook`, `validate` (the code a push adds or changes, run through `tools/system-mcp/validate.mjs` against the built docs site; what it needs in `check.validate`, and how a §6 ruling waives a finding, is in `check.mjs`'s header), `verdicts`, `parity`, `structure`, `axe` and `overflow`.

## What init.mjs writes

A file or setting already there is kept and reported, with what it lacks: a `bin/check` that does not run the gates, a hook that does not hand the push on. A repo kept apart from its project's home names the project; the contract editor's Settings does.

1. **Routes snapshots to the repo**: adds `"repo"` to the context document's `snapshot-routing` block. Without it the snapshot stays in the project's home and nothing in the repo runs.
2. **Writes `snapshot.config.json`**: `toolkit`, `project`, the `paths` that keep the snapshot inside `figma-design-system/` (without them it is written at the repo root), `paths.styles` for the generated token CSS and Sass (a default to move), and `after`, which runs `bin/tokens` after every library snapshot.
3. **Writes `bin/tokens`**, the token build ([tools/tokens](../tokens/README.md)).
4. **Writes `bin/check`**, running `check.mjs`; the repo's own steps go beside that line.
5. **Writes the push hook** `.githooks/pre-push`, a shim handing the push to `pre-push.mjs`, and sets `core.hooksPath`.
6. **Runs `check.mjs --plan`** and lists what is left to a person.
