# Interface application profiles

How a design standard's principles become concrete patterns for three kinds of product: design system documentation sites, dashboards and data tools, and forms. For each, what a page of that kind must specify, and which of those requirements a script can check.

Researched October 2026. Component pages were opened directly for GOV.UK, Adobe Spectrum, GitHub Primer, Atlassian, eBay Playbook and Shopify Polaris (the last through its GitHub repository). Guidance was opened directly from Diátaxis, Write the Docs, Keep a Changelog, Nielsen Norman Group, Carbon, Baymard Institute, Smashing Magazine, ServiceTitan Anvil, PatternFly, Apple's Human Interface Guidelines, the Office for National Statistics, the Government Analysis Function and Adam Silver. The worked examples come from the toolkit's docs site as committed on 11 October 2026, read from the repository's commit history and source rather than a running site. Three things could not be confirmed and are left out of the argument: Material 3's segmented-button limits (the page rendered empty), a page listing NN/g's position on hiding versus disabling filter options (none was found), and a 1987 menu study surfaced by search, whose abstract alone was visible. Spectrum's old `/page/<component>/` addresses now return 404; the pages cited are at their current addresses. Where a claim is this guide's own judgement or a practitioner's opinion, it says so.

This guide does not repeat [design-system-docs-ecosystem.md](design-system-docs-ecosystem.md), which covers the architecture of a docs site (extraction, contracts, previews, token pages, parity reporting). Read that for what a docs site is built from; read this for what its pages should say and how they should behave.

---

## What this answers

A design standard has five areas: UX, Interaction, Visual, Content design and Accessibility. Each states principles that hold for any product. Principles do not tell a team what a component page, a data table or a question page must contain. An **application profile** does that: it binds the five areas to the patterns of one kind of product, so a reviewer can say "this page is missing its change log" rather than "this page could be more honest".

The questions, in order:

- What is an application profile, and why have one?
- What structure should a design system component page follow?
- Which kinds of documentation does a docs site need, and how should it be navigated?
- How should a generated page show where its content came from and how fresh it is?
- What kind of dashboard is this, and what does that decide?
- How should tables and filter bars behave?
- What do KPI tiles, empty states and degraded states need?
- How should a form be structured, labelled and validated?
- For each profile, what must a page specify, and which parts can a script check?

Section 16 is the cheat sheet. Section 17 is the short version.

---

## 1. What is an application profile?

**The short answer.** A list, per kind of product, of the patterns a page must use and the facts it must state, each traced to a principle in one of the five areas and marked as checkable by a script or left to judgement.

A principle such as "content is current" (Content design) or "state is visible" (Interaction) is true of every interface and specific about none. Teams that stop at principles end up arguing case by case. Teams that skip principles end up with a pattern library nobody can justify. The profile sits between them: it says that on a documentation site, "current" means each generated page names the data that produced it and its date; on a dashboard, it means every figure carries its source and time period; on a form, it means the check answers page reflects what was entered.

Splitting each requirement into **deterministic** and **judgement** is what makes a profile useful to a toolkit. A deterministic rule ("every component page has a Recent changes section", "every chart has a source line") can run in CI and block a merge. A judgement rule ("the when-not-to-use section names the alternative") needs a reviewer, a model with a rubric, or both. A profile that does not mark the difference either lets judgement items rot unchecked or pretends a script can assess them.

**Recommendation.** Write one profile per kind of product the standard governs. Each requirement names its area, its source, and whether it is checked by script or by review.

---

# Part one: documentation sites for a design system

## 2. What structure should a component page follow?

**The short answer.** A fixed skeleton, in a fixed order, that answers "should I use this?" before "how is it built?". The large systems agree on the core and disagree on the labels.

The page structures as shipped, opened in this session:

