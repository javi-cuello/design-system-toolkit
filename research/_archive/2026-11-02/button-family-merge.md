# Button, icon button, context button and interactive icon: merge or keep apart

Whether Suiteify's four button-like components should become fewer, what the major design systems ship instead, and what each merge would cost in a Figma library that is meant to stay small. The proposal (section 8) is two merges: Context button into Button and Icon button, Interactive icon into Icon button.

Researched October 2026. Thirteen systems were read from their own documentation, source code or issue trackers (Material 3, MUI, Carbon, Polaris, Primer, Spectrum, Atlassian, Fluent 2, Ant Design, GOV.UK, Radix Themes, Chakra UI, Twilio Paste). Suiteify's figures were read from the live Figma library and from the engineers' code on the same day. Where a claim rests on a single source or on commentary, it says so.

---

## What this answers

The question arrives as "can we merge some of these?", and it splits into smaller ones that come up in this order:

- What does Suiteify have today, and what does each component cost?
- Do other systems give icon-only buttons their own component?
- Is "compact" ever a component of its own, and what would merging Context button cost?
- Where does a bare clickable icon live in other systems?
- What would merging Icon button into Button actually cost?
- What would merging Interactive icon into Icon button cost?
- Do other libraries draw an "open" state on buttons, as Context button does?
- So what should Suiteify merge?

Section 9 is the lookup table. Section 10 is the short version for someone who reads nothing else.

---

## 1. What does Suiteify have today, and what does each component cost?

**The short answer.** Four components, 245 variants between them, and two of the four already overlap: Context button contains its own icon-only form, and Interactive icon is what MUI calls an icon button.

The four components were read from the library on 5 October 2026. A **variant** here is one combination of a component set's variant properties, each drawn as its own frame in Figma; every axis added to a set multiplies its frames, which is why the variant count is the number that grows a component's weight. **Places to change** counts the instances a merge would have to swap by hand: those placed directly inside other components' definitions, plus those placed loose on the canvas. Instances nested inside other instances are left out, because they follow their parent component automatically once that component is updated.

| Component | Variants | What it is made of | Places to change |
|---|---|---|---|
| Button | 108 | `Size` Large/Medium/Small × `Role` Primary/Secondary/Tertiary × `Feedback` Neutral/Danger × five `State` values plus Disabled at Rest. `Label text`, `Left icon`, `Right icon` as properties | 477 (39 inside 9 components, 438 on the canvas) |
| Icon button | 45 | the same three sizes (44, 40 and 32px squares) × three role and feedback pairs (Secondary Neutral, Tertiary Neutral, Tertiary Danger) × four states plus Disabled. No Primary, no Loading | 101 (54 inside 13 components, 47 on the canvas) |
| Context button | 72 | `Type` Default/Icon only × `Size` Medium/Small × `Feedback` × `Open` × states, sparse where Open and Disabled cannot meet. `Label text`, `Value text`, `Icon`, `Value`, `Badge` as properties | 592 (14 inside 5 components, 578 on the canvas) |
| Interactive icon | 20 | `Icon size` 16/20 × `Open` × four states plus Disabled. No container: the glyph with a state layer, on a 24px or 36px target | 78 (56 inside 14 components, 22 on the canvas) |

The canvas counts for Button and Context button are high because they include each page's documentation examples and variant matrix. The figures cover the library file only; every product design file that uses these components would need the same swap.

The engineers' code tells a second story. Its `IconButton` is built on top of its `Button` (a styled `Button` with square padding), and `Button`'s own size list already includes `iconLarge`, `iconMedium` and `iconSmall`. Its `InteractiveIcon` and `ContextButton` are built separately, on MUI's lower-level `ButtonBase`. So in code, Button and Icon button are already one implementation exposed as two components, while the other two stand apart.

**What to do.** Treat the variant count and the places-to-change count as the two costs of any merge, and weigh them separately: the first is what a designer pays every time they open the component, the second is a one-off migration. The rest of this guide prices each merge in both.

---

## 2. Do other systems give icon-only buttons their own component?

**The short answer.** More of them split than merge, and the split systems include MUI, the library Suiteify's code is built on. But one large system merged and stayed merged, so this is a real choice rather than a settled rule.

Lay the thirteen systems on a ladder, from fully split to fully merged.

