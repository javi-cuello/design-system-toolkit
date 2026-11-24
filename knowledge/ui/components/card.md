# Card

A card is a container for a few related pieces of content about one subject: an item in a collection, a summary of one object, a figure on a dashboard. This page owns the card as a component, in design, in Figma and in code: when it earns its box, its parts and their order, links and actions on a card, grids of cards, its surface, its semantics and its states. What spans components stays elsewhere. Table, list or cards is [tables: *Table, list or cards*](../patterns/tables.md#table-list-or-cards). KPI tile content is [data: *KPI tiles*](../patterns/data.md#kpi-tiles). A table inside a card is [tables: *Tables in dialogs and dashboard cards*](../patterns/tables.md#tables-in-dialogs-and-dashboard-cards). Cards picked as options are [selection: *Option tiles*](../patterns/selection.md#option-tiles-and-picking-a-kind-in-a-dialog). Related: [button](button.md), [link](link.md), [badge](badge.md), [checkbox](checkbox.md).

## Overview

**Use when / don't use**
- [strong] One subject per card. Material: "Cards contain content and actions about a single subject" ([MDC Android Card](https://github.com/material-components/material-components-android/blob/master/docs/components/Card.md)). Fluent's card scaffolds content and actions for a single topic ([Fluent Card spec](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-card/library/docs/Spec.md)). React Spectrum: "A Card summarizes an object" ([React Spectrum Card](https://react-spectrum.adobe.com/Card)). NN/g: "a short representation of a conceptual unit" ([NN/g, cards](https://www.nngroup.com/articles/cards-component/)).
- [moderate] Not every block is a card. Shopify's migration guide: "Avoid wrapping every block in a card", and do not add "a wrapper only to reproduce a border" ([Polaris Card migration](https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react/card)). Atlassian says not to use elevation "to group content when a border or white space would suffice" ([visual: *Elevation, borders, radius and shape*](../design/visual.md#elevation-borders-radius-and-shape)).
- [moderate] Items people compare or search for go in a table or list, not cards. NN/g: cards are "a poor choice when users need to compare" and "less scannable than lists" ([NN/g, cards](https://www.nngroup.com/articles/cards-component/)). Basecamp added a list view because card titles got cut off and many cards felt overwhelming ([Basecamp list view, 2017](https://signalvnoise.com/svn3/new-in-basecamp-3-list-view-for-projects-and-teams/)). The full test is [tables: *Table, list or cards*](../patterns/tables.md#table-list-or-cards).

**Anatomy**
- [strong] A container holding, in reading order, a heading, optional media, body text, optional metadata or figures, and optional actions. The parts are named alike across systems:
  - Material: container, headline, subhead, supporting text, image, buttons ([MDC Android Card](https://github.com/material-components/material-components-android/blob/master/docs/components/Card.md)).
  - Primer: `Card.Icon`, `Card.Image`, `Card.Heading`, `Card.Description`, `Card.Metadata`, `Card.Action` ([Primer Card](https://primer.style/product/components/card/)).
  - Fluent: `CardHeader`, `CardPreview`, `CardFooter` ([Fluent Card spec](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-card/library/docs/Spec.md)).
  - Bootstrap: `.card-header`, `.card-img-top`, `.card-body`, `.card-title`, `.card-text`, `.card-footer` ([Bootstrap card](https://getbootstrap.com/docs/5.3/components/card/)).
- [moderate] A title that names the subject; whether it is a heading element is *Card semantics*. GOV.UK's summary card title "must be unique and help identify what the summary list describes" ([GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/)). Primer's `Card.Heading` labels the card when it is a section ([Primer Card accessibility](https://primer.style/product/components/card/accessibility/)).
- [required] A focus ring only when the card itself is a target, and a 24 by 24 target for each control inside it (WCAG 2.4.7 and 2.5.8; figma-standard rules 26 and 39).

## When a card earns its box

**Use when / don't use**
- [moderate] Use a card for an item in a collection people browse, each item a different mix of content. NN/g: "Cards work best for collections of heterogeneous items" and suit browsing over searching ([NN/g, cards](https://www.nngroup.com/articles/cards-component/)). React Spectrum's `CardView` "displays a group of related objects" ([React Spectrum CardView](https://react-spectrum.adobe.com/CardView)).
- [weak] Use a card to group several summary lists about the same kind of thing. GOV.UK uses summary cards for "multiple summary lists that all describe the same type of thing, such as people", and plain summary lists otherwise ([GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/)).
- [moderate] Use a plain section with a heading for a region of a page. Polaris replaced `Card` with `s-section` as "a normal page region", keeping a card for a reusable, action-oriented unit ([Polaris Card migration](https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react/card)). Primer's card renders a plain `div` unless asked to be a `section` ([Primer Card accessibility](https://primer.style/product/components/card/accessibility/)).
- [moderate] Don't use cards for a long homogeneous list or a table's rows. NN/g suggests "a standard vertical list" for very homogeneous items ([NN/g, cards](https://www.nngroup.com/articles/cards-component/)); Basecamp offers a list beside its project cards for the same reason (above).

**How**
- [weak] A card is a small entry point, not a page. Pickering: cards "shouldn't be miniature web pages" ([Inclusive Components, cards](https://inclusive-components.design/cards/)).
- [moderate] Spectrum splits one object from a collection: `Card` for one summarised object, `CardView` when many need selection, loading, empty states or bulk actions ([React Spectrum CardView](https://react-spectrum.adobe.com/CardView), [React Spectrum Card](https://react-spectrum.adobe.com/Card)). Carbon splits tiles by job in the same way: base, clickable, selectable and expandable ([Carbon tile](https://carbondesignsystem.com/components/tile/usage/)).

**Cases**
- A settings page draws each group of fields in its own bordered card → sections with headings; the border adds nothing a heading and space do not.
- Forty invoices as cards, each showing number, customer, amount and status → a table: every card shows the same four attributes and people compare amounts.
- A gallery of templates, each with a preview, a title and a line of text → cards: items are browsed and differ in content.
- Event types on a scheduling home page, each with a name, a duration, a copy-link action and a menu → cards, as Calendly draws them ([Calendly event types](https://calendly.com/help/how-to-organize-and-manage-your-event-types)).

**Accessibility**
- [required] 1.3.1: the grouping a card shows is in the markup too: a list item in a collection, a labelled region where it stands alone (*Card semantics*).

**Build**
- [required] A card is a visual component: a custom element with CSS and no script (code-standard rule 8, which names the card).
- [required] A box drawn only for its look is a plain `div` or custom element, never a semantic element chosen for its default style (code-standard rule 1).

**Check**
- *Script* could: count cards per page that hold no heading, or that sit alone with no siblings and no actions.
- *Judgement*: would a heading and white space do what the box does? Will anyone compare these items down a column?

**Sources.** NN/g, GOV.UK, Polaris, Primer, Spectrum and Carbon as linked. They agree a card holds one subject and is not the default wrapper for page regions.

## Content order and hierarchy

**Use when / don't use**
- [strong] Every card with more than a heading: the heading names the subject, the body supports it, and actions come last. Material, Primer, Fluent and Bootstrap all order heading before body and actions in a footer or corner (*Anatomy*).

**How**
- [moderate] The heading is the most prominent text; metadata and footer text are quieter. Material separates headline, subhead and supporting text; Bootstrap a title, subtitle and text; Primer a heading, a description and metadata (*Anatomy*).
- [contested] **Media before or after the heading in the source.** Two sides:
  - *Heading first, image moved up by CSS.* Pickering puts the image after the heading so heading navigation does not skip it, and restores the look with flex `order` ([Inclusive Components, cards](https://inclusive-components.design/cards/)); Roselli does the same with `order: -1` ([Roselli, block links](https://adrianroselli.com/2020/02/block-links-cards-clickable-regions-etc.html)).
  - *Image first in the source.* Bootstrap's `.card-img-top` comes before `.card-body` ([Bootstrap card](https://getbootstrap.com/docs/5.3/components/card/)); Primer renders `Card.Image` before the heading ([Card.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Card/Card.tsx)).
  - code-standard rule 2 allows the first only where the visual order must differ: the source is arranged for the reader and the stylesheet moves things.
- [moderate] A decorative image takes an empty `alt`; one that carries meaning takes a real one. Primer's `Card.Image` defaults to `alt=""` ([Primer Card accessibility](https://primer.style/product/components/card/accessibility/)); code-standard rule 18 says the same for any decorative image.
- [weak] Focus moves through a card's controls in its visual reading order (Primer, [Card accessibility](https://primer.style/product/components/card/accessibility/)).
- [weak] Primer places its one `Card.Action` in the top-right corner but last in the source, after heading, description and metadata ([Card.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Card/Card.tsx)).

**Cases**
- A card shows its date above its title in large type → the title leads; the date is metadata.
- A screen reader user jumps by heading and lands past each card's image and badge → put the heading first in the source and move the image up visually, or accept the image first and keep it decorative.
- A title clamps to one line and loses the end → let it wrap; Basecamp's cut-off titles were a reason for its list view (*Overview*).

**Accessibility**
- [required] 1.3.2 Meaningful Sequence and 2.4.3 Focus Order: the source order is the reading order (code-standard rule 2).
- [required] 1.1.1: an informative image has a text alternative, a decorative one `alt=""` (code-standard rule 18; [html-semantics: *Images and alt*](../../code/html-semantics.md#images-and-alt)).

**Build**
- [required] Parts in source order; any visual reorder uses `order` or grid placement on media only, never on the heading or actions (code-standard rule 2).
- [required] Title text wraps; a clamp has a way to read the rest ([responsive: *Truncation and line clamps*](../../code/responsive.md#truncation-and-line-clamps); code-standard rule 57).

**Check**
- *Script* could: compare each card's DOM order with its visual order and flag a heading that is not the first text.
- *Judgement*: read only the heading of each card: is the subject clear?

**Sources.** Pickering and Roselli move the image after the heading; Bootstrap and Primer keep it first. Both are shipped; code-standard rule 2 decides which way a project leans.

## Links and actions on a card

**Use when / don't use**
- [contested] **A whole-card target, or separate controls.** Two sides:
  - *A clickable card holds no other control.* Carbon: "Clickable tiles cannot contain separate internal CTAs" ([Carbon tile](https://carbondesignsystem.com/components/tile/usage/)). Fluent: "Cards that have multiple actions within them cannot be clickable" ([Fluent Card spec](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-card/library/docs/Spec.md)). Bootstrap: "Multiple links and tap targets are not recommended with stretched links" ([Bootstrap stretched link](https://getbootstrap.com/docs/5.3/helpers/stretched-link/)).
  - *A clickable card with a secondary control.* NN/g describes cards that link anywhere plus "secondary call-to-action buttons or links" ([NN/g, cards](https://www.nngroup.com/articles/cards-component/)). React Spectrum's card takes an `href` with an `ActionMenu` inside ([React Spectrum Card](https://react-spectrum.adobe.com/Card)). Roselli keeps the extra control's hit area clear of the block link ([Roselli, block links](https://adrianroselli.com/2020/02/block-links-cards-clickable-regions-etc.html)).
- [weak] A whole-card target helps on touch and mouse. NN/g: "This larger touch zone substantially improves usability" ([NN/g, cards](https://www.nngroup.com/articles/cards-component/)).

**How**
- [moderate] **Never wrap the card in one `a`.** Everything in the card becomes the link's name. Pickering: "all of the card contents form the label of the link" ([Inclusive Components, cards](https://inclusive-components.design/cards/)). Roselli: "the entire string is read when tabbing", and voice users cannot tell what to say ([Roselli, block links](https://adrianroselli.com/2020/02/block-links-cards-clickable-regions-etc.html)).
- [strong] **Stretch the title's link instead.** The title is the one link; its `::after` covers the card. Pickering, Roselli and Bootstrap's `.stretched-link` document it ([Bootstrap stretched link](https://getbootstrap.com/docs/5.3/helpers/stretched-link/)); Primer ships it as `fullCardHitArea` on its card link and card button ([Card.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Card/Card.tsx)).
- [moderate] **The stretched link stops text selection.** Pickering: "it's now difficult to select the text within the card"; Roselli: the approach "prevents selecting the text". Pickering's workaround times a press, with "a 200 millisecond threshold", and needs script.
- [moderate] **Other controls sit above the stretched link.** Raise them with `position: relative` and a `z-index`, and keep their hit areas apart (Roselli; Bootstrap's "some `position` and `z-index` styles can help").
- [weak] A "Read more" line that repeats the title link is decorative, hidden from assistive technology, so it adds no tab stop (Pickering).
- [moderate] **Each action's name says which card it acts on.** GOV.UK adds the card title as visually hidden text after each card action ([GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/)). Primer asks for a label that names the card, "More options for Project Alpha", not "More options" ([Card.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Card/Card.tsx)).
- [weak] Few actions per card. GOV.UK: "do not add more than 2 to 3 actions in a header". Pickering: "Only add tab stops where beneficial".
- [strong] One primary action per view, not one per card; ten cards do not get ten filled buttons ([button: *Button hierarchy*](button.md#button-hierarchy)).

**Cases**
- A card wrapped in `<a>` is read as "link, Quarterly report, 12 pages, updated 3 Oct, by Ana, Download" → link the title, stretch it, and keep Download as its own button.
- A "Delete" button inside a stretched-link card opens the card's page → raise the button above the link's `::after`, or move delete into the detail page.
- Six cards each end in "View" → link each title; "View" six times is noise in a links list ([content](../design/content.md#button-and-link-labels)).
- Actions appear only on hover, as Calendly's event type cards reveal quick actions ([Calendly event types](https://calendly.com/help/how-to-organize-and-manage-your-event-types)) → reveal them on focus too ([interaction: *Hover-only affordances*](../design/interaction.md#hover-only-affordances)).
- People want to copy a phrase from a stretched-link card and cannot → link the title only, or accept the trade and say so.

**Accessibility**
- [required] HTML: an `a` has "no interactive content descendant", so a button or link inside a link is invalid ([HTML `a`](https://html.spec.whatwg.org/multipage/text-level-semantics.html#the-a-element)). axe's `nested-interactive` flags it: nested controls "are not announced by screen readers" (WCAG 4.1.2, [axe](https://dequeuniversity.com/rules/axe/4.10/nested-interactive)).
- [required] 2.4.4 Link Purpose: the title link's text says where it goes. 2.5.3 Label in Name: an action's accessible name starts with its visible words.
- [required] 2.4.7 Focus Visible: a stretched link shows focus on the card, not on a title that may be small.

**Build**
- [strong] One real link from the heading, stretched over the card; the card is the containing block:
  ```html
  <li><ds-card>
    <h3><a href="/reports/q3">Quarterly report</a></h3>
    <p>12 pages, updated 3 Oct</p>
    <button type="button">Download <span class="visually-hidden">Quarterly report</span></button>
  </ds-card></li>
  ```
  ```css
  ds-card { position: relative; }
  ds-card > h3 > a::after { content: ""; position: absolute; inset: 0; }
  ds-card > :is(button, a):not(h3 a) { position: relative; z-index: 1; }
  ```
  Bootstrap warns that a `transform` on an ancestor narrows the area, and `position: relative` on the link itself breaks it ([Bootstrap stretched link](https://getbootstrap.com/docs/5.3/helpers/stretched-link/)).
- [moderate] The focus ring draws on the card: Primer moves it to the `::after` and drops it from the link ([Card.module.css](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Card/Card.module.css)); Pickering styles the card with `:focus-within`. One ring at a time (code-standard rule 66).
- [required] A real `a href`, never a click handler on the card; modified clicks go to the browser (code-standard rules 20 and 21; [html-semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- [required] An action's hidden context is a visually hidden span, part of its name ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).

**Check**
- *Script* could: flag an `a` that contains a heading and other text blocks; flag interactive content inside an `a` (axe `nested-interactive`); flag a card with a click handler and no `a href`; flag several cards whose actions share one accessible name.
- *Judgement*: tab through a card: how many stops, and does each say which card it belongs to?

**Sources.** Carbon, Fluent and Bootstrap keep a clickable card free of other controls; NN/g, Spectrum and Roselli allow one beside the link. All agree the link is a real `a` and that one wrapping `a` reads badly.

## Cards in a grid

**Use when / don't use**
- [contested] **Equal heights in a row, or heights that vary.** Two sides:
  - *Equal.* Carbon: tiles "are the same in height and width as all other tiles in the group" ([Carbon tile](https://carbondesignsystem.com/components/tile/usage/)). Bootstrap: "When you need equal height, add `.h-100` to the cards" ([Bootstrap card](https://getbootstrap.com/docs/5.3/components/card/)). Polaris's card sets `minHeight="100%"` ([Card.tsx](https://raw.githubusercontent.com/Shopify/polaris-react/main/polaris-react/src/components/Card/Card.tsx)).
  - *Varying.* NN/g: heights can vary but "typically the width is fixed" ([NN/g, cards](https://www.nngroup.com/articles/cards-component/)). React Spectrum's `CardView` offers a `waterfall` layout beside `grid` ([React Spectrum CardView](https://react-spectrum.adobe.com/CardView)).

**How**
- [moderate] Columns come from the container's width, and cards stack to one column on a phone. Bootstrap's grid example runs `row-cols-1 row-cols-md-3` ([Bootstrap card](https://getbootstrap.com/docs/5.3/components/card/)). Polaris rounds its card only above the `sm` breakpoint (`roundedAbove`), so it runs edge to edge on a phone ([Card.tsx](https://raw.githubusercontent.com/Shopify/polaris-react/main/polaris-react/src/components/Card/Card.tsx)).
- [weak] An open-ended collection wraps by width with `auto-fill`; a fixed strip takes its columns from its count ([responsive: *Grids that fill their rows*](../../code/responsive.md#grids-that-fill-their-rows)).
- [weak] The gap between cards is larger than the padding inside them, so each card reads as one unit ([visual: *Spacing scale and proximity*](../design/visual.md#spacing-scale-and-proximity)).
- [weak] Carbon sets a floor: "The minimum tile height is a 2:1 aspect ratio" ([Carbon tile](https://carbondesignsystem.com/components/tile/usage/)).

**Cases**
- One card has a two-line title and its row neighbours look short → let the grid stretch the row; no fixed height.
- Three cards across at 320px wide, each 90px wide → one column below the breakpoint.
- A card list of seven at four per row leaves three on the last row → fine for an open-ended collection; a fixed strip of figures is [data: *KPI tiles*](../patterns/data.md#kpi-tiles).

**Accessibility**
- [required] 1.4.10 Reflow: at 320 CSS pixels wide the grid is one column, with no sideways scroll.
- [required] 1.3.2: grid placement keeps DOM order; no `order` reorders whole cards (code-standard rule 2).

**Build**
- [required] CSS grid, whose rows stretch their items by default, so equal heights need no fixed height (code-standard rule 57; [responsive: *Grids that fill their rows*](../../code/responsive.md#grids-that-fill-their-rows)).
- [moderate] The card fills its grid cell, so equal rows give equal cards: Polaris sets `minHeight="100%"` and Bootstrap `.h-100` (sources above).
- [weak] Column count by container query where the grid lives in a panel ([responsive: *Container queries*](../../code/responsive.md#container-queries)).

**Check**
- *Script* could: at each project width, read card heights per row and flag a row with differing heights where the project chose equal; flag sideways scroll at 320px.
- *Judgement*: does each card read as one unit at a glance, and the grid as many?

**Sources.** Carbon, Bootstrap and Polaris equalise heights; NN/g and Spectrum allow a waterfall. All reflow to one column on a phone.

## Summary and stat cards

**Use when / don't use**
- [weak] A figure on a dashboard, with its label, unit and period: the content rules are [data: *KPI tiles*](../patterns/data.md#kpi-tiles), which this page does not restate.
- [weak] A summary of one record's fields, with actions on the whole record. GOV.UK's summary card holds a summary list under a title, with card actions "in bold text to make them visually distinct from row actions" ([GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/)).

**How**
- [weak] Label, figure, unit and comparison follow [data: *KPI tiles*](../patterns/data.md#kpi-tiles): the label above, the figure largest, the unit stated once.
- [weak] A stat card that leads somewhere is one link holding label and figure, as [data: *KPI tiles*](../patterns/data.md#kpi-tiles)' Build shows.
- [weak] GOV.UK adds the card title as hidden text after each card action, so "Change" says which card ([GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/)).

**Cases**
- A stat card reads "42" over "Total" → "42 open findings" with the period, as [data: *KPI tiles*](../patterns/data.md#kpi-tiles) asks.
- Three people's details, each a summary list under its own name with "Remove" → three summary cards, the name as each title.

**Accessibility**
- [required] 1.3.1: label and figure are associated, as a `dt` and `dd` or a heading and its value ([data: *KPI tiles*](../patterns/data.md#kpi-tiles)).

**Build**
- [required] The figure and label are a `dl` inside the card; a summary card's rows are a `dl` too ([html-semantics: *Lists, description lists and figures*](../../code/html-semantics.md#lists-description-lists-and-figures); code-standard rule 1).

**Check**
- *Script* could: flag a stat card whose figure has no label in its accessible text.
- *Judgement*: does each figure say what it counts, and over what period?

**Sources.** The content rules are [data: *KPI tiles*](../patterns/data.md#kpi-tiles)'s; GOV.UK's summary card is the one source read for a card around a summary list.

## Surface: border, fill or shadow

**Use when / don't use**
- [moderate] A card separates from its page by one of three means: a border, a fill one step from the page, or a shadow. Material ships outlined, filled and elevated cards ([MDC Android Card](https://github.com/material-components/material-components-android/blob/master/docs/components/Card.md)); Fluent `outline`, `filled`, `filled-alternative` and `subtle` ([Card.types.ts](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/library/src/components/Card/Card.types.ts)).
- [moderate] Shadows for cards that move or float, not for every card. Atlassian reserves raised cards "for cards that can be moved, such as Jira and Trello cards", and says "To create flat cards, pair with a border" ([Atlassian elevation](https://atlassian.design/foundations/elevation)). Carbon tiles take no shadow: do not "add a drop shadow to tiles" ([Carbon tile](https://carbondesignsystem.com/components/tile/usage/)).

**How**
- [contested] **A resting shadow on every card.** Primer's card draws a border and `shadow-resting-small`, with a `shadow` prop to turn it off ([Card.module.css](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Card/Card.module.css)); Polaris wraps every card in a `ShadowBevel` ([Card.tsx](https://raw.githubusercontent.com/Shopify/polaris-react/main/polaris-react/src/components/Card/Card.tsx)). Atlassian and Carbon keep resting cards flat (above).
- [required] In forced colours, `box-shadow` computes to none, so a card drawn only by shadow loses its edge ([CSS Color Adjust 1](https://www.w3.org/TR/css-color-adjust-1/#forced-colors-properties)).
- [weak] Shadows show less in dark mode. Atlassian: "Shadows can be harder to see in dark mode, so dark mode elevations also rely on different surface colors" ([Atlassian elevation](https://atlassian.design/foundations/elevation)). The surface levels are [visual: *Surfaces and elevation levels*](../design/visual.md#surfaces-and-elevation-levels).
- [strong] Padding is a few named steps, not a free number. Primer: `none`, `condensed` (8px), `regular` (16px), `spacious` (24px) ([Card.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Card/Card.tsx)). React Spectrum: `density` of `compact`, `regular`, `spacious` ([React Spectrum Card](https://react-spectrum.adobe.com/Card)). Polaris: `padding` from its space scale, responsive by breakpoint ([Card.tsx](https://raw.githubusercontent.com/Shopify/polaris-react/main/polaris-react/src/components/Card/Card.tsx)).
- [moderate] Media runs edge to edge with the padding off: Primer's `Card.Image` runs edge to edge ([Primer Card](https://primer.style/product/components/card/)); Polaris's guide uses `padding="none"` with an inset box for edge-to-edge content ([Polaris Card migration](https://shopify.dev/docs/apps/build/app-home/migrate-from-polaris-react/card)).
- [strong] The radius is the container role's, and nested shapes are concentric ([visual: *Elevation, borders, radius and shape*](../design/visual.md#elevation-borders-radius-and-shape)).

**Cases**
- White cards with a faint shadow on a white page → the top edge vanishes; add a border or move the page one step darker ([visual: *Elevation, borders, radius and shape*](../design/visual.md#elevation-borders-radius-and-shape)).
- Cards inside a sidebar of the card colour → in dark the cards disappear; see [visual: *Surfaces and elevation levels*](../design/visual.md#surfaces-and-elevation-levels).
- A dashboard of flat cards gets shadows "for depth" → the cards do not move; keep them flat with a border.

**Accessibility**
- [required] 1.4.11 Non-text Contrast applies to a card's edge only when the card is a control (a clickable or selectable card); a static card's border is decorative.
- [required] Forced colours: a card keeps an edge without its shadow (above).

**Build**
- [required] The surface is an `appearance` attribute (figma-standard rule 1), each value reading tokens for fill, border and shadow (code-standard rules 9 and 22; [tokens: *Three tiers*](../../code/tokens.md#three-tiers)).
  ```css
  ds-card { border: var(--card-border, 1px solid var(--colour-border-neutral-subtle)); }
  ds-card[appearance="elevated"] { box-shadow: var(--shadow-resting); }
  ```
- [moderate] A shadowed card keeps a border, so forced colours still draw an edge ([CSS Color Adjust 1](https://www.w3.org/TR/css-color-adjust-1/#forced-colors-properties); Primer pairs border and shadow).
- [required] Padding is an attribute over spacing tokens; a caller's change goes through a custom property (code-standard rules 22 and 38; [tokens: *Spacing tokens*](../../code/tokens.md#spacing-tokens)).

**Check**
- *Script* could: render the page in forced colours and flag a card with no visible edge; flag a card padding that is no token.
- *Judgement*: in dark mode, can you see each card's edge without its shadow?

**Sources.** Material and Fluent ship the three treatments; Atlassian and Carbon keep resting cards flat, while Primer and Polaris shadow them. The CSS spec settles forced colours.

## Card semantics: list, region and heading

**Use when / don't use**
- [moderate] Cards in a collection are items of a list. Pickering groups cards in a list, since screen readers announce the item count ([Inclusive Components, cards](https://inclusive-components.design/cards/)). Primer: "place each `Card` inside a list item (`<li>`)" ([Primer Card accessibility](https://primer.style/product/components/card/accessibility/)).
- [weak] A card that stands alone as a region of the page is a `section` labelled by its heading. Primer's `as="section"` wires `aria-labelledby` to `Card.Heading` ([Primer Card accessibility](https://primer.style/product/components/card/accessibility/)).

**How**
- [contested] **A heading inside each card in a list.** Two sides:
  - *Yes.* Pickering gives each card an `h2`, since cards "belong to a flat list hierarchy" ([Inclusive Components, cards](https://inclusive-components.design/cards/)). GOV.UK's summary card examples use an `h2` title ([GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/)). Bootstrap's `.card-title` goes on "a `<h*>` tag" ([Bootstrap card](https://getbootstrap.com/docs/5.3/components/card/)).
  - *No.* Primer: "Do not use heading elements … inside list-item Cards", as they create "redundant and unnecessary structure" ([Primer Card accessibility](https://primer.style/product/components/card/accessibility/)).
- [moderate] The heading level fits the page outline, not the card's look. Primer's `Card.Heading` defaults to `h3` and takes `h2` to `h6`, without skipping levels; Bootstrap's examples use `h5` styled by class (sources above; [visual: *Typography*](../design/visual.md#typography)).
- [moderate] No landmark per card in a list. Primer: cards in a list "must not introduce additional landmark regions". Fluent gives every card `role="group"`, which is not a landmark ([useCard.ts](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/library/src/components/Card/useCard.ts)).
- [weak] No card source read renders `article`: Primer renders `div` or `section`, Fluent a `div`.

**Cases**
- Twelve project cards each as `<section aria-label>` → twelve landmarks in the landmarks list; a `ul` of `li` instead.
- Card titles are `h5` because the design shows them small → the level follows the outline; the size is a style.
- A dashboard's "Open findings" card stands alone → a `section` labelled by its `h2`.

**Accessibility**
- [required] 1.3.1 and 2.4.6: headings and lists in the markup match what the page shows; a `section` becomes a region landmark only with an accessible name ([html-semantics: *Landmarks*](../../code/html-semantics.md#landmarks)).

**Build**
- [required] A collection is `ul` of `li`, each holding one card; a `role="list"` restores list semantics where list styling is removed ([html-semantics: *Lists, description lists and figures*](../../code/html-semantics.md#lists-description-lists-and-figures)).
- [required] The heading level is a prop the caller sets from the outline, never fixed by the component (code-standard rule 1; [html-semantics: *Headings and the outline*](../../code/html-semantics.md#headings-and-the-outline)).
- [required] A standalone card region is a `section` with `aria-labelledby` pointing at its heading (code-standard rule 1).

**Check**
- *Script* could: flag a heading level skip inside a card; flag a run of sibling cards not inside a list; count landmarks made by cards.
- *Judgement*: navigate by heading: does each card's heading land where a reader expects?

**Sources.** Pickering, GOV.UK and Bootstrap put a heading in each card; Primer forbids one in a list item. All agree on a list for a collection.

## States and the empty card

**Use when / don't use**
- [strong] A static card has no interactive states. Carbon lists enabled, hover, focus and disabled for clickable tiles, adding selected for selectable ones ([Carbon tile](https://carbondesignsystem.com/components/tile/usage/)); Compose's `Card` "does not accept click events" unless given `onClick` ([Compose Card](https://developer.android.com/develop/ui/compose/components/card)); Fluent's card is not focusable by default, `focusMode="off"` ([Card.types.ts](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/library/src/components/Card/Card.types.ts)).

**How**
- [moderate] **Hover nudges the surface.** Atlassian changes the surface colour for hovered and pressed ([Atlassian elevation](https://atlassian.design/foundations/elevation)); Primer draws an accent outline on a full-card link's hover ([Card.module.css](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Card/Card.module.css)).
- [strong] **Selected shows a check, not only a colour.** Material: a checked card shows "a checked icon" ([MDC Android Card](https://github.com/material-components/material-components-android/blob/master/docs/components/Card.md)); Fluent renders a real checkbox `input` and toggles on Space ([Card.types.ts](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/library/src/components/Card/Card.types.ts)); React Spectrum's `CardView` defaults to `selectionStyle="checkbox"` ([React Spectrum CardView](https://react-spectrum.adobe.com/CardView)).
- [moderate] **Dragged lifts.** Material has a dragged state with raised elevation; Atlassian: "Use the overlay elevation for any UI that is being dragged" (sources above).
- [strong] **Disabled exists for interactive cards.** Carbon, Fluent (`disabled`, out of the tab order) and Compose (`enabled = false`) ship it (sources above).
- [moderate] **An empty card is not drawn.** Primer's `Card` renders nothing when it has no content ([Card.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Card/Card.tsx)); a collection with no cards shows an empty state, as React Spectrum's `renderEmptyState` does ([React Spectrum CardView](https://react-spectrum.adobe.com/CardView)).
- [weak] A dashboard card whose data is missing keeps its heading and says so, never shows a blank box ([ux: *Degraded, offline and error states*](../design/ux.md#degraded-offline-and-error-states); [tables: *Tables in dialogs and dashboard cards*](../patterns/tables.md#tables-in-dialogs-and-dashboard-cards)).

**Cases**
- Static cards lift on hover → nothing happens on click; drop the hover.
- A selected card differs only by a blue border → add the check mark ([selection: *Option tiles*](../patterns/selection.md#option-tiles-and-picking-a-kind-in-a-dialog)).
- A grid of saved views with none saved shows nothing → an empty state with how to save one ([feedback: *Empty states*](../patterns/feedback.md#empty-states)).
- A "Recent activity" card with no activity renders an empty box → its heading and "No activity in the last 30 days".

**Accessibility**
- [required] 1.4.1: selected is not shown by colour alone. 1.4.11: a selected card's border and check meet 3:1.
- [required] 4.1.2: a selectable card exposes its state, through a native checkbox or radio.
- [required] 2.4.7: a focusable card shows a visible ring (figma-standard rule 39 in a library).

**Build**
- [required] Hover and focus on a clickable card come from its link: `ds-card:has(a:hover)` and `ds-card:has(a:focus-visible)`, never a class (code-standard rule 9).
- [required] Selected is a native checkbox or radio in the card, styled from `:has(input:checked)` ([selection: *Option tiles*](../patterns/selection.md#option-tiles-and-picking-a-kind-in-a-dialog); code-standard rule 9).
- [required] Disabled is the inner control's own `disabled`, or a link with no `href` and `aria-disabled` (code-standard rules 9 and 62).
- [required] No card renders without content; the template branches on the content, and the collection renders its empty state (code-standard rule 12).

**Check**
- *Script* could: flag hover styles on cards with no link or control; flag a selected card with no checked input; flag a card with no text content.
- *Judgement*: does each state the card draws answer something the person did?

**Sources.** Carbon, Material, Fluent, Atlassian, Primer, Spectrum and Compose as linked. They agree states belong to interactive cards; they differ on how hover is drawn.

## In Figma

**Layers**
- [required] Auto layout throughout; the card hugs its content vertically, so a longer title grows it (figma-standard rule 33).
- [required] Layers named for their role: `Heading`, `Body`, `Media`, `Metadata`, `Actions` (figma-standard rule 10). A part built for the card takes the family's name, as figma-standard rule 9's own example `Card header` does.
- [weak] The body is a slot, since card content varies. Carbon's kit has a `Slot` boolean and a `Swap slot` instance ([Tile.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tile/Tile.figma.ts)). The slot's name follows figma-standard rule 21.

**Properties**
- [required] `Heading` and `Body` are text properties where the card holds them directly (figma-standard rule 37).
- [required] A boolean that reveals a part sits directly above what fills it, and takes `Show` (figma-standard rules 5 and 21). Carbon's kit names them `Title` and `Title text`, `Description` and `Description text` ([Tile.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tile/Tile.figma.ts)); figma-standard rule 21 departs: `Show heading` above `Heading`.

**Variants and states**
- [moderate] A surface axis, its values the code's. Fluent's code names it `appearance`; Material ships three card types (*Surface*). The house names it `Appearance`, code `appearance` (figma-standard rule 1), as Fluent's code does.
- [weak] A direction axis where the code has one: Fluent's code has `orientation` (source above; figma-standard rule 56).
- [contested] **One set for every kind, or a set per kind.** Carbon's kit draws one `Tile` with a `Type` axis (`Base`, `Clickable`, `Single-select`, `Multi-select`, `Expandable`) that maps to four code components ([Tile.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tile/Tile.figma.ts)). Fluent and Primer ship one card component whose props add selection or a link, so a kit mirroring them has one set ([Card.types.ts](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-card/library/src/components/Card/Card.types.ts)). figma-standard rule 56 takes the shape that mirrors the project's code.
- [required] A static card has no `State` axis, since it would hold `Rest` alone (figma-standard rule 35). A clickable card's `State` runs `Rest → Focus → Hover → Press`, with `Disabled` before it (figma-standard rules 1 to 4); Focus shows a ring (figma-standard rule 39).
- [required] `Selected` is a True/False variant, a bare word (figma-standard rule 21); Carbon's kit has a `Selected` boolean (above).
- [required] Sizes or densities are `Size` with t-shirt values, largest first (figma-standard rule 6). Spectrum's `density` and Primer's `padding` are code names a kit over them keeps (figma-standard rule 56).
- [weak] Dragging is motion with a still frame: Material draws a dragged state, which a kit draws only where the project's code renders one (figma-standard rules 51 and 52).

**Tokens**
- [required] Fill, stroke, radius, padding and gap bound to semantic variables (figma-standard rules 24 and 29); text in text-role tokens meeting contrast in every mode (figma-standard rules 28 and 32).
- [required] A shadow is an effect style; `Elevation/Raised` is on figma-standard rule 18's three-name allowlist.
- [required] Component tokens, where the project has them, follow figma-standard rule 49: `Component/Card/Container/background-stroke`.

**Check**
- *Script*: figma-components-audit runs the rules cited above; the snapshot's contract lists the surface and direction axes beside the code's props.
- *Judgement*: can a designer place every kind of card the code renders, and no kind it does not?

**Sources.** Carbon's Code Connect files for names, with Fluent and Material for the axes. Kits split on one set or several; the item is contested and figma-standard rule 56 decides by the code.

## Alignment with code

**Structure**
- [contested] Code splits the card by behaviour, or keeps one component. Carbon ships `Tile`, `ClickableTile`, `SelectableTile` and `ExpandableTile` ([Tile.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tile/Tile.figma.ts)). Fluent ships one `Card` with `selected` and `onClick`, and Primer one `Card` with `Card.Link` and `fullCardHitArea` (sources above).
- [strong] The parts are subcomponents or slots of one card, never cards of their own: Primer's `Card.Heading`, `Card.Description`, `Card.Metadata`; Fluent's `CardHeader`, `CardPreview`, `CardFooter`; React Spectrum's `CardPreview`, `Content`, `Footer` (sources above).

**Mapping**
- [required] Each Figma property maps to one prop or attribute, recorded once (code-standard rule 9; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Appearance` (surface) | `appearance`, as Fluent |
  | `Direction` | `direction`; Fluent `orientation` |
  | `Size` | `padding` in Primer, `density` in Spectrum, `size` in Fluent |
  | `Heading`, `Body` | the heading and body children |
  | `Slot` | children |
  | `State=Hover`, `Focus` | the link's `:hover`, `:focus-visible`, read on the card by `:has()` |
  | `Selected` | a native checkbox's `checked`; Fluent `selected` |
  | `Disabled` | the inner control's `disabled`; Fluent `disabled` |

**States**
- [required] The browser sets hover, press and focus on the card's link or control, not on the card; the card reads them through `:has()` or the link's `::after` (code-standard rule 9).
- [required] Selected is set by the native input's `:checked`; disabled by the control's own attribute (code-standard rules 9 and 62).
- [moderate] A focused card that is also hovered resolves by stylesheet order, so Focus is drawn before Hover and written before it ([button: *Alignment with code*](button.md#alignment-with-code); figma-standard rule 4).

**Differences**
- [contested] Carbon's kit folds four code components into one `Type` axis; a project whose code has one card with props draws one set without that axis (*In Figma*, Variants and states).
- [weak] The heading level is a code prop with no Figma property: Figma draws the size, and the level is set from the page outline (*Card semantics*).

**Check**
- *Script*: the component contract lists each Figma axis beside the card's attributes; a value in one with no partner in the other is a finding unless *Differences* names it (design-code-parity).
- *Judgement*: could a developer build every frame from the code's props and the link's states alone?

**Sources.** Carbon's Tile Code Connect, Fluent's Card types, and Primer's Card source, as linked. They agree the parts belong to one card and differ on splitting kinds.

## In code

**Element**
- [required] A visual custom element with no script (code-standard rule 8), inside an `li` in a collection or a labelled `section` alone (*Card semantics*).
- [strong] The card is never the link: the link is the heading's `a`, stretched (*Links and actions on a card*). Primer, Bootstrap and Pickering's pattern all keep the card a plain container.

**Props**
- [strong] A surface variant, a padding or density step, and a direction where the design flips: Fluent (`appearance`, `size`, `orientation`), Primer (`padding`, `shadow`, `borderRadius`, `as`), Polaris (`background`, `padding`, `roundedAbove`), as linked above.
- [moderate] The heading level is a prop: Primer's `Card.Heading` takes `as` from `h2` to `h6`; Bootstrap leaves the level to the markup (sources above).
- [weak] Selection is a prop that renders a real control: Fluent's `selected`, `onSelectionChange` and its `checkbox` slot.

**Check**
- *Script*: the parity loop compares each surface variant's border, fill and shadow with its frame (design-code-parity); axe runs `nested-interactive` over pages with cards.
- *Judgement*: does the card keep one link, one ring, and its heading in the outline?

**Sources.** Fluent, Primer, Polaris and Bootstrap sources as linked; they agree on a passive container with parts, and differ on whether selection and linking are props or components.
