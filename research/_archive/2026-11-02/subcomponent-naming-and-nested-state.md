# Subcomponent naming and nested state in real Figma kits

How shipping design-system kits name the parts of a component, and how they handle a parent whose nested child has its own state axes. Sections 1 to 3 report what real kits do; section 4 turns that into recommendations for Suiteify, with worked names.

Researched 5 October 2026 for Suiteify, whose library names parts by chaining every ancestor (`🚧 Sidebar dialog - Modal - Sidebar - Section - Item`), marks private parts with `_`, and uses ` / ` for siblings deliberately split out of one set (`_FAB (AI) - Button / Default` and `_FAB (AI) - Button / Open`).


**Independent check, 6 October 2026.** A blind re-run on 6 October 2026, over 46 kits and 1,998 Code Connect files collected independently, reached the same conventions: space-joined part names in 13 kits (the most common; ` - ` only in Carbon, 6 names), bare-noun text properties in 38 of 40 kits (322 of 489 names), `Show X` with a bare `X` as the most common boolean pair (13 kits), `Icon` as the most common swap name, a `State` axis in 33 of 46 kits, and Size values as words (`Small`, `Medium`, `Large`) in 27 kits against codes in 20.
---

## What this answers

- How do real kits name subcomponents, and how many levels of ancestry go into a name?
- Do Figma part names match the code's names?
- What separators and privacy prefixes do kits use, and does any use ` / ` for split siblings?
- When a parent nests a child with its own states, how do kits stop invalid combinations, such as an open FAB holding a closed button?
- So what should Suiteify name its parts, and how should it build the FAB?

---

## How the evidence was gathered

Every kit name below was read from a public **Code Connect** file: the `*.figma.tsx` or `*.figma.ts` files a team writes to link its Figma components to its code. These files name the Figma layers they read (`figma.children("Menu Item")`), and they sit beside the code component they map to, so each one shows the Figma name and the code name side by side.

