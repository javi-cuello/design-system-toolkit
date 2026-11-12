# Measuring design system adoption

What an adoption number should count in Figma and in code, which denominator makes it honest, and how to report it without turning it into a target.

The design system team's quarterly review opens on a chart: 100,000 component insertions this month, up 12%. Someone asks whether the product is more consistent than last quarter, and nobody can say. The same week, a product designer detaches a card because it can't hold a second button, and the detach shows up on the dashboard as a red mark against the system.

An insertion count measures activity, not adoption. Adoption is a share: of what was built, how much came from the system. That makes the denominator the whole question, and it's the part most dashboards leave out.

---

## What this answers

- [Counts and shares](#counts-and-shares): why insertions and instance counts don't measure adoption
- [The denominator](#the-denominator): what to divide by
- [What Figma counts](#what-figma-counts): what Library Analytics sees and misses
- [Detaches](#detaches): when a detach is a defect and when it's a signal
- [Raw values](#raw-values): the token half of adoption
- [Counting in code](#counting-in-code): what scanners count, and what they don't
- [Coverage in production](#coverage-in-production): measuring what users see
- [Scope](#scope): which files and pages belong in the number
- [Scores and bands](#scores-and-bands): one number, a band, and whether to set a target
- [Design and code together](#design-and-code-together): what the gap between them shows

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs.

---

## Counts and shares

A count says the system is used; only a share says how much of the product it covers.

Take the 100,000 insertions. If the product team built twice as many screens this month, insertions doubled while the share of the interface drawn from the library stayed exactly where it was. If they built half as many screens with the same insertions, the count hides that each screen now leans on the library more. A count moves with the amount of work; a share moves with adoption.

Pinterest's design system team said this plainly when they built their own Figma metric: insertions and instance counts are "really just counts". What they wanted to know was how much of each design was made of Gestalt, their system, and no count answers that ([Pinterest, measuring adoption](https://www.designsystems.com/how-pinterests-design-systems-team-measures-adoption)).

Counts are not useless. athenahealth's Forge team reviews about 100,000 insertions a month beside its detaches, and uses the pair to ask which components people break out of ([Figma, Design systems 104](https://www.figma.com/blog/design-systems-104-making-metrics-matter/)). That is a health question about each component. It isn't an adoption number for the product.

**Report counts as component health and shares as adoption, and never put a count where a reader expects a share.** Pinterest, Preply and Brevo, three of the few teams that publish their method, all express adoption as a ratio; that is a pattern among them, not an industry consensus.

---

## The denominator

A share is only as honest as what it divides by, and the choice decides what the number can and can't see.

Here is one frame from Pinterest's post, scored the way they score it: seven of its fifteen layers come from Gestalt, so the frame is 46.7% Gestalt (Pinterest's post rounds it down to 46.6%).

<svg role="img" viewBox="0 0 640 240" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A frame of fifteen layers: seven drawn from the library, eight drawn by hand. Seven of fifteen is 46.7 percent.</title><rect x="0" y="0" width="640" height="240" fill="#FAFAFA"/><rect x="20" y="20" width="360" height="200" rx="8" fill="#FFFFFF" stroke="#D0D0D0"/><text x="32" y="44" font-family="Inter, sans-serif" font-size="13" fill="#1E1E1E">Frame: 15 layers</text><g font-family="Inter, sans-serif" font-size="11"><rect x="32" y="60" width="60" height="36" rx="4" fill="#E3F2FD" stroke="#0D99FF"/><rect x="100" y="60" width="60" height="36" rx="4" fill="#E3F2FD" stroke="#0D99FF"/><rect x="168" y="60" width="60" height="36" rx="4" fill="#E3F2FD" stroke="#0D99FF"/><rect x="236" y="60" width="60" height="36" rx="4" fill="#E3F2FD" stroke="#0D99FF"/><rect x="304" y="60" width="60" height="36" rx="4" fill="#E3F2FD" stroke="#0D99FF"/><rect x="32" y="104" width="60" height="36" rx="4" fill="#E3F2FD" stroke="#0D99FF"/><rect x="100" y="104" width="60" height="36" rx="4" fill="#E3F2FD" stroke="#0D99FF"/><rect x="168" y="104" width="60" height="36" rx="4" fill="#F5F5F5" stroke="#9E9E9E" stroke-dasharray="4 3"/><rect x="236" y="104" width="60" height="36" rx="4" fill="#F5F5F5" stroke="#9E9E9E" stroke-dasharray="4 3"/><rect x="304" y="104" width="60" height="36" rx="4" fill="#F5F5F5" stroke="#9E9E9E" stroke-dasharray="4 3"/><rect x="32" y="148" width="60" height="36" rx="4" fill="#F5F5F5" stroke="#9E9E9E" stroke-dasharray="4 3"/><rect x="100" y="148" width="60" height="36" rx="4" fill="#F5F5F5" stroke="#9E9E9E" stroke-dasharray="4 3"/><rect x="168" y="148" width="60" height="36" rx="4" fill="#F5F5F5" stroke="#9E9E9E" stroke-dasharray="4 3"/><rect x="236" y="148" width="60" height="36" rx="4" fill="#F5F5F5" stroke="#9E9E9E" stroke-dasharray="4 3"/><rect x="304" y="148" width="60" height="36" rx="4" fill="#F5F5F5" stroke="#9E9E9E" stroke-dasharray="4 3"/></g><g font-family="Inter, sans-serif" font-size="13" fill="#1E1E1E"><rect x="410" y="70" width="18" height="18" rx="3" fill="#E3F2FD" stroke="#0D99FF"/><text x="438" y="84">From the library: 7</text><rect x="410" y="104" width="18" height="18" rx="3" fill="#F5F5F5" stroke="#9E9E9E" stroke-dasharray="4 3"/><text x="438" y="118">Drawn by hand: 8</text><text x="410" y="160" font-size="15" font-weight="600">7 ÷ 15 = 46.7%</text></g></svg>

The number says nothing about which eight layers were drawn by hand, and that's fine: its job is to say how much, and a lint pass says which.

The choice of denominator shapes everything after it. There are four in use.

- **Layers or elements.** Pinterest divides library layers by all layers in a frame; Preply's static analysis divided system code by all front-end code and found about 25% at the end of 2023 ([Preply, visual coverage](https://dev.to/noriste/visual-coverage-why-and-how-preply-measures-the-impact-of-the-design-system-part-i-3omb)). It sees everything, so a hand-drawn rectangle costs as much as a hand-built table.
- **Components.** Omlet and Brevo divide system components by all components in a project ([Omlet charts](https://github.com/zeplin/omlet/blob/main/docs/dashboard/analytics/popular-charts.md); [Brevo](https://engineering.brevo.com/how-to-track-design-system-adoption/)). It is cheap to compute, and blind to anything built from raw HTML or raw shapes.
- **Rendered area.** Preply colours the border pixels of each element on a real page, green for system and red for not, and divides green by the total. It weighs what the user sees, so a full-width table outweighs an icon.
- **Products or teams.** GOV.UK's Service Explorer records, service by service, whether each uses GOV.UK Frontend and which version ([GOV.UK, Service Explorer](https://team-playbook.design-system.service.gov.uk/analytics/using-service-explorer)). It answers reach, not depth.

The trap in the component denominator is the one that matters most. A team builds a settings page from the system's Button and a dozen raw `<div>`s and `<input>`s, with no custom components. Omlet scores it 100%, because its FAQ says HTML tags in JSX are not detected ([Omlet vs react-scanner](https://github.com/zeplin/omlet/blob/main/docs/faqs/omlet-vs-react-scanner.md)). Most of the page is raw markup, and the number says it is all system.

**Divide by everything a person drew or wrote, not only by the components they chose: layers in Figma, elements in code.** The component denominator is fine for "which custom components compete with ours", and wrong as the headline.

---

## What Figma counts

Figma's Library Analytics counts events on library assets, and it can't see anything that was never a library asset.

On Organization and Enterprise plans, a library's Analytics tab shows, per component, its instances, inserts and detaches, and per style or variable how many files and teams use it ([Figma, library analytics](https://help.figma.com/hc/en-us/articles/360039238353)). Data updates daily and goes back a year; styles and variables have only been tracked since 10 October 2024. An insert is a drag from Assets, a paste, a duplicate, a swap, or content added to a slot. A detach is the Detach instance command.

The same data is available through the REST API's library analytics endpoints: weekly `insertions` and `detachments` per component, style or variable, grouped by asset or by team, and a usage snapshot of `usages`, `teams_using` and `files_using` ([Figma REST API](https://developers.figma.com/docs/rest-api/library-analytics-endpoints/)). The help page says the API is Enterprise-only.

The blind spots follow from counting events on assets:

- A component nested inside another doesn't count as an insertion. Nor does a style or variable used inside an inserted component.
- Duplicating a file creates no insertions, so a team that copies last quarter's file and edits it shows far less activity than the hundred screens it ships.
- Other people's drafts are invisible.
- A raw hex colour, a hand-drawn button, a frame with 13px padding: none of these was ever a library asset, so none of them appears anywhere.

That last point is the one that matters for adoption. Library Analytics can show that the Button is popular. It can't show that a third of the buttons in the product aren't the Button.

**Use Library Analytics for component health and reach, and a file scan for adoption.** Pinterest built exactly that split: Figma's numbers for which components are used, and their own nightly scan, FigStats, over 1,853 files through the REST API, for how much of each design is Gestalt.

---

## Detaches

A detach is a signal about a component, not a mark against the person who did it.

The designer from the opening detached a card because it couldn't hold a second button. The dashboard counted one detach. What happened is that the card is missing a slot, and every designer who needs two buttons will hit the same wall.

Teams disagree about how bad that is, and both sides have a point. Salesforce says detaching "isn't ideal", because a detached copy no longer receives fixes, including accessibility fixes; their button icon had almost a million instances and more than 3,000 detaches in a year, and their answer was to add properties and slots so nobody needs to detach ([Salesforce, component health](https://www.salesforce.com/blog/figma-component-health/)). athenahealth's Veronica Agne reads each detach as a bug, a missing enhancement or a combination nobody expected ([Figma, Design systems 104](https://www.figma.com/blog/design-systems-104-making-metrics-matter/)). Figma's own guidance adds that a high detach rate isn't necessarily bad for components built to be detached, such as screen templates ([Figma, scaling design](https://www.figma.com/scaling-design/make-the-most-of-design-system-analytics/)).

Two more traps sit in how detaches are counted.

- **Library Analytics counts the command, not the state.** A designer who detaches and then deletes the copy still counted one detach; a detached copy pasted ten times counted one.
- **A file scan sees only what survived.** The plugin API marks a frame that was once an instance with `detachedInfo`, holding the source component's key or id ([Figma, DetachedInfo](https://developers.figma.com/docs/plugins/api/DetachedInfo/)). That flag is a property of a frame that still exists, so it counts the detaches that are still in the design. Some scanners also treat a frame named exactly like a component as a "ghost detach"; DesignOps.Tools' Coverage Report does ([Coverage Report](https://designops-tools.pages.dev/coverage-report/)). The name rule catches copies made before the flag existed, and also flags a designer's own frame called "Header".

**Count surviving detaches per component, read the top ten as a backlog, and leave templates meant to be detached out of the number.** That is judgement, drawn from Salesforce's and athenahealth's practice: the per-person detach rate tells you nothing a conversation wouldn't.

---

## Raw values

Component adoption is half of it; the other half is whether colour, type, spacing and radius come from tokens.

A frame can be built entirely from library instances and still be off the system: its own background is `#FFFFFF` typed by hand, its padding is 13px, and a heading sits outside any instance in a text style nobody published. Every instance count says 100%.

In Figma, a plugin finds these by reading each node's `boundVariables` and its style ids, such as `fillStyleId` ([Figma, node properties](https://developers.figma.com/docs/plugins/api/node-properties/)). The share is bound values over all values judged. Pinterest's own tool, figma-calculations, reports the "percent of Style Library Adoption in a file", with partial and full matches ([pinterest/figma-calculations](https://github.com/pinterest/figma-calculations)).

Figma now does part of this itself. Check designs, in early access since October 2025 on Organization and Enterprise plans, flags hard-coded colour, type, radius and spacing, assets from the wrong library and components detached from their source, and suggests the variable to use ([Figma, Check designs](https://help.figma.com/hc/en-us/articles/39592284074263-Check-designs-in-Figma)). It lists suggestions in four tabs and gives a count. It gives no score.

In code, the same check is a lint rule. Atlassian's `ensure-design-token-usage` flags hard-coded values in the domains a team names, `color`, `spacing` or `shape` ([Atlassian ESLint plugin](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage/usage)); `stylelint-declaration-strict-value` requires a variable for the CSS properties listed in its config ([stylelint-declaration-strict-value](https://github.com/AndyOGo/stylelint-declaration-strict-value)). Shopify's `stylelint-polaris` grouped its rules under a `polaris/coverage` rule, by category ([stylelint-polaris](https://github.com/Shopify/polaris/blob/main/stylelint-polaris/index.js)). None of them publishes how violations become a percentage, so a team builds that ratio itself: values passing the rule over values the rule looked at.

There's one trap in that ratio. A value of zero, an image fill or a gradient is not a token decision, and counting it as "judged" inflates the denominator with values that could never be wrong. Count only what could have been bound.

**Report token coverage beside component adoption, per category, as values bound over values that could have been.** Shopify set its own library a target of 90% token coverage for colour, motion, type and spacing ([Polaris issue 4528](https://github.com/Shopify/polaris/issues/4528)), which shows a category split is how one large team chose to see it.

---

## Counting in code

Code scanners count component usages in source; whether they count adoption depends on whether they also count what isn't the system.

react-scanner is the common base. It walks JSX statically and reports components and their props, with processors for plain counts, counts with props, or a raw report of every usage and where it is ([react-scanner](https://github.com/moroshko/react-scanner)). It produces counts, not a percentage; the team builds the ratio. Twilio's Paste team built theirs on records of exactly that shape, after deciding npm downloads were "not a very strong signal" ([Twilio, Paste insights](https://www.twilio.com/en-us/blog/insights-metrics-inform-paste-design-system)).

What separates the tools is the denominator.

- **Elastic's EUI** scans every component usage in Kibana, not only EUI's, and tags each with its module and code owners, so adoption compares across teams ([EUI usage analytics](https://github.com/elastic/eui/blob/main/packages/eui-usage-analytics/README.md)).
- **Rangle's Radius Tracker** buckets components into the system and "homebrew", and treats a component as homebrew if it renders a built-in JSX tag ([Radius Tracker](https://github.com/rangle/radius-tracker)). That puts raw HTML back in the denominator.
- **Omlet** counts system against non-system components and skips HTML tags, the trap from [the denominator](#the-denominator). Omlet wound down as a business in April 2026 and is now open source under MIT, self-hosted ([Omlet](https://omlet.dev/blog/omlet-open-source/)).

Static scanning has one limit nobody escapes: it counts lines of source, not what renders. A component imported in a file behind a feature flag nobody turned on counts the same as the checkout page.

**Scan every component and every HTML element, tag each with its owner, and divide system by all.** EUI and Radius Tracker are the models; a scanner that only sees components overstates adoption wherever teams build from raw markup.

---

## Coverage in production

Measuring the rendered page weighs adoption by what users actually see, at the cost of a noisier number.

Preply's design system components each render a `data-preply-ds-component` attribute. On real users' devices, a script colours the border pixels of each element, green for system and red for anything else, and coverage is green over green plus red. Their production coverage was 77% overall, with most teams above 85%, at the same time their static scan said about 25% of front-end code was the system ([Preply, visual coverage](https://dev.to/noriste/visual-coverage-why-and-how-preply-measures-the-impact-of-the-design-system-part-i-3omb)).

Both numbers were true. The static scan counted every file, including admin tools and dead code; the pixels counted what users saw most. A team that wants to know "how consistent is the product people use" wants the second.

The cost is noise. Traffic skews the aggregate, the number moves day to day, and low coverage can be legitimate: a third-party payment button will never be the system's. Preply later added static analysis back for earlier feedback.

The attribute is the cheap part and the part to steal. GitHub's Primer accepted an architecture decision in February 2026, still awaiting implementation, to make `data-component` a stable public selector, naming counting components on a page as one use ([Primer ADR-023](https://github.com/primer/react/blob/main/contributor-docs/adrs/adr-023-stable-selectors-api.md)). The Scottish Government's design system adds data attributes for analytics, and warns that components added to the page later don't get them, which matters in a single-page app ([Scottish Government, tracking](https://designsystem.gov.scot/guidance/tracking)).

**Put a stable data attribute on every rendered system component now, even before anything reads it.** It costs one line per component and makes a production crawl or a pixel measure possible later; the measure itself is worth it once static numbers stop answering the questions people ask.

---

## Scope

Which files and pages go into the number changes it more than any formula does.

A product file holds handoff screens, an archive page of last year's explorations, a page of whiteboard sketches, and a page called "Components (local)". Scan all of it and the archive drags the score down for work nobody will build. Scan only the handoff pages and the score describes what engineers receive.

Pinterest scoped hard: only pages marked as handoff, only in files edited in the last two weeks. Their reasoning was that adoption should describe current work, not history. GOV.UK scopes by service: a list of live services, re-checked weekly, with a warning that login walls and bot protection produce wrong readings ([GOV.UK, Service Explorer](https://team-playbook.design-system.service.gov.uk/analytics/using-service-explorer)).

The traps here are quiet ones:

- **Scanning the library itself.** A product file that keeps local copies of components scores them as hand-drawn frames.
- **Scanning templates.** A screen template meant to be detached turns every use into a detach.
- **Old files.** A file nobody has opened since the last rebrand keeps scoring the old system.

**Decide the scope before the formula, write it next to the number, and keep it fixed between runs.** A number whose scope moved is not comparable to last month's, and a scope nobody wrote down will move.

---

## Scores and bands

One number with a band is what people remember; a target on that number is what they game.

Teams that publish their method mostly avoid a single target. Preply tracks per-team averages, gives teams numbers they can put in their OKRs, and decided never to set a target score. Pinterest saw adoption range from 50% on some teams to 2% on others and wrote that it's hard to say there's an ideal number. Sparkbox's maturity model puts adoption at the centre only in its second stage, "Growing Adoption"; after that, it says adoption is no longer the top concern, and consistency, accessibility regressions and uptake of new releases take over ([Sparkbox, maturity model](https://sparkbox.com/foundry/design_system_maturity_model)).

Bands do exist, but none comes from research. DesignOps.Tools' Coverage Report bands its score at 0–40% low, 40–70% partial and 70–100% strong, with its formula published: library and local instances over instances plus ghost detaches ([Coverage Report](https://designops-tools.pages.dev/coverage-report/)). No published 80% industry target turned up anywhere.

How the checks combine is a choice too. Take a file that scores 99% on library components, 50% on colour and 100% on text styles. A plain average says 83, which reads as fine. Weighted by how many items each check judged (1,700 components, 400 paints, 300 texts), it says 91, which hides the colour problem further. Either way, one weak check vanishes into the total.

So the total needs its parts beside it, every time. Dan Mall's commentary goes further: adoption is a lagging indicator, and teams at 90 to 100% often keep the inefficiencies they had before; he proposes measuring how early feature teams involve the system team instead ([Dan Mall](https://v5.danmall.com/posts/in-search-of-a-better-design-system-metric-than-adoption/)).

**Show the total, a band and every check's own share together, and treat the bands as a reading aid, not a goal.** Banding is judgement, not consensus; if you set thresholds, write down that they're yours, and watch whether a team whose number becomes a target starts changing what gets scanned, a risk commentary argues though no team has documented it.

---

## Design and code together

The gap between design adoption and code adoption is often the most useful number of all.

Pinterest's PageHeader had high adoption in Figma and low adoption in code. Designers were reaching for it; engineers weren't using it. The cause was a limitation in the code component, which the code number alone would have read as teams ignoring the system.

That's the case for measuring both with the same denominator logic. A component high in design and low in code has a code problem. One high in code and low in design usually means designers are drawing their own version of something engineers have, which is a library or documentation problem.

The evidence that adoption improves outcomes is thinner than the dashboards suggest. Figma's own study found designers finished a task 34% faster with a design system, and called that likely the upper bound ([Figma, measuring the value](https://www.figma.com/blog/measuring-the-value-of-design-systems/)). Sparkbox's study of eight developers on Carbon measured 47% faster work, consistency better for five of eight, and accessibility mixed: two builds from scratch beat their Carbon versions ([Sparkbox, Carbon study](https://sparkbox.com/foundry/design_system_roi_impact_of_design_systems_business_value_carbon_design_system)). No peer-reviewed study links adoption to user outcomes.

**Measure design and code per component, and read the components where they disagree first.** That is where the system is failing someone, and it's the cheapest finding either number gives.

---

## Cheat sheet

| Question | Measure | Not |
|---|---|---|
| How much of the product is the system? | System layers or elements ÷ all layers or elements, per screen or page | Insertions, instances, npm downloads |
| Which components need work? | Surviving detaches per component, top ten | Detach rate per person |
| Are tokens used? | Bound values ÷ values that could be bound, per category | Counting zero values and images as judged |
| Which teams use it? | Products or services on the system, with version | One file-wide score |
| What do users see? | Rendered coverage from a data attribute | A static scan alone |
| Is a component broken in code? | Design adoption against code adoption, per component | Either number alone |
| How is it doing overall? | A total, a band, and each check's share | A total with a target |

---

## The short version

Insertions, instance counts and npm downloads measure activity, not adoption. Adoption is a share, and its honesty is in the denominator: divide what came from the system by everything a person drew or wrote, layers in Figma and elements in code, not only by the components they picked. A scanner that ignores raw HTML or hand-drawn shapes overstates adoption in exactly the places it's lowest. Figma's Library Analytics is good for component health and reach, but it counts events on library assets, so it can't see the hand-built button or the raw hex colour that make up the gap.

Read detaches as a backlog per component rather than a mark against people, and leave templates meant to be detached out. Count token coverage beside component adoption, per category, over only the values that could have been bound. Decide the scope before the formula: which pages and files, how recent, and write it down beside the number so next month's is comparable. In code, put a stable data attribute on every rendered system component now; it makes a production measure possible later.

Report a total, a band and each check's own share together. Bands are a reading aid; no published research supports any threshold, and most teams that publish their methods avoid a target on the headline number (Shopify's 90% applied to its own library's tokens), since commentary argues a target invites changing what's scanned. The most useful finding is often the gap: a component used in design and not in code, or the other way round, is where the system is failing someone.

---

## What to re-check later

Researched on 12 November 2026.

- **Library Analytics**: the plan tiers, the one-year window and the 10 October 2024 start for styles and variables come from Figma's help centre; the developer docs name no plan for the API. Re-check both.
- **Check designs** was in early access on Organization and Enterprise plans as of the October 2025 announcement. Whether it reached general availability or other plans in 2026 was not confirmed from a primary source. A June 2026 forum report of a raw radius passing the check was seen only as a search snippet.
- **Omlet** wound down as a business on 28 April 2026 and is open source; its charts and formula may change under the community.
- **stylelint-polaris** was archived on 11 September 2026.
- **Primer ADR-023** was accepted with implementation pending.
- **Coverage Report's** formula and bands come from the vendor's own page; its Figma Community listing was not opened.
- **Pinterest's post** carries no date. Its numbers (1,853 files, 50% to 2%) are from that post alone.
- **Shopify's admin coverage**: figures of about 70% of the admin on Polaris and 86.6% coverage appear in Shopify UX posts on Medium that could not be opened; they are left out. An "8% token coverage" figure sometimes attributed to Shopify was not found in any source.
- **Evidence quality**: the outcome studies are small (Sparkbox, eight developers) or self-described upper bounds (Figma). No peer-reviewed work links adoption to user or business outcomes, and no primary source documents adoption metrics driving bad behaviour, though the risk is argued in commentary.
- **Outside large US tech**: GOV.UK, the Scottish Government and Brevo (France) are covered in the body; Kiwi.com's Orbit (Czech Republic) tracking package is in the sources only. No Asian system's published method was found.

---

## Sources

**Primary**

- [Figma, View and explore library analytics](https://help.figma.com/hc/en-us/articles/360039238353)
- [Figma REST API, library analytics endpoints](https://developers.figma.com/docs/rest-api/library-analytics-endpoints/)
- [Figma plugin API, DetachedInfo](https://developers.figma.com/docs/plugins/api/DetachedInfo/)
- [Figma plugin API, FrameNode](https://developers.figma.com/docs/plugins/api/FrameNode/)
- [Figma plugin API, node properties](https://developers.figma.com/docs/plugins/api/node-properties/)
- [Figma, Check designs](https://help.figma.com/hc/en-us/articles/39592284074263-Check-designs-in-Figma)
- [Figma, Schema 2025 design systems recap](https://www.figma.com/blog/schema-2025-design-systems-recap/)
- [Figma, Design systems 104: making metrics matter](https://www.figma.com/blog/design-systems-104-making-metrics-matter/)
- [Figma, Make the most of design system analytics](https://www.figma.com/scaling-design/make-the-most-of-design-system-analytics/)
- [Figma, Measuring the value of design systems](https://www.figma.com/blog/measuring-the-value-of-design-systems/)
- [Pinterest, How Pinterest's design systems team measures adoption](https://www.designsystems.com/how-pinterests-design-systems-team-measures-adoption)
- [pinterest/figma-calculations](https://github.com/pinterest/figma-calculations)
- [Salesforce, Figma component health](https://www.salesforce.com/blog/figma-component-health/)
- [Preply, Visual coverage, part I](https://dev.to/noriste/visual-coverage-why-and-how-preply-measures-the-impact-of-the-design-system-part-i-3omb)
- [Brevo, How to track design system adoption](https://engineering.brevo.com/how-to-track-design-system-adoption/)
- [GOV.UK, Using the Service Explorer](https://team-playbook.design-system.service.gov.uk/analytics/using-service-explorer)
- [X-GOVUK, GOV.UK Frontend stats](https://x-govuk.org/posts/govuk-services-frontend-stats)
- [Scottish Government Design System, tracking](https://designsystem.gov.scot/guidance/tracking)
- [react-scanner](https://github.com/moroshko/react-scanner)
- [Elastic EUI usage analytics](https://github.com/elastic/eui/blob/main/packages/eui-usage-analytics/README.md)
- [Kiwi.com Orbit tracking](https://github.com/kiwicom/orbit/blob/master/packages/orbit-tracking/README.md)
- [Rangle, Radius Tracker](https://github.com/rangle/radius-tracker)
- [Rangle, Radius Tracker homebrew detection](https://github.com/rangle/radius-tracker/blob/main/src/lib/detectHomebrew/detectHomebrew.ts)
- [Omlet, open source announcement](https://omlet.dev/blog/omlet-open-source/)
- [Omlet, popular charts](https://github.com/zeplin/omlet/blob/main/docs/dashboard/analytics/popular-charts.md)
- [Omlet, Omlet vs react-scanner](https://github.com/zeplin/omlet/blob/main/docs/faqs/omlet-vs-react-scanner.md)
- [Twilio, Insights and metrics that inform the Paste design system](https://www.twilio.com/en-us/blog/insights-metrics-inform-paste-design-system)
- [Primer, ADR-023 stable selectors API](https://github.com/primer/react/blob/main/contributor-docs/adrs/adr-023-stable-selectors-api.md)
- [Atlassian, ensure-design-token-usage](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage/usage)
- [stylelint-declaration-strict-value](https://github.com/AndyOGo/stylelint-declaration-strict-value)
- [Shopify, stylelint-polaris](https://github.com/Shopify/polaris/blob/main/stylelint-polaris/index.js)
- [Shopify, Polaris issue 4528: token coverage](https://github.com/Shopify/polaris/issues/4528)
- [Sourcegraph, Migrating to CSS modules with codemods and code insights](https://sourcegraph.com/blog/migrating-to-css-modules-with-codemods-and-code-insights)
- [Sparkbox, Carbon design system ROI study](https://sparkbox.com/foundry/design_system_roi_impact_of_design_systems_business_value_carbon_design_system)

**Commentary**

- [Sparkbox, Design system maturity model](https://sparkbox.com/foundry/design_system_maturity_model)
- [Dan Mall, In search of a better design system metric than adoption](https://v5.danmall.com/posts/in-search-of-a-better-design-system-metric-than-adoption/)
- [DesignOps.Tools, Coverage Report](https://designops-tools.pages.dev/coverage-report/) (a vendor's page)
- [Design system analytics, WAYS Conf 2023](https://www.waysconf.com/lecture/design-system-analytics-how-to-measure-the-adoption-and-success-of-figma-components)

**Cited but not resolved to a URL**

- Nathan Curtis and EightShapes on adoption scorecards and OKRs: Medium refused access, so nothing from them is used.
- Deliveroo Design on design system health: Medium refused access.
- Shopify UX posts on Polaris coverage: Medium refused access.
