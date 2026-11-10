# Audit lite

Audits every component in the open Figma library and saves one Markdown report. Upload the report to Claude (claude.ai, the desktop app or Claude Code) and type **show me results**: Claude asks whether to show them in the chat or as a page, judges the findings, and shows the fix queue in four buckets (safe fixes, manual fixes, decisions, breaking changes).

It is the components audit with nothing else to install: no bridge plugin, no toolkit checkout, no Node, no project setup. The scanner is the same one [figma-components-audit](../../skills/figma-components-audit/SKILL.md) runs, copied in by `sync.mjs`.

## Run

1. Figma desktop → Plugins → Development → Import plugin from manifest → this folder's `manifest.json`.
2. Open the library, run **Audit lite**, press **Run audit**. The report downloads as `audit-<file>-<date>.md`.
3. Upload the report to a Claude chat, type `show me results`, and answer chat or page.

On a 71-component library Claude's reply takes about a minute, most of it writing the tables.

A changed manifest needs a re-import; "run last plugin" will not pick it up.

## What it does not do

- It runs on the toolkit's house conventions, not the library's own: the report lists them, and Claude drops a finding that only says the library follows a different convention. Checks that need the library's own scales or collection names do not run, and the report says which.
- It checks components only: not the file as a whole (page order, names that differ only in case), the code-target validator or the token link check.
- It fixes nothing, keeps no record and has no dashboard. The full audit ([figma-project-audit](../../skills/figma-project-audit/SKILL.md)) does all of that.

## Files

- `code.js`: the plugin. Its generated block (the scanner, the judging prompt, the buckets, the universal conventions, the house settings, `instructions.md` and `report.html`) is written by `node plugins/audit-lite/sync.mjs`, never by hand; `bin/check` fails when it differs from its sources.
- `instructions.md`: what Claude does with the report. `report.html`: the page Claude fills in.
- `tests/test-audit-lite.mjs`: builds a report from the scanner's fixture and renders the page.

## Data this plugin stores

None. It reads the file and writes nothing to it; the report is a download.
