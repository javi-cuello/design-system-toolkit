# Elevation and shadows

How many shadow steps a system needs, what a shadow token is made of, which colour it takes, and when a border or an inset ring should do the job instead.

A team adds a hover state to its cards and reaches for the shadow tokens. There are seven of them, plus a bevel, two insets and a dozen button shadows, and nobody remembers which one the menu uses. The hover shadow ships at a step that matches the dialog's, the cards in the dense table view grow a blur each, and in dark mode all of it disappears.

---

## What this answers

- [Levels and their jobs](#levels-and-their-jobs): how many shadow steps systems ship, and how many components use
- [Anatomy of a shadow](#anatomy-of-a-shadow): what the layers in one shadow token each do
- [Shadow colour](#shadow-colour): black at low alpha or a tint, and one colour or one per theme
- [The page underneath](#the-page-underneath): why the same shadow reads differently on white and on grey
- [Inset ring or border](#inset-ring-or-border): when `inset 0 0 0 1px` beats a border, and what it costs
- [Naming shadow tokens](#naming-shadow-tokens): `elevation.*` or `shadow.*`, and the DTCG shadow type
- [Hover and drag](#hover-and-drag): how far a surface rises when touched or carried
- [Borders in dense interfaces](#borders-in-dense-interfaces): why tables and lists use lines, not lift
- [Shadows as boundaries](#shadows-as-boundaries): whether a shadow can meet non-text contrast
- [Shadows in dark mode](#shadows-in-dark-mode): what changes, briefly

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs. Which fill each surface takes, and how the levels stack, is in [how surfaces stack](how-surfaces-stack.md); dark surfaces in full are in [surfaces in dark mode](surfaces-in-dark-mode.md); blur and translucency are in [materials and translucency](materials-and-translucency.md).

---

## Levels and their jobs

Systems ship between one and seven shadow steps, but every one of them gives ordinary components only two: one for things resting on the page and one for things floating over it.

Back at the card's hover state, the problem is not that seven tokens is too many. It is that nothing in the list says which two of them a component should reach for, so each designer picks by eye and the steps drift apart.

Here is what two systems at opposite ends ship, rendered from their token values.

<svg role="img" viewBox="0 0 720 352" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Two elevation ladders rendered from their token values. Above, Material 3 levels 0 to 5 at 0, 1, 3, 6, 8 and 12dp, each a card with a deeper and wider shadow, labelled with a component that uses it by default: filled button at level 0, elevated card at 1, menu and navigation bar at 2, dialog and floating action button at 3, a dragged card at 4, level 5 at the top. Below, Atlassian ships only default with no shadow, raised for movable cards and overlay for menus and modals.</title>
<rect x="0" y="0" width="720" height="352" fill="#f7f6f2"/>
<defs><filter id="ld1" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="1" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="1.5" result="b1"/>
<feOffset in="b1" dx="0" dy="1" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="ld2" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="2" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="3" result="b1"/>
<feOffset in="b1" dx="0" dy="2" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="ld3" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="3" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="4" result="b1"/>
<feOffset in="b1" dx="0" dy="4" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="ld4" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="b0"/>
<feOffset in="b0" dx="0" dy="2" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="4" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="5" result="b1"/>
<feOffset in="b1" dx="0" dy="6" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="ld5" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b0"/>
<feOffset in="b0" dx="0" dy="4" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="6" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="6" result="b1"/>
<feOffset in="b1" dx="0" dy="8" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="ld-ar" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.251"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b1"/>
<feOffset in="b1" dx="0" dy="0" result="o1"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.310"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="ld-ao" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b0"/>
<feOffset in="b0" dx="0" dy="8" result="o0"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.149"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b1"/>
<feOffset in="b1" dx="0" dy="0" result="o1"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.310"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter></defs>
<text x="24" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Material 3: six levels</text>
<rect x="24" y="52" width="96" height="64" rx="12" fill="#ffffff"/>
<text x="24" y="140" font-size="12" fill="#1a1a1a">level0 · 0dp</text>
<text x="24" y="157" font-size="12" fill="#5a5850">filled button</text>
<rect x="140" y="52" width="96" height="64" rx="12" fill="#ffffff" filter="url(#ld1)"/>
<text x="140" y="140" font-size="12" fill="#1a1a1a">level1 · 1dp</text>
<text x="140" y="157" font-size="12" fill="#5a5850">elevated card</text>
<rect x="256" y="52" width="96" height="64" rx="12" fill="#ffffff" filter="url(#ld2)"/>
<text x="256" y="140" font-size="12" fill="#1a1a1a">level2 · 3dp</text>
<text x="256" y="157" font-size="12" fill="#5a5850">menu, nav bar</text>
<rect x="372" y="52" width="96" height="64" rx="12" fill="#ffffff" filter="url(#ld3)"/>
<text x="372" y="140" font-size="12" fill="#1a1a1a">level3 · 6dp</text>
<text x="372" y="157" font-size="12" fill="#5a5850">dialog, FAB</text>
<rect x="488" y="52" width="96" height="64" rx="12" fill="#ffffff" filter="url(#ld4)"/>
<text x="488" y="140" font-size="12" fill="#1a1a1a">level4 · 8dp</text>
<text x="488" y="157" font-size="12" fill="#5a5850">dragged card</text>
<rect x="604" y="52" width="96" height="64" rx="12" fill="#ffffff" filter="url(#ld5)"/>
<text x="604" y="140" font-size="12" fill="#1a1a1a">level5 · 12dp</text>
<text x="604" y="157" font-size="12" fill="#5a5850">top of scale</text>
<text x="24" y="206" font-size="14" fill="#1a1a1a" font-weight="600">Atlassian: two shadows</text>
<rect x="24" y="228" width="96" height="64" rx="8" fill="#ffffff"/>
<rect x="140" y="228" width="96" height="64" rx="8" fill="#ffffff" filter="url(#ld-ar)"/>
<rect x="256" y="228" width="96" height="64" rx="8" fill="#ffffff" filter="url(#ld-ao)"/>
<text x="24" y="316" font-size="12" fill="#1a1a1a">default</text>
<text x="24" y="333" font-size="12" fill="#5a5850">page, flat card</text>
<text x="140" y="316" font-size="12" fill="#1a1a1a">raised</text>
<text x="140" y="333" font-size="12" fill="#5a5850">movable card</text>
<text x="256" y="316" font-size="12" fill="#1a1a1a">overlay</text>
<text x="256" y="333" font-size="12" fill="#5a5850">menu, modal</text>
<text x="392" y="246" font-size="12" fill="#1f5fbf">Six steps against two, but each</text>
<text x="392" y="263" font-size="12" fill="#1f5fbf">system gives most components</text>
<text x="392" y="280" font-size="12" fill="#1f5fbf">one or two of them.</text>
</svg>

Material's six levels look like a fine-grained scale, but its component tokens use them sparsely. In Material Web's tokens a filled button rests at `level0` and rises to `level1` on hover, an elevated card rests at `level1`, a menu and the navigation bar sit at `level2`, and a dialog and the floating action button at `level3`. `level4` appears mainly as a state: the FAB on hover, a card while dragged. `level5` is the top of the scale.

Atlassian goes the other way and ships two shadows, `elevation.shadow.raised` and `elevation.shadow.overlay`, plus an overflow shadow for scrolled content. Its documentation reserves raised mostly for cards that move, Jira and Trello cards, and puts menus, modals and floating toolbars on overlay.

The middle of the range follows the same pattern under different names:

- **Primer** names its steps by job: `shadow-resting-xsmall`, `-small` and `-medium` for things on the page, `shadow-floating-small` up to `-xlarge` for things over it.
- **Polaris** ships `shadow-0` to `shadow-600`, then a bevel, two insets and twelve button shadows that are really the buttons' strokes.
- **Fluent 2** ships `shadow2`, `4`, `8`, `16`, `28` and `64`, split by its docs into a low ramp for cards and command bars and a high ramp for sheets and dialogs.
- **Carbon** ships one: a `box-shadow` mixin, `0 2px 6px $shadow`, used by menus and popovers. Its tiles and cards are flat.
- **Ant Design** ships `boxShadow`, `boxShadowSecondary` and `boxShadowTertiary`, with the first two identical in source.

That last detail is telling. Ant Design's two named floating shadows carry the same three layers, so in practice it has two steps, the same as Atlassian.

The steps a system has and the steps a component uses are different numbers, and the second one is what decides whether the scale stays coherent. The toolkit's knowledge base already sets three or four surface levels, each paired with its shadow; how those surfaces stack is in [how surfaces stack](how-surfaces-stack.md).

Give your components two shadow roles, resting and floating, and map every component to one of them in its documentation. Keep further steps only where a state needs them (hover, drag) or a surface floats over another floating surface, like a dialog over a menu. **A shadow scale is as long as the list of reasons to use it, and most systems have two.** The two-role pattern is consensus across Atlassian, Primer and Carbon, and Material's component tokens behave the same way despite the longer scale.

---

## Anatomy of a shadow

A shadow token is usually two layers: a tight, darker key layer that draws the edge, and a wide, paler ambient layer that says how far the surface sits above the page.

A designer opening Material's level 3 in Figma finds two drop-shadow effects stacked in one style, and the obvious question is why one wouldn't do. The answer is visible once the two are pulled apart.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>One Material 3 level 3 shadow taken apart, drawn at twice size. The key layer, 0 1px 3px at 30 percent black, is a tight dark line that hugs the card and draws its edge. The ambient layer, 0 4px 8px with 3px spread at 15 percent black, is a wide pale halo that suggests distance. Stacked, they make the single token a card actually uses. A fourth card shows the Windows variant Fluent describes: a 1 pixel stroke draws the edge and only the ambient layer remains.</title>
<rect x="0" y="0" width="720" height="300" fill="#f7f6f2"/>
<defs><filter id="an-k" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b0"/>
<feOffset in="b0" dx="0" dy="2" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMerge><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="an-a" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="dilate" radius="6" result="m0"/>
<feGaussianBlur in="m0" stdDeviation="8" result="b0"/>
<feOffset in="b0" dx="0" dy="8" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMerge><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="an-b" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b0"/>
<feOffset in="b0" dx="0" dy="2" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="6" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="8" result="b1"/>
<feOffset in="b1" dx="0" dy="8" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="an-w" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b0"/>
<feOffset in="b0" dx="0" dy="0" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.140"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMerge><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter></defs>
<text x="30" y="34" font-size="14" fill="#1a1a1a" font-weight="600">Key layer</text>
<rect x="35" y="70" width="125" height="90" rx="8" fill="#ffffff" filter="url(#an-k)"/>
<text x="30" y="210" font-size="12" fill="#5a5850">0 1px 3px 0, black 30%</text>
<text x="30" y="228" font-size="12" fill="#1f5fbf">sharp, close: draws the edge</text>
<text x="205" y="34" font-size="14" fill="#1a1a1a" font-weight="600">Ambient layer</text>
<rect x="210" y="70" width="125" height="90" rx="8" fill="#ffffff" filter="url(#an-a)"/>
<text x="205" y="210" font-size="12" fill="#5a5850">0 4px 8px 3px, black 15%</text>
<text x="205" y="228" font-size="12" fill="#1f5fbf">soft, wide: says how far</text>
<text x="380" y="34" font-size="14" fill="#1a1a1a" font-weight="600">Both: level 3</text>
<rect x="385" y="70" width="125" height="90" rx="8" fill="#ffffff" filter="url(#an-b)"/>
<text x="380" y="210" font-size="12" fill="#5a5850">the two stacked</text>
<text x="380" y="228" font-size="12" fill="#1f5fbf">what ships as one token</text>
<text x="555" y="34" font-size="14" fill="#1a1a1a" font-weight="600">Stroke + ambient</text>
<rect x="560" y="70" width="125" height="90" rx="8" fill="#ffffff" stroke="#c8c6c0" stroke-width="1" filter="url(#an-w)"/>
<text x="555" y="210" font-size="12" fill="#5a5850">1px stroke, ambient only</text>
<text x="555" y="228" font-size="12" fill="#b5501f">Fluent on Windows</text>
<text x="30" y="268" font-size="11" fill="#5a5850">Material 3 level 3 values, drawn at 2× so the layers are visible. The Windows panel is illustrative: Fluent states the</text>
<text x="30" y="284" font-size="11" fill="#5a5850">substitution, not its values.</text>
</svg>

The key layer, `0 1px 3px 0` at 30% black, is nearly invisible as depth but crisp at the edge, especially along the bottom. The ambient layer, `0 4px 8px 3px` at 15% black, has no edge at all; it only darkens the page around the card. Together they read as one object at one distance.

Each number in a layer does one job:

- **Offset x and y** move the shadow away from the element. Every system here uses x = 0 and a positive y, a light from straight above.
- **Blur** softens the edge. In CSS the blur radius is about twice the Gaussian standard deviation, so `8px` spreads the fade over about 8px each way.
- **Spread** grows or shrinks the shadow's shape before it is blurred. A negative spread pulls the shadow back under the element so only its lower part shows past the edge.

Material Web computes all five levels from one formula in `_elevation.scss`. The key layer's offset grows from 1px to 4px and its blur from 2px to 4px. The ambient layer grows faster: offset 1px to 8px, blur 3px to 12px, spread 1px to 6px. The two opacities never change, 30% and 15%, so distance is carried by size, not darkness.

Fluent 2 keeps the same two-layer idea with the roles swapped in size. Its web tokens put an ambient `0 0 2px` around the element at 12% and a key `0 2px 4px` (for `shadow4`) at 14%, the key growing to `0 32px 64px` at `shadow64`. Its documentation also notes the exception in the last panel: on Windows a stroke outlines the object instead of a key shadow, leaving only the soft ambient layer.

Other systems split the work differently, and the differences are the useful part:

- **Primer's floating shadows** open with a ring, `0 0 0 1px`, then stack two to four drops with negative spreads. `shadow-floating-medium` has four drops at 8% each, offset 8, 4, 24 and 48px.
- **Atlassian's** pair a drop with a `0 0 1px` edge at 31%. The edge is the key layer in miniature.
- **Polaris** uses one layer per step: `shadow-400` is `0 8px 16px -4px` at 22%, with the negative spread doing what an ambient layer would.
- **Radix Themes** stacks up to four, a gray-alpha ring first.

Here are eight systems side by side, the smallest resting shadow and one floating step each, rendered from their published values.

<svg role="img" viewBox="0 0 720 658" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Eight systems' shadow tokens rendered on white from their published values, one row each, with the smallest resting shadow on the left and a floating step on the right. Material 3 level1 and level2 stack a 30 percent key and a 15 percent ambient layer. Fluent 2 shadow4 and shadow16 pair a 12 percent ambient with a 14 percent key. Polaris shadow-100 is a single 1px line and shadow-400 a single soft drop. Atlassian raised and overlay add a faint 1px edge to a drop. Primer resting-small is nearly invisible and floating-small adds a ring to two drops. Carbon has no resting shadow and one shadow overall. Ant Design stacks three faint layers. Radix Themes draws a ring and several faint drops.</title>
<rect x="0" y="0" width="720" height="658" fill="#f7f6f2"/>
<defs><filter id="sc0a" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="1" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="1.5" result="b1"/>
<feOffset in="b1" dx="0" dy="1" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc0b" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="2" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="3" result="b1"/>
<feOffset in="b1" dx="0" dy="2" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc1a" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b0"/>
<feOffset in="b0" dx="0" dy="0" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.120"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b1"/>
<feOffset in="b1" dx="0" dy="2" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.140"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc1b" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b0"/>
<feOffset in="b0" dx="0" dy="0" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.120"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b1"/>
<feOffset in="b1" dx="0" dy="8" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.140"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc2a" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="0" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#1a1a1a" flood-opacity="0.070"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMerge><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc2b" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="erode" radius="4" result="m0"/>
<feGaussianBlur in="m0" stdDeviation="8" result="b0"/>
<feOffset in="b0" dx="0" dy="8" result="o0"/>
<feFlood flood-color="#1a1a1a" flood-opacity="0.220"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMerge><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc3a" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.251"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b1"/>
<feOffset in="b1" dx="0" dy="0" result="o1"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.310"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc3b" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b0"/>
<feOffset in="b0" dx="0" dy="8" result="o0"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.149"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b1"/>
<feOffset in="b1" dx="0" dy="0" result="o1"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.310"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc4a" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#1f2328" flood-opacity="0.039"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b1"/>
<feOffset in="b1" dx="0" dy="1" result="o1"/>
<feFlood flood-color="#1f2328" flood-opacity="0.031"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc4b" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="dilate" radius="1" result="m0"/>
<feGaussianBlur in="m0" stdDeviation="0" result="b0"/>
<feOffset in="b0" dx="0" dy="0" result="o0"/>
<feFlood flood-color="#d1d9e0" flood-opacity="0.251"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="erode" radius="3" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="6" result="b1"/>
<feOffset in="b1" dx="0" dy="6" result="o1"/>
<feFlood flood-color="#25292e" flood-opacity="0.039"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="9" result="b2"/>
<feOffset in="b2" dx="0" dy="6" result="o2"/>
<feFlood flood-color="#25292e" flood-opacity="0.122"/>
<feComposite in2="o2" operator="in" result="s2"/>
<feMerge><feMergeNode in="s2"/><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc5b" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="3" result="b0"/>
<feOffset in="b0" dx="0" dy="2" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMerge><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc6a" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.050"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="erode" radius="1" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="3" result="b1"/>
<feOffset in="b1" dx="0" dy="1" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.030"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="2" result="b2"/>
<feOffset in="b2" dx="0" dy="2" result="o2"/>
<feFlood flood-color="#000000" flood-opacity="0.030"/>
<feComposite in2="o2" operator="in" result="s2"/>
<feMerge><feMergeNode in="s2"/><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc6b" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="8" result="b0"/>
<feOffset in="b0" dx="0" dy="6" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.080"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="erode" radius="4" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="3" result="b1"/>
<feOffset in="b1" dx="0" dy="3" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.120"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="8" result="m2"/>
<feGaussianBlur in="m2" stdDeviation="14" result="b2"/>
<feOffset in="b2" dx="0" dy="9" result="o2"/>
<feFlood flood-color="#000000" flood-opacity="0.050"/>
<feComposite in2="o2" operator="in" result="s2"/>
<feMerge><feMergeNode in="s2"/><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc7a" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="dilate" radius="1" result="m0"/>
<feGaussianBlur in="m0" stdDeviation="0" result="b0"/>
<feOffset in="b0" dx="0" dy="0" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.059"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="0.5" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="0" result="b1"/>
<feOffset in="b1" dx="0" dy="0" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.050"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b2"/>
<feOffset in="b2" dx="0" dy="1" result="o2"/>
<feFlood flood-color="#000000" flood-opacity="0.024"/>
<feComposite in2="o2" operator="in" result="s2"/>
<feMorphology in="SourceAlpha" operator="erode" radius="1" result="m3"/>
<feGaussianBlur in="m3" stdDeviation="0.5" result="b3"/>
<feOffset in="b3" dx="0" dy="2" result="o3"/>
<feFlood flood-color="#000000" flood-opacity="0.050"/>
<feComposite in2="o3" operator="in" result="s3"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="b4"/>
<feOffset in="b4" dx="0" dy="1" result="o4"/>
<feFlood flood-color="#000000" flood-opacity="0.050"/>
<feComposite in2="o4" operator="in" result="s4"/>
<feMerge><feMergeNode in="s4"/><feMergeNode in="s3"/><feMergeNode in="s2"/><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="sc7b" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="dilate" radius="1" result="m0"/>
<feGaussianBlur in="m0" stdDeviation="0" result="b0"/>
<feOffset in="b0" dx="0" dy="0" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.059"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="20" result="b1"/>
<feOffset in="b1" dx="0" dy="8" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.050"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMorphology in="SourceAlpha" operator="erode" radius="16" result="m2"/>
<feGaussianBlur in="m2" stdDeviation="16" result="b2"/>
<feOffset in="b2" dx="0" dy="12" result="o2"/>
<feFlood flood-color="#000000" flood-opacity="0.059"/>
<feComposite in2="o2" operator="in" result="s2"/>
<feMerge><feMergeNode in="s2"/><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter></defs>
<rect x="150" y="0" width="570" height="648" fill="#ffffff"/>
<text x="16" y="26" font-size="12" fill="#5a5850" font-weight="600">System</text>
<text x="170" y="26" font-size="12" fill="#5a5850" font-weight="600">smallest resting</text>
<text x="330" y="26" font-size="12" fill="#5a5850" font-weight="600">a floating step</text>
<text x="490" y="26" font-size="12" fill="#5a5850" font-weight="600">colour and layers</text>
<text x="16" y="74" font-size="13" fill="#1a1a1a" font-weight="600">Material 3</text>
<rect x="170" y="46" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc0a)"/>
<rect x="330" y="46" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc0b)"/>
<text x="170" y="108" font-size="11" fill="#1f5fbf">level1</text>
<text x="330" y="108" font-size="11" fill="#1f5fbf">level2</text>
<text x="490" y="74" font-size="11" fill="#5a5850">black, key 30% + ambient 15%</text>
<text x="16" y="150" font-size="13" fill="#1a1a1a" font-weight="600">Fluent 2 web</text>
<rect x="170" y="122" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc1a)"/>
<rect x="330" y="122" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc1b)"/>
<text x="170" y="184" font-size="11" fill="#1f5fbf">shadow4</text>
<text x="330" y="184" font-size="11" fill="#1f5fbf">shadow16</text>
<text x="490" y="150" font-size="11" fill="#5a5850">black, ambient 12% + key 14%</text>
<text x="16" y="226" font-size="13" fill="#1a1a1a" font-weight="600">Polaris</text>
<rect x="170" y="198" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc2a)"/>
<rect x="330" y="198" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc2b)"/>
<text x="170" y="260" font-size="11" fill="#1f5fbf">shadow-100</text>
<text x="330" y="260" font-size="11" fill="#1f5fbf">shadow-400</text>
<text x="490" y="226" font-size="11" fill="#5a5850">rgb(26 26 26), one layer each</text>
<text x="16" y="302" font-size="13" fill="#1a1a1a" font-weight="600">Atlassian</text>
<rect x="170" y="274" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc3a)"/>
<rect x="330" y="274" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc3b)"/>
<text x="170" y="336" font-size="11" fill="#1f5fbf">shadow.raised</text>
<text x="330" y="336" font-size="11" fill="#1f5fbf">shadow.overlay</text>
<text x="490" y="302" font-size="11" fill="#5a5850">#1E1F21, drop + 1px edge</text>
<text x="16" y="378" font-size="13" fill="#1a1a1a" font-weight="600">Primer</text>
<rect x="170" y="350" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc4a)"/>
<rect x="330" y="350" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc4b)"/>
<text x="170" y="412" font-size="11" fill="#1f5fbf">resting-small</text>
<text x="330" y="412" font-size="11" fill="#1f5fbf">floating-small</text>
<text x="490" y="378" font-size="11" fill="#5a5850">#25292e, ring + two drops</text>
<text x="16" y="454" font-size="13" fill="#1a1a1a" font-weight="600">Carbon</text>
<rect x="170" y="426" width="120" height="44" rx="6" fill="#ffffff"/>
<rect x="330" y="426" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc5b)"/>
<text x="170" y="488" font-size="11" fill="#1f5fbf">(none)</text>
<text x="330" y="488" font-size="11" fill="#1f5fbf">$shadow mixin</text>
<text x="490" y="454" font-size="11" fill="#5a5850">black 30%, one shadow total</text>
<text x="16" y="530" font-size="13" fill="#1a1a1a" font-weight="600">Ant Design</text>
<rect x="170" y="502" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc6a)"/>
<rect x="330" y="502" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc6b)"/>
<text x="170" y="564" font-size="11" fill="#1f5fbf">Tertiary</text>
<text x="330" y="564" font-size="11" fill="#1f5fbf">boxShadow</text>
<text x="490" y="530" font-size="11" fill="#5a5850">colorShadow × 3 layers (base unchecked)</text>
<text x="16" y="606" font-size="13" fill="#1a1a1a" font-weight="600">Radix Themes</text>
<rect x="170" y="578" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc7a)"/>
<rect x="330" y="578" width="120" height="44" rx="6" fill="#ffffff" filter="url(#sc7b)"/>
<text x="170" y="640" font-size="11" fill="#1f5fbf">shadow-2</text>
<text x="330" y="640" font-size="11" fill="#1f5fbf">shadow-4</text>
<text x="490" y="606" font-size="11" fill="#5a5850">gray-a ring + black-a drops</text>
</svg>

