# Large reading text and the smallest heading on a phone

No system checked shrinks its smallest heading below about 14px, and only Carbon scales a large reading style down; ties between heading levels are shipped only where weight or role separates them.

A type scale has a body of 12 to 17px, reading text from 21 to 30px, and a smallest heading of about 14px. On a phone the sources in [type on a phone](type-on-a-phone.md) hold body and step headings down, and say nothing about these two. This piece reads each system's tokens and docs on 2026-11-25 for them, and says what stays unanswered.

---

## What this answers

- [Large reading text](#large-reading-text): own group or inside body, and whether it shrinks
- [The smallest heading](#the-smallest-heading): hold, merge or drop
- [Ties](#ties): what systems do when two levels land on one size
- [What is not found](#what-is-not-found)

---

## Large reading text

| System | Large reading text | Group | On a phone |
|---|---|---|---|
| GOV.UK | `govuk-body-l`, 24 | inside body, by name | 21 |
| Carbon | expressive paragraph, 32 at most | own group | fluid, 24 to 32 |
| Fluent 2 | Subtitle 1 (20), Title 3 (24) | own group, not Body | fixed on web; smaller on iOS and Android |
| Primer | `subtitle`, `title-medium` (20 per the base token description) | own group | not found |
| Material 3, Atlassian, Primer | `body-large`, 16 | inside body | holds |
| Bootstrap | `.lead`, 20 | a utility class | scaled by RFS, not read |
| Polaris | `bodyLg` | inside body | no media query; px not found |

- **Only Carbon scales a large reading style down by design.** GOV.UK steps its lead-sized `body-l` from 24 to 21.
- **Material, Primer and Atlassian have no body style in the 21 to 30 range.** Fluent 2 and Primer put that size in a title group.

---

## The smallest heading

| System | Smallest heading | On a phone |
|---|---|---|
| GOV.UK | `heading-s`, 19 | holds, the same size as body, told apart by bold |
| Carbon | `heading-01`, 14 and `heading-02`, 16 | hold; 14 is also `body-compact-01` |
| Polaris mobile theme | `heading-sm`, `heading-md` | 14 and 16, the same as `body-sm` and `body-md` |
| Primer | `title-small`, 16 | no rule found; the same size as `body-large` |
| Spectrum | all sizes | grow by 17 to 22% |

No system checked drops its smallest heading below about 14. They hold it (GOV.UK, Carbon), merge it onto a body size (Polaris, Primer) or raise it (Spectrum).

---

## Ties

| System | Tie on a phone | What separates them |
|---|---|---|
| GOV.UK | points 27 and 24 both become 21 | nothing; the size map marks 27 "consider deprecating this size" |
| GOV.UK | `heading-s` and body, 19 | bold |
| Carbon | expressive headings 05 and 06, both 32 | weight (light or regular against semibold) |
| Primer | `title.large` takes the 20 of `title.medium`, equal to `subtitle` | by prose rule: "switch to title.medium on narrow viewports" |

Systems tolerate a tie when weight or role differs. A tie between two levels of one weight has no precedent in what was read, and the check in [type on a phone](type-on-a-phone.md#phone-heading-sizes), that no two heading levels land on the same size, is the rule for it. No shipped product with two heading levels at one phone size was found, only these design-system cases.

---

## What is not found

- Spectrum's heading aliases to its size tokens, and Primer's phone sizes for `title-medium` and `subtitle`.
- USWDS's pixel sizes for its heading steps.
- Material 3's size-to-name mapping is read from its Compose token file, because its docs returned no content.
- Polaris's `bodyLg` pixel value.

---

## Sources

- GOV.UK: [responsive typography](https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/settings/_typography-responsive.scss), [typography mixin](https://raw.githubusercontent.com/alphagov/govuk-frontend/main/packages/govuk-frontend/src/govuk/core/_typography.mixin.scss).
- Carbon: [type styles](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/type/src/styles.ts), [scale](https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/type/src/scale.ts).
- Polaris: [tokens](https://unpkg.com/@shopify/polaris-tokens@9.4.2/dist/css/styles.css), [Text styles](https://raw.githubusercontent.com/Shopify/polaris/main/polaris-react/src/components/Text/Text.module.css).
- Primer: [functional tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/typography/typography.json5), [base tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/base/typography/typography.json5).
- Spectrum: [typography tokens](https://unpkg.com/@adobe/spectrum-tokens@latest/src/typography.json).
- Fluent 2: [typography](https://fluent2.microsoft.design/typography).
- Material 3: [type scale tokens](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/TypeScaleTokens.kt).
- Atlassian: [typography](https://atlassian.design/foundations/typography).
- Bootstrap: [typography](https://getbootstrap.com/docs/5.3/content/typography/).
