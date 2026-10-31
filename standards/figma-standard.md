# Figma standard — how a design-system library is built in Figma

**Version 2.20.3** — history in [`changelog/figma-standard.md`](changelog/figma-standard.md).

**Scope.** How a component library is built inside Figma: variant axes and states, how everything in it is named (components, properties and their values, parts, layers, pages, tokens and styles, which code takes as written), page structure, and the token rules that only Figma can hold. How any rule is admitted, enforced, changed and retired is [`toolkit-standard.md`](toolkit-standard.md)'s (§C).

**Precedence** and **values** are the root's (toolkit-standard *Precedence* and §C clause F): an override is a decision, not a deviation. During capture these rules are offered as proposed answers, never assumed.

Cite a rule as `figma-standard rule N`.

## Components and variants

1. **Axis order**: props/booleans first, then `Size → Role → Feedback/… → Disabled → State`. `State` always last; `Disabled` a VARIANT False/True immediately before it. A True/False axis lists its default first, so the panel opens on what a designer gets; a validation axis lists `None` first, then the problems (`Error`).

   *Why:* one canon keeps property panels predictable across projects.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "schema|axis-order|state"; `skills/figma-components-audit/scanner/audit.js` "schema|axis-order|disabled"; `skills/figma-components-audit/scanner/audit.js` "schema|bool-default|"; `skills/figma-components-audit/scanner/audit.js` "schema|order|" — State last, Disabled before it, a True/False axis's default first, and each axis's options against the recorded order.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — props before variants, and the order of the axes before Disabled, which no script compares.

2. **Sparse grids**: omit semantically impossible combinations — Disabled pairs only with Rest, and a selection cannot contradict itself. Sparseness on a *content* axis is a gap unless ruled.

   *Why:* a grid cell for an impossible state documents a lie.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit: which combinations are impossible is a judgement about the component.

3. **Variant order inside a set: the `Disabled=True` variant sits immediately after its `State=Rest` sibling**, before the other states — each selected/boolean group reads Rest → Disabled → Focus → Hover → Press.

    *Why:* Disabled is the rest state's counterpart, not a sixth interactive state — it pairs only with Rest (rule 2) — so placing it beside Rest makes each group read as "the control, its disabled form, then its interactive states", on the canvas and in the variant picker alike. Buried after Press, the sparse grid reads as a gap instead of a pattern.

    Maintainer-decreed 2026-08-13, and checked live the same day against one registered project's web library: 28 of 28 sets carrying both `Disabled` and `State` place every `Disabled=True` variant at exactly its Rest sibling's index + 1, no exception. Since 2026-10-08 the components audit checks every set on every run.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "schema|disabled-order|" — a set's `children` order is its variant order; the rest step is the state scale's first. First run: the fixture library's `Button - CTA` and `Menu button` place Disabled after Loading.

4. **State axis internal order**: `Rest → Focus → Hover → Press (→ Loading)` — Focus immediately precedes Hover, not the reverse.

    *Loading sits on the State axis on purpose, and code separates it.* In Figma one axis keeps the component lean — a `Loading` boolean beside a State axis doubles the grid for a state that excludes the others. It is not a pointer state, so the build does not model it as one: a `loading` prop with `aria-busy`, separate from `:hover`, `:focus-visible` and `:active`. An audit does not raise it; `component-validator` writes it into the component's Implementation notes (its case WT1) and its W7 check leaves it alone. Recorded 2026-09-22, after the finding "the State axis carries Loading" came back on every run of one library and was ruled away and back again.

    *Why:* Focus is the persistent, required state — WCAG 2.4.7 treats a visible focus indicator as non-negotiable for keyboard users, where hover is enhancement-only and mouse-specific. Material's own state-layer model treats them the same way structurally: hovering a focused element shows the hover layer only transiently, reverting to the focus layer once hover ends — focus is the base state, hover a temporary overlay on it. The order also matches a real, tooling-enforced CSS convention (`:link → :visited → :focus → :hover → :active`, "LVFHA", codified in an actual lint rule rather than folklore), though CSS itself is split between two named conventions and neither project derived its order from CSS directly — so that fact grounds plausibility, not origin. Neither project's maintainer could state a reason when asked; this rationale was reconstructed from external research after the fact, and grounds keeping the pattern rather than explaining how it arose.

    Checked live against two registered projects, 2026-08-10: the first project's audited Web state model and the second project's `Button`, `Text input`, `Checkbox` and `Toggle` all author `State` with Focus immediately before Hover, with no exception found.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "schema|order|".

5. **A property that fills a layer sits immediately below the property that reveals it.** Where a BOOLEAN toggles a layer's visibility and another property supplies that same layer's content — a TEXT property for its characters, an INSTANCE_SWAP for its main component — the two are adjacent in the properties panel, revealer first. This refines rule 1's "props/booleans first" clause, which fixes where the props block sits and says nothing about order inside it.

    *Why:* the two properties are one control with two halves, and only their adjacency says so. Split apart, a consumer switching the boolean on is left hunting for the field that fills what just appeared, in a list whose order carries no other meaning; and a consumer who never turns the boolean on reads a content field for a layer that is not there. The panel is also the only place the relationship is expressed at all — nothing in `componentPropertyDefinitions` records that one property governs another — so adjacency is not a convenience, it is the whole of the documentation.

    Maintainer-decreed 2026-08-20 from a live pair built the same day: a menu-item component whose count boolean reveals a count layer and whose count text property fills that same layer (today `Show count` and `Count`, under rule 21). The same shape already held unremarked in the same library's button, where an icon boolean and the swap filling the revealed instance sit adjacent in that order — one instance decreed, one found already conforming.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — in the property panel. The panel's order is not readable: `componentPropertyDefinitions` returned `Label text, Count text, Count` for a set whose panel showed `Count` above `Count text`, so a script would fire on conforming components.

7. **A parent owns the state of a part it drives.** When a component changes a nested part's state (a FAB opening its button), the part is one set with that state as an axis, the parent sets it, and the parent's own property is what a designer touches. Split the part into ` / ` siblings per state (rule 20) only when designers must reach the part's other properties, which Figma exposes all together or not at all; say so in the parent's description.

    *Why:* a part's state is the parent's behaviour, so it belongs on the parent, where code puts it too. Of the kits read for rule 21, Carbon keeps `Open` on its menu button and leaves the nested button's axes alone, and none splits a child per state; the split is the one way to expose a part's icon or badge without its state, which Figma's all-or-nothing exposure otherwise forbids.

    Maintainer-decreed 2026-10-07.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit, wherever a part's state changes with its parent.

