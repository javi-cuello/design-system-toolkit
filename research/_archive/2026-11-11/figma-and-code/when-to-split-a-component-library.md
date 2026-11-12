# When should a design system split into more than one component library?

A second component library is justified by a seam that already exists in the runtime or in who authors the pages, never by screen size, visual style, brand or the org chart. Systems that split well split the components and share everything underneath, and when the halves drift they fix the shared layer rather than merging.

Researched August 2026; re-checked November 2026. Sources are what systems ship and say about themselves: Spotify's accounts of Encore and its 2022 recalibration, Microsoft Fluent 2, Ant Design's repositories and issue 12274, TDesign and Arco Design, Adobe's account of Consonant, IBM's Carbon and Carbon for IBM.com, Atlassian's interview on local design systems and its 2026 post on the system's direction, HMRC's account of extending GOV.UK for mobile apps, Shopify Polaris and Salesforce Lightning Design System 2, and Figma's help centre on extended collections and modes. Practitioner essays are commentary and labelled where used. In November 2026 Figma's plans page was re-read: extended collections remain Enterprise-only ("unlimited modes with extended collections").

---

## What this answers

- Is "should the native app have its own library?" a responsive question?
- Which properties of a surface earn a separate component library, and which do not?
- What is always shared, whatever is split?
- What does splitting cost, and what did the systems that split learn?
- What structure should a system start from?

How a single library stretches across widths is the companion piece, [responsive-components-in-figma.md](responsive-components-in-figma.md).

---

## 1. Is a library split a breakpoint question?

**The short answer.** No. A breakpoint is a width; a library boundary is a technical and organisational seam. The two meet in exactly one place, the token layer.

It is tempting to treat a native app's library as the far end of the responsive spectrum, one step after tablet. Companies routinely split along seams with no width in them: Adobe runs two design systems for two surfaces that are both desktop-and-mobile web, and Atlassian has a brand design system created by marketing beside its product system. No amount of auto layout would have prevented either. The real question is what property of a surface makes it expensive to keep in the same library as another.

**What to do.** Ask what is different about how the surface is rendered and authored before asking how wide it is.

---

## 2. What earns a split, and what does not?

**The short answer.** Three properties earn one: a different rendering runtime, a different authoring environment, and the different component vocabulary those two produce. Different visual style, a different team and a different brand do not; they belong in token modes and governance. Release cadence sits between.

