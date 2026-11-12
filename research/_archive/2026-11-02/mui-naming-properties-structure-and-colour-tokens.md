# How MUI names, structures and colours its components

What Material UI actually calls things, how its props and slots are shaped, and how its colour system is built, for a Figma library that has to map onto it.

Researched August 2026. Verified against Material UI v9 documentation and source (`createPalette.js`, `createTypography.js`, `zIndex.js`, `shadows.js`), the v5, v6, v7 and v9 migration guides, the Material UI for Figma design-kit pages, the Base UI component reference, and the Joy UI v7 theme docs. Version numbers and release dates were checked live rather than recalled. Revised 5 October 2026 against Code Connect evidence: the Figma naming advice (parts, properties, values, layers and nested instances) was checked against 1,103 public Code Connect files in 23 repositories, part names in 33 kits including MUI's own Figma kit release notes, and snapshots of four project libraries (545 components).

---

## What this answers

The questions that come up when a Figma library is about to be built in Material UI:

- What is this component called in MUI, and is that the same word we use?
- When MUI splits one thing into five components, how are the five named?
- Which of our Figma variant axes becomes a prop, which becomes a CSS class, and which becomes nothing?
- Boolean or enum? MUI has a written rule, and it breaks its own rule in two places worth knowing about.
- Where does `variant` end and `color` begin, and why does Alert have both `severity` and `color`?
- What is a slot, and which Figma layer corresponds to one?
- What should the Figma text, boolean, swap and slot properties, the text layers and the nested instances be called, so they line up with MUI's prop names?
- Why does MUI's palette have four slots per colour when our ramp has twelve steps?
- Where do hover, focus, pressed and disabled colours actually live?
- How do you run eight brands across two themes without eight copies of everything?
- What exactly do we change in Figma, what do we change in the theme, and what do we write down as a deviation?

