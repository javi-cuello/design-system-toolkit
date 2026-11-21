# Alpha scales

A parallel set of 12 transparent steps for any solid scale, for overlays, shadows and surfaces that sit on other colours. [SKILL.md](../SKILL.md) step 7 points here. `generate.js` is the specification.

## Contents

- [When to use one](#when-to-use-one)
- [Blend in quantised sRGB](#blend-in-quantised-srgb)
- [Neutral alpha: light](#neutral-alpha-light)
- [Neutral alpha: dark](#neutral-alpha-dark)
- [Chromatic alpha](#chromatic-alpha)
- [Chromatic reference tables](#chromatic-reference-tables)

## When to use one

**Use** an alpha scale for any scale, neutral or chromatic, when surfaces must layer over backgrounds of varying or unknown colour. A single base colour works exactly only for neutral (C = 0) scales; anything with chroma needs a base solved per step ([Chromatic alpha](#chromatic-alpha)).

**Skip** it when the UI has a fixed white background throughout. The solid scale is then simpler and enough.

## Blend in quantised sRGB

**Blend in sRGB channel space, not OKLab L**. Alpha compositing in Figma, CSS and browsers interpolates raw sRGB channels, not perceptual L. Solving with L gives a visibly wrong result.

**Use the 8-bit hex value, not the continuous OKLCH conversion**. The base and target tokens are 8-bit hex values, such as `#161616`. Their true sRGB fraction (`0x16/255 = 0.08627`) differs slightly from the same OKLCH triple at full precision (`0.08610`). That changes every alpha by a few ten-thousandths.

Round both base and target to their 8-bit hex first, then solve for alpha. Every reference table here does this, which makes them exactly reproducible.

**Keep at least 2 decimal places, light and dark**. Whole-percent rounding gives sRGB errors up to ±1/255 per channel at about half the steps. That is a faint but real seam where solid and alpha versions sit side by side. Always verify by compositing and diffing against the target hex.

## Neutral alpha: light

One near-black base, `oklch(0.20 0.00 0)` → `#161616`, held constant while alpha varies per step. The exact implementation is `generateNeutralAlpha()` in `generate.js`.

**Endpoint rule: no step lands at 100% alpha**. The formula hits exactly 1.00 at the step whose target equals the base: step 12, where the two are the same value. A token at 100% opacity is a plain solid fill, no longer translucent.

- `generate.js` handles it. Where a step's alpha would round to 1.00, that step's base becomes the extreme itself: pure black for light, pure white for dark.
- The alpha is then recomputed, so the step still composites to the same target.
- That step's base differs from every other step's, which is expected. One mismatched base costs less than a token that silently is not translucent.

Base colour `oklch(0.20 0.00 0)`, `#161616`; step 12 uses pure black under the endpoint rule:

| Step | Matches neutral step L | Base | Alpha | CSS value |
|------|------------------------|------|-------|-----------|
| 1 | 0.993 | `#161616` | 0.0086 | `oklch(0.20 0.00 0 / 0.86%)` |
| 2 | 0.980 | `#161616` | 0.030 | `oklch(0.20 0.00 0 / 3.00%)` |
| 3 | 0.950 | `#161616` | 0.073 | `oklch(0.20 0.00 0 / 7.30%)` |
| 4 | 0.920 | `#161616` | 0.1159 | `oklch(0.20 0.00 0 / 11.59%)` |
| 5 | 0.890 | `#161616` | 0.1545 | `oklch(0.20 0.00 0 / 15.45%)` |
| 6 | 0.790 | `#161616` | 0.2961 | `oklch(0.20 0.00 0 / 29.61%)` |
| 7 | 0.690 | `#161616` | 0.4292 | `oklch(0.20 0.00 0 / 42.92%)` |
| 8 | 0.590 | `#161616` | 0.5579 | `oklch(0.20 0.00 0 / 55.79%)` |
| 9 | 0.520 | `#161616` | 0.6438 | `oklch(0.20 0.00 0 / 64.38%)` |
| 10 | 0.420 | `#161616` | 0.7639 | `oklch(0.20 0.00 0 / 76.39%)` |
| 11 | 0.330 | `#161616` | 0.867 | `oklch(0.20 0.00 0 / 86.70%)` |
| 12 | 0.200 | `#000000` | 0.91373 | `oklch(0 0 0 / 91.37%)` |

**Token naming**. Alpha steps live in a subfolder under the neutral scale:

```
neutral/1        →  solid
neutral/alpha/1  →  transparent
```

**Figma**. Make a separate variable collection or group for alpha tokens; Figma supports `rgba` and `oklch` with alpha. Name the group `neutral/alpha` to keep it next to the solid scale. Alpha tokens only look right on white in Figma's canvas, so verify them on the real background in components.

## Neutral alpha: dark

Invert the base: use a near-white base and solve again, in quantised sRGB. It is the same `generateNeutralAlpha()` function, with `dark: true`.

**Why the base is so light**. In light mode the background is pure white, so the base only needs to stay below it. In dark mode the implicit background is pure black, and compositing can never come out lighter than the base. The base must sit above every target, the neutral exception's step 12 (L 0.97) included. That is why it is `oklch(0.99 0 0)` and not `0.95`: a base at or below the lightest target makes that step unreachable.

**The endpoint rule still applies**. With base `#FCFCFC`, the dark steps top out at 0.9722, below 1.00, so no step needs the pure-white swap. Re-check whenever the dark neutral step 12 target changes. A new value could push the top step to 1.00, as light step 12 did.

Base colour `oklch(0.99 0.00 0)`, `#FCFCFC`:

| Step | Matches neutral step L | Alpha | CSS value |
|------|------------------------|-------|-----------|
| 1 | 0.18 | 0.0714 | `oklch(0.99 0.00 0 / 7.14%)` |
| 2 | 0.21 | 0.0952 | `oklch(0.99 0.00 0 / 9.52%)` |
| 3 | 0.24 | 0.123 | `oklch(0.99 0.00 0 / 12.30%)` |
| 4 | 0.27 | 0.1508 | `oklch(0.99 0.00 0 / 15.08%)` |
| 5 | 0.30 | 0.1825 | `oklch(0.99 0.00 0 / 18.25%)` |
| 6 | 0.40 | 0.2857 | `oklch(0.99 0.00 0 / 28.57%)` |
| 7 | 0.50 | 0.3929 | `oklch(0.99 0.00 0 / 39.29%)` |
| 8 | 0.60 | 0.5079 | `oklch(0.99 0.00 0 / 50.79%)` |
| 9 | 0.70 | 0.627 | `oklch(0.99 0.00 0 / 62.70%)` |
| 10 | 0.78 | 0.7262 | `oklch(0.99 0.00 0 / 72.62%)` |
| 11 | 0.87 | 0.8413 | `oklch(0.99 0.00 0 / 84.13%)` |
| 12 | 0.97 | 0.9722 | `oklch(0.99 0.00 0 / 97.22%)` |

## Chromatic alpha

A single base with varying alpha works exactly only for an achromatic scale. Any chroma breaks it, so the base is solved per step.

**Why a single base works only at C = 0**. Compositing onto white is `result = base × α + 255 × (1 − α)`. One α across all three channels needs:

```
α = (255−target_R)/(255−base_R) = (255−target_G)/(255−base_G) = (255−target_B)/(255−base_B)
```

That holds only when the base lies on the straight line from white through the target in sRGB. Every achromatic step lies on the neutral diagonal with white, so any point on that diagonal works for every step. Chroma pulls the 12 steps off that line.

The best single base was searched for across all 12 steps of four reference scales:

| Scale | Source | Source C | Best possible single base | Worst error |
|---|---|---|---|---|
| Grey | `#6A6A6A` (grey mode) | 0.0000 | any point on the neutral diagonal | 0/255 |
| Blue | `#1A6FBF` (free mode) | 0.1467 | `#083080` | 35.0/255 |
| Red | `#B91C1C` (free mode) | 0.1905 | `#981038` | 38.5/255 |
| Indigo | `#9747FF` (anchored, no-ceiling) | 0.2541 | `#8080D0` | 49.9/255 |

Error rises with source chroma and never reaches zero for a tinted scale. **Use a single base only for a true `C = 0` neutral; solve every other scale per step.**

**"True neutral" is decided from the measured channels, not the family label**. The neutral threshold (`C < 0.01`) admits faintly tinted sources whose steps do *not* have R=G=B. The single-base solve reads one channel and assumes the other two match. A `C = 0.009` source routed through it measured a composite error of **11/255**, ten times the 1/255 seams the scale exists to prevent.

- `generateAlphaScale()` routes to the single-base solve only when the family is neutral **and** every step's hex has equal channels.
- A neutral-classified scale with any unequal step goes to the per-step chromatic solver, which is exact for it.
- This is the principle behind `familyEscapeWarning`: measure the output, never infer from a label.

**Method: a per-step base at maximum transparency**. For each step, solve for the least opacity at which the solid step's sRGB target is reachable. Then back out the base that achieves it at that opacity. The exact implementation is `generateChromaticAlpha()` in `generate.js`.

The least opacity keeps the token as adaptive as possible over non-white surfaces. Verify every step by compositing onto white and diffing against the solid hex.

**The zero-channel rule**. White adds `255 × (1 − α)` to every channel, so that value is a hard floor. A target channel below it is unreachable at that α, whatever the base. A target channel at or near 0 pushes α toward 1.0.

- The neutral endpoint rule fixes its 100% case with a darker base. That does not transfer: nothing is darker than a channel already at 0.
- Instead the floor bleeds a little into that channel: `FLOOR = 3`, as implemented.
- That gives α ≈ 0.988 at the worst steps, a 3/255 deviation invisible at 8-bit precision.
- `FLOOR = 8` only buys α ≈ 0.969 while roughly tripling the deviation, so never go above 3.

**Dark mode mirrors it, solved against black**. Compositing over black gives `result = base × α`. A channel above `255α` is unreachable whatever the base, so the least opacity is `max(R,G,B)/255`. The base is then `target/α` per channel.

- `generateChromaticAlpha()` takes a `dark` option, and `generateAlphaScale()` passes the scale's own `dark` flag through.
- Solving dark scales against white inverts them. Dark step 1, which should be the *most* translucent, came out as a near-black base at **α 0.95**. That scrim composites darker than the dark surface itself.
- The suite composites dark chromatic cases onto black, and checks that step 1 is the translucent one.
- The zero-channel rule mirrors too. A target channel at or near 255 would push α to 1.0, so α is capped at `(255 − FLOOR)/255` and bleeds ≤ FLOOR/255 into that channel.
- Dark alphas *rise* toward the light end (step 1 lowest, step 12 highest), the inverse of light. That is the solve working.

**Three consequences to expect, not to fix:**

| Consequence | What happens |
|---|---|
| No cross-hue alpha parity | α follows each hue's minimum channel, so one step number lands at very different opacities per hue. At step 9: Grey 0.588, Red 0.871, Blue 0.929, Indigo 0.792. Alpha tokens can match their solid twins or layer identically across hues, not both; this system matches the solids. |
| Saturated hues flatten at the dark end | Once dark steps have a zero or near-zero channel, they settle at `1 − FLOOR/255 ≈ 0.988`. Red and Blue reach it by step 10; Indigo at step 11 (step 10 still climbing at 0.937). The step depends on source chroma, so do not assume it. |
| The base's hue drifts for gamut-constrained hues | On the anchored Indigo reference the base hue drifts up to **23.8°** from the scale's hue at the lightest steps. At step 2 the scale H is 297.6° and the base H 273.9°; drift nears zero by the darkest steps. Peak chroma at sRGB's blue-violet corner hits the wall and slides in hue. Invisible on white, but an indigo alpha tints bluer than its solid twin over dark. |

**Hue fidelity over adaptivity, a direction only**. Where hue fidelity over non-white surfaces matters more, raise α above its minimum until the base sits in gamut at the right hue. Accept the lower transparency. This is not validated, so it is not a rule. It needs a pass across several gamut-constrained sources first.

## Chromatic reference tables

All four use sources documented elsewhere in this skill, so every step can be checked against the solid reference tables.

**Grey** (`#6A6A6A`, grey mode). The base is `#000000` at every step, matching the single-base result at C=0:

| Step | Target (solid) | Base | Alpha |
|---|---|---|---|
| 1 | `#FDFDFD` | `#000000` | 0.007843 |
| 2 | `#F8F8F8` | `#000000` | 0.027451 |
| 3 | `#EEEEEE` | `#000000` | 0.066667 |
| 4 | `#E4E4E4` | `#000000` | 0.105882 |
| 5 | `#DBDBDB` | `#000000` | 0.141176 |
| 6 | `#BABABA` | `#000000` | 0.270588 |
| 7 | `#9B9B9B` | `#000000` | 0.392157 |
| 8 | `#7D7D7D` | `#000000` | 0.509804 |
| 9 | `#696969` | `#000000` | 0.588235 |
| 10 | `#4D4D4D` | `#000000` | 0.698039 |
| 11 | `#353535` | `#000000` | 0.792157 |
| 12 | `#161616` | `#000000` | 0.913725 |

**Blue** (`#1A6FBF`, free mode):

| Step | Target (solid) | Base | Alpha |
|---|---|---|---|
| 1 | `#FBFDFE` | `#007FBF` | 0.015686 |
| 2 | `#F4F9FF` | `#0074FF` | 0.043137 |
| 3 | `#E3F0FF` | `#0076FF` | 0.109804 |
| 4 | `#D2E7FF` | `#0077FF` | 0.176471 |
| 5 | `#C1DEFF` | `#0077FF` | 0.243137 |
| 6 | `#92BFF1` | `#0069DE` | 0.427451 |
| 7 | `#6A9FDB` | `#005BC1` | 0.584314 |
| 8 | `#3F80C5` | `#0056B2` | 0.752941 |
| 9 | `#126ABA` | `#005FB5` | 0.929412 |
| 10 | `#005088` | `#004E87` | 0.988235 |
| 11 | `#003F6E` | `#003D6C` | 0.988235 |
| 12 | `#002F55` | `#002D53` | 0.988235 |

**Red** (`#B91C1C`, free mode):

| Step | Target (solid) | Base | Alpha |
|---|---|---|---|
| 1 | `#FFFCFB` | `#FF4000` | 0.015686 |
| 2 | `#FFF6F5` | `#FF1A00` | 0.039216 |
| 3 | `#FFE9E5` | `#FF2700` | 0.101961 |
| 4 | `#FFDBD6` | `#FF1F00` | 0.160784 |
| 5 | `#FFCDC6` | `#FF1F00` | 0.223529 |
| 6 | `#FB9D98` | `#F50C00` | 0.403922 |
| 7 | `#E47672` | `#CE0700` | 0.552941 |
| 8 | `#CC4C4C` | `#B60000` | 0.701961 |
| 9 | `#BE2321` | `#B40200` | 0.870588 |
| 10 | `#950008` | `#940005` | 0.988235 |
| 11 | `#790005` | `#770002` | 0.988235 |
| 12 | `#5E0002` | `#5C0000` | 0.988235 |

**Indigo** (`#9747FF`, anchored mode, no-ceiling):

| Step | Target (solid) | Base | Alpha |
|---|---|---|---|
| 1 | `#FDFCFF` | `#5500FF` | 0.011765 |
| 2 | `#F9F7FF` | `#4000FF` | 0.031373 |
| 3 | `#F0EBFF` | `#4000FF` | 0.078431 |
| 4 | `#E8DFFF` | `#4800FF` | 0.125490 |
| 5 | `#DFD3FF` | `#4600FF` | 0.172549 |
| 6 | `#C4A9FF` | `#5000FF` | 0.337255 |
| 7 | `#AC7EFF` | `#5B00FF` | 0.505882 |
| 8 | `#9747FF` | `#6F00FF` | 0.721569 |
| 9 | `#7935DE` | `#5600D5` | 0.792157 |
| 10 | `#5C10B4` | `#5100AF` | 0.937255 |
| 11 | `#4B0097` | `#490096` | 0.988235 |
| 12 | `#390076` | `#370074` | 0.988235 |

All 48 values were verified by compositing onto white and diffing against the solid target. All are exact except Indigo steps 11–12. Those carry the agreed +3/255 offset on the green channel from the zero-channel rule, by construction, not an error.
