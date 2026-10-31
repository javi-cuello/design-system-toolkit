# History — house-standards

Retired on 2026-10-08: its rules moved to figma-standard, naming-standard and toolkit-standard §D, its values to `audit-settings.json`. A citation of `house rule N` in older history resolves through this map.

| Was | Now |
|---|---|
| house-standards rule 1 | figma-standard rule 1 |
| house rule 1 | figma-standard rule 1 |
| house-standards rule 2 | figma-standard rule 2 |
| house rule 2 | figma-standard rule 2 |
| house-standards rule 3 | figma-standard rule 8 |
| house rule 3 | figma-standard rule 8 |
| house-standards rule 4 | figma-standard rule 20 |
| house rule 4 | figma-standard rule 20 |
| house-standards rule 5 | figma-standard rule 24 |
| house rule 5 | figma-standard rule 24 |
| house-standards rule 6 | figma-standard rule 22 |
| house rule 6 | figma-standard rule 22 |
| house-standards rule 7 | figma-standard rule 16 |
| house rule 7 | figma-standard rule 16 |
| house-standards rule 8 | toolkit-standard §D 14 |
| house rule 8 | toolkit-standard §D 14 |
| house-standards rule 9 | figma-standard rule 17 |
| house rule 9 | figma-standard rule 17 |
| house-standards rule 10 | toolkit-standard §D 15 |
| house rule 10 | toolkit-standard §D 15 |
| house-standards rule 11 | toolkit-standard §D 16 |
| house rule 11 | toolkit-standard §D 16 |
| house-standards rule 12 | toolkit-standard §D 17 |
| house rule 12 | toolkit-standard §D 17 |
| house-standards rule 13 | toolkit-standard §D 18 |
| house rule 13 | toolkit-standard §D 18 |
| house-standards rule 14 | toolkit-standard §D 19 |
| house rule 14 | toolkit-standard §D 19 |
| house-standards rule 15 | figma-standard rule 11 |
| house rule 15 | figma-standard rule 11 |
| house-standards rule 16 | figma-standard rule 12 |
| house rule 16 | figma-standard rule 12 |
| house-standards rule 17 | figma-standard rule 4 |
| house rule 17 | figma-standard rule 4 |
| house-standards rule 18 | figma-standard rule 3 |
| house rule 18 | figma-standard rule 3 |
| house-standards rule 19 | figma-standard rule 15 |
| house rule 19 | figma-standard rule 15 |
| house-standards rule 20 | figma-standard rule 19 |
| house rule 20 | figma-standard rule 19 |
| house-standards rule 21 | figma-standard rule 18 |
| house rule 21 | figma-standard rule 18 |
| house-standards rule 22 | figma-standard rule 5 |
| house rule 22 | figma-standard rule 5 |
| house-standards rule 23 | figma-standard rule 9 |
| house rule 23 | figma-standard rule 9 |
| house-standards rule 24 | figma-standard rule 13 |
| house rule 24 | figma-standard rule 13 |
| house-standards rule 25 | figma-standard rule 21 |
| house rule 25 | figma-standard rule 21 |
| house-standards rule 26 | figma-standard rule 14 |
| house rule 26 | figma-standard rule 14 |
| house-standards rule 27 | figma-standard rule 6 |
| house rule 27 | figma-standard rule 6 |
| house-standards rule 28 | figma-standard rule 10 |
| house rule 28 | figma-standard rule 10 |
| house-standards rule 29 | figma-standard rule 7 |
| house rule 29 | figma-standard rule 7 |