![Seven properties of a surface, each marked as either justifying a library split or belonging in tokens and governance](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4ODAgMzE4IiB3aWR0aD0iODgwIiBoZWlnaHQ9IjMxOCIgZm9udC1mYW1pbHk9IkludGVyLCAnSGVsdmV0aWNhIE5ldWUnLCBBcmlhbCwgc2Fucy1zZXJpZiI+PHJlY3Qgd2lkdGg9Ijg4MCIgaGVpZ2h0PSIzMTgiIGZpbGw9IiNGQkZBRjgiLz48cmVjdCB4PSIwLjUiIHk9IjAuNSIgd2lkdGg9Ijg3OSIgaGVpZ2h0PSIzMTciIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0UzREZEOCIvPjx0ZXh0IHg9IjMyIiB5PSIzOCIgZm9udC1zaXplPSIxMy41IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjMUMxQjE5Ij5XaGF0IGVhcm5zIGEgc2VwYXJhdGUgY29tcG9uZW50IGxpYnJhcnk8L3RleHQ+PHRleHQgeD0iNjQwIiB5PSI2MiIgZm9udC1zaXplPSIxMSIgZmlsbD0iIzlBOTQ4QiI+c3BsaXQ8L3RleHQ+PHRleHQgeD0iNzQwIiB5PSI2MiIgZm9udC1zaXplPSIxMSIgZmlsbD0iIzlBOTQ4QiI+dG9rZW5zIG9yIGdvdmVybmFuY2U8L3RleHQ+PGxpbmUgeDE9IjMyIiB5MT0iNzIiIHgyPSI4NDgiIHkyPSI3MiIgc3Ryb2tlPSIjREZEQUQyIi8+PHRleHQgeD0iNDQiIHk9Ijk4IiBmb250LXNpemU9IjEyLjUiIGZpbGw9IiMxQzFCMTkiPkRpZmZlcmVudCByZW5kZXJpbmcgcnVudGltZTwvdGV4dD48Y2lyY2xlIGN4PSI2NDgiIGN5PSI5NCIgcj0iNS41IiBmaWxsPSIjQTY1NTJGIi8+PGxpbmUgeDE9IjMyIiB5MT0iMTExIiB4Mj0iODQ4IiB5Mj0iMTExIiBzdHJva2U9IiNFREVBRTQiLz48dGV4dCB4PSI0NCIgeT0iMTI4IiBmb250LXNpemU9IjEyLjUiIGZpbGw9IiMxQzFCMTkiPkRpZmZlcmVudCBhdXRob3JpbmcgZW52aXJvbm1lbnQ8L3RleHQ+PGNpcmNsZSBjeD0iNjQ4IiBjeT0iMTI0IiByPSI1LjUiIGZpbGw9IiNBNjU1MkYiLz48bGluZSB4MT0iMzIiIHkxPSIxNDEiIHgyPSI4NDgiIHkyPSIxNDEiIHN0cm9rZT0iI0VERUFFNCIvPjx0ZXh0IHg9IjQ0IiB5PSIxNTgiIGZvbnQtc2l6ZT0iMTIuNSIgZmlsbD0iIzFDMUIxOSI+RGlmZmVyZW50IGNvbXBvbmVudCB2b2NhYnVsYXJ5PC90ZXh0PjxjaXJjbGUgY3g9IjY0OCIgY3k9IjE1NCIgcj0iNS41IiBmaWxsPSIjQTY1NTJGIi8+PGxpbmUgeDE9IjMyIiB5MT0iMTcxIiB4Mj0iODQ4IiB5Mj0iMTcxIiBzdHJva2U9IiNFREVBRTQiLz48dGV4dCB4PSI0NCIgeT0iMTg4IiBmb250LXNpemU9IjEyLjUiIGZpbGw9IiMxQzFCMTkiPkRpZmZlcmVudCByZWxlYXNlIGNhZGVuY2U8L3RleHQ+PGNpcmNsZSBjeD0iNjQ4IiBjeT0iMTg0IiByPSI1LjUiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0IwODA0MCIgc3Ryb2tlLXdpZHRoPSIxLjYiLz48Y2lyY2xlIGN4PSI3OTAiIGN5PSIxODQiIHI9IjUuNSIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjQjA4MDQwIiBzdHJva2Utd2lkdGg9IjEuNiIvPjxsaW5lIHgxPSIzMiIgeTE9IjIwMSIgeDI9Ijg0OCIgeTI9IjIwMSIgc3Ryb2tlPSIjRURFQUU0Ii8+PHRleHQgeD0iNDQiIHk9IjIxOCIgZm9udC1zaXplPSIxMi41IiBmaWxsPSIjMUMxQjE5Ij5EaWZmZXJlbnQgdmlzdWFsIHN0eWxlPC90ZXh0PjxjaXJjbGUgY3g9Ijc5MCIgY3k9IjIxNCIgcj0iNS41IiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiM4RkE4QjgiIHN0cm9rZS13aWR0aD0iMS42Ii8+PGxpbmUgeDE9IjMyIiB5MT0iMjMxIiB4Mj0iODQ4IiB5Mj0iMjMxIiBzdHJva2U9IiNFREVBRTQiLz48dGV4dCB4PSI0NCIgeT0iMjQ4IiBmb250LXNpemU9IjEyLjUiIGZpbGw9IiMxQzFCMTkiPkRpZmZlcmVudCB0ZWFtPC90ZXh0PjxjaXJjbGUgY3g9Ijc5MCIgY3k9IjI0NCIgcj0iNS41IiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiM4RkE4QjgiIHN0cm9rZS13aWR0aD0iMS42Ii8+PGxpbmUgeDE9IjMyIiB5MT0iMjYxIiB4Mj0iODQ4IiB5Mj0iMjYxIiBzdHJva2U9IiNFREVBRTQiLz48dGV4dCB4PSI0NCIgeT0iMjc4IiBmb250LXNpemU9IjEyLjUiIGZpbGw9IiMxQzFCMTkiPkRpZmZlcmVudCBicmFuZDwvdGV4dD48Y2lyY2xlIGN4PSI3OTAiIGN5PSIyNzQiIHI9IjUuNSIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjOEZBOEI4IiBzdHJva2Utd2lkdGg9IjEuNiIvPjwvc3ZnPg==)

