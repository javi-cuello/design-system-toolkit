# Target: iOS — where a Figma component and SwiftUI disagree

SwiftUI first, UIKit where it differs. Each class has the same shape as the web set:

- **Figma allows:** what Figma can draw.
- **iOS does:** what the platform does, quoted from Apple's documentation or the Human Interface Guidelines.
- **Align:** *Figma*, *code* or *accept*.
- **Detect:** the signal the engine keys on.

Apple's pages were read through the JSON that backs each URL, and every quote was checked on the date in *Sources*.

## Contents

- [I1 · Stroke alignment](#i1--stroke-alignment) · [I2 · Corner smoothing](#i2--corner-smoothing-against-continuous) · [I3 · Line height](#i3--line-height) · [I4 · Letter spacing](#i4--letter-spacing) · [I5 · Dynamic Type](#i5--fixed-height-containers-against-dynamic-type)
- [I6 · Truncation](#i6--truncation-max-lines-shrink-to-fit) · [I7 · Fill](#i7--fill-against-proposal-based-layout) · [I8 · Absolute children](#i8--absolute-children-against-overlay) · [I9 · Shadows](#i9--shadows) · [I10 · Blur](#i10--blur-against-materials)
- [I11 · Colour](#i11--colour-profile-semantics-dark-mode) · [I12 · States](#i12--states-as-variants-against-buttonstyle) · [I13 · Hit target](#i13--hit-target-against-drawn-bounds) · [I14 · Safe areas](#i14--safe-areas) · [I15 · SF Symbols](#i15--sf-symbols-against-drawn-icons)
- [Sources](#sources)

## I1 · Stroke alignment

- **Figma allows:** inside, outside or centre ([stroke properties](https://help.figma.com/hc/en-us/articles/360049283914-Apply-and-adjust-stroke-properties)).
- **iOS does:** `Shape.stroke` "Traces the outline of this shape", with no alignment ([stroke](https://developer.apple.com/documentation/swiftui/shape/stroke(_:linewidth:antialiased:))). And `strokeBorder` is the "inner stroke", "equivalent to insetting `self` by `lineWidth / 2` and stroking" ([strokeBorder](https://developer.apple.com/documentation/swiftui/insettableshape/strokeborder(_:linewidth:antialiased:))). That makes plain `stroke` centred.
- **iOS borders:** for `View.border`, "By default, the border appears inside the bounds of this view" ([border](https://developer.apple.com/documentation/swiftui/view/border(_:width:))). `CALayer.borderWidth` "is drawn inset from the receiver's bounds" ([CALayer](https://developer.apple.com/documentation/quartzcore/calayer/borderwidth)). No outside stroke exists.
- **Align:** inside → *code* as drawn. Centre → *code*, `.stroke` in an `.overlay`, the outer half visible unless clipped. Outside → *Figma* to inside, or *accept* padding + border and the size change.
- **Detect:** any stroke not inside; an outside stroke under a clipping ancestor.

## I2 · Corner smoothing against `.continuous`

- **Figma allows:** smoothing 0–100 %, with an iOS preset of 60 % ([corner radius](https://help.figma.com/hc/en-us/articles/360050986854-Adjust-corner-radius-and-smoothing)).
- **iOS does:** `RoundedCornerStyle` has two cases, `.circular` and `.continuous` ([RoundedCornerStyle](https://developer.apple.com/documentation/swiftui/roundedcornerstyle)). `CALayer.cornerCurve` is the same ([cornerCurve](https://developer.apple.com/documentation/quartzcore/calayer/cornercurve)). Nothing in between.
- **Align:** *Figma* — smoothing is 0 or 60, nothing else. *Code* — 60 → `.continuous`, 0 → `.circular`. Other values *accept* and snap.
- **Detect:** smoothing that is neither 0 nor 0.6.

## I3 · Line height

- **Figma allows:** Auto, fixed px or % ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)).
- **iOS does:** no line-height API.
  - `lineSpacing` is "the amount of space between the bottom of one line and the top of the next". It adds to the font's own leading ([lineSpacing](https://developer.apple.com/documentation/swiftui/view/linespacing(_:))).
  - For `Font.leading(.tight/.loose)`, "For some fonts … has no effect" ([leading](https://developer.apple.com/documentation/swiftui/font/leading(_:))).
  - UIKit reaches `minimumLineHeight` and `lineHeightMultiple` through attributed strings only ([NSParagraphStyle](https://developer.apple.com/documentation/uikit/nsparagraphstyle/lineheightmultiple)).
  - The system styles carry their own leading: Body 17/22, Title 1 28/34, Caption 1 12/16 at Large ([HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography)).
- **Align:** *Figma* — Auto, or the HIG leading for each system style. *Code* — `lineSpacing(figma − natural)` only when positive, since negative is impossible in SwiftUI. Single-line text *accept*.
- **Detect:** a fixed or percent line height on a text layer.

## I4 · Letter spacing

- **Figma allows:** px or % ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)).
- **iOS does:** `.tracking` and `.kerning` in points, 0 = "system default" ([tracking](https://developer.apple.com/documentation/swiftui/view/tracking(_:))). And "the system font dynamically adjusts tracking at every point size" ([HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography)). So an explicit value overrides Apple's optical tracking, and does not scale with Dynamic Type.
- **Align:** *Figma* — 0 on system-font styles. *Code* — % × size / 100 into `.tracking`. *Accept* Apple's built-in.
- **Detect:** non-zero letter spacing on a text layer.

## I5 · Fixed-height containers against Dynamic Type

- **Figma allows:** fixed-height frames and fixed-size text boxes.
- **iOS does:**
  - "System fonts automatically support Dynamic Type". Body runs 14/19 to 17/22, and larger in accessibility sizes ([HIG typography](https://developer.apple.com/design/human-interface-guidelines/typography)).
  - `Font.custom(_:size:relativeTo:)` scales custom fonts, and `fixedSize:` does not ([custom](https://developer.apple.com/documentation/swiftui/font/custom(_:size:relativeto:))).
  - A `.frame(height:)` does not clip: "If the text is taller than the frame, its bounds may extend beyond" ([frame](https://developer.apple.com/documentation/swiftui/view/frame(width:height:alignment:))).
- **Align:** *Figma* — containers holding text hug vertically. Draw an accessibility-size variant for anything with a height budget. *Code* — `minHeight`, icons through `@ScaledMetric` ([ScaledMetric](https://developer.apple.com/documentation/swiftui/scaledmetric)). A clamped `dynamicTypeSize` is a named *accept*, never silent.
- **Detect:** a fixed-height frame with a text descendant; a text layer with fixed resizing.

## I6 · Truncation, max lines, shrink to fit

- **Figma allows:** tail truncation with Max lines on auto-height text ([text properties](https://help.figma.com/hc/en-us/articles/360039956634-Explore-text-properties)).
- **iOS does:**
  - `lineLimit` takes an Int or a range ([lineLimit](https://developer.apple.com/documentation/swiftui/view/linelimit(_:))).
  - `truncationMode` is head, middle or tail ([truncationMode](https://developer.apple.com/documentation/swiftui/view/truncationmode(_:))).
  - `minimumScaleFactor` shrinks "to a font size as small as half" ([minimumScaleFactor](https://developer.apple.com/documentation/swiftui/view/minimumscalefactor(_:))).
  - UIKit's `adjustsFontSizeToFitWidth` is single-line only ([UILabel](https://developer.apple.com/documentation/uikit/uilabel/adjustsfontsizetofitwidth)).
- **Align:** *Figma* — Max lines on every text that can receive long content. *Code* — `lineLimit` + `truncationMode`. Head, middle and scale-to-fit have no drawing: *accept* and describe.
- **Detect:** a text layer with truncation off inside a width-constrained parent; a fixed-width text with short sample content.

## I7 · Fill against proposal-based layout

- **Figma allows:** hug, fill, fixed, min and max ([auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)). Two fill siblings split evenly.
- **iOS does:** no fill; a stack proposes space and children take it.
  - "Views typically have a default priority of 0 which causes space to be apportioned evenly" ([layoutPriority](https://developer.apple.com/documentation/swiftui/view/layoutpriority(_:))).
  - A higher `layoutPriority` child gets "all the space offered to the parent minus the minimum space required for all its lower-priority children" (same page).
  - `.frame(maxWidth: .infinity)` is the fill idiom ([frame](https://developer.apple.com/documentation/swiftui/view/frame(minwidth:idealwidth:maxwidth:minheight:idealheight:maxheight:alignment:))).
- **Align:** *Figma* — one fill per axis per row where possible. *Code* — fill → `maxWidth: .infinity`, must-not-shrink → `layoutPriority` or `fixedSize`. *Accept* that two fill texts of unequal length will not split evenly.
- **Detect:** two or more fill siblings of which one is text; fixed width on text.

## I8 · Absolute children against `.overlay`

- **Figma allows:** ignore-auto-layout children at any position ([auto layout](https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout)).
- **iOS does:** no per-child opt-out in a stack.
  - `.overlay(alignment:)` layers "in front of this view" at one of nine anchors, with offsets beyond that through `.offset` ([overlay](https://developer.apple.com/documentation/swiftui/view/overlay(alignment:content:))).
  - Content outside the frame stays visible unless `.clipped()`: "any content that extends beyond the edges of the frame is still visible" ([clipped](https://developer.apple.com/documentation/swiftui/view/clipped(antialiased:))).
- **Align:** *Figma* — absolute children pinned to an anchor by constraints. *Code* — overlay + offset. A badge outside a clipping parent is cut in Figma and not in code: *accept* one or the other.
- **Detect:** an absolute child; an absolute child under a clipping parent.

## I9 · Shadows

- **Figma allows:** X, Y, blur, spread, colour, inner shadows, several per layer ([effects](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)).
- **iOS does:** `.shadow(color:radius:x:y:)`, with no spread and no inner ([shadow](https://developer.apple.com/documentation/swiftui/view/shadow(color:radius:x:y:))). The radius is Gaussian, and Apple documents no mapping from Figma's blur.
- **Align:** *Figma* — spread 0, no inner shadows, at most two per style. *Code* — one `.shadow` per effect. Spread *accept*, or emulate with a padded shape.
- **Detect:** an inner shadow; more than two effects; an effect without a style.

## I10 · Blur against materials

- **Figma allows:** layer blur, background blur, progressive blur ([effects](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers)).
- **iOS does:**
  - `.blur(radius:)` blurs the view itself ([blur](https://developer.apple.com/documentation/swiftui/view/blur(radius:opaque:))).
  - Background blur is a `Material`: "an effect that resembles heavily frosted glass" ([Material](https://developer.apple.com/documentation/swiftui/material)). It varies with light and dark, and blurs only "a background that's part of your app".
  - There are four standard materials, and Liquid Glass for the control layer only ([HIG materials](https://developer.apple.com/design/human-interface-guidelines/materials)).
- **Align:** *Figma* — draw a background blur as one of the named materials, not a tuned radius and fill. *Code* — `.background(.regularMaterial)`. *Accept* that radius and tint never match exactly.
- **Detect:** a background blur; a progressive blur.

## I11 · Colour: profile, semantics, dark mode

- **Figma allows:** sRGB by default, Display P3 by file setting ([colour profiles](https://help.figma.com/hc/en-us/articles/360039825114-Work-in-different-color-profiles)). Variables with modes.
- **iOS does:**
  - "SwiftUI colors use an extended sRGB color space", with `.displayP3` available ([Color](https://developer.apple.com/documentation/swiftui/color/init(_:red:green:blue:opacity:))).
  - Literal colours "don't have distinct light and dark appearances" ([same](https://developer.apple.com/documentation/swiftui/color/init(_:red:green:blue:opacity:))).
  - "Avoid hard-coding system color values". Semantic colours adapt to Dark Mode and Increased Contrast ([HIG colour](https://developer.apple.com/design/human-interface-guidelines/color), [HIG dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)).
- **Align:** *Figma* — every fill bound to a variable with light and dark modes, named after the semantic it plays. *Code* — asset-catalog colour sets or system colours. Increased Contrast and elevated-dark *accept* as system behaviour.
- **Detect:** an unbound solid fill on a component layer.

## I12 · States as variants against `ButtonStyle`

- **Figma allows:** a State axis and booleans ([component properties](https://help.figma.com/hc/en-us/articles/5579474826519-Explore-component-properties)).
- **iOS does:**
  - Pressed is `configuration.isPressed` in a `ButtonStyle` ([isPressed](https://developer.apple.com/documentation/swiftui/buttonstyleconfiguration/ispressed)).
  - Disabled is inherited through `.disabled` ([disabled](https://developer.apple.com/documentation/swiftui/view/disabled(_:))).
  - Focus comes through `@FocusState` and `isFocused` ([isFocused](https://developer.apple.com/documentation/swiftui/environmentvalues/isfocused)).
  - Hover exists only with a pointer.
- **Align:** *Figma* — one State axis, never a boolean `Pressed`. *Code* — one style reading `isPressed`, `isEnabled` and `isFocused`. A Hover variant: *accept* as iPad-only, or drop.
- **Detect:** a boolean named like a state; a State value of Hover.

## I13 · Hit target against drawn bounds

- **Figma allows:** the frame is the drawn size; there is no hit region.
- **iOS does:** default control size "44x44 pt", minimum "28x28 pt" ([HIG accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)). `.contentShape` extends hit-testing without changing the drawing ([contentShape](https://developer.apple.com/documentation/swiftui/view/contentshape(_:_:eofill:))).
- **Align:** *Figma* — interactive components at 44 pt in the tap axis, or a named `Hit area` frame. *Code* — `minHeight: 44` + `contentShape`. 28–44: *accept* and record.
- **Detect:** a component with a State axis whose root is under 44 pt in either axis.

## I14 · Safe areas

- **Figma allows:** absolute frames. Templates draw the safe area as a guide only ([HIG layout](https://developer.apple.com/design/human-interface-guidelines/layout)).
- **iOS does:**
  - "the SwiftUI layout system sizes and positions views to avoid certain safe areas". `.ignoresSafeArea` opts out ([ignoresSafeArea](https://developer.apple.com/documentation/swiftui/view/ignoressafearea(_:edges:))).
  - `List` rows carry system insets ([listRowInsets](https://developer.apple.com/documentation/swiftui/view/listrowinsets(_:))).
  - `.padding()` with no value is "a platform-specific default amount" ([padding](https://developer.apple.com/documentation/swiftui/view/padding(_:_:))).
- **Align:** *Figma* — screens separate a full-bleed background from a content frame padded by the safe-area values. Component padding is explicit. List-row and bar insets: *accept* as system-owned.
- **Detect:** not from a component tree; a screen-level read. Stated so the report does not claim it.

## I15 · SF Symbols against drawn icons

- **Figma allows:** vectors with fills. A flattened symbol loses weight, scale and rendering mode.
- **iOS does:** four rendering modes: monochrome, hierarchical, palette, multicolor ([SymbolRenderingMode](https://developer.apple.com/documentation/swiftui/symbolrenderingmode/hierarchical)). Nine weights matched to the font, and three scales. Symbols "scale automatically with Dynamic Type" ([HIG SF Symbols](https://developer.apple.com/design/human-interface-guidelines/sf-symbols)).
- **Align:** *Figma* — name the icon layer with the symbol name and weight, with one fill. *Code* — `Image(systemName:)` with a rendering mode. Custom vectors: *accept* that they do not scale unless `@ScaledMetric`.
- **Detect:** an icon instance with more than one distinct fill.

## Sources

| Kind | Sources | Read |
|---|---|---|
| SwiftUI shape and text | stroke, strokeBorder, border, RoundedCornerStyle, lineSpacing, Font.leading, lineLimit, truncationMode, minimumScaleFactor, kerning, tracking, Font.custom, ScaledMetric, dynamicTypeSize | 2026-08-22 |
| SwiftUI layout | fixedSize, layoutPriority, frame (fixed and flexible), overlay, clipped, padding, ignoresSafeArea, safeAreaInset, listRowInsets, contentShape, controlSize | 2026-08-22 |
| SwiftUI style and state | shadow, blur, Material, Color, ButtonStyle, isPressed, disabled, focused, isFocused, SymbolRenderingMode | 2026-08-22 |
| UIKit and QuartzCore | CALayer.borderWidth, cornerCurve, NSParagraphStyle, UIFontMetrics, UIColor.label, UIView.safeAreaInsets, UILabel | 2026-08-22 |
| HIG | Accessibility, typography, colour, dark mode, materials, layout, SF Symbols | 2026-08-22 |
| Figma Help | Strokes, corner radius, text properties, effects, auto layout, colour profiles, component properties, Dev Mode code snippets | 2026-08-22 |

Not found:

- what Figma's generated SwiftUI snippet emits for smoothed corners, stroke alignment, line height or tracking (Figma documents the panel, not the snippet);
- the numeric mapping from Figma blur to SwiftUI `radius`;
- UIKit `UIButton.Configuration` pages.
