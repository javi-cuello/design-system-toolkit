# When design principles conflict

Why a list of design principles is only useful once it says which principle loses, what it refuses, and how a reviewer would know.

Researched October 2026 from the primary sources listed at the end: Rams via Vitsœ, Norman, Shneiderman, Nielsen Norman Group, Tognazzini, WCAG 2.2, and the published principles of GOV.UK, Apple, Fluent 2, Carbon, Atlassian, Polaris, Spectrum, Primer and Salesforce Lightning. Apple's principles were read from the page's JSON data and Polaris's from its repository's MDX source, because neither renders to a fetcher. Re-checked in November 2026: GOV.UK's principles (last updated 2 April 2025; the quotations below still stand), Fluent 2's four principles and its "80% of the time" line, and Primer's getting-started page, which still carries the Zen of GitHub aphorisms quoted here. Left out because they could not be confirmed: Salesforce UX's post on ranking principles (HTTP 403), Atlassian's old design-values URL (HTTP 404), and Microsoft's persona spectrum, no longer on the Inclusive Design landing page. Laws of UX and Friedman are commentary and are labelled as such.

This piece grew out of a broader survey of good design principles; the principle list itself now lives in the toolkit's design standard (`~/Projects/toolkit/standards/design-standard.md#principles`), which this article argues around rather than repeats.

---

## What this answers

Read twenty published principle sets and they say the same dozen things: serve a need, keep it simple, be consistent, show state, make things discoverable, forgive mistakes, be efficient, include everyone, be honest, be clear, take care. The agreement is real, which is why it is useless on its own. Nobody argues for inconsistent, dishonest design, so a principle nobody would reject settles no argument.

The argument here is that principles do their work in three places the posters leave out:

- Where two principles pull against each other, which one wins (sections 1 and 2).
- What a principle refuses, stated as something a reviewer can point at (section 3).
- How a reviewer tests a page against it, by script where possible and by a named question where not (section 4).

---

## 1. Agreement is cheap; ranking is the work

**The short answer.** A principle set earns its place when it can decide a disagreement. That means saying, ahead of time, which principle gives way.

Vitaly Friedman's practical guide (commentary, [Smashing Magazine, April 2026](https://www.smashingmagazine.com/2026/04/practical-guide-design-principles/)) puts it plainly: good principles "have a point of view, and they explain what we don't do as much as what we do," and "design should not be a matter of taste." He adds the part teams skip: "Creating principles is only a small portion of the work; most work is about effectively sharing and embedding them."