25. **Every public component carries a real description.** A description is not empty, not the component's name repeated, not a placeholder (`TODO`, `TBD`, `lorem`), and longer than a label. A public component's description carries a Usage and a Don't section, and Code gen notes; a slot part (a public part every use of which sits inside other components on its own page, in a slot or directly — decided by where it is used, never by its name, as `figma-component-descriptions` decides it) is chosen through its parent and owes none. A private part takes the compact form `figma-component-descriptions` writes, and its absence is hygiene rather than an error. A variant holds no description of its own unless it is the set's text: whoever reads that variant gets its copy, which goes stale the day the set's is rewritten.

    *Why:* the description is what a designer reads in the assets panel and what Dev Mode and any generated documentation show, so an empty one leaves every consumer to guess the component's job from its name. A placeholder is worse than nothing, because it looks like documentation.

    *Evidence:* (Mechanism, not an incident.) The probe's three tests are the three shapes a non-description takes: empty, the name again, or a stub shorter than any real sentence (`minDescription`, `descriptionPlaceholder`). The variant clause was found on 2026-10-25: after a project's descriptions were rewritten, five sets still held older variant copies, one of them another component's text, and no check saw them.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "metadata|description" — an empty description, an error on a public component and hygiene on a private part.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "metadata|variant-description" — variants whose description differs from the set's, a warning.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "metadata|guidance" — a public component's missing Usage or Don't section, a warning, and Code gen notes, a review; slot parts left out.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "### Session probes" — a placeholder or a repeated name, which the session's metadata probe reads.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — whether the text is still true of the component, which no script can read.

26. **An interactive component is at least 24px on each side, and text is at least 12px.** The target minimum comes from WCAG 2.2 SC 2.5.8 (Target Size Minimum, AA), and is stricter than it: the criterion also lets a smaller target pass through spacing, which a library cannot know, since spacing is the product's. A larger transparent hit area around a smaller shape meets it. A component that is not interactive (a divider) and disabled text are exempt.

    *Why:* a target below the minimum is missed by people with limited dexterity and on touch, and text below 12px stops being readable at normal viewing distance; both are cheapest to fix in the library, before every product repeats them.

    *Evidence:* the check first used 44px, which is SC 2.5.5 (AAA, the mobile touch figure), and flagged nearly every interactive component of one desktop web library as one undifferentiated wall of findings; 24px, the AA figure the project's own accessibility floor named, separated the real cases.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "### Session probes" — the session's size probe lists every variant under the target and every text under the minimum; the reader drops the components that are not interactive, the ones a hit area covers, and disabled text.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "accessibility|target" — interactive variants under `minTarget` on either side, a review: a transparent hit area can meet it.

27. **A component is placed as an instance, never as a detached copy.** Outside the component pages, a frame or group named like a component is a detached copy unless it is part of another component's own structure. An instance whose main component no longer exists is the same defect: it keeps its look and stops receiving updates.

    *Why:* a detached copy keeps the look and loses the link: it misses every later fix to the component, and no audit of the component reaches it.

    *Evidence:* (Mechanism, not an incident.) The scan's first version read pages before loading them and saw none, and treated an unfamiliar page prefix as non-component, which flagged a page's own internal structure; both are fixed in the engine. It matches on name only, so the reader confirms each candidate's ancestry before raising it.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "### Session probes" — the session's detached scan lists frames named like a component outside the component pages, and the reader checks each one's ancestry, since a part of another component may share a name; and an instance whose main component is gone, which no scanner rule finds yet. A remote main reads parentless whenever its source file is not connected, so it is verified by key before it is called gone.

30. **Every component property drives a layer, in every variant where that layer exists.** No property is declared and applied to nothing, and a layer wired to a property in some variants is wired in all of them. Variant axes and slots are not layer references and are exempt; a layer present only in some variants (a small size's icon, a loading state's spinner) is counted only where it exists.

    *Why:* Figma ignores a component at publication while it declares a property applied to no layer, so consumers never receive it and the publish reports success. A layer whose twins disagree passes every per-layer check, and the property changes the text in some variants and silently not in others.

    *Evidence:* in one library a button drawn at three sizes was merged into one set and its three label properties collapsed into one; 72 of 108 labels lost their text reference, every check passed over it, and the maintainer found it by eye. The publication consequence was confirmed by the maintainer and reproduced live on 2026-08-08.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "properties|unused|"; `skills/figma-components-audit/scanner/audit.js` "properties|wired|" — a declared property no layer references, and a layer wired in some variants and not in others, keyed by path and by what the layer is.

31. **Each state draws differently from its Rest sibling, and Focus is visibly indicated.** A Hover, Press or Disabled variant that renders identically to the Rest variant equal on every other axis is a product bug, and leads the queue ahead of anything cosmetic. Focus differs from Rest by a ring a keyboard user can see.

    *Why:* the canvas shows every state at once, so an identical pair hides in the grid; the product shows one at a time, and a user pressing the control sees nothing happen. A missing focus indicator leaves a keyboard user unable to tell where they are (WCAG 2.4.7, rule 4).

    *Evidence:* a run on one live library on 2026-08-13 found two states identical to Rest, confirmed as product bugs because the same set's other side rendered its states correctly. The diff had to include the variant root's opacity and fills first: without them it reported 42 false ones.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "states|" — every non-rest state against its Rest sibling: fills, strokes, effects, opacity and visibility of every layer, the root's included.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — whether each Focus variant shows a visible ring, which no scanner rule compares yet.

48. **A state variant binds its own state's tokens.** A Press variant takes no Hover token, a Hover variant no Press token, and a resting token appears in another state only on a layer that carries it at Rest too (a switch knob that never changes). A state no token names, such as Loading, borrows the resting tokens by design.

    *Why:* rule 31 catches a state that looks the same as Rest, not one that looks like a different state: a Hover colour left in Press, or a square Rest fill added behind a rounded Hover button, renders a change, just the wrong one, and the canvas grid hides it.

    *Evidence:* 2026-10-15, one live web library: a square Rest fill on the outer frame of 36 rounded Secondary and Outline button variants (Hover, Press, Focus, Disabled), a Hover fill covering a Date picker's whole Press variant, and a Hover fill on two Focus radios, all fixed that day.

   *Checked:* `skills/figma-components-audit/tests/test-audit.mjs` "figma-standard rule 48: a resting token added in Hover only, and a Hover token in Press, are raised; a knob at rest in every state is not".

32. **Text meets the project's contrast floor against its surface, in every mode.** Where the project names no floor, WCAG 2.2 SC 1.4.3 (Contrast Minimum, AA) applies: 4.5:1, and 3:1 for large text (24px, or 18.66px bold). Each pair is resolved per mode with its alpha; a translucent pair is checked by eye, and disabled text is exempt.

    *Why:* a contrast failure is user-visible by definition, and it hides in the mode nobody has open: a pair that passes in Light and fails in Dark looks correct to whoever designs in Light. The fix usually belongs to the token pair, never to unbinding the component.

    *Evidence:* (Mechanism, not an incident.) A paint's cached colour is the value of the mode on screen, so one reading checks one mode. The resolution is from a real run: following each alias into its target's first mode resolved every Dark token to its Light colour, and Light and Dark reported identical ratios, so an alias is followed by mode name.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "accessibility|contrast|" — text over an opaque surface inside its component, in the mode each variant resolves to, disabled variants exempt.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — every other mode, and translucent surfaces, which one reading cannot see; the reader names the failing token pair and its mode.

