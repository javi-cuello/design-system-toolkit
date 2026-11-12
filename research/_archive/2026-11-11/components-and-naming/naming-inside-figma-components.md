# Naming inside a Figma component

A component's property names, layer names and part names are not labels. They are lookup keys that override matching, Code Connect and code generators read, so the useful question is never "what is tidiest" but "what reads this name, and what breaks when it moves".

Researched August to October 2026: Figma's help centre and Plugin API, Code Connect's React docs, the API guidelines of React Spectrum, MUI, Ant Design and Chakra, and the names used in 1,103 Code Connect files from 23 public kits (5 October 2026), confirmed by a blind re-run over 46 kits and 1,998 files on 6 October 2026. Part names were read across 33 kits. Re-checked in November 2026: slot limitations (property binding inside a slot is still impossible), the deprecation of simplified instances (23 March 2026), Code Connect's `figma.children`, wildcard and `figma.slot` behaviour, and the open request for selective exposure of nested properties (still unshipped). This piece merges three earlier ones: the property and layer guide, the subcomponent-naming study and the Figma-naming half of the MUI guide.

---

## What this answers

- Which names inside a component does anything actually read?
- What should text, boolean, swap and slot properties be called?
- How should a part be named, and how many ancestors belong in its name?
- What should a nested instance's layer be called?
- What should the default text say?
- Which renames are safe once a library is in use?

The thesis, in one line: **use the code's words, keep them stable, and spend care only on the names something reads.** Casing barely matters; vocabulary and stability do.

---

## 1. What reads a name inside a component?

**The short answer.** Four mechanisms: text auto-rename, override preservation, Code Connect and code generation. A name only deserves care if one of them reads it.

| What reads the name | What it uses it for | What a careless name does |
|---|---|---|
| Text auto-rename | keeps an unrenamed text layer's name equal to its content | the name moves on every copy edit |
| Override preservation | matches layers to carry a consumer's edits through a variant switch or swap | a layer named differently across variants loses the edit, silently |
| Code Connect | `figma.children('Name')`, `figma.boolean('Name')` and friends take literal strings | the mapping stops matching, at publish or, for enums, not at all |
| Dev Mode and code generation | the name is often the only semantic label on a layer | worse generated code |

The fourth row has grown. Figma's own guidance on making a library legible to its AI tools says "Group 7 or Rectangle 3 give the agent nothing to work with", and the toolkit measured the effect: in a small test where Claude wrote code from Figma without the component API in context, names aligned with the code cut wrong props by more than half (`standards/figma-standard.md`, rule 21's *Why*).

Since simplified instances were deprecated on 23 March 2026, every layer inside an instance shows in every consumer's layers panel. Names written for the author's convenience are now part of the library's public surface.

**What to do.** Before arguing about a name, ask whether anything in that table reads it. If nothing does, a plain descriptive name is enough.

---

## 2. Which layers deserve naming care?

**The short answer.** Layers Code Connect names, layers that carry overrides (text and nested instances), and layers a consumer sees. Perhaps eight of a component's forty.

| Kind of layer | Does the name matter? | Why |
|---|---|---|
| Named in a Code Connect mapping | critically | it is a literal string in a repository |
| Text layers | a lot | overrides match on them, and auto-rename moves them |
| Nested instances | a lot | overrides match on them; `figma.children()` finds them by name |
| Structural frames | somewhat | visible to everyone since March 2026 |
| Icons and swappable images | somewhat | wildcards and code generation read them |
| Decoration (dividers, backgrounds) | barely | nothing reads them; only Figma's default names are wrong |

Three mechanical facts shape everything below. A text layer's `autoRename` is on until someone renames it once, so a layer showing `Jan 14, 2026` is *named* `Jan 14, 2026`; the Code Connect files of Carbon (`Choose a time`, `hh:mm`) and Coveo (`Awesome chip`) target sample copy for exactly this reason, and each mapping breaks the day the copy is edited. Code Connect's wildcard matches only at the end of a name (`figma.children('Icon*')`), and matching is case-sensitive, so anything placed at the front of a name has to be typed into every match string. And a layer named differently across a set's variants keeps the override in some variants and drops it in others.