Some systems rank in their own structure. Salesforce Lightning lists Clarity first and Beauty fourth, and defines beauty as "respect for people's time and attention through thoughtful and elegant craftsmanship" ([SLDS, Spring '20](http://spring-20.lightningdesignsystem.com/guidelines/overview/)), which makes beauty a way of delivering clarity rather than a rival to it. GOV.UK writes the ranking into a sentence: "If we have to sacrifice elegance - so be it" ([Government Design Principles](https://www.gov.uk/guidance/government-design-principles)).

Most do not rank at all. That leaves the decision to whoever is loudest in the review, which is the outcome principles were meant to prevent.

---

## 2. The seven tensions, and how strong sources settle them

**The short answer.** The sources converge on the same settlements: accessibility is never traded, clarity beats beauty, power is disclosed progressively, friction matches consequence, brand lives in signature moments, consistency is of behaviour not of form, and the system acknowledges at once even when the work takes longer.

| Tension | Evidence | Settlement |
|---|---|---|
| Consistency versus fit | GOV.UK: "Be consistent, not uniform", "This isn't a straitjacket or a rule book." Fluent 2 reuses "native platform components and patterns 80% of the time." Tognazzini asks for "continuity, not consistency" across releases. | The same problem gets the same pattern; a different problem may get a different one, named and documented. |
| Simplicity versus power | Polaris: "Hide complexity where you can, but give people access to more sophistication if they need it." Zen of GitHub: "Approachable is better than simple." Tesler's Law (commentary): some complexity "cannot be reduced." | Progressive disclosure, with the deeper level signposted. |
| Beauty versus clarity | GOV.UK: "If we have to sacrifice elegance - so be it." SLDS ranks Clarity above Beauty. | Clarity wins; beauty is how clarity is delivered. |
| Deference versus brand | Rams: "neutral and restrained, to leave room for the user's self-expression." Apple: "Stay out of the way." Fluent 2: "Unmistakably Microsoft" and "A little personality goes a long way." | Brand lives in signature moments; content and controls defer. |
| Efficiency versus accessibility | Primer seeks "accessible solutions that don't dilute efficient UI interactions." WCAG 2.5.8 allows targets under 24px when spaced. | Accessibility is the floor and is not traded; density is achieved within it. |
| Freedom versus guardrails | Polaris: "Use friction to highlight important decisions, then let users get back to work." Apple: "make it easy to skip or escape" a guided flow. | Friction in proportion to consequence, and an exit from every guided path. |
| Responsive versus fast | Zen of GitHub: "Responsive is better than fast", "It's not fully shipped until it's fast", "Non-blocking is better than blocking." Tognazzini: acknowledge clicks "within 50 milliseconds." | Acknowledge at once, never block, then make it fast. |

Two of these deserve a closer look, because they are the ones teams settle wrongly.

**Simple is not minimal.** Apple draws the line exactly: "Simplicity isn't minimalism. Aim for a focused, useful experience that keeps the important things close by and lets the others fall away." GOV.UK names the cost: "Making something look simple is easy. Making something simple to use is much harder." Complexity removed from the screen does not vanish; it moves into the person's memory or a support ticket. A sparse screen that hides an essential control has failed the simplicity principle, not honoured it.

**Responsive versus fast is not a contradiction.** GitHub does not gloss its aphorisms, and read together they look inconsistent. Read beside Tognazzini's 50 milliseconds, one reasonable reading (commentary) is that immediate acknowledgement matters more than total time, and total time still matters. The toolkit's standard states the same settlement: acknowledge an action at once even when the work takes longer (`~/Projects/toolkit/standards/design-standard.md#principles`).

---

## 3. A principle is defined by what it refuses

**The short answer.** Each principle should name the thing it forbids, in terms a reviewer can see. Most refusals turn out to be checkable.

Taking Friedman's point literally gives a list that does more in a review than the principles themselves. [deceptive.design](https://www.deceptive.design/types) supplies the honesty column ready-made: confirmshaming, preselection, hidden costs, hard to cancel, fake urgency, fake scarcity, fake social proof, disguised ads, nagging, obstruction, sneaking, forced action, trick wording, visual interference and comparison prevention.

| Refusal | Principle it breaks | Signal |
|---|---|---|
| Decoration with no job | As little as possible; crafted | The reviewer asks the element's job |
| Colour as the only signal of state | For everyone | WCAG 1.4.1 |
| Placeholder text as the only label | Discoverable; for everyone | An input with no visible label |
| Actions available only on hover | Discoverable | The control is absent without hover |
| Disabling zoom or platform settings | Control; for everyone | `user-scalable=no` in the viewport meta |
| Preselected consent, confirmshaming, hard to cancel | Honest | The deceptive.design list |
| Inventing a pattern for a solved problem | Consistent | A new component duplicates an existing one |
| Confirmation dialogs for reversible actions | Control, forgive mistakes | A confirm where undo was possible |
| A feature with no stated need | Serve a real need | An empty description |
| A clean report from a partial scan | Honest; evidence | The report states no coverage |
| Half-built states: no error, empty or loading | Show state; crafted | Missing variants |

The last-but-one row matters most for a tool that audits. A green dashboard over real problems is reporting a verdict without its coverage. The toolkit made that a rule after its own docs site showed an AI-readiness page whose audit had not run since the record's first import: a page built from data names its source and the date of it under its title (`~/Projects/toolkit/standards/design-standard.md`, rule 1, maintainer-decreed 2026-10-11).

---

## 4. Every principle needs a test, and the tests are uneven

**The short answer.** Nine of the eleven principles can be partly checked by script on a rendered page or a Figma file. Serve a real need and honesty cannot, so they need protected time in review. A script pass is necessary and never sufficient.

"Deterministic" here means a script returns pass or fail. Otherwise the test is a question the reviewer must ask out loud.

| Principle | Deterministic signal | Reviewer's question |
|---|---|---|
| Serve a real need | Description present on every page and published component | Which person, doing what, needs this, and with what evidence? |
| As little as possible | One primary-emphasis button per view; no unused component properties; form fields against the fields the back end needs | What could go without anyone losing what they need? |
| Consistent, not uniform | Share of fills, strokes, spacing and type bound to variables; detached instances; computed styles matching no token; WCAG 3.2.3, 3.2.4 | Is this a different problem, or the same problem solved differently? |
| Show state, give feedback | Hover, focus, pressed and disabled variants; computed style changes on `:hover`, `:focus-visible`, `:active`; `role="status"` (4.1.3) | After each action, can the person tell it worked? |
| Discoverable | Accessible names (4.1.2); label in name (2.5.3); no placeholder-only inputs; no hover-only controls | Could a first-time user find this unaided? |
| Control, forgive mistakes | Undo or confirm on destructive actions; zoom allowed; 3.3.1, 3.3.3, 3.3.4, 3.3.7 | What does a mistake here cost to undo? |
| Efficient for experts | Every action keyboard-reachable (2.1.1); focus order (2.4.3); steps for the top task | What does the hundredth use cost against the first? |
| For everyone | 1.4.3 at 4.5:1, 1.4.11 at 3:1, 2.5.8 at 24px, 1.4.10 at 320px, 1.4.4, 2.4.7, 1.4.1 | Who is excluded, and in which situation? |
| Honest | No preselected consent; cancel no deeper than sign-up; reports state coverage | Would they choose this if they understood it? |
| Clear words, clear hierarchy | One `h1`; no skipped heading levels; text on type-scale styles; no "click here"; 2.4.6 | Squinting, does the main thing stand out? |
| Crafted | Off-scale spacing; clipping at 200% or with a long string; groups instead of frames in Figma | What job does this do, and what breaks if it goes? |

Measurement favours what is measurable. A team that runs only the left column will drift towards principles it can score and away from the two it cannot. That is the argument for naming the reviewer's question as part of the principle rather than leaving it implied.

The toolkit applies this split in practice: the mechanical rules run on a built page through `tools/ui-check/check.mjs`, and the judgement rules are read at the closing pass, because no script can say whether a need is real (`~/Projects/toolkit/standards/design-standard.md`, *Where the checks live*). Its standard also declines to make any principle a rule on its own: "none is a rule, and none is checked on its own." A principle becomes enforceable only through a rule that a run has proved, with evidence and a check attached.

---

## 5. Cheat sheet

| When this happens | It is usually this | Settle it by |
|---|---|---|
| A tidy screen nobody can use | Minimal mistaken for simple | Restore the hidden control; disclose depth progressively |
| A component looks different on every page | Drift off its tokens | Token binding check; a named reason for each exception |
| A button seems dead | No pending state | Acknowledge within 50ms; draw the state set |
| An unexplained icon | No label | Accessible name, visible text or tooltip |
| A green dashboard over real problems | A verdict without its coverage | State what was scanned and when |
| A beautiful page that is hard to read | Beauty ranked above clarity | Clarity wins |
| A brand push restyles every control | Brand outside its signature moments | Accent, typeface and voice; leave components alone |
| A dense tool fails target size | Efficiency traded against accessibility | Space the targets; the floor is not traded |

---

## 6. The short version

Every principle set agrees, so agreement decides nothing. A set does its work when it ranks, refuses and tests.

Rank: accessibility is never traded, clarity beats beauty, power is disclosed progressively, friction matches consequence, brand lives in signature moments, and the system acknowledges at once before it gets fast.

Refuse: decoration with no job, colour as the only signal, placeholder labels, hover-only actions, blocked zoom, deceptive patterns, invented patterns for solved problems, confirmations where undo would do, and clean reports from partial scans.

Test: most principles have a script signal, and every one has a reviewer's question. Need and honesty have only the question, so give them review time on purpose.

---

## Sources

**Foundational principles**

- [Vitsœ, Dieter Rams: ten principles for good design](https://www.vitsoe.com/us/about/good-design).
- [Don Norman, Signifiers, not affordances](https://jnd.org/signifiers-not-affordances/) (2008).
- [Ben Shneiderman, The Eight Golden Rules of Interface Design](https://www.cs.umd.edu/users/ben/goldenrules.html).
- [Nielsen Norman Group, 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) (reviewed January 2024).
- [Bruce Tognazzini, First Principles of Interaction Design](https://asktog.com/atc/principles-of-interaction-design/) (2014).
- [W3C, WCAG 2.2](https://www.w3.org/TR/WCAG22/).

**Design systems**

- [GOV.UK, Government Design Principles](https://www.gov.uk/guidance/government-design-principles) (updated 2 April 2025).
- [Apple, HIG design principles (JSON data)](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/design-principles.json).
- [Microsoft, Fluent 2 design principles](https://fluent2.microsoft.design/design-principles). Natural on every platform, Built for focus, One for all, all for one, Unmistakably Microsoft.
- [IBM, What is Carbon](https://carbondesignsystem.com/all-about-carbon/what-is-carbon/).
- [Atlassian, About the Atlassian Design System](https://atlassian.design/get-started/about-atlassian-design-system).
- [Shopify Polaris, experience values (MDX source)](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/foundations/experience-values.mdx).
- [Adobe Spectrum, Principles](https://spectrum.adobe.com/page/principles).
- [GitHub Primer, Getting started](https://primer.style/product/getting-started/). The Zen of GitHub.
- [Salesforce Lightning Design System, Spring '20 guidelines](http://spring-20.lightningdesignsystem.com/guidelines/overview/).

**Inclusion and ethics**

- [Inclusive Design Principles](https://inclusivedesignprinciples.info/) (Swan, Pouncey, Pickering, Watson).
- [Microsoft Inclusive Design](https://inclusive.microsoft.design/).
- [deceptive.design, Types of deceptive pattern](https://www.deceptive.design/types).
- [Amber Case, Calm Technology](https://calmtech.com/).

**Commentary**

- [Laws of UX](https://lawsofux.com/) (Jon Yablonski).
- [Vitaly Friedman, A Practical Guide To Design Principles](https://www.smashingmagazine.com/2026/04/practical-guide-design-principles/), Smashing Magazine, April 2026.

**The toolkit**

- `~/Projects/toolkit/standards/design-standard.md`: the principle list, its one-sentence settlement of the tensions, rule 1 (source and freshness caption), and where the checks live.
