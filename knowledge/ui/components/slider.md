# Slider

A slider sets a number in a range by moving a thumb along a track: a volume, a zoom level, a price band. This page owns it as a component, in design, in Figma and in code, with one thumb or two. Choosing it over a number field or another control stays in [`../patterns/selection.md`](../patterns/selection.md#choosing-the-control); a slider in a filter bar also follows [filtering: facet controls](../patterns/filtering.md#facet-controls). Related: [select](select.md), [segmented control](segmented-control.md), [forms](../patterns/forms.md).

## Overview

**Use when / don't use**
- [weak] An approximate value set by feel, with the result visible at once; where the exact number matters, a number field. The cases are [*Slider*](#slider).
- [strong] One component for one thumb and for two, the range a `Range` variant of it (*In Figma*): MUI, Carbon and Radix each hold one value or two in one slider ([Alignment with code](#alignment-with-code)).

**Anatomy**
- [moderate] A label, a track with its filled part, a thumb per value, and the value shown as text. Carbon draws a label, a number input and a track with a handle, plus minimum and maximum value text ([Carbon slider](https://carbondesignsystem.com/components/slider/usage/)); MUI's slots are `rail`, `track`, `thumb`, `mark`, `valueLabel` and `input` ([Slider types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Slider/Slider.d.ts)).
- [weak] The label sits above the track, so the hand on the thumb does not hide it (Carbon).
- [required] The thumb is a target of at least 24 by 24 CSS pixels and shows a focus ring (figma-standard rules 26 and 39; WCAG 2.5.8).

## Slider

**Use when / don't use**
- [weak] Use for an approximate value in a moderate range where the person adjusts by feel and sees the result at once: volume, a zoom level, a price band in a filter.
- [weak] Don't use when the exact value matters; a number field is faster and precise ([NN/g steppers, Zhou 2018](https://www.nngroup.com/articles/input-steppers/): allow typing when "the exact value is important").
- [weak] Don't use for very large ranges (1–1000) or tiny ones (1–3) ([Carbon slider](https://carbondesignsystem.com/components/slider/usage/)).
- [weak] Don't use for values that are not numbers ([Carbon](https://carbondesignsystem.com/components/slider/usage/)).

**How**
- [weak] Pair the slider with a number input that shows and accepts the value ([Carbon](https://carbondesignsystem.com/components/slider/usage/)); a range slider has two.
- [weak] Show the minimum, maximum and unit; the current value is always visible, not only while dragging.
- [required] Clicking the track moves the thumb there, so dragging is never the only way ([WCAG 2.5.7 Understanding](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)).
- [moderate] Arrow keys step by one; a larger step with Shift or Page Up and Down; Home and End jump to the limits.
- [weak] A slider that filters waits for release before it re-queries, so the list does not jump at every step.

**Cases**
- A "quantity" slider from 1 to 100 → a number input; the exact count matters.
- A price filter from 0 to 5,000 → a range slider with two number inputs beside it; people often know their ceiling exactly.
- A brightness setting with no visible value → show the percentage beside it; a slider without a value hides state.
- A slider operable only by dragging the thumb → make the track clickable and the thumb keyboard-operable; 2.5.7 requires a single-pointer path.

**Accessibility**
- [required] 2.5.7 Dragging Movements (AA): a single-pointer alternative (track click, or the paired input). 4.1.2: a native `input type="range"`, or `role="slider"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` and `aria-valuetext` when the number needs a unit. 2.1.1: the keys above. 2.5.8: the thumb meets the target size.
- [required] Implementation: code-standard rule 8 (wrap the native range input), code-standard rule 16 (it follows the theme). In Figma: figma-standard rule 26 (the thumb), figma-standard rules 31 and 32.

**Build**
- [required] A native `<input type="range">` with `min`, `max` and `step`, paired with a labelled number field; the browser gives arrows, Home and End and a clickable track (code-standard rule 8).
  ```html
  <label for="price-max">Maximum price (£)</label>
  <input id="price-max" type="range" min="0" max="5000" step="50" value="2000">
  <input id="price-max-n" inputmode="numeric" value="2000" aria-label="Maximum price in pounds">
  ```
- [moderate] One `input` handler keeps the two in step; a filter re-queries on `change`, which fires on release.
- [required] A unit or a word for the value goes in `aria-valuetext`; a range of two is two labelled range inputs (minimum and maximum), since HTML has no two-thumb slider ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- [required] Track and thumb follow the theme (`accent-color`, code-standard rule 16); the thumb's size is a token that meets the target size.

**Check**
- *Script:* could check that every range input has a name and an associated visible value or number input, and that a click on the track changes the value.
- *Judgement:* Does the person need an exact number here?

**Sources:** Carbon, NN/g and W3C as linked; they agree.

## In Figma

**Layers**
- [required] Auto layout throughout: the label row above, the track below; text hugs vertically (figma-standard rule 33).
- [required] Layers are named for their role in the code's words, the same in every variant: `Label`, `Value`, `Track`, `Thumb`, `Description`; MUI calls the whole line the rail and its filled part the track, React Aria calls the whole line the track, so the project's code decides (figma-standard rule 10).
- [weak] The filled part's length and the thumb's place are a mechanism, driven by one width or padding; figma-standard rule 29 treats a raw value serving a mechanism as a question to record, not a defect.

**Properties**
- [required] `Label` and `Value` are text properties; `Show description` sits directly above `Description` (figma-standard rules 5, 21 and 37);
- [weak] A range slider is the same component at `Range=True`, never a set of its own and never two sliders laid over each other: it changes the thumbs, their names and the value text, more than one subtree, so it is a variant, not a boolean (figma-standard rule 35).

**Variants and states**
- [required] Axes run `Size → Range → Validation → Disabled → State`; `Range` is a True/False variant, `False` first; `Validation` lists `None` then `Error`; `State` runs `Rest → Focus → Hover → Press`, drawn on the thumb; Disabled pairs only with Rest, and with Focus too where the code keeps it focusable (figma-standard rules 1 to 4, 21, 31 and 57).
- [moderate] `Validation=Error` where the value can be invalid: Carbon draws error and warning states for a required slider left empty or a value out of range.
- [weak] Where no number input shows the value, the Hover, Focus and Press frames show it in a tooltip over the thumb (Carbon).

**Tokens**
- [required] Every fill, stroke, radius and gap is bound to a semantic variable (figma-standard rules 24 and 29); label and value take text-role tokens (figma-standard rule 28).
- [required] The thumb and the filled track meet 3:1 against what is next to them (WCAG 1.4.11); text meets figma-standard rule 32.
- [required] A state variant binds its own state's tokens (figma-standard rule 48); component tokens follow figma-standard rule 49 (`Component/Slider/Thumb/…`).

**Check**
- *Script*: figma-components-audit runs the rules cited above; the thumb's box is measured against figma-standard rule 26.
- *Judgement*: does every frame show the value, and could a designer draw a range without detaching?

**Sources.** Carbon's slider guidance for the parts, states and tooltip; MUI's types for the names. The [mapping](#alignment-with-code) applies code-standard rules 9 and 10.

## Alignment with code

**Structure**
- [strong] One component holds one value or two, never a separate range component: MUI's `Slider` becomes a range when its value is an array ([useSlider](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Slider/useSlider.ts)), Carbon's `Slider` adds the upper handle when `unstable_valueUpper` is set ([Slider.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Slider/Slider.tsx)), and Radix renders one thumb per value inside one slider ([Radix slider.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/slider/src/slider.tsx)). The `Range` variant mirrors it ([*In Figma*](#in-figma), Properties).
- [moderate] Where the parts are components, they are parts of the slider, not components a page places alone: React Aria's `SliderTrack`, `SliderThumb` and `SliderOutput` ([Slider.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Slider.tsx)) and Radix's `Track`, `Range` and `Thumb` ([slider.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/slider/src/slider.tsx)); MUI and Carbon keep them inside one component. The Figma build keeps them as named layers of one set, which both shapes map to.
- [weak] A kit can depart from its own code on the range: Carbon's Figma draws a separate two-handle component Code Connected to the same `Slider` ([SliderTwoHandles.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Slider/SliderTwoHandles.figma.ts)), whose template writes a `twoHandles` prop the component does not declare (it derives `twoHandles` from `unstable_valueUpper`, [Slider.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Slider/Slider.tsx)). This page's one set with `Range` follows the code.

**Mapping**
- [required] Each Figma property maps to one prop or attribute, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Label` | the `label` for the input |
  | `Value` | the visible value, an `output` or the paired number field; a unit goes in `aria-valuetext` |
  | `Show description`, `Description` | a description tied by `aria-describedby` (code-standard rule 15) |
  | `Size` | `size` |
  | `Range=True` | the value is a pair, one input per thumb, each with its own label |
  | `State=Hover`, `Press` | `:hover`, `:active` on the input |
  | `State=Focus` | `:focus-visible` on the input |
  | `Disabled=True` | `disabled` on the input |
  | `Validation=Error` | `aria-invalid="true"` with a described message |

**States**
- [required] Hover, Press and Focus are the thumb's, set by the browser on the native input (`:hover`, `:active`, `:focus-visible`); no prop sets them, so each needs its frame (code-standard rule 9). React Aria exposes the same three on the thumb as `data-hovered`, `data-dragging` and `data-focus-visible` ([Slider.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Slider.tsx)).
- [strong] The value is set by code and read by assistive technology from the element: the native input's `value`, or `aria-valuenow`, `aria-valuemin` and `aria-valuemax` written by script on the `role="slider"` thumb that Radix and Carbon render instead of an input ([Radix slider.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/slider/src/slider.tsx), [Carbon Slider.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Slider/Slider.tsx)). Figma draws one representative value; no frame per value.
- [moderate] In a range each thumb is bounded by the other: Carbon sets the lower thumb's `aria-valuemax` to the upper value and the upper's `aria-valuemin` to the lower ([Slider.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Slider/Slider.tsx)), and Radix keeps them `minStepsBetweenThumbs` apart ([slider.tsx](https://raw.githubusercontent.com/radix-ui/primitives/main/packages/react/slider/src/slider.tsx)). Code never crosses the thumbs, so no frame does.
- [required] A `disabled` input takes no focus (HTML), so Disabled pairs only with Rest ([*In Figma*](#in-figma), Variants).
- [moderate] Code reaches an invalid slider that is hovered, pressed or focused, so `Validation=Error` draws every `State`: Carbon's two-handle kit draws `Hover + Error`, `Active + Error` and `Focus + Error` and maps each to `invalid` ([SliderTwoHandles.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Slider/SliderTwoHandles.figma.ts)).

**Differences**
- [weak] `Validation` and `Disabled` are axes of their own where a kit folds them into `State`: Carbon's `State` holds Error, Warning, Read-only and Disabled ([Slider.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Slider/Slider.figma.ts)). Each maps out to its own prop (`invalid`, `disabled`), which separate axes mirror (figma-standard rules 1 and 57).
- [weak] Carbon's code also has `readOnly` and `warn` ([Slider.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Slider/Slider.tsx)); this build draws neither, and a project whose code ships them adds the values, or the parity report raises the prop.
- [weak] The thumb's place and the filled length are fixed in a frame and computed from value, `min` and `max` in code; the width or padding that places them is a mechanism ([*In Figma*](#in-figma), Layers; figma-standard rule 29).
- [weak] Carbon builds the number input into `Slider` (`hideTextInput` turns it off; [Slider.tsx](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Slider/Slider.tsx)); here the number field is the text field component placed beside the slider, as the Build pairs them ([*Slider*](#slider), Build).

**Check**
- *Script*: the component contract lists `Size`, `Range`, `Validation`, `Disabled` and `State` beside the slider's props; a Figma value with no prop, or a prop such as `readOnly` with no frame, is a finding unless *Differences* names it (design-code-parity).
- *Judgement*: could a developer build every frame from the value, the validation prop and the browser's states, with one set for one thumb and two?

**Sources.** MUI's useSlider, Carbon's Slider source and Code Connect files, React Aria's Slider and Radix's slider, all as linked. They agree on one component for one value or two; they split on a native input or a `role="slider"` element under the thumb, and Carbon's kit folds validation and disabled into `State` where its code keeps separate props.

## In code

**Element**
- [required] A native `input type="range"`, labelled, beside a number field where the exact value matters; the markup is [*Slider*](#slider)'s Build (code-standard rule 8).
- [moderate] Libraries that draw their own thumb still keep a native range input under it: MUI "handles value changes reported through the hidden range input" ([useSlider](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Slider/useSlider.ts)), React Aria renders a visually hidden `input` in each thumb ([Slider.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Slider.tsx)) and gives it `type: 'range'` ([useSliderThumb](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/slider/useSliderThumb.ts)).

**Props**
- [strong] `min`, `max`, `step`, the value, a change handler, `disabled` and a way to turn the number into words: MUI (`min`, `max`, `step`, `getAriaValueText`, `disabled`), React Aria (`minValue`, `maxValue`, `step`, `formatOptions`; [useSliderState](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-stately/src/slider/useSliderState.ts)) and the native input (`min`, `max`, `step`, `aria-valuetext`).
- [strong] Two change events, while dragging and on release, so a filter re-queries once: MUI `onChange` and `onChangeCommitted`, React Aria `onChange` and `onChangeEnd`, the native `input` and `change`.
- [weak] A range names each thumb: MUI's `getAriaLabel(index)`, one label per thumb.

**Check**
- *Script*: the parity loop compares each variant with its frame (design-code-parity); a test could click the track and assert the value moved, and press Home and End.
- *Judgement*: is the value always readable, and does a filter wait for release?

**Sources.** MUI and React Aria sources as linked; they agree on the native input underneath and on two change events.
