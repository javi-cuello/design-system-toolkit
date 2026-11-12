# When design principles conflict

Why a list of design principles is useful only once it says which principle loses, what it refuses, and how a reviewer would know.

A design review stalls on a settings page. The brand lead wants the controls restyled with the new gradient; the accessibility lead says the contrast fails; the product manager wants three more options on the screen, and the designer wants fewer. Every one of them cites the team's principles, and every one of them is right by the poster on the wall.

Read twenty published principle sets and they say the same dozen things: serve a need, keep it simple, be consistent, show state, make things discoverable, forgive mistakes, be efficient, include everyone, be honest, be clear, take care. The agreement is real, which is why it settles nothing. Nobody argues for inconsistent, dishonest design.

---

## What this answers

- [Limits of agreement](#limits-of-agreement): why agreement between principle sets settles nothing
- [Settling the tensions](#settling-the-tensions): which principle wins each tension
- [Simple versus minimal](#simple-versus-minimal): whether simple is the same as minimal
- [Responsive and fast](#responsive-and-fast): whether responsive and fast can both hold
- [A principle's refusals](#a-principles-refusals): what a principle should refuse
- [Testing a principle](#testing-a-principle): how a reviewer tests a principle

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four short paragraphs.

---

## Limits of agreement

A principle set earns its place when it can decide a disagreement, which means saying ahead of time which principle gives way.

Back at the stalled review, the brand lead's case rests on "crafted" and the accessibility lead's on "for everyone". Both principles are on the list, with nothing to say which one bends. So the decision goes to whoever argues longest, which is the outcome principles were meant to prevent.

Vitaly Friedman's [practical guide to design principles](https://www.smashingmagazine.com/2026/04/practical-guide-design-principles/), a piece of commentary in Smashing Magazine, puts the standard plainly. Good principles "have a point of view, and they explain what we don't do as much as what we do". He adds the part teams skip: writing the principles is only a small portion of the work, and most of it is sharing and embedding them.

Some systems rank in their own structure:

- **Salesforce Lightning** lists Clarity first and Beauty fourth, and defines beauty as "respect for people's time and attention through thoughtful and elegant craftsmanship" ([SLDS, Spring '20](http://spring-20.lightningdesignsystem.com/guidelines/overview/)). That makes beauty a way of delivering clarity rather than its rival.
- **GOV.UK** writes the ranking into a sentence: "If we have to sacrifice elegance - so be it" ([Government Design Principles](https://www.gov.uk/guidance/government-design-principles)).

Most systems don't rank at all, and their principles go quiet in exactly the review where they were needed.

When your team writes or revises its principles, add one line to each pair that can collide, saying which wins and why. **A principle set that never says which principle loses can't settle a review.** That is consensus among the sources that rank; the specific order belongs to each team.

---

## Settling the tensions

The sources converge on the same settlements: accessibility is never traded, clarity beats beauty, power is disclosed progressively, friction matches consequence, brand lives in signature moments, consistency is of behaviour rather than form, and the system acknowledges at once even when the work takes longer.

The settings page holds most of these tensions at once. The gradient pits brand against deference, the contrast pits beauty against clarity, and the three extra options pit power against simplicity. A team that has written the settlements down can close each argument with a sentence.

There are seven recurring tensions, and the sources settle each the same way. The table puts each tension beside the strongest evidence for its settlement.

| Tension | Evidence | Settlement |
|---|---|---|
| Consistency versus fit | GOV.UK: "Be consistent, not uniform", "This isn't a straitjacket or a rule book." Fluent 2 reuses "native platform components and patterns 80% of the time." Tognazzini asks for "continuity, not consistency" across releases. | The same problem gets the same pattern; a different problem may get a different one, named and documented. |
| Simplicity versus power | Polaris: "Hide complexity where you can, but give people access to more sophistication if they need it." Zen of GitHub: "Approachable is better than simple." Tesler's Law (commentary): some complexity "cannot be reduced." | Progressive disclosure, with the deeper level signposted. |
| Beauty versus clarity | GOV.UK: "If we have to sacrifice elegance - so be it." SLDS ranks Clarity above Beauty. | Clarity wins; beauty is how clarity is delivered. |
| Deference versus brand | Rams: "neutral and restrained, to leave room for the user's self-expression." Apple: "Stay out of the way." Fluent 2: "Unmistakably Microsoft" and "A little personality goes a long way." | Brand lives in signature moments; content and controls defer. |
| Efficiency versus accessibility | Primer seeks "accessible solutions that don't dilute efficient UI interactions." WCAG 2.5.8 allows targets under 24px when spaced. | Accessibility is the floor and is not traded; density is achieved within it. |
| Freedom versus guardrails | Polaris: "Use friction to highlight important decisions, then let users get back to work." Apple: "make it easy to skip or escape" a guided flow. | Friction in proportion to consequence, and an exit from every guided path. |
| Responsive versus fast | Zen of GitHub: "Responsive is better than fast", "It's not fully shipped until it's fast", "Non-blocking is better than blocking." Tognazzini: acknowledge clicks "within 50 milliseconds." | Acknowledge at once, never block, then make it fast. |

Read down the last column and the settlements share a shape. None of them says one principle is worthless; each says where the losing principle still gets its way. Brand keeps its signature moments, density stays within the accessibility floor, and power stays one level down.

Applied to the settings page, the gradient goes to a signature moment and the controls stay plain, the contrast is fixed before anything else is discussed, and the three options go behind a signposted "More settings". **Copy these seven settlements into your principles, then change any your product has a real reason to change.** The settlements are where the sources converge; two of them are the ones teams most often settle wrongly, and the next sections take each in turn.

---

## Simple versus minimal

They differ: simple is about how easy something is to use, minimal is about how little is on screen, and removing a control the person needs makes the screen minimal and the task harder.

The designer on the settings page wins the argument for fewer options and goes further. The export button moves into an overflow menu with no label, and the screen looks calm. A week later, support tickets ask where export went.

Here is that screen before and after the tidy-up.

<svg role="img" viewBox="0 0 640 230" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>One settings screen two ways. Left, minimal: a calm screen whose Export button has moved into an unlabelled three-dot menu. Right, simple: the common settings shown, an Export button visible, and a signposted More settings link for the rest.</title>
<rect x="0" y="0" width="640" height="230" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Minimal</text>
<rect x="20" y="44" width="290" height="170" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="38" y="74" font-size="15" font-weight="600" fill="#1a1a1a">Settings</text>
<circle cx="276" cy="69" r="2" fill="#5a5850"/><circle cx="284" cy="69" r="2" fill="#5a5850"/><circle cx="292" cy="69" r="2" fill="#5a5850"/>
<text x="38" y="108" font-size="13" fill="#1a1a1a">Notifications</text>
<rect x="252" y="96" width="36" height="18" rx="9" fill="#1f5fbf"/><circle cx="279" cy="105" r="7" fill="#ffffff"/>
<text x="38" y="140" font-size="13" fill="#1a1a1a">Language</text>
<text x="288" y="140" font-size="13" fill="#5a5850" text-anchor="end">English</text>
<text x="38" y="196" font-size="12" font-style="italic" fill="#a33">Export is now behind the three dots</text>
<text x="330" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Simple</text>
<rect x="330" y="44" width="290" height="170" rx="8" fill="#ffffff" stroke="#c9c6bd"/>
<text x="348" y="74" font-size="15" font-weight="600" fill="#1a1a1a">Settings</text>
<text x="348" y="108" font-size="13" fill="#1a1a1a">Notifications</text>
<rect x="562" y="96" width="36" height="18" rx="9" fill="#1f5fbf"/><circle cx="589" cy="105" r="7" fill="#ffffff"/>
<text x="348" y="140" font-size="13" fill="#1a1a1a">Language</text>
<text x="598" y="140" font-size="13" fill="#5a5850" text-anchor="end">English</text>
<rect x="348" y="156" width="80" height="26" rx="6" fill="#ffffff" stroke="#1a1a1a"/>
<text x="388" y="173" font-size="13" fill="#1a1a1a" text-anchor="middle">Export</text>
<text x="598" y="173" font-size="13" fill="#1f5fbf" text-anchor="end" text-decoration="underline">More settings</text>
<text x="348" y="202" font-size="12" font-style="italic" fill="#2a6b2a">The common task stays in view</text>
</svg>

Both screens are uncluttered. Only the right one keeps the task people came for in reach, and it still sends the rarer settings one level down.

Apple draws the line exactly: "Simplicity isn't minimalism. Aim for a focused, useful experience that keeps the important things close by and lets the others fall away." GOV.UK names the cost: "Making something look simple is easy. Making something simple to use is much harder."

The mechanism is that complexity taken off the screen doesn't vanish. It moves into the person's memory, or into a support ticket.

Before you hide a control to tidy a screen, ask how often people use it and where they will look for it. **A sparse screen that hides an essential control has failed the simplicity principle, not honoured it.** Keep the common task visible and disclose the rest progressively, behind a label that says what is there.

---

## Responsive and fast

Both hold: acknowledge every action at once, never block, and then make the work itself fast; the first matters more, and the second still matters.

Someone on the settings page presses Save, and the request takes two seconds. If nothing changes on screen for those two seconds, the button seems dead, and the person presses it again.

The Zen of GitHub, quoted on [Primer's getting-started page](https://primer.style/product/getting-started/), seems to contradict itself here. It says "Responsive is better than fast", and also "It's not fully shipped until it's fast", and also "Non-blocking is better than blocking". GitHub doesn't gloss its aphorisms, so read together they look inconsistent.

[Tognazzini's first principles](https://asktog.com/atc/principles-of-interaction-design/) supply the missing piece: acknowledge clicks "within 50 milliseconds." Read beside that figure, one reasonable reading (commentary, not GitHub's own) is that immediate acknowledgement matters more than total time, and total time still matters.

For your Save button, show a pending state within 50 milliseconds of the press, keep the rest of the page usable while it saves, and then work on the two seconds. **Acknowledge first, then get fast.** The toolkit's design standard states the same settlement: acknowledge an action at once even when the work takes longer (`~/Projects/toolkit/standards/design-standard.md#principles`).

---

## A principle's refusals

Each principle should name what it forbids, in terms a reviewer can see on a page, and most of those refusals turn out to be checkable.

"Be honest" is on every poster. In a review, it doesn't help anyone spot the newsletter box already ticked on the sign-up form. "No preselected consent" does, because a reviewer can point at it.

Friedman's point that principles should say what they don't do, taken literally, gives a list of refusals that does more in a review than the principles themselves. [deceptive.design](https://www.deceptive.design/types) supplies the honesty column ready-made: confirmshaming, preselection, hidden costs, hard to cancel, fake urgency, fake scarcity, fake social proof, disguised ads, nagging, obstruction, sneaking, forced action, trick wording, visual interference and comparison prevention.

The refusals below each name the principle they break and the signal a reviewer would see.

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

Most rows have a signal a script or a quick look can find. The first row is the exception: only a person can ask what a piece of decoration is for.

The second-to-last row matters most for a tool that audits. A green dashboard over real problems is reporting a verdict without its coverage. The toolkit made that a rule after its own docs site showed an AI-readiness page whose audit had not run since the record's first import. Now a page built from data names its source and the date of it under its title (`~/Projects/toolkit/standards/design-standard.md`, rule 1, a maintainer decision of 11 October 2026).

Write a refusal under each of your principles, phrased as something a reviewer can point at on a page. **A principle is defined by what it refuses.** Where a refusal has a signal in the table above, put that signal into your review checklist or your lint rules.

---

## Testing a principle

Nine of eleven principles can be partly checked by script on a rendered page or a Figma file; "serve a real need" and "be honest" can't, so they need protected time in review, and a script pass is necessary but never sufficient.

A team adds an automated check to its pull requests and watches its scores climb: contrast passes, every input has a label, every action is keyboard-reachable. Meanwhile it ships a feature nobody asked for, with a cancel flow three screens deep. None of the scores moved.

Here "deterministic" means a script returns pass or fail. Every other test is a question the reviewer has to ask out loud. The table gives each principle both.

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

The signals for "serve a real need" and "honest" only catch the surface: a description can exist without a need behind it. Their real test is the question in the right-hand column.

That is why measurement favours what is measurable. A team that runs only the middle column drifts towards the principles it can score and away from the two it can't, which is what happened to the team above.

The toolkit applies this split in practice. Its mechanical rules run on a built page through `tools/ui-check/check.mjs`, and its judgement rules are read at the closing pass, because no script can say whether a need is real (`~/Projects/toolkit/standards/design-standard.md`, *Where the checks live*). Its standard also declines to make any principle a rule on its own: "none is a rule, and none is checked on its own." A principle becomes enforceable only through a rule that a run has proved, with evidence and a check attached.

Automate the middle column, and write the right-hand question into each principle so it is asked in every review. **A script pass is necessary and never sufficient.** Give need and honesty review time on purpose, since nothing else will catch them.

---

## Cheat sheet

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

## The short version

Every principle set agrees, so agreement decides nothing. Your set does its work when it ranks, refuses and tests.

Rank: accessibility is never traded, clarity beats beauty, power is disclosed progressively, friction matches consequence, brand lives in signature moments, and the system acknowledges at once before it gets fast. These settlements are where the sources converge.

Refuse: decoration with no job, colour as the only signal, placeholder labels, hover-only actions, blocked zoom, deceptive patterns, invented patterns for solved problems, confirmations where undo would do, and clean reports from partial scans.

Test: most principles have a script signal, and every one has a reviewer's question. Need and honesty have only the question, so give them review time on purpose.

---

## What to re-check later

Researched October 2026; re-checked in November 2026.

- **How the guide came about.** It grew out of a broader survey of good design principles. The principle list itself now lives in the toolkit's design standard (`~/Projects/toolkit/standards/design-standard.md#principles`), which this guide argues around rather than repeats.
- **Sources read in October 2026.** Rams via Vitsœ, Norman, Shneiderman, Nielsen Norman Group, Tognazzini, WCAG 2.2, and the published principles of GOV.UK, Apple, Fluent 2, Carbon, Atlassian, Polaris, Spectrum, Primer and Salesforce Lightning.
- **Pages that don't render to a fetcher.** Apple's principles were read from the page's JSON data and Polaris's from its repository's MDX source.
- **Re-checked in November 2026.** GOV.UK's principles (last updated 2 April 2025; the quotations still stand), Fluent 2's four principles and its "80% of the time" line, and Primer's getting-started page, which still carries the Zen of GitHub aphorisms quoted here.
- **Left out because they could not be confirmed.** Salesforce UX's post on ranking principles (HTTP 403), Atlassian's old design-values URL (HTTP 404), and Microsoft's persona spectrum, no longer on the Inclusive Design landing page.
- **Commentary, labelled as such.** Laws of UX and Friedman's guide. The reading of GitHub's "responsive versus fast" aphorisms is also commentary.

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
