# Mapping a Figma token system onto MUI's theme

A Figma library with a twelve-step ramp, an emphasis axis and a `States/` token group does not fit Material UI's palette, which gives each semantic colour four slots. The argument here: **author every value MUI would otherwise compute, extend the theme rather than building a second variable layer beside it, and write down the few places the two genuinely disagree as named deviations.**

Researched August 2026 against Material UI v9 documentation and source (`createPalette.js`, `createTypography.js`, `shadows.js`, `zIndex.js`), the v5 to v9 migration guides and the Joy UI v7 docs; the project figures come from one library's Foundations collections. Re-checked in November 2026: v9 is still the stable major (v9.0.0, April 2026; the toolkit's validator reads v9.4.0), v10 is in preview, and MUI's versions page now lists v8 documentation with no release, against the v9 announcement's account of a jump from v7. The largest change since August: MUI's **native colour** mode (`cssVariables: { nativeColor: true }`) now documents palette values given as external CSS variables, which reopens the `var()` brand layer this piece had closed (section 5). Custom-named colour schemes are still undocumented. This piece is the theme and colour half of the earlier MUI guide; its naming half is merged into [naming inside a Figma component](naming-inside-figma-components.md) and the toolkit validator's MUI reference.

---

## What this answers

- Why does MUI's palette have four slots per colour, and what goes wrong mapping a ramp onto it?
- Where do hover, focus, pressed and disabled colours live?
- What do CSS theme variables, channel tokens and native colour give a token pipeline?
- How do several brands run across light and dark?
- Which other theme scales need care?
- What changes in the theme, and what is written down as a deviation?

---

## 1. The palette is not a ramp

**The short answer.** Six semantic colours (`primary`, `secondary`, `error`, `warning`, `info`, `success`), each with `main`, `light`, `dark` and `contrastText`, plus `text`, `action`, `background`, `divider`, `common` and a `grey` ramp. Supply only `main` and MUI computes the rest.

| Key | `light` | `main` | `dark` |
|---|---|---|---|
| `primary` | `#42a5f5` | `#1976d2` | `#1565c0` |
| `secondary` | `#ba68c8` | `#9c27b0` | `#7b1fa2` |
| `error` | `#ef5350` | `#d32f2f` | `#c62828` |
| `warning` | `#ff9800` | `#ed6c02` | `#e65100` |
| `info` | `#03a9f4` | `#0288d1` | `#01579b` |
| `success` | `#4caf50` | `#2e7d32` | `#1b5e20` |

Two numbers drive the computation. `tonalOffset` (default `0.2`, or asymmetric `{ light, dark }`) shifts `light` and `dark` from `main` when they are not given; `contrastThreshold` (default `3`) decides when `contrastText` flips to dark. The rest of the light palette: `text.primary` `rgba(0,0,0,0.87)`, `text.secondary` `0.6`, `text.disabled` `0.38`, `divider` `rgba(0,0,0,0.12)`, both backgrounds `#ffffff` (`#121212` in dark).

**The trap.** An emphasis token such as `Background/Feedback/Danger/soft` tempts a mapping onto `error.light`. But `light` is not free (outlined and standard Alerts and several hovers use it), and if only `main` is authored, `tonalOffset` regenerates it as a computed tint of `main` that will not match ramp step 3.

```js
palette: {
  error: {
    main: '#…', light: '#…', dark: '#…', contrastText: '#…',  // all authored from the ramp
    soft: '#…', medium: '#…', strong: '#…',                     // emphasis as extra keys
  },
}
```

The extra keys need an augmentation of `PaletteColor` and `SimplePaletteColorOptions`, and then generate CSS variables like the built-ins. Joy UI, from the same vendor, had the shape that fits an emphasis taxonomy (`solidBg`, `softHoverBg`, `outlinedBorder`, palettes `50` to `900`), but it is on hold.

**What to do.** Author all four slots of every colour; add emphasis steps as typed palette keys; raise `contrastThreshold` to `4.5` for a WCAG 2.2 AA floor.

---

## 2. Interaction colours live in `palette.action`

**The short answer.** Eleven values that every component reads, the nearest thing MUI has to a `States/` token group. Two gaps: no pressed token, and focus is an overlay, not a ring.

