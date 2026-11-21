# Generation modes and options

Free, anchored and grey mode, the drift toward a secondary reference, and the three versioned options that change the generation maths. [SKILL.md](../SKILL.md) steps 2 and 5 point here. `generate.js` is the specification.

## Contents

- [Free mode](#free-mode)
- [Anchored mode](#anchored-mode)
- [Anchored mode in dark](#anchored-mode-in-dark)
- [Grey mode](#grey-mode)
- [Drift toward a secondary reference](#drift-toward-a-secondary-reference)
- [Versioned generation options](#versioned-generation-options)

## Free mode

The default. The anchor is always step 9. Take H and C from the source, apply the fixed L table, and run the chroma curve from that anchor. Then apply the hue-family rules and the background cap, and gamut-clamp. The exact implementation is `generateScale(hex, 'free')` in `generate.js`.

## Anchored mode

For a brand colour that must appear verbatim in the scale. It is free mode with three changes:

- The anchor is the step whose L is closest to the source's L, not always step 9.
- That step's L becomes the exact source L.
- The neighbour at the next-lower index is smoothed to the midpoint. In the light table that is the next *lighter* step; in the dark table (lower index is darker) it is the next *darker* one. The code smooths `anchorIdx − 1` in both; only the reading differs.

The exact implementation is `generateScale(hex, 'anchored')` in `generate.js`.

**Tie edges**. The step-8/9 boundary sits at L 0.555 (midpoint of 0.59 and 0.52). The step-9/10 boundary sits at L 0.47 (midpoint of 0.52 and 0.42). For a source exactly on a midpoint, check which step it anchors to: the nearest-step rule does not settle a tie.

**The anchor reproduces the source exactly**. L, C and H all stay at their raw source values. The anchor is exempt from every downstream cap, ceiling and hue-family nudge, and from dark mode's 0.85× chroma reduction, without exception.

- In `generate.js`, an anchor-verbatim guard returns the raw source triple before any per-step processing runs. No individual rule has to remember the anchor.
- Any rule that touched the anchor's L, C or H would silently break "verbatim", the whole point of anchored mode.
- A future rule of any kind inherits the exemption automatically. Do not enumerate exemptions per rule.
- `applyFamilyRules()` holds no anchor special-casing. The verbatim guard is the sole protection; a 15,600-scale sweep confirmed removing an old `isAnchor` check there changed no byte.

## Anchored mode in dark

The same logic as light, built on the dark L table. The exact implementation is `generateScale(hex, 'anchored', { dark: true })`.

**The dark source is its own colour**. Brands usually choose distinct light and dark anchor hexes. The dark one is not a mechanical inversion of the light one.

**The round-trip is the suite's job**. `tests/test-oklch.js` converts every step's hex back to OKLCH. It holds the L to the step's own within 0.01, light and dark, in every mode ("2.2 round-trip"). Run the suite after touching `generate.js`; a generated scale needs no hand check.

**The anchor's step moves between light and dark, sometimes a lot**. The dark table is inverted. So a source anchoring at step 10 in light can anchor at step 3 in dark. It depends only on where the source's L falls in each table. Check `scale.anchorIdx` for each mode separately.

`driftTowardReference` uses step index for the same reason, never a cross-mode assumption about the anchor.

**An anchor in the background zone**. The anchor's cap exemption is correct: it is what makes verbatim mean verbatim. But an anchor at or near steps 1–5 once gave a one-step chroma spike. An anchor at dark step 5 came out at C≈0.21 between a step-4 neighbour capped at C=0.10 and a step-6 neighbour at C≈0.14.

- The cap now tapers toward the anchor within `TAPER_RADIUS` steps ([chroma-and-gamut.md](chroma-and-gamut.md)), so the approach is graded rather than a wall.
- The anchor still reads *most* saturated: verbatim outranks everything.
- `generateScale()` returns `anchorInBackgroundZone`, true when `mode === 'anchored' && anchorIdx <= 4`, so the case is checked in code rather than by eye.
- If it is true and the graded result still looks wrong, the fix is a different anchor colour, not a change to either rule.

## Grey mode

For neutral scales. C is constant, with no curve: every step keeps the source's own C. For a true neutral that is C ≈ 0, whatever the source's lightness, so any pure neutral gives the same scale shape. Steps 11–12 follow the neutral exception ([lightness.md](lightness.md)). The exact implementation is `generateScale(hex, 'grey')`.

**Grey mode has no anchor, so it overwrites a hand-picked value**. Suppose a designer picked `#666666` for step 9 by eye. Regenerating through grey mode replaces it with the fixed table's value at that step (for example `#696969`). To keep a mid-scale neutral exactly, set it by hand after generation, and record the edit in the description ([figma-output.md](figma-output.md)).

## Drift toward a secondary reference

A rare correction applied on top of an already-generated scale. It is not a generation mode, so it is its own function: `driftTowardReference(scale, referenceHex)` in `generate.js`. On the CLI it is `node scripts/generate.js '#1A6FBF' --drift-toward '#8040FF'`.

**When**. The anchor is confirmed and must stay as it is. The rest of the scale should lean toward a second colour at another hue. This is common with brand scales: the anchor was chosen first, and a lighter or mid-tone reference surfaced later.

**Do not** average the two colours or regenerate from the second reference: either would move the anchor. Drift is hue-only, layered on a scale already correct in L and C:

```
1. Get OKLCH for both the anchor (already correct, unchanged) and the new reference.
2. cap = reference_H − anchor_H, normalized to [−180, 180]   [total rotation, taking the SHORT way around the hue circle]
3. For each non-anchor step i (0-indexed), by ABSOLUTE step index — NOT distance from the anchor:
     H[i] = anchor_H + cap × (11 − i) / 11
4. Recompute hex from (L[i], C[i], H[i]) for every non-anchor step, using each step's OWN existing L and C — don't touch those. Anchor step keeps its own hue, verbatim.
```

This reaches the reference hue exactly at step 1 (`i=0` gives `H = anchor_H + cap = reference_H`). It passes through the anchor's own hue exactly at step 12 (`i=11` gives `H = anchor_H`), wherever the real anchor sits.

### Why this formula, and not the earlier ones

Each earlier formula fixed one problem and exposed another:

| Version | Keyed to | What broke |
|---|---|---|
| v1 | L-distance from the anchor | Mode-incoherent: the light and dark tables are inverted, so one reference rotated opposite halves of the scale per mode |
| v2 | Unsigned step distance, `abs(i − anchorIdx)`, both sides toward the reference | A V-shaped, non-monotonic profile for a mid-scale anchor, and light/dark divergence that grew where they anchor at different steps |
| v3 | Signed step distance at a fixed rate, `cap / 11` | Monotonic, with constant divergence. But it never neared the reference unless the anchor sat at step 1: an anchor 19° from a reference peaked at its own hue |
| v4 (current) | Absolute step index only | Nothing above: it never uses the anchor's position |

All three earlier versions keyed rotation to the anchor's *position*, which is exactly what differs between light and dark. The current formula is a fixed line in step-index space whose two endpoints are the anchor's hue and the reference's hue. Light and dark therefore get the same hue at the same step by construction. That was confirmed at 0° divergence across all 12 steps, on a case that once diverged by up to 30°. At least one step also ends closer to the reference than the anchor's own hue is.

**The residual seam**. The schedule's own fixed point is always step 12. When the anchor is at step 12, the verbatim override and the schedule agree, with no seam. Anywhere else, forcing the anchor back to its verbatim hue makes a single-step spike; every other step still follows the schedule exactly. Where light and dark anchor at different steps, that spike is the only place the two modes still differ.

**The [−180, 180] normalisation on `cap` is a separate fix**. A raw subtraction can take the *long* way round the circle. An anchor at H 350° and a reference at H 10° are 20° apart, not 340°, but a raw subtraction gives −340.

**The anchor is exempt from drift only in anchored mode**. There it protects a real guarantee. In free and grey mode, `anchorIdx` is only the curve's structural peak (step 9 by default), and nothing is verbatim. Exempting it there cost mode-coherence for nothing: on a light-anchored, dark-free pair, the free side's exempted step 9 alone diverged by ~9°.

**Drift's parameter goes in the description**. `driftTowardReference()` appends `· drift toward <hex>` to `figmaDescription` and `figmaDescriptionLine` on every step it changes. The untouched anchor's description stays as it was. Without the note, a drifted scale would look reproducible from source and mode alone.

**Light and dark**. Run the same function for each mode, on each mode's own L and C and its own anchor. **Verify by comparing the same step number across modes**, not steps at equal distance from each anchor. A semantic token maps one step number to one role in both modes, so that is the comparison that matters. Expect exact agreement at every step except where either mode's anchor sits; a mismatch anywhere else is a fault.

## Versioned generation options

Three options change the generation maths itself. The pinned reference tables (`tests/reference-scales.md`) are the default output.

| Option | Default | Scope | Provenance token |
|---|---|---|---|
| `--peak <1-12>` (`peakStep`) | Off (peak at 9) | Per scale: hues want different peaks | `peak N` |
| `--ease-hue` (`easeHueSnaps`) | Off | Collection-wide: all on or all off | `eased hue` |
| Luminance-targeted text steps | On since 2.0.0; `--oklch-text` (`luminanceText: false`) turns it off | Collection-wide: all on or all off | `luminance-targeted` |

`--tail-rate` is per scale in the same way as `--peak`, and carries its own token, `tail rate <n>` ([hue-families.md](hue-families.md), *Yellow*). A per-scale token keeps a mixed collection auditable.

### `--peak`: chroma-curve peak placement, free mode only

Free mode assumes every hue's vividness peak belongs at step 9 (L 0.52). That is false for naturally light hues. The sRGB cusp lightness varies by hue: a cyan's chroma ceiling peaks near L 0.7 and a yellow's near L 0.9. A step-9 peak renders them muted.

Without `--peak`, the only escape was anchored mode. That drags in three things a non-brand scale never asked for. They are a verbatim guarantee, an L override at the anchor, and midpoint smoothing of its neighbour. One real palette gathered **five** non-brand anchored scales this way, each stamped `verbatim` with no brand mandate behind it.

What `--peak N` does:

- It moves **only the chroma curve's peak** to step N.
- The fixed L table is untouched, so cross-family alignment is kept exactly. Nothing is verbatim and nothing is smoothed.
- The peak step takes the anchored anchor's cap-zone rules: exemption from the background cap, plus the neighbour taper. A yellow peaked at step 4 needs its chroma *there*.
- `solidForeground` evaluates the peak step, as in anchored mode: it measures the scale's actual vivid step.
- Provenance appends `peak N`, since the scale is not reproducible from source and mode alone.
- `--peak 9` is the free default and gives byte-identical output with no token.
- A peak outside free mode, or outside 1–12, throws.

**Anchored at a grid L and free-peak are deliberately equivalent in output**. Take an anchored source whose L equals a grid value. It gives the same 12 hexes as `--peak` at that step. The smoothing is a no-op on the evenly spaced part of the grid, and verbatim reproduces what the curve renders anyway. The difference is the contract.

Anchored promises the hex verbatim and says so in provenance; peak promises only the curve shape. Use anchored for brand colours that must appear exactly, and `--peak` for scales whose hue simply lives light.

### `--ease-hue`: continuous hue nudges

The default hue-family rules apply the full ±N nudge at every tail step. That makes a visible hue snap at the tail's first step. For blue it is 4° between steps 9 and 10; for green, indigo, purple and magenta it falls between 8 and 9. Yellow never had this, because its rule is a continuous drift proportional to L, modelled on hand-tuned production scales such as Tailwind's yellow.

This flag gives the other five ruled families yellow's approach:

- The tail eases linearly from 0 at the last un-nudged step to the full ±N **exactly at step 12**.
- Red's mid-step rule becomes triangular: −2/−4/−2 across steps 6–8, continuous at both ends.
- Yellow and grey are untouched.

Two properties hold by construction:

- **Step 12 is identical to the discrete schedule**, since the ease reaches full N there.
- **The family-escape calibration stays valid**. The avoid bounds depend on maximum rotation, which the eased schedule reaches only at step 12. Every intermediate step rotates strictly *less* than the discrete schedule.

The dark-mode gate is unchanged: the tail starts at step 10, and dark step 9 keeps the raw source hue. Steps whose hue the ease changed, against the discrete default, append `eased hue` to their `figmaDescription`.

### Luminance-targeted text steps (the default)

OKLab L is not WCAG luminance, and the mapping depends on hue: at identical L, yellow is far more luminous than blue. That caused both the old yellow cross-scale exception and the hue-to-hue contrast variation at the text steps.

Generation therefore fixes the text steps' **Y** instead of their OKLab L. For steps 10–12, L is solved per hue by bisection, through the same C and H rules, yellow's drift and gamut clamping included. The rendered colour's WCAG relative luminance then equals the achromatic colour's at the standard L.

- Six hues were measured against white: violet, green, blue, yellow, red and teal. Their spread at step 10 drops from 1.41 to 0.10 of a ratio point.
- Step 12 on step 2 reads 12.8–12.9:1 for every one of them.
- The residual is 8-bit rounding and gamut clamping, not the schedule.

The targets use the standard L tables, so the guaranteed ratios are the ones [contrast.md](contrast.md) documents. The boundaries:

- **The verbatim anchor is exempt**. An anchored source whose L lands in the text zone stays verbatim and still gets `contrastWarning`. The two features complement each other.
- Where anchored-mode smoothing touches a text step, targeting overrides the smoothing: uniform text contrast outranks it.
- Grey and neutral scales are untouched. They already sit on the achromatic targets, and the neutral exception's darker text values stay.
- Targeted steps append `luminance-targeted` to their `figmaDescription`. Any parameter that shaped a value beyond source and mode must appear in the record.

**Why it is the default**. It resolves two limitations at once. One is the yellow cross-scale caveat; the other is the anchored text-zone AAA gap for the *non-anchor* text steps. The cost is that OKLab L is no longer constant across hues at steps 10–12.

Radix makes the same trade with per-hue tuning, and Material makes it structurally with HCT's tone axis (plain CIE L*, a luminance measure). It was opt-in until 2.0.0; a scale made before 2.0.0 is reproduced with `--oklch-text`.

Step 9, the solid, stays on the fixed L. Moving it per hue would move the scale's vividness peak. Its white-text contrast is measured and reported as `solidForeground` instead.
