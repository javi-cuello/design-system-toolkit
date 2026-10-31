# Profile: design-system documentation

What a page on a design-system documentation site must specify: the site's structure and navigation, the component page and its section order, foundations and patterns pages, content types, FAQ pages, footnotes and side notes, examples and code, in-page navigation, provenance, change and versioning, and search. It binds the fundamentals (`../design/ux.md`, `../design/interaction.md`, `../design/visual.md`, `../design/content.md`, `../design/accessibility.md`) and the patterns (`../patterns/navigation.md`, `../patterns/search.md`, `../patterns/tables.md`, `../patterns/disclosure.md`, `../patterns/feedback.md`, `../patterns/data.md`) to one kind of product. It serves the [design-standard](../../../standards/design-standard.md) principles *serve a real need*, *consistent, not uniform*, *honest* and *clear words, clear hierarchy*, and applies design-standard rule 1 (provenance and freshness), design-standard rules 3–6, 11 and 12 (wherever a docs page filters a list), design-standard rule 7 (headings sit with their content) and design-standard rule 8 (attributes as columns). The design-standard *Application profiles* entry names this file; it admits nothing as a rule.

---

## Site structure and navigation

**Use when**
- Building or auditing the frame of a docs site: header, section list, page list, the first screen a reader lands on.
- A site adds a section (foundations, patterns, a platform) and the reader must still know where they are.

