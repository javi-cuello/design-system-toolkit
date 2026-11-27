# Shared

This folder holds small libraries that more than one tool imports. Keeping them in one place gives each one a single definition. A file belongs here only when two or more tools import it. A file used by a single tool lives in that tool's folder.

## Status

Most files are libraries that other tools import. A few also run as commands behind `bin/check`, `bin/worktree` and `bin/land`.

## The commands

```sh
node tools/shared/check-cache.mjs <repo> [--quick] [--no-fix] [--serial | --workers=N]   # bin/check's front door
node tools/shared/check-cache.mjs --commit <repo> <commit>         # the pre-push check of one commit
node tools/shared/lock.mjs --run <what> -- <command…>              # run a command under the measuring lock
node tools/shared/lock.mjs --who                                   # which slots are held, and by what
node tools/shared/worktree.mjs <work>                              # make or find a work's worktree
node tools/shared/worktree.mjs <work> --join                       # join a worktree another session holds
node tools/shared/model-routing.mjs                                # print the model routes
node tools/shared/kb-quotes.mjs <page.md> [--from <ref>]           # check a knowledge page's quotes against their sources
node tools/shared/kb-quotes.mjs <page.md> --no-render              # the same, raw pages only, no headless Chrome
```

`bin/land` runs `land.mjs`. The [bin README](../../bin/README.md) documents the `bin/` commands.

## What is in the folder

| File | What it gives |
|---|---|
| `walk.mjs` | one walk of a repo's files |
| `repo-config.cjs` | reads a repo's `snapshot.config.json` |
| `push-hook.mjs` | whether a repo's pushes run its check |
| `check-cache.mjs` | `bin/check`'s lock and green-run cache |
| `lock.mjs` | the one measuring lock |
| `worktree.mjs` | a worktree per piece of work |
| `land.mjs` | `bin/land`, the one way work reaches main |
| `cdp.mjs` | the Chrome DevTools client |
| `chromes.mjs` | finds the headless Chromes `cdp.mjs` started and kills those whose parent is gone |
| `free-port.mjs` | a free port for tests |
| `origin.mjs` | whether a request comes from Figma |
| `real-path.mjs` | a path in its on-disk spelling |
| `output.mjs` | the same written file for the same input |
| `import-closure.mjs` | the files a module runs through |
| `stale-self.mjs` | a service restarting once a file it bound changes |
| `dialect.cjs` | which English spelling a project uses |
| `names.js` | how a component's Figma name is shown |
| `prop-attr.mjs` | a prop's name as an HTML attribute |
| `colour.js` | sRGB, contrast ratio and OKLab maths |
| `text-units.js` | line height and spacing per font size |
| `knowledge.mjs` | the knowledge pages for an interface file |
| `kb-quotes.mjs` | each quote on a knowledge page, checked against the page it cites |
| `project-knowledge.cjs` | a project's product file, decisions and guidance |
| `code-inventory.mjs` | what a code library contains |
| `model-routing.json` | the model and effort per task family |
| `model-routing.mjs` | reads `model-routing.json` |

Each file's full job, and who uses it, is under [What each file gives](REFERENCE.md#what-each-file-gives).

## How it fits

- [REFERENCE.md](REFERENCE.md) holds each file's detail.
- [tools/parity](../parity/README.md), [tools/ui-check](../ui-check/README.md) and the docs checks drive Chrome through `cdp.mjs`.
- Some files are copied, not imported, into a plugin or skill. A test here holds each copy to its source.

## Test

```sh
for t in tools/shared/test-*.mjs; do node "$t"; s=$?; [ $s = 0 ] || [ $s = 77 ] || exit 1; done   # 77: skipped (test-cdp.mjs without Chrome)
```

See [Tests](REFERENCE.md#tests).
