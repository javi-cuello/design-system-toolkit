# System Roster: Where the Primary Sources Live

A field guide to consolidated design systems worth mining, what each is uniquely good evidence for, and where to find their primary sources. Select 5–8 per investigation, spanning the spectrum of approaches on your axes, and always include at least one outlier context (government, native-platform, or enterprise) — plus, where the topic allows, at least one system from outside the Western corporate cluster and one community/small-team/headless system, per the balance guidance in SKILL.md.

Searching tip: for any system, the highest-yield queries combine the system name with "migration", "tokens", "rename", "deprecated", "RFC", or "discussion" — the arguments are more informative than the docs. For lineage checks, add "inspired by", "based on", or the suspected origin system's name to find who copied whom.

## Product design systems (web-first)

**Shopify Polaris** — polaris.shopify.com · github.com/Shopify/polaris (and archived polaris-react) Uniquely good for: measured-outcome retrospectives (the ~8% typography token coverage story behind the v10 refresh), primitive/semantic two-layer token architecture, numeric-hundreds scales, component API escape hatches (`Text` with `as` and `fontWeight`), deprecation practice. Their GitHub discussions and PRs record naming debates verbatim.

**GitHub Primer** — primer.style · github.com/primer/primitives Uniquely good for: functional/shorthand token patterns, literal weight primitives with values, the documented `@`-hack for default values in token groups, an explicitly stated Figma styles-vs-variables position, rem/accessibility unit rationale.

**Atlassian Design System** — atlassian.design · @atlaskit/tokens package artifacts · Atlassian design blog Uniquely good for: composite `font` shorthand tokens, variable-font weights in production (weight 653), role-named font-family tokens, the dedicated `metric` role (role-earned-by-behaviour), a published Figma-style↔code-token mapping table (the documentation artefact to imitate), and "Implementing typography at scale" for migration reasoning.

**IBM Carbon** — carbondesignsystem.com (plus v10./v11. subdomain archives) · github.com/carbon-design-system/carbon Uniquely good for: ordinal naming and its costs, the v10→v11 migration (productive/expressive → fixed/fluid — a naming-convention abolition with stated reasons), fluid/responsive type with breakpoint maps in SCSS source, default-by-omission renames (`body` vs `body-compact`).

**Adobe Spectrum** — spectrum.adobe.com · github.com/adobe/spectrum-css and spectrum-tokens Uniquely good for: role components with t-shirt modifiers, 1.125-ratio numeric scales, historical PRs adding t-shirt sizing.

**Salesforce Lightning** — lightningdesignsystem.com Uniquely good for: design-token origin history (tokens were coined here, on this system, in 2014) and enterprise theming.

**Microsoft Fluent 2** — fluent2.microsoft.design · github.com/microsoft/fluentui · github.com/microsoft/fluentui-apple Uniquely good for: one token system documented across five platforms at once (Web, Windows, iOS, Android, macOS), which makes it the clearest evidence available on what survives a cross-platform parity constraint; a stated global/alias two-layer split; and an unusually messy rename lineage — Fabric → Fluent UI → Fluent 2, with React v8→v9 rebuilt on a different styling engine underneath. Messy migrations teach more than clean ones.

**Twilio Paste** — paste.twilio.design · github.com/twilio-labs/paste Uniquely good for: a token naming grammar published as a rule rather than left as a habit (`$type-category-instance-variant-state`), an alias layer sitting beneath the semantic tokens, and accessibility stated as a release gate — they do not ship a component below WCAG 2.1 AA, so their component docs double as a record of what that constraint costs.

**Spotify Encore** — no public documentation site; the evidence is spotify.design articles and the team's conference and Figma-blog write-ups Uniquely good for: the "system of systems" shape — a shared Foundation with Web and Mobile subsystems beneath it and local team libraries below those, plus a stated promotion path from local component to shared one. The roster's best account of intra-company federation, and the shape most in-house readers actually face. Label it commentary: the primary artefacts are not public.

**SAP Fiori** — sap.com/design/design-system · experience.sap.com/fiori-design-web (plus the iOS and Android guideline sites) Uniquely good for: enterprise scale with an exhaustively public guideline set, and the Horizon rollout — a whole-system retheme (new palette, rounded shapes, new icon font, retuned typography) delivered as a theme users switch to, rather than as the rename-and-deprecate migration the rest of the roster demonstrates. A different answer to "how do you move a system that thousands of products depend on."

