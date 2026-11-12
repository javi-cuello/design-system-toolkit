# Good design principles

What the strongest published principles agree good design is, how each principle can be tested on a rendered page or a Figma file, and which part of the design standard it governs.

Researched October 2026. Every source listed at the end was opened in this session and each quotation checked against the live page; Apple's principles were read from the page's JSON data (reintroduced 8 June 2026) and Polaris's from its repository's MDX source. Three things could not be opened or confirmed and are left out: Salesforce UX's Medium post on ranking its principles (HTTP 403), Atlassian's old design-values URL (HTTP 404; the values now live on the About page, which is cited instead), and Microsoft's persona spectrum of permanent, temporary and situational disability, which is not on the current Inclusive Design landing page. Practitioner writing, Laws of UX and Friedman among it, is labelled as commentary wherever it appears.

---

## What this answers

Most design systems publish principles that say the same dozen things in different words, which makes them easy to agree with and hard to use. A principle earns its place at the top of a standard only if a reviewer can test a page against it.

The questions, in order:

- What do the strong sources agree good design is?
- How is each principle tested, deterministically where possible?
- Which of the five areas (UX, Interaction, Visual, Content design, Accessibility) does each principle govern?
- Where do the principles pull against each other, and how do strong sources settle it?
- What does good design refuse to do?

Sections 1 to 12 are the principles. Section 13 is the tensions, 14 the refusals, 15 the cheat sheet and 16 the short version.

**A note on the tests.** "Deterministic" means a script can return pass or fail on a rendered page or a Figma file. Otherwise the test is the reviewer's question. A deterministic pass is necessary and never sufficient.

---

## 1. Serve a real need

**The short answer.** Start from what the person is trying to do, with evidence that they are trying to do it. Everything else in this guide is in service of that.

The sources agree on this more than on anything else. GOV.UK's first principle is [Start with user needs](https://www.gov.uk/guidance/government-design-principles): "If you don't know what the user needs are, you won't build the right thing," and it adds that "what they ask for isn't always what they need." Apple's [design principles](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/design-principles.json) open with Purpose: "Design starts with intention. Identify what matters most to the people you're designing for." [Polaris](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx) asks teams to "Respect the reality of this work – don't assume the perfect situation, preparation, or usage."

In the toolkit's documentation sites, dashboards and audit tools, the need is usually a decision: is this component ready, which finding comes first. A page that shows data without answering that question has missed the need.

**Good practice.** Write the need in one sentence before the design. Put it where people meet the work: the page's lede, the component's description, the dashboard's title.

**Pros.** It is the cheapest filter in the guide; it removes features before anyone builds them. **Cons.** It is the hardest to verify, and teams routinely mistake a stakeholder request for a user need.

**How it is tested.** Partly deterministic: every documentation page has a non-empty description, and every published Figma component has a non-empty description field. Otherwise the reviewer's question: *which person, doing what, needs this, and what is the evidence?*

**Governs.** UX first; Content design for where the need is stated.

**Recommendation.** Make a stated need a precondition for any new page, component or dashboard panel, and check the description fields automatically.

---

## 2. As little as possible (simple is not minimal)

**The short answer.** Remove what does not serve the need. Simplicity is about the work the person has to do; a sparse screen that hides what they need is not simple.

