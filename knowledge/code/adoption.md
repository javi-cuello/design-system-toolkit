# Measuring design system adoption

How much of a product, in Figma and in code, is built from the system, and how to report it. It serves figma-standard rule 17 (what an audit reports, and that a composite score is given only on request) by saying what such a score should count when it is asked for. Scanning a file is the components audit's `FCA.composedFrame` (`skills/figma-components-audit/references/scanner-checks.md` §3.13); the toolkit's scorer is the Adoption score widget (`plugins/adoption-score`).

**Implements:** no ui pattern; it is how the system's own use is measured.

## Shares, not counts

**What good looks like**
- [strong] Adoption is reported as a share: what came from the system over everything built. Insertions, instance counts and package downloads are activity, and move with the amount of work.
- [moderate] Counts stay, as component health: inserts and detaches per component say which components people break out of.

**How**
- [strong] Pinterest's design system team calls insertions and instance counts "really just counts" and scores each frame as system layers over all layers ([Pinterest](https://www.designsystems.com/how-pinterests-design-systems-team-measures-adoption)); Brevo reports a ratio of system to legacy components ([Brevo](https://engineering.brevo.com/how-to-track-design-system-adoption/)); Twilio's Paste team found npm downloads "not a very strong signal" ([Twilio](https://www.twilio.com/en-us/blog/insights-metrics-inform-paste-design-system)).
- [moderate] athenahealth reviews about 100,000 insertions a month beside detaches as a component-health dashboard ([Figma, Design systems 104](https://www.figma.com/blog/design-systems-104-making-metrics-matter/)).

**Cases**
- Insertions up 12% in a month the team built twice as many screens → the share may not have moved; report system layers over all layers.

**Check**
- *Script:* the widget reports shares only. *Judgement:* does any dashboard put a count where a reader expects a share?

## The denominator

**What good looks like**
- [strong] The denominator is everything a person drew or wrote: layers in Figma, elements in code, raw shapes and raw HTML included.
- [moderate] A component-only denominator answers a different question (which custom components compete with the system's) and is not the headline.

**How**
- [strong] Omlet skips HTML tags in JSX ([Omlet FAQ](https://github.com/zeplin/omlet/blob/main/docs/faqs/omlet-vs-react-scanner.md)), so a page of system buttons in raw markup scores 100%. Rangle's Radius Tracker counts a component rendering a built-in JSX tag as "homebrew" ([Radius Tracker](https://github.com/rangle/radius-tracker)), which keeps raw markup in the denominator.
- [moderate] Four denominators are in use: layers or elements (Pinterest, Preply's static scan), components (Omlet, Brevo), rendered area (Preply's production measure), products or services (GOV.UK's Service Explorer). Each answers a different question; name the one used beside the number.
- [moderate] "From the system" needs the system named: an instance from a third-party UI kit is a library instance and not the system's. The plugin API cannot tell which library a remote component comes from (its main component has no parent, and `figma.teamLibrary` lists variable collections only, probed 2026-11-12); the REST API's component endpoint returns the component's `file_key` (`library_assets:read` scope; [Figma REST API](https://developers.figma.com/docs/rest-api/component-endpoints/)), so naming the system means a token and a call per component.

**Cases**
- A file scored by instances alone reads 100% while a third of its buttons are hand-drawn → count raw layers in the denominator (the widget's *Library components* check does).

**Check**
- *Script:* the widget divides placed instances by instances plus raw layers. *Judgement:* does a code scanner in use see raw HTML, and is every library counted as the system really the system's?

## Figma's analytics and a file scan

**What good looks like**
- [strong] Library Analytics is read for component health and reach; a file scan is read for adoption, since analytics counts events on library assets and cannot see what never was one.

**How**
- [strong] Library Analytics (Organization and Enterprise plans) reports instances, inserts and detaches per component and usage per style and variable, daily, for up to a year; styles and variables since 10 October 2024. It does not count nested components, file duplicates or other people's drafts ([Figma help](https://help.figma.com/hc/en-us/articles/360039238353)). The REST endpoints give weekly `insertions` and `detachments` and a usage snapshot ([Figma REST API](https://developers.figma.com/docs/rest-api/library-analytics-endpoints/)).
- [moderate] Pinterest pairs the two: Figma's numbers for which components are used, a nightly REST scan of 1,853 files for how much of each design is Gestalt ([Pinterest](https://www.designsystems.com/how-pinterests-design-systems-team-measures-adoption)).
- [weak] Figma's Check designs (early access since October 2025, Organization and Enterprise) lists hard-coded colour, type, radius and spacing and detached components, with a count and no score ([Figma help](https://help.figma.com/hc/en-us/articles/39592284074263-Check-designs-in-Figma)).

**Check**
- *Script:* the widget scans the file. *Judgement:* is an analytics count being read as adoption?

## Detaches

**What good looks like**
- [moderate] A detach is read per component, as a backlog: the most-detached components are missing a property, a slot or a fix.
- [moderate] Components meant to be detached, screen templates above all, are left out of the count.
- [contested] Whether a detach is a defect: Salesforce holds that detached copies miss fixes, accessibility ones included, and adds properties and slots so nobody needs to ([Salesforce](https://www.salesforce.com/blog/figma-component-health/)); athenahealth reads each as a bug, a missing enhancement or an unexpected combination ([Figma, Design systems 104](https://www.figma.com/blog/design-systems-104-making-metrics-matter/)). The toolkit goes with reading it as a signal about the component.

**How**
- [strong] A file scan finds surviving detaches through `detachedInfo` on a frame ([Figma plugin API](https://developers.figma.com/docs/plugins/api/DetachedInfo/)); Library Analytics counts the command, so a detach later deleted still counts there.
- [weak] A frame named exactly like a component (a "ghost detach", as DesignOps.Tools' Coverage Report counts it, [Coverage Report](https://designops-tools.pages.dev/coverage-report/)) catches copies made before the flag, and also a designer's own frame called "Header". The widget leaves name matches out; the composed-frame check reports them as `by: name`.

**Cases**
- A product file scored 10 detaches where 2 were planted (2026-11-12, the widget's first run, counting name matches and template roots) → count only flagged frames inside a screen.

**Check**
- *Script:* `FCA.composedFrame` marks each detach `by` and `root`. *Judgement:* are the top detached components on the system team's backlog?

## Token coverage

**What good looks like**
- [strong] Token coverage is reported beside component adoption, per category (colour, spacing and radius, type), as values bound over values that could have been bound.
- [moderate] A zero value, an image or a gradient is not judged: it could never have been a token.

**How**
- [strong] In Figma, a value is bound when the node's `boundVariables` holds it or a style id is set ([Figma plugin API](https://developers.figma.com/docs/plugins/api/node-properties/)); Pinterest's figma-calculations reports style adoption per file ([pinterest/figma-calculations](https://github.com/pinterest/figma-calculations)).
- [strong] In code, a lint rule finds the raw values: Atlassian's `ensure-design-token-usage` by domain ([Atlassian](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage/usage)), `stylelint-declaration-strict-value` by property ([stylelint-declaration-strict-value](https://github.com/AndyOGo/stylelint-declaration-strict-value)). None publishes a coverage formula; values passing over values checked is the toolkit's.
- [moderate] Shopify set its own library 90% token coverage for colour, motion, type and spacing ([Polaris issue 4528](https://github.com/Shopify/polaris/issues/4528)).

**Check**
- *Script:* the widget's colour, spacing and text checks; `bin/css-lint` in a project. *Judgement:* does one category hide behind a good total?

## Code scanning and production coverage

**What good looks like**
- [moderate] A static scan counts every component and HTML element, tagged with the team that owns it, and divides system by all.
- [moderate] Every rendered system component carries a stable data attribute, so a production measure is possible later.

**How**
- [strong] react-scanner reports components and props, with counts or a raw report per usage, and no percentage ([react-scanner](https://github.com/moroshko/react-scanner)); Elastic's EUI scans every usage in Kibana and tags each with its module and code owners ([EUI usage analytics](https://github.com/elastic/eui/blob/main/packages/eui-usage-analytics/README.md)).
- [moderate] Preply renders `data-preply-ds-component`, colours border pixels green for system and red for not on users' devices, and divides: 77% in production while its static scan said about 25% of front-end code; it sets no target and reports per-team averages ([Preply](https://dev.to/noriste/visual-coverage-why-and-how-preply-measures-the-impact-of-the-design-system-part-i-3omb)).
- [weak] Primer accepted making `data-component` a stable public selector in February 2026, implementation pending ([Primer ADR-023](https://github.com/primer/react/blob/main/contributor-docs/adrs/adr-023-stable-selectors-api.md)); a component added to the page later may miss an attribute set at load ([Scottish Government](https://designsystem.gov.scot/guidance/tracking)).

**Check**
- *Judgement:* does the scanner see raw markup, and does a rendered component carry the attribute?

## Scope, scores and bands

**What good looks like**
- [moderate] The scope (which pages, which files, how recent) is decided before the formula, written beside the number and kept fixed between runs.
- [moderate] A total is always shown with each check's own share, so one weak check is not averaged away.
- [weak] Bands are a reading aid, not a target: no published research sets a threshold.

**How**
- [moderate] Pinterest scores only pages marked for handoff, in files edited in the last two weeks; GOV.UK re-checks a fixed list of live services weekly ([GOV.UK](https://team-playbook.design-system.service.gov.uk/analytics/using-service-explorer)).
- [weak] DesignOps.Tools bands at 0–40% low, 40–70% partial, 70–100% strong ([Coverage Report](https://designops-tools.pages.dev/coverage-report/)); the widget's 75 and 90 are the toolkit's own choice.
- [weak] Preply sets no target score; Pinterest saw 50% to 2% across teams and named no ideal; Sparkbox's maturity model makes adoption the headline only in its second stage ([Sparkbox](https://sparkbox.com/foundry/design_system_maturity_model)). Commentary argues adoption lags ([Dan Mall](https://v5.danmall.com/posts/in-search-of-a-better-design-system-metric-than-adoption/)).

**Cases**
- Checks at 99%, 50% and 100%: a plain average says 83, weighted by items judged (1,700, 400, 300) 91 → show the 50% beside the total.
- A design component used widely while its code twin is not (Pinterest's PageHeader, a code limitation) → measure both per component and read where they disagree.

**Check**
- *Script:* the widget shows each check and its scope. *Judgement:* has the scope moved since the last number it is compared with?

## Sources

All opened 2026-11-12.

- [Figma, library analytics](https://help.figma.com/hc/en-us/articles/360039238353) · [REST analytics endpoints](https://developers.figma.com/docs/rest-api/library-analytics-endpoints/) · [REST component endpoints](https://developers.figma.com/docs/rest-api/component-endpoints/) · [DetachedInfo](https://developers.figma.com/docs/plugins/api/DetachedInfo/) · [node properties](https://developers.figma.com/docs/plugins/api/node-properties/) · [Check designs](https://help.figma.com/hc/en-us/articles/39592284074263-Check-designs-in-Figma) · [Design systems 104](https://www.figma.com/blog/design-systems-104-making-metrics-matter/)
- [Pinterest](https://www.designsystems.com/how-pinterests-design-systems-team-measures-adoption) · [figma-calculations](https://github.com/pinterest/figma-calculations) · [Salesforce](https://www.salesforce.com/blog/figma-component-health/) · [Preply](https://dev.to/noriste/visual-coverage-why-and-how-preply-measures-the-impact-of-the-design-system-part-i-3omb) · [Brevo](https://engineering.brevo.com/how-to-track-design-system-adoption/) · [GOV.UK](https://team-playbook.design-system.service.gov.uk/analytics/using-service-explorer) · [Twilio](https://www.twilio.com/en-us/blog/insights-metrics-inform-paste-design-system)
- [react-scanner](https://github.com/moroshko/react-scanner) · [EUI](https://github.com/elastic/eui/blob/main/packages/eui-usage-analytics/README.md) · [Radius Tracker](https://github.com/rangle/radius-tracker) · [Omlet FAQ](https://github.com/zeplin/omlet/blob/main/docs/faqs/omlet-vs-react-scanner.md) · [Primer ADR-023](https://github.com/primer/react/blob/main/contributor-docs/adrs/adr-023-stable-selectors-api.md) · [Scottish Government](https://designsystem.gov.scot/guidance/tracking)
- [Atlassian](https://atlassian.design/components/eslint-plugin-design-system/ensure-design-token-usage/usage) · [stylelint-declaration-strict-value](https://github.com/AndyOGo/stylelint-declaration-strict-value) · [Polaris issue 4528](https://github.com/Shopify/polaris/issues/4528)
- Commentary: [Sparkbox maturity model](https://sparkbox.com/foundry/design_system_maturity_model) · [Dan Mall](https://v5.danmall.com/posts/in-search-of-a-better-design-system-metric-than-adoption/) · [Coverage Report](https://designops-tools.pages.dev/coverage-report/) (a vendor's page)
