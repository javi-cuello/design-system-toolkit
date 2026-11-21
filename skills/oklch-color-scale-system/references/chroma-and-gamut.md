# Chroma curve and gamut clamping

How chroma is spread across the 12 steps, the background cap and its taper, and how each step is brought inside sRGB. [SKILL.md](../SKILL.md) step 6 points here. `generate.js` is the specification: this page describes what it does.

## Contents

- [The chroma curve](#the-chroma-curve)
- [Background zone cap and its taper](#background-zone-cap-and-its-taper)
- [Parameter reference](#parameter-reference)
- [The anchor is not always the rendered peak](#the-anchor-is-not-always-the-rendered-peak)
- [Gamut clamping](#gamut-clamping)

## The chroma curve

Chroma scales from the source's C by a factor per step: `C[step] = sourceC × factor[step]`. H stays fixed from the source across all steps, apart from the hue-family nudges ([hue-families.md](hue-families.md)).

One exponent applies to every step lighter than the anchor, with no zone split. The exact formula is `computeFactor()` in `generate.js`. In outline, `factor` rises from 0.10 at step 1 to 1.00 at the anchor along a `^1.5` curve. Beyond the anchor it decays by `0.93` per step.

`i` is the 1-based step number, and `anchor` is 9 in free mode.

**Why one exponent, not a two-zone split**. A steep-then-flat split (steep for backgrounds, flat for borders) behaves well only when the anchor sits above step 5. A light anchor in anchored mode can sit at step 5 or lower. Then every border step falls into the flat zone and over-saturates. One exponent stays robust wherever the anchor sits.

**Dark mode** applies a global 0.85× reduction on top of the same curve.

## Background zone cap and its taper

No step 1–5 exceeds C 0.10, whatever the source chroma, with one anchored-mode exception. The exact implementation is `backgroundCap()` in `generate.js`.

The anchor itself is exempt from the cap, because it is verbatim ([modes.md](modes.md)). A vivid anchor in or near the background zone would then sit at full source chroma beside neighbours flattened at 0.10: a one-step chroma spike. So, in anchored mode only, the cap tapers toward the anchor when the effective source chroma exceeds 0.10.

| Term | Value |
|---|---|
| Distance | `dist = abs(i − anchorIdx)`, applied while `dist ≤ TAPER_RADIUS` |
| `TAPER_RADIUS` | 3 |
| Cap within the radius | `cap = 0.10 + (effectiveSrcC − 0.10) × (TAPER_RADIUS − dist) / TAPER_RADIUS` |
| At exactly distance 3 | The taper adds zero |

Neighbours then ramp toward the anchor instead of stopping at a flat wall. The rules on the taper:

- It only ever *loosens* the cap, never tightens it.
- It changes only this cap. The indigo, purple and magenta pre-curve ceilings apply to neighbours unchanged.
- Free and grey mode keep the flat 0.10 unconditionally.
- A `--peak` step takes the same exemption and taper ([modes.md](modes.md)).
- Dark mode uses the same rule and radius; its cap zone is also steps 1–5.

## Parameter reference

| Parameter | Value | Controls |
|---|---|---|
| `exponent` | 1.5 | Curve steepness, one value for all light steps |
| `min` | 0.10 | Chroma floor at step 1 |
| `darkDecay` | 0.93 | Chroma kept per step beyond the anchor |
| `backgroundCap` | 0.10 | Maximum C for steps 1–5 |
| `TAPER_RADIUS` | 3 | Anchored mode only: within this distance of the anchor, the cap tapers from the anchor's effective source chroma down to 0.10 |
| `darkModeReduction` | 0.85× | Global chroma multiplier, dark mode only |
| `anchor` | Step 9 (L 0.52) | Curve peak, `factor = 1.0` here; not always the peak of rendered chroma (below) |

## The anchor is not always the rendered peak

The anchor is where the *curve* peaks: `factor = 1.0`, full `effectiveSrcC` before clamping. Rendered chroma after clamping may peak elsewhere. sRGB's gamut boundary has a different shape at every hue and L. At high enough source L and C, clamping can cut harder at the anchor's L (0.52) than at a lighter neighbour.

**This affects every family without a pre-curve chroma ceiling**. Every family was swept over its H range, at 5 source L values (0.45–0.85) and 3 source C values (0.15–0.25): ~500+ combinations.

| Family | Anchor ≠ peak rate | Worst loss against the true peak |
|---|---|---|
| Cyan | 76% | 18.7% |
| Yellow | 66% | 29.4% |
| Green | 55% | 22.3% |
| Orange | 48% | 12.2% |
| Blue | 31% | 12.3% |
| Red | 8% | 6.8% |
| Indigo, Purple, Magenta | 0% | 0% |

**Why indigo, purple and magenta are immune**. Only these three have a pre-curve chroma ceiling (0.18 / 0.15 / 0.20). The ceiling keeps their chroma well inside sRGB at every step, so they never reach the wall that causes the divergence.

**What to do**. It is not a yellow quirk: it is the curve meeting gamut geometry, for any family without a ceiling. It grows more likely as source L and C both rise. The validated reference sources (L ~0.5–0.65, C ~0.11–0.19) mostly sit outside the affected zone, so the sweep matters more than any one reference. For a source with L above ~0.65 or C above ~0.20, check steps 7–9 directly rather than assuming step 9 is most saturated.

**Not fixed by chasing a per-hue peak**. Step 9 stays the fixed anchor on purpose. UI roles such as the solid or badge colour depend on one predictable step number across every hue. Where a hue's vividness belongs elsewhere, `--peak` moves the curve's peak ([modes.md](modes.md)).

## Gamut clamping

After each step is computed, C is reduced until RGB is within tolerance of 0–1. The exact implementation is `isOutOfGamut()` and `clampToGamut()` in `generate.js`.

**The ±0.001 tolerance band is load-bearing**. A strict `R,G,B ∈ [0,1]` check gives slightly lower-chroma output than the reference tables. Floating-point channels often land a few ten-thousandths outside `[0,1]` at the exact boundary the curve aims for. Four clamp strategies were tested against all 72 reference steps: decrement or bisect, each strict or with tolerance. Decrement with tolerance, as implemented, scores 72/72, the clear best match.

The clamp preserves L and H exactly in the vast majority of cases. It is most active for deep blues, purples and high-chroma reds at light steps.

**One trade-off of the tolerance**. It can accept a step whose RGB sits marginally outside [0,1], and hex conversion then clips those channels. That is a sub-0.001 difference in *linear* channel values.

Near black, though, the sRGB transfer function has slope 12.92. A 0.001 linear overshoot then becomes up to ~3/255 in gamma space; the measured worst case is 3.29/255 at a dark step. The clipped value is what every reference table pins, so the output is deterministic. Do not quote "sub-0.001" as an 8-bit gamma-space claim.

**External reference: CSS Color 4 gamut mapping**. This clamp belongs to the same family as the CSS Color Module Level 4 algorithm (§ "CSS gamut mapping"). Both reduce OKLCH chroma at constant L and H.

| | CSS Color 4 | This system |
|---|---|---|
| Search | Binary search | Linear decrement |
| Tolerance | ΔEOK ≈ 0.02 just-noticeable difference, with local clipping | ±0.001 linear-RGB tolerance |
| Shared principle | Hue and lightness kept; chroma pays the cost | The same |

CSS Color 4 is the spec to consult when judging whether a change to this clamp is principled. Any change of mechanism alters output and requires regenerating every pinned reference table. Björn Ottosson's closed-form cusp-intersection method is the faster exact alternative, if speed ever matters more than table stability.