## Platform systems (the native outliers)

**Google Material** — m3.material.io · material-web.dev · Compose Material 3 docs · Angular Material docs Uniquely good for: the M2→M3 consolidation (13 styles → 5 roles, deleting `subtitle`/`overline` and the h-named `headline1–6` — the single best rename story available), role-based naming, baked-in weights, the parallel `emphasized` set as semantic weight naming, and Angular Material's configurable element-mapping table. Compare M2 and M3 docs directly; the delta is the finding.

**Apple Human Interface Guidelines** — developer.apple.com/design/human-interface-guidelines Uniquely good for: fully semantic size-less roles, weight-as-identity (`Headline` means semibold), Dynamic Type as the reason role names can drop the size axis, and the hand-off-style-names-not-pixels convention.

## Government / accessibility-first (the assumption-breakers)

**GOV.UK Design System** — design-system.service.gov.uk · github.com/alphagov/govuk-frontend · designnotes.blog.gov.uk and accessibility.blog.gov.uk Uniquely good for: value-literal (pixel-named) scale points and every documented cost of them (breakpoint-responsive values making names approximate, v6 revaluations, removed scale points), element-vs-class decoupling done by an accessibility-obsessed team, per-page-type heading policies, and change rationale published as blog posts.

**CMS.gov Design System** — design.cms.gov Uniquely good for: the "separate semantics from presentation" principle stated explicitly as policy for headings.

**USWDS** — designsystem.digital.gov Uniquely good for: numeric token grammars across all properties and federal accessibility rationale.

**NL Design System** — nldesignsystem.nl · github.com/nl-design-system Uniquely good for: governance as the primary architecture. It is not one system but a shared standard plus unthemed components that any Dutch government organisation adopts and skins in its own house style, with municipal and national teams deciding together — in public repos, under the EUPL — which components have earned a place. The roster's strongest counter-model to the single-owner design system, and its only non-Anglophone government evidence.

## Smaller systems with unusually public reasoning

**GitLab Pajamas** — design.gitlab.com · GitLab issue tracker Uniquely good for: `default` as an explicit anchor in relative token groups (`border.color.default`/`subtle`/`strong`), and design decisions argued in public issues.

**SNCF WCS and similar mid-size systems** — their GitLab/GitHub issues Uniquely good for: candid issue-thread conclusions (e.g., heading tokens not bound to HTML semantics). Mid-size systems often say plainly what large systems bury.

**LSEG/Refinitiv, and legacy enterprise systems** Uniquely good for: counter-examples — patterns the consensus rejected (weight-as-modifier classes multiplying style counts). Keep one of these in every comparison to keep pros/cons honest.

## Outside the Western, Latin-script default (the cluster-breakers)

The sections above are a Western, Anglophone, corporate cluster that copies itself — and it is also a Latin-script, left-to-right, effectively single-locale cluster, which hides a second set of assumptions behind the first. The systems below evolved under different constraints — CJK typography (line-height, no italics, different weight rendering), bidirectional text, hundreds of locales, different density and information-hierarchy norms, and enormous user bases — and are primary evidence on equal terms, not curiosities.

**Ant Design** — ant.design · github.com/ant-design/ant-design (huge public issue history, many debates bilingual) Uniquely good for: one of the largest adoption footprints anywhere, a fully public token overhaul (v4→v5 moved to a seed/map/alias token algorithm — a genuinely different token architecture than the Western two-layer norm), and density/compact-mode reasoning driven by data-heavy enterprise Chinese products.

**TDesign (Tencent)** — tdesign.tencent.com · github.com/Tencent/tdesign Uniquely good for: multi-framework parity as a first-class constraint and CJK-first typography decisions documented in the open.

**Arco Design (ByteDance)** — arco.design Uniquely good for: theming-as-a-service (its token platform) and another independent answer to questions the Western cluster answers uniformly.

