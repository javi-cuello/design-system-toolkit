# Audit lite

Audits every component in the open Figma library, and the file as a whole, and saves one Markdown report. Upload the report to Claude (claude.ai, the desktop app or Claude Code) and type **show me results**: Claude asks whether to show them in the chat or as a page, judges the findings, and shows the fix queue in four buckets (safe fixes, manual fixes, decisions, breaking changes).

It is the components and foundations audits with nothing else to install: no bridge plugin, no toolkit checkout, no Node, no project setup. The scanners are the ones [figma-components-audit](../../skills/figma-components-audit/SKILL.md) and [figma-foundations-audit](../../skills/figma-foundations-audit/SKILL.md) run, copied in by `sync.mjs`.

## Run

1. Figma desktop → Plugins → Development → Import plugin from manifest → this folder's `manifest.json`.
2. Open the library, run **Audit lite**, and, if the project has a context document, pick it with **Use a context document…**.
3. Press **Run audit**. The report downloads as `audit-<file>-<date>.md`.
4. Upload the report to a Claude chat, type `show me results`, and answer chat or page.

On a 71-component library Claude's reply takes about a minute, most of it writing the tables.

A changed manifest needs a re-import; "run last plugin" will not pick it up.

## What it does not do

- Without a context document it runs on the toolkit's house conventions, not the library's own: the report lists them, Claude drops a finding that only says the library follows a different convention, and offers to draft a starter context document from the file's discovery. Checks whose settings are not set do not run, and the report says which.
- With one, it reads the document's settings for this file (refused, with the reason, when it has none) and its rulings, the way the full audit does. It never writes the document: Claude offers a decision as a rulings-log row to copy.
- It does not run the code-target validator, the token link check, or the foundations audit's token-library and icon-library checks, which read a stored snapshot through Node.
- It fixes nothing, keeps no record and has no dashboard. The full audit ([figma-project-audit](../../skills/figma-project-audit/SKILL.md)) does all of that.

## Files

- `code.js`: the plugin. Its generated block (the components and foundations scanners, the full audit's context-document readers and discovery, the judging prompt, the buckets, the universal conventions, the house settings, `instructions.md` and `report.html`) is written by `node plugins/audit-lite/sync.mjs`, never by hand; `bin/check` fails when it differs from its sources.
- `instructions.md`: what Claude does with the report. `report.html`: the page Claude fills in.
- `tests/test-audit-lite.mjs`: builds a report from the scanner's fixture, checks that a context document gives the settings and rulings the full audit reads from it (`tests/fixtures/design-system-context.md`), and renders the page.

## Data this plugin stores

The context document picked for a file, its name and text, in the plugin's client storage on this machine, keyed by the file; **Remove** deletes it. Nothing is written to the Figma file; the report is a download.

The `teamlibrary` permission lets discovery read the variable collections the file's enabled libraries publish.
