# Lightness: the light and dark L tables

The fixed lightness (L) of every step, light and dark, the neutral exception, and the text rules that follow from them. [SKILL.md](../SKILL.md) step 6 points here.

## Contents

- [OKLCH in brief](#oklch-in-brief)
- [The light L table](#the-light-l-table)
- [Text usage rule](#text-usage-rule)
- [The dark L table](#the-dark-l-table)
- [Chroma and contrast in dark mode](#chroma-and-contrast-in-dark-mode)
- [CSS implementation](#css-implementation)
- [Neutral scale exception](#neutral-scale-exception)

## OKLCH in brief

OKLCH is a perceptually uniform colour space with three independent axes. Values take the form `oklch(L C H)`.

| Axis | Meaning | Range |
|---|---|---|
| L | Lightness, perceptually uniform | 0 (black) to 1 (white) |
| C | Chroma (colourfulness) | 0 (grey) upward; the maximum varies by hue |
| H | Hue angle | 0–360 degrees |

Unlike HSL, equal steps in OKLCH L give equal perceived brightness differences. That is why the scale is built in OKLCH.

**OKLCH L is not WCAG luminance.** At equal L, contrast varies by hue: six hues at step 10 measured 8.03–9.44:1 against white. So the text steps (10–12) are not placed by L. Since 2.0.0 each is solved per hue to the WCAG luminance of the achromatic step at that L. The same six hues then measure 8.40–8.50:1. Contrast is guaranteed by that targeting plus the measured `contrastWarning`, never by L alone ([contrast.md](contrast.md)).

Each scale has 12 steps, covering every UI role from app-shell background to headings.

## The light L table

Every hue uses exactly these values, with two exceptions. In anchored mode the source L replaces the nearest step's L ([modes.md](modes.md)). In a neutral scale, steps 11–12 differ ([Neutral scale exception](#neutral-scale-exception)).

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

### Hover and active are separate on purpose

- **Hover (step 5)** is a subtle shift on pointer proximity. Its 1.10 ratio against step 4 is acceptable, because the cursor change reinforces it.
- **Active or selected (step 6)** is a persistent state, visible without a cursor. L 0.79 gives a 1.39 ratio against step 5, so selected states are unambiguous.

### Why the gaps are where they are

| Steps | Gap | Why |
|---|---|---|
| 1–2 | 0.013 | Tight: canvas against page background |
| 2–5 | 0.030 each | An even background tint progression |
| 5–6 | 0.10 | A larger jump: from the background zone to the interactive and border zone |
| 6–8 | 0.100 each | An even border weight progression |
| 8–9 | 0.07 | To the solid anchor step |
| 9–12 | 0.10, 0.06, 0.06 | Text contrast precision |

The dark end stops at L 0.30: rich, readable text without near-black. That is lighter than Tailwind `950` (L ≈ 0.22), a deliberate choice for chromatic text legibility. Neutral text can go darker ([Neutral scale exception](#neutral-scale-exception)).

## Text usage rule

**Text is only used at steps 10, 11 and 12.** Steps 1–9 are never text colours.

**Foreground on the solid step**: yellow-family hues take dark text. At typical brand lightness, yellow hues lack the headroom for white text on a filled solid step (badges, solid buttons). White on a vivid yellow solid can fall below 2:1.

- Where the solid step's L is above roughly **0.65**, pair it with **dark foreground text**. Use the family's own dark end (for example step 12) or a neutral near-black.
- This is a pairing rule, not a generation rule: it changes which text sits on the solid step, never the solid step's hex.
- In anchored mode the anchor moves with the source's lightness. Check the threshold against the anchor's actual L, not an assumed step number.
- `generateScale()` computes this for you as `solidForeground`, for any hue ([contrast.md](contrast.md)). The threshold above explains why; the field is what to read.

## The dark L table

A separate fixed table in the inverted direction: step 1 is darkest (canvas) and step 12 is lightest (heading text). The same two exceptions apply as in light mode.

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

### How it was derived: three pins and even gaps per zone

The table is not copied from one external system. It rests on **three cross-validated pins**, and even gaps within each zone fill the steps between them. This is the same zone approach as the light table.

**Pin 1: canvas (step 1), L 0.18.** Checked against five production systems' dark canvas hex values:

| System | Hex | L |
|---|---|---|
| GitHub Primer | `#0d1117` | 0.176 |
| Radix Colors | `#111111` | 0.178 |
| Material Design | `#121212` | 0.182 |
| IBM Carbon (g100) | `#161616` | 0.200 |
| VS Code dark | `#1e1e1e` | 0.235 |

All five cluster at L 0.176–0.235, and none approaches pure black. L 0.18 sits centrally, matching Radix and Material almost exactly.

**Pin 2: solid or anchor (step 9), L 0.70.** Checked against production solid and button colours:

| System | Hex | L |
|---|---|---|
| GitHub Primer accent | `#58a6ff` | 0.715 |
| IBM Carbon dark button | `#78a9ff` | 0.736 |

This is deliberately lighter than Radix's own anchor (L 0.54). Radix keeps one solid L across light and dark by design. GitHub's and IBM's dark buttons confirm the more common practice: solid colours read better lighter and less saturated on dark surfaces. Material's dark theme guidance documents the same.

**Pin 3: headings (step 12), L 0.93.** Checked against five systems' highest-contrast dark-mode text:

| System | L |
|---|---|
| IBM Carbon `text-01` | 0.967 |
| Radix neutral step 12 | 0.949 |
| GitHub Primer default fg | 0.943 |
| Material high-emphasis | 0.925 |
| Radix accent step 12 | 0.912 |

The cluster is L 0.91–0.97, and L 0.93 sits centrally.

**Even gaps between the pins:**

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

**Why the border zone (6–8) is not compared with Primer or Carbon**: both use one flat border token. Primer's border-default sits at L 0.33 and Carbon's at L 0.345. This system has a tiered active, border and hover-border structure. Radix, the only other system with the same tiers, sits at L 0.40–0.50 for those steps, close to this derivation. Calling a tiered system "too light" against a flat one mistakes architecture for miscalibration.

Contrast maths confirms it. Primer's border-default reaches only 1.55:1 against its canvas, and border-muted only 1.24:1, both well under 3:1. Real systems do not expect subtle borders to stand alone; they pair them with a background shift.

## Chroma and contrast in dark mode

Atlassian's changelog documents reducing saturation for subtle dark backgrounds, to reduce eye strain. That supports the global 0.85× dark chroma reduction ([chroma-and-gamut.md](chroma-and-gamut.md)). Material Design's advice to prefer lighter, less saturated tones in dark mode says the same.

Text steps pass WCAG AAA against step 1 (L 0.18): step 10 at 9.4:1, step 11 at 11.9:1, step 12 at 15.3:1. They also pass against step 2 (L 0.21), a more realistic page background: 8.6:1, 10.5:1 and 12.7:1.

## CSS implementation

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

## Neutral scale exception

This applies to grey and neutral scales only, in light and dark mode. Steps 1–10 use the standard L values: the background, border and anchor zones are about tint progression, not chromatic legibility. **Steps 11–12 diverge.**

**Light mode** replaces the shared 0.36 / 0.30 with:

| Step | L | Hex (C = 0) |
|------|------|------|
| 11 | 0.33 | `#353535` |
| 12 | 0.20 | `#161616` |

Checked against production systems' darkest neutral text:

| System | Token | L |
|---|---|---|
| IBM Carbon | `text-primary` | 0.200 (matches step 12 almost exactly) |
| Tailwind | `neutral-900`, `slate-900`, `gray-900` | 0.205–0.210 |
| Material Design 3 | neutral tone 10 | 0.225 |
| Radix | `gray-12` | 0.244 |
| GitHub Primer | `fg-default` | 0.254 |

The consensus cluster is L 0.20–0.25. The shared chromatic floor (L 0.30) sits well above it. That floor protects chromatic legibility, since near-black desaturates and muddies colour. A colour with no chroma has nothing to lose.

**Dark mode** replaces the shared 0.85 / 0.93 with:

| Step | L | Hex (C = 0) |
|------|------|------|
| 11 | 0.87 | `#D4D4D4` |
| 12 | 0.97 | `#F5F5F5` |

Checked against production systems' lightest dark-mode neutral text:

| System | Token | L |
|---|---|---|
| Radix | `gray-dark-12` | 0.949 |
| IBM Carbon | `text-01` dark | 0.967 |
| GitHub Primer | `fg-default` dark | 0.943 |
| Material | high-emphasis dark | 0.925 |

The cluster is L 0.925–0.967, clearly lighter than the chromatic dark heading (L 0.93). This mirrors light mode: neutral goes further toward the extreme than chromatic, in both directions.

Step 11's L 0.87 has weaker support. The only comparable reference found, Radix `gray-dark-11` at L 0.770, sits well lower. Treat 0.87 as a reasonable interpolation, not an independently validated pin.

Both directions clear WCAG AAA (7:1) by a wide margin against their canvas steps.

**Trigger:** the exception applies whenever the source is neutral (C ≈ 0). That is explicit grey mode, or free or anchored mode with a zero-chroma source. It depends on whether the scale is actually neutral, not on the mode chosen.

**The dark alpha base moves with it.** Alpha blending cannot produce a result lighter than its own base. With step 12 at L 0.97, the dark alpha base must sit above that ([alpha.md](alpha.md)).
