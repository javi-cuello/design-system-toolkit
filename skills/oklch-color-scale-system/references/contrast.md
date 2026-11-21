# Contrast

The contrast data every scale carries, the warnings computed from it, and the AAA guarantee with its one exception. [SKILL.md](../SKILL.md) step 6 points here.

## Contents

- [Contrast fields on every step](#contrast-fields-on-every-step)
- [contrastDriftWarning](#contrastdriftwarning)
- [solidForeground](#solidforeground)
- [The AAA guarantee](#the-aaa-guarantee)
- [Anchored mode can break it](#anchored-mode-can-break-it)
- [Safe cross-scale combinations](#safe-cross-scale-combinations)

## Contrast fields on every step

Contrast is emitted as data, not only prose.

| Field | On | Value |
|---|---|---|
| `contrastVsWhite` | Every step | WCAG 2 ratio against white, to 2 decimals |
| `contrastVsCanvas` | Every step | WCAG 2 ratio against the scale's own step 1, to 2 decimals |
| `apcaVsWhite`, `apcaVsCanvas` | Text steps 10–12 | APCA Lc values (0.0.98G-4g constants) |

The APCA implementation is validated against the published check value: `#888888` on white is 63.06.

**The APCA fields are informational only**. APCA is the draft contrast model for WCAG 3. It predicts perceived contrast better than the WCAG 2 ratio for light-on-dark text, which is where the dark scale lives. But it is pre-standard, and its constants have shifted between releases. Nothing in this system warns or gates on it.

APCA's own sign convention applies: positive for dark text on light, negative for light on dark. A rough current-draft reading is |Lc| ≥ 75 for body text, ≥ 60 for large text and ≥ 45 for headlines.

`contrastWarning` reads the same annotated fields it quotes, so the warning and the data cannot disagree. After rebuilding steps, `driftTowardReference()` recomputes all of these. Rotating hue at fixed L and C can move a ratio at the second decimal, so annotations are never carried over stale.

## contrastDriftWarning

Steps 1–9 keep the fixed L table, and OKLCH L is not luminance. So a saturated step can land on the other side of 3:1 or 4.5:1 from a neutral at the same L. Across six hues, step 8 against white spans 3.85–4.50:1, either side of 4.5.

- The scale names every step 1–9 whose ratio crosses either threshold against a neutral at its L, with both ratios.
- The ratio is against white in light mode, and against step 1 in dark.
- It reports rather than corrects. Matching these steps' luminance would darken vivid greens and yellows at their most vivid steps. Material's HCT makes that trade; this skill does not.
- The comparison uses raw ratios. `contrastVsWhite` is rounded to two decimals, so a red step 8 reads `4.5` at 4.496:1, which fails.

## solidForeground

The foreground-on-solid rule, measured instead of remembered. The scale object carries a recommendation for text on the solid step:

```
{ step, recommend: 'light'|'dark', vsWhite, vsDarkText, apcaRecommend, apcaVsWhite, apcaVsDarkText, darkTextHex }
```

- It computes the WCAG ratio of both candidate foregrounds against the solid step's real hex. The candidates are white and the scale's own dark end: step 12 in light mode, step 1 in dark.
- It recommends whichever wins.
- The solid step is the anchor in anchored mode, the peak step under `--peak`, and step 9 otherwise. This follows the text usage rule: check the actual L, not an assumed step ([lightness.md](lightness.md)).

This extends the yellow-family rule to every hue. A free-mode yellow at the fixed step-9 L still recommends light text (5.69:1 beats its dark end). A vivid brand yellow anchored at L 0.87 flips to dark (9.42:1 against 1.48:1).

**Both contrast models are reported, because they answer different questions**. They can disagree exactly where this field matters most.

- `recommend` is WCAG 2-derived and stays the primary field. WCAG 2 is the normative standard audits run against.
- `apcaRecommend` is the parallel APCA verdict, from the signed `apcaVsWhite` and `apcaVsDarkText` Lc values; the larger magnitude wins.
- It is carried because WCAG 2's formula mispredicts perceived contrast for yellow and orange hues. The Radix Colors maintainers document this. They design yellow and amber solid steps against APCA and switch to dark text below |Lc| 40.
- When the two agree, as for every validated reference source, read either.
- When they disagree on a yellow-family solid, APCA better predicts what a person can read. WCAG 2 is still what a compliance audit measures. State both to whoever owns the decision; never silently pick one.

## The AAA guarantee

All text steps pass WCAG AAA (7:1) in light mode:

| Foreground | Background | Contrast | Guarantee |
|---|---|---|---|
| Step 12 (L 0.30) | White | 13.6:1 | AAA |
| Step 12 (L 0.30) | Step 1 | 13.3:1 | AAA |
| Step 11 (L 0.36) | White | 10.9:1 | AAA |
| Step 11 (L 0.36) | Step 1 | 10.6:1 | AAA |
| Step 10 (L 0.42) | White | 8.5:1 | AAA |
| Step 10 (L 0.42) | Step 1 | 8.3:1 | AAA |

Dark text steps against step 1 (L 0.18): step 10 at 9.4:1, step 11 at 11.9:1, step 12 at 15.3:1, all AAA ([lightness.md](lightness.md)).

## Anchored mode can break it

The AAA guarantee holds by construction only where the fixed L table applies. Generation measures it rather than assuming it.

Anchored mode replaces the anchor step's L with the source's own. A source at roughly L 0.44–0.47 anchors at step 10; a lower L anchors at 11–12. That text step is then lifted above its fixed value. For high-luminance hues (yellow, green, olive) the ratio against white drops below 7:1, measured down to 6.68:1 at `oklch(0.465 0.13 120)`.

Free and grey mode hold: a full-hue sweep's worst text-step ratio measured 7.82:1.

An anchor's contrast cannot be predicted from its L, because the L-to-luminance mapping depends on hue. So `generateScale()` computes actual WCAG ratios at steps 10–12. Light mode measures against white and step 1; dark mode against step 1. It returns two fields when relevant:

| Field | Kind | Meaning |
|---|---|---|
| `anchorInTextZone` | Structural | `mode === 'anchored' && anchorIdx >= 9`, the mirror of `anchorInBackgroundZone` |
| `contrastWarning` | Measured | Each failing step and its ratio |

Like `familyEscapeWarning`, the warning comes from the generated output, not from the tables, and `--table` prints it. When it fires, the fix is a source with L further from the text-step range. The other choice is to accept AA-level contrast at the named steps deliberately. The scale is still produced: the anchor is the user's decision.

## Safe cross-scale combinations

The text steps are luminance-targeted, so same-step pairs give the same contrast across hues. Step 12 on step 2 measures 12.8–12.9:1 for blue, red, green and yellow alike, all AAA. On `--oklch-text` scales it varies by hue (12.6–13.4:1 on the same set), so verify those by hand.