The floating steps look alike; the resting ones do not. Polaris and Primer rest on a line or almost nothing, Material and Radix on a visible edge, and Carbon on no shadow at all, so a "card shadow" carried from one system to another changes how much a card stands out.

A two-layer shadow is a deliberate split of jobs, and the split matters more than the exact values. Here is the same card with one layer and with two, to make it concrete.

```
/* one layer, looks reasonable */
box-shadow: 0 4px 12px rgba(0 0 0 / 0.2);

/* key + ambient: Material level 3 */
box-shadow: 0 1px 3px 0 rgba(0 0 0 / 0.3),
            0 4px 8px 3px rgba(0 0 0 / 0.15);
```

The single layer has to choose. A 4px offset and a 12px blur leave the top edge of a white card on a white page with almost no shadow, so the card's top edge vanishes. Darkening it to fix that makes the bottom heavy and muddy. The key layer fixes the edge without making the distance look larger.

Build each shadow token from a key layer and an ambient layer, or from a ring and a drop, and change size, not opacity, as the levels rise. **The key layer draws the edge and the ambient layer draws the distance; a single layer can only do one well.** That is consensus among Material, Fluent, Atlassian and Primer; Polaris's single layers with negative spread are the working counter-example, viable because Polaris also draws a bevel on its cards.

