# Accessibility in code

What code adds to an accessible design: ARIA where HTML has nothing, accessible names and descriptions, visible focus, where focus goes when the page changes, keyboard models for composite widgets, menus, toolbars, tooltips, data grids and selection controls past the native set, live regions, hiding content correctly, reduced motion and colour scheme, keyboard access and shortcuts, and testing with a keyboard and a screen reader. An accessibility pass at the end finds what a decision while writing the markup would have prevented, so each topic here is meant to be applied as the code is written. The target is WCAG 2.2 AA, stated once in the project's context document. It serves code-standard rules 2, 14–19, 21, 40 and 64, and design-standard's principles *for everyone, in any context* and *people in control, mistakes forgiven*. Choosing the element, landmarks, headings and forms markup is [html-semantics.md](html-semantics.md)'s, and most accessibility is decided there. The design half (focus order and focus visibility as design decisions, contrast, zoom and reflow, target size, motion, error recovery) is [ui/design/accessibility.md](../ui/design/accessibility.md), not repeated here; zoom and reflow in CSS are [responsive.md](responsive.md#zoom-and-reflow); test tooling is [testing.md](testing.md).

## ARIA: the first rule, and when it is needed

**What good looks like**
- A native element or attribute does the job wherever one exists; ARIA appears where HTML has no element for the behaviour.
- Every ARIA role ships with the keyboard behaviour it promises.
- No ARIA restates what the element already says (`role="button"` on a `button`, `role="list"` on a `ul` except to undo a lost semantic).