| System | Structure | Notes |
|---|---|---|
| GOV.UK ([Radios](https://design-system.service.gov.uk/components/radios/)) | Example, When to use this component, When not to use this component, How it works, Research on this component, Recent changes, Help improve this component | One long page. Recent changes lists dated entries tied to GOV.UK Frontend versions, with a link to the full history. |
| Adobe Spectrum ([Button](https://spectrum.adobe.com/web/rsp/components/button), [Checkbox](https://spectrum.adobe.com/web/rsp/components/checkbox)) | Anatomy, Component options, States, Behaviors, Usage guidelines, Content standards, Internationalization, Accessibility | Content standards appears on Button and not on Checkbox: the section is present only where the component carries text the system has a view on. |
| GitHub Primer ([Button](https://primer.style/product/components/button/), [Guidelines tab](https://primer.style/product/components/button/guidelines/)) | Tabs: Overview, Guidelines, Accessibility | React, Rails and Figma appear as implementation sections on the overview, not as tabs of their own. Guidelines runs Anatomy, then topic sections, then Best practices. |
| Atlassian ([Button](https://atlassian.design/components/button)) | Tabs: Examples, Code, Usage, Changelog | The Usage tab runs Usage, Parts, Accessibility, Best practices, Content guidelines, Related. Each tab has its own address. |
| eBay Playbook ([Checkbox](https://playbook.ebay.com/design-system/components/checkbox)) | Anatomy, Properties, Behavior, Platforms, Best practices, Specs | Page sections vary by component: the [Button](https://playbook.ebay.com/design-system/components/button) page instead runs Types, Choosing a button, Hierarchy, Placement. |
| Shopify Polaris ([repository](https://github.com/Shopify/polaris)) | One `.mdx` file per component under `polaris.shopify.com/content/components/<category>/`, for example `actions/button.mdx` | The repository is now archived and unmaintained; Shopify points to Polaris Web Components on shopify.dev. The docs-as-MDX-in-the-repo model is still the clearest public example. |

Reading across them, the common sections are: purpose and when to use, a live example, anatomy or parts, options or properties, states and behaviour, content guidance, accessibility, and a record of change. What varies is whether these are one page (GOV.UK, Spectrum, eBay) or several tabs (Primer, Atlassian), and whether code reference sits beside the guidance or behind its own tab.

Three practices stand out:

- **GOV.UK puts "when not to use" next to "when to use".** It is the section most likely to stop a misuse, and the one most often missing elsewhere. Spectrum and Atlassian fold it into usage guidelines and best practices.
- **GOV.UK and Atlassian publish change on the component page.** GOV.UK's Recent changes and Atlassian's Changelog tab put the history where a reader is deciding whether to trust the page. Section 5 returns to this.
- **Spectrum gives internationalisation its own section.** That is the cheapest way to make sure someone asked what happens to the component in a right-to-left language or with a label twice as long.

The honest cons. A fixed skeleton produces empty sections when a component has nothing to say under a heading, and empty sections teach readers to skip. Spectrum's handling, dropping Content standards where there is nothing to say, is the better answer than filler. Tabs hide content: NN/g's [Tabs, Used Right](https://www.nngroup.com/articles/tabs-used-right/) (Evan Sunwall, 2024) warns that users tend to stay on the default tab and that critical content should not sit in a non-default one. A Guidelines tab that holds the only "when not to use" advice is exactly that case.

The ecosystem guide's section 5 already makes the case for a fixed skeleton and gives a Keep/Cut table for a Button page. This profile adds the requirement that the skeleton be declared, so its presence can be checked.

**Recommendation.** Declare a component-page skeleton in the profile: purpose, when to use, when not to use (naming the alternative), example, anatomy, properties, states and behaviour, content, internationalisation, accessibility, recent changes. Allow a section to be omitted only by an explicit "not applicable" in the source, so a script can tell a deliberate omission from a forgotten one. Prefer one page to tabs; if tabs are used, keep usage guidance on the default tab.

---

## 3. Which kinds of documentation does a docs site need?

**The short answer.** Mostly reference and how-to. A component page is reference with how-to embedded; a docs site also needs a small amount of explanation (why the system is shaped as it is) and, for new contributors, a tutorial. Mixing the four on one page is the most common structural fault.

[Diátaxis](https://diataxis.fr/start-here/) sorts documentation by two axes, action versus cognition and acquisition versus application of skill, giving four types. In its own words: "A tutorial is a lesson, that takes a student by the hand through a learning experience." "A how-to guide addresses a real-world goal or problem." "Reference guides contain the technical description - facts - that a user needs in order to do things correctly." "Explanatory guides provide context and background."

Mapped to a design system site:

| Diátaxis type | On a design system site | Example |
|---|---|---|
| Reference | Component properties, tokens, states, specs | Spectrum's Component options; eBay's Specs |
| How-to | Usage guidance, patterns, "choosing a button" | eBay's Choosing a button; GOV.UK's How it works |
| Explanation | Principles, why a decision was made, research | GOV.UK's Research on this component |
| Tutorial | Getting started, first contribution | A contribution walkthrough |

The point of the mapping is not to split every page four ways. It is that each section of a page should be recognisably one type. A properties table interrupted by a paragraph of rationale is harder to scan, and a usage section that is really a list of props tells the reader nothing about choice.

[Write the Docs' documentation principles](https://www.writethedocs.org/guide/writing/docs-principles/) give the content rules that sit beside this. The content principles are ARID, Skimmable, Exemplary, Consistent and Current; the publication principles are Discoverable, Addressable, Cumulative, Complete and Beautiful. Three matter most for a design system site:

- **Skimmable:** "Structure content to help readers identify and skip over concepts which they already understand." A fixed skeleton is how a component page meets this.
- **Exemplary:** "Include (some) examples and tutorials in content." Do and don't examples belong here.
- **Current:** "Consider incorrect documentation to be worse than missing documentation." This is the strongest argument for generating what can be generated and dating it.

**Do and don't examples.** Atlassian, Primer and eBay each carry a Best practices section; on these sites it is where paired do and don't guidance lives. The practice worth copying is the pairing itself: a "don't" without the corresponding "do" tells the reader what to avoid but not what to reach for. The ecosystem guide's section 6 covers how far a Figma description can carry the same guidance.

**Recommendation.** Tag each section type in the page template (reference, how-to, explanation), and keep types from mixing within a section. Pair every "don't" with a "do". Treat Write the Docs' "Current" as a hard rule: a page that cannot be kept current should be generated or removed.

---

## 4. How should a docs site be navigated?

**The short answer.** Three levels: global navigation between sections of the site, local navigation within a section, and in-page navigation within a long page. Tabs select between views of the same thing; they are not a fourth navigation system.

[NN/g's table of contents guide](https://www.nngroup.com/articles/table-of-contents/) (Huei-Hsin Wang and Maddie Brown, 2023) is the most practical source for the in-page level. Its findings, briefly: a table of contents "increases the discoverability of the content that is low on the page"; in a left or right rail it should be sticky and highlight the current section; in the main body it should not be sticky, because a sticky version competes with global navigation; a right-rail version suffers from right-rail blindness and needs a clear label such as "On This Page". Its headings should match the section headings exactly and not skip any.

The docs sites above follow this. Primer shows "On this page"; GOV.UK's component pages carry a "Pages in this section" list for local navigation.

NN/g's tabs article supplies the rule that matters for a toolkit site with several files or platforms. It distinguishes **in-page tabs**, which "organize and present related content within a single page" and should keep the same layout while changing only the data, from **navigation tabs**, which go to different pages with different content. It says not to mix the two in one control, and not to use tabs at all when users need to compare information across them.

**Worked example: tabs choose the file or platform.** The toolkit's docs site uses tabs to pick which file (on Audits and Changes) or which platform a screen shows, with the same layout under each tab. That is NN/g's in-page tab used as intended: same layout, different data. The limitation is the one NN/g names. Someone who needs to compare two files' audit findings side by side must switch back and forth, which is the case NN/g says tabs serve badly. If that comparison becomes a real task, it wants a combined view with a file column, not a better tab.

**Recommendation.** Specify global, local and in-page navigation separately. Long pages get an "On this page" list in a rail, sticky, with the current section highlighted, and labels that match headings. Use tabs only to switch the data shown in an unchanged layout; never mix tab types in one control.

---

## 5. How should a generated page show provenance, freshness and change?

**The short answer.** Every generated page names what generated it and when, in a caption near the title. Every component page carries its own recent changes, newest first, dated, with a link to the full log.

Three sources set the bar. Write the Docs' "Current" principle says incorrect documentation is worse than none. GOV.UK's component pages put Recent changes on the page itself, with dated entries tied to a release. [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) gives the rules for the log: "Changelogs are for humans, not machines"; "There should be an entry for every single version"; "The latest version comes first"; "The release date of each version is displayed"; and changes grouped by type (Added, Changed, Deprecated, Removed, Fixed, Security).

For provenance, the clearest written rules come from statistics, not documentation. The [ONS chart text guidance](https://service-manual.ons.gov.uk/data-visualisation/guidance/chart-text) says "Each chart must include the source of the data directly after the chart", in the form "[Name of publication or source of data] from [Name of organisation]". The [Government Analysis Function's charts guidance](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/) adds that source text "should be in the body text of the page and not part of the chart image". A generated docs page is in the same position as a published chart: its content is only as trustworthy as its source, and the reader cannot see the source unless the page names it.

**Worked example: the "Updated by" caption.** Each overview page on the toolkit's docs site carries a caption under its title, "Updated by the snapshot of <date> and the audit of <date>", generated from the data the page reads. Assessed against the sources:

- It meets Write the Docs' "Current" in the only way a generated page can, by stating its age so a stale page is visibly stale.
- It follows the ONS form in substance (what produced it, and when), adapted for a page rather than a chart. ONS places the source after the chart; at page level, placing it under the title is defensible because it qualifies everything below it.
- It is in body text, not an image, as the Analysis Function asks.

What it does not yet say is whether the two sources are mutually consistent: a snapshot dated after the audit means the audit judged an older library. Stating both dates lets an alert reader spot that; a profile could make the check deterministic by flagging any page whose audit predates its snapshot. This is this guide's suggestion, not a sourced practice.

**Recommendation.** Every generated page carries a provenance caption naming each source and its date, in body text, under the title. Every component page carries recent changes, newest first, dated, grouped by type, linking to the full log. Flag a page whose sources are out of order.

---

## 6. What must a docs page specify, and what can a script check?

**The short answer.** Structure, provenance and change are checkable. Whether the guidance is any good is not.

| Requirement | Area | Check |
|---|---|---|
| Every declared skeleton section is present or marked not applicable | Content design | Deterministic |
| "When not to use" exists | Content design | Deterministic |
| "When not to use" names an alternative component or pattern | Content design | Judgement (a link to another component page can be checked; whether it is the right alternative cannot) |
| Each "don't" example has a paired "do" | Content design | Deterministic if examples are structured data |
| Recent changes present, newest first, every entry dated | Content design | Deterministic |
| Provenance caption present, names each source with a date | Content design | Deterministic |
| Audit date not older than snapshot date | Content design | Deterministic |
| "On this page" labels match headings, no heading skipped | UX | Deterministic |
| Heading levels do not skip | Accessibility | Deterministic |
| Each tab or section has its own address | UX | Deterministic |
| Tabs switch data in an unchanged layout | Interaction | Judgement, with a structural proxy (same template) |
| Sections do not mix Diátaxis types | Content design | Judgement |
| Examples are representative and the guidance is correct | Content design | Judgement |
| Internationalisation section addresses text expansion and direction | Accessibility, Content design | Judgement |

**Recommendation.** Run the deterministic rows in the docs build and fail it on any of them. Route the judgement rows to review, with the rubric written in the profile, so two reviewers ask the same question.

---

# Part two: dashboards and data tools

## 7. What kind of dashboard is it, and what does that decide?

**The short answer.** Decide first whether the dashboard is operational (watch and react now) or analytical (investigate later). That decides how much interaction it gets, how much it shows, and how much colour it uses.

[NN/g's dashboards article](https://www.nngroup.com/articles/dashboards-preattentive/) (Page Laubheimer, 2017) defines dashboards as "collections of data visualizations, presented in a single-page view". Operational dashboards "impart critical information quickly to users as they are engaged in time-sensitive tasks"; analytical dashboards help users "identify the need for further thought, investigation, research, or analysis". Carbon's [dashboards guidance](https://carbondesignsystem.com/data-visualization/dashboards/) draws a parallel line between presentation dashboards, which give "a big-picture view of the data", and exploration dashboards, which add search, sorting, filtering and drill-down.

NN/g's guidance on preattentive attributes is the most transferable part of the article. Length and 2D position are best for quantities, so bar charts, line charts and scatterplots. Area and angle are poor, so pies, donuts, treemaps and radial gauges are poor for quick comparison. Colour "doesn't convey order or magnitude" and should not encode quantity; it is good for highlighting outliers and should be a secondary cue, since about 4.5% of people have some form of colour blindness. Avoid 3D.

Carbon adds two rules for a dashboard as a whole: rank data by importance, with the most important data getting the highest contrast and most space, and "Always use consistent colors for each data set within a dashboard." Its [colour palettes](https://carbondesignsystem.com/data-visualization/color-palettes/) are the most complete published set: a 14-colour categorical sequence to be "applied in sequence strictly", ordered to "maximize contrast between neighboring colors"; sequential palettes where the darkest colour maps to the largest value in light themes and the lightest in dark; two diverging palettes, one for hot-versus-cold data and one for data without temperature meaning; and a four-colour alert palette (red, orange, yellow, green). Carbon's page does not address contrast against the background, so that must be checked separately.

The honest con: the operational and analytical split is a spectrum, and most internal tools sit in the middle. A maintenance dashboard for a design system is mostly analytical (which components need work) with an operational edge (did the last run fail). Naming which one a screen is still forces the right question about what goes at the top.

**Recommendation.** Every dashboard screen declares whether it is operational or analytical. Encode quantity with length or position, never with colour, area or angle. Assign each data series one colour across every chart on the screen, from a fixed categorical sequence used in order.

---

## 8. How should tables behave?

**The short answer.** Tables exist for four tasks: find records, compare them, view or edit one, and act on several. Each design choice should serve one of those, with density, sorting and a toolbar specified rather than improvised.

[NN/g's data tables article](https://www.nngroup.com/articles/data-tables/) (Page Laubheimer, 2022) names the four tasks and gives the core rules: freeze header rows and columns when the table is larger than the screen; make the first column a human-readable identifier, not a generated ID; order default columns by importance and keep related ones adjacent; make sorting easy; and "Filters need to be discoverable, quick, and powerful", with "a clear visual indication that filters are active".

[Carbon's data table](https://carbondesignsystem.com/components/data-table/usage/) is the most specific implementation guidance:

- **Density.** Five row heights: extra small 24px, small 32px, medium 40px (the default), large 48px, extra large 64px for two-line rows. The header row should always match the row size.
- **Toolbar.** "Reserved for global table actions such as table settings, complex filters, exporting, or editing table data", with "up to five actions" and the rest in an overflow menu. Toolbar height matches row height.
- **Batch actions.** Selecting a row brings up a batch action bar; while it is active, per-row actions are disabled.
- **Sorting.** "A sorted data table has three states: unsorted (`arrows`), sorted-up (`arrow--up`) or sorted-down (`arrow--down`)." Unsorted icons show on hover; only the sorted column keeps its icon.
- **Search.** Closed by default and "placed below the table title"; when always open, it sits on the left and stretches to meet the actions on the right.
- **Zebra stripes** are an optional modifier for scanning wide rows.

The cons. Carbon's density scale is five sizes; most products need two at most, and offering five as a user setting is a feature nobody asked for. NN/g's article does not address number alignment, so the common rule (right-align numerals, use tabular figures) has to come from elsewhere or be stated as house practice.

**Recommendation.** A table specification names which of the four tasks it serves, its row height, its default sort and the three sort states, its frozen headers, its identifier column, and its toolbar actions (five at most). State number alignment as a house rule.

---

## 9. How should filter bars and faceted filters work?

**The short answer.** One bar, in the same place on every screen, with facets that show how many results each value would give, values that would give none disabled, and a visible summary of what is applied. Small fixed choices can be segmented buttons; larger ones are menus.

The sources:

- **Live or batch.** NN/g's [User Intent Affects Filter Design](https://www.nngroup.com/articles/applying-filters/) (Katie Sherwin, 2016) says interactive filtering suits exploratory users and batch filtering suits users with clear criteria or a slow site. It notes that facets often show "the number of elements available under each filter", which helps users avoid zero-result searches, and that batch filtering makes that count harder to keep current. Carbon's [filtering pattern](https://carbondesignsystem.com/patterns/filtering/) uses the same split: instant updates for single-category filtering, batch with an "Apply filters" button for multi-category filtering and slow data. Anvil's [Toolbar Filters announcement](https://anvil.servicetitan.com/blog/posts/2026-02-09-introducing-filters) (February 2026) supports "instant (default), apply per-filter, and batch modes".
- **Do not freeze or jump.** Vitaly Friedman's [Smashing Magazine article](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/) (2021), commentary rather than research, says "Never freeze the UI on a single input" and "Never auto-scroll users on a single input", and recommends "displaying the number of results as soon as possible".
- **Show what is applied.** Baymard's [applied filters research](https://baymard.com/blog/how-to-design-applied-filters) says sites should "always display applied filters in an overview"; 28% of benchmarked sites show none. Testing found no clear winner for placement on desktop; what matters is that the overview is easy to see. Showing only a count of applied filters "didn't perform well during testing".
- **Where filters go.** Carbon: multiple-category filters go vertically on the left or horizontally above the data, and "Multiple categories should never be put within a menu or dropdown". Each category needs its own clear, and there should be a way to clear all.
- **Consistency.** Anvil's [filters pattern](https://anvil.servicetitan.com/docs/web/patterns/filters) says the most usable filters go first, and "If a specific filter option is used by 80% of users, make that the default." Its [Filter Bar design page](https://anvil.servicetitan.com/docs/web/components/filter-bar/design) says "Avoid changing the placement or conditions of actions such as the 'Clear All', 'Filters', and search bar", shows a single-select filter's choice in its label as "Label: Selection", and shows a multi-select's count in a chip.
- **Hide or disable.** [PatternFly's menu guidelines](https://www.patternfly.org/components/menus/menu/design-guidelines) split the two: disable an item when a prerequisite or condition is unmet ("disable the action and add a tooltip"), and hide it when a product rule means it can never apply.

**Worked examples from the toolkit's docs site**, assessed:

**One filter bar under the tabs, facets and toggles left, search right.** Placing one bar in the same position on every screen is what Anvil asks for and what NN/g's "discoverable" requires. The left-right order is the opposite of Carbon's data table, where search sits on the left under the title and actions on the right. Neither source tests the order, and Baymard found no placement winner for applied filters. The toolkit's choice is defensible on consistency and on putting the most-used control first (Anvil); it should be stated in the profile as a house decision, not presented as the industry pattern.

**Up to four choices as segmented buttons, more as a menu with counts.** Anvil reserves its segmented control for "a small, fixed set of filter options (e.g., switching between 2–4 views)". Apple's [segmented control guidance](https://developer.apple.com/design/human-interface-guidelines/segmented-controls) says "Aim for no more than about five to seven segments in a wide interface and no more than about five segments on iPhone." A threshold of four sits inside both. Carbon's rule against putting multiple categories in one menu is not broken, because the toolkit uses one menu per facet. The limitation: a segmented control shows all values at once and a menu hides them, so a facet that grows from four to five values changes from visible to hidden. That is a real cost and worth a sentence in the profile.

**Faceted counts.** Each menu option shows how many results it would give, counted within the other facets' current selection. This is the faceted-count behaviour NN/g describes and Smashing recommends, and it is what lets a user avoid a zero-result combination before choosing it.

**Empty options disabled, not hidden.** An option with zero results is shown disabled. That is PatternFly's rule: the option is unavailable because of a condition the user can change (another facet's selection), so it stays visible and disabled, and the list does not reshuffle as other facets change. The toolkit also hides the whole Component menu on a file that has no components; that matches PatternFly's other half, since no selection elsewhere can make it apply. The two behaviours are consistent with one rule, and the profile should state the rule rather than the two cases.

**What is missing.** Baymard's applied-filter overview. With menus that show their selection in the label (Anvil's "Label: Selection"), the bar itself is the overview, which may be enough on a docs site with few facets. If a facet ever becomes multi-select, a count alone will not do; Baymard found count-only summaries performed poorly.

**Recommendation.** One filter bar per screen, in a fixed position, with a fixed left-to-right order stated in the profile. Facets of four values or fewer as segmented buttons, more as a single-facet menu. Every option shows its faceted count; a zero-count option is disabled; a facet that cannot apply on this screen is hidden. Each applied selection is visible in the bar, with a way to clear each and to clear all. Instant updates unless the data is slow.

---

## 10. What do KPI tiles, empty states and degraded states need?

**The short answer.** A KPI tile states one number, what it measures, the period and the source. An empty state says why it is empty and what to do. A degraded state says what is missing and how old the rest is.

**KPI tiles.** Carbon's presentation dashboards exist to show "the current status of key performance indicators", and Carbon ranks the most important data highest in contrast and space. Neither Carbon nor NN/g specifies a tile in detail. The ONS subtitle rule is the best transferable standard: a chart subtitle "must include" the statistical measure, geographic coverage and time period, in that order. For a tile, that becomes: the number, what it counts, and over what period, with the source in the page caption. The ecosystem guide's section 5 adds the useful distinction between health figures (3 components with open accessibility failures) and inventory figures (715 variants); a KPI tile should almost always be the former. This is a judgement drawn from those sources, not a published tile specification.

**Empty states.** Carbon's [empty states pattern](https://carbondesignsystem.com/patterns/empty-states-pattern/) gives three types: no data (first use), user action (no results, a finished process) and error management (no permission, system problem, configuration needed). Each has a title, a body explaining why it is empty and what to do, and a primary action. Two rules matter most: "Don't lead users into a dead end. Always offer a path forward", and "Empty states should replace the element that would ordinarily show", so an empty table is replaced, headers and all, not left as an empty grid. Errors should be in "plain language (no codes)".

**Degraded states.** A dashboard fed by several sources will sometimes have some of them and not others: an audit that failed, a snapshot that is a week old. No source opened in this session specifies this case directly; Carbon's error-management empty state is the nearest. This guide's suggestion, stated as commentary: show what is available, mark what is missing with the same "not measured" language the ecosystem guide recommends for parity, and let the provenance caption carry the dates, so a stale source is visible as stale rather than silently mixed with fresh ones.

**Audit rows as question plus recommendation.** The toolkit's audit rows are phrased as a question (what changed, and what it does) followed by a recommendation. Carbon's empty-state rule, explain why and offer a path forward, is the nearest sourced principle: a finding without a recommendation is a dead end. The question form is a house register decision; no source opened here tests it against a plain statement.

**Recommendation.** Every KPI tile names its measure and period; the page caption names its source and date. Every empty state names its type, says why and offers an action, and replaces the element it stands in for. Every missing source is shown as missing, never as zero.

---

## 11. What must a dashboard page specify, and what can a script check?

| Requirement | Area | Check |
|---|---|---|
| Screen declares operational or analytical | UX | Deterministic (a declared field) |
| Each series has one colour across the screen, from the categorical sequence in order | Visual | Deterministic |
| No quantity encoded by colour alone, area or angle | Visual, Accessibility | Partly deterministic (chart type allow-list); judgement for edge cases |
| Every chart and tile has a source and period | Content design | Deterministic |
| Page caption names each source with a date | Content design | Deterministic |
| Table declares row height, default sort, identifier column | Interaction | Deterministic |
| Toolbar has five actions or fewer | Interaction | Deterministic |
| Sortable headers expose three states and `aria-sort` | Accessibility | Deterministic |
| One filter bar, in the declared position and order | Interaction | Deterministic |
| Facet of four values or fewer uses segmented buttons, otherwise a menu | Interaction | Deterministic |
| Every facet option shows a count; zero-count options disabled | Interaction | Deterministic |
| Applied selections visible, each clearable, clear all available | Interaction | Deterministic |
| Each empty state has a type, a reason and an action | Content design | Deterministic for presence; judgement for wording |
| Missing data shown as missing, not zero | Content design | Deterministic where the data model distinguishes them |
| Most important figure is most prominent | Visual, UX | Judgement |
| A KPI is a health figure, not an inventory figure | UX | Judgement |
| A finding's recommendation is actionable | Content design | Judgement |

**Recommendation.** Most of a dashboard profile is checkable, because most of it is about structure and data. Put the judgement rows in a short review rubric, and spend review time there.

---

# Part three: forms

## 12. How should a form be structured?

**The short answer.** Ask only what you need, one thing per page to start with, eligibility first, branching so people only see what applies, and a check answers page before submission.

GOV.UK's service manual on [form structure](https://www.gov.uk/service-manual/design/form-structure) is the clearest source: "Start by splitting the form across multiple pages with each page containing just one thing." Before writing any question, use a question protocol, which "forces you (and your organisation) to question why you're asking users"; list every piece of information, why it is needed and what will be done with it. "Start with questions that will let users know if they're not eligible for the service." Use branching "so people only have to answer questions that are relevant to them".

GOV.UK's [question pages pattern](https://design-system.service.gov.uk/patterns/question-pages/) gives the page-level rules: "Asking just one question per question page helps users understand what you're asking them to do"; "Always include a Back link component at the top of question pages"; set the `<legend>` or `<label>` as the page heading, so screen reader users hear it once; label the button "Continue", not "Next", and align it left. Long explanations do not go in hint text; use a statement heading, explanatory body text, and a specific question as the label.

Adam Silver takes the same line in [Form Design Patterns](https://www.smashingmagazine.com/printed-books/form-design-patterns/) (Smashing, 2018) and his [summary post](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/): "Start by putting each question onto a page of its own."

The honest con. One thing per page is a starting point, not a law; GOV.UK itself says to use multiple questions per page when research shows it helps, such as internal services where users switch tasks quickly. For an internal tool with expert users and short forms, a single page with grouped fields may be better. The profile should require the decision to be stated, not mandate one page per question.

**Recommendation.** Every form has a question protocol: each field's reason and use, written down before the form is built. Start with one thing per page, eligibility first, branching where answers differ; allow grouping only with a stated reason.

---

## 13. How should fields and labels be designed?

**The short answer.** Visible labels above fields, a single column, no placeholder as label, field width matched to the expected answer, and optional fields both minimised and marked.

[NN/g's web form design guidelines](https://www.nngroup.com/articles/web-form-design/) list ten rules: keep it short; visually group related labels and fields; present fields in a single column; use logical sequencing; avoid placeholder text; match fields to the type and size of the input; distinguish optional and required fields; explain input requirements; avoid reset and clear buttons; and give highly visible, specific error messages.

Adam Silver is blunter: "Every input needs a label", "Placeholders suck", and "Don't mark required fields, mark optional ones", ideally by removing optional fields altogether.

Baymard's evidence pushes the other way on marking. Its [required and optional fields research](https://baymard.com/blog/required-optional-form-fields) (Edward Scott, 2018, with 2021 benchmark figures) recommends that "both required and optional fields should be explicitly marked". It found that 32% of users hit a validation error on forms marking only optional fields, and only 14% of sites marked both. Its [checkout field count research](https://baymard.com/blog/checkout-flow-average-form-fields) (2024) found the average checkout has 11.3 fields, where "most sites need only 8 form fields in total".

This is a genuine disagreement. Silver and GOV.UK argue that marking only optional fields keeps the form quieter when most fields are required. Baymard's testing, on e-commerce checkouts, found users did not infer that unmarked fields were required. The context differs: GOV.UK's one-question pages make optionality obvious from the page, while a checkout shows many fields at once.

**Recommendation.** Labels visible and above fields; no placeholder as label; single column; field width matched to the answer. Minimise optional fields first. On one-question pages, mark optional only; on multi-field pages, mark both, following Baymard's evidence for that layout.

---

## 14. How and when should a form validate?

**The short answer.** On submit, with an error summary at the top linking to each field, and an error message beside each field. Inline validation on blur is contested; if used, never before the user has finished.

GOV.UK's [validation pattern](https://design-system.service.gov.uk/patterns/validation/) says "Do not validate when the user moves away from a field"; validate when they press Continue. On error, "show an Error summary component at the top of the page, and move keyboard focus to it"; "show Error message components next to fields with errors"; add "Error: " to the start of the page `<title>`; and redisplay "the form fields as the user filled them in". The [error summary component](https://design-system.service.gov.uk/components/error-summary/) adds that "You must link the errors in the error summary to the answer they relate to", with the heading "There is a problem". Silver agrees: "Don't validate as the user types", and "Don't disable buttons".

Baymard's [inline validation research](https://baymard.com/blog/inline-form-validation) (Edward Scott, 2024) disagrees on timing. It found 31% of sites have no inline validation, that inline validation can cut error-recovery time, and that the failure is premature validation, where users are told their input is wrong before they have finished. Its recommendation is to validate most fields when the user leaves them, remove an error as soon as the input is fixed, and show positive confirmation on correct fields.

Both camps agree on the failure: interrupting someone who has not finished. They disagree on whether blur is too early. GOV.UK's position rests on accessibility and on slower typists; Baymard's on checkout completion. NN/g's form guidelines do not settle when errors should appear.

**Recommendation.** Validate on submit as the baseline, with the GOV.UK error summary, field messages, focus move and "Error:" title prefix. Never disable the submit button. Add inline validation only where research for that form supports it, never before the field is left, and always clear the error as soon as it is fixed.

---

## 15. What must a form specify, and what can a script check?

**The short answer.** A check answers page before submission, plus a specification that is mostly structural and therefore mostly checkable.

GOV.UK's [check answers pattern](https://design-system.service.gov.uk/patterns/check-answers/) says to show "a single check answers page immediately before the confirmation screen" for small and medium transactions; to "provide a 'Change' link next to each section", with hidden text saying what each link changes; to show skipped optional questions as "Not provided"; and that after a change "the 'Continue' button should return them to the check answers page", asking any new questions the change creates first.

| Requirement | Area | Check |
|---|---|---|
| Every field has a recorded reason (question protocol) | UX | Deterministic for presence; judgement for the reason |
| Every input has a visible, programmatically associated label | Accessibility | Deterministic |
| No placeholder used as the only label | Accessibility, Content design | Deterministic |
| Question page heading is the label or legend | Accessibility | Deterministic |
| Back link at top of each question page | Interaction | Deterministic |
| Button says "Continue", not "Next" | Content design | Deterministic |
| Optional or required marking follows the declared rule | Content design | Deterministic |
| Submit button never disabled | Interaction | Deterministic |
| Error summary at top, heading "There is a problem", each error linked to its field | Accessibility | Deterministic |
| Focus moves to error summary; title prefixed "Error:" | Accessibility | Deterministic (browser test) |
| Field values preserved on error | Interaction | Deterministic (browser test) |
| No validation fires before a field is left | Interaction | Deterministic (browser test) |
| Check answers page has a Change link per row, with hidden text, returning to check answers | Interaction, Accessibility | Deterministic |
| Error messages say what went wrong and how to fix it | Content design | Judgement |
| Questions are ordered sensibly, eligibility first | UX | Judgement |
| One-thing-per-page versus grouping is justified | UX | Judgement |

**Recommendation.** Run the structural rows as automated browser tests. Keep the judgement rows to wording and order, which is where forms actually fail once the structure is right.

---

## 16. Cheat sheet

| Situation | Do this | Not this | Source |
|---|---|---|---|
| Component page structure | Fixed skeleton, "not applicable" marked explicitly | A section left out silently, or filled with filler | GOV.UK, Spectrum |
| Usage guidance | When to use and when not to use, side by side | "When not to use" buried in a second tab | GOV.UK, NN/g tabs |
| Do and don't | Every "don't" paired with a "do" | A list of prohibitions | Write the Docs (Exemplary) |
| Long page | Sticky "On this page" in a rail, labels matching headings | A sticky table of contents in the body | NN/g table of contents |
| Tabs | Same layout, different data | Tabs mixed with links to other pages | NN/g tabs |
| Generated page | Caption naming each source and its date | An undated page | Write the Docs (Current), ONS |
| Change | Recent changes on the page, newest first, dated, by type | A changelog only in the repository | GOV.UK, Keep a Changelog |
| Dashboard type | Declared operational or analytical | A screen that tries to be both at the top | NN/g, Carbon |
| Quantity | Length or position | Colour, area or angle | NN/g |
| Series colour | One colour per series, categorical sequence in order | Colours reassigned per chart | Carbon |
| Table | Declared row height, sort states, frozen headers, five toolbar actions or fewer | Five density settings offered to users | Carbon, NN/g |
| Filter bar | One per screen, fixed position and order | A different arrangement per screen | Anvil |
| Small facet | Segmented buttons, four or fewer values | Segmented buttons for eight values | Anvil, Apple HIG |
| Facet option with no results | Disabled, with count shown | Hidden, so the list reshuffles | PatternFly, NN/g filters |
| Applied filters | Visible in the bar, clearable each and all | A count alone | Baymard |
| Empty state | Reason and action, replacing the element | An empty table with headers | Carbon |
| Missing source | Shown as missing, dates in the caption | Shown as zero | This guide's judgement |
| Form length | Question protocol first | Fields added because someone might want them | GOV.UK |
| Labels | Visible, above, no placeholder as label | Floating labels or placeholder-only | NN/g, Silver |
| Optional fields | Minimise; mark optional on one-question pages, both on multi-field pages | Unmarked required fields on a long page | Silver, Baymard |
| Validation | On submit, summary at top, linked errors | Errors while the user is typing | GOV.UK, Baymard |
| Submit button | Always enabled | Disabled until valid | Silver |
| Before submission | Check answers with Change links | Straight to confirmation | GOV.UK |

---

## 17. The short version

An application profile turns a standard's five areas into the patterns one kind of product must use, and marks each as checkable by script or left to review. Three profiles cover most of what a design system toolkit ships: its documentation site, its dashboards, and any forms.

For a docs site, declare the component-page skeleton and check it. The shipping systems agree on the core: purpose, when to use and when not to use, an example, anatomy, properties, states, content, internationalisation, accessibility, and change. GOV.UK is the model for "when not to use" and for recent changes on the page; Spectrum for dropping a section rather than filling it. Keep sections to one Diátaxis type, pair every "don't" with a "do", and treat Write the Docs' "incorrect documentation is worse than missing documentation" as a rule. Every generated page names its sources and their dates; the toolkit's "Updated by" caption does this, and could also flag an audit older than its snapshot.

For dashboards, decide operational or analytical first, encode quantity with length or position, and keep each series' colour fixed across the screen. Tables declare density, sort states and toolbar. Filter bars sit in one place with one order, show faceted counts, disable empty options and hide inapplicable facets, and keep applied selections visible. The toolkit's choices (segmented buttons up to four values, menus with counts above that, empty options disabled) sit within the limits the sources give; its search-right order is the reverse of Carbon's and should be stated as a house decision. Empty states explain and offer a way forward; missing data is shown as missing.

For forms, write a question protocol, start with one thing per page, label everything visibly, validate on submit with GOV.UK's error summary, never disable the button, and end with a check answers page. Where GOV.UK and Baymard disagree (marking optional fields, validating on blur), the difference is layout and context, and the profile should say which applies.

**When something looks wrong, this is usually why.** A component page nobody trusts usually has no date and no change log. A filter bar people get lost in usually moves between screens. A facet list that jumps as you click is hiding empty options instead of disabling them. A dashboard where the eye goes nowhere has not decided whether it is operational or analytical. A form that tells people they are wrong before they have finished is validating as they type.

---

## Sources

### Documentation sites

- [GOV.UK Design System, Radios](https://design-system.service.gov.uk/components/radios/). Page structure, Recent changes with dated entries.
- [Adobe Spectrum, Button](https://spectrum.adobe.com/web/rsp/components/button) and [Checkbox](https://spectrum.adobe.com/web/rsp/components/checkbox). Section order; Content standards present on one and not the other.
- [GitHub Primer, Button](https://primer.style/product/components/button/) and [Button guidelines](https://primer.style/product/components/button/guidelines/). Overview, Guidelines, Accessibility tabs; React, Rails and Figma sections.
- [Atlassian Design System, Button](https://atlassian.design/components/button), with [Usage](https://atlassian.design/components/button/usage) and [Changelog](https://atlassian.design/components/button/changelog). Tab structure; usage headings read from the page source.
- [eBay Playbook, Checkbox](https://playbook.ebay.com/design-system/components/checkbox) and [Button](https://playbook.ebay.com/design-system/components/button). Section order varies by component.
- [Shopify Polaris repository](https://github.com/Shopify/polaris), [`content/components/actions/button.mdx`](https://github.com/Shopify/polaris-react-archive/blob/main/polaris.shopify.com/content/components/actions/button.mdx). MDX per component; repository archived.
- [Diátaxis, Start here](https://diataxis.fr/start-here/). The four types and two axes.
- [Write the Docs, Documentation principles](https://www.writethedocs.org/guide/writing/docs-principles/). Content and publication principles.
- [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). Guiding principles and change types.
- [NN/g, Table of Contents: The Ultimate Design Guide](https://www.nngroup.com/articles/table-of-contents/) (Wang and Brown, 2023).
- [NN/g, Tabs, Used Right](https://www.nngroup.com/articles/tabs-used-right/) (Sunwall, 2024).

### Dashboards and data tools

- [NN/g, Dashboards: Making Charts and Graphs Easier to Understand](https://www.nngroup.com/articles/dashboards-preattentive/) (Laubheimer, 2017).
- [NN/g, Data Tables: Four Major User Tasks](https://www.nngroup.com/articles/data-tables/) (Laubheimer, 2022).
- [NN/g, User Intent Affects Filter Design](https://www.nngroup.com/articles/applying-filters/) (Sherwin, 2016).
- [NN/g, Filters vs. Facets](https://www.nngroup.com/articles/filters-vs-facets/) (Whitenton, 2014). Definitions only.
- [Carbon, Dashboards](https://carbondesignsystem.com/data-visualization/dashboards/).
- [Carbon, Color palettes](https://carbondesignsystem.com/data-visualization/color-palettes/).
- [Carbon, Data table usage](https://carbondesignsystem.com/components/data-table/usage/).
- [Carbon, Filtering](https://carbondesignsystem.com/patterns/filtering/).
- [Carbon, Empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/).
- [Baymard, How to design applied filters](https://baymard.com/blog/how-to-design-applied-filters).
- [Smashing Magazine, Frustrating design patterns: broken, frozen filters](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/) (Friedman, 2021). Commentary.
- [Anvil, Filters pattern](https://anvil.servicetitan.com/docs/web/patterns/filters), [Filter Bar design](https://anvil.servicetitan.com/docs/web/components/filter-bar/design) and [Introducing Toolbar Filters](https://anvil.servicetitan.com/blog/posts/2026-02-09-introducing-filters) (February 2026).
- [PatternFly, Menu design guidelines](https://www.patternfly.org/components/menus/menu/design-guidelines). Disable versus hide.
- [Apple Human Interface Guidelines, Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls). Read through the page's published data file, since the page renders with JavaScript.
- [ONS Service Manual, Chart text](https://service-manual.ons.gov.uk/data-visualisation/guidance/chart-text).
- [Government Analysis Function, Data visualisation: charts](https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/).

### Forms

- [GOV.UK Service Manual, Structuring forms](https://www.gov.uk/service-manual/design/form-structure).
- [GOV.UK Design System, Question pages](https://design-system.service.gov.uk/patterns/question-pages/), [Check answers](https://design-system.service.gov.uk/patterns/check-answers/), [Validation](https://design-system.service.gov.uk/patterns/validation/) and [Error summary](https://design-system.service.gov.uk/components/error-summary/).
- [NN/g, Website Forms Usability: Top 10 Recommendations](https://www.nngroup.com/articles/web-form-design/).
- [Baymard, Checkout flow average form fields](https://baymard.com/blog/checkout-flow-average-form-fields) (2024), [Required and optional form fields](https://baymard.com/blog/required-optional-form-fields) (2018, 2021 figures) and [Inline form validation](https://baymard.com/blog/inline-form-validation) (2024).
- [Adam Silver, Form Design Patterns](https://www.smashingmagazine.com/printed-books/form-design-patterns/) (Smashing, 2018) and [Form design: from zero to hero](https://adamsilver.io/blog/form-design-from-zero-to-hero-all-in-one-blog-post/). Practitioner guidance.

### Toolkit worked examples

- Toolkit repository, `tools/docs`, commits of 11 October 2026: `faff0407` (one filter bar, overview captions, `UpdatedBy.astro`), `95e7f257` (filters left, search right), `cbabdcc9` (faceted counts), `c99069f5` (four choices as buttons, more as a menu), `053758d4` (empty options disabled), `107f862c` (Component menu hidden where no components; breaking rows as question and recommendation).

### Not confirmed and left out

- Material 3's segmented-button guidance: the page rendered no body text, so its option limits are not cited.
- An NN/g article on hiding versus disabling filter options: none was found; PatternFly is cited instead.
- A 1987 human factors study comparing greyed-out and removed menu items, surfaced by search: only the abstract was visible, so it is not cited.
- A GOV.UK page on documenting components: the address tried returned 404. The ecosystem guide cites GOV.UK's documentation research.