| Token | Light | Dark |
|---|---|---|
| `action.active` | `rgba(0,0,0,0.54)` | `#ffffff` |
| `action.hover` / `hoverOpacity` | `rgba(0,0,0,0.04)` / `0.04` | `rgba(255,255,255,0.08)` / `0.08` |
| `action.selected` / `selectedOpacity` | `0.08` | `0.16` |
| `action.disabled` | `rgba(0,0,0,0.26)` | `rgba(255,255,255,0.3)` |
| `action.disabledBackground` | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.12)` |
| `action.disabledOpacity` | `0.38` | `0.38` |
| `action.focus` / `focusOpacity` | `0.12` | `0.12` |
| `action.activatedOpacity` | `0.12` | `0.24` |

**Set it once, not per component.** An 8% hover specified on `MuiButton` alone leaves every Chip, MenuItem, IconButton, ListItemButton, Tab and table row at 4%, plausible one at a time and wrong side by side. Set both `action.hover` and `action.hoverOpacity`, because some components use the colour and others compose the opacity.

**Dark mode is not a mirror.** MUI roughly doubles each overlay in dark (`0.04` to `0.08`, `0.08` to `0.16`, `0.12` to `0.24`): dark surfaces need more change to read as the same amount. A `States/` group with one mode-independent opacity will be too faint in dark.

**No press token.** `activatedOpacity` is the persistent look of an activated toggle, not the moment a pointer is down; MUI's answer to press is the ripple, a different visual model. A `States/Press/opacity` token needs a custom key (`action.pressedOpacity`, augmented).

**Focus is not a ring.** `action.focus` is a translucent overlay. A stroke-based focus specification has no theme key and goes in a global `styleOverrides` on `MuiButtonBase` and the inputs, keyed on `.Mui-focusVisible`. The toolkit's validator adds the failure this prevents: a ring drawn as a new element renders *in addition* to MUI's own, so two rings, not none (`skills/component-validator/references/mui.md`, MU4).

**What to do.** Map `States/` onto `palette.action` per colour scheme, with dark values of its own; add a press key; implement the focus ring as one override replacing MUI's.

---

## 3. CSS variables, channel tokens and native colour

**The short answer.** With `cssVariables: true`, every theme value becomes a deterministic custom property (`--mui-palette-primary-main`), readable at runtime, which is what makes a design-to-code parity check possible. Native colour moves MUI's colour maths into the browser.

The names flatten the theme path (`--mui-palette-action-hoverOpacity`); `cssVarPrefix` changes or removes `--mui-`; `colorSchemeSelector` picks `'class'`, `'data'` or a pattern such as `'.theme-%s'`; and `theme.applyStyles()` is the supported way to write mode-specific styles, because reading `theme.palette.mode` flickers until hydration. Channel tokens (`mainChannel`, holding `25 118 210`) let CSS compose translucency: `rgba(var(--mui-palette-primary-mainChannel) / 0.12)`.

A variable that is not a theme key does not exist: a DTCG export of `…/Danger/soft` becomes `--mui-palette-error-soft` only once `soft` is a palette key (section 1). The alternative, a second layer of house variables referenced from `styleOverrides`, keeps MUI's palette pristine but leaves `theme.palette` no longer describing the app's colours.

**Native colour, re-checked November 2026.** Setting `cssVariables: { nativeColor: true }` makes MUI derive variants with CSS `color-mix()` and relative colour instead of JavaScript; palette values may be `oklch`, `oklab` or `display-p3`, or an external variable such as `main: 'var(--colors-brand-primary)'`; `getContrastText()` computes contrast in `oklch` and may differ slightly from the JavaScript result; it works only in browsers with relative-colour support. MUI's own upgrade notes warn that channel tokens are not guaranteed to be space-separated numbers once native colour is on, so `rgba(var(--…Channel) / …)` stops being safe there.

**What to do.** Turn `cssVariables` on and treat `--mui-palette-*` as the pipeline's naming target. Prefer extending the palette to a parallel layer. Decide native colour deliberately, since it changes which composition idioms work.

---

## 4. The other scales

**The short answer.** Typography uses Material Design 2's names, spacing is a function, radius is one value, elevation a 25-entry array; adopt breakpoints and z-index as they are.

- **Typography.** Thirteen variants (`h1`–`h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `button`, `caption`, `overline`), Roboto, base 14px. `button` is uppercase by default, set on the variant, so overriding it on `MuiButton` alone leaves other users of the variant shouting: set `typography.button.textTransform: 'none'`. MD3's `Headline / Title / Body / Label` names have not shipped; reaching them means custom variants with an augmentation, and disabling unused built-ins by setting them to `undefined`.
- **Spacing.** Factor 8 by default. A scale of `0 · 2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32` reads best as an array, `spacing: [0, 2, 4, 6, 8, 12, 16, 20, 24, 32]`, which accepts only positive integers, so negatives need the function form.
- **Radius.** `shape.borderRadius` is `4`, one value; extra keys need a `Shape` augmentation. The trap: `sx={{ borderRadius: 2 }}` is a *multiplier*, so with a base of 8 it silently means 16px. Ban the numeric shorthand.
- **Elevation.** `theme.shadows` is 25 strings (0 is `none`); five named levels map to five chosen indices, set per surface with `defaultProps: { elevation: n }`, or a replaced array.
- **Breakpoints and z-index.** `0 / 600 / 900 / 1200 / 1536`; `mobileStepper 1000`, `fab` and `speedDial 1050`, `appBar 1100`, `drawer 1200`, `modal 1300`, `snackbar 1400`, `tooltip 1500`. A house z-index scale has to interleave with MUI's components anyway, so adopt these.