Rams's tenth principle is ["Good design is as little design as possible"](https://www.vitsoe.com/us/about/good-design), glossed as "Less, but better – because it concentrates on the essential aspects, and the products are not burdened with non-essentials." The Zen of GitHub, which [Primer](https://primer.style/product/getting-started/) reproduces, says "Anything added dilutes everything else" and "Favor focus over features." Apple draws the line this section's title draws: "Simplicity isn't minimalism. Aim for a focused, useful experience that keeps the important things close by and lets the others fall away." GOV.UK makes the cost explicit in [Do the hard work to make it simple](https://www.gov.uk/guidance/government-design-principles): "Making something look simple is easy. Making something simple to use is much harder."

Tesler's Law (commentary, [Laws of UX](https://lawsofux.com/)) is the warning against minimalism: "for any system there is a certain amount of complexity which cannot be reduced." Complexity removed from the screen moves to the person's memory or to a support ticket.

**Good practice.** Cut options, steps and words before cutting visible affordances. One primary action per view.

**Pros.** Faster decisions, fewer states to build and audit. **Cons.** Over-applied, it hides necessary controls behind menus, which section 5 then has to repair.

**How it is tested.** Deterministic: count primary-emphasis buttons per view (more than one is a finding); count unused component properties and variants in Figma; count fields in a form against the fields the back end requires. Reviewer's question: *what could be removed without the person losing anything they need?*

**Governs.** UX and Visual; Content design for word count.

**Recommendation.** Ask "what can go?" in every review, and treat a hidden essential control as a failure of this principle, not a success.

---

## 3. Consistent, not uniform

**The short answer.** The same problem gets the same solution, so that people learn once. Different problems are allowed different solutions.

GOV.UK named the idea: [Be consistent, not uniform](https://www.gov.uk/guidance/government-design-principles). "We should use the same language and the same design patterns wherever possible," but "This isn't a straitjacket or a rule book. Every circumstance is different." Salesforce's [Lightning Design System](http://spring-20.lightningdesignsystem.com/guidelines/overview/) defines consistency as "applying the same solution to the same problem." Shneiderman's [first rule](https://www.cs.umd.edu/users/ben/goldenrules.html) allows exceptions that are "comprehensible and limited in number." NN/g's fourth heuristic, [Consistency and Standards](https://www.nngroup.com/articles/ten-usability-heuristics/), says "Users should not have to wonder whether different words, situations, or actions mean the same thing."

Tognazzini sharpens it in [First Principles of Interaction Design](https://asktog.com/atc/principles-of-interaction-design/), quoting Bill Buxton: "The most important consistency is consistency with user expectations." He also asks teams to strive for "continuity, not consistency" across releases, so that a system can improve without freezing old mistakes.

**Good practice.** Tokens for every visual value, one component per job, one word per concept.

**Pros.** Learnability and lower build cost. **Cons.** Pursued as uniformity, it forces a pattern onto a problem it does not fit and blocks improvement.

**How it is tested.** Deterministic, and the most testable principle here: share of fills, strokes, spacing and type bound to variables in Figma; detached instances; computed styles on the rendered page that match no token; the same action carrying different labels across pages; WCAG 2.2 [3.2.3 Consistent Navigation and 3.2.4 Consistent Identification](https://www.w3.org/TR/WCAG22/). Reviewer's question for exceptions: *is this a different problem, or the same problem solved differently?*

**Governs.** Visual and Interaction; Content design for terminology.

**Recommendation.** Enforce consistency by script and require a named reason for every exception.

---

## 4. Show state, give feedback

**The short answer.** People should always know what the system is doing and what their last action did.

This is NN/g's first heuristic, [Visibility of System Status](https://www.nngroup.com/articles/ten-usability-heuristics/): "The design should always keep users informed about what is going on." Shneiderman's third rule, [Offer informative feedback](https://www.cs.umd.edu/users/ben/goldenrules.html): "For every user action, there should be an interface feedback," modest for frequent actions and "more substantial" for major ones. Apple: "Give people clear signals about what's happening as they use your app. Show when controls are available, indicate when content changes."

Timing is part of feedback. Tognazzini: "Acknowledge all button clicks by visual or aural feedback within 50 milliseconds," and keep users informed when they face a delay.

**Good practice.** Every interactive component draws its full state set; every asynchronous action has a pending, success and failure state; status changes are announced to assistive technology.

**Pros.** Builds trust and prevents double submission. **Cons.** Over-applied, it becomes noise: toasts for trivial actions train people to ignore toasts.

**How it is tested.** Deterministic: every interactive component set in Figma has hover, focus, pressed and disabled variants where they apply; rendered components change computed style on `:hover`, `:focus-visible` and `:active`; asynchronous regions use `role="status"` or `aria-live` ([WCAG 4.1.3 Status Messages](https://www.w3.org/TR/WCAG22/)). Reviewer's question: *after each action, can the person tell it worked?*

**Governs.** Interaction; Accessibility for announcements.

**Recommendation.** Make the state set part of a component's definition of done and check it in the file and the build.

---

## 5. Discoverable: signifiers, recognition over recall

**The short answer.** People should be able to see what they can do. Make actions and options visible; do not make people remember them.

Norman's essay [Signifiers, not affordances](https://jnd.org/signifiers-not-affordances/) (2008) gives the vocabulary: "what people need, and what design must provide, are signifiers," a signifier being "some signal in the physical or social world that can be interpreted meaningfully." The revised *Design of Everyday Things* added signifiers; the publisher's page notes the science is unchanged "except for the addition of 'signifiers.'" NN/g's sixth heuristic, [Recognition Rather than Recall](https://www.nngroup.com/articles/ten-usability-heuristics/): "Minimize the user's memory load by making elements, actions, and options visible."

**Good practice.** Visible labels on fields, text or a tooltip on icon buttons, links that look like links, no essential action available only on hover.

**Pros.** Lower learning cost; also the foundation for accessible names. **Cons.** Everything visible competes with section 2; the resolution is progressive disclosure that is itself signposted.

**How it is tested.** Deterministic: every interactive element has an accessible name ([WCAG 4.1.2](https://www.w3.org/TR/WCAG22/)); the visible label is contained in the name (2.5.3 Label in Name); no input relies on placeholder text alone; no control appears only on hover. Reviewer's question: *could a first-time user find this without being told?*

**Governs.** Interaction and UX; Accessibility for names.

**Recommendation.** Ban hover-only actions and placeholder-only labels outright, and test accessible names on every build.

---

## 6. People in control, forgive mistakes

**The short answer.** People decide; the system responds. Errors are prevented where possible, explained when they happen, and reversible wherever they can be.

Shneiderman covers this in three rules: [Prevent errors](https://www.cs.umd.edu/users/ben/goldenrules.html), Permit easy reversal of actions ("This feature relieves anxiety... and encourages exploration") and Keep users in control ("Experienced users strongly desire the sense that they are in charge"). NN/g's [Error Prevention heuristic](https://www.nngroup.com/articles/ten-usability-heuristics/) says "the best designs carefully prevent problems from occurring in the first place." Apple's Agency principle: "make it easy to recover from mistakes." Tognazzini: "Ensure that users never lose their work." The [Inclusive Design Principles](https://inclusivedesignprinciples.info/) extend control to settings: do not "suppress or disable the ability to change standard browser and platform settings."

**Good practice.** Undo over confirmation dialogs for reversible actions; confirmation for irreversible ones; errors that name the field and the fix; form input preserved after an error.

**Pros.** Encourages exploration and reduces support load. **Cons.** Undo costs engineering, and confirmations everywhere become nagging (section 14).

**How it is tested.** Deterministic: destructive actions have an undo or a confirmation step; viewport meta does not set `user-scalable=no`; no auto-advancing content without a pause control; [WCAG 3.3.1, 3.3.3, 3.3.4 and 3.3.7](https://www.w3.org/TR/WCAG22/). Reviewer's question: *if the person does the wrong thing here, what does it cost them to get back?*

**Governs.** Interaction and UX; Accessibility for settings and timing.

**Recommendation.** Default to undo, reserve confirmation for what cannot be undone, and never block a platform setting.

---

## 7. Efficient for experienced users

**The short answer.** Make the common path fast for people who do it every day, without making it harder for people doing it once.

NN/g's [Flexibility and Efficiency of Use](https://www.nngroup.com/articles/ten-usability-heuristics/): "Shortcuts — hidden from novice users — may speed up the interaction for the expert user." Polaris's Efficient value: "We value speed and simplicity, but we value productivity even more," with automation and bulk actions named. Primer's [Design for efficiency](https://primer.style/product/getting-started/) aims for "an experience that is fast and compact" and refuses responsive design that reduces "desktop experiences into mobile-first solutions." Tognazzini lists Efficiency of the User and Fitts's Law among his principles.

Dashboards and audit tools have daily users, so this weighs more in the toolkit than on a public site.

**Good practice.** Sensible defaults, keyboard paths for every action, bulk operations, remembered filters, density that suits repeated scanning.

**Pros.** Large cumulative time savings. **Cons.** Expert features add surface; hidden shortcuts help nobody who cannot find them.

**How it is tested.** Deterministic: every action reachable by keyboard ([WCAG 2.1.1](https://www.w3.org/TR/WCAG22/)); focus order follows reading order (2.4.3); count of steps for the top task. Reviewer's question: *what does the hundredth use cost compared with the first?*

**Governs.** Interaction and UX.

**Recommendation.** Measure the top task in steps and keystrokes, and design shortcuts as an addition to a visible path.

---

## 8. For everyone, in any context

**The short answer.** Design for the range of people and situations, with accessibility built in from the start. WCAG 2.2 AA is the floor.

GOV.UK: ["Accessible design is good design,"](https://www.gov.uk/guidance/government-design-principles) and "The people who most need our services are often the people who find them hardest to use." Primer: "Adding accessibility support to a design after the fact generally turns into a difficult retrofit." Apple: "Treat accessibility as a priority from the start." [Microsoft Inclusive Design](https://inclusive.microsoft.design/) offers "Solve for one, extend to many." The [Inclusive Design Principles](https://inclusivedesignprinciples.info/) by Henny Swan, Ian Pouncey, Heydon Pickering and Léonie Watson open with "Provide comparable experience" and "Consider situation." Carbon is built to be "accessible to all, regardless of ability or situation."

**Good practice.** Contrast, target size, keyboard, reflow, reduced motion and forced colours are designed into components, so that every page built from them inherits the result.

**Pros.** Largely automatable at the component level; the benefits extend beyond disabled users. **Cons.** Automated checks catch only part of WCAG, so a clean scan can hide real barriers.

**How it is tested.** Deterministic, the richest set in the guide: text contrast at least 4.5:1 ([WCAG 1.4.3](https://www.w3.org/TR/WCAG22/)), 3:1 for non-text against adjacent colours (1.4.11), targets at least 24 by 24 CSS pixels or spaced (2.5.8), reflow at 320 CSS pixels (1.4.10), text resizable to 200 percent (1.4.4), visible focus (2.4.7), colour not the sole signal (1.4.1). In Figma, contrast pairs and target sizes can be measured on components. Reviewer's question: *who is excluded by this, and in which situation?*

**Governs.** Accessibility first; all four other areas carry its rules.

**Recommendation.** Treat AA as a gate for every component, run the automated checks on every build, and add manual keyboard and screen-reader passes for anything new.

---

## 9. Honest, in the user's interest

**The short answer.** Design acts for the person using it. No tricks that move them against their own interest, and no claim the product cannot keep.

Rams: ["Good design is honest. It does not make a product more innovative, powerful or valuable than it really is."](https://www.vitsoe.com/us/about/good-design) Apple's Responsibility principle: "Act in people's best interest... Earn their trust by prioritizing safety and privacy, and being transparent about what your product does and why." Polaris's Trustworthy value: "Be transparent about what features and tools can or can't do." Spectrum's [principles](https://spectrum.adobe.com/page/principles) put people's needs first. [deceptive.design](https://www.deceptive.design/types) catalogues what honesty refuses: confirmshaming, preselection, hidden costs, hard to cancel, fake urgency, fake scarcity, fake social proof, disguised ads, nagging, obstruction, sneaking, forced action, trick wording, visual interference and comparison prevention.

For an audit toolkit, honesty also means a report that says "clean" ran on everything it claims to cover.

**Good practice.** Defaults that favour the person, cancel paths as short as sign-up paths, neutral wording on decline buttons, reports that state their coverage.

**Pros.** Trust compounds; in several jurisdictions deceptive patterns are also a legal risk. **Cons.** Some patterns, confirmshaming above all, need judgement to detect.

**How it is tested.** Partly deterministic: no consent or marketing checkbox checked by default; cancel or delete reachable in no more steps than create; every audit report states what it scanned. Reviewer's question: *would the person choose this if they understood exactly what it does?*

**Governs.** UX and Content design.

**Recommendation.** Use the deceptive.design list as a review checklist, and make audit outputs state their coverage alongside their verdict.

---

## 10. Clear words and clear hierarchy

**The short answer.** Say what things are and what they do in the person's words, and make the order of importance visible at a glance.

SLDS's first principle is Clarity: ["Eliminate ambiguity. Enable people to see, understand, and act with confidence."](http://spring-20.lightningdesignsystem.com/guidelines/overview/) Apple's Simplicity principle asks you to "Choose exactly the words you need to convey a concept or label a control" and to "Establish hierarchy." The Zen of GitHub: "Mind your words, they are important" and "Speak like a human." The Inclusive Design Principles' "Prioritise content" asks interfaces to "Help users focus on core tasks, features, and information by prioritising them within the content and layout."

**Good practice.** Button labels name the action; headings describe what follows; one type scale from tokens; the most important thing on the page is the most prominent.

**Pros.** Cheap to fix and visible at once. **Cons.** Words need an owner; without content design in the team, labels drift towards internal jargon.

**How it is tested.** Deterministic: one `h1` per page and no skipped heading levels; headings and labels present and descriptive ([WCAG 2.4.6](https://www.w3.org/TR/WCAG22/), 1.3.1); text styles in Figma all from the type scale; no generic link text such as "click here." Reviewer's question: *squinting at the page, does the most important thing stand out, and would a newcomer understand every label?*

**Governs.** Content design and Visual.

**Recommendation.** Keep a project word list, lint for generic labels and heading order, and review hierarchy with a squint test.

---

## 11. Crafted, no decoration without purpose

**The short answer.** Care shows in details: alignment, spacing, edge cases and states. Every visual element should do a job.

Rams: "Good design is thorough down to the last detail" and "Good design is aesthetic." Apple's Craft principle: "Your design is a reflection of how much you care," and, under Delight, "Don't mistake delight for decoration." Polaris: "Delight people with how powerful and effective an experience is, not with extra decoration or flair." SLDS's Beauty is craft in service of the person: "Demonstrate respect for people's time and attention through thoughtful and elegant craftsmanship." NN/g's [Aesthetic and Minimalist Design](https://www.nngroup.com/articles/ten-usability-heuristics/): "Interfaces should not contain information that is irrelevant or rarely needed." The Aesthetic-Usability Effect (commentary, [Laws of UX](https://lawsofux.com/)) is the reason craft matters and also its risk: "Users often perceive aesthetically pleasing design as design that's more usable," whether or not it is.

**Good practice.** Spacing and radii from the scale, text that survives long strings and translation, empty, loading and error states drawn as carefully as the happy path.

**Pros.** Quality is visible and builds confidence in the whole product. **Cons.** Craft without a need is decoration; polish can disguise a usability problem in a review.

**How it is tested.** Deterministic: spacing values off the scale; layers in Figma outside auto layout where siblings use it; groups instead of frames; text that clips at 200 percent or with a long string; decorative images given empty `alt`. Reviewer's question: *what job does this element do, and what breaks if it goes?*

**Governs.** Visual first; Interaction for motion and states.

**Recommendation.** Audit edge cases as part of craft, and ask every decorative element for its job.

---

## 12. Evidence and iteration

**The short answer.** Decisions rest on evidence, designs are tested with real people, and the system keeps improving. Principles without governance are posters.

GOV.UK has two principles for this: [Design with data](https://www.gov.uk/guidance/government-design-principles) ("Let data drive decision-making, not hunches or guesswork") and Iterate. Then iterate again ("Iteration reduces risk. It makes big failures unlikely and turns small failures into lessons"). Apple: "Experiment and iterate" and "Shipping isn't the finish line." Atlassian's [principles](https://atlassian.design/get-started/about-atlassian-design-system) include "Meet system needs before delivering individual features" because "documentation, support, tooling, and maintenance are part of a harmonious experience."

Friedman's [practical guide to design principles](https://www.smashingmagazine.com/2026/04/practical-guide-design-principles/) (commentary) argues good principles "have a point of view, and they explain what we don't do as much as what we do," that "design should not be a matter of taste," and that "Creating principles is only a small portion of the work; most work is about effectively sharing and embedding them."

**Good practice.** Every rule in the standard cites its source and how it is tested; exceptions are named waivers; audits run on a schedule and their trend is visible.

**Pros.** Ends arguments about taste; makes improvement measurable. **Cons.** Measurement favours what is measurable, so judgement-only principles (1, 9) need protected review time.

**How it is tested.** Deterministic at the system level: every rule has a source and a test; every waiver has an owner and a reason; audit records have a recent run date. Reviewer's question: *what evidence supports this decision, and how would we know if it were wrong?*

**Governs.** All five areas, through the standard's governance.

**Recommendation.** Make each principle point to its checks, and review the principles themselves when the evidence moves.

---

## 13. Tensions, and how strong sources resolve them

Principles conflict, and a standard that does not say which wins leaves the argument to whoever is loudest.

**Consistency versus fit.** GOV.UK resolves it in its own title: consistent, not uniform, and "when this isn't possible we should make sure our approach is consistent." Fluent 2 reuses "native platform components and patterns 80% of the time," keeping the rest for signature experiences. Tognazzini prefers continuity over consistency across releases. *Resolution:* the same problem gets the same pattern; a different problem may get a different one, named and documented.

**Simplicity versus power.** Polaris: "Hide complexity where you can, but give people access to more sophistication if they need it," and "Optimize for the most important tasks without blocking people from doing the rest." The Zen of GitHub: "Approachable is better than simple." *Resolution:* progressive disclosure, with the deeper level signposted.

**Beauty versus clarity.** GOV.UK: "If we have to sacrifice elegance - so be it." SLDS lists Clarity first and Beauty fourth, and defines beauty as respect for time and attention. *Resolution:* clarity wins; beauty is the way clarity is delivered.

**Deference versus brand.** Rams asks for design that is "neutral and restrained, to leave room for the user's self-expression"; Apple says "Stay out of the way." Fluent 2 balances it with Unmistakably Microsoft and "A little personality goes a long way." *Resolution:* brand lives in signature moments; content and controls defer.

**Efficiency versus accessibility.** Primer seeks "accessible solutions that don't dilute efficient UI interactions." WCAG's 24-pixel target minimum allows smaller targets when they are spaced, which leaves room for dense tools. *Resolution:* accessibility is the floor and is not traded; density is achieved within it.

**Freedom versus guardrails.** Polaris: "Use friction to highlight important decisions, then let users get back to work." Apple: "When a guided flow is necessary, make it easy to skip or escape." *Resolution:* friction proportional to consequence, and an exit from every guided path.

**Responsive versus fast.** The Zen of GitHub holds both "Responsive is better than fast" and "It's not fully shipped until it's fast," plus "Non-blocking is better than blocking." GitHub does not gloss them. Read alongside Tognazzini's advice to acknowledge clicks within 50 milliseconds and push latency into the background, one reasonable reading (commentary) is that immediate acknowledgement matters more than total time, and total time still matters. *Resolution:* acknowledge at once, never block the person, then make it fast.

---

## 14. What good design refuses

Friedman's point that principles should say what a team does not do is worth taking literally. Each refusal below breaks a named principle and most are checkable.

| Refusal | Breaks | Signal |
|---|---|---|
| Decoration with no job | 2, 11 | Reviewer asks the element's job |
| Colour as the only signal of state | 8 | WCAG 1.4.1 check |
| Placeholder text as the only label | 5, 8 | No visible label on an input |
| Actions available only on hover | 5 | Control absent without hover |
| Disabling zoom or platform settings | 6, 8 | `user-scalable=no` in viewport meta |
| Preselected consent, confirmshaming, hard to cancel | 9 | deceptive.design checklist |
| Inventing a pattern for a solved problem | 3 | New component duplicates an existing one |
| Confirmation dialogs for reversible actions | 6 | Confirm where undo was possible |
| A feature with no stated need | 1 | Empty description |
| A clean report from a partial scan | 9, 12 | Report states no coverage |
| Half-built states (no error, empty or loading) | 4, 11 | Missing variants; "Half measures are as bad as nothing at all" |

---

## 15. Cheat sheet

| # | Principle | Deterministic signal | Reviewer's question | Areas |
|---|---|---|---|---|
| 1 | Serve a real need | Description present on page and component | Who needs this, with what evidence? | UX, Content |
| 2 | As little as possible | One primary action per view; no unused properties | What can go? | UX, Visual |
| 3 | Consistent, not uniform | Token binding rate; off-token computed styles; 3.2.3, 3.2.4 | Same problem or different? | Visual, Interaction, Content |
| 4 | Show state, give feedback | Full state variants; `role="status"`; 4.1.3 | Can they tell it worked? | Interaction, Accessibility |
| 5 | Discoverable | Accessible names; 2.5.3; no hover-only or placeholder-only | Could a newcomer find it? | Interaction, UX |
| 6 | Control, forgive mistakes | Undo or confirm on destructive actions; zoom allowed; 3.3.x | What does a mistake cost? | Interaction, UX |
| 7 | Efficient for experts | Keyboard reachable (2.1.1); focus order (2.4.3) | What does the hundredth use cost? | Interaction, UX |
| 8 | For everyone | 1.4.3, 1.4.11, 2.5.8, 1.4.10, 1.4.4, 2.4.7 | Who is excluded, and where? | Accessibility |
| 9 | Honest | No preselected consent; cancel no deeper than sign-up; reports state coverage | Would they choose this knowingly? | UX, Content |
| 10 | Clear words, clear hierarchy | One `h1`; heading order; type-scale styles only; 2.4.6 | Does the main thing stand out? | Content, Visual |
| 11 | Crafted, purposeful | Off-scale spacing; clipping at 200 percent; groups in Figma | What job does this do? | Visual, Interaction |
| 12 | Evidence and iteration | Every rule has a source and a test; waivers owned; recent audit | How would we know it is wrong? | All |

---

## 16. The short version

Serve a real need, with evidence. Use as little as possible, remembering that simplicity is measured in the person's effort. Solve the same problem the same way. Answer every action and show state. Make actions visible. Keep people in control and make mistakes reversible. Make the daily path fast. Design for everyone, with WCAG 2.2 AA as the floor. Act in the person's interest. Say things plainly and make importance visible. Give every element a job. Decide on evidence and keep improving.

Most of these can be partly checked by script on a rendered page or a Figma file: token binding, state variants, accessible names, contrast, target size, heading order, keyboard reach. Need and honesty cannot, so they need protected time in review.

When principles conflict, accessibility is not traded, clarity beats beauty, complexity is disclosed progressively, friction matches consequence, and the system acknowledges at once and never blocks.

**When something looks wrong, this is usually why.** A tidy screen nobody can use confused minimal with simple (section 2). A component that differs on every page has drifted off its tokens (section 3). A button that seems dead has no pending state (section 4). An unexplained icon has no label (section 5). A green dashboard over real problems is reporting a verdict without its coverage (section 9).

---

## Sources

**Primary: foundational principles**

- [Vitsœ, Dieter Rams: ten principles for good design](https://www.vitsoe.com/us/about/good-design). The ten principles and their glosses.
- [Don Norman, Signifiers, not affordances](https://jnd.org/signifiers-not-affordances/) (2008). The definition of a signifier.
- [Don Norman, *The Design of Everyday Things*, revised and expanded edition](https://jnd.org/the-design-of-everyday-things-revised-and-expanded/). Contents, and the note that signifiers were the addition.
- [Ben Shneiderman, The Eight Golden Rules of Interface Design](https://www.cs.umd.edu/users/ben/goldenrules.html).
- [Nielsen Norman Group, 10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/) (1994, reviewed January 2024).
- [Bruce Tognazzini, First Principles of Interaction Design (Revised and Expanded)](https://asktog.com/atc/principles-of-interaction-design/) (2014).
- [W3C, Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/). Success criteria cited in the tests.

**Primary: design systems**

- [GOV.UK, Government Design Principles](https://www.gov.uk/guidance/government-design-principles).
- [Apple, Human Interface Guidelines: design principles (JSON data)](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/design-principles.json). Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight.
- [Microsoft, Fluent 2 design principles](https://fluent2.microsoft.design/design-principles).
- [IBM, What is Carbon](https://carbondesignsystem.com/all-about-carbon/what-is-carbon/). Guiding principles.
- [Atlassian, About the Atlassian Design System](https://atlassian.design/get-started/about-atlassian-design-system). Values and principles.
- [Shopify Polaris, Shopify experience values (MDX source)](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx).
- [Adobe Spectrum, Principles](https://spectrum.adobe.com/page/principles).
- [GitHub Primer, Getting started](https://primer.style/product/getting-started/). Primer's principles and the Zen of GitHub aphorisms.
- [Salesforce Lightning Design System, Spring '20 design guidelines](http://spring-20.lightningdesignsystem.com/guidelines/overview/).

**Primary: inclusion and ethics**

- [Inclusive Design Principles](https://inclusivedesignprinciples.info/) (Swan, Pouncey, Pickering, Watson).
- [Microsoft Inclusive Design](https://inclusive.microsoft.design/).
- [deceptive.design, Types of deceptive pattern](https://www.deceptive.design/types).
- [Amber Case, Calm Technology principles](https://calmtech.com/). Consulted; "The right amount of technology is the minimum needed to solve the problem" supports section 2.

**Commentary**

- [Laws of UX](https://lawsofux.com/) (Jon Yablonski). Tesler's, Jakob's, Fitts's, Doherty Threshold, Aesthetic-Usability Effect.
- [Vitaly Friedman, A Practical Guide To Design Principles, Smashing Magazine, April 2026](https://www.smashingmagazine.com/2026/04/practical-guide-design-principles/).
