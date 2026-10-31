# Target: iOS — where a Figma component and SwiftUI disagree

SwiftUI first, UIKit where it differs. Same shape as the web set: what Figma can draw, what the platform does (quoted from Apple's documentation or the Human Interface Guidelines), the alignment — **Figma**, **code**, or **accept** — and the signal the engine keys on. Apple's pages were read through the JSON that backs each URL; every quote was checked on 2026-08-22.

## I1 · Stroke alignment

**Figma allows:** inside, outside or centre ([stroke properties](https://help.figma.com/hc/en-us/articles/360049283914-Apply-and-adjust-stroke-properties)).
**iOS does:** `Shape.stroke` "Traces the outline of this shape" with no alignment — `strokeBorder` is the "inner stroke", "equivalent to insetting `self` by `lineWidth / 2` and stroking", which makes plain `stroke` centred ([stroke](https://developer.apple.com/documentation/swiftui/shape/stroke(_:linewidth:antialiased:)), [strokeBorder](https://developer.apple.com/documentation/swiftui/insettableshape/strokeborder(_:linewidth:antialiased:))). `View.border`: "By default, the border appears inside the bounds of this view" ([border](https://developer.apple.com/documentation/swiftui/view/border(_:width:))); `CALayer.borderWidth` "is drawn inset from the receiver's bounds" ([CALayer](https://developer.apple.com/documentation/quartzcore/calayer/borderwidth)). No outside stroke exists.
**Align:** inside → *code* as drawn. Centre → *code*, `.stroke` in an `.overlay`, the outer half visible unless clipped. Outside → *Figma* to inside, or *accept* padding + border and the size change.
**Detect:** any stroke not inside; an outside stroke under a clipping ancestor.

## I2 · Corner smoothing against `.continuous`

**Figma allows:** smoothing 0–100 %, iOS preset 60 % ([corner radius](https://help.figma.com/hc/en-us/articles/360050986854-Adjust-corner-radius-and-smoothing)).
**iOS does:** `RoundedCornerStyle` has two cases, `.circular` and `.continuous` ([RoundedCornerStyle](https://developer.apple.com/documentation/swiftui/roundedcornerstyle)); `CALayer.cornerCurve` the same ([cornerCurve](https://developer.apple.com/documentation/quartzcore/calayer/cornercurve)). Nothing in between.
**Align:** *Figma* — smoothing is 0 or 60, nothing else; *code* — 60 → `.continuous`, 0 → `.circular`; other values *accept* and snap.
**Detect:** smoothing that is neither 0 nor 0.6.

## I3 · Line height

**Figma allows:** Auto, fixed px or % ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)).
**iOS does:** no line-height API. `lineSpacing` is "the amount of space between the bottom of one line and the top of the next" — additive over the font's own leading ([lineSpacing](https://developer.apple.com/documentation/swiftui/view/linespacing(_:))); `Font.leading(.tight/.loose)` "For some fonts … has no effect" ([leading](https://developer.apple.com/documentation/swiftui/font/leading(_:))). UIKit reaches `minimumLineHeight` and `lineHeightMultiple` through attributed strings only ([NSParagraphStyle](https://developer.apple.com/documentation/uikit/nsparagraphstyle/lineheightmultiple)). The system styles carry their own leading — Body 17/22, Title 1 28/34, Caption 1 12/16 at Large ([HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography)).
**Align:** *Figma* — Auto, or the HIG leading for each system style; *code* — `lineSpacing(figma − natural)` only when positive, negative is impossible in SwiftUI; single-line text *accept*.
**Detect:** a fixed or percent line height on a text layer.

## I4 · Letter spacing

**Figma allows:** px or % ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)).
**iOS does:** `.tracking` and `.kerning` in points, 0 = "system default" ([tracking](https://developer.apple.com/documentation/swiftui/view/tracking(_:))); "the system font dynamically adjusts tracking at every point size" ([HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography)), so an explicit value overrides Apple's optical tracking and does not scale with Dynamic Type.
**Align:** *Figma* — 0 on system-font styles; *code* — % × size / 100 into `.tracking`; *accept* Apple's built-in.
**Detect:** non-zero letter spacing on a text layer.

## I5 · Fixed-height containers against Dynamic Type

**Figma allows:** fixed-height frames and fixed-size text boxes.
**iOS does:** "System fonts automatically support Dynamic Type"; Body runs 14/19 to 17/22 and larger in accessibility sizes ([HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography)); `Font.custom(_:size:relativeTo:)` scales custom fonts, `fixedSize:` does not ([custom](https://developer.apple.com/documentation/swiftui/font/custom(_:size:relativeto:))); a `.frame(height:)` does not clip — "If the text is taller than the frame, its bounds may extend beyond" ([frame](https://developer.apple.com/documentation/swiftui/view/frame(width:height:alignment:))).
**Align:** *Figma* — containers holding text hug vertically; draw an accessibility-size variant for anything with a height budget; *code* — `minHeight`, icons via `@ScaledMetric` ([ScaledMetric](https://developer.apple.com/documentation/swiftui/scaledmetric)); a clamped `dynamicTypeSize` is a named *accept*, never silent.
**Detect:** a fixed-height frame with a text descendant; a text layer with fixed resizing.

## I6 · Truncation, max lines, shrink to fit

**Figma allows:** tail truncation with Max lines on auto-height text ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)).
**iOS does:** `lineLimit` (an Int or a range) ([lineLimit](https://developer.apple.com/documentation/swiftui/view/linelimit(_:))), `truncationMode` head / middle / tail ([truncationMode](https://developer.apple.com/documentation/swiftui/view/truncationmode(_:))), `minimumScaleFactor` shrinking "to a font size as small as half" ([minimumScaleFactor](https://developer.apple.com/documentation/swiftui/view/minimumscalefactor(_:))); UIKit `adjustsFontSizeToFitWidth` is single-line only ([UILabel](https://developer.apple.com/documentation/uikit/uilabel/adjustsfontsizetofitwidth)).
**Align:** *Figma* — Max lines on every text that can receive long content; *code* — `lineLimit` + `truncationMode`; head, middle and scale-to-fit have no drawing, *accept* and describe.
**Detect:** a text layer with truncation off inside a width-constrained parent; a fixed-width text with short sample content.

## I7 · Fill against proposal-based layout

**Figma allows:** hug, fill, fixed, min and max ([auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)); two fill siblings split evenly.
**iOS does:** no fill; a stack proposes space and children take it. "Views typically have a default priority of 0 which causes space to be apportioned evenly", but a higher `layoutPriority` child gets "all the space offered to the parent minus the minimum space required for all its lower-priority children" ([layoutPriority](https://developer.apple.com/documentation/swiftui/view/layoutpriority(_:))); `.frame(maxWidth: .infinity)` is the fill idiom ([frame](https://developer.apple.com/documentation/swiftui/view/frame(minwidth:idealwidth:maxwidth:minheight:idealheight:maxheight:alignment:))).
**Align:** *Figma* — one fill per axis per row where possible; *code* — fill → `maxWidth: .infinity`, must-not-shrink → `layoutPriority` or `fixedSize`; *accept* that two fill texts of unequal length will not split evenly.
**Detect:** two or more fill siblings of which one is text; fixed width on text.

## I8 · Absolute children against `.overlay`

**Figma allows:** ignore-auto-layout children at any position ([auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)).
**iOS does:** no per-child opt-out in a stack; `.overlay(alignment:)` layers "in front of this view" at one of nine anchors, offsets beyond that via `.offset` ([overlay](https://developer.apple.com/documentation/swiftui/view/overlay(alignment:content:))); content outside the frame stays visible — "any content that extends beyond the edges of the frame is still visible" — unless `.clipped()` ([clipped](https://developer.apple.com/documentation/swiftui/view/clipped(antialiased:))).
**Align:** *Figma* — absolute children pinned to an anchor by constraints; *code* — overlay + offset; a badge outside a clipping parent is cut in Figma and not in code, *accept* one or the other.
**Detect:** an absolute child; an absolute child under a clipping parent.

## I9 · Shadows

**Figma allows:** X, Y, blur, spread, colour, inner shadows, several per layer ([effects](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)).
**iOS does:** `.shadow(color:radius:x:y:)` — no spread, no inner ([shadow](https://developer.apple.com/documentation/swiftui/view/shadow(color:radius:x:y:))); the radius is Gaussian, and Apple documents no mapping from Figma's blur.
**Align:** *Figma* — spread 0, no inner shadows, at most two per style; *code* — one `.shadow` per effect; spread *accept* or emulate with a padded shape.
**Detect:** an inner shadow; more than two effects; an effect without a style.

## I10 · Blur against materials

**Figma allows:** layer blur, background blur, progressive blur ([effects](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)).
**iOS does:** `.blur(radius:)` blurs the view itself ([blur](https://developer.apple.com/documentation/swiftui/view/blur(radius:opaque:))); background blur is a `Material` — "an effect that resembles heavily frosted glass", varying with light and dark, blurring only "a background that's part of your app" ([Material](https://developer.apple.com/documentation/swiftui/material)); four standard materials, and Liquid Glass for the control layer only ([HIG materials](https://developer.apple.com/design/human-interface-guidelines/materials)).
**Align:** *Figma* — draw a background blur as one of the named materials, not a tuned radius and fill; *code* — `.background(.regularMaterial)`; *accept* that radius and tint never match exactly.
**Detect:** a background blur; a progressive blur.

## I11 · Colour: profile, semantics, dark mode

**Figma allows:** sRGB by default, Display P3 by file setting ([colour profiles](https://help.figma.com/hc/en-us/articles/360039825114-Work-in-different-color-profiles)); variables with modes.
**iOS does:** "SwiftUI colors use an extended sRGB color space", `.displayP3` available ([Color](https://developer.apple.com/documentation/swiftui/color/init(_:red:green:blue:opacity:))); literal colours "don't have distinct light and dark appearances" ([same](https://developer.apple.com/documentation/swiftui/color/init(_:red:green:blue:opacity:))); "Avoid hard-coding system color values" and semantic colours adapt to Dark Mode and Increased Contrast ([HIG colour](https://developer.apple.com/design/human-interface-guidelines/color), [HIG dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)).
**Align:** *Figma* — every fill bound to a variable with light and dark modes, named after the semantic it plays; *code* — asset-catalog colour sets or system colours; Increased Contrast and elevated-dark *accept* as system behaviour.
**Detect:** an unbound solid fill on a component layer.

## I12 · States as variants against `ButtonStyle`

**Figma allows:** a State axis and booleans ([component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)).
**iOS does:** pressed is `configuration.isPressed` in a `ButtonStyle` ([isPressed](https://developer.apple.com/documentation/swiftui/buttonstyleconfiguration/ispressed)); disabled is inherited through `.disabled` ([disabled](https://developer.apple.com/documentation/swiftui/view/disabled(_:))); focus through `@FocusState` and `isFocused` ([isFocused](https://developer.apple.com/documentation/swiftui/environmentvalues/isfocused)). Hover exists only with a pointer.
**Align:** *Figma* — one State axis, never a boolean `Pressed`; *code* — one style reading `isPressed` / `isEnabled` / `isFocused`; a Hover variant *accept* as iPad-only or drop.
**Detect:** a boolean named like a state; a State value of Hover.

## I13 · Hit target against drawn bounds

**Figma allows:** the frame is the drawn size; there is no hit region.
**iOS does:** default control size "44x44 pt", minimum "28x28 pt" ([HIG accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)); `.contentShape` extends hit-testing without changing the drawing ([contentShape](https://developer.apple.com/documentation/swiftui/view/contentshape(_:_:eofill:))).
**Align:** *Figma* — interactive components at 44 pt in the tap axis, or a named `Hit area` frame; *code* — `minHeight: 44` + `contentShape`; 28–44 *accept* and record.
**Detect:** a component with a State axis whose root is under 44 pt in either axis.

## I14 · Safe areas

**Figma allows:** absolute frames; templates draw the safe area as a guide only ([HIG layout](https://developer.apple.com/design/human-interface-guidelines/layout)).
**iOS does:** "the SwiftUI layout system sizes and positions views to avoid certain safe areas"; `.ignoresSafeArea` opts out ([ignoresSafeArea](https://developer.apple.com/documentation/swiftui/view/ignoressafearea(_:edges:))); `List` rows carry system insets ([listRowInsets](https://developer.apple.com/documentation/swiftui/view/listrowinsets(_:))); `.padding()` with no value is "a platform-specific default amount" ([padding](https://developer.apple.com/documentation/swiftui/view/padding(_:_:))).
**Align:** *Figma* — screens separate a full-bleed background from a content frame padded by the safe-area values; component padding explicit; list-row and bar insets *accept* as system-owned.
**Detect:** not from a component tree; a screen-level read. Stated so the report does not claim it.

## I15 · SF Symbols against drawn icons

**Figma allows:** vectors with fills; a flattened symbol loses weight, scale and rendering mode.
**iOS does:** four rendering modes — monochrome, hierarchical, palette, multicolor ([SymbolRenderingMode](https://developer.apple.com/documentation/swiftui/symbolrenderingmode/hierarchical)); nine weights matched to the font, three scales, and symbols "scale automatically with Dynamic Type" ([HIG SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)).
**Align:** *Figma* — name the icon layer with the symbol name and weight, one fill; *code* — `Image(systemName:)` with a rendering mode; custom vectors *accept* that they do not scale unless `@ScaledMetric`.
**Detect:** an icon instance with more than one distinct fill.

## Sources

Primary, all read on 2026-08-22 — SwiftUI: stroke, strokeBorder, border, RoundedCornerStyle, lineSpacing, Font.leading, lineLimit, truncationMode, minimumScaleFactor, fixedSize, layoutPriority, frame (fixed and flexible), overlay, clipped, padding, shadow, blur, Material, kerning, tracking, Color, ButtonStyle, isPressed, disabled, focused, isFocused, ignoresSafeArea, safeAreaInset, listRowInsets, contentShape, controlSize, SymbolRenderingMode, dynamicTypeSize, Font.custom, ScaledMetric. UIKit and QuartzCore: CALayer.borderWidth, cornerCurve, NSParagraphStyle, UIFontMetrics, UIColor.label, UIView.safeAreaInsets, UILabel. HIG: accessibility, typography, colour, dark mode, materials, layout, SF Symbols. Figma Help: strokes, corner radius, text properties, effects, auto layout, colour profiles, component properties, Dev Mode code snippets.

Not found: what Figma's generated SwiftUI snippet emits for smoothed corners, stroke alignment, line height or tracking (Figma documents the panel, not the snippet); the numeric mapping from Figma blur to SwiftUI `radius`; UIKit `UIButton.Configuration` pages.
