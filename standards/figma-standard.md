# Figma standard — how a design-system library is built in Figma

**Version 2.31.1** — history in [`changelog/figma-standard.md`](changelog/figma-standard.md).

**Scope.** How a component library is built inside Figma: variant axes and states, how everything in it is named (components, properties and their values, parts, layers, pages, tokens and styles, which code takes as written), page structure, and the token rules that only Figma can hold. How any rule is admitted, enforced, changed and retired is [`toolkit-standard.md`](toolkit-standard.md)'s (§C).

**Precedence** and **values** are the root's (toolkit-standard *Precedence* and §C clause F): an override is a decision, not a deviation. During capture these rules are offered as proposed answers, never assumed.

Cite a rule as `figma-standard rule N`.

## Components and variants

1. **Axis order**: props/booleans first, then `Size → Variant → Feedback/… → Disabled → State`. `State` always last; `Disabled` a VARIANT False/True immediately before it. A True/False axis lists its default first, so the panel opens on what a designer gets; a validation axis takes rule 57's order.

   *Why:* one canon keeps property panels predictable across projects.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "schema|axis-order|state"; `skills/figma-components-audit/scanner/audit.js` "schema|axis-order|disabled"; `skills/figma-components-audit/scanner/audit.js` "schema|bool-default|"; `skills/figma-components-audit/scanner/audit.js` "schema|order|" — State last, Disabled before it, a True/False axis's default first, and each axis's options against the recorded order.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — props before variants, and the order of the axes before Disabled, which no script compares.

2. **Sparse grids**: omit semantically impossible combinations — Disabled pairs only with Rest (with Focus too where the code keeps the disabled control focusable, `aria-disabled`, since it then takes focus and shows the ring), and a selection cannot contradict itself. Sparseness on a *content* axis is a gap unless ruled.

   *Why:* a grid cell for an impossible state documents a lie.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit: which combinations are impossible is a judgement about the component.

3. **Variant order inside a set: the `Disabled=True` variant sits immediately after its `State=Rest` sibling**, before the other states — each selected/boolean group reads Rest → Disabled → Focus → Hover → Press.

    *Why:* Disabled is Rest's counterpart, not a sixth interactive state (rule 2), so beside Rest each group reads as the control, its disabled form, then its states, on the canvas and in the picker. Buried after Press, the sparse grid reads as a gap.

    *Evidence:* maintainer-decreed 2026-08-13; that day 28 of 28 sets in one web library with both axes placed `Disabled=True` at its Rest sibling's index + 1.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "schema|disabled-order|" — a set's `children` order is its variant order; the rest step is the state scale's first. First run: the fixture library's `Button - CTA` and `Menu button` place Disabled after Loading.

4. **State axis internal order**: `Rest → Focus → Hover → Press (→ Loading)` — Focus immediately precedes Hover, not the reverse. Loading's place on the axis is rule 58's.

    *Why:* Focus is the required state (WCAG 2.4.7) where hover is a mouse-only enhancement; Material layers hover over focus, and the lint-enforced CSS order (`:focus → :hover → :active`) agrees. Reconstructed after the fact: it grounds keeping the pattern, not its origin.

    *Evidence:* 2026-08-10, two registered projects author `State` with Focus immediately before Hover, no exception.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "schema|order|".

