# When should a design system split into more than one component library?

When a second component library is justified, and what stays shared, for teams deciding whether a new surface needs its own.

The product team is starting a native app, and the marketing team is rebuilding the company site. In the planning meeting someone suggests duplicating the Figma library: a "Mobile" copy for the app, a "Web" copy for the site, each free to move at its own pace. Six months later the two Buttons have different padding, the same bug is fixed twice, and nobody can say which file owns the date picker.

A second component library is justified by a seam that already exists in the runtime or in who authors the pages, never by screen size, visual style, brand or the org chart. The systems that split well split the components and share everything underneath, and when the halves drift they fix the shared layer rather than merging.

---

## What this answers

- [Splits versus breakpoints](#splits-versus-breakpoints): whether a split is a breakpoint question
- [Reasons to split](#reasons-to-split): what earns a separate library
- [The shared foundations](#the-shared-foundations): what is always shared
- [The cost of splitting](#the-cost-of-splitting): what splitting costs
- [A starting structure](#a-starting-structure): what structure a system starts from

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs. How a single library stretches across widths is the companion piece, [Where responsive behaviour belongs in a Figma library](responsive-components-in-figma.md).

---

## Splits versus breakpoints

A split is not a breakpoint question: a breakpoint is a width, a library boundary is a technical and organisational seam, and the two meet in exactly one place, the token layer.

It's tempting to treat the native app's library as the far end of the responsive range, one step past tablet. If the app is just a narrower screen, the reasoning goes, it needs a narrower copy of the components.

Real splits don't follow width at all. Adobe runs two design systems for two surfaces that are both desktop-and-mobile web. Atlassian has a brand design system, created by marketing, beside its product system. No amount of auto layout would have prevented either split, because neither was about how wide the screen is.

So the useful question is a different one: what property of a surface makes it expensive to keep in the same library as another?

Before anyone asks how wide the new surface is, ask how it's rendered and who authors it. **Width belongs to the library you already have; a split answers a different question.**

---

## Reasons to split

Three properties earn a separate library (a different rendering runtime, a different authoring environment, and the different component vocabulary those two produce); a different visual style, team or brand does not, and release cadence sits between.

Back in the planning meeting, the case for the "Mobile" copy rests on several reasons at once: the app looks a little different, a different squad builds it, and it ships on its own schedule. The figure sorts seven such reasons by where each one belongs.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 318" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Seven properties of a surface, each marked as justifying a separate component library or belonging in tokens and governance. Rendering runtime, authoring environment and component vocabulary justify a split; release cadence is marked on both sides; visual style, team and brand belong in tokens or governance.</title><rect width="880" height="318" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="317" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">What earns a separate component library</text><text x="640" y="62" font-size="11" fill="#9A948B">split</text><text x="740" y="62" font-size="11" fill="#9A948B">tokens or governance</text><line x1="32" y1="72" x2="848" y2="72" stroke="#DFDAD2"/><text x="44" y="98" font-size="12.5" fill="#1C1B19">Different rendering runtime</text><circle cx="648" cy="94" r="5.5" fill="#A6552F"/><line x1="32" y1="111" x2="848" y2="111" stroke="#EDEAE4"/><text x="44" y="128" font-size="12.5" fill="#1C1B19">Different authoring environment</text><circle cx="648" cy="124" r="5.5" fill="#A6552F"/><line x1="32" y1="141" x2="848" y2="141" stroke="#EDEAE4"/><text x="44" y="158" font-size="12.5" fill="#1C1B19">Different component vocabulary</text><circle cx="648" cy="154" r="5.5" fill="#A6552F"/><line x1="32" y1="171" x2="848" y2="171" stroke="#EDEAE4"/><text x="44" y="188" font-size="12.5" fill="#1C1B19">Different release cadence</text><circle cx="648" cy="184" r="5.5" fill="#FFFFFF" stroke="#B08040" stroke-width="1.6"/><circle cx="790" cy="184" r="5.5" fill="#FFFFFF" stroke="#B08040" stroke-width="1.6"/><line x1="32" y1="201" x2="848" y2="201" stroke="#EDEAE4"/><text x="44" y="218" font-size="12.5" fill="#1C1B19">Different visual style</text><circle cx="790" cy="214" r="5.5" fill="#FFFFFF" stroke="#8FA8B8" stroke-width="1.6"/><line x1="32" y1="231" x2="848" y2="231" stroke="#EDEAE4"/><text x="44" y="248" font-size="12.5" fill="#1C1B19">Different team</text><circle cx="790" cy="244" r="5.5" fill="#FFFFFF" stroke="#8FA8B8" stroke-width="1.6"/><line x1="32" y1="261" x2="848" y2="261" stroke="#EDEAE4"/><text x="44" y="278" font-size="12.5" fill="#1C1B19">Different brand</text><circle cx="790" cy="274" r="5.5" fill="#FFFFFF" stroke="#8FA8B8" stroke-width="1.6"/></svg>

Filled markers justify a separate component library; hollow markers belong in token modes or governance. Release cadence is the one that rarely decides on its own.

**Rendering runtime** is the most cited. Spotify's Encore Web serves anything built with web technology: web apps, websites, the desktop client and, in Spotify's own list, the fridge app. Encore Mobile serves mobile technology. Fluent 2 splits its Core UI kits into Web, iOS and Android.

Ant Design keeps `antd` and Ant Design Mobile separate. When someone proposed merging them, the counter-argument was that some components make sense on one platform only: a mobile NavBar is useless on a desktop site.

**Authoring environment** is the most under-discussed and, on the evidence, as strong. Consonant exists because Adobe.com is authored in a CMS by content designers and agencies, not assembled by engineers. Its one-to-one mapping between design template and content block lets the two populations work in parallel. IBM's marketing system carries the same constraint.

**Component vocabulary** follows from the first two, and it's the easiest signal to spot. A product library has Button, Select and Table; a marketing library has Marquee, Leadspace, Content Block and FLEGO. When one library holds both vocabularies, it's two libraries in a trenchcoat.

The other side of the line is just as clear:

- A different **visual style** is what token modes are for. Atlassian's marketing typeface lives in the type tokens, not in a duplicated set.
- A different **team** is a governance question. Splitting to match the org chart buys two libraries that have to be kept in parity for ever.
- A different **brand** is a token split, which is what Figma's extended collections (Schema 2025, Enterprise only) exist for.

**Release cadence** is the honest middle. Nathan Curtis, writing as a practitioner, observes federated native libraries lagging central releases by months or quarters. That argues for separately publishable libraries, but equally for one shared library with staged adoption.

Split a component library only for a different runtime or a different authoring environment. Answer style and brand with token modes, and team boundaries with named ownership in your governance docs. **If the app is a different runtime, it gets its own components; if it only looks different, it gets a mode.** The runtime and authoring criteria are what the systems that split actually cite; ranking cadence below them is a judgement, because both of its remedies work.

---

## The shared foundations

The foundations (colour, type, spacing, motion, radii, icons) are always shared, and this is the strongest convergence in the evidence, because it comes from systems with different reasons to split.

Say the app does earn its own components. The designer opening the new "App" library still needs the brand blue, the type scale and the spacing steps. If those are copied into the new file, the two libraries start drifting on day one.

Three systems that split for different reasons show the same shape underneath.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 278" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>Three library stacks. Spotify: Encore Web and Encore Mobile above Encore Foundation. Adobe: Consonant above Spectrum, above Spectrum tokens. IBM: Carbon for IBM.com above Carbon, above the IBM Design Language. Each stack rests on a shared foundation layer.</title><rect width="880" height="278" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="277" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">The tier below the components is always shared</text><text x="32" y="70" font-size="11" fill="#9A948B">Spotify</text><rect x="32" y="82" width="122" height="44" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="32" y="82" width="3" height="44" fill="#5E7E93"/><text x="46" y="108" font-size="11.5" fill="#1C1B19">Encore Web</text><rect x="166" y="82" width="122" height="44" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="166" y="82" width="3" height="44" fill="#5E7E93"/><text x="180" y="108" font-size="11.5" fill="#1C1B19">Encore Mobile</text><rect x="32" y="190" width="256" height="48" rx="3" fill="#FFFFFF" stroke="#C9C3B8" stroke-width="1.5"/><rect x="32" y="190" width="3" height="48" fill="#A6552F"/><text x="46" y="218" font-size="11.5" font-weight="600" fill="#1C1B19">Encore Foundation</text><text x="308" y="70" font-size="11" fill="#9A948B">Adobe</text><rect x="308" y="82" width="256" height="44" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="308" y="82" width="3" height="44" fill="#B08040"/><text x="322" y="108" font-size="11.5" fill="#1C1B19">Consonant</text><rect x="308" y="136" width="256" height="44" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="308" y="136" width="3" height="44" fill="#5E7E93"/><text x="322" y="162" font-size="11.5" fill="#1C1B19">Spectrum</text><rect x="308" y="190" width="256" height="48" rx="3" fill="#FFFFFF" stroke="#C9C3B8" stroke-width="1.5"/><rect x="308" y="190" width="3" height="48" fill="#A6552F"/><text x="322" y="218" font-size="11.5" font-weight="600" fill="#1C1B19">Spectrum tokens</text><text x="584" y="70" font-size="11" fill="#9A948B">IBM</text><rect x="584" y="82" width="256" height="44" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="584" y="82" width="3" height="44" fill="#B08040"/><text x="598" y="108" font-size="11.5" fill="#1C1B19">Carbon for IBM.com</text><rect x="584" y="136" width="256" height="44" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="584" y="136" width="3" height="44" fill="#5E7E93"/><text x="598" y="162" font-size="11.5" fill="#1C1B19">Carbon</text><rect x="584" y="190" width="256" height="48" rx="3" fill="#FFFFFF" stroke="#C9C3B8" stroke-width="1.5"/><rect x="584" y="190" width="3" height="48" fill="#A6552F"/><text x="598" y="218" font-size="11.5" font-weight="600" fill="#1C1B19">IBM Design Language</text></svg>

Spotify splits by runtime, Adobe by authoring environment, and IBM runs three levels. The seam differs; the shared tier doesn't.

Spotify's Encore Foundation holds colour, type, motion, spacing and the writing and accessibility guidelines, and using it is the minimum bar for every Spotify product. Fluent's design language file holds colour, stroke width, radius, spacing and size tokens for web and mobile alike.

Consonant sits on Spectrum and inherits its radii, type hierarchy and button styling. IBM runs three levels, with Carbon for IBM.com built on Carbon and the IBM Design Language. Atlassian's local systems, marketing included, inherit foundations from the central one. Three runtime splits and one purpose split produce the same shape.

This is the same layer the [companion piece on responsive components](responsive-components-in-figma.md) asks a single library to build for scale modes, now doing double duty. It absorbs width variation within a surface and platform variation across surfaces. Whether two things are really the same is answered once, in the tokens, instead of again in every component.

The catch is well documented in Figma's forums: modes apply per collection, so switching a frame to another platform or scale can mean setting the mode several times. There is no clean fix.

Whatever else you split, keep one foundations library, and publish icons and typography as shared libraries above it that every component library enables. **Copy a component if you must; never copy a token.**

---

## The cost of splitting

Splitting costs parity, not a second file, and the most useful evidence is a reversal that didn't merge.

The second file is the cheap part. The cost arrives the first time the Button changes: someone has to make the same change in both libraries, in the same release, with the same name.

Spotify paid it in public. It introduced Encore in 2019 as a very flexible Consumer Mobile catalogue and a broader Web system. By 2022 its own assessment was that the pendulum had swung too far toward flexibility.

So it assembled a team to build cross-platform components, and introduced a cross-platform naming system, so updates happen at the cross-platform level and flow out to the subsystems. It didn't merge the libraries. It kept the runtime seam and fixed the drift by pulling shared decisions into the foundation and unifying names.

The other cost is ownership. Atlassian describes it as unfinished work, asking openly what belongs in which system. Its target is a "pervasive API", where consumers needn't care which team maintains a component: the right target, and an honest admission that it hasn't been reached.

HMRC supplies the counterweight, and the only user-facing argument in the set. Building the GOV.UK app, it found that a system written for web pages left it without guidance wherever GOV.UK and native conventions diverged, such as interactive rows where the web used text links. The app drifted.

Its conclusion, that responsiveness alone does not always solve it, names what library structure is downstream of. HMRC built a mobile design system extending GOV.UK, and later open-sourced it with iOS and Android component libraries.

The systems that didn't split are correctly scoped, not confused:

- Polaris covers the admin only, with responsiveness in code through container queries.
- Carbon keeps one library across four themes using modes.
- Salesforce ships one web library and treats touch against cursor as density.
- Spotify's Encore Web serves websites and web apps alike. Spotify doesn't split marketing from product, because the runtime and the authoring environment are the same: a genuine counter-example to Adobe and IBM.

Budget for parity before you split: a shared naming scheme for components that exist on both sides, and a shared foundation they both read. **When the halves drift, fix the shared layer; don't merge the libraries.** That's Spotify's own remedy, and the only documented reversal in the set.

---

## A starting structure

Start from foundations at the bottom, holding variables and no components; shared icons and typography above; then one component library per surface that has earned one.

The team in the planning meeting now has its answer for the app. It still needs a picture of where each file sits, so the next surface doesn't reopen the argument.

<svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 880 326" font-family="Inter, 'Helvetica Neue', Arial, sans-serif" style="display:block;width:100%;height:auto;margin:2em 0"><title>A four-layer structure, read bottom up. Foundations (primitive, semantic and scale modes) at the base; icons and typography above; three component libraries, Core Web with responsive controls, Core App with native patterns and Sections with breakpoint variants; consuming files on top: product files, app files and site pages.</title><rect width="880" height="326" fill="#FBFAF8"/><rect x="0.5" y="0.5" width="879" height="325" fill="none" stroke="#E3DFD8"/><text x="32" y="38" font-size="13.5" font-weight="600" fill="#1C1B19">A structure to start from</text><rect x="32" y="58" width="264" height="38" rx="3" fill="#F2EFE9" stroke="#DFDAD2" stroke-dasharray="3 3"/><text x="46" y="82" font-size="11.5" fill="#77726B">Product files</text><rect x="308" y="58" width="264" height="38" rx="3" fill="#F2EFE9" stroke="#DFDAD2" stroke-dasharray="3 3"/><text x="322" y="82" font-size="11.5" fill="#77726B">App files</text><rect x="584" y="58" width="264" height="38" rx="3" fill="#F2EFE9" stroke="#DFDAD2" stroke-dasharray="3 3"/><text x="598" y="82" font-size="11.5" fill="#77726B">Site pages</text><rect x="32" y="112" width="264" height="62" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="32" y="112" width="3" height="62" fill="#5E7E93"/><text x="48" y="140" font-size="12.5" fill="#1C1B19">Core Web</text><rect x="308" y="112" width="264" height="62" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="308" y="112" width="3" height="62" fill="#5E7E93"/><text x="324" y="140" font-size="12.5" fill="#1C1B19">Core App</text><rect x="584" y="112" width="264" height="62" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="584" y="112" width="3" height="62" fill="#B08040"/><text x="600" y="140" font-size="12.5" fill="#1C1B19">Sections</text><text x="48" y="160" font-size="11" fill="#9A948B">responsive controls</text><text x="324" y="160" font-size="11" fill="#9A948B">native patterns</text><text x="600" y="160" font-size="11" fill="#9A948B">breakpoint variants</text><rect x="32" y="190" width="816" height="42" rx="3" fill="#FFFFFF" stroke="#DFDAD2"/><rect x="32" y="190" width="3" height="42" fill="#7E8B6B"/><text x="48" y="216" {LAB}>Icons and typography</text><rect x="32" y="248" width="816" height="52" rx="3" fill="#FFFFFF" stroke="#C9C3B8" stroke-width="1.5"/><rect x="32" y="248" width="3" height="52" fill="#A6552F"/><text x="48" y="272" font-size="12.5" font-weight="600" fill="#1C1B19">Foundations</text><text x="48" y="290" font-size="11" fill="#9A948B">primitive &#183; semantic &#183; scale modes</text></svg>

Read it bottom up. A component library is added only for a surface that has earned one; a webview app hasn't.

Foundations hold a primitive collection, a semantic collection, and a scale or density collection whose modes match real device tiers. A responsive web product alone needs one component library. A web product plus a genuinely native app needs two. A CMS-authored marketing site makes three, with a different vocabulary by design.

Some thresholds change the answer:

- A native app that is a wrapper doesn't split.
- A marketing site of a handful of pages, authored by the product's own designers, doesn't split. It gets a page-templates file consuming the product library.
- Two libraries holding components identical except for their file have outrun their justification. Those components belong in the shared tier.
- On Enterprise, where brand rather than surface is the driver, use extended collections and split no components.

The warning signs, each with what it means:

- **Nobody can say which library owns a component.** A governance gap no file structure fixes.
- **The same fix lands twice, once per library.** The divergence was never real; pull it into foundations.
- **A marketing team quietly maintains a detached copy of the product library.** The vocabulary has diverged and the split is overdue.
- **Two libraries' components share a name but not an API.** The parity failure Spotify addressed with cross-platform naming.

Start from one foundations library and one component library. Add a second component library only when a runtime or authoring seam appears, and write in its description which seam that was. **One foundation, then one component library per seam, never per team.**

---

## Cheat sheet

| Property of a surface | Split components? | Where it belongs |
|---|---|---|
| Different rendering runtime (web, iOS, Android) | yes | its own component library (Encore, Fluent, Ant Design) |
| Different authoring environment (CMS, content authors) | yes | its own component library (Consonant, IBM.com) |
| Different component vocabulary | yes, as the symptom of the two above | follows the runtime or authoring split |
| Different visual style | no | token modes |
| Different brand | no | token split; extended collections on Enterprise |
| Different team | no | governance and ownership |
| Different release cadence | rarely alone | separate publishing or staged adoption |
| Webview or wrapper app | no | a breakpoint, not a library |
| Foundations, icons, type | never split | shared libraries |

---

## The short version

A library split answers a seam, not a width. A different rendering runtime or a different authoring environment earns a separate component library, and the component vocabulary diverging (Marquee and Leadspace appearing beside Button and Select) is the earliest symptom. A different style, brand or team doesn't: those are token modes, extended collections and governance.

Whatever you split, share the foundations. This is the strongest convergence in the evidence: Spotify splits by runtime, Adobe by authoring environment, IBM in three levels, and all share one foundation. Splitting costs parity, and Spotify's 2022 recalibration shows how it's paid: shared naming and a stronger foundation, not a merge.

The usual Western tally of who split and who didn't (Fluent, Primer, Carbon, Atlassian, Polaris, GitLab) is closer to one idea with five echoes than to six confirmations. The convergences worth weighting come from different constraint worlds: Spotify's runtime split, Adobe's authoring split, the Chinese systems splitting for mini-program and React Native ecosystems, and HMRC splitting from statutory accessibility requirements and user research. None of it rests on measured user outcomes, so keep the cost of changing your structure low: name things so they can be renamed, and keep the token layer separable from the components.

---

## What to re-check later

Researched August 2026; re-checked November 2026.

- **How the evidence was weighted.** Sources are what systems ship and say about themselves: Spotify's accounts of Encore and its 2022 recalibration, Microsoft Fluent 2, Ant Design's repositories and issue 12274, TDesign and Arco Design, Adobe's account of Consonant, IBM's Carbon and Carbon for IBM.com, Atlassian's interview on local design systems and its 2026 post on the system's direction, HMRC's account of extending GOV.UK for mobile apps, Shopify Polaris and Salesforce Lightning Design System 2, and Figma's help centre on extended collections and modes. Practitioner essays (Nathan Curtis, Lullabot) are commentary.
- **Extended collections.** Enterprise-gated since Schema 2025 (October 2025). Figma's plans page, re-read in November 2026, still lists "unlimited modes with extended collections" on Enterprise only. A plan change would move the brand-split threshold.
- **Per-collection mode application.** Whether Figma adds a way to set several collections' modes at once.
- **No user research.** HMRC comes closest, and its finding is about designers lacking guidance, not measured user outcomes.

---

## Sources

**Primary**

- Spotify Design's account of Encore and its cross-platform recalibration, on Spotify Design and Figma's blog.
- Fluent 2 Design System documentation.
- Ant Design repository documentation and issue 12274.
- TDesign and Arco Design repositories.
- Adobe Design's account of building Consonant.
- IBM Carbon design kit documentation, Carbon for IBM.com documentation and repositories.
- Atlassian Design System documentation, the Atlassian team interview on local design systems, and its 2026 post on the system's direction.
- HMRC's account of extending the GOV.UK Design System for mobile apps.
- Current Polaris documentation and Shopify staff answers on POS kit availability.
- Salesforce Lightning Design System 2 density documentation.
- GitHub Primer Figma library documentation and primer/react pull request 745.
- Figma help centre articles on libraries, variable modes, [extended collections](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection) and [plans and features](https://help.figma.com/hc/en-us/articles/360040328273-Figma-plans-and-features).
- Figma's Schema 2025 announcement.
- Figma forum threads on per-collection mode application.

**Commentary**

- Nathan Curtis (EightShapes) on managing systems with multiple core libraries.
- Lullabot on design systems serving multiple sites and content authors.