The sweep covers 33 kits: 28 public repositories with Code Connect files, and five kits read from their own release notes or pages instead (MUI's Figma design kits, HashiCorp Helios, the GitLab UI kit, Untitled UI and Accor). Names of nested instances and text layers come from the same files, through the layer names they read (23 repositories, 1,103 Code Connect files).

One limit applies throughout. Code Connect matches an instance's **layer name**, which defaults to the component name but can be renamed. So these names are strong evidence of what the kit calls the component, not proof. The Figma files themselves could not be opened: the Figma REST token used for this returned `403 Token expired`. Material 3, Atlassian, Polaris, Ant Design, GOV.UK, SAP and Uber Base yielded no usable part names, and none are quoted from memory.

---

## 1. How do real kits name subcomponents?

**The short answer.** Parent plus part, usually one level deep. No kit found chains every ancestor; only Carbon uses ` - `, and only for six family or variant names (`UI shell - Header actions`, `_Structured list row item - Selectable`).

| Kit | Figma names (verbatim) | Code names | Source |
|---|---|---|---|
| Figma Simple Design System | `Menu Item`, `Menu Header`, `Menu Section`, `Accordion Item`, `Dialog Body`, `Text Link List Item` | `MenuItem`, `MenuHeader`, `AccordionItem`, `DialogBody`, `TextLinkListItem` | [figma/sds](https://github.com/figma/sds/tree/main/src/figma/primitives) |
| GitHub Primer | `_PageHeader.Title`, `_PageHeader.TitleArea`, `_PageHeader.LeadingAction`, `FormControl.Label`, `SegmentedControl.Button`, `TabNav.Link` | `PageHeader.Title`, `FormControl.Label`, `SegmentedControl.Button` | [PageHeader.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/PageHeader/PageHeader.figma.tsx) |
| LI.FI (built on shadcn/ui) | `.Sidebar Menu Button`, `.Card Footer`, `.Item Media`, `Card Header` | `SidebarMenuButton`, `CardFooter`, `ItemMedia`, `CardHeader` | [sidebar.figma.tsx](https://github.com/lifinance/design-system/blob/main/registry/core/ui/sidebar.figma.tsx) |
| Coveo Plasma | `.Accordion.Item`, `.Input.Label` | `Accordion.Item` | [Accordion.figma.tsx](https://github.com/coveo/plasma/blob/master/packages/figma/src/Accordion.figma.tsx) |
| Carbon for IBM Products | `_Breadcrumb bar`, `_Tab bar` | `PageHeader.BreadcrumbBar`, `PageHeader.TabBar` | [carbon-design-system/ibm-products](https://github.com/carbon-design-system/ibm-products) |
| Infineon | `_Dropdown Menu Item`, `_Tabs Items` | `ifx-dropdown-item`, `ifx-tab` | [Infineon design system](https://github.com/Infineon/infineon-design-system-stencil) |
| Synergy | `_helper/syn-card/footer`, `_helper/syn-dialog/footer` | `syn-card` with `slot="footer"` | [synergy-design-system](https://github.com/synergy-design-system/synergy-design-system) |

**How deep the names go.** Most parts carry one level: `_PageHeader.Title`, `.Card Footer`, `Menu Item`. Two or three levels appear only where every level is itself a component in code. `.Sidebar Menu Button` is `Sidebar`, then `SidebarMenu`, then `SidebarMenuButton`, the same way MUI chains `List`, `ListItem`, `ListItemText`. No kit chains through a layout wrapper that has no code component of its own. Synergy's `_helper/syn-card/footer` is the longest name found, and it is a folder path, not ancestry.

**Across all 33 kits.** Counting each kit once by how it joins parent and part:

| Join | Kits | Examples |
|---|---|---|
| Space | 12 | Figma SDS `Menu Item`, Carbon `_Menu list item`, Qualcomm `_Breadcrumb item`, GitLab `❖ _Base body cell` |
| No parent in the name | 7 | `Leading Content`, `Description` (Equinor, Wanted Montage and five others) |
| Slash | 5 | MUI's own Figma kit `Card/Elements/CardHeader`, Synergy `_helper/syn-card/footer`, Helios `Dropdown / ToggleIcon`, Firefox `Dropdown / Menu / Native`, Sikt |
| Dot | 2 | Primer `_PageHeader.Title`, Coveo `.Accordion.Item` |
| Other | 7 | kebab `.card-header` (Lumen, Accor), camel `BannerBase` (MetaMask, Serendie), mixed (CMS, Codecademy), underscore (Apsara) |

Only Carbon puts ` - ` in part names, six of them, as a family or variant suffix (`UI shell - Header actions`, `_Structured list row item - Selectable`), not as a chain of ancestors.

**What Suiteify's own code does.** The same: `ListItem`, `ListItemText`, `SidebarNavItem`. In `SidebarSecondary`, sections and items are not components at all; they are rows of a data type, `SidebarSecondaryGroup`.

**What the evidence shows.** Kits built to mirror their code (Primer, Figma SDS, LI.FI, Coveo) name parts with the code's compound name. Kits not built from code drift: Carbon for IBM Products drops the parent, and Infineon adds a word the code lacks (`Dropdown Menu Item` for `ifx-dropdown-item`) and pluralises a single tab (`_Tabs Items`).

---

## 2. What separators and privacy prefixes do kits use?

**The short answer.** A space or a dot between words, `_` or `.` for private parts, and `/` for folders. One kit uses `/` for a sibling split.

- **Separators.** A plain space, matching the code name with spaces added: Figma SDS, LI.FI, Infineon, Carbon. A dot, copying the code's dot notation: Primer, Coveo. A slash as a folder path: Synergy, Sikt (`.Toggle/Segment/Single`), and MUI's own Figma kit, whose parts are folders ending in the code name (`Card/Elements/CardHeader`, `DataGrid/Elements/Cell`). Apart from Carbon's six family names, no kit uses ` - ` between parent and part.
- **Privacy prefixes.** `_`: Primer, Carbon, Infineon, Qualcomm, Synergy. `.`: LI.FI, Coveo, Kajabi Pine, Sikt, Codecademy Gamut. Kits mix public and private parts under one parent: LI.FI's `Card Header` is public while `.Card Footer` is private.
- **` / ` for split siblings.** One real case. Primer has `NavList.Item` and a separate component `NavList.Item/SubItem`: `.` carries the hierarchy and `/` marks a sibling split ([NavList.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/NavList/NavList.figma.tsx)). That matches Suiteify's FAB convention. No other kit found uses `/` that way, and no kit uses ` - ` for hierarchy beside ` / ` for siblings.

**What the evidence shows.** Suiteify's `_` prefix matches common practice and its ` / ` sibling split has one precedent. Its ` - ` ancestry chain has none.

---

## 3. How do kits handle a nested child with its own states?

**The short answer.** Three patterns appear, and one kit documents its invalid combinations openly. No kit found splits a child into separate components per state as Suiteify's FAB does, and none says in writing that it hides a nested instance to block invalid combinations.

The problem: Figma's nested-instance exposure is all or nothing per instance. Once a nested instance is exposed, every one of its properties appears, including its state axes. Users have asked Figma to allow choosing individual properties since at least December 2025 ([forum request](https://forum.figma.com/suggest-a-feature-11/allow-selective-exposure-of-nested-component-properties-48984)), with no staff reply on the thread.

**Pattern 1: the parent owns the state, the child keeps its own axes.** IBM Carbon's `MenuButton` has an `Open` variant on the parent, while the nested `Button` keeps its own `Style` and `State` axes; Code Connect reads `disabled` from the nested button's `State` ([MenuButton.figma.tsx](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/MenuButton/MenuButton.figma.tsx)). Carbon has tracked a related mismatch in its own issue tracker, props that live on `Tabs` in code but sit on each `Tabs item` in Figma ([issue #17607](https://github.com/carbon-design-system/carbon/issues/17607), since marked fixed); the issue does not discuss `MenuButton`. The CMS Design System and Coveo Plasma drive state from the parent too, with private children (`.accordion-label`, `.Input.Label`) that supply only text and booleans ([CMS Accordion.figma.tsx](https://github.com/CMSgov/design-system/blob/main/packages/design-system/src/components/Accordion/Accordion.figma.tsx), [Plasma Select.figma.tsx](https://github.com/coveo/plasma/blob/master/packages/figma/src/Select.figma.tsx)).

**Pattern 2: the state lives on the child only.** In Primer, the parent `SegmentedControl` has only `size`; each `SegmentedControl.Button` has `selected`. Nothing structural stops zero or two buttons being selected. Primer's `ActionMenu` has `open` on the parent and takes its trigger as a swappable child that keeps its own button states ([primer/react](https://github.com/primer/react/tree/main/packages/react/src)).

**Pattern 3: avoid nesting the full component.** GitLab Pajamas does not nest base components in its UI kit, citing file bloat, hidden layers and properties, and nested overrides that are preserved less reliably. Where one component needs another, it sometimes builds a simplified version directly inside the parent rather than nesting the full instance with all its variants, and keeps the copies in step through a hidden variable collection; its `Tab item` badge is built this way ([Pajamas UI kit](https://design.gitlab.com/get-started/uik-components/)). In code, Material 3 makes the open FAB a separate component, `ToggleFloatingActionButton`, inside `FloatingActionButtonMenu`, rather than a state of the FAB ([Compose Material 3 reference](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary)).

**One kit with open states on both levels.** Untitled UI describes dropdown triggers with default, hover, focused and open states, and separately open and closed variants of the whole menu, which allows a mismatch. This comes from a search snippet of its components page, not a file read.

**What the evidence shows.** Carbon accepts invalid nested combinations and tracks them as gaps. Primer leaves selection to each child. Pajamas avoids nesting full instances. A per-state split like Suiteify's FAB has no direct Figma precedent; Material 3's separate toggle component is the nearest, and it is in code.

---

## 4. What should Suiteify do?

**The short answer.** Name a part as its published parent plus the part, joined by a space in sentence case as the largest group of kits does (12 of 33), keep `_` for private parts and ` / ` for split siblings, and choose how to build a stateful child by what the parent needs to expose from it.

### Naming

The rule, in the shape every code-mirroring kit uses:

1. **Start from the published component the designer places**, not the frame it happens to sit in. For the Sidebar dialog page that is `Sidebar dialog`.
2. **Add the part's own name.** One level is the norm (`_PageHeader.Title`, `.Card Footer`, `Menu Item`).
3. **Chain a middle level only if it is itself a component a designer can see or code has**, as `Sidebar Menu Button` chains through `SidebarMenu`. Drop wrappers that exist only to lay things out, such as `Modal` and `Sidebar` inside the dialog.
4. **Where code exists, use the code's words.** `ListItemText` in code is `List item text` in Figma, not a new description of the same part.
5. **Keep `_` for private parts** (Primer, Carbon, Infineon, Qualcomm and Synergy use it) and **keep ` / ` for siblings split out of one set**, which has one precedent (Primer's `NavList.Item/SubItem`) and is the separator the project's context document already records for virtual sets.

**The separator, following the kits rather than the file.** Most code-mirroring kits join parent and part with a plain space and let the code name be the same words run together: Figma SDS `Menu Item` is `MenuItem`, LI.FI `.Sidebar Menu Button` is `SidebarMenuButton`, Carbon `_Tab bar`, Infineon `_Dropdown Menu Item`, Qualcomm `_Breadcrumb item`. Primer and Coveo use a dot instead, because their Figma names copy PascalCase code (`_PageHeader.Title`); Suiteify's sentence-case names would have to change case throughout to follow them. Only Carbon uses ` - `, for a handful of family names. So the industry-aligned form for Suiteify is the space join in sentence case, which turns into the code name by capitalising each word and removing the spaces.

The strongest alternative is the slash folder, and it has a code-parity case of its own: MUI's own Figma kit names parts `Card/Elements/CardHeader`, ending in the exact MUI component name, and Suiteify's code is built on MUI. It is the choice of 5 kits against 12 for the space join, and it would put parts into folders in the assets panel, which is a larger change to the library's layout than a rename. This guide keeps the space join and records the slash folder as the alternative to revisit if code parity comes to outweigh the shorter names.

The other two marks stay: `_` for private parts (Primer, Carbon, Infineon, Qualcomm, Synergy) and ` / ` for siblings split out of one set (Primer's `NavList.Item/SubItem`), which is also the separator the project's context document records for virtual sets.

Applied to the Sidebar dialog page:

| Before | After | Code name |
|---|---|---|
| `🚧 Sidebar dialog` | unchanged | `SidebarDialog` |
| `🚧 _Sidebar dialog - Modal` | `🚧 _Sidebar dialog modal` | `SidebarDialogModal` |
| `🚧 _Sidebar dialog - Modal - Sidebar` | `🚧 _Sidebar dialog sidebar` | `SidebarDialogSidebar` |
| `🚧 Sidebar dialog - Modal - Sidebar - Section` | `🚧 Sidebar dialog section` | `SidebarDialogSection` |
| `🚧 _Sidebar dialog - Modal - Sidebar - Section - Header` | `🚧 _Sidebar dialog section header` | `SidebarDialogSectionHeader` |
| `🚧 Sidebar dialog - Modal - Sidebar - Section - Item` | `🚧 Sidebar dialog section item` | `SidebarDialogSectionItem` |

And elsewhere in the library, the same rule:

| Before | After |
|---|---|
| `🚧 _Accordion - Header` | `🚧 _Accordion header` |
| `🚧 _Button group - Leading button` | `🚧 _Button group leading button` |
| `_Split button - Trailing button` | `_Split button trailing button` |
| `_FAB (AI) - Button / Default` | `_FAB (AI) button / Default` |
| `_FAB (AI) - Button / Open` | `_FAB (AI) button / Open` |

**The cost.** 83 of the library's 214 components use ` - ` today (74 of the 138 published ones), five levels deep at most. Renaming does not break instances, but it changes every name the parity map, the audit record and the documentation pages key on, and product files see the new names on the next library update. Not every ` - ` is a part, either: `Button - AI` is a flavour of Button, not a part of it, and needs its own decision.

The code names in the third column are the same words, as `List`, `ListItem` and `ListItemText` are in Suiteify's code today.

### Nested instance names

A nested instance is a component placed inside another component's definition. Its layer name starts as the component's name and can be renamed, and Code Connect files find nested instances by that layer name. In the kits' files most nested instances keep the component name (`Button`, `Avatar`, `Menu`, `Text input`). Role names are the minority: Primer's `trigger` and `leadingVisual`, Carbon's `Menu trigger`. Where one component holds several instances of the same child, kits number them (NYSDS `Option 1` to `Option 10`, LI.FI `Col 1` and `Col 2`) or match them all with a wildcard (`Col*`, `TabItem*`).

Suiteify renames 132 of the 278 nested instances in its library, almost half. The most frequent renames cut a long chained name down to its last word:

| Layer name in the parent | Component it is an instance of | Times |
|---|---|---|
| `Item` | `Sidebar - Section - Item` | 10 |
| `Cell` | `Table - Column - Cell / Hug` | 10 |
| `Page` | `_Pagination - Page item` | 9 |
| `Tab` | `Nav bar/_Tab item` | 5 |

Each rename makes the layer panel shorter to read, and each one is a second name a Code Connect file or the parity map has to know. Once parts follow the space join above, the component name is short enough to keep: `Sidebar section item` needs no `Item` alias.

The rule, following the majority: keep the component name on a nested instance. Rename only to tell repeated instances of one child apart, by role (`Primary`, `Secondary`) or by number (`Item 1`, `Item 2`).

### Nested state

Choose by one question: **what does the parent need to expose from the child?** Each answer has a kit that does it.

| What the parent needs from the child | Build | Kits doing it | Invalid combinations |
|---|---|---|---|
| Nothing: the parent's state decides the child's look | one child set with the state axis; the parent swaps the child's variant per its own state and does **not** expose the nested instance | Carbon `MenuButton`, CMS `AccordionItem`, Coveo `Select` | reachable only by drilling into the nested layer |
| Some properties (an icon, a label) but not the state | split the child per state into siblings with ` / `, and expose the nested instance | Primer's `NavList.Item/SubItem` for the naming; no kit found for the per-state split itself | the state is not a property, so it cannot be set wrong from the panel; an instance swap still could |
| Some properties, and the team would rather not publish a second component | build a simplified copy of the child inside the parent with only the needed properties | GitLab Pajamas "integrated components" | none from the panel; the copy must be kept in step by hand or by shared variables |
| The state genuinely belongs to each child (which tab is selected) | state on the child only | Primer `SegmentedControl.Button`, `UnderlineNav.Item` | accepted: two selected tabs are possible, as in Primer |

Applied to the FAB:

- **If designers never change anything on the FAB's inner button,** merge the two siblings into one set, `_FAB (AI) button`, with an `Open` axis (`False`, `True`). The `Open=True` side has only Rest, Focus, Hover and Press; the `Open=False` side adds Loading and Disabled, so the set is sparse. `FAB (AI)` sets the button's variant in each of its own variants and does not expose it. This is Carbon's structure.
- **If designers need to reach something on the inner button** (its icon, a badge) without reaching its state, keep the split, renamed under section 4's rule: `_FAB (AI) button / Default` and `_FAB (AI) button / Open`, exposed from `FAB (AI)`. Write the reason in the component description, because the split is a deliberate guard, not an oversight, and no other kit found documents one.

Either way, code has one `open` prop; Figma's structure only decides what a designer can set wrong in a mockup.

**What to do.** Rename parts to the space-joined form in the tables above, starting with the Sidebar dialog page. Leave nested instances under their component names, renaming only repeats. Decide the FAB by asking whether anything on the inner button must be exposed; if nothing, merge it into one set, and if something, keep the split and say why in its description.

---

## 5. The short version

Real kits name a part as its parent plus the part, almost always one level deep, and kits that mirror their code reuse the code's compound name (`_PageHeader.Title`, `.Sidebar Menu Button`). Deeper names appear only when every level is a code component. Separators are a space or a dot; privacy is `_` or `.`; `/` is a folder, with one exception, Primer's `NavList.Item/SubItem`, which uses it for a sibling split as Suiteify does. Across 33 kits the space join is the largest group (12), ahead of no parent in the name (7) and slash folders (5, MUI's own kit among them). No kit chains ancestry with ` - `; Carbon's six ` - ` names are families, not chains. Nested instances mostly keep their component's name, and kits rename them only to tell repeats apart.

For nested state, kits either let the parent own the state while the child keeps its axes (Carbon, which tracks the resulting invalid combinations as known gaps), put the state on the child alone (Primer), or avoid nesting the full component (GitLab Pajamas). None found splits a child per state in Figma, and none states that it hides a nested instance to prevent invalid combinations. Figma offers no way to expose only some of a nested instance's properties.

---

## 6. What to re-check later

- **The Figma files themselves.** Every name here comes from Code Connect layer names. Regenerating the Figma REST token would allow opening Figma SDS (`J0KLPKXiONDRssXD1AX9Oi`), Primer Web (`GCvY3Qv8czRgZgvl1dG6lp`), Carbon (`YAnB1jKx0yCUL29j6uSLpg`), CMS (`OYkYP4pC9jwS7j2qafwmiv`) and Plasma (`FIkUthFdwxiJKSBE06qjY0`) to confirm main-component names and which nested instances each exposes.
- **Material 3, Atlassian, Polaris, Ant Design, GOV.UK, SAP, Uber Base and Untitled UI** gave no verifiable part names or nesting structure.
- **The kit count.** The 5 October 2026 sweep widened the evidence to 33 kits and added nested-instance names; the per-kit table in section 1 stays as the worked examples. The totals depend on how each kit was classified, and a kit whose names were read from a changelog rather than Code Connect (MUI, Helios, GitLab, Untitled UI, Accor) counts once like any other.
- **Figma's roadmap.** Selective exposure of nested properties is an open request; a release would change section 3.

---

## Sources

### Primary: kits' own files and pages

- [Figma Simple Design System: Code Connect primitives](https://github.com/figma/sds/tree/main/src/figma/primitives)
- [Primer: PageHeader.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/PageHeader/PageHeader.figma.tsx)
- [Primer: NavList.figma.tsx](https://github.com/primer/react/blob/main/packages/react/src/NavList/NavList.figma.tsx)
- [Primer: React source with Code Connect files](https://github.com/primer/react/tree/main/packages/react/src)
- [LI.FI: sidebar.figma.tsx](https://github.com/lifinance/design-system/blob/main/registry/core/ui/sidebar.figma.tsx)
- [Coveo Plasma: Accordion.figma.tsx](https://github.com/coveo/plasma/blob/master/packages/figma/src/Accordion.figma.tsx)
- [Coveo Plasma: Select.figma.tsx](https://github.com/coveo/plasma/blob/master/packages/figma/src/Select.figma.tsx)
- [Carbon: MenuButton.figma.tsx](https://github.com/carbon-design-system/carbon/blob/main/packages/react/code-connect/MenuButton/MenuButton.figma.tsx)
- [Carbon issue #17607: Figma Code Connect upstream bugs](https://github.com/carbon-design-system/carbon/issues/17607)
- [Carbon for IBM Products repository](https://github.com/carbon-design-system/ibm-products)
- [CMS Design System: Accordion.figma.tsx](https://github.com/CMSgov/design-system/blob/main/packages/design-system/src/components/Accordion/Accordion.figma.tsx)
- [Infineon design system repository](https://github.com/Infineon/infineon-design-system-stencil)
- [Synergy design system repository](https://github.com/synergy-design-system/synergy-design-system)
- [GitLab Pajamas: UI kit components](https://design.gitlab.com/get-started/uik-components/)
- [GitLab Pajamas: UI kit release notes](https://design.gitlab.com/get-started/uik-release-notes)
- [MUI design kits: v5.9.0 release, parts renamed to `Card/Elements/CardHeader`](https://github.com/mui/mui-design-kits/releases/tag/v5.9.0)
- [HashiCorp Helios: Figma components changelog](https://github.com/hashicorp/design-system/blob/main/packages/components/CHANGELOG-FIGMA-COMPONENTS.md)
- [Untitled UI: creating tables in Figma](https://www.untitledui.com/blog/create-tables-in-figma)
- [Accor: component naming in Figma](https://design.accor.com/latest/terminology/component-naming/in-figma-pBV4ljc5-pBV4ljc5)
- [NYS Design System repository](https://github.com/ITS-HCD/nysds)
- [Android Developers: Compose Material 3 reference, `FloatingActionButtonMenu` and `ToggleFloatingActionButton`](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary)

### Community

- [Figma forum: allow selective exposure of nested component properties](https://forum.figma.com/suggest-a-feature-11/allow-selective-exposure-of-nested-component-properties-48984)
- [figma/code-connect issue #11: combine properties from nested instances](https://github.com/figma/code-connect/issues/11)

### Suiteify

- The Components - Web app Figma library, read 5 October 2026: the `🚧 Sidebar dialog` page and the FAB (AI) components.
- The engineers' code at `~/Projects/suiteify`: `List` exports, `SidebarNavItem`, `SidebarSecondary`.
