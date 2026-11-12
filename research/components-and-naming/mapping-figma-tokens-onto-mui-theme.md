# Mapping a Figma token system onto MUI's theme

Where a Figma library's ramps, emphasis steps and state tokens go in Material UI's theme, and what to write down where they don't fit.

A designer hands over a library with a twelve-step red ramp, an emphasis axis (`soft`, `medium`, `strong`) and a `States/` token group. The engineer opens Material UI's palette and finds `error`, with four slots: `main`, `light`, `dark`, `contrastText`. They map `Danger/soft` onto `error.light`, ship, and a week later the soft alert background is a tint nobody drew.

---

## What this answers

- [Ramps and the palette](#ramps-and-the-palette): why a ramp doesn't fit MUI's palette
- [Interaction colours](#interaction-colours): where hover, press and focus colours live
- [CSS variables and native colour](#css-variables-and-native-colour): what CSS variables and native colour change
- [Other theme scales](#other-theme-scales): which other theme scales need care
- [Brands with light and dark](#brands-with-light-and-dark): how several brands share light and dark
- [Stable class names](#stable-class-names): which class names are a stable contract
- [Named deviations](#named-deviations): which differences stay named deviations

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in one paragraph.

---

## Ramps and the palette

A ramp doesn't fit as it is: MUI gives each semantic colour four slots and computes two of them when they're left out, so every slot has to be authored from the ramp, with emphasis steps added as typed keys of their own.

Back to that soft alert. `light` looked like a free slot for `Danger/soft`, but it isn't free: outlined and standard Alerts read it, and so do several hover styles. Worse, if only `main` is authored, MUI fills `light` itself, and the tint it makes won't match ramp step 3.

The palette has six semantic colours (`primary`, `secondary`, `error`, `warning`, `info`, `success`), each with those four slots. Beside them sit `text`, `action`, `background`, `divider`, `common` and a `grey` ramp. MUI's defaults for the six:

| Key | `light` | `main` | `dark` |
|---|---|---|---|
| `primary` | `#42a5f5` | `#1976d2` | `#1565c0` |
| `secondary` | `#ba68c8` | `#9c27b0` | `#7b1fa2` |
| `error` | `#ef5350` | `#d32f2f` | `#c62828` |
| `warning` | `#ff9800` | `#ed6c02` | `#e65100` |
| `info` | `#03a9f4` | `#0288d1` | `#01579b` |
| `success` | `#4caf50` | `#2e7d32` | `#1b5e20` |

Two numbers drive the computing. `tonalOffset` (default `0.2`, or an asymmetric `{ light, dark }`) shifts `light` and `dark` away from `main` when they aren't given. `contrastThreshold` (default `3`) decides when `contrastText` flips to dark.

The rest of the light palette is fixed values: `text.primary` is `rgba(0,0,0,0.87)`, `text.secondary` `0.6`, `text.disabled` `0.38`, `divider` `rgba(0,0,0,0.12)`, and both backgrounds `#ffffff` (`#121212` in dark).

Here is the mismatch drawn: the library's ramp on top, MUI's four slots below.

<svg role="img" viewBox="0 0 640 260" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Top: an illustrative twelve-step red ramp from the Figma library, with step 3 marked Danger/soft. Bottom: MUI's error palette with four slots, light, main, dark and contrastText. If only main is authored, light is computed from main by tonalOffset 0.2 and does not equal ramp step 3. Soft, medium and strong need keys of their own.</title>
<rect x="0" y="0" width="640" height="260" fill="#f7f6f2"/>
<text x="20" y="28" font-size="14" font-weight="600" fill="#1a1a1a">Figma: Danger ramp (illustrative)</text>
<rect x="20" y="40" width="46" height="40" fill="#fff5f4"/>
<rect x="70" y="40" width="46" height="40" fill="#ffe9e6"/>
<rect x="120" y="40" width="46" height="40" fill="#ffd6d1" stroke="#1a1a1a" stroke-width="2"/>
<rect x="170" y="40" width="46" height="40" fill="#ffbdb5"/>
<rect x="220" y="40" width="46" height="40" fill="#ff9f94"/>
<rect x="270" y="40" width="46" height="40" fill="#f77c6f"/>
<rect x="320" y="40" width="46" height="40" fill="#e85a4c"/>
<rect x="370" y="40" width="46" height="40" fill="#d63b2e"/>
<rect x="420" y="40" width="46" height="40" fill="#bd2a1f"/>
<rect x="470" y="40" width="46" height="40" fill="#9c2018"/>
<rect x="520" y="40" width="46" height="40" fill="#7a1912"/>
<rect x="570" y="40" width="46" height="40" fill="#55120d"/>
<text x="143" y="98" font-size="12" fill="#1a1a1a" text-anchor="middle">step 3</text>
<text x="143" y="114" font-size="12" font-weight="600" fill="#1a1a1a" text-anchor="middle">Danger/soft</text>
<text x="20" y="152" font-size="14" font-weight="600" fill="#1a1a1a">MUI: palette.error, four slots</text>
<rect x="20" y="164" width="130" height="44" rx="6" fill="#ef5350"/>
<text x="85" y="191" font-size="13" fill="#ffffff" text-anchor="middle">light</text>
<rect x="160" y="164" width="130" height="44" rx="6" fill="#d32f2f"/>
<text x="225" y="191" font-size="13" fill="#ffffff" text-anchor="middle">main</text>
<rect x="300" y="164" width="130" height="44" rx="6" fill="#c62828"/>
<text x="365" y="191" font-size="13" fill="#ffffff" text-anchor="middle">dark</text>
<rect x="440" y="164" width="130" height="44" rx="6" fill="#ffffff" stroke="#c9c6bd"/>
<text x="505" y="191" font-size="13" fill="#1a1a1a" text-anchor="middle">contrastText</text>
<text x="85" y="228" font-size="12" fill="#5a5850" text-anchor="middle">computed from main</text>
<text x="85" y="244" font-size="12" fill="#5a5850" text-anchor="middle">by tonalOffset 0.2</text>
<text x="186" y="114" font-size="13" font-weight="600" fill="#b3261e">≠ the light MUI computes from main</text>
<text x="440" y="236" font-size="12" fill="#5a5850">soft, medium, strong: no slot</text>
</svg>

Step 3 and the computed `light` are both "a pale red", so the difference only shows when the alert sits beside a Figma frame. And the emphasis axis has nowhere to go at all.

The fix, in theme code:

```js
palette: {
  error: {
    main: '#…', light: '#…', dark: '#…', contrastText: '#…',  // all authored from the ramp
    soft: '#…', medium: '#…', strong: '#…',                     // emphasis as extra keys
  },
}
```

The extra keys need an augmentation of `PaletteColor` and `SimplePaletteColorOptions`; after that they generate CSS variables like the built-ins. Joy UI, from the same vendor, had the shape that fits an emphasis taxonomy (`solidBg`, `softHoverBg`, `outlinedBorder`, palettes `50` to `900`), but Joy UI is on hold.

Author all four slots of every colour from your ramp, so `tonalOffset` never computes one. Add your emphasis steps as typed palette keys. **Raise `contrastThreshold` to `4.5`, so `contrastText` meets the WCAG 2.2 AA floor.**

---

## Interaction colours

They live in `palette.action`, eleven values every component reads: the nearest thing MUI has to a `States/` token group, with no pressed token and a focus style that is an overlay rather than a ring.

The library's `States/Hover` says 8%. The engineer sets an 8% hover on `MuiButton`, and buttons look right. But every Chip, MenuItem, IconButton, ListItemButton, Tab and table row still hovers at 4%. Each is plausible on its own; side by side, they disagree.

That happens because hover lives in the palette, not in each component. These are the values:

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

Some components use the colour and others compose the opacity, so both `action.hover` and `action.hoverOpacity` have to change together.

Dark mode isn't a mirror. MUI roughly doubles each overlay in dark (`0.04` to `0.08`, `0.08` to `0.16`, `0.12` to `0.24`), because a dark surface needs more change to read as the same amount. A `States/` group with one opacity for both modes will look too faint in dark.

There is no press token. `activatedOpacity` is the lasting look of a toggle that's switched on, not the moment a pointer is down. MUI's answer to press is the ripple, a different visual model, so a `States/Press/opacity` token needs a custom key (`action.pressedOpacity`, augmented).

Focus isn't a ring either. `action.focus` is a translucent overlay. A stroke-based focus design has no theme key, so it goes in a global `styleOverrides` on `MuiButtonBase` and the inputs, keyed on `.Mui-focusVisible`.

The toolkit's validator records what goes wrong otherwise: a ring drawn as a new element renders *in addition* to MUI's own, so the result is two rings, not none (`~/Projects/toolkit/skills/component-validator/references/mui.md`, MU4).

Map your `States/` tokens onto `palette.action`, per colour scheme, with dark values of their own. Add a press key. **Draw the focus ring as one override on `.Mui-focusVisible` that replaces MUI's indicator.**

---

## CSS variables and native colour

CSS variables turn every theme value into a predictable custom property a parity check can read, and native colour moves MUI's colour maths into the browser, which changes which tricks still work.

A design-to-code check wants to read, in a running page, the colour the theme gave `primary.main`. Without CSS variables that value lives only in a JavaScript object. With `cssVariables: true`, it's a custom property, `--mui-palette-primary-main`, readable at runtime.

The names flatten the theme path: `palette.action.hoverOpacity` becomes `--mui-palette-action-hoverOpacity`. A few settings shape them:

- `cssVarPrefix` changes or removes the `--mui-` prefix.
- `colorSchemeSelector` picks how a mode is switched: `'class'`, `'data'` or a pattern such as `'.theme-%s'`.
- `theme.applyStyles()` is the supported way to write mode-specific styles, because reading `theme.palette.mode` flickers until hydration.

Channel tokens let CSS compose translucency. `mainChannel` holds the bare numbers `25 118 210`, so `rgba(var(--mui-palette-primary-mainChannel) / 0.12)` gives a 12% primary.

A variable that isn't a theme key doesn't exist. A DTCG export of `…/Danger/soft` only becomes `--mui-palette-error-soft` once `soft` is a palette key, which is the augmentation from [ramps and the palette](#ramps-and-the-palette).

The alternative is a second layer of house variables referenced from `styleOverrides`. It keeps MUI's palette pristine, but `theme.palette` then no longer describes the app's colours.

Native colour is the newer switch. Setting `cssVariables: { nativeColor: true }` makes MUI derive its variants with CSS `color-mix()` and relative colour instead of JavaScript. That brings four changes:

- palette values may be `oklch`, `oklab` or `display-p3`, or an external variable such as `main: 'var(--colors-brand-primary)'`;
- `getContrastText()` computes contrast in `oklch`, and may differ slightly from the JavaScript result;
- it works only in browsers with relative-colour support;
- channel tokens are no longer guaranteed to be space-separated numbers, so `rgba(var(--…Channel) / …)` stops being safe, as MUI's own upgrade notes warn.

Turn `cssVariables` on and treat `--mui-palette-*` as your pipeline's naming target. Extend the palette rather than building a parallel layer. **Decide on native colour deliberately, since it changes which composition idioms work.**

---

## Other theme scales

Typography uses Material Design 2's names, spacing is a function, radius is one value and elevation a 25-entry array; breakpoints and z-index are best adopted as they are.

Take the library's buttons, which are sentence case. The engineer sets `textTransform: 'none'` on `MuiButton`, and buttons look right. Then a menu that uses the `button` typography variant still shouts in capitals, because uppercase is set on the variant, not on the component.

Each scale has a catch of that kind:

- **Typography.** Thirteen variants (`h1` to `h6`, `subtitle1`, `subtitle2`, `body1`, `body2`, `button`, `caption`, `overline`), Roboto, base 14px. Set `typography.button.textTransform: 'none'` to fix the capitals everywhere. MD3's `Headline / Title / Body / Label` names haven't shipped; reaching them takes custom variants with an augmentation, and setting unused built-ins to `undefined`.
- **Spacing.** A factor of 8 by default. A scale of `0 · 2 · 4 · 6 · 8 · 12 · 16 · 20 · 24 · 32` reads best as an array, `spacing: [0, 2, 4, 6, 8, 12, 16, 20, 24, 32]`. An array takes only positive integers, so negatives need the function form.
- **Radius.** `shape.borderRadius` is `4`, a single value; extra keys need a `Shape` augmentation. The trap is `sx={{ borderRadius: 2 }}`, which is a *multiplier*: with a base of 8 it silently means 16px.
- **Elevation.** `theme.shadows` is 25 strings, and 0 is `none`. Five named levels map to five chosen indices, set per surface with `defaultProps: { elevation: n }`, or the array is replaced.
- **Breakpoints and z-index.** Breakpoints are `0 / 600 / 900 / 1200 / 1536`. Z-index is `mobileStepper 1000`, `fab` and `speedDial 1050`, `appBar 1100`, `drawer 1200`, `modal 1300`, `snackbar 1400`, `tooltip 1500`. A house z-index scale has to interleave with MUI's components anyway.

Defaults can disagree too. If the design's default button size is the largest and MUI's is `medium`, every button written without `size` renders a step smaller, and both sizes look intentional in review. Each such component needs a `defaultProps` line.

`variant` doesn't help here, because it's per-component vocabulary, not a global enum. Button takes `text | contained | outlined`, TextField `filled | outlined | standard`, Alert `standard | filled | outlined`, Card `elevation | outlined`. TextField's default changed from `standard` to `outlined` in v5.

Switch off uppercase on the `button` variant, express spacing as an array, and ban the numeric `sx` radius shorthand. Adopt MUI's breakpoints and z-index. **Generate the `defaultProps` lines from your Figma defaults, in the same pass as the properties tables.**

---

## Brands with light and dark

Today, several brands share light and dark by generating one theme per brand from shared tokens; native colour's `var()` layer is now documented and worth a prototype, while custom-named colour schemes still have no recipe.

In the worked project, the Figma shape is two switches. The semantic collection has light and dark modes; a brand collection has eight brand modes. That's sixteen permutations, and the theme has to produce all of them.

Three ways exist:

| Option | How | For | Against |
|---|---|---|---|
| A. A theme per brand | spread a generated `brandedTokens` and `brandedComponents` into each `createTheme()` | fully documented and typed; JS colour maths works | eight objects; switching brand is a provider swap and re-render |
| B. Custom-named schemes | `colorSchemes` beyond `light` and `dark`, switched by `'.theme-%s'` | Figma's mode mechanism in CSS; one theme object | MUI System says it is possible; Material UI's configuration page shows only `light` and `dark`, with no recipe |
| C. A `var()` layer under the palette | `main: 'var(--brand-primary)'`, redefined under `[data-brand]` | mirrors a brand alias collection most closely | needs native colour and relative-colour browser support; contrast computed in CSS may differ from JS |

Option C used to be closed, because `tonalOffset`, `augmentColor` and `alpha()` parse colour strings when the theme is created, and a `var()` isn't a colour they can parse. Native colour (see [CSS variables and native colour](#css-variables-and-native-colour)) moves that work into CSS. Its documentation page shows exactly this branded-button case, so C is now a documented path where browser support allows it.

Option A has one trap of its own. Merging a brand's component overrides with object spread loses the base theme's variants and pseudo-class styles. MUI's array form keeps them: `root: [base.MuiButton.styleOverrides.root, { … }]`. MUI also warns against deep-merge utilities, for performance.

If brand switching happens at app boundaries, build option A from generated tokens. **Prototype option C on one brand if a page ever has to show two brands at once, or if a CSS-class switch matters more than older browsers.**

---

## Stable class names

The stable contract is the `.Mui{Component}-{slot}` classes and eleven global `.Mui-{state}` classes: together they're a machine-readable variant grid, and the stable thing a parity check can target.

A parity check needs to find "the contained primary button, disabled" in a rendered page. The `class` attribute carries hashed names that differ between development and production builds, and a stable `.Mui*` part that doesn't. Only that part is safe to target.

The pattern is regular. Root is always `root`. An enum variant is prefixed by its prop (`colorPrimary`, `sizeLarge`); a boolean isn't (`fullWidth`).

v9 removed the combined classes. `.MuiButton-containedPrimary` is now `.MuiButton-contained.MuiButton-colorPrimary`, and the same goes for Alert and Chip. That turns 3 × 7 class names into 3 + 7: the stylesheet's version of a sparse grid.

The state classes are `.Mui-active`, `-checked`, `-completed`, `-disabled`, `-error`, `-expanded`, `-focusVisible`, `-focused`, `-readOnly`, `-required` and `-selected`. Each is always paired with a component class. `.Mui-disabled { opacity: .38 }` on its own reaches every disabled component in the app, MUI X grids included.

Target only the `.Mui*` part of a rendered class, and always pair a state class with a component class. **The contract holds only while the build uses MUI's styling engine**, which v9's stated move towards Emotion independence and Tailwind integration may change.

---

## Named deviations

Named deviations are the few places where the library and MUI genuinely disagree and the theme shouldn't paper over it: each is written down as a named deviation, so neither side looks wrong to the next reader.

The library says `Danger`; MUI says `error`. Neither file shows the mismatch on its own, and a reviewer who sees `color="error"` on a component documented as `Danger` can't tell whether it's a bug.

The toolkit's rule that component vocabulary matches token vocabulary (`~/Projects/toolkit/standards/figma-standard.md` rule 22) is why the pair must be recorded rather than left. Three items qualify:

| Item | Why it is acceptable |
|---|---|
| `Danger` in Figma, `error` in the theme | both defensible: `error` is MUI's key and can't be renamed without wrapping every component, while Joy UI itself uses `danger` |
| No press token in MUI | it needs a custom key; the ripple is a different model |
| The `State` axis | documentation of what code produces, never a prop (see [What the State axis models](what-the-state-axis-models.md)) |

Everything else in the library has a home in the theme; the [cheat sheet](#cheat-sheet) lists where each goes.

**Record `Danger` against `error` in every Feedback component's code-gen notes.** Do the same for the press token and the `State` axis wherever an engineer would otherwise go looking for them.

---

## Cheat sheet

| Figma | Theme |
|---|---|
| Ramp steps behind each colour | all four slots authored: `main`, `light`, `dark`, `contrastText` |
| Emphasis `soft · medium · strong` | extra palette keys, augmented |
| AA floor | `contrastThreshold: 4.5` |
| `States/Hover`, `States/Disabled` | `palette.action.*` per scheme, dark values of their own |
| `States/Press` | a custom `action.pressedOpacity` |
| Focus stroke | one global override on `.Mui-focusVisible` |
| Token names in code | `cssVariables: true`, target `--mui-palette-*` |
| Default size differs from `medium` | `defaultProps.size` per component |
| Five elevation levels | five `shadows` indices plus `defaultProps.elevation` |
| Radius scale | `shape` keys, augmented; numeric `sx` radius banned |
| Spacing scale | `spacing` array |
| Text styles | custom typography variants |
| No uppercase buttons | `typography.button.textTransform: 'none'` |
| Breakpoints, z-index | MUI's own, adopted |
| `Danger` | `error`, recorded as a deviation |

---

## The short version

MUI's palette gives each semantic colour four slots, and computes two of them if you let it; author all four from your ramp and add emphasis steps as typed keys. `palette.action` is the interaction-state layer: set it once, give dark mode roughly double the overlays, add a press key, and draw focus as one override on `.Mui-focusVisible` so it replaces MUI's indicator instead of doubling it.

Turn on CSS variables and treat `--mui-palette-*` as your pipeline's target. Native colour now lets a palette value be a `var()`, which makes a CSS brand layer viable where browser support allows; until you need two brands on one page, a generated theme per brand is the documented path. Adopt MUI's breakpoints and z-index, express spacing as an array, ban the numeric `sx` radius, switch off uppercase buttons, and generate `defaultProps` from your Figma defaults.

Write down for the engineers that `Danger` is `error`, that press has no native token, and that the `State` axis documents output rather than props. Everything here follows MUI's own documented rules; the choices between options (a theme per brand first, extending the palette rather than layering beside it) are judgements made for their reasons above.

---

## What to re-check later

Researched August 2026 against Material UI v9 documentation and source (`createPalette.js`, `createTypography.js`, `shadows.js`, `zIndex.js`), the v5 to v9 migration guides and the Joy UI v7 docs. The project figures come from one library's Foundations collections. Re-checked in November 2026.

- **MUI's versions.** As of November 2026, v9 is still the stable major (v9.0.0, April 2026; the toolkit's validator reads v9.4.0) and v10 is in preview. MUI's versions page lists v8 documentation with no release, against the v9 announcement's account of a jump from v7.
- **Native colour** in the pinned version: which release introduced it, and how channel tokens behave. Its documentation of external CSS variables as palette values was the largest change between August and November 2026, and it reopened the `var()` brand layer (option C) that the August research had closed.
- **Custom-named colour schemes**: still no Material UI recipe as of November 2026.
- **v10**, in preview: whether the class contract or palette shape changes.
- **Material Design 3** support: still forward-looking work in v9's announcement.
- **Pigment CSS**: alpha and on hold; a styling-engine change would move the class contract.
- **MUI Sync**: development stopped in 2024; not a pipeline to plan around.
- **Scope.** This compares MUI with its own siblings (Joy UI, Base UI), not across the industry; "consensus" here means within MUI's documented rules.
- **Where this came from.** This guide is the theme and colour half of an earlier MUI guide; its naming half was merged into [Naming inside a Figma component](naming-inside-figma-components.md) and the toolkit validator's MUI reference.

---

## Sources

**Primary: Material UI**

- [Material UI versions](https://mui.com/versions/)
- [Introducing Material UI v9](https://mui.com/blog/introducing-material-ui-v9/)
- [Upgrade to v9](https://mui.com/material-ui/migration/upgrade-to-v9/)
- [Palette](https://mui.com/material-ui/customization/palette/)
- [`createPalette.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/createPalette.js)
- [Default theme](https://mui.com/material-ui/customization/default-theme.md)
- [CSS theme variables: usage](https://mui.com/material-ui/customization/css-theme-variables/usage/)
- [CSS theme variables: configuration](https://mui.com/material-ui/customization/css-theme-variables/configuration/)
- [CSS theme variables: native colour](https://mui.com/material-ui/customization/css-theme-variables/native-color/)
- [Upgrade to native colour](https://mui.com/material-ui/migration/upgrade-to-native-color/)
- [MUI System CSS theme variables](https://mui.com/system/experimental-api/css-theme-variables/)
- [Typography](https://mui.com/material-ui/customization/typography/)
- [`createTypography.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/createTypography.js)
- [Spacing](https://mui.com/material-ui/customization/spacing.md)
- [Shape](https://mui.com/material-ui/customization/shape.md)
- [`shadows.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/shadows.js)
- [`zIndex.js`](https://raw.githubusercontent.com/mui/material-ui/master/packages/mui-material/src/styles/zIndex.js)
- [Breakpoints](https://mui.com/material-ui/customization/breakpoints.md)
- [How to customize](https://mui.com/material-ui/customization/how-to-customize/) (class names, state classes)
- [Building extensible themes](https://mui.com/material-ui/guides/building-extensible-themes.md)
- [Theming](https://mui.com/material-ui/customization/theming/)
- [Joy UI theme colours (v7)](https://v7.mui.com/joy-ui/customization/theme-colors/)
- [MD3 tracking issue #29345](https://github.com/mui/material-ui/issues/29345)
- [Material UI Sync](https://mui.com/material-ui/design-resources/material-ui-sync/)

**Toolkit**

- `~/Projects/toolkit/skills/component-validator/references/mui.md` (MU3, MU4, MU9, MU10)
- `~/Projects/toolkit/standards/figma-standard.md` rule 22