*Filled markers justify a separate component library; hollow markers belong in token modes or governance. Release cadence rarely decides alone.*

**Rendering runtime** is the most cited. Spotify's Encore Web serves anything built with web technology (web apps, websites, the desktop client and, in Spotify's own list, the fridge app); Encore Mobile serves mobile technology. Fluent 2 splits its Core UI kits into Web, iOS and Android. Ant Design keeps `antd` and Ant Design Mobile separate, and when someone proposed merging them the counter-argument was that some components make sense on one platform only: a mobile NavBar is useless on a desktop site.

**Authoring environment** is the most under-discussed and, on the evidence, as strong. Consonant exists because Adobe.com is authored in a CMS by content designers and agencies, not assembled by engineers; its one-to-one mapping between design template and content block lets the two populations work in parallel. IBM's marketing system carries the same constraint.

**Component vocabulary** follows from the first two and is the easiest signal to spot. A product library has Button, Select, Table; a marketing library has Marquee, Leadspace, Content Block, FLEGO. When one library contains both vocabularies, it is two libraries in a trenchcoat.

On the other side of the line: a different **visual style** is what token modes are for (Atlassian's marketing typeface lives in the type tokens, not a duplicated set). A different **team** is a governance question, and splitting to match the org chart buys two libraries that must be kept in parity for ever. A different **brand** is a token split, which is what Figma's extended collections (Schema 2025, Enterprise only) exist for. **Release cadence**: Nathan Curtis (commentary) observes federated native libraries lagging central releases by months or quarters, which argues for separately publishable libraries, but equally for one shared library with staged adoption.

**What to do.** Split a component library only for a different runtime or a different authoring environment. Answer style and brand with token modes, and team boundaries with ownership.

---

## 3. What is always shared?

**The short answer.** The foundations: colour, type, spacing, motion, radii, icons. This is the strongest convergence in the evidence, and unusually it comes from systems with different reasons to split.

![Three library stacks, Spotify, Adobe and IBM, each with component libraries above a shared foundation layer](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4ODAgMjc4IiB3aWR0aD0iODgwIiBoZWlnaHQ9IjI3OCIgZm9udC1mYW1pbHk9IkludGVyLCAnSGVsdmV0aWNhIE5ldWUnLCBBcmlhbCwgc2Fucy1zZXJpZiI+PHJlY3Qgd2lkdGg9Ijg4MCIgaGVpZ2h0PSIyNzgiIGZpbGw9IiNGQkZBRjgiLz48cmVjdCB4PSIwLjUiIHk9IjAuNSIgd2lkdGg9Ijg3OSIgaGVpZ2h0PSIyNzciIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0UzREZEOCIvPjx0ZXh0IHg9IjMyIiB5PSIzOCIgZm9udC1zaXplPSIxMy41IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjMUMxQjE5Ij5UaGUgdGllciBiZWxvdyB0aGUgY29tcG9uZW50cyBpcyBhbHdheXMgc2hhcmVkPC90ZXh0Pjx0ZXh0IHg9IjMyIiB5PSI3MCIgZm9udC1zaXplPSIxMSIgZmlsbD0iIzlBOTQ4QiI+U3BvdGlmeTwvdGV4dD48cmVjdCB4PSIzMiIgeT0iODIiIHdpZHRoPSIxMjIiIGhlaWdodD0iNDQiIHJ4PSIzIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNERkRBRDIiLz48cmVjdCB4PSIzMiIgeT0iODIiIHdpZHRoPSIzIiBoZWlnaHQ9IjQ0IiBmaWxsPSIjNUU3RTkzIi8+PHRleHQgeD0iNDYiIHk9IjEwOCIgZm9udC1zaXplPSIxMS41IiBmaWxsPSIjMUMxQjE5Ij5FbmNvcmUgV2ViPC90ZXh0PjxyZWN0IHg9IjE2NiIgeT0iODIiIHdpZHRoPSIxMjIiIGhlaWdodD0iNDQiIHJ4PSIzIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNERkRBRDIiLz48cmVjdCB4PSIxNjYiIHk9IjgyIiB3aWR0aD0iMyIgaGVpZ2h0PSI0NCIgZmlsbD0iIzVFN0U5MyIvPjx0ZXh0IHg9IjE4MCIgeT0iMTA4IiBmb250LXNpemU9IjExLjUiIGZpbGw9IiMxQzFCMTkiPkVuY29yZSBNb2JpbGU8L3RleHQ+PHJlY3QgeD0iMzIiIHk9IjE5MCIgd2lkdGg9IjI1NiIgaGVpZ2h0PSI0OCIgcng9IjMiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0M5QzNCOCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz48cmVjdCB4PSIzMiIgeT0iMTkwIiB3aWR0aD0iMyIgaGVpZ2h0PSI0OCIgZmlsbD0iI0E2NTUyRiIvPjx0ZXh0IHg9IjQ2IiB5PSIyMTgiIGZvbnQtc2l6ZT0iMTEuNSIgZm9udC13ZWlnaHQ9IjYwMCIgZmlsbD0iIzFDMUIxOSI+RW5jb3JlIEZvdW5kYXRpb248L3RleHQ+PHRleHQgeD0iMzA4IiB5PSI3MCIgZm9udC1zaXplPSIxMSIgZmlsbD0iIzlBOTQ4QiI+QWRvYmU8L3RleHQ+PHJlY3QgeD0iMzA4IiB5PSI4MiIgd2lkdGg9IjI1NiIgaGVpZ2h0PSI0NCIgcng9IjMiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0RGREFEMiIvPjxyZWN0IHg9IjMwOCIgeT0iODIiIHdpZHRoPSIzIiBoZWlnaHQ9IjQ0IiBmaWxsPSIjQjA4MDQwIi8+PHRleHQgeD0iMzIyIiB5PSIxMDgiIGZvbnQtc2l6ZT0iMTEuNSIgZmlsbD0iIzFDMUIxOSI+Q29uc29uYW50PC90ZXh0PjxyZWN0IHg9IjMwOCIgeT0iMTM2IiB3aWR0aD0iMjU2IiBoZWlnaHQ9IjQ0IiByeD0iMyIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjREZEQUQyIi8+PHJlY3QgeD0iMzA4IiB5PSIxMzYiIHdpZHRoPSIzIiBoZWlnaHQ9IjQ0IiBmaWxsPSIjNUU3RTkzIi8+PHRleHQgeD0iMzIyIiB5PSIxNjIiIGZvbnQtc2l6ZT0iMTEuNSIgZmlsbD0iIzFDMUIxOSI+U3BlY3RydW08L3RleHQ+PHJlY3QgeD0iMzA4IiB5PSIxOTAiIHdpZHRoPSIyNTYiIGhlaWdodD0iNDgiIHJ4PSIzIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNDOUMzQjgiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHJlY3QgeD0iMzA4IiB5PSIxOTAiIHdpZHRoPSIzIiBoZWlnaHQ9IjQ4IiBmaWxsPSIjQTY1NTJGIi8+PHRleHQgeD0iMzIyIiB5PSIyMTgiIGZvbnQtc2l6ZT0iMTEuNSIgZm9udC13ZWlnaHQ9IjYwMCIgZmlsbD0iIzFDMUIxOSI+U3BlY3RydW0gdG9rZW5zPC90ZXh0Pjx0ZXh0IHg9IjU4NCIgeT0iNzAiIGZvbnQtc2l6ZT0iMTEiIGZpbGw9IiM5QTk0OEIiPklCTTwvdGV4dD48cmVjdCB4PSI1ODQiIHk9IjgyIiB3aWR0aD0iMjU2IiBoZWlnaHQ9IjQ0IiByeD0iMyIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjREZEQUQyIi8+PHJlY3QgeD0iNTg0IiB5PSI4MiIgd2lkdGg9IjMiIGhlaWdodD0iNDQiIGZpbGw9IiNCMDgwNDAiLz48dGV4dCB4PSI1OTgiIHk9IjEwOCIgZm9udC1zaXplPSIxMS41IiBmaWxsPSIjMUMxQjE5Ij5DYXJib24gZm9yIElCTS5jb208L3RleHQ+PHJlY3QgeD0iNTg0IiB5PSIxMzYiIHdpZHRoPSIyNTYiIGhlaWdodD0iNDQiIHJ4PSIzIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNERkRBRDIiLz48cmVjdCB4PSI1ODQiIHk9IjEzNiIgd2lkdGg9IjMiIGhlaWdodD0iNDQiIGZpbGw9IiM1RTdFOTMiLz48dGV4dCB4PSI1OTgiIHk9IjE2MiIgZm9udC1zaXplPSIxMS41IiBmaWxsPSIjMUMxQjE5Ij5DYXJib248L3RleHQ+PHJlY3QgeD0iNTg0IiB5PSIxOTAiIHdpZHRoPSIyNTYiIGhlaWdodD0iNDgiIHJ4PSIzIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNDOUMzQjgiIHN0cm9rZS13aWR0aD0iMS41Ii8+PHJlY3QgeD0iNTg0IiB5PSIxOTAiIHdpZHRoPSIzIiBoZWlnaHQ9IjQ4IiBmaWxsPSIjQTY1NTJGIi8+PHRleHQgeD0iNTk4IiB5PSIyMTgiIGZvbnQtc2l6ZT0iMTEuNSIgZm9udC13ZWlnaHQ9IjYwMCIgZmlsbD0iIzFDMUIxOSI+SUJNIERlc2lnbiBMYW5ndWFnZTwvdGV4dD48L3N2Zz4=)

*Spotify splits by runtime, Adobe by authoring environment, IBM runs three levels. The seam differs; the shared tier does not.*

Spotify's Encore Foundation holds colour, type, motion, spacing and the writing and accessibility guidelines, and using it is the minimum bar for every Spotify product. Fluent's design language file holds colour, stroke width, radius, spacing and size tokens for web and mobile alike. Consonant sits on Spectrum and inherits its radii, type hierarchy and button styling. IBM runs three levels, with Carbon for IBM.com built on Carbon and the IBM Design Language. Atlassian's local systems, marketing included, inherit foundations from the central one. Three runtime splits and one purpose split produce the same shape.

It is the same layer the companion piece asks a single library to build for scale modes, doing double duty: absorbing width variation within a surface and platform variation across surfaces. The question of whether two things are really the same is answered once, in the tokens, instead of repeatedly in every component. The cost, well documented in Figma's forums, is that modes apply per collection, so switching a frame to another platform or scale can mean setting the mode several times; there is no clean fix.

**What to do.** Whatever else is split, keep one foundations library, and icons and typography as shared libraries above it.

---

## 4. What does splitting cost?

**The short answer.** Parity, not a second file. The systems that split are candid about it, and the most useful evidence is a reversal that did not merge.

Spotify introduced Encore in 2019 as a very flexible Consumer Mobile catalogue and a broader Web system. By 2022 its own assessment was that the pendulum had swung too far toward flexibility. It assembled a team to build cross-platform components and introduced a cross-platform naming system, so updates happen at the cross-platform level and flow out to the subsystems. It did not merge the libraries: it kept the runtime seam and fixed the drift by pulling shared decisions into the foundation and unifying names.

The other cost is ownership. Atlassian describes it as unfinished work, asking openly what belongs in which system; its target of a "pervasive API", where consumers need not care which team maintains a component, is the right one and an honest admission it was not reached.

HMRC supplies the counterweight, and the only user-facing argument in the set. Building the GOV.UK app, it found that a system written for web pages left it without guidance wherever GOV.UK and native conventions diverged, such as interactive rows where the web used text links, and the app drifted. Its conclusion, that responsiveness alone does not always solve it, names what library structure is downstream of. It built a mobile design system extending GOV.UK and later open-sourced it with iOS and Android component libraries.

The systems that did not split are correctly scoped, not confused. Polaris covers the admin only, with responsiveness in code through container queries. Carbon keeps one library across four themes using modes. Salesforce ships one web library and treats touch against cursor as density. And Spotify's Encore Web serves websites and web apps alike: Spotify does not split marketing from product, because the runtime and the authoring environment are the same, a genuine counter-example to Adobe and IBM.

**What to do.** Budget for parity before splitting. Buy it with shared naming and a shared foundation; when the halves drift, fix the shared layer rather than merging them.

---

## 5. What structure should a system start from?

**The short answer.** Foundations at the bottom, holding variables and no components; shared icons and typography above; then one component library per surface that has earned one.

![A four-layer structure with foundations at the base, then shared icons, then three component libraries, then consuming files](data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4ODAgMzI2IiB3aWR0aD0iODgwIiBoZWlnaHQ9IjMyNiIgZm9udC1mYW1pbHk9IkludGVyLCAnSGVsdmV0aWNhIE5ldWUnLCBBcmlhbCwgc2Fucy1zZXJpZiI+PHJlY3Qgd2lkdGg9Ijg4MCIgaGVpZ2h0PSIzMjYiIGZpbGw9IiNGQkZBRjgiLz48cmVjdCB4PSIwLjUiIHk9IjAuNSIgd2lkdGg9Ijg3OSIgaGVpZ2h0PSIzMjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0UzREZEOCIvPjx0ZXh0IHg9IjMyIiB5PSIzOCIgZm9udC1zaXplPSIxMy41IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjMUMxQjE5Ij5BIHN0cnVjdHVyZSB0byBzdGFydCBmcm9tPC90ZXh0PjxyZWN0IHg9IjMyIiB5PSI1OCIgd2lkdGg9IjI2NCIgaGVpZ2h0PSIzOCIgcng9IjMiIGZpbGw9IiNGMkVGRTkiIHN0cm9rZT0iI0RGREFEMiIgc3Ryb2tlLWRhc2hhcnJheT0iMyAzIi8+PHRleHQgeD0iNDYiIHk9IjgyIiBmb250LXNpemU9IjExLjUiIGZpbGw9IiM3NzcyNkIiPlByb2R1Y3QgZmlsZXM8L3RleHQ+PHJlY3QgeD0iMzA4IiB5PSI1OCIgd2lkdGg9IjI2NCIgaGVpZ2h0PSIzOCIgcng9IjMiIGZpbGw9IiNGMkVGRTkiIHN0cm9rZT0iI0RGREFEMiIgc3Ryb2tlLWRhc2hhcnJheT0iMyAzIi8+PHRleHQgeD0iMzIyIiB5PSI4MiIgZm9udC1zaXplPSIxMS41IiBmaWxsPSIjNzc3MjZCIj5BcHAgZmlsZXM8L3RleHQ+PHJlY3QgeD0iNTg0IiB5PSI1OCIgd2lkdGg9IjI2NCIgaGVpZ2h0PSIzOCIgcng9IjMiIGZpbGw9IiNGMkVGRTkiIHN0cm9rZT0iI0RGREFEMiIgc3Ryb2tlLWRhc2hhcnJheT0iMyAzIi8+PHRleHQgeD0iNTk4IiB5PSI4MiIgZm9udC1zaXplPSIxMS41IiBmaWxsPSIjNzc3MjZCIj5TaXRlIHBhZ2VzPC90ZXh0PjxyZWN0IHg9IjMyIiB5PSIxMTIiIHdpZHRoPSIyNjQiIGhlaWdodD0iNjIiIHJ4PSIzIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNERkRBRDIiLz48cmVjdCB4PSIzMiIgeT0iMTEyIiB3aWR0aD0iMyIgaGVpZ2h0PSI2MiIgZmlsbD0iIzVFN0U5MyIvPjx0ZXh0IHg9IjQ4IiB5PSIxNDAiIGZvbnQtc2l6ZT0iMTIuNSIgZmlsbD0iIzFDMUIxOSI+Q29yZSBXZWI8L3RleHQ+PHJlY3QgeD0iMzA4IiB5PSIxMTIiIHdpZHRoPSIyNjQiIGhlaWdodD0iNjIiIHJ4PSIzIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNERkRBRDIiLz48cmVjdCB4PSIzMDgiIHk9IjExMiIgd2lkdGg9IjMiIGhlaWdodD0iNjIiIGZpbGw9IiM1RTdFOTMiLz48dGV4dCB4PSIzMjQiIHk9IjE0MCIgZm9udC1zaXplPSIxMi41IiBmaWxsPSIjMUMxQjE5Ij5Db3JlIEFwcDwvdGV4dD48cmVjdCB4PSI1ODQiIHk9IjExMiIgd2lkdGg9IjI2NCIgaGVpZ2h0PSI2MiIgcng9IjMiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0RGREFEMiIvPjxyZWN0IHg9IjU4NCIgeT0iMTEyIiB3aWR0aD0iMyIgaGVpZ2h0PSI2MiIgZmlsbD0iI0IwODA0MCIvPjx0ZXh0IHg9IjYwMCIgeT0iMTQwIiBmb250LXNpemU9IjEyLjUiIGZpbGw9IiMxQzFCMTkiPlNlY3Rpb25zPC90ZXh0Pjx0ZXh0IHg9IjQ4IiB5PSIxNjAiIGZvbnQtc2l6ZT0iMTEiIGZpbGw9IiM5QTk0OEIiPnJlc3BvbnNpdmUgY29udHJvbHM8L3RleHQ+PHRleHQgeD0iMzI0IiB5PSIxNjAiIGZvbnQtc2l6ZT0iMTEiIGZpbGw9IiM5QTk0OEIiPm5hdGl2ZSBwYXR0ZXJuczwvdGV4dD48dGV4dCB4PSI2MDAiIHk9IjE2MCIgZm9udC1zaXplPSIxMSIgZmlsbD0iIzlBOTQ4QiI+YnJlYWtwb2ludCB2YXJpYW50czwvdGV4dD48cmVjdCB4PSIzMiIgeT0iMTkwIiB3aWR0aD0iODE2IiBoZWlnaHQ9IjQyIiByeD0iMyIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjREZEQUQyIi8+PHJlY3QgeD0iMzIiIHk9IjE5MCIgd2lkdGg9IjMiIGhlaWdodD0iNDIiIGZpbGw9IiM3RThCNkIiLz48dGV4dCB4PSI0OCIgeT0iMjE2IiB7TEFCfT5JY29ucyBhbmQgdHlwb2dyYXBoeTwvdGV4dD48cmVjdCB4PSIzMiIgeT0iMjQ4IiB3aWR0aD0iODE2IiBoZWlnaHQ9IjUyIiByeD0iMyIgZmlsbD0iI0ZGRkZGRiIgc3Ryb2tlPSIjQzlDM0I4IiBzdHJva2Utd2lkdGg9IjEuNSIvPjxyZWN0IHg9IjMyIiB5PSIyNDgiIHdpZHRoPSIzIiBoZWlnaHQ9IjUyIiBmaWxsPSIjQTY1NTJGIi8+PHRleHQgeD0iNDgiIHk9IjI3MiIgZm9udC1zaXplPSIxMi41IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjMUMxQjE5Ij5Gb3VuZGF0aW9uczwvdGV4dD48dGV4dCB4PSI0OCIgeT0iMjkwIiBmb250LXNpemU9IjExIiBmaWxsPSIjOUE5NDhCIj5wcmltaXRpdmUgJiMxODM7IHNlbWFudGljICYjMTgzOyBzY2FsZSBtb2RlczwvdGV4dD48L3N2Zz4=)

*Read bottom up. Add a component library only for a surface that has earned one; a webview app has not.*

Foundations hold a primitive collection, a semantic collection, and a scale or density collection whose modes match real device tiers. A responsive web product alone needs one component library; a web product plus a genuinely native app needs two; a CMS-authored marketing site makes three, with a different vocabulary by design.

**Thresholds that change the answer.** A native app that is a wrapper does not split. A marketing site of a handful of pages authored by the product's own designers does not split; it gets a page-templates file consuming the product library. Two libraries holding components identical except for their file have outrun their justification, and those components belong in the shared tier. On Enterprise, with brand rather than surface as the driver, use extended collections and split no components.

**Warning signs.** Nobody can say which library owns a component: a governance gap no file structure fixes. The same fix landing twice, once per library: the divergence was never real, so pull it into foundations. A marketing team quietly maintaining a detached copy of the product library: the vocabulary has diverged and the split is overdue. Two libraries whose components share a name but not an API: the parity failure Spotify addressed with cross-platform naming.

**What to do.** Start from one foundations library and one component library, and add a second only when a runtime or authoring seam appears.

---

## 6. Cheat sheet

| Property of a surface | Split components? | Where it belongs |
|---|---|---|
| Different rendering runtime (web, iOS, Android) | yes | its own component library (Encore, Fluent, Ant Design) |
| Different authoring environment (CMS, content authors) | yes | its own component library (Consonant, IBM.com) |
| Different component vocabulary | yes, as the symptom of the two above | — |
| Different visual style | no | token modes |
| Different brand | no | token split; extended collections on Enterprise |
| Different team | no | governance and ownership |
| Different release cadence | rarely alone | separate publishing or staged adoption |
| Webview or wrapper app | no | a breakpoint, not a library |
| Foundations, icons, type | never split | shared libraries |

---

## 7. The short version

A library split answers a seam, not a width. A different rendering runtime or a different authoring environment earns a separate component library, and the component vocabulary diverging (Marquee and Leadspace appearing beside Button and Select) is the earliest symptom. A different style, brand or team does not: those are token modes, extended collections and governance.

Whatever is split, the foundations are shared, and this is the strongest convergence in the evidence: Spotify splits by runtime, Adobe by authoring environment, IBM in three levels, and all share one foundation. Splitting costs parity, and Spotify's 2022 recalibration shows how it is paid: shared naming and a stronger foundation, not a merge.

The usual Western tally of who split and who did not (Fluent, Primer, Carbon, Atlassian, Polaris, GitLab) is closer to one idea with five echoes than to six confirmations; the convergences worth weighting come from different constraint worlds, such as Spotify's runtime split, Adobe's authoring split, the Chinese systems splitting for mini-program and React Native ecosystems, and HMRC splitting from statutory accessibility requirements and user research. None of it rests on measured user outcomes, so keep the cost of changing the structure low: name things so they can be renamed, and keep the token layer separable from the components.

---

## 8. What to re-check later

- **Extended collections.** Enterprise-gated since Schema 2025 (October 2025); a plan change would move the brand-split threshold.
- **Per-collection mode application.** Whether Figma adds a way to set several collections' modes at once.
- **No user research.** HMRC comes closest, and its finding is about designers lacking guidance, not measured user outcomes.

---

## Sources

**Primary.** Spotify Design's account of Encore and its cross-platform recalibration, on Spotify Design and Figma's blog; Fluent 2 Design System documentation; Ant Design repository documentation and issue 12274; TDesign and Arco Design repositories; Adobe Design's account of building Consonant; IBM Carbon design kit documentation, Carbon for IBM.com documentation and repositories; Atlassian Design System documentation, the Atlassian team interview on local design systems and its 2026 post on the system's direction; HMRC's account of extending the GOV.UK Design System for mobile apps; current Polaris documentation and Shopify staff answers on POS kit availability; Salesforce Lightning Design System 2 density documentation; GitHub Primer Figma library documentation and primer/react pull request 745; Figma help centre articles on libraries, variable modes, [extended collections](https://help.figma.com/hc/en-us/articles/36346281624471-Extend-a-variable-collection) and [plans and features](https://help.figma.com/hc/en-us/articles/360040328273-Figma-plans-and-features); Figma's Schema 2025 announcement; Figma forum threads on per-collection mode application.

**Commentary.** Nathan Curtis (EightShapes) on managing systems with multiple core libraries; Lullabot on design systems serving multiple sites and content authors.
