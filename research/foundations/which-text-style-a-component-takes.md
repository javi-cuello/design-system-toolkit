# Which text style a component takes

Across eight shipping systems, the text a component shows takes the control size and a heavier weight; reading styles go only to text that runs over several lines, and headings only to titles of containers.

A library has `label`, `body` and `heading` roles, and a designer is drawing an action menu: five rows reading "Action label". Which style do they take? The answer decides whether a menu item looks like a button or like a paragraph, and no system states it as a rule. What can be read is what each system's own components do. This piece reads that, for Carbon, Polaris, Primer, Atlassian, Material 3, Fluent 2, Spectrum and GOV.UK, and says what stays unanswered.

---

## What this answers

- [Do systems have a label role](#do-systems-have-a-label-role): who splits label from body, and on what
- [What each component takes](#what-each-component-takes): the table
- [The pattern](#the-pattern): what the table agrees on
- [A rule to start from](#a-rule-to-start-from): four questions, in order
- [What is not found](#what-is-not-found)

For how the roles are named see [naming text styles](naming-text-styles.md); for sizes and line height by role see [one type scale for an interface and its articles](one-type-scale-for-ui-and-content.md).

---

## Do systems have a label role

Only two systems have a style named label, and they do not split it on the same thing.

- **Carbon** defines `label-01` (12/16) "for field labels in components, error messages, and captions. It should not be used for body copy." Its other split is by length, not by interaction: `body-compact` is "for short paragraphs with no more than four lines and is commonly used in components"; `body-01` is for "long paragraphs with more than four lines". Buttons, tabs, menu items, options and table cells all take `body-compact-01` (14/18).
- **Material 3** has a label role. The only official statement fetched, from its Wear OS page, reads: "Label is used for component level text that describes an action that would happen if interacted with", and body is "content text like paragraphs of body copy". Title is "not recommended for interactive components". Its token source does not hold to this everywhere: tabs take `title-small`, and menu items take `body-large` while select options take `label-large`.

The rest have no label style. Polaris: "Body is used everywhere else… Buttons, inputs, paragraphs, navigation elements, etc. Any element that is part of the usable UI uses body type." Primer lists `form-label`, `button-text` and `navigation` under body medium. Atlassian and Fluent 2 give no rule, and their controls use the 14px body step with a heavier weight. Spectrum splits `ui` from `body` in code, and the only reason is a comment: `body` has "spacious line height, 1.5", `ui` interpolates 1.3 to 1.15.

Primer is the one system that gives a reason for treating one-line text differently: its tight line height is "for single-line text in compact UI elements like labels, badges, buttons, or captions where vertical space is limited. Not recommended for multi-line body text due to reduced readability."

---

## What each component takes

Resolved from each system's component source, in the form size/line height, weight when not regular. Cells are blank where nothing was found. Carbon is `body-compact-01` for the cells marked "ctl".

| Component | Carbon | Polaris | Primer | Atlassian | Material 3 | Fluent 2 | Spectrum (M) |
|---|---|---|---|---|---|---|---|
| Button | ctl 14/18 | bodySm 12/16, 550 | body-md 14, 500 | body 14/20, 500 | label-large 14/20, 500 | 14/20, 600 | ui 14, bold |
| Tab | ctl | bodySm, 550 | body-md 14 | inherits, 500 | title-small 14/20, 500 | body1 14/20 | ui 14 |
| Menu item | ctl | bodyMd 13/20 | body-md 14/20 | body 14/20 | body-large 16/24 | 14/20 | ui 14, medium |
| Select option | ctl | | | | label-large 14/20, 500 | 14/20 | ui 14 |
| Input value | ctl | 13/20 | body-md 14 | body 14/20 | body-large 16/24 | body1 14/20 | ui 14 |
| Field label | label-01 12/16 | bodyMd 13/20 | body-md 14, 600 | body.small 12/16, bold | body-large / small | 14/20 | ui 14 |
| Helper / error | helper-text-01 12/16 | bodyMd 13/20 | body-sm 12 | body.small 12/16 | body-small 12/16 | caption1 12/16 | ui 14 |
| Tooltip | body-01 14/20 | bodyMd 13/20 | body-sm 12 | body.small 12/16 | body-small 12/16 | 12/16 | ui-sm 12 |
| Badge / tag | label-01 12/16 | bodySm 12/16 | body-sm 12, 500 | body.small 12/16 | label-small 11/16, 500 | caption1 12/16, 600 | |
| Table header | heading-compact-01 14/18 | 12, 550 | 12, 600 | body.small, bold | title-small 14/20, 500 | | ui 14, bold |
| Table cell | ctl | | 12 | | body-medium 14/20 | | ui 14 |
| Card title | | headingSm 13/20, 650 | title-small 16, 600 | | | | title 16, bold |
| Dialog title | heading-03 20/28 | headingMd 14/20, 650 | 14, 600 | heading.medium 20/24, 653 | headline-small 24/32 | subtitle1 20/28, 600 | title-2xl 22, bold |
| Dialog body | body-01 14/20 | | | body 14/20 | body-medium 14/20 | body1 14/20 | body 16/24 |
| Toast / banner message | ctl | bodyMd 13/20 | body-md 14 | body 14/20 | body-medium 14/20 | body1 14/20 | ui 14 |

Sources: Carbon `packages/styles/scss/components/*`; Polaris `polaris-react/src/components/*`; Primer `packages/react/src/*.module.css`; Atlassian `@atlaskit/*` packages; Material `material-web` tokens v0_192; Fluent `react-components/*/use*Styles.styles.ts`; Spectrum `@react-spectrum/s2/src/*`. The URLs are under [Sources](#sources). GOV.UK is left out of the table because it has 19px for nearly everything and no tooltip, card or dialog.

---

## The pattern

Four things hold across the table.

- **A control's text is one step, shared by its neighbours.** Button, tab, menu item, option and input value sit on the same size in Carbon (14/18), Primer (14), Atlassian (14/20), Fluent (14/20) and Spectrum (14). Nobody gives a menu item a different style from the button that opens it. Material 3 is the exception, with a 16px menu item beside a 14px button.
- **Weight marks the interactive or naming text, not a new role.** Buttons are 500 or 600 or bold in every system but Carbon; Atlassian's token note says medium is "for all text that may appear beside iconography, such as in a button". Field labels go heavier too in Primer (600) and Atlassian (bold).
- **12px is the secondary tier.** Helper, error, tooltip and badge text take the small step (12/16 in Carbon, Primer, Atlassian, Material 3, Fluent) while field labels often sit one step above it.
- **The reading style is rare in components.** It shows up only on text that can run to several lines: dialog bodies, rich tooltips, card descriptions, banner messages. Headings go only on titles of a container: dialog, card, banner, section message.

The limit of this evidence is that the systems resolved the question in code and mostly never wrote the reason down. Primer's vertical-space reason and Carbon's four-line test are the only stated ones.

---

## A rule to start from

This is the reading of the table, not a statement from any system. Ask in order and stop at the first yes.

1. **Does it title a container (dialog, card, banner, section)?** Heading.
2. **Does it run over more than one line, or explain?** Body.
3. **Is it secondary to a control (helper, error, tooltip, badge, meta)?** The smallest label step.
4. **Otherwise: does it name something the person acts on or fills (button, tab, menu item, option, field label, input value)?** Label, at the control size.

Two cases the table does not settle:

- **A menu item or option with a long description.** The row's name is label; the description under it is body or the small step (Primer's menu item description is body-small, 12/16; Polaris's is bodySm).
- **A table cell.** Carbon, Primer and Spectrum put it on the control size; Material 3 puts it on body. Neither is argued.

---

## What is not found

- No official statement of label against body for phone or web Material 3: its pages are rendered by script and the fetch returned only a title. The quote above is from its Wear OS page.
- Carbon card title and nav link, Polaris table cell and modal body, Primer dialog body and nav link, Atlassian select option, card and nav link, and Fluent table cell, list item and card were not found.
- Spectrum's role-definition prose was not found; only its code comments.
- Atlassian's typography quotes passed through a summarising fetch and were not re-read against source.

---

## Cheat sheet

| Text | Style | Why |
|---|---|---|
| Title of a dialog, card, banner | Heading | names a container |
| Dialog body, rich tooltip, card description | Body | runs to several lines |
| Button, tab, menu item, option, input value | Label, control size, heavier weight where the system does | acts or fills |
| Field label | Label, control size or one step down | names what is filled |
| Helper, error, tooltip, badge | Smallest label step | secondary to a control |
| Menu item description | Body at the small step | explains the row |

---

## Sources

- Carbon: [style definitions](https://github.com/carbon-design-system/carbon-website/blob/main/src/components/TypesetStyle/typeSets.js), [type tokens](https://github.com/carbon-design-system/carbon/blob/main/packages/type/src/styles.ts), [component styles](https://github.com/carbon-design-system/carbon/tree/main/packages/styles/scss/components).
- Polaris: [using type](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/design/typography/using-type.mdx), [text variants](https://github.com/Shopify/polaris/blob/main/polaris.shopify.com/content/components/typography/text.mdx), [components](https://github.com/Shopify/polaris/tree/main/polaris-react/src/components).
- Primer: [typography tokens](https://github.com/primer/primitives/blob/main/src/tokens/functional/typography/typography.json5), [line-height tokens](https://github.com/primer/primitives/blob/main/src/tokens/base/typography/typography.json5), [components](https://github.com/primer/react/tree/main/packages/react/src).
- Atlassian: [typography](https://atlassian.design/foundations/typography), `@atlaskit/tokens` 20.14.0 and the component packages named in the table, read from npm.
- Material 3: [Wear OS typography](https://developer.android.com/design/ui/wear/guides/get-started/apply), [Android codelab](https://developer.android.com/codelabs/m3-design-theming), [material-web tokens](https://github.com/material-components/material-web/tree/main/tokens/versions/v0_192).
- Fluent 2: [typography](https://fluent2.microsoft.design/typography), [typographyStyles.ts](https://github.com/microsoft/fluentui/blob/master/packages/tokens/src/global/typographyStyles.ts), [components](https://github.com/microsoft/fluentui/tree/master/packages/react-components).
- Spectrum: [style macro](https://github.com/adobe/react-spectrum/blob/main/packages/dev/s2-docs/pages/s2/style-macro.mdx), [theme](https://github.com/adobe/react-spectrum/blob/main/packages/@react-spectrum/s2/style/spectrum-theme.ts), [components](https://github.com/adobe/react-spectrum/tree/main/packages/@react-spectrum/s2/src).
