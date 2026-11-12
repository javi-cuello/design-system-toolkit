# UX design principles for a design-system toolkit

What a screen is for and why it is shaped that way: the decisions above interaction, across screens, for documentation sites, dashboards and tools built in Figma and in code.

Researched October 2026. Every URL in this guide was opened during this research and the claim checked against the page as it stands. Apple's Human Interface Guidelines pages render in JavaScript, so they were read from the JSON documents the pages themselves load. Polaris's experience-values page now redirects to shopify.dev, so its text was read from the source file in Shopify's archived Polaris repository. Five starting leads did not survive checking and are not used: an eBay limit on the number of tabs (the Playbook page returns 404, and eBay's MIND Patterns sets a minimum of two tabs but no maximum); a GOV.UK design principle about the "whole problem" (the phrase is in Service Standard point 2, not the design principles, and is cited there); an Adobe Spectrum documentation page on attention hierarchy (none found; the term is sourced to Adobe's Spectrum 2 launch post); Carbon's "Building experiences" at its old address (it now lives under `/building-experiences/`); and a 2021 Smashing article titled "broken filters" (it exists as "Designing Filters That Work" at a different URL). Practitioner writing is labelled as commentary. The toolkit's docs-site decisions of 11 October 2026 are taken from that day's commit messages and source.

---

## What this answers

Interaction design is about the moment: what a control does when pressed, how long feedback takes, when a dialog opens. That has its own guide. This one is about the screen and the journey: what a page is for, what it asks, what it shows first, what it remembers, and what it admits it does not know.

A toolkit that builds and audits documentation sites and dashboards makes these decisions constantly, usually without naming them. Which screen gets tabs. Where the filters go. Whether an overview says when its figures were measured. What a library page shows before anyone has run an audit. Each has evidence behind one answer more than the others.

The questions, in order:

- Where does a design start, and what is the whole problem? (1–2)
- How should screens be organised, and what are tabs for? (3)
- What does consistency mean in practice? (4)
- What should a screen ask, choose and show at first? (5–7)
- How should flows, first runs and empty screens behave? (8–10)
- What should a screen remember, and how does it earn trust in its numbers? (11–13)
- What gets attention, when may a product interrupt, and where does help go? (14–16)
- How should filtering and search work as a journey? (17)

Each section says what can be checked deterministically and what needs a reviewer. Sections 18 and 19 are the cheat sheet and the short version.

---

## 1. Start from user needs

**The short answer.** Know who the screen is for and what they are trying to get done before drawing it. Write the need in the user's words and let every later decision trace back to it.

GOV.UK's first design principle is [Start with user needs](https://www.gov.uk/guidance/government-design-principles): "Service design starts with identifying user needs." It is blunt about the cost of skipping it: "If you don't know what the user needs are, you won't build the right thing," and "what they ask for isn't always what they need." The [Service Manual](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs) gives the format: write needs "from a personal perspective using words that users would recognise and use themselves," as "I need/want/expect to…" followed by "So that…". Needs are high-level and stable; user stories are specific, carry acceptance criteria, and trace back to the needs they meet.

Polaris says the same in its [experience values](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx), under "Considerate": "Respect the reality of this work – don't assume the perfect situation, preparation, or usage."

**In a toolkit.** A designer opening an audit wants to know what to fix next. An engineer opening a component page wants to know whether the code matches Figma. A lead opening the overview wants to know whether the library is improving. Three needs want three first screens; a page that answers all three equally answers none well.

**Pros and cons.** Needs give every later argument a referee: "should this card be here?" becomes "which need does it serve?" The cost is research time an internal tool rarely gets. The honest substitute is watching two or three real users do the task once. It is not a study, but it beats an imagined user.

**Checkable or judgement.** Deterministic: each template has a stated purpose in its source or spec, and its title names its subject. Judgement: whether the need is real and the page serves it.

**Recommendation.** Write one "I need to… so that…" line per screen type, and refuse a card, tab or column that cannot point at one.

---

## 2. Lifecycle and the whole journey

**The short answer.** People meet a product many times for different reasons. Design for the moment each screen serves, and design the journey across tools, not the page inside one.

Carbon's [Universal Experiences](https://carbondesignsystem.com/building-experiences/overview/) names "the nine stages users move through as they learn about, adopt, and grow with IBM products": Discover, Learn, Try, Buy, Onboard, Use, Get help, Expand and End use. "Each experience reflects what users are thinking, feeling, and trying to accomplish at that moment," and the framework exists to give "cross‑functional teams a shared language for understanding what users need at each moment."

GOV.UK names the scope. [Service Standard point 2](https://www.gov.uk/service-manual/service-standard/point-2-solve-a-whole-problem) asks teams to "Work towards creating a service that solves a whole problem for users," because "Services that do not work well with other related services make it hard for users to do what they need to." It carries two cautions: "we should be careful not to build big, complicated services that are not intuitive to use," and "it does not mean trying to fix everything at once." Increments should bring related things "into a journey that makes sense to users, irrespective of which department or team they 'belong' to."

**In a toolkit.** Users pass through first contact (a project gets a docs site), onboarding (first snapshot, first audit), routine use, getting help (what does this finding mean?) and expansion (adding code parity, a second library). The common gap is between tools: an audit finding that names a component should link to that component's page, and the page back to its findings. If the reader must know which tool produced a fact to find it, the journey has been cut along the toolkit's seams rather than the user's.

**Pros and cons.** Stage thinking catches screens designed only for routine use that fail on first contact. But Carbon's nine stages are written for a commercial product; for an internal toolkit, Discover, Buy and End use mostly collapse. Treat them as a checklist of moments, not a template.

**Checkable or judgement.** Deterministic: where two pages describe the same object, a link between them resolves; no page is unreachable from navigation. Judgement: which stages a screen must serve.

**Recommendation.** Map each screen to a stage your users actually pass through, and treat any object that appears in two tools without a link between them as a bug.

---

## 3. Information architecture, navigation and tabs

**The short answer.** Navigation shows where you are and what is nearby, in that order of prominence. Breadcrumbs show hierarchy, not history. Tabs choose what one screen shows; links move between screens.

**Local navigation.** NN/g's [Page Laubheimer (2021)](https://www.nngroup.com/articles/local-navigation/) defines it as "a type of navigation that is contextual to the user's current location," typically "showing sibling pages within the current category." Two rules matter for a docs sidebar: "Local navigation should not be more salient than the global navigation," and "Visual hierarchy should reflect information hierarchy."

**Breadcrumbs.** NN/g's [breadcrumb guidelines](https://www.nngroup.com/articles/breadcrumbs/) say they "are intended to show the hierarchical structure of the site," not the user's path, which is the Back button's job. They "augment but do not replace" main navigation, and "The last breadcrumb (denoting the current page) should not be a link."

**Mega menus** suit many destinations. NN/g's [Nielsen and Li (2017)](https://www.nngroup.com/articles/mega-menus-work-well/) call them "an excellent design choice for accommodating a large number of options," with the rules "Show each choice only once" and keep search out of the menu, since it "should be continuously visible on the page." A toolkit's docs site rarely needs one; a sidebar does the job.

**Primer sorts navigation by whether the URL changes.** In [Primer's navigation pattern](https://primer.style/product/ui-patterns/navigation/), breadcrumbs and NavList change the URL; UnderlineNav is for when "activating a tab changes the URL"; UnderlinePanels is for when a tab "changes the content in the same page or context." The two must not be mixed in one tab set. eBay draws the same line: tabs update a panel "without a full page reload," and anything that loads a page should be [fake tabs](https://ebay.gitbook.io/mindpatterns/navigation/fake-tabs), "a list of links" styled as tabs with `aria-current` ([MIND Patterns, Tabs](https://ebay.gitbook.io/mindpatterns/disclosure/tabs)).

**What tabs are for.** The systems agree closely:

| System | Use tabs for | Do not use tabs for |
|---|---|---|
| [Atlassian](https://atlassian.design/components/tabs/usage) | "switch between views within the same context"; "independent data that users don't need to see simultaneously" | "navigate to different pages, or states"; "information that users need at the same time, such as filtering data within a single table" |
| [Carbon](https://carbondesignsystem.com/components/tabs/usage/) | grouping related information "to help reduce cognitive load" | comparing across groups; step-by-step processes; the same content filtered or reformatted (use a content switcher) |
| [GOV.UK](https://design-system.service.gov.uk/components/tabs/) | content "usefully separated into clearly labelled sections," where "the first section is more relevant than the others for most users" | reading in order; comparing across tabs; page navigation |

Atlassian adds a placement rule: "Use headings or information related to all tabs above the tab line," and "Don't use information that applies to all tabs underneath the tab line." On count, Atlassian says "keep the number of tabs low wherever possible"; Carbon says "Use eight grid aware tabs or less" at large breakpoints. No system found sets a hard global maximum. GOV.UK is candid: "This component has not yet been tried in research with users," and advises "Test your content without tabs first."

**Worked example: the docs site, 11 October 2026.** The site settled on "Tabs pick what a screen looks at": on Audits and Changes, tabs choose which library file the screen is about, and one filter bar sits under them for that file's rows. Segmented buttons stay for two-value choices and short facets.

The sources support it. Each file is independent data not needed simultaneously, which is Atlassian's case for tabs exactly. Filtering rows inside one table, which Atlassian forbids for tabs, stays with the filter bar. And the bar sits under the tabs because its filters apply to the chosen file, as Atlassian's placement rule asks. One point to add: Primer and eBay both say URL-changing tabs are links. If the file is in the address, build the tabs as navigation with `aria-current`, not as an ARIA tab panel.

**Pros and cons.** Clear tab rules prevent the commonest dashboard IA failure, tabs used as a second navigation bar or as a filter. But tabs hide content; GOV.UK warns "not everyone will notice them or understand how they work," which is why the first tab must be the one most people want.

**Checkable or judgement.** Deterministic: the current page carries `aria-current` and its breadcrumb is not a link; no tab set mixes URL-changing and panel-only tabs; tab count within a stated limit; local navigation not styled louder than global. Judgement: the grouping, whether content belongs in tabs, and which tab comes first.

**Recommendation.** Use tabs only to choose which independent thing a screen is about, put what applies to all tabs above them and what applies to the chosen one below, and build URL-changing tabs as links.

---

## 4. Consistency and standards

**The short answer.** The same thing should look and behave the same everywhere, and match what people know from elsewhere. Variation is allowed where the problem genuinely differs.

NN/g's [heuristic 4](https://www.nngroup.com/articles/consistency-and-standards/) (Rachel Krause, 2021): "Users should not have to wonder whether different words, situations, or actions mean the same thing." Internal consistency is "within a product or a family of products"; external consistency is "established conventions in an industry or on the web at large," resting on Jakob's Law: "people spend most of their time on sites other than yours."

The systems phrase it differently, and the differences matter:

- **Salesforce Lightning:** "Create familiarity and strengthen intuition by applying the same solution to the same problem" ([SLDS guidelines, Winter '20 archive](http://winter-20.lightningdesignsystem.com/guidelines/overview/); the current site did not render its text).
- **GOV.UK**, under [Be consistent, not uniform](https://www.gov.uk/guidance/government-design-principles): "We should use the same language and the same design patterns wherever possible," but "This isn't a straitjacket or a rule book. Every circumstance is different."
- **Polaris**, "Familiar": experiences should "act the same way, and fit together seamlessly"; and under "Trustworthy": "Fix small mistakes and inconsistencies that erode trust" ([experience values](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx)).

"Same solution to the same problem" is the useful test. Two screens that look different are fine if they solve different problems; two that solve the same problem differently are the defect.

**In a toolkit.** The 11 October docs-site changes were largely consistency work: one filter bar on every screen, filters left and search right, one modal shape. One shows the cost precisely. A tokens file's header was shorter than a components file's, so switching file tabs moved the page by 62 pixels. Neither screen was wrong alone; the inconsistency only existed in the journey.

**Pros and cons.** Consistency compounds, each screen teaching the next, and it is the most automatable principle here. Pushed too far it forces a pattern onto a problem it does not fit, which "not uniform" guards against.

**Checkable or judgement.** Deterministic: one component per job (one modal, one filter bar); one spelling per label; landmark positions and heights equal across sibling screens (a measured header height per template catches the 62-pixel jump); system components used where one exists. Judgement: whether two problems are really the same.

**Recommendation.** Put "same problem, same solution" in the review checklist, measure the landmarks that must not move between sibling screens, and require a stated reason for each departure.

---

## 5. Recognition over recall, and asking once

**The short answer.** Show options instead of making people remember or retype. Never ask for what the system already has, and never ask twice in one journey.

GOV.UK's [question pages](https://design-system.service.gov.uk/patterns/question-pages/): "only ask for a piece of information once within a single journey," and "Whenever possible, do not ask a user to re-enter information they've already provided." For repeats it suggests "pre-populating the relevant fields" or "showing carried-forward responses as an option for the user to select," and asks teams to "only ask users for information you really need."

WCAG 2.2 made part of this conformance. [SC 3.3.7 Redundant Entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html), Level A, requires information "previously entered by or provided to the user that is required to be entered again in the same process" to be "auto-populated, or" "available for the user to select," unless re-entry "is essential," serves security, or the earlier information "is no longer valid."

Apple's [Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data) goes upstream: "Get information from the system whenever possible. Don't ask people to enter information that you can gather automatically." And on recognition: "When possible, offer choices instead of requiring text entry."

**In a toolkit.** The risk is in setup and configuration. A project's context document already holds its language, library files and code target; any tool that asks for them again breaks the principle. In the interface, a filter menu listing the components is recognition; a text box needing a component's exact name is recall.

**Pros and cons.** Fewer errors and less effort, with a Level A criterion met by design. The risk is stale pre-filled data, which is why 3.3.7 exempts information "no longer valid"; carried-forward answers need a visible way to change them.

**Checkable or judgement.** Deterministic: walking a flow, any value collected earlier is pre-filled or selectable; tools do not re-request settings the project context holds. Judgement: whether a question is needed, and whether a list or free text fits.

**Recommendation.** Read from the system or the project's context first, ask once if you must, and offer a choice wherever the set of answers is known.

---

## 6. Defaults

**The short answer.** Most people never change a default, so the default is the design. Pick what serves most people, never what serves the product at their expense.

NN/g's [The Power of Defaults](https://www.nngroup.com/articles/the-power-of-defaults/) (Jakob Nielsen, 2005) is old but still the reference: people "rarely utilize fancy customization features," so where you can predict it, "pre-populate fields with the most common value." Choose by user need, not alphabetical order, and never to push sales: "If you consistently pick the most expensive option as the default, you'll lose credibility."

Apple's [Settings](https://developer.apple.com/design/human-interface-guidelines/settings): "Aim to provide default settings that give the best experience to the largest number of people," and "Minimize the number of settings you offer." It also says where options belong: "showing or hiding parts of the current view, reordering a collection of items, or filtering a list" should sit "in the screens they affect," because a separate settings area "disconnects it from its context."

**In a toolkit.** Every filter bar's resting state is what most visitors see: "All" first, the most useful tab first, the commonest sort. Carbon adds that "Clearing filters returns the filters to their original default starting state" ([Carbon filtering](https://carbondesignsystem.com/building-blocks/core/patterns/filtering/)), so the default is also the reset target.

**Pros and cons.** A good default removes a decision for most and shows the rest a typical value. It can also hide a choice people should make consciously; Apple draws one hard line: "Never prepopulate a password field."

**Checkable or judgement.** Deterministic: every filter, tab set and sort declares a default; clear returns exactly to it; view-specific options live on that view. Judgement: whether the default is right.

**Recommendation.** Declare a default for every control, choose it from what most users need, and make "clear" return to it.

---

## 7. Progressive disclosure

**The short answer.** Common things first, the rest one step away. One step, not three.

NN/g's [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) (Jakob Nielsen, 2006) defers "advanced or rarely used features to a secondary screen," and sets two requirements. The split: "You must get the right split between initial and secondary features," decided from task analysis and frequency of use. The depth: "designs that go beyond 2 disclosure levels typically have low usability." Its staged variant, the wizard, works when steps barely interact and fails when users must move between interdependent steps.

Primer's [pattern](https://primer.style/product/ui-patterns/progressive-disclosure/) adds restraint: disclosures "should be used sparingly, only when it's necessary to truncate information," and "Pair progressive disclosure icons with descriptive text to provide context." Polaris puts it as a value: "Hide complexity where you can, but give people access to more sophistication if they need it."

**In a toolkit.** A component page that shows the verdict first (passes, or three findings) with the measurement table behind a disclosure is the pattern done right. An overview card that opens a modal that opens a drawer is three levels and has lost the reader.

**Pros and cons.** First screens stay readable and experts keep depth. But hidden content is content some never find, and a wrong split charges frequent users a click on every visit.

**Checkable or judgement.** Deterministic: no more than two disclosure levels from a page's first view; every trigger has a text label. Judgement: the split, which needs usage evidence.

**Recommendation.** Two levels at most, every trigger labelled, and the split decided from what users open most.

---

## 8. Multi-step flows

**The short answer.** One thing per page, a Back link that works, and a check-your-answers page before anything irreversible. Changing one answer should not mean starting again.

GOV.UK's [question pages](https://design-system.service.gov.uk/patterns/question-pages/) start with one question per page because it "helps users understand what you're asking them to do." Every page has a Back link, reassuring users "that it's possible to go back and change previous answers," and the browser Back button must not break. The [check answers pattern](https://design-system.service.gov.uk/patterns/check-answers/) closes the flow: "Show a single check answers page immediately before the confirmation screen for small to medium-sized transactions." After a Change, "the 'Continue' button should return them to the check answers page," and "They should not need to go through the rest of the transaction again."

**In a toolkit.** The flows are setup (create a project, connect a library, run a first audit) and batch decisions such as accepting parity waivers: list what will be written, let each item be changed, then commit.

**Pros and cons.** Easy to understand, validate and resume, and mistakes are caught before they cost anything. Experts pay more clicks, and GOV.UK advises a check page per section for very large transactions, tested with users.

**Checkable or judgement.** Deterministic: each step has a working Back link and browser Back reaches the previous step; a summary precedes the final write; Change returns to the summary. Judgement: how to split the questions, and whether it should be a flow at all.

**Recommendation.** Build setup and batch decisions as one thing per page with a check-answers summary before any write.

---

## 9. Onboarding and first run

**The short answer.** The best onboarding is a product that needs none. Where it is needed, teach in context, keep it short, make it skippable, and never repeat what was skipped.

Apple's [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding): "Ideally, people can understand your app or game simply by experiencing it, but if onboarding is necessary, design a flow that's fast, fun, and optional." It prefers "a collection of context-specific tips instead of a single onboarding flow" and says "Teach through interactivity." A skipped tutorial should not reappear on later launches but should stay findable, and teams should "Postpone nonessential setup flows."

Carbon's [Onboard stage](https://carbondesignsystem.com/building-experiences/onboard/) defines first login as the moment a user "receives a clear welcome, and is guided toward the first meaningful action," with the principle "Give users a clear next step at every point." It lists a product tour only "(if applicable)."

For features introduced to existing users, two systems set limits. Primer's [feature onboarding](https://primer.style/product/ui-patterns/feature-onboarding/): "Show one teaching bubble at a time," "There should be no more than 2 alerts at a time," and "Respect when a user dismisses a message." Atlassian's [spotlight guidance](https://atlassian.design/components/onboarding/usage): "Ideally, spotlights should only have a single step," tours within 3 to 4 steps, "Offer a dismiss option at every step," and the question most teams skip: "Not every change requires changeboarding, so ask yourself if this message is really necessary or helpful." (The package is marked deprecated in favour of `@atlaskit/spotlight`; the guidance is still published.)

**In a toolkit.** A new project's docs site has no snapshot and no audit. That is the onboarding moment, and empty states (section 10) carry it better than a tour: each empty page says what will appear and the one action that fills it.

**Pros and cons.** Contextual teaching is remembered better and interrupts less. It is harder to build than one flow, and every feature team wants its own bubble, which is why Primer caps them.

**Checkable or judgement.** Deterministic: dismissible at every step; dismissed messages do not return; at most one bubble and two alerts at once; tours of four steps or fewer. Judgement: whether onboarding is needed, and what the first meaningful action is.

**Recommendation.** Let the first run's empty pages do the onboarding, keep any tour to one dismissible step, and ask of every announcement whether it is needed.

---

## 10. Empty states

**The short answer.** An empty screen says why it is empty, what will appear, and the one action that fills it. A blank area looks like a bug, so it is one.

NN/g's [Kate Kaplan (2021)](https://www.nngroup.com/articles/empty-state-interface-design/): "Totally empty states cause confusion about how and whether the system is working." Her three guidelines: use empty states to communicate system status, to provide learning cues, and to provide direct pathways for key tasks.

The systems distinguish kinds of emptiness, and the kind decides the copy:

| Kind | [Carbon](https://carbondesignsystem.com/building-blocks/core/patterns/empty-states/) | [Primer](https://primer.style/product/ui-patterns/empty-states/) | Say |
|---|---|---|---|
| Nothing yet | No data | Not yet used; first-time | What will appear and how to add it |
| Nothing matches | User action, such as a search with no matches | Temporarily empty | Why, and how to widen the search or filters |
| Something failed | Error management | Error | The problem in plain words and a way forward |

Carbon's copy rules: titles as "a positive statement" ("Start by adding data assets" over "You don't have any data assets"); "Explain clearly the next action to populate the space"; errors in "plain language (no codes)" that "precisely indicate the problem, and constructively suggest a solution." Primer adds one primary action, an optional secondary link, and "Error states should not be playful."

**In a toolkit.** All three occur: no audit yet, a filter combination with no rows, a snapshot that failed to load. The 11 October filter work removes much of the second kind at the root by marking options that would lead to an empty list (section 17).

**Pros and cons.** Cheap, and they cover the moments users are most lost. But the three kinds are easy to conflate: a "nothing yet" message on a "nothing matches" screen tells the reader to create something they already have.

**Checkable or judgement.** Deterministic: every list, table and chart has an empty state with a heading, and an action for the first two kinds; no raw codes in error states. Judgement: the copy and the action offered.

**Recommendation.** Give every data-bearing region three empty states, one per kind, each with a heading, a reason and one action.

---

## 11. State persistence and restore

**The short answer.** People should come back to where they were. On the web, the address holds what Back, refresh and a shared link should keep: the tab, the filters, the sort.

Apple's [Launching](https://developer.apple.com/design/human-interface-guidelines/launching): "Restore the previous state when your app restarts so people can continue where they left off," and "Restore granular details of the previous state as much as possible," down to scroll position.

On the web the evidence is about Back. Baymard's [Back button research](https://baymard.com/blog/back-button-expectations) (Christian Holst, 2020) found "users generally perceive each discrete iteration of their filtering as a new view," so "Tapping 'Back' after applying filters should begin removing the applied filters." It recommends `history.pushState()` so "any visual change the user will perceive as a new page is added to their browsing history." In its benchmark 59% of sites failed at least one of four Back expectations, and 27% failed the one for filtering and sorting. Friedman's commentary in Smashing says the same from practice: "keep the settings of filtering upon refresh, or navigation" ([Designing Filters That Work](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/)).

GOV.UK's [tabs](https://design-system.service.gov.uk/components/tabs/) put the tab in the address: "the URL gets updated with a fragment (`#id-of-the-tab`)," so "pressing the browser's 'back' button should navigate back to the previous tab." For unsaved work, Primer's [saving pattern](https://primer.style/product/ui-patterns/saving/) says "If there is an error saving the data, the user's data should be preserved in the form."

**In a toolkit.** On 11 October the docs site put the Audits screen's Component and Area filters "both in the address," which this evidence supports directly: a reviewer can send a link to exactly the rows they mean, and Back undoes the last filter. NN/g's [URL as UI](https://www.nngroup.com/articles/url-as-ui/) (1999) adds durability, "persistent URLs that don't change": a filtered link already sent breaks when a parameter is renamed.

**Pros and cons.** Shareable, bookmarkable, recoverable state at little design cost. Overdone, Back becomes tedious: push only changes the user perceives as a new view, and replace the entry for minor ones such as typing in search. Parameters become a public interface.

**Checkable or judgement.** Deterministic: tab, filters and sort round-trip through the URL; Back after a filter change restores the previous one; parameter names stable across releases. Judgement: which changes count as a new view.

**Recommendation.** Put tab, filters and sort in the address, push history for each perceived view change, and treat parameter names as a stable API.

---

## 12. Trust, transparency and provenance

**The short answer.** A screen that shows figures should say where they come from and how fresh they are, be open about what the tool cannot do, and flag what a machine produced.

Polaris's "Trustworthy" value: "We're genuine and transparent because it shows we're acting in users' best interests," with "Be transparent about what features and tools can or can't do" ([experience values](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx)).

Carbon gives the concrete pattern for machine output. [Carbon for AI](https://carbondesignsystem.com/guidelines/carbon-for-ai/) "is the framework for identifying AI-generated content and delivering explainability in our products." An AI label marks AI presence and opens an explainability popover; explanations are shown "only when needed or requested," and the AI styling must not be used decoratively.

No system checked publishes a general rule that a dashboard must state when its data was last updated. The principle is well supported (Polaris's transparency, Carbon's explainability, NN/g's point in section 10 that a screen must communicate system status), but the freshness caption itself is practice, not a documented standard.

**Worked example: the docs site, 11 October 2026.** Each overview page now carries a caption under its title, "Updated by the snapshot of <date>," or "…and the audit of <date>," naming what writes its figures. Where the Figma file has been edited since the snapshot, it adds "(the file has been edited in Figma since)." The ledes no longer carry provenance, so they can say what the page means.

The sources support the principle, and the "edited since" note is exactly Polaris's "transparent about what features and tools can or can't do." They supply no evidence about wording or placement; that part is the toolkit's own judgement. Audit findings judged by a model rather than a script are machine output in Carbon's sense, and should be labelled with a way to see why.

**Pros and cons.** Provenance turns "is this number right?" into "is this snapshot recent?", which the reader can answer. But captions are easy to ignore and easy to let rot: a date computed from the data is fine, one typed in copy is a future lie.

**Checkable or judgement.** Deterministic: every page with measured figures renders a provenance caption; its date comes from the data; model-judged findings carry a label. Judgement: what counts as stale, and how loud the warning should be.

**Recommendation.** Put a computed "Updated by <source> of <date>" caption under every page title that shows measured figures, say when the source has changed since, and label anything a model judged.

---

## 13. Degraded experiences

**The short answer.** When part of a page fails, keep the rest working, say plainly what is missing, and never make it look as if data is gone.

Primer's [degraded experiences](https://primer.style/product/ui-patterns/degraded-experiences/) is the only design-system guidance found. The aim is that a page "still renders and primary experiences are still available." Its rules: "Don't try to conceal or downplay that something is wrong"; separate primary experiences, "essential for the page to be useful," from secondary ones; replace failed content with an error message and a warning icon; limit pages "to 5 or less outage messages"; for unavailable counts "default to hiding the number"; "Never suppress rendering of the global navigation header"; and "We don't want users to think they've suffered data loss." One rule is counter-intuitive and right: "Never disable an interactive control that is non-functional due to availability issues," because disabled reads as "not allowed," not "not working."

No design system checked publishes offline guidance for web tools; Primer covers service outages, not a lost connection.

**In a toolkit.** Pages assemble a snapshot, an audit record and a parity report. If one is missing, the page should render the others and say which is unavailable. A missing count is hidden, not shown as zero, because zero is a claim.

**Pros and cons.** Partial failure stays partial and trust survives an outage. The cost is a failure design per section; Primer's five-message cap signals when to fall back to an error page.

**Checkable or judgement.** Deterministic: with each source removed in turn, navigation and the remaining sections render; a missing count is absent, not zero; at most five outage messages. Judgement: which sections are primary.

**Recommendation.** Test every page with each source removed, name what is missing, and never show an unknown as zero.

---

## 14. Attention hierarchy

**The short answer.** Decide what matters most on a screen, give it the emphasis, and spend accent colour only there.

Adobe named attention hierarchy one of Spectrum 2's three priorities: "Attention hierarchy, to prioritize specific visual elements," partly by removing extra highlight colour from common controls and saving it for high-action moments ([Spectrum 2 announcement, 2023](https://blog.adobe.com/en/publish/2023/12/12/adobe-unveils-spectrum-2-design-system-reimagining-user-experience-over-100-adobe-applications)). Carbon makes the button version a rule: "Each page should have only one primary button," because "The most important thing is to establish a visual hierarchy between the buttons in your UI" ([Carbon button](https://carbondesignsystem.com/components/button/usage/)). NN/g's "Visual hierarchy should reflect information hierarchy" (section 3) is the same idea for navigation.

**In a toolkit.** On an audit dashboard the thing needing attention is the next piece of work. Severity colour on every row, a coloured badge on every card and a primary button in each compete. The overview should make one or two things stand out: what got worse, and what blocks a release.

**Pros and cons.** Fast scanning and findable urgency. But importance is relative, and stakeholders lobby for emphasis; without a stated rule it inflates.

**Checkable or judgement.** Deterministic: one primary button per view; accent and severity colours only from their reserved tokens; heading levels in order. Judgement: what deserves the top.

**Recommendation.** Name the one thing each screen must make obvious, give it the only primary emphasis, and audit for one primary button per view.

---

## 15. Notifications and permission

**The short answer.** Interrupt only for what people care about, at its real urgency. Ask permission before sending anything, at the moment the reason is clear, and let people change their mind in the product.

Apple's [Managing notifications](https://developer.apple.com/design/human-interface-guidelines/managing-notifications): "You need to get permission before sending any notification." It defines four interruption levels, from Passive ("Information people can view at their leisure") to Critical, and the best practice is "Build trust by accurately representing the urgency of each notification," since "You don't want people to feel that a notification uses a high level of urgency to interrupt them with low-priority information." People must be able to "manage their notification settings within your app." On timing, [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding) says to "present a permission request when people first access the specific function that relies on private data or resources," unless the app cannot work without it.

**In a toolkit.** Most messages ("the audit finished", "the snapshot is stale") are Passive and belong on the page the reader visits anyway. Perhaps only a release-blocking change justifies interrupting. Primer's two-alerts cap (section 9) applies to in-page banners too.

**Pros and cons.** Accurate urgency keeps notifications switched on. Every team thinks its message is urgent, so without a written scale urgency inflates.

**Checkable or judgement.** Deterministic: each notification type declares an urgency level; no permission request before the feature is used; an in-product setting exists. Judgement: the level assigned.

**Recommendation.** Give every notification type a level on a written scale, show information where it lives by default, and ask permission at the moment of use.

---

## 16. Help and documentation

**The short answer.** Aim for screens that need no help, then put help where the question arises: in context, searchable, task-shaped and short.

NN/g's [heuristic 10](https://www.nngroup.com/articles/help-and-documentation/) (Alita Kendrick, 2020): it may be necessary to provide help, and "Any such information should be easy to search, focused on the user's task, list concrete steps to be carried out, and not be too large." It separates proactive help, given "before the user has encountered a problem," from reactive help, and prefers "pull revelations," which "show contextual tips that are relevant to the user's task," over messages pushed regardless of context. Carbon's lifecycle gives Get help its own stage, framed as fixing problems without leaving the product ([Universal Experiences](https://carbondesignsystem.com/building-experiences/overview/)).

**In a toolkit.** Every audit finding is a reactive-help moment. A finding that links to what the check means and how to fix it is help in context; the docs site's per-component definition-of-done dialog is the same pattern. A separate manual is the fallback.

**Pros and cons.** Help at the point of need gets used. It adds text to every screen, and stale inline help is worse than none because it is trusted.

**Checkable or judgement.** Deterministic: every finding type links to an explanation that resolves; procedures use numbered steps. Judgement: whether the screen could be clear enough to need no help.

**Recommendation.** Link every finding and unfamiliar term to a short, task-shaped explanation, and treat a heavily used help link as a sign the screen needs fixing.

---

## 17. Filtering and search as a journey

**The short answer.** Filtering is a conversation, not a form. Show what is applied, let people change one thing without losing their place, never lead them into an empty list unwarned, and keep search visible.

**How filters apply.** Carbon's [filtering pattern](https://carbondesignsystem.com/building-blocks/core/patterns/filtering/) separates batch filters, "applied together at the end of the selection process," from instant ones, which return "results after each individual selection." It puts multiple categories on the left or across the top, says "Multiple categories should never be put within a menu or dropdown," and asks for "a way to clear all applied filters at once." Friedman's commentary argues "having an 'Apply' button along with real-time updates of the content area seems to be working best," and against freezing the interface or auto-scrolling on a single input ([Designing Filters That Work](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/)).

**Showing what is applied.** Baymard's [applied filters research](https://baymard.com/research-articles/how-to-design-applied-filters) found "28% of sites across our UX benchmarks don't display an overview at all," leaving "No obvious and immediate confirmation that filters have been applied," no "quick way to remove filters," and no "context for the product list." Applied filters go above the results or below a horizontal toolbar, each with a clear "x".

**Categories and values.** NN/g's [Kate Moran (2018)](https://www.nngroup.com/articles/filter-categories-values/): categories must "cover the most important aspects," "Users should be able to roughly predict what filter values they'll find," "Unintelligible jargon has no place in filters," and "The filter categories placed higher in the list will receive more attention."

**Unavailable options.** NN/g's [dropdown guidelines](https://www.nngroup.com/articles/drop-down-menus/) (Angie Li, 2017): "Gray out any unavailable options," because "If disabled items are removed, the interface loses spatial consistency and becomes harder to learn." Friedman agrees: "rather than hiding them automatically, we can disable them," and explain why.

**Search.** NN/g's [Search: Visible and Simple](https://www.nngroup.com/articles/search-visible-and-simple/) (2001): a "type-in field and not a link," "available from every page," wide enough "to contain the typical query."

**Worked example: the docs site, 11 October 2026.** One filter bar under the tabs on every screen: facets left, search right, page actions at the end. Facets of up to four choices are segmented buttons in sight; longer ones are menus with "All <things>" first and a count per option. On Audits, Component and Area menus count within each other. Options with nothing to show were first hidden, then the same day disabled instead, citing NN/g and Smashing.

- **Supported:** the bar above the results (Baymard); counts per option (Friedman); disabling rather than hiding (NN/g and Friedman, directly); search as a box (NN/g); "All" first as default and reset (Carbon).
- **Supported with a nuance:** short facets as visible buttons fits Carbon's preference for categories in sight, but Carbon says multiple categories should "never" sit in a menu, which the long facets do. The defence is space, and Carbon allows filters hidden in a menu when needed, provided a closed container shows "the number of filters applied." A facet menu that does not show its current choice when closed falls short of that.
- **Not covered:** a results count near the table. Friedman recommends one; the commits do not mention it.

**Pros and cons.** A consistent bar teaches itself after one screen, and counts plus disabled options stop the commonest dead end. Faceted counts must be recomputed on every change, though, and a wrong count is worse than none; disabled options also need a findable reason.

**Checkable or judgement.** Deterministic: applied filters visible, each removable, plus clear-all; clear returns to default; no unmarked option leads to an empty list; counts match the rows shown; search is a visible input; filters round-trip through the URL. Judgement: which categories, in what order, in sight or in a menu.

**Recommendation.** One filter bar per screen, under the tabs, with applied filters visible and removable, counts on options, unavailable options disabled with a reason, search as a box, and every state in the address.

---

## 18. Cheat sheet

| Design intent | Do this | Not this | Checkable? |
|---|---|---|---|
| Start a screen | One "I need to… so that…" line it serves | A page serving every audience equally | Purpose stated: yes. Need real: judgement |
| Cross-tool journey | Link every object to its page in the other tool | Making readers know which tool owns a fact | Yes |
| Local navigation | Siblings of the current page, quieter than global | A sidebar louder than the top bar | Partly |
| Breadcrumbs | Hierarchy, current page not a link | A history trail | Yes |
| Tabs | Choose which independent thing a screen is about | Tabs as navigation, filter, or for comparison | Mixing, count: yes. Grouping: judgement |
| Filters with tabs | The chosen tab's filters under the tabs | Per-tab filters above the tab line | Yes |
| Consistency | Same problem, same solution; landmarks fixed | Uniformity forced onto different problems | Mostly |
| Asking for data | Read it from the system; ask once; offer choices | Re-asking in one journey (WCAG 3.3.7) | Yes |
| Defaults | Best for most; clear returns to it | Defaults that serve the product | Declared: yes. Right: judgement |
| Disclosure | Two levels at most, labelled triggers | Modal in a drawer in a card | Yes |
| Multi-step flow | One thing per page, check answers | Restarting to fix one answer | Yes |
| Onboarding | Contextual, skippable, not repeated | A forced multi-step tour | Mostly |
| Empty state | Why, what will appear, one action, per kind | A blank region | Presence: yes. Copy: judgement |
| Persistence | Tab, filters, sort in the URL; Back undoes | State lost on refresh or Back | Yes |
| Provenance | Computed "Updated by <source> of <date>" | Figures with no source or age | Yes |
| Partial failure | Render the rest, name what is missing | Zero for unknown; whole-page failure | Yes |
| Attention | One primary action per view, accent reserved | Everything highlighted | Partly |
| Notifications | Declared urgency, permission at use | Urgent-looking trivia | Partly |
| Help | In context, task-shaped, linked from findings | A manual the reader must search | Links: yes |
| Unavailable option | Disabled with a reason | Hidden, or leading to nothing | Yes |
| Search | A visible box on every page | A link to a search page | Yes |

---

## 19. The short version

Start with the need, in the user's words, and let it referee every argument. Design the journey, not the page, and link the tools that describe the same thing.

Navigation shows where you are, quietly; breadcrumbs show hierarchy. Tabs choose which independent thing a screen is about: not a second navigation bar, not a filter. What applies to all tabs goes above them, what applies to the chosen one below. The toolkit's docs site does this and the sources back it; if its tabs change the address, build them as links.

Be consistent where the problem is the same, and measure the landmarks that must not move. Do not ask for what the system knows, and never twice. Pick defaults for most people and make "clear" return to them. Disclose in two levels at most. Flows get one thing per page and a check-answers summary. First runs teach in context, mostly through empty states that say why, what will appear, and the one action that fills them.

Remember state in the address, with Back undoing the last change. Say where figures come from and how old they are: the docs site's "Updated by the snapshot of <date>" caption is sound practice, though no system writes it down as a rule. When part of a page fails, render the rest and never show an unknown as zero.

Give one thing per screen the emphasis, interrupt only at real urgency, and put help where the question arises. Filtering is a journey: visible applied filters, counts, disabled rather than hidden options, search as a box, every state in the URL.

**When something looks wrong, this is usually why.** A page that jumps when you switch tabs has an inconsistent landmark. A view nobody finds is behind a tab. A blank table is a missing empty state. A link that opens the wrong view means state never reached the address. A number nobody trusts has no provenance. And a dashboard where everything is red has no attention hierarchy.

---

## Sources

**Primary: standards and government guidance**

- [GOV.UK, Government design principles](https://www.gov.uk/guidance/government-design-principles). Start with user needs; Be consistent, not uniform.
- [GOV.UK Service Manual, Start by learning user needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs). The "I need… so that…" format; needs versus stories.
- [GOV.UK Service Standard, point 2](https://www.gov.uk/service-manual/service-standard/point-2-solve-a-whole-problem). The whole-problem principle and its cautions.
- [GOV.UK Design System, Question pages](https://design-system.service.gov.uk/patterns/question-pages/), [Check answers](https://design-system.service.gov.uk/patterns/check-answers/) and [Tabs](https://design-system.service.gov.uk/components/tabs/).
- [W3C, Understanding SC 3.3.7 Redundant Entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html).

**Primary: design systems**

- Apple HIG: [Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data), [Settings](https://developer.apple.com/design/human-interface-guidelines/settings), [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding), [Launching](https://developer.apple.com/design/human-interface-guidelines/launching), [Managing notifications](https://developer.apple.com/design/human-interface-guidelines/managing-notifications). Read from the JSON each page loads.
- Carbon: [Universal Experiences](https://carbondesignsystem.com/building-experiences/overview/), [Onboard](https://carbondesignsystem.com/building-experiences/onboard/), [Tabs](https://carbondesignsystem.com/components/tabs/usage/), [Empty states](https://carbondesignsystem.com/building-blocks/core/patterns/empty-states/), [Filtering](https://carbondesignsystem.com/building-blocks/core/patterns/filtering/), [Button](https://carbondesignsystem.com/components/button/usage/), [Carbon for AI](https://carbondesignsystem.com/guidelines/carbon-for-ai/).
- Primer: [Navigation](https://primer.style/product/ui-patterns/navigation/), [Progressive disclosure](https://primer.style/product/ui-patterns/progressive-disclosure/), [Feature onboarding](https://primer.style/product/ui-patterns/feature-onboarding/), [Empty states](https://primer.style/product/ui-patterns/empty-states/), [Saving](https://primer.style/product/ui-patterns/saving/), [Degraded experiences](https://primer.style/product/ui-patterns/degraded-experiences/).
- Atlassian: [Tabs](https://atlassian.design/components/tabs/usage), [Onboarding](https://atlassian.design/components/onboarding/usage) (package deprecated in favour of `@atlaskit/spotlight`).
- eBay MIND Patterns: [Tabs](https://ebay.gitbook.io/mindpatterns/disclosure/tabs), [Fake tabs](https://ebay.gitbook.io/mindpatterns/navigation/fake-tabs).
- [Shopify Polaris, experience values (source, archived repository)](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx).
- [Salesforce Lightning Design System, guidelines (Winter '20)](http://winter-20.lightningdesignsystem.com/guidelines/overview/).
- [Adobe, Spectrum 2 announcement (December 2023)](https://blog.adobe.com/en/publish/2023/12/12/adobe-unveils-spectrum-2-design-system-reimagining-user-experience-over-100-adobe-applications).

**Research organisations**

- NN/g: [Local navigation](https://www.nngroup.com/articles/local-navigation/) (2021), [Breadcrumbs](https://www.nngroup.com/articles/breadcrumbs/) (2018, reviewed 2026), [Mega menus](https://www.nngroup.com/articles/mega-menus-work-well/) (2017), [Consistency and standards](https://www.nngroup.com/articles/consistency-and-standards/) (2021), [The power of defaults](https://www.nngroup.com/articles/the-power-of-defaults/) (2005), [Progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) (2006), [Empty states](https://www.nngroup.com/articles/empty-state-interface-design/) (2021), [Help and documentation](https://www.nngroup.com/articles/help-and-documentation/) (2020), [Filter categories and values](https://www.nngroup.com/articles/filter-categories-values/) (2018), [Dropdowns](https://www.nngroup.com/articles/drop-down-menus/) (2017), [Search: visible and simple](https://www.nngroup.com/articles/search-visible-and-simple/) (2001), [URL as UI](https://www.nngroup.com/articles/url-as-ui/) (1999).
- Baymard Institute: [Applied filters](https://baymard.com/research-articles/how-to-design-applied-filters) (updated May 2026), [Back button expectations](https://baymard.com/blog/back-button-expectations) (2020).

**Commentary, labelled as such in the text**

- [Vitaly Friedman, *Designing Filters That Work*, Smashing Magazine, July 2021](https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/).

**Toolkit decisions used as worked examples**

- Toolkit commits of 11 October 2026: `faff0407` (one filter bar; tabs pick what a screen looks at; the "Updated by" caption), `95e7f257` (filters left, search right; Audits filters in the address), `cbabdcc9` (faceted counts), `c99069f5` (up to four choices as buttons), `053758d4` (disable rather than hide); caption wording from `tools/docs/src/components/UpdatedBy.astro`.

**Looked for and not used**

- An eBay limit on the number of tabs: the Playbook page returns 404; MIND Patterns states only a minimum of two.
- A dedicated Spectrum documentation page on attention hierarchy: none found.
- A design-system rule that dashboards state data freshness: none found; section 12 treats it as practice supported in principle.
- Design-system guidance on offline behaviour for web tools: none found; section 13 covers service outages only.