**Semi Design (ByteDance/Douyin)** — semi.design · github.com/DouyinFE/semi-design Uniquely good for: the far end of the token-count ladder — they advertise 3000+ tokens as a feature, where the Western cluster treats token count as a cost to minimise — and a design-to-code *and* code-to-design round trip shipped as product (their Figma plugin plus a DSM theming tool). The strongest counter-evidence available to the assumption that the pipeline only runs one way.

**LINE Design System** — designsystem.line.me Uniquely good for: Japanese and Korean typography and density conventions with public component guidance. Note the limit before citing it: the guidance is public, the library files and code components are not, so it is documentation evidence only.

**Wikimedia Codex** — doc.wikimedia.org/codex · github.com/wikimedia/design-codex (mirror of Gerrit) · phabricator.wikimedia.org for the arguments Uniquely good for: bidirectionality as a first-class design constraint rather than a late fix — two direction-specific stylesheets, components that read surrounding text direction and change arrow-key behaviour, and documented rules for which icons mirror in RTL and which must not. Also the roster's only non-profit, volunteer-adjacent system, serving hundreds of languages with no commercial product behind it, and one that argues every decision in a public tracker.

## Community, small-team, and headless systems (the constraint-matchers)

Most readers' constraints resemble these systems, not Google's. Their evidence answers "what works without a dedicated design-systems team," and headless libraries answer behaviour questions with no visual opinion attached.

**Radix Primitives / React Aria / Base UI** — radix-ui.com · react-spectrum.adobe.com/react-aria · base-ui.com Uniquely good for: behaviour and accessibility contracts isolated from visual style — when the question is "what *is* this component, minus the paint," these plus the WAI-ARIA Authoring Practices Guide (w3.org/WAI/ARIA/apg) are the primary source.

**shadcn/ui** — ui.shadcn.com · its GitHub discussions Uniquely good for: the copy-paste-ownership counter-model to packaged systems (a deliberate rejection of the consensus distribution model), and CSS-variable theming conventions that spread community-wide.

**Chakra UI / Mantine / DaisyUI** — their docs and repos Uniquely good for: small-maintainer-team economics — what token and component-API complexity is sustainable without corporate staffing; their breaking-change discussions are candid about maintenance cost.

**Open Props / Pico CSS** — open-props.style · picocss.com Uniquely good for: CSS-first, no-build minimalism — a shipping counter-example to the assumption that a token pipeline is mandatory.

## Dormant, historic, and reduced-investment systems (the survivorship correction)

Everything above is a system someone is still paying for. SKILL.md Step 3 asks for the other half on equal terms, and this is where it lives: the costs of an approach show up most clearly in systems that stopped, shrank, or were left behind. Check dates before citing any of these as present practice — that they are out of date is the point, not a defect.

**BBC GEL** — bbc.co.uk/gel · bbc.github.io/gel (technical guides, copyright last reading 2021 as of 2026-08) Uniquely good for: a public-service broadcast context nobody else in the roster occupies, a typographic scale derived from viewport *and primary input method* rather than from a ratio, and accessibility framing driven by a universal-access remit. Read it as a 2021 snapshot of a well-funded system, and note how much of a five-year-old scale still holds.

**Airbnb DLS** — no public documentation site; the evidence is essays and talks by the team Uniquely good for: the 2016-era "design language" framing that much of the industry copied, and for the survivorship point itself — one of the most-cited systems of its decade left no public primary source, so every claim about it is secondary and must be labelled as commentary. A useful correction whenever a roster starts to look like a list of systems that happen to have good websites.

**Uber Base Web** — base.uber.com (design) · baseweb.design · github.com/uber/baseweb Uniquely good for: the override/theming API as a distribution model, and as a live case of reduced investment — the repo states Uber limits its engagement while mirroring internal work. What happens to a public system when its sponsor's priorities move is evidence no healthy system can give you.

## User-outcome research (outranks adoption evidence)

That many systems ship a pattern proves organizational survival, not user benefit. When these sources speak to the topic, they outrank the roster above.

**GOV.UK design research** — designnotes.blog.gov.uk · accessibility.blog.gov.uk · component "research" tabs in the Design System The rare team that publishes the user research behind component decisions; the research tab on a component page is top-tier evidence.

**WebAIM surveys** — webaim.org/projects (Screen Reader, Low Vision, and Million surveys) Empirical data on what assistive-technology users actually use and encounter; grounds accessibility claims in measurement rather than convention.

