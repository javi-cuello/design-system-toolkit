# Chips, tags and badges

The small rounded labels an interface scatters across lists and fields, and which of them do something: telling a badge from a tag from a chip, and tags as metadata and links. Filter, choice and input chips, removal, overflow and wrapping are the chip's page, [`../components/chip.md`](../components/chip.md). It serves the principles *discoverable* (what can be pressed looks pressable, and what cannot does not), *show state* (a selected chip reads as selected by more than colour) and *consistent, not uniform* (one look per job across the product). It applies design-standard rule 2 (chips never push the controls the reader is using), design-standard rule 4 (a facet past four values is a menu, not a row of chips) and design-standard rule 5. It supersedes the chips section selection.md used to hold, which now only points here. Status badges (Draft, Failed) are owned by [status badges and pills](../components/badge.md#status-badges-and-pills); applied filters shown as removable chips are [filtering: applied filters and clear all](filtering.md#applied-filters-and-clear-all); a single-choice set is built as [segmented control](../components/segmented-control.md#segmented-control).

## Badges, pills, chips and tags: telling them apart

**Use when / don't use**
- [moderate] **Badge:** static, never interactive; shows a status, a count or a change ("New", "3", "Draft"). Friedman treats badges as always static and never navigational ([Friedman, Badges vs. Pills vs. Chips vs. Tags](https://smart-interface-design-patterns.com/articles/badges-chips-tags-pills/), commentary). Status badges are [feedback.md's](../components/badge.md#status-badges-and-pills); a count on a tab or nav item is a badge too.
- [moderate] **Tag (static):** descriptive metadata that classifies an object: a topic, a category, a platform. Atlassian keeps tags for "lower-priority metadata" and its lozenge for status ([Atlassian tag](https://atlassian.design/components/tag/usage); [Atlassian lozenge](https://atlassian.design/components/lozenge/usage)).
- [moderate] **Chip (interactive tag):** a tag that does something: filters, selects, or stands for a value the reader entered and can remove. Friedman calls chips and pills style names for interactive tags, and suggests a design system needs only two groups, static indicators and interactive elements.
- [weak] **Pill** is a shape, not a job; don't name a component for it.
- [weak] **Assist and suggestion chips** (Material's names for chip-shaped actions and suggested replies) are buttons, not selection or tags: build and style them as buttons ([actions](actions.md)).
- [moderate] Don't let a static label and an interactive one look alike: GOV.UK refuses to make its tag a link or button because "interactive and non-interactive tags look the same" ([GOV.UK tag](https://design-system.service.gov.uk/components/tag/)); Carbon warns against one tag with several functions ([Carbon tag](https://carbondesignsystem.com/components/tag/usage/)).

**How**
- [weak] Give each job one look across the product: badges filled and compact with no border or hover; static tags subdued with no hover or pointer; chips with a border, a hover and a focus ring, so they read as controls.
- [weak] Name the components by job ("Status badge", "Filter chip", "Input chip"), as Friedman recommends, not by shape.
- [weak] Word static labels as adjectives or nouns ("Completed", "Colour"), never verbs, so nobody expects them to act (GOV.UK).
- [moderate] Keep labels short and in sentence case; Atlassian truncates lozenges and tags past 200px and Carbon asks for under 20 characters where it can control the text.
- [weak] Carbon's tag types map onto the toolkit's: read-only tag = static tag; dismissible tag = input chip or applied-filter chip; selectable tag = filter chip; operational tag = the "+3 more" control ([chip: removing chips, overflow and wrapping](../components/chip.md#removing-chips-overflow-and-wrapping)).

**Cases**
- A table shows a grey "Colour" tag and, beside it, an identical grey "Colour" chip that filters on click → make the chip look like a control (border, hover) or make the tag a plain link; two looks for two jobs.
- A "Beta" badge on a nav item opens a menu on click → the badge stays static; the menu belongs to a button.
- The design system has Badge, Pill, Tag, Chip, Label and Lozenge → collapse to the jobs: status badge, count badge, tag, chip.
- A status shown as a tag in one place and a lozenge in another → status is a badge, everywhere ([feedback](../components/badge.md#status-badges-and-pills)).

**Accessibility**
- [required] 1.4.1 Use of Color (category or status not by colour alone), 1.4.3 (label text contrast), 1.4.11 Non-text Contrast (a chip's boundary at 3:1 so it reads as a control), 4.1.2 Name, Role, Value (an interactive chip exposes a role; a static one exposes none). In Figma: figma-standard rule 31, figma-standard rule 32.

**Build**
- [required] *Elements:* a badge or static tag is a `span` (or text inside a link or cell); a filter or choice chip is a `button` or a styled `input type="checkbox"`/`radio` with its `label`; an input chip is a `span` holding the value text and a separate remove `button`; a tag that navigates is an `a` (code-standard rule 8; WCAG 4.1.2).
- [strong] *ARIA and keyboard:* static labels have no role and are not focusable (Atlassian: lozenges cannot be focused). Interactive chips follow their control's APG pattern: [button](https://www.w3.org/WAI/ARIA/apg/patterns/button/) for toggles, checkbox or radio for selection.
- [required] *States:* none on a static label; `aria-pressed`, `checked` or `aria-checked` on interactive chips; a count badge's number is part of a description, not the parent's name (code-standard rule 15).
- [required] *Rules:* code-standard rule 8 (the kind of component decides its implementation), code-standard rule 9 (a variant is an attribute, a state a pseudo-class), code-standard rule 15 (a count is a description, not part of a name).
- [weak] *Detail:* [code: links and buttons](../../code/html-semantics.md#links-and-buttons), [code: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions), [code: variants to attributes](../../code/figma-handoff.md#variants-to-attributes).

**Check**
- *Script:* could flag an element styled as a tag that has a click handler but no button or link role, a static tag with `cursor: pointer` or a hover style, and a chip whose boundary contrast is under 3:1.
- *Judgement:* For each rounded label: does it do anything? If it does, is it built and styled as that control; if not, is it plainly inert?

**Sources:** Friedman, GOV.UK, Atlassian and Carbon as linked; Primer's [Label](https://primer.style/product/components/label/) (contextual metadata) and [Token](https://primer.style/product/components/token/) (a compact, optionally removable representation of an object) split the same way. Carbon and Atlassian allow some tags to be interactive where GOV.UK allows none; the toolkit lets a tag be interactive only when it looks like a control.

## Tags as metadata and links

**Use when / don't use**
- [weak] **Static tags** classify an object where it is shown: a component's platforms, a page's topics.
- [contested] **Tags as links** when each tag has a page of its own listing everything that carries it (a docs site's topic pages). Carbon does not use tags as links ([Carbon tag](https://carbondesignsystem.com/components/tag/usage/)) and GOV.UK forbids it ([GOV.UK tag](https://design-system.service.gov.uk/components/tag/)); where tags link, they must look like links.
- [weak] Don't place tags inline in running text (Atlassian), and don't use a tag for status ([Atlassian tag](https://atlassian.design/components/tag/usage)); status is a badge.

**How**
- [weak] A fixed vocabulary per kind of tag, kept in one list so one idea never has two tags.
- [moderate] Colour only when it carries meaning across the product; Carbon uses colour to tell categories apart, Atlassian reserves accent colours for user-made labels. With colour, keep text: never colour alone.
- [weak] A linking tag shows a link's cues (underline on hover, focus ring, pointer) and goes to a page titled with the tag; a filter-applying tag is a filter chip instead.
- [moderate] Group a row of tags under a visible or programmatic label ("Topics").

**Cases**
- Topic tags on a docs page look like the filter chips on the index and navigate away → style them as links, or make them filter chips on the index only.
- "Accessibility", "A11y" and "Accessible" tags on one site → one tag; the vocabulary is the design.
- Category tags in six colours with no meaning behind the colours → one neutral colour, or document what each colour means.

**Accessibility**
- [required] 2.4.4 Link Purpose (a link's text says where it goes: "Topic: Accessibility" where the context does not), 1.4.1, 1.3.1 (the tag list is a list with a label).

**Build**
- [strong] *Elements:* a `ul` of tags with a heading or `aria-label`; static tags as text in `li`, linking tags as `a` inside them.
- [strong] *ARIA and keyboard:* none beyond links; no APG pattern applies.
- [required] *States:* none; a linking tag for the page being read carries `aria-current="page"` (code-standard rule 64).
- [required] *Rules:* code-standard rule 64 (current marked), code-standard rule 21 (modified clicks open a new tab), code-standard rule 8.
- [weak] *Detail:* [code: lists, description lists and figures](../../code/html-semantics.md#lists-description-lists-and-figures), [code: links and buttons](../../code/html-semantics.md#links-and-buttons).

**Check**
- *Script:* could list every tag's text across a site and flag near-duplicates by case and stem, and flag a tag with a link role that has no link styling cue.
- *Judgement:* Does the tag have a page worth visiting? If not, keep it static.

**Sources:** Carbon, GOV.UK and Atlassian as linked. Carbon and GOV.UK refuse linking tags; the toolkit allows them for topic pages only when they are styled as links, which answers GOV.UK's reason (looking the same as inert tags).
