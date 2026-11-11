# Profile: design-system documentation

What a page on a design-system documentation site must specify: the site's structure and navigation, the page frame and its visual, the component page and its section order, foundations and patterns pages, content types, FAQ pages, footnotes and side notes, examples and code, in-page navigation, provenance, change and versioning, search, docs for agents, and when a hosted platform fits. It binds the fundamentals (`../design/ux.md`, `../design/interaction.md`, `../design/visual.md`, `../design/content.md`, `../design/accessibility.md`) and the patterns (`../patterns/navigation.md`, `../patterns/search.md`, `../patterns/tables.md`, `../patterns/disclosure.md`, `../patterns/feedback.md`, `../patterns/data.md`) to one kind of product. It serves the [design-standard](../../../standards/design-standard.md) principles *serve a real need*, *consistent, not uniform*, *honest* and *clear words, clear hierarchy*, and applies design-standard rule 1 (provenance and freshness), design-standard rules 3–6, 11 and 12 (wherever a docs page filters a list), design-standard rule 7 (headings sit with their content) and design-standard rule 8 (attributes as columns). The design-standard *Application profiles* entry names this file; it admits nothing as a rule.

---

## Site structure and navigation

**Use when**
- [weak] Building or auditing the frame of a docs site: header, section list, page list, the first screen a reader lands on.
- [weak] A site adds a section (foundations, patterns, a platform) and the reader must still know where they are.

