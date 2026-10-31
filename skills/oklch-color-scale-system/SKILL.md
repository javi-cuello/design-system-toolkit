---
name: oklch-color-scale-system
description: Generates perceptually consistent 12-step OKLCH color scales for UI design systems, in both light and dark mode. Use this skill when asked to create a color palette, generate a color scale, build design tokens, or work with OKLCH colors for UI — including alpha/transparent variants. Handles free mode (any color), anchored mode (brand colors that must appear verbatim, light and dark), grey/neutral mode, and a hue-drift technique for nudging a ramp toward a secondary reference without moving its anchor. Applies hue family perceptual rules for blue, indigo, purple, red, orange, yellow, green, cyan, and magenta — 11 rules total, each grounded in sRGB gamut geometry or documented perceptual hue behavior. Guarantees WCAG AAA contrast at text steps in free and grey mode, light and dark; anchored mode can override a text step's lightness with the source's own, so generation measures actual WCAG ratios and returns a contrastWarning whenever a text step falls below 7:1.
---

# OKLCH Color Scale System

**Version 2.1.5** — history in CHANGELOG.md.

A principled system for generating perceptually consistent 12-step color scales for UI design systems, built on the OKLCH color space.

## Project context first

If a **design system context document** is available — in Claude Code, as a file in the working folder (the project's CLAUDE.md names it); in claude.ai, via Project knowledge or provided in the conversation — it is the authoritative per-project configuration. Match the connected file's `fileKey` against its registry and hydrate every setting this skill needs from the matching sections — run discovery **only** for items the document marks `[TBD]`. Rulings recorded there outrank file evidence; report conflicts rather than re-deriving. New rulings produced by a run are recorded in the document: when it is a writable file (Claude Code), update it in place in the same turn; otherwise output the updated sections for the maintainer to paste back.

Settings this skill will look for before asking: **dialect** only — the `language` key in the document's `audit-settings` block, where the toolkit's other tools read it too (absent means en-GB). The generator writes one dialect-bearing word, the neutral mode's name in provenance. Default en-GB (`--mode grey`, `grey mode`); when `language` is `en-US`, pass `--mode gray` and name the ramp `Gray` — values are identical, only the word written into `figmaDescription` changes. Everything else here is a pure function of its input.

## Files in this skill

| File | What it is | When to use it |
|---|---|---|
| `SKILL.md` (this file) | Rules, the reasoning behind them, cross-system validation history, known limitations | Read this to understand *why* the system works the way it does |
| `scripts/generate.js` | The authoritative implementation — every formula below is a description of what this file does, not a second spec | Run this to actually generate a scale, rather than hand-computing the formulas |
| `tests/test-oklch.js` | Regression suite, 637 checks (reference tables, invariants, fuzz testing, recovery accuracy, cross-hue calibration) | Run after changing anything in `generate.js` — exits non-zero on any real failure |
| `tests/reference-scales.md` | Expected L, C, H and hex for six validated sources, 72 values — the fixtures `test-oklch.js` reads and asserts | Read when checking the engine by eye, or regenerate it from `generate.js` after a deliberate change |
| `scripts/recover.js` | The reverse of `generate.js` — given an existing 12-step ramp, recovers the mode, source, and settings that reproduce it | Run when re-sourcing or auditing a ramp that already exists, instead of guessing |

**If the code and this document ever disagree, the code is correct and this document needs updating** — that relationship only goes one way. If code execution isn't available, `generate.js` and `recover.js`'s source is short and readable; treat it as the specification directly.

The hue rules and the alpha rationale stay in this file rather than in a reference, because they are read during a generation: decision material behind an on-demand load is how an agent ends up hand-writing the logic instead. Only fixture data (`tests/reference-scales.md`) lives outside it.

---

## Before generating a scale

Ask for the following before proceeding:

1. **Source color** — hex value required
2. **Mode** — free (default, any color) or anchored (brand color must appear verbatim in the scale)
3. **No-ceiling modifier** — only relevant for indigo, purple, magenta. Skips the hardcoded chroma ceiling and relies on gamut clamping only. Use when the user wants maximum saturation for these hues. Default is off.
4. **Dark mode** — whether a dark scale is also needed
5. **Grey mode** — whether this is a neutral/grey color (constant C throughout, no curve)
6. **Alpha tokens** — whether a parallel transparent scale is needed alongside the solid one

**Choosing mode and peak — the one decision that gets driven wrong:**

| The situation | Generate with |
|---|---|
| Brand hex that must appear verbatim in the ramp | `--mode anchored` |
| Naturally-light hue (yellow, amber, lime, orange, cyan), no verbatim requirement | `free --peak N` at the hue's vivid step — **never anchored** |
| Any other chromatic color | `free` (default) |
| Neutral / grey | `--mode grey` |
| Several ramps that must read as peers | the same `--saturation` fraction on each — never a shared absolute chroma |
| Project-wide contrast or hue-schedule variants | the versioned flags below, collection-wide |

The second row exists because it was gotten wrong at scale: a real palette accumulated five non-brand anchored ramps used purely as a peak-placement workaround, stamping `verbatim` provenance onto ramps with no brand mandate — the failure `--peak` was built to end. Anchored mode answers "must this exact hex appear?"; `--peak` answers "where does this hue's vividness live?". They are different questions.

**Check which family the source actually resolves to, not the one implied by its name.** A ramp named "Green" is whatever family its source hex's H falls into by the Family detection table below — not necessarily green. A source at H 177 is inside the cyan range (170–220), not green (130–170), and will correctly take cyan's rules and render with a mint/cyan cast — regardless of what the ramp or variable collection is named. This is correct behavior, not a bug, but it's easy to miss if the name is trusted over the actual resolved family. Run `detectFamily()` (or check the H value against the Family detection table) before generating, if the name and the expected visual character need to match.

**Run `generate.js` rather than hand-computing** — faster and eliminates arithmetic slips from hand-computing 12 steps of curve/clamp/hue-nudge math token by token.

```
node scripts/generate.js '#1A6FBF'                                    # free mode, light, JSON output
node scripts/generate.js '#1A6FBF' --dark                              # dark mode variant
node scripts/generate.js '#9747FF' --mode anchored --no-ceiling --alpha # anchored, no ceiling, + alpha scale
node scripts/generate.js '#6A6A6A' --mode grey --table                 # grey mode, human-readable table
node scripts/generate.js '#1A6FBF' --drift-toward '#8040FF'            # anchor untouched, rest leans toward reference
```

Flags: `--mode free|anchored|grey|gray` (default `free`; `gray` is `grey` spelled en-US — see Dialect), `--dark`, `--no-ceiling`, `--peak <1-12>` (free-mode vividness-peak placement — see Versioned generation options), `--saturation <0-1>` (re-chroma the source to a fraction of its own hue's ceiling — see Calibrating a multi-ramp palette), `--ease-hue` (versioned opt-in schedule) and `--oklch-text` (reproduces a ramp generated before 2.0.0) — see Versioned generation options below, `--alpha` (also compute the alpha/transparent scale), `--drift-toward <hex>` (apply the secondary-reference technique on top of the base scale), `--table` (readable output instead of JSON), `--name <label>`.

Inputs are validated at the boundary: hex must be 6-digit (`#RRGGBB`, `#` optional; `#RGB` shorthand expands), and mode must be one of the three above — anything else exits with a clear error. Before this guard existed, an invalid hex sailed through into a NaN cascade (`#NANNANNAN` steps), and an unknown mode silently behaved as free mode while stamping the bogus mode name into `figmaDescription` provenance.

---

## Overview

This system generates color scales from any source color using OKLCH — a perceptually uniform color space where lightness (L), chroma (C), and hue (H) are independent axes. The result is a consistent, predictable scale that works across any hue and meets WCAG AAA contrast requirements at text steps.

OKLCH values take the form `oklch(L C H)`:
- **L** — lightness, 0 (black) to 1 (white), perceptually uniform
- **C** — chroma (colorfulness), 0 (grey) upward, max varies by hue
- **H** — hue angle in degrees, 0–360

Unlike HSL, equal steps in OKLCH L produce equal perceived brightness differences, which is why the scale is built in OKLCH. **OKLCH L is not WCAG luminance, though**: at equal L, contrast varies by hue — measured across six hues at step 10, 8.03–9.44:1 against white. So the text steps (10–12) are not placed by L. Since 2.0.0 each is solved per hue to the WCAG luminance of the achromatic step at that L, and the same six hues then measure 8.40–8.50:1. Contrast is guaranteed by that targeting plus the measured `contrastWarning`, never by L alone.

Each scale has 12 steps covering every UI role from app-shell background to headings. There are two core generation modes (free and anchored), a grey mode for neutrals, dark-mode variants of each, an advanced hue-drift technique for special cases, and an alpha (transparent) variant of any solid scale.

---

## The light L scale

All 12 steps use a fixed L scale. This scale is universal — every hue uses exactly these values, with two documented exceptions: the anchored-mode override (source L replaces the nearest step's L — see Anchored mode) and the neutral-scale exception at steps 11–12 (see Neutral scale exception).

| Step | L | Primary use |
|------|------|---|
| 1 | 0.993 | App shell / canvas background |
| 2 | 0.98 | Page background |
| 3 | 0.95 | Subtle background |
| 4 | 0.92 | UI element background |
| 5 | 0.89 | Hover background |
| 6 | 0.79 | Active / selected background, subtle border |
| 7 | 0.69 | UI border |
| 8 | 0.59 | Hovered border |
| 9 | 0.52 | Solid backgrounds, badges — anchor step (free mode) |
| 10 | 0.42 | Muted text |
| 11 | 0.36 | Body text |
| 12 | 0.30 | Headings |

### Role distinction: hover vs. active

Steps 5 and 6 are intentionally separated:
- **Hover** (step 5) — subtle shift triggered by pointer proximity. The 1.10 contrast ratio against step 4 is acceptable because hover is reinforced by cursor change.
- **Active/selected** (step 6) — a persistent state visible without a cursor. L 0.79 gives a 1.39 ratio against step 5, making selected states unambiguous.

### Distribution rationale

- **Steps 1–2** — tight gap (0.013) for canvas vs. page background
- **Steps 2–5** — even 0.030 gaps for consistent background tint progression
- **Steps 5–6** — larger jump (0.10) marking the transition from background to interactive/border zone
- **Steps 6–8** — even 0.100 gaps for consistent border weight progression
- **Steps 8–9** — 0.07 gap to the solid anchor step
- **Steps 9–12** — 0.10, 0.06, 0.06 gaps for text contrast precision

The dark end stops at L 0.30 — rich, readable text without near-black. Lighter than Tailwind `950` (L ≈ 0.22) — a deliberate choice for chromatic text legibility (see Neutral scale exception for why neutral text can go darker than this).

### Text usage rule

**Text is only used at steps 10, 11, and 12.** Steps 1–9 are never used as text colors.

**Foreground-on-solid exception — yellow-family hues.** For the solid/anchor step used as a filled background (badges, solid buttons), yellow-family hues don't have enough contrast headroom for white/light foreground text at typical brand lightness — white text on a vivid yellow solid can fall below 2:1. Where the solid step's L is above roughly **0.65**, pair it with **dark foreground text** (the same family's own dark end, e.g. step 12, or a neutral near-black) instead of the light text used on every other hue's solid step. This is a usage/pairing rule, not a generation rule — it doesn't change the solid step's hex, only which text color sits on top of it. Because anchored mode's anchor moves with the source's actual lightness (unlike free mode's fixed step 9), check the L threshold against the anchor's actual L, not an assumed step number. **This rule is now also computed for you:** `generateScale()` returns `solidForeground` with the measured ratios and a `'light'`/`'dark'` recommendation for the actual solid step, for any hue — see Contrast below. The prose threshold above explains *why*; the field is what to actually read.

---

## The dark L scale

A separate fixed L scale with inverted direction — step 1 is darkest (canvas), step 12 is lightest (heading text). Same two exceptions apply as light mode (anchored override, neutral scale — see below).

| Step | L | Primary use |
|------|------|---|
| 1 | 0.18 | App shell / canvas background |
| 2 | 0.21 | Page background |
| 3 | 0.24 | Subtle background |
| 4 | 0.27 | UI element background |
| 5 | 0.30 | Hover background |
| 6 | 0.40 | Active / selected background |
| 7 | 0.50 | UI border |
| 8 | 0.60 | Hovered border |
| 9 | 0.70 | Solid backgrounds, badges — anchor step |
| 10 | 0.78 | Muted text |
| 11 | 0.85 | Body text |
| 12 | 0.93 | Headings |

### Derivation method: three validated pins + even zone interpolation

Not copied from any single external system, nor built as a series of individually-justified numbers. Derived from **three cross-validated pins**, with every step between them filled by even gaps within its zone — the same zone philosophy used for the light L scale.

**Pin 1 — Canvas (step 1), L 0.18.** Verified against five production systems' actual dark canvas hex values:

| System | Hex | L |
|---|---|---|
| GitHub Primer | `#0d1117` | 0.176 |
| Radix Colors | `#111111` | 0.178 |
| Material Design | `#121212` | 0.182 |
| IBM Carbon (g100) | `#161616` | 0.200 |
| VS Code dark | `#1e1e1e` | 0.235 |

All five cluster at L 0.176–0.235; none approach pure black. L 0.18 sits centrally, matching Radix and Material almost exactly.

**Pin 2 — Solid/anchor (step 9), L 0.70.** Verified against actual production solid/button colors:

| System | Hex | L |
|---|---|---|
| GitHub Primer accent | `#58a6ff` | 0.715 |
| IBM Carbon dark button | `#78a9ff` | 0.736 |

Deliberately lighter than Radix's own anchor (L 0.54) — Radix keeps the same solid color L across light and dark by design choice, but GitHub and IBM's actual dark-mode buttons independently confirm the more common practice: solid/action colors read better lighter and less saturated against dark surfaces (also directly documented in Material's dark theme guidance).

**Pin 3 — Headings (step 12), L 0.93.** Verified against five systems' highest-contrast dark-mode text:

| System | L |
|---|---|
| IBM Carbon `text-01` | 0.967 |
| Radix neutral step 12 | 0.949 |
| GitHub Primer default fg | 0.943 |
| Material high-emphasis | 0.925 |
| Radix accent step 12 | 0.912 |

Cluster: L 0.91–0.97. L 0.93 sits centrally.

**Interpolation between pins — even gaps per zone:**

| Step | L | Gap | Role |
|---|---|---|---|
| 1 | 0.18 | — pin | Canvas |
| 2 | 0.21 | 0.03 | Page bg |
| 3 | 0.24 | 0.03 | Subtle bg |
| 4 | 0.27 | 0.03 | UI bg |
| 5 | 0.30 | 0.03 | Hover bg |
| 6 | 0.40 | 0.10 | Active bg |
| 7 | 0.50 | 0.10 | UI border |
| 8 | 0.60 | 0.10 | Hovered border |
| 9 | 0.70 | 0.10 | — pin (solid/anchor) |
| 10 | 0.78 | 0.077 | Muted text |
| 11 | 0.85 | 0.077 | Body text |
| 12 | 0.93 | 0.077 | — pin (headings) |

**Why the border zone (6–8) isn't compared directly against GitHub Primer or IBM Carbon.** Both use a single flat border token (Primer's border-default at L 0.33, Carbon's at L 0.345) rather than a tiered active/border/hover-border structure like this system's. Radix — the only other system with the same tiered architecture — sits at L 0.40–0.50 for its equivalent steps, matching this derivation closely. Comparing a tiered system to a flat one and concluding "too light" mistakes architectural difference for miscalibration. Confirmed by contrast math: Primer's own border-default only achieves 1.55:1 against its canvas, border-muted only 1.24:1 — both well under 3:1. Real systems don't expect subtle borders to be standalone indicators; they're paired with a background shift.

### Chroma behavior in dark mode

Atlassian's changelog explicitly documents reducing saturation for subtle backgrounds in dark mode to reduce eye strain — validating the global 0.85× chroma reduction used in this system (see Chroma curve below). Material Design's guidance to prefer lighter, less saturated tones over fully saturated ones in dark mode reinforces the same principle.

Text steps pass WCAG AAA against step 1 (L 0.18): step 10 at 9.4:1, step 11 at 11.9:1, step 12 at 15.3:1. Also passes AAA against step 2 (L 0.21), a more realistic page background: 8.6:1, 10.5:1, 12.7:1 respectively.

### CSS implementation

```css
:root {
  --color-blue-1: #FBFDFE;
  --color-blue-12: #002F55;
}
.dark, [data-theme="dark"] {
  --color-blue-1: #0C1219;
  --color-blue-12: #D6EBFF;
}
@media (prefers-color-scheme: dark) {
  :root {
    --color-blue-1: #0C1219;
    --color-blue-12: #D6EBFF;
  }
}
```

---

## Neutral scale exception

Applies to grey/neutral scales only, in both light and dark mode. Steps 1–10 use the same standard L values as every other hue (background, border, and anchor zones are about tint progression, not chromatic legibility — no reason to diverge). **Steps 11–12 diverge:**

**Light mode** — replaces the shared 0.36 / 0.30 with:

| Step | L | Hex (C = 0) |
|------|------|------|
| 11 | 0.33 | `#353535` |
| 12 | 0.20 | `#161616` |

Validated against real production systems' darkest heading/body-text neutral: IBM Carbon `text-primary` (L 0.200 — matches step 12 almost exactly), Tailwind `neutral-900`/`slate-900`/`gray-900` (L 0.205–0.210), Material Design 3 neutral tone 10 (L 0.225), Radix `gray-12` (L 0.244), GitHub Primer `fg-default` (L 0.254). Consensus cluster: L 0.20–0.25. The shared chromatic floor (L 0.30) sits notably above this cluster — that floor exists to protect chromatic legibility (near-black desaturates and muddies color), a concern that doesn't apply to a color with no chroma to lose.

**Dark mode** — replaces the shared 0.85 / 0.93 with:

| Step | L | Hex (C = 0) |
|------|------|------|
| 11 | 0.87 | `#D4D4D4` |
| 12 | 0.97 | `#F5F5F5` |

Validated against production systems' lightest heading-text neutral in dark mode: Radix `gray-dark-12` (L 0.949), IBM Carbon `text-01` dark (L 0.967), GitHub Primer `fg-default` dark (L 0.943), Material high-emphasis dark (L 0.925) — cluster L 0.925–0.967, clearly lighter than the shared chromatic dark heading value (L 0.93). Mirrors the light-mode pattern: neutral pushes further toward the extreme than chromatic in both directions. Step 11's L 0.87 has weaker direct support — the only comparable reference found (Radix `gray-dark-11`, L 0.770) sits meaningfully lower — treat it as a reasonable interpolation rather than an independently-validated pin.

Both directions clear WCAG AAA (7:1) by a wide margin against their respective canvas steps.

**Trigger condition:** this exception applies whenever the source is neutral (C ≈ 0) — in explicit grey mode, or in free/anchored mode when a chosen source happens to have zero chroma. It's tied to whether the resulting scale is actually neutral, not to which mode was selected.

**Why the dark alpha base has to move too:** the dark alpha scale's base must be lighter than whatever L target it represents (alpha blending can't produce a result lighter than its own base). With step 12 now at L 0.97, the base must sit above that — see Alpha scales below.

---

## Chroma curve

Chroma scales relative to the source color's C using a factor per step: `C[step] = sourceC × factor[step]`. H stays fixed from the source across all steps, subject to hue-family H nudges (see Hue family rules).

### The curve formula

A single exponent applies to all steps lighter than the anchor — no zone split. Exact formula implemented in `generate.js` → `computeFactor()`; conceptually: `factor` rises from 0.10 at step 1 to 1.00 at the anchor along a `^1.5` curve, then decays `0.93` per step beyond it.

`i` is the 1-based step number; `anchor` is 9 in free mode. **Why a single exponent, not a two-zone split:** a steep-then-flat split (steep for backgrounds, flat for borders) is only well-behaved when the anchor sits above step 5. If the anchor sits at step 5 or lower — a light anchor in anchored mode — every border step falls into the flat zone and over-saturates. A single exponent stays structurally robust regardless of anchor position.

**Background zone C cap:** no step 1–5 should exceed C 0.10 regardless of source chroma — with one anchored-mode exception. The anchor step itself is cap-exempt (verbatim, see Anchored mode), so a vivid anchor landing in or near the background zone used to sit at full source chroma against neighbours flattened at 0.10 — a one-step chroma spike. In anchored mode only, when the effective source chroma exceeds 0.10, the cap tapers linearly toward the anchor: at index distance `dist = |i − anchorIdx| ≤ TAPER_RADIUS` (3), `cap = 0.10 + (effectiveSrcC − 0.10) × (TAPER_RADIUS − dist) / TAPER_RADIUS`, so neighbours ramp toward the anchor instead of stopping at a flat wall (at exactly distance 3 the taper contributes zero). The taper only ever *loosens* the cap, never tightens it, and it modifies only this cap — the indigo/purple/magenta pre-curve ceilings apply to neighbours unchanged. Free and grey mode keep the flat 0.10 unconditionally. Exact implementation in `generate.js` → `backgroundCap()`.

**Dark mode:** apply a global 0.85× reduction on top of the same curve.

### Parameter reference

| Parameter | Value | Controls |
|---|---|---|
| `exponent` | 1.5 | Curve steepness — single value for all light steps |
| `min` | 0.10 | Chroma floor at step 1 |
| `darkDecay` | 0.93 | Chroma retention per step beyond anchor |
| `backgroundCap` | 0.10 | Max C for steps 1–5 |
| `TAPER_RADIUS` | 3 | Anchored mode only: within this index distance of the anchor, the background cap tapers from the anchor's effective source chroma back down to the flat 0.10 (zero contribution at exactly this distance) |
| `darkModeReduction` | 0.85× | Global chroma multiplier, dark mode only |
| `anchor` | Step 9 (L 0.52) | Curve peak — `factor = 1.0` here. **Not necessarily the peak of rendered chroma after gamut clamping — see below.** |

### Anchor ≠ rendered peak chroma — affects every family except indigo/purple/magenta

The anchor is where the *curve* peaks (`factor = 1.0`, full `effectiveSrcC` before clamping) — not guaranteed to be where *rendered, post-clamp* chroma is highest. sRGB's gamut boundary is a different shape at every hue and every L, and at sufficiently high source L and C, clamping can cut harder at the anchor's L (0.52) than at a slightly lighter neighboring step.

**This affects every family with no pre-curve chroma ceiling, not just warm hues.** Tested every family across a full H sweep × 5 source L values (0.45–0.85) × 3 source C values (0.15–0.25), ~500+ combinations total:

| Family | Anchor≠peak rate | Worst loss vs. true peak |
|---|---|---|
| Cyan | 76% | 18.7% |
| Yellow | 66% | 29.4% |
| Green | 55% | 22.3% |
| Orange | 48% | 12.2% |
| Blue | 31% | 12.3% |
| Red | 8% | 6.8% |
| Indigo, Purple, Magenta | 0% | 0% |

**Why indigo/purple/magenta are immune.** These three are the only families with a hardcoded pre-curve chroma ceiling (0.18 / 0.15 / 0.20 — see Hue family rules). That ceiling keeps their chroma well inside the sRGB gamut at every step regardless of L, so they never actually reach the wall that causes this divergence in the first place. Every other family has no such ceiling and can, at high enough source L/C, hit the wall unevenly across steps.

**Practical takeaway:** this isn't a yellow-specific quirk to watch for — it's a property of the curve interacting with gamut geometry for any unceilinged family, and it gets more likely as source L and C both increase. This skill's own validated reference sources (moderate L ~0.5–0.65, C ~0.11–0.19) mostly sit outside the affected zone, which is why the sweep table above matters more than any single reference source's behavior. For any source with L above ~0.65 or C above ~0.20, don't assume step 9 is the most saturated step — check steps 7–9 directly.

**Not "fixed" by chasing a per-hue peak.** Step 9 stays the fixed anchor deliberately — UI roles (solid/badge color) depend on a predictable step number across every hue, not a moving target. For a source that lands in the affected zone, check steps 7–9 rather than assuming step 9 is automatically most vivid.

---

## Gamut clamping

After computing each step, reduce C until RGB is within tolerance of 0–1. Exact implementation in `generate.js` → `isOutOfGamut()` / `clampToGamut()`.

**The ±0.001 tolerance band is load-bearing, not decorative.** A strict `R,G,B ∈ [0,1]` check produces different — slightly lower-chroma — output than the reference tables below, because floating-point channel values commonly land a few ten-thousandths outside `[0,1]` at the exact boundary the curve is aiming for. Verified directly: all four plausible clamp strategies (decrement/bisect × strict/tolerance) tested against all 72 reference steps in this document — decrement+tolerance (as implemented) scores 72/72, the clear best match.

Preserves L and H exactly in the vast majority of cases. One tradeoff of the tolerance: it can accept a step whose RGB sits marginally outside [0,1] by design, and hex conversion then clips those channels. In practice this is a sub-0.001 difference in *linear* channel values — but note that near black the sRGB transfer function has slope 12.92, so a 0.001 linear overshoot corresponds to up to ~3/255 in gamma space (measured worst case 3.29/255 at a dark step). The clipped value is what every reference table pins, so behavior is deterministic; just don't quote the "sub-0.001" figure as an 8-bit gamma-space claim. Most active for deep blues, purples, and high-chroma reds at light steps.

**External reference point: CSS Color 4 gamut mapping.** This clamp is a home-grown member of the same family as the CSS Color Module Level 4 gamut-mapping algorithm (§ "CSS gamut mapping"), which also reduces OKLCH chroma at constant L and H — via binary search with a ΔEOK ≈ 0.02 just-noticeable-difference allowance and local clipping, where this system uses linear decrement with a ±0.001 linear-RGB tolerance. The approaches differ in mechanism and tolerance shape but share the core principle (hue and lightness are preserved; chroma pays the cost), so CSS Color 4 is the spec to consult when evaluating whether a future change to this clamp is principled — with the caveat that any mechanism change alters output and requires regenerating every pinned reference table. Björn Ottosson's closed-form cusp-intersection method is the faster exact alternative if performance ever matters more than table stability.

---

## Core generation modes

### Free mode

Default. Anchor is always step 9. Extract H and C from the source, apply the fixed L scale, run the chroma curve from that anchor, apply hue family rules and the background cap, gamut-clamp, done. Exact implementation in `generate.js` → `generateScale(hex, 'free')`.

### Anchored mode

Used when a brand color must appear verbatim in the scale. Same as free mode, except: the anchor step is whichever step's L is closest to the source's actual L (not always step 9), that step's L is overridden to the exact source L, and the neighboring step at the next-lower index is smoothed to the midpoint — in the light scale that is the immediately *lighter* step; in the dark scale (where lower index means darker) it is the immediately *darker* one. The code smooths `anchorIdx − 1` in both modes; only the light/dark reading of "which neighbor" differs. Exact implementation in `generate.js` → `generateScale(hex, 'anchored')`.

The step-8/9 boundary sits at L 0.555 (midpoint of 0.59 and 0.52); the step-9/10 boundary sits at L 0.47 (midpoint of 0.52 and 0.42). A source landing exactly on one of these midpoints is an edge case worth double-checking which step it actually anchors to — the nearest-step rule doesn't guarantee which side wins a tie.

**The one rule that isn't just "run the curve":** the anchor step reproduces the source exactly — L, C, *and* H all stay at their raw source values, full stop. It is exempt from every downstream cap, ceiling, hue-family nudge, and — in dark mode — the global 0.85× chroma reduction, without exception. Exact implementation in `generate.js`: the anchor-verbatim guard returns the raw source triple directly, before any per-step processing runs, rather than relying on individual rules each remembering to check for the anchor. "Verbatim" is the entire point of anchored mode, and any downstream step that touches the anchor's L, C, or H — cap, ceiling, dark reduction, or hue nudge alike — would silently break that guarantee. A future rule of any kind inherits this exemption automatically; don't enumerate exemptions per rule. The code now matches this design literally: `applyFamilyRules()` contains no anchor special-casing at all — an earlier vestigial `isAnchor` check there, keyed to the *fixed* step 9 rather than the real (possibly migrated) anchored-mode anchor, was removed after a 15,600-scale sweep across every family × mode × ceiling combination confirmed byte-identical output. It was dead code that read like the verbatim mechanism, which it never was; the verbatim guard above is, and always was, the sole protection.

### Anchored mode — dark

Same anchored-mode logic as light, built on the dark L scale instead. One extra input consideration: the dark-mode source is a separate color from the light anchor — brand colors typically have distinct, independently-chosen light and dark anchor hexes, not a mechanical inversion of one from the other. Exact implementation in `generate.js` → `generateScale(hex, 'anchored', { dark: true })`.

**Always verify:** convert every generated step's hex back to OKLCH and confirm its L matches the dark L scale at that index (within ~0.01). Cheap, catches silent drift immediately — do it every time.

**Anchor position migrates between light and dark, sometimes dramatically.** Because the dark L scale is inverted relative to light, the same source hue anchoring at, say, step 10 in light can anchor at step 3 in dark, or vice versa — there's no fixed relationship, it depends entirely on where that specific source's L falls in each scale's own ordering. Don't assume the anchor lands at a similar step number in both modes; always check `scale.anchorIdx` for each mode independently. This is also why `driftTowardReference` uses step-index distance rather than any cross-mode assumption about anchor position (see Advanced technique above).

**The anchor's cap-exemption becomes a liability when it migrates into the background zone — the cap now tapers toward the anchor to soften exactly this.** The anchor is correctly exempt from the background-zone chroma cap (steps 1–5) — that exemption is what makes "verbatim" mean verbatim. But when a color's anchor lands in or near that 1–5 range, a flat 0.10 cap on the neighbors produced a one-step chroma spike: confirmed directly, an anchor at dark step 5 came out with C≈0.21 sitting between a step-4 neighbor capped at C=0.10 and a step-6 neighbor at C≈0.14. Both rules (cap, exemption) are individually correct; the spike was the two interacting. Since the taper (see Chroma curve above — same rule, same radius in dark mode, whose cap zone is also steps 1–5), neighbors within `TAPER_RADIUS` steps of the anchor ramp toward its effective source chroma instead of holding flat at 0.10. The anchor still reads *most* saturated — verbatim outranks everything, and a background-zone step at full brand chroma is still unusual-looking — but the approach to it is now graded rather than a wall. `generateScale()`'s return value still includes `anchorInBackgroundZone` (unchanged: true when `mode === 'anchored' && anchorIdx <= 4`) so the combination can be checked programmatically rather than discovered by looking at the rendered swatches after the fact. If it's true and even the graded result looks wrong, the fix is a different anchor color, not a change to either rule.

### Grey mode

For neutral scales. Constant C throughout, no curve — every step keeps the source's own C. For a true neutral this collapses to C ≈ 0 regardless of the source's own lightness — any pure neutral input produces the same scale shape. See Neutral scale exception above for the steps 11–12 divergence. Exact implementation in `generate.js` → `generateScale(hex, 'grey')`.

**Grey mode has no anchoring mechanism — it will silently overwrite a hand-picked mid-scale value.** If an existing neutral ramp has a specific, deliberately-chosen hex at some step (e.g. a designer picked `#666666` for step 9 by eye), regenerating that ramp through grey mode replaces it with whatever the fixed neutral L scale produces at that step (e.g. `#696969`) — there's no equivalent of anchored mode's verbatim-reproduction guarantee for grey scales. If a specific mid-scale neutral value must be preserved exactly, it needs to be set by hand after generation, not assumed to survive regeneration.

---

## Advanced technique: drift toward a secondary reference

Exact implementation in `generate.js` → `driftTowardReference(scale, referenceHex)`, also available via CLI: `node scripts/generate.js '#1A6FBF' --drift-toward '#8040FF'`. A rare, targeted correction applied on top of an already-generated scale — not a standard generation mode, so it's a separate function rather than a `generateScale()` option.

Distinct from standard anchored-mode generation. The anchor color is confirmed correct and must stay exactly as-is, but the rest of the ramp should lean toward a second reference color at a different hue — common with brand ramps where the anchor was chosen first and a lighter/mid-tone reference surfaces later that should influence the ramp's character without displacing the anchor.

**Do not** average the two colors or re-run generation from the second reference — that would move the anchor. Treat this as a hue-only drift layered on top of a ramp that's already correct in L and C:

```
1. Get OKLCH for both the anchor (already correct, unchanged) and the new reference.
2. cap = reference_H − anchor_H, normalized to [−180, 180]   [total rotation, taking the SHORT way around the hue circle]
3. For each non-anchor step i (0-indexed), by ABSOLUTE step index — NOT distance from the anchor:
     H[i] = anchor_H + cap × (11 − i) / 11
4. Recompute hex from (L[i], C[i], H[i]) for every non-anchor step, using each step's OWN existing L and C — don't touch those. Anchor step keeps its own hue, verbatim.
```

This reaches the reference hue exactly at step 1 (`i=0` gives `H = anchor_H + cap = reference_H`), and passes through the anchor's own hue exactly at step 12 (`i=11` gives `H = anchor_H`) — regardless of where the real anchor actually sits.

**Third formula, not the first — each of the first two fixed one problem and exposed another, confirmed independently each time:**

- **v1, keyed to L-distance from the anchor:** mode-incoherent. Light and dark L-scales are structurally inverted, so the same reference rotated *opposite halves* of the ramp depending on mode — confirmed directly (a reconstructed case produced a flat-then-rising light schedule against a flat-then-falling dark schedule for identical inputs).
- **v2, keyed to unsigned step-index distance (`|i − anchorIdx|`), both sides moving toward the reference symmetrically:** fixed v1's direction problem, but introduced a V-shaped, non-monotonic profile whenever the anchor sat mid-ramp (both sides moving toward the reference from the middle means they move in *opposite directions from each other*), and escalating same-step divergence between light and dark when they anchor at different step indices — which this skill's own docs say is the normal case, not an edge case.
- **v3, keyed to signed step-index distance at a fixed rate (`cap / 11`, independent of anchor position):** fixed both of v2's problems — verified monotonic, verified constant (not escalating) same-step divergence — but broke the one property that actually defines what this function is supposed to do: because the fixed rate only reaches the reference hue anywhere in the ramp when the anchor sits at step 1, an anchor anywhere else meant the function *never got closer to the reference than the anchor's own hue*. Confirmed directly: an anchor 19° from a reference produced a ramp that peaked at the anchor's own hue and never approached the reference at all — a function called "drift toward reference" that didn't drift toward the reference.

**What v1 through v3 have in common, and why v4 (current) doesn't share it:** all three key rotation to the anchor's *position* in some form — distance in L, distance in steps, or a rate derived from that distance. The anchor's position is exactly the thing that differs between light and dark, which is what made the mode-coherence problem hard in the first place. The current formula doesn't reference `anchorIdx` as a distance at all — it's a fixed line in step-index space (reaches the reference at step 1, the anchor's own hue at step 12) that happens to use the anchor's hue and the reference's hue as its two endpoints, but never uses the anchor's *position* to compute anything. Since the schedule depends only on step index and the two hues — both identical across modes — light and dark get the same hue at the same step by construction: confirmed at 0° divergence across all 12 steps on a case that previously diverged by up to 30°, and confirmed that at least one step now genuinely ends up closer to the reference than the anchor's own hue is (the property v3 silently dropped).

**The residual: this schedule's own natural fixed point is always step 12, not wherever the real anchor actually sits.** When the anchor genuinely is at step 12, the verbatim override and the schedule agree already — no seam at all. When the anchor sits elsewhere, forcing that one step back to its verbatim hue creates a single-step spike against the otherwise-smooth schedule. Confirmed to be exactly that — a one-step spike, with every *other* step still following the schedule exactly — not a return of v2's V-shape, which broke monotonicity across half the ramp rather than one isolated point. When light and dark anchor at *different* step indices, this spike is the only place the two modes still diverge — localized to those specific steps, not a whole-ramp shape mismatch.

**The [−180, 180] normalization on `cap` is a separate, independent fix.** A raw `reference_H − anchor_H` subtraction can pick the *long* way around the hue circle for two hues that are numerically far apart but circularly close — e.g. an anchor at H 350° and a reference at H 10° are 20° apart, not 340°, but a raw subtraction gives −340. Caught by testing an edge case adjacent to the main fix, not something the reach/monotonicity/divergence findings alone would have surfaced.

**The anchor exemption from drift is now conditional on mode — it only applies in anchored mode, where it protects a real guarantee.** In free and grey mode, `anchorIdx` is just the curve's structural peak position (step 9 for free mode by default) — nothing is verbatim there, so exempting it from drift protected nothing and only cost mode-coherence for no reason. Confirmed directly on a light-anchored/dark-free scenario (a common real pattern — dark generated from the same source, free mode, no separate brand hex to protect): every single step matched at exactly 0° divergence between light and dark *except* the free-mode side's needlessly-exempted step 9, which alone diverged ~9°, an entirely avoidable, isolated discontinuity. Anchored mode's exemption is unaffected — it still never drifts, because that's the one place "verbatim" is an actual promise this system makes.

**Drift's one parameter belongs in the description, not just the code.** `driftTowardReference()` appends `· drift toward <hex>` to `figmaDescription` and `figmaDescriptionLine` on every step it actually changes (the untouched anchor's description is left alone — drift didn't touch it, so the note doesn't apply). Without this, a drifted ramp's description implied it was fully reproducible from source and mode alone, when the hue at most steps actually depends on a second color that was nowhere in the record.

Run identically for light and dark if both are needed — same function, each mode's own existing L/C per step, each mode's own anchor (which may sit at a very different step index between the two — check `scale.anchorIdx`, don't assume). **Verify by comparing the same step number across modes**, not by comparing steps at equal distance from each mode's own anchor — a semantic token maps the same step number to the same role in both modes, so that's the comparison that actually matters. Expect exact agreement at every step except wherever either mode's anchor sits; a mismatch anywhere else means something is wrong.

---

## Versioned generation options

Three options change the generation math itself. `--peak` and `--ease-hue` are opt-in; luminance-targeted text steps are the default since 2.0.0, and `--oklch-text` turns them off to reproduce a ramp generated before that. The pinned reference tables (`tests/reference-scales.md`) are the default output. `--ease-hue` and `--oklch-text` are project-level versioning decisions (a collection should be entirely on or entirely off); `--peak` is per-ramp by nature, since it exists precisely because different hues want different peak positions — its provenance token is what keeps a mixed collection auditable.

### `--peak <1-12>` (`peakStep`) — chroma-curve peak placement, free mode only

Free mode assumes every hue's vividness peak belongs at step 9 (L 0.52). That assumption is false for naturally-light hues: the sRGB cusp lightness varies by hue (see "Anchor ≠ rendered peak chroma" — the same geometry, acted on instead of only warned about), so a cyan's real chroma ceiling peaks near L 0.7 and a yellow's near L 0.9, and a step-9-peaked ramp renders them muted. Before this option the only escape was anchored mode, which drags in three things a non-brand ramp never asked for: a verbatim guarantee, an L-grid override at the anchor, and midpoint smoothing of its neighbour. The option was admitted after a real palette accumulated **five** non-brand anchored ramps for exactly this reason — anchored mode being used as a peak-placement workaround, polluting provenance with `verbatim` tokens that implied brand mandates that didn't exist.

`--peak N` moves **only the chroma curve's peak** to step N. The fixed L scale is untouched (every step's L stays on the shared grid — the cross-family alignment anchored mode bends is preserved exactly), nothing is verbatim, nothing is smoothed. The peak step inherits the anchored anchor's cap-zone semantics — exemption from the background cap plus the neighbour taper — because it is the ramp's designated vividness maximum and capping it would defeat the option (a yellow peaked at step 4 needs its chroma *there*). `solidForeground` evaluates the peak step, same rationale as anchored mode: measure the ramp's actual vivid representative, not an assumed step number. Provenance appends `peak N` (drift-note principle: not reproducible from source + mode alone); `--peak 9` is the free default and collapses to it, byte-identical, no token. Validation is loud: a peak outside free mode or outside 1–12 throws, per the invalid-mode precedent.

**Anchored-at-grid-L and free-peak are observationally equivalent, deliberately.** An anchored source whose L exactly equals a fixed grid value generates the same 12 hexes as `--peak` at that step (the midpoint smoothing becomes a no-op on the evenly-spaced part of the grid, and verbatim reproduces what the curve would render anyway). The difference is the *contract*: anchored promises the hex verbatim and says so in provenance; peak promises only the curve shape. Use anchored for brand colors that must appear exactly; use `--peak` for palette ramps whose hue simply lives light.

### `--ease-hue` (`easeHueSnaps`) — continuous hue nudges

The default hue-family rules apply the full ±N nudge at every step in the tail, which creates a visible hue snap at the tail's first step (blue: a 4° jump between steps 9 and 10; green/indigo/purple/magenta: between 8 and 9). Yellow never had this problem — its rule was built as a continuous, L-proportional drift from the start, modeled on production ramps (Tailwind's hand-tuned yellow) that drift gradually rather than snapping. This flag generalizes yellow's approach to the other five ruled families: the tail eases linearly from 0 at the last un-nudged step to the full ±N **exactly at step 12**, and red's snap-in/snap-out mid-step rule becomes triangular (−2/−4/−2 across steps 6–8, continuous at both ends).

Two properties are preserved by construction: **step 12 is identical to the discrete schedule** (the ease reaches full N there), and **the family-escape calibration stays valid** — the avoid bounds are governed by maximum rotation, which the eased schedule hits only at step 12; every intermediate step rotates strictly *less* than the discrete schedule, never more. The dark-mode gate holds unchanged (tail starts at step 10; dark step 9 keeps the raw source hue). Yellow and grey are untouched. Steps whose hue the eased schedule actually changed (relative to the discrete default) append `eased hue` to their `figmaDescription` — same provenance principle as drift's note and `luminance-targeted`.

### Luminance-targeted text steps (default; `--oklch-text` / `luminanceText: false` turns it off)

OKLab L is not WCAG luminance, and the mapping is hue-dependent — at identical L, yellow renders far more luminous than blue. This is the root cause of both the documented yellow cross-scale exception and the residual hue-to-hue contrast variation at the text steps. Generation fixes the text steps' **Y** instead of their OKLab L: for steps 10–12, L is solved per hue (bisection through the exact same C/H rule path, including yellow's L-dependent drift and gamut clamping) so the rendered color's WCAG relative luminance equals the achromatic color's at the standard L values. The documented contrast ratios then hold across hues — measured on six hues against white (violet, green, blue, yellow, red, teal), the spread at step 10 drops from 1.41 to 0.10 of a ratio point, and step 12 on step 2 reads 12.8–12.9:1 for every one of them. The residual is 8-bit rounding and gamut clamping, not the schedule.

The targets use the standard (non-overridden) L tables, so the guaranteed ratios are exactly the ones the Contrast section documents. Boundaries: the **verbatim anchor is exempt** — anchored mode's guarantee outranks this flag, so an anchored source whose own L lands in the text zone stays verbatim and still gets `contrastWarning` (the two features are complementary, not redundant). When anchored-mode midpoint smoothing touches a text step, targeting overrides the smoothing — uniform text contrast outranks it. Grey/neutral scales are untouched (they already sit on the achromatic targets by construction, and the neutral exception's deliberate darker text values are preserved). Targeted steps append `luminance-targeted` to their `figmaDescription`, following the same principle as drift's note: any parameter that shaped a value beyond source + mode must appear in the record.

