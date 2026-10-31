# Changelog — Design system snapshot
All notable changes. Format: Keep a Changelog; versioning: SemVer.

## [0.68.3] - 2026-10-31
### Changed
- A text style's line height and letter spacing become a fraction of the font size through one function, `perFontSize`, a copy of `tools/shared/text-units.js` that `tools/shared/test-text-units.mjs` holds character for character, as the token build's and the doc generator's copies are. The numbers are the same: four places, by `toFixed`.
- Merged with the focus-ring release below; nothing of either changed.

## [0.68.2] - 2026-10-31
### Fixed
- **Focus shows as a ring.** The shared baseline (ui-base v3) gives a focused input or select a 2px ring under the keyboard; a border colour alone was the only sign (WCAG 2.4.7, 1.4.11). The window's hint, when nothing is listening, says how to start the router and where its log is.

## [0.68.1] - 2026-10-31
### Changed
- The window's language is set (`lang="en"`), so a screen reader reads it in English. README: the requests are two GETs on open and two GETs and a POST per run, and only the kind GET and the POST carry the pairing code (it said one GET and one POST, each with the code).

## [0.68.0] - 2026-10-31
### Added
- Pairing with the router. The router now refuses a snapshot, and the question of which kind a file is, without this machine's pairing code, because any web page can reach localhost and send the same `Origin: null` as the plugin. The window asks for the code once (a field, with the router's own words on the command that prints it), keeps it in clientStorage, and sends it with every request as a `code=` query parameter. With no router listening the snapshot still downloads as a file.

## [0.67.1] - 2026-10-30
### Fixed
- A router that answers with an error is listening. Any answer other than OK read as "Nothing is listening", so a router failing with 500 had the snapshot saved as a file and its cause unseen; now the snapshot is sent and the router's own error is shown.

## [0.67.0] - 2026-10-30
### Fixed
- A duplicated library is a new file. It carries its original's `snapshotFileId`, so a snapshot of the copy was written into the original's project. The manifest now asks for the file key (`enablePrivatePluginApi`; a Development run gets it, proved through the bridge), both payloads send it, and the router addresses a payload by its key first, so the copy is refused as a file no project lists. A routing entry that states only an id needs its `key` added: a payload with a key is routed by it alone. The id is not stamped again: a branch would re-stamp its main file on merge.
- A headless run (the bridge) no longer makes an id: it ran under the bridge's own plugin data, which no run of the plugin itself reads, so every bridge snapshot of an unstamped namespace edited the file for nothing. The key names the file there.

## [0.66.0] - 2026-10-30
### Added
- The same code runs through the Figma MCP (`use_figma`, served by tools/snapshot/mcp.mjs), with fallbacks dormant wherever the app's own call succeeds: pages load one by one where `loadAllPagesAsync` is refused; an instance whose font the cloud lacks stays where it was created instead of moving into a frame (`place`), and its dark preview takes the mode itself; an AUTO line height whose font cannot load is measured from a one-line text in that style already in the file (`drawnIn`), before the metric guess. test-walk proves each fallback against a stub that refuses.
### Changed
- A description is unescaped (`&lt;` `&gt;` `&amp;` `&quot;` `&#39;`) on both routes, since the cloud hands it back HTML-escaped; one typed with a literal entity now reads as the character.

## [0.65.1] - 2026-10-30
### Fixed
- A library snapshot finishes again. 0.65.0's measured progress dropped the page each component list belongs to, so every library snapshot stopped on "page is not defined". Found by running the plugin's code through the Figma MCP; test-walk now files components under their pages.

## [0.65.0] - 2026-10-26
### Changed
- Progress is measured, after the knowledge base's *Loading* section: the step ("Reading frames…"), how far through it ("37 of 114") and a bar that fills, where the window printed each layer's raw page and frame name ("Reading -- Pool / <Projects> 1-3 - Pool - No results…"). A step with no count (variables, sending) shows a bar with no value.
- The outcome is a heading and a detail line, after *Success confirmation*: a check and "Written to <project>", then the counts and the time it landed; a failure carries a warning glyph and its cause and fix in the danger colour. The button's focus ring is the theme's, for the keyboard only, where the browser drew an orange box after every click.

## [0.64.0] - 2026-10-26
### Changed
- Every failure the window shows says what happened and what to do, in a sentence: the router's refusals name their cause and fix ("none of the 114 frames is marked ready for dev, so nothing was written. Mark the frames…"), where "refused the payload — see the router's output" sent the designer to a terminal they were not looking at. A crash while reading the file says it stopped there and nothing was sent, a router that stops answering says nothing was written and turns the button to Download, and the error is said once in the window, not again as a toast.
- The window, after the knowledge base's quiet-chrome and feedback pages: the file's name as its title with the version beside it in the tertiary colour, one line of what is taken ("Every frame marked ready for dev."), the button, and one status line that reads as progress ("Reading component Button…") and then as the outcome ("Written to <project>: 114 of 114 frames ready for dev."). The button stays focusable while it runs (`aria-disabled`), the status line is a `role="status"` region, and the icons switch no longer shows on a screens file.

## [0.63.0] - 2026-10-22
### Added
- Each icon says the variable its glyph is painted with (`fill`), which its exported SVG loses: an icon placed in the contract editor showed no colour until one was chosen, though Figma draws it in its own. Takes effect with the next snapshot.

## [0.62.0] - 2026-10-20
### Added
- An ellipse drawn as part of a circle or a ring keeps its arc (`arc: { start, end, inner }`, degrees), and a stroke its rounded or other ends (`strokeCap`): a progress indicator at 50% was read, and drawn back, as a whole circle, and compared the same.
- An auto layout stacked first on top says so (`firstOnTop`), which decides which of two overlapping children paints over the other: about 560 layers of one library set it, and none was read. Both found by reading every property the library's components set off its default against what the snapshot records. Take effect with the next snapshot.

## [0.61.0] - 2026-10-20
### Added
- A property that drives its layers in some variants only names them (`links[prop].variants`): a set that gives each size its own icon swap on the one Icon layer said which swap was whose. A contract drawn back links each instance to its own.
- A layer no auto layout places keeps how it follows its parent's size (`constraints`, `STRETCH/STRETCH`), left out at Figma's default: a focus ring stretched round a button that grows with its icon was read as fixed. Both take effect with the next snapshot.