**Defaults that disagree.** If the design's default size is the largest and MUI's is `medium`, every button written without `size` renders a step smaller, and both sizes look intentional in review. Each such component needs a `defaultProps` line, generated from the Figma defaults in the same pass as the properties tables. `variant` is per-component vocabulary, not a global enum (Button `text | contained | outlined`, TextField `filled | outlined | standard`, Alert `standard | filled | outlined`, Card `elevation | outlined`), and TextField's default changed from `standard` to `outlined` in v5.

---

## 5. Several brands across light and dark

**The short answer.** Generate one theme per brand from shared tokens today; prototype native colour's `var()` layer, which now has documentation; custom-named colour schemes still have none.

The Figma shape in the worked project is two switches: light and dark on the semantic collection's modes, eight brands on a brand collection's modes, sixteen permutations.

| Option | How | For | Against |
|---|---|---|---|
| A. A theme per brand | spread a generated `brandedTokens` and `brandedComponents` into each `createTheme()` | fully documented and typed; JS colour maths works | eight objects; switching brand is a provider swap and re-render |
| B. Custom-named schemes | `colorSchemes` beyond `light` and `dark`, switched by `'.theme-%s'` | Figma's mode mechanism in CSS; one theme object | MUI System says it is possible; Material UI's configuration page still shows only `light` and `dark`, with no recipe (November 2026) |
| C. A `var()` layer under the palette | `main: 'var(--brand-primary)'`, redefined under `[data-brand]` | mirrors a brand alias collection most closely | needs native colour (section 3) and relative-colour browser support; contrast computed in CSS may differ from JS |

Option C was closed in August because `tonalOffset`, `augmentColor` and `alpha()` parse colour strings at theme creation. Native colour moves that work into CSS, and its page shows exactly this branded-button case, so C is now a documented path for projects whose browser support allows it.

For option A, merge component overrides with MUI's array form, `root: [base.MuiButton.styleOverrides.root, { … }]`: object spread loses the base theme's variants and pseudo-class styles, and MUI warns against deep-merge utilities for performance.

**What to do.** Build A from generated tokens if brand switching happens at app boundaries; prototype C on one brand if a page ever has to show two brands, or if a CSS-class switch matters more than older browsers.

---

## 6. The class list as the parity contract

**The short answer.** `.Mui{Component}-{slot}` for each element and eleven global `.Mui-{state}` classes are a machine-readable variant grid, and the stable target for a parity check.

Root is always `root`; an enum variant is prefixed by its prop (`colorPrimary`, `sizeLarge`), a boolean is not (`fullWidth`). v9 removed the combined classes (`.MuiButton-containedPrimary` is now `.MuiButton-contained.MuiButton-colorPrimary`; likewise Alert and Chip), turning 3 × 7 class names into 3 + 7, the stylesheet's version of a sparse grid. The state classes (`.Mui-active`, `-checked`, `-completed`, `-disabled`, `-error`, `-expanded`, `-focusVisible`, `-focused`, `-readOnly`, `-required`, `-selected`) are always paired with a component class: `.Mui-disabled { opacity: .38 }` on its own reaches every disabled component in the app, MUI X grids included. Only the `.Mui*` part of the rendered `class` is stable; the hashed part differs between development and production builds. The contract holds only while the build uses MUI's styling engine, which v9's stated move towards Emotion independence and Tailwind integration may change.

---

## 7. What changes, and what is a deviation

**In the theme**

