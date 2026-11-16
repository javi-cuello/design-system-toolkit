# Switch

A switch turns one setting on or off, and the change takes effect the moment it flips. This page owns the switch as a component, in design, in Figma and in code: its label, its on and off text, saving and failure, and its states. What spans the selection controls stays in [`../patterns/selection.md`](../patterns/selection.md): choosing between a switch and a checkbox, and every other value control; whether a setting saves itself is [interaction: saving](../design/interaction.md#saving-explicit-or-automatic) and [settings: saving settings](../patterns/settings.md#saving-settings). Related: [checkbox](checkbox.md), [segmented control](segmented-control.md), [button](button.md) (a toggle button with `aria-pressed`).

## Overview

**Use when / don't use**
- [moderate] A switch for one two-state setting that applies at once; inside a form saved with a button it is a checkbox. The rule and its cases are [switch (toggle)](#switch-toggle); the comparison with the other controls is [selection: choosing the control](../patterns/selection.md#choosing-the-control).
- [weak] A switch is its own component, not a checkbox variant: it promises a different behaviour (an instant save) and carries a different role, even where both wrap the same native input ([selection: *Build*](../patterns/selection.md#choosing-the-control) keeps controls that differ in kind apart).

**Anatomy**
- [strong] A track holding a thumb that moves from one end to the other, a label naming the setting, and optional "On" and "Off" text beside the track. Carbon's `Toggle` defaults its side labels to `labelA="Off"` and `labelB="On"` ([Carbon Toggle source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Toggle/Toggle.tsx)); Primer's `ToggleSwitch` to `buttonLabelOn` and `buttonLabelOff`, "On" and "Off" ([Primer ToggleSwitch source](https://github.com/primer/react/blob/main/packages/react/src/ToggleSwitch/ToggleSwitch.tsx)); SDS adds a `Description` under the label ([SDS SwitchField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/SwitchField.figma.ts)).
- [weak] A save status line beside it for a save that takes time or fails, part of the component's layout rather than a toast ([switch (toggle): *How*](#switch-toggle)).
- [required] A focus ring visible on the focused control (WCAG 2.4.7; figma-standard rule 39); a target of at least 24 by 24, label included (figma-standard rule 26; WCAG 2.5.8).

## Switch (toggle)

**Use when / don't use**
- [moderate] Use for a single setting with two opposing states that takes effect the moment it flips ([NN/g, Kendrick 2018](https://www.nngroup.com/articles/toggle-switch-guidelines/); [Primer toggle switch](https://primer.style/product/components/toggle-switch/guidelines/): "instant-save controls for boolean settings").
- [contested] Don't use inside a form that is saved with a button: people cannot tell whether the switch has acted ([NN/g](https://www.nngroup.com/articles/toggle-switch-guidelines/)). Use a checkbox there.
- [weak] Don't use for more than two states, or for states that are not opposites ([Carbon toggle](https://carbondesignsystem.com/components/toggle/usage/)).
- [weak] Don't use for an agreement or a choice that needs confirming.

**How**
- [moderate] **Label** names the setting that is on when the switch is on: "Email notifications", "Show line numbers". Not a command ("Turn on notifications"), which reads wrong once on, and not the state alone. NN/g's test: say the label with "on" and "off" after it; if either sounds wrong, rewrite it ([NN/g](https://www.nngroup.com/articles/toggle-switch-guidelines/)).
- [moderate] **State text** "On" / "Off" beside the switch where the track alone is ambiguous ([Carbon](https://carbondesignsystem.com/components/toggle/usage/): three words or fewer; [Primer](https://primer.style/product/components/toggle-switch/guidelines/)).
- [weak] **Feedback.** The new state shows at once. If saving takes time or fails, say so beside the switch ("Saving…", "Couldn't save. Retry") and return it to its old state on failure (`../design/interaction.md` *Saving*).
- [weak] **Grouped settings** are a list of switches, each its own row with its own label; never a switch that governs others without saying so.
- [weak] **States:** off, on, each with hover, focus, disabled; a pending state if saving is not instant.

**Cases**
- A profile form mixes switches with text fields and a Save button → replace the switches with checkboxes; NN/g's mixed-form failure ([Primer saving](https://primer.style/ui-patterns/saving) says the same: never mix save patterns in one form).
- A switch labelled "Enable" beside a section heading → label it with the setting ("Weekly summary email"); "Enable" names nothing when read alone.
- A switch for "Delete account data" → a button with a confirmation; a switch is for reversible settings, not consequential actions.
- A theme switch with three values (light, dark, system) → a segmented control; a switch holds two states.
- A switch flips, the request fails, and the switch stays on → revert it and say why; a switch that shows a state the system does not have breaks *show state*.

**Accessibility**
- [required] 4.1.2: a switch exposes its state; a native checkbox with `role="switch"` reads as on and off. 3.2.2 On Input: flipping it changes a setting, never the context (no navigation, no new window). 1.4.1 Use of Color: on and off differ by thumb position, not colour alone. 1.4.11 Non-text Contrast (a [code candidate](../../code/candidates.md)) for the track and thumb.
- [required] Implementation: code-standard rule 8 (the native control carries the state), code-standard rule 9, code-standard rule 14 (if the save re-renders the region, focus stays on the switch). In Figma: figma-standard rule 31 (on and off differ beyond colour; focus visible), figma-standard rules 26 and 32.

**Build**
- [required] `<input type="checkbox" role="switch">` with a `label` that never changes with the state; visible "On" and "Off" text is `aria-hidden`, since `checked` is announced ([accessibility: selection controls past the native set](../../code/accessibility.md#selection-controls-past-the-native-set)).
- [required] On and off are `:checked`; a pending save is `aria-busy="true"` on the host, styled from that attribute (code-standard rule 9).
- [weak] The `change` handler saves; on failure it restores `checked` and writes the reason into a `role="status"` element beside the switch that was in the page from the start ([accessibility: live regions and status messages](../../code/accessibility.md#live-regions-and-status-messages)).
- [required] Without script, the switch sits in a small form whose submit the script removes (code-standard rule 20); a re-render keeps focus on it (code-standard rule 14).

**Check**
- *Script:* could check that no `form` with a submit button contains a `role="switch"`, that every switch has a name, and that a switch's state change does not navigate.
- *Judgement:* Does the setting take effect now, and does the label read right with "on" and "off" after it?

**Sources:** NN/g and Primer keep switches out of submitted forms; [Carbon](https://carbondesignsystem.com/components/toggle/usage/) says toggles "are commonly used in forms" while also requiring "instant application". The toolkit follows NN/g and Primer, because a form's Save button and an instant switch make contradictory promises in one view. Primer asks for a label "describing the action" and warns against "state-descriptive labels"; NN/g asks for what the control does when on. Both are met by naming the setting.

## In Figma

**Layers**
- [required] Auto layout throughout: the label column, the track, the state text and the save status line, in the order the project's layout puts them; the label wraps and the component grows with it (figma-standard rule 33).
- [required] Each layer is named for its role, the same in every variant: `Track`, `Thumb`, `Label`, `Description`, `State text` (holding the on and off labels) and `Save status` (figma-standard rule 10); the two text names stay apart, so neither means both.
- [required] The thumb's position comes from the track's auto-layout alignment (start for off, end for on), never a fixed x, so a right-to-left page mirrors which end means on, where the project mirrors (figma-standard rule 50).

**Properties**
- [required] `Label` is a text property; `Show description` is a boolean directly above a `Description` text property (figma-standard rules 5, 21 and 37). SDS names the boolean `Has Description` ([SDS SwitchField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/SwitchField.figma.ts)); rule 21 keeps `Has` for content the component holds.
- [required] The state text, where the library draws it, is revealed by a `Show state text` boolean directly above two text properties, `On label` and `Off label`, in sentence case for the code's props (Primer's `buttonLabelOn` and `buttonLabelOff`, Carbon's `labelB` and `labelA`), so a project can say "Show" and "Hide" (figma-standard rules 5, 18, 21 and 37).
- [required] Every property drives a layer in every variant where that layer exists (figma-standard rule 30).

**Variants and states**
- [required] On is a True/False axis named after the code's `checked`, `False` first (figma-standard rules 1 and 21). SDS draws it as `Value Type` with a `Checked` value mapped to `defaultSelected` ([SDS SwitchField.figma.ts](https://github.com/figma/sds/blob/main/src/figma/primitives/SwitchField.figma.ts)).
- [required] Axes in the order `Size → Checked → Disabled → State`; `Disabled` pairs only with Rest and sits right after it; `State` runs `Rest → Focus → Hover → Press → Loading` (figma-standard rules 1 to 4).
- [moderate] Loading is the last `State` value where the project saves switches live, never a boolean beside the states (figma-standard rule 4); Primer's switch carries a `loading` prop and a `loadingLabel` announced after `loadingLabelDelay` ([Primer ToggleSwitch source](https://github.com/primer/react/blob/main/packages/react/src/ToggleSwitch/ToggleSwitch.tsx)), and the moved section asks for a pending state ([switch (toggle): *How*](#switch-toggle)). Whether the library needs it is figma-standard rule 36's judgement.
- [required] On and off differ by the thumb's position as well as colour (WCAG 1.4.1; figma-standard rule 31).
- [weak] `Size` only where the code has sizes: Primer ships `small` and `medium`, MUI `small` and `medium` ([MUI Switch source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Switch/Switch.js)); t-shirt values, largest first (figma-standard rule 6).
- [weak] No `Validation` axis: a switch applies at once outside a submitted form, so nothing validates it; a failed save is the `Save status` line and the switch's return to its old state ([switch (toggle): *How*](#switch-toggle)). `Checked` sits beside `State`, not on it, for the reason [checkbox: *In Figma*](checkbox.md#in-figma) gives.

**Tokens**
- [required] Every fill, stroke, radius, gap and padding binds a semantic variable, never a primitive; the label, state text and save status take text-role tokens (figma-standard rules 24, 28 and 29).
- [required] A state variant binds its own state's tokens; the thumb that never changes keeps its resting token in every state, the case figma-standard rule 48 names.
- [required] The track's boundary and the thumb meet 3:1 against what they sit on (WCAG 1.4.11), in every mode (beyond figma-standard rule 32, which covers text).
- [required] Component tokens, where the project has them, are `Component/Switch/<Element>/<property>[-<variant>][-<state>]` (figma-standard rule 49).

**Check**
- *Script*: figma-components-audit runs the rules cited above on the set; the contract lists `Checked`, `Size` and `Loading`, so an axis or value with no code counterpart shows in the parity report.
- *Judgement*: with colour removed, can a designer still tell on from off?

**Sources.** Figma's Simple Design System, Primer and Carbon for the parts and property names; MUI for sizes; figma-standard rules 4 and 48 for Loading and the thumb's token.

## In code

**Element**
- [contested] The native `input type="checkbox" role="switch"` the [switch (toggle): *Build*](#switch-toggle) part sets out. Systems split three ways: MUI and React Aria put `role="switch"` on a native checkbox input ([MUI Switch source](https://github.com/mui/material-ui/blob/master/packages/mui-material/src/Switch/Switch.js), [React Aria useSwitch](https://github.com/adobe/react-spectrum/blob/main/packages/react-aria/src/switch/useSwitch.ts)); Carbon and Radix render a `button role="switch"` with `aria-checked` ([Carbon Toggle source](https://github.com/carbon-design-system/carbon/blob/main/packages/react/src/components/Toggle/Toggle.tsx), [Radix switch source](https://github.com/radix-ui/primitives/blob/main/packages/react/switch/src/switch.tsx)); Primer renders a `button` with `aria-pressed`, a toggle button rather than a switch ([Primer ToggleSwitch source](https://github.com/primer/react/blob/main/packages/react/src/ToggleSwitch/ToggleSwitch.tsx)). The toolkit takes the native input, which keeps its form value and no-script path (code-standard rules 8 and 20).
- [strong] Whichever element, the APG's contract holds: role `switch`, `aria-checked` (or `checked`) for on, Space toggles, and the name comes from the visible label ([APG switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)).

**Props**
- [strong] `checked` (or `defaultChecked`), `disabled`, `onChange`, `size`, and the label; Primer adds `loading`, `loadingLabel`, `buttonLabelOn` and `buttonLabelOff`; Carbon names on `toggled` with `labelA`, `labelB` and `hideLabel`; React Aria `isSelected`; MUI `checked` and `size`. All four carry the same boolean under different names.
- [weak] A pending save is a `loading` prop that keeps the switch focusable and announces what is saving, as Primer does with `aria-disabled` and its `loadingLabel`; not `disabled`, which drops focus ([button: *Loading buttons*](button.md#loading-buttons) holds the same reasoning).

**From Figma**
- [required] Each Figma axis maps to one attribute, property or pseudo-class, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Checked=True` | `checked`, styled from `:checked` |
  | `Checked=False` | nothing |
  | `Size` | `size` |
  | `Disabled=True` | `disabled` on the input |
  | `State=Hover`, `Press`, `Focus` | `:hover`, `:active`, `:focus-visible`, set by the browser |
  | `State=Loading` | `aria-busy="true"` on the host as the styling hook, `aria-disabled` while it saves, and the saving text in a status region; not `aria-busy` alone |
  | `Label`, `Description` | the `label`; the description tied with `aria-describedby` (code-standard rule 15) |
  | `Show state text`, `On label`, `Off label` | visible text marked `aria-hidden`, since the checked state is announced |

**Check**
- *Script*: the parity loop compares each variant's track, thumb and ring with its frame, the thumb's end mirrored under `dir="rtl"` (design-code-parity); the component contract flags a Figma axis with no prop.
- *Judgement*: does a failed save put the switch back and say why, in place?

**Sources.** MUI, React Aria, Carbon, Radix and Primer source as linked; the APG switch pattern; the toolkit's state-axis research for the Loading mapping.