33. **A component is built from auto-layout frames, never groups, and its text hugs vertically.** A `GROUP` inside a component becomes a frame; a boolean operation inside an icon is not a group. A text layer has no fixed height unless it truncates by design (`ENDING`, a maximum line count) or fills its parent by instruction.

    *Why:* a group ignores the auto-layout everything around it obeys, so it stays put when content moves. Fixed-height text clips instead of reflowing: invisible while it holds the copy it was drawn with, and broken in the locale nobody tested.

    *Evidence:* (Mechanism, not an incident.) The group check, walked 2026-08-08, was silent across 55 real components and fired on a probe holding one. Fixed height is read from `textAutoResize`, never from `layoutSizingVertical`, which reported `FIXED` on 33 layers that hug both ways.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "structure|group|" — every group in every variant, never inside an instance.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "structure|no-autolayout|" — a frame holding visible layers without auto layout, a review: an overlay or illustration may be absolute by design.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — fixed-height text, which no scanner rule reads yet; the reader clears designed truncation.

34. **A hidden layer is hidden by a property, and a switched-off paint, stroke or effect is removed.** A layer hidden in every variant with no boolean controlling it is dead weight or a conditional the property model never captured, while one a sibling variant shows (a focus ring, a loading spinner) is variant-driven and fine; a fill, stroke or effect toggled off in the panel stays in its array, colour and binding included.

    *Why:* both are invisible on the canvas and present in the file: they travel into every instance and into anything that reads the node, and a hidden layer with no property is a state no consumer can reach.

    *Evidence:* (Mechanism, not an incident.) A switched-off paint is an array entry with its own `visible: false` on a node that is itself visible, so the hidden-layer walk cannot see it and the two need separate walks.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "structure|hidden|" — a hidden layer wired to no visibility property, filed as hygiene.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — switched-off paints, strokes and effects, which only a session probe lists.

35. **Every variant axis offers a real choice.** No axis carries a single option, none keeps an option left behind by a rename, and an axis whose only effect is showing or hiding one subtree is a boolean instead, unless it reflects content the component holds (rule 21's `Has number`). A single-option axis can be deliberate (staged for planned options, or matching a sibling library's API), which is a ruling to record; removing or merging an axis deletes a property, which loses every consumer's choice on it, so a hit is a decision, never a batch fix.

    *Why:* an axis with one value does a constant's job while widening the API and stamping `Axis=Value` into every variant name; a stray option offers a choice nobody designed; a visibility-only axis doubles the grid for what one boolean expresses.

    *Evidence:* (Mechanism, not an incident.) The single-option probe, walked 2026-08-13, was silent across the 54 sets of a live library and fired on a probe set carrying one; no library has yet shown a stray option or a visibility-only axis.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit: the session's schema probe lists single-option axes, and stray options and visibility-only axes are the reader's.

36. **An interactive component carries the full state set of its archetype.** The archetype's states are the ones this library's own components of the same kind use, never a fixed table. A state missing on one component is a question; missing library-wide it is conformance (a touch-first library has no `Hover`). Whether a control should carry the loading state is a judgement to surface, not assume.

    *Why:* a state the design never drew is one the code improvises, and the improvised one matches nothing else in the product. The library's own baseline is the yardstick because a fixed table fails a library that legitimately lacks a state.

    *Evidence:* (Mechanism, not an incident.) The schema probe this baseline replaced hard-coded one library's `Rest · Focus · Hover · Press · Loading`, which a library with no `Hover` would have failed wholesale.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit, per component, once its archetype is decided during scoping.

37. **Text a consumer would legitimately set is exposed as a text property.** A heading, a caption, a message, a filename or a person's initials carries one. Two exceptions, both a minority: text static by design (a calendar's weekday headings, a mandatory-field asterisk, a currency symbol) and text code writes at runtime (`Uploading - 64%`). Text inside a slot needs none. The test is whether a consumer would ever set the string, not whether it varies today.

    *Why:* the property puts the string in the panel where a designer sets it and gives a code mapping a prop to pair; without one the content is buried in the layer tree and missing from the component's API. A property on static text invites changing what should not change.

    *Evidence:* one library's single-variant message card held a lorem paragraph with no property and passed a full clean audit; it was caught only when someone went to write its description. A sweep of that library's 71 sets then raised 7, four cleared on sight as static by design.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit: the session's text-coverage probe lists text with no property, and the reader clears static and runtime text.

38. **Text an item carries, inside a component whose items have variants, lives in a slot, never in a text override on a nested instance.** A text override inside a nested instance is stored per variant of that instance, so it is dropped when the instance changes variant from inside its parent; switching back restores it. Swapping the parent's own variant keeps the edits inside it, and a top-level or slotted instance keeps its text across its own variant switch. So per-item text where the item has variants goes in a slot, which keeps each item's text without duplicating the item; a component cannot change the variant of what fills its slots, so a parent-level switch never reaches slotted items, and choosing their variant becomes the consumer's.

    *Why:* the loss is silent. The text looks set in every variant the designer checks, and disappears in a consumer's file the moment someone switches the item, with nothing to say it was there. Exposing the nested instance's properties on the parent does not keep it.

    *Evidence:* tested on throwaway copies in one library on 2026-10-08: a tree whose rows changed variant inside their parent lost each row's edited label on the switch and recovered it on switching back; the same rows placed in a slot kept their labels. The same run found that a layer-name override on a nested instance resets on a parent variant switch, which is why rule 10 names layers in the component.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "overrides|nested-text|" — a nested instance whose main has variants and whose text is set by override, filed as a question: a parent that sets the same text on purpose in every variant (a dialog's `Cancel`) is the reader's to clear.

39. **An interactive component has a focus state.** A component with the state axis carries its `focusState` option (Focus), so keyboard users can see where they are; that it renders differently from Rest is rule 4's and the states check's.

    *Why:* WCAG 2.2 SC 2.4.7 (Focus Visible, AA) needs a visible focus indicator, and a library without a focus variant leaves every product team to invent one, differently.

    *Evidence:* (Mechanism, not an incident.) The state axis's options are the variant set's own `variantOptions`; a missing option is read directly, before anything is built.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "accessibility|focus" — a state axis without the `focusState` option.

40. **An interactive component with no text of its own carries its accessible name.** An icon-only component exposes a text property for its label, or a Dev Mode annotation saying what its accessible name is.

    *Why:* WCAG 2.2 SC 4.1.2 (Name, Role, Value, A) needs every control to have a name; a component that shows only an icon has nothing a screen reader can say unless the library gives the builder a place to put one.

    *Evidence:* (Mechanism, not an incident.) A set's text layers, text properties and annotations are all readable from the file; a set with none of the three has no name anywhere.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "accessibility|name" — an interactive set with no text layer, no text property and no annotation, a review.

