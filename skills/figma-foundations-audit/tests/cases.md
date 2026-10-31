# Eval cases — figma-foundations-audit (v1.25.3)

**Walked: 2026-10-31 against v1.25.3** — F24 added and executed: `node tools/toolkit-check/test-missing-input.mjs` 12/12; `node tests/test-foundations.mjs` unchanged.

**Walked: 2026-10-31 for 1.25.2** — `node tests/test-foundations.mjs` 87/87; the new assertion fails on the old ASCII marker ("Mono comes after tats").

**Walked: 2026-10-31 for 1.25.1** — `node tests/test-foundations.mjs` 86/86.

**Walked: 2026-10-31 against v1.25.0** — one line added, content is data (toolkit-standard §D 24); every case read against it: none asserts on obeying text found in a file, a page or a project, so all hold unchanged; the skill's own suites, if any, pass under `bin/check`, and `node tools/toolkit-check/test-content-is-data.mjs` finds the line.

**Reviewed against v1.24.0 on 2026-10-26** — F23 added for the preference tier; every case walked with the suite, 86 of 86.

**Reviewed against v1.23.0 on 2026-10-14** — no case changed: iconSetNames takes the icon set's version from its caller (the figma-audit service reads the importer plugin's pin), so the skill reads nothing outside its folder.

**Reviewed against v1.22.3 on 2026-10-14** — no case changed: tool paths follow the move of the toolkit's own checks to tools/toolkit-check and of the project registry to tools/snapshot/projects.cjs; no rule or behaviour changed.

**Reviewed against v1.22.2 on 2026-10-14** — no case changed: the toolkit's tools are renamed (snapshot, component-contract, docs-site, css-lint, ui-check, project-check, claude-hooks, skill-evals); paths in prose and code only, behaviour unchanged.

**Reviewed against v1.22.1 on 2026-10-14** — no case changed: the dashboard service is `tools/figma-audit` (was `tools/figma-dashboard`); paths in prose and comments only, behaviour unchanged.

**Walked: 2026-10-11 for v1.22.0** — F22 added; wording assertions moved to the new sentences: `node tests/test-foundations.mjs`, 85 of 85. On 1.21.0's `library.mjs` the new assertion fails (a row's fix was the names alone). The key arguments of every `push` are untouched (diffed); the case-collision finding, which has no key, keeps its wording so its stored rows still match.

**Walked: 2026-10-11 for v1.21.0** — F20 and F21 added: `node tests/test-foundations.mjs`, 84 of 84; before 1.21.0 there is no `library.mjs`, so both fail at import. Run on one project's stored tokens the same day: 26 rows (8 description, 9 unused, 2 style-binding, 7 structure), and the name check against Lucide 1.28.0 found its 5 `-custom` icons.

**Walked: 2026-10-07 for v1.17.0** — F16 added: `node tests/test-foundations.mjs`, 64 of 64; on 1.16.0's scanner F16's first assertion fails (no pinned-order key exists).

**Walked: 2026-10-07 for v1.16.0** — F15 added: `node tests/test-foundations.mjs`, 62 of 62; on 1.15.0's scanner F15 fails (no deprecation check).

**Walked: 2026-10-07 for v1.15.0** — F14 added: `node tests/test-foundations.mjs`, 61 of 61; on 1.14.0's scanner F14 fails (`Cell / Fill` on a TABLES page is flagged). F1–F13 unchanged.

**Walked: 2026-10-07 for v1.14.0** — F13 added: `node tests/test-foundations.mjs`, 60 of 60; on 1.13.2's scanner F13 fails (the `🚧 Card` part is flagged). F1–F12 unchanged.

**Walked: 2026-09-25 — live, for v1.13.0's mode-pin checks** against the same project's web library the day it moved to extended collections. The generations check raised one finding and it was true: three collection objects of the brand layer's one name pinned across the file — `[Brand C, Brand B]` ×64, `[Brand A, Brand B]` ×25, `[Light, Dark]` ×22 — left behind when the parent went from four modes to two. The brand-without-theme question raised nothing there, because every frame pinning the `Brand B` extension pins a theme beside it. A third check was written, run live and **dropped**: "the collection's library provides no variables" reported the hidden primitives collection and the `Brand B` extension (never listed by `getAvailableLibraryVariableCollectionsAsync`) alongside the one genuinely dead collection — three false findings out of four — so nothing in the gather reads variable counts now.