It is the default because it is the principled resolution of two documented limitations at once — the yellow cross-scale caveat and the anchored text-zone AAA gap (for the *non-anchor* text steps; the anchor case is warned, as above). The cost is that OKLab L is no longer constant across hues at steps 10–12, which is exactly the trade Radix makes with per-hue tuning and Material makes structurally with HCT's tone axis (plain CIE L*, a luminance measure). It was opt-in until 2.0.0; the default is the correct schedule, and a ramp made before 2.0.0 is reproduced with `--oklch-text`. Step 9, the solid, stays on the fixed L: moving it per hue would move the ramp's vividness peak, and its white-text contrast is measured and reported as `solidForeground` instead.

---

## Parameter recovery

Given an existing 12-step ramp (12 hex values, no other information), `recover.js` searches for the mode, source hex, anchor position, ceiling setting, and — since 1.5.0 — the `--peak` step that reproduce it — and, since 2.0.0, which text schedule it is on: both are tried, and a ramp generated before 2.0.0 comes back with `oklchText: true`, the flag that regenerates it. The reverse operation of `generate.js`.

**Peak ramps are identified via the observed chroma argmax, seeded entirely from that step.** A `--peak` ramp's maximum is observable (the step rendering the highest chroma), but only within one step: gamut clamping can shave the true peak harder than its neighbour, so the argmax and both neighbours are tried as candidate peaks. All three seeds read from the argmax step, deliberately — a first draft seeded from the candidate peak step and hit three real failures on one amber ramp: the peak step's fixed L could not *encode* the true source chroma at all (which is exactly why the rendered maximum had moved off it), the hue seed missed the yellow-drift zero-point, and the chroma seed needed the curve factor unwound (`C_argmax / computeFactor(argmax, candidate)`). The seeding comment in `recover.js` records all three. When an anchored-at-grid-L parameterization and a free-peak one both reproduce a ramp exactly (see the equivalence note under `--peak`), recovery prefers the peak reading — the weaker claim — because its candidates run first and ties don't displace them. Round-trip: five real peak ramps (peaks 4–7, yellow through cyan families) all recover with the exact mode, peak and sub-0.5/255 error; plain free and genuinely anchored ramps are unaffected.

