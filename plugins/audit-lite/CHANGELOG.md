# Changelog — Audit lite
All notable changes. Format: Keep a Changelog; versioning: SemVer.

## [0.8.4] - 2026-11-12
### Added
- `pnpm-lock.yaml`, so its one dev dependency is pinned like every other package's (tools/toolkit-check/test-dependabot.mjs now requires it).

## [0.8.3] - 2026-11-11
### Fixed
- A row whose links are all hidden keeps the field's right inset, so a long document name no longer runs 8px into it.

## [0.8.2] - 2026-11-11
### Fixed
- The context document's and rulings' Upload…, Change…, Download and Remove are FigUI3 link buttons: as plain buttons, FigUI3's hover filled them brand-blue and hid their label.
- Each section's Upload… sits in its header, so the rulings count is no longer squeezed out of its row by three links.
- The draft switch's row reads "Draft one" with the switch bare, so the switch lines up with the other rows' controls.
- Run audit and Download are FigUI3's large buttons, and the footer is inset like the panel above it.

## [0.8.1] - 2026-11-11
### Fixed
- Opening the plugin, running an audit or downloading rulings no longer writes rulings kept on the machine into the file; they move when rulings are added.
- Remove rulings clears the file's own first, when it has any: a view-only file holding rulings keeps both, one holding none still lets the machine's copy go.
- The window has a title; the two panels are tab panels to a screen reader.
- Letter spacing on a text layer with no style is advised on the layer, not on a "text style" named after it (the components audit 2.44.1).
- The judge's rule list resynced from the full audit (the §6 subject read only from "Recorded from …").

## [0.8.0] - 2026-11-11
### Changed
- The window is built from FigUI3 (the PropsKit look): fig-tabs in a fig-header, fig-field rows with a fig-switch, fig-buttons in a fig-footer, a fig-spinner while the audit runs. Behaviour unchanged.

## [0.7.1] - 2026-11-11
### Changed
- The window is laid out as the Lucide importer's: a tab bar (Audit, Settings), a panel, and a footer holding the version and the actions, Run audit and Download.
- Settings is two groups of label and control rows: Context document (Upload…, and a **Create one** switch that has Claude draft one with the next results) and Rulings (Upload…, Download, Remove).
- Rulings come back as a file, not a paste: the results page's **Download rulings**, then **Upload…** in the plugin.
- Claude's closing files are two separate documents, the results and the drafted context document, bundled in one zip where it can run code.

## [0.7.0] - 2026-11-11
### Changed
- Rulings pasted into the plugin are saved in the Figma file, not on the machine, so they travel with the file to anyone who runs the plugin; those 0.6 kept on the machine move into the file on first open where it can be edited, and are read beside it where it cannot.
- The window has two tabs: Audit, and Settings (the context document and the rulings).
### Added
- **Download** gives the saved rulings as a rulings log, ready for a context document's section 6.
- A **Draft a context document** switch, shown when no document is in use: the report asks Claude to draft one from the file with the results. Claude ends by offering the results and the drafted document as files.

## [0.6.0] - 2026-11-10
### Changed
- The results page is laid out as the audit dashboard's queue: its three buckets and titles (a breaking fix sits in Decide with its tag), a card per finding with the Done box, severity chip, area tag, User-visible flag and the What's wrong / The fix columns, a Note for Claude, Record as ruling and Ask about this row, the Open / Done tiles, and filters by component and area. Its words and colour tokens are filled in by sync.mjs from the dashboard's own files.
### Added
- Rulings come back in one paste: Copy rulings on the page, Paste rulings in the plugin. They are kept for the file on this machine and judged by on every later run, with or without a context document.

## [0.5.1] - 2026-11-10
### Changed
- The chat-or-page question is asked as two buttons, Chat and Page, where Claude has a tool that offers choices; as one line elsewhere.

## [0.5.0] - 2026-11-10
### Added
- The page: severity chips with counts; a Done box per row; Ask, which copies a question about the row for the chat; Keep as is, which turns the row into a rulings-log row (Date | Scope | Ruling | Why, the Why naming the component) gathered under *Decisions to record*, to paste into the context document's section 6. Done and kept stay in the viewer's browser.
- Without a context document the page offers the request that has Claude draft one.
### Changed
- A table scrolls in its frame below 760 px rather than crushing its columns; a row's two actions stay on one line.

## [0.4.2] - 2026-11-10
### Fixed
- In a real run Claude published the page without asking chat or page, and closed with a table whose cells held raw HTML lists: the question is now the whole first reply, and the closing words are four plain sentences that never repeat the page's rows.

## [0.4.1] - 2026-11-10
### Fixed
- *Run* no longer lists a file-level check that had nothing to check as run; a Page list row's place is its entry's page.

## [0.4.0] - 2026-11-10
### Added
- The file as a whole: the foundations audit's checks (page and category order, separators, parent names, deprecation, mode pins, page templates, status markers) run after the components scan on the same settings; their findings join the report, file-level ones under "Page list", and *Run* names which ran.

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
