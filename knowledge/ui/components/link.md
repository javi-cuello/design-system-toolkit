# Link

A link takes the person somewhere: another page, a place on this page, a file. This page owns the link as a component, in design, in Figma and in code: its text, new tabs and downloads, the inline and standalone forms, and the visited state. What spans components stays in [`../patterns/actions.md`](../patterns/actions.md): button or link, and the actions around them; the wording of every label is [content: button and link labels](../design/content.md#button-and-link-labels). Related: [button](button.md), [breadcrumbs](breadcrumbs.md), [tabs](tabs.md), [navigation](../patterns/navigation.md).

## Overview

**Use when / don't use**
- [strong] A link when activating it takes the person somewhere; a button when the action happens here ([actions: buttons or links](../patterns/actions.md#buttons-or-links)).
- [moderate] One component with two forms: inline, inside running text, and standalone, on its own line or in a list. Primer and Carbon both carry it as an `inline` prop on one Link ([Primer Link source](https://github.com/primer/react/blob/main/packages/react/src/Link/Link.tsx), [Carbon Link source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Link/Link.tsx)).
- [weak] A set of links that marks where the reader is (tabs that navigate, a breadcrumb trail, a sidebar) is its own component built on the link, because it carries `aria-current` (code-standard rule 64; [tabs](tabs.md), [breadcrumbs](breadcrumbs.md)).

**Anatomy**
- [required] The text, which is the accessible name, and an optional trailing icon for a new tab or a download, decorative and hidden, its meaning said in words (code-standard rule 18; [links: text, new tabs and downloads](#links-text-new-tabs-and-downloads)).
- [required] An inline link is told from the text around it by more than colour: an underline, or a 3:1 contrast with the surrounding text plus a further cue on hover and focus (WCAG 1.4.1; [F73](https://www.w3.org/WAI/WCAG22/Techniques/failures/F73), [G183](https://www.w3.org/WAI/WCAG22/Techniques/general/G183)).
- [required] A focus ring around the text, visible on every form (WCAG 2.4.7; figma-standard rule 39).
- [required] A standalone link is a target of at least 24 by 24 CSS pixels; a link inside a sentence is exempt, by 2.5.8's own Inline exception ([W3C Understanding 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html); figma-standard rule 26).

## Links: text, new tabs and downloads

**Use when / don't use**
- [strong] Every link: its text says where it goes or what it gets, external links, links to files, and the rare link that opens a new tab. The wording convention is [content: button and link labels](../design/content.md#button-and-link-labels); this section adds the behaviour around it.
- [weak] Not for actions. Carbon's [link usage](https://carbondesignsystem.com/components/link/usage/): "Do not use links for actions that will change data or manipulate how it is displayed" (see *Buttons or links*).

**How**
- [strong] **Text names the destination.** Link the noun phrase, front-loaded; never "click here" (GOV.UK's [writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces): "‘click here’ is not accessible link text"). Carbon: "Avoid using the same link text for different destinations on the same page".
- [moderate] **Same tab by default.** NN/g's [new tabs and windows](https://www.nngroup.com/articles/new-browser-windows-and-tabs/): "For the most part, always open links in the same browser tab or window." GOV.UK's [links](https://design-system.service.gov.uk/styles/links/): "Avoid opening links in a new tab or window."
- [moderate] **A new tab when leaving would lose work.** GOV.UK's case: "to stop the user losing information they’ve entered into a form", such as a help link inside a form; Atlassian's [link](https://atlassian.design/components/link/usage) puts it the same way: "a risk of someone losing their current place or task". Then warn: GOV.UK includes "the words ‘opens in new tab’ as part of the link".
- [contested] **External is not a warning.** GOV.UK: "Do not use an external link icon"; a link to another site in the same tab behaves like any link. Carbon and Atlassian draw a launch icon; the toolkit keeps the icon for links that open a new tab, beside the words (Atlassian: "If the icon is not desired, reconsider if the link should open in a new window").
- [moderate] **Downloads say type and size.** NN/g's [PDF article](https://www.nngroup.com/articles/avoid-pdf-for-on-screen-reading/): "include the page count and the file size in close proximity to the link". Write "Annual report (PDF, 2MB, 40 pages)"; sizes follow the [GOV.UK style guide](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/style-guides/a-to-z-style-guide/) ("Use MB for anything over 1MB") and [content: numbers](../design/content.md#numbers-dates-times-units).

**Cases**
- "To read our privacy notice, click here" → "Read our privacy notice"; the link reads alone in a links list.
- A "Help with this question" link on page 4 of a form → opens in a new tab and says so, since following it in place risks the answers.
- Every link in a footer to another site opens a new tab with an icon → same tab, no icon.
- "Download" beside three files → "Download the 2025 accounts (CSV, 340KB)".

**Accessibility**
- [required] 2.4.4 Link Purpose (In Context): links help people "choose which links to follow" ([W3C Understanding 2.4.4](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html)); 2.4.9 (AAA) wants the text alone to do it.
- [moderate] 3.2.5 Change on Request (AAA) and the W3C's [G201](https://www.w3.org/WAI/WCAG22/Techniques/general/G201): a new tab gets a warning both spoken and seen, "Check that there is a visual warning/indication that this control opens a new window." An icon alone is not spoken; it needs a name.

**Build**
- [required] `<a href>` with the destination in its text; the element and its siblings are [HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons).
- [strong] A new-tab link: `target="_blank"` and "(opens in new tab)" in the text or a visually hidden span ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)); any icon is `aria-hidden` (code-standard rule 18). `target="_blank"` already implies `rel="noopener"` ([MDN `<a>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a)); GOV.UK still writes `rel="noreferrer noopener"`, and stating it costs nothing ([security: *Third-party scripts and Subresource Integrity*](../../code/security.md#third-party-scripts-and-subresource-integrity)).
  ```html
  <a href="/help/income" target="_blank" rel="noopener noreferrer">Help with income<span class="visually-hidden"> (opens in new tab)</span></a>
  ```
- [required] A download: `<a href="/files/accounts-2025.csv" download>` with type and size in the text; MDN: `download` "only works for same-origin URLs, or the `blob:` and `data:` schemes". Size is read from the file at render, never typed (code-standard rule 57).
- [required] A script that takes over a link leaves modified clicks to the browser, so the person can choose a new tab themselves (code-standard rule 21).

**Check**
- *Script* could: flag link text in the content page's banned list, `target="_blank"` without "new tab" in the accessible name, `download` or file-extension `href`s without a type in the text, and one text pointing at two URLs.
- *Judgement*: would leaving this page in the same tab lose anything the person did?

**Sources.** On external links GOV.UK says no icon, Carbon and Atlassian draw one. The toolkit follows GOV.UK for same-tab external links (going to another site needs no warning) and Atlassian for new tabs (the icon marks the behaviour that does), with the words always, as MDN, GOV.UK and G201 ask.

## In Figma

**Layers**
- [required] The inline link is a text style applied to a range inside the paragraph's own text layer, not a component; the component serves the standalone link (figma-standard rule 53).
- [required] The standalone link is an auto-layout frame, never a group, holding `Label` and an optional `Icon` after it; the text hugs, so a longer label grows the link (figma-standard rules 10 and 33).
- [required] The icon's position is `Trailing`, never `Right` (figma-standard rule 21); where the project mirrors, a new-tab or external glyph records in its description whether it mirrors (figma-standard rule 50).

**Properties**
- [required] The text is a text property named for what it holds, `Label`; Figma's Simple Design System names it `Text` and maps it to the link's children ([SDS TextLink.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/text/TextLink.figma.ts); figma-standard rules 21 and 37).
- [required] The icon is an instance swap, `Icon`, revealed by `Show icon` directly above it (figma-standard rules 5 and 21).

**Variants and states**
- [required] `State` runs `Rest → Focus → Hover → Press`; each draws differently from Rest and Focus shows a ring (figma-standard rules 4, 31 and 39).
- [required] The axes run `Size → Visited → Disabled → State` (figma-standard rule 1); `Visited` is a True/False variant, `False` first, and a disabled link has no destination to have visited, so `Visited=True` never pairs with `Disabled=True` (figma-standard rule 2).
- [required] A `Visited=True` variant differs from its `False` sibling in colour only: browsers apply nothing but colours under `:visited` ([MDN `:visited`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:visited)).
- [weak] Draw `Visited` only where the product marks visited links; Carbon's `visited` prop is opt-in ([Carbon Link source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Link/Link.tsx)).
- [required] `Disabled`, where the library draws it, is a True/False variant before `State` and pairs only with Rest (figma-standard rules 1 to 3); in code it is a link without a destination (code-standard rule 62).
- [required] Sizes, where the link has them, are `Size` with t-shirt values, largest first; Carbon's Link takes `sm`, `md`, `lg` (figma-standard rule 6).

**Tokens**
- [required] Every fill, stroke and gap is bound to a semantic variable, never a primitive, and the text fill takes a text-role token (figma-standard rules 24, 28 and 29).
- [required] Hover, Press and Visited each bind their own state's colour (figma-standard rule 48).
- [required] Where the project has component tokens, they are named `Component/Link/<Element>/<property>[-<variant>][-<state>]` and alias semantic ones (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set.
- *Judgement*: does an inline link in the text style still read as a link with the colour taken away?

**Sources.** Figma's Simple Design System for the property name; Primer and Carbon for the inline form; Carbon for visited and size; WCAG's F73 and G183 for links in text; MDN for what `:visited` can change. The inline-as-text-style split is the toolkit's reasoning from what Figma can place in text.

## Alignment with code

**Structure**
- [strong] One component in code, the inline form a prop of it, never a component of its own: Carbon's `inline`, Primer's `inline`, MUI's `underline` ([Carbon Link source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Link/Link.tsx), [Primer Link source](https://github.com/primer/react/blob/main/packages/react/src/Link/Link.tsx), [MUI Link types](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Link/Link.d.ts)); SDS's `Link` is a bare `a` ([SDS Link.tsx](https://github.com/figma/sds/blob/main/src/ui/primitives/Link/Link.tsx)). Carbon's and Primer's kits draw the inline form inside the one set, as `Type=Inline` and an `inline` boolean ([Carbon Link.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Link/Link.figma.ts), [Primer Link.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/Link/Link.figma.tsx)); this page departs (*Differences*).
- [moderate] The icon is a part of the link, never a component: Carbon takes one trailing `renderIcon`, while Primer's kit has `leadingVisual` and `trailingVisual` that its Code Connect writes as children of `Link`, which has no icon prop (sources as above). So the set nests one icon instance, trailing, as [In Figma](#in-figma) draws it.

**Mapping**
- [required] Each Figma axis maps to one attribute or prop, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | the inline text style | `inline`, its underline from the style |
  | `Label` | children |
  | `Show icon`, `Icon` | the trailing icon, `aria-hidden="true"` |
  | `Size` | `size` |
  | `Visited=True` | `:visited`, colours only |
  | `Disabled=True` | no `href`, `aria-disabled="true"` |
  | `State=Hover`, `Press` | `:hover`, `:active`, set by the browser |
  | `State=Focus` | `:focus-visible` |
- [required] Write `:visited` before `:hover` and `:active`, so a visited link still shows them: MDN's LVHA order ([MDN `:visited`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:visited)).

**States**
- [required] Rest, Hover, Press, Focus and Visited are set by the browser, as `:hover`, `:active`, `:focus-visible` and `:visited`; no prop sets them, and Carbon's `visited` prop only opts into styles for the browser's `:visited` ([Carbon Link source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Link/Link.tsx); code-standard rule 9).
- [required] Disabled is set by code, by dropping the `href` (code-standard rule 62): Carbon then writes `aria-disabled` and `role="link"`, React Aria renders a `span` ([React Aria Link source](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria-components/src/Link.tsx)); Primer's and MUI's links have no disabled state at all.
- [required] Code cannot reach Visited with Disabled: `:visited` is a subset of `:any-link`, which matches only an `a` with an `href` ([MDN `:any-link`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:any-link)), so no frame pairs them (figma-standard rule 2).
- [required] Code reaches Visited with Hover, Press and Focus, since `:visited` is written before them (the *Mapping*), so each `State` value is drawn under `Visited=True` too ([MDN `:visited`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:visited); figma-standard rule 31).
- [weak] Carbon renders no icon on an inline link (`!inline && Icon`), a combination its code cannot reach ([Carbon Link source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Link/Link.tsx)); this page never draws it, as its inline form is a text style.

**Differences**
- [weak] The inline link is a text style here, where code has one component with `inline` and Carbon's and Primer's kits a variant of the one set: Figma cannot place an instance inside a run of text ([In Figma](#in-figma)). The mapping's first row is where the two meet.
- [required] `Disabled` is a True/False variant before `State` (figma-standard rule 1), where Carbon's kit draws it as `State=Disabled` ([Carbon Link.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Link/Link.figma.ts)); both map to one boolean prop.
- [required] The text is `Label` (figma-standard rule 21), where SDS names it `Text` and Carbon `Link text`; each maps to the link's children, which have no prop name of their own ([SDS TextLink.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/text/TextLink.figma.ts), [Carbon Link.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Link/Link.figma.ts)).

**Check**
- *Script*: the component contract lists every Figma axis and property beside the link's props; a row in one with no partner in the other, and no line under *Differences*, is a finding (design-code-parity). The inline text style is outside the contract, so its row is read by hand.
- *Judgement*: could a developer build every frame from `href`, `inline`, `size`, the icon and the browser's states alone, and does every prop have a frame?

**Sources.** Carbon, Primer, MUI, React Aria and SDS source and Code Connect files as linked, read for the split, the icon and the disabled link; MDN for `:visited` and `:any-link`. The inline link as a text style is the toolkit's reasoning from what Figma can place in text.

## In code

**Element**
- [required] An `a` with an `href`; nothing else navigates (code-standard rule 8; [HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- [required] A link with no destination drops its `href` and carries `aria-disabled="true"`, never `disabled` (code-standard rule 62).

**Props**
- [moderate] `href`, the text as children, `inline` for a link inside running text, and an optional icon. Primer (`inline`, `muted`) and Carbon (`inline`, `size`, `visited`, `renderIcon`, `disabled`) share this shape ([Primer Link source](https://github.com/primer/react/blob/main/packages/react/src/Link/Link.tsx), [Carbon Link source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Link/Link.tsx)); MUI reaches the inline question through `underline="always|hover|none"` ([MUI Link](https://mui.com/material-ui/react-link/)).
- [required] `target`, `rel` and `download` pass through to the `a` unchanged, and `target="_blank"` brings the new-tab words with it ([links: text, new tabs and downloads](#links-text-new-tabs-and-downloads)).

**Check**
- *Script*: the parity loop compares each variant with its frame (design-code-parity), but `getComputedStyle` reports a visited link's unvisited colour, so the Visited frame is named as unmeasured (MDN; code-standard rule 37).
- *Judgement*: does every inline link read as a link in greyscale?

**Sources.** Primer, Carbon and MUI for the props; MDN for `:visited` and its order; the toolkit's *Variants to attributes* for the mapping.
