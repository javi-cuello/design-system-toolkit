# Design standard — how an interface the toolkit builds or audits looks, behaves and reads, in a design file and in a built page

**Version 1.2.3** — history in [`changelog/design-standard.md`](changelog/design-standard.md).

**Scope.** The design of any interface a project or the toolkit itself puts in front of people: a documentation site, a dashboard, a tool, a screen drawn in Figma. Five areas, each owning one kind of decision: **UX** (what and why, across screens), **Interaction** (how it responds, in the moment), **Visual** (how it looks), **Content** (what it says) and **Accessibility** (who it works for). Above them sit the principles every area answers to; below them, **application profiles** say what a kind of product (documentation, dashboards, forms) must specify. A rule applies to a design file and to a built page alike; each says which it can be checked on. Project-agnostic by construction, like `code-standard.md`.

**What it does not govern.** How a Figma library is built and named is [`figma-standard.md`](figma-standard.md)'s, including the accessibility of its components (figma-standard rules 26, 31 and 32: target and text size, distinct states and visible focus, text contrast); how the code is written, including how an accessible design is implemented (focus after a live swap, accessible names, `hidden`, `color-scheme`, `aria-current`), is [`code-standard.md`](code-standard.md)'s; whether a build matches its design is parity's (code-standard *Design-to-code*, `tools/parity`). Where design and code meet, design decides what happens and code decides how: the focus order is designed here and kept by code-standard rule 2.

**Precedence** is the root's (toolkit-standard *Precedence*). A project's context document overrides a rule here with a dated ruling and an `**Overrides:** design-standard rule N` line.

**What this file holds, and what it does not.** It states what good looks like: the principles and each area's aim, and the few rules a run here proved, each with its evidence and its check (toolkit-standard §C). The depth, every fundamental and pattern with its use cases, practice, accessibility, checks and sources, is the toolkit's knowledge pages (`knowledge/ui/design/`, `knowledge/ui/patterns/`, `knowledge/ui/profiles/`), which cite this file and never restate it; this file names them and never copies them (toolkit-standard §D 21). When a practice there is proven by a run, it becomes a rule here and the page cites it.

**Where the checks live.** Each rule says what it applies to (*Applies to:*). A built page is measured by `tools/ui-check/check.mjs` (the rules whose marker names it), whose limits are the `interface` settings in `audit-settings.json`. On a design file no script checks this standard's rules yet; they are read at review. The judgement rules are read at the closing pass (`bin/closing`) and in the `frontend-build` skill's audit, which applies this standard and code-standard together.

---

## Principles

The frame every rule answers to. Each recurs across the sources named with it; none is a rule, and none is checked on its own. A rule below says which principle it serves where that is not plain.

