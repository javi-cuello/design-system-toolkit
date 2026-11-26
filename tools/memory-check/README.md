# Memory check

Claude Code keeps a memory folder and session transcripts for each project, under `~/.claude/projects/<folder>/`. Nothing else in the toolkit reads them. This folder holds the memory folders to one shape, toolkit-standard §D 25, and lists a project's sessions so the `/checkout` skill can prune the stale ones.

## Use

```sh
node tools/memory-check/check.mjs [--root <dir>] [--today YYYY-MM-DD]
node tools/memory-check/sessions.mjs [--folder <dir>] [--prune]
```

`check.mjs` checks every memory folder and prints one line per finding. It exits 1 on any error. A dated section past its age is a warning: re-check it, nothing refuses it.

`sessions.mjs` lists a project's sessions: named or not, live or not, and their age. With `--prune` it deletes the side sessions: unnamed, not live, older than a week. It never deletes the current session, a named one or a memory file.

The Stop hook calls `checkWritten()`. When a session writes a memory file into a folder that breaks the standard, the hook blocks the stop once with the findings.

| File | What it is |
|---|---|
| `check.mjs` | the memory check, and `checkWritten()` for the Stop hook |
| `limits.json` | the values it checks against, with where each comes from |
| `sessions.mjs` | the session lister and pruner |
| `test-check.mjs`, `test-sessions.mjs` | the tests, over throwaway folders |
