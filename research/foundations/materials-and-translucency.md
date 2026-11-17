# Materials and translucency

When a surface should let the content behind it show through, how the platforms that do it build and name their materials, and what it costs a design system to ship one.

A designer gives the app's header a frosted look in Figma: white at 70%, a background blur, a hairline edge. Over the demo screenshot, a pale landscape, it looks expensive. In the build, someone scrolls a dark photo under it and the grey "Last synced" line disappears. A tester on Windows with transparency effects turned off sees the same header as a flat panel with no edge at all, and a support engineer working over remote desktop reports that the page stutters when it scrolls.

---

## What this answers

- [Opaque by default](#opaque-by-default): when a surface should be translucent at all
- [Solid, alpha and blur](#solid-alpha-and-blur): what each of the three fills does to what's behind
- [Apple's material ladder](#apples-material-ladder): how Apple's standard materials and vibrancy work
- [Liquid Glass](#liquid-glass): where Apple puts its newest material, and where it says not to
- [Mica and Acrylic](#mica-and-acrylic): which Fluent material goes where in a Windows app
- [Web systems stay opaque](#web-systems-stay-opaque): what Material, Atlassian, Primer, Carbon, Radix and Ant Design actually ship
- [Alpha ramps](#alpha-ramps): how an alpha colour scale differs from a blurred material
- [Text over translucency](#text-over-translucency): how to keep text readable over a backdrop nobody can predict
- [Reduce Transparency fallbacks](#reduce-transparency-fallbacks): what the opaque fallback looks like, and how the web detects it
- [Tokens for a material](#tokens-for-a-material): how to name and store a material
- [From Figma to CSS](#from-figma-to-css): where a Figma background blur and `backdrop-filter` part ways
- [Materials in dark mode](#materials-in-dark-mode): what changes when the tint goes dark
- [The cost of backdrop-filter](#the-cost-of-backdrop-filter): what the blur costs the browser
- [When to skip it](#when-to-skip-it): when a small team should leave materials out

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in five paragraphs. Surface levels are in [how surfaces stack](how-surfaces-stack.md), shadows in [elevation and shadows](elevation-and-shadows.md), and dark surfaces in [surfaces in dark mode](surfaces-in-dark-mode.md).

---

## Opaque by default

A surface should be translucent only when it floats over content that moves underneath it and the reader gains something from glimpsing that content; everything else stays opaque, and that is what most design systems ship.

A header over a scrolling feed shows there is more content above; a settings card on a plain grey page shows only the grey. That is the trade a **material** makes, meaning here a surface fill that lets some of what is behind it through, usually blurred. It buys context and depth, and pays with a fill whose final colour is unknown at design time.

The two platform owners that lean hardest on materials draw the boundary in the same place. Apple puts Liquid Glass on "a distinct functional layer for controls and navigation" and tells designers to keep it out of the content layer. Microsoft recommends Acrylic for transient surfaces such as menus and flyouts and an opaque background for panes that section off content. Glass on what floats, solid on what is read.

<svg role="img" viewBox="0 0 720 384" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Two phone screens showing a list of five coloured album cards. Left, marked as the right use: a frosted navigation bar titled Library across the top and a floating frosted tab bar with Home, Search and Library at the bottom, both over the scrolling cards, so the cards' colour shows softly through the bars. Right, marked as the wrong use: a frosted Now playing card placed in the middle of the list itself, where its blurred colours compete with the opaque album cards around it. A note between them names the functional layer, navigation bar, tab bar, sidebars and popovers, and the content layer, lists, cards and media, which stays opaque or uses standard materials. Colours are illustrative.</title>
<rect x="0" y="0" width="720" height="384" fill="#f7f6f2"/>
<defs>
<g id="f9-a"><rect x="60" y="44" width="200" height="300" rx="22" fill="#ffffff" stroke="#cfcdc4"/><rect x="72" y="60" width="176" height="48" rx="8" fill="#1f5fbf"/><text x="84" y="90" font-size="13" font-weight="600" fill="#ffffff">Album 1</text><rect x="72" y="116" width="176" height="48" rx="8" fill="#e0a43a"/><text x="84" y="146" font-size="13" font-weight="600" fill="#ffffff">Album 2</text><rect x="72" y="172" width="176" height="48" rx="8" fill="#2f8f6a"/><text x="84" y="202" font-size="13" font-weight="600" fill="#ffffff">Album 3</text><rect x="72" y="228" width="176" height="48" rx="8" fill="#b5501f"/><text x="84" y="258" font-size="13" font-weight="600" fill="#ffffff">Album 4</text><rect x="72" y="284" width="176" height="48" rx="8" fill="#6b3fa0"/><text x="84" y="314" font-size="13" font-weight="600" fill="#ffffff">Album 5</text></g>
<g id="f9-b"><rect x="420" y="44" width="200" height="300" rx="22" fill="#ffffff" stroke="#cfcdc4"/><rect x="432" y="60" width="176" height="48" rx="8" fill="#1f5fbf"/><text x="444" y="90" font-size="13" font-weight="600" fill="#ffffff">Album 1</text><rect x="432" y="116" width="176" height="48" rx="8" fill="#e0a43a"/><text x="444" y="146" font-size="13" font-weight="600" fill="#ffffff">Album 2</text><rect x="432" y="172" width="176" height="48" rx="8" fill="#2f8f6a"/><text x="444" y="202" font-size="13" font-weight="600" fill="#ffffff">Album 3</text><rect x="432" y="228" width="176" height="48" rx="8" fill="#b5501f"/><text x="444" y="258" font-size="13" font-weight="600" fill="#ffffff">Album 4</text><rect x="432" y="284" width="176" height="48" rx="8" fill="#6b3fa0"/><text x="444" y="314" font-size="13" font-weight="600" fill="#ffffff">Album 5</text></g>
<filter id="f9-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>
<clipPath id="f9-a-top"><rect x="70" y="54" width="180" height="36" rx="18"/></clipPath>
<clipPath id="f9-a-tab"><rect x="76" y="290" width="168" height="40" rx="20"/></clipPath>
<clipPath id="f9-b-card"><rect x="432" y="172" width="176" height="72" rx="12"/></clipPath>
</defs>
<use href="#f9-a"/>
<use href="#f9-b"/>
<use href="#f9-a" filter="url(#f9-blur)" clip-path="url(#f9-a-top)"/>
<rect x="70" y="54" width="180" height="36" rx="18" fill="#ffffff" fill-opacity="0.7"/>
<rect x="70.5" y="54.5" width="179" height="35" rx="18" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="160" y="77" font-size="14" fill="#1c2024" font-weight="600" text-anchor="middle">Library</text>
<use href="#f9-a" filter="url(#f9-blur)" clip-path="url(#f9-a-tab)"/>
<rect x="76" y="290" width="168" height="40" rx="20" fill="#ffffff" fill-opacity="0.7"/>
<rect x="76.5" y="290.5" width="167" height="39" rx="20" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="112" y="315" font-size="11" fill="#1c2024" font-weight="600" text-anchor="middle">Home</text>
<text x="160" y="315" font-size="11" fill="#60646c" text-anchor="middle">Search</text>
<text x="208" y="315" font-size="11" fill="#60646c" text-anchor="middle">Library</text>
<use href="#f9-b" filter="url(#f9-blur)" clip-path="url(#f9-b-card)"/>
<rect x="432" y="172" width="176" height="72" rx="12" fill="#ffffff" fill-opacity="0.55"/>
<rect x="432.5" y="172.5" width="175" height="71" rx="12" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="448" y="200" font-size="13" fill="#1c2024" font-weight="600">Now playing</text>
<text x="448" y="222" font-size="12" fill="#60646c">Album 3 · track 4</text>
<text x="160" y="368" font-size="13" fill="#2f7d4f" font-weight="600" text-anchor="middle">Glass on bars that float over content</text>
<text x="520" y="368" font-size="13" fill="#b3261e" font-weight="600" text-anchor="middle">Glass on a card inside the content</text>
<text x="300" y="140" font-size="12" fill="#1a1a1a" font-weight="600">functional layer:</text>
<text x="300" y="156" font-size="12" fill="#5a5850">navigation bar, tab bar,</text>
<text x="300" y="172" font-size="12" fill="#5a5850">sidebars, popovers</text>
<text x="300" y="220" font-size="12" fill="#1a1a1a" font-weight="600">content layer:</text>
<text x="300" y="236" font-size="12" fill="#5a5850">lists, cards, media;</text>
<text x="300" y="252" font-size="12" fill="#5a5850">opaque or standard</text>
<text x="300" y="268" font-size="12" fill="#5a5850">materials</text>
<text x="24" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Where Apple puts Liquid Glass, and where it says not to</text>
</svg>

The bars on the left earn their glass, because the list scrolls under them. The card on the right is part of the list, so its blur only muddies the cards beside it.

**Translucency belongs to bars, sheets, popovers and menus that cover live content, never to cards and panels in the content itself.** *Weight: strong.* Apple and Microsoft reach it on separate platforms; the web systems in [Web systems stay opaque](#web-systems-stay-opaque) go further and mostly don't ship it at all.

---

## Solid, alpha and blur

A fill can hide the backdrop, show it at reduced strength, or show its colour without its detail, and only the third is what platforms call a material.

Here is the header's card three ways over the same busy backdrop of coloured shapes, stripes and letters.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same card drawn three ways over the same busy backdrop of coloured circles, bars, stripes and letters. Left, an opaque white card hides the backdrop completely and its text reads cleanly. Middle, a white card at 70 percent opacity lets the sharp edges of the shapes and letters behind show through, so the stripes run straight through its text. Right, the same 70 percent white over a blurred copy of the backdrop keeps the colour of what is behind but removes the edges, so the text sits on soft patches of colour. Colours are illustrative.</title>
<rect x="0" y="0" width="720" height="300" fill="#f7f6f2"/>
<defs>
<g id="f1-bg"><rect x="24" y="44" width="672" height="196" fill="#e9e4d8"/><circle cx="54" cy="113" r="30" fill="#1f5fbf"/><rect x="32" y="162" width="46" height="59" fill="#b5501f"/><rect x="80" y="44" width="6" height="196" fill="#1b1f2a" opacity="0.55"/><text x="28" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="126" cy="113" r="30" fill="#e0a43a"/><rect x="104" y="162" width="46" height="59" fill="#6b3fa0"/><rect x="152" y="44" width="6" height="196" fill="#1b1f2a" opacity="0.55"/><text x="100" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="198" cy="113" r="30" fill="#2f8f6a"/><rect x="176" y="162" width="46" height="59" fill="#1b1f2a"/><rect x="224" y="44" width="6" height="196" fill="#1b1f2a" opacity="0.55"/><text x="172" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="270" cy="113" r="30" fill="#b5501f"/><rect x="248" y="162" width="46" height="59" fill="#1f5fbf"/><rect x="296" y="44" width="6" height="196" fill="#1b1f2a" opacity="0.55"/><text x="244" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="342" cy="113" r="30" fill="#6b3fa0"/><rect x="320" y="162" width="46" height="59" fill="#e0a43a"/><rect x="368" y="44" width="6" height="196" fill="#1b1f2a" opacity="0.55"/><text x="316" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="414" cy="113" r="30" fill="#1b1f2a"/><rect x="392" y="162" width="46" height="59" fill="#2f8f6a"/><rect x="440" y="44" width="6" height="196" fill="#1b1f2a" opacity="0.55"/><text x="388" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="486" cy="113" r="30" fill="#1f5fbf"/><rect x="464" y="162" width="46" height="59" fill="#b5501f"/><rect x="512" y="44" width="6" height="196" fill="#1b1f2a" opacity="0.55"/><text x="460" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="558" cy="113" r="30" fill="#e0a43a"/><rect x="536" y="162" width="46" height="59" fill="#6b3fa0"/><rect x="584" y="44" width="6" height="196" fill="#1b1f2a" opacity="0.55"/><text x="532" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="630" cy="113" r="30" fill="#2f8f6a"/><rect x="608" y="162" width="46" height="59" fill="#1b1f2a"/><rect x="656" y="44" width="6" height="196" fill="#1b1f2a" opacity="0.55"/><text x="604" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text></g>
<filter id="f1-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="9"/></filter>
<clipPath id="f1-c3"><rect x="486" y="74" width="186" height="136" rx="10"/></clipPath>
</defs>
<use href="#f1-bg"/>
<rect x="48" y="74" width="186" height="136" rx="10" fill="#ffffff" fill-opacity="1.0"/>
<rect x="48.5" y="74.5" width="185" height="135" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="64" y="108" font-size="16" fill="#1c2024" font-weight="600">Recent files</text>
<text x="64" y="132" font-size="13" fill="#60646c">Edited 2 hours ago</text>
<text x="64" y="168" font-size="14" fill="#1c2024">Brand refresh.fig</text>
<text x="64" y="190" font-size="14" fill="#1c2024">Q3 roadmap.fig</text>
<rect x="267" y="74" width="186" height="136" rx="10" fill="#ffffff" fill-opacity="0.7"/>
<rect x="267.5" y="74.5" width="185" height="135" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="283" y="108" font-size="16" fill="#1c2024" font-weight="600">Recent files</text>
<text x="283" y="132" font-size="13" fill="#60646c">Edited 2 hours ago</text>
<text x="283" y="168" font-size="14" fill="#1c2024">Brand refresh.fig</text>
<text x="283" y="190" font-size="14" fill="#1c2024">Q3 roadmap.fig</text>
<use href="#f1-bg" filter="url(#f1-blur)" clip-path="url(#f1-c3)"/>
<rect x="486" y="74" width="186" height="136" rx="10" fill="#ffffff" fill-opacity="0.7"/>
<rect x="486.5" y="74.5" width="185" height="135" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="502" y="108" font-size="16" fill="#1c2024" font-weight="600">Recent files</text>
<text x="502" y="132" font-size="13" fill="#60646c">Edited 2 hours ago</text>
<text x="502" y="168" font-size="14" fill="#1c2024">Brand refresh.fig</text>
<text x="502" y="190" font-size="14" fill="#1c2024">Q3 roadmap.fig</text>
<text x="48" y="30" font-size="14" fill="#1a1a1a" font-weight="600">One panel, three fills, over the same backdrop</text>
<text x="141" y="266" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Opaque: #ffffff</text>
<text x="141" y="284" font-size="12" fill="#5a5850" text-anchor="middle">hides the backdrop</text>
<text x="360" y="266" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Alpha: white at 70%</text>
<text x="360" y="284" font-size="12" fill="#5a5850" text-anchor="middle">edges show through the text</text>
<text x="579" y="266" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Material: 70% + blur</text>
<text x="579" y="284" font-size="12" fill="#5a5850" text-anchor="middle">colour shows, edges don't</text>
</svg>

The 70% card in the middle looks right in a quick mock-up and fails first: the stripes and letters behind it run through its text at full sharpness. The card on the right has the same 70% white over a blurred backdrop.

**Alpha** mixes the fill with the backdrop pixel by pixel, so every edge behind survives, only fainter. **Blur** averages each pixel with its neighbours first, which removes the fine detail that competes with letterforms while keeping the average colour and brightness. Blur is what makes translucency compatible with text; alpha decides how much of the backdrop's brightness gets through. That is why Microsoft's Acrylic recipe stacks blur, tint, a luminosity blend and noise, and why Apple describes its materials as blur plus vibrancy plus blending.

**If a surface is translucent, it is blurred; if it can't be blurred, it is opaque.** *Weight: strong.* No system surveyed ships an unblurred translucent panel for text; an alpha colour is a tool for small tints ([Alpha ramps](#alpha-ramps)).

---

## Apple's material ladder

Apple ships its standard materials as a named ladder from thin to thick, and asks designers to choose by purpose and to put vibrant system colours on top rather than their own greys.

On iOS and iPadOS the standard materials are `ultraThin`, `thin`, `regular` (the default) and `thick`; SwiftUI's `Material` adds `ultraThick` and `bar`. The names describe how opaque each is.

<svg role="img" viewBox="0 0 720 264" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A ladder of five frosted panels named after the SwiftUI materials ultraThin, thin, regular, thick and ultraThick, laid over the same backdrop of vertical stripes in navy, ochre, blue, cream, orange and green. From left to right each panel is more opaque, about 35, 50, 65, 80 and 92 percent white over a blurred backdrop. On the thinnest the stripes still show clearly and the grey secondary line is hard to read; on the thickest the stripes are a faint tint and both lines of text are crisp. Apple publishes no opacity values, so these percentages are illustrative.</title>
<rect x="0" y="0" width="720" height="264" fill="#f7f6f2"/>
<defs>
<marker id="f2-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#5a5850"/></marker>
<g id="f2-bg"><rect x="0" y="44" width="24" height="150" fill="#1b1f2a"/><rect x="24" y="44" width="24" height="150" fill="#e0a43a"/><rect x="48" y="44" width="24" height="150" fill="#1f5fbf"/><rect x="72" y="44" width="24" height="150" fill="#f7f6f2"/><rect x="96" y="44" width="24" height="150" fill="#b5501f"/><rect x="120" y="44" width="24" height="150" fill="#2f8f6a"/><rect x="144" y="44" width="24" height="150" fill="#1b1f2a"/><rect x="168" y="44" width="24" height="150" fill="#e0a43a"/><rect x="192" y="44" width="24" height="150" fill="#1f5fbf"/><rect x="216" y="44" width="24" height="150" fill="#f7f6f2"/><rect x="240" y="44" width="24" height="150" fill="#b5501f"/><rect x="264" y="44" width="24" height="150" fill="#2f8f6a"/><rect x="288" y="44" width="24" height="150" fill="#1b1f2a"/><rect x="312" y="44" width="24" height="150" fill="#e0a43a"/><rect x="336" y="44" width="24" height="150" fill="#1f5fbf"/><rect x="360" y="44" width="24" height="150" fill="#f7f6f2"/><rect x="384" y="44" width="24" height="150" fill="#b5501f"/><rect x="408" y="44" width="24" height="150" fill="#2f8f6a"/><rect x="432" y="44" width="24" height="150" fill="#1b1f2a"/><rect x="456" y="44" width="24" height="150" fill="#e0a43a"/><rect x="480" y="44" width="24" height="150" fill="#1f5fbf"/><rect x="504" y="44" width="24" height="150" fill="#f7f6f2"/><rect x="528" y="44" width="24" height="150" fill="#b5501f"/><rect x="552" y="44" width="24" height="150" fill="#2f8f6a"/><rect x="576" y="44" width="24" height="150" fill="#1b1f2a"/><rect x="600" y="44" width="24" height="150" fill="#e0a43a"/><rect x="624" y="44" width="24" height="150" fill="#1f5fbf"/><rect x="648" y="44" width="24" height="150" fill="#f7f6f2"/><rect x="672" y="44" width="24" height="150" fill="#b5501f"/><rect x="696" y="44" width="24" height="150" fill="#2f8f6a"/></g>
<clipPath id="f2-c0"><rect x="24" y="64" width="122" height="110" rx="10"/></clipPath>
<clipPath id="f2-c1"><rect x="162" y="64" width="122" height="110" rx="10"/></clipPath>
<clipPath id="f2-c2"><rect x="300" y="64" width="122" height="110" rx="10"/></clipPath>
<clipPath id="f2-c3"><rect x="438" y="64" width="122" height="110" rx="10"/></clipPath>
<clipPath id="f2-c4"><rect x="576" y="64" width="122" height="110" rx="10"/></clipPath>
<filter id="f2-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="10"/></filter>
</defs>
<use href="#f2-bg"/>
<use href="#f2-bg" filter="url(#f2-blur)" clip-path="url(#f2-c0)"/>
<rect x="24" y="64" width="122" height="110" rx="10" fill="#ffffff" fill-opacity="0.35"/>
<rect x="24.5" y="64.5" width="121" height="109" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="85" y="112" font-size="16" fill="#1c2024" font-weight="600" text-anchor="middle">Library</text>
<text x="85" y="134" font-size="13" fill="#60646c" text-anchor="middle">12 items</text>
<text x="85" y="218" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle" font-family="ui-monospace, monospace">ultraThin</text>
<text x="85" y="236" font-size="12" fill="#5a5850" text-anchor="middle">about 35% white</text>
<use href="#f2-bg" filter="url(#f2-blur)" clip-path="url(#f2-c1)"/>
<rect x="162" y="64" width="122" height="110" rx="10" fill="#ffffff" fill-opacity="0.5"/>
<rect x="162.5" y="64.5" width="121" height="109" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="223" y="112" font-size="16" fill="#1c2024" font-weight="600" text-anchor="middle">Library</text>
<text x="223" y="134" font-size="13" fill="#60646c" text-anchor="middle">12 items</text>
<text x="223" y="218" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle" font-family="ui-monospace, monospace">thin</text>
<text x="223" y="236" font-size="12" fill="#5a5850" text-anchor="middle">about 50% white</text>
<use href="#f2-bg" filter="url(#f2-blur)" clip-path="url(#f2-c2)"/>
<rect x="300" y="64" width="122" height="110" rx="10" fill="#ffffff" fill-opacity="0.65"/>
<rect x="300.5" y="64.5" width="121" height="109" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="361" y="112" font-size="16" fill="#1c2024" font-weight="600" text-anchor="middle">Library</text>
<text x="361" y="134" font-size="13" fill="#60646c" text-anchor="middle">12 items</text>
<text x="361" y="218" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle" font-family="ui-monospace, monospace">regular</text>
<text x="361" y="236" font-size="12" fill="#5a5850" text-anchor="middle">about 65% white</text>
<use href="#f2-bg" filter="url(#f2-blur)" clip-path="url(#f2-c3)"/>
<rect x="438" y="64" width="122" height="110" rx="10" fill="#ffffff" fill-opacity="0.8"/>
<rect x="438.5" y="64.5" width="121" height="109" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="499" y="112" font-size="16" fill="#1c2024" font-weight="600" text-anchor="middle">Library</text>
<text x="499" y="134" font-size="13" fill="#60646c" text-anchor="middle">12 items</text>
<text x="499" y="218" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle" font-family="ui-monospace, monospace">thick</text>
<text x="499" y="236" font-size="12" fill="#5a5850" text-anchor="middle">about 80% white</text>
<use href="#f2-bg" filter="url(#f2-blur)" clip-path="url(#f2-c4)"/>
<rect x="576" y="64" width="122" height="110" rx="10" fill="#ffffff" fill-opacity="0.92"/>
<rect x="576.5" y="64.5" width="121" height="109" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="637" y="112" font-size="16" fill="#1c2024" font-weight="600" text-anchor="middle">Library</text>
<text x="637" y="134" font-size="13" fill="#60646c" text-anchor="middle">12 items</text>
<text x="637" y="218" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle" font-family="ui-monospace, monospace">ultraThick</text>
<text x="637" y="236" font-size="12" fill="#5a5850" text-anchor="middle">about 92% white</text>
<text x="24" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Thinner keeps context; thicker keeps the text</text>
<path d="M24 252 H696" stroke="#5a5850" stroke-width="1.5" marker-end="url(#f2-arrow)"/>
</svg>

Thicker materials give better contrast for text; thinner ones keep more context, and the grey line under "Library" is hard to read through `ultraThin`. Apple publishes no opacity numbers and says not to pick a material for the colour it seems to give, since system settings change how each looks: the material is a role the system renders, not a recipe.

The second half is **vibrancy**: label, fill and separator colours designed for materials, which pull colour forward from the backdrop instead of painting a fixed grey over it. Labels come in levels from primary to quaternary, and Apple warns against quaternary labels on the thinnest materials.

On Apple platforms, map each surface to a material by role (`regular` for most floating panels, `thick` where the panel carries paragraphs or small text) and leave the rendering to the system. **Use vibrant label colours on materials, never fixed greys from the solid palette.** *Weight: required* on Apple platforms, where it is the documented rule. The web has no vibrancy, which is why [Text over translucency](#text-over-translucency) needs its own section.

---

## Liquid Glass

Liquid Glass is Apple's material for the controls and navigation that float above content, in a regular variant for most uses and a clear one only over rich media, and its first months showed what happens when glass gets too thin.

Apple's HIG puts it on tab bars, sidebars, toolbars and floating controls, and asks for it sparingly in custom ones. The **regular** variant blurs and adjusts the brightness behind it to keep text legible, and most system components use it. The **clear** variant is far more transparent and meant only for components over photos and video; over bright media, Apple suggests a dark dimming layer at 35% opacity behind the component.

In October 2025 Nielsen Norman Group argued, from screenshots rather than a study, that iOS 26's glass hurt legibility: Mail's search bar over previews, controls lost in Maps photos. Within weeks iOS 26.1 added a choice between Clear and a more opaque Tinted look. The lesson is not that glass fails: the thin end of the ladder fails first, and a system has to work at whatever thickness the user picks.

**Choose the regular variant whenever text sits on the glass; clear is for controls over media, with a 35% dimming layer when the media is bright.** *Weight: strong*, Apple's own guidance. Keeping custom glass to one or two floating controls is judgement (*moderate*), backed by the iOS 26.1 change.

---

## Mica and Acrylic

Fluent gives Windows apps two materials with opposite jobs: Mica, an opaque base for the whole window, and Acrylic, a blurred translucent fill for menus and flyouts that appear for a moment.

Here is a file manager window built the way Microsoft's guidance lays it out.

<svg role="img" viewBox="0 0 720 340" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A Windows 11 style file manager window over a purple, pink, teal and gold desktop wallpaper. The window's base, its title bar and its left navigation pane, is Mica: an opaque, very light lavender grey tinted from the wallpaper, with no shapes visible through it. The document list sits on a lighter content layer above the Mica. A right-click context menu with Open, Rename and Delete hangs over the window's right edge; it is Acrylic, so through it the window and the wallpaper beyond the window show as soft blurred colour. Labels name Mica as the window base, the content layer as LayerFillColorDefault, and Acrylic as the transient menu that blurs past the window edge. Colours are illustrative.</title>
<rect x="0" y="0" width="720" height="340" fill="#f7f6f2"/>
<defs>
<g id="f4-scene"><rect x="0" y="0" width="720" height="340" fill="#3a3f8f"/><circle cx="640" cy="80" r="90" fill="#c0478f"/><circle cx="120" cy="300" r="110" fill="#2c8fa8"/><circle cx="560" cy="300" r="70" fill="#e0a43a"/><circle cx="680" cy="250" r="40" fill="#f2d16b"/><rect x="40" y="36" width="500" height="270" rx="8" fill="#eceef7"/><rect x="196" y="80" width="344" height="226" fill="#fbfbfe"/><path d="M196 88 Q196 80 204 80 H540 V306 H196 Z" fill="#fbfbfe"/><rect x="56" y="96" width="124" height="28" rx="4" fill="#ffffff" fill-opacity="0.7"/><text x="66" y="115" font-size="13" fill="#1a1a1a">Home</text><text x="66" y="151" font-size="13" fill="#1a1a1a">Documents</text><text x="66" y="183" font-size="13" fill="#1a1a1a">Settings</text><text x="56" y="62" font-size="13" fill="#1a1a1a" font-weight="600">Files</text><text x="220" y="116" font-size="18" fill="#1a1a1a" font-weight="600">Documents</text><rect x="220" y="134" width="296" height="40" rx="6" fill="#ffffff" stroke="#e1e3ea"/><rect x="220" y="182" width="296" height="40" rx="6" fill="#ffffff" stroke="#e1e3ea"/><rect x="220" y="230" width="296" height="40" rx="6" fill="#ffffff" stroke="#e1e3ea"/><text x="236" y="159" font-size="13" fill="#1a1a1a">Budget 2027.xlsx</text><text x="236" y="207" font-size="13" fill="#1a1a1a">Offsite plan.docx</text><text x="236" y="255" font-size="13" fill="#1a1a1a">Photos</text></g>
<filter id="f4-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="12"/><feColorMatrix type="saturate" values="1.4"/></filter>
<clipPath id="f4-cm"><rect x="470" y="170" width="170" height="112" rx="8"/></clipPath>
</defs>
<use href="#f4-scene"/>
<use href="#f4-scene" filter="url(#f4-blur)" clip-path="url(#f4-cm)"/>
<rect x="470" y="170" width="170" height="112" rx="8" fill="#f6f6f8" fill-opacity="0.62"/>
<rect x="470.5" y="170.5" width="169" height="111" rx="8" fill="none" stroke="#ffffff" stroke-opacity="0.6"/>
<text x="486" y="198" font-size="13" fill="#1a1a1a">Open</text>
<text x="486" y="226" font-size="13" fill="#1a1a1a">Rename</text>
<text x="486" y="254" font-size="13" fill="#1a1a1a">Delete</text>
<rect x="560" y="8" width="152" height="54" rx="6" fill="#ffffff" fill-opacity="0.92"/>
<text x="570" y="28" font-size="12" fill="#1a1a1a" font-weight="600">Mica: window base</text>
<text x="570" y="44" font-size="11" fill="#5a5850">opaque, tinted once</text>
<text x="570" y="56" font-size="11" fill="#5a5850">from the wallpaper</text>
<path d="M560 36 H120 V48" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>
<rect x="200" y="312" width="210" height="24" rx="6" fill="#ffffff" fill-opacity="0.92"/>
<text x="208" y="329" font-size="11" fill="#1a1a1a" font-weight="600">Content layer: LayerFillColorDefault</text>
<path d="M300 312 V284" fill="none" stroke="#1a1a1a" stroke-width="1.2"/>
<rect x="548" y="292" width="164" height="40" rx="6" fill="#ffffff" fill-opacity="0.92"/>
<text x="556" y="309" font-size="12" fill="#1a1a1a" font-weight="600">Acrylic: context menu</text>
<text x="556" y="325" font-size="11" fill="#5a5850">blurs past the window edge</text>
</svg>

**Mica** is the window's opaque backdrop: it samples the wallpaper once to tint the base slightly, so nothing is blurred live. **Mica Alt** tints more strongly, for apps with tabs in the title bar.

**Acrylic** is the real translucency, and Microsoft restricts it to transient surfaces (context menus, flyouts, drop-downs) and, in-app, to supporting panes that open over content. The don'ts are blunt: no desktop acrylic on large backgrounds, no two acrylic panes side by side (the blurred edges meet in a seam), and no accent-coloured text on acrylic, because it is likely to miss contrast.

Both turn solid with *Transparency effects* off, in Battery Saver and on low-end hardware (Mica to `SolidBackgroundFillColorBase`). Fluent's web tokens carry Smoke, the black behind a modal, as `colorBackgroundOverlay`, but no Acrylic or Mica: on the web, Fluent stays opaque.

**Use Acrylic only on surfaces that appear briefly over other content, never on a pane that stays open beside the content.** *Weight: strong*, Microsoft's documented rule, matching Apple's line between functional and content layers.

---

## Web systems stay opaque

The large web design systems ship opaque surfaces, alpha colours and a translucent scrim, and almost no blur; Radix Themes is the one that makes translucency a default, and even it limits the blur to two components.

Here is what each package ships, searched for `backdrop-filter`.

| System, package | Surfaces | Scrim behind a modal | Blur shipped |
|---|---|---|---|
| Material 3, `@material/web` 2.5.0 | opaque tonal roles, dialog on `surface-container-high` | black at 0.32 | none |
| Atlassian, `@atlaskit/tokens` 20.11.0 | opaque `surface`, `surface-raised`, `surface-overlay` | `blanket` `#050C1F75` (46%) | none |
| Primer, `@primer/primitives` 11.10.0 | opaque `bgColor-default` | `overlay-backdrop-bgColor` `#c8d1da66` (40%) in light | none |
| Carbon, `@carbon/styles` 1.119.0 | opaque layers | not checked | one: the AI label's action bar, `blur(85px)` |
| GOV.UK Frontend 6.6.0 | opaque | not checked | none |
| Ant Design 6.7.0 | opaque | `colorBgMask` black at 0.45 | opt-in `blur(4px)` on the mask |
| Radix Themes 3.3.0 | Card and Table translucent by default | `--color-overlay` `black-a6` light, `black-a8` dark | `blur(64px)` on Card and Table |

The surfaces column is close to unanimous. Material 3 even moved away from its one translucent mechanism, a tint laid over surfaces by elevation, to opaque container roles ([surfaces in dark mode](surfaces-in-dark-mode.md#tint-overlays-to-containers) tells that change). Carbon's single blur is a small decorative bar in its AI label, distinct on purpose.

Ant Design 6 lets a Modal or Drawer take `mask={{ blur: true }}`, which adds a 4px `backdrop-filter` to the dark scrim rather than the dialog: the blur goes where it only has to reduce distraction, and the dialog, where the text is, stays opaque. It is off by default.

Radix Themes is the counter-example: `<Theme panelBackground="translucent">` is the default, and its docs list popovers and menus as panels. In the 3.3.0 stylesheet, though, the translucent fill (`--color-panel-translucent`, white at 70% in light) and `--backdrop-filter-panel: blur(64px)` reach only `Card` and `Table`. Menus, popovers, selects, hover cards and dialogs take `--color-panel-solid`: the floating surfaces Apple and Microsoft would make glass are the ones Radix keeps solid.

**If you want one translucent effect on the web, blur the scrim behind a modal, as Ant Design does, rather than the panel in front.** *Weight: strong* for opaque panels, in what ships. Some of it is history: `backdrop-filter` only became unprefixed in Safari 18, so a system designed earlier had reason to avoid it.

---

## Alpha ramps

An alpha colour ramp gives translucent fills that match the solid ramp on the page background and take on the colour of anything else they sit over; it is a tool for tints, hovers and borders, not for surfaces that need a material.

Radix publishes every colour scale twice: the solid steps and an alpha twin designed to look the same over the page background. Its slate grey runs from `slate1` `#fcfcfd` to `slate12` `#1c2024`, and `slateA` from `#00005503` (about 1% of a near-black) to `#000509e3` (about 89%).

<svg role="img" viewBox="0 0 720 290" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Radix's slate grey ramp, steps 1 to 12, drawn twice: once as solid colours and once as its alpha twin, slateA, each step a near-black at a set opacity, from about 1 percent at step 1 to 89 percent at step 12. On the left, over white, the two rows look the same, because the alpha ramp is tuned to match the solid one on the page background. On the right, over a light blue panel, the solid steps stay neutral grey and read as grey patches stuck on the blue, while the alpha steps let the blue through and read as darker blues. Values are Radix Colors' published slate and slateA.</title>
<rect x="0" y="0" width="720" height="290" fill="#f7f6f2"/>
<rect x="160" y="40" width="268" height="230" fill="#ffffff"/>
<rect x="440" y="40" width="268" height="230" fill="#dbe7ff"/>
<text x="294" y="62" font-size="12" fill="#5a5850" font-weight="600" text-anchor="middle">over white</text>
<text x="574" y="62" font-size="12" fill="#5a5850" font-weight="600" text-anchor="middle">over a blue panel #dbe7ff</text>
<text x="16" y="110" font-size="12" fill="#1a1a1a" font-weight="600">slate 1 to 12, solid</text>
<rect x="168" y="84" width="19" height="44" fill="#fcfcfd"/>
<rect x="189" y="84" width="19" height="44" fill="#f9f9fb"/>
<rect x="210" y="84" width="19" height="44" fill="#f0f0f3"/>
<rect x="231" y="84" width="19" height="44" fill="#e8e8ec"/>
<rect x="252" y="84" width="19" height="44" fill="#e0e1e6"/>
<rect x="273" y="84" width="19" height="44" fill="#d9d9e0"/>
<rect x="294" y="84" width="19" height="44" fill="#cdced6"/>
<rect x="315" y="84" width="19" height="44" fill="#b9bbc6"/>
<rect x="336" y="84" width="19" height="44" fill="#8b8d98"/>
<rect x="357" y="84" width="19" height="44" fill="#80838d"/>
<rect x="378" y="84" width="19" height="44" fill="#60646c"/>
<rect x="399" y="84" width="19" height="44" fill="#1c2024"/>
<text x="177.5" y="144" font-size="10" fill="#5a5850" text-anchor="middle">1</text>
<text x="219.5" y="144" font-size="10" fill="#5a5850" text-anchor="middle">3</text>
<text x="282.5" y="144" font-size="10" fill="#5a5850" text-anchor="middle">6</text>
<text x="345.5" y="144" font-size="10" fill="#5a5850" text-anchor="middle">9</text>
<text x="408.5" y="144" font-size="10" fill="#5a5850" text-anchor="middle">12</text>
<rect x="448" y="84" width="19" height="44" fill="#fcfcfd"/>
<rect x="469" y="84" width="19" height="44" fill="#f9f9fb"/>
<rect x="490" y="84" width="19" height="44" fill="#f0f0f3"/>
<rect x="511" y="84" width="19" height="44" fill="#e8e8ec"/>
<rect x="532" y="84" width="19" height="44" fill="#e0e1e6"/>
<rect x="553" y="84" width="19" height="44" fill="#d9d9e0"/>
<rect x="574" y="84" width="19" height="44" fill="#cdced6"/>
<rect x="595" y="84" width="19" height="44" fill="#b9bbc6"/>
<rect x="616" y="84" width="19" height="44" fill="#8b8d98"/>
<rect x="637" y="84" width="19" height="44" fill="#80838d"/>
<rect x="658" y="84" width="19" height="44" fill="#60646c"/>
<rect x="679" y="84" width="19" height="44" fill="#1c2024"/>
<text x="457.5" y="144" font-size="10" fill="#5a5850" text-anchor="middle">1</text>
<text x="499.5" y="144" font-size="10" fill="#5a5850" text-anchor="middle">3</text>
<text x="562.5" y="144" font-size="10" fill="#5a5850" text-anchor="middle">6</text>
<text x="625.5" y="144" font-size="10" fill="#5a5850" text-anchor="middle">9</text>
<text x="688.5" y="144" font-size="10" fill="#5a5850" text-anchor="middle">12</text>
<text x="16" y="196" font-size="12" fill="#1a1a1a" font-weight="600">slateA 1 to 12, alpha</text>
<rect x="168" y="170" width="19" height="44" fill="#000055" fill-opacity="0.012"/>
<rect x="189" y="170" width="19" height="44" fill="#000055" fill-opacity="0.024"/>
<rect x="210" y="170" width="19" height="44" fill="#000033" fill-opacity="0.059"/>
<rect x="231" y="170" width="19" height="44" fill="#00002d" fill-opacity="0.090"/>
<rect x="252" y="170" width="19" height="44" fill="#000932" fill-opacity="0.122"/>
<rect x="273" y="170" width="19" height="44" fill="#00002f" fill-opacity="0.149"/>
<rect x="294" y="170" width="19" height="44" fill="#00062e" fill-opacity="0.196"/>
<rect x="315" y="170" width="19" height="44" fill="#000830" fill-opacity="0.275"/>
<rect x="336" y="170" width="19" height="44" fill="#00051d" fill-opacity="0.455"/>
<rect x="357" y="170" width="19" height="44" fill="#00071b" fill-opacity="0.498"/>
<rect x="378" y="170" width="19" height="44" fill="#000714" fill-opacity="0.624"/>
<rect x="399" y="170" width="19" height="44" fill="#000509" fill-opacity="0.890"/>
<text x="177.5" y="230" font-size="10" fill="#5a5850" text-anchor="middle">1</text>
<text x="219.5" y="230" font-size="10" fill="#5a5850" text-anchor="middle">3</text>
<text x="282.5" y="230" font-size="10" fill="#5a5850" text-anchor="middle">6</text>
<text x="345.5" y="230" font-size="10" fill="#5a5850" text-anchor="middle">9</text>
<text x="408.5" y="230" font-size="10" fill="#5a5850" text-anchor="middle">12</text>
<rect x="448" y="170" width="19" height="44" fill="#000055" fill-opacity="0.012"/>
<rect x="469" y="170" width="19" height="44" fill="#000055" fill-opacity="0.024"/>
<rect x="490" y="170" width="19" height="44" fill="#000033" fill-opacity="0.059"/>
<rect x="511" y="170" width="19" height="44" fill="#00002d" fill-opacity="0.090"/>
<rect x="532" y="170" width="19" height="44" fill="#000932" fill-opacity="0.122"/>
<rect x="553" y="170" width="19" height="44" fill="#00002f" fill-opacity="0.149"/>
<rect x="574" y="170" width="19" height="44" fill="#00062e" fill-opacity="0.196"/>
<rect x="595" y="170" width="19" height="44" fill="#000830" fill-opacity="0.275"/>
<rect x="616" y="170" width="19" height="44" fill="#00051d" fill-opacity="0.455"/>
<rect x="637" y="170" width="19" height="44" fill="#00071b" fill-opacity="0.498"/>
<rect x="658" y="170" width="19" height="44" fill="#000714" fill-opacity="0.624"/>
<rect x="679" y="170" width="19" height="44" fill="#000509" fill-opacity="0.890"/>
<text x="457.5" y="230" font-size="10" fill="#5a5850" text-anchor="middle">1</text>
<text x="499.5" y="230" font-size="10" fill="#5a5850" text-anchor="middle">3</text>
<text x="562.5" y="230" font-size="10" fill="#5a5850" text-anchor="middle">6</text>
<text x="625.5" y="230" font-size="10" fill="#5a5850" text-anchor="middle">9</text>
<text x="688.5" y="230" font-size="10" fill="#5a5850" text-anchor="middle">12</text>
<text x="16" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Two ramps that match on white and part ways on colour</text>
<text x="574" y="262" font-size="11" fill="#1a1a1a" text-anchor="middle">solid steps stay grey; alpha steps take the blue</text>
</svg>

Over white the two rows match. Over a blue panel the solid steps are grey patches, and the alpha steps read as darker blues: a hover, divider or tag in an alpha step works on any surface without a second token.

Atlassian's `color.background.neutral` is `#0515240F` in light and `#CECED912` in dark, and its newer `surface.container` is `#17171708`; Primer's `bgColor-neutral-muted` is `#818b981f`. That is what keeps a component's light-grey parts visible on a tinted card ([how surfaces stack](how-surfaces-stack.md#components-on-a-tint) measures it). An alpha step goes on small things over a known surface; a material goes on a large surface over unknown content, and needs blur. Radix's docs add that alpha colours need wide-gamut definitions to stay saturated on P3 displays.

**Use alpha steps for small fills over known surfaces, and a material, or nothing, for large surfaces over unknown content.** *Weight: strong.* The alpha ramp is shared by Radix, Atlassian, Primer and Fluent; it is cheap, has no performance cost and no accessibility setting to honour.

---

## Text over translucency

Text on a material has to pass contrast against the worst backdrop that can scroll under it, not the one in the mock-up, and secondary text is what fails first.

Take Radix's light translucent panel as shipped, white at 70% over a 64px blur, with the card's grey secondary line, `slate11` `#60646c`, and scroll the darkest part of a night photo underneath. Before reading on, work out which of the two lines of text fails.

<svg role="img" viewBox="0 0 720 310" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Four frosted cards over a near-black night photo with a few small coloured lights. Each card has a bold title, Recent files, and a grey secondary line, Edited 2 hours ago. First, as shipped: white at 70 percent, the grey line measures 2.8 to 1 against the composited fill and fails. Second, the material made thicker, white at 88 percent: the grey line reaches 4.5 to 1 and passes. Third, the fill left at 70 percent but the secondary line set in the primary text colour: 7.8 to 1, passes. Fourth, the opaque fallback, plain white: the grey line measures 5.9 to 1 and passes. Ratios are WCAG 2 contrast against the fill composited over black; text colours are Radix slate 11 and slate 12.</title>
<rect x="0" y="0" width="720" height="310" fill="#f7f6f2"/>
<defs>
<g id="f3-bg"><rect x="0" y="44" width="720" height="190" fill="#05070b"/><circle cx="40" cy="60" r="10" fill="#e0a43a"/><circle cx="250" cy="226" r="8" fill="#1f5fbf"/><circle cx="420" cy="58" r="9" fill="#e0a43a"/><circle cx="700" cy="220" r="10" fill="#b5501f"/><circle cx="600" cy="52" r="6" fill="#f7f6f2"/></g>
<filter id="f3-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="9"/></filter>
<clipPath id="f3-c0"><rect x="16" y="76" width="160" height="120" rx="10"/></clipPath>
<clipPath id="f3-c1"><rect x="192" y="76" width="160" height="120" rx="10"/></clipPath>
<clipPath id="f3-c2"><rect x="368" y="76" width="160" height="120" rx="10"/></clipPath>
<clipPath id="f3-c3"><rect x="544" y="76" width="160" height="120" rx="10"/></clipPath>
</defs>
<use href="#f3-bg"/>
<use href="#f3-bg" filter="url(#f3-blur)" clip-path="url(#f3-c0)"/>
<rect x="16" y="76" width="160" height="120" rx="10" fill="#ffffff" fill-opacity="0.7"/>
<rect x="16.5" y="76.5" width="159" height="119" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="30" y="106" font-size="15" fill="#1c2024" font-weight="600">Recent files</text>
<text x="30" y="130" font-size="13" fill="#60646c">Edited 2 hours ago</text>
<text x="30" y="160" font-size="11" fill="#1c2024" font-family="ui-monospace, monospace">primary 7.8:1</text>
<text x="96" y="260" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">As shipped</text>
<text x="96" y="278" font-size="11" fill="#5a5850" text-anchor="middle">fill white 70%</text>
<text x="96" y="295" font-size="12" fill="#b3261e" font-weight="600" text-anchor="middle">secondary 2.8:1 fails</text>
<use href="#f3-bg" filter="url(#f3-blur)" clip-path="url(#f3-c1)"/>
<rect x="192" y="76" width="160" height="120" rx="10" fill="#ffffff" fill-opacity="0.88"/>
<rect x="192.5" y="76.5" width="159" height="119" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="206" y="106" font-size="15" fill="#1c2024" font-weight="600">Recent files</text>
<text x="206" y="130" font-size="13" fill="#60646c">Edited 2 hours ago</text>
<text x="206" y="160" font-size="11" fill="#60646c" font-family="ui-monospace, monospace">primary 12.5:1</text>
<text x="272" y="260" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Thicker</text>
<text x="272" y="278" font-size="11" fill="#5a5850" text-anchor="middle">fill white 88%</text>
<text x="272" y="295" font-size="12" fill="#2f7d4f" font-weight="600" text-anchor="middle">secondary 4.5:1 passes</text>
<use href="#f3-bg" filter="url(#f3-blur)" clip-path="url(#f3-c2)"/>
<rect x="368" y="76" width="160" height="120" rx="10" fill="#ffffff" fill-opacity="0.7"/>
<rect x="368.5" y="76.5" width="159" height="119" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="382" y="106" font-size="15" fill="#1c2024" font-weight="600">Recent files</text>
<text x="382" y="130" font-size="13" fill="#1c2024">Edited 2 hours ago</text>
<text x="382" y="160" font-size="11" fill="#1c2024" font-family="ui-monospace, monospace">primary 7.8:1</text>
<text x="448" y="260" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Darker text</text>
<text x="448" y="278" font-size="11" fill="#5a5850" text-anchor="middle">fill white 70%</text>
<text x="448" y="295" font-size="12" fill="#2f7d4f" font-weight="600" text-anchor="middle">secondary 7.8:1 passes</text>
<use href="#f3-bg" filter="url(#f3-blur)" clip-path="url(#f3-c3)"/>
<rect x="544" y="76" width="160" height="120" rx="10" fill="#ffffff" fill-opacity="1.0"/>
<rect x="544.5" y="76.5" width="159" height="119" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<text x="558" y="106" font-size="15" fill="#1c2024" font-weight="600">Recent files</text>
<text x="558" y="130" font-size="13" fill="#60646c">Edited 2 hours ago</text>
<text x="558" y="160" font-size="11" fill="#60646c" font-family="ui-monospace, monospace">primary 16.4:1</text>
<text x="624" y="260" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Opaque</text>
<text x="624" y="278" font-size="11" fill="#5a5850" text-anchor="middle">fill #ffffff</text>
<text x="624" y="295" font-size="12" fill="#2f7d4f" font-weight="600" text-anchor="middle">secondary 5.9:1 passes</text>
<text x="16" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Secondary text on a 70% panel, over the darkest part of a photo</text>
</svg>

Blur doesn't help: a large dark area blurred is still dark, so the card's fill composites to `#b2b2b2`. On that, primary `slate12` text measures 7.8:1 and passes; the secondary `slate11` line measures 2.8:1 and fails WCAG's 4.5:1. On the opaque card the same grey measures 5.9:1.

There are three fixes. Thicken the material: at 88% white the secondary line reaches 4.5:1. Use the primary text colour on the material: 7.8:1 at 70%. Or drop the material for that card: 5.9:1. Accent colours fare worse: a link in `#1f5fbf` on the same card over black measures 2.9:1, the arithmetic behind Microsoft's rule against accent text on Acrylic.

The worst case is the darkest content behind a light material and the brightest behind a dark one; a checker given the mock-up's backdrop reports a pass the product never sees. On the web, with no vibrancy, this check falls to the design system.

**For a light material at 70%, only the primary text colour survives the worst case; secondary text needs about 88% white, or the material has to go.** *Weight: required* for the arithmetic, which is WCAG 2's; *moderate* for thickening over recolouring, which keeps the text hierarchy intact.

---

## Reduce Transparency fallbacks

Every material needs an opaque twin, close to its average colour and with a real border, that replaces it when the user turns transparency off, and on the web that preference reaches only some browsers.

macOS and iOS have *Reduce Transparency* (SwiftUI's `accessibilityReduceTransparency`); Windows has *Transparency effects*, and drops transparency itself for Battery Saver and low-end hardware.

<svg role="img" viewBox="0 0 720 284" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Two copies of a mail toolbar with the title Inbox, a grey 128 unread count and a blue Compose button, over the same busy backdrop. Left, with transparency allowed: a frosted bar of white at 70 percent over a blurred backdrop, edged by a faint white hairline. Right, with Reduce Transparency or Windows transparency effects turned off: the same bar filled with an opaque light grey, number f2f3f5, close to the frosted bar's average colour, and edged with a real grey border, d9d9e0, because the hairline no longer has anything to separate. The layout, text and button are identical in both. Colours are illustrative.</title>
<rect x="0" y="0" width="720" height="284" fill="#f7f6f2"/>
<defs>
<g id="f5-bg"><rect x="0" y="44" width="720" height="180" fill="#e9e4d8"/><circle cx="30" cy="107" r="30" fill="#1f5fbf"/><rect x="8" y="152" width="46" height="54" fill="#b5501f"/><rect x="56" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="4" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="102" cy="107" r="30" fill="#e0a43a"/><rect x="80" y="152" width="46" height="54" fill="#6b3fa0"/><rect x="128" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="76" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="174" cy="107" r="30" fill="#2f8f6a"/><rect x="152" y="152" width="46" height="54" fill="#1b1f2a"/><rect x="200" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="148" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="246" cy="107" r="30" fill="#b5501f"/><rect x="224" y="152" width="46" height="54" fill="#1f5fbf"/><rect x="272" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="220" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="318" cy="107" r="30" fill="#6b3fa0"/><rect x="296" y="152" width="46" height="54" fill="#e0a43a"/><rect x="344" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="292" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="390" cy="107" r="30" fill="#1b1f2a"/><rect x="368" y="152" width="46" height="54" fill="#2f8f6a"/><rect x="416" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="364" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="462" cy="107" r="30" fill="#1f5fbf"/><rect x="440" y="152" width="46" height="54" fill="#b5501f"/><rect x="488" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="436" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="534" cy="107" r="30" fill="#e0a43a"/><rect x="512" y="152" width="46" height="54" fill="#6b3fa0"/><rect x="560" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="508" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="606" cy="107" r="30" fill="#2f8f6a"/><rect x="584" y="152" width="46" height="54" fill="#1b1f2a"/><rect x="632" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="580" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="678" cy="107" r="30" fill="#b5501f"/><rect x="656" y="152" width="46" height="54" fill="#1f5fbf"/><rect x="704" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="652" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text></g>
<filter id="f5-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="10"/></filter>
<clipPath id="f5-c1"><rect x="24" y="64" width="320" height="64" rx="12"/></clipPath>
</defs>
<use href="#f5-bg"/>
<use href="#f5-bg" filter="url(#f5-blur)" clip-path="url(#f5-c1)"/>
<rect x="24" y="64" width="320" height="64" rx="12" fill="#ffffff" fill-opacity="0.7"/>
<rect x="24.5" y="64.5" width="319" height="63" rx="12" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<rect x="376" y="64" width="320" height="64" rx="12" fill="#f2f3f5"/>
<rect x="376.5" y="64.5" width="319" height="63" rx="12" fill="none" stroke="#d9d9e0"/>
<text x="44" y="102" font-size="17" fill="#1c2024" font-weight="600">Inbox</text>
<text x="116" y="102" font-size="13" fill="#60646c">128 unread</text>
<rect x="260" y="80" width="68" height="32" rx="8" fill="#1f5fbf"/>
<text x="294" y="101" font-size="12" fill="#ffffff" font-weight="600" text-anchor="middle">Compose</text>
<text x="396" y="102" font-size="17" fill="#1c2024" font-weight="600">Inbox</text>
<text x="468" y="102" font-size="13" fill="#60646c">128 unread</text>
<rect x="612" y="80" width="68" height="32" rx="8" fill="#1f5fbf"/>
<text x="646" y="101" font-size="12" fill="#ffffff" font-weight="600" text-anchor="middle">Compose</text>
<text x="184" y="250" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Transparency on</text>
<text x="184" y="268" font-size="11" fill="#5a5850" text-anchor="middle">white 70% + blur, hairline at 50% white</text>
<text x="536" y="250" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Reduce Transparency on</text>
<text x="536" y="268" font-size="11" fill="#5a5850" text-anchor="middle">opaque #f2f3f5 + a real border #d9d9e0</text>
<text x="24" y="30" font-size="14" fill="#1a1a1a" font-weight="600">The same toolbar, with the setting off and on</text>
</svg>

The fill becomes an opaque colour near the material's average, here `#f2f3f5`, so brightness doesn't jump, and the white hairline becomes a real border. On the web the system supplies this twin.

The web's hook is `prefers-reduced-transparency`, from the Media Queries Level 5 draft, marked experimental by MDN. Support in November 2026: Chrome and Edge from 118, Firefox only behind a preference since 113, Safari not at all. That gap decides which way round to write the CSS. Here is the version that looks reasonable:

```css
.toolbar {
  background: rgb(255 255 255 / 0.7);
  backdrop-filter: blur(24px);
}
@media (prefers-reduced-transparency: reduce) {
  .toolbar { background: #f2f3f5; backdrop-filter: none; }
}
```

In Safari the media query never matches, so a Mac user with Reduce Transparency on still gets the glass. The safer order makes the opaque fallback the default and adds the material only where the browser can say the user hasn't asked for less:

```css
.toolbar {
  background: var(--material-chrome-fallback);
  border-bottom: 1px solid var(--border-subtle);
}
@media (prefers-reduced-transparency: no-preference) {
  @supports (backdrop-filter: blur(1px)) {
    .toolbar {
      background: var(--material-chrome-fill);
      backdrop-filter: blur(var(--material-chrome-blur));
      border-bottom-color: var(--material-chrome-edge);
    }
  }
}
```

Safari and Firefox users get the opaque toolbar, which loses nothing a user needs.

**Gate the material behind `prefers-reduced-transparency: no-preference`, so a browser that can't report the setting gets the opaque version.** *Weight: strong* for the designed fallback, shared by Apple and Microsoft; *moderate* for the gating, driven by Safari's missing support and worth revisiting when WebKit ships the query.

---

## Tokens for a material

A material is a small group of tokens, a fill colour with alpha, a blur radius, an optional saturation boost, an edge and an opaque fallback, named for the role the surface plays.

<svg role="img" viewBox="0 0 720 310" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Anatomy of one material. On the left, a frosted card over a busy backdrop, its title Recent files and a grey secondary line. On the right, the five tokens that describe it, with arrows to the card: material.chrome.fill, white with alpha 0.72, a colour; material.chrome.blur, 24 pixels, a dimension; material.chrome.saturate, 1.8, a number; material.chrome.edge, white at 60 percent, the hairline border; and material.chrome.fallback, an opaque light grey f2f3f5 used when transparency is reduced. The names and values are illustrative.</title>
<rect x="0" y="0" width="720" height="310" fill="#f7f6f2"/>
<defs>
<g id="f7-bg"><rect x="24" y="54" width="300" height="236" fill="#e9e4d8"/><circle cx="54" cy="137" r="30" fill="#1f5fbf"/><rect x="32" y="196" width="46" height="71" fill="#b5501f"/><rect x="80" y="54" width="6" height="236" fill="#1b1f2a" opacity="0.55"/><text x="28" y="76" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="126" cy="137" r="30" fill="#e0a43a"/><rect x="104" y="196" width="46" height="71" fill="#6b3fa0"/><rect x="152" y="54" width="6" height="236" fill="#1b1f2a" opacity="0.55"/><text x="100" y="76" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="198" cy="137" r="30" fill="#2f8f6a"/><rect x="176" y="196" width="46" height="71" fill="#1b1f2a"/><rect x="224" y="54" width="6" height="236" fill="#1b1f2a" opacity="0.55"/><text x="172" y="76" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="270" cy="137" r="30" fill="#b5501f"/><rect x="248" y="196" width="46" height="71" fill="#1f5fbf"/><rect x="296" y="54" width="6" height="236" fill="#1b1f2a" opacity="0.55"/><text x="244" y="76" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text></g>
<filter id="f7-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="10"/><feColorMatrix type="saturate" values="1.8"/></filter>
<clipPath id="f7-c"><rect x="64" y="104" width="220" height="140" rx="12"/></clipPath>
<marker id="f7-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#1a1a1a"/></marker>
</defs>
<use href="#f7-bg"/>
<use href="#f7-bg" filter="url(#f7-blur)" clip-path="url(#f7-c)"/>
<rect x="64" y="104" width="220" height="140" rx="12" fill="#ffffff" fill-opacity="0.72"/>
<rect x="64.5" y="104.5" width="219" height="139" rx="12" fill="none" stroke="#ffffff" stroke-opacity="0.6"/>
<text x="84" y="140" font-size="16" fill="#1c2024" font-weight="600">Recent files</text>
<text x="84" y="164" font-size="13" fill="#60646c">Edited 2 hours ago</text>
<text x="372" y="110" font-size="13" fill="#1a1a1a" font-weight="600" font-family="ui-monospace, monospace">material.chrome.fill</text>
<text x="372" y="127" font-size="12" fill="#5a5850" font-family="ui-monospace, monospace">#ffffffb8  ·  color, alpha 0.72</text>
<text x="372" y="152" font-size="13" fill="#1a1a1a" font-weight="600" font-family="ui-monospace, monospace">material.chrome.blur</text>
<text x="372" y="169" font-size="12" fill="#5a5850" font-family="ui-monospace, monospace">24px  ·  dimension</text>
<text x="372" y="194" font-size="13" fill="#1a1a1a" font-weight="600" font-family="ui-monospace, monospace">material.chrome.saturate</text>
<text x="372" y="211" font-size="12" fill="#5a5850" font-family="ui-monospace, monospace">1.8  ·  number</text>
<text x="372" y="236" font-size="13" fill="#1a1a1a" font-weight="600" font-family="ui-monospace, monospace">material.chrome.edge</text>
<text x="372" y="253" font-size="12" fill="#5a5850" font-family="ui-monospace, monospace">#ffffff99  ·  color</text>
<text x="372" y="278" font-size="13" fill="#1a1a1a" font-weight="600" font-family="ui-monospace, monospace">material.chrome.fallback</text>
<text x="372" y="295" font-size="12" fill="#5a5850" font-family="ui-monospace, monospace">#f2f3f5  ·  color, opaque</text>
<text x="24" y="30" font-size="14" fill="#1a1a1a" font-weight="600">A material is four values and a fallback</text>
<text x="372" y="72" font-size="12" fill="#5a5850" font-weight="600">Tokens (illustrative values)</text>
</svg>

The DTCG format (2025.10) has colour with `alpha`, dimension and number, but a blur only inside the shadow type, so a backdrop blur is stored as a plain dimension and a saturation boost as a number, grouped by name:

```json
{
  "material": {
    "chrome": {
      "fill":     { "$type": "color", "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "alpha": 0.72 } },
      "blur":     { "$type": "dimension", "$value": { "value": 24, "unit": "px" } },
      "saturate": { "$type": "number", "$value": 1.8 },
      "edge":     { "$type": "color", "$value": { "colorSpace": "srgb", "components": [1, 1, 1], "alpha": 0.6 } },
      "fallback": { "$type": "color", "$value": { "colorSpace": "srgb", "components": [0.949, 0.953, 0.961] } }
    }
  }
}
```

The transform assembles `backdrop-filter: blur(24px) saturate(1.8)`; Radix's single filter-string variable is simpler but loses the radius for Figma or a native platform. In Figma a background blur's radius can be bound to a number variable (`boundVariables.radius` in the plugin API) and the fill takes a colour variable with alpha; Figma has no saturation control, so write `saturate` into the token's description.

Name by role (`material.chrome`): a role survives a change of thickness, and `material.thin` set to 88% would be a lie. **Never ship a material token without its fallback in the same group.** *Weight: moderate.* DTCG has no material type, so the grouping is judgement; the fallback beside the fill follows from [Reduce Transparency fallbacks](#reduce-transparency-fallbacks).

---

## From Figma to CSS

A Figma background blur and CSS `backdrop-filter` look alike, but the radius is about half in CSS, Figma has no saturation, and CSS blurs only up to the nearest backdrop root. The conversion is measured in [where Figma and CSS render differently](../figma-and-code/where-figma-and-css-render-differently.md#blur-values), and the backdrop root explained in [its glass section](../figma-and-code/where-figma-and-css-render-differently.md#glass-and-progressive-blur). Figma also shows a background blur only when the layer's fill is below 100% opacity; CSS runs `backdrop-filter` whatever the fill, so an opaque fill over a blur wastes its cost.

For a material the backdrop root is the trap that breaks components. Here is the same panel drawn in Figma and built in CSS inside a translucent wrapper.

<svg role="img" viewBox="0 0 720 286" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same Now playing panel shown twice over the same busy backdrop. Left, as drawn in Figma with a background blur: the shapes behind the panel are softly blurred and the text reads cleanly. Right, as built in CSS with backdrop-filter, but inside a wrapper whose opacity is 0.9, outlined with a red dashed line: the wrapper becomes the backdrop root, the filter has nothing of the page to blur, and the shapes behind show sharp through a plain 70 percent white fill. Colours are illustrative.</title>
<rect x="0" y="0" width="720" height="286" fill="#f7f6f2"/>
<defs>
<g id="f10-bg"><rect x="16" y="44" width="688" height="180" fill="#e9e4d8"/><circle cx="46" cy="107" r="30" fill="#1f5fbf"/><rect x="24" y="152" width="46" height="54" fill="#b5501f"/><rect x="72" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="20" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="118" cy="107" r="30" fill="#e0a43a"/><rect x="96" y="152" width="46" height="54" fill="#6b3fa0"/><rect x="144" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="92" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="190" cy="107" r="30" fill="#2f8f6a"/><rect x="168" y="152" width="46" height="54" fill="#1b1f2a"/><rect x="216" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="164" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="262" cy="107" r="30" fill="#b5501f"/><rect x="240" y="152" width="46" height="54" fill="#1f5fbf"/><rect x="288" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="236" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="334" cy="107" r="30" fill="#6b3fa0"/><rect x="312" y="152" width="46" height="54" fill="#e0a43a"/><rect x="360" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="308" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="406" cy="107" r="30" fill="#1b1f2a"/><rect x="384" y="152" width="46" height="54" fill="#2f8f6a"/><rect x="432" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="380" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="478" cy="107" r="30" fill="#1f5fbf"/><rect x="456" y="152" width="46" height="54" fill="#b5501f"/><rect x="504" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="452" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="550" cy="107" r="30" fill="#e0a43a"/><rect x="528" y="152" width="46" height="54" fill="#6b3fa0"/><rect x="576" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="524" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="622" cy="107" r="30" fill="#2f8f6a"/><rect x="600" y="152" width="46" height="54" fill="#1b1f2a"/><rect x="648" y="44" width="6" height="180" fill="#1b1f2a" opacity="0.55"/><text x="596" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text></g>
<filter id="f10-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="10"/></filter>
<clipPath id="f10-c1"><rect x="52" y="84" width="264" height="100" rx="12"/></clipPath>
</defs>
<use href="#f10-bg"/>
<use href="#f10-bg" filter="url(#f10-blur)" clip-path="url(#f10-c1)"/>
<rect x="52" y="84" width="264" height="100" rx="12" fill="#ffffff" fill-opacity="0.7"/>
<rect x="52.5" y="84.5" width="263" height="99" rx="12" fill="none" stroke="#ffffff" stroke-opacity="0.5"/>
<rect x="404" y="84" width="264" height="100" rx="12" fill="#ffffff" fill-opacity="0.7"/>
<rect x="392" y="72" width="288" height="124" rx="16" fill="none" stroke="#b3261e" stroke-dasharray="5 4"/>
<rect x="392" y="200" width="150" height="20" rx="4" fill="#ffffff"/>
<text x="400" y="214" font-size="11" fill="#b3261e" font-weight="600" font-family="ui-monospace, monospace">wrapper: opacity 0.9</text>
<text x="70" y="122" font-size="16" fill="#1c2024" font-weight="600">Now playing</text>
<text x="70" y="146" font-size="13" fill="#60646c">Album 3 · track 4</text>
<text x="422" y="122" font-size="16" fill="#1c2024" font-weight="600">Now playing</text>
<text x="422" y="146" font-size="13" fill="#60646c">Album 3 · track 4</text>
<text x="184" y="252" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Figma: background blur</text>
<text x="184" y="270" font-size="11" fill="#5a5850" text-anchor="middle">blurs every layer drawn behind it</text>
<text x="536" y="252" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">CSS: backdrop-filter in a 0.9 wrapper</text>
<text x="536" y="270" font-size="11" fill="#5a5850" text-anchor="middle">the wrapper is the backdrop root: no blur</text>
<text x="16" y="30" font-size="14" fill="#1a1a1a" font-weight="600">Same component, two backdrops</text>
</svg>

On the right, the wrapper with `opacity: 0.9` becomes the backdrop root, so the photo shows sharp through a plain 70% fill: the middle card of [Solid, alpha and blur](#solid-alpha-and-blur), by accident.

Halve the blur in the token transform and add `saturate` in code. **Note on any component with a material that it must not sit inside an ancestor with opacity, a filter or a mask.** *Weight: strong.* The backdrop root is in the CSS spec; the note is the cheap way to stop the trap reaching production.

---

## Materials in dark mode

A dark material swaps the white tint for a near-black one and adds a faint light edge, and its worst case flips from a dark backdrop to a bright one.

<svg role="img" viewBox="0 0 720 296" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same frosted card in light and dark mode. Left, over a light busy backdrop, the light material: white at 72 percent over a blur, dark title and grey secondary text, a bright white hairline edge. Right, over a dark busy backdrop with pale stripes and letters, the dark material: a near-black tint, 16 18 1d, at 72 percent over a blur, light title and light grey secondary text, and a faint white hairline at 14 percent that catches the edge the way a highlight would. The blur is the same in both; only the tint and the edge change. Colours are illustrative.</title>
<rect x="0" y="0" width="720" height="296" fill="#f7f6f2"/>
<defs>
<g id="f8-bgl"><rect x="16" y="44" width="336" height="190" fill="#e9e4d8"/><circle cx="46" cy="110" r="30" fill="#1f5fbf"/><rect x="24" y="158" width="46" height="57" fill="#b5501f"/><rect x="72" y="44" width="6" height="190" fill="#1b1f2a" opacity="0.55"/><text x="20" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="118" cy="110" r="30" fill="#e0a43a"/><rect x="96" y="158" width="46" height="57" fill="#6b3fa0"/><rect x="144" y="44" width="6" height="190" fill="#1b1f2a" opacity="0.55"/><text x="92" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="190" cy="110" r="30" fill="#2f8f6a"/><rect x="168" y="158" width="46" height="57" fill="#1b1f2a"/><rect x="216" y="44" width="6" height="190" fill="#1b1f2a" opacity="0.55"/><text x="164" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text><circle cx="262" cy="110" r="30" fill="#b5501f"/><rect x="240" y="158" width="46" height="57" fill="#1f5fbf"/><rect x="288" y="44" width="6" height="190" fill="#1b1f2a" opacity="0.55"/><text x="236" y="66" font-size="18" font-weight="700" fill="#1b1f2a">Aa</text></g>
<g id="f8-bgd"><rect x="368" y="44" width="336" height="190" fill="#22262f"/><circle cx="398" cy="110" r="30" fill="#1f5fbf"/><rect x="376" y="158" width="46" height="57" fill="#b5501f"/><rect x="424" y="44" width="6" height="190" fill="#f7f6f2" opacity="0.55"/><text x="372" y="66" font-size="18" font-weight="700" fill="#f7f6f2">Aa</text><circle cx="470" cy="110" r="30" fill="#e0a43a"/><rect x="448" y="158" width="46" height="57" fill="#6b3fa0"/><rect x="496" y="44" width="6" height="190" fill="#f7f6f2" opacity="0.55"/><text x="444" y="66" font-size="18" font-weight="700" fill="#f7f6f2">Aa</text><circle cx="542" cy="110" r="30" fill="#2f8f6a"/><rect x="520" y="158" width="46" height="57" fill="#1b1f2a"/><rect x="568" y="44" width="6" height="190" fill="#f7f6f2" opacity="0.55"/><text x="516" y="66" font-size="18" font-weight="700" fill="#f7f6f2">Aa</text><circle cx="614" cy="110" r="30" fill="#b5501f"/><rect x="592" y="158" width="46" height="57" fill="#1f5fbf"/><rect x="640" y="44" width="6" height="190" fill="#f7f6f2" opacity="0.55"/><text x="588" y="66" font-size="18" font-weight="700" fill="#f7f6f2">Aa</text></g>
<filter id="f8-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="10"/></filter>
<clipPath id="f8-cl"><rect x="52" y="86" width="264" height="110" rx="12"/></clipPath>
<clipPath id="f8-cd"><rect x="404" y="86" width="264" height="110" rx="12"/></clipPath>
</defs>
<use href="#f8-bgl"/>
<use href="#f8-bgd"/>
<use href="#f8-bgl" filter="url(#f8-blur)" clip-path="url(#f8-cl)"/>
<rect x="52" y="86" width="264" height="110" rx="12" fill="#ffffff" fill-opacity="0.72"/>
<rect x="52.5" y="86.5" width="263" height="109" rx="12" fill="none" stroke="#ffffff" stroke-opacity="0.6"/>
<use href="#f8-bgd" filter="url(#f8-blur)" clip-path="url(#f8-cd)"/>
<rect x="404" y="86" width="264" height="110" rx="12" fill="#16181d" fill-opacity="0.72"/>
<rect x="404.5" y="86.5" width="263" height="109" rx="12" fill="none" stroke="#ffffff" stroke-opacity="0.14"/>
<text x="72" y="122" font-size="16" fill="#1c2024" font-weight="600">Recent files</text>
<text x="72" y="146" font-size="13" fill="#60646c">Edited 2 hours ago</text>
<text x="424" y="122" font-size="16" fill="#edeef0" font-weight="600">Recent files</text>
<text x="424" y="146" font-size="13" fill="#b0b4ba">Edited 2 hours ago</text>
<text x="184" y="262" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Light: white tint at 72%</text>
<text x="184" y="280" font-size="11" fill="#5a5850" text-anchor="middle">edge: white hairline at 60%</text>
<text x="536" y="262" font-size="13" fill="#1a1a1a" font-weight="600" text-anchor="middle">Dark: near-black tint at 72%</text>
<text x="536" y="280" font-size="11" fill="#5a5850" text-anchor="middle">edge: white hairline at 14%</text>
<text x="16" y="30" font-size="14" fill="#1a1a1a" font-weight="600">One material, two tints</text>
</svg>

The blur stays; the tint becomes a near-black, `#16181d` at 72%, and the edge a 14% white highlight. On the web the material group needs a value per mode.

The contrast arithmetic flips with it. Over a white page scrolled underneath, the 72% dark fill composites to a mid grey. Primary text in `#edeef0` measures 6.1:1 and passes; secondary text in `#b0b4ba` measures 3.4:1 and fails, and needs the tint at about 80% to reach 4.5:1. Radix's dark panel, about 3.5% white over the blur, works only on cards over the dark page.

**In dark mode, set the material's thickness by the secondary text colour composited over white, which usually means 80% or more.** *Weight: required* for the arithmetic, WCAG's; the edge highlight is common practice in Apple's and Microsoft's materials rather than a written rule.

---

## The cost of backdrop-filter

A backdrop blur makes the browser re-read and re-blur whatever is behind the surface whenever that changes, so a large blurred surface over scrolling content costs work on every frame of the scroll.

Support is no longer the obstacle: `backdrop-filter` works unprefixed in Chrome from 76, Firefox from 103 and Safari from 18 (prefixed since 9). The cost is in the work. An opaque header is drawn once and moved; a blurred header over a scrolling feed samples, blurs and composites the pixels under it each time the feed moves, on the GPU, growing with area and radius. Microsoft says rendering Acrylic is GPU-intensive, can raise power use and shorten battery life, and switches it off in Battery Saver. On the web there are bug reports, not benchmarks: a 2025 Firefox bug (unconfirmed) describes very slow scrolling with `backdrop-filter: blur` and no GPU acceleration, as over remote desktop, the opening scene's stutter.

Keep blurred surfaces small, never animate the blur radius, avoid nesting one blurred surface in another, and try the page on a low-end laptop and over remote desktop. **Blur bars and menus, not page-sized panels, and test the scroll on the weakest machine your users have.** *Weight: moderate.* The direction is consensus; the cost on a given device is measured in no source found, and has to be measured on yours.

---

## When to skip it

A small team without a native app to match, or without a surface that floats over moving content, should ship no material at all and spend the effort on opaque surface levels and alpha ramps.

One material asks for ten values, two worst-case contrast checks per text colour, a gated fallback, a backdrop-root note per component and a performance check. What it gives is context through a bar or a menu, which matters where content scrolls under fixed chrome: a media app, a map, a photo library. A form-heavy admin product or a dashboard on a plain page gets very little.

Two cases justify it for a small team: a web view inside a native shell whose bars are system materials, and a single surface the product is built around, such as a map with floating controls.

**Without a native shell to match or content that scrolls under fixed chrome, ship no material; add one later, as a group with its fallback, when a surface needs it.** *Weight: moderate.* It is judgement for teams of a few people; the large web systems reached the same answer with far more people to spare.

---

## Cheat sheet

| Surface | Fill | Why |
|---|---|---|
| Card, panel, table in content | opaque | it is read, and nothing moves under it |
| Sticky header or toolbar over a scrolling feed | material, or opaque | only if text passes on the worst case |
| Menu, popover, flyout | material on native; opaque on the web | Microsoft's Acrylic rule; Radix keeps these solid |
| Dialog | opaque | holds text; the scrim separates |
| Scrim behind a modal | translucent black; optional 4px blur | Ant Design's opt-in blur goes here |
| Hover, selected row, tag, divider | alpha ramp step | adapts to any surface, no blur |

| Material | Worst backdrop | Primary text | Secondary text | Thickness for secondary at 4.5:1 |
|---|---|---|---|---|
| white at 70% | black | `#1c2024` 7.8:1 | `#60646c` 2.8:1 | about 88% |
| `#16181d` at 72% | white | `#edeef0` 6.1:1 | `#b0b4ba` 3.4:1 | about 80% |

---

## The short version

Most surfaces should be opaque. Translucency earns its place only on surfaces that float over moving content, which is where Apple keeps Liquid Glass and Microsoft keeps Acrylic. The big web systems ship essentially no blur; Radix, translucent by default, still keeps menus and dialogs solid.

A translucent surface that holds text must be blurred, and must pass contrast on the worst backdrop: black for a light material, white for a dark one. At 70% white only the primary text colour survives; secondary text needs about 88%, and 80% or more in dark.

Every material needs an opaque twin with a real border for Reduce Transparency, Windows' transparency effects and battery saver. On the web, `prefers-reduced-transparency` works in Chrome and Edge only, so make the opaque version the default and add the material under `no-preference`.

Store a material as a token group under a role name (fill, blur, saturate, edge, fallback); halve Figma's blur for CSS, and keep the component out of ancestors with opacity, a filter or a mask. A small team with no native shell to match should skip materials. The placement rule and the arithmetic are strong; skipping materials is judgement. Write down which surfaces are opaque by rule, so the first frosted card in a mock-up gets a question rather than a ticket.

---

## What to re-check later

Researched 12 November 2026.

- **`prefers-reduced-transparency` support** is from MDN's browser-compat-data as of 12 November 2026: Chrome 118, Firefox behind `layout.css.prefers-reduced-transparency.enabled` since 113, Safari none (WebKit bug 175497). When WebKit ships it, the gating advice can relax.
- **Package versions** are those named in the table and sources. Carbon and GOV.UK scrims were not checked.
- **Radix docs against code**: the docs list popovers and menus as panels; the 3.3.0 CSS makes them solid. Re-check before citing either as Radix's intent.
- **Liquid Glass**: the HIG materials page was read through Apple's JSON endpoint (change log last entry 9 September 2025). The iOS 26.1 setting is from press coverage, not an Apple page.
- **Illustrative values**: Apple's material opacities (Apple publishes none) and `#f2f3f5` as a fallback colour. No performance benchmark was found.
- **Contrast figures** are WCAG 2 ratios computed for this guide; APCA would give different numbers.
- **Evidence quality.** Shipped code shows what survives, not what reads best. Apple's and Microsoft's shared line is an independent convergence; the web systems' opacity may partly be one circumstance, late `backdrop-filter` support, repeated. No usability study of reading on blurred surfaces turned up.

---

## Sources

**Primary: platforms and shipped code**

- [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials) (read via [its JSON](https://developer.apple.com/tutorials/data/design/human-interface-guidelines/materials.json): Liquid Glass, 35% dimming layer, standard materials, vibrancy)
- [SwiftUI `Material`](https://developer.apple.com/documentation/swiftui/material) and [`accessibilityReduceTransparency`](https://developer.apple.com/documentation/swiftui/environmentvalues/accessibilityreducetransparency)
- [Microsoft Learn: Mica material](https://learn.microsoft.com/en-us/windows/apps/design/style/mica) (opaque, sampled once, Mica Alt, fallbacks)
- [Microsoft Learn: Acrylic material](https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic) (transient surfaces, fallbacks, GPU and battery, accent text, recipe)
- [Fluent 2: Material](https://fluent2.microsoft.design/material) (solid, Mica, Acrylic, Smoke)
- [`@fluentui/tokens` 1.0.0-alpha.24](https://www.npmjs.com/package/@fluentui/tokens) (`colorBackgroundOverlay`, `colorNeutralBackgroundAlpha`)
- [Radix Themes: colour, panel background and alpha colours](https://github.com/radix-ui/website/blob/main/data/themes/docs/theme/color.mdx) and [Theme component API](https://www.radix-ui.com/themes/docs/components/theme)
- [`@radix-ui/themes` 3.3.0 styles.css](https://unpkg.com/@radix-ui/themes@3.3.0/styles.css) (`--color-panel-translucent`, `--backdrop-filter-panel`)
- [Radix Colors `light.ts`](https://github.com/radix-ui/colors/blob/main/src/light.ts) (`slate`, `slateA`) and [custom palettes](https://github.com/radix-ui/website/blob/main/data/colors/docs/overview/custom-palettes.mdx) (alpha blending in P3)
- [`@material/web` 2.5.0](https://www.npmjs.com/package/@material/web) (dialog scrim 0.32; no `backdrop-filter`)
- [`@atlaskit/tokens` 20.11.0](https://www.npmjs.com/package/@atlaskit/tokens) (`surface`, `surface-container`, `background-neutral`, `blanket`) and [Atlassian elevation](https://atlassian.design/foundations/elevation)
- [`@primer/primitives` 11.10.0](https://www.npmjs.com/package/@primer/primitives) (`overlay-backdrop-bgColor`, `bgColor-neutral-muted`)
- [`@carbon/styles` 1.119.0, `_slug.scss`](https://github.com/carbon-design-system/carbon/blob/main/packages/styles/scss/components/slug/_slug.scss) (AI label actions `blur(85px)`)
- [`govuk-frontend` 6.6.0](https://www.npmjs.com/package/govuk-frontend) (no `backdrop-filter`)
- [`antd` 6.7.0](https://www.npmjs.com/package/antd) (mask `blur: false` default; Modal and Drawer mask blur `blur(4px)`; `colorBgMask`)
- [Figma help: Apply effects to layers](https://help.figma.com/hc/en-us/articles/360041488473-Apply-effects-to-layers) (background blur needs fill below 100%)
- [`@figma/plugin-typings` 1.142.0](https://www.npmjs.com/package/@figma/plugin-typings) (`BlurEffectBase.boundVariables.radius`)

**Standards and browser data**

- [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/) (types; blur only inside shadow)
- [Media Queries Level 5: prefers-reduced-transparency](https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-transparency) and [MDN: prefers-reduced-transparency](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-transparency)
- [MDN browser-compat-data: media.json](https://github.com/mdn/browser-compat-data/blob/main/css/at-rules/media.json) and [backdrop-filter.json](https://github.com/mdn/browser-compat-data/blob/main/css/properties/backdrop-filter.json)
- [WebKit bug 175497](https://webkit.org/b/175497) and [Mozilla bug 1988728](https://bugzilla.mozilla.org/show_bug.cgi?id=1988728)

**Commentary**

- [Raluca Budiu, Nielsen Norman Group: Liquid Glass Is Cracked, and Usability Suffers in iOS 26](https://www.nngroup.com/articles/liquid-glass/) (10 October 2025; expert critique, no participants)
- [MacRumors: iOS 26.1 lets users control Liquid Glass transparency](https://www.macrumors.com/2025/10/20/ios-26-1-liquid-glass-toggle/) (press, not Apple)

---

*Part of the foundations series on surfaces: [how surfaces stack](how-surfaces-stack.md), [elevation and shadows](elevation-and-shadows.md), [surfaces in dark mode](surfaces-in-dark-mode.md), and this piece.*
