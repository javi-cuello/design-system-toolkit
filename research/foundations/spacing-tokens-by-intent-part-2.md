# Spacing tokens by intent: platforms, Figma and migration

How a spacing model of primitives and roles reaches CSS, Compose, SwiftUI and Figma variables, and how a library gets there from the tokens it already has.

*Part 2 of 2. [Part 1](spacing-tokens-by-intent.md) builds the model: the primitive scale, the roles on top, and how components, layouts and screen sizes use them.*

The team from Part 1 has its model: a 4px scale from `space-100` to `space-1600`, and `padding`, `gap` and `page-margin` roles aliasing it. Now the model has to ship. The web team, the Android team and the iOS team each type their own numbers, the Figma library offers forty number variables in every padding field, 15px, 18px and 22px are typed straight into frames, and two older tokens called `spacing-medium` mean 16px in one file and 8px in another.

---

## What this answers

**Shipping it**
- [One model, three platforms](#one-model-three-platforms): how one token becomes CSS, Compose and SwiftUI
- [Spacing in Figma variables](#spacing-in-figma-variables): collections, scopes, modes and code syntax

**Getting there**
- [Auditing what exists](#auditing-what-exists): finding every space a library and its code use today
- [Migrating old tokens](#migrating-old-tokens): moving names and values without breaking screens
- [Documenting the model](#documenting-the-model): what each token's page should say

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is this part in two paragraphs.

---

# Shipping it

## One model, three platforms

A platform-agnostic token is a name, a number and a unit; each platform's build turns it into rem, dp or pt, and the role words map onto each platform's own layout tools.

The scene: the same card ships on web, Android and iOS. Designers bind `padding-md` in Figma. The web team writes `padding: 16px`, Android writes `16.dp`, iOS writes `16`. Three numbers that agree today and three places to forget when compact mode arrives.

The token format sets the common ground. The W3C DTCG Format Module (2025.10, a final Community Group report of 28 October 2025) has a `dimension` type with a value and a unit, and the unit must be `px` or `rem`; there is no `spacing` type and no viewport unit.

Style Dictionary then converts per platform: `size/pxToRem` for CSS (base 16), `size/dp` and `size/compose/remToDp` for Android, `size/swift/remToCGFloat` for iOS. Its own documentation says DTCG 2025.10's object form is not fully supported yet, so check what the build emits.

Here is one token taking that path.

<svg role="img" viewBox="0 0 640 272" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>One DTCG dimension token, padding-lg at 24px, built three ways: 1.5rem in CSS, 24.dp in Compose and a 24-point CGFloat in SwiftUI, each used as padding</title><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5e6c84"/></marker></defs><rect x="0" y="0" width="640" height="272" fill="#ffffff"/><rect x="220" y="20" width="200" height="64" rx="8" fill="#eae6ff" stroke="none" stroke-width="1"/><text x="320" y="46" font-family="monospace" font-size="14" fill="#172b4d" text-anchor="middle" font-weight="bold">padding-lg</text><text x="320" y="68" font-family="monospace" font-size="10" fill="#5e6c84" text-anchor="middle" font-weight="normal">$type dimension · value 24, unit px</text><line x1="320" y1="86" x2="110" y2="140" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="20" y="144" width="180" height="86" rx="8" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><text x="110" y="166" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">Web, size/pxToRem</text><text x="110" y="192" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="bold">--padding-lg: 1.5rem</text><text x="110" y="216" font-family="monospace" font-size="10" fill="#5e6c84" text-anchor="middle" font-weight="normal">padding-inline, padding-block</text><line x1="320" y1="86" x2="320" y2="140" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="230" y="144" width="180" height="86" rx="8" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><text x="320" y="166" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">Android, size/dp</text><text x="320" y="192" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="bold">paddingLg = 24.dp</text><text x="320" y="216" font-family="monospace" font-size="10" fill="#5e6c84" text-anchor="middle" font-weight="normal">Modifier.padding(paddingLg)</text><line x1="320" y1="86" x2="530" y2="140" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="440" y="144" width="180" height="86" rx="8" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><text x="530" y="166" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">iOS, size/swift/…</text><text x="530" y="192" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="middle" font-weight="bold">paddingLg: CGFloat = 24</text><text x="530" y="216" font-family="monospace" font-size="10" fill="#5e6c84" text-anchor="middle" font-weight="normal">.padding(paddingLg)</text><text x="320" y="258" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">Style Dictionary transforms; the number changes unit, the name keeps its words.</text></svg>

The number changes unit on the way out; the name keeps its words, so a designer saying `padding-lg` and an engineer reading `paddingLg` mean the same field.

The roles map cleanly onto each platform:

| Role | CSS | Jetpack Compose | SwiftUI |
|---|---|---|---|
| padding | `padding-block`, `padding-inline` | `Modifier.padding(PaddingValues(...))` | `.padding(EdgeInsets(...))` |
| gap (vertical) | `gap` on a column | `Column(verticalArrangement = Arrangement.spacedBy(x))` | `VStack(spacing: x)` |
| gap (horizontal) | `gap` on a row | `Row(horizontalArrangement = Arrangement.spacedBy(x))` | `HStack(spacing: x)` |

Direction matters in all three. CSS logical properties (`padding-inline-start`), Compose's `start` and `end`, and SwiftUI's `leading` and `trailing` flip in right-to-left layouts; Compose's `PaddingValues.Absolute` and CSS's physical `padding-left` do not. Figma's padding fields are physical (`paddingLeft`), so a component padded unevenly in Figma has to be named by start and end in code.

Units behave differently too. A rem value grows when a reader raises the browser's text size; a dp or pt value does not. That is usually right for the web, where space should grow with text, but it means the same token renders differently under text scaling on each platform.

The worked case, with the scene's card in its two modes:

```css
/* Web: rem, mobile first */
:root { --space-400: 1rem; --space-600: 1.5rem; --padding-lg: var(--space-400); }
@media (min-width: 40rem) { :root { --padding-lg: var(--space-600); } }
.card { padding-block: var(--padding-lg); padding-inline: var(--padding-lg); }
```

```kotlin
// Compose: the mode is a runtime switch on the window size class
val paddingLg = if (widthAtLeastMedium) 24.dp else 16.dp
Column(Modifier.padding(paddingLg), verticalArrangement = Arrangement.spacedBy(gapMd)) { /* ... */ }
```

```swift
// SwiftUI: the mode is the horizontal size class
let paddingLg: CGFloat = sizeClass == .regular ? 24 : 16
VStack(spacing: gapMd) { /* ... */ }.padding(paddingLg)
```

The breakpoint differs: 640px (40rem) in this CSS, 600dp for Android's medium width class. Figma's two modes carry no width at all, so each platform picks its own threshold, and the documentation has to say which.

**Store every spacing token as a DTCG `dimension` in px, generate rem, dp and pt from it, and name every side by start and end, never left and right.** Write the breakpoint each platform uses beside the role table, since no token carries it. *Weight: moderate.* The DTCG format and Style Dictionary's transforms are shipped and documented; the platform mapping is each platform's own API.

---

## Spacing in Figma variables

In Figma, primitives and roles are two number-variable collections: primitives hidden and unscoped, roles scoped to gap with a mode per density or breakpoint, each carrying its code name.

The scene: designers can pick any of 40 number variables in the padding field, including radii, icon sizes and grid column widths. Half the cards use `space/400`, half `padding/md`, and nobody can tell which was meant.

Figma's mechanics, as of November 2026:

- **Bindable fields.** Auto-layout gap (`itemSpacing`), wrap gap (`counterAxisSpacing`), each padding side, and grid row and column gaps can all be bound to a number variable.
- **Scopes.** A number variable's scopes decide which pickers show it. The plugin API has a `GAP` scope and no separate padding scope, while Figma's help page lists gap and padding under auto layout; reports differ on whether a `GAP` variable reaches the padding picker, so check it in your own file. Scope primitives to nothing, so they never appear.
- **Hiding.** A collection or a single variable can be hidden from publishing, and aliases to it still resolve.
- **Aliasing.** A variable can point at another of the same type, across collections and libraries.
- **Modes.** Up to 10 per collection on Professional, 20 on Organization, unlimited on Enterprise. Three breakpoints times two densities is six; put density and breakpoint in separate collections if both apply.
- **Code syntax.** Each variable can carry a name for Web, Android and iOS, shown in Dev Mode. It is display only and generates nothing.
- **Units and negatives.** Number variables have no unit (the export assigns px), and may be negative: Figma's own Simple Design System has `space/negative-100` to `negative-600`.

The worked case, set up as two collections:

```
Primitives (1 mode, hidden from publishing, no scopes)
  space/100   4        code syntax WEB: var(--space-100)
  space/400  16
  space/600  24

Spacing (modes: Comfortable | Compact; scope: Gap)
  padding/md         → space/400 | space/300   WEB: var(--padding-md)   ANDROID: Spacing.paddingMd
  padding/lg         → space/600 | space/400
  gap/md             → space/400 | space/200
  gap/horizontal/sm  → space/200 | space/100
```

Here is what that looks like in Figma's variables panel, drawn as a sketch.

<svg role="img" viewBox="0 0 640 310" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A sketch of Figma’s variables panel: a hidden Primitives collection and a Spacing collection whose roles alias primitives, one column per mode, Comfortable and Compact</title><rect x="0" y="0" width="640" height="310" fill="#ffffff"/><rect x="10" y="10" width="620" height="290" rx="8" fill="#ffffff" stroke="#d9d9d9" stroke-width="1"/><rect x="10" y="10" width="620" height="32" rx="8" fill="#fafafa" stroke="none" stroke-width="1"/><text x="26" y="31" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Local variables</text><line x1="170" y1="42" x2="170" y2="300" stroke="#e6e6e6" stroke-width="1"/><text x="24" y="64" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Collections</text><text x="28" y="88" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">Primitives</text><text x="110" y="88" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">hidden</text><rect x="18" y="98" width="144" height="24" rx="4" fill="#e5f4ff" stroke="none" stroke-width="1"/><text x="28" y="115" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Spacing</text><text x="190" y="64" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Name</text><text x="380" y="64" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Comfortable</text><text x="510" y="64" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Compact</text><line x1="180" y1="72" x2="620" y2="72" stroke="#e6e6e6" stroke-width="1"/><text x="190" y="92" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">padding</text><text x="190" y="116" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">#</text><text x="204" y="116" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">padding/md</text><rect x="374" y="102" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="382" y="116" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/400</text><rect x="504" y="102" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="512" y="116" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/300</text><text x="190" y="142" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">#</text><text x="204" y="142" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">padding/lg</text><rect x="374" y="128" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="382" y="142" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/600</text><rect x="504" y="128" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="512" y="142" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/400</text><text x="190" y="168" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">gap</text><text x="190" y="192" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">#</text><text x="204" y="192" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">gap/md</text><rect x="374" y="178" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="382" y="192" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/400</text><rect x="504" y="178" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="512" y="192" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/200</text><text x="190" y="218" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">gap/horizontal</text><text x="190" y="242" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">#</text><text x="204" y="242" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">gap/horizontal/sm</text><rect x="374" y="228" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="382" y="242" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/200</text><rect x="504" y="228" width="92" height="20" rx="4" fill="#f0f0f0" stroke="none" stroke-width="1"/><text x="512" y="242" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space/100</text><text x="190" y="290" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">A sketch of Figma’s variables panel; labels may differ in your version.</text></svg>

Primitives sits in the sidebar, hidden from publishing. The Spacing collection lists each role once, with an alias chip under each mode instead of a number. Figma's own reference file keeps its scale in one `@size` collection (`space/050` to `space/4000`) and its responsive values in a separate collection.

And here is a card on the canvas with its auto-layout fields bound, beside the settings of the variable it uses.

<svg role="img" viewBox="0 0 640 306" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A sketch of a card frame in Figma with padding and gap bound to the padding/lg and gap/md variables, beside the variable’s settings: scoping set to Gap only, and code syntax for Web and Android</title><rect x="0" y="0" width="640" height="306" fill="#ffffff"/><text x="20" y="30" font-family="sans-serif" font-size="11" fill="#0d99ff" text-anchor="start" font-weight="normal">Card</text><rect x="20" y="36" width="250.0" height="146.2" rx="5.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="20.0" y="36.0" width="250.0" height="20.4" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="20.0" y="161.8" width="250.0" height="20.4" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="20.0" y="56.4" width="20.4" height="105.39999999999999" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="249.6" y="56.4" width="20.4" height="105.39999999999999" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="40.4" y="71.69999999999999" font-family="sans-serif" font-size="16.15" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><rect x="40.4" y="76.8" width="209.2" height="6.8" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><text x="40.4" y="96.35" font-family="sans-serif" font-size="11.9" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="40.4" y="113.35" font-family="sans-serif" font-size="11.9" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="40.4" y="117.6" width="209.2" height="13.6" rx="0" fill="#36b37e" stroke="none" stroke-width="1" opacity="0.4"/><rect x="40.4" y="131.2" width="68.0" height="30.599999999999998" rx="3.4" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="74.4" y="150.75" font-family="sans-serif" font-size="11.9" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="115.2" y="131.2" width="68.0" height="30.599999999999998" rx="3.4" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="149.2" y="150.75" font-family="sans-serif" font-size="11.9" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><rect x="20" y="36" width="250" height="146.2" rx="0" fill="none" stroke="#0d99ff" stroke-width="1.5"/><rect x="290" y="16" width="170" height="282" rx="6" fill="#ffffff" stroke="#d9d9d9" stroke-width="1"/><text x="302" y="40" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Auto layout</text><text x="302" y="70" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Gap</text><rect x="302" y="78" width="146" height="22" rx="4" fill="#f1edff" stroke="#6554c0" stroke-width="1"/><text x="310" y="93" font-family="monospace" font-size="11" fill="#6554c0" text-anchor="start" font-weight="normal">gap/md</text><text x="302" y="126" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Horizontal padding</text><rect x="302" y="134" width="146" height="22" rx="4" fill="#f1edff" stroke="#6554c0" stroke-width="1"/><text x="310" y="149" font-family="monospace" font-size="11" fill="#6554c0" text-anchor="start" font-weight="normal">padding/lg</text><text x="302" y="178" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Vertical padding</text><rect x="302" y="186" width="146" height="22" rx="4" fill="#f1edff" stroke="#6554c0" stroke-width="1"/><text x="310" y="201" font-family="monospace" font-size="11" fill="#6554c0" text-anchor="start" font-weight="normal">padding/lg</text><text x="302" y="236" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">Fields show a variable</text><text x="302" y="250" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">chip, not a number.</text><rect x="476" y="16" width="154" height="282" rx="6" fill="#ffffff" stroke="#d9d9d9" stroke-width="1"/><text x="488" y="40" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Edit variable</text><text x="488" y="62" font-family="monospace" font-size="12" fill="#172b4d" text-anchor="start" font-weight="normal">padding/lg</text><text x="488" y="88" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Scoping</text><rect x="488" y="100" width="11" height="11" rx="2" fill="#0d99ff" stroke="#0d99ff" stroke-width="1"/><text x="506" y="110" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">Gap</text><rect x="488" y="122" width="11" height="11" rx="2" fill="#ffffff" stroke="#b3b3b3" stroke-width="1"/><text x="506" y="132" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">Corner radius</text><rect x="488" y="144" width="11" height="11" rx="2" fill="#ffffff" stroke="#b3b3b3" stroke-width="1"/><text x="506" y="154" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">Width and height</text><rect x="488" y="166" width="11" height="11" rx="2" fill="#ffffff" stroke="#b3b3b3" stroke-width="1"/><text x="506" y="176" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">Stroke</text><text x="488" y="202" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Code syntax</text><text x="488" y="222" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">Web</text><text x="488" y="236" font-family="monospace" font-size="10" fill="#172b4d" text-anchor="start" font-weight="normal">var(--padding-lg)</text><text x="488" y="254" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">Android</text><text x="488" y="268" font-family="monospace" font-size="10" fill="#172b4d" text-anchor="start" font-weight="normal">Spacing.paddingLg</text><text x="488" y="286" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">iOS: Spacing.paddingLg</text></svg>

The gap and padding fields show variable chips rather than numbers; the heading and its details sit in a nested frame whose gap is bound to `gap/sm`. The variable is scoped to Gap alone, and its code syntax carries one name per platform.

To set this up in your own file (Figma as of November 2026; menu labels move between releases):

1. Open the variables panel and create a collection named `Primitives` with one mode. Add a number variable per step, `space/100` (4) to `space/1600` (64).
2. Select all of them, edit them together, and clear every scope, so no picker offers a primitive.
3. Mark the collection hidden from publishing; aliases into it keep working.
4. Create a second collection, `Spacing`. Rename its first mode `Comfortable` and add a mode `Compact` (and, in a separate collection, breakpoint modes if you need them).
5. Add each role as a number variable (`padding/md`, `padding/lg`, `gap/md`, `gap/horizontal/sm`, `page/margin`) and, in each mode's cell, choose an alias to a primitive instead of typing a number.
6. Edit each role: under scoping, tick Gap only, then check that your padding picker offers it (reports differ); under code syntax, enter the Web, Android and iOS names your build generates.
7. On each component, select the frame, and in the auto-layout section bind the gap and each padding field to a role through the variable picker.
8. To preview compact, set the frame's or the page's mode for the `Spacing` collection to Compact; every bound field follows.

Figma also has Check designs (early access announced October 2025, launched 4 June 2026 for Organization and Enterprise), which flags hard-coded spacing and suggests the closest variable, a page at a time. It is a useful first pass and an imperfect one: forum reports have it suggesting a radius token for a gap.

**Set up two collections, primitives hidden and unscoped, roles scoped to Gap with density or breakpoint modes, and give every role variable its code syntax for each platform you ship.** The gap picker then shows only roles, the code name matches the token the build generates, and a mode switch on a frame previews a whole density. *Weight: moderate.* Scopes, hiding, aliasing and code syntax are Figma's documented API; the overlap of gap and padding is reported rather than documented, so check it in your own file before relying on it.

---

# Getting there

## Auditing what exists

An audit counts every space in use, in Figma and in code, and sorts each into exact match, near match, legacy token, dynamic value or off-scale value.

The scene's library has 15px, 18px and 22px typed into frames, two meanings of `spacing-medium`, and a helper function in code that multiplies a grid unit. Before any new name is chosen, the team needs to know how much of each there is, because the mapping table is built from what is used, not from what is defined.

**In Figma**, walk every auto-layout frame and read `itemSpacing`, `counterAxisSpacing`, the four padding sides and the grid gaps. A field with a non-zero value and nothing in `boundVariables` is unbound; record its value and where it is. Figma's library analytics API reports bound variable usage but never unbound values, so the walk is what finds the raw ones.

**In code**, run a linter in report-only mode. Atlassian's `ensure-design-token-usage` checks a `spacing` domain, resolves a bare `gridSize()` to 8px and does the arithmetic (`gridSize() * 2` is 16), and skips any call with arguments. Polaris's stylelint config bans px, rem and em on padding, margin and gap. Primer's `primer/spacing` rule accepts anything within 1px of a base size. Mozilla's `use-design-tokens` rule warns that a px value equals its rem token only at a 16px root.

Here is what the Figma walk finds on one card, with an illustrative tally for a whole library beside it.

<svg role="img" viewBox="0 0 640 250" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>The invoice card as the Figma walk sees it: an 18px top padding and the 15px gap above the buttons are typed numbers, the heading gap and the bottom padding are bound; beside it, an illustrative tally of values in five classes</title><rect x="0" y="0" width="640" height="250" fill="#ffffff"/><rect x="20" y="40" width="230" height="156" rx="6.666666666666667" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><text x="36" y="74" font-family="sans-serif" font-size="19" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="36" y="103" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="36" y="123" font-family="sans-serif" font-size="14" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="36" y="144" width="95" height="36" rx="4.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="83.5" y="167" font-family="sans-serif" font-size="14" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="139" y="144" width="95" height="36" rx="4.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="186.5" y="167" font-family="sans-serif" font-size="14" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><rect x="20" y="40.0" width="230" height="16" rx="0" fill="#de350b" stroke="none" stroke-width="1" opacity="0.22"/><line x1="252" y1="48.0" x2="264" y2="48.0" stroke="#de350b" stroke-width="1"/><rect x="264" y="39.0" width="84" height="18" rx="9" fill="#ffffff" stroke="#de350b" stroke-width="1"/><text x="306" y="52.0" font-family="sans-serif" font-size="10" fill="#de350b" text-anchor="middle" font-weight="bold">18 · typed</text><rect x="36" y="80.0" width="198" height="8" rx="0" fill="#1f845a" stroke="none" stroke-width="1" opacity="0.22"/><line x1="252" y1="84.0" x2="264" y2="84.0" stroke="#1f845a" stroke-width="1"/><rect x="264" y="75.0" width="84" height="18" rx="9" fill="#ffffff" stroke="#1f845a" stroke-width="1"/><text x="306" y="88.0" font-family="sans-serif" font-size="10" fill="#1f845a" text-anchor="middle" font-weight="bold">gap-sm</text><rect x="36" y="128.0" width="198" height="16" rx="0" fill="#de350b" stroke="none" stroke-width="1" opacity="0.22"/><line x1="252" y1="136.0" x2="264" y2="136.0" stroke="#de350b" stroke-width="1"/><rect x="264" y="127.0" width="84" height="18" rx="9" fill="#ffffff" stroke="#de350b" stroke-width="1"/><text x="306" y="140.0" font-family="sans-serif" font-size="10" fill="#de350b" text-anchor="middle" font-weight="bold">15 · typed</text><rect x="20" y="180.0" width="230" height="16" rx="0" fill="#1f845a" stroke="none" stroke-width="1" opacity="0.22"/><line x1="252" y1="188.0" x2="264" y2="188.0" stroke="#1f845a" stroke-width="1"/><rect x="264" y="179.0" width="84" height="18" rx="9" fill="#ffffff" stroke="#1f845a" stroke-width="1"/><text x="306" y="192.0" font-family="sans-serif" font-size="10" fill="#1f845a" text-anchor="middle" font-weight="bold">padding-md</text><text x="20" y="218" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="start" font-weight="normal">red: typed numbers · green: bound to a variable</text><rect x="360" y="60" width="10" height="10" rx="0" fill="#36b37e" stroke="none" stroke-width="1"/><text x="378" y="69" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Exact match</text><text x="378" y="84" font-family="monospace" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">16 → space-400</text><text x="620" y="69" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="end" font-weight="normal">212</text><rect x="360" y="94" width="10" height="10" rx="0" fill="#00b8d9" stroke="none" stroke-width="1"/><text x="378" y="103" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Near match</text><text x="378" y="118" font-family="monospace" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">15, 17 → nearest</text><text x="620" y="103" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="end" font-weight="normal">31</text><rect x="360" y="128" width="10" height="10" rx="0" fill="#6554c0" stroke="none" stroke-width="1"/><text x="378" y="137" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Legacy token</text><text x="378" y="152" font-family="monospace" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">spacing-medium</text><text x="620" y="137" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="end" font-weight="normal">96</text><rect x="360" y="162" width="10" height="10" rx="0" fill="#5e6c84" stroke="none" stroke-width="1"/><text x="378" y="171" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Dynamic</text><text x="378" y="186" font-family="monospace" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">gridSize(3)</text><text x="620" y="171" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="end" font-weight="normal">7</text><rect x="360" y="196" width="10" height="10" rx="0" fill="#de350b" stroke="none" stroke-width="1"/><text x="378" y="205" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Off-scale</text><text x="378" y="220" font-family="monospace" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">18, 22</text><text x="620" y="205" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="end" font-weight="normal">46</text><text x="360" y="44" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="start" font-weight="bold">Library tally (illustrative)</text></svg>

The red fields hold typed numbers; the green ones are already bound. The tally sorts every value the walk and the linter find into five classes:

| Class | Example | What happens to it |
|---|---|---|
| Exact match | `16px` where `space-400` is 16 | replaced automatically |
| Near match | `15px`, `17px` | the nearest step, reviewed (Primer allows 1px either way) |
| Legacy token | `spacing-medium` | renamed through the mapping table |
| Dynamic | `gridSize(3)`, `calc()` | skipped and flagged for a person |
| Off-scale | `18px`, `22px` | a new step, the nearest step, or a recorded exception |

The worked case is the scene's 18px. Say it appears 40 times, all as a card's top padding. That is not noise: it is a missing role with a consistent value. Moving it to 16px changes 40 cards visibly; moving it to 20px adds a step. A single 22px in one frame is noise and goes to the nearest step. The counts decide, which is why the inventory comes before the model.

**Inventory both sides before choosing names: walk Figma's auto-layout fields for unbound values, run the code linter in report mode, and sort every value into the five classes with its count.** A value that appears often and consistently off the scale is a missing step or role; a rare one is noise. *Weight: moderate.* The Figma walk follows the plugin API's documented binding model; the classes are what Atlassian's, Polaris's and Primer's tools each implement in part.

---

## Migrating old tokens

A migration is a table from old name to new name with values, a codemod for exact matches, a flag on everything else, and a lint rule that ratchets so nothing new arrives.

The scene's team now has its new model and 600 uses of the old one. The temptation is to change names and values in one pass, tidying as it goes. Then a screen that moved by 4px cannot be traced: was it the rename, the rounding, or a bug?

Four migrations show the parts.

**Carbon v10 to v11** kept every value and folded `$layout-*` into `$spacing-*`, as [roles on top](../foundations/spacing-tokens-by-intent.md#roles-on-top) tells. Its stylelint plugin has a `carbon/layout-use` rule with auto-fix and an allow-list for accepted exceptions.

**Polaris v11 to v12** renamed with no value change, `--p-space-4` to `--p-space-400` across the 16 steps its migration table renames (the scale now has 18), run as a codemod, then checked with a search for the old names until it found none. The one deliberate value change, a legacy card's padding from 20px to 16px, was documented apart from the rename. Earlier Polaris codemods converted raw `16px` on padding, margin and gap to a token, and left a comment on anything they could not convert.

**Primer** published a table from Sass to custom properties (`$spacer-3` to `--base-size-16`), and for values between steps advised the raw value or the closest step.

**Atlassian** shipped spacing linting as a warning while colour stayed an error, then made spacing an error by default in version 8. Its autofix applies only exact matches; `gridSize() * 7` (56px) has no token and stays flagged.

The worked case, with the scene's table. Note the 18px row and the two `spacing-medium` rows.

| Old | Value | New | Value | Kind |
|---|---|---|---|---|
| `spacing-xs` | 4 | `space-100` | 4 | rename |
| `spacing-s` | 8 | `space-200` | 8 | rename |
| `spacing-medium` (file A) | 16 | `space-400` | 16 | rename |
| `spacing-medium` (file B) | 8 | `space-200` | 8 | rename, by file |
| `18px` (40 card tops) | 18 | `padding-md` | 16 | value change, reviewed |
| `gridSize() * 7` | 56 | none | | flagged, by hand |

Run it in this order. Renames first, in their own change, with no visible difference anywhere. Value changes second, each reviewed on screen. Flagged items last, by hand. Then turn the lint rule on, with remaining exceptions marked by a generated comment (Polaris marks its own "DO NOT COPY") so the backlog stays visible and nothing new joins it.

<svg role="img" viewBox="0 0 640 166" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>Migration as four steps in order: renames with no visible change, reviewed value changes, hand-fixed leftovers, then the lint rule switched to error</title><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#5e6c84"/></marker></defs><rect x="0" y="0" width="640" height="166" fill="#ffffff"/><rect x="10" y="30" width="140" height="92" rx="8" fill="#ffffff" stroke="#6554c0" stroke-width="2"/><rect x="10" y="30" width="140" height="8" rx="4" fill="#6554c0" stroke="none" stroke-width="1"/><text x="80" y="64" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">1  Renames</text><text x="80" y="88" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">same values,</text><text x="80" y="104" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">nothing moves</text><line x1="152" y1="76" x2="176" y2="76" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="168" y="30" width="140" height="92" rx="8" fill="#ffffff" stroke="#ff8b00" stroke-width="2"/><rect x="168" y="30" width="140" height="8" rx="4" fill="#ff8b00" stroke="none" stroke-width="1"/><text x="238" y="64" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">2  Value changes</text><text x="238" y="88" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">each one reviewed</text><text x="238" y="104" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">on screen</text><line x1="310" y1="76" x2="334" y2="76" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="326" y="30" width="140" height="92" rx="8" fill="#ffffff" stroke="#de350b" stroke-width="2"/><rect x="326" y="30" width="140" height="8" rx="4" fill="#de350b" stroke="none" stroke-width="1"/><text x="396" y="64" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">3  Leftovers</text><text x="396" y="88" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">flagged items,</text><text x="396" y="104" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">fixed by hand</text><line x1="468" y1="76" x2="492" y2="76" stroke="#5e6c84" stroke-width="1.5" marker-end="url(#arr)"/><rect x="484" y="30" width="140" height="92" rx="8" fill="#ffffff" stroke="#36b37e" stroke-width="2"/><rect x="484" y="30" width="140" height="8" rx="4" fill="#36b37e" stroke="none" stroke-width="1"/><text x="554" y="64" font-family="sans-serif" font-size="13" fill="#172b4d" text-anchor="middle" font-weight="bold">4  Lint to error</text><text x="554" y="88" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">exceptions marked,</text><text x="554" y="104" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="middle" font-weight="normal">nothing new joins</text><text x="320" y="150" font-family="sans-serif" font-size="12" fill="#172b4d" text-anchor="middle" font-weight="normal">Only step 2 changes what a person sees.</text></svg>

Only the second step changes anything a person can see, which is why it is the one reviewed screen by screen.

In Figma the same table drives a plugin pass: rebind each matching field with `setBoundVariable`, keep the old variables as aliases to the new ones for one release so files built on them still resolve, then deprecate and delete. Re-run the audit's walk to confirm the unbound count dropped.

**Migrate in three separate passes (renames with no value change, then reviewed value changes, then hand-fixed leftovers), and only then switch the lint rule to error with the remaining exceptions marked.** Keep old Figma variables as aliases for one release so files built on them do not break. *Weight: strong.* Carbon and Polaris separated renames from value changes; Polaris and Atlassian codemodded exact matches only and flagged the rest; Atlassian ratcheted from warning to error.

---

## Documenting the model

Each token's documentation says what it is for, what it is not for, which modes change it and what it aliases, with a picture of it in use.

The scene's designers will choose between `padding-md` and `gap-md` dozens of times a day. If the page lists only values, they pick by number, and the roles collapse back into a scale.

Systems document spacing at three depths. Carbon lists `$spacing-01` to `$spacing-13` with values and no per-token guidance. Atlassian gives usage bands per range and, for its newer tokens, a sentence each, including what not to use it for. Primer attaches a usage rule to every functional token, written so that an agent can read it as well as a person.

The worked case is one role, as its documentation entry:

```
padding-lg
  Use for: padding inside cards, panels and dialogs.
  Not for: gaps between items (gap-*); page margins (page-margin).
  Value: space-600 (24px). Compact: space-400 (16px). Mobile: space-400 (16px).
  Code: var(--padding-lg) · Spacing.paddingLg (Android) · Spacing.paddingLg (iOS)
  Figma: Spacing/padding/lg, scope Gap.
```

Here is the same entry as a docs page shows it, with the picture of it in use.

<svg role="img" viewBox="0 0 640 270" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0"><title>A documentation entry for the padding-lg role: a card with its padding shaded, beside use-for and not-for lines, its value in each mode, and its code and Figma names</title><rect x="0" y="0" width="640" height="270" fill="#ffffff"/><rect x="10" y="10" width="620" height="250" rx="10" fill="#ffffff" stroke="#c1c7d0" stroke-width="1"/><text x="30" y="44" font-family="monospace" font-size="18" fill="#172b4d" text-anchor="start" font-weight="bold">padding-lg</text><text x="30" y="66" font-family="sans-serif" font-size="12" fill="#5e6c84" text-anchor="start" font-weight="normal">Padding inside cards, panels and dialogs.</text><rect x="30" y="84" width="250.0" height="129.0" rx="5.0" fill="#ffffff" stroke="#c1c7d0" stroke-width="1.5"/><rect x="30.0" y="84.0" width="250.0" height="18.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="30.0" y="195.0" width="250.0" height="18.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="30.0" y="102.0" width="18.0" height="93.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><rect x="262.0" y="102.0" width="18.0" height="93.0" rx="0" fill="#6554c0" stroke="none" stroke-width="1" opacity="0.25"/><text x="48.0" y="115.5" font-family="sans-serif" font-size="14.25" fill="#172b4d" text-anchor="start" font-weight="bold">Invoice #1042</text><text x="48.0" y="137.25" font-family="sans-serif" font-size="10.5" fill="#5e6c84" text-anchor="start" font-weight="normal">Due 24 November</text><text x="48.0" y="152.25" font-family="sans-serif" font-size="10.5" fill="#5e6c84" text-anchor="start" font-weight="normal">€1,240.00 · 3 items</text><rect x="48.0" y="168.0" width="67.5" height="27.0" rx="3.0" fill="#0c66e4" stroke="none" stroke-width="1"/><text x="81.75" y="185.25" font-family="sans-serif" font-size="10.5" fill="#ffffff" text-anchor="middle" font-weight="bold">Pay now</text><rect x="121.5" y="168.0" width="67.5" height="27.0" rx="3.0" fill="#ffffff" stroke="#0c66e4" stroke-width="1.5"/><text x="155.25" y="185.25" font-family="sans-serif" font-size="10.5" fill="#0c66e4" text-anchor="middle" font-weight="bold">Download</text><text x="155" y="229" font-family="sans-serif" font-size="10" fill="#5e6c84" text-anchor="middle" font-weight="normal">the shaded band is padding-lg</text><text x="304" y="100" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Use for</text><text x="392" y="100" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">card, panel and dialog padding</text><text x="304" y="124" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Not for</text><text x="392" y="124" font-family="sans-serif" font-size="11" fill="#de350b" text-anchor="start" font-weight="normal">gaps (gap-*), page margin</text><text x="304" y="148" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Comfortable</text><text x="392" y="148" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space-600 · 24px</text><text x="304" y="172" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Compact</text><text x="392" y="172" font-family="sans-serif" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">space-400 · 16px</text><text x="304" y="196" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Code</text><text x="392" y="196" font-family="monospace" font-size="10" fill="#172b4d" text-anchor="start" font-weight="normal">var(--padding-lg) · Spacing.paddingLg</text><text x="304" y="220" font-family="sans-serif" font-size="11" fill="#5e6c84" text-anchor="start" font-weight="normal">Figma</text><text x="392" y="220" font-family="monospace" font-size="11" fill="#172b4d" text-anchor="start" font-weight="normal">Spacing/padding/lg · scope Gap</text></svg>

The shaded band is the token, drawn where it lives; the red not-for line is the one most pages leave out, and it is what keeps padding and gap apart.

**Write a use-for line, a not-for line, the value per mode and the code names for every role token, in the Figma variable's description and on the docs page, from one source.** *Weight: moderate.* Atlassian and Primer document usage per token; Carbon's values-only page leaves the choice to the number.

---

## Cheat sheet

| Decision | Do | Not |
|---|---|---|
| Direction | start and end | left and right |
| Format | DTCG `dimension` in px; build to rem, dp, pt | three hand-typed numbers |
| Breakpoints | written beside the role table, per platform | assumed from Figma modes |
| Figma | primitives hidden, unscoped; roles scoped to Gap, with modes and code syntax | every number variable in every picker |
| Audit | Figma walk and code lint, five classes, with counts | choosing names first |
| Migration | renames, then values, then leftovers; then ratchet the lint | everything in one pass |
| Docs | use for, not for, value per mode, code names | a table of values |

[Part 1's cheat sheet](spacing-tokens-by-intent.md#cheat-sheet) covers the scale, the roles and their use.

---

## The short version

Store every spacing token as a DTCG dimension in px and generate rem, dp and pt from it; map `padding` to each platform's padding and `gap` to its gap or spacing argument; name sides start and end; and write the breakpoint each platform uses beside the role table, since no token carries it. In Figma, primitives go in a hidden, unscoped collection and roles in a collection scoped to Gap, with density or breakpoint modes and code syntax per platform. These parts are moderate.

Get there by auditing first: walk Figma's auto-layout fields for unbound values and lint the code in report mode, then sort every value into exact match, near match, legacy token, dynamic or off-scale, with counts, because a frequent off-scale value is a missing role. Migrate in three passes, renames first with no visible change, then reviewed value changes, then leftovers by hand, and only then make the lint an error, as Polaris, Carbon and Atlassian did; that is strong. Write each role's use-for and not-for lines in the Figma description and the docs from one source. Every system read here has renamed its spacing at least once; keep the old names as aliases for a release and nobody's file breaks.

---

## What to re-check later

Researched 2026-11-16 from the systems' source files, documentation and migration guides, read that day. Split from Part 1 on 2026-11-17.

- **Figma (volatile).** The padding scope: the plugin API lists only `GAP`, Figma's help page lists gap and padding, and a forum report of April 2026 says padding is not offered as a scope; not tested here. Mode caps per plan and Check designs' plan availability change with pricing. The REST variables API needs an Enterprise full seat.
- **Style Dictionary and DTCG 2025.10.** Object-form dimensions are not fully supported as of this date.
- **Polaris** is archived on GitHub; its stylelint and migrator docs were read in the archived repository.
- **Not found:** a stated reason for Polaris's v12 rename; any published adoption number for spacing tokens.
- **Figures.** The two Figma figures are sketches drawn from Figma's documentation, not screenshots; panel labels and the setup steps' menu names change between releases. The audit tally's counts are illustrative.

---

## Sources

**Primary**

- [Atlassian, spacing foundations](https://atlassian.design/foundations/spacing)
- [Atlassian, introducing the spacing scale (community post, 2023-01-23)](https://community.developer.atlassian.com/t/introducing-the-spacing-scale-the-beginnings-of-an-atlassian-spacing-system/65393)
- [Polaris, migrating from v11 to v12](https://raw.githubusercontent.com/Shopify/polaris-react-archive/main/polaris.shopify.com/content/version-guides/migrating-from-v11-to-v12.mdx)
- [Carbon, v11 migration guide](https://raw.githubusercontent.com/carbon-design-system/carbon/main/docs/migration/v11.md)
- [Carbon, spacing overview](https://carbondesignsystem.com/elements/spacing/overview/)
- [Primer, functional size tokens](https://raw.githubusercontent.com/primer/primitives/main/src/tokens/functional/size/size.json5)
- [Primer, migrating from Sass](https://primer.style/product/primitives/migrating/)
- [Figma, Simple Design System tokens](https://raw.githubusercontent.com/figma/sds/main/scripts/tokens/tokens.json)
- [Figma plugin API, `VariableScope`](https://developers.figma.com/docs/plugins/api/VariableScope/)
- [Figma plugin API, `VariableBindableNodeField`](https://developers.figma.com/docs/plugins/api/VariableBindableNodeField/)
- [Figma help, guide to variables](https://help.figma.com/hc/en-us/articles/15145852043927-Guide-to-variables-in-Figma)
- [Figma help, modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables)
- [Figma help, plans and features](https://help.figma.com/hc/en-us/articles/360040328273)
- [Figma help, Check designs](https://help.figma.com/hc/en-us/articles/39592284074263)
- [Figma forum, padding as a variable scope (April 2026)](https://forum.figma.com/report-a-problem-6/in-variables-is-there-an-option-for-padding-in-scope-53027)
- [Figma REST API, library analytics](https://developers.figma.com/docs/rest-api/library-analytics-endpoints/)
- [W3C DTCG Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/)
- [Style Dictionary, predefined transforms](https://styledictionary.com/reference/hooks/transforms/predefined/)
- [Style Dictionary, DTCG support](https://styledictionary.com/info/dtcg/)
- [Android, window size classes](https://developer.android.com/develop/ui/compose/layouts/adaptive/use-window-size-classes)
- [Android, `PaddingValues`](https://developer.android.com/reference/kotlin/androidx/compose/foundation/layout/PaddingValues)
- [Mozilla, `use-design-tokens` space rule](https://firefox-source-docs.mozilla.org/code-quality/lint/linters/stylelint-plugin-mozilla/rules/use-design-tokens/space.html)

**Cited but not resolved to a URL**

- Atlassian's `@atlaskit/eslint-plugin-design-system` rule sources were read inside the npm package (16.16.0), not at a web URL.
- Polaris's stylelint-polaris and polaris-migrator docs were read in the archived repository's content folder; the public pages redirect.