### Fixed
- A private component on a page of its own name (`_Label` on `_Label`) was named under it twice (`_Label/_Label`): the underscore is set aside on both sides of the comparison. No stored library had one.

## [0.60.0] - 2026-10-18
### Added
- Each collection records its variables' scopes, `collections[name].scopes[variable]`: the fields Figma's picker offers each one in, `ALL_SCOPES` kept as it is. The contract editor offers a field only the tokens scoped to it.

## [0.59.2] - 2026-10-14
### Changed
- Paths name the router's new folder, `tools/snapshot`; behaviour unchanged.

## [0.59.1] - 2026-10-14
### Changed
- A comment names the dashboard service's new path, `tools/figma-audit`; behaviour unchanged.

## [0.59.0] - 2026-10-14
### Added
- **Download snapshot**: with no receiver listening, the button saves the snapshot as one JSON file instead of greying out, so the plugin works for someone with no toolkit, router or repo. The terminal command the panel showed is gone; a line says why it is saving.

## [0.58.1] - 2026-10-14
### Changed
- **The panel shows the plugin's version** beside the file line, so a run from a stale build is visible before it is sent.

## [0.58.0] - 2026-10-13
### Added
- **Each layer's Dev Mode annotations** (`notes`: text, category, pinned properties): behaviour a designer writes beside a layer and no measurement can see. The store lists a screen's new and changed notes on every run. Takes effect with the next snapshot.

## [0.57.0] - 2026-10-13
### Added
- **Each screen carries its section** (`screens[].section`): the nearest header page above its page, so two sections may each hold a "-- Main screens" page. The store addresses a screen by section, page and name (snapshot-standard rule 24) and refuses a snapshot from an older plugin.

## [0.56.0] - 2026-10-13
### Added
- **Each icon's description** (`iconDescriptions`), where it has one: an icon library keeps its search keywords there, and the docs site shows them in the icon dialog and matches them in the filter. Takes effect with the next snapshot.

## [0.55.0] - 2026-10-12
### Added
- **Each icon's group** (`iconGroups`): the frame or section the icon page keeps each set in (Accessibility, Arrows…), so the docs site heads each group and lists them in its page nav. Takes effect with the next snapshot.
- **Each asset variant in dark too** (`previews[].variants[].dark`), where the file has a dark mode: a theme-bound logo vanished on the docs site's dark ground when only its light render was sent.

## [0.54.0] - 2026-10-12
### Added
- **In an asset library, every variant gets a preview** (`previews[].variants`): a file with an icon page holds illustrations, photos and graphics, where each variant of a set (each product's domain icon, each profile photo) is an asset of its own. Only the default was rendered, so the docs site's gallery showed one of ten. Takes effect with the next snapshot of that file.

## [0.53.0] - 2026-10-11
### Added
- **Each icon records how many of its paints are unbound** (`icons[].unbound`): visible solid fills and strokes no variable or style binds. The SVG an icon exports as carries the colour and not where it came from, so the icon library's bound-fill check (`figma-foundations-audit`) had nothing to read. Takes effect with the next snapshot. `tests/test-walk.mjs`.

## [0.52.1] - 2026-10-08
### Changed
- Comments cite the standard that owns each rule (skill-standard §B 4 for the ui-base block).

## [0.52.0] - 2026-10-06
### Added
- **Each variable records its key** (`collections[name].keys`), as text styles do from 0.51.0. Drawing a component from a contract binds every fill, stroke, radius and spacing to the library's variables; a variable no layer of the library uses (one project's `Color/Icon/Feedback/*/primary`) had no key anywhere, and listing a library's variables from another file hung for a minute at a time. Takes effect with the next snapshot.

## [0.51.0] - 2026-10-06
### Added
- **Each text style records its key**, as each effect already did: what another file imports it by. Drawing a component from a contract (`tools/contract/to-figma.mjs`) binds its text to the library's style, and without the key had to find a text node using that style in an open library file. Takes effect with the next snapshot.

## [0.50.1] - 2026-10-05
### Fixed
- **Property links address layers as the contract does.** A layer is now a list of names, a repeated name numbered among its visible siblings (`Label[2]`): two text layers named `Label`, one set by Title and one by Subtitle, were one link. A nested instance is not entered, because the references inside it name the inner component's properties. The component set's `defaultVariant` is recorded, so a contract's defaults are Figma's rather than the first variant's. Found by the review of 0.50.0, before any library was snapshotted with it. `tests/test-walk.mjs`.

## [0.50.0] - 2026-10-05
### Added
- **Each component records which layers its properties drive (`links`).** A text property the words it sets, a boolean the layers it shows, an instance swap the instance it replaces: `{ "Label text": { "kind": "characters", "layers": ["Label"] } }`, read from every layer's `componentPropertyReferences` across every variant, hidden layers included, and kept beside `props` as `slots` is, so no tree changes and parity reads nothing new. The component contract (`tools/contract`) had `Label text: TEXT` and a layer reading "Label" with nothing joining them. `tests/test-walk.mjs` (`propLinks`).