**Split: a separate icon button component.** MUI ships `Button` and `IconButton` as different components with different props. Material 3's Jetpack Compose has its own `IconButton`, `FilledIconButton`, `FilledTonalIconButton` and `OutlinedIconButton`. GitHub Primer ships `IconButton` beside `Button`, both rendering a shared `ButtonBase`. Atlassian's new button package exports `Button`, `IconButton`, `LinkButton`, `LinkIconButton` and `SplitButton`. Adobe Spectrum separates `ActionButton` from `Button`, though by emphasis rather than by content. Radix Themes ships `IconButton`.

**Hybrid: one name hands off to the other.** IBM Carbon's `Button` takes `hasIconOnly`, and when that is set, Button's source renders Carbon's separate `IconButton` component underneath. Chakra UI ships an `IconButton` that is just its `Button` with the padding set to zero. Material's Android Views library uses one `MaterialButton` class with separate icon-button styles.

**Merged: icon-only is a state of Button.** Microsoft Fluent 2 has one `Button`; give it an `icon` and no text and it becomes icon-only, a condition its code derives rather than one a designer sets. Shopify Polaris has never had an icon button: `Button` takes an `icon` and an `accessibilityLabel`. Ant Design adds an `icon-only` class when a `Button` has an icon and no children. Twilio Paste encodes it as `variant` values (`primary_icon`, `secondary_icon`, `destructive_icon`) paired with icon sizes.

Two migrations make the trade-off concrete. **Fluent merged.** Its v8 library had a separate `IconButton`; the v9 migration guide says plainly that common buttons now all map to `Button`, so `<IconButton iconProps={…}/>` becomes `<Button appearance="subtle" icon={…}/>`. Fluent kept separate components only where the *behaviour* differs: `MenuButton`, `SplitButton`, `ToggleButton`, `CompoundButton`. **Atlassian split.** Its 2025 write-up on the new buttons describes the old one-size-fits-all button as large and slow, and replaced it with purpose-built components, reporting about a 10% cut in render time. That reason is about code performance, which a Figma library does not have, so it does not transfer here.

Atlassian's split also shows the cost of splitting. Its `ButtonAppearance` offers `danger` and `warning`; its narrower `IconButtonAppearance` offers neither. Two lists that started as one have drifted apart. Carbon reaches the same restriction by rule rather than by accident: its usage guidance says a danger button cannot be icon-only. Suiteify's Icon button has narrowed the same way, without saying so: it has no Primary role, no Secondary Danger, and no Loading state.

What a separate icon button buys, in the systems that kept one, is mostly accessibility. An icon-only button has no visible text, so it needs an accessible name some other way. A separate component can make that name **required in its API**: Primer lists `aria-label` as required, Atlassian and Carbon require a `label`. A merged Button cannot do that cleanly, because the same prop must be optional when there is visible text; Polaris can only recommend `accessibilityLabel`. Several split systems also build the tooltip in: Carbon's `IconButton` always wraps a tooltip, and Primer turned it on by default after an issue argued that the label should appear on hover and on keyboard focus.

On independence: Primer, Atlassian, Radix and Chakra all sit in the same React ecosystem and partly echo each other, so their agreement counts for less than four separate votes. Fluent, Polaris and Ant Design reached the merged answer independently, from three different companies.

**What to do.** Keep Icon button as its own component. It matches MUI, which the code targets, and lets its accessible-name and tooltip rules live in one place. It also stops Button's variant count from absorbing a second family (section 5 prices that). This is the majority position and also this guide's judgment; Fluent shows that the opposite works too, for a team willing to carry one larger component.

---

## 3. Is "compact" ever a component of its own, and what would merging Context button cost?

**The short answer.** No. Every system surveyed treats compactness as a size or density value on the same component. Context button is a Tertiary button with a value and a badge, drawn at Button's own heights, so it folds into Button and Icon button rather than standing as a fourth component.

The pattern is uniform. MUI uses `size="small"`, and its API page describes small as the dense button styling. Atlassian has a `spacing` property with `compact` and `default`. Polaris has `size` values `micro` and `slim`. Material 3 Expressive added an Extra small size. Carbon has `xs` and `sm`. Nobody ships a CompactButton.

Context button is compact only incidentally. Its job is a **menu trigger**: it has an `Open` axis, a `Value text` beside the label and a `Badge`, and its description calls it the trigger for actions attached to a single row or element. Read from the library, its looks are Button's. Its two sizes are 40 and 32px tall, Button's Medium and Small. It has no background at rest, like Button's Tertiary role. Its `Icon only` type is a 40 or 32px square, Icon button's Tertiary Medium and Small. The one thing it draws that Button does not is `Open=True`, a `secondary-translucent` background behind the button.