45. **An icon library draws every set at its sizes, in bound paint, under its source's name.** Each icon set offers the sizes most sets do; every glyph's fill or stroke binds a variable or a style; and where the icons come from a published set (Lucide, say) each keeps that set's name, a drawn-here icon recorded as a ruling.

    *Why:* a size missing from one set is a resize nobody notices until it blurs; an unbound paint is a glyph that stays one colour in a theme that re-points the icon token; and a renamed icon is one code cannot find by the name its package uses.

    *Evidence:* maintainer-decreed 2026-10-11. One project's 262 icon sets, read from the stored icons that day: 5 named outside Lucide, all suffixed `-custom`.

   *Checked:* `skills/figma-foundations-audit/tests/test-foundations.mjs` "icons: a set missing a size most sets have, an unbound paint and a name the icon set lacks are raised".

## Naming

**The values these rules name are preferences, kept in [`naming-preferences.json`](naming-preferences.json).** The separators, the private prefix, the case and the words a property starts or ends with are the house's answer, which a project overrides in its context document's `naming-preferences` block. A name that departs from one still works; it reads unlike the rest. So an audit files the departure as a preference, never as a defect, and it holds no component back. A name that breaks something is not a preference and keeps its tier: a space at the end, Figma's default name, two names that differ only in case, a private prefix behind a marker.

18. **Sentence case everywhere — tokens, styles, components, properties, values, pages and layers.** Capitalise the first letter of each path segment and leave the rest lowercase: `Background/Feedback/Danger/soft`, `Corner radius/full`, `Text input`, `Content slot`. Two carve-outs, both evidenced rather than granted: **in a token or style path, the leaf stays lowercase whenever it is a value, and may join its parts with a hyphen** (`soft`, `base-rest`, `md-medium`, `span-2`, `9-source`, `regular`, `semibold`), and **assets keep their source names** (`arrow-left`, `chevron-down` from an icon set), because a renamed icon stops matching the set it was imported from. Every other name is plain words separated by single spaces: never camelCase, snake_case or kebab-case as a separator, with a hyphen only inside a word that is spelt with one (`Pre-header`, `Sub-items slot`). Acronyms keep their capitals (`AI`, `AM-PM`); abbreviations are written out (`Maximum height`, never `Max. height`; `Menu position`, never `Menu pos.`); numbers are digits (`Item 3`). Variant values are names, not token values, so they are capitalised (`Rest`, `Danger`), except the lowercase t-shirt sizes of rule 6 and Figma's own `True`/`False`. The only marks a name carries beyond words are the ones these rules give it: `_` for private (rule 8), ` / ` between siblings and ` - ` before a flavour (rule 20), `/` between the groups of a token or style path, and the status and deprecation markers (rules 13, 14). Page furniture is the one place outside this rule: category headers in capitals, dividers, and the page markers of rules 11, 13 and 14.

    **The leaf rule is "always", not "usually", and it was tightened to get there.** As first written it said *scale or state* leaf, which left every other kind of value to judgement — and the judgement immediately went wrong in the file that prompted the rule: `Font/Weight/Medium` and `Font/Weight/Regular` sat capitalised beside `Icon/Neutral/medium`, so the same word carried two cases in one library. No collision, since the paths differ, but a rule whose application needs a ruling per token is not a rule. Any leaf naming a value is lowercase, whatever kind of value it is. The one standing exception is the elevation effect styles (`Elevation/Raised`, `Elevation/Floating`, `Elevation/Modal`), kept as a three-name allowlist rather than a judgement clause: a reader checks three names, where "leaves that read as names" would be a judgement every time.

    *Why:* one rule spanning every class of name is one rule to remember and one to check, and every name in a design tool is read by a person in a picker or a layers panel before it is read by anything else. Sentence case is what a person reads fastest in a list — it marks word boundaries without the shouting of Title Case or the run-together of camelCase — and it survives translation to code, since every export path in this toolkit lowercases and hyphenates on the way out. The case a designer sees and the case a developer types are allowed to differ precisely because the transform is total and lossless in that direction.

    Checked live across all three registered projects, 2026-08-20. Tokens: two projects already wrote `Colour/Background/Feedback/Danger/soft`, and the third adopted the identical shape the same day, having briefly gone lowercase for exporter parity before the maintainer ruled for one convention across all name classes instead. Components: sentence case in all three, unanimous and unprompted (`Text input`, `Compact button`, `Filter chip`). Layers: same, with one project's audit history recording a `Labe` → `Label` fix as a defect rather than a variant spelling — which is the tell that the convention was already binding there before anyone wrote it down.

    **What this rule cost to establish, recorded because it is the interesting part.** The argument against aligning all four classes was that a layer name is Figma's override-matching key, so renaming layers inside published components would drop overrides on instances downstream. That argument was **wrong, and measured to be wrong**: 511 layer renames across one library, against a consumer file holding 877 instances with 2050 overridden fields, cost **zero** overrides. Figma's name-matching rule governs *swaps* — changing a variant, swapping an instance — not a rename inside a main component, where the instance layer follows by lineage. A mechanism cited from documentation and never measured is a plausible reason, not a proven one.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "naming|prop-case|" — property names; `skills/figma-components-audit/scanner/audit.js` "naming|layer-case|" — layers; `skills/figma-components-audit/scanner/audit.js` "naming|component-case" — component names; `skills/figma-components-audit/scanner/audit.js` "naming|value-case|" — variant options. Each a capital inside a part of the name, an acronym excepted.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — every other class of name, because the carve-outs (values, imported assets) need judgement.

19. **One case per name space: no two component, variable, style or token names may differ only in case.** Rule 18 fixes which case; this rule binds even where a project departs from it.

    *Why:* the two halves of a split are both valid and one of them silently loses. DTCG makes token names case-sensitive, so `Feedback/Danger/soft` and `Feedback/danger/soft` are two legitimate tokens, and the spec's own non-normative note is that tools *may* warn when names differ only by case ([Design Tokens Format Module](https://www.designtokens.org/tr/drafts/format/)). Every export path in this toolkit then lowercases: `figma-token-export`'s `scripts/dtcg.js` lowercases and hyphenates every segment, so the pair collapses to one path — and it is only because `setDeep` refuses to overwrite an occupied path that the second one is reported instead of overwriting the first. A pipeline without that guard ships one token and drops the other, while both still look present in the design tool.

    Admitted 2026-08-20 from a real split: one project's `Semantic` collection spelled the Role slot capitalised in its `Icon/*` and `Text/*` tokens and lowercase in every `Background/*` one, unnoticed across several library versions because nothing measured it and both forms render correctly in the picker. Checked against the two other registered projects the same day: both are internally consistent, so the rule holds 3/3 and the failure is a defect rather than a convention anywhere.

    **Which case is now rule 18.** This rule stayed silent on it for one revision, when the evidence was two projects capitalising against one lowercase; a third project's realignment the same day made the pattern unanimous and rule 18 states it. Rule 19 survives separately because it is the stronger claim: it holds whatever case a project picks, and a project that later diverges from rule 18 still owes rule 19.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "differ only in case" — components; `skills/figma-foundations-audit/scripts/library.mjs` "differ only in case or separator" — a tokens library's variables, from the snapshot; `tools/tokens/dtcg.js` "name collides with another token at"; `tools/tokens/dtcg.js` "name collides with another style at" — variables and styles, refused when exported. figma-foundations-audit owns the check; the components audit classifies case for rule 18 and reports no collision.

