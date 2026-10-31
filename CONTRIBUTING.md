# Working on the toolkit

How a change to the toolkit is made, checked and shipped.

- **Read the standard that governs the change first**: [toolkit-standard](standards/toolkit-standard.md) for anything here, [skill-standard](standards/skill-standard.md) for a skill or plugin. [`CLAUDE.md`](CLAUDE.md) is how a Claude session works in this repo.
- **Run `bin/check` before and after.** It runs every check and test the toolkit ships, in about six minutes; `bin/check --quick` runs the standards and scanners in under one. The push hook runs the whole of it.
- **A skill or standard change** bumps its version and history line in the same commit, and walks its `tests/cases.md`; a bug found in use becomes a case.
- **Nothing here names a project**, in code, prose or tests; `bin/check` refuses one. A lesson from a project is written with a stand-in ("one project", "Project A").
- **The Claude Code hooks** ([tools/claude-hooks](tools/claude-hooks/README.md)) keep a session to this loop: they say what is open at its start and what a turn left open with the next message.
- **Full-size work is gated, small work is not.** A script measures the change; past the line (see the hooks' README) the work is planned before it is built (goal, who reads what it touches, what nearby is broken, budget), reviewed by fresh agents before it is reported or pushed, and ends saying what went back to the toolkit, what stays open and which READMEs it updated. Nobody has to ask for any of it.

Because `install.sh` links the skills rather than copying them, an edit here is live in Claude Code at once.
