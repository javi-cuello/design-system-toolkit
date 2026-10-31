# Menus: the top menu bar, dropdowns, mega menus, mobile and sticky menus, and the account menu

How a site or tool lays out its top-level navigation menu: the bar across the top, the dropdowns that open from it, mega menus for large sites, the menu on small screens, a bar that stays in view as the page scrolls, what happens when the bar runs out of room, and the account menu. It serves the principles *discoverable* (what can be reached is in sight wherever there is room for it), *show state* (the reader can tell where they are), *consistent, not uniform* (the bar is the same on every page) and *for everyone, in any context* (it works without a pointer that hovers). It applies design-standard rule 2 (the bar holds still when the reader switches what they look at). This page owns global navigation, mega menus and mobile navigation, which navigation.md now only points to; navigation.md keeps breadcrumbs, tabs, in-page navigation, skip links and the Back button. Side navigation is [`sidebars.md`](sidebars.md)'s; menus of actions and the overflow of actions are [`actions.md`](actions.md)'s ([split buttons and overflow menus](actions.md#split-buttons-and-overflow-menus)); drawers are [`dialogs.md`](dialogs.md)'s.

One distinction runs through the page: a **navigation menu** is a list of links that change the address; an **action menu** is a list of commands. The first is built as links behind disclosure buttons; only the second is ever an ARIA `menu` ([APG disclosure navigation example](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)).

## Top menu bar

**Use when / don't use**
- Use on any site or tool with more than one top-level section, on every page, in the same place with the same items in the same order.
- Use it for destinations. Product-wide utilities (search, help, notifications, account) sit at its right end as a separate group, as Carbon's header does ([Carbon UI shell header](https://carbondesignsystem.com/components/UI-shell-header/usage/)); page actions never sit in it.
- Don't use it as a site map: GOV.UK shows "only the most important top-level sections" and says navigation "is not a site map" ([GOV.UK, help users to navigate a service](https://design-system.service.gov.uk/patterns/navigate-a-service/)).
- Don't use it where a service is one linear journey; GOV.UK points that case at a task list instead.
- Don't hide it on a wide screen: "Menus shouldn't be hidden when you have plenty of space to display them" ([NN/g menu-design checklist](https://www.nngroup.com/articles/menu-design/)).

**How**
- **Anatomy, left to right:** the product name linked to home, the section links, then the utility group. The section links read in order of importance, the most used first ([NN/g menu-design checklist](https://www.nngroup.com/articles/menu-design/)).
- **Count.** As many as fit one row at the narrowest width where the bar shows as a bar; no system sets a number. GOV.UK sets none; Friedman suggests about five for a bar that stays fixed in view ([Smashing, sticky menus, Friedman 2023](https://www.smashingmagazine.com/2023/05/sticky-menus-ux-guidelines/)). Past what fits, *Overflow* below.
- **Labels.** The reader's words for what the section holds, specific and quick to scan: "Menus are not the place to get cute with made-up words, internal jargon, or abstract high-level categorization" ([NN/g](https://www.nngroup.com/articles/menu-design/); wording is [content: terminology](../design/content.md#terminology)).
- **Current section.** Marked by more than colour (weight, an underline bar), and kept marked on every page inside the section; NN/g calls a missing current marker "probably the single most common mistake" on menus. GOV.UK pairs the styling with a bold fallback ([GOV.UK service navigation](https://design-system.service.gov.uk/components/service-navigation/)).
- **States.** Rest, hover, focus and current each look different; current never looks like hover ([visual: visual states of controls](../design/visual.md#visual-states-of-controls)).
- **Height and position** are the same on every page; a bar that wraps to two rows on one page moves everything below it (design-standard rule 2).
- **Contrast.** The bar is opaque and its text meets contrast against it ([NN/g](https://www.nngroup.com/articles/menu-design/)).

**Cases**
- A docs site has Components, Foundations, Patterns, Guides, Changes and "New component" in the bar → move "New component" out; it is an action, and mixing it with destinations makes the reader read every item twice.
- The bar marks "Components" on the index but nothing on a component's page → keep the section marked on every page under it, and mark the page itself in the breadcrumb ([navigation: breadcrumbs](navigation.md#breadcrumbs)).
- A section has twelve sub-pages and the designer wants them all in the bar → keep the section in the bar and give the twelve a side navigation ([sidebars: navigation sidebar](sidebars.md#navigation-sidebar)).
- Eight sections fit at 1440px and wrap at 1100px → collapse the lowest-traffic ones into a "More" item from the width they stop fitting, never a second row.
- Search sits as an icon in the utility group on a docs site where search is the main way in → a visible box ([search: the box](search.md#the-box-visible-wide-and-labelled)).

**Accessibility**
- 3.2.3 Consistent Navigation (same order on every page), 2.4.8 Location (current section shown), 1.4.1 Use of Color (current not by colour alone), 2.4.1 Bypass Blocks (a skip link past the bar), 1.4.3 Contrast and 1.4.11 Non-text Contrast (the current marker), 2.5.8 Target Size.
- Figma: figma-standard rule 26 (targets), figma-standard rule 31 (current, hover and focus draw differently), figma-standard rule 32 (contrast in every mode).

**Build**
- *Elements:* a `header` holding the product link and a `nav` with an accessible name ("Main"), its items a `ul` of `a` elements; the utility group outside that list (its own `nav` if it holds links, or plain buttons if it holds controls).
- *ARIA and keyboard:* no ARIA roles beyond the landmark; Tab moves through the links in reading order. Not `role="menubar"`: the APG's menubar is for "a consistent set of commands" like a desktop application's menu bar ([APG menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)), and it changes Tab into arrow-key navigation that readers of a website don't expect.
- *States:* the current link carries `aria-current="page"`, or `aria-current="true"` for its section on an inner page, and the current look is styled off that attribute.
- *Rules:* code-standard rule 64 (`aria-current`, styled off the attribute, in every navigation that lists the item), code-standard rule 1 (a labelled landmark, lists as lists), code-standard rule 2 (DOM order is the visual order), code-standard rule 21 (modified clicks reach the browser), code-standard rule 18 (an icon-only utility is named).
- *Detail:* [code: navigation markup](../../code/html-semantics.md#navigation-markup), [code: landmarks](../../code/html-semantics.md#landmarks), [code: links and buttons](../../code/html-semantics.md#links-and-buttons), [code: keyboard access and modified clicks](../../code/accessibility.md#keyboard-access-and-modified-clicks).

**Check**
- *Script:* could check exactly one `aria-current` link per `nav`, the same link order on every page, the bar's height equal across pages at one width (no wrap), no `role="menubar"` on a list of links, and no `button` that runs an action inside the section list.
- *Judgement:* Could a reader landing on an inner page say which section they are in and name three others?

**Sources:** NN/g, GOV.UK, Carbon, Friedman and the APG as linked. GOV.UK and NN/g set no item count; the toolkit takes "fits one row at the width it shows" as the limit, and treats Friedman's five as the budget for a bar that is also sticky.

## Navigation dropdowns

**Use when / don't use**
- Use when a top-level section has a handful of sub-pages the reader should reach in one step from anywhere, and the section's own index page is not enough.
- Don't use more than one level: a submenu opening another submenu is the multilevel cascade NN/g advises against ([NN/g menu-design checklist](https://www.nngroup.com/articles/menu-design/)). A section with two tiers of pages wants a mega menu (next section) or a side navigation ([`sidebars.md`](sidebars.md)).
- Don't put controls (inputs, toggles, search) in a dropdown; it holds links.

**How**
- **Open on click or tap, never on hover alone.** "Hover is not universally available," and menus that open by accident frustrate everyone ([NN/g](https://www.nngroup.com/articles/menu-design/)). Friedman's testing of hover menus finds the delays they need to guess intent add lag to every use, and recommends click menus, which need no tuning and work the same on touch ([Smashing, mega-dropdowns, Friedman 2021](https://www.smashingmagazine.com/2021/05/frustrating-design-patterns-mega-dropdown-hover-menus/)).
- **A trigger does one thing.** Either it opens the dropdown or it is a link to a page, never both; Friedman and Carbon agree, and Carbon's menu labels "only open the dropdown" ([Carbon UI shell header](https://carbondesignsystem.com/components/UI-shell-header/usage/)). The section's index page goes inside the dropdown as its first link ("All components", Friedman's "Browse all").
- **A chevron** on every trigger that opens a dropdown, so it looks different from a plain link ([NN/g](https://www.nngroup.com/articles/menu-design/)); the chevron turns when open.
- **Closes** when a link is chosen, when the trigger is pressed again, on Escape (focus back to the trigger), on a click outside, and when focus leaves it ([Carbon](https://carbondesignsystem.com/components/UI-shell-header/usage/); [APG disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)).
- **One open at a time;** opening a second closes the first.
- The dropdown never covers the whole screen on a large display ([NN/g](https://www.nngroup.com/articles/menu-design/)).
- If the current page is inside a dropdown, its trigger is marked as the current section.

**Cases**
- "Components" both links to the index and opens a dropdown on hover → make it a button that opens the dropdown, with "All components" as the first link inside.
- A dropdown opens on hover and closes when the pointer crosses the gap to it → open on click; the gap problem disappears with the hover.
- "Guides" opens a dropdown whose items open further panels to the side → flatten to one level, or move the second tier into a side navigation inside the section.
- A reader on the "Colour" page sees no marker in the bar because "Colour" sits in the Foundations dropdown → mark "Foundations" as the current section.

**Accessibility**
- 2.1.1 Keyboard (opens with Enter or Space), 2.1.2 No Keyboard Trap, 1.4.13 Content on Hover or Focus (if any hover remains, the panel is dismissable, hoverable and persistent), 4.1.2 Name, Role, Value (expanded state exposed), 2.4.3 Focus Order (the panel's links follow their trigger), 2.4.7 Focus Visible.
- Figma: figma-standard rule 31 (the trigger's open state draws differently from hover), figma-standard rule 26.

**Build**
- *Elements:* inside the `nav`'s list, an `li` holding a `button` (the trigger) and the dropdown as a nested `ul` of `a`. Where script is absent, the nested list shows, or the trigger is a link to the section index (code-standard rule 20). A `details`/`summary` pair is acceptable and gives open state for free, but nothing else.
- *ARIA and keyboard:* the APG disclosure navigation pattern: the button carries `aria-expanded` and `aria-controls`; Space or Enter toggles; Escape closes and returns focus to the button; Tab moves through the open panel's links; arrow keys, Home and End are optional extras ([APG disclosure navigation](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)). Not `role="menu"`: the APG example avoids it because site navigation does not need the menu widget's behaviour, and assistive technology announces a menu as a command list.
- *States:* `aria-expanded="true|false"` on the trigger, the panel `hidden` when closed, the chevron and open look styled off `[aria-expanded="true"]`; `aria-current` on the current link and the trigger's section.
- *Popover:* `popover="auto"` on the panel with `popovertarget` on the button gives click-open, Escape, light dismiss and one-open-at-a-time with no script; a short script mirrors `aria-expanded` on the `toggle` event. Closing when focus leaves is a `focusout` handler that checks `relatedTarget` against the panel.
- *Rules:* code-standard rule 19 (`details` gives neither Escape nor light dismiss; the script adds both), code-standard rule 17 (`hidden` beats the stylesheet), code-standard rule 20 (works without script), code-standard rule 64, code-standard rule 36 (one dropdown script, included wherever the bar appears).
- *Detail:* [code: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers), [code: focus management](../../code/accessibility.md#focus-management), [code: hidden content](../../code/accessibility.md#hidden-content).

**Check**
- *Script:* could check each trigger is a `button` with `aria-expanded` and `aria-controls`, the panel is hidden when closed, Escape closes and returns focus, a click outside closes, only one panel is open, no `mouseenter` handler opens a panel without a click path, and no element is both a link and a trigger.
- *Judgement:* Would the section's index page, or a side navigation, serve the reader as well with no dropdown at all?

**Sources:** NN/g, Friedman, Carbon and the APG as linked. All four agree on click to open and on a trigger that does one thing; the toolkit follows them and does not build hover menus.

## Mega menus

**Use when / don't use**
- Use only for a large site whose sections each hold two or three tiers of many pages, where a dropdown would hide most of them; NN/g calls mega menus "an excellent design choice for accommodating a large number of options" ([NN/g mega menus](https://www.nngroup.com/articles/mega-menus-work-well/)).
- A documentation site or a tool rarely needs one: a side navigation inside the section holds the same pages and stays visible while reading ([`sidebars.md`](sidebars.md)).
- Don't put controls in it: NN/g warns against anything needing "more advanced interaction than a simple click", and keeps search out of the menu, visible on the page.

**How**
- **Groups.** Options chunked into related sets under short headings, ideally from card sorting; medium granularity; the most important group top left; each choice shown once ([NN/g](https://www.nngroup.com/articles/mega-menus-work-well/)).
- **Open on click,** with a chevron on a trigger that only opens ([Smashing, Friedman 2021](https://www.smashingmagazine.com/2021/05/frustrating-design-patterns-mega-dropdown-hover-menus/)). If a team keeps hover, NN/g's timings are the floor: the pointer rests about 0.5 s before the panel shows, and the panel hides only after the pointer has been outside both trigger and panel for about 0.5 s; the pointer's diagonal path to the panel must not close it. Friedman shows how these guesses still fail (the "trajectory triangle" and exit areas break when triggers sit close together) and that the delays add lag to every visit, which is why the toolkit does not keep hover.
- **Transitions** short: Friedman keeps fades at 300 ms or less and warns against stacking delayed submenus.
- **A visible edge** (border or shadow) so the panel reads as one surface over the page ([NN/g](https://www.nngroup.com/articles/mega-menus-work-well/)).
- **"All of this section"** as a link inside each panel, and each section heading inside the panel a link only if it is styled as one.
- **On small screens** the mega menu becomes the section's list inside the mobile menu, its headings as groups (*Hamburger and mobile menus* below).

**Cases**
- A product's docs have 30 pages under Components → a side navigation in the section, not a mega menu.
- A marketing site has four product lines of eight pages each → one mega menu per line, opened by click, groups under headings.
- The same "Pricing" link appears in two groups of one panel → keep it in one; NN/g's show-once rule.
- A search field sits inside the mega menu → move it to the bar where it is always visible.

**Accessibility**
- 1.4.13 Content on Hover or Focus, 2.1.1, 2.1.2, 4.1.2 (`aria-expanded` on the trigger), 1.3.1 Info and Relationships (group headings and lists in markup), 2.5.8 (targets of the panel's links).
- NN/g's accessible fallback holds: each top-level item's index page lists everything in the panel as plain links.

**Build**
- *Elements:* the same disclosure as a dropdown, the panel holding one heading and one `ul` per group. Group headings are headings (or a list's label) so a screen reader can move by them.
- *ARIA and keyboard:* the APG disclosure navigation pattern, as in *Navigation dropdowns*; no `menu`, `menuitem` or `grid` roles in the panel.
- *States:* `aria-expanded` on the trigger, `hidden` on the closed panel, `aria-current` on the current link.
- *Rules:* code-standard rule 19, code-standard rule 17, code-standard rule 20 (without script the trigger reaches the section's index page), code-standard rule 64, code-standard rule 1 (headings and lists in the panel).
- *Detail:* [code: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers), [code: headings and the outline](../../code/html-semantics.md#headings-and-the-outline).

**Check**
- *Script:* could check the trigger is a `button` with `aria-expanded`, the panel closes on Escape and returns focus, no link appears twice in one panel, no input sits inside a panel, and each section's index page links every page its panel lists.
- *Judgement:* Would a side navigation inside the section serve the same readers with less machinery?

**Sources:** NN/g and Friedman as linked. NN/g allows hover with its timings; Friedman argues click menus avoid the whole problem. The toolkit opens on click and cites NN/g's timings only for a team that overrides that.

## Hamburger and mobile menus

**Use when / don't use**
- **Four or fewer** top-level destinations on a small screen: show them as visible links or a bottom bar. NN/g: "If your site has 4 or fewer top-level navigation links, display them as visible links" ([NN/g hamburger menus](https://www.nngroup.com/articles/hamburger-menus/)).
- **More than four:** a menu button holding the rest is the accepted trade-off, with the most important destinations also linked from the page (NN/g's combination navigation).
- **Never on a wide screen.** "Do not use hidden navigation (such as hamburger icons) in desktop user interfaces"; in NN/g's study hidden navigation was used in 27% of desktop cases against 48–50% for visible or combination navigation, and hiding it cut content discoverability by more than 20%.

**How**
- **A labelled button,** "Menu", not an icon alone. Friedman reports that in his sessions a hamburger icon never beat a text "Menu" button, and that the icon's many variants add ambiguity ([Friedman, we don't need hamburger icons](https://smart-interface-design-patterns.com/articles/avoid-hamburger-menus/)); GOV.UK's service navigation collapses into a button labelled "Menu" ([GOV.UK service navigation](https://design-system.service.gov.uk/components/service-navigation/)). An icon beside the word is fine.
- **Where it collapses:** at the width the bar's items stop fitting one row, measured from the content, never a fixed device width.
- **What the open menu holds:** the global items first, then the current section's pages; the utility group after. Carbon puts header links above the left panel's items when both collapse into one menu ([Carbon UI shell header](https://carbondesignsystem.com/components/UI-shell-header/usage/)).
- **Second levels as accordions** in the open menu rather than sliding panels: Friedman finds sliding menus slow to explore, and accordions avoid Back buttons and let several sections stay open; a split view of two levels side by side suits short labels ([Smashing, mobile navigation, Friedman 2022](https://www.smashingmagazine.com/2022/11/navigation-design-mobile-ux/); [Smashing, Friedman 2021](https://www.smashingmagazine.com/2021/05/frustrating-design-patterns-mega-dropdown-hover-menus/)). If a sliding panel is used, its back control names the level it returns to, not "Back".
- **One function per row:** a row either opens its group or links to a page; a group's index page is the first link inside it (Friedman 2022).
- **Depth:** two levels in the menu; anything deeper lives on the pages themselves (Friedman 2022).
- **Bottom bar** (an app-like tool on a phone): three to five destinations, each an icon with a text label, the current one marked; places only, never actions.
- **Dismissal:** a close control, Escape, and choosing a link close it; focus returns to the Menu button.

**Cases**
- A docs site with three sections on a phone → three visible links in the bar; no menu button.
- A tool with seven sections → a "Menu" button with its label, not a three-line icon alone.
- The menu opens as a panel that slides to a second panel for each section, with a "Back" link → accordions inside one panel, or a back control that says "All sections".
- The bar collapses at 768px but its items fit until 700px → collapse at 700px, where they stop fitting.
- A phone shows a hamburger for the global menu and a second for the section's side navigation → one menu holding both ([sidebars: small screens](sidebars.md#sidebars-on-small-screens)).
- A bottom bar includes "Share" → move it to the page; the bar is for places.

**Accessibility**
- 4.1.2 (the button has a name and an expanded state), 2.5.8 Target Size, 1.4.10 Reflow (usable at 320px without horizontal scroll), 2.4.3 Focus Order (focus into the open menu and back to the button), 3.2.3 Consistent Navigation, 2.1.2 No Keyboard Trap.
- Figma: figma-standard rule 26 (the button and every row meet the target), figma-standard rule 31.

**Build**
- *Elements:* the same `nav` and `ul` as the wide bar, with a `button` before the list that shows only below the collapse width; one list serves both widths, restyled by a media or container query, never a second copy of the links. Second levels as `details` or disclosure buttons.
- *ARIA and keyboard:* the APG disclosure pattern: the Menu button carries `aria-expanded` and `aria-controls` pointing at the list; Enter or Space toggles; Escape closes and returns focus. A full-screen menu that hides the page behind it is a modal `dialog` with its focus contract ([dialogs: focus](dialogs.md#focus-in-trapped-returned)); a menu that opens below the bar, pushing the page, is a plain disclosure. Not `role="menu"`.
- *States:* `aria-expanded` on the button, `hidden` on the closed list below the collapse width; the button itself `hidden` above it; `aria-current` on the current link inside.
- *Rules:* code-standard rule 20 (without script the links show and the button is absent; GOV.UK ships its toggle `hidden` until the script runs), code-standard rule 17, code-standard rule 18 (if the button is icon-only, it is named; prefer the visible word), code-standard rule 64, code-standard rule 2, code-standard rule 36.
- *Bottom bar:* a `nav` of links, each an icon with its text, `aria-current` on the current one, padded for the device's safe area. The collapse width is measured from the items and written once as a breakpoint token.
- *Detail:* [code: breakpoints](../../code/responsive.md#breakpoints), [code: container queries](../../code/responsive.md#container-queries), [code: progressive enhancement](../../code/javascript.md#progressive-enhancement), [code: touch targets](../../code/responsive.md#touch-targets), [code: safe areas](../../code/responsive.md#safe-areas).

**Check**
- *Script:* could check at 320px that no horizontal scroll appears and the toggle is a `button` with `aria-expanded` and a name; that Escape closes and returns focus; that with script disabled every link is reachable; that no menu button shows at desktop widths; and that the links exist once in the DOM.
- *Judgement:* Are there few enough destinations to show them all, and does the open menu put the reader's most likely next step first?

**Sources:** NN/g, Friedman, GOV.UK and Carbon as linked. NN/g measured hidden navigation and allows a menu button past four items; Friedman's argument is against the icon, not the button. The toolkit follows both: visible links up to four, past that a button with the word "Menu".

## Sticky menus

**Use when / don't use**
- Use when readers need the bar's items often while deep in a long page: long reference pages, product pages, filters and data tables that keep their header ([Smashing, sticky menus, Friedman 2023](https://www.smashingmagazine.com/2023/05/sticky-menus-ux-guidelines/)). NN/g: sticky headers help "only if they truly serve a purpose for your users" ([NN/g sticky headers](https://www.nngroup.com/articles/sticky-headers/)); NN/g's menu checklist suggests considering them on long pages ([NN/g menu-design checklist](https://www.nngroup.com/articles/menu-design/)).
- Don't make a bar sticky on pages read top to bottom where it is rarely used; the space it takes on every screen costs more than it gives (Friedman; NN/g).
- Don't make a bar sticky on a form on a phone: with the on-screen keyboard open, little room is left for the field (Friedman).

**How**
- **Small:** the least height that keeps readable text and usable targets ([NN/g](https://www.nngroup.com/articles/sticky-headers/)); about five items, the rest in an overflow (Friedman).
- **Partially persistent** on small screens: hide on scroll down, show on scroll up after a few pixels of upward movement, with a slide of about 300–400 ms (NN/g and Friedman give the same range).
- **Opaque,** with a background distinct from the content so text never sits over text ([NN/g](https://www.nngroup.com/articles/sticky-headers/)).
- **No "stalker" motion:** the bar is in place, not drifting in after a delay; motion respects reduced-motion settings ([visual: motion](../design/visual.md#motion)).
- **One sticky band at a time where possible;** a sticky bar plus a sticky filter bar plus a sticky table header is a stack the reader reads through. When they stack, each offsets by the one above.
- **Anchors land below it:** jumping to a heading must not put the heading under the bar (Friedman).

**Cases**
- A long component page keeps the global bar and the "On this page" list sticky → keep one, usually the in-page list on wide screens; the global bar can scroll away.
- A 72px sticky header on a 640px-tall phone screen → partially persistent, or shorten it; it costs over a tenth of every screen.
- Tabbing through a page puts focused links under the sticky bar → scroll padding equal to the bar's height, so focus is never hidden.
- An anchor link to "Accessibility" lands with the heading under the bar → the same scroll padding fixes both.

**Accessibility**
- 2.4.11 Focus Not Obscured (Minimum): a sticky bar never fully hides the focused element. 1.4.10 Reflow and 1.4.4 Resize Text: at 400% zoom a sticky bar can fill the viewport, so it stops sticking at narrow heights. 2.3.3 Animation from Interactions (AAA, worth meeting) for the reveal. 1.4.3 Contrast over all content.

**Build**
- *Elements:* the same `header` and `nav`, made sticky with `position: sticky; top: 0` on the band; no script for a fully sticky bar.
- *ARIA and keyboard:* none added; the bar's links keep their own model.
- *States:* a partially persistent bar toggles a `data-` attribute (`data-scrolled="up|down"`) from a passive scroll listener and styles its transform off it; the transition sits inside `prefers-reduced-motion: no-preference`.
- *Scroll padding:* `scroll-padding-top` on the root equal to the bar's height (a custom property both read), so anchors and focus land below it ([MDN scroll-padding-top](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-padding-top)). A media query on height drops the stickiness when the viewport is too short.
- *Rules:* code-standard rule 22 (the bar's height is a token or carries its reason, and scroll padding reads the same value), code-standard rule 46 (one place for a dimension the screen takes from the design), code-standard rule 6 (the scroll hook is an attribute).
- *Detail:* [code: reduced motion and colour scheme in code](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code), [code: zoom and reflow](../../code/responsive.md#zoom-and-reflow), [code: layout stability in code](../../code/performance.md#layout-stability-in-code).

**Check**
- *Script:* could tab through the page asserting no focused element's box lies wholly under a sticky element; jump to each in-page anchor asserting the target's top is below the bar; check the bar's height at each width against a budget; and at 400% zoom assert the bar is not sticky or takes under a set share of the viewport.
- *Judgement:* How often do readers use the bar while deep in this page?

**Sources:** Friedman, NN/g and MDN as linked. They agree on size, opacity and the reveal timing; NN/g prefers no animation at all, Friedman allows the slide. The toolkit allows the 300–400 ms slide for a partially persistent bar and nothing else.

## Overflow: "More" in the top menu

**Use when / don't use**
- Use when the section links outgrow the bar at some widths but showing them all at the widest is right: the links that do not fit move into a "More" dropdown at the end of the list, the most used staying in sight.
- Friedman's sticky-menu guidance caps the bar at about five items and puts the rest in an overflow ([Smashing, Friedman 2023](https://www.smashingmagazine.com/2023/05/sticky-menus-ux-guidelines/)); Carbon collapses header links into the left panel's menu on narrow screens ([Carbon UI shell header](https://carbondesignsystem.com/components/UI-shell-header/usage/)).
- Don't use "More" to hold actions (that is an overflow of actions, [actions: split buttons and overflow menus](actions.md#split-buttons-and-overflow-menus)), or as a permanent home for sections nobody prioritised; a section that always sits in "More" should be cut or merged.
- Don't use it below the mobile collapse width; there the whole bar becomes the Menu button.

**How**
- **Order:** the bar keeps its order; items leave from the end (the least used) and enter "More" in the same order, so a section never jumps ahead of another.
- **Label:** "More", with a chevron; it opens like any navigation dropdown.
- **Current item inside "More":** "More" itself is marked as current, and some systems lift the current item into the visible bar; the toolkit marks "More" and keeps the order, so items never swap places as the reader moves (design-standard rule 2).
- **Measured from the content:** how many fit is measured at run time or decided at fixed widths from the longest labels, never from a device list.

**Cases**
- Seven sections, five fit at 1024px → five in the bar, "More" holding the last two in order.
- The current page is in a section that sits in "More" → mark "More" as current; don't swap the section into the bar.
- "More" holds "Settings" and "Sign out" → move them to the utility group; they are not sections.
- A section has lived in "More" at every width for a year → its traffic says it belongs in the footer or nowhere.

**Accessibility**
- 4.1.2 (the "More" trigger exposes expanded state), 2.4.8 (current shown via "More"), 1.4.10 Reflow (no horizontal scroll while items move), 3.2.3 (the order stays the same).

**Build**
- *Elements:* every link stays in one `ul` in source order; a "More" `li` with a `button` and a nested `ul`. With no script, all links show and the bar may wrap; that is the accepted no-script state.
- *ARIA and keyboard:* the APG disclosure navigation pattern, as for any dropdown ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/)).
- *States:* `aria-expanded` on the More button; an item moved into it is the same element moved, or hidden in the bar and shown in "More", so each link appears once to assistive technology; `aria-current="true"` on the More button's section marker when the current page is inside.
- *Rules:* code-standard rule 20, code-standard rule 17, code-standard rule 64, code-standard rule 57 (how many fit is derived from measured widths, not a number fitted to today's labels), code-standard rule 14 (moving items keeps the focused link focused).
- *Detail:* [code: re-rendering without losing focus or scroll](../../code/javascript.md#re-rendering-without-losing-focus-or-scroll), [code: text expansion and no fixed widths on text](../../code/i18n.md#text-expansion-and-no-fixed-widths-on-text).

**Check**
- *Script:* could resize through a range of widths asserting the bar is one row at each, each link appears exactly once in the accessibility tree, the order of links (bar then "More") never changes, and "More" carries the current marker when it holds the current page.
- *Judgement:* Which sections would readers miss if they sat in "More", and are those the ones that stay in sight?

**Sources:** Friedman and Carbon as linked. Neither specifies the order rule; it follows from design-standard rule 2, so the toolkit moves items from the end and never reorders.

## Account menu

**Use when / don't use**
- Use for everything about the signed-in person: profile, their settings, billing they own, switching account, signing out. It is a menu of actions, not navigation, so it is an ARIA `menu`.
- Don't put product navigation in it: a page people visit for the work belongs in the bar or the sidebar.

**How**
- **One place, every page:** top-right on content sites and most tools (Carbon puts the account icon "second from the right" for "quick access to their account from anywhere", [Carbon UI shell header](https://carbondesignsystem.com/components/UI-shell-header/usage/)), or the sidebar's footer in an app whose sidebar is its frame ([sidebars: app sidebar](sidebars.md#app-sidebar-header-body-and-footer)). Never both.
- **The trigger:** the avatar, named by the person's name; in a sidebar footer, avatar, name and email, as shadcn's `nav-user` shows ([shadcn nav-user](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/blocks/sidebar-07/components/nav-user.tsx)).
- **Order:** an identity header (name and email, so the person knows which account this is), then the person's own pages (profile, settings, billing), then help, then "Switch account" when there are several ([authentication: switching accounts](authentication.md#switching-accounts)), and "Sign out" last, after a separator.
- **Sign out says what it ends.** GOV.UK One Login's sign out must "sign out of both your service and their GOV.UK One Login" and is labelled so ([GOV.UK One Login design recommendations](https://sign-in.service.gov.uk/documentation/design-recommendations/let-users-navigate-sign-out)); HMRC keeps it "inside the GOV.UK header, on the right hand side" ([HMRC sign out](https://design.tax.service.gov.uk/hmrc-design-patterns/sign-out)).

**Cases**
- The avatar opens a menu with no name or email → an identity header first.
- "Sign out" sits between "Profile" and "Settings" → last, after a separator.
- An avatar image with no name → the person's name as its accessible name.
- A content site with no menu at all, only "Sign out" → acceptable while the account has one destination; a menu once it has three.

**Accessibility**
- 1.1.1 (the avatar has a text alternative), 4.1.2, 2.4.7, 3.2.3 (the menu sits in the same place on every page).

**Build**
- *Elements:* a `button` holding the avatar `img` with `alt` naming the person, or the name as visible text; a `ul` of items.
- *ARIA and keyboard:* [APG menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/): `aria-haspopup="menu"`, `aria-expanded`; Enter, Space or Down open it and focus the first item; Escape closes and returns focus. The identity header is not an item: it sits outside the `menu` or as a `presentation` row.
- *States:* `aria-expanded` on the trigger.
- *Rules:* code-standard rule 18 (an avatar-only trigger is named), code-standard rule 20 ("Sign out" is a POST form that works without script).
- *Detail:* [actions: split buttons and overflow menus](actions.md#split-buttons-and-overflow-menus).

**Check**
- *Script:* could open the account menu on each page type and assert it is in the same place, names the account, and ends with "Sign out".
- *Judgement:* Is everything in this menu about the person, not the product?

**Sources:** Carbon, shadcn, GOV.UK One Login and HMRC as linked. Products differ on top-right versus sidebar footer; the toolkit asks for one place.
