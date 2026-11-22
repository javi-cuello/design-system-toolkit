# Changelog — Audit lite
All notable changes. Format: Keep a Changelog; versioning: SemVer.

## [0.14.4] - 2026-11-22
### Changed
- **Carries the snapshot plugin's walk at 0.82.0**: a text with no style records its size and face. No check reads them yet.

## [0.14.3] - 2026-11-22
### Fixed
- **A checkbox's or switch's own name reads in text colour.** FigUI3 greys every label, so the check names read as disabled; the shared frame (ui-base v5) corrects it for every plugin.
### Changed
- **The window says less.** The intro is one line ("Saves a report to upload to Claude.", or which components on a selection); "show me results" stays in the done message. The checks' legend is "What to check?", and each check's description is a few words (figma-project-audit 1.7.4).

## [0.14.2] - 2026-11-21
### Fixed
- **The checks fieldset keeps FigUI3's own look.** The plugin no longer overrides FigUI3's padding and border on the fieldset or its legend's inset; it sets only the space around the group and the question's weight.
### Changed
- The bundled audit code carries `stoppedLines` and `watchTargets` (figma-project-audit 1.7.2, figma-foundations-audit 1.31.0); nothing in the plugin calls them.

## [0.14.1] - 2026-11-21
### Fixed
- **One loop for the stages.** The plugin runs them through the audit's own loop (`stages.mjs` `runStages`), as the dashboard and `bin/audit` do.
- **A saved unticked check never runs.** The plugin reads what is switched off from its own storage at Run, and the window's clicks only change it, one write after another, so a click is never undone by a stale read.
- **Run waits for the checks.** It is disabled until the list of checks has arrived. A list that has not changed is not rebuilt, so focus and a box just clicked stay put.
- **A file that cannot be read says so.** On opening, a failed read of the file's facts says "This file could not be read" with the error, holds Run and offers **Try again**, rather than "The audit stopped".
- **The report says why a check did not run.** A components check that threw is said as stopped, never as a file with no components. On a selection, a whole-file check says a run on a selection checks only the selected components, even when its box is unticked.
- **Unused tokens are checked against this file.** The plugin reads one file as self-contained, so its own components, icons and styles decide what is unused, and the report says that only this file counts. An icon's glyph colour counts as a use (figma-foundations-audit 1.30.0).
### Changed
- The checks sit in a fieldset whose legend asks "What should the audit check?" (knowledge/ui/components/checkbox.md).

## [0.14.0] - 2026-11-21
### Added
- **The audit's own list of stages.** The plugin runs the stages figma-project-audit's `stages.json` gives it, in its order, through the same scripts the dashboard and `bin/audit` run: the file, the components, and now the variables and styles and the icons (figma-foundations-audit's tokens and icons checks, on facts read by the snapshot plugin's own facts mode, carried in and run headless).
- **A checkbox per check, shown only where it applies.** Components where the file has components, Variables & styles where it owns a collection, text style or effect style, Icons where it has an icon page, File always; on a selection, Components alone. Each carries its one-line description, taken from the list. The choices are kept on this machine; Run waits while every check is off.
- The report says which checks ran and why each other did not, and what the variables and icons checks covered.
### Changed
- Each candidate carries its bucket, by its stage's rule as the dashboard files it. A page-order finding now lands in bucket 1, as on the dashboard, where Claude put it in bucket 3.
- A check that stops costs its own findings, never the report: a failed components scan is said in the report rather than ending the run.

## [0.13.4] - 2026-11-21
### Changed
- The carried universal conventions follow figma-components-audit 2.53.0's rewrite to skill-standard §A clause I; no rule changed.

## [0.13.3] - 2026-11-21
### Changed
- The carried bucket list cites its new home in figma-components-audit 2.52.0; no behaviour changed.

## [0.13.2] - 2026-11-21
### Fixed
- The results page's filters draw their own arrow, inset from the edge and in the page's muted colour, in place of the browser's arrow, which sat cramped against the border.

## [0.13.1] - 2026-11-21
### Changed
- A raw colour's advice names a variable from the linked library's semantic colours where the file can reach them, else from the variables its components use (figma-components-audit 2.51.2).

