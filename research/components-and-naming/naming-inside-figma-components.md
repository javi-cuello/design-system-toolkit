# Naming inside a Figma component

What to call the properties, layers and parts inside a Figma component, judged by what reads each name and what breaks when it changes.

Carbon's time picker has a text layer that was never renamed, so its name is its sample copy, `Choose a time`. The Code Connect file in Carbon's repository looks that layer up by exactly that string. The day a designer edits the copy to something friendlier and publishes, the mapping stops matching, and nothing in Figma says it will.

---

## What this answers

- [Readers of a name](#readers-of-a-name): what reads a name inside a component
- [Layers worth naming care](#layers-worth-naming-care): which layers deserve naming care
- [Text property names](#text-property-names): what text properties should be called
- [Boolean names](#boolean-names): how a boolean should be named
- [Swaps, variants and sizes](#swaps-variants-and-sizes): how swaps, variant values and sizes are named
- [Part names](#part-names): how a part should be named
- [Nested layer names](#nested-layer-names): what a nested layer should be called
- [Default text](#default-text): what the default text should say
- [Renames after adoption](#renames-after-adoption): which renames are safe after adoption
- [Slots versus swaps](#slots-versus-swaps): when a slot beats an instance swap

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in three paragraphs.

---

## Readers of a name

Four mechanisms read a name inside a component: text auto-rename, override preservation, Code Connect and code generation; a name deserves care only if one of them reads it.

The time picker's mapping is fragile because two of those four touch one name. Auto-rename keeps the layer's name equal to its copy, and Code Connect looks the layer up by that name. Change the copy and the lookup key changes with it.

That's the general shape. A name inside a component isn't a label for people; it's a lookup key that tools read, and each tool reads it for something different:

| What reads the name | What it uses it for | What a careless name does |
|---|---|---|
| Text auto-rename | keeps an unrenamed text layer's name equal to its content | the name moves on every copy edit |
| Override preservation | matches layers to carry a consumer's edits through a variant switch or swap | a layer named differently across variants loses the edit, silently |
| Code Connect | `figma.children('Name')`, `figma.boolean('Name')` and friends take literal strings | the mapping stops matching, at publish or, for enums, not at all |
| Dev Mode and code generation | the name is often the only semantic label on a layer | worse generated code |

The fourth row has grown. [Figma's guidance on helping its AI understand a design system](https://help.figma.com/hc/en-us/articles/38978644498199-Best-practices-to-help-Figma-AI-understand-your-design-system) says "Group 7 or Rectangle 3 give the agent nothing to work with". The toolkit measured the effect in a small test: when Claude wrote code from Figma without the component API in context, names aligned with the code cut wrong props by more than half (`standards/figma-standard.md`, rule 21's *Why*).

The audience grew too. Since simplified instances were deprecated on 23 March 2026, every layer inside an instance shows in every consumer's layers panel. Names written for the author's convenience are now part of the library's public surface.

Before arguing about a name, ask whether anything in that table reads it. **If nothing does, a plain descriptive name is enough; spend care only on the names something reads.**

---

## Layers worth naming care

The layers that deserve it are those Code Connect names, layers that carry overrides (text and nested instances), and layers a consumer sees: perhaps eight of a component's forty.

Open a date-picker cell and there are forty layers: a frame, a background, a divider, a text layer showing `Jan 14, 2026`, an icon. Renaming all forty to a scheme is an afternoon's work, and most of it changes nothing any tool reads.

Here is which kinds of layer matter, and why:

| Kind of layer | Does the name matter? | Why |
|---|---|---|
| Named in a Code Connect mapping | critically | it is a literal string in a repository |
| Text layers | a lot | overrides match on them, and auto-rename moves them |
| Nested instances | a lot | overrides match on them; `figma.children()` finds them by name |
| Structural frames | somewhat | visible to everyone since March 2026 |
| Icons and swappable images | somewhat | wildcards and code generation read them |
| Decoration (dividers, backgrounds) | barely | nothing reads them; only Figma's default names are wrong |

Three mechanical facts sit behind that table.

First, a text layer's `autoRename` is on until someone renames it once. So the layer showing `Jan 14, 2026` is *named* `Jan 14, 2026`. The Code Connect files of Carbon (`Choose a time`, `hh:mm`) and Coveo (`Awesome chip`) target sample copy for exactly this reason, and each mapping breaks the day the copy is edited.

Second, Code Connect's wildcard matches only at the end of a name (`figma.children('Icon*')`), and matching is case-sensitive. Anything placed at the front of a name has to be typed into every match string.

Third, a layer named differently across a set's variants keeps a consumer's override in some variants and drops it in others. [Renames after adoption](#renames-after-adoption) draws what that looks like.

Rename every text layer in a published component once, even to the word it already shows. Name frames by their job (`Container`, `Content`, `Actions`), never leave `Frame 427`, and use frames rather than groups: a group has no auto layout, and its constraints resolve to the nearest parent frame. **Keep each name identical in every variant.**

---

## Text property names

A text property takes the bare noun the code uses, such as `Label` or `Title`, with a `text` suffix only where the code prop has one.

A text field has a property for its label. One kit calls it `Label`, another `Label text`. Both read fine in the properties panel, so the choice looks like taste. It stops being taste when a boolean wants the same noun, which [boolean names](#boolean-names) takes up.

The evidence is a count of what kits ship: the property names in 1,103 Code Connect files from 23 public kits. Of 359 unique text-property names, 181 (50%) are a bare noun, the main style in 14 kits. Another 106 (30%) end in `text`, the main style in only four kits (Carbon, IBM Products, Infineon, Qualcomm).

Those four suffix nearly every text property (Carbon 32 of 46), so in them the suffix distinguishes nothing. A blind re-run over 46 kits found bare nouns in 38 of 40 kits. And MUI's props carry no suffix except `helperText`.

Name text properties `Label`, `Title`, `Placeholder`, taking the code's word wherever the code has one. **Use `Helper text` only where the code prop says it.**

---

## Boolean names

A boolean is bare for a state or a style switch (`Disabled`, `AI`), and `Show` plus the noun for a boolean that reveals an element, since the text property already holds the bare noun.

The text field now has `Label`, a text property. It also needs a toggle that hides the label. Calling the toggle `Label` too gives two properties one name, and Figma allows that: each property's real key carries a generated suffix (`Label#4:0`), and Figma then shows those ids to everyone who sets them.

So the boolean has to carry a mark. Most booleans need none: of 624 unique boolean names in the 23 kits, 408 (65%) are bare, like `Disabled` or `Divider`. Among prefixes, `Show X` (117) is the one that turns up in volume. `Has X` has 32, `Is X` 18 (MetaMask alone uses it as its style, because its Figma names copy code props) and `X?` 17 (Primer alone).

The clash with a text, swap or slot property happened 108 times in 17 kits, solved five ways:

| Shape | Kits | Example |
|---|---|---|
| `Has X` with bare `X` | 5 | Simple Design System: `Has Label` with `Label` |
| `Show X` with bare `X` | 5 | Firefox: `Show heading` with `Heading` |
| bare boolean, `X text` | 5 | Carbon: `Label` with `Label text` |
| bare boolean, glyph text | 5 | lifinance: `Title` with `↳ Title` |
| `Show X` with `X text` | 4 | Carbon: `Show helper` with `Helper text` |

The text-property majority breaks the tie. Once text properties take the bare noun, the boolean has to carry the mark, and `Show` is the most common verb prefix and reads as an instruction. The blind re-run agreed: `Show X` with bare `X` was the most common pair, in 13 kits.

Code has its own prefix argument, and it points the same way. React Spectrum's written grammar (`is` for state, `allows` for permission, `should` for behaviour) is house style; asked why not plain `disabled`, its maintainers answered "consistency between all boolean props". Chakra dropped the prefix in v3 (`isDisabled` became `disabled`), no major system went the other way, and Ant Design reached bare words independently. The concrete bug the bare form avoids is a component accepting both `disabled` and `isDisabled`.

The toolkit has ruled on the ties (`standards/figma-standard.md` rule 21):

- `Show` for a boolean that reveals text, an instance or a slot;
- a bare word for a boolean that only switches a style, such as `AI`, ruled on 12 October 2026 because the code has `variant="ai"` and no `show` prop;
- a True/False *variant* is a state and stays bare (`Disabled`, `Open`), never `Is`;
- `Has` kept for a variant that reflects content (`Has value`);
- no two properties sharing a name.

Rule 5 puts the revealing boolean directly above the property it fills. It also found that `componentPropertyDefinitions` doesn't return panel order, so no script can check that.

Name the pair `Label` and `Show label`, or `Icon` and `Show icon`, and keep `Disabled` a bare True/False variant. Whatever your code does, never mix grammars in one component. **Casing is absorbed by a Code Connect mapping (`figma.boolean('Disabled')` onto `disabled`); vocabulary is not.**

---

## Swaps, variants and sizes

Name a swap for the thing it holds (`Icon`), position it with `Leading` and `Trailing`, case variant values like their axis, and pick one size vocabulary knowing MUI costs a one-word mapping either way.

A button has an icon property. One kit calls it `Icon swap`, another `Left icon`. Then the product ships in Arabic, the button mirrors, and the property named `Left icon` now controls the icon on the right.

That's why position words matter more than they look. Across the kits they split four ways: prefix and suffix (11 names), left and right (7), leading and trailing (7), start and end (2). `Leading` and `Trailing` win the tie because they stay true when a right-to-left layout mirrors the component, which `Left` doesn't.

The mechanism word is noise. Plain `Icon` is the most common swap name, and only Carbon, IBM Products and Coveo put "swap" in a name.

Variant values follow the axis's casing (`Size: Small`). A True/False variant is spelt `True`/`False`, Figma's default: 51 axes use the capitalised form and 76 lowercase, the lowercase ones being kits that case everything like code. Values stay abstract; as GitLab Pajamas puts it, `Color: muted, enhanced`, never `light gray, blue`.

Size values are the one open split. The blind re-run found them written as words (`Small`, `Medium`, `Large`) in 27 kits and as codes in 20, and MUI's code says `small`, `medium`, `large`.

The toolkit ruled the other way (rule 6, 7 October 2026): lowercase t-shirt names, largest first, as one unbroken run (`lg`, `md`, `sm`). The reasons are that `size="sm"` is how most frameworks write it, and `2xl` extends the scale without renaming anything.

Use `Icon`, `Leading icon` and `Trailing icon`, never `Left icon` or `Icon swap`. **Both size vocabularies are defensible: a library targeting MUI pays a one-word mapping either way, so pick one and write the mapping down.**

---

## Part names

A part takes its family plus its own last word, joined by a space, one level deep; no surveyed kit chains every ancestor.

One project library named its parts by chaining every ancestor with ` - `. That covered 83 of its 214 components, up to five levels deep: `Sidebar dialog - Modal - Sidebar - Section - Item`. The name is accurate, and nobody can read it in a layers panel.

What do kits do instead? Counting each of 33 kits once, by how it joins parent and part:

| Join | Kits | Examples |
|---|---|---|
| Space | 12 | Simple Design System `Menu Item`, Carbon `_Menu list item`, Qualcomm `_Breadcrumb item` |
| No parent in the name | 7 | Equinor `Leading Content`, `Description` |
| Slash folder | 5 | MUI's own kit `Card/Elements/CardHeader`, Synergy `_helper/syn-card/footer`, Helios `Dropdown / ToggleIcon` |
| Dot | 2 | Primer `_PageHeader.Title`, Coveo `.Accordion.Item` |
| Other | 7 | kebab `.card-header` (Lumen, Accor), camel `BannerBase` (MetaMask) |

The blind re-run agreed: a space join in 13 of 46 kits, the most common. Only Carbon puts ` - ` in a part name, six times, as a family or variant suffix (`UI shell - Header actions`), never as a chain.

Two or three levels appear only where every level is a component in code. lifinance's `.Sidebar Menu Button` is `Sidebar`, `SidebarMenu`, `SidebarMenuButton`, the way MUI chains `List`, `ListItem`, `ListItemText`. No kit chains through a layout wrapper that has no code component.

Kits built to mirror code (Primer, Simple Design System, lifinance, Coveo) take the code's compound name. Kits not built from code drift: Infineon has `Dropdown Menu Item` for `ifx-dropdown-item`, and `_Tabs Items` for one tab. MUI's own kit chose slash folders that end in the export name, which buys names string-equal with code at the cost of a casing no sentence-case library uses elsewhere.

Under the kit majority, the five-level name becomes `Sidebar dialog item`. `Modal` and `Sidebar` drop out because they're layout wrappers, not components. The toolkit adopted exactly this as `standards/figma-standard.md` rule 9 on 7 October 2026, and applied it the same day to one library: 72 components, with 29 nested instances renamed.

A few marks carry meaning on top of the name:

- `_` marks a part that doesn't publish (Primer, Carbon, Infineon, Qualcomm, Synergy); `.` does the same in lifinance, Coveo, Sikt and Codecademy.
- ` / ` goes only between interchangeable siblings of one part, a virtual set (`Cell / Fill`, `Cell / Hug`); the one kit precedent is Primer's `NavList.Item/SubItem`.
- ` - ` goes before a *flavour* built separately (`Button - CTA`, `FAB - AI`, toolkit rule 20), which is Carbon's use of the hyphen, not a chain.
- A slot filler stays unprefixed, because Figma offers only published components in a slot (rule 8).

Name parts `Card header`, `Dialog actions`, `List item button`, in the code's suffix vocabulary (`Content`, `Actions`, `Header`, `Label`, `Icon`). **One level per real component, none for a wrapper.**

---

## Nested layer names

A nested public component keeps its own name; a part, under the toolkit's rule, takes only its last word; repeats are told apart by role or number, never by a variant value.

A menu holds an instance of `_Menu item`, now set to `Selected`. Its layer is still named `_Menu item / Default`, from when it was placed. The name is simply false, and anyone reading the layers panel or a generated snippet is misled by it.

Kits mostly keep the component name on the layer (`Button`, `Avatar`, Carbon's `figma.children(['_Menu list item'])`). It's Figma's default, it costs no override, and it matches what Code Connect looks for. Role names are a minority, and cluster where instances repeat (Primer's `Primary` and `Secondary`). Lists are numbered (NYSDS `Option 1` to `Option 10`) or matched with a wildcard (`TabItem*`).

The toolkit departs from the kit majority for parts. Rule 9 names a part's layer inside its parent by its last word (`Item`, `Cell`, `Header`), since position already says whose part it is, and repeating the family turns the layer tree into an index. A public component nested somewhere keeps its own name (rule 10).

That costs one alias per part for a Code Connect file to know, which the kit evidence had warned of: one library had renamed 132 of its 278 nested instances, mostly to such last words. The toolkit judged the shorter tree worth it once part names had become short.

Where the name is set matters as much as what it says. The toolkit tested this on throwaway copies on 8 October 2026:

- a layer-name override on a nested instance *resets* when the parent switches variant, so a layer is named in the component, never by an override on a consumer's instance (rule 10);
- text edited inside a nested instance is stored per variant of that instance, and is dropped when the instance changes variant inside its parent;
- the same items placed in a slot kept their text (rule 38).

Name nested layers in the main component. Keep a public component's name, give a part its last word, and number or role-name repeats. **Bind a nested instance to an instance-swap property wherever possible, because Code Connect then reaches it by the stable property name instead of the layer name.**

---

## Default text

Default text is realistic copy for words a person writes, a brace placeholder for values a machine supplies, never lorem ipsum, and the longest plausible string on the documentation page rather than in the default.

The default travels further than any other choice here: into every new instance, the assets panel, documentation screenshots, and any snippet a generator writes before a designer overrides it. Take a timestamp label and two candidate defaults:

| Default | What a generated snippet says | What happens next |
|---|---|---|
| `{{date}}` | `label="{{date}}"` | visibly wrong; never committed by accident |
| `14 Jan 2026` | `label="14 Jan 2026"` | plausible; committed as a hard-coded string |

Code Connect passes a default straight into generated code, so a conspicuously fake default for dynamic content is a safety feature.

For words a person writes, the case runs the other way. Nielsen Norman Group's work on prototype copy and form placeholders finds that placeholder text hides usability problems and defers layout failures, because it runs shorter than real content. It's commercial research, but the mechanism isn't disputed.

Braces belong in *content*, which is where they come from (content-authoring plugins). No published system uses them in *layer* names, and at the front of a name they block the trailing wildcard.

Length is a separate problem from wording. German runs roughly 20 to 35% longer than English (a vendor figure), so a string variable with a long-text mode stresses the layout without making the default unreadable.

Write `Save changes`, not `Label`, and `{{date}}` for a timestamp. **Never ship lorem ipsum in a published component.**

---

## Renames after adoption

A consistent layer rename keeps overrides; a layer named differently across variants loses them; a renamed property fails the Code Connect publish; and a renamed variant *value* publishes cleanly while silently breaking an enum mapping.

A consumer has placed a button and typed `Save changes` into it. In the library, the `Default` variant's text layer is called `Label`, but in the `Selected` variant it is called `Text`. Here is what happens when the consumer switches variant, beside the same switch with consistent names.

<svg role="img" viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Left: the consumer's button in the Default variant, text layer named Label, showing the override Save changes. Right, after switching to the Selected variant: when the layer is still named Label the override is kept and the button shows Save changes; when the layer is named Text the override is dropped and the button shows the default copy, Button.</title>
<rect x="0" y="0" width="640" height="250" fill="#f7f6f2"/>
<text x="20" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Before: Default variant</text>
<rect x="20" y="48" width="170" height="44" rx="8" fill="#1f5fbf"/>
<text x="105" y="75" font-size="14" fill="#ffffff" text-anchor="middle">Save changes</text>
<text x="20" y="116" font-size="12" fill="#5a5850">layer: Label</text>
<text x="20" y="134" font-size="12" fill="#5a5850">override: Save changes</text>
<text x="220" y="76" font-size="22" fill="#5a5850">→</text>
<text x="260" y="30" font-size="14" font-weight="600" fill="#1a1a1a">After: switched to Selected</text>
<rect x="260" y="48" width="170" height="44" rx="8" fill="#163f80"/>
<text x="345" y="75" font-size="14" fill="#ffffff" text-anchor="middle">Save changes</text>
<text x="450" y="66" font-size="12" fill="#1a1a1a">layer still named Label</text>
<text x="450" y="84" font-size="12" font-weight="600" fill="#1b6b2e">override kept</text>
<rect x="260" y="150" width="170" height="44" rx="8" fill="#163f80"/>
<text x="345" y="177" font-size="14" fill="#ffffff" text-anchor="middle">Button</text>
<text x="450" y="168" font-size="12" fill="#1a1a1a">layer named Text</text>
<text x="450" y="186" font-size="12" font-weight="600" fill="#b3261e">override dropped</text>
<text x="260" y="226" font-size="12" fill="#5a5850">Same switch; only the layer name in Selected differs.</text>
</svg>

Nothing warns the consumer; their copy is just gone. The differing name looked like harmless tidying, because inside the library it was.

Override preservation matches layers by name across variants, so a rename hurts only where it isn't consistent. Each kind of rename fails in its own way:

| What is renamed | What breaks | How it is discovered |
|---|---|---|
| A code prop | every consumer | a build error; codemods are the remedy |
| A Figma property | Code Connect mappings holding the literal name | a failed publish |
| A Figma variant value | an enum mapping, whose keys must be the exact literal values and are not normalised (Code Connect docs) | not at all, until the snippet is wrong |
| A Figma layer, consistently | `figma.children` mappings | a failed publish; overrides survive, since they follow layer identity |
| A Figma layer, in some variants only | overrides on variant switch | when a consumer switches variant and their content is gone |

The layer rows were tested on 1 October 2026 with local components. Renaming and wrapping a layer kept every override on update; overrides were lost only on switching to a variant whose layer names differed.

> **Aside.** That test ran inside one file, not through publish and accept. And whether `figma.children` reaches past direct children is still undocumented: [Code Connect's React docs](https://developers.figma.com/docs/code-connect/react/) describe its argument only as the instance layer's name within the parent component, and the request to combine properties from nested instances ([code-connect #11](https://github.com/figma/code-connect/issues/11)) remains open.

Treat property, value and layer names as versioned interfaces. Search your Code Connect files before renaming, and rename in every variant at once. **Ship a rename in a published library as a release with a deprecation path.**

---

## Slots versus swaps

A slot is better when the area is freeform; a guarded single icon is still an instance swap plus a `Show icon` boolean, and slot names have almost no precedent yet.

A list item has an optional leading icon, and hiding it should also tighten the gap beside the label. With a swap and a `Show icon` boolean, both can be wired. Move the icon into a slot and the boolean can no longer reach it.

[Figma's help centre draws the line itself](https://help.figma.com/hc/en-us/articles/38741465279895-The-difference-between-slots-instance-swaps-and-variants): an instance swap is for a slot limited to "at most, one instance at a time", and a slot is for freeform content, such as a modal body.

The limitation that matters for icons still stands. [Figma's slots page](https://help.figma.com/hc/en-us/articles/38231200344599-Use-slots-to-build-flexible-components-in-Figma) says "Component properties cannot be applied to layers from inside a slot". So a `Show icon` boolean that also shifts a sibling's spacing can't be wired the same way once the icon lives in a slot.

Tooling is behind too. Code Connect maps slots with `figma.slot()` and by default "does not traverse slot children", rendering a reference to the slot instead. Figma's MCP support for slots is listed as coming soon.

Names have barely formed. Only three of the 23 kits mapped a native slot: lifinance `Content slot`, MetaMask `startAccessory`, Codecademy `body`. The toolkit has ruled (rule 21):

- `Slot` by default;
- `Leading slot` or `Trailing slot` at either end of a horizontal layout;
- a slot holding repeated items named for them (`Items slot`);
- a boolean showing a slot named `Show` plus its name.

**Keep a single optional icon as a swap with `Show icon`, and use a slot for freeform areas.** Name the slot `Slot` unless it sits at one end or holds repeated items.

---

## Cheat sheet

| What it is | Layer | Default | Property | Type |
|---|---|---|---|---|
| Editable text | `Label` | `Save changes` | `Label` | Text |
| Whether it shows | `Label` | n/a | `Show label` | Boolean |
| Text whose code prop says "text" | `Helper text` | a real sentence | `Helper text` | Text |
| Machine-supplied value | `Timestamp` | `{{date}}` | none, or Text | Text |
| Single icon | `Icon` | n/a | `Icon` and `Show icon` | Swap, Boolean |
| Positioned icons | `Leading icon`, `Trailing icon` | n/a | same names | Swap |
| Freeform area | `Slot` | n/a | `Slot`, `Leading slot`, `Items slot` | Slot |
| Style switch | n/a | n/a | `AI`, `Divider` | Boolean |
| State | n/a | n/a | `Disabled`, `Open` (`True`/`False`) | Variant |
| Content-reflecting variant | n/a | n/a | `Has value` | Variant |
| Size | n/a | n/a | `Size`: `lg`, `md`, `sm` (toolkit); `Small`… is the kit majority | Variant |
| Part | n/a | n/a | `Card header`, `_Menu item` | component |
| Siblings of one part | n/a | n/a | `Cell / Fill`, `Cell / Hug` | component |
| Flavour built separately | n/a | n/a | `Button - CTA` | component |
| Nested part's layer | `Item`, `Item 1` | n/a | n/a | n/a |
| Nested public component's layer | `Button` | n/a | n/a | n/a |
| Frame, decoration | `Container`, `Divider` | n/a | n/a | n/a |

---

## The short version

Names inside a component are read by override matching, Code Connect and code generators, so they behave like an API. Use the code's words, keep them stable, and spend care only on the names something reads: casing barely matters, while vocabulary and stability do.

So write `Label`, not `Label text`; `Icon`, not `Icon swap`; `Leading` and `Trailing`, not left and right. Mark a boolean that reveals an element with `Show`, and leave states and style switches bare. Name a part as its family plus its last word, joined by a space, never a chain of ancestors.

Name every layer in the main component, identically in every variant, and rename each text layer once so it stops tracking its copy. Use realistic default copy for words and braces for machine values. A consistent layer rename is safe; a layer that differs across variants, and a renamed variant value under an enum mapping, fail silently, so ship each rename as a release with a deprecation path. The counts behind all this say what kits commonly do, not what measurably works better; the toolkit's rulings on the ties (the `Show` prefix, `lg`/`md`/`sm`, last-word part layers) are judgements made for their stated reasons.

---

## What to re-check later

Researched August to October 2026 from Figma's help centre and Plugin API, Code Connect's React docs, the API guidelines of React Spectrum, MUI, Ant Design and Chakra, and the names used in 1,103 Code Connect files from 23 public kits (5 October 2026). A blind re-run over 46 kits and 1,998 files confirmed them on 6 October 2026. Part names were read across 33 kits. Re-checked in November 2026: slot limitations, the deprecation of simplified instances (23 March 2026), Code Connect's `figma.children`, wildcard and `figma.slot` behaviour, and the open request for selective exposure of nested properties.

- **Slots.** Property binding inside a slot was still impossible in November 2026; once it ships, the guarded-icon advice in [slots versus swaps](#slots-versus-swaps) can move to slots.
- **Selective exposure of nested properties.** Requested on Figma's forum since 2022, not shipped as of November 2026; it would change how parts are split (see [What the State axis models](what-the-state-axis-models.md), on a parent driving a nested child's state).
- **`figma.children` depth.** Undocumented; test before relying on wrappers.
- **Evidence quality.** No published research measures whether any boolean grammar or layer scheme reduces handoff defects. The counts say what is common, not what works better, and Code Connect shows only the names a kit maps, so per-kit counts are lower bounds. The Figma files themselves were not opened. The toolkit's Claude test of aligned names was small.
- **Agreement.** Compound, Accor and Pajamas sit downstream of the same Figma guidance, so their agreement is closer to one source with echoes; Ant Design's bare booleans are the independent data point.
- **Where this came from.** This guide merges three earlier ones: the property and layer guide, the subcomponent-naming study and the Figma-naming half of the MUI guide.

---

## Sources

**Primary: Figma**

- [Plugin API: `name` and `autoRename`](https://developers.figma.com/docs/plugins/api/properties/nodes-name/)
- [Plugin API: `componentPropertyDefinitions`](https://developers.figma.com/docs/plugins/api/properties/ComponentPropertiesMixin-componentpropertydefinitions/)
- [Code Connect for React](https://developers.figma.com/docs/code-connect/react/) (wildcards, case sensitivity, enum literals, `figma.slot`)
- [Use slots to build flexible components](https://help.figma.com/hc/en-us/articles/38231200344599-Use-slots-to-build-flexible-components-in-Figma)
- [The difference between slots, instance swaps and variants](https://help.figma.com/hc/en-us/articles/38741465279895-The-difference-between-slots-instance-swaps-and-variants)
- [Explore component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties) (simplified instances deprecated 23 March 2026)
- [Swap components and instances](https://help.figma.com/hc/en-us/articles/360039150413-Swap-components-and-instances)
- [Apply changes to instances](https://help.figma.com/hc/en-us/articles/360039150733-Apply-changes-to-instances)
- [Best practices to help Figma AI understand your design system](https://help.figma.com/hc/en-us/articles/38978644498199-Best-practices-to-help-Figma-AI-understand-your-design-system)
- [Groups versus frames](https://www.figma.com/best-practices/groups-versus-frames/)
- [Jake Albaugh, The Shared Language of Props](https://www.figma.com/blog/the-shared-language-of-props/)
- [Forum: selective exposure of nested properties](https://forum.figma.com/suggest-a-feature-11/allow-selective-exposure-of-nested-component-properties-48984)
- [code-connect issue #11](https://github.com/figma/code-connect/issues/11)

**Primary: systems**

- [React Spectrum API guidelines](https://github.com/adobe/react-spectrum/blob/main/specs/api/Guidelines.md) and [discussion #6045](https://github.com/adobe/react-spectrum/discussions/6045)
- [MUI API design approach](https://mui.com/material-ui/guides/api/)
- [Chakra UI migration to v3](https://chakra-ui.com/docs/get-started/migration)
- [Ant Design API naming rules](https://github.com/ant-design/ant-design/wiki/API-Naming-rules)
- [GitLab Pajamas, designing with the UI kit](https://design.gitlab.com/get-started/design/)
- [GitLab Pajamas, UI kit components](https://design.gitlab.com/get-started/uik-components/)
- [MUI design kits releases](https://github.com/mui/mui-design-kits/releases) (5.9.0 `Card/Elements/CardHeader`)
- [Compound, component properties](https://compound.thephoenixgroup.com/latest/figma/components/component-properties-uJbaUrky)
- [Accor, component naming in Figma](https://design.accor.com/latest/terminology/component-naming/in-figma-pBV4ljc5-pBV4ljc5)

**Primary: Code Connect files (default branches, 5 October 2026)**

- [Simple Design System InputField](https://github.com/figma/sds/blob/main/src/figma/primitives/InputField.figma.ts)
- [Firefox moz-message-bar](https://github.com/mozilla-firefox/firefox/blob/main/toolkit/content/widgets/moz-message-bar/moz-message-bar.figma.ts)
- [Carbon ComboBox](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ComboBox/ComboBox.figma.ts)
- [Carbon Menu](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Menu/Menu.figma.tsx)
- [lifinance alert](https://github.com/lifinance/design-system/blob/main/registry/core/ui/alert.figma.tsx)
- [lifinance sidebar](https://github.com/lifinance/design-system/blob/main/registry/core/ui/sidebar.figma.tsx)
- [Primer TextInput](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.figma.tsx)
- [Primer PageHeader](https://github.com/primer/react/blob/main/packages/react/src/PageHeader/PageHeader.figma.tsx)
- [Primer NavList](https://github.com/primer/react/blob/main/packages/react/src/NavList/NavList.figma.tsx)
- [Coveo Accordion](https://github.com/coveo/plasma/blob/master/packages/figma/src/Accordion.figma.tsx)
- [Equinor Button](https://github.com/equinor/design-system/blob/main/packages/eds-core-react/src/components/next/Button/Button.figma.tsx)
- [NYSDS checkbox](https://github.com/ITS-HCD/nysds/blob/main/packages/nys-checkbox/src/nys-checkbox.figma.ts)
- [Codecademy MenuItemFixed](https://github.com/Codecademy/gamut/blob/main/packages/code-connect/Molecules/Menu/MenuItemFixed.figma.tsx)

**Commentary**

- [Nathan Curtis, Components as Data](https://medium.com/@nathanacurtis/components-as-data-2be178777f21)
- [NN/g, A Downside of Fake Copy in UI Prototypes](https://www.nngroup.com/videos/fake-copy/)
- [SimpleLocalize, text expansion](https://simplelocalize.io/blog/posts/text-expansion-ui-localization/) (vendor figure)
- [Hypermatic CopyDoc placeholders](https://docs.hypermatic.com/copydoc/library/placeholders) (where `{{ }}` comes from)

**Toolkit**

- `standards/figma-standard.md` rules 5, 6, 8, 9, 10, 18, 20, 21, 38
- `standards/naming-preferences.json`