```
node scripts/recover.js '#FDFDFD' '#F8F8F8' '#EEEEEE' ... (12 hex values)
node scripts/recover.js --dark '#0C1219' ... (search against the dark L scale instead)
```

Output: best-fit mode, recovered source hex, anchor step (if anchored), ceiling setting, and mean/max per-channel sRGB error (0–255 scale) against the target.

**Why this exists rather than guessing.** Re-sourcing or auditing an existing ramp without it means guessing at mode and source — and the guess fails in a specific, recurring way: assuming free mode when a ramp is actually anchored. Free mode never reproduces any step verbatim (L is always overridden from the fixed scale), so a ramp with one suspiciously "clean" step relative to a plausible source almost always means anchored mode, not free — but that's easy to miss without deliberately checking for it.

**Verified against known ground truth, not just "it runs":** 8/8 correct mode identification on hand-picked cases (including yellow in both modes, and dark mode), 34/36 on a 36-case sweep across all 9 families in both modes, worst-case reconstruction error under 1 unit of 255 even on the two misses.

**A real bug surfaced while building this, worth knowing about if extending the tool.** Yellow's continuous hue drift depends on the *source's own L* internally (`yellowDrift(srcL, srcH, L)`), even though free mode discards L from the generated scale's own values. Reading only a target step's resulting H isn't enough to invert this — a naive local search around that H missed the true source by 10+ degrees for a yellow ramp and misidentified it as anchored mode. The fix: since the base drift doesn't depend on `srcH`, `impliedDrift = clamp(70 × (L_guess − anchorL), −45, 45)` can be computed directly from a guessed source L and inverted to get an exact candidate hue rather than hoping a narrow perturbation search finds it. Since `yellowHueScale` (1.4.0), the relationship is `observedH = srcH − impliedDrift × yellowHueScale(srcH)` — piecewise linear in `srcH`, so the inversion solves each of the three regions (full drift, taper, hold) and keeps the solutions the authoritative `yellowHueScale()` confirms are self-consistent, which also makes a future edit to the scale's constants break the recovery loudly instead of silently diverging. A second, related trap: step 9's observed chroma is the natural source-C guess (the curve factor is 1.0 there), but a vivid source's step 9 can be gamut-crushed — a lime at C 0.190 renders step 9 at C 0.125, and every candidate seeded from that lands 3+/255 off with no way for the refine grid to bridge the gap. Steps 5–7 sit at wider-gamut lightness where `C_i / computeFactor(i, 8)` recovers the true source chroma almost exactly (measured 0.1902/0.1904/0.1892 against a true 0.190), so the median of those three is added as a second chroma candidate whenever it meaningfully exceeds the step-9 estimate.