**How**
- Specify three levels separately: **global** (between sections: Foundations, Components, Patterns, Get started), **local** (pages within the current section, in a side list) and **in-page** (the "On this page" list, below). Tabs are not a fourth navigation system; they switch views of one page ([NN/g, Tabs, Used Right](https://www.nngroup.com/articles/tabs-used-right/)).
- One site for design and code guidance. Atlassian and Primer both merged two sites into one; Spectrum's split let its design side go stale, and Polaris's move into a developer portal shrank its guidance to a footnote ([Atlassian, 2020](https://community.developer.atlassian.com/t/our-new-home-for-atlassian-design-system/40698); [Primer React PR #4822](https://github.com/primer/react/pull/4822)). Link to the code reference (Storybook, source) at the exact story or symbol rather than rebuilding it.
- Local navigation lists every page in the section, in a stable order (alphabetical for components, by task for patterns), with the current page marked. GOV.UK labels it "Pages in this section".
- Global sections stay in the same order and place on every page. A section that exists only on some pages reads as a different site.
- Small screens: global and local navigation collapse behind one menu button; the current section and page stay visible as a heading, so the reader still knows where they are.
- Navigation behaviour in depth is `../patterns/navigation.md` (breadcrumbs, tabs, in-page lists), `../patterns/menus.md` (the top bar and the mobile menu) and `../patterns/sidebars.md` (the side navigation).

**Cases**
- A component page has Usage, Code and Accessibility tabs that link to three separate URLs with different layouts → those are navigation links styled as tabs; make them one page with sections, or real in-page tabs with a shared layout. NN/g says not to mix tab types in one control.
- The site has a "Design" header link and a "Develop" header link that lead to two pages per component → merge to one page per component, guidance first, code after.
- A detail page (one token) sits under a listing page (all tokens) with no link of its own in the side list → the listing's entry stays marked as current, so the reader knows where they are.

**Accessibility**
- 2.4.5 Multiple Ways: navigation and search are two ways to reach a page. 3.2.3 Consistent Navigation: global and local lists keep their order on every page. 2.4.1 Bypass Blocks: a skip link past the side navigation. 2.4.8 Location (AAA) is the reason for the marked current page.
- Implementation: code-standard rule 64 (`aria-current`), code-standard rule 1 (landmarks, one `h1`), code-standard rule 2 (DOM order is reading order, so the side list comes before or after `main` deliberately).

**Build**
- Three `nav` landmarks, each named (`aria-label="Sections"`, `"Pages in this section"`, `"On this page"`), around one `main` holding one `h1` ([HTML semantics: landmarks](../../code/html-semantics.md#landmarks); code-standard rules 1 and 3).
- Each list is a `ul` of links; the current page's link carries `aria-current="page"`, and a detail page marks its listing's entry (code-standard rule 64).
- A skip link is the first focusable element and targets `main` ([navigation: skip links](../patterns/navigation.md#skip-links)).
- The small-screen menu is a disclosure button with `aria-expanded` over the same list, not a menu role ([accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex)); the side list's place in the DOM is chosen for reading order (code-standard rule 2).

**Check**
- *Script:* could check that every page carries the same global links in the same order, that exactly one local link is current, and that a skip link exists. code-standard rule 64 already names the marking.
- *Judgement:* can a reader dropped on any page say which section they are in and what else it holds, without scrolling?

**Sources:** [NN/g tabs](https://www.nngroup.com/articles/tabs-used-right/); [GOV.UK text input](https://design-system.service.gov.uk/components/text-input/) for "Pages in this section"; [Atlassian, 2020](https://community.developer.atlassian.com/t/our-new-home-for-atlassian-design-system/40698) and [Primer React PR #4822](https://github.com/primer/react/pull/4822) for the merges. Carbon keeps tabs (Usage, Style, Code, Accessibility) while GOV.UK, Codex and Spectrum use one long page; the toolkit prefers one page, because tabs hide content readers rarely switch to (NN/g).

---

## The component page

**Use when**
- Writing, generating or auditing the page for one component.
- A reader must decide whether to use a component before deciding how to build it.

**How**
- One fixed skeleton, in this order: **overview** (one-line purpose, status, links to design and code), **example** (live, with the main variants), **when to use**, **when not to use** (each item naming the alternative), **anatomy**, **variants and states** (what sets each: a property or an interaction), **behaviour** (keyboard, overflow, responsive, motion), **content guidance**, **accessibility** (role, keyboard pattern, known gaps), **code** (properties table, links to the exact story or symbol), **change log** (recent changes on the page).
- The order answers "should I use this?" before "how is it built?". The shipping systems agree on the core and disagree on labels:

| System | Order as shipped |
|---|---|
| GOV.UK | Example, When to use, When not to use, How it works, Research, Recent changes, Help improve |
| Spectrum | Anatomy, Component options, States, Behaviors, Usage guidelines, Content standards, Internationalization, Accessibility |
| Primer | Tabs: Overview, Guidelines, Accessibility; code on the overview |
| Atlassian | Tabs: Examples, Code, Usage, Changelog; Usage runs Parts, Accessibility, Best practices, Content guidelines, Related |
| eBay Playbook | Anatomy, Properties, Behavior, Platforms, Best practices, Specs; varies by component |

- A section with nothing to say is marked "Not applicable" in the source, so a script can tell a deliberate gap from a forgotten one. Spectrum drops Content standards where a component carries no text; the toolkit keeps the heading with "Not applicable" instead, because a silent gap cannot be checked. An empty guidance section says "No guidance yet" rather than vanishing, since GOV.UK's [documentation research](https://designnotes.blog.gov.uk/2018/11/05/how-we-document-components-and-patterns-in-the-gov-uk-design-system/) asks for honest docs.
- Internationalisation (text expansion, right-to-left) gets a sentence under behaviour or content when the component carries text, as Spectrum does.
- Hold every generated table to one test: does it help someone choose, build or check this component? A variant-by-state grid of 216 cells, or every token across every variant, goes behind a disclosure (`../patterns/disclosure.md`) or into an export. Primer's own [PR #710](https://github.com/primer/design/pull/710) called its mixed props tables a "matrix of sadness".
- Headline figures are health (3 open accessibility failures), never inventory (715 variants).
- If tabs are used, "when not to use" stays on the default tab: readers tend to stay on the default ([NN/g](https://www.nngroup.com/articles/tabs-used-right/)).

**Cases**
- A Button page opens with "Button has 216 variants" → replace with the one-line purpose and status; move the count into the properties section, if anywhere.
- "When not to use" says "Don't use for navigation" → add the alternative: "Use a link instead", linked to the Link page. A prohibition without an alternative tells the reader what to avoid and not what to reach for.
- A component has no text (a divider) → content guidance reads "Not applicable: this component carries no text." The section stays, so the skeleton check passes and the reader learns it was considered.
- Usage guidance sits on a second tab behind Examples → move it to the default tab, or collapse to one page.
- The accessibility section repeats generic WCAG paragraphs on every page → keep the component's role, keyboard pattern, a link to the matching APG pattern, and its known gaps; cut the boilerplate.
- A component exists in Figma only → the example is an image of the design, labelled as design; once code exists, the live example replaces it.

**Accessibility**
- 1.3.1 Info and Relationships and 2.4.6 Headings and Labels: the skeleton is a heading outline, levels never skipped, labels that say what follows. 2.4.10 Section Headings (AAA) is why each section has one.
- Live examples obey the criteria of the component they show; an inaccessible example teaches the inaccessible build.
- Implementation: code-standard rule 1 (one `h1`, no skipped levels), code-standard rule 7 (prose scale for page content).

**Build**
- The skeleton is the heading outline: one `h1`, an `h2` per section with an `id`, levels never skipped ([HTML semantics: headings and the outline](../../code/html-semantics.md#headings-and-the-outline); code-standard rule 1).
- Page prose takes the prose scale, generated tables and examples their components' own styles (code-standard rule 7).
- "Not applicable" is a marker the template writes from data (a `data-section-state="not-applicable"` hook beside the text), so a script reads it rather than parsing prose (code-standard rule 6).
- A large generated table sits in `details` closed by default ([HTML semantics: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers)); the properties table is a real `table` ([HTML semantics: tables for data](../../code/html-semantics.md#tables-for-data)).
- The page is generated from the snapshot, never typed (toolkit-standard §D 23; code-standard rule 23).

**Check**
- *Script:* could check each declared section is present or marked "Not applicable", "When not to use" exists, the change log is present with dated entries, and headings do not skip.
- *Judgement:* does "when not to use" name the right alternative? Does every generated table help someone choose, build or check?

**Sources:** [GOV.UK text input](https://design-system.service.gov.uk/components/text-input/) (When to use, When not to use, How it works, Research, Recent changes as a Date/Changed/Description table); [Spectrum button](https://spectrum.adobe.com/web/rsp/components/button), [Primer button](https://primer.style/product/components/button/), [Atlassian button usage](https://atlassian.design/components/button/usage), [eBay checkbox](https://playbook.ebay.com/design-system/components/checkbox), [GOV.UK documentation research (2018)](https://designnotes.blog.gov.uk/2018/11/05/how-we-document-components-and-patterns-in-the-gov-uk-design-system/). GOV.UK puts the example first and anatomy inside "How it works"; Spectrum leads with anatomy. The toolkit puts purpose and example first, then the use decision, then anatomy, because GOV.UK's 2018 research is the only published evidence on docs structure and it puts the decision early.

---

## Foundations pages: tokens, colour, type

**Use when**
- A page documents tokens (colour, spacing, radius, elevation, motion) or styles (type, colour palettes).
- A page is generated from a token payload or snapshot.

**How**
- **Semantic token table** first: `Token and description | Light | Dark` (one column per mode), the value shown as the primitive it aliases and its resolved value, with search and copy. [Atlassian](https://atlassian.design/components/tokens/all-tokens), [Fluent](https://fluent2.microsoft.design/color-tokens) and [Codex](https://doc.wikimedia.org/codex/latest/design-tokens/color.html) converge on this. Each attribute is a column (design-standard rule 8).
- **Primitives** as compact ramps (swatches in step order) on a secondary page. Most readers need the semantic layer; primitives matter to the people maintaining it.
- **Swatch**: a chip with the token name and value in text beside it. The name carries the meaning; the chip only illustrates.
- **Type specimen**: each style rendered at its real size with a real sentence, its name, and size, line height, weight and letter-spacing as text, in the units the reader's platform uses (web styles in rem and unitless line height).
- **Contrast**: only for defined foreground and background pairs. Computing every combination is noise; Paste's "accessible pairing" popover is the one shipping example.
- Generate from the same payload the code uses, and carry the provenance caption (below). GOV.UK removed its colour generator during a colour rework ([PR #5002](https://github.com/alphagov/govuk-design-system/pull/5002)); that is the risk of a generator tied to a format being redesigned, not of generation.
- Deprecated tokens stay listed, marked deprecated, with their replacement, until removed.
- Small screens: the table keeps the token name as its first column and scrolls horizontally inside its own container, never the page.

**Cases**
- A colour page renders 374 variables in one flat list → lead with the semantic layer in a per-mode table; ramps for primitives on a second page; the rest behind search.
- Swatches show only colour with the name on hover → put the name and value in visible text; colour alone cannot be read, copied or searched.
- A type specimen shows "Aa" at each size → render a real line of text at each style, so line length and line height can be judged.

**Accessibility**
- 1.4.1 Use of Colour: a swatch is identified by its text, never by its colour alone. 1.1.1 Non-text Content: decorative chips are hidden from assistive technology when the name sits beside them. 1.3.1: the token table is a real table with header cells. 1.4.10 Reflow: the table scrolls in its own region at 320px.
- Implementation: code-standard rule 18 (decorative images), code-standard rules 52 and 53 (how names and modes are built, which the page reads).

**Build**
- The token table is a `table` with a `caption`, the token name in a `th scope="row"`, one `th scope="col"` per mode ([HTML semantics: tables for data](../../code/html-semantics.md#tables-for-data)).
- A swatch chip is decorative, `aria-hidden="true"`, beside the name and value in text (code-standard rule 18); the name is in `code` so it copies exactly.
- Each mode column renders the chip under that mode's attribute, not a hard-coded colour, so the page reads the same tokens the product does ([tokens: themes and modes](../../code/tokens.md#themes-and-modes); code-standard rules 52 and 53).
- The table scrolls inside a named, focusable container at narrow widths ([responsive: tables on small screens](../../code/responsive.md#tables-on-small-screens)).
- The page is generated from the token build's output, never edited (toolkit-standard §D 23; code-standard rule 23).

**Check**
- *Script:* could check every swatch has a text name, every mode in the payload has a column, and the page caption names its payload and date. `tools/ui-check/check.mjs` does not yet.
- *Judgement:* does the page lead with what most readers use, or with everything the payload holds?

**Sources:** as linked above; Paste's pairing popover is in its [tokens list source](https://github.com/twilio-labs/paste/tree/main/packages/paste-website/src/components/tokens-list). Primer shows only the active theme; the toolkit shows every mode as a column, following the majority.

---

## Patterns pages

**Use when**
- A page documents a recurring solution that spans components: filtering, empty states, forms, saving, navigation.
- The question the reader brings is "how do I solve this task?", not "how does this component work?".

**How**
- Open with the user need the pattern solves, in one sentence, then **when to use** and **when not to use** (naming the alternative pattern), then **how it works** as steps or a worked screen, then the **components it uses** (linked), then **accessibility**, **research** if any, and **change log**.
- A pattern page is mostly how-to (Diátaxis), with reference only for the components it links. GOV.UK's patterns (question pages, check answers, validation) follow the same order as its components.
- Show the pattern in a realistic screen, not a lone component. A filtering pattern shows the tabs, the bar and the list together (design-standard rule 3).
- State the house decisions as decisions: where the sources disagree (search left or right, validate on blur or submit), say which way the system goes and why, as the knowledge pages do (for example [interaction: validation timing](../design/interaction.md#error-prevention-and-validation-timing)).

**Cases**
- A "Filtering" page lists the Select, Chip and Search components with their props → rewrite as how-to: when to filter, where the bar goes, how counts and disabled options behave (design-standard rules 3–6, 11), with the components linked.
- Two pattern pages describe empty states differently → one page owns it; the other links to it.
- A pattern contradicts Carbon (search on the right) → say so on the page with the reason; readers who know Carbon will otherwise report it as a bug.

**Accessibility**
- The criteria are the pattern's own, named on its page: 3.3.1 and 3.3.3 for validation, 4.1.3 Status Messages for live results, 2.4.3 Focus Order for multi-step flows.
- Implementation: cite the code-standard rule that implements each, for example code-standard rule 14 for a live swap in a filtered list.

**Build**
- A pattern page is a page template whose sections are headings in a fixed order, so the outline is the skeleton ([HTML semantics: headings and the outline](../../code/html-semantics.md#headings-and-the-outline); code-standard rule 1).
- Its realistic screen is a live example served from the components themselves, never a screenshot ([HTML semantics: code samples and live examples](../../code/html-semantics.md#code-samples-and-live-examples)).

**Check**
- *Script:* could check that a pattern page links at least one component page and carries "when not to use".
- *Judgement:* does the page solve a task, or catalogue components?

**Sources:** [GOV.UK patterns](https://design-system.service.gov.uk/patterns/question-pages/); [Diátaxis](https://diataxis.fr/compass/). No source specifies a pattern-page skeleton; this one mirrors the component page so readers learn one shape.

---

## Content types (Diátaxis)

**Use when**
- Planning a section, auditing a page that reads as muddled, or deciding where a new piece of writing goes.

**How**
- Four types: **tutorial** (a lesson), **how-to** (a goal or problem), **reference** (facts needed to act correctly), **explanation** (context and background) ([Diátaxis](https://diataxis.fr/compass/)).
- On a design-system site: reference is properties, tokens, states, specs; how-to is usage guidance and patterns; explanation is principles, research and decisions; tutorial is getting started and a first contribution.
- One type per section. A page may hold several types (a component page is reference with how-to inside), but each section is recognisably one. A properties table broken by a paragraph of rationale is harder to scan.
- Tag each section's type in the page template, so a reviewer can ask the question per section.
- Write the Docs' content principles apply: *Skimmable*, *Exemplary*, *Current* ("Consider incorrect documentation to be worse than missing documentation"). Reading level for docs is [content: plain language and reading level](../design/content.md#plain-language-and-reading-level).

**Cases**
- A Getting started page mixes installation steps with the system's history → split: steps stay (tutorial); history moves to an About or Principles page (explanation).
- A usage section is really a list of props → it tells nothing about choice; rewrite as "use X when…", and move the props to the code section.
- A token reference page opens with three paragraphs on why tokens matter → one sentence, linking to an explanation page.

**Accessibility**
- 3.1.5 Reading Level (AAA) and 2.4.6 Headings and Labels: a section whose heading names its type ("How to…", "Properties") sets expectations.
- No code-standard rule applies; this is content.

**Build**
- The type tag is front matter or a data attribute on each section in the page source, read by the check; it renders nothing a reader needs (code-standard rule 6 for attributes as hooks).

**Check**
- *Script:* could check each section carries a declared type tag in the source.
- *Judgement:* is each section one type? Would a reader looking for a fact find it without reading an argument first?

**Sources:** [Diátaxis compass](https://diataxis.fr/compass/); [Write the Docs principles](https://www.writethedocs.org/guide/writing/docs-principles/).

---

## FAQ pages

**Use when**
- Rarely. Before writing an FAQ, check whether each answer belongs on the page the question is about; on a docs site it almost always does.
- An FAQ earns its place for questions readers really ask (from support, issues, search logs) that span several pages and have no single home, such as "Can I use the system without the component library?". NN/g's [FAQs still deliver value](https://www.nngroup.com/articles/faqs-deliver-value/): "many people already know to look for an FAQ when they need a fast answer."
- Not as a home for content that has one. The GOV.UK [style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/): "Do not use FAQs on GOV.UK. If you write content by starting with user needs, you will not need to use FAQs."

**How**
- **Asked questions only, in the readers' words.** NN/g: "the questions should reflect the vocabulary and phrasing of your visitors"; of questions the team invents, "We have long warned against that bad practice."
- **A short answer that links to the page owning the detail.** The FAQ never holds the only copy. GDS's [FAQs: why we don't have them](https://gds.blog.gov.uk/2013/07/25/faqs-why-we-dont-have-them/): "Usually, I see FAQs duplicating content", and the copies compete in search.
- **A question that keeps coming is a gap in the owning page.** Fix that page; the entry shrinks to a link or goes.
- **Front-load.** GDS: "questions take longer to scan and understand than simple headings". Put the topic word early in each question, or use a plain heading where the question form adds nothing.
- **Shape by length.** A short FAQ is a question list, then the answers on one page: NN/g calls it "still the best underlying design for short and medium-length (less than 10-page) FAQs". A long one is "chunked by topic", or becomes "a separate list of questions that lead to answer pages (or topic pages)".
- **Accordion or not.** NN/g's [accordions on desktop](https://www.nngroup.com/articles/accordions-on-desktop/): "FAQ pages and product-detail sections are good candidates for accordions", because each reader wants one answer. The GOV.UK [accordion](https://design-system.service.gov.uk/components/accordion/): "Do not use an accordion for content that all users need to see." A short FAQ shows everything; a long one may collapse, with answers still found by find in page and by a link to their anchor. Accordion behaviour is [disclosure: accordions](../patterns/disclosure.md#accordions).
- **Searchable by question.** Each question is its own indexed section with an anchor, so a hit lands on the answer ([Search in docs](#search-in-docs)). NN/g: "search is rarely enough", so the list must still scan.

**Cases**
- "What is a design token?" in the FAQ, answered again on the tokens page → delete the entry; the tokens page owns it.
- Twelve questions about one component → move them into that component's page under the section each answers.
- Forty questions in one collapsed list → group under topic headings, or split into topic pages.
- A reader's find in page misses a collapsed answer → reveal-on-find markup (Build).

**Accessibility**
- 1.3.1 Info and Relationships and 2.4.6 Headings and Labels: each question is a heading, its answer the content under it. 2.4.10 Section Headings (AAA) is the same reason.
- Implementation: code-standard rule 1 (headings without gaps, disclosure as `details`), code-standard rule 20 (a collapsed FAQ shows everything without script).

**Build**
- Each question an `h2` or `h3` with an `id`; the answer follows it and ends with a link to the owning page ([HTML semantics: headings and the outline](../../code/html-semantics.md#headings-and-the-outline); code-standard rule 1).
- A collapsing FAQ uses `details` or a disclosure button ([HTML semantics: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers)); a scripted panel hides with `hidden="until-found"`, so find in page and fragment links reveal it ([MDN `hidden`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/hidden); [accessibility: hidden content](../../code/accessibility.md#hidden-content)).
- The search index stores each question's anchor, built with the page.

**Check**
- *Script:* could flag an FAQ answer with no link to another page, an answer whose text repeats another page's, and a collapsed panel hidden in a way find in page cannot reach.
- *Judgement:* did a real reader ask each question, and does the page it is about now answer it?

**Sources:** as linked above. GOV.UK forbids FAQs; NN/g defends them for real, frequent questions. The toolkit takes GOV.UK's default, because a docs site has an owning page for nearly every question, and NN/g's shape for the few that survive. NN/g recommends accordions for FAQs and GOV.UK warns against hiding content; the toolkit collapses only a long FAQ, and only with reveal on find.

---

## Footnotes and side notes

**Use when**
- A sentence needs a citation, a caveat or an aside that most readers can skip.
- First ask whether it belongs in the sentence or nowhere. GOV.UK's [footnotes guidance](https://guidance.publishing.service.gov.uk/formatting-content/text-formatting/footnotes): "Avoid using footnotes in your content as much as possible. Footnotes are designed for reference in print, not webpages." Its [content clinic](https://insidegovuk.blog.gov.uk/2014/04/03/content-clinic-2-questions-editors-2/): "If the information in the footnotes is important, include it in the body text." and "If it's not, leave it out."

**How**
- Three forms, cheapest first:
  - **In the text**: a clause, a parenthesis or a descriptive link. The default for anything that changes what the reader does.
  - **Notes**: a numbered marker linking to a note at the end of the section, each note linking back. For citations and asides a minority want.
  - **Side notes**: the same note shown in the margin beside its reference on wide screens, after its paragraph on narrow ones. For long explanation pages with margin to spare (the toolkit's judgement; no source specifies it).
- On a docs page, sources go in the section's Sources line, as these knowledge pages do, not in numbered notes; a note is for an aside.
- The W3C [DPUB-ARIA](https://www.w3.org/TR/dpub-aria-1.1/) roles describe the parts: `doc-noteref` is "A reference to a footnote or endnote, typically appearing as a superscripted number or symbol in the main body of text"; `doc-backlink` is "A link that allows the user to return to a related location in the content".
- Notes sit at the end of their section, numbered in order of first reference, so a note stays near its reference on a long page.
- Shown in place where it helps: NN/g's [study of nonfiction e-books](https://www.nngroup.com/articles/nonfiction-ebooks/) preferred notes "in popovers on top of the corresponding words" to sending readers away. A marker may open the note in a popover by click; the notes list stays as the no-script path.

**Cases**
- A component page with three numbered notes citing the source of a rule → move them to the Sources line; numbers interrupt a scanning reader.
- A note reading "except in dark mode" → into the sentence; it changes what the reader does.
- Markers "*" and "†" → numbers; a link named "*" says nothing.
- One notes list at the foot of a twenty-section page → a list per section.

**Accessibility**
- 2.4.4 Link Purpose (In Context): a marker announced as "link, 3" needs a name such as "Note 3"; the back link names its target ("Back to reference 3").
- 2.5.8 Target Size (Minimum) exempts a target that "is in a sentence or its size is otherwise constrained by the line-height of non-target text" ([W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)); the exemption is a floor, so keep the marker no smaller than the superscript it must be.
- 1.3.1: the notes are an ordered list under a heading, linked both ways to their references.

**Build**
- Marker: `<sup><a href="#note-3" id="ref-3" role="doc-noteref"><span class="visually-hidden">Note </span>3</a></sup>`; the hidden word gives the name (code-standard rule 6 keeps `visually-hidden`; [accessibility: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions)).
- Notes: a `section role="doc-endnotes"` with a heading and an `ol`; each `li id="note-3"` ends with `<a href="#ref-3" role="doc-backlink" aria-label="Back to reference 3">`. DPUB-ARIA: no `doc-footnote` inside endnotes. Links are [HTML semantics: links and buttons](../../code/html-semantics.md#links-and-buttons).
- Numbers and ids come from the docs build's footnote syntax, never typed by hand.
- Note and reference targets take `scroll-margin-top` from the sticky header's property, as in [navigation: in-page navigation](../patterns/navigation.md#in-page-navigation-on-this-page) (code-standard rule 46).
- Side notes keep DOM order (note after its paragraph) and move to the margin with grid only (code-standard rule 2).

**Check**
- *Script:* could check every `doc-noteref` resolves to a note, every note has a back link to an existing reference, numbers ascend in document order, and no marker is named by a symbol alone.
- *Judgement:* would the page lose anything if this note went into the sentence or was cut?

**Sources:** as linked above. GOV.UK advises against footnotes on the web; DPUB-ARIA gives them roles because publications keep them. The toolkit puts what matters in the text, uses notes only for skippable asides, and puts sources in a Sources line, because a docs reader scans rather than reads through.

---

## Examples: do and don't, live examples, code

**Use when**
- A page shows a component or pattern in use, gives best practices, or offers code to copy.

**How**
- **Do and don't come in pairs.** Every "don't" has the "do" it should be replaced with, shown side by side, same size, same content where possible, with a caption saying why. A list of prohibitions leaves the reader without the thing to reach for ([Write the Docs](https://www.writethedocs.org/guide/writing/docs-principles/) *Exemplary*; [TDesign](https://tdesign.tencent.com/react/components/button) lists similar components).
- Label do and don't with a word ("Do", "Don't") and an icon, never colour alone.
- **Live examples** once code exists, served from the project's own Storybook on the docs site's origin and matched to the component by file location; before code exists, images exported from the design, labelled as design. Never both on one page without saying which is which. This labelling is the toolkit's judgement.
- Each example has an "Open in a new tab" link naming the example, as GOV.UK does ("Open this example in a new tab: text input"), so it can be tested alone at any width.
- **Code snippets** under the example they produce, in the tabs the system supports (GOV.UK: HTML and Nunjucks), with a copy button that says it copied. Short and complete: a snippet that cannot be pasted and run is a fragment.
- Examples use realistic content (real labels, long names, translated strings), not "Lorem" or "Button".
- Small screens: examples render at the narrow width too; a side-by-side do/don't pair stacks, do first.

**Cases**
- A best-practices list has six "don'ts" and no images → turn each into a pair with the alternative, or cut it.
- Do and don't are a green and a red border → add the words "Do" and "Don't" and an icon (1.4.1).
- A live example and a Figma image of the same component sit side by side unlabelled → label each with its source; their differences belong to parity, not the docs page.
- The copy button gives no sign it worked → announce "Copied" in a status message (4.1.3) and show it visually for a moment.

**Accessibility**
- 1.4.1 Use of Colour (do/don't), 4.1.3 Status Messages (copy confirmation), 1.1.1 (an image example has alt text describing what it shows and why it is right or wrong), 2.1.1 Keyboard (the live example and its tabs are operable by keyboard).
- Implementation: code-standard rule 18 (names for icon-only copy buttons), code-standard rule 15 (a caption is a description, not part of the name).

**Build**
- Samples are `pre` and `code`; the copy button is a `button` that reports "Copied" in a status element; a live example is an `iframe` with a `title` and an open-alone link. All of it is [HTML semantics: code samples and live examples](../../code/html-semantics.md#code-samples-and-live-examples).
- Do and don't are `figure`s whose `figcaption` starts with the word, the icon `aria-hidden` (code-standard rule 18); the caption is a description, not part of a name (code-standard rule 15).
- Code tabs (HTML, Nunjucks) are the APG tabs pattern over panels that read as headed sections without script ([accessibility: composite widgets and roving tabindex](../../code/accessibility.md#composite-widgets-and-roving-tabindex); code-standard rule 20).
- Example code is escaped once, at output ([security: escaping by context](../../code/security.md#escaping-by-context-xss)).

**Check**
- *Script:* could check each "don't" block has a sibling "do", each example has a labelled source, and each copy button has an accessible name.
- *Judgement:* is the "do" the right alternative, and is the example representative of real use?

**Sources:** [GOV.UK text input](https://design-system.service.gov.uk/components/text-input/) (HTML/Nunjucks tabs, open-in-new-tab link); [Primer button](https://primer.style/product/components/button/) and [Atlassian button examples](https://atlassian.design/components/button/examples) for live, editable examples.

---

## On-this-page navigation

**Use when**
- A page is longer than about two screens or has more than three `h2` sections. (This threshold is the toolkit's judgement; NN/g gives none.)

**How**
- The list itself (rail or body, label, entries generated from headings, scroll margin) is [navigation: in-page navigation](../patterns/navigation.md#in-page-navigation-on-this-page). A docs site adds:
- `h2` only, or `h2` and `h3` for long reference pages; deeper levels make it a second page.
- Each section has an anchor, so a heading can be linked (Write the Docs *Addressable*).
- Small screens: the rail collapses to a disclosure at the top of the content, closed by default.

**Cases**
- A tabbed page has one list covering every tab → the list covers the visible tab only.
- A page with three short sections has a sticky rail → remove it; it takes width and gives nothing.

**Accessibility**
- 2.4.5 Multiple Ways, 2.4.1 Bypass Blocks (the list jumps within the page), 2.4.11 Focus Not Obscured (a sticky header must not cover the target heading after a jump; leave scroll margin).
- Implementation: code-standard rule 64 (`aria-current` on the current entry), code-standard rule 1 (a labelled `nav` landmark).

**Build**
- The list's markup and its current-entry marking are [navigation: in-page navigation](../patterns/navigation.md#in-page-navigation-on-this-page); the docs site generates it from the `h2` ids at build time, so entries cannot drift from the headings.
- `scroll-margin-top` on headings equal to the sticky header's height, read from the same custom property (code-standard rule 46).
- The small-screen collapse is a `details` at the top of `main`, closed by default ([HTML semantics: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers)).

**Check**
- *Script:* could check entries match `h2` text exactly and in order, and every heading has an id.
- *Judgement:* does the list help on this page, or decorate it?

**Sources:** [NN/g table of contents](https://www.nngroup.com/articles/table-of-contents/), as in navigation; the threshold and the tab rule are the toolkit's.

---

## Provenance and freshness on generated pages

**Use when**
- A page is built from data: a token payload, a design snapshot, an audit record, a coverage report.
- design-standard rule 1 applies.

**How**
- The caption's form, its dates, missing and out-of-order sources, and hand-written summaries of generated data are [data: provenance and freshness](../patterns/data.md#provenance-and-freshness) (design-standard rule 1). The cases below are where docs sites go wrong.

**Cases**
- A token page has no date → add the caption from the payload's own timestamp ([data: provenance and freshness](../patterns/data.md#provenance-and-freshness)).
- The audit date is older than the snapshot date → the caption says the audit judged an earlier library; the reader then knows the findings may be stale.
- A page has three sources and one failed to load → the caption lists the two with dates and names the third as unavailable; the page drops the sections that depended on it.

**Accessibility**
- 1.3.1: the caption is text associated with the heading. 2.4.6: the title remains the page's heading; the caption is not a heading.
- No code-standard rule implements it specifically; the caption is ordinary content.

**Build**
- The caption is a `p` directly after the `h1`, never a heading; each date is `<time datetime="2026-10-11">` with the formatted date as its text ([i18n: numbers, dates, plurals and lists](../../code/i18n.md#numbers-dates-plurals-and-lists)).
- The generator writes the caption from the payload's own timestamps (code-standard rule 23); a missing source is a line naming it, not a skipped one (code-standard rule 61).
- A stale page carries `data-stale` on the caption, styled from the attribute, so the warning is markup a check can read rather than a colour alone (code-standard rule 6).

**Check**
- *Script:* could check every generated page has a caption with at least one dated source, and flag a caption whose audit date precedes its snapshot date. `tools/ui-check/check.mjs` does not check design-standard rule 1; it is read at the closing pass.
- *Judgement:* could a reader tell from the caption alone whether this page is current?

**Sources:** design-standard rule 1; data's sources; [Write the Docs](https://www.writethedocs.org/guide/writing/docs-principles/) *Current*.

---

## Change logs, status and versioning

**Use when**
- A component, token set or pattern changes, is deprecated, or the system ships a new major version.

**How**
- **On the page**: a "Recent changes" section on each component page, newest first, each entry dated, linking to the full history. GOV.UK uses a table of Date, Changed, Description and a "View full change history" link; Atlassian gives the change log its own tab.
- **The full log** follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/): for humans, an entry for every version, latest first, release date shown, changes grouped as Added, Changed, Deprecated, Removed, Fixed, Security.
- Each entry says what changed and what it does to the reader's work (design-standard rule 10), not only the commit subject.
- **Status**: a small vocabulary, shown in the overview. Atlassian's release phases are Early Access, Beta, General Availability, then Intent to Deprecate and Deprecated, with a replacement and migration path for the last ([Atlassian](https://atlassian.design/release-phases)). Primer now uses three ([component status](https://primer.style/product/getting-started/component-status/)). Three or four values, derived from data, never typed.
- **Deprecated** pages stay published, marked at the top, naming the replacement and the removal date or version.
- **Versioning**: when old majors stay in use, keep their docs reachable from a version switcher, with the current stable version marked as the one to use. MUI lists each major with its own docs and marks the stable one "recommended for use in production" ([MUI versions](https://mui.com/versions/)). One version is the default; old versions carry a banner pointing to current.

**Cases**
- A component's history lives only in the repository → add Recent changes to the page; the reader deciding whether to trust the page is on the page.
- An entry reads "refactor button tokens" → rewrite: "Changed: the focus ring now uses the border-focus token; overrides of the old token stop applying."
- A deprecated component's page was deleted → restore it with a deprecation notice and the replacement; links from old code and old designs still arrive there.
- A site shows v3 docs by default while v4 is stable → default to v4, banner on v3.

**Accessibility**
- 1.3.1: the change table has header cells. 1.4.1: status is a word, never a coloured dot alone. 2.4.4 Link Purpose: "View full change history", not "More".
- Implementation: code-standard rule 15 (a status badge beside a title is a description).

**Build**
- Recent changes is a `table` with Date, Changed and Description header cells, dates as `<time datetime>` ([HTML semantics: tables for data](../../code/html-semantics.md#tables-for-data)).
- The status is a word in a badge next to the title, tied to it as a description rather than inside the `h1` (code-standard rule 15), and derived from data by the generator.
- A deprecated page's notice is the first thing in `main`, linking the replacement; the version switcher is a `nav` of links with `aria-current` on the version shown (code-standard rule 64).

**Check**
- *Script:* could check Recent changes exists, entries are dated and newest first, and a deprecated page names a replacement link.
- *Judgement:* does each entry tell the reader what to do about the change?

**Sources:** [GOV.UK text input](https://design-system.service.gov.uk/components/text-input/) (Recent changes table, reopened here), [Atlassian release phases](https://atlassian.design/release-phases), [MUI versions](https://mui.com/versions/), [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## Search in docs

**Use when**
- The site has more pages than fit in one side list, or readers arrive knowing a name (a token, a prop) rather than a section.

**How**
- One search, in the global header, in the same place on every page.
- Index by section, not only by page: a hit should land on the heading that answers, with the anchor. Paste splits its MDX files into sections by heading for its index ([Paste docs search](https://github.com/twilio-labs/paste/blob/main/internal-docs/engineering/doc-site/docsearch.md)).
- Tokens and props are found by exact name: a search for `colour-text-neutral-strong` returns that token first. [Atlassian's token page](https://atlassian.design/components/tokens/all-tokens) has exact search.
- Results show the page, the section and its type (component, token, pattern), so two hits called "Button" can be told apart.
- No results: as [search: results page and no results](../patterns/search.md#results-page-and-no-results), offering the section lists.
- Search behaviour in depth is `../patterns/search.md`.

**Cases**
- Searching "focus ring" returns the Button page top → land on Button's focus section anchor, and list the focus-indicator token page too.
- A token named in the generated tables cannot be found → index the generated tables at build time.
- Search opens a modal with no visible label → give the field a label and the dialog a name; return focus to the trigger on close (`../patterns/dialogs.md`).

**Accessibility**
- 2.4.5 Multiple Ways, 4.1.3 Status Messages (result counts announced), 3.3.2 Labels or Instructions (a visible label or a labelled search landmark), 2.1.1 Keyboard (results reachable and selectable by keyboard).
- Implementation: code-standard rule 14 (results swap keeps the reader's place), code-standard rule 20 (search works as a GET form without script).

**Build**
- A `search` element holding a GET `form` with a labelled `input type="search"`, so it works without script and the query lands in the address (code-standard rule 20; [search: the query in the address](../patterns/search.md#the-query-in-the-address)).
- Results swap in place and announce a count in a persistent status element (code-standard rule 14; [accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).
- A suggestion list is the APG combobox; a search in a modal is a `dialog` that returns focus on close ([search: keyboard](../patterns/search.md#keyboard)).
- Each hit links the heading's anchor (`/button/#focus`), so the index stores sections, generated at build time with the pages.

**Check**
- *Script:* could check the search is a labelled form with a no-script action and a `search` landmark, and that a known token name returns its own page first.
- *Judgement:* does a hit land the reader on the answer or on a page they must search again?

**Sources:** [Paste docs search](https://github.com/twilio-labs/paste/blob/main/internal-docs/engineering/doc-site/docsearch.md). Paste ranks by vector similarity; the toolkit asks for exact-name matches first on token and prop names, because a reader who types a token's name wants that token.
