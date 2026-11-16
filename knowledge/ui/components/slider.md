# Slider

A slider sets a number in a range by moving a thumb along a track: a volume, a zoom level, a price band. This page owns it as a component, in design, in Figma and in code, with one thumb or two. Choosing it over a number field or another control stays in [`../patterns/selection.md`](../patterns/selection.md#choosing-the-control); a slider in a filter bar also follows [filtering: facet controls](../patterns/filtering.md#facet-controls). Related: [select](select.md), [segmented control](segmented-control.md), [forms](../patterns/forms.md).

## Overview

**Use when / don't use**
- [weak] An approximate value set by feel, with the result visible at once; where the exact number matters, a number field. The cases are [*Slider*](#slider).
- [moderate] One component for one thumb and for two, the range a `Range` variant of it (*In Figma*): MUI's `Slider` becomes a range when its `value` is an array ([useSlider](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Slider/useSlider.ts)), and Figma's Simple Design System renders one thumb per value ([SDS Slider.tsx](https://raw.githubusercontent.com/figma/sds/main/src/ui/primitives/Slider/Slider.tsx)).

**Anatomy**
- [strong] A label, a track with its filled part, a thumb per value, and the value shown as text. Carbon draws a label, a number input and a track with a handle, plus minimum and maximum value text ([Carbon slider](https://carbondesignsystem.com/components/slider/usage/)); MUI's slots are `rail`, `track`, `thumb`, `mark`, `valueLabel` and `input` ([Slider types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Slider/Slider.d.ts)); SDS composes `Label`, `SliderOutput`, `SliderTrack`, `SliderThumb` and `Description` ([SDS Slider.tsx](https://raw.githubusercontent.com/figma/sds/main/src/ui/primitives/Slider/Slider.tsx)).
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
- [required] `Label` and `Value` are text properties; `Show description` sits directly above `Description` (figma-standard rules 5, 21 and 37). SDS names the boolean `Has Description` ([SDS SliderField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/SliderField.figma.ts)); figma-standard rule 21 keeps `Has` for content the component holds and writes `Show` for a boolean that reveals a layer.
- [required] Every property drives a layer in every variant where that layer exists (figma-standard rule 30).
- [weak] A range slider is the same component at `Range=True`, never a set of its own and never two sliders laid over each other: it changes the thumbs, their names and the value text, more than one subtree, so it is a variant, not a boolean (figma-standard rule 35).

**Variants and states**
- [required] Axes run `Size → Range → Validation → Disabled → State`; `Range` is a True/False variant, `False` first; `Validation` lists `None` then `Error`; `State` runs `Rest → Focus → Hover → Press`, drawn on the thumb; Disabled pairs only with Rest (figma-standard rules 1 to 4, 21 and 31). SDS folds Disabled into `State` (`State=Disabled` maps to `isDisabled`), which figma-standard rule 1 keeps as its own axis.
- [moderate] `Validation=Error` where the value can be invalid: Carbon draws error and warning states for a required slider left empty or a value out of range.
- [weak] Where no number input shows the value, the Hover, Focus and Press frames show it in a tooltip over the thumb (Carbon).

**Tokens**
- [required] Every fill, stroke, radius and gap is bound to a semantic variable (figma-standard rules 24 and 29); label and value take text-role tokens (figma-standard rule 28).
- [required] The thumb and the filled track meet 3:1 against what is next to them (WCAG 1.4.11); text meets figma-standard rule 32.
- [required] A state variant binds its own state's tokens (figma-standard rule 48); component tokens follow figma-standard rule 49 (`Component/Slider/Thumb/…`).

**Check**
- *Script*: figma-components-audit runs the rules cited above; the thumb's box is measured against figma-standard rule 26.
- *Judgement*: does every frame show the value, and could a designer draw a range without detaching?

**Sources.** Carbon's slider guidance for the parts, states and tooltip; MUI's types and SDS's source and Code Connect file for the names. SDS maps four Figma properties to props (`State`, `Label`, `Has Description`, `Description`); the rest of the mapping below is the toolkit's.

## In code

**Element**
- [required] A native `input type="range"`, labelled, beside a number field where the exact value matters; the markup is [*Slider*](#slider)'s Build (code-standard rule 8).
- [strong] Libraries that draw their own thumb still keep a native range input under it: MUI "handles value changes reported through the hidden range input" ([useSlider](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Slider/useSlider.ts)), React Aria renders a visually hidden `input` in each thumb ([Slider.tsx](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria-components/src/Slider.tsx)) and gives it `type: 'range'` ([useSliderThumb](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-aria/src/slider/useSliderThumb.ts)), and SDS inherits it from React Aria.

**Props**
- [strong] `min`, `max`, `step`, the value, a change handler, `disabled` and a way to turn the number into words: MUI (`min`, `max`, `step`, `getAriaValueText`, `disabled`), React Aria (`minValue`, `maxValue`, `step`, `formatOptions`; [useSliderState](https://raw.githubusercontent.com/adobe/react-spectrum/main/packages/react-stately/src/slider/useSliderState.ts)) and the native input (`min`, `max`, `step`, `aria-valuetext`).
- [strong] Two change events, while dragging and on release, so a filter re-queries once: MUI `onChange` and `onChangeCommitted`, React Aria `onChange` and `onChangeEnd`, the native `input` and `change`.
- [moderate] A range names each thumb: MUI's `getAriaLabel(index)`, SDS's `thumbLabels`, one label per thumb.

**From Figma**
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

**Check**
- *Script*: the parity loop compares each variant with its frame (design-code-parity); a test could click the track and assert the value moved, and press Home and End.
- *Judgement*: is the value always readable, and does a filter wait for release?

**Sources.** MUI, React Aria and SDS sources as linked; they agree on the native input underneath and on two change events.