## [0.49.3] - 2026-10-03
### Added
- **Every payload's `_meta.plugin` carries the plugin's release.** The store left a field out of a grade when the older snapshot recorded it nowhere, to keep a newly recorded field from reading as "its values moved" — but a library whose layers had no rotation, opacity or shadow until one did looked the same, so the first of each was graded as nothing (Project C's Icosphere turned −180 on 16 September and the entry said nothing). With the release stamped on both sides, a pair taken by one release grades every field. `tests/test-walk.mjs` holds the constant to package.json and the two payloads to the stamp. Found by round 4 of the 2026-10-02 review.

## [0.49.2] - 2026-10-02
### Fixed
- **A boolean-derived variant keeps its slots.** Each boolean property's variants are walked from a detached instance, and detaching turns every SLOT into a FRAME, so those variants recorded their slots as frames: one library's modal had `Content slot` as a SLOT on `Immersive=True` and as a FRAME on the four variants derived from its booleans, and the parity engine's coverage gates, which find a slot by type, walked into it as the instance's own chrome. The slots are noted on the instance before it is detached and put back on the walked tree (`slotPaths`, `markSlots`; `tests/test-walk.mjs`). Handed over by round 3 of the 2026-10-02 review.

## [0.49.1] - 2026-10-02
### Fixed
- **A wrapping frame always records its line spacing.** Figma's `counterAxisSpacing` is null when the lines sit as far apart as the items, and 0.49.0 recorded `crossGap` only for a number, so such a frame stored nothing and the unrecorded-property check, which skips a null, said nothing either: a reader had no line spacing to hold the frame to. Null is now recorded as the item spacing it means. `tests/test-walk.mjs` runs the walk headless against stub nodes. The store no longer grades a field the plugin began to record as "its values moved" (`tools/figma-snapshot-router`). Found by round 3 of the 2026-10-02 review (S14).

## [0.49.0] - 2026-10-02
### Fixed
- **A wrapping frame's line spacing is recorded (`crossGap`, and its variable).** `counterAxisSpacing` — the space between wrapped lines where Figma sets one apart from `itemSpacing` — was listed by the unrecorded-property check as recorded under `gap`, which holds `itemSpacing` only, so a frame whose lines sat 24 apart and items 8 apart said 8 and nothing flagged it. The parity adapter asserts it as the cross-axis gap (`tools/parity`). Found by the 2026-10-02 review of the parity merge (item 40).

## [0.48.0] - 2026-10-01
### Added
- **A linear gradient carries its `transform`.** The angle from the handles is kept, and beside it the paint's `gradientTransform`, rounded to six places. The angle alone cannot say how a diagonal gradient lies on a box that is not square: in Project C's Screens file two gradients recorded as 135° render, in Figma's own frame export, at CSS 135° (the newsletter block, 912×142) and 110.9° (the header, 1728×660). The colour at a point is the transform's first row applied to it, so the parity engine derives the CSS angle and stop positions from this and the rendered box (`tools/parity`).

## [0.47.0] - 2026-09-25
### Fixed
- **Extended collections carry their values.** An extension shares its parent's variables under modes of its own, so reading `valuesByMode` by the extension's mode ids found nothing: Project A's `Brand B` (extending `05. Semantic - Brand`, 29 overrides) was stored with its two modes and no values. Values are now read with `valuesByModeForCollectionAsync`, and the entry records `extends` with the parent collection's name.

## [0.46.1] - 2026-09-23
### Fixed
- **The plugin loads again.** The headless branch ended in a top-level `return`, legal where the bridge evaluates the file as a function body and a SyntaxError where Figma evaluates it as a script: from 0.45.0 the UI plugin failed on launch with "Illegal return statement". The branch is now a function the file defines and the service appends the `return` for headless use; the repo checker parses every plugin main as a script.

## [0.46.0] - 2026-09-22
### Changed
- **Headless mode takes the project's page rule.** `const PAGES`, `const SECTION` and `const EXCLUDE` prepended by the caller — the project's `componentPages`, `sectionHeader` and `excludeSections` — select the component pages the way the audit scanners do, instead of this file's own "every page but Icons and Graphics". Measured on one library: the plugin's rule read 111 sets where the audit read 104, the seven in a section the project keeps out (toolkit-standard §D 7). `const FULL = true` returns the whole library payload, previews and icons included, for a caller that posts it to the router itself.

## [0.45.0] - 2026-09-22
### Added
- **Headless mode.** Run as a body through the Desktop Bridge — no UI, no `__html__` — the file walks every component set with the same `walk` that writes a snapshot and returns `{ components, fileKey, fileName, at }`, posting nothing and writing no relaunch data. The dashboard's validator stage reads the library this way, so the audit reads the LIVE file (toolkit-standard §D 5) in the very shape the store records, rather than a snapshot that can be hours old: a loose drop shadow removed from a dialog stayed in the Web build queue all afternoon because the stage read the morning's spec. `const SCOPE = [ids]` prepended limits the walk to those sets. The component loop is one function, `collectComponents`, for both callers; the moved block is unchanged apart from the scope filter.

## [0.44.0] - 2026-09-22
### Fixed
- **A failed restore no longer ships an anatomy whose image and markers describe different drawings.** When the overlap re-draw fails, the fallback puts everything back on and re-uses the all-on measurements. If the restore itself threw, that was swallowed and the measurements went back anyway — while the instance might still be drawn with the alternatives OFF. The exported PNG would then disagree with every marker on it, with `hidden` empty so nothing said so. The restore now has to succeed before the measurements follow it; if it cannot, the component ships no anatomy. A missing anatomy is recoverable and a wrong one is believed.

## [0.43.0] - 2026-09-22
### Fixed
- **The anatomy re-draw addressed a boolean by its label instead of its key, so it threw every time.** A component property is `Filter panel#123:4`, and a layer's `componentPropertyReferences.visible` carries the whole string — stripped to `Filter panel` for reading, because that is what a person calls it. Feeding the stripped name back to `setProperties` names a property the component does not have, so Figma rejected it and the re-draw failed on every component that needed it. The fallback added in 0.42.0 then restored the overlapping drawing, correctly and silently, which is precisely how a rule that fires nowhere came to look like a rule with nothing to do: `table-toolbar` carries three optional panels overlapping each other by 85%, 70% and 70%, and reported none hidden. Addressed by key now, and a label that resolves to no key fails the re-draw loudly rather than switching nothing off.

## [0.42.0] - 2026-09-22
### Fixed
- **0.37.0's anatomy re-draw took the anatomy down with it when it failed.** Rebasing the measurement origin used `Object.assign` on the object Figma returns from `absoluteRenderBounds` — the API's own, not ours to write. The assignment threw, the throw was swallowed by the catch that stops a failed anatomy sinking the whole preview, and the component shipped with a preview and **no anatomy at all**: `table-toolbar`, the very component the overlap rule was written for, came back from the next snapshot without one. Across that snapshot, 163 anatomies and not one recorded a hidden alternative, which is what gave it away — a rule that fires nowhere on a library that visibly needs it is a finding about the rule. The origin is a plain mutable copy now. And the re-draw is wrapped: switching alternatives off is an improvement to the picture, so an improvement that fails restores the picture it was improving rather than replacing it with nothing. Needs a re-snapshot.

## [0.41.0] - 2026-09-22
### Fixed
- **A slot's layer limits live inside `slotSettings`, and are now read from there.** Two guesses preceded this: `minimumLayers`/`maximumLayers` on the SLOT node (where they are mirrored, so it half-worked and looked right), then the same names on the property definition (where they do not exist, so nothing was recorded at all). What settled it was the `fields` list added in 0.40.0 — the keys the runtime actually exposes — read back from a real snapshot: `type`, `description`, `preferredValues`, `slotSettings`. Instrumenting the unknown beat naming it a third time. The settings object is now stored WHOLE, with the named fields lifted out of it where present, so the next snapshot reveals its shape without another round of guessing. Measured on the library that prompted this: 27 slot definitions, 13 carrying a settings object, 0 with preferred instances.

## [0.40.0] - 2026-09-22
### Changed
- **A slot's settings are read from the PROPERTY, where they live, not from the node.** 0.38.0 read them off the SLOT node and found only the two layer limits, because a slot is a component property of the set — `props` already records it as `"Items slot": "SLOT"` — and its description, preferred instances and limits are on that definition. So the check built on it could ask about the range and never about the contents, which was half the question the maintainer asked for. The definition is now stored as `slots` beside `props` on the spec: `description`, `minLayers`, `maxLayers`, `onlyPreferred`, `preferred`, `emptyByDefault`, `fillCounterAxis`, plus `fields`, the list of keys the runtime actually exposed, so a reader can tell a setting that is absent from one this plugin never asked for. Kept beside `props` rather than inside it, because `props[name]` is a type or a list of variant options to every reader there is. The node-level read is removed rather than left as a second source. Needs a re-snapshot: the 0.38.0 fields that did land are superseded by these.

## [0.39.0] - 2026-09-22
### Fixed
- **A node's AUTO line height is recorded as `auto` instead of being dropped.** The node serialiser skipped `lineHeight` entirely when its unit was AUTO, so the field was simply absent — indistinguishable from "not a text node" and from "a snapshot taken before the field existed". `component-validator`'s W9 and A4 test `lineHeight === 'auto'`, so neither could fire on stored input at all: the 15 W9 rows in the records all date from when the check ran live, none from any snapshot since, and the class reported as checked-and-clean while it was structurally unable to answer. Its own suite stayed green throughout, because the fixture supplies `'auto'` directly — a green test over a rule the real input could never trigger. A text STYLE's AUTO is measured to a ratio and says so in `lineHeightSource`; a node's has no such treatment, so the honest record is the word itself. Needs a re-snapshot to take effect.

## [0.38.0] - 2026-09-22
### Added
- **A slot's own settings, which are the file's answer to "how many of these may there be?"** A slot node was stored as a frame with children, so the only thing a reader could do with it was count the sample content a designer happened to draw — and `component-validator`'s W12 did exactly that, raising a row against every slot in the library asking what its range was. The range is not a guess: Figma gives a slot Minimum layers, Maximum layers, a description, "only allow preferred instances" with its list, and the two defaults, and none of it was recorded. Now `minLayers`, `maxLayers`, `slotDescription`, `onlyPreferred`, `preferred`, `emptyByDefault` and `fillCounterAxis` are. The limits are stored as `null` when the designer left them open and are ABSENT in a snapshot taken before this, so a reader can tell "left open" from "this snapshot cannot see it" — W12 now says nothing at all on the older shape rather than telling someone to fix what it cannot check. Every field is written only when the runtime has it, so a plugin API without one records nothing rather than a confident `false`. Needs a re-snapshot to take effect.

## [0.37.0] - 2026-09-22
### Fixed
- **An anatomy no longer draws two alternatives on top of each other.** The render was every boolean property on, always, which for a table toolbar means the Filter panel, the Sort panel and the Group panel at once: three popovers stacked, most of each hidden behind the next, and the markers for the covered parts pointing into a panel that is not theirs. "Every option on" is right for an ordinary optional part and wrong wherever two options are alternatives — and the file already says which those are, because alternatives overlap. Where two parts shown by DIFFERENT booleans cover each other by more than half, the first in reading order is kept and the rest are switched off before the export, so nothing has to know what a "panel" is. The booleans that came off are listed in `hidden`, and the docs site says so in the caption instead of still claiming every option is on. Needs a re-snapshot to take effect: the drawing is stored, not computed.

## [0.36.0] - 2026-09-22
### Added
- **`instanceOfKey` / `instanceOfId`, and `key` on a component spec: what an instance POINTS AT, not just what it is called.** `instanceOf` is a display string, and every reader that tried to turn it back into a component had to guess. Cut it at the first `" / "` and a component genuinely named `Table - Cell / Fill` loses half its name — 42 components across two projects are named that way, and one library lost 447 of its 4,873 edges to that cut. Match it by name instead and a project defining `Button`, `Avatar`, `State layer` and twelve more in BOTH its web and its mobile library cannot say which was placed. Neither question is answerable from a string, and neither has to be: the main component is in hand where the field is written. The set's published key where there is one, the node id as the within-file fallback for a local-only component, and the component's own `key` on its spec so the two ends meet. `tools/figma-snapshot-router/graph.cjs` reads them; a store taken before this keeps working on the name path and the run reports how many edges had to guess, because a resolver that silently degrades is one nobody notices has.

## [0.35.0] - 2026-09-20
### Added
- **`iconPage`: which page the icons came from.** An icon page's components are exported as SVGs and get no component spec, deliberately — a spec per glyph would swamp the store and give a docs site a page per icon — and their names are already stored. What was missing was the page, so nothing could place them: `figma-foundations-audit` reading the snapshot saw 40 of one library's 69 components, and could not name the 29 it lacked. A reader may not assume what an icon page is called (`toolkit-standard` §D 7), so the file says. One field; with it, that library's snapshot audit matches its live audit component for component.

## [0.34.0] - 2026-09-20
### Added
- **`figmaName`: what the file calls a component, where the page namespace changed it.** A component whose name does not start with its page's name is stored namespaced — `cursor` on the `❖ Graphic` page becomes `Graphic/cursor` — which is right for a display name and wrong for any check that reads names. The two cases collapse into one string: a component the plugin prefixed and one genuinely named `Graphic/cursor` in Figma arrive identical. `figma-foundations-audit`'s new snapshot path reported six "grouped name uses a bare /" findings against a library with none, and a live run of the same file returned zero — the first diff of the two paths, which is exactly what that diff was for. Sent only where it differs, so nothing changes for a component whose name is its own.

## [0.33.0] - 2026-09-20
### Added
- **The five things a component's reader saw live and the snapshot did not.** `component-validator` shipped its own live reader partly because the stored tree could not answer these: an image fill's **scale mode** (`IMAGE:CROP` rather than a bare `IMAGE` — Crop and Tile have no `object-fit` answer and Fill and Fit do), **corner smoothing**, whether a layer is a **mask**, whether a text box **grows with its content** (`textAutoResize`), and **what the effects are** behind a style name (`effects: ["BACKGROUND_BLUR_PROGRESSIVE", "INNER_SHADOW:spread"]`, beside the existing `effect`). Four validator classes were silent on every snapshot run and fired only when someone pasted the script by hand. Reading Figma live for data the snapshot carries is a second reader of one fact (`toolkit-standard` §D 5); extending the plugin is the fix. Both paths now report the same component — `component-validator` 2.7.0 makes `--snapshot` its documented input and keeps the live reader for a file with no project.
- `fontSize` is deliberately NOT added: no rule in any target keys on it, and a field nothing reads is weight in every payload. Add it with the rule that needs it.

## [0.32.0] - 2026-09-20
### Removed
- **Five collection names and four mode names are gone from the payload.** `global`, `semantic`, `layout`, `breakpoints` and `type` were convenience lookups built by matching `/Primitives - Global/i`, `/Semantic/i`, `/Layout/i`, `/Responsive type/i` and `/Breakpoints/i`, then reading the modes `Light`, `Dark`, `Desktop` and `Mobile` by exact name. They existed for two repo receivers that snapshot-standard 2.0.0 deleted; the store has never written them to disk, and a grep over the toolkit and both project repos finds no reader. They were also the one place this plugin assumed what a project calls its collections (toolkit-standard §D 7), which mattered more than the keys did. `_meta.counts` goes with them — it counted exactly those collections — and so does `_meta.collections`, which the store recomputes from the merged store because a two-file project's collection list is not one file's.
### Fixed
- **An alias resolves in the target collection's matching mode without case.** Following an alias, the plugin looked for a mode whose name equalled the source mode's exactly, and fell through to the target's *first* mode when it did not — so a `Semantic:Dark` value aliasing a collection that spells the mode `dark` was written into the Dark map with the Light value, well-formed and undetectable downstream. The store's own reader (`tokens.cjs`) has matched without case since it was written; this side had not. No project in the repo currently spells a mode in two cases, so this is a latent bug fixed, not an observed one.
- **A library snapshot carries `unrecorded`.** The walk collected the layer facts no payload key can hold, the screens route sent them, and the library route dropped them on the floor — so every stored library recorded `unrecorded: null` and the spec-key gate that reads it (the evidence a file is holding something back) had nothing to read. Filled after the component walk, not inside `collectTokens`, which runs before it.
### Changed
- The version stamp names `skill-standard §B`, the standard that governs plugins since the four standards merged. Every plugin's stamp still points at the retired `plugin-standard` numbering.

## [0.31.2] - 2026-09-20
### Fixed
- **A dark render now switches every collection a value depends on, not only the one the layer binds.** A semantic colour usually aliases a primitive, and the primitive's collection carries its own Light and Dark: switching Semantic alone left the alias resolving in the primitive's default mode, so an icon bound to `Colour/Icon/Neutral/primary` stayed light-mode dark on a dark button while the button's own background — resolved inside Semantic — changed correctly. 0.31.0 fixed the half of this that was about nested instances; this is the half that was about aliases. Read off the live file: Semantic:Dark → `Palette/Grey/Alphas/11` → `Primitive - Colour:Dark` = rgb(252,252,252), which is what the render should have shown.

## [0.31.1] - 2026-09-20
### Fixed
- **The temporary page no longer appears in the file's page list.** 0.30.0 moved a run's renders onto a page of their own; the page list is read while that page exists, so `Snapshot (temporary)` reached the snapshot's `_meta.pages` and, from there, a docs site's category list.

## [0.31.0] - 2026-09-19
### Fixed
- **A dark preview switches every collection the component binds, nested instances included.** The dark modes were chosen from the variables the walk had met, and the walk stops at an instance, so an icon whose colour is bound inside the icon kept its light value: a dark icon on Project B's dark icon button, an interactive icon near invisible. The render now registers every binding in the instance's full subtree first. Verified in Figma that the subtree walk reaches a binding inside a nested instance.

## [0.30.0] - 2026-09-19
### Fixed
- **Temporary renders no longer appear on the page the designer is viewing.** The dark previews, anatomy renders, boolean-variant measurements and text-style probes were built on the current page, at its origin, and showed over its content while a run lasted. They are now built on a page of their own, `Snapshot (temporary)`, removed when collection ends; one left by a crashed run is reused and removed by the next. Verified in Figma: render bounds and PNG export work on a page that is not the current one.

## [0.29.0] - 2026-09-19
### Added
- **An anatomy text part carries its alignment** (`align: center | right | justified`, absent for left), so the docs point a marker at the words rather than at the start of a box that spans the component with its text centred (an empty state's title).

## [0.28.0] - 2026-09-19
### Added
- **A component's anatomy**, on each preview as `anatomy: { w, h, png, parts }`: the default variant rendered with every boolean property on, so optional parts (icons, helper text) are in the picture, and each part measured on that same render (x, y, w, h from the image's edge), with the boolean that shows it (`optional`), the component a nested instance comes from, and a count for repeated siblings. The docs number these parts on the render, as Material, Carbon and Atlassian draw anatomy.

## [0.27.0] - 2026-09-19
### Added
- **Text and effect styles carry their library `key`, and a text style its `authored` line height and letter spacing** (Figma's own `{ unit, value }`, `AUTO` included). The documentation generator applies each style to its sample text by key and shows the units the file was written in, so it read the file live for both; with these it reads the snapshot like every other output.
- **Blur layers travel with their effect style**, as `{ type, blur }`. The snapshot sent shadow layers only, so a style with a background blur was documented short a layer; a token build still skips it, since DTCG's shadow type cannot carry it.
### Fixed
- **A text-style binding shipped as a one-element array was missed.** Figma returns a bound key as an alias object or an array of one, and 0.24.0 read only the object. No project snapshotted so far used the array form.

## [0.26.0] - 2026-09-19
### Added
- **Which variables are hidden from publishing**, per collection as `hidden: [names]`, present only when any are. The live token export marked a hidden tier and the snapshot did not, so Project B's brand primitives, deliberately hidden, came out of a snapshot-built export as public.

## [0.25.0] - 2026-09-19
### Added
- **A shadow layer's variable bindings travel with it**, as `bound: { color, x, y, blur, spread }` on each layer, the same `{ collection, name }` as a text style's. The live token export kept a shadow's references and the snapshot sent only resolved values, so a shadow built from the snapshot lost its tier: Project B's eleven effect styles, every field bound, came out as literals.

## [0.24.0] - 2026-09-19
### Added
- **A text style's variable bindings travel with it**, as `bound: { fontFamily, fontSize, fontWeight, lineHeight, letterSpacing }`, each `{ collection, name }` and present only where bound (a weight bound through `fontStyle` counts). The token export and the docs guessed bindings from a naming convention, `<style>/size`, because the snapshot never said; a binding that broke the convention silently became a literal. Snapshots taken before this still read by the convention until retaken.

## [0.23.0] - 2026-09-19
### Changed
- **The router says whether a file is a library or a screens file; the plugin only guesses for a file no project claims.** The guess read the file's contents, and since 0.20.2 a file with component sets and no frame marked Ready for dev counted as a library, which also caught a screens file with local components before its first frame was marked: it was then refused as an unknown library file where it used to report "0 ready of N". The plugin now asks `GET /?file=<id>` and takes the kind the project's routing block records.

## [0.22.3] - 2026-09-19
### Fixed
- **A text style's letter spacing in pixels was sent as if it were em.** Percent went out as a fraction of the font size and pixels went out raw, in the same field, and every reader (the docs, the token export) takes that field as em, so -0.5px would have read as -0.5em. Pixels are now divided by the style's font size, as line height already is. No project uses pixel letter spacing today.

## [0.22.2] - 2026-09-19
### Fixed
- **A components file with its colours in another library got no dark previews.** The dark mode was looked for among this file's local collections only, and a components file that reads a separate foundations library has none: Project B's 175 components shipped 0 dark renders although its foundations have a Dark mode. The collections are now those of the variables the snapshot has read, this file's tokens and every variable a component walk met, remote ones included.

## [0.22.1] - 2026-09-19
### Fixed
- **Dark previews were cut off at 100px.** The instance was rendered inside a new frame, which Figma creates 100 by 100 with clipping on, so every dark render lost whatever lay past 100px and its shadow at the top and left: Option select came through 100 wide instead of 192, Button 4px short on two sides. The frame no longer clips.

## [0.22.0] - 2026-09-19
### Added
- **Component previews in dark mode too.** A library with a dark mode (a collection's non-default mode named Dark, the test the docs already use for a mode's ground) sends each preview a second time as `dark`, rendered from an instance inside a frame set to that mode, so the component itself is never edited. The docs showed the light render on a dark page, captioned "light mode" by assumption, with no way to follow the reader's theme. A dark export that fails still sends the light one.

## [0.21.0] - 2026-09-19
### Added
- **The file's page list travels with a library snapshot**, as `_meta.pages` in the file's order, category headers and dividers included. Components were documented grouped by their status because the snapshot carried each component's page name but not the order or the `🔷 CATEGORY` headers that group them (figma-standard rule 11), so no reader could show the library the way the file organises it.

## [0.20.2] - 2026-09-19
### Fixed
- **A components-only file was snapshotted as a screens file.** The plugin called any file without variable collections a screens file, so a design system that keeps its variables in one file and its components in another sent its whole component library down the screens route, where the router refused it as an unknown screens file. A file with component sets and no frame marked Ready for dev is now a library, and a library with no collections is no longer refused: its tokens are empty, and the store merges it beside the file that holds the variables.

## [0.20.1] - 2026-09-19
### Fixed
- **The closing line said "Written to the repo … Run bin/check" for a project with no repo.** A design-only project is written by the toolkit's store, which has neither, so a successful Foundations snapshot read as nothing having happened. The line now shows the router's own answer (`project-b: written`) with the counts, which names who wrote it in every case.

## [0.20.0] - 2026-09-18
### Added
- **Component descriptions travel with the snapshot.** Each component carries `description` (Figma's `descriptionMarkdown`, falling back to the plain text), always sent, empty included, so a description deleted in Figma is a change the repo sees. Every consumer that wanted the designer's guidance (a docs site's usage and don't, the guidelines panel, the descriptions check) had to read the file live, because the snapshot left it behind: zero `description` keys across every component spec in the repos that take this payload.
- **Variable descriptions**, per collection under `descriptions` (name to text, non-empty only). The doc generator reads OKLCH sources from them and walked the file live to get them.
- **A preview image of each component's default variant**, in a top-level `previews` array (`{ name, w, h, png }`, 2x) beside `graphics`, exported under the same switch, now labelled "Export images". Before any code exists a design image is the only preview documentation can show, and nothing produced one. Beside the components rather than inside them because both repo receivers copy a component's keys into its committed spec, where a base64 image would be a megabyte of diff per snapshot; a receiver that does not know the key ignores it.

## [0.19.1] - 2026-09-16
### Fixed
- **Secondary buttons turned brand-blue under the pointer.** ui-base's `button:hover` (0-1-1) beat `.btn-secondary` (0-1-0), so Copy and Check again took the primary hover. Fixed in the canonical `plugins/_shared/ui-base.css` and re-inlined (the block is **ui-base v2**), so every plugin is fixed at once rather than this one being patched.
- **`package.json` was empty**, so the plugin had no version source of truth — §2 requires one — and `node --check` in this directory failed on the invalid package config rather than on any code.

## [0.19.0] - 2026-09-16
### Added
- **The button is dead until something is listening, and the panel says what to run.** Collecting a library is half a minute of reading the designer's file, and the only way to learn nothing was listening was to spend it and be told at the end — over a red line that still named `bin/figma-snapshot`, which no longer listens at all. The plugin now asks the router on open (a plain GET, which it answers with the projects it serves), greys the button out if nothing answers, and shows the one command to start it in a box you can select, with Copy and Check again beside it. A post that fails mid-session shows the same notice rather than another log line.

## [0.18.0] - 2026-09-16
### Fixed
- **A refused or failed write reported itself as "done".** The receiver answered the moment the payload landed, so the plugin — which only reads the status — told the person in Figma the snapshot had worked, whatever happened next. The one place the truth appeared was a terminal they were not looking at, which is the shape of every defect this chain has had. The router now replies when the receiver has finished, with 200 written, 409 refused and 500 failed, and this shows the body rather than the number: "Project D: refused the payload" instead of "server answered 409". The unreachable-server message names the router, which is the thing to start.

## [0.17.0] - 2026-09-16
### Added
- **A file now says which file it is.** `figma.fileKey` is `undefined` for a plugin run from **Development**, which is how this one is always run — so every payload has always arrived anonymous, and a receiver had nothing to check. That was harmless while one project existed and dangerous the moment a second did: the plugin posts to a FIXED port, so whichever repo happened to be listening wrote whatever was snapshotted, and two projects whose libraries are both named "UI library" gave nobody a clue. Both payloads now carry `_meta.fileId`, generated once and stored on the document root (`snapshotFileId`), so it is unique because we make it and stable because it lives in the file — through renames, and through duplicating a page. `fileKey` is still sent where Figma supplies it and a receiver may use either. Written only when missing, for the same reason the relaunch data is: the write is an edit, and a file that gains one on every snapshot reads as unreleased work. A view-only file cannot be stamped and sends nothing rather than a fresh id per run, which would look like a new file each time.

## [0.15.0] - 2026-09-08
### Fixed
- **A gradient painted directly on a node came through as the word `GRADIENT_LINEAR`.** The reader that turns a linear gradient into an angle and stops lived inside the paint-style loop, so only gradients *published as styles* survived the export; a node's own fill lost everything but its type. An Empty state's halo was that word, and nothing downstream could render it or compare it. The reader is now a function both paths use.

## [0.14.0] - 2026-09-08
### Added
- **`strokesInLayout` on any stroked node.** Figma's `strokesIncludedInLayout` decides whether an INSIDE stroke shrinks the box or is drawn over its contents, and two nodes in one library disagreed: a text field's stroke took its pixel from the inner frame (294 → 292 when it grew to 2), a selection list's did not (five 48-high rows, box 240 not 242). A parity check has to map an inside stroke to a CSS border, which always takes its room, so without the flag it is two pixels wrong on one of the two and cannot tell which. Found by building the library's Selection group; the consuming repo carried three waivers for the difference until this landed.

## [0.13.1] - 2026-09-08
### Fixed
- **A stray space in a component's name produced a doubled component.** `componentName` prefixes the page name unless the component's name already starts with it, and it compared untrimmed — so a set called `" List item - Selection"` on the page `❖ List item - Selection` came out as `List item - Selection/ List item - Selection`, which reached the consuming repo as a folder of that name and 60 variants nobody could account for. A leading space is invisible in the layers panel, which is why it survived. Both sides are trimmed before the comparison and the name is sent trimmed: a repo should not carry a typo it cannot see.

## [0.13.0] - 2026-09-08
### Changed
- **A library is no longer required to name its collections after the first project's.** The payload gains `collections` — every variable collection under its own Figma name, with every one of its modes, values and aliases — and that is the shape a new repo reads. `Primitives - Global`, `Semantic`, `Layout` and `Responsive type` are now a *convenience lookup* over that map rather than a precondition: the plugin no longer throws when one is missing, and only refuses a file with no variable collections at all. The four legacy keys (`global`, `semantic`, `layout`, `type`) still ship, empty rather than absent when their collection is not in the file, so the first project's receiver goes on working unchanged.
- `_meta.collectionCounts` reports variable counts per collection name, beside the existing `_meta.counts`.

### Fixed
- **A collection matching none of the five named lookups was carried only as far as an alias reached it.** The colour primitives arrived as the *first hop* recorded in `semantic.alias` and never as a tier of their own. For the first project that matches its own rule — its colour primitives are `hiddenFromPublishing` and consumption is semantic-only — so nothing was lost there. It is a real limit for a library that publishes its primitives deliberately: Project D's `Primitives - Colour` holds 163 variables, its largest collection, and a two-tier token file cannot be generated from aliases alone. Every collection is now carried in full, whatever a project's tier rule.

## [0.12.0] - 2026-09-06
### Added
- Text styles carry `paragraphSpacing` and `listSpacing`, always, 0 included; text nodes carry `listSpacing` when set, and it joins the renderable list. A designer changed both spacings on every Text style and the snapshot reported no change, because the export stopped at line height and letter spacing — the loop's promise is that the designer never has to say what changed, and this was a property it could not see.

## [0.11.0] - 2026-08-25
### Added
- `_meta.unrecorded` names any renderable property a node carries that the walk does not send. The consuming repo could prove every recorded property was compared and nothing could prove Figma was not holding something back — four defects in one day were exactly that, each found only after someone saw the page was wrong.
- Every frame marked ready for dev exports as a PNG beside its tree, scaled so the longest side is 1200. Numbers cannot see a composition: an upside-down image, a border drawn twice and a title that wraps each measured identical to the design and each shipped. The frame travels with the snapshot so the check can compare the result, not only the parts.

## [0.10.0] - 2026-08-25
### Added
- An image fill's own rotation, as `fillRotation`. A layer rotated 180 whose fill is rotated 180 shows its asset upright, and only the layer's rotation was recorded — so a hero shipped upside down while every property the loop compares (box, fills, effects) measured identical. A rotation is invisible to all of them.

## [0.9.1] - 2026-08-25
### Added
- A text layer records `truncate` and `maxLines`. A title clipped to one line with an ellipsis measures exactly like a title whose sample text happens to fit, so a card wrapping to two lines was waived as "the sample is longer" — the intent was in the design and in no property anyone had recorded.

## [0.9.0] - 2026-08-25
### Added
- A text layer records `textCase`, `textDecoration`, `textAlignVertical`, and a `letterSpacing` or `lineHeight` typed onto the layer over its style's. Any node records `blendMode` and a dashed stroke's `dashed` pattern. All of them render and none was recorded, so no check could have caught one.
- A rotated layer carries `visual`, the box the eye sees (`absoluteBoundingBox` in its parent's coordinates), beside the `x`/`y` of its own transform. `rotation` was recorded and every consumer had to derive the visible box from it — two derived it differently, both defensibly, and a hero shipped with its art off-screen. The snapshot answers it now instead of asking.

## [0.8.1] - 2026-08-25
### Added
- A text layer records `align` (`textAlignHorizontal`). A heading that fills its box measures identically whether its words sit left or centred, so alignment was the one visual property of a text layer nothing in the loop could see.

## [0.8.0] - 2026-08-25
### Changed
- **The receiver's port is 9317** (was 9227), and the consuming repo's receiver must move with it. `figma-console-mcp` listens on `[::1]:9227`; macOS resolves `localhost` to `::1` first, so every snapshot reached that server instead and came back `server answered 404` while the receiver held the IPv4 half and logged nothing. Posting to `127.0.0.1` looked like the fix and is not one: `devAllowedDomains` takes hostnames, and an IP literal is rejected as a manifest error (0.7.4 and 0.7.5, both wrong).
### Fixed
- A failure reports its message again. `e instanceof Error` is false for a rejection crossing the plugin sandbox's realm, so the text had collapsed to `[object Object]`.

## [0.7.3] - 2026-08-25
### Fixed
- `checkJs` reports nothing left to fix (was 15 errors, two of them from the config itself): `lib` drops `lib.dom`, which redeclared the `console` and `fetch` that plugin-typings declares, and the flag hung on `walk` became a module-level `walkWhole` a checker can see. The pragma had been decorative for as long as the errors outnumbered anything a real mistake would add.

## [0.7.2] - 2026-08-25
### Added
- A screens file sends only the top-level frames marked **Ready for dev** or **Completed** in Figma; an unmarked frame travels as name and id alone, so the receiver can say what it passed over without carrying a draft's tree. Figma allows the status only on a node directly under a page or section, which is the set this collector already walked.
### Fixed
- The `code.js` version header said v0.3.0 while `package.json` was four minors ahead (skill-standard §B 8: package.json is the source of truth, mirrored in the header).

## [0.7.1] - 2026-08-22
### Added
- A `Breakpoints` collection, when the library has one, is read into `breakpoints`; the Layout collection is the designers' own.

## [0.7.0] - 2026-08-22
### Added
- Every layer below a root carries `x` and `y` inside its parent, so alignment within a box can be compared, not only size.
- Text is recorded up to 400 characters (was 60), so copy the design decides can be compared with what renders.

## [0.6.3] - 2026-08-22
### Fixed
- Screens walk their instances whole. A screen built as an instance of a screen component with no overrides recorded no layers at all, so nothing on that page could be measured.

## [0.6.2] - 2026-08-22
### Fixed
- A boolean-expanded tree is sized to its variant before walking; a fill-width variant's instance had taken the page's width (1440 for a 1432 bar).

## [0.6.1] - 2026-08-21
### Fixed
- An instance's `instanceOf` carries the page namespace the component list uses (`Graphic/Switch`), so the parity children check no longer reads the Graphic page's Switch as the Switch control.

## [0.6.0] - 2026-08-21
### Added
- Boolean component properties are expanded: each is flipped from its default on every variant, one at a time, and walked as a tree named `<variant>, <Prop>=<value>`. Before this a boolean lived in `props` only, so a layer it shows (an Expired label, a Count badge) was drawn in the library and measured by nothing.

## [0.5.0] - 2026-08-21
### Added
- Every node carries `bindings`: the variable name behind each bound number — padding, gap, radius, stroke weight, opacity, min/max and fixed sizes. A padding of 16 and `Spacing/16` measure the same; only the binding says whether the design decided it or someone typed it.

## [0.4.1] - 2026-08-21
### Changed
- An instance-swap property carries the swapped component's name (its set's name for a variant) instead of a node id.

## [0.4.0] - 2026-08-21
### Added
- Colour styles are collected (`paintStyles`): solids and linear gradients, stops named by their bound variable, angle from the gradient handles. A node filled with a colour style carries `fillStyle`.

## [0.3.1] - 2026-08-21
### Fixed
- The manifest carries a stable `id`. Without one a development plugin gets a fresh id on every import, and the Tools entry written by an earlier run points at a plugin that no longer exists.

## [0.3.0] - 2026-08-21
### Added
- An instance with overrides (beyond its properties, name or visibility) is walked, so an override inside a nested component shows in the snapshot instead of hiding behind the instance's name.

## [0.2.2] - 2026-08-21
### Changed
- Relaunch data is written only when missing: the write is a file edit, and a receiver that compares edits with releases saw every run as unreleased work.

## [0.2.1] - 2026-08-21
### Changed
- Relaunch data is set on every open, as the house plugins do, rather than behind an idempotency read.

## [0.2.0] - 2026-08-21
### Added
- A **Take design snapshot** button in the file's Tools section after the first run (relaunch data on the document root).
### Changed
- "Export icons" is a switch; the window is sized to its content.

## [0.1.0] - 2026-08-21
### Added
- Initial release: the design-to-code collector as a plugin — library tokens, components and icons, or a screens file's frames, posted to a local receiver in one click. Lifted from a consuming project's bridge-served script after two days of 30-second call limits and wedged icon exports.
