# Code standard — front-end defaults for any project that ships HTML, CSS and JavaScript

**Version 1.31.1** — history in [`changelog/code-standard.md`](changelog/code-standard.md).

**Scope.** How the code of a site or app is structured: markup, styles, the scripts that enhance them, and how a design-system component is implemented. Project-agnostic by construction — it names no framework, no CMS, no file layout. It governs no directory of this repo; like `figma-standard.md` it holds cross-project defaults that a project applies.

**Precedence** is the root's (toolkit-standard *Precedence*). `figma-standard.md` governs the *design* side (Figma libraries) and the names both sides share; `design-standard.md` governs how the interface looks, behaves and reads, and decides what an accessible design does; this file governs what the design becomes in code, and how. Where the two meet — tokens, component variants — the handles cross-cite rather than restate.

**How a rule enters, is enforced and is retired** is the root's (toolkit-standard §C). Material from specifications and other systems, and lessons from a single run, wait as candidates in `knowledge/code/candidates.md` (toolkit-standard §D 21) until a run here confirms them; a candidate is not a rule and nothing may cite it as one.

**Where the checks live.** The mechanical rules are checked for every project by the toolkit's own gates (`tools/css-lint`, `tools/tokens`, `tools/parity`), which each project's check calls through `tools/project-check/check.mjs`; a project supplies facts, never a gate of its own (rule 59). **Mechanical** says a rule can be checked by a script and its check has fired on real content; **needs a read** says it turns on intent.

---

## Structure

1. **Markup stands on its own.** With the stylesheet and scripts removed, the page still reads in order: one `h1` inside `main`, headings descending without gaps, landmarks present and labelled, lists as lists, key–value data as `dl`, disclosure as `details`. A wrapper element is added only when a layout needs a box that no semantic element provides, and it is a plain `div` (or a custom element, see rule 13), never a semantic element chosen for its default look.

   *Why:* everything downstream — assistive technology, reader modes, search, the no-script path, the parity check — reads the document, not the rendering. A page whose meaning lives in its CSS has no meaning anywhere else.

   *Evidence:* one project's plain pages rendered worse than browser defaults because the reset flattened headings (`h1–h6 { font: inherit }`, correct for components) and nothing restored a scale for content pages — the markup was right and still unreadable, which is the one failure this rule cannot catch alone; rule 7 is its other half. **Needs a read**, though a smoke test can assert the `h1` count and heading order.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

2. **DOM order is reading order.** A visual reorder (grid areas, `order`, absolute positioning) never changes the order a screen reader or the tab key meets content in. If the visual order must differ, the source is arranged for the reader and the stylesheet moves things.

   *Why:* WCAG 1.3.2 and 2.4.3 in one sentence; a checker cannot see this, because the source is valid either way.

   *Evidence:* one project's job card draws title, company and date in a different arrangement from its source; the source stays title-first so the job is announced before its date. Admitted from a review that found no tool reporting the inverse. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

3. **Every band is a landmark holding one container.** A page is a stack of full-bleed bands — `header`, `section`, `article`, `footer` — and each holds exactly one shared container element that owns the max width, the horizontal padding and the alignment of what is inside it. Blocks inside take their width from their role (a heading's measure, a content column), never from margin arithmetic against the viewport.

   *Why:* the container is the one place the design's grid lives in code. Every page built without it re-derives the same numbers with `calc(50% - …)` and drifts by a few pixels from its neighbours; with it, a change to the grid is one edit.

   *Evidence:* one project built five screens with per-child `margin-inline: max(0, calc(50% - 688px))` and the hero and body of the same page started on different x positions at every width below the design's frame. Rebuilding on one container element made every page's content start on the same edge at 1728, 1280 and 390 in one pass. **Mechanical** for the structure (`main > * > container` can be asserted on every page) and **needs a read** for what goes inside. *Checked:* `tools/parity/pages.mjs` "<main> elements"; `tools/parity/pages.mjs` "unnamed <" — one `main`, and named landmarks.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — that each band holds one container: the container is a project's own element, which no gate can name.

4. **The cascade is layered, and a page may not restyle a component's root.** Styles are declared in ordered layers (tokens, reset, layout, components, utilities or the project's equivalent); a later layer wins regardless of specificity, nothing is unlayered, and no rule needs `!important` to win. Because the components layer outranks the layout layer, a page cannot change a component's `display`, `gap`, `padding` or `align-items`: a variant the page needs is an attribute on the component.

   *Why:* the alternative is specificity wars, and the failure is silent — a page rule that loses to a component simply does nothing, and the page ships looking wrong.

   *Evidence:* one project wrote page rules for a container's hero padding, a three-column grid and centred alignment; all three were silently beaten by the component's own declarations, and the defects were found by screenshot. Each became an attribute (`items`, `layout`, `gap`) and the page rules were deleted. A second project ran the whole system unlayered for a fortnight: six page rules at a component's own selector won by load order alone, and a drawer's width was correct in every measurement and wrong in the product because the workbench and the application loaded the two stylesheets in opposite orders (rule 44). Layering it took one declaration file and a mechanical wrap of sixty-three stylesheets, and was proved in the browser both ways — one class in the later layer beating a component's own rule, a four-specificity selector in an earlier layer losing to it. **Mechanical** for "nothing unlayered" and "no `!important` outside the reduced-motion block"; **needs a read** for the rest. *Checked:* `tools/css-lint/check.mjs` "gate('layers', 4"; `tools/css-lint/check.mjs` "gate('!important', 4" (each project's check calls it).

