# Parameter recovery

`scripts/recover.js` is the reverse of `generate.js`. Given an existing 12-step scale, it finds the settings that reproduce it. [SKILL.md](../SKILL.md) step 9 points here. `recover.js` is the specification; its comments record the reasons in place.

## Contents

- [What it returns](#what-it-returns)
- [Why it exists](#why-it-exists)
- [How the search runs](#how-the-search-runs)
- [The anchored invariant](#the-anchored-invariant)
- [Drift recovery](#drift-recovery)
- [Tail-rate recovery](#tail-rate-recovery)
- [Which text schedule](#which-text-schedule)
- [Warnings and the poor-fit threshold](#warnings-and-the-poor-fit-threshold)
- [Accuracy and limits](#accuracy-and-limits)

## What it returns

The input is 12 hex values and nothing else.

```
node scripts/recover.js '#FDFDFD' '#F8F8F8' '#EEEEEE' ... (12 hex values)
node scripts/recover.js --dark '#0C1219' ... (search against the dark L scale instead)
```

It searches for the mode, source hex, anchor position and ceiling setting. Since 1.5.0 it also finds the `--peak` step. Since 2.0.0 it also finds the text schedule, trying both. A scale made before 2.0.0 comes back with `oklchText: true`, the flag that regenerates it.

| Output | Meaning |
|---|---|
| Mode | The best-fit mode |
| `source` (also `hex`) | The recovered source hex |
| `anchorIdx` | The anchor step, if anchored |
| Ceiling | The ceiling setting |
| `peak` | The `--peak` step, where one fits |
| `oklchText` | `true` for the pre-2.0.0 text schedule; `null` when the schedule cannot be told |
| `driftedToward`, `driftedTowardHue` | The drift reference as a hex, and as a raw hue |
| `tailRate` | Yellow's tail rate, where one fits |
| `meanError`, `maxError` (also `err.mean`, `err.max`) | Per-channel sRGB error against the target, 0–255 scale |
| `warning` | Set whenever the fit is suspect (below) |

**Both naming conventions work**. The API first used the names marked *also* in the table, while the CLI used the others. The API result now carries the CLI's names as additive aliases beside the originals. Renaming either would break code written against it.

**The CLI prints everything the API recovers**. Anything needed to reproduce the scale must appear in CLI output. That includes `warning`, `driftedToward` and `tailRate`. The CLI is the primary way to use the tool.

A drifted scale recovers at mean and max error 0. A CLI that dropped the reference would report a *perfect* score for settings that regenerate a different scale.

## Why it exists

Without it, re-sourcing or auditing a scale means guessing the mode and source. The guess fails in one recurring way: assuming free mode when the scale is anchored. Free mode never reproduces any step verbatim, since L always comes from the fixed table. A scale with one suspiciously "clean" step against a plausible source is almost always anchored.

## How the search runs

**Grey mode first**. It is the cheapest branch. Any step's own OKLCH serves as the grey candidate source, since a real grey scale holds the same C at every step. Without this branch, an achromatic scale came back as anchored, with a wrong source and a nonzero error.

**Peak scales are found from the observed chroma argmax**. A `--peak` scale's maximum is the step rendering the highest chroma, but only to within one step. Clamping can shave the true peak harder than its neighbour. So the argmax and both its neighbours are tried as candidate peaks.

All three seeds are read from the argmax step, deliberately. Seeding from the candidate peak step failed three ways on one amber scale; the seeding comment in `recover.js` records all three.

- The peak step's fixed L could not *encode* the true source chroma at all. That is exactly why the rendered maximum had moved off it.
- The hue seed missed the yellow-drift zero-point.
- The chroma seed needed the curve factor unwound: `C_argmax / computeFactor(argmax, candidate)`.

When an anchored-at-grid-L reading and a free-peak reading both reproduce a scale exactly, recovery prefers the peak reading. It is the weaker claim, its candidates run first, and ties do not displace them. Five real peak scales (peaks 4–7, yellow through cyan) recover with the exact mode and peak, and sub-0.5/255 error. Plain free and genuinely anchored scales are unaffected.

**Yellow's hue drift is inverted, not searched**. The drift depends on the *source's own L* (`yellowDrift(srcL, srcH, L)`), though free mode discards L from the output. A narrow search around a step's observed H missed the true source by 10+ degrees and called a yellow scale anchored.

- The base drift does not depend on `srcH`. So `impliedDrift = clamp(70 × (L_guess − anchorL), −45, 45)` comes straight from a guessed source L.
- Since `yellowHueScale` (1.4.0), `observedH = srcH − impliedDrift × yellowHueScale(srcH)`. That is piecewise linear in `srcH`.
- The inversion solves each of the three regions (full drift, taper, hold). It keeps the solutions the authoritative `yellowHueScale()` confirms as self-consistent.
- A future edit to the scale's constants therefore breaks recovery loudly instead of drifting silently.

**A second chroma seed for vivid sources**. Step 9's chroma is the natural source-C guess, since the curve factor is 1.0 there. But a vivid source's step 9 can be gamut-crushed. A lime at C 0.190 renders step 9 at C 0.125, and every candidate seeded from it lands 3+/255 off.

- Steps 5–7 sit at wider-gamut lightness, where `C_i / computeFactor(i, 8)` recovers the true chroma almost exactly.
- Measured: 0.1902, 0.1904 and 0.1892 against a true 0.190.
- The median of those three becomes a second chroma candidate whenever it meaningfully exceeds the step-9 estimate.

## The anchored invariant

An anchored candidate's source must equal the target's own value at its anchor step. Verbatim is the whole point of anchored mode.

- `recoverParameters()` drops anchored candidates that fail `source === target[anchorIdx]` before picking a result.
- If the best-error candidate had to be dropped for this, the result carries a `warning` saying so.
- This mostly happens when drift, or another manual adjustment, was applied after generation.
- Drift is now recovered ([Drift recovery](#drift-recovery)). For a genuine non-drift edit, such as one step recoloured by hand, the warning is still the honest answer.

## Drift recovery

The drift formula, `H[i] = anchorH + cap × (11−i) / 11`, has one free parameter and inverts in closed form:

```
cap = (H[i] − anchorH) × 11 / (11 − i)      for any non-anchor, non-last-index step
```

For every anchored candidate whose raw fit is not already excellent, the tool:

1. Solves `cap` at every eligible step, skipping steps with target chroma below 0.03, where hue is numerically unstable.
2. Takes the median, and rebuilds the implied reference hue.
3. Applies `driftTowardReference`, and re-scores.
4. Reports the drift if it beats the raw candidate.

**Two fields, on purpose**. `driftedToward` is **a hex string that `driftTowardReference()` accepts directly**, so a result feeds straight back into the generator. The raw hue sits beside it as `driftedTowardHue`, for reporting and diffing. A bare hue number in `driftedToward` threw (`hex.replace is not a function`) the moment anyone round-tripped it. Recovery output that cannot reproduce what it recovered is worse than none, because it reads as authoritative.

**How well it works**. A reconstructed case that returned `free · wrong source · error 5.86` with a rejection warning now returns `anchored · exact true source · error 0 · driftedToward ≈ 305.9°`. The true reference was 306.02°. Over 100 random anchor and reference pairs, the exact source comes back 89% of the time. The rest still find the right source and mode, with a small residual error (1–2 out of 255).

**Drift recovery is anchored-only, structurally**. The inversion needs an exact anchor hue to solve `cap` against. It takes that from the target at the anchor step, trustworthy only because anchored mode is verbatim there.

Free mode has no verbatim step, and its source search is confounded by the rotation being recovered. A drifted *free* scale therefore comes back without a reference. It must still fail loudly, through the poor-fit warning, never with a confident wrong source; a regression test asserts it.

## Tail-rate recovery

A scale made with `--tail-rate` fits nothing the default search tries. The free search inverts step 9's hue at the default rate, and step 9 is a tail step. Without this search, `#AC731A` at rate 54 came back as source `#EDCA6C` on the old text schedule, max error 5, with no warning.

**The relation**. Each yellow step's hue is `srcH − rate × k × (srcL − L)`, with `k = yellowHueScale(srcH)`. Once a source is guessed, each tail step gives the rate it implies.

**When it opens**. The search runs again when a light scale's best default fit is max 2/255 or worse. Some step must also read yellow at a chroma of 0.03 or more. Any step counts, not only steps 5–8: a muted dark yellow anchored in the tail has no yellow step there.

| Search | How it runs |
|---|---|
| Anchored | Every step is tried as the anchor, step 9 and later included, with its own value as the source. The rate comes from the other tail steps. Whole rates within ±4 of that estimate are scored, or ±10 for an anchor in the tail, where fewer steps inform it. |
| Free | Steps 1–8 fix only the chroma and `srcH − 70k × srcL`, never the source's L and hue apart. So every source L is tried with the hue step 8 implies there (`invertDrift`), skipping sources outside the gamut. The best few are polished in L, hue, chroma and rate. |

**When a rate is reported**. A rate is provenance, so it is reported only when near-exact and clearly better. Both must hold:

- Max error 1/255 or less.
- A lower max error than the best default fit, and at most half its mean. The default includes the same search held at rate 70, from each tailed fit's own source.

Without that margin, default scales came back as rate 50 or 67. The result carries `tailRate`, and so does the CLI.

**What "recovered" means**. Anchored, the source comes back verbatim and the scale within 1/255. An anchor at step 9 or later often lands a unit off, untailed, because the search opens only at max 2/255. Where it does run, the rate can differ by a few units from the one used.

Free, 8-bit rounding lets the rate and the source's L trade a few units. In both, the claim is that the settings regenerate the scale within 1/255.

A light yellow scale left at max 2/255 or worse carries a hedged `warning`: a tail rate, if one was used, was not found.

**Dark scales are never searched for a rate**. A dark scale's steps 9–12 are its light end, where the collision the rate fixes does not occur. A dark search gave a false rate (49–69) to 34 of 600 default dark free yellow scales.

- A dark scale made with `--tail-rate` comes back inexact: `#AC731A` at 54 gives max 4/255, on the older text schedule.
- It carries the hedged warning, saying the rate is not recoverable in dark mode.
- The warning also fires on default dark yellows a unit or two off, so it is worded as a condition.

## Which text schedule

The schedule is decided symmetrically, in this order:

1. A fit no worse on both max and mean error, and clearly better on one, wins. Clearly better is a lower max, or at most half the mean.
2. Otherwise, where both fit within 1/255, the schedule cannot be told. The current fit is reported with `oklchText: null` and a warning naming the older fit.
3. Otherwise the lower max wins, then the lower mean, and a warning says the schedule is uncertain. That covers both fits past 1/255 without a clear winner, or one fit with the lower max and the other the lower mean.

A worse fit is never reported. Further rules:

- An older fit that wins while neither fit is within 1/255 says what it won on: a lower max, or a mean at most half.
- An exact older fit carries no hedge.
- An uncertain note names what decided it: the lower max error, or the same max and the lower mean.
- An untellable tie reports the current fit. At the same max it can therefore carry a slightly higher mean than 2.2.1 reported.
- One exception: an older fit that needs a tail rate only ties with a current fit within 1/255. The tail rate is a 2.3.0 option, on a schedule versioned for scales made before 2.0.0. So it is reported as untellable, never claimed.

This rule replaced a bare lower mean, which gave current-schedule scales a false `oklchText`. It also replaced a one-sided margin that dropped exact older fits for current ones a unit off.

**What the sweeps found:**

| Set | Result |
|---|---|
| Two seeds of 120 light yellow tail scales, random rates 25–65, free and anchored | All 240 regenerate within 1/255; none on a false `oklchText` (32 untellable, `null`); no reported rate past 1/255 |
| 360 default scales: yellow, orange, green; light and dark; free and anchored | No rate gained; none worse than before the search; 10 untellable; 3 dark free ones given a hedged `oklchText` the 2.2.1 search did not give |
| 99 genuine older-schedule scales, seeded, five families | 95 read as older (98 at 2.2.1); the other 3 untellable; none worse |

## Warnings and the poor-fit threshold

**A poor fit** is a mean over 3 or a max over 20, out of 255. The raw errors are compared, with one threshold, `isPoor`, for every note.

- A poor fit means nothing the search tried explains the scale. Usually it is a manual adjustment recovery has no model for.
- The CLI's poor-fit `warning` is always added when the fit is poor, whatever other warning stands. Its wording differs from the invariant warning.
- When both fits are poor, no schedule note is written, beyond calling a claimed `oklchText` a guess.
- When the reported fit is poor, no tail-rate note is written.
- When only one fit is poor, an uncertain note says the other "misses too", not that it is close.
- A clean, undrifted scale gets no warning at all.

## Accuracy and limits

**Checked against known ground truth:**

| Test | Result |
|---|---|
| Hand-picked cases, yellow in both modes and dark mode included | 8/8 correct mode |
| A 36-case sweep across all 9 families in both modes | 34/36 correct mode; worst reconstruction error under 1 unit of 255, misses included |
| Lime test set, after the second chroma seed | 28/28 mode-correct, worst 0.47/255 |

**Orange and cyan mode labels can be wrong, and that is accepted**. These two families have no hue nudge at the anchor ([hue-families.md](hue-families.md)). So free mode and "anchored at step 9" are near-identical at that step. The error is sub-1-unit either way, so the recovered settings still reproduce the scale.

**What cannot be recovered:** anything that is not this drift schedule. A one-off manual recolour of a single step still returns the invariant warning, never a confident wrong answer.
