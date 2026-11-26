# Changelog — checkout

- 2.1.0 (2026-11-27): `/checkout --prune` (step 5) lists the project's sessions, folds each stale one's open items, then prunes; the default is unchanged. C3 and C4 live again, for that mode.
- 2.0.0 (2026-11-27): this session only: step 1 acts on its own items; the memory check reads its project's folder; session pruning and unregistered worktrees dropped. C3, C4 retired; C6 added.
- 1.1.0 (2026-11-26): step 2 sends how the user likes to work to CLAUDE.md, never memory (§D 25 2.52.0); the report ends by asking for /clear.
- 1.0.0 (2026-11-26): the end-of-session housekeeping: bin/closing, the session folded into memory, every memory folder checked (§D 25), stale side sessions folded and pruned, worktrees and the plan settled.