5. **A component's styles stop at its own edge.** Every selector in a component stylesheet reaches its parts through child combinators only; a descendant combinator escapes into whatever the component nests. The lint runs on the **compiled** stylesheet, not the source, because a nested `&:hover [data-x]` is a descendant selector once flattened.

   *Why:* `component [data-label]` styles the component's own label and every nested component's label, and nothing about the rule says so.

   *Evidence:* one project's dropdown styled its menu items' labels at the wrong size through exactly that selector. The lint it produced checked source lines, and missed nested and `@media` cases until it was moved to the compiled output — where it had to learn that `:is(a, button)` contains a comma and a space. A second project found the sharper form of the same rule: where every part carries its own block's name, the only selector that can reach another component is one that **names** another component, and checking for that found two real defects (a documentation table's styling inside a component stylesheet, and a row undoing a nested control's dim by writing a rule at that control's selector) where banning descendants outright would have rewritten forty-eight variant rules whose parts are not direct children — silently doing nothing to each. **Mechanical.** *Checked:* `tools/css-lint/check.mjs` "gate('own parts', 5" (each project's check calls it): a part named by its block may not name another; a bare-attribute part may not sit behind a descendant combinator, nor go past a nested component's element into its parts (placing that component by its host stays the parent's — found when a bar hid a nested item's glyph, 2026-10-03).

6. **Hooks are attributes, never classes.** JavaScript and tests find elements by data attributes (`data-job`, `data-more`, `data-facet`); the stylesheet selects on landmarks, headings, `aria-*`, custom elements and element context. The two utility classes that survive do so because their absence changes behaviour: `visually-hidden` and a spam-trap `honeypot`. One more kind of class is allowed: a component's own, where its stylesheet is generated under class naming (`styles.naming` of kind `class`, `tools/component-contract/to-code.mjs`) and its markup carries the generated classes for its root and parts. That suits a framework whose root is the native element with no custom-element host (React); every variant and state is still an attribute or a pseudo-class.

   *Why:* it lets the stylesheet rename anything without breaking behaviour, and it keeps the markup free of styling vocabulary. If structure-only selectors stop being containable, the honest fix is classes again, argued in a note — not added quietly.

   *Evidence:* one project removed classes, added them back, and removed them again within a week; the third position held because the landmark-and-heading completeness of rule 1 made it workable. A smoke check counting rows by `data-job` survived the heading level moving twice and the card becoming a component. The component class came when a React project's sheets were generated (2026-10-22): its root is a `<button>`, so no custom element is there to select, and the classes are generated with the sheet, never written. **Mechanical** for "no class attribute except the two allowed", and under class naming those of the generated sheet's *Parts* line. *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the project's own check, which in one project runs a project's `tests/bypass.php` (no class but the utilities).

50. **A rule that names a parent does not follow its markup.** Structure-only selectors (rule 6) encode the DOM into the stylesheet, so a block moved to a new parent is silently unstyled: the old selector does not match the wrong thing, it matches nothing. When a block changes parent, grep the compiled stylesheet for the selector naming its old home in the same change, and either move the rule with it or make the selector a list covering both homes.

   *Why:* nothing fails. The markup is still valid, the gates are still green, and the only symptom is cosmetic — which is the symptom that goes unreported longest.

   *Evidence:* one project moved a "Show expired" row out of a section header into a filter dialog and left its rule nested under the old header's selector. Unstyled, the label and the switch are inline siblings the template writes with no whitespace between them, so the track rendered against the last letter of the label. Found by eye, by no gate, and fixed with one selector list covering both homes — which is also what stops the two copies drifting. Not mechanical, measured: the narrow form — a page rule whose home is on a smoke page and that matches nothing on any — was run on 2026-10-03 and named 24 rules on one project, every one a rule for content or a state the sampled pages did not show, so it was not shipped; a gate that cries wolf is not read. *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — the change that moves a block greps the compiled sheet for its old home, as above.

7. **Content pages get a prose scale, not a reset.** Where a component-first reset flattens headings, a shared prose rule set restores the type scale, spacing and list styling for content that arrives as rich text (a posting, an about page), and every template that renders rich text uses that one rule set.

   *Why:* rich text is the one place the markup is not under the template's control, and it is the same everywhere it appears.

   *Evidence:* rule 1's incident; the fix was one `%prose` placeholder shared by the posting body and the plain pages. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

## Components

8. **Three kinds of component, and the kind decides the implementation.** *Visual* — a custom element plus CSS, no script (card, tag, avatar, container). *Native interactive* — a custom element wrapping the real control; the wrapper carries the variant, the native element carries the behaviour, the semantics and the accessibility (`<ds-button><button disabled>`, never `<ds-button disabled>`). *Behaviour-heavy* — a registered web component, only where HTML has no element for the behaviour, and only after checking that `details`, `dialog` and `popover` do not already cover it.

   *Why:* putting behaviour on the wrapper means reimplementing a button in JavaScript, badly; putting a real control inside costs nothing and gives focus, keyboard, forms and disabled state for free. Roughly nine in ten components need no script at all.

   *Evidence:* one project's exclusive dropdowns came from `<details name>`, its filter modal from `<dialog popover>` with `showModal()` as the enhancement, its switch from a checkbox with `role="switch"`; the one registered web component it considered was never needed. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

9. **A variant axis is an attribute; a state is a pseudo-class; disabled is the control's own.** Figma's variant axes map to attributes on the component's root (the custom element, or under class naming the native element), with two exceptions that are not negotiable: `State` (rest/hover/focus/press) is `:hover`, `:focus-visible`, `:active`, because an attribute would let a template claim a state the control is not in; `Disabled` is the native `disabled` or `aria-disabled`, so the browser keeps it out of the tab order and out of form submission. An axis whose name collides with an HTML or ARIA attribute is renamed (`Role` → `variant`, because `role` is ARIA's).

   *Why:* the template must not be able to lie about what the control is doing.

   *Evidence:* one project's library had `Role` as an axis; `role="primary"` would have told a screen reader the button has an ARIA role called primary. **Mechanical** for the collision list (`role`, `align`, `hidden`, `disabled`, `title`, `lang` as attribute names on custom elements); see rule 10 for why `align` is on it. *Checked:* `tools/css-lint/check.mjs` "gate('a state is a pseudo-class, disabled the control's own', 9": a state spelled as a class or attribute in the compiled sheet, and a role that is not ARIA's or a `disabled` on a custom element in the markup.

62. **Disabled is the control's attribute; the dim is the host's, once.** The native `disabled` (or `aria-disabled`) stays on the control, per rule 9; the dim the design draws is `opacity` from the disabled-state token on the component's own root, matched with `:has(> :disabled)` or the host's attribute, never on the inner control and never a literal. A component holding other components dims once: it sets a knob its children read before the token (`opacity: var(--dim, var(--state-disabled-opacity))`, the parent setting `--dim: 1` on its children), so a disabled group does not composite its disabled rows to a quarter. A link has no `disabled`: a disabled one drops its `href` and says `aria-disabled`, so nothing can follow it or tab to it, and the host's dim never dims a focus ring a keyboard can still reach.

    *Why:* the design dims the component, so a dim on the inner element leaves the host's border, fill and adornments at full strength — a different picture, and a parity row per variant. And opacity multiplies: a disabled group over disabled rows draws 25 % where the design draws 50 %, which no single component's check sees. Dimming is safe for contrast here because WCAG 1.4.3 exempts an inactive control; a state that is not disabled is not exempt (see the opacity candidate in `knowledge/code/candidates.md`).

    *Evidence:* both projects dim disabled by opacity. One project's parity, judged exactly for the first time, found 64 disabled variants dimming an inner element where the design dims the component; ten stylesheets moved the dim to the host and the components went to 0 differ. The other project found the double dim — a disabled card dimming the button inside it — and wrote the knob; a review then found the first project's option group compositing its pills at 0.25 the same way. A review asked whether a dimmed host dims a focusable `aria-disabled` link's ring; every disabled link in both projects drops its `href` but one, a list row that kept it and stayed reachable by keyboard behind `pointer-events: none`, and that one was fixed. **Mechanical** for the inner-element dim (a parity run's opacity row on the root); the double dim and the dropped `href` **need a read**, or a check on a nested disabled state, which neither project's library draws. *Checked:* `tools/parity/adapt.mjs` "put('ratio', 'opacity'" — parity's opacity row on the root.

66. **One focus, one ring.** A component that draws its own focus ring takes the rings of what it holds away: a placed control focused inside a ringed row, card or item draws no ring of its own there. The ring reads a knob before its value (`outline: var(--ring, 2px solid var(--focus-colour))`, the holder setting `--ring: 0` on its children), as the dim does in rule 62.

    *Why:* a part's own audit never sees it focused inside a holder, and the holder's audit leaves the part's insides to that audit, so two rings pass both. The keyboard user sees two outlines and cannot tell which one is the focus.

    *Evidence:* one project's generated checkbox row drew its checkbox's ring inside the row's on focus; every parity assertion passed, and the measurement baseline showed it. Parity's focus variants now count the outlines the root and everything in it draw against the rings Figma draws there. **Mechanical.** *Checked:* `tools/parity/adapt.mjs` "prop: '-rings'"; `tools/parity/probe.mjs` "p === '-rings'".

10. **No presentational HTML attribute is reused as a variant name.** `align`, `valign`, `bgcolor`, `width`, `height`, `border` and their kin are still mapped to CSS by every browser's presentational-hints stylesheet — on *any* element, including an unknown custom one. A component attribute picks a name the platform has never used.

    *Why:* the collision is invisible in the markup and the stylesheet alike: the author sets `align="center"` meaning *align-items* and the browser applies `text-align: center` to every descendant.

    *Evidence:* one project's container took `align="center"`; every job row, heading and paragraph inside it centred its text, and the cause took a computed-style walk up the ancestor chain to find. Renamed `items`. **Mechanical.** *Checked:* `tools/css-lint/check.mjs` "gate('no presentational attribute as a variant', 10" (each project's check calls it).


38. **A caller overrides a component through a custom property, never through a rule of its own.** In a layered stylesheet the component layer beats the page layer whatever the page selects on, so a page rule that contradicts a component silently loses — including one written with a higher-specificity selector. The component reads what a caller may change from a property with a default (`padding: var(--modal-body-pad, var(--spacing-20))`); the page sets the property. Inheritance does not care about layers, which is the whole reason this works.

    *Why:* the alternative is a page rule that looks right, tests right in isolation and does nothing on the page — the hardest class of CSS bug to see, because the code says what you meant.

    *Evidence:* one project styled a modal's body from its layout layer and watched the component's own padding win; three components in the same system had already grown properties for exactly this (`--graphic-size`, `--avatar-size`) without the rule being written down. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

