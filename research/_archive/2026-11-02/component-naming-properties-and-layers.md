# Naming things inside Figma components

Properties, layers, and the default text that goes in them. What each name is actually used for, which ones matter, and how to keep them in step with code.

Researched August 2026. Figma behaviour checked against the current product, help centre and Plugin API docs. System conventions checked against their own repositories and published guides. Revised 5 October 2026 against Code Connect evidence: the property and layer names that 23 public kits use in 1,103 Code Connect files. See "What to re-check later" for what changed.


**Independent check, 6 October 2026.** A blind re-run on 6 October 2026, over 46 kits and 1,998 Code Connect files collected independently, reached the same conventions: space-joined part names in 13 kits (the most common; ` - ` only in Carbon, 6 names), bare-noun text properties in 38 of 40 kits (322 of 489 names), `Show X` with a bare `X` as the most common boolean pair (13 kits), `Icon` as the most common swap name, a `State` axis in 33 of 46 kits, and Size values as words (`Small`, `Medium`, `Large`) in 27 kits against codes in 20.
---

## What this answers

Building components in Figma means making a few dozen naming decisions per component, and most of them feel arbitrary. This guide is about the ones that are not arbitrary, because something downstream reads them.

The questions it works through:

- Should a toggle be called `isDisabled` or just `disabled`?
- When should something be a toggle, and when a dropdown?
- How do you say "this icon is optional" without it getting messy, now that Figma has slots?
- What do you do about states, where Figma and code genuinely disagree?
- What should text layers be called, and what should they say by default?
- What about all the other layers: the frames, icons and background shapes?
- Which layers actually deserve care, and which can be left alone?
- What breaks if a property or layer gets renamed after people are already using it?

There is a cheat sheet in section 19 and a plain summary in section 20. If only one section gets read, make it section 20.

**Part one, naming the properties**

