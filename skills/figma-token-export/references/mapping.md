# Why each mapping is what it is

Reasoning, not code. Every executable line lives in `scripts/`. Read this when an
exported token looks wrong, or before changing a mapping — each entry records what
the alternative cost.

## Colour: object by default, hex on request

DTCG 2025.10's colour module requires an **object** — `colorSpace`, `components`,
optional `alpha`, optional `hex` — and a bare hex string is no longer a valid
`$value`. The spec also constrains the `hex` fallback to six digits, so alpha lives
in `alpha` and nowhere else; an eight-digit `hex` would be a quiet violation that
every viewer renders correctly.

Style Dictionary v4 consumes the older hex-string form today, and its 2025.10
support is still in progress. So the default is the compliant object and
`colorFormat: 'hex'` is the escape hatch, rather than the other way round: an export
that claims DTCG compliance should be compliant, and a build that needs the legacy
shape should have to say so.

## Dimension: an object, not a number

`{value: 8, unit: 'px'}`, never `8`. This is the single most common defect in
hand-rolled Figma exports, because Figma stores a plain float and JSON is happy to
carry it. A number where a dimension belongs validates as a `number` token and
silently loses its unit at the other end.

`rem` divides by a root size the file cannot know. That is why the root is a
question rather than a constant, and why it is 16 only as a default.

## Opacity: detected per group, not per variable

Figma has no notion of a percentage; `Opacity/50` is the number 50 and means half.
A per-variable guess would map `Opacity/0` inconsistently against its own siblings,
so the scale is decided once per group from the observed maximum: any value above 1
means the group is authored 0–100. An explicit `opacity: 'percent' | 'unit'`
overrides the detection where a library mixes both, which is a state worth fixing in
Figma rather than in the exporter.

## Font weight: mapped, and rejected when unknown

Figma stores the display name of the style — `"Semi Bold"` as a variable value,
`"SemiBold"` as `fontName.style` on a text style. The same weight, spelled two ways,
in the same file. DTCG accepts a number in [1, 1000] or one of its own keywords, and
neither spelling is a keyword, so a passthrough export produces an invalid token that
looks entirely reasonable.

Both spellings normalise to `semi-bold` and map to 600. An unrecognised weight is
**reported and skipped**, not defaulted: a wrong weight renders, which means nobody
finds it.

## Strings that are not fonts have no DTCG type

There is no string type in DTCG. A currency symbol or a unit abbreviation held as a
Figma STRING variable is a real token to the design system and an inexpressible one
to the format. It is skipped and reported, so the decision — a sibling non-DTCG file,
an `$extensions` block, or leaving it in Figma — stays with the project.

## Aliases stay references

An alias exports as `{collection.group.token}` and is never resolved to its value.
Flattening would produce files that build and lose the thing that made the library
worth exporting: the tier structure, and with it the ability to change a primitive
once. It also makes every mode file self-contained-looking while being unmaintainable.

The cost is that references must resolve at build time, which is what
`verifyReferences()` checks and what the manifest exists to guarantee.

## Typography: composite, with two conversions

- **Line height.** Figma percent is relative to font size; DTCG `lineHeight` is a
  unitless multiplier. 115% → 1.15. Pixel line heights divide by the style's own
  font size. `AUTO` has no equivalent and is omitted with a warning — inventing a
  multiplier would be a value nobody authored.
- **Letter spacing.** Figma percent is again relative to font size, and DTCG
  dimensions are absolute (`px` or `rem` only). Since the style's font size is known
  at conversion time, percent resolves to an absolute value rather than being
  dropped: -2% at 32px is -0.64px.

Bound properties export as references, unbound ones as literals. A style that binds
its size but hard-codes its line height therefore produces a token that is half
reference and half literal, which is an accurate description of the style.

## Modes: files, not paths

The mode is in the **file name**, never in the token path: one folder per
collection, one file per mode. `semantic/light.json` and `semantic/dark.json`
define the same paths with different values, which is what lets a consumer swap one
file and change a theme without touching a single reference.

The consequence is that the two files can never be in the same build, and that is
what the manifest encodes.

## The manifest: mode-name sets are axes

Collections sharing a mode-name set move **together**. A primitive tier and a
semantic tier both carrying Light/Dark are one theme switch; treating them as
independent axes doubles the builds and produces primitive-Light-with-semantic-Dark,
a combination no one would ship.

This was found on the first real library rather than in the fixture, which had a
single multi-mode collection and so could not express the bug. The fixture now
carries the three-collection case as a regression.

## Shadows: exported, inner shadows included

DTCG's `shadow` object defines `color`, `offsetX`, `offsetY`, `blur`, `spread` and,
since the 2025.10 report, an optional `inset`. An inner shadow, or a composite that
layers one under a drop shadow, is therefore expressible as written, and the export
emits `inset: true` on the layers that need it with nothing mirrored elsewhere.

A composite is emitted top layer first. Figma paints the last entry of its effects
array on top; a CSS shadow list paints the first on top; DTCG does not say. The
export follows CSS, because that is what every consumer renders.

Layers that cannot be expressed at all — a background blur, a hidden layer — are
omitted and reported by name and type, never approximated.