39. **A hook name is checked for collisions before it is introduced.** Data attributes used as selectors are global: a wrapper named `[data-content]` inside a page is also every `[data-content]` a component renders under it, and a descendant selector reaches all of them. Grep the name before adding it; scope to a child combinator when the name must be reused.

    *Why:* the collision does not look like one. The page's own rule is correct, the component's markup is correct, and the result is a component drawn with the page's padding wherever it is nested.

    *Evidence:* one project wrapped a modal's content in `[data-content]`, the same name the text inputs inside it use for their own wrapper, and every field in the form grew 32px of padding and a 24px gap. **Mechanical** (grep the attribute name across the system before use). *Checked:* `tools/css-lint/check.mjs` "gate('a hook name reaches only its own', 39", over the compiled sheet: a rule outside the components layer that reaches a component's data attribute through a descendant combinator.

11. **A layout container is a component.** Max width, horizontal padding, the default gap and the alignment of children are one element with a small set of attribute variants (centred children, a wider gap, a column layout). Pages never declare these values.

    *Why:* rule 3's mechanism. The variants exist because rule 4 forbids a page from setting them.

    *Evidence:* rule 3's incident. **Mechanical** for "no page rule sets `max-inline-size: <the grid's width>`". *Checked:* `tools/css-lint/check.mjs` "gate('a layout container is a component', 11": a rule outside the components layer that sets the max width a container component sets.

12. **A fallback renders only when its subject is missing.** A placeholder glyph appears only when there is no image; a "read more" control appears only when there is more; an empty state appears only when the list is empty; a "show expired" switch only when something is expired.

    *Why:* a control that reveals nothing is a control that lies, and a fallback drawn under real content shows through it.

    *Evidence:* one project's avatar drew its placeholder glyph under every logo and the glyph showed through transparent ones; its company page offered "Read more" before the script that made it work existed, which was caught by the comment that refused to ship it. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

13. **Slots, not render props.** A component that wraps arbitrary content (container, modal body, list) takes it as a slot in the template language, so the call site reads as markup and the wrapper owns nothing but its own element.

    *Why:* pre-rendered HTML strings passed as data are invisible to escaping discipline and to reading the template.

    *Evidence:* one project's container went in as a slotted snippet across five templates in one pass; the modal, built earlier with a `body` string, is the counter-example still standing and reads worse. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

60. **A rule written inside `@scope` cannot reach the document element.** `@scope (body) to (.dash)` starts at `body`, and `:root` is `<html>` — outside it. So a selector that reads a state kept on `<html>`, the ordinary place for a theme or a view choice, compiles, ships and matches nothing. Either keep the state on an element inside the scope, or put the rules that read it outside the scope block. Prefer the first: a rule whose subject and whose state are in the same tree is local, and cannot be broken by moving the stylesheet.

    *Why:* nothing reports it. The selector is valid, the cascade has no complaint, the attribute really is set, and the only symptom is a control that does nothing. It cost four rounds of "the tab still doesn't work" before the scope was even suspected, because every obvious thing — the script, the attribute, the layer order, the source order of the two rules — checked out.

    *Evidence:* the docs site's Text styles page shipped a Preview/Table toggle whose three rules sat in `@layer components`, inside `@scope (body) to (.dash)`, keyed on `:root[data-type-view]`. The script ran, the buttons took `aria-pressed`, the choice was remembered across reloads, and the view never changed. The sibling colour toggle worked only because its rules happen to live in a `@layer layout` block outside the scope — which is not a thing either file said. Fixed by moving the state onto the group being switched, so the selector became local and the question could not arise again; the same change collapsed three copies of one toggle into one component. **A checker could catch the narrow form** — a `:root` or `html` selector inside a `@scope` block whose root is not `:root` — and that is worth writing when a second instance appears, not before. **Needs a read** until then.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

## Accessibility

14. **A live swap keeps the reader's place.** When a script replaces a region's `innerHTML`, it first records the focused control by identity (id, or name + value + index for duplicated controls), swaps, then focuses the replacement without scrolling. The live region itself persists — its contents change, never the element.

    *Why:* a keyboard or screen-reader user who toggles a filter and lands on `body` has lost the page.

    *Evidence:* one project's filters dropped focus to `body` on every toggle — in the hero, inside the open modal, and on the switch — and every check was green. Reproduced with a headless browser, fixed with a focus-restore, verified the same way. **Mechanical** where a browser test exists; otherwise needs a read. *Checked:* `tools/parity/pages.mjs` "(code-standard 14)" structure, which toggles the first checkbox of a form on each page with a live region and asserts focus is back on it after the swap; it prints how many swaps it examined, and was seen to fail with one project's focus restore taken out.

15. **A description is not part of a name.** Secondary text beside a control — a count, a caption, a hint — is associated with `aria-describedby`, not placed inside the label.

    *Why:* "Design 354" is one phrase to a screen reader; "Design, 354" is a name and its description.

    *Evidence:* one project's facet checkboxes announced the count as part of the name on every option. **Mechanical** (no text node inside a label that is also a count). *Checked:* `tools/parity/pages.mjs` "(code-standard 15)" structure, which reads each checkbox's and radio's name as the browser computes it from its label. Its first run found the defect still live in the project the evidence comes from: the count sat inside the label beside an `aria-describedby`, so Chrome named the box "Design 95" and described it "95", while the component's own header said the name was "Design". `aria-hidden` on the count fixed it (2026-10-03).

16. **Native controls follow the theme.** A document that re-points its colour tokens for dark mode also declares `color-scheme: light dark`, so form controls, scrollbars and default link colours follow.

    *Why:* the token tier cannot reach the parts the browser paints.

    *Evidence:* one project's dark mode had white inputs with white text and 2:1 links on `#121212` — every token was right and every native control was wrong. **Mechanical** (the declaration is greppable; the contrast is measurable). *Checked:* `tools/css-lint/check.mjs` "gate('native controls follow the theme', 16", over every sheet as written, the generated tokens included.

17. **`hidden` must beat the stylesheet.** Any element that a script hides with the `hidden` attribute and that the stylesheet also gives a `display` value carries a `[hidden] { display: none }` rule in the same scope (or a layered global one).

    *Why:* author CSS overrides the attribute's user-agent `display: none`, so a `display: flex` box with `hidden` set is visible and `hidden === true` at the same time.

    *Evidence:* one project's collapsed description showed in full with its "Read more" button under it, because the block was a flex column. **Mechanical.** *Checked:* `tools/css-lint/check.mjs` "gate('hidden beats the sheet', 17" (each project's check calls it).

18. **Icon-only controls have names; decorative images have empty alt.** An icon-only button or link carries `aria-label`; the glyph is `aria-hidden`; logos and illustrations are `alt=""`. A component that takes an icon-only shape requires the label rather than defaulting it.

    *Why:* the glyph says nothing to a screen reader, and a defaulted empty label is a silent omission.

    *Evidence:* one project's icon button defaulted `aria-label` to the empty string; a review flagged it as plausible rather than confirmed because every caller happened to pass one. **Mechanical** (an `aria-label=""` is greppable). *Checked:* `tools/css-lint/check.mjs` "gate('icon controls are named', 18" (each project's check calls it).

19. **`Escape` and light dismiss are not given by `details`.** A disclosure built on `details` gets open state and exclusivity from the platform and nothing else; if it is used as a menu, the script adds click-outside and `Escape`, and the comment above it does not claim the platform gave them.

    *Why:* the claim was wrong in the one place it was made, and the comment is what the next reader believes.

    *Evidence:* one project's dropdown comment said `details` gives "escape"; it does not, and the audit reproduced it. **Mechanical** in a browser test. *Checked:* `tools/parity/pages.mjs` "stays open on Escape (code-standard 19)" structure, over every `details` whose content floats: Escape and a click outside must close it.

