# Eval cases — checkout (v2.1.0)

**Walked: 2026-11-27 for 2.1.0** — C3 and C4 brought back for `--prune` and traced to step 3, which runs before the memory check; C2, C5 and C6 retraced to the new numbering and *Not this skill*. `node tools/memory-check/test-sessions.mjs` 3 of 3.

**Walked: 2026-11-27 for 2.0.0** — C1, C2, C5 and C6 traced to the new steps; C3 and C4 retired with the steps they held. `node tools/memory-check/test-check.mjs` 11 of 11, `node tools/memory-check/test-sessions.mjs` 3 of 3.

**Walked: 2026-11-26 for 1.0.0** — C1–C4 traced to the steps; the scripts' own suites: `node tools/memory-check/test-check.mjs` 8 of 8, `node tools/memory-check/test-sessions.mjs` 2 of 2. Run once by hand on the machine the same day: the memory check found 7 findings and 3 warnings across eleven folders, and the session list named the toolkit's three main sessions.

## C1 · Open work is closed before anything is tidied — *traced*
Fixture: a session in the toolkit with its own uncommitted edit in a worktree, and another session's uncommitted file in a project.
Assert: step 1 lists the session's own items before `bin/closing`'s cross-check; the session's own edit is committed on its branch and landed with `bin/land`; the other session's file is left as it is, neither committed nor named in the report.
Negative: memory written before the work is closed; another session's file committed under this session's message, or listed in the report.
Traced: 2026-11-27 for 2.0.0 — to *Steps* 1 and *Not this skill*.

## C2 · The session's lessons go to their homes, and the memory passes the check — *traced*
Fixture: a session that learned a rule about commit trailers, a new open item in the project, and a fact its git log records; the project's memory folder holds two files.
Assert: the rule goes to its standard or CLAUDE.md, not memory; the open item lands in the project's one memory file under a heading dated `(as of YYYY-MM-DD)`; the git-log fact is written nowhere; the two files are merged into one and `check.mjs` reports this folder green.
Negative: the rule copied into memory; a new memory file beside the old one; the check run and its finding left.
Traced: 2026-11-27 for 2.1.0 — to *Steps* 2 and 4.

## C3 · With --prune, only stale side sessions are pruned, and only after they are folded — *traced*
Fixture: `/checkout --prune`; the project has this session (live, unnamed), a named main session 40 days old, an unnamed session from yesterday, and an unnamed session 10 days old whose last message leaves an item open.
Assert: step 3 lists all four with this session kept, reads only the 10-day-old session's own messages, folds its open item into the memory, then `--prune` deletes it and its folder; the named, the recent and this session stay.
Negative: a named or live session deleted; the stale one pruned before its open item is folded; a transcript read whole.
Traced: 2026-11-27 for 2.1.0 — to *Step* 3; `tools/memory-check/test-sessions.mjs` holds the pruning.

## C4 · With --prune, a project with no named main session is asked to name one — *traced*
Fixture: `/checkout --prune` in a project whose sessions are all unnamed.
Assert: the report asks the user, under "Needed from you:", to run `/rename <project>` in the main session; nothing is renamed for them.
Negative: the request buried in a paragraph; a session's transcript edited to name it.
Traced: 2026-11-27 for 2.1.0 — to *Steps* 3 and 6.

## C5 · A working preference found at checkout goes to CLAUDE.md, and the report asks for /clear — *traced*
Fixture: a session in which the user said "always show me a screenshot before pushing UI".
Assert: step 2 writes nothing of it to memory; the report proposes it for `~/.claude/CLAUDE.md` with the user's go; the memory check stays green; the report's last line asks for `/clear`.
Negative: a memory section "How the user likes to work" (memory-check refuses it as a `rule` or `undated` finding); a report that ends without the `/clear` ask.
Traced: 2026-11-27 for 2.1.0 — to *Steps* 2 and 6.

## C6 · Only this session is closed: other projects, folders and sessions are left alone — *traced*
Fixture: `/checkout` without `--prune`, in a session in the toolkit that landed one worktree and left one background task running; `bin/closing` also lists another project's uncommitted file, the memory check reports a finding in another project's folder, and the toolkit has a 10-day-old unnamed side session.
Assert: the session's landed worktree is removed and its task stopped; the other project's file, the other folder's finding and the side session are neither touched nor mentioned in the report; the plan is settled.
Negative: another project's item fixed or listed; another memory folder edited; a session listed or pruned.
Traced: 2026-11-27 for 2.1.0 — to *Steps* 1, 4, 5 and *Not this skill*.
