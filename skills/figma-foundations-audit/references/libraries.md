# The tokens library and the icon library

How this skill checks the tokens library and the icon library, from the stored snapshot. [SKILL.md](../SKILL.md)'s *What it checks* points here.

## Where the checks run

The routing block says which file holds the tokens and which the icons (`roles`, snapshot-standard rule 17). Neither file has component sets for the file-level walk. Everything worth asking about them is in the stored snapshot, so `scripts/library.mjs` checks them from there.

The dashboard service files what it returns into each file's own record whenever the tokens settle. It files a full run, under the target `tokens` or `icons`, so a finding no longer raised closes.

## The checks

| Check | figma-standard rule | Reads | Row |
|---|---|---|---|
| Every published token has a description | 41 | Each collection's `descriptions` and `hidden` | One per collection |
| Every token is used by a component, a style or a used token | 42 | The components libraries' specs, styles' bindings, aliases | One per collection |
| Text and effect styles bind every value Figma lets them | 43 | Each style's `bound`, and `authored.letterSpacing` | One per field |
| No two names differ only in case or separator | 19 | Names | One per pair, an error |
| A group holds tokens or groups, and sibling groups share their leaves | 44 | Names | One per collection |
| Every icon set is drawn at the sizes most sets are | 45 | `owns.iconSizes` | One |
| Every glyph's paint is bound | 45 | `owns.unboundIcons` (snapshot plugin 0.53.0) | One, an error |
| Each icon keeps its source set's name | 45 | `icons.names` in the icon library's settings; Lucide at the importer's pinned release | One |

The style-binding check leaves letter spacing in percent unraised, since Figma binds a number variable to it only as px. The rule's other half, that it is bound when a mode must change it, is not checked: every percent tracking is exempt.

## What does not run

- **A check with nothing stored to read does not run, and the service says so.** That covers an icon library never snapshotted. It also covers the paint check on a snapshot older than plugin 0.53.0.
- **The Logo set is not checked yet.** It lives on its own page, which the snapshot does not read.
- **Contrast between tokens is not checked here.** It is a component's question, asked in the mode on screen (figma-standard rule 32).