Systems split on whether a menu trigger needs its own component. Fluent keeps a `MenuButton` and Carbon a `MenuButton` and `ComboButton`. Primer, Atlassian and Polaris keep it on `Button`: Primer's Button styles `aria-expanded` and takes a `count` badge, Atlassian's dropdown trigger is a `Button` with `isSelected`, and Polaris has a `disclosure` prop. Suiteify's case falls on the second side, because the trigger already shares Button's sizes and role and differs only in three properties and one background.

What the merge costs, priced the same way as sections 5 and 6:

| | Today | Merged |
|---|---|---|
| Components | Button + Icon button + Context button | Button + Icon button |
| Variants | 108 + 45 + 72 = 225 | Button 114, Icon button 51 (before the Ghost merge) |
| New properties on Button | none | `Value`, `Value text`, `Badge`, bound only in Tertiary variants |
| Places to change | 0 | 592 (14 inside 5 components, 578 on the canvas, mostly its own documentation page) |
| Code | `ContextButton` on `ButtonBase` | their `Button` with `buttonRole="tertiary"`, value and badge as children, `aria-expanded` styled |

Unlike the icon-only merge in section 5, this one adds no axis to Button: the trigger's sizes and role already exist there, so the cost is three properties and six `State=Open` variants, not a second family.

**Three traps in this merge.**
- **The label colour differs.** Context button's Neutral label is `Neutral/secondary`; Button Tertiary's is `Neutral/primary`. Swapped triggers will read one step darker unless the team picks the trigger's colour first. Danger matches (`Danger/secondary` in both).
- **Open loses its combinations.** Today `Open=True` is drawn with Rest, Focus, Hover and Press. As one `State` value it is drawn once, so hover-while-open is no longer a separate frame. Primer accepts the same trade.
- **Overrides follow layer names.** Context button's `Label` and `Icon` layers must match Button's names before the swap, and `Value text` must exist on Button under the same property name, or each swapped trigger loses its text.

**What to do.** Merge Context button into Button and Icon button. `Type=Default` becomes Button `Role=Tertiary` with three added properties (`Show value`, `Value`, `Badge`, under the naming decisions in section 8); `Type=Icon only` becomes Icon button `Role=Tertiary`. `Open` becomes one more `State` value, present only on Tertiary, rather than an axis (section 8 prices it). If a genuinely compact plain button is ever needed, add a size to Button rather than a component.

---

## 4. Where does a bare clickable icon live in other systems?

**The short answer.** Always inside the icon button, as its lowest-emphasis appearance. No system surveyed ships a separate bare-icon component, and in MUI the bare one *is* the default icon button.

The pattern holds across every split system. Material 3's "standard" icon button is the one with no container, one of four styles beside filled, tonal and outlined. Primer uses `variant="invisible"`, Atlassian `appearance="subtle"`, Carbon `kind="ghost"`, Spectrum `isQuiet`, Radix `variant="ghost"`. The merged systems do the same on Button: Fluent's `appearance="transparent"` removes background and border, Ant Design uses `type="text"` with an icon.