| Figma | Theme |
|---|---|
| Default size differs from `medium` | `defaultProps.size` per component |
| `States/Hover`, `States/Disabled` | `palette.action.*` per scheme, dark values of their own |
| `States/Press` | a custom `action.pressedOpacity` |
| Focus stroke | one global override on `.Mui-focusVisible` |
| Emphasis `soft · medium · strong` | extra palette keys, augmented |
| Five elevation levels | five `shadows` indices plus `defaultProps.elevation` |
| Radius scale | `shape` keys, augmented; numeric `sx` radius banned |
| Spacing scale | `spacing` array |
| Text styles | custom typography variants |
| AA floor | `contrastThreshold: 4.5` |
| No uppercase buttons | `typography.button.textTransform: 'none'` |

**Named deviations**

| Item | Why it is acceptable |
|---|---|
| `Danger` in Figma, `error` in the theme | both defensible: `error` is MUI's key and cannot be renamed without wrapping every component, while Joy UI itself uses `danger`. Record the pair in every Feedback component's code-gen notes |
| No press token in MUI | needs a custom key; the ripple is a different model |
| The `State` axis | documentation of what code produces, never a prop (see [what the State axis models](what-the-state-axis-models.md)) |

The toolkit's rule that component vocabulary matches token vocabulary (`standards/figma-standard.md` rule 22) is why the `Danger`/`error` pair must be recorded rather than left: a mismatch is invisible in either artefact alone.

---

## 8. The short version

MUI's palette gives four slots per semantic colour, and computes two of them if allowed; author all four from the ramp and add emphasis steps as typed keys. `palette.action` is the interaction-state layer: set it once, give dark mode roughly double the overlays, add a press key, and draw focus as one override on `.Mui-focusVisible` so it replaces MUI's indicator instead of doubling it. Turn on CSS variables and treat `--mui-palette-*` as the pipeline's target; native colour now lets a palette value be a `var()`, which makes a CSS brand layer viable where browser support allows. Adopt MUI's breakpoints and z-index, express spacing as an array, ban the numeric `sx` radius, switch off uppercase buttons, and generate `defaultProps` from the Figma defaults. Record `Danger` against `error` as a deviation.

---

## 9. What to re-check later

- **Native colour** in the pinned version: which release introduced it, and how channel tokens behave.
- **Custom-named colour schemes**: still no Material UI recipe (November 2026).
- **v10**, in preview: whether the class contract or palette shape changes.
- **Material Design 3** support: still forward-looking work in v9's announcement.
- **Pigment CSS**: alpha and on hold; a styling-engine change would move the class contract.
- **MUI Sync**: development stopped in 2024; not a pipeline to plan around.
- **Scope.** This compares MUI with its own siblings (Joy UI, Base UI), not across the industry; "consensus" here means within MUI's documented rules.

---

## Sources

- [Material UI versions](https://mui.com/versions/), [Introducing Material UI v9](https://mui.com/blog/introducing-material-ui-v9/), [Upgrade to v9](https://mui.com/material-ui/migration/upgrade-to-v9/)
- [Palette](https://mui.com/material-ui/customization/palette/), [`createPalette.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/createPalette.js), [Default theme](https://mui.com/material-ui/customization/default-theme.md)
- [CSS theme variables: usage](https://mui.com/material-ui/customization/css-theme-variables/usage/), [configuration](https://mui.com/material-ui/customization/css-theme-variables/configuration/), [native colour](https://mui.com/material-ui/customization/css-theme-variables/native-color/), [upgrade to native colour](https://mui.com/material-ui/migration/upgrade-to-native-color/), [MUI System CSS theme variables](https://mui.com/system/experimental-api/css-theme-variables/)
- [Typography](https://mui.com/material-ui/customization/typography/) and [`createTypography.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/createTypography.js), [Spacing](https://mui.com/material-ui/customization/spacing.md), [Shape](https://mui.com/material-ui/customization/shape.md), [`shadows.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/shadows.js), [`zIndex.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/zIndex.js), [Breakpoints](https://mui.com/material-ui/customization/breakpoints.md)
- [How to customize](https://mui.com/material-ui/customization/how-to-customize/) (class names, state classes), [Building extensible themes](https://mui.com/material-ui/guides/building-extensible-themes.md), [Theming](https://mui.com/material-ui/customization/theming/)
- [Joy UI theme colours (v7)](https://v7.mui.com/joy-ui/customization/theme-colors/); [MD3 tracking issue #29345](https://github.com/mui/material-ui/issues/29345); [Material UI Sync](https://mui.com/material-ui/design-resources/material-ui-sync/)
- Toolkit: `skills/component-validator/references/mui.md` (MU3, MU4, MU9, MU10); `standards/figma-standard.md` rule 22
