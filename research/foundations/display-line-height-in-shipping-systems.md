# Display line height in shipping systems

No system read ships display leading below 1.0: the tightest is 1.00, typical is 1.0 to 1.25, and no system documents descender clashes.

A display style is set large, in one to three lines, and its leading is usually tighter than a heading's. A designer asks whether it can go below 1.0 when the descenders of one line clear the ascenders of the next. This piece reads display tokens from the systems' own files on 2026-11-25, with ratios worked out as line height divided by size, and says what stays unanswered.

---

## What this answers

- [What systems ship](#what-systems-ship): the ratios, tightest first
- [What is said about collisions](#what-is-said-about-collisions)
- [What is not found](#what-is-not-found)

---

## What systems ship

| System | Token | Size px | Line height px | Ratio |
|---|---|---|---|---|
| Tailwind | `text-5xl` to `text-9xl` | 48 to 128 | same as size | 1.00 |
| Radix Themes | `font-size-9` | 60 | 60 | 1.00 |
| GOV.UK | xl, desktop | 80 | 80 | 1.00 |
| GOV.UK | xl, mobile | 53 | 55 | 1.04 |
| Carbon | `display-04`, max | 156 | 163.8 | 1.05 |
| Carbon | `display-04`, xlg | 122 | 130.5 | 1.07 |
| Carbon | `display-04`, lg | 92 | 102.1 | 1.11 |
| Carbon | `display-03`, max | 84 | 93.2 | 1.11 |
| Tailwind | `text-4xl` | 36 | 40 | 1.11 |
| Material 3 | `display-large` | 57 | 64 | 1.12 |
| Carbon | `display-01`, max | 76 | 85.9 | 1.13 |
| Material 3 | `display-medium` | 45 | 52 | 1.16 |
| Bootstrap | `display-1` to `display-6` | 80 to 40 | 1.2 × size | 1.20 |
| Material 3 | `display-small` | 36 | 44 | 1.22 |
| Fluent 2 | Hero 900 | 40 | 52 | 1.30 |
| Fluent 2 | Hero 1000 | 68 | 92 | 1.35 |

- **Lowest shipped is 1.00**, in Tailwind, Radix and GOV.UK desktop; Carbon reaches 1.05 at 156px. None of the systems read ships 0.9.
- **Typical range is 1.0 to 1.25**, and larger sizes go tighter: Carbon's ratio falls from 1.19 to 1.05 as size rises.

---

## What is said about collisions

- No design system read documents descender clashes.
- A type foundry's guidance (MyFonts, Fontology, display line spacing) says "All cap settings call for tighter leading than mixed case, as there are no descenders to invade the line spacing", and treats leading equal to the size as the baseline ("solid", 39/39). It gives no figure below 1.0.
- Web articles say leading below 1 is acceptable for short display text if ascenders and descenders do not collide. Those are secondary sources and were not checked against a primary text.
- Lowercase or mixed-case display below 1.0 has no shipping precedent in this set, so it needs a test in the typeface itself.

---

## What is not found

- Spectrum, Atlassian, Polaris and USWDS display values: the token files were not reachable.
- Apple's Large Title and Display: the page returned no table.
- Primer's display line height: the token points at a `snug` value that was not resolved.

---

## Sources

- Tailwind: [theme](https://raw.githubusercontent.com/tailwindlabs/tailwindcss/main/packages/tailwindcss/theme.css).
- Radix Themes: [typography tokens](https://raw.githubusercontent.com/radix-ui/themes/main/packages/radix-ui-themes/src/styles/tokens/typography.css).
- GOV.UK: [responsive typography](https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/settings/_typography-responsive.scss).
- Carbon: [styles](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/type/scss/_styles.scss) and the scale file in the same folder.
- Material 3: [type scale](https://raw.githubusercontent.com/material-components/material-web/main/tokens/versions/v0_192/_md-sys-typescale.scss).
- Fluent 2: [fonts](https://raw.githubusercontent.com/microsoft/fluentui/master/packages/tokens/src/global/fonts.ts).
- Bootstrap: [variables](https://raw.githubusercontent.com/twbs/bootstrap/v5.3.3/scss/_variables.scss).
- Primer: [typography tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/typography/typography.json5).
- MyFonts: [display typography line spacing](https://myfonts.com/pages/fontscom-learning-fontology-level-2-display-typography-line-spacing).
