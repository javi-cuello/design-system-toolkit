# Button

A button does something here: submits, saves, opens a dialog, toggles, deletes. This page owns the button as a component, in design, in Figma and in code: its ranks, sizes, labels, icon-only form, loading and disabled states, split buttons and the floating action button. What spans components stays in [`../patterns/actions.md`](../patterns/actions.md): button or link, destructive actions, groups and order, Cancel, close and back, toolbars. Related: [link](link.md), [segmented control](segmented-control.md), [menus](../patterns/menus.md).

## Overview

**Use when / don't use**
- [strong] A button when the action happens here; a link when it takes the person somewhere ([actions: buttons or links](../patterns/actions.md#buttons-or-links)).
- [strong] One component for every rank; compactness is a size and a bare clickable icon is the icon button's lowest rank, never a component of their own. MUI, Atlassian, Polaris, Carbon and Material 3 all reach compact through a size value ([MUI Button](https://mui.com/material-ui/react-button/), [Carbon button](https://carbondesignsystem.com/components/button/usage/)).
- [contested] Icon-only is its own component in MUI, Primer, Atlassian, Spectrum and Radix, and a form of Button in Fluent, Polaris and Ant Design ([Primer IconButton](https://primer.style/product/components/icon-button/), [Fluent migration](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/docs/MIGRATION.md)). Which a project's Figma draws is *In Figma*, [one component or two](#in-figma).

**Anatomy**
- [strong] A container holding, in reading order, an optional leading icon, the label, and an optional trailing icon or count; a spinner replaces nothing and takes no width of its own while loading. Primer names these `leadingVisual`, `trailingVisual`, `trailingAction` and `count` ([Primer Button types](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Button/types.ts)); Figma's Simple Design System names them `Icon Start`, `Label`, `Icon End` ([SDS Button.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/button/Button.figma.ts)).
- [required] A focus ring, visible on every rank (WCAG 2.4.7; figma-standard rule 39); how it is drawn is [accessibility: *Visible focus*](../../code/accessibility.md#visible-focus).
- [required] A target of at least 24 by 24 CSS pixels, the bare icon included (figma-standard rule 26; WCAG 2.5.8).

## Button hierarchy

**Use when / don't use**
- [strong] Every view with buttons ranks them: one primary for the most likely next step, the rest quieter. This section owns button hierarchy; other pages link here.
- [strong] Carbon: "Each page should have only one primary button." Apple's [buttons](https://developer.apple.com/design/human-interface-guidelines/buttons): "Keep the number of prominent buttons to one or two per view." GOV.UK: "Avoid using multiple default buttons on a single page."
- [weak] Don't force a primary onto a page whose purpose is reading. Carbon: "Not every page needs a primary button."

**How**
- [contested] Four roles, mapped once to the project's variants in its context document:
  - **Primary**: the principal action, once per view. Carbon allows a second only in a "temporary flow", such as a side panel over a page with its own primary.
  - **Secondary**: Carbon pairs it with a primary for the negative action ("Cancel", "Back"); [Primer](https://primer.style/product/components/button/guidelines/) makes it the everyday button: "Most of the time, we use the secondary variant."
  - **Tertiary or outline**: independent actions, and Carbon's choice for page headers, because the content below "is probably going to have a primary action".
  - **Ghost or invisible**: supplementary actions in toolbars, cards and rows, and Cancel in a progressive flow.
- [weak] A region the person opened (a dialog, a side panel) may have its own primary; ten dashboard cards do not get ten.
- [weak] Distinguish the preferred action by style, never size. Apple: "Use style — not size — to visually distinguish the preferred choice."
- [weak] When something fails to stand out, quieten its neighbours before adding emphasis.

**Cases**
- A settings page with "Save changes" at the foot and "Invite member" in the header → Save primary, Invite tertiary.
- A table toolbar on a page that already has a primary → its main action is ghost (Carbon: "Use a ghost button instead if there is another button on the page that requires primary styling").
- A dashboard where every card has a filled "View" → ghost buttons or a linked card title.
- An empty state on a page with a primary → a tertiary call to action (Carbon).

**Accessibility**
- [required] 1.4.1 Use of Color: the label carries the meaning; Primer's [button accessibility](https://primer.style/product/components/button/accessibility/): "color alone isn't reliable".
- [required] 1.4.11 Non-text Contrast and 1.4.3: an outline's boundary or a ghost's text identifies the control.
- [required] In a Figma library: figma-standard rule 31 (states differ, focus shows) and figma-standard rule 32 (text contrast in every mode).

**Build**
- [required] One button component; the four roles are one attribute on the wrapper, `appearance="primary|secondary|tertiary|ghost"`, mapped once to the project's Figma axis ([figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes); code-standard rules 9 and 10).
  ```css
  ds-button[appearance="primary"] > :is(button, a) { background: var(--color-action-primary-bg); }
  ds-button[appearance="ghost"] > :is(button, a) { background: transparent; }
  ```
- [required] Every colour, border and radius per variant is a token, never a literal (code-standard rule 22; [tokens: *Three tiers*](../../code/tokens.md#three-tiers)).
- [required] Rest, hover, press and focus are `:hover`, `:active` and `:focus-visible` on the native control, never attributes (code-standard rule 9); the ring is [accessibility: *Visible focus*](../../code/accessibility.md#visible-focus).
- [required] A caller that needs a one-off adjustment sets a custom property the component reads, never a rule of its own (code-standard rule 38).

**Check**
- *Script* could: count primary-variant elements per page and per landmark region, flagging more than one outside an open dialog or panel; the same per top-level Figma frame.
- *Judgement*: is the one primary the action most people came to take?

**Sources.** All four agree on one primary (Apple allows two prominent). Carbon reserves secondary for the negative half of a pair; Primer makes it the default. Both keep the primary alone.

## Button sizes

**Use when / don't use**
- [strong] A short ladder of named heights, one of them the default, as all 13 systems below ship.

One screen keeps to one step: see [visual: one size scale per screen](../design/visual.md#one-size-scale-per-screen).
- [weak] Don't use a bigger size to rank an action ([button hierarchy](#button-hierarchy)).

**How**

Heights in CSS px that 13 web systems ship, read from their source on 22 November 2026, the default in bold. The last column is what a touch or small screen gets, where the source changes it.

| System | Heights | Touch or small screen |
|---|---|---|
| [Primer](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/size.json5) | 24, 28, **32**, 40, 48 | 44 target on a coarse pointer |
| [Carbon](https://unpkg.com/@carbon/styles/css/styles.css) | 24, 32, 40, **48**, 64, 80 |  |
| [Fluent 2](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-button/library/src/components/Button/useButtonStyles.styles.ts) | 24, **32**, 40 |  |
| [Atlassian](https://unpkg.com/@atlaskit/button/dist/esm/new-button/variants/shared/button-base.compiled.css) | 24, **32** |  |
| [Spectrum](https://raw.githubusercontent.com/adobe/spectrum-design-data/main/packages/tokens/src/layout.json) | 24, **32**, 40, 48 | 30, 40, 50, 60 |
| [Radix Themes](https://raw.githubusercontent.com/radix-ui/themes/main/packages/radix-ui-themes/src/components/_internal/base-button.css) | 24, **32**, 40, 48 |  |
| [Ant Design](https://raw.githubusercontent.com/ant-design/ant-design/master/components/theme/themes/shared/genControlHeight.ts) | 24, **32**, 40 |  |
| [TDesign](https://raw.githubusercontent.com/Tencent/tdesign-common/develop/style/web/theme/_size.less) | 24, **32**, 40 |  |
| [Polaris React (deprecated)](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-react/src/components/Button/Button.module.css) | 24, **28**, 32 | 28, 32, 36 |
| [shadcn/ui, Vega](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/button.tsx) | 24, 32, **36**, 40 |  |
| [HeroUI](https://raw.githubusercontent.com/heroui-inc/heroui/v3/packages/styles/components/button.css) | 32, **36**, 40 | 36, 40, 44 |
| [Mantine](https://raw.githubusercontent.com/mantinedev/mantine/master/packages/@mantine/core/src/components/Button/Button.module.css) | 30, **36**, 42, 50, 60 |  |
| [Chakra UI](https://raw.githubusercontent.com/chakra-ui/chakra-ui/main/packages/react/src/theme/recipes/button.ts) | 24, 32, 36, **40**, 44, 48, 64 |  |

- [strong] **24, 32 and 40 are the core.** 32 ships in 12 of the 13, 24 in 11 and 40 in 10; 9 ship all three, among them systems of separate origin (Primer, Carbon, Fluent, Ant Design, TDesign, Spectrum), so the steps are 8px apart.
- [strong] **32 is the commonest default on the web**, in 7 of the 13: Primer, Fluent, Atlassian, Spectrum, Radix, Ant Design and TDesign.
- [contested] **A roomier default.** 36 in shadcn's Vega, HeroUI and Mantine; 40 in Chakra, and WordPress moves its editor components toward a 40px default, deprecating 36, to end a 30 to 40px spread ([WordPress 6.8](https://make.wordpress.org/core/2025/03/25/updates-to-user-interface-components-in-wordpress-6-8/)); 48 in Carbon. The other way, shadcn's denser [Nova](https://ui.shadcn.com/r/styles/base-nova/button.json) takes 32 where Vega has 36.
- [strong] **48 is the optional step above**, for the large or prominent button: Primer, Spectrum, Radix and Chakra (4 of the 13); Carbon's 48 is its default.
- [moderate] **28 is a dense step, rarely on the ladder**: Primer's small and Polaris's medium (2 of the 13). Ant Design reaches 28 as a mode instead, its compact theme lowering 32 by 4, and Mantine has compact heights of 22 to 40 ([compact theme](https://raw.githubusercontent.com/ant-design/ant-design/master/components/theme/themes/compact/index.ts)).
- [moderate] **36 replaces or splits the 32 to 40 gap**: 4 of the 13, three of them on Tailwind's spacing scale or a copy of it (shadcn, HeroUI, Chakra), which count as one origin beside Mantine.
- [moderate] **44 is a touch size, rarely a web step**: only Chakra's ladder has it (1 of the 13), HeroUI uses it for large on small screens, and Primer as the minimum target for a coarse pointer.
- [strong] **Small screens and touch get more.** Spectrum's mobile scale takes 32 to 40, Polaris 28 to 32 and HeroUI 36 to 40, the last two by breakpoint; Material 3 goes the other way from the same idea, 40 to 36 for a precision pointer ([Compose Button](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Button.kt)).
- [contested] **How touch gets it.** The box grows (Spectrum, Polaris, HeroUI), or only the target does (Primer's 44px `minTarget` for a coarse pointer; Android pads small components to 48dp), or the box stays and the gap widens ([responsive: touch targets](../../code/responsive.md#touch-targets), a weak item).
- [required] **In a native app the platform's numbers hold.** Apple: a 44 by 44pt hit region on iOS and iPadOS, 28 the smallest control; on macOS 28 by default and 20 the smallest ([Apple accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)). Android: a 48dp target ([API defaults](https://developer.android.com/develop/ui/compose/accessibility/api-defaults)); Material 3's buttons are 32, 40 (default), 56, 96 and 136dp ([small tokens](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ButtonSmallTokens.kt)).
- [weak] For one-handed thumb use a 2006 study of handhelds found 9.2mm enough for single taps, about 58dp, above both platforms' minimums ([Parhi, Karlson and Bederson](https://www.microsoft.com/en-us/research/publication/target-size-study-for-one-handed-thumb-use-on-small-touchscreen-devices/)). No study read compares 24, 32, 36 and 40px buttons under a mouse: those steps rest on what ships.
- [strong] **A size name carries no height across systems**: medium is 28 in Polaris, 32 in Primer and Fluent, 40 in Carbon and Chakra, so map a kit or a library by its pixels, never by its names.

**Cases**
- A ladder of 48, 44, 40, 36, 32, 28 and 24 → no system read ships all seven, and neighbours 4px apart are hard to choose between; start from 24, 32 and 40, and add 48 or 28 when a screen needs it.
- A dense admin tool → 32 by default, 24 inside rows and toolbars.
- A web app used as much on phones → the desktop step with a larger box or target on a coarse pointer, never a second component.
- A kit's "md" at 40 brought into code whose "md" is 32 → map it to the code's large.

**Accessibility**
- [required] [2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) (AA): a target of 24 by 24 CSS px or the spacing exception, so 24 is the smallest step that passes alone. [2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) (AAA, advisory here) asks 44 by 44.
- [required] [1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) and [1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): a step is a minimum height, so a wrapped or enlarged label grows the button and is never clipped.

**Build**
- [moderate] One control-height token per step, read by button, field and select alike ([tokens: spacing tokens](../../code/tokens.md#spacing-tokens)).
- [required] A step is written in rem (code-standard rule 54) as `min-block-size`, so it grows with its text (1.4.4).
- [contested] What switches the touch size: the pointer, as Primer's coarse target and Material's precision pointer do, or the width, as Polaris and HeroUI do. `@media (pointer: coarse)` matches a primary pointer of limited accuracy at any width ([MDN *pointer*](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/pointer)). By pointer:
  ```css
  :root { --control-height-sm: 1.5rem; --control-height-md: 2rem; --control-height-lg: 2.5rem; }
  @media (pointer: coarse) { :root { --control-height-md: 2.75rem; --control-height-lg: 3rem; } }
  ds-button > :is(button, a) { min-block-size: var(--control-height-md); }
  ```

**Check**
- *Script* could: collect rendered button and field heights per screen and flag one off the ladder, a row with two heights, a box under 24 by 24, and, with a coarse pointer emulated, a primary action under 44.
- *Judgement*: does each step have a place it is used, or could it go?

**Sources.** Each system's shipped source: heights in the files linked in the table, defaults in the same packages' component props or seed tokens; Apple, Android and WCAG for minimums. Counts treat each system once, and the sample leans to React libraries and desktop products: Carbon and the consumer-facing kits show the roomier side. Values move with releases.

## Button labels

**Use when / don't use**
- [strong] Every button with text: a verb, plus the object when the verb alone is ambiguous. The verb-and-object convention for all labels is [content: button and link labels](../design/content.md#button-and-link-labels).
- [strong] Don't use "OK", "Yes", "No", "Submit" or "Click here" where a specific verb fits.

**How**
- [moderate] Carbon: {verb} + {noun}, except common actions like "Done", "Close", "Cancel", "Add", "Delete"; "Do not use only a noun." Apple: start with a verb, "Add to Cart".
- [moderate] Name the outcome in confirmations. Apple's alerts: "Erase", "Convert", "Clear", "Delete"; "OK" only when purely informational; always "Cancel" for cancel. Carbon's [modal](https://carbondesignsystem.com/components/modal/usage/): "Avoid vague or passive words, such as Done or OK."
- [weak] Say whether it saves: GOV.UK separates "Continue" from "Save and continue", and adds words when needed ("Add another address").
- [weak] Sentence case, no terminal punctuation.
- [strong] A toggle keeps its label and exposes `aria-pressed`, or changes its label ("Mute" to "Unmute") and exposes no pressed state (W3C button pattern).
- [weak] A selection button shows the value, or "2 selected" for several (Primer).

**Cases**
- "Submit" on an application → "Send application".
- "Are you sure? Yes / No" → "Delete 3 files?" with "Delete files" and "Cancel".
- A label overflows on a phone in German → shorten the source, then wrap; Carbon: "We do not recommend truncating a button label."
- Six "Learn more" buttons on six cards → names that say about what.

**Accessibility**
- [required] 2.5.3 Label in Name: an `aria-label` contains the visible words, best at the start ([W3C Understanding 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)). 2.4.6 Headings and Labels: labels describe purpose.
- [required] A label that changes on activation ("Star" to "Starred") is announced (Primer's button accessibility). A count beside a button is a description (code-standard rule 15).

**Build**
- [required] The visible text is the accessible name; an `aria-label`, where one is needed, starts with the visible words ([accessibility: *Accessible names and descriptions*](../../code/accessibility.md#accessible-names-and-descriptions)).
- [strong] A toggle keeps one label and carries `aria-pressed="true|false"`, styled from `[aria-pressed="true"]`; a label that changes ("Mute" to "Unmute") carries no pressed state ([APG button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)).
- [required] A count or "2 selected" beside the label is a description (`aria-describedby`), not part of the name (code-standard rule 15).
- [contested] Labels wrap rather than truncate: no `white-space: nowrap` or fixed `inline-size` on the button text ([i18n: *Text expansion and no fixed widths on text*](../../code/i18n.md#text-expansion-and-no-fixed-widths-on-text)).
- [required] Strings come from the project's message catalogue whole, never assembled from fragments ([i18n: *Strings a translator can work with*](../../code/i18n.md#strings-a-translator-can-work-with)).

**Check**
- *Script* could: flag vague names (OK, Yes, No, Submit, Click here, Learn more alone), an `aria-label` missing the visible text, terminal punctuation.
- *Judgement*: from the label alone, does a person know what happens and whether it saves?

**Sources.** Carbon wraps an overflowing label; Primer says buttons "should never contain line breaks". Truncation loses words when translation or zoom overflows a label (1.4.12, see [`disclosure.md`](../patterns/disclosure.md)).

## Icon-only buttons

**Use when / don't use**
- [weak] Only for standard, recognisable icons where space is scarce, typically a toolbar of several actions (Carbon's two cases: "standardized and recognizable without label", or "insufficient space and multiple actions").
- [weak] Elsewhere label it. NN/g's [icon usability](https://www.nngroup.com/articles/icon-usability/): "a text label must be present alongside an icon", and labels "should be visible at all times".

**How**
- [required] An accessible name that says the action ("Close dialog", "More actions for invoice 1042"), the glyph hidden (code-standard rule 18).
- [moderate] A tooltip with the same words on hover and focus, always. Carbon: "a tooltip is always required." [Primer](https://primer.style/product/components/tooltip/guidelines/) wires the visible tooltip as the name.
- [required] A hit area of at least 24 by 24 even for a 16-pixel glyph (figma-standard rule 26).
- [weak] One content type per group: icons or text, never mixed ([Primer ActionBar](https://primer.style/product/components/action-bar/guidelines/)).
- [weak] Touch has no hover: on touch-first layouts show the label or use a labelled menu.

**Cases**
- Five unlabelled icons in a card footer → keep edit and more as icon buttons; move the rest into "More" with text.
- A pencil whose tooltip says "Pencil" → "Edit title".
- Fifty rows each with a "More" button named "More" → include the row: "More actions for invoice 1042".
- A tooltip repeating the visible label → remove it; NN/g's [tooltip guidelines](https://www.nngroup.com/articles/tooltip-guidelines/) call this "repetitive and unnecessary".

**Accessibility**
- [required] 4.1.2 and 1.1.1: the name (code-standard rule 18). 1.4.13: the tooltip is dismissible, hoverable, persistent ([`dialogs.md`](../patterns/dialogs.md), *Tooltips*). 1.4.11: the glyph at 3:1. 2.5.8: 24 by 24 or spacing.

**Build**
- [required] A `button` with `aria-label`, or `aria-labelledby` pointing at its tooltip; the `svg` is `aria-hidden="true"`; the component requires the label in its API (code-standard rule 18).
  ```html
  <button type="button" aria-label="More actions for invoice 1042">
    <svg aria-hidden="true" focusable="false">…</svg></button>
  ```
- [weak] The tooltip's wiring, hover and focus behaviour and Escape are [accessibility: *Tooltips and toggletips*](../../code/accessibility.md#tooltips-and-toggletips).
- [required] The 24 by 24 box comes from padding and `min-inline-size`/`min-block-size` tokens around the glyph, never a larger glyph ([responsive: *Touch targets*](../../code/responsive.md#touch-targets)).
- [required] A name that varies per row (`… for invoice 1042`) is built in the template from the row's own data, one string in the catalogue with a placeholder ([i18n: *Strings a translator can work with*](../../code/i18n.md#strings-a-translator-can-work-with)).

**Check**
- *Script* could: flag nameless buttons (axe covers it), icon buttons with no tooltip on hover or focus, boxes under 24 by 24.
- *Judgement*: would a first-time visitor recognise the icon without hovering?

**Sources.** Carbon and Primer require the tooltip; NN/g argues for visible labels.

## Loading buttons

**Use when / don't use:** the action decides, not the button. Most presses need no spinner.

| The press | The button shows |
|---|---|
| Navigates: a link, or a form that loads a new page with no script | Nothing; the browser's own loading state runs. Guard the double press only |
| Fast and repeatable, result visible in place (sort, filter, expand) | The pressed state; the result is the feedback. A slow region load is that region's indicator ([feedback: loading](../patterns/feedback.md#loading)) |
| Flips a reversible state that almost always succeeds (star, like, toggle, reorder) | The new state at once, rolled back with a message on failure: optimistic. A spinner only if confirmation runs past the threshold |
| Commits work the person waits on, result in place (save, send, pay) | A spinner in the button after the threshold; the button stays focusable and ignores presses |
| Irreversible or costly (pay, delete, publish) | Never optimistic; a spinner past the threshold, and a server-side guard |
| Past about ten seconds, or measurable | Determinate progress with Cancel outside the button, as a background task (Primer); the button returns |

The threshold is [interaction: response times](../design/interaction.md#response-times-and-perceived-performance): about a second.

**How**
- [moderate] **Delay, then hold.** Block the second press at once; show the spinner only past the threshold, and once shown keep it a short minimum so it does not flash. React Spectrum: "After a 1 second delay, an indeterminate spinner will be displayed in place of the button label and icon."
- [required] **Keep the width.** The spinner sits inside the same box; the button neither shrinks nor grows, and its neighbours stay put (design-standard rule 2). Size it from its widest label state.
- [contested] **Keep the label, or hide it in place.** Two treatments, both holding the width:
  - *Label kept:* Primer's spinner "replaces only that visual slot, and the button label remains visible"; Apple (iOS) changes the verb: "Checkout" becomes "Checking out…", and a changed label is announced too (Primer). Choose it where the person must still read what is running: a long wait, or several buttons that can each be busy.
  - *Label hidden:* [React Spectrum](https://react-spectrum.adobe.com/react-spectrum/Button.html) shows the spinner "in place of the button label and icon"; [Polaris](https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button)'s `loading` will "replace the button content with a loading indicator". Choose it where the press just happened and the button stands alone, so what is in progress is plain from context, or where a spinner beside the label would not fit the box.
  - *Hide it visually, never from the tree.* Fade the label and icon (opacity 0) and lay the spinner over them: the content still sizes the box, so the width holds without a measured `min-width`, and the label stays the button's accessible name. `visibility: hidden` or `display: none` drops it from the name computation and leaves a nameless button. The name does not change, so the busy state is announced separately (below).
  - The design decides between the two; the code follows the frame (one project's library chose hidden, 14 Oct 2026).
- [contested] **Keep focus.** Primer's button accessibility: "don't remove them from the DOM or add `disabled`… Instead, add `aria-disabled="true"` to indicate the loading state." React Aria: "Pending buttons remain focusable, but are otherwise disabled."
- [weak] **Announce.** A polite live region present on load, whose message ("Saving profile") renders only while loading (Primer).
- [weak] **Guard the double press.** GOV.UK records people double-clicking from habit, slow connections or motor impairments; its `data-prevent-double-click` ignores a second click within one second. Guard on the server too (GOV.UK).
- [moderate] **Optimistic, and honest.** React's `useOptimistic`: on failure "the UI shows what it showed before the optimistic update. You can catch the error to show a message to the user." Primer saves imperative controls (toggle switches, segmented controls) at once, with no save button.
- [weak] **End clearly.** Success shows in place ("Saved", the new row); failure keeps input, says what failed, moves focus to the error heading (Primer).

**Cases**
- "Save" collapses to a spinner and "Cancel" slides left → spinner inside the full-width button.
- The label is hidden with `visibility: hidden` under the spinner → the button reads as "button" with no name; fade it with opacity instead, so the name stays.
- Submit sets `disabled` on the button → `aria-disabled`, so focus is not thrown to the page top.
- A 300 ms save → no spinner; "Saved" after.
- A search form posts and loads the results page → no spinner; the browser shows the load. A double press is ignored.
- A star toggles and waits 600 ms for the server before filling → fill it at once; on failure unfill it and say so.
- "Pay" pressed twice on a slow connection → the second press is ignored in the page and refused by the server's idempotency check; never an optimistic "Paid".
- An export runs 40 s with a spinner in its button → progress in the page with Cancel; the button is free again ([feedback: loading](../patterns/feedback.md#loading)).
- A spinner appears at 900 ms and the response lands at 1,010 ms → a 110 ms flash; hold it the minimum.

**Accessibility**
- [required] 4.1.3 Status Messages: start and end announced without moving focus (a [code candidate](../../code/candidates.md)). 2.4.3: focus stays; if the button goes, code-standard rule 14.

**Build**
- [required] The button stays focusable: `aria-disabled="true"` from the first press, never `disabled`; the handler returns early while it is set, and a submit handler calls `preventDefault()` itself, since `aria-disabled` does not stop a native submit (code-standard rules 9 and 62).
- [moderate] One timer reveals the spinner and the status text past the product's `DELAY`; the same code holds it `MIN` once shown. A CSS `animation-delay` can reveal it, but cannot hold a minimum or time the announcement, so the timer owns all three:
  ```js
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (button.getAttribute('aria-disabled') === 'true') return;   // second press ignored
    button.setAttribute('aria-disabled', 'true');
    const start = performance.now();
    const reveal = setTimeout(() => { button.dataset.pending = ''; status.textContent = 'Saving profile'; }, DELAY);
    try { await save(new FormData(form)); status.textContent = 'Profile saved'; }
    catch (error) { status.textContent = ''; showError(error); }        // focus to the error heading
    finally {
      clearTimeout(reveal);
      const shown = performance.now() - start - DELAY;
      if (shown > 0 && shown < MIN) await new Promise((r) => setTimeout(r, MIN - shown));
      delete button.dataset.pending; button.removeAttribute('aria-disabled');
    }
  });
  ```
  A framework's pending flag (React's `useFormStatus`, a store's `isPending`) feeds the same two attributes; the timing stays in one place.
- [required] An optimistic toggle writes the new state (`aria-pressed`, `aria-checked`) on press, keeps the previous value, and restores it with a message if the request fails (code-standard rule 61).
- [required] The spinner sits inside the same box; the box is sized from its widest label state (a grid stacking both labels in one cell), so nothing moves ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)).
  ```css
  ds-button > button { display: inline-grid; }
  ds-button > button > * { grid-area: 1 / 1; }   /* label and busy label share one cell */
  ```
- [required] The spinner is decorative (`aria-hidden="true"`); start and end are announced through a `role="status"` region present from load ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
- [required] Under `prefers-reduced-motion` the spinner keeps a subtle motion or becomes a still indicator; the label and status carry the state ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).
- [required] Failure reports why, from the response's own error ([javascript: *Errors and an envelope's success flag*](../../code/javascript.md#errors-and-an-envelopes-success-flag); code-standard rule 61).
- [required] `DELAY` and `MIN` are product constants from the threshold table, never a figure per component (code-standard rule 22).

**Check**
- *Script* could: press submit, compare the button's and siblings' boxes before and during loading (tools/ui-check/check.mjs's design-standard rule 2 method), assert focus remains and a live region updated; with the response stubbed at half the threshold, assert no spinner renders; press twice and assert one request.
- *Judgement*: which row of the table is this press, and is a failure safe to roll back?

**Sources.** On focus the systems split: [Primer](https://primer.style/product/components/button/accessibility/) and [React Aria](https://react-aria.adobe.com/Button) keep the pending button focusable; [MUI](https://mui.com/material-ui/react-button/) (`disabled={disabled || loading}` in its source), Chakra (`disabled={loading || rest.disabled}`) and [Carbon](https://carbondesignsystem.com/components/inline-loading/usage/) ("disabled until the action is complete") set `disabled`; [Base Web](https://github.com/uber/baseweb/blob/main/src/button/button.tsx) stays enabled, ignores the click and sets `aria-busy="true"` on the button. `disabled` drops focus; code-standard rules 9 and 62 allow `aria-disabled` as the control's own attribute. Primer's [loading pattern](https://primer.style/product/ui-patterns/loading/) says "the button that initiates the a loading process may not be semantically disabled using `aria-disabled`", which contradicts its own Button page and component (`loading` "sets `aria-disabled` and preserves focus automatically", [Button](https://primer.style/product/components/button/)); the component and its accessibility page win. The delay: [React Spectrum](https://react-spectrum.adobe.com/v3/Button.html) 1 s; [Adobe Commerce](https://developer.adobe.com/commerce/admin-developer/pattern-library/feedback-to-user/progress-indicator) "Delay 500ms before showing the spinner"; no system read publishes a spinner minimum. Double press: [GOV.UK button](https://design-system.service.gov.uk/components/button/) and its [source](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/components/button/button.mjs) (`DEBOUNCE_TIMEOUT_IN_SECONDS = 1`). Optimistic: [React `useOptimistic`](https://react.dev/reference/react/useOptimistic), [Primer saving](https://primer.style/product/ui-patterns/saving/). Atlassian's [button](https://atlassian.design/components/button/examples) "disables the button and blocks user interaction". For the navigating-form row: no system read asks for a spinner on a full page load, where the browser shows its own loading state.

## Disabled buttons

**Use when / don't use**
- [moderate] Only when the action is temporarily impossible and the reason is plain on screen, or to stop a second submit.
- [moderate] Prefer enabled with an explanation on press. GOV.UK: "Disabled buttons have poor contrast and can confuse some users, so avoid them if possible." Primer: "Do not disable buttons."
- [required] The cause decides disabled, read-only, hidden or absent ([interaction: disabled, hidden or read-only](../design/interaction.md#disabled-hidden-or-read-only)); a control that can never apply is not drawn (design-standard rule 5).

**How**
- [moderate] Submit stays enabled: on press, validate, show errors, focus the summary ([forms: submit buttons](../patterns/forms.md#submit-buttons); timing is [interaction](../design/interaction.md#error-prevention-and-validation-timing)).
- [weak] If disabled, say why beside it in associated text; Carbon's [disabled states](https://carbondesignsystem.com/patterns/disabled-states/) asks the message to "describe how the user can enable or re-enable" it.
- [weak] For an outage, Primer's *inactive* button: muted, focusable, and explains on press.
- [required] It keeps its place (design-standard rule 2). The dim is code-standard rules 9 and 62.

**Cases**
- "Create account" greyed until valid → enabled; the error summary lists what is missing.
- "Merge" while checks run → disabled with "Waiting for 2 checks" beside it.
- "Publish" for someone who can never publish → hidden (Carbon's permission case).

**Accessibility**
- [required] 1.4.3 and 1.4.11 exempt inactive controls, so the reason text carries meaning and meets contrast ([interaction](../design/interaction.md#disabled-hidden-or-read-only)).
- [required] 2.1.1: a `disabled` button cannot take focus, so a reason in its tooltip is unreachable by keyboard; use text, or `aria-disabled`.
- [required] Figma: the Disabled variant differs from Rest (figma-standard rule 31).

**Build**
- [required] `disabled` on the native `button`, never on the wrapper; `aria-disabled="true"` where the button must stay focusable to explain itself (code-standard rule 9).
- [required] The dim is one opacity token on the host, matched with `:has(> :disabled)` ([tokens: *The disabled opacity, once*](../../code/tokens.md#the-disabled-opacity-once); code-standard rule 62).
- [required] The reason is visible text tied with `aria-describedby`, never a tooltip on a `disabled` button, which a keyboard cannot reach (code-standard rule 15).
- [required] A disabled link drops its `href` and says `aria-disabled` ([HTML semantics: *Links and buttons*](../../code/html-semantics.md#links-and-buttons)).
- [moderate] A submit button is never disabled by validity; errors say what is missing at the form's validation timing ([interaction: error prevention and validation timing](../design/interaction.md#error-prevention-and-validation-timing)).

**Check**
- *Script*: tools/ui-check/check.mjs: design-standard rule 5 for menus. Could: flag disabled buttons with no `aria-describedby` or adjacent text, and a submit disabled on load.
- *Judgement*: would enabled-and-explain be clearer?

**Sources.** GOV.UK and Primer lean against disabling; Carbon and NN/g disable unavailable options rather than hide them. Different questions: menu options keep their shape (design-standard rule 5); a form's action stays enabled and explains.

## Split buttons and overflow menus

**Use when / don't use**
- [moderate] **Menu button**: equal-weight actions under one trigger, usually in a header.
- [moderate] **Split button** (Carbon: combo button): one dominant default plus alternatives. NN/g's [split buttons](https://www.nngroup.com/articles/split-buttons/): for related tools "if one option is used most frequently".
- [weak] **Overflow menu**: secondary actions on a row or card.
- [weak] Don't hide primary actions in any of them. Apple's [pull-down buttons](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons): "Avoid putting all of a view's actions in one pull-down button."
- [strong] Not for one or two items: Apple suggests "a minimum of three items"; Carbon's [data table](https://carbondesignsystem.com/components/data-table/usage/) keeps fewer than three row actions inline as icon buttons.

**How**
- [weak] Split button: the arrow visibly separated at rest, never only on hover (NN/g); both parts at target size; the label names the default action, never a category. NN/g advises against split buttons on touch unless both parts are large.
- [weak] Fewer than 10 to 12 items, no submenus in a split button, popular first when short, alphabetical when long (NN/g).
- [required] Unavailable items stay, disabled; a menu with nothing enabled is disabled (design-standard rule 5).
- [weak] Destructive items last, after a divider, in danger text.
- [weak] Icons on all items or none; no form controls inside an action menu ([Primer ActionMenu](https://primer.style/product/components/action-menu/guidelines/)).
- [weak] Row "more" buttons persist by default; Carbon keeps them visible on touch even when hover-only is set.
- [weak] Avoid the persistent split button whose default becomes the last choice when users are mixed (NN/g).

**Cases**
- "Merge" with "Squash and merge" and "Rebase and merge" → a split button.
- A row with "Edit" and "Delete" → two named icon buttons, no menu.
- A "More" menu whose items change with the row → one fixed order; non-applicable items disabled (design-standard rule 5).

**Accessibility**
- [required] 4.1.2: the trigger exposes `aria-haspopup` and `aria-expanded` (W3C [menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)); a composite menu role ships with its arrow keys or not at all (a [code candidate](../../code/candidates.md)).
- [strong] 2.1.1: Enter, Space (optionally Down Arrow) open and focus the first item; Escape closes and returns focus.
- [required] `details` gives no Escape or click-outside (code-standard rule 19); check the Popover API first (code-standard rule 8).

**Build**
- [strong] Menu button: a `button` with `aria-haspopup="menu"` and `aria-expanded`, opening a `popover` list that the script makes `role="menu"`; the APG [menu button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) keyboard model, all of it.
- [weak] Split button: two buttons, the default action and a named arrow ("More merge options"), inside one group; never one control with two hit areas.
- [required] Unavailable items keep their place with `aria-disabled="true"`; destructive items last, after `role="separator"` (code-standard rule 62).
- [required] Markup, keys and the no-script path are [accessibility: *Menus, menu buttons and toolbars*](../../code/accessibility.md#menus-menu-buttons-and-toolbars); a `details` menu needs Escape and light dismiss added (code-standard rule 19), the Popover API gives both (code-standard rule 8).
- [required] One menu module for the product, included where needed (code-standard rule 36; [javascript: *One implementation per behaviour*](../../code/javascript.md#one-implementation-per-behaviour)).

**Check**
- *Script*: tools/ui-check/check.mjs: design-standard rule 5 (an empty menu is disabled; options disabled, not hidden). Could: flag triggers without `aria-expanded`, menus under three items; assert Escape closes and returns focus.
- *Judgement*: is the most-used action outside the menu?

**Sources.** Carbon, Apple and NN/g agree on the three-item floor. Carbon offers the combo button freely as a primary; NN/g reserves split buttons for repeat-use desktop tools.

## Floating action buttons

**Use when / don't use**
- [weak] A FAB is fixed over content for a screen's single most important action; Material Web's [FAB documentation](https://github.com/material-components/material-web/blob/main/docs/components/fab.md) says it "represents the most important action on a screen".
- [moderate] Rarely on the web. Carbon's, Primer's and GOV.UK's catalogues ship none, and none of the Apple pages read here describes one; a primary button in the header does the job.

**How**
- [weak] One per screen, positive, never destructive or navigation.
- [weak] Extended (icon and text) over icon-only; Material: "wider than FABs to accommodate a text label and larger target area".
- [weak] Reserve space at the end of the scroll so the last item clears it.
- [required] In the DOM where its action belongs in reading order. At wide layouts, an ordinary header button (code-standard rule 2).

**Cases**
- A desktop dashboard with a "+" FAB opening five creation types → a "Create" menu button in the header.
- A mobile list app where adding is most of the use → extended FAB "New item", list padded at the bottom.

**Accessibility**
- [required] 2.4.11 Focus Not Obscured (Minimum): fixed content must not entirely hide the focused element ([W3C Understanding 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)). 2.4.3: DOM position (code-standard rule 2). 4.1.2: a name (code-standard rule 18).

**Build**
- [required] A labelled `button` (or a link, if it navigates) placed in the DOM where its action belongs in reading order; `position: fixed` places it, the DOM does not move (code-standard rule 2).
- [required] The list reserves the space with `padding-block-end` from the same size token, and the scroll container gets `scroll-padding-block-end`, so focus never lands under it ([accessibility: *Visible focus*](../../code/accessibility.md#visible-focus)).
- [strong] Inset from the edge clears device notches with `env(safe-area-inset-bottom)` ([responsive: *Safe areas*](../../code/responsive.md#safe-areas)).
- [weak] Wide layouts render the same action as an ordinary header button, switched by a container query or breakpoint token, one element restyled rather than two ([responsive: *Breakpoints*](../../code/responsive.md#breakpoints)).
- [required] An icon-only FAB is named (code-standard rule 18).

**Check**
- *Script* could: find fixed interactive elements, tab through, assert none fully covers the focused element.
- *Judgement*: would a header button serve as well?

**Sources.** Only Material documents the FAB among the sources read; its absence from the others is the evidence for "rarely".

## In Figma

**Layers**
- [required] Auto layout throughout, never groups; the label hugs vertically and the container hugs or fills, so a longer label grows the button (figma-standard rule 33).
- [required] Each layer is named for its role in the code's words: `Label`, `Leading icon`, `Trailing icon`, `Spinner`; the same name in every variant, so a consumer's label override survives a variant switch (figma-standard rule 10; Figma's [SDS button](https://github.com/figma/sds/blob/main/src/figma/primitives/button/Button.figma.ts) reads its layers by the code's names).
- [required] Position is `Leading`/`Trailing`, never `Left`/`Right`, so a mirrored right-to-left button keeps its names true (figma-standard rule 21, and figma-standard rule 50 where the project mirrors; across the kits surveyed in [naming inside Figma components](../../../research/components-and-naming/naming-inside-figma-components.md#swaps-variants-and-sizes), leading and trailing tie with left and right at seven each).

**Properties**
- [required] `Label` is a text property; each icon is an instance swap named for what it holds and where (`Leading icon`), revealed by a boolean directly above it (`Show leading icon`) (figma-standard rules 5, 21 and 37).
- [required] The icon-only button exposes a text property or an annotation for its accessible name, and its description says the name is required (figma-standard rule 40).
- [strong] Property names follow the code's props, so the mapping is one line per prop: SDS maps `Variant`, `Size`, `Label` and its two icons straight onto `variant`, `size` and children, though its own icon names (`Icon Start`, `Has Icon Start`) are ones figma-standard rule 21 does not use ([SDS Button.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/button/Button.figma.ts)); Polaris collapsed seven booleans into the enums `variant` and `tone` so each maps as one axis ([Polaris v12 migration](https://github.com/Shopify/polaris-react/blob/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)).

**Variants and states**
- [contested] **Icon button: one component or two.** A merge into Button holds up only when every one of these holds; the split-or-fold test (split when the element, role or keyboard behaviour changes) does not decide it, because icon-only changes none of the three ([when to split or merge](../../../research/components-and-naming/when-to-split-or-merge-a-component.md#separate-icon-buttons)).
  - The code has one component for both: Fluent derives icon-only from `icon` with no children, Polaris and Ant Design the same ([Fluent migration](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/docs/MIGRATION.md)). Where the code has two (MUI, Primer, Atlassian, Spectrum, Radix), two sets keep Figma and code one to one.
  - The square sizes line up with Button's heights. Where they do not, one `Size` axis would mean two things: in one library's merge, both a 64 to 80px labelled button and a 40px square ([four buttons become two](../../../research/components-and-naming/when-to-split-or-merge-a-component.md#four-buttons-become-two)).
  - Icon-only takes every role Button has. Carbon allows no icon-only danger button and Atlassian's `IconButtonAppearance` drops `danger` and `warning`, so a merged set would hold holes the picker refuses ([Carbon button](https://carbondesignsystem.com/components/button/usage/)).
  - The merged set stays small enough to open: the same library's Button (108 variants) and Icon button (45) would have made 153, 222 had icon-only taken every role.
- [required] Merged or not, the icon-only form exposes its accessible name as a text property or a Dev Mode annotation, and its description says the name and the tooltip are required (figma-standard rules 25 and 40; [icon-only buttons](#icon-only-buttons)).
- [strong] A bare clickable glyph is the icon button's `Ghost` role, never a component of its own, and a compact button is a `Size` value, never a component: Material 3, Primer, Atlassian, Carbon, Spectrum and Radix all draw the bare icon as their quietest icon-button appearance ([compact buttons and bare icons](../../../research/components-and-naming/when-to-split-or-merge-a-component.md#compact-buttons-and-bare-icons)). It keeps a 24px target (figma-standard rule 26).
- [weak] A button that only looks different in one place (a campaign call to action) is a flavour named with ` - ` (`Button - CTA`) when it is built separately, or a value on `Appearance` when it fills the grid (figma-standard rule 20; [new looks as theme variants](../../../research/components-and-naming/when-to-split-or-merge-a-component.md#new-looks-as-theme-variants)).
- [required] Axes in the order `Size → Appearance → Disabled → State`, `State` last, `Disabled` a True/False variant directly before it; Disabled pairs only with Rest, and with Focus too where the code keeps it focusable, and its variant sits right after its Rest sibling (figma-standard rules 1 to 3).
- [required] `State` runs `Rest → Focus → Hover → Press → Loading`; each draws differently from Rest and Focus shows a ring (figma-standard rules 4, 31, 39 and 58).
- [required] Loading is the last value of `State`, not a boolean beside it (figma-standard rule 58): with 18 `Size` and `Appearance` combinations, each taking the five `State` values above and one `Disabled=True`, a value makes 108 variants (18 × 6), where a boolean beside the four other `State` values and `Disabled=True` would make 180 (18 × 5 × 2), 72 of them loading with focus, hover, press or disabled. Loading with focus is one code reaches, since the `loading` button keeps focus through `aria-disabled` (*Mapping*); figma-standard rule 58 keeps Loading on `State`, so it is not drawn. Every library surveyed reaches it as a boolean prop in code, so the Figma value maps to a prop ([component-driven.dev on Figma booleans](https://www.component-driven.dev/articles/boolean-flags-in-figma) reaches the same count; the libraries are in *In code*; figma-standard rule 58).
- [strong] The Loading frame is drawn in Rest's colours at Rest's width, with the label faded, never in Disabled's grey: a busy button must stay readable and must not move the layout (figma-standard rule 48; [Fluent issue #29724](https://github.com/microsoft/fluentui/issues/29724) records teams refusing disabled styling for loading).
- [required] **Open is a boolean.** The kits read draw an open menu as a boolean that mirrors the code's: Primer's `ActionMenu` kit has `open`, read into `<ActionMenu open>` ([Primer ActionMenu.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/ActionMenu/ActionMenu.figma.tsx)), and Carbon's `MenuButton` and `ComboButton` kits an `Open` boolean that shows the menu ([Carbon MenuButton.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/MenuButton/MenuButton.figma.ts), [Carbon ComboButton.figma.ts](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ComboButton/ComboButton.figma.ts)); in code the trigger carries `aria-expanded`, which combines with hover and focus. The open look reuses one the button has: Primer styles `aria-expanded` as its pressed look, Atlassian as selected ([Primer ButtonBase styles](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Button/ButtonBase.module.css); Atlassian's `isSelected` on the trigger, as [what the State axis models](../../../research/components-and-naming/what-the-state-axis-models.md#open-menu-triggers) reads it). The toolkit's research article drew `Open` as one `State` value on the trigger, which leaves open-and-hovered no frame ([what the State axis models](../../../research/components-and-naming/what-the-state-axis-models.md#open-menu-triggers)). figma-standard rule 57 takes the boolean, as the kits and code do.
- [required] Sizes are `Size` with t-shirt values, largest first (figma-standard rule 6).
- [weak] A success or error frame inside the button (a check mark after saving) is not more booleans on Button: it is a component that owns the sequence, as Carbon's [inline loading](https://carbondesignsystem.com/components/inline-loading/usage/) does.

**Tokens**
- [required] Every fill, stroke, radius, padding and gap is bound to a variable, semantic and never primitive (figma-standard rules 24 and 29); text fills take text-role tokens (figma-standard rule 28).
- [required] A state variant binds its own state's tokens; Loading, which no token names, borrows Rest's (figma-standard rule 48).
- [required] Where the project has component tokens, they are named `Component/Button/<Element>/<property>[-<variant>][-<state>]` and alias semantic ones (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the snapshot's contract lists every axis and property, so an axis with no code counterpart shows in the parity report.
- *Judgement*: can a designer reach every state the code can be in, and no state the code cannot?

**Sources.** Figma's Simple Design System, Primer and Polaris for names; the toolkit's research articles [what the State axis models](../../../research/components-and-naming/what-the-state-axis-models.md) and [when to split or merge a component](../../../research/components-and-naming/when-to-split-or-merge-a-component.md) (November 2026) for Open and the icon button, with the libraries each read; figma-standard rule 58 for Loading on `State`; Primer's `ActionMenu` and Carbon's `MenuButton` and `ComboButton` Code Connect files for how kits draw Open. Kits split on icon-only merged into Button; that item is contested, and the project decides; figma-standard rule 57 settles Open as a boolean.

## Alignment with code

**Structure**
- [strong] Figma mirrors the code's components one to one: a `Button` set and an `Icon button` set where the code has `Button` and `IconButton` (MUI, Primer, Atlassian, Spectrum, Radix), one set where it has one (Fluent, Polaris, Ant Design); a menu trigger or a split button is a separate set only where the code ships `MenuButton` or `SplitButton`, as Fluent and Carbon do ([when to split or merge](../../../research/components-and-naming/when-to-split-or-merge-a-component.md#separate-icon-buttons)).
- [strong] The label, the leading and trailing icons and the spinner are parts of one component in code, never components of their own: Primer's `leadingVisual`, `trailingVisual` and `loading`, MUI's `startIcon`, `endIcon` and `loading` ([Primer Button types](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Button/types.ts), [MUI Button](https://mui.com/material-ui/react-button/)). So the Figma set nests an icon instance for each and no `Button content` sub-component.

**Mapping**
- [required] Each Figma axis maps to one attribute or prop, recorded once (code-standard rule 9; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Appearance` | `appearance` (figma-standard rule 1) |
  | `Size` | `size` |
  | `State=Rest` | nothing |
  | `State=Hover`, `Press` | `:hover`, `:active`, set by the browser |
  | `State=Focus` | `:focus-visible` |
  | `State=Loading` | `loading`, with `aria-disabled` and a live region; not `aria-busy` alone |
  | `Open=True` (*Variants and states*) | `aria-expanded="true"`, styled to match the frame |
  | `Disabled=True` | `disabled`, or `aria-disabled` where focus stays |
  | `Label`, `Leading icon`, `Trailing icon` | children, leading and trailing icon |
  | `Show leading icon`, `Show trailing icon` | whether that icon is passed; no prop of their own |
- [strong] Write `:focus-visible` before `:hover` in the stylesheet, as Focus precedes Hover in the set: two rules of equal specificity resolve by order, and a later hover would hide the ring under the pointer ([CSS Cascade 4](https://www.w3.org/TR/css-cascade-4/#cascade-order); figma-standard rule 4).

**States**
- [required] Rest, Hover, Press and Focus are set by the browser, as `:hover`, `:active` and `:focus-visible`; no prop sets them, so the developer builds each from its frame, and the frame must exist (code-standard rule 9; [what the State axis models](../../../research/components-and-naming/what-the-state-axis-models.md#state-values-in-code)).
- [required] Disabled and Loading are set by the code (`disabled`, `loading`), and the set keeps them sparse, a pairing and a value (figma-standard rules 2 and 58).
- [required] Open is set by the code too (`aria-expanded`), and combines with `:hover` and `:focus-visible`; the `Open` boolean draws those combinations (*Variants and states*; figma-standard rule 57).
- [strong] Code reaches combinations no frame shows unless one is drawn: a focused button that is also hovered resolves by stylesheet order, so Focus is drawn before Hover in the set and written before it in the stylesheet ([what the State axis models](../../../research/components-and-naming/what-the-state-axis-models.md#states-on-the-axis)). A disabled button never hovers, since a native `disabled` button receives no pointer events in MUI's `ButtonBase`, so no Disabled-and-Hover frame is drawn.

**Differences**
- [strong] Loading: a `State` value in Figma, a boolean prop in code. One value adds 18 variants where a boolean would add 90, 72 of them impossible; the mapping row says which prop it becomes ([loading as a State](../../../research/components-and-naming/what-the-state-axis-models.md#loading-as-a-state)).
- [required] Open: a boolean in code (`aria-expanded`, Primer's `open`) and in the Primer and Carbon kits, so focus and hover on an open trigger have frames of their own (*Variants and states*; figma-standard rule 57).
- [moderate] Axis and value names follow figma-standard rules 18 and 21 (sentence case, `Leading icon`), and code keeps its own case (`leadingVisual`, `startIcon`); the mapping row is where the two meet. Carbon's `Style` axis maps to `kind` and has stayed that way since a rename was declined ([Carbon issue #14836](https://github.com/carbon-design-system/carbon/issues/14836)).

**Check**
- *Script*: the component contract lists every Figma axis and property and the props the code exposes; a row in one with no partner in the other, and no line under *Differences*, is a finding (design-code-parity).
- *Judgement*: could a developer build every frame from the code's props and the browser's states alone, and does every prop have a frame?

**Sources.** The toolkit's research articles [what the State axis models](../../../research/components-and-naming/what-the-state-axis-models.md) and [when to split or merge a component](../../../research/components-and-naming/when-to-split-or-merge-a-component.md), with the libraries each read; Primer and MUI source and the Primer and Carbon Code Connect files as linked; Carbon issue #14836 for a mismatch kept on purpose.

## In code

**Element**
- [required] A native `button` with `type="button"` unless it submits; an `a` only when it navigates, styled by the same component (code-standard rule 8; [html-semantics](../../code/html-semantics.md)).
- [required] Disabled is `disabled` on the native control, or `aria-disabled="true"` where it must keep focus (a loading button); never `disabled` on a wrapper ([disabled buttons](#disabled-buttons); code-standard rule 9).

**Props**
- [strong] `appearance` for the rank (figma-standard rule 1), `size`, `loading`, `disabled`, and the leading and trailing icons as slots or props; the label is the children. Primer (`variant`, `size`, `loading`, `leadingVisual`, `trailingVisual`), MUI (`variant`, `size`, `loading`, `startIcon`, `endIcon`) and SDS (`variant`, `size`, `isDisabled`) share this shape ([Primer Button types](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Button/types.ts), [MUI Button](https://mui.com/material-ui/react-button/), [SDS Button.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/button/Button.figma.ts)).
- [strong] Loading is a boolean prop (`loading`, `isLoading` or `isPending`), never `state="loading"` and never a component of its own: MUI, Primer, React Aria, Atlassian, Polaris and Chakra all do this ([loading buttons](#loading-buttons)); Carbon alone hands it to `InlineLoading` ([Carbon inline loading](https://carbondesignsystem.com/components/inline-loading/usage/)).
- [required] An icon-only button has an accessible name (WCAG 4.1.2; [icon-only buttons](#icon-only-buttons)).
- [moderate] A separate icon button makes the name a required prop (`aria-label` in Primer, `label` in Atlassian and Carbon); a merged Button can only recommend it, as Polaris's `accessibilityLabel` does, so its docs say so ([Primer IconButton](https://primer.style/product/components/icon-button/)).

**Check**
- *Script*: the parity loop compares each variant's geometry, fills and focus ring with its frame (design-code-parity); the component contract flags a Figma axis with no prop.
- *Judgement*: does the loading button keep focus, keep its width, and announce the outcome?

**Sources.** Primer, MUI, Figma's SDS, Carbon and the libraries named in the *Loading buttons* section; the toolkit's state-axis research for the mapping table in *Alignment with code*.