---

## Shadow colour

Most systems colour shadows with a near-black at low alpha, and a few tint it towards the page's hue; the colour itself is a token with its own value per theme.

A team puts a product on a warm cream background. Its shadows are `rgba(0, 0, 0, 0.2)`, copied from a library, and every card looks faintly dirty, as if the shadow were a grey smudge on top of the page rather than shade on it.

<svg role="img" viewBox="0 0 720 262" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Three page colours, each with a pair of cards. On a warm beige page, a pure black shadow reads as a dirty grey next to a shadow tinted dark brown, which reads as shade. On a blue-grey page, the black shadow is slightly muddy beside a navy-tinted one. On white, Atlassian's legacy overlay shadow tinted with navy 091E42 sits beside its current near-neutral 1E1F21 shadow at the same offsets and alphas; the difference is barely visible on white.</title>
<rect x="0" y="0" width="720" height="262" fill="#f7f6f2"/>
<defs><filter id="tb-k" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="erode" radius="2" result="m0"/>
<feGaussianBlur in="m0" stdDeviation="7" result="b0"/>
<feOffset in="b0" dx="0" dy="6" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.220"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b1"/>
<feOffset in="b1" dx="0" dy="1" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.180"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="tb-w" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="erode" radius="2" result="m0"/>
<feGaussianBlur in="m0" stdDeviation="7" result="b0"/>
<feOffset in="b0" dx="0" dy="6" result="o0"/>
<feFlood flood-color="#4a3110" flood-opacity="0.260"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b1"/>
<feOffset in="b1" dx="0" dy="1" result="o1"/>
<feFlood flood-color="#4a3110" flood-opacity="0.220"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="tb-b" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="erode" radius="2" result="m0"/>
<feGaussianBlur in="m0" stdDeviation="7" result="b0"/>
<feOffset in="b0" dx="0" dy="6" result="o0"/>
<feFlood flood-color="#0b2350" flood-opacity="0.260"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b1"/>
<feOffset in="b1" dx="0" dy="1" result="o1"/>
<feFlood flood-color="#0b2350" flood-opacity="0.220"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="tb-an" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b0"/>
<feOffset in="b0" dx="0" dy="8" result="o0"/>
<feFlood flood-color="#091E42" flood-opacity="0.149"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b1"/>
<feOffset in="b1" dx="0" dy="0" result="o1"/>
<feFlood flood-color="#091E42" flood-opacity="0.310"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="tb-ag" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b0"/>
<feOffset in="b0" dx="0" dy="8" result="o0"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.149"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b1"/>
<feOffset in="b1" dx="0" dy="0" result="o1"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.310"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter></defs>
<rect x="0" y="0" width="240" height="205" fill="#f3ede2"/>
<rect x="240" y="0" width="240" height="205" fill="#eaf0f8"/>
<rect x="480" y="0" width="240" height="205" fill="#ffffff"/>
<rect x="22" y="60" width="92" height="80" rx="8" fill="#ffffff" filter="url(#tb-k)"/>
<rect x="130" y="60" width="92" height="80" rx="8" fill="#ffffff" filter="url(#tb-w)"/>
<rect x="262" y="60" width="92" height="80" rx="8" fill="#ffffff" filter="url(#tb-k)"/>
<rect x="370" y="60" width="92" height="80" rx="8" fill="#ffffff" filter="url(#tb-b)"/>
<rect x="502" y="60" width="92" height="80" rx="8" fill="#ffffff" filter="url(#tb-an)"/>
<rect x="610" y="60" width="92" height="80" rx="8" fill="#ffffff" filter="url(#tb-ag)"/>
<text x="16" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Warm page</text>
<text x="256" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Blue-grey page</text>
<text x="496" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Atlassian overlay, white page</text>
<text x="22" y="172" font-size="12" fill="#1a1a1a">black</text>
<text x="22" y="189" font-size="12" fill="#5a5850">reads grey, dirty</text>
<text x="130" y="172" font-size="12" fill="#1a1a1a">tinted brown</text>
<text x="130" y="189" font-size="12" fill="#5a5850">reads as shade</text>
<text x="262" y="172" font-size="12" fill="#1a1a1a">black</text>
<text x="262" y="189" font-size="12" fill="#5a5850">slightly muddy</text>
<text x="370" y="172" font-size="12" fill="#1a1a1a">tinted navy</text>
<text x="370" y="189" font-size="12" fill="#5a5850">matches the page</text>
<text x="502" y="172" font-size="12" fill="#1a1a1a">#091E42 (legacy)</text>
<text x="502" y="189" font-size="12" fill="#5a5850">navy-tinted</text>
<text x="610" y="172" font-size="12" fill="#1a1a1a">#1E1F21 (now)</text>
<text x="610" y="189" font-size="12" fill="#5a5850">near-neutral</text>
<text x="16" y="232" font-size="11" fill="#5a5850">Left and middle: illustrative values, same alpha. Right: Atlassian's</text>
<text x="16" y="248" font-size="11" fill="#5a5850">shadow.overlay in its legacy and current themes, 0 8px 12px at 15% plus a 0 0 1px edge at 31%.</text>
</svg>

The left two pairs use the same alpha with different colours. Black over cream mixes towards a neutral grey, which the eye reads as a different material lying on the page. A dark brown at the same strength mixes towards a darker cream, which reads as the page in shade. On a cool blue-grey page the difference is smaller, because black is already close to a dark navy.

That is the mechanism behind tinting: a shadow is a mix of the shadow colour and the page, and real shade on a coloured surface is a darker version of that surface, not grey.

How do the systems colour theirs? Mostly with something close to black:

- **Material** uses `md-sys-color-shadow`, which is `neutral0`, tone 0, black in both themes.
- **Fluent** uses `colorNeutralShadowAmbient` and `colorNeutralShadowKey`, `rgba(0,0,0,0.12)` and `0.14` in light, doubled to `0.24` and `0.28` in dark.
- **Carbon** uses one token, `$shadow`: `rgba(0, 0, 0, 0.3)` in White, `0.8` in Gray 100.
- **Polaris** uses `rgb(26, 26, 26)`, its darkest grey, rather than black.
- **Primer** uses its own greys, `#25292e` and `#1f2328`, which lean very slightly blue.

The tinted systems tint quietly. Radix Themes draws its ring layers with `--gray-a3` and its drops with `--black-a*`. Since the gray scale follows the theme's chosen grey, a Slate theme's ring is `#0000330f`, a navy at 6%, while a Sand theme's is `#20100010`, a brown. The drops stay neutral.

Atlassian is the migration story. Its legacy shadows used `#091E42`, its navy, at 25% and 31%: tinted towards its brand. The current theme uses `#1E1F21`, almost neutral, at the same alphas and offsets. On white, as the third pair shows, the change is close to invisible; it matters once a surface or page carries colour.

Carbon is the counter-example inside one system. Its ordinary `$shadow` is black, but its AI tokens are tinted blue in light, `aiDropShadow` at `rgba(15, 98, 254, 0.1)`, and go back to black, `rgba(0, 0, 0, 0.28)`, in Gray 100. A tint used as a signal, not a material, and dropped where it would not show.

Fluent states a rule for shadows on colour. On a coloured surface, it derives each layer's opacity from the colour's luminance (key `42 - 0.116 × L`, ambient `34 - 0.09 × L`) and points to its brand shadow tokens instead of the neutral ramp.

Make the shadow colour its own token, separate from the composite shadow, with a value per theme. Use a near-black from your neutral ramp; tint it towards the page's hue only when the page itself is noticeably coloured, and keep the tint dark enough that it still reads as shade. **The colour belongs in a token, so the theme can change it without rewriting every shadow.** Near-black is consensus; tinting is a judgement that pays off on warm or saturated grounds and does nothing on white.

---

## The page underneath

The same shadow reads much more strongly on a grey page than on a white one, because on grey the card's lighter fill does half the work.

Atlassian's raised shadow is 1px of offset, 1px of blur and a faint edge. On a white page under a white card, that is the only thing marking the card, and the top edge, which gets almost none of the offset, all but disappears.

<svg role="img" viewBox="0 0 720 230" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same white card three ways, drawn at twice size. On a white page with only Atlassian's raised shadow, the card's top and sides almost disappear and only the bottom edge shows. On a light grey page with the same shadow, the whole outline reads, because the fill step and the shadow work together. On a white page with a 1 pixel grey border and no shadow, the outline reads evenly on all four sides.</title>
<rect x="0" y="0" width="720" height="230" fill="#f7f6f2"/>
<defs><filter id="pg-r" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b0"/>
<feOffset in="b0" dx="0" dy="2" result="o0"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.251"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b1"/>
<feOffset in="b1" dx="0" dy="0" result="o1"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.310"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter></defs>
<rect x="0" y="0" width="240" height="230" fill="#ffffff"/>
<rect x="240" y="0" width="240" height="230" fill="#f1f2f4"/>
<rect x="480" y="0" width="240" height="230" fill="#ffffff"/>
<rect x="40" y="56" width="160" height="100" rx="8" fill="#ffffff" filter="url(#pg-r)"/>
<rect x="280" y="56" width="160" height="100" rx="8" fill="#ffffff" filter="url(#pg-r)"/>
<rect x="520.5" y="56.5" width="160" height="100" rx="8" fill="#ffffff" stroke="#8c959f" stroke-width="1"/>
<text x="24" y="32" font-size="13" fill="#1a1a1a" font-weight="600">White page, shadow only</text>
<text x="264" y="32" font-size="13" fill="#1a1a1a" font-weight="600">Grey page, same shadow</text>
<text x="504" y="32" font-size="13" fill="#1a1a1a" font-weight="600">White page, 1px border</text>
<text x="24" y="186" font-size="12" fill="#5a5850">edge = shadow alone</text>
<text x="264" y="186" font-size="12" fill="#5a5850">edge = fill step + shadow</text>
<text x="504" y="186" font-size="12" fill="#5a5850">edge = border, #8c959f</text>
<text x="24" y="214" font-size="11" fill="#5a5850">Atlassian shadow.raised, 0 1px 1px 25% + 0 0 1px 31%, drawn at 2×. Grey page #f1f2f4 (illustrative).</text>
</svg>

On the light grey page, the card's whole outline reads with the same token. The fill step gives every edge a little contrast, and the shadow adds weight along the bottom. On white, a 1px border gives an even outline without any shadow at all.

That is why Atlassian's light theme keeps `surface`, `surface-raised` and `surface-overlay` all white and pairs raised with a shadow, while its `surface-sunken` is grey. A raised card on a grey sunken column, the Jira board, gets both cues; a raised card straight on the white page gets only the shadow. Which surface sits on which is [how surfaces stack](how-surfaces-stack.md)'s subject.

Check every shadow on the page colours it will actually sit on, white and grey. If a resting card must sit directly on white, give it a border or a darker key layer, since its resting shadow alone leaves the top edge undrawn. **A resting shadow is tuned for one ground; on the other it either vanishes or shouts.** This is mechanism, not taste: the fill step and the shadow add up.

---

## Inset ring or border

An inset ring, `box-shadow: inset 0 0 0 1px`, draws a stroke without taking any room, which matches how Figma draws an inside stroke by default; a border takes room, survives forced colours and paints above children.