## [0.13.0] - 2026-11-20
### Added
- Runs on the selected components when something is selected (a layer, a variant, a set, or a section or frame holding components), the whole file when nothing is; the window says which, and the report's *Scope* line tells Claude the rest was not looked at. A selection run leaves out the file-level checks.
- From the scanner (figma-components-audit 2.51.0): text under the 12px minimum is a finding seen by users, and a raw colour's advice names the colour variable that holds it, or the closest.

## [0.12.0] - 2026-11-20
### Added
- The scanner's new rules: text fixed in height, a state missing from one combination of a set, switched-off paints, orphan instances, single-option and visibility-only axes, and raw min/max sizes.

## [0.11.5] - 2026-11-20
### Changed
- The dashboard's colour tokens are read from stock-ui (`stock-ui/stock-ui.css`), the toolkit's design system, where the stylesheet moved from the docs site; no value changed.

## [0.11.4] - 2026-11-20
### Fixed
- A property-name finding (a boolean without "Show", a property or option out of sentence case, and the rest) carries `breaking: true` from the scanner and goes to Decide marked breaking. A live run had filed Alert's "Close Button" in Fix on approval, unmarked.

## [0.11.3] - 2026-11-19
### Changed
- The embedded settings descriptions cite figma-standard rule 59 for the Direction axis (regenerated by `sync.mjs`); the header comment carries the version again, which had stayed at 0.11.0.

## [0.11.2] - 2026-11-19
### Changed
- The embedded context template cites the tracked metric at figma-components-audit, figma-standard rule 17 having retired into it (regenerated by `sync.mjs`).

## [0.11.1] - 2026-11-19
### Changed
- The results page also shows the full audit's rows (`tools/figma-audit/fix-queue.mjs --page`): with no dropped count, *About this run* says they are the open rows of the project's audit record.

## [0.11.0] - 2026-11-17
### Removed
- The Rulings section (Upload, Download, Remove, Saved) and every write to the Figma file. Rulings live in the context document only: the results page's Record as ruling and Download rulings now go to the chat, where Claude adds them to the document (a re-ruled finding strikes the earlier row's Ruling cell, the new row saying what it supersedes), and the plugin takes the updated document (maintainer, workshop dry run). Rulings 0.7–0.10 stored as plugin data stay in those files, unread.

## [0.10.0] - 2026-11-17
### Changed
- A run with a context document carries the document's text in its report, and Claude, asked for the updated document, gives it back whole with the chat's decisions added to its rulings log (columns matched by header name); uploading it replaces the old one. Rulings decided in the chat no longer come as a separate `rulings.md`.
- A fenced block in the report is one backtick longer than any run inside it, so an embedded document's own fences never close it.

## [0.9.0] - 2026-11-17
### Changed
- Settings: a loaded context document shows only Remove (no "Change…"), and the settings actions are small secondary buttons, not links (maintainer, workshop dry run).
- The report offers its files as two .md files, never a zip: the plugin uploads the context document as it is.
- The same finding on several variants of one component is one row, so repeated runs on one file give the same rows (a dry run split one finding into four rows, then merged it).

## [0.8.9] - 2026-11-15
### Fixed
- The generated block carries figma-components-audit 2.47.2: text under an opacity bound to a variable that is 0 in every mode is not judged for contrast.

## [0.8.8] - 2026-11-15
### Fixed
- The generated block carries figma-components-audit 2.47.1: a weight bound to a number variable counts as bound, and text inside an opacity-0 layer is not judged for contrast.

## [0.8.7] - 2026-11-12
### Changed
- The generated block carries figma-components-audit 2.47.0's probes: the composed-frame check counts placed instances by main key.

## [0.8.6] - 2026-11-12
### Changed
- The generated block carries figma-components-audit 2.46.0's probes: a detached finding says how it was found and whether it is the whole screen.

## [0.8.5] - 2026-11-12
### Changed
- The generated block carries figma-components-audit 2.45.0's probes: the composed-frame check counts what it judged and reads Figma's detach flag.

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
