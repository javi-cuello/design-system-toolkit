# How surfaces stack

What happens when one background sits on another: what the levels are called, which way the page and the cards go, how nesting resolves, and what a component does when it lands on a tinted surface.

A settings screen has a white page and a grey "Plan" card, and inside the card sits a setup stepper. On the page, the stepper's upcoming steps were light grey circles joined by a light grey line. In the card they are gone: the circles are the card's own grey, and only the numbers float in the space where the steps used to be. Nobody changed the stepper. Somebody put it somewhere new.

---

## What this answers

- [Naming the levels](#naming-the-levels): which word a system uses for its backgrounds, and why the same word means four different things
- [Page and card polarity](#page-and-card-polarity): grey page with white cards, or white page with grey cards
- [A surface on a surface](#a-surface-on-a-surface): what a nested surface takes, stepping up or alternating
- [Components on a tint](#components-on-a-tint): what a stepper, a field or a toggle does on a grey card
- [Hover and pressed per level](#hover-and-pressed-per-level): whether each level needs its own hover colour
- [Inverse surfaces](#inverse-surfaces): what the dark snackbar on a light page is
- [Which level overlays take](#which-level-overlays-take): sheets, popovers, menus, dialogs and tooltips
- [Headers that lift on scroll](#headers-that-lift-on-scroll): why a header changes colour when content slides under it

For a lookup, use the [cheat sheet](#cheat-sheet); [the short version](#the-short-version) is the whole guide in four paragraphs. The four levels themselves (sunken, page, raised, overlay) and their dark values are in the toolkit's knowledge base. Shadows are in [elevation and shadows](elevation-and-shadows.md), dark-mode ladders in [surfaces in dark mode](surfaces-in-dark-mode.md), and translucent surfaces in [materials and translucency](materials-and-translucency.md): keep the stack opaque, because an opaque surface is measured once and a translucent one over everything that scrolls beneath it.

---

## Naming the levels

Systems split between naming a background by its place in the stack (Carbon's `layer-01`, Spectrum's `background-layer-1`, Fluent's `colorNeutralBackground1`) and naming it by its role (Material's `surface-container`, Atlassian's `elevation.surface.raised`, Primer's `bgColor-inset`), and the word "surface" itself means a different thing in nearly every system that uses it.

A designer moving from Material to Polaris carries "surface" across as the page. In Polaris, `bg-surface` is the white card; the page is `bg`. In Radix Themes, `--color-surface` is the background of a text field. In GOV.UK Frontend, `surface-background` is the tint of a component that uses a different palette from the page.

Here is where eight systems' names land, from their shipped tokens. "Surface" is marked in orange and "overlay" in blue, because both words move between columns.

<svg role="img" viewBox="0 0 1000 360" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A table of the background token names eight design systems ship, by what the background is used for: the page, a card or panel, a form field, a floating menu or popover, and the dimming layer behind a modal. Material 3 uses surface for the page, surface-container-low for an elevated card, surface-container-highest for a filled field, surface-container for a menu and scrim behind a modal. Atlassian uses elevation.surface, elevation.surface.raised, background.input, elevation.surface.overlay and blanket. Polaris uses bg for the page, bg-surface for the card, input-bg-surface for a field and backdrop-bg behind a modal. Radix Themes uses background, panel, surface for a form field, panel for floating, and overlay behind a modal. GOV.UK uses body-background for the page and surface-background for components with their own palette. Carbon uses background, layer-01, field-01 and overlay behind a modal. Spectrum uses background-base-color, background-layer-1-color and background-elevated-color. Primer uses bgColor-default, card-bgColor, overlay-bgColor and overlay-backdrop-bgColor. The word surface lands on the page in two systems, on the card in two and on the field in one; the word overlay names a floating surface in two systems and the dimming layer in two.</title>
<rect x="0" y="0" width="1000" height="360" fill="#f7f6f2"/>
<text x="16" y="32" font-size="13" font-weight="600" fill="#1a1a1a">System</text>
<text x="116" y="32" font-size="13" font-weight="600" fill="#1a1a1a">Page</text>
<text x="296" y="32" font-size="13" font-weight="600" fill="#1a1a1a">Card or panel</text>
<text x="486" y="32" font-size="13" font-weight="600" fill="#1a1a1a">Form field</text>
<text x="686" y="32" font-size="13" font-weight="600" fill="#1a1a1a">Floating</text>
<text x="876" y="32" font-size="13" font-weight="600" fill="#1a1a1a">Behind modal</text>
<line x1="16" y1="44" x2="984" y2="44" stroke="#b9b6ac" stroke-width="1"/>
<g font-size="11" font-family="ui-monospace, Menlo, monospace">
<text x="16" y="70" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Material 3</text>
<text x="116" y="70" fill="#b5501f" font-weight="700">surface</text>
<text x="296" y="70" fill="#1a1a1a">surface-container-low</text>
<text x="486" y="70" fill="#1a1a1a">surface-container-highest</text>
<text x="686" y="70" fill="#1a1a1a">surface-container (menu)</text>
<text x="876" y="70" fill="#1a1a1a">scrim</text>
<text x="16" y="110" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Atlassian</text>
<text x="116" y="110" fill="#b5501f" font-weight="700">elevation.surface</text>
<text x="296" y="110" fill="#1a1a1a">elevation.surface.raised</text>
<text x="486" y="110" fill="#1a1a1a">background.input</text>
<text x="686" y="110" fill="#1f5fbf" font-weight="700">elevation.surface.overlay</text>
<text x="876" y="110" fill="#1a1a1a">blanket</text>
<text x="16" y="146" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Polaris</text>
<text x="116" y="146" fill="#1a1a1a">bg</text>
<text x="296" y="146" fill="#b5501f" font-weight="700">bg-surface</text>
<text x="486" y="146" fill="#1a1a1a">input-bg-surface</text>
<text x="686" y="146" fill="#8a877e">not named</text>
<text x="876" y="146" fill="#1a1a1a">backdrop-bg</text>
<text x="16" y="182" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Radix Themes</text>
<text x="116" y="182" fill="#1a1a1a">background</text>
<text x="296" y="182" fill="#1a1a1a">panel</text>
<text x="486" y="182" fill="#b5501f" font-weight="700">surface</text>
<text x="686" y="182" fill="#1a1a1a">panel</text>
<text x="876" y="182" fill="#1f5fbf" font-weight="700">overlay</text>
<text x="16" y="218" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">GOV.UK</text>
<text x="116" y="218" fill="#1a1a1a">body-background</text>
<text x="296" y="218" fill="#b5501f" font-weight="700">surface-background</text>
<text x="486" y="218" fill="#8a877e">not named</text>
<text x="686" y="218" fill="#8a877e">not named</text>
<text x="876" y="218" fill="#8a877e">not named</text>
<text x="16" y="254" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Carbon</text>
<text x="116" y="254" fill="#1a1a1a">background</text>
<text x="296" y="254" fill="#1a1a1a">layer-01</text>
<text x="486" y="254" fill="#1a1a1a">field-01</text>
<text x="686" y="254" fill="#8a877e">not named</text>
<text x="876" y="254" fill="#1f5fbf" font-weight="700">overlay</text>
<text x="16" y="290" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Spectrum</text>
<text x="116" y="290" fill="#1a1a1a">background-base</text>
<text x="296" y="290" fill="#1a1a1a">background-layer-1</text>
<text x="486" y="290" fill="#8a877e">not named</text>
<text x="686" y="290" fill="#1a1a1a">background-elevated</text>
<text x="876" y="290" fill="#8a877e">not named</text>
<text x="16" y="326" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Primer</text>
<text x="116" y="326" fill="#1a1a1a">bgColor-default</text>
<text x="296" y="326" fill="#1a1a1a">card-bgColor</text>
<text x="486" y="326" fill="#8a877e">not named</text>
<text x="686" y="326" fill="#1f5fbf" font-weight="700">overlay-bgColor</text>
<text x="876" y="326" fill="#1a1a1a">overlay-backdrop</text>
</g>
</svg>

Read down the orange cells and "surface" walks from the page to the card to the field. Read the blue ones and "overlay" is a floating menu in Atlassian and Primer, and the dimming layer behind a dialog in Radix and Carbon.

A position name such as `layer-02` says nothing about what the thing is, so it survives any reuse and lets the system compute the next one, which is what makes Carbon's nesting work (see [a surface on a surface](#a-surface-on-a-surface)). Fluent sits at the far end: its `colorNeutralBackground1` to `6` are numbered greys that do not say page or card at all. A role name such as `elevation.surface.overlay` tells a designer which to pick without a diagram, and carries its pairing: Atlassian's token description says to combine it with `elevation.shadow.overlay`. Material moved the same way in 2023, from a surface tinted by elevation to five named container roles ([surfaces in dark mode](surfaces-in-dark-mode.md#tint-overlays-to-containers) tells that change).

Use role names for the levels a designer picks (page, raised, overlay, sunken). If your system needs computed nesting, keep the numbered set underneath as the mechanism, the way Carbon keeps `layer-01` for design and contextual `$layer` for code. **Whatever word you choose, write down which column of the figure it sits in, and never borrow "surface" or "overlay" from another system without checking which one it meant.** *Weight: moderate.* The split between the families is not consensus; the warning about the two words is arithmetic over the table.

---

## Page and card polarity

Shipping systems divide almost evenly between a grey page with white cards and a white page with grey wells, and the choice decides where the brightest, highest-contrast white goes.

Painted one way, the settings page is light grey and the "Plan" card is white, so the card pops forward and everything inside it reads at full contrast. Painted the other way, the page is white and the card is a pale grey well, so the page reads like a document and the card like a grouped aside. Here are the two, with illustrative neutral values (#f0f0f0 for the grey, #ffffff for the white).

<svg role="img" viewBox="0 0 720 330" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The same settings screen painted two ways, with illustrative neutral values. Left, a grey page of #f0f0f0 with two white #ffffff cards: the cards lift forward without a shadow, and a heading set directly on the grey page sits outside the cards. Under it, the systems that ship this polarity: Polaris, Ant Design, Carbon's Gray 10 theme and iOS grouped lists. Right, a white page with two grey #f0f0f0 wells: the page reads as a document and the wells read as grouped asides. Under it, the systems that ship this polarity: Carbon's White theme, Material 3, Atlassian and Primer.</title>
<rect x="0" y="0" width="720" height="330" fill="#f7f6f2"/>
<text x="24" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Grey page, white cards</text>
<text x="384" y="30" font-size="14" font-weight="600" fill="#1a1a1a">White page, grey wells</text>
<rect x="24" y="44" width="312" height="220" rx="6" fill="#f0f0f0" stroke="#d6d4cc"/>
<rect x="44" y="62" width="120" height="12" rx="2" fill="#1a1a1a"/>
<rect x="44" y="88" width="272" height="72" rx="6" fill="#ffffff"/>
<rect x="60" y="104" width="90" height="9" rx="2" fill="#5a5850"/>
<rect x="60" y="122" width="220" height="7" rx="2" fill="#b9b6ac"/>
<rect x="60" y="138" width="170" height="7" rx="2" fill="#b9b6ac"/>
<rect x="44" y="174" width="272" height="72" rx="6" fill="#ffffff"/>
<rect x="60" y="190" width="90" height="9" rx="2" fill="#5a5850"/>
<rect x="60" y="208" width="220" height="7" rx="2" fill="#b9b6ac"/>
<rect x="60" y="224" width="170" height="7" rx="2" fill="#b9b6ac"/>
<rect x="384" y="44" width="312" height="220" rx="6" fill="#ffffff" stroke="#d6d4cc"/>
<rect x="404" y="62" width="120" height="12" rx="2" fill="#1a1a1a"/>
<rect x="404" y="88" width="272" height="72" rx="6" fill="#f0f0f0"/>
<rect x="420" y="104" width="90" height="9" rx="2" fill="#5a5850"/>
<rect x="420" y="122" width="220" height="7" rx="2" fill="#b9b6ac"/>
<rect x="420" y="138" width="170" height="7" rx="2" fill="#b9b6ac"/>
<rect x="404" y="174" width="272" height="72" rx="6" fill="#f0f0f0"/>
<rect x="420" y="190" width="90" height="9" rx="2" fill="#5a5850"/>
<rect x="420" y="208" width="220" height="7" rx="2" fill="#b9b6ac"/>
<rect x="420" y="224" width="170" height="7" rx="2" fill="#b9b6ac"/>
<text x="24" y="290" font-size="12" fill="#5a5850">Polaris, Ant Design, Carbon Gray 10,</text>
<text x="24" y="308" font-size="12" fill="#5a5850">iOS grouped lists</text>
<text x="384" y="290" font-size="12" fill="#5a5850">Carbon White, Material 3, Atlassian,</text>
<text x="384" y="308" font-size="12" fill="#5a5850">Primer (white cards, grey insets)</text>
</svg>

On the left the cards come forward with no shadow at all. On the right nothing comes forward; the grey groups and recedes.

The grey-page camp is the admin-tool camp. Polaris ships `bg` at `rgba(241, 241, 241, 1)` under `bg-surface` at pure white. Ant Design's `colorBgLayout` is `#f5f5f5` under a white `colorBgContainer`. Carbon's Gray 10 theme sets `background` to `#f4f4f4` and `layer-01` to `#ffffff`. Apple's grouped table, the Settings look, puts white cells on a grey grouped background (hex values unchecked).

The white-page camp is the document camp. Carbon's White theme inverts Gray 10: `background` white, `layer-01` `#f4f4f4`. Material 3's light `surface` is tone 98 and every container but `-lowest` (tone 100) is darker, from `surface-container-low` at tone 96 to `-highest` at 90. Atlassian's `elevation.surface` and `.raised` are both `#FFFFFF`, and its grey is `elevation.surface.sunken` (`#F8F8F8`). Primer's page is white, and its grey `bgColor-muted` (`#f6f8fa`) goes to sidebars and insets.

The trade-offs land on different parts of the screen:

- **Grey page, white cards** puts the brightest white under the content that matters, and the card separates without a shadow. The cost is everything not in a card: a heading or table placed straight on the page sits on grey, which quietly pushes every piece of content into a card. And a card inside a card has nowhere lighter to go, so Polaris needs `bg-surface-secondary` (`#f7f7f7`) to tint back down inside the white.
- **White page, grey wells** keeps the page at full contrast, which suits reading and long tables. The cost is inside the well: every control drawn assuming white behind it now sits on grey. That is the stepper in the opening scene.

Carbon ships both, as two light themes, which is the strongest evidence that neither is wrong, and shows the choice is made once per theme, not per screen. Pick by where your densest content lives: cards, forms and panels (an admin tool) favour the grey page; a document, table or feed straight on the page favours the white one. **Choose the polarity once, for the whole product, and record it as a sentence: "the page is grey, cards are white" or the reverse.** *Weight: weak.* The evidence only says both work; the choice is judgement.

---

## A surface on a surface

In dark themes every system steps a nested surface one level lighter, while in light themes Carbon and Spectrum alternate between white and grey, and that alternation is what lets a light theme nest more than two levels deep.

Put a white card on a grey page and a panel inside it: the panel cannot be whiter than white. Dark always has one more step to climb; light hits its ceiling at the second level. Here are Carbon's layers in its White and Gray 100 themes, and Spectrum's light background layers, with their real token values.

<svg role="img" viewBox="0 0 720 330" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Three nested stacks drawn with real token values. Left, Carbon White theme: background #ffffff holds layer-01 #f4f4f4, which holds layer-02 #ffffff, which holds layer-03 #f4f4f4, so the layers alternate between white and grey. Middle, Carbon Gray 100 theme: background #161616 holds layer-01 #262626, layer-02 #393939 and layer-03 #525252, each one step lighter. Right, Spectrum light theme: background-base #ffffff, background-layer-1 #f8f8f8, background-layer-2 back to #ffffff; in Spectrum dark the same three are #111111, #1b1b1b and #222222, stepping up.</title>
<rect x="0" y="0" width="720" height="330" fill="#f7f6f2"/>
<text x="24" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Carbon White: alternates</text>
<text x="264" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Carbon Gray 100: steps up</text>
<text x="504" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Spectrum light: alternates</text>
<rect x="24" y="44" width="200" height="240" fill="#ffffff" stroke="#d6d4cc"/>
<text x="34" y="62" font-size="11" fill="#1a1a1a">background #ffffff</text>
<rect x="40" y="72" width="168" height="200" fill="#f4f4f4"/>
<text x="50" y="90" font-size="11" fill="#1a1a1a">layer-01 #f4f4f4</text>
<rect x="56" y="100" width="136" height="160" fill="#ffffff"/>
<text x="66" y="118" font-size="11" fill="#1a1a1a">layer-02 #ffffff</text>
<rect x="72" y="128" width="104" height="120" fill="#f4f4f4"/>
<text x="80" y="146" font-size="11" fill="#1a1a1a">layer-03</text>
<text x="80" y="162" font-size="11" fill="#1a1a1a">#f4f4f4</text>
<rect x="264" y="44" width="200" height="240" fill="#161616"/>
<text x="274" y="62" font-size="11" fill="#f4f4f4">background #161616</text>
<rect x="280" y="72" width="168" height="200" fill="#262626"/>
<text x="290" y="90" font-size="11" fill="#f4f4f4">layer-01 #262626</text>
<rect x="296" y="100" width="136" height="160" fill="#393939"/>
<text x="306" y="118" font-size="11" fill="#f4f4f4">layer-02 #393939</text>
<rect x="312" y="128" width="104" height="120" fill="#525252"/>
<text x="320" y="146" font-size="11" fill="#ffffff">layer-03</text>
<text x="320" y="162" font-size="11" fill="#ffffff">#525252</text>
<rect x="504" y="44" width="200" height="240" fill="#ffffff" stroke="#d6d4cc"/>
<text x="514" y="62" font-size="11" fill="#1a1a1a">base #ffffff</text>
<rect x="520" y="72" width="168" height="200" fill="#f8f8f8"/>
<text x="530" y="90" font-size="11" fill="#1a1a1a">layer-1 #f8f8f8</text>
<rect x="536" y="100" width="136" height="160" fill="#ffffff"/>
<text x="546" y="118" font-size="11" fill="#1a1a1a">layer-2 #ffffff</text>
<text x="504" y="306" font-size="12" fill="#5a5850">dark: #111111, #1b1b1b, #222222</text>
</svg>

The light stacks bounce between two values; the dark stack climbs. Each nested level is still told apart from its parent, which is the only job a nesting rule has.

Alternation gives up one promise: that a higher number is "further forward". In Carbon White, `layer-02` is the same white as the page. That is fine, because people perceive only the edge between a level and the one directly around it. Carbon's hover tokens show how little it costs: in White, `layerHover01`, `02` and `03` are all `#e8e8e8`. In dark, stepping costs nothing because there is room; how big each dark step should be is in [surfaces in dark mode](surfaces-in-dark-mode.md#which-way-levels-go).

A component also has to find out which level it is on. Carbon answers twice. **In design files, explicitly:** every layer has a set (`layer-01` with `field-01`, `border-subtle-01`, `layer-hover-01`), and a designer drawing a text input on `layer-02` picks `field-03`, because fields sit one level above their background. **In code, contextually:** the same tokens exist without the number (`$layer`, `$field`), and their value depends on how deep the component sits inside Carbon's `Layer` component, which nests up to three levels. Carbon's guide says these contextual tokens exist only in code.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Carbon's contextual tokens in its White theme. One text field component written once with the contextual token field is placed at three depths. On the page, background #ffffff, the field resolves to field-01, #f4f4f4. Inside one Layer, on #f4f4f4, the same field resolves to field-02, #ffffff. Inside a second nested Layer, on #ffffff, it resolves to field-03, #f4f4f4. The field always contrasts with whatever is directly behind it, without the component knowing its depth.</title>
<rect x="0" y="0" width="720" height="300" fill="#f7f6f2"/>
<rect x="24" y="24" width="672" height="252" fill="#ffffff" stroke="#d6d4cc"/>
<text x="40" y="46" font-size="12" fill="#5a5850">Page: background #ffffff</text>
<rect x="40" y="58" width="190" height="34" fill="#f4f4f4"/>
<line x1="40" y1="91" x2="230" y2="91" stroke="#8d8d8d" stroke-width="1.5"/>
<text x="50" y="80" font-size="12" font-family="ui-monospace, Menlo, monospace" fill="#1a1a1a">$field → field-01</text>
<rect x="256" y="40" width="424" height="220" fill="#f4f4f4"/>
<text x="272" y="62" font-size="12" fill="#5a5850">&lt;Layer&gt;: layer-01 #f4f4f4</text>
<rect x="272" y="74" width="190" height="34" fill="#ffffff"/>
<line x1="272" y1="107" x2="462" y2="107" stroke="#8d8d8d" stroke-width="1.5"/>
<text x="282" y="96" font-size="12" font-family="ui-monospace, Menlo, monospace" fill="#1a1a1a">$field → field-02</text>
<rect x="288" y="124" width="376" height="120" fill="#ffffff"/>
<text x="304" y="146" font-size="12" fill="#5a5850">nested &lt;Layer&gt;: layer-02 #ffffff</text>
<rect x="304" y="160" width="190" height="34" fill="#f4f4f4"/>
<line x1="304" y1="193" x2="494" y2="193" stroke="#8d8d8d" stroke-width="1.5"/>
<text x="314" y="182" font-size="12" font-family="ui-monospace, Menlo, monospace" fill="#1a1a1a">$field → field-03</text>
<text x="304" y="226" font-size="12" fill="#1a1a1a">Same component code at every depth</text>
</svg>

The field flips between grey and white as it goes deeper, always the opposite of what is directly behind it, and the component never asks where it is.

Carbon got here by deleting the alternative. Carbon v10 gave components a `light` prop: a `Dropdown` on a grey layer had to be told `light`. The v11 migration guides remove `light` variants and show `<Dropdown light />` becoming `<Layer><Dropdown /></Layer>`: a prop every consumer had to remember became a wrapper the container sets once.

Atlassian ships a lighter version: one dynamic token, `utility.elevation.surface.current`, the current surface colour set by a parent element. Its `Box` primitive publishes a surface background to everything inside, so a component that must match "whatever is behind me" (a fade at the end of a scrolling row, a ring cut out around an avatar) reads it instead of guessing. A May 2024 developer forum thread reports it falling back to the default inside Forge modals and iframes, where the parent's context does not reach. Atlassian also forbids one nesting outright: no sunken surface on a raised or overlay one.

Nest at most two levels in light mode, and make the second alternate back rather than hunting for a colour lighter than white. With three or more levels, or many components that change fill with depth, adopt contextual tokens the Carbon way. **For most teams the rule is shorter: a nested surface takes the other of your two light greys, and the next lighter step in dark.** *Weight: strong* for stepping up in dark, which every system does; *moderate* for alternating in light, which Carbon and Spectrum ship independently.

---

## Components on a tint

A component that draws a light grey part (a track, an empty circle, a field fill) must either be told what it sits on, find out on its own, or use a colour that works on every surface it can land on, and for a small team the third is the one that holds.

Here is the stepper from the opening scene, with illustrative values: upcoming circles and connector at `#e8e8e8`, on the white page and then inside a grey card at `#f0f0f0`.

<svg role="img" viewBox="0 0 720 260" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A four-step setup stepper drawn twice with illustrative neutral values. Left, on a white page: step 1 is complete in blue, step 2 is current with a blue ring, and steps 3 and 4 are upcoming, light grey #e8e8e8 circles joined by a #e8e8e8 line, visible but faint at a contrast of 1.23 to 1 against white. Right, the same stepper inside a grey card of #f0f0f0: the upcoming circles and the line drop to 1.08 to 1 and effectively disappear, leaving the numbers 3 and 4 floating with nothing around them.</title>
<rect x="0" y="0" width="720" height="260" fill="#f7f6f2"/>
<text x="24" y="30" font-size="14" font-weight="600" fill="#1a1a1a">On the white page</text>
<text x="384" y="30" font-size="14" font-weight="600" fill="#1a1a1a">Inside a grey card</text>
<rect x="24" y="44" width="312" height="150" rx="6" fill="#ffffff" stroke="#d6d4cc"/>
<line x1="64" y1="110" x2="296" y2="110" stroke="#e8e8e8" stroke-width="4"/>
<line x1="64" y1="110" x2="141" y2="110" stroke="#1f5fbf" stroke-width="4"/>
<circle cx="64" cy="110" r="16" fill="#1f5fbf"/>
<text x="64" y="115" font-size="13" fill="#ffffff" text-anchor="middle">✓</text>
<circle cx="141" cy="110" r="16" fill="#ffffff" stroke="#1f5fbf" stroke-width="3"/>
<text x="141" y="115" font-size="13" fill="#1f5fbf" text-anchor="middle" font-weight="600">2</text>
<circle cx="218" cy="110" r="16" fill="#e8e8e8"/>
<text x="218" y="115" font-size="13" fill="#525252" text-anchor="middle">3</text>
<circle cx="296" cy="110" r="16" fill="#e8e8e8"/>
<text x="296" y="115" font-size="13" fill="#525252" text-anchor="middle">4</text>
<text x="44" y="170" font-size="12" fill="#5a5850">#e8e8e8 on #ffffff: 1.23:1</text>
<rect x="384" y="44" width="312" height="150" rx="6" fill="#ffffff" stroke="#d6d4cc"/>
<rect x="398" y="58" width="284" height="122" rx="6" fill="#f0f0f0"/>
<line x1="424" y1="110" x2="656" y2="110" stroke="#e8e8e8" stroke-width="4"/>
<line x1="424" y1="110" x2="501" y2="110" stroke="#1f5fbf" stroke-width="4"/>
<circle cx="424" cy="110" r="16" fill="#1f5fbf"/>
<text x="424" y="115" font-size="13" fill="#ffffff" text-anchor="middle">✓</text>
<circle cx="501" cy="110" r="16" fill="#ffffff" stroke="#1f5fbf" stroke-width="3"/>
<text x="501" y="115" font-size="13" fill="#1f5fbf" text-anchor="middle" font-weight="600">2</text>
<circle cx="578" cy="110" r="16" fill="#e8e8e8"/>
<text x="578" y="115" font-size="13" fill="#525252" text-anchor="middle">3</text>
<circle cx="656" cy="110" r="16" fill="#e8e8e8"/>
<text x="656" y="115" font-size="13" fill="#525252" text-anchor="middle">4</text>
<text x="412" y="170" font-size="12" fill="#b5501f">#e8e8e8 on #f0f0f0: 1.08:1</text>
<text x="24" y="226" font-size="12" fill="#5a5850">Same component, same tokens. Only the background behind it changed.</text>
</svg>

On white the upcoming steps are faint; on the card they are gone. A contrast of 1.08:1 is below what anyone can see on an ordinary screen.

The stepper's grey was chosen to be one step darker than white, so it encodes an assumption about its background. Put it on a background that is itself one step darker than white, and the two meet. Every light-grey fill in a library carries the same assumption: switch tracks, slider rails, empty progress bars, skeleton blocks, secondary buttons, filled text fields. And the defect was there on white too: at 1.23:1 the upcoming circles already failed the 3:1 that [WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) asks of a graphic needed to understand state. The grey card only made it visible.

There are three ways out, and shipping systems use all three.

<svg role="img" viewBox="0 0 720 330" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Three fixes for the stepper inside a grey #f0f0f0 card, with illustrative values. One, a variant prop: the designer sets surface to tinted on the stepper, and the upcoming circles switch to white with a #c6c6c6 line; it works, but only if someone remembers to set it on every instance. Two, mode inheritance: the card frame sets a Surface variable mode to Raised and the stepper, left on Auto, resolves its track and circle tokens to the raised values; nobody touches the stepper. Three, a fixed-contrast role: the upcoming circles are white with a #767676 ring and the line is black at 10 percent; the ring measures 3.99 to 1 on the card and 4.54 to 1 on white, so the same stepper works on both without knowing where it is.</title>
<rect x="0" y="0" width="720" height="330" fill="#f7f6f2"/>
<text x="16" y="28" font-size="13" font-weight="600" fill="#1a1a1a">1. Variant prop</text>
<text x="256" y="28" font-size="13" font-weight="600" fill="#1a1a1a">2. Mode inheritance</text>
<text x="496" y="28" font-size="13" font-weight="600" fill="#1a1a1a">3. Fixed-contrast role</text>
<rect x="16" y="40" width="208" height="130" rx="6" fill="#f0f0f0"/>
<line x1="40" y1="100" x2="200" y2="100" stroke="#c6c6c6" stroke-width="4"/>
<line x1="40" y1="100" x2="93" y2="100" stroke="#1f5fbf" stroke-width="4"/>
<circle cx="40" cy="100" r="13" fill="#1f5fbf"/>
<circle cx="93" cy="100" r="13" fill="#ffffff" stroke="#1f5fbf" stroke-width="3"/>
<circle cx="147" cy="100" r="13" fill="#ffffff"/>
<text x="147" y="105" font-size="12" fill="#525252" text-anchor="middle">3</text>
<circle cx="200" cy="100" r="13" fill="#ffffff"/>
<text x="200" y="105" font-size="12" fill="#525252" text-anchor="middle">4</text>
<text x="28" y="146" font-size="11" font-family="ui-monospace, Menlo, monospace" fill="#b5501f">surface="tinted"</text>
<rect x="256" y="40" width="208" height="130" rx="6" fill="#f0f0f0"/>
<line x1="280" y1="100" x2="440" y2="100" stroke="#c6c6c6" stroke-width="4"/>
<line x1="280" y1="100" x2="333" y2="100" stroke="#1f5fbf" stroke-width="4"/>
<circle cx="280" cy="100" r="13" fill="#1f5fbf"/>
<circle cx="333" cy="100" r="13" fill="#ffffff" stroke="#1f5fbf" stroke-width="3"/>
<circle cx="387" cy="100" r="13" fill="#ffffff"/>
<text x="387" y="105" font-size="12" fill="#525252" text-anchor="middle">3</text>
<circle cx="440" cy="100" r="13" fill="#ffffff"/>
<text x="440" y="105" font-size="12" fill="#525252" text-anchor="middle">4</text>
<text x="268" y="58" font-size="11" fill="#1f5fbf">card: Surface mode = Raised</text>
<text x="268" y="146" font-size="11" fill="#1f5fbf">stepper: Auto</text>
<rect x="496" y="40" width="208" height="130" rx="6" fill="#f0f0f0"/>
<line x1="520" y1="100" x2="680" y2="100" stroke="#000000" stroke-opacity="0.1" stroke-width="4"/>
<line x1="520" y1="100" x2="573" y2="100" stroke="#1f5fbf" stroke-width="4"/>
<circle cx="520" cy="100" r="13" fill="#1f5fbf"/>
<circle cx="573" cy="100" r="13" fill="#ffffff" stroke="#1f5fbf" stroke-width="3"/>
<circle cx="627" cy="100" r="13" fill="#ffffff" stroke="#767676" stroke-width="1.5"/>
<text x="627" y="105" font-size="12" fill="#525252" text-anchor="middle">3</text>
<circle cx="680" cy="100" r="13" fill="#ffffff" stroke="#767676" stroke-width="1.5"/>
<text x="680" y="105" font-size="12" fill="#525252" text-anchor="middle">4</text>
<text x="508" y="146" font-size="11" fill="#5a5850">ring #767676: 3.99:1 here,</text>
<text x="508" y="160" font-size="11" fill="#5a5850">4.54:1 on white</text>
<text x="16" y="200" font-size="12" fill="#1a1a1a">Someone sets it on</text>
<text x="16" y="216" font-size="12" fill="#1a1a1a">every instance.</text>
<text x="16" y="240" font-size="12" fill="#5a5850">Fluent appearance,</text>
<text x="16" y="256" font-size="12" fill="#5a5850">Carbon v10 light prop</text>
<text x="256" y="200" font-size="12" fill="#1a1a1a">The container sets it once;</text>
<text x="256" y="216" font-size="12" fill="#1a1a1a">children inherit.</text>
<text x="256" y="240" font-size="12" fill="#5a5850">Carbon Layer, Atlassian</text>
<text x="256" y="256" font-size="12" fill="#5a5850">surface.current, Figma Auto</text>
<text x="496" y="200" font-size="12" fill="#1a1a1a">One value that reads on</text>
<text x="496" y="216" font-size="12" fill="#1a1a1a">every surface it can meet.</text>
<text x="496" y="240" font-size="12" fill="#5a5850">Carbon toggle-off, Primer</text>
<text x="496" y="256" font-size="12" fill="#5a5850">progress track, alpha neutrals</text>
<text x="16" y="306" font-size="12" fill="#5a5850">All values illustrative except the ratios, which are computed for the drawn colours.</text>
</svg>

The first two reach the same colours; the difference is who does the work. The third trades a fill for an outline that survives anywhere.

**A variant prop.** The component gets a property naming the surface it sits on. Fluent's `Input` has `appearance` values `filled-darker` and `filled-lighter`, and its story warns that a filled input needs more than 3:1 against the colour immediately around it; Fluent's `Card` has `filled` and `filled-alternative`. In Figma it is an ordinary variant axis, so it is the easiest to build. The cost is that every placement is a decision someone can forget, and the axis multiplies the variant count. It is what Carbon shipped as v10's `light` prop and removed in v11.

**Mode inheritance.** The container announces its level and the component's tokens resolve against it: Carbon's `Layer`, Atlassian's `surface.current`, or in Figma a variable collection, say "Surface", with one mode per level. Figma's help page on modes says objects default to Auto and take their parent's mode, so a card whose frame is set to Raised hands that mode to every stepper, field and toggle inside it. The cost is the setup: a collection, a mode per level, every container set to its mode, and code that does the same, or the file and the build disagree.

**A fixed-contrast role.** The part that vanished gets a colour that does not depend on the surface. Carbon's `toggleOff` is one value, `#8d8d8d`, in both light themes; Primer's `progressBar-track-bgColor` is `borderColor-default`, a border colour. Material 3's slider draws its inactive track in `secondary-container`, from the accent palette, so it never coincides with a neutral surface. Or the part takes a translucent neutral, an alpha step that darkens whatever it sits on (the alpha tokens Atlassian, Primer and Radix ship are in [materials and translucency](materials-and-translucency.md#alpha-ramps)). Here is what translucency buys, computed for two solid greys and two black alphas.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Contrast ratios computed for four track colours on two backgrounds, white #ffffff and grey #f0f0f0. A solid #e8e8e8 measures 1.23 to 1 on white and 1.08 to 1 on grey. Black at 10 percent opacity composites to #e6e6e6 on white and #d8d8d8 on grey and measures 1.25 to 1 on both. A solid #8d8d8d measures 3.32 to 1 on white and 2.91 to 1 on grey, failing the 3 to 1 non-text contrast minimum on grey. Black at 50 percent measures 3.95 to 1 on white and 3.87 to 1 on grey, passing on both. A translucent fill keeps nearly the same ratio on any light surface; a solid one loses contrast as the surface darkens toward it.</title>
<rect x="0" y="0" width="720" height="300" fill="#f7f6f2"/>
<text x="200" y="32" font-size="13" font-weight="600" fill="#1a1a1a">on #ffffff</text>
<text x="420" y="32" font-size="13" font-weight="600" fill="#1a1a1a">on #f0f0f0</text>
<text x="24" y="74" font-size="12" fill="#1a1a1a">solid #e8e8e8</text>
<rect x="200" y="50" width="180" height="44" fill="#ffffff" stroke="#d6d4cc"/>
<rect x="216" y="64" width="80" height="16" rx="8" fill="#e8e8e8"/>
<text x="308" y="77" font-size="12" fill="#1a1a1a">1.23:1</text>
<rect x="420" y="50" width="180" height="44" fill="#f0f0f0"/>
<rect x="436" y="64" width="80" height="16" rx="8" fill="#e8e8e8"/>
<text x="528" y="77" font-size="12" fill="#b5501f">1.08:1</text>
<text x="24" y="130" font-size="12" fill="#1a1a1a">black at 10%</text>
<rect x="200" y="106" width="180" height="44" fill="#ffffff" stroke="#d6d4cc"/>
<rect x="216" y="120" width="80" height="16" rx="8" fill="#000000" fill-opacity="0.1"/>
<text x="308" y="133" font-size="12" fill="#1a1a1a">1.25:1</text>
<rect x="420" y="106" width="180" height="44" fill="#f0f0f0"/>
<rect x="436" y="120" width="80" height="16" rx="8" fill="#000000" fill-opacity="0.1"/>
<text x="528" y="133" font-size="12" fill="#1a1a1a">1.25:1</text>
<text x="24" y="186" font-size="12" fill="#1a1a1a">solid #8d8d8d</text>
<rect x="200" y="162" width="180" height="44" fill="#ffffff" stroke="#d6d4cc"/>
<rect x="216" y="176" width="80" height="16" rx="8" fill="#8d8d8d"/>
<text x="308" y="189" font-size="12" fill="#1a1a1a">3.32:1</text>
<rect x="420" y="162" width="180" height="44" fill="#f0f0f0"/>
<rect x="436" y="176" width="80" height="16" rx="8" fill="#8d8d8d"/>
<text x="528" y="189" font-size="12" fill="#b5501f">2.91:1</text>
<text x="24" y="242" font-size="12" fill="#1a1a1a">black at 50%</text>
<rect x="200" y="218" width="180" height="44" fill="#ffffff" stroke="#d6d4cc"/>
<rect x="216" y="232" width="80" height="16" rx="8" fill="#000000" fill-opacity="0.5"/>
<text x="308" y="245" font-size="12" fill="#1a1a1a">3.95:1</text>
<rect x="420" y="218" width="180" height="44" fill="#f0f0f0"/>
<rect x="436" y="232" width="80" height="16" rx="8" fill="#000000" fill-opacity="0.5"/>
<text x="528" y="245" font-size="12" fill="#1a1a1a">3.87:1</text>
<text x="24" y="286" font-size="12" fill="#5a5850">3:1 is the WCAG 1.4.11 minimum for a graphic that shows state.</text>
</svg>

The solid greys lose contrast as the surface darkens toward them; the alphas hold almost exactly. A solid `#8d8d8d` passes 3:1 on white and fails on the card, which is why a fixed colour has to be measured against the greyest light layer, not the whitest. Translucency has traps of its own: it needs a white alpha in dark mode, since black at 10% does nothing on a near-black page; over a brand colour or a photo it tints; and stacked alphas add up, so keep them to leaf components.

For a small team, take the fixed-contrast role. Give every part that must stay visible (a track, an empty circle, a control's outline) a colour measured at 3:1 against the darkest light surface it can land on, and against the lightest dark one; draw empty states as outlines; and use one translucent neutral, with a light and a dark value, for subtle fills such as hover, skeletons and secondary buttons. **Measure each light-grey part against the greyest surface in your system, not the white one, and the stepper never disappears.** *Weight: moderate.* It is judgement backed by Primer's and Carbon's choices, and the 3:1 is WCAG's. Reach for mode inheritance only with three or more surface levels in real use or a component whose whole fill changes with depth, such as a filled field. Avoid the variant prop beyond a handful of components: Carbon tried it first and deleted it.

---

## Hover and pressed per level

Each surface level needs a hover and a pressed colour that differs from its own rest colour, and the two ways to get there are a solid step per level (Atlassian, Fluent) or one translucent overlay for all levels (Carbon's `background-hover`, Polaris in dark).

A list row on the page highlights on hover. Move the same list into a menu, a level higher, and the row's hover colour may now be the menu's own background, so hovering does nothing visible. Atlassian ships the per-level answer most completely: `elevation.surface`, `.raised` and `.overlay` each come with `.hovered` and `.pressed`. Here are the values from `@atlaskit/tokens` 20.11.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>Atlassian's rest, hovered and pressed values for three surface levels, from its token package. In light, surface, raised and overlay all rest at #FFFFFF, hover at #F0F1F2 and press at #DDDEE1, identical across levels. In dark, surface rests at #1F1F21, hovers at #242528 and presses at #2B2C2F; raised rests at #242528, hovers at #2B2C2F and presses at #303134; overlay rests at #2B2C2F, hovers at #303134 and presses at #3D3F43. In dark, each level's hover colour is exactly the next level's rest colour.</title>
<rect x="0" y="0" width="720" height="300" fill="#f7f6f2"/>
<text x="24" y="28" font-size="13" font-weight="600" fill="#1a1a1a">Light</text>
<text x="120" y="28" font-size="12" fill="#5a5850">rest</text>
<text x="230" y="28" font-size="12" fill="#5a5850">hovered</text>
<text x="340" y="28" font-size="12" fill="#5a5850">pressed</text>
<text x="24" y="58" font-size="12" fill="#1a1a1a">all three</text>
<rect x="120" y="38" width="100" height="32" fill="#FFFFFF" stroke="#d6d4cc"/>
<text x="130" y="58" font-size="11" fill="#1a1a1a">#FFFFFF</text>
<rect x="230" y="38" width="100" height="32" fill="#F0F1F2"/>
<text x="240" y="58" font-size="11" fill="#1a1a1a">#F0F1F2</text>
<rect x="340" y="38" width="100" height="32" fill="#DDDEE1"/>
<text x="350" y="58" font-size="11" fill="#1a1a1a">#DDDEE1</text>
<text x="24" y="108" font-size="13" font-weight="600" fill="#1a1a1a">Dark</text>
<text x="24" y="140" font-size="12" fill="#1a1a1a">surface</text>
<rect x="120" y="120" width="100" height="32" fill="#1F1F21"/>
<text x="130" y="140" font-size="11" fill="#f4f4f4">#1F1F21</text>
<rect x="230" y="120" width="100" height="32" fill="#242528"/>
<text x="240" y="140" font-size="11" fill="#f4f4f4">#242528</text>
<rect x="340" y="120" width="100" height="32" fill="#2B2C2F"/>
<text x="350" y="140" font-size="11" fill="#f4f4f4">#2B2C2F</text>
<text x="24" y="190" font-size="12" fill="#1a1a1a">raised</text>
<rect x="120" y="170" width="100" height="32" fill="#242528"/>
<text x="130" y="190" font-size="11" fill="#f4f4f4">#242528</text>
<rect x="230" y="170" width="100" height="32" fill="#2B2C2F"/>
<text x="240" y="190" font-size="11" fill="#f4f4f4">#2B2C2F</text>
<rect x="340" y="170" width="100" height="32" fill="#303134"/>
<text x="350" y="190" font-size="11" fill="#f4f4f4">#303134</text>
<text x="24" y="240" font-size="12" fill="#1a1a1a">overlay</text>
<rect x="120" y="220" width="100" height="32" fill="#2B2C2F"/>
<text x="130" y="240" font-size="11" fill="#f4f4f4">#2B2C2F</text>
<rect x="230" y="220" width="100" height="32" fill="#303134"/>
<text x="240" y="240" font-size="11" fill="#f4f4f4">#303134</text>
<rect x="340" y="220" width="100" height="32" fill="#3D3F43"/>
<text x="350" y="240" font-size="11" fill="#f4f4f4">#3D3F43</text>
<path d="M280 154 L170 168" stroke="#b5501f" stroke-width="1.5" fill="none"/>
<path d="M280 204 L170 218" stroke="#b5501f" stroke-width="1.5" fill="none"/>
<text x="470" y="160" font-size="12" fill="#b5501f">surface.hovered = raised</text>
<text x="470" y="210" font-size="12" fill="#b5501f">raised.hovered = overlay</text>
<text x="24" y="284" font-size="12" fill="#5a5850">Light: one hover for every level. Dark: hover lands on the next level up.</text>
</svg>

In light, Atlassian needs no per-level hover, because all three levels are the same white. In dark, each level's hover is the next level's rest colour, so the per-level tokens are one ladder read one rung up. That has a consequence: a hovered row on the dark page is the same colour as a resting card, so on a board of cards a hovered empty area could read as a card.

The translucent version avoids the bookkeeping. Carbon's `background-hover` is `rgba(141, 141, 141, 0.12)` in light and `0.16` in dark, the same token over any layer. Polaris's experimental dark theme does the same: `bg-surface-secondary-hover` is white at 6% and `-active` white at 14%. A translucent hover always reads as "a bit darker than here", which is exactly what a hover is.

**If you already have a translucent neutral from the stepper fix, make it your hover too: one token, any level.** Use solid per-level values only if your levels have room between them for a hover step, which in light mode they usually don't. *Weight: strong* that each level needs a hover; *contested* between solid and translucent, a genuine split between systems.

---

## Inverse surfaces

An inverse surface is a separate role, dark on a light page and light on a dark one, kept for the few short messages that must sit above everything, typically the snackbar and the plain tooltip.

The settings screen saves, and a confirmation appears. At the overlay level it would be a white box on a white page, like the menu that just closed; inverse, it is a dark bar no one can miss.

<svg role="img" viewBox="0 0 720 270" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>The inverse surface role on a light page and on a dark page, with illustrative neutral values. Left, a white page with a white card; a tooltip reading Copied and a snackbar reading Settings saved, with an Undo action, are both dark #303030 with light text. Right, a dark page of #161616 with a #262626 card; the same tooltip and snackbar are light #e6e6e6 with dark text. In each theme the inverse surface is the opposite end of the neutral ramp from the page, not a fifth elevation level.</title>
<rect x="0" y="0" width="720" height="270" fill="#f7f6f2"/>
<text x="24" y="28" font-size="13" font-weight="600" fill="#1a1a1a">Light theme</text>
<text x="384" y="28" font-size="13" font-weight="600" fill="#1a1a1a">Dark theme</text>
<rect x="24" y="40" width="312" height="210" rx="6" fill="#ffffff" stroke="#d6d4cc"/>
<rect x="44" y="60" width="272" height="80" rx="6" fill="#ffffff" stroke="#e0e0e0"/>
<rect x="60" y="78" width="100" height="9" rx="2" fill="#5a5850"/>
<rect x="60" y="96" width="200" height="7" rx="2" fill="#b9b6ac"/>
<rect x="196" y="112" width="74" height="24" rx="4" fill="#303030"/>
<text x="233" y="128" font-size="11" fill="#f4f4f4" text-anchor="middle">Copied</text>
<rect x="44" y="196" width="272" height="40" rx="6" fill="#303030"/>
<text x="60" y="221" font-size="12" fill="#f4f4f4">Settings saved</text>
<text x="300" y="221" font-size="12" fill="#a8c7fa" text-anchor="end" font-weight="600">Undo</text>
<rect x="384" y="40" width="312" height="210" rx="6" fill="#161616"/>
<rect x="404" y="60" width="272" height="80" rx="6" fill="#262626"/>
<rect x="420" y="78" width="100" height="9" rx="2" fill="#c6c6c6"/>
<rect x="420" y="96" width="200" height="7" rx="2" fill="#6f6f6f"/>
<rect x="556" y="112" width="74" height="24" rx="4" fill="#e6e6e6"/>
<text x="593" y="128" font-size="11" fill="#1a1a1a" text-anchor="middle">Copied</text>
<rect x="404" y="196" width="272" height="40" rx="6" fill="#e6e6e6"/>
<text x="420" y="221" font-size="12" fill="#1a1a1a">Settings saved</text>
<text x="660" y="221" font-size="12" fill="#1f5fbf" text-anchor="end" font-weight="600">Undo</text>
</svg>

The tooltip and the snackbar flip with the theme while everything else keeps its place: inverse means the far end of the ramp from the page.

Every system read ships the role. Material 3's plain tooltip and snackbar take `inverse-surface`, with `inverse-on-surface` for text and `inverse-primary` for the action. Carbon has `background-inverse` (`#393939` in its light themes, `#f4f4f4` in its dark ones). Primer's `tooltip-bgColor` is `bgColor-emphasis`, `#25292e` in light. Polaris has `bg-surface-inverse`, Fluent `colorNeutralBackgroundInverted`, and Ant Design `colorBgSpotlight`, used only for the tooltip.

Two traps come with it. An "Undo" link in the brand blue is often unreadable on `#303030`, which is why Material ships `inverse-primary`. And once an inverse surface exists it spreads to banners and promos, and a page with three has no loudest element.

Keep inverse to the plain tooltip and the snackbar or toast, give it its own text and action tokens, and measure the action colour against it in both themes. **Inverse is a role, not a level: it never stacks, never nests and never gets a hover ladder.** *Weight: strong.* Every system read ships it; the rich tooltip, which holds a title and actions, goes back to an ordinary overlay (Material puts it on `surface-container`).

---

## Which level overlays take

Everything that floats takes the overlay level in most systems, and only Material splits floating things across its containers by how far forward they sit; the reliable distinctions are inverse for plain tooltips and snackbars, and a scrim behind anything modal.

The settings screen opens a menu, a date popover, a bottom sheet on mobile and a "Delete plan?" dialog. Which background does each take? Here is the map from Material 3's Compose token files, Atlassian's token descriptions and Ant Design's theme docs.

<svg role="img" viewBox="0 0 720 380" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A map of which surface each floating component takes in three systems. Material 3: the page is surface at level 0; a modal bottom sheet and a modal navigation drawer take surface-container-low at level 1; a menu and a rich tooltip take surface-container at level 2; a dialog takes surface-container-high at level 3; the plain tooltip and the snackbar take inverse-surface. Atlassian: the page is elevation.surface; modals, dialogs, dropdown menus, floating toolbars, flags and inline dialogs all take elevation.surface.overlay, as does a card being dragged; raised is kept for movable cards. Ant Design: the page is colorBgLayout; containers take colorBgContainer; modals, popups and menus take colorBgElevated; the tooltip takes colorBgSpotlight. Material ladders its floating components; Atlassian and Ant Design put them all on one overlay level and keep the inverse role for tooltips.</title>
<rect x="0" y="0" width="720" height="380" fill="#f7f6f2"/>
<text x="24" y="30" font-size="13" font-weight="600" fill="#1a1a1a">Component</text>
<text x="190" y="30" font-size="13" font-weight="600" fill="#1a1a1a">Material 3</text>
<text x="400" y="30" font-size="13" font-weight="600" fill="#1a1a1a">Atlassian</text>
<text x="570" y="30" font-size="13" font-weight="600" fill="#1a1a1a">Ant Design</text>
<line x1="24" y1="42" x2="696" y2="42" stroke="#b9b6ac"/>
<g font-size="11" font-family="ui-monospace, Menlo, monospace">
<text x="24" y="70" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Page</text>
<rect x="186" y="54" width="196" height="24" rx="4" fill="#ffffff" stroke="#d6d4cc"/>
<text x="194" y="70" fill="#1a1a1a">surface · L0</text>
<rect x="396" y="54" width="160" height="24" rx="4" fill="#ffffff" stroke="#d6d4cc"/>
<text x="404" y="70" fill="#1a1a1a">surface</text>
<rect x="566" y="54" width="130" height="24" rx="4" fill="#ececec"/>
<text x="574" y="70" fill="#1a1a1a">colorBgLayout</text>
<text x="24" y="110" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Card</text>
<rect x="186" y="94" width="196" height="24" rx="4" fill="#f3f3f3"/>
<text x="194" y="110" fill="#1a1a1a">container-low · L1</text>
<rect x="396" y="94" width="160" height="24" rx="4" fill="#ffffff" stroke="#d6d4cc"/>
<text x="404" y="110" fill="#1a1a1a">surface / raised</text>
<rect x="566" y="94" width="130" height="24" rx="4" fill="#ffffff" stroke="#d6d4cc"/>
<text x="574" y="110" fill="#1a1a1a">colorBgContainer</text>
<text x="24" y="150" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Sheet, drawer</text>
<rect x="186" y="134" width="196" height="24" rx="4" fill="#f3f3f3"/>
<text x="194" y="150" fill="#1a1a1a">container-low · L1</text>
<text x="404" y="150" fill="#8a877e">not checked</text>
<text x="574" y="150" fill="#8a877e">not checked</text>
<text x="24" y="190" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Menu, popover</text>
<rect x="186" y="174" width="196" height="24" rx="4" fill="#eeeeee"/>
<text x="194" y="190" fill="#1a1a1a">container · L2</text>
<rect x="396" y="174" width="160" height="24" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="1.5"/>
<text x="404" y="190" fill="#1f5fbf">overlay</text>
<rect x="566" y="174" width="130" height="24" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="1.5"/>
<text x="574" y="190" fill="#1f5fbf">colorBgElevated</text>
<text x="24" y="230" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Dialog</text>
<rect x="186" y="214" width="196" height="24" rx="4" fill="#e8e8e8"/>
<text x="194" y="230" fill="#1a1a1a">container-high · L3</text>
<rect x="396" y="214" width="160" height="24" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="1.5"/>
<text x="404" y="230" fill="#1f5fbf">overlay</text>
<rect x="566" y="214" width="130" height="24" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="1.5"/>
<text x="574" y="230" fill="#1f5fbf">colorBgElevated</text>
<text x="24" y="270" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Plain tooltip</text>
<rect x="186" y="254" width="196" height="24" rx="4" fill="#303030"/>
<text x="194" y="270" fill="#f4f4f4">inverse-surface</text>
<text x="404" y="270" fill="#8a877e">not checked</text>
<rect x="566" y="254" width="130" height="24" rx="4" fill="#303030"/>
<text x="574" y="270" fill="#f4f4f4">colorBgSpotlight</text>
<text x="24" y="310" font-family="system-ui, sans-serif" font-size="12" fill="#1a1a1a">Snackbar, flag</text>
<rect x="186" y="294" width="196" height="24" rx="4" fill="#303030"/>
<text x="194" y="310" fill="#f4f4f4">inverse-surface · L3</text>
<rect x="396" y="294" width="160" height="24" rx="4" fill="#ffffff" stroke="#1f5fbf" stroke-width="1.5"/>
<text x="404" y="310" fill="#1f5fbf">overlay</text>
<text x="574" y="310" fill="#8a877e">not checked</text>
</g>
<text x="24" y="352" font-size="12" fill="#5a5850">Chip fills are illustrative; names are the shipped tokens. Blue outline: the system's one overlay level.</text>
</svg>

Material climbs a ladder: sheet, then menu, then dialog, each one container darker in light. Atlassian and Ant Design put every floating thing on one level and let the shadow say how far forward it is.

The difference matters less than it looks. In light Atlassian's overlay is white, the same as its page, and the dialog is told apart by its shadow and scrim, never its fill; Atlassian's elevation page says overlays can stack on other overlays, which one level handles without any rule about order. Material's steps are a tone or two apart, and a menu opened inside a dialog lands on a darker container than the dialog under it ([surfaces in dark mode](surfaces-in-dark-mode.md#tint-overlays-to-containers) works that case through). In dark, Apple gives a floating thing one "elevated" set, not a ladder.

Two rules hold across all three systems:

- **Anything modal gets a scrim**, a separate token from the overlay surface (Material's `scrim`, Atlassian's `blanket`, Carbon's `overlay`, Polaris's `backdrop-bg`).
- **A sheet or drawer that lies over the page is an overlay; one docked beside it is page chrome.** Material's standard navigation drawer is `surface`; its modal one is `surface-container-low`.

**Use one overlay fill for menus, popovers, sheets and dialogs; inverse for the plain tooltip and the toast; a scrim behind anything modal.** *Weight: moderate.* The single level is what Atlassian, Ant Design, Primer and Radix ship and what the toolkit's knowledge base sets; Material's ladder is a defensible alternative where the theme is generated tonally. The scrim is consensus.

---

## Headers that lift on scroll

A header that sits flat at the top of a page should take a raised fill or a shadow once content scrolls under it, because at that moment it has become a surface over another surface.

Scroll the settings page and the "Plan" card slides under a header the same colour as the page, so the header looks like a hole in the card. Here is the header at rest and scrolled, with Material 3's app bar token values.

<svg role="img" viewBox="0 0 720 300" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;margin:2em 0" font-family="system-ui, sans-serif">
<title>A top app bar at rest and after scrolling, following Material 3's app bar tokens, with illustrative neutral fills. Left, at rest: the bar takes the page colour, surface, at elevation level 0, and nothing separates it from the page; the first card sits below it. Right, scrolled: the card has slid up under the bar, and the bar has switched to surface-container, one step darker, at elevation level 2, with a shadow edge, so the cut-off card reads as passing beneath it. iOS does the equivalent with the navigation bar's scroll edge appearance, transparent at the top and a material once content scrolls under.</title>
<rect x="0" y="0" width="720" height="300" fill="#f7f6f2"/>
<text x="24" y="28" font-size="13" font-weight="600" fill="#1a1a1a">At rest: surface, level 0</text>
<text x="384" y="28" font-size="13" font-weight="600" fill="#1a1a1a">Scrolled: surface-container, level 2</text>
<rect x="24" y="40" width="312" height="240" rx="6" fill="#fafafa" stroke="#d6d4cc"/>
<rect x="25" y="41" width="310" height="52" fill="#fafafa"/>
<text x="44" y="73" font-size="15" font-weight="600" fill="#1a1a1a">Settings</text>
<rect x="44" y="110" width="272" height="80" rx="8" fill="#ffffff" stroke="#e0e0e0"/>
<rect x="60" y="128" width="80" height="9" rx="2" fill="#5a5850"/>
<rect x="60" y="148" width="200" height="7" rx="2" fill="#b9b6ac"/>
<rect x="44" y="204" width="272" height="60" rx="8" fill="#ffffff" stroke="#e0e0e0"/>
<rect x="384" y="40" width="312" height="240" rx="6" fill="#fafafa" stroke="#d6d4cc"/>
<rect x="404" y="60" width="272" height="80" rx="8" fill="#ffffff" stroke="#e0e0e0"/>
<rect x="420" y="112" width="200" height="7" rx="2" fill="#b9b6ac"/>
<rect x="404" y="154" width="272" height="80" rx="8" fill="#ffffff" stroke="#e0e0e0"/>
<rect x="420" y="172" width="80" height="9" rx="2" fill="#5a5850"/>
<rect x="420" y="192" width="200" height="7" rx="2" fill="#b9b6ac"/>
<rect x="385" y="93" width="310" height="4" fill="#000000" fill-opacity="0.08"/>
<rect x="385" y="41" width="310" height="52" fill="#ececec"/>
<text x="404" y="73" font-size="15" font-weight="600" fill="#1a1a1a">Settings</text>
<text x="404" y="262" font-size="12" fill="#5a5850">The card slides under the raised bar.</text>
</svg>

At rest the bar is part of the page; scrolled, it is a surface with an edge, and the card reads as passing beneath it.

Material ships this as tokens: its app bar sets `ContainerColor` to `Surface` at `Level0` and `OnScrollContainerColor` to `SurfaceContainer` at `Level2`. UIKit does the same: a navigation bar's `scrollEdgeAppearance` applies while the content's edge is aligned with the bar, and the standard appearance takes over once content scrolls beneath, for every navigation bar since iOS 15.

Two traps: a static frame shows only the rest state, so the scrolled one ships as a guess; and a permanent lift, with nothing under it, floats over empty space. **A sticky header changes level when content scrolls under it, and the design file needs a frame for each state.** The hand-off note should say whether code uses a scroll listener or a scroll-driven style. *Weight: strong.* Material and Apple reach it independently.

---

## Cheat sheet

| Situation | Do | Don't |
|---|---|---|
| Naming the levels | Role names (`page`, `raised`, `overlay`, `sunken`); a numbered set underneath only if code computes nesting | Borrow "surface" or "overlay" without checking which column it meant |
| Polarity | One choice for the product, written as a sentence | Grey page on one screen, white on the next |
| A surface inside a surface | Light: alternate back to the other grey. Dark: one step lighter | Hunt for a colour lighter than white |
| Sunken inside a card or menu | Never; wells sit on the page | Nest a well in a raised surface |
| A light-grey part in a component | Measure it at 3:1 against your greyest light surface; outline empty states | Choose it against white only |
| Subtle fills and hover | One translucent neutral, light and dark value, on any level | A solid grey per surface |
| Many levels, many components | Contextual tokens, or a Figma "Surface" mode on the container, children on Auto | A `light` or `onTinted` prop on every component |
| Snackbar, plain tooltip | Inverse role with its own text and action tokens | Inverse for banners and promos |
| Menus, popovers, sheets, dialogs | One overlay fill; shadow and scrim do the rest | A ladder of near-identical greys |
| Sticky header | Page colour at rest; raised fill and edge once scrolled; both drawn | A permanent shadow, or one frame only |

---

## The short version

Systems name their backgrounds by position (`layer-01`) or by role (`surface-container`, `elevation.surface.raised`), and "surface" and "overlay" mean different things in different systems. Name your levels by role and write down what each word covers.

Grey page with white cards and white page with grey wells both ship at scale; Carbon ships both. Choose once, by where your densest content lives, and record it. Nest by stepping one lighter in dark and alternating back to the other grey in light, as Carbon and Spectrum do independently. Keep sunken wells on the page.

The hard part is components on a tinted surface: a stepper whose grey circles vanish on a grey card. A variant prop works but every instance needs it, and Carbon deleted its version. Mode inheritance (Carbon's `Layer`, Atlassian's `surface.current`, a Figma mode on the card inherited through Auto) is the most robust and costs a collection and code to match. For a small team, measure every part that must stay visible at 3:1 against your greyest surface, draw empty states as outlines, and use one translucent neutral for subtle fills and hover.

Floating components take one overlay fill, with a scrim behind anything modal; the plain tooltip and snackbar take the inverse role with its own action colour. A sticky header lifts to the raised fill when content scrolls under it, and the file draws both states. Tell the people building it which parts are strong (the dark step, the scrim, inverse, the scroll lift) and which are your calls.

---

## What to re-check later

Researched 12 November 2026.

- **Token values** were read from the package versions named in the sources, and Material 3's Compose token sources on `main`.
- **Atlassian's surface hex values** have moved: light `surface-sunken` is now `#F8F8F8` and dark `surface` `#1F1F21`; documents quoting `#F7F8F9` or `#1D2125` describe an earlier palette.
- **Atlassian `surface.current`**: the Forge modal and iframe bug is from a May 2024 forum thread with no staff reply; its current status is unchecked.
- **Not checked**: Apple's grouped background hex values, Ant Design's drawer and message backgrounds, and Carbon's popover and modal backgrounds (hence "not named" in the naming figure).
- **Fluent's 3:1 note** comes from a Storybook story description, not the Fluent 2 website.
- **Material 3's documentation site** did not render for automated reading; every Material value comes from the Compose token files and `material-web`'s generated Sass, where `surface-tint` is marked deprecated. The date of Material's surface change rests on the Compose release notes (roles added in 1.2.0-alpha03, 21 June 2023); the month of Material's own blog post is unchecked.
- **Figma's Auto mode** behaviour is from Figma's help page; the stepper built that way was not tested in a file.
- **Evidence quality.** Everything is adoption evidence: shipped tokens first, then two migrations (Carbon's `light` prop, Material's surface tint), then documentation. No user research on surface polarity, nesting or hover was found; WCAG 1.4.11's 3:1 is the one user-outcome standard that applies. Light alternation (Carbon, Spectrum) and the scroll lift (Material, Apple) are independent convergences; the dark step-up is partly one idea spreading from Apple and Material 2 (dates unchecked).

---

## Sources

**Primary: system source, tokens and documentation**

- [Carbon, colour usage: layering, contextual tokens, inline theming](https://carbondesignsystem.com/elements/color/usage/)
- [Carbon, v11 design migration guide](https://carbondesignsystem.com/migrating/guide/design) and its [source](https://github.com/carbon-design-system/carbon-website/blob/main/src/pages/migrating/guide/design.mdx). Removal of `light` variants.
- [Carbon, v11 develop migration guide](https://carbondesignsystem.com/migrating/guide/develop). `<Dropdown light />` to `<Layer><Dropdown /></Layer>`.
- [`@carbon/themes` 11.85.0, `lib/index.js`](https://cdn.jsdelivr.net/npm/@carbon/themes@11.85.0/lib/index.js)
- [Atlassian, elevation](https://atlassian.design/foundations/elevation)
- [`@atlaskit/tokens` 20.11.0, light theme](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.11.0/dist/cjs/artifacts/themes/atlassian-light.js), [dark theme](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.11.0/dist/cjs/artifacts/themes/atlassian-dark.js), [raw tokens with descriptions](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.11.0/dist/cjs/artifacts/tokens-raw/atlassian-light.js) and [token names](https://cdn.jsdelivr.net/npm/@atlaskit/tokens@20.11.0/dist/cjs/artifacts/token-names.js)
- [`@atlaskit/primitives` 22.7.1, `box.js`](https://cdn.jsdelivr.net/npm/@atlaskit/primitives@22.7.1/dist/cjs/components/box.js)
- [Atlassian developer community, `--elevation-surface-current` in Forge modals](https://community.developer.atlassian.com/t/token-elevation-surface-current-is-not-properly-set-within-forge-modal/80237)
- [Material Web, `_md-sys-color.scss`](https://github.com/material-components/material-web/blob/main/tokens/versions/latest/sass/_md-sys-color.scss). Surface roles and tones; `surface-tint` deprecated.
- [Compose Material 3 token sources](https://github.com/androidx/androidx/tree/androidx-main/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens): app bar, menu, dialog, snackbar, tooltip, sheet, drawer, text field, card and slider tokens.
- [Compose Material 3 release notes](https://developer.android.com/jetpack/androidx/releases/compose-material3). SurfaceContainer roles, 1.2.0-alpha03.
- [Primer primitives 11.10, light theme CSS](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/functional/themes/light.css) and [dark theme CSS](https://cdn.jsdelivr.net/npm/@primer/primitives/dist/css/functional/themes/dark.css)
- [Polaris tokens CSS](https://cdn.jsdelivr.net/npm/@shopify/polaris-tokens/dist/css/styles.css)
- [Spectrum tokens, `color-aliases.json`](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens/src/color-aliases.json) and [`color-palette.json`](https://cdn.jsdelivr.net/npm/@adobe/spectrum-tokens/src/color-palette.json); [Spectrum colour system](https://spectrum.adobe.com/page/color-system/)
- [Fluent `@fluentui/react-theme` light colours](https://cdn.jsdelivr.net/npm/@fluentui/react-theme/lib/alias/lightColor.js), [Card types](https://cdn.jsdelivr.net/npm/@fluentui/react-card/dist/index.d.ts), [Input types](https://cdn.jsdelivr.net/npm/@fluentui/react-input/dist/index.d.ts) and [Input appearance story](https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-input/stories/src/Input/InputAppearance.stories.tsx); [Fluent 2 elevation](https://fluent2.microsoft.design/elevation)
- [Radix Themes, colour](https://www.radix-ui.com/themes/docs/theme/color) and [tokens CSS](https://cdn.jsdelivr.net/npm/@radix-ui/themes/tokens.css)
- [Ant Design, customise theme](https://ant.design/docs/react/customize-theme) and [default colour derivation](https://cdn.jsdelivr.net/npm/antd/lib/theme/themes/default/colors.js)
- [GOV.UK Frontend, `_colours-functional.scss`](https://github.com/alphagov/govuk-frontend/blob/main/packages/govuk-frontend/src/govuk/settings/_colours-functional.scss)
- [Apple Human Interface Guidelines, Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) and [Color](https://developer.apple.com/design/human-interface-guidelines/color)
- [UIKit, `UINavigationBar.scrollEdgeAppearance`](https://developer.apple.com/documentation/uikit/uinavigationbar/scrolledgeappearance)

**Standards and tools**

- [WCAG 2.2 Understanding 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [Figma help, modes for variables](https://help.figma.com/hc/en-us/articles/15343816063383-Modes-for-variables). Auto mode inheritance.

**Toolkit knowledge base and sister pieces**

- `knowledge/ui/design/visual.md#surfaces-and-elevation-levels`, `#theming-and-dark-mode` and `#elevation-borders-radius-and-shape`. The four levels, dark values, scrim and input sinking.
- [Elevation and shadows](elevation-and-shadows.md), [surfaces in dark mode](surfaces-in-dark-mode.md), [materials and translucency](materials-and-translucency.md).

**Cited but not resolved to a URL**

- Carbon's `Layer` component reference in Storybook was not opened; its behaviour is cited from the colour usage page and the migration guides.
- Material Design blog, "Learn about tone-based surfaces in Material 3" (m3.material.io/blog/tone-based-surface-color-m3): renders only with JavaScript; not read.