**How**
- **The rules**, from W3C *Using ARIA* ([Using ARIA](https://www.w3.org/TR/using-aria/)): first, "If you can use a native HTML element or attribute with the semantics and behavior you require already built in… then do so"; second, "Do not change native semantics, unless you really have to"; third, "All interactive ARIA controls must be usable with the keyboard"; fourth, "Do not use `role="presentation"` or `aria-hidden="true"` on a focusable element".
- **A role is a promise.** "`<div role="button">` … is a promise that the author of that `<div>` has also incorporated JavaScript that provides the keyboard interactions expected for a button"; and "No ARIA is better than Bad ARIA" ([APG, read me first](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)).
- **Where ARIA is needed**: states HTML has no attribute for (`aria-expanded`, `aria-pressed`, `aria-current`, `aria-selected`, `aria-invalid`), relationships (`aria-controls`, `aria-describedby`, `aria-labelledby`), live regions, and the composite widgets HTML lacks (tabs, listbox, menu, tree, grid), each built to its APG pattern.
- **A switch** is a checkbox with `role="switch"`: the native control keeps focus, form submission and the checked state (code-standard rule 8's evidence).

**Cases**
- A clickable `div` with `role="button"` and `tabindex="0"` → a `button`; the `div` still needs Enter and Space handlers, which it does not have.
- `role="tablist"` on a row of buttons with no panels, no roving tabindex and no arrow keys → either build the APG tabs pattern in full or remove the roles and keep plain buttons or links ([Composite widgets](#composite-widgets-and-roving-tabindex)).
- `role="menu"` on a site's navigation dropdown → the disclosure pattern (a `button` with `aria-expanded` and a list of links); a menu role tells a screen reader to expect application-style arrow-key menus.
- `aria-label` on a `div` with no role → it names nothing reliably; give the element a role that can be named or put the text in the content.

**Accessibility**
- WCAG 2.2 4.1.2 Name, Role, Value ([Understanding 4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html)), 2.1.1 Keyboard.
- code-standard rule 8 (the native control inside), code-standard rule 9 (an axis that collides with `role` is renamed), code-standard rule 64 (`aria-current`).

**Check**
- *Script:* `tools/css-lint/lint.mjs` *a state is a pseudo-class, disabled the control's own* rejects a non-ARIA `role` on a custom element; `tools/parity/pages.mjs` structure reports an `aria-labelledby` or `aria-describedby` that "points at nothing". Could flag `role="button"` on a non-button, a composite role with no keydown handler in its component, and `role="presentation"` or `aria-hidden` on a focusable element.
- *Judgement:* For each ARIA attribute: is there an element or attribute that already says this?

**Sources:** W3C *Using ARIA* and the APG as linked; they agree. The rules are the source behind code-standard rules 8 and 9 in [candidates.md](candidates.md).

## Accessible names and descriptions

**What good looks like**
- Every control, landmark, dialog, table and figure has a name; the name is short and comes from visible text where there is any.
- The visible label's words are inside the accessible name.
- Secondary text (a hint, a count, an error) is a description, not part of the name.

**How**
- **Order of preference**, from the APG's naming rules ([APG, names and descriptions](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/)): "Prefer Visible Text", "Prefer Native Techniques" (`label`, `legend`, `caption`, `figcaption`), "Avoid Browser Fallback" (`title` and `placeholder` content "typically yields low quality accessible names"), "Compose Brief, Useful Names".
- **Precedence.** `aria-labelledby` "has the highest precedence… it overrides names from child content and all other naming attributes, including `aria-label`" (APG). Then `aria-label`, then the native label, then content, then `title`; the full algorithm is [accname](https://www.w3.org/TR/accname-1.2/).
- **Descriptions** through `aria-describedby`, read after the name and a pause (code-standard rule 15).
  ```html
  <input id="q" type="checkbox" aria-describedby="q-n"><label for="q">Design</label>
  <span id="q-n">354</span>
  ```
- **Icon-only controls** name the control and hide the glyph (code-standard rule 18).
- **A visible label in the name.** If a button reads "Send" and its `aria-label` says "Submit message", speech users saying "click Send" miss it; start the name with the visible words.

**Cases**
- A facet checkbox's count sits inside its label → "Design 354" as one name; move the count out or mark it `aria-hidden` and describe the control with it (code-standard rule 15's evidence).
- An icon button defaults `aria-label` to an empty string → require the label in the component's API (code-standard rule 18).
- Five "Edit" links in a table → keep the visible "Edit" and add the row's name with `aria-labelledby="edit-3 row-3"` or a visually hidden span, so a links list reads "Edit Button", "Edit Card".
- A `section`'s `aria-label` repeats its visible heading in other words → `aria-labelledby` the heading; one source, translated once.

**Accessibility**
- WCAG 2.2 4.1.2 Name, Role, Value; 2.5.3 Label in Name ([Understanding 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)); 1.3.1; 2.4.6 Headings and Labels.
- code-standard rule 15, code-standard rule 18.

**Check**
- *Script:* `tools/parity/pages.mjs` structure computes each checkbox's and radio's name from its label and reports a count inside it ("(code-standard 15)"); `tools/css-lint/lint.mjs` *icon controls are named* rejects `aria-label=""`. Could compare each control's visible text with its computed name for 2.5.3.
- *Judgement:* Read a screen reader's list of form controls and links: is every entry unique and clear out of context?

**Sources:** APG and accname as linked; WCAG Understanding 2.5.3.

## Visible focus

**What good looks like**
- Every focusable element shows a focus indicator when reached by keyboard, drawn from the focus tokens in one place.
- Text inputs show focus however they were focused.
- The indicator is never hidden by a sticky region, an overflow clip or a dim.

**How**
- **`:focus-visible`**, not `:focus`: browsers use "heuristics to provide focus indicators only when it would be most helpful", typically not after a mouse click on a button but always in a text box ([MDN `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)).
- **One ring.** The scaffold's `focus.ring($clear)` takes the width and colour from the State/Focus tokens and computes the offset, never typed; clearing the ring off the component is what lets it reach 3:1 against both the component and the surface. Reading `$clear` off the design is [figma-handoff: focus rings](figma-handoff.md#focus-rings-reading-their-geometry).
  ```scss
  :focus-visible { @include focus.ring(var(--space-4)); }
  ```
- **An outline, never only a shadow.** Forced-colours mode (Windows contrast themes) drops `box-shadow` and keeps `outline`, recoloured to the system's colour. A ring drawn only as a shadow disappears there, and C40 warns against exactly that ([WCAG technique C40](https://www.w3.org/WAI/WCAG21/Techniques/css/C40)). A design that needs a shadow ring (a two-colour ring, a field's halo) keeps a `2px solid transparent` outline beside it, which forced colours paints; tested in Chromium's forced-colours emulation, 2026-10-25, where the shadow ring drew nothing and the transparent outline drew the ring. GOV.UK added such outlines to its radios and checkboxes for this reason ([govuk-frontend #2264](https://github.com/alphagov/govuk-frontend/pull/2264)).
- **Off computes to off.** Where a ring is suppressed, `outline: 0`, never `outline: none` (code-standard rule 40); and never suppress it without drawing another.
- **Not obscured.** `scroll-padding-top` on the scroll container, sized from the sticky header's token, keeps a focused control clear of it ([WCAG technique C43](https://www.w3.org/WAI/WCAG22/Techniques/css/C43)).
- What the ring looks like and on which surfaces it must be drawn is [accessibility: focus visibility](../ui/design/accessibility.md#focus-visibility).

**Cases**
- A reset says `:focus { outline: none }` → delete it; give every control the mixin under `:focus-visible`.
- A horizontal scroll row of cards clips each card's ring → padding on the row at least the ring's width plus offset, so `overflow` does not cut it.
- A sticky header covers the field the keyboard just reached → `scroll-padding-top` on the scroller (C43); 2.4.11 fails only when the control is entirely hidden, but a half-covered field is still a bad experience.
- A disabled host is dimmed and a focusable `aria-disabled` link inside it keeps a dimmed ring → a disabled link drops its `href` and is not focusable (code-standard rule 62).

**Accessibility**
- WCAG 2.2 2.4.7 Focus Visible ([Understanding 2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)), 1.4.11 Non-text Contrast, 2.4.11 Focus Not Obscured (Minimum) ([Understanding 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)).
- code-standard rule 40, code-standard rule 62; figma-standard rule 31 draws the focused state in the library.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *`outline: none`* rejects it in every sheet. Could, in a headless browser, tab through each page and fail any stop whose computed outline and box-shadow are both off, or whose box is entirely under a fixed or sticky element.
- *Judgement:* Tab through the page: can you find focus at a glance at every stop?

**Sources:** MDN and WCAG as linked. Some older guides ask for a ring on every `:focus`; the toolkit follows `:focus-visible` with the browser's heuristics, which keep the ring on text inputs.

## Focus management

**What good looks like**
- When content is replaced, focus stays on the control the reader used, or moves to the thing that replaced it; it never falls to `body`.
- A modal takes focus in on open, keeps it inside, and returns it on close.
- A skip link moves focus to `main`.
- Opening, closing and swapping never moves focus somewhere the reader did not ask to go.

**How**
- **Live swaps and re-renders** keep the reader's place (code-standard rule 14); how to swap, key items by id and restore focus and scroll in a script is [javascript: re-rendering without losing focus or scroll](javascript.md#re-rendering-without-losing-focus-or-scroll). What this section adds is where focus goes when the thing that had it is gone.
- **Dialogs.** `showModal()` makes the rest of the page inert and the browser returns focus to the previously focused element on close ([HTML `dialog`](https://html.spec.whatwg.org/multipage/interactive-elements.html#the-dialog-element)); `autofocus` goes on the element the reader is expected to use first. Where the trigger is gone on close, focus "is set on another element that provides logical work flow" ([APG modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)). Which element is a design decision: [dialogs: focus in, trapped, returned](../ui/patterns/dialogs.md#focus-in-trapped-returned).
- **Skip links.** The first focusable element, `href="#main"` to an `id` on `main`, visible on focus ([WebAIM, skip navigation](https://webaim.org/techniques/skipnav/)); design and wording are [navigation: skip links](../ui/patterns/navigation.md#skip-links).
- **Route changes without a page load.** Update the title and move focus to the new `h1` (with `tabindex="-1"`), as a page load would put the reader at the top.

**Cases**
- A delete dialog removes the row that opened it → on close, focus the next row, or the list heading if it was the last (APG; the dialogs pattern page sets which).
- A skip link targets `#content` and no element has that id → point it at `main`'s id; a link to nothing does nothing silently.
- A "Load more" button appends twenty items → focus stays on the button or moves to the first new item; never back to the top.

**Accessibility**
- WCAG 2.2 2.4.3 Focus Order ([Understanding 2.4.3](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html)), 2.4.1 Bypass Blocks, 2.1.2 No Keyboard Trap ([Understanding 2.1.2](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html)), 3.2.1 On Focus ([Understanding 3.2.1](https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html)).
- code-standard rule 2 (DOM order is the focus order), code-standard rule 14.

**Check**
- *Script:* `tools/parity/pages.mjs` structure, "(code-standard 14)", asserts focus survives a live swap ([javascript](javascript.md#re-rendering-without-losing-focus-or-scroll)). Could add: the first focusable element is a link to an existing id inside `main`, and focus returns to the trigger after a dialog closes.
- *Judgement:* Use every control that changes the page from the keyboard: after each one, do you know where you are?

**Sources:** WHATWG, APG, MDN and WebAIM as linked.

## Composite widgets and roving tabindex

**What good looks like**
- A composite widget (tabs, a listbox, a menu, a toolbar, a grid) is one tab stop; arrow keys move inside it.
- Its keyboard follows the APG pattern for its role, all of it.
- Without script it degrades to something that works: tab panels as headed sections, menus as lists of links.

**How**
- **One stop.** "The tab sequence should include only one focusable element of a composite UI component" ([APG, developing a keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)). With a roving tabindex, the current item has `tabindex="0"` and the rest `tabindex="-1"`; arrow keys move `0` and call `focus()`. `aria-activedescendant` is the alternative where focus must stay on a container (a combobox input).
  ```js
  list.addEventListener('keydown', (e) => {
    const i = items.indexOf(e.target), n = items.length;
    const j = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 }[e.key];
    if (j === undefined) return;
    e.preventDefault(); select(items[(j + n) % n]);   // moves tabindex 0, focuses, selects
  });
  ```
- **Tabs** ([APG tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)): `tablist`, `tab` with `aria-selected` and `aria-controls`, `tabpanel` labelled by its tab. Left and Right wrap; Home and End are optional. "It is recommended that tabs activate automatically when they receive focus as long as their associated tab panels are displayed without noticeable latency"; otherwise Enter or Space activates. Tabs that change the address are links with `aria-current`, not this pattern ([navigation: tabs](../ui/patterns/navigation.md#tabs)).
- **Menu button** ([APG menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)): Enter, Space and optionally Down Arrow open the menu on its first item, Up Arrow on its last; inside, the menu pattern's arrows, Escape returns to the button.
- **Listbox** ([APG listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)): Up and Down move; "Type-ahead is recommended for all listboxes, especially those with more than seven options".
- **Site navigation** uses the APG disclosure pattern (its "Disclosure Navigation Menu" example, [APG disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)): a `button` with `aria-expanded` and a list of links, no menu role and no arrow-key contract.
- **Tree or nested list.** The APG tree view is a selection widget ("single-select tree" or "multi-select tree"): roving focus or `aria-activedescendant` over `treeitem`s, Right and Left to open, close or move to the parent, Up, Down, Home, End and type-ahead, `aria-expanded` only on parents, `role="group"` round children, and `aria-selected` or `aria-checked` ([APG treeview](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)). ARIA defines a `treeitem` as "An option item of a tree" ([WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)): a node you choose, with no room for a row of its own actions. A hierarchy whose rows each hold several controls (a drag handle, an edit button, a "more" menu) is nested `ol` or `ul` lists of plain buttons, which announce depth and count natively and keep each button a Tab stop; if Tab through every row grows too long, the next step is the APG [treegrid](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/), "a hierarchical data grid… that is editable or interactive", never a `tree` with the actions folded into one item. The APG's own warning applies: "No ARIA is better than Bad ARIA… ARIA roles do not cause browsers to provide keyboard behaviors" ([APG read me first](https://www.w3.org/WAI/ARIA/apg/practices/read-me-first/)).
- **State in the same handler.** `aria-selected`, `aria-pressed` and `aria-expanded` change in the function that changes the view, never in a second pass that can be skipped.
- **No-script first.** Render panels visible and headed; the script adds the roles, the `tabindex` values and `hidden` on inactive panels when it initialises, so nothing depends on a `noscript` override (code-standard rule 20).

**Cases**
- `role="tablist"` with no panels, no roving tabindex and no arrow keys → build the pattern or drop the roles; an unfinished composite role is worse than plain buttons (the [candidate](candidates.md) "a composite ARIA role ships with its keyboard or not at all").
- Tab panels shipped `hidden` with a `noscript` override are unreachable with script off → ship them visible and let the script hide them ([javascript: progressive enhancement](javascript.md#progressive-enhancement) has the case).
- A view toggle swaps content but `aria-pressed` never changes → set it in the same handler.
- The same tabs behaviour is written three times across pages → one module, included where needed (code-standard rule 36).
- A `role="menu"` with `menuitemradio` children answers no arrow key → reuse the roving handler the tabs already have.
- A toolbar of eight icon buttons is eight tab stops → `role="toolbar"`, one stop, arrows between buttons, each button named (code-standard rule 18).
- An outline of parts, each row with a handle, a main button and a "more" button, is rebuilt as `role="tree"` → each row becomes one `treeitem` and two of its three actions have nowhere to go; keep the nested list of buttons, or move to a treegrid.

**Accessibility**
- WCAG 2.2 2.1.1 Keyboard ([Understanding 2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)), 4.1.2 Name, Role, Value, 2.4.3 Focus Order, 2.4.7.
- code-standard rule 14 (a panel swap keeps the reader's place), code-standard rule 20, code-standard rule 36, code-standard rule 64 (link tabs).

**Check**
- *Script:* `tools/ui-check/check.mjs` reads tab lists for design-standard rules 2 and 3 (one row, a layout that holds still). Could, in a headless browser, focus the first `[role=tab]`, press ArrowRight and assert focus moved and only one tab has `tabindex="0"`; and flag a `tablist` whose tabs have no `aria-controls` target.
- *Judgement:* Operate each widget with the keyboard alone, following the APG table for its role: does every listed key do what it says?

**Sources:** APG as linked. The APG ships a menubar example for site navigation as well as the disclosure one; the toolkit uses disclosure for navigation, because it needs no arrow-key model and degrades to a list of links.

## Menus, menu buttons and toolbars

**What good looks like**
- An action menu is a `button` that opens a list of actions; a menu of links that navigate is a disclosure, not a menu ([composite widgets](#composite-widgets-and-roving-tabindex)).
- A split button is two buttons side by side: the default action, and a menu button for the rest.
- A toolbar of three or more controls is one tab stop with arrows between them.
- Without script, every action is still reachable: the menu's items render as a list of buttons or links.

**How**
- **Menu button** ([APG menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)): the trigger is a `button` with `aria-haspopup="menu"`, `aria-expanded` and `aria-controls`; the list is `role="menu"` holding `menuitem`, `menuitemcheckbox` or `menuitemradio`. A `popover` on the list gives open, Escape and light dismiss with no script (code-standard rule 8); the script adds the roles and the keys.
  ```html
  <button type="button" popovertarget="row-7-menu" aria-haspopup="menu"
          aria-expanded="false" aria-controls="row-7-menu">More actions for invoice 1042</button>
  <ul id="row-7-menu" popover>
    <li><button type="button">Duplicate</button></li>
    <li role="separator"></li><li><button type="button">Delete invoice</button></li></ul>
  ```
- **Menu keys** ([APG menu and menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)): "When a menu opens… keyboard focus is placed on the first item"; Up and Down move, optionally wrapping; Home and End; optional type-ahead; Enter activates and closes; Escape closes "and return[s] focus" to the button. "Tab and Shift + Tab do not move focus into a menu"; Tab out closes it. A separator "is not focusable or interactive".
- **Unavailable items** keep their place with `aria-disabled="true"`, so arrows still reach them and the reason can be heard (design-standard rule 5; code-standard rules 9 and 62).
- **Split button**: the default action is its own `button` named for that action; the arrow is a second, named menu button ("More merge options"), never one control with two hit areas.
- **Toolbar** ([APG toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)): `role="toolbar"` named by `aria-label` or `aria-labelledby`, a roving tabindex across its controls (the handler in [composite widgets](#composite-widgets-and-roving-tabindex)); toggles in it carry `aria-pressed`. A bulk-action bar is a toolbar whose name includes the count.
- When to use each is [actions: split buttons and overflow menus](../ui/patterns/actions.md#split-buttons-and-overflow-menus) and [actions: toolbars and bulk actions](../ui/patterns/actions.md#toolbars-and-bulk-actions).

**Cases**
- A "More" menu built on `details` stays open on Escape and on a click elsewhere → a `popover` list, or add both in the script (code-standard rule 19).
- `role="menu"` on a site's navigation list → drop the role; navigation is a disclosure of links, and the menu role tells a screen reader to expect arrow keys it may not get.
- Items hidden when they do not apply to the row, so the menu changes shape → keep them, `aria-disabled`.
- A split button whose arrow has no name → "More merge options" (code-standard rule 18).
- Twelve editor buttons are twelve tab stops → one toolbar, one stop, arrows inside.

**Accessibility**
- WCAG 2.2 2.1.1 Keyboard, 4.1.2 Name, Role, Value (the trigger's expanded state, the toolbar's name), 2.4.3 Focus Order (Escape returns focus to the trigger).
- code-standard rule 8, code-standard rule 18, code-standard rule 19, code-standard rule 20.

**Check**
- *Script:* `tools/ui-check/check.mjs` reads design-standard rule 5 for menus; `tools/parity/pages.mjs` asserts a floating `details` closes on Escape and outside click (code-standard rule 19). Could open each `aria-haspopup` trigger by keyboard and assert focus lands on the first item, `aria-expanded` turned true, and Escape returns focus to the trigger; and assert a `role="toolbar"` takes one Tab.
- *Judgement:* Is each menu a list of actions (a menu) or of places (a disclosure)?

**Sources:** APG as linked. The APG builds a menu's open state in script; the toolkit opens it with `popover` first, so it works before the script loads, and keeps the APG's keyboard contract.

## Tooltips and toggletips

**What good looks like**
- A tooltip is short text tied to a focusable trigger, shown on hover and on focus, and never holds anything focusable.
- A tooltip that names an icon button is that button's name; one that adds a hint is its description.
- Help that holds a link or more than a phrase is a toggletip: a button that opens a non-modal popover on click.

**How**
- **Wiring** ([APG tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)): the tip is `role="tooltip"`; the trigger keeps focus and points at it with `aria-describedby` for a hint, or `aria-labelledby` for an icon button's name (code-standard rules 15 and 18).
  ```html
  <button type="button" aria-labelledby="tip-edit"><svg aria-hidden="true">…</svg></button>
  <span role="tooltip" id="tip-edit" hidden>Edit title</span>
  ```
- **Show and hide** on `pointerenter` and `focusin`, after a short delay; hide on `pointerleave` from both trigger and tip, on `focusout`, and on Escape without moving focus (1.4.13). The tip text exists in the page from the start so the name is there before any hover.
- **Not `title`** for anything a keyboard or touch user needs: it shows on hover only ([keyboard access](#keyboard-access-and-modified-clicks)).
- **Toggletip**: a `button` with `popovertarget` and `aria-expanded`, opening a `popover` placed after it in the DOM, so Tab reaches any link inside next ([HTML semantics: *Disclosure, dialogs and popovers*](html-semantics.md#disclosure-dialogs-and-popovers)).
- When to use either is [dialogs: tooltips](../ui/patterns/dialogs.md#tooltips) and [actions: icon-only buttons](../ui/patterns/actions.md#icon-only-buttons).

**Cases**
- A tooltip on a `disabled` button explaining why → the button cannot take focus, so keyboard users never see it; put the reason in visible text tied by `aria-describedby`, or use `aria-disabled` (code-standard rule 62).
- A tooltip that contains "Learn more" → a toggletip; a tooltip vanishes before the link can be reached.
- A tooltip on a `span` → put it on the control it describes, or show the text.
- A tip that hides when the pointer moves from the trigger onto it → keep it open while the pointer is over either (1.4.13, hoverable).

**Accessibility**
- WCAG 2.2 1.4.13 Content on Hover or Focus ([Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)), 4.1.2, 2.1.1.
- code-standard rule 15, code-standard rule 18, code-standard rule 62.

**Check**
- *Script:* could hover and focus each `[role=tooltip]` trigger and assert the tip shows both times, Escape hides it with focus unmoved, and it contains no focusable element; flag `role="tooltip"` referenced from a non-focusable element.
- *Judgement:* If the tip never appeared, could the person still finish the task?

**Sources:** APG and WCAG as linked. The APG's tooltip pattern is marked work in progress; the toolkit follows its wiring and holds the behaviour to 1.4.13, which is normative.

## Data grids

**What good looks like**
- A grid is a native `table` with `role="grid"` added, so its structure survives; its roles are complete (`row`, `columnheader`, `rowheader`, `gridcell`) or absent.
- It is one tab stop with a roving tabindex over cells in two dimensions, and the full APG grid key set.
- Editing is a mode: arrow keys navigate until a cell is entered, then belong to the editor until Escape.
- A virtualised grid declares its totals and each rendered row's position.
- This section implements [data-grid](../ui/patterns/data-grid.md): its keyboard model, roles, editing and virtual scroll.

**How**
- **Roles.** `role="grid"` on the `table`, named by `aria-labelledby`; a `table` element's rows and cells map to `row` and cell roles, and `th scope="row"` to `rowheader`. A read-only cell in an editable grid has `aria-readonly="true"`; a selected row `aria-selected="true"` ([APG grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)).
- **Focus.** One cell has `tabindex="0"`, every other `-1`; arrow keys, Home, End, Control+Home, Control+End and Page Up/Down move it (APG), using the roving handler of [*Composite widgets and roving tabindex*](#composite-widgets-and-roving-tabindex) extended to rows and columns. A cell holding one control focuses that control instead of the cell. Tab back into the grid lands on the last active cell, so the `tabindex="0"` stays where it was.
  ```js
  const move = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] };
  grid.addEventListener('keydown', (e) => {
    if (grid.dataset.mode === 'edit' || !move[e.key]) return;
    e.preventDefault(); focusCell(r + move[e.key][0], c + move[e.key][1]);   // clamps, moves tabindex 0
  });
  ```
- **Edit mode.** Enter or F2 enters the cell: render the editor (an `input` labelled by its column header), focus it and set a mode attribute on the grid (`data-mode="edit"`, code-standard rule 6) that the key handler reads; Escape reverts and Enter or Tab commits, then focus returns to the cell. An invalid value keeps the editor open with `aria-invalid="true"` and its message in `aria-describedby` (code-standard rule 15).
- **Virtualisation.** `aria-rowcount` and `aria-colcount` on the grid hold the totals, `aria-rowindex` and `aria-colindex` on each rendered row and cell its position (APG, Grid and Table Properties). Rendered rows stay in DOM order (code-standard rule 2), and recycling a row node keeps focus on the same record (code-standard rule 14).
- **One handler.** Keys and clicks are delegated from the grid element, never bound per cell ([javascript: events and delegation](javascript.md#events-and-delegation)).

**Cases**
- A grid library sets `role="grid"` on a read-only report → configure it to render a `table`; the role promises a keyboard the report does not need.
- Arrow keys move between cells while an editor is open, so the caret cannot move → read the mode attribute and return early in edit mode.
- A virtualised grid announces "row 3 of 30" for row 4,003 → set `aria-rowcount` to the total and `aria-rowindex` on each rendered row.
- Re-sorting rebuilds the body and `tabindex="0"` lands on the first cell → keep the active record's id and restore focus to its cell after the render.

**Accessibility**
- WCAG 2.2 2.1.1 Keyboard, 2.4.3 Focus Order, 2.4.7 Focus Visible, 2.4.11 (frozen headers and columns), 4.1.2 Name, Role, Value, 3.3.1 for cell errors.
- code-standard rule 2, code-standard rule 6, code-standard rule 14, code-standard rule 15, code-standard rule 20 (without script the grid is the `table` it is built on).

**Check**
- *Script:* none yet. Could, in a headless browser, tab into each `role="grid"` and assert one stop, press each APG key and assert the active cell moved, press Enter then Escape on an editable cell and assert the value reverted, and assert `aria-rowcount` equals the data's total in a virtualised grid.
- *Judgement:* Operate the grid by keyboard alone through the APG key table: does every key do what it says, in navigation and in edit mode?

**Sources:** APG as linked; [AG Grid accessibility](https://www.ag-grid.com/javascript-data-grid/accessibility/) and [MUI X accessibility](https://mui.com/x/react-data-grid/accessibility/) implement the same contract and are cited in [data-grid](../ui/patterns/data-grid.md).

## Selection controls past the native set

**What good looks like**
- A choice is a native checkbox, radio group, `select` or `input type="range"` wherever one fits, and gets its keyboard, state and form submission for nothing.
- A switch, a combobox, a custom listbox or a multi-select is built on a native control the script enhances, and carries the APG pattern's roles, states and keys in full.
- Without script, every one of them is still a working form control.

**How**
- **Switch** ([APG switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)): `<input type="checkbox" role="switch">`; the native `checked` stands in for `aria-checked`, Space toggles (Enter optionally), and "it is critical the label on a switch does not change when its state changes". Style on and off from `:checked`.
- **Indeterminate checkbox:** the script sets `box.indeterminate = true` (there is no attribute) and styles it from `:indeterminate`; a custom box uses `aria-checked="mixed"` ([APG checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)).
- **Combobox** ([APG combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)): focus stays in the `input` (`role="combobox"`, `aria-expanded`, `aria-controls` the `listbox`, `aria-autocomplete="list"`); the active option is `aria-activedescendant`, the chosen one `aria-selected="true"`. Down Arrow opens and moves, Enter accepts, Escape closes then clears, Alt + Down opens without moving. Start from a native `select` or an `input` with a `datalist`, which "contains a set of `<option>` elements that represent the permissible or recommended options" ([MDN `datalist`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/datalist)); MDN notes NVDA with Firefox does not announce its popup, so it is the fallback, not the finished control.
  ```html
  <label for="country">Country</label>
  <input id="country" role="combobox" aria-expanded="false" aria-controls="country-list" aria-autocomplete="list">
  <ul id="country-list" role="listbox" hidden></ul>
  <p aria-live="polite" data-results-count></p>
  ```
- **What an option may hold.** An `option` has "Children Presentational: True" ([WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)), so a swatch and a value beside the name are fine and anything interactive is not; grouped options are `role="group"` with a label inside the listbox ([APG listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)). "No matches" is a status message (4.1.3), written into the count element above, not a `role="presentation"` row inside the listbox.
- **A picker that opens a search box and a list** from a button (a token or icon picker) is a button opening a popup that holds a combobox: the APG says that when the popup is a dialog "DOM focus moves into the dialog", so `aria-haspopup="dialog"` describes the trigger better than `"listbox"`. A `popover` returns focus to its invoker on Escape and sets the implicit `aria-expanded` on the `popovertarget` button ([MDN, using the Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using)). A list shown for as long as the input is visible keeps `aria-expanded="true"`.
- **A custom-drawn radio or checkbox keeps the native input**, focusable and labelled, and hides it with `opacity: 0`, never `display: none` ([Soueidan, inclusively hiding and styling checkboxes and radios](https://www.sarasoueidan.com/blog/inclusively-hiding-and-styling-checkboxes-and-radio-buttons/), commentary). Its checked state must survive forced colours, where `background-color`, `border-color` and `color` become system colours and `box-shadow` is forced to `none` ([MDN `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors)): a dot drawn as a background or a shadow vanishes, and a chosen tile marked only by its border colour and a tinted fill looks like every other tile. Either add a `@media (forced-colors: active)` block that draws the dot or the chosen mark in a system colour (`CanvasText`, or `Highlight` under `forced-color-adjust: none`) or with a thicker border or an outline, or use native controls with [`accent-color`](https://developer.mozilla.org/en-US/docs/Web/CSS/accent-color), which forced colours handle themselves and which is the cheapest route. The boundary and the state keep 3:1 ([Understanding 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)), and `:focus-visible` is an outline, which survives the mode.
- **Listbox and multi-select** ([APG listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)): `role="listbox"` with `aria-multiselectable="true"` and `role="option"` children carrying `aria-selected`; one tab stop with arrows inside ([composite widgets](#composite-widgets-and-roving-tabindex)). Where the options fit on screen, a `fieldset` of checkboxes under a filter input is simpler and needs no pattern.
- **Slider** ([APG slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)): `<input type="range">` with `min`, `max`, `step`; the browser gives the arrows, Home and End. A custom thumb is `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext` when the number alone "isn't meaningful" (a unit, a day); Page Up and Down step further. The paired number input and the range share one value in the same handler.
- **Dates:** three `inputmode="numeric"` text inputs in a `fieldset` are the default; `input type="date"` only where its native picker suits the question, and any custom calendar is an enhancement beside a typed field (APG's [date picker dialog example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/datepicker-dialog/) for its keys).
- Which control to choose is [selection: choosing the control](../ui/patterns/selection.md#choosing-the-control).

**Cases**
- A switch built as a `div` with `role="switch"` and a click handler → no Space key, no form value; a checkbox with `role="switch"` has both.
- A switch whose label changes from "Notifications on" to "Notifications off" → the state is announced twice and the name changes under the reader; keep "Notifications" and let `checked` say the state.
- A combobox moves real focus into the list on Down Arrow → typing stops working until the reader tabs back; keep focus in the input and move `aria-activedescendant`.
- A price slider and its number input drift apart after typing → update both from one handler.
- A select-all box shows a dash but `indeterminate` is set only in CSS → set the property in the script; there is no attribute for it.
- A pill radio's dot is `::before` with `background: var(--accent)` → in forced colours the dot is gone and every pill reads unchecked; draw it in a system colour under `forced-colors: active`, or use `accent-color`.
- A searchable picker's "No token matches" is a row inside the listbox → it is never announced; write it into the status element.

**Accessibility**
- WCAG 2.2 4.1.2 Name, Role, Value; 2.1.1 Keyboard; 2.5.7 Dragging Movements (the range input's track and keys); 4.1.3 Status Messages (the combobox's result count).
- code-standard rule 8 (the native control inside), code-standard rule 9, code-standard rule 16 (native controls follow the theme), code-standard rule 19 (the combobox's Escape and light dismiss are built), code-standard rule 20.

**Check**
- *Script:* could flag `role="switch"` on anything but a checkbox input, a `role="combobox"` without `aria-expanded` and `aria-controls`, a `role="slider"` without its three value attributes, and, in a headless browser, press Down then Escape in each combobox and assert focus stayed in the input and the popup closed.
- *Judgement:* With scripts off, does each control still submit a value?

**Sources:** APG, WAI-ARIA and MDN as linked; they agree. Soueidan is commentary on hiding the native input. The `aria-haspopup="dialog"` reading for a picker whose popup holds a search box is the toolkit's, from the APG's description of dialog popups. The toolkit keeps the native control under every enhancement, per code-standard rule 8.

## Live regions and status messages

**What good looks like**
- A change that does not move focus (a result count, "Saved", an upload's progress) is announced through a live region.
- The live region exists in the page before its content changes, and persists across swaps.
- Polite by default; assertive or `role="alert"` only for what must interrupt.

**How**
- **Establish first.** "Establish the live region before updating its content. Start with an empty live region… The most reliable way to ensure that live regions are registered is to include them in the initial markup" ([MDN, ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)).
  ```html
  <p aria-live="polite" data-results-count></p>   <!-- in the page from the start -->
  ```
- **Politeness.** `aria-live` takes `off`, `polite` or `assertive` (MDN). `role="status"` is polite; `role="alert"` is assertive, and MDN notes alerts are announced "even when the region… is present in the initial markup… or injected dynamically", sometimes prefixed with "Alert".
- **`output`.** "Many browsers implement this element as an `aria-live` region" ([MDN `output`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/output)), which suits a computed result beside its inputs.
- **Announce the outcome, not the whole region.** Swap the list where it is and write one short sentence ("24 results") into a separate status element; a live region around a whole result list reads every item.
- **The region persists** while its contents change (code-standard rule 14).

**Cases**
- Five field error messages carry `aria-live` and mount with their text → nothing is announced; they are descriptions (`aria-describedby`), read on focus, and the error summary takes focus on submit (the [candidate](candidates.md) "`aria-live` on an element that mounts with its content announces nothing").
- A filtered list's container is `aria-live="polite"` → the reader hears every card; move the live region to a count line.
- "Saved" appears as a toast and disappears → put it in a persistent `role="status"` element, and leave it long enough to be read ([feedback: toasts](../ui/patterns/feedback.md#toasts)).
- A session-timeout warning → `role="alert"` (or a modal dialog if action is required); it must interrupt.

**Accessibility**
- WCAG 2.2 4.1.3 Status Messages ([Understanding 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)): "Let assistive technology notify users about status changes that don't take focus."
- code-standard rule 14 (the live region persists).

**Check**
- *Script:* `tools/parity/pages.mjs` structure finds pages with an `[aria-live]` region for its swap probe. Could flag an `aria-live` or `role="status"` element absent from the server-rendered HTML but present after script, and a live region containing interactive elements.
- *Judgement:* With a screen reader on, change each filter and save each form: do you hear what happened, once, briefly?

**Sources:** MDN and WCAG as linked. 4.1.3 was checked clean in one project and is a candidate in [candidates.md](candidates.md); code-standard rule 14 holds the half that failed.

## Hidden content

**What good looks like**
- Each way of hiding is chosen for who should still perceive the content.
- Nothing focusable is hidden from assistive technology while still reachable by keyboard.
- A script's `hidden` always wins against the stylesheet.

**How**
- **The choices:**

  | Hide from | Use | Notes |
  |---|---|---|
  | Everyone | `hidden` or `display: none` | `hidden` must beat any `display` the sheet sets (code-standard rule 17) |
  | Everyone, but findable | `hidden="until-found"` | "accessible to the browser's 'Find in page' feature or to fragment navigation" ([MDN `hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden)) |
  | Interaction, keeping it visible | `inert` | removed "from the tab order and accessibility tree" ([MDN `inert`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)) |
  | Assistive technology only | `aria-hidden="true"` | never on a focusable element or its ancestor ([MDN `aria-hidden`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden)) |
  | Sight only | `visually-hidden` utility | stays in the accessibility tree |

- **Visually hidden**, the ruleset O'Hara recommends ([O'Hara, *Inclusively hidden*](https://www.scottohara.me/blog/2023/03/21/visually-hidden-hack.html), commentary); it lives in the utilities layer ([css-architecture: utilities](css-architecture.md#utilities)):
  ```css
  .visually-hidden:not(:focus):not(:active):not(:focus-within) {
    clip-path: inset(50%); height: 1px; overflow: hidden;
    position: absolute; white-space: nowrap; width: 1px;
  }
  ```
- **Read-only and unavailable.** `pointer-events: none` hides nothing from the keyboard or a screen reader; a region that may not be used is `inert`, a control is `disabled` (code-standard rule 9).

**Cases**
- A collapsed block is a flex column with `hidden` set and shows anyway → `[hidden] { display: none }` in the same scope or a layered global one (code-standard rule 17's evidence).
- A read-only mode applied with `pointer-events: none` → the keyboard still edits everything; `inert` on the region, or `disabled`/`readonly` on the controls, and the server enforces it ([security: secrets never in front-end code](security.md#secrets-never-in-front-end-code)).
- An off-canvas menu is moved off screen with `transform` while closed → its links are still tabbable; `hidden` or `inert` while closed.
- A decorative icon inside a labelled button → `aria-hidden="true"` on the icon, never on the button (Using ARIA's fourth rule).
- A long FAQ collapses answers → `hidden="until-found"` or `details`, so find-in-page still reaches the text.

**Accessibility**
- WCAG 2.2 1.3.1, 2.1.1, 2.4.3 (hidden content must not take focus), 4.1.2.
- code-standard rule 17, code-standard rule 9, code-standard rule 18.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *hidden beats the sheet* checks that an element a script hides has `[hidden] { display: none }`. Could flag focusable descendants of `aria-hidden="true"`, `pointer-events: none` on a container of controls with no `inert` or `disabled`, and off-screen focusable elements in a headless tab walk.
- *Judgement:* For each hidden thing: who should still perceive it, and does the method match?

**Sources:** MDN and O'Hara as linked; W3C *Using ARIA*'s fourth rule.

## Reduced motion and colour scheme in code

**What good looks like**
- One reduced-motion block in the base layer, written at the start of a project.
- Motion that conveys something becomes a fade or a still state under reduced motion, rather than vanishing.
- A themed document declares `color-scheme`, so the parts the browser paints follow the theme.

**How**
- **The base block**, the only place the `!important` gate allows it (`tools/css-lint/lint.mjs` *`!important`*):
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
  }
  ```
  [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) reflects the operating system's setting; WCAG technique [C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) uses it to meet 2.3.3. Motion tokens and replacing travel with a fade are [tokens: motion tokens](tokens.md#motion-tokens).
- **Script motion** reads the same preference: `matchMedia('(prefers-reduced-motion: reduce)').matches` before `scrollIntoView({ behavior: 'smooth' })` or an animation library call.
- **Colour scheme.** `color-scheme: light dark` on `:root` wherever the tokens have a dark tier (code-standard rule 16), and MDN advises the `<meta name="color-scheme">` tag "before any CSS style information" to prevent "unwanted screen flashes during the page load" ([MDN `color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/color-scheme)). How the tiers switch, with [`prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-color-scheme) and `[data-theme]`, is [tokens: themes and modes](tokens.md#themes-and-modes).

**Cases**
- The block is added a year in → audit every animation that relied on `transitionend` or a long duration; at the start it costs nothing.
- A smooth-scroll "Back to top" ignores the preference → check `matchMedia` and jump instead.
- Dark mode shows white inputs with white text → `color-scheme: light dark` (code-standard rule 16's evidence).
- A spinner stops under reduced motion → it conveys progress, so exempt it or replace it with a non-moving indicator.

**Accessibility**
- WCAG 2.2 2.3.3 Animation from Interactions (AAA, [Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)), 2.2.2 Pause, Stop, Hide ([Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)), 1.4.3 and 1.4.11 for the native controls a theme must reach.
- code-standard rule 16. The design side is [accessibility: motion and vestibular safety](../ui/design/accessibility.md#motion-and-vestibular-safety).

**Check**
- *Script:* `tools/css-lint/lint.mjs` *native controls follow the theme* (a dark tier comes with `color-scheme`) and *`!important`* (none outside a reduced-motion block). Could flag a script calling smooth scrolling or an animation API with no `prefers-reduced-motion` read.
- *Judgement:* With reduced motion on, does every state change still show, and does nothing slide or zoom?

**Sources:** MDN and WCAG as linked. Reducing non-essential motion rather than deleting it is a [candidate](candidates.md). The toolkit ships the blunt block as the floor; it makes fades instant too, and a component cannot override it from a later layer (an `!important` in an earlier layer wins, [css-architecture: cascade layers](css-architecture.md#cascade-layers)), so a project that keeps a fade under reduced motion narrows the block's selector, as a ruling in its context document.

## Keyboard access and modified clicks

**What good looks like**
- Everything a pointer can do, the keyboard can do, in an order that follows the reading order.
- No positive `tabindex`; nothing receives focus that cannot be operated.
- Modified and middle clicks go to the browser.

**How**
- **Tab order is DOM order** (code-standard rule 2). `tabindex="0"` adds a custom control to the natural order, `-1` makes an element focusable by script only. MDN: "Avoid using tabindex values greater than 0 and CSS properties that can change the order of focusable HTML elements" ([MDN `tabindex`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/tabindex)).
- **Native first.** A `button` already handles Enter and Space, a link Enter; a custom control needs both on `keydown`.
- **Content on hover or focus** (a tooltip, a submenu) also appears on focus, stays while the pointer moves onto it, and is dismissible without moving focus, usually by Escape ([Understanding 1.4.13](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)).
- **Modified clicks.** A handler that takes over a link's click lets the browser have `cmd`, `ctrl`, `shift`, `alt` and any button but the main one (`button` 1 is the "auxiliary button, usually the wheel button or the middle button", [MDN `MouseEvent.button`](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button)), code-standard rule 21:
  ```js
  link.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault(); swap(link.href);
  });
  ```
- **Don't disable the submit button until valid**: a disabled button cannot be focused, so a keyboard user cannot find out why; let it submit and show the errors ([actions: disabled buttons](../ui/patterns/actions.md#disabled-buttons)).

**Cases**
- A row-click script → a stretched link, which needs no modifier handling at all (code-standard rule 21's evidence).
- A `tabindex="3"` on the search field so it is "first" → remove it; move the field in the DOM or add a skip link.
- A tooltip appears on hover only → show it on focus too and close it on Escape (1.4.13).
- A drag-to-reorder list → add Move up and Move down buttons, or arrow keys on the focused item; WCAG 2.5.7 asks for a non-drag path for pointer users, and 2.1.1 for keyboard users.
- A select that navigates on `change` → a change of context on input; add a Go button, or make the options links (3.2.2).

**Accessibility**
- WCAG 2.2 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 1.4.13 Content on Hover or Focus, 3.2.1 On Focus, 3.2.2 On Input.
- code-standard rule 2, code-standard rule 21.

**Check**
- *Script:* `tools/css-lint/lint.mjs` *modified clicks go to the browser* reads every click handler that cancels navigation and navigates itself. Could flag any `tabindex` above 0, a `mouseover` or `mouseenter` handler with no matching `focus` handler, and `disabled` on a submit button toggled by validity.
- *Judgement:* Do one whole journey with the mouse unplugged: is anything unreachable, and is the order the reading order?

**Sources:** MDN and WCAG as linked; [WebAIM keyboard accessibility](https://webaim.org/techniques/keyboard/) agrees.

## Keyboard shortcuts

**What good looks like**
- A shortcut is an accelerator for something already reachable by Tab and Enter, never the only way.
- It claims no key the browser, the operating system or a screen reader already uses for something else.
- A single-character shortcut can be turned off or remapped, or works only while its component has focus.
- It implements [interaction: keyboard parity and shortcuts](../ui/design/interaction.md#keyboard-parity-and-shortcuts).

**How**
- **One listener on the document**, ignoring keys typed into a field and keys with a modifier it does not own:
  ```js
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.isComposing || e.target.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && prefs.shortcuts) { e.preventDefault(); search.focus(); }
  });
  ```
- **Announce it**: `aria-keyshortcuts="/"` on the element it activates or focuses, and the key shown beside the command (`<kbd>`). MDN: the attribute "has no effect on the functionality of the page; the keyboard behavior must be added via JavaScript event handlers" ([MDN `aria-keyshortcuts`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-keyshortcuts)).
- **Don't take a used key.** MDN: "make sure you don't create shortcuts that are already being used by the browser, assistive technology, or operating system, unless they are used for the same thing", and avoid single-letter keys outside a productivity application.
- **Scoped keys** (arrows in a grid, Delete on a focused row) live on the component's own `keydown`, not the document, so they cannot fire elsewhere; composite keyboards are [composite widgets and roving tabindex](#composite-widgets-and-roving-tabindex).
- A shortcut on a disabled control is disabled with it; the preference that turns shortcuts off is stored once and read by the one listener (code-standard rule 36).

**Cases**
- `/` focuses search while the reader types a slash into a comment → skip events whose target is a field.
- `Ctrl+S` is taken over to save a draft in a docs page → leave it to the browser, unless the page is an editor where saving is the same thing.
- `j` and `k` move between rows with no way to turn them off → a setting, or bind them only while the list has focus (2.1.4).
- A shortcut exists only in a help dialog nobody opens → show it beside its command and in `aria-keyshortcuts`.
- An editor's undo stack takes Ctrl+Z everywhere, and undoing a typo in a field deletes a part instead → skip events in fields, as above; the browser's own text undo arrives there as `beforeinput` with `inputType` `"historyUndo"` ([MDN `inputType`](https://developer.mozilla.org/en-US/docs/Web/API/InputEvent/inputType)). When undo is offered at all is [interaction: undo or confirmation](../ui/design/interaction.md#undo-or-confirmation).

**Accessibility**
- WCAG 2.2 2.1.4 Character Key Shortcuts ([Understanding 2.1.4](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html)): turn off, remap, or active only on focus. 2.1.1 Keyboard.
- code-standard rule 21 (modified clicks stay the browser's), code-standard rule 36 (one implementation).

**Check**
- *Script:* could flag a document-level `keydown` handler that acts on an unmodified printable key without a field guard or a preference, and an `aria-keyshortcuts` whose key no handler reads.
- *Judgement:* Does any shortcut collide with a browser or screen-reader command, and can every single-key shortcut be turned off?

**Sources:** MDN and WCAG as linked. MDN advises most sites to avoid shortcuts; the toolkit allows them as accelerators within 2.1.4, as [interaction](../ui/design/interaction.md#keyboard-parity-and-shortcuts) does.

## Testing with a keyboard and a screen reader

**What good looks like**
- Every change that touches markup or behaviour gets a keyboard pass and an automated scan; every new component or page gets a screen-reader pass.
- Automated results are read as a floor, never as a verdict.
- What the toolkit's gates already measure is not re-checked by hand.

**How**
1. **Automated scan.** Run axe-core or an equivalent, read its "incomplete" results, and treat a clean result as a floor; what it finds and what it cannot is [testing: automated accessibility checks](testing.md#automated-accessibility-checks-and-their-limits).
2. **The toolkit's gates.** `tools/parity/pages.mjs` structure (one `main`, one `h1` in it, heading order, unique ids, named landmarks, resolving ARIA references, focus kept after a swap, Escape on floating `details`); `tools/css-lint/check.mjs` for the stylesheet rules. [testing.md](testing.md) owns how they run in CI.
3. **Keyboard.** Tab and Shift+Tab through the whole page, operate every control with Enter, Space, arrows and Escape, and watch for focus that disappears, jumps or hides.
4. **Screen reader.** VoiceOver on macOS (Command+F5, or triple-click Touch ID; the VO keys are Control+Option, [WebAIM VoiceOver](https://webaim.org/articles/voiceover/)) and NVDA, "a free screen reader for Windows" ([WebAIM NVDA](https://webaim.org/articles/nvda/)). Read the page top to bottom, then use the headings, landmarks and form-controls lists.
5. **Zoom and reflow** at 200% and 400%: [responsive: zoom and reflow](responsive.md#zoom-and-reflow).
6. **Styles off.** With CSS disabled the page should still read in a sensible order (code-standard rule 1); a quick structural view is the W3C's [Easy Checks](https://www.w3.org/WAI/test-evaluate/easy-checks/).

**Cases**
- axe reports zero violations → the keyboard pass still finds focus lost on a swap, which axe cannot see.
- A component passes in Chrome with NVDA and announces nothing in Safari with VoiceOver → test both pairs for anything with a live region or a composite role; support differs.
- A check reports "0 swaps examined" → the probe found no live region or no checkbox; that is a finding about the probe, not a pass (code-standard rule 30).
- A designer asks whether a page is accessible → answer with what was tested (scan, keyboard, which screen reader) and what was not, never "yes".

**Accessibility**
- WCAG 2.2 as a whole; the W3C's [evaluation overview](https://www.w3.org/WAI/test-evaluate/) sets out the method. code-standard rule 30 (a check that fires on nothing is a finding).

**Check**
- *Script:* the gates above, plus axe-core in a project's browser tests where one exists.
- *Judgement:* Which of the ten topics on this page did the change touch, and which pass covered each?

**Sources:** WebAIM and W3C WAI as linked; automated coverage and its sources are [testing](testing.md#automated-accessibility-checks-and-their-limits)'s. The toolkit treats every automated result as partial.
