# Design System Toolkit — working rules

This repo is the live source for the skills installed at `~/.claude/skills`: those are symlinks into `skills/` (`install.sh`), so an edit here is live at once.

The rules live in the standards. This file says how a session works and points at them; it never restates a rule a standard owns. `check.sh` warns when it outgrows its budget (`[CL]`). Each line below was bought by a real loss, and the account of each is in `git log -p CLAUDE.md`.

## The standards

- [`toolkit-standard`](standards/toolkit-standard.md) is the root: §C how a rule is admitted, enforced, tested, changed and retired; §D the ecosystem — one job, one owner (§D 1); nothing shared buried in a project (§D 2); project-agnostic (§D 6); the feedback loop (§D 8, §D 13); a project's truth in its context document, in `~/Projects/<label>/figma-design-system/` (§D 12). Its table lists the rest: [`skill-standard`](standards/skill-standard.md) (a skill, a plugin), [`figma-standard`](standards/figma-standard.md) (a library in Figma, and every name in it), [`snapshot-standard`](standards/snapshot-standard.md), [`code-standard`](standards/code-standard.md). File a rule in the one that owns its subject; what two share goes in the root.
- A project's context document outranks a design or naming rule; an explicit instruction in the session outranks both.

## Every piece of work

1. **Before.** Read the standard that governs the work (new UI work: also the `knowledge/` pages for what it builds, §D 21; other code: code-standard), run `bin/check` (a red you did not cause is a finding to report), and ask §D 0's questions before writing anything new.
2. **A skill or a standard.** A skill meets skill-standard (*Verifying a skill*) and a standard meets toolkit-standard §C; its cases are walked, and the version and its history line move in the same commit, unless the change is confined to `tests/` (skill-standard §A clause A). A case that fails blocks the commit: fix the skill or the case, and say which. A production bug gets a case.
3. **A project.** Every commit carries `Toolkit: <toolkit file>` or `Toolkit: none — <why>`, and one touching interface files `Knowledge: <knowledge page(s)>` or `Knowledge: none — <why>`, checked at push (§D 13, §D 21). A fix the next project would want lands in the toolkit in the same change, and the project calls it (§D 2).
4. **After.** `bin/check` again, then `bin/closing`: it lists what is open and asks the questions no script answers; the Stop hook runs it at a turn's end. Commit and push what you changed: finished means shipped.
5. **Full-size work** is gated (toolkit-standard §D 13, `tools/claude-hooks/gates.mjs`): a plan before the edit that crosses the line, an independent review before it is reported or pushed, and what it taught, what stays open and which READMEs it changed, said at its end. Fix beyond the scope what the work finds broken; leave nothing loose unnamed.

## Session rules

These are owned here.

- **Stage your own paths, never `git add -A`.** Other sessions work in this repo; a sweep commits their work under your message.
- **One writer per path at a time.** Hand over with nothing uncommitted.
- **A merge commit stages every file its resolution touched**, the version bumps beside a conflict included, and `git status` shows nothing of the merge's after it: bin/check reads the tree, so it stays green over what the commit left out.
- **Work another session left uncommitted for over a day** (`bin/check` warns): read it, then commit it as theirs or remove it, and say which.
- **Never overwrite a section you have not read.** Prefer targeted edits; a lost section does not announce itself.
- **After a bulk text edit, read the hits; do not count them.** `check.sh`'s `[MD]` catches two shapes of damage, not the rest.
- **A red check is read whole before anything is said about it.** Name every failure in `bin/check`'s closing summary and fix what is yours; never propose `--no-verify` on a cause you guessed from part of the output.
- **Re-verify a finding before acting on it.** A probe that returns nothing is a finding about the probe, never a clean result.
- **toolkit-standard §D 0's questions are asked of every change**: no loosening, no slower run, what users see, one source for every fact, and the rest; `bin/closing` prints them.
- **Changed a rule, deleted or moved a file?** `check-standards.mjs` resolves every rule citation; grep for anything it does not read (CI workflows, file paths in prose).
- **Name the gaps before saying done:** what never met real input, and what stays open and why.
- **Close the gap you found in the same change.** "Not yet" in a summary is the gap announcing itself (toolkit-standard §D 10).
- **Machinery earns its place like a rule:** a check ships for something it would have caught. Net-additive three times running, remove something.
- **Say project, never client**, in skills, standards and commits.
- **A stalled fan-out review keeps its findings** in `~/.claude/projects/<project>/subagents/agent-<id>.jsonl`; salvage them rather than run it again.