MUI deserves its own paragraph because the code is built on it. MUI's `IconButton` has **no container by default**: a glyph with a ripple, exactly like Suiteify's Interactive icon. It has no `variant` prop at all. A request to add a contained variant was opened in May 2023 and closed as not planned ([issue #37443](https://github.com/mui/material-ui/issues/37443)). So in MUI's vocabulary, Suiteify's Interactive icon is the icon button, and Suiteify's contained Icon button is something MUI does not offer, which is why the engineers built it on `Button` instead. That inversion is worth saying out loud to them, because a developer reading "IconButton" in a ticket will picture the bare one.

How the names line up today and after the merges in section 8:

| Figma today | Suiteify code today | Closest MUI component | Figma after the merges |
|---|---|---|---|
| Button | `Button` | `Button` | Button |
| Icon button (contained) | `IconButton`, a styled `Button` | `Button` with square padding; MUI's `IconButton` has no contained form | Icon button, Secondary and Tertiary roles |
| Interactive icon (bare) | `InteractiveIcon`, on `ButtonBase` | `IconButton`, its default look | Icon button, `Role=Ghost` |
| Context button | `ContextButton`, on `ButtonBase` | `Button` with `aria-expanded` | Button and Icon button, Tertiary with `State=Open` |

**What to do.** Treat Interactive icon as the ghost appearance of Icon button, in naming and documentation, even before deciding whether to merge the files (section 6 prices that). This is industry consensus with no exception found.

---

## 5. What would merging Icon button into Button actually cost?

**The short answer.** One fewer component, in exchange for a 153-variant Button whose `Size` means two shapes. The industry is split on this merge, and Suiteify's constraint of small Figma components points to keeping them apart.

Walk the merge. The merged Button needs a way to say "icon only", so it gains an axis, say `Content` with Label and Icon only. If every existing combination got an icon-only form, Button would double from 108 to 216 variants. It would not, because Icon button deliberately has fewer roles: keeping that restriction, the icon-only side adds Icon button's 45 variants, and Button becomes **153 variants in one set**.

Then the properties. Properties are defined once for the whole set, but a variant only uses those bound to layers it contains. Suiteify's Context button already works this way: its `Icon only` variants bind only `Icon swap`, while `Label text`, `Value`, `Value text` and `Badge` are bound only in `Type=Default`. So icon-only variants of a merged Button need not carry the label layers, at the price of building those variants differently from their labelled siblings. What does not go away is `Size` meaning two things: a 64 to 80px-wide button with text, or a 32 to 44px square.

| | Today | Merged |
|---|---|---|
| Components | Button + Icon button | Button |
| Variants in the set a designer opens | 108, or 45 | 153 |
| Set-wide property list | 3 on Button, 0 on Icon button | one list holding both families' properties |
| Places to change | 0 | 101 Icon button instances swapped |
| Code | already two components on one implementation | no code change needed either way |

The merge would also not simplify the code, because the code already shares one implementation and exposes two names, which is what MUI and Primer do.

**The case against the merge, argument by argument.**
- **The set grows by 45 to 108 variants for no new capability.** Keeping Icon button's narrower roles, Button goes from 114 (after the Context button merge) to 159; giving icon-only every role Button has makes it 222. Every frame added is one more a designer scrolls past in the variant picker and one more to restyle when a token changes.
- **One property list for two families.** The set would define `Label text`, `Left icon`, `Right icon`, the trigger's `Value`, `Value text` and `Badge`, and an icon swap. Each variant binds only its own, as Context button's do today, but whoever maintains the set has to keep straight which layers exist in which half, and any code mapping of the set's properties sees all seven.
- **`Size` would mean two shapes.** Medium would be both a 64 to 80px-wide button with text and a 40px square. A designer resizing an instance cannot tell from the property which one they will get.
- **The two families are not the same grid.** Icon button has no Primary, no Secondary Danger and no Loading. In a merged set those become holes: combinations the picker refuses, which read as bugs. Filling them means drawing variants nobody asked for.
- **The Ghost role belongs only to icons.** After the Interactive icon merge, Ghost exists only for icon-only buttons with its own 24 and 36px sizes. Inside Button it would be one more role with holes across every labelled variant.
- **Accessibility rules need a home.** An icon-only button has no visible text, so its accessible name is mandatory. A separate component is where that can be required (Primer requires `aria-label`; Atlassian and Carbon require `label`) and where a tooltip can be built in (Carbon always, Primer by default). On a merged Button the same prop must stay optional for labelled buttons, so the rule becomes a recommendation, as it is in Polaris.
- **The code already has two names.** MUI ships `Button` and `IconButton`, and Suiteify's code exposes both. One Figma component mapping to two code components breaks the one-to-one naming that Dev Mode and the parity checks rely on.
- **The migration buys nothing.** 101 places to swap, with no change in code and no fewer decisions for designers, only fewer entries in the assets panel.

**The case for it, stated fairly.** Fluent, Polaris and Ant Design merged and did not go back. One component means one place to change a role's colours, and no drift between two lists, the failure Atlassian shows, where its icon button lost `danger` and `warning`. Both of those are real but cheap to guard in Figma: the two sets bind the same colour variables, so a role's colour already changes in one place, and a restriction like Tertiary Danger only can be written in the description so it reads as a decision rather than drift.

**What to do.** Do not merge Icon button into Button. The saving is one entry in the assets panel; the cost is a larger set with two shapes behind one `Size`, in a library whose stated goal is small components. Fluent made the opposite call and it works for them, but Fluent's Figma kit is not the constraint Suiteify is optimising for.

---

## 6. What would merging Interactive icon into Icon button cost?

**The short answer.** Almost nothing in variants and 78 places to change, the cheaper of the two merges this guide proposes. The catch is sizing: Interactive icon's 24px and 36px targets have no match in Icon button's 32, 40 and 44px sizes.

Add a fourth role to Icon button, `Ghost`, for the bare form. Ghost only needs the two sizes Interactive icon has today, so the merged set can stay sparse. Drawn as it is today, with `Open` as an axis, Ghost is 20 variants (two sizes × Open × five state columns) and the set is **65**, exactly what the two hold today. With `Open` as one `State` value instead (section 7), Ghost is 12 and the set 57. Either way the merge removes a component without growing anything.

The sizing is where it gets real. Interactive icon's 16px icon sits on a 24×24 target and its 20px icon on 36×36. Icon button's squares are 32, 40 and 44. A merged set needs either two extra size values used only by Ghost, or Interactive icon's targets moved onto Icon button's scale. Moving them grows the rows of the 14 components that place it: a 24px target becoming 32 adds 8px to every row that holds one. The two extra sizes are cheaper, and they keep a 24×24 target, which is exactly WCAG 2.2's minimum target size at level AA (success criterion 2.5.8).

`Open` needs a decision too (section 7): either it stays as a Ghost-only axis, or it becomes one `State` value driven by `aria-expanded` in code, which removes the axis.

**Three traps in this merge.**
- **Swapping across sets drops overrides.** A swap from one component set to another keeps an instance's overrides only where the layer names match. Interactive icon's icon layer and Icon button's must have the same name before the 78 swaps, or each swapped instance loses its chosen icon.
- **The two sizes leak.** If Ghost's 24 and 36 sizes appear as ordinary `Size` values, a designer can pick 24 for a contained Secondary button, which no one drew. Keep them sparse, present only on Ghost.
- **Code names stay crossed.** The code's `InteractiveIcon` is MUI's `IconButton`, and its `IconButton` is a styled `Button`. Merging the Figma files without telling the engineers leaves two names pointing at opposite things.

**What to do.** Merge Interactive icon into Icon button as `Role=Ghost`, with its two sizes kept on Ghost only. It is the merge every surveyed system already reflects, it adds no variants, and its 78 places are the smaller of the two migrations. The judgment call is whether to keep the 24px size; this guide would keep it, because the dense inline contexts it serves exist in 14 components.

---

## 7. Do other libraries draw an "open" state on buttons, as Context button does?

**The short answer.** Some do, and when they do they mostly reuse the pressed or selected look rather than inventing a new one. A separate `Open` value with its own appearance is rare.

The systems fall into four groups:
- **Reuse the press or selected look.** Primer styles `[aria-expanded='true']` with the same tokens as its active (pressed) state. Atlassian's dropdown trigger passes `isSelected` while the menu is open. Material 3's split button reuses its checked state, and its trailing button turns as it opens.
- **A separate style that shares the selected tokens.** Fluent's `MenuButton` has its own expanded style hook, built from the same `Selected` token family its `ToggleButton` uses, and swaps the icon for its filled version.
- **Only the chevron changes.** Carbon's `MenuButton` and `ComboButton` rotate the chevron; Polaris's `disclosure` prop swaps the arrow between up and down.
- **No open look at all.** MUI's `Button` and `IconButton`, Spectrum's `ActionButton` and Ant Design's dropdown trigger draw nothing for open by default.

| System | Draws open? | Driven by | Looks like |
|---|---|---|---|
| Primer | yes | `aria-expanded` | the pressed state |
| Atlassian | yes | `isSelected` on the trigger | the selected state |
| Material 3 | yes, on the split button | checked state | selected, plus a turning chevron |
| Fluent 2 | yes | `aria-expanded` | its own style, selected tokens |
| Carbon | chevron only | internal open class | rotated chevron |
| Polaris | chevron only | `disclosure` | up or down arrow |
| MUI, Spectrum, Ant Design | no | nothing styled | unchanged |

The code fact that matters for Suiteify: MUI draws nothing for open, so whatever the Figma `Open=True` variant shows, the engineers will have to add a style for it themselves, as Primer does with an `aria-expanded` selector. In code, open is the `aria-expanded` attribute the menu sets, not a value a designer chooses.

**What to do.** Keep the open look, but as one `State` value (`Open`) on the Tertiary and Ghost roles, not as an axis. That is Primer's model: open is one appearance, not a second dimension multiplied by hover, focus and press. Today's `Open=True` × four states draws hover-while-open and focus-while-open separately; the merged set draws open once and lets the focus ring sit on top in code. Tell the engineers it maps to `aria-expanded`, with a style they will need to add because MUI draws none.

---

## 8. So what should Suiteify merge?

**The short answer.** Two merges: Context button into Button and Icon button, and Interactive icon into Icon button as a Ghost role. Button and Icon button stay separate from each other. Four components become two, and the variant total falls by a quarter.

The arithmetic, with `Open` as one sparse `State` value on Tertiary and Ghost only:
- **Button** gains `State=Open` on Tertiary: three sizes × two feedbacks = 6 variants, so 108 becomes 114. It also gains three instance properties (`Value`, `Value text`, `Badge`).
- **Icon button** gains `State=Open` on Tertiary (6 variants) and the Ghost role: two sizes × Rest, Focus, Hover, Press, Open, plus Disabled = 12. So 45 becomes 63.
- **Context button**'s 72 variants and **Interactive icon**'s 20 retire.

| | Today | Proposed | Why |
|---|---|---|---|
| Button | 108 variants | 114, Tertiary gains `State=Open`; plus `Value`, `Value text`, `Badge` | Context button's labelled form is already a Tertiary button at Button's heights |
| Icon button | 45 variants | 63, Tertiary gains `State=Open`; adds `Role=Ghost` (24 and 36px, Ghost only) | Context button's icon-only form is Icon button Tertiary; the bare icon is the icon button's lowest emphasis everywhere |
| Context button | 72 variants | retired into Button and Icon button | menu triggers live on Button in Primer, Atlassian and Polaris |
| Interactive icon | 20 variants | retired into Icon button | no surveyed system ships a separate bare icon |
| Total | 4 components, 245 variants | 2 components, 177 variants | no set grows past 114 |

Two costs are real. Button's property list grows by three (`Value`, `Value text`, `Badge`); bound only in Tertiary variants, as Context button binds them only in `Type=Default` today, they stay out of the other roles' variants, but the Tertiary variants then differ in structure from Primary and Secondary. And Context button's Neutral label is `Neutral/secondary` where Button Tertiary's is `Neutral/primary`, so merged triggers will read one step darker unless the team decides the trigger's quieter label should win.

The order to do it in:
1. Decide the label colour: Button Tertiary's `primary` or Context button's `secondary`.
2. Add `State=Open` (fill `Color/Background/Neutral/secondary-translucent`, as Context button draws it today) to Tertiary in both sets, and `Show value`, `Value` and `Badge` to Button. Rename Context button's own properties the same way (`Value` to `Show value`, `Value text` to `Value`, `Label text` to `Label`) before step 4, so the swap keeps their overrides.
3. Add `Ghost` to Icon button's Role, with the two Ghost-only sizes (24 and 36), keeping the set sparse.
4. Match layer names before swapping: Context button's `Label` and `Icon` against Button's, Interactive icon's icon layer against Icon button's, so overrides survive.
5. Swap. Context button: 592 places (14 inside 5 components, 578 on the canvas, most of them its own documentation page, which is rebuilt rather than swapped). Interactive icon: 78 places (56 inside 14 components, 22 on the canvas). Check a handful of swapped instances kept their label, value and icon.
6. Deprecate both retired components rather than deleting them, so product files can migrate on their own schedule.
7. Tell the engineers: `ContextButton` becomes their `Button` with `buttonRole="tertiary"`, its value and badge as children, and `aria-expanded` styled to match `State=Open`; the Ghost icon button is MUI's default `IconButton`; the contained Icon button stays their styled `Button`.

**Property names in the merged sets.** This guide uses the library's current property names so its counts can be checked against the file. Suiteify's naming decisions of 5 October 2026 rename several of them, and the merged Button and Icon button should be built with the new names, so the swapped instances are renamed once rather than twice:

| Name today | Name under the naming decisions |
|---|---|
| `Label text` | `Label` |
| `Value text` (the text) | `Value` |
| `Value` (the boolean that shows it) | `Show value` |
| `Icon swap` | `Icon` |
| an `Icon` boolean that shows the swapped icon | `Show icon` |
| `Left icon`, `Right icon` | `Leading icon`, `Trailing icon` |
| `Badge`, `State=Open`, `Role=Ghost` | unchanged |

A boolean takes `Show` only when the element it reveals has a text or swap property of its own, which is why `Value` becomes `Show value` while `Badge` stays bare. Renaming before step 4 also helps the layer match: each text layer then carries the same bare noun as the property it binds (`Label`, `Value`). The component names, Button and Icon button, do not change.

**What to do.** Make both merges. Each retired component is already a role and size the surviving set draws, so the merges remove components without adding axes, and the largest set grows by 6 variants.

---

## 9. Cheat sheet

| Question | Industry answer | Suiteify |
|---|---|---|
| Icon-only button: own component or Button prop? | split, slightly more common (MUI, Primer, Atlassian, Material 3); merged works too (Fluent, Polaris, Ant) | keep Icon button separate |
| Compact button? | always a size or density value, never a component | no compact component; Context button merges into Button and Icon button Tertiary |
| Bare clickable icon? | always a low-emphasis appearance of the icon button | merge Interactive icon into Icon button as Ghost |
| Danger on icon-only? | often restricted (Carbon forbids it, Atlassian's icon button omits it) | keep Tertiary Danger only, and write the restriction down |
| Accessible name on icon-only? | required in the API where the component is separate (Primer, Atlassian, Carbon) | require it in code; note it in the Figma description |
| Tooltip on icon-only? | built in by default (Carbon, Primer) | worth asking the engineers to build in |
| Open state on a menu button? | reuse press or selected, or chevron only | one sparse `State=Open` on Tertiary and Ghost, mapped to `aria-expanded` |
| Minimum target | 24×24 CSS px (WCAG 2.2, 2.5.8 AA); 48dp on Android | Ghost's 24px size meets it exactly |

---

## 10. The short version

Suiteify has four button-like components: Button (108 variants), Icon button (45), Context button (72) and Interactive icon (20). Across thirteen major design systems, the pattern for each is clear enough to act on.

Icon-only buttons are a separate component in most systems, including MUI, the library Suiteify's code is built on, and a separate component is where an accessible name can be made mandatory. Fluent, Polaris and Ant Design merged them into Button instead and that works, but for Suiteify it would turn Button into a 153-variant set where `Size` means both a labelled button and a square. Keep Icon button separate.

No system ships a compact button component; compactness is always a size. Context button is a menu trigger drawn as a Tertiary button at Button's 40 and 32px heights, and Primer, Atlassian and Polaris keep menu triggers on Button. So it merges: its labelled form into Button Tertiary with a value and a badge, its icon-only form into Icon button Tertiary.

A bare clickable icon is, in every system surveyed, the lowest-emphasis appearance of the icon button, and in MUI it is the default icon button. So Interactive icon merges into Icon button as a Ghost role with its own two sizes. Before swapping, give the layers matching names so the chosen labels and icons survive.

Where an open state is drawn, other systems mostly treat it as one appearance rather than a dimension, and MUI draws none. So `Open` becomes one `State` value on Tertiary and Ghost, and the engineers add an `aria-expanded` style to match it.

The result is two components instead of four, 177 variants instead of 245, and no set larger than Button's 114. The costs: three properties on Button that only Tertiary binds, a label-colour decision, and 670 places to swap, most of them Context button's own documentation page.

---

## 11. What to re-check later

- **Material 3 Expressive.** Its sizes, icon-button widths and shape changes were read from Material's Android documentation and search snippets, because the m3.material.io pages render only in a browser. Re-check against the site itself before quoting it.
- **Atlassian.** Whether its icon button's tooltip is now on by default, and which version introduced the new IconButton, could not be confirmed; its component pages also render only in a browser.
- **Polaris.** The React library's repository was archived in September 2026 and its docs now point to Shopify's web components (`s-button`), which keep the merged model. Watch whether the web components keep the same props.
- **Why MUI, Primer and Spectrum split.** No issue or design record stating the original reason was found for any of them; the split is documented, its rationale is not.
- **User research.** No system's own research on icon-only buttons was found. The only usability evidence is commentary: Nielsen Norman Group's icon usability article, and research Carbon cites on labels being learned better than icons. Treat the case for visible labels as well-argued rather than measured.
- **Spectrum 2, Paste's usage guidance and Base Web** were not checked.
- **Suiteify's counts** were read on 5 October 2026 and change as the library does; product design files were not counted.

---

## Sources

### Primary

- [Material Components Android: Icon buttons](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/IconButton.md)
- [Material Components Android: Common buttons](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/CommonButton.md)
- [Material Components Android: Split button](https://raw.githubusercontent.com/material-components/material-components-android/master/docs/components/SplitButton.md)
- [Android Developers: Icon buttons in Compose](https://developer.android.com/develop/ui/compose/components/icon-button)
- [MUI: Button](https://mui.com/material-ui/react-button/)
- [MUI: IconButton API](https://mui.com/material-ui/api/icon-button/)
- [MUI: Density](https://mui.com/material-ui/customization/density/)
- [MUI issue #37443: IconButton misses "contained" variant (closed, not planned)](https://github.com/mui/material-ui/issues/37443)
- [MUI issue #39943: material-next IconButton](https://github.com/mui/material-ui/issues/39943)
- [MUI IconButton type definitions](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/IconButton/IconButton.d.ts)
- [Carbon: Button usage](https://carbondesignsystem.com/components/button/usage/)
- [Carbon: Button source](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/Button/Button.tsx)
- [Carbon: IconButton source](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/react/src/components/IconButton/index.tsx)
- [Carbon: v11 migration guide](https://raw.githubusercontent.com/carbon-design-system/carbon/main/docs/migration/v11.md)
- [Carbon issue #1714: Icon-only button](https://github.com/carbon-design-system/carbon/issues/1714)
- [Polaris: Button source](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-react/src/components/Button/Button.tsx)
- [Polaris web components: Button](https://shopify.dev/docs/api/app-home/polaris-web-components/actions/button)
- [Polaris web components: Clickable](https://shopify.dev/docs/api/app-home/polaris-web-components/actions/clickable)
- [Polaris PR #10090: replace booleans with new props](https://github.com/Shopify/polaris-react/pull/10090)
- [Polaris: migrating from v11 to v12](https://raw.githubusercontent.com/Shopify/polaris/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)
- [Primer: IconButton](https://primer.style/product/components/icon-button/)
- [Primer: IconButton accessibility](https://primer.style/product/components/icon-button/accessibility/)
- [Primer: Button](https://primer.style/product/components/button/)
- [Primer: Button props, including `count`](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Button/types.ts)
- [Primer: IconButton source](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Button/IconButton.tsx)
- [Primer: ButtonBase styles, including the aria-expanded selectors](https://raw.githubusercontent.com/primer/react/main/packages/react/src/Button/ButtonBase.module.css)
- [Primer issue #2008: IconButton should include Tooltip by default](https://github.com/primer/react/issues/2008)
- [React Spectrum: ActionButton](https://react-spectrum.adobe.com/react-spectrum/ActionButton.html)
- [React Spectrum: Button](https://react-spectrum.adobe.com/react-spectrum/Button.html)
- [Spectrum Web Components: Button](https://opensource.adobe.com/spectrum-web-components/components/button/)
- [Spectrum Web Components: Action button](https://opensource.adobe.com/spectrum-web-components/components/action-button/)
- [Atlassian: Evolving buttons and links](https://atlassian.design/whats-new/evolving-button-and-links)
- [Atlassian: button changelog](https://unpkg.com/@atlaskit/button/CHANGELOG.md)
- [Atlassian: IconButton types](https://unpkg.com/@atlaskit/button/dist/types/new-button/variants/icon/types.d.ts)
- [Atlassian: button appearance types](https://unpkg.com/@atlaskit/button/dist/types/new-button/variants/types.d.ts)
- [Fluent 2: Button types](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-button/library/src/components/Button/Button.types.ts)
- [Fluent 2: useButton, where icon-only is derived](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-button/library/src/components/Button/useButton.ts)
- [Fluent 2: button migration guide](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-button/library/docs/MIGRATION.md)
- [Fluent 2: icon button story](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/react-components/react-button/stories/src/Button/ButtonIcon.stories.tsx)
- [Ant Design: Button docs](https://raw.githubusercontent.com/ant-design/ant-design/master/components/button/index.en-US.md)
- [GOV.UK Design System: Button](https://design-system.service.gov.uk/components/button/)
- [GOV.UK backlog issue #24: Icons](https://github.com/alphagov/govuk-design-system-backlog/issues/24)
- [Radix Themes: IconButton](https://www.radix-ui.com/themes/docs/components/icon-button)
- [Chakra UI: IconButton](https://chakra-ui.com/docs/components/icon-button)
- [Chakra UI: IconButton source](https://raw.githubusercontent.com/chakra-ui/chakra-ui/main/packages/react/src/components/button/icon-button.tsx)
- [Twilio Paste: Button types](https://raw.githubusercontent.com/twilio-labs/paste/main/packages/paste-core/components/button/src/types.ts)
- [W3C: Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)

### Commentary

- [Nielsen Norman Group: Icon Usability (Aurora Harley, 2014)](https://www.nngroup.com/articles/icon-usability/)

### Suiteify

- The Components - Web app Figma library, read through the Figma plugin on 5 October 2026: variant counts, property definitions and instance placements.
- The engineers' code at `~/Projects/suiteify`: `Button.types.ts` (size list with icon sizes), `IconButton.tsx` (a styled `Button`), `InteractiveIcon.tsx` and `ContextButton.tsx` (both on `ButtonBase`).