**Known, accepted limitation:** orange and cyan have no hue-nudge rule at the anchor (see Hue family rules below), so free mode and "anchored with the anchor at step 9" are structurally near-identical at that one step — occasional mode misidentification for these two families specifically is expected, and low-cost (sub-1-unit reconstruction error either way, so the *recovered parameters still reproduce the ramp accurately* even when the mode label is wrong).

**Grey mode is searched too, and tried first — it's the cheapest branch to test.** An earlier version of this tool didn't search grey mode at all, so a genuinely achromatic ramp came back misidentified as anchored, with a wrong source and a nonzero error, when an exact grey-mode fit existed. Any step's own OKLCH works as the grey candidate source, since a real grey ramp holds the same C at every step by construction.

**The anchored-mode invariant is enforced, not just hoped for.** By definition, an anchored candidate's source must equal the target's own value at the claimed anchor step — "verbatim" is the whole point of anchored mode (see the anchor exemption above). An earlier version of this tool could return a result claiming anchored mode where the recovered source didn't actually match the target at its own anchor step, with no indication anything was wrong — the reported error just looked like an ordinary imperfect fit. This happens specifically when a ramp had drift (or another manual adjustment) applied on top of generation. The tool checks this explicitly: `recoverParameters()` filters out anchored candidates that fail `source === target[anchorIdx]` before picking a result, and if the true best-error candidate had to be rejected for this reason, the returned object carries a `warning` field saying so. For anything drift can't explain (a genuine non-drift manual edit, for instance), that warning is still the honest answer — see below for the case it no longer needs to be.

**Drift is now recovered, not just detected — for the case that reliably triggers it.** The current drift formula (`H[i] = anchorH + cap × (11−i) / 11`) has exactly one free parameter and inverts in closed form: `cap = (H[i] − anchorH) × 11 / (11 − i)` for any non-anchor, non-last-index step. For every anchored candidate whose raw fit isn't already excellent, the tool now solves for `cap` at every eligible step, takes the median (steps with target chroma below 0.03 are skipped — hue is numerically unstable that close to the achromatic center, small measurement noise swings it wildly), reconstructs the implied reference hue, applies `driftTowardReference`, and re-scores. If that beats the raw candidate, it's reported — as `driftedToward`, **a hex string that `driftTowardReference()` accepts directly**, so a recovered result feeds straight back into the generator with no conversion step. The raw numeric hue is available alongside it as `driftedTowardHue` for reporting and diffing. These are two fields for a reason: `driftedToward` was a bare hue *number* for one release, which looked usable but threw (`hex.replace is not a function`) the instant anyone round-tripped it — recovery output that can't reproduce what it just recovered is worse than no output, because it reads as authoritative. **The CLI prints both**, which it did not for that same release: a drifted ramp recovers at mean and max error 0, so omitting the reference meant the documented entry point reported a *perfect* score for parameters that regenerate a visibly different ramp. A zero-error result gives the reader no reason to look further, which makes that omission more dangerous than a poor fit would be. Anything the API recovers that is needed to reproduce the ramp must appear in the CLI output. Verified on a reconstructed case that previously returned `free · wrong source · error 5.86` with a rejection warning: now returns `anchored · exact true source · error 0 · driftedToward ≈ 305.9°` (true reference was 306.02°). A broader sweep (100 random anchor/reference pairs) recovers the exact source 89% of the time, with the remainder still correctly identifying source and mode but landing a small residual error (1–2 out of 255) rather than failing outright — an honest, mostly-solved case, not a perfect one. **Drift recovery is anchored-only, structurally.** The closed-form inversion needs a known-exact anchor hue to solve `cap` against, and it takes that from the target's own value at the anchor step — trustworthy only because anchored mode reproduces the source verbatim there. Free mode has no verbatim step at all (L is always overridden from the fixed scale), so there is no exact hue to invert against, and the free-mode source search is itself confounded by the very rotation being recovered. A drifted *free* ramp therefore does not come back with a reference — but it must still fail loudly, via the poor-fit warning, rather than returning a confident wrong source the way drifted anchored ramps once did. There's a regression test asserting exactly that, so the limitation stays visible instead of being rediscovered.