**What to do.** Rename every text layer in a published component once, even to the word it already shows. Name frames by their job (`Container`, `Content`, `Actions`), never leave `Frame 427`, and use frames, never groups: a group has no auto layout and constraints resolve to the nearest parent frame. Keep each name identical in every variant.

---

## 3. What should properties be called?

**The short answer.** The bare noun the code uses for text and swaps; `Show` on a boolean that reveals an element; a bare word for a state. The evidence is a count of what kits ship, and the toolkit has ruled on the ties.

**Text properties.** Of 359 unique text-property names in the 23 kits, 181 (50%) are a bare noun, the main style in 14 kits; 106 (30%) end in `text`, the main style in only four (Carbon, IBM Products, Infineon, Qualcomm), which suffix nearly every text property (Carbon 32 of 46) so the suffix distinguishes nothing. The blind re-run found bare nouns in 38 of 40 kits. MUI's props carry no suffix except `helperText`. So `Label`, `Title`, `Placeholder`, and `Helper text` only where the code prop says it.

**Booleans.** Of 624 unique boolean names, 408 (65%) are bare (`Disabled`, `Divider`). `Show X` (117) is the prefix that turns up in volume, `Has X` 32, `Is X` 18 (MetaMask alone uses it as its style, because its Figma names copy code props), `X?` 17 (Primer alone). The case that needs a rule is a boolean sharing a noun with a text, swap or slot property, which happened 108 times in 17 kits, split five ways:

| Shape | Kits | Example |
|---|---|---|
| `Has X` with bare `X` | 5 | Simple Design System: `Has Label` with `Label` |
| `Show X` with bare `X` | 5 | Firefox: `Show heading` with `Heading` |
| bare boolean, `X text` | 5 | Carbon: `Label` with `Label text` |
| bare boolean, glyph text | 5 | lifinance: `Title` with `↳ Title` |
| `Show X` with `X text` | 4 | Carbon: `Show helper` with `Helper text` |

The text-property majority breaks the tie: once text properties take the bare noun, the boolean has to carry the mark, and `Show` is the most common verb prefix and reads as an instruction. The blind re-run found `Show X` with bare `X` the most common pair (13 kits).

**Prefix grammar in code.** React Spectrum's written grammar (`is` for state, `allows` for permission, `should` for behaviour) is house style; its maintainers' answer to "why not `disabled`" was "consistency between all boolean props". Chakra dropped the prefix in v3 (`isDisabled` became `disabled`), no major system went the other way, and Ant Design reached bare words independently. The concrete bug the bare form avoids is a component accepting both `disabled` and `isDisabled`. In Figma, whatever the code does, never mix grammars in one component.

**Instance swaps.** Name the thing, not the mechanism: plain `Icon` is the most common swap name, and only Carbon, IBM Products and Coveo put "swap" in a name. Position words split four ways (prefix/suffix 11 names, left/right 7, leading/trailing 7, start/end 2); `Leading` and `Trailing` win the tie because they stay true when a right-to-left layout mirrors the component, which `Left` does not.

**Variant values.** Values follow the axis's casing (`Size: Small`), and a True/False variant is spelt `True`/`False`, Figma's default (76 axes use lowercase, 51 capitalised; the lowercase ones are kits that case everything like code). Keep values abstract, as GitLab Pajamas puts it: `Color: muted, enhanced`, never `light gray, blue`.

**Where the toolkit has ruled.** `standards/figma-standard.md` rule 21 adopts this evidence and settles the ties: bare noun for text, `Show` for a boolean that reveals text, an instance or a slot, a bare word for a boolean that only switches a style (`AI`, ruled 12 October 2026 because the code has `variant="ai"`, no `show` prop), a True/False *variant* is a state and stays bare (`Disabled`, `Open`), never `Is`, and `Has` is kept for a variant that reflects content (`Has value`). Rule 5 puts the revealing boolean directly above the property it fills, and found that `componentPropertyDefinitions` does not return panel order, so no script can check it. Rule 21 also forbids two properties sharing a name: Figma allows it, because each property's real key carries a generated suffix (`Label#4:0`), but then shows those ids to everyone who sets them.