**Academic and practitioner studies** — ACM/CHI accessibility papers, Nielsen Norman Group studies (label NN/g as commercial research; methodology varies) Use when a pattern's usability is asserted but unmeasured elsewhere — and if no user research exists for a widely-shipped pattern, say so in the output; that absence is a finding.

## Standards and tooling (always check for the relevant slice)

**W3C Design Tokens Community Group (DTCG)** — designtokens.org · w3.org/community/design-tokens Spec status, composite token types, editor roster. Check the latest stable version date.

**Figma** — figma.com/best-practices · help.figma.com · forum.figma.com (staff-answered threads) · Config announcements Current styles/variables mechanics, picker behaviour, known limitations with staff confirmation. Always search for the latest release notes — this changes several times a year.

**Style Dictionary / Tokens Studio** — their docs and repos Pipeline reality: what transforms exist, what workarounds they encode (workarounds document platform gaps better than the platform does).

**Open UI (W3C Community Group)** — open-ui.org · open-ui.org/design-systems · github.com/openui Uniquely good for: the research phase of each proposal, which tabulates how a component is named, structured and behaved across many design systems and native platforms *before* any spec is drafted — Steps 4 and 5 already done, in public, for the components it covers. Their own roster of systems-used-for-research is worth reading against yours. Also the direction of travel: which design-system conventions are being absorbed into the platform, which retires the convention question entirely.

**MDN / HTML & CSS specs / WCAG** — for the platform facts that anchor accessibility arguments (heading navigation, spec changes like the h1-in-section styling removal).

## Cross-system indexes and survey data (accelerators, not sources)

These speed up Steps 3 and 4. Neither tier is citable on its own: an index is a route to a primary source, and a survey measures the practice rather than any system in it.

**The Component Gallery** — component.gallery Maps one component to its aliases across published systems (Accordion / Collapse / Disclosure / Expander) and links out to each system's own documentation. Use it to reach primary sources fast and to test whether a naming disagreement is real or imagined — then cite what it points at, never the index.

**Design-system practice surveys** — report.zeroheight.com (annual Design Systems Report) · sparkbox.com design systems surveys, 2018–2022 Numbers about the *practice* rather than about a system: token adoption rates, whether teams are dedicated or borrowed, where adoption stalls and why. Self-selected samples in the low hundreds, so treat them as directional and say so — but directional data beats the anecdote it replaces, and Sparkbox's run ending in 2022 makes the two together a time series worth reading in order. This is adoption evidence, which the user-outcome section above outranks.

## Commentary tier (label when used)

Practitioner writing explains *why* far better than documentation does, and some of it sits close enough to the specs to be near-primary. The label still goes in the output either way.

**Naming, structure, and token authoring** — Nathan Curtis / EightShapes (naming and typography essays; the best articulations of *why*), Nate Baldwin (token and colour-system authoring), Brad Frost (atomic design vocabulary), Jina Anne (named design tokens at Salesforce in 2014 and co-chairs the DTCG — read for the intent behind the format the spec now encodes, which the spec itself does not record).

**Practice, governance, and contribution** — Amy Hupe (amyhupe.co.uk: contribution models, why they fail, and who actually contributes — from GOV.UK and afterwards), Dan Mall (*Design That Scales*, on running a system as a practice rather than a library), Alla Kholmatova (*Design Systems*, on design language and pattern vocabulary). This tier carries the governance axis almost alone: how a system is staffed, funded and contributed to is rarely visible in any primary artefact, so an investigation that touches governance will lean here and should say it is leaning.

**Accessibility patterns (near-primary — say which)** — Heydon Pickering (*Inclusive Components*), Adrian Roselli (adrianroselli.com), Scott O'Hara (scottohara.me), Sara Soueidan. These outrank ordinary commentary because they argue from the HTML and ARIA specifications and test against real assistive technology rather than from convention — which makes them the strongest evidence available when a widely-shipped pattern turns out to have no published user research behind it. Where one of them contradicts a shipping system, report the contradiction; do not average it away.

**Live tensions** — figma.com community forum debates (good for capturing designer-versus-developer disagreement in the raw — quote the tension, then resolve it with primary evidence).
