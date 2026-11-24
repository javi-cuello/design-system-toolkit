# Progress indicator

A progress indicator shows how far a piece of work the system is doing has got: a bar, or a ring, that fills as the work advances (determinate) or moves without a value while the amount is unknown (indeterminate). This page owns the progress bar as a component, linear and circular, in design, in Figma and in code: its shapes, its two modes, its label and value label, and its element. "Progress indicator" also names a step indicator for a multi-step flow, which is what Carbon's `ProgressIndicator` is ([Carbon progress indicator](https://carbondesignsystem.com/components/progress-indicator/usage/): it "guides users through any linear, multistep task"); that meaning is [steppers: *Step indicators*](../patterns/steppers.md#step-indicators), not this page. When to show any loading feedback at all, and which, is [feedback: *Loading*](../patterns/feedback.md#loading) with its thresholds in [interaction: *Response times*](../design/interaction.md#response-times-and-perceived-performance); a job that runs for minutes is [steppers: *Progress for long-running tasks*](../patterns/steppers.md#progress-for-long-running-tasks). An indeterminate ring with no value is the [spinner](spinner.md). Related: [loading buttons](button.md#loading-buttons).

## Overview

**Use when / don't use**
- [weak] Which wait gets a bar, a spinner, a skeleton or nothing is [feedback: *Loading*](../patterns/feedback.md#loading); this page starts once a progress indicator is the answer.
- [strong] Determinate when the work can be counted against a known end (bytes of a known file, items of a known list); indeterminate when it cannot; switch from indeterminate to determinate as soon as the total is known. Carbon: an indeterminate bar "may change to a determinate indicator if enough information is gathered to calculate the load completion" ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)); HTML's `progress` is indeterminate exactly when it has no `value` ([MDN `progress`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)); MUI and React Aria expose the same two modes ([MUI progress](https://mui.com/material-ui/react-progress/), [React Aria ProgressBar](https://react-aria.adobe.com/ProgressBar)).
- [contested] A measurement that is not work in progress (storage used, a score, tasks a person has finished) is a meter, not a progress bar, in Carbon ("When the progress is determined by user actions such as tutorials completed, or storage space", don't use it) and in ARIA, whose `meter` role is "a scalar measurement within a known range" ([WAI-ARIA `meter`](https://w3c.github.io/aria/#meter)). Primer's ProgressBar instead is "a simple chart" that can "visualize parts that make up a whole", segments included ([Primer ProgressBar](https://primer.style/product/components/progress-bar/)).
- [strong] Not for steps a person moves through; that is a step indicator ([steppers](../patterns/steppers.md#step-indicators); [Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/): "When manual user actions are required to progress, use a progress indicator instead").

**Anatomy**
- [strong] A label naming the process, a track, a fill (Carbon's "bar indicator"), an optional value label ("26%", "42 of 256") and optional helper or status text below. React Aria's anatomy diagram names Label, Value, Track and Fill ([React Aria ProgressBar](https://react-aria.adobe.com/ProgressBar)); Carbon names Label, Helper text, Track, Bar indicator and Status icon ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)); Primer draws a container holding one or more `ProgressBar.Item` fills ([Primer ProgressBar source](https://github.com/primer/react/blob/main/packages/react/src/ProgressBar/ProgressBar.tsx)).
- [required] An accessible name: the `progressbar` role lists "Accessible Name Required: True" ([WAI-ARIA `progressbar`](https://w3c.github.io/aria/#progressbar)).
- [required] Not focusable and not interactive: the role is read-only ("It is not possible for the user to alter the value of a progressbar", WAI-ARIA), so no focus ring and no 24px target (figma-standard rule 26 exempts a component that is not interactive).

## Linear and circular

**Use when / don't use**
- [moderate] Linear by default: it carries a label above and a value beside without crowding, and reads as a fraction at a glance. Carbon and Primer ship only a linear progress bar and draw their circle only as an indeterminate spinner ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/), [Primer ProgressBar](https://primer.style/product/components/progress-bar/)).
- [contested] A determinate circle for a compact spot (a file tile, a row) is a component in MUI (`CircularProgress` with `variant="determinate"`) and Spectrum (`ProgressCircle`), and absent from Carbon and Primer ([MUI progress](https://mui.com/material-ui/react-progress/), [Spectrum ProgressCircle source](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/ProgressCircle.tsx)). Add one only where a linear bar does not fit, and keep the value as text beside or inside the ring, never the arc alone.

**How**
- [weak] Width follows the content it reports on, not the window: Carbon sets a 48px minimum and "a maximum of six columns when possible", and says not to stretch the bar across the whole window ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)).
- [weak] Two heights at most: Carbon's big (8px) and small (4px), the small one for cards, tables and side panels (Carbon); Primer offers small, default and large ([Primer ProgressBar](https://primer.style/product/components/progress-bar/)).
- [weak] Mirrored in right-to-left: Carbon mirrors both modes, the label right-aligned, the value left-aligned, "and the fill progresses from right to left" ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)).
- [weak] Segments (Primer's several `ProgressBar.Item`s) need a legend and colours told apart at 3:1 from each other and the background ([Primer ProgressBar accessibility](https://primer.style/product/components/progress-bar/accessibility/)); past three or four, use a chart.

**Cases**
- A determinate ring with no number beside it on a 40-minute export → a linear bar with "Exported 1,204 of 5,000 rows" and Cancel ([steppers](../patterns/steppers.md#progress-for-long-running-tasks)).
- A bar stretched across a 1,600px screen for a 2 KB upload → a bar at the width of the upload row.
- An Arabic page whose bar fills from the left → logical properties, so it fills from the right.

**Accessibility**
- [required] 1.4.11 Non-text Contrast: the fill at 3:1 against the track and the page; MUI's own scorecard flags a light-mode `warning` arc at about 2.72:1 against its track ([MUI CircularProgress accessibility](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CircularProgress/accessibility.md)). 1.4.1 Use of Color: the length carries the value, the colour only the status.

**Build**
- [required] Either shape carries the same role and value attributes; the shape is styling only ([WAI-ARIA `progressbar`](https://w3c.github.io/aria/#progressbar)).
- [moderate] The linear fill is one element whose `inline-size` is the fraction, set from a custom property, so it mirrors with the writing direction ([i18n: *Logical properties and mirroring*](../../code/i18n.md#logical-properties-and-mirroring)); Primer sets `--progress-width` the same way ([Primer ProgressBar source](https://github.com/primer/react/blob/main/packages/react/src/ProgressBar/ProgressBar.tsx)).
  ```css
  ds-progress > [data-fill] { inline-size: calc(var(--progress-value) * 100%); background: var(--color-progress-fill); }
  ```
- [moderate] A determinate ring is an SVG circle whose `stroke-dashoffset` is the remaining fraction of its circumference: MUI computes `2 * Math.PI * ((SIZE - thickness) / 2)` and offsets by the value ([MUI CircularProgress source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CircularProgress/CircularProgress.js)); Spectrum subtracts half the stroke from the radius so the stroke sits inside the box ([Spectrum ProgressCircle source](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/ProgressCircle.tsx)).
- [required] Track, fill and height are tokens, never literals (code-standard rule 22).

**Check**
- *Script* could: measure the fill's contrast against track and page; with `dir="rtl"`, assert the fill starts at the inline start.
- *Judgement*: is a ring used where a bar would fit?

**Sources.** Carbon and Primer ship linear only; MUI and Spectrum ship both shapes.

## Determinate and indeterminate

**Use when / don't use**
- [strong] As in *Overview*: determinate when the total is known, indeterminate otherwise; never a determinate bar driven by a guess. Carbon: a determinate bar "never decreases in value or resets" ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)); NN/g's case for honest pacing is in [steppers](../patterns/steppers.md#progress-for-long-running-tasks).

**How**
- [moderate] Three statuses on either mode: active, success and error, each drawn with a colour and an icon, and the error with text saying what failed. Carbon's `status` is `active | finished | error` and its error state "must convey the problem in the error helper text" ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/), [Carbon ProgressBar source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ProgressBar/ProgressBar.tsx)); MUI and Primer have no status and leave it to the page.
- [weak] An indeterminate bar moves in one direction at a steady speed; Carbon "reserves back and forth motions for skeletons" ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)).
- [weak] A buffer (MUI's `variant="buffer"` with `valueBuffer`) shows a second value, how much is loaded, alongside the progress ([MUI progress](https://mui.com/material-ui/react-progress/)).
- [moderate] Under reduced motion an indeterminate bar may go still, with its status text saying the work goes on: MUI freezes it as a still segment (`left: 30%`, `width: 40%`) when the theme opts into reduced motion ([MUI LinearProgress source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/LinearProgress/LinearProgress.js), [MUI reducedMotion](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/styles/reducedMotion.ts)); Primer runs its bar's shimmer only under `prefers-reduced-motion: no-preference` ([Primer ProgressBar styles](https://github.com/primer/react/blob/main/packages/react/src/ProgressBar/ProgressBar.module.css)).

**Cases**
- An upload whose server reports no size shows a bar stuck at 0% → indeterminate until the size arrives, then determinate.
- A bar reaches 100% and the page waits another 20 s for processing → switch to indeterminate with "Processing", or count processing in the total.
- A failed import turns the bar red with no words → "Import failed: row 212 has no email" in the helper text.

**Accessibility**
- [required] 2.2.2 Pause, Stop, Hide: an indeterminate bar moving for more than five seconds beside other content needs a way to stop or hide it, unless it is the only content, as WCAG's own "loading" example allows ([Understanding 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)), or where nothing can be done meanwhile: WCAG 2.2's Note 4 also counts a preload animation as essential "if interaction cannot occur during that phase for all users" ([WCAG 2.2, 2.2.2](https://www.w3.org/TR/WCAG22/#pause-stop-hide)); MUI's scorecard records this gap for its indeterminate variant ([MUI CircularProgress accessibility](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CircularProgress/accessibility.md)).
- [required] 4.1.3 Status Messages: the end (done or failed) is announced without moving focus.

**Build**
- [required] Determinate: `value` and `max` on `progress`, or `aria-valuenow` with `aria-valuemin` and `aria-valuemax` on `role="progressbar"`. Indeterminate: no `value`, and no `aria-valuenow`, which ARIA says the author "SHOULD omit" ([WAI-ARIA `progressbar`](https://w3c.github.io/aria/#progressbar); [MDN `progress`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)).
- [strong] Style the indeterminate mode from what the markup already says: `progress:indeterminate` (MDN), or `:not([aria-valuenow])`, the selector React Aria documents for `isIndeterminate` ([React Aria ProgressBar](https://react-aria.adobe.com/ProgressBar)); no `data-indeterminate` of its own (code-standard rule 9).
- [moderate] The status is one attribute (`data-status="active|finished|error"`) on the host, the error text tied by `aria-describedby`; Carbon also sets `aria-invalid` on the bar in error ([Carbon ProgressBar source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ProgressBar/ProgressBar.tsx)); code-standard rule 61 for what the text says.
- [required] The indeterminate animation stops or goes still under `prefers-reduced-motion: reduce`, as the base block already does ([accessibility: *Reduced motion and colour scheme in code*](../../code/accessibility.md#reduced-motion-and-colour-scheme-in-code)), and its duration is a motion token ([tokens: *Motion tokens*](../../code/tokens.md#motion-tokens)).

**Check**
- *Script* could: assert an indeterminate bar has no `aria-valuenow` and a determinate one has all three values; with reduced motion emulated, assert no running animation.
- *Judgement*: is the total real, or a guess dressed as a percentage?

**Sources.** ARIA, MDN and WCAG as linked set the attributes. Carbon owns the richest status model; MUI and Primer leave status to the page.

## Labels and values

**Use when / don't use**
- [required] Every bar has a name; a visible label is the default, a hidden one only where the context already says it (Carbon: "The label can be visually hidden, but must be defined in order to be accessible", [Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)).
- [strong] Show the value as text unless the progress is deliberately vague. Primer: "Default to pairing the ProgressBar with text that explicitly shows the value(s)" ([Primer ProgressBar](https://primer.style/product/components/progress-bar/)); Carbon's helper text carries "42/256 items"; React Aria's `valueLabel` is "e.g. 1 of 4" ([React Aria ProgressBar](https://react-aria.adobe.com/ProgressBar)).

**How**
- [moderate] The label names the process ("Uploading report.pdf"), never "Loading", and does not change while it runs: Carbon, "Label text should never change as the progress bar is loading" ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)); React Aria's anatomy diagram labels its sample bar "Loading data…" ([React Aria ProgressBar](https://react-aria.adobe.com/ProgressBar)).
- [moderate] Count in the person's units where they exist ("12 of 48 components") over a bare percentage; React Aria formats a percentage by default and takes a `valueLabel` for the units ([useProgressBar](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/progress/useProgressBar.ts)).
- [weak] Label above the bar, value and helper text beside or below, nothing inside the track: Carbon, "Avoid placing text inside the progress bar indicator or track" ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)).
- [weak] Don't say the value twice to a screen reader: Primer, "If the progress value is already displayed as adjacent text, avoid duplicating it" ([Primer ProgressBar accessibility](https://primer.style/product/components/progress-bar/accessibility/)).
- [required] Numbers and percent signs come from the locale's formatter: Carbon notes "the placement of the percent sign differs depending on the locale" ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)); React Aria formats with `Intl.NumberFormat` options ([useProgressBar](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/progress/useProgressBar.ts)) ([i18n: *Numbers, dates, plurals and lists*](../../code/i18n.md#numbers-dates-plurals-and-lists)).

**Cases**
- `<progress value="33" max="100">33%</progress>` with no label → a `label` naming the upload; the inner "33%" is only fallback text.
- A bar named "Loading" among three bars → "Uploading invoice.pdf", "Uploading receipt.png".
- The value "4 of 12" written inside a `role="progressbar"` span → move it beside the bar; text inside the role is not read.

**Accessibility**
- [required] 4.1.2 Name, Role, Value: the name and the value are exposed. 1.3.1: the label is associated, not just near.
- [required] 4.1.3: a `progressbar` is not a live region, so value changes are not announced by themselves (MUI's scorecard, [MUI CircularProgress accessibility](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/CircularProgress/accessibility.md)); milestones go through a status region ([steppers](../patterns/steppers.md#progress-for-long-running-tasks)).

**Build**
- [required] `<progress>` takes its name from a `label` (wrapping, or `for`); text between its tags "is not an accessible label, it is only recommended as a fallback" ([MDN `progress`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)). A `role="progressbar"` element takes `aria-labelledby` pointing at the visible label, as Carbon and React Aria do ([Carbon ProgressBar source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ProgressBar/ProgressBar.tsx), [useProgressBar](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/progress/useProgressBar.ts)).
- [required] The value label sits outside the `progressbar` element: the role's children are presentational ("Children Presentational: True", [WAI-ARIA `progressbar`](https://w3c.github.io/aria/#progressbar)).
- [strong] `aria-valuetext` carries the value in words where a percentage would mislead ("4 of 12 tasks"): assistive technologies render `aria-valuenow` "as a percent… unless `aria-valuetext` is specified" (WAI-ARIA); React Aria sets `aria-valuetext` from its formatted value label every time, and Primer passes it through (useProgressBar; [Primer ProgressBar source](https://github.com/primer/react/blob/main/packages/react/src/ProgressBar/ProgressBar.tsx)).
- [required] Helper and status text is a description (`aria-describedby`), never part of the name (code-standard rule 15); Carbon wires its helper text so ([Carbon ProgressBar source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ProgressBar/ProgressBar.tsx)).
- [required] The region the bar reports on carries `aria-busy="true"` and `aria-describedby` pointing at the bar until it finishes; ARIA says authors "SHOULD" do both ([WAI-ARIA `progressbar`](https://w3c.github.io/aria/#progressbar); [accessibility: *Live regions and status messages*](../../code/accessibility.md#live-regions-and-status-messages)).
  ```html
  <label for="upload-1">Uploading report.pdf</label>
  <progress id="upload-1" max="100" value="33" aria-describedby="upload-1-count"></progress>
  <span id="upload-1-count">1.2 of 3.6 MB</span>
  <p role="status" class="visually-hidden" data-upload-status></p>  <!-- milestones and the end -->
  ```

**Check**
- *Script* could: flag a progress element with no accessible name, one named "Loading", text inside a `role="progressbar"`, and a value announced twice (a visible count and an identical `aria-valuetext`).
- *Judgement*: does the label tell three bars apart, and does the value use the person's units?

**Sources.** Carbon, Primer and React Aria agree on a named bar with a value in text; they differ on placement (Carbon: label above, Primer: value beside).

## A meter past its maximum

Usage against a budget or quota (days used of days booked, storage, seats) is a meter, as *Overview* says; this section covers the value that goes over the limit.

**Use when / don't use**
- [required] No limit, no meter. HTML calls a `meter` without a known maximum wrong: "it would be wrong to use this to report a weight, or height, unless there is a known maximum value", and one with no `max` takes 1.0 and looks "maxed out"; the spec's fix is plain text, "one would either not include the meter element" ([HTML `meter`](https://html.spec.whatwg.org/multipage/form-elements.html#the-meter-element)). So nothing booked shows the count alone, never an empty bar.
- [weak] A zero limit is not a limit: Shopify's `s-progress` turns "a `max` of `0` or less" into 1 ([Shopify Progress](https://shopify.dev/docs/api/app-home/latest/web-components/feedback-and-status-indicators/progress.md)), so a bar fed a zero budget draws as if it had one.

**How**
- [required] The element cannot hold an overrun. HTML clamps: "if the candidate actual value is greater than the maximum value, then the actual value is the maximum value" (HTML `meter`). ARIA forbids it: "The value of aria-valuenow MUST NOT fall below or exceed the computed values of aria-valuemin and aria-valuemax" ([WAI-ARIA `meter`](https://w3c.github.io/aria/#meter)). Past the limit the bar is full, and HTML asks for "a textual representation of the gauge's state" (HTML `meter`).
- [contested] **Full bar or a bar past the end.** Clamped to full: Carbon (`cappedValue`, [Carbon ProgressBar source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ProgressBar/ProgressBar.tsx)), Atlassian (`Math.min(value, MAX_VALUE)` for `aria-valuenow`, [Atlaskit progress-bar 5.3.7](https://cdn.jsdelivr.net/npm/@atlaskit/progress-bar@5.3.7/dist/esm/components/progress-bar.js)) and Shopify ("Values outside the scale are clamped", Shopify Progress). Past the end: Clockify's project bar "will go past 100% to reflect overage", "125% = 25% over the estimate" ([Clockify project estimates](https://clockify.me/help/troubleshooting/project-issues/understanding-project-estimates)); Harvest grows a red bar once a project is over budget ([Harvest projects overview](https://support.getharvest.com/hc/en-us/articles/360048181432); search excerpt, the page refuses a fetch, unchecked).
- [moderate] The danger colour marks the limit reached or passed. Shopify: "Use `critical` and `warning` for progress that signals a problem, like an exhausted limit", its example an API limit at 96 of 100 with `tone="critical"` (Shopify Progress). Clockify's forecast chart: when the curve "exceeds the solid budget line", "the line color updates to indicate that your project has gone over" ([Clockify forecast chart](https://clockify.me/help/projects/forecast-chart)). WebKit draws a meter in its "even less good" region red by default ([MDN `::-webkit-meter-even-less-good-value`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::-webkit-meter-even-less-good-value)). Atlassian's bar has no such tone: `appearance` is `default`, `success` or `inverse` (Atlaskit progress-bar 5.3.7).
- [moderate] The figures give both numbers in the person's units: Clockify's status reads "15 (of 25h)" ([Clockify tracking project progress](https://clockify.me/help/projects/tracking-project-progress)); the HTML spec's own example reads "6 blocks used (out of 8 total)" (HTML `meter`).
- [moderate] The overrun is said in words. Google names the state: "When you're over quota, it means you use more storage space than you have available" ([Google storage](https://support.google.com/googleone/answer/9312312?hl=en)); Clockify says how far, "25% over the estimate" (Clockify project estimates); Harvest lists "Over budget projects" (Harvest projects overview, unchecked).
- [weak] The words sit under the bar, in the helper text: Carbon's error status "must convey the problem in the error helper text" ([Carbon progress bar](https://carbondesignsystem.com/components/progress-bar/usage/)). No source read places an overrun's words on their own.
- [weak] Carbon's `error` status is not an overrun: it sets the value to 0, emptying the bar (Carbon ProgressBar source).

**Cases**
- "79 of 5 days" drawn as a fill 16 times the track's length → a full bar in the danger tone, with the count and how far over in words.
- A project with nothing booked shows "0 of 0" over an empty track → no bar; the count alone.
- An overrun shown only by a red fill → the words say it too; a full bar at the limit and past it look the same.
- `<meter max="5" value="79">` → the browser draws 5 of 5; the 79 lives in the text beside it.

**Accessibility**
- [required] 1.4.1 Use of Color: colour "is not used as the only visual means of conveying information" ([Understanding 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html)); the overrun's words carry the state. 1.4.11 holds for the danger fill against the track.
- [required] 4.1.2: `meter` lists "Accessible Name Required: True" (WAI-ARIA `meter`), as the progress bar does.

**Build**
- [required] `value` never above `max`: HTML's authoring requirement is "minimum ≤ value ≤ maximum" (HTML `meter`), and ARIA's MUST NOT holds for `role="meter"` (WAI-ARIA `meter`). The model clamps the value for the element and keeps the real count for the text (code-standard rule 29).
- [required] `low`, `high` and `optimum` give the browser the over-state on a native `meter`: with `optimum` below `low`, the range above `high` "must be treated as an even less good region" (HTML `meter`). ARIA has no counterpart: "there are no WAI-ARIA properties corresponding to the low, optimum, and high attributes" (WAI-ARIA `meter`), so a `role="meter"` element carries the state in an attribute and the text.
  ```html
  <label for="days-1">Days used</label>
  <meter id="days-1" min="0" max="5" low="4" high="4.99" optimum="0" value="5"
         aria-describedby="days-1-text" data-state="over"></meter>
  <span id="days-1-text">79 of 5 days, 74 over</span>
  ```
- [required] The overrun text is a description, tied by `aria-describedby`, never part of the name (code-standard rule 15).
- [required] The over-state is one attribute computed in the model and styled from a danger token, never a class or a literal colour (code-standard rules 9 and 22).

**Check**
- *Script* could: flag a `meter` or `aria-valuenow` above its maximum; a `meter` with no `max`; a danger tone with no overrun text beside it.
- *Judgement*: does the reader learn how far over, not only that it is over?

**Sources.** HTML, WAI-ARIA, MDN and WCAG set the element. Carbon, Atlassian and Shopify clamp; Clockify draws past the end; Harvest's help refused a fetch. GitHub's, Google One's, Basecamp's and Bonsai's usage bars are not described in their public docs read, November 2026.

## In Figma

**Layers**
- [required] Auto layout throughout: the label row (`Label`, `Value`) above the `Track`, `Helper text` below; the `Fill` nests in the `Track` (figma-standard rule 33). Layers are named for their role in the code's words, the same in every variant (figma-standard rule 10; React Aria's Label, Track, Fill and Value label, [React Aria ProgressBar](https://react-aria.adobe.com/ProgressBar)).
- [required] The fill's width is a fixed fraction of the track, a raw value that serves the mechanism; figma-standard rule 29 names "a progress fill driven by padding" as a question to answer, not a defect, so record how the fill is sized in the description.
- [required] An indeterminate frame is drawn at one still moment, a segment part-way along the track (figma-standard rule 52).

**Properties**
- [required] `Label`, `Value` and `Helper text` are text properties; `Show value` and `Show helper text` reveal them, each directly above the property it reveals (figma-standard rules 5, 21 and 37). Carbon's Figma set exposes `Label text`, `Helper text`, `Error text` and `Success text` ([Carbon ProgressBar Code Connect](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ProgressBar/ProgressBar.figma.ts)).

**Variants and states**
- [strong] No `State` axis: nothing is hovered, pressed or focused, and figma-standard rules 36 and 39 ask states and focus of interactive components only. Carbon's, Primer's and MUI's code expose none ([Carbon ProgressBar source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ProgressBar/ProgressBar.tsx); [Primer ProgressBar accessibility](https://primer.style/product/components/progress-bar/accessibility/): it "does not receive keyboard focus").
- [moderate] Axes: the size axis, then `Status`, then `Indeterminate` True/False, then a `Value` axis of sample fractions where the library draws them (figma-standard rule 1). Carbon's set has `Size`, `Alignment`, `Status` and a `Progress` axis of `0%`, `25%`, `50%`, `75%` ([Carbon ProgressBar Code Connect](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ProgressBar/ProgressBar.figma.ts)).
- [required] `Status` takes the code prop's values (figma-standard rule 56): on Carbon's code, `Active`, `Finished` and `Error` for `status` `active`, `finished` and `error`. Carbon's own kit draws `Success` and its Code Connect translates it to `finished` ([Carbon ProgressBar Code Connect](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ProgressBar/ProgressBar.figma.ts)), the one value of its three that does not mirror its code.
- [contested] **Size's name and values.** Size is one axis, largest first, in both kits read; its name and values differ. Carbon's kit draws `Size` with `Big` and `Small`, which its Code Connect maps to `size` `big` and `small` ([Carbon ProgressBar Code Connect](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ProgressBar/ProgressBar.figma.ts)). Primer's kit draws `size` with `small`, `medium` and `large` where the code's prop is `barSize` with `small`, `default` and `large`, and its Code Connect translates `medium` to `default` ([Primer ProgressBar Code Connect](https://github.com/primer/react/blob/main/packages/react/src/ProgressBar/ProgressBar.figma.tsx), [Primer ProgressBar source](https://github.com/primer/react/blob/main/packages/react/src/ProgressBar/ProgressBar.tsx)). figma-standard rule 21 departs from kits that name it otherwise: `Size` with figma-standard rule 6's lowercase t-shirt values, largest first, which code the project writes takes too; over a library used as shipped, the library's own prop name and values.
- [required] Indeterminate pairs with no value: an `Indeterminate=True` variant crossed with every `Value` is impossible, so the grid stays sparse (figma-standard rule 2).
- [contested] Linear and circular are two component sets where the code has two components (MUI, Spectrum), and the circle is left out where the code has none (Carbon, Primer); the libraries are linked under [*Alignment with code*](#alignment-with-code).

**Tokens**
- [required] Track, fill, status colours, radius and height are bound to semantic variables (figma-standard rules 24 and 29); label and value text take text-role tokens (figma-standard rule 28); each status binds its own colours (figma-standard rule 48).
- [required] The fill meets 3:1 against the track and the surface in every mode (WCAG 1.4.11; figma-standard rule 32 covers the text).
- [moderate] The indeterminate motion's duration and easing are motion tokens meant only for code, which figma-standard rule 42 asks a ruling to name; Primer's spinner and bar animate on `--base-duration-1000` and `--base-easing-linear` ([Primer Spinner styles](https://github.com/primer/react/blob/main/packages/react/src/Spinner/Spinner.module.css)).

**Check**
- *Script*: figma-components-audit runs the rules cited above; the snapshot's contract lists the axes, so a `Value` axis with no `value` prop shows in the parity report.
- *Judgement*: can a designer draw every status in both modes, and does the description say how the fill is sized?

**Sources.** Carbon's and Primer's Code Connect files for the Figma names; React Aria for the part names. Carbon samples the value as an axis, which *Differences* reads as samples.

## Alignment with code

**Structure**
- [strong] Linear and circular are two components in MUI (`LinearProgress`, `CircularProgress`) and Spectrum (`ProgressBar`, `ProgressCircle`), and one headless `ProgressBar` in React Aria whose children draw either shape ([MUI progress](https://mui.com/material-ui/react-progress/), [Spectrum ProgressCircle source](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/src/ProgressCircle.tsx), [React Aria ProgressBar](https://react-aria.adobe.com/ProgressBar)). Figma mirrors whichever split the project's code has.
- [moderate] Segments are child components in Primer (`ProgressBar.Item`), and its Figma set nests three `_ProgressBar.item` instances that Code Connect maps to children ([Primer ProgressBar Code Connect](https://github.com/primer/react/blob/main/packages/react/src/ProgressBar/ProgressBar.figma.tsx)); a single-value bar needs no such part.
- [strong] A step indicator is a different component, never a variant of this one: Carbon's `ProgressIndicator` holds `ProgressStep` children with `Completed`, `Current`, `Disabled` and `Error` states ([Carbon ProgressIndicator Code Connect](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ProgressIndicator/ProgressIndicator.figma.ts)); [steppers](../patterns/steppers.md#step-indicators).

**Mapping**
- [required] Each Figma axis and property maps to one prop or attribute, recorded once (code-standard rule 9; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Label` | a `label` element, or `label` (Carbon, React Aria) / `aria-label` (Primer, MUI) |
  | `Value` | `value` with `max` (`progress`), or `aria-valuenow` with `aria-valuemin` and `aria-valuemax` |
  | `Indeterminate=True` | no `value` (`progress:indeterminate`); `isIndeterminate` (React Aria), `variant="indeterminate"` (MUI) |
  | `Show value`, `Value` text | the value label beside the bar, and `aria-valuetext` (React Aria's `valueLabel`) |
  | `Helper text` | `helperText` (Carbon), wired by `aria-describedby` |
  | `Status` | `status`: `active`, `finished`, `error` (Carbon), as `data-status` |
  | Size axis | the code's size prop (Carbon `size`: `big`, `small`; Primer `barSize`: `small`, `default`, `large`); `Size` with t-shirt values where the project writes the code (figma-standard rules 6 and 56) ([In Figma](#in-figma)) |

**States**
- [required] The browser sets nothing: no hover, press or focus, since the element is not interactive (WAI-ARIA `progressbar`). Every state is a prop: the value, indeterminate, the status.
- [strong] Indeterminate is derived, not declared: it is the absence of a value (`progress` without `value`; `aria-valuenow` omitted), so the code reaches it by leaving the value out and Figma's `Indeterminate` maps to no prop of its own in plain HTML ([MDN `progress`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress); React Aria's `:not([aria-valuenow])`).

**Differences**
- [moderate] Carbon's Figma `Progress` axis offers `0%`, `25%`, `50%` and `75%`; code takes any number. The axis is a set of samples, so the mapping row says so rather than reading the axis as the prop's range ([Carbon ProgressBar Code Connect](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ProgressBar/ProgressBar.figma.ts)).
- [moderate] Names drift where nothing checks them: Carbon's Figma `Status=Success` becomes `status="finished"`; Primer's Figma `medium` becomes `barSize="default"`, and its Code Connect maps colours to misspelled values (`'success.empahsis'`, `'neutral.epmhasis'`) that resolve to no token ([Primer ProgressBar Code Connect](https://github.com/primer/react/blob/main/packages/react/src/ProgressBar/ProgressBar.figma.tsx)). A mapping is checked like code (design-code-parity).
- [weak] Any other departure (a Figma-only `Alignment`, a code-only buffer) is named here with its reason, or the parity report raises it.

**Check**
- *Script*: the component contract lists every Figma axis and the code's props; a row with no partner and no line under *Differences* is a finding (design-code-parity).
- *Judgement*: could a developer build each frame from the props alone, and does the `Value` axis read as samples?

**Sources.** MUI, Spectrum, React Aria, Primer and Carbon source and Code Connect files as linked, read November 2026.

## In code

**Element**
- [contested] Native `progress`, or `role="progressbar"` on a `div`. The first rule of ARIA and HTML favour the native element, which carries role and value with no ARIA ([accessibility: *ARIA: the first rule*](../../code/accessibility.md#aria-the-first-rule-and-when-it-is-needed); [MDN `progress`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/progress)). Every library read uses the role on a `span` or `div` instead (Primer, MUI, Carbon, React Aria; sources above), since a ring, segments and a status icon do not fit `progress`, and styling its fill needs non-standard pseudo-elements ([MDN `::-webkit-progress-value`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/::-webkit-progress-value): "Non-standard").
- [required] Never focusable: no `tabindex` (Primer's component tests check it "does not receive keyboard focus", [Primer ProgressBar accessibility](https://primer.style/product/components/progress-bar/accessibility/)).
- [weak] GOV.UK's component list has neither a progress bar nor a spinner ([GOV.UK components](https://design-system.service.gov.uk/components/)); a project without long-running work may not need one.

**Props**
- [strong] `value`, `max` (and `min` only with the role, since `progress` has none: "the `min` attribute is not allowed", MDN), `label`, a value label or `valueText`, `indeterminate` (or no `value`), `size`, and `status` where the project keeps statuses. Carbon (`label`, `value`, `max`, `helperText`, `status`, `size`, `type`), React Aria (`value`, `minValue`, `maxValue`, `label`, `valueLabel`, `isIndeterminate`, `formatOptions`) and MUI (`value`, `variant`, `valueBuffer`) share this shape ([Carbon ProgressBar source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ProgressBar/ProgressBar.tsx), [useProgressBar](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/progress/useProgressBar.ts), [MUI LinearProgress source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/LinearProgress/LinearProgress.js)).
- [required] The value is clamped to the range, as React Aria (`clamp(value, minValue, maxValue)`, [useProgressBar](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/progress/useProgressBar.ts)) and Carbon (`cappedValue`, [Carbon ProgressBar source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/ProgressBar/ProgressBar.tsx)) do, so a server that overshoots never draws past the track.
- [moderate] A label is required in the component's API, not optional: Carbon's `label: string` is required (Carbon source); MUI documents that a progress bar "must be given an accessible name" ([MUI progress](https://mui.com/material-ui/react-progress/)).

**Check**
- *Script*: axe flags a `progressbar` with no name; the parity loop compares each frame's fill width and colours (design-code-parity). Could: assert a value above `max` renders as full, not past the track.
- *Judgement*: is `progress` enough here, or does the design need the role?

**Sources.** WAI-ARIA, MDN and the library source as linked. On the element the specs and the libraries split.
