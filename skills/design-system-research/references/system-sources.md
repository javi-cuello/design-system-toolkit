# System roster: where the primary sources live

A field guide to the design systems worth mining. For each, it says what the system is good evidence for and where its primary sources live.

## Contents

- [How to pick from it](#how-to-pick-from-it)
- [Product design systems (web-first)](#product-design-systems-web-first)
- [Platform systems (the native outliers)](#platform-systems-the-native-outliers)
- [Government and accessibility-first (the assumption-breakers)](#government-and-accessibility-first-the-assumption-breakers)
- [Smaller systems with unusually public reasoning](#smaller-systems-with-unusually-public-reasoning)
- [Outside the Western, Latin-script default (the cluster-breakers)](#outside-the-western-latin-script-default-the-cluster-breakers)
- [Community, small-team and headless systems (the constraint-matchers)](#community-small-team-and-headless-systems-the-constraint-matchers)
- [Dormant, historic and reduced-investment systems (the survivorship correction)](#dormant-historic-and-reduced-investment-systems-the-survivorship-correction)
- [Token files beyond the usual cluster](#token-files-beyond-the-usual-cluster)
- [User-outcome research (outranks adoption evidence)](#user-outcome-research-outranks-adoption-evidence)
- [Standards and tooling](#standards-and-tooling)
- [Cross-system indexes and survey data](#cross-system-indexes-and-survey-data)
- [Commentary tier (label when used)](#commentary-tier-label-when-used)

## How to pick from it

- Select 5 to 8 systems per investigation. Span the range of approaches on your axes.
- Always include at least one outlier context: government, native platform or enterprise.
- Where the topic allows, add one system from outside the Western corporate cluster. Add one community, small-team or headless system too. SKILL.md Step 3 says why.
- The best queries pair a system's name with "migration", "tokens", "rename", "deprecated", "RFC" or "discussion". The arguments teach more than the docs.
- For a lineage check, add "inspired by", "based on" or the suspected origin system's name. That finds who copied whom.

## Product design systems (web-first)

| System | Sources | Good evidence for |
|---|---|---|
| Shopify Polaris | `polaris.shopify.com`, `github.com/Shopify/polaris` (and the archived polaris-react) | Measured outcomes: about 8% typography token coverage drove the v10 refresh. A two-layer primitive and semantic token split. Numeric-hundreds scales, API escape hatches (`Text` with `as` and `fontWeight`) and deprecation practice. Its discussions and PRs record naming debates word for word. |
| GitHub Primer | `primer.style`, `github.com/primer/primitives` | Functional shorthand tokens. Literal weight primitives with values. The documented `@` hack for a default value in a token group. A stated position on Figma styles against variables. Why rem serves accessibility. |
| Atlassian Design System | `atlassian.design`, the `@atlaskit/tokens` package, the Atlassian design blog | Composite `font` shorthand tokens. Variable-font weights in production (weight 653). Font-family tokens named by role, and a `metric` role earned by behaviour. A published Figma style to code token table, the artefact to imitate. "Implementing typography at scale" for migration reasoning. |
| IBM Carbon | `carbondesignsystem.com` (with the v10 and v11 subdomain archives), `github.com/carbon-design-system/carbon` | Ordinal naming and its costs. The v10 to v11 move from productive and expressive to fixed and fluid: a naming scheme abolished, with reasons given. Fluid type with breakpoint maps in the SCSS source. Renames by default-by-omission (`body` against `body-compact`). |
| Adobe Spectrum | `spectrum.adobe.com`, `github.com/adobe/spectrum-css`, `github.com/adobe/spectrum-tokens` | Role components with t-shirt modifiers. Numeric scales on a 1.125 ratio. The historical PRs that added t-shirt sizing. |
| Salesforce Lightning | `lightningdesignsystem.com` | Where design tokens began: the term was coined on this system in 2014. Enterprise theming. |
| Microsoft Fluent 2 | `fluent2.microsoft.design`, `github.com/microsoft/fluentui`, `github.com/microsoft/fluentui-apple` | One token system documented on five platforms: Web, Windows, iOS, Android and macOS. That makes it the clearest evidence on what survives cross-platform parity. A stated global and alias split. A messy rename lineage: Fabric, then Fluent UI, then Fluent 2, with React v8 to v9 rebuilt on a new styling engine. Messy migrations teach more than clean ones. |
| Twilio Paste | `paste.twilio.design`, `github.com/twilio-labs/paste` | A naming grammar published as a rule: `$type-category-instance-variant-state`. An alias layer under the semantic tokens. Accessibility as a release gate: no component ships below WCAG 2.1 AA. So its component docs record what that constraint costs. |
| Spotify Encore | No public docs site; spotify.design articles, conference talks and Figma blog posts | The "system of systems" shape. A shared Foundation sits over Web and Mobile subsystems, with local team libraries below. A stated path promotes a local component to a shared one. The best account here of federation inside one company, the shape most in-house readers face. Label it commentary: the primary artefacts are not public. |
| SAP Fiori | `sap.com/design/design-system`, `experience.sap.com/fiori-design-web` (plus the iOS and Android guideline sites) | Enterprise scale with a fully public guideline set. The Horizon rollout retheme: new palette, rounded shapes, new icon font and retuned type. It shipped as a theme users switch to, not as rename and deprecate. A different answer to moving a system thousands of products depend on. |

## Platform systems (the native outliers)

| System | Sources | Good evidence for |
|---|---|---|
| Google Material | `m3.material.io`, `material-web.dev`, the Compose Material 3 docs, the Angular Material docs | The M2 to M3 consolidation, the best rename story there is. 13 styles became 5 roles, deleting `subtitle`, `overline` and the h-named `headline1–6`. Role-based naming and baked-in weights, with a parallel `emphasized` set that names weight by meaning. Angular Material's configurable element-mapping table. Compare the M2 and M3 docs directly: the difference is the finding. |
| Apple Human Interface Guidelines | `developer.apple.com/design/human-interface-guidelines` | Fully semantic roles with no size. Weight as identity: `Headline` means semibold. Dynamic Type is why role names can drop the size axis. The convention of handing off style names, not pixels. |

## Government and accessibility-first (the assumption-breakers)

| System | Sources | Good evidence for |
|---|---|---|
| GOV.UK Design System | `design-system.service.gov.uk`, `github.com/alphagov/govuk-frontend`, designnotes.blog.gov.uk, accessibility.blog.gov.uk | Scale points named by pixel value, and every documented cost of that. Responsive values make the names approximate, v6 changed values, and scale points were removed. Element and class kept apart by a team serious about accessibility. Heading policies per page type. Reasons for change published as blog posts. |
| CMS.gov Design System | `design.cms.gov` | "Separate semantics from presentation", stated outright as policy for headings. |
| USWDS | `designsystem.digital.gov` | Numeric token grammars across every property. Federal accessibility reasoning. |
| NL Design System | `nldesignsystem.nl`, `github.com/nl-design-system` | Governance as the main architecture. It is a shared standard plus unthemed components. Any Dutch government body adopts them and skins them in its own style. City and national teams decide together, in public repos under the EUPL, which components earn a place. The strongest counter-model here to the single-owner system, and the only non-English government evidence. |

## Smaller systems with unusually public reasoning

| System | Sources | Good evidence for |
|---|---|---|
| GitLab Pajamas | `design.gitlab.com`, the GitLab issue tracker | `default` as an explicit anchor in relative token groups (`border.color.default`, `subtle`, `strong`). Design decisions argued in public issues. |
| SNCF WCS and similar mid-size systems | Their GitLab or GitHub issues | Candid conclusions in issue threads, such as heading tokens not bound to HTML levels. Mid-size systems often say plainly what large ones bury. |
| LSEG/Refinitiv and legacy enterprise systems | Their docs and libraries | Counter-examples: patterns the consensus rejected, such as weight-modifier classes that multiply style counts. Keep one in every comparison to keep the pros and cons honest. |

## Outside the Western, Latin-script default (the cluster-breakers)

The sections above form a Western, English-speaking, corporate cluster that copies itself. It is also Latin-script, left-to-right and single-locale, which hides a second set of assumptions.

The systems below grew under other constraints. These include CJK type (line height, no italics, different weight rendering), bidirectional text, hundreds of locales, other density norms and huge user bases. They are primary evidence on equal terms, not curiosities.

| System | Sources | Good evidence for |
|---|---|---|
| Ant Design | `ant.design`, `github.com/ant-design/ant-design` (a huge public issue history, many debates in two languages) | One of the largest adoption footprints anywhere. A fully public token overhaul: v4 to v5 moved to a seed, map and alias algorithm. That is a different architecture from the Western two-layer norm. Density and compact-mode reasoning from data-heavy enterprise products in China. |
| TDesign (Tencent) | `tdesign.tencent.com`, `github.com/Tencent/tdesign` | Parity across many frameworks as a first-class constraint. CJK-first type decisions documented in the open. |
| Arco Design (ByteDance) | `arco.design` | Theming as a service, through its token platform. Another independent answer to questions the Western cluster answers alike. |
| Semi Design (ByteDance/Douyin) | `semi.design`, `github.com/DouyinFE/semi-design` | The far end of the token-count ladder: it advertises 3000+ tokens as a feature. The Western cluster treats token count as a cost. A design-to-code and code-to-design round trip shipped as product, through its Figma plugin and DSM theming tool. The strongest evidence against the idea that the pipeline runs one way only. |
| LINE Design System | `designsystem.line.me` | Japanese and Korean type and density, with public component guidance. Know the limit first: the guidance is public, but the library files and code are not. So it is documentation evidence only. |
| Wikimedia Codex | `doc.wikimedia.org/codex`, `github.com/wikimedia/design-codex` (a Gerrit mirror), `phabricator.wikimedia.org` for the arguments | Bidirectional text as a first-class constraint, not a late fix. Two direction-specific stylesheets. Components that read text direction and change arrow-key behaviour. Written rules for which icons mirror in RTL and which must not. The only non-profit system here, serving hundreds of languages, with every decision argued in a public tracker. |

## Community, small-team and headless systems (the constraint-matchers)

Most readers' constraints look like these systems, not Google's. Their evidence answers what works without a dedicated design-systems team. Headless libraries answer behaviour questions with no visual opinion attached.

| System | Sources | Good evidence for |
|---|---|---|
| Radix Primitives, React Aria, Base UI | `radix-ui.com`, `react-spectrum.adobe.com/react-aria`, `base-ui.com` | Behaviour and accessibility contracts kept apart from visual style. When the question is what a component is without its paint, these are the primary source. So is the WAI-ARIA Authoring Practices Guide (`w3.org/WAI/ARIA/apg`). |
| shadcn/ui | `ui.shadcn.com`, its GitHub discussions | Copy-paste ownership as a counter-model to packaged systems: a deliberate break from the usual distribution model. CSS-variable theming conventions that spread across the community. |
| Chakra UI, Mantine, DaisyUI | Their docs and repos | The economics of a small maintainer team. What token and API complexity a team without corporate staff can sustain. Their breaking-change discussions are candid about upkeep. |
| Open Props, Pico CSS | `open-props.style`, `picocss.com` | CSS-first, no-build minimalism. A shipping counter-example to the idea that a token pipeline is required. |

## Dormant, historic and reduced-investment systems (the survivorship correction)

Everything above is a system someone still pays for. SKILL.md Step 3 asks for the other half on equal terms, and it lives here. An approach's costs show most clearly in systems that stopped, shrank or were left behind. Check dates before citing one of these as present practice. Being out of date is the point, not a defect.

| System | Sources | Good evidence for |
|---|---|---|
| BBC GEL | `bbc.co.uk/gel`, `bbc.github.io/gel` (technical guides; the copyright read 2021 as of 2026-08) | A public-service broadcast context no other system here has. A type scale derived from viewport and main input method, not from a ratio. Accessibility framed by a universal-access remit. Read it as a 2021 snapshot of a well-funded system, and note how much of the old scale still holds. |
| Airbnb DLS | No public docs site; essays and talks by the team | The 2016-era "design language" framing much of the industry copied. It also proves the survivorship point. One of its decade's most-cited systems left no public primary source. So every claim about it is secondary and is labelled commentary. A check on any roster that lists only systems with good websites. |
| Uber Base Web | `base.uber.com` (design), `baseweb.design`, `github.com/uber/baseweb` | The override and theming API as a distribution model. A live case of reduced investment: the repo says Uber limits its engagement while mirroring internal work. No healthy system can show what happens when a sponsor's priorities move. |

## Token files beyond the usual cluster

For a token or naming question, the built token file is the primary source: the names as shipped, not as documented. Each package below is on npm, readable at `cdn.jsdelivr.net/npm/<package>@<version>/…`. Pin the version you read and name it.

These systems sit outside the Polaris, Primer, Carbon and Material cluster, and several argue their grammar in writing. The knowledge base's token-taxonomy page cites each one.

| System | Package and docs | Good evidence for |
|---|---|---|
| NL Design System tokens | `@nl-design-system-unstable/start-design-tokens`, `github.com/nl-design-system/documentatie` (handboek, design-tokens) | A written grammar, `prefix.block.element.modifier.property`, with modifiers in a fixed order. A shared middle tier across organisations, and free brand-tier names. Focus tokens protected from theming. Logical CSS properties in names. Docs in Dutch. |
| AWS Cloudscape | `@cloudscape-design/design-tokens`, `cloudscape.design/foundation/visual-foundation/design-tokens` | A documented Category, Type, Item, State order. Scaled against static spacing for density. A severity ladder beside status. |
| Wikimedia Codex tokens | `@wikimedia/codex-design-tokens`, the ADRs under `packages/codex-docs/docs/using-codex/adrs` | Tier rules written as ADRs: each tier references only the one below. Theme against mode. The t-shirt to numeric font-size rename, with its reason (ADR 13). |
| SAP theming parameters | `@sap-theming/theming-base-content` (`Base/baseLib/sap_horizon/css_variables.css`) | Over 1,500 parameters in a control, variant, state, property grammar. Focus as colour, width and style. A contrast threshold stored as a token. |
| HashiCorp Helios | `@hashicorp/design-system-tokens`, `MIGRATION-6.0.0.md` in `github.com/hashicorp/design-system` | A recent rename that moves the property before `color`, with a word-for-word old-to-new table. |
| Workday Canvas tokens | `@workday/canvas-tokens-web` (base, brand, sys) | A seven-step softest-to-strongest ladder. Themeable sets against locked status sets, marked in file comments. |
| Twilio Paste tokens | `@twilio-paste/design-tokens` | A weakest-to-strongest ladder on every property. Roles for product states. Borders and focus drawn as shadows. |
| Pinterest Gestalt | `gestalt-design-tokens` (vr-theme) | Base, sema and comp tiers as prefixes. State before property, the outlier. Double focus rings. Line-height files per script. |
| PatternFly 6 | `@patternfly/patternfly` (base/tokens), the patternfly-org design-tokens docs | A documented general-to-specific grammar with skippable segments. `clicked` for pressed. Spacing named by relationship (`action-to-action`). |
| Siemens iX | `@siemens/ix` | `std`, `soft` and `weak` text, and `inv-` for inverse. |
| Deutsche Telekom Scale | `@telekom/design-tokens` | Focus colours per background. Baseline against composition spacing. |
| Deutsche Bahn DB UX | `@db-ux/core-foundations` | Adaptive colour families. Responsive spacing with the device in the name. |
| Swiss Post | `@swisspost/design-system-tokens` | Figma collections as tiers. |
| Equinor EDS | `@equinor/eds-tokens` | An intent × fill × emphasis grammar. |
| Nordhealth | `@nordhealth/tokens` | Weak, weaker and weakest text. High-contrast healthcare themes. |
| Elastic EUI | `@elastic/eui-theme-borealis` | A data-dense product: a `risk` severity. |
| Grafana | grafana/grafana `createColors.ts` | A data-dense product: a contrast threshold and a hover factor. |
| GitLab Pajamas tokens | `@gitlab/ui` (`src/tokens`) | Feedback against status, with a decision table. |
| Kiwi Orbit | `@kiwicom/orbit-design-tokens` | Renames from t-shirt to numeric sizes. |
| Skyscanner Backpack | `@skyscanner/bpk-foundations-web` | The mode in the name: `-day` and `-night`. |
| Red Hat | `@rhds/tokens` | The mode in the name: `-on-light` and `-on-dark`. |
| Zendesk Garden | `@zendeskgarden/react-theming` | States computed rather than stored. |
| HPE, Razorpay Blade | `hpe-design-tokens`, `@razorpay/blade` | More built names from the same group; no single feature singled out. |

The European systems (Siemens iX to Nordhealth) cover industry, transport, telecom, energy and healthcare, each with a distinct answer.

## User-outcome research (outranks adoption evidence)

That many systems ship a pattern proves it survives in organisations, not that it helps users. When these sources speak to the topic, they outrank the roster above.

| Source | Where | What it gives |
|---|---|---|
| GOV.UK design research | designnotes.blog.gov.uk, accessibility.blog.gov.uk, the "research" tab on Design System component pages | A rare team that publishes the user research behind component decisions. A component's research tab is top-tier evidence. |
| WebAIM surveys | `webaim.org/projects` (Screen Reader, Low Vision and Million surveys) | Data on what assistive-technology users use and meet. It grounds accessibility claims in measurement, not convention. |
| Academic and practitioner studies | ACM/CHI accessibility papers, Nielsen Norman Group studies | Use them when a pattern's usability is claimed but unmeasured elsewhere. Label NN/g as commercial research; its methods vary. If no user research exists for a widely shipped pattern, say so in the output. That absence is a finding. |

## Standards and tooling

Always check for the slice relevant to the topic.

| Source | Where | What it gives |
|---|---|---|
| W3C Design Tokens Community Group (DTCG) | `designtokens.org`, `w3.org/community/design-tokens` | Spec status, composite token types and the editors. Check the date of the latest stable version. |
| Figma | `figma.com/best-practices`, `help.figma.com`, `forum.figma.com` (staff-answered threads), Config announcements | Current styles and variables mechanics, picker behaviour, and known limits confirmed by staff. Always search for the latest release notes: this changes several times a year. |
| Style Dictionary, Tokens Studio | Their docs and repos | Pipeline reality: what transforms exist and what workarounds they encode. Workarounds document platform gaps better than the platform does. |
| Open UI (W3C Community Group) | `open-ui.org`, `open-ui.org/design-systems`, `github.com/openui` | Each proposal's research phase tables how many systems and platforms name, build and run a component, before any spec. That is SKILL.md Steps 4 and 5 done in public. Read its list of systems against yours. It also shows which conventions the platform is absorbing, which retires the question entirely. |
| MDN, the HTML and CSS specs, WCAG | Their sites | The platform facts that anchor accessibility arguments, such as heading navigation and spec changes like the removed h1-in-section styling. |

## Cross-system indexes and survey data

These are accelerators, not sources. They speed up SKILL.md Steps 3 and 4. Neither is citable on its own. An index is a route to a primary source, and a survey measures the practice, not any system in it.

| Source | Where | How to use it |
|---|---|---|
| The Component Gallery | `component.gallery` | It maps one component to its names across systems (Accordion, Collapse, Disclosure, Expander) and links each system's own docs. Use it to reach primary sources fast. Use it to test whether a naming disagreement is real. Then cite what it points at, never the index. |
| Design-system practice surveys | `report.zeroheight.com` (the yearly Design Systems Report), the sparkbox.com surveys from 2018 to 2022 | Numbers about the practice: token adoption, dedicated or borrowed teams, where adoption stalls and why. Samples are self-selected and in the low hundreds, so treat them as directional and say so. Directional data still beats the anecdote it replaces. Sparkbox's run ended in 2022; read with zeroheight's, the two make a time series. This is adoption evidence, which user-outcome research outranks. |

## Commentary tier (label when used)

Practitioner writing explains why far better than documentation does. Some of it sits close to the specs. The label still goes in the output either way.

| Area | Who | What it gives |
|---|---|---|
| Naming, structure and token authoring | Nathan Curtis / EightShapes, Nate Baldwin, Brad Frost, Jina Anne | Curtis's naming and type essays best state the why. Baldwin on token and colour-system authoring. Frost for the atomic design vocabulary. Anne named design tokens at Salesforce in 2014 and co-chairs the DTCG: read her for the intent the spec does not record. |
| Practice, governance and contribution | Amy Hupe (amyhupe.co.uk), Dan Mall (*Design That Scales*), Alla Kholmatova (*Design Systems*) | Hupe on contribution models, why they fail and who contributes, from GOV.UK on. Mall on running a system as a practice, not a library. Kholmatova on design language and pattern vocabulary. Staffing, funding and contribution rarely show in primary artefacts. So a governance question leans on this tier, and should say it does. |
| Accessibility patterns (near-primary: say which) | Heydon Pickering (*Inclusive Components*), Adrian Roselli (adrianroselli.com), Scott O'Hara (scottohara.me), Sara Soueidan | They argue from the HTML and ARIA specs and test with real assistive technology. So they outrank ordinary commentary, and are the strongest evidence when a common pattern has no published user research. Where one contradicts a shipping system, report the contradiction; do not average it away. |
| Live tensions | The figma.com community forum | Designer against developer disagreement in the raw. Quote the tension, then settle it with primary evidence. |
