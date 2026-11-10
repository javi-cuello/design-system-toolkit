# Changelog — Audit lite
All notable changes. Format: Keep a Changelog; versioning: SemVer.

## [0.3.0] - 2026-11-10
### Added
- The project's context document, picked in the window and remembered for the file on this machine: its settings for this file and its rulings, read by the full audit's own readers, so the scan and the judge get what the full audit gives them. Claude offers each decision as a rulings-log row to copy.
- Without one, the report carries the file's discovery (its collections, scales and colour roles) and the context template, and Claude offers to draft a starter context document.
### Changed
- The judge's conventions and rulings lines come from tools/figma-audit/judge-rules.mjs, the dashboard's own.

## [0.2.0] - 2026-11-10
### Changed
- Claude asks first whether to show the results in the chat or as a page; the chat tables keep the Figma links.
- The page: the component is each row's header, "seen by users" its own column, colour only on errors, a heading over what was not checked, the file in the tab title, a shadow where a table scrolls, native controls in dark mode.
- The panel follows the snapshot plugin's layout: the file's name and the version at the top, one line of what it does, a full-width button, and a status with an icon, a title and a detail line, an indeterminate bar while it runs; a failed run says to try again. It has a title, a charset and a main landmark.

## [0.1.0] - 2026-11-10
### Added
- First version: runs the components audit's scanner on the open library with the house settings and saves one Markdown report. Uploaded to Claude with "show me results", it becomes the fix queue as a page.
