# Changelog — component-guidelines
Format: Keep a Changelog. Versioning: SemVer.

## [2.0.4] - 2026-10-08
### Changed
- Comments cite the standard that owns each rule (skill-standard §B 4 for the ui-base block).

## [2.0.3] - 2026-09-16
### Fixed
- **Secondary buttons turned brand-blue under the pointer.** ui-base's `button:hover` (0-1-1) beat `.btn-secondary` (0-1-0), so every secondary button in the plugin took the primary hover — the collision §4 of the plugin standard warns about, on a state rather than on sizing. Fixed in the canonical `plugins/_shared/ui-base.css` and re-inlined (block is now **ui-base v2**), so it is fixed for every plugin at once rather than patched here.

## [2.0.2] - 2026-08-09
### Changed
- `// @ts-check` moved from line 5 to line 2, where skill-standard §B 1 requires it (that rule was added to the standard in v1.5.0, having previously lived only in the creating skill's checklist). The three-line rationale comment now follows it. Type-checking was already on — TypeScript honours the pragma anywhere in the leading comment block — so this is findability, not a fix.
- Re-audited against skill-standard §B v1.5.0; stamp moved from v1.1.0. **No findings.** The rules added since 1.1.0 do not bite here: the collision-safety rules (1.2.0, extended 1.3.0) need bespoke controls to collide with ui-base's bare element selectors, and this plugin declares **no `<button>`, `<input>`, `<select>` or `<textarea>` at all**; §9 (network/CORS) needs a fetch, and there is none; §10 (settings hygiene) needs a settings surface, and there is none; §11 is a debugging note. Also clean on §3's banned sync APIs and complete on §1's file list.

## [2.0.0] - 2026-08-05
### Changed — BREAKING (rewrite)
- Replaced compiled-TypeScript artifact (no source in repo) with hand-written vanilla JS, matching the other four plugins and skill-standard §B v1.1.0.
- Description parser rewritten: the old code matched Markdown headings (`## Usage`) with `-` bulleted items and a Spanish-heading fallback — neither observed in real project descriptions. Real descriptions (verified against Project A's Button component) use a plain heading word alone on a line ("Usage", "Don't") followed by one item per line, no leading dash. The old parser would have silently matched nothing against real data.
- Dropped the undocumented Spanish (Uso/No hacer) language detection — no evidence any project's descriptions use it; can be re-added with a real example if needed.
- ui-base v1 inlined; badge colours moved from hardcoded hex to `--figma-color-success/danger` tokens (fall back to the old hex if the token is unavailable).
- Behaviour preserved from the original: floating panel repositions below the selected instance, auto-resizes to content height, refreshes on selectionchange, resolves description from the component or its parent Component Set.

## [1.0.0] - 2026-08-05
### Changed
- (Previous compiled-artifact version) Conformed manifest to skill-standard §B v1.0.0. Superseded by 2.0.0 above.