**Size values are the one open split.** The blind re-run found Size values written as words (`Small`, `Medium`, `Large`) in 27 kits and as codes in 20, and MUI's code says `small`, `medium`, `large`. The toolkit ruled the other way (rule 6, 7 October 2026): lowercase t-shirt names, largest first, as one unbroken run (`lg`, `md`, `sm`), because `size="sm"` is how most frameworks write it and `2xl` extends without renaming. Both are defensible; a library targeting MUI pays a one-word mapping either way.

**What to do.** `Label` and `Show label`, `Icon` and `Show icon`, `Leading icon` and `Trailing icon`, `Disabled` as a bare True/False variant. Take the code's word for every property where the code has one. Casing is absorbed by a Code Connect mapping (`figma.boolean('Disabled')` onto `disabled`); vocabulary is not.

---

## 4. How should a part be named?

**The short answer.** Its family plus its own last word, joined by a space, one level deep. No surveyed kit chains every ancestor.

Counting each of 33 kits once by how it joins parent and part:

| Join | Kits | Examples |
|---|---|---|
| Space | 12 | Simple Design System `Menu Item`, Carbon `_Menu list item`, Qualcomm `_Breadcrumb item` |
| No parent in the name | 7 | Equinor `Leading Content`, `Description` |
| Slash folder | 5 | MUI's own kit `Card/Elements/CardHeader`, Synergy `_helper/syn-card/footer`, Helios `Dropdown / ToggleIcon` |
| Dot | 2 | Primer `_PageHeader.Title`, Coveo `.Accordion.Item` |
| Other | 7 | kebab `.card-header` (Lumen, Accor), camel `BannerBase` (MetaMask) |

The blind re-run agreed (space join in 13 of 46 kits, the most common). Only Carbon puts ` - ` in a part name, six times, as a family or variant suffix (`UI shell - Header actions`), never as a chain. Two or three levels appear only where every level is a component in code: lifinance's `.Sidebar Menu Button` is `Sidebar`, `SidebarMenu`, `SidebarMenuButton`, as MUI chains `List`, `ListItem`, `ListItemText`. No kit chains through a layout wrapper that has no code component.

Kits built to mirror code (Primer, Simple Design System, lifinance, Coveo) take the code's compound name; kits not built from code drift (Infineon's `Dropdown Menu Item` for `ifx-dropdown-item`, `_Tabs Items` for one tab). MUI's own kit chose slash folders that end in the export name, which buys string-equal names with code at the cost of a casing no sentence-case library uses elsewhere.

**Worked example.** One project library chained every ancestor with ` - `: 83 of its 214 components, up to five levels (`Sidebar dialog - Modal - Sidebar - Section - Item`). Under the kit majority that becomes `Sidebar dialog item`, dropping `Modal` and `Sidebar` because they are layout wrappers, not components. The toolkit adopted exactly this as `standards/figma-standard.md` rule 9 on 7 October 2026 and applied it the same day to one library (72 components, 29 nested instances renamed).

**The marks.** `_` for a part that does not publish (Primer, Carbon, Infineon, Qualcomm, Synergy; `.` in lifinance, Coveo, Sikt, Codecademy). ` / ` only between interchangeable siblings of one part, a virtual set (`Cell / Fill`, `Cell / Hug`); the one kit precedent is Primer's `NavList.Item/SubItem`. The toolkit adds ` - ` before a *flavour* built separately (`Button - CTA`, `FAB - AI`, rule 20), which is Carbon's use of the hyphen, not a chain. A slot filler stays unprefixed, because Figma offers only published components in a slot (rule 8).

**What to do.** `Card header`, `Dialog actions`, `List item button`, in the code's suffix vocabulary (`Content`, `Actions`, `Header`, `Label`, `Icon`). One level per real component, none for a wrapper.

---

## 5. What should a nested instance's layer be called?

