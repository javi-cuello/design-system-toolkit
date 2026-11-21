# Tokens, Figma variables and descriptions

How a generated scale becomes design tokens and Figma variables: names, suffixes, descriptions and the two-mode block. [SKILL.md](../SKILL.md) step 8 points here. `generate.js` writes all of it; none of it is a convention to apply by hand.

## Contents

- [Conversion](#conversion)
- [Design token names](#design-token-names)
- [What the generator writes](#what-the-generator-writes)
- [The source and anchor suffix](#the-source-and-anchor-suffix)
- [Solid step descriptions](#solid-step-descriptions)
- [Two-mode collections](#two-mode-collections)
- [Alpha variables](#alpha-variables)
- [Comparison with other systems](#comparison-with-other-systems)

## Conversion

To convert one hex to OKLCH and back, use [oklch.com](https://oklch.com) or the `culori` JavaScript library. For a whole scale, use the bundled `generate.js`. It implements the exact conversions, curve and clamping.

## Design token names

```
Step 1     →  background-canvas
Steps 2–3  →  background
Step 4     →  background-ui
Step 5     →  background-hover
Step 6     →  background-active / border-subtle
Steps 7–8  →  border
Step 9     →  solid
Step 10    →  text-muted
Step 11    →  text-body
Step 12    →  text-heading
```

The rest of this page is about Figma variable names and description fields, not these semantic role names.

## What the generator writes

| Output | Per | What it is |
|---|---|---|
| `figmaSuffix` | Solid step | `-anchor`, `-source` or empty |
| `figmaDescription` | Solid step | The step's OKLCH value plus provenance, with the light/dark token |
| `figmaDescriptionLine` | Solid step | The same, without the light/dark token |
| `modeDescriptions` | Two-mode variable | One block per mode |
| `figmaDescription` from `generateAlphaScale(scale, name)` | Alpha step | The alpha format below |

`--table` output includes a "Figma name" column for solid steps.

**Dialect** comes from the project context ([SKILL.md](../SKILL.md), *Project context first*).

| | en-US | Otherwise |
|---|---|---|
| Mode flag | `--mode gray` | `--mode grey` |
| Scale name | `Gray` | `Grey` |
| `scale.modeName`, the word in descriptions | `gray` | `grey` |
| `scale.mode`, and `recover.js` | `grey` | `grey` |

## The source and anchor suffix

**Mark the one step nearest the input colour, in OKLab space, in all three modes alike**. Use `-anchor` if that step reproduces the source verbatim (an exact hex match). Use `-source` if it is only the nearest step. There are no per-mode exemptions:

| Mode | Which step is marked |
|---|---|
| Anchored | The anchor, which is the nearest step by construction: always exact, always `-anchor`. Verified across 200 random anchored sources. |
| Free | Whichever step is nearest the source, **not always step 9**. Source `#009070` (L 0.581) has step 8 at ΔE 0.0187 and step 9 at ΔE 0.0636: step 8 is 3.4× closer. Step 9 is the nearest only when the source's L is close to the anchor L. |
| Grey | The nearest step too. The neutral table hits round hex values (`#696969`, `#7D7D7D` and so on), so a source that is one of them matches exactly (`-anchor`). Any other source gets `-source`. |

No other step gets a marker: exactly one per scale, in every mode.

**A two-mode variable can mix generation modes**. A scale is often anchored in light (the verbatim brand colour) and free in dark (a derived value). Each mode's `generateScale()` computes its own `figmaSuffix`, and the two can disagree.

- **The name follows the collection's default mode**, the one a person opens the file into, typically Light.
- **The description carries the per-mode truth for both** ([Two-mode collections](#two-mode-collections)).
- Never encode both modes' suffixes in one name.
- Where the mix would mislead, say so in the description. An example is a light anchor at a different step index from the dark source step, where the difference matters for use.

## Solid step descriptions

**Every variable's description carries its own OKLCH value plus scale-level provenance:**

- The source hex.
- The mode (free or anchored).
- For the ceiling families (indigo, purple, magenta): `capped` where the ceiling was active, `uncapped` where it was skipped.
- Any other parameter that shaped the value: `peak N`, `eased hue`, `luminance-targeted`, `tail rate <n>`, `· drift toward <hex>` ([modes.md](modes.md), [hue-families.md](hue-families.md)).

The six families without a ceiling (red, orange, yellow, green, cyan, blue) show no ceiling label at all. **That is the absence of something that does not apply, not a missing value**. Before treating a missing `capped` or `uncapped` as a bug, check whether the family has a ceiling.

**The anchor step says `verbatim`, never a ceiling label, even in a ceiling family**. The anchor is always exempt from the ceiling ([modes.md](modes.md)). A `capped` or `uncapped` label would imply the ceiling touched its chroma, which it never does. Every other step in the scale still shows its real status.

**A single-mode collection** puts the light/dark token inline in `figmaDescription`, since one description covers the one mode:

```
oklch(0.5200 0.1467 251.94) · source #1A6FBF · free mode · light
```

**Hand edits are not recorded by any field**. A description built from `figmaDescription` or `figmaDescriptionLine` implies the scale is reproducible from its stated source and settings. That becomes false once a hand correction is applied on top. Examples are a step-indexed hue schedule layered in by hand, or a single step recoloured. If a scale is edited after generation, say so in the variable description, or wherever its provenance lives.

## Two-mode collections

A Figma variable has *one* description field, shared across its modes. Writing the mode into the provenance, as in the single-mode form, is wrong for whichever mode you are not viewing. Instead, each mode gets its own section: a heading with the mode's name, over that mode's `figmaDescriptionLine`.

```
Light:
oklch(0.9793 0.0221 203.70) · source #2DAFB8 · anchored mode

Dark:
oklch(0.2106 0.0183 202.01) · source #2DAFB8 · free mode
```

**Each heading is the collection's own mode name, exactly**. The block's only reader is figma-doc-generator's `pickLine`, which matches a heading against the mode's name. A wrong heading puts one mode's value in the other's column. Examples are `Light:` in a collection whose modes are `Day`/`Night`, or a `Light mode:` heading.

| Entry point | How |
|---|---|
| API | `modeDescriptions({ [lightModeName]: lightScale, [darkModeName]: darkScale })` builds all twelve blocks from the two scales |
| CLI | `--light-name <name> --dark-name <name>` returns them as `modeDescriptions` |
| CLI, dark in another mode | Add `--dark-gen-mode <mode>` |

- On the CLI, `--tail-rate` goes to the light scale only. Dark steps 9–12 are the light end, where the orange collision does not occur.
- Both throw on a name that cannot head its own section: empty, multi-line, or equal to another but for case or a trailing colon.
- `tools/shared/test-mode-description.mjs` holds the round trip through `pickLine`, where both skills are present.

## Alpha variables

**Alpha variables follow neither the naming nor the description rules above**. An alpha step is a composited value, a base plus an opacity, engineered to *reproduce* a solid step. It is not a direct read of the source colour, so `-source` and `-anchor` would be wrong.

- **No alpha variable gets a `-source` or `-anchor` suffix, ever, in any mode.**
- The solid step it composites to keeps its own suffix, so the description names it in full: `composites to neutral/9-source`.
- The description records the base colour, the alpha value, and which solid variable it matches.

```
oklch(0.20 0.00 0 / 64.38%) · base #161616 · alpha 0.643777 · composites to neutral/9-source · grey mode
```

**The description leads with a ready-to-use CSS value**. That mirrors a solid step's `${oklch} · ${provenance}` shape, so any tool parsing descriptions finds a value in the same place.

**The alpha is a 2-decimal percentage, never a whole percent**. The ≥2-decimal rule ([alpha.md](alpha.md)) governs anything that renders these tokens, documentation included. Rounding light neutral step 6 from `0.2961` to `30%` composites to 185 instead of 186. 7 of the 11 non-endpoint steps move by 1/255 the same way: exactly the seam the alpha scale exists to prevent.

**A round-trip invariant guards the precision**. `tests/test-oklch.js` parses each emitted CSS value as a consumer would. It converts the OKLCH triple back through `oklchToHex`, composites at the stated percentage, and requires the solid step's own hex. It does this across the Grey, Blue, Red and Indigo references in both modes. That one assertion covers the base lightness decimals, the alpha decimals and the endpoint rule's base swap.

**Write the check from the emitted string**. A check that composites from the `base` field, reading only the percentage from `css`, never converts the triple. It would pass with any lightness in `BASE_OKLCH`. Moving the dark base `#FCFCFC` from 0.99 to 0.95 lightness fails three checks in the current form.

**Headroom**. Every neutral step lands at least 0.25/255 clear of a rounding boundary. The tightest link is the dark base's own conversion: `oklch(0.99 0.00 0)` resolves to 251.64, 0.14/255 from rounding to 251 instead of 252. It is correct and deterministic, but it would move first if the constant were re-rounded.

**Neutral alpha gets `oklch(...)`; chromatic alpha gets `rgb(...)`, deliberately.**

- The two neutral bases are fixed constants with a nominal OKLCH published in [alpha.md](alpha.md), so quoting it converts nothing.
- A chromatic base is solved per step in 8-bit sRGB, and its hue can drift up to 23.8° from the scale's own.
- A converted OKLCH triple would assert a hue the scale does not own, and bring back the conversion error this system quantises away.
- `rgb()` states the solved channels and the authored alpha exactly.
- If you need OKLCH for a chromatic alpha token, derive it deliberately and own the rounding; the generator never implies it.

**The scale name is an argument, not a literal**. The `neutral/9` part comes from the `name` argument of `generateAlphaScale(scale, name)`. It defaults to the scale's detected family, which is `neutral` for a grey-mode scale.

Real collections call their neutral scale grey, gray, neutral or slate, and the generator cannot know which. **Always pass the real variable or collection name**, as in `generateAlphaScale(scale, 'grey')`. The default only keeps the function from crashing or writing an empty string.

## Comparison with other systems

| System | Steps | Lightest L | Darkest chromatic L | Darkest neutral L | Notes |
|---|---|---|---|---|---|
| Radix Colors | 12 | ~0.993 | ~0.32 | ~0.24 | Independent per-hue tuning |
| IBM Carbon | 10 + white/black | 1.0 (white) | varies | 0.20 (`text-01`) | White as canvas |
| Tailwind | 11 | ~0.98 | ~0.22 | 0.13 (`gray-950`) | No algorithmic generation |
| This system | 12 | 0.993 | 0.30 | 0.20 | Algorithmic, any source colour |
