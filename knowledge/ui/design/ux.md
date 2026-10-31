# UX fundamentals: what a screen is for, across screens

This file holds the UX area's fundamentals for building and auditing a design or a built page: what a screen is for, what it asks, what it shows first, what it remembers, what it admits it does not know, and when it may interrupt. Each section gives what good looks like, how to do it, the cases an agent meets, the accessibility criteria involved, what a script can check and what a reviewer judges, and its sources. It serves design-standard rule 1 (a page says where its figures come from and how fresh they are) and the principles *serve a real need*, *as little as possible*, *consistent, not uniform*, *discoverable*, *people in control*, *honest* and *clear words, clear hierarchy*. The moment-to-moment behaviour of a control (response, feedback, dialogs, validation) is the interaction file's; what a screen says is the content file's.

---

## User needs and tasks first

**What good looks like**
- Every screen type has one need written in the user's words: "I need to… so that…".
- Every card, tab, column and action can point at that need; what cannot is removed.
- The screen's title names its subject, and the first thing on it answers the need.
- Different audiences with different needs get different first screens.

**How.** Before drawing or building, write the need line for the screen in the format the [GOV.UK Service Manual](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs) gives ("I need/want/expect to…", then "So that…"), in words users would use themselves. Keep it in the template's spec or source comment where the next reviewer finds it. Order the screen by it: the answer to the need first, the supporting detail after, everything else one step away (see *Progressive disclosure*). When a stakeholder asks for an element, ask which need it serves; GOV.UK's [first design principle](https://www.gov.uk/guidance/government-design-principles) warns that "what they ask for isn't always what they need". Where research time is short, watching two or three real users do the task once beats an imagined user (commentary).

**Cases**
- An overview page tries to serve a designer (what to fix next), an engineer (does the code match) and a lead (is it improving) equally → pick the need the page exists for, lead with it, and link out to the others; a page that answers three needs equally answers none well.
- A dashboard card shows a figure nobody acts on → ask what decision it informs; if none, remove it (*serve a real need*).
- A request arrives for "a settings page" → first list what people would change and why; most view options belong on the view they affect (*Defaults*), and the page may not be needed.
- An audit that builds a page from a design with no stated purpose → report it as a finding: the page's purpose cannot be checked, so nothing on it can be judged.

**Accessibility.** WCAG 2.2 2.4.2 Page Titled (A): the title says what the page is for, which the need line supplies. 2.4.6 Headings and Labels (AA): headings describe what follows. One `h1` and an ordered outline are code-standard rule 1.

**Build.**
- The need line lives in the template's spec or a source comment beside it; the page carries it as a `title` that names the subject and one `h1` inside `main` (code-standard rule 1).
- Markup: [HTML semantics: document metadata](../../code/html-semantics.md#document-metadata) and [headings and the outline](../../code/html-semantics.md#headings-and-the-outline).

**Check.** *Script:* could check that every template declares a purpose in its spec, and that each page's `title` and `h1` are present and differ from the site name alone. *Judgement:* is the need real, and does the first screen answer it before anything else?

**Sources.** GOV.UK design principles and Service Manual above; [Polaris experience values](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx), "Considerate": "don't assume the perfect situation, preparation, or usage". For the whole journey, GOV.UK [Service Standard point 2](https://www.gov.uk/service-manual/service-standard/point-2-solve-a-whole-problem) ("solve a whole problem for users") and Carbon's [Universal Experiences](https://carbondesignsystem.com/building-experiences/overview/) nine stages. Carbon's stages are written for a commercial product; the toolkit uses them as a checklist of moments (first contact, onboarding, routine use, getting help, expansion), not a template.

---

## Information architecture: grouping, labelling, depth

**What good looks like**
- Navigation shows where the reader is first, then what is nearby; local navigation is quieter than global.
- Grouping follows the reader's model of the subject, not the tools or teams that produce it.
- An object that appears in two places links between them.
- Tabs choose which independent thing one screen is about; links move between screens.

**How.** Label groups with the reader's nouns; a label must let the reader predict what is inside. Keep depth shallow: if a reader must know which tool produced a fact to find it, the structure follows the toolkit's seams and not the reader's. The parts are patterns: global and local navigation ([menus: top menu bar](../patterns/menus.md#top-menu-bar), [sidebars: navigation sidebar](../patterns/sidebars.md#navigation-sidebar)), breadcrumbs ([navigation: breadcrumbs](../patterns/navigation.md#breadcrumbs)), tabs, which choose what one screen is about ([navigation: tabs](../patterns/navigation.md#tabs); design-standard rule 3 for the bar under them), and mega menus ([menus: mega menus](../patterns/menus.md#mega-menus)).

**Cases**
- An audit finding names a component, and the component's page does not link back to its findings → add both links; an object in two tools without a link between them is a bug: the journey has been cut along the tools' seams.
- Tabs used to filter one table, or tabs that change the address built as panel tabs → [navigation: tabs](../patterns/navigation.md#tabs).

**Accessibility.** 1.3.1 Info and Relationships (A): groups and hierarchy are in the markup, which is code-standard rules 1 and 3. 2.4.5 Multiple Ways (AA): more than one way to reach a page in a set (navigation and search, or navigation and an index). 2.4.8 Location (AAA) is met by breadcrumbs and the marked current page (code-standard rule 64). 3.2.3 Consistent Navigation (AA): repeated navigation keeps its order.

**Build.**
- Global and local navigation are `nav` landmarks, each with an accessible name, and every band is a landmark holding one container (code-standard rules 1 and 3).
- The current page is `aria-current="page"`, its section `aria-current="true"`, and the selected look is styled off the attribute (code-standard rule 64).
- Markup: [HTML semantics: landmarks](../../code/html-semantics.md#landmarks) and [navigation markup](../../code/html-semantics.md#navigation-markup).

**Check.** *Script:* could check that every page is reachable from navigation; the navigation patterns carry their own checks. *Judgement:* does the grouping match how readers think about the subject?

**Sources.** As linked; where sources disagree on tabs, [navigation: tabs](../patterns/navigation.md#tabs).

---

## Journeys and multi-step flows

**What good looks like**
- One question or decision per page, in a flow that reads in order.
- A Back link on every step, and the browser's Back reaches the previous step with its answers kept.
- A check-answers page before anything is written, and a Change from it returns there.
- Changing one answer never means walking the flow again.

**How.** Start with one thing per page ([GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)); group questions only where they are always answered together. Every step has a Back link and the browser Back must not break or clear the step's answers. Close small and medium flows with one [check answers page](https://design-system.service.gov.uk/patterns/check-answers/) immediately before the final write; for a long transaction, one per section. After a Change, Continue returns to the summary, not to the next question. Save answers per step so a reload or a failed submit loses nothing ([Primer saving](https://primer.style/product/ui-patterns/saving/): "the user's data should be preserved in the form"). Use a flow only when steps barely depend on each other; a wizard fails when users must move between interdependent steps ([NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/)). On a small screen the same flow works unchanged, which is one of its strengths.

**Cases**
- Setting up a project (name, library files, code target, first audit) → one step each, then a summary listing what will be written, each line with Change, then one Create.
- Accepting a batch of parity waivers → list every waiver to be written with a way to edit or drop each, then commit once; the summary is the review step 3.3.4 asks for.
- A reader presses the browser Back on step three and lands on an empty step two → a bug: each step's answers live in the address or in saved state, and Back restores them (*State persistence*).
- A flow with interdependent settings (a choice on step four changes what step two means) → not a wizard; put those settings on one page.
- The final submit fails on the server → keep every answer, say what failed, and offer retry from the summary.

**Accessibility.** 3.3.4 Error Prevention (Legal, Financial, Data) (AA): a submission that commits data is reversible, checked, or confirmed; the check-answers page is the check. 3.3.7 Redundant Entry (A): nothing asked twice in one process (*Recognition over recall*). 2.2.1 Timing Adjustable (A): a session time limit can be turned off, extended or warned of. 2.4.3 Focus Order (A): code-standard rule 2. Each step working as a real form with no script is code-standard rule 20.

**Build.**
- Each step is a real `form` that posts and works with no script (code-standard rule 20); the Back link is an `a href` to the previous step.
- Answers are kept per step on the server or in the address, so Back and reload restore them ([JavaScript: state in the address and history](../../code/javascript.md#state-in-the-address-and-history)).
- Markup and error handling: [HTML semantics: forms markup](../../code/html-semantics.md#forms-markup) and [form errors and validation](../../code/html-semantics.md#form-errors-and-validation).

**Check.** *Script:* could drive a flow and assert each step has a Back link, browser Back returns the previous step with its values, a summary precedes the final write, and Change returns to the summary. *Judgement:* should this be a flow at all, and how are the questions split?

**Sources.** GOV.UK patterns linked above. GOV.UK advises a check page per section for very large transactions and testing that with users; the toolkit follows it.

---

## Consistency and standards

**What good looks like**
- The same problem gets the same solution on every screen: one filter bar, one dialog shape, one name per thing.
- Landmarks that sibling screens share sit at the same place and size on each.
- Conventions people know from elsewhere are followed unless there is a stated reason.
- A departure is documented with its reason.

**How.** Apply the test from [Salesforce Lightning](https://winter-20.lightningdesignsystem.com/guidelines/overview/): "applying the same solution to the same problem". Two screens that look different are fine if their problems differ; two that solve one problem differently are the defect. GOV.UK's [Be consistent, not uniform](https://www.gov.uk/guidance/government-design-principles) is the guard against forcing a pattern onto a problem it does not fit. Use the system component where one exists. Keep internal consistency (one product) and external consistency (web conventions: a logo links home, search is a box) per [NN/g heuristic 4](https://www.nngroup.com/articles/consistency-and-standards/). Measure what must not move between sibling templates and between states of one screen: header height, toolbar position, the first row of a table. Design-standard rule 2 holds the layout still when the reader switches tab, file or filter.

**Cases**
- Switching file tabs moves the page because one file type shows an action column → neither screen was wrong alone, the inconsistency lived in the journey ([interaction: layout stability](interaction.md#layout-stability)).
- Two pages each build their own filter row for the same kind of list → one filter bar, laid out the same everywhere (design-standard rule 3).
- The same action is "Run audit" on one page and "Check" on another → one label from the kept list of terms (the content file).
- A screen genuinely needs a different layout (a canvas, not a list) → allowed; write the reason beside it so the next review does not "fix" it.

**Accessibility.** 3.2.3 Consistent Navigation (AA): repeated navigation keeps its relative order. 3.2.4 Consistent Identification (AA): components with the same function are identified the same way. 3.2.6 Consistent Help (A) applies to help (*Help and documentation*). How a component is named in code is code-standard rule 18.

**Build.**
- One component per job, used everywhere it applies; a behaviour written once and included (code-standard rule 36), never re-built per page.
- Shared landmarks keep their box because the page grid is stated once (code-standard rule 46; [responsive: one page grid and one container element](../../code/responsive.md#one-page-grid-and-one-container-element)).
- A Figma component maps to one coded component: [figma handoff: the component inventory](../../code/figma-handoff.md#the-component-inventory).

**Check.** *Script:* `tools/ui-check/check.mjs: design-standard rule 2` measures a tab list's position across tab switches; could measure header and toolbar boxes across sibling templates, find two components doing one job, and list labels that differ for one action. *Judgement:* are these two problems really the same?

**Sources.** As linked; [Polaris](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx) "Familiar" and "Fix small mistakes and inconsistencies that erode trust".

---

## Recognition over recall, and asking once

**What good looks like**
- The product reads what it already knows (the system, the project's settings) before asking.
- What must be asked is asked once per journey; later steps carry it forward and let it be changed.
- Where the set of answers is known, people pick from it instead of typing.
- Options, recent values and current choices are visible, not remembered.

**How.** Read from the system first ([Apple Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data): "Don't ask people to enter information that you can gather automatically"). Ask for each piece once in a journey and pre-fill or offer carried-forward answers after that ([GOV.UK question pages](https://design-system.service.gov.uk/patterns/question-pages/)). Offer choices over text entry where the answers are known: a menu of components, not a box needing an exact name. Show the current choice of a collapsed control (design-standard rule 12 names what "all" covers). Pre-filled data can be stale, so every carried-forward value has a visible way to change it.

**Cases**
- A tool asks for the project's language and library files when the project's context document already holds them → read them from the context; ask only if missing.
- A filter needs a component's exact name typed → a menu listing the components with counts (design-standard rule 11); recognition, not recall.
- A flow asks for an email on step one and again on the summary's contact section → carry it forward as a selectable or pre-filled value (3.3.7).
- A sign-in asks people to retype a code from another device with no paste → allow paste and autofill (3.3.8).

**Accessibility.** 3.3.7 Redundant Entry (A): information entered earlier in the same process is auto-populated or selectable, except where re-entry is essential, for security, or no longer valid ([W3C Understanding](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)). 3.3.8 Accessible Authentication (Minimum) (AA): no memory or transcription test to sign in. 1.3.5 Identify Input Purpose (AA): personal fields declare their purpose so browsers can fill them. 3.3.2 Labels or Instructions (A). A visible label carries the name and a hint is a description, code-standard rule 15.

**Build.**
- Personal fields carry `autocomplete` with their purpose token; known answers are a `select`, radios or a `datalist`, not a free `input`.
- Carried-forward values are pre-filled `value`s the reader can change; the hint is `aria-describedby`, never part of the label (code-standard rule 15).
- Markup: [HTML semantics: forms markup](../../code/html-semantics.md#forms-markup).

**Check.** *Script:* could drive a flow and assert any value collected earlier is pre-filled or selectable later, and that personal fields carry `autocomplete`. *Judgement:* is the question needed at all, and does a list or free text fit the answers?

**Sources.** As linked; the W3C [COGA note](https://www.w3.org/TR/coga-usable/) objective "ensure processes do not rely on memory".

---

## Defaults

**What good looks like**
- Every control with a resting state declares a default: filters, tabs, sorts, toggles.
- The default is what most people would choose, never the first alphabetically and never what serves the product at their expense.
- Clear and reset return exactly to the default.
- Options that change one view live on that view.

**How.** Choose each default from what most users need ([NN/g The Power of Defaults](https://www.nngroup.com/articles/the-power-of-defaults/): "pre-populate fields with the most common value"; people rarely change them, so the default is the design). For a filter bar, "All <things>" first, the most useful tab first, the commonest sort. Clearing filters returns to that state ([Carbon filtering](https://carbondesignsystem.com/building-blocks/core/patterns/filtering/)). Put view options where they act: [Apple Settings](https://developer.apple.com/design/human-interface-guidelines/settings) puts showing, reordering and filtering "in the screens they affect" and asks to "Minimize the number of settings". Some choices must be made consciously and get no default: Apple's line is "Never prepopulate a password field"; the same holds for a destructive choice or a consent.

**Cases**
- A severity filter defaults to "Low" because it sorts first → default to all severities, or to the one most readers open with.
- A list's sort defaults to name when readers come to find what changed → default to most recent.
- "Clear filters" leaves the tab on the last file chosen → decide whether the tab is part of the default; clear restores the declared default state, nothing else.
- A consent checkbox arrives ticked → untick it; a default must never steer people against their interest (*honest*).
- A display density toggle sits in a global settings page → move it onto the table it changes.

**Accessibility.** 3.2.2 On Input (A): changing a default value does not change context unless the person was told it would. A default selection must still be announced: the selected state of a segmented button or menu is in the markup (code-standard rule 9 for states).

**Build.**
- The default is the initial markup: `checked`, `selected` or `aria-selected="true"` on the default option, so it is announced (code-standard rule 9).
- Clear is a link to the address with no parameters, or a form `reset` back to the declared values ([HTML semantics: search and filter forms](../../code/html-semantics.md#search-and-filter-forms)).

**Check.** *Script:* could check that every filter, tab set and sort has a declared default in its spec or initial markup, and that clear returns the URL and controls to it. *Judgement:* is the default what most people need?

**Sources.** As linked. NN/g's article dates from 2005; no newer source found contradicts it.

---

## Progressive disclosure

**What good looks like**
- Common content and actions are on the first view; the rest is one step away.
- No more than two levels of disclosure from a page's first view.
- Every trigger says in text what it reveals.
- Disclosure is used sparingly, only where truncation is needed.

**How.** Split initial and secondary features from task analysis and frequency of use, and put the verdict first and the evidence behind one control. How deep, how the step is signalled and how to count levels across surfaces is [disclosure: progressive disclosure depth](../patterns/disclosure.md#progressive-disclosure-depth). Without script, a disclosure shows everything (code-standard rule 20).

**Cases**
- Verdict-first pages, three levels across surfaces, an icon-only trigger → [disclosure: progressive disclosure depth](../patterns/disclosure.md#progressive-disclosure-depth).
- Usage shows most readers open the advanced section on every visit → promote it to the first view.
- Ten collapsed sections on one page → reconsider: a page that hides most of itself needs splitting or a better split.

**Accessibility.** 4.1.2 Name, Role, Value (A): the trigger exposes its expanded state; `details` gives it, and what `details` does not give is code-standard rule 19. 2.4.6 Headings and Labels (AA): the trigger's text describes what opens. Hidden content stays hidden from every reader, code-standard rule 17.

**Build.**
- A disclosure is `details` and `summary` with text that names what opens; with no script it shows everything (code-standard rules 1 and 20).
- What `details` does not give, Escape and light dismiss, is code-standard rule 19; content a script hides with `hidden` stays hidden (code-standard rule 17).
- Markup: [HTML semantics: disclosure, dialogs and popovers](../../code/html-semantics.md#disclosure-dialogs-and-popovers).

**Check.** *Script:* could count nested disclosure levels from the first view and flag a third, and flag a trigger with no text name. *Judgement:* is the split right for what readers use most?

**Sources.** NN/g and Primer as linked from disclosure; [Polaris](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx): "Hide complexity where you can, but give people access to more sophistication if they need it."

---

## Onboarding and first run

**What good looks like**
- The product is understandable by using it; onboarding, where needed, is short, optional and in context.
- The first run gives a welcome and one clear next action.
- Anything skipped or dismissed does not return, and stays findable.
- At most one teaching bubble at a time, and an announcement only when it is needed.

**How.** Prefer the empty states of a first run to a tour: each empty page says what will appear and the one action that fills it (*Empty states*). Where teaching is needed, use context-specific tips over a single flow and teach through interaction ([Apple Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)); postpone nonessential setup. Give users "a clear next step at every point" ([Carbon Onboard](https://carbondesignsystem.com/building-experiences/onboard/)). For a feature introduced to existing users, show one teaching bubble at a time, no more than two alerts at once, and respect a dismissal ([Primer feature onboarding](https://primer.style/product/ui-patterns/feature-onboarding/)); offer dismiss at every step and ask whether the message is needed at all ([Atlassian onboarding](https://atlassian.design/components/onboarding/usage)). On a small screen a tip must not cover the control it explains.

**Cases**
- A new project's docs site has no snapshot and no audit yet → no tour; each overview's empty state says "No audit yet", what it will show, and the one command or button that runs it.
- A product tour of seven steps on first sign-in → cut to one dismissible tip at the moment of first use, or none.
- A "What's new" banner reappears after being closed → store the dismissal; Primer: "Respect when a user dismisses a message."
- Three feature teams each want a bubble on the same screen → one at a time, in order of what the reader needs first.
- A skipped tutorial can never be found again → link it from help.

**Accessibility.** 1.4.13 Content on Hover or Focus (AA): a tip shown on hover or focus is dismissible without moving focus, hoverable and persistent. 2.4.11 Focus Not Obscured (Minimum) (AA): a bubble may not hide the focused control. 2.2.2 Pause, Stop, Hide (A) for any auto-advancing tour. The tip's dismiss button meets figma-standard rule 26 in the design and is named in code (code-standard rule 18).

**Build.**
- A tip is a `popover` or a toggletip with a named dismiss `button` (code-standard rule 18); [accessibility: tooltips and toggletips](../../code/accessibility.md#tooltips-and-toggletips) owns the markup.
- A dismissal is stored on an explicit action, never on render (code-standard rule 20); the first-run empty states render only when the list is empty (code-standard rule 12).

**Check.** *Script:* could check that every tip and banner has a dismiss control, that a dismissed one stays gone on reload, and that no more than one bubble and two alerts show at once. *Judgement:* is onboarding needed, and what is the first meaningful action?

**Sources.** As linked. Atlassian allows tours of three to four steps; Apple and Atlassian both prefer single, contextual tips. The toolkit goes with one step: no source found shows that longer tours are remembered, and every team wants its own bubble. Atlassian's package is marked deprecated in favour of `@atlaskit/spotlight`; the guidance is still published.

---

## Empty states

**What good looks like**
- No data-bearing region is ever blank, and each empty state says which kind it is, why, and the way on.

**How.** Plan the empty states of a journey with its full states, not after: a first run is a sequence of empty pages (*Onboarding*), a filter can lead to nothing, a source can fail. The kinds, their copy and their action are [feedback: empty states](../patterns/feedback.md#empty-states); preventing dead ends at the filter is [filtering: unavailable options](../patterns/filtering.md#unavailable-options).

**Cases**
- A "nothing yet" message on a "nothing matches" screen → it tells the reader to create what they already have; the kinds are distinct ([feedback: empty states](../patterns/feedback.md#empty-states)).

**Accessibility.** As in [feedback: empty states](../patterns/feedback.md#empty-states) (1.3.1, 4.1.3); a region swap keeps the reader's place by code-standard rule 14.

**Build.**
- The empty state renders only when the list is empty, and a fallback never shows beside data (code-standard rule 12).
- A swap into or out of it keeps the reader's place and announces the result (code-standard rule 14; [accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).

**Check.** *Script:* see [feedback: empty states](../patterns/feedback.md#empty-states). *Judgement:* does every journey reach an empty or failed state with a way on?

**Sources.** [NN/g empty states](https://www.nngroup.com/articles/empty-state-interface-design/): "Totally empty states cause confusion about how and whether the system is working"; Carbon and Primer as linked from feedback.

---

## Degraded, offline and error states

**What good looks like**
- When part of a page fails, the rest renders and works.
- What is missing is named plainly, in its place; nothing pretends.
- An unknown figure is hidden, never shown as zero.
- Global navigation always renders.

**How.** Sort each page's sections into primary (essential for the page to be useful) and secondary ([Primer degraded experiences](https://primer.style/product/ui-patterns/degraded-experiences/)). If a secondary section fails, replace it with a short message and a warning icon and keep the rest; if a primary section fails, show an error page. Do not conceal or downplay that something is wrong, and avoid making people think they have lost data. Cap a page at five outage messages; past that, it is an error page. A count that cannot be fetched is hidden, because zero is a claim ([data: numbers](../patterns/data.md#numbers)). Never suppress the global header. A control that is non-functional because a service is down is treated by cause ([interaction: disabled, hidden or read-only](interaction.md#disabled-hidden-or-read-only)): it stays reachable and says what happened when used, never a silent disabled state. Never render "undefined", "NaN" or an empty template slot. Say why it failed when the layer below knows (code-standard rule 61), and keep the no-script path working (code-standard rule 20). No design system checked publishes offline guidance for web tools; treat a lost connection as an outage of every remote section, keep what is already on screen, and say that the page is not current.

**Cases**
- A page assembles a snapshot, an audit record and a parity report, and the parity report is missing → render the other two and put "Parity report unavailable" in its section; never a blank card.
- A findings count fails to load → hide the number; "0 findings" would tell the reader there is nothing to fix.
- A "Run audit" button whose service is down → keep it reachable; on press, say the service is unreachable and when to retry. This differs from design-standard rule 5, which disables a choice that leads to nothing that exists; here something exists and cannot be reached.
- Six sections fail at once → one error page, not six warnings.
- The connection drops while a reader works through a list → keep the list, mark it as last updated at the time of loss (*Trust and provenance*), and retry quietly.

**Accessibility.** 3.3.1 Error Identification (A): an error is described in text. 1.4.1 Use of Color (A): the warning icon and the words carry it, never colour alone. 4.1.3 Status Messages (AA): an error that appears in place is announced (a [code candidate](../../code/candidates.md)). The icon is decorative beside its text, code-standard rule 18.

**Build.**
- Each section renders independently: a failed source renders a message in its own slot, and a count that cannot be fetched is not rendered at all.
- The message carries the reason the layer below gave (code-standard rule 61); the warning glyph is `aria-hidden` beside its text (code-standard rule 18).
- Error handling in script: [JavaScript: errors and an envelope's success flag](../../code/javascript.md#errors-and-an-envelopes-success-flag); the no-script path stays whole (code-standard rule 20).

**Check.** *Script:* could render every page with each data source removed in turn and assert navigation and the remaining sections render, a missing count is absent rather than zero, no "undefined" or "NaN" appears, and no more than five outage messages show. *Judgement:* which sections are primary?

**Sources.** Primer as linked; it is the only design-system guidance found on degraded states.

---

## State persistence and restore

**What good looks like**
- The address holds what a reader would expect Back, reload and a shared link to keep: the tab, the filters, the search, the sort.
- Reload restores the view exactly; a shared link opens the same rows for the recipient.
- Back undoes the last change the reader perceived as a new view.
- Unsaved work survives a failed save and, where it is cheap, a reload.

**How.** Write tab, filters, search and sort into the query string or fragment as they change. Push a history entry for each change the reader would perceive as a new view (a filter applied, a tab switched) so Back removes it; replace the entry for minor changes such as each keystroke in search ([Baymard back button](https://baymard.com/blog/back-button-expectations): "Tapping 'Back' after applying filters should begin removing the applied filters"). Read the address on load and set every control from it. A filter bar built as a GET form puts its state in the address with no script at all, which is code-standard rule 20's no-script path doing this work for free. Treat parameter names as a public interface: a link already sent breaks when one is renamed ([NN/g URL as UI](https://www.nngroup.com/articles/url-as-ui/)). Restore as much detail as practical, down to scroll position ([Apple Launching](https://developer.apple.com/design/human-interface-guidelines/launching)). Keep a form's data when a save fails ([Primer saving](https://primer.style/product/ui-patterns/saving/)).

**Cases**
- A shared link that loses its filters → [filtering: filters in the address](../patterns/filtering.md#filters-in-the-address).
- Reloading a page resets it to the first tab → the tab belongs in the address ([GOV.UK tabs](https://design-system.service.gov.uk/components/tabs/) update the fragment so Back returns to the previous tab).
- Typing in search creates a history entry per keystroke → [search: the query in the address](../patterns/search.md#the-query-in-the-address).
- A parameter is renamed from `area` to `category` in a release → accept the old name and rewrite it; links in tickets and chats depend on it.
- A filter change swaps the list and focus is lost → keep the reader's place (code-standard rule 14).

**Accessibility.** 2.4.3 Focus Order (A) and code-standard rule 14: after a restore or a live swap, focus is where the reader left it. 3.2.2 On Input (A): a filter that reloads the page or moves focus warns first, or applies on an explicit submit. 4.1.3 Status Messages (AA): the new result count is announced after a filter change.

**Build.**
- Filters, tab, search and sort are query parameters: a GET `form` writes them with no script (code-standard rule 20); a script uses `history.pushState` for a new view and `replaceState` for keystrokes.
- On load, every control is set from the address; after a swap, focus and scroll are restored (code-standard rule 14).
- Detail: [JavaScript: state in the address and history](../../code/javascript.md#state-in-the-address-and-history) and [saving automatically](../../code/javascript.md#saving-automatically).

**Check.** *Script:* could set each filter, tab and sort, reload, and assert the same controls and rows; press Back after a filter change and assert the previous state; load a saved URL and assert it opens the stated view. *Judgement:* which changes count as a new view?

**Sources.** As linked. Baymard found 27% of sites in its benchmark failed the Back expectation for filtering and sorting. Smashing's Friedman (commentary) says the same from practice: "keep the settings of filtering upon refresh, or navigation" ([Designing Filters That Work](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/)).

---

## Trust and provenance

**What good looks like**
- A page built from data names its source and the date of it in a caption under its title (design-standard rule 1).
- The date is computed from the data, never typed into copy.
- When the source has changed since the figures were taken, the page says so.
- What the tool cannot do, and what a model judged rather than a script measured, is labelled.

**How.** Follow design-standard rule 1 for the caption; its form, dates and multiple sources are [data: provenance and freshness](../patterns/data.md#provenance-and-freshness). This section adds what trust needs beyond the caption. When the source has moved on (a design file edited since its snapshot), add that to the caption, which is Polaris's "Be transparent about what features and tools can or can't do" ([experience values](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx)). Label machine-judged output and give a way to see why, following [Carbon for AI](https://carbondesignsystem.com/guidelines/carbon-for-ai/): explanations shown "only when needed or requested", and the AI styling never used as decoration. Decide what counts as stale per source and say it in the caption when it is.

**Cases**
- Source in the lede, a typed date, two sources of different ages → [data: provenance and freshness](../patterns/data.md#provenance-and-freshness).
- The design file has been edited since the snapshot behind a page → add "(the file has been edited since)" to the caption.
- Audit findings come from a script and from a model, mixed in one list → label the model-judged ones and link to the reasoning.

**Accessibility.** 1.3.1 Info and Relationships (A): the caption is associated with the page heading in the markup and the date is machine-readable (`time datetime`). 1.4.1 Use of Color (A): a stale warning is words, not only a colour change.

**Build.**
- The caption is a `p` directly under the `h1`, with the date as `time datetime="…"` computed from the source record, never typed.
- Computing it is model logic, not template logic (code-standard rule 29); a stale or model-judged mark is words, not only a colour.

**Check.** *Script:* could check that every page showing recorded figures renders a provenance caption under its `h1`, that its date matches the source record, and that model-judged findings carry a label. Today the rule is read at review (`tools/toolkit-check/closing.mjs`, design-standard rule 1). *Judgement:* what counts as stale here, and how loud should the warning be?

**Sources.** Polaris and Carbon as linked. No design system checked publishes a rule that a dashboard state when its data was last updated; the caption is practice supported in principle (Polaris transparency, Carbon explainability, NN/g on system status). The toolkit follows design-standard rule 1, which a run on a docs site admitted.

---

## Attention hierarchy across a page

**What good looks like**
- Each screen has one thing it must make obvious, and that thing gets the emphasis.
- One primary action per view.
- Accent and status colours are spent only where they mean something.
- The visual order of emphasis matches the information order.

**How.** Name the one thing per screen (the next piece of work, what got worse, what blocks a release) and give it the only primary emphasis. One primary action per view ([actions: button hierarchy](../patterns/actions.md#button-hierarchy)). Save highlight colour for high-action moments, as Spectrum 2 does ([Adobe, 2023](https://blog.adobe.com/en/publish/2023/12/12/adobe-unveils-spectrum-2-design-system-reimagining-user-experience-over-100-adobe-applications)). Status colours mark status, never decoration (the visual file). Order headings by importance and keep the outline in order. Without a stated rule emphasis inflates, because every stakeholder lobbies for theirs; write the screen's one thing next to its need line.

**Cases**
- An audit dashboard colours every row by severity, badges every card and puts a primary button in each → keep severity as a mark, make one summary ("4 new blockers since the last audit") the emphasis, and one primary action.
- A brand accent colours section headings, links and the main action alike → reserve it for the action.
- Squinting at the page, the eye lands on a decorative illustration → demote it; the most important thing is the most visible (*clear words, clear hierarchy*).

**Accessibility.** 1.4.1 Use of Color (A): emphasis and severity are never colour alone. 1.3.1 (A) and 2.4.6 (AA): the heading outline expresses the hierarchy, code-standard rule 1. Visible focus on the emphasised control is figma-standard rule 31 in the design.

**Build.**
- One primary button variant per view, as an attribute on the button component ([figma handoff: variants to attributes](../../code/figma-handoff.md#variants-to-attributes)).
- Accent and status colours come only from their semantic tokens ([tokens: three tiers](../../code/tokens.md#three-tiers)); the heading outline carries the order (code-standard rule 1).

**Check.** *Script:* could count primary buttons per view, and check accent and status colours come only from their reserved tokens. *Judgement:* what deserves the top of this screen?

**Sources.** Adobe as linked; [NN/g local navigation](https://www.nngroup.com/articles/local-navigation/): "Visual hierarchy should reflect information hierarchy". No Spectrum documentation page was found on attention hierarchy, only the launch post, so this file cites the post.

---

## Notifications and interruptions

**What good looks like**
- Every notification type has an urgency level on a written scale, and is sent at that level.
- Information people can read at leisure lives on the page they visit anyway.
- Permission is asked at the moment the reason is clear, never on first launch by default.
- People can change notification settings inside the product.

**How.** Write a scale of urgency for the product (Apple's four interruption levels run from Passive to Critical) and give each notification type one level ([Apple Managing notifications](https://developer.apple.com/design/human-interface-guidelines/managing-notifications): "Build trust by accurately representing the urgency of each notification"). Default to Passive: show it on the page. Interrupt only for what blocks the reader's work. Get permission before sending any notification, and ask "when people first access the specific function" that needs it ([Apple Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)). Offer settings in the product. Keep to two in-page alerts at a time ([Primer feature onboarding](https://primer.style/product/ui-patterns/feature-onboarding/)). How long a toast stays and how it is dismissed is [feedback: toasts](../patterns/feedback.md#toasts); the notifications centre is [feedback: notifications centre](../patterns/feedback.md#notifications-centre).

**Cases**
- "The audit finished" pops a modal → Passive: update the page and show a status message; no modal.
- A release-blocking change is detected → the one case that justifies a prominent interruption, and it does not auto-dismiss.
- A browser notification prompt appears on first visit → remove it; ask when the reader turns on "notify me when the audit finishes".
- Four banners stack at the top of a page → keep the most urgent two, move the rest to where they belong.
- A reader cannot turn off a digest email from the product → add the setting.

**Accessibility.** 4.1.3 Status Messages (AA): a passive update is announced without taking focus (a [code candidate](../../code/candidates.md)). 2.2.1 Timing Adjustable (A): a message with an action does not vanish before it can be used. 2.2.4 Interruptions (AAA): interruptions can be postponed or suppressed, except emergencies. 1.4.13 Content on Hover or Focus (AA) for anything that appears on hover.

**Build.**
- A passive update is written into a `role="status"` region present from first paint; only a blocking one uses `role="alert"` ([accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).
- A message that interrupts is a `dialog`; one with an action does not dismiss on a timer. The permission request runs only from the user's own action.

**Check.** *Script:* could check that each notification type declares a level, that no permission request fires before the related feature is used, that an in-product setting exists, and that no more than two alerts show at once. *Judgement:* is the level assigned honest?

**Sources.** Apple and Primer as linked.

---

## Help and documentation in the product

**What good looks like**
- Screens are clear enough to need little help; help sits where the question arises.
- Help is searchable, task-shaped, in concrete steps, and short.
- Help that repeats across pages sits in the same place on each.
- Every unfamiliar term and every finding links to an explanation that resolves.

**How.** Aim first for a screen that needs no help, then add contextual "pull" help the reader asks for over messages pushed at everyone ([NN/g heuristic 10](https://www.nngroup.com/articles/help-and-documentation/): help should be "easy to search, focused on the user's task, list concrete steps to be carried out, and not be too large"). Link each finding to what its check means and how to fix it; that is reactive help at the moment of need. Write procedures as numbered steps. Keep the help link, contact or self-help entry in the same place in every template (3.2.6). Treat a heavily used help link as a sign the screen needs fixing (commentary). Stale inline help is worse than none because it is trusted, so help that names a rule or a figure cites it rather than copying it.

**Cases**
- An audit finding says what is wrong and nothing more → link it to a short explanation of the check and the fix.
- A term such as "waiver" appears with no explanation on a dashboard → link it to its definition, or explain it inline once.
- The help link sits in the footer on one template and the header on another → one place on every page (3.2.6).
- A help page is one long essay → split it into task-shaped pages with numbered steps.
- Analytics show most readers open the same help item from one screen → fix the screen.

**Accessibility.** 3.2.6 Consistent Help (A): help mechanisms repeated across pages keep their relative order ([W3C Understanding](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html)); it does not require help, only that help does not move. 3.3.5 Help (AAA): context-sensitive help is available. 2.4.4 Link Purpose (In Context) (A): "Learn more" says about what. 3.3.2 Labels or Instructions (A): instructions come before the field, not only in the error.

**Build.**
- Help is an `a href` with text that names its subject, in the same landmark and order in every template (code-standard rule 3).
- A finding's explanation link points at a stable id that resolves; instructions before a field are `aria-describedby` (code-standard rule 15; [accessibility: accessible names and descriptions](../../code/accessibility.md#accessible-names-and-descriptions)).

**Check.** *Script:* could check that every finding type links to an explanation that resolves, and that the help entry sits in the same order across templates. *Judgement:* could this screen be clear enough to need no help?

**Sources.** NN/g and W3C as linked; Carbon's lifecycle gives "Get help" its own stage ([Universal Experiences](https://carbondesignsystem.com/building-experiences/overview/)).

---

## Performance as UX

**What good looks like**
- Every press is acknowledged at once, even when the result takes longer.
- Fast responses show no loading indicator at all.
- Waits of a few seconds show an indeterminate indicator; longer ones show progress and a way to stop or carry on elsewhere.
- Nothing moves when content arrives.

**How.** The thresholds (instant, about a second, ten seconds) and what each shows are [interaction: response times](interaction.md#response-times-and-perceived-performance); the indicators are [feedback: loading](../patterns/feedback.md#loading). Keep space for what loads late (design-standard rule 2). Across screens, perceived speed is also order: render the primary content first and let secondary sections follow (*Degraded states*).

**Cases**
- An audit takes 40 s → show determinate progress, let the reader leave the page, and notify passively when done (*Notifications*).
- A page waits for every source before showing anything → render the primary section as soon as it is ready.

**Accessibility.** 4.1.3 Status Messages (AA): progress and completion are announced, with `aria-busy` on the region while it loads ([code candidates](../../code/candidates.md)). 2.2.1 Timing Adjustable (A) if anything times out. 2.3.3 Animation from Interactions (AAA) and the reduced-motion form of an indicator (the accessibility file). Focus survives a region swap, code-standard rule 14.

**Build.**
- The region that loads carries `aria-busy="true"` until it settles, and the outcome is written to a status region (code-standard rule 14).
- Late content reserves its space; primary sections are in the first response and secondary ones follow. Detail: [performance: core web vitals](../../code/performance.md#core-web-vitals) and [layout stability in code](../../code/performance.md#layout-stability-in-code).

**Check.** *Script:* could render a page with one slow source and assert the primary section renders before it; the timing checks are [interaction: response times](interaction.md#response-times-and-perceived-performance). *Judgement:* which content is primary and should arrive first?

**Sources.** [NN/g](https://www.nngroup.com/articles/response-times-3-important-limits/) and [Primer loading](https://primer.style/ui-patterns/loading); where sources disagree on the thresholds, [interaction: response times](interaction.md#response-times-and-perceived-performance).