**The short answer.** A nested public component keeps its own name. A part, under the toolkit's rule, takes only its last word. Repeats are told apart by role or number. Never a variant value.

The kits mostly keep the component name on the layer (`Button`, `Avatar`, Carbon's `figma.children(['_Menu list item'])`), because it is Figma's default, costs no override, and matches what Code Connect looks for. Role names are a minority and cluster where instances repeat (Primer's `Primary` and `Secondary`); lists are numbered (NYSDS `Option 1` to `Option 10`) or matched with a wildcard (`TabItem*`). A layer named `_Menu item / Default` on an instance now showing `Selected` is simply false.

The toolkit departs from the kit majority for parts: rule 9 names a part's layer inside its parent by its last word (`Item`, `Cell`, `Header`), on the argument that position already says whose part it is, so repeating the family turns the layer tree into an index. A public component nested somewhere keeps its own name (rule 10). The cost is one alias per part for a Code Connect file to know, which the kit evidence warned of (one library had renamed 132 of its 278 nested instances, mostly to such last words); the toolkit judged the shorter tree worth it once part names had become short.

The toolkit also tested where the name must be set, on throwaway copies on 8 October 2026: a layer-name override on a nested instance *resets* when the parent switches variant. So a layer is named in the component, never by an override on a consumer's instance (rule 10). The same run found that text edited inside a nested instance is stored per variant of that instance and is dropped when the instance changes variant inside its parent; the same items placed in a slot kept their text (rule 38).

**What to do.** Name nested layers in the main component. Keep a public component's name; give a part its last word; number or role-name repeats. Bind a nested instance to an instance-swap property wherever possible, because Code Connect then reaches it by the stable property name instead of the layer name.

---

## 6. What should the default text say?

**The short answer.** Realistic copy for words a person writes, a brace placeholder for values a machine supplies, never lorem ipsum, and the longest plausible string on the documentation page rather than in the default.

The default travels further than any other choice here: into every new instance, the assets panel, documentation screenshots and any snippet a generator writes before a designer overrides it.

| Default | What a generated snippet says | What happens next |
|---|---|---|
| `{{date}}` | `label="{{date}}"` | visibly wrong; never committed by accident |
| `14 Jan 2026` | `label="14 Jan 2026"` | plausible; committed as a hard-coded string |

Code Connect passes a default straight into generated code, so a conspicuously fake default for dynamic content is a safety feature. For human-written words the case runs the other way: Nielsen Norman Group's work on prototype copy and form placeholders finds that placeholder text hides usability problems and defers layout failures, because it runs shorter than real content (commercial research, but the mechanism is not disputed). Braces belong in *content*, where they come from (content-authoring plugins); no published system uses them as *layer* names, and at the front of a name they block the trailing wildcard. Handle length apart from wording: German runs roughly 20 to 35% longer than English (a vendor figure), so a string variable with a long-text mode stresses the layout without making the default unreadable.

**What to do.** `Save changes`, not `Label`. `{{date}}` for a timestamp. Never lorem ipsum in a published component.

---

## 7. Which renames are safe after adoption?

**The short answer.** A consistent layer rename keeps overrides; a layer named differently across variants loses them; a renamed property fails the Code Connect publish; a renamed variant *value* publishes cleanly and breaks an enum mapping silently.

| What is renamed | What breaks | How it is discovered |
|---|---|---|
| A code prop | every consumer | a build error; codemods are the remedy |
| A Figma property | Code Connect mappings holding the literal name | a failed publish |
| A Figma variant value | an enum mapping, whose keys must be the exact literal values and are not normalised (Code Connect docs) | not at all, until the snippet is wrong |
| A Figma layer, consistently | `figma.children` mappings | a failed publish; overrides survive, since they follow layer identity |
| A Figma layer, in some variants only | overrides on variant switch | when a consumer switches variant and their content is gone |

The layer row was tested on 1 October 2026 with local components: renaming and wrapping a layer kept every override on update; overrides were lost only on switching to a variant whose layer names differed. That ran inside one file, not through publish and accept. Whether `figma.children` reaches past direct children is still undocumented: Code Connect's React docs say only that it takes "the name of the instance layer within the parent component", and the request to combine properties from nested instances ([code-connect #11](https://github.com/figma/code-connect/issues/11)) remains open.

**What to do.** Treat property, value and layer names as versioned interfaces. Search Code Connect files before renaming; rename in every variant at once; ship a rename in a published library as a release with a deprecation path.

---

## 8. Slots and optional content

**The short answer.** A guarded single icon is still an instance swap plus a `Show icon` boolean; a freeform area is a slot. Slot names have almost no precedent yet.

Figma's help centre draws the line itself: an instance swap is for a slot limited to "at most, one instance at a time"; a slot is for freeform content, such as a modal body. Re-checked in November 2026, the limitation that matters for icons still stands: "Component properties cannot be applied to layers from inside a slot", so a `Show icon` boolean that also shifts a sibling's spacing cannot be wired the same way once the icon lives in a slot. Code Connect maps slots with `figma.slot()` and, by default, "does not traverse slot children", rendering a reference to the slot instead; Figma's MCP support for slots is listed as "coming soon".

Only three of the 23 kits mapped a native slot (lifinance `Content slot`, MetaMask `startAccessory`, Codecademy `body`). The toolkit has ruled (rule 21): `Slot` by default, `Leading slot` or `Trailing slot` at either end of a horizontal layout, a slot holding repeated items named for them (`Items slot`), and a boolean showing a slot is `Show` plus its name.

---

## 9. Cheat sheet

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

## 10. The short version

Names inside a component are read by override matching, Code Connect and code generators, so they behave like an API. Use the code's words: `Label`, not `Label text`; `Icon`, not `Icon swap`; `Leading` and `Trailing`, not left and right. Mark a boolean that reveals an element with `Show`; leave states and style switches bare. Name a part as its family plus its last word, joined by a space, never a chain of ancestors. Name every layer in the main component, identically in every variant, and rename each text layer once so it stops tracking its copy. Realistic default copy for words, braces for machine values. A consistent layer rename is safe; a layer that differs across variants, and a renamed variant value under an enum mapping, fail silently.

---

## 11. What to re-check later

- **Slots.** Property binding inside a slot is still impossible (November 2026); once it ships, the guarded-icon advice in section 8 can move to slots.
- **Selective exposure of nested properties.** Requested on Figma's forum since 2022, not shipped as of November 2026; it would change how parts are split (see [what the State axis models](what-the-state-axis-models.md), section 5).
- **`figma.children` depth.** Undocumented; test before relying on wrappers.
- **Evidence quality.** No published research measures whether any boolean grammar or layer scheme reduces handoff defects. The counts say what is common, not what works better, and Code Connect shows only the names a kit maps, so per-kit counts are lower bounds. The Figma files themselves were not opened. The toolkit's Claude test of aligned names was small.
- **Agreement.** Compound, Accor and Pajamas sit downstream of the same Figma guidance, so their agreement is closer to one source with echoes; Ant Design's bare booleans are the independent data point.

---

## Sources

**Figma**
- [Plugin API: `name` and `autoRename`](https://developers.figma.com/docs/plugins/api/properties/nodes-name/)
- [Plugin API: `componentPropertyDefinitions`](https://developers.figma.com/docs/plugins/api/properties/ComponentPropertiesMixin-componentpropertydefinitions/)
- [Code Connect for React](https://developers.figma.com/docs/code-connect/react/) (wildcards, case sensitivity, enum literals, `figma.slot`)
- [Use slots to build flexible components](https://help.figma.com/hc/en-us/articles/38231200344599-Use-slots-to-build-flexible-components-in-Figma) and [slots, instance swaps and variants](https://help.figma.com/hc/en-us/articles/38741465279895-The-difference-between-slots-instance-swaps-and-variants)
- [Explore component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties) (simplified instances deprecated 23 March 2026)
- [Swap components and instances](https://help.figma.com/hc/en-us/articles/360039150413-Swap-components-and-instances) and [Apply changes to instances](https://help.figma.com/hc/en-us/articles/360039150733-Apply-changes-to-instances)
- [Best practices to help Figma AI understand your design system](https://help.figma.com/hc/en-us/articles/38978644498199-Best-practices-to-help-Figma-AI-understand-your-design-system)
- [Groups versus frames](https://www.figma.com/best-practices/groups-versus-frames/)
- [Jake Albaugh, The Shared Language of Props](https://www.figma.com/blog/the-shared-language-of-props/)
- [Forum: selective exposure of nested properties](https://forum.figma.com/suggest-a-feature-11/allow-selective-exposure-of-nested-component-properties-48984); [code-connect issue #11](https://github.com/figma/code-connect/issues/11)

**Systems**
- [React Spectrum API guidelines](https://github.com/adobe/react-spectrum/blob/main/specs/api/Guidelines.md) and [discussion #6045](https://github.com/adobe/react-spectrum/discussions/6045)
- [MUI API design approach](https://mui.com/material-ui/guides/api/)
- [Chakra UI migration to v3](https://chakra-ui.com/docs/get-started/migration)
- [Ant Design API naming rules](https://github.com/ant-design/ant-design/wiki/API-Naming-rules)
- [GitLab Pajamas, designing with the UI kit](https://design.gitlab.com/get-started/design/) and [UI kit components](https://design.gitlab.com/get-started/uik-components/)
- [MUI design kits releases](https://github.com/mui/mui-design-kits/releases) (5.9.0 `Card/Elements/CardHeader`)
- [Compound, component properties](https://compound.thephoenixgroup.com/latest/figma/components/component-properties-uJbaUrky); [Accor, component naming in Figma](https://design.accor.com/latest/terminology/component-naming/in-figma-pBV4ljc5-pBV4ljc5)

**Code Connect files (default branches, 5 October 2026)**
- [Simple Design System InputField](https://github.com/figma/sds/blob/main/src/figma/primitives/InputField.figma.ts), [Firefox moz-message-bar](https://github.com/mozilla-firefox/firefox/blob/main/toolkit/content/widgets/moz-message-bar/moz-message-bar.figma.ts), [Carbon ComboBox](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/ComboBox/ComboBox.figma.ts), [Carbon Menu](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/Menu/Menu.figma.tsx), [lifinance alert](https://github.com/lifinance/design-system/blob/main/registry/core/ui/alert.figma.tsx), [lifinance sidebar](https://github.com/lifinance/design-system/blob/main/registry/core/ui/sidebar.figma.tsx), [Primer TextInput](https://github.com/primer/react/blob/main/packages/react/src/TextInput/TextInput.figma.tsx), [Primer PageHeader](https://github.com/primer/react/blob/main/packages/react/src/PageHeader/PageHeader.figma.tsx), [Primer NavList](https://github.com/primer/react/blob/main/packages/react/src/NavList/NavList.figma.tsx), [Coveo Accordion](https://github.com/coveo/plasma/blob/master/packages/figma/src/Accordion.figma.tsx), [Equinor Button](https://github.com/equinor/design-system/blob/main/packages/eds-core-react/src/components/next/Button/Button.figma.tsx), [NYSDS checkbox](https://github.com/ITS-HCD/nysds/blob/main/packages/nys-checkbox/src/nys-checkbox.figma.ts), [Codecademy MenuItemFixed](https://github.com/Codecademy/gamut/blob/main/packages/code-connect/Molecules/Menu/MenuItemFixed.figma.tsx)

**Commentary**
- [Nathan Curtis, Components as Data](https://medium.com/@nathanacurtis/components-as-data-2be178777f21)
- [NN/g, A Downside of Fake Copy in UI Prototypes](https://www.nngroup.com/videos/fake-copy/)
- [SimpleLocalize, text expansion](https://simplelocalize.io/blog/posts/text-expansion-ui-localization/) (vendor figure)
- [Hypermatic CopyDoc placeholders](https://docs.hypermatic.com/copydoc/library/placeholders) (where `{{ }}` comes from)

**Toolkit**
- `standards/figma-standard.md` rules 5, 6, 8, 9, 10, 18, 20, 21, 38; `standards/naming-preferences.json`