A button is drawn in Figma at 40px tall with 12px of vertical padding and a 1px inside stroke. In code it ships with `border: 1px solid` and the same padding, and the label sits 1px lower inside a 42px button, or a 38px content area, depending on `box-sizing`. Where did the pixel go?

The knowledge base already maps each Figma stroke to the CSS channel that takes the same room (code-standard rule 63). What it does not show is what each channel does at the pixel level, and where the ring breaks. Here are the three channels drawn on a grid of device pixels at 2×.

<svg role="img" viewBox="0 0 720 276" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Three ways to draw a 1 pixel stroke on a box set to 24 by 12 CSS pixels, shown on a grid of device pixels at 2x. An inset box-shadow ring keeps the box at 24 by 12 and leaves all of it for content, the ring painted over the edge, which is how Figma draws an inside stroke excluded from layout. A border under box-sizing border-box keeps the outside at 24 by 12 but leaves only 22 by 10 for content, like an inside stroke included in layout. A border under content-box grows the box to 26 by 14, like an outside stroke.</title>
<rect x="0" y="0" width="720" height="276" fill="#f7f6f2"/>
<text x="16" y="28" font-size="14" fill="#1a1a1a" font-weight="600">inset 0 0 0 1px</text>
<text x="16" y="46" font-size="12" fill="#5a5850">Figma inside stroke, out of layout</text>
<g stroke="#d9d6cc" stroke-width="0.5"><line x1="20" y1="64" x2="20" y2="176"/><line x1="24" y1="64" x2="24" y2="176"/><line x1="28" y1="64" x2="28" y2="176"/><line x1="32" y1="64" x2="32" y2="176"/><line x1="36" y1="64" x2="36" y2="176"/><line x1="40" y1="64" x2="40" y2="176"/><line x1="44" y1="64" x2="44" y2="176"/><line x1="48" y1="64" x2="48" y2="176"/><line x1="52" y1="64" x2="52" y2="176"/><line x1="56" y1="64" x2="56" y2="176"/><line x1="60" y1="64" x2="60" y2="176"/><line x1="64" y1="64" x2="64" y2="176"/><line x1="68" y1="64" x2="68" y2="176"/><line x1="72" y1="64" x2="72" y2="176"/><line x1="76" y1="64" x2="76" y2="176"/><line x1="80" y1="64" x2="80" y2="176"/><line x1="84" y1="64" x2="84" y2="176"/><line x1="88" y1="64" x2="88" y2="176"/><line x1="92" y1="64" x2="92" y2="176"/><line x1="96" y1="64" x2="96" y2="176"/><line x1="100" y1="64" x2="100" y2="176"/><line x1="104" y1="64" x2="104" y2="176"/><line x1="108" y1="64" x2="108" y2="176"/><line x1="112" y1="64" x2="112" y2="176"/><line x1="116" y1="64" x2="116" y2="176"/><line x1="120" y1="64" x2="120" y2="176"/><line x1="124" y1="64" x2="124" y2="176"/><line x1="128" y1="64" x2="128" y2="176"/><line x1="132" y1="64" x2="132" y2="176"/><line x1="136" y1="64" x2="136" y2="176"/><line x1="140" y1="64" x2="140" y2="176"/><line x1="144" y1="64" x2="144" y2="176"/><line x1="148" y1="64" x2="148" y2="176"/><line x1="152" y1="64" x2="152" y2="176"/><line x1="156" y1="64" x2="156" y2="176"/><line x1="160" y1="64" x2="160" y2="176"/><line x1="164" y1="64" x2="164" y2="176"/><line x1="168" y1="64" x2="168" y2="176"/><line x1="172" y1="64" x2="172" y2="176"/><line x1="176" y1="64" x2="176" y2="176"/><line x1="180" y1="64" x2="180" y2="176"/><line x1="184" y1="64" x2="184" y2="176"/><line x1="188" y1="64" x2="188" y2="176"/><line x1="192" y1="64" x2="192" y2="176"/><line x1="196" y1="64" x2="196" y2="176"/><line x1="200" y1="64" x2="200" y2="176"/><line x1="204" y1="64" x2="204" y2="176"/><line x1="208" y1="64" x2="208" y2="176"/><line x1="212" y1="64" x2="212" y2="176"/><line x1="216" y1="64" x2="216" y2="176"/><line x1="220" y1="64" x2="220" y2="176"/><line x1="224" y1="64" x2="224" y2="176"/><line x1="228" y1="64" x2="228" y2="176"/><line x1="20" y1="64" x2="228" y2="64"/><line x1="20" y1="68" x2="228" y2="68"/><line x1="20" y1="72" x2="228" y2="72"/><line x1="20" y1="76" x2="228" y2="76"/><line x1="20" y1="80" x2="228" y2="80"/><line x1="20" y1="84" x2="228" y2="84"/><line x1="20" y1="88" x2="228" y2="88"/><line x1="20" y1="92" x2="228" y2="92"/><line x1="20" y1="96" x2="228" y2="96"/><line x1="20" y1="100" x2="228" y2="100"/><line x1="20" y1="104" x2="228" y2="104"/><line x1="20" y1="108" x2="228" y2="108"/><line x1="20" y1="112" x2="228" y2="112"/><line x1="20" y1="116" x2="228" y2="116"/><line x1="20" y1="120" x2="228" y2="120"/><line x1="20" y1="124" x2="228" y2="124"/><line x1="20" y1="128" x2="228" y2="128"/><line x1="20" y1="132" x2="228" y2="132"/><line x1="20" y1="136" x2="228" y2="136"/><line x1="20" y1="140" x2="228" y2="140"/><line x1="20" y1="144" x2="228" y2="144"/><line x1="20" y1="148" x2="228" y2="148"/><line x1="20" y1="152" x2="228" y2="152"/><line x1="20" y1="156" x2="228" y2="156"/><line x1="20" y1="160" x2="228" y2="160"/><line x1="20" y1="164" x2="228" y2="164"/><line x1="20" y1="168" x2="228" y2="168"/><line x1="20" y1="172" x2="228" y2="172"/><line x1="20" y1="176" x2="228" y2="176"/></g>
<rect x="28" y="72" width="192" height="96" fill="#3b6fd0" fill-opacity="0.85"/>
<rect x="28" y="72" width="192" height="96" fill="#cfdcf3"/>
<rect x="32" y="76" width="184" height="88" fill="none" stroke="#3b6fd0" stroke-width="8" stroke-opacity="0.85"/>
<rect x="28" y="72" width="192" height="96" fill="none" stroke="#b5501f" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="16" y="196" font-size="12" fill="#1a1a1a">outer 24×12 css px</text>
<text x="16" y="213" font-size="12" fill="#b5501f">room for content 24×12</text>
<text x="256" y="28" font-size="14" fill="#1a1a1a" font-weight="600">border, border-box</text>
<text x="256" y="46" font-size="12" fill="#5a5850">Figma inside stroke, in layout</text>
<g stroke="#d9d6cc" stroke-width="0.5"><line x1="260" y1="64" x2="260" y2="176"/><line x1="264" y1="64" x2="264" y2="176"/><line x1="268" y1="64" x2="268" y2="176"/><line x1="272" y1="64" x2="272" y2="176"/><line x1="276" y1="64" x2="276" y2="176"/><line x1="280" y1="64" x2="280" y2="176"/><line x1="284" y1="64" x2="284" y2="176"/><line x1="288" y1="64" x2="288" y2="176"/><line x1="292" y1="64" x2="292" y2="176"/><line x1="296" y1="64" x2="296" y2="176"/><line x1="300" y1="64" x2="300" y2="176"/><line x1="304" y1="64" x2="304" y2="176"/><line x1="308" y1="64" x2="308" y2="176"/><line x1="312" y1="64" x2="312" y2="176"/><line x1="316" y1="64" x2="316" y2="176"/><line x1="320" y1="64" x2="320" y2="176"/><line x1="324" y1="64" x2="324" y2="176"/><line x1="328" y1="64" x2="328" y2="176"/><line x1="332" y1="64" x2="332" y2="176"/><line x1="336" y1="64" x2="336" y2="176"/><line x1="340" y1="64" x2="340" y2="176"/><line x1="344" y1="64" x2="344" y2="176"/><line x1="348" y1="64" x2="348" y2="176"/><line x1="352" y1="64" x2="352" y2="176"/><line x1="356" y1="64" x2="356" y2="176"/><line x1="360" y1="64" x2="360" y2="176"/><line x1="364" y1="64" x2="364" y2="176"/><line x1="368" y1="64" x2="368" y2="176"/><line x1="372" y1="64" x2="372" y2="176"/><line x1="376" y1="64" x2="376" y2="176"/><line x1="380" y1="64" x2="380" y2="176"/><line x1="384" y1="64" x2="384" y2="176"/><line x1="388" y1="64" x2="388" y2="176"/><line x1="392" y1="64" x2="392" y2="176"/><line x1="396" y1="64" x2="396" y2="176"/><line x1="400" y1="64" x2="400" y2="176"/><line x1="404" y1="64" x2="404" y2="176"/><line x1="408" y1="64" x2="408" y2="176"/><line x1="412" y1="64" x2="412" y2="176"/><line x1="416" y1="64" x2="416" y2="176"/><line x1="420" y1="64" x2="420" y2="176"/><line x1="424" y1="64" x2="424" y2="176"/><line x1="428" y1="64" x2="428" y2="176"/><line x1="432" y1="64" x2="432" y2="176"/><line x1="436" y1="64" x2="436" y2="176"/><line x1="440" y1="64" x2="440" y2="176"/><line x1="444" y1="64" x2="444" y2="176"/><line x1="448" y1="64" x2="448" y2="176"/><line x1="452" y1="64" x2="452" y2="176"/><line x1="456" y1="64" x2="456" y2="176"/><line x1="460" y1="64" x2="460" y2="176"/><line x1="464" y1="64" x2="464" y2="176"/><line x1="468" y1="64" x2="468" y2="176"/><line x1="260" y1="64" x2="468" y2="64"/><line x1="260" y1="68" x2="468" y2="68"/><line x1="260" y1="72" x2="468" y2="72"/><line x1="260" y1="76" x2="468" y2="76"/><line x1="260" y1="80" x2="468" y2="80"/><line x1="260" y1="84" x2="468" y2="84"/><line x1="260" y1="88" x2="468" y2="88"/><line x1="260" y1="92" x2="468" y2="92"/><line x1="260" y1="96" x2="468" y2="96"/><line x1="260" y1="100" x2="468" y2="100"/><line x1="260" y1="104" x2="468" y2="104"/><line x1="260" y1="108" x2="468" y2="108"/><line x1="260" y1="112" x2="468" y2="112"/><line x1="260" y1="116" x2="468" y2="116"/><line x1="260" y1="120" x2="468" y2="120"/><line x1="260" y1="124" x2="468" y2="124"/><line x1="260" y1="128" x2="468" y2="128"/><line x1="260" y1="132" x2="468" y2="132"/><line x1="260" y1="136" x2="468" y2="136"/><line x1="260" y1="140" x2="468" y2="140"/><line x1="260" y1="144" x2="468" y2="144"/><line x1="260" y1="148" x2="468" y2="148"/><line x1="260" y1="152" x2="468" y2="152"/><line x1="260" y1="156" x2="468" y2="156"/><line x1="260" y1="160" x2="468" y2="160"/><line x1="260" y1="164" x2="468" y2="164"/><line x1="260" y1="168" x2="468" y2="168"/><line x1="260" y1="172" x2="468" y2="172"/><line x1="260" y1="176" x2="468" y2="176"/></g>
<rect x="268" y="72" width="192" height="96" fill="#3b6fd0" fill-opacity="0.85"/>
<rect x="276" y="80" width="176" height="80" fill="#cfdcf3"/>
<rect x="276" y="80" width="176" height="80" fill="none" stroke="#b5501f" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="256" y="196" font-size="12" fill="#1a1a1a">outer 24×12 css px</text>
<text x="256" y="213" font-size="12" fill="#b5501f">room for content 22×10</text>
<text x="496" y="28" font-size="14" fill="#1a1a1a" font-weight="600">border, content-box</text>
<text x="496" y="46" font-size="12" fill="#5a5850">Figma outside stroke</text>
<g stroke="#d9d6cc" stroke-width="0.5"><line x1="500" y1="64" x2="500" y2="176"/><line x1="504" y1="64" x2="504" y2="176"/><line x1="508" y1="64" x2="508" y2="176"/><line x1="512" y1="64" x2="512" y2="176"/><line x1="516" y1="64" x2="516" y2="176"/><line x1="520" y1="64" x2="520" y2="176"/><line x1="524" y1="64" x2="524" y2="176"/><line x1="528" y1="64" x2="528" y2="176"/><line x1="532" y1="64" x2="532" y2="176"/><line x1="536" y1="64" x2="536" y2="176"/><line x1="540" y1="64" x2="540" y2="176"/><line x1="544" y1="64" x2="544" y2="176"/><line x1="548" y1="64" x2="548" y2="176"/><line x1="552" y1="64" x2="552" y2="176"/><line x1="556" y1="64" x2="556" y2="176"/><line x1="560" y1="64" x2="560" y2="176"/><line x1="564" y1="64" x2="564" y2="176"/><line x1="568" y1="64" x2="568" y2="176"/><line x1="572" y1="64" x2="572" y2="176"/><line x1="576" y1="64" x2="576" y2="176"/><line x1="580" y1="64" x2="580" y2="176"/><line x1="584" y1="64" x2="584" y2="176"/><line x1="588" y1="64" x2="588" y2="176"/><line x1="592" y1="64" x2="592" y2="176"/><line x1="596" y1="64" x2="596" y2="176"/><line x1="600" y1="64" x2="600" y2="176"/><line x1="604" y1="64" x2="604" y2="176"/><line x1="608" y1="64" x2="608" y2="176"/><line x1="612" y1="64" x2="612" y2="176"/><line x1="616" y1="64" x2="616" y2="176"/><line x1="620" y1="64" x2="620" y2="176"/><line x1="624" y1="64" x2="624" y2="176"/><line x1="628" y1="64" x2="628" y2="176"/><line x1="632" y1="64" x2="632" y2="176"/><line x1="636" y1="64" x2="636" y2="176"/><line x1="640" y1="64" x2="640" y2="176"/><line x1="644" y1="64" x2="644" y2="176"/><line x1="648" y1="64" x2="648" y2="176"/><line x1="652" y1="64" x2="652" y2="176"/><line x1="656" y1="64" x2="656" y2="176"/><line x1="660" y1="64" x2="660" y2="176"/><line x1="664" y1="64" x2="664" y2="176"/><line x1="668" y1="64" x2="668" y2="176"/><line x1="672" y1="64" x2="672" y2="176"/><line x1="676" y1="64" x2="676" y2="176"/><line x1="680" y1="64" x2="680" y2="176"/><line x1="684" y1="64" x2="684" y2="176"/><line x1="688" y1="64" x2="688" y2="176"/><line x1="692" y1="64" x2="692" y2="176"/><line x1="696" y1="64" x2="696" y2="176"/><line x1="700" y1="64" x2="700" y2="176"/><line x1="704" y1="64" x2="704" y2="176"/><line x1="708" y1="64" x2="708" y2="176"/><line x1="500" y1="64" x2="708" y2="64"/><line x1="500" y1="68" x2="708" y2="68"/><line x1="500" y1="72" x2="708" y2="72"/><line x1="500" y1="76" x2="708" y2="76"/><line x1="500" y1="80" x2="708" y2="80"/><line x1="500" y1="84" x2="708" y2="84"/><line x1="500" y1="88" x2="708" y2="88"/><line x1="500" y1="92" x2="708" y2="92"/><line x1="500" y1="96" x2="708" y2="96"/><line x1="500" y1="100" x2="708" y2="100"/><line x1="500" y1="104" x2="708" y2="104"/><line x1="500" y1="108" x2="708" y2="108"/><line x1="500" y1="112" x2="708" y2="112"/><line x1="500" y1="116" x2="708" y2="116"/><line x1="500" y1="120" x2="708" y2="120"/><line x1="500" y1="124" x2="708" y2="124"/><line x1="500" y1="128" x2="708" y2="128"/><line x1="500" y1="132" x2="708" y2="132"/><line x1="500" y1="136" x2="708" y2="136"/><line x1="500" y1="140" x2="708" y2="140"/><line x1="500" y1="144" x2="708" y2="144"/><line x1="500" y1="148" x2="708" y2="148"/><line x1="500" y1="152" x2="708" y2="152"/><line x1="500" y1="156" x2="708" y2="156"/><line x1="500" y1="160" x2="708" y2="160"/><line x1="500" y1="164" x2="708" y2="164"/><line x1="500" y1="168" x2="708" y2="168"/><line x1="500" y1="172" x2="708" y2="172"/><line x1="500" y1="176" x2="708" y2="176"/></g>
<rect x="500" y="64" width="208" height="112" fill="#3b6fd0" fill-opacity="0.85"/>
<rect x="508" y="72" width="192" height="96" fill="#cfdcf3"/>
<rect x="508" y="72" width="192" height="96" fill="none" stroke="#b5501f" stroke-width="1.5" stroke-dasharray="4 3"/>
<text x="496" y="196" font-size="12" fill="#1a1a1a">outer 26×14 css px</text>
<text x="496" y="213" font-size="12" fill="#b5501f">room for content 24×12</text>
<text x="16" y="246" font-size="11" fill="#5a5850">Each square is one device pixel at 2×; the box is set to 24×12 CSS px. Blue is the 1px stroke, two device pixels wide;</text>
<text x="16" y="262" font-size="11" fill="#5a5850">pale blue is the area padding and children are measured from (dashed). Geometry per CSS box model, drawn here.</text>
</svg>

