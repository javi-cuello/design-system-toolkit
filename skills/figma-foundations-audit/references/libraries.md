# The tokens library and the icon library

How this skill checks the tokens and icon libraries. It checks them live, as the audit's tokens and icons stages, and from the stored snapshot between audits. [SKILL.md](../SKILL.md)'s *What it checks* points here.

## Where the checks run

The routing block says which file holds the tokens and which the icons (`roles`, snapshot-standard rule 17). Neither file has component sets for the file-level walk, so `scripts/library.mjs` checks them instead.

## The live stages

These are the audit's tokens and icons stages. Each is filed under that target as a full run, so a finding no longer raised closes. They read the live file, as an audit should (toolkit-standard §D 5).

1. **Gather the facts.** Run the snapshot plugin's own code through `figma_execute` in its facts mode. The header of `plugins/design-system-snapshot/code.js` says what to prefix and append. Refuse the result if its `fileKey` is not the library's.
2. **Check them.** Pass the facts to `liveChecks`. It returns a tokens result and an icons result, each null where the stage does not apply. A file without its own collection, text style or effect style has no tokens stage. A file without an icon page has no icons stage.
3. **File** each result that is not null through the record's one writer, as in SKILL.md step 5. Use this skill as the owner and `tokens` or `icons` as the target. Each finding carries its own bucket.

`liveView` builds the view the checks read from the store's own code (`tools/snapshot/owns.cjs`), so the live file and its snapshot give one answer. The audit dashboard and `bin/audit` run all three steps as stages of figma-project-audit.

## Who uses a file's tokens

The project record says who uses a file's tokens. Live, the unused check reads the file's own bindings only where it is their only user. That is a file with both the tokens and the components role, where no other library holds components. The script decides it from the roles in `selfUsedOf`, and `liveChecks` takes the answer as `selfUsed`. Elsewhere the unused check does not run live, and closes nothing.

Audit lite has no record, so it treats the file as self-contained and says so. An icon's glyph colour counts as a use on both paths.

## The snapshot watch

Between audits the dashboard service runs the same checks on the stored snapshot whenever the tokens settle. `watchTargets` picks the files:

| File | Checks run |
|---|---|
| Role `tokens` | Tokens |
| Stored source owns a collection, text style or effect | Tokens |
| Role `icons` | Icons |

So a components library's own tokens are checked for use there, never live. The service files a full run under the target `tokens` or `icons`.

## The checks

| Check | figma-standard rule | Reads | Row |
|---|---|---|---|
| Every published token has a description | 41 | Each collection's `descriptions` and `hidden` | One per collection |
| Every token is used by a component, an icon's glyph, a style or a used token | 42 | The components libraries' specs, icon glyph colours, styles' bindings, aliases | One per collection |
| Text and effect styles bind every value Figma lets them | 43 | Each style's `bound`, and `authored.letterSpacing` | One per field |
| No two names differ only in case or separator | 19 | Names | One per pair, an error |
| A group holds tokens or groups, and sibling groups share their leaves | 44 | Names | One per collection |
| Every icon set is drawn at the sizes most sets are | 45 | `owns.iconSizes` | One |
| Every glyph's paint is bound | 45 | `owns.unboundIcons` (snapshot plugin 0.53.0) | One, an error |
| Each icon keeps its source set's name | 45 | `icons.names` in the icon library's settings; Lucide at the importer's pinned release | One |

The style-binding check leaves letter spacing in percent unraised, since Figma binds a number variable to it only as px. The rule's other half, that it is bound when a mode must change it, is not checked: every percent tracking is exempt.

## What does not run

- **A check with nothing to read does not run, and the run says so.** That covers an icon page with no icons. It also covers the paint check on a stored icon library from a plugin older than 0.53.0.
- **The Logo set is not checked yet.** It lives on its own page, which the snapshot does not read.
- **Contrast between tokens is not checked here.** It is a component's question, asked in the mode on screen (figma-standard rule 32).