What still can't be recovered: anything that isn't this specific drift schedule — a genuine one-off manual recolor of a single step, for instance, correctly still returns the invariant-violation warning rather than a false confident answer.

**The CLI surfaces the warning too — it didn't, for one release.** The `warning` field above was computed by `recoverParameters()` from the start, but the CLI's `main()` built its own, separate output object listing only `mode`/`source`/`anchorIdx`/etc. and simply never included `warning` — so the exact scenario the warning exists to surface loudly was invisible from the documented entry point (this document treats the CLI as the primary way to use the tool). Fixed: `node scripts/recover.js`'s output includes `warning` whenever the API sets it.

**A general poor-fit threshold exists too, independent of the invariant check.** Even when no anchored candidate had to be rejected for violating its own definition, a high error (mean > 3 or max > 20, out of 255) still means the ramp isn't well-explained by anything the search tried — usually a manual adjustment recovery has no model for (like the single-step manual recolor above), just one that didn't happen to produce an invalid-anchored candidate specifically. The CLI surfaces this as a `warning` too, distinct in wording from the invariant-violation case. A clean, undrifted ramp gets no warning at all.

**The API and CLI used different names for the same values — both now work from the API result directly.** `recoverParameters()` historically returned `hex`, `err.mean`, `err.max`; the CLI's `main()` presented the same values as `source`, `meanError`, `maxError` for readability. Code written against one didn't read the other. Rather than rename either (risking anything already written against the original names), the API result now also carries `source`, `meanError`, and `maxError` as additive aliases alongside the originals — both conventions work without needing to know which one a given piece of code expects.

---

## Hue family rules

11 rules total. Each exists for one of two reasons: sRGB gamut geometry, or documented perceptual hue drift at extreme lightness.

### Family detection

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

Detection: `H = ((H % 360) + 360) % 360`. This is a clean, non-overlapping partition of the full circle — every degree 0–359 belongs to exactly one family. Two of these families go by other names in some brand contexts: indigo is sometimes called "iris" or "periwinkle," magenta is sometimes called "pink." Same H range, same rules — these are naming aliases, not separate families.

**The Avoid column is derived, not stylistic.** Each bound is calibrated against that family's own hue nudge so the nudge cannot push a step out of the family it is defined for. Green is the worked example: band 130–170, nudge +4° at steps 9–12, so a source above ~166 lands its dark steps at 170+, which is cyan. The bound of 165 sits one degree below the measured eject point of 166.02. **Direction matters** — families nudging positive (green, magenta) are at risk at the *top* of their band, families nudging negative (blue, indigo, purple, red) at the *bottom*.

Four bounds were miscalibrated for several releases, all permitting sources whose own nudge then ejected steps into a neighbour. Corrected, with measured eject points in brackets: magenta `358 → 356` (ejects into red past 357.0, wrapping through 360), blue `222 → 225` (into cyan below 223.9), indigo `272 → 274` (into blue below 273.0), purple `302 → 303` (into indigo below 302.0). Only the magenta case was found by inspection; the other three surfaced once the invariant was asserted against behaviour in both directions rather than checked one-sidedly. Bounds are measured against **actual post-gamut-clamp source hue**, not the requested hue — clamping shifts a requested hue by a degree or more, enough that arithmetic on nominal band edges gives the wrong answer.

**`generateScale()` now warns rather than leaving this to a table lookup.** The avoid ranges were documented here but never surfaced at generation time, so the only way to catch a bad source was to consciously look it up first — `detectFamily()` would return `green` for a source at H 169.95 and generation would run without complaint while the +4 nudge quietly pushed steps 9–12 into cyan. Two fields, answering different questions:

- **`sourceHueWarning`** — advisory. The source sits outside the documented safe range for its family. May be deliberate.
- **`familyEscapeWarning`** — factual. Steps in *this* generated scale actually resolved to a different family, named individually. Measured from the output, not predicted from the table.

A source can trip the advisory without the factual one, because the bounds are conservative by design, which is why the second isn't inferred from the first. **Yellow's exemption from `familyEscapeWarning` covers the warm dark-tail drift — orange *and* red — not every possible escape.** Its continuous drift crosses into orange by design at the dark end, and this document's own reference yellow (`#CA8A04`) puts steps 8–12 at H 69.5 down to 49.2 — warning about that would flag the reference implementation as broken.

**Why red is in the exemption, and why that isn't a widening.** What is exempted is a *rotation*, not a destination: `70 × (L_step − L_src)` capped at 45°, negative for every step darker than the source, running through orange (H 40–70) and into red (H 0–40) without changing character. Naming only orange made the exemption's correctness accidental — it held solely because `#CA8A04` stops at **H 40.79** in dark mode, 0.79° short of the boundary. Amber `#FFC330`, a real production ramp, lands its dark steps 1–2 at **H 39.16/39.42** by the identical mechanism and was warned about the behaviour the rule exists to produce. Those steps render `#190F0C` and `#23140F` — near-black at L 0.18/0.21, where the family label carries almost no meaning. **Direction keeps the exemption narrow, and it is already implicit:** steps *lighter* than the source rotate the other way, so the green escape below is untouched.

The exemption was written unconditionally at first, which hid a different, undocumented case: the same continuous-drift formula pushes *light* steps toward higher hue for a source near yellow's own upper boundary, escaping into **green** rather than orange — a structurally different symptom nobody explicitly validated the way the dark-tail drift was. Originally confirmed on this skill's own reference lime (`#A0C800`), whose steps 1–5 resolved to green under the pre-1.4.0 full drift; since `yellowHueScale` (see Yellow below) lime-region sources hold their hue and `#A0C800` no longer escapes at all, so the case that still exercises this is a mid-band source (e.g. `#6D6700`, H 105.6) whose near-full drift still pushes light steps into green. Only escapes along the warm drift's own path are exempt; a green escape (or anything else) still surfaces normally, the same as it would for any other family.

### Universal rules

**Gamut clamping** — all steps, all hues (see above).