The inset ring keeps the box at its set size and leaves the whole of it for padding and children; the ring is painted over the edge. That is Figma's inside stroke with strokes excluded from layout, the default, which is why a ring matches the design pixel for pixel. A `border-box` border keeps the outside the same but steals 1px per side from the content, like Figma's "include strokes in layout". A `content-box` border grows the box.

That is why Polaris draws its button strokes as inset shadows (`shadow-button` is three inset layers, among them `0 0 0 1px` at 10% black) and why Radix's `--shadow-1`, the recessed style, opens with `inset 0 0 0 1px var(--gray-a5)`. A ring can change on hover or press without nudging the label by a pixel.

The ring has three costs a border does not. The first is paint order.

<svg role="img" viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Two cards with a full-bleed image at the top and a grey 1 pixel ring. On the left the ring is an inset box-shadow; the image, a child element, paints over it, so the ring vanishes along the top and down the upper sides and only shows around the text below. On the right the ring is a border; the image sits inside it and the ring runs unbroken around the whole card.</title>
<rect x="0" y="0" width="720" height="280" fill="#f7f6f2"/>
<text x="16" y="28" font-size="14" fill="#1a1a1a" font-weight="600">Ring as inset box-shadow</text>
<text x="376" y="28" font-size="14" fill="#1a1a1a" font-weight="600">Ring as border</text>
<clipPath id="cp-shadow"><rect x="36" y="48" width="300" height="170" rx="12"/></clipPath>
<rect x="36" y="48" width="300" height="170" rx="12" fill="#ffffff"/>
<rect x="37" y="49" width="298" height="168" rx="11" fill="none" stroke="#5b6573" stroke-width="2"/>
<g clip-path="url(#cp-shadow)"><rect x="36" y="48" width="300" height="78" fill="#2f5d50"/><path d="M36 126 L126 78 L186 108 L256 66 L336 100 L336 126 Z" fill="#6f9a7d"/></g>
<rect x="56" y="148" width="180" height="10" rx="2" fill="#b9b6ac"/>
<rect x="56" y="170" width="120" height="10" rx="2" fill="#b9b6ac"/>
<clipPath id="cp-border"><rect x="396" y="48" width="300" height="170" rx="12"/></clipPath>
<rect x="396" y="48" width="300" height="170" rx="12" fill="#ffffff"/>
<clipPath id="cp-border2"><rect x="398" y="50" width="296" height="166" rx="10"/></clipPath>
<g clip-path="url(#cp-border2)"><rect x="396" y="48" width="300" height="78" fill="#2f5d50"/><path d="M396 126 L486 78 L546 108 L616 66 L696 100 L696 126 Z" fill="#6f9a7d"/></g>
<rect x="397" y="49" width="298" height="168" rx="11" fill="none" stroke="#5b6573" stroke-width="2"/>
<rect x="416" y="148" width="180" height="10" rx="2" fill="#b9b6ac"/>
<rect x="416" y="170" width="120" height="10" rx="2" fill="#b9b6ac"/>
<text x="36" y="246" font-size="12" fill="#b5501f">The image covers the ring: inset shadows paint</text>
<text x="36" y="262" font-size="12" fill="#b5501f">under the element's children.</text>
<text x="396" y="246" font-size="12" fill="#1f5fbf">The border paints around the padding box,</text>
<text x="396" y="262" font-size="12" fill="#1f5fbf">outside anything a child draws.</text>
</svg>

CSS paints an inset shadow above the element's background and below its content. A child with its own fill, an image, a coloured header strip, a selected row, covers the ring wherever it touches the edge. A border is painted around the padding box, outside anything a child draws, so it stays whole.

The second cost is forced colours. The CSS Color Adjustment spec computes `box-shadow` to `none` in forced colours mode, inset rings included, while a border's colour is replaced with a system colour and stays visible. A control whose only outline is a ring has no outline at all for a Windows High Contrast user.

The third cost is the half pixel.

<svg role="img" viewBox="0 0 720 222" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A half-pixel hairline at two pixel densities, each square one device pixel inward from the edge. On a 1x screen a 0.5px border snaps up to one solid device pixel, while a 0.5px inset box-shadow ring is drawn as a half-strength grey pixel, marked unchecked. On a 2x screen a 0.5px border is one crisp device pixel and a 1px border is two.</title>
<rect x="0" y="0" width="720" height="222" fill="#f7f6f2"/>
<text x="20" y="28" font-size="13" fill="#1a1a1a" font-weight="600">1× screen</text>
<text x="20" y="46" font-size="12" fill="#1f5fbf">border: 0.5px</text>
<rect x="40" y="70" width="60" height="10" fill="#1a1a1a" fill-opacity="1" stroke="#d9d6cc" stroke-width="0.5"/><rect x="40" y="80" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="40" y="90" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="40" y="100" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="40" y="110" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/>
<line x1="30" y1="70" x2="30" y2="120" stroke="#5a5850" stroke-width="1"/>
<text x="34" y="66" font-size="10" fill="#5a5850">edge</text>
<text x="20" y="146" font-size="12" fill="#5a5850">snapped up to one</text>
<text x="20" y="162" font-size="12" fill="#5a5850">solid device pixel</text>
<text x="200" y="28" font-size="13" fill="#1a1a1a" font-weight="600">1× screen</text>
<text x="200" y="46" font-size="12" fill="#1f5fbf">inset 0 0 0 0.5px</text>
<rect x="220" y="70" width="60" height="10" fill="#1a1a1a" fill-opacity="0.5" stroke="#d9d6cc" stroke-width="0.5"/><rect x="220" y="80" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="220" y="90" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="220" y="100" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="220" y="110" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/>
<line x1="210" y1="70" x2="210" y2="120" stroke="#5a5850" stroke-width="1"/>
<text x="214" y="66" font-size="10" fill="#5a5850">edge</text>
<text x="200" y="146" font-size="12" fill="#5a5850">likely a half-strength pixel</text>
<text x="200" y="162" font-size="12" fill="#5a5850">(unchecked)</text>
<text x="380" y="28" font-size="13" fill="#1a1a1a" font-weight="600">2× screen</text>
<text x="380" y="46" font-size="12" fill="#1f5fbf">border: 0.5px</text>
<rect x="400" y="70" width="60" height="10" fill="#1a1a1a" fill-opacity="1" stroke="#d9d6cc" stroke-width="0.5"/><rect x="400" y="80" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="400" y="90" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="400" y="100" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="400" y="110" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/>
<line x1="390" y1="70" x2="390" y2="120" stroke="#5a5850" stroke-width="1"/>
<text x="394" y="66" font-size="10" fill="#5a5850">edge</text>
<text x="380" y="146" font-size="12" fill="#5a5850">one device pixel, crisp</text>
<text x="380" y="162" font-size="12" fill="#5a5850"></text>
<text x="560" y="28" font-size="13" fill="#1a1a1a" font-weight="600">2× screen</text>
<text x="560" y="46" font-size="12" fill="#1f5fbf">border: 1px</text>
<rect x="580" y="70" width="60" height="10" fill="#1a1a1a" fill-opacity="1" stroke="#d9d6cc" stroke-width="0.5"/><rect x="580" y="80" width="60" height="10" fill="#1a1a1a" fill-opacity="1" stroke="#d9d6cc" stroke-width="0.5"/><rect x="580" y="90" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="580" y="100" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/><rect x="580" y="110" width="60" height="10" fill="#1a1a1a" fill-opacity="0" stroke="#d9d6cc" stroke-width="0.5"/>
<line x1="570" y1="70" x2="570" y2="120" stroke="#5a5850" stroke-width="1"/>
<text x="574" y="66" font-size="10" fill="#5a5850">edge</text>
<text x="560" y="146" font-size="12" fill="#5a5850">two device pixels</text>
<text x="560" y="162" font-size="12" fill="#5a5850"></text>
<text x="20" y="192" font-size="11" fill="#5a5850">Each block is one device pixel inward from the box edge. Border widths follow CSS Values 4's line-width snapping;</text>
<text x="20" y="208" font-size="11" fill="#5a5850">box-shadow spread is not listed for snapping, so its 1× rendering is drawn as a browser might, not as specified.</text>
</svg>