20. **In a component name, ` / ` separates equivalent siblings only; a family and its part are joined by a space.** ` / ` marks a virtual set: one part split into interchangeable alternatives a designer picks between, which share one byte-identical description (`Cell / Fill` and `Cell / Hug`, `FAB button / Default` and `/ Open`). Anything that is not an alternative, such as a level or a sub-part, is a word in the name (rule 9). A component that relates to another but is built separately, a flavour of it, takes the other's name, ` - ` and the flavour: `Button - CTA`, `FAB - AI`, never `FAB (AI)`; its parts follow rule 9 from that name (`_FAB - AI button`). Token and style paths group with an unspaced `/` (rule 18).

   *Why:* the two separators carry different obligations, and only the separator distinguishes them. Virtual-set siblings must hold identical description text; family members must not. A tool that cannot tell which it is looking at either propagates a description across components that should differ, or leaves siblings inconsistent, both silently. Levels written after a slash (`Item / L1`) read as alternatives when one nests inside the other.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "naming|separator".

8. **A component that does not publish starts with `_`; a building block that fills a slot does not.** The prefix marks an internal part. A part consumed through a slot is deliberately public and unprefixed, because Figma offers only published components in a slot. An audit verifies slot consumption before raising a bare name.

   *Why:* Figma leaves a component whose name starts with `_` out of the published library, so the prefix is what keeps an internal part out of every consumer's asset panel. A slot filler has to be published for the slot to offer it, so prefixing it would break the slot; raising its bare name would push a designer to do exactly that. *(Mechanism, not an incident.)*

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — by the audit's reader, after it verifies slot consumption, since an unprefixed slot filler is public on purpose.

