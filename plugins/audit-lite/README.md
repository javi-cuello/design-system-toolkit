# Audit lite

This Figma plugin audits the open library: its components, the file as a whole, its variables and styles, and its icons. It saves one Markdown report. You upload the report to Claude, in claude.ai, the desktop app or Claude Code, and type **show me results**. Claude asks whether to show them in the chat or as a page. It judges the findings and shows the fix queue in the audit dashboard's three buckets: fix on approval, quick manual fixes, and decide.

It needs no bridge plugin, no toolkit checkout, no Node and no project setup. It runs the stages that [figma-project-audit](../../skills/figma-project-audit/SKILL.md)'s `stages.json` gives it, with the full audit's own scripts. `sync.mjs` copies them in.

## Run

1. In Figma desktop, go to Plugins → Development → Import plugin from manifest, and pick this folder's `manifest.json`.
2. Open the library and run **Audit lite**.
3. If the project has a context document, upload it. Use **Upload…** in the Context document section of the **Settings** tab.
4. Without one, turn on the **Draft one** switch there. Claude then drafts one from the file along with the results.
5. Untick any check you do not want. Only checks that apply to the file are shown.
6. Press **Run audit**. With nothing selected, it audits every component. With components selected, or a section or frame holding them, it audits only those, and the report says so. The report downloads as `audit-<file>-<date>.md`.
7. Upload the report to a Claude chat, type `show me results`, and answer chat or page.

Claude ends by offering the results, and any drafted document, as files. On a 71-component library its reply takes about a minute.

A changed manifest needs a re-import. "Run last plugin" will not pick it up.

## The results page

As a page, the results look like the audit dashboard's queue. `sync.mjs` takes the words and colours from the dashboard's own files. The page has three buckets and a card per finding. You can filter by component and area. Each card has a Done mark, a note, **Ask about this row** and **Record as ruling**. Ask copies a question for the chat.

Rulings live only in the context document. To record them:

1. Decide in the chat, or bring the page's **Download rulings** file to it.
2. Ask Claude for the updated context document.
3. Upload it with **Upload…** in the Context document header.

Every later run judges by them. Marks and notes stay in that browser.

## What it does not do

- Without a context document, it uses the toolkit's house conventions, not the library's own. The report lists them. Claude drops a finding that only says the library follows a different convention. It offers to draft a starter context document from what it found in the file.
- Checks whose settings are not set do not run, and the report says which.
- With a document, it reads that file's settings and the rulings, as the full audit does. A document for another file is taken for this one. It never writes the document.
- It skips the stages only the full audit runs: the code-target validator, the token link check and the design-to-code comparison. The report names them.
- It does not check icon names against a published icon set.
- Unused tokens: only this file's own uses count.
- It fixes nothing, keeps no record and has no dashboard. The full audit, [figma-project-audit](../../skills/figma-project-audit/SKILL.md), does all of that.

## Files

| File | What it is |
|---|---|
| `code.js` | The plugin. Its generated block is written by `sync.mjs`, never by hand. |
| `instructions.md` | What Claude does with the report. |
| `report.html` | The page Claude fills in. figma-components-audit publishes the same page through `tools/figma-audit/fix-queue.mjs --page`. |
| `tests/test-audit-lite.mjs` | Builds a report from fixtures, runs the stages against a fake Figma and renders the page. |

The generated block holds the list of stages, the audit scripts and the snapshot plugin's facts mode. It holds the full audit's context-document readers, discovery, judging prompt and house settings, and copies of `instructions.md` and `report.html`. Its check, `sync.mjs --check`, fails when the block differs from its sources.

The test checks that a context document gives the settings and rulings the full audit reads from it. Its document is `tests/fixtures/design-system-context.md`.

## Data this plugin stores

It keeps the context document picked for a file, its name and text. That sits in the plugin's client storage on this machine, keyed by the file. **Remove** deletes it.

A document written for one other file, as for a library you duplicated, is taken under this file's key. One naming several files asks which applies.

It keeps the checks you unticked, as `stages-off`, in the same storage. That list is one for every file.

Nothing is written to the Figma file, because rulings travel in the context document. Versions 0.7 to 0.10 kept uploaded rulings as plugin data on the document. Version 0.11 neither reads nor writes it. The report is a download.

The `teamlibrary` permission lets discovery read the variable collections that the file's enabled libraries publish.

## Test

```sh
node plugins/audit-lite/sync.mjs --check
node plugins/audit-lite/tests/test-audit-lite.mjs
```

`bin/check` runs both.