CSS Values 4 snaps `border-width` to whole device pixels: a 0.5px border becomes one solid device pixel on a 1× screen and stays one crisp device pixel at 2×. `box-shadow` spread is not listed for that snapping, so a 0.5px ring on a 1× screen may render as a half-strength, anti-aliased pixel. A team designing hairlines at 2× and shipping to mixed screens sees the ring go soft where the border would not.

Dark mode exposes the same trade. Primer and Atlassian both put a solid ring, `#3d444d` and an alpha white, in front of their dark overlay shadows. As a ring it adds no layout; as a border it would also survive forced colours, which is why the knowledge base asks floating surfaces for a real border as well.

Here are the traps in one place:

| Trap | What it looks like | Why |
|---|---|---|
| Ring under a full-bleed child | Ring missing along an image or header | Inset shadows paint below children |
| Ring as the only outline | Control has no edge in forced colours | `box-shadow` computes to `none` |
| 0.5px ring on 1× | Soft grey hairline | Spread is not snapped like `border-width` |
| Border where Figma had an excluded stroke | Label 1px off, or box 2px larger | Border takes room the stroke did not |
| Ring plus outer shadow in one token | Ring disappears when the shadow is swapped for a hover value | One composite, two jobs |

Use an inset ring for strokes that change with state on controls (a button's edge, a pressed bevel), where keeping the label still matters and no child paints to the edge. Use a border for containers that hold images or coloured children, for any outline that must survive forced colours, and for hairlines on mixed-density screens. **A ring takes no room and a border survives; choose by which of the two the element can't do without.** Polaris and Radix show the ring works at scale for controls; the forced-colours and paint-order costs are mechanism, not opinion.

---

## Naming shadow tokens

Systems name shadow tokens either by the surface's role (`elevation.shadow.raised`) or by the shadow's size (`shadow-400`), and the role names survive change better; the value is a composite that the DTCG format can now describe.

A designer looks for "the menu shadow". In Atlassian it is `elevation.shadow.overlay`. In Polaris it is a number, `shadow-300` or `shadow-400`, and the answer depends on someone remembering which.

The naming styles split cleanly:

- **By role:** Atlassian `elevation.shadow.raised` and `elevation.shadow.overlay`, under the same `elevation.*` root as `elevation.surface.raised`, so the pairing is in the name.
- **By job and size:** Primer `shadow-resting-small`, `shadow-floating-large`: a role word, then a size.
- **By scale step:** Polaris `shadow-100` to `-600`, Fluent `shadow2` to `shadow64`, Radix `--shadow-1` to `-6`, Material `level0` to `level5`.

Fluent's numbers carry a meaning: the step is the blur of the key layer. `shadow16` has a 16px blur. That makes the name a value name, which is honest but means a retuned shadow either breaks its name or keeps a lie.

Material sits on both sides. The system token `md-sys-elevation-level3` is a scale step, but each component token names its role, `md-comp-dialog-container-elevation`, and points at the step. That two-tier pattern is what keeps its six steps from drifting.

Underneath the names, a shadow is a composite: several layers, each with a colour, offsets, blur and spread. The DTCG Format Module 2025.10, a W3C Community Group report rather than a W3C standard, defines a `shadow` type with exactly those properties (`color`, `offsetX`, `offsetY`, `blur`, `spread`) and an optional `inset` boolean. Its value can be one shadow object or an array of them, so a two-layer shadow is one token.

```json
{
  "shadow": {
    "color": {
      "$type": "color",
      "edge": { "$value": { "colorSpace": "srgb", "components": [0.118, 0.122, 0.129], "alpha": 0.31 } },
      "drop": { "$value": { "colorSpace": "srgb", "components": [0.118, 0.122, 0.129], "alpha": 0.25 } }
    },
    "raised": {
      "$type": "shadow",
      "$value": [
        { "color": "{shadow.color.drop}",
          "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 1, "unit": "px" },
          "blur": { "value": 1, "unit": "px" }, "spread": { "value": 0, "unit": "px" } },
        { "color": "{shadow.color.edge}",
          "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 0, "unit": "px" },
          "blur": { "value": 1, "unit": "px" }, "spread": { "value": 0, "unit": "px" } }
      ]
    }
  }
}
```

That sketch is Atlassian's `shadow.raised` written in the 2025.10 form, with dimensions as value-and-unit objects and colours carrying a colour space, as in the spec's own example. Two details matter more than its shape. Each layer's colour is a reference, which is what lets a theme change it. And because each layer has its own alpha, the colour tokens come one per alpha, two here.

On the Figma side, an effect style holds the layers, and each drop shadow's colour, offsets, blur and spread can be bound to variables. Bound to a colour variable with light and dark modes, one shadow style follows the theme the way the DTCG reference does.

Name shadow tokens by role at the level components use (`shadow.raised`, `shadow.overlay`, or `elevation.shadow.*` beside `elevation.surface.*`), and keep any numbered scale one tier below. Store each as a DTCG `shadow` array, with the colour referenced from a theme-aware token. **Components ask for a role; only the role token knows the step.** Role names over step names is judgement backed by Material's two tiers and Atlassian's pairing; the DTCG type is the published format.

---

## Hover and drag

Hover raises a surface one step at most, and a drag lifts it to the floating level; anything more makes a resting card compete with the menus above it.

Back to the card hover from the opening. The team's card rests at the raised shadow and hovers at the dialog's. Moving the pointer across a grid now makes each card jump to dialog height in turn, and the menu that opens from one of them no longer looks above it.

Here is how Material's own card tokens step through its states.

<svg role="img" viewBox="0 0 720 266" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>One Material 3 elevated card in three states rendered from its tokens. At rest it sits at level 1 with a tight shadow. On hover it rises one step to level 2, a small change. While dragged it jumps to level 4, tilted slightly, with a dashed outline marking where it will land.</title>
<rect x="0" y="0" width="720" height="266" fill="#f7f6f2"/>
<defs><filter id="hv1" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="1" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="1.5" result="b1"/>
<feOffset in="b1" dx="0" dy="1" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="hv2" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="2" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="3" result="b1"/>
<feOffset in="b1" dx="0" dy="2" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="hv4" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="b0"/>
<feOffset in="b0" dx="0" dy="2" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.300"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="dilate" radius="4" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="5" result="b1"/>
<feOffset in="b1" dx="0" dy="6" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.150"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter></defs>
<rect x="30" y="64" width="160" height="84" rx="12" fill="#ffffff" filter="url(#hv1)"/>
<text x="30" y="36" font-size="14" fill="#1a1a1a" font-weight="600">Rest</text>
<text x="30" y="186" font-size="12" fill="#5a5850">level1, elevated card</text>
<rect x="270" y="64" width="160" height="84" rx="12" fill="#ffffff" filter="url(#hv2)"/>
<text x="270" y="36" font-size="14" fill="#1a1a1a" font-weight="600">Hover</text>
<text x="270" y="186" font-size="12" fill="#5a5850">level2: one step</text>
<rect x="520" y="72" width="160" height="84" rx="12" fill="none" stroke="#b9b6ac" stroke-dasharray="5 4"/>
<rect x="510" y="60" width="160" height="84" rx="12" fill="#ffffff" filter="url(#hv4)" transform="rotate(-3 590 110)"/>
<text x="510" y="36" font-size="14" fill="#1a1a1a" font-weight="600">Dragged</text>
<text x="510" y="186" font-size="12" fill="#5a5850">level4: three steps</text>
<text x="510" y="204" font-size="12" fill="#5a5850">dashed: where it will drop</text>
<text x="30" y="236" font-size="11" fill="#5a5850">Material 3 elevated-card tokens: container level1, hover level2, dragged level4. Atlassian lifts a dragged raised</text>
<text x="30" y="252" font-size="11" fill="#5a5850">card to overlay and returns it on drop.</text>
</svg>

The hover step is small: `level1` to `level2`, the ambient layer growing from 3px to 6px of blur. The drag is large: `level1` to `level4`, a different kind of state. Material's filled button follows the same rule from lower down, `level0` at rest and `level1` on hover, and its FAB goes `level3` to `level4`.

Atlassian gives a choice, not a combination. Hover and press can change the fill (`elevation.surface.hovered`, `elevation.surface.pressed`) or, for default and raised surfaces only, the elevation (overlay on hover, raised on press), never both. A dragged raised card goes to overlay and comes back on drop.

The pressed state usually goes down, not up. Material's elevated card returns to `level1` on press, and Polaris's buttons swap to `shadow-button-inset` and `shadow-button-primary-inset`, inset shadows that make the button look pushed in.

Hover lift has an accessibility limit worth knowing. WCAG's Understanding page for 1.4.11 treats author-supplied hover effects as supplemental, so a hover shadow need not meet 3:1. It also means the hover shadow can't be the only signal that something is interactive, since touch users never see it.

Define hover as one step up from rest, press as rest or an inset, and drag as the floating role. Keep the floating role higher than any hover, so a menu opened from a hovered card still sits above it. **Hover nudges; drag lifts; and nothing on the page hovers as high as what floats over it.** The one-step hover and drag-to-overlay are consensus between Material and Atlassian; pressing down instead of up is shared by Material and Polaris.

---

## Borders in dense interfaces

In tables, lists and data-heavy panels, systems separate rows with 1px lines and keep shadows for the few things that float, because a shadow costs space, ink and attention on every row.

A team rebuilds an issue list as a stack of cards, each with a soft shadow and a 10px gap. The list looked calm in the mock-up with four rows. With forty, it is a column of blurred blocks, and only six fit where eight used to.

<svg role="img" viewBox="0 0 720 400" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same list twice in a 288 pixel tall area. On the left, eight 36 pixel rows sit in one bordered container separated by 1 pixel hairlines. On the right, each row is its own card with a soft shadow and a 10 pixel gap, and only six rows fit; the column becomes a stack of floating blocks with a blur on every row.</title>
<rect x="0" y="0" width="720" height="400" fill="#f7f6f2"/>
<defs><filter id="dn" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#000000" flood-opacity="0.120"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b1"/>
<feOffset in="b1" dx="0" dy="1" result="o1"/>
<feFlood flood-color="#000000" flood-opacity="0.080"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter></defs>
<text x="24" y="28" font-size="14" fill="#1a1a1a" font-weight="600">Rows divided by 1px hairlines</text>
<text x="384" y="28" font-size="14" fill="#1a1a1a" font-weight="600">Rows as separate shadowed cards</text>
<rect x="24.5" y="44.5" width="312" height="288" rx="6" fill="#ffffff" stroke="#d0d7de"/>
<rect x="40" y="57" width="120" height="10" rx="2" fill="#b9b6ac"/>
<rect x="276" y="57" width="44" height="10" rx="2" fill="#d6d3ca"/>
<line x1="25" y1="80.5" x2="336" y2="80.5" stroke="#d8dee4" stroke-width="1"/>
<rect x="40" y="93" width="157" height="10" rx="2" fill="#b9b6ac"/>
<rect x="276" y="93" width="44" height="10" rx="2" fill="#d6d3ca"/>
<line x1="25" y1="116.5" x2="336" y2="116.5" stroke="#d8dee4" stroke-width="1"/>
<rect x="40" y="129" width="194" height="10" rx="2" fill="#b9b6ac"/>
<rect x="276" y="129" width="44" height="10" rx="2" fill="#d6d3ca"/>
<line x1="25" y1="152.5" x2="336" y2="152.5" stroke="#d8dee4" stroke-width="1"/>
<rect x="40" y="165" width="141" height="10" rx="2" fill="#b9b6ac"/>
<rect x="276" y="165" width="44" height="10" rx="2" fill="#d6d3ca"/>
<line x1="25" y1="188.5" x2="336" y2="188.5" stroke="#d8dee4" stroke-width="1"/>
<rect x="40" y="201" width="178" height="10" rx="2" fill="#b9b6ac"/>
<rect x="276" y="201" width="44" height="10" rx="2" fill="#d6d3ca"/>
<line x1="25" y1="224.5" x2="336" y2="224.5" stroke="#d8dee4" stroke-width="1"/>
<rect x="40" y="237" width="125" height="10" rx="2" fill="#b9b6ac"/>
<rect x="276" y="237" width="44" height="10" rx="2" fill="#d6d3ca"/>
<line x1="25" y1="260.5" x2="336" y2="260.5" stroke="#d8dee4" stroke-width="1"/>
<rect x="40" y="273" width="162" height="10" rx="2" fill="#b9b6ac"/>
<rect x="276" y="273" width="44" height="10" rx="2" fill="#d6d3ca"/>
<line x1="25" y1="296.5" x2="336" y2="296.5" stroke="#d8dee4" stroke-width="1"/>
<rect x="40" y="309" width="199" height="10" rx="2" fill="#b9b6ac"/>
<rect x="276" y="309" width="44" height="10" rx="2" fill="#d6d3ca"/>
<rect x="384" y="44" width="312" height="38" rx="6" fill="#ffffff" filter="url(#dn)"/>
<rect x="400" y="58" width="120" height="10" rx="2" fill="#b9b6ac"/>
<rect x="636" y="58" width="44" height="10" rx="2" fill="#d6d3ca"/>
<rect x="384" y="92" width="312" height="38" rx="6" fill="#ffffff" filter="url(#dn)"/>
<rect x="400" y="106" width="157" height="10" rx="2" fill="#b9b6ac"/>
<rect x="636" y="106" width="44" height="10" rx="2" fill="#d6d3ca"/>
<rect x="384" y="140" width="312" height="38" rx="6" fill="#ffffff" filter="url(#dn)"/>
<rect x="400" y="154" width="194" height="10" rx="2" fill="#b9b6ac"/>
<rect x="636" y="154" width="44" height="10" rx="2" fill="#d6d3ca"/>
<rect x="384" y="188" width="312" height="38" rx="6" fill="#ffffff" filter="url(#dn)"/>
<rect x="400" y="202" width="141" height="10" rx="2" fill="#b9b6ac"/>
<rect x="636" y="202" width="44" height="10" rx="2" fill="#d6d3ca"/>
<rect x="384" y="236" width="312" height="38" rx="6" fill="#ffffff" filter="url(#dn)"/>
<rect x="400" y="250" width="178" height="10" rx="2" fill="#b9b6ac"/>
<rect x="636" y="250" width="44" height="10" rx="2" fill="#d6d3ca"/>
<rect x="384" y="284" width="312" height="38" rx="6" fill="#ffffff" filter="url(#dn)"/>
<rect x="400" y="298" width="125" height="10" rx="2" fill="#b9b6ac"/>
<rect x="636" y="298" width="44" height="10" rx="2" fill="#d6d3ca"/>
<text x="24" y="360" font-size="12" fill="#1f5fbf">8 rows in 288px, one edge per row</text>
<text x="384" y="360" font-size="12" fill="#b5501f">6 rows in 288px, four edges and a blur per row</text>
<text x="24" y="386" font-size="11" fill="#5a5850">Illustrative: 36px rows; 38px cards with 10px gaps and a light two-layer shadow.</text>
</svg>

The hairline list fits eight 36px rows in 288px with one edge per row. The card stack fits six, because each card needs a gap for its shadow to show, and each row now has four edges and a blur. Nothing in the content asked for depth; the rows are not movable or floating.

The systems agree here more than anywhere else:

- **Atlassian** says not to use elevation to group content where a border or white space would do, and makes borders the default for scrolled content such as sticky headers. It keeps its overflow shadow for small UI and tables where a border might be missed.
- **Carbon** draws its tiles flat, separated by layer fills, and spends its one shadow mixin on the overflow menu, with a lighter `drop-shadow` on popovers.
- **Primer**'s resting shadows are deliberately close to invisible: `shadow-resting-small` is two layers at 4% and 3%, too faint to separate anything without a line beside it.
- **Polaris** goes furthest. Its `p-theme-light-mobile` theme sets `--p-shadow-100` and `--p-shadow-bevel-100` to `none` and redraws its buttons as an inset `0 0 0 var(--p-border-width-025)` border. On small screens, where density matters most, the shadows go and the lines stay.

The counter-example is Material, whose elevated card does rest at `level1`. It also ships filled and outlined cards with no shadow, and its lists are flat.

Use 1px dividers for rows and a bordered container for the table or list; give shadows only to what floats over it (a menu, a sticky header once it overlaps scrolled content, a dragged row). **Depth is a signal; on every row, it stops signalling anything.** This is the strongest consensus in the guide, and Polaris's mobile theme is a system acting on it.

---

## Shadows as boundaries

A shadow cannot be relied on to meet non-text contrast: WCAG treats it as part of the nearest colour, and its darkest layer rarely reaches 3:1 anyway.

A text input is drawn as a white field on a white page with a soft shadow and no border, and looks clean. The question in an accessibility review is whether that field's boundary meets 1.4.11.

WCAG's Understanding page for 1.4.11 answers it directly. A boundary is required only when nothing else identifies the control, and a text input with no other cue is the standard case where it is. For drop shadows, the page treats the shadow as subsumed into whichever adjacent colour is closest in brightness. The shadow does not become a separate boundary colour to measure.

Even measured generously, it would not pass.

<svg role="img" viewBox="0 0 720 210" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Three text inputs on a white page, each labelled Email address. The first has only Atlassian's raised shadow; even its darkest layer at full strength would measure 1.95 to 1 against white, and the blur makes it fainter. The second has a light grey border, 1.43 to 1, which fails non-text contrast when the border is what identifies the field. The third has a mid-grey border, 3.04 to 1, which passes.</title>
<rect x="0" y="0" width="720" height="210" fill="#f7f6f2"/>
<defs><filter id="bd" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b0"/>
<feOffset in="b0" dx="0" dy="1" result="o0"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.251"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b1"/>
<feOffset in="b1" dx="0" dy="0" result="o1"/>
<feFlood flood-color="#1E1F21" flood-opacity="0.310"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter></defs>
<rect x="0" y="0" width="720" height="210" fill="#ffffff"/>
<text x="24" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Shadow only</text>
<text x="24" y="64" font-size="12" fill="#1a1a1a">Email address</text>
<rect x="24" y="74" width="200" height="36" rx="6" fill="#ffffff" filter="url(#bd)"/>
<text x="24" y="140" font-size="12" fill="#b5501f">darkest layer at full</text>
<text x="24" y="157" font-size="12" fill="#b5501f">strength: 1.95:1</text>
<text x="264" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Border #d1d9e0</text>
<text x="264" y="64" font-size="12" fill="#1a1a1a">Email address</text>
<rect x="264.5" y="74.5" width="200" height="36" rx="6" fill="#ffffff" stroke="#d1d9e0"/>
<text x="264" y="140" font-size="12" fill="#b5501f">1.43:1 against white</text>
<text x="264" y="157" font-size="12" fill="#b5501f">fails 3:1 if it identifies</text>
<text x="504" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Border #8c959f</text>
<text x="504" y="64" font-size="12" fill="#1a1a1a">Email address</text>
<rect x="504.5" y="74.5" width="200" height="36" rx="6" fill="#ffffff" stroke="#8c959f"/>
<text x="504" y="140" font-size="12" fill="#1f5fbf">3.04:1 against white</text>
<text x="504" y="157" font-size="12" fill="#1f5fbf">passes 3:1</text>
<text x="24" y="192" font-size="11" fill="#5a5850">Inputs on white. Shadow: Atlassian shadow.raised, ratio computed for #1E1F21 at 31% over white, before blur thins it.</text>
</svg>

Atlassian's raised shadow uses `#1E1F21` at up to 31%. Over white, that unblurred colour measures 1.95:1, and the 1px blur thins it further at every real pixel. Primer's default border, `#d1d9e0`, measures 1.43:1, decorative by WCAG's terms. A border at `#8c959f` reaches 3.04:1.

This is also where the knowledge base's forced-colours point bites twice. A field outlined by a shadow or an inset ring loses its outline entirely in forced colours, because `box-shadow` computes to `none`.

Give every control whose edge identifies it (text inputs, selects, checkboxes, unlabelled toggles) a border at 3:1 against the surface it sits on, and treat its shadow as decoration. Cards and menus don't need one for 1.4.11, though they need a border for forced colours. **A shadow is never the boundary of record; a border is.** This follows from WCAG's own text, not from system practice.

> **Aside.** NN/g's 2017 eye-tracking study (71 participants) found that pages with weak signifiers took 22% longer to use than the same pages with strong ones. Shadows were one of several cues bundled into "strong", so it supports depth cues for clickability in general, not shadows in particular.

---

## Shadows in dark mode

In dark mode a shadow needs far more opacity and a ring in front of it, and lighter surfaces carry most of the depth; the full treatment is in [surfaces in dark mode](surfaces-in-dark-mode.md).

<svg role="img" viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>One card on three grounds, using Primer's values drawn at twice size. On a white page, the light resting-medium shadow reads. On GitHub's dark page, the same light-theme shadow reused on a slightly lighter card disappears, and only the small fill step separates the card. With Primer's dark floating-small value, a 1 pixel grey ring and two 40 percent drops, the card's edge is clear again.</title>
<rect x="0" y="0" width="720" height="220" fill="#f7f6f2"/>
<defs><filter id="dk-l" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b0"/>
<feOffset in="b0" dx="0" dy="6" result="o0"/>
<feFlood flood-color="#25292e" flood-opacity="0.122"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b1"/>
<feOffset in="b1" dx="0" dy="2" result="o1"/>
<feFlood flood-color="#25292e" flood-opacity="0.102"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="dk-d" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation="6" result="b0"/>
<feOffset in="b0" dx="0" dy="6" result="o0"/>
<feFlood flood-color="#25292e" flood-opacity="0.122"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="1" result="b1"/>
<feOffset in="b1" dx="0" dy="2" result="o1"/>
<feFlood flood-color="#25292e" flood-opacity="0.102"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feMerge><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter><filter id="dk-p" x="-100%" y="-100%" width="300%" height="350%" color-interpolation-filters="sRGB">
<feMorphology in="SourceAlpha" operator="dilate" radius="2" result="m0"/>
<feGaussianBlur in="m0" stdDeviation="0" result="b0"/>
<feOffset in="b0" dx="0" dy="0" result="o0"/>
<feFlood flood-color="#3d444d" flood-opacity="1.000"/>
<feComposite in2="o0" operator="in" result="s0"/>
<feMorphology in="SourceAlpha" operator="erode" radius="6" result="m1"/>
<feGaussianBlur in="m1" stdDeviation="12" result="b1"/>
<feOffset in="b1" dx="0" dy="12" result="o1"/>
<feFlood flood-color="#010409" flood-opacity="0.400"/>
<feComposite in2="o1" operator="in" result="s1"/>
<feGaussianBlur in="SourceAlpha" stdDeviation="18" result="b2"/>
<feOffset in="b2" dx="0" dy="12" result="o2"/>
<feFlood flood-color="#010409" flood-opacity="0.400"/>
<feComposite in2="o2" operator="in" result="s2"/>
<feMerge><feMergeNode in="s2"/><feMergeNode in="s1"/><feMergeNode in="s0"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter></defs>
<rect x="0" y="0" width="240" height="220" fill="#ffffff"/>
<rect x="240" y="0" width="480" height="220" fill="#0d1117"/>
<rect x="40" y="50" width="160" height="96" rx="8" fill="#ffffff" filter="url(#dk-l)"/>
<rect x="280" y="50" width="160" height="96" rx="8" fill="#151b23" filter="url(#dk-d)"/>
<rect x="520" y="50" width="160" height="96" rx="8" fill="#151b23" filter="url(#dk-p)"/>
<text x="24" y="30" font-size="13" fill="#1a1a1a" font-weight="600">Light: resting-medium</text>
<text x="264" y="30" font-size="13" fill="#e6edf3" font-weight="600">Dark: the light value reused</text>
<text x="504" y="30" font-size="13" fill="#e6edf3" font-weight="600">Dark: floating-small, dark value</text>
<text x="24" y="176" font-size="12" fill="#5a5850">12% and 10% drops read</text>
<text x="264" y="176" font-size="12" fill="#9198a1">same drops: gone; the fill step alone</text>
<text x="504" y="176" font-size="12" fill="#9198a1">#3d444d ring + 40% drops</text>
<text x="24" y="204" font-size="11" fill="#5a5850">Primer values, drawn at 2×.</text>
</svg>

Primer's light resting shadow is about 12% at its strongest; reused on GitHub's dark page, it vanishes, and only the small step from `#0d1117` to `#151b23` marks the card. Primer's dark tokens go to 40% to 80% near-black and open floating shadows with a `#3d444d` ring. Fluent doubles its alphas; Carbon goes from 30% to 80%; Material keeps black and relies on its tonal surfaces.

Give every shadow token a dark value of its own, never the light one, and put a ring or border in front of floating ones. **In dark, the surface step and the ring do the work, and the shadow only adds weight.** The surfaces themselves are in [surfaces in dark mode](surfaces-in-dark-mode.md).

---

## Cheat sheet

| Decision | Write this | Not this |
|---|---|---|
| How many shadow roles | `shadow.raised`, `shadow.overlay` (plus hover and drag states) | A seven-step scale components pick from by eye |
| Layers per token | Key + ambient, or ring + drop | One layer doing edge and distance |
| As levels rise | Larger offset, blur, spread | Darker alpha |
| Shadow colour | A `shadow.color` token, near-black, per theme | `rgba(0,0,0,.2)` written into every shadow |
| On a coloured page | Tint the colour token towards the page hue | Black over cream |
| Stroke that changes with state | `inset 0 0 0 1px` | A border that moves the label |
| Container with images or coloured children | `border` | An inset ring the children cover |
| Hairline on 1× and 2× screens | `border` (snaps) | A 0.5px ring |
| Hover | One step up | The floating step |
| Pressed | Rest, or an inset | Higher than hover |
| Drag | The floating role | A custom shadow |
| Rows in a table or list | 1px divider | A shadow per row |
| Control edge (input, select) | Border at 3:1 | Shadow only |
| Dark mode | Its own value, 40 to 80% plus a ring | The light value |
| Token format | DTCG `shadow` array with referenced colour | A CSS string in a string token |

---

## The short version

A shadow scale is as long as its list of reasons. Systems ship between one and seven steps, but components use two: resting and floating. Name those roles, map every component to one, and keep further steps only for hover and drag. Material's six levels and Atlassian's two behave the same way once you look at the component tokens, and Carbon gets by with one.

Build each token from a tight key layer for the edge and a wide ambient layer for distance, and let size, not darkness, grow with the level. Make the colour its own token with a value per theme: near-black almost everywhere, tinted towards the page only where the page is visibly coloured. Store the result as a DTCG `shadow` array named by role.

Use an inset ring where a stroke must change with state without moving anything, which is how Figma's default inside stroke behaves. Use a border on containers with full-bleed children, on hairlines, on anything that must survive forced colours, and on every control edge that has to meet 3:1, because a shadow never counts as a boundary. In dense lists and tables, lines separate and only floating things get a shadow.

Hover is one step, drag is the floating role, press goes down. In dark mode every shadow needs its own value and floating ones a ring, with surfaces doing most of the work. Two roles, layered tokens and borders on the edges that matter are consensus; tinting and the ring-versus-border split are judgements, and the reasons for each are above, ready to write into your token documentation.

---

## How strong the evidence is

Ranked by source type, strongest first:

1. **Shipped token values and component tokens.** Material Web, Fluent, Primer, Polaris, Atlassian, Carbon, Ant Design and Radix values were read from their published packages and source. These prove what ships, not what works.
2. **Standards.** WCAG 2.2's Understanding 1.4.11 (shadows subsumed into the nearest colour, hover supplemental), CSS Color Adjustment (box-shadow to none in forced colours), CSS Values 4 (line-width snapping) and the DTCG Format Module 2025.10.
3. **System documentation.** Atlassian's and Fluent's elevation pages for roles, hover, drag and the Windows stroke.
4. **User research.** One study, NN/g's 2017 eye-tracking test of strong and weak signifiers, in which shadows were bundled with other cues. No study was found that tests shadow steps, layer structure or tinting in interfaces.

The independence check is mixed. Key-plus-ambient layering appears in Material first (2014) and Fluent later, and Fluent uses the same key and ambient vocabulary, so their agreement is closer to one decision than two. Primer's ring-plus-drops, Atlassian's drop-plus-edge and Polaris's single layer with negative spread arrive at the same split of edge and distance by different routes, which is stronger. The preference for borders in dense UI is independent across Atlassian, Carbon, Primer and Polaris, four teams with different lineages; it is the best-supported claim here. Shadow tinting has no convergence at all: Atlassian moved away from a tinted shadow, Radix tints only its rings, and Carbon tints one family.

---

## What to re-check later

Researched November 2026.

- **Package versions read.** `@primer/primitives` 11.10.0, `@shopify/polaris-tokens` 9.4.2, `@atlaskit/tokens` 20.11.0 (and 4.5.0 for the older dark ring), `@fluentui/tokens` 1.0.0-alpha.24, `@carbon/themes` 11.85.0 and `@carbon/styles` 1.119.0, `@radix-ui/themes` 3.3.0, Ant Design `master` (6.7.0), Material Web `main` with tokens `v0_192`.
- **Fluent's documented values differ from its tokens.** The elevation page lists 24% and 20% for the high ramp; the web tokens use the same 14% and 12% for every step, with brand variants at 25% and 30%. The tokens were followed here.
- **Ant Design's `colorShadow` base value** was not resolved; the alphas shown are multipliers of it.
- **Polaris's component mapping** for `shadow-300` and `shadow-400` (which popover uses which) was not confirmed; its docs moved to shopify.dev during research.
- **Fluent's Windows stroke** is stated on the elevation page without values; the figure's stroke is illustrative.
- **Half-pixel ring rendering on 1×** is drawn as a likely result, unchecked in browsers; only `border-width` snapping is specified.
- **Figma effect variables.** Binding a shadow's colour, offsets, blur and spread is in the plugin API's `setBoundVariableForEffect`; a 2023 forum report of binding `color` resetting `spread` to 0 was not confirmed fixed. Re-test before relying on one style across themes.
- **Apple** publishes no shadow tokens or values in the HIG; its depth comes from system materials and window shadows, covered in [materials and translucency](materials-and-translucency.md).
- **The DTCG module** is a Community Group report, not a W3C standard, and a newer draft was dated 8 September 2026; re-read section 9.6 before writing a converter.
- **Figures** render real token values with SVG filters (`feMorphology`, `feGaussianBlur`, `feOffset`), which approximate `box-shadow` closely but not exactly; spread on rounded corners is squarer than in a browser.
- **The NCSU thesis on shading and perceived clickability** (Creager) turned up in search and was not read; it may add user evidence.

---

## Sources

**Primary: system source, tokens and documentation**

- [Material Web, `elevation/internal/_elevation.scss`](https://github.com/material-components/material-web/blob/main/elevation/internal/_elevation.scss). The key and ambient formulas and opacities.
- [Material Web tokens v0_192](https://github.com/material-components/material-web/tree/main/tokens/versions/v0_192): `_md-sys-elevation.scss` (levels in dp), `_md-sys-color.scss` (`shadow` as `neutral0`), `_md-comp-elevated-card.scss`, `_md-comp-fab-primary.scss`, `_md-comp-menu.scss`, `_md-comp-dialog.scss`, `_md-comp-filled-button.scss`, `_md-comp-navigation-bar.scss`.
- [Fluent 2, elevation](https://fluent2.microsoft.design/elevation). Ramps, key and ambient, Windows strokes, shadows on colour.
- [`@fluentui/tokens`, `shadows.js`](https://cdn.jsdelivr.net/npm/@fluentui/tokens/lib/utils/shadows.js), [`lightColor.js`](https://cdn.jsdelivr.net/npm/@fluentui/tokens/lib/alias/lightColor.js) and [`darkColor.js`](https://cdn.jsdelivr.net/npm/@fluentui/tokens/lib/alias/darkColor.js).
- [Primer primitives, light theme CSS](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/functional/themes/light.css) and [dark theme CSS](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/functional/themes/dark.css).
- [Shopify Polaris tokens CSS](https://cdn.jsdelivr.net/npm/@shopify/polaris-tokens/dist/css/styles.css), [`shadow.ts`](https://github.com/Shopify/polaris/blob/main/polaris-tokens/src/themes/base/shadow.ts) and [`Card.tsx`](https://github.com/Shopify/polaris/blob/main/polaris-react/src/components/Card/Card.tsx).
- [Atlassian, elevation](https://atlassian.design/foundations/elevation). Levels, pairing, hover, drag, overflow.
- [`@atlaskit/tokens` 20.11.0, `atlassian-light.js`](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.11.0/dist/cjs/artifacts/themes/atlassian-light.js), [`atlassian-dark.js`](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.11.0/dist/cjs/artifacts/themes/atlassian-dark.js) and [`atlassian-legacy-light.js`](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.11.0/dist/cjs/artifacts/themes/atlassian-legacy-light.js); [4.5.0 `atlassian-dark.js`](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@4.5.0/dist/cjs/artifacts/themes/atlassian-dark.js).
- [Carbon themes, `white.js`](https://cdn.jsdelivr.net/npm/@carbon/themes@11.85.0/js/generated/themes/white.js) and [`g100.js`](https://cdn.jsdelivr.net/npm/@carbon/themes@11.85.0/js/generated/themes/g100.js); [Carbon styles, `_box-shadow.scss`](https://cdn.jsdelivr.net/npm/@carbon/styles/scss/utilities/_box-shadow.scss) and [`_popover.scss`](https://cdn.jsdelivr.net/npm/@carbon/styles/scss/components/popover/_popover.scss).
- [Ant Design, `components/theme/util/alias.ts`](https://github.com/ant-design/ant-design/blob/master/components/theme/util/alias.ts).
- [Radix Themes `tokens.css`](https://cdn.jsdelivr.net/npm/@radix-ui/themes/tokens.css) and [`styles.css`](https://cdn.jsdelivr.net/npm/@radix-ui/themes/styles.css).
- [Apple HIG, materials](https://developer.apple.com/design/human-interface-guidelines/materials). No shadow values; depth through materials.

**Standards**

- [WCAG 2.2, Understanding 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- [CSS Color Adjustment 1, properties affected by forced colors](https://drafts.csswg.org/css-color-adjust-1/#forced-colors-properties).
- [CSS Values 4, snapping a length as a line width](https://drafts.csswg.org/css-values-4/#snap-a-length-as-a-border-width).
- [Design Tokens Format Module 2025.10, shadow](https://www.designtokens.org/TR/2025.10/format/#shadow).
- [Figma Plugin API, `strokeAlign`](https://developers.figma.com/docs/plugins/api/properties/nodes-strokealign/) and [`figma.variables`](https://developers.figma.com/docs/plugins/api/figma-variables) (effect binding).
- [Figma forum, `setBoundVariableForEffect` spread report](https://forum.figma.com/t/setboundvariableforeffect-bug/59788).

**Research**

- [Kate Moran, NN/g, *Flat UI Elements Attract Less Attention and Cause Uncertainty* (2017)](https://www.nngroup.com/articles/flat-ui-less-attention-cause-uncertainty/).

**Toolkit knowledge base and sister pieces**

- `~/Projects/toolkit/knowledge/ui/design/visual.md#elevation-borders-radius-and-shape`, `#surfaces-and-elevation-levels` and `#theming-and-dark-mode`; `~/Projects/toolkit/knowledge/code/figma-handoff.md#strokes-borders-outlines-and-shadows`.
- [How surfaces stack](how-surfaces-stack.md), [surfaces in dark mode](surfaces-in-dark-mode.md), [materials and translucency](materials-and-translucency.md).

**Cited but not resolved to a URL**

- Creager, NCSU master's thesis on shading gradients and perceived clickability: found in search, not opened; repository URL not verified.
