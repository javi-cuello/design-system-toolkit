# MUI — the framework layer over the web target

The other three references answer *what does the platform do*. This one asks a narrower question. **When the project builds its web library on a named component library, what does that library's API allow**? It sits on top of `web.md`, never instead of it. A component that fails W5 fails it whether or not MUI renders it.

## Contents

- [The map](#the-map) · [Open and closed enums](#open-and-closed-enums)
- [MU1 · Closed enum](#mu1--a-variant-axis-outside-a-closed-enum) · [MU2 · Open enum](#mu2--a-variant-axis-outside-an-open-enum) · [MU3 · Loading](#mu3--a-drawn-loading-state-on-a-component-with-no-loading-prop) · [MU4 · Focus ring](#mu4--a-drawn-focus-ring-on-a-component-mui-already-indicates)
- [MU5 · Adornment](#mu5--an-adornment-that-is-neither-first-nor-last-in-the-field) · [MU6 · Trailing icon](#mu6--a-trailing-icon-that-maps-to-no-slot) · [MU7 · Withdrawn](#mu7--withdrawn) · [MU8 · Non-square icon](#mu8--a-non-square-icon)
- [MU9 · Name](#mu9--the-component-is-called-something-else-in-the-build) · [MU10 · Axis name](#mu10--an-axis-that-means-a-prop-but-is-not-named-for-it) · [MU11 · Unmapped](#mu11--a-component-the-map-does-not-name)
- [Sources](#sources) · [Withdrawn candidates](#withdrawn-candidates) · [Not found](#not-found)

## The map

A class here fires **only for a component the project has mapped**. The map is `frameworkComponents` in the project's `audit-settings`: one Figma component name to one MUI component name.

`unmappedFor()` reports what has no entry rather than guessing. A "Dropdown input" may be `Select`, `Autocomplete` or `TextField select`, and judging it against the wrong one is worse than not judging it. A rule that cannot know what a component *is* reports nothing. Nothing is also what a clean result looks like, so the run says which components were never examined.

## Open and closed enums

Version read: **MUI v9.4.0** (Material UI). Every claim below cites the API page it came from.

| Enum | Its type | A new value |
|---|---|---|
| **Open** | Ends in a `string` member | Extensible through a theme variant plus TypeScript module augmentation |
| **Closed** | Has no `string` member | Needs a different component |

That distinction is the whole difference between MU1 and MU2. It is read from the published type, never guessed.

## MU1 · A variant axis outside a closed enum

- **Figma allows:** any variant value on any axis.
- **MUI does:** a closed prop type lists its values and has no `| string` tail. A value outside it cannot be expressed. `TextField.variant` is `'filled' | 'outlined' | 'standard'` ([TextField](https://mui.com/material-ui/api/text-field/)).
- **Align:** *Figma* — one of the listed values. *Code* — a different component, where the drawn value is genuinely a different thing.
- **Detect:** a mapped component whose variant-like axis carries a value the closed enum does not list.

## MU2 · A variant axis outside an open enum

- **Figma allows:** the same.
- **MUI does:** an open prop type ends `| string`. So a new value is legal as a theme variant under `components.Mui<Component>.variants`, plus module augmentation to type it. `Button.variant` is `'text' | 'outlined' | 'contained' | string` ([Button](https://mui.com/material-ui/api/button/)).
- **Align:** *Figma* — rename the values to MUI's, if matching its vocabulary is worth more than your own. *Code* — keep your names, by registering them as theme variants plus a module augmentation to type them.
- **Detect:** a mapped component whose variant-like axis carries a value the open enum does not list.

Both alignments are legal, which is why this is a choice and not a defect. The row must offer both. Written as the code fix alone, it reads as a developer's ticket filed on a designer's board.

This is **work to name, not a defect**, and the two classes are separate for exactly that reason. MU1 says *this cannot exist*; MU2 says *this costs a theme entry*. Reporting both as one would tell a maintainer to redraw something that only needed scheduling.

## MU3 · A drawn loading state on a component with no `loading` prop

- **Figma allows:** a `Loading` value on a State axis, or a `Loading` boolean.
- **MUI does:** `loading` is Button and IconButton only, from v6.4.0 ([Button](https://mui.com/material-ui/api/button/)). No other component takes one.
- **Align:** *accept* as a named deviation, or *code* — a bespoke component.
- **Detect:** a mapped component that is not Button or IconButton and carries a drawn loading state.

## MU4 · A drawn focus ring on a component MUI already indicates

- **Figma allows:** a focus ring as a layer.
- **MUI does:** every ButtonBase-derived component renders its own focus indication, reachable as `&.Mui-focusVisible` ([customization](https://mui.com/material-ui/customization/how-to-customize/)).
- **Align:** *code* — express the drawn ring as a `.Mui-focusVisible` override, so it replaces MUI's rather than adding to it.
- **Detect:** a focus-named layer on a mapped component.

The failure this prevents is **two rings, not none**. A drawn ring built as a new element renders in addition to the one MUI already draws.

## MU5 · An adornment that is neither first nor last in the field

- **Figma allows:** an icon anywhere in the field's row.
- **MUI does:** an icon inside a field is an `InputAdornment`. Its `position` is a **required** two-value enum, `'start' | 'end'` ([InputAdornment](https://mui.com/material-ui/api/input-adornment/)).
- **Align:** *Figma* — first or last in the field row. *Code* — a custom `OutlinedInput`, where it genuinely sits in the middle.
- **Detect:** on a mapped TextField, Select or Autocomplete, an icon inside the layer named `Field` at neither the first nor the last content position.

**Overlays are not content.** A focus ring and a state layer are drawn over the whole field, and sit wherever layer order puts them. Counting them as content made ordinary fields report a middle adornment.

## MU6 · A trailing icon that maps to no slot

- **Figma allows:** any trailing icon on a chip.
- **MUI does:** the trailing slot of a `Chip` is `deleteIcon`, rendered only when `onDelete` is set ([Chip](https://mui.com/material-ui/api/chip/)).
- **Align:** *Figma* — name the property for the slot it maps to (`Deletable` → `onDelete`).
- **Detect:** a mapped Chip whose last child is an icon, and whose booleans name no delete-like action.

## MU7 · Withdrawn

Proposed as "a component offering both Select and Autocomplete behaviour", on the reading that a `Value text` property implied typing. It shipped no finding. A text property is how a designer writes the *displayed* value, and says nothing about whether the control accepts input. It is recorded rather than deleted, so the same idea is not derived again. The class id stays retired.

## MU8 · A non-square icon

- **Figma allows:** any icon dimensions.
- **MUI does:** `SvgIcon` sizes by `font-size` over a `0 0 24 24` viewBox, so one number drives both axes ([SvgIcon](https://mui.com/material-ui/api/svg-icon/)).
- **Align:** *Figma* — a square frame.
- **Detect:** an icon instance on a mapped component whose width and height differ.

## MU9 · The component is called something else in the build

- **Figma allows:** any component name.
- **MUI does:** every component has one exported name. A developer imports that name, searches the docs for it and reads it in a stack trace ([all components](https://mui.com/material-ui/all-components/)).
- **Align:** *Figma* — rename it to the MUI name. *Accept* the house name where it means something MUI's does not, and record the pair, so the difference is deliberate rather than forgotten.
- **Detect:** a mapped component whose own name differs from its counterpart.
- **Many-to-one maps:** six input components may all map to `TextField`, one MUI component configured six ways. The pair is still recorded, but the advice says so: a rename cannot be followed by more than one of them.

The map is already there, since it is how every other class here knows what a component is. So this costs nothing to check, and keeps costing nothing as the map changes. One project's alignment study listed about forty of these by hand (Spinner is `CircularProgress`, Toast is `Snackbar`, Widget is `Card`). That list was true the day it was written, and had no way to stay true.

## MU10 · An axis that means a prop but is not named for it

- **Figma allows:** any variant property name.
- **MUI does:** the prop has one name, and the component's API page is written in it.
- **Align:** *Figma* — rename the axis to the prop. *Code* — map one to the other at the boundary, and carry the difference for ever.
- **Detect:** a mapped component with an axis `MUI_PROP` recognises as a prop, named something other than that prop.

The engine has always recognised the synonyms (`Role` for `variant`, `Position` for `placement`). MU1 and MU2 need them to find the axis whose VALUES they judge. So a file could carry an axis called `Role` for ever, while the check argued only about what was inside it.

## MU11 · A component the map does not name

- **Figma allows:** a component with no counterpart recorded anywhere.
- **MUI does:** nothing; this is about the project's own `frameworkComponents`.
- **Align:** *accept* — nothing changes in Figma or in code. Name the component's MUI component in the map, or give it `null` where MUI has no such component.
- **Detect:** a public component with no key in the map. `null` is a key.

Every class above asks the map what a component is, and stays silent where it has no answer. So an unnamed component is checked by none of them, and reads as clean. One library had 18 of 84 public components named; the run said so in its closing line, where it went unread.

The row is filed once, against the map, with the components it covers: the fix is one edit to one block. A private part is left to the component it belongs to.

## Sources

| Page | What it gives |
|---|---|
| [Button](https://mui.com/material-ui/api/button/) | `variant` open enum, `loading` since v6.4.0 |
| [TextField](https://mui.com/material-ui/api/text-field/) | `variant` closed enum |
| [InputAdornment](https://mui.com/material-ui/api/input-adornment/) | Required `position` |
| [Chip](https://mui.com/material-ui/api/chip/) | `deleteIcon` and `onDelete` |
| [SvgIcon](https://mui.com/material-ui/api/svg-icon/) | `0 0 24 24` viewBox, font-size sizing |
| [How to customize](https://mui.com/material-ui/customization/how-to-customize/) | `.Mui-focusVisible` |
| [All components](https://mui.com/material-ui/all-components/) | The exported names MU9 compares against |

## Withdrawn candidates

- "Spacing off the 8 px grid is unbuildable": any raw px value is legal in `sx`.
- "Colour enums are fixed": every `color` prop's type ends `| string`.

## Not found

- No published list of which components take `loading`. MU3's Button and IconButton pair is read from those two API pages. A component that gains one later will read as a finding until the pair is updated.
- Whether a prop's enum is open or closed is read from the published type on each API page. There is no machine-readable index of that across components. So `MUI_ENUMS` is hand-entered and dated, and a version bump needs it read again.
