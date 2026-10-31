# History — skill-standard

- 1.6.2 (2026-10-31): §B 4 shows the ui-base markers as `vN`, not a version the baseline has left; no rule changed.
- 1.6.1 (2026-10-31): §B 1, 2 and 8 are checked by figma-plugin-creator's `scripts/conformance.mjs`, which `standards/tests/check.sh` runs over `plugins/` in place of its own plugin section; §B 2 adds the sync APIs dynamic-page refuses and a fetch under `["none"]`. No rule changed.
- 1.6.0 (2026-10-31): §B 8: the audit stamp names the standard it was audited against, `skill-standard` or, before the merge, the retired `plugin-standard`, and `check.sh` warns on one naming no such file or a version that file never had (four plugins named versions of neither as "standard").
- 1.5.0 (2026-10-31): §A clause H: a skill may run toolkit tools, standards and knowledge pages by repo path, which bin/get takes with it; never another skill's files.
- 1.4.5 (2026-10-30): *Verifying a skill*: the ds-model-routing row is read when a skill is added; `check.sh` never warned on a missing one, as the line claimed.
- 1.4.4 (2026-10-29): §B 4's ui-base copies are written by `plugins/_shared/sync.mjs`, whose `--check` `standards/tests/check.sh` runs; the marker names it. A missing block and a stale plugin-creator asset now error, as any differing copy does (they warned).
- 1.4.3 (2026-10-29): §A clause G cites toolkit-standard §D 23, the root principle it applies to a skill; no rule changed.
- 1.4.2 (2026-10-14): tool paths follow the move of the toolkit's own checks to tools/toolkit-check and of the project registry to tools/snapshot/projects.cjs; no rule or behaviour changed.
- 1.4.1 (2026-10-14): clause H's check is check.sh's "reads outside its folder"; share-skill.sh is retired (the repo is shared whole).
- 1.4.0 (2026-10-14): §A clause D's carve-out — a walk record identifies its project by a fixed stand-in ("Project A"), never its name or a `projects/<label>/` path (toolkit-standard §D 6).
- 1.3.0 (2026-10-11): clause E: a test selects by a stable key, never by wording.
- 1.2.3 (2026-10-08): clause E: a case names assertions that exist, checked by check-runs.
- 1.2.2 (2026-10-08): *Reviewed:* markers name their prompt; figma-standard now holds the naming rules.
- 1.2.1 (2026-10-08): §B rules gain their reasons; clauses B and D marked *Reviewed:*, which is what they are.
- 1.2.0 (2026-10-08): §A clause H states that a skill reads only its own files, which the root cited and no clause said.
- 1.1.0 (2026-10-08): §A clause A: a skill's history moves to CHANGELOG.md beside SKILL.md, one line per version.
- 1.0.0 (2026-10-08): split from toolkit-standard 2.0.0, carrying its Parts A and B unchanged in substance; their earlier history is in `toolkit-standard.md` here.
