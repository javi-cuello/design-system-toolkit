# Spinner

A spinner is a small turning ring that says work is under way here, now, with no measure of how much is left. This page owns the spinner as a component, in design, in Figma and in code: its sizes, its accessible name, its motion and reduced motion, and where it gives way to a skeleton. When a wait gets any indicator at all, the delay before one shows and the minimum it stays are [feedback: *Loading*](../patterns/feedback.md#loading) and [interaction: *Response times*](../design/interaction.md#response-times-and-perceived-performance); a spinner inside a button is [loading buttons](button.md#loading-buttons); a ring or bar that shows a value is the [progress indicator](progress-indicator.md).

## Overview

**Use when / don't use**
- [weak] Whether this wait gets a spinner, a skeleton, a progress bar or nothing is [feedback: *Loading*](../patterns/feedback.md#loading); this page starts once a spinner is the answer.
- [moderate] One module or one action whose duration is unknown and short: a chart refreshing, a panel fetching, a search running. Carbon uses its small loading indicator "within or near the triggering element" and its large one centred in a section, modal or tile ([Carbon loading](https://carbondesignsystem.com/components/loading/usage/)); Primer's spinner is for "a moderate amount of time (between 1 and 3 seconds)" ([Primer Spinner accessibility](https://primer.style/product/components/spinner/accessibility/)).
- [moderate] Not when the work can be measured (a [progress indicator](progress-indicator.md)), and not for minutes of work, which wants progress and Cancel ([steppers](../patterns/steppers.md#progress-for-long-running-tasks)).
- [moderate] One at a time: Carbon, "Refrain from using multiple loading indicators simultaneously" ([Carbon loading](https://carbondesignsystem.com/components/loading/usage/)); Primer's advice to replace a row of spinners with one is in [feedback: *Loading*](../patterns/feedback.md#loading).

**Anatomy**
- [strong] A faint full ring (the track) under a short arc that turns. Primer draws a circle at `strokeOpacity="0.25"` under an arc path ([Primer Spinner source](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.tsx)); MUI adds the track with `enableTrackSlot` ([MUI CircularProgress source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CircularProgress/CircularProgress.js)); Carbon's small loader draws a background circle under its stroke ([Carbon Loading source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Loading/Loading.tsx)).
- [moderate] The arc takes the colour of the text around it: Primer strokes with `currentColor` and MUI's circle sets `stroke: 'currentColor'` (sources above), so a spinner in a button or on a dark surface needs no colour of its own.
- [moderate] Optional text beside it saying what is loading: Carbon pairs the large indicator with "a brief status message below the indicator, such as 'Loading data…'" and gives its inline loader a description ([Carbon loading](https://carbondesignsystem.com/components/loading/usage/)).
- [required] Not interactive and not focusable, so no focus ring and no 24px target (figma-standard rule 26 exempts it).

## Sizes

**Use when / don't use**
- [strong] Three sizes or fewer, picked by where the spinner sits, not by how long the wait is: Primer's `small`, `medium` and `large` (16, 32 and 64px, [Primer Spinner source](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.tsx)); Spectrum's `S`, `M`, `L` ([Spectrum ProgressCircle source](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/ProgressCircle.tsx)); Carbon's large and small ([Carbon loading](https://carbondesignsystem.com/components/loading/usage/)). MUI alone takes any number (`size`, default 40) ([MUI CircularProgress source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CircularProgress/CircularProgress.js)).

**How**
- [moderate] Small in line with text, in a field or in a button, sized to the line; large centred in the region it stands for. Carbon: the small indicator "inline with or adjacent to the related action", the large one centred "in that space" ([Carbon loading](https://carbondesignsystem.com/components/loading/usage/)).
- [weak] The stroke keeps one width at every size: Primer draws with `vector-effect="non-scaling-stroke"` at a 2px stroke ([Primer Spinner source](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.tsx)).
- [weak] A spinner that replaces content keeps that content's box, so nothing moves when it goes (design-standard rule 2; [loading buttons](button.md#loading-buttons) for the button case).

**Cases**
- A 64px spinner inside a 32px button → the small size, sized to the label's line.
- Three cards each with a large spinner → one per card is fine if they load apart; one for the group if they load together ([feedback: *Loading*](../patterns/feedback.md#loading)).

**Accessibility**
- [strong] 1.4.11 Non-text Contrast: the arc at 3:1 against its surface. Primer's test asks that the "spinning" section meet 3:1 ([Primer Spinner accessibility](https://primer.style/product/components/spinner/accessibility/)); MUI's scorecard measures its arc the same way ([MUI CircularProgress accessibility](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CircularProgress/accessibility.md)); WCAG 1.4.11 applies to a graphic needed to understand the state.

**Build**
- [required] The size is one attribute on the host (`size="sm|md|lg"`), its dimensions tokens (code-standard rules 9 and 22).
  ```css
  ds-spinner { inline-size: var(--size-spinner-md); block-size: var(--size-spinner-md); color: inherit; }
  ds-spinner[size="sm"] { inline-size: var(--size-spinner-sm); block-size: var(--size-spinner-sm); }
  ```
- [moderate] The SVG strokes with `currentColor`, so the caller sets the colour through `color` and never a rule inside the component (code-standard rule 38).

**Check**
- *Script* could: measure the arc's contrast against its computed background; flag a spinner larger than its container's line or box.
- *Judgement*: does the size follow the place, not the length of the wait?

**Sources.** Primer, Spectrum and Carbon ship two or three named sizes; MUI takes a number.

## Accessible name and announcements

**Use when / don't use**
- [required] The loading state reaches a screen reader as text, once, through a status region: 4.1.3 Status Messages ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)). The spinner itself is a picture of that text.

**How**
- [contested] Libraries expose the spinner three ways:
  - *Hidden graphic, text beside it.* Primer's SVG is `aria-hidden` with a visually hidden `srText` (default "Loading"), set to `null` "if the loading state is displayed in a text node somewhere else on the page" ([Primer Spinner](https://primer.style/product/components/spinner/), [Primer Spinner source](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.tsx)); its accessibility page still says the component has "no built-in announcement" and must be part of a solution with `aria-live` ([Primer Spinner accessibility](https://primer.style/product/components/spinner/accessibility/)).
  - *An image in a live region.* Carbon's SVG is `role="img"` with `aria-label` and a `title`, inside a wrapper with `aria-live="assertive"` while active ([Carbon Loading source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Loading/Loading.tsx)).
  - *A progress bar with no value.* MUI's `CircularProgress` and Spectrum's `ProgressCircle` are `role="progressbar"` with no `aria-valuenow`, named by an `aria-label` ([MUI progress](https://mui.com/material-ui/react-progress/), [Spectrum ProgressCircle source](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/ProgressCircle.tsx)).
  Where the project takes the first, the spinner is `aria-hidden`, and a `role="status"` element present from load carries a specific message ("Loading invoices").
- [moderate] Polite, not assertive: a loading message should not cut off what the person is hearing. `role="status"` is polite by definition ([accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)); Carbon's loaders use `assertive` (above).
- [weak] Say what is loading, not "Loading" alone (Primer's example in [feedback: *Loading*](../patterns/feedback.md#loading)); when visible text beside the spinner already says it, that text is the status and the spinner adds nothing to the tree.
- [moderate] Delay before showing and hold once shown, as one timer ([feedback: *Loading*](../patterns/feedback.md#loading)). Primer builds the delay into the component: `delay` of `true` or `'long'` waits 1000ms, `'short'` 300ms ([Primer Spinner source](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.tsx)). No library read publishes a minimum show time; Carbon's inline loader holds its finished state 1500ms (`successDelay`) before calling `onSuccess` ([Carbon InlineLoading source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/InlineLoading/InlineLoading.tsx)).

**Cases**
- A spinner with `aria-label="Loading"` beside the text "Loading invoices…" → the screen reader hears it twice; hide the spinner.
- A spinner mounted with its own `aria-live` region → nothing is announced; the region must exist before its text changes.
- Six spinners each announcing "Loading" → one status line for the region.

**Accessibility**
- [required] 4.1.3 Status Messages for the start and the end; 1.1.1 Non-text Content is met by hiding the decorative graphic when text carries the meaning.

**Build**
- [required] The graphic is hidden and the status is text in a region that exists before it changes (code-standard rule 14 for keeping that region across swaps):
  ```html
  <p role="status" class="visually-hidden" data-invoices-status></p>   <!-- in the page from load -->
  <ds-spinner size="md" aria-hidden="true"><svg viewBox="0 0 16 16">…</svg></ds-spinner>
  ```
  The script writes "Loading invoices" into the status when the spinner shows and "24 invoices" when it goes.
- [required] `DELAY` and `MIN` are the product's constants from [interaction: *Response times*](../design/interaction.md#response-times-and-perceived-performance), never a figure per spinner (code-standard rule 22); a component `delay` prop like Primer's reads the same constant.
- [weak] Several spinners on one page turn in step: Primer gives each a negative `animation-delay` from a shared clock, "so all spinners land at the same rotation angle regardless of when they mount" ([Primer Spinner source](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.tsx)).

**Check**
- *Script* could: flag a spinner that is neither `aria-hidden` nor named; assert a `role="status"` element exists before the spinner shows and changes text when it does; flag `aria-live="assertive"` on a loader.
- *Judgement*: does the message say what is loading?

**Sources.** Primer, Carbon, MUI and Spectrum each expose the spinner differently; the polite status is [feedback: *Loading*](../patterns/feedback.md#loading)'s.

## Motion and reduced motion

**Use when / don't use**
- [required] 2.2.2 Pause, Stop, Hide: a spinner turning for more than five seconds beside other content needs a way to stop or hide it, unless it is the only content; WCAG's own "loading" example is exempt because the animation "is the only content on the page" ([Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)); WCAG 2.2's Note 4 also counts a preload animation as essential "if interaction cannot occur during that phase for all users" ([WCAG 2.2, 2.2.2](https://www.w3.org/TR/WCAG22/#pause-stop-hide)). A wait that long usually wants progress instead ([steppers](../patterns/steppers.md#progress-for-long-running-tasks)).

**How**
- [contested] Under `prefers-reduced-motion: reduce`, systems split. Primer's spinner has no reduced-motion rule and keeps turning ([Primer Spinner styles](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.module.css)), as its loading pattern asks ([feedback: *Loading*](../patterns/feedback.md#loading)); MUI sets `animation: none` on the ring and the arc when the theme opts into reduced motion ([MUI CircularProgress source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CircularProgress/CircularProgress.js), [MUI reducedMotion](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/styles/reducedMotion.ts)); the base reduced-motion block stops every animation, spinners included ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)). A project that keeps a slow rotation, as [feedback: *Loading*](../patterns/feedback.md#loading) describes, narrows the base block's selector to leave the spinner out, a project ruling; a project that stops it relies on the status text.
- [moderate] Rotate a fixed arc; don't animate its length. MUI documents that "under heavy load, you might lose the stroke dash animation" and offers `disableShrink`, which keeps only the rotation ([MUI progress](https://mui.com/material-ui/react-progress/)); Primer's spinner is a rotation only ([Primer Spinner styles](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.module.css)).
- [weak] Linear easing and one constant speed, about one turn a second: Primer turns on `--base-duration-1000` with `--base-easing-linear` (Primer Spinner styles); Carbon reserves back-and-forth motion for skeletons ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)).

**Cases**
- The base reduced-motion block freezes the spinner on a frame that looks like a broken icon → narrow the block or slow the spinner, and keep the status text.
- A spinner runs for 40 s next to a form → progress with Cancel, or a way to hide it.

**Accessibility**
- [required] 2.2.2 as above; 2.3.3 Animation from Interactions (AAA) is met by honouring the preference ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)).

**Build**
- [required] One `@keyframes` rotation on `transform`, its duration and easing motion tokens ([tokens: *Motion tokens*](../../code/tokens.md#motion-tokens); code-standard rule 22):
  ```css
  @keyframes ds-spin { to { transform: rotate(1turn); } }
  ds-spinner > svg { animation: ds-spin var(--motion-duration-spin) var(--motion-easing-linear) infinite; }
  @media (prefers-reduced-motion: reduce) {
    ds-spinner > svg { animation-duration: var(--motion-duration-spin-reduced); }  /* slower, still turning */
  }
  ```
  The `reduce` rule takes effect only once the project's base block leaves the spinner and everything in it out, `*:not(ds-spinner, ds-spinner *), *:not(ds-spinner, ds-spinner *)::before, *:not(ds-spinner, ds-spinner *)::after` in place of `*, ::before, ::after` (the ruling above; `:not(ds-spinner)` alone still freezes its `svg`), since an `!important` in an earlier layer wins ([css-architecture: *Cascade layers*](../../code/css-architecture.md#cascade-layers)).

**Check**
- *Script* could: with reduced motion emulated, read the spinner's computed `animation-duration` and assert it matches the project's ruling (slowed or stopped), never the default speed.
- *Judgement*: with reduced motion on, does the page still say something is loading?

**Sources.** Primer keeps the spinner moving; MUI stops it on opt-in; WCAG 2.2.2 and 2.3.3 as linked. Slowing or stopping it is a project ruling.

## Spinner or skeleton

**Use when / don't use**
- [moderate] A skeleton when the layout of what is coming is known (a list, a card, a page); a spinner for a single module or an action. Carbon: "Avoid using loading indicators for progressively displaying content; use skeleton states", and "For full-screen loads, skeleton states are preferred" ([Carbon loading](https://carbondesignsystem.com/components/loading/usage/)); the full choice is [feedback: *Loading*](../patterns/feedback.md#loading).

**How**
- [weak] A spinner never covers content already on screen during an update; the old content stays, marked busy ([feedback: *Loading*](../patterns/feedback.md#loading)). Carbon's large loader with an overlay blocks the whole region, so keep it for a region that cannot be used until it loads ([Carbon loading](https://carbondesignsystem.com/components/loading/usage/)).

**Cases**
- A table's first load shows a centred spinner, then twenty rows push the footer down → a skeleton of the expected rows.
- A filter refetches and a full-page spinner hides the old rows → keep the rows, mark the table `aria-busy`, a small spinner by the filter.

**Accessibility**
- [required] Either way, one status message for the region and `aria-busy="true"` on it until done ([feedback: *Loading*](../patterns/feedback.md#loading)).

**Build**
- [weak] A skeleton is the layout component rendered with placeholder rows; a spinner is one element in a box sized as the content will be ([performance: *Layout stability in code*](../../code/performance.md#layout-stability-in-code)). Both sit inside the busy region; neither carries the announcement.

**Check**
- *Script* could: compare the region's box with the spinner and with the content, and flag a shift past the tolerance.
- *Judgement*: is the layout of what is coming known well enough to skeleton?

**Sources.** Carbon as linked, and the sources of [feedback: *Loading*](../patterns/feedback.md#loading).

## In Figma

**Layers**
- [required] One frame, auto layout, holding a `Track` ring and an `Arc`; the same names in every size (figma-standard rules 10 and 33). Primer's SVG has the same two parts ([Primer Spinner source](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.tsx)).
- [required] The arc is drawn at one fixed angle; the motion is the token pair (*Tokens*) (figma-standard rule 52). Figma's prototype can loop rotation between frames with Smart animate, which "takes the layer's rotation and orientation into account" and lists "Loading sequences" among its uses ([Figma Smart animate](https://help.figma.com/hc/en-us/articles/360039818874-Smart-animate-layers-between-frames)), fired by an "After delay" trigger ([Figma prototype triggers](https://help.figma.com/hc/en-us/articles/360040035834-Prototype-triggers)); that loop serves a prototype only.

**Properties**
- [moderate] No properties beyond `Size` for a bare spinner. A spinner with text beside it (Carbon's inline loader) exposes the text as a property (`Label`) revealed by `Show label` (figma-standard rules 5, 21 and 37); Carbon's set reads a `Loading message` layer ([Carbon Loading Code Connect](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Loading/Loading.figma.ts)).
- [required] Its description says the spinner is hidden from screen readers and the page carries the status text (figma-standard rule 25 for a real description).

**Variants and states**
- [required] `Size` with t-shirt values, largest first (figma-standard rule 6); Primer's Figma `size` maps `small`, `medium`, `large` one to one ([Primer Spinner Code Connect](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.figma.tsx)).
- [strong] No `State` axis and no `Animated` boolean: the spinner is not interactive (figma-standard rules 36 and 39 ask states and focus of interactive components only), and an axis whose only effect is motion Figma cannot show offers no real choice (figma-standard rule 35). Primer's and MUI's code take no state for it (sources above).
- [weak] Success and error after the wait are not spinner variants; a component that owns the sequence (Carbon's `InlineLoading`, with `Active`, `Error`, `Finished` and `Inactive`) is its own set, as [button: *In Figma*](button.md#in-figma) says of the button.

**Tokens**
- [required] Arc and track colours, stroke weight and each size are bound to semantic variables (figma-standard rules 24 and 29); the arc meets 3:1 against its surface in every mode (WCAG 1.4.11).
- [moderate] The rotation's duration and easing are motion tokens meant for code only, which figma-standard rule 42 asks a ruling to record; Primer's spinner turns on `--base-duration-1000` and `--base-easing-linear` ([Primer Spinner styles](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.module.css)).

**Check**
- *Script*: figma-components-audit runs the rules cited above; the snapshot's contract lists `Size`, and a `size` value with no frame shows in the parity report.
- *Judgement*: does the description say where the status text lives?

**Sources.** Primer's and Carbon's Code Connect files for the Figma names; Figma's help centre for what a prototype can animate, read November 2026.

## Alignment with code

**Structure**
- [strong] A component of its own in Primer (`Spinner`), Spectrum (`ProgressCircle`) and Carbon (`Loading`, with `InlineLoading` for the inline form with text and outcome); in MUI it is the indeterminate mode of `CircularProgress`, the same component that draws a determinate ring ([Primer Spinner source](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.tsx), [Spectrum ProgressCircle source](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/ProgressCircle.tsx), [Carbon Loading source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Loading/Loading.tsx), [MUI CircularProgress source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CircularProgress/CircularProgress.js)). The Figma set mirrors the project's split.

**Mapping**
- [required] Each Figma property maps to one prop or attribute, recorded once (code-standard rule 9; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Size` | `size` (Primer `small`, `medium`, `large`; Spectrum `S`, `M`, `L`; Carbon `small` boolean) |
  | `Label` (shown) | visible text beside the spinner, and the status message |
  | no property | `aria-hidden="true"`, or Primer's `srText` / Carbon's `description` where no text is visible |
  | no property | the delay (`delay` in Primer), from the product constant |
  | no frame | the rotation, from the motion tokens |

**States**
- [required] The browser sets nothing: no hover, focus or press. The code sets whether it renders (after the delay) and Carbon's `active`; neither is a Figma variant, since a spinner that is not running is not drawn.
- [required] Reduced motion is a state the code reaches from the system preference and no frame shows (figma-standard rule 52); the project's ruling (*Motion and reduced motion*) names what it looks like.

**Differences**
- [moderate] Carbon draws `Loading` and `InlineLoading` as one Figma component whose `Size` axis has an `Inline` value; Code Connect turns `Size=Inline` into `InlineLoading` with `State` mapped to `status`, and the other sizes into `Loading` ([Carbon Loading Code Connect](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Loading/Loading.figma.ts)). One Figma set for two code components is a departure the mapping has to carry; a kit that draws what its code renders splits them where the code does (figma-standard rule 51).
- [weak] MUI's numeric `size` has no Figma counterpart beyond sample frames; where a project uses it, the sizes it uses are named here.

**Check**
- *Script*: the component contract lists `Size` and the code's props; a size with no partner and no line under *Differences* is a finding (design-code-parity).
- *Judgement*: is every frame a size the code has, and does every motion value come from a token?

**Sources.** Primer, Carbon, MUI and Spectrum source and Code Connect files as linked, read November 2026.

## In code

**Element**
- [required] An inline `svg` inside the component's host, `aria-hidden="true"` and `focusable="false"`, with the status as text elsewhere ([Accessible name and announcements](#accessible-name-and-announcements); code-standard rule 18 for decorative graphics).
- [moderate] Where no visible text says what is loading, a visually hidden text node beside the graphic, as Primer's `srText` renders ([Primer Spinner source](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.tsx)), placed inside the page's `role="status"` region so it is announced.

**Props**
- [strong] `size` and a label or screen-reader text, with an opt-out for when text is visible: Primer (`size`, `srText`, `delay`), Carbon (`small`, `description`, `active`, `withOverlay`) and Spectrum (`size`, `aria-label`) share this shape ([Primer Spinner](https://primer.style/product/components/spinner/), [Carbon Loading source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Loading/Loading.tsx), [Spectrum ProgressCircle source](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/ProgressCircle.tsx)).
- [weak] A `delay` prop reads the product constant, never a number per call (Primer's `delay`, linked above).
- [weak] No `color` prop: the spinner inherits `currentColor` (*Anatomy*).

**Check**
- *Script*: axe flags a named `progressbar` or `img` with no name; the parity loop compares each size's box and stroke with its frame (design-code-parity).
- *Judgement*: is the status text specific, and present before the spinner shows?

**Sources.** Primer, Carbon, MUI and Spectrum as linked; GOV.UK's component list has no spinner at all ([GOV.UK components](https://design-system.service.gov.uk/components/)).