64. **A navigation marks where the reader is, with `aria-current`.** The link to the page being read is `aria-current="page"`; on a page that has no link of its own (a detail page under a listing), the link to its section is `aria-current="true"`. Every navigation that lists the item marks it — a header and a footer alike — and the selected look is styled off the attribute, never a class beside it.

    *Why:* the attribute is the only state a screen reader announces ("current page"), so a class carries the look to sighted readers alone; marking the section on a detail page keeps the reader's place where no link names the page itself (GOV.UK's service navigation separates *current* from *active* the same way, and MDN's guidance is one current item per set).

    *Evidence:* one project's bars marked the current item by a class in one bar and not the other, and marked nothing on a company page or a job post; the parity run, once it read `aria-current` as the selected state, found the frames marking it inconsistently too, and the ruling settled both (2026-10-03). **Mechanical** where the design marks a selected item. *Checked:* `tools/parity/schema.mjs` "attrs['aria-current'] !== 'false'", which reads `aria-current` (any value but `false`) or `aria-selected="true"` as selected.

## Progressive enhancement

20. **Every interaction has a working no-script path, and a render never writes.** Forms are real GET or POST forms with a `noscript` submit where the script removes the button; a modal opens from `popovertarget` before `showModal()` takes over; a disclosure shows everything when the script that collapses it is absent. Rendering a page may not write to storage — a read that lazily persists (a generated id, a cache) is a write.

    *Why:* the no-script path is also the crawler's path, the broken-CDN path and the test's path. A render that writes makes a crawler an editor.

    *Evidence:* one project's job page and feed wrote a generated uuid into the content file on first read; every crawler hit dirtied the tracked content. Found by a review, fixed by reading the page id instead, guarded by a check that renders a page and diffs the content tree. **Mechanical.** *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — the no-script path, driven with scripts off, and the render that writes, at the project's own check (in one project it asserts "a page render writes nothing").

21. **Modified clicks go to the browser.** Click interception lets `cmd`/`ctrl`/`shift`/`alt`/middle through unchanged.

    *Why:* open-in-new-tab is the user's, not the page's.

    *Evidence:* one project's row-click script handled this in four lines and a review later cut the script entirely in favour of a stretched link, which needs no handling at all — the simplest path won. **Mechanical.** *Checked:* `tools/css-lint/check.mjs` "gate('modified clicks go to the browser', 21", per click handler.

## Tokens and literals

22. **Every literal in component CSS is a token or carries its reason.** A number that is not a token reference says in a comment why the design has no value for it (a line-height the design tool keeps on the style, a maximum height the design never draws, a mobile step-down the design does not specify).

    *Why:* the comment is how a future token replaces the literal; an unexplained literal is indistinguishable from a mistake.

    *Evidence:* one project's parity run found four real mismatches on its first pass — a colour, a weight, a missing minimum size, a stroke not reserved in layout — all in places where a literal had stood in for a value the design had. **Mechanical** for "a literal without a comment on the same or previous line". *Checked:* `tools/css-lint/check.mjs` "gate('literal reason', 22"; `tools/css-lint/check.mjs` "gate('literal is a token', 22" (each project's check calls it): a literal carries its reason (brace and indented Sass), and a length the design binds to a token's family is the token.

23. **Generated files are regenerated, never edited; the check proves it.** Token files and compiled stylesheets are committed, and the check regenerates both beside the committed copies and diffs — never over them. It is how code keeps toolkit-standard §D 23 (what the source determines is generated).

    *Why:* a stale generated file ships silently, and a check that regenerates in place has already overwritten the evidence when it fails.

    *Evidence:* one project's freshness check regenerated into the tracked files and ignored the generator's exit code; a review found both, and an output-directory option fixed both. **Mechanical.** *Checked:* `tools/tokens/check.mjs` "say('code-standard rule 23'" and each project's `bin/tokens --check`.

