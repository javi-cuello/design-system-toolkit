# Hue families and source colours

The nine hue families, their 11 rules, the warnings that guard them, and how to pick one source or calibrate several. [SKILL.md](../SKILL.md) steps 3 and 4 point here; read the source's family before generating. `generate.js` is the specification.

## Contents

- [Family detection](#family-detection)
- [The avoid bounds](#the-avoid-bounds)
- [Generation-time warnings](#generation-time-warnings)
- [Universal rules](#universal-rules)
- [Per-family rules](#per-family-rules)
- [Yellow](#yellow)
- [Yellow and orange collision](#yellow-and-orange-collision)
- [Picking a source colour](#picking-a-source-colour)
- [Calibrating a multi-scale palette](#calibrating-a-multi-scale-palette)

There are 11 rules in all. Each exists for one of two reasons: sRGB gamut geometry, or documented perceptual hue drift at extreme lightness.

## Family detection

| Family | H range (detection) | Recommended source H | Avoid |
|---|---|---|---|
| Red | 0–40 | 20–35 | H < 15 or H > 37 |
| Orange | 40–70 | 48–62 | H < 42 or H > 65 |
| Yellow | 70–130 | 75–115 | H < 72 or H > 125 |
| Green | 130–170 | 140–160 | H < 133 or H > 165 |
| Cyan | 170–220 | 180–210 | H < 173 or H > 215 |
| Blue | 220–270 | 235–260 | H < 225 or H > 268 |
| Indigo | 270–300 | 275–295 | H < 274 or H > 298 |
| Purple | 300–320 | 305–318 | H < 303 or H > 319 |
| Magenta | 320–360 | 330–350 | H < 322 or H > 356 |

Detection normalises first: `H = ((H % 360) + 360) % 360`. The families partition the full circle cleanly: every degree 0–359 belongs to exactly one.

Some brands use other names for two families. Indigo is sometimes "iris" or "periwinkle", and magenta sometimes "pink". These are aliases, with the same H range and rules.

**The family comes from the source's H, never from its name**. A scale named "Green" with a source at H 177 is cyan (170–220), not green (130–170). It correctly takes cyan's rules and renders with a mint or cyan cast. Run `detectFamily()`, or check H against the table, before generating.

## The avoid bounds

**The Avoid column is derived, not stylistic**. Each bound is set against the family's own hue nudge, so the nudge cannot push a step out of its family.

Green is the worked example. Its band is 130–170 and its nudge +4° at steps 9–12. A source above ~166 lands its dark steps at 170+, which is cyan. The bound of 165 sits one degree below the measured eject point of 166.02.

**Direction matters**. Families nudging positive (green, magenta) are at risk at the *top* of their band. Families nudging negative (blue, indigo, purple, red) are at risk at the *bottom*.

Four bounds were once set too wide, so a family's own nudge ejected steps into a neighbour. The corrected bounds, with measured eject points:

| Family | Bound | Ejects into | Eject point |
|---|---|---|---|
| Magenta | 358 → 356 | Red, wrapping through 360 | Past 357.0 |
| Blue | 222 → 225 | Cyan | Below 223.9 |
| Indigo | 272 → 274 | Blue | Below 273.0 |
| Purple | 302 → 303 | Indigo | Below 302.0 |

The invariant is asserted against behaviour in both directions, not checked one-sidedly. Bounds are measured against the **actual source hue after gamut clamping**, not the requested hue. Clamping can shift a requested hue by a degree or more, enough to make arithmetic on nominal band edges wrong.

## Generation-time warnings

`generateScale()` warns, so a bad source is not left to a table lookup. Two fields answer different questions:

| Field | Kind | What it says |
|---|---|---|
| `sourceHueWarning` | Advisory | The source sits outside its family's safe range. It may be deliberate. |
| `familyEscapeWarning` | Factual | Steps in *this* scale resolved to a different family, each named. Measured from the output, not predicted. |

A source can trip the advisory without the factual one, because the bounds are conservative. So the second is never inferred from the first.

**Yellow's exemption from `familyEscapeWarning` covers the warm dark-tail drift, orange *and* red, not every escape**. Yellow's continuous drift crosses into orange at the dark end by design. The reference yellow (`#CA8A04`) puts steps 8–12 at H 69.5 down to 49.2; warning about that would flag the reference as broken.

**Why red is in the exemption**. What is exempted is a *rotation*, not a destination. It is `70 × (L_step − L_src)`, capped at 45°. It is negative for every step darker than the source, running through orange (H 40–70) into red (H 0–40) without changing character.

- Naming only orange made the exemption right by luck: `#CA8A04` stops at **H 40.79** in dark mode, 0.79° short of the boundary.
- Amber `#FFC330`, a real production scale, lands dark steps 1–2 at **H 39.16/39.42** by the same mechanism.
- Those steps render `#190F0C` and `#23140F`, near-black at L 0.18/0.21, where the family label means almost nothing.
- Steps *lighter* than the source rotate the other way, so direction keeps the exemption narrow.

**A green escape still warns**. The same drift pushes *light* steps toward higher hue for a source near yellow's upper boundary, into **green**. A mid-band source such as `#6D6700` (H 105.6) still drifts near-fully and escapes there. The reference lime `#A0C800` escaped too before `yellowHueScale`, but now holds its hue. Only escapes along the warm drift's own path are exempt; any other escape surfaces as it would for any family.

## Universal rules

**Gamut clamping** applies to all steps and all hues ([chroma-and-gamut.md](chroma-and-gamut.md)).

**Background zone C cap** applies to steps 1–5, all hues: `C = min(C, 0.10)`. In anchored mode it skips the anchor step. It tapers up toward a nearby anchor's effective source chroma within `TAPER_RADIUS` steps ([chroma-and-gamut.md](chroma-and-gamut.md)).

**Dark mode gates the step-9 nudges to steps 10–12**. In dark mode `applyFamilyRules()` runs with `beyondAnchorOnly`. That limits each family's hue nudge to steps strictly beyond the fixed curve anchor (step 9). It avoids a double hue shift at the step the light rules treat as the hue's home.

- A family listed below as "steps 9–12" (indigo, purple, green, magenta) nudges only steps 10–12 in dark mode.
- Dark step 9 keeps the raw source hue: dark green step 9 stays at H 155.05, while light step 9 gets 159.05.
- Blue is unaffected, since its rule starts at step 10. That is why the blue dark reference table has the same shape as light.
- Red's mid-step nudge (steps 6–8) and yellow's continuous drift apply in both modes unchanged.

The per-family rules below state the light-mode step ranges.

## Per-family rules

| Family | Behaviour | Rule |
|---|---|---|
| Blue | Dark steps drift toward indigo perceptually | Steps 10–12: nudge H −4° |
| Indigo | Narrow sRGB gamut; dark steps drift toward plain dark blue | Ceiling `effectiveSrcC = min(srcC, 0.18)` before the curve; steps 9–12: nudge H −3° |
| Purple | The most gamut-constrained range; dark steps drift toward magenta or indigo | Ceiling `effectiveSrcC = min(srcC, 0.15)` before the curve; steps 9–12: nudge H −2° |
| Red | High-chroma reds drift toward orange at mid-light steps | Steps 6–8: nudge H −4° |
| Orange | No perceptual rules beyond the universal ones | Choose a source at H 48–62 |
| Yellow | Severe dark-step drift toward olive and brown if hue is held flat | A continuous drift ([Yellow](#yellow)) |
| Green | Dark steps drift toward olive | Steps 9–12: nudge H +4° |
| Cyan | Looks brighter at high lightness: acceptable, not a defect | No perceptual rules |
| Magenta | Dark steps drift toward dark red or dark purple | Ceiling `effectiveSrcC = min(srcC, 0.20)` before the curve; steps 9–12: nudge H +3° toward the stable magenta centre (H 340) |

**The ceilings and the no-ceiling modifier**. In anchored mode no ceiling applies to the anchor step itself ([modes.md](modes.md)). For indigo, purple and magenta, the no-ceiling modifier skips the ceiling and relies on the gamut clamp alone. For indigo and purple the risk is a flat spot where a step hits the sRGB wall.

## Yellow

A flat hue with the standard chroma curve passes through an olive or khaki dead zone at mid-lightness (roughly steps 6–8), before the dark steps.

So yellow's hue drifts continuously across **every** step, not only the dark tail. The drift is proportional to how far the step's L has moved from the source's own L. Production yellows drift this way, Tailwind's hand-tuned yellow among them, rather than holding flat then snapping. The exact implementation is `yellowDrift()` in `generate.js`.

| Parameter | Value | Role |
|---|---|---|
| `rate` | 70 | Degrees of rotation per unit of L moved from the source; calibrated against Tailwind's published yellow OKLCH values. `--tail-rate` lowers it at steps 9–12 only. |
| `cap` | 45 | The most total rotation either way. It stops a very light source (an anchor at step 4–5 in anchored mode) over-rotating into orange or red at the dark end. |
| `YELLOW_DRIFT_FULL_H` | 105 | At or below this source H, the drift is at full strength |
| `YELLOW_DRIFT_ZERO_H` | 125 | At or above this source H, the drift is zero; between the two it fades linearly |

**The drift is scaled by source hue, so lime-region sources hold their hue**. The exact implementation is `yellowHueScale()`. The drift toward orange is a *yellow and amber* behaviour, not a lime one.

- Radix's hand-tuned lime holds H 119–129 across all 12 steps, while the same team drifts its amber from H 98 to 54.
- Google's `material-color-utilities` `DislikeAnalyzer` defines dark yellow-green (CAM16 hue 90–111, chroma > 16, tone < 65) as universally disliked.
- That is the zone a fully drifted lime's dark steps land in. No studied system rotates a lime toward orange (see the yellow-in-color-scale-generators research guide).
- The band edges mirror Material's own `isYellow` band (105–125).
- The fade is linear, not a hard cutover, so two near-identical sources either side of an edge cannot give structurally different scales.
- Sources at H ≤ 105, every true yellow and amber and the reference yellow included, are byte-identical to output before the scaling.

**Where it applies**. The drift runs in free mode (anchor fixed at step 9) and anchored mode (anchor wherever the source L lands). It always uses the actual source L and H, not the table's values at the anchor step. The anchor step drifts too, unlike every other family, because the drift runs across all 12 steps.

**Cross-scale consistency**. Since 2.0.0 the text steps are luminance-targeted, so text-on-background pairs read alike for yellow and every other hue. With `--oklch-text` they do not: verify by hand. Yellow sources usually peak in rendered chroma around step 7–8, not step 9 ([chroma-and-gamut.md](chroma-and-gamut.md)).

**Foreground on yellow's solid step** takes dark text above L 0.65 ([lightness.md](lightness.md), *Text usage rule*).

## Yellow and orange collision

**Run the collision check for every yellow source with H below 96**. The sweep behind it: 1,620 synthetic sources (H 72–128 × C 0.10–0.20 × L 0.40–0.85, free and anchored). Steps 9–12 were compared with the project's orange scale (`#E07000`) at the same steps. A collision is H within 3° of the orange at any of steps 9–12. Rates by source H, at the default rate and cap:

| Source H | Collision rate |
|---|---|
| 72–84 | 46–50% |
| 88 | 32% |
| 90 | 22% |
| 92 | 9% |
| 94 | 1% |
| ≥96 | 0% |

The risk reaches deep into the recommended yellow range (75–115): about half of sources at H 75–84 collide at default settings. A source inside the recommended range is not enough.

**The check**. `generate.js <yellow> --collide-with <the project's orange source>` generates the orange with the same settings as the yellow:

| Setting | Shared with the orange? |
|---|---|
| `--dark`, ceiling, hue easing, text schedule | Yes |
| The yellow's `--peak` or `--saturation` | Never |
| Mode | The yellow's, unless `--collide-mode <mode>` names the orange's |

It returns `collisions`: each of steps 9–12 within 3°, with both hues. In the API this is `hueCollisions(scale, other)`, and `--table` prints it as a warning.

**The fix**. On a collision it also returns `clearingTailRate`: the highest whole rate at or below 70 that clears every step. In the API that is `clearingTailRate(build, other)`, null when no rate does.

- Regenerate with `--tail-rate <n>` (`tailRate` in the API, 0–70: it only lowers).
- It sets the drift rate for steps 9–12 together, never one step, which would kink the tail.
- Steps 1–8 are untouched.
- Every step's description records `tail rate <n>`, so the scale regenerates from its own record.
- `--tail-rate` throws on a source outside the yellow family. On a lime whose drift is faded to nothing, it changes nothing and writes no token.
- In dark mode the rate belongs to the light scale: dark steps 9–12 are the light end, where the collision does not occur. With `--dark`, `--tail-rate` still applies the rate, and `generate.js` warns on stderr.

**No single global rate removes the risk**. Rates 20–70 were swept against the H 72–95 zone. Even `rate=20`, far too flat to fix the olive dead zone, only cuts collisions to 10.6%. No rate both removes the collision and corrects the olive drift. The per-source check and tail rate are the fix, not a missing default.

## Picking a source colour

Three things decide whether a source gives a clean scale. The recommended H per family is in [Family detection](#family-detection).

| Axis | Range | Why |
|---|---|---|
| Lightness | L 0.45–0.75 | Near the perceptual midpoint, so both ends stay expressive. Above L 0.80 the dark steps go muted; below L 0.40 the light steps wash out. Lime and yellow naturally sit higher, which is fine. |
| Chroma | C 0.10–0.20 | Vivid mid steps without heavy clamping at the light end. Below 0.08 the scale looks desaturated, so use grey mode. Above 0.22, expect some flattening at steps 1–4. Indigo and purple are capped at 0.18 and 0.15 regardless. |
| Hue | At least 8° inside the family boundary | Near a boundary a colour takes traits of both families, and the nudges may not suit it. A colour that reads ambiguously, such as an orange-red, gives an ambiguous scale. |

**The chroma range is per colour and blind to hue**. Never apply it across a palette ([Calibrating a multi-scale palette](#calibrating-a-multi-scale-palette)).

**Quick check:** paste the hex into [oklch.com](https://oklch.com) and read L, C and H before generating. If it looks like the right colour at a natural saturation and brightness, it will give a good scale.

**Reference sources**. "Validated" means the engine reproduces them and the suite pins them. It does not mean each is a palette pick at default settings. A palette takes each source through the mode-and-peak table in [SKILL.md](../SKILL.md) step 2.

- The yellow, lime, teal (cyan) and orange rows are naturally light hues.
- In plain free mode their solid step lands at L 0.52 and reads brown: `#CA8A04` free gives step 9 `#965800`, no warning amber.
- Give them `--peak`, or anchored where a chosen hex must appear (case A16).

| Colour | Hex | L | C | H |
|---|---|---|---|---|
| Blue | `#1A6FBF` | 0.54 | 0.147 | 251.9 |
| Green | `#109858` | 0.60 | 0.144 | 155.0 |
| Red | `#B91C1C` | 0.51 | 0.190 | 27.5 |
| Violet | `#97287C` | 0.48 | 0.172 | 339.5 |
| Yellow | `#CA8A04` | 0.68 | 0.142 | 75.8 |
| Lime | `#A0C800` | 0.78 | 0.190 | 122.9 |
| Teal | `#12A594` | 0.65 | 0.114 | 182.0 |
| Orange | `#E07000` | 0.66 | 0.168 | 53.2 |

## Calibrating a multi-scale palette

Picking several sources that read as peers is a different problem from picking one. The C 0.10–0.20 range ignores hue, while sRGB's chroma headroom varies by more than 2× around the circle.

| Hue | Ceiling at the solid step (L 0.52) | C 0.15 as a share of it |
|---|---|---|
| Yellow | ~0.11 | Out of reach |
| Green | ~0.15 | 95% |
| Magenta | ~0.24 | 62% |

Two scales at an identical C are therefore not at comparable saturation. One number chosen to fit all three fits the weakest.

**Peers means the same fraction of each hue's own ceiling, not the same chroma**. The benchmark systems ship this way: nobody mutes their magenta to match their yellow. Radix's and Tailwind's hand-tuned scales sit at very different chroma per hue.

Three functions, all exported from `generate.js`:

| Function | What it gives |
|---|---|
| `maxChromaAt(L, H)` | The highest in-gamut chroma at that L and H. It walks the file's own `clampToGamut` down from above any real ceiling, so it agrees with what the generator renders. |
| `usableChromaAt(L, H, noCeiling)` | The same, bounded by the family's pre-curve ceiling where that binds first (indigo 0.18, purple 0.15, magenta 0.20). This is the denominator for saturation; sRGB's raw ceiling would make every magenta look under-saturated. |
| `sourceAtSaturation(hex, saturation, noCeiling)` | The source re-chroma'd to that fraction of its headroom, keeping L and H. Returns a hex. |

On the CLI, `--saturation <0-1>` applies it to the source before generation:

```
node scripts/generate.js '#448252' --saturation 0.95     # green at 95% of its own ceiling
node scripts/generate.js '#CB50B9' --saturation 0.95     # magenta at 95% of its own ceiling
```

Use the same fraction for every scale in the palette, and they come out as peers. 0.95 is a reasonable default for accent scales; lower it for supporting colours that should sit back.

**No provenance token, deliberately**. Saturation shapes the *source*, not the curve. The resolved source is what gets recorded, so source and mode still reproduce the scale exactly. By contrast, `--peak` needs a token because it changes the curve while leaving the source alone. Ask that question of any future flag, not whether it was passed.

**What this does not fix**. Equal fractions do not give equal appearance at every step. Steps 1–2 and 10–12 still diverge, because headroom varies by hue at the extremes too ([limitations.md](limitations.md)).

Nor does it help where a hue's ceiling is genuinely low: a yellow's solid step is gamut-bound near C 0.11 whatever the source. A yellow badge will read as mustard beside a vivid magenta one. That is sRGB, not a calibration failure; `--peak` moves the yellow's vividness to a lightness where it has room.

**Why this section exists**. A real three-scale palette was once normalised by holding chroma constant across yellow, green and magenta. The shared number was the yellow's ceiling, so the magenta lost ~40% of its chroma, and every scale came back visibly flat.