**Reviewed against v1.13.2 on 2026-10-01** — F1–F11 unchanged and still asserted; F12 added for the graded generations finding 1.13.1 shipped, whose assertions the suite already carried. In node: `node tests/test-foundations.mjs`, 59 of 59.

**Reviewed against v1.12.2 on 2026-09-22** — no case changed; every candidate now carries a `key`, asserted in the suite.

**Reviewed against v1.12.1 on 2026-09-22** — no case changed; the payload contract in steps 5 and 6 now names `ran` and the writer's refusal, which `tools/figma-audit/test-rows.mjs` asserts.

**Walked: 2026-09-10 — live** against one registered project's web library (`projects/project-a/`, 82 pages, 85 sets) through the dashboard service: F1, F3 and F5 observed (two swapped pages in two categories; three bare-slash names; `_Thumbnail`, `_Header` and four public parts without their parent's name; the excluded section raised nothing), F6 observed on the live record (11 rows filed as this skill's, a components-audit full run closed none), F2 and F4 not hit by that file. The checks also run in node: `node tests/test-foundations.mjs`, 20 of 20 assertions.

**Walked: 2026-09-20 — the snapshot path against the live one**, on one registered project's 44-page web library, both through the same `checkFacts`. The first run disagreed: six *bare "/"* findings the live run did not raise, from reading the store's page-namespaced display name as the component's name (fixed by plugin 0.34.0's `figmaName`), and 29 components missing, the whole icon page, which the store records as names with no page (fixed by plugin 0.35.0's `iconPage`). The second run: **69 components against 69, no difference in page, scope or parents, one finding each, identical.** Both fixes carry assertions in `tests/test-foundations.mjs`.

## F1 · A swapped pair is one finding, whatever the page markers
Fixture: a category whose pages carry mixed status markers, with two pages out of alphabetical order, and a pinned-last category whose own pages are out of order.
Assert: exactly one page-order finding, naming the swapped pair by their names without markers. The pinned-last category, which the project also excludes from the audit, raises nothing about its own pages.

Runs: node tests/test-foundations.mjs — "a swapped pair is one finding, whatever the markers; the pinned, excluded section is not ordered"

## F2 · Categories run alphabetically and nothing follows a pinned-last one
Fixture: two categories out of alphabetical order, and a category placed after the one the project pins last.
Assert: one finding for each. The pinned category itself is left out of the alphabetical comparison.

Runs: node tests/test-foundations.mjs — "categories run alphabetically, and nothing follows the pinned-last one"

## F3 · An absent setting skips its check, never borrows one
Fixture: the same misordered pages with no `sectionHeader`; a bare-slash name with no `groupSeparator`; a lone part with no `familySeparator`.
Assert: no finding from any of the three checks. The report must name them under *Not checked*, and must not fall back to another project's header pattern or separator.

Runs: node tests/test-foundations.mjs — "no header pattern recorded: page order is skipped, not guessed"

## F4 · Names that differ only in case collapse on export
Fixture: `Switch` and `switch`, with `Switch 2` beside them.
Assert: one finding naming the pair; `Switch 2` is not part of it.

Runs: node tests/test-foundations.mjs — "names differing only in case"

## F5 · A part carries its parent's name; exemptions hold
Fixture: a private part used only inside `Empty state`; a private part used by both members of one grouped `Column` set; a slot part already named `Tabs - Item`; a private part used by two unrelated parents; a public `Calendar` on its own page, used only inside `Date picker`; a part of a part already named `_Breadcrumb - Item - Button`.
Assert: two findings, for the part inside `Empty state` and the part inside the grouped `Column` set, each suggesting the prefixed name. The multi-parent part, the public component and the correctly named parts raise nothing.

Runs: node tests/test-foundations.mjs — "a part used by one parent and lacking its name; members of one grouped set count once; multi-parent parts and public components are exempt"

## F6 · Findings are owned
Fixture: a record holding an open row raised by the components audit and an open row raised by this skill; a full foundations run that no longer raises its own finding.
Assert: this skill's row is closed with a note saying the run no longer raises it. The components audit's row is untouched. Walked 2026-09-11 in node against the record's writer (`node tools/figma-audit/test-rows.mjs`: a full run by another owner closes none; a full run closes only inside its scope; a partial run closes nothing); not yet observed on a live record.

Runs: node tools/figma-audit/test-rows.mjs — "a full run by another owner closes none of these"

## F7 · Each page-order finding names its own section
Fixture: two categories each holding one swapped pair.
Assert: two `Page list` entries, one per category header, each carrying its own finding. Found live: both findings sat under the first category's header, because entries were keyed by set and id alone and every file-level finding shares both. Walked 2026-09-10 in node after the fix.

Runs: node tests/test-foundations.mjs — "each page-order finding is credited to its own section"

## F8 · A page names where it belongs, not the neighbour it trails
Fixture: a category running `Pagination`, `Sidebar (Primary)`, `Sidebar (Secondary)`, `Side navigation`, `Stepper` — one page three positions out.
Assert: the finding and its advice both name `Sidebar (Primary)`, the first page it sorts before; moving it one place up (above `Sidebar (Secondary)`) still raises, naming the same destination; moving it to that destination silences the check. Found live on one registered project's web library: the maintainer followed the advice exactly, the page list still was not alphabetical, and the dashboard row read as unfixed. The old wording named `s.members[i - 1]`, which is only the right destination when the page is exactly one place out.

Runs: node tests/test-foundations.mjs — "a page names the first page it sorts before, not the one it trails", "and the advice names the same destination", "moving it one place still raises, naming the position it has not reached", "and the destination this check names is one that silences it"

## F9 · The proposed name drops the family the part already shares
Fixture: `Table - Header / Fill` used only inside `Table - Column`; `Sidebar (Secondary) - Item` inside `Sidebar (Secondary) - Section`; `Footer` inside `Dialog`; and `Table` inside `Table - Column`.
Assert: the advice proposes `Table - Column - Header / Fill`, `Sidebar (Secondary) - Section - Item` and `Dialog - Footer`; the part that is a prefix of its parent raises nothing at all. Found live on one registered project's web library, where the maintainer read `rename it to "Table - Column - Table - Header / Fill"` and asked whether the finding was correct. It was; the rename was not, because the leaf was the child's whole name rather than what the child adds to its parent. An unusable rename is worse than none — it reads as the answer.

Runs: node tests/test-foundations.mjs — "the proposed name drops the family the part already shares with its parent", "a part that is a prefix of its parent raises nothing"

## F10 · A category names where it belongs, not the section it trails
Fixture: sections `DATA`, `FEEDBACK`, `INPUTS`, `ACTIONS` in that order.
Assert: one finding naming `DATA` — the first section `ACTIONS` sorts before — in both the text and the advice; moving it there silences the check. Found by a review that replayed a real 79-page list with a section moved three places late: the old wording named the immediate neighbour, so following it exactly left the list unsorted and the next run raised the same section again. The within-section loop was fixed for this in 1.10.0 and the category loop, 25 lines above it, was not.

Runs: node tests/test-foundations.mjs — "a category names the first category it sorts before, not the one it trails", "and its advice names the same destination", "and moving it there silences the check"

## F11 · A part may extend its parent's name with either separator
Fixture: `_File explorer - Section / L2` used only inside `_File explorer - Section / L1`, beside `_File explorer - Section - Item / L1`.
Assert: neither raises. The guard accepted only the family separator, so a slash-group member whose name begins with its parent's full name was told it did not carry it, and offered `_File explorer - Section - Section / L2`. Its ` - ` siblings were silent on the same library, which is what identified the separator as the cause.

Runs: node tests/test-foundations.mjs — "a slash-group member that extends its parent's name carries it"

## F12 · Stale mode pins are graded by what they cost
Fixture: one collection name pinned in three generations (`[Brand A, Brand B]`, `[Brand C, Brand B]`, `[Light, Dark]`); then the stale pin varied — shadowed by inner frames re-pinning the current collection, unshadowed, and inside a component; then a brand extension pinned alone, and beside a theme.
Assert: one finding naming all three generations. Severity is a question when every stale pin is shadowed, a warning when nothing re-pins it, an error inside a component. One generation raises nothing; a brand with no theme beside it is a question, a brand beside a theme is clean; no pins gathered reports the check as not run, never clean. Written because the first live finding was an error that a screenshot disproved — the frame rendered correctly, since the nearest pin wins.

Runs: node tests/test-foundations.mjs — "several collections of one name pinned at once is reported, naming each generation", "furniture whose inner frames re-pin the collection is tidy-up, not a defect", "furniture with nothing re-pinning it shows a default nobody chose", "a stale pin inside a component is an error, because the component itself resolves wrongly", "a brand pinned with no theme beside it is a question, not a defect", "no pins gathered means the check did not run, never that the file is clean"

## F13 · A status marker does not hide a part's parent name — WALKED 2026-10-07
Fixture: `🚧 Card` with a part `🚧 _Card - Header` used only inside it, and `🚧 Slider` with a part `🚧 _Thumb` used only inside it.
Assert: only `🚧 _Thumb` is reported as not carrying its parent's name; `🚧 _Card - Header` is not, because the marker is set aside before names are compared.
Runs: node tests/test-foundations.mjs — "a 🚧 part that carries its parent's name once the marker is set aside is not flagged, and one that does not still is"

## F14 · A space joins a family and its part; a category family drops the family word — WALKED 2026-10-07
Fixture: `familySeparator` a space; `Card` with parts `_Card header` and `_Badge`; a `❖ TABLES` category holding `Table` with parts `Cell / Fill` and `_Grip`.
Assert: only `_Badge` is reported as not carrying its parent's name; `_Card header` carries it with a space, and both TABLES members are exempt because the category supplies the family.
Runs: node tests/test-foundations.mjs — "space-joined parts carry their family, which may be a leading run of the parent (List item inside List group); a TABLES member may drop the family word; a part elsewhere without it is still flagged"

## F15 · Deprecation is marked the house way — WALKED 2026-10-07
Fixture: a `❖ DEPRECATED` category holding `🚫 Side nav` (with `[🚫 DEPRECATED] - Side nav` and an unprefixed `Side nav item`) and `❖ Old tag` (with `_[DEPRECATED] Feedback tag`).
Assert: three findings, the unmarked page, the unprefixed part on the deprecated page, and the name marked deprecated another way; the correctly prefixed component raises nothing.
Runs: node tests/test-foundations.mjs — "figma-standard rule 14: a part on a deprecated page without the prefix, a name marked deprecated another way, and a deprecated-category page without the marker"

## F16 · Pinned categories run in their recorded order; every value is a setting — WALKED 2026-10-07
Fixture: `pinnedLast` of `❖ AUXILIARY` then `❖ DEPRECATED`, with the file holding them in the opposite order; then in the recorded order. A second run with no settings.
Assert: one finding keyed `page-order|pinned|❖ AUXILIARY`, none in the recorded order; with no settings every check is listed under *Not checked*, deprecation included.
Runs: node tests/test-foundations.mjs — "pinned categories out of their recorded order are raised, keyed by the category", "and in the recorded order they are silent", "and every check ran"

## F17 · A component page carries the template's sections in order — WALKED 2026-10-08
Fixture: gathered templates — a page in order with a Matrix for a primary that has axes; one out of order; one missing its Matrix and one with a Matrix it should not have; one with no section cards and a building-block page; then no `pageSections` setting.
Assert: the in-order pages raise nothing; order, matrix and missing findings are raised with their keys; the building-block page is exempt; with no setting the check is listed as not run (figma-standard rule 15).
Runs: node tests/test-foundations.mjs — "figma-standard rule 15: a page in template order, with a Matrix for a primary that has axes, raises nothing", "sections out of order are raised", "a Matrix missing for a primary with axes, and one present for a primary with none, are raised", "a page with no section cards is raised; a building-block page is exempt", "without pageSections in the settings, the template check does not run, and says so"

## F18 · Every component on an in-progress page carries the marker, and no other does — WALKED 2026-10-08
Fixture: a `🚧 Time input` page holding `Time input`, `🚧 Time input picker` and `_🚧 Time input item`; a `❖ Button` page holding `🚧 Button`. Then a part under the house's space join, `_Media / Wide` inside `Card` on `❖ Card`.
Assert: `Time input` is raised as missing the marker, the marked ones are not, whether the marker sits before or after `_`; `🚧 Button` is raised as marked on a finished page (figma-standard rule 13). The rename proposed for the part is figma-standard rule 9's, `_Card media / Wide`.
Runs: node tests/test-foundations.mjs — "figma-standard rule 13: a component on a 🚧 page without the marker is raised, and one with it (before or after _) is not", "and a marked component on a finished page is raised", "figma-standard rule 9: the proposed name is the documented component plus the part's last word, a sibling suffix kept"

## F19 · A private part keeps its `_` first, before any marker — WALKED 2026-10-08
Fixture: `🚧 _Time input picker` on an in-progress page; `[🚫 DEPRECATED] - _Old item` and `_[🚫 DEPRECATED] - Old row` on a deprecated page.
Assert: the first two are errors naming the rename that keeps `_` first, because Figma publishes any name that does not start with it; `_[🚫 DEPRECATED] - Old row` is silent (figma-standard rules 8, 13, 14).
Runs: node tests/test-foundations.mjs — "a private part with the marker before its _ is raised: Figma publishes it", "and so is a private part with the deprecation prefix before its _"

## F20 · The tokens library, from the stored snapshot — WALKED 2026-10-11
Fixture: a tokens file owning two collections (one hidden pair of primitives, one semantic collection with an undescribed majority, a case twin, a group holding a token and a group, and a group lacking a leaf its siblings have), a text style binding family, size and weight, an effect binding only its colour, and a collection another file owns. Components bind one semantic token and the text style.
Assert: descriptions are raised for the semantic collection only; unused names exclude the alias target and the style's binding; line height and letter spacing are raised once each; the case twin is an error; the two shape problems are one row; the other file's collection raises nothing; a file with nothing stored runs nothing (figma-standard rules 19, 41–44).
Runs: node tests/test-foundations.mjs — "tokens: an undescribed published token is raised per collection; a hidden one owes none", "tokens: a token no component, style or used token reaches is unused; an alias target and a style's binding are used", "tokens: a style field Figma can bind and the style leaves loose is raised, one row per field", "tokens: two names that differ only in case are an error", "tokens: a group holding tokens and groups, and a sibling group missing a common leaf, are one structure row", "tokens: a collection another file owns is not this library's", "tokens: nothing stored from the file, nothing ran"

## F21 · The icon library, from the stored snapshot — WALKED 2026-10-11
Fixture: four sets, one drawn at two of the three sizes the others have, one variant with an unbound paint, and a set name the icon source does not publish. Then a library with only sizes stored and no source named.
Assert: one row each for the size, the paint (an error) and the name; with nothing but sizes, only the size check runs (figma-standard rule 45).
Runs: node tests/test-foundations.mjs — "icons: a set missing a size most sets have, an unbound paint and a name the icon set lacks are raised", "icons: with no icon set named and no paints stored, only the size check runs"

## F22 · A finding says what goes wrong before what to do — WALKED 2026-10-11
Fixture: F20's tokens file and F21's icon library; the page-order, separator, parent-name, status-marker, deprecation and page-template fixtures of F1 to F19.
Assert: each sentence leads with the state and its cost ("so a reader hunts for it"), and each advice is the fix alone; a tokens or icon row's `fix` starts with its `check`, then the names it covers (design-standard rule 10). Found by the 2026-10-11 front-end audit: the Core library's rows read "01. Primitives - Global: Border radius/none, … and 61 more." and said nothing about what was wrong.
Runs: node tests/test-foundations.mjs — "and a row states the problem before the names it covers, never the names alone", "the advice is an instruction, never a repeat of the state"

## F23 · A naming preference is filed as one — WALKED 2026-10-26
Fixture: `Card/Header`, a bare slash, and `_Bit`, used only inside `Parent`.
Assert: the separator and parent-name findings carry severity `preference` (figma-standard, Naming). Asked by the maintainer on 2026-10-26.
Runs: node tests/test-foundations.mjs — "a bare slash and a part without its parent's name are preferences"

## F24 · A missing or broken input to `scripts/from-snapshot.mjs` is one line naming it — *executed* 2026-10-31
Fixture: the script's input flag given a path that is not there, then a file that is not JSON.
Assert: each exits non-zero with one stderr line naming the path and saying `no such file` or `not JSON (…)`, never a Node stack.
Runs: node tools/toolkit-check/test-missing-input.mjs
