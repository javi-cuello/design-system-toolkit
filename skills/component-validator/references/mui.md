# MUI — the framework layer over the web target

The other three references answer *what does the platform do*. This one answers
a narrower question: **when the project builds its web library on a named
component library, what does that library's API allow?** It sits on top of
`web.md`, never instead of it — a component that fails W5 fails it whether or
not MUI renders it.

A class here fires **only for a component the project has mapped**. The mapping
is `frameworkComponents` in the project's `audit-settings`, one Figma component name
to one MUI component name, and `unmappedFor()` reports what has no entry rather
than guessing: a "Dropdown input" may be `Select`, `Autocomplete` or `TextField select`, and judging it against the wrong one is worse than not judging it. A rule that cannot know what a component *is* reports nothing,
and nothing is what a clean result looks like — so the run says which
components were never examined.

Version read: **MUI v9.4.0** (Material UI). Every claim below cites the API
page it came from. A prop's type either ends in `| string` (an **open** enum,
extensible through a theme variant plus TypeScript module augmentation) or it
does not (a **closed** enum, where a new value needs a different component).
That distinction is the whole difference between MU1 and MU2, and it is read
from the published type, never guessed.

---

## MU1 · A variant axis outside a closed enum

**Figma allows:** any variant value on any axis.
**MUI does:** a closed prop type lists its values and has no `| string` tail, so
a value outside it is not expressible — `TextField.variant` is
`'filled' | 'outlined' | 'standard'` ([TextField](https://mui.com/material-ui/api/text-field/)).
**Align:** *Figma* — one of the listed values; *code* — a different component
where the drawn value is genuinely a different thing.
**Detect:** a mapped component whose variant-like axis carries a value the
closed enum does not list.

## MU2 · A variant axis outside an open enum

**Figma allows:** the same.
**MUI does:** an open prop type ends `| string`, so a new value is legal as a
theme variant under `components.Mui<Component>.variants`, plus module
augmentation to type it — `Button.variant` is
`'text' | 'outlined' | 'contained' | string` ([Button](https://mui.com/material-ui/api/button/)).
**Align:** *Figma* — rename the values to MUI's if matching its vocabulary is
worth more than your own; *code* — keep your names by registering them as theme
variants plus a module augmentation to type them. Both are legal, which is why
this is a choice and not a defect, and why the row must offer both: written as
the code fix alone it reads as a developer's ticket filed on a designer's board.
**Detect:** a mapped component whose variant-like axis carries a value the open
enum does not list.

This is **work to name, not a defect**, and the two classes are separate for
exactly that reason: MU1 says *this cannot exist*, MU2 says *this costs a theme
entry*. Reporting both as one would have told a maintainer to redraw something
that only needed scheduling.

## MU3 · A drawn loading state on a component with no `loading` prop

**Figma allows:** a `Loading` value on a State axis, or a `Loading` boolean.
**MUI does:** `loading` is Button and IconButton only, from v6.4.0
([Button](https://mui.com/material-ui/api/button/)); no other component takes one.
**Align:** *accept* as a named deviation, or *code* — a bespoke component.
**Detect:** a mapped component that is not Button or IconButton and carries a
drawn loading state.

## MU4 · A drawn focus ring on a component MUI already indicates

**Figma allows:** a focus ring as a layer.
**MUI does:** every ButtonBase-derived component renders its own focus
indication, reachable as `&.Mui-focusVisible`
([customization](https://mui.com/material-ui/customization/how-to-customize/)).
**Align:** *code* — express the drawn ring as a `.Mui-focusVisible` override so
it replaces MUI's rather than adding to it.
**Detect:** a focus-named layer on a mapped component.

The failure this prevents is **two rings, not none**: a drawn ring built as a
new element renders in addition to the one MUI already draws.

## MU5 · An adornment that is neither first nor last in the field

**Figma allows:** an icon anywhere in the field's row.
**MUI does:** an icon inside a field is an `InputAdornment`, whose `position` is
a **required** two-value enum, `'start' | 'end'`
([InputAdornment](https://mui.com/material-ui/api/input-adornment/)).
**Align:** *Figma* — first or last in the field row; *code* — a custom
`OutlinedInput` where it genuinely sits in the middle.
**Detect:** on a mapped TextField, Select or Autocomplete, an icon inside the
layer named `Field` at neither the first nor the last content position.

**Overlays are not content.** A focus ring and a state layer are drawn over the
whole field and sit wherever layer order puts them; counting them as content
made ordinary fields report a middle adornment.

## MU6 · A trailing icon that maps to no slot

**Figma allows:** any trailing icon on a chip.
**MUI does:** `Chip`'s trailing slot is `deleteIcon`, rendered only when
`onDelete` is set ([Chip](https://mui.com/material-ui/api/chip/)).
**Align:** *Figma* — name the property for the slot it maps to (`Deletable` →
`onDelete`).
**Detect:** a mapped Chip whose last child is an icon and whose booleans name no
delete-like action.

## MU7 · Withdrawn

Proposed as "a component offering both Select and Autocomplete behaviour", on
the reading that a `Value text` property implied typing. It shipped no finding:
a text property is how a designer writes the *displayed* value, and says nothing
about whether the control accepts input. Recorded rather than deleted so the
same idea is not re-derived — the class id stays retired.

## MU8 · A non-square icon

**Figma allows:** any icon dimensions.
**MUI does:** `SvgIcon` sizes by `font-size` over a `0 0 24 24` viewBox, so one
number drives both axes ([SvgIcon](https://mui.com/material-ui/api/svg-icon/)).
**Align:** *Figma* — a square frame.
**Detect:** an icon instance on a mapped component whose width and height differ.

## MU9 · The component is called something else in the build

**Figma allows:** any component name.
**MUI does:** every component has one exported name, and that name is what a
developer imports, searches the docs for, and reads in a stack trace
([all components](https://mui.com/material-ui/all-components/)).
**Align:** *Figma* — rename it to the MUI name; *accept* the house name where it
means something MUI's does not, and record the pair so the difference is
deliberate rather than forgotten.
**Detect:** a mapped component whose own name differs from its counterpart. Where the map is many-to-one (six input components all mapped to `TextField`, one MUI component configured six ways) the pair is still recorded, but the advice says so: a rename cannot be followed by more than one of them.

The mapping is already there — it is how every other class here knows what a
component is — so this costs nothing to check and keeps costing nothing as the
map changes. One project's alignment study listed about forty of these by hand
(`Spinner` is `CircularProgress`, `Toast` is `Snackbar`, `Widget` is `Card`);
that list was true the day it was written and had no way to stay true.

## MU10 · An axis that means a prop but is not named for it

**Figma allows:** any variant property name.
**MUI does:** the prop has one name, and the component's API page is written in
it.
**Align:** *Figma* — rename the axis to the prop; *code* — map one to the other
at the boundary and carry the difference for ever.
**Detect:** a mapped component with an axis `MUI_PROP` recognises as a prop,
named something other than that prop.

The engine has always recognised the synonyms — `Role` for `variant`, `Position`
for `placement` — because MU1 and MU2 need them to find the axis whose VALUES
they judge. So a file could carry an axis called `Role` for ever while the check
argued only about what was inside it.

## MU11 · A component the map does not name

**Figma allows:** a component with no counterpart recorded anywhere.
**MUI does:** nothing — this is about the project's own `frameworkComponents`.
**Align:** *accept* — nothing changes in Figma or in code; name the component's
MUI component in the map, or give it `null` where MUI has no such component.
**Detect:** a public component with no key in the map. `null` is a key.

Every class above asks the map what a component is and stays silent where it
has no answer, so an unnamed component is checked by none of them and reads as
clean. One library had 18 of 84 public components named; the run said so in
its closing line, and that is where it went unread. Filed once, against the
map, with the components it covers: the fix is one edit to one block. A
private part is left to the component it belongs to.

---

## Sources

- [Button](https://mui.com/material-ui/api/button/) — `variant` open enum, `loading` since v6.4.0
- [TextField](https://mui.com/material-ui/api/text-field/) — `variant` closed enum
- [InputAdornment](https://mui.com/material-ui/api/input-adornment/) — required `position`
- [Chip](https://mui.com/material-ui/api/chip/) — `deleteIcon` and `onDelete`
- [SvgIcon](https://mui.com/material-ui/api/svg-icon/) — `0 0 24 24` viewBox, font-size sizing
- [How to customize](https://mui.com/material-ui/customization/how-to-customize/) — `.Mui-focusVisible`
- [All components](https://mui.com/material-ui/all-components/) — the exported names MU9 compares against

## Withdrawn candidates

- "Spacing off the 8 px grid is unbuildable": any raw px value is legal in `sx`.
- "Colour enums are fixed": every `color` prop's type ends `| string`.

## Not found

- No published list of which components take `loading`; MU3's Button/IconButton
  pair is read from those two API pages, so a component that gains one later
  will read as a finding until the pair is updated.
- Whether a prop's enum is open or closed is read from the published type on
  each API page. There is no machine-readable index of that across components,
  so `MUI_ENUMS` is hand-entered and dated, and a version bump needs it re-read.