- 1.28.0 (2026-10-07): rule 25 names slots: `Slot` by default, `Leading slot`/`Trailing slot` at either end, named for what they host when repeated.
- 1.27.0 (2026-10-07): rule 27 requires a component's sizes to be one unbroken run of the scale; `figma-components-audit` 2.17.0 checks it.
- 1.26.0 (2026-10-07): rule 25 adds `Has` for content variants, slots, position words and unique names; new rules 28 (layer roles) and 29 (parent owns part state); rules 4 and 21 extended.
- 1.25.0 (2026-10-07): adds the `audit-keys` and `rule-checks` blocks and property-naming defaults; rule 25 boolean `Show`; rule 15 pins `AUXILIARY` then `DEPRECATED`; `check-settings.mjs` added.
- 1.24.0 (2026-10-07): `audit-defaults` carries rule 26's deprecation markers; rule 26 and rule 27 checks added to the audit skills.
- 1.23.1 (2026-10-07): rule 27 sets size names only; measurements are the project's and one value per name is an ideal.
- 1.23.0 (2026-10-07): new rule 27, a lowercase t-shirt `Size` scale, largest first; `audit-defaults` gains the `Size` order.
- 1.22.0 (2026-10-07): rule 4 limits ` / ` to siblings; rule 23 rewritten; new rules 25 and 26; rule 24 extended; `familySeparator` a space; `Tables` added to rule 16.
- 1.21.1 (2026-10-07): rule 24 names the three skills that enforce it. Wording only.
- 1.21.0 (2026-10-07): new rule 24, the `🚧` status marker on components, stripped from all generated text.
- 1.20.2 (2026-09-22): rule 17 explains `Loading` on the State axis; code separates it, written as validator note WT1, never a W7 finding.
- 1.20.1 (2026-09-10): checkability note credits rules 4, 15, 20 and 23 to `figma-foundations-audit`. Citation fix only.
- 1.20.0 (2026-09-10): adds the `audit-defaults` block with rule 17, 1, 4 and 23 values; project keys override it per key.
- 1.19.0 (2026-09-10): first half of 1.20.0, option orders only.
- 1.18.1 (2026-09-10): enforcement note renames `figma-library-audit` to `figma-components-audit`. Wording only.
- 1.18.0 (2026-09-07): rule 15 states the page-list anatomy: `🔷 CATEGORY` header pages, `---` dividers, catch-all pinned last. Case C3.
- 1.17.0 (2026-09-01): new rule 23, a part takes its parent's name as prefix and its nested layer drops it; composed and multi-parent parts exempt.
- 1.16.0 (2026-08-20): new rule 22, a filling property sits directly below the property that reveals its layer; needs a read.
- 1.15.1 (2026-08-20): new rule 21, sentence case everywhere, with value-leaf and asset carve-outs and an elevation allowlist; rule 20's case paragraph replaced.
- 1.15.0 (2026-08-20): superseded by 1.15.1.
- 1.14.0 (2026-08-20): new rule 20, no two names may differ only in case.
- 1.13.1 (2026-08-14): checkability note records rule 15 as checked by `figma-library-audit` §3.8b.
- 1.13.0 (2026-08-13): rule 19's exemption widens to building-block pages, private or slot-only, matching the description tier.
- 1.12.0 (2026-08-13): rule 19 gains the private-parts exemption and the primary-component wording for `Matrix`.
- 1.11.1 (2026-08-13): rule 19's evidence updated from the full sweep (32 of 35 pages). Evidence only.
- 1.11.0 (2026-08-13): new section "Component documentation pages" and rule 19, the five-section page template.
- 1.10.0 (2026-08-13): new rule 18, `Disabled=True` sits immediately after its Rest sibling. Cases H1/H2 extended.
- 1.9.0 (2026-08-10): new section "Interaction states" and rule 17, Focus before Hover on the State axis.
- 1.8.1 (2026-08-10): rule 15's evidence corrected from four out-of-order pages to five. Evidence only.
- 1.8.0 (2026-08-10): new section "Page organisation", rules 15 (alphabetical order, markers) and 16 (category vocabulary). Case H9 added.
- 1.7.0 (2026-08-08): coverage is a documented command, not a checker section.
- 1.6.0 (2026-08-08): coverage computed from `projects/`; the `*Coverage:*` stamps removed; overrides declared as `**Overrides:** house rule N`.
- 1.5.0 (2026-08-08): adds a project denominator and `*Coverage:*` stamps to all rules. Cases H4–H5.
- 1.4.0 (2026-08-08): adds the retire-never-renumber policy; `check-standards.sh` resolves rule citations.
- 1.3.0 (2026-08-08): rules 4 and 6–11 gain reasons; checkability paragraph and the cite-the-handle rule added.
- 1.2.0 (2026-08-08): rule 12 hardened to never record live-readable state; new rules 13 and 14.
- 1.1.1 (2026-08-07): formatting only. No rule changed.
- 1.1.0 (2026-08-07): rule 5 states that hidden primitives are unreachable from consuming files.
- 1.0.0 (2026-08-05): initial set.