1. [Why does naming a component deserve real effort?](#1-why-does-naming-a-component-deserve-real-effort)
2. [Should a boolean be `isDisabled` or `disabled`?](#2-should-a-boolean-be-isdisabled-or-disabled)
3. [When is a toggle the wrong control?](#3-when-is-a-toggle-the-wrong-control)
4. [How do you handle an optional icon slot?](#4-how-do-you-handle-an-optional-icon-slot)
5. [Where do Figma's State property and code's pseudo-classes disagree?](#5-where-do-figmas-state-property-and-codes-pseudo-classes-disagree)
6. [What about capitals, defaults, and property order?](#6-what-about-capitals-defaults-and-property-order)

**Part two, naming the layers**

7. [Why do layer names matter beyond the file they live in?](#7-why-do-layer-names-matter-beyond-the-file-they-live-in)
8. [Which layers actually deserve naming care?](#8-which-layers-actually-deserve-naming-care)
9. [Why does a text layer keep renaming itself?](#9-why-does-a-text-layer-keep-renaming-itself)
10. [What should you call the text layer?](#10-what-should-you-call-the-text-layer)
11. [What should the default text actually say?](#11-what-should-the-default-text-actually-say)
12. [How do you name frames, icons, images and decoration?](#12-how-do-you-name-frames-icons-images-and-decoration)
13. [How do you show what is editable?](#13-how-do-you-show-what-is-editable)
14. [What do you call an instance nested inside a component?](#14-what-do-you-call-an-instance-nested-inside-a-component)

**Part three, how the two fit together**

15. [What actually connects a property to a layer?](#15-what-actually-connects-a-property-to-a-layer)
16. [Which names can be renamed safely after adoption?](#16-which-names-can-be-renamed-safely-after-adoption)
17. [Should Figma names match code names?](#17-should-figma-names-match-code-names)
18. [Should the layer name match the property name?](#18-should-the-layer-name-match-the-property-name)
19. [The cheat sheet](#19-the-cheat-sheet)
20. [The short version](#20-the-short-version)
21. [What to re-check later](#21-what-to-re-check-later)

Two questions settle most of the debates below: does the name survive a rebrand or a redesign, and does it save someone downstream a decision they'd otherwise make alone. Tidiness is not one of the two, and it turns out to predict almost nothing about whether a library holds together a year later.

---

# Part one: naming the properties

## 1. Why does naming a component deserve real effort?

**The short answer.** Most naming choices genuinely do not matter. A handful matter a lot, because Figma, Code Connect and a growing set of AI tools read those names as instructions rather than labels.

A component property or a layer name inside a component is not a note to a future self. It is a string that other machinery looks up: Code Connect keys some of its mappings off it, override preservation matches on it whenever a consumer switches variants or swaps an instance, and (since Config 2026) Figma's own code-generation tooling reads it as the only semantic signal it has. Rename the string and that machinery stops finding it. Sometimes it fails loudly, which is fine. Sometimes it fails silently in someone else's file, which is not.

Before the arguments, the parts nobody argues about any more. In code, properties are camelCase (`showIcon`). Event handlers start with `on` and a verb (`onClick`). And properties describe what something is *for*, never what it currently looks like: `variant="primary"`, never `variant="blue"`.

That last one deserves a sentence, because the reason isn't obvious. Call a property `blue`, change the brand to green, and the property name is now a lie that nothing catches: no error, no warning, no failing test. Six months later a developer reads `variant="blue"`, believes it, and builds on a false statement. A property named for its purpose survives the rebrand, and surviving rebrands is close to the whole reason a design system exists.

**What to do.** Take those as settled and spend the team's argument budget on the questions in sections 2 through 6. Every system that tried the alternatives moved away from them; reopening that debate costs meeting time and changes nothing.

---

## 2. Should a boolean be `isDisabled` or `disabled`?

**The short answer.** Match whatever the codebase already does, and never mix the two conventions in one component. Starting fresh with no constraint, use the bare word: `disabled`.

This argument generates the most heat and matters the least, which makes it worth understanding both sides before picking.

**The case for the prefix.** In general programming, a boolean that reads as a claim rather than a fact is easier to scan. Adobe's React Spectrum wrote its grammar down rather than leaving it to taste, in the team's own API guidelines:

| Prefix | What it marks | Examples |
|---|---|---|
| `is` | a state the component is in | `isDisabled`, `isRequired` |
| `allows` | a restriction on what the user can do | `allowsSelection`, `allowsDuplicates` |
| `should` | a behaviour being configured | `shouldFlip`, `shouldCache` |
| `show` / `hide` | whether something appears, chosen by the default | `showIcon` |

The payoff shows up in a component with thirty properties: every `is`, `allows` and `should` marks the property as a toggle before its type has been read, which is real time saved scanning a long panel. The grammar also captures a distinction a bare word erases: `allowsSelection` is a permission granted to the user, `isSelected` is a state the thing is currently in. Call both `selected` and the difference disappears.

The same guidelines go further than most systems on the boolean question generally, arguing against booleans wherever a third value is plausible later, preferring `validationState="invalid"` to `isInvalid` "so that `validationState="valid"` could be supported in the future." That is section 3's rule, stated inside the naming guidelines rather than as a separate one.

**The case against** is mostly one specific bug, and it is a good one. HTML already has an attribute called `disabled`. If a component accepts both `disabled` and `isDisabled`, only one wins, and TypeScript does not reliably catch the mistake, because passing `disabled` to a DOM element is perfectly legal. The result looks correctly configured and is not.

Someone put the question to React Spectrum's own maintainers directly, in the project's GitHub discussions: why `isDisabled` when `disabled` already exists? The answer was "consistency between all boolean props across all components," which is a reasonable answer and also an admission that the prefix is house style, not technical necessity.

**The evidence that settles it is a migration, and a second data point outside the usual cluster.** Chakra UI spent two major versions as one of the most visible prefix-using libraries, then dropped the prefix entirely in v3:

| Chakra v2 | Chakra v3 |
|---|---|
| `isOpen` | `open` |
| `isDisabled` | `disabled` |
| `isInvalid` | `invalid` |
| `isRequired` | `required` |
| `defaultIsOpen` | `defaultOpen` |

No major Western-cluster system has gone the other way. And the bare-word convention is not only a Western habit: Ant Design, whose API naming rules are argued out in public on GitHub with no lineage back to React or HTML conventions, also lands on bare words, using `disabled` and `loading` and stating a preference for full words over abbreviations rather than for a prefix grammar at all. Two systems with no shared reporting line reaching the same answer under different constraints is stronger evidence than either alone.

That one-directional traffic within the Western cluster is also worth more than counting libraries on each side. Counting would mislead, because the bare-adjective camp there is not several teams independently reaching the same view: MUI, Ant Design, Primer, Polaris and Chakra v3 are all converging on what HTML already does. That is one idea with several adopters, not several confirmations. Migration direction, and a second answer from outside the cluster, are the stronger signals.

**Inside Figma the prefix is rarer still.** Across the Code Connect files of 23 public kits, 408 of 624 unique boolean property names (65%) are a bare noun or adjective (`Disabled`, `Selected`, `Divider`), and bare is the dominant style in 15 of the 23 kits. An `Is X` prefix appears 18 times, and only MetaMask uses it as its main style (`isDisabled`, `isSelected`), because MetaMask names its Figma properties after its code props. The prefix that does turn up in volume is `Show X` (117 names), and it does a different job: it marks a boolean that shows or hides an element, which section 4 and section 18 come back to.

**What to do.** Let the codebase decide, and be strict about it. If the code is React Spectrum or another prefixed library, use prefixes in Figma too. If it follows the HTML-aligned convention, use bare words. Starting from nothing, bare words, on the migration and cross-cluster evidence, and on what Figma kits actually ship. Reserve a `Show` prefix for a boolean that shows or hides an element with its own text, swap or slot property. Care more about consistency than about which is picked: the cost being avoided is the `disabled`/`isDisabled` collision, and collisions only happen where two grammars meet inside one component.

---

## 3. When is a toggle the wrong control?

**The short answer.** Use a toggle only when the concept is genuinely binary *and* independent of the other toggles. If two toggles can both be on and produce something nobody designed, they are secretly one dropdown.

MUI states the underlying rule plainly: "a boolean is used when 2 possible values are required," and an enum when more are required now or plausible later. MUI's own Button carries exactly three variants, `text`, `contained` and `outlined`, as one enum rather than two overlapping booleans.

The reason the rule matters is arithmetic, and it compounds faster than expected. Two toggles give four combinations. Three give eight. Seven give 128. Perhaps six were designed. The rest exist, are reachable, and render something, because as far as the tool is concerned every combination is valid; nothing warns anybody.

**Shopify ran this experiment in public, which is why the numbers can be specific.** By Polaris v11 the `Button` component had seven interacting booleans: `primary`, `destructive`, `plain`, `outline`, `monochrome`, `primarySuccess` and `connectedDisclosure`. Combinations had developed meanings no individual name described; a reader simply had to know that `primary` plus `plain` meant a particular thing.

Polaris v12 deleted all seven and replaced them with `variant` and `tone`:

| Polaris v11 | Polaris v12 |
|---|---|
| `<Button plain />` | `<Button variant="plain" />` |
| `<Button primary plain />` | `<Button variant="tertiary" />` |
| `<Button destructive />` | `<Button variant="primary" tone="critical" />` |
| `<Button primarySuccess />` | `<Button variant="primary" tone="success" />` |
| `<Button outline />` or `<Button monochrome />` | removed; becomes the default button |
| `<Button connectedDisclosure />` | removed entirely |

The same release applied the same surgery elsewhere: `Modal`'s `small`, `large` and `fullScreen` booleans collapsed into one `size` prop, `Banner`'s `status` and `Icon`'s `color` both became `tone`. That last pair is a vocabulary decision as much as a structural one: one word now means the same thing everywhere in the system. Shopify shipped a `polaris-migrator` CLI to automate most of the rewrite, which is worth noting because it signals the team expected the change to be disruptive and planned for it rather than leaving it to find-and-replace.

**Not everyone resolves toggle sprawl the same way.** John Gozde, writing for Imply's engineering blog, argues the opposite fix for the same symptom: rather than consolidating N toggles into one enum, move the varying behaviour into component composition, because after N toggle props a component is handling 2^N behaviour modes, "our component is handling 2N additional behavior modes," which makes what will render hard to predict regardless of whether the props are booleans or one enum. Composition and consolidation solve different shapes of the same problem: consolidation keeps one component with fewer, mutually exclusive knobs; composition splits the variants into different components or slots so the combinatorics never form. Both are real answers, and which fits depends on whether the variants share almost all their markup (consolidate) or diverge structurally (compose).

**To be fair to toggles**, they are not the problem in general. They read naturally, and for genuinely independent switches they are exactly right: `disabled`, `loading` and `fullWidth` combine with everything and with each other, and forcing those into a dropdown would be worse. The rule is not "avoid toggles." It is "avoid toggles that are secretly one axis pretending to be several."

**A test for review.** Take any two toggles and ask whether both can be true at once, and whether anyone designed what happens when they are. If not, they belong in one dropdown or in separate components.

**What to do.** Create a toggle only when the concept is binary and independent; consolidate into an enum when the variants share structure; compose into separate components or slots when they don't. This applies just as hard inside Figma: a Figma variant property is a dropdown and a Figma boolean property is a toggle, so a library with separate Figma toggles for Primary and Destructive has rebuilt Polaris v11's problem in the design tool, invalid combinations included.

---

## 4. How do you handle an optional icon slot?

**The short answer.** Use an affirmatively phrased toggle, `Show icon` rather than `Hide icon`, paired with an instance-swap property named after the thing it holds: `Icon`, or `Leading icon` and `Trailing icon` where there are two. As of June 2026 Figma also has a native slot type that can express this without the toggle, but it comes with real, currently open limitations that argue for keeping the older pattern on most existing libraries.

**In code, an optional icon is usually just a slot that can be left empty.** GitHub Primer's `Button` and `TextInput` both expose `leadingVisual` and `trailingVisual` props; pass nothing and nothing renders. There is no accompanying toggle, because "nothing" is a value that can be passed directly.

Figma could not express that for most of its history. An instance-swap property has to point at *something*; there is no empty. So libraries added a second property, a boolean, purely to hide the thing the first property is forced to point at. Nathan Curtis makes the point plainly in "Components as Data": the toggle exists because Figma had no way to say "null." Given the toggle is still needed today, phrase it affirmatively. `Show icon` set to true reads correctly on a scan; `Hide icon` set to false makes the reader invert twice, and nobody reads a properties panel carefully, they scan it.

**What real kits call the pair.** The Code Connect files of 23 kits contain 50 boolean and instance-swap pairs, and they show the same split as every other pairing question in this guide. [Equinor's Button](https://github.com/equinor/design-system/blob/main/packages/eds-core-react/src/components/next/Button/Button.figma.tsx) uses `Show Leading Icon` with `Leading Icon Item`; Infineon uses `Show left icon` with `Left icon`; Figma's own Simple Design System uses `Has Icon Start` with `Icon Start`; lifinance puts a glyph on the swap (`Left icon` with `↳ Left icon`); Carbon puts the mechanism in the swap's name (`Icon` with `Swap icon`). Of the 81 unique instance-swap names, plain `Icon` is the most common single name. Position words split four ways: prefix/suffix 11 names, left/right 7, leading/trailing 7, start/end 2. No vocabulary wins outright. Leading and trailing has one argument the others lack: it stays true when a right-to-left layout mirrors the component, where `Left icon` becomes a lie.

**Slots reached general availability on 10 June 2026, and they change the calculus, but not as cleanly as it might first appear.** Figma's own help centre now draws the line explicitly: an instance-swap property is for a single, guarded slot where the designer should be limited "to having, at most, one instance at a time" with no freeform layout changes allowed; a slot is for genuine freeform flexibility instead, illustrated in the same article with a modal body a designer can populate however the content requires. A single optional icon sits closer to the instance-swap case than the slot case: it wants exactly one thing, from a constrained set, not a freeform area. A slot can be shaped to behave like a guarded icon well enough (`maxChildren: 1`, `allowPreferredValuesOnly` restricted to icon components, `displayEmptyByDefault` for a persistent empty-state indicator, shown to designers as a pink outline on hover), but two things still argue against migrating a production icon slot to it. First, component properties cannot bind to layers inside a slot as of GA, so a `Show icon` boolean that also needs to shift a sibling's spacing (a common real layout, where the label shifts left when there's no icon) cannot be wired the same way once the icon lives inside a slot. Second, forum reports from after the GA date still describe nested component properties failing to cascade into slot content and slot configuration not updating correctly when an instance's variant changes, so a migration risks trading a known workaround for a fresh set of open bugs.

**On `Icon?` as a naming shorthand specifically**, it has real appeal: two characters, and understood instantly by anyone who has typed TypeScript. It also ships in one major kit. Primer's Figma library names 17 booleans this way, among them `leadingVisual?` in [TextInput](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.figma.tsx) and `counter?` in [TabNav](https://github.com/primer/react/blob/main/packages/react/src/TabNav/TabNav.figma.tsx), each one gating the swap or nested instance of the same name. Primer is the only one of the 23 kits that does it, though, and the origin of the habit still counts against it: in EightShapes' API worksheets a question mark marks an option still being argued about, and no language allows `?` in an identifier, so the Figma name can never be the code name.

**What to do.** For any component where the icon's presence needs to drive other layout, keep `Show X` (affirmative) paired with an instance-swap property named for the thing, not the mechanism: `Icon` rather than `Icon swap`, and `Leading icon` or `Trailing icon` rather than `Icon left` where position matters. The split in the kits is real, so treat leading and trailing as this guide's judgment on right-to-left grounds; MUI's code says `startIcon` and `endIcon`, which carries the same meaning. Settling the name now keeps the eventual migration a type change rather than a rename, which matters because a property rename, while it keeps every existing instance's overrides, fails the Code Connect publish until each mapping is updated and breaks any script or library swap that holds the old name. For a genuinely freeform content area, like a card body or a modal footer, use a slot now; that is squarely the case slots were built for, and the limitation about property binding rarely applies there. Slot naming has almost no evidence yet: only 3 of the 23 kits map a native slot in Code Connect (lifinance `Content slot`, MetaMask `startAccessory`, Codecademy `body`), so a name like `Content slot` follows one precedent and is worth revisiting as more kits adopt slots. Hold off migrating an existing guarded icon slot until component-property binding inside slots ships and the post-GA forum reports quiet down.

---

## 5. Where do Figma's State property and code's pseudo-classes disagree?

**The short answer.** Use a `State` dropdown for the visual states that cannot happen at once (default, hover, focus, active), and separate properties for the ones that combine with everything (`disabled`, `readOnly`, a validation status). Then write down which is which, per component, because this is the single most common source of designers and developers talking past each other.

This is the biggest structural gap between a Figma library and the code it represents, and unusually there is a systematic survey of it. Nathan Curtis audited the text-input Figma kits published by ten design systems (Material 3, Material UI, Salesforce Lightning, GitHub Primer, IBM Carbon, Atlassian, Oracle Redwood, Newskit, Shopify Polaris, and a tenth counted in the summary statistics) against each system's own code.

**What he found.** The Figma kits almost all model disabled, error, focus and hover as mutually exclusive options inside one `State` dropdown, while the code implementations expose them as independent props. Eight of the ten kits had a focus value inside their state dropdown and none offered focus as a standalone boolean. Atlassian was the sole exception, exposing `isDisabled` as a separate boolean in its Figma kit to match its code; it separated error the same way.

**Why the Figma version is defensible.** Hover, focus and error are mutually exclusive *to draw*: a static frame cannot show a button that is simultaneously hovered, focused and errored. One dropdown keeps the panel to a single control instead of several, and every option in it renders artwork a designer actually approved. Five independent booleans would produce 32 combinations with drawn artwork for maybe six of them.

**What it costs**, laid side by side:

| | In the Figma kit | In the code |
|---|---|---|
| Disabled | a value in `State` | a prop passed by the consumer |
| Hover, focus | a value in `State` | a CSS pseudo-class the browser applies |
| Error | a value in `State` | usually a prop, often with a success sibling |
| Focused **and** errored | no way to express it | routine, and unremarkable in the browser |

That last row is where the cost lands. A developer implements a combination nobody drew, and the mismatch surfaces in QA rather than in design review, which is the more expensive place to find it.

Primer shows a middle path with `validationStatus`, folding error and success into one prop rather than two competing booleans (the value `warning` existed at one point and has since been dropped, leaving `error` and `success`), which is section 3's rule applied one level down to states specifically.

**The wider Code Connect evidence agrees with Curtis on the dropdown and shows the hybrid already in use.** In 19 of the 23 kits, interaction state is a single `State` axis (Figma's Simple Design System: `Default`, `Hover`, `Disabled`; Carbon: `Enabled`, `Hover`, `Focused`, `Disabled`, `Read-only`). Many of the same kits also keep `Disabled`, `Checked`, `Selected` or `Pressed` as separate properties: lifinance has a `Disabled` variant beside its `State` axis, CMSgov a `Disabled` variant valued `Yes`/`No`, NYSDS a `Disabled` boolean. Where `Disabled` lives is the split: some kits put it in `State`, some beside it, a few in both. Most of the mismatches between Figma names and code props in variant properties come from exactly this, a `State` value mapped onto a `disabled` or `loading` prop.

**What to do.** Model states as a hybrid: a `State` dropdown for the visual lifecycle that genuinely cannot overlap, and separate properties named after the code for whatever combines, `disabled`, `readOnly`, `validationStatus`, `selected`. Then publish, per component, which `State` values map to real code props and which map to CSS pseudo-classes the browser handles on its own. That table costs about one small table per component and is the best return on effort anywhere in this guide.

---

## 6. What about capitals, defaults, and property order?

**The short answer.** Sentence case in Figma, camelCase in code, and stop arguing about matching them exactly. Use the same *words* in both, which matters far more than casing. Default toggles to off.

Figma property names are labels in a panel; code properties are identifiers in a file. Different conventions for different jobs, and that is fine. Carbon writes `Show helper` and `Helper text` in Figma while the code says `helperText`; Figma's Simple Design System writes `Has Label` and `Label` against a `label` prop. Across the 23 kits, the multi-word property names that settle a casing split almost evenly: Sentence case 216 names, Title Case 209, camelCase 121, kebab-case 81. Sentence case leads by a hair (Carbon, IBM Products, CMSgov, Firefox, Pine), Title Case is close behind (Simple Design System, Infineon, NYSDS), and the kits that write camelCase in Figma (Primer, MetaMask, Qualcomm) are the ones naming Figma properties after code props. Variant values follow the axis-name casing almost everywhere in those kits (Pajamas, below, is a documented exception): a capitalised `Size` axis carries `Small`, `Medium`, `Large`. A boolean drawn as a variant is spelled `true`/`false` in 76 axes and `True`/`False` in 51, with `Yes`/`No` (13) and `On`/`Off` (4) as outliers; the lowercase spelling clusters in kits that case everything like code. GitLab's Pajamas documents the casing rule explicitly: capitalise the first character of the property key, keep values lowercase, mark the default with `(default)` after it (`Size: sm, md (default), lg`). Pajamas adds a second rule worth carrying further: keep property names abstract enough to describe intent rather than appearance, `Color: muted, enhanced` rather than `Color: light gray, blue`, which is section 1's rule about purpose-named properties applied to variant values too.

Exact capitalisation parity stopped being worth arguing about once Code Connect made the mapping declarative. Writing `figma.boolean('Disabled')` to map onto a `disabled` prop costs one line that was going to be written anyway, and the capitalisation difference is absorbed for free.

**What no tool absorbs is vocabulary.** If the code says `variant` and `tone` while Figma says `Style` and `Colour`, no mapping file helps a designer and developer in review realise they are discussing the same thing; that conversation just fails. Matching words is the part that matters, which is why Polaris's rename of `status` on Banner and `color` on Icon both to `tone` mattered more for the vocabulary than for the structure: one word now means one thing everywhere, in both tools.

**Order is part of the design too, and part of it is not a choice.** Compound, the design system behind Element/Matrix, publishes a fixed order in its own Figma guidance: an invert toggle first, then Variant, Size, Orientation, State, then other properties, then instance swaps, then remaining booleans last. Some of that ordering is imposed rather than chosen: Figma only lets a property be reordered within its own type group (variant properties sort among themselves, booleans among themselves), so the broad grouping by type happens whether a team decides it or not.

**What to do.** Sentence case in Figma, camelCase in code, identical vocabulary, mapping handled by Code Connect. Sentence case is a narrow lead over Title Case rather than a consensus, so the stronger rule is one casing everywhere. Variant values in the same casing as their axis (`Size: Small`), and boolean variants as `True`/`False`, Figma's own default, unless the library cases everything like code. Publish the property order and note which parts of it Figma forces. An undocumented order gets relitigated at every component review; writing "these two are not negotiable, Figma decides the grouping" ends half those conversations before they start. Default toggles to off and dropdowns to the most common option, so people add rather than remove to get what they need.

---

# Part two: naming the layers

## 7. Why do layer names matter beyond the file they live in?

**The short answer.** Four separate mechanisms read the layer names inside a component. A layer named differently across a component's variants silently loses other people's overrides when they switch variants, and one recent Figma change made more of those names visible to more people than before.

**Layer names inside components are part of the contract, not documentation.**

| What reads the name | What it uses it for | What a rename does |
|---|---|---|
| Figma's text auto-rename | keeps a text layer's name matching its content | the name moves every time the content changes |
| Override preservation | matches layers to carry text overrides through a swap | overrides can be silently dropped |
| Code Connect | some helpers, like `@FigmaChildren`, take a literal layer name | the mapping stops matching |
| Dev Mode and AI code generation | the layer name is often the only semantic label available | worse generated code |

That last row has grown teeth. Figma's own guidance on making a design system legible to its AI tooling is blunt: "Group 7 or Rectangle 3 give the agent nothing to work with," while a component named `Card/Product/Default` or a layer named `HeroImage` or `PriceLabel` is immediately interpretable. Layer naming used to be a courtesy to the next designer; it is now an input to a code generator, and Config 2026's "code layers" feature (turning any design layer into an editable code layer with a click, rolling out from July 2026) raises the stakes further, since it depends on the same semantic reading of the canvas.

**One recent Figma change made this apply to more layers than it used to.** Simplified instances, which let a component hide internal layers from people using it, were deprecated from 23 March 2026. All component properties now show by default, and layers that used to be private to the component's author appear in everyone's Layers panel. Names written for the author's own convenience are now part of the public surface of the library.

**What to do.** Treat property and layer names as versioned interfaces, and audit *before* renaming rather than after: search Code Connect files for the old name, and check whether instances carry overrides that depend on it. Getting the property wrong gives a build error, which is loud and gets noticed. Getting a layer name inconsistent across variants gives silent data loss in someone else's file the next time they switch variant, which does not.

---

## 8. Which layers actually deserve naming care?

**The short answer.** Three kinds: layers Code Connect names directly, layers that carry overrides, and layers a consumer will actually see. Everything else needs a name that isn't embarrassing and no more thought than that.

The honest answer to "how should every layer be named" is that most of them do not matter much, and pretending otherwise makes the advice unusable. A component can easily carry forty layers; perhaps eight of them are load-bearing. Knowing which is the useful skill, not memorising a rule for all forty.

| Kind of layer | Does the name matter? | Why |
|---|---|---|
| Named in a Code Connect mapping | Critically; exact and stable | It is a literal string in the repository |
| Bound to a component property | A lot | It is what a consumer sees in the properties panel |
| Text layers | A lot | Overrides match on them, and auto-rename moves them |
| Nested instances | A lot | Overrides match on them, and `figma.children()` finds them by name |
| Structural frames a consumer will see | Somewhat; readable and stable | Visible to everyone since simplified instances were deprecated |
| Icons and swappable images | Somewhat; consistent leading word | Wildcard matching and codegen both read them |
| Background shapes, dividers, decoration | Barely | Nothing reads them, nothing overrides them |
| Helper and spacer layers | Somewhat, but mark them | They mislead a developer who assumes they correspond to something real |

The practical consequence is a triage that can be done quickly. Before agonising over a layer name, ask whether anything reads it. If the answer is no, give it a plain descriptive name and move on: `Divider` is fine, `Card background` is fine, no team convention is needed for them, and inventing one is how a naming guideline ends up ignored entirely rather than followed where it counts.

**What to do.** Name the load-bearing layers deliberately and everything else descriptively. Write the triage into the contribution guide rather than a rule for every layer type; a rule that covers everything gets ignored, a rule that covers eight layers per component gets followed.

---

## 9. Why does a text layer keep renaming itself?

**The short answer.** Figma text layers rename themselves to match their content until renamed manually once. Inside a published component that is a slow leak, so rename every text layer once, deliberately, even to the word it already displays.

The mechanism is simple and rarely explained. Every text layer's `name` has a setting called `autoRename`, documented in the Plugin API, that is on by default; while it's on, the layer's name tracks whatever text is inside it. Setting the name manually turns the setting off and the name stops moving.

So a text layer displaying `Jan 14, 2026` is a layer *named* `Jan 14, 2026`: not unnamed, not neutral, and a name that changes on every content edit, which is exactly what override matching and Code Connect cannot cope with.

**The default is right for ordinary work.** While sketching, having the layers panel echo the design is genuinely convenient, and finding a layer by remembering what it said is faster than remembering an abstraction. Figma made it the default and that default is correct for a working file.

**Inside a published component it stops being convenient.** Every content edit becomes a rename, and every rename is a chance to break an override or a Code Connect mapping, with nothing to flag when it happens. Figma's own component-management guidance arrives at the same place from the other direction: keeping text overrides through a swap requires matching text layer names across the variants involved, and by default the name is whatever someone first typed into the layer.

**Real Code Connect files show the cost.** Where a kit never renamed a text layer, its mapping has to target the default content as if it were a name: Carbon's files look up text layers called `Choose a time` and `hh:mm`, Coveo's `Awesome chip` and `0`, and IBM Products' one layer named after a full paragraph of marketing copy. Each of those mappings breaks the day someone edits the sample text in the main component.

**What to do.** Rename every text layer inside a published component once, on purpose, even to the exact word it already displays. That single act converts the name from a mirror of content into a stable identifier. Leave the setting alone everywhere else; this is a rule about published library components, not working files.

---

## 10. What should you call the text layer?

**The short answer.** Name it after the property that drives it, where one property drives one layer. Otherwise name it after its role: `Label`, `Title`, `Timestamp`. Keep curly braces out of layer names; they earn their place elsewhere, in section 11.

Three approaches circulate, and the popular one turns out to have the weakest evidence behind it.

| Approach | Example | Strongest argument | Where it loses |
|---|---|---|---|
| Curly braces | `{{date}}` | Unmistakably a placeholder | No published system uses this for *layer* names, and braces block the trailing wildcard (section 16) |
| Role name | `Supporting text` | Stable across variants, matches Figma's own naming guidance | Says nothing about editability on its own |
| Mirror the property | property `Label`, layer `Label` | Layers panel and properties panel stop disagreeing | Breaks when one property drives several layers |

**On braces.** They read unmistakably as a placeholder, survive auto-rename because typing one counts as a manual rename, and any developer who has used a templating language recognises them instantly. The evidence for using them as *layer* names is much thinner than the popularity suggests, though: the `{{ }}` convention is real, but it comes from Figma content-authoring tooling, where plugins insert placeholders into text *content*, a syntax for what a layer displays rather than for what it's called. No published design system in this research documents brace-wrapped layer names.

**On role names**, they match Figma's own naming guidance, stay stable across variants (which is exactly what Code Connect needs from a mapping key), and read identically to a designer, a developer and a code generator, so nobody has to translate. What they don't do is signal editability, which section 13 handles with a purpose-built marker instead.

**On mirroring**, it's the role-name approach with one extra constraint: someone reading either panel can find the other without opening the component. It breaks in two common situations: one property driving several layers, which then need telling apart, and a property sitting on a frame rather than a text layer, which is the normal case for a visibility toggle.

**What the kits do.** The text layers that 23 kits name in their Code Connect files are mostly bare role nouns: `Label`, `Title`, `Text`, `Description`, `Heading`, `Caption`. Where a kit has both a text layer and a text property for the same element, the layer usually carries the bare noun even when the property carries a suffix or a glyph (`Label` layer under a `Label text` or `↳ Label` property). A layer with a suffix, such as a text layer called `Number text`, is the outlier, and fixing it means renaming it to `Number` in every variant at once.

**What to do.** Mirror the property where one drives one layer, fall back to the role name where it doesn't, and keep braces out of layer names. Either way the layer name is a bare noun. The reason is section 16's rule: the layer name ends up as a literal match key, both for a Code Connect mapping and for override preservation, and both want a stable identifier rather than a description of the data inside.

---

## 11. What should the default text actually say?

**The short answer.** Realistic copy for words a person writes, like `Save changes`. Curly-brace placeholders for values a machine supplies, like `{{date}}`. Never lorem ipsum inside a published component. Keep the longest-plausible test string somewhere else on the page.

This is a separate decision from the layer name, and it travels further than any other choice in this guide: the default shows up in every new instance, in the assets panel, in documentation screenshots, in Dev Mode, and in any code snippet a generator produces before a designer overrides it.

Two questions decide it, and almost nothing satisfies both:

| Option | Example | Is a forgotten default obvious? | Stresses the layout? | Reads well in docs and handoff? |
|---|---|---|---|---|
| The property name | `Label` | Yes | No, always short | No; looks like a wireframe |
| Brace placeholder | `{{date}}` | Yes, unmistakably | No | Honest about being dynamic |
| Realistic value | `Save changes` | No | Partly | Yes |
| Lorem ipsum | `Lorem ipsum dolor` | Partly | Yes, at length | No, and it misleads reviewers |
| Realistic, plus a separate torture string | `Save changes` | No | Yes, where it matters | Yes |

**Realistic copy wins for words a human writes**, and this is the one claim in the guide with published research behind it. Nielsen Norman Group's position, across both a study on prototype copy and a separate one on form-field placeholders, is that placeholder text hides usability problems and defers layout failures until after sign-off, partly because placeholder text tends to run shorter than real content, so the container gets designed against a fiction. That's commercial rather than academic research, so weigh it accordingly, but the mechanism is not disputed: a component whose default reads `Label` has never been tested against anything it will actually hold, and the first time anyone sees real copy in it is after the design has already shipped. A realistic default also teaches the product's voice and typical length in the same gesture, work the documentation would otherwise have to do separately.

**Braces win for values a machine supplies**, and the argument is specifically about handoff:

| Default value | What the generated snippet says | What happens next |
|---|---|---|
| `{{date}}` | `label="{{date}}"` | Visibly wrong; never committed by accident |
| `14 Jan 2026` | `label="14 Jan 2026"` | Looks plausible; gets committed as a hardcoded string |

Code Connect passes a component's default value straight through into generated code, so a conspicuously fake default for dynamic content is a safety feature, not a style preference.

**Lorem ipsum has exactly one real advantage**, worth granting: it's the only option that reaches a realistic *length* for free, catching wrapping and truncation early. Everything else argues against it. Nobody can read it, so stakeholders can't comment on the content it stands in for; it's Latin, so it exercises neither the characters nor the typical word lengths of any language actually shipped; and it's familiar enough that reviewers stop seeing it at all.

**Handle length separately from wording.** German text runs roughly 20 to 35 percent longer than the English it's translated from (vendor-reported figures; treat as a rule of thumb, not a measurement), Finnish compounds are worse, CJK text is shorter but taller. Asking the default to carry both realistic wording and stress-testing at once forces a choice between a default that reads well and one that breaks things; kept apart, a component can have both.

**What to do**, split by content type, because the evidence genuinely splits by type. Realistic copy in the product's own voice for words a person writes. Brace placeholders for dates, counts, names and anything else a machine supplies. The role word for genuinely generic structural components with no realistic value to offer. Never lorem ipsum inside a published component. Keep a documented longest-plausible example on the component's own page rather than as its default value, and where the string differs by language, bind a string variable and let a mode carry the long-string case.

---

## 12. How do you name frames, icons, images and decoration?

**The short answer.** Name a layer after the job it does, not what it looks like. Use frames rather than groups, always, inside a component. Give swappable things a consistent leading word. Decoration barely needs a thought beyond not leaving it at its default name.

Text layers get most of the attention because auto-rename makes them actively dangerous. The rest of the tree still needs naming, with less published guidance to lean on, so here is the whole tree in one place.

**Frames and containers.** Name them after their job in the component: `Container`, `Content`, `Actions`, `Media`, `Header`. Any consistent vocabulary works; what matters is that the names stay identical across every variant in a set, because both override matching and Code Connect's nested-property helpers walk the structure by name. There's also a structural point hiding here that isn't really about naming: every wrapper frame added is another level `figma.children()` cannot see past, since that helper resolves direct children only. One fewer wrapper than feels natural, and give the ones that remain real names.

**Frames, not groups, inside components.** This isn't a naming point but belongs here because it's the most common structural mistake in a layer tree. Groups have no layout intelligence: auto layout does not apply to them, they cannot clip content, and Figma's own best-practices documentation states plainly that "constraints applied to elements will always be relative to the closest parent frame," never to a group's bounds. A group inside a component looks like structure and provides none.

**Icons and other swappable instances** should share a leading word. The reason is mechanical: Code Connect's `figma.children()` wildcard only matches at the end of a name, so `figma.children('Icon*')` finds every layer starting with `Icon`, and that shortcut only exists where the team was consistent about it. Compound's own Figma guidance hedges by publishing `Icon Prefix/Left` and `Icon Suffix/Right`, carrying both the code word and the visual position in one name; it's inelegant and costs nothing, and it ends an argument that would otherwise resurface at every review. A positional name like `Leading icon` gives up the shared leading word, so `Icon*` no longer finds it; that matters little where the icon is bound to an instance-swap property, because the mapping then goes through the property name (section 14), and the kits that do use wildcards mostly put them after a component name (`Col*`, `TabItem*`, `Item*`) rather than an icon.

**Images and media** should say what they're for, not what they contain. `HeroImage` is Figma's own example of a name that helps codegen; `Rectangle 12` with an image fill is the same pixels and useless to everyone downstream. A swappable image gets the same consistent leading word as an icon.

**Decoration**, meaning dividers, background shapes, gradient overlays and the like, needs a plain descriptive name and nothing more: `Divider`, `Card background`, `Overlay`. Nothing reads these (section 8). The failure mode here isn't a bad name, it's a default one: `Rectangle 12`, `Frame 427`, `Ellipse 3`, the exact names that make a layer tree unreadable and give a code generator nothing.

**Helper and spacer layers** are worth marking, because they're the ones that mislead. A developer reading the tree assumes a layer corresponds to something; a spacer frame doesn't. Marking these with a leading `*` or `:` is the same convention section 13 recommends for Figma-only properties, and for the same reason: the exceptions are few, so the marks stay few, and each one saves a search for something that doesn't exist.

**Two traps with slash notation.** Figma recommends slashes for organising *components*, as in `Button/Primary/Large`, because a slash there creates real folder hierarchy in the assets panel. Inside a component, a slash in a *layer* name creates no hierarchy at all, just a character; Compound's `Icon Prefix/Left` uses it purely as a readable separator, and that's fine as long as no one expects it to organise anything. The second trap is that a slash in a layer name has to be typed exactly into any Code Connect mapping that matches it, one more character that must never move.

**What to do.** Name by job, never appearance. Frames over groups, without exception, inside components. A consistent first word on anything swappable. Plain descriptive names on decoration, and never a default name. Mark helper layers with a leading `*`. What connects every layer worth being fussy about is that it's a wildcard prefix, a match key, or something a consumer or a code generator actually reads; the background rectangle is none of those.

---

## 13. How do you show what is editable?

**The short answer.** Let the structure show it; Figma already displays which properties are editable, so a pencil emoji in a layer name duplicates something the tool renders on its own, and duplicates drift out of sync.

The instinct to write `✏️ Label` is a good instinct badly aimed. The goal is for a consumer to see at a glance what they can change, and Figma already tells them: a layer bound to a text property shows that binding in the right sidebar, and an instance's properties panel lists exactly what's editable. The emoji restates a fact the interface already displays, which would be merely redundant except the two can disagree: delete the property and the pencil stays, because nothing checks it, leaving a label that's wrong and still looks authoritative, which is worse than no label at all.

**Emoji are genuinely good for something else**, and the distinction is instructive. Accor's Welcome design system uses emoji heavily, but for classifying *components and pages*, not individual layers: markers for core components, deprecated ones, local helpers, placed before any other part of the name and carried down to the file level too. That works because component-level classification is stable, has nowhere else to live in the interface, and needs scanning across hundreds of assets at once, deprecation especially, since the assets panel has no other place to record that fact.

**The pattern has a real, documented cost, though, which argues for using it narrowly.** Alice Packard, writing about status emoji in page names specifically, makes three points against the wider habit: Figma isn't a task-management tool, so the emoji duplicates status a team is probably also tracking in Jira or Asana, risking the two disagreeing; and changing a page's status emoji marks every component on that page as needing republication, even components nobody touched, which pollutes a library's changelog with noise. Her fix isn't to drop emoji entirely, it's sequencing: update the status marker as the last step of publishing, after the real edits, not before, and organise pages by something other than status where status emoji become impractical to maintain at all. Accor's own documentation is honest about a related cost: a legend that has to be documented, casing rules per platform, and naming prefixes for hidden building blocks, real ongoing upkeep taken on deliberately by a team that wanted automated compliance scanning out of the result.

**Glyphs in property names do ship, but mostly for a different job.** Of 359 unique text-property names in the 23 kits' Code Connect files, 61 (17%) carry a glyph, and it is the main style in 5 kits (NYSDS, Synergy, Codecademy, Wanted Montage, Channel Bezier). Nearly all of those use `↳` to tie a text property to the boolean above it, as in [lifinance's Alert](https://github.com/lifinance/design-system/blob/main/registry/core/ui/alert.figma.tsx), where `↳ Title` sits under a `Title` boolean: a statement about nesting in the panel, not about editability. The pencil itself appears in one kit: [Codecademy](https://github.com/Codecademy/gamut/blob/main/packages/code-connect/Molecules/Menu/MenuItemFixed.figma.tsx) writes `✏️ label`, `✏️ overline` and `✏️ tooltip` on properties and text layers alike. In the other 18 kits a glyph is occasional at most (lifinance's six `↳` names are the most), which leaves the editable-marker habit a one-kit practice with no mechanism behind it.

**One thing is worth marking on individual layers, and it's the exception.** Jake Albaugh, writing on Figma's own blog, suggests a prefix like `*` or `:` for a Figma property that has no code equivalent at all. Two sources, one of them Figma itself, land on marking the exception rather than the rule.

**What to do.** Let structure carry editability, never a badge, because structure is the same fact the panel already renders and therefore cannot drift out of sync with it. Mark only exceptions: `*` or `:` on Figma-only helper properties and layers, `_` or `.` on components not meant for publishing (131 of the 482 layer and nested-instance names the 23 kits reference carry one of the two: `_` in Primer, Carbon, Infineon, Qualcomm and Synergy, `.` in lifinance, Coveo, Lumen, CMSgov and Codecademy). If a library wants to show that a text property belongs to a boolean, a `Show` prefix on the boolean (section 18) does it without a glyph. Keep emoji for classifying components and pages, especially deprecation, where they're the best tool on offer; update a status emoji last, after the real edit, to avoid triggering republication noise for work that didn't change.

---

## 14. What do you call an instance nested inside a component?

**The short answer.** Keep the name it arrives with, which is its component's name: `Button`, `Avatar`, `_Menu list item`. Rename only to tell repeated instances apart, by role (`Primary`, `Secondary`, `Leading icon`) or by number (`Item 1`, `Item 2`), and never bake a variant value into the name.

**First, why the defaults are a mess.** Placing an instance names the layer after its main component; if that component belongs to a set, the name comes from the set, which is why an instance of a variant usually arrives called `_Menu item` rather than `_Menu item / Default`. Not always, though: layers named `Property=Value, Property=Value` are a common complaint on Figma's forums, especially after bulk-rename plugins run. Figma provides a fix (select the instance, open instance options, choose Reset name), documented in its help centre alongside the rest of the instance-management controls.

Renaming an instance layer is itself an override, so it can be lost the same way any other override can. Figma's documentation on swapping components confirms text overrides specifically are preserved via unique layer names and that overrides on other properties are not carried forward automatically on a swap; a hand-typed instance name is durable in practice but not guaranteed, which argues for names short enough that retyping is cheap if one is lost.

GitLab's Pajamas publishes a naming convention here, a slash hierarchy across page, frame and layer with an optional breakpoint and size vocabulary. It also records something more valuable than the convention itself: components nested inside other components preserve overrides less reliably than components nested at the top level, which is the stated reason Pajamas advises against base components nested more than one level deep, and it's worth carrying into any library's own structure decisions.

**Three options:**

| Option | Example | What Code Connect sees | What a consumer reads |
|---|---|---|---|
| Full component path | `_Menu item / Default` | `/ Default` becomes false the moment the variant changes | Noisy and misleading |
| Component name kept | `_Menu item` | `figma.children('_Menu item')`, the same string in every parent that uses it | Clear; names the component to look up |
| Role in the parent | `Item` | `figma.children('Item')`, short, but a different name in each parent | Describes the job, hides which component it is |

**The case for keeping the component name, and what kits do.** The name an instance arrives with costs nothing to keep, needs no override to hold it, and means the layer tree and the component list share vocabulary, so one search finds both. The underscore on a private part tells a reader this came from an internal component they won't find in the assets panel, which is real information in a library with many private base components. The Code Connect files of 23 kits show this is what most teams do: nested-instance layers usually keep the component name (`Button`, `Avatar`, `Menu`, `Text input`), private prefix included. [Carbon's Menu](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Menu/Menu.figma.tsx) maps its items with `figma.children(['_Menu list item'])`; Infineon does the same with `_Dropdown Menu Item` and Qualcomm with `_Breadcrumb item`.

**Role names are the minority, and they cluster where instances repeat.** Primer names a nested button `trigger` and two actions `Primary` and `Secondary`; Carbon uses `Menu trigger` and `Actions footer`; Infineon tells trailing parts apart as `_1st Trailing` and `_2nd Trailing`. The other way kits tell repeats apart is numbering: [NYSDS's Checkbox](https://github.com/ITS-HCD/nysds/blob/main/packages/nys-checkbox/src/nys-checkbox.figma.ts) maps `Option 1` through `Option 10`. Kits that need every repeat at once skip names altogether and use a trailing wildcard on the component name (`TabItem*`, `Col*`). A role name earns its rename where two instances of one component do different jobs in the same parent; a single instance renamed `Item` gains a short name and loses the pointer to its component, and the rename is an override that a swap can drop.

**Why the variant path is worst.** A layer named `_Menu item / Default` on an instance whose current variant is `Selected` states something false, and section 16's rule is that layer names must be identical across variants for a layer-based mapping to work at all. Any name carrying a variant value fails by construction.

**One exception changes the stakes.** If the nested instance is bound to an instance-swap property, its layer name matters much less, because Code Connect reaches it through the property name instead. An unbound nested instance is the opposite case: the layer name is the only route in, so it *is* the entire contract.

**What to do.** Keep the component name on inserted instances, prefix included, and strip only a variant value if one appears (Reset name restores the plain component name). Rename only where the same component repeats inside one parent: by role where the repeats do different jobs (`Primary`, `Secondary`), by number where they are a list (`Item 1`, `Item 2`). This follows the majority of the kits; the role-name-everywhere habit is a minority one, and it multiplies hand-typed overrides. Keep the structure shallow, because deep nesting costs override durability per Pajamas's own finding, and puts an instance out of reach of `figma.children()` entirely.

---

# Part three: how the two fit together

## 15. What actually connects a property to a layer?

**The short answer.** An invisible generated key, not the names. Nothing forces a property name and its layer name to match, and nothing warns when they drift apart.

Creating a text, boolean or instance-swap property makes Figma generate a unique key by appending a suffix like `#4:0` to the name (`label` becomes `label#4:0`, `ButtonText` becomes `ButtonText#0:1`), documented in the Plugin API's `componentPropertyDefinitions` reference; the layer is bound to that key, and the display names on either side are never compared. Variant properties are the one exception: they don't receive this suffix at all.

Two things follow. Duplicate display names on different properties inside one component are legal, because the suffix keeps them apart internally. And that suffix should never be guessed or reconstructed in a plugin or script. Figma's own guidance for building against its MCP server states the gotcha directly about the function that creates a property: "the return value IS the key string, use it directly," never something to derive or hardcode afterward.

For a maintainer the useful reading is that **the layer name and the property name are independent by design.** They can diverge freely and nothing will flag it.

**What to do.** In any plugin or script, capture the key a creation call returns and use it as-is. In the library itself, decide once whether the two names should mirror each other and write the decision down, because the tool will never enforce it, and an unwritten convention decays into a per-author habit within about two contributors.

---

## 16. Which names can be renamed safely after adoption?

**The short answer.** A Figma *layer* name is the most dangerous of the three to get wrong, but not because renaming it loses work. On a library update, overrides follow each layer's identity, not its name, so a consistent rename keeps them. The silent loss comes from a layer named differently across variants: a consumer who switches variant loses the override, and nothing reports it.

The usual shorthand, that code renames are breaking and Figma renames are not, has it backwards in one important respect:

| What gets renamed | What breaks | How the break is discovered |
|---|---|---|
| A code property | Every consumer of the package | A build error; codemods are the standard remedy |
| A Figma property name | Code Connect mappings, which hold the name as literal text | A failed publish; but a renamed variant *value* publishes cleanly and leaves an enum mapping silently wrong, because the CLI does not check enum mapping keys |
| A Figma layer name | `figma.children` mappings, and override matching on variant switch and swap | The mapping fails at publish; a layer named differently across variants is not discovered until a consumer switches variant and their content is gone |

**Three mechanical rules follow from that table.**

Layer names must be identical across every variant in a set, or a layer-based mapping matches some variants and silently fails on others, producing something that works in review and breaks for exactly one state in production. This happens constantly, because variants get built by duplication and someone renames the duplicate for local clarity without checking the set as a whole.

The wildcard only matches at the end of a name: `figma.children('Icon*')` matches names *beginning* with `Icon`, so anything placed at the front of a name has to be typed into every match string forever, which is the concrete reason braces and emoji don't belong at the start of a layer name.

And `figma.children()` only reaches direct children; an instance sitting inside an intermediate frame can't be found by it, tracked as an open issue against Figma's Code Connect repository. That points the same direction as Pajamas's override finding in section 14: fewer wrapper frames.

**What to do.** Treat layer names as the stricter contract and design for the wildcard from the start: consistent leading words, identical names across every variant, one fewer wrapper frame than feels natural. Where a nested instance can be bound to an instance-swap property, bind it; that moves the reference off the fragile layer-name contract onto the stable property-name one, the single most useful structural move in this section.

---

## 17. Should Figma names match code names?

**The short answer.** Match the *words* above all else. Match stability second. Don't bother matching capitalisation.

The answer changed when Code Connect arrived, and both eras are worth understanding because plenty of teams are still living in the first one.

**Without Code Connect**, the property list and the layer names are the entire vocabulary of the handoff. Dev Mode shows a layer's name and type at the top of its inspect panel, and third-party generators frequently build class names straight out of layer names. Here, matching Figma names to code words is the single highest-leverage move available, because a developer is translating by hand and every mismatch is a decision made alone, without the designer in the room.

**With Code Connect**, the mapping absorbs mismatches by design; Figma's own documentation says plainly that design and code properties rarely correspond one to one. Exact parity becomes a readability nicety rather than a requirement.

**How close real kits get.** Of 1,243 properties in the 23 kits' Code Connect files that can be compared with the code prop they feed, 703 (57%) have the same name once case and spaces are ignored (`Label` feeding `label`), 85 share the noun but differ in a prefix or suffix (`Show helper` feeding `helperText`), and 342 use a different word. Text properties match exactly in 147 of 282 cases, booleans in 332 of 595. Kits that write Figma names as code props match most: Primer 60 of 67. The largest single source of mismatch is the `State` axis from section 5, whose values feed `disabled` or `loading` props. So even with Code Connect absorbing the difference, just over half the time the two sides already use one word.

What becomes mandatory instead is stability, for the reasons laid out in section 16.

**What to do.** Prioritise vocabulary first, stability second, capitalisation last. In practice that means taking the code prop's word for the Figma property wherever the code has one (`Label`, `Placeholder`, `Helper text` for MUI's `helperText`), and adding a Figma-only word only where the code has none. The ordering isn't arbitrary: each is enforced by something different. Vocabulary is enforced by nothing except people understanding each other, so it needs the most deliberate effort. Stability is enforced by pain that arrives later, usually in someone else's file. Capitalisation is enforced by a mapping file a team already has to maintain, so it needs none.

---

## 18. Should the layer name match the property name?

**The short answer.** Yes, where one property drives one layer, and both take the bare noun the code uses: property `Label`, layer `Label`. Where a boolean shows or hides that text, the boolean takes the verb, not the text property the suffix: `Show label` with `Label`.

The suffix exists to solve one problem. A component with a visibility toggle and a text property for the same label needs two names, and Figma allows duplicate display names (section 15), so a library could end up with two properties both called `Label`. Something has to tell them apart, and the question is which side carries the mark.

The Code Connect files of 23 kits answer it with a count. They contain 108 boolean and text pairs for the same element, spread over 17 kits; giving both the same bare noun is rare and usually means the text sits on a nested instance (Coveo Plasma). The kits divide into five shapes, each used by four or five of them:

| Shape | Kits | Example |
|---|---|---|
| `Has X` boolean, bare text | 5 | [Simple Design System](https://github.com/figma/sds/blob/main/src/figma/primitives/InputField.figma.ts): `Has Label` with `Label` |
| `Show X` boolean, bare text | 5 | [Firefox](https://github.com/mozilla-firefox/firefox/blob/main/toolkit/content/widgets/moz-message-bar/moz-message-bar.figma.ts): `Show heading` with `Heading` |
| bare boolean, `X text` | 5 | Carbon: `Label` with `Label text`; IBM Products: `Eyebrow` with `Eyebrow text` |
| bare boolean, glyph text | 5 | lifinance: `Title` with `↳ Title` |
| `Show X` boolean, `X text` | 4 | [Carbon](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ComboBox/ComboBox.figma.ts): `Show helper` with `Helper text` |

So the pairing itself is split, and any of those shapes is defensible. What breaks the tie is the text properties that have no toggle at all, which are most of them. Of 359 unique text-property names, 181 (50%) are a bare noun, the main style in 14 kits; 106 (30%) end in `text`, the main style in only 4 (Carbon, IBM Products, Infineon, Qualcomm). The kits that suffix do it on nearly every text property, toggle or not (Carbon 32 of 46, IBM Products 18 of 23), so the suffix stops distinguishing anything and becomes a word every text property carries. Putting the mark on the boolean instead leaves the text property as the code prop's own word, and of the verb prefixes `Show` is the most common (117 boolean names against 32 for `Has`) and the one that reads as an instruction.

| | Property | Layer | Default value |
|---|---|---|---|
| Plain text | `Label` | `Label` | `Save changes` |
| With a visibility toggle | `Label` plus `Show label` | `Label` | `Save changes` |
| Where the code prop has the word | `Helper text` (MUI `helperText`) | `Helper text` | a realistic sentence |

**The case for suffixing everywhere** isn't unreasonable: it pairs cleanly with a bare toggle called `Label` without the names colliding, and it makes every text property findable by searching one word, which matters in a library with hundreds of components. Carbon, IBM Products, Infineon and Qualcomm all ship it. It loses on two counts: it is the minority shape, and it puts a Figma-only word on the property that most needs to match code.

**What to do.** Bare noun on both the text property and the layer, matching the code prop where there is one; keep `text` only where the code prop has it (`Helper text` for `helperText`). Give the boolean a `Show` prefix when it shows or hides an element that has its own text, swap or slot property, and leave other booleans bare (`Divider`, `Badge`). The pairing evidence is genuinely split five ways, so this is judgment on the tie, decided by the text-property majority and by code parity. Worth saying plainly: every consistent scheme in the table above works. What isn't fine is switching halfway through a library, or the shape kits avoid on one component, a bare boolean and a bare text property sharing a noun.

---

## 19. The cheat sheet

| What it is | Layer name | Default value | Property name | Property type |
|---|---|---|---|---|
| Editable text | `Label` | `Save changes` | `Label` | Text |
| Whether that text shows | `Label` | n/a | `Show label` | Boolean |
| A second editable text | `Description` | a realistic sentence | `Description` | Text |
| Text whose code prop says "text" | `Helper text` | a realistic sentence | `Helper text` | Text |
| Fixed text, part of the component | `Currency symbol` | the literal value | none | none |
| Machine-supplied value | `Progress value` | `{{percent}}` | none; bind a variable | none |
| Date, count or name | `Timestamp` | `{{date}}` | none, or Text if editable | Text |
| Single icon (guarded) | `Icon` | n/a | `Icon` | Instance swap |
| Leading and trailing icons | `Leading icon`, `Trailing icon` | n/a | `Leading icon`, `Trailing icon` | Instance swap |
| Whether the icon shows | the icon's layer | n/a | `Show icon`, `Show leading icon` | Boolean |
| Freeform content area | `Content` | n/a | `Content slot` (thin evidence) | Slot |
| Structural frame | `Container`, `Actions`, `Media` | n/a | n/a | n/a |
| Single-child wrapper | `Wrapper` | n/a | n/a | n/a |
| Image | `HeroImage`, `Avatar image` | n/a | none, or Instance swap | n/a |
| Decoration | `Divider`, `Card background` | n/a | none | n/a |
| Spacer or helper layer | `*Spacer` | n/a | n/a | n/a |
| Nested instance, unbound | the component name, `_Menu item` | n/a | n/a | n/a |
| Repeated nested instances | `Primary`, `Secondary`; `Item 1`, `Item 2` | n/a | n/a | n/a |
| Nested instance, swappable | the component name | n/a | the thing it holds, `Avatar` | Instance swap |
| A switch with nothing else on the noun | n/a | n/a | `Divider`, `Badge` | Boolean |
| Identity axis | n/a | n/a | `Variant` | Variant |
| Size axis | n/a | n/a | `Size`: `Small`, `Medium`, `Large` | Variant |
| Visual states that cannot overlap | n/a | n/a | `State` | Variant |
| States that combine with everything | n/a | n/a | `Disabled`, `Read only` (`True`/`False` as a variant) | Boolean or Variant |
| Figma-only helper property | n/a | n/a | `*Spacing helper` | any |
| Component not published | `.base-card` on the component | n/a | n/a | n/a |

Put this in the contribution guide and amend it there rather than re-deriving it per component. The cost of these decisions isn't making them once; it's making them differently on component forty.

---

## 20. The short version

**Properties.** Match the codebase on `isDisabled` versus `disabled` and never mix. Toggle only when binary *and* independent, otherwise a dropdown or, where the variants diverge structurally, separate components. Phrase visibility toggles affirmatively. Name text properties with the bare noun the code uses (`Label`, not `Label text`), and when a boolean shows or hides an element that has its own property, give the boolean the verb: `Show label` with `Label`. Leave other booleans bare. Split states into a `State` dropdown for what cannot overlap plus separate properties for what combines. Sentence case in Figma, camelCase in code, same words in both; across 23 kits' Code Connect files the Figma name already equals the code prop 57% of the time.

**Layers.** Only about eight layers per component actually matter: the ones Code Connect names, the ones carrying overrides, and the ones a consumer sees. Rename every text layer once so it stops renaming itself. Name text layers after their property, or their role, always as a bare noun. Let nested instances keep their component name, and rename only to tell repeats apart. Name frames after their job, and use frames rather than groups. Give swappable things a consistent leading word. Give decoration a plain name and stop thinking about it. Never leave `Rectangle 12`.

**Default text.** Realistic copy for words a person writes, `{{braces}}` for values a machine supplies, never lorem ipsum, torture strings kept separately.

**Optional icons.** An instance-swap property named for the thing (`Icon`, or `Leading icon` and `Trailing icon`) plus an affirmative `Show icon` toggle still fits a guarded single icon better than a slot does, because component properties can't yet bind to layers inside a slot; save slots for genuinely freeform content areas.

**Renaming later.** A layer name that differs across variants is the dangerous case, because it silently drops overrides when a consumer switches variant, with no error to catch it; a rename applied identically to every variant keeps them. Search Code Connect files first, and treat any rename in a published library as a release with a deprecation path, the same discipline a breaking code change would get.

**If something looks wrong, this is usually why.** Layer names reading like sentences of content mean auto-rename is still on. The same layer named differently across variants means it was built by duplication. Instance layers called `Property=Value` want Reset name, which restores the component name. Two toggles that can't both be true are a dropdown in disguise. A `State` value nobody can find in the code is a CSS pseudo-class; label it as one. A toggle defaulting to on is phrased negatively. Copy overflowing only after launch means the default never exercised length. Overrides lost on a library update usually mean the main component changed which component or variant a nested instance points at, which gives the nested layers new identities. Groups inside a component mean constraints aren't doing what someone thinks they are.

---

## 21. What to re-check later

- **Slots** reached general availability on 10 June 2026, not beta as an earlier pass of this research had it. Real limitations remain open at GA: component properties cannot bind to layers inside a slot, and forum reports after the GA date still describe nested properties failing to cascade and slot configuration not tracking variant changes correctly. Re-check both before migrating a guarded icon slot.
- **Simplified instances** were deprecated from 23 March 2026, which is why sections 7 and 14 are stricter about layer visibility than they would have been a year earlier.
- **Code layers**, announced at Config 2026, begin rolling out from July 2026: turning a design layer into an editable code layer with a click, which depends on the same semantic layer-naming this guide argues for. Too new to say yet how much it changes the AI-codegen argument in section 7 beyond reinforcing it.
- **AI codegen** generally is the fastest-moving part of this guide. Figma's own guidance on making a design system legible to agents is recent, and how much layer names and default values actually influence generated code quality is not yet measured anywhere found in this research.
- **Shopify retired the polaris-react.shopify.com documentation site** in favour of shopify.dev's Polaris Web Components docs; both old domains now redirect to a landing page with none of the v11-to-v12 migration detail. The sources below cite the underlying repository file directly, which is more stable than a documentation site under active restructuring.
- **Code Connect**'s `figma.children()` direct-children-only limitation is tracked as an open issue and may be fixed; recheck before relying on the fewer-wrapper-frames workaround indefinitely.
- **Chakra UI** v3 is current; v2 props like `isDisabled` still circulate in older tutorials and Stack Overflow answers.
- **Atlassian** removed `primaryColor` and `secondaryColor` from its Icon component on 22 December 2025, in favour of a single `color` prop taking design-token values.
- **Unlikely to move:** auto-rename on text layers, overrides stored against layer identity with name matching only on variant switch and swap, and the `.`/`_` publishing prefixes.
- **Layer renames and overrides, tested 1 October 2026.** Sections 7 and 16 used to treat any layer rename in a published library as silently dropping consumers' overrides. A test with local components showed renaming and wrapping a layer kept every override on update; overrides were lost only when a consumer switched to a variant whose layer names differed. Both sections now say so. The test ran inside one file, not through publish and accept; `breaking-changes-figma-and-code.md` sections 3 and 27 carry the detail.
- **Code Connect evidence, added 5 October 2026.** Names counted from 1,103 Code Connect files in 23 public kits on their default branches that day (Simple Design System, Carbon, IBM Products, Primer, Infineon, Qualcomm, NYSDS, lifinance, Firefox, CMSgov, Codecademy and others). It changed four recommendations. Section 18 used to advise `Label text` on the property with a bare `Label` layer; it now advises a bare noun on both and a `Show` prefix on a boolean that toggles the same element, because the suffix is the main style in only 4 of 23 kits. Section 14 used to advise renaming every nested instance to its role (`Item`); it now advises keeping the component name, which is what most kits do. Section 4 used to name the swap after the code slot (`leadingVisual`); it now names the thing and its position (`Leading icon`). Section 4's `?` paragraph used to call the shorthand unshipped; Primer ships 17 such booleans. Limits: Code Connect shows only the names a kit maps, so purely visual booleans are missing and per-kit counts are lower bounds; the Figma files themselves were not opened; most names were parsed by script, with seventeen files read by eye. Slots appear in only 3 kits, so slot naming is still untested.
- **How good is the evidence, honestly.** No published user research measures whether either boolean grammar is easier to read, or whether any particular layer-naming scheme reduces handoff defects. Section 11 is the only part of this guide with real research behind it, and even that is commercial rather than academic. Everything else rests on internal consistency, bug reports, migration behaviour, documented API mechanics and, since October 2026, counts of what 23 kits actually ship: decent evidence for a tooling question, and not the same thing as knowing. A majority in those counts says what is common, not what works better.
- **A note on agreement.** The systems publishing Figma-specific conventions here (Compound, Accor, GitLab Pajamas) sit downstream of the same Figma guidance and the same community discussion, so their agreement reads closer to one source with echoes than several teams arriving independently. Ant Design's bare-word boolean convention, argued out with no lineage back to the Western cluster, is the genuinely independent data point in this guide; the API mechanics in Parts two and three (key generation, override matching, wildcard behaviour) aren't conventions at all, and don't need an independence check.

---

## Sources

### Primary: Figma product and API documentation

- [Plugin API: `name`](https://developers.figma.com/docs/plugins/api/properties/nodes-name/) (text node `autoRename` behaviour)
- [Plugin API: `componentPropertyDefinitions`](https://developers.figma.com/docs/plugins/api/properties/ComponentPropertiesMixin-componentpropertydefinitions/) (the generated key suffix, and how defaults are stored)
- [Plugin API: `SlotSettings`](https://developers.figma.com/docs/plugins/api/SlotSettings/) and [`SlotNode`](https://developers.figma.com/docs/plugins/api/SlotNode/)
- [Plugin API updates, 2026-06-10](https://developers.figma.com/docs/plugins/updates/2026/06/10/update/) (the `SLOT` property type reaching general availability)
- [Code Connect for React](https://developers.figma.com/docs/code-connect/react/) (the property-name and layer-name helpers)
- [Props and variables](https://developers.figma.com/docs/code/props-and-variables/)
- [Explore component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)
- [Create and manage component properties](https://help.figma.com/hc/en-us/articles/8883756012823-Create-and-manage-component-properties)
- [Edit instances with component properties](https://help.figma.com/hc/en-us/articles/8883757553943-Edit-instances-with-component-properties)
- [Apply changes to instances](https://help.figma.com/hc/en-us/articles/360039150733-Apply-changes-to-instances) (Reset name, Reset all changes)
- [Swap components and instances](https://help.figma.com/hc/en-us/articles/360039150413-Swap-components-and-instances) (text overrides preserved via unique layer names)
- [Components collection: Tips for component management](https://help.figma.com/hc/en-us/articles/39747637290263-Components-collection-Tips-for-component-management) (naming layers meaningfully for handoff and agentic parsing)
- [Name and organize components](https://help.figma.com/hc/en-us/articles/360038663994-Name-and-organize-components) (slash notation for component hierarchy)
- [Use slots to build flexible components in Figma](https://help.figma.com/hc/en-us/articles/38231200344599-Use-slots-to-build-flexible-components-in-Figma) (GA status, `displayEmptyByDefault`, preferred instances, min/max children, current known limitations)
- [The difference between slots, instance swaps, and variants](https://help.figma.com/hc/en-us/articles/38741465279895-The-difference-between-slots-instance-swaps-and-variants) (Figma's own guardrails-vs-freeform framing)
- [Best practices to help Figma AI understand your design system](https://help.figma.com/hc/en-us/articles/38978644498199-Best-practices-to-help-Figma-AI-understand-your-design-system) (why `Group 7` fails and `HeroImage` works)
- [Groups versus frames](https://www.figma.com/best-practices/groups-versus-frames/) (constraints resolve to the nearest parent frame, never a group)
- [Jake Albaugh, *The Shared Language of Props*, Figma blog](https://www.figma.com/blog/the-shared-language-of-props/) (marking Figma-only properties; why design and code properties differ on purpose)
- [Figma, Config 2026 recap](https://www.figma.com/blog/config-2026-recap/) (code layers, rolling out from July 2026)
- [Figma MCP server guide: gotchas](https://github.com/figma/mcp-server-guide/blob/main/skills/figma-use/references/gotchas.md) (never reconstruct a generated property key)

### Primary: design systems and component libraries

- [Adobe React Spectrum, API Guidelines](https://github.com/adobe/react-spectrum/blob/main/specs/api/Guidelines.md) (the `is`/`allows`/`should`/`show` grammar, and preferring extensible values over booleans)
- [Adobe React Spectrum, discussion #6045](https://github.com/adobe/react-spectrum/discussions/6045) (why `isDisabled` rather than `disabled`: a stated consistency answer)
- [MUI, API design approach](https://mui.com/material-ui/guides/api/) (the boolean-for-two, enum-for-more rule)
- [MUI, Button](https://mui.com/material-ui/react-button/) (the `text`/`contained`/`outlined` variant values)
- [Shopify, Polaris v11-to-v12 migration guide (repository source)](https://github.com/Shopify/polaris-react/blob/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx) (the seven-boolean collapse into `variant`/`tone`, the Modal `size` change, `connectedDisclosure` removed)
- [Chakra UI, Migration to v3](https://chakra-ui.com/docs/get-started/migration) (the prefix-removal table)
- [GitHub Primer, Button](https://primer.style/react/Button) (`leadingVisual`, `trailingVisual`)
- [GitHub Primer, TextInput](https://primer.style/react/TextInput/) (`leadingVisual`, `trailingVisual`, `validationStatus`)
- [eslint-plugin-react, `boolean-prop-naming`](https://github.com/jsx-eslint/eslint-plugin-react/blob/master/docs/rules/boolean-prop-naming.md) (the default `^(is|has)[A-Z]([A-Za-z0-9]?)+` pattern)
- [Ant Design, API Naming rules](https://github.com/ant-design/ant-design/wiki/API-Naming-rules) (bare-word booleans, argued independently of the Western cluster)
- [GitLab Pajamas, designing with the UI Kit](https://design.gitlab.com/get-started/design/) (Figma property conventions)
- [GitLab, Figma structure for library](https://gitlab.com/gitlab-org/gitlab-design/issues/791) (the slash hierarchy, and nested base components losing overrides more often)
- [Accor Welcome, component naming in Figma](https://design.accor.com/latest/terminology/component-naming/in-figma-pBV4ljc5-pBV4ljc5) (emoji classification before any other part of the name)
- [Accor Welcome, property naming](https://design.accor.com/latest/terminology/property-naming-nQIHUq1s-nQIHUq1s) (kebab-case properties, abstract-over-literal values, ordering by frequency of use)
- [Accor Welcome, library structure](https://design.accor.com/latest/get-started/designing/first-steps/structure-1VkjqBJH) (the emoji classification carried down to file level)
- [Compound Design System, Component Properties](https://compound.thephoenixgroup.com/latest/figma/components/component-properties-uJbaUrky) (published property order; `Icon Prefix/Left` and `Icon Suffix/Right`)
- [Compound Design System, Guides for Designers](https://compound.thephoenixgroup.com/latest/figma/overview/guides-for-designers-840krVrQ) (`.` for private components, layer capitalisation)

### Primary: Code Connect files from public kits (default branches, 5 October 2026)

- [Figma Simple Design System, `InputField.figma.ts`](https://github.com/figma/sds/blob/main/src/figma/primitives/InputField.figma.ts) (`Has Label` with `Label`, `Has Description` with `Description`)
- [Mozilla Firefox, `moz-message-bar.figma.ts`](https://github.com/mozilla-firefox/firefox/blob/main/toolkit/content/widgets/moz-message-bar/moz-message-bar.figma.ts) (`Show heading` with `Heading`)
- [Carbon, `ComboBox.figma.ts`](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ComboBox/ComboBox.figma.ts) (`Show helper` with `Helper text`, feeding `helperText`)
- [Carbon, `Menu.figma.tsx`](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Menu/Menu.figma.tsx) (nested instances kept as `_Menu list item`)
- [lifinance, `alert.figma.tsx`](https://github.com/lifinance/design-system/blob/main/registry/core/ui/alert.figma.tsx) (`Title` boolean with `↳ Title` text)
- [Codecademy Gamut, `MenuItemFixed.figma.tsx`](https://github.com/Codecademy/gamut/blob/main/packages/code-connect/Molecules/Menu/MenuItemFixed.figma.tsx) (`label` boolean with `↳ label` text)
- [Primer, `TextInput.figma.tsx`](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.figma.tsx) (`leadingVisual?` boolean with `leadingVisual` swap)
- [Primer, `TabNav.figma.tsx`](https://github.com/primer/react/blob/main/packages/react/src/TabNav/TabNav.figma.tsx) (`counter?` boolean gating `CounterLabel`)
- [Equinor, `Button.figma.tsx`](https://github.com/equinor/design-system/blob/main/packages/eds-core-react/src/components/next/Button/Button.figma.tsx) (`Show Leading Icon` with `Leading Icon Item`)
- [NYSDS, `nys-checkbox.figma.ts`](https://github.com/ITS-HCD/nysds/blob/main/packages/nys-checkbox/src/nys-checkbox.figma.ts) (repeated nested instances numbered `Option 1` to `Option 10`)

### Commentary, labelled as such in the text

- [Nathan Curtis, *The Sorry State of States*](https://medium.com/@nathanacurtis/the-sorry-state-of-states-89dd4668737e). The ten-library audit behind section 5.
- [Nathan Curtis, *Components as Data*](https://medium.com/@nathanacurtis/components-as-data-2be178777f21). Nullable slots, and why Figma needed a companion boolean.
- [Nathan Curtis, *Implementing Slots in a Figma Library*](https://medium.com/@nathanacurtis/implementing-slots-in-a-figma-library-a9d6185318c2). `children`/`items` slot naming and asterisk-marked helper properties.
- [John Gozde, *An Opinionated Guide to Component APIs*, Imply Engineering Blog](https://imply.io/blog/an-opinionated-guide-to-component-apis/). The composition-over-toggles counter-argument in section 3.
- [Alice Packard, *I have beef with status emojis in component library Page names*](https://www.alicepackarddesign.com/blog/i-have-beef-with-status-emojis-in-component-library-page-names). The cost side of section 13's emoji discussion.
- [Nielsen Norman Group, *A Downside of Fake Copy in UI Prototypes*](https://www.nngroup.com/videos/fake-copy/). The research position behind section 11.
- [Nielsen Norman Group, *Placeholders in Form Fields are Harmful*](https://www.nngroup.com/videos/placeholders-form-fields/). Adjacent and often confused with the above; this one is about form-field placeholders specifically.
- [SimpleLocalize, why text expansion breaks your UI](https://simplelocalize.io/blog/posts/text-expansion-ui-localization/). The 20-to-35-percent German figure; vendor content, treat the number as a rule of thumb.
- [Hypermatic CopyDoc, placeholders](https://docs.hypermatic.com/copydoc/library/placeholders). Where the `{{ }}` convention actually comes from: text content tooling, not layer names.
- The layer-naming debate: [Big Debate: Naming Layers in Figma](https://medium.com/design-bootcamp/big-debate-naming-layers-in-figma-9ac6253ad136) and [Organized Chaos: the pros and cons of naming layers](https://medium.com/design-bootcamp/organized-chaos-the-pros-and-cons-of-naming-layers-in-figma-4952c4be6e06). Evidence the practice is unmeasured, not evidence for any one position.

### Cited but not resolved to a URL

- Nathan Curtis, *Crafting Component API, Together* (2021). Referenced for the `?` annotation's origin in EightShapes worksheets; not opened in this pass.