**How**
- [weak] Specify three levels separately: **global** (between sections: Foundations, Components, Patterns, Get started), **local** (pages within the current section, in a side list) and **in-page** (the "On this page" list, below). Tabs are not a fourth navigation system; they switch views of one page ([NN/g, Tabs, Used Right](https://www.nngroup.com/articles/tabs-used-right/)).
- [strong] One site for design and code guidance. Atlassian and Primer both merged two sites into one; Spectrum's split let its design side go stale, and Polaris's move into a developer portal shrank its guidance to a footnote ([Atlassian, 2020](https://community.developer.atlassian.com/t/our-new-home-for-atlassian-design-system/40698); [Primer React PR #4822](https://github.com/primer/react/pull/4822)). Link to the code reference (Storybook, source) at the exact story or symbol rather than rebuilding it.
- [weak] Local navigation lists every page in the section, in a stable order (alphabetical for components, by task for patterns), with the current page marked. GOV.UK labels it "Pages in this section".
- [required] Global sections stay in the same order and place on every page. A section that exists only on some pages reads as a different site.
- [weak] Small screens: global and local navigation collapse behind one menu button; the current section and page stay visible as a heading, so the reader still knows where they are.
- [weak] Navigation behaviour in depth is `../patterns/navigation.md` (breadcrumbs, tabs, in-page lists), `../patterns/menus.md` (the top bar and the mobile menu) and `../patterns/sidebars.md` (the side navigation).

**Cases**
- A component page has Usage, Code and Accessibility tabs that link to three separate URLs with different layouts → those are navigation links styled as tabs; make them one page with sections, or real in-page tabs with a shared layout. NN/g says not to mix tab types in one control.
- The site has a "Design" header link and a "Develop" header link that lead to two pages per component → merge to one page per component, guidance first, code after.
- A detail page (one token) sits under a listing page (all tokens) with no link of its own in the side list → the listing's entry stays marked as current, so the reader knows where they are.

**Accessibility**
- [required] 2.4.5 Multiple Ways: navigation and search are two ways to reach a page. 3.2.3 Consistent Navigation: global and local lists keep their order on every page. 2.4.1 Bypass Blocks: a skip link past the side navigation. 2.4.8 Location (AAA) is the reason for the marked current page.
- [required] Implementation: code-standard rule 64 (`aria-current`), code-standard rule 1 (landmarks, one `h1`), code-standard rule 2 (DOM order is reading order, so the side list comes before or after `main` deliberately).

**Build**
- [required] Three `nav` landmarks, each named (`aria-label="Sections"`, `"Pages in this section"`, `"On this page"`), around one `main` holding one `h1` ([HTML semantics: landmarks](../../code/html-semantics.md#landmarks); code-standard rules 1 and 3).
- [required] Each list is a `ul` of links; the current page's link carries `aria-current="page"`, and a detail page marks its listing's entry (code-standard rule 64).
- [strong] A skip link is the first focusable element and targets `main` ([navigation: skip links](../patterns/navigation.md#skip-links)).
- [required] The small-screen menu is a disclosure button with `aria-expanded` over the same list, not a menu role ([accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex)); the side list's place in the DOM is chosen for reading order (code-standard rule 2).

**Check**
- *Script:* could check that every page carries the same global links in the same order, that exactly one local link is current, and that a skip link exists. code-standard rule 64 already names the marking.
- *Judgement:* can a reader dropped on any page say which section they are in and what else it holds, without scrolling?

**Sources:** [NN/g tabs](https://www.nngroup.com/articles/tabs-used-right/); [GOV.UK text input](https://design-system.service.gov.uk/components/text-input/) for "Pages in this section"; [Atlassian, 2020](https://community.developer.atlassian.com/t/our-new-home-for-atlassian-design-system/40698) and [Primer React PR #4822](https://github.com/primer/react/pull/4822) for the merges. Carbon keeps tabs (Usage, Style, Code, Accessibility) while GOV.UK, Codex and Spectrum's design site use one long page. A 2026-11 recount found tabs also on eBay, Atlassian, Primer, Spectrum Web Components and every zeroheight and Supernova site measured, so tabs are the more common choice; the toolkit still prefers one page, because tabs hide content readers rarely switch to (NN/g) and no source measured the opposite.

---

## Page frame and visual

**Use when**
- [weak] Setting or auditing the frame every docs page shares: grid, widths, header, body size, theme, the home page.

**How**
- [strong] **Three columns at desktop:** side list, content, "On this page" rail. Of twelve sites measured (2026-11-11, 1440px), ten had the right rail; side lists ran 224–350px, rails 156–352px, headers 48–74px and sticky (Spectrum's 104px and GOV.UK's 121px the outliers). Material 3 has no top bar, only an 88px rail.
- [strong] **Prose capped, examples wider.** Prose ran 530–800px on all twelve (Spectrum Hub 530, GOV.UK 722, Primer 728, Base UI 768); canvases and tables may run the full content width. The measure itself is [visual: typography](../design/visual.md#typography) (about 65–75 `ch`).
- [strong] **Body size follows the reader.** 16/24 is the common default; reading-led sites go larger (GOV.UK 19/25, Fluent 20/28, React Spectrum 20/30), reference-dense ones smaller (Atlassian 14/20, shopify.dev 14/20). A docs site for one team's library is reference: 16 holds, though [visual: typography](../design/visual.md#typography) allows a 14/20 body for a tool or docs site; reading sizes are [visual: type for UI and long-form content](../design/visual.md#type-for-ui-and-long-form-content).
- [moderate] **A docs voice apart from the UI type is optional.** Carbon sets its `h1` in a light serif, Codex in Linux Libertine, over sans body text; it marks the page as documentation, not product. Most sites use the system's own sans throughout.
- [strong] **Dark mode follows the system on first visit, with a toggle in the header.** Eight of twelve did both; Primer and Material 3 have a toggle but did not follow the system; Carbon and GOV.UK have no site dark mode. None of the four zeroheight and Supernova sites measured followed the system either ([Hosted platforms](#hosted-platforms)). This is the site's theme, separate from the theme of the component being shown ([Examples](#examples-do-and-dont-live-examples-code)).
- [moderate] **Brand on the home page and the page hero, not in the reference body.** eBay and Material 3 open component pages with a large illustration or media; eBay's home page is a type-only headline. Reference sections stay plain.
- [weak] **Status sits under the title**, and may repeat beside the entry in the side list (Atlassian); what it says is [Change logs, status and versioning](#change-logs-status-and-versioning) and [the component page](#the-component-page).
- [strong] **Ship the content in the HTML.** A public zeroheight page's HTML holds only its title until script runs; Supernova and static generators serve the landmarks and text. A docs page is readable, indexable and quotable with script off.

**Cases**
- Prose runs the full content column at 1000px → cap it at the measure; let the preview and tables keep the width.
- The site defaults to light whatever the system says → follow `prefers-color-scheme` until the reader picks, then remember the pick.
- At 390px the page scrolls sideways (Spectrum Hub reached 557px, Fluent 455px, Codex 421px in the 2026-11 run) → the overflowing table or canvas scrolls in its own region; the page never does.
- The document reports no overflow, yet the content is cut at 390px → the page scrolls in an inner container with `overflow: hidden` on the body, as on the zeroheight sites measured (Uber Base, Teamleader Ahoy); the check has to measure that container too.

**Accessibility**
- [required] 1.4.10 Reflow (no page scroll at 320px), 1.4.8 Visual Presentation (AAA; line length no more than 80 characters), 1.4.12 Text Spacing.
- [required] Implementation: code-standard rule 7 (prose scale), code-standard rule 46 (one page grid; the header height is such a dimension, stated once).

**Build**
- [required] One page grid stated once ([responsive: one page grid and one container element](../../code/responsive.md#one-page-grid-and-one-container-element)); the prose measure on prose elements only, never on the content column ([visual: layout and grid](../design/visual.md#layout-and-grid)).
- [weak] The theme toggle is `system | light | dark`, the system value stored as no preference, applied as an attribute on the root ([tokens: themes and modes](../../code/tokens.md#themes-and-modes)).
- [required] Static output: the generator writes every page's text into its HTML, so reading needs no script; interactions keep their no-script path (code-standard rule 20).

**Check**
- *Script:* could check `scrollWidth ≤ innerWidth` at 320px and 390px on every page and every scrolling container in it, rendered prose lines within 80 characters (a `ch` value is not a character count, [visual: layout and grid](../design/visual.md#layout-and-grid)), and that the page's text is in the served HTML.
- *Judgement:* does the frame recede, so the component is what the eye lands on?

**Sources:** measured live, 2026-11-11, on each system's Button page: [eBay Playbook](https://playbook.ebay.com/design-system/components/button), [Spectrum](https://spectrum.adobe.com/web/rsp/components/button), [React Spectrum](https://react-spectrum.adobe.com/Button), [Carbon](https://carbondesignsystem.com/components/button/usage/), [shopify.dev Polaris](https://shopify.dev/docs/api/polaris), [Primer](https://primer.style/product/components/button/), [Atlassian](https://atlassian.design/components/button), [GOV.UK](https://design-system.service.gov.uk/components/button/), [Material 3](https://m3.material.io/components/buttons/overview), [Fluent 2](https://fluent2.microsoft.design/components/web/react/core/button/usage), [Codex](https://doc.wikimedia.org/codex/latest/components/demos/button.html), [Base UI](https://base-ui.com/react/components/menu); [mews.design](https://www.mews.design/latest/welcome-eumfLxWD) (Supernova) for static output. Widths are from one viewport and one page each; treat them as ranges, not targets.

---

## The component page

**Use when**
- [weak] Writing, generating or auditing the page for one component.
- [weak] A reader must decide whether to use a component before deciding how to build it.

**How**
- [moderate] One fixed skeleton, in this order: **overview** (one-line purpose, status, links to design and code), **example** (live, with the main variants), **when to use**, **when not to use** (each item naming the alternative), **anatomy**, **variants and states** (what sets each: a property or an interaction), **behaviour** (keyboard, overflow, responsive, motion), **content guidance**, **accessibility** (role, keyboard pattern, known gaps; split by who acts, below), **code** (properties table, links to the exact story or symbol), **change log** (recent changes on the page), then a **report a problem** link.
- [strong] The order answers "should I use this?" before "how is it built?". The shipping systems agree on the core and disagree on labels:

| System | Order as shipped |
|---|---|
| GOV.UK | Example, When to use, When not to use, How it works, Research, Recent changes, Help improve |
| Spectrum | Anatomy, Component options, States, Behaviors, Usage guidelines, Content standards, Internationalization, Accessibility |
| Primer | Tabs: Overview, Guidelines, Accessibility; code on the overview |
| Atlassian | Tabs: Examples, Code, Usage, Changelog; Usage runs Parts, Accessibility, Best practices, Content guidelines, Related |
| eBay Playbook | Anatomy, Properties, Behavior, Platforms, Best practices, Specs; varies by component |

- [weak] A section with nothing to say is marked "Not applicable" in the source, so a script can tell a deliberate gap from a forgotten one. Spectrum drops Content standards where a component carries no text; the toolkit keeps the heading with "Not applicable" instead, because a silent gap cannot be checked. An empty guidance section says "No guidance yet" rather than vanishing, since GOV.UK's [documentation research](https://designnotes.blog.gov.uk/2018/11/05/how-we-document-components-and-patterns-in-the-gov-uk-design-system/) asks for honest docs.
- [weak] Internationalisation (text expansion, right-to-left) gets a sentence under behaviour or content when the component carries text, as Spectrum does.
- [moderate] Hold every generated table to one test: does it help someone choose, build or check this component? A variant-by-state grid of 216 cells, or every token across every variant, goes behind a disclosure (`../patterns/disclosure.md`) or into an export. Primer's own [PR #710](https://github.com/primer/design/pull/710) called its mixed props tables a "matrix of sadness".
- [weak] Headline figures are health (3 open accessibility failures), never inventory (715 variants).
- [weak] If tabs are used, "when not to use" stays on the default tab: readers tend to stay on the default ([NN/g](https://www.nngroup.com/articles/tabs-used-right/)).
- [moderate] **Status per platform, not one badge.** Primer opens with React, Rails and Figma cards, each with its status and links; eBay versions the design spec ("v2.0") apart from each framework's release ([eBay `component-metadata`](https://github.com/eBay/evo-web/blob/main/src/data/component-metadata.d.ts)). A component can be stable in Figma and absent in code; one badge hides which.
- [weak] **One record per component** feeds that header: the design spec's version, each implementation's version and status, its story ids, its last review and its last accessibility review (Primer's [`Button.docs.json`](https://github.com/primer/react/blob/main/packages/react/src/Button/Button.docs.json) carries `a11yReviewed`; material-web's docs carry a `freshness` owner and review date, unchecked here). A generator reads the record; nobody types the header.
- [moderate] **The properties table, before code exists, is the design API**: Property, Type, Values, Default, Required, Description, as [Spectrum Design Data](https://opensource.adobe.com/spectrum-design-data/components/button/) publishes it, framework-free. A code column joins only when a mapping exists (Primer's Code Connect `Button.figma.tsx`). Shipped code tables vary: React Spectrum has Name, Type, Default, Description; web components add Attribute ([Spectrum Web Components](https://opensource.adobe.com/spectrum-web-components/components/button)); GOV.UK puts defaults in the description.
- [weak] **Accessibility split by who acts** ([Carbon](https://carbondesignsystem.com/components/button/accessibility/)): what the component provides, what designers annotate, what developers must add, then a testing-status table (keyboard, screen readers named) against a component version.
- [moderate] **End with a way to report a problem**: GOV.UK's "Help improve this component", Carbon's issues link. A reader who finds the page wrong should not need to find the tracker.

**Cases**
- A Button page opens with "Button has 216 variants" → replace with the one-line purpose and status; move the count into the properties section, if anywhere.
- "When not to use" says "Don't use for navigation" → add the alternative: "Use a link instead", linked to the Link page. A prohibition without an alternative tells the reader what to avoid and not what to reach for.
- A component has no text (a divider) → content guidance reads "Not applicable: this component carries no text." The section stays, so the skeleton check passes and the reader learns it was considered.
- Usage guidance sits on a second tab behind Examples → move it to the default tab, or collapse to one page.
- The accessibility section repeats generic WCAG paragraphs on every page → keep the component's role, keyboard pattern, a link to the matching APG pattern, and its known gaps; cut the boilerplate.
- A component exists in Figma only → the example is an image of the design, labelled as design; once code exists, the live example replaces it.

**Accessibility**
- [required] 1.3.1 Info and Relationships and 2.4.6 Headings and Labels: the skeleton is a heading outline, levels never skipped, labels that say what follows. 2.4.10 Section Headings (AAA) is why each section has one.
- [required] Live examples obey the criteria of the component they show; an inaccessible example teaches the inaccessible build.
- [required] Implementation: code-standard rule 1 (one `h1`, no skipped levels), code-standard rule 7 (prose scale for page content).

**Build**
- [required] The skeleton is the heading outline: one `h1`, an `h2` per section with an `id`, levels never skipped ([HTML semantics: headings and the outline](../../code/html-semantics.md#headings-and-the-outline); code-standard rule 1).
- [required] Page prose takes the prose scale, generated tables and examples their components' own styles (code-standard rule 7).
- [required] "Not applicable" is a marker the template writes from data (a `data-section-state="not-applicable"` hook beside the text), so a script reads it rather than parsing prose (code-standard rule 6).
- [moderate] A large generated table sits in `details` closed by default ([HTML semantics: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers)); the properties table is a real `table` ([HTML semantics: tables for data](../../code/html-semantics.md#tables-for-data)).
- [required] The page is generated from the snapshot, never typed (toolkit-standard §D 23; code-standard rule 23).

**Check**
- *Script:* could check each declared section is present or marked "Not applicable", "When not to use" exists, the change log is present with dated entries, and headings do not skip.
- *Judgement:* does "when not to use" name the right alternative? Does every generated table help someone choose, build or check?

**Sources:** [GOV.UK text input](https://design-system.service.gov.uk/components/text-input/) (When to use, When not to use, How it works, Research, Recent changes as a Date/Changed/Description table); [Spectrum button](https://spectrum.adobe.com/web/rsp/components/button), [Primer button](https://primer.style/product/components/button/), [Atlassian button usage](https://atlassian.design/components/button/usage), [eBay checkbox](https://playbook.ebay.com/design-system/components/checkbox), [GOV.UK documentation research (2018)](https://designnotes.blog.gov.uk/2018/11/05/how-we-document-components-and-patterns-in-the-gov-uk-design-system/). GOV.UK puts the example first and anatomy inside "How it works"; Spectrum leads with anatomy. The toolkit puts purpose and example first, then the use decision, then anatomy, because GOV.UK's 2018 research is the only published evidence on docs structure and it puts the decision early.

---

## Foundations pages: tokens, colour, type

**Use when**
- [weak] A page documents tokens (colour, spacing, radius, elevation, motion) or styles (type, colour palettes).
- [weak] A page is generated from a token payload or snapshot.

**How**
- [strong] **Semantic token table** first: `Token and description | Light | Dark` (one column per mode), the value shown as the primitive it aliases and its resolved value, with search and copy. [Atlassian](https://atlassian.design/components/tokens/all-tokens), [Fluent](https://fluent2.microsoft.design/color-tokens) and [Codex](https://doc.wikimedia.org/codex/latest/design-tokens/color.html) converge on this. Each attribute is a column (design-standard rule 8).
- [weak] **Primitives** as compact ramps (swatches in step order) on a secondary page. Most readers need the semantic layer; primitives matter to the people maintaining it.
- [strong] **Swatch**: a chip with the token name and value in text beside it. The name carries the meaning; the chip only illustrates.
- [weak] **Type specimen**: each style rendered at its real size with a real sentence, its name, and size, line height, weight and letter-spacing as text, in the units the reader's platform uses (web styles in rem and unitless line height).
- [weak] **Contrast**: only for defined foreground and background pairs. Computing every combination is noise; Paste's "accessible pairing" popover is the one shipping example.
- [weak] Generate from the same payload the code uses, and carry the provenance caption (below). GOV.UK removed its colour generator during a colour rework ([PR #5002](https://github.com/alphagov/govuk-design-system/pull/5002)); that is the risk of a generator tied to a format being redesigned, not of generation.
- [weak] Deprecated tokens stay listed, marked deprecated, with their replacement, until removed.
- [moderate] **Each row says when not to use the token** where misuse is likely (Atlassian's `border.width.selected`: "Do not use as a substitute for a separate keyboard focus indicator"), the primitive in Carbon's form ("Blue 60 — #0f62fe"), and the version it arrived in (Atlassian: "Introduced v…" on each token). Carbon's component tokens say they are for their own component only ([Carbon colour tokens](https://carbondesignsystem.com/elements/color/tokens/)).
- [weak] **Modes stack in one fixed order** (base, then brand, then dark), stated on the page, so a resolved value can be traced ([Supernova theme tokens](https://learn.supernova.io/latest/documentation/documentation-blocks/tokens/displaying-theme-tokens-nd3dFnzE)).
- [moderate] **A reference that does not resolve fails the build.** zeroheight prints "token not found" for a deleted token; a Supernova page printed "undefined" for an empty field ([zeroheight](https://help.zeroheight.com/hc/en-us/articles/35886930025755); [mews.design Button](https://www.mews.design/latest/components/button/overview-NEe9ihrh)). A generator knows at build time and stops.
- [strong] Small screens: the table keeps the token name as its first column and scrolls horizontally inside its own container, never the page.

**Cases**
- A colour page renders 374 variables in one flat list → lead with the semantic layer in a per-mode table; ramps for primitives on a second page; the rest behind search.
- Swatches show only colour with the name on hover → put the name and value in visible text; colour alone cannot be read, copied or searched.
- A type specimen shows "Aa" at each size → render a real line of text at each style, so line length and line height can be judged.

**Accessibility**
- [required] 1.4.1 Use of Colour: a swatch is identified by its text, never by its colour alone. 1.1.1 Non-text Content: decorative chips are hidden from assistive technology when the name sits beside them. 1.3.1: the token table is a real table with header cells. 1.4.10 Reflow: the table scrolls in its own region at 320px.
- [required] Implementation: code-standard rule 18 (decorative images), code-standard rules 52 and 53 (how names and modes are built, which the page reads).

**Build**
- [required] The token table is a `table` with a `caption`, the token name in a `th scope="row"`, one `th scope="col"` per mode ([HTML semantics: tables for data](../../code/html-semantics.md#tables-for-data)).
- [required] A swatch chip is decorative, `aria-hidden="true"`, beside the name and value in text (code-standard rule 18); the name is in `code` so it copies exactly.
- [required] Each mode column renders the chip under that mode's attribute, not a hard-coded colour, so the page reads the same tokens the product does ([tokens: themes and modes](../../code/tokens.md#themes-and-modes); code-standard rules 52 and 53).
- [weak] The table scrolls inside a named, focusable container at narrow widths ([responsive: tables on small screens](../../code/responsive.md#tables-on-small-screens)).
- [required] The page is generated from the token build's output, never edited (toolkit-standard §D 23; code-standard rule 23).

**Check**
- *Script:* could check every swatch has a text name, every mode in the payload has a column, and the page caption names its payload and date. `tools/ui-check/check.mjs` does not yet.
- *Judgement:* does the page lead with what most readers use, or with everything the payload holds?

**Sources:** as linked above; Paste's pairing popover is in its [tokens list source](https://github.com/twilio-labs/paste/tree/main/packages/paste-website/src/components/tokens-list). Primer shows only the active theme; the toolkit shows every mode as a column, following the majority.

---

## Patterns pages

**Use when**
- [weak] A page documents a recurring solution that spans components: filtering, empty states, forms, saving, navigation.
- [weak] The question the reader brings is "how do I solve this task?", not "how does this component work?".

**How**
- [weak] Open with the user need the pattern solves, in one sentence, then **when to use** and **when not to use** (naming the alternative pattern), then **how it works** as steps or a worked screen, then the **components it uses** (linked), then **accessibility**, **research** if any, and **change log**.
- [moderate] A pattern page is mostly how-to (Diátaxis), with reference only for the components it links. GOV.UK's patterns (question pages, check answers, validation) follow the same order as its components.
- [required] Show the pattern in a realistic screen, not a lone component. A filtering pattern shows the tabs, the bar and the list together (design-standard rule 3).
- [weak] State the house decisions as decisions: where the sources disagree (search left or right, validate on blur or submit), say which way the system goes and why, as the knowledge pages do (for example [interaction: validation timing](../design/interaction.md#error-prevention-and-validation-timing)).

**Cases**
- A "Filtering" page lists the Select, Chip and Search components with their props → rewrite as how-to: when to filter, where the bar goes, how counts and disabled options behave (design-standard rules 3–6, 11), with the components linked.
- Two pattern pages describe empty states differently → one page owns it; the other links to it.
- A pattern contradicts Carbon (search on the right) → say so on the page with the reason; readers who know Carbon will otherwise report it as a bug.

**Accessibility**
- [required] The criteria are the pattern's own, named on its page: 3.3.1 and 3.3.3 for validation, 4.1.3 Status Messages for live results, 2.4.3 Focus Order for multi-step flows.
- [required] Implementation: cite the code-standard rule that implements each, for example code-standard rule 14 for a live swap in a filtered list.

**Build**
- [required] A pattern page is a page template whose sections are headings in a fixed order, so the outline is the skeleton ([HTML semantics: headings and the outline](../../code/html-semantics.md#headings-and-the-outline); code-standard rule 1).
- [weak] Its realistic screen is a live example served from the components themselves, never a screenshot ([HTML semantics: code samples and live examples](../../code/html-semantics.md#code-samples-and-live-examples)).

**Check**
- *Script:* could check that a pattern page links at least one component page and carries "when not to use".
- *Judgement:* does the page solve a task, or catalogue components?

**Sources:** [GOV.UK patterns](https://design-system.service.gov.uk/patterns/question-pages/); [Diátaxis](https://diataxis.fr/compass/). No source specifies a pattern-page skeleton; this one mirrors the component page so readers learn one shape.

---

## Content types (Diátaxis)

**Use when**
- [weak] Planning a section, auditing a page that reads as muddled, or deciding where a new piece of writing goes.

**How**
- [weak] Four types: **tutorial** (a lesson), **how-to** (a goal or problem), **reference** (facts needed to act correctly), **explanation** (context and background) ([Diátaxis](https://diataxis.fr/compass/)).
- [weak] On a design-system site: reference is properties, tokens, states, specs; how-to is usage guidance and patterns; explanation is principles, research and decisions; tutorial is getting started and a first contribution.
- [weak] One type per section. A page may hold several types (a component page is reference with how-to inside), but each section is recognisably one. A properties table broken by a paragraph of rationale is harder to scan.
- [weak] Tag each section's type in the page template, so a reviewer can ask the question per section.
- [weak] Write the Docs' content principles apply: *Skimmable*, *Exemplary*, *Current* ("Consider incorrect documentation to be worse than missing documentation"). Reading level for docs is [content: plain language and reading level](../design/content.md#plain-language-and-reading-level).

**Cases**
- A Getting started page mixes installation steps with the system's history → split: steps stay (tutorial); history moves to an About or Principles page (explanation).
- A usage section is really a list of props → it tells nothing about choice; rewrite as "use X when…", and move the props to the code section.
- A token reference page opens with three paragraphs on why tokens matter → one sentence, linking to an explanation page.

**Accessibility**
- [required] 3.1.5 Reading Level (AAA) and 2.4.6 Headings and Labels: a section whose heading names its type ("How to…", "Properties") sets expectations.
- [weak] No code-standard rule applies; this is content.

**Build**
- [required] The type tag is front matter or a data attribute on each section in the page source, read by the check; it renders nothing a reader needs (code-standard rule 6 for attributes as hooks).

**Check**
- *Script:* could check each section carries a declared type tag in the source.
- *Judgement:* is each section one type? Would a reader looking for a fact find it without reading an argument first?

**Sources:** [Diátaxis compass](https://diataxis.fr/compass/); [Write the Docs principles](https://www.writethedocs.org/guide/writing/docs-principles/).

---

## FAQ pages

**Use when**
- [contested] Rarely. Before writing an FAQ, check whether each answer belongs on the page the question is about; on a docs site it almost always does.
- [weak] An FAQ earns its place for questions readers really ask (from support, issues, search logs) that span several pages and have no single home, such as "Can I use the system without the component library?". NN/g's [FAQs still deliver value](https://www.nngroup.com/articles/faqs-deliver-value/): "many people already know to look for an FAQ when they need a fast answer."
- [weak] Not as a home for content that has one. The GOV.UK [style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/): "Do not use FAQs on GOV.UK. If you write content by starting with user needs, you will not need to use FAQs."

**How**
- [weak] **Asked questions only, in the readers' words.** NN/g: "the questions should reflect the vocabulary and phrasing of your visitors"; of questions the team invents, "We have long warned against that bad practice."
- [weak] **A short answer that links to the page owning the detail.** The FAQ never holds the only copy. GDS's [FAQs: why we don't have them](https://gds.blog.gov.uk/2013/07/25/faqs-why-we-dont-have-them/): "Usually, I see FAQs duplicating content", and the copies compete in search.
- [weak] **A question that keeps coming is a gap in the owning page.** Fix that page; the entry shrinks to a link or goes.
- [weak] **Front-load.** GDS: "questions take longer to scan and understand than simple headings". Put the topic word early in each question, or use a plain heading where the question form adds nothing.
- [weak] **Shape by length.** A short FAQ is a question list, then the answers on one page: NN/g calls it "still the best underlying design for short and medium-length (less than 10-page) FAQs". A long one is "chunked by topic", or becomes "a separate list of questions that lead to answer pages (or topic pages)".
- [contested] **Accordion or not.** NN/g's [accordions on desktop](https://www.nngroup.com/articles/accordions-on-desktop/): "FAQ pages and product-detail sections are good candidates for accordions", because each reader wants one answer. The GOV.UK [accordion](https://design-system.service.gov.uk/components/accordion/): "Do not use an accordion for content that all users need to see." A short FAQ shows everything; a long one may collapse, with answers still found by find in page and by a link to their anchor. Accordion behaviour is [disclosure: accordions](../patterns/disclosure.md#accordions).
- [weak] **Searchable by question.** Each question is its own indexed section with an anchor, so a hit lands on the answer ([Search in docs](#search-in-docs)). NN/g: "search is rarely enough", so the list must still scan.

**Cases**
- "What is a design token?" in the FAQ, answered again on the tokens page → delete the entry; the tokens page owns it.
- Twelve questions about one component → move them into that component's page under the section each answers.
- Forty questions in one collapsed list → group under topic headings, or split into topic pages.
- A reader's find in page misses a collapsed answer → reveal-on-find markup (Build).

**Accessibility**
- [required] 1.3.1 Info and Relationships and 2.4.6 Headings and Labels: each question is a heading, its answer the content under it. 2.4.10 Section Headings (AAA) is the same reason.
- [required] Implementation: code-standard rule 1 (headings without gaps, disclosure as `details`), code-standard rule 20 (a collapsed FAQ shows everything without script).

**Build**
- [required] Each question an `h2` or `h3` with an `id`; the answer follows it and ends with a link to the owning page ([HTML semantics: headings and the outline](../../code/html-semantics.md#headings-and-the-outline); code-standard rule 1).
- [strong] A collapsing FAQ uses `details` or a disclosure button ([HTML semantics: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers)); a scripted panel hides with `hidden="until-found"`, so find in page and fragment links reveal it ([MDN `hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden); [accessibility: hidden content](../../code/accessibility.md#hidden-content)).
- [weak] The search index stores each question's anchor, built with the page.

**Check**
- *Script:* could flag an FAQ answer with no link to another page, an answer whose text repeats another page's, and a collapsed panel hidden in a way find in page cannot reach.
- *Judgement:* did a real reader ask each question, and does the page it is about now answer it?

**Sources:** as linked above. GOV.UK forbids FAQs; NN/g defends them for real, frequent questions. The toolkit takes GOV.UK's default, because a docs site has an owning page for nearly every question, and NN/g's shape for the few that survive. NN/g recommends accordions for FAQs and GOV.UK warns against hiding content; the toolkit collapses only a long FAQ, and only with reveal on find.

---

## Footnotes and side notes

**Use when**
- [weak] A sentence needs a citation, a caveat or an aside that most readers can skip.
- [weak] First ask whether it belongs in the sentence or nowhere. GOV.UK's [footnotes guidance](https://guidance.publishing.service.gov.uk/formatting-content/text-formatting/footnotes): "Avoid using footnotes in your content as much as possible. Footnotes are designed for reference in print, not webpages." Its [content clinic](https://insidegovuk.blog.gov.uk/2014/04/03/content-clinic-2-questions-editors-2/): "If the information in the footnotes is important, include it in the body text." and "If it's not, leave it out."

**How**
- [weak] Three forms, cheapest first:
  - **In the text**: a clause, a parenthesis or a descriptive link. The default for anything that changes what the reader does.
  - **Notes**: a numbered marker linking to a note at the end of the section, each note linking back. For citations and asides a minority want.
  - **Side notes**: the same note shown in the margin beside its reference on wide screens, after its paragraph on narrow ones. For long explanation pages with margin to spare (the toolkit's judgement; no source specifies it).
- [weak] On a docs page, sources go in the section's Sources line, as these knowledge pages do, not in numbered notes; a note is for an aside.
- [required] The W3C [DPUB-ARIA](https://www.w3.org/TR/dpub-aria-1.1/) roles describe the parts: `doc-noteref` is "A reference to a footnote or endnote, typically appearing as a superscripted number or symbol in the main body of text"; `doc-backlink` is "A link that allows the user to return to a related location in the content".
- [weak] Notes sit at the end of their section, numbered in order of first reference, so a note stays near its reference on a long page.
- [moderate] Shown in place where it helps: NN/g's [study of nonfiction e-books](https://www.nngroup.com/articles/nonfiction-ebooks/) preferred notes "in popovers on top of the corresponding words" to sending readers away. A marker may open the note in a popover by click; the notes list stays as the no-script path.

**Cases**
- A component page with three numbered notes citing the source of a rule → move them to the Sources line; numbers interrupt a scanning reader.
- A note reading "except in dark mode" → into the sentence; it changes what the reader does.
- Markers "*" and "†" → numbers; a link named "*" says nothing.
- One notes list at the foot of a twenty-section page → a list per section.

**Accessibility**
- [required] 2.4.4 Link Purpose (In Context): a marker announced as "link, 3" needs a name such as "Note 3"; the back link names its target ("Back to reference 3").
- [required] 2.5.8 Target Size (Minimum) exempts a target that "is in a sentence or its size is otherwise constrained by the line-height of non-target text" ([W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)); the exemption is a floor, so keep the marker no smaller than the superscript it must be.
- [required] 1.3.1: the notes are an ordered list under a heading, linked both ways to their references.

**Build**
- [required] Marker: `<sup><a href="#note-3" id="ref-3" role="doc-noteref"><span class="visually-hidden">Note </span>3</a></sup>`; the hidden word gives the name (code-standard rule 6 keeps `visually-hidden`; [accessibility: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions)).
- [required] Notes: a `section role="doc-endnotes"` with a heading and an `ol`; each `li id="note-3"` ends with `<a href="#ref-3" role="doc-backlink" aria-label="Back to reference 3">`. DPUB-ARIA: no `doc-footnote` inside endnotes. Links are [HTML semantics: links and buttons](../../code/html-semantics.md#links-and-buttons).
- [weak] Numbers and ids come from the docs build's footnote syntax, never typed by hand.
- [required] Note and reference targets take `scroll-margin-top` from the sticky header's property, as in [navigation: in-page navigation](../patterns/navigation.md#in-page-navigation-on-this-page) (code-standard rule 46).
- [required] Side notes keep DOM order (note after its paragraph) and move to the margin with grid only (code-standard rule 2).

**Check**
- *Script:* could check every `doc-noteref` resolves to a note, every note has a back link to an existing reference, numbers ascend in document order, and no marker is named by a symbol alone.
- *Judgement:* would the page lose anything if this note went into the sentence or was cut?

**Sources:** as linked above. GOV.UK advises against footnotes on the web; DPUB-ARIA gives them roles because publications keep them. The toolkit puts what matters in the text, uses notes only for skippable asides, and puts sources in a Sources line, because a docs reader scans rather than reads through.

---

## Examples: do and don't, live examples, code

**Use when**
- [weak] A page shows a component or pattern in use, gives best practices, or offers code to copy.

**How**
- [moderate] **Do and don't come in pairs.** Every "don't" names the "do" it should be replaced with; where the point is visual, the two are shown side by side, same size, same content where possible, with a caption saying why. A list of prohibitions leaves the reader without the thing to reach for ([Write the Docs](https://www.writethedocs.org/guide/writing/docs-principles/) *Exemplary*; [TDesign](https://tdesign.tencent.com/react/components/button) lists similar components).
- [required] Label do and don't with a word ("Do", "Don't") and an icon, never colour alone.
- [weak] **Live examples** once code exists, served from the project's own Storybook on the docs site's origin and matched to the component by file location; before code exists, images exported from the design, labelled as design. Never both on one page without saying which is which. This labelling is the toolkit's judgement.
- [weak] Each example has an "Open in a new tab" link naming the example, as GOV.UK does ("Open this example in a new tab: text input"), so it can be tested alone at any width.
- [weak] **Code snippets** under the example they produce, in the tabs the system supports (GOV.UK: HTML and Nunjucks), with a copy button that says it copied. Short and complete: a snippet that cannot be pasted and run is a fragment.
- [weak] Examples use realistic content (real labels, long names, translated strings), not "Lorem" or "Button".
- [strong] **The canvas** is a framed box with a toolbar under it (Copy, Reset, open alone or in a sandbox); long code is collapsed behind "Show code" (Primer, Atlassian, Base UI, Codex). GOV.UK's example frame is resizable by the reader from desktop width up ([`_example.scss`](https://github.com/alphagov/govuk-design-system/blob/main/src/stylesheets/components/_example.scss)), which tests responsive behaviour without leaving the page.
- [strong] **The canvas has its own theme and direction**, apart from the site's: Fluent's canvas has a "Theme" menu, Carbon's a theme selector, Codex's demo a left-to-right / right-to-left switch ([Codex button demos](https://doc.wikimedia.org/codex/latest/components/demos/button.html)). A project with several themes or a right-to-left language shows them where the component is.
- [moderate] **Controls generated from the component's properties.** Codex lists every prop and slot as a control; React Spectrum puts controls beside the preview. Fixed examples then cover only the combinations worth explaining.
- [weak] **A story, not the Storybook.** Render the named story bare (`iframe.html?id=…`, arguments in the URL) and keep controls and code on the page, as zeroheight's native embed and Carbon's links do; never frame Storybook's own sidebar ([zeroheight Storybook](https://help.zeroheight.com/hc/en-us/articles/35886994075547); [Carbon button code](https://carbondesignsystem.com/components/button/code/)).
- [moderate] **One source per example**: the file that renders the demo is the code shown, and another framework's tab is generated from it ([Codex component demos](https://github.com/wikimedia/design-codex/blob/main/packages/codex-docs/docs/contributing/component-demos.md)). zeroheight's live code "must be maintained manually in both your codebase and zeroheight" ([zeroheight](https://help.zeroheight.com/hc/en-us/articles/35886937803547)), which is how examples drift.
- [weak] Small screens: examples render at the narrow width too; a side-by-side do/don't pair stacks, do first.

**Cases**
- A best-practices list has six "don'ts" and no images → turn each into a pair with the alternative, or cut it.
- Do and don't are a green and a red border → add the words "Do" and "Don't" and an icon (1.4.1).
- A live example and a Figma image of the same component sit side by side unlabelled → label each with its source; their differences belong to parity, not the docs page.
- The copy button gives no sign it worked → announce "Copied" in a status message (4.1.3) and show it visually for a moment.

**Accessibility**
- [required] 1.4.1 Use of Colour (do/don't), 4.1.3 Status Messages (copy confirmation), 1.1.1 (an image example has alt text describing what it shows and why it is right or wrong), 2.1.1 Keyboard (the live example and its tabs are operable by keyboard).
- [required] Implementation: code-standard rule 18 (names for icon-only copy buttons), code-standard rule 15 (a caption is a description, not part of the name).

**Build**
- [strong] Samples are `pre` and `code`; the copy button is a `button` that reports "Copied" in a status element; a live example is an `iframe` with a `title` and an open-alone link. All of it is [HTML semantics: code samples and live examples](../../code/html-semantics.md#code-samples-and-live-examples).
- [required] Do and don't are `figure`s whose `figcaption` starts with the word, the icon `aria-hidden` (code-standard rule 18); the caption is a description, not part of a name (code-standard rule 15).
- [required] Code tabs (HTML, Nunjucks) are the APG tabs pattern over panels that read as headed sections without script ([accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex); code-standard rule 20).
- [strong] Example code is escaped once, at output ([security: escaping by context](../../code/security.md#escaping-by-context-xss)).

**Check**
- *Script:* could check each "don't" block has a sibling "do", each example has a labelled source, and each copy button has an accessible name.
- *Judgement:* is the "do" the right alternative, and is the example representative of real use?

**Sources:** [GOV.UK text input](https://design-system.service.gov.uk/components/text-input/) (HTML/Nunjucks tabs, open-in-new-tab link); [Primer button](https://primer.style/product/components/button/) and [Atlassian button examples](https://atlassian.design/components/button/examples) for live, editable examples. Shipping systems mostly write do and don't as text (eBay's sentences with one image each, Codex's "Use… / Avoid…", Primer's Button none at all); the toolkit's guidance keeps the pair in the words, every "don't" naming its "do", and draws it only where the point is visual.

---

## On-this-page navigation

**Use when**
- [weak] A page is longer than about two screens or has more than three `h2` sections. (This threshold is the toolkit's judgement; NN/g gives none.)

**How**
- [weak] The list itself (rail or body, label, entries generated from headings, scroll margin) is [navigation: in-page navigation](../patterns/navigation.md#in-page-navigation-on-this-page). A docs site adds:
- [weak] `h2` only, or `h2` and `h3` for long reference pages; deeper levels make it a second page.
- [weak] Each section has an anchor, so a heading can be linked (Write the Docs *Addressable*).
- [weak] Small screens: the rail collapses to a disclosure at the top of the content, closed by default.

**Cases**
- A tabbed page has one list covering every tab → the list covers the visible tab only.
- A page with three short sections has a sticky rail → remove it; it takes width and gives nothing.

**Accessibility**
- [required] 2.4.5 Multiple Ways, 2.4.1 Bypass Blocks (the list jumps within the page), 2.4.11 Focus Not Obscured (a sticky header must not cover the target heading after a jump; leave scroll margin).
- [required] Implementation: code-standard rule 64 (`aria-current` on the current entry), code-standard rule 1 (a labelled `nav` landmark).

**Build**
- [weak] The list's markup and its current-entry marking are [navigation: in-page navigation](../patterns/navigation.md#in-page-navigation-on-this-page); the docs site generates it from the `h2` ids at build time, so entries cannot drift from the headings.
- [required] `scroll-margin-top` on headings equal to the sticky header's height, read from the same custom property (code-standard rule 46).
- [moderate] The small-screen collapse is a `details` at the top of `main`, closed by default ([HTML semantics: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).

**Check**
- *Script:* could check entries match `h2` text exactly and in order, and every heading has an id.
- *Judgement:* does the list help on this page, or decorate it?

**Sources:** [NN/g table of contents](https://www.nngroup.com/articles/table-of-contents/), as in navigation; the threshold and the tab rule are the toolkit's.

---

## Provenance and freshness on generated pages

**Use when**
- [weak] A page is built from data: a token payload, a design snapshot, an audit record, a coverage report.
- [required] design-standard rule 1 applies.

**How**
- [required] The caption's form, its dates, missing and out-of-order sources, and hand-written summaries of generated data are [data: provenance and freshness](../patterns/data.md#provenance-and-freshness) (design-standard rule 1). The cases below are where docs sites go wrong.

**Cases**
- A token page has no date → add the caption from the payload's own timestamp ([data: provenance and freshness](../patterns/data.md#provenance-and-freshness)).
- The audit date is older than the snapshot date → the caption says the audit judged an earlier library; the reader then knows the findings may be stale.
- A page has three sources and one failed to load → the caption lists the two with dates and names the third as unavailable; the page drops the sections that depended on it.

**Accessibility**
- [required] 1.3.1: the caption is text associated with the heading. 2.4.6: the title remains the page's heading; the caption is not a heading.
- [weak] No code-standard rule implements it specifically; the caption is ordinary content.

**Build**
- [moderate] The caption is a `p` directly after the `h1`, never a heading; each date is `<time datetime="2026-10-11">` with the formatted date as its text ([i18n: numbers, dates, plurals and lists](../../code/i18n.md#numbers-dates-plurals-and-lists)).
- [required] The generator writes the caption from the payload's own timestamps (code-standard rule 23); a missing source is a line naming it, not a skipped one (code-standard rule 61).
- [required] A stale page carries `data-stale` on the caption, styled from the attribute, so the warning is markup a check can read rather than a colour alone (code-standard rule 6).

**Check**
- *Script:* could check every generated page has a caption with at least one dated source, and flag a caption whose audit date precedes its snapshot date. `tools/ui-check/check.mjs` does not check design-standard rule 1; it is read at the closing pass.
- *Judgement:* could a reader tell from the caption alone whether this page is current?

**Sources:** design-standard rule 1; data's sources; [Write the Docs](https://www.writethedocs.org/guide/writing/docs-principles/) *Current*.

---

## Change logs, status and versioning

**Use when**
- [weak] A component, token set or pattern changes, is deprecated, or the system ships a new major version.

**How**
- [moderate] **On the page**: a "Recent changes" section on each component page, newest first, each entry dated, linking to the full history. GOV.UK uses a table of Date, Changed, Description and a "View full change history" link; Atlassian gives the change log its own tab.
- [weak] **The full log** follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/): for humans, an entry for every version, latest first, release date shown, changes grouped as Added, Changed, Deprecated, Removed, Fixed, Security.
- [required] Each entry says what changed and what it does to the reader's work (design-standard rule 10), not only the commit subject.
- [moderate] **Status**: a small vocabulary, shown in the overview. Atlassian's release phases are Early Access, Beta, General Availability, then Intent to Deprecate and Deprecated, with a replacement and migration path for the last ([Atlassian](https://atlassian.design/release-phases)). Primer now uses three ([component status](https://primer.style/product/getting-started/component-status/)). Three or four values, derived from data, never typed.
- [weak] **Deprecated** pages stay published, marked at the top, naming the replacement and the removal date or version.
- [weak] **A release pins everything it shows.** zeroheight's releases keep Storybook and embeds only as URLs, so an old release shows today's components ([zeroheight](https://help.zeroheight.com/hc/en-us/articles/35887037455515)). Pin the design snapshot and the built Storybook per release.
- [weak] **A per-release diff**: zeroheight marks blocks New, Updated or Deleted against the previous release ([zeroheight compare](https://help.zeroheight.com/hc/en-us/articles/54580733804955)). A generator gets this free from two snapshots.
- [weak] **Date the source, not the edit**: Supernova's "Page last updated" dates the edit, not the Figma state shown ([Provenance](#provenance-and-freshness-on-generated-pages)).
- [weak] **Versioning**: when old majors stay in use, keep their docs reachable from a version switcher, with the current stable version marked as the one to use. MUI lists each major with its own docs and marks the stable one "recommended for use in production" ([MUI versions](https://mui.com/versions/)). One version is the default; old versions carry a banner pointing to current.

**Cases**
- A component's history lives only in the repository → add Recent changes to the page; the reader deciding whether to trust the page is on the page.
- An entry reads "refactor button tokens" → rewrite: "Changed: the focus ring now uses the border-focus token; overrides of the old token stop applying."
- A deprecated component's page was deleted → restore it with a deprecation notice and the replacement; links from old code and old designs still arrive there.
- A site shows v3 docs by default while v4 is stable → default to v4, banner on v3.

**Accessibility**
- [required] 1.3.1: the change table has header cells. 1.4.1: status is a word, never a coloured dot alone. 2.4.4 Link Purpose: "View full change history", not "More".
- [required] Implementation: code-standard rule 15 (a status badge beside a title is a description).

**Build**
- [strong] Recent changes is a `table` with Date, Changed and Description header cells, dates as `<time datetime>` ([HTML semantics: tables for data](../../code/html-semantics.md#tables-for-data)).
- [required] The status is a word in a badge next to the title, tied to it as a description rather than inside the `h1` (code-standard rule 15), and derived from data by the generator.
- [required] A deprecated page's notice is the first thing in `main`, linking the replacement; the version switcher is a `nav` of links with `aria-current` on the version shown (code-standard rule 64).

**Check**
- *Script:* could check Recent changes exists, entries are dated and newest first, and a deprecated page names a replacement link.
- *Judgement:* does each entry tell the reader what to do about the change?

**Sources:** [GOV.UK text input](https://design-system.service.gov.uk/components/text-input/) (Recent changes table, reopened here), [Atlassian release phases](https://atlassian.design/release-phases), [MUI versions](https://mui.com/versions/), [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## Search in docs

**Use when**
- [weak] The site has more pages than fit in one side list, or readers arrive knowing a name (a token, a prop) rather than a section.

**How**
- [weak] One search, in the global header, in the same place on every page.
- [weak] Index by section, not only by page: a hit should land on the heading that answers, with the anchor. Paste splits its MDX files into sections by heading for its index ([Paste docs search](https://github.com/twilio-labs/paste/blob/main/internal-docs/engineering/doc-site/docsearch.md)).
- [weak] Tokens and props are found by exact name: a search for `colour-text-neutral-strong` returns that token first. [Atlassian's token page](https://atlassian.design/components/tokens/all-tokens) has exact search.
- [weak] Results show the page, the section and its type (component, token, pattern), so two hits called "Button" can be told apart.
- [weak] No results: as [search: results page and no results](../patterns/search.md#results-page-and-no-results), offering the section lists.
- [weak] Search behaviour in depth is `../patterns/search.md`.

**Cases**
- Searching "focus ring" returns the Button page top → land on Button's focus section anchor, and list the focus-indicator token page too.
- A token named in the generated tables cannot be found → index the generated tables at build time.
- Search opens a modal with no visible label → give the field a label and the dialog a name; return focus to the trigger on close (`../patterns/dialogs.md`).

**Accessibility**
- [required] 2.4.5 Multiple Ways, 4.1.3 Status Messages (result counts announced), 3.3.2 Labels or Instructions (a visible label or a labelled search landmark), 2.1.1 Keyboard (results reachable and selectable by keyboard).
- [required] Implementation: code-standard rule 14 (results swap keeps the reader's place), code-standard rule 20 (search works as a GET form without script).

**Build**
- [required] A `search` element holding a GET `form` with a labelled `input type="search"`, so it works without script and the query lands in the address (code-standard rule 20; [search: the query in the address](../patterns/search.md#the-query-in-the-address)).
- [required] Results swap in place and announce a count in a persistent status element (code-standard rule 14; [accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).
- [strong] A suggestion list is the APG combobox; a search in a modal is a `dialog` that returns focus on close ([search: keyboard](../patterns/search.md#keyboard)).
- [weak] Each hit links the heading's anchor (`/button/#focus`), so the index stores sections, generated at build time with the pages.

**Check**
- *Script:* could check the search is a labelled form with a no-script action and a `search` landmark, and that a known token name returns its own page first.
- *Judgement:* does a hit land the reader on the answer or on a page they must search again?

**Sources:** [Paste docs search](https://github.com/twilio-labs/paste/blob/main/internal-docs/engineering/doc-site/docsearch.md). Paste ranks by vector similarity; the toolkit asks for exact-name matches first on token and prop names, because a reader who types a token's name wants that token.

---

## Docs for agents

**Use when**
- [weak] Readers include coding agents and chat assistants as well as people, as several systems now assume.

**How**
- [strong] **An `llms.txt` at the site root**: an `h1` with the site's name (the only required part), an optional one-line summary, and sections of links, ideally to Markdown copies of the pages ([llms.txt proposal](https://llmstxt.org/)). React Spectrum, Atlassian and Carbon publish one ([React Spectrum](https://react-spectrum.adobe.com/llms.txt), [Atlassian](https://atlassian.design/llms.txt), [Carbon](https://carbondesignsystem.com/llms.txt), fetched 2026-11-11).
- [strong] **A Markdown copy of every page**, generated with it: React Spectrum serves `/Button.md`; Spectrum Hub has "Copy markdown", React Spectrum "Copy for LLM", Base UI "View as Markdown", and shopify.dev links a Markdown version of each Polaris page (observed 2026-11-11 on the pages linked in [Page frame](#page-frame-and-visual)).
- [weak] **Same generator, same data.** The Markdown copy is a second rendering of the page's source, never a hand-kept twin; the caption's sources and dates go with it.
- [weak] An MCP server is the next step, and both hosted platforms ship one (zeroheight read and write, Supernova a "Connect" block for readers); a site generated from a committed snapshot can serve the snapshot itself instead.

**Cases**
- An agent quoting the docs invents a prop → the page had the props table only as rendered HTML behind a tab; the Markdown copy carries it as a table.
- The Markdown copy says a component is stable while the page says beta → it was written by hand; generate it.

**Accessibility**
- [weak] Not applicable: these are files, not pages. The "Copy markdown" button follows the copy-button rules in [Examples](#examples-do-and-dont-live-examples-code).

**Build**
- [required] The build writes `llms.txt` and one `.md` beside each page's HTML from the same data (toolkit-standard §D 23; code-standard rule 23).
- [weak] Each page links its Markdown copy with `<link rel="alternate" type="text/markdown" href="…">` and a visible link.

**Check**
- *Script:* could check every page has its `.md`, `llms.txt` lists every page, and the two carry the same snapshot date.
- *Judgement:* could an agent answer "which props does this take, and is it ready?" from the Markdown alone?

**Sources:** as linked above; Supernova's [2026 releases](https://learn.supernova.io/latest/releases/latest-releases-EhxYhfBn) and zeroheight's [MCP](https://help.zeroheight.com/hc/en-us/articles/54955157637659).

---

## Hosted platforms

**Use when**
- [weak] Choosing between a hosted docs platform and a generated site, or judging one a project already uses.

**How**
- [weak] **zeroheight**: pages of blocks (do/don't rules, status tables, release notes, token tables up to three mode columns, live code in React, Vue, Angular, Svelte and HTML); whole-site releases with a reader switcher and a draft compare view. Figma sync is manual; a deleted file leaves orphaned content; it cannot render property states, "you must create different instances in Figma and import them" ([zeroheight sync](https://help.zeroheight.com/hc/en-us/articles/35886994402203), [states](https://help.zeroheight.com/hc/en-us/articles/35886908929051)). Public pages render in the browser. Theming is colours and a logo.
- [weak] **Supernova**: hourly Figma import on Pro and above, variables through a separate plugin; blocks for health, checklists and Figma properties; a hosted Storybook playground; semver versions; static HTML output with landmarks and ⌘K search; CSS overrides ([import](https://learn.supernova.io/latest/design-systems/import-design-system-data/connect-figma/importing-from-figma/import-and-update-content-V9VjOLrL), [look and feel](https://learn.supernova.io/latest/documentation/customize-your-documentation/look-and-feel-XkLT5wzn)). "Hidden" pages are not private.
- [weak] **Archbee**: developer docs: code tabs, OpenAPI, Mermaid, custom CSS on a custom domain; no versions (a cloned space per version), nothing for tokens, stories or status ([custom CSS](https://docs.archbee.com/custom-css)).
- [weak] **Notion and Coda**: wikis. Notion Sites has a light, dark or system theme and no font, colour or CSS control ([Notion Sites](https://www.notion.com/help/edit-and-customize-your-notion-sites)); Coda's Figma pack and sync tables keep an inventory current, refreshing at most hourly ([Coda Figma](https://help.coda.io/hc/en-us/articles/39555938466957)). Neither has tokens, live examples, versions or status beyond hand-built tables.
- [strong] **What the published sites look like** (measured 2026-11-11 on each Button page, as Page frame): the platform sets the frame and the customer sets logo, colours and font. zeroheight ([Uber Base](https://base.uber.com/6d2425e9f/p/756216-button), [Teamleader Ahoy](https://ahoy.teamleader.design/3547946e7/p/27a895-button)) is pixel-identical across customers: 72px header, 240px side list, prose capped at 560px, no on-this-page rail, the page scrolling in an inner container that overflows sideways at 390px. Supernova ([Mews](https://www.mews.design/latest/components/button/overview-NEe9ihrh), [Iterable Aurora](https://aurora.iterable.com/latest/components/button/code-DN8kqVdy)) has a 65–69px sticky header, 300px side list, 200px sticky rail and prose with no cap (756–816px). All four: body 16/24, tabs as separate URLs mirrored in the side list, examples as images, Figma only linked, live code at most one Storybook frame or a link out, status as its own block, no dark mode from the system (only Uber has a manual one). Mews prints "undefined" in its status checklist and Ahoy's code tab says "Coming soon": the template shows what nobody filled. No organisation's public design-system docs on Notion were found.
- [weak] **Where each wins**: hosted platforms win on authoring by non-developers and on prose; a generated site wins on freshness, on what can be derived (every state, every token, a release diff) and on failing loudly. A project with a committed snapshot gets the second for free; the first is the reason to keep a hosted platform for guidance prose and link to the generated reference.

**Cases**
- A team keeps component pages in zeroheight and finds them out of date with Figma → the reference (props, states, tokens) is generated; zeroheight keeps the guidance and links to it.
- A Notion page lists components with a status column typed by hand → the status comes from the snapshot; the wiki links to it.

**Accessibility**
- [weak] A hosted page is only as accessible as the platform's output: check its landmarks, headings and whether the text is in the HTML ([Page frame](#page-frame-and-visual)).

**Build**
- [weak] Not applicable: this section chooses a platform; the generated site's build is in the sections above.

**Check**
- *Judgement:* which pages are derivable from the snapshot, and are any of them hand-kept elsewhere?

**Sources:** as linked above, from each vendor's own help pages, read 2026-11-11. zeroheight's help centre refuses scripted reads; it was read through its public Zendesk API at the same article ids.
