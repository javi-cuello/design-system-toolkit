# Changelog — figma-tokens-examples

- 1.4.0 (2026-10-30): `rows` mode in `scripts/tokens-mapping.js` lays out a section's rows from the chosen sample — labels, `Empy` cells, §3's chain and each token cell's variant and label — and marks a name that resolves to nothing `[check-token]`; tested in node. Case T8.
- 1.3.2 (2026-10-08): history moved to CHANGELOG.md, one line per version; reasons it carried moved into the skill.
- 1.3.1 (2026-10-03): `token` mode catches per cell, reporting `write failed: …` and writing the rest; test for the `Stroke` fills check. T7 extended.
- 1.3.0 (2026-10-03): bind and audit become `scripts/tokens-mapping.js` (`token`, `audit` modes), tested against mock nodes; names resolve against bound library colours too. Case T7.
- 1.2.3 (2026-10-01): the anatomy table's last escaped pipe becomes `·`. Prose only.
- 1.2.2 (2026-09-01): three anatomy-table cells use `·` instead of an escaped pipe. Prose only.
- 1.2.1 (2026-08-09): §2's `Text` swatch layer corrected from `A` to `Aa`; a lookup returning nothing is a finding about the name.
- 1.2.0 (2026-08-08): new step 0: record the page as authored in the context document, or a refill erases it.
- 1.1.2 (2026-08-08): `tests/cases.md` added, five cases, not walked. No behaviour change.
- 1.1.1 (2026-08-08): the `#id`-style key example renumbered to the `0:` prefix. Documentation only.
- 1.1.0 (2026-08-05): section names and taxonomy are per-project conventions; context-document-first (env-aware); project vocabulary.
- 1.0.x: pre-refactor.