**Background zone C cap** — steps 1–5, all hues: `C = min(C, 0.10)` (in anchored mode, does not apply to the anchor step itself, and tapers up toward a nearby anchor's effective source chroma within `TAPER_RADIUS` steps — see Chroma curve and Anchored mode above).

**Dark mode gates the step-9 nudges to steps 10–12.** In dark mode, `applyFamilyRules()` runs with `beyondAnchorOnly`, which restricts each family's hue nudge to steps strictly beyond the fixed curve anchor (step 9) — the rationale in the code is avoiding a double hue shift at the step the light-mode rules already treat as the hue's home. Concretely: a family documented below as "steps 9–12" (indigo, purple, green, magenta) nudges only steps 10–12 in dark mode, and dark step 9 keeps the raw source hue (verified: dark green step 9 stays at H 155.05 while light step 9 gets 159.05). Blue is unaffected because its rule already starts at step 10 — which is why the blue dark reference table looks identical in shape to light. Red's mid-step nudge (steps 6–8) and yellow's continuous drift apply in both modes unchanged. The per-family rules below state the light-mode step ranges.

### Blue
Dark steps drift toward indigo perceptually. Steps 10–12: nudge H −4°.

### Indigo
Narrow sRGB gamut. Dark steps drift toward plain dark blue.
- Apply chroma ceiling before curve: `effectiveSrcC = min(srcC, 0.18)` (in anchored mode, does not apply to the anchor step itself — see Anchored mode above)
- No-ceiling modifier available: skips the ceiling, relies on gamut clamp only. Risk: flat spot if a step hits the sRGB wall.
- Steps 9–12: nudge H −3°

### Purple
Most gamut-constrained range. Dark steps drift toward magenta or indigo.
- Apply chroma ceiling before curve: `effectiveSrcC = min(srcC, 0.15)` (in anchored mode, does not apply to the anchor step itself — see Anchored mode above)
- No-ceiling modifier available. Same risk as indigo.
- Steps 9–12: nudge H −2°

### Red
High-chroma reds drift toward orange at mid-light steps. Steps 6–8: nudge H −4°.

### Orange
No perceptual rules beyond universal. Choose source at H 48–62.

### Yellow

Severe dark-step drift toward olive and brown if hue is held flat — a flat hue combined with the standard chroma curve passes through an olive/khaki dead zone at mid-lightness (roughly steps 6–8) before ever reaching the dark steps.

Nudge hue continuously across **every** step (not just the dark tail), proportional to how far that step's L has moved from the source's own L — mirroring how production yellow scales (e.g. Tailwind's hand-tuned yellow ramp) drift hue gradually across the whole ramp rather than holding flat then snapping at the end. Exact implementation in `generate.js` → `yellowDrift()`.

- `rate = 70` — degrees of rotation per unit of L moved from the source. Calibrated against Tailwind's published yellow OKLCH values.
- `cap = 45` — maximum total rotation either direction, regardless of how far L travels. Prevents a very light source (anchor sitting high, e.g. step 4–5 in anchored mode) from over-rotating into orange/red territory at the dark end.
- **The drift is scaled by source hue — full strength at H ≤ 105, fading linearly to zero at H ≥ 125 — so lime-region sources hold their hue instead of rotating toward orange.** Exact implementation in `generate.js` → `yellowHueScale()` (`YELLOW_DRIFT_FULL_H = 105`, `YELLOW_DRIFT_ZERO_H = 125`). The drift-toward-orange consensus this rule encodes is a *yellow/amber* behavior, not a lime one: Radix's hand-tuned lime holds H 119–129 across all 12 steps while the same team drifts its amber from H 98 to 54, and Google's `material-color-utilities` ships a `DislikeAnalyzer` defining dark yellow-green (CAM16 hue 90–111, chroma > 16, tone < 65) as universally disliked — the exact zone a fully-drifted lime's dark steps land in, and no studied system rotates a lime toward orange (see the yellow-in-color-scale-generators research guide). The band edges mirror Material's own `isYellow` band (105–125); the fade is linear rather than a hard cutover so two near-identical sources straddling a boundary can't produce structurally different ramps. Sources at H ≤ 105 (every true yellow and amber, including this document's reference yellow) are byte-identical to pre-scaling output.
- Applies in both free mode (anchor fixed at step 9) and anchored mode (anchor wherever source L lands) — always uses the actual source L/H, not the fixed-table values at the anchor step.
- The anchor step itself drifts too (unlike every other family, where the anchor stays fixed at the source hue) — a direct consequence of applying drift proportionally across all 12 steps rather than only beyond the anchor.

Cross-scale consistency note: since 2.0.0 the text steps are luminance-targeted, so text-on-background pairings read alike for yellow and every other hue; with `--oklch-text` they do not — verify manually. Also see "Anchor ≠ rendered peak chroma" above — yellow-family sources typically peak in rendered chroma around step 7–8, not step 9.

**Cross-family collision check — required for yellow sources with H below 96.** Systematically swept (1,620 synthetic sources, H 72–128 × C 0.10–0.20 × L 0.40–0.85, free and anchored mode) diffing steps 9–12 against the project's actual orange scale (`#E07000`) at the same steps. Collision rate (H within 3° of orange at any of steps 9–12) by source H, holding rate/cap at their defaults:

| Source H | Collision rate |
|---|---|
| 72–84 | 46–50% |
| 88 | 32% |
| 90 | 22% |
| 92 | 9% |
| 94 | 1% |
| ≥96 | 0% |

The risk isn't confined to the low edge of the family boundary — it persists deep into what this skill recommends as a clean yellow source range (75–115), with roughly half of sources in H 75–84 colliding at default settings. **For any yellow source with H < 96, run the collision check; don't assume "H is inside the recommended range" is sufficient.** After generating, diff steps 9–12 against the project's orange scale. If they collide or sit within a few degrees, don't patch the single colliding step in isolation — that creates a visible kink. Instead reduce the rate for the whole affected tail (steps 9–12) uniformly (a rate around 58 typically restores several degrees of separation for a borderline source) and recompute those steps together, keeping L and C exactly as generated and only adjusting H.

**No single global rate eliminates the collision risk.** Swept rate values 20–70 against the H 72–95 collision zone: even `rate=20` — far too flat to still serve the rule's purpose of avoiding the olive dead-zone — only reduces collision to 10.6%, not zero. There's no rate that both eliminates orange-collision risk for low-H yellow sources and corrects the olive drift the rule exists to fix. The per-source check-and-adjust approach above is the actual fix, not a missing default value.

### Green
Dark steps drift toward olive. Steps 9–12: nudge H +4°.

### Cyan
No perceptual rules. Appears perceptually brighter at high lightness — acceptable, not a defect.

### Magenta
Dark steps drift toward dark red or dark purple.
- Apply chroma ceiling before curve: `effectiveSrcC = min(srcC, 0.20)` (in anchored mode, does not apply to the anchor step itself — see Anchored mode above)
- No-ceiling modifier available.
- Steps 9–12: nudge H +3° toward stable magenta centre (H 340)

---

## Picking a good source color from scratch

Three things determine whether a source color produces a clean scale. (For recommended H range per family, see Family detection above.)

**Lightness — L 0.45–0.75.** Anchors the source near the perceptual midpoint, keeping both ends of the scale expressive. Too light (L > 0.80) and dark steps become muted; too dark (L < 0.40) and light steps wash out. Lighter hues like lime and yellow naturally sit higher — that's fine.

**Chroma — C 0.10–0.20.** Gives vivid mid steps without heavy gamut clamping at the light end. Below 0.08 the scale looks desaturated — use grey mode instead. Above 0.22, expect some flattening at steps 1–4. Indigo and purple are exceptions: their sRGB gamut caps them at 0.18 and 0.15 regardless. **This range is per-color and hue-blind — do not apply it across a palette; see Calibrating a multi-ramp palette below.**

**Hue — at least 8° inside the family boundary.** Colors near a boundary inherit characteristics of both adjacent families and the H-nudge rules may not apply correctly. If a color reads ambiguously — like an orange-red — the scale will too.

**Quick check:** paste the hex into [oklch.com](https://oklch.com) and verify L, C, H before generating. If it looks like the right color at a natural saturation and brightness, it will produce a good scale.

**Reference sources (all validated):**

| Color | Hex | L | C | H |
|---|---|---|---|---|
| Blue | `#1A6FBF` | 0.54 | 0.147 | 251.9 |
| Green | `#109858` | 0.60 | 0.144 | 155.0 |
| Red | `#B91C1C` | 0.51 | 0.190 | 27.5 |
| Violet | `#97287C` | 0.48 | 0.172 | 339.5 |
| Yellow | `#CA8A04` | 0.68 | 0.142 | 75.8 |
| Lime | `#A0C800` | 0.78 | 0.190 | 122.9 |
| Teal | `#12A594` | 0.65 | 0.114 | 182.0 |
| Orange | `#E07000` | 0.66 | 0.168 | 53.2 |

### Calibrating a multi-ramp palette

Everything above picks **one** source. Picking several that read as peers is a different problem, and the rule above is the wrong tool for it: C 0.10–0.20 is stated without reference to hue, while sRGB's chroma headroom varies by more than 2× across the circle. Measured at the solid step's lightness (L 0.52): yellow tops out near 0.11, green near 0.15, magenta near 0.24. So C 0.15 is 95% of what a green can do and only 62% of what a magenta can — two ramps at an identical number are not at comparable saturation, and one number chosen to fit all three is chosen to fit the weakest.

**Peers means the same fraction of each hue's own ceiling, not the same chroma.** This is what the systems this skill benchmarks against actually ship: nobody mutes their magenta to match their yellow. Radix's hand-tuned ramps sit at very different chroma per hue, and so do Tailwind's.

Three functions, all exported from `generate.js`:

- **`maxChromaAt(L, H)`** — highest in-gamut chroma at that lightness and hue. Implemented as the file's own `clampToGamut` walked down from above any real ceiling, so it agrees with what the generator will render rather than approximating it separately.
- **`usableChromaAt(L, H, noCeiling)`** — the same, but bounded by the family's pre-curve ceiling where one binds first (indigo 0.18, purple 0.15, magenta 0.20). This is the denominator saturation is measured against. Using sRGB's raw ceiling for a magenta reports a fraction the generator will never render, which makes every magenta look under-saturated against its own number.
- **`sourceAtSaturation(hex, saturation, noCeiling)`** — re-chroma a source to a fraction of that headroom, keeping its L and H. Returns a hex.

On the CLI, `--saturation <0-1>` applies it to the source before generation:

```
node scripts/generate.js '#448252' --saturation 0.95     # green at 95% of its own ceiling
node scripts/generate.js '#CB50B9' --saturation 0.95     # magenta at 95% of its own ceiling
```

Run the same fraction across every ramp in the palette and they come out as peers. 0.95 is a reasonable default for accent ramps; drop it for supporting colors that should sit back.

**No provenance token, deliberately** — unlike `--peak`. Saturation shapes the *source*, not the curve, and the source it resolves to is what gets recorded, so `source + mode` still reproduces the ramp exactly. `--peak` needs a token precisely because it changes curve shape while leaving the source unchanged. The test for whether a future flag needs one is that question, not whether it was passed.

**What this does not fix.** Equalising the fraction does not equalise appearance at every step — steps 1–2 and 10–12 still diverge, because gamut headroom varies by hue at the extremes too (see the cross-hue chroma disparity entry under Tested and characterized). Nor does it help a hue whose ceiling is genuinely low where you need it: a yellow's solid step is gamut-bound near C 0.11 regardless of source, so a yellow badge will read as mustard beside a vivid magenta one no matter what fraction you ask for. That is sRGB, not a calibration failure, and `--peak` is the lever for it — it moves the yellow's vividness to a lightness where the yellow actually has room.

*Admitted 2026-08-16, after a real three-ramp palette was normalised by holding chroma constant across yellow, green and magenta. Every ramp came back visibly flat, because the shared number was the yellow's ceiling and the magenta lost ~40% of its chroma to reach it. The advice above existed nowhere; the C 0.10–0.20 range read as if it applied, and following it produced exactly this. The repair had to be derived by hand, including a gamut-ceiling search the skill did not expose.*

---

## Contrast

**Contrast is emitted as data, not just prose.** Every generated step carries `contrastVsWhite` and `contrastVsCanvas` (WCAG 2 ratio to 2 decimals; canvas is the scale's own step 1), and the text steps (10–12) additionally carry `apcaVsWhite` / `apcaVsCanvas` — APCA Lc values (0.0.98G-4g constants, implementation validated against the published `#888888`-on-white = 63.06 check value). The APCA fields are **informational only**: APCA is the draft contrast model for WCAG 3 and is known to predict perceived contrast better than the WCAG 2 ratio for light-on-dark polarity (exactly where the dark scale lives), but it is pre-standard and its constants have shifted between releases — so nothing in this system warns or gates on it. Sign convention is APCA's own: positive for dark-text-on-light, negative for light-on-dark; rough current-draft reading: |Lc| ≥ 75 body text, ≥ 60 large text, ≥ 45 headlines. `contrastWarning` (below) reads the same annotated fields it quotes, so the warning and the emitted data can never disagree. `driftTowardReference()` recomputes all of these after rebuilding steps — rotating hue at fixed L/C can move a ratio at the second decimal, so annotations are never carried over stale.

**`contrastDriftWarning` — drift at the steps OKLCH L still places.** Steps 1–9 keep the fixed L grid, and OKLCH L is not luminance, so a saturated step can land on the other side of 3:1 or 4.5:1 from a neutral at the same L. Measured across six hues, step 8 against white spans 3.85–4.50:1, either side of 4.5. The scale names every step 1–9 whose ratio against white (light) or step 1 (dark) is on the other side of either threshold from a neutral at its L, with both ratios. It reports rather than corrects, because matching these steps' luminance would darken vivid greens and yellows at their most vivid steps; Material's HCT makes that trade, this skill does not. The comparison uses raw ratios: `contrastVsWhite` is rounded to two decimals, and a red step 8 there reads `4.5` at 4.496:1, which fails.

**`solidForeground` — the foreground-on-solid rule, measured instead of remembered.** The scale object carries a recommendation for text on the solid step: `{ step, recommend: 'light'|'dark', vsWhite, vsDarkText, apcaRecommend, apcaVsWhite, apcaVsDarkText, darkTextHex }`. It computes the actual WCAG ratio of both candidate foregrounds — white, and the scale's own dark end (step 12 in light mode, step 1 in dark) — against the solid step's real hex, and recommends whichever wins. The solid step is the anchor in anchored mode (per the Text usage rule's own instruction: check the anchor's actual L, not an assumed step number) and step 9 otherwise. This generalizes the yellow-family prose rule to every hue: a free-mode yellow at the fixed step-9 L correctly still recommends light text (5.69:1 beats its dark end), while a vivid brand yellow anchored at L 0.87 flips to dark (9.42:1 vs 1.48:1) — the threshold behavior the prose describes, derived from measurement rather than a remembered L cutoff.

**Both contrast models are reported because they answer different questions, and they can disagree exactly where this field matters most.** `recommend` is WCAG 2-derived and stays the primary field: WCAG 2 is the normative standard audits are run against. `apcaRecommend` (with the signed `apcaVsWhite`/`apcaVsDarkText` Lc values, larger magnitude wins) is the parallel APCA verdict, carried because WCAG 2's formula is documented — by the maintainers of Radix Colors, who design their yellow/amber solid steps against APCA and switch to dark text below |Lc| 40 — to mispredict perceived contrast for yellow and orange hues. When the two agree (the common case, including every validated reference source), read either. When they disagree on a yellow-family solid, APCA is the better predictor of what a person can actually read, and WCAG 2 remains what a compliance audit will measure — state both to whoever owns the decision rather than silently picking one.

All text steps pass WCAG AAA (7:1) in light mode:

| Foreground | Background | Contrast | Guarantee |
|---|---|---|---|
| Step 12 (L 0.30) | White | 13.6:1 | AAA |
| Step 12 (L 0.30) | Step 1 | 13.3:1 | AAA |
| Step 11 (L 0.36) | White | 10.9:1 | AAA |
| Step 11 (L 0.36) | Step 1 | 10.6:1 | AAA |
| Step 10 (L 0.42) | White | 8.5:1 | AAA |
| Step 10 (L 0.42) | Step 1 | 8.3:1 | AAA |

Dark mode text steps against step 1 (L 0.18): step 10 at 9.4:1, step 11 at 11.9:1, step 12 at 15.3:1 — all AAA (see Chroma behavior in dark mode above for the full derivation).

**The AAA guarantee holds by construction only where the fixed L scale actually applies — anchored mode can break it, and generation now measures rather than assumes.** Anchored mode overrides the anchor step's L with the source's own L. When the source's L lands in the text zone (roughly L 0.44–0.47 anchors at step 10; lower L anchors at 11–12), that text step is lifted above its fixed value, and for high-luminance hues (yellow, green, olive) the ratio against white drops below 7:1 — measured down to 6.68:1 at `oklch(0.465 0.13 120)`. Free and grey mode hold (a full-hue sweep's worst text-step ratio measured 7.82:1). Because OKLab L is not WCAG luminance — the mapping is hue-dependent — an anchor's contrast can't be predicted from its L, so `generateScale()` computes actual WCAG ratios at steps 10–12 against white and step 1 (light) or step 1 (dark) and returns two fields when relevant: **`anchorInTextZone`** (structural: `mode === 'anchored' && anchorIdx >= 9`, the mirror of `anchorInBackgroundZone`) and **`contrastWarning`** (measured: names each failing step and its ratio). Like `familyEscapeWarning`, the warning is computed from the generated output, not predicted from the tables, and `--table` output surfaces it. The fix, when it fires, is a source with L further from the text-step range — or a deliberate acceptance of AA-level contrast at the named steps.

**Safe cross-scale combinations.** The text steps are luminance-targeted, so same-step pairings produce the same contrast across hues: step 12 on step 2 measures 12.8–12.9:1 for blue, red, green and yellow alike — all AAA. On `--oklch-text` ramps it varies by hue (12.6–13.4:1 on the same set); verify those manually.

---

## Alpha scales

A parallel set of 12 transparent steps for any solid scale — useful for overlays, shadows, and surfaces that need to sit on top of other colors without visually baking the background in.

**When to use:** any scale, neutral or chromatic. A single base color only works exactly for neutral (C = 0) scales — see "Chromatic alpha scales" below for why, and the per-step method required for anything with chroma.

**When to skip:** if the UI has a fixed white background throughout, the solid scale is simpler and sufficient. Alpha variants only add value when surfaces need to layer on top of backgrounds of varying or unknown color.

**Blend in sRGB channel space, not OKLab L, and use the quantized 8-bit hex value — not the idealized continuous OKLCH conversion.** Alpha compositing (Figma, CSS, browsers generally) interpolates raw sRGB channels, not perceptually-uniform L, so solving with L directly gives a visibly wrong result. Less obviously: the actual base and target *tokens* are 8-bit hex values (e.g. `#161616`), and their true sRGB fraction (`0x16/255 = 0.08627`) differs slightly from what the same OKLCH triple converts to at full floating-point precision (`0.08610`) — a small but real difference that changes every downstream alpha value by a few ten-thousandths. Round both base and target to their 8-bit hex first, then solve for alpha — this is what every reference table below actually uses, and what makes them exactly reproducible.

### Neutral alpha scale — light

A single near-black base (`oklch(0.20 0.00 0)` → `#161616`) held constant, alpha varying per step. Exact implementation in `generate.js` → `generateNeutralAlpha()`.

**Endpoint rule — never let a step land at 100% alpha.** The base formula hits exactly 1.00 at whichever step's target equals the base itself (step 12, since target and base are the same value there). A token at 100% opacity is indistinguishable from a plain solid fill — no longer actually translucent. **Fix, handled in `generate.js`:** for any step whose alpha would round to 1.00, switch that step's base to the extreme itself (pure black for light, pure white for dark) and recompute so it still composites to the same target.

This step's base differs from every other step in the scale — expected and correct. A mismatched base on one token is a smaller cost than a token that silently isn't translucent.

**Precision — keep at least 2 decimal places (light and dark alpha).** Whole-percent rounding introduces sRGB errors up to ±1/255 per channel at roughly half the steps — small, but a real, verifiable mismatch visible as a faint seam where solid and alpha versions sit adjacent. Always verify by compositing and diffing against the target hex.

Base color: `oklch(0.20 0.00 0)` — `#161616` (step 12 uses pure black instead — see endpoint rule):

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

**Token naming** — alpha steps live in a subfolder under the neutral scale:

```
neutral/1        →  solid
neutral/alpha/1  →  transparent
```

**Figma** — create a separate variable collection or group for alpha tokens (Figma supports `rgba` and `oklch` with alpha). Name the group `neutral/alpha` to keep it adjacent to the solid scale. Alpha tokens only look correct on white in Figma's canvas — verify on the actual background color when used in components.

### Neutral alpha scale — dark

Invert the base: use a near-white base and recalculate, again in quantized sRGB channel space. Same `generateNeutralAlpha()` function, `dark: true`.

**Why the base has to be so light.** Unlike the light scale (background is pure white, so the base only needs to stay below it), the dark scale's implicit background is pure black, and compositing can never produce a result lighter than the base itself. The base must sit above every target it represents, including the neutral exception's step 12 (L 0.97) — this is why the base is `oklch(0.99 0 0)` rather than a more obvious `0.95`; a base at or below the lightest target makes that step mathematically unreachable.

Check against the same endpoint rule: with base `#FCFCFC`, the dark scale's steps top out at 0.9722 — comfortably below 1.00, so no step needs the pure-white substitution today. Re-check whenever the dark neutral scale's step 12 target changes, since a future value could push the top step to 1.00 the same way the light scale's step 12 did.

Base color: `oklch(0.99 0.00 0)` — `#FCFCFC`:

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

### Chromatic alpha scales

Everything above (single base, varying alpha) only works exactly when the scale is achromatic. Any chroma breaks it, and it needs a base solved per step instead.

**Why a single base only works at C = 0.** Compositing onto white is `result = base × α + 255 × (1 − α)`. Solving for a single α across all three channels requires `α = (255−target_R)/(255−base_R) = (255−target_G)/(255−base_G) = (255−target_B)/(255−base_B)`, which holds only when the base lies on the straight line from white through the target in sRGB. An achromatic scale satisfies this trivially — every step lies on the neutral diagonal along with white, so any point on that diagonal works for every step. Any chroma pulls the 12 steps off that line.

Verified by searching for the error-minimizing single base across all 12 steps of four of this system's own reference scales:

| Scale | Source | Source C | Best possible single base | Worst error |
|---|---|---|---|---|
| Grey | `#6A6A6A` (grey mode) | 0.0000 | any point on the neutral diagonal | 0/255 |
| Blue | `#1A6FBF` (free mode) | 0.1467 | `#083080` | 35.0/255 |
| Red | `#B91C1C` (free mode) | 0.1905 | `#981038` | 38.5/255 |
| Indigo | `#9747FF` (anchored, no-ceiling) | 0.2541 | `#8080D0` | 49.9/255 |

Error rises with source chroma and never reaches zero for a tinted scale. **Use a single base only for a true `C = 0` neutral. For every other scale, solve per step.**

**"True neutral" is decided from the measured channels, not the family label.** The neutral classification threshold (`C < 0.01`) admits faintly tinted sources whose rendered steps do *not* have R=G=B — and the single-base solve reads one channel and assumes the other two match, which produced a measured composite error of **11/255** for a `C = 0.009` source routed through it, an order of magnitude past the 1/255 seams this scale exists to prevent. `generateAlphaScale()` therefore routes to the single-base neutral solve only when the family is neutral **and** every step's hex actually has equal channels; a neutral-classified scale with any unequal-channel step goes through the per-step chromatic solver, which is exact for it. Same principle as `familyEscapeWarning`: measured from the output, not inferred from a label.

**Method — per-step base at maximum transparency.** For each step, solve for the least opacity at which the solid step's sRGB target is reachable, then back out the base color that achieves it at that opacity. Exact implementation in `generate.js` → `generateChromaticAlpha()`.

α is the least opacity at which the target is reachable, so the token stays as adaptive as possible over non-white surfaces. Verify every step by compositing back onto white and diffing against the solid hex.

**Dark mode is the mirror — solved against black, not white.** Compositing over black gives `result = base × α`, so a channel above `255α` is unreachable regardless of base, and the least opacity at which the target is reachable is `max(R,G,B)/255`; the base is then `target/α` per channel. `generateChromaticAlpha()` takes a `dark` option and `generateAlphaScale()` passes the scale's own `dark` flag through. This branch did not exist for one stretch — dark scales went through the light (white-solved) formula and came out structurally inverted: dark step 1, which should be the *most* translucent token, solved to a near-black base at **α 0.95**, a nearly opaque scrim that composites over an actual dark surface to something darker than the surface itself. The round-trip suite never caught it because its chromatic cases all composited onto white; it now includes dark chromatic cases composited onto black. The zero-channel rule mirrors too: a target channel at/near 255 would push α to 1.0, so α is capped at `(255 − FLOOR)/255` and bleeds ≤ FLOOR/255 into that channel — same tradeoff and magnitude as the light rule, at the opposite corner. Expect dark alphas to *rise* toward the light end of the ramp (step 1 lowest, step 12 highest), the inverse of the light scale's profile — that's the solve working, not an inconsistency.

**The zero-channel rule.** White contributes `255 × (1 − α)` to every channel, so that value is a hard floor — any target channel below it is unreachable at that α regardless of base. A target with a channel at or near 0 pushes α toward 1.0. The endpoint rule for the neutral scale resolves its 100% case with a darker base; that doesn't transfer here — you can't go darker than a channel already at 0. Instead let the floor bleed a small amount into that channel: `FLOOR = 3` (as implemented) yields α ≈ 0.988 at the worst affected steps, a 3/255 deviation invisible at 8-bit precision. Relaxing to `FLOOR = 8` only buys α ≈ 0.969 while roughly tripling the visible deviation — no reason to go above 3.

**Three consequences to expect, not to fix:**

- **Cross-hue alpha parity is impossible.** α is dictated by each hue's minimum channel, so the same step number lands at very different opacities per hue. Measured at step 9: Grey 0.588, Red 0.871, Blue 0.929, Indigo 0.792. Alpha tokens can match their solid twins, or layer identically across hues — not both. This system chooses matching the solids.
- **Saturated hues flatten at the dark end.** Once several dark steps have a zero (or near-zero) channel, they collapse onto `1 − FLOOR/255 ≈ 0.988`. Red and Blue both reach that plateau by step 10; Indigo reaches it one step later, at step 11 (step 10 is still climbing at 0.937). Expected, not a defect — the exact step depends on source chroma, so don't assume it's always the same step.
- **The base's hue drifts for gamut-constrained hues.** Verified against the anchored Indigo reference: base hue drifts up to **23.8°** from the scale's own hue at the lightest steps (step 2: scale H 297.6° vs. base H 273.9°), converging to near-zero drift by the darkest steps. Maximum chroma at the blue-violet corner of sRGB hits the gamut wall and slides in hue — invisible on white, but an indigo alpha token will tint bluer than its solid twin over a dark background. **If hue fidelity over non-white surfaces matters more than adaptivity, back α off above its minimum until the base sits inside gamut at the correct hue, and accept the reduced transparency.** Not yet validated — a documented direction, not a rule. It would need a pass across several gamut-constrained sources before it earns rule status.

**Reference — Grey, Blue, Red, Indigo.** All four use sources documented elsewhere in this skill, so every step is directly checkable against the solid reference tables above.

**Grey** (`#6A6A6A`, grey mode) — base is `#000000` at every step, matching the "single base works trivially at C=0" result above:

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

All 48 values verified by compositing back onto white and diffing against the solid target. All exact except Indigo steps 11–12, which carry the agreed +3/255 offset on the green channel from the zero-channel rule — by construction, not an error.

---

## Implementation notes

### Conversion

To convert hex to OKLCH and back use [oklch.com](https://oklch.com) or the `culori` JavaScript library. For full scale generation rather than a single conversion, use the bundled `generate.js` (see "Before generating a scale" above) — it implements the exact conversions, curve, and clamping this document specifies.

### Design token naming

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

### Figma variable naming and descriptions

Applies specifically to Figma variable names and description fields when populating a collection from a generated scale — not the design-token naming above, which is about semantic role names.

**Dialect** comes from the project context (see Project context first): `--mode gray` and a `Gray` ramp for en-US, `grey` otherwise. `scale.mode` and `recover.js` stay `grey` either way; `scale.modeName` carries the spelling written into descriptions.

**Naming — mark the single step actually nearest the input color, in OKLab space, across all three modes uniformly.** Use `-anchor` if that step reproduces the source verbatim (an exact hex match); use `-source` if it's merely the nearest step, not exact. One rule, no per-mode exemptions:

- **Anchored mode:** the nearest step to the source *is* the anchor, by construction — always exact, always `-anchor`. Unaffected by this being a single unified rule rather than three special cases; verified across 200 random anchored sources with exact agreement every time.
- **Free mode:** whichever step is actually nearest the source gets `-source` — **not always step 9.** An earlier version of this rule hardcoded step 9 on the reasoning that it's where the chroma curve peaks — a fact about the curve's shape, not a claim about proximity to the source. Confirmed wrong on a real case: source `#009070` (L 0.581) has step 8 at ΔE 0.0187 from the source, step 9 at ΔE 0.0636 — step 8 is 3.4× closer, so the old rule pointed at a color measurably farther from the input than its own neighbor. Step 9 is still commonly the nearest step (whenever the source's own L happens to be close to the anchor L), but that's a property of the source, not a hardcoded rule.
- **Grey mode:** now gets a marker too, where it previously got none. Grey mode's fixed neutral L-scale corresponds to common round hex values (`#696969`, `#7D7D7D`, etc.) — a source that already *is* one of those values matches its nearest step exactly (`-anchor`), even though grey mode discards the source's own L to get there. A source that isn't one of those round values gets `-source` on whichever step is closest. Previously grey mode had the strongest actual claim to a marker (it hits exact matches far more often than free mode ever does) and got none; free mode had the weakest claim and got one unconditionally. The unified rule fixes both.
- No other step gets a marker — exactly one per scale, regardless of mode.

**A single Figma variable can have two modes (Light/Dark) generated by two different generation modes — the naming rule needs an explicit tiebreaker for this case.** It's common for a ramp to be anchored in light (verbatim brand color) and free in dark (the dark value is derived, not a second hand-picked brand hex) — or any other light/dark combination. Since one variable has one name but each mode's `generateScale()` call independently computes its own `figmaSuffix`, the two calls can disagree about which step deserves the suffix and what it should say. **Rule: the name follows the collection's default mode** (whichever mode a person opens the file into, typically Light) **and the description carries the per-mode truth for both.** Don't try to encode both modes' suffixes in one name — pick the default mode's suffix for the name, and let the two description lines (see below) carry the rest. If a collection deliberately mixes modes in a way where this would be actively misleading (e.g. the anchor step in light isn't even the same step index as the source-derived step in dark, and that distinction matters for how the variable is used), say so in the description explicitly rather than relying on the name to carry it.

**Descriptions — every variable's description carries its own OKLCH value plus scale-level provenance:** source hex, mode (free/anchored), and — for chroma-ceiling families (indigo, purple, magenta) — whether the ceiling was active (`capped`) or skipped (`uncapped`). The six non-ceilinged families (red, orange, yellow, green, cyan, blue) correctly show no ceiling label at all — **this is the absence of something that doesn't apply, not a missing value.** If a description shows no `capped`/`uncapped` token, check whether the family is one of the three ceilinged ones before treating it as a bug.

**Single-mode collection** — `figmaDescription` includes the light/dark token inline, since one description fully describes the one mode the variable represents:

```
oklch(0.5200 0.1467 251.94) · source #1A6FBF · free mode · light
```

**Two-mode collection (Light + Dark on one variable)** — a Figma variable has *one* description field shared across all its modes; it cannot express "light" and "dark" as two different strings on the same field. Baking the mode into the provenance string the same way as the single-mode case produces a description that's wrong for whichever mode you're not currently looking at. Instead, use `figmaDescriptionLine` (same content as `figmaDescription`, but without the light/dark token) and compose a two-line block yourself, with the mode as its own heading:

```
Light:
oklch(0.9793 0.0221 203.70) · source #2DAFB8 · anchored mode

Dark:
oklch(0.2106 0.0183 202.01) · source #2DAFB8 · free mode
```

**The anchor step's description says `verbatim`, never a ceiling label — even in a ceilinged family.** The anchor is always exempt from the ceiling by construction (see Anchored mode above), so labeling it `capped` or `uncapped` would misrepresent what actually happened to that specific variable — it implies the ceiling logic touched this step's chroma, when it didn't touch it at all. Every other step in the same ceilinged-family scale still shows the real `capped`/`uncapped` status accurately.

**Alpha variables follow neither the naming nor the description convention above — they get their own.** An alpha step isn't "verbatim" or "source-derived" the way a solid step is; it's a composited value (base + opacity) engineered to *reproduce* a solid step's appearance, not a direct read of the source color. Applying `-source`/`-anchor` suffixes to alpha variables would be actively wrong — even the alpha step matching the anchor's position isn't itself verbatim anything, it's a base/alpha pair chosen to visually match the anchor when composited. **Alpha variables get no `-source`/`-anchor` suffix, ever, regardless of mode.** Their description instead records what they composite onto and against what: base color, alpha value, and which solid variable they're meant to visually match —

```
oklch(0.20 0.00 0 / 64.38%) · base #161616 · alpha 0.643777 · composites to neutral/9 · grey mode
```

**The description leads with a ready-to-use CSS value**, mirroring the `${oklch} · ${provenance}` shape of a solid step, so both schemas read the same way and any tool parsing descriptions finds a value in the same position. The alpha is carried as a **2-decimal percentage, never a whole percent** — the ≥2-decimal rule above governs anything that *renders* these tokens, documentation included. Rounding step 6 of the light neutral ramp from `0.2961` to `30%` composites to 185 instead of 186, and 7 of the 11 non-endpoint steps move by 1/255 the same way: exactly the seam the alpha scale exists to prevent.

**The precision of these strings is guarded by a round-trip invariant, not by inspection.** `tests/test-oklch.js` parses each emitted CSS value exactly as a consumer would, converts the OKLCH triple back through `oklchToHex`, composites at the stated percentage, and requires the solid step's own hex — across the Grey, Blue, Red and Indigo references in both modes. That single assertion covers all three precision decisions at once: the base lightness decimals, the alpha decimals, and the endpoint rule's base swap.

Write the check this way round, from the emitted string. An earlier version composited from the `base` field and only read the percentage out of `css`, so it never converted the triple at all — it would have passed with any lightness in `BASE_OKLCH`. Mutating `#FCFCFC` from `oklch(0.99 0.00 0)` to `0.95` now fails three checks; under the old form it failed none.

Headroom, for reference: every neutral step lands ≥0.25/255 clear of a rounding boundary, and the tightest link is the dark base's own conversion — `oklch(0.99 0.00 0)` resolves to 251.64, i.e. 0.14/255 from rounding to 251 instead of 252. Correct, and deterministic, but it is the first thing that would move if the constant were ever re-rounded.

**Neutral alpha gets `oklch(...)`; chromatic alpha gets `rgb(...)`. The asymmetry is deliberate.** The two neutral bases are fixed constants with a nominal OKLCH published in the reference tables above, so quoting it converts nothing. A chromatic base is solved per step in 8-bit sRGB and its hue is documented to drift up to 23.8° from the scale's own hue — so a converted OKLCH triple would assert a hue the scale does not own, on top of re-introducing the continuous-conversion error this system quantizes away. `rgb()` states the solved channels and the authored alpha exactly. If you need OKLCH for a chromatic alpha token, derive it deliberately and own the rounding; don't have the generator imply it.

**The `neutral/9` part is not a literal, hardcoded variable path — it's built from `generateAlphaScale(scale, name)`'s `name` argument, which defaults to the scale's own detected family (`neutral` for a grey-mode scale) if not supplied.** Real Figma collections name their neutral ramp all kinds of things — `grey`, `gray`, `neutral`, `slate` — and this system has no way to know which one a given project uses. **Always pass the actual variable/collection name explicitly** (`generateAlphaScale(scale, 'grey')`, or whatever the real ramp is called) rather than relying on the default; the fallback exists so the function doesn't crash or produce an empty string when no name is given, not because "neutral" is the right answer for any given project.

Generated automatically — `generate.js` outputs `figmaSuffix`, `figmaDescription`, and `figmaDescriptionLine` per solid step, and `generateAlphaScale(scale, name)` outputs `figmaDescription` per alpha step in the format above (`--table` output includes a "Figma name" column for solid steps). None of this is a convention to apply by hand when writing variables.

### Comparison with other systems

| System | Steps | Lightest L | Darkest chromatic L | Darkest neutral L | Notes |
|---|---|---|---|---|---|
| Radix Colors | 12 | ~0.993 | ~0.32 | ~0.24 | Independent per-hue tuning |
| IBM Carbon | 10 + white/black | 1.0 (white) | varies | 0.20 (`text-01`) | White as canvas |
| Tailwind | 11 | ~0.98 | ~0.22 | 0.13 (`gray-950`) | No algorithmic generation |
| This system | 12 | 0.993 | 0.30 | 0.20 | Algorithmic, any source color |

---

## Known limitations and edge cases

### By design — not gaps

These are deliberate scope boundaries, not things left to fix.

- **Wide-gamut displays (P3, Rec2020)** — constrained to sRGB throughout.
- **High contrast themes** — AAA is guaranteed at text steps 10–12 only, not at every step.
- **Colorblind-safe themes** — hue substitutions for color vision deficiency are not handled.
- **Semantic role assignment** — which scale maps to success, warning, error, info is a design decision this skill doesn't make.

### Tested and characterized

Each of these has been swept systematically, with the method and finding stated. None are open questions — they're documented behavior, not unknowns.

- **Hue-nudge normalization.** Every family H-nudge rule in `applyFamilyRules()` (and `yellowDrift()`) computes `sourceH ± N` directly. Red (H 0-40) and magenta (H 320-360) both border the 0/360 wrap point, so a source hue close enough to that boundary could produce a negative or >360 H that leaked verbatim into `oklch()` strings and `figmaDescription` — mathematically equivalent to the wrapped angle, but inconsistent with how every other hue value in this system is presented. Found by broad adversarial fuzzing (8,000 random sources), not by design review or external feedback — none of this system's own validated reference sources happen to sit close enough to the wrap boundary to have triggered it. Fixed: both functions now normalize to [0, 360) before returning. Confirmed via a 5,000-case random sweep with zero out-of-range results afterward.

- **Cross-hue chroma disparity at the dark text steps.** At dark step 12 (L 0.93), sRGB's gamut ceiling varies substantially by hue — computed directly from a matched C=0.15 source per family: green renders C 0.103, indigo only C 0.034, a 3.0× spread across the 9 families at identical source chroma and identical target L. This is why a green dark-mode heading can read noticeably more vivid than a blue or indigo one generated the same way — it isn't a bug in either scale, it's how much room sRGB actually has at that lightness for each hue. Not something to normalize away by default (a per-hue-appropriate chroma is usually the more honest choice), but worth knowing if cross-hue vividness parity matters more than per-hue fidelity for a given project — the fix in that case is a shared chroma cap applied uniformly at steps 10–12, accepting that it will under-use the headroom the wider-gamut hues actually have.

- **Anchor step is not always peak rendered chroma.** Swept every family × 5 source L values (0.45–0.85) × 3 source C values (0.15–0.25), ~500+ combinations. Affects every family except indigo/purple/magenta (which have pre-curve chroma ceilings that keep them off the sRGB wall entirely) — rates from 8% (red) to 77% (cyan) when source L/C is high. See "Anchor ≠ rendered peak chroma" above for the full table and mechanism.
- **Gamut clamping tolerance.** All four plausible clamp strategies (decrement/bisect × strict/tolerance) tested against all 72 reference steps in this document. The ±0.001 tolerance band is required to reproduce the tables exactly; a strict [0,1] check produces different, lower-chroma output. See Gamut clamping above.
- **Alpha scale precision.** 143 reference values (72 solid + 71 alpha) verified exact. The quantized 8-bit hex value — not the continuous OKLCH conversion — must be used for both base and target when solving alpha; the difference is a few ten-thousandths but changes every downstream value. See Alpha scales above.
- **Yellow/orange collision.** Swept 1,620 synthetic yellow sources (H 72–128 × C 0.10–0.20 × L 0.40–0.85, free and anchored mode) against the project's orange scale. Collision rate runs 46–50% for H 72–84, falling to 0% by H 96 — see the cross-family collision check under Yellow above for the full table. Also confirmed no single global rate value (swept 20–70) eliminates the risk while still correcting yellow's olive drift; the per-source check is the fix, not a missing default.
- **No-ceiling modifier.** 2,940+ synthetic sources across indigo/purple/magenta at realistic chroma (C ≤ 0.35): zero flat spots. At extreme chroma (C 0.40–0.50, requiring a recovered source chroma around 0.27+ — well above any validated real source in this skill), a genuine flat spot does occur (magenta near H 330). Not a practical risk for real brand colors. `tests/test-oklch.js` tracks the extreme-chroma case as informational rather than a hard failure.
- **Boundary source colors — computational robustness.** 81 tests across all 9 family boundaries, at exact cutover and ±1/2/4/8° offsets: zero crashes, NaN values, or anomalous hue jumps. Family detection switches cleanly at every boundary.
- **Dark mode anchored mode.** 90 synthetic sources across all 9 families × 5 L values (0.20–0.80) × 2 C values, checking the anchor step's generated L against the actual recovered source L. Zero failures — the anchor-override invariant holds exactly every time.
- **Drift toward a secondary reference.** Implemented as `driftTowardReference()`. Fuzz-tested against 1,000 random base/reference pairs — anchor never moves, output always valid. Steps darker than the anchor frequently get zero drift by construction (the sign of the L-distance flips below the anchor) — this can erase a hue-family dark-step nudge the step already had. See the technique's own section above for the mechanism.
- **Crash resistance.** 5,000 fully random hex inputs across every mode combination, plus alpha generation on top of each: zero crashes, zero invalid output.
- **H 68, H 168, H 218.** Specifically confirmed clean (no anomalies, all 4 mode combinations) as part of the boundary sweep above.

- **Anchored-mode text-zone contrast.** Free mode swept across the full hue circle at typical L/C: worst text-step ratio 7.82:1 — the fixed-L AAA claim holds there. Anchored mode does not share the guarantee: a source at L 0.44–0.465 anchoring at step 10 measured down to 6.68:1 against white for high-luminance hues. Now measured at generation time — see `contrastWarning`/`anchorInTextZone` under Contrast above. Found by sweeping the anchored L-override interaction, not reported from the field.

- **Dark chromatic alpha direction.** The chromatic alpha solver was white-solved regardless of mode for one stretch, producing structurally inverted dark tokens (dark step 1 at α 0.95 on a near-black base). Found by checking the *direction* of the solved alphas against the neutral dark scale's profile, not by the round-trip test — whose chromatic cases all composited onto white, exactly the assumption that was wrong. Fixed with a mirrored black-solved branch; the suite now includes dark chromatic round-trips onto black and an explicit step-1-is-translucent direction check.

- **Near-neutral alpha routing.** A `C = 0.009` source (classified neutral, steps with unequal channels) routed through the single-base neutral solve measured 11/255 composite error. Routing now checks the rendered channels, not the family label — see Alpha scales above.

- **Anchor-proximity cap taper.** The background-zone cap tapers toward a designated peak (anchored anchor or `--peak` step) over `TAPER_RADIUS` steps — mechanism under Chroma curve above. Three findings from building it, each pinned in the suite: a **hue-aware cap was prototyped and rejected** (at steps 1–3 the curve's own chroma is already below 0.10 for realistic sources, so the cap only ever binds next to a vivid peak — the binding condition is proximity, not hue); **Orange neutralizes the taper through gamut geometry** (`#F17300`'s taper reach falls where sRGB max chroma sits below even the flat cap, so the clamp binds first — asserted explicitly); and **a loosen-only violation found by adversarial fuzzing, not design review** — the decrement clamp's start-dependence could land a tapered step ~0.001 *below* its pre-taper value, fixed in `clampCapZone()` by rendering both starts and keeping the higher. Pinned examples: `#00AFFF` anchored, where the sRGB wall binds, stays byte-identical to the untapered cap; `#FFB300` genuinely loosens.

- **Hue-scaled yellow drift (the lime hold).** `yellowHueScale` fades the yellow family's drift-toward-orange to zero for lime-region sources — rule and production evidence (Radix's held-hue lime, Material's `DislikeAnalyzer`) under Yellow above; recovery of the now-piecewise inversion under Parameter recovery above. The change was surgical by fuzz proof (3,000 cases: only yellow-family sources above H 105 changed) and it exposed one pre-existing recovery weakness — a vivid source's step-9 chroma gets gamut-crushed, underestimating source C — fixed with the light-step estimate. After the fix, the lime test set recovers 28/28 mode-correct, worst 0.47/255.

### Open

Things that either need more testing than has been done, or need something other than testing.


- **Very low-chroma sources** (near-neutral but above the C ≈ 0.01 threshold that triggers the neutral exception) are less thoroughly tested than the 9 core validated families.
- **Neutral scale exception, dark step 11** has weaker external support than every other pin in this document — the only comparable reference found (Radix `gray-dark-11`, L 0.770) sits meaningfully lower than this skill's L 0.87. Needs a second corroborating source from another production system, which is research, not something `generate.js` can resolve by running more sweeps.
- **No field records manual post-generation edits.** If a ramp has had a hand-applied correction on top of generation — a step-indexed hue schedule layered in by hand, a single step manually recolored, anything not reproducible from source + mode + ceiling alone — nothing in the description schema records that. A description built from `figmaDescription`/`figmaDescriptionLine` implies the ramp is fully reproducible from the stated source and settings, which becomes false the moment a manual adjustment is applied on top. If a scale gets hand-edited after generation, note that in the variable description (or wherever the scale's provenance lives) explicitly — there's no automated field for it yet.
- **Boundary color perceptual ambiguity.** The computational robustness at family boundaries is confirmed (see Tested above), but the actual design concern — a boundary color reading ambiguously as belonging to either adjacent family — is a perceptual judgment, not a computational one. No amount of additional sweeping closes this; it needs a human looking at the color, not another test.
