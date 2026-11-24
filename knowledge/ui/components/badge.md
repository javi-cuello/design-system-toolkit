# Badge

A badge is a short label for the state of an object, in a list, a table or a header: Draft, Published, Failed. It does nothing when pressed. This page owns the status badge as a component, in design, in Figma and in code. Telling a badge from a chip or a tag stays in [chips: badges, pills, chips and tags](../patterns/chips.md#badges-pills-chips-and-tags-telling-them-apart), and a tag used as metadata or a link in [chips: tags as metadata and links](../patterns/chips.md#tags-as-metadata-and-links); choosing a badge over other feedback is [feedback: choosing the feedback](../patterns/feedback.md#choosing-the-feedback). Related: [chip](chip.md), [alert](alert.md), [toast](toast.md), [tables](../patterns/tables.md).

## Overview

**Use when / don't use**
- [weak] The state of an object, from the product's one list of statuses (design-standard rule 15); never interactive and never decoration. The cases are [*Status badges and pills*](#status-badges-and-pills).
- [moderate] A status badge and a count are two components: Primer ships `Label` for text and `CounterLabel` for a number ([CounterLabel.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/CounterLabel/CounterLabel.tsx)); MUI's `Badge` is only the count or dot pinned to another element (`badgeContent`, `max`, `variant="dot"`; [Badge types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Badge/Badge.d.ts)). The word differs by system, so the project's context document names which is which.

**Anatomy**
- [moderate] A container with a short text label and, optionally, a leading icon. Primer's `Label` (a `span` with `variant` and `size`; [Label.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Label/Label.tsx)) and Atlassian's `Lozenge` (`appearance`, `iconBefore`, `isBold`, `maxWidth`; [Lozenge code](https://atlassian.design/components/lozenge/code)) share it.
- [required] Not interactive, so it owes no focus state and no 24-pixel target; its text is still at least 12px and meets contrast (figma-standard rules 26 and 32).

## Status badges and pills

**Use when / don't use**
- [weak] Use to show the state of an object in a list, table or header: Draft, Published, Failed, Needs review.
- [weak] Use a count badge for tallies; use a tag for descriptive metadata ([Atlassian lozenge](https://atlassian.design/components/lozenge/usage)).
- [weak] Don't make a status badge interactive; a badge that opens a menu is a button styled as one.
- [weak] Don't use semantic colours for decoration or for user-chosen categories (Atlassian's accent colours exist for that).

**How**
- [required] Colour plus text, and an icon where the status must be scanned at density. Carbon's [status indicator pattern](https://carbondesignsystem.com/patterns/status-indicator-pattern/): rely on at least two of colour, shape and symbol, and add text; "Relying solely on color to convey status is insufficient" (WCAG 1.4.1).
- [weak] Short labels in sentence case (Atlassian: "Don't use long labels"; it truncates past 200px by default). One or two words.
- [weak] Three attention levels at most: high (act now: error), medium (no action needed: in progress), low (something changed or is ready) ([Carbon](https://carbondesignsystem.com/patterns/status-indicator-pattern/)).
- [weak] A dot-only status is allowed only in a dense column whose header names the status, and with the text available to assistive technology.

**Cases**
- A table uses green "Active", green "Live" and green "Published" for one state on three pages → one name, one badge, everywhere: the vocabulary is the design.
- A badge says "Error" in red with no explanation → keep the badge, and put the cause in the row's detail or a described-by text; a badge is a label, the message lives elsewhere.
- Twelve statuses in a workflow → group them into the three attention levels for colour, keep twelve labels; more colours than levels stop meaning anything.
- A grey "Disabled" badge at low contrast → disabled controls are exempt from 1.4.3, but a status badge is text and is not: it meets figma-standard rule 32.

**Accessibility**
- [required] 1.4.1: text or icon beside colour. 1.4.11: a status shape needs 3:1 against its background; 1.4.3 for its text.
- [required] A dot-only badge needs text in the accessible name or a visually hidden label; an icon-only badge is code-standard rule 18.

**Build**
- [required] A visual component, a custom element with text and no script: `<ds-badge tone="error">Failed</ds-badge>` (code-standard rule 8).
- [required] Tone is an attribute holding one of the project's tones, each status mapped to one; the icon is `aria-hidden` beside the text (code-standard rules 9 and 18).
- [required] A dot-only badge keeps its text for assistive technology in a `visually-hidden` span ([accessibility: *Hidden content*](../../code/accessibility.md#hidden-content)).
- [required] Colours are tokens, or a literal that carries its reason (code-standard rule 22; [tokens: *Three tiers*](../../code/tokens.md#three-tiers)).
- [weak] One colour token per tone, never one per status (beyond code-standard rule 22; after Carbon's attention levels).
- [weak] Never a `button` or link; a badge that opens something is a button component with a badge look.

**Check**
- *Script* could: collect every badge's text on a site and flag a text with two colours or a colour with two meanings; flag a badge with no text node and no accessible name.
- *Judgement*: is the vocabulary one list, and does each status say something the reader acts on?

**Sources.** Carbon asks for three cues where Atlassian asks for text and an optional icon; both keep the text, which WCAG 1.4.1 needs where colour is the other cue.

## In Figma

**Layers**
- [required] Auto layout; the container hugs its label and icon (figma-standard rule 33).
- [required] Layers named for their role: `Label`, `Icon` (figma-standard rule 10).
- [weak] The label stays on one line and truncates at a maximum width where the design sets one, as Atlassian's `maxWidth` does; figma-standard rule 33 allows a text layer that truncates by design. The full text then needs a home ([*Removing chips, overflow and wrapping*](chip.md#removing-chips-overflow-and-wrapping), long labels).

**Properties**
- [required] `Label` is a text property; `Show icon` sits directly above `Icon` (figma-standard rules 5, 21 and 37). The icon is a swap because each status in the vocabulary has its own icon, while the tone is shared by several statuses ([*Status badges and pills*](#status-badges-and-pills)).

**Variants and states**
- [required] One tone axis in figma-standard rule 1's `Feedback/…` slot, its values the code's and the tone tokens' words (figma-standard rules 22 and 56), such as `Info`, `Success`, `Warning`, `Error`: the words the Build's `tone="error"` uses, so Figma, the attribute and the token say the same. Primer's `variant` offers ten values; Atlassian's `appearance` adds workflow words (`inprogress`, `moved`, `new`, `removed`).
- [contested] **What the tone axis is called.** Primer's kit names it as its code does, `variant` for `variant` ([Label.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Label/Label.figma.tsx)); Carbon's names it `Color` for the prop `type` ([Carbon Tag.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tag/Tag.figma.ts)). figma-standard rule 21 departs: it takes the code prop's name, `Tone` for the Build's `tone` attribute.
- [weak] A tone value is a tone, never a status: each status in the vocabulary takes one tone, and the project decides which tone each attention level uses, so twelve statuses share a few values and the status's own word is the `Label` (beyond figma-standard rule 22; [*Status badges and pills*](#status-badges-and-pills), after Carbon's attention levels).
- [weak] An `Emphasis` axis, `Subtle` then `Bold`, where the product uses both: Atlassian's `isBold` does this.
- [required] Sizes are `Size` with t-shirt values, largest first (figma-standard rule 6); Primer offers `small` and `large`, which a build over Primer's badge as shipped takes instead (figma-standard rule 56). The full order is `Size → Emphasis → Tone`, `Emphasis` in figma-standard rule 1's role slot and the tone in its `Feedback/…` slot (figma-standard rule 1).
- [required] No `State` axis: the badge is not interactive, so a `State` would hold `Rest` alone, an axis with no choice (figma-standard rule 35).

**Tokens**
- [required] Fill, stroke, radius, padding and gap bound to semantic variables (figma-standard rules 24 and 29); the label in a text-role token (figma-standard rule 28), meeting contrast in every tone and mode (figma-standard rule 32).
- [required] A dot or icon that carries the status meets 3:1 against its background (WCAG 1.4.11).
- [required] Component tokens, where the project has them, follow figma-standard rule 49: `Component/Badge/Container/background-error`.

**Check**
- *Script*: figma-components-audit runs the rules cited above; a token-vocabulary check compares the tone values with the status token names (figma-standard rule 22).
- *Judgement*: does the tone axis hold the status tokens' tones, and no status of its own?

**Sources.** Primer, Atlassian and MUI as linked, with Carbon's Tag Code Connect for what its kit calls the tone axis. They agree on the parts; their tone lists differ in length, so the axis holds the project's status tokens' tones, never one value per status (figma-standard rule 22; design-standard rule 15).

## Alignment with code

**Structure**
- [strong] Code splits a status label from a count: Primer ships `Label`, `StateLabel` and `CounterLabel` ([CounterLabel.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/CounterLabel/CounterLabel.tsx)), Atlassian a `Lozenge` and a `Badge` that "is used to display numeric status data" ([Atlassian badge](https://atlassian.design/components/badge/code)), MUI a `Badge` that pins a count or dot to its children ([Badge types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Badge/Badge.d.ts)). This page's set is the status label; a count is a set of its own where the code has one, and the word clash is the *Overview*'s.
- [weak] Primer's kit mirrors its code one to one: three Figma components, each Code Connected to its own ([Label.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Label/Label.figma.tsx), [StateLabel.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/StateLabel/StateLabel.figma.tsx), [CounterLabel.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/CounterLabel/CounterLabel.figma.tsx)). Its `StateLabel` set maps Figma's words to the code's (`open` becomes `issueOpened` or `pullOpened`), one Figma set feeding two code variants.
- [weak] Carbon's Figma `Tag` turns a `Dismissible` boolean into a different code component, `DismissibleTag` ([Tag.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tag/Tag.figma.ts)). This page keeps the badge passive and the removable value a [chip](chip.md), so the badge set has no remove property.

**Mapping**
- [required] Each Figma property maps to one prop or attribute, recorded once (code-standard rules 9 and 10; [figma-handoff: *Variants to attributes*](../../code/figma-handoff.md#variants-to-attributes)):

  | Figma | Code |
  |---|---|
  | `Tone` (Primer `variant`, Carbon `Color`) | `tone`, the same word lowercased (`tone="error"`); Primer `variant`, Carbon `type` |
  | `Emphasis` | an attribute, such as `emphasis="bold"` |
  | `Size` | `size` |
  | `Label` | the text, children |
  | `Show icon`, `Icon` | a leading icon, `aria-hidden` (code-standard rule 18) |

**States**
- [required] The browser sets none: a badge is a `span` that takes no focus and answers no pointer, so it has no `:hover`, `:active` or `:focus-visible` frame and no `State` axis ([*In Figma*](#in-figma), Variants and states).
- [moderate] What code sets is the tone and the text, not a state: Primer's `variant` and Atlassian's `appearance` each take one tone value ([Label.figma.tsx](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Label/Label.figma.tsx), [Atlassian badge](https://atlassian.design/components/badge/code)).
- [moderate] A count's frames show what its props produce: MUI's `max` and Atlassian's `max` (99 by default) cap the number with a plus, and MUI's `showZero` and `invisible` decide whether zero shows ([Badge types](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/Badge/Badge.d.ts), [Atlassian badge](https://atlassian.design/components/badge/code)). A count set draws the capped value; the status badge has none of these.

**Differences**
- [contested] None for the tone axis where the set takes the code's name ([In Figma](#in-figma)), as Primer's kit does; Carbon's kit departs, `Color` for `type` ([Carbon Tag.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tag/Tag.figma.ts)).
- [weak] No `Disabled` and no loading value: Carbon's kit draws `State=Disabled` and `State=Skeleton` on its tag, mapping them to `disabled` and to a separate `TagSkeleton` ([Tag.figma.ts](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/code-connect/Tag/Tag.figma.ts)). A passive badge has nothing to disable, and a loading placeholder is not a state of the badge.

**Check**
- *Script*: the component contract lists `Size`, `Emphasis` and the tone axis beside the badge's attributes; a tone value in one with no partner in the other, or a `State` axis on the set, is a finding unless *Differences* names it (design-code-parity).
- *Judgement*: is every tone in Figma a tone attribute in code, word for word, and is any count drawn as its own set?

**Sources.** Primer's Label, StateLabel and CounterLabel Code Connect files and source, Atlassian's badge code page, MUI's Badge types, and Carbon's Tag Code Connect file, all as linked. They agree that a count and a status label are different components.

## In code

**Element**
- [weak] Inline text, not a control: Primer's `Label` renders a `span`, and code-standard rule 8 makes it a visual custom element with no script ([*Status badges and pills*](#status-badges-and-pills), Build).
- [weak] A count read aloud says what it counts: Primer's `CounterLabel` hides the visible number with `aria-hidden` and repeats it in a visually hidden "(n)".

**Props**
- [moderate] A tone, a size and an optional icon, the label as children; the tone's name differs: Primer `variant`, Atlassian `appearance`.
- [weak] Atlassian's `maxWidth` sets where the label truncates.

**Check**
- *Script*: the parity loop compares each tone with its frame (design-code-parity); a test could flag a badge rendered as a `button` or link.
- *Judgement*: does each tone value in code match one in Figma and one token, word for word?

**Sources.** Primer and Atlassian sources as linked; they agree on a passive inline label and differ only in the tone's name.