- **Serve a real need.** Every screen and element exists for a task someone has; what serves none is removed. (Rams, GOV.UK, Apple *Purpose*, Carbon, Spectrum, Polaris, Inclusive Design Principles.)
- **As little as possible, and no simpler.** An element earns its place; simple is not minimal, and the system absorbs complexity so the person does not. (Rams, GOV.UK *do the hard work to make it simple*, Apple *Simplicity*, NN/g heuristic 8, Primer *approachable is better than simple*.)
- **Consistent, not uniform.** The same problem gets the same solution, built on what people already know; a divergence states its reason. (Shneiderman, NN/g heuristic 4, GOV.UK, Apple *Familiarity*, Carbon, Atlassian, Salesforce Lightning.)
- **Show state and give feedback.** People can always tell what the system is doing and what their action did. (NN/g heuristic 1, Shneiderman, Norman, Tognazzini, Apple.)
- **Discoverable.** What can be done is visible; people recognise rather than recall. (Norman's signifiers, NN/g heuristic 6, Rams *understandable*, Shneiderman.)
- **People in control, mistakes forgiven.** Actions can be undone, flows escaped, work never lost. (NN/g heuristics 3, 5 and 9, Shneiderman, Apple *Agency*, Tognazzini *protect users' work*, Primer *design for failure*.)
- **Efficient for people who know it.** Frequent work is fast; the expert's path does not get in the novice's way. (NN/g heuristic 7, Tognazzini, Polaris *efficient*, Salesforce Lightning.)
- **For everyone, in any context.** It works for the range of people and situations it meets, and accessibility is designed in, never retrofitted. (GOV.UK *this is for everyone*, Inclusive Design Principles, Microsoft inclusive design, Carbon, Fluent, Primer.)
- **Honest.** It says what it can and cannot do, where its figures come from, and never steers people against their interest. (Rams, Apple *Responsibility*, Polaris *trustworthy*, Calm Technology, Brignull's deceptive patterns as the refusal.)
- **Clear words, clear hierarchy.** The most important thing is the most visible, and the words are the reader's. (Apple, Salesforce Lightning *clarity*, NN/g heuristic 2, Tognazzini *readability*.)
- **Crafted, with nothing decorative for its own sake.** Every detail is deliberate, and a flourish carries meaning. (Rams, Apple *Craft*, Spectrum, Salesforce Lightning *beauty*.)

When two pull against each other, the sources resolve them the same way: be consistent in behaviour and meaning and diverge only with a stated reason (GOV.UK, Atlassian); keep power behind progressive disclosure rather than removing it (Tesler, NN/g); express brand in signature details, never at the cost of focus (Fluent); acknowledge an action at once even when the work takes longer (Primer *responsive is better than fast*).

---

## UX — what and why, across screens

Good UX starts from the task someone came to do, asks for nothing twice, chooses defaults most people would pick, keeps their place when they reload or share a link, and never leaves them in front of an empty or broken screen without a way on. The fundamentals, with cases, are `knowledge/ui/design/ux.md`.

1. **A page says where its figures come from and how fresh they are.** A page built from data names its source and the date of it in a caption under its title (*Updated by the snapshot of 9 Oct 2026 and the audit of 11 Oct 2026*), and the lede says what the page means, not where it came from.

   *Why:* a figure with no source and no date cannot be trusted or questioned, and the reader cannot tell a stale page from a current one. The principle is *honest*.

   *Evidence:* 2026-10-11, the toolkit's docs site: three overview pages carried their source in the middle of the lede ("from the snapshot of … and the last full audit"), where nobody looking for it would read it; the maintainer asked for a caption under each title instead, and the AI readiness page then showed its audit had not run since the record's first import. Maintainer-decreed 2026-10-11.

   *Applies to:* design file and built page.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the review of any page that shows recorded figures.


---

## Interaction — how it responds, in the moment

Good interaction answers every action at once, keeps the screen still under the pointer, lets a mistake be undone, and offers each choice through the control that fits how many choices there are. The fundamentals are `knowledge/ui/design/interaction.md`; the patterns (navigation, search, filtering, selection, forms, actions, dialogs, disclosure, feedback, tables, data) are `knowledge/ui/patterns/`.

2. **The layout holds still when the reader changes what they look at.** Switching a tab, a file or a filter never moves the controls the reader just used; content that comes and goes keeps its space, or sits below the control.

   *Why:* a control that moves under the pointer is clicked wrong, and a page that jumps reads as broken. The principle is *show state*: the change belongs in the content, not in the frame.

   *Evidence:* 2026-10-11, the toolkit's docs site: on the Audits page, switching from a components file to a tokens file moved the tabs up 62px, because the action column and the freshness badge disappeared for files with nothing to run. Kept their space; the tabs now sit at the same position for every file. The check measures the tab list's position after each switch. **Mechanical.**

   *Applies to:* built page; a design shows it as frames of one screen in two states, read at review.

   *Checked:* `tools/ui-check/check.mjs` "the layout holds still"; `tools/ui-check/test-check.mjs` "rule 2" — with the tolerance in `interface.shiftTolerance`.

3. **Tabs choose what a screen shows; one filter bar under them narrows it.** Tabs switch between views of one context (a file, a platform) and keep one row. Under them, one bar holds the facets and toggles first and the search last, with the screen's actions after the search. Nothing else filters the same list. Tabs that overflow scroll; they never wrap.

   *Why:* two rows of chips for the same list made the reader work out which narrowed which; a bar laid out the same on every screen is learned once. Tabs that wrap stop reading as tabs.

   *Evidence:* 2026-10-11, the toolkit's docs site: the Audits page carried a row of file chips and a row of eight area chips that wrapped to three lines, above a separate action; the Changes page carried its own chip row. Rebuilt as file tabs over one bar, then, at the maintainer's ruling, every bar on every page set facets left and search right. Maintainer-decreed 2026-10-11. Supported by [Atlassian tabs](https://atlassian.design/components/tabs/usage) (tabs switch views of one context), [Carbon tabs](https://carbondesignsystem.com/components/tabs/usage/) and [GOV.UK tabs](https://design-system.service.gov.uk/components/tabs/) (and never wrap), and by [Carbon filtering](https://carbondesignsystem.com/patterns/filtering/) (filters left or top). Carbon's data table puts its search on the left; this standard does not follow it. **Mechanical** for the order of facets and search and for the single row; **needs a read** for where the actions sit and whether anything else filters the list.

   *Applies to:* design file and built page.

   *Checked:* `tools/ui-check/check.mjs` "tabs keep one row and scroll"; `tools/ui-check/check.mjs` "facets and toggles come first, search last".

4. **A facet of up to four choices is segmented buttons; a longer one is a menu.** Up to four choices, all in sight, as one segmented control; past four, a menu that shows each choice's count. The limit is `interface.maxSegments`.

   *Why:* a segmented control past four wraps and reads as broken; a menu of three hides what a row of buttons would show at a glance.

   *Evidence:* 2026-10-11, the toolkit's docs site: eight area chips wrapped to three lines; turned into a menu, the three-level filter on Progress then hid three choices behind a click, and the maintainer asked for buttons back up to four. Maintainer-decreed 2026-10-11. Supported by [eBay Playbook](https://playbook.ebay.com/design-system/components/segmented-button) (2–4 segments) and [Anvil](https://anvil.servicetitan.com/docs/web/patterns/filters); [Primer](https://primer.style/product/components/segmented-control/guidelines/) allows five. [Carbon filtering](https://carbondesignsystem.com/patterns/filtering/) disagrees with the menu half: it says filter categories should never sit in a dropdown; this standard follows the two-to-four sources for short facets and keeps a long one in a menu that shows its choice and counts. **Mechanical** for more than four buttons; **needs a read** for a menu of four or fewer, which a script cannot tell from a form field.

   *Applies to:* design file and built page.

   *Checked:* `tools/ui-check/check.mjs` "a facet is a menu"; `tools/ui-check/test-check.mjs` "rule 4".

5. **A choice that leads nowhere is disabled, not hidden; a control that can never apply is not shown.** An option with nothing behind it stays in its place, disabled, so the control keeps its shape and the reader sees what exists. A menu with nothing left to choose is disabled. A control that cannot apply to this view at all (a component filter on a file with no components) is not drawn.

   *Why:* a hidden option makes the menu change shape under the reader and hides that the category exists; a disabled control that can never be enabled is noise.

   *Evidence:* 2026-10-11, the toolkit's docs site: the Audits area menu listed seven areas at zero; hidden first, on a claim that turned out unverifiable, then disabled when [NN/g](https://www.nngroup.com/articles/drop-down-menus/) and [Smashing](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/) both said to grey unavailable options out. The maintainer then asked for a menu reading only "All areas (0)" to be disabled, and for the component menu to go from files that have no components. Maintainer-decreed 2026-10-11. **Mechanical** for a menu with nothing to choose and for an option hidden in place; **needs a read** for an option removed from the page altogether, and for whether a control can ever apply.

   *Applies to:* design file and built page.

   *Checked:* `tools/ui-check/check.mjs` "offers nothing to choose and is not disabled"; `tools/ui-check/check.mjs` "disabled, not hidden".

6. **Facets narrow each other, the most specific first.** Each facet offers only what fits the choices made in the others, and the facet with the most choices (a component before the areas of its findings) comes first, so the next one offers only what belongs to it. How each choice counts is rule 11.

   *Why:* a second menu listing areas the chosen component has no rows in offers choices that lead nowhere, and its counts disagree with the list below it.

   *Evidence:* 2026-10-11, the toolkit's docs site: the Audits page set area first and component second; the maintainer asked for component first so the area menu would show only that component's areas. Follows Baymard's combination logic, AND across facets and OR within one ([Baymard](https://baymard.com/blog/allow-applying-of-multiple-filter-values)); no source states the ordering itself. Maintainer-decreed 2026-10-11. **Needs a read.**

   *Applies to:* design file and built page.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the review of any filter with two or more facets.

13. **An item's detail or an explanation opens in a dialog or a side panel, not in place.** A row, a card or a "what this means" link opens its detail over or beside the page; the list or text it came from keeps its shape.

   *Why:* a row that expands in place pushes every row after it down, so the reader loses where they were in the list, and a long explanation opened inline breaks the reading flow of the page around it. An overlay keeps the list still and is closed in one step.

   *Evidence:* 2026-10-12, the toolkit's docs site: the per-component level checks and "What the levels mean" were turned into in-place disclosures, and the maintainer rejected them on sight ("I prefer a modal or side panel"). Maintainer-decreed 2026-10-12. This is the toolkit's choice where `knowledge/ui/patterns/dialogs.md` *Choosing the surface* leaves it open between inline disclosure and an overlay.

   *Applies to:* design file and built page.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the review of any list or table with per-item detail.


---

## Visual — how it looks

Good visual design makes the most important thing the most visible, groups by proximity, takes every colour, size and space from the system, and gives dark mode and every state the same care as the default. The fundamentals are `knowledge/ui/design/visual.md`.

7. **A heading sits with what it introduces.** The space between a heading and its own content is smaller than the space between sections, so proximity says what belongs together.

   *Why:* proximity is how a reader groups things before reading them; a heading as far from its paragraph as from the section above belongs to neither.

   *Evidence:* 2026-10-11, the toolkit's docs site: the AI readiness page set 24px between a section heading and its paragraph, the same as between blocks; the maintainer read the heading as separated from its text. Tightened to the gap a section heading has elsewhere on the site. Supported by [Atlassian spacing](https://atlassian.design/foundations/spacing) (similar items share spacing) and [Carbon spacing](https://carbondesignsystem.com/elements/spacing/overview/). Maintainer-decreed 2026-10-11. **Needs a read.**

   *Applies to:* design file and built page.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the review of a page layout.

8. **A fixed set of attributes is columns, not a list in one cell.** When every row can have the same few attributes, each attribute gets its own column with a mark, so the reader scans down a column instead of parsing a sentence in every row.

   *Why:* a comma list hides which rows share an attribute and reorders itself row by row.

   *Evidence:* 2026-10-11, the toolkit's docs site: the AI readiness table listed missing guidance as "Usage or Don't, Code gen notes" in one cell, sometimes in the other order; the maintainer asked for a column per section. [Primer's DataTable guidelines](https://primer.style/product/components/data-table/guidelines/) state it: "Don't use a single column to show multiple pieces of data". A column earns its place only when it tells rows apart (`knowledge/ui/patterns/tables.md`, *What earns a column*). Maintainer-decreed 2026-10-11. **Needs a read.**

   *Applies to:* design file and built page.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the review of a table.

9. **A control's own marks keep the control's inset.** A chevron, an icon or a count inside a control sits as far from its edge as the control's text does from the other edge, drawn by the system rather than left to the platform default.

   *Why:* a mark against the edge reads as clipped, and the platform's arrow differs between browsers.

   *Evidence:* 2026-10-11, the toolkit's docs site: the new filter menus showed the browser's own arrow tight against the right border; the maintainer flagged it on sight. Replaced by a drawn chevron at the field's 12px inset. Maintainer-decreed 2026-10-11. **Needs a read.**

   *Applies to:* design file and built page.

   *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the review of a control's styles.


---

## Content — what it says

Good content uses the reader's words, one name per thing, says what happened and what to do next, and is written for the reader's level: plain for interface copy, precise for reference. The fundamentals are `knowledge/ui/design/content.md`.

10. **A finding says what changed and what it does to people, not which rule caught it.** A message about a problem leads with the change and its consequence in the reader's words, then who it affects and when; the rule's identifier stays out of that sentence (a report for the maintainer may give it after the sentence, in brackets).

    *Why:* "component-removed: breaking" tells the reader a category and nothing they can act on; the consequence is what decides whether to act.

    *Evidence:* 2026-10-11, the toolkit's audit queue: breaking-change rows read "Snapshot of 2026-10-09 (component-removed): breaking for Figma files and code." and the maintainer said the column said nothing about why. Rewritten as "Removed from the library: placed instances keep rendering and never update again." then who it breaks and when; 120 open rows across three projects rewritten. **Mechanical** for the breaking-change writer, by its test; **needs a read** for any other message.

    *Applies to:* design file and built page, and any message a tool writes.

    *Checked:* `tools/figma-audit/test-breaking.mjs` "says what changed, then who it breaks and when".

    *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the review of any message a tool writes for people.

11. **A choice says how much it leads to.** An option in a filter carries the count of what choosing it shows, counted the way the list below it counts.

    *Why:* the count tells the reader where the work is before they choose, and an option at zero tells them not to.

    *Evidence:* 2026-10-11, the toolkit's docs site: the Audits area menu, the Components levels and the Changes tabs each carry a count, and the area counts were corrected to follow the component chosen beside them. Supported by [Smashing](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/) (show the expected result count). Maintainer-decreed 2026-10-11. **Needs a read.**

    *Applies to:* design file and built page.

    *Reviewed:* `tools/toolkit-check/closing.mjs` "judgement rules to read against this change" — at the review of a filter.

12. **A collapsed menu's first option names what "all" covers.** A menu opens on "All areas (508)", not "All (508)": collapsed, the menu shows only that option, and the label beside it is gone. A row of buttons, whose siblings are in sight, may say "All".

    *Why:* "All (508)" alone does not say all of what, and two menus side by side both read "All".

    *Evidence:* 2026-10-11, the toolkit's docs site: the first filter menus opened on "All (513)"; renamed "All areas", "All components" and "All values" before the rollout. Maintainer-decreed 2026-10-11. **Mechanical.**

    *Applies to:* design file and built page.

    *Checked:* `tools/ui-check/check.mjs` "its first option names what"; `tools/ui-check/test-check.mjs` "rule 12".


---

## Accessibility — who it works for

Good accessibility is designed in: the screen works by keyboard, at 320px and 200% text, without colour alone, with motion reduced, and for someone who cannot hold much in memory. The baseline is WCAG 2.2 AA ([W3C Recommendation, 12 Dec 2024](https://www.w3.org/TR/WCAG22/)), owned in three places and restated in none: in a design file, a component's accessibility is figma-standard's (figma-standard rule 26, figma-standard rule 31 and figma-standard rule 32), checked by `figma-components-audit`; in code it is code-standard's (code-standard rules 2, 14–19 and 64); the design decisions about a whole screen are this area's. No rule is admitted here yet. The fundamentals are `knowledge/ui/design/accessibility.md`.

---

## Application profiles

A profile binds the five areas to a kind of product and says what a page of that kind must specify: `knowledge/ui/profiles/documentation.md` and `knowledge/ui/profiles/dashboards.md`; forms are `knowledge/ui/patterns/forms.md`. Rules 1, 3–6, 11 and 12 came from the dashboard profile and hold for any filtered list.

---

## Verifying

```sh
node tools/ui-check/check.mjs <url> … [--project <label>]   # the mechanical rules, on a built page
node tools/ui-check/test-check.mjs                            # each of them fired and quiet; run by bin/check
```

The judgement rules are read at the closing pass (`bin/closing` lists them for any change to a project's front-end or to the docs site) and in `frontend-build`'s audit.
