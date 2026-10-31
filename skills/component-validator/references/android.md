# Target: Android — where a Figma component and Jetpack Compose disagree

Compose first, Views where they differ materially. Same shape as the other sets. Material 3 numbers are cited to Google's own Compose token source on GitHub (the m3.material.io site renders nothing to a fetcher); every quote was checked on 2026-08-22.

## A1 · Stroke alignment: borders are inside

**Figma allows:** inside, outside or centre; "Only inside strokes are counted in layout calculations" ([stroke properties](https://help.figma.com/hc/en-us/articles/360049283914-Apply-and-adjust-stroke-properties), [flows](https://help.figma.com/hc/en-us/articles/31289464393751-Use-the-horizontal-and-vertical-flows-in-auto-layout)).
**Compose does:** `Modifier.border(width, color, shape)` adds the border "and clip it" — no alignment parameter ([Modifier](https://developer.android.com/reference/kotlin/androidx/compose/ui/Modifier)); `Surface(border:)` is "drawn on top of the surface" ([Surface.kt](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Surface.kt)).
**Align:** *Figma* — inside, counted in layout; an intentional outside stroke *accept* as a padded parent `Box`.
**Detect:** any stroke not inside.

## A2 · Fill siblings need `weight`

**Figma allows:** hug, fill, fixed per axis ([auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)); two fill siblings divide the space.
**Compose does:** `fillMaxWidth` sets the minimum and maximum constraint to the incoming maximum, so the first fill child in a `Row` takes everything; sharing is `weight`, "only available in RowScope, and ColumnScope" ([modifiers](https://developer.android.com/develop/ui/compose/modifiers), [Modifier](https://developer.android.com/reference/kotlin/androidx/compose/ui/Modifier)).
**Align:** *code* — `weight(1f)` on each; *Figma* — nothing, but the mapping must say it.
**Detect:** two or more fill siblings in one auto-layout frame.

## A3 · Fixed heights and matched heights need intrinsics

**Figma allows:** a fill-height divider beside hugging text, or a text at a fixed height.
**Compose does:** "you should only measure your children once"; a `fillMaxHeight` divider beside wrapped text fills the screen unless the parent takes `height(IntrinsicSize.Min)` ([intrinsic measurements](https://developer.android.com/develop/ui/compose/layouts/intrinsic-measurements)).
**Align:** *code* — `IntrinsicSize.Min` on the parent; *Figma* — no fixed height on text that matches one sample.
**Detect:** a fixed-height text layer; a thin fill-height child among hug siblings.

## A4 · Line height

**Figma allows:** Auto, px or %; vertical trim ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)).
**Compose does:** `lineHeight` "distributes the line height in each line", em preferred over sp; `LineHeightStyle.Trim` removes the extra space and "can only work … with includeFontPadding = false", the default since BOM 2024.01.01 ([paragraph styling](https://developer.android.com/develop/ui/compose/text/style-paragraph), [Trim](https://developer.android.com/reference/kotlin/androidx/compose/ui/text/style/LineHeightStyle.Trim)). Views: `includeFontPadding` is a `TextView` attribute ([TextView](https://developer.android.com/reference/android/widget/TextView)).
**Align:** *Figma* — an explicit % or px on every text style, never Auto; *code* — % → em, px → sp; vertical trim → `Trim.Both`.
**Detect:** a text layer with Auto line height; text without a style.

## A5 · Letter spacing units

**Figma allows:** px or % ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)).
**Compose does:** `TextStyle(letterSpacing: TextUnit)` — sp or em only ([TextStyle](https://developer.android.com/reference/kotlin/androidx/compose/ui/text/TextStyle)); sp widens tracking with the user's font scale, em keeps the proportion.
**Align:** *Figma* — % in text styles so the conversion is exact; *code* — % → em, px → sp.
**Detect:** a non-zero letter spacing in px.

## A6 · Truncation

**Figma allows:** Truncate with Max lines on auto-height text ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)).
**Compose does:** `maxLines` and `overflow = TextOverflow.Ellipsis`, default clip ([configure layout](https://developer.android.com/develop/ui/compose/text/configure-layout)); a box whose sample fits in Figma wraps or grows in code.
**Align:** *Figma* — Truncate + Max lines on every single-line label; *code* — `maxLines` / `overflow`.
**Detect:** a text layer with truncation off inside a width-constrained parent; fixed-width text.

## A7 · sp, dp and non-linear font scaling

**Figma allows:** one canvas pixel; Dev Mode can emit dp or sp ([Dev Mode snippets](https://help.figma.com/hc/en-us/articles/15023202277399-Use-code-snippets-in-Dev-Mode)).
**Android does:** "Use sp only for text sizes, never for layout sizes" ([densities](https://developer.android.com/training/multiscreen/screendensities)); Android 14 scales fonts "up to 200%" on "a nonlinear scaling curve" ([Android 14](https://developer.android.com/about/versions/14/features#non-linear-font-scaling)). A row drawn to fit at 1× does not fit at 2×; icons in dp stay while text grows.
**Align:** *Figma* — no fixed-height container around text; *accept* that text scales and layout hugs.
**Detect:** a fixed-height frame with a text descendant.

## A8 · Shadows against elevation

**Figma allows:** X, Y, blur, spread, colour, inner, several per layer ([effects](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)).
**Compose does:** `Modifier.shadow(elevation, shape, …)` — one number, "the visual depth" ([Modifier](https://developer.android.com/reference/kotlin/androidx/compose/ui/Modifier)); Material `Surface` has `tonalElevation` ("a darker color in light theme and lighter color in dark theme") and `shadowElevation` ([Surface.kt](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Surface.kt)) at levels 0 / 1 / 3 / 6 / 8 / 12 dp ([ElevationTokens.kt](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ElevationTokens.kt)). `Modifier.dropShadow` with radius, spread and offset is in the current reference ([Modifier](https://developer.android.com/reference/kotlin/androidx/compose/ui/Modifier)); its stable version is not verified.
**Align:** *Figma* — effect styles named as elevation levels; *accept* the rendering; bespoke shadows *code* with `dropShadow` where the project's Compose has it.
**Detect:** an inner shadow; more than one drop shadow; an effect without a style.

## A9 · Blur

**Figma allows:** layer, background and progressive blur ([effects](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)).
**Compose does:** `Modifier.blur` "is only supported on Android 12 and above … ignored" below, and blurs the element's own content ([Modifier](https://developer.android.com/reference/kotlin/androidx/compose/ui/Modifier)); there is no background-blur modifier in the draw package.
**Align:** *accept* a translucent fill below API 31; *Figma* — no background blur on components that must look the same everywhere.
**Detect:** a background blur; a progressive blur.

## A10 · Gradients and blend modes

**Figma allows:** linear, radial, angular, diamond ([gradients](https://help.figma.com/hc/en-us/articles/34208860210199-Use-gradients-as-a-fill-or-stroke)); per-layer and per-fill blend modes ([blend modes](https://help.figma.com/hc/en-us/articles/360040667874-Apply-blend-modes-to-layers-fills-and-effects)).
**Compose does:** `Brush.linearGradient / radialGradient / sweepGradient` ([Brush](https://developer.android.com/develop/ui/compose/graphics/draw/brush)) — sweep for angular, no diamond; `BlendMode` is a draw-call parameter, not a layer property, with no plus-darker ([BlendMode](https://developer.android.com/reference/kotlin/androidx/compose/ui/graphics/BlendMode)).
**Align:** *code* — linear, radial, angular; *Figma* — diamond and per-fill blends become flat fills or an image.
**Detect:** a diamond gradient; a blend mode on a layer.

## A11 · Minimum touch target 48 dp is added by the framework

**Figma allows:** a 24 px icon button is 24 px.
**Compose does:** Material components "set this minimum size internally, but only when the component can receive user actions", and a smaller clickable still gets its target "expanding … outside of the boundaries of the composable" ([accessibility defaults](https://developer.android.com/develop/ui/compose/accessibility/api-defaults)); `minimumInteractiveComponentSize` "Reserves at least 48.dp" and affects layout ([Modifier](https://developer.android.com/reference/kotlin/androidx/compose/ui/Modifier)). A drawn 24 px checkbox measures 48 dp and shifts its neighbours.
**Align:** *Figma* — interactive leaves at 48, the icon inside; *accept* a tight one by setting `LocalMinimumInteractiveComponentSize` to 0, documented.
**Detect:** a component with a State axis whose root is under 48 in either axis.

## A12 · States are interactions and a state layer

**Figma allows:** a State axis and booleans ([component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)).
**Compose does:** a press "generates PressInteraction.Press" observed through an `InteractionSource` ([interactions](https://developer.android.com/develop/ui/compose/touch-input/user-interactions/handling-interactions)); Material `ripple()` draws "ripple animations and state layers" ([material3](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary)) at hover 0.08, focus 0.10, pressed 0.10, dragged 0.16 ([StateTokens.kt](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/StateTokens.kt)); disabled label 0.38, container 0.1 ([FilledButtonTokens.kt](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/FilledButtonTokens.kt)). A solid hover fill does not match a translucent layer over whatever is beneath.
**Align:** *Figma* — one State axis whose states are an overlay layer at the token opacities, disabled as alpha; *code* — `enabled` and the component's `colors()`.
**Detect:** a boolean named like a state.

## A13 · Dynamic colour

**Figma allows:** fixed values.
**Compose does:** "Dynamic color is available on Android 12 and above" through `dynamicLightColorScheme` ([Material 3](https://developer.android.com/develop/ui/compose/designsystems/material3)); every role colour may differ per device.
**Align:** decide once per project — dynamic on → *accept* all colour roles; off → *code* the Figma scheme; *Figma* — fills bound to role variables, never raw.
**Detect:** an unbound solid fill on a component layer.

## A14 · Icons: 24 dp, one tint

**Figma allows:** any size, multicolour vectors.
**Compose does:** `Icon` "draws bitmap using tint, with a default value of LocalContentColor" ([material3](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary)), default 24 dp ([Icon.kt](https://raw.githubusercontent.com/androidx/androidx/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/Icon.kt)); tint flattens to one colour.
**Align:** *Figma* — 24 (or 20 / 40), one fill bound to a content-colour variable; multicolour glyphs *accept* as `Image`.
**Detect:** an icon instance with more than one distinct fill; an icon not 20, 24, 40 or 48.

## A15 · Absolute children need a `Box`

**Figma allows:** ignore-auto-layout children ([auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)).
**Compose does:** no absolute child in `Row` or `Column`; a `Box` with `align`, `matchParentSize` or `offset` — "does not change its measurements" ([modifiers](https://developer.android.com/develop/ui/compose/modifiers)).
**Align:** *code* — the extra `Box`; *Figma* — the absolute child and its anchor in their own frame so the tree matches.
**Detect:** an absolute child.

## Sources

Primary, all read on 2026-08-22 — developer.android.com: modifiers guide, Modifier reference, layout basics, intrinsic measurements, paragraph styling, configure text layout, TextStyle, LineHeightStyle.Trim, TextView, screen densities, Android 14 features, accessibility API defaults, handling interactions, Material 3 in Compose, Brush, BlendMode, material3 package summary. androidx source: Surface.kt, Icon.kt, StateTokens.kt, FilledButtonTokens.kt, ElevationTokens.kt. Figma Help: strokes, flows, auto layout, text properties, effects, blend modes, gradients, component properties, Dev Mode snippets.

Not found: m3.material.io prose (the site renders nothing to a fetcher; the Compose token source stands in); a documentation sentence saying borders are "inside" (it says "and clip it"); the stable version that ships `Modifier.dropShadow`.