9. **A part is named for its family and its own last word, joined by a space; inside its parent the layer keeps only the last word.** A part built for one component is named after the component its page documents plus the part's own last word, in sentence case, with every level in between dropped: `Card header`, `Sidebar dialog item`, `Date picker single day`, never `Sidebar dialog - Modal - Sidebar - Section - Item`. Levels that are not alternatives go into the name as words, not after a slash: `File explorer level 1 item`. A family large enough to have its own category (`🔷 TABLES`) names its members without the family word, which the category already supplies: `Cell / Fill`, `Context flyover item`, `Toolbar`, while the family's root keeps it (`Table`). The **layer name** of a part where it sits inside its parent is that last word alone: `Item`, `Cell`, `Header`; copies that must be told apart keep role names or numbers (`Up`, `Down`, `Section 1`). The rule binds *parts*, never a public component that merely happens to be composed somewhere; and a part consumed by **more than one** parent has no single family to take, so it keeps a functional name.

   *Why:* the family word is what makes a part findable from the thing it belongs to; without it the asset panel is a flat list in which `Item`, `Section` and `Day` sit side by side. Chaining every ancestor did the opposite of helping: real kits name a part as parent plus part, one level deep, and none of 33 surveyed chains ancestors with ` - ` (research 2026-10-07: space joins in 12 kits, the most common form, with Figma's own Simple Design System among them). Dropping the middle levels keeps names short enough to read in an instance picker, and the category exception follows from the same reasoning: once a family has its own category, every page in it already says which family it is. Inside the parent, position establishes ownership, so repeating it turns the layer tree into an index instead of an anatomy.

   Maintainer-decreed 2026-10-07, replacing the ` - ` chain this rule required since 2026-08; applied the same day to one library (72 components, 29 nested instances renamed).

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "naming|parent-name|"; `skills/figma-components-audit/scanner/audit.js` "naming|part-layer|" — a part's layer still carrying the part's whole name.

10. **Every layer is named for its role.** A layer is named in the component, never by an override on a consumer's instance, and says what it is (`Label`, `Icon`, `Divider`, `Container`), never Figma's default (`Frame 12`, `Rectangle 4`) and never the sample copy it happens to show (`Connection successful.`). A text layer bound to a property takes that property's name (`Value`, `Helper text`), a nested part takes its last word (rule 9), and a nested public component keeps its own name.

    *Why:* the layer name is what a developer reads in Dev Mode and what Figma matches overrides by when an instance is swapped (rule 18), so a default name tells them nothing and a sample-copy name goes stale the moment the copy changes. Across the kits read for rule 21, text layers are bare role nouns; the ones named after sample copy (16 of 101 in 5 kits) are the exceptions those kits carry as debt.

    Maintainer-decreed 2026-10-07, gathering what rule 9 and the property rule already said about bound text and nested parts and adding the rest.

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "naming|default|" — Figma's default names.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — a layer named after its sample copy, which Figma's default naming of a text layer makes indistinguishable to a script.

21. **Properties are named for what they hold, in the code's words.** A text property is the bare noun, matching the code prop where one exists (`Label`, `Title`, `Placeholder`, `Value`), keeping "text" only where the code prop has it (`Helper text` for a `helperText` prop). A boolean property that reveals an element (text, an instance or a slot) takes `Show` (`Show avatar`, `Show icon` beside `Icon`, `Show value` beside `Value`); one that switches a style and reveals no element, such as a decorative stroke, is a bare word, as a state is (`AI`); a True/False variant property is a state and stays a bare word (`Disabled`, `Selected`, `Open`), never `Is` (`Is open`), or takes `Has` when it reflects content the component holds rather than an interaction (`Has value`, `Has number`), a word no boolean takes; `Show` never names a variant. An instance swap is named for the thing it holds (`Icon`, `Graphic`), never the mechanism (`Icon swap`), with `Leading`/`Trailing` for position, which survives a right-to-left layout. A slot property is `Slot` by default. A slot that sits first or last in a horizontal layout is `Leading slot` or `Trailing slot`, even when it is the only one; a slot that holds a repeated element is named for what it hosts (`Items slot`, `Tabs slot`). A boolean that shows a slot is `Show` plus the slot's name (`Show leading slot`), never a second name such as `Leading slot content`. Position is `Leading`/`Trailing` wherever it appears, in a name or a value, never `Left`/`Right`. No two properties of one component share a name: Figma then shows its internal ids (`Label#330:11`) to everyone who sets them.

    *Why:* names that match the code let a designer's file read as the specification and let tools pair Figma with code without a lookup table; a small test with Claude writing code from Figma found aligned names cut wrong props by more than half when the component API was not in its context (research 2026-10-07). Across 23 kits' Code Connect files, bare nouns are the majority form for text properties (50%, main style in 14 kits), `Show X` beside a bare `X` is the most common way to separate a boolean from the content it reveals, and plain `Icon` is the most common swap name.

    The style-switch carve-out is maintainer-ruled 2026-10-12, on a button's `AI` boolean that shows a gradient stroke: the code has no `show` prop for it (`variant="ai"`), and across 23 kits 65% of boolean names are bare while `Show X` is the form beside a content property.

    Maintainer-decreed 2026-10-07; applied the same day to one library (102 text properties, 25 shared-noun booleans and variants, 5 swaps and icon booleans, 23 text layers).

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "naming|prop-boolean|"; `skills/figma-components-audit/scanner/audit.js` "naming|prop-state|"; `skills/figma-components-audit/scanner/audit.js` "naming|prop-text|"; `skills/figma-components-audit/scanner/audit.js` "naming|prop-swap|".

6. **Sizes use a t-shirt scale.** A size property is named `Size` and its values are t-shirt names, written lowercase and ordered largest first: for example `2xl`, `xl`, `lg`, `md`, `sm`, `xs`, `2xs`. A component uses only the steps it needs, as one unbroken run of the scale: `lg`, `md`, `sm`, never `xl`, `md`, `sm`, `2xs`, because a gap says a size is missing and leaves the next one added nowhere to go. The rule sets the names, not the measurements: what each step measures is the project's choice. Ideally each name pairs with one value across the library, so a `md` button, a `md` icon button and a `md` input stand the same height and line up in one row.

    *Why:* t-shirt names match how most kits and frameworks write size props in code (`size="sm"`), and they leave room above and below without renaming: a new step is `2xl`, never `Extra large 2`. Sharing one value per name is the ideal rather than the rule, because it pays off only where components sit side by side: when `md` is 40px on a button and 36px on an icon button, a designer pairing the two by name gets a misaligned row, and the code repeats the mismatch in every prop.

    Maintainer-decreed 2026-10-07. One registered project had already ruled the largest-first order (2026-09-05), and another had aligned its icon button to its button's heights for exactly the misaligned-row reason (2026-08-28).

   *Checked:* `skills/figma-components-audit/scanner/audit.js` "schema|size-values|"; `skills/figma-components-audit/scanner/audit.js` "schema|size-name|"; `skills/figma-components-audit/scanner/audit.js` "schema|size-gap|".

22. **Component vocabulary matches token vocabulary** — whatever that vocabulary is per project (one project canonises `Success`, another `Positive`; the *matching* is the standard, the words are not).

   *Why:* a mismatch is invisible in either artifact alone and only appears when someone holds both — a `Success` variant bound to `…/Positive/…` forces every reader, human or generated, to carry a translation table that exists nowhere in the file. The cost lands on readers who never see the two side by side. *(Mechanism, not an incident.)*

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — by the audit's reader: whether a component's words match the tokens' is a reading of both vocabularies.

12. **Category-name reference vocabulary**: `Actions`, `Data & Display`, `Feedback`, `Inputs`, `Layout`, `Navigation`, `Overlays`, `Selection`, `Tables`. A project draws a new category's name from here before inventing one; its header page writes it in capitals (rule 11).

    *Why:* rule 22's precedent applies — that components are organised into named categories is universal (rule 11); the exact words are not, the same way component vocabulary and token vocabulary must match *each other* without either being fixed across projects. A shared reference list still earns its place: two projects independently converging on `Actions`/`Feedback`/`Inputs`/`Navigation`/`Overlays`/`Selection`, unprompted, is evidence a shared starting vocabulary is worth writing down even where it does not bind.

    This list is the **union** of two registered projects' live category names, not the intersection, and neither project fully matches it today — stated plainly rather than claimed as an already-achieved convention. Six categories matched exactly; a seventh matched in substance with differing punctuation (one project's `Data & Display` versus the other's `Data Display` — this file's spelling, per rule 22's own reasoning, not a second rule). Each project also carries one category absent from the list as observed: the second project's `Layout` is included here because the first's equivalent components (`Divider`) sit inside `Data & Display` rather than a category of their own, which this list treats as the gap; `Auxiliary` is not on the list: rule 11 pins it last as a catch-all, and a catch-all is where components without a clearer home wait, not a category a project should reach for.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — at each audit, for each page: whether a component belongs under an existing category is judgement.

23. *Retired 2026-10-08: moved to toolkit-standard §D 20, since it governs every tool's output.*

## Pages

11. **Pages are grouped into named categories; categories are ordered alphabetically, and pages within each category are ordered alphabetically too.** A finished component page's name starts with `❖`; a page still in progress starts with `🚧` instead (rule 13). **A category is a header page named `🔷 CATEGORY`** — blue diamond, capitals — and **categories are separated by a divider page named `---`**, which Figma draws as a rule; both are furniture, never members of a category. Two categories are pinned last regardless of alphabetical position, in this order: `AUXILIARY`, the catch-all for parts and support pages, then `DEPRECATED` (rule 14).

    *Why:* an alphabetised page list is navigable by a maintainer, or by a generated file browser, without a separate index — the ordering itself is the index. The `❖`/`🚧` marker is what lets a glance, or a script, tell a shippable component from a draft one without opening the page.

    Checked live against two registered projects, 2026-08-10. Category order was alphabetical in both, with one divergence: one project pins a catch-all category (`Auxiliary`) last regardless of alphabetical position, and the other has no equivalent — no catch-all category and no exception. It stayed that project's override until the maintainer decreed it for every project on 2026-10-07, beside `DEPRECATED` (rule 14): a catch-all and a deprecated section are both read last. Page order within category had five confirmed exceptions in the first project (`Badge`/`Avatar`, `Drawer`/`Dialog`, `State layer`/`Scroll bar`, `Text input`/`Text area input`, `App switcher`/`App header`) — corrected the same day once checked against the second, whose pages were alphabetical throughout, including the exact pair (`Text area` before `Text input`) the first had backwards. That match is what told the exceptions apart from a second convention rather than drift; one of the five was missed on the first pass through the first project and only surfaced on a second, independent verification of the same file after the rule had already shipped — a reminder that a fix applied is not the same claim as a walk completed. The `❖`/`🚧` marker held in both files without exception: one project's single in-progress page and the other's two are the only `🚧`-prefixed pages in either, everything else finished is `❖`.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "page-order|category"; `skills/figma-foundations-audit/scripts/foundations.js` "page-order|pinned".

13. **`🚧` marks a page and every component on it as in progress; generated text never quotes it.** A page still in progress is named `🚧 Name`, and every component on that page carries the marker: a public component starts with it (`🚧 Time input`), and a private part puts it after the `_` that keeps it unpublished (`_🚧 Time input picker`), since Figma publishes any name that does not start with `_` (rule 8). When the page is finished, the page takes `❖` and its components drop the marker. Properties-table titles, component descriptions, page headers, code names and parity pairings read every name with the marker stripped: the table reads `Time input`, a description cites `_Time input picker`.

    *Why:* the marker is a status, not part of the name. On the component it shows a draft wherever an instance is picked, not only in the page list; in generated text it would go stale the day the page becomes `❖`, and every table, description and code mapping that quoted it would need editing for a change that altered nothing about the component.

    Maintainer-decreed 2026-10-07. Enforced: `figma-properties-table` 1.4.0 titles tables without the marker and reports one that keeps it, `figma-component-descriptions` 1.12.0's verifier accepts a citation without it, and `figma-foundations-audit` 1.14.0 compares part names without it.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "status-marker|missing|"; `skills/figma-foundations-audit/scripts/foundations.js` "status-marker|stale|"; `skills/figma-foundations-audit/scripts/foundations.js` "status-marker|publishes|"; `skills/figma-properties-table/tests/test-properties-table.js` "A8: a title without the status marker matches a 🚧 component"; `skills/figma-component-descriptions/tests/test-verify.mjs` "D17: a name cited without its status marker is known" — the marker on every component of an in-progress page, after a private part's `_`, and on no other; a properties-table title and a description citation read the name without it.

14. **A deprecated component is marked in its page, its name and its description, and keeps working until it is removed.** Its page is named `🚫 Name` and moves to the `🔷 DEPRECATED` category, pinned last after `AUXILIARY`. The component is renamed `[🚫 DEPRECATED] - Name` (`[🚫 DEPRECATED] - Side navigation`), and a private part keeps its `_` first (`_[🚫 DEPRECATED] - Side navigation item`, rule 8), which keeps the warning visible in every instance's name. Its description says what replaces it in its first paragraph (`Deprecated: use List instead.`) and keeps the rest until removal. Generated text keeps the deprecation prefix, unlike `🚧`: it is a warning a consumer must see, not a status that goes stale.

    *Why:* deprecation has to reach the person placing an instance, not only the person browsing pages. A page marker alone is invisible from inside a product file; the name prefix shows wherever the instance sits, and the description tells them what to use instead. Keeping the component published until removal lets product files migrate on their own schedule instead of breaking.

    Maintainer-decreed 2026-10-07 from the convention one library already used for `Side navigation`.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "deprecation|name"; `skills/figma-foundations-audit/scripts/foundations.js` "deprecation|page|"; `skills/figma-foundations-audit/scripts/foundations.js` "deprecation|publishes".

15. **A component page documents its subject with the five-section template, in order**: a page **header** carrying the component name and the first sentence of its description, then section cards — `Examples` (instances as published with the library) · `Component` (the main editable component) · `Parts` (sub-components, usually unpublished) · `Properties` (the generated properties table, one per component on the page) · `Matrix` (component permutations, **generated with the Propstar plugin**). A section with nothing to hold is omitted — a leaf component has no `Parts` — and **`Matrix` is present exactly when the page's primary component has variant axes or booleans**, since permutations are generated from those and a component with neither has nothing to permute. **Building-block pages are exempt from the template entirely** `[maintainer-ruled 2026-08-13, widened the same day]` — pages holding only components that take the compact description tier: internal-prefixed, or slot-only. Their consumers are the components that compose them, documented on those components' own pages. The template tier and the description tier are the same boundary, deliberately: a component too internal for a full description is too internal for a documentation page. Running Propstar, or any plugin, displaces the Desktop Bridge, so a live check of this rule runs apart from Matrix generation, and only the maintainer regenerates a Matrix.

    *Why:* one page shape means a reader — or a generated file browser, or an AI walking the file — knows where everything is on any component page before reading it. The header-mirrors-description rule keeps canvas and panel from drifting: the header is generated from the description, never typed (toolkit-standard §D 23; the description skill enforces it as a sync). Naming the generating tool per section (Propstar for `Matrix`, the properties-table skill for `Properties`) is toolkit-standard §D 16's argument at page scale: a section with a named generator is a refill, and a section without one quietly becomes hand-maintained and stale.

    Maintainer-decreed 2026-08-13, template supplied as a screenshot of a live page; **swept live the same day against one registered project, and the sweep sharpened the rule's reading.** 32 of 35 component-bearing pages carry the template, and the Matrix correlation holds **exactly** once "the component" is read as the page's *primary* component: every page whose primary has variant axes or booleans has a `Matrix`, and every page whose primary has neither — a slot-only wrapper like an accordion or tab bar, a prop-less dialog, a plain divider — has none, even where the page's *items* carry axes. A first reading that counted any component on the page reported five false gaps; the primary-component reading reports zero, in both directions. The three template-less pages are two private-parts pages plus one public slot surface whose peer page carries the full template — flagged to the maintainer rather than assumed exempt. Since 2026-10-08 the foundations audit checks every component page on every run.

   *Checked:* `skills/figma-foundations-audit/scripts/foundations.js` "page-template|order|"; `skills/figma-foundations-audit/scripts/foundations.js` "page-template|matrix|"; `skills/figma-foundations-audit/scripts/foundations.js` "page-template|missing|" — the section cards (`pageSections`, `pageSectionComponent`, `matrixSection`) in canvas order; the content of each section is checked by the skill that writes it (`figma-properties-table`, `figma-component-descriptions`).

## Tokens in Figma

16. **The alias graph lives in Figma, never transcribed into documents.**

   *Why:* toolkit-standard §D 17's argument in its specific form. An alias chain is multi-level, live-readable in one call, and changes whenever anyone retiers a token — so a transcript is stale the moment the source moves and cannot announce that it has gone stale. What a document can usefully record is the *policy* (which tiers exist, which are consumable), which is stable; the graph itself is state.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — whenever a document about tokens changes: nothing a script reads can tell a transcribed alias graph from prose.

24. **Semantic-only consumption** where primitives are hidden: a component bound directly to a primitive is a defect. Styles may reference hidden primitives internally — the tier rule binds components, not styles.

   **Know what hiding costs before adopting it.** `hiddenFromPublishing` is what enforces this rule mechanically, and it is absolute: a hidden variable cannot be imported by key from *any* consuming file, so anything living outside the source — a separate documentation file above all — can only reproduce those values as static copies, refreshed by regeneration. The tier rule is still worth it; the price is paid by every consumer, not just by components, and a project that documents outside its library should decide this deliberately.

   *Why:* the semantic tier is where a mode, a theme or a re-pointed role takes effect. A component bound straight to a primitive keeps its raw value when the semantic token above it moves, so it is the one thing on screen that stays light in dark mode or keeps the old brand, and nothing in the file marks it as different until someone sees it.

   *Evidence:* (Mechanism, not an incident.) A primitive binding resolves the same in every mode of the semantic collection, so the defect only shows when that mode is switched. The cost of hiding is from a real run: one documentation run into a separate file found a hidden tier only partly reachable through published aliases (61 of 106) and fell back to static fills for the whole page.

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

43. **A style binds a variable wherever Figma lets it.** A text style binds its font family, weight, size, line height and letter spacing; an effect binds each layer's colour, offsets, blur and spread.

    *Why:* a style's raw value is a decision the tokens cannot reach: change the line-height token and every style keeps its own copy. Rule 29 binds a component's values; this is the same rule one level down.

    *Evidence:* maintainer-decreed 2026-10-11. The same library's 44 text styles bound family, size and weight, and none bound line height or letter spacing.

   *Checked:* `skills/figma-foundations-audit/tests/test-foundations.mjs` "tokens: a style field Figma can bind and the style leaves loose is raised, one row per field".

44. **Parallel token groups have one shape.** A group holds tokens or groups, not both, and sibling groups carry the same leaves: a leaf most siblings have and one lacks is a gap or a decision, and a ruling records the decision. Two names that differ only in case or separator are rule 19's error.

    *Why:* code generated from the tokens maps each group to an object, so a group with a leaf and a subgroup side by side has no clean shape, and a missing leaf is a missing key some component will look up.

    *Evidence:* maintainer-decreed 2026-10-11. The same library: palette steps named `6 - source` beside plain `6`, and an icon group with no `soft` where its siblings have one.

   *Checked:* `skills/figma-foundations-audit/tests/test-foundations.mjs` "tokens: a group holding tokens and groups, and a sibling group missing a common leaf, are one structure row"; `skills/figma-foundations-audit/tests/test-foundations.mjs` "tokens: two names that differ only in case are an error".

47. **A brand's inverse pair moves with its solid, in each mode.** When a brand's semantic mapping is copied from another brand and its solid fill (an `inverse` background or control) moves to a different step, the text and icon tokens drawn on that fill move with it, and each mode is mapped on its own: a light hue's solid takes the dark end for its text, and its dark-mode solid sits where that mode's ramp holds the hue, not at the light mode's step number.

    *Why:* a copied mapping copies the pairing the source brand's hue needed, and a step number is a different lightness in each mode's ramp, so a pair that reads in one brand or mode can vanish in the next.

    *Evidence:* 2026-10-15, a yellow brand extension copied from a blue one: moving the solid to the yellow's step 5 left its inverse text on step 1 at 1.4:1, and the same step 5 in dark mode put the button at 1.31:1 against the canvas. Nothing flagged either at the token mapping; rule 32 reaches them only once a component draws the pair.

   *Reviewed:* `skills/oklch-color-scale-system/SKILL.md` "solidForeground" — the ramp's measured foreground for its solid, per mode; whether the brand's mapping follows it is read in the session that maps the brand.

49. **A component token is named `Component/<Component>/<Element>/<property>[-<variant>][-<state>]`, in the component's own words, and aliases a semantic token.** The component segment is the component's name (rule 13's marker stripped), or a component group where tokens are shared across a family (`Input`). The element is the layer the token paints, by its role name (rule 10); a token on the component's own frame takes `Container`. The leaf is lowercase (rule 18): the property first, then the modifiers it needs, joined by hyphens: the variant value, spelt as the variant is, then the state or a gradient stop (`background-primary-hover`, `background-start`). A modifier appears only where the value differs by it: a label that does not change on hover has no state, and a default value (`Feedback=None`) adds nothing. Two variant values follow axis order (rule 1). A brand never appears in the name: its override lives in the brand's extension under the same name, and binds a semantic token whenever one resolves to the same value in that mode; a primitive there is a recorded exception. A collection that holds only component tokens may drop the `Component/` prefix, since the collection already says it. One component worked through end to end, Figma path to stylesheet: [tokens: component token names](../knowledge/code/tokens.md#component-token-names-worked-through).

    | Case | Name |
    |---|---|
    | One element | `Component/Sidebar/Indicator/background` |
    | The component's own frame, per variant value (`Type=Photo`, `Type=Icon`) | `Component/Avatar/Container/background-photo`, `…/background-icon` |
    | A layer only one variant has | `Component/Avatar/Icon/icon` |
    | A status of a layer (`Status=Current`) | `Component/Progress indicator/Dot/background-current` |
    | A state | `Component/Tabs/Indicator/background-hover` |
    | Two axes and a state (`Role=Primary`, `Feedback=Danger`) | `Component/Button/Container/background-primary-danger-press` |
    | A nested part (rule 9's last word) | `Component/Date picker/Day/background-selected` |
    | Gradient stops | `Component/Chat layer/Container/background-start`, `…/background-end` |
    | Sizing, in a components-only collection, for a family | `Input/Field/width-default` |
    | Wrong: property before element | `Progress/Background/bar` → `Component/Progress/Bar/background` |
    | Wrong: a variant as a segment | `Avatar/With image/background` → `Component/Avatar/Container/background-photo` |
    | Wrong: a brand in the path | `Component/Avatar/Brand C/background` → the same name, overridden in Brand C |

    *Why:* code takes the token's path as its name (code-standard rule 52), so a token a reader cannot map to one layer of one component is one an engineer maps by guessing. The element before the property groups a component's tokens by the layer they paint, which is how both the picker and a stylesheet are read. Modifiers last keep every token for one layer together whatever its variants and states, and give each name one fixed shape however many axes the component grows; a variant as a path segment would scatter one layer's tokens across as many groups as it has variants. A brand segment would multiply the tokens by the brands and leave the components to switch between them, which is the extension's job.

    *Evidence:* 2026-10-15, one project's eight component colour tokens had four shapes: the property before the element, no element, a variant as a segment spelt `With image` for a variant named `Photo`, and a component name in the wrong case. Renamed in two passes, bindings kept. Four brand overrides bound a primitive or a token of the wrong role where a semantic token resolved to the same value in every mode; rebound with every resolved value unchanged. The order is the published consensus: Curtis puts the object (component, element) before the property and the modifiers (variant, state) last (`input-left-icon-color-fill`, `color-action-background-secondary-hover`, [Naming tokens](https://nathanacurtis.substack.com/p/naming-tokens-in-design-systems-9e86c7444676)); Spectrum serialises anatomy, object and property with state last ([taxonomy](https://opensource.adobe.com/spectrum-design-data/spec/taxonomy/)); SLDS ends on the property and state (`--slds-c-badge-color-background`, [styling hooks](https://v1.lightningdesignsystem.com/platforms/lightning/styling-hooks)). Material Web places a state before the element (`--md-filled-button-hover-label-text-color`, [theming](https://github.com/material-components/material-web/blob/main/docs/theming/README.md)), the one counter-example.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — whenever a component token is added or renamed: whether its element is a layer and its modifiers are the variant values spelt as the file spells them is read in the session.

17. **Tracked metric**: semantic-token coverage % per library, reported in every audit's closing metrics block. No composite score unless asked.

   *Why:* one number moving over time is legible; a composite hides which of its parts moved, and a maintainer cannot act on a score that fell from 82 to 79 without decomposing it again. The "in every report" clause is what makes it a trend rather than an anecdote — a figure reported only when it looks notable is not a metric.

   *Reviewed:* `skills/figma-components-audit/SKILL.md` "bin/closing --judgement figma-standard" — in every audit's closing metrics block, which `figma-components-audit` writes.
