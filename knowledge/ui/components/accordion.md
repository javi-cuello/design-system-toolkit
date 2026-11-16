# Accordion

An accordion stacks headed sections whose content the person opens and closes in place; a `details` element is its one-section form. This page owns both as components, in design, in Figma and in code: when to use them, how they open, their headers and their markup. What spans components stays in [`../patterns/disclosure.md`](../patterns/disclosure.md): show more and truncation, how deep disclosure goes, expandable table rows, and [tabs or an accordion on small screens](../patterns/disclosure.md#tabs-or-accordion-on-small-screens). Related: [tabs](tabs.md), [sidebars: nesting and expandable groups](../patterns/sidebars.md#nesting-and-expandable-groups), [navigation](../patterns/navigation.md).

## Overview

**Use when / don't use**
- [weak] An accordion for several independent sections of which most people need one or two; a page with headings when they read most of it ([accordions](#accordions)).
- [weak] A `details` for one section of help that only some people need ([details and summary](#details-and-summary)).

**Anatomy**
- [strong] A group of items, each a header and a panel; the header is a button inside a heading, holding the title and a chevron at its end. The APG, Figma's Simple Design System (`Title` and the content), MUI (`AccordionSummary` with `expandIcon`, its heading an `h3` by default) and Carbon (`title`) build it so ([APG accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/), [SDS AccordionItem.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/accordion/AccordionItem.figma.ts), [MUI Accordion types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Accordion/Accordion.d.ts), [Carbon AccordionItem source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Accordion/AccordionItem.tsx)).
- [required] The chevron's side is `Trailing` or `Leading`, never left or right; Carbon's `align` takes `'start' | 'end'` ([Carbon Accordion source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Accordion/Accordion.tsx); figma-standard rule 21).
- [required] The whole header is the target, at least 24 by 24 CSS pixels, with a focus ring (WCAG 2.5.8 and 2.4.7; figma-standard rules 26 and 39).

## Accordions

**Use when / don't use**
- [weak] Several independent sections of which most people need one or two: FAQs, product details, reference sections, settings groups on a narrow screen. NN/g's [accordions on desktop](https://www.nngroup.com/articles/accordions-on-desktop/): use them "When users need only a few pieces of information on the page" and when sections are "independent and users are unlikely to need simultaneous access".
- [moderate] Not when people will read most of it. Carbon's [accordion](https://carbondesignsystem.com/components/accordion/usage/): "If a user is likely to read all of the content, then don't use an accordion as it adds the burden of an extra click; instead use a full scrolling page with normal headers."
- [moderate] Not for little content (NN/g: closed accordions make a short page "look mostly empty"), for deep hierarchies, for a series of questions (GOV.UK), or for anything everyone needs.
- [weak] Test the page without one first. GOV.UK's [accordion](https://design-system.service.gov.uk/components/accordion/): "Test your content without an accordion first", and prefer simplifying, splitting pages, headings on one page, or anchor links.

**How**
- [weak] **Accordion, tabs or a long page.** GOV.UK's decision: an accordion when the person needs more than one section at a time or there are many sections (they stack vertically); tabs when they switch quickly between few sections; one section of short, less important content is a `details`. A long page with headings and an "On this page" list when they read in order ([`navigation.md`](../patterns/navigation.md), *In-page navigation*).
- [moderate] **Start closed.** Carbon: "Accordions begin by default in the collapsed state with all content panels closed", which gives "a high level overview". NN/g's [accordions on mobile](https://www.nngroup.com/articles/mobile-accordions/) found an expanded first section hid the page's structure. Open a section at start only when evidence says most visitors need it, or when the address targets it.
- [strong] **Allow several open.** Carbon: "allowing for multiple sections to be open at once." NN/g: "Allow users to open or collapse multiple sections at a time"; auto-closing others stops people combining information. Exclusive groups (`details name`) only when sections are alternatives, such as one payment method at a time.
- [weak] **Expand all.** Offer "Show all sections" when there are many sections or people print; NN/g recommends it, and for printing to expand all.
- [strong] **Headings inside headings.** Each header is a button inside a heading whose level fits the page outline (W3C [accordion pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/); GOV.UK uses `h2` and asks you to change the level to fit; Carbon: "Each title should be wrapped in a role heading"). Panels may contain sub-headings; never an accordion inside an accordion (GOV.UK).
- [weak] **Header text**: short, describes what will show, sentence case (GOV.UK: "Write the heading and summary line like any other button text"). A summary line only if needed, kept very short.
- [moderate] **Signifier**: a chevron or plus at the end of the header; NN/g found "the caret and the plus work best"; Carbon puts it at the end so titles align with other text. Whole header clickable.
- [moderate] **Scrolling**: the page scrolls, never the panel (Carbon: "Content should not scroll inside of an individual panel"). Don't scroll the opened section to the top: NN/g saw users think a new page had loaded and press Back. For a long open panel on mobile, a sticky header lets people close it (NN/g's Amazon example).
- [weak] **State**: GOV.UK remembers open sections within the session; with JavaScript off, all content shows under headings (code-standard rule 20).
- [weak] **Empty sections**: GOV.UK says "Do not disable sections"; remove the section, or explain inside it why it is empty.

**Cases**
- A product page with Description, Specifications, Delivery, Returns → an accordion, all closed, several may open; Delivery may start open if most visitors ask about it.
- An application-requirements page people read end to end → headings on one page with an "On this page" list (NN/g's university example).
- An FAQ of 30 questions → an accordion of questions with "Show all sections", or grouped under headings with an accordion per group.
- An accordion inside an accordion for a course structure → one level of accordion with sub-headings inside panels, or a tree view (Carbon) for real hierarchy.
- A section with no content for this user → remove it, or open to "No invoices yet" (GOV.UK). Note this differs from a filter option at zero, which design-standard rule 5 keeps visible and disabled.

**Accessibility**
- [required] 4.1.2 Name, Role, Value: each header button exposes `aria-expanded`; the W3C pattern lets the button be "the only element inside the heading element".
- [required] 1.3.1 Info and Relationships and 2.4.6 Headings and Labels: headers are real headings at the right level; markup is code-standard rule 1.
- [required] 2.1.1 Keyboard: Enter and Space toggle; every header is in the Tab sequence (W3C).
- [weak] The W3C advises `role="region"` on panels except when more than about six can be open at once, to avoid landmark proliferation.
- [required] Hidden panels are hidden from assistive technology too; `hidden` must beat the stylesheet (code-standard rule 17).

**Build**
- [strong] Each header is a `button type="button"` with `aria-expanded` and `aria-controls`, the only child of a heading at the outline's level; Enter and Space toggle, every header is a tab stop ([APG accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/); the snippet is [HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- [weak] Panels use `hidden="until-found"`, so find-in-page and a fragment link open them; listen for `beforematch` to set `aria-expanded` ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).
- [required] The server renders headings and open panels; the script adds the buttons and hides panels when it starts, so no script reads as a headed page (code-standard rule 20).
- [weak] `role="region"` with `aria-labelledby` on panels only up to about six that can be open at once (APG).
- [required] Open state is styled from `[aria-expanded="true"]`, the chevron rotated by that selector; an "Expand all" button sets every header in one handler (code-standard rule 9).
- [weak] Open sections persist in `sessionStorage` keyed by panel `id`, read before first paint to avoid a jump; a targeted fragment wins.

**Check**
- *Script* could: for each `aria-expanded` header, assert it is a button inside a heading, toggles its panel, and the heading levels fit the outline; assert every panel's content is present with scripts off (code-standard rule 20); flag an accordion nested in another.
- *Judgement*: would most visitors open most sections? If so, it should be a page with headings.

**Sources.** The W3C allows single-open accordions; Carbon, NN/g and GOV.UK default to several open. The toolkit allows several, because auto-closing breaks comparison and printing. NN/g's 2014 [desktop accordion article](https://www.nngroup.com/articles/accordions-complex-content/) argues long pages are often better on desktop; the toolkit agrees and treats the accordion as the exception there.

## Details and summary

**Use when / don't use**
- [weak] One section of help or detail that only some people need, below the content it explains. GOV.UK's [details](https://design-system.service.gov.uk/components/details/): "Use the details component instead of tabs or an accordion if you only have 1 section of content."
- [weak] Not for information most people need: "Do not use the details component to hide information that the majority of your users will need" (GOV.UK).
- [required] Not as a menu or popover without adding Escape and click-outside (code-standard rule 19).

**How**
- [required] Native `details` and `summary` first: open state and keyboard come free, and content shows without scripts (code-standard rules 8 and 20).
- [weak] **Summary text**: short and descriptive, so people can tell if they need it (GOV.UK: "Make the link text short and descriptive"), such as "Help with nationality". Never "More" or "Click here".
- [moderate] **Signifier**: a triangle or chevron next to descriptive text. Primer's [progressive disclosure](https://primer.style/product/ui-patterns/progressive-disclosure/): "Pair progressive disclosure icons with descriptive text"; text-only toggles are discouraged. Apple's [disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls): "Provide a descriptive label… like 'Advanced Options.'"
- [weak] **Visual weight**: less prominent than an accordion (GOV.UK), so reserve it for secondary help.
- [moderate] **Exclusive groups**: `details` elements sharing a `name` let only one open at a time (MDN [`details`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details)); use that only for true alternatives.
- [weak] **Advanced options**: Apple puts the controls people most use at the top level and hides advanced ones behind one disclosure; "Use no more than one disclosure button in a single view."

**Cases**
- A form question with a "Why we ask this" explanation → a `details` under the field.
- Four `details` stacked as a pseudo-accordion → use the accordion pattern, with headings.
- A `details` used as a dropdown menu that stays open after a click elsewhere → add click-outside and Escape, or use a popover (code-standard rule 19).
- An "Advanced settings" `details` holding the one setting most people change → move that setting out.

**Accessibility**
- [required] 4.1.2: `summary` is exposed as a button with expanded state natively. GOV.UK's research notes some voice-control users may need to call it a button, and some people avoid clicking because they expect it to navigate; descriptive text and a triangle help.
- [required] 2.4.6: the summary text describes what opens.

**Build**
- [required] Native `details` and `summary`: open state, keyboard and the expanded state come free; `open` is the state attribute to style from (`details[open] > summary::before`) ([HTML semantics: *Disclosure, dialogs and popovers*](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).
- [moderate] A shared `name` makes an exclusive group with no script; use it only for alternatives.
- [weak] The marker is replaced by a drawn triangle on `summary` (`list-style: none`, plus `::-webkit-details-marker { display: none }`), kept beside the text (code-standard rule 22 for its colour).
- [required] Floating as a menu needs Escape and click-outside added, or a `popover` instead (code-standard rule 19; [accessibility: *Menus, menu buttons and toolbars*](../../code/accessibility.md#menus-menu-buttons-and-toolbars)).
- [required] Nothing interactive inside `summary` but its text; a link there competes with the toggle (code-standard rule 8).

**Check**
- *Script*: code-standard rule 19 is checked in `tools/parity/pages.mjs` for floating `details`. Could: flag `summary` with fewer than two words or generic text; flag more than one advanced-options disclosure in a view.
- *Judgement*: would most people need what is inside?

**Sources.** GOV.UK styles the summary as a link; Primer and Apple pair an icon with text. The toolkit pairs a triangle or chevron with descriptive text, which addresses GOV.UK's own research finding that link styling makes some people expect navigation.

## In Figma

**Layers**
- [required] `Accordion` holds `Accordion item` parts in an `Items slot`: an item has an Open variant, and per-item text in a nested instance is dropped when it switches (figma-standard rules 9, 21 and 38). The Simple Design System's `Accordion` takes its `Accordion Item` instances as children the same way ([SDS Accordion.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/accordion/Accordion.figma.ts)).
- [required] Auto layout throughout; the item's layers are named for their role, `Header` holding `Title` and `Chevron`, then `Panel` (figma-standard rules 10 and 33).
- [required] The `Chevron` sits at the header's trailing end by auto layout. A library that also offers Carbon's start alignment draws the side as a `Chevron position` variant, `Trailing` first, then `Leading`, never `Left` or `Right` (figma-standard rules 1 and 21).
- [weak] The panel's content is a slot, `Slot`, since a panel holds anything; the Simple Design System's `Content` text property holds text only ([SDS AccordionItem.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/accordion/AccordionItem.figma.ts); figma-standard rule 21).

**Properties**
- [required] `Title` is a text property, the name SDS gives it and the `title` prop of SDS and Carbon (figma-standard rules 21 and 37).
- [required] Every property drives a layer in every variant where that layer exists (figma-standard rule 30).

**Variants and states**
- [strong] On the item, the axes run `Size → Chevron position → Open → Disabled → State`, each where the library draws it; `Open` is a True/False variant, a bare word, `False` first (figma-standard rules 1 and 21); code holds it as a prop beside the states: MUI's `expanded`, Carbon's `open`, React Aria's `isExpanded` ([React Aria Disclosure](https://react-aria.adobe.com/Disclosure)).
- [required] `State` runs `Rest → Focus → Hover → Press` on the header, each drawn differently, Focus with a ring (figma-standard rules 4, 31 and 39).
- [contested] `Disabled`: MUI, Carbon and React Aria each offer it on an item; GOV.UK says "Do not disable sections" ([accordions](#accordions)). Where the library draws it, it pairs only with Rest (figma-standard rule 2).
- [moderate] Each item owns its `Open`, so several can be open at once, as the toolkit's accordion allows ([accordions](#accordions)); the parent cannot set the variant of what fills its slot (figma-standard rule 38).
- [required] Sizes, where the accordion has them, are `Size` with t-shirt values, largest first; Carbon's takes `sm`, `md`, `lg` (figma-standard rule 6).

**Tokens**
- [required] Every fill, stroke, padding and gap is bound to a semantic variable, never a primitive; the title takes a text-role token (figma-standard rules 24, 28 and 29).
- [required] Open and each state bind their own tokens (figma-standard rule 48).
- [required] Where the project has component tokens, they are named `Component/Accordion/<Element>/<property>[-<variant>][-<state>]` and alias semantic ones (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on both sets.
- *Judgement*: does a closed accordion still show the page's structure at a glance?

**Sources.** Figma's Simple Design System for the parts and names; MUI, Carbon and React Aria for the open state and Disabled; GOV.UK against Disabled. The panel as a slot is the toolkit's reasoning.

## In code

**Element**
- [required] A `details` and `summary` for one section; for an accordion, each header a `button` with `aria-expanded` inside a heading, and a panel the script hides (code-standard rules 8 and 20; [accordions](#accordions), [details and summary](#details-and-summary)).

**Props**
- [strong] An item takes its title, its open state, controlled and uncontrolled, and `disabled`: MUI (`expanded`, `defaultExpanded`, `disabled`), Carbon (`open`, `title`, `disabled`), React Aria (`isExpanded`, `defaultExpanded`, `isDisabled`) and SDS (`title`) ([MUI Accordion types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Accordion/Accordion.d.ts), [Carbon AccordionItem source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Accordion/AccordionItem.tsx), [React Aria Disclosure](https://react-aria.adobe.com/Disclosure)).
- [contested] Whether several may open: React Aria's group defaults `allowsMultipleExpanded` to false ([useDisclosureGroupState source](https://github.com/adobe/react-spectrum/blob/main/packages/react-stately/src/disclosure/useDisclosureGroupState.ts)); the toolkit's accordion allows several by default ([accordions](#accordions)).
- [moderate] The heading level is settable, since it must fit the page's outline: MUI's `heading` slot renders an `h3` unless told otherwise; GOV.UK asks for the level to fit ([accordions](#accordions)).

**From Figma**
- [required] Each Figma axis maps to one attribute or prop, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Items slot` | the items, children of the group |
  | `Title` | the header button's text, inside the heading |
  | `Slot` | the panel's content |
  | `Size` | `size` |
  | `Chevron position=Trailing`, `Leading` | `align="end"` or `"start"`, the chevron placed by flex order, so it mirrors |
  | `Open=True` | `aria-expanded="true"` and the panel shown; `open` on a `details` |
  | `Disabled=True` | `disabled` on the header button |
  | `State=Hover`, `Press` | `:hover`, `:active`, set by the browser |
  | `State=Focus` | `:focus-visible` |

**Check**
- *Script*: the parity loop compares each item's variants with their frames (design-code-parity); the checks in each section above cover the markup.
- *Judgement*: with scripts off, does the page read as headed sections?

**Sources.** MUI, Carbon, React Aria and SDS for the props; React Aria against the toolkit on several open; the toolkit's *Variants to attributes* for the mapping.