The lookup table is in [section 18](#18-cheat-sheet). If only one section gets read, read [section 19](#19-the-short-version).

**Index**

*Part one: names*
1. [What does MUI call each component, and where will our names differ?](#1-what-does-mui-call-each-component-and-where-will-our-names-differ)
2. [How does MUI name the parts of a compound component?](#2-how-does-mui-name-the-parts-of-a-compound-component)
3. [What are MUI's CSS class names, and why does a designer need them?](#3-what-are-muis-css-class-names-and-why-does-a-designer-need-them)

*Part two: properties*

4. [When does MUI use a boolean, and when an enum?](#4-when-does-mui-use-a-boolean-and-when-an-enum)
5. [What do `variant`, `color` and `size` actually mean?](#5-what-do-variant-color-and-size-actually-mean)
6. [Why is an interaction state never a prop?](#6-why-is-an-interaction-state-never-a-prop)
7. [How does MUI name values, defaults and event handlers?](#7-how-does-mui-name-values-defaults-and-event-handlers)
8. [Why did `InputProps` and `componentsProps` disappear?](#8-why-did-inputprops-and-componentsprops-disappear)

*Part three: structure*

9. [What is a slot, and which Figma layer is one?](#9-what-is-a-slot-and-which-figma-layer-is-one)
10. [When does MUI split a component in two, and when does it fold one back in?](#10-when-does-mui-split-a-component-in-two-and-when-does-it-fold-one-back-in)
11. [How do you add a variant MUI does not ship?](#11-how-do-you-add-a-variant-mui-does-not-ship)

*Part four: colour*

12. [How is the MUI palette actually structured?](#12-how-is-the-mui-palette-actually-structured)
13. [Where do hover, focus, pressed and disabled colours come from?](#13-where-do-hover-focus-pressed-and-disabled-colours-come-from)
14. [What are CSS theme variables and channel tokens?](#14-what-are-css-theme-variables-and-channel-tokens)
15. [How do you run eight brands across two themes?](#15-how-do-you-run-eight-brands-across-two-themes)

*Part five: everything else, and the mapping*

16. [What about typography, spacing, radius, elevation and z-index?](#16-what-about-typography-spacing-radius-elevation-and-z-index)
17. [How should the Project A Figma library map onto MUI?](#17-how-should-the-project-a-figma-library-map-onto-mui)
18. [Cheat sheet](#18-cheat-sheet)
19. [The short version](#19-the-short-version)
20. [What to re-check later](#20-what-to-re-check-later)
- [Sources](#sources)

**Which MUI this is about.** Material UI v9 is the current stable release, out on 8 April 2026. There is no Material UI v8: the library jumped from v7 (March 2025) straight to v9 to line its major number up with MUI X, the same way it skipped v2. Four other things carry the MUI name and are not the subject here, though two of them appear as evidence: Base UI (unstyled primitives, stable at v1.1.0, and now the foundation under Material UI's newest components), MUI X (Data Grid, Pickers, Charts, Tree View), Joy UI (on hold, docs frozen at v7), and Pigment CSS (alpha, on hold).

---

# Part one: names

## 1. What does MUI call each component, and where will our names differ?

**The short answer.** MUI's component names come from Material Design 2 plus a decade of React convention, not from generic UI vocabulary. Roughly a dozen names differ from what a design team would write on a Figma page, and the differences are systematic enough to be worth a translation table before anyone builds anything.

MUI ships one flat namespace of component names. Every component is a top-level export: `import Button from '@mui/material/Button'`, `import ListItemButton from '@mui/material/ListItemButton'`. There is no nesting, no dot access, and no category prefix. The docs group components into Inputs, Data display, Feedback, Surfaces, Navigation, Layout, Utils and Lab, but those groups exist only in the sidebar; they are not part of any name.

The names that surprise a design team are these:

| Common design word | MUI component | Note |
|---|---|---|
| Toast, notification | `Snackbar` | An `Alert` is usually placed inside it |
| Combobox, typeahead | `Autocomplete` | |
| Input, field | `TextField` | `Input`, `OutlinedInput`, `FilledInput` are the inner components it wraps |
| Dropdown | `Select` | `Menu` is the floating list; `Select` is the form control |
| Tag, pill | `Chip` | |
| Sidebar, sheet | `Drawer` | |
| Modal | `Dialog` | `Modal` exists too, as a low-level utility under Utils |
| Spinner, loader | `CircularProgress`, `LinearProgress` | |
| Overlay, scrim | `Backdrop` | |
| Wizard | `Stepper` | |
| Text | `Typography` | |
| Surface, container | `Paper` | `Container` exists and means a max-width layout wrapper |
| Floating action button | `Fab` | Documented as "Floating Action Button", exported as `Fab` |
| Tooltip | `Tooltip` | but `Popover`, `Popper` and `Menu` are three separate things |

The last row is the one that costs time. `Popper` is the raw positioning engine, `Popover` is a positioned surface with a backdrop and focus management, and `Menu` is a `Popover` containing a `MenuList` of `MenuItem`s. A Figma component called "Flyover" is one of those three depending on whether it traps focus and whether its children are menu items, and the choice determines the ARIA roles the build gets for free.

MUI has renamed components twice in ways worth knowing, because both renames show what its naming instinct is. In v5, `ExpansionPanel` became `Accordion`, with the stated reason being to use a more common naming convention, and `GridList` became `ImageList`, with the stated reason being to align with Material Design's own naming. So MUI resolves a naming conflict in favour of the wider industry word first and its own spec second, and it is willing to break every consumer to do it.

The `Grid` story is the same instinct applied over three majors. The new implementation shipped as `Unstable_Grid2`, lost the prefix to become `Grid2` in v6, took over the good name as `Grid` in v7 while the old one was demoted to `GridLegacy`, and `GridLegacy` was deleted outright in v9. The pattern: the best name goes to the thing you want people to use, and the old occupant is renamed and then removed, rather than the new thing living forever under a worse name.

Two components are new in v9 and both are built on Base UI: `NumberField` and `Menubar`.

**Worked case: naming a page in Figma.** Say the Figma library has a page called `Toast` holding a component set with axes `Type`, `Size`, `State`. The build then imports `Snackbar`, discovers `Snackbar` has no `Type` axis at all, and that the coloured, icon-bearing thing the designer drew is an `Alert` with `severity` and `variant`, rendered inside the `Snackbar`. What looked like one component with three axes is two components with four props between them. Catching that at naming time costs a rename; catching it at build time costs a rebuild of the variant grid.

**What to do.** Rename the Figma pages to MUI's words wherever a MUI component exists for the thing, and do it before the properties table is generated, because the properties table is what a developer reads as the contract. This is judgment rather than consensus: plenty of design systems keep their own vocabulary and translate at the boundary. It stops being reasonable when the code target is a single named framework, because then the translation table is pure overhead that somebody has to maintain, and every entry in it is a place a handover can go wrong. Keep the house word only where MUI has no component (`Section block`, `Empty state`, `Status icon`), and record any surviving difference in the component description's code-gen notes. Take MUI's word, not its spelling: in Figma the name is written as separate words in sentence case (`Text field`, `Circular progress`), which is the most common casing for multi-word names across 23 Code Connect kits (sentence case 216 names, title case 209, camelCase 121, kebab-case 81). MUI's own Figma kit keeps the PascalCase export name instead (`Card/Elements/CardHeader`), which is the stronger choice only if string-equal names between Figma and code matter more than consistency with the rest of the library.

---

## 2. How does MUI name the parts of a compound component?

**The short answer.** Parent name plus a PascalCase suffix, as separate top-level exports: `Card`, `CardHeader`, `CardMedia`, `CardContent`, `CardActions`, `CardActionArea`. There is no dot notation and no nesting in Material UI, though Base UI (which now sits under Material UI's newest components) does exactly the opposite.

The full compound families, verbatim:

- **Card**: `Card`, `CardHeader`, `CardMedia`, `CardContent`, `CardActions`, `CardActionArea`
- **Dialog**: `Dialog`, `DialogTitle`, `DialogContent`, `DialogContentText`, `DialogActions`
- **List**: `List`, `ListItem`, `ListItemButton`, `ListItemIcon`, `ListItemAvatar`, `ListItemText`, `ListSubheader`, `ListItemSecondaryAction`
- **Accordion**: `Accordion`, `AccordionSummary`, `AccordionDetails`, `AccordionActions`
- **Table**: `Table`, `TableContainer`, `TableHead`, `TableBody`, `TableRow`, `TableCell`, `TableFooter`, `TablePagination`, `TableSortLabel`
- **Stepper**: `Stepper`, `Step`, `StepLabel`, `StepContent`, `StepButton`, `StepIcon`, `StepConnector`
- **Alert**: `Alert`, `AlertTitle`

Three conventions fall out of that list. The suffix names the role of the part, not its appearance (`Content`, `Actions`, `Summary`, `Details`, `Label`, `Indicator`), so a part keeps its name when its styling changes. Parts that are containers for arbitrary children end in `Content` or `Actions`. Parts that are interactive end in `Button` (`ListItemButton`, `StepButton`, `CardActionArea` being the exception that proves it was named before the rule settled).

Base UI, the unstyled layer MUI is now building on, uses a completely different scheme: dot-namespaced parts under one import. A Select is composed from `Select.Root`, `Select.Label`, `Select.Trigger`, `Select.Value`, `Select.Icon`, `Select.Backdrop`, `Select.Portal`, `Select.Positioner`, `Select.Popup`, `Select.List`, `Select.Arrow`, `Select.Item`, `Select.ItemText`, `Select.ItemIndicator`, `Select.Group`, `Select.GroupLabel`, `Select.ScrollUpArrow`, `Select.ScrollDownArrow`, `Select.Separator`. Nineteen parts for one control.

That contrast is the useful part. Base UI names every structural element, including ones that render nothing visible (`Root`, `Portal`, `Positioner`), because a consumer has to be able to style and place each one. Material UI names only the parts a consumer composes by hand, and hides the rest inside slots (see [section 9](#9-what-is-a-slot-and-which-figma-layer-is-one)). Two different answers to the same question, from the same vendor, decided by who is expected to do the styling.

For a Figma library, the practical consequence is that a compound family in Figma should have one page per *parent*, with the parts as separate components on that page, and the parts named `Parent + Suffix` in the same order they nest. How the parent and the suffix are joined in Figma is a separate question, and real kits answer it consistently enough to count. Across 33 kits whose part names could be read (28 through public Code Connect files, five through their own changelogs), 12 join parent and part with a space (SDS `Accordion Item`, Carbon `_Menu list item`, Qualcomm `_Breadcrumb item`, GitLab `❖ _Base body cell`), 7 drop the parent from the part's name, 5 use slash folders, 2 use dots in the Base UI manner (Primer `ActionList.GroupHeading`, Coveo `.Accordion.Item`), and the rest split between camelCase, kebab-case and mixed forms. None uses ` - ` as a parent to part chain. Carbon and GitLab use it only to suffix a family or a variant (`Text input - Default`, the deprecated `❖ Tab - Base`), and GitLab moved away from even that.

MUI's own Figma kit is one of the five slash kits, and its choice is worth knowing because it is the vendor's. Release 5.9.0 renamed every part into a folder under its parent with the React export name kept intact: `CardHeader` became `Card/Elements/CardHeader`, `DialogTitle` became `Dialog/Elements/DialogTitle`, `DataGridCell` became `DataGrid/Elements/Cell`, and `Slider Track` became `Slider/Elements/Slider Track`. That buys string-equal names with the code and a tidy assets panel, at the cost of a casing and a separator that the rest of a sentence-case library does not use.

Project A's library currently chains parts with ` - `: 83 of its 214 components do so, up to five levels deep (`Table - Context flyover - Section - Item`). That is the one shape no surveyed kit uses for this purpose, and the long chains also include layout wrappers that are not components in their own right.

**Worked before and after.** `Sidebar dialog - Modal - Sidebar - Section - Item` becomes `Sidebar dialog section item`: parent and part joined by spaces, sentence case, one level per real component and none for a wrapper frame. A part that designers should not place directly takes a `_` prefix (`_Pagination page item`), the most common private marker in the evidence (Primer, Carbon, Infineon, Qualcomm and Synergy all use it). The ` / ` separator survives only where one component set was split into siblings, as Primer does with `NavList.Item/SubItem`.

**What to do.** Name Figma parts parent plus role, joined by a space in sentence case (`Card header`, `Dialog actions`, `List item button`), and match MUI's suffix vocabulary (`Content`, `Actions`, `Header`, `Summary`, `Details`, `Label`, `Icon`, `Text`, `Indicator`) rather than inventing synonyms. The suffix vocabulary is consensus within MUI. The space join is the majority among real kits (12 of 33) rather than a clear consensus, and it is this guide's recommendation for Project A. The alternative with a real case behind it is MUI's own slash folders (`Card/Elements/CardHeader`), which wins if string-equal names with the React exports matter more than one casing across the library. Retire the ` - ` chain either way. Where a Figma part has no MUI counterpart, expect it to become a slot rather than an export.

---

## 3. What are MUI's CSS class names, and why does a designer need them?

**The short answer.** Every element gets a class of the form `.Mui{Component}-{slot}`, and every state gets one of eleven global classes of the form `.Mui-{state}`. Together they are a machine-readable version of the variant grid, which makes them the natural target for a design-to-code parity check.

The rules MUI states for its own class names are precise. The root element's class is always named `root`. Non-root elements are prefixed by the element name, giving `paperWidthXs`. A variant produced by a boolean prop is unprefixed (`rounded`), and a variant produced by an enum prop is prefixed by the prop name (`colorPrimary`).

Button in v9 renders this set:

```
.MuiButton-root
.MuiButton-text  .MuiButton-contained  .MuiButton-outlined
.MuiButton-colorPrimary  .MuiButton-colorSecondary  .MuiButton-colorSuccess
.MuiButton-colorError    .MuiButton-colorWarning    .MuiButton-colorInfo
.MuiButton-colorInherit
.MuiButton-sizeSmall  .MuiButton-sizeMedium  .MuiButton-sizeLarge
.MuiButton-fullWidth  .MuiButton-disableElevation
.MuiButton-startIcon  .MuiButton-endIcon
.MuiButton-loading  .MuiButton-loadingPositionCenter
.MuiButton-loadingPositionStart  .MuiButton-loadingPositionEnd
```

Read that list next to a Figma variant grid and the correspondence is direct: `variant` produces `text | contained | outlined`, `color` produces seven `color*` classes, `size` produces three `size*` classes, the two booleans produce one class each, and the two icon slots produce a class each.

The eleven state classes are global, shared by every component: `.Mui-active`, `.Mui-checked`, `.Mui-completed`, `.Mui-disabled`, `.Mui-error`, `.Mui-expanded`, `.Mui-focusVisible`, `.Mui-focused`, `.Mui-readOnly`, `.Mui-required`, `.Mui-selected`. They are always used together with a component class, because on their own they match every component at once. MUI's docs are explicit about this, and the reason is specificity: state classes are built to match the specificity of a CSS pseudo-class, so `.Mui-error` alone will fight every other rule in the sheet.

**Worked before and after: v9's combined-class removal.** Before v9, a coloured contained button also carried a single combined class:

```css
/* v7 and earlier */
.MuiButton-containedPrimary { background-color: #1976d2; }
```

v9 removed those combined classes across Button, Alert and Chip. The replacement is the two atomic classes chained:

```css
/* v9 */
.MuiButton-contained.MuiButton-colorPrimary { background-color: #1976d2; }
```

The same happened to `.MuiAlert-standardSuccess` (now `.MuiAlert-standard.MuiAlert-colorSuccess`) and `.MuiChip-clickableColorPrimary` (now `.MuiChip-clickable.MuiChip-colorPrimary`). The cost of the old form was combinatorial: three variants times seven colours is twenty-one class names to generate and document, and adding an eighth colour meant three more. The atomic form is three plus seven. This is the same argument as a sparse variant grid in Figma, arrived at from the stylesheet side.

**Trap: assuming the hashed class is stable.** In development, the rendered class attribute contains a hash-prefixed form as well as the stable one. Only the `.Mui{Component}-{slot}` portion is a supported selector. A parity check that reads the full `class` attribute and compares strings will pass locally and fail on a production build.

**Trap: styling a state class alone.** `.Mui-disabled { opacity: 0.38 }` in a global stylesheet applies to every disabled component in the app, including ones inside MUI X grids and pickers. It reads as a token application and behaves as a blast radius.

**What to do.** Treat the class list as the contract between the Figma variant grid and the build, because it is the only artefact that exists on both sides in the same shape. If a design-to-code parity loop gets set up later, the class list is what the story-to-selector map should key on. Consensus within MUI's own documentation; the parity-loop use is this guide's judgment, and it depends on the build actually shipping MUI's class names, which stops being true if the team ever adopts Pigment CSS or a Tailwind-only styling path.

---

# Part two: properties

## 4. When does MUI use a boolean, and when an enum?

**The short answer.** MUI's written rule is that two possible values means a boolean and three or more means an enum, that booleans default to `false`, and that a boolean is named with an adjective or noun rather than a verb. The library follows it closely enough that the exceptions are informative.

The rule as stated in MUI's API design guide: a boolean prop's default should be `false` so the shorthand `<Input disabled />` reads correctly, and the name should describe a state rather than an action, which is why it is `disabled` and not `disable`. For three or more values, an enum, with the example given being `variant="text" | "contained" | "fab"`. The reason given for preferring the enum is that it prevents invalid combinations and leaves room for a fourth value later. That is the same argument a sparse variant grid makes: two booleans that cannot both be true are a three-value enum wearing a disguise.

MUI also ships a family of negative booleans, and they are consistent: `disableRipple`, `disableElevation`, `disableFocusRipple`, `disableSpacing`, `disableEqualOverflow`. All default to `false`, so the default behaviour is the feature being present. This is the one place MUI's own adjective-not-verb rule bends, and the bend is deliberate: `disableRipple` reads as an instruction because it is one, and the alternative (`ripple={false}`) would default to `true` and break the false-by-default rule instead. Two rules in tension, one has to give.

Two genuine exceptions are worth knowing before copying MUI's shape wholesale.

**Card carries both `variant` and `raised`.** `variant="outlined"` and `raised` (boolean, default `false`) both affect the card's elevation treatment. There are effectively three appearances controlled by two props, which is exactly the combination MUI's own rule says should be one enum. It survives because `raised` predates `variant` and removing it would be a breaking change for a cosmetic gain.

**Alert carries both `severity` and `color`.** `severity` takes `success | info | warning | error` and sets both the icon and the colour. `color` takes the same palette values and overrides only the colour, so a success-severity alert can render in warning colours. Two props with overlapping value sets, one semantic and one presentational. It is unusual, and it is the right call: an alert's meaning and its colour are separable, and separating them lets a brand recolour severities without lying about what the alert means.

**Button's `loading` is a nullable boolean.** Typed `bool | null` with a default of `null`, not `false`. The reason is mechanical: when `loading` is a boolean, MUI keeps the loading wrapper element in the DOM at all times to avoid a crash caused by Google Translate rearranging nodes. `null` means the button has no loading behaviour at all and the wrapper is absent. A tri-state boolean, in other words, and a good example of a prop shape being decided by a browser bug rather than by taste.

**A boolean that turned into a callback argument.** v9 removed `disableEscapeKeyDown` from Dialog and Modal. The replacement is to inspect the `reason` argument that `onClose` already receives and decline to close. The boolean answered one question ("may Escape close this?") and the callback answers all of them ("this closed, because of X, do you want to allow it?"), so the boolean was redundant surface.

**Booleans that show or hide content have no MUI prop at all.** MUI has no `showHelperText` or `hasLabel`. Content appears when the prop that carries it is passed: TextField renders helper text when `helperText` is set, and Button renders a start icon when `startIcon` is set. A Figma boolean that toggles an element therefore maps to "pass or omit the prop", and its name is free for Figma to choose. Real kits choose in four ways. Of 624 unique boolean names in the Code Connect sweep, 65% are a bare noun or adjective (`Badge`, `Divider`), 117 start with `Show`, 32 with `Has`, 27 carry a glyph, 18 start with `Is`, and 17 end in `?` (Primer only). The choice only matters when the boolean shares its noun with a text, swap or slot property on the same component, and that case is common: 108 such pairs turned up in 17 repositories. Five repos each use `Has X` with `X` (SDS `Has Label` with `Label`), `X` with `↳ X` (LI.FI `Title` with `↳ Title`), `X` with `X text` (Carbon `Label` with `Label text`), and `Show X` with `X` (Firefox `Show heading` with `Heading`); four use `Show X` with `X text` (Carbon `Show helper` with `Helper text`). Giving both the same bare noun is rare and usually means the text sits on a nested instance (Coveo Plasma's `Description`).

**Worked before and after.** Project A's library names the boolean with the bare noun and pushes the difference onto the other property: `Title` (boolean) beside `Title text`, 35 boolean and text pairs in all, plus 10 variants that share a noun with a text property (the `Value` variant on five inputs beside `Value text`, Badge's `Number` beside `Number text`). Once the text property follows MUI's prop and loses its suffix (`Title`, see [section 17](#17-how-should-the-project-a-figma-library-map-onto-mui)), the boolean has to move instead, and the shape that needs no glyph and has the most use is `Show`: `Show title` with `Title`, `Show icon` with `Icon`. A boolean with no partner keeps the bare noun (`Badge`, `Divider`).

**Traps.**

- **A boolean named as a verb.** `disable`, `expand`, `select` read as commands, and a reader cannot tell whether passing it performs the action or describes the state. MUI's rule exists because the ambiguity is real.
- **A boolean that defaults to `true`.** It makes the shorthand form mean the opposite of what it looks like, and it means every consumer must pass the prop to get the common case.
- **Two mutually exclusive booleans.** `loading` and `disabled` on the same component, or `selected` and `indeterminate`, produce a cell in the grid that cannot exist. In Figma this shows up as a variant that has to be authored anyway; in code it shows up as a runtime precedence rule nobody wrote down.
- **A boolean that is really a third state.** The classic is `loading`: it is neither enabled nor disabled, it is a third thing that suppresses interaction. MUI models it as a separate prop rather than folding it into `disabled`, and the component then applies `disabled` behaviour internally.

**What to do.** Use MUI's rule as the test for a Figma variant axis too: an axis with exactly two values that are `False`/`True` is a boolean prop, and an axis with three or more values is an enum prop. Project A's existing canon already does this (`Disabled` authored as VARIANT False/True, `Size` and `Role` as enums), so the mapping is clean, and the sparse-grid stance is the same argument MUI makes for preferring enums. Judgment rather than consensus on one point: where MUI itself ships a redundant boolean beside an enum (Card's `raised`), do not copy it into Figma. It is legacy, not design. Write boolean variant values as `True`/`False`, which is Figma's default and matches the capitalised axis names; kits with lowercase, code-cased axes use `true`/`false` (76 axes against 51), so the split follows casing rather than preference. For boolean properties that show or hide an element, use the bare noun when nothing else on the component shares it, and `Show X` when a text, swap or slot property carries the same noun. That second rule is this guide's judgment on genuinely split evidence: `Show`, `Has`, a glyph and an `X text` suffix each have about five kits behind them, and `Show` is preferred because it is the most used verb prefix overall (117 names against 32 for `Has`) and needs no special character.

---

## 5. What do `variant`, `color` and `size` actually mean?

**The short answer.** `variant` is the visual treatment and its values change from component to component. `color` is a key into the palette and its values are almost always the same six plus `inherit`. `size` is `small | medium | large` with `medium` as the default, and not every component offers all three.

`variant` is the axis to watch, because it is per-component vocabulary rather than a shared enum:

| Component | `variant` values | Default |
|---|---|---|
| Button | `text`, `contained`, `outlined` | `text` |
| TextField | `filled`, `outlined`, `standard` | `outlined` |
| Alert | `standard`, `filled`, `outlined` | `standard` |
| Card | `elevation`, `outlined` | `elevation` |
| Chip | `filled`, `outlined` | `filled` |
| Avatar | `circular`, `rounded`, `square` | `circular` |
| Skeleton | `text`, `rectangular`, `rounded`, `circular` | `text` |
| Divider | `fullWidth`, `inset`, `middle` | `fullWidth` |

`outlined` is the only value shared across most of them, and even there it means "border instead of fill" on Button and Chip but "border instead of shadow" on Card. There is no global variant system in Material UI. Joy UI built one (every component takes `solid | soft | outlined | plain`), which is worth knowing about because it is the model an emphasis-based token taxonomy actually fits, and it is currently on hold.

TextField's default is a rename story in itself: `standard` was the default through v4, and v5 changed the default to `outlined`. A default changed under everyone, which is the most disruptive kind of change a component library can make, and MUI made it because the outlined field is the one Material Design leads with.

`color` is stable: `primary`, `secondary`, `error`, `warning`, `info`, `success`, plus `inherit` on components that can take their colour from a parent. Since v6 the type also accepts an arbitrary `string`, which is how a custom palette key like `color="brand"` becomes legal.

`size` is `small | medium | large` where all three exist, with `medium` the default. TextField offers only `medium | small`. `SvgIcon` uses `fontSize` rather than `size`, taking `small | medium | large | inherit` or a number, which is a naming inconsistency with a reason: the value genuinely is a font size, because MUI icons are sized in `em`.

**Worked before and after: a default that disagrees.** Project A's web library authors sizes `Large | Medium | Small` with `Large` as the default. MUI's default is `medium`. Left alone, every button a developer writes without a `size` prop renders one step smaller than the design's default, and it is invisible in review because both sizes exist and both look intentional.

```jsx
// Before: the design's default is Large, the code's default is medium.
<Button variant="contained">Save</Button>   // renders medium

// After: one theme entry, and the two defaults agree.
const theme = createTheme({
  components: {
    MuiButton: { defaultProps: { size: 'large' } },
  },
});
<Button variant="contained">Save</Button>   // renders large
```

Every component whose Figma default differs from MUI's needs a line in `defaultProps`, and the list of them is worth generating from the variant grids rather than discovered one bug at a time.

The value spelling needs the same care as the default. `Size` is the most widely shared axis in the Code Connect sweep (22 of 23 repos), and the project libraries beside Project A spell its values `lg | md | sm` while Project A spells them `Large | Medium | Small`. MUI's code uses the full words, so `Small`, `Medium` and `Large` are the values that map to `small`, `medium` and `large` with nothing but a change of case, and one vocabulary across every library avoids a second translation table.

**Trap: reading `variant` as emphasis.** A token taxonomy with `base | soft | medium | strong` emphasis and a component prop called `variant` look like the same axis and are not. `variant` in Material UI describes a construction (filled, outlined, plain text), and emphasis describes a colour weight. A soft-emphasis contained button and a soft-emphasis outlined button are both legal.

**What to do.** Treat `variant` as per-component vocabulary and copy MUI's exact values into the Figma axis for each component rather than defining one house variant enum, written in title case to match the capitalised axis name (`Contained`, `Outlined`, `Text`). MUI's own kit made the same move in release 5.9.0, whose notes say it matched component variant names with the React components; real kits follow the axis name's casing for values almost everywhere, and 15 of 23 capitalise their axis names. Consensus for a MUI target, though it is genuinely worse design than Joy UI's global variants, and if the library ever has to serve a second framework the per-component vocabulary is the part that will not travel. Generate the `defaultProps` list from the Figma defaults in the same pass that generates the properties tables, so the two defaults cannot drift apart silently.

---

## 6. Why is an interaction state never a prop?

**The short answer.** Hover, focus and pressed are CSS pseudo-classes, so MUI has no props for them. `disabled`, `selected`, `checked`, `error` and `expanded` are props, and each one produces a matching `.Mui-*` class. `loading` is a prop too. There is no `state` prop anywhere in the library.

The split is worth stating precisely, because a Figma `State` axis contains both kinds of value:

| Figma state value | In MUI |
|---|---|
| Rest | The absence of everything else. No name, no class, no prop. |
| Hover | `:hover` |
| Focus | `.Mui-focusVisible` on button-like components, `.Mui-focused` on inputs |
| Press | `:active` |
| Loading | `loading` prop, plus `.MuiButton-loading` |
| Disabled | `disabled` prop, plus `.Mui-disabled` |
| Selected | `selected` prop, plus `.Mui-selected` |
| Error | `error` prop, plus `.Mui-error` |

The `focusVisible` and `focused` distinction matters. `.Mui-focusVisible` follows the `:focus-visible` heuristic, so it appears on keyboard focus and not on a mouse click. `.Mui-focused` is applied by form controls to the wrapper when the inner input has focus at all. A focus ring specified once in Figma therefore has two implementation sites, and picking `.Mui-focused` for a button gives a ring on mouse click that the design never asked for.

Project A's house description lines already say the right thing: "State (…) and Disabled are managed by code and not applied in static designs", and "State and Disabled are defined by code; do not generate static variants for them". That is exactly the MUI model. The one refinement worth making is that `Disabled` is not quite in the same category as the rest, because it is a real prop a developer types, whereas hover and press are never typed at all.

**Trap: overriding hover after focus.** The house order is Focus before Hover (house rule 17), and in a stylesheet that ordering is load-bearing, because two rules of equal specificity resolve in source order. A `styleOverrides` block written like this inverts it:

```js
MuiButton: {
  styleOverrides: {
    root: {
      '&.Mui-focusVisible': { outline: '2px solid …' },
      '&:hover': { backgroundColor: '…' },   // wins on a hovered, focused button
    },
  },
}
```

The fix is to write the hover rule first and the focus rule second, matching the authored order in the Figma file. This is a general CSS mechanism rather than a MUI-specific rule, and it is the reason the authored order in Figma is worth carrying through to the theme file rather than treating as a documentation nicety.

**Trap: authoring a Disabled + Hover cell.** Project A's sparse-grid rule already forbids it. In MUI it is not merely undesirable, it is unreachable: a disabled `ButtonBase` sets `pointer-events: none`, so `:hover` never matches.

Real kits agree with that split. A single `State` axis carries interaction state in 19 of the 23 Code Connect repositories (SDS `Default | Hover | Disabled`, Carbon `Enabled | Hover | Focused | Disabled | Read-only`), and many of the same kits also keep `Disabled`, `Checked` or `Selected` as their own boolean axes, as Project A does. MUI's kit uses the same axis and renamed its values in release 5.4.0 (`Resting` to `Enabled`, `Hover` to `Hovered`); State value words vary by kit (SDS `Default`, Carbon `Enabled`, MUI's kit `Enabled`/`Hovered`), so they are house vocabulary, not a convention; Project A keeps `Rest | Focus | Hover | Press`.

**What to do.** Keep the `State` axis in Figma as documentation of what the code must produce, and keep authoring `Disabled` as a separate boolean axis, because it maps to a real prop while the rest do not. Consensus with MUI's model, with the existing house rules and with the majority of real kits; the addition this guide makes is to carry the Focus-before-Hover authored order into the theme's `styleOverrides` source order, since that is where the rule actually has an effect.

---

## 7. How does MUI name values, defaults and event handlers?

**The short answer.** Controlled components take `value` and `onChange`, or `open` with `onClose` and `onOpen`. Uncontrolled ones take `defaultValue` or `defaultChecked`. Handlers on components with several events are named noun first, then verb: `onPageChange`, `onRowsPerPageChange`. Handlers usually receive the event first and the meaningful value second.

The noun-first rule is stated in MUI's API guide and was applied retroactively in v5, which is the useful part. `onChangeRowsPerPage` became `onRowsPerPageChange` on TablePagination. Read as English the old form is better; read as a sorted list, the new form groups every handler for the same noun together, which is what matters when a component has eight of them. A rename that made each name slightly worse and the set considerably better.

Two more v5 renames show the same instinct for saying what a thing is rather than what it does. Autocomplete's `getOptionSelected` became `isOptionEqualToValue`, because the function does not report selection, it compares an option to the current value, and the old name caused people to write the wrong predicate. `closeIcon` became `clearIcon`, because the icon clears the input rather than closing the popup.

Handler signatures carry a second argument more often than not. `onClose` on Dialog is `(event, reason) => void`, and the `reason` string is now the only way to decline an Escape-key close, since v9 removed `disableEscapeKeyDown`. Autocomplete, Snackbar and Menu all follow the same `(event, reason)` shape.

**What to do.** Where a Figma component's properties table documents an interactive behaviour, name it in the code-gen notes using MUI's handler name rather than a description, so `onRowsPerPageChange` appears rather than "fires when the page size changes". Judgment rather than consensus: it puts a code identifier into a design artefact, which some teams object to on principle. It pays off because the properties table is the thing a developer reads instead of the design, and a name they can search for is worth more than a sentence they have to interpret.

---

## 8. Why did `InputProps` and `componentsProps` disappear?

**The short answer.** MUI had three overlapping ways to reach inside a component and spent four major versions converging them on one: `slots` and `slotProps`. v9 removed the last of the old forms.

The history, because the intermediate names still appear in every Stack Overflow answer written before 2025:

1. **`xxxProps`, `xxxComponent`, `xxxRef` (v4 and earlier).** MUI's API guide still documents the trio: `inputProps` to tweak an internal subcomponent, `xxxComponent` to inject a replacement, `inputRef` for imperative access.
2. **`components` and `componentsProps` (v5).** One object for replacements, one for props, applied unevenly across the library.
3. **`slots` and `slotProps` (v6 and v7).** The v7 release standardised the API so that all relevant components use `slots` and `slotProps`.
4. **v9 removes `components` and `componentsProps` entirely,** along with the per-component leftovers.

The v9 migration list is the clearest statement of what moved where:

| Removed in v9 | Replacement |
|---|---|
| `TransitionComponent` | `slots.transition` |
| `TransitionProps` | `slotProps.transition` |
| `BackdropComponent` | `slots.backdrop` |
| `BackdropProps` | `slotProps.backdrop` |
| `inputProps` on Checkbox, Radio, Switch | `slotProps.input` |
| `InputProps` on TextField | `slotProps.input` |
| `inputRef` | `slotProps.input.ref` |
| `components` (30+ components) | `slots` |
| `componentsProps` (30+ components) | `slotProps` |

**Worked before and after: the capitalisation trap.** The single worst piece of API surface MUI ever shipped was TextField's pair of props differing only in one capital letter. `inputProps` (lowercase i) passed attributes to the actual `<input>` DOM element. `InputProps` (uppercase I) passed props to the `Input` React component wrapping it. Same word, different case, different target, and a typo produced no error, just a prop that silently went nowhere.

```jsx
// Before: which one takes maxLength, and which one takes startAdornment?
<TextField
  inputProps={{ maxLength: 20 }}                    // the <input> element
  InputProps={{ startAdornment: <SearchIcon /> }}   // the Input component
/>

// After (v9): two slot names, no case-sensitivity, both discoverable.
<TextField
  slotProps={{
    htmlInput: { maxLength: 20 },
    input: { startAdornment: <SearchIcon /> },
  }}
/>
```

`htmlInput` versus `input` says out loud what the capital letter used to imply. That rename is the best single illustration of MUI's naming instinct: when a distinction is load-bearing, spell it out rather than encoding it in punctuation.

**What to do.** When writing code-gen notes on a Figma component, name slots in the `slots` and `slotProps` vocabulary and never in the `*Props` forms, even though most existing examples online use the old names. Consensus: the old names are gone from v9 and every one of them is documented with a direct replacement. If any existing Project A documentation quotes `InputProps`, it is describing an API that no longer exists.

---

# Part three: structure

## 9. What is a slot, and which Figma layer is one?

**The short answer.** A slot is an element inside a component that a consumer can replace or pass props to. Every component has a `root` slot; complex ones have interior slots named after what they represent. In Figma terms, a slot is an instance-swap property or a native slot property (when it holds content) or an internal layer (when it is chrome).

MUI's definition: a component's structure is determined by the elements filling its slots, the root slot is the component's outermost element, and interior slots are named after the elements they represent. Button's root is a `<button>`. Autocomplete's interior slots include `input`, `clearIndicator`, `popupIndicator` and `popper`.

TextField's slot table is a good example of the vocabulary, because it shows slots that are HTML tags and slots that are whole components:

| Slot | Default fill |
|---|---|
| `root` | `FormControl` |
| `input` | `OutlinedInput` |
| `inputLabel` | `InputLabel` |
| `htmlInput` | `'input'` |
| `formHelperText` | `FormHelperText` |
| `select` | `Select` |

Two props operate on slots. `slots` replaces the component filling a slot, taking over both its styling and its behaviour. `slotProps` passes props to whatever is filling it, leaving the styling intact.

```jsx
<Autocomplete slots={{ popper: CustomPopperComponent }} />
<Autocomplete slotProps={{ popper: { 'data-testid': 'my-popper' } }} />
```

`slotProps` entries can be callbacks receiving `ownerState`, which is how a slot's props can depend on the parent's current props and internal state:

```jsx
<Popover
  slotProps={{
    paper: (ownerState) => ({ elevation: ownerState.open ? 8 : 0 }),
  }}
/>
```

Precedence is worth knowing before debugging it: props placed directly on the component propagate to the root slot, and where `slotProps.root` and a direct prop collide, `slotProps.root` wins. `classes` and `style` merge instead of one winning.

The third way to change structure is the `component` prop, which swaps the root element while keeping the slot's styles. `<List component="menu">` renders a `<menu>` with all of List's styling intact, and `<Button component={Link} to="/x">` renders a router link that looks like a button. The rule MUI gives: use `component` to change the element while keeping the styling, use `slots` to replace styling and behaviour together. Note that `component` (singular) is alive and well; it was `components` (plural) that v9 deleted.

**Mapping slots to Figma.** The distinction that matters is whether the consumer supplies the content or only adjusts the chrome:

- A slot that holds one piece of consumer content (`startAdornment`, `endIcon`, `action`, `avatar`) is an **instance-swap property** in Figma, and the component filling it must be published so it receives updates. That is exactly why Project A publishes unprefixed building blocks. A slot that holds arbitrary children (`DialogContent`, the body of a Card) is a better fit for Figma's native **slot property**, which MUI's own kit adopted across its components in release 9.0.0.
- A slot that is internal chrome (`popper`, `paper`, `backdrop`, `transition`) is an **internal layer**, and in Project A's convention it carries the `_` prefix. A developer will reach it through `slotProps`, not by placing a component.

That gives a clean test in both directions. An unprefixed Figma building block that is not consumed by any slot is either mis-marked or genuinely a standalone component. A `_`-prefixed layer that a developer needs to replace means MUI exposes a slot the Figma library is hiding.

**Naming the swap and the slot.** A swap property is named for the thing it holds, not the mechanism: `Icon`, not `Icon swap`. Plain `Icon` is the most common instance-swap name in the sweep (39 of 81 unique swap names contain "icon"), and only Carbon, IBM Products and Coveo put the word "swap" in the name at all, always in front (`Swap icon`, `Swap slot`, `Swap Left`). Where a component has two positions, the evidence splits: prefix and suffix 11 names (Synergy, Bezier), left and right 7 (LI.FI, Infineon, Coveo), leading and trailing 7 (Primer `leadingVisual`, Equinor `Leading Icon Item`), start and end 2 (SDS `Icon Start`, `Icon End`). MUI's code says `startIcon` and `endIcon`. The Figma names `Leading icon` and `Trailing icon` keep the meaning of start and end (both flip in a right-to-left layout, which left and right do not) and read as plain English in a properties panel; `Start icon` and `End icon` match MUI more literally and are equally defensible. Native slot properties are too new to have a pattern: only three repos map one (LI.FI `Content slot`, MetaMask `startAccessory`, Codecademy `body`), so Project A's `Content slot` has one precedent and stays unverified.

**What to do.** Name swaps for what they hold (`Icon`), and the positional pair `Leading icon` and `Trailing icon` for MUI's `startIcon` and `endIcon`; the position vocabulary is split across kits and this is judgment, chosen because it is direction-safe. Keep `Content slot` for native slots until more kits show a pattern. Document, per component, which Figma instance-swap and slot properties correspond to which MUI slot or prop names, in the code-gen notes. Judgment: it is extra writing, and the payoff is that it is the only place the two structures can be checked against each other. The check it enables is worth stating as a rule: if a component has an instance-swap property with no corresponding MUI slot, either the design is asking for structure the component does not offer, or a wrapper component is about to get written that nobody planned for.

---

## 10. When does MUI split a component in two, and when does it fold one back in?

**The short answer.** MUI splits when the two things have different HTML semantics, and folds when the difference is only appearance or status. Both directions have shipped recently enough to see the rule applied.

**A split: `ListItem` to `ListItemButton`.** In v4, an interactive list row was `<ListItem button>`. In v5, `ListItemButton` became its own component, and in v6 the `button`, `autoFocus`, `disabled` and `selected` props were removed from `ListItem` altogether. The reason is semantic: `ListItem` renders an `<li>`, and an `<li>` is not interactive. `ListItemButton` renders a button inside it. A boolean prop was hiding a change of element, role and keyboard behaviour, and no boolean should do that.

The same instinct re-parented `MenuItem` in v5. It used to inherit from `ListItem` and now inherits from `ButtonBase`, which removed every `MuiListItem-*` class from its output. A menu item is a button that happens to sit in a list, not a list item that happens to be clickable.

**A fold: `LoadingButton` to `Button loading`.** `LoadingButton` lived in `@mui/lab` for years. In v6.4.0 it was removed and its behaviour became the `loading` prop on `Button` (and on `IconButton`). The reason is the inverse of the split: loading is a status a button passes through, not a different kind of button. Nothing about the element, the role or the keyboard behaviour changes.

**A rename, demote and delete: Grid.** Covered in [section 1](#1-what-does-mui-call-each-component-and-where-will-our-names-differ), and it is the third pattern: when a replacement is genuinely better, the replacement takes the good name and the original is renamed to `*Legacy` and removed a major or two later.

The test that falls out: **does the change alter the element, its ARIA role, or its keyboard behaviour?** If yes, it is a different component. If it only changes appearance or reports status, it is a prop.

Applied to a Figma library, that test cuts cleanly:

- `List item` and `List item button` (today `List item - Action`, renamed per [section 2](#2-how-does-mui-name-the-parts-of-a-compound-component)) are two components, correctly, because one is inert and one is a button.
- A `Loading` value on a `State` axis is a prop, correctly, not a `Button - Loading` family.
- A `Button - AI` family is the interesting case. If the AI button is a button with different colours, it is a `variant` or a `color`. If it opens a different interaction model or carries different semantics, it is a component. That is a decision to make deliberately, and [section 11](#11-how-do-you-add-a-variant-mui-does-not-ship) covers what each choice costs.

**What to do.** Apply the element-role-keyboard test whenever deciding between a new Figma family and a new axis value, and record the answer in the component description rather than leaving it implicit. Consensus, in the sense that MUI has now demonstrated the rule in both directions within two years, and it matches the accessibility reasoning underneath. The constraint it depends on: it assumes the code target renders real semantic HTML, which MUI does.

---

## 11. How do you add a variant MUI does not ship?

**The short answer.** Register it in the theme's `variants` array with a `props` matcher and a `style` block, add it to `defaultProps` if it should be the default, and augment the TypeScript types so the new value is legal. No component subclassing required.

The mechanism has three parts.

**The `variants` array**, attached to a styled slot or to a theme component entry, matches on props and applies styles:

```js
const theme = createTheme({
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: 'ai' },
          style: { /* … */ },
        },
      ],
    },
  },
});
```

**`styleOverrides` with `ownerState`** handles the cases where the styling depends on a combination rather than a single prop, and **`defaultProps`** sets the component's default for the whole app.

**Module augmentation** makes the new value type-legal:

```ts
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    ai: true;
  }
}
```

For a genuinely new component that should behave like a MUI one, the same machinery applies from the other side: `styled('div', { name: 'MuiStat', slot: 'root' })` gives it a theme name and a slot, which means it gets `.MuiStat-root` as a class, `theme.components.MuiStat.styleOverrides` as a customisation point, and `useThemeProps` for its defaults. That is how a house component joins the system rather than sitting beside it.

**The trade-off worth naming.** Adding a value to `variant` costs a theme entry and a type augmentation, and buys composition: the new value combines with every `color` and `size` automatically, and it appears in the class list as `.MuiButton-ai` alongside the others. Writing a separate component costs a new export and a new set of docs, and buys freedom: different props, different structure, different semantics.

The dividing line is the same one as [section 10](#10-when-does-mui-split-a-component-in-two-and-when-does-it-fold-one-back-in). If the thing still needs every existing `color` and `size` to work, it is an axis value. If half the existing combinations become meaningless, it is a component.

**What to do.** For an AI treatment that is a colour and a shape applied to otherwise ordinary buttons, add a `variant` value and augment the types. Judgment, and it depends on one fact worth checking in the Figma file first: whether `Button - AI` shares the full `Size` and `Role` grid with `Button`. If it does, it is an axis; if its grid is a different shape, the Figma file has already decided it is a component and the theme should follow.

---

# Part four: colour

## 12. How is the MUI palette actually structured?

**The short answer.** Six semantic colours, each with exactly four slots: `main`, `light`, `dark`, `contrastText`. Plus `text`, `action`, `background`, `divider`, `common` and a `grey` ramp. It is not a step ramp, and an emphasis taxonomy does not fit into it without extending it.

The six semantic colours and their v9 light-mode defaults:

| Palette key | `light` | `main` | `dark` |
|---|---|---|---|
| `primary` | `#42a5f5` | `#1976d2` | `#1565c0` |
| `secondary` | `#ba68c8` | `#9c27b0` | `#7b1fa2` |
| `error` | `#ef5350` | `#d32f2f` | `#c62828` |
| `warning` | `#ff9800` | `#ed6c02` | `#e65100` |
| `info` | `#03a9f4` | `#0288d1` | `#01579b` |
| `success` | `#4caf50` | `#2e7d32` | `#1b5e20` |

`contrastText` is computed rather than authored, unless you author it. In dark mode the same keys resolve to different ramp steps: `primary` moves from `blue[700]` to `blue[200]`, `error` from `red[700]` to `red[500]`, `success` from `green[800]` to `green[400]`.

Two numbers govern the computation. `tonalOffset` (default `0.2`) is how far `light` and `dark` are shifted from `main` when they are not supplied, so a `main` of `blue[500]` produces a `light` of roughly `blue[300]` and a `dark` of roughly `blue[700]`. It also accepts an asymmetric form, `{ light: 0.1, dark: 0.9 }`. `contrastThreshold` (default `3`) decides when `contrastText` flips from white to dark; raising it to `4.5` biases towards dark text on light backgrounds, which is the setting an AA-floor system usually wants. `augmentColor` runs the same computation on a colour you supply.

The rest of the palette:

- `text.primary` `rgba(0, 0, 0, 0.87)`, `text.secondary` `rgba(0, 0, 0, 0.6)`, `text.disabled` `rgba(0, 0, 0, 0.38)` in light. In dark: `#ffffff`, `rgba(255, 255, 255, 0.7)`, `rgba(255, 255, 255, 0.5)`, plus a `text.icon` at `rgba(255, 255, 255, 0.5)`.
- `divider` `rgba(0, 0, 0, 0.12)` light, `rgba(255, 255, 255, 0.12)` dark.
- `background.default` and `background.paper`, both `#ffffff` in light and both `#121212` in dark.
- `common.black`, `common.white`, and `grey` as a `50` to `900` ramp.
- `action.*`, which gets its own section below.

**The structural mismatch, stated plainly.** Material UI's palette gives four values per semantic colour. A twelve-step ramp with a `base | soft | medium | strong` emphasis axis gives four or more *per element per role*, which is a different shape entirely, and the two do not nest.

Joy UI, from the same vendor, built the other model: palettes running `50` to `900`, and a global variant system (`solid`, `soft`, `outlined`, `plain`) with tokens named as variant, then state, then CSS property. `solidBg`, `solidColor`, `solidHoverBg`, `softBg`, `softColor`, `softActiveBg`, `outlinedBorder`, `outlinedColor`, `plainColor`, `plainActiveBg`. An emphasis-based taxonomy maps onto that almost directly. Joy UI is on hold with no timeline, so this is useful as a reference model rather than a migration target, but it does establish that the shape is not alien to MUI's thinking.

**Worked before and after: mapping one emphasis token.** Take `Colour/Background/Feedback/Danger/soft`.

```js
// Before: the tempting mapping.
palette: { error: { main: '#…' } }
// and then reaching for error.light wherever "soft" was meant.
```

That costs more than it looks. `error.light` is not a free slot: MUI uses it for the outlined and standard Alert treatments and for several hover states. Worse, if only `main` is supplied, `tonalOffset` regenerates `light` and `dark`, so the soft background silently becomes a computed tint of `main` rather than ramp step 3, and it will not match the Figma file.

```js
// After: all four slots authored from the ramp, and emphasis as its own key.
palette: {
  error: {
    main:  '#…',   // ramp step for "base"
    light: '#…',   // authored, not computed
    dark:  '#…',   // authored, not computed
    contrastText: '#…',
    soft:   '#…',  // ramp step for "soft"
    medium: '#…',
    strong: '#…',
  },
}
```

The extra keys need a TypeScript augmentation of `PaletteColor` and `SimplePaletteColorOptions` to be legal, the same mechanism as [section 11](#11-how-do-you-add-a-variant-mui-does-not-ship). They then generate CSS variables alongside the built-in ones (see [section 14](#14-what-are-css-theme-variables-and-channel-tokens)).

**The vocabulary collision worth deciding early.** Project A's canon is `Success · Danger · Warning · Info`. Material UI's palette key, Alert `severity` value, and every component's `color` value is `error`. Three of the four words match; one does not, and it is not a word either side can quietly change. `Danger` is the house canon and a component axis using another word is defined as a defect. `error` is MUI's key and cannot be renamed without a wrapper around every component.

Two honest options. Rename `Danger` to `Error` in Figma, which costs a vocabulary migration across both platforms and contradicts a recorded canon. Or keep `Danger` in Figma, emit `error` in the theme, and record the pair as a deliberate deviation. The second is cheaper and it is not a fudge: Joy UI, from the same vendor, uses `danger`, so the design word is defensible and the code word is a Material Design inheritance rather than a considered choice.

**What to do.** Author all four slots of every semantic colour explicitly from the ramp rather than letting `tonalOffset` compute two of them, and add the emphasis steps as extra palette keys with a type augmentation. Raise `contrastThreshold` to `4.5` to match a WCAG 2.2 AA floor. Judgment on the emphasis keys: the alternative is a second token layer outside the palette, which keeps MUI's shape clean but means half the colours are invisible to `theme.palette`. Keep `Danger` in Figma and map it to `error` in the theme, and put the pair in the code-gen notes of every Feedback component so it is stated where a developer will read it.

---

## 13. Where do hover, focus, pressed and disabled colours come from?

**The short answer.** From `palette.action`, a set of eleven values and opacities that MUI applies across the whole library. It is the closest thing MUI has to an interaction-state token layer, and it maps almost one to one onto a `States/` token group.

The full set, light and dark:

| Token | Light | Dark |
|---|---|---|
| `action.active` | `rgba(0, 0, 0, 0.54)` | `#ffffff` |
| `action.hover` | `rgba(0, 0, 0, 0.04)` | `rgba(255, 255, 255, 0.08)` |
| `action.hoverOpacity` | `0.04` | `0.08` |
| `action.selected` | `rgba(0, 0, 0, 0.08)` | `rgba(255, 255, 255, 0.16)` |
| `action.selectedOpacity` | `0.08` | `0.16` |
| `action.disabled` | `rgba(0, 0, 0, 0.26)` | `rgba(255, 255, 255, 0.3)` |
| `action.disabledBackground` | `rgba(0, 0, 0, 0.12)` | `rgba(255, 255, 255, 0.12)` |
| `action.disabledOpacity` | `0.38` | `0.38` |
| `action.focus` | `rgba(0, 0, 0, 0.12)` | `rgba(255, 255, 255, 0.12)` |
| `action.focusOpacity` | `0.12` | `0.12` |
| `action.activatedOpacity` | `0.12` | `0.24` |

Three observations for anyone mapping a `States/` token group onto this.

**Hover, disabled and focus map directly.** `States/Hover/opacity` is `action.hoverOpacity`, `States/Disabled/opacity` is `action.disabledOpacity`. Setting them in the theme changes every component at once, which is the same "single decision applied everywhere" property that made them tokens in Figma.

**There is no press token.** MUI has no `action.pressed` or `action.activeOpacity` for the `:active` state. `action.activatedOpacity` is not it: it is used for the persistent activated look of things like a selected toggle, not for the moment a pointer is down. A `States/Press/opacity` token therefore has no MUI home and needs either a custom theme key or per-component overrides. This is a real gap and the ripple effect is what MUI uses instead, which is a different visual model, not a differently named token.

**Focus is a colour, not a ring.** `action.focus` is a translucent overlay. A design system whose focus indicator is a stroke, specified as `States/Focus/stroke-colour` and `States/Focus/stroke-width`, is not describing the same thing, and there is no theme key for it. It has to be applied as a global `styleOverrides` block on `MuiButtonBase` and the input components, targeting `.Mui-focusVisible`.

**Worked before and after: an 8% hover.** Suppose the design specifies an 8% hover overlay and the team implements it on Button only.

```js
// Before: one component agrees with the design, the rest are at MUI's 4%.
components: {
  MuiButton: { styleOverrides: { root: { '&:hover': { … } } } },
}
```

Every Chip, MenuItem, IconButton, ListItemButton, Tab and Table row in the app stays at `0.04`. In review each one looks plausible on its own, and the inconsistency only shows when two of them sit side by side.

```js
// After: one theme entry, whole library.
palette: {
  action: { hover: 'rgba(0, 0, 0, 0.08)', hoverOpacity: 0.08 },
}
```

Both keys are needed, because some components use the ready-made colour and others compose the opacity with their own colour.

**Trap: dark mode is not a mirror.** `hoverOpacity` is `0.04` in light and `0.08` in dark, `selectedOpacity` is `0.08` and `0.16`, `activatedOpacity` is `0.12` and `0.24`. Dark surfaces need roughly double the overlay to read as the same amount of change. A `States/` group with a single mode-independent opacity per state will be too subtle in dark mode, and this is the industry's default answer to that, shipped and tested at scale.

**What to do.** Set `palette.action` from the `States/` tokens in the theme, per colour scheme, and give dark mode its own values rather than reusing light's. Consensus, and MUI's own defaults are a reasonable starting ratio if the design has not specified dark separately. Add a custom key for press (`action.pressedOpacity` with a type augmentation) rather than pretending `activatedOpacity` is it, and implement the focus ring as a global `styleOverrides` block rather than looking for a token that does not exist.

---

## 14. What are CSS theme variables and channel tokens?

**The short answer.** With `cssVariables: true`, MUI emits every theme value as a CSS custom property with a deterministic name (`--mui-palette-primary-main`), exposes them in JS as `theme.vars.*`, and additionally emits channel tokens (`--mui-palette-primary-mainChannel`, holding `25 118 210`) so translucent colours can be composed in CSS without a JS colour library.

The naming is a flattened path of the theme object with the prefix in front:

```
--mui-palette-primary-main
--mui-palette-primary-contrastText
--mui-palette-grey-50
--mui-palette-action-hoverOpacity
```

In JS, `theme.vars.palette.primary.main` returns the `var()` reference rather than the value, so a styled component can reference the variable and stay theme-agnostic. In plain CSS, `var(--mui-palette-grey-50)` works directly.

Channel tokens exist because `rgba()` needs the channels separately. `theme.palette.primary.mainChannel` is the string `25 118 210`, which composes as `rgba(${theme.vars.palette.primary.mainChannel} / 0.12)`. That is how MUI builds a 12% overlay of the primary colour without calling a JS `alpha()` function at render time. Joy UI does the same with three channel tokens per palette (`lightChannel` from step 200, `mainChannel` from 500, `darkChannel` from 800).

The configuration options that matter:

- `cssVarPrefix` changes `--mui-` to anything, including an empty string for bare `--palette-primary-main`.
- `colorSchemeSelector` decides how a scheme is activated: `'class'` produces `.light` and `.dark`, `'data'` produces `[data-light]` and `[data-dark]`, and a custom string with a `%s` placeholder such as `'.theme-%s'` produces `.theme-light` and `.theme-dark`. The value must start with a dot for a class or a bracket for a data attribute.
- `disableCssColorScheme` drops the CSS `color-scheme` property.
- `theme.applyStyles()` is the supported way to write mode-specific styles, and the docs are explicit that using `theme.palette.mode` instead causes a flicker, because the mode is only known after hydration while the CSS variables are correct from the first paint.

v9 extends the system to generate `color-mix()` values on top of the standard variables, which means derived colours can now be computed by the browser from a variable rather than baked in at theme-creation time. That is a meaningful change for anyone feeding MUI from a token pipeline, and its consequences are covered in the next section.

**Worked case: what a token export actually produces.** A DTCG export of `Colour/Background/Feedback/Danger/soft` cannot become `--mui-palette-error-soft` by writing that string into a CSS file. MUI generates its variables from the theme object, so a variable that is not a theme key does not exist. Two routes: add `soft` as a palette key (as in [section 12](#12-how-is-the-mui-palette-actually-structured)) so MUI generates it, or ship a second CSS layer of house variables and reference those from `styleOverrides`. The first keeps one source of truth and requires type augmentation; the second keeps MUI's palette pristine and means `theme.palette` no longer describes all the colours in the app.

**What to do.** Turn `cssVariables` on and treat `--mui-palette-*` as the naming target for the token pipeline, because it is deterministic, documented, and readable from a browser at runtime, which is what makes an automated design-to-code parity check possible at all. Consensus for any MUI project from v6 onwards. Prefer extending the palette over a parallel variable layer, so that one object remains the answer to "what colours does this app have".

---

## 15. How do you run eight brands across two themes?

**The short answer.** Three viable shapes, and the safe answer today is a shared token base composed into one `createTheme()` per brand. The elegant answer, custom-named colour schemes switched by a CSS selector, mirrors Figma's mode mechanism exactly but is documented at the MUI System level rather than in Material UI's own docs.

Project A's Figma architecture is two independent switches: light and dark on `Semantic`'s modes, and eight brands on `Semantic - Brand`'s modes, with brand colour entering the hidden primitive ramps at anchor steps so every brand inherits the same contrast structure. Sixteen permutations, two switches, one component library. The question is which MUI mechanism has that shape.

**Option A: one theme per brand, from shared tokens.** MUI documents this pattern directly. A `brandedTheme.ts` exports `brandedTokens` (palette, shape, typography) and `brandedComponents` (the `MuiButton` and friends overrides) separately, and each consuming app spreads the tokens and overrides just the brand-specific palette entries:

```ts
const appTheme = createTheme({
  ...brandedTokens,
  palette: { ...brandedTokens.palette, primary: { main: '#1976d2' } },
  components: {
    ...brandedComponents,
    MuiButton: {
      styleOverrides: {
        root: [brandedComponents?.MuiButton?.styleOverrides?.root, { /* … */ }],
      },
    },
  },
});
```

The array syntax on `styleOverrides.root` is load-bearing: object spread on component overrides loses the variants and pseudo-class styles from the base theme, and MUI's guide explicitly recommends the array form for merging while warning against deep-merge utilities for performance reasons.

*Advantages*: fully documented, fully typed, works today, and `theme.palette.primary.main` is a real colour in JS so `alpha()`, `tonalOffset` and `augmentColor` all behave. *Disadvantages*: eight theme objects to keep in sync, brand switching is a React re-render rather than a CSS class change, and a brand switch cannot happen without a `ThemeProvider` swap.

**Option B: custom-named colour schemes.** MUI System's CSS theme variables API states you can create unlimited colour schemes beyond `light` and `dark`, with a `defaultColorScheme` option accepting a string or an object depending on how many themes the design system has. Combined with `colorSchemeSelector: '.theme-%s'`, that would give `.theme-construction-light`, `.theme-finance-dark` and so on, generated as pure CSS.

*Advantages*: it is the same mechanism as Figma modes, one theme object, brand switching is a class change with no re-render, and it composes with the `color-mix()` support v9 added. *Disadvantages*: Material UI's own configuration docs show only `light` and `dark`, and no concrete example of a custom scheme name or of how its selector is generated was found. It is a documented capability without a documented recipe, which makes it a prototype rather than a plan.

**Option C: a `var()` layer beneath the palette.** Put `var(--brand-primary)` into `palette.primary.main` and redefine the brand variables under `[data-brand="finance"]`.

*Advantages*: it mirrors the Figma architecture most closely, since Project A's brand switch really is a single alias layer. *Disadvantages*: it breaks MUI's colour maths. `tonalOffset`, `contrastThreshold`, `augmentColor` and `alpha()` all parse colour strings, and `var(--brand-primary)` is not parseable at theme-creation time. Turning `cssVariables` on makes this worse rather than better, because MUI's own channel tokens are derived by parsing the value. v9's `color-mix()` support is aimed at exactly this problem and may eventually make the option viable, which is worth re-checking rather than assuming.

**What to do.** Build option A now, with `brandedTokens` generated from the Figma export rather than hand-written, so eight theme files are eight generated artefacts rather than eight files to maintain. Prototype option B on one brand before committing to it, and treat option C as closed until MUI's `color-mix()` work is documented to cover derived palette values. This is judgment, and the constraint it depends on is that brand switching happens at app boundaries rather than per-page: if a single page ever has to show two brands at once, option A stops being sufficient and the prototype becomes urgent.

---

# Part five: everything else, and the mapping

## 16. What about typography, spacing, radius, elevation and z-index?

**The short answer.** MUI's typography names are Material Design 2's and will not match an MD3-flavoured scale. Spacing is a multiplier function, not a named scale. There is exactly one radius token by default. Elevation is a 25-entry shadow array. Breakpoints and z-index are sensible and worth adopting as they are.

**Typography.** Thirteen variants, with these defaults (font family `"Roboto", "Helvetica", "Arial", sans-serif`, base `fontSize` 14, `htmlFontSize` 16, weights 300/400/500/700):

| Variant | Weight | Size | Line height | Letter spacing | Transform |
|---|---|---|---|---|---|
| `h1` | 300 | 6rem / 96px | 1.167 | -0.015em | |
| `h2` | 300 | 3.75rem / 60px | 1.2 | -0.0083em | |
| `h3` | 400 | 3rem / 48px | 1.167 | 0 | |
| `h4` | 400 | 2.125rem / 34px | 1.235 | 0.0074em | |
| `h5` | 400 | 1.5rem / 24px | 1.334 | 0 | |
| `h6` | 500 | 1.25rem / 20px | 1.6 | 0.0075em | |
| `subtitle1` | 400 | 1rem / 16px | 1.75 | 0.0094em | |
| `subtitle2` | 500 | 0.875rem / 14px | 1.57 | 0.0071em | |
| `body1` | 400 | 1rem / 16px | 1.5 | 0.0094em | |
| `body2` | 400 | 0.875rem / 14px | 1.43 | 0.0107em | |
| `button` | 500 | 0.875rem / 14px | 1.75 | 0.0286em | `uppercase` |
| `caption` | 400 | 0.75rem / 12px | 1.66 | 0.0333em | |
| `overline` | 400 | 0.75rem / 12px | 2.66 | 0.0833em | `uppercase` |

Two things bite. The `button` variant is uppercase by default, which every non-Material brand has to turn off, and it is set on the variant rather than on Button, so overriding it on `MuiButton` alone leaves other consumers of the variant uppercase. And the variant names are MD2's: `subtitle1`, `body1`, `overline`. A scale named `Headline / Title / Body / Label / Caption` is MD3's vocabulary, and MUI has not shipped MD3. Its tracking issue shows partial component progress with no shipping date, and v9's own announcement lists Material Design support as forward-looking work rather than something delivered.

Custom variants can be added and built-in ones disabled by setting them to `undefined`, both with a type augmentation. So an MD3-named scale is reachable, it is just not what MUI gives you.

**Spacing.** Default factor 8, so `theme.spacing(2)` is `'16px'`. Three configuration forms: a number (a different factor), a function (`(factor) => \`${0.25 * factor}rem\``), or an array of literal values indexed by the factor (`spacing: [0, 4, 8, 16, 32, 64]`, where `theme.spacing(2)` is `'8px'`). The array form only accepts positive integers, so decimals, negatives and `'auto'` need the function form. Up to four arguments compose CSS shorthand: `theme.spacing(1, 2)` is `'8px 16px'`.

A named scale of `0 · 2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32` is expressible either way. As a factor of 8 it becomes `0, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4`, which is correct and unreadable. As an array it becomes the literal list, which is readable and loses the ability to write `theme.spacing(-1)`.

**Radius.** `shape.borderRadius` defaults to `4`, and it is a single value. The `sx` prop treats a numeric `borderRadius` as a multiplier of it, so `borderRadius: 2` is 8px. Extra tokens can be added (`borderRadiusSm`, `borderRadiusMd`, `borderRadiusLg`, `borderRadiusXl` is the documented example) with a `Shape` and `ShapeOptions` augmentation. A nine-value radius scale means nine keys, and the multiplier behaviour of `sx` becomes a trap: with `borderRadius: 8`, an `sx` of `borderRadius: 2` silently means 16px.

**Elevation.** `theme.shadows` is an array of 25 strings, index 0 being `'none'` and 1 to 24 being three-layer shadows generated from umbra, penumbra and ambient opacities. Components take `elevation` as a number into that array. A design with five named levels (`base`, `raised`, `floating`, `overlay`, `overlay-offset`) has two routes: pick five indices and set `defaultProps: { elevation: n }` per component, or replace the whole array so the five named levels sit at known indices and the rest are duplicates. The second is blunter and makes the mapping legible.

**Breakpoints.** `xs: 0`, `sm: 600`, `md: 900`, `lg: 1200`, `xl: 1536`. MUI describes these as a simplified implementation of the Material Design responsive grid spec.

**z-index.** `mobileStepper: 1000`, `fab: 1050`, `speedDial: 1050`, `appBar: 1100`, `drawer: 1200`, `modal: 1300`, `snackbar: 1400`, `tooltip: 1500`. A design system with no z-index tokens of its own should adopt these verbatim rather than invent a scale, because MUI's own components use them and any house scale has to interleave with them anyway.

**Icons.** `@mui/icons-material` converts Material's snake_case names to PascalCase (`delete_forever` becomes `DeleteForever`) with five theme suffixes: no suffix for Filled, then `Outlined`, `Rounded`, `TwoTone`, `Sharp`. So `Delete`, `DeleteOutlined`, `DeleteRounded`, `DeleteTwoTone`, `DeleteSharp`. Three exceptions exist: `ThreeDRotation`, `FourK`, `ThreeSixty`. A house icon set does not have to follow this, but if it is delivered as React components, matching the PascalCase convention means a developer's autocomplete behaves the same for both sets.

**What to do.** Adopt breakpoints and z-index unchanged. Express spacing as an array so the theme file reads like the Figma scale. Extend `shape` with the full radius scale and ban the numeric `sx` shorthand for radius in the house code standard, because its multiplier semantics are a silent-wrong-value trap. For typography, decide deliberately between renaming the Figma text styles to MD2's vocabulary and augmenting MUI's typography with the MD3-flavoured names; this guide's judgment is to augment, because the Figma names are already shipped across two platforms and MD2's `subtitle1` and `overline` are worse names that MUI itself intends to move away from eventually.

---

## 17. How should the Project A Figma library map onto MUI?

**The short answer.** Most of the structure maps cleanly, because the existing conventions already separate props from states and already keep grids sparse. The names need more work than the structure: part names, text properties, paired booleans, swaps and nested instances all follow a scheme that real kits use rarely or not at all. Four further things need a decision, and each one is either a Figma change, a theme change, or a named deviation to write down.

**Text properties, text layers and nested instances.** The rest of the property surface is where Project A's names and MUI's diverge most often, and where real kits give the clearest majority. Every text property in the Project A snapshot carries a `text` suffix (145 of them: `Label text` 47 times, `Title text` 19, `Description text` 15), and the same scheme runs through the other project libraries. Across 359 unique text-property names in the Code Connect sweep, 50% are a bare noun and that is the main style in 14 repositories (SDS, Primer, Firefox, MetaMask among them). The `X text` form is 30% and the main style in four (Carbon, IBM Products, Infineon, Qualcomm), and those four use it for most text properties, not only paired ones (Carbon 32 of 46). Project A sits with the minority, and MUI's props point the other way: `label`, `title`, `placeholder`, `description` and `value` carry no suffix. The one place MUI does say "text" is `helperText`, so `Helper text` is the Figma name that matches it, and the rule is to keep "text" exactly where the code prop has it.

Text layers follow the property they are bound to. The kits mostly name them `Label`, `Title` or `Text`, and so does Project A (`Label`, `Title`, `Description` throughout). The outliers are the fix: `Number text` as a layer name becomes `Number`, so the layer and its property read the same.

Nested instances keep the component's own name in most kits (`Button`, `Avatar`, `Menu`), because that is Figma's default and what Code Connect's `figma.children()` finds without extra mapping. Role names are a minority (Primer `trigger`, `leadingVisual`). Where several copies of one component sit side by side, kits number them (NYSDS `Option 1` to `Option 10`) or tell them apart by role (Primer `Primary`, `Secondary`). Project A renames 132 of its 278 nested instances, most often to a shorter form of the parent chain (`Item` for `Sidebar - Section - Item`), which hides the component's identity and forces every Code Connect mapping to know the alias.

Across all property kinds, the Figma name equals the code prop (ignoring case and spaces) 57% of the time in the sweep, so even kits with Code Connect live with a translation for four names in ten. A Figma library built for one named code target can do better than that cheaply.

The three-way alignment, item by item.

**Change in Figma**

| Item | Now | Becomes | Why |
|---|---|---|---|
| Component page names | House vocabulary | MUI's words in sentence case (`Snackbar`, `Autocomplete`, `Text field`, `Chip`, `Drawer`, `Circular progress`, `Backdrop`, `Stepper`, `Typography`) | A translation table for a single named code target is pure overhead, and the properties table is what a developer reads |
| Part names | ` - ` chains, up to five levels (`Table - Context flyover - Section - Item`) | Parent and part joined by spaces, sentence case, `_` for private parts (`Card header`, `_Pagination page item`) | No surveyed kit chains parts with ` - `; space join is the majority (12 of 33). MUI's kit uses slash folders (`Card/Elements/CardHeader`), the alternative. See [section 2](#2-how-does-mui-name-the-parts-of-a-compound-component) |
| Flyover family | One name | `Popover`, `Popper` or `Menu`, decided per case | The three differ in focus management and ARIA roles, and the choice is free at design time and expensive later |
| Per-component `variant` values | House vocabulary | MUI's exact per-component values in title case (`Contained`/`Outlined`/`Text` on Button, `Filled`/`Outlined`/`Standard` on TextField) | `variant` is per-component vocabulary in MUI; a single house enum will not survive contact |
| Size values | `Large \| Medium \| Small` here, `lg \| md \| sm` in the other project libraries | `Large \| Medium \| Small` everywhere | MUI's code says `small`, `medium`, `large`; one vocabulary across libraries |
| Text properties | `Label text`, `Title text`, `Placeholder text` | `Label`, `Title`, `Placeholder`; `Helper text` for MUI's `helperText` | Bare noun is the majority (51%, 14 repos) and matches MUI's props; keep "text" only where the prop has it |
| Booleans paired with a property | `Title` + `Title text`, `Icon` + `Icon swap` | `Show title` + `Title`, `Show icon` + `Icon`; unpaired booleans stay bare (`Divider`) | Kits rarely give two properties the same bare noun; `Show` is the most used prefix (117 against 32 for `Has`). Split evidence, see [section 4](#4-when-does-mui-use-a-boolean-and-when-an-enum) |
| Instance swaps | `Icon swap`, lowercase `table` | `Icon`; `Leading icon` and `Trailing icon` for MUI's `startIcon` and `endIcon` | Name the thing, not the mechanism. Position words are split across kits; see [section 9](#9-what-is-a-slot-and-which-figma-layer-is-one) |
| Slot properties | `Content slot`, `Items slot` | Unchanged for now | Only three kits map native slots; one precedent (LI.FI `Content slot`) |
| Text layers | Mostly `Label`; outliers such as `Number text` | Bare noun matching the bound property (`Number`) | Layer and property read the same |
| Nested instances | 132 of 278 renamed (`Item` for `Sidebar - Section - Item`) | Component name kept; rename only to separate repeats, by role (`Primary`) or number (`Item 1`) | Keeping the name is the majority, and it is what Code Connect finds without aliases |

**Change in the theme**

| Item | Figma | Theme entry |
|---|---|---|
| Default size Large | `Size` default `Large` | `MuiButton: { defaultProps: { size: 'large' } }`, and one entry per component whose default differs |
| `States/Hover/opacity`, `States/Disabled/opacity` | Tokens | `palette.action.hoverOpacity`, `palette.action.disabledOpacity`, per colour scheme, with different dark values |
| `States/Focus/stroke-colour`, `stroke-width` | Tokens | Global `styleOverrides` on `MuiButtonBase` and the input components targeting `.Mui-focusVisible`; MUI has no focus-ring token |
| Emphasis `base·soft·medium·strong` | Token slot | Extra palette keys per semantic colour, with a `PaletteColor` augmentation |
| `Colour/Level/{base…overlay-offset}` | Five named levels | Five chosen indices in `theme.shadows`, plus `defaultProps: { elevation: n }` per surface component |
| Radius scale (9 values) | `Primitives - Global` | `shape.borderRadius` plus eight named keys, with a `Shape` augmentation |
| Spacing scale | `0·2·4·6·8·12·16·20·24·32` | `spacing: [0, 2, 4, 6, 8, 12, 16, 20, 24, 32]` |
| Text styles | `{Headline\|Title\|Body\|Label\|Caption\|Link}/{size}` | Custom typography variants, MD2 defaults disabled where unused |
| Eight brands | `Semantic - Brand` modes | Eight `createTheme()` results from one generated `brandedTokens`, per [section 15](#15-how-do-you-run-eight-brands-across-two-themes) |
| WCAG 2.2 AA floor | House rule | `contrastThreshold: 4.5` |
| Uppercase buttons | Not in the design | `typography.button.textTransform: 'none'` |

**Accept as a named deviation**

| Item | Deviation | Why it is acceptable |
|---|---|---|
| `Danger` versus `error` | The Figma word and the code word differ for exactly one Feedback family | Both are defensible: `Danger` is house canon across two platforms, `error` is MUI's palette key, and Joy UI uses `danger`, so the split is MUI's inheritance rather than a house mistake. Record it in the code-gen notes of every Feedback component |
| `State` axis | No MUI prop, no MUI theme key | Already ruled and already documented in the house description lines. It is documentation of what code must produce, not a build instruction |
| `Press` state | No `action.pressed` token exists | Needs a custom theme key. MUI's own answer is the ripple, which is a different visual model |
| `_` prefix internals | Not exported by MUI | They are slots, reached through `slotProps`, which is the correct mapping and needs no change on either side |

**Traps specific to this mapping.**

- **The properties table is the handover, and it is generated.** If the Figma property names do not match the MUI prop names, the generated table teaches a developer the wrong vocabulary with a design system's authority behind it. Fix the axis and property names before regenerating.
- **`Disabled` is not like the other states.** It is a real prop a developer types, unlike hover and press. The house description line groups them together, correctly for design purposes, and the code-gen note should separate them.
- **The sparse grid is already the right answer, for a second reason.** MUI's stated preference for enums over multiple booleans is the same argument as omitting impossible cells, arrived at from the API side. Worth citing in the house rule, because a rule with two independent derivations is harder to argue away.
- **A slot with no Figma counterpart is a finding.** If MUI exposes a slot the Figma component does not model (`startAdornment` on TextField, `action` on Alert), either the design has not considered that composition or the build is about to invent it.
- **The primitives page in `Specs` is a hex snapshot.** It ages silently when a token changes, which is already recorded. It also becomes the artefact most likely to be copied into a theme file by hand, and a hand-copied hex is how a theme and a library diverge without anything failing.

**What to do.** Work the three lists in order: Figma renames first, because they change the generated properties tables that everything downstream reads; then the theme entries, generated from the token export rather than hand-written; then record the four deviations as rulings so the next session inherits the decision rather than re-deriving it. Judgment throughout, and it depends on one thing being true: that MUI is actually the code target for the web app. If the mobile app is not MUI, none of the Figma renames should cross into the mobile library, and the shared-vocabulary rule between the two platforms will need a ruling of its own.

---

## 18. Cheat sheet

**Component names**

| This | Not this |
|---|---|
| `Snackbar` | Toast |
| `Autocomplete` | Combobox, Typeahead |
| `TextField` | Input, Field |
| `Select` | Dropdown |
| `Chip` | Tag, Pill |
| `Drawer` | Sidebar, Sheet |
| `Dialog` | Modal (which is a different, lower-level thing) |
| `CircularProgress`, `LinearProgress` | Spinner, Loader |
| `Backdrop` | Overlay, Scrim |
| `Stepper` | Wizard |
| `Typography` | Text |
| `Paper` | Surface |
| `Fab` | FloatingActionButton |
| `Accordion` | ExpansionPanel (renamed in v5) |
| `ImageList` | GridList (renamed in v5) |
| `Grid` | `Grid2`, `GridLegacy` (both gone by v9) |

In Figma these are written in sentence case as separate words (`Text field`, `Circular progress`).

**Figma names against MUI**

| Figma | This | Not this | MUI |
|---|---|---|---|
| Part | `Card header`, `_Pagination page item` | `Card - Header`, `Table - Context flyover - Section - Item` | `CardHeader` (kit: `Card/Elements/CardHeader`) |
| Text property | `Label`, `Title`, `Placeholder`, `Helper text` | `Label text`, `Title text` | `label`, `title`, `placeholder`, `helperText` |
| Boolean, unpaired | `Badge`, `Divider` | `Show badge` | none, or an adjective (`fullWidth`) |
| Boolean, paired | `Show label` + `Label`, `Show icon` + `Icon` | `Label` + `Label text`, `Icon` + `Icon swap` | pass or omit the prop |
| Boolean variant values | `True` / `False` | `Yes` / `No` | `true` / `false` |
| Instance swap | `Icon`, `Leading icon`, `Trailing icon` | `Icon swap` | `startIcon`, `endIcon` |
| Slot property | `Content slot` (unverified) | | `children`, slot content |
| Size values | `Small`, `Medium`, `Large` | `sm`, `md`, `lg` | `small`, `medium`, `large` |
| Text layer | `Label`, `Number` | `Number text` | |
| Nested instance | component name; `Item 1`, `Primary` for repeats | `Item` for `Sidebar - Section - Item` | |

**Prop shapes**

| Question | MUI's answer |
|---|---|
| Two values | Boolean, defaults `false`, named as an adjective |
| Three or more | Enum |
| Turning a feature off | `disableRipple`, `disableElevation`, `disableSpacing` |
| Visual treatment | `variant`, values differ per component |
| Palette key | `color`, plus `inherit`, plus any custom string |
| Scale | `size`: `small` / `medium` / `large`, default `medium` |
| Controlled | `value` + `onChange`, or `open` + `onClose` / `onOpen` |
| Uncontrolled | `defaultValue`, `defaultChecked` |
| Multi-event handler | Noun then verb: `onRowsPerPageChange` |
| Reaching inside | `slots` and `slotProps`, never `*Props` or `components*` |
| Changing the root element | `component` (singular; `components` plural is gone) |

**Class names**

| Shape | Example |
|---|---|
| Element | `.MuiButton-root`, `.MuiSlider-thumb` |
| Enum variant | `.MuiButton-contained`, `.MuiButton-colorPrimary`, `.MuiButton-sizeLarge` |
| Boolean variant | `.MuiButton-fullWidth` |
| State (always paired with a component class) | `.Mui-disabled`, `.Mui-focusVisible`, `.Mui-focused`, `.Mui-selected`, `.Mui-checked`, `.Mui-error`, `.Mui-expanded`, `.Mui-active`, `.Mui-completed`, `.Mui-readOnly`, `.Mui-required` |
| Combined (removed in v9) | `.MuiButton-contained.MuiButton-colorPrimary`, not `.MuiButton-containedPrimary` |

**Colour tokens**

| Need | Token |
|---|---|
| Semantic colour | `palette.{primary\|secondary\|error\|warning\|info\|success}.{main\|light\|dark\|contrastText}` |
| Body text | `palette.text.{primary\|secondary\|disabled}` |
| Surfaces | `palette.background.{default\|paper}` |
| Rules | `palette.divider` |
| Hover | `palette.action.hover`, `palette.action.hoverOpacity` |
| Focus | `palette.action.focus`, `palette.action.focusOpacity` |
| Pressed | Does not exist |
| Disabled | `palette.action.disabled`, `disabledBackground`, `disabledOpacity` |
| Selected | `palette.action.selected`, `selectedOpacity` |
| CSS variable | `--mui-palette-primary-main` |
| Translucent composition | `rgba(var(--mui-palette-primary-mainChannel) / 0.12)` |

**Other theme keys**: `typography` (13 variants), `spacing` (factor 8, or an array), `shape.borderRadius` (4, single value), `shadows` (25 entries, 0 to 24), `breakpoints` (0 / 600 / 900 / 1200 / 1536), `zIndex` (1000 to 1500), `components.MuiX.{defaultProps, styleOverrides, variants}`.

---

## 19. The short version

Material UI names components after Material Design 2 plus React convention, and about a dozen of those names differ from what a design team writes on a Figma page: a toast is a `Snackbar`, a tag is a `Chip`, a sidebar is a `Drawer`, a spinner is `CircularProgress`, and an input is a `TextField`. When MUI has renamed something, it has renamed towards the wider industry word, and it has been willing to break everyone to do it. For a Figma library whose code target is MUI, the cheapest thing is to use MUI's words from the start and keep house words only where MUI has no component.

Compound components are named parent plus PascalCase suffix, as flat top-level exports: `CardHeader`, `DialogActions`, `ListItemButton`. Base UI, the unstyled layer now underneath MUI's newest components, does the opposite with dot-namespaced parts, which is worth knowing but is not what Material UI looks like. Every element MUI renders carries a class of the form `.MuiButton-contained`, and every state one of eleven global classes like `.Mui-focusVisible`. That class list is a machine-readable variant grid and is the natural target for any later design-to-code parity check.

The Figma names themselves were checked against real kits rather than MUI alone: 1,103 Code Connect files in 23 repositories, part names in 33 kits, and MUI's own Figma kit release notes. In Figma, parts are best joined to their parent by a space in sentence case (`Card header`), the majority form; MUI's kit uses slash folders with the export name (`Card/Elements/CardHeader`), and no kit chains parts with ` - ` as Project A does today. A blind re-run on 6 October 2026, over 46 kits and 1,998 Code Connect files collected independently, reached the same conventions: space-joined part names in 13 kits (the most common; ` - ` only in Carbon, 6 names), bare-noun text properties in 38 of 40 kits (322 of 489 names), `Show X` with a bare `X` as the most common boolean pair (13 kits), `Icon` as the most common swap name, a `State` axis in 33 of 46 kits, and Size values as words (`Small`, `Medium`, `Large`) in 27 kits against codes in 20. Text properties take MUI's prop as a bare noun (`Label`, `Title`, `Placeholder`), keeping "text" only for `helperText`, which makes `Helper text`. A boolean that shows an element with its own property takes `Show` (`Show label` beside `Label`), which is a judgment on split evidence; an unpaired boolean stays a bare noun. Swaps are named for what they hold (`Icon`, and `Leading icon` and `Trailing icon` for `startIcon` and `endIcon`), nested instances keep their component's name, and native slot properties are too new for a pattern.

Props follow a stated rule: two values means a boolean defaulting to `false` and named as an adjective, three or more means an enum. `variant` is the visual treatment and its values change per component, `color` is a palette key, `size` is small/medium/large defaulting to medium. Interaction states are not props at all: hover, focus and press are CSS, while `disabled`, `selected`, `checked` and `loading` are props that produce state classes. Project A's existing rule that state and disabled are code-managed is exactly right, and its sparse variant grids are the same argument MUI makes for preferring enums over multiple booleans. Reaching inside a component is done with `slots` and `slotProps`; every older form (`InputProps`, `inputProps`, `components`, `componentsProps`) was removed in v9, and the rename of `inputProps`/`InputProps` to `htmlInput`/`input` is the clearest example of MUI's naming instinct, which is to spell out a distinction rather than encode it in punctuation.

Colour is where the shapes genuinely disagree. MUI's palette gives four slots per semantic colour (`main`, `light`, `dark`, `contrastText`) plus `text`, `action`, `background`, `divider`, `common` and a grey ramp. It is not a step ramp, and an emphasis taxonomy of `base · soft · medium · strong` does not fit into it without adding palette keys and augmenting the types. Joy UI, from the same vendor, built the model that would have fitted, and it is on hold. The interaction-state layer, `palette.action`, does map almost one to one onto a `States/` token group, with two gaps worth naming: there is no pressed token, and focus is a translucent overlay rather than a stroke, so a focus-ring specification has to be implemented as a global override. Dark mode is not a mirror of light: MUI doubles most overlay opacities, and a single mode-independent opacity per state will read as too subtle on dark surfaces.

For eight brands across two themes, build one generated `brandedTokens` object and compose eight themes from it, merging component overrides with the array syntax rather than object spread so variants and pseudo-class styles survive. Custom-named colour schemes switched by a CSS selector would mirror Figma's mode mechanism exactly and are documented as possible at the MUI System level, but Material UI's own docs show only light and dark, so that is a prototype rather than a plan. Putting `var()` into the palette is closed for now, because MUI's colour maths parses those values, though v9's new `color-mix()` support is aimed at that problem and is worth re-checking.

Four things need a decision rather than a mapping. `Danger` against MUI's `error`: keep the house word in Figma, emit `error` in the theme, and write the pair into the code-gen notes, because both words are defensible and only one of them is negotiable. Text style names: MUI is still on Material Design 2's `subtitle1` and `overline` vocabulary, MD3 has not shipped and has no date, so an MD3-flavoured scale means custom typography variants. Default size: the design defaults to Large and MUI defaults to medium, so every component with a different default needs a `defaultProps` entry, generated from the variant grids rather than found one bug at a time. And the press state, which has no MUI token and needs a custom key rather than a token that looks close enough.

Write the deviations down as rulings the moment they are decided. Every one of them is a place where the Figma file and the theme file say different things on purpose, and a deliberate difference that nobody recorded is indistinguishable from drift six months later.

---

## 20. What to re-check later

**Volatile, in order of how fast it will move.**

- **The v9 `color-mix()` work.** Announced in the v9 posts as extending the CSS variables system to generate `color-mix()` values, with no detailed documentation page found. If it covers derived palette values, option C in [section 15](#15-how-do-you-run-eight-brands-across-two-themes) reopens and the whole brand-layer decision changes. Re-check before committing to eight theme objects.
- **Custom-named colour schemes.** MUI System documents unlimited schemes beyond light and dark; no concrete example of a custom scheme name or its generated selector was found on either the System or the Material UI configuration page. This is the single weakest-evidence claim in the guide and it is load-bearing for option B.
- **Material Design 3.** Not shipped as of v9. The tracking issue shows a partial component checklist with no date, and v9's own announcement frames Material Design support as future work. It has been "one of our top priorities" for more than one calendar year, so treat any date as an estimate.
- **The styling engine.** Pigment CSS is in alpha and on hold. v9's stated direction is independence from Emotion and better integration for Tailwind users. If either lands, the `.Mui*` class contract in [section 3](#3-what-are-muis-css-class-names-and-why-does-a-designer-need-them) is the thing most likely to change, and any parity check keyed on those classes changes with it.
- **The Figma design kit.** Sold at v9.0.0 with a last release of 19 June 2026, and described as sharing terminology from the React library for props, variables and design tokens. Its public release notes confirm two naming facts: release 5.9.0 moved every part into a slash folder under its parent (`Card/Elements/CardHeader`, `DataGrid/Elements/Cell`, `Slider/Elements/Slider Track`) and matched variant names with the React components, and release 9.0.0 added native Figma slots. Its text, boolean and swap property names were still not inspected, because the kit is paid and the free community version's structure was not opened. If the team buys it, that check is a half-hour job and would confirm or replace the property-name advice in [section 17](#17-how-should-the-project-a-figma-library-map-onto-mui).
- **Native slot properties.** Only three of 23 Code Connect repositories map a Figma slot property (LI.FI `Content slot`, MetaMask `startAccessory`, Codecademy `body`), so the slot naming advice rests on one precedent. Re-check once more kits adopt slots.
- **What the October 2026 revision changed.** The part-naming advice no longer endorses the ` - ` separator: no surveyed kit uses it for parts, and section 2 now recommends a space join. Text properties drop the `text` suffix except for `helperText`, paired booleans take `Show`, swaps drop `swap`, size values settle on `Small | Medium | Large`, and nested instances keep their component name. The evidence is Code Connect files parsed by script (a handful read by eye), which only show what each kit maps, so per-kit counts are lower bounds; the Figma files themselves were not opened.
- **MUI Sync.** Development stopped in 2024 and it is not recommended for new projects. Do not plan a Figma-to-theme pipeline around it. It is listed here because it is still linked from the design-resources docs and reads as current.

**Evidence quality, honestly.** Everything about MUI's own API, palette, typography, spacing, shadows, breakpoints and z-index comes from primary sources: the docs pages, the migration guides, or the source files, most of them fetched and read rather than searched. The Material Design 3 status rests on a single GitHub tracking issue whose checklist may be stale. The Figma kit's part names come from its own release notes; its property names still rest on marketing and docs prose rather than on the file.

**One scope limit worth stating.** This guide compares MUI against Base UI and Joy UI, which are the same vendor, and against Project A's own conventions. It does not run the cross-system comparison that would establish whether MUI's choices are industry consensus or MUI's alone, because the question asked was how MUI does it. Where this guide says a convention is consensus, that means consensus within MUI's own documented rules and its migration history, not across the industry. If a decision here turns out to be expensive, that is the check that has not been run. The exception is Figma naming (parts, properties, values, layers and nested instances), which was checked across 23 Code Connect repositories and 33 kits; there, "majority" means a count across those kits.

---

## Sources

**Primary**

Release state and history
- [Material UI Versions](https://mui.com/versions/)
- [Introducing Material UI and MUI X v9](https://mui.com/blog/introducing-mui-v9/)
- [Material UI v9.0](https://mui.com/blog/introducing-material-ui-v9/)
- [Material UI v7 is here](https://mui.com/blog/material-ui-v7-is-here/)
- [MUI Update: what we've been working on (and why)](https://mui.com/blog/2026-and-beyond/)
- [MUI blog index](https://mui.com/blog/)

Migration guides
- [Upgrade to v9](https://mui.com/material-ui/migration/upgrade-to-v9/)
- [Upgrade to v6](https://mui.com/material-ui/migration/upgrade-to-v6/)
- [v5 component changes](https://mui.com/material-ui/migration/v5-component-changes/)

API design and component reference
- [API design approach](https://mui.com/material-ui/guides/api/)
- [All components](https://mui.com/material-ui/all-components/)
- [Button API](https://mui.com/material-ui/api/button/)
- [TextField API](https://mui.com/material-ui/api/text-field/)
- [Alert](https://mui.com/material-ui/react-alert.md)
- [Card](https://mui.com/material-ui/react-card.md)
- [Dialog](https://mui.com/material-ui/react-dialog.md)
- [List](https://mui.com/material-ui/react-list.md)
- [Material Icons](https://mui.com/material-ui/icons.md)

Structure and customisation
- [Overriding component structure](https://mui.com/material-ui/customization/overriding-component-structure.md)
- [How to customize](https://mui.com/material-ui/customization/how-to-customize/)
- [Composition](https://mui.com/material-ui/guides/composition/)
- [Creating themed components](https://mui.com/material-ui/customization/creating-themed-components/)
- [Building extensible themes](https://mui.com/material-ui/guides/building-extensible-themes.md)

Theme and tokens
- [Theming](https://mui.com/material-ui/customization/theming/)
- [Palette](https://mui.com/material-ui/customization/palette/)
- [Typography](https://mui.com/material-ui/customization/typography/)
- [Spacing](https://mui.com/material-ui/customization/spacing.md)
- [Shape](https://mui.com/material-ui/customization/shape.md)
- [Breakpoints](https://mui.com/material-ui/customization/breakpoints.md)
- [Default theme viewer](https://mui.com/material-ui/customization/default-theme.md)
- [CSS theme variables: usage](https://mui.com/material-ui/customization/css-theme-variables/usage/)
- [CSS theme variables: configuration](https://mui.com/material-ui/customization/css-theme-variables/configuration/)
- [MUI System: CSS theme variables](https://mui.com/system/experimental-api/css-theme-variables/)

Source files
- [`createPalette.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/createPalette.js)
- [`createTypography.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/createTypography.js)
- [`shadows.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/shadows.js)
- [`zIndex.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/zIndex.js)

Design resources
- [Material UI for Figma](https://mui.com/material-ui/design-resources/material-ui-for-figma.md)
- [MUI for Figma, store listing](https://mui.com/store/items/figma-react/)
- [Material UI Sync plugin](https://mui.com/material-ui/design-resources/material-ui-sync/)
- [MUI design kits, release notes](https://github.com/mui/mui-design-kits/releases) (5.4.0 state renames, 5.9.0 `/Elements/` part folders and React-matched variant names, 9.0.0 slots)

Figma naming evidence (Code Connect files and kit changelogs, read 5 October 2026)
- [Explore component properties, Figma help](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)
- [figma/sds](https://github.com/figma/sds) (`Has Label` + `Label`, `Icon Start`, `Icon End`, `Accordion Item`)
- [carbon-design-system/carbon](https://github.com/carbon-design-system/carbon) (`Show helper` + `Helper text`, `Label text`, `_Menu list item`)
- [carbon-design-system/ibm-products](https://github.com/carbon-design-system/ibm-products) (`Eyebrow` + `Eyebrow text`, `Swap slot`)
- [primer/react](https://github.com/primer/react) (`leadingVisual?` + `leadingVisual`, `NavList.Item/SubItem`, `trigger`)
- [lifinance/design-system](https://github.com/lifinance/design-system) (`Title` + `↳ Title`, `Content slot`)
- [mozilla-firefox/firefox](https://github.com/mozilla-firefox/firefox) (`Show heading` + `Heading`)
- [qualcomm/qualcomm-ui](https://github.com/qualcomm/qualcomm-ui) (`labelText`, `startIcon`, `_Breadcrumb item`)
- [Infineon/infineon-design-system-stencil](https://github.com/Infineon/infineon-design-system-stencil) (`Show Label` + `Label Text`, `Left icon`)
- [ITS-HCD/nysds](https://github.com/ITS-HCD/nysds) (`Option 1` to `Option 10`, `_Card Content`)
- [coveo/plasma](https://github.com/coveo/plasma) (`.Accordion.Item`, `Swap Left`)
- [MetaMask/metamask-design-system](https://github.com/MetaMask/metamask-design-system) (`hasLabel` + `label`, `startAccessory`)
- [Codecademy/gamut](https://github.com/Codecademy/gamut) (`↳ leading icon`, `body` slot)
- [synergy-design-system](https://github.com/synergy-design-system/synergy-design-system) (`<slot prefix>`, `_helper/syn-card/footer`)
- [equinor/design-system](https://github.com/equinor/design-system) (`Leading Icon Item`, `Trailing Icon Item`)
- [GitLab UI kit release notes](https://design.gitlab.com/get-started/uik-release-notes) (`❖ _Base body cell`)

Sibling libraries, used as counter-examples
- [Base UI quick start](https://base-ui.com/react/overview/quick-start)
- [Base UI Select](https://base-ui.com/react/components/select)
- [Joy UI theme colors (v7 docs)](https://v7.mui.com/joy-ui/customization/theme-colors/)

Tracking
- [Adopt Material Design 3 / Material You, issue #29345](https://github.com/mui/material-ui/issues/29345)

**Project context**

- `projects/project-d/design-system-context.md`, sections 1 to 4, for the token formula, variant axis canon, state models, page organisation and the Foundations collection structure.

**Cited but not resolved to a URL**

- The pull request adding the `loading` prop to `Button` (mui/material-ui #44637) was surfaced in search but not opened; the v6.4.0 behaviour it describes is sourced from the [Upgrade to v6](https://mui.com/material-ui/migration/upgrade-to-v6/) guide and the [Button API](https://mui.com/material-ui/api/button/) instead.