58. **Loading sits on the State axis, and code separates it.** It is not a pointer state, so the build does not model it as one: a `loading` prop that keeps focus with `aria-disabled` and announces through a live region ([loading buttons](../knowledge/ui/components/button.md#loading-buttons); `aria-busy` alone reaches almost no screen reader), separate from `:hover`, `:focus-visible` and `:active`. An audit does not raise it; `component-validator` writes it into the component's Implementation notes (its case WT1) and its W7 check leaves it alone.

    *Why:* In Figma one axis keeps the component lean — a `Loading` boolean beside a State axis doubles the grid for a state that excludes the others.

    *Evidence:* recorded 2026-09-22, after the finding "the State axis carries Loading" came back on every run of one library and was ruled away and back again.

   *Reviewed:* `skills/component-validator/references/web.md` "WT1 · State axis" — the validator writes Loading's build into the component's Implementation notes, and no audit raises it.

57. **An open state is a False/True `Open`, never a State value; validation is one `Validation` axis.** An open menu, list or popup is a False/True `Open` property, as code's `aria-expanded`, `open` or `isOpen` is, never a `State` value: code can be open and hovered at once, and so can the frame. Validation is one axis named `Validation`, valued `None` first, then the problems (`Error`), over code's `invalid`, `aria-invalid` or `validationStatus`.

    *Why:* a State value excludes every other state, so `State=Open` cannot draw an open trigger that is also hovered or focused, which the product shows; and one validation axis keeps the problems a field can show on one choice, with the clean field first as a True/False axis puts its default first (rule 1).

    *Evidence:* `Open` as a boolean: maintainer-ruled 2026-11-19, as Primer's `ActionMenu` and Carbon's `MenuButton` kits draw it, over the State-axis research article's `State=Open`. The validation order: whole-document review 2026-10-08 (rule 1 stated it then).

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "schema|order|" — the validation axis's values against the recorded order (`Validation`: `None`, `Error`).

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — an open state drawn as a State value, which no scanner rule names yet.

5. **A property that fills a layer sits immediately below the property that reveals it.** Where a BOOLEAN toggles a layer's visibility and another property supplies that same layer's content — a TEXT property for its characters, an INSTANCE_SWAP for its main component — the two are adjacent in the properties panel, revealer first. This refines rule 1's "props/booleans first" clause, which fixes where the props block sits and says nothing about order inside it.

    *Why:* the two are one control in two halves, and only adjacency says so: nothing in `componentPropertyDefinitions` records that one governs the other. Split apart, a consumer who switches the boolean on hunts for the field that fills what appeared.

    Maintainer-decreed 2026-08-20 from a menu item's `Show count` and `Count`; the same library's button already held its icon boolean and swap adjacent.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — in the property panel. The panel's order is not readable: `componentPropertyDefinitions` returned `Label text, Count text, Count` for a set whose panel showed `Count` above `Count text`, so a script would fire on conforming components.

7. **A parent owns the state of a part it drives.** When a component changes a nested part's state (a FAB opening its button), the part is one set with that state as an axis, the parent sets it, and the parent's own property is what a designer touches. Split the part into ` / ` siblings per state (rule 20) only when designers must reach the part's other properties, which Figma exposes all together or not at all; say so in the parent's description.

    *Why:* a part's state is the parent's behaviour, and code puts it on the parent too. Carbon keeps `Open` on its menu button and leaves the nested button alone, and no kit read for rule 21 splits a child per state; the split is the one way to expose a part's icon without its state.

    Maintainer-decreed 2026-10-07.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit, wherever a part's state changes with its parent.

25. **Every public component carries a real description.** A description is not empty, not the component's name repeated, not a placeholder (`TODO`, `TBD`, `lorem`), and longer than a label. A public component's description carries a Usage and a Don't section, and Code gen notes; a slot part (a public part every use of which sits inside other components on its own page, in a slot or directly — decided by where it is used, never by its name, as `figma-component-descriptions` decides it) is chosen through its parent and owes none. A private part takes the compact form `figma-component-descriptions` writes, and its absence is hygiene rather than an error. A variant holds no description of its own unless it is the set's text: whoever reads that variant gets its copy, which goes stale the day the set's is rewritten.

    *Why:* the description is what the assets panel, Dev Mode and generated docs show; an empty one leaves every consumer guessing, and a placeholder is worse, because it looks like documentation.

    *Evidence:* (Mechanism, not an incident.) The scanner tests the three shapes a non-description takes: empty, the name again, a stub (`minDescription`, `descriptionPlaceholder`). The variant clause, 2026-10-25: after a project's descriptions were rewritten, five sets still held older variant copies, one another component's text.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "metadata|description" — an empty description, an error on a public component and hygiene on a private part; `skills/figma-components-audit/scanner/audit.js` "metadata|placeholder" — the name again, a placeholder word or a stub, tiered the same.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "metadata|variant-description" — variants whose description differs from the set's, a warning.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "metadata|guidance" — a public component's missing Usage or Don't section, a warning, and Code gen notes, a review; slot parts left out.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "### Session probes" — a placeholder or a repeated name, which the session's metadata probe reads.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — whether the text is still true of the component, which no script can read.

26. **An interactive component is at least 24px on each side, and text is at least 12px.** The target is WCAG 2.2 SC 2.5.8 (AA) without its spacing exception, since spacing is the product's. A larger transparent hit area around a smaller shape meets it. A component that is not interactive (a divider) and disabled text are exempt.

    *Why:* a smaller target is missed by people with limited dexterity and on touch, and smaller text stops being readable; both are cheapest fixed in the library.

    *Evidence:* the check first used 44px (SC 2.5.5, AAA) and flagged nearly every interactive component of one desktop library; 24px, the project's own AA floor, separated the real cases.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "### Session probes" — the session's size probe lists every variant under the target and every text under the minimum; the reader drops the components that are not interactive, the ones a hit area covers, and disabled text.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "accessibility|target" — interactive variants under `minTarget` on either side, a review: a transparent hit area can meet it.

27. **A component is placed as an instance, never as a detached copy.** Outside the component pages, a frame or group named like a component is a detached copy unless it is part of another component's own structure. An instance whose main component no longer exists is the same defect: it keeps its look and stops receiving updates.

    *Why:* a detached copy keeps the look and loses the link: it misses every later fix to the component, and no audit of the component reaches it.

    *Evidence:* (Mechanism, not an incident.) The scan's first version read pages before loading them and saw none, and treated an unfamiliar prefix as non-component, flagging a page's own structure; both fixed in the engine.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "### Session probes" — the detached scan lists frames named like a component outside the component pages, and the reader checks each one's ancestry; it also lists an instance whose main is gone, which no scanner rule finds yet, verified by key first, since a remote main reads parentless when its file is not connected.

30. **Every component property drives a layer, in every variant where that layer exists.** No property is declared and applied to nothing, and a layer wired to a property in some variants is wired in all of them. Variant axes and slots are not layer references and are exempt; a layer present only in some variants (a small size's icon, a loading state's spinner) is counted only where it exists.

    *Why:* Figma skips at publication a component declaring a property applied to no layer, while the publish reports success. A layer whose twins disagree passes every per-layer check, and the property changes its text in some variants only.

    *Evidence:* one library merged a button's three sizes into one set, collapsing three label properties into one; 72 of 108 labels lost their reference, every check passed, and the maintainer found it by eye. The publication skip reproduced live 2026-08-08.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "properties|unused|"; `skills/figma-components-audit/scanner/audit.js` "properties|wired|" — a declared property no layer references, and a layer wired in some variants and not in others, keyed by path and by what the layer is.

31. **Each state draws differently from its Rest sibling.** A Hover, Press or Disabled variant that renders identically to the Rest variant equal on every other axis is a product bug, and leads the queue ahead of anything cosmetic. How Focus is indicated is rule 39's.

    *Why:* the canvas shows every state at once, so an identical pair hides in the grid; the product shows one at a time, and a user pressing the control sees nothing happen.

    *Evidence:* 2026-08-13, one live library: two states identical to Rest, product bugs, since the set's other side rendered its states correctly. Without the root's opacity and fills the diff reported 42 false ones.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "states|" — every non-rest state against its Rest sibling: fills, strokes, effects, opacity and visibility of every layer, the root's included.

48. **A state variant binds its own state's tokens.** A Press variant takes no Hover token, a Hover variant no Press token, and a resting token appears in another state only on a layer that carries it at Rest too (a switch knob that never changes). A state no token names, such as Loading, borrows the resting tokens by design.

    *Why:* rule 31 catches a state that looks like Rest, not one that looks like another state: a Hover colour left in Press renders a change, just the wrong one.

    *Evidence:* 2026-10-15, one live web library: a square Rest fill behind 36 rounded button variants, a Hover fill over a Date picker's Press variant and on two Focus radios, all fixed that day.

   *Checked:* `skills/figma-components-audit/tests/test-audit.mjs` "figma-standard rule 48: a resting token added in Hover only, and a Hover token in Press, are raised; a knob at rest in every state is not".

50. **A library that mirrors keeps order in auto layout and says what mirrors.** Where a project ships a right-to-left language (`rtlLanguages`), nothing that must follow reading direction is pinned to one edge or drawn into the component; no layer, property or option says left or right (rule 21's position words); a directional icon records in its description whether it mirrors (`Right to left: mirrors` or `Right to left: stays`); and a component with anything that mirrors, or deliberately does not, says so in a `Right to left` section of its description: uneven padding by leading and trailing, end alignment, corners rounded on one side, a text box wider than its text aligned to a side, a text case only Latin has. Every text style binds its font family (rule 43), so a mode per script switches the typeface. Where the project also draws right-to-left screens first, rule 59 adds a `Direction` axis. A project with no right-to-left language is not held to it.

    *Why:* Figma has no layout direction, so the product mirrors in code, which reverses a row by itself but not a pinned layer, a drawn arrow, sided padding or radius, or a name that says left, and cannot know that playback controls stay. The description is where Dev Mode, Code Connect and the MCP server show those decisions.

    *Evidence:* 2026-11-04, one web library of 82 sets: 58 sets and 461 variants hold a row that must reverse, counted across every variant (a first-variant count read only 41 and 238); a chat bubble's side was an end alignment a padding and radius scan called clean; and Figma's MCP server returned a chip's 12 left and 8 right padding as `pl-`/`pr-`, so uneven padding not written down ships unmirrored ([i18n: logical properties and mirroring](../knowledge/code/i18n.md#logical-properties-and-mirroring)).

   *Checked:* `skills/figma-components-audit/tests/test-audit.mjs` "figma-standard rule 50: with rtlLanguages, a pinned layer, a drawn chevron, a side name, uneven padding, end alignment, one-sided corners, an icon with no decision and a set with no Right to left note are raised; a stretched focus ring is not; without it, nothing".

59. **Where right-to-left screens are drawn in Figma, a set that mirrors carries a `Direction` axis.** Where the project also draws right-to-left screens in Figma before code (`rtlInFigma`), every set with anything that must mirror under rule 50 (a row of parts, even one a boolean shows, a directional icon drawn into the component, or any of rule 50's list but a text case) carries a `Direction` variant axis with `LTR` and `RTL`; a set that only holds such a component is covered by it. Components that keep their direction, such as charts, are named in `rtlStays`, and rows a person decides, such as media controls, in `rtlByHand`.

    *Why:* an instance cannot mirror its own parts, and Figma has no layout direction, so a right-to-left screen drawn before code can only place a set that already holds the mirrored drawing.

    *Evidence:* 2026-11-05, the same library: with the variant asked only of rows, which sets need it was counted by a hand-written walk, since padding, end alignment, side-aligned text, one-sided corners, pinned layers and directional icons need it too (figma-components-audit 2.41.0).

   *Checked:* `skills/figma-components-audit/tests/test-audit.mjs` "rtlVerdicts: a row, uneven padding and a boolean-shown row need the variant; holding one, at any depth, is covered; rtlStays and rtlByHand are kept apart; the rest needs none".

32. **Text meets the project's contrast floor against its surface, in every mode.** Where the project names no floor, WCAG 2.2 SC 1.4.3 (Contrast Minimum, AA) applies: 4.5:1, and 3:1 for large text (24px, or 18.66px bold). Each pair is resolved per mode with its alpha; a translucent pair is checked by eye, and disabled text is exempt.

    *Why:* a contrast failure hides in the mode nobody has open: a pair failing in Dark looks right to whoever designs in Light. The fix belongs to the token pair, never to unbinding.

    *Evidence:* (Mechanism, not an incident.) A paint caches the colour of the mode on screen, so one reading checks one mode; following aliases into their target's first mode once gave Light and Dark identical ratios, so an alias is followed by mode name.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "accessibility|contrast|" — text over an opaque surface inside its component, in the mode each variant resolves to, disabled variants exempt.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — every other mode, and translucent surfaces, which one reading cannot see; the reader names the failing token pair and its mode.

33. **A component is built from auto-layout frames, never groups, and its text hugs vertically.** A `GROUP` inside a component becomes a frame; a boolean operation inside an icon is not a group. A text layer has no fixed height unless it truncates by design (`ENDING`, a maximum line count) or fills its parent by instruction.

    *Why:* a group ignores auto layout, so it stays put when content moves; fixed-height text clips instead of reflowing, in the locale nobody tested.

    *Evidence:* (Mechanism, not an incident.) The group check, 2026-08-08, was silent on 55 real components and fired on a probe. Fixed height is read from `textAutoResize`: `layoutSizingVertical` said `FIXED` on 33 layers that hug.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "structure|group|" — every group in every variant, never inside an instance.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "structure|no-autolayout|" — a frame holding visible layers without auto layout, a review: an overlay or illustration may be absolute by design.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — fixed-height text, which no scanner rule reads yet; the reader clears designed truncation.

34. **A hidden layer is hidden by a property, and a switched-off paint, stroke or effect is removed.** A layer hidden in every variant with no boolean controlling it is dead weight or a conditional the property model never captured, while one a sibling variant shows (a focus ring, a loading spinner) is variant-driven and fine; a fill, stroke or effect toggled off in the panel stays in its array, colour and binding included.

    *Why:* both are invisible on the canvas and travel into every instance and every reader of the node; a hidden layer with no property is a state no consumer can reach.

    *Evidence:* (Mechanism, not an incident.) A switched-off paint is an entry with its own `visible: false` on a visible node, so the hidden-layer walk cannot see it.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "structure|hidden|" — a hidden layer wired to no visibility property, filed as hygiene.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — switched-off paints, strokes and effects, which only a session probe lists.

35. **Every variant axis offers a real choice.** No axis carries a single option, none keeps an option left behind by a rename, and an axis whose only effect is showing or hiding one subtree is a boolean instead, unless it reflects content the component holds (rule 21's `Has number`). A single-option axis can be deliberate (staged for planned options, or matching a sibling library's API), which is a ruling to record; removing or merging an axis deletes a property, which loses every consumer's choice on it, so a hit is a decision, never a batch fix.

    *Why:* a one-value axis does a constant's job while widening the API; a stray option offers a choice nobody designed; a visibility-only axis doubles the grid for one boolean.

    *Evidence:* (Mechanism, not an incident.) The single-option probe, 2026-08-13, was silent on a live library's 54 sets and fired on a probe set; no library has yet shown the other two.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit: the session's schema probe lists single-option axes, and stray options and visibility-only axes are the reader's.

36. **An interactive component carries the full state set of its archetype.** The archetype's states are the ones this library's own components of the same kind use, never a fixed table. A state missing on one component is a question; missing library-wide it is conformance (a touch-first library has no `Hover`). Whether a control should carry the loading state is a judgement to surface, not assume.

    *Why:* a state never drawn is one code improvises, matching nothing else; a fixed table would fail a library that rightly lacks a state.

    *Evidence:* (Mechanism, not an incident.) The probe this replaced hard-coded one library's states, which a library with no `Hover` would have failed wholesale.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit, per component, once its archetype is decided during scoping.

37. **Text a consumer would legitimately set is exposed as a text property.** A heading, a caption, a message, a filename or a person's initials carries one. Two exceptions, both a minority: text static by design (a calendar's weekday headings, a mandatory-field asterisk, a currency symbol) and text code writes at runtime (`Uploading - 64%`). Text inside a slot needs none. The test is whether a consumer would ever set the string, not whether it varies today.

    *Why:* the property puts the string in the panel and gives code a prop to pair; without one the content is buried in the layer tree. A property on static text invites changing what should not change.

    *Evidence:* one library's message card held a lorem paragraph with no property through a clean audit, caught only when its description was written; a sweep of 71 sets then raised 7, four static by design.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit: the session's text-coverage probe lists text with no property, and the reader clears static and runtime text.

38. **Text an item carries, inside a component whose items have variants, lives in a slot, never in a text override on a nested instance.** A text override inside a nested instance is stored per variant of that instance, so it is dropped when the instance changes variant from inside its parent; switching back restores it. Swapping the parent's own variant keeps the edits inside it, and a top-level or slotted instance keeps its text across its own variant switch. So per-item text where the item has variants goes in a slot, which keeps each item's text without duplicating the item; a component cannot change the variant of what fills its slots, so a parent-level switch never reaches slotted items, and choosing their variant becomes the consumer's.

    *Why:* the loss is silent: the text looks set in every variant checked, and vanishes in a consumer's file at the switch. Exposing the nested instance's properties does not keep it.

    *Evidence:* throwaway copies, 2026-10-08: tree rows switched inside their parent lost their labels and recovered them on switching back; slotted, they kept them. A nested layer-name override reset too, hence rule 10.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "overrides|nested-text|" — a nested instance whose main has variants and whose text is set by override, filed as a question: a parent that sets the same text on purpose in every variant (a dialog's `Cancel`) is the reader's to clear.

39. **An interactive component has a focus state, visibly indicated.** A component with the state axis carries its `focusState` option (Focus), so keyboard users can see where they are, and Focus differs from Rest by a ring a keyboard user can see; that it renders differently at all is rule 31's states check.

    *Why:* WCAG 2.2 SC 2.4.7 (AA) needs a visible focus indicator, and a library without one leaves every product to invent its own.

    *Evidence:* (Mechanism, not an incident.) The state axis's options are the variant set's own `variantOptions`; a missing option is read directly, before anything is built.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "accessibility|focus" — a state axis without the `focusState` option.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — whether each Focus variant shows a visible ring, which no scanner rule compares yet.

40. **An interactive component with no text of its own carries its accessible name.** An icon-only component exposes a text property for its label, or a Dev Mode annotation saying what its accessible name is.

    *Why:* WCAG 2.2 SC 4.1.2 (A) needs every control named; an icon gives a screen reader nothing to say unless the library gives the name a place.

    *Evidence:* (Mechanism, not an incident.) A set's text layers, text properties and annotations are all readable from the file; a set with none of the three has no name anywhere.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "accessibility|name" — an interactive set with no text layer, no text property and no annotation, a review.

45. **An icon library draws every set at its sizes, in bound paint, under its source's name.** Each icon set offers the sizes most sets do; every glyph's fill or stroke binds a variable or a style; and where the icons come from a published set (Lucide, say) each keeps that set's name, a drawn-here icon recorded as a ruling.

    *Why:* a missing size is a resize that blurs; an unbound paint ignores a theme; a renamed icon is one code cannot find by its package's name.

    *Evidence:* maintainer-decreed 2026-10-11. One project's 262 icon sets, read from the stored icons that day: 5 named outside Lucide, all suffixed `-custom`.

   *Checked:* `skills/figma-foundations-audit/tests/test-foundations.mjs` "icons: a set missing a size most sets have, an unbound paint and a name the icon set lacks are raised".

51. **A kit draws what its code renders, and only that; a departure is recorded.** Each set draws the variants, parts and defaults the project's code ships, its parts in the code's order (variants in rules 3 and 4's): the rows a text area opens at, the resize handle the browser draws, a separator where the stylesheet puts it. A value another system ships and this code does not (a `Warning` state, `Read-only`, a skeleton, an inline form, multiple selection) is not drawn. Adding one before the code has it, or drawing what the code lacks, is a ruling in the context document; the parity report raises anything unrecorded.

    *Why:* a frame the code cannot reach is a promise nobody keeps, and a state with no frame a screen nobody designed.

    *Evidence:* maintainer-decreed 2026-11-16, twelve component-page items moved here (toolkit-standard §D 21).

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at every audit, against the project's code or context document; no script can tell what the code renders.

52. **What Figma cannot show is not a variant: its values are tokens, and behaviour goes in an annotation.** A frame draws one still moment. Motion, timing, swipe and entering or exiting states, which code reaches at run time, get no frame and no axis; their durations and easings are motion tokens (rule 42). Behaviour with nothing to draw (a dialog's role, which text names it and which describes it, where focus returns when its trigger is gone) is a Dev Mode annotation on the frame that places the component.

    *Why:* an axis whose only difference is motion or timing offers a choice the canvas cannot show (rule 35), and behaviour left out of the file is guessed in code.

    *Evidence:* maintainer-decreed 2026-11-16, ten component-page items moved here (toolkit-standard §D 21).

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at every audit, against the project's code or context document; no script can tell what the code renders.

53. **What a component attaches to stays outside it.** A trigger, an anchor or the paragraph a component sits in is not part of it: a frame showing it open places the trigger beside it as its own instance. A part that runs inside text, an inline link, is a text style on a range, since Figma cannot place an instance inside text. A composite such as a breadcrumb trail places the existing component for each item rather than redrawing it.

    *Why:* a trigger drawn inside a popover's set is a second button nobody maintains, and a redrawn item drifts from the component it copies.

    *Evidence:* maintainer-decreed 2026-11-16, four component-page items moved here (toolkit-standard §D 21).

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at every audit, against the project's code or context document; no script can tell what the code renders.

54. **A field and its control are one set, unless the bare control is placed alone.** The label, hint and message take no pointer state, so a wrapper set around the control repeats every axis for nothing. The bare control is a set of its own only where it has a layout of its own, such as a checkbox in a table row; Code Connect then switches component on `Show label`.

    *Why:* two sets that differ only by a label double the variants and drift apart at the first change made to one.

    *Evidence:* maintainer-decreed 2026-11-16, two component-page items moved here (toolkit-standard §D 21).

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at every audit, against the project's code or context document; no script can tell what the code renders.

46. *Retired 2026-10-13: withdrawn to the one project that asks for it, in its context document; the components audit's check stays, driven by `overlayComponents`.*

## Naming

**The values these rules name are preferences, kept in [`naming-preferences.json`](naming-preferences.json)**: separators, the private prefix, the case and a property's opening and closing words, which a project overrides in its context document's `naming-preferences` block. A departure still works, so an audit files it as a preference that holds nothing back. A name that breaks something keeps its tier: a trailing space, Figma's default name, names that differ only in case, a private prefix behind a marker.

18. **Sentence case everywhere — tokens, styles, components, properties, values, pages and layers.** Capitalise the first letter of each path segment, the rest lowercase: `Colour/Background/Danger/soft`, `Text input`, `Content slot`. Two carve-outs: **in a token or style path, a leaf that is a value stays lowercase and may join its parts with a hyphen** (`soft`, `base-rest`, `md-medium`, `span-2`, `9-source`, `regular`, `semibold`), and **assets keep their source names** (`arrow-left`, `chevron-down` from an icon set), as rule 45 sets out for icons. Every other name is words joined by single spaces, never camelCase, snake_case or kebab-case, with a hyphen only inside a word spelt with one (`Pre-header`). Acronyms keep their capitals (`AI`, `AM-PM`); abbreviations are written out (`Maximum height`, never `Max. height`); numbers are digits (`Item 3`). Variant values are names, not token values, so they are capitalised (`Rest`, `Danger`), except the lowercase t-shirt sizes of rule 6 and Figma's own `True`/`False`. Any mark a name carries beyond words is one rules 8, 13, 14 and 20 give it, or the `/` between a token or style path's groups. Page furniture is the one place outside this rule: category headers in capitals, dividers, and the page markers of rules 11, 13 and 14. The one exception to a lowercase value leaf, of any kind, is a three-name allowlist: `Elevation/Raised`, `Elevation/Floating`, `Elevation/Modal`.

    *Why:* one rule for every class of name is one to remember and check, and every name is read by a person in a picker or layers panel first. Sentence case reads fastest in a list, marking word boundaries without Title Case's shouting or camelCase's run-together, and every toolkit export lowercases and hyphenates losslessly, so designer and developer may see different cases.

    *Evidence:* 2026-08-20, all three registered projects: tokens, components and layers already in sentence case or realigned that day; a "scale or state" leaf clause left `Font/Weight/Medium` beside `Icon/Neutral/medium`, so it became "any value"; 511 layer renames lost none of 2,050 overrides across 877 instances in a consumer file (overrides match by name only on a swap).

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "naming|prop-case|" — property names; `skills/figma-components-audit/scanner/audit.js` "naming|layer-case|" — layers; `skills/figma-components-audit/scanner/audit.js` "naming|component-case" — component names; `skills/figma-components-audit/scanner/audit.js` "naming|value-case|" — variant options. Each a capital inside a part of the name, an acronym excepted.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — every other class of name, because the carve-outs (values, imported assets) need judgement.

19. **One case per name space: no two component, variable, style or token names may differ only in case.** Rule 18 fixes which case; this rule binds even where a project departs from it.

    *Why:* both halves of a split are valid and one silently loses. DTCG names are case-sensitive, and tools *may* warn when names differ only by case ([Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/)); the toolkit's export (`tools/tokens/dtcg.js`) lowercases every segment, so the pair collapses to one path, reported only because `setDeep` refuses to overwrite. A pipeline without that guard ships one token while both look present in Figma.

    *Evidence:* admitted 2026-08-20: one project's `Semantic` collection capitalised the Role slot in `Icon/*` and `Text/*` and lowercased it in `Background/*`, unnoticed across several versions because both render correctly in the picker.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "differ only in case" — components; `skills/figma-foundations-audit/scripts/library.mjs` "differ only in case or separator" — a tokens library's variables, from the snapshot; `tools/tokens/dtcg.js` "name collides with another token at"; `tools/tokens/dtcg.js` "name collides with another style at" — variables and styles, refused when exported; `skills/figma-foundations-audit/tests/test-foundations.mjs` "tokens: two names that differ only in case are an error". figma-foundations-audit owns the check; the components audit classifies case for rule 18 and reports no collision.

20. **In a component name, ` / ` separates equivalent siblings only; a family and its part are joined by a space.** ` / ` marks a virtual set: one part split into interchangeable alternatives a designer picks between, which share one byte-identical description (`Cell / Fill` and `Cell / Hug`, `FAB button / Default` and `/ Open`). Anything that is not an alternative, such as a level or a sub-part, is a word in the name (rule 9). A component that relates to another but is built separately, a flavour of it, takes the other's name, ` - ` and the flavour: `Button - CTA`, `FAB - AI`, never `FAB (AI)`; its parts follow rule 9 from that name (`_FAB - AI button`). Token and style paths group with an unspaced `/` (rule 18).

   *Why:* only the separator tells siblings, which share one description, from family members, which must not; a tool that cannot tell copies a description where it should differ, or leaves siblings inconsistent. Levels after a slash (`Item / L1`) read as alternatives.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "naming|separator".

8. **A component that does not publish starts with `_`; a building block that fills a slot does not.** The prefix marks an internal part. A part consumed through a slot is deliberately public and unprefixed, because Figma offers only published components in a slot. An audit verifies slot consumption before raising a bare name.

   *Why:* Figma leaves a `_` name out of the published library, keeping an internal part out of every asset panel; a slot filler must publish for the slot to offer it, so raising its bare name would push a designer to break the slot. *(Mechanism, not an incident.)*

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — by the audit's reader, after it verifies slot consumption, since an unprefixed slot filler is public on purpose.

9. **A part is named for its family and its own last word, joined by a space; inside its parent the layer keeps only the last word.** A part built for one component is named after the component its page documents plus the part's own last word, in sentence case, with every level in between dropped: `Card header`, `Sidebar dialog item`, `Date picker single day`, never `Sidebar dialog - Modal - Sidebar - Section - Item`. Levels that are not alternatives go into the name as words, not after a slash: `File explorer level 1 item`. A family large enough to have its own category (`🔷 TABLES`) names its members without the family word, which the category already supplies: `Cell / Fill`, `Context flyover item`, `Toolbar`, while the family's root keeps it (`Table`). The **layer name** of a part where it sits inside its parent is that last word alone: `Item`, `Cell`, `Header`; copies that must be told apart keep role names or numbers (`Up`, `Down`, `Section 1`). The rule binds *parts*, never a public component that merely happens to be composed somewhere; and a part consumed by **more than one** parent has no single family to take, so it keeps a functional name.

   *Why:* the family word makes a part findable from its owner; without it the asset panel is a flat list of `Item`, `Section` and `Day`. Real kits name a part as parent plus part, one level deep: none of 33 surveyed chains ancestors with ` - `, and a space join is the most common form (12 kits, Figma's Simple Design System among them; research 2026-10-07). A family's own category already names it; inside the parent, position shows ownership, so repeating it makes the layer tree an index.

   Maintainer-decreed 2026-10-07, replacing the ` - ` chain of 2026-08; applied that day to one library (72 components, 29 instances renamed).

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "naming|parent-name|"; `skills/figma-components-audit/scanner/audit.js` "naming|part-layer|" — a part's layer still carrying the part's whole name.

10. **Every layer is named for its role.** A layer is named in the component, never by an override on a consumer's instance, and says what it is (`Label`, `Icon`, `Divider`, `Container`), never Figma's default (`Frame 12`, `Rectangle 4`) and never the sample copy it happens to show (`Connection successful.`). A text layer bound to a property takes that property's name (`Value`, `Helper text`), a nested part takes its last word (rule 9), and a nested public component keeps its own name.

    *Why:* the layer name is what Dev Mode shows and what Figma matches overrides by on a swap (rule 18); a default name says nothing and a sample-copy name goes stale. In the kits read for rule 21, text layers are role nouns, with 16 of 101 named after sample copy carried as debt.

    Maintainer-decreed 2026-10-07, gathering what rules 9 and 21 said of bound text and nested parts, and adding the rest.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "naming|default|" — Figma's default names.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — a layer named after its sample copy, which Figma's default naming of a text layer makes indistinguishable to a script.

21. **Properties are named for what they hold, in the code's words.** A text property is the bare noun, its code prop's where one exists (`Label`, `Value`), keeping "text" only where the prop has it (`Helper text` for `helperText`). A boolean property that reveals an element (text, an instance or a slot) takes `Show` (`Show avatar`, `Show icon` beside `Icon`, `Show value` beside `Value`); one that switches a style and reveals no element, such as a decorative stroke, is a bare word, as a state is (`AI`); a True/False variant property is a state and stays a bare word (`Disabled`, `Selected`), never `Is` (`Is selected`), or takes `Has` when it reflects content the component holds rather than an interaction (`Has value`, `Has number`), a word no boolean takes; `Show` never names a variant. An instance swap is named for the thing it holds (`Icon`, `Graphic`), never the mechanism (`Icon swap`), with `Leading`/`Trailing` for position. A slot property is `Slot` by default, `Leading slot` or `Trailing slot` when first or last in a horizontal layout, even alone, and named for what it hosts when that repeats (`Items slot`). A boolean that shows a slot is `Show` plus the slot's name (`Show leading slot`), never a second name such as `Leading slot content`. Position is `Leading`/`Trailing` in any name or value, never `Left`/`Right`, in every project, mirrored or not: a role survives right to left, a side does not. No two properties of one component share a name: Figma then shows its internal ids (`Label#330:11`) to everyone who sets them. That Figma and code hold the same properties is rule 56's; `Open` and `Validation` are rule 57's.

    *Why:* names that match the code make the file the specification and let tools pair Figma with code without a lookup table; in a small test, aligned names cut the wrong props Claude wrote from Figma by over half without the API in context (research 2026-10-07). Across 23 kits' Code Connect files, bare nouns lead for text properties, `Show X` beside `X` for a revealing boolean, and `Icon` for a swap.

    Maintainer-decreed 2026-10-07, applied that day to one library (102 text properties, 25 shared-noun booleans and variants, 5 swaps and icon booleans, 23 text layers). The style switch, maintainer-ruled 2026-10-12 on a button's `AI` stroke: code has `variant="ai"`, and 65% of the 23 kits' booleans are bare.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "naming|prop-boolean|"; `skills/figma-components-audit/scanner/audit.js` "naming|prop-state|"; `skills/figma-components-audit/scanner/audit.js` "naming|prop-text|"; `skills/figma-components-audit/scanner/audit.js` "naming|prop-swap|".

56. **Figma and code hold the same properties, alike in name, shape and values; code wins only where a prop cannot be renamed.** A code boolean is a False/True property, a code enum one axis valued as the enum is, two code props two properties; where shipping kits differ on a shape, the build takes the one that mirrors its code. The names rules 6 and 21 set are the house's, and code the project writes takes them (`showCloseButton`, never `hideCloseButton`); only where a code prop cannot be renamed, being HTML's own (`checked`) or a library's the project uses as shipped, does the Figma property take the code's name, shape and values instead (`Placement` valued `Left` and `Right` over a library's `placement="left"`). The State axis's values (rules 4 and 36) and the validation axis (rule 57) are the exceptions it keeps.

    *Why:* names that match the code let a designer's file read as the specification and let tools pair Figma with code without a lookup table (rule 21); a shape that differs from the code's (one `Checked` axis over two code booleans) is that lookup table again, kept by hand in every mapping.

    *Evidence:* shape and values, maintainer-decreed 2026-11-19 ("i want all recommendations from the KB to favour figma-code alignment"; preferences "we have separate standards for that"), after the checkbox page took SDS's one `Checked` axis where Primer's kit draws `checked?` and `indeterminate?` as its code and HTML have them. Alignment both ways, maintainer-decreed 2026-11-19 ("props should be aligned between figma and code, if for some reason code props cannot be renamed, figma can take them from there only on those cases"), after Carbon's kit drew `Show label` over the code's `hideLabel` and SDS's drew `Left` and `Right` against `Leading`/`Trailing`.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at every audit, against the project's code or context document: no script compares a property's shape with a code prop it cannot read.

6. **Sizes use a t-shirt scale.** A size property is named `Size` and its values are t-shirt names, written lowercase and ordered largest first: for example `2xl`, `xl`, `lg`, `md`, `sm`, `xs`, `2xs`. A component uses only the steps it needs, as one unbroken run of the scale: `lg`, `md`, `sm`, never `xl`, `md`, `sm`, `2xs`, because a gap says a size is missing and leaves the next one added nowhere to go. The rule sets the names, not the measurements: what each step measures is the project's choice. Ideally each name pairs with one value across the library, so a `md` button, a `md` icon button and a `md` input stand the same height and line up in one row.

    *Why:* t-shirt names match code's size props (`size="sm"`) and grow without renaming (`2xl`, never `Extra large 2`). One value per name is the ideal, not the rule: it pays only side by side, where a 40px `md` button beside a 36px `md` icon button misaligns the row.

    Maintainer-decreed 2026-10-07; one project had ruled largest-first (2026-09-05), another aligned its icon button to its button's heights for that misaligned-row reason (2026-08-28).

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "schema|size-values|"; `skills/figma-components-audit/scanner/audit.js` "schema|size-name|"; `skills/figma-components-audit/scanner/audit.js` "schema|size-gap|".

22. **Component vocabulary matches token vocabulary** — whatever that vocabulary is per project (one project canonises `Success`, another `Positive`; the *matching* is the standard, the words are not).

   *Why:* a mismatch shows only to someone holding both: a `Success` variant bound to `…/Positive/…` makes every reader carry a translation table that exists nowhere in the file. *(Mechanism, not an incident.)*

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — by the audit's reader: whether a component's words match the tokens' is a reading of both vocabularies.

23. *Retired 2026-10-08: moved to toolkit-standard §D 20, since it governs every tool's output.*

## Pages

11. **Pages are grouped into named categories; categories are ordered alphabetically, and pages within each category are ordered alphabetically too.** A finished component page's name starts with `❖`; a page still in progress starts with `🚧` instead (rule 13). **A category is a header page named `🔷 CATEGORY`** — blue diamond, capitals — and **categories are separated by a divider page named `---`**, which Figma draws as a rule; both are furniture, never members of a category. Two categories are pinned last regardless of alphabetical position, in this order: `AUXILIARY`, the catch-all for parts and support pages, then `DEPRECATED` (rule 14).

    *Why:* alphabetical order is the index, for a maintainer or a generated browser; the `❖`/`🚧` marker tells shippable from draft without opening the page.

    *Evidence:* 2026-08-10, two projects held order and markers, bar one's five drifted pages, corrected that day. Pinning `AUXILIARY` last, one project's override, was decreed for all 2026-10-07.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "page-order|category"; `skills/figma-foundations-audit/scripts/foundations.js` "page-order|pinned".

12. **Category-name reference vocabulary**: `Actions`, `Data & Display`, `Feedback`, `Inputs`, `Layout`, `Navigation`, `Overlays`, `Selection`, `Tables`. A project draws a new category's name from here before inventing one; its header page writes it in capitals (rule 11).

    *Why:* categories are universal (rule 11) but their words are not, as with rule 22; two projects converging unprompted on six of these names makes a starting list worth writing down, though it does not bind.

    *Evidence:* the union of two projects' live categories: six matched exactly, a seventh differed only in punctuation (`Data Display`); `Layout` from one; `Auxiliary` off the list, as rule 11 pins it.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit, for each page: whether a component belongs under an existing category is judgement.

13. **`🚧` marks a page and every component on it as in progress; generated text never quotes it.** A page still in progress is named `🚧 Name`, and every component on that page carries the marker: a public component starts with it (`🚧 Time input`), and a private part puts it after the `_` that keeps it unpublished (`_🚧 Time input picker`), since Figma publishes any name that does not start with `_` (rule 8). When the page is finished, the page takes `❖` and its components drop the marker. Properties-table titles, component descriptions, page headers, code names and parity pairings read every name with the marker stripped: the table reads `Time input`, a description cites `_Time input picker`.

    *Why:* the marker is a status, not a name: on the component it shows a draft wherever an instance is picked, and in generated text it would go stale the day the page becomes `❖`.

    *Evidence:* maintainer-decreed 2026-10-07.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "status-marker|missing|"; `skills/figma-foundations-audit/scripts/foundations.js` "status-marker|stale|"; `skills/figma-foundations-audit/scripts/foundations.js` "status-marker|publishes|"; `skills/figma-properties-table/tests/test-properties-table.js` "A8: a title without the status marker matches a 🚧 component"; `skills/figma-component-descriptions/tests/test-verify.mjs` "D17: a name cited without its status marker is known" — the marker on every component of an in-progress page, after a private part's `_`, and on no other; a properties-table title and a description citation read the name without it.

14. **A deprecated component is marked in its page, its name and its description, and keeps working until it is removed.** Its page is named `🚫 Name` and moves to the `🔷 DEPRECATED` category, which rule 11 pins last. The component is renamed `[🚫 DEPRECATED] - Name` (`[🚫 DEPRECATED] - Side navigation`), and a private part keeps its `_` first (`_[🚫 DEPRECATED] - Side navigation item`, rule 8), which keeps the warning visible in every instance's name. Its description says what replaces it in its first paragraph (`Deprecated: use List instead.`) and keeps the rest until removal. Generated text keeps the deprecation prefix, unlike `🚧`: it is a warning a consumer must see, not a status that goes stale.

    *Why:* deprecation must reach whoever places an instance: a page marker is invisible from a product file, while the name shows wherever the instance sits and the description names the replacement. Staying published lets product files migrate on their own schedule.

    Maintainer-decreed 2026-10-07 from the convention one library already used for `Side navigation`.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "deprecation|name"; `skills/figma-foundations-audit/scripts/foundations.js` "deprecation|page|"; `skills/figma-foundations-audit/scripts/foundations.js` "deprecation|publishes".

15. **A component page documents its subject with the five-section template, in order**: a page **header** carrying the component name and the first sentence of its description, then section cards — `Examples` (instances as published with the library) · `Component` (the main editable component) · `Parts` (sub-components, usually unpublished) · `Properties` (the generated properties table, one per component on the page) · `Matrix` (component permutations, **generated with the Propstar plugin**). A section with nothing to hold is omitted — a leaf component has no `Parts` — and **`Matrix` is present exactly when the page's primary component has variant axes or booleans**, since permutations are generated from those and a component with neither has nothing to permute. **Building-block pages are exempt from the template entirely** `[maintainer-ruled 2026-08-13, widened the same day]` — pages holding only components that take the compact description tier: internal-prefixed, or slot-only. Their consumers are the components that compose them, documented on those components' own pages. The template tier and the description tier are the same boundary, deliberately: a component too internal for a full description is too internal for a documentation page.

    *Why:* one page shape tells a reader, a generated browser or an agent where everything is before reading. The header is generated from the description, never typed (toolkit-standard §D 23), so canvas and panel do not drift; a section with a named generator is a refill, and one without goes stale (§D 16).

    *Evidence:* maintainer-decreed 2026-08-13 from a live page; that day's sweep of one project found the template on 32 of 35 component pages and the Matrix tied exactly to the *primary* component's axes, where counting any component on the page reported five false gaps.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "page-template|order|"; `skills/figma-foundations-audit/scripts/foundations.js` "page-template|matrix|"; `skills/figma-foundations-audit/scripts/foundations.js` "page-template|missing|" — the section cards (`pageSections`, `pageSectionComponent`, `matrixSection`) in canvas order; the content of each section is checked by the skill that writes it (`figma-properties-table`, `figma-component-descriptions`).

## Tokens in Figma

16. *Retired 2026-11-19: moved to toolkit-standard §D 17, whose rule against recording live-readable state it was one case of.*

24. **Semantic-only consumption** where primitives are hidden: a component bound directly to a primitive is a defect. Styles may reference hidden primitives internally — the tier rule binds components, not styles.

   What hiding costs a file outside the library is set out in [tokens: three tiers](../knowledge/code/tokens.md#three-tiers).

   *Why:* the semantic tier is where a mode, a theme or a re-pointed role takes effect. A component bound straight to a primitive keeps its raw value when the semantic token above it moves, so it is the one thing on screen that stays light in dark mode or keeps the old brand, and nothing in the file marks it as different until someone sees it.

   *Evidence:* (Mechanism, not an incident.) A primitive binding resolves the same in every mode of the semantic collection, so the defect only shows when that mode is switched.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "tokens|fill-collection".

28. **A fill takes the token role of its layer.** A text layer's fill binds a token in the text role (`Text/…`), and a text-role token fills only text.

    *Why:* the role is what lets a theme re-point text colour without touching surfaces, and the reverse; a surface bound to a text token, or text bound to a surface token, moves with the wrong half of the theme and breaks contrast in one mode only.

    *Evidence:* (Mechanism, not an incident.) A role is a path segment (`textRole`), so the check reads the bound variable's name, never its value.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "tokens|text-role|"; `skills/figma-components-audit/scanner/audit.js` "tokens|text-role-shape|"

29. **Every visual value a component draws is bound to a token.** Padding, gap, corner radius, fill and stroke colour and stroke weight are bound to variables, and text takes a text style with its font family, size and weight bound. A gap on a frame with one child is bound too: inert today, live the moment a second child arrives. The one exclusion is a gap set to Auto (`SPACE_BETWEEN`), where Figma ignores the stored number. A raw value serving a mechanism (a progress fill driven by padding, a negative overlap) is a question, not a defect.

    *Why:* a raw value is a decision nobody can change centrally: it survives every rebrand and mode switch untouched, and nothing on the canvas marks it as different from the bound values around it.

    *Evidence:* (Mechanism, not an incident.) The check reads the binding, never the value: a bound value passes whatever it is, and an unbound one is flagged whether or not it sits on the project's scale, which only decides whether the fix is safe.

   *Checked:* `skills/figma-components-audit/tests/test-audit.mjs` "no spacing scale: raw padding is raised without an on/off-scale verdict"; `skills/figma-components-audit/tests/test-audit.mjs` "the token measures count the planted raw values, not the deduped rows"; `skills/figma-components-audit/scanner/audit.js` "tokens|itemSpacing|"; `skills/figma-components-audit/scanner/audit.js` "tokens|fill|"; `skills/figma-components-audit/scanner/audit.js` "tokens|stroke|"; `skills/figma-components-audit/scanner/audit.js` "tokens|strokeWeight|"; `skills/figma-components-audit/scanner/audit.js` "tokens|textStyle|" — padding, gap (a single child's as hygiene, a grid's row and column gaps), radius, fill, stroke colour and weight, text style and font fields; an off-scale padding of 80 or more is filed as a question.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — whether a raw value serves a mechanism, which the reader decides in a session.

41. **Every published token says what it is for.** A variable a consumer can pick carries a description: what it is for and where it goes. A token hidden from publishing owes none, since it is reached through an alias, never chosen.

    *Why:* a token's name says where it sits, not when to use it, and a person or an agent picking between `soft` and `subtle` has nothing else to go on. Figma shows the description in the picker, so it reaches the designer at the moment of choice.

    *Evidence:* maintainer-decreed 2026-10-11. One project's tokens library, read from its snapshot that day: 9 of its 354 published tokens described.

   *Checked:* `skills/figma-foundations-audit/tests/test-foundations.mjs` "tokens: an undescribed published token is raised per collection; a hidden one owes none".

42. **A token earns its place.** Every token is used by a component, by a style, or by another token that is; one meant only for code or prototypes (motion, breakpoints, charts) says so in a ruling.

    *Why:* an unused token is a choice nobody makes and everybody reads past; it widens every picker, and when it drifts from the palette nothing on screen shows it.

    *Evidence:* maintainer-decreed 2026-10-11. The same library: 248 of its tokens reached by nothing its components library draws: 86 hidden palette steps, 59 motion, breakpoint and chart tokens no layer can bind, and 103 others.

   *Checked:* `skills/figma-foundations-audit/tests/test-foundations.mjs` "tokens: a token no component, style or used token reaches is unused; an alias target and a style's binding are used".

43. **A style binds a variable wherever Figma lets it.** A text style binds its font family, weight, size, line height and letter spacing; an effect binds each layer's colour, offsets, blur and spread. One exception: letter spacing set in percent may stay unbound, because a bound variable is always px; it is bound when a mode must change it (a script that takes no tracking, [i18n](../knowledge/code/i18n.md#font-coverage)).

    *Why:* a style's raw value is a decision the tokens cannot reach: change the line-height token and every style keeps its own copy. Rule 29 binds a component's values; this is the same rule one level down. The exception holds because binding would cost more than it reaches: a percent tracking scales with the size, so one value serves every size and mode, where a px variable needs a value per size per mode.

    *Evidence:* maintainer-decreed 2026-10-11. The same library's 44 text styles bound family, size and weight, and none bound line height or letter spacing. The exception, 2026-11-12: the toolkit's own measurement through the plugin API bound number variables to a style's and a node's line height and letter spacing, both set to percent first, and all four read back in px.

   *Checked:* `skills/figma-foundations-audit/tests/test-foundations.mjs` "tokens: a style field Figma can bind and the style leaves loose is raised, one row per field"; `skills/figma-foundations-audit/tests/test-foundations.mjs` "tokens: letter spacing in percent may stay unbound, since Figma binds it only as px; in px it is raised". The "unless a mode must change it" half is unchecked: the audit exempts every percent tracking.

44. **Parallel token groups have one shape.** A group holds tokens or groups, not both, and sibling groups carry the same leaves: a leaf most siblings have and one lacks is a gap or a decision, and a ruling records the decision. Two names that differ only in case or separator are rule 19's error.

    *Why:* code generated from the tokens maps each group to an object, so a group with a leaf and a subgroup side by side has no clean shape, and a missing leaf is a missing key some component will look up.

    *Evidence:* maintainer-decreed 2026-10-11. The same library: palette steps named `6 - source` beside plain `6`, and an icon group with no `soft` where its siblings have one.

   *Checked:* `skills/figma-foundations-audit/tests/test-foundations.mjs` "tokens: a group holding tokens and groups, and a sibling group missing a common leaf, are one structure row" — names that differ only in case are checked under rule 19.

47. **A brand's on-emphasis pair moves with its solid, in each mode.** When a brand's semantic mapping is copied from another brand and its solid fill (an `emphasis` background or control, rule 55) moves to a different step, the text and icon tokens drawn on that fill move with it, and each mode is mapped on its own: a light hue's solid takes the dark end for its text, and its dark-mode solid sits where that mode's ramp holds the hue, not at the light mode's step number.

    *Why:* a copied mapping copies the pairing the source brand's hue needed, and a step number is a different lightness in each mode's ramp, so a pair that reads in one brand or mode can vanish in the next.

    *Evidence:* 2026-10-15, a yellow brand extension copied from a blue one: moving the solid to the yellow's step 5 left its inverse text on step 1 at 1.4:1, and the same step 5 in dark mode put the button at 1.31:1 against the canvas. Nothing flagged either at the token mapping; rule 32 reaches them only once a component draws the pair.

   *Reviewed:* `skills/oklch-color-scale-system/SKILL.md` "solidForeground" — the ramp's measured foreground for its solid, per mode; whether the brand's mapping follows it is read in the session that maps the brand.

49. **A component token is named `Component/<Component>/<Element>/<property>[-<variant>][-<state>]`, in the component's own words, and aliases a semantic token.** The component segment is the component's name (rule 13's marker stripped), or a family that shares tokens (`Input`). The element is the painted layer's role name (rule 10), `Container` for the component's frame. The lowercase leaf (rule 18) is the property, then hyphenated modifiers: the variant value as the file spells it, then the state or a gradient stop (`background-primary-hover`, `background-start`). A modifier appears only where the value differs by it: a label that does not change on hover has no state, and a default value (`Feedback=None`) adds nothing. Two variant values follow axis order (rule 1). A brand never appears in the name: its override lives in the brand's extension under the same name, bound as rule 60 says. A collection that holds only component tokens may drop the `Component/` prefix, since the collection already says it. One component worked through end to end, Figma path to stylesheet, with its cases: [tokens: component token names](../knowledge/code/tokens.md#component-token-names-worked-through). The wrong shapes:

    | Case | Name |
    |---|---|
    | Wrong: property before element | `Progress/Background/bar` → `Component/Progress/Bar/background` |
    | Wrong: a variant as a segment | `Avatar/With image/background` → `Component/Avatar/Container/background-photo` |
    | Wrong: a brand in the path | `Component/Avatar/Brand C/background` → the same name, overridden in Brand C |

    *Why:* code takes the path as its name (code-standard rule 52), so a token not mappable to one layer is mapped by guessing. Element before property groups tokens by layer, as picker and stylesheet are read; modifiers last keep one layer's tokens together in one fixed shape, where a variant segment would scatter them. A brand segment would multiply tokens by brands and make components switch between them, the extension's job.

    *Evidence:* 2026-10-15, one project's eight component colour tokens had four shapes: property before element, no element, a variant segment spelt `With image` for `Photo`, a miscased name. Renamed, bindings kept. The order is the published consensus, with Material Web the one counter-example ([tokens: component token names](../knowledge/code/tokens.md#component-token-names-worked-through)).

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — whenever a component token is added or renamed: whether its element is a layer and its modifiers are the variant values spelt as the file spells them is read in the session.

60. **A brand override binds a semantic token where one resolves to the same value.** A brand's override of a component token, in the brand's extension, binds a semantic token whenever one resolves to the same value in that mode; a primitive there is a recorded exception.

    *Why:* the semantic tier is what a component consumes (rule 24), and an override is a component's binding in one brand: a primitive or a token of another role resolves the same today and stops following the role the day the semantic token is re-pointed.

    *Evidence:* 2026-10-15, one project: four brand overrides bound a primitive or a token of the wrong role where a semantic token resolved to the same value in every mode; rebound with every resolved value unchanged.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — whenever a brand override is added or rebound: whether a semantic token resolves to the same value is read in the session.

55. **A semantic token is named `<Type>/<Property>/<Role>/<level>[-<state>]`, its slots in that order, each from a closed list.** The type is the token's kind (`Colour`). The property is what it paints, from a closed set: background, text, icon and border, plus control, surface and shadow where the project rules them in, one word each (`Stroke` or `Border`, never both). The role is neutral, brand or a status word, with no category segment (`Feedback`) above it; a non-status set marks itself (`Accent/Blue`). The level is the lowercase leaf (rule 18), from one library-wide intensity ladder around a `default` or unnamed middle: each property takes the steps it needs, and a word means the same step everywhere. A colour on a solid fill is named for it (`on-emphasis`). A state comes last, only where the value changes, one word per state (`rest`, `hover`, `press`). Surfaces take their layer's role, not a number, and no role slot: `Colour/Surface/<layer>`. The house words are defaults; a project's context document records only the words it uses instead (rule 22, toolkit-standard §D 7):

    | Slot | House words |
    |---|---|
    | Property | `Background`, `Surface`, `Control`, `Text`, `Icon`, `Stroke`, `Shadow` |
    | Role | `Neutral`, `Brand`, `Danger`, `Info`, `Success`, `Warning` |
    | Level | `softer`, `soft`, `default`, `emphasis`; `on-emphasis` on an `emphasis` fill |
    | State | `rest`, `hover`, `press` |
    | Surface layer | `page`, `raised`, `overlay`, `scrim` |

    So `Colour/Background/Danger/soft`, `Colour/Control/Brand/emphasis-hover`, `Colour/Text/Neutral/on-emphasis`. Component tokens are rule 49's.

    *Why:* code takes the path as its name (code-standard rule 52), and at the picker the name is all there is. A fixed order and closed lists let anyone derive name from use and use from name, where a word with two meanings turns every pick into a lookup; a new need adds a word, never a new shape.

    *Evidence:* 2026-11-18, one project's 102 semantic tokens: a `Feedback` segment over every status, `medium` on text where backgrounds used `soft`, a solid and its text both `inverse`, numbered surfaces, descriptions copied across roles. Renamed, bindings kept. Systems back each slot as strongly as the KB shows: [token taxonomy](../knowledge/code/token-taxonomy.md#name-grammar-and-segment-order) (grammar, roles, levels, on-colour, what lasts) and [surfaces](../knowledge/ui/design/visual.md#surfaces-and-elevation-levels). The house words are the maintainer's choice that day among words in wide use (`danger` beside `critical`; `Stroke`, Figma's word, over code's `border`), and a named middle `default`.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — whenever a semantic token is added or renamed: whether its words come from the house's lists or the project's is read in the session.

17. *Retired 2026-11-19: moved to figma-components-audit as its tracked metric (its SKILL.md section "Reporting: the fix queue"), since only that skill reports it.*