51. **Tokens are built one way, by the toolkit's token build, in every project.** The design file's snapshot becomes DTCG token files (`figma-token-export`'s converter), stored in `dtcg/` beside the snapshot as the tokens' format-standard contract and gated like any generated file (rule 23), and Style Dictionary turns them into the stylesheets (`frontend-build`'s build, the house conventions in one place), run through `tools/tokens/build.mjs`. A repo's `bin/tokens` calls that and nothing else; no repo keeps a generator of its own.

    *Why:* two generators are two conventions, and the second one is invisible from inside the first project. Every difference between them is a place where a component moved between projects silently changes.

    *Evidence:* two projects' generators had drifted into two dialects of the same job — one wrote dark on `:root` and px type, the other light on `:root`, rem type and `font` shorthands — and a third generator sat in a skill for projects with neither. Merged on 2026-09-19; both projects' tokens compared equal in a browser in every theme state and at two widths, save the changes rules 52–54 make on purpose. **Mechanical** (`tools/tokens/check.mjs`: `bin/tokens` must call the build). *Checked:* `tools/tokens/check.mjs` "say('code-standard rule 51'", run by each project's check.

52. **A token is named by its Figma variable path, and two paths never share a name.** Kebab-case, no prefix, without the collection: `Colour/Text/Neutral/strong` is `--colour-text-neutral-strong`. A leading minus is spelled `minus-` (`Effect/Position/-1` is `--effect-position-minus-1`), so `-1` and `1` cannot land on one property. Two paths that would share a name fail the build rather than letting one win.

    *Why:* a name the designer can search for in the variable picker is the only name both sides can talk about; a prefix or a renaming layer is a second vocabulary someone has to keep true. A stripped sign is a silent collision waiting for its sibling.

    *Evidence:* one project's generator named `Position/-1` as `--effect-position-1`, one `Position/1` away from overwriting it; the other project's already spelled the sign out after exactly that near miss. **Mechanical** (the build refuses a collision). *Checked:* `tools/tokens/build-tokens.mjs` "in one block: rename one in Figma" — the token build (`tools/tokens/build.mjs` calls it), which refuses a collision.

53. **Themes and modes follow one pattern, and tiers stay references.** A Light/Dark collection writes Light on `:root`, and Dark under `[data-theme="dark"]` and under `prefers-color-scheme: dark` when no theme is chosen. A Mobile/Tablet/Desktop collection writes Mobile on `:root` and the others from the `sm`/`md` breakpoint. Any other mode is `[data-<collection>="<mode>"]`. A semantic token that aliases a primitive is written as `var(--that-primitive)` (Style Dictionary's `outputReferences`), so a mode re-points one tier.

    *Why:* a visitor who has chosen nothing gets their system's scheme, an explicit choice always beats the system, and no component style ever mentions a theme. Resolved values would make every mode restate every tier.

    *Evidence:* the two projects reached the same behaviour by opposite routes (dark-first with a light override, light-first with a dark mixin); in every state a browser can be in, the two resolve identically, so one route was kept. **Mechanical** (the build writes it; the check proves the files are the build's). *Checked:* `tools/tokens/check.mjs` "say('code-standard rule 23'" (the files are the build's, and `tools/tokens/build-tokens.mjs` "prefers-color-scheme: " writes them).

54. **Units, type and breakpoints are written one way.** Lengths are rem, so they follow the reader's font size, except the ones that must not scale: radii, strokes, blur and shadow offsets stay px. A font family carries the system fallback stack. A text style is its fields (`--body-md-regular-font-size`, `-font-family`, `-font-weight`, `-line-height`, `-letter-spacing`, `-paragraph-spacing`, `-list-spacing`), every field written even at zero, and applied whole with `@include text-style(name)`, never as a `font` shorthand. Breakpoints are Sass variables (`$sm` … `$xl`, rem) with `@mixin from($bp)`, never custom properties.

    *Why:* the `font` shorthand cannot carry letter-spacing; a field left out when it is zero makes every `var()` that reads it drop its whole declaration; a media query cannot read `var()`.

    *Evidence:* one project's generator skipped letter-spacing at zero until nine components read it and got nothing; the other applied type through `font` shorthands, which carried no letter-spacing at all. **Mechanical** (the build writes it; `tools/tokens/check.mjs` fails a `var()` or a `text-style()` that names nothing). *Checked:* `tools/tokens/check.mjs` "is read with no fallback and nothing defines it"; `tools/tokens/check.mjs` "(text-style)".

55. **A project states where its files live and what it builds from a snapshot, and nothing about how CSS is written.** `snapshot.config.json` holds the toolkit's location, the project's name, `paths`, the `after` steps the toolkit runs once a snapshot is written, `figmaToken` (a command that prints one), and `parity`, the parity engine's facts about this project — how its pages are hosted, its tiers and windows, its tolerances (per assertion kind, never written into a comparator) and the rest, each key listed once in `tools/parity/README.md` (*What a project supplies*), and `styles`, where the stylesheet gates find its sheets and how its components are named, each key listed once in `tools/css-lint/check.mjs`'s header, and `screens`, the states its frame names add to snapshot-standard rule 24's list; a CSS convention, a base mode, a unit or a prefix per project has nowhere to go.

    *Why:* a setting that exists gets used, and a used setting is a project dialect — which is how the two generators diverged in the first place.

    *Evidence:* one project's generator took a base mode and number formats from its own config file; the merge removed the file and the option together. **Mechanical** for the file's keys and `paths`'s (`tools/tokens/check.mjs` fails an unknown one); it does not look inside `parity`, whose keys the parity engine reads. *Checked:* `tools/tokens/check.mjs` "which is not a location the toolkit knows"; `tools/parity/project.mjs` `checkFacts` — the file's keys, then the `parity` block.

59. **A job the toolkit owns is called, never written again in a project.** This is toolkit-standard §D 2 (nothing shared stays buried in a project) applied to a project's code; the rule, its reason and its evidence live there, and this handle is where its check lives.

    *Why:* toolkit-standard §D 2.

    *Evidence:* toolkit-standard §D 2, and the two-repo audit it records.

    **Mechanical** (`tools/toolkit-check/owned-check.mjs`, run by each repo's own check, over `tools/toolkit-check/owned.json`): a file the toolkit owns, or a repo defining a name only a re-implementation has, fails and names what to call instead. A wrapper over a shared part — a project's tolerance, its paths — is a use, not a finding. *Checked:* `tools/toolkit-check/owned-check.mjs` "a job the toolkit owns is written again in this repo", run by every repo's check.

## Design-to-code

24. **Numbers come from the design file, through a script, into a spec the check reads.** Sizes, padding, gaps, strokes with their alignment, fills as token names, text styles, effects — exported per component variant and per screen frame by a script, compared with computed styles in a headless render, with a waiver carrying a reason for every known difference. A number typed from a screenshot is what this replaces (toolkit-standard §D 23).

    *Why:* eyeballing produced confidently wrong work; measured-against-measured caught what no screenshot showed (a card laying out as a column while every part measured right).

    *Evidence:* one project's first measured run found 57 colour mismatches that were all one cause — the headless browser had rendered in the desktop's dark theme — and the runner learned to compare against whichever theme it rendered, which made it a dark-mode check for free. **Mechanical.** *Checked:* `tools/parity/adapt.mjs` `assertionsFor` (the adapter reads the spec the snapshot wrote).

63. **A Figma stroke becomes the CSS that takes the same room.** Alignment and whether the stroke is included in layout decide the channel, not the look:

    | Figma stroke | CSS |
    |---|---|
    | Inside, in layout | `border`, per side — it takes room from the box |
    | Inside, not in layout | an inset ring drawn over the content: `box-shadow: inset 0 0 0 N` (or `outline` with a negative offset); one offset inset layer per side for a single edge |
    | Outside | a ring outside the box, taking no room: `outline` or `box-shadow: 0 0 0 N`; an offset outer shadow per side for a single edge |
    | Center | a ring straddling the edge: `outline` offset by minus half its width |

    A line (a vector with no extent on one axis) has no inside: a border on its leading edge.

    *Why:* only the first row takes layout room in Figma, so a `border` anywhere else moves every box after it by the stroke's width, and the build is a pixel off where the design is exact. Written once because each project rewrote it: the single-edge outer shadow ("hairline") was written in both projects within seconds of each other.

    *Evidence:* the parity engine's adapter encodes this table (`tools/parity/adapt.mjs`, strokes) and a review checked it against both projects' stored specs: outside and centre strokes took no layout room whatever the flag on 208 real nodes, inside-in-layout drew as a border on 217, inside-not-in-layout as a ring on 1,521. **Mechanical** (parity's stroke rows). *Checked:* `tools/parity/adapt.mjs` "const align = isLine ? 'INSIDE' : node.strokeAlign" (stroke rows).

25. **Position comes from absolute bounding boxes, never from a rotated node's x/y.** A rotated layer's `x`/`y` in the design tool's API are not its visual corner; the absolute bounding box is.

    *Why:* a 180° rotation swaps which corner the coordinates describe, and the two readings differ by the node's full size.

    *Evidence:* one project placed a rotated render from `x`/`y`, then measured bounding boxes for all three renders and found the rotated one off by its width; the unrotated ones confirmed the code already in place. **Mechanical.** *Checked:* `tools/parity/adapt.mjs` "add('rotation', 'rotate'" — over the snapshot plugin's `absoluteBoundingBox` record.

26. **Transparent artwork comes from the raw source, never the node export.** A design tool's render of a node with an image fill returns the visible crop, flattened; the original upload keeps its alpha. Reproduce the crop in CSS (`object-fit`, offsets) instead.

    *Why:* the export *looks* right in a viewer with a white background and ships with a white box.

    *Evidence:* one project shipped two hero renders with baked backgrounds, then a third graphic the same way a week later despite a memory note — the second time the alpha check was added to the conversion step. **Mechanical** (`cwebp` reports `Alpha: 0`). *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the project's own check, which in one project runs a project's `bin/graphics --check`.

31. **Parity compares what a frame holds, not only how it measures.** For every mapped layer, the design-system instances inside it — outermost only, in order, with any label text that is not the design tool's placeholder — are compared with the component elements the code renders there. Geometry, fills and text styles are checked on the layers a story maps; this check is what notices a child that was added, dropped or renamed.

    *Why:* a frame's measurements are identical whether it holds the right children or last month's. The designer sees the difference at a glance; a check that cannot is one the designer stops trusting.

    *Evidence:* one project's library dropped three links from its navigation bar and added a theme toggle; the bar's story kept the old links, every measured property matched, and the check stayed green until the designer pointed at the screen. The same check, once added, found two more drifts on its first run (a footer missing its secondary links, a graphic in the backlog passing as present). Components only: a screen's lists are as long as its content. **Mechanical.** *Checked:* `tools/parity/gates.mjs` `copyMissing`; `tools/parity/gates.mjs` `-children`.

32. **A release gate fails on being behind a release, never on edits since one.** A snapshot is refused when the design file has a newer publish or named version than the one it was taken at. Edits made after the release and before the snapshot are *noted*, not failed: the design tool's last-modified moves on a canvas nudge, a page rename or a plugin's own storage write, none of which can be published, so a gate on it can never be cleared.

    *Why:* a red that the designer cannot clear by any action available to them is a red that gets bypassed (`--no-verify`), and a bypassed check protects nothing.

    *Evidence:* one project refused snapshots "taken after unreleased edits"; the designer published, nudged a frame, snapshotted, and the check stayed red with Figma offering nothing to publish. Pushes went through with the hook disabled until the rule was demoted to a note. **Mechanical.** *Checked:* `tools/snapshot/deliver.cjs` "--pinned".

33. **Parity proves the set, not the sample — and a value it cannot name is a finding, not a skip.** Every variant the design file declares for a built component is measured by some story or waived by name with a reason; a story lists what it measures, and nothing else may be read as covered. A spec value the comparison cannot resolve (a colour that is not a token, a text style or effect marked literal) is reported, never silently passed over.

    *Why:* a check is trusted for what people assume it covers. Two silences hide behind a green run: variants nobody listed, and comparisons that returned early because a value had no name. Both read as "matches".

    *Evidence:* one project's navigation bar had five variants in the library and a story that listed two; the three it did not list were the ones inner and scrolled pages render, and they went unmeasured for a day of otherwise green checks. The same run showed the comparison skipped any fill it could not map to a token, so a hex typed into the design file would have passed. Both became coverage failures with story-level waivers; the first fired on two components at once. **Mechanical.** *Checked:* `tools/parity/gates.mjs` `layerCoverage` (gates 8 and 13) and `unresolved` rows (`tools/parity/adapt.mjs` "kind: 'unresolved'").

34. **Parity measures what a frame says, not only what it draws.** For every mapped layer the comparison also reads: where the layer sits in its parent on the axis the parent's layout does not already decide (alignment in a stack or a row); for an instance, its variant props as the element's attributes (`Scroll=End` is `scroll="end"`, `Home=True` is the `home` attribute, a checked control is `Selected`); and the design's copy where a story or map names the layer. A page is measured in the state its frame declares — a full-page comp is the page at its end — with the page's own scripts reacting, never with them disabled.

    *Why:* geometry, fills and text styles are what a size-and-colour comparison sees; alignment, state and words are what a reader sees first. A menu packed to the wrong side, a bar in the wrong scroll state and a wrong title all measured green for a day, because every box was the right size in the right colour. What a frame *says* — through an instance's props and a layer's position — is as much the spec as what it draws, and a check that reads only half of it reports the half that matters less.

    *Evidence:* one project's designer corrected, by eye and in one evening, a footer menu centred where the design packs it right, a floating bar that never left its end state, an empty state with invented copy and a wrong graphic, and an error line centred under a button the design left-aligns. Each was a variant prop, a position or a text the snapshot already carried and the comparison never read; reading them turned all four into red rows the same night, and a fifth (the toggle's first button drawn selected) the check found on its own. **Mechanical.** *Checked:* `tools/parity/adapt.mjs` "add('text', '-text'"; `tools/parity/adapt.mjs` `-text`; `tools/parity/adapt.mjs` `-attr`; `tools/parity/adapt.mjs` `-swap`.

35. **A check pins the environment it reads; it never inherits it.** Anything the host decides for a headless run — the colour scheme, the locale, the time zone, the viewport, the fonts installed — is stated by the check and asserted after the render, so the same commit gives the same answer on any machine. Where the thing being checked has more than one such state and all of them ship, the check runs each one; measuring the state the machine happens to be in proves half the set and reads as proof of all of it.

    *Why:* an inherited environment turns one check into two different checks that share a name. The answer moves with the developer's OS setting rather than with the code, so a regression is red for one person and green for another on the same commit, neither can reproduce the other, and the tier nobody's machine is in is never measured at all. Pinning also costs nothing to state: the failure is always a default someone forgot was a choice.

    *Evidence:* one project's design-to-code check read `prefers-color-scheme` from headless Chrome, which takes it from the machine. The maintainer's Mac was in dark mode, so every green run had measured the dark tier only, and the light tier — half of a two-tier semantic token set, both shipped — had never been measured since the check was written. Stamping the theme on the rendered page and running both tiers found the omission immediately; the second tier was paid for by measuring twice inside one page instead of loading the page twice, which had been the cost of proving a measurement repeats. **Mechanical.** *Checked:* `tools/shared/cdp.mjs` "Emulation.setTimezoneOverride"; `tools/parity/pages.mjs` "did not render in the" — the toolkit's browser checks pin it for every project: the pool sets the time zone (UTC) and the locale (the project's own language) on every window, and the page gates set the colour scheme to the project's drawn tier and assert it after the render (`test-cdp`, `test-pages`).

36. **One enhancement, one implementation — an inline copy per template is a fork.** Markup belongs in the template; the script that enhances it does not. Where two pages enhance the same way (fetch, swap a live region, update the address, intercept the links inside it), that behaviour is written once and included, with the page passing what differs. A `<script>` block written into a second template is a fork of the first, and it is a fork nobody sees, because the two copies are never open at the same time.

    *Why:* the copies do not drift evenly. The one that gets a second reading gains the fix and the comment explaining it, and the other keeps the original behaviour with nothing to say it is now wrong. Nothing fails: both pages work, both are reviewed, and the difference is only visible to someone diffing two templates nobody diffs.

    *Evidence:* one project enhanced two list pages the same way, each with its own inline script. The second gained `history.replaceState` and a comment arguing it — a refinement should not make Back replay keystrokes — while the first kept `pushState`, so on the busier page every filter change still pushed an entry and Back replayed them one at a time. The reasoning had been written down; it just lived in the copy that did not need it. **Mechanical** (grep the templates for `<script>`). *Checked:* `tools/css-lint/check.mjs` "gate('one enhancement, one implementation', 36", by inline script body across the templates.

37. **A parity check measures everything or names what it does not — and gates on it.** Coverage — the layers a screen composes, the elements a component renders — is total, with the check failing on any gap by name. The denominator is honest before the gate is strict: a nested library instance is one layer of the screen that places it, its insides the instance's own check to measure; an element is credited when the layer that measures it already covers it (an exact shared box, a child recorded by a children comparison); what the design never draws (vector innards, accessibility-only elements, boxless wrappers, a caller's slot content) is not counted. A coverage number reported but not gated decays into background noise.

    *Why:* a check that compares only what someone remembered to map is strongest where nothing changes and blindest the day a new design lands — the moment it exists for. Every unmapped layer reads as agreement, so the green run makes a claim ("0 differ") that the reader hears as "the page matches" while it means "the mapped fifth matches".

    *Evidence:* one project ran its screen check at 22% coverage for days; three hero renders shipped misplaced — one a full image-width left and a bar-height low — each found the day its layer was finally mapped, and the first newly mapped layer found two shipping bugs within the hour. The designer had already said what that costs: every drift they point at by hand is trust the check loses. Raising both sets to 100% took one night; the credits and exclusions above are what made 100% mean something rather than forcing junk mappings. **Mechanical.** *Checked:* `tools/parity/gates.mjs` `DOM_COVERAGE` and the backlog gate.

40. **A style whose effect is "off" must compute to off.** `outline: none` leaves the outline's *width* at the browser's default, so anything reading computed styles still reads a ring on a focused element; `outline: 0` is what collapses it. The same holds for any property a check reads: suppressing the paint is not suppressing the value.

    *Why:* a measurement that depends on whether the element happened to be focused when the shot was taken flaps between runs, and a flapping measurement is indistinguishable from a real regression until someone spends an hour on it.

    *Evidence:* one project's modal heading measured a 3px outline on some runs and none on others; six full suite runs went by before anyone read `getComputedStyle` on the live element, which showed `outline-style: none` and `outline-width: 3px` in the same declaration. **Mechanical.** *Checked:* `tools/css-lint/check.mjs` "gate('outline: none', 40" (each project's check calls it).

41. **An exemption names a reason from a closed list, and a declared rule is proved to run.** Where a check keeps a table of what it covers, an entry either names the rule that reads the thing or names why nothing can — and the why comes from a fixed set of reasons, never free text. Then prove the other half mechanically: for each declared rule, remove the thing it reads from each input that carries it and re-run; if nothing the check asserts ever moves, the rule is prose beside code that ignores it. A rule that is deliberately dormant — written for a case the inputs do not contain yet — declares itself so, and owes a fixture that fires it.

    *Why:* a gate that accepts a sentence accepts any sentence, and the sentence people write is "not yet". It reads like a plan and works like a permanent exemption, in the one table that exists to stop something being silently unchecked. The closed list has nowhere to put later, so the choice becomes write the rule or say the thing cannot be measured — both of which are decisions, made on the day.

    *Evidence:* one project's parity table carried `align` and `layout` — the design tool's own auto-layout direction and alignment, present in every spec from the first snapshot — under the excuse "not yet translated", while the skill governing that loop had already named the phrase as a debt with a due date. It survived a full code review. The designer found it by eye: a page header the file draws as a centred column, built as a row, correct at the canvas width and hard against the left edge on a real screen. Writing the two rules took an afternoon; the same afternoon's "remove it and see if anything moves" gate caught a third rule that was declared and inert. **Mechanical.** *Checked:* `tools/parity/spec-keys.mjs` `checkContract` (gate 10) and `tools/parity/waivers.mjs` `checkWaiver`.


42. **No declaration exists to make a check agree.** A value written so a measurement matches — a height set to the design's number, a property restated because the check could not read the inherited one — has stopped describing the product and started describing the check. When the two cannot both be satisfied, the code renders correctly and the difference is recorded with its reason; it is never closed by arithmetic that puts the right pixels on screen while the code says something untrue.

    *Why:* the check exists to report the difference between the design and the product. A line written to satisfy it removes the report without removing the difference, and the difference then surfaces where nobody is measuring — in this case on screen, months later, to the designer.

    *Evidence:* one project's five text controls each carried `block-size: calc(font-size × line-height)`, written so the measured box would equal the design's 16px text box. Every one of them cut the descenders and the @ off its value, because a text control clips to its box and the font's glyphs are 20px; the design tool paints them outside the box and clips nothing. It survived a full build, a deep code review and 37,742 matching assertions, and was found by eye. The two attempted fixes that followed were the same mistake twice more — a line height changed to suit the renderer, then padding and a negative margin to fake the design's number — before the honest version: the control is as tall as its own text, the frame is 2px taller than drawn, and the file's own arithmetic is put to the designer. **Mechanical** where a check can compare a declaration with the design's own value; otherwise a review question. *Checked:* `tools/css-lint/check.mjs` "gate('no declaration made to agree with a check', 42", in the narrow form: a height computed as the text's size times its line height. Replayed on the evidence's commit, it names all five controls.


43. **A boundary that serialises props takes values, never functions.** Where a framework splits rendering across a boundary — server and client, worker and page, a process sending props as data — a callback cannot cross it. A label that depends on a number is a **template with a placeholder** the receiving side substitutes; a per-item link is a **field on the item**; anything that needs a hook the receiving side owns lives in a small wrapper on that side, not in the shared component. The shared component takes neither, so it renders the same in an application and in a story.

    *Why:* the failure is a 500, not a warning, and it lands on the page rather than at the build. Worse, the surface that would have caught it renders the shared component alone — where the boundary does not exist — so a green design-parity run and a green type check both pass over it.

    *Evidence:* one project's contacts page served an error for a day behind 74,000 green assertions, because the route handed the list two callbacks — a count label and a per-card link. The same mistake then appeared four more times in one afternoon's wiring (`selectedLabel(n)`, `committedLabel(percent)`, `dialogSend(n)`, `roleN(n)`), each on a different page, each found by loading it. A router hook moved into a shared component instead of a wrapper broke every story that rendered it, which is the same rule from the other side. **Mechanical** (grep the routes for a function-valued prop on a client component). *Checked:* `tools/css-lint/check.mjs` "gate('a function never crosses to the client', 43": in a module with no client directive, an inline function handed as a prop to a component imported from a client module (imports resolved through the project's `tsconfig.json` paths).

44. **Two rules of equal specificity that disagree are decided by load order, which is not a decision anybody made.** Where two stylesheets both style the same element with the same specificity — a component's own width and its container's rule for what it holds — the winner is whichever file the page happened to load second, and that differs between the application and the component workbench. State the value once, or state it in both places with the same answer.

    *Why:* it presents as a component that is correct in isolation and wrong in the product, or the reverse, with no rule to point at in either.

    *Evidence:* one project's side panel set its drawer's width and the drawer set its own, both at one class of specificity. The workbench loaded them one way round and the application the other, so the drawer was 472 wide in every measurement and covered the whole window on the page. **Needs a read**, though a lint can list selectors that set the same property on the same class from two files.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

45. **A scripted edit that does not match must fail, not pass quietly.** Where code is changed by a script — a search-and-replace, a codemod, a patch applied from a generated diff — an edit whose target is not found is an edit that did not happen. Assert the match before writing, and stop on the first miss. The same holds for the human form: an edit made and never re-read is an edit whose success was assumed.

    *Why:* the failure is silent by construction. The script reports success, the file is written, the diff is empty for that hunk, and the change is missing only in the running product. Nothing downstream can distinguish "already correct" from "never applied".

    *Evidence:* one project shipped two live defects from this in a single day. A stylesheet was changed to stack a carousel's pictures and fade between them while the component that renders them was not, so every picture was transparent and the band showed nothing; and a route's list of contact rows lost the icons, the buttons and the shortened address a component had grown props for, because the block those props were meant to join had been reformatted since the pattern was written. Both were found by opening the page, not by reading the diff — and both scripts had reported success. No project carries an edit script to inspect (both registered projects read, 2026-10-03); the edits come from a session, whose edit tool refuses an old text that is absent. *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — `CLAUDE.md`'s bulk-edit rule — read the hits, never count them.

46. **A dimension a screen takes from the design lives in one place.** The page grid — the maximum width the content is capped at, the gutter either side, the element that centres it — is stated once, as a property or a component, never re-typed per screen. Where the design tool publishes it as a token, bind to the token; where it states it only by drawing it, name it in the project's own base layer with a comment saying so.

    *Why:* a number typed in ten stylesheets is ten edits and nine chances to miss one, and the miss is a band that lines up with nothing on a page nobody opened.

    *Evidence:* one project had the same 1480 in ten screen stylesheets and four component ones, with four different vertical paddings between them; the parity run was green throughout, because every copy agreed with the design at the moment it was written. It is one Container element and one `--page-width` property now, and the check that proved the change safe was the same 72,968 assertions before and after. **Mechanical** (grep the same length literal across stylesheets). *Checked:* `tools/css-lint/check.mjs` "gate('a layout container is a component', 11" (each project's check calls it): the page width restated outside the container component; and `tools/css-lint/check.mjs` "gate('literal is a token', 22": a literal where the design binds a token.

47. **A client boundary is a cost, and a component pays it only for its own behaviour.** In a framework that splits rendering, the directive that moves a module to the client belongs on the component that holds state, runs an effect, or reaches for a browser API — not on a leaf that merely forwards a handler its caller supplies. A caller that needs the client makes its own subtree client; the leaf does not have to.

    *Why:* the boundary is not local. It puts the module and its imports in the browser bundle, and — the part that bites — it makes every prop crossing into it serialisable, which is invisible until a server route passes a function (rule 43) and the page 500s.

    *Evidence:* one project marked twenty-six of its forty-five components as client, of which twenty-six had no state, no effect and no handler of their own; the same project then hit rule 43's failure five times in one afternoon, on components that never needed the boundary at all. **Mechanical** (a file with the directive and no hook, no browser global and no handler of its own). *Checked:* `tools/css-lint/check.mjs` "gate('a client boundary pays for its own behaviour', 47", over every file under the directive. Its first run here found three screens marked client that defined no handler, hook or browser access, each imported only from a client module; the directive came off all three (2026-10-03).

48. **The browser defaults a design system overrides are stated once, in its base layer, scoped to what it draws.** A component that renders an element the CALLER passes — a link in a slot, a control handed to a wrapper — does not govern that element's user-agent chrome, and the design says nothing about it either. So the system states what it assumes about those elements once, and scopes the statement to its own surfaces so ordinary prose keeps what the browser gives it.

    *Why:* fixed per component, the same defect returns on the next component that takes a slot, and it is invisible to a design-to-code comparison every time: the layer a mapping names is the wrapper, whose colour and type are correct, and the element inside it is not mapped and does not have to be for the page to look wrong.

    *Evidence:* one project shipped a blue underlined link inside four different components before anyone connected them — a tab bar, a card's name, a contact row's button, a page header's back link — each fixed alone, each with a green run of tens of thousands of assertions over it. One rule in the base layer replaced four copies. Scoping matters as much as the rule: the first version was unscoped and silently took the affordance off every link in the product's prose pages, where a link identified by neither colour nor underline is identified by nothing. **Mechanical** (grep the components for a rule that only resets an anchor). *Checked:* `tools/css-lint/check.mjs` "gate('anchor reset', 48" (each project's check calls it).

49. **A check's verdict is its own, and nothing between it and the reader may replace it.** A gate says what it found in its output and in its exit status, and how it is invoked must not overwrite either. A run piped into a pager exits with the pager's status, not the check's, so a red run reports success to the shell, to CI and to any wrapper that reads only the code; a runner that reports a job "completed, exit 0" is repeating what the pipeline told it. Invoke a gate so its own status is the one that propagates — unpiped, redirected to a file, or under the shell's pipeline-failure option — and read the verdict the check printed before believing a summary of it.

    *Why:* every downstream reader decides on one bit, and that bit is the easiest thing in the system to overwrite by accident. The failure is silent in the worst direction: it converts a check that is working into a check that agrees with you.

    *Evidence:* one project's design gate named every unmeasured layer of a screen and ended RED; run piped into `tail` it reported exit 0, was read as green, and the wrong-coloured screen it had described shipped. The same invocation, backgrounded, then produced a completion notice reading "exit code 0" over the same RED output, and the same screen was called done a second time. **Mechanical** (a check's own test asserts the status it returns; a wrapper runs under `set -o pipefail`). *Checked:* `tools/project-check/check.mjs` "rule: 'code-standard 49'" (the `verdicts` gate), over a project's `bin/` and `.githooks/`: a check piped on, in a script with no `pipefail` that does not read `PIPESTATUS`.


65. **A Figma linear gradient translates only at the angle that scales.** A gradient whose handles run corner to corner is CSS `linear-gradient(to bottom right, …)` (or another corner keyword), and one along an axis is `to bottom`, `to right`; both match the design at every size. Handles at any other angle have no CSS equal: Figma places them relative to the box, so the drawn angle changes with the box's proportions, while a CSS angle in degrees does not. Translate the nearest corner or axis, and record the frame as the design's to fix (`fix: 'figma'`); never a degree, which is the corner on one proportion only (`135deg` is the diagonal of a square).

    *Why:* a degree matches the design at one proportion and drifts at every other, the kind of number rule 57 rejects; the corner and axis keywords are the two shapes both tools define the same way.

    *Evidence:* two projects drew gradients with free handles — a profile card in one, a newsletter block and a header in the other — and each first shipped `135deg`, which is the diagonal only on a square box, and the parity run reported every non-square frame off; each now ships `to bottom right`, with the frames waived as the design's (2026-10-03). **Mechanical** in a parity run, which compares the stops' geometry. *Checked:* `tools/parity/adapt.mjs` "gradient recorded without its transform".

## Cleanliness and simplicity

27. **Comments state constraints, never narration.** A comment earns its line by naming what would break without the code: a regex that must not match a neighbour, an ordering that matters, a number the design lacks. Restating the code is deleted; the reasoning behind a decision goes in the commit message or the project notes.

    *Why:* a file that is a third comments is longer to scan than what it explains, and the real constraints drown.

    *Evidence:* one project's components arrived with multi-paragraph headers on every file; the maintainer asked for them gone the same day, and the rule in the project's instructions had been over-applied to obvious code. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

28. **Write the one rule the feature is; let real need pull in the edge cases.** An enhancement script handles the case it exists for and falls back to the browser for the rest. Middle-click handling, a `window.open` branch, a history comment — cut unless something asked for them.

    *Why:* unasked-for cases are where bugs live, and progressive enhancement already has a fallback: the browser.

    *Evidence:* one project's row-click script went from ~50 lines to 22 on a maintainer's review and lost nothing wanted, then to zero when a stretched link did the job. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

29. **Logic that reads content lives in the model, not the template.** Truncation, excerpting, grouping and classification are methods on the page model with fixtures; the template calls them.

    *Why:* a template cannot be unit-tested and the same logic is needed on the next template.

    *Evidence:* one project's one-sentence excerpt went into a model method with three fixtures, one of which immediately caught a comment claiming abbreviation handling the regex did not have. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

30. **A check that fires on nothing is a finding about the check.** A smoke test that extracts a URL and gets an empty string has tested the home page three times under three names. Every check asserts that its input was found before asserting anything about it.

    *Why:* a green check over nothing reads as coverage.

    *Evidence:* one project's job-page smoke, icon count and write-guard all ran against `/` for a day because an entity-escaped `href` defeated the grep that found the job URL. A review found it; the check now says when it finds no job link. *Checked:* `tools/project-check/check.mjs` "RED — not run:" — for the toolkit's gates (a gate whose input a project does not supply is RED, never ok) and the page gates (a content-driven page that is not found, or a page that does not report, fails, and the live-swap count is printed). A project's own steps are read at review, by §D 0's fourth question.

57. **A fix holds for any value its input can take.** A size, gap, inset or limit that exists because of the content is computed from that content (or read from a token), never typed as the number that happens to fit what is on screen today. Before a fix ships, name the input that would break it: a larger value, another project's data, one more item. If one exists, the fix is a patch over the symptom; find the quantity the problem depends on and derive from it.

    *Why:* a number fitted to today's content passes every check today and fails silently the first time the content changes, far from the change that exposed it and with nothing in the code saying why the number was chosen.

    *Evidence:* a docs page clipped the left edge of shadow previews at its table's scrolling edge. The first fix inset every preview by 12px, which fitted the shadows then in the file and would clip any shadow with a larger blur or spread. The maintainer rejected it as a hack; the fix that shipped computes each preview's clearance from its own layers' offset, blur and spread, and was checked against every effect style in four projects. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

58. **A write replaces only what it wrote.** A script that regenerates files into a folder removes the files it owns, known by a manifest or by the shape it writes, and nothing beside them: a README, a generated folder another step makes, another writer's output. Being the last to write a folder is not owning what is in it. Where several writers share one folder, record which wrote what and prune only the writer's own.

    *Why:* a whole-folder replace deletes what the writer never made, and nothing announces it: the new folder is well-formed and every check passes, so the loss is seen only by someone who remembers the file.

    *Evidence:* two in one day. A token export replaced its output folder whole, which would have deleted a project's README and its generated TypeScript on the first refresh from the snapshot; it now removes only its manifest and collection folders, and a test puts a README and `dist/` beside the output and asserts both survive. A snapshot store pruned every icon the posting file did not send, so a second library's snapshot erased the first library's icons; it now records which file wrote which asset and prunes only the poster's, and its test posts two files and asserts neither erases the other. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

61. **A failure that knows why it failed reports why.** `catch (e) { x = null }` throws away the one thing the reader needs. Where a layer below already distinguishes its failures — a code on the error, a named status — carry that distinction to the surface: count the kinds apart, head the message with the one that happened, and say what the reader can do about it. A message that covers several causes has to be vague enough to fit the worst of them, which makes it useless for all of them. The rule carries distinctions that already exist upward; it does not ask for new error kinds.

    *Why:* the reader's next action differs per cause. "Open the library in Figma" and "this clears on the next audit" and "the check has no runner here" are three different days' work behind one sentence, and a generic message sends the reader to debug the wrong one.

    *Evidence:* an audit dashboard's Verify said "could not be re-checked and were left untouched" for a closed Figma plugin, a script Figma refused, a row whose target is the file rather than a component, and a check with no runner. The bridge already threw a `no_plugin` code separating the first; both call sites discarded it in a bare catch. The maintainer hit it twice in one session — once asking why a row would not clear, once saying the message should differ when the bridge is shut. Fixed by counting the kinds apart and naming each in the toast. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

56. **A design-parity loop grades its harness, not the product.** The run renders stories, and a story's fixture is written to match the design — so the loop compares the design to a copy of itself and the page a person opens is never in the room. Anything the route does differently, a copy template it builds, a prop it computes, the data it really holds, cannot fail any gate. Before calling a screen finished, open the ROUTE, signed in, at the frame's width, and compare it against the snapshot — not against a story and not against an exported image, which is a backup of the source and not the source.

    *Why:* every parity loop has this hole and none of them announces it. A gate that grades the harness will agree with itself for ever.

    *Evidence:* one project ran 95,452 green assertions over a pool page whose heading read "Contacts (148)" where the design says "121 contacts": the story passed the design's own wording, the route built its own from a translation key, and nothing in three gates could see the difference. **Needs a read.**

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the independent review of the change that touches it (the closing pass, `bin/closing`).

## Verifying

Each rule's marker names what checks it: mostly the toolkit's gates in `tools/css-lint`, `tools/tokens` and `tools/parity`, run for every project by `tools/project-check/check.mjs`, and otherwise a project's own check or a review. `standards/tests/cases.md` (prefix `C`) asserts this file's own form.
